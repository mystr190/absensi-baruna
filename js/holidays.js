/**
 * Modul Manajemen Hari Libur Nasional & Cuti Bersama
 * Smart Absensi Sekolah
 */

const DEFAULT_HOLIDAYS_2026 = [
    { date: "2026-01-01", description: "Tahun Baru 2026 Masehi", category: "Libur Nasional" },
    { date: "2026-01-16", description: "Isra Mikraj Nabi Muhammad SAW", category: "Libur Nasional" },
    { date: "2026-03-03", description: "Hari Suci Nyepi (Tahun Baru Saka 1948)", category: "Libur Nasional" },
    { date: "2026-03-20", description: "Hari Raya Idul Fitri 1447 Hijriah", category: "Libur Nasional" },
    { date: "2026-03-21", description: "Hari Raya Idul Fitri 1447 Hijriah", category: "Libur Nasional" },
    { date: "2026-04-03", description: "Wafat Yesus Kristus", category: "Libur Nasional" },
    { date: "2026-05-01", description: "Hari Buruh Internasional", category: "Libur Nasional" },
    { date: "2026-05-14", description: "Kenaikan Yesus Kristus", category: "Libur Nasional" },
    { date: "2026-05-27", description: "Hari Raya Waisak 2570 BE", category: "Libur Nasional" },
    { date: "2026-06-01", description: "Hari Lahir Pancasila", category: "Libur Nasional" },
    { date: "2026-06-17", description: "Hari Raya Idul Adha 1447 Hijriah", category: "Libur Nasional" },
    { date: "2026-07-07", description: "Tahun Baru Islam 1448 Hijriah", category: "Libur Nasional" },
    { date: "2026-08-17", description: "Proklamasi Kemerdekaan RI", category: "Libur Nasional" },
    { date: "2026-09-15", description: "Maulid Nabi Muhammad SAW", category: "Libur Nasional" },
    { date: "2026-12-25", description: "Hari Raya Natal", category: "Libur Nasional" }
];

const HOLIDAYS_STORAGE_KEY = 'smart_absen_holidays';

function getScriptUrl() {
    try {
        const cachedConfig = JSON.parse(localStorage.getItem('smart_absen_config') || '{}');
        return cachedConfig.urlScript || cachedConfig.url_script || window.SCRIPT_URL || '';
    } catch (e) {
        return window.SCRIPT_URL || '';
    }
}

function getHolidays() {
    try {
        const stored = localStorage.getItem(HOLIDAYS_STORAGE_KEY);
        if (!stored) {
            saveHolidays(DEFAULT_HOLIDAYS_2026);
            return DEFAULT_HOLIDAYS_2026;
        }
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed) || parsed.length === 0) {
            saveHolidays(DEFAULT_HOLIDAYS_2026);
            return DEFAULT_HOLIDAYS_2026;
        }
        return parsed;
    } catch (e) {
        console.error("Error reading holidays from localStorage", e);
        return DEFAULT_HOLIDAYS_2026;
    }
}

function saveHolidays(holidays) {
    try {
        holidays.sort((a, b) => a.date.localeCompare(b.date));
        localStorage.setItem(HOLIDAYS_STORAGE_KEY, JSON.stringify(holidays));
        return true;
    } catch (e) {
        console.error("Error saving holidays to localStorage", e);
        return false;
    }
}

function addHoliday(dateStr, description, category = "Libur Sekolah") {
    if (!dateStr || !description) return false;
    const holidays = getHolidays();
    const index = holidays.findIndex(h => h.date === dateStr);
    if (index !== -1) {
        holidays[index].description = description.trim();
        holidays[index].category = category;
    } else {
        holidays.push({ date: dateStr, description: description.trim(), category: category });
    }
    const saved = saveHolidays(holidays);
    
    // Attempt background sync to Google Sheet
    syncSingleHolidayToSheet(dateStr, description.trim(), category);
    return saved;
}

function deleteHoliday(dateStr) {
    let holidays = getHolidays();
    holidays = holidays.filter(h => h.date !== dateStr);
    const saved = saveHolidays(holidays);

    // Attempt background delete in Google Sheet
    deleteSingleHolidayFromSheet(dateStr);
    return saved;
}

function resetDefaultHolidays() {
    saveHolidays(DEFAULT_HOLIDAYS_2026);
    syncHolidaysToSheet();
    return DEFAULT_HOLIDAYS_2026;
}

/**
 * Sync all holidays to Google Sheet tab HariLibur
 */
async function syncHolidaysToSheet() {
    const url = getScriptUrl();
    if (!url) return false;
    try {
        const holidays = getHolidays();
        const formData = new URLSearchParams();
        formData.append('action', 'save_all_holidays');
        formData.append('data', JSON.stringify(holidays));

        const json = await fetchWithRetry(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        }, 2, 800);

        if (json && json.status === 'success') {
            console.log("Holidays successfully synced to Google Sheet:", json);
            return true;
        } else {
            console.error("Failed to sync holidays to Google Sheet:", json ? json.message : '');
            return false;
        }
    } catch (e) {
        console.error("Network error syncing holidays to Google Sheet", e);
        return false;
    }
}

/**
 * Fetch holidays from Google Sheet tab HariLibur
 */
async function fetchHolidaysFromSheet() {
    const url = getScriptUrl();
    if (!url) return false;
    try {
        const fetchUrl = url + (url.includes('?') ? '&' : '?') + 'action=get_holidays';
        const json = await fetchWithRetry(fetchUrl, { method: 'GET' }, 2, 800);
        if (json && json.status === 'success' && Array.isArray(json.data) && json.data.length > 0) {
            const remoteHolidays = json.data.map(item => ({
                date: item.date,
                description: item.description,
                category: item.category || 'Libur Sekolah'
            }));
            saveHolidays(remoteHolidays);
            renderHolidaysTable();
            if (typeof renderRekapMatrix === 'function') renderRekapMatrix();
            if (typeof renderMatrixRekapGuru === 'function') renderMatrixRekapGuru();
            return true;
        }
    } catch (e) {
        console.warn("Could not fetch holidays from Google Sheet", e);
    }
    return false;
}

async function syncSingleHolidayToSheet(date, description, category) {
    const url = getScriptUrl();
    if (!url) return;
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'add_holiday');
        formData.append('date', date);
        formData.append('description', description);
        formData.append('category', category);

        fetchWithRetry(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        }, 1, 500).catch(e => console.warn("Background add_holiday error", e));
    } catch(e) {}
}

async function deleteSingleHolidayFromSheet(date) {
    const url = getScriptUrl();
    if (!url) return;
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'delete_holiday');
        formData.append('date', date);

        fetchWithRetry(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        }, 1, 500).catch(e => console.warn("Background delete_holiday error", e));
    } catch(e) {}
}

/**
 * Returns a Map of date (YYYY-MM-DD) -> description for holidays in given year and month
 */
function getHolidaysMapForMonth(year, month) {
    const holidays = getHolidays();
    const monthStr = month < 10 ? '0' + month : '' + month;
    const prefix = `${year}-${monthStr}`;
    
    const map = new Map();
    holidays.forEach(h => {
        if (h.date && h.date.startsWith(prefix)) {
            map.set(h.date, h.description);
        }
    });
    return map;
}

/**
 * Returns list of holidays in given year and month that fall on Monday - Friday
 */
function getWeekdayHolidaysInMonth(year, month) {
    const holidays = getHolidays();
    const monthStr = month < 10 ? '0' + month : '' + month;
    const prefix = `${year}-${monthStr}`;

    const weekdayHolidays = [];
    holidays.forEach(h => {
        if (h.date && h.date.startsWith(prefix)) {
            const dateObj = new Date(h.date + 'T00:00:00');
            const dayOfWeek = dateObj.getDay(); // 0 = Sun, 6 = Sat
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                weekdayHolidays.push({ ...h, dayOfWeek });
            }
        }
    });
    return weekdayHolidays;
}

// Make functions available globally
window.getHolidays = getHolidays;
window.saveHolidays = saveHolidays;
window.addHoliday = addHoliday;
window.deleteHoliday = deleteHoliday;
window.resetDefaultHolidays = resetDefaultHolidays;
window.getHolidaysMapForMonth = getHolidaysMapForMonth;
window.getWeekdayHolidaysInMonth = getWeekdayHolidaysInMonth;
window.syncHolidaysToSheet = syncHolidaysToSheet;
window.fetchHolidaysFromSheet = fetchHolidaysFromSheet;

// UI DOM Rendering & Controls
function renderHolidaysTable() {
    const tbody = document.getElementById('tableBodyHolidays');
    if (!tbody) return;

    const holidays = getHolidays();
    if (holidays.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 20px;">Belum ada hari libur tersimpan.</td></tr>`;
        return;
    }

    const DAYS_INDO = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    let html = '';
    holidays.forEach((h, idx) => {
        const dateObj = new Date(h.date + 'T00:00:00');
        const dayName = DAYS_INDO[dateObj.getDay()];
        const isWeekend = (dateObj.getDay() === 0 || dateObj.getDay() === 6);
        const weekendBadge = isWeekend 
            ? `<span style="font-size:0.73rem; color:#f87171; background:rgba(239,68,68,0.15); padding:2px 6px; border-radius:4px; margin-left:6px;">Akhir Pekan</span>` 
            : `<span style="font-size:0.73rem; color:#4ade80; background:rgba(34,197,94,0.15); padding:2px 6px; border-radius:4px; margin-left:6px;">Potong Hari Kerja</span>`;

        const categoryBadge = h.category === 'Libur Sekolah' 
            ? `<span style="font-size:0.73rem; color:#60a5fa; background:rgba(59,130,246,0.15); padding:2px 6px; border-radius:4px;">Libur Sekolah</span>`
            : `<span style="font-size:0.73rem; color:#fbbf24; background:rgba(245,158,11,0.15); padding:2px 6px; border-radius:4px;">${h.category || 'Libur Nasional'}</span>`;

        html += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="text-align: center; font-weight: 600; color: #94a3b8;">${idx + 1}</td>
                <td style="font-weight: 600; white-space: nowrap;">${h.date}</td>
                <td style="white-space: nowrap;">${dayName} ${weekendBadge}</td>
                <td style="white-space: nowrap;">${categoryBadge}</td>
                <td style="color: #e2e8f0; font-weight: 500;">${h.description}</td>
                <td style="text-align: center;">
                    <button type="button" onclick="handleDeleteHoliday('${h.date}')" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.95rem;" title="Hapus Libur">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

window.handleDeleteHoliday = function(dateStr) {
    if (confirm(`Apakah Anda yakin ingin menghapus hari libur tanggal ${dateStr}?`)) {
        deleteHoliday(dateStr);
        renderHolidaysTable();
        if (typeof showToast === 'function') showToast("✅ Hari libur berhasil dihapus (Lokal & Sheet)", "success");
        if (typeof renderRekapMatrix === 'function') renderRekapMatrix();
        if (typeof renderMatrixRekapGuru === 'function') renderMatrixRekapGuru();
    }
};

function initHolidaysUI() {
    renderHolidaysTable();
    fetchHolidaysFromSheet();

    const formAdd = document.getElementById('formAddHoliday');
    if (formAdd) {
        formAdd.addEventListener('submit', (e) => {
            e.preventDefault();
            const dateVal = document.getElementById('inputHolidayDate')?.value;
            const descVal = document.getElementById('inputHolidayDesc')?.value.trim();
            const categoryVal = document.getElementById('selectHolidayCategory')?.value || "Libur Sekolah";

            if (!dateVal || !descVal) {
                if (typeof showToast === 'function') showToast("Tanggal dan Keterangan Libur wajib diisi.", "warning");
                return;
            }

            addHoliday(dateVal, descVal, categoryVal);
            renderHolidaysTable();
            formAdd.reset();
            if (typeof showToast === 'function') showToast("✅ Hari libur baru berhasil disimpan!", "success");

            if (typeof renderRekapMatrix === 'function') renderRekapMatrix();
            if (typeof renderMatrixRekapGuru === 'function') renderMatrixRekapGuru();
        });
    }

    const btnSync = document.getElementById('btnSyncHolidaysSheet');
    if (btnSync) {
        btnSync.addEventListener('click', async () => {
            btnSync.disabled = true;
            btnSync.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...`;
            const ok = await syncHolidaysToSheet();
            btnSync.disabled = false;
            btnSync.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Sync ke Google Sheet`;
            if (ok) {
                if (typeof showToast === 'function') showToast("✅ Hari libur setahun berhasil di-generate & disinkronkan ke Google Sheet!", "success");
            } else {
                if (typeof showToast === 'function') showToast("⚠️ Periksa koneksi atau URL Google Script pada Pengaturan.", "warning");
            }
        });
    }

    const btnFetch = document.getElementById('btnFetchHolidaysSheet');
    if (btnFetch) {
        btnFetch.addEventListener('click', async () => {
            btnFetch.disabled = true;
            btnFetch.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Memuat...`;
            const ok = await fetchHolidaysFromSheet();
            btnFetch.disabled = false;
            btnFetch.innerHTML = `<i class="fa-solid fa-cloud-arrow-down"></i> Tarik dari Sheet`;
            if (ok) {
                if (typeof showToast === 'function') showToast("✅ Data Hari Libur berhasil diperbarui dari Google Sheet!", "success");
            } else {
                if (typeof showToast === 'function') showToast("⚠️ Tidak ada data baru dari Sheet atau koneksi terganggu.", "warning");
            }
        });
    }

    const btnReset = document.getElementById('btnResetHolidays');
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            if (confirm("Reset seluruh daftar ke Preset Libur Nasional 2026 dan Sync ke Google Sheet?")) {
                resetDefaultHolidays();
                renderHolidaysTable();
                if (typeof showToast === 'function') showToast("✅ Libur Nasional berhasil di-reset ke preset 2026 & disinkronkan!", "success");

                if (typeof renderRekapMatrix === 'function') renderRekapMatrix();
                if (typeof renderMatrixRekapGuru === 'function') renderMatrixRekapGuru();
            }
        });
    }
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initHolidaysUI);
} else {
    initHolidaysUI();
}
