// ==========================================
// MANAJEMEN MASTER DATA KELAS (DATAKELAS)
// ==========================================

const DEFAULT_PRESET_KELAS = [
    { nama: 'X-1', tingkat: 'X', jurusan: 'Umum', wali_kelas: '-', kapasitas: '36' },
    { nama: 'X-2', tingkat: 'X', jurusan: 'Umum', wali_kelas: '-', kapasitas: '36' },
    { nama: 'X-3', tingkat: 'X', jurusan: 'Umum', wali_kelas: '-', kapasitas: '36' },
    { nama: 'X-4', tingkat: 'X', jurusan: 'Umum', wali_kelas: '-', kapasitas: '36' },
    { nama: 'XI-1', tingkat: 'XI', jurusan: 'Peminatan', wali_kelas: '-', kapasitas: '36' },
    { nama: 'XI-2', tingkat: 'XI', jurusan: 'Peminatan', wali_kelas: '-', kapasitas: '36' },
    { nama: 'XI-3', tingkat: 'XI', jurusan: 'Peminatan', wali_kelas: '-', kapasitas: '36' },
    { nama: 'XI-4', tingkat: 'XI', jurusan: 'Peminatan', wali_kelas: '-', kapasitas: '36' },
    { nama: 'XII-1', tingkat: 'XII', jurusan: 'Peminatan', wali_kelas: '-', kapasitas: '36' },
    { nama: 'XII-2', tingkat: 'XII', jurusan: 'Peminatan', wali_kelas: '-', kapasitas: '36' },
    { nama: 'XII-3', tingkat: 'XII', jurusan: 'Peminatan', wali_kelas: '-', kapasitas: '36' },
    { nama: 'XII-4', tingkat: 'XII', jurusan: 'Peminatan', wali_kelas: '-', kapasitas: '36' },
    { nama: 'XII-5', tingkat: 'XII', jurusan: 'Peminatan', wali_kelas: '-', kapasitas: '36' }
];

let rawKelasList = [];
let editingOldKelasNama = null;

// Element References
const formKelas = document.getElementById('formKelas');
const inputNamaKelas = document.getElementById('inputNamaKelas');
const selectTingkatKelas = document.getElementById('selectTingkatKelas');
const inputJurusanKelas = document.getElementById('inputJurusanKelas');
const selectWaliKelas = document.getElementById('selectWaliKelas');
const inputKapasitasKelas = document.getElementById('inputKapasitasKelas');
const inputSearchKelas = document.getElementById('inputSearchKelas');
const tableBodyKelas = document.getElementById('tableBodyKelas');
const btnSubmitKelas = document.getElementById('btnSubmitKelas');
const btnCancelEditKelas = document.getElementById('btnCancelEditKelas');
const btnSeedKelasDefault = document.getElementById('btnSeedKelasDefault');
const badgeTotalKelas = document.getElementById('badgeTotalKelas');

// Initialize Listener
if (formKelas) {
    formKelas.addEventListener('submit', handleFormKelasSubmit);
}

if (inputSearchKelas) {
    inputSearchKelas.addEventListener('input', () => {
        renderKelasTable(filterKelasData(inputSearchKelas.value));
    });
}

if (btnCancelEditKelas) {
    btnCancelEditKelas.addEventListener('click', resetKelasForm);
}

if (btnSeedKelasDefault) {
    btnSeedKelasDefault.addEventListener('click', seedKelasDefault);
}

const btnCleanupDatabase = document.getElementById('btnCleanupDatabase');
if (btnCleanupDatabase) {
    btnCleanupDatabase.addEventListener('click', triggerCleanupDatabase);
}

async function triggerCleanupDatabase() {
    if (!confirm("Apakah Anda yakin ingin memproses Pembersihan & Perbaikan Database?\n\nSistem akan merapikan data kelas (termasuk preset XI & XII Peminatan) dan menguji sinkronisasi Wali Kelas pada database.")) return;

    if (btnCleanupDatabase) btnCleanupDatabase.disabled = true;
    showToast("⏳ Sedang membersihkan & memperbaiki struktur database...", "info");

    try {
        const formData = new FormData();
        formData.append('action', 'cleanup_and_repair_data');

        const requestUrl = SCRIPT_URL.includes('?') ? `${SCRIPT_URL}&action=cleanup_and_repair_data` : `${SCRIPT_URL}?action=cleanup_and_repair_data`;
        const result = await fetchWithRetry(requestUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(formData).toString()
        }, 0);

        if (typeof loadKelasData === 'function') loadKelasData(true);
        if (typeof loadUsers === 'function') loadUsers(true);

        showToast(result && result.message ? result.message : "✅ Database berhasil dibersihkan & diperbaiki!", "success");
    } catch (err) {
        console.error(err);
        showToast("❌ Gagal membersihkan database.", "error");
    } finally {
        if (btnCleanupDatabase) btnCleanupDatabase.disabled = false;
    }
}

// Populate Teacher / User Options for Wali Kelas Dropdown
function populateWaliKelasDropdown(selectedValue = '-') {
    if (!selectWaliKelas) return;

    let users = window.allUsers || [];
    if (!users || users.length === 0) {
        try {
            users = JSON.parse(localStorage.getItem('smart_absen_users_cache') || '[]');
        } catch (e) {
            users = [];
        }
    }

    let teachers = [];
    if (Array.isArray(users) && users.length > 0) {
        teachers = users
            .map(u => String(u.nama || u.username || '').trim())
            .filter(Boolean);
    }

    // Deduplicate & sort
    teachers = [...new Set(teachers)].sort();

    let html = `<option value="-">-- Pilih Wali Kelas (Opsional) --</option>`;
    teachers.forEach(t => {
        const isSel = (t.toLowerCase() === String(selectedValue).toLowerCase()) ? 'selected' : '';
        html += `<option value="${escapeHtml(t)}" ${isSel}>${escapeHtml(t)}</option>`;
    });

    // If selected value is custom & not in list, add it
    if (selectedValue && selectedValue !== '-' && !teachers.some(t => t.toLowerCase() === selectedValue.toLowerCase())) {
        html += `<option value="${escapeHtml(selectedValue)}" selected>${escapeHtml(selectedValue)}</option>`;
    }

    selectWaliKelas.innerHTML = html;
}

// Load Kelas Data from Server or Local Storage
async function loadKelasData(forceRefresh = false) {
    if (!tableBodyKelas) return;

    populateWaliKelasDropdown();

    const cacheKey = 'smart_absen_kelas_list';
    const cachedData = JSON.parse(localStorage.getItem(cacheKey) || 'null');

    if (!forceRefresh && cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
        rawKelasList = cachedData;
        window.masterClasses = rawKelasList.map(k => k.nama);
        renderKelasTable(filterKelasData(inputSearchKelas ? inputSearchKelas.value : ''));
    }

    try {
        const requestUrl = `${SCRIPT_URL}?action=get_kelas`;
        const result = await fetchWithRetry(requestUrl, { method: 'GET' }, 1, 1000);

        if (result && result.status === 'success' && Array.isArray(result.data)) {
            rawKelasList = result.data.length > 0 ? result.data : DEFAULT_PRESET_KELAS;
            window.masterClasses = rawKelasList.map(k => k.nama);
            localStorage.setItem(cacheKey, JSON.stringify(rawKelasList));
            renderKelasTable(filterKelasData(inputSearchKelas ? inputSearchKelas.value : ''));
        } else if (!rawKelasList || rawKelasList.length === 0) {
            rawKelasList = DEFAULT_PRESET_KELAS;
            window.masterClasses = rawKelasList.map(k => k.nama);
            localStorage.setItem(cacheKey, JSON.stringify(rawKelasList));
            renderKelasTable(rawKelasList);
        }
    } catch (err) {
        console.error("Gagal menarik data Master Kelas:", err);
        if (!rawKelasList || rawKelasList.length === 0) {
            rawKelasList = DEFAULT_PRESET_KELAS;
            window.masterClasses = rawKelasList.map(k => k.nama);
            renderKelasTable(rawKelasList);
        }
    }
}

function filterKelasData(queryStr = '') {
    const q = queryStr.toLowerCase().trim();
    if (!q) return rawKelasList;
    return rawKelasList.filter(item => 
        (item.nama && item.nama.toLowerCase().includes(q)) ||
        (item.tingkat && item.tingkat.toLowerCase().includes(q)) ||
        (item.jurusan && item.jurusan.toLowerCase().includes(q)) ||
        (item.wali_kelas && item.wali_kelas.toLowerCase().includes(q))
    );
}

function renderKelasTable(dataList) {
    if (!tableBodyKelas) return;

    if (badgeTotalKelas) {
        badgeTotalKelas.innerText = `${dataList.length} Rombel Kelas`;
    }

    if (!dataList || dataList.length === 0) {
        tableBodyKelas.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 25px;">
                    Tidak ada data Master Kelas. Klik 'Setup Preset Kelas Bawaan' untuk mengisi 13 rincian kelas otomatis.
                </td>
            </tr>`;
        return;
    }

    let html = '';
    dataList.forEach((item, index) => {
        const badgeColor = item.tingkat === 'X' ? 'rgba(59, 130, 246, 0.15)' : item.tingkat === 'XI' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(168, 85, 247, 0.15)';
        const textColor = item.tingkat === 'X' ? '#60a5fa' : item.tingkat === 'XI' ? '#34d399' : '#c084fc';
        const borderColor = item.tingkat === 'X' ? 'rgba(59, 130, 246, 0.3)' : item.tingkat === 'XI' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(168, 85, 247, 0.3)';

        html += `
            <tr>
                <td style="text-align: center; font-weight: 600;">${index + 1}</td>
                <td>
                    <strong style="color: var(--text-main); font-size: 0.95rem;">${escapeHtml(item.nama)}</strong>
                </td>
                <td style="text-align: center;">
                    <span class="badge" style="background: ${badgeColor}; color: ${textColor}; border: 1px solid ${borderColor}; padding: 3px 10px; border-radius: 12px; font-size: 0.78rem; font-weight: 600;">
                        Kelas ${escapeHtml(item.tingkat || '-')}
                    </span>
                </td>
                <td><span style="color: var(--text-main); font-size: 0.85rem;">${escapeHtml(item.jurusan || '-')}</span></td>
                <td><span style="color: #fbbf24; font-size: 0.85rem; font-weight: 500;"><i class="fa-solid fa-user-tie" style="margin-right: 5px; opacity: 0.7;"></i>${escapeHtml(item.wali_kelas || '-')}</span></td>
                <td style="text-align: center;"><span style="color: var(--text-muted); font-size: 0.85rem;">${escapeHtml(item.kapasitas || '36')} Siswa</span></td>
                <td style="text-align: center;">
                    <div style="display: flex; gap: 6px; justify-content: center;">
                        <button type="button" class="btn-secondary" onclick="editKelasItem('${escapeHtml(item.nama)}')" style="padding: 5px 10px; font-size: 0.8rem; border-color: rgba(56, 189, 248, 0.4); color: #38bdf8;" title="Edit Kelas">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button type="button" class="btn-secondary" onclick="deleteKelasItem('${escapeHtml(item.nama)}')" style="padding: 5px 10px; font-size: 0.8rem; border-color: rgba(239, 68, 68, 0.4); color: #fca5a5;" title="Hapus Kelas">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
    });

    tableBodyKelas.innerHTML = html;
}

async function handleFormKelasSubmit(e) {
    e.preventDefault();
    const nama = inputNamaKelas ? inputNamaKelas.value.trim() : '';
    const tingkat = selectTingkatKelas ? selectTingkatKelas.value : '';
    const jurusan = inputJurusanKelas ? inputJurusanKelas.value.trim() : 'Umum';
    const wali_kelas = selectWaliKelas ? selectWaliKelas.value : '-';
    const kapasitas = inputKapasitasKelas ? inputKapasitasKelas.value.trim() : '36';

    if (!nama) {
        showToast("Nama Kelas wajib diisi!", "warning");
        return;
    }

    if (btnSubmitKelas) btnSubmitKelas.disabled = true;

    try {
        const formData = new FormData();
        formData.append('action', 'save_kelas');
        formData.append('nama', nama);
        formData.append('tingkat', tingkat);
        formData.append('jurusan', jurusan);
        formData.append('wali_kelas', wali_kelas);
        formData.append('kapasitas', kapasitas);
        if (editingOldKelasNama) {
            formData.append('old_nama', editingOldKelasNama);
        }

        const requestUrl = SCRIPT_URL.includes('?') ? `${SCRIPT_URL}&action=save_kelas` : `${SCRIPT_URL}?action=save_kelas`;
        const result = await fetchWithRetry(requestUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(formData).toString()
        }, 0);

        // Update local memory list
        const existingIdx = rawKelasList.findIndex(k => k.nama.toLowerCase() === (editingOldKelasNama || nama).toLowerCase());
        const newItem = { nama, tingkat, jurusan, wali_kelas, kapasitas };

        if (existingIdx !== -1) {
            rawKelasList[existingIdx] = newItem;
        } else {
            rawKelasList.push(newItem);
        }

        window.masterClasses = rawKelasList.map(k => k.nama);
        localStorage.setItem('smart_absen_kelas_list', JSON.stringify(rawKelasList));
        renderKelasTable(filterKelasData(inputSearchKelas ? inputSearchKelas.value : ''));
        resetKelasForm();

        // Refresh Mapel Class Dropdown Checkboxes if available
        if (typeof initMapelClassDropdown === 'function') {
            initMapelClassDropdown();
        }

        showToast(result && result.message ? `✅ ${result.message}` : "✅ Master Data Kelas berhasil disimpan!", "success");
    } catch (err) {
        console.error(err);
        showToast("❌ Gagal menyimpan Master Data Kelas.", "error");
    } finally {
        if (btnSubmitKelas) btnSubmitKelas.disabled = false;
    }
}

function editKelasItem(namaItem) {
    const item = rawKelasList.find(k => k.nama === namaItem);
    if (!item) return;

    editingOldKelasNama = item.nama;
    if (inputNamaKelas) inputNamaKelas.value = item.nama;
    if (selectTingkatKelas) selectTingkatKelas.value = item.tingkat || 'X';
    if (inputJurusanKelas) inputJurusanKelas.value = item.jurusan || 'Peminatan';
    
    populateWaliKelasDropdown(item.wali_kelas || '-');

    if (inputKapasitasKelas) inputKapasitasKelas.value = item.kapasitas || '36';

    if (btnSubmitKelas) btnSubmitKelas.innerHTML = `<span><i class="fa-solid fa-floppy-disk"></i> Update Kelas</span>`;
    if (btnCancelEditKelas) btnCancelEditKelas.style.display = 'inline-flex';

    if (inputNamaKelas) inputNamaKelas.focus();
}

function resetKelasForm() {
    editingOldKelasNama = null;
    if (formKelas) formKelas.reset();
    populateWaliKelasDropdown('-');
    if (btnSubmitKelas) btnSubmitKelas.innerHTML = `<span><i class="fa-solid fa-plus"></i> Tambah Kelas</span>`;
    if (btnCancelEditKelas) btnCancelEditKelas.style.display = 'none';
}

async function deleteKelasItem(namaItem) {
    if (!confirm(`Apakah Anda yakin ingin menghapus Rombel Kelas '${namaItem}'?`)) return;

    try {
        const formData = new FormData();
        formData.append('action', 'delete_kelas');
        formData.append('nama', namaItem);

        const requestUrlDel = SCRIPT_URL.includes('?') ? `${SCRIPT_URL}&action=delete_kelas` : `${SCRIPT_URL}?action=delete_kelas`;
        const result = await fetchWithRetry(requestUrlDel, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(formData).toString()
        }, 0);

        rawKelasList = rawKelasList.filter(k => k.nama !== namaItem);
        window.masterClasses = rawKelasList.map(k => k.nama);
        localStorage.setItem('smart_absen_kelas_list', JSON.stringify(rawKelasList));
        renderKelasTable(filterKelasData(inputSearchKelas ? inputSearchKelas.value : ''));

        // Refresh Mapel Class Dropdown Checkboxes if available
        if (typeof initMapelClassDropdown === 'function') {
            initMapelClassDropdown();
        }

        showToast(result && result.message ? `✅ ${result.message}` : `✅ Rombel Kelas '${namaItem}' berhasil dihapus!`, "success");
    } catch (err) {
        console.error(err);
        showToast("❌ Gagal menghapus Data Kelas.", "error");
    }
}

async function seedKelasDefault() {
    if (!confirm("Apakah Anda yakin ingin menyetel ulang Master Data Kelas ke 13 Rombel Bawaan? Data custom akan diperbarui.")) return;

    if (btnSeedKelasDefault) btnSeedKelasDefault.disabled = true;
    showToast("⏳ Menyiapkan 13 Preset Master Kelas Bawaan...", "info");

    try {
        const formData = new FormData();
        formData.append('action', 'seed_default_kelas');

        const requestUrlSeed = SCRIPT_URL.includes('?') ? `${SCRIPT_URL}&action=seed_default_kelas` : `${SCRIPT_URL}?action=seed_default_kelas`;
        const result = await fetchWithRetry(requestUrlSeed, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(formData).toString()
        }, 0);

        rawKelasList = DEFAULT_PRESET_KELAS;
        window.masterClasses = rawKelasList.map(k => k.nama);
        localStorage.setItem('smart_absen_kelas_list', JSON.stringify(rawKelasList));
        renderKelasTable(rawKelasList);

        // Refresh Mapel Class Dropdown Checkboxes if available
        if (typeof initMapelClassDropdown === 'function') {
            initMapelClassDropdown();
        }

        showToast("✅ 13 Master Data Kelas Bawaan berhasil disetup!", "success");
    } catch (err) {
        console.error(err);
        rawKelasList = DEFAULT_PRESET_KELAS;
        window.masterClasses = rawKelasList.map(k => k.nama);
        localStorage.setItem('smart_absen_kelas_list', JSON.stringify(rawKelasList));
        renderKelasTable(rawKelasList);
        showToast("✅ Preset Master Data Kelas lokal disetup!", "success");
    } finally {
        if (btnSeedKelasDefault) btnSeedKelasDefault.disabled = false;
    }
}

// Trigger Load on DOM Ready
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => loadKelasData());
} else {
    loadKelasData();
}
