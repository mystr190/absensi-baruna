// =========================================================================
// REKAP ABSENSI KEHADIRAN SISWA (BULANAN & RENTANG BULAN / SEMESTER)
// =========================================================================

function parseLogYearMonthDate(dateStr) {
    if (!dateStr) return { year: 0, month: 0, dateFormatted: '' };
    let s = String(dateStr).trim();
    if (s.includes('T')) s = s.split('T')[0];
    else if (s.includes(' ')) s = s.split(' ')[0];

    let year = 0, month = 0, day = 0;
    if (s.includes('-')) {
        const parts = s.split('-');
        if (parts.length === 3) {
            if (parts[0].length === 4) {
                year = parseInt(parts[0], 10);
                month = parseInt(parts[1], 10);
                day = parseInt(parts[2], 10);
            } else if (parts[2].length === 4) {
                year = parseInt(parts[2], 10);
                month = parseInt(parts[1], 10);
                day = parseInt(parts[0], 10);
            }
        }
    } else if (s.includes('/')) {
        const parts = s.split('/');
        if (parts.length === 3) {
            if (parts[2].length === 4) {
                year = parseInt(parts[2], 10);
                month = parseInt(parts[0], 10);
                day = parseInt(parts[1], 10);
                if (month > 12) {
                    const tmp = month;
                    month = day;
                    day = tmp;
                }
            } else if (parts[0].length === 4) {
                year = parseInt(parts[0], 10);
                month = parseInt(parts[1], 10);
                day = parseInt(parts[2], 10);
            }
        }
    }

    const mm = month < 10 ? '0' + month : '' + month;
    const dd = day < 10 ? '0' + day : '' + day;
    const dateFormatted = (year > 0 && month > 0 && day > 0) ? `${year}-${mm}-${dd}` : s;

    return { year, month, dateFormatted };
}

let matrixTypeState = 'single'; // 'single' atau 'range'
let matrixMonthStart = new Date().getMonth() + 1;
let matrixMonthEnd = new Date().getMonth() + 1;
let matrixYearState = new Date().getFullYear();
let matrixClassState = '';
let matrixHariEfektifState = 21;

// Elements
const selectMatrixType = document.getElementById('selectMatrixType');
const selectMatrixBulan = document.getElementById('selectMatrixBulan');
const selectMatrixBulanSelesai = document.getElementById('selectMatrixBulanSelesai');
const containerBulanSelesai = document.getElementById('containerBulanSelesai');
const lblMatrixBulanMulai = document.getElementById('lblMatrixBulanMulai');
const inputMatrixTahun = document.getElementById('inputMatrixTahun');
const selectMatrixKelas = document.getElementById('selectMatrixKelas');
const inputMatrixHariEfektif = document.getElementById('inputMatrixHariEfektif');
const checkHideRedDates = document.getElementById('checkHideRedDates');
const btnPrintMatrix = document.getElementById('btnPrintMatrix');
const btnExportMatrix = document.getElementById('btnExportMatrix');
const matrixTableContainer = document.getElementById('matrixTableContainer');

const NAMA_BULAN_INDO = [
    'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
    'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
];

// Event Listeners Initialization
window.addEventListener('DOMContentLoaded', () => {
    initMatrixFilters();
});

function initMatrixFilters() {
    const today = new Date();
    
    // Set default month & year
    if (selectMatrixBulan) selectMatrixBulan.value = today.getMonth() + 1;
    if (selectMatrixBulanSelesai) selectMatrixBulanSelesai.value = Math.min(12, today.getMonth() + 1);
    if (inputMatrixTahun) inputMatrixTahun.value = today.getFullYear();
    
    // Toggle Mode Single vs Range
    if (selectMatrixType) {
        selectMatrixType.addEventListener('change', () => {
            const isRange = selectMatrixType.value === 'range';
            if (containerBulanSelesai) containerBulanSelesai.style.display = isRange ? 'block' : 'none';
            if (lblMatrixBulanMulai) lblMatrixBulanMulai.textContent = isRange ? 'Dari Bulan:' : 'Bulan:';
            updateCalculatedHariEfektif();
            renderMatrixReport();
        });
    }

// Auto calculate hari efektif
updateCalculatedHariEfektif();

    if (selectMatrixBulan) {
        selectMatrixBulan.addEventListener('change', () => {
            updateCalculatedHariEfektif();
            renderMatrixReport();
        });
    }

    if (selectMatrixBulanSelesai) {
        selectMatrixBulanSelesai.addEventListener('change', () => {
            updateCalculatedHariEfektif();
            renderMatrixReport();
        });
    }

    if (inputMatrixTahun) {
        inputMatrixTahun.addEventListener('change', () => {
            updateCalculatedHariEfektif();
            renderMatrixReport();
        });
    }

    if (selectMatrixKelas) {
        selectMatrixKelas.addEventListener('change', () => {
            renderMatrixReport();
        });
    }

    if (checkHideRedDates) {
        checkHideRedDates.addEventListener('change', () => {
            updateCalculatedHariEfektif();
            renderMatrixReport();
        });
    }

    if (inputMatrixHariEfektif) {
        inputMatrixHariEfektif.addEventListener('change', () => {
            matrixHariEfektifState = Math.max(1, parseInt(inputMatrixHariEfektif.value) || 21);
            renderMatrixReport();
        });
    }

    if (btnPrintMatrix) {
        btnPrintMatrix.addEventListener('click', () => {
            window.print();
        });
    }

    if (btnExportMatrix) {
        btnExportMatrix.addEventListener('click', () => {
            exportMatrixToCSV();
        });
    }
}

function updateCalculatedHariEfektif() {
    const isRange = selectMatrixType && selectMatrixType.value === 'range';
    const mStart = parseInt(selectMatrixBulan ? selectMatrixBulan.value : (new Date().getMonth() + 1));
    const mEnd = isRange ? parseInt(selectMatrixBulanSelesai ? selectMatrixBulanSelesai.value : mStart) : mStart;
    const year = parseInt(inputMatrixTahun ? inputMatrixTahun.value : new Date().getFullYear());

    let totalEffectiveDays = 0;
    const startM = Math.min(mStart, mEnd);
    const endM = Math.max(mStart, mEnd);

    for (let m = startM; m <= endM; m++) {
        const totalDaysInMonth = new Date(year, m, 0).getDate();
        const holidaysMap = typeof getHolidaysMapForMonth === 'function' ? getHolidaysMapForMonth(year, m) : new Map();
        const mStr = m < 10 ? '0' + m : '' + m;

        for (let day = 1; day <= totalDaysInMonth; day++) {
            const dateObj = new Date(year, m - 1, day);
            const dayOfWeek = dateObj.getDay();
            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

            const dayStr = day < 10 ? '0' + day : '' + day;
            const fullDateStr = `${year}-${mStr}-${dayStr}`;
            const isHoliday = holidaysMap.has(fullDateStr);

            if (!isWeekend && !isHoliday) {
                totalEffectiveDays++;
            }
        }
    }

    matrixHariEfektifState = totalEffectiveDays > 0 ? totalEffectiveDays : 20;
    if (inputMatrixHariEfektif) {
        inputMatrixHariEfektif.value = matrixHariEfektifState;
        inputMatrixHariEfektif.dataset.autoManaged = "true";
    }
}

// MAIN RENDER MATRIX REPORT FUNGSI
async function renderMatrixReport() {
    if (!matrixTableContainer) return;

    const mode = selectMatrixType ? selectMatrixType.value : 'single';
    const mStart = parseInt(selectMatrixBulan ? selectMatrixBulan.value : (new Date().getMonth() + 1));
    const mEnd = mode === 'range' ? parseInt(selectMatrixBulanSelesai ? selectMatrixBulanSelesai.value : mStart) : mStart;
    const year = parseInt(inputMatrixTahun ? inputMatrixTahun.value : new Date().getFullYear());
    const targetKelas = selectMatrixKelas ? selectMatrixKelas.value.trim() : '';
    const hideRed = checkHideRedDates ? checkHideRedDates.checked : true;

    matrixTypeState = mode;
    matrixMonthStart = Math.min(mStart, mEnd);
    matrixMonthEnd = Math.max(mStart, mEnd);
    matrixYearState = year;
    matrixClassState = targetKelas;

    // Populasikan Dropdown Kelas jika belum terisi
    if (typeof populateMatrixClassDropdown === 'function') {
        populateMatrixClassDropdown();
    }

    // Dapatkan data siswa
    let students = localMasterStudents || [];
    if (targetKelas && targetKelas !== 'Semua') {
        const normTarget = targetKelas.toLowerCase().replace(/[\s\-]/g, '');
        students = students.filter(s => {
            const normStudentClass = String(s.kelas || '').toLowerCase().replace(/[\s\-]/g, '');
            return normStudentClass === normTarget;
        });
    }
    students.sort((a, b) => a.nama.localeCompare(b.nama));

    // Coba tarik data terbaru dari server Google Sheets untuk periode tersebut
    await fetchServerMatrixLogs(matrixMonthStart, matrixMonthEnd, year, targetKelas);

    // Dapatkan log absensi dari localRecentLogs
    let logs = localRecentLogs || [];

    // Filter log berdasarkan rentang bulan, tahun, dan pastikan LOG SISWA
    const logMap = {};
    logs.forEach(log => {
        if (!log.tanggal) return;
        if (!log.nisn && !log.nis && !log.nama) return; // Abaikan log tanpa identitas

        const { year: logYear, month: logMonth, dateFormatted } = parseLogYearMonthDate(log.tanggal);
        if (logYear !== year || logMonth < matrixMonthStart || logMonth > matrixMonthEnd) return;

        const nisn = String(log.nisn || '').trim();
        const nis = String(log.nis || '').trim();
        const nama = String(log.nama || '').trim().toLowerCase().replace(/[\s\-]/g, '');
        const normNisn = nisn.replace(/^0+/, '');
        const normNis = nis.replace(/^0+/, '');

        const keys = [nisn, nis, normNisn, normNis, nama].filter(Boolean);

        keys.forEach(k => {
            if (!logMap[k]) logMap[k] = {};
            logMap[k][dateFormatted] = log.status;
            logMap[k][log.tanggal] = log.status;
        });
    });

    // Config Identitas Sekolah
    const cachedConfig = JSON.parse(localStorage.getItem('smart_absen_config') || '{}');
    const namaSekolah = cachedConfig.namaSekolah || 'SMA 1 BARUNAWATI';
    const tahunPelajaran = cachedConfig.tahunPelajaran || `${year}-${year+1}`;

    if (mode === 'single') {
        renderSingleMonthMatrix(students, logMap, matrixMonthStart, year, targetKelas, hideRed, namaSekolah, tahunPelajaran);
    } else {
        renderRangeMonthSummary(students, logMap, matrixMonthStart, matrixMonthEnd, year, targetKelas, hideRed, namaSekolah, tahunPelajaran);
    }
}

// Helper untuk mencocokkan log siswa secara presisi dengan menggabungkan semua identifier (NISN, NIS, Nama)
function getStudentLogs(student, logMap) {
    if (!student || !logMap) return {};
    const nisn = String(student.nisn || '').trim();
    const nis = String(student.nis || '').trim();
    const nama = String(student.nama || '').trim().toLowerCase().replace(/[\s\-]/g, '');
    const normNisn = nisn.replace(/^0+/, '');
    const normNis = nis.replace(/^0+/, '');

    const keys = [nisn, nis, normNisn, normNis, nama].filter(Boolean);
    const mergedMap = {};

    // Gabungkan seluruh log yang cocok dengan NISN, NIS, maupun Nama siswa
    keys.forEach(k => {
        if (logMap[k]) {
            Object.assign(mergedMap, logMap[k]);
        }
    });

    return mergedMap;
}

async function fetchServerMatrixLogs(mStart, mEnd, year, targetKelas) {
    if (typeof fetchWithRetry !== 'function' || !SCRIPT_URL) return [];
    try {
        const fetchMonthStr = (mStart === mEnd) ? (mStart < 10 ? '0' + mStart : '' + mStart) : 'Semua';
        let kelasParam = targetKelas || 'Semua';
        if (kelasParam.toLowerCase() === 'semua kelas') kelasParam = 'Semua';

        const url = `${SCRIPT_URL}?action=get_report&bulan=${fetchMonthStr}&kelas=${encodeURIComponent(kelasParam)}&tanggal=Semua`;
        const res = await fetchWithRetry(url, { method: 'GET' }, 1, 1000);
        if (res && res.status === 'success' && Array.isArray(res.data)) {
            const serverLogs = res.data;
            const logMapTemp = new Map();
            (localRecentLogs || []).forEach(l => {
                const k = `${l.nisn || l.nis || l.nama}_${l.tanggal}`;
                logMapTemp.set(k, l);
            });
            serverLogs.forEach(item => {
                const k = `${item.nisn || item.nis || item.nama}_${item.tanggal}`;
                logMapTemp.set(k, item);
            });
            localRecentLogs = Array.from(logMapTemp.values());
            localStorage.setItem('smart_absen_recent_logs', JSON.stringify(localRecentLogs));
            return serverLogs;
        }
    } catch (e) {
        console.warn("Server matrix log fetch notice:", e);
    }
    return [];
}

// 1. RENDER HARIAN BULANAN (SINGLE MONTH MATRIX)
function renderSingleMonthMatrix(students, logMap, month, year, targetKelas, hideRed, namaSekolah, tahunPelajaran) {
    const totalDaysInMonth = new Date(year, month, 0).getDate();
    const activeDays = [];
    const monthStr = month < 10 ? '0' + month : '' + month;
    const prefixYearMonth = `${year}-${monthStr}`;

    const holidaysMap = typeof getHolidaysMapForMonth === 'function'
        ? getHolidaysMapForMonth(year, month)
        : new Map();

    let weekdayHolidaysCount = 0;
    let totalWeekdaysInMonth = 0;

    for (let d = 1; d <= totalDaysInMonth; d++) {
        const dayStr = d < 10 ? '0' + d : '' + d;
        const fullDateStr = `${prefixYearMonth}-${dayStr}`;
        const dateObj = new Date(year, month - 1, d);
        const dayOfWeek = dateObj.getDay();
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
        const isHoliday = holidaysMap.has(fullDateStr);
        const holidayTitle = isHoliday ? holidaysMap.get(fullDateStr) : '';

        if (!isWeekend) {
            totalWeekdaysInMonth++;
            if (isHoliday) weekdayHolidaysCount++;
        }

        if (hideRed && (isWeekend || isHoliday)) continue;
        activeDays.push({ day: d, isWeekend, isHoliday, holidayTitle, fullDateStr });
    }

    const defaultEffectiveDays = Math.max(0, totalWeekdaysInMonth - weekdayHolidaysCount);

    if (inputMatrixHariEfektif && (!inputMatrixHariEfektif.value || inputMatrixHariEfektif.dataset.autoManaged === "true")) {
        inputMatrixHariEfektif.value = defaultEffectiveDays;
        inputMatrixHariEfektif.dataset.autoManaged = "true";
    }

    const hariEfektif = parseInt(inputMatrixHariEfektif ? inputMatrixHariEfektif.value : defaultEffectiveDays) || defaultEffectiveDays;
    matrixHariEfektifState = hariEfektif;

    const namaBulanStr = NAMA_BULAN_INDO[month - 1];

    let holidayInfoSubtext = '';
    if (weekdayHolidaysCount > 0) {
        holidayInfoSubtext = `<div style="font-size: 0.72rem; color: #fbbf24; margin-top: 3px; font-weight: 500;">(${totalWeekdaysInMonth} Hari Kerja - ${weekdayHolidaysCount} Libur Nasional)</div>`;
    }

    let html = `
    <div class="matrix-report-header" style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid var(--card-border, #333); padding-bottom: 15px; flex-wrap: wrap; gap: 15px;">
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="font-size: 1.8rem; background: rgba(59, 130, 246, 0.15); border-radius: 12px; width: 55px; height: 55px; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-school" style="color: #60a5fa;"></i></div>
                <div>
                    <h2 style="margin: 0; font-size: 1.25rem; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">REKAP ABSENSI KEHADIRAN SISWA</h2>
                    <h3 style="margin: 3px 0 0 0; font-size: 1.1rem; color: #60a5fa; text-transform: uppercase;">${namaSekolah}</h3>
                    <p style="margin: 3px 0 0 0; font-size: 0.85rem; color: var(--text-muted, #94a3b8);">BULAN ${namaBulanStr} ${year} • TAHUN PELAJARAN ${tahunPelajaran}</p>
                </div>
            </div>
            <div style="background: rgba(30, 41, 59, 0.8); border: 1px solid var(--card-border, #334155); border-radius: 10px; padding: 8px 18px; text-align: center; min-width: 140px;">
                <span style="font-size: 0.75rem; color: var(--text-muted, #94a3b8); display: block; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">HARI EFEKTIF</span>
                <span style="font-size: 1.8rem; font-weight: 800; color: #f59e0b; line-height: 1.2;">${hariEfektif}</span>
                ${holidayInfoSubtext}
            </div>
        </div>
    </div>
    `;

    if (students.length === 0) {
        html += `<div style="text-align: center; padding: 40px; color: var(--text-muted);"><i class="fa-solid fa-triangle-exclamation"></i> Tidak ada data siswa untuk kelas <strong>${targetKelas || 'Semua'}</strong>.</div>`;
        matrixTableContainer.innerHTML = html;
        return;
    }

    html += `
    <div style="overflow-x: auto; -webkit-overflow-scrolling: touch;">
        <table class="matrix-table" style="width: 100%; border-collapse: collapse; font-size: 0.78rem; text-align: center; white-space: nowrap;">
            <thead>
                <tr style="background: rgba(15, 23, 42, 0.9); color: #f8fafc;">
                    <th rowspan="2" style="border: 1px solid #334155; padding: 6px 4px; width: 35px;">Urt</th>
                    <th rowspan="2" style="border: 1px solid #334155; padding: 6px 6px; width: 55px;">NIS</th>
                    <th rowspan="2" style="border: 1px solid #334155; padding: 6px 6px; width: 75px;">NISN</th>
                    <th rowspan="2" style="border: 1px solid #334155; padding: 6px 12px; text-align: left; min-width: 160px;">NAMA SISWA</th>
                    <th rowspan="2" style="border: 1px solid #334155; padding: 6px 4px; width: 35px;">L/P</th>
                    <th rowspan="2" style="border: 1px solid #334155; padding: 6px 6px; width: 50px;">KELAS</th>
                    <th colspan="${activeDays.length}" style="border: 1px solid #334155; padding: 4px;">TANGGAL (${namaBulanStr})</th>
                    <th colspan="5" style="border: 1px solid #334155; padding: 4px; background: rgba(59, 130, 246, 0.2);">JUMLAH</th>
                    <th rowspan="2" style="border: 1px solid #334155; padding: 6px 8px; background: rgba(16, 185, 129, 0.2); width: 80px;">% KEHADIRAN</th>
                </tr>
                <tr style="background: rgba(30, 41, 59, 0.9); color: #cbd5e1;">
    `;

    activeDays.forEach(item => {
        let bgStyle = '';
        let titleAttr = '';
        if (item.isHoliday) {
            bgStyle = 'background: rgba(245, 158, 11, 0.35); color: #fef08a; font-weight: bold;';
            titleAttr = `title="Libur Nasional: ${item.holidayTitle}"`;
        } else if (item.isWeekend) {
            bgStyle = 'background: rgba(239, 68, 68, 0.25); color: #fca5a5;';
        }
        html += `<th style="border: 1px solid #334155; padding: 3px 2px; width: 22px; font-size: 0.72rem; ${bgStyle}" ${titleAttr}>${item.day}</th>`;
    });

    html += `
                    <th style="border: 1px solid #334155; padding: 3px; width: 22px; background: #22c55e; color: black; font-weight: bold;">H</th>
                    <th style="border: 1px solid #334155; padding: 3px; width: 22px; background: #eab308; color: black; font-weight: bold;">S</th>
                    <th style="border: 1px solid #334155; padding: 3px; width: 22px; background: #3b82f6; color: white; font-weight: bold;">I</th>
                    <th style="border: 1px solid #334155; padding: 3px; width: 22px; background: #ef4444; color: white; font-weight: bold;">A</th>
                    <th style="border: 1px solid #334155; padding: 3px; width: 22px; background: #a855f7; color: white; font-weight: bold;">T</th>
                </tr>
            </thead>
            <tbody>
    `;

    students.forEach((student, index) => {
        const studentLogs = getStudentLogs(student, logMap);

        let countH = 0, countS = 0, countI = 0, countA = 0, countT = 0;
        let dateCellsHtml = '';

        activeDays.forEach(item => {
            const d = item.day;
            const dayStr = d < 10 ? '0' + d : '' + d;
            const fullDateStr = `${prefixYearMonth}-${dayStr}`;

            const status = studentLogs[fullDateStr];
            let symbol = '';
            let cellColor = '';
            let titleAttr = '';

            if (status) {
                const normStatus = status.trim().toUpperCase();
                if (normStatus === 'HADIR') { symbol = '.'; countH++; cellColor = 'color: #4ade80; font-weight: bold;'; }
                else if (normStatus === 'SAKIT') { symbol = 's'; countS++; cellColor = 'color: #facc15; font-weight: bold;'; }
                else if (normStatus === 'IZIN') { symbol = 'i'; countI++; cellColor = 'color: #60a5fa; font-weight: bold;'; }
                else if (normStatus === 'ALPA' || normStatus === 'ALPHA') { symbol = 'a'; countA++; cellColor = 'color: #f87171; font-weight: bold;'; }
                else if (normStatus === 'TELAT' || normStatus === 'TERLAMBAT') { symbol = 't'; countT++; cellColor = 'color: #c084fc; font-weight: bold;'; }
            } else if (item.isHoliday) {
                symbol = 'L';
                cellColor = 'background: rgba(245, 158, 11, 0.18); color: #fbbf24; font-size: 0.72rem; font-weight: bold;';
                titleAttr = `title="Libur Nasional: ${item.holidayTitle}"`;
            } else if (item.isWeekend) {
                symbol = '';
                cellColor = 'background: rgba(239, 68, 68, 0.1);';
            }

            dateCellsHtml += `<td style="border: 1px solid #334155; padding: 3px 1px; ${cellColor}" ${titleAttr}>${symbol}</td>`;
        });

        const pctKehadiran = hariEfektif > 0 ? ((countH / hariEfektif) * 100).toFixed(2) : '0.00';
        const gender = student.gender || (student.nama.toLowerCase().includes('putri') || student.nama.toLowerCase().includes('siti') || student.nama.toLowerCase().includes('dewi') ? 'P' : 'L');

        html += `
            <tr style="background: ${index % 2 === 0 ? 'rgba(15, 23, 42, 0.3)' : 'rgba(30, 41, 59, 0.3)'};">
                <td style="border: 1px solid #334155; padding: 4px;">${index + 1}</td>
                <td style="border: 1px solid #334155; padding: 4px;">${student.nis || '-'}</td>
                <td style="border: 1px solid #334155; padding: 4px;">${student.nisn || '-'}</td>
                <td style="border: 1px solid #334155; padding: 4px 10px; text-align: left; font-weight: 500;">${student.nama}</td>
                <td style="border: 1px solid #334155; padding: 4px;">${gender}</td>
                <td style="border: 1px solid #334155; padding: 4px;">${student.kelas || '-'}</td>
                ${dateCellsHtml}
                <td style="border: 1px solid #334155; padding: 4px; font-weight: bold; color: #4ade80;">${countH}</td>
                <td style="border: 1px solid #334155; padding: 4px; font-weight: bold; color: #facc15;">${countS}</td>
                <td style="border: 1px solid #334155; padding: 4px; font-weight: bold; color: #60a5fa;">${countI}</td>
                <td style="border: 1px solid #334155; padding: 4px; font-weight: bold; color: #f87171;">${countA}</td>
                <td style="border: 1px solid #334155; padding: 4px; font-weight: bold; color: #c084fc;">${countT}</td>
                <td style="border: 1px solid #334155; padding: 4px; font-weight: bold; color: ${parseFloat(pctKehadiran) >= 85 ? '#4ade80' : '#f87171'};">${pctKehadiran}%</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    </div>
    <div style="margin-top: 12px; font-size: 0.75rem; color: var(--text-muted, #94a3b8); display: flex; gap: 15px; flex-wrap: wrap;">
        <span><strong>Keterangan Simbol:</strong></span>
        <span><strong style="color:#4ade80;">.</strong> = Hadir</span>
        <span><strong style="color:#facc15;">s</strong> = Sakit</span>
        <span><strong style="color:#60a5fa;">i</strong> = Izin</span>
        <span><strong style="color:#f87171;">a</strong> = Alpa</span>
        <span><strong style="color:#c084fc;">t</strong> = Telat</span>
        <span><strong style="color:#fbbf24;">L</strong> = Libur Nasional</span>
    </div>
    `;

    matrixTableContainer.innerHTML = html;
}

// 2. RENDER REKAP RENTANG BULAN / SEMESTER (MULTI-MONTH REKAP HSIAT)
function renderRangeMonthSummary(students, logMap, mStart, mEnd, year, targetKelas, hideRed, namaSekolah, tahunPelajaran) {
    const rangeMonths = [];
    let totalHariEfektifRentang = 0;
    let totalWeekdayHolidaysRentang = 0;

    for (let m = mStart; m <= mEnd; m++) {
        const totalDaysInMonth = new Date(year, m, 0).getDate();
        let monthActiveDays = 0;
        let monthWeekdayHolidays = 0;

        const holidaysMap = typeof getHolidaysMapForMonth === 'function' ? getHolidaysMapForMonth(year, m) : new Map();

        for (let d = 1; d <= totalDaysInMonth; d++) {
            const dayStr = d < 10 ? '0' + d : '' + d;
            const mStr = m < 10 ? '0' + m : '' + m;
            const fullDateStr = `${year}-${mStr}-${dayStr}`;

            const dayOfWeek = new Date(year, m - 1, d).getDay();
            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
            const isHoliday = holidaysMap.has(fullDateStr);

            if (!isWeekend) {
                if (!isHoliday) monthActiveDays++;
                if (isHoliday) monthWeekdayHolidays++;
            }
        }
        rangeMonths.push({ monthNum: m, name: NAMA_BULAN_INDO[m - 1], activeDays: monthActiveDays, weekdayHolidays: monthWeekdayHolidays });
        totalHariEfektifRentang += monthActiveDays;
        totalWeekdayHolidaysRentang += monthWeekdayHolidays;
    }

    if (inputMatrixHariEfektif && (!inputMatrixHariEfektif.value || inputMatrixHariEfektif.dataset.autoManaged === "true")) {
        inputMatrixHariEfektif.value = totalHariEfektifRentang;
        inputMatrixHariEfektif.dataset.autoManaged = "true";
    }

    const hariEfektifInput = parseInt(inputMatrixHariEfektif ? inputMatrixHariEfektif.value : totalHariEfektifRentang) || totalHariEfektifRentang;
    matrixHariEfektifState = hariEfektifInput;

    const labelPeriode = `${NAMA_BULAN_INDO[mStart - 1]} - ${NAMA_BULAN_INDO[mEnd - 1]} ${year}`;

    let holidayInfoSubtext = '';
    if (totalWeekdayHolidaysRentang > 0) {
        holidayInfoSubtext = `<div style="font-size: 0.72rem; color: #fbbf24; margin-top: 3px; font-weight: 500;">(Termasuk ${totalWeekdayHolidaysRentang} Libur Nasional)</div>`;
    }

    let html = `
    <div class="matrix-report-header" style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid var(--card-border, #333); padding-bottom: 15px; flex-wrap: wrap; gap: 15px;">
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="font-size: 1.8rem; background: rgba(16, 185, 129, 0.15); border-radius: 12px; width: 55px; height: 55px; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-chart-pie" style="color: #10b981;"></i></div>
                <div>
                    <h2 style="margin: 0; font-size: 1.25rem; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">REKAP KEHADIRAN PERIODE / SEMESTER</h2>
                    <h3 style="margin: 3px 0 0 0; font-size: 1.1rem; color: #10b981; text-transform: uppercase;">${namaSekolah}</h3>
                    <p style="margin: 3px 0 0 0; font-size: 0.85rem; color: var(--text-muted, #94a3b8);">PERIODE: ${labelPeriode} • TAHUN PELAJARAN ${tahunPelajaran}</p>
                </div>
            </div>
            <div style="background: rgba(30, 41, 59, 0.8); border: 1px solid var(--card-border, #334155); border-radius: 10px; padding: 8px 18px; text-align: center; min-width: 140px;">
                <span style="font-size: 0.75rem; color: var(--text-muted, #94a3b8); display: block; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">TOTAL HARI EFEKTIF</span>
                <span style="font-size: 1.8rem; font-weight: 800; color: #f59e0b; line-height: 1.2;">${hariEfektifInput}</span>
                ${holidayInfoSubtext}
            </div>
        </div>
    </div>
    `;

    if (students.length === 0) {
        html += `<div style="text-align: center; padding: 40px; color: var(--text-muted);"><i class="fa-solid fa-triangle-exclamation"></i> Tidak ada data siswa untuk kelas <strong>${targetKelas || 'Semua'}</strong>.</div>`;
        matrixTableContainer.innerHTML = html;
        return;
    }

    html += `
    <div style="overflow-x: auto; -webkit-overflow-scrolling: touch;">
        <table class="matrix-table" style="width: 100%; border-collapse: collapse; font-size: 0.78rem; text-align: center; white-space: nowrap;">
            <thead>
                <tr style="background: rgba(15, 23, 42, 0.9); color: #f8fafc;">
                    <th rowspan="2" style="border: 1px solid #334155; padding: 6px 4px; width: 35px;">Urt</th>
                    <th rowspan="2" style="border: 1px solid #334155; padding: 6px 6px; width: 55px;">NIS</th>
                    <th rowspan="2" style="border: 1px solid #334155; padding: 6px 6px; width: 75px;">NISN</th>
                    <th rowspan="2" style="border: 1px solid #334155; padding: 6px 12px; text-align: left; min-width: 160px;">NAMA SISWA</th>
                    <th rowspan="2" style="border: 1px solid #334155; padding: 6px 4px; width: 35px;">L/P</th>
                    <th rowspan="2" style="border: 1px solid #334155; padding: 6px 6px; width: 50px;">KELAS</th>
    `;

    // Render Header Nama Bulan
    rangeMonths.forEach(mObj => {
        html += `<th colspan="5" style="border: 1px solid #334155; padding: 4px;">${mObj.name}</th>`;
    });

    // Header Grand Total
    html += `
                    <th colspan="5" style="border: 1px solid #334155; padding: 4px; background: rgba(59, 130, 246, 0.25);">TOTAL PERIODE</th>
                    <th rowspan="2" style="border: 1px solid #334155; padding: 6px 8px; background: rgba(16, 185, 129, 0.25); width: 85px;">% KEHADIRAN</th>
                </tr>
                <tr style="background: rgba(30, 41, 59, 0.9); color: #cbd5e1;">
    `;

    // Sub Header H, S, I, A, T untuk setiap bulan
    rangeMonths.forEach(() => {
        html += `
            <th style="border: 1px solid #334155; padding: 2px; width: 20px; background: #22c55e; color: black; font-size: 0.7rem;">H</th>
            <th style="border: 1px solid #334155; padding: 2px; width: 20px; background: #eab308; color: black; font-size: 0.7rem;">S</th>
            <th style="border: 1px solid #334155; padding: 2px; width: 20px; background: #3b82f6; color: white; font-size: 0.7rem;">I</th>
            <th style="border: 1px solid #334155; padding: 2px; width: 20px; background: #ef4444; color: white; font-size: 0.7rem;">A</th>
            <th style="border: 1px solid #334155; padding: 2px; width: 20px; background: #a855f7; color: white; font-size: 0.7rem;">T</th>
        `;
    });

    // Sub Header H, S, I, A, T untuk Grand Total
    html += `
        <th style="border: 1px solid #334155; padding: 2px; width: 22px; background: #22c55e; color: black; font-weight: bold;">H</th>
        <th style="border: 1px solid #334155; padding: 2px; width: 22px; background: #eab308; color: black; font-weight: bold;">S</th>
        <th style="border: 1px solid #334155; padding: 2px; width: 22px; background: #3b82f6; color: white; font-weight: bold;">I</th>
        <th style="border: 1px solid #334155; padding: 2px; width: 22px; background: #ef4444; color: white; font-weight: bold;">A</th>
        <th style="border: 1px solid #334155; padding: 2px; width: 22px; background: #a855f7; color: white; font-weight: bold;">T</th>
    </tr>
    </thead>
    <tbody>
    `;

    // Render Baris Siswa
    students.forEach((student, index) => {
        const studentLogs = getStudentLogs(student, logMap);

        let grandH = 0, grandS = 0, grandI = 0, grandA = 0, grandT = 0;
        let monthCellsHtml = '';

        rangeMonths.forEach(mObj => {
            const m = mObj.monthNum;
            const monthStr = m < 10 ? '0' + m : '' + m;
            const prefixYearMonth = `${year}-${monthStr}`;
            const totalDaysInMonth = new Date(year, m, 0).getDate();

            let mH = 0, mS = 0, mI = 0, mA = 0, mT = 0;

            for (let d = 1; d <= totalDaysInMonth; d++) {
                const dayStr = d < 10 ? '0' + d : '' + d;
                const fullDateStr = `${prefixYearMonth}-${dayStr}`;
                const status = studentLogs[fullDateStr];
                if (status) {
                    const normStatus = status.trim().toUpperCase();
                    if (normStatus === 'HADIR') mH++;
                    else if (normStatus === 'SAKIT') mS++;
                    else if (normStatus === 'IZIN') mI++;
                    else if (normStatus === 'ALPA' || normStatus === 'ALPHA') mA++;
                    else if (normStatus === 'TELAT' || normStatus === 'TERLAMBAT') mT++;
                }
            }

            grandH += mH; grandS += mS; grandI += mI; grandA += mA; grandT += mT;

            monthCellsHtml += `
                <td style="border: 1px solid #334155; padding: 3px; color: ${mH > 0 ? '#4ade80' : 'var(--text-muted)'};">${mH}</td>
                <td style="border: 1px solid #334155; padding: 3px; color: ${mS > 0 ? '#facc15' : 'var(--text-muted)'};">${mS}</td>
                <td style="border: 1px solid #334155; padding: 3px; color: ${mI > 0 ? '#60a5fa' : 'var(--text-muted)'};">${mI}</td>
                <td style="border: 1px solid #334155; padding: 3px; color: ${mA > 0 ? '#f87171' : 'var(--text-muted)'};">${mA}</td>
                <td style="border: 1px solid #334155; padding: 3px; color: ${mT > 0 ? '#c084fc' : 'var(--text-muted)'};">${mT}</td>
            `;
        });

        const pctKehadiran = hariEfektifInput > 0 ? ((grandH / hariEfektifInput) * 100).toFixed(2) : '0.00';
        const gender = student.gender || (student.nama.toLowerCase().includes('putri') || student.nama.toLowerCase().includes('siti') || student.nama.toLowerCase().includes('dewi') ? 'P' : 'L');

        html += `
            <tr style="background: ${index % 2 === 0 ? 'rgba(15, 23, 42, 0.3)' : 'rgba(30, 41, 59, 0.3)'};">
                <td style="border: 1px solid #334155; padding: 4px;">${index + 1}</td>
                <td style="border: 1px solid #334155; padding: 4px;">${student.nis || '-'}</td>
                <td style="border: 1px solid #334155; padding: 4px;">${student.nisn || '-'}</td>
                <td style="border: 1px solid #334155; padding: 4px 10px; text-align: left; font-weight: 500;">${student.nama}</td>
                <td style="border: 1px solid #334155; padding: 4px;">${gender}</td>
                <td style="border: 1px solid #334155; padding: 4px;">${student.kelas || '-'}</td>
                ${monthCellsHtml}
                <td style="border: 1px solid #334155; padding: 4px; font-weight: bold; color: #4ade80;">${grandH}</td>
                <td style="border: 1px solid #334155; padding: 4px; font-weight: bold; color: #facc15;">${grandS}</td>
                <td style="border: 1px solid #334155; padding: 4px; font-weight: bold; color: #60a5fa;">${grandI}</td>
                <td style="border: 1px solid #334155; padding: 4px; font-weight: bold; color: #f87171;">${grandA}</td>
                <td style="border: 1px solid #334155; padding: 4px; font-weight: bold; color: #c084fc;">${grandT}</td>
                <td style="border: 1px solid #334155; padding: 4px; font-weight: bold; color: ${parseFloat(pctKehadiran) >= 85 ? '#4ade80' : '#f87171'};">${pctKehadiran}%</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    </div>
    <div style="margin-top: 12px; font-size: 0.75rem; color: var(--text-muted, #94a3b8); display: flex; gap: 15px; flex-wrap: wrap;">
        <span><strong>Keterangan Ringkasan:</strong></span>
        <span><strong style="color:#4ade80;">H</strong> = Hadir</span>
        <span><strong style="color:#facc15;">S</strong> = Sakit</span>
        <span><strong style="color:#60a5fa;">I</strong> = Izin</span>
        <span><strong style="color:#f87171;">A</strong> = Alpa</span>
        <span><strong style="color:#c084fc;">T</strong> = Telat</span>
    </div>
    `;

    matrixTableContainer.innerHTML = html;
}

// Populate Dropdown Pilih Kelas
function populateMatrixClassDropdown() {
    if (!selectMatrixKelas) return;
    const currentVal = selectMatrixKelas.value;

    const students = localMasterStudents || [];
    const classes = [...new Set(students.map(s => s.kelas).filter(Boolean))].sort();

    let optionsHtml = `<option value="Semua">Semua Kelas</option>`;
    classes.forEach(c => {
        optionsHtml += `<option value="${c}" ${c === currentVal ? 'selected' : ''}>Kelas ${c}</option>`;
    });

    selectMatrixKelas.innerHTML = optionsHtml;
}

// Export CSV untuk MS Excel
function exportMatrixToCSV() {
    const students = localMasterStudents || [];
    const targetKelas = selectMatrixKelas ? selectMatrixKelas.value.trim() : '';
    const mode = matrixTypeState;
    const year = matrixYearState;
    const hideRed = checkHideRedDates ? checkHideRedDates.checked : true;

    let filteredStudents = students;
    if (targetKelas && targetKelas !== 'Semua') {
        filteredStudents = students.filter(s => s.kelas === targetKelas);
    }

    if (filteredStudents.length === 0) {
        showToast("⚠️ Tidak ada data untuk di-export.", "warning");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";

    if (mode === 'single') {
        const month = matrixMonthStart;
        const totalDaysInMonth = new Date(year, month, 0).getDate();
        const activeDays = [];
        for (let d = 1; d <= totalDaysInMonth; d++) {
            const dayOfWeek = new Date(year, month - 1, d).getDay();
            if (!hideRed || (dayOfWeek !== 0 && dayOfWeek !== 6)) activeDays.push(d);
        }

        const prefixYearMonth = `${year}-${month < 10 ? '0' + month : month}`;
        const logMap = {};
        (localRecentLogs || []).forEach(log => {
            if (log.tanggal && log.tanggal.startsWith(prefixYearMonth)) {
                const key = log.nisn || log.nis;
                if (!logMap[key]) logMap[key] = {};
                logMap[key][log.tanggal] = log.status;
            }
        });

        let headers = ["No", "NIS", "NISN", "Nama Siswa", "L/P", "Kelas"];
        activeDays.forEach(d => headers.push(`Tgl ${d}`));
        headers.push("Hadir", "Sakit", "Izin", "Alpa", "Telat", "% Kehadiran");

        csvContent += headers.map(h => `"${h}"`).join(",") + "\n";

        filteredStudents.forEach((student, index) => {
            const studentKey = student.nisn || student.nis;
            const studentLogs = logMap[studentKey] || {};
            let countH = 0, countS = 0, countI = 0, countA = 0, countT = 0;
            let daySymbols = [];

            activeDays.forEach(d => {
                const dayStr = d < 10 ? '0' + d : '' + d;
                const fullDateStr = `${prefixYearMonth}-${dayStr}`;
                const status = studentLogs[fullDateStr];
                let sym = '';

                if (status) {
                    const norm = status.trim().toUpperCase();
                    if (norm === 'HADIR') { sym = '.'; countH++; }
                    else if (norm === 'SAKIT') { sym = 's'; countS++; }
                    else if (norm === 'IZIN') { sym = 'i'; countI++; }
                    else if (norm === 'ALPA' || norm === 'ALPHA') { sym = 'a'; countA++; }
                    else if (norm === 'TELAT') { sym = 't'; countT++; }
                }
                daySymbols.push(sym);
            });

            const pct = matrixHariEfektifState > 0 ? ((countH / matrixHariEfektifState) * 100).toFixed(2) + '%' : '0%';
            const gender = student.gender || 'L';

            let row = [
                index + 1, `"${student.nis || ''}"`, `"${student.nisn || ''}"`, `"${student.nama}"`, `"${gender}"`, `"${student.kelas || ''}"`,
                ...daySymbols.map(s => `"${s}"`),
                countH, countS, countI, countA, countT, `"${pct}"`
            ];
            csvContent += row.join(",") + "\n";
        });
    } else {
        // Range Export
        const rangeMonths = [];
        for (let m = matrixMonthStart; m <= matrixMonthEnd; m++) {
            rangeMonths.push({ monthNum: m, name: NAMA_BULAN_INDO[m - 1] });
        }

        const logMap = {};
        (localRecentLogs || []).forEach(log => {
            if (log.tanggal) {
                const parts = log.tanggal.split('-');
                if (parts.length >= 2) {
                    const logY = parseInt(parts[0]);
                    const logM = parseInt(parts[1]);
                    if (logY === year && logM >= matrixMonthStart && logM <= matrixMonthEnd) {
                        const key = log.nisn || log.nis;
                        if (!logMap[key]) logMap[key] = {};
                        logMap[key][log.tanggal] = log.status;
                    }
                }
            }
        });

        let headers = ["No", "NIS", "NISN", "Nama Siswa", "L/P", "Kelas"];
        rangeMonths.forEach(mObj => {
            headers.push(`${mObj.name}_H`, `${mObj.name}_S`, `${mObj.name}_I`, `${mObj.name}_A`, `${mObj.name}_T`);
        });
        headers.push("Total_H", "Total_S", "Total_I", "Total_A", "Total_T", "% Kehadiran Periode");

        csvContent += headers.map(h => `"${h}"`).join(",") + "\n";

        filteredStudents.forEach((student, index) => {
            const studentKey = student.nisn || student.nis;
            const studentLogs = logMap[studentKey] || {};
            let grandH = 0, grandS = 0, grandI = 0, grandA = 0, grandT = 0;
            let monthValues = [];

            rangeMonths.forEach(mObj => {
                const m = mObj.monthNum;
                const monthStr = m < 10 ? '0' + m : '' + m;
                const prefixYearMonth = `${year}-${monthStr}`;
                const totalDaysInMonth = new Date(year, m, 0).getDate();
                let mH = 0, mS = 0, mI = 0, mA = 0, mT = 0;

                for (let d = 1; d <= totalDaysInMonth; d++) {
                    const dayStr = d < 10 ? '0' + d : '' + d;
                    const fullDateStr = `${prefixYearMonth}-${dayStr}`;
                    const status = studentLogs[fullDateStr];
                    if (status) {
                        const norm = status.trim().toUpperCase();
                        if (norm === 'HADIR') mH++;
                        else if (norm === 'SAKIT') mS++;
                        else if (norm === 'IZIN') mI++;
                        else if (norm === 'ALPA' || norm === 'ALPHA') mA++;
                        else if (norm === 'TELAT') mT++;
                    }
                }
                grandH += mH; grandS += mS; grandI += mI; grandA += mA; grandT += mT;
                monthValues.push(mH, mS, mI, mA, mT);
            });

            const pct = matrixHariEfektifState > 0 ? ((grandH / matrixHariEfektifState) * 100).toFixed(2) + '%' : '0%';
            const gender = student.gender || 'L';

            let row = [
                index + 1, `"${student.nis || ''}"`, `"${student.nisn || ''}"`, `"${student.nama}"`, `"${gender}"`, `"${student.kelas || ''}"`,
                ...monthValues,
                grandH, grandS, grandI, grandA, grandT, `"${pct}"`
            ];
            csvContent += row.join(",") + "\n";
        });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Kehadiran_${mode === 'single' ? 'Bulan_' + matrixMonthStart : 'Periode_' + matrixMonthStart + '_s.d_' + matrixMonthEnd}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
