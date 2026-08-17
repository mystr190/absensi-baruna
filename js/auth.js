// ==========================================
// MANAJEMEN AUTENTIKASI & SESI
// ==========================================

const viewLogin = document.getElementById('view-login');
const viewApp = document.getElementById('view-app');
const formLogin = document.getElementById('formLogin');
const btnLogout = document.getElementById('btnLogout');
const connectionStatus = document.getElementById('connectionStatus');
const statusText = document.getElementById('statusText');

// ====================================================
// MANAJEMEN TRIAL LISENSI APLIKASI (EXPIRES 1 SEP 2026 07:00 WIB)
// ====================================================
const TRIAL_EXPIRY_TIMESTAMP = new Date('2026-09-30T07:00:00+07:00').getTime();
let trialTimerInterval = null;

function isTrialExpired() {
    return Date.now() >= TRIAL_EXPIRY_TIMESTAMP;
}

function updateTrialCountdownDisplay() {
    const now = Date.now();
    const diff = TRIAL_EXPIRY_TIMESTAMP - now;

    const bannerLogin = document.getElementById('trialCountdownBannerLogin');
    const timerLogin = document.getElementById('trialTimerLoginDisplay');
    const timerSidebar = document.getElementById('trialTimerSidebarDisplay');
    const btnLogin = document.getElementById('btnLogin');

    if (diff <= 0) {
        // MASA TRIAL HAS EXPIRED!
        if (bannerLogin) {
            bannerLogin.style.background = 'rgba(239, 68, 68, 0.18)';
            bannerLogin.style.borderColor = 'rgba(239, 68, 68, 0.5)';
            bannerLogin.innerHTML = `
                <div style="font-size: 0.85rem; color: #ef4444; font-weight: 800; text-transform: uppercase; margin-bottom: 4px; display: flex; align-items: center; justify-content: center; gap: 6px;">
                    <i class="fa-solid fa-lock"></i> MASA TRIAL GRATIS TELAH BERAKHIR
                </div>
                <div style="font-size: 0.78rem; color: #fca5a5; line-height: 1.4;">
                    Trial berakhir pada <strong>1 September 2026 pukul 07:00 WIB</strong>.<br>
                    Akses login dikunci. Silakan hubungi Administrator untuk berlangganan lisensi.
                </div>
            `;
        }
        if (timerSidebar) {
            timerSidebar.innerHTML = `<span style="color: #ef4444;"><i class="fa-solid fa-lock"></i> TRIAL EXPIRED</span>`;
        }

        if (btnLogin) {
            btnLogin.disabled = true;
            btnLogin.style.opacity = '0.5';
            btnLogin.style.cursor = 'not-allowed';
            const textSpan = btnLogin.querySelector('.btn-text');
            if (textSpan) textSpan.innerText = '🔒 Lisensi Trial Berakhir';
        }

        // Jika user masih di dalam aplikasi saat trial habis, paksa logout!
        const userSession = localStorage.getItem('smart_absen_user');
        if (userSession) {
            localStorage.removeItem('smart_absen_user');
            if (typeof showToast === 'function') {
                showToast('🔒 Masa trial aplikasi telah berakhir pada 1 September 2026 pukul 07:00 WIB.', 'error');
            }
            showLogin();
        }

        if (trialTimerInterval) {
            clearInterval(trialTimerInterval);
        }
        return true;
    }

    // Hitung sisa waktu
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = (n) => String(n).padStart(2, '0');
    const formattedStr = `${days}h ${pad(hours)}j ${pad(minutes)}m ${pad(seconds)}d`;

    if (timerLogin) {
        timerLogin.innerHTML = `
            <span id="tcDays" style="color:#fde047;">${days}</span>h 
            <span id="tcHours">${pad(hours)}</span>j 
            <span id="tcMinutes">${pad(minutes)}</span>m 
            <span id="tcSeconds" style="color:#38bdf8;">${pad(seconds)}</span>d
        `;
    }
    if (timerSidebar) {
        timerSidebar.innerText = formattedStr;
    }

    if (btnLogin && btnLogin.disabled && btnLogin.querySelector('.btn-text')?.innerText.includes('Lisensi')) {
        btnLogin.disabled = false;
        btnLogin.style.opacity = '1';
        btnLogin.style.cursor = 'pointer';
        btnLogin.querySelector('.btn-text').innerText = 'Masuk';
    }

    return false;
}

function startTrialTimer() {
    if (trialTimerInterval) clearInterval(trialTimerInterval);
    updateTrialCountdownDisplay();
    trialTimerInterval = setInterval(updateTrialCountdownDisplay, 1000);
}

// Cek Sesi & Inisialisasi Tema Saat Halaman Dimuat
window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    startTrialTimer();
    checkSession();
});

// ==========================================
// TEMA TAMPILAN (LIGHT MODE & DARK MODE)
// ==========================================
function initTheme() {
    const savedTheme = localStorage.getItem('smart_absen_theme') || 'dark';
    applyTheme(savedTheme, false);

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-theme-toggle');
        if (btn) {
            e.preventDefault();
            toggleTheme();
        }
    });
}

function applyTheme(theme, notify = false) {
    if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        document.body.classList.add('light-mode');
        updateThemeIcons(true);
    } else {
        document.documentElement.removeAttribute('data-theme');
        document.body.classList.remove('light-mode');
        updateThemeIcons(false);
    }
    localStorage.setItem('smart_absen_theme', theme);

    if (notify && typeof showToast === 'function') {
        showToast(theme === 'light' ? '☀️ Mode Terang (Light Mode) Aktif' : '🌙 Mode Gelap (Dark Mode) Aktif', 'info');
    }

    if (typeof loadLocalOverviewStats === 'function') {
        loadLocalOverviewStats();
    }
    if (typeof updateStatsAndChart === 'function' && typeof rawReportData !== 'undefined' && rawReportData.length > 0) {
        updateStatsAndChart(rawReportData);
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme, true);
}

function updateThemeIcons(isLight) {
    const icons = document.querySelectorAll('.theme-icon-toggle');
    icons.forEach(icon => {
        if (isLight) {
            icon.className = 'fa-solid fa-sun theme-icon-toggle';
            icon.style.color = '#f59e0b';
        } else {
            icon.className = 'fa-solid fa-moon theme-icon-toggle';
            icon.style.color = '#38bdf8';
        }
    });
}

function checkSession() {
    startTrialTimer();
    if (isTrialExpired()) {
        localStorage.removeItem('smart_absen_user');
        showLogin();
        return;
    }

    const userSession = localStorage.getItem('smart_absen_user');
    
    if (userSession) {
        // User sudah login
        const user = JSON.parse(userSession);
        showApp(user);
    } else {
        // Belum login
        showLogin();
    }
}

function showLogin() {
    viewLogin.classList.add('active');
    viewApp.classList.remove('active');
    viewApp.style.display = 'none';
    
    // Panggil verifikasi koneksi Google Sheets saat halaman login aktif
    checkDatabaseConnection();
    // Silent background preload data master akun agar login instan (0ms)
    preloadAuthDataCache();
}

let authPreloadPromise = null;
function preloadAuthDataCache() {
    if (authPreloadPromise) return authPreloadPromise;

    authPreloadPromise = (async () => {
        try {
            const preloadUrl = `${SCRIPT_URL}?action=get_auth_master`;
            const res = await fetch(preloadUrl);
            const json = await res.json();
            if (json && json.status === 'success' && json.data) {
                if (json.data.users && Array.isArray(json.data.users)) {
                    localStorage.setItem('smart_absen_users_cache', JSON.stringify(json.data.users));
                }
                if (json.data.students && Array.isArray(json.data.students)) {
                    localStorage.setItem('smart_absen_students_cache', JSON.stringify(json.data.students));
                }
            }
        } catch (err) {
            console.warn("Silent auth preload error:", err);
        }
    })();

    return authPreloadPromise;
}

// ----------------------------------------------------
// ----------------------------------------------------
// FUNGSI CEK STATUS KONEKSI GOOGLE SHEETS (INSTANT 0ms OPTIMISTIC UI)
// ----------------------------------------------------
async function checkDatabaseConnection() {
    if (!connectionStatus || !statusText) return;

    // TAMPILKAN LANGSUNG INSTAN 0-MILLISECOND (Pengguna tidak perlu menunggu loading!)
    connectionStatus.className = 'connection-status connected';
    statusText.innerText = 'Terhubung: Google Sheets';

    // Cegah ping berulang jika sudah terverifikasi dalam sesi ini
    if (sessionStorage.getItem('gas_connected') === 'true') return;
    sessionStorage.setItem('gas_connected', 'true');

    // Verifikasi hening di background dengan AbortController timeout 2 detik (tidak memblokir UI)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    try {
        const pingUrl = `${SCRIPT_URL}?action=ping`;
        const res = await fetch(pingUrl, { method: 'GET', signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
            connectionStatus.className = 'connection-status connected';
            statusText.innerText = 'Terhubung: Google Sheets';
        }
    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'TypeError') {
            connectionStatus.className = 'connection-status disconnected';
            statusText.innerText = 'Koneksi Terputus';
            sessionStorage.removeItem('gas_connected');
        }
    }
}

function showApp(user) {
    viewLogin.classList.remove('active');
    viewApp.classList.add('active');
    viewApp.style.display = 'flex';

    // Update UI Sidebar & Mobile Header dengan data User
    const currentNameElem = document.getElementById('currentUserName');
    const currentRoleElem = document.getElementById('currentUserRole');
    const roleText = (String(user.role).toLowerCase() === 'siswa' && user.kelas) ? `Siswa (${user.kelas})` : user.role;
    if (currentNameElem) currentNameElem.innerText = user.nama || user.username || 'User';
    if (currentRoleElem) currentRoleElem.innerText = roleText;

    const hasTg = Boolean(user.id_telegram && String(user.id_telegram).trim() !== '' && String(user.id_telegram).trim() !== '-');
    const mobileNameElem = document.getElementById('mobileCurrentUserName');
    const mobileRoleElem = document.getElementById('mobileCurrentUserRole');
    if (mobileNameElem) mobileNameElem.innerText = user.nama || user.username || 'User';
    if (mobileRoleElem) {
        if (hasTg) {
            mobileRoleElem.innerHTML = `${roleText} <i class="fa-solid fa-circle-check" style="color: #38bdf8; font-size: 0.72rem; margin-left: 2px;" title="Terverifikasi Telegram (${user.id_telegram})"></i>`;
        } else {
            mobileRoleElem.innerHTML = `${roleText} <i class="fa-solid fa-circle-xmark" style="color: #ef4444; font-size: 0.72rem; margin-left: 2px;" title="Belum Terhubung Telegram"></i>`;
        }
    }
    
    // Update Badge Verified / Unverified Telegram di Sidebar bawah profil
    const badgeTgSidebar = document.getElementById('currentUserTelegramBadge');
    if (badgeTgSidebar) {
        if (user.id_telegram && String(user.id_telegram).trim() !== '' && String(user.id_telegram).trim() !== '-') {
            badgeTgSidebar.innerHTML = `
                <span id="currentUserTelegramIdText" style="font-family: monospace; font-size: 0.85rem; font-weight: 600; color: #94a3b8;">${user.id_telegram}</span>
                <i class="fa-solid fa-circle-check" style="color: #22c55e; font-size: 0.95rem;" title="Terverifikasi Telegram"></i>
            `;
            badgeTgSidebar.style.display = 'flex';
        } else {
            badgeTgSidebar.innerHTML = `
                <span style="color: #f87171; font-weight: 500; font-size: 0.78rem;">Belum Terhubung</span>
                <i class="fa-solid fa-circle-xmark" style="color: #ef4444; font-size: 0.95rem;" title="Belum Terhubung Telegram"></i>
            `;
            badgeTgSidebar.style.display = 'flex';
        }
    }
    
    // Inject nama petugas ke panel
    const petugasElem = document.getElementById('petugasName');
    if (petugasElem) petugasElem.innerText = user.nama;

    // Atur Akses Menu Berdasarkan Role
    const navAdmin = document.getElementById('nav-admin');
    const navKelolaSiswa = document.getElementById('nav-kelola-siswa');
    const navBroadcastTelegram = document.getElementById('nav-broadcast-telegram');
    const navUserMesin = document.getElementById('nav-user-mesin');
    const navAbsenGuruAdmin = document.getElementById('nav-absen-guru-admin');
    const navApprovalKepsek = document.getElementById('nav-approval-kepsek');
    const navIzinGuru = document.getElementById('nav-izin-guru');
    const navIzinSiswa = document.getElementById('nav-izin-siswa');
    const navApprovalIzinSiswa = document.getElementById('nav-approval-izin-siswa');
    const navKokurikuler = document.getElementById('nav-kokurikuler');
    const navKelolaKokurikuler = document.getElementById('nav-kelola-kokurikuler');
    const navBimbelUtbk = document.getElementById('nav-bimbel-utbk');
    const navRaporTengahSemester = document.getElementById('navRaporTengahSemester');
    const navPerangkatPembelajaran = document.getElementById('navPerangkatPembelajaran');

    const navScan = document.querySelector('.sidebar-nav .nav-item[data-target="panel-scan"]');
    const navRekap = document.querySelector('.sidebar-nav .nav-item[data-target="panel-dashboard"]');
    const navMatrix = document.querySelector('.sidebar-nav .nav-item[data-target="panel-matrix-rekap"]');
    const navPelanggaran = document.querySelector('.sidebar-nav .nav-item[data-target="panel-pelanggaran"]');

    const btnManageJenis = document.getElementById('btnManageJenisPelanggaran');

    const uRole = String(user.role || '').trim().toLowerCase();
    const isTeacherAdminKepsek = uRole.includes('guru') || uRole.includes('walas') || uRole === 'admin' || uRole.includes('kepala sekolah') || uRole.includes('kepsek');

    // Reset visibilitas default
    if (navAdmin) navAdmin.style.display = 'none';
    if (navKelolaSiswa) navKelolaSiswa.style.display = 'none';
    if (navBroadcastTelegram) navBroadcastTelegram.style.display = 'none';
    if (navUserMesin) navUserMesin.style.display = 'none';
    if (navAbsenGuruAdmin) navAbsenGuruAdmin.style.display = 'none';
    if (navApprovalKepsek) navApprovalKepsek.style.display = 'none';
    if (navIzinGuru) navIzinGuru.style.display = 'flex';
    if (navIzinSiswa) navIzinSiswa.style.display = 'none';
    if (navApprovalIzinSiswa) navApprovalIzinSiswa.style.display = 'flex'; // Default for Guru
    if (navKokurikuler) navKokurikuler.style.display = 'flex'; // Visible for Guru & Admin
    if (navKelolaKokurikuler) navKelolaKokurikuler.style.display = 'none';
    if (navBimbelUtbk) navBimbelUtbk.style.display = 'flex'; // Visible for Guru, Kepsek, Admin
    if (navRaporTengahSemester) navRaporTengahSemester.style.display = isTeacherAdminKepsek ? 'flex' : 'none';
    if (navPerangkatPembelajaran) navPerangkatPembelajaran.style.display = isTeacherAdminKepsek ? 'flex' : 'none';

    if (navScan) navScan.style.display = 'flex';
    if (navRekap) navRekap.style.display = 'flex';
    if (navMatrix) navMatrix.style.display = 'flex';
    if (navPelanggaran) navPelanggaran.style.display = 'flex';
    if (btnManageJenis) btnManageJenis.style.display = 'none';

    if (uRole === 'admin') {
        if (navAdmin) navAdmin.style.display = 'flex';
        if (navKelolaSiswa) navKelolaSiswa.style.display = 'flex';
        if (navBroadcastTelegram) navBroadcastTelegram.style.display = 'flex';
        if (navUserMesin) navUserMesin.style.display = 'flex';
        if (navAbsenGuruAdmin) navAbsenGuruAdmin.style.display = 'flex';
        if (navApprovalKepsek) navApprovalKepsek.style.display = 'flex';
        if (navKelolaKokurikuler) navKelolaKokurikuler.style.display = 'flex';
        if (btnManageJenis) btnManageJenis.style.display = 'inline-flex';
        if (navIzinGuru) navIzinGuru.style.display = 'none';
        if (navIzinSiswa) navIzinSiswa.style.display = 'none';
        if (navApprovalIzinSiswa) navApprovalIzinSiswa.style.display = 'flex';
        if (navRaporTengahSemester) navRaporTengahSemester.style.display = 'flex';
    } else if (uRole.includes('kepala sekolah') || uRole.includes('kepsek')) {
        if (navApprovalKepsek) navApprovalKepsek.style.display = 'flex';
        if (navBroadcastTelegram) navBroadcastTelegram.style.display = 'flex';
        if (navUserMesin) navUserMesin.style.display = 'flex';
        if (navKelolaKokurikuler) navKelolaKokurikuler.style.display = 'flex';
        if (navIzinSiswa) navIzinSiswa.style.display = 'none';
        if (navApprovalIzinSiswa) navApprovalIzinSiswa.style.display = 'flex';
        if (navRaporTengahSemester) navRaporTengahSemester.style.display = 'flex';
    } else if (uRole === 'siswa') {
        if (navScan) navScan.style.display = 'none';
        if (navRekap) navRekap.style.display = 'none';
        if (navMatrix) navMatrix.style.display = 'none';
        if (navPelanggaran) navPelanggaran.style.display = 'none';
        if (navIzinGuru) navIzinGuru.style.display = 'none';
        if (navAdmin) navAdmin.style.display = 'none';
        if (navKelolaSiswa) navKelolaSiswa.style.display = 'none';
        if (navBroadcastTelegram) navBroadcastTelegram.style.display = 'none';
        if (navUserMesin) navUserMesin.style.display = 'none';
        if (navAbsenGuruAdmin) navAbsenGuruAdmin.style.display = 'none';
        if (navApprovalKepsek) navApprovalKepsek.style.display = 'none';
        if (navKokurikuler) navKokurikuler.style.display = 'none';
        if (navKelolaKokurikuler) navKelolaKokurikuler.style.display = 'none';
        if (navBimbelUtbk) navBimbelUtbk.style.display = 'none';
        if (navIzinSiswa) navIzinSiswa.style.display = 'flex';
        if (navApprovalIzinSiswa) navApprovalIzinSiswa.style.display = 'none';
        if (navRaporTengahSemester) navRaporTengahSemester.style.display = 'none';

        setTimeout(() => {
            const navOverview = document.getElementById('nav-overview') || document.querySelector('.sidebar-nav .nav-item[data-target="panel-overview"]');
            if (navOverview) navOverview.click();
        }, 100);
    } else if (uRole === 'tata usaha' || user.role === 'Tata Usaha') {
        if (navKelolaSiswa) navKelolaSiswa.style.display = 'flex';
        if (navBroadcastTelegram) navBroadcastTelegram.style.display = 'flex';
        if (navUserMesin) navUserMesin.style.display = 'flex';
        if (navScan) navScan.style.display = 'none';
        if (navRekap) navRekap.style.display = 'none';
        if (navMatrix) navMatrix.style.display = 'none';
        if (navPelanggaran) navPelanggaran.style.display = 'none';
        if (navRaporTengahSemester) navRaporTengahSemester.style.display = 'none';

        setTimeout(() => {
            if (navIzinGuru) navIzinGuru.click();
        }, 100);
    }

    // Immediately update Overview UI for current role
    if (typeof updateOverviewUI === 'function') updateOverviewUI(null);

    // Synchronize master data & load background modules with staggered delays to prevent server contention
    setTimeout(() => { if (typeof syncMasterDataInBackground === 'function') syncMasterDataInBackground(); }, 50);
    setTimeout(() => { if (typeof renderOverviewDashboard === 'function') renderOverviewDashboard(); }, 400);
    setTimeout(() => { if (typeof autoLoadStudents === 'function') autoLoadStudents(); }, 800);
    setTimeout(() => { if (typeof loadUsers === 'function') loadUsers(); }, 1200);
    setTimeout(() => { renderSelfProfilePanel(); }, 1600);
    setTimeout(() => { if (typeof syncAbsenGuruDataFromServer === 'function') syncAbsenGuruDataFromServer(); }, 2000);
    setTimeout(() => { if (typeof loadIzinSiswaData === 'function') loadIzinSiswaData(); }, 2400);
    setTimeout(() => { if (typeof updatePendingNotificationBadge === 'function') updatePendingNotificationBadge(); }, 2800);
}

// Handle Form Login
if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (isTrialExpired()) {
            if (typeof showToast === 'function') {
                showToast('🔒 Masa trial gratis telah berakhir pada 1 September 2026 pukul 07:00 WIB. Akses login dikunci!', 'error');
            }
            updateTrialCountdownDisplay();
            return;
        }
        
        const btn = document.getElementById('btnLogin');
        const text = btn ? btn.querySelector('.btn-text') : null;
        const loader = btn ? btn.querySelector('.loader') : null;
        
        if (btn) btn.disabled = true;
        if (text) text.style.display = 'none';
        if (loader) loader.style.display = 'inline-block';

        const userInputElem = document.getElementById('username') || formLogin.querySelector('input[type="text"]');
        const passInputElem = document.getElementById('password') || formLogin.querySelector('input[type="password"]');

        const usernameInput = userInputElem ? userInputElem.value.trim() : '';
        const passwordInput = passInputElem ? passInputElem.value.trim() : '';

        // Helper fungsi pencocokan credential lokal (Instant 0ms)
        const checkLocalCredential = () => {
            const uLower = usernameInput.toLowerCase();
            const pLower = passwordInput.toLowerCase();
            const uClean = uLower.replace(/^0+/, '');

            // Cek Master User Cache (Admin, Guru, TU, Kepsek)
            let localUsers = [];
            try { localUsers = JSON.parse(localStorage.getItem('smart_absen_users_cache') || '[]'); } catch(e) {}
            const matchedUser = localUsers.find(item => {
                const itemU = String(item.username || '').trim().toLowerCase();
                const itemP = String(item.password || '').trim();
                const itemPLower = itemP.toLowerCase();
                return (itemU === uLower || (uClean && itemU.replace(/^0+/, '') === uClean)) && (itemP === passwordInput || itemPLower === pLower);
            });

            if (matchedUser) {
                return {
                    ...matchedUser,
                    username: matchedUser.username || usernameInput,
                    nama: matchedUser.nama || matchedUser.username || usernameInput,
                    role: matchedUser.role || 'Guru',
                    id_mesin: matchedUser.id_mesin || '',
                    id_telegram: matchedUser.id_telegram || ''
                };
            }

            // Cek Master Siswa Cache
            let localStudents = [];
            try { 
                localStudents = JSON.parse(localStorage.getItem('smart_absen_students_cache') || '[]');
                if (localStudents.length === 0) {
                    localStudents = JSON.parse(localStorage.getItem('smart_absen_master_students') || '[]');
                }
            } catch(e) {}

            const matchedStudent = localStudents.find(s => {
                const nisLower = String(s.nis || '').trim().toLowerCase();
                const nisnLower = String(s.nisn || '').trim().toLowerCase();
                const nisClean = nisLower.replace(/^0+/, '');
                const nisnClean = nisnLower.replace(/^0+/, '');

                const savedPass = String(s.password || '').trim();
                const validPass = savedPass !== '' ? savedPass : (s.nis || s.nisn || '');
                const validPassLower = validPass.toLowerCase();

                const matchUser = (uLower === nisLower || uLower === nisnLower || (uClean && (uClean === nisClean || uClean === nisnClean)));
                const matchPass = (passwordInput === validPass || pLower === validPassLower || (s.nis && (pLower === nisLower || (uClean && pLower.replace(/^0+/, '') === nisClean))) || (s.nisn && (pLower === nisnLower || (uClean && pLower.replace(/^0+/, '') === nisnClean))));
                return matchUser && matchPass;
            });

            if (matchedStudent) {
                return {
                    username: matchedStudent.nis || matchedStudent.nisn || usernameInput,
                    role: 'Siswa',
                    nama: matchedStudent.nama,
                    nis: matchedStudent.nis,
                    nisn: matchedStudent.nisn,
                    kelas: matchedStudent.kelas,
                    gender: matchedStudent.gender,
                    id_mesin: matchedStudent.id_mesin || '',
                    id_telegram: matchedStudent.id_telegram || '',
                    wali_kelas: '-',
                    tugas_piket: '-'
                };
            }
            return null;
        };

        // 1. CEK INSTAN LOKAL CACHE FIRST (0ms LATENCY)!
        try {
            let userMatch = checkLocalCredential();

            if (userMatch) {
                localStorage.setItem('smart_absen_user', JSON.stringify(userMatch));
                showToast("⚡ Login Berhasil! Selamat datang " + userMatch.nama, 'success');
                formLogin.reset();
                showApp(userMatch);
                
                if (btn) btn.disabled = false;
                if (text) text.style.display = 'inline-block';
                if (loader) loader.style.display = 'none';
                return;
            }
        } catch(e) {
            console.warn("Local cache login check bypassed:", e);
        }

        // 2. LANGSUNG FETCH LOGIN KE SERVER TANPA MEMBLOKIR / MENUNGGU PRELOAD
        try {
            const loginUrl = `${SCRIPT_URL}?action=login&username=${encodeURIComponent(usernameInput)}&password=${encodeURIComponent(passwordInput)}`;
            const result = await fetchWithRetry(loginUrl, { method: 'GET' }, 2, 400);
            
            if (result && result.status === 'success' && result.data) {
                const userData = {
                    ...result.data,
                    username: result.data.username || usernameInput,
                    nama: result.data.nama || result.data.username || usernameInput,
                    role: result.data.role || 'User',
                    id_mesin: result.data.id_mesin || '',
                    id_telegram: result.data.id_telegram || ''
                };
                localStorage.setItem('smart_absen_user', JSON.stringify(userData));
                
                // Simpan ke local users cache agar login berikutnya 0ms instan!
                let localUsers = [];
                try { localUsers = JSON.parse(localStorage.getItem('smart_absen_users_cache') || '[]'); } catch(e){}
                if (!localUsers.some(u => String(u.username || '').toLowerCase() === String(userData.username || '').toLowerCase())) {
                    localUsers.push(userData);
                    localStorage.setItem('smart_absen_users_cache', JSON.stringify(localUsers));
                }

                showToast("✅ Login Berhasil! Selamat datang " + userData.nama, 'success');
                formLogin.reset();
                showApp(userData);
            } else {
                showToast("❌ " + (result ? result.message : 'Username atau Password salah'), 'error');
            }
        } catch (error) {
            console.error("Login Error:", error);
            showToast("❌ Gagal terhubung ke server. Periksa koneksi internet Anda.", 'error');
        } finally {
            if (btn) btn.disabled = false;
            if (text) text.style.display = 'inline-block';
            if (loader) loader.style.display = 'none';
        }
    });
}

// Handle Logout Function
function handleUserLogout() {
    localStorage.removeItem('smart_absen_user');
    showToast("Berhasil Logout.", 'info');
    showLogin();
}

if (typeof btnLogout !== 'undefined' && btnLogout) {
    btnLogout.addEventListener('click', handleUserLogout);
}
const btnMobileLogout = document.getElementById('btnMobileLogout');
if (btnMobileLogout) {
    btnMobileLogout.addEventListener('click', handleUserLogout);
}

// ==========================================
// FUNGSI NAVIGASI SIDEBAR (SPA ROUTING)
// ==========================================
const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
const panels = document.querySelectorAll('.main-content .panel, .main-content .panel-section');

navItems.forEach(nav => {
    nav.addEventListener('click', (e) => {
        if (nav.id === 'btnNavLogout') {
            handleUserLogout();
            return;
        }

        navItems.forEach(n => n.classList.remove('active'));
        panels.forEach(p => {
            p.classList.remove('active');
            p.style.display = 'none';
        });

        nav.classList.add('active');
        const targetPanel = document.getElementById(nav.dataset.target);
        if (targetPanel) {
            targetPanel.classList.add('active');
            targetPanel.style.display = 'block';
        }

        // Auto-center active tab on mobile bottom bar
        if (window.innerWidth <= 768) {
            try {
                nav.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            } catch(err) {}
        }

        if (nav.dataset.target === 'panel-overview') {
            if(typeof renderOverviewDashboard === 'function') renderOverviewDashboard();
        } else if (nav.dataset.target === 'panel-dashboard') {
            if(typeof loadDashboardData === 'function') loadDashboardData();
        } else if (nav.dataset.target === 'panel-admin') {
            if(typeof loadUsers === 'function') loadUsers();
        } else if (nav.dataset.target === 'panel-matrix-rekap') {
            if(typeof renderMatrixReport === 'function') renderMatrixReport();
        } else if (nav.dataset.target === 'panel-pelanggaran') {
            if(typeof renderPelanggaranPanel === 'function') renderPelanggaranPanel();
        } else if (nav.dataset.target === 'panel-izin-guru') {
            if(typeof renderIzinGuruPanel === 'function') renderIzinGuruPanel();
        } else if (nav.dataset.target === 'panel-approval-kepsek') {
            if(typeof syncAbsenGuruDataFromServer === 'function') syncAbsenGuruDataFromServer();
            else if(typeof renderApprovalKepsekPanel === 'function') renderApprovalKepsekPanel();
        } else if (nav.dataset.target === 'panel-approval-izin-siswa') {
            if(typeof loadIzinSiswaData === 'function') loadIzinSiswaData();
            if(typeof loadEduIzinData === 'function') loadEduIzinData();
        } else if (nav.dataset.target === 'panel-absen-guru-admin') {
            if(typeof renderAbsenGuruAdminPanel === 'function') renderAbsenGuruAdminPanel();
        } else if (nav.dataset.target === 'panel-kelola-siswa') {
            if(typeof renderTableSiswa === 'function') renderTableSiswa();
        } else if (nav.dataset.target === 'panel-broadcast-telegram') {
            if(typeof initBroadcastTelegramModule === 'function') initBroadcastTelegramModule();
        } else if (nav.dataset.target === 'panel-kokurikuler' || nav.dataset.target === 'panel-kelola-kokurikuler') {
            if(typeof fetchKokurikulerData === 'function') fetchKokurikulerData();
            else if(typeof loadKokurikulerData === 'function') loadKokurikulerData();
        } else if (nav.dataset.target === 'panel-bimbel-utbk') {
            if(typeof loadBimbelData === 'function') loadBimbelData();
        } else if (nav.dataset.target === 'panelRaporTengahSemester') {
            if(typeof setupRaporFilterOptions === 'function') setupRaporFilterOptions();
            if(typeof renderBatchRaporPrintPreview === 'function') renderBatchRaporPrintPreview();
        } else if (nav.dataset.target === 'panelPerangkatPembelajaran') {
            if(typeof loadDefaultTeacherData === 'function') loadDefaultTeacherData();
        } else if (nav.dataset.target === 'panel-profile') {
            renderSelfProfilePanel();
        }
    });
});

// ==========================================
// PENGATURAN PROFIL MANDIRI (GURU, TU, KEPSEK & ADMIN)
// ==========================================
async function renderSelfProfilePanel() {
    const userSession = localStorage.getItem('smart_absen_user');
    if (!userSession) return;
    const user = JSON.parse(userSession);

    const formElem = document.getElementById('formSelfProfile');
    const isUserTyping = formElem && formElem.contains(document.activeElement);

    const oldUsernameInput = document.getElementById('selfOldUsername');
    const usernameInput = document.getElementById('selfUsername');
    const namaInput = document.getElementById('selfNama');
    const roleInput = document.getElementById('selfRole');
    const idMesinInput = document.getElementById('selfIdMesin');
    const idTelegramInput = document.getElementById('selfIdTelegram');

    const uRole = String(user.role || '').trim().toLowerCase();
    const isSiswa = uRole === 'siswa';
    const isAdmin = uRole === 'admin';

    const adminSettingsBox = document.getElementById('adminOnlySettingsBox');
    if (adminSettingsBox) {
        adminSettingsBox.style.display = isAdmin ? 'block' : 'none';
    }

    if (!isUserTyping) {
        if (oldUsernameInput) oldUsernameInput.value = user.username || '';
        if (usernameInput) { usernameInput.value = user.username || ''; usernameInput.disabled = isSiswa; }
        if (namaInput) { namaInput.value = user.nama || ''; namaInput.disabled = isSiswa; }
        if (roleInput) { roleInput.value = user.role || ''; roleInput.disabled = isSiswa; }
        if (idMesinInput) { idMesinInput.value = user.id_mesin || ''; idMesinInput.disabled = isSiswa; }
        if (idTelegramInput) idTelegramInput.value = user.id_telegram || '';
    }

    updateTelegramBadgeUI(user.id_telegram);

    // Ambil data profil terbaru dari server (Live DB Sync di latar belakang)
    try {
        const getProfileUrl = `${SCRIPT_URL}?action=get_self_profile&username=${encodeURIComponent(user.username)}`;
        const res = await fetchWithRetry(getProfileUrl, { method: 'GET' }, 1, 500);

        if (res && res.status === 'success' && res.data) {
            const freshUser = res.data;
            localStorage.setItem('smart_absen_user', JSON.stringify(freshUser));
            
            // JANGAN timpa nilai jika pengguna sedang aktif mengetik di form!
            const isCurrentlyTyping = formElem && formElem.contains(document.activeElement);
            if (!isCurrentlyTyping) {
                if (oldUsernameInput) oldUsernameInput.value = freshUser.username || '';
                if (usernameInput) usernameInput.value = freshUser.username || '';
                if (namaInput) namaInput.value = freshUser.nama || '';
                if (roleInput) roleInput.value = freshUser.role || '';
                if (idMesinInput) idMesinInput.value = freshUser.id_mesin || '';
                if (idTelegramInput) idTelegramInput.value = freshUser.id_telegram || '';
            }

            updateTelegramBadgeUI(freshUser.id_telegram);
        }
    } catch (e) {
        console.log("Failed fetching fresh profile data:", e);
    }
}

function updateTelegramBadgeUI(idTelegram) {
    const boxTg = document.getElementById('profileTelegramStatusBox');
    const boxUnverified = document.getElementById('profileTelegramUnverifiedBox');
    const dispTg = document.getElementById('profileTelegramIdDisplay');

    const hasTg = Boolean(idTelegram && String(idTelegram).trim() !== '' && String(idTelegram).trim() !== '-');

    if (boxTg && dispTg && boxUnverified) {
        if (hasTg) {
            dispTg.innerText = idTelegram;
            boxTg.style.display = 'flex';
            boxUnverified.style.display = 'none';
        } else {
            boxTg.style.display = 'none';
            boxUnverified.style.display = 'flex';
        }
    }

    const mobileRoleElem = document.getElementById('mobileCurrentUserRole');
    if (mobileRoleElem) {
        let iconElem = mobileRoleElem.querySelector('i');
        if (!iconElem) {
            iconElem = document.createElement('i');
            mobileRoleElem.appendChild(iconElem);
        }
        if (hasTg) {
            iconElem.className = 'fa-solid fa-circle-check';
            iconElem.style.color = '#38bdf8';
            iconElem.style.fontSize = '0.72rem';
            iconElem.style.marginLeft = '2px';
            iconElem.title = `Terverifikasi Telegram (${idTelegram})`;
        } else {
            iconElem.className = 'fa-solid fa-circle-xmark';
            iconElem.style.color = '#ef4444';
            iconElem.style.fontSize = '0.72rem';
            iconElem.style.marginLeft = '2px';
            iconElem.title = 'Belum Terhubung Telegram';
        }
    }
}

const formSelfProfile = document.getElementById('formSelfProfile');
if (formSelfProfile) {
    formSelfProfile.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnSaveSelfProfile');
        const oldText = btn ? btn.innerHTML : '';

        const username = document.getElementById('selfUsername').value.trim();
        const oldUsername = document.getElementById('selfOldUsername').value.trim() || username;
        const nama = document.getElementById('selfNama').value.trim();
        const password = document.getElementById('selfPassword').value.trim();
        const id_mesin = document.getElementById('selfIdMesin').value.trim();
        const id_telegram = document.getElementById('selfIdTelegram').value.trim();

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan & Menyinkronkan...`;
        }

        try {
            const formData = new URLSearchParams();
            formData.append('action', 'update_self_profile');
            formData.append('old_username', oldUsername);
            formData.append('username', username);
            formData.append('password', password);
            formData.append('nama', nama);
            formData.append('id_mesin', id_mesin);
            formData.append('id_telegram', id_telegram);

            const res = await fetchWithRetry(SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString()
            });

            if (res && res.status === 'success' && res.data) {
                localStorage.setItem('smart_absen_user', JSON.stringify(res.data));
                showToast(res.message || "✅ Profil berhasil diperbarui!", 'success');
                showApp(res.data);
                document.getElementById('selfPassword').value = '';
            } else {
                showToast("❌ " + (res ? res.message : 'Gagal memperbarui profil'), 'error');
            }
        } catch (err) {
            console.error(err);
            showToast("❌ Terjadi kesalahan jaringan saat menyimpan profil.", 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = oldText;
            }
        }
    });
}

// ==========================================
// NOTIFIKASI COUNTER PENGAJUAN IZIN (PENDING ACC BADGE)
// ==========================================
// Helper to clean academic titles from name strings for flexible matching
function cleanNameTitleForBadge(str) {
    if (!str) return '';
    return String(str)
        .replace(/(drs|dr|s\.pd|m\.pd|s\.t|s\.kom|s\.ag|m\.si|s\.p|sp|h\.|hj\.|spd|mpd|st|skom|sag|msi)/gi, '')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function updatePendingNotificationBadge() {
    const userSession = localStorage.getItem('smart_absen_user');
    if (!userSession) return;
    let user;
    try { user = JSON.parse(userSession); } catch(e) { return; }

    const uRole = String(user.role || '').trim().toLowerCase();
    const uNameRaw = String(user.nama || user.namaLengkap || user.username || '').trim();
    const uNameClean = cleanNameTitleForBadge(uNameRaw);
    const uKelas = String(user.kelas || '').trim().toLowerCase();
    const tugasPiket = String(user.tugas_piket || user.piket || '').toLowerCase();
    const isPiket = uRole.includes('piket') || tugasPiket.includes('piket');
    const isAdminOrKepsek = uRole === 'admin' || user.role === 'Kepala Sekolah' || uRole.includes('kepsek') || uRole.includes('admin');

    let countTeacherPending = 0;
    let countStudentPending = 0;
    let countEduIzinPending = 0;

    // Helper function to test if status is pending/menunggu
    const isStatusPending = (statusStr) => {
        const st = String(statusStr || '').trim().toLowerCase();
        return st.includes('pending') || st.includes('menunggu');
    };

    // 1. Persetujuan Izin Guru & Staf (Admin & Kepsek)
    if (isAdminOrKepsek) {
        let rawTeacherIzin = [];
        if (typeof localPengajuanIzin !== 'undefined' && Array.isArray(localPengajuanIzin) && localPengajuanIzin.length > 0) {
            rawTeacherIzin = localPengajuanIzin;
        } else {
            try { rawTeacherIzin = JSON.parse(localStorage.getItem('smart_absen_pengajuan_izin') || '[]'); } catch(e){}
        }
        countTeacherPending = rawTeacherIzin.filter(i => isStatusPending(i.status)).length;
    }

    // 2. Persetujuan Izin Tidak Hadir Siswa (Wali Kelas, Admin, Kepsek, Guru Piket)
    let rawStudentIzin = [];
    if (typeof globalIzinSiswaLogs !== 'undefined' && Array.isArray(globalIzinSiswaLogs) && globalIzinSiswaLogs.length > 0) {
        rawStudentIzin = globalIzinSiswaLogs;
    } else {
        try { rawStudentIzin = JSON.parse(localStorage.getItem('smart_absen_izin_siswa_cache') || '[]'); } catch(e){}
    }

    if (isAdminOrKepsek) {
        countStudentPending = rawStudentIzin.filter(i => isStatusPending(i.status)).length;
    } else if (uRole.includes('guru') || uRole.includes('walas') || isPiket) {
        countStudentPending = rawStudentIzin.filter(i => {
            if (!isStatusPending(i.status)) return false;
            
            const walasNameRaw = String(i.waliKelas || i.walas || '').trim();
            const walasNameClean = cleanNameTitleForBadge(walasNameRaw);
            const logKelas = String(i.kelas || '').trim().toLowerCase();

            if (isPiket) return true;
            if (uNameClean && walasNameClean && (walasNameClean === uNameClean || walasNameClean.includes(uNameClean) || uNameClean.includes(walasNameClean))) return true;
            if (uKelas && logKelas && logKelas === uKelas) return true;
            return false;
        }).length;
    }

    // 3. Persetujuan EduIzin KBM Siswa (Guru Pengajar, Piket, Admin, Kepsek)
    let rawEduIzin = [];
    if (typeof globalEduIzinList !== 'undefined' && Array.isArray(globalEduIzinList) && globalEduIzinList.length > 0) {
        rawEduIzin = globalEduIzinList;
    } else {
        try { rawEduIzin = JSON.parse(localStorage.getItem('smart_absen_edu_izin_cache') || '[]'); } catch(e){}
    }

    rawEduIzin.forEach(item => {
        const stGuru = String(item.status_guru || item.statusGuru || '').trim();
        const stPiket = String(item.status_piket || item.statusPiket || '').trim();
        const iGuruRaw = String(item.guru || '').trim();
        const iGuruClean = cleanNameTitleForBadge(iGuruRaw);

        if (isAdminOrKepsek) {
            if (isStatusPending(stGuru) || isStatusPending(stPiket)) {
                countEduIzinPending++;
            }
        } else {
            if (uNameClean && iGuruClean && (iGuruClean === uNameClean || uNameClean.includes(iGuruClean) || iGuruClean.includes(uNameClean)) && isStatusPending(stGuru)) {
                countEduIzinPending++;
            } else if (isPiket && isStatusPending(stPiket)) {
                countEduIzinPending++;
            }
        }
    });

    const totalPending = countTeacherPending + countStudentPending + countEduIzinPending;

    // Update Badge UI (Desktop & Mobile)
    const badgeCountElems = document.querySelectorAll('.notification-badge-count, #notificationBadgeCount');
    badgeCountElems.forEach(badge => {
        if (totalPending > 0) {
            badge.innerText = totalPending > 99 ? '99+' : totalPending;
            badge.style.display = 'inline-block';
        } else {
            badge.innerText = '0';
            badge.style.display = 'none';
        }
    });
}

// Background Sync to pull fresh data from server for accurate badge counter
async function syncNotificationBadgeDataFromBackend() {
    const userSession = localStorage.getItem('smart_absen_user');
    if (!userSession || typeof SCRIPT_URL === 'undefined' || !SCRIPT_URL) return;

    try {
        const [resIzinGuru, resIzinSiswa, resEduIzin] = await Promise.all([
            fetch(`${SCRIPT_URL}?action=get_pengajuan_izin&_t=${Date.now()}`).then(r => r.json()).catch(() => null),
            fetch(`${SCRIPT_URL}?action=get_izin_siswa&_t=${Date.now()}`).then(r => r.json()).catch(() => null),
            fetch(`${SCRIPT_URL}?action=get_edu_izin&_t=${Date.now()}`).then(r => r.json()).catch(() => null)
        ]);

        if (resIzinGuru && resIzinGuru.status === 'success' && Array.isArray(resIzinGuru.data)) {
            if (typeof localPengajuanIzin !== 'undefined') localPengajuanIzin = resIzinGuru.data;
            try { localStorage.setItem('smart_absen_pengajuan_izin', JSON.stringify(resIzinGuru.data)); } catch(e){}
        }

        if (resIzinSiswa && resIzinSiswa.status === 'success' && Array.isArray(resIzinSiswa.data)) {
            if (typeof globalIzinSiswaLogs !== 'undefined') globalIzinSiswaLogs = resIzinSiswa.data;
            try { localStorage.setItem('smart_absen_izin_siswa_cache', JSON.stringify(resIzinSiswa.data)); } catch(e){}
        }

        if (resEduIzin && resEduIzin.status === 'success' && Array.isArray(resEduIzin.data)) {
            if (typeof globalEduIzinList !== 'undefined') globalEduIzinList = resEduIzin.data;
            try { localStorage.setItem('smart_absen_edu_izin_cache', JSON.stringify(resEduIzin.data)); } catch(e){}
        }

        updatePendingNotificationBadge();
    } catch (e) {
        console.warn("Background notification badge sync skipped:", e);
    }
}

// Global Click Event for Notification Bell
document.addEventListener('click', (e) => {
    const bellBtn = e.target.closest('#notificationBellWrapper, .notification-bell-btn, #mobileNotificationBellWrapper');
    if (bellBtn) {
        e.preventDefault();
        const userSession = localStorage.getItem('smart_absen_user');
        if (!userSession) return;
        let user;
        try { user = JSON.parse(userSession); } catch(err) { return; }
        const uRole = String(user.role || '').trim().toLowerCase();

        if (uRole.includes('kepala sekolah') || uRole.includes('kepsek')) {
            const navKepsek = document.getElementById('nav-approval-kepsek');
            if (navKepsek && navKepsek.style.display !== 'none') {
                navKepsek.click();
                return;
            }
        }
        
        const navApproval = document.getElementById('nav-approval-izin-siswa');
        if (navApproval && navApproval.style.display !== 'none') {
            navApproval.click();
        } else {
            const navIzinGuru = document.getElementById('nav-izin-guru');
            if (navIzinGuru && navIzinGuru.style.display !== 'none') navIzinGuru.click();
        }
    }
});

// Initial update on page load & periodic background sync (every 20s)
document.addEventListener('DOMContentLoaded', () => {
    updatePendingNotificationBadge();
    setTimeout(syncNotificationBadgeDataFromBackend, 1000);
});

setInterval(updatePendingNotificationBadge, 5000);
setInterval(syncNotificationBadgeDataFromBackend, 20000);
