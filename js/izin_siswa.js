/**
 * =========================================================================
 * MODUL PENGAJUAN IZIN SISWA & APPROVAL WALI KELAS (V1.0)
 * =========================================================================
 */

let globalIzinSiswaLogs = [];
let pageIzinSiswa = 1;
const pageSizeIzinSiswa = 10;

let pageIzinWalas = 1;
const pageSizeIzinWalas = 10;
let queryWalasHistoryIzinSiswa = '';

let currentBase64Photo = '';

function getScriptUrlSafely() {
    if (typeof SCRIPT_URL !== 'undefined' && SCRIPT_URL) return SCRIPT_URL;
    if (window.SCRIPT_URL) return window.SCRIPT_URL;
    return localStorage.getItem('absen_script_url') || '';
}

function refreshAllApprovalIzinData() {
    if (typeof loadIzinSiswaData === 'function') loadIzinSiswaData();
    if (typeof loadEduIzinData === 'function') loadEduIzinData();
}
window.refreshAllApprovalIzinData = refreshAllApprovalIzinData;

/**
 * Tab switcher for panel-izin-siswa (KBM & Tidak Hadir)
 */
function switchIzinSiswaTab(tabId) {
    // Hide all tab contents
    document.querySelectorAll('.izin-siswa-tab-content').forEach(el => {
        el.style.display = 'none';
    });

    // Reset all tab buttons to inactive style
    document.querySelectorAll('.izin-siswa-tab-btn').forEach(btn => {
        btn.style.borderBottom = '3px solid transparent';
        btn.style.background = 'transparent';
        btn.style.color = 'var(--text-muted)';
    });

    // Show selected tab
    const target = document.getElementById(tabId);
    if (target) target.style.display = 'block';

    // Activate clicked button
    const activeBtn = document.querySelector(`.izin-siswa-tab-btn[data-tab="${tabId}"]`);
    if (activeBtn) {
        if (tabId === 'tab-kbm') {
            activeBtn.style.borderBottom = '3px solid #f59e0b';
            activeBtn.style.background = 'rgba(245,158,11,0.12)';
            activeBtn.style.color = '#f59e0b';
        } else if (tabId === 'tab-tidakhadir') {
            activeBtn.style.borderBottom = '3px solid #10b981';
            activeBtn.style.background = 'rgba(16,185,129,0.12)';
            activeBtn.style.color = '#10b981';
        } else if (tabId === 'tab-riwayat') {
            activeBtn.style.borderBottom = '3px solid #38bdf8';
            activeBtn.style.background = 'rgba(56,189,248,0.12)';
            activeBtn.style.color = '#38bdf8';
        }
    }
}
window.switchIzinSiswaTab = switchIzinSiswaTab;


document.addEventListener('DOMContentLoaded', () => {
    initIzinSiswaEvents();
});

function initIzinSiswaEvents() {
    const inputTanggal = document.getElementById('inputIzinSiswaTanggal');
    if (inputTanggal && !inputTanggal.value) {
        inputTanggal.value = new Date().toISOString().split('T')[0];
    }

    const inputFoto = document.getElementById('inputIzinSiswaFoto');
    if (inputFoto) {
        inputFoto.addEventListener('change', handleFotoSiswaChange);
    }

    const formIzin = document.getElementById('formPengajuanIzinSiswa');
    if (formIzin) {
        formIzin.addEventListener('submit', handleFormIzinSiswaSubmit);
    }

    const btnRefreshSiswa = document.getElementById('btnRefreshIzinSiswa');
    if (btnRefreshSiswa) {
        btnRefreshSiswa.addEventListener('click', loadIzinSiswaData);
    }

    const btnRefreshWalas = document.getElementById('btnRefreshApprovalIzinSiswa');
    if (btnRefreshWalas) {
        btnRefreshWalas.addEventListener('click', loadIzinSiswaData);
    }

    const inputSearchWalas = document.getElementById('searchWalasHistoryIzinSiswa');
    if (inputSearchWalas) {
        inputSearchWalas.addEventListener('input', (e) => {
            queryWalasHistoryIzinSiswa = e.target.value.trim().toLowerCase();
            pageIzinWalas = 1;
            renderWalasIzinApprovalTable();
        });
    }

    // Pagination events
    const btnPrevSiswa = document.getElementById('btnPrevIzinSiswa');
    const btnNextSiswa = document.getElementById('btnNextIzinSiswa');
    if (btnPrevSiswa) {
        btnPrevSiswa.addEventListener('click', () => {
            if (pageIzinSiswa > 1) {
                pageIzinSiswa--;
                renderStudentIzinMyTable();
            }
        });
    }
    if (btnNextSiswa) {
        btnNextSiswa.addEventListener('click', () => {
            pageIzinSiswa++;
            renderStudentIzinMyTable();
        });
    }

    const btnPrevWalas = document.getElementById('btnPrevIzinSiswaWalas');
    const btnNextWalas = document.getElementById('btnNextIzinSiswaWalas');
    if (btnPrevWalas) {
        btnPrevWalas.addEventListener('click', () => {
            if (pageIzinWalas > 1) {
                pageIzinWalas--;
                renderWalasIzinApprovalTable();
            }
        });
    }
    if (btnNextWalas) {
        btnNextWalas.addEventListener('click', () => {
            pageIzinWalas++;
            renderWalasIzinApprovalTable();
        });
    }

    // Modal photo close
    const btnCloseModal = document.getElementById('btnCloseModalFotoIzin');
    const modalFoto = document.getElementById('modalPreviewFotoIzin');
    if (btnCloseModal && modalFoto) {
        btnCloseModal.addEventListener('click', () => {
            modalFoto.style.display = 'none';
        });
        modalFoto.addEventListener('click', (e) => {
            if (e.target === modalFoto) modalFoto.style.display = 'none';
        });
    }

    // Tab / Nav click listener to auto-load
    const navIzinSiswa = document.getElementById('nav-izin-siswa');
    if (navIzinSiswa) {
        navIzinSiswa.addEventListener('click', loadIzinSiswaData);
    }

    const navApprovalWalas = document.getElementById('nav-approval-kepsek');
    if (navApprovalWalas) {
        navApprovalWalas.addEventListener('click', loadIzinSiswaData);
    }
}

/**
 * Image file reading & compression
 */
function handleFotoSiswaChange(e) {
    const file = e.target.files[0];
    const labelSelected = document.getElementById('labelFotoSelected');
    const previewContainer = document.getElementById('previewFotoSiswaContainer');
    const imgPreview = document.getElementById('imgPreviewIzinSiswa');

    if (!file) {
        currentBase64Photo = '';
        if (labelSelected) labelSelected.textContent = 'Belum ada foto dipilih';
        if (previewContainer) previewContainer.style.display = 'none';
        return;
    }

    if (labelSelected) labelSelected.textContent = file.name;

    const reader = new FileReader();
    reader.onload = function (evt) {
        const img = new Image();
        img.onload = function () {
            // Compress Image via Canvas to max 800px width/height
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxDim = 800;

            if (width > maxDim || height > maxDim) {
                if (width > height) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                } else {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            currentBase64Photo = canvas.toDataURL('image/jpeg', 0.75);

            if (imgPreview) imgPreview.src = currentBase64Photo;
            if (previewContainer) previewContainer.style.display = 'block';
        };
        img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
}

/**
 * Handle form submission for Student Leave Request
 */

function getLoggedUserSafely() {
    try {
        const u = localStorage.getItem('smart_absen_user');
        return u ? JSON.parse(u) : null;
    } catch (e) {
        return null;
    }
}

async function handleFormIzinSiswaSubmit(e) {
    e.preventDefault();

    const tgl = document.getElementById('inputIzinSiswaTanggal').value;
    const kategori = document.getElementById('inputIzinSiswaKategori').value;
    const keterangan = document.getElementById('inputIzinSiswaKeterangan').value.trim();

    if (!tgl || !kategori || !keterangan) {
        if (typeof showToast === 'function') showToast('Harap lengkapi tanggal, kategori, dan keterangan!', 'warning');
        return;
    }

    if (!currentBase64Photo) {
        if (typeof showToast === 'function') showToast('Wajib melampirkan foto bukti (surat dokter / keterangan)!', 'warning');
        return;
    }

    const user = getLoggedUserSafely();
    if (!user) {
        if (typeof showToast === 'function') showToast('Sesi user tidak ditemukan. Silakan login kembali.', 'error');
        return;
    }

    const btnSubmit = document.getElementById('btnKirimIzinSiswa');
    const originalText = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Mengirim Pengajuan...`;

    const payload = {
        tanggal: tgl,
        kategori: kategori,
        keterangan: keterangan,
        fotoUrl: currentBase64Photo,
        nisn: user.nisn || user.username || '',
        nis: user.nis || user.username || '',
        nama: user.nama || user.namaLengkap || user.username || 'Siswa',
        kelas: user.kelas || '',
        id_telegram: user.id_telegram || ''
    };

    try {
        const targetUrl = getScriptUrlSafely();
        if (!targetUrl) {
            if (typeof showToast === 'function') showToast('URL Backend belum disetel.', 'error');
            return;
        }

        const formData = new URLSearchParams();
        formData.append('action', 'add_pengajuan_izin_siswa');
        formData.append('data', JSON.stringify(payload));

        const response = await fetch(targetUrl, {
            method: 'POST',
            body: formData
        });

        const res = await response.json();
        if (res.status === 'success') {
            if (typeof showToast === 'function') showToast('✅ ' + res.message, 'success');

            // Reset Form
            document.getElementById('formPengajuanIzinSiswa').reset();
            currentBase64Photo = '';
            const previewContainer = document.getElementById('previewFotoSiswaContainer');
            const labelSelected = document.getElementById('labelFotoSelected');
            if (previewContainer) previewContainer.style.display = 'none';
            if (labelSelected) labelSelected.textContent = 'Belum ada foto dipilih';

            const inputTanggal = document.getElementById('inputIzinSiswaTanggal');
            if (inputTanggal) inputTanggal.value = new Date().toISOString().split('T')[0];

            loadIzinSiswaData();
        } else {
            if (typeof showToast === 'function') showToast('⚠️ ' + (res.message || 'Gagal mengirim pengajuan'), 'error');
        }
    } catch (err) {
        console.error("Error submitting izin siswa:", err);
        if (typeof showToast === 'function') showToast('Gagal terhubung ke server: ' + err.message, 'error');
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalText;
    }
}

let isLoadingIzinSiswa = false;

/**
 * Sanitize & auto-heal legacy/misaligned logs and invalid dates
 */
function sanitizeIzinSiswaLogs(rawLogs) {
    if (!Array.isArray(rawLogs)) return [];
    return rawLogs.map(item => {
        if (!item || typeof item !== 'object') return item;
        const copy = { ...item };

        // Auto-heal shifted columns from legacy backend parsing bug
        // e.g. item.nama is numeric ("4688") and item.kelas has student name ("Tubagus Argya Wijaya")
        if (copy.nama && /^\d+$/.test(String(copy.nama).trim()) && copy.kelas && /[a-zA-Z]/.test(String(copy.kelas).trim())) {
            const rawNis = copy.nama;
            const rawNama = copy.kelas;
            const rawKelas = copy.kategori;
            const rawWalas = copy.keterangan;

            copy.nis = rawNis;
            copy.nama = rawNama;
            copy.kelas = rawKelas || '';
            copy.waliKelas = rawWalas || '-';

            // Extract real kategori and keterangan if shifted
            copy.kategori = (copy.status && ['izin', 'sakit', 'dispensasi'].some(k => String(copy.status).toLowerCase().includes(k)))
                ? copy.status
                : 'Izin';

            if (String(copy.disetujuiOleh || '').trim().toLowerCase() === 'pending') {
                copy.status = 'Pending';
                copy.disetujuiOleh = '';
            } else if (copy.disetujuiOleh) {
                copy.status = 'Disetujui';
            } else {
                copy.status = 'Pending';
            }
            copy.keterangan = '-';
        }

        // Clean trailing comma or time from tanggal if needed
        if (copy.tanggal && typeof copy.tanggal === 'string') {
            copy.tanggal = copy.tanggal.split(',')[0].trim();
        }

        // Strip NaN from waktuPersetujuan or disetujuiOleh
        if (copy.waktuPersetujuan && String(copy.waktuPersetujuan).includes('NaN')) {
            copy.waktuPersetujuan = '';
        }
        if (copy.disetujuiOleh && String(copy.disetujuiOleh).includes('NaN')) {
            copy.disetujuiOleh = copy.disetujuiOleh.replace(/NaN-aN-aNaNaN/g, '').trim();
        }

        return copy;
    });
}

/**
 * Fetch all student leave requests from Backend
 */
async function loadIzinSiswaData() {
    if (isLoadingIzinSiswa) return;
    isLoadingIzinSiswa = true;

    // Load INSTANTLY from local storage cache first! (0ms delay)
    try {
        const cached = localStorage.getItem('smart_absen_izin_siswa_cache');
        if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
                globalIzinSiswaLogs = sanitizeIzinSiswaLogs(parsed);
                renderStudentIzinMyTable();
                renderWalasIzinApprovalTable();
                if (typeof updatePendingNotificationBadge === 'function') updatePendingNotificationBadge();
            }
        }
    } catch (e) { }

    const btns = [
        document.getElementById('btnRefreshIzinSiswa'),
        document.getElementById('btnRefreshApprovalIzinSiswa')
    ].filter(Boolean);

    btns.forEach(b => {
        b.disabled = true;
        b.innerHTML = '<i class="fa-solid fa-arrows-rotate fa-spin spin-icon" style="margin-right: 6px;"></i> Memuat...';
    });

    const startTime = Date.now();

    try {
        const targetUrl = getScriptUrlSafely();
        if (!targetUrl) return;

        const url = `${targetUrl}?action=get_izin_siswa&_t=${Date.now()}`;

        let res;
        if (typeof fetchWithRetry === 'function') {
            res = await fetchWithRetry(url, { method: 'GET' }, 1, 1000);
        } else {
            const response = await fetch(url);
            res = await response.json();
        }

        if (res && res.status === 'success' && Array.isArray(res.data)) {
            globalIzinSiswaLogs = sanitizeIzinSiswaLogs(res.data);
            try { localStorage.setItem('smart_absen_izin_siswa_cache', JSON.stringify(globalIzinSiswaLogs)); } catch (e) { }
            pageIzinSiswa = 1;
            pageIzinWalas = 1;
            renderStudentIzinMyTable();
            renderWalasIzinApprovalTable();
            if (typeof updatePendingNotificationBadge === 'function') updatePendingNotificationBadge();
        }
    } catch (err) {
        console.error("Error loading izin siswa data:", err);
    } finally {
        const elapsedTime = Date.now() - startTime;
        const remainingDelay = Math.max(0, 300 - elapsedTime);

        setTimeout(() => {
            btns.forEach(b => {
                b.disabled = false;
                b.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Refresh';
            });
            isLoadingIzinSiswa = false;
        }, remainingDelay);
    }
}

/**
 * Render Student My Requests Table (with 10-row pagination)
 */
function renderStudentIzinMyTable() {
    const tbody = document.getElementById('tbodyRiwayatIzinSiswa');
    if (!tbody) return;

    const user = getLoggedUserSafely();
    if (!user) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 20px;">Silakan login untuk melihat riwayat.</td></tr>`;
        return;
    }

    const uNisn = String(user.nisn || '').trim().toLowerCase();
    const uNis = String(user.nis || '').trim().toLowerCase();
    const uNama = String(user.nama || user.namaLengkap || user.username || '').trim().toLowerCase();

    // Filter logs for this specific student
    const myLogs = globalIzinSiswaLogs.filter(item => {
        const iNisn = String(item.nisn || '').trim().toLowerCase();
        const iNis = String(item.nis || '').trim().toLowerCase();
        const iNama = String(item.nama || '').trim().toLowerCase();

        return (uNisn && iNisn === uNisn) || (uNis && iNis === uNis) || (uNama && iNama === uNama);
    });

    const totalData = myLogs.length;
    const totalPages = Math.ceil(totalData / pageSizeIzinSiswa) || 1;

    if (pageIzinSiswa > totalPages) pageIzinSiswa = totalPages;
    if (pageIzinSiswa < 1) pageIzinSiswa = 1;

    const startIndex = (pageIzinSiswa - 1) * pageSizeIzinSiswa;
    const pageData = myLogs.slice(startIndex, startIndex + pageSizeIzinSiswa);

    // Update Pagination UI Info
    const infoEle = document.getElementById('infoPaginationIzinSiswa');
    if (infoEle) {
        infoEle.textContent = `Halaman ${pageIzinSiswa} dari ${totalPages} (Total ${totalData} pengajuan)`;
    }

    const btnPrev = document.getElementById('btnPrevIzinSiswa');
    const btnNext = document.getElementById('btnNextIzinSiswa');
    if (btnPrev) btnPrev.disabled = pageIzinSiswa <= 1;
    if (btnNext) btnNext.disabled = pageIzinSiswa >= totalPages;

    if (pageData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">Belum ada riwayat pengajuan izin.</td></tr>`;
        return;
    }

    let html = '';
    pageData.forEach((item, index) => {
        const no = startIndex + index + 1;
        const statusBadge = getIzinStatusBadgeHtml(item.status);
        const fotoBtn = item.fotoUrl
            ? `<button type="button" class="btn-secondary" onclick="openFotoPreviewModal('${encodeURIComponent(item.fotoUrl)}', 'Bukti Foto: ${item.nama} (${item.tanggal})')" style="padding: 3px 10px; font-size: 0.75rem; background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4);"><i class="fa-solid fa-image"></i> Lihat Foto</button>`
            : `<span style="color: var(--text-muted); font-size: 0.75rem;">-</span>`;

        html += `
            <tr>
                <td style="text-align: center;">${no}</td>
                <td><strong style="color:#f8fafc;">${item.tanggal}</strong></td>
                <td style="text-align: center;"><span class="badge" style="background: rgba(148, 163, 184, 0.15); color: #e2e8f0; border: 1px solid rgba(148, 163, 184, 0.3); font-size: 0.75rem;">${item.kategori}</span></td>
                <td>${item.keterangan || '-'}</td>
                <td style="text-align: center;">${fotoBtn}</td>
                <td>${item.waliKelas || '-'}</td>
                <td style="text-align: center;">${statusBadge}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

/**
 * Render Wali Kelas / Teacher Approval Panel (Pending & History Table with 10-row pagination)
 */
function renderWalasIzinApprovalTable() {
    const tbodyPending = document.getElementById('tbodyPendingIzinSiswa');
    const tbodyHistory = document.getElementById('tbodyHistoryIzinSiswaWalas');
    if (!tbodyPending || !tbodyHistory) return;

    const user = getLoggedUserSafely();
    if (!user) return;

    const uRole = String(user.role || '').trim().toLowerCase();
    const uName = String(user.nama || user.namaLengkap || user.username || '').trim().toLowerCase();

    // Filter permohonan target Wali Kelas
    // If Admin or Kepsek -> sees ALL requests
    // If Guru (only) -> sees requests matching teacher's name
    let filteredLogs = globalIzinSiswaLogs;

    const isKepsekOrAdmin = uRole.includes('kepala sekolah') || uRole.includes('kepsek') || uRole.includes('admin');
    const uKelas = String(user.kelas || user.walas_kelas || user.wali_kelas || '').trim();

    const secWalas = document.getElementById('sectionWalasIzinSiswa');
    if (secWalas) {
        if (typeof checkAndShowEduIzinApprovalSections === 'function') {
            checkAndShowEduIzinApprovalSections();
        } else {
            secWalas.style.display = 'block';
        }
    }

    if (!isKepsekOrAdmin && (uRole.includes('guru') || uRole.includes('walas') || uRole.includes('wali kelas'))) {
        const myCleanName = typeof cleanNameTitleForBadge === 'function' ? cleanNameTitleForBadge(uName) : uName;
        const myKelasClean = uKelas.toLowerCase();

        filteredLogs = globalIzinSiswaLogs.filter(item => {
            const walasNameRaw = String(item.waliKelas || item.walas || '').trim();
            const walasNameClean = typeof cleanNameTitleForBadge === 'function' ? cleanNameTitleForBadge(walasNameRaw) : walasNameRaw.toLowerCase();
            const itemKelasClean = String(item.kelas || '').trim().toLowerCase();

            // Match 1: Nama Wali Kelas cocok dengan nama guru login
            if (myCleanName && walasNameClean && walasNameClean !== '-' && (walasNameClean === myCleanName || walasNameClean.includes(myCleanName) || myCleanName.includes(walasNameClean))) {
                return true;
            }

            // Match 2: Kelas siswa cocok dengan kelas yang di-walikan oleh guru login
            if (myKelasClean && myKelasClean !== '-' && myKelasClean !== 'umum' && itemKelasClean && itemKelasClean === myKelasClean) {
                return true;
            }

            // Jika tidak cocok keduanya, bukan siswa dari Wali Kelas ini
            return false;
        });
    }

    // Split Pending & History
    const isPendingStatus = (st) => {
        const s = String(st || 'Pending').trim().toLowerCase();
        return s === 'pending' || s.includes('menunggu');
    };

    const pendingList = filteredLogs.filter(item => isPendingStatus(item.status));
    const historyList = filteredLogs.filter(item => !isPendingStatus(item.status));

    // 1. RENDER PENDING TABLE
    const badgePendingCount = document.getElementById('badgePendingIzinSiswaCount');
    if (badgePendingCount) badgePendingCount.textContent = `${pendingList.length} Menunggu`;

    if (pendingList.length === 0) {
        tbodyPending.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 25px;">Tidak ada permohonan izin yang menunggu persetujuan.</td></tr>`;
    } else {
        let htmlPending = '';
        pendingList.forEach((item, index) => {
            const fotoBtn = item.fotoUrl
                ? `<button type="button" class="btn-secondary" onclick="openFotoPreviewModal('${encodeURIComponent(item.fotoUrl)}', 'Bukti Foto: ${item.nama} (${item.kelas})')" style="padding: 3px 10px; font-size: 0.75rem; background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4);"><i class="fa-solid fa-image"></i> Lihat Foto</button>`
                : `<span style="color: var(--text-muted); font-size: 0.75rem;">-</span>`;

            htmlPending += `
                <tr>
                    <td style="text-align: center;">${index + 1}</td>
                    <td><strong style="color:#f8fafc;">${item.tanggal}</strong></td>
                    <td><strong>${item.nama}</strong></td>
                    <td style="text-align: center;"><span class="badge" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);">${item.kelas}</span></td>
                    <td style="text-align: center;"><span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3);">${item.kategori}</span></td>
                    <td>${item.keterangan || '-'}</td>
                    <td style="text-align: center;">${fotoBtn}</td>
                    <td style="text-align: center;">
                        <div style="display: flex; gap: 6px; justify-content: center;">
                            <button type="button" onclick="handleApproveIzinSiswaAction('${item.id}', '${encodeURIComponent(item.nama)}')" class="btn-primary" style="padding: 5px 12px; font-size: 0.78rem; background: #059669; border-color: #10b981; border-radius: 6px;">
                                <i class="fa-solid fa-check"></i> Setujui
                            </button>
                            <button type="button" onclick="handleRejectIzinSiswaAction('${item.id}', '${encodeURIComponent(item.nama)}')" class="btn-secondary" style="padding: 5px 12px; font-size: 0.78rem; background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 6px;">
                                <i class="fa-solid fa-xmark"></i> Tolak
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        tbodyPending.innerHTML = htmlPending;
    }

    // 2. RENDER HISTORY TABLE (WITH SEARCH & 10-ROW PAGINASI)
    let displayHistoryList = historyList;
    if (queryWalasHistoryIzinSiswa) {
        displayHistoryList = historyList.filter(item => {
            const txt = `${item.tanggal} ${item.nama} ${item.kelas} ${item.kategori} ${item.keterangan} ${item.status} ${item.disetujuiOleh}`.toLowerCase();
            return txt.includes(queryWalasHistoryIzinSiswa);
        });
    }

    const totalData = displayHistoryList.length;
    const totalPages = Math.ceil(totalData / pageSizeIzinWalas) || 1;

    if (pageIzinWalas > totalPages) pageIzinWalas = totalPages;
    if (pageIzinWalas < 1) pageIzinWalas = 1;

    const startIndex = (pageIzinWalas - 1) * pageSizeIzinWalas;
    const pageData = displayHistoryList.slice(startIndex, startIndex + pageSizeIzinWalas);

    // Update Pagination UI Info
    const infoEle = document.getElementById('infoPaginationIzinSiswaWalas');
    if (infoEle) {
        infoEle.textContent = `Halaman ${pageIzinWalas} dari ${totalPages} (Total ${totalData} data)`;
    }

    const btnPrev = document.getElementById('btnPrevIzinSiswaWalas');
    const btnNext = document.getElementById('btnNextIzinSiswaWalas');
    if (btnPrev) btnPrev.disabled = pageIzinWalas <= 1;
    if (btnNext) btnNext.disabled = pageIzinWalas >= totalPages;

    if (pageData.length === 0) {
        tbodyHistory.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 25px;">Belum ada riwayat keputusan.</td></tr>`;
        return;
    }

    let htmlHistory = '';
    pageData.forEach((item, index) => {
        const no = startIndex + index + 1;
        const statusBadge = getIzinStatusBadgeHtml(item.status);
        const fotoBtn = item.fotoUrl
            ? `<button type="button" class="btn-secondary" onclick="openFotoPreviewModal('${encodeURIComponent(item.fotoUrl)}', 'Bukti Foto: ${item.nama} (${item.kelas})')" style="padding: 3px 10px; font-size: 0.75rem; background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4);"><i class="fa-solid fa-image"></i> Lihat Foto</button>`
            : `<span style="color: var(--text-muted); font-size: 0.75rem;">-</span>`;

        htmlHistory += `
            <tr>
                <td style="text-align: center;">${no}</td>
                <td><strong style="color:#f8fafc;">${item.tanggal}</strong></td>
                <td><strong>${item.nama}</strong></td>
                <td style="text-align: center;"><span class="badge" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);">${item.kelas}</span></td>
                <td style="text-align: center;"><span class="badge" style="background: rgba(148, 163, 184, 0.15); color: #e2e8f0; border: 1px solid rgba(148, 163, 184, 0.3);">${item.kategori}</span></td>
                <td>${item.keterangan || '-'}</td>
                <td style="text-align: center;">${fotoBtn}</td>
                <td style="text-align: center;">${statusBadge}</td>
                <td><small style="color: #cbd5e1;">${item.disetujuiOleh || '-'}</small><br><small style="color: var(--text-muted); font-size: 0.7rem;">${item.waktuPersetujuan || ''}</small></td>
            </tr>
        `;
    });

    tbodyHistory.innerHTML = htmlHistory;
}

/**
 * Approve Izin Action
 */
async function handleApproveIzinSiswaAction(id, rawNama, btnEl) {
    const namaSiswa = decodeURIComponent(rawNama);
    const confirmed = await showCustomConfirm({
        title: 'Setujui Pengajuan Izin',
        message: `Apakah Anda yakin ingin MENYETUJUI pengajuan izin dari "${namaSiswa}"?\n\nPresensi siswa pada tanggal tersebut akan otomatis dicatat sebagai Izin/Sakit.`,
        icon: 'success',
        confirmText: 'Ya, Setujui',
        cancelText: 'Batal'
    });
    if (!confirmed) return;

    const targetBtn = btnEl || (window.event && window.event.target ? window.event.target.closest('button') : null);
    const parentContainer = targetBtn ? targetBtn.parentElement : null;
    const originalHtml = targetBtn ? targetBtn.innerHTML : '';

    if (targetBtn) {
        if (parentContainer) {
            parentContainer.querySelectorAll('button').forEach(b => b.disabled = true);
        }
        targetBtn.disabled = true;
        targetBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
    }

    const user = getLoggedUserSafely();
    const approverName = user ? (user.nama || user.namaLengkap || user.username) : 'Wali Kelas';
    const approverRole = user ? user.role : 'Guru';

    try {
        const formData = new URLSearchParams();
        formData.append('action', 'approve_izin_siswa');
        formData.append('id', id);
        formData.append('approver_name', approverName);
        formData.append('approver_role', approverRole);

        const targetUrl = getScriptUrlSafely();
        if (!targetUrl) {
            if (typeof showToast === 'function') showToast('URL Backend belum disetel.', 'error');
            return;
        }

        const response = await fetch(targetUrl, {
            method: 'POST',
            body: formData
        });

        const res = await response.json();
        if (res.status === 'success') {
            if (typeof showToast === 'function') showToast('✅ ' + res.message, 'success');
            loadIzinSiswaData();
        } else {
            if (typeof showToast === 'function') showToast('⚠️ ' + (res.message || 'Gagal menyetujui izin'), 'error');
            if (targetBtn) {
                if (parentContainer) {
                    parentContainer.querySelectorAll('button').forEach(b => b.disabled = false);
                }
                targetBtn.disabled = false;
                targetBtn.innerHTML = originalHtml;
            }
        }
    } catch (err) {
        console.error("Error approving izin siswa:", err);
        if (typeof showToast === 'function') showToast('Gagal terhubung ke server', 'error');
        if (targetBtn) {
            if (parentContainer) {
                parentContainer.querySelectorAll('button').forEach(b => b.disabled = false);
            }
            targetBtn.disabled = false;
            targetBtn.innerHTML = originalHtml;
        }
    }
}

/**
 * Reject Izin Action
 */
async function handleRejectIzinSiswaAction(id, rawNama, btnEl) {
    const namaSiswa = decodeURIComponent(rawNama);
    const confirmed = await showCustomConfirm({
        title: 'Tolak Pengajuan Izin',
        message: `Apakah Anda yakin ingin MENOLAK pengajuan izin dari "${namaSiswa}"?`,
        icon: 'danger',
        confirmText: 'Ya, Tolak',
        cancelText: 'Batal',
        danger: true
    });
    if (!confirmed) return;

    const targetBtn = btnEl || (window.event && window.event.target ? window.event.target.closest('button') : null);
    const parentContainer = targetBtn ? targetBtn.parentElement : null;
    const originalHtml = targetBtn ? targetBtn.innerHTML : '';

    if (targetBtn) {
        if (parentContainer) {
            parentContainer.querySelectorAll('button').forEach(b => b.disabled = true);
        }
        targetBtn.disabled = true;
        targetBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
    }

    const user = getLoggedUserSafely();
    const approverName = user ? (user.nama || user.namaLengkap || user.username) : 'Wali Kelas';
    const approverRole = user ? user.role : 'Guru';

    try {
        const formData = new URLSearchParams();
        formData.append('action', 'reject_izin_siswa');
        formData.append('id', id);
        formData.append('approver_name', approverName);
        formData.append('approver_role', approverRole);

        const targetUrl = getScriptUrlSafely();
        if (!targetUrl) {
            if (typeof showToast === 'function') showToast('URL Backend belum disetel.', 'error');
            return;
        }

        const response = await fetch(targetUrl, {
            method: 'POST',
            body: formData
        });

        const res = await response.json();
        if (res.status === 'success') {
            if (typeof showToast === 'function') showToast('✅ ' + res.message, 'success');
            loadIzinSiswaData();
        } else {
            if (typeof showToast === 'function') showToast('⚠️ ' + (res.message || 'Gagal menolak izin'), 'error');
            if (targetBtn) {
                if (parentContainer) {
                    parentContainer.querySelectorAll('button').forEach(b => b.disabled = false);
                }
                targetBtn.disabled = false;
                targetBtn.innerHTML = originalHtml;
            }
        }
    } catch (err) {
        console.error("Error rejecting izin siswa:", err);
        if (typeof showToast === 'function') showToast('Gagal terhubung ke server', 'error');
        if (targetBtn) {
            if (parentContainer) {
                parentContainer.querySelectorAll('button').forEach(b => b.disabled = false);
            }
            targetBtn.disabled = false;
            targetBtn.innerHTML = originalHtml;
        }
    }
}

/**
 * Helper to show Modal Photo Preview
 */
function openFotoPreviewModal(rawUrl, caption) {
    const photoUrl = decodeURIComponent(rawUrl);
    const modal = document.getElementById('modalPreviewFotoIzin');
    const img = document.getElementById('modalFotoImage');
    const cap = document.getElementById('modalFotoCaption');

    if (modal && img) {
        img.src = photoUrl;
        if (cap) cap.textContent = caption || '';
        modal.style.display = 'flex';
    }
}

/**
 * Status badge generator
 */
function getIzinStatusBadgeHtml(status) {
    const st = String(status || 'Pending').toLowerCase();
    if (st === 'disetujui') {
        return `<span class="badge" style="background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.4);"><i class="fa-solid fa-circle-check"></i> Disetujui</span>`;
    } else if (st === 'ditolak') {
        return `<span class="badge" style="background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.4);"><i class="fa-solid fa-circle-xmark"></i> Ditolak</span>`;
    } else {
        return `<span class="badge" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4);"><i class="fa-solid fa-clock"></i> Pending</span>`;
    }
}

