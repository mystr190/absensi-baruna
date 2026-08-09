// ==========================================
// MANAJEMEN AUTENTIKASI & SESI
// ==========================================

const viewLogin = document.getElementById('view-login');
const viewApp = document.getElementById('view-app');
const formLogin = document.getElementById('formLogin');
const btnLogout = document.getElementById('btnLogout');
const connectionStatus = document.getElementById('connectionStatus');
const statusText = document.getElementById('statusText');

// Cek Sesi & Inisialisasi Tema Saat Halaman Dimuat
window.addEventListener('DOMContentLoaded', () => {
    initTheme();
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
        // Hanya jika koneksi benar-benar mati/putus total, ubah ke status disconnected
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

    const mobileNameElem = document.getElementById('mobileCurrentUserName');
    const mobileRoleElem = document.getElementById('mobileCurrentUserRole');
    if (mobileNameElem) mobileNameElem.innerText = user.nama || user.username || 'User';
    if (mobileRoleElem) mobileRoleElem.innerText = roleText;
    
    // Update Badge Verified / Unverified Telegram di Sidebar bawah profil
    const badgeTgSidebar = document.getElementById('currentUserTelegramBadge');
    if (badgeTgSidebar) {
        const bellHtml = `
            <div id="notificationBellWrapper" class="notification-bell-btn" style="position: relative; display: inline-flex; align-items: center; cursor: pointer; margin-left: 8px;" title="Pengajuan Izin Perlu ACC (Klik untuk buka)">
                <i class="fa-solid fa-bell" style="color: #f59e0b; font-size: 1.05rem;"></i>
                <span id="notificationBadgeCount" class="notification-badge-count" style="position: absolute; top: -7px; right: -9px; background: #ef4444; color: #ffffff; font-size: 0.65rem; font-weight: 800; border-radius: 999px; padding: 1px 5px; min-width: 16px; text-align: center; border: 1.5px solid #1e293b; box-shadow: 0 2px 6px rgba(239, 68, 68, 0.5); display: none;">0</span>
            </div>
        `;
        if (user.id_telegram && String(user.id_telegram).trim() !== '' && String(user.id_telegram).trim() !== '-') {
            badgeTgSidebar.innerHTML = `
                <span id="currentUserTelegramIdText" style="font-family: monospace; font-size: 0.85rem; font-weight: 600; color: #94a3b8;">${user.id_telegram}</span>
                <i class="fa-solid fa-circle-check" style="color: #22c55e; font-size: 0.95rem;" title="Terverifikasi Telegram"></i>
                ${bellHtml}
            `;
            badgeTgSidebar.style.display = 'flex';
        } else {
            badgeTgSidebar.innerHTML = `
                <span style="color: #f87171; font-weight: 500; font-size: 0.78rem;">Belum Terhubung</span>
                <i class="fa-solid fa-circle-xmark" style="color: #ef4444; font-size: 0.95rem;" title="Belum Terhubung Telegram"></i>
                ${bellHtml}
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

    const navScan = document.querySelector('.sidebar-nav .nav-item[data-target="panel-scan"]');
    const navRekap = document.querySelector('.sidebar-nav .nav-item[data-target="panel-dashboard"]');
    const navMatrix = document.querySelector('.sidebar-nav .nav-item[data-target="panel-matrix-rekap"]');
    const navPelanggaran = document.querySelector('.sidebar-nav .nav-item[data-target="panel-pelanggaran"]');

    const btnManageJenis = document.getElementById('btnManageJenisPelanggaran');

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

    if (navScan) navScan.style.display = 'flex';
    if (navRekap) navRekap.style.display = 'flex';
    if (navMatrix) navMatrix.style.display = 'flex';
    if (navPelanggaran) navPelanggaran.style.display = 'flex';
    if (btnManageJenis) btnManageJenis.style.display = 'none';

    const uRole = String(user.role || '').trim().toLowerCase();
    if (uRole === 'admin') {
        if (navAdmin) navAdmin.style.display = 'flex';
        if (navKelolaSiswa) navKelolaSiswa.style.display = 'flex';
        if (navBroadcastTelegram) navBroadcastTelegram.style.display = 'flex';
        if (navUserMesin) navUserMesin.style.display = 'flex';
        if (navAbsenGuruAdmin) navAbsenGuruAdmin.style.display = 'flex';
        if (navApprovalKepsek) navApprovalKepsek.style.display = 'flex';
        if (btnManageJenis) btnManageJenis.style.display = 'inline-flex';
        if (navIzinGuru) navIzinGuru.style.display = 'none';
        if (navIzinSiswa) navIzinSiswa.style.display = 'none';
        if (navApprovalIzinSiswa) navApprovalIzinSiswa.style.display = 'flex';
    } else if (user.role === 'Kepala Sekolah') {
        if (navApprovalKepsek) navApprovalKepsek.style.display = 'flex';
        if (navBroadcastTelegram) navBroadcastTelegram.style.display = 'flex';
        if (navUserMesin) navUserMesin.style.display = 'flex';
        if (navIzinSiswa) navIzinSiswa.style.display = 'none';
        if (navApprovalIzinSiswa) navApprovalIzinSiswa.style.display = 'flex';
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
        if (navIzinSiswa) navIzinSiswa.style.display = 'flex';
        if (navApprovalIzinSiswa) navApprovalIzinSiswa.style.display = 'none';

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

        setTimeout(() => {
            if (navIzinGuru) navIzinGuru.click();
        }, 100);
    }

    // Immediately update Overview UI for current role
    if (typeof updateOverviewUI === 'function') updateOverviewUI(null);

    // Panggil sync master data di latar belakang & auto load jika kelas sudah terisi
    if (typeof syncMasterDataInBackground === 'function') syncMasterDataInBackground();
    if (typeof renderOverviewDashboard === 'function') renderOverviewDashboard();
    if (typeof autoLoadStudents === 'function') autoLoadStudents();
    if (typeof loadUsers === 'function') loadUsers();
    if (typeof renderIzinGuruPanel === 'function') renderIzinGuruPanel();
    if (typeof renderAbsenGuruAdminPanel === 'function') renderAbsenGuruAdminPanel();
    renderSelfProfilePanel();
    if (typeof updatePendingNotificationBadge === 'function') updatePendingNotificationBadge();
}

// Handle Form Login
if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        
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

        try {
            const loginUrl = `${SCRIPT_URL}?action=login&username=${encodeURIComponent(usernameInput)}&password=${encodeURIComponent(passwordInput)}`;
            const result = await fetchWithRetry(loginUrl, { method: 'GET' }, 2, 500);
            
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
                
                showToast("✅ Login Berhasil! Selamat datang " + userData.nama, 'success');
                formLogin.reset();
                showApp(userData);
            } else {
                showToast("❌ " + (result ? result.message : 'Username atau Password salah'), 'error');
            }
        } catch (error) {
            console.error("Login Error:", error);
            showToast("❌ Gagal terhubung ke server (Timeout). Pastikan Anda telah melakukan Deploy Baru di Google Apps Script.", 'error');
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
const panels = document.querySelectorAll('.main-content .panel');

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
            if(typeof renderApprovalKepsekPanel === 'function') renderApprovalKepsekPanel();
        } else if (nav.dataset.target === 'panel-absen-guru-admin') {
            if(typeof renderAbsenGuruAdminPanel === 'function') renderAbsenGuruAdminPanel();
        } else if (nav.dataset.target === 'panel-kelola-siswa') {
            if(typeof renderTableSiswa === 'function') renderTableSiswa();
        } else if (nav.dataset.target === 'panel-broadcast-telegram') {
            if(typeof initBroadcastTelegramModule === 'function') initBroadcastTelegramModule();
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

    const hasTg = idTelegram && String(idTelegram).trim() !== '' && String(idTelegram).trim() !== '-';

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
function updatePendingNotificationBadge() {
    const userSession = localStorage.getItem('smart_absen_user');
    if (!userSession) return;
    let user;
    try { user = JSON.parse(userSession); } catch(e) { return; }

    const uRole = String(user.role || '').trim().toLowerCase();
    const uName = String(user.nama || user.namaLengkap || user.username || '').trim().toLowerCase();
    const uKelas = String(user.kelas || '').trim().toLowerCase();
    const tugasPiket = String(user.tugas_piket || user.piket || '').toLowerCase();
    const isPiket = uRole.includes('piket') || tugasPiket.includes('piket') || uRole.includes('guru') || uRole.includes('admin');

    let countTeacherPending = 0;
    let countStudentPending = 0;
    let countEduIzinPending = 0;

    // 1. Persetujuan Izin Guru (Untuk Admin & Kepala Sekolah)
    if (uRole === 'admin' || user.role === 'Kepala Sekolah' || uRole.includes('kepsek')) {
        let rawTeacherIzin = [];
        if (typeof localPengajuanIzin !== 'undefined' && Array.isArray(localPengajuanIzin) && localPengajuanIzin.length > 0) {
            rawTeacherIzin = localPengajuanIzin;
        } else {
            try { rawTeacherIzin = JSON.parse(localStorage.getItem('smart_absen_pengajuan_izin') || '[]'); } catch(e){}
        }
        countTeacherPending = rawTeacherIzin.filter(i => {
            const st = String(i.status || '').trim().toLowerCase();
            return st === 'pending' || st === 'menunggu persetujuan';
        }).length;
    }

    // 2. Persetujuan Izin Tidak Hadir Siswa (Wali Kelas, Admin, Kepsek)
    let rawStudentIzin = [];
    if (typeof globalIzinSiswaLogs !== 'undefined' && Array.isArray(globalIzinSiswaLogs) && globalIzinSiswaLogs.length > 0) {
        rawStudentIzin = globalIzinSiswaLogs;
    } else {
        try { rawStudentIzin = JSON.parse(localStorage.getItem('smart_absen_izin_siswa_cache') || '[]'); } catch(e){}
    }

    if (uRole === 'admin' || user.role === 'Kepala Sekolah' || uRole.includes('kepsek')) {
        countStudentPending = rawStudentIzin.filter(i => {
            const st = String(i.status || '').trim().toLowerCase();
            return st === 'pending' || st === 'menunggu persetujuan';
        }).length;
    } else if (uRole.includes('guru') || uRole.includes('walas')) {
        countStudentPending = rawStudentIzin.filter(i => {
            const st = String(i.status || '').trim().toLowerCase();
            if (st !== 'pending' && st !== 'menunggu persetujuan') return false;
            
            const walasName = String(i.waliKelas || '').trim().toLowerCase();
            const logKelas = String(i.kelas || '').trim().toLowerCase();
            if (uName && walasName && (walasName === uName || walasName.includes(uName) || uName.includes(walasName))) return true;
            if (uKelas && logKelas && logKelas === uKelas) return true;
            return false;
        }).length;
    }

    // 3. Persetujuan EduIzin KBM Siswa (Guru Pengajar & Piket)
    let rawEduIzin = [];
    if (typeof globalEduIzinList !== 'undefined' && Array.isArray(globalEduIzinList) && globalEduIzinList.length > 0) {
        rawEduIzin = globalEduIzinList;
    } else {
        try { rawEduIzin = JSON.parse(localStorage.getItem('smart_absen_edu_izin_cache') || '[]'); } catch(e){}
    }

    rawEduIzin.forEach(item => {
        const stGuru = String(item.status_guru || item.statusGuru || '').trim().toLowerCase();
        const stPiket = String(item.status_piket || item.statusPiket || '').trim().toLowerCase();
        const iGuru = String(item.guru || '').trim().toLowerCase();
        const iPiket = String(item.piket || '').trim().toLowerCase();

        // Check if assigned guru
        if (uName && iGuru && (iGuru === uName || uName.includes(iGuru) || iGuru.includes(uName)) && stGuru === 'pending') {
            countEduIzinPending++;
        }
        // Check if piket queue
        else if (isPiket && stPiket === 'pending' && (!iPiket || iPiket === uName || isPiket)) {
            countEduIzinPending++;
        }
    });

    const totalPending = countTeacherPending + countStudentPending + countEduIzinPending;

    // Update Badge UI
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

// Global Click Event for Notification Bell
document.addEventListener('click', (e) => {
    const bellBtn = e.target.closest('#notificationBellWrapper, .notification-bell-btn');
    if (bellBtn) {
        e.preventDefault();
        const userSession = localStorage.getItem('smart_absen_user');
        if (!userSession) return;
        let user;
        try { user = JSON.parse(userSession); } catch(err) { return; }
        const uRole = String(user.role || '').trim().toLowerCase();

        if (user.role === 'Kepala Sekolah' || uRole.includes('kepsek')) {
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

// Periodic background counter refresh (Every 15s)
setInterval(updatePendingNotificationBadge, 15000);
