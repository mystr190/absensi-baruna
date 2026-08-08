// ==========================================
// MODUL ABSEN GURU MANUAL, PENGAJUAN IZIN & APPROVAL KEPALA SEKOLAH
// ==========================================

let localLogAbsenGuru = JSON.parse(localStorage.getItem('smart_absen_log_guru') || '[]');
let localPengajuanIzin = JSON.parse(localStorage.getItem('smart_absen_pengajuan_izin') || '[]');
let isEditAbsenGuruBatchMode = false;

window.forceEditAbsenGuruBatch = function() {
    isEditAbsenGuruBatchMode = true;
    renderAbsenGuruBatchTable();
};

// Inisialisasi Event Listener setelah DOM Siap
document.addEventListener('DOMContentLoaded', () => {
    initAbsenGuruEventListeners();
    applyCachedAbsenGuruData();
});

function applyMaxDateRestriction() {
    const todayStr = getTodayFormattedDate();
    const dateInputIds = ['inputAbsenGuruTanggalBatch', 'inputIzinTanggal', 'inputTanggalAbsen'];
    dateInputIds.forEach(id => {
        const inp = document.getElementById(id);
        if (inp) {
            inp.setAttribute('max', todayStr);
        }
    });
}

function initAbsenGuruEventListeners() {
    applyMaxDateRestriction();

    const formIzin = document.getElementById('formPengajuanIzin');
    if (formIzin) {
        formIzin.addEventListener('submit', handleSubmiIzinGuru);
    }

    const formAbsenGuruBatch = document.getElementById('formAbsenGuruBatch');
    if (formAbsenGuruBatch) {
        formAbsenGuruBatch.addEventListener('submit', handleSaveAbsenGuruBatch);
    }

    const tglBatch = document.getElementById('inputAbsenGuruTanggalBatch');
    if (tglBatch) {
        tglBatch.addEventListener('change', () => {
            const todayStr = getTodayFormattedDate();
            if (tglBatch.value > todayStr) {
                showToast("⚠️ Tidak dapat melakukan presensi guru untuk tanggal yang belum terjadi!", 'warning');
                tglBatch.value = todayStr;
            }
            isEditAbsenGuruBatchMode = false;
            renderAbsenGuruBatchTable();
        });
    }

    const btnKosongkan = document.getElementById('btnKosongkanAbsenGuruTanggal');
    if (btnKosongkan) {
        btnKosongkan.addEventListener('click', handleKosongkanAbsenGuruTanggal);
    }

    const btnHadir = document.getElementById('btnSetSemuaHadir');
    if (btnHadir) {
        btnHadir.addEventListener('click', () => setSemuaStatusAbsenGuru('HADIR'));
    }

    const btnTidakHadir = document.getElementById('btnSetSemuaTidakHadir');
    if (btnTidakHadir) {
        btnTidakHadir.addEventListener('click', () => setSemuaStatusAbsenGuru('TIDAK HADIR'));
    }

    const btnRefresh = document.getElementById('btnRefreshAbsenGuru');
    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            syncAbsenGuruDataFromServer();
        });
    }

    const btnPrintGuru = document.getElementById('btnPrintRekapGuru');
    if (btnPrintGuru) {
        btnPrintGuru.addEventListener('click', printRekapGuru);
    }

    const btnExportGuru = document.getElementById('btnExportRekapGuru');
    if (btnExportGuru) {
        btnExportGuru.addEventListener('click', exportRekapGuruCSV);
    }

    const filterBulan = document.getElementById('filterBulanAbsenGuru');
    if (filterBulan) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        filterBulan.value = `${yyyy}-${mm}`;
        filterBulan.addEventListener('change', () => {
            renderTableLogAbsenGuru();
            renderRekapMatrixGuru();
        });
    }

    const selectTipeMode = document.getElementById('selectTipeRekapGuru');
    const containerBulan = document.getElementById('containerFilterBulanGuru');
    const containerRentang = document.getElementById('containerFilterRentangGuru');
    const inputMulai = document.getElementById('inputTanggalMulaiGuru');
    const inputSelesai = document.getElementById('inputTanggalSelesaiGuru');

    if (inputMulai && !inputMulai.value) inputMulai.value = getTodayFormattedDate();
    if (inputSelesai && !inputSelesai.value) inputSelesai.value = getTodayFormattedDate();

    if (selectTipeMode) {
        selectTipeMode.addEventListener('change', () => {
            const val = selectTipeMode.value;
            if (val === 'rentang') {
                if (containerBulan) containerBulan.style.display = 'none';
                if (containerRentang) containerRentang.style.display = 'flex';
            } else {
                if (containerBulan) containerBulan.style.display = 'flex';
                if (containerRentang) containerRentang.style.display = 'none';
            }
            renderTableLogAbsenGuru();
            renderRekapMatrixGuru();
        });
    }

    if (inputMulai) {
        inputMulai.addEventListener('change', () => {
            renderTableLogAbsenGuru();
            renderRekapMatrixGuru();
        });
    }
    if (inputSelesai) {
        inputSelesai.addEventListener('change', () => {
            renderTableLogAbsenGuru();
            renderRekapMatrixGuru();
        });
    }
}

function applyCachedAbsenGuruData() {
    renderIzinGuruPanel();
    renderApprovalKepsekPanel();
    renderAbsenGuruAdminPanel();
}

function cleanKeterangan(ket) {
    if (!ket) return '-';
    let clean = String(ket).replace(/\[Persetujuan [^\]]+\]\s*/gi, '').trim();
    return clean || '-';
}

function getFormattedDisplayDate(dateStr) {
    if (!dateStr) return '-';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const parts = dateStr.split('-');
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
}

function getTodayFormattedDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// ----------------------------------------------------
// 1. PANEL PENGAJUAN IZIN GURU & WIDGET TIDAK HADIR
// ----------------------------------------------------
function renderIzinGuruPanel() {
    const inputTgl = document.getElementById('inputIzinTanggal');
    if (inputTgl && !inputTgl.value) {
        inputTgl.value = getTodayFormattedDate();
    }

    const txtTglHariIni = document.getElementById('txtTanggalHariIni');
    if (txtTglHariIni) {
        const todayStr = getTodayFormattedDate();
        txtTglHariIni.innerText = getFormattedDisplayDate(todayStr);
    }

    // Sembunyikan Formulir & Riwayat Pengajuan Izin jika Login sebagai Admin
    const loggedUser = JSON.parse(localStorage.getItem('smart_absen_user') || '{}');
    const userRole = (loggedUser.role || '').trim().toLowerCase();

    const cardForm = document.getElementById('cardFormPengajuanIzin');
    const cardRiwayat = document.getElementById('cardRiwayatPengajuanIzin');

    if (userRole === 'admin') {
        if (cardForm) cardForm.style.display = 'none';
        if (cardRiwayat) cardRiwayat.style.display = 'none';
    } else {
        if (cardForm) cardForm.style.display = 'block';
        if (cardRiwayat) cardRiwayat.style.display = 'block';
    }

    renderWidgetGuruTidakHadirHariIni();
    renderTableRiwayatIzinSaya();
}

function renderWidgetGuruTidakHadirHariIni() {
    const container = document.getElementById('containerGuruTidakHadirHariIni');
    const badgeTotal = document.getElementById('badgeTotalGuruTidakHadir');
    const elTxtTanggal = document.getElementById('txtTanggalHariIni');
    if (!container) return;

    const todayStr = getTodayFormattedDate();
    if (elTxtTanggal) elTxtTanggal.innerText = todayStr;

    const absentMap = new Map();

    localPengajuanIzin.forEach(item => {
        if (item.status === 'Disetujui' && item.tanggal === todayStr) {
            absentMap.set(item.username || item.nama, {
                nama: item.nama,
                status: item.kategori || 'IZIN',
                keterangan: item.keterangan || '-'
            });
        }
    });

    localLogAbsenGuru.forEach(item => {
        if (item.tanggal === todayStr && item.status) {
            const stUpper = item.status.toUpperCase();
            const ketLower = String(item.keterangan || '').toLowerCase();
            const isDuty = ketLower.includes('tugas') || ketLower.includes('dinas');
            
            if (stUpper !== 'HADIR' || isDuty) {
                let displayStatus = stUpper;
                if (isDuty) {
                    displayStatus = item.keterangan.match(/\[([^\]]+)\]/)?.[1] || 'TUGAS';
                }
                absentMap.set(item.username || item.nama, {
                    nama: item.nama,
                    status: displayStatus,
                    keterangan: item.keterangan || '-'
                });
            }
        }
    });

    const absentList = Array.from(absentMap.values());

    if (badgeTotal) {
        badgeTotal.innerText = `${absentList.length} Guru / Staf`;
    }

    if (absentList.length === 0) {
        container.innerHTML = `
            <div style="background: rgba(34, 197, 94, 0.1); border: 1px dashed rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 14px 18px; display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 1.3rem;"><i class="fa-solid fa-circle-check" style="color: #4ade80;"></i></span>
                <span style="color: #4ade80; font-size: 0.92rem; font-weight: 500;">Hari ini semua Guru & Staf hadir / belum ada catatan ketidakhadiran.</span>
            </div>`;
        return;
    }

    let html = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px;">`;
    absentList.forEach(g => {
        let badgeColor = '#f59e0b';
        const stUpper = String(g.status || '').toUpperCase();
        const ketLower = String(g.keterangan || '').toLowerCase();
        const isDuty = stUpper.includes('TUGAS') || stUpper.includes('DINAS') || ketLower.includes('tugas') || ketLower.includes('dinas');
        
        if (isDuty) badgeColor = '#38bdf8';
        else if (stUpper === 'SAKIT') badgeColor = '#ec4899';
        else if (stUpper === 'ALPHA' || stUpper === 'ALPA' || stUpper === 'TIDAK HADIR') badgeColor = '#ef4444';

        const cleanKet = cleanKeterangan(g.keterangan);

        html += `
            <div style="background: rgba(15, 23, 42, 0.65); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px; padding: 14px 18px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.25); backdrop-filter: blur(10px);">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                    <span style="font-weight: 700; font-size: 0.98rem; color: #ffffff; display: flex; align-items: center; gap: 6px;"><i class="fa-solid fa-user-tie" style="color: #93c5fd;"></i> ${g.nama}</span>
                    <span class="badge" style="background: ${badgeColor}25; color: ${badgeColor}; border: 1px solid ${badgeColor}55; font-size: 0.76rem; padding: 4px 12px; border-radius: 20px; font-weight: 700;">${g.status}</span>
                </div>
                <div style="font-size: 0.85rem; color: #94a3b8; display: flex; align-items: flex-start; gap: 6px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 6px;">
                    <span style="color: #64748b; font-weight: 600;"><i class="fa-solid fa-comment-dots"></i> Ket:</span> <span style="color: #cbd5e1; font-style: italic;">${cleanKet}</span>
                </div>
            </div>
        `;
    });
    html += `</div>`;
    container.innerHTML = html;
}

function renderTableRiwayatIzinSaya() {
    const tbody = document.getElementById('tableRiwayatIzinSaya');
    if (!tbody) return;

    const loggedUser = JSON.parse(localStorage.getItem('smart_absen_user') || '{}');
    const myUsername = loggedUser.username || '';

    const myLogs = localPengajuanIzin.filter(i => i.username === myUsername || i.nama === loggedUser.nama);

    if (myLogs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 25px;">Belum ada riwayat pengajuan izin.</td></tr>`;
        return;
    }

    let html = '';
    myLogs.forEach((item, idx) => {
        let statusBadge = `<span class="badge-status badge-pending"><i class="fa-solid fa-hourglass-half"></i> Pending</span>`;
        if (item.status === 'Disetujui') {
            statusBadge = `<span class="badge-status badge-approved"><i class="fa-solid fa-check"></i> Disetujui</span>`;
        } else if (item.status === 'Ditolak') {
            statusBadge = `<span class="badge-status badge-rejected"><i class="fa-solid fa-xmark"></i> Ditolak</span>`;
        }

        html += `
            <tr>
                <td style="text-align: center; font-weight: 600; color: #94a3b8;">${idx + 1}</td>
                <td style="font-size: 0.82rem; color: #94a3b8;">${item.waktu || '-'}</td>
                <td style="font-weight: 600; color: #ffffff;">${getFormattedDisplayDate(item.tanggal)}</td>
                <td><span class="badge" style="background: rgba(255,255,255,0.08); color: #e2e8f0; padding: 4px 10px; border-radius: 6px; font-weight: 500;">${item.kategori}</span></td>
                <td style="color: #cbd5e1;">${cleanKeterangan(item.keterangan)}</td>
                <td style="text-align: center;">${statusBadge}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

async function handleSubmiIzinGuru(e) {
    e.preventDefault();
    const btn = document.getElementById('btnKirimIzin');
    if (btn) btn.disabled = true;

    const loggedUser = JSON.parse(localStorage.getItem('smart_absen_user') || '{}');
    const tgl = document.getElementById('inputIzinTanggal').value;
    const kategori = document.getElementById('inputIzinKategori').value;
    const keterangan = document.getElementById('inputIzinKeterangan').value.trim();

    // Jika pengaju adalah Kepala Sekolah atau Admin -> Otomatis Disetujui!
    const userRole = (loggedUser.role || '').trim();
    const isAutoApprove = (userRole === 'Kepala Sekolah' || userRole === 'Admin');
    const initialStatus = isAutoApprove ? 'Disetujui' : 'Pending';
    const disetujuiOleh = isAutoApprove ? `${loggedUser.nama || 'Kepala Sekolah'} (Otomatis)` : '';
    const timeNowStr = new Date().toLocaleString('id-ID');

    const newItem = {
        id: 'IZIN-' + Date.now(),
        waktu: timeNowStr,
        username: loggedUser.username || '',
        nama: loggedUser.nama || 'Guru',
        role: loggedUser.role || 'Guru',
        id_telegram: loggedUser.id_telegram || '',
        tanggal: tgl,
        kategori: kategori,
        keterangan: keterangan,
        status: initialStatus,
        disetujuiOleh: disetujuiOleh,
        waktuPersetujuan: isAutoApprove ? timeNowStr : ''
    };

    // Optimistic UI Update
    localPengajuanIzin.unshift(newItem);
    localStorage.setItem('smart_absen_pengajuan_izin', JSON.stringify(localPengajuanIzin));

    if (isAutoApprove) {
        const rawKat = String(kategori || '').trim().toLowerCase();
        const isDutyHadir = rawKat.includes('tugas') || rawKat.includes('dinas');
        localLogAbsenGuru.unshift({
            id: 'AG-APP-' + Date.now(),
            waktu: timeNowStr,
            tanggal: tgl,
            username: loggedUser.username || '',
            nama: loggedUser.nama || 'Guru',
            status: isDutyHadir ? 'HADIR' : 'TIDAK HADIR',
            keterangan: `[${kategori}] ${keterangan}`,
            inputBy: disetujuiOleh
        });
        localStorage.setItem('smart_absen_log_guru', JSON.stringify(localLogAbsenGuru));
    }

    renderIzinGuruPanel();
    renderApprovalKepsekPanel();
    renderAbsenGuruAdminPanel();
    document.getElementById('formPengajuanIzin').reset();

    if (isAutoApprove) {
        showToast("⚡ Pengajuan izin Anda sebagai " + userRole + " otomatis disetujui!", 'success');
    } else {
        showToast("🚀 Pengajuan izin berhasil dikirim! Menunggu konfirmasi Kepala Sekolah.", 'success');
    }

    try {
        const payload = encodeURIComponent(JSON.stringify(newItem));
        const res = await fetchWithRetry(`${SCRIPT_URL}?action=add_pengajuan_izin&data=${payload}`, { method: 'POST' }, 2, 800);
        if (res && res.status === 'success') {
            syncAbsenGuruDataFromServer();
        }
    } catch (err) {
        console.warn("Backend sync pengajuan izin postponed.");
    } finally {
        if (btn) btn.disabled = false;
    }
}

// ----------------------------------------------------
// 2. PANEL PERSETUJUAN (APPROVAL) KEPALA SEKOLAH
// ----------------------------------------------------
function renderApprovalKepsekPanel() {
    const tbodyPending = document.getElementById('tablePendingIzinKepsek');
    const tbodyRiwayat = document.getElementById('tableRiwayatIzinKepsek');
    const badgePending = document.getElementById('badgeTotalPendingIzin');

    if (!tbodyPending || !tbodyRiwayat) return;

    const pendingList = localPengajuanIzin.filter(i => i.status === 'Pending');
    const historyList = localPengajuanIzin.filter(i => i.status !== 'Pending');

    if (badgePending) badgePending.innerText = `${pendingList.length} Menunggu`;

    // Render Pending Table
    if (pendingList.length === 0) {
        tbodyPending.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 25px;">Tidak ada pengajuan izin yang menunggu persetujuan.</td></tr>`;
    } else {
        let htmlP = '';
        pendingList.forEach((item, idx) => {
            htmlP += `
                <tr>
                    <td style="text-align: center; font-weight: 600; color: #94a3b8;">${idx + 1}</td>
                    <td style="font-size: 0.82rem; color: #94a3b8;">${item.waktu || '-'}</td>
                    <td style="font-weight: 600; color: #ffffff;">${item.nama}</td>
                    <td><span class="badge" style="background: rgba(255,255,255,0.08);">${item.role || 'Guru'}</span></td>
                    <td style="font-weight: 600; color: #fbbf24;">${getFormattedDisplayDate(item.tanggal)}</td>
                    <td><span class="badge" style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4);">${item.kategori}</span></td>
                    <td style="color: #cbd5e1;">${cleanKeterangan(item.keterangan)}</td>
                    <td style="text-align: center;">
                        <div style="display: flex; gap: 8px; justify-content: center;">
                            <button type="button" onclick="approveIzinKepsek('${item.id}')" class="btn-primary" style="padding: 6px 14px; font-size: 0.8rem; background: #16a34a; border-radius: 8px;"><i class="fa-solid fa-check"></i> Setujui</button>
                            <button type="button" onclick="rejectIzinKepsek('${item.id}')" class="btn-secondary" style="padding: 6px 14px; font-size: 0.8rem; background: #dc2626; color: white; border-radius: 8px;"><i class="fa-solid fa-xmark"></i> Tolak</button>
                        </div>
                    </td>
                </tr>
            `;
        });
        tbodyPending.innerHTML = htmlP;
    }

    // Render History Table
    if (historyList.length === 0) {
        tbodyRiwayat.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 25px;">Belum ada riwayat keputusan.</td></tr>`;
    } else {
        let htmlH = '';
        historyList.forEach((item, idx) => {
            let statusBadge = item.status === 'Disetujui'
                ? `<span class="badge-status badge-approved"><i class="fa-solid fa-check"></i> Disetujui</span>`
                : `<span class="badge-status badge-rejected"><i class="fa-solid fa-xmark"></i> Ditolak</span>`;

            htmlH += `
                <tr>
                    <td style="text-align: center; font-weight: 600; color: #94a3b8;">${idx + 1}</td>
                    <td style="font-weight: 600; color: #ffffff;">${item.nama}</td>
                    <td>${getFormattedDisplayDate(item.tanggal)}</td>
                    <td><span class="badge" style="background: rgba(255,255,255,0.08);">${item.kategori}</span></td>
                    <td style="color: #cbd5e1;">${cleanKeterangan(item.keterangan)}</td>
                    <td style="text-align: center;">${statusBadge}</td>
                    <td style="font-size: 0.85rem; color: #93c5fd;">${item.disetujuiOleh || 'Kepala Sekolah'}</td>
                </tr>
            `;
        });
        tbodyRiwayat.innerHTML = htmlH;
    }
}

async function approveIzinKepsek(id) {
    const loggedUser = JSON.parse(localStorage.getItem('smart_absen_user') || '{}');
    const approverName = loggedUser.nama || 'Kepala Sekolah';

    const itemIndex = localPengajuanIzin.findIndex(i => String(i.id) === String(id));
    if (itemIndex !== -1) {
        localPengajuanIzin[itemIndex].status = 'Disetujui';
        localPengajuanIzin[itemIndex].disetujuiOleh = approverName;
        localPengajuanIzin[itemIndex].waktuPersetujuan = new Date().toLocaleString('id-ID');

        const item = localPengajuanIzin[itemIndex];
        const rawKat = String(item.kategori || '').trim().toLowerCase();
        const isDutyHadir = rawKat.includes('tugas') || rawKat.includes('dinas');
        localLogAbsenGuru.unshift({
            id: 'AG-APP-' + Date.now(),
            waktu: new Date().toLocaleString('id-ID'),
            tanggal: item.tanggal,
            username: item.username,
            nama: item.nama,
            status: isDutyHadir ? 'HADIR' : 'TIDAK HADIR',
            keterangan: `[${item.kategori}] ${cleanKeterangan(item.keterangan)}`,
            inputBy: approverName
        });

        localStorage.setItem('smart_absen_pengajuan_izin', JSON.stringify(localPengajuanIzin));
        localStorage.setItem('smart_absen_log_guru', JSON.stringify(localLogAbsenGuru));
        
        renderApprovalKepsekPanel();
        renderIzinGuruPanel();
        renderAbsenGuruAdminPanel();

        showToast(`✅ Pengajuan izin ${item.nama} berhasil disetujui!`, 'success');
    }

    try {
        await fetchWithRetry(`${SCRIPT_URL}?action=approve_pengajuan_izin&id=${encodeURIComponent(id)}&approver=${encodeURIComponent(approverName)}`, { method: 'POST' }, 2, 800);
        syncAbsenGuruDataFromServer();
    } catch(e) {}
}

async function rejectIzinKepsek(id) {
    const loggedUser = JSON.parse(localStorage.getItem('smart_absen_user') || '{}');
    const approverName = loggedUser.nama || 'Kepala Sekolah';

    const itemIndex = localPengajuanIzin.findIndex(i => String(i.id) === String(id));
    if (itemIndex !== -1) {
        localPengajuanIzin[itemIndex].status = 'Ditolak';
        localPengajuanIzin[itemIndex].disetujuiOleh = approverName;
        localPengajuanIzin[itemIndex].waktuPersetujuan = new Date().toLocaleString('id-ID');

        localStorage.setItem('smart_absen_pengajuan_izin', JSON.stringify(localPengajuanIzin));
        
        renderApprovalKepsekPanel();
        renderIzinGuruPanel();

        showToast(`❌ Pengajuan izin ${localPengajuanIzin[itemIndex].nama} ditolak.`, 'info');
    }

    try {
        await fetchWithRetry(`${SCRIPT_URL}?action=reject_pengajuan_izin&id=${encodeURIComponent(id)}&approver=${encodeURIComponent(approverName)}`, { method: 'POST' }, 2, 800);
        syncAbsenGuruDataFromServer();
    } catch(e) {}
}

// ----------------------------------------------------
// 3. PANEL ABSEN GURU KOLEKTIF / BATCH (GURU, KEPSEK, TU)
// ----------------------------------------------------
function renderAbsenGuruAdminPanel() {
    applyMaxDateRestriction();
    const inputTgl = document.getElementById('inputAbsenGuruTanggalBatch');
    if (inputTgl && !inputTgl.value) {
        inputTgl.value = getTodayFormattedDate();
    }

    renderAbsenGuruBatchTable();
    renderTableLogAbsenGuru();
    renderRekapMatrixGuru();
}

function showCustomConfirmModal({ title, message, dateText, countText, confirmBtnText, iconClass }) {
    const modal = document.getElementById('modalConfirmAction');
    if (!modal && typeof showCustomConfirm === 'function') {
        return showCustomConfirm({
            title: title || 'Konfirmasi Hapus',
            message: message || 'Apakah Anda yakin?',
            icon: 'danger',
            confirmText: confirmBtnText || 'Ya, Kosongkan',
            cancelText: 'Batal',
            danger: true
        });
    }

    return new Promise((resolve) => {
        if (!modal) {
            resolve(true);
            return;
        }

        const titleElem = document.getElementById('modalConfirmTitle');
        const msgElem = document.getElementById('modalConfirmMessage');
        const dateElem = document.getElementById('modalConfirmDateText');
        const countElem = document.getElementById('modalConfirmCountText');
        const btnTextElem = document.getElementById('modalConfirmBtnText');
        const iconElem = document.getElementById('modalConfirmIcon');
        const btnConfirm = document.getElementById('btnModalConfirmAction');
        const btnCancel = document.getElementById('btnModalConfirmCancel');

        if (titleElem) titleElem.innerText = title || "Konfirmasi Hapus";
        if (msgElem) msgElem.innerText = message || "Apakah Anda yakin ingin melakukan tindakan ini?";
        if (dateElem) dateElem.innerText = dateText || "-";
        if (countElem) countElem.innerText = countText || "0 Data";
        if (btnTextElem) btnTextElem.innerText = confirmBtnText || "Ya, Kosongkan";
        if (iconElem) iconElem.className = iconClass || "fa-solid fa-triangle-exclamation";

        modal.style.display = 'flex';

        const handleConfirm = () => {
            cleanup();
            resolve(true);
        };

        const handleCancel = () => {
            cleanup();
            resolve(false);
        };

        const cleanup = () => {
            modal.style.display = 'none';
            btnConfirm.removeEventListener('click', handleConfirm);
            btnCancel.removeEventListener('click', handleCancel);
        };

        btnConfirm.addEventListener('click', handleConfirm);
        btnCancel.addEventListener('click', handleCancel);
    });
}

async function handleKosongkanAbsenGuruTanggal() {
    const inputTgl = document.getElementById('inputAbsenGuruTanggalBatch');
    const selectedDate = inputTgl ? inputTgl.value : getTodayFormattedDate();
    if (!selectedDate) {
        showToast("⚠️ Silakan pilih tanggal presensi terlebih dahulu.", 'warning');
        return;
    }

    const todayStr = getTodayFormattedDate();
    if (selectedDate > todayStr) {
        showToast("⚠️ Tidak dapat mengosongkan presensi untuk tanggal yang belum terjadi.", 'warning');
        if (inputTgl) inputTgl.value = todayStr;
        return;
    }

    const formattedDisplay = getFormattedDisplayDate(selectedDate);
    const existingLogs = localLogAbsenGuru.filter(l => l.tanggal === selectedDate);
    const existingIzins = localPengajuanIzin.filter(i => i.tanggal === selectedDate);

    if (existingLogs.length === 0 && existingIzins.length === 0) {
        showToast(`ℹ️ Tidak ada data presensi atau pengajuan izin guru pada tanggal ${formattedDisplay}.`, 'info');
        return;
    }

    const countDetails = [];
    if (existingLogs.length > 0) countDetails.push(`${existingLogs.length} Presensi`);
    if (existingIzins.length > 0) countDetails.push(`${existingIzins.length} Pengajuan Izin`);

    const confirmed = await showCustomConfirmModal({
        title: 'Kosongkan Presensi & Pengajuan Izin',
        message: `Apakah Anda yakin ingin menghapus & mengosongkan seluruh data presensi serta pengajuan izin guru dan staf untuk tanggal ${formattedDisplay}? Data yang dihapus tidak dapat dikembalikan.`,
        dateText: formattedDisplay,
        countText: countDetails.join(' & '),
        confirmBtnText: 'Ya, Kosongkan Data',
        iconClass: 'fa-solid fa-trash-can-arrow-up'
    });

    if (!confirmed) return;

    const btn = document.getElementById('btnKosongkanAbsenGuruTanggal');
    if (btn) btn.disabled = true;

    // 1. Optimistic Local Update
    localLogAbsenGuru = localLogAbsenGuru.filter(l => l.tanggal !== selectedDate);
    localPengajuanIzin = localPengajuanIzin.filter(i => i.tanggal !== selectedDate);

    localStorage.setItem('smart_absen_log_guru', JSON.stringify(localLogAbsenGuru));
    localStorage.setItem('smart_absen_pengajuan_izin', JSON.stringify(localPengajuanIzin));

    isEditAbsenGuruBatchMode = false;
    renderAbsenGuruBatchTable();
    renderTableLogAbsenGuru();
    renderRekapMatrixGuru();
    renderIzinGuruPanel();
    renderApprovalKepsekPanel();
    renderWidgetGuruTidakHadirHariIni();

    if (typeof renderOverviewDashboard === 'function') {
        renderOverviewDashboard();
    }

    showToast(`🗑️ Berhasil mengosongkan data presensi & pengajuan izin tanggal ${formattedDisplay}!`, 'success');

    // 2. Sync to Backend (GAS)
    try {
        await fetchWithRetry(`${SCRIPT_URL}?action=delete_absen_guru_date&tanggal=${encodeURIComponent(selectedDate)}`, { method: 'POST' }, 2, 800);
        syncAbsenGuruDataFromServer();
    } catch(err) {
        console.warn("Backend delete_absen_guru_date postponed.");
    } finally {
        if (btn) btn.disabled = false;
    }
}

function renderAbsenGuruBatchTable() {
    const tbody = document.getElementById('tableBodyAbsenGuruBatch');
    const inputTgl = document.getElementById('inputAbsenGuruTanggalBatch');
    if (!tbody) return;

    const selectedDate = inputTgl ? inputTgl.value : getTodayFormattedDate();

    // Cek apakah tanggal ini sudah pernah diabsen
    const btnSimpan = document.getElementById('btnSimpanAbsenGuruBatch');
    const btnHadir = document.getElementById('btnSetSemuaHadir');
    const btnTidakHadir = document.getElementById('btnSetSemuaTidakHadir');

    const existingLogsForDate = localLogAbsenGuru.filter(l => l.tanggal === selectedDate);
    const hasAlreadySubmitted = (existingLogsForDate.length > 0);

    // KONDISI 1: JIKA SUDAH DIABSEN & TIDAK DALAM MODE EDIT -> KOSONGKAN TAMPILAN GURU & DISABLE TOMBOL SIMPAN
    if (hasAlreadySubmitted && !isEditAbsenGuruBatchMode) {
        if (btnSimpan) {
            btnSimpan.disabled = true;
            btnSimpan.style.opacity = '0.5';
            btnSimpan.style.cursor = 'not-allowed';
            btnSimpan.innerHTML = `<span><i class="fa-solid fa-lock"></i> Presensi Tanggal Ini Sudah Selesai</span>`;
        }

        if (btnHadir) btnHadir.disabled = true;
        if (btnTidakHadir) btnTidakHadir.disabled = true;

        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 45px 20px; background: rgba(34, 197, 94, 0.04); border-radius: 12px; border: 1px dashed rgba(34, 197, 94, 0.2);">
                    <div style="font-size: 2.5rem; margin-bottom: 8px;"><i class="fa-solid fa-circle-check" style="color: #4ade80;"></i></div>
                    <div style="font-size: 1.15rem; font-weight: 700; color: #4ade80; margin-bottom: 6px;">Presensi Tanggal Ini Sudah Berhasil Dicatat</div>
                    <div style="color: #cbd5e1; font-size: 0.88rem; max-width: 520px; margin: 0 auto 15px auto;">
                        Seluruh data presensi <strong>${existingLogsForDate.length} Guru & Staf</strong> untuk tanggal <strong>${getFormattedDisplayDate(selectedDate)}</strong> telah tersimpan. Form dikosongkan untuk mencegah pengisian ganda.
                    </div>
                    <button type="button" onclick="forceEditAbsenGuruBatch()" class="btn-secondary" style="padding: 9px 22px; font-size: 0.85rem; background: rgba(59, 130, 246, 0.2); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.4); border-radius: 8px; font-weight: 600; cursor: pointer;"><i class="fa-solid fa-pen-to-square"></i> Edit / Buka Kembali Form Presensi</button>
                </td>
            </tr>
        `;
        return;
    }

    // KONDISI 2: JIKA BELUM DIABSEN ATAU SEDANG EDIT -> TAMPILKAN TABEL & AKTIFKAN TOMBOL
    if (btnSimpan) {
        btnSimpan.disabled = false;
        btnSimpan.style.opacity = '1';
        btnSimpan.style.cursor = 'pointer';
        btnSimpan.innerHTML = hasAlreadySubmitted ? `<span><i class="fa-solid fa-floppy-disk"></i> Update / Simpan Perubahan Presensi</span>` : `<span><i class="fa-solid fa-floppy-disk"></i> Simpan Presensi Guru & Staf</span>`;
    }

    if (btnHadir) btnHadir.disabled = false;
    if (btnTidakHadir) btnTidakHadir.disabled = false;

    // Ambil daftar seluruh user dari database / cache / fallback
    let users = [];
    if (window.allTeachers && window.allTeachers.length > 0) {
        users = window.allTeachers;
    } else {
        const cachedUsers = JSON.parse(localStorage.getItem('smart_absen_users_cache') || '[]');
        users = cachedUsers;
    }

    // Jika belum ada cache sama sekali (initial load), gunakan default staff fallback
    if (!users || users.length === 0) {
        users = [
            { username: 'guru1', namaLengkap: 'Bapak Budi, S.Pd', role: 'Guru' },
            { username: 'tu1', namaLengkap: 'Staf Tata Usaha', role: 'Tata Usaha' },
            { username: 'kepsek', namaLengkap: 'Kepala Sekolah', role: 'Kepala Sekolah' }
        ];
    }

    // Filter pengguna: Seluruh data user KECUALI Administrator (role 'Admin' atau 'Administrator')
    const staffList = users.filter(u => {
        const r = String(u.role || '').trim().toLowerCase();
        return r !== 'admin' && r !== 'administrator';
    });

    if (staffList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 25px;">Belum ada data pengguna (selain Administrator) yang terdaftar.</td></tr>`;
        return;
    }

    // Filter out guru yang SUDAH memiliki presensi (Mesin Solution / Manual / Izin) pada tanggal terpilih
    const visibleStaff = [];
    let hiddenCount = 0;

    staffList.forEach(staff => {
        const uname = staff.username || '';
        const name = staff.namaLengkap || staff.nama || uname;

        // Cek pengajuan izin disetujui untuk tanggal terpilih
        const approvedLeave = localPengajuanIzin.find(p => p.status === 'Disetujui' && p.tanggal === selectedDate && (p.username === uname || p.nama === name));
        
        // Cek apakah guru sudah pernah presensi pada tanggal terpilih (Mesin Solution / Scan Wajah / Manual)
        const existingLog = localLogAbsenGuru.find(l => l.tanggal === selectedDate && (l.username === uname || l.nama === name));

        if (approvedLeave || existingLog) {
            hiddenCount++;
        } else {
            visibleStaff.push(staff);
        }
    });

    if (visibleStaff.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px 20px; background: rgba(59, 130, 246, 0.04); border-radius: 12px; border: 1px dashed rgba(59, 130, 246, 0.2);">
                    <div style="font-size: 2.2rem; margin-bottom: 8px;"><i class="fa-solid fa-circle-check" style="color: #60a5fa;"></i></div>
                    <div style="font-size: 1.1rem; font-weight: 700; color: #60a5fa; margin-bottom: 6px;">Seluruh Guru & Staf Sudah Memiliki Data Presensi / Izin</div>
                    <div style="color: #cbd5e1; font-size: 0.88rem; max-width: 540px; margin: 0 auto;">
                        Seluruh <strong>${hiddenCount} Guru / Staf</strong> pada tanggal <strong>${getFormattedDisplayDate(selectedDate)}</strong> telah melakukan presensi (via Mesin Solution / Izin) dan tersimpan otomatis. Tidak ada data guru yang perlu diabsen manual.
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    visibleStaff.forEach((staff, idx) => {
        const uname = staff.username || '';
        const name = staff.namaLengkap || staff.nama || uname;
        const role = staff.role || 'Guru';

        // Log presensi manual untuk tanggal terpilih
        const existingLog = localLogAbsenGuru.find(l => l.tanggal === selectedDate && (l.username === uname || l.nama === name));

        let currentStatus = 'HADIR';
        let currentKeterangan = '';

        if (existingLog) {
            currentStatus = (existingLog.status || 'HADIR').toUpperCase();
            if (currentStatus !== 'HADIR' && currentStatus !== 'TIDAK HADIR') {
                currentStatus = 'TIDAK HADIR';
            }
            currentKeterangan = cleanKeterangan(existingLog.keterangan || '');
        }

        const isHadir = (currentStatus === 'HADIR');

        html += `
            <tr data-username="${uname}" data-nama="${name}" data-role="${role}">
                <td style="text-align: center; font-weight: 600; color: #94a3b8;">${idx + 1}</td>
                <td style="font-weight: 600; color: #ffffff;">
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <span><i class="fa-solid fa-user"></i> ${name}</span>
                    </div>
                </td>
                <td><span class="badge" style="background: rgba(255,255,255,0.08); color: #cbd5e1; font-weight: 500;">${role}</span></td>
                <td style="text-align: center;">
                    <div style="display: inline-flex; background: rgba(0,0,0,0.4); padding: 4px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); gap: 4px;">
                        <label style="cursor: pointer; padding: 6px 14px; border-radius: 8px; font-size: 0.82rem; font-weight: 700; transition: all 0.2s ease; ${isHadir ? 'background: #16a34a; color: white; box-shadow: 0 2px 8px rgba(22,163,74,0.4);' : 'color: #94a3b8;'}">
                            <input type="radio" name="status_absen_${idx}" value="HADIR" ${isHadir ? 'checked' : ''} onchange="toggleRadioStyle(this)" style="display: none;"> <i class="fa-solid fa-check"></i> HADIR
                        </label>
                        <label style="cursor: pointer; padding: 6px 14px; border-radius: 8px; font-size: 0.82rem; font-weight: 700; transition: all 0.2s ease; ${!isHadir ? 'background: #dc2626; color: white; box-shadow: 0 2px 8px rgba(220,38,38,0.4);' : 'color: #94a3b8;'}">
                            <input type="radio" name="status_absen_${idx}" value="TIDAK HADIR" ${!isHadir ? 'checked' : ''} onchange="toggleRadioStyle(this)" style="display: none;"> <i class="fa-solid fa-xmark"></i> TIDAK HADIR
                        </label>
                    </div>
                </td>
                <td>
                    <input type="text" class="styled-input input-keterangan-batch" value="${currentKeterangan}" placeholder="Catatan presensi..." style="padding: 8px 12px; font-size: 0.85rem;">
                </td>
            </tr>
        `;
    });

    if (hiddenCount > 0) {
        html += `
            <tr>
                <td colspan="5" style="padding: 10px 16px; background: rgba(59, 130, 246, 0.08); border-top: 1px solid rgba(59, 130, 246, 0.2); color: #93c5fd; font-size: 0.82rem; text-align: left;">
                    <i class="fa-solid fa-circle-info" style="color: #60a5fa; margin-right: 6px;"></i>
                    <strong>Catatan:</strong> <strong>${hiddenCount} Guru/Staf</strong> disembunyikan dari form ini karena telah melakukan presensi (Mesin Solution / Izin) pada tanggal ini untuk mencegah duplikasi data.
                </td>
            </tr>
        `;
    }

    tbody.innerHTML = html;
}

window.toggleRadioStyle = function(radioElem) {
    const parentContainer = radioElem.closest('div');
    if (!parentContainer) return;
    const labels = parentContainer.querySelectorAll('label');
    labels.forEach(lbl => {
        const inp = lbl.querySelector('input');
        if (inp && inp.checked) {
            if (inp.value === 'HADIR') {
                lbl.style.cssText = 'cursor: pointer; padding: 6px 14px; border-radius: 8px; font-size: 0.82rem; font-weight: 700; transition: all 0.2s ease; background: #16a34a; color: white; box-shadow: 0 2px 8px rgba(22,163,74,0.4);';
            } else {
                lbl.style.cssText = 'cursor: pointer; padding: 6px 14px; border-radius: 8px; font-size: 0.82rem; font-weight: 700; transition: all 0.2s ease; background: #dc2626; color: white; box-shadow: 0 2px 8px rgba(220,38,38,0.4);';
            }
        } else {
            lbl.style.cssText = 'cursor: pointer; padding: 6px 14px; border-radius: 8px; font-size: 0.82rem; font-weight: 700; transition: all 0.2s ease; color: #94a3b8;';
        }
    });
};

function setSemuaStatusAbsenGuru(targetStatus) {
    const tbody = document.getElementById('tableBodyAbsenGuruBatch');
    if (!tbody) return;
    const rows = tbody.querySelectorAll('tr[data-username]');
    rows.forEach(tr => {
        const radio = tr.querySelector(`input[type="radio"][value="${targetStatus}"]`);
        if (radio && !radio.disabled) {
            radio.checked = true;
            toggleRadioStyle(radio);
        }
    });
}

async function handleSaveAbsenGuruBatch(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSimpanAbsenGuruBatch');
    if (btn) btn.disabled = true;

    const loggedUser = JSON.parse(localStorage.getItem('smart_absen_user') || '{}');
    const inputTgl = document.getElementById('inputAbsenGuruTanggalBatch');
    const selectedDate = inputTgl ? inputTgl.value : getTodayFormattedDate();
    const todayStr = getTodayFormattedDate();

    if (selectedDate > todayStr) {
        showToast("⚠️ Gagal menyimpan: Tidak dapat melakukan presensi guru untuk tanggal yang belum terjadi (" + getFormattedDisplayDate(selectedDate) + ").", 'error');
        if (inputTgl) inputTgl.value = todayStr;
        if (btn) btn.disabled = false;
        return;
    }

    const timeNowStr = new Date().toLocaleString('id-ID');

    const tbody = document.getElementById('tableBodyAbsenGuruBatch');
    const rows = tbody.querySelectorAll('tr[data-username]');

    if (rows.length === 0) {
        showToast("⚠️ Tidak ada data guru/staf untuk disimpan.", 'warning');
        if (btn) btn.disabled = false;
        return;
    }

    const batchData = [];

    rows.forEach(tr => {
        const username = tr.getAttribute('data-username');
        const nama = tr.getAttribute('data-nama');
        const radioChecked = tr.querySelector('input[type="radio"]:checked');
        const status = radioChecked ? radioChecked.value : 'HADIR';
        const inputKet = tr.querySelector('.input-keterangan-batch');
        const keterangan = inputKet ? inputKet.value.trim() : '';

        // Hapus entri lama untuk user & tanggal yang sama
        localLogAbsenGuru = localLogAbsenGuru.filter(l => !(l.tanggal === selectedDate && (l.username === username || l.nama === nama)));

        const newItem = {
            id: 'AG-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            waktu: timeNowStr,
            tanggal: selectedDate,
            username: username,
            nama: nama,
            status: status,
            keterangan: keterangan,
            inputBy: loggedUser.nama || 'Admin'
        };

        batchData.push(newItem);
        localLogAbsenGuru.unshift(newItem);
    });

    localStorage.setItem('smart_absen_log_guru', JSON.stringify(localLogAbsenGuru));

    isEditAbsenGuruBatchMode = false;
    renderAbsenGuruBatchTable();
    renderTableLogAbsenGuru();
    renderWidgetGuruTidakHadirHariIni();

    showToast(`💾 Berhasil menyimpan presensi kolektif untuk ${batchData.length} Guru & Staf!`, 'success');

    try {
        const payload = encodeURIComponent(JSON.stringify(batchData));
        await fetchWithRetry(`${SCRIPT_URL}?action=add_absen_guru&data=${payload}`, { method: 'POST' }, 2, 800);
        syncAbsenGuruDataFromServer();
    } catch (err) {
        console.warn("Backend sync batch absen guru postponed.");
    } finally {
        if (btn) btn.disabled = false;
    }
}

function getFilteredLogsGuru() {
    const selectTipeMode = document.getElementById('selectTipeRekapGuru');
    const filterBulan = document.getElementById('filterBulanAbsenGuru');
    const inputMulai = document.getElementById('inputTanggalMulaiGuru');
    const inputSelesai = document.getElementById('inputTanggalSelesaiGuru');

    const mode = selectTipeMode ? selectTipeMode.value : 'bulanan';

    if (mode === 'rentang') {
        const tglMulai = inputMulai ? inputMulai.value : '';
        const tglSelesai = inputSelesai ? inputSelesai.value : '';
        if (tglMulai && tglSelesai) {
            return localLogAbsenGuru.filter(l => l.tanggal && l.tanggal >= tglMulai && l.tanggal <= tglSelesai);
        } else if (tglMulai) {
            return localLogAbsenGuru.filter(l => l.tanggal && l.tanggal >= tglMulai);
        } else if (tglSelesai) {
            return localLogAbsenGuru.filter(l => l.tanggal && l.tanggal <= tglSelesai);
        }
        return localLogAbsenGuru;
    } else {
        const monthValue = filterBulan ? filterBulan.value : '';
        if (monthValue) {
            return localLogAbsenGuru.filter(l => l.tanggal && l.tanggal.startsWith(monthValue));
        }
        return localLogAbsenGuru;
    }
}

function renderTableLogAbsenGuru() {
    const tbody = document.getElementById('tableLogAbsenGuru');
    if (!tbody) return;

    let filtered = getFilteredLogsGuru();

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 25px;">Belum ada log presensi guru pada periode ini.</td></tr>`;
        return;
    }

    let html = '';
    filtered.forEach((item, idx) => {
        let badgeColor = '#22c55e'; // HADIR
        const st = (item.status || 'HADIR').toUpperCase();
        const ket = (item.keterangan || '').toUpperCase();
        if (st === 'HADIR' || ket.includes('TUGAS') || ket.includes('DINAS')) {
            badgeColor = (ket.includes('TUGAS') || ket.includes('DINAS')) ? '#38bdf8' : '#22c55e';
        }
        else if (st === 'IZIN' || st === 'DINAS' || st === 'SAKIT' || st === 'CUTI') badgeColor = '#f59e0b';
        else if (st === 'ALPHA' || st === 'ALPA' || st === 'TIDAK HADIR') badgeColor = '#ef4444';

        html += `
            <tr>
                <td style="text-align: center; font-weight: 600; color: #94a3b8;">${idx + 1}</td>
                <td style="font-size: 0.82rem; color: #94a3b8;">${item.waktu || '-'}</td>
                <td style="font-weight: 600; color: #ffffff;">${getFormattedDisplayDate(item.tanggal)}</td>
                <td style="font-weight: 600; color: white;">${item.nama}</td>
                <td style="text-align: center;">
                    <span class="badge" style="background: ${badgeColor}22; color: ${badgeColor}; border: 1px solid ${badgeColor}44; padding: 4px 12px; border-radius: 20px; font-weight: 600;">${st}</span>
                </td>
                <td style="font-style: italic; color: #cbd5e1;">${cleanKeterangan(item.keterangan)}</td>
                <td style="font-size: 0.85rem; color: #93c5fd;">${item.inputBy || 'Admin'}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// ----------------------------------------------------
// 4. SYNC DATA SINKRONISASI DARI SERVER (GAS)
// ----------------------------------------------------
async function syncAbsenGuruDataFromServer() {
    try {
        const [resGuru, resIzin] = await Promise.all([
            fetchWithRetry(`${SCRIPT_URL}?action=get_absen_guru`, { method: 'GET' }, 2, 800),
            fetchWithRetry(`${SCRIPT_URL}?action=get_pengajuan_izin`, { method: 'GET' }, 2, 800)
        ]);

        if (resGuru && resGuru.status === 'success' && Array.isArray(resGuru.data)) {
            localLogAbsenGuru = resGuru.data;
            localStorage.setItem('smart_absen_log_guru', JSON.stringify(localLogAbsenGuru));
        }

        if (resIzin && resIzin.status === 'success' && Array.isArray(resIzin.data)) {
            localPengajuanIzin = resIzin.data;
            localStorage.setItem('smart_absen_pengajuan_izin', JSON.stringify(localPengajuanIzin));
        }

        applyCachedAbsenGuruData();
        if (typeof loadUsers === 'function') {
            loadUsers();
        }
    } catch (e) {
        console.warn("Sync Absen Guru / Izin failed, using cached data.");
    }
}

// Expose fungsi ke Window agar bisa dipanggil dari main.js / auth.js
window.updateAbsenGuruMasterData = function(absenGuruData, pengajuanIzinData) {
    if (Array.isArray(absenGuruData) && absenGuruData.length > 0) {
        localLogAbsenGuru = absenGuruData;
        localStorage.setItem('smart_absen_log_guru', JSON.stringify(localLogAbsenGuru));
    }
    if (Array.isArray(pengajuanIzinData) && pengajuanIzinData.length > 0) {
        localPengajuanIzin = pengajuanIzinData;
        localStorage.setItem('smart_absen_pengajuan_izin', JSON.stringify(localPengajuanIzin));
    }
    applyCachedAbsenGuruData();
};

// ----------------------------------------------------
// 5. MATRIKS REKAP BULANAN GURU & STAF, PRINT & EXPORT CSV
// ----------------------------------------------------
function renderRekapMatrixGuru() {
    const tbodyMatrix = document.getElementById('tableBodyRekapGuruMatrix');
    const filterBulan = document.getElementById('filterBulanAbsenGuru');
    if (!tbodyMatrix) return;

    const monthValue = filterBulan ? filterBulan.value : '';

    // Ambil daftar seluruh user dari database / cache / fallback
    let users = [];
    if (window.allTeachers && window.allTeachers.length > 0) {
        users = window.allTeachers;
    } else {
        users = JSON.parse(localStorage.getItem('smart_absen_users_cache') || '[]');
    }

    if (!users || users.length === 0) {
        users = [
            { username: 'guru1', namaLengkap: 'Bapak Budi, S.Pd', role: 'Guru' },
            { username: 'tu1', namaLengkap: 'Staf Tata Usaha', role: 'Tata Usaha' },
            { username: 'kepsek', namaLengkap: 'Kepala Sekolah', role: 'Kepala Sekolah' }
        ];
    }

    const staffList = users.filter(u => {
        const r = String(u.role || '').trim().toLowerCase();
        return r !== 'admin' && r !== 'administrator';
    });

    if (staffList.length === 0) {
        tbodyMatrix.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 25px;">Belum ada data Guru / Staf terdaftar.</td></tr>`;
        return;
    }

    // Filter log berdasarkan mode (Bulan / Rentang Tanggal)
    let filteredLogs = getFilteredLogsGuru();

    let sumTotalHadir = 0;
    let sumTotalIzin = 0;
    let sumTotalAlpa = 0;
    let matrixDataRows = [];

    staffList.forEach((staff, idx) => {
        const uname = staff.username || '';
        const name = staff.namaLengkap || staff.nama || uname;
        const role = staff.role || 'Guru';

        // Filter log milik staff ini di bulan terpilih
        const userLogs = filteredLogs.filter(l => (l.username === uname || l.nama === name));

        let hadirCount = 0;
        let izinCount = 0;
        let alpaCount = 0;

        userLogs.forEach(l => {
            const st = String(l.status || '').toUpperCase();
            const ket = String(l.keterangan || '').toUpperCase();
            const isHadirDuty = st === 'HADIR' || ket.includes('TUGAS') || ket.includes('DINAS');

            if (isHadirDuty) {
                hadirCount++;
            } else if (st === 'ALPHA' || st === 'ALPA') {
                alpaCount++;
            } else {
                // IZIN, SAKIT, DINAS, TIDAK HADIR
                izinCount++;
            }
        });

        sumTotalHadir += hadirCount;
        sumTotalIzin += izinCount;
        sumTotalAlpa += alpaCount;

        const totalRecorded = hadirCount + izinCount + alpaCount;
        let pct = totalRecorded > 0 ? Math.round((hadirCount / totalRecorded) * 100) : 100;

        let evalBadge = '';
        if (pct === 100) {
            evalBadge = `<span class="badge" style="background:rgba(34,197,94,0.15); color:#4ade80; border:1px solid rgba(34,197,94,0.35);"><i class="fa-solid fa-star"></i> 100% Sangat Baik</span>`;
        } else if (pct >= 85) {
            evalBadge = `<span class="badge" style="background:rgba(59,130,246,0.15); color:#93c5fd; border:1px solid rgba(59,130,246,0.35);"><i class="fa-solid fa-thumbs-up"></i> Baik</span>`;
        } else {
            evalBadge = `<span class="badge" style="background:rgba(239,68,68,0.15); color:#f87171; border:1px solid rgba(239,68,68,0.35);"><i class="fa-solid fa-triangle-exclamation"></i> Perlu Perhatian</span>`;
        }

        matrixDataRows.push({
            no: idx + 1,
            name: name,
            role: role,
            hadir: hadirCount,
            izin: izinCount,
            alpa: alpaCount,
            pct: pct,
            evalBadge: evalBadge
        });
    });

    // Update Stats Cards
    const elPersonil = document.getElementById('rekapGuruTotalPersonil');
    const elHadir = document.getElementById('rekapGuruTotalHadir');
    const elIzin = document.getElementById('rekapGuruTotalIzin');
    const elPct = document.getElementById('rekapGuruPersentase');

    if (elPersonil) elPersonil.innerText = staffList.length;
    if (elHadir) elHadir.innerText = sumTotalHadir;
    if (elIzin) elIzin.innerText = sumTotalIzin + sumTotalAlpa;
    
    const overallRecorded = sumTotalHadir + sumTotalIzin + sumTotalAlpa;
    const avgPct = overallRecorded > 0 ? Math.round((sumTotalHadir / overallRecorded) * 100) : 100;
    if (elPct) elPct.innerText = `${avgPct}%`;

    // Render Matrix HTML Table
    let html = '';
    matrixDataRows.forEach(row => {
        html += `
            <tr>
                <td style="text-align: center; font-weight: 600; color: #94a3b8;">${row.no}</td>
                <td style="font-weight: 600; color: #ffffff;">${row.name}</td>
                <td style="color: #cbd5e1;"><span class="badge" style="background: rgba(255,255,255,0.08); color:#e2e8f0; font-size: 0.76rem;">${row.role}</span></td>
                <td style="text-align: center; font-weight: 700; color: #4ade80;">${row.hadir} Hari</td>
                <td style="text-align: center; font-weight: 700; color: #fbbf24;">${row.izin} Hari</td>
                <td style="text-align: center; font-weight: 700; color: #f87171;">${row.alpa} Hari</td>
                <td style="text-align: center; font-weight: 700; color: #60a5fa;">${row.pct}%</td>
                <td style="text-align: center;">${row.evalBadge}</td>
            </tr>
        `;
    });

    tbodyMatrix.innerHTML = html;
}

function printRekapGuru() {
    const selectTipeMode = document.getElementById('selectTipeRekapGuru');
    const mode = selectTipeMode ? selectTipeMode.value : 'bulanan';

    let periodeLabel = '';

    if (mode === 'rentang') {
        const inputMulai = document.getElementById('inputTanggalMulaiGuru');
        const inputSelesai = document.getElementById('inputTanggalSelesaiGuru');
        const tglMulai = inputMulai ? inputMulai.value : '';
        const tglSelesai = inputSelesai ? inputSelesai.value : '';
        periodeLabel = `Rentang Tanggal ${getFormattedDisplayDate(tglMulai)} s/d ${getFormattedDisplayDate(tglSelesai)}`;
    } else {
        const filterBulan = document.getElementById('filterBulanAbsenGuru');
        const monthValue = filterBulan ? filterBulan.value : getTodayFormattedDate().substring(0, 7);
        const parts = monthValue.split('-');
        const yearStr = parts[0] || new Date().getFullYear();
        const monthIdx = parseInt(parts[1] || (new Date().getMonth() + 1)) - 1;
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const monthName = monthNames[monthIdx] || 'Bulanan';
        periodeLabel = `Bulan ${monthName} ${yearStr}`;
    }

    // 1. Ambil Nama Sekolah dari Config Google Sheet
    let namaSekolah = '';
    try {
        const storedConfig = JSON.parse(localStorage.getItem('smart_absen_config') || '{}');
        if (storedConfig && storedConfig.namaSekolah) {
            namaSekolah = String(storedConfig.namaSekolah).trim();
        }
    } catch(e) {}

    if (!namaSekolah) {
        const inputNamaSekolah = document.getElementById('inputNamaSekolah');
        if (inputNamaSekolah && inputNamaSekolah.value) {
            namaSekolah = inputNamaSekolah.value.trim();
        }
    }

    if (!namaSekolah) {
        namaSekolah = 'SMA BARUNAWATI';
    }

    // 2. Ambil Daftar Users untuk Cari Kepsek & Staff
    let users = [];
    if (window.allTeachers && window.allTeachers.length > 0) {
        users = window.allTeachers;
    } else {
        users = JSON.parse(localStorage.getItem('smart_absen_users_cache') || '[]');
    }

    // Cari Nama Kepala Sekolah
    const kepsekUser = users.find(u => {
        const r = String(u.role || '').toLowerCase();
        return r.includes('kepala sekolah') || r.includes('kepsek');
    });
    const namaKepsek = kepsekUser ? (kepsekUser.namaLengkap || kepsekUser.nama || kepsekUser.username) : '____________________';

    const staffList = users.filter(u => {
        const r = String(u.role || '').trim().toLowerCase();
        return r !== 'admin' && r !== 'administrator';
    });

    let filteredLogs = getFilteredLogsGuru();

    let tableRowsHtml = '';

    staffList.forEach((staff, idx) => {
        const uname = staff.username || '';
        const name = staff.namaLengkap || staff.nama || uname;
        const role = staff.role || 'Guru';

        const userLogs = filteredLogs.filter(l => (l.username === uname || l.nama === name));
        let hadirCount = 0;
        let tidakHadirCount = 0;

        userLogs.forEach(l => {
            const st = String(l.status || '').toUpperCase();
            if (st === 'HADIR') {
                hadirCount++;
            } else {
                tidakHadirCount++;
            }
        });

        tableRowsHtml += `
            <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td style="text-align: left; font-weight: bold;">${name}</td>
                <td style="text-align: center;">${role}</td>
                <td style="text-align: center;">${hadirCount} Hari</td>
                <td style="text-align: center;">${tidakHadirCount} Hari</td>
            </tr>
        `;
    });

    let holidaySubtext = '';
    if (monthValue) {
        const parts = monthValue.split('-');
        if (parts.length === 2) {
            const yr = parseInt(parts[0]);
            const mo = parseInt(parts[1]);
            const weekdayHolidays = typeof getWeekdayHolidaysInMonth === 'function' ? getWeekdayHolidaysInMonth(yr, mo) : [];
            if (weekdayHolidays.length > 0) {
                holidaySubtext = ` • (Terdapat ${weekdayHolidays.length} Hari Libur Nasional)`;
            }
        }
    }

    const printWin = window.open('', '_blank', 'width=900,height=700');
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Cetak Rekapitulasi Presensi Guru & Staf - ${periodeLabel}</title>
            <style>
                body { font-family: Arial, sans-serif; font-size: 12px; color: #000; margin: 30px; }
                .kop { text-align: center; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 20px; }
                .kop h2 { margin: 0; font-size: 20px; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; }
                .kop h3 { margin: 4px 0 0 0; font-size: 14px; font-weight: bold; text-transform: uppercase; }
                .kop p { margin: 2px 0 0 0; font-size: 11px; color: #444; }
                .report-title { text-align: center; margin-bottom: 20px; }
                .report-title h3 { margin: 0; font-size: 14px; text-transform: uppercase; text-decoration: underline; }
                .report-title p { margin: 4px 0 0 0; font-size: 12px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #000; padding: 8px 12px; font-size: 11px; }
                th { background-color: #f2f2f2; font-weight: bold; text-transform: uppercase; }
                .footer-sign { margin-top: 50px; display: flex; justify-content: space-between; page-break-inside: avoid; }
                .sign-box { text-align: center; width: 240px; }
                .sign-space { height: 65px; }
                @media print {
                    @page { size: A4 portrait; margin: 15mm; }
                }
            </style>
        </head>
        <body>
            <div class="kop">
                <h2>${namaSekolah}</h2>
                <h3>LAPORAN REKAPITULASI PRESENSI GURU & STAF</h3>
                <p>Sistem Informasi Manajemen Presensi Harian Personil Sekolah</p>
            </div>

            <div class="report-title">
                <h3>REKAPITULASI KEHADIRAN ${periodeLabel.toUpperCase()}</h3>
                <p>Total Personil: ${staffList.length} Orang${holidaySubtext} | Dicetak Tanggal: ${new Date().toLocaleDateString('id-ID')}</p>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 35px; text-align: center;">NO</th>
                        <th style="text-align: left;">NAMA GURU / STAF</th>
                        <th style="width: 100px; text-align: center;">ROLE</th>
                        <th style="width: 70px; text-align: center;">HADIR</th>
                        <th style="width: 95px; text-align: center;">TIDAK HADIR</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRowsHtml}
                </tbody>
            </table>

            <div class="footer-sign">
                <div class="sign-box">
                    <p>Pengelola Kepegawaian,</p>
                    <div class="sign-space"></div>
                    <p><strong>( ____________________ )</strong></p>
                </div>
                <div class="sign-box">
                    <p>Mengetahui,<br>Kepala Sekolah</p>
                    <div class="sign-space"></div>
                    <p><strong>( ${namaKepsek} )</strong></p>
                </div>
            </div>

            <script>
                window.onload = function() {
                    window.print();
                };
            </script>
        </body>
        </html>
    `;

    printWin.document.write(htmlContent);
    printWin.document.close();
}

function exportRekapGuruCSV() {
    const filterBulan = document.getElementById('filterBulanAbsenGuru');
    const monthValue = filterBulan ? filterBulan.value : getTodayFormattedDate().substring(0, 7);

    let users = [];
    if (window.allTeachers && window.allTeachers.length > 0) {
        users = window.allTeachers;
    } else {
        users = JSON.parse(localStorage.getItem('smart_absen_users_cache') || '[]');
    }
    const staffList = users.filter(u => {
        const r = String(u.role || '').trim().toLowerCase();
        return r !== 'admin' && r !== 'administrator';
    });

    let filteredLogs = getFilteredLogsGuru();

    let csvContent = "data:text/csv;charset=utf-8,No,Nama Guru / Staf,Role / Jabatan,Jumlah Hadir,Jumlah Tidak Hadir\n";

    staffList.forEach((staff, idx) => {
        const uname = staff.username || '';
        const name = (staff.namaLengkap || staff.nama || uname).replace(/,/g, '');
        const role = (staff.role || 'Guru').replace(/,/g, '');

        const userLogs = filteredLogs.filter(l => (l.username === uname || l.nama === name));
        let hadirCount = 0, tidakHadirCount = 0;

        userLogs.forEach(l => {
            const st = String(l.status || '').toUpperCase();
            if (st === 'HADIR') hadirCount++;
            else tidakHadirCount++;
        });

        csvContent += `${idx + 1},"${name}","${role}",${hadirCount},${tidakHadirCount}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Kehadiran_Guru_${monthValue || 'Semua'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`📥 Berhasil mengekspor data rekap presensi guru ke CSV!`, 'success');
}

window.updateAbsenGuruMasterData = function(absenGuru, pengajuanIzin) {
    if (Array.isArray(absenGuru)) {
        localLogAbsenGuru = absenGuru;
        localStorage.setItem('smart_absen_log_guru', JSON.stringify(localLogAbsenGuru));
    }
    if (Array.isArray(pengajuanIzin)) {
        localPengajuanIzin = pengajuanIzin;
        localStorage.setItem('smart_absen_pengajuan_izin', JSON.stringify(localPengajuanIzin));
    }
    applyCachedAbsenGuruData();
};

async function syncAbsenGuruDataFromServer() {
    if (typeof fetchWithRetry !== 'function' || !SCRIPT_URL) return;
    try {
        const resG = await fetchWithRetry(`${SCRIPT_URL}?action=get_absen_guru`, { method: 'GET' }, 1, 1000);
        if (resG && resG.status === 'success' && Array.isArray(resG.data)) {
            localLogAbsenGuru = resG.data;
            localStorage.setItem('smart_absen_log_guru', JSON.stringify(localLogAbsenGuru));
        }
        const resI = await fetchWithRetry(`${SCRIPT_URL}?action=get_pengajuan_izin`, { method: 'GET' }, 1, 1000);
        if (resI && resI.status === 'success' && Array.isArray(resI.data)) {
            localPengajuanIzin = resI.data;
            localStorage.setItem('smart_absen_pengajuan_izin', JSON.stringify(localPengajuanIzin));
        }
        applyCachedAbsenGuruData();
        showToast("⚡ Data presensi & izin guru diperbarui dari server.", "info");
    } catch(e) {
        console.warn("Error syncing absen guru data:", e);
    }
}
