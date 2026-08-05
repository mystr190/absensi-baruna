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
            if (typeof loadUsers === 'function') {
                loadUsers();
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
            tableBodySiswa.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--text-muted);">Tidak ada data siswa untuk kelas ${kelas}. Cek kembali sheet DataSiswa.</td></tr>`;
        }
        showToast(`Tidak ada data siswa ditemukan untuk kelas ${kelas}.`, 'warning');
    } else {
        renderStudentList(currentStudents, currentAlreadySubmitted, currentTodayStatus);

        const btnTextElem = btnSimpanAbsenKelas.querySelector('.btn-text');
        if (currentAlreadySubmitted) {
            alreadySubmittedBanner.style.display = 'flex';
            submittedBannerText.innerHTML = `Absensi kelas <strong>${kelas}</strong> pada tanggal <strong>${tanggal}</strong> sudah diinput oleh <strong>${submittedBy}</strong> (Pukul ${submittedTime}).`;
            
            btnSimpanAbsenKelas.disabled = true;
            btnSimpanAbsenKelas.style.opacity = '0.6';
            btnSimpanAbsenKelas.style.cursor = 'not-allowed';
            if (btnTextElem) btnTextElem.innerText = 'Absensi Tanggal Ini Sudah Disimpan';
        } else {
            alreadySubmittedBanner.style.display = 'none';
            btnSimpanAbsenKelas.disabled = false;
            btnSimpanAbsenKelas.style.opacity = '1';
            btnSimpanAbsenKelas.style.cursor = 'pointer';
            if (btnTextElem) btnTextElem.innerText = `Simpan Absensi Kelas (${tanggal})`;
        }

        showToast(`⚡ ${filteredStudents.length} siswa kelas ${kelas} siap.`, 'info');
    }

    if (studentListContainer) studentListContainer.style.display = 'block';
}

// Pasang Event Listener Otomatis saat Kelas atau Tanggal Berubah
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
// FUNGSI SIMPAN ABSEN MASSAL (CEGAH SIMPAN GANDA & RETRY BERLEBIHAN)
// ----------------------------------------------------
btnSimpanAbsenKelas.addEventListener('click', async () => {
    if (currentStudents.length === 0 || currentAlreadySubmitted || isSavingAttendance) return;

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

        // PENTING: Gunakan retries = 0 saat SIMPAN agar request tidak dikirim 2x jika ada hambatan jaringan
        const result = await fetchWithRetry(SCRIPT_URL, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(formData).toString()
        }, 0);
        
        if (result && result.status === 'success') {
            showToast("✅ " + result.message, 'success');
            
            // Push ke localRecentLogs agar UI langsung ter-update
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

            // Update UI lokal instan
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
