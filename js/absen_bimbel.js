// ==========================================
// MODUL PRESENSI BIMBINGAN TKA / UTBK
// ==========================================

let bimbelMapelList = [];
let bimbelGuruLogs = [];
let bimbelSiswaLogs = [];
let bimbelCurrentSiswaList = [];
let isBimbelSiswaEditMode = false;

function toggleBimbelSiswaEditMode() {
    isBimbelSiswaEditMode = !isBimbelSiswaEditMode;
    if (isBimbelSiswaEditMode) {
        showToast("✏️ Mode edit aktif: Anda dapat mengubah status presensi siswa.", "info");
    } else {
        showToast("🔒 Mode edit dibatalkan. Presensi dikunci.", "info");
    }
    loadSiswaListForAbsen();
}

// Inisialisasi Event Listener Modul Bimbel
document.addEventListener('DOMContentLoaded', () => {
    initBimbelTabs();
    initBimbelForms();
});

// --------------------------------------------------
// 1. INISIALISASI TABS
// --------------------------------------------------
function initBimbelTabs() {
    const panel = document.getElementById('panel-bimbel-utbk');
    if (!panel) return;

    const tabBtns = panel.querySelectorAll('.bimbel-tab-btn');
    const tabContents = panel.querySelectorAll('.tab-bimbel-content');

    const activeBtn = panel.querySelector('.bimbel-tab-btn.active') || tabBtns[0];
    const initialTargetId = activeBtn ? activeBtn.dataset.tab : 'tab-bimbel-guru';

    tabContents.forEach(c => {
        if (c.id === initialTargetId) {
            c.classList.add('active');
            c.style.display = 'block';
        } else {
            c.classList.remove('active');
            c.style.display = 'none';
        }
    });

    if (panel.dataset.bimbelTabsInit === 'true') return;
    panel.dataset.bimbelTabsInit = 'true';

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => {
                c.classList.remove('active');
                c.style.display = 'none';
            });

            btn.classList.add('active');

            const targetId = btn.dataset.tab;
            const targetContent = panel.querySelector('#' + targetId);
            if (targetContent) {
                targetContent.classList.add('active');
                targetContent.style.display = 'block';
            }

            // Auto-refresh dynamic filters when switching tabs
            if (targetId === 'tab-bimbel-siswa') {
                updateBimbelSiswaKelasDropdown();
            } else if (targetId === 'tab-bimbel-rekap') {
                populateRekapKelasDropdown();
            }
        });
    });
}

// --------------------------------------------------
// 2. MEMUAT DATA UTAMA BIMBEL (GURU, SISWA, MAPEL)
// --------------------------------------------------
async function loadBimbelData() {
    initBimbelTabs();

    const today = new Date().toISOString().split('T')[0];
    const inpTglGuru = document.getElementById('bimbelGuruTanggal');
    const inpTglSiswa = document.getElementById('bimbelSiswaTanggal');
    const inpBulanRekap = document.getElementById('rekapBimbelBulan');

    if (inpTglGuru && !inpTglGuru.value) inpTglGuru.value = today;
    if (inpTglSiswa && !inpTglSiswa.value) inpTglSiswa.value = today;
    if (inpBulanRekap && !inpBulanRekap.value) inpBulanRekap.value = today.substring(0, 7);

    // Populate logged in teacher info
    setupTeacherProfileInBimbel();

    // 0ms Optimistic UI from Local Storage Cache
    const cached = localStorage.getItem('smart_absen_bimbel_cache');
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            bimbelMapelList = parsed.bimbelMapelList || [];
            bimbelGuruLogs = parsed.guruLogs || [];
            bimbelSiswaLogs = parsed.siswaLogs || [];
            renderBimbelUI();
        } catch (e) {}
    }

    // Fetch fresh data from backend
    try {
        const res = await fetchWithRetry(`${SCRIPT_URL}?action=get_bimbel_data&_t=${Date.now()}`, { method: 'GET' }, 2, 500);
        if (res && res.status === 'success' && res.data) {
            bimbelMapelList = res.data.bimbelMapelList || [];
            bimbelGuruLogs = res.data.guruLogs || [];
            bimbelSiswaLogs = res.data.siswaLogs || [];

            localStorage.setItem('smart_absen_bimbel_cache', JSON.stringify(res.data));
            renderBimbelUI();
        }
    } catch (err) {
        console.warn("Failed fetching fresh bimbel data:", err);
    }
}

// Set Form Guru berdasarkan Sesi Login Pengguna
function setupTeacherProfileInBimbel() {
    const userSession = localStorage.getItem('smart_absen_user');
    if (!userSession) return;
    const user = JSON.parse(userSession);

    const inputNama = document.getElementById('bimbelGuruNama');
    if (inputNama) inputNama.value = user.nama || user.username || '';

    // Populate Mapel Guru
    populateGuruMapelDropdown(user);

    // Populate Kelas XII Dropdown
    populateKelasXiiDropdown();
}

function populateGuruMapelDropdown(user) {
    const selectMapel = document.getElementById('bimbelGuruMapel');
    if (!selectMapel) return;

    selectMapel.innerHTML = '';
    const userMapel = String(user.mapel || '').trim();

    // Get all mapel from cache or bimbelMapelList
    let availableMapel = [];
    if (bimbelMapelList.length > 0) {
        availableMapel = bimbelMapelList.map(m => m.nama);
    } else {
        // Fallback to local master mapel
        try {
            const masterMapel = JSON.parse(localStorage.getItem('smart_absen_mapel_list') || '[]');
            availableMapel = masterMapel.filter(m => {
                const b = String(m.bimbingan || '').toLowerCase();
                return b === 'ya' || b === 'true';
            }).map(m => m.nama);
        } catch (e) {}
    }

    if (availableMapel.length === 0) {
        if (userMapel) availableMapel = [userMapel];
        else availableMapel = ['Matematika (TKA)', 'Bahasa Indonesia (TKA)', 'Bahasa Inggris (TKA)', 'Penalaran Umum (UTBK)'];
    }

    // Filter to user's assigned mapel if teacher role, or show all for Admin/Kepsek
    const uRole = String(user.role || '').toLowerCase();
    let mapelToDisplay = availableMapel;
    if (uRole.includes('guru') && !uRole.includes('admin') && userMapel) {
        // Match userMapel
        const matched = availableMapel.filter(m => m.toLowerCase().includes(userMapel.toLowerCase()) || userMapel.toLowerCase().includes(m.toLowerCase()));
        if (matched.length > 0) mapelToDisplay = matched;
        else mapelToDisplay = [userMapel, ...availableMapel];
    }

    // Remove duplicates
    mapelToDisplay = [...new Set(mapelToDisplay)];

    mapelToDisplay.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        if (userMapel && m.toLowerCase().includes(userMapel.toLowerCase())) opt.selected = true;
        selectMapel.appendChild(opt);
    });
}

// Helper untuk mendapatkan seluruh daftar master siswa dari berbagai lokasi memori & localStorage
function getBimbelAllStudents() {
    if (Array.isArray(window.allStudents) && window.allStudents.length > 0) {
        return window.allStudents;
    }
    if (Array.isArray(window.localMasterStudents) && window.localMasterStudents.length > 0) {
        return window.localMasterStudents;
    }
    const storageKeys = [
        'smart_absen_master_students',
        'smart_absen_students',
        'smart_absen_students_cache'
    ];
    for (const key of storageKeys) {
        try {
            const raw = localStorage.getItem(key);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            }
        } catch (e) {}
    }
    return [];
}

// Helper pencocokan kelas yang fleksibel (misal: "XII-5", "XII 5", "XII IPA 5", "XII IPS 5")
function matchBimbelKelas(studentKelas, targetKelas) {
    const k1 = String(studentKelas || '').trim().toUpperCase();
    const k2 = String(targetKelas || '').trim().toUpperCase();
    if (!k1 || !k2) return false;

    // 1. Exact match
    if (k1 === k2) return true;

    // 2. Alphanumeric match (misal "XII-5" vs "XII 5" -> "XII5" === "XII5")
    const norm1 = k1.replace(/[^A-Z0-9]/g, '');
    const norm2 = k2.replace(/[^A-Z0-9]/g, '');
    if (norm1 === norm2) return true;

    // 3. Match berdasarkan angka kelas jika keduanya kelas XII / 12
    const isXii1 = k1.includes('XII') || k1.includes('12');
    const isXii2 = k2.includes('XII') || k2.includes('12');
    if (isXii1 && isXii2) {
        const num1 = k1.match(/\d+/g);
        const num2 = k2.match(/\d+/g);
        if (num1 && num2 && num1.join('') === num2.join('')) {
            return true;
        }
    }

    return false;
}

function populateKelasXiiDropdown() {
    const selectKelas = document.getElementById('bimbelGuruKelas');
    if (!selectKelas) return;

    selectKelas.innerHTML = '<option value="">-- Pilih Kelas XII --</option>';

    let kelasList = [];

    // Pull Grade XII classes directly from master student cache first for exact accuracy
    const allStudents = getBimbelAllStudents();
    if (allStudents.length > 0) {
        const setK = new Set();
        allStudents.forEach(s => {
            const k = String(s.kelas || s.rombel || s.Kelas || '').trim();
            if (k.toUpperCase().includes('XII') || k.includes('12')) {
                setK.add(k);
            }
        });
        kelasList = Array.from(setK);
    }

    try {
        const masterKelas = JSON.parse(localStorage.getItem('smart_absen_kelas_list') || '[]');
        masterKelas.forEach(k => {
            const nama = String(k.nama || k || '').trim();
            if (nama.toUpperCase().includes('XII') || nama.includes('12')) {
                if (!kelasList.includes(nama)) kelasList.push(nama);
            }
        });
    } catch(e) {}

    if (kelasList.length === 0) {
        kelasList = ['XII-1', 'XII-2', 'XII-3', 'XII-4', 'XII-5', 'XII IPA 1', 'XII IPA 2', 'XII IPS 1', 'XII IPS 2'];
    }

    kelasList.sort().forEach(k => {
        const opt = document.createElement('option');
        opt.value = k;
        opt.textContent = k;
        selectKelas.appendChild(opt);
    });
}

// --------------------------------------------------
// 3. RENDERING UI & JURNAL GURU
// --------------------------------------------------
function renderBimbelUI() {
    updateBimbelStatsOverview();
    renderLogGuruTable();
    updateBimbelSiswaKelasDropdown();
    populateRekapKelasDropdown();
}

function updateBimbelStatsOverview() {
    const statGuru = document.getElementById('statBimbelTotalGuru');
    const statSiswa = document.getElementById('statBimbelTotalSiswa');
    const statAvg = document.getElementById('statBimbelAvgHadir');
    const statKelas = document.getElementById('statBimbelTotalKelas');

    if (statGuru) statGuru.innerText = bimbelGuruLogs ? bimbelGuruLogs.length : 0;
    if (statSiswa) statSiswa.innerText = bimbelSiswaLogs ? bimbelSiswaLogs.length : 0;

    if (statAvg) {
        if (!bimbelSiswaLogs || bimbelSiswaLogs.length === 0) {
            statAvg.innerText = '0%';
        } else {
            const hadirCount = bimbelSiswaLogs.filter(s => String(s.status || '').toUpperCase() === 'HADIR').length;
            const pct = Math.round((hadirCount / bimbelSiswaLogs.length) * 100);
            statAvg.innerText = pct + '%';
        }
    }

    if (statKelas) {
        const uniqueKelas = new Set();
        const allStudents = getBimbelAllStudents();
        allStudents.forEach(s => {
            const k = s.kelas || s.rombel || s.Kelas;
            if (k && (k.toString().toUpperCase().includes('XII') || k.toString().includes('12'))) {
                uniqueKelas.add(k.toString().trim());
            }
        });
        statKelas.innerText = uniqueKelas.size || 0;
    }
}

function renderLogGuruTable(filterQuery = '') {
    const tbody = document.getElementById('tbodyLogBimbelGuru');
    if (!tbody) return;

    if (bimbelGuruLogs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 25px;">Belum ada data riwayat jurnal bimbingan TKA/UTBK.</td></tr>`;
        return;
    }

    const q = (filterQuery || '').toLowerCase().trim();

    // Sort descending by date
    let sorted = [...bimbelGuruLogs].sort((a, b) => new Date(b.tanggal || 0) - new Date(a.tanggal || 0));

    if (q) {
        sorted = sorted.filter(g => 
            (g.nama || '').toLowerCase().includes(q) ||
            (g.username || '').toLowerCase().includes(q) ||
            (g.mapel || '').toLowerCase().includes(q) ||
            (g.kelas || '').toLowerCase().includes(q) ||
            (g.materi_ajar || '').toLowerCase().includes(q) ||
            (g.tanggal || '').toLowerCase().includes(q) ||
            (g.sesi || '').toLowerCase().includes(q)
        );
    }

    if (sorted.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 25px;">Tidak ada jurnal guru yang cocok dengan "<strong>${filterQuery}</strong>".</td></tr>`;
        return;
    }

    tbody.innerHTML = sorted.map((g, idx) => `
        <tr>
            <td style="text-align: center;">${idx + 1}</td>
            <td><strong>${g.tanggal || '-'}</strong></td>
            <td><span class="badge" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);">${g.sesi || 'Sesi 1'}</span></td>
            <td>${g.nama || g.username || '-'}</td>
            <td><span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3);">${g.mapel || '-'}</span></td>
            <td style="text-align: center;"><strong>${g.kelas || '-'}</strong></td>
            <td style="max-width: 250px; white-space: normal; font-size: 0.82rem; color: #cbd5e1;">${g.materi_ajar || '-'}</td>
            <td style="text-align: center;">
                <button type="button" class="btn-danger" style="padding: 4px 10px; font-size: 0.78rem; border-radius: 6px;" onclick="deleteBimbelGuruLog('${g.id}')" title="Hapus Jurnal">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// --------------------------------------------------
// 4. KONTROL INTERAKSI & FORM GURU
// --------------------------------------------------
function initBimbelForms() {
    const panel = document.getElementById('panel-bimbel-utbk');
    if (!panel) return;
    if (panel.dataset.bimbelFormsInit === 'true') return;
    panel.dataset.bimbelFormsInit = 'true';

    // Refresh Button
    const btnRefresh = document.getElementById('btnRefreshBimbel');
    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            showToast("🔄 Memperbarui data bimbingan...", "info");
            loadBimbelData();
        });
    }

    // Search Input in Teacher Log Table
    const searchGuru = document.getElementById('searchBimbelGuruLog');
    if (searchGuru) {
        searchGuru.addEventListener('input', (e) => renderLogGuruTable(e.target.value));
    }

    // Form Submit Presensi Guru
    const formGuru = document.getElementById('formAbsenGuruBimbel');
    if (formGuru) {
        formGuru.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveBimbelGuru();
        });
    }

    // Dynamic Filter Change on Absen Siswa Tab
    const inpTglSiswa = document.getElementById('bimbelSiswaTanggal');
    const selectKelasSiswa = document.getElementById('bimbelSiswaKelas');

    if (inpTglSiswa) {
        inpTglSiswa.addEventListener('change', () => {
            isBimbelSiswaEditMode = false;
            updateBimbelSiswaKelasDropdown();
        });
    }
    if (selectKelasSiswa) {
        selectKelasSiswa.addEventListener('change', () => {
            isBimbelSiswaEditMode = false;
            const selectedOpt = selectKelasSiswa.options[selectKelasSiswa.selectedIndex];
            const inpSesiSiswa = document.getElementById('bimbelSiswaSesi');
            const wrapper = document.getElementById('wrapperAbsenSiswaBimbel');

            if (!selectKelasSiswa.value) {
                if (inpSesiSiswa) inpSesiSiswa.value = '';
                if (wrapper) wrapper.style.display = 'none';
                return;
            }

            if (selectedOpt && selectedOpt.dataset.sesi && inpSesiSiswa) {
                inpSesiSiswa.value = selectedOpt.dataset.sesi;
            }

            loadSiswaListForAbsen();
        });
    }

    // Search Input in Student Attendance Table
    const searchSiswa = document.getElementById('searchBimbelSiswaInTable');
    if (searchSiswa) {
        searchSiswa.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase().trim();
            const tbody = document.getElementById('tbodyAbsenSiswaBimbel');
            if (!tbody) return;
            const rows = tbody.querySelectorAll('tr');
            rows.forEach(r => {
                const text = r.innerText.toLowerCase();
                r.style.display = text.includes(q) ? '' : 'none';
            });
            updateBimbelLiveCounters();
        });
    }

    // Toggle Edit Mode Listener
    const btnToggleEdit = document.getElementById('btnToggleEditBimbelSiswa');
    if (btnToggleEdit) {
        btnToggleEdit.addEventListener('click', toggleBimbelSiswaEditMode);
    }

    // Button Set All HADIR
    const btnSetHadir = document.getElementById('btnSetAllBimbelHadir');
    if (btnSetHadir) {
        btnSetHadir.addEventListener('click', setAllBimbelStudentsHadir);
    }

    // Button Set All ALPA
    const btnSetAlpa = document.getElementById('btnSetAllBimbelAlpa');
    if (btnSetAlpa) {
        btnSetAlpa.addEventListener('click', setAllBimbelStudentsAlpa);
    }

    // Search Input in Rekap Table
    const searchRekap = document.getElementById('searchBimbelRekapTable');
    if (searchRekap) {
        searchRekap.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase().trim();
            const tbody = document.getElementById('tbodyRekapBimbel');
            if (!tbody) return;
            const rows = tbody.querySelectorAll('tr');
            rows.forEach(r => {
                const text = r.innerText.toLowerCase();
                r.style.display = text.includes(q) ? '' : 'none';
            });
        });
    }

    // Form Submit Absen Siswa
    const btnSimpanSiswa = document.getElementById('btnSimpanAbsenSiswaBimbel');
    if (btnSimpanSiswa) {
        btnSimpanSiswa.addEventListener('click', saveBimbelSiswa);
    }

    // Rekap Button Listener
    const btnRekap = document.getElementById('btnProsesRekapBimbel');
    if (btnRekap) {
        btnRekap.addEventListener('click', generateBimbelRekap);
    }

    // Export CSV Listener
    const btnExport = document.getElementById('btnExportRekapBimbelCsv');
    if (btnExport) {
        btnExport.addEventListener('click', exportBimbelRekapCsv);
    }

    // PDF Print Listeners
    const btnPrintPdfSiswa = document.getElementById('btnCetakAbsenSiswaBimbelPdf');
    if (btnPrintPdfSiswa) {
        btnPrintPdfSiswa.addEventListener('click', printBimbelSiswaPdf);
    }

    const btnPrintPdfRekap = document.getElementById('btnCetakRekapBimbelPdf');
    if (btnPrintPdfRekap) {
        btnPrintPdfRekap.addEventListener('click', printBimbelRekapPdf);
    }
}


async function saveBimbelGuru() {
    const userSession = localStorage.getItem('smart_absen_user');
    if (!userSession) return showToast("❌ Anda belum login.", "error");
    const user = JSON.parse(userSession);

    const tgl = document.getElementById('bimbelGuruTanggal').value;
    const nama = document.getElementById('bimbelGuruNama').value;
    const mapel = document.getElementById('bimbelGuruMapel').value;
    const sesi = document.getElementById('bimbelGuruSesi').value;
    const kelas = document.getElementById('bimbelGuruKelas').value;
    const materi = document.getElementById('bimbelGuruMateri').value;

    if (!tgl || !mapel || !sesi || !kelas || !materi) {
        return showToast("⚠️ Harap lengkapi semua bidang form jurnal guru!", "warning");
    }

    const payload = {
        id: 'BG-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        tanggal: tgl,
        username: user.username || '',
        nama: nama,
        mapel: mapel,
        sesi: sesi,
        kelas: kelas,
        materi_ajar: materi
    };

    const btn = document.getElementById('btnSimpanBimbelGuru');
    const oldText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...`;

    try {
        // Optimistic UI Update locally
        const existingIdx = bimbelGuruLogs.findIndex(g => g.tanggal === tgl && g.sesi === sesi && matchBimbelKelas(g.kelas, kelas));
        if (existingIdx >= 0) bimbelGuruLogs[existingIdx] = payload;
        else bimbelGuruLogs.unshift(payload);

        localStorage.setItem('smart_absen_bimbel_cache', JSON.stringify({
            bimbelMapelList,
            guruLogs: bimbelGuruLogs,
            siswaLogs: bimbelSiswaLogs
        }));

        renderBimbelUI();
        showToast("✅ Jurnal & Absensi Guru Bimbingan berhasil disimpan!", "success");
        document.getElementById('bimbelGuruMateri').value = '';

        const formData = new URLSearchParams();
        formData.append('action', 'save_bimbel_guru');
        formData.append('data', JSON.stringify([payload]));

        // Switch to Absen Siswa tab automatically for convenience
        const btnTabSiswa = document.querySelector('#panel-bimbel-utbk .bimbel-tab-btn[data-tab="tab-bimbel-siswa"]');
        if (btnTabSiswa) {
            btnTabSiswa.click();
            const inpTglS = document.getElementById('bimbelSiswaTanggal');
            if (inpTglS) inpTglS.value = tgl;
            
            updateBimbelSiswaKelasDropdown();

            const selectK = document.getElementById('bimbelSiswaKelas');
            if (selectK) {
                for (let i = 0; i < selectK.options.length; i++) {
                    const opt = selectK.options[i];
                    if (matchBimbelKelas(opt.value, kelas) && opt.dataset.sesi === sesi) {
                        selectK.selectedIndex = i;
                        const inpSesiS = document.getElementById('bimbelSiswaSesi');
                        if (inpSesiS) inpSesiS.value = sesi;
                        break;
                    }
                }
            }
            loadSiswaListForAbsen();
        }

        await fetchWithRetry(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        }, 0);
    } catch (err) {
        console.warn("Background sync error (saved locally):", err);
    } finally {
        btn.disabled = false;
        btn.innerHTML = oldText;
    }
}

async function deleteBimbelGuruLog(id) {
    const targetGuruLog = bimbelGuruLogs.find(g => String(g.id) === String(id));

    const confirmed = await showCustomConfirm({
        title: 'Hapus Catatan Bimbingan',
        message: 'Apakah Anda yakin ingin menghapus catatan bimbingan guru ini? SELURUH data presensi siswa pada bimbingan kelas dan sesi ini akan ikut terhapus.',
        icon: 'danger',
        confirmText: 'Ya, Hapus',
        cancelText: 'Batal',
        danger: true
    });
    if (!confirmed) return;

    if (targetGuruLog) {
        const tgl = targetGuruLog.tanggal;
        const sesi = targetGuruLog.sesi;
        const kelas = targetGuruLog.kelas;

        // Cascade delete student logs for this session date, sesi, and class
        bimbelSiswaLogs = bimbelSiswaLogs.filter(s => !(s.tanggal === tgl && s.sesi === sesi && matchBimbelKelas(s.kelas, kelas)));
    }

    bimbelGuruLogs = bimbelGuruLogs.filter(g => String(g.id) !== String(id));

    localStorage.setItem('smart_absen_bimbel_cache', JSON.stringify({
        bimbelMapelList,
        guruLogs: bimbelGuruLogs,
        siswaLogs: bimbelSiswaLogs
    }));

    renderBimbelUI();

    try {
        const formData = new URLSearchParams();
        formData.append('action', 'delete_bimbel_guru');
        formData.append('id', id);

        await fetchWithRetry(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });
        showToast("🗑️ Catatan jurnal bimbingan & log presensi siswa terkait berhasil dihapus.", "info");
    } catch (e) {}
}

// --------------------------------------------------
// 5. ABSENSI SISWA (SYARAT: KELAS HARUS SUDAH DI-ABSEN GURU)
// --------------------------------------------------
function updateBimbelSiswaKelasDropdown() {
    const selectKelas = document.getElementById('bimbelSiswaKelas');
    const inpSesi = document.getElementById('bimbelSiswaSesi');
    const alertBox = document.getElementById('alertBimbelGuruRequired');
    const wrapper = document.getElementById('wrapperAbsenSiswaBimbel');
    if (!selectKelas) return;

    const tgl = document.getElementById('bimbelSiswaTanggal').value;

    selectKelas.innerHTML = '';
    if (wrapper) wrapper.style.display = 'none';

    if (!tgl) {
        selectKelas.innerHTML = `<option value="">-- Pilih Tanggal Terlebih Dahulu --</option>`;
        if (inpSesi) inpSesi.value = '';
        if (alertBox) alertBox.style.display = 'none';
        return;
    }

    // Filter Teacher Logs on specified date (all sessions)
    const validGuruLogs = bimbelGuruLogs.filter(g => g.tanggal === tgl);

    if (validGuruLogs.length === 0) {
        selectKelas.innerHTML = `<option value="">-- Belum Ada Kelas yang Di-Absen Guru --</option>`;
        if (inpSesi) inpSesi.value = '';
        if (alertBox) alertBox.style.display = 'block';
    } else {
        if (alertBox) alertBox.style.display = 'none';
        selectKelas.innerHTML = `<option value="">-- Pilih Kelas & Sesi (${validGuruLogs.length} Terdaftar) --</option>`;
        if (inpSesi) inpSesi.value = '';

        validGuruLogs.forEach(g => {
            const opt = document.createElement('option');
            opt.value = g.kelas;
            opt.dataset.sesi = g.sesi;
            opt.dataset.guru = g.nama;
            opt.dataset.mapel = g.mapel;
            opt.textContent = `${g.kelas} - ${g.sesi || 'Sesi 1'} (Guru: ${g.nama} - ${g.mapel})`;
            selectKelas.appendChild(opt);
        });
    }
}

function loadSiswaListForAbsen() {
    const tgl = document.getElementById('bimbelSiswaTanggal').value;
    const sesi = document.getElementById('bimbelSiswaSesi').value;
    const kelas = document.getElementById('bimbelSiswaKelas').value;
    const wrapper = document.getElementById('wrapperAbsenSiswaBimbel');

    if (!tgl || !sesi || !kelas) {
        if (wrapper) wrapper.style.display = 'none';
        return;
    }

    // Find teacher info for this session
    const teacherLog = bimbelGuruLogs.find(g => g.tanggal === tgl && g.sesi === sesi && matchBimbelKelas(g.kelas, kelas));
    if (!teacherLog) {
        return showToast("⚠️ Tidak ada data guru mengajar di kelas ini pada tanggal & sesi tersebut. Guru wajib absen terlebih dahulu!", "warning");
    }

    // Pull students belonging to selected Grade XII class from memory / localStorage
    const allStudents = getBimbelAllStudents();
    const filteredStudents = allStudents.filter(s => matchBimbelKelas(s.kelas || s.rombel || s.Kelas, kelas));

    if (filteredStudents.length === 0) {
        showToast(`⚠️ Data siswa untuk kelas ${kelas} belum ada atau belum disinkronkan.`, "warning");
    }

    bimbelCurrentSiswaList = filteredStudents;

    // Render Student Absen Table
    const tbody = document.getElementById('tbodyAbsenSiswaBimbel');
    const title = document.getElementById('titleAbsenSiswaBimbel');
    const subtitle = document.getElementById('subtitleAbsenSiswaBimbel');

    if (wrapper) wrapper.style.display = 'block';
    if (title) title.innerText = `Presensi Siswa Bimbingan TKA/UTBK - Kelas ${kelas}`;
    if (subtitle) subtitle.innerText = `Pelajaran: ${teacherLog.mapel} | Guru Mengajar: ${teacherLog.nama} | ${sesi} (${tgl})`;

    // Check if existing student logs exist for this date, session, class
    const existingLogs = bimbelSiswaLogs.filter(s => s.tanggal === tgl && s.sesi === sesi && matchBimbelKelas(s.kelas, kelas));
    const logMap = {};
    existingLogs.forEach(l => {
        logMap[l.nisn || l.nis || l.nama] = l;
    });

    const isAlreadySaved = existingLogs.length > 0;
    const isLocked = isAlreadySaved && !isBimbelSiswaEditMode;

    const banner = document.getElementById('bannerBimbelSiswaLocked');
    const txtBanner = document.getElementById('txtBimbelSiswaLocked');
    const btnToggleEdit = document.getElementById('btnToggleEditBimbelSiswa');
    const btnSimpan = document.getElementById('btnSimpanAbsenSiswaBimbel');
    const btnSetHadir = document.getElementById('btnSetAllBimbelHadir');

    if (isAlreadySaved) {
        if (banner) banner.style.display = 'flex';
        if (isLocked) {
            if (banner) {
                banner.style.background = 'rgba(34, 197, 94, 0.12)';
                banner.style.borderColor = 'rgba(34, 197, 94, 0.3)';
                banner.style.color = '#4ade80';
            }
            if (txtBanner) txtBanner.innerHTML = `Presensi siswa kelas <strong>${kelas}</strong> (${sesi}) tanggal <strong>${tgl}</strong> telah tersimpan dan dikunci.`;
            if (btnToggleEdit) btnToggleEdit.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Edit Data Presensi`;
            if (btnSimpan) {
                btnSimpan.disabled = true;
                btnSimpan.style.opacity = '0.6';
                btnSimpan.style.cursor = 'not-allowed';
                btnSimpan.innerHTML = `<i class="fa-solid fa-lock"></i> Absensi Tanggal Ini Sudah Tersimpan`;
            }
            if (btnSetHadir) {
                btnSetHadir.disabled = true;
                btnSetHadir.style.opacity = '0.5';
                btnSetHadir.style.cursor = 'not-allowed';
            }
        } else {
            if (banner) {
                banner.style.background = 'rgba(234, 179, 8, 0.15)';
                banner.style.borderColor = 'rgba(234, 179, 8, 0.4)';
                banner.style.color = '#fbbf24';
            }
            if (txtBanner) txtBanner.innerHTML = `<strong>Mode Edit Aktif:</strong> Silakan sesuaikan status presensi siswa lalu simpan.`;
            if (btnToggleEdit) btnToggleEdit.innerHTML = `<i class="fa-solid fa-xmark"></i> Batal Edit`;
            if (btnSimpan) {
                btnSimpan.disabled = false;
                btnSimpan.style.opacity = '1';
                btnSimpan.style.cursor = 'pointer';
                btnSimpan.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Update / Simpan Perubahan Presensi`;
            }
            if (btnSetHadir) {
                btnSetHadir.disabled = false;
                btnSetHadir.style.opacity = '1';
                btnSetHadir.style.cursor = 'pointer';
            }
        }
    } else {
        if (banner) banner.style.display = 'none';
        if (btnSimpan) {
            btnSimpan.disabled = false;
            btnSimpan.style.opacity = '1';
            btnSimpan.style.cursor = 'pointer';
            btnSimpan.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Simpan Presensi Siswa Bimbingan`;
        }
        if (btnSetHadir) {
            btnSetHadir.disabled = false;
            btnSetHadir.style.opacity = '1';
            btnSetHadir.style.cursor = 'pointer';
        }
    }

    if (filteredStudents.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 25px;">Tidak ada siswa terdaftar di kelas ${kelas}.</td></tr>`;
        return;
    }

    tbody.innerHTML = filteredStudents.map((s, idx) => {
        const key = s.nisn || s.nis || s.nama;
        const prevStatus = logMap[key] ? logMap[key].status : 'HADIR';
        const prevKet = logMap[key] ? logMap[key].keterangan || '' : '';
        const disAttr = isLocked ? 'disabled' : '';

        const getRadioItem = (val, color, bg) => {
            const checked = prevStatus === val;
            const styleBg = checked ? bg : 'transparent';
            const styleColor = checked ? color : 'var(--text-muted)';
            const opacity = isLocked && !checked ? '0.4' : '1';
            const cursor = isLocked ? 'not-allowed' : 'pointer';

            return `
                <label style="cursor: ${cursor}; opacity: ${opacity}; padding: 4px 8px; border-radius: 6px; border: 1px solid ${color}40; background: ${styleBg}; color: ${styleColor}; font-size: 0.78rem; font-weight: 600;">
                    <input type="radio" name="st_bimbel_${idx}" value="${val}" ${checked ? 'checked' : ''} ${disAttr} style="display:none;" onchange="updateBimbelStatusStyle(this)"> ${val}
                </label>
            `;
        };

        return `
            <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td><span style="font-family: monospace; color: #94a3b8;">${s.nisn || '-'}</span></td>
                <td><span style="font-family: monospace; color: #94a3b8;">${s.nis || '-'}</span></td>
                <td><strong>${s.nama || '-'}</strong></td>
                <td style="text-align: center;"><span class="badge">${s.gender || 'L'}</span></td>
                <td style="text-align: center;">
                    <div style="display: flex; gap: 6px; justify-content: center;" class="bimbel-status-radio-group" data-nisn="${s.nisn || ''}" data-nis="${s.nis || ''}" data-nama="${s.nama || ''}">
                        ${getRadioItem('HADIR', '#4ade80', 'rgba(74, 222, 128, 0.25)')}
                        ${getRadioItem('SAKIT', '#fbbf24', 'rgba(251, 191, 36, 0.25)')}
                        ${getRadioItem('IZIN', '#38bdf8', 'rgba(56, 189, 248, 0.25)')}
                        ${getRadioItem('ALPA', '#f87171', 'rgba(248, 113, 113, 0.25)')}
                    </div>
                </td>
                <td>
                    <input type="text" class="form-input bimbel-ket-input" value="${prevKet}" ${disAttr} placeholder="Keterangan..." style="width: 100%; padding: 4px 8px; font-size: 0.8rem; ${isLocked ? 'background: rgba(255,255,255,0.02); cursor: not-allowed;' : ''}">
                </td>
            </tr>
        `;
    }).join('');

    updateBimbelLiveCounters();
}

function updateBimbelLiveCounters() {
    const tbody = document.getElementById('tbodyAbsenSiswaBimbel');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr');
    let total = 0;
    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alpa = 0;

    rows.forEach(r => {
        if (r.style.display === 'none') return;
        const checkedRadio = r.querySelector('input[type="radio"]:checked');
        if (checkedRadio) {
            total++;
            const v = checkedRadio.value;
            if (v === 'HADIR') hadir++;
            else if (v === 'SAKIT') sakit++;
            else if (v === 'IZIN') izin++;
            else if (v === 'ALPA') alpa++;
        }
    });

    const elTotal = document.getElementById('cntBimbelTotal');
    const elHadir = document.getElementById('cntBimbelHadir');
    const elSakit = document.getElementById('cntBimbelSakit');
    const elIzin = document.getElementById('cntBimbelIzin');
    const elAlpa = document.getElementById('cntBimbelAlpa');

    if (elTotal) elTotal.innerText = total;
    if (elHadir) elHadir.innerText = hadir;
    if (elSakit) elSakit.innerText = sakit;
    if (elIzin) elIzin.innerText = izin;
    if (elAlpa) elAlpa.innerText = alpa;
}

function updateBimbelStatusStyle(radioElem) {
    const parentGroup = radioElem.closest('.bimbel-status-radio-group');
    if (!parentGroup) return;

    const labels = parentGroup.querySelectorAll('label');
    labels.forEach(lbl => {
        const radio = lbl.querySelector('input');
        if (radio && radio.checked) {
            const val = radio.value;
            if (val === 'HADIR') { lbl.style.background = 'rgba(74, 222, 128, 0.25)'; lbl.style.color = '#4ade80'; }
            else if (val === 'SAKIT') { lbl.style.background = 'rgba(251, 191, 36, 0.25)'; lbl.style.color = '#fbbf24'; }
            else if (val === 'IZIN') { lbl.style.background = 'rgba(56, 189, 248, 0.25)'; lbl.style.color = '#38bdf8'; }
            else if (val === 'ALPA') { lbl.style.background = 'rgba(248, 113, 113, 0.25)'; lbl.style.color = '#f87171'; }
        } else {
            lbl.style.background = 'transparent';
            lbl.style.color = 'var(--text-muted)';
        }
    });

    updateBimbelLiveCounters();
}

function setAllBimbelStudentsHadir() {
    const tbody = document.getElementById('tbodyAbsenSiswaBimbel');
    if (!tbody) return;

    const radios = tbody.querySelectorAll('input[type="radio"][value="HADIR"]');
    radios.forEach(r => {
        r.checked = true;
        updateBimbelStatusStyle(r);
    });
    updateBimbelLiveCounters();
    showToast("✅ Semua siswa diset HADIR", "info");
}

function setAllBimbelStudentsAlpa() {
    const tbody = document.getElementById('tbodyAbsenSiswaBimbel');
    if (!tbody) return;

    const radios = tbody.querySelectorAll('input[type="radio"][value="ALPA"]');
    radios.forEach(r => {
        r.checked = true;
        updateBimbelStatusStyle(r);
    });
    updateBimbelLiveCounters();
    showToast("⚠️ Semua siswa diset ALPA", "warning");
}


async function saveBimbelSiswa() {
    const tgl = document.getElementById('bimbelSiswaTanggal').value;
    const sesi = document.getElementById('bimbelSiswaSesi').value;
    const kelas = document.getElementById('bimbelSiswaKelas').value;

    if (!tgl || !sesi || !kelas) {
        return showToast("⚠️ Harap pilih Tanggal, Sesi, dan Kelas terlebih dahulu!", "warning");
    }

    const teacherLog = bimbelGuruLogs.find(g => g.tanggal === tgl && g.sesi === sesi && matchBimbelKelas(g.kelas, kelas));
    if (!teacherLog) {
        return showToast("⚠️ Tidak ditemukan data presensi guru untuk kelas ini!", "error");
    }

    const tbody = document.getElementById('tbodyAbsenSiswaBimbel');
    const rows = tbody.querySelectorAll('tr');
    if (rows.length === 0 || bimbelCurrentSiswaList.length === 0) {
        return showToast("⚠️ Tidak ada data siswa untuk disimpan.", "warning");
    }

    const payloadList = [];
    rows.forEach(row => {
        const group = row.querySelector('.bimbel-status-radio-group');
        const ketInp = row.querySelector('.bimbel-ket-input');
        if (!group) return;

        const nisn = group.dataset.nisn || '';
        const nis = group.dataset.nis || '';
        const nama = group.dataset.nama || '';
        const selectedRadio = group.querySelector('input[type="radio"]:checked');
        const status = selectedRadio ? selectedRadio.value : 'HADIR';
        const ket = ketInp ? ketInp.value.trim() : '';

        payloadList.push({
            id: 'BS-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
            tanggal: tgl,
            sesi: sesi,
            kelas: kelas,
            mapel: teacherLog.mapel || '',
            guru: teacherLog.nama || '',
            nisn: nisn,
            nis: nis,
            nama: nama,
            status: status,
            keterangan: ket
        });
    });

    if (payloadList.length === 0) return;

    const btn = document.getElementById('btnSimpanAbsenSiswaBimbel');
    const oldText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan Presensi Siswa...`;

    // 1. Simpan ke Cache Lokal (Instan 0ms)
    bimbelSiswaLogs = bimbelSiswaLogs.filter(s => !(s.tanggal === tgl && s.sesi === sesi && matchBimbelKelas(s.kelas, kelas)));
    bimbelSiswaLogs.push(...payloadList);

    localStorage.setItem('smart_absen_bimbel_cache', JSON.stringify({
        bimbelMapelList,
        guruLogs: bimbelGuruLogs,
        siswaLogs: bimbelSiswaLogs
    }));

    showToast(`✅ Presensi bimbingan ${payloadList.length} siswa (${kelas} - ${sesi}) berhasil disimpan!`, "success");

    // Instantly lock attendance table UI to prevent duplicate entries
    isBimbelSiswaEditMode = false;
    loadSiswaListForAbsen();

    // 2. Kirim ke Server Google Sheets secara cepat (Retries = 0 agar instan dan tidak hang)
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'save_bimbel_siswa');
        formData.append('data', JSON.stringify(payloadList));

        await fetchWithRetry(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        }, 0);
    } catch (err) {
        console.warn("Koneksi server tersendat, data tersimpan aman di lokal cache:", err);
    } finally {
        btn.disabled = false;
        btn.innerHTML = oldText;
    }
}

// --------------------------------------------------
// 6. REKAPITULASI BULANAN
// --------------------------------------------------
function populateRekapKelasDropdown() {
    const select = document.getElementById('rekapBimbelKelas');
    if (!select) return;

    select.innerHTML = '<option value="">Semua Kelas XII</option>';

    let kelasList = [];

    const allStudents = getBimbelAllStudents();
    if (allStudents.length > 0) {
        const setK = new Set();
        allStudents.forEach(s => {
            const k = String(s.kelas || s.rombel || s.Kelas || '').trim();
            if (k.toUpperCase().includes('XII') || k.includes('12')) {
                setK.add(k);
            }
        });
        kelasList = Array.from(setK);
    }

    try {
        const masterKelas = JSON.parse(localStorage.getItem('smart_absen_kelas_list') || '[]');
        masterKelas.forEach(k => {
            const nama = String(k.nama || k || '').trim();
            if (nama.toUpperCase().includes('XII') || nama.includes('12')) {
                if (!kelasList.includes(nama)) kelasList.push(nama);
            }
        });
    } catch(e) {}

    if (kelasList.length === 0) kelasList = ['XII-1', 'XII-2', 'XII-3', 'XII-4', 'XII-5', 'XII IPA 1', 'XII IPA 2', 'XII IPS 1', 'XII IPS 2'];

    kelasList.sort().forEach(k => {
        const opt = document.createElement('option');
        opt.value = k;
        opt.textContent = k;
        select.appendChild(opt);
    });
}

function generateBimbelRekap() {
    const bulan = document.getElementById('rekapBimbelBulan').value; // YYYY-MM
    const kelas = document.getElementById('rekapBimbelKelas').value;
    const tbody = document.getElementById('tbodyRekapBimbel');
    const title = document.getElementById('titleRekapBimbel');

    if (!bulan) return showToast("⚠️ Pilih bulan rekapitulasi terlebih dahulu!", "warning");

    if (title) title.innerText = `Rekapitulasi Kehadiran Siswa Bimbingan TKA/UTBK (${bulan}${kelas ? ' - ' + kelas : ''})`;

    // Filter student logs matching selected month and class
    const logsInMonth = bimbelSiswaLogs.filter(s => {
        if (!s.tanggal) return false;
        const matchMonth = s.tanggal.startsWith(bulan);
        const matchKelas = !kelas || matchBimbelKelas(s.kelas, kelas);
        return matchMonth && matchKelas;
    });

    // Group logs by Student (NISN / NIS / Nama)
    const studentStats = {};

    // Get list of all students for complete roster
    const allStudents = getBimbelAllStudents();

    const targetStudents = allStudents.filter(s => {
        const k = String(s.kelas || s.rombel || s.Kelas || '').trim();
        const isXii = k.toUpperCase().includes('XII') || k.includes('12');
        const matchKelas = !kelas || matchBimbelKelas(k, kelas);
        return isXii && matchKelas;
    });

    targetStudents.forEach(s => {
        const key = (s.nisn || s.nis || s.nama).trim();
        studentStats[key] = {
            nisn: s.nisn || '-',
            nis: s.nis || '-',
            nama: s.nama || '-',
            kelas: s.kelas || '-',
            hadir: 0,
            sakit: 0,
            izin: 0,
            alpa: 0,
            total: 0
        };
    });

    logsInMonth.forEach(l => {
        const key = (l.nisn || l.nis || l.nama).trim();
        if (!studentStats[key]) {
            studentStats[key] = {
                nisn: l.nisn || '-',
                nis: l.nis || '-',
                nama: l.nama || '-',
                kelas: l.kelas || '-',
                hadir: 0,
                sakit: 0,
                izin: 0,
                alpa: 0,
                total: 0
            };
        }

        const st = String(l.status || 'HADIR').toUpperCase();
        if (st === 'HADIR') studentStats[key].hadir++;
        else if (st === 'SAKIT') studentStats[key].sakit++;
        else if (st === 'IZIN') studentStats[key].izin++;
        else if (st === 'ALPA') studentStats[key].alpa++;

        studentStats[key].total++;
    });

    const statList = Object.values(studentStats);

    if (statList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--text-muted); padding: 30px;">Tidak ada data presensi bimbingan untuk periode ini.</td></tr>`;
        return;
    }

    statList.sort((a, b) => a.nama.localeCompare(b.nama));

    tbody.innerHTML = statList.map((s, idx) => {
        const pct = s.total > 0 ? Math.round((s.hadir / s.total) * 100) : 0;
        let pctBadgeColor = '#4ade80';
        if (pct < 75) pctBadgeColor = '#f87171';
        else if (pct < 90) pctBadgeColor = '#fbbf24';

        return `
            <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td><span style="font-family: monospace; color: #94a3b8;">${s.nisn}</span></td>
                <td><strong>${s.nama}</strong></td>
                <td style="text-align: center;">${s.kelas}</td>
                <td style="text-align: center; font-weight: 700; color: #4ade80;">${s.hadir}</td>
                <td style="text-align: center; font-weight: 700; color: #fbbf24;">${s.sakit}</td>
                <td style="text-align: center; font-weight: 700; color: #38bdf8;">${s.izin}</td>
                <td style="text-align: center; font-weight: 700; color: #f87171;">${s.alpa}</td>
                <td style="text-align: center; font-weight: 700;">${s.total}</td>
                <td style="text-align: center;">
                    <span class="badge" style="background: rgba(255,255,255,0.05); color: ${pctBadgeColor}; border: 1px solid ${pctBadgeColor}; font-weight: 800;">
                        ${pct}%
                    </span>
                </td>
            </tr>
        `;
    }).join('');

    showToast(`📊 Rekap bimbingan untuk ${statList.length} siswa berhasil ditampilkan!`, "success");
}

function exportBimbelRekapCsv() {
    const bulan = document.getElementById('rekapBimbelBulan').value;
    const kelas = document.getElementById('rekapBimbelKelas').value;
    const tbody = document.getElementById('tbodyRekapBimbel');
    const rows = tbody.querySelectorAll('tr');

    if (rows.length === 0 || rows[0].cells.length < 5) {
        return showToast("⚠️ Tidak ada data rekap untuk di-export.", "warning");
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "No,NISN,Nama Siswa,Kelas,Hadir,Sakit,Izin,Alpa,Total Pertemuan,Persentase Kehadiran\n";

    rows.forEach(row => {
        const cols = row.querySelectorAll('td');
        if (cols.length >= 10) {
            const line = [
                `"${cols[0].innerText.trim()}"`,
                `"${cols[1].innerText.trim()}"`,
                `"${cols[2].innerText.trim()}"`,
                `"${cols[3].innerText.trim()}"`,
                `"${cols[4].innerText.trim()}"`,
                `"${cols[5].innerText.trim()}"`,
                `"${cols[6].innerText.trim()}"`,
                `"${cols[7].innerText.trim()}"`,
                `"${cols[8].innerText.trim()}"`,
                `"${cols[9].innerText.trim()}"`
            ].join(",");
            csvContent += line + "\n";
        }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Bimbingan_TKA_UTBK_${bulan}_${kelas || 'Semua_Kelas'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("📥 File CSV Rekap Bimbingan berhasil di-download!", "success");
}

// --------------------------------------------------
// 7. FUNGSI CETAK PDF (PRESENSI HARIAN & REKAP BULANAN)
// --------------------------------------------------

// Helper untuk mengambil metadata nama sekolah & kepsek dari localStorage
function getBimbelPrintSchoolMeta() {
    let namaSekolah = 'SMA BARUNAWATI';
    let alamatSekolah = 'Jl. Laksda Yos Sudarso No. 1, Jakarta Utara';
    let namaKepsek = 'Kepala Sekolah';

    try {
        const configStr = localStorage.getItem('smart_absen_config');
        if (configStr) {
            const cfg = JSON.parse(configStr);
            if (cfg.NAMA_SEKOLAH || cfg.nama_sekolah) namaSekolah = cfg.NAMA_SEKOLAH || cfg.nama_sekolah;
            if (cfg.ALAMAT_SEKOLAH || cfg.alamat_sekolah) alamatSekolah = cfg.ALAMAT_SEKOLAH || cfg.alamat_sekolah;
            if (cfg.NAMA_KEPSEK || cfg.nama_kepsek) namaKepsek = cfg.NAMA_KEPSEK || cfg.nama_kepsek;
        }
    } catch(e) {}

    return { namaSekolah, alamatSekolah, namaKepsek };
}

// 7.1 Cetak PDF Presensi Harian Siswa per Tanggal, Sesi, Kelas
function printBimbelSiswaPdf() {
    const tgl = document.getElementById('bimbelSiswaTanggal').value;
    const sesi = document.getElementById('bimbelSiswaSesi').value;
    const kelas = document.getElementById('bimbelSiswaKelas').value;
    const tbody = document.getElementById('tbodyAbsenSiswaBimbel');

    if (!tgl || !sesi || !kelas) {
        return showToast("⚠️ Pilih Tanggal, Sesi, dan Kelas yang ingin dicetak!", "warning");
    }

    const rows = tbody.querySelectorAll('tr');
    if (rows.length === 0 || !tbody.querySelector('.bimbel-status-radio-group')) {
        return showToast("⚠️ Tidak ada daftar siswa untuk dicetak.", "warning");
    }

    const teacherLog = bimbelGuruLogs.find(g => g.tanggal === tgl && g.sesi === sesi && g.kelas === kelas);
    const mapelName = teacherLog ? teacherLog.mapel : '-';
    const guruName = teacherLog ? teacherLog.nama : '-';
    const materiAjar = teacherLog ? teacherLog.materi_ajar : '-';

    const { namaSekolah, alamatSekolah, namaKepsek } = getBimbelPrintSchoolMeta();

    // Collect Student Attendance Data
    let tableRowsHtml = '';
    let countHadir = 0, countSakit = 0, countIzin = 0, countAlpa = 0;

    rows.forEach((row, idx) => {
        const cols = row.querySelectorAll('td');
        if (cols.length >= 6) {
            const nisn = cols[1].innerText.trim();
            const nis = cols[2].innerText.trim();
            const nama = cols[3].innerText.trim();
            const gender = cols[4].innerText.trim();

            const group = row.querySelector('.bimbel-status-radio-group');
            const ketInp = row.querySelector('.bimbel-ket-input');
            const selectedRadio = group ? group.querySelector('input[type="radio"]:checked') : null;
            const status = selectedRadio ? selectedRadio.value : 'HADIR';
            const keterangan = ketInp ? ketInp.value.trim() : '-';

            if (status === 'HADIR') countHadir++;
            else if (status === 'SAKIT') countSakit++;
            else if (status === 'IZIN') countIzin++;
            else if (status === 'ALPA') countAlpa++;

            let statusColor = '#15803d';
            if (status === 'SAKIT') statusColor = '#b45309';
            else if (status === 'IZIN') statusColor = '#0369a1';
            else if (status === 'ALPA') statusColor = '#b91c1c';

            tableRowsHtml += `
                <tr>
                    <td style="text-align: center;">${idx + 1}</td>
                    <td style="text-align: center;">${nisn}</td>
                    <td style="text-align: center;">${nis}</td>
                    <td><strong>${nama}</strong></td>
                    <td style="text-align: center;">${gender}</td>
                    <td style="text-align: center; font-weight: bold; color: ${statusColor};">${status}</td>
                    <td>${keterangan || '-'}</td>
                </tr>
            `;
        }
    });

    const formattedDate = new Date(tgl).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const printWin = window.open('', '_blank', 'width=950,height=750');
    if (!printWin) return showToast("❌ Izinkan popup browser untuk mencetak dokumen PDF.", "error");

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Presensi Bimbel TKA/UTBK - ${kelas} (${tgl})</title>
            <style>
                body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #1e293b; margin: 25px; line-height: 1.4; }
                .kop { text-align: center; border-bottom: 3px double #0f172a; padding-bottom: 8px; margin-bottom: 15px; }
                .kop h2 { margin: 0; font-size: 18px; text-transform: uppercase; font-weight: 800; color: #0f172a; }
                .kop h3 { margin: 3px 0 0 0; font-size: 13px; font-weight: 700; text-transform: uppercase; color: #334155; }
                .kop p { margin: 2px 0 0 0; font-size: 10px; color: #64748b; }
                
                .report-title { text-align: center; margin-bottom: 15px; }
                .report-title h4 { margin: 0; font-size: 13px; text-transform: uppercase; text-decoration: underline; letter-spacing: 0.5px; }
                
                .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 11px; }
                .meta-table td { padding: 4px 6px; border: none; }

                table.data-table { width: 100%; border-collapse: collapse; margin-top: 5px; }
                table.data-table th, table.data-table td { border: 1px solid #475569; padding: 6px 8px; font-size: 10.5px; }
                table.data-table th { background-color: #f1f5f9; font-weight: bold; text-transform: uppercase; text-align: center; }

                .summary-box { margin-top: 12px; padding: 8px 12px; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 4px; display: flex; gap: 20px; font-size: 11px; font-weight: 600; }

                .footer-sign { margin-top: 40px; display: flex; justify-content: space-between; page-break-inside: avoid; }
                .sign-box { text-align: center; width: 220px; font-size: 11px; }
                .sign-space { height: 60px; }

                @media print {
                    @page { size: A4 portrait; margin: 12mm; }
                }
            </style>
        </head>
        <body>
            <div class="kop">
                <h2>${namaSekolah}</h2>
                <h3>DAFTAR PRESENSI & JURNAL BIMBINGAN TKA / UTBK KELAS XII</h3>
                <p>${alamatSekolah}</p>
            </div>

            <div class="report-title">
                <h4>LAPORAN KEHADIRAN SISWA BIMBINGAN TKA / UTBK</h4>
            </div>

            <table class="meta-table">
                <tr>
                    <td style="width: 15%;"><strong>Hari / Tanggal</strong></td>
                    <td style="width: 35%;">: ${formattedDate}</td>
                    <td style="width: 15%;"><strong>Kelas / Sesi</strong></td>
                    <td style="width: 35%;">: <strong>${kelas}</strong> / ${sesi}</td>
                </tr>
                <tr>
                    <td><strong>Mata Pelajaran</strong></td>
                    <td>: ${mapelName}</td>
                    <td><strong>Guru Pengajar</strong></td>
                    <td>: ${guruName}</td>
                </tr>
                <tr>
                    <td style="vertical-align: top;"><strong>Materi Ajar</strong></td>
                    <td colspan="3" style="vertical-align: top;">: ${materiAjar}</td>
                </tr>
            </table>

            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width: 30px;">NO</th>
                        <th style="width: 90px;">NISN</th>
                        <th style="width: 70px;">NIS</th>
                        <th style="text-align: left;">NAMA SISWA</th>
                        <th style="width: 40px;">L/P</th>
                        <th style="width: 80px;">STATUS</th>
                        <th>KETERANGAN</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRowsHtml}
                </tbody>
            </table>

            <div class="summary-box">
                <span>Total Siswa: ${rows.length} orang</span> | 
                <span style="color: #15803d;">Hadir: ${countHadir}</span> | 
                <span style="color: #b45309;">Sakit: ${countSakit}</span> | 
                <span style="color: #0369a1;">Izin: ${countIzin}</span> | 
                <span style="color: #b91c1c;">Alpa: ${countAlpa}</span>
            </div>

            <div class="footer-sign">
                <div class="sign-box">
                    <p>Guru Pengajar Bimbingan,</p>
                    <div class="sign-space"></div>
                    <p><strong>( ${guruName} )</strong></p>
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

// 7.2 Cetak PDF Rekapitulasi Bulanan Kehadiran Siswa
function printBimbelRekapPdf() {
    const bulan = document.getElementById('rekapBimbelBulan').value;
    const kelas = document.getElementById('rekapBimbelKelas').value;
    const tbody = document.getElementById('tbodyRekapBimbel');

    if (!bulan) return showToast("⚠️ Pilih bulan rekapitulasi terlebih dahulu!", "warning");

    const rows = tbody.querySelectorAll('tr');
    if (rows.length === 0 || rows[0].cells.length < 5) {
        return showToast("⚠️ Tidak ada data rekapitulasi untuk dicetak.", "warning");
    }

    const { namaSekolah, alamatSekolah, namaKepsek } = getBimbelPrintSchoolMeta();

    let tableRowsHtml = '';
    let grandTotalHadir = 0, grandTotalSakit = 0, grandTotalIzin = 0, grandTotalAlpa = 0, grandTotalPertemuan = 0;

    rows.forEach((row, idx) => {
        const cols = row.querySelectorAll('td');
        if (cols.length >= 10) {
            const nisn = cols[1].innerText.trim();
            const nama = cols[2].innerText.trim();
            const logKelas = cols[3].innerText.trim();
            const hadir = parseInt(cols[4].innerText.trim(), 10) || 0;
            const sakit = parseInt(cols[5].innerText.trim(), 10) || 0;
            const izin = parseInt(cols[6].innerText.trim(), 10) || 0;
            const alpa = parseInt(cols[7].innerText.trim(), 10) || 0;
            const total = parseInt(cols[8].innerText.trim(), 10) || 0;
            const pct = cols[9].innerText.trim();

            grandTotalHadir += hadir;
            grandTotalSakit += sakit;
            grandTotalIzin += izin;
            grandTotalAlpa += alpa;
            grandTotalPertemuan += total;

            tableRowsHtml += `
                <tr>
                    <td style="text-align: center;">${idx + 1}</td>
                    <td style="text-align: center;">${nisn}</td>
                    <td><strong>${nama}</strong></td>
                    <td style="text-align: center;">${logKelas}</td>
                    <td style="text-align: center; font-weight: bold; color: #15803d;">${hadir}</td>
                    <td style="text-align: center; font-weight: bold; color: #b45309;">${sakit}</td>
                    <td style="text-align: center; font-weight: bold; color: #0369a1;">${izin}</td>
                    <td style="text-align: center; font-weight: bold; color: #b91c1c;">${alpa}</td>
                    <td style="text-align: center; font-weight: bold;">${total}</td>
                    <td style="text-align: center; font-weight: 800;">${pct}</td>
                </tr>
            `;
        }
    });

    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const parts = bulan.split('-');
    const monthLabel = parts.length === 2 ? `${monthNames[parseInt(parts[1], 10) - 1]} ${parts[0]}` : bulan;

    const printWin = window.open('', '_blank', 'width=950,height=750');
    if (!printWin) return showToast("❌ Izinkan popup browser untuk mencetak dokumen PDF.", "error");

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Rekap Bimbel TKA/UTBK - ${monthLabel} (${kelas || 'Semua Kelas'})</title>
            <style>
                body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #1e293b; margin: 25px; line-height: 1.4; }
                .kop { text-align: center; border-bottom: 3px double #0f172a; padding-bottom: 8px; margin-bottom: 15px; }
                .kop h2 { margin: 0; font-size: 18px; text-transform: uppercase; font-weight: 800; color: #0f172a; }
                .kop h3 { margin: 3px 0 0 0; font-size: 13px; font-weight: 700; text-transform: uppercase; color: #334155; }
                .kop p { margin: 2px 0 0 0; font-size: 10px; color: #64748b; }
                
                .report-title { text-align: center; margin-bottom: 15px; }
                .report-title h4 { margin: 0; font-size: 13px; text-transform: uppercase; text-decoration: underline; letter-spacing: 0.5px; }
                .report-title p { margin: 4px 0 0 0; font-size: 11px; color: #475569; }

                table.data-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                table.data-table th, table.data-table td { border: 1px solid #475569; padding: 6px 8px; font-size: 10.5px; }
                table.data-table th { background-color: #f1f5f9; font-weight: bold; text-transform: uppercase; text-align: center; }

                .footer-sign { margin-top: 40px; display: flex; justify-content: space-between; page-break-inside: avoid; }
                .sign-box { text-align: center; width: 220px; font-size: 11px; }
                .sign-space { height: 60px; }

                @media print {
                    @page { size: A4 portrait; margin: 12mm; }
                }
            </style>
        </head>
        <body>
            <div class="kop">
                <h2>${namaSekolah}</h2>
                <h3>LAPORAN REKAPITULASI PRESENSI BIMBINGAN TKA / UTBK</h3>
                <p>${alamatSekolah}</p>
            </div>

            <div class="report-title">
                <h4>REKAPITULASI KEHADIRAN SISWA PERIODE ${monthLabel.toUpperCase()}</h4>
                <p>Filter Kelas: <strong>${kelas || 'Semua Kelas XII'}</strong> | Total Siswa: ${rows.length} Orang | Dicetak Tanggal: ${new Date().toLocaleDateString('id-ID')}</p>
            </div>

            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width: 30px;">NO</th>
                        <th style="width: 95px;">NISN</th>
                        <th style="text-align: left;">NAMA SISWA</th>
                        <th style="width: 80px;">KELAS</th>
                        <th style="width: 55px; color: #15803d;">HADIR</th>
                        <th style="width: 55px; color: #b45309;">SAKIT</th>
                        <th style="width: 55px; color: #0369a1;">IZIN</th>
                        <th style="width: 55px; color: #b91c1c;">ALPA</th>
                        <th style="width: 65px;">TOTAL</th>
                        <th style="width: 85px;">% HADIR</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRowsHtml}
                </tbody>
            </table>

            <div class="footer-sign">
                <div class="sign-box">
                    <p>Koordinator Bimbingan TKA/UTBK,</p>
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

