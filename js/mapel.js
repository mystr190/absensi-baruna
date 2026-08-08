// ==========================================
// MANAJEMEN DATA MATA PELAJARAN (MAPEL) & TARGET KELAS
// ==========================================

const DEFAULT_PRESET_MAPEL = [
    { nama: 'Informatika', target_kelas: 'X-1, X-2, X-3, X-4, XI-1, XI-2, XI-3, XI-4, XII-5' },
    { nama: 'IT Preneur', target_kelas: 'X-1, X-2, X-3, X-4, XII-1, XII-2, XII-3, XII-4, XII-5' },
    { nama: 'Geografi', target_kelas: 'X-1, X-2, X-3, X-4, XI-1, XI-2, XII-1, XII-2' },
    { nama: 'Pendidikan Agama Islam', target_kelas: 'X-1, X-2, X-3, X-4, XI-1, XI-2, XI-3, XI-4, XII-1, XII-2, XII-3, XII-4, XII-5' },
    { nama: 'Bahasa Indonesia', target_kelas: 'X-1, X-2, X-3, X-4, XI-1, XI-2, XI-3, XI-4, XII-1, XII-2, XII-3, XII-4, XII-5' },
    { nama: 'Ekonomi', target_kelas: 'X-1, X-2, X-3, X-4, XI-1, XI-2, XII-1, XII-2, XII-3' },
    { nama: 'PJOK', target_kelas: 'X-1, X-2, X-3, X-4, XI-1, XI-2, XI-3, XI-4, XII-1, XII-2, XII-3, XII-4, XII-5' },
    { nama: 'Bahasa Jerman', target_kelas: 'XI-1, XI-2, XII-1, XII-2, XII-3' },
    { nama: 'Sosiologi', target_kelas: 'X-1, X-2, X-3, X-4, XI-1, XI-2, XII-1, XII-2, XII-3' },
    { nama: 'Matematika', target_kelas: 'X-1, X-2, X-3, X-4, XI-1, XI-2, XI-3, XI-4, XII-1, XII-2, XII-3, XII-4, XII-5' },
    { nama: 'Matematika TL', target_kelas: 'XI-3, XI-4, XII-4, XII-5' },
    { nama: 'Kimia', target_kelas: 'X-1, X-2, X-3, X-4, XI-3, XI-4, XII-4, XII-5' },
    { nama: 'Pendidikan Pancasila', target_kelas: 'X-1, X-2, X-3, X-4, XI-1, XI-2, XI-3, XI-4, XII-1, XII-2, XII-3, XII-4, XII-5' },
    { nama: 'Bahasa Inggris', target_kelas: 'X-1, X-2, X-3, X-4, XI-1, XI-2, XI-3, XI-4, XII-1, XII-2, XII-3, XII-4, XII-5' },
    { nama: 'Fisika', target_kelas: 'X-1, X-2, X-3, X-4, XI-3, XI-4, XII-4, XII-5' },
    { nama: 'Seni Rupa', target_kelas: 'X-1, X-2, X-3, X-4, XI-1, XI-2, XI-3, XI-4, XII-1, XII-2, XII-3, XII-4, XII-5' },
    { nama: 'Sejarah', target_kelas: 'X-1, X-2, X-3, X-4, XI-1, XI-2, XI-3, XI-4, XII-1, XII-2, XII-3, XII-4, XII-5' },
    { nama: 'Biologi', target_kelas: 'X-1, X-2, X-3, X-4, XI-3, XI-4, XII-3, XII-4' }
];

const PRESET_ALL_CLASSES = ['X-1', 'X-2', 'X-3', 'X-4', 'XI-1', 'XI-2', 'XI-3', 'XI-4', 'XII-1', 'XII-2', 'XII-3', 'XII-4', 'XII-5'];

let rawMapelList = [];
let editingOldMapelNama = null;

// Element References
const formMapel = document.getElementById('formMapel');
const inputNamaMapel = document.getElementById('inputNamaMapel');
const inputTargetKelasMapel = document.getElementById('inputTargetKelasMapel');
const inputSearchMapel = document.getElementById('inputSearchMapel');
const tableBodyMapel = document.getElementById('tableBodyMapel');
const btnSubmitMapel = document.getElementById('btnSubmitMapel');
const btnCancelEditMapel = document.getElementById('btnCancelEditMapel');
const btnSeedMapelDefault = document.getElementById('btnSeedMapelDefault');
const badgeTotalMapel = document.getElementById('badgeTotalMapel');

// Initialize Listener
if (formMapel) {
    formMapel.addEventListener('submit', handleFormMapelSubmit);
}

if (inputSearchMapel) {
    inputSearchMapel.addEventListener('input', () => {
        renderMapelTable(filterMapelData(inputSearchMapel.value));
    });
}

if (btnCancelEditMapel) {
    btnCancelEditMapel.addEventListener('click', resetMapelForm);
}

if (btnSeedMapelDefault) {
    btnSeedMapelDefault.addEventListener('click', seedMapelDefault);
}

// Get Available School Classes (from preset & active student master data)
function getAvailableClasses() {
    let classes = [...PRESET_ALL_CLASSES];
    const students = window.allStudents || JSON.parse(localStorage.getItem('smart_absen_students_cache') || '[]');
    if (Array.isArray(students)) {
        students.forEach(s => {
            const cls = String(s.kelas || '').trim();
            if (cls && !classes.includes(cls)) {
                classes.push(cls);
            }
        });
    }
    return classes.sort();
}

// Initialize Multi-Select Class Dropdown
function initMapelClassDropdown() {
    const btnToggle = document.getElementById('btnToggleClassDropdown');
    const menu = document.getElementById('dropdownTargetKelasMenu');
    const container = document.getElementById('containerMapelClassCheckboxes');

    if (!btnToggle || !menu || !container) return;

    // Render Checkboxes
    const classList = getAvailableClasses();
    let html = '';
    classList.forEach(cls => {
        const safeId = `mapel_cls_${cls.replace(/[^a-zA-Z0-9]/g, '_')}`;
        html += `
            <label style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--text-main); cursor: pointer; user-select: none; padding: 3px 6px; border-radius: 4px; transition: background 0.2s ease;">
                <input type="checkbox" class="chk-mapel-kelas" value="${cls}" id="${safeId}" style="cursor: pointer; accent-color: #3b82f6; width: 15px; height: 15px;">
                <span>${cls}</span>
            </label>`;
    });
    container.innerHTML = html;

    // Toggle Dropdown Menu
    btnToggle.onclick = (e) => {
        e.stopPropagation();
        const isOpen = menu.style.display === 'block';
        menu.style.display = isOpen ? 'none' : 'block';
    };

    // Close Dropdown Menu on Click Outside
    document.addEventListener('click', (e) => {
        const wrapper = document.getElementById('wrapperTargetKelasDropdown');
        if (wrapper && !wrapper.contains(e.target)) {
            menu.style.display = 'none';
        }
    });

    // Handle Checkbox Change
    container.addEventListener('change', () => {
        updateMapelSelectedClassesUI();
    });
}

function updateMapelSelectedClassesUI() {
    const checkboxes = document.querySelectorAll('.chk-mapel-kelas');
    const selected = [];
    checkboxes.forEach(chk => {
        if (chk.checked) selected.push(chk.value);
    });

    const hiddenInput = document.getElementById('inputTargetKelasMapel');
    const labelSpan = document.getElementById('selectedClassesText');

    const formattedVal = selected.join(', ');
    if (hiddenInput) hiddenInput.value = formattedVal;

    if (labelSpan) {
        if (selected.length === 0) {
            labelSpan.innerHTML = `<span style="color: #94a3b8;">-- Pilih Target Kelas --</span>`;
        } else if (selected.length <= 4) {
            const badges = selected.map(c => 
                `<span style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 600; margin-right: 3px; display: inline-block;">${c}</span>`
            ).join('');
            labelSpan.innerHTML = badges;
        } else {
            labelSpan.innerHTML = `<span style="color: #38bdf8; font-weight: 600;">${selected.length} Kelas Dipilih</span> <small style="color: var(--text-muted);">(${selected.slice(0, 3).join(', ')}...)</small>`;
        }
    }
}

function quickSelectMapelClass(type) {
    const checkboxes = document.querySelectorAll('.chk-mapel-kelas');
    checkboxes.forEach(chk => {
        const val = chk.value.toUpperCase();
        if (type === 'ALL') chk.checked = true;
        else if (type === 'NONE') chk.checked = false;
        else if (type === 'X' && val.startsWith('X-')) chk.checked = true;
        else if (type === 'XI' && val.startsWith('XI-')) chk.checked = true;
        else if (type === 'XII' && val.startsWith('XII-')) chk.checked = true;
    });
    updateMapelSelectedClassesUI();
}

function setMapelCheckboxesFromValue(targetKelasStr = '') {
    const selectedList = (targetKelasStr || '').split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    const checkboxes = document.querySelectorAll('.chk-mapel-kelas');
    checkboxes.forEach(chk => {
        chk.checked = selectedList.includes(chk.value.toUpperCase());
    });
    updateMapelSelectedClassesUI();
}

// Load Mapel Data from Server or Local Storage
async function loadMapelData(forceRefresh = false) {
    if (!tableBodyMapel) return;

    initMapelClassDropdown();

    const cacheKey = 'smart_absen_mapel_list';
    const cachedData = JSON.parse(localStorage.getItem(cacheKey) || 'null');

    if (!forceRefresh && cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
        rawMapelList = cachedData;
        renderMapelTable(filterMapelData(inputSearchMapel ? inputSearchMapel.value : ''));
    }

    try {
        const requestUrl = `${SCRIPT_URL}?action=get_mapel`;
        const result = await fetchWithRetry(requestUrl, { method: 'GET' }, 1, 1000);

        if (result && result.status === 'success' && Array.isArray(result.data)) {
            rawMapelList = result.data.length > 0 ? result.data : DEFAULT_PRESET_MAPEL;
            localStorage.setItem(cacheKey, JSON.stringify(rawMapelList));
            renderMapelTable(filterMapelData(inputSearchMapel ? inputSearchMapel.value : ''));
        } else if (!rawMapelList || rawMapelList.length === 0) {
            rawMapelList = DEFAULT_PRESET_MAPEL;
            localStorage.setItem(cacheKey, JSON.stringify(rawMapelList));
            renderMapelTable(rawMapelList);
        }
    } catch (err) {
        console.error("Gagal menarik data Mapel:", err);
        if (!rawMapelList || rawMapelList.length === 0) {
            rawMapelList = DEFAULT_PRESET_MAPEL;
            renderMapelTable(rawMapelList);
        }
    }
}

function filterMapelData(queryStr = '') {
    const q = queryStr.toLowerCase().trim();
    if (!q) return rawMapelList;
    return rawMapelList.filter(item => 
        (item.nama && item.nama.toLowerCase().includes(q)) ||
        (item.target_kelas && item.target_kelas.toLowerCase().includes(q))
    );
}

function renderMapelTable(dataList) {
    if (!tableBodyMapel) return;

    if (badgeTotalMapel) {
        badgeTotalMapel.innerText = `${dataList.length} Mata Pelajaran`;
    }

    if (!dataList || dataList.length === 0) {
        tableBodyMapel.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 25px;">
                    Tidak ada data Mata Pelajaran. Klik 'Setup Preset Mapel Bawaan' untuk mengisi 18 mapel otomatis.
                </td>
            </tr>`;
        return;
    }

    let html = '';
    dataList.forEach((item, index) => {
        const classes = (item.target_kelas || '-').split(',').map(c => c.trim()).filter(Boolean);
        const classBadges = classes.map(c => 
            `<span class="badge" style="background: rgba(59, 130, 246, 0.12); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.25); font-size: 0.78rem; padding: 2px 8px; border-radius: 6px; margin-right: 4px; margin-bottom: 4px; display: inline-block;">${c}</span>`
        ).join('');

        html += `
            <tr>
                <td style="text-align: center; font-weight: 600;">${index + 1}</td>
                <td><strong style="color: var(--text-main); font-size: 0.95rem;">${escapeHtml(item.nama)}</strong></td>
                <td>${classBadges || '<span style="color:var(--text-muted);">-</span>'}</td>
                <td style="text-align: center;">
                    <div style="display: flex; gap: 6px; justify-content: center;">
                        <button type="button" class="btn-secondary" onclick="editMapelItem('${escapeHtml(item.nama)}')" style="padding: 5px 10px; font-size: 0.8rem; border-color: rgba(56, 189, 248, 0.4); color: #38bdf8;" title="Edit Mapel">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button type="button" class="btn-secondary" onclick="deleteMapelItem('${escapeHtml(item.nama)}')" style="padding: 5px 10px; font-size: 0.8rem; border-color: rgba(239, 68, 68, 0.4); color: #fca5a5;" title="Hapus Mapel">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
    });

    tableBodyMapel.innerHTML = html;
}

async function handleFormMapelSubmit(e) {
    e.preventDefault();
    const nama = inputNamaMapel ? inputNamaMapel.value.trim() : '';
    const targetKelas = inputTargetKelasMapel ? inputTargetKelasMapel.value.trim() : '';

    if (!nama) {
        showToast("Nama Mata Pelajaran wajib diisi!", "warning");
        return;
    }

    if (btnSubmitMapel) btnSubmitMapel.disabled = true;

    try {
        const formData = new FormData();
        formData.append('action', 'save_mapel');
        formData.append('nama', nama);
        formData.append('target_kelas', targetKelas);
        if (editingOldMapelNama) {
            formData.append('old_nama', editingOldMapelNama);
        }

        const result = await fetchWithRetry(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(formData).toString()
        }, 0);

        // Update local memory list
        const existingIdx = rawMapelList.findIndex(m => m.nama.toLowerCase() === (editingOldMapelNama || nama).toLowerCase());
        if (existingIdx !== -1) {
            rawMapelList[existingIdx] = { nama, target_kelas: targetKelas };
        } else {
            rawMapelList.push({ nama, target_kelas: targetKelas });
        }

        localStorage.setItem('smart_absen_mapel_list', JSON.stringify(rawMapelList));
        renderMapelTable(filterMapelData(inputSearchMapel ? inputSearchMapel.value : ''));
        resetMapelForm();

        showToast(result && result.message ? `✅ ${result.message}` : "✅ Data Mata Pelajaran berhasil disimpan!", "success");
    } catch (err) {
        console.error(err);
        showToast("❌ Gagal menyimpan data Mata Pelajaran.", "error");
    } finally {
        if (btnSubmitMapel) btnSubmitMapel.disabled = false;
    }
}

function editMapelItem(namaItem) {
    const item = rawMapelList.find(m => m.nama === namaItem);
    if (!item) return;

    editingOldMapelNama = item.nama;
    if (inputNamaMapel) inputNamaMapel.value = item.nama;
    setMapelCheckboxesFromValue(item.target_kelas || '');

    if (btnSubmitMapel) btnSubmitMapel.innerHTML = `<span><i class="fa-solid fa-floppy-disk"></i> Update Mapel</span>`;
    if (btnCancelEditMapel) btnCancelEditMapel.style.display = 'inline-flex';

    if (inputNamaMapel) inputNamaMapel.focus();
}

function resetMapelForm() {
    editingOldMapelNama = null;
    if (formMapel) formMapel.reset();
    setMapelCheckboxesFromValue('');
    if (btnSubmitMapel) btnSubmitMapel.innerHTML = `<span><i class="fa-solid fa-plus"></i> Tambah Mapel</span>`;
    if (btnCancelEditMapel) btnCancelEditMapel.style.display = 'none';
}

async function deleteMapelItem(namaItem) {
    const confirmed = await showCustomConfirm({
        title: 'Hapus Mata Pelajaran',
        message: `Apakah Anda yakin ingin menghapus Mata Pelajaran '${namaItem}'?`,
        icon: 'danger',
        confirmText: 'Ya, Hapus Mapel',
        cancelText: 'Batal',
        danger: true
    });
    if (!confirmed) return;

    try {
        const formData = new FormData();
        formData.append('action', 'delete_mapel');
        formData.append('nama', namaItem);

        const requestUrlDel = SCRIPT_URL.includes('?') ? `${SCRIPT_URL}&action=delete_mapel` : `${SCRIPT_URL}?action=delete_mapel`;
        const result = await fetchWithRetry(requestUrlDel, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(formData).toString()
        }, 0);

        rawMapelList = rawMapelList.filter(m => m.nama !== namaItem);
        localStorage.setItem('smart_absen_mapel_list', JSON.stringify(rawMapelList));
        renderMapelTable(filterMapelData(inputSearchMapel ? inputSearchMapel.value : ''));

        showToast(result && result.message ? `✅ ${result.message}` : `✅ Mata Pelajaran '${namaItem}' berhasil dihapus!`, "success");
    } catch (err) {
        console.error(err);
        showToast("❌ Gagal menghapus Mata Pelajaran.", "error");
    }
}

async function seedMapelDefault() {
    const confirmed = await showCustomConfirm({
        title: 'Reset Preset Mata Pelajaran',
        message: 'Apakah Anda yakin ingin menyetel ulang Data Mata Pelajaran ke 18 Mapel Bawaan? Data perubahan custom akan diperbarui.',
        icon: 'warning',
        confirmText: 'Ya, Reset 18 Mapel',
        cancelText: 'Batal',
        danger: true
    });
    if (!confirmed) return;

    if (btnSeedMapelDefault) btnSeedMapelDefault.disabled = true;
    showToast("⏳ Menyiapkan 18 Preset Mata Pelajaran Bawaan...", "info");

    try {
        const formData = new FormData();
        formData.append('action', 'seed_default_mapel');

        const result = await fetchWithRetry(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(formData).toString()
        }, 0);

        rawMapelList = DEFAULT_PRESET_MAPEL;
        localStorage.setItem('smart_absen_mapel_list', JSON.stringify(rawMapelList));
        renderMapelTable(rawMapelList);

        showToast("✅ 18 Data Mata Pelajaran Bawaan berhasil disetup!", "success");
    } catch (err) {
        console.error(err);
        rawMapelList = DEFAULT_PRESET_MAPEL;
        localStorage.setItem('smart_absen_mapel_list', JSON.stringify(rawMapelList));
        renderMapelTable(rawMapelList);
        showToast("✅ Preset Mata Pelajaran lokal disetup!", "success");
    } finally {
        if (btnSeedMapelDefault) btnSeedMapelDefault.disabled = false;
    }
}

// Utility Helper
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Trigger Load on DOM Ready
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => loadMapelData());
} else {
    loadMapelData();
}
