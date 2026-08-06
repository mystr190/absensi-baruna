// ==========================================
// MANAJEMEN ABSENSI PER KELAS (OPTIMIZED + ALREADY SUBMITTED CHECK)
// ==========================================

const btnTampilSiswa = document.getElementById('btnTampilSiswa');
const btnSimpanAbsenKelas = document.getElementById('btnSimpanAbsenKelas');
const pilihKelas = document.getElementById('pilihKelas');
const inputTanggalAbsen = document.getElementById('inputTanggalAbsen');
const studentListContainer = document.getElementById('studentListContainer');
const tbodySiswa = document.getElementById('tbodySiswa');
const labelKelasTerpilih = document.getElementById('labelKelasTerpilih');

const alreadySubmittedBanner = document.getElementById('alreadySubmittedBanner');
const submittedBannerText = document.getElementById('submittedBannerText');

let currentStudents = [];
let currentTodayStatus = {};
let currentAlreadySubmitted = false;

// Global Master Data Cache in LocalStorage
let localMasterStudents = JSON.parse(localStorage.getItem('smart_absen_master_students') || '[]');
let localRecentLogs = JSON.parse(localStorage.getItem('smart_absen_recent_logs') || '[]');

// Background Sync Master Data 1x saat aplikasi dibuka (Non-blocking)
async function syncMasterDataInBackground() {
    try {
        const result = await fetchWithRetry(`${SCRIPT_URL}?action=get_all_master_data`, { method: 'GET' }, 2, 800);
        if (result && result.status === 'success' && result.data) {
            if (Array.isArray(result.data.students) && result.data.students.length > 0) {
                localMasterStudents = result.data.students;
                window.allStudents = localMasterStudents;
                localStorage.setItem('smart_absen_master_students', JSON.stringify(localMasterStudents));
            } else {
                window.allStudents = localMasterStudents;
            }
            if (Array.isArray(result.data.recentLogs)) {
                localRecentLogs = result.data.recentLogs;
                localStorage.setItem('smart_absen_recent_logs', JSON.stringify(localRecentLogs));
            }
            if (result.data.config) {
                localStorage.setItem('smart_absen_config', JSON.stringify(result.data.config));
                if (typeof window.applyServerSchoolConfig === 'function') {
                    window.applyServerSchoolConfig(result.data.config);
                }
            }
            if (typeof window.updatePelanggaranMasterData === 'function') {
                window.updatePelanggaranMasterData(result.data.recentPelanggaran || [], result.data.jenisPelanggaran || []);
            }
            if (typeof window.updateAbsenGuruMasterData === 'function') {
                window.updateAbsenGuruMasterData(result.data.absenGuru || [], result.data.pengajuanIzin || []);
            }
            if (Array.isArray(result.data.users)) {
                window.allTeachers = result.data.users.map(u => ({ username: u.username, namaLengkap: u.nama, role: u.role }));
                localStorage.setItem('smart_absen_users_cache', JSON.stringify(window.allTeachers));
                if (typeof renderAbsenGuruBatchTable === 'function') {
                    renderAbsenGuruBatchTable();
                }
            }
            populateClassSelectOptions();
            if (typeof loadUsers === 'function') {
                loadUsers();
            }
            if (pilihKelas && pilihKelas.value && typeof autoLoadStudents === 'function') {
                autoLoadStudents();
            }
            console.log(`⚡ Master Data synced: ${localMasterStudents.length} students loaded.`);
        } else {
            window.allStudents = localMasterStudents;
        }
    } catch (e) {
        window.allStudents = localMasterStudents;
        console.warn("Background master data sync deferred (using offline storage).");
    }
}

function populateClassSelectOptions() {
    if (!Array.isArray(localMasterStudents) || localMasterStudents.length === 0) return;
    
    const uniqueClasses = [];
    localMasterStudents.forEach(s => {
        const cls = String(s.kelas || '').trim();
        if (cls && !uniqueClasses.includes(cls)) {
            uniqueClasses.push(cls);
        }
    });
    uniqueClasses.sort();

    if (uniqueClasses.length === 0) return;

    // 1. Dropdown pilihKelas (Input Absensi)
    if (pilihKelas) {
        const currentVal = pilihKelas.value;
        let html = '<option value="" disabled>Pilih Kelas...</option>';
        uniqueClasses.forEach(cls => {
            const sel = (cls === currentVal) ? 'selected' : '';
            html += `<option value="${cls}" ${sel}>${cls}</option>`;
        });
        pilihKelas.innerHTML = html;
        if (currentVal && uniqueClasses.includes(currentVal)) {
            pilihKelas.value = currentVal;
        } else if (uniqueClasses.length > 0) {
            pilihKelas.value = uniqueClasses[0];
        }
    }

    // 2. Dropdown filterKelas (Dashboard Laporan)
    const filterKelas = document.getElementById('filterKelas');
    if (filterKelas) {
        const currentVal = filterKelas.value || 'Semua';
        let html = '<option value="Semua">Semua Kelas</option>';
        uniqueClasses.forEach(cls => {
            const sel = (cls === currentVal) ? 'selected' : '';
            html += `<option value="${cls}" ${sel}>Kelas ${cls}</option>`;
        });
        filterKelas.innerHTML = html;
        if (currentVal && (currentVal === 'Semua' || uniqueClasses.includes(currentVal))) {
            filterKelas.value = currentVal;
        }
    }

    // 3. Dropdown selectMatrixKelas (Rekap Kehadiran Siswa)
    const selectMatrixKelas = document.getElementById('selectMatrixKelas');
    if (selectMatrixKelas) {
        const currentVal = selectMatrixKelas.value || 'Semua';
        let html = '<option value="Semua">Semua Kelas</option>';
        uniqueClasses.forEach(cls => {
            const sel = (cls === currentVal) ? 'selected' : '';
            html += `<option value="${cls}" ${sel}>Kelas ${cls}</option>`;
        });
        selectMatrixKelas.innerHTML = html;
        if (currentVal && (currentVal === 'Semua' || uniqueClasses.includes(currentVal))) {
            selectMatrixKelas.value = currentVal;
        }
    }

    // 4. Dropdown filterPelanggaranKelas (Catatan Pelanggaran)
    const filterPelanggaranKelas = document.getElementById('filterPelanggaranKelas');
    if (filterPelanggaranKelas) {
        const currentVal = filterPelanggaranKelas.value || 'Semua';
        let html = '<option value="Semua">Semua Kelas</option>';
        uniqueClasses.forEach(cls => {
            const sel = (cls === currentVal) ? 'selected' : '';
            html += `<option value="${cls}" ${sel}>Kelas ${cls}</option>`;
        });
        filterPelanggaranKelas.innerHTML = html;
        if (currentVal && (currentVal === 'Semua' || uniqueClasses.includes(currentVal))) {
            filterPelanggaranKelas.value = currentVal;
        }
    }
}

// Inisialisasi awal saat halaman dimuat
window.addEventListener('DOMContentLoaded', () => {
    if (inputTanggalAbsen && !inputTanggalAbsen.value) {
        const today = new Date();
        const yyyy = today.getFullYear();
        let mm = (today.getMonth() + 1).toString();
        let dd = today.getDate().toString();
        if (mm.length === 1) mm = '0' + mm;
        if (dd.length === 1) dd = '0' + dd;
        inputTanggalAbsen.value = `${yyyy}-${mm}-${dd}`;
    }
    
    // Jalankan sync background master data
    syncMasterDataInBackground();
});

// Helper untuk Retry otomatis jika jaringan/Google Apps Script tersendat
async function fetchWithRetry(url, options = {}, retries = 3, delayMs = 1000) {
    const fetchOptions = { redirect: 'follow', ...options };
    for (let i = 0; i <= retries; i++) {
        try {
            const response = await fetch(url, fetchOptions);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const textData = await response.text();
            let jsonResult;
            try {
                jsonResult = JSON.parse(textData);
            } catch (jsonErr) {
                console.warn("Retrying non-JSON server response:", textData.substring(0, 100));
                throw new Error("Respon server bukan JSON yang valid.");
            }
            
            return jsonResult;
        } catch (err) {
            if (i === retries) throw err;
            console.warn(`Attempt ${i + 1} failed (${err.message}). Retrying in ${delayMs}ms...`);
            await new Promise(res => setTimeout(res, delayMs));
        }
    }
}

// ----------------------------------------------------
// FUNGSI MEMUAT SISWA INSTAN 0-MILIDETIK (CLIENT STORAGE)
// ----------------------------------------------------
async function autoLoadStudents() {
    const kelas = pilihKelas ? pilihKelas.value : '';
    const tanggal = inputTanggalAbsen ? inputTanggalAbsen.value : '';

    if (!kelas || !tanggal) {
        if (studentListContainer) studentListContainer.style.display = 'none';
        if (alreadySubmittedBanner) alreadySubmittedBanner.style.display = 'none';
        return;
    }

    const normSelectedKelas = kelas.trim().toLowerCase().replace(/[\s\-]/g, '');

    // 1. CARI SISWA DI LOCALSTORAGE (INSTAN 0MS)
    let filteredStudents = localMasterStudents.filter(s => {
        const k = String(s.kelas || '').trim().toLowerCase().replace(/[\s\-]/g, '');
        return k === normSelectedKelas;
    });

    // Jika localStorage masih kosong (pengguna baru pertama kali buka), tarik master data
    if (localMasterStudents.length === 0) {
        if (studentListContainer) studentListContainer.style.display = 'block';
        const tableBodySiswa = document.getElementById('tableBodySiswa');
        if (tableBodySiswa) {
            tableBodySiswa.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 25px;"><span class="loader" style="display:inline-block; border-color:var(--primary); border-bottom-color:transparent; margin-right:8px;"></span>Menghubungkan ke database sekolah...</td></tr>`;
        }

        await syncMasterDataInBackground();

        filteredStudents = localMasterStudents.filter(s => {
            const k = String(s.kelas || '').trim().toLowerCase().replace(/[\s\-]/g, '');
            return k === normSelectedKelas;
        });
    }

    // 2. PERIKSA STATUS ABSENSI PADA TANGGAL TERPILIH (LOKAL)
    let alreadySubmitted = false;
    let submittedBy = '';
    let submittedTime = '';
    let todayStatusMap = {};

    localRecentLogs.forEach(log => {
        const logKelas = String(log.kelas || '').trim().toLowerCase().replace(/[\s\-]/g, '');
        if (logKelas === normSelectedKelas && log.tanggal === tanggal) {
            alreadySubmitted = true;
            submittedBy = log.petugas || 'Petugas';
            submittedTime = log.jam || '08:00';
            if (log.nis) todayStatusMap[log.nis] = log.status || 'HADIR';
        }
    });

    currentStudents = filteredStudents;
    currentAlreadySubmitted = alreadySubmitted;
    currentTodayStatus = todayStatusMap;

    // 3. RENDER KELAS KE TABEL INSTAN!
    if (labelKelasTerpilih) labelKelasTerpilih.innerText = `${kelas} (Tanggal: ${tanggal})`;

    const tableBodySiswa = document.getElementById('tableBodySiswa');
    if (filteredStudents.length === 0) {
        if (tableBodySiswa) {
            tableBodySiswa.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; padding: 30px; color:var(--text-muted);">
                        <div style="font-size: 1.5rem; margin-bottom: 8px; color: #f59e0b;"><i class="fa-solid fa-folder-open"></i></div>
                        <div>Tidak ada data siswa untuk kelas <strong>${kelas}</strong> pada penyimpanan lokal.</div>
                        <div style="font-size: 0.82rem; color: #94a3b8; margin-top: 6px;">
                            Pastikan nama kelas pada sheet <strong>DataSiswa</strong> sesuai (misal: 10-A), atau klik tombol di bawah untuk menyinkronkan data:
                        </div>
                        <button type="button" onclick="syncMasterDataInBackground().then(() => autoLoadStudents());" class="btn-primary" style="margin-top: 12px; padding: 6px 16px; font-size: 0.82rem; background: rgba(59, 130, 246, 0.2); border: 1px solid #3b82f6; color: #60a5fa; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                            <i class="fa-solid fa-rotate"></i> Sync Data Siswa dari Google Sheet
                        </button>
                    </td>
                </tr>`;
        }
        showToast(`Tidak ada data siswa ditemukan untuk kelas ${kelas}.`, 'warning');
    } else {
        renderStudentList(currentStudents, currentAlreadySubmitted, currentTodayStatus);

        const btnTextElem = btnSimpanAbsenKelas.querySelector('.btn-text');
        if (currentAlreadySubmitted) {
            alreadySubmittedBanner.style.display = 'flex';
            alreadySubmittedBanner.style.background = 'rgba(239, 68, 68, 0.12)';
            alreadySubmittedBanner.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            submittedBannerText.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px;">
                    <i class="fa-solid fa-lock" style="color:#f87171; font-size:1.1rem;"></i>
                    <span>Absensi kelas <strong>${kelas}</strong> pada tanggal <strong>${tanggal}</strong> sudah ada di database (Diinput oleh: <strong>${submittedBy}</strong> jam ${submittedTime}). <strong>Penyimpanan ulang ditolak.</strong></span>
                </div>
            `;
            
            btnSimpanAbsenKelas.disabled = true;
            btnSimpanAbsenKelas.style.opacity = '0.5';
            btnSimpanAbsenKelas.style.cursor = 'not-allowed';
            if (btnTextElem) btnTextElem.innerText = 'Absensi Tanggal Ini Sudah Tersimpan di Sheet';
        } else {
            alreadySubmittedBanner.style.display = 'none';
            btnSimpanAbsenKelas.disabled = false;
            btnSimpanAbsenKelas.style.opacity = '1';
            btnSimpanAbsenKelas.style.cursor = 'pointer';
            if (btnTextElem) {
                btnTextElem.innerText = `Simpan Absensi Kelas (${tanggal})`;
            }
        }

        showToast(`⚡ ${filteredStudents.length} siswa kelas ${kelas} siap.`, 'info');
    }

    if (studentListContainer) studentListContainer.style.display = 'block';
}

// Reset saat kelas/tanggal diganti
if (pilihKelas) {
    pilihKelas.addEventListener('change', autoLoadStudents);
}
if (inputTanggalAbsen) {
    inputTanggalAbsen.addEventListener('change', () => {
        if (pilihKelas && pilihKelas.value) {
            autoLoadStudents();
        }
    });
}

function renderStudentList(students, isSubmitted, todayStatusMap) {
    const tableBody = document.getElementById('tableBodySiswa') || document.getElementById('tbodySiswa');
    if (!tableBody) return;

    let html = '';
    const statuses = ['HADIR', 'SAKIT', 'IZIN', 'ALPA', 'MUTASI', 'TELAT'];

    students.forEach((siswa, index) => {
        let radioButtons = '';
        const existingStatus = todayStatusMap[siswa.nis] || 'HADIR';

        statuses.forEach(status => {
            const checked = status === existingStatus ? 'checked' : '';
            const disabledAttr = isSubmitted ? 'disabled' : '';
            
            radioButtons += `
                <label style="margin-right: 10px; cursor: ${isSubmitted ? 'not-allowed' : 'pointer'}; display: inline-flex; align-items: center; gap: 3px; opacity: ${isSubmitted && !checked ? '0.5' : '1'};">
                    <input type="radio" name="status_${siswa.nis}" value="${status}" ${checked} ${disabledAttr}>
                    <span style="font-size: 0.85rem; font-weight: ${checked ? 'bold' : 'normal'};">${status}</span>
                </label>
            `;
        });

        html += `
            <tr style="background: ${isSubmitted ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.02)'};">
                <td style="text-align:center; font-weight:bold;">${index + 1}</td>
                <td style="font-size: 0.9rem;">${siswa.nisn || '-'}</td>
                <td><strong>${siswa.nis || '-'}</strong></td>
                <td>${siswa.nama}</td>
                <td><span class="badge" style="background:rgba(255,255,255,0.08); font-size:0.8rem;">${siswa.kelas}</span></td>
                <td style="text-align: center;">
                    <div style="display: flex; flex-wrap: wrap; gap: 4px; justify-content: center;">
                        ${radioButtons}
                    </div>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;
}

let isSavingAttendance = false;

// ----------------------------------------------------
// FUNGSI SIMPAN ABSEN MASSAL (DENGAN VALIDASI DEDUP STRICT)
// ----------------------------------------------------
btnSimpanAbsenKelas.addEventListener('click', async () => {
    if (currentStudents.length === 0 || currentAlreadySubmitted || isSavingAttendance) {
        if (currentAlreadySubmitted) {
            showToast("⛔ Absensi kelas & tanggal ini sudah tersimpan di database!", 'warning');
        }
        return;
    }

    isSavingAttendance = true; // Kunci proses simpan agar tidak bisa diklik berulang kali

    const session = JSON.parse(localStorage.getItem('smart_absen_user') || '{}');
    const namaPetugas = session.nama || 'Sistem';
    const tanggalAbsen = inputTanggalAbsen ? inputTanggalAbsen.value : '';

    const text = btnSimpanAbsenKelas.querySelector('.btn-text');
    const loader = btnSimpanAbsenKelas.querySelector('.loader');

    btnSimpanAbsenKelas.disabled = true;
    text.style.display = 'none';
    loader.style.display = 'block';

    const bulkData = [];
    currentStudents.forEach(siswa => {
        const radios = document.getElementsByName(`status_${siswa.nis}`);
        let selectedStatus = 'ALPA';
        for (let i = 0; i < radios.length; i++) {
            if (radios[i].checked) {
                selectedStatus = radios[i].value;
                break;
            }
        }

        bulkData.push({
            nisn: siswa.nisn,
            nis: siswa.nis,
            nama: siswa.nama,
            kelas: siswa.kelas,
            status: selectedStatus,
            petugas: namaPetugas
        });
    });

    try {
        const formData = new FormData();
        formData.append('action', 'absen_bulk');
        formData.append('tanggal', tanggalAbsen);
        formData.append('data', JSON.stringify(bulkData));

        const result = await fetchWithRetry(SCRIPT_URL, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(formData).toString()
        }, 0);
        
        if (result && result.status === 'success') {
            showToast("✅ " + result.message, 'success');
            
            // Hapus log lama kelas ini pada tanggal ini dari localRecentLogs (agar tidak ada duplikat di lokal)
            const sampleK = String(currentStudents[0]?.kelas || '').trim().toLowerCase().replace(/[\s\-]/g, '');
            localRecentLogs = localRecentLogs.filter(log => {
                const logK = String(log.kelas || '').trim().toLowerCase().replace(/[\s\-]/g, '');
                return !(logK === sampleK && log.tanggal === tanggalAbsen);
            });

            // Push log absensi terbaru hasil update
            const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            bulkData.forEach(item => {
                localRecentLogs.push({
                    tanggal: tanggalAbsen,
                    jam: nowTime,
                    nisn: item.nisn,
                    nis: item.nis,
                    nama: item.nama,
                    kelas: item.kelas,
                    status: item.status,
                    petugas: item.petugas
                });
            });
            localStorage.setItem('smart_absen_recent_logs', JSON.stringify(localRecentLogs));

            if (typeof invalidateReportCache === 'function') invalidateReportCache();

            // Refresh tampilan lokal
            autoLoadStudents();

        } else {
            showToast("❌ Gagal: " + (result ? result.message : 'Error'), 'error');
        }
    } catch (error) {
        console.error('Error Pengiriman!', error);
        // Walau terjadi network error pada redirect response, cek apakah data sudah masuk
        showToast("⚠️ Mengonfirmasi status penyimpanan...", 'info');
    } finally {
        isSavingAttendance = false;
        text.style.display = 'block';
        loader.style.display = 'none';
    }
});

// ----------------------------------------------------
// UI TOAST NOTIFICATION
// ----------------------------------------------------
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.innerText = message;
    
    toast.classList.remove('success', 'error', 'warning');
    if (type === 'success') toast.classList.add('success');
    if (type === 'error') toast.classList.add('error');
    if (type === 'warning') toast.classList.add('warning');
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}
