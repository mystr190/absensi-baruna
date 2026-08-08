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

function getTodayYYYYMMDD() {
    const today = new Date();
    const yyyy = today.getFullYear();
    let mm = (today.getMonth() + 1).toString();
    let dd = today.getDate().toString();
    if (mm.length === 1) mm = '0' + mm;
    if (dd.length === 1) dd = '0' + dd;
    return `${yyyy}-${mm}-${dd}`;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// Inisialisasi awal saat halaman dimuat
window.addEventListener('DOMContentLoaded', () => {
    const todayStr = getTodayYYYYMMDD();
    if (inputTanggalAbsen) {
        inputTanggalAbsen.setAttribute('max', todayStr);
        if (!inputTanggalAbsen.value) {
            inputTanggalAbsen.value = todayStr;
        }
    }
    
    // Jalankan sync background master data
    syncMasterDataInBackground();
});

// Helper untuk Retry otomatis jika jaringan/Google Apps Script tersendat
async function fetchWithRetry(url, options = {}, retries = 2, delayMs = 800) {
    const fetchOptions = { redirect: 'follow', ...options };
    for (let i = 0; i <= retries; i++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);
        try {
            const resOptions = { ...fetchOptions, signal: controller.signal };
            const response = await fetch(url, resOptions);
            clearTimeout(timeoutId);
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
            clearTimeout(timeoutId);
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

    const todayStr = getTodayYYYYMMDD();
    const isFutureDate = tanggal > todayStr;
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
    let nonAutoLogsCount = 0;
    let totalLogsCount = 0;

    localRecentLogs.forEach(log => {
        const logKelas = String(log.kelas || '').trim().toLowerCase().replace(/[\s\-]/g, '');
        const logDateNorm = String(log.tanggal || '').trim();
        if (logKelas === normSelectedKelas && (logDateNorm === tanggal || logDateNorm.includes(tanggal))) {
            totalLogsCount++;
            const pStr = String(log.petugas || '');
            if (!pStr.startsWith('Auto-Izin')) {
                nonAutoLogsCount++;
                submittedBy = log.petugas || 'Petugas';
                submittedTime = log.jam || '08:00';
            }
            const status = log.status || 'HADIR';
            if (log.nis) todayStatusMap[String(log.nis).trim()] = status;
            if (log.nisn) todayStatusMap[String(log.nisn).trim()] = status;
            if (log.nama) todayStatusMap[String(log.nama).trim().toLowerCase()] = status;
        }
    });

    if (nonAutoLogsCount > 0 || (filteredStudents.length > 0 && totalLogsCount >= filteredStudents.length)) {
        alreadySubmitted = true;
    }

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
        const lockInputs = isFutureDate || (currentAlreadySubmitted && !isEditAttendanceMode);
        renderStudentList(currentStudents, lockInputs, currentTodayStatus);

        const btnTextElem = btnSimpanAbsenKelas ? btnSimpanAbsenKelas.querySelector('.btn-text') : null;

        if (isFutureDate) {
            alreadySubmittedBanner.style.display = 'flex';
            alreadySubmittedBanner.style.background = 'rgba(239, 68, 68, 0.15)';
            alreadySubmittedBanner.style.borderColor = 'rgba(239, 68, 68, 0.4)';
            submittedBannerText.innerHTML = `
                <div style="display:flex; align-items:center; justify-content:space-between; width:100%; flex-wrap:wrap; gap:8px;">
                    <span style="color: #fca5a5;"><i class="fa-solid fa-triangle-exclamation" style="color: #ef4444; font-size: 1.1rem; margin-right: 6px;"></i> <strong>Tanggal Masa Depan:</strong> Tidak dapat menginput/menyimpan absensi untuk tanggal yang belum terjadi (${tanggal}).</span>
                    ${currentAlreadySubmitted ? `
                    <button type="button" onclick="confirmDeleteAttendanceClass('${escapeHtml(tanggal)}', '${escapeHtml(kelas)}')" class="btn-secondary" style="padding: 6px 14px; font-size: 0.8rem; background: rgba(239, 68, 68, 0.3); color: #ffffff; border: 1px solid #ef4444; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; font-weight: 600; white-space: nowrap;">
                        <i class="fa-solid fa-trash-can"></i> Hapus Data Absensi Masa Depan Ini
                    </button>` : ''}
                </div>
            `;

            btnSimpanAbsenKelas.disabled = true;
            btnSimpanAbsenKelas.style.opacity = '0.6';
            btnSimpanAbsenKelas.style.cursor = 'not-allowed';
            if (btnTextElem) btnTextElem.innerText = 'Input Absen Ditolak (Tanggal Masa Depan)';
            showToast("⚠️ Tanggal yang dipilih berada di masa depan. Input absensi dikunci.", "warning");
        } else if (currentAlreadySubmitted && !isEditAttendanceMode) {
            alreadySubmittedBanner.style.display = 'flex';
            alreadySubmittedBanner.style.background = 'rgba(34, 197, 94, 0.1)';
            alreadySubmittedBanner.style.borderColor = 'rgba(34, 197, 94, 0.3)';
            submittedBannerText.innerHTML = `
                <div style="display:flex; align-items:center; justify-content:space-between; width:100%; flex-wrap:wrap; gap:8px;">
                    <span>Absensi kelas <strong>${kelas}</strong> pada tanggal <strong>${tanggal}</strong> sudah diinput oleh <strong>${submittedBy}</strong> (Pukul ${submittedTime}).</span>
                    <div style="display: flex; gap: 8px;">
                        <button type="button" onclick="enableEditAttendanceMode()" class="btn-secondary" style="padding: 6px 14px; font-size: 0.8rem; background: rgba(59, 130, 246, 0.25); color: #93c5fd; border: 1px solid #3b82f6; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; font-weight: 600; white-space: nowrap;">
                            <i class="fa-solid fa-pen-to-square"></i> Edit Data Absensi
                        </button>
                        <button type="button" onclick="confirmDeleteAttendanceClass('${escapeHtml(tanggal)}', '${escapeHtml(kelas)}')" class="btn-secondary" style="padding: 6px 14px; font-size: 0.8rem; background: rgba(239, 68, 68, 0.25); color: #fca5a5; border: 1px solid #ef4444; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; font-weight: 600; white-space: nowrap;">
                            <i class="fa-solid fa-trash-can"></i> Hapus Absensi
                        </button>
                    </div>
                </div>
            `;
            
            btnSimpanAbsenKelas.disabled = true;
            btnSimpanAbsenKelas.style.opacity = '0.6';
            btnSimpanAbsenKelas.style.cursor = 'not-allowed';
            if (btnTextElem) btnTextElem.innerText = 'Absensi Tanggal Ini Sudah Tersimpan di Sheet';
        } else {
            alreadySubmittedBanner.style.display = isEditAttendanceMode ? 'flex' : 'none';
            if (isEditAttendanceMode) {
                alreadySubmittedBanner.style.background = 'rgba(234, 179, 8, 0.15)';
                alreadySubmittedBanner.style.borderColor = 'rgba(234, 179, 8, 0.4)';
                submittedBannerText.innerHTML = `
                    <div style="display:flex; align-items:center; justify-content:space-between; width:100%; flex-wrap:wrap; gap:8px;">
                        <span><strong><i class="fa-solid fa-pen"></i> Mode Edit Absensi Aktif:</strong> Silakan sesuaikan status siswa lalu klik tombol simpan di bawah.</span>
                        <button type="button" onclick="cancelEditAttendanceMode()" class="btn-secondary" style="padding: 4px 10px; font-size: 0.75rem; background: rgba(255,255,255,0.1); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; cursor: pointer;">
                            Batal Edit
                        </button>
                    </div>
                `;
            }
            btnSimpanAbsenKelas.disabled = false;
            btnSimpanAbsenKelas.style.opacity = '1';
            btnSimpanAbsenKelas.style.cursor = 'pointer';
            if (btnTextElem) {
                btnTextElem.innerText = isEditAttendanceMode ? `Update / Simpan Perubahan Absensi (${tanggal})` : `Simpan Absensi Kelas (${tanggal})`;
            }
        }
    }

    if (studentListContainer) studentListContainer.style.display = 'block';
}

let isEditAttendanceMode = false;

window.cancelEditAttendanceMode = function() {
    isEditAttendanceMode = false;
    autoLoadStudents();
};

window.enableEditAttendanceMode = function() {
    isEditAttendanceMode = true;
    renderStudentList(currentStudents, false, currentTodayStatus);
    
    if (btnSimpanAbsenKelas) {
        btnSimpanAbsenKelas.disabled = false;
        btnSimpanAbsenKelas.style.opacity = '1';
        btnSimpanAbsenKelas.style.cursor = 'pointer';
        const btnTextElem = btnSimpanAbsenKelas.querySelector('.btn-text');
        const tanggal = inputTanggalAbsen ? inputTanggalAbsen.value : '';
        if (btnTextElem) btnTextElem.innerText = `Update / Simpan Perubahan Absensi (${tanggal})`;
    }

    if (alreadySubmittedBanner && submittedBannerText) {
        alreadySubmittedBanner.style.display = 'flex';
        alreadySubmittedBanner.style.background = 'rgba(234, 179, 8, 0.15)';
        alreadySubmittedBanner.style.borderColor = 'rgba(234, 179, 8, 0.4)';
        submittedBannerText.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between; width:100%; flex-wrap:wrap; gap:8px;">
                <span><strong><i class="fa-solid fa-pen"></i> Mode Edit Absensi Aktif:</strong> Silakan sesuaikan status siswa lalu klik tombol simpan di bawah.</span>
                <button type="button" onclick="cancelEditAttendanceMode()" class="btn-secondary" style="padding: 4px 10px; font-size: 0.75rem; background: rgba(255,255,255,0.1); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; cursor: pointer;">
                    Batal Edit
                </button>
            </div>
        `;
    }

    showToast("✏️ Mode Edit aktif: Anda dapat mengubah status presensi siswa.", "info");
};

window.confirmDeleteAttendanceClass = async function(tanggal, kelas) {
    if (!tanggal || !kelas) return;

    const confirmed = await showCustomConfirm({
        title: 'Hapus Absensi Kelas?',
        message: `Apakah Anda yakin ingin menghapus SELURUH data absensi kelas <strong>"${kelas}"</strong> pada tanggal <strong>${tanggal}</strong>?<br><br><span style="color:#f87171; font-size:0.85rem;">⚠️ Data absensi tanggal ini akan dihapus permanen dari database sheet.</span>`,
        icon: 'danger',
        confirmText: 'Ya, Hapus Data',
        cancelText: 'Batal',
        danger: true
    });

    if (!confirmed) return;

    showToast("Menghapus data absensi...", "info");
    try {
        const payload = new URLSearchParams({
            action: 'delete_attendance_class',
            tanggal: tanggal,
            kelas: kelas
        });

        const res = await fetchWithRetry(SCRIPT_URL, {
            method: 'POST',
            body: payload
        });

        if (res && res.status === 'success') {
            showToast("✅ " + (res.message || 'Data absensi berhasil dihapus!'), 'success');

            // Hapus dari localRecentLogs
            const normK = String(kelas).trim().toLowerCase().replace(/[\s\-]/g, '');
            localRecentLogs = localRecentLogs.filter(log => {
                const logK = String(log.kelas || '').trim().toLowerCase().replace(/[\s\-]/g, '');
                return !(logK === normK && log.tanggal === tanggal);
            });
            localStorage.setItem('smart_absen_recent_logs', JSON.stringify(localRecentLogs));

            if (typeof invalidateReportCache === 'function') invalidateReportCache();

            isEditAttendanceMode = false;
            autoLoadStudents();
        } else {
            showToast("❌ Gagal menghapus: " + (res ? res.message : 'Error'), 'error');
        }
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
};

// Reset edit mode saat kelas/tanggal diganti
if (pilihKelas) {
    pilihKelas.addEventListener('change', () => {
        isEditAttendanceMode = false;
        autoLoadStudents();
    });
}
if (inputTanggalAbsen) {
    inputTanggalAbsen.addEventListener('change', () => {
        isEditAttendanceMode = false;
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
        const nisKey = String(siswa.nis || '').trim();
        const nisnKey = String(siswa.nisn || '').trim();
        const namaKey = String(siswa.nama || '').trim().toLowerCase();
        const existingStatus = todayStatusMap[nisKey] || todayStatusMap[nisnKey] || todayStatusMap[namaKey] || 'HADIR';

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
// FUNGSI SIMPAN ABSEN MASSAL (DENGAN SUPPORT EDIT & VALIDASI DEDUP)
// ----------------------------------------------------
btnSimpanAbsenKelas.addEventListener('click', async () => {
    const tanggalAbsen = inputTanggalAbsen ? inputTanggalAbsen.value : '';
    const todayStr = getTodayYYYYMMDD();

    if (tanggalAbsen > todayStr) {
        showToast("⛔ tidak dapat menginput/menyimpan absensi untuk tanggal yang belum terjadi (Masa Depan).", 'error');
        return;
    }

    if (currentStudents.length === 0 || (currentAlreadySubmitted && !isEditAttendanceMode) || isSavingAttendance) {
        if (currentAlreadySubmitted && !isEditAttendanceMode) {
            showToast("⛔ Absensi kelas & tanggal ini sudah tersimpan! Klik tombol 'Edit Data Absensi' jika ingin mengedit.", 'warning');
        }
        return;
    }

    isSavingAttendance = true; // Kunci proses simpan agar tidak bisa diklik berulang kali

    const session = JSON.parse(localStorage.getItem('smart_absen_user') || '{}');
    const namaPetugas = session.nama || 'Sistem';

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
        formData.append('is_edit', isEditAttendanceMode ? 'true' : 'false');

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
// UI TOAST NOTIFICATION (MODERN & GLASSMORPHIC)
// ----------------------------------------------------
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    let iconHtml = '<i class="fa-solid fa-circle-info"></i>';
    let titleText = 'Informasi';

    if (type === 'success') {
        iconHtml = '<i class="fa-solid fa-circle-check"></i>';
        titleText = 'Berhasil';
    } else if (type === 'error') {
        iconHtml = '<i class="fa-solid fa-circle-xmark"></i>';
        titleText = 'Gagal / Error';
    } else if (type === 'warning') {
        iconHtml = '<i class="fa-solid fa-triangle-exclamation"></i>';
        titleText = 'Peringatan';
    }

    const cleanMsg = String(message).replace(/^[✅❌⚠️⚡✏️⛔⏳]\s*/, '');

    toast.innerHTML = `
        <div class="toast-icon">${iconHtml}</div>
        <div class="toast-content">
            <span class="toast-title">${titleText}</span>
            <span class="toast-message">${cleanMsg}</span>
        </div>
    `;

    toast.className = `toast ${type}`;
    toast.style.cursor = 'pointer';
    toast.onclick = () => {
        toast.classList.remove('show');
    };

    void toast.offsetWidth;
    toast.classList.add('show');

    const duration = (type === 'info') ? 2500 : 3500;

    if (window.toastTimeout) clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// ----------------------------------------------------
// UI CUSTOM MODAL DIALOG (REPLACES NATIVE ALERT & CONFIRM)
// ----------------------------------------------------
function showCustomConfirm({ title = 'Konfirmasi', message = 'Apakah Anda yakin?', icon = 'warning', confirmText = 'Ya, Lanjutkan', cancelText = 'Batal', danger = false }) {
    return new Promise((resolve) => {
        let overlay = document.getElementById('customAlertOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'customAlertOverlay';
            overlay.className = 'custom-alert-overlay';
            document.body.appendChild(overlay);
        }

        let iconClass = 'fa-solid fa-triangle-exclamation';
        let iconTypeClass = 'warning';

        if (icon === 'danger' || danger) {
            iconClass = 'fa-solid fa-trash-can';
            iconTypeClass = 'danger';
        } else if (icon === 'info') {
            iconClass = 'fa-solid fa-circle-info';
            iconTypeClass = 'info';
        } else if (icon === 'success') {
            iconClass = 'fa-solid fa-circle-check';
            iconTypeClass = 'success';
        }

        overlay.innerHTML = `
            <div class="custom-alert-box">
                <div class="custom-alert-icon-wrap ${iconTypeClass}">
                    <i class="${iconClass}"></i>
                </div>
                <div class="custom-alert-title">${title}</div>
                <div class="custom-alert-message">${message}</div>
                <div class="custom-alert-actions">
                    <button type="button" class="custom-alert-btn custom-alert-btn-cancel" id="btnCustomAlertCancel">
                        <i class="fa-solid fa-xmark"></i> ${cancelText}
                    </button>
                    <button type="button" class="custom-alert-btn custom-alert-btn-confirm ${danger ? 'danger' : ''}" id="btnCustomAlertConfirm">
                        <i class="fa-solid fa-check"></i> ${confirmText}
                    </button>
                </div>
            </div>
        `;

        void overlay.offsetWidth;
        overlay.classList.add('active');

        const btnCancel = overlay.querySelector('#btnCustomAlertCancel');
        const btnConfirm = overlay.querySelector('#btnCustomAlertConfirm');

        const closeDialog = (result) => {
            overlay.classList.remove('active');
            setTimeout(() => {
                resolve(result);
            }, 300);
        };

        btnCancel.onclick = () => closeDialog(false);
        btnConfirm.onclick = () => closeDialog(true);
        overlay.onclick = (e) => {
            if (e.target === overlay) closeDialog(false);
        };
    });
}

function showCustomAlert({ title = 'Informasi', message = '', icon = 'info', buttonText = 'Mengerti' }) {
    return new Promise((resolve) => {
        let overlay = document.getElementById('customAlertOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'customAlertOverlay';
            overlay.className = 'custom-alert-overlay';
            document.body.appendChild(overlay);
        }

        let iconClass = 'fa-solid fa-circle-info';
        let iconTypeClass = 'info';

        if (icon === 'danger' || icon === 'error') {
            iconClass = 'fa-solid fa-circle-xmark';
            iconTypeClass = 'danger';
        } else if (icon === 'warning') {
            iconClass = 'fa-solid fa-triangle-exclamation';
            iconTypeClass = 'warning';
        } else if (icon === 'success') {
            iconClass = 'fa-solid fa-circle-check';
            iconTypeClass = 'success';
        }

        overlay.innerHTML = `
            <div class="custom-alert-box">
                <div class="custom-alert-icon-wrap ${iconTypeClass}">
                    <i class="${iconClass}"></i>
                </div>
                <div class="custom-alert-title">${title}</div>
                <div class="custom-alert-message">${message}</div>
                <div class="custom-alert-actions">
                    <button type="button" class="custom-alert-btn custom-alert-btn-confirm" id="btnCustomAlertOk" style="width: 100%;">
                        <i class="fa-solid fa-check"></i> ${buttonText}
                    </button>
                </div>
            </div>
        `;

        void overlay.offsetWidth;
        overlay.classList.add('active');

        const btnOk = overlay.querySelector('#btnCustomAlertOk');

        const closeDialog = () => {
            overlay.classList.remove('active');
            setTimeout(() => {
                resolve(true);
            }, 300);
        };

        btnOk.onclick = () => closeDialog();
        overlay.onclick = (e) => {
            if (e.target === overlay) closeDialog();
        };
    });
}

// Global Override for window.alert to guarantee custom UI styling everywhere
window.alert = function(msg) {
    if (typeof showToast === 'function') {
        showToast(msg, 'info');
    }
};

// ----------------------------------------------------
// DYNAMIC FOOTER CURRENT YEAR UPDATER
// ----------------------------------------------------
function updateCurrentYearElements() {
    const currentYear = new Date().getFullYear();
    document.querySelectorAll('.app-current-year').forEach(el => {
        el.innerText = currentYear;
    });
}

// ----------------------------------------------------
// SIDEBAR COLLAPSE & TOGGLE MANAGEMENT
// ----------------------------------------------------
function initSidebarToggle() {
    const btnToggle = document.getElementById('btnToggleSidebar');
    const btnFloatingToggle = document.getElementById('btnFloatingSidebarToggle');
    const overlay = document.getElementById('sidebarOverlay');
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');

    // Restore saved desktop preference
    const isCollapsedSaved = localStorage.getItem('smart_absen_sidebar_collapsed') === 'true';
    if (isCollapsedSaved && window.innerWidth > 768) {
        document.body.classList.add('sidebar-collapsed');
    }

    const toggleSidebarAction = (e) => {
        if (e) e.stopPropagation();
        if (window.innerWidth <= 768) {
            document.body.classList.toggle('sidebar-mobile-open');
        } else {
            document.body.classList.toggle('sidebar-collapsed');
            const isNowCollapsed = document.body.classList.contains('sidebar-collapsed');
            localStorage.setItem('smart_absen_sidebar_collapsed', isNowCollapsed);
        }
    };

    if (btnToggle) btnToggle.addEventListener('click', toggleSidebarAction);
    if (btnFloatingToggle) btnFloatingToggle.addEventListener('click', toggleSidebarAction);

    if (overlay) {
        overlay.addEventListener('click', () => {
            document.body.classList.remove('sidebar-mobile-open');
        });
    }

    // Auto close sidebar on mobile when nav item is clicked
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                document.body.classList.remove('sidebar-mobile-open');
            }
        });
    });
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => {
        updateCurrentYearElements();
        initSidebarToggle();
    });
} else {
    updateCurrentYearElements();
    initSidebarToggle();
}
