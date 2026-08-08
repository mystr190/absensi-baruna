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
const modalWaliKelas = document.getElementById('modalWaliKelas');
const modalTugasPiket = document.getElementById('modalTugasPiket');

// Handle Tombol Buka Modal & Search Input
if (btnTambahUser) {
    btnTambahUser.addEventListener('click', () => {
        openUserModal();
    });
}

const inputSearchUser = document.getElementById('inputSearchUser');
if (inputSearchUser) {
    inputSearchUser.addEventListener('input', filterAndRenderUsers);
}

// Handle Close Modal
if (btnCloseModalUser) btnCloseModalUser.addEventListener('click', closeUserModal);
if (btnCancelModalUser) btnCancelModalUser.addEventListener('click', closeUserModal);

function populateWaliKelasOptions(selectedClass = '-') {
    if (!modalWaliKelas) return;

    let students = window.allStudents || [];
    if (!students || students.length === 0) {
        try {
            students = JSON.parse(localStorage.getItem('smart_absen_students') || '[]');
        } catch (e) {
            students = [];
        }
    }

    const uniqueClasses = [...new Set(students.map(s => String(s.kelas || '').trim()).filter(Boolean))].sort();

    // Pastikan kelas terpilih ikut dimasukkan jika belum ada di daftar
    if (selectedClass && selectedClass !== '-' && !uniqueClasses.includes(selectedClass)) {
        uniqueClasses.push(selectedClass);
        uniqueClasses.sort();
    }

    let html = `<option value="-">Bukan Wali Kelas / -</option>`;
    uniqueClasses.forEach(cls => {
        const isSel = String(selectedClass).trim() === cls ? 'selected' : '';
        html += `<option value="${cls}" ${isSel}>Kelas ${cls}</option>`;
    });

    modalWaliKelas.innerHTML = html;
    modalWaliKelas.value = selectedClass || '-';
}

function openUserModal(user = null) {
    if (!modalUser) return;
    
    const targetWali = user ? (user.wali_kelas || '-') : '-';
    populateWaliKelasOptions(targetWali);

    if (user) {
        if (modalUserTitle) modalUserTitle.innerText = "Edit Data Pengguna / Guru";
        if (modalOldUsername) modalOldUsername.value = user.username;
        if (modalUsername) modalUsername.value = user.username;
        if (modalIdMesin) modalIdMesin.value = user.id_mesin || '';
        if (modalIdTelegram) modalIdTelegram.value = user.id_telegram || '';
        if (modalPassword) modalPassword.value = ''; // Kosongkan password saat edit
        if (modalNama) modalNama.value = user.nama;
        if (modalRole) modalRole.value = user.role || 'Guru';
        if (modalTugasPiket) modalTugasPiket.value = user.tugas_piket || '-';
    } else {
        if (modalUserTitle) modalUserTitle.innerText = "Tambah Pengguna Baru";
        if (modalOldUsername) modalOldUsername.value = '';
        if (modalUsername) modalUsername.value = '';
        if (modalIdMesin) modalIdMesin.value = '';
        if (modalIdTelegram) modalIdTelegram.value = '';
        if (modalPassword) modalPassword.value = '';
        if (modalNama) modalNama.value = '';
        if (modalRole) modalRole.value = 'Guru';
        if (modalTugasPiket) modalTugasPiket.value = '-';
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
        tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 25px;"><span class="loader" style="display:inline-block; border-color:var(--primary); border-bottom-color:transparent; margin-right:8px;"></span>Memuat daftar pengguna...</td></tr>`;
    }

    try {
        const result = await fetchWithRetry(`${SCRIPT_URL}?action=get_users`, { method: 'GET' }, 2, 800);
        if (result && result.status === 'success') {
            userListState = result.data || [];
            window.allUsers = userListState;
            window.allTeachers = userListState.map(u => ({ username: u.username, namaLengkap: u.nama, role: u.role, id_mesin: u.id_mesin, id_telegram: u.id_telegram }));
            localStorage.setItem('smart_absen_users_cache', JSON.stringify(window.allUsers));
            if (tableBody) filterAndRenderUsers();
            if (typeof renderAbsenGuruBatchTable === 'function') {
                renderAbsenGuruBatchTable();
            }
        } else {
            if (tableBody) tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:red;">Gagal memuat pengguna: ${result ? result.message : 'Error'}</td></tr>`;
        }
    } catch (err) {
        console.error("Load users error:", err);
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:red;">Koneksi error saat memuat pengguna.</td></tr>`;
    }
}

function filterAndRenderUsers() {
    const searchInp = document.getElementById('inputSearchUser');
    const query = (searchInp ? searchInp.value : '').trim().toLowerCase();

    if (!query) {
        renderUserTable(userListState);
        return;
    }

    const filtered = userListState.filter(u => {
        const username = String(u.username || '').toLowerCase();
        const nama = String(u.nama || '').toLowerCase();
        const role = String(u.role || '').toLowerCase();
        const wali = String(u.wali_kelas || '').toLowerCase();
        const piket = String(u.tugas_piket || '').toLowerCase();
        const idMesin = String(u.id_mesin || '').toLowerCase();
        const idTelegram = String(u.id_telegram || '').toLowerCase();

        return username.includes(query) ||
               nama.includes(query) ||
               role.includes(query) ||
               wali.includes(query) ||
               piket.includes(query) ||
               idMesin.includes(query) ||
               idTelegram.includes(query);
    });

    renderUserTable(filtered);
}

function renderUserTable(users) {
    const tableBody = document.getElementById('tableBodyUsers');
    if (!tableBody) return;

    if (!users || users.length === 0) {
        const query = (document.getElementById('inputSearchUser')?.value || '').trim();
        const emptyText = query 
            ? `Tidak ada pengguna yang cocok dengan pencarian "<strong>${escapeHtml(query)}</strong>".`
            : 'Belum ada data pengguna.';
        tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 25px; color: var(--text-muted);"><i class="fa-solid fa-user-slash" style="font-size: 1.5rem; display: block; margin-bottom: 8px; opacity: 0.5;"></i>${emptyText}</td></tr>`;
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
        
        const waliKelasDisplay = (u.wali_kelas && u.wali_kelas !== '-') 
            ? `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 0.82rem;"><i class="fa-solid fa-chalkboard-user"></i> ${u.wali_kelas}</span>`
            : `<span style="color: var(--text-muted); font-size: 0.82rem;">-</span>`;

        const piketDisplay = (u.tugas_piket && u.tugas_piket !== '-') 
            ? `<span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #fde047; border: 1px solid rgba(245, 158, 11, 0.3); font-size: 0.82rem;"><i class="fa-solid fa-user-shield"></i> ${u.tugas_piket}</span>`
            : `<span style="color: var(--text-muted); font-size: 0.82rem;">-</span>`;

        html += `
            <tr>
                <td style="text-align:center; font-weight:bold;">${index + 1}</td>
                <td><strong>${u.username}</strong></td>
                <td>${u.nama}</td>
                <td style="text-align:center;">${idMesinDisplay}</td>
                <td style="text-align:center;">${idTelegramDisplay}</td>
                <td style="text-align:center;"><span class="badge" style="${roleBadge}">${u.role}</span></td>
                <td style="text-align:center;">${waliKelasDisplay}</td>
                <td style="text-align:center;">${piketDisplay}</td>
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
        const tugas_piket = modalTugasPiket ? modalTugasPiket.value : '-';

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
            formData.append('tugas_piket', tugas_piket);

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

    const currentCache = JSON.parse(localStorage.getItem('smart_absen_config') || '{}');
    const mergedConfig = { ...currentCache, ...config };
    localStorage.setItem('smart_absen_config', JSON.stringify(mergedConfig));

    const schoolName = mergedConfig.namaSekolah || mergedConfig.nama_sekolah || '';
    const tahunPelajaran = mergedConfig.tahunPelajaran || mergedConfig.tahun_pelajaran || '';

    // Update input di Admin panel
    const inputNamaSekolah = document.getElementById('inputNamaSekolah');
    const inputTahunPelajaran = document.getElementById('inputTahunPelajaran');
    const inputUrlScript = document.getElementById('inputUrlScript');
    const inputTelegramBotToken = document.getElementById('inputTelegramBotToken');

    if (inputNamaSekolah) inputNamaSekolah.value = schoolName;
    if (inputTahunPelajaran) inputTahunPelajaran.value = tahunPelajaran;
    if (inputUrlScript) inputUrlScript.value = mergedConfig.urlScript || mergedConfig.url_script || window.SCRIPT_URL || '';
    if (inputTelegramBotToken && !inputTelegramBotToken.value) inputTelegramBotToken.value = mergedConfig.telegramBotToken || mergedConfig.telegram_bot_token || '';

    // Update elemen nama sekolah di seluruh aplikasi
    if (schoolName) {
        document.querySelectorAll('.app-school-name').forEach(el => {
            el.innerText = schoolName;
        });
    }

    // Update elemen tahun pelajaran di seluruh aplikasi
    if (tahunPelajaran) {
        document.querySelectorAll('.app-tp-text').forEach(el => {
            el.innerText = tahunPelajaran;
        });
    }

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

// Handle Tombol Tes Kirim Pesan Telegram
const btnTestTelegram = document.getElementById('btnTestTelegram');
if (btnTestTelegram) {
    btnTestTelegram.addEventListener('click', async () => {
        const inputTelegramBotToken = document.getElementById('inputTelegramBotToken');
        const token = inputTelegramBotToken ? inputTelegramBotToken.value.trim() : '';

        const loggedUser = JSON.parse(localStorage.getItem('smart_absen_user') || '{}');
        const targetId = loggedUser.id_telegram || '';
        
        if (!targetId) {
            showToast("⚠️ Akun Anda belum terhubung dengan Telegram ID. Silakan sambungkan akun via Bot Telegram terlebih dahulu.", "warning");
            return;
        }

        btnTestTelegram.disabled = true;
        showToast("⏳ Mengirim pesan tes ke Telegram...", "info");

        try {
            const formData = new FormData();
            formData.append('action', 'test_telegram');
            formData.append('chat_id', targetId.trim());
            if (token) formData.append('telegram_bot_token', token);

            const result = await fetchWithRetry(SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(formData).toString()
            }, 0);

            if (result && result.status === 'success') {
                showToast(`✅ ${result.message}`, "success");
            } else {
                showToast(`❌ ${result ? result.message : 'Gagal mengirim pesan tes.'}`, "error");
            }
        } catch (err) {
            console.error(err);
            showToast("❌ Error koneksi ke server saat tes Telegram.", "error");
        } finally {
            btnTestTelegram.disabled = false;
        }
    });
}

// Handle Tombol Aktifkan Auto-Reply ID Telegram Bot
const btnActivateAutoReply = document.getElementById('btnActivateAutoReply');
if (btnActivateAutoReply) {
    btnActivateAutoReply.addEventListener('click', async () => {
        const inputUrlScript = document.getElementById('inputUrlScript');
        const activeUrl = inputUrlScript ? inputUrlScript.value.trim() : SCRIPT_URL;

        btnActivateAutoReply.disabled = true;
        showToast("⏳ Mengaktifkan Auto-Reply Telegram Webhook...", "info");

        try {
            const formData = new FormData();
            formData.append('action', 'set_telegram_webhook');
            formData.append('url_script', activeUrl);

            const result = await fetchWithRetry(activeUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(formData).toString()
            }, 0);

            if (result && result.status === 'success') {
                showToast(`✅ ${result.message}`, "success");
            } else {
                showToast(`❌ ${result ? result.message : 'Gagal mengaktifkan Webhook.'}`, "error");
            }
        } catch (err) {
            console.error(err);
            showToast("❌ Error koneksi saat mengaktifkan Webhook.", "error");
        } finally {
            btnActivateAutoReply.disabled = false;
        }
    });
}

// Handle Tombol Setup Database Otomatis
const btnInitialSetup = document.getElementById('btnInitialSetup');

if (btnInitialSetup) {
    btnInitialSetup.addEventListener('click', async () => {
        const confirmed = await showCustomConfirm({
            title: 'Setup Database Otomatis',
            message: 'Apakah Anda yakin ingin menjalankan Setup Database Otomatis pada Google Sheets? Seluruh tab sheet (Users, DataSiswa, LogAbsen, Pengaturan, dsb.) akan disiapkan secara otomatis.',
            icon: 'info',
            confirmText: 'Ya, Jalankan Setup',
            cancelText: 'Batal'
        });

        if (!confirmed) return;

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
