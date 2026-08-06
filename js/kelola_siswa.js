// =========================================================================
// MODUL KELOLA DATA SISWA (CRUD SATUAN & BULK IMPORT/EXPORT EXCEL)
// =========================================================================

let studentCurrentPage = 1;
const studentPageSize = 25;
let parsedExcelData = [];

// Event listener saat dokumen selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
    initKelolaSiswaEvents();
});

function initKelolaSiswaEvents() {
    const inputSearch = document.getElementById('inputSearchStudent');
    const selectKelas = document.getElementById('selectFilterKelasSiswa');
    
    if (inputSearch) {
        inputSearch.addEventListener('input', () => {
            studentCurrentPage = 1;
            renderTableSiswa();
        });
    }

    if (selectKelas) {
        selectKelas.addEventListener('change', () => {
            studentCurrentPage = 1;
            renderTableSiswa();
        });
    }

    // Modal Satuan (Tambah/Edit)
    const btnOpenAdd = document.getElementById('btnOpenModalAddStudent');
    const btnCloseAdd = document.getElementById('btnCloseModalSiswa');
    const btnCancelAdd = document.getElementById('btnCancelModalSiswa');
    const formSingle = document.getElementById('formSiswaSingle');

    if (btnOpenAdd) btnOpenAdd.addEventListener('click', openModalAddStudent);
    if (btnCloseAdd) btnCloseAdd.addEventListener('click', closeModalSiswa);
    if (btnCancelAdd) btnCancelAdd.addEventListener('click', closeModalSiswa);
    if (formSingle) formSingle.addEventListener('submit', handleSaveStudentSingle);

    // Modal Import Excel
    const btnOpenImport = document.getElementById('btnOpenModalImportExcel');
    const btnCloseImport = document.getElementById('btnCloseModalImport');
    const btnCancelImport = document.getElementById('btnCancelModalImport');
    const dropZone = document.getElementById('dropZoneExcel');
    const inputExcel = document.getElementById('inputExcelFile');
    const btnSubmitImport = document.getElementById('btnSubmitImportExcel');
    const btnDownloadTemplate = document.getElementById('btnDownloadFormatExcel');

    if (btnOpenImport) btnOpenImport.addEventListener('click', openModalImportExcel);
    if (btnCloseImport) btnCloseImport.addEventListener('click', closeModalImportExcel);
    if (btnCancelImport) btnCancelImport.addEventListener('click', closeModalImportExcel);

    if (inputExcel) {
        inputExcel.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                handleProcessExcelFile(e.target.files[0]);
            }
        });
    }

    if (dropZone) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.background = 'rgba(16, 185, 129, 0.15)';
        });
        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.style.background = 'rgba(16, 185, 129, 0.05)';
        });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.background = 'rgba(16, 185, 129, 0.05)';
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleProcessExcelFile(e.dataTransfer.files[0]);
            }
        });
    }

    if (btnSubmitImport) btnSubmitImport.addEventListener('click', uploadBulkStudentsToServer);
    if (btnDownloadTemplate) btnDownloadTemplate.addEventListener('click', downloadExcelTemplate);
}

// 1. RENDER TABLE & STATS SISWA
function renderTableSiswa() {
    const tbody = document.getElementById('tbodyKelolaSiswa');
    const countInfo = document.getElementById('studentCountInfo');
    const paginationContainer = document.getElementById('studentPaginationContainer');
    if (!tbody) return;

    const students = window.allStudents || localMasterStudents || [];

    // Filter Kelas Dropdown
    populateStudentClassFilter(students);
    // Update Info Statistik
    updateStudentStats(students);

    const searchVal = (document.getElementById('inputSearchStudent')?.value || '').trim().toLowerCase();
    const kelasVal = (document.getElementById('selectFilterKelasSiswa')?.value || 'Semua').trim().toLowerCase();

    // Filter Data
    const filtered = students.filter(s => {
        const matchSearch = !searchVal || 
            String(s.nama || '').toLowerCase().includes(searchVal) || 
            String(s.nis || '').toLowerCase().includes(searchVal) || 
            String(s.nisn || '').toLowerCase().includes(searchVal);
        
        const matchKelas = kelasVal === 'semua' || String(s.kelas || '').toLowerCase() === kelasVal;
        return matchSearch && matchKelas;
    });

    // Sort berdasarkan nama
    filtered.sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">
                    <i class="fa-solid fa-user-slash" style="font-size: 1.8rem; margin-bottom: 8px; display: block; opacity: 0.5;"></i>
                    Tidak ada data siswa yang cocok.
                </td>
            </tr>
        `;
        if (countInfo) countInfo.textContent = 'Menampilkan 0 dari 0 siswa';
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    // Paginasi
    const totalPages = Math.ceil(filtered.length / studentPageSize);
    if (studentCurrentPage > totalPages) studentCurrentPage = totalPages;
    if (studentCurrentPage < 1) studentCurrentPage = 1;

    const startIndex = (studentCurrentPage - 1) * studentPageSize;
    const endIndex = Math.min(startIndex + studentPageSize, filtered.length);
    const pagedStudents = filtered.slice(startIndex, endIndex);

    let html = '';
    pagedStudents.forEach((s, idx) => {
        const no = startIndex + idx + 1;
        const gender = (s.gender || s.jk || 'L').toUpperCase() === 'P' ? 'P' : 'L';
        const genderBadge = gender === 'P' 
            ? `<span style="background: rgba(244, 114, 182, 0.2); color: #f472b6; padding: 2px 8px; border-radius: 6px; font-weight: bold; font-size: 0.75rem;">P</span>`
            : `<span style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; padding: 2px 8px; border-radius: 6px; font-weight: bold; font-size: 0.75rem;">L</span>`;

        html += `
            <tr>
                <td style="text-align: center; color: var(--text-muted);">${no}</td>
                <td style="font-family: monospace; font-weight: 600;">${s.nis || '-'}</td>
                <td style="font-family: monospace; color: var(--text-muted);">${s.nisn || '-'}</td>
                <td style="font-weight: 600; color: #f8fafc;">${s.nama || '-'}</td>
                <td style="text-align: center;">${genderBadge}</td>
                <td style="text-align: center;"><span style="background: rgba(255,255,255,0.07); padding: 2px 8px; border-radius: 6px;">${s.kelas || '-'}</span></td>
                <td style="text-align: center;">
                    <div style="display: flex; justify-content: center; gap: 6px;">
                        <button onclick="openModalEditStudent('${escapeHtml(s.nis)}', '${escapeHtml(s.nisn)}')" class="btn-icon" title="Edit Siswa" style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: none; padding: 5px 9px; border-radius: 6px; cursor: pointer;">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button onclick="confirmDeleteStudent('${escapeHtml(s.nis)}', '${escapeHtml(s.nisn)}', '${escapeHtml(s.nama)}')" class="btn-icon" title="Hapus Siswa" style="background: rgba(239, 68, 68, 0.2); color: #f87171; border: none; padding: 5px 9px; border-radius: 6px; cursor: pointer;">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
    if (countInfo) countInfo.textContent = `Menampilkan ${startIndex + 1}-${endIndex} dari ${filtered.length} siswa`;

    // Render Tombol Paginasi
    if (paginationContainer) {
        let pagHtml = '';
        if (totalPages > 1) {
            pagHtml += `<button onclick="changeStudentPage(${studentCurrentPage - 1})" ${studentCurrentPage === 1 ? 'disabled' : ''} class="btn-secondary" style="padding: 4px 10px; font-size: 0.75rem;"><i class="fa-solid fa-chevron-left"></i></button>`;
            
            for (let p = 1; p <= totalPages; p++) {
                if (p === 1 || p === totalPages || (p >= studentCurrentPage - 1 && p <= studentCurrentPage + 1)) {
                    const activeStyle = p === studentCurrentPage ? 'background: #3b82f6; color: white;' : 'background: rgba(255,255,255,0.05); color: #cbd5e1;';
                    pagHtml += `<button onclick="changeStudentPage(${p})" class="btn-secondary" style="padding: 4px 10px; font-size: 0.75rem; ${activeStyle}">${p}</button>`;
                } else if (p === studentCurrentPage - 2 || p === studentCurrentPage + 2) {
                    pagHtml += `<span style="color: var(--text-muted); padding: 0 4px;">...</span>`;
                }
            }

            pagHtml += `<button onclick="changeStudentPage(${studentCurrentPage + 1})" ${studentCurrentPage === totalPages ? 'disabled' : ''} class="btn-secondary" style="padding: 4px 10px; font-size: 0.75rem;"><i class="fa-solid fa-chevron-right"></i></button>`;
        }
        paginationContainer.innerHTML = pagHtml;
    }
}

function changeStudentPage(page) {
    studentCurrentPage = page;
    renderTableSiswa();
}

function updateStudentStats(students) {
    const elTotal = document.getElementById('statTotalStudents');
    const elClasses = document.getElementById('statTotalClasses');
    const elMale = document.getElementById('statTotalMale');
    const elFemale = document.getElementById('statTotalFemale');

    if (!elTotal) return;

    const total = students.length;
    const classes = new Set(students.map(s => String(s.kelas || '').trim()).filter(Boolean)).size;
    const male = students.filter(s => (s.gender || s.jk || 'L').toUpperCase() === 'L').length;
    const female = students.filter(s => (s.gender || s.jk || 'L').toUpperCase() === 'P').length;

    elTotal.textContent = total;
    if (elClasses) elClasses.textContent = classes;
    if (elMale) elMale.textContent = male;
    if (elFemale) elFemale.textContent = female;
}

function populateStudentClassFilter(students) {
    const select = document.getElementById('selectFilterKelasSiswa');
    if (!select) return;
    const currentVal = select.value;

    const classes = [...new Set(students.map(s => String(s.kelas || '').trim()).filter(Boolean))].sort();
    let html = `<option value="Semua">Semua Kelas</option>`;
    classes.forEach(c => {
        html += `<option value="${c}" ${c === currentVal ? 'selected' : ''}>Kelas ${c}</option>`;
    });

    select.innerHTML = html;
}

// 2. TAMBAH & EDIT SISWA SATUAN
function openModalAddStudent() {
    const modal = document.getElementById('modalFormSiswa');
    const title = document.getElementById('modalSiswaTitle');
    const form = document.getElementById('formSiswaSingle');
    if (!modal) return;

    title.textContent = 'Tambah Data Siswa Baru';
    form.reset();
    document.getElementById('modalSiswaOldNis').value = '';
    document.getElementById('modalSiswaOldNisn').value = '';
    modal.style.display = 'flex';
}

function openModalEditStudent(nis, nisn) {
    const modal = document.getElementById('modalFormSiswa');
    const title = document.getElementById('modalSiswaTitle');
    if (!modal) return;

    const students = window.allStudents || localMasterStudents || [];
    const student = students.find(s => String(s.nis || '').trim() === String(nis).trim() || String(s.nisn || '').trim() === String(nisn).trim());
    
    if (!student) {
        showToast('Data siswa tidak ditemukan!', 'error');
        return;
    }

    title.textContent = 'Edit Data Siswa';
    document.getElementById('modalSiswaOldNis').value = student.nis || '';
    document.getElementById('modalSiswaOldNisn').value = student.nisn || '';
    document.getElementById('modalSiswaNama').value = student.nama || '';
    document.getElementById('modalSiswaNis').value = student.nis || '';
    document.getElementById('modalSiswaNisn').value = student.nisn || '';
    document.getElementById('modalSiswaKelas').value = student.kelas || '';
    document.getElementById('modalSiswaGender').value = (student.gender || student.jk || 'L').toUpperCase() === 'P' ? 'P' : 'L';

    modal.style.display = 'flex';
}

function closeModalSiswa() {
    const modal = document.getElementById('modalFormSiswa');
    if (modal) modal.style.display = 'none';
}

async function handleSaveStudentSingle(e) {
    e.preventDefault();
    const btnSave = document.getElementById('btnSaveModalSiswa');
    const oldNis = document.getElementById('modalSiswaOldNis').value;
    const oldNisn = document.getElementById('modalSiswaOldNisn').value;
    const nama = document.getElementById('modalSiswaNama').value.trim();
    const nis = document.getElementById('modalSiswaNis').value.trim();
    const nisn = document.getElementById('modalSiswaNisn').value.trim();
    const kelas = document.getElementById('modalSiswaKelas').value.trim();
    const gender = document.getElementById('modalSiswaGender').value;

    if (!nama || !kelas || !nis) {
        showToast('Nama, NIS, dan Kelas wajib diisi!', 'warning');
        return;
    }

    const isEdit = Boolean(oldNis || oldNisn);
    const action = isEdit ? 'update_student' : 'add_student';

    if (btnSave) {
        btnSave.disabled = true;
        btnSave.textContent = 'Menyimpan...';
    }

    try {
        const payload = new URLSearchParams({
            action: action,
            old_nis: oldNis,
            old_nisn: oldNisn,
            nis: nis,
            nisn: nisn,
            nama: nama,
            kelas: kelas,
            gender: gender
        });

        const res = await fetchWithRetry(SCRIPT_URL, {
            method: 'POST',
            body: payload
        });

        if (res && res.status === 'success') {
            showToast(res.message || 'Data siswa berhasil disimpan', 'success');

            // Update array lokal
            let students = window.allStudents || localMasterStudents || [];
            if (isEdit) {
                const idx = students.findIndex(s => String(s.nis || '').trim() === String(oldNis).trim() || String(s.nisn || '').trim() === String(oldNisn).trim());
                if (idx !== -1) {
                    students[idx] = { nisn, nis, nama, kelas, gender };
                }
            } else {
                students.push({ nisn, nis, nama, kelas, gender });
            }

            window.allStudents = students;
            localMasterStudents = students;
            localStorage.setItem('smart_absen_students', JSON.stringify(students));

            closeModalSiswa();
            renderTableSiswa();
        } else {
            showToast(res ? res.message : 'Gagal menyimpan siswa', 'error');
        }
    } catch (err) {
        showToast('Error koneksi: ' + err.message, 'error');
    } finally {
        if (btnSave) {
            btnSave.disabled = false;
            btnSave.textContent = 'Simpan';
        }
    }
}

// 3. HAPUS SISWA SATUAN
async function confirmDeleteStudent(nis, nisn, nama) {
    if (!confirm(`Apakah Anda yakin ingin menghapus data siswa "${nama}" (${nis || nisn})?`)) {
        return;
    }

    try {
        const payload = new URLSearchParams({
            action: 'delete_student',
            nis: nis,
            nisn: nisn
        });

        const res = await fetchWithRetry(SCRIPT_URL, {
            method: 'POST',
            body: payload
        });

        if (res && res.status === 'success') {
            showToast(res.message || 'Siswa berhasil dihapus', 'success');

            let students = window.allStudents || localMasterStudents || [];
            students = students.filter(s => String(s.nis || '').trim() !== String(nis).trim() && String(s.nisn || '').trim() !== String(nisn).trim());

            window.allStudents = students;
            localMasterStudents = students;
            localStorage.setItem('smart_absen_students', JSON.stringify(students));

            renderTableSiswa();
        } else {
            showToast(res ? res.message : 'Gagal menghapus siswa', 'error');
        }
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
}

// 4. BULK IMPORT EXCEL (SheetJS)
function openModalImportExcel() {
    const modal = document.getElementById('modalImportSiswa');
    const previewContainer = document.getElementById('previewImportContainer');
    const btnSubmit = document.getElementById('btnSubmitImportExcel');
    const inputExcel = document.getElementById('inputExcelFile');
    
    if (!modal) return;
    if (inputExcel) inputExcel.value = '';
    if (previewContainer) previewContainer.style.display = 'none';
    if (btnSubmit) btnSubmit.disabled = true;
    parsedExcelData = [];

    modal.style.display = 'flex';
}

function closeModalImportExcel() {
    const modal = document.getElementById('modalImportSiswa');
    if (modal) modal.style.display = 'none';
}

function handleProcessExcelFile(file) {
    if (typeof XLSX === 'undefined') {
        showToast('Pustaka SheetJS (XLSX) belum dimuat. Pastikan terhubung ke internet.', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            if (!rawJson || rawJson.length <= 1) {
                showToast('File Excel kosong atau tidak memiliki baris data!', 'warning');
                return;
            }

            // Temukan baris header
            let headerRowIndex = 0;
            for (let r = 0; r < Math.min(5, rawJson.length); r++) {
                const rowStr = rawJson[r].join(' ').toLowerCase();
                if (rowStr.includes('nama') || rowStr.includes('nis') || rowStr.includes('kelas')) {
                    headerRowIndex = r;
                    break;
                }
            }

            const headers = rawJson[headerRowIndex].map(h => String(h || '').trim().toLowerCase());
            const colNis = headers.findIndex(h => h.includes('nis') && !h.includes('nisn'));
            const colNisn = headers.findIndex(h => h.includes('nisn'));
            const colNama = headers.findIndex(h => h.includes('nama'));
            const colKelas = headers.findIndex(h => h.includes('kelas'));
            const colGender = headers.findIndex(h => h.includes('jk') || h.includes('jenis kelamin') || h.includes('l/p') || h.includes('gender'));

            const items = [];
            for (let i = headerRowIndex + 1; i < rawJson.length; i++) {
                const row = rawJson[i];
                if (!row || row.length === 0) continue;

                const nama = colNama !== -1 ? String(row[colNama] || '').trim() : '';
                if (!nama) continue;

                const nis = colNis !== -1 ? String(row[colNis] || '').trim() : '';
                const nisn = colNisn !== -1 ? String(row[colNisn] || '').trim() : '';
                const kelas = colKelas !== -1 ? String(row[colKelas] || '').trim() : '';
                let genderRaw = colGender !== -1 ? String(row[colGender] || '').trim().toUpperCase() : '';
                let gender = 'L';
                if (genderRaw.startsWith('P') || genderRaw.includes('PEREMPUAN')) {
                    gender = 'P';
                } else if (genderRaw.startsWith('L') || genderRaw.includes('LAKI')) {
                    gender = 'L';
                } else {
                    // Jika kolom gender kosong di Excel, gunakan penemu nama otomatis
                    const namaLower = nama.toLowerCase();
                    if (/\b(putri|ni|dewi|sarah|siti|nur|anisa|annisa|adelia|aulia|zahra|fitri|laila|maria|selvi|wulan|krisna|tania|dita)\b/i.test(namaLower)) {
                        gender = 'P';
                    } else {
                        gender = 'L';
                    }
                }

                items.push({ nisn, nis, nama, kelas, gender });
            }

            if (items.length === 0) {
                showToast('Tidak ada data siswa yang valid terbaca dari file Excel!', 'warning');
                return;
            }

            parsedExcelData = items;
            renderPreviewExcel(items);
            showToast(`Berhasil membaca ${items.length} baris data dari Excel.`, 'success');
        } catch (err) {
            showToast('Gagal memproses file Excel: ' + err.message, 'error');
        }
    };
    reader.readAsArrayBuffer(file);
}

function renderPreviewExcel(items) {
    const previewContainer = document.getElementById('previewImportContainer');
    const tbody = document.getElementById('tbodyPreviewExcel');
    const countText = document.getElementById('previewCountText');
    const btnSubmit = document.getElementById('btnSubmitImportExcel');

    if (!previewContainer || !tbody) return;
    previewContainer.style.display = 'block';
    if (countText) countText.textContent = `Pratinjau Data (${items.length} Siswa)`;

    let html = '';
    const maxPreview = Math.min(50, items.length);
    for (let i = 0; i < maxPreview; i++) {
        const item = items[i];
        const genderBadge = item.gender === 'P'
            ? `<span style="color: #f472b6; font-weight: bold;">P</span>`
            : `<span style="color: #38bdf8; font-weight: bold;">L</span>`;

        html += `
            <tr>
                <td style="text-align: center; color: var(--text-muted);">${i + 1}</td>
                <td style="font-family: monospace;">${item.nis || '-'}</td>
                <td style="font-family: monospace;">${item.nisn || '-'}</td>
                <td style="font-weight: 600;">${item.nama}</td>
                <td style="text-align: center;">${genderBadge}</td>
                <td style="text-align: center;">${item.kelas || '-'}</td>
            </tr>
        `;
    }

    if (items.length > 50) {
        html += `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 10px;">
                    ... Dan ${items.length - 50} data siswa lainnya.
                </td>
            </tr>
        `;
    }

    tbody.innerHTML = html;
    if (btnSubmit) btnSubmit.disabled = false;
}

async function uploadBulkStudentsToServer() {
    if (!parsedExcelData || parsedExcelData.length === 0) return;

    const btnSubmit = document.getElementById('btnSubmitImportExcel');
    const mode = document.getElementById('selectImportMode')?.value || 'append';

    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan (${parsedExcelData.length} Siswa)...`;
    }

    try {
        const payload = new URLSearchParams({
            action: 'save_all_students',
            mode: mode,
            data: JSON.stringify(parsedExcelData)
        });

        const res = await fetchWithRetry(SCRIPT_URL, {
            method: 'POST',
            body: payload
        });

        if (res && res.status === 'success') {
            showToast(res.message || 'Import data siswa berhasil!', 'success');

            let currentStudents = window.allStudents || localMasterStudents || [];
            if (mode === 'replace') {
                currentStudents = parsedExcelData;
            } else {
                currentStudents = currentStudents.concat(parsedExcelData);
            }

            window.allStudents = currentStudents;
            localMasterStudents = currentStudents;
            localStorage.setItem('smart_absen_students', JSON.stringify(currentStudents));

            closeModalImportExcel();
            renderTableSiswa();
        } else {
            showToast(res ? res.message : 'Gagal menyimpan import data siswa', 'error');
        }
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    } finally {
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Simpan ke Database`;
        }
    }
}

// 5. DOWNLOAD TEMPLATE EXCEL RESMI (.XLSX)
function downloadExcelTemplate() {
    if (typeof XLSX === 'undefined') {
        showToast('Pustaka SheetJS belum dimuat.', 'error');
        return;
    }

    const templateData = [
        { "NISN": "0011223344", "NIS": "1001", "Nama Siswa": "Abdurahman Smith", "Kelas": "X-1", "Jenis Kelamin (L/P)": "L" },
        { "NISN": "0011223345", "NIS": "1002", "Nama Siswa": "Adelia Rezky Al Nasya", "Kelas": "X-1", "Jenis Kelamin (L/P)": "P" },
        { "NISN": "0011223346", "NIS": "1003", "Nama Siswa": "Budi Santoso", "Kelas": "X-2", "Jenis Kelamin (L/P)": "L" }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DataSiswa");

    // Lebar Kolom
    worksheet['!cols'] = [
        { wch: 15 },
        { wch: 12 },
        { wch: 30 },
        { wch: 12 },
        { wch: 20 }
    ];

    XLSX.writeFile(workbook, "Template_Import_Data_Siswa.xlsx");
    showToast('Berhasil mengunduh Template Excel.', 'success');
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
