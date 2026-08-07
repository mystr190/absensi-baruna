// ==========================================
// MANAJEMEN AUTENTIKASI & SESI
// ==========================================

const viewLogin = document.getElementById('view-login');
const viewApp = document.getElementById('view-app');
const formLogin = document.getElementById('formLogin');
const btnLogout = document.getElementById('btnLogout');
const connectionStatus = document.getElementById('connectionStatus');
const statusText = document.getElementById('statusText');

// Cek Sesi Saat Halaman Dimuat
window.addEventListener('DOMContentLoaded', () => {
    checkSession();
});

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

    // Update UI Sidebar dengan data User
    document.getElementById('currentUserName').innerText = user.nama;
    document.getElementById('currentUserRole').innerText = user.role;
    
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

    if (navScan) navScan.style.display = 'flex';
    if (navRekap) navRekap.style.display = 'flex';
    if (navMatrix) navMatrix.style.display = 'flex';
    if (navPelanggaran) navPelanggaran.style.display = 'flex';
    if (btnManageJenis) btnManageJenis.style.display = 'none';

    if (user.role === 'Admin') {
        if (navAdmin) navAdmin.style.display = 'flex';
        if (navKelolaSiswa) navKelolaSiswa.style.display = 'flex';
        if (navBroadcastTelegram) navBroadcastTelegram.style.display = 'flex';
        if (navUserMesin) navUserMesin.style.display = 'flex';
        if (navAbsenGuruAdmin) navAbsenGuruAdmin.style.display = 'flex';
        if (navApprovalKepsek) navApprovalKepsek.style.display = 'flex';
        if (btnManageJenis) btnManageJenis.style.display = 'inline-flex';
    } else if (user.role === 'Kepala Sekolah') {
        if (navApprovalKepsek) navApprovalKepsek.style.display = 'flex';
        if (navBroadcastTelegram) navBroadcastTelegram.style.display = 'flex';
        if (navUserMesin) navUserMesin.style.display = 'flex';
    } else if (user.role === 'Tata Usaha') {
        if (navKelolaSiswa) navKelolaSiswa.style.display = 'flex';
        if (navBroadcastTelegram) navBroadcastTelegram.style.display = 'flex';
        if (navUserMesin) navUserMesin.style.display = 'flex';
        // Role Tata Usaha memiliki akses ke Izin Guru dan Kelola Data Siswa
        if (navScan) navScan.style.display = 'none';
        if (navRekap) navRekap.style.display = 'none';
        if (navMatrix) navMatrix.style.display = 'none';
        if (navPelanggaran) navPelanggaran.style.display = 'none';

        setTimeout(() => {
            if (navIzinGuru) navIzinGuru.click();
        }, 100);
    }

    // Panggil sync master data di latar belakang & auto load jika kelas sudah terisi
    if (typeof syncMasterDataInBackground === 'function') syncMasterDataInBackground();
    if (typeof autoLoadStudents === 'function') autoLoadStudents();
    if (typeof loadUsers === 'function') loadUsers();
    if (typeof renderIzinGuruPanel === 'function') renderIzinGuruPanel();
    if (typeof renderAbsenGuruAdminPanel === 'function') renderAbsenGuruAdminPanel();
    renderSelfProfilePanel();
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
                    username: result.data.username,
                    nama: result.data.nama,
                    role: result.data.role,
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
            showToast("❌ Gagal terhubung ke server. Periksa koneksi internet Anda.", 'error');
        } finally {
            if (btn) btn.disabled = false;
            if (text) text.style.display = 'inline-block';
            if (loader) loader.style.display = 'none';
        }
    });
}

// Handle Logout
btnLogout.addEventListener('click', () => {
    localStorage.removeItem('smart_absen_user');
    showToast("Berhasil Logout.", 'info');
    showLogin();
});

// ==========================================
// FUNGSI NAVIGASI SIDEBAR (SPA ROUTING)
// ==========================================
const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
const panels = document.querySelectorAll('.main-content .panel');

navItems.forEach(nav => {
    nav.addEventListener('click', () => {
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

        if (nav.dataset.target === 'panel-dashboard') {
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

    const oldUsernameInput = document.getElementById('selfOldUsername');
    const usernameInput = document.getElementById('selfUsername');
    const namaInput = document.getElementById('selfNama');
    const roleInput = document.getElementById('selfRole');
    const idMesinInput = document.getElementById('selfIdMesin');
    const idTelegramInput = document.getElementById('selfIdTelegram');

    if (oldUsernameInput) oldUsernameInput.value = user.username || '';
    if (usernameInput) usernameInput.value = user.username || '';
    if (namaInput) namaInput.value = user.nama || '';
    if (roleInput) roleInput.value = user.role || '';
    if (idMesinInput) idMesinInput.value = user.id_mesin || '';
    if (idTelegramInput) idTelegramInput.value = user.id_telegram || '';

    updateTelegramBadgeUI(user.id_telegram);

    // Ambil data profil terbaru dari server (Live DB Sync)
    try {
        const getProfileUrl = `${SCRIPT_URL}?action=get_self_profile&username=${encodeURIComponent(user.username)}`;
        const res = await fetchWithRetry(getProfileUrl, { method: 'GET' }, 1, 500);

        if (res && res.status === 'success' && res.data) {
            const freshUser = res.data;
            localStorage.setItem('smart_absen_user', JSON.stringify(freshUser));
            
            if (idMesinInput) idMesinInput.value = freshUser.id_mesin || '';
            if (idTelegramInput) idTelegramInput.value = freshUser.id_telegram || '';
            if (namaInput) namaInput.value = freshUser.nama || '';

            updateTelegramBadgeUI(freshUser.id_telegram);
            showApp(freshUser);
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
