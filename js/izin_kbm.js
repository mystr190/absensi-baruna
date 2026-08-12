/**
 * =========================================================================
 * MODUL EDU-IZIN KBM (MASUK, KELUAR, PULANG) (V1.0)
 * =========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    initEduIzinKBM();
});

// Helper untuk mendapatkan data user login dari session
function getLoggedUserSafely() {
    try {
        const u = localStorage.getItem('smart_absen_user');
        return u ? JSON.parse(u) : null;
    } catch(e) {
        return null;
    }
}

// Helper untuk fetch ke Google Apps Script
async function callGAS(action, payload, callback) {
    const scriptUrl = window.SCRIPT_URL || localStorage.getItem('absen_script_url');
    if (typeof SCRIPT_URL === 'undefined' && !scriptUrl) {
        if(callback) callback({ status: 'error', message: 'URL Backend tidak disetel.' });
        return;
    }
    
    const targetUrl = typeof SCRIPT_URL !== 'undefined' && SCRIPT_URL ? SCRIPT_URL : scriptUrl;
    
    try {
        let res;
        if (!payload) {
            const url = `${targetUrl}?action=${action}`;
            res = await fetchWithRetry(url, { method: 'GET' }, 1, 1000);
        } else {
            const bodyObj = { action: action, data: payload };
            res = await fetchWithRetry(targetUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(bodyObj)
            }, 1, 1000);
        }
        
        if (callback) callback(res);
    } catch (err) {
        console.error("callGAS Error:", err);
        if (callback) callback({ status: 'error', message: 'Gagal terhubung ke server.' });
    }
}

function initEduIzinKBM() {
    // 1. Hook into tab clicks to load dropdown & data
    const navIzinSiswa = document.getElementById('nav-izin-siswa');
    if (navIzinSiswa) {
        navIzinSiswa.addEventListener('click', () => {
            loadDropdownEduIzin();
            loadEduIzinData();
        });
    }

    const navApprovalWalas = document.getElementById('nav-approval-izin-siswa');
    if (navApprovalWalas) {
        navApprovalWalas.addEventListener('click', () => {
            checkAndShowEduIzinApprovalSections();
            loadEduIzinData();
        });
    }

    // 2. Form Submit
    const formEduIzin = document.getElementById('formEduIzinKBM');
    if (formEduIzin) {
        formEduIzin.addEventListener('submit', handleFormEduIzinSubmit);
    }

    // 3. Refresh Buttons
    const btnRefreshSiswa = document.getElementById('btnRefreshEduIzinSiswa');
    if (btnRefreshSiswa) btnRefreshSiswa.addEventListener('click', loadEduIzinData);
    
    const btnRefreshAppr = document.getElementById('btnRefreshApprovalIzinSiswa');
    if (btnRefreshAppr) btnRefreshAppr.addEventListener('click', loadEduIzinData);

    // 4. Auto-Search & Pagination Listeners (Riwayat Validasi Guru)
    const inputSearchGuru = document.getElementById('searchGuruHistoryEduIzin');
    if (inputSearchGuru) {
        inputSearchGuru.addEventListener('input', (e) => {
            queryGuruHistory = e.target.value;
            pageGuruHistory = 1;
            renderGuruHistoryPaginated();
        });
    }

    const btnPrevGuru = document.getElementById('btnPrevGuruHistory');
    if (btnPrevGuru) {
        btnPrevGuru.addEventListener('click', () => {
            if (pageGuruHistory > 1) {
                pageGuruHistory--;
                renderGuruHistoryPaginated();
            }
        });
    }

    const btnNextGuru = document.getElementById('btnNextGuruHistory');
    if (btnNextGuru) {
        btnNextGuru.addEventListener('click', () => {
            pageGuruHistory++;
            renderGuruHistoryPaginated();
        });
    }

    // 5. Auto-Search & Pagination Listeners (Riwayat Dokumen Piket)
    const inputSearchPiket = document.getElementById('searchPiketHistoryEduIzin');
    if (inputSearchPiket) {
        inputSearchPiket.addEventListener('input', (e) => {
            queryPiketHistory = e.target.value;
            pagePiketHistory = 1;
            renderPiketHistoryPaginated();
        });
    }

    const btnPrevPiket = document.getElementById('btnPrevPiketHistory');
    if (btnPrevPiket) {
        btnPrevPiket.addEventListener('click', () => {
            if (pagePiketHistory > 1) {
                pagePiketHistory--;
                renderPiketHistoryPaginated();
            }
        });
    }

    const btnNextPiket = document.getElementById('btnNextPiketHistory');
    if (btnNextPiket) {
        btnNextPiket.addEventListener('click', () => {
            pagePiketHistory++;
            renderPiketHistoryPaginated();
        });
    }

    // Call with delay to avoid competing with initial dashboard load
    setTimeout(() => {
        loadDropdownEduIzin();
    }, 1500);
}

function checkAndShowEduIzinApprovalSections() {
    const currentUser = getLoggedUserSafely();
    if (!currentUser || !currentUser.role) return;
    
    const roles = String(currentUser.role).toLowerCase();
    const tugasPiket = String(currentUser.tugas_piket || currentUser.piket || '').toLowerCase();

    const isKepsekOrAdmin = roles.includes('kepala sekolah') || roles.includes('kepsek') || roles.includes('admin');
    const isGuru = isKepsekOrAdmin || roles.includes('guru') || roles.includes('walas');
    const isPiket = isKepsekOrAdmin || roles.includes('piket') || tugasPiket.includes('piket') || roles.includes('guru');

    const secWalas = document.getElementById('sectionWalasIzinSiswa');
    if (secWalas) secWalas.style.display = isGuru ? 'block' : 'none';

    const secGuru = document.getElementById('sectionGuruPengajarEduIzin');
    if (secGuru) secGuru.style.display = isGuru ? 'block' : 'none';

    const secPiket = document.getElementById('sectionPetugasPiketEduIzin');
    if (secPiket) secPiket.style.display = isPiket ? 'block' : 'none';
}

function loadDropdownEduIzin() {
    callGAS('get_dropdown_edu_izin', null, (res) => {
        if (res && res.status === 'success' && res.data) {
            const selGuru = document.getElementById('inputEduIzinGuru');
            const selPiket = document.getElementById('inputEduIzinPiket');
            
            if (selGuru && selPiket) {
                selGuru.innerHTML = '<option value="Tidak ada guru">Tidak ada guru / Jam Kosong</option>';
                (res.data.gurus || []).forEach(g => {
                    selGuru.innerHTML += `<option value="${g}">${g}</option>`;
                });

                selPiket.innerHTML = '<option value="">-- Pilih Petugas Piket --</option>';
                (res.data.pikets || []).forEach(p => {
                    selPiket.innerHTML += `<option value="${p}">${p}</option>`;
                });
            }
        }
    });
}

async function handleFormEduIzinSubmit(e) {
    e.preventDefault();
    const currentUser = getLoggedUserSafely();
    if (!currentUser) {
        showToast('Session expired, silahkan login ulang.', 'error');
        return;
    }

    const btn = document.getElementById('btnKirimEduIzinKBM');
    const originalText = btn ? btn.innerHTML : 'Kirim';
    
    const data = {
        nama: currentUser.nama || currentUser.username || '',
        kelas: currentUser.kelas || 'Umum',
        kategori: document.getElementById('inputEduIzinKategori').value,
        alasan: document.getElementById('inputEduIzinAlasan').value,
        guru: document.getElementById('inputEduIzinGuru').value,
        piket: document.getElementById('inputEduIzinPiket').value
    };

    if (!data.kategori || !data.alasan || !data.piket) {
        showToast('Kategori, Alasan, dan Petugas Piket wajib diisi!', 'warning');
        return;
    }

    const confirmed = await showCustomConfirm({
        title: 'Konfirmasi Permohonan Izin',
        message: 'Apakah Anda yakin ingin mengirim permohonan izin KBM ini?',
        icon: 'info',
        confirmText: 'Ya, Kirim'
    });

    if (!confirmed) return;

    if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengirim...';
        btn.disabled = true;
    }

    callGAS('submit_edu_izin', data, (res) => {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
        
        if (res && res.status === 'success') {
            const form = document.getElementById('formEduIzinKBM');
            if (form) form.reset();
            showToast(res.message || 'Permohonan berhasil dikirim!', 'success');
            loadEduIzinData();
        } else {
            showToast((res ? res.message : null) || 'Gagal mengirim permohonan', 'error');
        }
    });
}

let isLoadingEduIzinData = false;

function loadEduIzinData() {
    const currentUser = getLoggedUserSafely();
    if (!currentUser) return;

    checkAndShowEduIzinApprovalSections();

    if (isLoadingEduIzinData) return;
    isLoadingEduIzinData = true;

    const btns = [
        document.getElementById('btnRefreshEduIzinSiswa'),
        document.getElementById('btnRefreshApprovalIzinSiswa')
    ].filter(Boolean);

    btns.forEach(b => {
        b.disabled = true;
        b.innerHTML = '<i class="fa-solid fa-arrows-rotate fa-spin spin-icon" style="margin-right: 6px;"></i> Memuat...';
    });

    const startTime = Date.now();

    callGAS('get_edu_izin', null, (res) => {
        const elapsedTime = Date.now() - startTime;
        const remainingDelay = Math.max(0, 500 - elapsedTime);

        setTimeout(() => {
            btns.forEach(b => {
                b.disabled = false;
                b.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Refresh';
            });
            isLoadingEduIzinData = false;
        }, remainingDelay);

        if (res && res.status === 'success') {
            try { localStorage.setItem('smart_absen_edu_izin_cache', JSON.stringify(res.data || [])); } catch(e){}
            renderEduIzinTables(res.data || []);
            if (typeof updatePendingNotificationBadge === 'function') updatePendingNotificationBadge();
        } else {
            console.error('Gagal memuat data Izin KBM', res);
        }
    });
}

// State Global Pagination & Auto-Search
let pageGuruHistory = 1;
let pagePiketHistory = 1;
let queryGuruHistory = '';
let queryPiketHistory = '';
let listGuruHistoryGlobal = [];
let listPiketHistoryGlobal = [];
const HISTORY_PER_PAGE = 10;

function renderGuruHistoryPaginated() {
    const tbody = document.getElementById('tbodyGuruHistoryEduIzin');
    if (!tbody) return;

    let filtered = listGuruHistoryGlobal;
    if (queryGuruHistory) {
        const q = queryGuruHistory.toLowerCase().trim();
        filtered = listGuruHistoryGlobal.filter(item => item.rawText.includes(q));
    }

    const totalData = filtered.length;
    const totalPages = Math.ceil(totalData / HISTORY_PER_PAGE) || 1;
    if (pageGuruHistory > totalPages) pageGuruHistory = totalPages;
    if (pageGuruHistory < 1) pageGuruHistory = 1;

    const startIdx = (pageGuruHistory - 1) * HISTORY_PER_PAGE;
    const paginatedItems = filtered.slice(startIdx, startIdx + HISTORY_PER_PAGE);

    if (paginatedItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 30px;">Belum ada riwayat validasi.</td></tr>';
    } else {
        tbody.innerHTML = paginatedItems.map(item => `
            <tr>
                <td class="text-nowrap"><span class="badge" style="background: rgba(255,255,255,0.1); color: var(--text-muted);">${item.waktu}</span></td>
                <td><strong>${item.nama}</strong> <small class="text-muted">(${item.kelas})</small></td>
                <td style="text-align: center;">${item.kategori}</td>
                <td style="text-align: center;">${item.statusInfo}</td>
            </tr>
        `).join('');
    }

    const infoElem = document.getElementById('infoPaginationGuruHistory');
    const btnPrev = document.getElementById('btnPrevGuruHistory');
    const btnNext = document.getElementById('btnNextGuruHistory');

    if (infoElem) infoElem.innerText = `Halaman ${pageGuruHistory} dari ${totalPages} (Total ${totalData} data)`;
    if (btnPrev) btnPrev.disabled = pageGuruHistory <= 1;
    if (btnNext) btnNext.disabled = pageGuruHistory >= totalPages;
}

function renderPiketHistoryPaginated() {
    const tbody = document.getElementById('tbodyPiketHistoryEduIzin');
    if (!tbody) return;

    let filtered = listPiketHistoryGlobal;
    if (queryPiketHistory) {
        const q = queryPiketHistory.toLowerCase().trim();
        filtered = listPiketHistoryGlobal.filter(item => item.rawText.includes(q));
    }

    const totalData = filtered.length;
    const totalPages = Math.ceil(totalData / HISTORY_PER_PAGE) || 1;
    if (pagePiketHistory > totalPages) pagePiketHistory = totalPages;
    if (pagePiketHistory < 1) pagePiketHistory = 1;

    const startIdx = (pagePiketHistory - 1) * HISTORY_PER_PAGE;
    const paginatedItems = filtered.slice(startIdx, startIdx + HISTORY_PER_PAGE);

    if (paginatedItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 30px;">Belum ada dokumen yang diproses.</td></tr>';
    } else {
        tbody.innerHTML = paginatedItems.map(item => `
            <tr>
                <td class="text-nowrap"><span class="badge" style="background: rgba(255,255,255,0.1); color: var(--text-muted);">${item.waktu}</span></td>
                <td><strong>${item.nama}</strong> <small class="text-muted">(${item.kelas})</small></td>
                <td style="text-align: center;">${item.kategori}</td>
                <td style="text-align: center;">${item.docStatus}</td>
            </tr>
        `).join('');
    }

    const infoElem = document.getElementById('infoPaginationPiketHistory');
    const btnPrev = document.getElementById('btnPrevPiketHistory');
    const btnNext = document.getElementById('btnNextPiketHistory');

    if (infoElem) infoElem.innerText = `Halaman ${pagePiketHistory} dari ${totalPages} (Total ${totalData} data)`;
    if (btnPrev) btnPrev.disabled = pagePiketHistory <= 1;
    if (btnNext) btnNext.disabled = pagePiketHistory >= totalPages;
}

function renderEduIzinTables(data) {
    const currentUser = getLoggedUserSafely();
    if (!currentUser) return;

    let htmlSiswa = '';
    let htmlGuruPending = '';
    let htmlPiketPending = '';

    listGuruHistoryGlobal = [];
    listPiketHistoryGlobal = [];

    const roleLower = currentUser.role ? String(currentUser.role).toLowerCase() : '';
    const tugasPiket = String(currentUser.tugas_piket || currentUser.piket || '').toLowerCase();

    const isKepsekOrAdmin = roleLower.includes('kepala sekolah') || roleLower.includes('kepsek') || roleLower.includes('admin');
    const isSiswa = roleLower.includes('siswa');
    const isGuru = isKepsekOrAdmin || roleLower.includes('guru') || roleLower.includes('walas');
    const isPiket = isKepsekOrAdmin || roleLower.includes('piket') || tugasPiket.includes('piket') || roleLower.includes('guru');

    data.forEach(row => {
        // --- 1. SISI SISWA (Riwayat Saya) ---
        if (isSiswa && row.nama === currentUser.nama) {
            let statusBadge = '';
            let btnAksi = '-';
            
            if (row.statusGuru === 'Ditolak' || row.statusPiket === 'Ditolak') {
                statusBadge = `<span class="badge bg-danger">Ditolak</span>`;
                btnAksi = `<small class="text-danger">Keterangan: ${row.keteranganTolak || '-'}</small>`;
            }
            else if (row.statusPiket === 'Disetujui') {
                statusBadge = `<span class="badge bg-success">Selesai</span>`;
                if (row.linkPdf) {
                    btnAksi = `<a href="${row.linkPdf}" target="_blank" class="btn-secondary" style="padding:4px 8px; font-size:0.75rem; border-color:#10b981; color:#10b981;"><i class="fa-solid fa-cloud-arrow-down"></i> Unduh PDF</a>`;
                }
            }
            else {
                statusBadge = `<span class="badge" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4);">Proses</span>`;
                btnAksi = `<small class="text-muted">Menunggu Approval</small>`;
            }

            htmlSiswa += `
            <tr>
                <td class="text-nowrap"><span class="badge" style="background: rgba(255,255,255,0.1); color: var(--text-muted);">${row.waktu}</span></td>
                <td style="text-align: center;"><span class="badge" style="background: rgba(56, 189, 248, 0.2); color: #38bdf8;">${row.kategori}</span></td>
                <td>${row.alasan}</td>
                <td style="text-align: center;">${statusBadge}</td>
                <td style="text-align: center;">${btnAksi}</td>
            </tr>`;
        }

        // --- 2. SISI GURU PENGAJAR ---
        if (isGuru && (row.guru === currentUser.nama || isKepsekOrAdmin)) {
            if (row.statusGuru === 'Menunggu') {
                htmlGuruPending += `
                <tr>
                    <td style="text-align: center;"><input type="checkbox" class="check-edu-guru-item" value="${row.id}" onchange="updateEduIzinBulkCount('guru')" style="cursor: pointer;"></td>
                    <td class="text-nowrap"><span class="badge" style="background: rgba(255,255,255,0.1); color: var(--text-muted);">${row.waktu}</span></td>
                    <td><strong>${row.nama}</strong><br><small class="text-muted">${row.kelas}</small></td>
                    <td style="text-align: center;"><span class="badge" style="background: rgba(56, 189, 248, 0.2); color: #38bdf8;">${row.kategori}</span></td>
                    <td>${row.alasan}</td>
                    <td style="text-align: center;">
                        <div style="display: flex; gap: 5px; justify-content: center;">
                            <button onclick="approveEduIzin('${row.id}', 'guru')" class="btn-primary" style="padding: 4px 10px; font-size: 0.75rem; background: linear-gradient(135deg, #10b981, #059669);"><i class="fa-solid fa-check"></i> Izinkan</button>
                            <button onclick="rejectEduIzin('${row.id}', 'guru')" class="btn-secondary" style="padding: 4px 10px; font-size: 0.75rem; border-color: #ef4444; color: #ef4444;"><i class="fa-solid fa-xmark"></i> Tolak</button>
                        </div>
                    </td>
                </tr>`;
            } else if (row.statusGuru === 'Disetujui' || row.statusGuru === 'Ditolak') {
                let statusInfo = '';
                if (row.statusGuru === 'Ditolak') {
                    statusInfo = `<span class="badge bg-danger">Ditolak</span><br><small class="text-danger">Ket: ${row.keteranganTolak || '-'}</small>`;
                } else {
                    if (row.statusPiket === 'Disetujui') statusInfo = '<span class="badge bg-success">Selesai (Diizinkan Piket)</span>';
                    else if (row.statusPiket === 'Ditolak') statusInfo = `<span class="badge bg-danger">Ditolak Piket</span><br><small class="text-danger">Ket: ${row.keteranganTolak || '-'}</small>`;
                    else statusInfo = '<span class="badge" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24;">Menunggu Piket</span>';
                }

                listGuruHistoryGlobal.push({
                    waktu: row.waktu || '',
                    nama: row.nama || '',
                    kelas: row.kelas || '',
                    kategori: row.kategori || '',
                    statusInfo: statusInfo,
                    rawText: `${row.waktu} ${row.nama} ${row.kelas} ${row.kategori} ${statusInfo}`.toLowerCase()
                });
            }
        }

        // --- 3. SISI PETUGAS PIKET ---
        if (isPiket && (row.piket === currentUser.nama || isKepsekOrAdmin || roleLower.includes('piket') || tugasPiket.includes('piket') || roleLower.includes('guru'))) {
            if ((row.statusGuru === 'Disetujui' || row.statusGuru === 'Lewati') && row.statusPiket === 'Menunggu') {
                let badgeGuru = row.statusGuru === 'Lewati' ? '<span class="badge" style="background: rgba(255,255,255,0.1); color: var(--text-muted);">Dilewati (Jam Kosong)</span>' : '<span class="badge bg-success">Disetujui Guru</span>';
                
                htmlPiketPending += `
                <tr>
                    <td style="text-align: center;"><input type="checkbox" class="check-edu-piket-item" value="${row.id}" onchange="updateEduIzinBulkCount('piket')" style="cursor: pointer;"></td>
                    <td class="text-nowrap"><span class="badge" style="background: rgba(255,255,255,0.1); color: var(--text-muted);">${row.waktu}</span></td>
                    <td><strong>${row.nama}</strong><br><small class="text-muted">${row.kelas}</small></td>
                    <td style="text-align: center;"><span class="badge" style="background: rgba(56, 189, 248, 0.2); color: #38bdf8;">${row.kategori}</span><br><small class="text-muted mt-1 d-block">${row.alasan}</small></td>
                    <td style="text-align: center;">${badgeGuru}</td>
                    <td style="text-align: center;">
                        <div style="display: flex; gap: 5px; justify-content: center;">
                            <button onclick="approveEduIzin('${row.id}', 'piket')" class="btn-primary" style="padding: 4px 10px; font-size: 0.75rem; background: linear-gradient(135deg, #3b82f6, #2563eb);"><i class="fa-solid fa-print"></i> Cetak PDF</button>
                            <button onclick="rejectEduIzin('${row.id}', 'piket')" class="btn-secondary" style="padding: 4px 10px; font-size: 0.75rem; border-color: #ef4444; color: #ef4444;"><i class="fa-solid fa-xmark"></i> Tolak</button>
                        </div>
                    </td>
                </tr>`;
            } else if (row.statusPiket === 'Disetujui' || row.statusPiket === 'Ditolak') {
                let docStatus = '';
                if (row.statusPiket === 'Ditolak') {
                    docStatus = `<span class="badge bg-danger">Ditolak</span><br><small class="text-danger">Ket: ${row.keteranganTolak || '-'}</small>`;
                } else {
                    docStatus = `<a href="${row.linkPdf}" target="_blank" class="btn-secondary" style="padding:4px 8px; font-size:0.75rem; border-color:#38bdf8; color:#38bdf8;"><i class="fa-solid fa-file-pdf"></i> Lihat PDF</a>`;
                }

                listPiketHistoryGlobal.push({
                    waktu: row.waktu || '',
                    nama: row.nama || '',
                    kelas: row.kelas || '',
                    kategori: row.kategori || '',
                    docStatus: docStatus,
                    rawText: `${row.waktu} ${row.nama} ${row.kelas} ${row.kategori} ${docStatus}`.toLowerCase()
                });
            }
        }
    });

    const tbodySiswa = document.getElementById('tbodyRiwayatEduIzinSiswa');
    if (tbodySiswa) tbodySiswa.innerHTML = htmlSiswa || '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 30px;">Belum ada riwayat izin KBM.</td></tr>';

    const tbodyGuruPending = document.getElementById('tbodyGuruPendingEduIzin');
    if (tbodyGuruPending) tbodyGuruPending.innerHTML = htmlGuruPending || '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">Tidak ada permohonan baru.</td></tr>';

    const tbodyPiketPending = document.getElementById('tbodyPiketPendingEduIzin');
    if (tbodyPiketPending) tbodyPiketPending.innerHTML = htmlPiketPending || '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">Tidak ada antrean piket saat ini.</td></tr>';

    // Reset checkboxes select all & counters
    const checkAllGuru = document.getElementById('checkAllGuruEduIzin');
    if (checkAllGuru) checkAllGuru.checked = false;
    const checkAllPiket = document.getElementById('checkAllPiketEduIzin');
    if (checkAllPiket) checkAllPiket.checked = false;
    updateEduIzinBulkCount('guru');
    updateEduIzinBulkCount('piket');

    renderGuruHistoryPaginated();
    renderPiketHistoryPaginated();
}

/**
 * Handle Select All checkboxes
 */
function toggleSelectAllEduIzin(tipe, masterCheck) {
    const selector = tipe === 'guru' ? '.check-edu-guru-item' : '.check-edu-piket-item';
    document.querySelectorAll(selector).forEach(cb => {
        cb.checked = masterCheck.checked;
    });
    updateEduIzinBulkCount(tipe);
}

/**
 * Update dynamic batch counters
 */
function updateEduIzinBulkCount(tipe) {
    const selector = tipe === 'guru' ? '.check-edu-guru-item:checked' : '.check-edu-piket-item:checked';
    const count = document.querySelectorAll(selector).length;
    const countElem = document.getElementById(tipe === 'guru' ? 'countBulkGuruEduIzin' : 'countBulkPiketEduIzin');
    if (countElem) countElem.innerText = count;
}

/**
 * Bulk approve Edu-Izin
 */
/**
 * Bulk approve Edu-Izin with loading animation & UI locking
 */
async function approveBulkEduIzin(tipe, btnEl) {
    const currentUser = getLoggedUserSafely();
    if (!currentUser) {
        showToast('Session expired, silahkan login ulang.', 'error');
        return;
    }

    const container = document.getElementById(tipe === 'guru' ? 'containerBulkGuruEduIzin' : 'containerBulkPiketEduIzin');
    const bulkBtns = container ? container.querySelectorAll('button') : [];

    const selector = tipe === 'guru' ? '.check-edu-guru-item:checked' : '.check-edu-piket-item:checked';
    const selectedCbs = Array.from(document.querySelectorAll(selector));
    if (selectedCbs.length === 0) {
        showToast('Pilih setidaknya satu permohonan izin terlebih dahulu.', 'warning');
        return;
    }

    const ids = selectedCbs.map(cb => cb.value);
    const confirmTitle = tipe === 'guru' ? 'Konfirmasi Persetujuan Massal' : 'Konfirmasi Cetak PDF Massal';
    const confirmMsg = `Apakah Anda yakin ingin menyetujui ${ids.length} permohonan izin KBM sekaligus?`;

    const confirmed = await showCustomConfirm({
        title: confirmTitle,
        message: confirmMsg,
        icon: 'question',
        confirmText: 'Ya, Setujui Semua',
        cancelText: 'Batal'
    });

    if (!confirmed) return;

    // Lock UI controls to prevent repeated clicks
    bulkBtns.forEach(b => b.disabled = true);
    document.querySelectorAll(tipe === 'guru' ? '.check-edu-guru-item, #checkAllGuruEduIzin' : '.check-edu-piket-item, #checkAllPiketEduIzin').forEach(c => c.disabled = true);

    const targetBtn = btnEl || (window.event && window.event.target ? window.event.target.closest('button') : (bulkBtns[0] || null));
    const originalText = targetBtn ? targetBtn.innerHTML : '';

    showToast(`Memproses persetujuan ${ids.length} permohonan izin KBM...`, 'info');

    let action = tipe === 'guru' ? 'approve_edu_izin_guru' : 'approve_edu_izin_piket';
    let successCount = 0;

    try {
        for (let i = 0; i < ids.length; i++) {
            if (targetBtn) {
                targetBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Memproses (${i + 1}/${ids.length})...`;
            }
            const itemId = ids[i];
            await new Promise((resolve) => {
                callGAS(action, { id: itemId, approver: currentUser.nama }, (res) => {
                    if (res && res.status === 'success') successCount++;
                    resolve();
                });
            });
        }
        showToast(`Berhasil memproses ${successCount} dari ${ids.length} izin KBM!`, 'success');
    } catch (err) {
        console.error("Error bulk approving:", err);
        showToast("Terjadi kesalahan saat memproses izin massal.", "error");
    } finally {
        if (targetBtn) targetBtn.innerHTML = originalText;
        bulkBtns.forEach(b => b.disabled = false);
        loadEduIzinData();
    }
}

/**
 * Bulk reject Edu-Izin with loading animation & UI locking
 */
async function rejectBulkEduIzin(tipe, btnEl) {
    const currentUser = getLoggedUserSafely();
    if (!currentUser) {
        showToast('Session expired, silahkan login ulang.', 'error');
        return;
    }

    const container = document.getElementById(tipe === 'guru' ? 'containerBulkGuruEduIzin' : 'containerBulkPiketEduIzin');
    const bulkBtns = container ? container.querySelectorAll('button') : [];

    const selector = tipe === 'guru' ? '.check-edu-guru-item:checked' : '.check-edu-piket-item:checked';
    const selectedCbs = Array.from(document.querySelectorAll(selector));
    if (selectedCbs.length === 0) {
        showToast('Pilih setidaknya satu permohonan izin terlebih dahulu.', 'warning');
        return;
    }

    const ids = selectedCbs.map(cb => cb.value);
    const alasan = typeof showCustomPrompt === 'function'
        ? await showCustomPrompt({
            title: 'Penolakan Massal Permohonan Izin',
            message: `Masukkan alasan penolakan untuk ${ids.length} permohonan izin ini:`,
            placeholder: 'Ketik alasan penolakan secara spesifik...',
            confirmText: 'Tolak Semua Selected'
        })
        : prompt(`Masukkan alasan penolakan untuk ${ids.length} permohonan izin:`);

    if (alasan === null) return;
    if (!String(alasan).trim()) {
        showToast('Alasan penolakan wajib diisi!', 'warning');
        return;
    }

    // Lock UI controls to prevent repeated clicks
    bulkBtns.forEach(b => b.disabled = true);
    document.querySelectorAll(tipe === 'guru' ? '.check-edu-guru-item, #checkAllGuruEduIzin' : '.check-edu-piket-item, #checkAllPiketEduIzin').forEach(c => c.disabled = true);

    const targetBtn = btnEl || (window.event && window.event.target ? window.event.target.closest('button') : (bulkBtns[1] || null));
    const originalText = targetBtn ? targetBtn.innerHTML : '';

    showToast(`Memproses penolakan ${ids.length} permohonan izin KBM...`, 'info');
    let successCount = 0;

    try {
        for (let i = 0; i < ids.length; i++) {
            if (targetBtn) {
                targetBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Menolak (${i + 1}/${ids.length})...`;
            }
            const itemId = ids[i];
            await new Promise((resolve) => {
                callGAS('reject_edu_izin', { id: itemId, tipe: tipe, alasan: alasan, approver: currentUser.nama }, (res) => {
                    if (res && res.status === 'success') successCount++;
                    resolve();
                });
            });
        }
        showToast(`Berhasil menolak ${successCount} dari ${ids.length} izin KBM.`, 'success');
    } catch (err) {
        console.error("Error bulk rejecting:", err);
        showToast("Terjadi kesalahan saat menolak izin massal.", "error");
    } finally {
        if (targetBtn) targetBtn.innerHTML = originalText;
        bulkBtns.forEach(b => b.disabled = false);
        loadEduIzinData();
    }
}

async function approveEduIzin(id, tipe, btnEl) {
    const currentUser = getLoggedUserSafely();
    if (!currentUser) {
        showToast('Session expired, silahkan login ulang.', 'error');
        return;
    }

    const targetBtn = btnEl || (window.event && window.event.target ? window.event.target.closest('button') : null);
    const parentContainer = targetBtn ? targetBtn.parentElement : null;
    const originalHtml = targetBtn ? targetBtn.innerHTML : '';

    let confirmTitle = tipe === 'guru' ? 'Konfirmasi Persetujuan Guru Pengajar' : 'Konfirmasi Persetujuan Petugas Piket';
    let confirmMsg = tipe === 'guru' 
        ? "Apakah Anda yakin ingin menyetujui permohonan izin siswa ini?" 
        : "Apakah Anda yakin ingin menyetujui izin ini dan memproses penerbitan Surat Izin PDF resmi?";
    
    const confirmed = await showCustomConfirm({
        title: confirmTitle,
        message: confirmMsg,
        icon: 'question',
        confirmText: tipe === 'guru' ? 'Ya, Setujui Izin' : 'Ya, Setujui & Cetak PDF',
        cancelText: 'Batal'
    });

    if (!confirmed) return;

    if (targetBtn) {
        if (parentContainer) {
            parentContainer.querySelectorAll('button').forEach(b => b.disabled = true);
        }
        targetBtn.disabled = true;
        targetBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
    }

    showToast('Memproses persetujuan izin...', 'info');
    
    let action = tipe === 'guru' ? 'approve_edu_izin_guru' : 'approve_edu_izin_piket';
    
    callGAS(action, { id: id, approver: currentUser.nama }, (res) => {
        if (res && res.status === 'success') {
            showToast(res.message, 'success');
            loadEduIzinData();
        } else {
            showToast((res ? res.message : null) || 'Gagal menyetujui izin.', 'error');
            if (targetBtn) {
                if (parentContainer) {
                    parentContainer.querySelectorAll('button').forEach(b => b.disabled = false);
                }
                targetBtn.disabled = false;
                targetBtn.innerHTML = originalHtml;
            }
        }
    });
}

async function rejectEduIzin(id, tipe, btnEl) {
    const currentUser = getLoggedUserSafely();
    if (!currentUser) {
        showToast('Session expired, silahkan login ulang.', 'error');
        return;
    }

    const targetBtn = btnEl || (window.event && window.event.target ? window.event.target.closest('button') : null);
    const parentContainer = targetBtn ? targetBtn.parentElement : null;
    const originalHtml = targetBtn ? targetBtn.innerHTML : '';

    const alasan = typeof showCustomPrompt === 'function'
        ? await showCustomPrompt({
            title: 'Penolakan Permohonan Izin',
            message: 'Masukkan alasan penolakan permohonan izin ini:',
            placeholder: 'Ketik alasan penolakan secara spesifik...',
            confirmText: 'Tolak Permohonan'
        })
        : prompt("Masukkan alasan penolakan:");

    if (alasan === null) return;

    if (!String(alasan).trim()) {
        showToast('Alasan penolakan wajib diisi!', 'warning');
        return;
    }
    
    if (targetBtn) {
        if (parentContainer) {
            parentContainer.querySelectorAll('button').forEach(b => b.disabled = true);
        }
        targetBtn.disabled = true;
        targetBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
    }

    showToast('Memproses penolakan & Telegram bot sedang bekerja...', 'info');
    callGAS('reject_edu_izin', { id: id, tipe: tipe, alasan: alasan, approver: currentUser.nama }, (res) => {
        if (res && res.status === 'success') {
            showToast(res.message, 'success');
            loadEduIzinData();
        } else {
            showToast((res ? res.message : null) || 'Gagal menolak izin.', 'error');
            if (targetBtn) {
                if (parentContainer) {
                    parentContainer.querySelectorAll('button').forEach(b => b.disabled = false);
                }
                targetBtn.disabled = false;
                targetBtn.innerHTML = originalHtml;
            }
        }
    });
}
