/**
 * Modul Pusat Broadcast & Kirim Pesan Telegram Sekolah
 */
document.addEventListener('DOMContentLoaded', () => {
    initBroadcastTelegramModule();
});

let isBroadcastSending = false; // Flag status untuk cegah double submit

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

// === FUNGSI CUSTOM DIALOG MODAL GLASSMORPHISM ===
function showBroadcastConfirmModal({ title, bodyHtml, confirmText, onConfirm }) {
    const modal = document.getElementById('modalBroadcastDialog');
    const iconElem = document.getElementById('broadcastDialogIcon');
    const titleElem = document.getElementById('broadcastDialogTitle');
    const bodyElem = document.getElementById('broadcastDialogBody');
    const actionsElem = document.getElementById('broadcastDialogActions');

    if (!modal) return;

    iconElem.style.background = 'rgba(56, 189, 248, 0.15)';
    iconElem.style.borderColor = 'rgba(56, 189, 248, 0.5)';
    iconElem.style.color = '#38bdf8';
    iconElem.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';

    titleElem.innerText = title || 'Konfirmasi Broadcast';
    bodyElem.innerHTML = bodyHtml || 'Apakah Anda yakin ingin mengirim pesan broadcast?';

    actionsElem.innerHTML = `
        <button type="button" id="btnCancelBroadcastDialog" class="btn-secondary" style="padding: 10px 22px; border-radius: 10px;">Batal</button>
        <button type="button" id="btnConfirmBroadcastDialog" class="btn-primary" style="padding: 10px 24px; border-radius: 10px; background: linear-gradient(135deg, #0284c7, #2563eb);">
            ${confirmText || 'Ya, Kirim Sekarang'}
        </button>
    `;

    modal.style.display = 'flex';

    document.getElementById('btnCancelBroadcastDialog').onclick = () => {
        modal.style.display = 'none';
    };

    document.getElementById('btnConfirmBroadcastDialog').onclick = () => {
        modal.style.display = 'none';
        if (typeof onConfirm === 'function') onConfirm();
    };
}

function showBroadcastResultModal({ title, isSuccess, data, message }) {
    const modal = document.getElementById('modalBroadcastDialog');
    const iconElem = document.getElementById('broadcastDialogIcon');
    const titleElem = document.getElementById('broadcastDialogTitle');
    const bodyElem = document.getElementById('broadcastDialogBody');
    const actionsElem = document.getElementById('broadcastDialogActions');

    if (!modal) return;

    if (isSuccess) {
        iconElem.style.background = 'rgba(34, 197, 94, 0.15)';
        iconElem.style.borderColor = 'rgba(34, 197, 94, 0.5)';
        iconElem.style.color = '#4ade80';
        iconElem.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
        titleElem.innerText = title || 'Broadcast Berhasil Terkirim!';

        bodyElem.innerHTML = `
            <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 18px; text-align: left; margin-bottom: 10px;">
                <p style="margin: 0 0 12px 0; color: #e2e8f0; font-size: 0.92rem;">${message || 'Pengiriman pesan broadcast Telegram telah selesai.'}</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; text-align: center;">
                    <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); padding: 10px; border-radius: 10px;">
                        <span style="font-size: 0.75rem; color: #94a3b8; display: block;">TARGET</span>
                        <strong style="font-size: 1.2rem; color: #38bdf8;">${data.target_count || 0}</strong>
                    </div>
                    <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); padding: 10px; border-radius: 10px;">
                        <span style="font-size: 0.75rem; color: #94a3b8; display: block;">SUKSES</span>
                        <strong style="font-size: 1.2rem; color: #4ade80;">${data.success_count || 0}</strong>
                    </div>
                    <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 10px; border-radius: 10px;">
                        <span style="font-size: 0.75rem; color: #94a3b8; display: block;">GAGAL</span>
                        <strong style="font-size: 1.2rem; color: #f87171;">${data.failed_count || 0}</strong>
                    </div>
                </div>
            </div>
        `;
    } else {
        iconElem.style.background = 'rgba(239, 68, 68, 0.15)';
        iconElem.style.borderColor = 'rgba(239, 68, 68, 0.5)';
        iconElem.style.color = '#f87171';
        iconElem.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
        titleElem.innerText = title || 'Gagal Mengirim Broadcast';
        bodyElem.innerHTML = `<div style="color: #f87171; font-size: 0.95rem;">${message || 'Terjadi kesalahan saat menghubungi server.'}</div>`;
    }

    actionsElem.innerHTML = `
        <button type="button" id="btnCloseBroadcastResult" class="btn-primary" style="padding: 10px 30px; border-radius: 10px; background: linear-gradient(135deg, #0284c7, #2563eb);">
            Tutup
        </button>
    `;

    modal.style.display = 'flex';

    document.getElementById('btnCloseBroadcastResult').onclick = () => {
        modal.style.display = 'none';
    };
}


async function initBroadcastTelegramModule() {
    const targetTypeSelect = document.getElementById('broadcastTargetType');
    const specificContainer = document.getElementById('containerBroadcastSpecific');
    const labelSpecific = document.getElementById('labelBroadcastSpecific');
    const targetValueSelect = document.getElementById('broadcastTargetValue');
    const badgeReachCounter = document.getElementById('badgeReachCounter');
    const formBroadcast = document.getElementById('formBroadcastTelegram');

    if (!targetTypeSelect || !formBroadcast) return;

    await ensureTeachersLoaded();

    targetTypeSelect.addEventListener('change', async () => {
        await updateBroadcastTargetOptions();
    });

    if (targetValueSelect) {
        targetValueSelect.addEventListener('change', () => {
            updateReachCounter();
        });
    }

    const navBtnBroadcast = document.getElementById('nav-broadcast-telegram');
    if (navBtnBroadcast) {
        navBtnBroadcast.addEventListener('click', async () => {
            await ensureTeachersLoaded();
            await updateBroadcastTargetOptions();
        });
    }

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

    // Handle Submit Form Broadcast dengan Lock Anti-Double Submit
    formBroadcast.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (isBroadcastSending) {
            console.warn("Proses broadcast sedang berjalan...");
            return;
        }

        const targetType = targetTypeSelect.value;
        const targetValue = targetValueSelect.value;
        const subject = document.getElementById('broadcastSubject').value.trim();
        const message = document.getElementById('broadcastMessage').value.trim();

        if (!message) {
            showToast("❌ Isi pesan pengumuman tidak boleh kosong.", "error");
            return;
        }

        const reachBadgeText = badgeReachCounter ? badgeReachCounter.textContent : '';

        showBroadcastConfirmModal({
            title: "🚀 Konfirmasi Kirim Broadcast",
            bodyHtml: `
                <div style="text-align: left; background: rgba(15, 23, 42, 0.5); padding: 14px 18px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 12px;">
                    <p style="margin: 0 0 8px 0; color: #38bdf8; font-weight: 500;">
                        <i class="fa-solid fa-bullseye"></i> <strong>Target:</strong> ${targetTypeSelect.options[targetTypeSelect.selectedIndex].text}
                    </p>
                    <p style="margin: 0 0 8px 0; color: #e2e8f0; font-size: 0.9rem;">
                        <strong>Status Jangkauan:</strong> ${reachBadgeText}
                    </p>
                    ${subject ? `<p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 0.85rem;"><strong>Subjek:</strong> ${subject}</p>` : ''}
                </div>
                <p style="margin: 0; font-size: 0.9rem; color: var(--text-muted);">
                    Apakah Anda yakin ingin mulai mengirimkan pesan pengumuman ini via Telegram?
                </p>
            `,
            confirmText: "Ya, Kirim Broadcast",
            onConfirm: async () => {
                executeBroadcastSend({ targetType, targetValue, subject, message });
            }
        });
    });

    async function executeBroadcastSend({ targetType, targetValue, subject, message }) {
        if (isBroadcastSending) return;
        isBroadcastSending = true; // Set lock aktif

        const btnSend = document.getElementById('btnSendBroadcast');
        if (btnSend) {
            btnSend.disabled = true;
            btnSend.style.opacity = '0.7';
            btnSend.style.cursor = 'not-allowed';
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
                
                showBroadcastResultModal({
                    title: "🎉 BROADCAST TELEGRAM SELESAI",
                    isSuccess: true,
                    data: data,
                    message: result.message
                });

                document.getElementById('broadcastSubject').value = '';
                document.getElementById('broadcastMessage').value = '';
            } else {
                showToast(`❌ ${result ? result.message : 'Gagal mengirim broadcast.'}`, "error");
                showBroadcastResultModal({
                    title: "Gagal Mengirim Broadcast",
                    isSuccess: false,
                    message: result ? result.message : 'Gagal terhubung ke server Telegram.'
                });
            }
        } catch (err) {
            console.error("Broadcast Error:", err);
            showToast("❌ Terjadi kesalahan jaringan saat mengirim broadcast.", "error");
            showBroadcastResultModal({
                title: "Kesalahan Jaringan",
                isSuccess: false,
                message: "Terjadi kesalahan koneksi internet saat mengirim broadcast."
            });
        } finally {
            isBroadcastSending = false; // Release lock
            if (btnSend) {
                btnSend.disabled = false;
                btnSend.style.opacity = '1';
                btnSend.style.cursor = 'pointer';
                btnSend.innerHTML = '<span><i class="fa-solid fa-paper-plane"></i> Kirim Broadcast Telegram Sekarang</span>';
            }
        }
    }

    updateBroadcastTargetOptions();
}
