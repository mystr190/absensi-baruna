/**
 * =========================================================================
 * MODUL PELANGGARAN TATA TERTIB SISWA (CLIENT SIDE LOGIC & REKAP STATISTIK)
 * =========================================================================
 */

let localPelanggaranLogs = JSON.parse(localStorage.getItem('smart_absen_recent_pelanggaran') || '[]');
let localJenisPelanggaran = JSON.parse(localStorage.getItem('smart_absen_jenis_pelanggaran') || JSON.stringify([
    "Datang Terlambat",
    "Tidak Memakai Dasi",
    "Tidak Memakai Ikat Pinggang",
    "Tidak Memakai Kacu Pramuka",
    "Tidak Memakai Ring Pramuka",
    "Tidak Memakai Sepatu",
    "Tidak Memakai Atribut yang sesuai aturan",
    "Keluar sekolah tanpa Izin",
    "Bersolek",
    "Berbicara menggunakan bahasa yang tidak pantas",
    "Lainnya"
]));

let isPelanggaranInitialized = false;
let isFetchingPelanggaran = false;

async function fetchPelanggaranLogsFromServer() {
    if (isFetchingPelanggaran) return;
    isFetchingPelanggaran = true;
    try {
        const json = await fetchWithRetry(`${SCRIPT_URL}?action=get_pelanggaran`, { method: 'GET' }, 2, 800);
        if (json && json.status === 'success' && Array.isArray(json.data)) {
            localPelanggaranLogs = json.data;
            localStorage.setItem('smart_absen_recent_pelanggaran', JSON.stringify(localPelanggaranLogs));
            renderPelanggaranPanel();
        }
    } catch(e) {
        console.warn("Auto-fetch pelanggaran logs failed:", e);
    } finally {
        isFetchingPelanggaran = false;
    }
}

// Initialize event listeners when DOM is loaded or ready
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => {
        initPelanggaranModule();
    });
} else {
    initPelanggaranModule();
}

function initPelanggaranModule() {
    if (isPelanggaranInitialized) return;
    isPelanggaranInitialized = true;

    // 1. Set Default Date input to Today
    const inputTgl = document.getElementById('inputTglPelanggaran');
    if (inputTgl && !inputTgl.value) {
        const today = new Date().toISOString().split('T')[0];
        inputTgl.value = today;
    }

    // 2. Toggle Form Input Pelanggaran
    const btnToggleForm = document.getElementById('btnToggleFormPelanggaran');
    const containerForm = document.getElementById('containerFormPelanggaran');
    const btnCloseForm = document.getElementById('btnCloseFormPelanggaran');

    if (btnToggleForm && containerForm) {
        btnToggleForm.addEventListener('click', (e) => {
            e.preventDefault();
            const isHidden = containerForm.style.display === 'none' || containerForm.style.display === '';
            containerForm.style.display = isHidden ? 'block' : 'none';
            if (isHidden) {
                populateFormDropdowns();
                containerForm.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    if (btnCloseForm && containerForm) {
        btnCloseForm.addEventListener('click', (e) => {
            e.preventDefault();
            containerForm.style.display = 'none';
        });
    }

    // 3. Toggle Modal Kelola Jenis Pelanggaran
    const btnManageJenis = document.getElementById('btnManageJenisPelanggaran');
    const containerManageModal = document.getElementById('containerManageJenisModal');
    const btnCloseManageModal = document.getElementById('btnCloseManageJenisModal');

    if (btnManageJenis && containerManageModal) {
        btnManageJenis.addEventListener('click', (e) => {
            e.preventDefault();
            const isHidden = containerManageModal.style.display === 'none' || containerManageModal.style.display === '';
            containerManageModal.style.display = isHidden ? 'block' : 'none';
            if (isHidden) {
                renderJenisPelanggaranBadgesList();
                containerManageModal.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    if (btnCloseManageModal && containerManageModal) {
        btnCloseManageModal.addEventListener('click', (e) => {
            e.preventDefault();
            containerManageModal.style.display = 'none';
        });
    }

    // 4. Handle Select Kelas -> Populate Select Siswa
    const selectKelas = document.getElementById('selectKelasPelanggaran');
    if (selectKelas) {
        selectKelas.addEventListener('change', (e) => {
            const kelas = e.target.value;
            populateSiswaDropdown(kelas);
        });
    }

    // Check Admin Role for Kelola Jenis Pelanggaran Button
    const loggedUser = JSON.parse(localStorage.getItem('smart_absen_user') || '{}');
    if (btnManageJenis) {
        btnManageJenis.style.display = (loggedUser.role === 'Admin') ? 'inline-flex' : 'none';
    }

    // 5. Handle Search/Select Siswa -> Auto-fill NIS & Kelas
    const inputSearchSiswa = document.getElementById('inputSearchSiswaPelanggaran');
    const hiddenSelectSiswa = document.getElementById('selectSiswaPelanggaran');
    const inputNis = document.getElementById('inputNisPelanggaran');

    if (inputSearchSiswa) {
        inputSearchSiswa.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            if (hiddenSelectSiswa) hiddenSelectSiswa.value = val;

            const student = window.allStudents ? window.allStudents.find(s => s.nama.toLowerCase() === val.toLowerCase()) : null;
            if (student) {
                if (inputNis) inputNis.value = student.nis || student.nisn || '';
                if (selectKelas && (!selectKelas.value || selectKelas.value !== String(student.kelas))) {
                    selectKelas.value = student.kelas;
                }
            } else {
                if (inputNis) inputNis.value = '';
            }
        });
    }

    // 6. Handle Submit Form Input Pelanggaran
    const formInput = document.getElementById('formInputPelanggaran');
    if (formInput) {
        formInput.addEventListener('submit', handleSavePelanggaran);
    }

    // 7. Handle Submit Form Add Jenis Pelanggaran
    const formAddJenis = document.getElementById('formAddJenisPelanggaran');
    if (formAddJenis) {
        formAddJenis.addEventListener('submit', handleAddJenisPelanggaranSubmit);
    }

    // 8. Filter Change Listeners
    ['filterPelanggaranSearch', 'filterPelanggaranKelas', 'filterPelanggaranJenis', 'filterPelanggaranBulan'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', renderPelanggaranPanel);
            el.addEventListener('change', renderPelanggaranPanel);
        }
    });

    // 9. Print & Export Buttons
    const btnPrint = document.getElementById('btnPrintPelanggaran');
    if (btnPrint) {
        btnPrint.addEventListener('click', () => {
            updatePrintTitles();
            window.print();
        });
    }

    const btnExport = document.getElementById('btnExportPelanggaran');
    if (btnExport) {
        btnExport.addEventListener('click', exportPelanggaranToCSV);
    }
}

// Global Hook dipanggil dari sync master data (main.js)
window.updatePelanggaranMasterData = function(pelanggaranLogs, jenisList) {
    if (Array.isArray(pelanggaranLogs) && pelanggaranLogs.length > 0) {
        localPelanggaranLogs = pelanggaranLogs;
        try {
            localStorage.setItem('smart_absen_recent_pelanggaran', JSON.stringify(localPelanggaranLogs));
        } catch(e) {}
    }
    if (Array.isArray(jenisList) && jenisList.length > 0) {
        localJenisPelanggaran = jenisList;
        try {
            localStorage.setItem('smart_absen_jenis_pelanggaran', JSON.stringify(localJenisPelanggaran));
        } catch(e) {}
    }
    populateFilterDropdowns();
    renderPelanggaranPanel();
};

function populateFormDropdowns() {
    // Populate Kelas Form Select
    const selectKelas = document.getElementById('selectKelasPelanggaran');
    if (selectKelas) {
        const classes = window.allStudents ? [...new Set(window.allStudents.map(s => s.kelas).filter(Boolean))].sort() : [];
        selectKelas.innerHTML = '<option value="">-- Pilih Kelas --</option>' + 
            classes.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    // Populate Siswa Search Datalist
    populateSiswaDropdown(selectKelas ? selectKelas.value : '');

    // Populate Jenis Pelanggaran Form Select
    populateJenisPelanggaranSelect('selectJenisPelanggaran');

    // Auto-fill Input Guru Pelapor (Readonly dari User Login)
    const inputGuru = document.getElementById('inputGuruPelapor');
    if (inputGuru) {
        const loggedUser = JSON.parse(localStorage.getItem('smart_absen_user') || '{}');
        const loggedName = loggedUser.nama || loggedUser.namaLengkap || loggedUser.username || 'Petugas';
        inputGuru.value = loggedName;
    }
}

function populateSiswaDropdown(kelasStr) {
    const inputSearch = document.getElementById('inputSearchSiswaPelanggaran');
    const datalist = document.getElementById('datalistSiswaPelanggaran');
    const hiddenSelect = document.getElementById('selectSiswaPelanggaran');
    const inputNis = document.getElementById('inputNisPelanggaran');

    if (inputSearch) inputSearch.value = '';
    if (hiddenSelect) hiddenSelect.value = '';
    if (inputNis) inputNis.value = '';

    let students = window.allStudents || [];
    if (kelasStr) {
        students = students.filter(s => String(s.kelas) === String(kelasStr));
    }

    students.sort((a, b) => a.nama.localeCompare(b.nama));

    if (datalist) {
        datalist.innerHTML = students.map(s => 
            `<option value="${s.nama}">${s.nama} (${s.kelas}) - NIS: ${s.nis || s.nisn || '-'}</option>`
        ).join('');
    }

    if (inputSearch) {
        inputSearch.placeholder = students.length > 0 
            ? `🔍 Ketik / cari nama siswa (${students.length} siswa)...` 
            : 'Belum ada siswa...';
    }
}

function populateJenisPelanggaranSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '<option value="">-- Pilih Jenis Pelanggaran --</option>' + 
        localJenisPelanggaran.map(j => `<option value="${j}">${j}</option>`).join('');
}

function populateFilterDropdowns() {
    // Populate Kelas Filter
    const filterKelas = document.getElementById('filterPelanggaranKelas');
    if (filterKelas && filterKelas.options.length <= 1) {
        const classes = window.allStudents ? [...new Set(window.allStudents.map(s => s.kelas).filter(Boolean))].sort() : [];
        filterKelas.innerHTML = '<option value="Semua">Semua Kelas</option>' + 
            classes.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    // Populate Jenis Pelanggaran Filter
    const filterJenis = document.getElementById('filterPelanggaranJenis');
    if (filterJenis) {
        const currentVal = filterJenis.value;
        filterJenis.innerHTML = '<option value="Semua">Semua Jenis Pelanggaran</option>' + 
            localJenisPelanggaran.map(j => `<option value="${j}" ${currentVal === j ? 'selected' : ''}>${j}</option>`).join('');
    }
}

// Render UI Panel Pelanggaran & Dynamic Statistics
function renderPelanggaranPanel() {
    initPelanggaranModule();
    populateFilterDropdowns();
    updatePrintTitles();

    if (localPelanggaranLogs.length === 0 && !isFetchingPelanggaran) {
        fetchPelanggaranLogsFromServer();
    }

    const searchVal = (document.getElementById('filterPelanggaranSearch')?.value || '').toLowerCase().trim();
    const kelasVal = document.getElementById('filterPelanggaranKelas')?.value || 'Semua';
    const jenisVal = document.getElementById('filterPelanggaranJenis')?.value || 'Semua';
    const bulanVal = document.getElementById('filterPelanggaranBulan')?.value || '';

    // Filter Logs
    let filteredLogs = localPelanggaranLogs.filter(item => {
        // Search filter
        if (searchVal) {
            const matchNama = (item.nama || '').toLowerCase().includes(searchVal);
            const matchNis = (item.nis || item.nisn || '').toLowerCase().includes(searchVal);
            const matchGuru = (item.guruPelapor || '').toLowerCase().includes(searchVal);
            const matchKet = (item.keterangan || '').toLowerCase().includes(searchVal);
            if (!matchNama && !matchNis && !matchGuru && !matchKet) return false;
        }

        // Kelas filter
        if (kelasVal !== 'Semua' && String(item.kelas) !== String(kelasVal)) {
            return false;
        }

        // Jenis filter
        if (jenisVal !== 'Semua' && String(item.pelanggaran) !== String(jenisVal)) {
            return false;
        }

        // Bulan filter (YYYY-MM)
        if (bulanVal && item.tanggal) {
            const tStr = String(item.tanggal).trim();
            let itemMonth = '';
            if (tStr.includes('-')) {
                const parts = tStr.split('-');
                if (parts.length >= 2) {
                    itemMonth = `${parts[0]}-${parts[1].padStart(2, '0')}`;
                }
            } else if (tStr.includes('/')) {
                const parts = tStr.split('/');
                if (parts.length === 3) {
                    if (parts[2].length === 4) {
                        itemMonth = `${parts[2]}-${parts[1].padStart(2, '0')}`;
                    } else if (parts[0].length === 4) {
                        itemMonth = `${parts[0]}-${parts[1].padStart(2, '0')}`;
                    }
                }
            }
            if (itemMonth && itemMonth !== bulanVal) return false;
        }

        return true;
    });

    // Check Admin Role for Sidebar Widgets (Rekap & Keaktifan Guru)
    const loggedUser = JSON.parse(localStorage.getItem('smart_absen_user') || '{}');
    const isAdmin = loggedUser.role === 'Admin';

    const sidebarWidgets = document.getElementById('sidebarWidgetsPelanggaran');
    const layoutGrid = document.getElementById('pelanggaranLayoutGrid');

    if (sidebarWidgets) {
        sidebarWidgets.style.display = isAdmin ? 'flex' : 'none';
    }
    if (layoutGrid) {
        layoutGrid.style.gridTemplateColumns = isAdmin ? '2.2fr 1fr' : '1fr';
    }

    // 1. Render Main Table
    renderMainPelanggaranTable(filteredLogs);

    // 2 & 3. Render Widgets only for Admin
    if (isAdmin) {
        renderRekapJenisPelanggaranTable(filteredLogs);
        renderKeaktifanGuruTable(filteredLogs);
    }
}

function renderMainPelanggaranTable(logs) {
    const container = document.getElementById('mainPelanggaranTableContainer');
    if (!container) return;

    if (logs.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fa-solid fa-clipboard-list" style="font-size: 2rem; display: block; margin-bottom: 10px;"></i>
                Belum ada data catatan pelanggaran yang tercatat.
            </div>
        `;
        return;
    }

    let html = `
        <table class="pelanggaran-table" style="width: 100%; border-collapse: collapse; font-size: 0.88rem;">
            <thead>
                <tr style="background: rgba(255,255,255,0.08); text-align: left; border-bottom: 2px solid var(--card-border);">
                    <th style="padding: 10px 12px; width: 40px; text-align: center;">No</th>
                    <th style="padding: 10px 12px; width: 110px;">Tanggal</th>
                    <th style="padding: 10px 12px; width: 80px;">NIS</th>
                    <th style="padding: 10px 12px;">Nama Siswa</th>
                    <th style="padding: 10px 12px; width: 80px;">Kelas</th>
                    <th style="padding: 10px 12px;">Pelanggaran yang dilakukan</th>
                    <th style="padding: 10px 12px;">Nama Guru Melaporkan</th>
                    <th style="padding: 10px 12px;">Keterangan</th>
                    <th style="padding: 10px 12px; width: 60px; text-align: center;">Aksi</th>
                </tr>
            </thead>
            <tbody>
    `;

    logs.forEach((item, index) => {
        const badgeClass = getBadgeClassForPelanggaran(item.pelanggaran);
        const formatTgl = formatDisplayDate(item.tanggal);

        html += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 9px 12px; text-align: center; font-weight: 500;">${index + 1}</td>
                <td style="padding: 9px 12px; white-space: nowrap;">${formatTgl}</td>
                <td style="padding: 9px 12px; font-family: monospace;">${item.nis || item.nisn || '-'}</td>
                <td style="padding: 9px 12px; font-weight: 600;">${item.nama}</td>
                <td style="padding: 9px 12px;">${item.kelas}</td>
                <td style="padding: 9px 12px;">
                    <span class="badge-pelanggaran ${badgeClass}">${item.pelanggaran}</span>
                </td>
                <td style="padding: 9px 12px; color: #93c5fd;">${item.guruPelapor || 'Petugas'}</td>
                <td style="padding: 9px 12px; font-style: italic; color: #cbd5e1;">${item.keterangan || '-'}</td>
                <td style="padding: 9px 12px; text-align: center;">
                    <button type="button" onclick="deletePelanggaranRecord('${item.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1.1rem;" title="Hapus Catatan"><i class="fa-solid fa-trash-can"></i></button>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

function renderRekapJenisPelanggaranTable(logs) {
    const container = document.getElementById('tableRekapJenisPelanggaranContainer');
    const badgeTotal = document.getElementById('badgeTotalDataTerisi');
    if (!container) return;

    const totalLogs = logs.length;
    if (badgeTotal) badgeTotal.innerText = `DATA TERISI: ${totalLogs}`;

    // Count per jenis pelanggaran
    const counts = {};
    localJenisPelanggaran.forEach(j => counts[j] = 0);

    logs.forEach(item => {
        const p = item.pelanggaran || 'Lainnya';
        if (counts[p] !== undefined) {
            counts[p]++;
        } else {
            counts[p] = (counts[p] || 0) + 1;
        }
    });

    let html = `
        <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
            <thead>
                <tr style="background: rgba(255,255,255,0.05); border-bottom: 1px solid var(--card-border);">
                    <th style="padding: 6px 8px; text-align: center; width: 30px;">NO</th>
                    <th style="padding: 6px 8px; text-align: left;">Jenis Pelanggaran</th>
                    <th style="padding: 6px 8px; text-align: center; width: 60px;">Jumlah</th>
                    <th style="padding: 6px 8px; text-align: right; width: 75px;">Presentase</th>
                </tr>
            </thead>
            <tbody>
    `;

    let grandTotal = 0;
    let sumPct = 0;
    const allKinds = [...new Set([...localJenisPelanggaran, ...logs.map(l => l.pelanggaran).filter(Boolean)])];

    allKinds.forEach((jName, idx) => {
        const count = counts[jName] || 0;
        grandTotal += count;
        const pctNum = totalLogs > 0 ? (count / totalLogs) * 100 : 0;
        sumPct += pctNum;
        const pctStr = pctNum.toFixed(2) + '%';

        html += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                <td style="padding: 5px 8px; text-align: center;">${idx + 1}</td>
                <td style="padding: 5px 8px;">${jName}</td>
                <td style="padding: 5px 8px; text-align: center; font-weight: 600;">${count}</td>
                <td style="padding: 5px 8px; text-align: right; font-family: monospace;">${pctStr}</td>
            </tr>
        `;
    });

    const totalPctString = totalLogs > 0 ? (sumPct >= 99.9 ? '100.00%' : sumPct.toFixed(2) + '%') : '0.00%';

    html += `
            <tr style="background: rgba(255,255,255,0.08); font-weight: bold; border-top: 2px solid var(--card-border);">
                <td colspan="2" style="padding: 7px 8px; text-align: right;">TOTAL</td>
                <td style="padding: 7px 8px; text-align: center; color: #f59e0b;">${grandTotal}</td>
                <td style="padding: 7px 8px; text-align: right; color: #f59e0b;">${totalPctString}</td>
            </tr>
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

function renderKeaktifanGuruTable(logs) {
    const container = document.getElementById('tableKeaktifanGuruContainer');
    if (!container) return;

    const totalLogs = logs.length;

    // Get list of registered teachers from database (+ logged-in user + teachers who actually reported logs)
    const loggedUser = JSON.parse(localStorage.getItem('smart_absen_user') || '{}');
    const loggedName = loggedUser.nama || loggedUser.namaLengkap || loggedUser.username || '';

    let teachersList = [];
    if (window.allTeachers && window.allTeachers.length > 0) {
        teachersList = window.allTeachers.map(u => u.namaLengkap || u.nama || u.username);
    } else if (loggedName) {
        teachersList = [loggedName];
    }
    
    // Only registered accounts, logged user, and teachers with recorded logs
    teachersList = [...new Set([...teachersList, loggedName, ...logs.map(l => l.guruPelapor).filter(Boolean)])].filter(Boolean);

    const counts = {};
    teachersList.forEach(g => counts[g] = 0);

    logs.forEach(item => {
        const g = item.guruPelapor || 'Petugas';
        if (counts[g] !== undefined) {
            counts[g]++;
        } else {
            counts[g] = (counts[g] || 0) + 1;
        }
    });

    let html = `
        <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
            <thead>
                <tr style="background: rgba(255,255,255,0.05); border-bottom: 1px solid var(--card-border);">
                    <th style="padding: 6px 8px; text-align: center; width: 30px;">No</th>
                    <th style="padding: 6px 8px; text-align: left;">Nama Guru</th>
                    <th style="padding: 6px 8px; text-align: center; width: 60px;">Jumlah</th>
                    <th style="padding: 6px 8px; text-align: right; width: 75px;">Presentase</th>
                </tr>
            </thead>
            <tbody>
    `;

    let totalGuruCount = 0;
    let sumGuruPct = 0;

    teachersList.forEach((gName, idx) => {
        const count = counts[gName] || 0;
        totalGuruCount += count;
        const pctNum = totalLogs > 0 ? (count / totalLogs) * 100 : 0;
        sumGuruPct += pctNum;
        const pctStr = pctNum.toFixed(2) + '%';

        html += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                <td style="padding: 5px 8px; text-align: center;">${idx + 1}</td>
                <td style="padding: 5px 8px;">${gName}</td>
                <td style="padding: 5px 8px; text-align: center; font-weight: 600;">${count}</td>
                <td style="padding: 5px 8px; text-align: right; font-family: monospace;">${pctStr}</td>
            </tr>
        `;
    });

    const totalGuruPctString = totalLogs > 0 ? (sumGuruPct >= 99.9 ? '100.00%' : sumGuruPct.toFixed(2) + '%') : '0.00%';

    html += `
            <tr style="background: rgba(255,255,255,0.08); font-weight: bold; border-top: 2px solid var(--card-border);">
                <td colspan="2" style="padding: 7px 8px; text-align: right;">TOTAL</td>
                <td style="padding: 7px 8px; text-align: center; color: #3b82f6;">${totalGuruCount}</td>
                <td style="padding: 7px 8px; text-align: right; color: #3b82f6;">${totalGuruPctString}</td>
            </tr>
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

function renderJenisPelanggaranBadgesList() {
    const container = document.getElementById('listJenisPelanggaranContainer');
    if (!container) return;

    if (localJenisPelanggaran.length === 0) {
        container.innerHTML = `<span style="color:var(--text-muted); font-size:0.85rem;">Belum ada jenis pelanggaran.</span>`;
        return;
    }

    container.innerHTML = localJenisPelanggaran.map(j => `
        <span style="display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); padding: 5px 10px; border-radius: 16px; font-size: 0.82rem; color: white;">
            <span>${j}</span>
            <button type="button" onclick="deleteJenisPelanggaranHandler('${j}')" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.85rem; padding: 0 2px;" title="Hapus"><i class="fa-solid fa-xmark"></i></button>
        </span>
    `).join('');
}

// Handlers Simpan & Hapus Catatan Pelanggaran
async function handleSavePelanggaran(e) {
    e.preventDefault();

    const tgl = document.getElementById('inputTglPelanggaran')?.value;
    const kelas = document.getElementById('selectKelasPelanggaran')?.value;
    const nama = (document.getElementById('inputSearchSiswaPelanggaran')?.value || document.getElementById('selectSiswaPelanggaran')?.value || '').trim();
    const nis = document.getElementById('inputNisPelanggaran')?.value;
    const pelanggaran = document.getElementById('selectJenisPelanggaran')?.value;
    const keterangan = document.getElementById('inputKeteranganPelanggaran')?.value || '';

    const loggedUser = JSON.parse(localStorage.getItem('smart_absen_user') || '{}');
    const loggedName = loggedUser.nama || loggedUser.namaLengkap || loggedUser.username || 'Petugas';
    const guruPelapor = document.getElementById('inputGuruPelapor')?.value || loggedName;

    if (!tgl || !kelas || !nama || !pelanggaran) {
        showToast('Tolong lengkapi semua bidang form yang wajib.', 'error');
        return;
    }

    // Find NISN if available
    let nisn = '';
    const student = window.allStudents ? window.allStudents.find(s => s.nama === nama && String(s.kelas) === String(kelas)) : null;
    if (student) {
        nisn = student.nisn || '';
    }

    const payload = {
        tanggal: tgl,
        nisn: nisn,
        nis: nis,
        nama: nama,
        kelas: kelas,
        pelanggaran: pelanggaran,
        guruPelapor: guruPelapor,
        keterangan: keterangan
    };

    const btnSave = document.getElementById('btnSimpanPelanggaran');
    if (btnSave) btnSave.disabled = true;

    showToast('Menyimpan catatan pelanggaran ke server...', 'info');

    // Optimistic Local Update
    const tempId = 'PEL-' + Date.now();
    const newLogItem = {
        id: tempId,
        waktu: new Date().toISOString(),
        ...payload
    };
    localPelanggaranLogs.unshift(newLogItem);
    try {
        localStorage.setItem('smart_absen_recent_pelanggaran', JSON.stringify(localPelanggaranLogs));
    } catch(e) {}
    renderPelanggaranPanel();

    // Reset Form Input
    if (document.getElementById('inputSearchSiswaPelanggaran')) document.getElementById('inputSearchSiswaPelanggaran').value = '';
    if (document.getElementById('selectSiswaPelanggaran')) document.getElementById('selectSiswaPelanggaran').value = '';
    if (document.getElementById('inputNisPelanggaran')) document.getElementById('inputNisPelanggaran').value = '';
    if (document.getElementById('inputKeteranganPelanggaran')) document.getElementById('inputKeteranganPelanggaran').value = '';

    try {
        const formData = new URLSearchParams();
        formData.append('action', 'add_pelanggaran');
        formData.append('data', JSON.stringify(payload));

        const json = await fetchWithRetry(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        }, 2, 800);

        if (json && json.status === 'success') {
            showToast('✅ Catatan pelanggaran berhasil disimpan!', 'success');
            if (json.data && json.data.id) {
                newLogItem.id = json.data.id;
            }
        } else {
            showToast('⚠️ Gagal simpan ke server: ' + (json ? json.message : 'Error'), 'error');
        }
    } catch (err) {
        showToast('⚠️ Koneksi gagal. Catatan tersimpan secara lokal.', 'error');
    } finally {
        if (btnSave) btnSave.disabled = false;
    }
}

async function deletePelanggaranRecord(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus catatan pelanggaran ini?')) return;

    // Optimistic Remove
    localPelanggaranLogs = localPelanggaranLogs.filter(l => String(l.id) !== String(id));
    try {
        localStorage.setItem('smart_absen_recent_pelanggaran', JSON.stringify(localPelanggaranLogs));
    } catch(e) {}
    renderPelanggaranPanel();
    showToast('Menghapus catatan pelanggaran...', 'info');

    try {
        const formData = new URLSearchParams();
        formData.append('action', 'delete_pelanggaran');
        formData.append('id', id);

        const json = await fetchWithRetry(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        }, 2, 800);

        if (json && json.status === 'success') {
            showToast('✅ Catatan pelanggaran berhasil dihapus.', 'success');
        } else {
            showToast('⚠️ Server response: ' + (json ? json.message : 'Error'), 'error');
        }
    } catch (err) {
        showToast('⚠️ Gagal terhubung ke server untuk menghapus.', 'error');
    }
}

async function handleAddJenisPelanggaranSubmit(e) {
    e.preventDefault();
    const inputBaru = document.getElementById('inputNamaJenisPelanggaranBaru');
    if (!inputBaru || !inputBaru.value.trim()) return;

    const namaBaru = inputBaru.value.trim();
    if (localJenisPelanggaran.includes(namaBaru)) {
        showToast('Jenis pelanggaran ini sudah ada!', 'error');
        return;
    }

    localJenisPelanggaran.push(namaBaru);
    inputBaru.value = '';
    renderJenisPelanggaranBadgesList();
    populateJenisPelanggaranSelect('selectJenisPelanggaran');
    populateFilterDropdowns();

    showToast('Menambahkan jenis pelanggaran baru...', 'info');

    try {
        const formData = new URLSearchParams();
        formData.append('action', 'add_jenis_pelanggaran');
        formData.append('nama', namaBaru);

        const json = await fetchWithRetry(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        }, 2, 800);

        if (json && json.status === 'success') {
            showToast('✅ Jenis pelanggaran baru tersimpan ke database.', 'success');
        }
    } catch (e) {
        showToast('⚠️ Tersimpan di lokal.', 'error');
    }
}

async function deleteJenisPelanggaranHandler(namaJenis) {
    if (!confirm(`Hapus jenis pelanggaran "${namaJenis}"?`)) return;

    localJenisPelanggaran = localJenisPelanggaran.filter(j => j !== namaJenis);
    renderJenisPelanggaranBadgesList();
    populateJenisPelanggaranSelect('selectJenisPelanggaran');
    populateFilterDropdowns();

    try {
        const formData = new URLSearchParams();
        formData.append('action', 'delete_jenis_pelanggaran');
        formData.append('id', namaJenis);

        await fetchWithRetry(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        }, 2, 800);
        showToast('✅ Jenis pelanggaran berhasil dihapus.', 'success');
    } catch (e) {}
}

// Helpers & Utilities
function getBadgeClassForPelanggaran(text) {
    if (!text) return 'badge-pelanggaran-lainnya';
    const t = text.toLowerCase();
    if (t.includes('terlambat')) return 'badge-pelanggaran-terlambat';
    if (t.includes('dasi')) return 'badge-pelanggaran-dasi';
    if (t.includes('pinggang')) return 'badge-pelanggaran-pinggang';
    if (t.includes('kacu')) return 'badge-pelanggaran-kacu';
    if (t.includes('ring')) return 'badge-pelanggaran-ring';
    if (t.includes('sepatu')) return 'badge-pelanggaran-sepatu';
    if (t.includes('atribut')) return 'badge-pelanggaran-atribut';
    if (t.includes('izin')) return 'badge-pelanggaran-izin';
    if (t.includes('solek')) return 'badge-pelanggaran-solek';
    if (t.includes('bahasa')) return 'badge-pelanggaran-bahasa';
    return 'badge-pelanggaran-lainnya';
}

function formatDisplayDate(dateStr) {
    if (!dateStr) return '-';
    try {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
            const d = parseInt(parts[2], 10);
            const m = parseInt(parts[1], 10) - 1;
            const y = parts[0];
            return `${d} ${months[m] || ''} ${y}`;
        }
    } catch (e) {}
    return dateStr;
}

function updatePrintTitles() {
    const cachedConfig = JSON.parse(localStorage.getItem('smart_absen_config') || '{}');
    const namaSekolah = cachedConfig.namaSekolah || 'SMA 1 BARUNAWATI';
    const tahunPelajaran = cachedConfig.tahunPelajaran || '2026-2027';

    const pTitle = document.getElementById('printSchoolTitlePelanggaran');
    const pSub = document.getElementById('printSchoolSubTitlePelanggaran');

    if (pTitle) pTitle.innerText = `DAFTAR CATATAN PELANGGARAN TATA TERTIB PESERTA DIDIK ${namaSekolah.toUpperCase()}`;
    if (pSub) pSub.innerText = `TAHUN PELAJARAN ${tahunPelajaran}`;
}

function exportPelanggaranToCSV() {
    if (localPelanggaranLogs.length === 0) {
        showToast('Tidak ada data pelanggaran untuk di-export.', 'error');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "No,Tanggal,NIS,Nama Siswa,Kelas,Pelanggaran Yang Dilakukan,Nama Guru Melaporkan,Keterangan\n";

    localPelanggaranLogs.forEach((item, index) => {
        const row = [
            index + 1,
            `"${item.tanggal || ''}"`,
            `"${item.nis || item.nisn || ''}"`,
            `"${(item.nama || '').replace(/"/g, '""')}"`,
            `"${item.kelas || ''}"`,
            `"${(item.pelanggaran || '').replace(/"/g, '""')}"`,
            `"${(item.guruPelapor || '').replace(/"/g, '""')}"`,
            `"${(item.keterangan || '').replace(/"/g, '""')}"`
        ];
        csvContent += row.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Catatan_Pelanggaran_Siswa_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('✅ Berhasil mengunduh laporan CSV pelanggaran!', 'success');
}
