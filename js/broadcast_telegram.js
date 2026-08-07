/**
 * Modul Pusat Broadcast & Kirim Pesan Telegram Sekolah
 */
document.addEventListener('DOMContentLoaded', () => {
    initBroadcastTelegramModule();
});

function getTeachersList() {
    let teachers = [];
    if (typeof userListState !== 'undefined' && Array.isArray(userListState) && userListState.length > 0) {
        teachers = userListState;
    } else if (window.allTeachers && Array.isArray(window.allTeachers) && window.allTeachers.length > 0) {
        teachers = window.allTeachers;
    } else if (window.allUsers && Array.isArray(window.allUsers) && window.allUsers.length > 0) {
        teachers = window.allUsers;
    } else {
        try {
            const cached = localStorage.getItem('smart_absen_users_cache');
            if (cached) teachers = JSON.parse(cached);
        } catch(e) {}
    }
    return teachers || [];
}

async function ensureTeachersLoaded() {
    const teachers = getTeachersList();
    if (teachers.length === 0 && typeof loadUsers === 'function') {
        try {
            await loadUsers();
        } catch(e) {
            console.error("Error loading users for broadcast:", e);
        }
    }
}

async function initBroadcastTelegramModule() {
    const targetTypeSelect = document.getElementById('broadcastTargetType');
    const specificContainer = document.getElementById('containerBroadcastSpecific');
    const labelSpecific = document.getElementById('labelBroadcastSpecific');
    const targetValueSelect = document.getElementById('broadcastTargetValue');
    const badgeReachCounter = document.getElementById('badgeReachCounter');
    const formBroadcast = document.getElementById('formBroadcastTelegram');

    if (!targetTypeSelect || !formBroadcast) return;

    // Pastikan data guru dimuat jika belum ada
    await ensureTeachersLoaded();

    // Listener Perubahan Tipe Target
    targetTypeSelect.addEventListener('change', async () => {
        await updateBroadcastTargetOptions();
    });

    if (targetValueSelect) {
        targetValueSelect.addEventListener('change', () => {
            updateReachCounter();
        });
    }

    // Inisialisasi awal saat menu dibuka
    const navBtnBroadcast = document.getElementById('nav-broadcast-telegram');
    if (navBtnBroadcast) {
        navBtnBroadcast.addEventListener('click', async () => {
            await ensureTeachersLoaded();
            await updateBroadcastTargetOptions();
        });
    }

    // Update opsi target spesifik
    async function updateBroadcastTargetOptions() {
        const targetType = targetTypeSelect.value;
        targetValueSelect.innerHTML = '';

        const students = window.allStudents || [];
        const users = getTeachersList();

        if (targetType === 'class') {
            specificContainer.style.display = 'block';
            labelSpecific.innerHTML = '<i class="fa-solid fa-school"></i> Pilih Kelas Spesifik:';

            const uniqueClasses = [...new Set(students.map(s => String(s.kelas || '').trim()).filter(Boolean))].sort();
            if (uniqueClasses.length === 0) {
                targetValueSelect.innerHTML = '<option value="">(Tidak ada kelas tersedia)</option>';
            } else {
                uniqueClasses.forEach(cls => {
                    const opt = document.createElement('option');
                    opt.value = cls;
                    opt.textContent = `Kelas ${cls}`;
                    targetValueSelect.appendChild(opt);
                });
            }
        } else if (targetType === 'single_student') {
            specificContainer.style.display = 'block';
            labelSpecific.innerHTML = '<i class="fa-solid fa-user-graduate"></i> Pilih Siswa / Ortu:';

            if (students.length === 0) {
                targetValueSelect.innerHTML = '<option value="">(Tidak ada data siswa)</option>';
            } else {
                const sortedStudents = [...students].sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));
                sortedStudents.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s.nis || s.nisn;
                    const hasTg = Boolean(s.id_telegram && String(s.id_telegram).trim());
                    opt.textContent = `${s.nama} (${s.kelas || '-'}) ${hasTg ? '✅ [Telegram]' : '❌ [Belum Ada ID]'}`;
                    targetValueSelect.appendChild(opt);
                });
            }
        } else if (targetType === 'single_user') {
            specificContainer.style.display = 'block';
            labelSpecific.innerHTML = '<i class="fa-solid fa-chalkboard-user"></i> Pilih Guru / Staf:';

            if (users.length === 0) {
                targetValueSelect.innerHTML = '<option value="">(Memuat / tidak ada data guru)</option>';
            } else {
                const sortedUsers = [...users].sort((a, b) => {
                    const nameA = a.nama || a.namaLengkap || a.username || '';
                    const nameB = b.nama || b.namaLengkap || b.username || '';
                    return nameA.localeCompare(nameB);
                });
                sortedUsers.forEach(u => {
                    const opt = document.createElement('option');
                    opt.value = u.username || u.id;
                    const name = u.nama || u.namaLengkap || u.username;
                    const hasTg = Boolean(u.id_telegram && String(u.id_telegram).trim());
                    opt.textContent = `${name} [${u.role || 'User'}] ${hasTg ? '✅ [Telegram]' : '❌ [Belum Ada ID]'}`;
                    targetValueSelect.appendChild(opt);
                });
            }
        } else {
            specificContainer.style.display = 'none';
        }

        updateReachCounter();
    }

    // Hitung Estimasi Jangkauan Penerima Ber-ID Telegram
    function updateReachCounter() {
        const targetType = targetTypeSelect.value;
        const targetVal = targetValueSelect.value;
        const students = window.allStudents || [];
        const users = getTeachersList();

        let totalTarget = 0;
        let telegramCount = 0;

        if (targetType === 'all_school') {
            totalTarget = students.length + users.length;
            telegramCount = students.filter(s => s.id_telegram && String(s.id_telegram).trim()).length +
                            users.filter(u => u.id_telegram && String(u.id_telegram).trim()).length;
        } else if (targetType === 'all_teachers') {
            totalTarget = users.length;
            telegramCount = users.filter(u => u.id_telegram && String(u.id_telegram).trim()).length;
        } else if (targetType === 'all_students') {
            totalTarget = students.length;
            telegramCount = students.filter(s => s.id_telegram && String(s.id_telegram).trim()).length;
        } else if (targetType === 'class') {
            const classStudents = students.filter(s => String(s.kelas || '').trim().toLowerCase() === String(targetVal).trim().toLowerCase());
            totalTarget = classStudents.length;
            telegramCount = classStudents.filter(s => s.id_telegram && String(s.id_telegram).trim()).length;
        } else if (targetType === 'single_student') {
            const st = students.find(s => String(s.nis).trim() === String(targetVal).trim() || String(s.nisn).trim() === String(targetVal).trim());
            totalTarget = st ? 1 : 0;
            telegramCount = (st && st.id_telegram && String(st.id_telegram).trim()) ? 1 : 0;
        } else if (targetType === 'single_user') {
            const us = users.find(u => String(u.username).trim() === String(targetVal).trim() || String(u.id).trim() === String(targetVal).trim());
            totalTarget = us ? 1 : 0;
            telegramCount = (us && us.id_telegram && String(us.id_telegram).trim()) ? 1 : 0;
        }

        if (badgeReachCounter) {
            if (telegramCount > 0) {
                badgeReachCounter.style.background = 'linear-gradient(135deg, #0284c7, #2563eb)';
                badgeReachCounter.textContent = `⚡ ${telegramCount} Terjangkau Telegram (dari ${totalTarget} Total Target)`;
            } else {
                badgeReachCounter.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
                badgeReachCounter.textContent = `⚠️ 0 Penerima Ber-ID Telegram (dari ${totalTarget} Total Target)`;
            }
        }
    }

    // Handle Submit Form Broadcast
    formBroadcast.addEventListener('submit', async (e) => {
        e.preventDefault();

        const targetType = targetTypeSelect.value;
        const targetValue = targetValueSelect.value;
        const subject = document.getElementById('broadcastSubject').value.trim();
        const message = document.getElementById('broadcastMessage').value.trim();

        if (!message) {
            showToast("❌ Isi pesan pengumuman tidak boleh kosong.", "error");
            return;
        }

        if (!confirm(`Apakah Anda yakin ingin mengirimi broadcast pesan ini ke target penerima terpilih?`)) {
            return;
        }

        const btnSend = document.getElementById('btnSendBroadcast');
        if (btnSend) {
            btnSend.disabled = true;
            btnSend.innerHTML = '<span><i class="fa-solid fa-spinner fa-spin"></i> Mengirim Broadcast Telegram...</span>';
        }

        showToast("⏳ Memproses pengiriman broadcast Telegram...", "info");

        try {
            const formData = new FormData();
            formData.append('action', 'send_telegram_broadcast');
            formData.append('target_type', targetType);
            formData.append('target_value', targetValue);
            formData.append('subject', subject);
            formData.append('message', message);

            const result = await fetchWithRetry(SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(formData).toString()
            }, 0);

            if (result && result.status === 'success') {
                const data = result.data || {};
                showToast(`✅ ${result.message}`, "success");
                alert(`🎉 BROADCAST TELEGRAM SELESAI!\n\n` +
                      `- Total Terjangkau: ${data.target_count || 0}\n` +
                      `- Berhasil Terkirim: ${data.success_count || 0}\n` +
                      `- Gagal: ${data.failed_count || 0}`);
                
                document.getElementById('broadcastSubject').value = '';
                document.getElementById('broadcastMessage').value = '';
            } else {
                showToast(`❌ ${result ? result.message : 'Gagal mengirim broadcast.'}`, "error");
            }
        } catch (err) {
            console.error(err);
            showToast("❌ Terjadi kesalahan jaringan saat mengirim broadcast.", "error");
        } finally {
            if (btnSend) {
                btnSend.disabled = false;
                btnSend.innerHTML = '<span><i class="fa-solid fa-paper-plane"></i> Kirim Broadcast Telegram Sekarang</span>';
            }
        }
    });

    updateBroadcastTargetOptions();
}
