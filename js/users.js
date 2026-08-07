// ==========================================
// MANAJEMEN USER / GURU (CRUD LOGIC)
// ==========================================

let userListState = [];

const tableBodyUsers = document.getElementById('tableBodyUsers');
const btnTambahUser = document.getElementById('btnTambahUser');

const modalUser = document.getElementById('modalUser');
const modalUserTitle = document.getElementById('modalUserTitle');
const formUserModal = document.getElementById('formUserModal');

const btnCloseModalUser = document.getElementById('btnCloseModalUser');
const btnCancelModalUser = document.getElementById('btnCancelModalUser');

const modalOldUsername = document.getElementById('modalOldUsername');
const modalUsername = document.getElementById('modalUsername');
const modalIdMesin = document.getElementById('modalIdMesin');
const modalIdTelegram = document.getElementById('modalIdTelegram');
const modalPassword = document.getElementById('modalPassword');
const modalNama = document.getElementById('modalNama');
const modalRole = document.getElementById('modalRole');

// Handle Tombol Buka Modal Tambah
if (btnTambahUser) {
    btnTambahUser.addEventListener('click', () => {
        openUserModal();
    });
}

// Handle Close Modal
if (btnCloseModalUser) btnCloseModalUser.addEventListener('click', closeUserModal);
if (btnCancelModalUser) btnCancelModalUser.addEventListener('click', closeUserModal);

function openUserModal(user = null) {
    if (!modalUser) return;
    
    if (user) {
        if (modalUserTitle) modalUserTitle.innerText = "Edit Data Pengguna / Guru";
        if (modalOldUsername) modalOldUsername.value = user.username;
        if (modalUsername) modalUsername.value = user.username;
        if (modalIdMesin) modalIdMesin.value = user.id_mesin || '';
        if (modalIdTelegram) modalIdTelegram.value = user.id_telegram || '';
        if (modalPassword) modalPassword.value = ''; // Kosongkan password saat edit
        if (modalNama) modalNama.value = user.nama;
        if (modalRole) modalRole.value = user.role || 'Guru';
    } else {
        if (modalUserTitle) modalUserTitle.innerText = "Tambah Pengguna Baru";
        if (modalOldUsername) modalOldUsername.value = '';
        if (modalUsername) modalUsername.value = '';
        if (modalIdMesin) modalIdMesin.value = '';
        if (modalIdTelegram) modalIdTelegram.value = '';
        if (modalPassword) modalPassword.value = '';
        if (modalNama) modalNama.value = '';
        if (modalRole) modalRole.value = 'Guru';
    }

    modalUser.style.display = 'flex';
}

function closeUserModal() {
    if (modalUser) modalUser.style.display = 'none';
}

// FUNGSI LOAD DAFTAR USER DARI SERVER
async function loadUsers() {
    const tableBody = document.getElementById('tableBodyUsers');
    if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 25px;"><span class="loader" style="display:inline-block; border-color:var(--primary); border-bottom-color:transparent; margin-right:8px;"></span>Memuat daftar pengguna...</td></tr>`;
    }

    try {
        const result = await fetchWithRetry(`${SCRIPT_URL}?action=get_users`, { method: 'GET' }, 2, 800);
        if (result && result.status === 'success') {
            userListState = result.data || [];
            window.allTeachers = userListState.map(u => ({ username: u.username, namaLengkap: u.nama, role: u.role, id_mesin: u.id_mesin, id_telegram: u.id_telegram }));
            localStorage.setItem('smart_absen_users_cache', JSON.stringify(window.allTeachers));
            if (tableBody) renderUserTable(userListState);
            if (typeof renderAbsenGuruBatchTable === 'function') {
                renderAbsenGuruBatchTable();
            }
        } else {
            if (tableBody) tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red;">Gagal memuat pengguna: ${result ? result.message : 'Error'}</td></tr>`;
        }
    } catch (err) {
        console.error("Load users error:", err);
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red;">Koneksi error saat memuat pengguna.</td></tr>`;
    }
}

function renderUserTable(users) {
    const tableBody = document.getElementById('tableBodyUsers');
    if (!tableBody) return;

    if (!users || users.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px; color: var(--text-muted);">Belum ada data pengguna.</td></tr>`;
        return;
    }

    let html = '';
    users.forEach((u, index) => {
        const isSelf = (JSON.parse(localStorage.getItem('smart_absen_user') || '{}').username === u.username);
        const roleBadge = u.role === 'Admin' ? 'background: #ef4444; color: white;' : 'background: #3b82f6; color: white;';
        const idMesinDisplay = u.id_mesin 
            ? `<span class="badge" style="background: rgba(59, 130, 246, 0.15); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.3); font-family: monospace; font-size: 0.85rem;">${u.id_mesin}</span>`
            : `<span style="color: var(--text-muted); font-size: 0.82rem;">-</span>`;
        const idTelegramDisplay = u.id_telegram 
            ? `<span class="badge" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); font-family: monospace; font-size: 0.85rem;"><i class="fa-brands fa-telegram"></i> ${u.id_telegram}</span>`
            : `<span style="color: var(--text-muted); font-size: 0.82rem;">-</span>`;

        html += `
            <tr>
                <td style="text-align:center; font-weight:bold;">${index + 1}</td>
                <td><strong>${u.username}</strong></td>
                <td>${u.nama}</td>
                <td style="text-align:center;">${idMesinDisplay}</td>
                <td style="text-align:center;">${idTelegramDisplay}</td>
                <td style="text-align:center;"><span class="badge" style="${roleBadge}">${u.role}</span></td>
                <td style="text-align:center;">
                    <button class="btn-secondary" style="padding:4px 10px; font-size:0.8rem; margin-right:4px;" onclick="editUserByUsername('${u.username}')"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                    ${!isSelf ? `<button class="btn-secondary" style="padding:4px 10px; font-size:0.8rem; background:rgba(239,68,68,0.2); border-color:rgba(239,68,68,0.4); color:#fca5a5;" onclick="deleteUserByUsername('${u.username}', '${u.nama}')"><i class="fa-solid fa-trash-can"></i> Hapus</button>` : ''}
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;
}

// Global functions for inline onclick handlers
window.editUserByUsername = function(username) {
    const found = userListState.find(u => u.username === username);
    if (found) openUserModal(found);
};

window.deleteUserByUsername = async function(username, nama) {
    const confirmed = await showCustomConfirm({
        title: 'Hapus Akun Pengguna?',
        message: `Apakah Anda yakin ingin menghapus akun guru <strong>"${nama}"</strong> (@${username})?`,
        icon: 'danger',
        confirmText: 'Ya, Hapus Pengguna',
        cancelText: 'Batal',
        danger: true
    });

    if (!confirmed) return;

    try {
        const formData = new FormData();
        formData.append('action', 'delete_user');
        formData.append('username', username);

        const result = await fetchWithRetry(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(formData).toString()
        }, 0);

        if (result && result.status === 'success') {
            showToast(`✅ Pengguna ${nama} berhasil dihapus.`, 'success');
            loadUsers();
        } else {
            showToast(`❌ Gagal menghapus: ${result ? result.message : 'Error'}`, 'error');
        }
    } catch (err) {
        console.error(err);
        showToast("❌ Gagal menghapus pengguna. Silakan coba lagi.", 'error');
    }
};

// Handle Form Modal Submit (Tambah & Update)
if (formUserModal) {
    formUserModal.addEventListener('submit', async (e) => {
        e.preventDefault();

        const oldUsername = modalOldUsername ? modalOldUsername.value.trim() : '';
        const username = modalUsername ? modalUsername.value.trim() : '';
        const id_mesin = modalIdMesin ? modalIdMesin.value.trim() : '';
        const id_telegram = modalIdTelegram ? modalIdTelegram.value.trim() : '';
        const password = modalPassword ? modalPassword.value.trim() : '';
        const nama = modalNama ? modalNama.value.trim() : '';
        const role = modalRole ? modalRole.value : 'Guru';

        if (!username || !nama) {
            showToast("Username dan Nama Lengkap wajib diisi.", 'warning');
            return;
        }

        const isEdit = oldUsername !== '';
        if (!isEdit && !password) {
            showToast("Password wajib diisi untuk pengguna baru.", 'warning');
            return;
        }

        const btnSave = document.getElementById('btnSaveModalUser');
        if (btnSave) btnSave.disabled = true;

        try {
            const formData = new FormData();
            formData.append('action', isEdit ? 'update_user' : 'add_user');
            if (isEdit) formData.append('old_username', oldUsername);
            formData.append('username', username);
            formData.append('id_mesin', id_mesin);
            formData.append('id_telegram', id_telegram);
            if (password) formData.append('password', password);
            formData.append('nama', nama);
            formData.append('role', role);

            const result = await fetchWithRetry(SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(formData).toString()
            }, 0);

            if (result && result.status === 'success') {
                showToast(`✅ ${result.message}`, 'success');
                closeUserModal();
                loadUsers();
            } else {
                showToast(`❌ Gagal: ${result ? result.message : 'Error'}`, 'error');
            }
        } catch (err) {
            console.error(err);
            showToast("❌ Gagal menyimpan data pengguna.", 'error');
        } finally {
            if (btnSave) btnSave.disabled = false;
        }
    });
}

// ==========================================
// PENGATURAN IDENTITAS SEKOLAH & TAHUN PELAJARAN
// ==========================================

const formConfigSekolah = document.getElementById('formConfigSekolah');
const inputNamaSekolah = document.getElementById('inputNamaSekolah');
const inputTahunPelajaran = document.getElementById('inputTahunPelajaran');

// Load config saat DOM siap atau script dimuat
// Global hook agar dipanggil dari mana saja (main.js / sync background)
window.applyServerSchoolConfig = function(config) {
    if (config) updateAppSchoolConfigUI(config);
};

function applyCachedSchoolConfig() {
    const cached = JSON.parse(localStorage.getItem('smart_absen_config') || '{}');
    if (cached.namaSekolah || cached.tahunPelajaran) {
        updateAppSchoolConfigUI(cached);
    }
    fetchServerSchoolConfig();
}

async function fetchServerSchoolConfig() {
    try {
        const result = await fetchWithRetry(`${SCRIPT_URL}?action=get_config`, { method: 'GET' }, 2, 800);
        if (result && result.status === 'success' && result.data) {
            updateAppSchoolConfigUI(result.data);
        }
    } catch(e) {}
}

function updateAppSchoolConfigUI(config) {
    if (!config) return;
    localStorage.setItem('smart_absen_config', JSON.stringify(config));

    // Update input di Admin panel
    const inputNamaSekolah = document.getElementById('inputNamaSekolah');
    const inputTahunPelajaran = document.getElementById('inputTahunPelajaran');
    const inputUrlScript = document.getElementById('inputUrlScript');
    const inputTelegramBotToken = document.getElementById('inputTelegramBotToken');

    if (inputNamaSekolah && !inputNamaSekolah.value) inputNamaSekolah.value = config.namaSekolah || '';
    if (inputTahunPelajaran && !inputTahunPelajaran.value) inputTahunPelajaran.value = config.tahunPelajaran || '';
    if (inputUrlScript) inputUrlScript.value = config.urlScript || config.url_script || window.SCRIPT_URL || '';
    if (inputTelegramBotToken && !inputTelegramBotToken.value) inputTelegramBotToken.value = config.telegramBotToken || config.telegram_bot_token || '';

    // Update semua elemen tahun pelajaran di seluruh aplikasi
    const tpElements = document.querySelectorAll('.app-tp-text');
    tpElements.forEach(el => {
        if (config.tahunPelajaran) el.innerText = config.tahunPelajaran;
    });

    if (typeof updatePrintTitles === 'function') {
        updatePrintTitles();
    }
}

applyCachedSchoolConfig();
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', applyCachedSchoolConfig);
} else {
    applyCachedSchoolConfig();
}

// Handle Form Simpan Config Sekolah
if (formConfigSekolah) {
    formConfigSekolah.addEventListener('submit', async (e) => {
        e.preventDefault();

        const inputNamaSekolah = document.getElementById('inputNamaSekolah');
        const inputTahunPelajaran = document.getElementById('inputTahunPelajaran');
        const inputUrlScript = document.getElementById('inputUrlScript');
        const inputTelegramBotToken = document.getElementById('inputTelegramBotToken');

        const namaSekolah = inputNamaSekolah ? inputNamaSekolah.value.trim() : '';
        const tahunPelajaran = inputTahunPelajaran ? inputTahunPelajaran.value.trim() : '';
        const urlScript = inputUrlScript ? inputUrlScript.value.trim() : '';
        const telegramBotToken = inputTelegramBotToken ? inputTelegramBotToken.value.trim() : '';

        if (!namaSekolah || !tahunPelajaran) {
            showToast("Nama Sekolah dan Tahun Pelajaran wajib diisi.", "warning");
            return;
        }

        if (urlScript) {
            window.SCRIPT_URL = urlScript;
        }

        const btnSave = document.getElementById('btnSaveConfig');
        if (btnSave) btnSave.disabled = true;

        try {
            const formData = new FormData();
            formData.append('action', 'save_config');
            formData.append('nama_sekolah', namaSekolah);
            formData.append('tahun_pelajaran', tahunPelajaran);
            formData.append('telegram_bot_token', telegramBotToken);

            const activeUrl = urlScript || SCRIPT_URL;
            const result = await fetchWithRetry(activeUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(formData).toString()
            }, 0);

            const newConfig = { namaSekolah, tahunPelajaran, urlScript: activeUrl, telegramBotToken };
            updateAppSchoolConfigUI(newConfig);
            showToast("✅ Identitas sekolah, Token Telegram Bot & Web Server URL berhasil diperbarui!", "success");
        } catch (err) {
            console.error(err);
            showToast("❌ Gagal menyimpan pengaturan.", "error");
        } finally {
            if (btnSave) btnSave.disabled = false;
        }
    });
}

// Handle Tombol Setup Database Otomatis
const btnInitialSetup = document.getElementById('btnInitialSetup');

if (btnInitialSetup) {
    btnInitialSetup.addEventListener('click', async () => {
        if (!confirm("Apakah Anda yakin ingin menjalankan Setup Database Otomatis pada Google Sheets? Seluruh tab sheet (Users, DataSiswa, LogAbsen, Pengaturan) akan disiapkan secara otomatis.")) return;

        btnInitialSetup.disabled = true;
        try {
            const result = await fetchWithRetry(`${SCRIPT_URL}?action=initial_setup`, { method: 'GET' }, 1, 1000);
            if (result && result.status === 'success') {
                showToast("✅ Setup Database Google Sheets Berhasil!", "success");
                loadUsers();
                if (typeof syncMasterDataInBackground === 'function') syncMasterDataInBackground();
            } else {
                showToast(`❌ Gagal setup: ${result ? result.message : 'Error'}`, "error");
            }
        } catch (err) {
            console.error(err);
            showToast("❌ Gagal menjalankan setup database.", "error");
        } finally {
            btnInitialSetup.disabled = false;
        }
    });
}
