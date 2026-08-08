// ==========================================
// DASHBOARD & REPORTING LOGIC (MATRIKS KELAS + PAGINATION & AUTO-SEARCH)
// ==========================================

const btnRefreshData = document.getElementById('btnRefreshData');
const filterTanggal = document.getElementById('filterTanggal');
const filterBulan = document.getElementById('filterBulan');
const filterKelas = document.getElementById('filterKelas');
const tableBody = document.getElementById('tableBodyReport');

const searchLogInput = document.getElementById('searchLogInput');
const btnPrevPage = document.getElementById('btnPrevPage');
const btnNextPage = document.getElementById('btnNextPage');
const pageIndicator = document.getElementById('pageIndicator');
const paginationInfo = document.getElementById('paginationInfo');

let absenChartInstance = null;
const reportCache = {}; // Cache memory untuk laporan

// Variabel State Pagination & Search
let rawReportData = [];
let filteredReportData = [];
let currentPage = 1;
const PAGE_SIZE = 10; // 10 data per halaman sesuai permintaan

btnRefreshData.addEventListener('click', () => {
    loadDashboardData(true); // Force refresh dari server saat tombol diklik
});

// Event Listener Auto-Search (Pencarian Langsung)
if (searchLogInput) {
    searchLogInput.addEventListener('input', () => {
        currentPage = 1;
        applySearchAndPaginate();
    });
}

// Event Listener Tombol Navigasi Pagination
if (btnPrevPage) {
    btnPrevPage.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            applySearchAndPaginate();
        }
    });
}

if (btnNextPage) {
    btnNextPage.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredReportData.length / PAGE_SIZE) || 1;
        if (currentPage < totalPages) {
            currentPage++;
            applySearchAndPaginate();
        }
    });
}

// Penanganan Filter Otomatis Tanpa Bentrok (Conflict-Free Filters)
if (filterBulan) {
    filterBulan.addEventListener('change', () => {
        // Jika memilih filter bulan spesifik, kosongkan filter tanggal agar tidak bentrok!
        if (filterBulan.value !== 'Semua' && filterTanggal) {
            filterTanggal.value = '';
        }
    });
}

if (filterTanggal) {
    filterTanggal.addEventListener('change', () => {
        // Jika menentukan tanggal spesifik, kembalikan filter bulan ke 'Semua' agar presisi
        if (filterTanggal.value !== '' && filterBulan) {
            filterBulan.value = 'Semua';
        }
    });
}

async function loadDashboardData(forceRefresh = false) {
    const tanggal = filterTanggal ? filterTanggal.value : '';
    const bulan = filterBulan ? filterBulan.value : 'Semua';
    const kelas = filterKelas ? filterKelas.value : 'Semua';

    const cacheKey = `${tanggal}_${bulan}_${kelas}`;

    // Gunakan cache jika sudah pernah dimuat dan tidak dipaksa refresh (0ms response)
    if (!forceRefresh && reportCache[cacheKey]) {
        rawReportData = reportCache[cacheKey];
        renderMatrixTable(rawReportData);
        updateStatsAndChart(rawReportData);
        currentPage = 1;
        applySearchAndPaginate();
        return;
    }

    // 0ms Response: Tampilkan data dari localStorage secara instan lebih dulu!
    const localRecentLogs = JSON.parse(localStorage.getItem('smart_absen_recent_logs') || '[]');
    if (localRecentLogs.length > 0 && (!rawReportData || rawReportData.length === 0)) {
        rawReportData = localRecentLogs;
        renderMatrixTable(rawReportData);
        updateStatsAndChart(rawReportData);
        currentPage = 1;
        applySearchAndPaginate();
    }

    const btnOldText = btnRefreshData.innerText;
    btnRefreshData.innerText = "Memuat...";
    btnRefreshData.disabled = true;

    try {
        const requestUrl = `${SCRIPT_URL}?action=get_report&tanggal=${encodeURIComponent(tanggal)}&bulan=${encodeURIComponent(bulan)}&kelas=${encodeURIComponent(kelas)}`;
        
        let result;
        if (typeof fetchWithRetry === 'function') {
            result = await fetchWithRetry(requestUrl, { method: 'GET' });
        } else {
            const response = await fetch(requestUrl);
            result = await response.json();
        }

        if (result && result.status === 'success') {
            rawReportData = result.data || [];
            reportCache[cacheKey] = rawReportData; // Simpan ke cache memory

            renderMatrixTable(rawReportData);
            updateStatsAndChart(rawReportData);
            
            currentPage = 1;
            applySearchAndPaginate();
        } else {
            if (tableBody) tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red;">Gagal memuat data: ${result ? result.message : 'Error'}</td></tr>`;
        }

    } catch (error) {
        console.error(error);
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red;">Koneksi error. Silakan coba lagi.</td></tr>`;
        if (typeof showToast === 'function') showToast("Gagal menarik laporan data.", "error");
    } finally {
        btnRefreshData.innerText = btnOldText;
        btnRefreshData.disabled = false;
    }
}

// Fungsi untuk mengosongkan cache laporan saat ada absensi baru disimpan
function invalidateReportCache() {
    for (let key in reportCache) {
        delete reportCache[key];
    }
}

// ----------------------------------------------------
// FUNGSI AUTO-SEARCH & PAGINASI (10 DATA PER HALAMAN)
// ----------------------------------------------------
function applySearchAndPaginate() {
    const query = searchLogInput ? searchLogInput.value.toLowerCase().trim() : '';

    // Filter data berdasarkan query pencarian
    filteredReportData = rawReportData.filter(row => {
        if (!query) return true;
        return (
            (row.nama && row.nama.toLowerCase().includes(query)) ||
            (row.nis && row.nis.toLowerCase().includes(query)) ||
            (row.nisn && row.nisn.toLowerCase().includes(query)) ||
            (row.kelas && row.kelas.toLowerCase().includes(query)) ||
            (row.status && row.status.toLowerCase().includes(query)) ||
            (row.petugas && row.petugas.toLowerCase().includes(query))
        );
    });

    const totalItems = filteredReportData.length;
    const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;

    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const paginatedItems = filteredReportData.slice(startIndex, startIndex + PAGE_SIZE);

    // Render tabel detail dengan data halaman aktif
    renderTable(paginatedItems);

    // Update UI Controls Paginasi
    if (paginationInfo) {
        if (totalItems === 0) {
            paginationInfo.innerText = 'Menampilkan 0 data';
        } else {
            const endIndex = Math.min(startIndex + PAGE_SIZE, totalItems);
            paginationInfo.innerText = `Menampilkan ${startIndex + 1} - ${endIndex} dari ${totalItems} data`;
        }
    }

    if (pageIndicator) pageIndicator.innerText = `${currentPage} / ${totalPages}`;
    if (btnPrevPage) btnPrevPage.disabled = (currentPage <= 1);
    if (btnNextPage) btnNextPage.disabled = (currentPage >= totalPages || totalItems === 0);
}

// ----------------------------------------------------
// RENDER TABEL REKAPAN MATRIKS PER KELAS (SESUAI GAMBAR)
// ----------------------------------------------------
function renderMatrixTable(dataArray) {
    const tableBodyMatrix = document.getElementById('tableBodyMatrix');
    const tableFootMatrix = document.getElementById('tableFootMatrix');
    if (!tableBodyMatrix || !tableFootMatrix) return;

    if (!dataArray || dataArray.length === 0) {
        tableBodyMatrix.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 20px;">Tidak ada data untuk filter tersebut.</td></tr>`;
        tableFootMatrix.innerHTML = '';
        return;
    }

    const matrix = {};

    dataArray.forEach(row => {
        const k = row.kelas ? row.kelas.trim() : 'Tanpa Kelas';
        if (!matrix[k]) {
            matrix[k] = { HADIR: 0, SAKIT: 0, IZIN: 0, ALPA: 0, MUTASI: 0, TELAT: 0 };
        }
        const st = (row.status || '').toUpperCase().trim();
        if (matrix[k][st] !== undefined) {
            matrix[k][st]++;
        }
    });

    const sortedClasses = Object.keys(matrix).sort();

    let bodyHtml = '';
    let grandHadir = 0, grandSakit = 0, grandIzin = 0, grandAlpa = 0, grandMutasi = 0, grandTelat = 0, grandTotal = 0;

    sortedClasses.forEach((kelas, index) => {
        const item = matrix[kelas];
        const rowTotal = item.HADIR + item.SAKIT + item.IZIN + item.ALPA + item.MUTASI + item.TELAT;

        grandHadir += item.HADIR;
        grandSakit += item.SAKIT;
        grandIzin += item.IZIN;
        grandAlpa += item.ALPA;
        grandMutasi += item.MUTASI;
        grandTelat += item.TELAT;
        grandTotal += rowTotal;

        bodyHtml += `
            <tr>
                <td style="text-align: center;">${index + 1}</td>
                <td style="text-align: center;"><strong>${kelas}</strong></td>
                <td style="text-align: center; color: #10b981; font-weight: bold;">${item.HADIR}</td>
                <td style="text-align: center; color: #f59e0b; font-weight: bold;">${item.SAKIT}</td>
                <td style="text-align: center; color: #3b82f6; font-weight: bold;">${item.IZIN}</td>
                <td style="text-align: center; color: #ef4444; font-weight: bold;">${item.ALPA}</td>
                <td style="text-align: center; color: #94a3b8; font-weight: bold;">${item.MUTASI}</td>
                <td style="text-align: center; color: #f97316; font-weight: bold;">${item.TELAT}</td>
                <td style="text-align: center; font-weight: bold; background: rgba(255,255,255,0.04);">${rowTotal}</td>
            </tr>
        `;
    });

    tableBodyMatrix.innerHTML = bodyHtml;

    tableFootMatrix.innerHTML = `
        <tr style="border-top: 2px solid rgba(255,255,255,0.2); font-weight: bold; background: rgba(255,255,255,0.06);">
            <td colspan="2" style="text-align: center; letter-spacing: 1px;">TOTAL</td>
            <td style="text-align: center; color: #10b981; font-size: 1.05rem;">${grandHadir}</td>
            <td style="text-align: center; color: #f59e0b; font-size: 1.05rem;">${grandSakit}</td>
            <td style="text-align: center; color: #3b82f6; font-size: 1.05rem;">${grandIzin}</td>
            <td style="text-align: center; color: #ef4444; font-size: 1.05rem;">${grandAlpa}</td>
            <td style="text-align: center; color: #94a3b8; font-size: 1.05rem;">${grandMutasi}</td>
            <td style="text-align: center; color: #f97316; font-size: 1.05rem;">${grandTelat}</td>
            <td style="text-align: center; font-size: 1.1rem; color: var(--primary); background: rgba(79,70,229,0.2);">${grandTotal}</td>
        </tr>
    `;
}

// ----------------------------------------------------
// RENDER TABEL DETAIL SISWA INDIVIDUAL (HALAMAN AKTIF)
// ----------------------------------------------------
function renderTable(dataArray) {
    if (!tableBody) return;

    if (!dataArray || dataArray.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px;">Tidak ada detail log untuk filter / pencarian tersebut.</td></tr>`;
        return;
    }

    let html = '';
    dataArray.forEach(row => {
        let statusColor = '#fff';
        const st = (row.status || '').toUpperCase();
        if (st === 'HADIR') statusColor = 'var(--success)';
        if (st === 'SAKIT' || st === 'IZIN') statusColor = 'var(--warning)';
        if (st === 'ALPA') statusColor = 'var(--error)';
        if (st === 'TELAT') statusColor = '#f97316';
        if (st === 'MUTASI') statusColor = '#94a3b8';

        let timeStr = '-';
        if (row.waktu) {
            try {
                timeStr = new Date(row.waktu).toLocaleString('id-ID');
            } catch (e) {
                timeStr = row.waktu;
            }
        }

        html += `
            <tr>
                <td style="font-size:0.9rem;">${timeStr}</td>
                <td style="font-size:0.9rem;">${row.nisn || '-'}</td>
                <td><strong>${row.nis || '-'}</strong></td>
                <td>${row.nama || '-'}</td>
                <td>${row.kelas || '-'}</td>
                <td style="color:${statusColor}; font-weight:bold;">${row.status || '-'}</td>
                <td style="font-size:0.9rem; color:var(--text-muted);">${row.petugas || '-'}</td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;
}

function updateStatsAndChart(dataArray) {
    let totalHadir = 0;
    let totalIzinSakit = 0;
    let totalAlpa = 0;
    let totalTelat = 0;
    
    dataArray.forEach(row => {
        const st = (row.status || '').toUpperCase();
        if (st === 'HADIR') totalHadir++;
        if (st === 'IZIN' || st === 'SAKIT') totalIzinSakit++;
        if (st === 'ALPA') totalAlpa++;
        if (st === 'TELAT') totalTelat++;
    });

    document.getElementById('stat-hadir').innerText = totalHadir;
    document.getElementById('stat-izin').innerText = totalIzinSakit;
    document.getElementById('stat-alpa').innerText = totalAlpa;
    document.getElementById('stat-telat').innerText = totalTelat;
    document.getElementById('stat-total').innerText = dataArray.length;

    const ctx = document.getElementById('absenChart').getContext('2d');
    
    if (absenChartInstance) absenChartInstance.destroy();

    absenChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Hadir', 'Sakit/Izin', 'Alpa', 'Telat'],
            datasets: [{
                data: [totalHadir, totalIzinSakit, totalAlpa, totalTelat],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(249, 115, 22, 0.8)'
                ],
                borderColor: [
                    'rgba(16, 185, 129, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(239, 68, 68, 1)',
                    'rgba(249, 115, 22, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: document.documentElement.getAttribute('data-theme') === 'light' ? '#0f172a' : '#f8fafc',
                        font: { family: 'Outfit', size: 12 }
                    }
                }
            }
        }
    });
}
