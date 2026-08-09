// ==========================================
// OVERVIEW DASHBOARD ANALYTICS & CHARTS
// ==========================================

let chartGender = null;
let chartStudentAbsen = null;
let chartViolations = null;
let chartTeacherAbsen = null;

document.addEventListener('DOMContentLoaded', () => {
    const navOverview = document.getElementById('nav-overview');
    if (navOverview) {
        navOverview.addEventListener('click', () => {
            renderOverviewDashboard();
        });
    }

    const btnRefresh = document.getElementById('btnRefreshOverview');
    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            renderOverviewDashboard(true);
        });
    }
});

async function renderOverviewDashboard(forceServer = false) {
    const btnRefresh = document.getElementById('btnRefreshOverview');
    const iconBtn = btnRefresh ? btnRefresh.querySelector('i') : null;
    if (iconBtn) iconBtn.classList.add('fa-spin');

    // 1. Initial quick load from local storage cache if available
    loadLocalOverviewStats();

    // 2. Fetch fresh real-time overview stats from server backend
    try {
        const url = `${SCRIPT_URL}?action=get_overview_stats`;
        const res = await fetchWithRetry(url, { method: 'GET' }, forceServer ? 2 : 1, 1000);

        if (res && res.status === 'success' && res.data) {
            updateOverviewUI(res.data);
        }
    } catch (e) {
        console.warn("Failed loading live overview stats from server, fallback to local data:", e);
    } finally {
        if (iconBtn) iconBtn.classList.remove('fa-spin');
    }
}

function loadLocalOverviewStats() {
    try {
        const rawMaster = localStorage.getItem('smart_absen_master_siswa');
        if (!rawMaster) return;

        const siswaList = JSON.parse(rawMaster);
        let totalSiswa = siswaList.length;
        let totalLaki = 0;
        let totalPerempuan = 0;
        const kelasMap = {};

        siswaList.forEach(s => {
            const g = String(s.lp || s.gender || '').trim().toUpperCase();
            if (g === 'L' || g === 'LAKI-LAKI') totalLaki++;
            else if (g === 'P' || g === 'PEREMPUAN') totalPerempuan++;

            const kls = String(s.kelas || 'Lainnya').trim();
            if (!kelasMap[kls]) kelasMap[kls] = { kls: kls, total: 0, L: 0, P: 0 };
            kelasMap[kls].total++;
            if (g === 'L' || g === 'LAKI-LAKI') kelasMap[kls].L++;
            else if (g === 'P' || g === 'PEREMPUAN') kelasMap[kls].P++;
        });

        // Hitung presensi siswa lokal jika tersedia (Hari Ini saja)
        let studentAbsenSummary = { Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0, Terlambat: 0 };
        const rawRecent = localStorage.getItem('smart_absen_recent_logs');
        const todayStr = typeof getTodayYYYYMMDD === 'function' ? getTodayYYYYMMDD() : new Date().toISOString().substring(0, 10);
        if (rawRecent) {
            try {
                const logs = JSON.parse(rawRecent);
                logs.forEach(l => {
                    const logDate = String(l.tanggal || '').trim();
                    if (logDate && !logDate.includes(todayStr)) return;

                    const st = String(l.status || '').trim().toUpperCase();
                    if (!st) return;
                    if (st.includes('HADIR') || st === 'H') studentAbsenSummary.Hadir++;
                    else if (st.includes('SAKIT') || st === 'S') studentAbsenSummary.Sakit++;
                    else if (st.includes('IZIN') || st === 'I') studentAbsenSummary.Izin++;
                    else if (st.includes('ALPA') || st.includes('ALPHA') || st === 'A') studentAbsenSummary.Alpa++;
                    else if (st.includes('TERLAMBAT') || st.includes('TELAT') || st === 'T') studentAbsenSummary.Terlambat++;
                });
            } catch(e){}
        }

        const initialData = {
            totalSiswa: totalSiswa,
            totalLaki: totalLaki,
            totalPerempuan: totalPerempuan,
            totalKelas: Object.keys(kelasMap).length,
            kelasMap: kelasMap,
            studentAbsenSummary: studentAbsenSummary,
            totalViolations: 0,
            violationSummary: {},
            totalGuruLog: 0,
            guruAbsenSummary: { Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0, DinasLuar: 0 }
        };

        updateOverviewUI(initialData);
    } catch (e) {
        console.error("Local stats render error:", e);
    }
}

function updateOverviewUI(data) {
    if (!data) return;

    // Update KPI Card Metric Elements
    const ovTotalSiswa = document.getElementById('ovTotalSiswa');
    const ovTotalKelas = document.getElementById('ovTotalKelas');
    const ovGenderText = document.getElementById('ovGenderText');
    const ovPresensiHadir = document.getElementById('ovPresensiHadir');
    const ovPresensiIzinSakit = document.getElementById('ovPresensiIzinSakit');
    const ovPresensiAlpa = document.getElementById('ovPresensiAlpa');
    const ovGuruHadir = document.getElementById('ovGuruHadir');
    const ovGuruIzin = document.getElementById('ovGuruIzin');
    const ovGuruAlpa = document.getElementById('ovGuruAlpa');

    if (ovTotalSiswa) ovTotalSiswa.innerText = `${data.totalSiswa || 0} Siswa`;
    if (ovTotalKelas) ovTotalKelas.innerText = `${data.totalKelas || 0}`;
    if (ovGenderText) ovGenderText.innerText = `${data.totalLaki || 0} L / ${data.totalPerempuan || 0} P`;

    const sSummary = data.studentAbsenSummary || { Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0, Terlambat: 0 };
    if (ovPresensiHadir) ovPresensiHadir.innerText = `${sSummary.Hadir || 0} Hadir`;
    if (ovPresensiIzinSakit) ovPresensiIzinSakit.innerText = `${(sSummary.Izin || 0) + (sSummary.Sakit || 0)} Izin/Sakit`;
    if (ovPresensiAlpa) ovPresensiAlpa.innerText = `${sSummary.Alpa || 0} Alpa`;

    const gSummary = data.guruAbsenSummary || { Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0, DinasLuar: 0 };
    if (ovGuruHadir) ovGuruHadir.innerText = `${gSummary.Hadir || 0} Hadir`;
    if (ovGuruIzin) ovGuruIzin.innerText = `${(gSummary.Izin || 0) + (gSummary.Sakit || 0)} Izin`;
    if (ovGuruAlpa) ovGuruAlpa.innerText = `${gSummary.Alpa || 0} Alpa`;

    // Render Chart 1: Gender Doughnut
    renderChartGender(data.totalLaki || 0, data.totalPerempuan || 0);

    // Render Chart 2: Presensi Siswa Bar Chart
    renderChartStudentAbsen(sSummary);

    // Render Chart 3: Violations Breakdown Bar Chart
    renderChartViolations(data.violationSummary || {});

    // Render Chart 4: Presensi Guru Pie Chart
    renderChartTeacherAbsen(gSummary);

    // Render List 5: Guru & Staf Belum Absen
    renderUnabsenGuruList(data.unabsenGuruList || []);

    // Render Widget: Informasi Guru & Staf Yang Bertugas / Tidak Hadir Hari Ini
    if (typeof renderWidgetGuruTidakHadirHariIni === 'function') {
        renderWidgetGuruTidakHadirHariIni();
    }
}

function renderUnabsenGuruList(list) {
    const container = document.getElementById('listUnabsenGuru');
    const badge = document.getElementById('badgeUnabsenGuruCount');
    if (!container) return;

    if (!list || !Array.isArray(list) || list.length === 0) {
        if (badge) {
            badge.innerText = '0 Orang';
            badge.style.background = 'rgba(34, 197, 94, 0.2)';
            badge.style.color = '#4ade80';
            badge.style.borderColor = 'rgba(34, 197, 94, 0.4)';
        }
        container.innerHTML = `
            <div style="text-align: center; padding: 35px 10px; color: #4ade80; font-size: 0.88rem;">
                <i class="fa-solid fa-circle-check" style="font-size: 2rem; margin-bottom: 8px; display: block; color: #22c55e;"></i>
                <strong>Semua Guru & Staf Sudah Presensi!</strong>
                <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">Tidak ada guru/staf yang tertinggal hari ini.</div>
            </div>
        `;
        return;
    }

    if (badge) {
        badge.innerText = `${list.length} Orang`;
        badge.style.background = 'rgba(239, 68, 68, 0.2)';
        badge.style.color = '#fca5a5';
        badge.style.borderColor = 'rgba(239, 68, 68, 0.4)';
    }

    let html = '<div style="display: flex; flex-direction: column; gap: 8px;">';
    list.forEach(item => {
        const initial = (item.nama || item.username || 'G').charAt(0).toUpperCase();
        const role = item.role || 'Guru / Staf';
        const namaDisplay = typeof escapeHtml === 'function' ? escapeHtml(item.nama) : item.nama;
        const roleDisplay = typeof escapeHtml === 'function' ? escapeHtml(role) : role;

        html += `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 9px 12px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.07); border-radius: 10px;">
                <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #ef4444, #f59e0b); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 0.85rem; flex-shrink: 0;">
                        ${initial}
                    </div>
                    <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        <strong style="color: #f8fafc; font-size: 0.84rem; display: block; overflow: hidden; text-overflow: ellipsis;">${namaDisplay}</strong>
                        <span style="font-size: 0.74rem; color: #94a3b8;"><i class="fa-solid fa-user-tag" style="font-size:0.68rem; margin-right: 3px;"></i> ${roleDisplay}</span>
                    </div>
                </div>
                <span style="font-size: 0.7rem; color: #fca5a5; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); padding: 3px 8px; border-radius: 6px; font-weight: 600; flex-shrink: 0;">
                    Belum Absen
                </span>
            </div>
        `;
    });
    html += '</div>';

    container.innerHTML = html;
}

// ==========================================
// CHART.JS RENDER HELPERS
// ==========================================

function renderChartGender(laki, perempuan) {
    const ctx = document.getElementById('chartGenderDistribution');
    if (!ctx) return;

    if (chartGender) chartGender.destroy();

    chartGender = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Laki-Laki (L)', 'Perempuan (P)'],
            datasets: [{
                data: [laki, perempuan],
                backgroundColor: ['#3b82f6', '#ec4899'],
                borderColor: ['rgba(59, 130, 246, 0.4)', 'rgba(236, 72, 153, 0.4)'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#f8fafc', font: { family: 'Outfit', size: 12 } }
                }
            }
        }
    });
}

function renderChartStudentAbsen(sSummary) {
    const ctx = document.getElementById('chartStudentAttendance');
    if (!ctx) return;

    if (chartStudentAbsen) chartStudentAbsen.destroy();

    chartStudentAbsen = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Hadir', 'Izin', 'Sakit', 'Terlambat', 'Alpa'],
            datasets: [{
                label: 'Jumlah Presensi Siswa',
                data: [
                    sSummary.Hadir || 0,
                    sSummary.Izin || 0,
                    sSummary.Sakit || 0,
                    sSummary.Terlambat || 0,
                    sSummary.Alpa || 0
                ],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.85)',
                    'rgba(59, 130, 246, 0.85)',
                    'rgba(245, 158, 11, 0.85)',
                    'rgba(168, 85, 247, 0.85)',
                    'rgba(239, 68, 68, 0.85)'
                ],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { ticks: { color: '#cbd5e1' }, grid: { display: false } },
                y: { ticks: { color: '#cbd5e1' }, grid: { color: 'rgba(255,255,255,0.08)' } }
            }
        }
    });
}

function renderChartViolations(vSummary) {
    const ctx = document.getElementById('chartViolationsBreakdown');
    if (!ctx) return;

    if (chartViolations) chartViolations.destroy();

    const labels = Object.keys(vSummary);
    const values = Object.values(vSummary);

    const defaultLabels = labels.length > 0 ? labels : ['Terlambat', 'Atribut/Seragam', 'Bercukur/Solok', 'Lainnya'];
    const defaultValues = values.length > 0 ? values : [0, 0, 0, 0];

    chartViolations = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: defaultLabels,
            datasets: [{
                label: 'Jumlah Pelanggaran',
                data: defaultValues,
                backgroundColor: 'rgba(245, 158, 11, 0.85)',
                borderColor: '#f59e0b',
                borderWidth: 1,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { ticks: { color: '#cbd5e1' }, grid: { color: 'rgba(255,255,255,0.08)' } },
                y: { ticks: { color: '#cbd5e1' }, grid: { display: false } }
            }
        }
    });
}

function renderChartTeacherAbsen(gSummary) {
    const ctx = document.getElementById('chartTeacherAttendance');
    if (!ctx) return;

    if (chartTeacherAbsen) chartTeacherAbsen.destroy();

    chartTeacherAbsen = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Hadir', 'Izin', 'Sakit', 'Dinas Luar', 'Alpa'],
            datasets: [{
                data: [
                    gSummary.Hadir || 0,
                    gSummary.Izin || 0,
                    gSummary.Sakit || 0,
                    gSummary.DinasLuar || 0,
                    gSummary.Alpa || 0
                ],
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'],
                borderWidth: 2,
                borderColor: 'rgba(15, 23, 42, 0.8)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#f8fafc', font: { family: 'Outfit', size: 12 } }
                }
            }
        }
    });
}
