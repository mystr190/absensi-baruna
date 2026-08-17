/**
 * =========================================================================
 * MODUL RAPOR TENGAH SEMESTER (STS / PTS)
 * SMART APP ABSENSI & RAPOR SEKOLAH
 * =========================================================================
 */

let currentRaporData = {
    students: [],
    mapelList: [],
    gradesMap: {},
    studentNotesMap: {},
    attendanceSummaryMap: {},
    waliKelasInfo: { nama: '', nip: '' },
    config: {}
};

let currentRaporKelas = '';
let currentRaporSemester = '1';
let currentRaporTahun = '';
let currentRaporPageIndex = 0;

function changeRaporPage(newIndex) {
    const pages = document.querySelectorAll('#raporPrintArea .rapor-page-card');
    if (pages.length === 0) return;

    const targetIdx = Math.max(0, Math.min(newIndex, pages.length - 1));
    currentRaporPageIndex = targetIdx;

    pages.forEach((p, idx) => {
        if (idx === targetIdx) {
            p.classList.remove('hidden-page');
            p.classList.add('active-page');
        } else {
            p.classList.remove('active-page');
            p.classList.add('hidden-page');
        }
    });

    const pageInfo = document.getElementById('raporPageNavInfo');
    const selectStdNav = document.getElementById('raporSelectStudentNav');
    if (pageInfo) {
        pageInfo.innerHTML = `Siswa <span style="color: #38bdf8; font-weight: bold;">${targetIdx + 1}</span> dari <span style="color: #38bdf8; font-weight: bold;">${pages.length}</span>`;
    }
    if (selectStdNav) {
        selectStdNav.value = targetIdx;
    }

    const btnFirst = document.getElementById('btnRaporPageFirst');
    const btnPrev = document.getElementById('btnRaporPagePrev');
    const btnNext = document.getElementById('btnRaporPageNext');
    const btnLast = document.getElementById('btnRaporPageLast');

    if (btnFirst) btnFirst.disabled = (targetIdx === 0);
    if (btnPrev) btnPrev.disabled = (targetIdx === 0);
    if (btnNext) btnNext.disabled = (targetIdx >= pages.length - 1);
    if (btnLast) btnLast.disabled = (targetIdx >= pages.length - 1);
}
window.changeRaporPage = changeRaporPage;

function cleanId(id) {
    return String(id || '').trim().replace(/^0+/, '');
}

function getFormattedIndonesianDate(d = new Date()) {
    if (!(d instanceof Date) || isNaN(d)) d = new Date();
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
window.getFormattedIndonesianDate = getFormattedIndonesianDate;

let renderRaporPreviewTimeout = null;
function debouncedRenderRaporPreview(delay = 150) {
    if (renderRaporPreviewTimeout) clearTimeout(renderRaporPreviewTimeout);
    renderRaporPreviewTimeout = setTimeout(() => {
        renderBatchRaporPrintPreview();
    }, delay);
}
window.debouncedRenderRaporPreview = debouncedRenderRaporPreview;

let raporInitialized = false;
function initRaporOnce() {
    if (raporInitialized) return;
    raporInitialized = true;
    initRaporTengahSemesterEvents();
    setupRaporFilterOptions();
    debouncedRenderRaporPreview(0);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRaporOnce);
} else {
    initRaporOnce();
}

function initRaporTengahSemesterEvents() {
    const navRapor = document.getElementById('navRaporTengahSemester');
    if (navRapor) {
        navRapor.addEventListener('click', (e) => {
            e.preventDefault();
            switchPanel('panelRaporTengahSemester');
            setupRaporFilterOptions();
            debouncedRenderRaporPreview(0);
        });
    }

    const btnLoadRapor = document.getElementById('btnLoadRaporData');
    if (btnLoadRapor) {
        btnLoadRapor.addEventListener('click', () => loadRaporDataFromServer(true));
    }

    const btnSaveRapor = document.getElementById('btnSaveRaporData');
    if (btnSaveRapor) {
        btnSaveRapor.addEventListener('click', saveRaporDataToServer);
    }

    const btnDownloadRaporTemplate = document.getElementById('btnDownloadRaporTemplate');
    if (btnDownloadRaporTemplate) {
        btnDownloadRaporTemplate.addEventListener('click', downloadRaporCSVTemplate);
    }

    const btnImportRaporCSV = document.getElementById('btnImportRaporCSV');
    const inputRaporCSVFile = document.getElementById('inputRaporCSVFile');
    if (btnImportRaporCSV && inputRaporCSVFile) {
        btnImportRaporCSV.addEventListener('click', () => inputRaporCSVFile.click());
        inputRaporCSVFile.addEventListener('change', handleRaporCSVUpload);
    }

    const btnPrintRaporArea = document.getElementById('btnPrintRaporArea');
    if (btnPrintRaporArea) {
        btnPrintRaporArea.addEventListener('click', async () => {
            await renderBatchRaporPrintPreview();
            setTimeout(() => {
                window.print();
            }, 100);
        });
    }

    const inputJudulRapor = document.getElementById('inputRaporJudulDokumen');
    if (inputJudulRapor) {
        inputJudulRapor.addEventListener('input', () => debouncedRenderRaporPreview(150));
    }

    const inputNamaKepsek = document.getElementById('inputRaporNamaKepsek');
    if (inputNamaKepsek) {
        inputNamaKepsek.addEventListener('input', () => debouncedRenderRaporPreview(150));
    }

    const inputTahun = document.getElementById('inputRaporTahunPelajaran');
    if (inputTahun) {
        inputTahun.addEventListener('input', () => {
            currentRaporTahun = inputTahun.value.trim();
            debouncedRenderRaporPreview(150);
        });
    }

    const inputTglAwal = document.getElementById('inputRaporTglAwal');
    const inputTglAkhir = document.getElementById('inputRaporTglAkhir');
    if (inputTglAwal) inputTglAwal.addEventListener('change', () => debouncedRenderRaporPreview(150));
    if (inputTglAkhir) inputTglAkhir.addEventListener('change', () => debouncedRenderRaporPreview(150));
}

function setupRaporFilterOptions() {
    const selectKelas = document.getElementById('selectRaporKelas');
    const inputTahun = document.getElementById('inputRaporTahunPelajaran');

    if (selectKelas) {
        let classList = [];

        // 1. Try from allStudents / localMasterStudents memory arrays
        let students = window.allStudents || window.localMasterStudents || [];
        if (!students || students.length === 0) {
            const keys = ['smart_absen_master_students', 'smart_absen_students_cache', 'smart_absen_students', 'smart_absen_master_siswa'];
            for (const key of keys) {
                try {
                    const raw = localStorage.getItem(key);
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            students = parsed;
                            break;
                        }
                    }
                } catch (e) {}
            }
        }

        if (Array.isArray(students) && students.length > 0) {
            classList = [...new Set(students.map(s => String(s.kelas || s.rombel || s.Kelas || '').trim()).filter(Boolean))];
        }

        // 2. Try from Master Classes (smart_absen_kelas_list / window.masterClasses)
        if (classList.length === 0) {
            let masterK = window.masterClasses || [];
            if (!masterK || masterK.length === 0) {
                try {
                    const rawK = JSON.parse(localStorage.getItem('smart_absen_kelas_list') || '[]');
                    if (Array.isArray(rawK) && rawK.length > 0) {
                        masterK = rawK.map(k => typeof k === 'object' ? (k.nama || k.kelas) : k).filter(Boolean);
                    }
                } catch (e) {}
            }
            if (Array.isArray(masterK) && masterK.length > 0) {
                classList = [...new Set(masterK)];
            }
        }

        // 3. Fallback default preset if still empty
        if (classList.length === 0) {
            classList = ['X-1', 'X-2', 'X-3', 'X-4', 'XI-1', 'XI-2', 'XI-3', 'XI-4', 'XII-1', 'XII-2', 'XII-3', 'XII-4', 'XII-5'];
        }

        // Sort classes logically
        classList.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

        const currentSelVal = selectKelas.value;
        let html = '<option value="">-- Pilih Kelas --</option>';
        classList.forEach(c => {
            const isSel = (c === currentSelVal) ? 'selected' : '';
            html += `<option value="${escapeHtml(c)}" ${isSel}>${escapeHtml(c)}</option>`;
        });
        selectKelas.innerHTML = html;

        // Auto-select first class if none selected
        if (!selectKelas.value && selectKelas.options.length > 1) {
            selectKelas.selectedIndex = 1;
        }
        if (selectKelas.value) {
            currentRaporKelas = selectKelas.value;
        }

        if (!selectKelas.dataset.hasChangeListener) {
            selectKelas.dataset.hasChangeListener = 'true';
            selectKelas.addEventListener('change', () => {
                currentRaporPageIndex = 0;
                currentRaporKelas = selectKelas.value;
                if (selectKelas.value) {
                    loadRaporDataFromServer();
                }
            });
        }

        // Trigger immediate auto-load and live preview rendering
        loadRaporDataFromServer();
    }

    const sysConfig = JSON.parse(localStorage.getItem('smart_absen_config') || '{}');
    const tpFromConfig = sysConfig.tahunPelajaran || sysConfig.tahun_pelajaran || sysConfig.tahunAjaran || sysConfig.tahun_ajaran || '2025/2026';
    if (inputTahun) {
        inputTahun.value = tpFromConfig;
        currentRaporTahun = tpFromConfig;
    }

    const inputKepsek = document.getElementById('inputRaporNamaKepsek');
    if (inputKepsek && !inputKepsek.value) {
        inputKepsek.value = sysConfig.namaKepalaSekolah || sysConfig.namaKepsek || 'Suparyono, M.Pd';
    }

    debouncedRenderRaporPreview(0);
}

window.setupRaporFilterOptions = setupRaporFilterOptions;

function getLocalStudentsForRapor(kelas) {
    let rawAll = window.allStudents || window.localMasterStudents || [];
    if (!rawAll || rawAll.length === 0) {
        const keys = ['smart_absen_master_students', 'smart_absen_students_cache', 'smart_absen_students', 'smart_absen_master_siswa'];
        for (const key of keys) {
            try {
                const raw = localStorage.getItem(key);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        rawAll = parsed;
                        break;
                    }
                }
            } catch (e) {}
        }
    }

    const selectEl = document.getElementById('selectRaporKelas');
    const targetKls = kelas || currentRaporKelas || (selectEl ? selectEl.value : '') || 'X-1';

    if (Array.isArray(rawAll) && rawAll.length > 0) {
        const normTarget = cleanId(targetKls).toLowerCase().replace(/[\s\-\/]/g, '');
        const matched = rawAll.filter(s => {
            const kRaw = String(s.kelas || s.Rombel || s.Kelas || s.rombel || '').trim();
            const kNorm = kRaw.toLowerCase().replace(/[\s\-\/]/g, '');
            return kNorm === normTarget || kRaw.toLowerCase() === String(targetKls).trim().toLowerCase();
        });

        if (matched.length > 0) {
            return matched.map(s => ({
                nisn: String(s.nisn || s.NISN || '').trim(),
                nis: String(s.nis || s.NIS || '').trim(),
                nama: String(s.nama || s.Nama || '').trim(),
                kelas: String(s.kelas || s.Kelas || targetKls),
                gender: String(s.gender || s.Gender || 'L')
            }));
        }

        // Fallback to first few students if specific class filter has no match
        return rawAll.slice(0, 5).map((s, i) => ({
            nisn: String(s.nisn || s.NISN || `005481239${i + 1}`).trim(),
            nis: String(s.nis || s.NIS || `2223100${i + 1}`).trim(),
            nama: String(s.nama || s.Nama || `Siswa ${i + 1}`).trim(),
            kelas: targetKls,
            gender: String(s.gender || s.Gender || 'L')
        }));
    }

    // Default Sample/Demo Students if no master data is loaded yet
    return [
        { nisn: '0054812394', nis: '22231001', nama: 'Ahmad Rizky Pratama', kelas: targetKls, gender: 'L' },
        { nisn: '0054812395', nis: '22231002', nama: 'Siti Aminah', kelas: targetKls, gender: 'P' },
        { nisn: '0054812396', nis: '22231003', nama: 'Budi Santoso', kelas: targetKls, gender: 'L' }
    ];
}

function getLocalMapelListForRapor(kelas) {
    const rawMapel = window.allMapel || window.masterMapel || JSON.parse(localStorage.getItem('smart_absen_mapel_cache') || '[]');
    if (Array.isArray(rawMapel) && rawMapel.length > 0) {
        return rawMapel.map((m, idx) => ({
            kode: m.nama || m.kode || String(m),
            nama: m.nama || m.kode || String(m),
            urutan: idx + 1
        }));
    }
    // Default fallback Mapel
    const defaultMapels = [
        'Pendidikan Agama dan Budi Pekerti', 'Pancasila', 'Bahasa Indonesia',
        'Matematika', 'Sejarah', 'Bahasa Inggris', 'Informatika',
        'Seni Budaya', 'PJOK', 'Fisika', 'Kimia', 'Biologi', 'Sosiologi', 'Ekonomi', 'Geografi'
    ];
    return defaultMapels.map((m, idx) => ({ kode: m, nama: m, urutan: idx + 1 }));
}

async function loadRaporDataFromServer(isManualClick = false) {
    isManualClick = (isManualClick === true);
    const selectKelas = document.getElementById('selectRaporKelas');
    const selectSemester = document.getElementById('selectRaporSemester');
    const inputTahun = document.getElementById('inputRaporTahunPelajaran');
    const btnLoad = document.getElementById('btnLoadRaporData');
    const btnImport = document.getElementById('btnImportRaporCSV');

    const origLoadText = `<i class="fa-solid fa-cloud-arrow-down"></i> Muat & Hitung Data Rapor`;
    if (isManualClick) {
        if (btnLoad) {
            btnLoad.disabled = true;
            btnLoad.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Memuat & Hitung Data...`;
        }
        if (btnImport) {
            btnImport.disabled = true;
        }
    }

    let kelas = selectKelas ? selectKelas.value.trim() : '';
    if (!kelas && selectKelas && selectKelas.options && selectKelas.options.length > 1) {
        selectKelas.selectedIndex = 1;
        kelas = selectKelas.value.trim();
    }
    if (!kelas) kelas = 'X-1';

    const semester = selectSemester ? selectSemester.value.trim() : '1';
    const tahun = inputTahun ? inputTahun.value.trim() : '2025/2026';

    currentRaporKelas = kelas;
    currentRaporSemester = semester;
    currentRaporTahun = tahun;

    // 1. Render data dari memori lokal terlebih dahulu agar responsif 0ms
    const localStudents = getLocalStudentsForRapor(kelas);
    const localMapel = getLocalMapelListForRapor(kelas);
    if (localStudents.length > 0) {
        currentRaporData.students = localStudents;
        if (!currentRaporData.mapelList || currentRaporData.mapelList.length === 0) {
            currentRaporData.mapelList = localMapel;
        }
        renderRaporMapelReorderControl();
        renderRaporInputGrid();
        renderBatchRaporPrintPreview();
    } else {
        const gridContainer = document.getElementById('raporDataGridContainer');
        if (gridContainer) {
            gridContainer.innerHTML = `<div style="text-align:center; padding: 40px;"><span class="loader" style="display:inline-block; border-color:var(--primary); border-bottom-color:transparent; margin-right:8px;"></span>Memuat data nilai rapor kelas ${kelas}...</div>`;
        }
    }

    // 2. Ambil data terbaru dari server
    try {
        const url = `${SCRIPT_URL}?action=get_rapor_data&kelas=${encodeURIComponent(kelas)}&semester=${encodeURIComponent(semester)}&tahun=${encodeURIComponent(tahun)}`;
        const res = await fetchWithRetry(url, { method: 'GET' }, 2, 800);

        if (res && res.status === 'success' && res.data) {
            const serverStudents = res.data.students || [];
            currentRaporData = {
                ...res.data,
                students: serverStudents.length > 0 ? serverStudents : localStudents,
                mapelList: (res.data.mapelList && res.data.mapelList.length > 0) ? res.data.mapelList : localMapel
            };

            if (res.data.config) {
                const cfgTp = res.data.config.tahunPelajaran || res.data.config.tahun_pelajaran || res.data.config.tahunAjaran || res.data.config.tahun_ajaran;
                if (cfgTp && inputTahun) {
                    inputTahun.value = cfgTp;
                    currentRaporTahun = cfgTp;
                }
            }

            renderRaporMapelReorderControl();
            renderRaporInputGrid();
            debouncedRenderRaporPreview(0);
            showToast(`Berhasil memuat data rapor kelas ${kelas}.`, 'success');
            return true;
        } else if (localStudents.length > 0) {
            renderRaporMapelReorderControl();
            renderRaporInputGrid();
            debouncedRenderRaporPreview(0);
            showToast(`Menampilkan data kelas ${kelas}.`, 'info');
            return true;
        } else {
            showToast(`Gagal memuat data: ${res ? res.message : 'Error'}`, 'error');
            return false;
        }
    } catch (err) {
        console.error('Load Rapor Error:', err);
        if (localStudents.length > 0) {
            renderRaporMapelReorderControl();
            renderRaporInputGrid();
            debouncedRenderRaporPreview(0);
            showToast(`Menampilkan data lokal kelas ${kelas}.`, 'info');
            return true;
        }
        showToast('Terjadi kesalahan koneksi saat memuat data rapor.', 'error');
        return false;
    } finally {
        if (isManualClick && btnLoad) {
            btnLoad.disabled = false;
            btnLoad.innerHTML = origLoadText;
        }
        if (isManualClick && btnImport) {
            btnImport.disabled = false;
        }
    }
}

function renderRaporMapelReorderControl() {
    const container = document.getElementById('raporMapelOrderContainer');
    if (!container) return;

    const mapelList = currentRaporData.mapelList || [];
    if (mapelList.length === 0) {
        container.innerHTML = `<span style="color:var(--text-muted); font-size:0.85rem;">Tidak ada mapel terdaftar untuk kelas ini.</span>`;
        return;
    }

    let html = `<div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:15px; background:rgba(0,0,0,0.2); padding:10px 14px; border-radius:8px;">
        <strong style="font-size:0.85rem; color:#93c5fd;"><i class="fa-solid fa-list-ol"></i> Urutan Mata Pelajaran:</strong>`;

    mapelList.forEach((m, idx) => {
        html += `
            <div class="badge" style="background:rgba(59,130,246,0.15); color:#93c5fd; border:1px solid rgba(59,130,246,0.3); display:inline-flex; align-items:center; gap:6px; padding:4px 10px; font-size:0.82rem;">
                <span>${idx + 1}. ${m.nama}</span>
                ${idx > 0 ? `<i class="fa-solid fa-arrow-left" style="cursor:pointer; opacity:0.7;" title="Geser Kiri" onclick="moveRaporMapelOrder(${idx}, -1)"></i>` : ''}
                ${idx < mapelList.length - 1 ? `<i class="fa-solid fa-arrow-right" style="cursor:pointer; opacity:0.7;" title="Geser Kanan" onclick="moveRaporMapelOrder(${idx}, 1)"></i>` : ''}
            </div>
        `;
    });

    html += `</div>`;
    container.innerHTML = html;
}

window.moveRaporMapelOrder = function(index, direction) {
    const mapelList = currentRaporData.mapelList || [];
    const targetIdx = index + direction;

    if (targetIdx < 0 || targetIdx >= mapelList.length) return;

    const temp = mapelList[index];
    mapelList[index] = mapelList[targetIdx];
    mapelList[targetIdx] = temp;

    // Re-assign urutan
    mapelList.forEach((m, i) => m.urutan = i + 1);

    renderRaporMapelReorderControl();
    renderRaporInputGrid();
    renderBatchRaporPrintPreview();
};

function renderRaporInputGrid() {
    const gridContainer = document.getElementById('raporDataGridContainer');
    if (!gridContainer) return;

    const students = currentRaporData.students || [];
    const mapelList = currentRaporData.mapelList || [];
    const gradesMap = currentRaporData.gradesMap || {};
    const studentNotesMap = currentRaporData.studentNotesMap || {};

    if (students.length === 0) {
        gridContainer.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted);"><i class="fa-solid fa-users-slash" style="font-size:2rem; display:block; margin-bottom:10px;"></i>Tidak ada siswa di kelas ${currentRaporKelas}.</div>`;
        return;
    }

    if (mapelList.length === 0) {
        gridContainer.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted);"><i class="fa-solid fa-book-slash" style="font-size:2rem; display:block; margin-bottom:10px;"></i>Belum ada data Mata Pelajaran untuk kelas ini.</div>`;
        return;
    }

    let html = `
        <div style="overflow-x:auto; margin-bottom:20px; border-radius:8px;">
            <table class="data-table" style="width:100%; min-width:1100px; border-collapse:collapse; font-size:0.85rem;">
                <thead>
                    <tr style="background:rgba(59,130,246,0.2); text-align:center;">
                        <th rowspan="2" style="width:40px; border:1px solid var(--card-border);">No</th>
                        <th rowspan="2" style="width:180px; border:1px solid var(--card-border);">Nama Siswa / NISN</th>
                        <th rowspan="2" style="width:160px; border:1px solid var(--card-border);">Mata Pelajaran</th>
                        <th colspan="5" style="border:1px solid var(--card-border);">Nilai Harian & ATS</th>
                        <th rowspan="2" style="width:90px; border:1px solid var(--card-border);">Sikap</th>
                        <th rowspan="2" style="width:90px; border:1px solid var(--card-border);">Kehadiran</th>
                        <th rowspan="2" style="width:115px; border:1px solid var(--card-border);">Pramuka</th>
                        <th rowspan="2" style="min-width:180px; border:1px solid var(--card-border);">Catatan Wali Kelas</th>
                    </tr>
                    <tr style="background:rgba(59,130,246,0.15); text-align:center;">
                        <th style="width:60px; border:1px solid var(--card-border);">PH 1</th>
                        <th style="width:60px; border:1px solid var(--card-border); color:#fca5a5;">R</th>
                        <th style="width:60px; border:1px solid var(--card-border);">PH 2</th>
                        <th style="width:60px; border:1px solid var(--card-border); color:#fca5a5;">R</th>
                        <th style="width:65px; border:1px solid var(--card-border); color:#93c5fd;">ATS</th>
                    </tr>
                </thead>
                <tbody>
    `;

    students.forEach((std, sIdx) => {
        const stdNisn = String(std.nisn || '').trim();
        const stdNis = String(std.nis || '').trim();
        const stdNisnClean = cleanId(stdNisn);
        const stdNisClean = cleanId(stdNis);
        const nisnKey = stdNisn || stdNis;

        const stdNotes = studentNotesMap[stdNisn] ||
                         studentNotesMap[stdNis] ||
                         studentNotesMap[stdNisnClean] ||
                         studentNotesMap[stdNisClean] ||
                         { nilaiPramuka: 'BAIK', catatanWali: '' };

        mapelList.forEach((m, mIdx) => {
            const mKode = String(m.kode || '').trim();
            const mNama = String(m.nama || '').trim();

            const g = gradesMap[`${stdNisn}_${mKode}`] ||
                      gradesMap[`${stdNis}_${mKode}`] ||
                      gradesMap[`${stdNisnClean}_${mKode}`] ||
                      gradesMap[`${stdNisClean}_${mKode}`] ||
                      gradesMap[`${stdNisn}_${mNama}`] ||
                      gradesMap[`${stdNis}_${mNama}`] ||
                      gradesMap[`${stdNisnClean}_${mNama}`] ||
                      gradesMap[`${stdNisClean}_${mNama}`] ||
                      gradesMap[`${stdNisn}_${mKode.toLowerCase()}`] ||
                      gradesMap[`${stdNis}_${mKode.toLowerCase()}`] ||
                      gradesMap[`${stdNisnClean}_${mKode.toLowerCase()}`] ||
                      gradesMap[`${stdNisClean}_${mKode.toLowerCase()}`] ||
                      { ph1: '', r1: '', ph2: '', r2: '', ats: '', sikap: 'Baik', kehadiran: '100%' };

            html += `<tr style="${mIdx === 0 ? 'border-top:2px solid var(--primary);' : ''}">`;

            if (mIdx === 0) {
                html += `
                    <td rowspan="${mapelList.length}" style="text-align:center; font-weight:bold; border:1px solid var(--card-border); background:rgba(0,0,0,0.15);">${sIdx + 1}</td>
                    <td rowspan="${mapelList.length}" style="border:1px solid var(--card-border); background:rgba(0,0,0,0.15);">
                        <strong>${escapeHtml(std.nama)}</strong><br>
                        <small style="color:var(--text-muted);">NISN: ${std.nisn || '-'}</small>
                    </td>
                `;
            }

            html += `
                <td style="border:1px solid var(--card-border); font-weight:500;">${escapeHtml(m.nama)}</td>
                <td style="border:1px solid var(--card-border); text-align:center; padding:2px;">
                    <input type="number" class="grid-input" data-nisn="${nisnKey}" data-mapel="${mKode}" data-field="ph1" value="${g.ph1 !== undefined && g.ph1 !== null ? g.ph1 : ''}" style="width:100%; height:32px; box-sizing:border-box; text-align:center; background:transparent; border:none; color:white; font-size:0.88rem;">
                </td>
                <td style="border:1px solid var(--card-border); text-align:center; padding:2px; background:rgba(239,68,68,0.05);">
                    <input type="number" class="grid-input" data-nisn="${nisnKey}" data-mapel="${mKode}" data-field="r1" value="${g.r1 !== undefined && g.r1 !== null ? g.r1 : ''}" placeholder="-" style="width:100%; height:32px; box-sizing:border-box; text-align:center; background:transparent; border:none; color:#fca5a5; font-size:0.88rem;">
                </td>
                <td style="border:1px solid var(--card-border); text-align:center; padding:2px;">
                    <input type="number" class="grid-input" data-nisn="${nisnKey}" data-mapel="${mKode}" data-field="ph2" value="${g.ph2 !== undefined && g.ph2 !== null ? g.ph2 : ''}" style="width:100%; height:32px; box-sizing:border-box; text-align:center; background:transparent; border:none; color:white; font-size:0.88rem;">
                </td>
                <td style="border:1px solid var(--card-border); text-align:center; padding:2px; background:rgba(239,68,68,0.05);">
                    <input type="number" class="grid-input" data-nisn="${nisnKey}" data-mapel="${mKode}" data-field="r2" value="${g.r2 !== undefined && g.r2 !== null ? g.r2 : ''}" placeholder="-" style="width:100%; height:32px; box-sizing:border-box; text-align:center; background:transparent; border:none; color:#fca5a5; font-size:0.88rem;">
                </td>
                <td style="border:1px solid var(--card-border); text-align:center; padding:2px; background:rgba(59,130,246,0.08);">
                    <input type="number" class="grid-input" data-nisn="${nisnKey}" data-mapel="${mKode}" data-field="ats" value="${g.ats !== undefined && g.ats !== null ? g.ats : ''}" style="width:100%; height:32px; box-sizing:border-box; text-align:center; background:transparent; border:none; color:#93c5fd; font-weight:bold; font-size:0.88rem;">
                </td>
                <td style="border:1px solid var(--card-border); text-align:center; padding:2px;">
                    <select class="grid-select" data-nisn="${nisnKey}" data-mapel="${mKode}" data-field="sikap" style="width:100%; height:32px; box-sizing:border-box; background:transparent; border:none; color:white; font-size:0.8rem;">
                        <option value="Sangat Baik" ${g.sikap === 'Sangat Baik' ? 'selected' : ''}>S.Baik</option>
                        <option value="Baik" ${!g.sikap || g.sikap === 'Baik' ? 'selected' : ''}>Baik</option>
                        <option value="Cukup" ${g.sikap === 'Cukup' ? 'selected' : ''}>Cukup</option>
                    </select>
                </td>
                <td style="border:1px solid var(--card-border); text-align:center; padding:2px;">
                    <input type="text" class="grid-input" data-nisn="${nisnKey}" data-mapel="${mKode}" data-field="kehadiran" value="${escapeHtml(g.kehadiran || '100%')}" placeholder="100%" style="width:100%; height:32px; box-sizing:border-box; text-align:center; background:transparent; border:none; color:white; font-size:0.8rem;">
                </td>
            `;

            if (mIdx === 0) {
                html += `
                    <td rowspan="${mapelList.length}" style="border:1px solid var(--card-border); text-align:center; background:rgba(0,0,0,0.15);">
                        <select class="student-pramuka-select" data-nisn="${nisnKey}" style="width:100%; background:rgba(0,0,0,0.3); border:1px solid var(--card-border); color:white; padding:4px; border-radius:4px; font-size:0.8rem;">
                            <option value="SANGAT BAIK" ${stdNotes.nilaiPramuka === 'SANGAT BAIK' ? 'selected' : ''}>SANGAT BAIK</option>
                            <option value="BAIK" ${!stdNotes.nilaiPramuka || stdNotes.nilaiPramuka === 'BAIK' ? 'selected' : ''}>BAIK</option>
                            <option value="CUKUP" ${stdNotes.nilaiPramuka === 'CUKUP' ? 'selected' : ''}>CUKUP</option>
                        </select>
                    </td>
                    <td rowspan="${mapelList.length}" style="border:1px solid var(--card-border); background:rgba(0,0,0,0.15);">
                        <textarea class="student-catatan-input" data-nisn="${nisnKey}" rows="3" placeholder="Masukkan catatan wali kelas..." style="width:100%; background:rgba(0,0,0,0.3); border:1px solid var(--card-border); color:white; padding:6px; border-radius:4px; font-size:0.8rem; resize:vertical;">${escapeHtml(stdNotes.catatanWali || '')}</textarea>
                    </td>
                `;
            }

            html += `</tr>`;
        });
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    gridContainer.innerHTML = html;

    if (!gridContainer.dataset.hasListener) {
        gridContainer.dataset.hasListener = 'true';
        gridContainer.addEventListener('input', (e) => {
            if (e.target.matches('input, select, textarea')) {
                debouncedRenderRaporPreview(150);
            }
        });
        gridContainer.addEventListener('change', (e) => {
            if (e.target.matches('input, select, textarea')) {
                debouncedRenderRaporPreview(150);
            }
        });
    }
}

async function saveRaporDataToServer() {
    if (!currentRaporKelas) {
        showToast('Belum ada kelas terpilih.', 'warning');
        return;
    }

    const btnSave = document.getElementById('btnSaveRaporData');
    const btnImport = document.getElementById('btnImportRaporCSV');

    const origSaveText = btnSave ? btnSave.innerHTML : '';
    if (btnSave) {
        btnSave.disabled = true;
        btnSave.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...`;
    }
    if (btnImport) {
        btnImport.disabled = true;
    }

    showToast('⏳ Menyimpan data nilai rapor ke server...', 'info');

    const students = currentRaporData.students || [];
    const mapelList = currentRaporData.mapelList || [];

    const records = [];

    students.forEach(std => {
        const stdNisn = String(std.nisn || '').trim();
        const stdNis = String(std.nis || '').trim();
        const stdNisnClean = cleanId(stdNisn);
        const stdNisClean = cleanId(stdNis);
        const nisnKey = stdNisn || stdNis;
        const nama = String(std.nama || '').trim();

        const findEl = (selFn) => {
            const keys = [stdNisn, stdNis, stdNisnClean, stdNisClean, nisnKey].filter(Boolean);
            for (let k of keys) {
                const el = document.querySelector(selFn(k));
                if (el) return el;
            }
            return null;
        };

        const pramukaEl = findEl(k => `.student-pramuka-select[data-nisn="${k}"]`);
        const catatanEl = findEl(k => `.student-catatan-input[data-nisn="${k}"]`);

        const nilaiPramuka = pramukaEl ? pramukaEl.value : 'BAIK';
        const catatanWali = catatanEl ? catatanEl.value : '';

        mapelList.forEach(m => {
            const mKode = String(m.kode || m.nama || '').trim();
            const mNama = String(m.nama || '').trim();

            const findInput = (field) => {
                const keys = [stdNisn, stdNis, stdNisnClean, stdNisClean, nisnKey].filter(Boolean);
                const mapels = [mKode, mNama, m.kode].filter(Boolean);
                for (let k of keys) {
                    for (let mp of mapels) {
                        const sel = field === 'sikap' ? `.grid-select[data-nisn="${k}"][data-mapel="${mp}"][data-field="${field}"]`
                                                     : `.grid-input[data-nisn="${k}"][data-mapel="${mp}"][data-field="${field}"]`;
                        const el = document.querySelector(sel);
                        if (el) return el;
                    }
                }
                return null;
            };

            const ph1El = findInput('ph1');
            const r1El = findInput('r1');
            const ph2El = findInput('ph2');
            const r2El = findInput('r2');
            const atsEl = findInput('ats');
            const sikapEl = findInput('sikap');
            const kehadiranEl = findInput('kehadiran');

            records.push({
                nisn: stdNisn,
                nis: stdNis,
                nama: nama,
                mapelCode: mKode,
                mapelName: mNama,
                urutanMapel: m.urutan || 1,
                ph1: ph1El ? ph1El.value : '',
                r1: r1El ? r1El.value : '',
                ph2: ph2El ? ph2El.value : '',
                r2: r2El ? r2El.value : '',
                ats: atsEl ? atsEl.value : '',
                sikap: sikapEl ? sikapEl.value : 'Baik',
                kehadiranMapel: (kehadiranEl ? kehadiranEl.value.trim() : '') || '100%',
                nilaiPramuka: nilaiPramuka,
                catatanWali: catatanWali
            });
        });
    });

    const payloadParams = new URLSearchParams();
    payloadParams.append('action', 'save_rapor_data');
    payloadParams.append('data', JSON.stringify({
        kelas: currentRaporKelas,
        semester: currentRaporSemester,
        tahunPelajaran: currentRaporTahun,
        records: records
    }));

    try {
        const res = await fetchWithRetry(SCRIPT_URL, {
            method: 'POST',
            body: payloadParams
        }, 0);

        if (res && res.status === 'success') {
            showToast('✅ Data Rapor Tengah Semester berhasil disimpan!', 'success');
        } else {
            showToast(`❌ Gagal menyimpan: ${res ? res.message : 'Error'}`, 'error');
        }
    } catch (err) {
        console.error('Save Rapor Error:', err);
        showToast('❌ Gagal menghubungi server saat menyimpan nilai: ' + err.message, 'error');
    } finally {
        if (btnSave) {
            btnSave.disabled = false;
            btnSave.innerHTML = origSaveText || `<i class="fa-solid fa-floppy-disk"></i> Simpan Data Rapor`;
        }
        if (btnImport) {
            btnImport.disabled = false;
        }
    }
}

function downloadRaporCSVTemplate() {
    if (!currentRaporKelas || !currentRaporData.students || currentRaporData.students.length === 0) {
        showToast('Muat data kelas terlebih dahulu sebelum mengunduh template.', 'warning');
        return;
    }

    const students = currentRaporData.students;
    const mapelList = currentRaporData.mapelList || [];
    const gradesMap = currentRaporData.gradesMap || {};
    const studentNotesMap = currentRaporData.studentNotesMap || {};

    let csvContent = 'sep=,\n';
    csvContent += 'NISN,NIS,Nama Siswa,Kode Mapel,Nama Mapel,PH1,R1,PH2,R2,ATS,Sikap,Kehadiran,Pramuka,Catatan Wali\n';

    students.forEach(s => {
        const nisn = s.nisn || '';
        const nis = s.nis || '';
        const nama = `"${(s.nama || '').replace(/"/g, '""')}"`;
        const stdNisnClean = cleanId(nisn);
        const stdNisClean = cleanId(nis);

        const stdNotes = studentNotesMap[nisn] || studentNotesMap[nis] || studentNotesMap[stdNisnClean] || studentNotesMap[stdNisClean] || {};
        const pramuka = stdNotes.nilaiPramuka || 'BAIK';
        const catatan = `"${(stdNotes.catatanWali || '').replace(/"/g, '""')}"`;

        mapelList.forEach(m => {
            const mKode = String(m.kode || '').trim();
            const mNama = String(m.nama || '').trim();
            const g = gradesMap[`${nisn}_${mKode}`] ||
                      gradesMap[`${nis}_${mKode}`] ||
                      gradesMap[`${stdNisnClean}_${mKode}`] ||
                      gradesMap[`${stdNisClean}_${mKode}`] ||
                      gradesMap[`${nisn}_${mNama}`] ||
                      { ph1: '', r1: '', ph2: '', r2: '', ats: '', sikap: 'Baik', kehadiran: '100%' };

            const ph1 = g.ph1 !== undefined && g.ph1 !== null ? g.ph1 : '';
            const r1 = g.r1 !== undefined && g.r1 !== null ? g.r1 : '';
            const ph2 = g.ph2 !== undefined && g.ph2 !== null ? g.ph2 : '';
            const r2 = g.r2 !== undefined && g.r2 !== null ? g.r2 : '';
            const ats = g.ats !== undefined && g.ats !== null ? g.ats : '';
            const sikap = g.sikap || 'Baik';
            const kehadiran = g.kehadiran || '100%';

            csvContent += `${nisn},${nis},${nama},${mKode},"${mNama}",${ph1},${r1},${ph2},${r2},${ats},${sikap},${kehadiran},${pramuka},${catatan}\n`;
        });
    });

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Template_Rapor_${currentRaporKelas.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Template CSV Rapor berhasil diunduh.', 'success');
}

function handleRaporCSVUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
        const content = evt.target.result;
        parseAndApplyRaporCSV(content, file.name);
    };
    reader.readAsText(file);
    e.target.value = '';
}

function parseRaporCSVLine(text) {
    let delimiter = ',';
    if (text.includes(';') && !text.includes('","')) {
        delimiter = ';';
    }
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') {
            if (inQuotes && text[i + 1] === '"') {
                cur += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (c === delimiter && !inQuotes) {
            result.push(cur.trim());
            cur = '';
        } else {
            cur += c;
        }
    }
    result.push(cur.trim());
    return result;
}

async function parseAndApplyRaporCSV(csvText, fileName = 'Import_Data.csv') {
    const lines = csvText.split(/\r\n|\n/);
    if (lines.length <= 1) {
        showToast('File CSV kosong atau format salah.', 'error');
        return;
    }

    // 1. Prepare Animated Progress Overlay Modal
    let overlay = document.getElementById('csvImportProgressOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'csvImportProgressOverlay';
        overlay.className = 'csv-import-overlay';
        overlay.innerHTML = `
            <div class="csv-import-card">
                <div class="csv-import-icon-box" id="csvImportIconBox">
                    <div class="csv-import-pulse-ring"></div>
                    <i class="fa-solid fa-file-csv fa-bounce"></i>
                </div>
                <h4 style="margin: 0 0 4px 0; font-size: 1.15rem; font-weight: 700; color: #f8fafc;">Mengimport CSV Nilai Rapor</h4>
                <p style="margin: 0 0 16px 0; font-size: 0.8rem; color: #94a3b8;" id="csvImportFileName">${escapeHtml(fileName)}</p>
                
                <div class="csv-progress-bar-wrap">
                    <div class="csv-progress-bar-fill" id="csvImportProgressBar"></div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; color: #cbd5e1; margin-top: 8px;">
                    <span id="csvImportStatusText">Menganalisis berkas CSV...</span>
                    <strong id="csvImportPercentText" style="color: #60a5fa; font-size: 0.85rem;">0%</strong>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    } else {
        const fnEl = overlay.querySelector('#csvImportFileName');
        if (fnEl) fnEl.textContent = fileName;
    }

    const iconBox = overlay.querySelector('#csvImportIconBox');
    const progressBar = overlay.querySelector('#csvImportProgressBar');
    const statusText = overlay.querySelector('#csvImportStatusText');
    const percentText = overlay.querySelector('#csvImportPercentText');

    if (iconBox) {
        iconBox.className = 'csv-import-icon-box';
        iconBox.innerHTML = `
            <div class="csv-import-pulse-ring"></div>
            <i class="fa-solid fa-file-csv fa-bounce"></i>
        `;
    }
    if (progressBar) progressBar.style.width = '0%';
    if (percentText) percentText.textContent = '0%';
    if (statusText) statusText.textContent = 'Memulai proses import...';

    // Show Overlay with smooth transition
    void overlay.offsetWidth;
    overlay.classList.add('active');

    // Small delay to let modal animate in
    await new Promise(r => setTimeout(r, 200));

    let updatedCount = 0;

    const allGridInputs = Array.from(document.querySelectorAll('.grid-input, .grid-select'));
    const allPramukaSelects = Array.from(document.querySelectorAll('.student-pramuka-select'));
    const allCatatanInputs = Array.from(document.querySelectorAll('.student-catatan-input'));

    const validLines = lines.filter(l => l.trim().length > 0);
    const totalLines = validLines.length - 1; // subtract header

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = parseRaporCSVLine(line);
        if (cols.length < 4) continue;

        const nisn = (cols[0] || '').trim();
        const nis = (cols[1] || '').trim();
        const nama = (cols[2] || '').trim();
        const mapelCode = (cols[3] || cols[4] || '').trim();

        if (!nisn && !nis) continue;

        const ph1 = cols[5] !== undefined ? cols[5] : '';
        const r1 = cols[6] !== undefined ? cols[6] : '';
        const ph2 = cols[7] !== undefined ? cols[7] : '';
        const r2 = cols[8] !== undefined ? cols[8] : '';
        const ats = cols[9] !== undefined ? cols[9] : '';
        const sikap = cols[10] || '';
        const kehadiran = cols[11] || '100%';
        const pramuka = cols[12] || '';
        const catatan = cols[13] || '';

        const nisnClean = cleanId(nisn);
        const nisClean = cleanId(nis);

        const findInput = (field) => {
            return allGridInputs.find(el => {
                const elNisn = (el.dataset.nisn || '').trim();
                const elNisnClean = cleanId(elNisn);
                const elMapel = (el.dataset.mapel || '').trim();
                const elField = (el.dataset.field || '').trim();

                const studentMatches = (nisn && elNisn === nisn) ||
                                       (nis && elNisn === nis) ||
                                       (nisnClean && elNisnClean === nisnClean) ||
                                       (nisClean && elNisnClean === nisClean);
                const mapelMatches = elMapel.toLowerCase() === mapelCode.toLowerCase();

                return studentMatches && mapelMatches && elField === field;
            });
        };

        const ph1El = findInput('ph1');
        const r1El = findInput('r1');
        const ph2El = findInput('ph2');
        const r2El = findInput('r2');
        const atsEl = findInput('ats');
        const sikapEl = findInput('sikap');
        const kehadiranEl = findInput('kehadiran');

        const pramukaEl = allPramukaSelects.find(el => {
            const elNisn = (el.dataset.nisn || '').trim();
            const elNisnClean = cleanId(elNisn);
            return (nisn && elNisn === nisn) ||
                   (nis && elNisn === nis) ||
                   (nisnClean && elNisnClean === nisnClean) ||
                   (nisClean && elNisnClean === nisClean);
        });

        const catatanEl = allCatatanInputs.find(el => {
            const elNisn = (el.dataset.nisn || '').trim();
            const elNisnClean = cleanId(elNisn);
            return (nisn && elNisn === nisn) ||
                   (nis && elNisn === nis) ||
                   (nisnClean && elNisnClean === nisnClean) ||
                   (nisClean && elNisnClean === nisClean);
        });

        if (ph1El) { ph1El.value = ph1; ph1El.dispatchEvent(new Event('input', { bubbles: true })); }
        if (r1El) { r1El.value = r1; r1El.dispatchEvent(new Event('input', { bubbles: true })); }
        if (ph2El) { ph2El.value = ph2; ph2El.dispatchEvent(new Event('input', { bubbles: true })); }
        if (r2El) { r2El.value = r2; r2El.dispatchEvent(new Event('input', { bubbles: true })); }
        if (atsEl) { atsEl.value = ats; atsEl.dispatchEvent(new Event('input', { bubbles: true })); }
        if (sikapEl && sikap) { sikapEl.value = sikap; }
        if (kehadiranEl && kehadiran) { kehadiranEl.value = kehadiran; kehadiranEl.dispatchEvent(new Event('input', { bubbles: true })); }
        if (pramukaEl && pramuka) { pramukaEl.value = pramuka; }
        if (catatanEl && catatan) { catatanEl.value = catatan; }

        if (currentRaporData && currentRaporData.gradesMap) {
            const keysToUpdate = [
                nisn && mapelCode ? `${nisn}_${mapelCode}` : null,
                nis && mapelCode ? `${nis}_${mapelCode}` : null,
                nisnClean && mapelCode ? `${nisnClean}_${mapelCode}` : null,
                nisClean && mapelCode ? `${nisClean}_${mapelCode}` : null,
                nisn && mapelCode ? `${nisn}_${mapelCode.toLowerCase()}` : null,
                nis && mapelCode ? `${nis}_${mapelCode.toLowerCase()}` : null,
                nisnClean && mapelCode ? `${nisnClean}_${mapelCode.toLowerCase()}` : null,
                nisClean && mapelCode ? `${nisClean}_${mapelCode.toLowerCase()}` : null
            ].filter(Boolean);

            keysToUpdate.forEach(key => {
                if (!currentRaporData.gradesMap[key]) {
                    currentRaporData.gradesMap[key] = {};
                }
                const g = currentRaporData.gradesMap[key];
                if (ph1 !== '') g.ph1 = ph1;
                if (r1 !== '') g.r1 = r1;
                if (ph2 !== '') g.ph2 = ph2;
                if (r2 !== '') g.r2 = r2;
                if (ats !== '') g.ats = ats;
                if (sikap !== '') g.sikap = sikap;
            });
        }

        if (currentRaporData && currentRaporData.studentNotesMap) {
            const keyNisn = nisn || nis;
            if (!currentRaporData.studentNotesMap[keyNisn]) {
                currentRaporData.studentNotesMap[keyNisn] = {};
            }
            const n = currentRaporData.studentNotesMap[keyNisn];
            if (pramuka !== '') n.nilaiPramuka = pramuka;
            if (catatan !== '') n.catatanWali = catatan;
        }

        if (ph1El || r1El || ph2El || r2El || atsEl || sikapEl || pramukaEl || catatanEl) {
            updatedCount++;
        }

        // Calculate progress percentage
        const progress = Math.min(100, Math.round((i / (lines.length - 1)) * 100));
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (percentText) percentText.textContent = `${progress}%`;
        if (statusText) statusText.textContent = `Memproses: ${nama || nisn || 'Siswa'} (${mapelCode || 'Nilai'})...`;

        // Smooth visual frame delay for animated progress UI
        if (i % 2 === 0 || totalLines < 20) {
            await new Promise(r => setTimeout(r, 25));
        }
    }

    // 100% Progress Complete State
    if (progressBar) progressBar.style.width = '100%';
    if (percentText) percentText.textContent = '100%';

    if (iconBox) {
        iconBox.className = 'csv-import-icon-box success';
        iconBox.innerHTML = '<i class="fa-solid fa-circle-check" style="font-size: 2.2rem;"></i>';
    }

    if (statusText) {
        statusText.innerHTML = `<strong style="color: #4ade80;">Selesai! ${updatedCount} data diperbarui.</strong>`;
    }

    await new Promise(r => setTimeout(r, 600));

    // Hide Modal Overlay
    overlay.classList.remove('active');

    // Trigger Print Preview Refresh & Notification
    if (updatedCount === 0) {
        showToast('⚠️ Data CSV tidak cocok dengan NISN/NIS/Mapel pada tabel kelas ini.', 'warning');
    } else {
        renderBatchRaporPrintPreview();
        showToast(`✅ CSV berhasil di-import (${updatedCount} entri diperbarui di grid). Klik "Simpan Data Rapor" untuk menyimpan ke server.`, 'success');
    }
}

function computeAttendanceSummaryForClass(kelas, tglAwal = '', tglAkhir = '') {
    const summary = {};
    const selectEl = document.getElementById('selectRaporKelas');
    const targetKls = kelas || currentRaporKelas || (selectEl ? selectEl.value : '') || 'X-1';
    const normK = cleanId(targetKls).toLowerCase().replace(/[\s\-\/]/g, '');

    const classStudentIds = new Set();
    const students = getLocalStudentsForRapor(targetKls);
    if (Array.isArray(students)) {
        students.forEach(s => {
            if (s.nisn) classStudentIds.add(cleanId(s.nisn));
            if (s.nis) classStudentIds.add(cleanId(s.nis));
        });
    }

    let logs = [];

    // Combined log sources
    const sources = [
        window.allLogs,
        window.localAbsensiLogs,
        window.localRecentLogs,
        currentRaporData?.attendanceLogs,
        currentRaporData?.recentLogs
    ];
    sources.forEach(src => {
        if (Array.isArray(src) && src.length > 0) {
            logs = logs.concat(src);
        }
    });

    // Add student leave/permission cache sources (Izin Siswa & Edu-Izin)
    const izinSources = [
        window.globalIzinSiswaLogs,
        window.allIzinSiswa,
        window.localIzinSiswa,
        window.localEduIzin
    ];
    izinSources.forEach(src => {
        if (Array.isArray(src) && src.length > 0) {
            src.forEach(iz => {
                if (iz) {
                    const st = String(iz.status || '').toLowerCase();
                    if (st === 'disetujui' || st === 'approved' || st === 'setuju' || !iz.status) {
                        logs.push({
                            nisn: iz.nisn,
                            nis: iz.nis,
                            kelas: iz.kelas,
                            tanggal: iz.tanggal,
                            status: iz.kategori || iz.status || 'Izin'
                        });
                    }
                }
            });
        }
    });

    const keys = ['smart_absen_recent_logs', 'smart_absen_logs', 'smart_absen_log_absen'];
    for (const k of keys) {
        try {
            const raw = localStorage.getItem(k);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    logs = logs.concat(parsed);
                }
            }
        } catch (e) {}
    }

    const izinLocalStorageKeys = ['smart_absen_izin_siswa_cache', 'smart_absen_edu_izin_cache'];
    for (const k of izinLocalStorageKeys) {
        try {
            const raw = localStorage.getItem(k);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    parsed.forEach(iz => {
                        if (iz) {
                            const st = String(iz.status || '').toLowerCase();
                            if (st === 'disetujui' || st === 'approved' || st === 'setuju' || !iz.status) {
                                logs.push({
                                    nisn: iz.nisn,
                                    nis: iz.nis,
                                    kelas: iz.kelas,
                                    tanggal: iz.tanggal,
                                    status: iz.kategori || iz.status || 'Izin'
                                });
                            }
                        }
                    });
                }
            }
        } catch (e) {}
    }

    if (window.localRecentLogs && Array.isArray(window.localRecentLogs)) {
        logs = logs.concat(window.localRecentLogs);
    }

    if (!Array.isArray(logs) || logs.length === 0) return summary;

    const seenLogKeys = new Set();

    logs.forEach(log => {
        if (!log) return;
        const logK = String(log.kelas || log.rombel || log.Kelas || '').trim().toLowerCase().replace(/[\s\-\/]/g, '');
        const nisn = String(log.nisn || log.NISN || '').trim();
        const nis = String(log.nis || log.NIS || '').trim();
        const nisnClean = cleanId(nisn);
        const nisClean = cleanId(nis);

        const matchClass = (!normK || !logK || logK === normK);
        const matchStudent = (nisnClean && classStudentIds.has(nisnClean)) || (nisClean && classStudentIds.has(nisClean));

        if (matchClass || matchStudent) {
            const rawTgl = String(log.tanggal || log.tgl || log.Tanggal || '').trim();
            const logTgl = (typeof normalizeDateStringToYYYYMMDD === 'function' && rawTgl) ? normalizeDateStringToYYYYMMDD(rawTgl) : rawTgl;

            if (tglAwal && logTgl && logTgl < tglAwal) return;
            if (tglAkhir && logTgl && logTgl > tglAkhir) return;

            const key = nisn || nis;
            const dedupKey = `${logTgl}_${nisnClean || nisClean}_${log.status || log.Status || log.kategori}`;
            if (seenLogKeys.has(dedupKey)) return;
            seenLogKeys.add(dedupKey);

            const keysArr = [nisn, nis, nisnClean, nisClean, key].filter(Boolean);
            keysArr.forEach(k => {
                if (!summary[k]) summary[k] = { S: 0, I: 0, A: 0, T: 0 };
            });

            const status = String(log.status || log.Status || log.keterangan || log.kategori || '').toUpperCase().trim();
            if (status.includes('SAKIT') || status === 'S') {
                keysArr.forEach(k => summary[k].S++);
            } else if (status.includes('IZIN') || status === 'I') {
                keysArr.forEach(k => summary[k].I++);
            } else if (status.includes('ALPA') || status === 'A' || status.includes('TANPA KETERANGAN')) {
                keysArr.forEach(k => summary[k].A++);
            } else if (status.includes('TERLAMBAT') || status.includes('TELAT') || status === 'T') {
                keysArr.forEach(k => summary[k].T++);
            }
        }
    });

    return summary;
}
window.computeAttendanceSummaryForClass = computeAttendanceSummaryForClass;

async function renderBatchRaporPrintPreview() {
    const printArea = document.getElementById('raporPrintArea');
    if (!printArea) return;

    try {
        let students = currentRaporData.students || [];
        const selectKelas = document.getElementById('selectRaporKelas');
        const targetKls = (selectKelas && selectKelas.value.trim()) ? selectKelas.value.trim() : (currentRaporKelas || 'X-1');
        currentRaporKelas = targetKls;

        // If students array is empty, fallback to local memory/sample data immediately
        if (students.length === 0) {
            students = getLocalStudentsForRapor(targetKls);
            currentRaporData.students = students;
            if (!currentRaporData.mapelList || currentRaporData.mapelList.length === 0) {
                currentRaporData.mapelList = getLocalMapelListForRapor(targetKls);
            }
        }

        let mapelList = currentRaporData.mapelList || [];
        if (mapelList.length === 0) {
            mapelList = getLocalMapelListForRapor(currentRaporKelas);
            currentRaporData.mapelList = mapelList;
        }

        const inputJudul = document.getElementById('inputRaporJudulDokumen');
        const judulDokumen = (inputJudul && inputJudul.value.trim()) ? inputJudul.value.trim() : 'LAPORAN HASIL ASESMEN TENGAH SEMESTER';

        const tglAwal = document.getElementById('inputRaporTglAwal')?.value || '';
        const tglAkhir = document.getElementById('inputRaporTglAkhir')?.value || '';
        const calculatedAttSummary = computeAttendanceSummaryForClass(currentRaporKelas, tglAwal, tglAkhir);

        const config = currentRaporData.config || JSON.parse(localStorage.getItem('smart_absen_config') || '{}');
        const inputTahun = document.getElementById('inputRaporTahunPelajaran');
        const tpFromSheet = config.tahunPelajaran || config.tahun_pelajaran || config.tahunAjaran || config.tahun_ajaran;
        if (inputTahun && tpFromSheet && !inputTahun.value.trim()) {
            inputTahun.value = tpFromSheet;
        }
        const tahunPelajaranAktif = (inputTahun && inputTahun.value.trim()) ? inputTahun.value.trim() : (tpFromSheet || currentRaporTahun || '2025/2026');
        currentRaporTahun = tahunPelajaranAktif;

        const waliKelasInfo = currentRaporData.waliKelasInfo || { nama: '', nip: '' };
        const serverAttSummary = currentRaporData.attendanceSummaryMap || {};
        const attendanceSummaryMap = {};
        const allAttKeys = new Set([...Object.keys(calculatedAttSummary), ...Object.keys(serverAttSummary)]);
        allAttKeys.forEach(k => {
            const c = calculatedAttSummary[k] || {};
            const s = serverAttSummary[k] || {};
            attendanceSummaryMap[k] = {
                S: Math.max(c.S || 0, s.S || 0),
                I: Math.max(c.I || 0, s.I || 0),
                A: Math.max(c.A || 0, s.A || 0),
                T: Math.max(c.T || 0, s.T || 0)
            };
        });
        const studentNotesMap = currentRaporData.studentNotesMap || {};
        const gradesMap = currentRaporData.gradesMap || {};

        const schoolName = config.namaSekolah || config.kopSekolah || 'SMA 1 BARUNAWATI';
        const kopYayasan = config.kopYayasan || 'YAYASAN SEKAR LAUT PELNI';
        const kopAlamat = config.kopAlamat || 'Jl. X-III Aipda KS Tubun II/III No.7, Slipi Palmerah, Jakarta Barat';
        const kopLogo = config.kopLogo || '';
        
        // 1. Extract Kepala Sekolah name from input textbox
        const inputKepsek = document.getElementById('inputRaporNamaKepsek');
        const namaKepsek = (inputKepsek && inputKepsek.value.trim()) ? inputKepsek.value.trim() : (config.namaKepalaSekolah || config.namaKepsek || 'Suparyono, M.Pd');
        const nipKepsek = config.nipKepalaSekolah || '19750812 200003 1 002';

        // 2. Extract Wali Kelas name strictly from session login user (smart_absen_user or currentUser)
        const loggedUser = JSON.parse(localStorage.getItem('smart_absen_user') || '{}');
        const currentUserObj = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : loggedUser;
        const namaWali = currentUserObj.nama || currentUserObj.name || loggedUser.nama || loggedUser.name || waliKelasInfo.nama || 'Wali Kelas';
        const nipWali = currentUserObj.nip || loggedUser.nip || waliKelasInfo.nip || '-';

        const todayStr = getFormattedIndonesianDate(new Date());

        if (currentRaporPageIndex >= students.length) {
            currentRaporPageIndex = 0;
        }

        let html = `
            <div class="no-print" style="display: flex; align-items: center; justify-content: space-between; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(10px); border: 1px solid var(--card-border); padding: 10px 18px; border-radius: 12px; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <button type="button" id="btnRaporPageFirst" onclick="changeRaporPage(0)" class="btn-secondary" ${currentRaporPageIndex === 0 ? 'disabled' : ''} style="padding: 6px 12px; font-size: 0.82rem;" title="Halaman Pertama">
                        <i class="fa-solid fa-backward-step"></i> Awal
                    </button>
                    <button type="button" id="btnRaporPagePrev" onclick="changeRaporPage(${currentRaporPageIndex - 1})" class="btn-secondary" ${currentRaporPageIndex === 0 ? 'disabled' : ''} style="padding: 6px 14px; font-size: 0.82rem;">
                        <i class="fa-solid fa-chevron-left"></i> Prev
                    </button>
                </div>

                <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: center;">
                    <div id="raporPageNavInfo" style="font-weight: 500; color: #f8fafc; font-size: 0.9rem; white-space: nowrap;">
                        Siswa <span style="color: #38bdf8; font-weight: bold;">${currentRaporPageIndex + 1}</span> dari <span style="color: #38bdf8; font-weight: bold;">${students.length}</span>
                    </div>
                    <select id="raporSelectStudentNav" onchange="changeRaporPage(parseInt(this.value))" style="background: rgba(0,0,0,0.4); border: 1px solid var(--card-border); color: #f8fafc; padding: 5px 12px; border-radius: 8px; font-size: 0.85rem; max-width: 250px;">
                        ${students.map((s, i) => `<option value="${i}" ${i === currentRaporPageIndex ? 'selected' : ''}>${i + 1}. ${escapeHtml(s.nama)}</option>`).join('')}
                    </select>
                </div>

                <div style="display: flex; align-items: center; gap: 6px;">
                    <button type="button" id="btnRaporPageNext" onclick="changeRaporPage(${currentRaporPageIndex + 1})" class="btn-secondary" ${currentRaporPageIndex >= students.length - 1 ? 'disabled' : ''} style="padding: 6px 14px; font-size: 0.82rem;">
                        Next <i class="fa-solid fa-chevron-right"></i>
                    </button>
                    <button type="button" id="btnRaporPageLast" onclick="changeRaporPage(${students.length - 1})" class="btn-secondary" ${currentRaporPageIndex >= students.length - 1 ? 'disabled' : ''} style="padding: 6px 12px; font-size: 0.82rem;" title="Halaman Akhir">
                        Akhir <i class="fa-solid fa-forward-step"></i>
                    </button>
                </div>
            </div>
        `;

        const inputMap = new Map();
        const gridContainerEl = document.getElementById('raporDataGridContainer') || document.getElementById('raporInputGridContainer');
        if (gridContainerEl) {
            const inputs = gridContainerEl.querySelectorAll('.grid-input, .grid-select, .student-pramuka-select, .student-catatan-input');
            inputs.forEach(el => {
                const nisn = (el.dataset.nisn || '').trim();
                const nis = (el.dataset.nis || '').trim();
                const mapel = (el.dataset.mapel || '').trim().toLowerCase();
                let field = (el.dataset.field || '').trim();
                if (!field) {
                    if (el.classList.contains('student-pramuka-select')) field = 'pramuka';
                    if (el.classList.contains('student-catatan-input')) field = 'catatan';
                }
                const nisnClean = cleanId(nisn);
                const nisClean = cleanId(nis);

                const keys = [nisn, nis, nisnClean, nisClean].filter(Boolean);
                keys.forEach(k => {
                    if (mapel) {
                        inputMap.set(`${k}:${mapel}:${field}`, el.value);
                    } else {
                        inputMap.set(`${k}:${field}`, el.value);
                    }
                });
            });
        }

        students.forEach((std, idx) => {
            const stdNisn = String(std.nisn || '').trim();
            const stdNis = String(std.nis || '').trim();
            const stdNisnClean = cleanId(stdNisn);
            const stdNisClean = cleanId(stdNis);
            const nisnKey = stdNisn || stdNis;

            const stdAtt = attendanceSummaryMap[stdNisn] ||
                           attendanceSummaryMap[stdNis] ||
                           attendanceSummaryMap[stdNisnClean] ||
                           attendanceSummaryMap[stdNisClean] ||
                           attendanceSummaryMap[nisnKey] ||
                           { S: 0, I: 0, A: 0, T: 0 };

            const stdNotes = studentNotesMap[stdNisn] ||
                             studentNotesMap[stdNis] ||
                             studentNotesMap[stdNisnClean] ||
                             studentNotesMap[stdNisClean] ||
                             studentNotesMap[nisnKey] || {};

            const findStudentVal = (field) => {
                const keys = [stdNisn, stdNis, stdNisnClean, stdNisClean, nisnKey].filter(Boolean);
                for (let k of keys) {
                    const val = inputMap.get(`${k}:${field}`);
                    if (val !== undefined && val !== null) return val;
                }
                return null;
            };

            const pramukaVal = findStudentVal('pramuka');
            const catatanVal = findStudentVal('catatan');

            const nilaiPramuka = pramukaVal !== null ? pramukaVal : (stdNotes.nilaiPramuka || 'BAIK');
            const catatanWali = (catatanVal !== null ? catatanVal : stdNotes.catatanWali) || 'Tingkatkan terus prestasi belajar dan kedisiplinan.';
            const isCurrentPage = (idx === currentRaporPageIndex);

            const cleanKlsUpper = String(currentRaporKelas || '').trim().toUpperCase();
            const isFaseF = /(^|\b)(XI|XII|11|12)(\b|$)/i.test(cleanKlsUpper) || cleanKlsUpper.includes('XI') || cleanKlsUpper.includes('XII');
            const faseKelas = isFaseF ? 'F' : 'E';

            // Payloads for QR Verification Code (Nama, NIS, NISN)
            const qrTextPayload = `Nama: ${std.nama}\nNIS: ${std.nis || '-'}\nNISN: ${std.nisn || '-'}`;
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrTextPayload)}`;

            html += `
                <div class="rapor-page-card ${isCurrentPage ? 'active-page' : 'hidden-page'}" data-page-index="${idx}" style="page-break-after: always; padding: 25px 30px; font-family: 'Times New Roman', Times, serif; color: #000; background: #fff; max-width: 210mm; margin: 0 auto 30px auto; border: 1px solid #ddd; box-sizing: border-box;">
                    <!-- KOP RAPOR -->
                    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 15px;">
                        <div style="width: 75px; text-align: center;">
                            ${kopLogo ? `<img src="${kopLogo}" style="max-width: 70px; max-height: 70px; object-fit: contain;">` : `<i class="fa-solid fa-graduation-cap" style="font-size: 40px; color: #333;"></i>`}
                        </div>
                        <div style="flex: 1; text-align: center; padding: 0 10px;">
                            <h4 style="margin: 0; font-size: 11pt; font-weight: bold; text-transform: uppercase;">${escapeHtml(kopYayasan)}</h4>
                            <h3 style="margin: 2px 0; font-size: 14pt; font-weight: bold; text-transform: uppercase;">${escapeHtml(schoolName)}</h3>
                            <p style="margin: 0; font-size: 8.5pt; font-style: italic;">${escapeHtml(kopAlamat)}</p>
                        </div>
                        <div style="width: 75px;"></div>
                    </div>

                    <!-- JUDUL DOKUMEN -->
                    <div style="text-align: center; margin-bottom: 15px;">
                        <h4 style="margin: 0; font-size: 12pt; font-weight: bold; text-decoration: underline; text-transform: uppercase;">${escapeHtml(judulDokumen)}</h4>
                        <p style="margin: 2px 0 0 0; font-size: 9.5pt;">Tahun Pelajaran: ${escapeHtml(currentRaporTahun || '2025/2026')} | Semester: ${escapeHtml(currentRaporSemester === '1' ? 'Ganjil (1)' : 'Genap (2)')}</p>
                    </div>

                    <!-- BIODATA SISWA + QR CODE (SAMPING KELAS & FASE) -->
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; gap: 10px;">
                        <table class="rapor-biodata-table" style="flex: 1; font-size: 9.5pt; line-height: 1.45; border-collapse: collapse; border: none !important;">
                            <tr>
                                <td style="width: 14%; border: none !important; padding: 2px 0; white-space: nowrap;">Nama Siswa</td>
                                <td style="width: 2%; border: none !important; padding: 2px 0;">:</td>
                                <td style="width: 54%; font-weight: bold; border: none !important; padding: 2px 0; word-break: break-word;">${escapeHtml(std.nama)}</td>
                                <td style="width: 10%; border: none !important; padding: 2px 0; white-space: nowrap;">Kelas</td>
                                <td style="width: 2%; border: none !important; padding: 2px 0;">:</td>
                                <td style="width: 18%; font-weight: bold; border: none !important; padding: 2px 0;">${escapeHtml(currentRaporKelas || std.kelas || targetKls || '-')}</td>
                            </tr>
                            <tr>
                                <td style="border: none !important; padding: 2px 0; white-space: nowrap;">NIS / NISN</td>
                                <td style="border: none !important; padding: 2px 0;">:</td>
                                <td style="border: none !important; padding: 2px 0;">${escapeHtml(std.nis || '-')} / ${escapeHtml(std.nisn || '-')}</td>
                                <td style="border: none !important; padding: 2px 0; white-space: nowrap;">Fase</td>
                                <td style="border: none !important; padding: 2px 0;">:</td>
                                <td style="font-weight: bold; border: none !important; padding: 2px 0;">${faseKelas}</td>
                            </tr>
                        </table>
                        <div style="width: 54px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; margin-left: 6px;">
                            <img src="${qrCodeUrl}" alt="QR Siswa" style="width: 48px; height: 48px; object-fit: contain; border: 1px solid #bbb; padding: 1.5px; background: #fff;" title="Scan untuk Verifikasi Siswa">
                            <span style="font-size: 5pt; font-family: Arial, sans-serif; color: #444; margin-top: 1px; font-weight: bold; letter-spacing: 0.2px;">VERIFIKASI</span>
                        </div>
                    </div>

                    <!-- TABEL NILAI MATA PELAJARAN -->
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 9.5pt;">
                        <thead>
                            <tr style="text-align: center; font-weight: bold;">
                                <th rowspan="2" style="border: 1px solid #000; padding: 5px; width: 30px;">NO</th>
                                <th rowspan="2" style="border: 1px solid #000; padding: 5px; text-align: left;">MATA PELAJARAN</th>
                                <th colspan="5" style="border: 1px solid #000; padding: 3px;">NILAI</th>
                                <th rowspan="2" style="border: 1px solid #000; padding: 5px; width: 75px;">SIKAP</th>
                                <th rowspan="2" style="border: 1px solid #000; padding: 5px; width: 85px;">KEHADIRAN</th>
                            </tr>
                            <tr style="text-align: center; font-weight: bold;">
                                <th style="border: 1px solid #000; padding: 3px; width: 42px;">PH 1</th>
                                <th style="border: 1px solid #000; padding: 3px; width: 42px;">R</th>
                                <th style="border: 1px solid #000; padding: 3px; width: 42px;">PH 2</th>
                                <th style="border: 1px solid #000; padding: 3px; width: 42px;">R</th>
                                <th style="border: 1px solid #000; padding: 3px; width: 48px;">ATS</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            mapelList.forEach((m, mIdx) => {
                const mKode = String(m.kode || m.nama || '').trim();
                const mNama = String(m.nama || '').trim();

                const findVal = (field) => {
                    const keys = [stdNisn, stdNis, stdNisnClean, stdNisClean, nisnKey].filter(Boolean);
                    const mapels = [mKode, mNama, m.kode].filter(Boolean);
                    for (let k of keys) {
                        for (let mp of mapels) {
                            const val = inputMap.get(`${k}:${mp.toLowerCase()}:${field}`);
                            if (val !== undefined && val !== null) return val;
                        }
                    }
                    return null;
                };

                const ph1Val = findVal('ph1');
                const r1Val = findVal('r1');
                const ph2Val = findVal('ph2');
                const r2Val = findVal('r2');
                const atsVal = findVal('ats');
                const sikapVal = findVal('sikap');
                const kehadiranVal = findVal('kehadiran');

                const memG = gradesMap[`${stdNisn}_${mKode}`] ||
                             gradesMap[`${stdNis}_${mKode}`] ||
                             gradesMap[`${stdNisnClean}_${mKode}`] ||
                             gradesMap[`${stdNisClean}_${mKode}`] ||
                             gradesMap[`${stdNisn}_${mNama}`] ||
                             gradesMap[`${stdNis}_${mNama}`] ||
                             gradesMap[`${stdNisnClean}_${mNama}`] ||
                             gradesMap[`${stdNisClean}_${mNama}`] ||
                             gradesMap[`${stdNisn}_${mKode.toLowerCase()}`] ||
                             gradesMap[`${stdNis}_${mKode.toLowerCase()}`] ||
                             gradesMap[`${stdNisnClean}_${mKode.toLowerCase()}`] ||
                             gradesMap[`${stdNisClean}_${mKode.toLowerCase()}`] || {};

                const ph1 = ph1Val !== null ? ph1Val : (memG.ph1 !== undefined ? memG.ph1 : '');
                const r1 = r1Val !== null ? r1Val : (memG.r1 !== undefined ? memG.r1 : '');
                const ph2 = ph2Val !== null ? ph2Val : (memG.ph2 !== undefined ? memG.ph2 : '');
                const r2 = r2Val !== null ? r2Val : (memG.r2 !== undefined ? memG.r2 : '');
                const ats = atsVal !== null ? atsVal : (memG.ats !== undefined ? memG.ats : '');
                const sikap = sikapVal !== null ? sikapVal : (memG.sikap || 'Baik');
                const kehadiran = (kehadiranVal !== null ? kehadiranVal.trim() : memG.kehadiran) || '100%';

                html += `
                    <tr>
                        <td style="border: 1px solid #000; padding: 4px; text-align: center;">${mIdx + 1}</td>
                        <td style="border: 1px solid #000; padding: 4px 6px;">${escapeHtml(m.nama)}</td>
                        <td style="border: 1px solid #000; padding: 4px; text-align: center;">${ph1 || '-'}</td>
                        <td style="border: 1px solid #000; padding: 4px; text-align: center;">${r1 || '-'}</td>
                        <td style="border: 1px solid #000; padding: 4px; text-align: center;">${ph2 || '-'}</td>
                        <td style="border: 1px solid #000; padding: 4px; text-align: center;">${r2 || '-'}</td>
                        <td style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold;">${ats || '-'}</td>
                        <td style="border: 1px solid #000; padding: 4px; text-align: center;">${escapeHtml(sikap)}</td>
                        <td style="border: 1px solid #000; padding: 4px; text-align: center;">${escapeHtml(kehadiran)}</td>
                    </tr>
                `;
            });

            html += `
                        </tbody>
                    </table>

                    <!-- KETERANGAN EKSTRAKURIKULER PRAMUKA -->
                    <div style="margin-bottom: 10px;">
                        <strong style="font-size: 9.5pt; display: block; margin-bottom: 3px;">EKSTRAKURIKULER PRAMUKA:</strong>
                        <div style="border: 1px solid #000; padding: 6px 10px; font-size: 9.5pt; font-weight: bold; background: #fafafa;">
                            ${escapeHtml(nilaiPramuka)}
                        </div>
                    </div>

                    <!-- REKAP KETIDAKHADIRAN & CATATAN -->
                    <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                        <div style="width: 45%;">
                            <strong style="font-size: 9.5pt; display: block; margin-bottom: 3px;">KETIDAKHADIRAN:</strong>
                            <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
                                <tr>
                                    <td style="border: 1px solid #000; padding: 4px 8px;">1. Sakit (S)</td>
                                    <td style="border: 1px solid #000; padding: 4px 8px; text-align: center; width: 50px;">${stdAtt.S || 0} hari</td>
                                </tr>
                                <tr>
                                    <td style="border: 1px solid #000; padding: 4px 8px;">2. Izin (I)</td>
                                    <td style="border: 1px solid #000; padding: 4px 8px; text-align: center;">${stdAtt.I || 0} hari</td>
                                </tr>
                                <tr>
                                    <td style="border: 1px solid #000; padding: 4px 8px;">3. Tanpa Keterangan (A)</td>
                                    <td style="border: 1px solid #000; padding: 4px 8px; text-align: center;">${stdAtt.A || 0} hari</td>
                                </tr>
                                <tr>
                                    <td style="border: 1px solid #000; padding: 4px 8px;">4. Terlambat (T)</td>
                                    <td style="border: 1px solid #000; padding: 4px 8px; text-align: center;">${stdAtt.T || 0} kali</td>
                                </tr>
                            </table>
                        </div>
                        <div style="flex: 1;">
                            <strong style="font-size: 9.5pt; display: block; margin-bottom: 3px;">CATATAN WALI KELAS:</strong>
                            <div style="border: 1px solid #000; padding: 6px 10px; font-size: 9pt; min-height: 65px; box-sizing: border-box; font-style: italic;">
                                "${escapeHtml(catatanWali)}"
                            </div>
                        </div>
                    </div>

                    <!-- TATA LETAK 3 TANDA TANGAN -->
                    <div style="margin-top: 35px;">
                        <table class="rapor-signature-table" style="width: 100%; text-align: center; font-size: 9.5pt; border-collapse: collapse; border: none !important;">
                            <tr>
                                <td style="width: 33%; vertical-align: top; border: none !important; border-color: transparent !important; padding: 0 4px;">
                                    <div style="margin-bottom: 2px;">&nbsp;</div>
                                    <strong>Orang Tua / Wali Murid</strong>
                                    <div style="height: 75px;"></div>
                                    <div>_______________________</div>
                                </td>
                                <td style="width: 34%; vertical-align: top; border: none !important; border-color: transparent !important; padding: 0 4px;">
                                    <div style="margin-bottom: 2px;">Mengetahui,</div>
                                    <strong>Kepala Sekolah</strong>
                                    <div style="height: 75px;"></div>
                                    <div><strong style="text-decoration: underline;">${escapeHtml(namaKepsek)}</strong></div>
                                </td>
                                <td style="width: 33%; vertical-align: top; border: none !important; border-color: transparent !important; padding: 0 4px;">
                                    <div style="margin-bottom: 2px;">Jakarta, ${todayStr}</div>
                                    <strong>Wali Kelas</strong>
                                    <div style="height: 75px;"></div>
                                    <div><strong style="text-decoration: underline;">${escapeHtml(namaWali)}</strong></div>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            `;
        });

        printArea.innerHTML = html;
    } catch (err) {
        console.error('Error rendering batch rapor print preview:', err);
        printArea.innerHTML = `
            <div style="text-align: center; color: #f87171; padding: 30px;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; display: block; margin-bottom: 10px;"></i>
                Gagal memuat pratinjau: ${escapeHtml(err.message)}
            </div>
        `;
    }
}

async function downloadRaporPDFDirectly() {
    const selectKelas = document.getElementById('selectRaporKelas');
    const targetKls = (selectKelas && selectKelas.value.trim()) ? selectKelas.value.trim() : (currentRaporKelas || 'X-1');
    const filename = `Rapor_Tengah_Semester_${targetKls.replace(/\s+/g, '_')}_TP${(currentRaporTahun || '2025-2026').replace(/\//g, '-')}.pdf`;

    const printArea = document.getElementById('raporPrintArea');
    if (!printArea) {
        showToast('Elemen pratinjau rapor tidak ditemukan.', 'error');
        return;
    }

    // 1. Ensure html2pdf library is available
    if (typeof html2pdf === 'undefined') {
        showToast('Memuat pustaka PDF...', 'info');
        try {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        } catch (e) {
            showToast('Gagal memuat pustaka PDF. Menggunakan dialog print browser.', 'warning');
            window.print();
            return;
        }
    }

    const btn = document.getElementById('btnDownloadRaporPDF');
    const origHtml = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses PDF...';
    }

    showToast('📄 Sedang mengonversi pratinjau rapor (Live Preview) menjadi berkas PDF...', 'info');

    // Make sure latest data and DOM preview are rendered
    await renderBatchRaporPrintPreview();

    // Preserve original DOM state for seamless restoration after capture
    const mobileBar = document.getElementById('mobileTopBar');
    const origMobileBarDisplay = mobileBar ? mobileBar.style.display : '';
    if (mobileBar) mobileBar.style.display = 'none';

    const originalPrintAreaStyle = printArea.getAttribute('style') || '';
    const noPrintEls = printArea.querySelectorAll('.no-print');
    const pageCards = printArea.querySelectorAll('.rapor-page-card');

    const originalNoPrintDisplays = [];
    noPrintEls.forEach(el => {
        originalNoPrintDisplays.push({ el, display: el.style.display });
        el.style.display = 'none';
    });

    const originalCardStyles = [];
    pageCards.forEach((card, index) => {
        originalCardStyles.push({
            el: card,
            display: card.style.display,
            visibility: card.style.visibility,
            opacity: card.style.opacity,
            className: card.className,
            background: card.style.background,
            color: card.style.color,
            margin: card.style.margin,
            padding: card.style.padding,
            boxShadow: card.style.boxShadow,
            border: card.style.border
        });

        // Unhide and standardize every student page card for exact PDF capture
        card.classList.remove('hidden-page');
        card.classList.add('active-page');
        card.style.display = 'block';
        card.style.visibility = 'visible';
        card.style.opacity = '1';
        card.style.background = '#ffffff';
        card.style.color = '#000000';
        card.style.margin = '0 0 15px 0';
        card.style.padding = '20px 25px';
        card.style.boxShadow = 'none';
        card.style.border = 'none';

        // Enforce high-contrast black text & light background on all descendants
        const childEls = card.querySelectorAll('*');
        childEls.forEach(c => {
            c.style.color = '#000000';
            const isNoBorderTable = c.closest('.rapor-biodata-table') || c.closest('.rapor-signature-table');
            if (isNoBorderTable) {
                c.style.border = 'none';
                c.style.borderColor = 'transparent';
            } else if (c.tagName === 'TH') {
                c.style.backgroundColor = '#f0f0f0';
                c.style.borderColor = '#000000';
            } else if (c.tagName === 'TD') {
                c.style.borderColor = '#000000';
            }
        });

        if (index < pageCards.length - 1) {
            card.style.pageBreakAfter = 'always';
            card.style.breakAfter = 'page';
        }
    });

    printArea.style.background = '#ffffff';
    printArea.style.color = '#000000';
    printArea.style.padding = '10px';
    printArea.style.border = 'none';

    try {
        const opt = {
            margin:       [8, 8, 8, 8],
            filename:     filename,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { 
                scale: 2, 
                useCORS: true, 
                logging: false, 
                backgroundColor: '#ffffff',
                scrollY: 0,
                scrollX: 0
            },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak:    { mode: ['css', 'legacy'] }
        };

        await html2pdf().set(opt).from(printArea).save();

        showToast(`✅ Berhasil mengunduh PDF Rapor (${filename})!`, 'success');
    } catch (err) {
        console.error('Error direct PDF download:', err);
        showToast('Gagal mengunduh PDF: ' + err.message + '. Menggunakan dialog print...', 'error');
        window.print();
    } finally {
        if (mobileBar) mobileBar.style.display = origMobileBarDisplay;

        // Restore live preview screen UI state perfectly
        printArea.setAttribute('style', originalPrintAreaStyle);

        originalNoPrintDisplays.forEach(item => {
            item.el.style.display = item.display;
        });

        originalCardStyles.forEach(item => {
            item.el.className = item.className;
            item.el.style.display = item.display;
            item.el.style.visibility = item.visibility;
            item.el.style.opacity = item.opacity;
            item.el.style.background = item.background;
            item.el.style.color = item.color;
            item.el.style.margin = item.margin;
            item.el.style.padding = item.padding;
            item.el.style.boxShadow = item.boxShadow;
            item.el.style.border = item.border;
        });

        if (typeof changeRaporPage === 'function') {
            changeRaporPage(currentRaporPageIndex);
        }

        if (btn) {
            btn.disabled = false;
            btn.innerHTML = origHtml;
        }
    }
}
