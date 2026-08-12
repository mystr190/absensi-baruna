/**
 * =========================================================================
 * MODUL ABSEN KOKURIKULER (FRONTEND LOGIC)
 * =========================================================================
 */

let kokurikulerList = [];
let kokurikulerMembersMap = {};
let kokurikulerLogs = [];
let masterStudentsCacheForKokurikuler = [];
let activeKokurikulerIdForModal = null;
let selectedMemberNISNs = new Set();

function formatNISN(val) {
    let str = String(val || '').trim().replace(/^'/, '');
    if (str && /^\d+$/.test(str) && str.length < 10) {
        str = str.padStart(10, '0');
    }
    return str;
}

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('smart_absen_user') || '{}');
    } catch (e) {
        return {};
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initKokurikulerModule();
});

function initKokurikulerModule() {
    const inputDate = document.getElementById('inputDateKokurikuler');
    if (inputDate) {
        const todayStr = getTodayISOString();
        inputDate.value = todayStr;
        // RESTRIKSI TANGGAL: Tidak bisa memilih tanggal di masa depan
        inputDate.max = todayStr;
        inputDate.addEventListener('change', () => {
            if (inputDate.value > todayStr) {
                showToast('Presensi tidak dapat dilakukan untuk tanggal di masa depan.', 'error');
                inputDate.value = todayStr;
            }
            renderKokurikulerAbsenForm();
        });
    }

    // Populate Bulan Laporan
    const selectMonth = document.getElementById('selectKokurikulerReportMonth');
    if (selectMonth) {
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const currentMonth = new Date().getMonth() + 1;
        selectMonth.innerHTML = months.map((m, i) => `<option value="${i + 1}" ${i + 1 === currentMonth ? 'selected' : ''}>${m}</option>`).join('');
    }

    // Event Listeners Control Bar
    const selectAct = document.getElementById('selectKokurikulerAct');
    if (selectAct) {
        selectAct.addEventListener('change', renderKokurikulerAbsenForm);
    }

    const btnRefresh = document.getElementById('btnRefreshKokurikuler');
    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            fetchKokurikulerData(true);
        });
    }

    // Tab Navigation Event Listeners
    const btnTabInput = document.getElementById('tabBtnKokurikulerInput') || document.getElementById('btnKokurikulerTabInput');
    const btnTabReport = document.getElementById('tabBtnKokurikulerReport') || document.getElementById('btnKokurikulerTabReport');
    const tabContentInput = document.getElementById('tabContentKokurikulerInput') || document.getElementById('kokurikulerTabContentInput');
    const tabContentReport = document.getElementById('tabContentKokurikulerReport') || document.getElementById('kokurikulerTabContentReport');

    if (btnTabInput && btnTabReport && tabContentInput && tabContentReport) {
        btnTabInput.addEventListener('click', () => {
            btnTabInput.classList.add('active');
            btnTabReport.classList.remove('active');
            btnTabInput.style.color = '#38bdf8';
            btnTabInput.style.borderBottom = '3px solid #38bdf8';
            btnTabReport.style.color = '#94a3b8';
            btnTabReport.style.borderBottom = 'none';
            tabContentInput.style.display = 'block';
            tabContentReport.style.display = 'none';
        });

        btnTabReport.addEventListener('click', () => {
            btnTabReport.classList.add('active');
            btnTabInput.classList.remove('active');
            btnTabReport.style.color = '#38bdf8';
            btnTabReport.style.borderBottom = '3px solid #38bdf8';
            btnTabInput.style.color = '#94a3b8';
            btnTabInput.style.borderBottom = 'none';
            tabContentReport.style.display = 'block';
            tabContentInput.style.display = 'none';
            loadKokurikulerReport();
        });
    }

    // Set Semua Hadir Button
    const btnSetAllHadir = document.getElementById('btnSetAllKokurikulerHadir');
    if (btnSetAllHadir) {
        btnSetAllHadir.addEventListener('click', () => {
            const selects = document.querySelectorAll('.select-status-kokurikuler');
            selects.forEach(s => s.value = 'HADIR');
        });
    }

    // Simpan Presensi Button
    const btnSaveAbsen = document.getElementById('btnSaveAbsenKokurikuler');
    if (btnSaveAbsen) {
        btnSaveAbsen.addEventListener('click', saveAbsenKokurikuler);
    }

    // Laporan Filter & Cetak Buttons
    const btnFilterReport = document.getElementById('btnFilterKokurikulerReport');
    if (btnFilterReport) {
        btnFilterReport.addEventListener('click', loadKokurikulerReport);
    }

    const btnPrintReport = document.getElementById('btnPrintKokurikulerReport');
    if (btnPrintReport) {
        btnPrintReport.addEventListener('click', printKokurikulerReport);
    }

    // Admin Forms & Actions
    const btnSaveGroup = document.getElementById('btnSaveKokurikulerGroup');
    if (btnSaveGroup) {
        btnSaveGroup.addEventListener('click', saveKokurikulerGroup);
    }

    const btnCancelEdit = document.getElementById('btnCancelEditKokurikuler');
    if (btnCancelEdit) {
        btnCancelEdit.addEventListener('click', resetKokurikulerGroupForm);
    }

    // Modal Member Events
    const btnCloseModal = document.getElementById('btnCloseModalKokurikulerMembers');
    const btnCancelModal = document.getElementById('btnCancelModalKokurikulerMembers');
    const modalMembers = document.getElementById('modalKokurikulerMembers');
    if (btnCloseModal) btnCloseModal.addEventListener('click', () => modalMembers.style.display = 'none');
    if (btnCancelModal) btnCancelModal.addEventListener('click', () => modalMembers.style.display = 'none');

    const selectModalKelas = document.getElementById('selectModalFilterKelas');
    if (selectModalKelas) selectModalKelas.addEventListener('change', filterModalStudents);

    const inputModalSearch = document.getElementById('inputModalSearchSiswa');
    if (inputModalSearch) inputModalSearch.addEventListener('input', filterModalStudents);

    const checkModalSelectAll = document.getElementById('checkModalSelectAll');
    if (checkModalSelectAll) {
        checkModalSelectAll.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.check-member-item');
            checkboxes.forEach(cb => {
                cb.checked = e.target.checked;
                const nisn = formatNISN(cb.getAttribute('data-nisn'));
                if (e.target.checked) selectedMemberNISNs.add(nisn);
                else selectedMemberNISNs.delete(nisn);
            });
            updateSelectedCountLabel();
            renderModalStudentList();
        });
    }

    const btnSaveMembers = document.getElementById('btnSaveKokurikulerMembers');
    if (btnSaveMembers) {
        btnSaveMembers.addEventListener('click', saveKokurikulerMembers);
    }

    // Initial Fetch
    fetchKokurikulerData();
}

function getTodayISOString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function fetchKokurikulerData() {
    try {
        const u = getCurrentUser();
        const username = u ? (u.username || '') : '';
        const role = u ? (u.role || '') : '';

        // Pastikan master data user (guru) dimuat jika belum ada
        if ((!window.allUsers || window.allUsers.length === 0) && typeof loadUsers === 'function') {
            await loadUsers();
        }

        populateKokurikulerDropdowns();

        const url = `${SCRIPT_URL}?action=get_kokurikuler_data&username=${encodeURIComponent(username)}&role=${encodeURIComponent(role)}&_cb=${Date.now()}`;
        const res = await fetchWithRetry(url);

        if (res && res.status === 'success' && res.data) {
            kokurikulerList = res.data.kokurikuler || [];
            
            kokurikulerMembersMap = {};
            if (res.data.members) {
                for (const kId in res.data.members) {
                    kokurikulerMembersMap[kId] = (res.data.members[kId] || []).map(m => ({
                        ...m,
                        nisn: formatNISN(m.nisn)
                    }));
                }
            }

            if (res.data.logs) {
                kokurikulerLogs = (res.data.logs || []).map(l => ({
                    ...l,
                    nisn: formatNISN(l.nisn)
                }));
            }

            try {
                localStorage.setItem('smart_absen_kokurikuler_cache', JSON.stringify({
                    kokurikulerList,
                    kokurikulerMembersMap,
                    kokurikulerLogs
                }));
            } catch(e){}

            populateKokurikulerDropdowns();
            renderKokurikulerAbsenForm();
            renderAdminKokurikulerTable();
        } else {
            try {
                const cached = JSON.parse(localStorage.getItem('smart_absen_kokurikuler_cache') || '{}');
                if (cached.kokurikulerList) kokurikulerList = cached.kokurikulerList;
                if (cached.kokurikulerMembersMap) kokurikulerMembersMap = cached.kokurikulerMembersMap;
                if (cached.kokurikulerLogs) kokurikulerLogs = cached.kokurikulerLogs;
            } catch(e){}

            populateKokurikulerDropdowns();
            renderKokurikulerAbsenForm();
            renderAdminKokurikulerTable();

            if (res && res.message === 'API Active') {
                showToast('⚠️ Web App Apps Script belum di-deploy kembali. Mohon lakukan New Deployment di Apps Script!', 'warning');
            } else if (res && res.message) {
                showToast(res.message, 'error');
            }
        }
    } catch (err) {
        console.error('Error loading kokurikuler data:', err);
        try {
            const cached = JSON.parse(localStorage.getItem('smart_absen_kokurikuler_cache') || '{}');
            if (cached.kokurikulerList) kokurikulerList = cached.kokurikulerList;
            if (cached.kokurikulerMembersMap) kokurikulerMembersMap = cached.kokurikulerMembersMap;
            if (cached.kokurikulerLogs) kokurikulerLogs = cached.kokurikulerLogs;
        } catch(e){}
        populateKokurikulerDropdowns();
        renderKokurikulerAbsenForm();
    }
}

// Global Alias for backwards compatibility
window.loadKokurikulerData = fetchKokurikulerData;

function populateKokurikulerDropdowns() {
    const selectAct = document.getElementById('selectKokurikulerAct');
    if (selectAct) {
        if (!kokurikulerList || kokurikulerList.length === 0) {
            kokurikulerList = [
                { id: 'KOKU-001', nama: 'Kegiatan Bimbingan Kokurikuler', username_pembimbing: 'admin', nama_pembimbing: 'Guru Pembimbing', keterangan: 'Kelompok Utama Bimbingan Kokurikuler' }
            ];
        }

        const currVal = selectAct.value;
        selectAct.innerHTML = kokurikulerList.map(k => `<option value="${k.id}">${k.nama} (Pembimbing: ${k.nama_pembimbing || '-'})</option>`).join('');
        
        if (currVal && kokurikulerList.some(k => k.id === currVal)) {
            selectAct.value = currVal;
        } else if (kokurikulerList.length > 0) {
            selectAct.value = kokurikulerList[0].id;
        }
    }

    // Populate Guru Pembimbing Dropdown for Admin
    const selectPembimbing = document.getElementById('selectPembimbingKokurikuler');
    if (selectPembimbing) {
        let teacherList = window.allUsers || window.allTeachers || [];
        if (!teacherList || teacherList.length === 0) {
            try {
                teacherList = JSON.parse(localStorage.getItem('smart_absen_users_cache') || '[]');
            } catch (e) {
                teacherList = [];
            }
        }

        const teachers = teacherList.filter(u => {
            const r = String(u.role || '').toLowerCase();
            return r === 'guru' || r === 'admin';
        });

        if (teachers.length > 0) {
            selectPembimbing.innerHTML = '<option value="">-- Pilih Guru Pembimbing --</option>' +
                teachers.map(t => {
                    const nama = t.nama || t.namaLengkap || t.username;
                    return `<option value="${t.username}" data-nama="${nama}">${nama} (${t.username})</option>`;
                }).join('');
        } else {
            selectPembimbing.innerHTML = '<option value="">-- Tidak Ada Data Guru --</option>';
        }
    }
}

function renderKokurikulerAbsenForm() {
    const selectAct = document.getElementById('selectKokurikulerAct');
    const tableBody = document.getElementById('tableBodyKokurikulerAbsen');
    const lblCount = document.getElementById('lblKokurikulerCount');
    const inputDate = document.getElementById('inputDateKokurikuler');
    const btnSave = document.getElementById('btnSaveAbsenKokurikuler');
    const btnSetAllHadir = document.getElementById('btnSetAllKokurikulerHadir');

    if (!selectAct || !tableBody) return;

    let idK = selectAct.value;
    if (!idK && kokurikulerList && kokurikulerList.length > 0) {
        idK = kokurikulerList[0].id;
        selectAct.value = idK;
    }

    if (!idK) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 25px; color: var(--text-muted);">Tidak ada kegiatan kokurikuler yang dipilih.</td></tr>`;
        if (lblCount) lblCount.textContent = '0';
        if (btnSave) {
            btnSave.disabled = true;
            btnSave.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Simpan Presensi Kokurikuler`;
        }
        return;
    }

    let members = (kokurikulerMembersMap && kokurikulerMembersMap[idK]) ? kokurikulerMembersMap[idK] : [];
    
    // Fallback: Jika belum ada anggota khusus terdaftar di sheet AnggotaKokurikuler, ambil dari Master Data Siswa
    if (!members || members.length === 0) {
        let masterStudents = window.allStudents || [];
        if (!masterStudents || masterStudents.length === 0) {
            try {
                masterStudents = JSON.parse(localStorage.getItem('smart_absen_master_students') || '[]');
            } catch (e) {
                masterStudents = [];
            }
        }
        if (masterStudents && masterStudents.length > 0) {
            members = masterStudents.map(s => ({
                nisn: formatNISN(s.nisn || s.NISN || s.nis || s.NIS),
                nis: String(s.nis || s.NIS || ''),
                nama: String(s.nama || s.Nama || s.nama_siswa || s.namaLengkap || 'Siswa'),
                kelas: String(s.kelas || s.Kelas || '-')
            }));
        }
    }

    if (lblCount) lblCount.textContent = members.length;

    if (members.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 25px; color: var(--text-muted);">Belum ada siswa yang terdaftar di kelompok kokurikuler ini.<br><small>Mintalah Admin untuk mendaftarkan siswa bimbingan.</small></td></tr>`;
        if (btnSave) btnSave.disabled = true;
        return;
    }

    const selectedDate = inputDate ? inputDate.value : getTodayISOString();

    // Map existing logs for this group & date
    const logMap = {};
    let savedLogsCount = 0;

    kokurikulerLogs.forEach(l => {
        if (String(l.id_kokurikuler) === String(idK) && l.tanggal === selectedDate) {
            const key = formatNISN(l.nisn || l.nis);
            if (key) {
                logMap[key] = l;
                savedLogsCount++;
            }
        }
    });

    const isAlreadySaved = savedLogsCount > 0;

    // Render Alert Banner above table if already saved
    const alertContainer = document.getElementById('alertKokurikulerStatusContainer');
    if (alertContainer) {
        if (isAlreadySaved) {
            alertContainer.style.display = 'block';
            alertContainer.innerHTML = `
                <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.35); color: #10b981; padding: 12px 18px; border-radius: 10px; font-weight: 600; font-size: 0.88rem; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
                    <span style="display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-circle-check" style="font-size: 1.1rem;"></i> 
                        Presensi tanggal <strong>${selectedDate}</strong> sudah disimpan (${savedLogsCount} siswa ter-absen). Form terkunci otomatis.
                    </span>
                    <button type="button" id="btnUnlockKokurikulerAbsen" style="background: rgba(234, 179, 8, 0.2); color: #facc15; border: 1px solid rgba(234, 179, 8, 0.4); border-radius: 8px; padding: 5px 14px; font-size: 0.82rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: background 0.2s;" onmouseover="this.style.background='rgba(234,179,8,0.35)'" onmouseout="this.style.background='rgba(234,179,8,0.2)'">
                        <i class="fa-solid fa-lock-open"></i> Edit Presensi
                    </button>
                </div>
            `;

            setTimeout(() => {
                const btnUnlock = document.getElementById('btnUnlockKokurikulerAbsen');
                if (btnUnlock) {
                    btnUnlock.addEventListener('click', () => {
                        enableKokurikulerForm(true);
                    });
                }
            }, 50);
        } else {
            alertContainer.style.display = 'none';
            alertContainer.innerHTML = '';
        }
    }

    let html = '';
    members.forEach((m, index) => {
        const nisnFormatted = formatNISN(m.nisn);
        const key = nisnFormatted || formatNISN(m.nis);
        const existing = logMap[key];
        const status = existing ? String(existing.status).toUpperCase() : 'HADIR';
        const ket = existing ? existing.keterangan : '';
        const disabledAttr = isAlreadySaved ? 'disabled' : '';

        html += `
            <tr data-nisn="${nisnFormatted}" data-nis="${m.nis}" data-nama="${m.nama}" data-kelas="${m.kelas}" style="border-bottom: 1px solid var(--card-border, #1e293b);">
                <td style="padding: 10px; text-align: center;">${index + 1}</td>
                <td style="padding: 10px; font-weight: 600; font-family: monospace;">${nisnFormatted || m.nis || '-'}</td>
                <td style="padding: 10px; color: #f8fafc; font-weight: 700;">${m.nama}</td>
                <td style="padding: 10px; text-align: center;"><span class="badge" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8;">${m.kelas}</span></td>
                <td style="padding: 10px; text-align: center;">
                    <select class="form-input select-status-kokurikuler" ${disabledAttr} style="width: 100%; max-width: 160px; font-weight: 700;">
                        <option value="HADIR" ${status === 'HADIR' ? 'selected' : ''} style="color: #22c55e;">Hadir (H)</option>
                        <option value="SAKIT" ${status === 'SAKIT' ? 'selected' : ''} style="color: #eab308;">Sakit (S)</option>
                        <option value="IZIN" ${status === 'IZIN' ? 'selected' : ''} style="color: #3b82f6;">Izin (I)</option>
                        <option value="ALPA" ${status === 'ALPA' ? 'selected' : ''} style="color: #ef4444;">Alpa (A)</option>
                        <option value="TELAT" ${status === 'TELAT' ? 'selected' : ''} style="color: #a855f7;">Telat (T)</option>
                    </select>
                </td>
                <td style="padding: 10px;">
                    <input type="text" class="form-input input-ket-kokurikuler" ${disabledAttr} style="width: 100%;" placeholder="Catatan opsional..." value="${ket}">
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;

    // Update Save button & Set All Hadir button state
    if (btnSave) {
        if (isAlreadySaved) {
            btnSave.disabled = true;
            btnSave.style.background = '#334155';
            btnSave.style.cursor = 'not-allowed';
            btnSave.style.opacity = '0.7';
            btnSave.innerHTML = `<i class="fa-solid fa-lock"></i> Presensi Sudah Disimpan`;
        } else {
            btnSave.disabled = false;
            btnSave.style.background = '';
            btnSave.style.cursor = 'pointer';
            btnSave.style.opacity = '1';
            btnSave.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Simpan Presensi Kokurikuler`;
        }
    }

    if (btnSetAllHadir) {
        btnSetAllHadir.disabled = isAlreadySaved;
    }
}

function enableKokurikulerForm(isUnlock) {
    const selects = document.querySelectorAll('.select-status-kokurikuler');
    const inputs = document.querySelectorAll('.input-ket-kokurikuler');
    const btnSave = document.getElementById('btnSaveAbsenKokurikuler');
    const btnSetAllHadir = document.getElementById('btnSetAllKokurikulerHadir');

    selects.forEach(s => s.disabled = false);
    inputs.forEach(i => i.disabled = false);

    if (btnSetAllHadir) btnSetAllHadir.disabled = false;

    if (btnSave) {
        btnSave.disabled = false;
        btnSave.style.background = '';
        btnSave.style.cursor = 'pointer';
        btnSave.style.opacity = '1';
        btnSave.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Simpan Perubahan Presensi`;
    }

    if (isUnlock) {
        showToast('Form presensi dibuka. Anda dapat mengubah status dan mengeklik Simpan Perubahan.', 'info');
    }
}

async function saveAbsenKokurikuler() {
    const selectAct = document.getElementById('selectKokurikulerAct');
    const inputDate = document.getElementById('inputDateKokurikuler');
    const btnSave = document.getElementById('btnSaveAbsenKokurikuler');

    if (!selectAct || !inputDate) return;

    const idK = selectAct.value;
    const tanggal = inputDate.value;
    const todayStr = getTodayISOString();

    if (!idK) {
        showToast('Pilih kegiatan kokurikuler terlebih dahulu.', 'warning');
        return;
    }

    // VALIDASI MASA DEPAN
    if (tanggal > todayStr) {
        showToast(`Absensi tidak dapat dilakukan untuk tanggal di masa depan (${tanggal}).`, 'error');
        inputDate.value = todayStr;
        return;
    }

    const selectedActObj = kokurikulerList.find(k => k.id === idK);
    const namaK = selectedActObj ? selectedActObj.nama : '';
    const uPemb = selectedActObj ? selectedActObj.username_pembimbing : '';

    const rows = document.querySelectorAll('#tableBodyKokurikulerAbsen tr[data-nisn]');
    if (rows.length === 0) {
        showToast('Tidak ada data siswa untuk disimpan.', 'warning');
        return;
    }

    const logs = [];
    rows.forEach(tr => {
        const nisn = formatNISN(tr.getAttribute('data-nisn'));
        const nis = tr.getAttribute('data-nis');
        const nama = tr.getAttribute('data-nama');
        const kelas = tr.getAttribute('data-kelas');
        const status = tr.querySelector('.select-status-kokurikuler').value;
        const ket = tr.querySelector('.input-ket-kokurikuler').value;

        logs.push({ nisn, nis, nama, kelas, status, keterangan: ket });
    });

    const origText = btnSave.innerHTML;
    btnSave.disabled = true;
    btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';

    try {
        const payload = {
            action: 'save_absen_kokurikuler',
            id_kokurikuler: idK,
            nama_kokurikuler: namaK,
            username_pembimbing: uPemb,
            tanggal: tanggal,
            logs: logs
        };

        const res = await fetchWithRetry(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (res && res.status === 'success') {
            showToast(res.message, 'success');
            fetchKokurikulerData(true);
        } else {
            showToast(res ? res.message : 'Gagal menyimpan presensi.', 'error');
        }
    } catch (err) {
        showToast('Gagal: ' + (err.message || 'Error koneksi server.'), 'error');
    } finally {
        btnSave.disabled = false;
        btnSave.innerHTML = origText;
    }
}

/**
 * Rekap & Laporan Kokurikuler
 */
async function loadKokurikulerReport() {
    const selectAct = document.getElementById('selectKokurikulerAct');
    const selectMonth = document.getElementById('selectKokurikulerReportMonth');
    const inputYear = document.getElementById('inputKokurikulerReportYear');
    const tableBody = document.getElementById('tableBodyKokurikulerReport');

    if (!tableBody) return;

    const idK = selectAct ? selectAct.value : '';
    const month = selectMonth ? selectMonth.value : (new Date().getMonth() + 1);
    const year = inputYear ? inputYear.value : new Date().getFullYear();

    tableBody.innerHTML = `<tr><td colspan="11" style="text-align: center; padding: 25px;"><span class="loader" style="display:inline-block; margin-right:8px;"></span>Memuat rekap presensi...</td></tr>`;

    try {
        const url = `${SCRIPT_URL}?action=get_kokurikuler_report&id_kokurikuler=${encodeURIComponent(idK)}&bulan=${month}&tahun=${year}&_cb=${Date.now()}`;
        const res = await fetchWithRetry(url);

        if (res && res.status === 'success') {
            const reportLogs = res.data || [];
            renderReportTable(reportLogs, idK);
        } else {
            tableBody.innerHTML = `<tr><td colspan="11" style="text-align: center; padding: 25px; color: #ef4444;">Gagal memuat rekap.</td></tr>`;
        }
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="11" style="text-align: center; padding: 25px; color: #ef4444;">Terjadi kesalahan sistem.</td></tr>`;
    }
}

function renderReportTable(logs, idK) {
    const tableBody = document.getElementById('tableBodyKokurikulerReport');
    if (!tableBody) return;

    const members = (kokurikulerMembersMap && kokurikulerMembersMap[idK]) ? kokurikulerMembersMap[idK] : [];
    
    // Group logs by Student NISN/NIS
    const summary = {};

    members.forEach(m => {
        const nisnFormatted = formatNISN(m.nisn || m.nis);
        const key = nisnFormatted || String(m.nama || '').toLowerCase();
        summary[key] = {
            nisn: nisnFormatted,
            nama: m.nama || 'Siswa',
            kelas: m.kelas || '-',
            H: 0, S: 0, I: 0, A: 0, T: 0, Total: 0
        };
    });

    if (logs && logs.length > 0) {
        logs.forEach(l => {
            const nisnFormatted = formatNISN(l.nisn || l.nis);
            const key = nisnFormatted || String(l.nama_siswa || '').toLowerCase();

            if (!summary[key]) {
                summary[key] = {
                    nisn: nisnFormatted,
                    nama: l.nama_siswa || 'Siswa',
                    kelas: l.kelas || '-',
                    H: 0, S: 0, I: 0, A: 0, T: 0, Total: 0
                };
            }

            const st = String(l.status || '').toUpperCase();
            if (st === 'HADIR') summary[key].H++;
            else if (st === 'SAKIT') summary[key].S++;
            else if (st === 'IZIN') summary[key].I++;
            else if (st === 'ALPA') summary[key].A++;
            else if (st === 'TELAT') summary[key].T++;
            summary[key].Total++;
        });
    }

    const summaryKeys = Object.keys(summary);
    if (summaryKeys.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="11" style="text-align: center; padding: 25px; color: var(--text-muted);">Tidak ada data presensi atau anggota terdaftar untuk kegiatan ini pada bulan ini.</td></tr>`;
        return;
    }

    let html = '';
    let index = 1;
    summaryKeys.forEach(key => {
        const s = summary[key];
        const pct = s.Total > 0 ? Math.round(((s.H + s.T) / s.Total) * 100) : 0;
        const pctColor = pct >= 80 ? '#22c55e' : (pct >= 60 ? '#eab308' : '#ef4444');

        html += `
            <tr style="border-bottom: 1px solid var(--card-border, #1e293b);">
                <td style="padding: 10px; text-align: center;">${index++}</td>
                <td style="padding: 10px; font-weight: 600; font-family: monospace;">${s.nisn || '-'}</td>
                <td style="padding: 10px; color: #f8fafc; font-weight: 700;">${s.nama}</td>
                <td style="padding: 10px; text-align: center;"><span class="badge" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8;">${s.kelas}</span></td>
                <td style="padding: 10px; text-align: center; font-weight: 700; color: #22c55e;">${s.H}</td>
                <td style="padding: 10px; text-align: center; font-weight: 700; color: #eab308;">${s.S}</td>
                <td style="padding: 10px; text-align: center; font-weight: 700; color: #3b82f6;">${s.I}</td>
                <td style="padding: 10px; text-align: center; font-weight: 700; color: #ef4444;">${s.A}</td>
                <td style="padding: 10px; text-align: center; font-weight: 700; color: #a855f7;">${s.T}</td>
                <td style="padding: 10px; text-align: center; font-weight: 700;">${s.Total}</td>
                <td style="padding: 10px; text-align: center; font-weight: 800; color: ${pctColor};">${pct}%</td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;
}

function printKokurikulerReport() {
    const selectAct = document.getElementById('selectKokurikulerAct');
    const selectMonth = document.getElementById('selectKokurikulerReportMonth');
    const inputYear = document.getElementById('inputKokurikulerReportYear');
    const printArea = document.getElementById('kokurikulerReportPrintArea');

    if (!printArea || !selectAct) return;

    const actName = selectAct.options[selectAct.selectedIndex] ? selectAct.options[selectAct.selectedIndex].text : 'Kokurikuler';
    const monthName = selectMonth && selectMonth.options[selectMonth.selectedIndex] ? selectMonth.options[selectMonth.selectedIndex].text : '';
    const year = inputYear ? inputYear.value : '';

    const printWin = window.open('', '_blank');
    if (!printWin) {
        showToast('Pop-up terblokir oleh browser. Harap izinkan pop-up untuk mencetak laporan.', 'warning');
        return;
    }

    printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Laporan Presensi Kokurikuler - ${actName}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; color: #000; background: #fff; }
                h2, h4 { text-align: center; margin: 4px 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; text-align: center; }
                .text-center { text-align: center; }
                @media print {
                    @page { size: landscape; margin: 15mm; }
                }
            </style>
        </head>
        <body>
            <h2>LAPORAN REKAPITULASI PRESENSI KOKURIKULER</h2>
            <h4>Kegiatan: ${actName}</h4>
            <h4 style="font-weight: normal;">Periode: ${monthName} ${year}</h4>
            <hr style="margin-top: 15px; border: 1px solid #000;">
            ${printArea.innerHTML}
            <div style="margin-top: 40px; float: right; text-align: center; width: 220px;">
                <p>Pembimbing Kokurikuler</p>
                <br><br><br><br>
                <p>____________________</p>
            </div>
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() { window.close(); }, 500);
                };
            </script>
        </body>
        </html>
    `);
    printWin.document.close();
}

/**
 * FITUR ADMIN: Kelola Kegiatan & Anggota Lintas Kelas
 */
function renderAdminKokurikulerTable() {
    const tableBody = document.getElementById('tableBodyKelolaKokurikuler');
    if (!tableBody) return;

    if (kokurikulerList.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 25px; color: var(--text-muted);">Belum ada kegiatan kokurikuler terdaftar.</td></tr>`;
        return;
    }

    let html = '';
    kokurikulerList.forEach((k, index) => {
        const memberCount = (kokurikulerMembersMap[k.id] || []).length;

        html += `
            <tr style="border-bottom: 1px solid var(--card-border, #1e293b);">
                <td style="padding: 10px; text-align: center;">${index + 1}</td>
                <td style="padding: 10px; color: #f8fafc; font-weight: 700;">${k.nama}</td>
                <td style="padding: 10px; color: #cbd5e1;">${k.nama_pembimbing} (${k.username_pembimbing})</td>
                <td style="padding: 10px; color: var(--text-muted);">${k.keterangan || '-'}</td>
                <td style="padding: 10px; text-align: center;"><span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; font-weight: 700;">${memberCount} Siswa</span></td>
                <td style="padding: 10px; text-align: center;">
                    <div style="display: flex; gap: 6px; justify-content: center;">
                        <button type="button" class="btn-secondary" style="font-size: 0.78rem; padding: 5px 10px;" onclick="openManageMembersModal('${k.id}')" title="Atur Siswa Lintas Kelas">
                            <i class="fa-solid fa-users-gear" style="color: #38bdf8;"></i> Anggota
                        </button>
                        <button type="button" class="btn-secondary" style="font-size: 0.78rem; padding: 5px 10px;" onclick="editKokurikulerGroup('${k.id}')" title="Edit Kegiatan">
                            <i class="fa-solid fa-pen" style="color: #eab308;"></i>
                        </button>
                        <button type="button" class="btn-secondary" style="font-size: 0.78rem; padding: 5px 10px;" onclick="deleteKokurikulerGroup('${k.id}')" title="Hapus Kegiatan">
                            <i class="fa-solid fa-trash" style="color: #ef4444;"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;
}

async function saveKokurikulerGroup() {
    const inputId = document.getElementById('inputEditKokurikulerId');
    const inputNama = document.getElementById('inputNamaKokurikuler');
    const selectPemb = document.getElementById('selectPembimbingKokurikuler');
    const inputKet = document.getElementById('inputKetKokurikuler');
    const btnSave = document.getElementById('btnSaveKokurikulerGroup');

    if (!inputNama || !selectPemb) return;

    const nama = inputNama.value.trim();
    const uPemb = selectPemb.value;
    const nPemb = selectPemb.options[selectPemb.selectedIndex] ? selectPemb.options[selectPemb.selectedIndex].getAttribute('data-nama') || uPemb : uPemb;
    const ket = inputKet ? inputKet.value.trim() : '';
    const id = inputId ? inputId.value : '';

    if (!nama || !uPemb) {
        showToast('Nama kegiatan dan Guru Pembimbing wajib diisi.', 'warning');
        return;
    }

    const origText = btnSave.innerHTML;
    btnSave.disabled = true;
    btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';

    try {
        const payload = {
            action: 'save_kokurikuler',
            id: id,
            nama: nama,
            username_pembimbing: uPemb,
            nama_pembimbing: nPemb,
            keterangan: ket
        };

        const res = await fetchWithRetry(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (res && res.status === 'success') {
            showToast(res.message, 'success');
            resetKokurikulerGroupForm();
            fetchKokurikulerData(true);
        } else {
            showToast(res ? res.message : 'Gagal menyimpan kegiatan.', 'error');
        }
    } catch (err) {
        showToast('Gagal: ' + (err.message || 'Error koneksi server.'), 'error');
    } finally {
        btnSave.disabled = false;
        btnSave.innerHTML = origText;
    }
}

function editKokurikulerGroup(id) {
    const item = kokurikulerList.find(k => k.id === id);
    if (!item) return;

    document.getElementById('inputEditKokurikulerId').value = item.id;
    document.getElementById('inputNamaKokurikuler').value = item.nama;
    document.getElementById('selectPembimbingKokurikuler').value = item.username_pembimbing;
    document.getElementById('inputKetKokurikuler').value = item.keterangan || '';

    document.getElementById('titleFormKokurikuler').innerHTML = `<i class="fa-solid fa-pen-to-square" style="color: #eab308; margin-right: 6px;"></i> Edit Kegiatan Kokurikuler`;
    document.getElementById('btnCancelEditKokurikuler').style.display = 'inline-block';
}

function resetKokurikulerGroupForm() {
    document.getElementById('inputEditKokurikulerId').value = '';
    document.getElementById('inputNamaKokurikuler').value = '';
    document.getElementById('selectPembimbingKokurikuler').value = '';
    document.getElementById('inputKetKokurikuler').value = '';

    document.getElementById('titleFormKokurikuler').innerHTML = `<i class="fa-solid fa-plus-circle" style="color: #38bdf8; margin-right: 6px;"></i> Tambah Kegiatan Kokurikuler Baru`;
    document.getElementById('btnCancelEditKokurikuler').style.display = 'none';
}

async function deleteKokurikulerGroup(id) {
    const confirmed = await showCustomConfirm({
        title: 'Hapus Kegiatan Kokurikuler',
        message: 'Apakah Anda yakin ingin menghapus kegiatan kokurikuler ini? Seluruh data anggota dan log presensi terkait akan ikut terhapus.',
        icon: 'danger',
        confirmText: 'Ya, Hapus',
        cancelText: 'Batal',
        danger: true
    });
    if (!confirmed) return;

    try {
        const res = await fetchWithRetry(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'delete_kokurikuler', id: id })
        });

        if (res && res.status === 'success') {
            showToast(res.message, 'success');
            fetchKokurikulerData(true);
        } else {
            showToast(res ? res.message : 'Gagal menghapus kegiatan.', 'error');
        }
    } catch (err) {
        showToast('Gagal: ' + (err.message || 'Error koneksi server.'), 'error');
    }
}

/**
 * MODAL MANAJEMEN ANGGOTA SISWA LINTAS KELAS
 */
async function openManageMembersModal(idKokurikuler) {
    const item = kokurikulerList.find(k => k.id === idKokurikuler);
    if (!item) return;

    activeKokurikulerIdForModal = idKokurikuler;
    document.getElementById('lblModalKokurikulerName').textContent = item.nama;
    document.getElementById('lblModalKokurikulerPembimbing').textContent = `${item.nama_pembimbing} (${item.username_pembimbing})`;

    const modal = document.getElementById('modalKokurikulerMembers');
    modal.style.display = 'flex';

    // Set active selected NISNs
    const currentMembers = kokurikulerMembersMap[idKokurikuler] || [];
    selectedMemberNISNs = new Set(currentMembers.map(m => formatNISN(m.nisn || m.nis)));
    updateSelectedCountLabel();

    // Fetch master students if not cached
    if (masterStudentsCacheForKokurikuler.length === 0) {
        await fetchMasterStudentsForKokurikuler();
    } else {
        renderModalStudentList();
    }
}

async function fetchMasterStudentsForKokurikuler() {
    const tableBody = document.getElementById('tableBodyModalKokurikulerMembers');
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 25px;"><span class="loader" style="display:inline-block; margin-right:8px;"></span>Memuat data siswa sekolah...</td></tr>`;

    try {
        const res = await fetchWithRetry(`${SCRIPT_URL}?action=get_students&_cb=${Date.now()}`);
        if (res && res.status === 'success') {
            masterStudentsCacheForKokurikuler = (res.data || []).map(s => ({
                ...s,
                nisn: formatNISN(s.nisn)
            }));
            populateModalClassDropdown();
            renderModalStudentList();
        } else {
            tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 25px; color: #ef4444;">Gagal memuat master siswa.</td></tr>`;
        }
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 25px; color: #ef4444;">Gagal memuat master siswa: ${err.message || 'Error koneksi server.'}</td></tr>`;
    }
}

function populateModalClassDropdown() {
    const selectClass = document.getElementById('selectModalFilterKelas');
    if (!selectClass) return;

    const classSet = new Set();
    masterStudentsCacheForKokurikuler.forEach(s => {
        if (s.kelas) classSet.add(s.kelas);
    });

    const sortedClasses = Array.from(classSet).sort();
    selectClass.innerHTML = `
        <option value="Semua">-- Semua Kelas (${sortedClasses.length}) --</option>
        <option value="TERPILIH">⭐ Hanya Anggota Terpilih (${selectedMemberNISNs.size})</option>
    ` + sortedClasses.map(c => `<option value="${c}">Kelas ${c}</option>`).join('');
}

function filterModalStudents() {
    renderModalStudentList();
}

function renderModalStudentList() {
    const tableBody = document.getElementById('tableBodyModalKokurikulerMembers');
    const selectClass = document.getElementById('selectModalFilterKelas');
    const inputModalSearch = document.getElementById('inputModalSearchSiswa');

    if (!tableBody) return;

    const filterClass = selectClass ? selectClass.value : 'Semua';
    const query = inputModalSearch ? inputModalSearch.value.trim().toLowerCase() : '';

    const filtered = masterStudentsCacheForKokurikuler.filter(s => {
        const nisnFormatted = formatNISN(s.nisn);
        const key = nisnFormatted || formatNISN(s.nis);
        const isChecked = selectedMemberNISNs.has(key);

        if (filterClass === 'TERPILIH' && !isChecked) return false;

        const matchClass = (filterClass === 'Semua' || filterClass === 'TERPILIH') || String(s.kelas) === filterClass;
        const matchQuery = !query || String(s.nama).toLowerCase().includes(query) || nisnFormatted.includes(query) || String(s.nis).includes(query);
        return matchClass && matchQuery;
    });

    if (filtered.length === 0) {
        const msg = filterClass === 'TERPILIH' ? 'Belum ada siswa yang terpilih/terdaftar sebagai anggota kelompok ini.' : 'Siswa tidak ditemukan.';
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 25px; color: var(--text-muted);">${msg}</td></tr>`;
        return;
    }

    let html = '';
    filtered.forEach(s => {
        const nisnFormatted = formatNISN(s.nisn);
        const key = nisnFormatted || formatNISN(s.nis);
        const isChecked = selectedMemberNISNs.has(key);
        const rowBg = isChecked ? 'rgba(16, 185, 129, 0.08)' : 'transparent';
        const badgeStatus = isChecked ? 
            `<span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #10b981; font-weight: 700;"><i class="fa-solid fa-check"></i> Anggota</span>` : 
            `<span class="badge" style="background: rgba(148, 163, 184, 0.1); color: #94a3b8;">Bukan Anggota</span>`;

        html += `
            <tr style="border-bottom: 1px solid var(--card-border, #1e293b); background-color: ${rowBg}; transition: background 0.2s;">
                <td style="padding: 10px; text-align: center;">
                    <input type="checkbox" class="check-member-item" data-nisn="${nisnFormatted}" data-nis="${s.nis}" data-nama="${s.nama}" data-kelas="${s.kelas}" ${isChecked ? 'checked' : ''} onchange="toggleMemberSelection(this)" style="width: 17px; height: 17px; cursor: pointer;">
                </td>
                <td style="padding: 10px; font-weight: 600; font-family: monospace;">${nisnFormatted || s.nis || '-'}</td>
                <td style="padding: 10px; color: #f8fafc; font-weight: 600;">${s.nama}</td>
                <td style="padding: 10px; text-align: center;"><span class="badge" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8;">${s.kelas}</span></td>
                <td style="padding: 10px; text-align: center;">${badgeStatus}</td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;
}

function toggleMemberSelection(checkbox) {
    const nisn = checkbox.getAttribute('data-nisn');
    if (checkbox.checked) {
        selectedMemberNISNs.add(nisn);
    } else {
        selectedMemberNISNs.delete(nisn);
    }
    updateSelectedCountLabel();
    renderModalStudentList();
}

function updateSelectedCountLabel() {
    const lbl = document.getElementById('lblModalSelectedCount');
    if (lbl) lbl.textContent = selectedMemberNISNs.size;

    const selectClass = document.getElementById('selectModalFilterKelas');
    if (selectClass) {
        const optionTerpilih = selectClass.querySelector('option[value="TERPILIH"]');
        if (optionTerpilih) {
            optionTerpilih.textContent = `⭐ Hanya Anggota Terpilih (${selectedMemberNISNs.size})`;
        }
    }
}

async function saveKokurikulerMembers() {
    if (!activeKokurikulerIdForModal) return;

    const btnSave = document.getElementById('btnSaveKokurikulerMembers');
    const modal = document.getElementById('modalKokurikulerMembers');

    // Build array of selected members
    const membersList = [];
    masterStudentsCacheForKokurikuler.forEach(s => {
        const nisnFormatted = formatNISN(s.nisn);
        const key = nisnFormatted || formatNISN(s.nis);
        if (selectedMemberNISNs.has(key)) {
            membersList.push({
                nisn: nisnFormatted,
                nis: s.nis,
                nama: s.nama,
                kelas: s.kelas
            });
        }
    });

    const origText = btnSave.innerHTML;
    btnSave.disabled = true;
    btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';

    try {
        const payload = {
            action: 'save_kokurikuler_members',
            id_kokurikuler: activeKokurikulerIdForModal,
            members: membersList
        };

        const res = await fetchWithRetry(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (res && res.status === 'success') {
            showToast(res.message, 'success');
            modal.style.display = 'none';
            fetchKokurikulerData(true);
        } else {
            showToast(res ? res.message : 'Gagal memperbarui anggota.', 'error');
        }
    } catch (err) {
        showToast('Gagal: ' + (err.message || 'Error koneksi server.'), 'error');
    } finally {
        btnSave.disabled = false;
        btnSave.innerHTML = origText;
    }
}
