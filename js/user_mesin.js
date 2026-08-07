/**
 * Modul Frontend Data Detail User Mesin Solution X902
 */
document.addEventListener('DOMContentLoaded', () => {
    initUserMesinModule();
});

let userMesinData = [];

function initUserMesinModule() {
    const navBtnUserMesin = document.getElementById('nav-user-mesin');
    const btnSync = document.getElementById('btnSyncUserMesin');
    const inputSearch = document.getElementById('inputSearchUserMesin');

    if (navBtnUserMesin) {
        navBtnUserMesin.addEventListener('click', () => {
            loadUserMesinData();
        });
    }

    if (btnSync) {
        btnSync.addEventListener('click', () => {
            syncUserMesinData();
        });
    }

    if (inputSearch) {
        inputSearch.addEventListener('input', () => {
            renderUserMesinTable();
        });
    }
}

async function loadUserMesinData() {
    const tableBody = document.getElementById('tableBodyUserMesin');
    if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding: 25px; color: var(--text-muted);"><span class="loader" style="display:inline-block; margin-right:8px;"></span>Memuat data user mesin...</td></tr>`;
    }

    try {
        const result = await fetchWithRetry(`${SCRIPT_URL}?action=get_device_users`, { method: 'GET' }, 2, 800);
        if (result && result.status === 'success') {
            userMesinData = result.data || [];
            renderUserMesinTable();
        } else {
            if (tableBody) tableBody.innerHTML = `<tr><td colspan="10" style="text-align:center; color:#f87171; padding:20px;">Gagal memuat data: ${result ? result.message : 'Error'}</td></tr>`;
        }
    } catch(err) {
        console.error("Error loadUserMesinData:", err);
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="10" style="text-align:center; color:#f87171; padding:20px;">Terjadi kesalahan jaringan saat memuat data user mesin.</td></tr>`;
    }
}

async function syncUserMesinData() {
    const btnSync = document.getElementById('btnSyncUserMesin');
    if (btnSync) {
        btnSync.disabled = true;
        btnSync.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyinkronkan...';
    }

    showToast("⏳ Menyinkronkan seluruh PIN Mesin dengan database...", "info");

    try {
        const result = await fetchWithRetry(`${SCRIPT_URL}?action=sync_device_users`, { method: 'GET' }, 1, 1000);
        if (result && result.status === 'success') {
            userMesinData = result.data || [];
            showToast("✅ Berhasil menyinkronkan data User Mesin!", "success");
            renderUserMesinTable();
        } else {
            showToast(`❌ ${result ? result.message : 'Gagal menyinkronkan data.'}`, "error");
        }
    } catch(err) {
        console.error("Error syncUserMesinData:", err);
        showToast("❌ Terjadi kesalahan koneksi saat menyinkronkan data.", "error");
    } finally {
        if (btnSync) {
            btnSync.disabled = false;
            btnSync.innerHTML = '<i class="fa-solid fa-rotate"></i> Sinkronkan Data Mesin';
        }
    }
}

function renderUserMesinTable() {
    const tableBody = document.getElementById('tableBodyUserMesin');
    const inputSearch = document.getElementById('inputSearchUserMesin');
    const statTotal = document.getElementById('statTotalUserMesin');
    const statMapped = document.getElementById('statMappedUserMesin');
    const statUnmapped = document.getElementById('statUnmappedUserMesin');

    if (!tableBody) return;

    const searchKeyword = inputSearch ? inputSearch.value.trim().toLowerCase() : '';

    const filtered = userMesinData.filter(item => {
        if (!searchKeyword) return true;
        return (
            (item.id_mesin && item.id_mesin.toLowerCase().includes(searchKeyword)) ||
            (item.nama_mesin && item.nama_mesin.toLowerCase().includes(searchKeyword)) ||
            (item.nama && item.nama.toLowerCase().includes(searchKeyword)) ||
            (item.tipe && item.tipe.toLowerCase().includes(searchKeyword)) ||
            (item.status_mapping && item.status_mapping.toLowerCase().includes(searchKeyword)) ||
            (item.kelas_role && item.kelas_role.toLowerCase().includes(searchKeyword))
        );
    });

    // Update Card Stats
    const totalCount = userMesinData.length;
    const mappedCount = userMesinData.filter(i => i.status_mapping.includes('Terhubung')).length;
    const unmappedCount = totalCount - mappedCount;

    if (statTotal) statTotal.textContent = totalCount;
    if (statMapped) statMapped.textContent = mappedCount;
    if (statUnmapped) statUnmapped.textContent = unmappedCount;

    if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding: 25px; color: var(--text-muted);">(Tidak ditemukan data user mesin)</td></tr>`;
        return;
    }

    let html = '';
    filtered.forEach((item, index) => {
        const isMapped = item.status_mapping.includes('Terhubung');
        const badgeStatus = isMapped
            ? `<span class="badge badge-success" style="background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); padding: 4px 10px; border-radius: 6px; font-size: 0.8rem;">Terhubung ✅</span>`
            : `<span class="badge badge-danger" style="background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); padding: 4px 10px; border-radius: 6px; font-size: 0.8rem;">Belum Dihubungkan ⚠️</span>`;

        const hasTg = Boolean(item.id_telegram && item.id_telegram !== '-');
        const badgeTg = hasTg
            ? `<span style="color: #38bdf8; font-size: 0.85rem;"><i class="fa-brands fa-telegram"></i> ${item.id_telegram}</span>`
            : `<span style="color: var(--text-muted); font-size: 0.82rem;">-</span>`;

        html += `
            <tr>
                <td style="text-align: center; font-weight: 500;">${index + 1}</td>
                <td><strong style="color: #38bdf8; font-family: monospace; font-size: 0.95rem;">${item.id_mesin}</strong></td>
                <td><span style="color: #38bdf8; font-weight: 500;">${item.nama_mesin || '-'}</span></td>
                <td style="font-weight: 500; color: #f8fafc;">${item.nama}</td>
                <td><span style="background: rgba(255,255,255,0.06); padding: 3px 8px; border-radius: 5px; font-size: 0.82rem;">${item.tipe}</span></td>
                <td style="color: var(--text-muted); font-size: 0.88rem;">${item.kelas_role}</td>
                <td>${badgeTg}</td>
                <td style="font-size: 0.83rem; color: var(--text-muted);">${item.scan_terakhir}</td>
                <td style="text-align: center; font-weight: 600; color: #e2e8f0;">${item.total_scan}</td>
                <td>${badgeStatus}</td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;
}
