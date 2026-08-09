/**
 * =========================================================================
 * BACKEND GOOGLE APPS SCRIPT UNTUK SISTEM ABSENSI SMART SCHOOL (V4 STABLE & ACCURATE)
 * =========================================================================
 */

const SHEET_USERS = 'Users';
const SHEET_SISWA = 'DataSiswa';
const SHEET_LOG = 'LogAbsen';
const SHEET_CONFIG = 'Pengaturan';
const SHEET_PELANGGARAN = 'LogPelanggaran';
const SHEET_JENIS_PELANGGARAN = 'DataPelanggaran';
const SHEET_LOG_GURU = 'LogAbsenGuru';
const SHEET_PENGAJUAN_IZIN = 'PengajuanIzin';
const SHEET_HOLIDAYS = 'HariLibur';
const SHEET_USER_MESIN = 'User_Mesin';
const SHEET_MAPEL = 'Mapel';
const SHEET_KELAS = 'DataKelas';
const SHEET_IZIN_SISWA = 'LogIzinSiswa';
const SHEET_DATA_IZIN = 'DataIzin';
const TIMEZONE = 'Asia/Jakarta'; // Menggunakan Timezone WIB Indonesia

/**
 * JALANKAN FUNGSI INI 1X DI EDITOR GOOGLE APPS SCRIPT
 * Untuk memberikan otorisasi izin pembuatan Surat PDF (DocumentApp & DriveApp)
 */
function setupAuthorization() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const doc = DocumentApp.create('Temp_Auth_Check');
  DriveApp.getFileById(doc.getId()).setTrashed(true);
  Logger.log('Otorisasi Google Docs, Sheets, & Drive Berhasil!');
}

// === DUKUNGAN GET (Tarik Data Cepat & Real-Time) ===
function doGet(e) {
  try {
    let action = e ? e.parameter ? e.parameter.action : null : null;

    if (action === 'ping') {
      return jsonResponse('success', 'Terhubung ke Google Sheets', { name: 'Google Sheets' });
    }
    else if (action === 'login') {
      return handleLogin(e.parameter.username, e.parameter.password);
    }
    else if (action === 'get_students') {
      return handleGetStudents(e.parameter.kelas, e.parameter.tanggal);
    }
    else if (action === 'get_all_master_data') {
      return handleGetAllMasterData();
    }
    else if (action === 'absen_bulk') {
      return handleAbsenBulk(e.parameter.data, e.parameter.tanggal);
    }
    else if (action === 'get_report') {
      return handleGetReport(e.parameter.bulan, e.parameter.kelas, e.parameter.tanggal);
    }
    else if (action === 'get_users') {
      return handleGetUsers();
    }
    else if (action === 'get_config') {
      return handleGetConfig();
    }
    else if (action === 'setup_database' || action === 'initial_setup' || action === 'cleanup_and_repair_data' || action === 'fix_database') {
      return handleCleanupAndRepairData();
    }
    else if (action === 'get_pelanggaran') {
      return handleGetPelanggaran();
    }
    else if (action === 'get_jenis_pelanggaran') {
      return handleGetJenisPelanggaran();
    }
    else if (action === 'get_absen_guru') {
      return handleGetAbsenGuru();
    }
    else if (action === 'get_pengajuan_izin') {
      return handleGetPengajuanIzin();
    }
    else if (action === 'add_absen_guru') {
      return handleAddAbsenGuruManual(e.parameter.data);
    }
    else if (action === 'add_pengajuan_izin') {
      return handleAddPengajuanIzin(e.parameter.data);
    }
    else if (action === 'approve_pengajuan_izin') {
      return handleApprovePengajuanIzin(e.parameter.id, e.parameter.approver);
    }
    else if (action === 'reject_pengajuan_izin') {
      return handleRejectPengajuanIzin(e.parameter.id, e.parameter.approver);
    }
    else if (action === 'add_pelanggaran') {
      return handleAddPelanggaran(e.parameter.data);
    }
    else if (action === 'delete_pelanggaran') {
      return handleDeletePelanggaran(e.parameter.id);
    }
    else if (action === 'add_jenis_pelanggaran') {
      return handleAddJenisPelanggaran(e.parameter.nama);
    }
    else if (action === 'delete_jenis_pelanggaran') {
      return handleDeleteJenisPelanggaran(e.parameter.id);
    }
    else if (action === 'get_holidays') {
      return handleGetHolidays();
    }
    else if (action === 'get_mapel') {
      return handleGetMapel();
    }
    else if (action === 'save_mapel') {
      return handleSaveMapel(e.parameter.nama, e.parameter.target_kelas, e.parameter.old_nama);
    }
    else if (action === 'delete_mapel') {
      return handleDeleteMapel(e.parameter.nama);
    }
    else if (action === 'seed_default_mapel') {
      return handleSeedDefaultMapel();
    }
    else if (action === 'get_kelas') {
      return handleGetKelas();
    }
    else if (action === 'save_kelas') {
      return handleSaveKelas(e.parameter.nama, e.parameter.tingkat, e.parameter.jurusan, e.parameter.wali_kelas, e.parameter.kapasitas, e.parameter.old_nama);
    }
    else if (action === 'delete_kelas') {
      return handleDeleteKelas(e.parameter.nama);
    }
    else if (action === 'seed_default_kelas') {
      return handleSeedDefaultKelas();
    }
    else if (action === 'get_students') {
      return handleGetStudents();
    }
    else if (action === 'add_student') {
      return handleAddStudent(e.parameter.nisn, e.parameter.nis, e.parameter.nama, e.parameter.kelas, e.parameter.gender, e.parameter.id_mesin);
    }
    else if (action === 'update_student') {
      return handleUpdateStudent(e.parameter.old_nis, e.parameter.old_nisn, e.parameter.nisn, e.parameter.nis, e.parameter.nama, e.parameter.kelas, e.parameter.gender, e.parameter.id_mesin);
    }
    else if (action === 'delete_student') {
      return handleDeleteStudent(e.parameter.nisn, e.parameter.nis);
    }
    else if (action === 'save_all_students') {
      return handleSaveAllStudents(e.parameter.data, e.parameter.mode);
    }
    else if (action === 'delete_attendance_class') {
      return handleDeleteAttendanceByDateAndClass(e.parameter.tanggal, e.parameter.kelas);
    }
    else if (action === 'get_overview_stats') {
      return handleGetOverviewStats();
    }
    else if (action === 'get_izin_siswa') {
      return handleGetIzinSiswa();
    }
    else if (action === 'device_scan' || action === 'solution_scan') {
      return handleDeviceAttendanceScan(e.parameter.pin || e.parameter.nis, e.parameter.waktu, e.parameter.status, e.parameter.nama_mesin || e.parameter.name);
    }
    else if (action === 'test_telegram') {
      return handleTestTelegram(e.parameter.chat_id || e.parameter.id_telegram);
    }
    else if (action === 'set_telegram_webhook') {
      return handleSetTelegramWebhook(e.parameter.url_script);
    }
    else if (action === 'delete_telegram_webhook' || action === 'disable_telegram_webhook') {
      return handleDeleteTelegramWebhook();
    }
    else if (action === 'send_telegram_broadcast') {
      return handleSendTelegramBroadcast(e.parameter.target_type, e.parameter.target_value, e.parameter.subject, e.parameter.message);
    }
    else if (action === 'update_self_profile') {
      return handleUpdateSelfProfile(e.parameter.old_username, e.parameter.username, e.parameter.password, e.parameter.nama, e.parameter.id_mesin, e.parameter.id_telegram);
    }
    else if (action === 'get_self_profile') {
      return handleGetSelfProfile(e.parameter.username);
    }
    else if (action === 'get_device_users') {
      return handleGetDeviceUsers();
    }
    // === EDU-IZIN (IZIN KBM) DISPATCHER GET ===
    else if (action === 'get_dropdown_edu_izin') {
      return handleGetDropdownDataEduIzin();
    }
    else if (action === 'get_edu_izin') {
      return handleGetEduIzinRequests();
    }
    else if (action === 'sync_device_users') {
      return handleSyncDeviceUsers();
    }
    else if (action === 'setup_user_mesin' || action === 'setup_device_columns') {
      ensureDeviceUserIdColumns();
      ensureUserMesinSheet(SpreadsheetApp.getActiveSpreadsheet());
      handleSyncDeviceUsers();
      return jsonResponse('success', 'Setup & Sinkronisasi Sheet User_Mesin berhasil dikonfigurasi!');
    }

    return jsonResponse('success', 'API Active');
  } catch (err) {
    return jsonResponse('error', 'Server Error: ' + err.toString());
  }
}

// === DUKUNGAN POST (Login, Absensi, Pelanggaran & Manajemen User) ===
function doPost(e) {
  try {
    let action = e ? (e.parameter ? e.parameter.action : null) : null;
    let postBody = null;

    if (e && e.postData && e.postData.contents) {
      try {
        postBody = JSON.parse(e.postData.contents);
        if (!action && postBody && postBody.action) {
          action = postBody.action;
        }
      } catch (pErr) {}
    }

    // JIKA TERIMA WEBHOOK TELEGRAM AUTOMATIC ID BOT (Hanya jika bukan request dari Web App API)
    if (!action && postBody && postBody.message && postBody.message.chat) {
      try {
        const updateData = postBody;
        if (updateData && updateData.message && updateData.message.chat) {
          // Abaikan pesan dari bot lain untuk mencegah loop
          if (updateData.message.from && updateData.message.from.is_bot) {
            return ContentService.createTextOutput("OK");
          }

          // DEDUP PRESISI TINGGI: Gunakan CacheService dengan update_id & message_id agar TIDAK BISA BALAS BERULANG
          const cache = CacheService.getScriptCache();
          const updateId = updateData.update_id;
          const msgId = updateData.message.message_id;
          const chatId = updateData.message.chat.id;
          const dedupeKey = 'tg_dedup_' + (updateId || (chatId + '_' + msgId));

          if (cache.get(dedupeKey)) {
            // Pesan ini SUDAH DIPROSES/DIBALAS sebelumnya! Abaikan dan langsung kirim HTTP OK!
            return ContentService.createTextOutput("OK");
          }

          // Simpan key dedup di cache (valid selama 6 jam)
          try {
            cache.put(dedupeKey, '1', 21600);
          } catch (cErr) {}

          const msgText = String(updateData.message.text || '').trim();

          // PERINTAH /stop: Hapus antrean Telegram dan Non-Aktifkan Webhook Balasan Otomatis
          if (msgText === '/stop') {
            const stopMsg = `🛑 <b>AUTO-REPLY TELEGRAM DINONAKTIFKAN</b>\n\n` +
              `Seluruh antrean pesan di server Telegram telah dibersihkan. Bot tidak akan membalas ID otomatis lagi.\n\n` +
              `<i>Ketik /start atau aktifkan dari Web App jika ingin mengaktifkannya kembali di kemudian hari.</i>`;
            
            try {
              sendTelegramNotification(chatId, stopMsg);
              handleDeleteTelegramWebhook(); // Hapus Webhook & Drop Pending Updates di Telegram Server
            } catch (errStop) {}

            return ContentService.createTextOutput("OK");
          }
          
          // HANYA RESPONS JIKA PENGGUNA MENGIRIM TEKS PERSIS /start, /id, ATAU /help
          if (msgText === '/start' || msgText === '/id' || msgText === '/help') {
            const senderName = updateData.message.from ? (updateData.message.from.first_name || 'Pengguna') : 'Pengguna';
            
            const replyMsg = `<b>SISTEM INFORMASI & PRESENSI DIGITAL</b>\n\n` +
              `Halo <b>${senderName}</b>,\n` +
              `ID Telegram Anda adalah:\n` +
              `<code>${chatId}</code>\n\n` +
              `<blockquote>Salin angka ID di atas dan daftarkan pada data profil Anda di sistem presensi.</blockquote>\n\n` +
              `<i>— Bot Respon Otomatis (Ketik /stop jika ingin menghentikan)</i>`;
            
            try {
              sendTelegramNotification(chatId, replyMsg);
            } catch (sendErr) {
              Logger.log("Error sending Telegram reply: " + sendErr.toString());
            }
          }
        }
      } catch(err) {
        Logger.log("Error parsing Telegram Webhook: " + err.toString());
      }
      // SELALU KEMBALIKAN HTTP OK KEPADA TELEGRAM AGAR TELEGRAM TIDAK MENGULANGI (RETRY LOOP)
      return ContentService.createTextOutput("OK");
    }

    if (action === 'login') {
      return handleLogin(e.parameter.username, e.parameter.password);
    }
    else if (action === 'set_telegram_webhook') {
      return handleSetTelegramWebhook(e.parameter.url_script);
    }
    else if (action === 'delete_telegram_webhook' || action === 'disable_telegram_webhook') {
      return handleDeleteTelegramWebhook();
    }
    else if (action === 'send_telegram_broadcast') {
      return handleSendTelegramBroadcast(e.parameter.target_type, e.parameter.target_value, e.parameter.subject, e.parameter.message);
    }
    else if (action === 'get_izin_siswa') {
      return handleGetIzinSiswa();
    }
    else if (action === 'add_pengajuan_izin_siswa') {
      let dataObj = null;
      if (e && e.postData && e.postData.contents) {
        try { dataObj = JSON.parse(e.postData.contents); } catch(err){}
      }
      if (!dataObj && e && e.parameter && e.parameter.data) {
        try { dataObj = JSON.parse(e.parameter.data); } catch(err){}
      }
      if (!dataObj && e && e.parameter) {
        dataObj = e.parameter;
      }
      return handleAddPengajuanIzinSiswa(dataObj);
    }
    else if (action === 'approve_izin_siswa') {
      return handleApproveIzinSiswa(e.parameter.id, e.parameter.approver_name, e.parameter.approver_role);
    }
    else if (action === 'reject_izin_siswa') {
      return handleRejectIzinSiswa(e.parameter.id, e.parameter.approver_name, e.parameter.approver_role);
    }
    // === EDU-IZIN (IZIN KBM) DISPATCHER POST ===
    else if (action === 'submit_edu_izin') {
      let dataObj = null;
      if (e && e.postData && e.postData.contents) {
        try { 
            let p = JSON.parse(e.postData.contents); 
            dataObj = p.data ? p.data : p;
        } catch(err){}
      }
      if (!dataObj && e && e.parameter && e.parameter.data) {
        try { dataObj = JSON.parse(e.parameter.data); } catch(err){}
      }
      if (!dataObj && e && e.parameter) {
        dataObj = e.parameter;
      }
      return handleSubmitEduIzin(dataObj);
    }
    else if (action === 'approve_edu_izin_guru') {
      let dataObj = null;
      if (e && e.postData && e.postData.contents) {
        try { let p = JSON.parse(e.postData.contents); dataObj = p.data || p; } catch(err){}
      }
      if (!dataObj && e && e.parameter && e.parameter.data) {
        try { dataObj = JSON.parse(e.parameter.data); } catch(err){}
      }
      if (!dataObj && e && e.parameter) dataObj = e.parameter;
      return handleApproveEduIzinGuru(dataObj.id, dataObj.approver);
    }
    else if (action === 'approve_edu_izin_piket') {
      let dataObj = null;
      if (e && e.postData && e.postData.contents) {
        try { let p = JSON.parse(e.postData.contents); dataObj = p.data || p; } catch(err){}
      }
      if (!dataObj && e && e.parameter && e.parameter.data) {
        try { dataObj = JSON.parse(e.parameter.data); } catch(err){}
      }
      if (!dataObj && e && e.parameter) dataObj = e.parameter;
      return handleApproveEduIzinPiket(dataObj.id, dataObj.approver);
    }
    else if (action === 'reject_edu_izin') {
      let dataObj = null;
      if (e && e.postData && e.postData.contents) {
        try { let p = JSON.parse(e.postData.contents); dataObj = p.data || p; } catch(err){}
      }
      if (!dataObj && e && e.parameter && e.parameter.data) {
        try { dataObj = JSON.parse(e.parameter.data); } catch(err){}
      }
      if (!dataObj && e && e.parameter) dataObj = e.parameter;
      return handleRejectEduIzin(dataObj.id, dataObj.tipe, dataObj.alasan, dataObj.approver);
    }
    else if (action === 'recap_pdf_edu_izin') {
      return generateEduIzinRecapPDF(e.parameter.selected_ids);
    }
    else if (action === 'update_self_profile') {
      return handleUpdateSelfProfile(e.parameter.old_username, e.parameter.username, e.parameter.password, e.parameter.nama, e.parameter.id_mesin, e.parameter.id_telegram);
    }
    else if (action === 'get_self_profile') {
      return handleGetSelfProfile(e.parameter.username);
    }
    else if (action === 'get_device_users') {
      return handleGetDeviceUsers();
    }
    else if (action === 'sync_device_users') {
      return handleSyncDeviceUsers();
    }
    else if (action === 'get_students') {
      return handleGetStudents();
    }
    else if (action === 'add_student') {
      return handleAddStudent(e.parameter.nisn, e.parameter.nis, e.parameter.nama, e.parameter.kelas, e.parameter.gender, e.parameter.id_mesin, e.parameter.id_telegram);
    }
    else if (action === 'update_student') {
      return handleUpdateStudent(e.parameter.old_nis, e.parameter.old_nisn, e.parameter.nisn, e.parameter.nis, e.parameter.nama, e.parameter.kelas, e.parameter.gender, e.parameter.id_mesin, e.parameter.id_telegram);
    }
    else if (action === 'delete_student') {
      return handleDeleteStudent(e.parameter.nisn, e.parameter.nis);
    }
    else if (action === 'save_all_students') {
      return handleSaveAllStudents(e.parameter.data, e.parameter.mode);
    }
    else if (action === 'get_holidays') {
      return handleGetHolidays();
    }
    else if (action === 'save_all_holidays') {
      return handleSaveAllHolidays(e.parameter.data);
    }
    else if (action === 'add_holiday') {
      return handleAddHoliday(e.parameter.date, e.parameter.description, e.parameter.category);
    }
    else if (action === 'delete_holiday') {
      return handleDeleteHolidaySheet(e.parameter.date);
    }
    else if (action === 'absen_bulk') {
      return handleAbsenBulk(e.parameter.data, e.parameter.tanggal, e.parameter.is_edit);
    }
    else if (action === 'add_user') {
      return handleAddUser(e.parameter.username, e.parameter.password, e.parameter.role, e.parameter.nama, e.parameter.id_mesin, e.parameter.id_telegram, e.parameter.tugas_piket, e.parameter.wali_kelas);
    }
    else if (action === 'update_user') {
      return handleUpdateUser(e.parameter.old_username, e.parameter.username, e.parameter.password, e.parameter.role, e.parameter.nama, e.parameter.id_mesin, e.parameter.id_telegram, e.parameter.tugas_piket, e.parameter.wali_kelas);
    }
    else if (action === 'delete_user') {
      return handleDeleteUser(e.parameter.username);
    }
    else if (action === 'save_config') {
      return handleSaveConfig(
        e.parameter.nama_sekolah,
        e.parameter.tahun_pelajaran,
        e.parameter.telegram_bot_token,
        e.parameter.kop_yayasan,
        e.parameter.kop_sekolah,
        e.parameter.kop_alamat,
        e.parameter.kop_logo,
        e.parameter.kop_logo_size
      );
    }
    else if (action === 'setup_database' || action === 'initial_setup' || action === 'cleanup_and_repair_data' || action === 'fix_database') {
      return handleCleanupAndRepairData();
    }
    else if (action === 'get_kelas') {
      return handleGetKelas();
    }
    else if (action === 'save_kelas') {
      return handleSaveKelas(e.parameter.nama, e.parameter.tingkat, e.parameter.jurusan, e.parameter.wali_kelas, e.parameter.kapasitas, e.parameter.old_nama);
    }
    else if (action === 'delete_kelas') {
      return handleDeleteKelas(e.parameter.nama);
    }
    else if (action === 'seed_default_kelas') {
      return handleSeedDefaultKelas();
    }
    else if (action === 'get_mapel') {
      return handleGetMapel();
    }
    else if (action === 'save_mapel') {
      return handleSaveMapel(e.parameter.nama, e.parameter.target_kelas, e.parameter.old_nama);
    }
    else if (action === 'delete_mapel') {
      return handleDeleteMapel(e.parameter.nama);
    }
    else if (action === 'seed_default_mapel') {
      return handleSeedDefaultMapel();
    }
    else if (action === 'add_pelanggaran') {
      return handleAddPelanggaran(e.parameter.data);
    }
    else if (action === 'delete_pelanggaran') {
      return handleDeletePelanggaran(e.parameter.id);
    }
    else if (action === 'add_jenis_pelanggaran') {
      return handleAddJenisPelanggaran(e.parameter.nama);
    }
    else if (action === 'delete_jenis_pelanggaran') {
      return handleDeleteJenisPelanggaran(e.parameter.id);
    }
    else if (action === 'add_absen_guru') {
      return handleAddAbsenGuruManual(e.parameter.data);
    }
    else if (action === 'delete_absen_guru_date') {
      return handleDeleteAbsenGuruByDate(e.parameter.tanggal);
    }
    else if (action === 'add_pengajuan_izin') {
      return handleAddPengajuanIzin(e.parameter.data);
    }
    else if (action === 'approve_pengajuan_izin') {
      return handleApprovePengajuanIzin(e.parameter.id, e.parameter.approver);
    }
    else if (action === 'reject_pengajuan_izin') {
      return handleRejectPengajuanIzin(e.parameter.id, e.parameter.approver);
    }
    else if (action === 'delete_attendance_class') {
      return handleDeleteAttendanceByDateAndClass(e.parameter.tanggal, e.parameter.kelas);
    }
    else if (action === 'device_scan' || action === 'solution_scan') {
      return handleDeviceAttendanceScan(e.parameter.pin || e.parameter.nis, e.parameter.waktu, e.parameter.status);
    }
    else if (action === 'test_telegram') {
      return handleTestTelegram(e.parameter.chat_id || e.parameter.id_telegram);
    }
    else if (action === 'setup_device_columns') {
      ensureDeviceUserIdColumns();
      return jsonResponse('success', 'Header kolom ID_Mesin di Sheet DataSiswa dan Users berhasil dikonfigurasi!');
    }

    return jsonResponse('error', 'Action tidak ditemukan.');
  } catch (err) {
    return jsonResponse('error', 'Server Error: ' + err.toString());
  }
}


function ensureDatabaseSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Ensure SHEET_USERS (8 Columns layout - Wali_Kelas is fully handled by DataKelas)
  let sheetUsers = ss.getSheetByName(SHEET_USERS);
  if (!sheetUsers) {
    sheetUsers = ss.insertSheet(SHEET_USERS);
    sheetUsers.appendRow(['ID', 'Username', 'Password', 'Role', 'NamaLengkap', 'ID_Mesin', 'ID_Telegram', 'Tugas_Piket']);
  } else {
    const lastCol = Math.max(8, sheetUsers.getLastColumn());
    const headers = sheetUsers.getRange(1, 1, 1, lastCol).getValues()[0];
    if (!headers[0] || headers[0].toString().trim() === '') sheetUsers.getRange(1, 1).setValue('ID');
    if (!headers[1] || headers[1].toString().trim() === '') sheetUsers.getRange(1, 2).setValue('Username');
    if (!headers[2] || headers[2].toString().trim() === '') sheetUsers.getRange(1, 3).setValue('Password');
    if (!headers[3] || headers[3].toString().trim() === '') sheetUsers.getRange(1, 4).setValue('Role');
    if (!headers[4] || headers[4].toString().trim() === '') sheetUsers.getRange(1, 5).setValue('NamaLengkap');
    if (!headers[5] || headers[5].toString().trim() === '') sheetUsers.getRange(1, 6).setValue('ID_Mesin');
    if (!headers[6] || headers[6].toString().trim() === '') sheetUsers.getRange(1, 7).setValue('ID_Telegram');
    if (!headers[7] || headers[7].toString().trim() === '') sheetUsers.getRange(1, 8).setValue('Tugas_Piket');
  }

  // 2. Ensure SHEET_SISWA
  let sheetSiswa = ss.getSheetByName(SHEET_SISWA);
  if (sheetSiswa && sheetSiswa.getLastRow() > 0) {
    const lastCol = Math.max(8, sheetSiswa.getLastColumn());
    const headers = sheetSiswa.getRange(1, 1, 1, lastCol).getValues()[0];
    if (!headers[5] || headers[5].toString().trim() === '') sheetSiswa.getRange(1, 6).setValue('ID_Mesin');
    if (!headers[6] || headers[6].toString().trim() === '') sheetSiswa.getRange(1, 7).setValue('ID_Telegram');
    if (!headers[7] || headers[7].toString().trim() === '') sheetSiswa.getRange(1, 8).setValue('Password');
  }

  // 3. Ensure SHEET_IZIN_SISWA ('LogIzinSiswa')
  if (typeof getOrCreateIzinSiswaSheet === 'function') {
    getOrCreateIzinSiswaSheet(ss);
  }

  return true;
}

function ensureUserColumns() {
  ensureDatabaseSetup();
}

function ensureDeviceUserIdColumns() {
  ensureDatabaseSetup();
}

// Helper Ambil Data Pengguna / User
function getUsersFromCacheOrSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureDatabaseSetup();
  const sheet = ss.getSheetByName(SHEET_USERS);
  if (!sheet) return [];

  // Build Wali Kelas lookup dynamically from DataKelas (Single Source of Truth)
  const classWaliMap = {};
  const sheetKelas = ss.getSheetByName(SHEET_KELAS);
  if (sheetKelas) {
    const kData = sheetKelas.getDataRange().getValues();
    for (let k = 1; k < kData.length; k++) {
      const namaKelas = String(kData[k][0] || '').trim();
      const waliGuru = String(kData[k][3] || '').trim();
      if (namaKelas && waliGuru && waliGuru !== '-') {
        const wLower = waliGuru.toLowerCase();
        classWaliMap[wLower] = namaKelas;
        const cleanName = wLower.replace(/[^a-z0-9]/g, '');
        if (cleanName) classWaliMap[cleanName] = namaKelas;
      }
    }
  }

  const data = sheet.getDataRange().getValues();
  let users = [];

  for (let i = 1; i < data.length; i++) {
    const idUser = String(data[i][0] || '').trim();
    const u = String(data[i][1] || '').trim();
    if (!u) continue;
    const pwd = String(data[i][2] || '').trim();
    const role = String(data[i][3] || '').trim();
    const namaGuru = String(data[i][4] || u).trim();
    const idMesin = String(data[i][5] || '').trim();
    const idTg = String(data[i][6] || '').trim();

    // Auto-resolve Wali Kelas from DataKelas single source of truth
    let waliK = '-';
    const namaLower = namaGuru.toLowerCase();
    const uLower = u.toLowerCase();
    const cleanNamaLower = namaLower.replace(/[^a-z0-9]/g, '');
    const cleanULower = uLower.replace(/[^a-z0-9]/g, '');

    if (classWaliMap[namaLower]) {
      waliK = classWaliMap[namaLower];
    } else if (classWaliMap[uLower]) {
      waliK = classWaliMap[uLower];
    } else if (cleanNamaLower && classWaliMap[cleanNamaLower]) {
      waliK = classWaliMap[cleanNamaLower];
    } else if (cleanULower && classWaliMap[cleanULower]) {
      waliK = classWaliMap[cleanULower];
    } else {
      for (const [wKey, kName] of Object.entries(classWaliMap)) {
        if (wKey.length >= 3 && (namaLower.includes(wKey) || wKey.includes(namaLower))) {
          waliK = kName;
          break;
        }
      }
    }

    // Determine Tugas_Piket (If legacy 9-column sheet, col 9 [index 8], else col 8 [index 7])
    let tugasPiket = '-';
    if (data[i].length >= 9) {
      const col8Val = String(data[i][8] || '').trim();
      const col7Val = String(data[i][7] || '').trim();
      if (col8Val && col8Val !== '-') {
        tugasPiket = col8Val;
      } else if (col7Val && col7Val !== '-' && !col7Val.match(/^(x|xi|xii)/i)) {
        tugasPiket = col7Val;
      }
    } else if (data[i].length >= 8) {
      tugasPiket = String(data[i][7] || '-').trim();
    }

    users.push({
      id: idUser || String(i),
      nis: idUser || String(i),
      username: u,
      password: pwd,
      role: role,
      nama: namaGuru,
      id_mesin: idMesin,
      id_telegram: idTg,
      wali_kelas: waliK,
      tugas_piket: tugasPiket
    });
  }

  return users;
}

function handleLogin(username, password) {
  const u = String(username || '').trim();
  const p = String(password || '').trim();

  if (!u || !p) {
    return jsonResponse('error', 'Username/NIS dan Password wajib diisi.');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const uLower = u.toLowerCase();
  const pLower = p.toLowerCase();

  // 1. Cek di Sheet Users (Admin, Guru, TU, Kepsek)
  const sheetUsers = ss.getSheetByName(SHEET_USERS);
  if (sheetUsers) {
    const dataUsers = sheetUsers.getDataRange().getValues();
    for (let i = 1; i < dataUsers.length; i++) {
      const userU = String(dataUsers[i][1] || '').trim();
      if (!userU) continue;
      const userP = String(dataUsers[i][2] || '').trim();

      if (userU.toLowerCase() === uLower && (userP === p || userP.toLowerCase() === pLower)) {
        const role = String(dataUsers[i][3] || '').trim();
        const namaGuru = String(dataUsers[i][4] || userU).trim();
        const idMesin = String(dataUsers[i][5] || '').trim();
        const idTg = String(dataUsers[i][6] || '').trim();
        const tugasPiket = dataUsers[i].length >= 8 ? String(dataUsers[i][7] || '-').trim() : '-';

        return jsonResponse('success', 'Login berhasil!', {
          nis: userU,
          username: userU,
          role: role,
          nama: namaGuru,
          id_mesin: idMesin,
          id_telegram: idTg,
          wali_kelas: '-',
          tugas_piket: tugasPiket
        });
      }
    }
  }

  // 2. Jika tidak ada di Sheet Users, Cek di Sheet DataSiswa (Matching NIS / NISN)
  const sheetSiswa = ss.getSheetByName(SHEET_SISWA);
  if (sheetSiswa) {
    const dataSiswa = sheetSiswa.getDataRange().getValues();
    for (let j = 1; j < dataSiswa.length; j++) {
      const nisn = String(dataSiswa[j][0] || '').trim();
      const nis = String(dataSiswa[j][1] || '').trim();
      if (!nis && !nisn) continue;

      const nama = String(dataSiswa[j][2] || '').trim();
      const kelas = String(dataSiswa[j][3] || '').trim();
      const gender = String(dataSiswa[j][4] || '').trim();
      const id_mesin = String(dataSiswa[j][5] || '').trim();
      const id_telegram = String(dataSiswa[j][6] || '').trim();
      const savedPass = String(dataSiswa[j][7] || '').trim();

      const nisLower = nis.toLowerCase();
      const nisnLower = nisn.toLowerCase();

      // Password default adalah NIS atau NISN jika belum pernah diset custom
      const validPass = savedPass !== '' ? savedPass : (nis || nisn);
      const validPassLower = validPass.toLowerCase();

      const matchUser = (uLower === nisLower || uLower === nisnLower);
      const matchPass = (p === validPass || pLower === validPassLower || (nis && pLower === nisLower) || (nisn && pLower === nisnLower));

      if (matchUser && matchPass) {
        return jsonResponse('success', 'Berhasil login sebagai Siswa', {
          username: nis || nisn,
          role: 'Siswa',
          nama: nama,
          nis: nis,
          nisn: nisn,
          kelas: kelas,
          gender: gender,
          id_mesin: id_mesin,
          id_telegram: id_telegram,
          wali_kelas: '-',
          tugas_piket: '-'
        });
      }
    }
  }

  return jsonResponse('error', 'Username/NIS atau Password salah!');
}

// === HANDLER MANAJEMEN GURU / PENGGUNA (CRUD) ===
function updateClassWaliAssignment(ss, teacherNama, waliKelas) {
  if (!teacherNama) return;
  const sheetKelas = getOrCreateKelasSheet(ss);
  if (!sheetKelas) return;
  const kData = sheetKelas.getDataRange().getValues();
  const teacherLower = String(teacherNama).trim().toLowerCase();
  const targetK = String(waliKelas || '-').trim().toLowerCase();

  for (let i = 1; i < kData.length; i++) {
    const kNama = String(kData[i][0] || '').trim().toLowerCase();
    const kWali = String(kData[i][3] || '').trim().toLowerCase();

    if (targetK !== '-' && kNama === targetK) {
      sheetKelas.getRange(i + 1, 4).setValue(teacherNama);
    } else if (kWali === teacherLower && teacherLower) {
      sheetKelas.getRange(i + 1, 4).setValue('-');
    }
  }
}

// === CASCADE DATA UPDATE HELPERS (PREVENT DATA INCONSISTENCY) ===

function cascadeUpdateStudentData(ss, oldNis, oldNisn, oldNama, newNis, newNisn, newNama, newKelas, newIdMesin, newIdTelegram, oldIdMesin) {
  try {
    const oNis = String(oldNis || '').trim().toLowerCase();
    const oNisn = String(oldNisn || '').trim().toLowerCase();
    const oNama = String(oldNama || '').trim().toLowerCase();
    const oIdMesin = String(oldIdMesin || '').trim().toLowerCase();

    const cNisn = String(newNisn || '').trim();
    const cNis = String(newNis || '').trim();
    const cNama = String(newNama || '').trim();
    const cKelas = String(newKelas || '').trim();
    const cIdMesin = String(newIdMesin || '').trim();
    const cIdTg = String(newIdTelegram || '').trim();

    // 1. Update Sheet LogAbsen
    const sheetLog = ss.getSheetByName(SHEET_LOG);
    if (sheetLog && sheetLog.getLastRow() > 1) {
      const lData = sheetLog.getRange(2, 1, sheetLog.getLastRow() - 1, 11).getValues();
      for (let i = 0; i < lData.length; i++) {
        const rNisn = String(lData[i][3] || '').trim().toLowerCase();
        const rNis = String(lData[i][4] || '').trim().toLowerCase();
        const rNama = String(lData[i][5] || '').trim().toLowerCase();

        if ((oNisn && rNisn === oNisn) || (oNis && rNis === oNis) || (oNama && rNama === oNama)) {
          const rowIdx = i + 2;
          if (cNisn) sheetLog.getRange(rowIdx, 4).setValue(cNisn);
          if (cNis) sheetLog.getRange(rowIdx, 5).setValue(cNis);
          if (cNama) sheetLog.getRange(rowIdx, 6).setValue(cNama);
          if (cKelas) sheetLog.getRange(rowIdx, 7).setValue(cKelas);
          if (cIdMesin) sheetLog.getRange(rowIdx, 10).setValue(cIdMesin);
          if (cIdTg) sheetLog.getRange(rowIdx, 11).setValue(cIdTg);
        }
      }
    }

    // 2. Update Sheet LogIzinSiswa
    const sheetIzin = ss.getSheetByName(SHEET_IZIN_SISWA);
    if (sheetIzin && sheetIzin.getLastRow() > 1) {
      const izData = sheetIzin.getRange(2, 1, sheetIzin.getLastRow() - 1, 7).getValues();
      for (let i = 0; i < izData.length; i++) {
        const rNisn = String(izData[i][3] || '').trim().toLowerCase();
        const rNis = String(izData[i][4] || '').trim().toLowerCase();
        const rNama = String(izData[i][5] || '').trim().toLowerCase();

        if ((oNisn && rNisn === oNisn) || (oNis && rNis === oNis) || (oNama && rNama === oNama)) {
          const rowIdx = i + 2;
          if (cNisn) sheetIzin.getRange(rowIdx, 4).setValue(cNisn);
          if (cNis) sheetIzin.getRange(rowIdx, 5).setValue(cNis);
          if (cNama) sheetIzin.getRange(rowIdx, 6).setValue(cNama);
          if (cKelas) sheetIzin.getRange(rowIdx, 7).setValue(cKelas);
        }
      }
    }

    // 3. Update Sheet LogPelanggaran
    const sheetPel = ss.getSheetByName(SHEET_PELANGGARAN);
    if (sheetPel && sheetPel.getLastRow() > 1) {
      const pData = sheetPel.getRange(2, 1, sheetPel.getLastRow() - 1, 5).getValues();
      for (let i = 0; i < pData.length; i++) {
        const rNis = String(pData[i][2] || '').trim().toLowerCase();
        const rNama = String(pData[i][3] || '').trim().toLowerCase();

        if ((oNisn && rNis === oNisn) || (oNis && rNis === oNis) || (oNama && rNama === oNama)) {
          const rowIdx = i + 2;
          if (cNisn || cNis) sheetPel.getRange(rowIdx, 3).setValue(cNisn || cNis);
          if (cNama) sheetPel.getRange(rowIdx, 4).setValue(cNama);
          if (cKelas) sheetPel.getRange(rowIdx, 5).setValue(cKelas);
        }
      }
    }

    // 4. Update Sheet User_Mesin
    const sheetUM = ss.getSheetByName(SHEET_USER_MESIN);
    if (sheetUM && sheetUM.getLastRow() > 1) {
      const umData = sheetUM.getRange(2, 1, sheetUM.getLastRow() - 1, 6).getValues();
      for (let i = 0; i < umData.length; i++) {
        const rIdM = String(umData[i][0] || '').trim().toLowerCase();
        const rNama = String(umData[i][2] || '').trim().toLowerCase();

        if ((cIdMesin && rIdM === cIdMesin.toLowerCase()) || (oIdMesin && rIdM === oIdMesin) || (oNama && rNama === oNama)) {
          const rowIdx = i + 2;
          if (cIdMesin) sheetUM.getRange(rowIdx, 1).setValue(cIdMesin);
          if (cNama) sheetUM.getRange(rowIdx, 3).setValue(cNama);
          sheetUM.getRange(rowIdx, 4).setValue('Siswa');
          if (cKelas) sheetUM.getRange(rowIdx, 5).setValue(cKelas);
          if (cIdTg) sheetUM.getRange(rowIdx, 6).setValue(cIdTg);
        }
      }
    }

    // 5. Update Sheet Users (If Student Account Exists)
    const sheetUsers = ss.getSheetByName(SHEET_USERS);
    if (sheetUsers && sheetUsers.getLastRow() > 1) {
      const uData = sheetUsers.getRange(2, 1, sheetUsers.getLastRow() - 1, 5).getValues();
      for (let i = 0; i < uData.length; i++) {
        const rUsername = String(uData[i][1] || '').trim().toLowerCase();
        const rRole = String(uData[i][3] || '').trim().toLowerCase();
        const rNama = String(uData[i][4] || '').trim().toLowerCase();

        if (rRole === 'siswa' && ((oNisn && rUsername === oNisn) || (oNis && rUsername === oNis) || (oNama && rNama === oNama))) {
          const rowIdx = i + 2;
          if (cNisn || cNis) sheetUsers.getRange(rowIdx, 2).setValue(cNisn || cNis);
          if (cNama) sheetUsers.getRange(rowIdx, 5).setValue(cNama);
          if (cIdMesin) sheetUsers.getRange(rowIdx, 6).setValue(cIdMesin);
          if (cIdTg) sheetUsers.getRange(rowIdx, 7).setValue(cIdTg);
        }
      }
    }
  } catch (err) {
    Logger.log("Err cascadeUpdateStudentData: " + err.toString());
  }
}

function cascadeUpdateTeacherData(ss, oldUsername, oldNama, newUsername, newNama, newRole, newIdMesin, newIdTelegram, newWaliKelas, newTugasPiket, oldIdMesin) {
  try {
    const oU = String(oldUsername || '').trim().toLowerCase();
    const oNama = String(oldNama || '').trim().toLowerCase();
    const oIdMesin = String(oldIdMesin || '').trim().toLowerCase();

    const cU = String(newUsername || '').trim();
    const cNama = String(newNama || '').trim();
    const cRole = String(newRole || 'Guru').trim();
    const cIdMesin = String(newIdMesin || '').trim();
    const cIdTg = String(newIdTelegram || '').trim();

    // 1. Update Sheet LogAbsenGuru
    const sheetLogG = ss.getSheetByName(SHEET_LOG_GURU);
    if (sheetLogG && sheetLogG.getLastRow() > 1) {
      const gData = sheetLogG.getRange(2, 1, sheetLogG.getLastRow() - 1, 10).getValues();
      for (let i = 0; i < gData.length; i++) {
        const rU = String(gData[i][3] || '').trim().toLowerCase();
        const rNama = String(gData[i][4] || '').trim().toLowerCase();

        if ((oU && rU === oU) || (oNama && rNama === oNama)) {
          const rowIdx = i + 2;
          if (cU) sheetLogG.getRange(rowIdx, 4).setValue(cU);
          if (cNama) sheetLogG.getRange(rowIdx, 5).setValue(cNama);
          if (cRole) sheetLogG.getRange(rowIdx, 6).setValue(cRole);
          if (cIdMesin) sheetLogG.getRange(rowIdx, 9).setValue(cIdMesin);
          if (cIdTg) sheetLogG.getRange(rowIdx, 10).setValue(cIdTg);
        }
      }
    }

    // 2. Update Sheet DataKelas (Wali Kelas assignment & name sync)
    const sheetKelas = ss.getSheetByName(SHEET_KELAS);
    if (sheetKelas && sheetKelas.getLastRow() > 1) {
      const kData = sheetKelas.getRange(2, 1, sheetKelas.getLastRow() - 1, 4).getValues();
      const targetWaliK = String(newWaliKelas || '-').trim().toLowerCase();

      for (let i = 0; i < kData.length; i++) {
        const kNama = String(kData[i][0] || '').trim().toLowerCase();
        const kWali = String(kData[i][3] || '').trim().toLowerCase();

        if (targetWaliK !== '-' && kNama === targetWaliK) {
          sheetKelas.getRange(i + 2, 4).setValue(cNama);
        } else if (kWali === oNama || (oU && kWali === oU)) {
          if (targetWaliK === '-') {
            sheetKelas.getRange(i + 2, 4).setValue('-');
          } else {
            sheetKelas.getRange(i + 2, 4).setValue(cNama);
          }
        }
      }
    }

    // 3. Update Sheet LogIzinSiswa (Wali Kelas & Approver name sync)
    const sheetIzin = ss.getSheetByName(SHEET_IZIN_SISWA);
    if (sheetIzin && sheetIzin.getLastRow() > 1) {
      const izData = sheetIzin.getRange(2, 1, sheetIzin.getLastRow() - 1, 13).getValues();
      for (let i = 0; i < izData.length; i++) {
        const rWali = String(izData[i][7] || '').trim().toLowerCase();
        const rAppr = String(izData[i][12] || '').trim().toLowerCase();

        const rowIdx = i + 2;
        if (oNama && rWali === oNama && cNama) {
          sheetIzin.getRange(rowIdx, 8).setValue(cNama);
        }
        if (oNama && rAppr === oNama && cNama) {
          sheetIzin.getRange(rowIdx, 13).setValue(cNama);
        }
      }
    }

    // 4. Update Sheet PengajuanIzin (Guru & Staff leave requests)
    const sheetPengajuan = ss.getSheetByName(SHEET_PENGAJUAN_IZIN);
    if (sheetPengajuan && sheetPengajuan.getLastRow() > 1) {
      const pData = sheetPengajuan.getRange(2, 1, sheetPengajuan.getLastRow() - 1, 9).getValues();
      for (let i = 0; i < pData.length; i++) {
        const rNama = String(pData[i][1] || '').trim().toLowerCase();
        const rAppr = String(pData[i][8] || '').trim().toLowerCase();

        const rowIdx = i + 2;
        if (oNama && rNama === oNama && cNama) {
          sheetPengajuan.getRange(rowIdx, 2).setValue(cNama);
        }
        if (oNama && rAppr === oNama && cNama) {
          sheetPengajuan.getRange(rowIdx, 9).setValue(cNama);
        }
      }
    }

    // 5. Update Sheet LogPelanggaran (Guru Pelapor sync)
    const sheetPel = ss.getSheetByName(SHEET_PELANGGARAN);
    if (sheetPel && sheetPel.getLastRow() > 1) {
      const pelData = sheetPel.getRange(2, 1, sheetPel.getLastRow() - 1, 9).getValues();
      for (let i = 0; i < pelData.length; i++) {
        const rGuru = String(pelData[i][8] || '').trim().toLowerCase();
        if (oNama && rGuru === oNama && cNama) {
          sheetPel.getRange(i + 2, 9).setValue(cNama);
        }
      }
    }

    // 6. Update Sheet LogAbsen (Petugas/Guru name sync)
    const sheetLog = ss.getSheetByName(SHEET_LOG);
    if (sheetLog && sheetLog.getLastRow() > 1) {
      const lData = sheetLog.getRange(2, 1, sheetLog.getLastRow() - 1, 7).getValues();
      for (let i = 0; i < lData.length; i++) {
        const rPetugas = String(lData[i][6] || '').trim().toLowerCase();
        if (oNama && rPetugas === oNama && cNama) {
          sheetLog.getRange(i + 2, 7).setValue(cNama);
        }
      }
    }

    // 7. Update Sheet User_Mesin
    const sheetUM = ss.getSheetByName(SHEET_USER_MESIN);
    if (sheetUM && sheetUM.getLastRow() > 1) {
      const umData = sheetUM.getRange(2, 1, sheetUM.getLastRow() - 1, 6).getValues();
      for (let i = 0; i < umData.length; i++) {
        const rIdM = String(umData[i][0] || '').trim().toLowerCase();
        const rNama = String(umData[i][2] || '').trim().toLowerCase();

        if ((cIdMesin && rIdM === cIdMesin.toLowerCase()) || (oIdMesin && rIdM === oIdMesin) || (oNama && rNama === oNama) || (oU && rNama === oU)) {
          const rowIdx = i + 2;
          if (cIdMesin) sheetUM.getRange(rowIdx, 1).setValue(cIdMesin);
          if (cNama) sheetUM.getRange(rowIdx, 3).setValue(cNama);
          sheetUM.getRange(rowIdx, 4).setValue('Guru');
          if (cRole) sheetUM.getRange(rowIdx, 5).setValue(cRole);
          if (cIdTg) sheetUM.getRange(rowIdx, 6).setValue(cIdTg);
        }
      }
    }
  } catch (err) {
    Logger.log("Err cascadeUpdateTeacherData: " + err.toString());
  }
}

// === CASCADE UPDATE CLASS NAME ACROSS ALL RELATED SHEETS ===
function cascadeUpdateClassName(ss, oldClassName, newClassName) {
  if (!oldClassName || !newClassName || oldClassName === newClassName) return;

  try {
    const oK = String(oldClassName).trim().toLowerCase();
    const nK = String(newClassName).trim();

    // 1. Update Sheet DataSiswa
    const sheetSiswa = ss.getSheetByName(SHEET_SISWA);
    if (sheetSiswa && sheetSiswa.getLastRow() > 1) {
      const sData = sheetSiswa.getRange(2, 1, sheetSiswa.getLastRow() - 1, 4).getValues();
      for (let i = 0; i < sData.length; i++) {
        const k = String(sData[i][3] || '').trim().toLowerCase();
        if (k === oK) sheetSiswa.getRange(i + 2, 4).setValue(nK);
      }
    }

    // 2. Update Sheet LogAbsen
    const sheetLog = ss.getSheetByName(SHEET_LOG);
    if (sheetLog && sheetLog.getLastRow() > 1) {
      const lData = sheetLog.getRange(2, 1, sheetLog.getLastRow() - 1, 5).getValues();
      for (let i = 0; i < lData.length; i++) {
        const k = String(lData[i][4] || '').trim().toLowerCase();
        if (k === oK) sheetLog.getRange(i + 2, 5).setValue(nK);
      }
    }

    // 3. Update Sheet LogIzinSiswa
    const sheetIzin = ss.getSheetByName(SHEET_IZIN_SISWA);
    if (sheetIzin && sheetIzin.getLastRow() > 1) {
      const izData = sheetIzin.getRange(2, 1, sheetIzin.getLastRow() - 1, 7).getValues();
      for (let i = 0; i < izData.length; i++) {
        const k = String(izData[i][6] || '').trim().toLowerCase();
        if (k === oK) sheetIzin.getRange(i + 2, 7).setValue(nK);
      }
    }

    // 4. Update Sheet LogPelanggaran
    const sheetPel = ss.getSheetByName(SHEET_PELANGGARAN);
    if (sheetPel && sheetPel.getLastRow() > 1) {
      const pData = sheetPel.getRange(2, 1, sheetPel.getLastRow() - 1, 7).getValues();
      for (let i = 0; i < pData.length; i++) {
        const k = String(pData[i][6] || '').trim().toLowerCase();
        if (k === oK) sheetPel.getRange(i + 2, 7).setValue(nK);
      }
    }

    // 5. Update Sheet User_Mesin
    const sheetUM = ss.getSheetByName(SHEET_USER_MESIN);
    if (sheetUM && sheetUM.getLastRow() > 1) {
      const umData = sheetUM.getRange(2, 1, sheetUM.getLastRow() - 1, 5).getValues();
      for (let i = 0; i < umData.length; i++) {
        const k = String(umData[i][4] || '').trim().toLowerCase();
        if (k === oK) sheetUM.getRange(i + 2, 5).setValue(nK);
      }
    }
  } catch (err) {
    Logger.log("Err cascadeUpdateClassName: " + err.toString());
  }
}

function fetchUsersList(ss) {
  return getUsersFromCacheOrSheet();
}

function handleGetUsers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return jsonResponse('success', 'Daftar Pengguna', fetchUsersList(ss));
}

function handleAddUser(username, password, role, nama, id_mesin, id_telegram, tugas_piket, wali_kelas) {
  if (!username || !password || !nama) {
    return jsonResponse('error', 'Username, Password, dan Nama Lengkap wajib diisi.');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureDatabaseSetup();
  const sheet = ss.getSheetByName(SHEET_USERS);
  if (!sheet) return jsonResponse('error', 'Sheet Users tidak ditemukan.');

  const data = sheet.getDataRange().getValues();
  const newUsername = String(username).trim().toLowerCase();

  for (let i = 1; i < data.length; i++) {
    const existingUser = String(data[i][1] || '').trim().toLowerCase();
    if (existingUser === newUsername) {
      return jsonResponse('error', `Username "${username}" sudah terdaftar.`);
    }
  }

  const newId = String(data.length);
  sheet.appendRow([
    newId, 
    username.trim(), 
    password.trim(), 
    role || 'Guru', 
    nama.trim(), 
    String(id_mesin || '').trim(), 
    String(id_telegram || '').trim(),
    String(tugas_piket || '-').trim()
  ]);

  if (wali_kelas) {
    updateClassWaliAssignment(ss, nama.trim(), wali_kelas);
  }

  return jsonResponse('success', `Pengguna "${nama}" berhasil ditambahkan.`);
}

function handleUpdateUser(oldUsername, username, password, role, nama, id_mesin, id_telegram, tugas_piket, wali_kelas) {
  if (!oldUsername || !username || !nama) {
    return jsonResponse('error', 'Data pengguna tidak lengkap.');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureDatabaseSetup();

  // 1. Cek di SHEET_USERS
  const sheet = ss.getSheetByName(SHEET_USERS);
  if (sheet) {
    const data = sheet.getDataRange().getValues();
    const targetOld = String(oldUsername).trim().toLowerCase();

    for (let i = 1; i < data.length; i++) {
      const currentUsername = String(data[i][1] || '').trim().toLowerCase();
      if (currentUsername === targetOld) {
        const rowIndex = i + 1;
        const oldNama = String(data[i][4] || '').trim();
        const oldIdMesin = String(data[i][5] || '').trim();

        sheet.getRange(rowIndex, 2).setValue(username.trim()); // Username
        if (password) sheet.getRange(rowIndex, 3).setValue(password.trim()); // Password
        sheet.getRange(rowIndex, 4).setValue(role || 'Guru'); // Role
        sheet.getRange(rowIndex, 5).setValue(nama.trim()); // NamaLengkap
        sheet.getRange(rowIndex, 6).setValue(String(id_mesin || '').trim()); // ID_Mesin
        sheet.getRange(rowIndex, 7).setValue(String(id_telegram || '').trim()); // ID_Telegram
        sheet.getRange(rowIndex, 8).setValue(String(tugas_piket || '-').trim()); // Tugas_Piket

        if (wali_kelas !== undefined) {
          updateClassWaliAssignment(ss, nama.trim(), wali_kelas);
        }

        // Cascade Update related teacher data across all sheets
        cascadeUpdateTeacherData(ss, oldUsername, oldNama, username.trim(), nama.trim(), role || 'Guru', String(id_mesin || '').trim(), String(id_telegram || '').trim(), wali_kelas, String(tugas_piket || '-').trim(), oldIdMesin);

        return jsonResponse('success', `Data "${nama}" berhasil diperbarui.`);
      }
    }
  }

  // 2. Jika tidak ditemukan di SHEET_USERS, Cek di SHEET_SISWA (Siswa Self-Profile Update)
  const sheetSiswa = ss.getSheetByName(SHEET_SISWA);
  if (sheetSiswa) {
    const dataSiswa = sheetSiswa.getDataRange().getValues();
    const targetOld = String(oldUsername).trim().toLowerCase();
    for (let j = 1; j < dataSiswa.length; j++) {
      const nisn = String(dataSiswa[j][0] || '').trim().toLowerCase();
      const nis = String(dataSiswa[j][1] || '').trim().toLowerCase();

      if (nis === targetOld || nisn === targetOld) {
        const rowIndex = j + 1;
        const sNisn = String(dataSiswa[j][0] || '').trim();
        const sNis = String(dataSiswa[j][1] || '').trim();
        const sNama = String(dataSiswa[j][2] || '').trim();
        const sKelas = String(dataSiswa[j][3] || '').trim();
        const sIdMesin = String(dataSiswa[j][5] || '').trim();

        if (password) sheetSiswa.getRange(rowIndex, 8).setValue(password.trim()); // Password (col H)
        sheetSiswa.getRange(rowIndex, 7).setValue(String(id_telegram || '').trim()); // ID_Telegram (col G)

        cascadeUpdateStudentData(ss, sNis, sNisn, sNama, sNis, sNisn, sNama, sKelas, sIdMesin, String(id_telegram || '').trim(), sIdMesin);

        return jsonResponse('success', `Profil Siswa "${nama}" berhasil diperbarui.`);
      }
    }
  }

  return jsonResponse('error', 'Pengguna tidak ditemukan.');
}

function handleDeleteUser(username) {
  if (!username) return jsonResponse('error', 'Username tidak valid.');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_USERS);
  if (!sheet) return jsonResponse('error', 'Sheet Users tidak ditemukan.');

  const data = sheet.getDataRange().getValues();
  const targetUser = String(username).trim().toLowerCase();

  for (let i = 1; i < data.length; i++) {
    const currentUsername = String(data[i][1] || '').trim().toLowerCase();
    if (currentUsername === targetUser) {
      sheet.deleteRow(i + 1);
      return jsonResponse('success', `Pengguna "${username}" berhasil dihapus.`);
    }
  }

  return jsonResponse('error', 'Pengguna tidak ditemukan.');
}

// Helper Ambil Data Siswa Per-Kelas (RAM Cache per Kelas ~1-2KB, Ultra Fast & Safe)
function getStudentsForClass(ss, normTargetKelas, rawTargetKelas) {
  const cache = CacheService.getScriptCache();
  const cacheKey = 'students_cls_' + normTargetKelas;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    try {
      const parsed = JSON.parse(cachedData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) { }
  }

  const sheetSiswa = ss.getSheetByName(SHEET_SISWA);
  if (!sheetSiswa) return [];

  const dataSiswa = sheetSiswa.getDataRange().getValues();
  let students = [];

  for (let i = 1; i < dataSiswa.length; i++) {
    const nama = String(dataSiswa[i][2] || '').trim();
    if (!nama) continue;

    const k = String(dataSiswa[i][3] || '').trim().toLowerCase();
    if (k === rawTargetKelas || k.replace(/[\s\-]/g, '') === normTargetKelas) {
      const gRaw = String(dataSiswa[i][4] || '').trim().toUpperCase();
      const gender = (gRaw === 'P' || gRaw.startsWith('PEREMPUAN')) ? 'P' : 'L';
      students.push({
        nisn: String(dataSiswa[i][0] || ''),
        nis: String(dataSiswa[i][1] || ''),
        nama: nama,
        kelas: String(dataSiswa[i][3] || ''),
        gender: gender
      });
    }
  }

  if (students.length > 0) {
    try {
      cache.put(cacheKey, JSON.stringify(students), 7200);
    } catch (e) { }
  } else {
    try {
      cache.remove(cacheKey);
    } catch (e) { }
  }

  return students;
}

// === HANDLER GET STUDENTS & CEK STATUS ABSEN PADA TANGGAL SPESIFIK (ULTRA FAST < 50ms) ===
function handleGetStudents(kelas, tanggal) {
  const rawTargetKelas = String(kelas || '').trim().toLowerCase();
  const normTargetKelas = rawTargetKelas.replace(/[\s\-]/g, '');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const students = getStudentsForClass(ss, normTargetKelas, rawTargetKelas);

  // Cek apakah kelas ini sudah di-absen pada TANGGAL TERSEBUT (Fast scanning)
  const sheetLog = ss.getSheetByName(SHEET_LOG);
  let todayStatus = {};
  let alreadySubmitted = false;
  let submittedBy = '';
  let submittedTime = '';

  const targetTanggalStr = String(tanggal || '').trim() || getFormattedDate(new Date());

  // 1. Tarik status permohonan izin siswa yang sudah DISETUJU pada tanggal tersebut
  const sheetIzinSiswa = ss.getSheetByName(SHEET_IZIN_SISWA);
  if (sheetIzinSiswa && sheetIzinSiswa.getLastRow() > 1) {
    const izinData = sheetIzinSiswa.getRange(2, 1, sheetIzinSiswa.getLastRow() - 1, 14).getValues();
    for (let i = 0; i < izinData.length; i++) {
      const izTgl = getFormattedDate(izinData[i][2]);
      const izStatus = String(izinData[i][11] || '').trim().toLowerCase();
      if (izTgl === targetTanggalStr && izStatus === 'disetujui') {
        const izNisn = String(izinData[i][3] || '').trim().replace(/^'/, '');
        const izNis = String(izinData[i][4] || '').trim().replace(/^'/, '');
        const izNama = String(izinData[i][5] || '').trim().toLowerCase();
        const izKategori = String(izinData[i][8] || 'IZIN').toUpperCase();
        let st = 'IZIN';
        if (izKategori.includes('SAKIT')) st = 'SAKIT';
        else if (izKategori.includes('IZIN')) st = 'IZIN';

        if (izNis) todayStatus[izNis] = st;
        if (izNisn) todayStatus[izNisn] = st;
        if (izNama) todayStatus[izNama] = st;
      }
    }
  }

  // 2. Scan LogAbsen harian
  let totalLogCountForClass = 0;
  let nonAutoLogCount = 0;

  if (sheetLog) {
    const lastRow = sheetLog.getLastRow();
    if (lastRow > 1) {
      const startRow = 2;
      const numRows = lastRow - startRow + 1;
      const maxCols = Math.min(7, sheetLog.getLastColumn() || 7);
      const logData = sheetLog.getRange(startRow, 1, numRows, maxCols).getValues();

      for (let i = logData.length - 1; i >= 0; i--) {
        const rawDate = logData[i][0];
        if (!rawDate) continue;

        const logDateStr = getFormattedDate(rawDate);
        const logTimeStr = getFormattedTime(rawDate);

        const logKelas = String(logData[i][4] || '').trim().toLowerCase();
        const normLogKelas = logKelas.replace(/[\s\-]/g, '');

        if ((logKelas === rawTargetKelas || normLogKelas === normTargetKelas) && logDateStr === targetTanggalStr) {
          totalLogCountForClass++;
          const petugasStr = String(logData[i][6] || '');
          if (!petugasStr.startsWith('Auto-Izin')) {
            nonAutoLogCount++;
            submittedBy = petugasStr || 'Petugas';
            submittedTime = logTimeStr;
          }

          const nisn = String(logData[i][1] || '').trim().replace(/^'/, '');
          const nis = String(logData[i][2] || '').trim().replace(/^'/, '');
          const nama = String(logData[i][3] || '').trim().toLowerCase();
          const status = String(logData[i][5] || 'HADIR');

          if (nis) todayStatus[nis] = status;
          if (nisn) todayStatus[nisn] = status;
          if (nama) todayStatus[nama] = status;
        }
      }
    }
  }

  // Dikunci (alreadySubmitted = true) hanya jika ada absensi massal manual dari guru/petugas atau jumlah log >= jumlah siswa
  if (nonAutoLogCount > 0 || (students.length > 0 && totalLogCountForClass >= students.length)) {
    alreadySubmitted = true;
  }

  return jsonResponse('success', 'Daftar Siswa', {
    students: students,
    alreadySubmitted: alreadySubmitted,
    submittedBy: submittedBy,
    submittedTime: submittedTime,
    todayStatus: todayStatus,
    targetTanggal: targetTanggalStr
  });
}

// === HANDLER TARIK SEMUA MASTER DATA (SANGAT CEPAT UNTUK CLIENT CACHING) ===
function handleGetAllMasterData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureDeviceUserIdColumns();

  // 1. Ambil Semua Data Siswa
  const sheetSiswa = ss.getSheetByName(SHEET_SISWA);
  let students = [];
  if (sheetSiswa) {
    ensureStudentGenderColumn(sheetSiswa);
    const dataSiswa = sheetSiswa.getDataRange().getValues();
    for (let i = 1; i < dataSiswa.length; i++) {
      const nama = String(dataSiswa[i][2] || '').trim();
      if (!nama) continue;
      const gRaw = String(dataSiswa[i][4] || '').trim().toUpperCase();
      const gender = (gRaw === 'P' || gRaw.startsWith('PEREMPUAN')) ? 'P' : 'L';
      students.push({
        nisn: String(dataSiswa[i][0] || ''),
        nis: String(dataSiswa[i][1] || ''),
        nama: nama,
        kelas: String(dataSiswa[i][3] || ''),
        gender: gender,
        id_mesin: String(dataSiswa[i][5] || '')
      });
    }
  }

  // 2. Ambil Log Absen Terbaru (Semua baris log untuk rekap 100% lengkap)
  const sheetLog = ss.getSheetByName(SHEET_LOG);
  let recentLogs = [];
  if (sheetLog) {
    const lastRow = sheetLog.getLastRow();
    if (lastRow > 1) {
      const startRow = 2; // Tarik seluruh log absensi agar rekap bulanan & semester terhitung sempurna
      const numRows = lastRow - startRow + 1;
      const maxCols = Math.min(7, sheetLog.getLastColumn() || 7);
      const logData = sheetLog.getRange(startRow, 1, numRows, maxCols).getValues();

      for (let i = logData.length - 1; i >= 0; i--) {
        const rawDate = logData[i][0];
        if (!rawDate) continue;

        const logDateStr = getFormattedDate(rawDate);
        const logTimeStr = getFormattedTime(rawDate);

        recentLogs.push({
          tanggal: logDateStr,
          jam: logTimeStr,
          nisn: String(logData[i][1] || '').trim().replace(/^'/, ''),
          nis: String(logData[i][2] || '').trim().replace(/^'/, ''),
          nama: String(logData[i][3] || '').trim(),
          kelas: String(logData[i][4] || '').trim(),
          status: String(logData[i][5] || 'HADIR'),
          petugas: String(logData[i][6] || 'Petugas')
        });
      }
    }
  }

  // 2b. Ambil Permohonan Izin Siswa yang Disetujui
  const sheetIzinSiswa = ss.getSheetByName(SHEET_IZIN_SISWA);
  if (sheetIzinSiswa && sheetIzinSiswa.getLastRow() > 1) {
    const izData = sheetIzinSiswa.getRange(2, 1, sheetIzinSiswa.getLastRow() - 1, 14).getValues();
    for (let i = izData.length - 1; i >= 0; i--) {
      const statusIz = String(izData[i][11] || '').trim().toLowerCase();
      if (statusIz === 'disetujui') {
        const izTgl = getFormattedDate(izData[i][2]);
        const izKat = String(izData[i][8] || 'IZIN').toUpperCase();
        let st = 'IZIN';
        if (izKat.includes('SAKIT')) st = 'SAKIT';
        else if (izKat.includes('IZIN')) st = 'IZIN';

        recentLogs.push({
          tanggal: izTgl,
          jam: '07:00:00',
          nisn: String(izData[i][3] || '').trim().replace(/^'/, ''),
          nis: String(izData[i][4] || '').trim().replace(/^'/, ''),
          nama: String(izData[i][5] || '').trim(),
          kelas: String(izData[i][6] || '').trim(),
          status: st,
          petugas: 'Auto-Izin (Walas)'
        });
      }
    }
  }

  // 3. Ambil Log Pelanggaran Siswa
  const sheetPelanggaran = ss.getSheetByName(SHEET_PELANGGARAN);
  let recentPelanggaran = [];
  if (sheetPelanggaran) {
    const lastRowP = sheetPelanggaran.getLastRow();
    if (lastRowP > 1) {
      const startRowP = Math.max(2, lastRowP - 500);
      const numRowsP = lastRowP - startRowP + 1;
      const pData = sheetPelanggaran.getRange(startRowP, 1, numRowsP, 10).getValues();

      for (let i = pData.length - 1; i >= 0; i--) {
        const pId = String(pData[i][0] || '');
        if (!pId && !pData[i][2]) continue;

        let tglStr = String(pData[i][2] || '');
        if (pData[i][2] instanceof Date) {
          tglStr = getFormattedDate(pData[i][2]);
        }

        recentPelanggaran.push({
          id: pId || (startRowP + i).toString(),
          waktu: String(pData[i][1] || ''),
          tanggal: tglStr,
          nisn: String(pData[i][3] || ''),
          nis: String(pData[i][4] || ''),
          nama: String(pData[i][5] || ''),
          kelas: String(pData[i][6] || ''),
          pelanggaran: String(pData[i][7] || ''),
          guruPelapor: String(pData[i][8] || ''),
          keterangan: String(pData[i][9] || '')
        });
      }
    }
  }

  // 4. Ambil Log Absen Guru, Pengajuan Izin & User List
  let absenGuru = fetchAbsenGuruList(ss);
  let pengajuanIzin = fetchPengajuanIzinList(ss);
  let usersList = fetchUsersList(ss);

  // 5. Ambil Daftar Master Jenis Pelanggaran (Dinamis dari Sheet DataPelanggaran)
  let jenisPelanggaran = getJenisPelanggaranList(ss);

  // 6. Ambil Config Sekolah & Tahun Pelajaran
  const config = getConfigObject(ss);

  return jsonResponse('success', 'Master Data Ditarik', {
    students: students,
    recentLogs: recentLogs,
    recentPelanggaran: recentPelanggaran,
    jenisPelanggaran: jenisPelanggaran,
    absenGuru: absenGuru,
    pengajuanIzin: pengajuanIzin,
    users: usersList,
    config: config
  });
}

function getConfigObject(ss) {
  let sheetConfig = ss.getSheetByName(SHEET_CONFIG);
  let config = {
    namaSekolah: 'SMA 1 BARUNAWATI',
    tahunPelajaran: '2026-2027',
    telegramBotToken: '',
    kopYayasan: 'YAYASAN SEKAR LAUT PELNI',
    kopSekolah: 'SMA 1 BARUNAWATI',
    kopAlamat: 'Jl. X-III Aipda KS Tubun II/III No.7, Slipi Palmerah, Jakarta Barat | Telp/Fax : (021) 5303083',
    kopLogo: '',
    kopLogoSize: '85'
  };

  try {
    config.telegramBotToken = PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN') || '';
  } catch(e) {}

  if (!sheetConfig) {
    sheetConfig = ss.insertSheet(SHEET_CONFIG);
    sheetConfig.appendRow(['Key', 'Value']);
    sheetConfig.appendRow(['NamaSekolah', config.namaSekolah]);
    sheetConfig.appendRow(['TahunPelajaran', config.tahunPelajaran]);
    sheetConfig.appendRow(['TelegramBotToken', config.telegramBotToken]);
    sheetConfig.appendRow(['KopYayasan', config.kopYayasan]);
    sheetConfig.appendRow(['KopSekolah', config.kopSekolah]);
    sheetConfig.appendRow(['KopAlamat', config.kopAlamat]);
    sheetConfig.appendRow(['KopLogo', config.kopLogo]);
    sheetConfig.appendRow(['KopLogoSize', config.kopLogoSize]);
    sheetConfig.getRange("A1:B1").setFontWeight("bold").setBackground("#d9ead3");
  } else {
    const data = sheetConfig.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const rawKey = String(data[i][0] || '').trim();
      const val = String(data[i][1] || '').trim();
      const normKey = rawKey.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (normKey === 'namasekolah' || normKey === 'sekolah') {
        if (val) config.namaSekolah = val;
      }
      if (normKey === 'tahunpelajaran' || normKey === 'tahunajaran' || normKey === 'tp' || normKey === 'ta') {
        if (val) config.tahunPelajaran = val;
      }
      if (normKey.includes('telegram') || normKey.includes('bot') || normKey.includes('token')) {
        if (val) config.telegramBotToken = val;
      }
      if (normKey === 'kopyayasan' || normKey === 'yayasan') {
        if (val) config.kopYayasan = val;
      }
      if (normKey === 'kopsekolah') {
        if (val) config.kopSekolah = val;
      }
      if (normKey === 'kopalamat' || normKey === 'alamat') {
        if (val) config.kopAlamat = val;
      }
      if (normKey === 'koplogo' || normKey === 'logo') {
        if (val) config.kopLogo = val;
      }
      if (normKey === 'koplogosize' || normKey === 'logosize') {
        if (val) config.kopLogoSize = val;
      }
    }
  }
  return config;
}

function handleGetConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return jsonResponse('success', 'Config Loaded', getConfigObject(ss));
}

function handleSaveConfig(namaSekolah, tahunPelajaran, telegramBotToken, kopYayasan, kopSekolah, kopAlamat, kopLogo, kopLogoSize) {
  if (!namaSekolah || !tahunPelajaran) {
    return jsonResponse('error', 'Nama Sekolah dan Tahun Pelajaran wajib diisi.');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheetConfig = ss.getSheetByName(SHEET_CONFIG);
  const cleanToken = String(telegramBotToken || '').trim();

  const cYayasan = String(kopYayasan || '').trim();
  const cSekolah = String(kopSekolah || namaSekolah || '').trim();
  const cAlamat = String(kopAlamat || '').trim();
  const cLogo = String(kopLogo || '').trim();
  const cLogoSize = String(kopLogoSize || '85').trim();

  // Simpan ke Script Properties
  try {
    if (cleanToken) {
      PropertiesService.getScriptProperties().setProperty('TELEGRAM_BOT_TOKEN', cleanToken);
    }
  } catch(e) {}

  if (!sheetConfig) {
    sheetConfig = ss.insertSheet(SHEET_CONFIG);
    sheetConfig.appendRow(['Key', 'Value']);
    sheetConfig.appendRow(['NamaSekolah', namaSekolah.trim()]);
    sheetConfig.appendRow(['TahunPelajaran', tahunPelajaran.trim()]);
    sheetConfig.appendRow(['TelegramBotToken', cleanToken]);
    sheetConfig.appendRow(['KopYayasan', cYayasan]);
    sheetConfig.appendRow(['KopSekolah', cSekolah]);
    sheetConfig.appendRow(['KopAlamat', cAlamat]);
    sheetConfig.appendRow(['KopLogo', cLogo]);
    sheetConfig.appendRow(['KopLogoSize', cLogoSize]);
  } else {
    const data = sheetConfig.getDataRange().getValues();
    let foundNama = false;
    let foundTahun = false;
    let foundToken = false;
    let foundYayasan = false;
    let foundKopSekolah = false;
    let foundAlamat = false;
    let foundLogo = false;
    let foundLogoSize = false;

    for (let i = 1; i < data.length; i++) {
      const rawKey = String(data[i][0] || '').trim();
      const normKey = rawKey.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (normKey === 'namasekolah' || normKey === 'sekolah') {
        sheetConfig.getRange(i + 1, 2).setValue(namaSekolah.trim());
        foundNama = true;
      }
      if (normKey === 'tahunpelajaran' || normKey === 'tahunajaran' || normKey === 'tp') {
        sheetConfig.getRange(i + 1, 2).setValue(tahunPelajaran.trim());
        foundTahun = true;
      }
      if (normKey.includes('telegram') || normKey.includes('bot') || normKey.includes('token')) {
        sheetConfig.getRange(i + 1, 2).setValue(cleanToken);
        foundToken = true;
      }
      if (normKey === 'kopyayasan' || normKey === 'yayasan') {
        sheetConfig.getRange(i + 1, 2).setValue(cYayasan);
        foundYayasan = true;
      }
      if (normKey === 'kopsekolah') {
        sheetConfig.getRange(i + 1, 2).setValue(cSekolah);
        foundKopSekolah = true;
      }
      if (normKey === 'kopalamat' || normKey === 'alamat') {
        sheetConfig.getRange(i + 1, 2).setValue(cAlamat);
        foundAlamat = true;
      }
      if (normKey === 'koplogo' || normKey === 'logo') {
        sheetConfig.getRange(i + 1, 2).setValue(cLogo);
        foundLogo = true;
      }
      if (normKey === 'koplogosize' || normKey === 'logosize') {
        sheetConfig.getRange(i + 1, 2).setValue(cLogoSize);
        foundLogoSize = true;
      }
    }

    if (!foundNama) sheetConfig.appendRow(['NamaSekolah', namaSekolah.trim()]);
    if (!foundTahun) sheetConfig.appendRow(['TahunPelajaran', tahunPelajaran.trim()]);
    if (!foundToken) sheetConfig.appendRow(['TelegramBotToken', cleanToken]);
    if (!foundYayasan) sheetConfig.appendRow(['KopYayasan', cYayasan]);
    if (!foundKopSekolah) sheetConfig.appendRow(['KopSekolah', cSekolah]);
    if (!foundAlamat) sheetConfig.appendRow(['KopAlamat', cAlamat]);
    if (!foundLogo) sheetConfig.appendRow(['KopLogo', cLogo]);
    if (!foundLogoSize) sheetConfig.appendRow(['KopLogoSize', cLogoSize]);
  }

  return jsonResponse('success', 'Pengaturan sekolah & Kop Surat berhasil diperbarui.');
}

// === HANDLER ABSEN BULK (FAST, DEDUPLICATED & EDIT SUPPORT) ===
function handleAbsenBulk(dataString, customTanggal, isEditParam) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetLog = ss.getSheetByName(SHEET_LOG);
  if (!sheetLog) return jsonResponse('error', 'Sheet LogAbsen tidak ditemukan.');

  let dataObj;
  try {
    dataObj = JSON.parse(dataString);
  } catch (err) {
    return jsonResponse('error', 'Format data tidak valid.');
  }

  if (!dataObj || dataObj.length === 0) {
    return jsonResponse('error', 'Data absensi kosong.');
  }

  const isEditMode = String(isEditParam || '').toLowerCase() === 'true';

  const now = new Date();
  const timeFormatted = Utilities.formatDate(now, TIMEZONE, "HH:mm:ss");
  let targetTanggalStr = getFormattedDate(now);
  let waktuStr = Utilities.formatDate(now, TIMEZONE, "yyyy-MM-dd HH:mm:ss");

  if (customTanggal && customTanggal.trim() !== '') {
    targetTanggalStr = customTanggal.trim();
    waktuStr = targetTanggalStr + " " + timeFormatted;
  }

  const firstStudent = dataObj[0];
  const sampleKelas = String(firstStudent.kelas || '').trim().toLowerCase();
  const normSampleKelas = sampleKelas.replace(/[\s\-]/g, '');

  const todayStr = getFormattedDate(now);
  if (targetTanggalStr > todayStr) {
    return jsonResponse('error', `Gagal menyimpan: Tidak dapat melakukan absensi untuk tanggal yang belum terjadi (${targetTanggalStr}).`);
  }

  const lastRow = sheetLog.getLastRow();
  let updatedCount = 0;

  if (lastRow > 1) {
    const checkStart = 2;
    const numCheck = lastRow - checkStart + 1;
    const existingLogs = sheetLog.getRange(checkStart, 1, numCheck, 7).getValues();

    let nonAutoCount = 0;
    for (let i = existingLogs.length - 1; i >= 0; i--) {
      const rawDate = existingLogs[i][0];
      if (!rawDate) continue;

      const logDateStr = getFormattedDate(rawDate);
      const logKelas = String(existingLogs[i][4] || '').trim().toLowerCase().replace(/[\s\-]/g, '');
      const petugasStr = String(existingLogs[i][6] || '');

      if (logKelas === normSampleKelas && logDateStr === targetTanggalStr) {
        if (!petugasStr.startsWith('Auto-Izin')) {
          nonAutoCount++;
        }
      }
    }

    if (isEditMode || nonAutoCount === 0) {
      // Hapus log lama (termasuk auto-izin sementara) untuk kelas & tanggal ini agar ter-update tanpa duplikasi
      for (let i = existingLogs.length - 1; i >= 0; i--) {
        const rawDate = existingLogs[i][0];
        if (!rawDate) continue;

        const logDateStr = getFormattedDate(rawDate);
        const logKelas = String(existingLogs[i][4] || '').trim().toLowerCase().replace(/[\s\-]/g, '');

        if (logKelas === normSampleKelas && logDateStr === targetTanggalStr) {
          sheetLog.deleteRow(checkStart + i);
          updatedCount++;
        }
      }
    } else {
      // SIMPAN NORMAL: Tolak simpan ganda jika absensi kelas sudah pernah di-submit penuh oleh guru/petugas
      return jsonResponse('error', `Gagal menyimpan: Data absensi kelas ${firstStudent.kelas} untuk tanggal ${targetTanggalStr} sudah ada di database sheet. Klik tombol 'Edit Data Absensi' jika ingin mengedit.`);
    }
  }

  // Tulis data absensi baru / hasil edit terbaru
  const rowsToAppend = [];
  dataObj.forEach(s => {
    rowsToAppend.push([waktuStr, s.nisn, s.nis, s.nama, s.kelas, s.status, s.petugas]);
  });

  if (rowsToAppend.length > 0) {
    const startRow = sheetLog.getLastRow() + 1;
    sheetLog.getRange(startRow, 1, rowsToAppend.length, rowsToAppend[0].length).setValues(rowsToAppend);
  }

  const msgText = updatedCount > 0
    ? `Berhasil memperbarui (edit) absensi ${rowsToAppend.length} siswa kelas ${firstStudent.kelas}.`
    : `Berhasil menyimpan absensi ${rowsToAppend.length} siswa.`;

  return jsonResponse('success', msgText);
}

// === HANDLER HAPUS ABSENSI PER KELAS & TANGGAL (PEMBERSIHAN DATA MASA DEPAN / ANOMALI) ===
function handleDeleteAttendanceByDateAndClass(tanggal, targetKelas) {
  try {
    if (!tanggal || !targetKelas) {
      return jsonResponse('error', 'Tanggal dan Kelas wajib diisi.');
    }
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetLog = ss.getSheetByName(SHEET_LOG);
    if (!sheetLog) {
      return jsonResponse('error', 'Sheet LogAbsen tidak ditemukan.');
    }

    const normTargetKelas = String(targetKelas).trim().toLowerCase().replace(/[\s\-]/g, '');
    const targetTanggalStr = getFormattedDate(tanggal);

    const lastRow = sheetLog.getLastRow();
    let deletedCount = 0;

    if (lastRow > 1) {
      const data = sheetLog.getRange(2, 1, lastRow - 1, 7).getValues();
      for (let i = data.length - 1; i >= 0; i--) {
        const rawDate = data[i][0];
        if (!rawDate) continue;

        let logDateStr = '';
        if (rawDate instanceof Date) logDateStr = getFormattedDate(rawDate);
        else logDateStr = String(rawDate).trim().substring(0, 10);

        const logKelas = String(data[i][4] || '').trim().toLowerCase().replace(/[\s\-]/g, '');

        if (logDateStr === targetTanggalStr && logKelas === normTargetKelas) {
          sheetLog.deleteRow(i + 2);
          deletedCount++;
        }
      }
    }

    return jsonResponse('success', `Berhasil menghapus ${deletedCount} data absensi kelas ${targetKelas} pada tanggal ${targetTanggalStr}.`);
  } catch (err) {
    return jsonResponse('error', 'Gagal menghapus data absensi: ' + err.toString());
  }
}

// === ACCURATE & FULL GET REPORT (Fast Date Formatting) ===
function handleGetReport(bulanFilter, kelasFilter, tanggalFilter) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetLog = ss.getSheetByName(SHEET_LOG);
  if (!sheetLog) return jsonResponse('error', 'Sheet LogAbsen tidak ditemukan.');

  const lastRow = sheetLog.getLastRow();
  if (lastRow <= 1) {
    return jsonResponse('success', 'Data ditarik', []);
  }

  const targetBulan = String(bulanFilter || 'Semua').trim();
  const rawKelas = String(kelasFilter || 'Semua').trim().toLowerCase();
  let targetTanggal = String(tanggalFilter || '').trim();

  if (targetTanggal === 'today' || targetTanggal === 'Hari Ini') {
    targetTanggal = getFormattedDate(new Date());
  }

  const startRow = 2;
  const numRows = lastRow - startRow + 1;
  const data = sheetLog.getRange(startRow, 1, numRows, 7).getValues();

  let result = [];
  const seenStudentKeys = new Set();

  for (let i = data.length - 1; i >= 0; i--) {
    const rawDate = data[i][0];
    if (!rawDate) continue;

    const dateFormatted = getFormattedDate(rawDate); // YYYY-MM-DD
    if (!dateFormatted) continue;

    const rowKelas = String(data[i][4] || '').trim().toLowerCase();
    const nisn = String(data[i][1] || '').trim();
    const nis = String(data[i][2] || '').trim();
    const nama = String(data[i][3] || '').trim();

    // Key unik per siswa per tanggal (terbaca baik via NISN, NIS, atau Nama)
    const sKey = `${nisn || nis || nama.toLowerCase().replace(/[\s\-]/g, '')}_${dateFormatted}`;

    const parts = dateFormatted.split('-');
    const b = parts.length >= 2 ? parts[1] : '';

    let matchBulan = (targetBulan === 'Semua' || targetBulan === b || parseInt(targetBulan) === parseInt(b));
    let matchKelas = (rawKelas === 'semua' || rawKelas === 'semua kelas' || rawKelas === '' || rowKelas === rawKelas || rowKelas.replace(/[\s\-]/g, '') === rawKelas.replace(/[\s\-]/g, ''));
    let matchTanggal = (targetTanggal === 'Semua' || targetTanggal === '' || targetTanggal === dateFormatted);

    if (matchBulan && matchKelas && matchTanggal) {
      if (!seenStudentKeys.has(sKey)) {
        seenStudentKeys.add(sKey);
        result.push({
          waktu: String(data[i][0] || ''),
          nisn: nisn,
          nis: nis,
          nama: nama,
          kelas: String(data[i][4] || ''),
          status: String(data[i][5] || ''),
          petugas: String(data[i][6] || ''),
          tanggal: dateFormatted
        });
      }
    }
  }
  return jsonResponse('success', 'Data ditarik', result);
}

// === FUNGSI LOG PELANGGARAN & DATA JENIS PELANGGARAN ===

function getJenisPelanggaranList(ss) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_JENIS_PELANGGARAN);
  let list = [];

  const defaultItems = [
    "Datang Terlambat",
    "Tidak Memakai Dasi",
    "Tidak Memakai Ikat Pinggang",
    "Tidak Memakai Kacu Pramuka",
    "Tidak Memakai Ring Pramuka",
    "Tidak Memakai Sepatu",
    "Tidak Memakai Atribut yang sesuai aturan",
    "Keluar sekolah tanpa Izin",
    "Bersolek",
    "Berbicara menggunakan bahasa yang tidak pantas",
    "Lainnya"
  ];

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_JENIS_PELANGGARAN);
    sheet.appendRow(['ID', 'NamaPelanggaran']);
    defaultItems.forEach((item, idx) => {
      sheet.appendRow([(idx + 1).toString(), item]);
    });
    sheet.getRange("A1:B1").setFontWeight("bold").setBackground("#fce5cd");
    return defaultItems;
  }

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const val = String(data[i][1] || '').trim();
    if (val) list.push(val);
  }

  if (list.length === 0) {
    defaultItems.forEach((item, idx) => {
      sheet.appendRow([(idx + 1).toString(), item]);
    });
    return defaultItems;
  }

  return list;
}

function handleGetPelanggaran() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_PELANGGARAN);
  if (!sheet) return jsonResponse('success', 'Data Kosong', []);

  const data = sheet.getDataRange().getValues();
  let list = [];
  for (let i = 1; i < data.length; i++) {
    const id = String(data[i][0] || '');
    if (!id && !data[i][2]) continue;

    let tglStr = String(data[i][2] || '');
    if (data[i][2] instanceof Date) tglStr = getFormattedDate(data[i][2]);

    list.push({
      id: id || i.toString(),
      waktu: String(data[i][1] || ''),
      tanggal: tglStr,
      nisn: String(data[i][3] || ''),
      nis: String(data[i][4] || ''),
      nama: String(data[i][5] || ''),
      kelas: String(data[i][6] || ''),
      pelanggaran: String(data[i][7] || ''),
      guruPelapor: String(data[i][8] || ''),
      keterangan: String(data[i][9] || '')
    });
  }
  return jsonResponse('success', 'Data Pelanggaran Ditarik', list);
}

function handleAddPelanggaran(dataJsonStr) {
  if (!dataJsonStr) return jsonResponse('error', 'Data violation payload kosong.');

  try {
    const item = typeof dataJsonStr === 'object' ? dataJsonStr : JSON.parse(dataJsonStr);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_PELANGGARAN);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_PELANGGARAN);
      sheet.appendRow(['ID', 'Waktu', 'Tanggal', 'NISN', 'NIS', 'Nama', 'Kelas', 'Pelanggaran', 'GuruPelapor', 'Keterangan']);
      sheet.getRange("A1:J1").setFontWeight("bold").setBackground("#fce5cd");
    }

    const newId = 'PEL-' + Date.now();
    const waktuNow = Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm:ss");
    const tgl = item.tanggal || Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd");

    sheet.appendRow([
      newId,
      waktuNow,
      tgl,
      String(item.nisn || ''),
      String(item.nis || ''),
      String(item.nama || ''),
      String(item.kelas || ''),
      String(item.pelanggaran || ''),
      String(item.guruPelapor || 'Petugas'),
      String(item.keterangan || '')
    ]);

    return jsonResponse('success', 'Catatan pelanggaran berhasil disimpan', {
      id: newId,
      waktu: waktuNow,
      tanggal: tgl,
      nisn: item.nisn,
      nis: item.nis,
      nama: item.nama,
      kelas: item.kelas,
      pelanggaran: item.pelanggaran,
      guruPelapor: item.guruPelapor,
      keterangan: item.keterangan
    });
  } catch (e) {
    return jsonResponse('error', 'Gagal menyimpan pelanggaran: ' + e.toString());
  }
}

function handleDeletePelanggaran(id) {
  if (!id) return jsonResponse('error', 'ID Pelanggaran wajib diisi.');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_PELANGGARAN);
  if (!sheet) return jsonResponse('error', 'Sheet LogPelanggaran tidak ditemukan.');

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return jsonResponse('success', 'Catatan pelanggaran berhasil dihapus.');
    }
  }
  return jsonResponse('error', 'Catatan pelanggaran tidak ditemukan.');
}

function handleGetJenisPelanggaran() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const list = getJenisPelanggaranList(ss);
  return jsonResponse('success', 'Jenis Pelanggaran Loaded', list);
}

function handleAddJenisPelanggaran(nama) {
  if (!nama || !nama.trim()) return jsonResponse('error', 'Nama jenis pelanggaran tidak boleh kosong.');
  const nameClean = nama.trim();

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_JENIS_PELANGGARAN);
  if (!sheet) getJenisPelanggaranList(ss);
  sheet = ss.getSheetByName(SHEET_JENIS_PELANGGARAN);

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1] || '').trim().toLowerCase() === nameClean.toLowerCase()) {
      return jsonResponse('error', 'Jenis pelanggaran ini sudah ada.');
    }
  }

  const newId = (data.length).toString();
  sheet.appendRow([newId, nameClean]);
  return jsonResponse('success', 'Jenis pelanggaran baru berhasil ditambahkan.', nameClean);
}

function handleDeleteJenisPelanggaran(idOrNama) {
  if (!idOrNama) return jsonResponse('error', 'Target jenis pelanggaran wajib diisi.');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_JENIS_PELANGGARAN);
  if (!sheet) return jsonResponse('error', 'Sheet DataPelanggaran tidak ditemukan.');

  const target = String(idOrNama).trim().toLowerCase();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const rowId = String(data[i][0] || '').trim().toLowerCase();
    const rowName = String(data[i][1] || '').trim().toLowerCase();
    if (rowId === target || rowName === target) {
      sheet.deleteRow(i + 1);
      return jsonResponse('success', 'Jenis pelanggaran berhasil dihapus.');
    }
  }
  return jsonResponse('error', 'Jenis pelanggaran tidak ditemukan.');
}

// === TRIGGER MENU OTOMATIS SAAT SPREADSHEET DIBUKA ===
function onOpen() {
  try {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu('🚀 Smart Absensi')
      .addItem('⚙️ Setup Database Otomatis', 'initialSetup')
      .addToUi();
  } catch (e) { }
}

// === FUNGSI SETUP DATABASE OTOMATIS BERSIH & LENGKAP ===
function initialSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Setup Sheet Users
  let sheetUsers = ss.getSheetByName(SHEET_USERS);
  if (!sheetUsers) {
    sheetUsers = ss.insertSheet(SHEET_USERS);
    sheetUsers.appendRow(['ID', 'Username', 'Password', 'Role', 'NamaLengkap']);
    sheetUsers.appendRow(['1', 'admin', 'admin123', 'Admin', 'Administrator Utama']);
    sheetUsers.appendRow(['2', 'guru1', 'guru123', 'Guru', 'Bapak Budi, S.Pd']);
    sheetUsers.appendRow(['3', 'tu1', 'tu123', 'Tata Usaha', 'Staf Tata Usaha']);
    sheetUsers.appendRow(['4', 'kepsek', 'kepsek123', 'Kepala Sekolah', 'Kepala Sekolah']);
    sheetUsers.getRange("A1:E1").setFontWeight("bold").setBackground("#d9ead3");
  } else {
    // Pastikan user TU dan Kepsek tersedia di sheet Users jika belum ada
    const uData = sheetUsers.getDataRange().getValues();
    let hasTU = false;
    let hasKepsek = false;
    for (let i = 1; i < uData.length; i++) {
      const u = String(uData[i][1] || '').trim().toLowerCase();
      if (u === 'tu1') hasTU = true;
      if (u === 'kepsek') hasKepsek = true;
    }
    if (!hasTU) {
      sheetUsers.appendRow([(sheetUsers.getLastRow() + 1).toString(), 'tu1', 'tu123', 'Tata Usaha', 'Staf Tata Usaha']);
    }
    if (!hasKepsek) {
      sheetUsers.appendRow([(sheetUsers.getLastRow() + 1).toString(), 'kepsek', 'kepsek123', 'Kepala Sekolah', 'Kepala Sekolah']);
    }
  }

  // 2. Setup Sheet DataSiswa
  let sheetSiswa = ss.getSheetByName(SHEET_SISWA);
  if (!sheetSiswa) {
    sheetSiswa = ss.insertSheet(SHEET_SISWA);
    sheetSiswa.appendRow(['NISN', 'NIS', 'Nama', 'Kelas']);
    sheetSiswa.appendRow(['0011223344', '1001', 'Budi Santoso', '10-A']);
    sheetSiswa.appendRow(['0011223345', '1002', 'Siti Aminah', '10-A']);
    sheetSiswa.appendRow(['0011223346', '1003', 'Andi Dharma', '10-A']);
    sheetSiswa.appendRow(['0011223347', '1004', 'Dewi Lestari', '10-B']);
    sheetSiswa.appendRow(['0011223348', '1005', 'Eko Prasetyo', '10-B']);
    sheetSiswa.appendRow(['0011223349', '1006', 'Fajri Ramadhan', '11-A']);
    sheetSiswa.getRange("A1:D1").setFontWeight("bold").setBackground("#c9daf8");
  }

  // 3. Setup Sheet LogAbsen
  let sheetLog = ss.getSheetByName(SHEET_LOG);
  if (!sheetLog) {
    sheetLog = ss.insertSheet(SHEET_LOG);
    sheetLog.appendRow(['Waktu', 'NISN', 'NIS', 'Nama', 'Kelas', 'Status', 'Petugas']);
    sheetLog.getRange("A1:G1").setFontWeight("bold").setBackground("#fff2cc");
  }

  // 4. Setup Sheet Pengaturan
  let sheetConfig = ss.getSheetByName(SHEET_CONFIG);
  if (!sheetConfig) {
    sheetConfig = ss.insertSheet(SHEET_CONFIG);
    sheetConfig.appendRow(['Key', 'Value']);
    sheetConfig.appendRow(['NamaSekolah', 'SMA 1 BARUNAWATI']);
    sheetConfig.appendRow(['TahunPelajaran', '2026-2027']);
    sheetConfig.getRange("A1:B1").setFontWeight("bold").setBackground("#d9ead3");
  }

  // 5. Setup Sheet LogPelanggaran
  let sheetPelanggaran = ss.getSheetByName(SHEET_PELANGGARAN);
  if (!sheetPelanggaran) {
    sheetPelanggaran = ss.insertSheet(SHEET_PELANGGARAN);
    sheetPelanggaran.appendRow(['ID', 'Waktu', 'Tanggal', 'NISN', 'NIS', 'Nama', 'Kelas', 'Pelanggaran', 'GuruPelapor', 'Keterangan']);
    sheetPelanggaran.getRange("A1:J1").setFontWeight("bold").setBackground("#fce5cd");
  }

  // 6. Setup Sheet DataPelanggaran (Master Jenis Pelanggaran Dinamis)
  getJenisPelanggaranList(ss);

  // 7. Setup Sheet LogAbsenGuru
  let sheetLogGuru = ss.getSheetByName(SHEET_LOG_GURU);
  if (!sheetLogGuru) {
    sheetLogGuru = ss.insertSheet(SHEET_LOG_GURU);
    sheetLogGuru.appendRow(['ID', 'Waktu', 'Tanggal', 'Username', 'Nama', 'Status', 'Keterangan', 'InputBy']);
    sheetLogGuru.getRange("A1:H1").setFontWeight("bold").setBackground("#d9d2e9");
  }

  // 8. Setup Sheet PengajuanIzin
  let sheetIzin = ss.getSheetByName(SHEET_PENGAJUAN_IZIN);
  if (!sheetIzin) {
    sheetIzin = ss.insertSheet(SHEET_PENGAJUAN_IZIN);
    sheetIzin.appendRow(['ID', 'Waktu', 'Username', 'Nama', 'Role', 'Tanggal', 'Kategori', 'Keterangan', 'Status', 'DisetujuiOleh', 'WaktuPersetujuan']);
    sheetIzin.getRange("A1:K1").setFontWeight("bold").setBackground("#ead1dc");
  }

  // 9. Setup Sheet HariLibur
  let sheetHolidays = ss.getSheetByName(SHEET_HOLIDAYS);
  if (!sheetHolidays) {
    sheetHolidays = ss.insertSheet(SHEET_HOLIDAYS);
    sheetHolidays.appendRow(['ID', 'Tanggal', 'Keterangan', 'Kategori', 'Updated_At']);
    sheetHolidays.getRange("A1:E1").setFontWeight("bold").setBackground("#fce5cd");

    // Preset Default Libur Nasional 2026
    const defaultHolidays = [
      ['H-1', '2026-01-01', 'Tahun Baru 2026 Masehi', 'Libur Nasional'],
      ['H-2', '2026-01-16', 'Isra Mikraj Nabi Muhammad SAW', 'Libur Nasional'],
      ['H-3', '2026-03-03', 'Hari Suci Nyepi (Tahun Baru Saka 1948)', 'Libur Nasional'],
      ['H-4', '2026-03-20', 'Hari Raya Idul Fitri 1447 Hijriah', 'Libur Nasional'],
      ['H-5', '2026-03-21', 'Hari Raya Idul Fitri 1447 Hijriah', 'Libur Nasional'],
      ['H-6', '2026-04-03', 'Wafat Yesus Kristus', 'Libur Nasional'],
      ['H-7', '2026-05-01', 'Hari Buruh Internasional', 'Libur Nasional'],
      ['H-8', '2026-05-14', 'Kenaikan Yesus Kristus', 'Libur Nasional'],
      ['H-9', '2026-05-27', 'Hari Raya Waisak 2570 BE', 'Libur Nasional'],
      ['H-10', '2026-06-01', 'Hari Lahir Pancasila', 'Libur Nasional'],
      ['H-11', '2026-06-17', 'Hari Raya Idul Adha 1447 Hijriah', 'Libur Nasional'],
      ['H-12', '2026-07-07', 'Tahun Baru Islam 1448 Hijriah', 'Libur Nasional'],
      ['H-13', '2026-08-17', 'Proklamasi Kemerdekaan RI', 'Libur Nasional'],
      ['H-14', '2026-09-15', 'Maulid Nabi Muhammad SAW', 'Libur Nasional'],
      ['H-15', '2026-12-25', 'Hari Raya Natal', 'Libur Nasional']
    ];

    const timeNow = Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm:ss");
    defaultHolidays.forEach(function (item) {
      sheetHolidays.appendRow([item[0], item[1], item[2], item[3], timeNow]);
    });
  }

  // 10. Setup Sheet User_Mesin (Master Detail User Mesin Solution X902)
  ensureDeviceUserIdColumns();
  ensureUserMesinSheet(ss);
  handleSyncDeviceUsers();

  // 11. Hapus Sheet bawaan "Sheet1" / "Sheet 1" jika ada
  let defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Sheet 1');
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch (e) { }
  }

  try {
    SpreadsheetApp.getUi().alert('✅ Setup Database Berhasil!\nSemua sheet (Users, DataSiswa, LogAbsen, Pengaturan, LogPelanggaran, DataPelanggaran, LogAbsenGuru, PengajuanIzin, HariLibur, User_Mesin) telah siap digunakan.');
  } catch (e) { }

  return jsonResponse('success', 'Setup Database Google Sheets Berhasil! Semua sheet (termasuk User_Mesin, HariLibur & Presensi Guru) telah dibuat.');
}

function handleInitialSetupWeb() {
  return initialSetup();
}

// === FUNGSI LOG ABSEN GURU & PENGAJUAN IZIN ===
function fetchAbsenGuruList(ss) {
  const sheet = ss.getSheetByName(SHEET_LOG_GURU);
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const data = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
  let list = [];
  const seenKeys = new Set();

  for (let i = data.length - 1; i >= 0; i--) {
    let tglStr = data[i][2];
    if (tglStr) tglStr = getFormattedDate(tglStr);

    const uname = String(data[i][3] || '').trim().toLowerCase();
    const nama = String(data[i][4] || '').trim().toLowerCase();
    const key = `${uname || nama}_${tglStr}`;

    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      list.push({
        id: String(data[i][0] || (i + 1)),
        waktu: String(data[i][1] || ''),
        tanggal: String(tglStr || ''),
        username: String(data[i][3] || ''),
        nama: String(data[i][4] || ''),
        status: String(data[i][5] || 'HADIR'),
        keterangan: String(data[i][6] || ''),
        inputBy: String(data[i][7] || '')
      });
    }
  }
  return list;
}

function fetchPengajuanIzinList(ss) {
  const sheet = ss.getSheetByName(SHEET_PENGAJUAN_IZIN);
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const data = sheet.getRange(2, 1, lastRow - 1, 11).getValues();
  let list = [];
  for (let i = data.length - 1; i >= 0; i--) {
    let tglStr = data[i][5];
    if (tglStr) tglStr = getFormattedDate(tglStr);

    list.push({
      id: String(data[i][0] || (i + 1)),
      waktu: String(data[i][1] || ''),
      username: String(data[i][2] || ''),
      nama: String(data[i][3] || ''),
      role: String(data[i][4] || 'Guru'),
      tanggal: String(tglStr || ''),
      kategori: String(data[i][6] || 'Izin'),
      keterangan: String(data[i][7] || ''),
      status: String(data[i][8] || 'Pending'),
      disetujuiOleh: String(data[i][9] || ''),
      waktuPersetujuan: String(data[i][10] || '')
    });
  }
  return list;
}

function handleGetAbsenGuru() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return jsonResponse('success', 'Berhasil', fetchAbsenGuruList(ss));
}

function handleAddAbsenGuruManual(dataRaw) {
  try {
    let parsed = typeof dataRaw === 'string' ? JSON.parse(dataRaw) : dataRaw;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_LOG_GURU);
    if (!sheet) {
      initialSetup();
      sheet = ss.getSheetByName(SHEET_LOG_GURU);
    }

    const items = Array.isArray(parsed) ? parsed : (parsed && parsed.items && Array.isArray(parsed.items) ? parsed.items : [parsed]);
    if (!items || items.length === 0) return jsonResponse('error', 'Data presensi kosong.');

    const timeNow = Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm:ss");

    const sampleItem = items[0];
    const targetTanggal = sampleItem ? getFormattedDate(sampleItem.tanggal || new Date()) : getFormattedDate(new Date());
    const todayFormattedStr = getFormattedDate(new Date());

    if (targetTanggal > todayFormattedStr) {
      return jsonResponse('error', `Gagal menyimpan: Tidak dapat melakukan presensi guru untuk tanggal yang belum terjadi (${targetTanggal}).`);
    }

    const targetUsers = new Set();
    items.forEach(it => {
      if (it.username) targetUsers.add(String(it.username).trim().toLowerCase());
      if (it.nama) targetUsers.add(String(it.nama).trim().toLowerCase());
    });

    // DEDUPLIKASI: Hapus presensi lama di sheet untuk user & tanggal yang sama (KECUALI pengajuan izin otomatis AG-APP)
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const data = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
      for (let i = data.length - 1; i >= 0; i--) {
        const rawDate = data[i][2];
        if (!rawDate) continue;

        const logDateStr = getFormattedDate(rawDate);
        const logUname = String(data[i][3] || '').trim().toLowerCase();
        const logNama = String(data[i][4] || '').trim().toLowerCase();
        const logId = String(data[i][0] || '').trim();

        if (logDateStr === targetTanggal && (targetUsers.has(logUname) || targetUsers.has(logNama)) && !logId.startsWith('AG-APP')) {
          sheet.deleteRow(i + 2);
        }
      }
    }

    const rowsToAppend = [];
    items.forEach(function (item) {
      if (!item) return;
      const id = 'AG-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      const tgl = item.tanggal ? getFormattedDate(item.tanggal) : getFormattedDate(new Date());

      rowsToAppend.push([
        id,
        timeNow,
        tgl,
        item.username || '',
        item.nama || '',
        item.status || 'HADIR',
        item.keterangan || '',
        item.inputBy || 'Admin'
      ]);
    });

    if (rowsToAppend.length > 0) {
      const startRow = sheet.getLastRow() + 1;
      sheet.getRange(startRow, 1, rowsToAppend.length, rowsToAppend[0].length).setValues(rowsToAppend);
    }

    return jsonResponse('success', 'Absensi Guru Berhasil Disimpan', { count: rowsToAppend.length });
  } catch (e) {
    return jsonResponse('error', 'Gagal Simpan Absen Guru: ' + e.toString());
  }
}

function handleDeleteAbsenGuruByDate(tanggal) {
  try {
    if (!tanggal || String(tanggal).trim() === '') {
      return jsonResponse('error', 'Tanggal wajib diisi.');
    }
    const targetTanggal = getFormattedDate(tanggal.trim());
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    let deletedCountLog = 0;
    let deletedCountIzin = 0;

    // 1. Hapus dari Sheet LogAbsenGuru
    let sheetLog = ss.getSheetByName(SHEET_LOG_GURU);
    if (sheetLog) {
      const lastRowLog = sheetLog.getLastRow();
      if (lastRowLog > 1) {
        const dataLog = sheetLog.getRange(2, 1, lastRowLog - 1, 8).getValues();
        for (let i = dataLog.length - 1; i >= 0; i--) {
          const rawDate = dataLog[i][2];
          if (!rawDate) continue;
          const logDateStr = getFormattedDate(rawDate);
          if (logDateStr === targetTanggal) {
            sheetLog.deleteRow(i + 2);
            deletedCountLog++;
          }
        }
      }
    }

    // 2. Hapus dari Sheet PengajuanIzin untuk tanggal yang sama
    let sheetIzin = ss.getSheetByName(SHEET_PENGAJUAN_IZIN);
    if (sheetIzin) {
      const lastRowIzin = sheetIzin.getLastRow();
      if (lastRowIzin > 1) {
        const dataIzin = sheetIzin.getRange(2, 1, lastRowIzin - 1, 11).getValues();
        for (let j = dataIzin.length - 1; j >= 0; j--) {
          const rawDateIzin = dataIzin[j][5];
          if (!rawDateIzin) continue;
          const izinDateStr = getFormattedDate(rawDateIzin);
          if (izinDateStr === targetTanggal) {
            sheetIzin.deleteRow(j + 2);
            deletedCountIzin++;
          }
        }
      }
    }

    return jsonResponse('success', `Berhasil mengosongkan ${deletedCountLog} data presensi & ${deletedCountIzin} data pengajuan izin guru untuk tanggal ${targetTanggal}.`, {
      deletedCount: deletedCountLog,
      deletedCountIzin: deletedCountIzin,
      tanggal: targetTanggal
    });
  } catch (e) {
    return jsonResponse('error', 'Gagal mengosongkan presensi guru: ' + e.toString());
  }
}

// === HELPER AMBIL ID TELEGRAM USER & KEPALA SEKOLAH ===
function getKepalaSekolahTelegramIds(ss) {
  const ids = [];
  try {
    const sheetUsers = ss.getSheetByName(SHEET_USERS);
    if (sheetUsers) {
      const data = sheetUsers.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        const role = String(data[i][3] || '').trim().toLowerCase();
        const idTelegram = String(data[i][6] || '').trim();
        if ((role === 'kepala sekolah' || role === 'kepsek') && idTelegram) {
          ids.push(idTelegram);
        }
      }
    }
  } catch (e) {
    Logger.log("Error getKepalaSekolahTelegramIds: " + e.toString());
  }
  return ids;
}

function getUserTelegramIdByUsername(ss, username) {
  try {
    const sheetUsers = ss.getSheetByName(SHEET_USERS);
    if (sheetUsers) {
      const data = sheetUsers.getDataRange().getValues();
      const targetUname = String(username || '').trim().toLowerCase();
      for (let i = 1; i < data.length; i++) {
        const uname = String(data[i][1] || data[i][0] || '').trim().toLowerCase();
        const idTelegram = String(data[i][6] || '').trim();
        if (uname === targetUname && idTelegram) {
          return idTelegram;
        }
      }
    }
  } catch (e) {
    Logger.log("Error getUserTelegramIdByUsername: " + e.toString());
  }
  return '';
}

function handleGetPengajuanIzin() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return jsonResponse('success', 'Berhasil', fetchPengajuanIzinList(ss));
}

function handleAddPengajuanIzin(dataRaw) {
  try {
    let item = typeof dataRaw === 'string' ? JSON.parse(dataRaw) : dataRaw;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_PENGAJUAN_IZIN);
    if (!sheet) {
      initialSetup();
      sheet = ss.getSheetByName(SHEET_PENGAJUAN_IZIN);
    }

    const id = 'IZIN-' + Date.now();
    const timeNow = Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm:ss");
    const role = String(item.role || '').trim();

    let initialStatus = 'Pending';
    let disetujuiOleh = '';
    let waktuPersetujuan = '';

    // Jika pengaju adalah Kepala Sekolah atau Admin, langsung otomatis Disetujui
    if (role === 'Kepala Sekolah' || role === 'Admin') {
      initialStatus = 'Disetujui';
      disetujuiOleh = item.nama + ' (Otomatis)';
      waktuPersetujuan = timeNow;
    }

    sheet.appendRow([
      id,
      timeNow,
      item.username || '',
      item.nama || '',
      role || 'Guru',
      item.tanggal || getFormattedDate(new Date()),
      item.kategori || 'Izin',
      item.keterangan || '',
      initialStatus,
      disetujuiOleh,
      waktuPersetujuan
    ]);

    if (initialStatus === 'Disetujui') {
      let sheetLogGuru = ss.getSheetByName(SHEET_LOG_GURU);
      if (!sheetLogGuru) {
        initialSetup();
        sheetLogGuru = ss.getSheetByName(SHEET_LOG_GURU);
      }
      const rawKat = String(item.kategori || 'IZIN').trim().toLowerCase();
      const isDutyHadir = rawKat.includes('tugas') || rawKat.includes('dinas');
      const statusAbsenGuru = isDutyHadir ? 'HADIR' : rawKat.toUpperCase();
      const ketGuru = isDutyHadir ? `[${item.kategori}] ${item.keterangan || ''}` : (item.keterangan || '');

      sheetLogGuru.appendRow([
        'AG-APP-' + Date.now(),
        timeNow,
        item.tanggal || getFormattedDate(new Date()),
        item.username || '',
        item.nama || '',
        statusAbsenGuru,
        ketGuru,
        disetujuiOleh
      ]);
    }

    // === NOTIFIKASI TELEGRAM PENGAJUAN IZIN ===
    try {
      const config = getConfigObject(ss);
      const schoolTitle = config.namaSekolah ? config.namaSekolah.toUpperCase() : 'SMART SCHOOL';

      // 1. Notifikasi ke Kepala Sekolah
      const kepsekTgIds = getKepalaSekolahTelegramIds(ss);
      const msgKepsek = `<b>📩 PERMOHONAN IZIN GURU BARU</b>\n` +
        `<b>${schoolTitle}</b>\n\n` +
        `<blockquote>` +
        `<b>Pengaju:</b> ${item.nama || '-'} (${role || 'Guru'})\n` +
        `<b>Tanggal:</b> ${item.tanggal || getFormattedDate(new Date())}\n` +
        `<b>Kategori:</b> ${item.kategori || 'Izin'}\n` +
        `<b>Keterangan:</b> ${item.keterangan || '-'}\n` +
        `<b>Status:</b> ${initialStatus === 'Disetujui' ? '✅ Disetujui Otomatis' : '⏳ Menunggu Persetujuan'}` +
        `</blockquote>\n\n` +
        `<i>Mohon periksa dan berikan persetujuan pada portal Smart School.</i>`;

      kepsekTgIds.forEach(tgId => {
        if (tgId) sendTelegramNotification(tgId, msgKepsek);
      });

      // 2. Notifikasi Konfirmasi ke Guru Pengaju
      const guruTgId = item.id_telegram || getUserTelegramIdByUsername(ss, item.username);
      if (guruTgId) {
        const msgGuru = `<b>📩 PENGAJUAN IZIN DIKIRIM</b>\n` +
          `<b>${schoolTitle}</b>\n\n` +
          `<blockquote>` +
          `Halo <b>${item.nama || 'Bapak/Ibu Guru'}</b>, pengajuan izin Anda berhasil terkirim:\n` +
          `<b>Tanggal:</b> ${item.tanggal || getFormattedDate(new Date())}\n` +
          `<b>Kategori:</b> ${item.kategori || 'Izin'}\n` +
          `<b>Keterangan:</b> ${item.keterangan || '-'}\n` +
          `<b>Status:</b> ${initialStatus === 'Disetujui' ? '✅ Disetujui Otomatis' : '⏳ Menunggu Persetujuan Kepala Sekolah'}` +
          `</blockquote>\n\n` +
          `<i>Status persetujuan akan diinformasikan kembali via Telegram ini.</i>`;

        sendTelegramNotification(guruTgId, msgGuru);
      }
    } catch(errTg) {
      Logger.log("Error Telegram Notif AddIzin: " + errTg.toString());
    }

    return jsonResponse('success', initialStatus === 'Disetujui' ? 'Pengajuan Izin Otomatis Disetujui' : 'Pengajuan Izin Berhasil Dikirim', { id, status: initialStatus });
  } catch (e) {
    return jsonResponse('error', 'Gagal Mengirim Pengajuan Izin: ' + e.toString());
  }
}

function handleApprovePengajuanIzin(id, approver) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetIzin = ss.getSheetByName(SHEET_PENGAJUAN_IZIN);
    if (!sheetIzin) return jsonResponse('error', 'Sheet PengajuanIzin belum dibuat.');

    const data = sheetIzin.getDataRange().getValues();
    let targetRow = -1;
    let item = null;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(id)) {
        targetRow = i + 1;
        let tgl = data[i][5];
        if (tgl instanceof Date) tgl = getFormattedDate(tgl);

        item = {
          username: String(data[i][2]),
          nama: String(data[i][3]),
          tanggal: String(tgl),
          kategori: String(data[i][6]),
          keterangan: String(data[i][7])
        };
        break;
      }
    }

    if (targetRow === -1 || !item) {
      return jsonResponse('error', 'Pengajuan Izin tidak ditemukan.');
    }

    const timeNow = Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm:ss");
    sheetIzin.getRange(targetRow, 9).setValue('Disetujui');
    sheetIzin.getRange(targetRow, 10).setValue(approver || 'Kepala Sekolah');
    sheetIzin.getRange(targetRow, 11).setValue(timeNow);

    // Otomatis masukkan ke LogAbsenGuru
    let sheetLogGuru = ss.getSheetByName(SHEET_LOG_GURU);
    if (!sheetLogGuru) {
      initialSetup();
      sheetLogGuru = ss.getSheetByName(SHEET_LOG_GURU);
    }

    const rawKat = String(item.kategori || 'IZIN').trim().toLowerCase();
    const isDutyHadir = rawKat.includes('tugas') || rawKat.includes('dinas');
    const statusAbsenGuru = isDutyHadir ? 'HADIR' : rawKat.toUpperCase();
    const ketGuru = isDutyHadir ? `[${item.kategori}] ${item.keterangan || ''}` : (item.keterangan || '');

    sheetLogGuru.appendRow([
      'AG-APP-' + Date.now(),
      timeNow,
      item.tanggal,
      item.username,
      item.nama,
      statusAbsenGuru,
      ketGuru,
      approver || 'Kepala Sekolah'
    ]);

    // === NOTIFIKASI TELEGRAM KE GURU (DISETUJUI) ===
    try {
      const config = getConfigObject(ss);
      const schoolTitle = config.namaSekolah ? config.namaSekolah.toUpperCase() : 'SMART SCHOOL';
      const guruTgId = getUserTelegramIdByUsername(ss, item.username);

      if (guruTgId) {
        const msgAcc = `<b>✅ PENGAJUAN IZIN DISETUJUI</b>\n` +
          `<b>${schoolTitle}</b>\n\n` +
          `<blockquote>` +
          `Halo <b>${item.nama}</b>, permohonan izin Anda telah <b>DISETUJUI</b>.\n\n` +
          `<b>Tanggal:</b> ${item.tanggal}\n` +
          `<b>Kategori:</b> ${item.kategori}\n` +
          `<b>Keterangan:</b> ${item.keterangan || '-'}\n` +
          `<b>Disetujui Oleh:</b> ${approver || 'Kepala Sekolah'}\n` +
          `<b>Waktu ACC:</b> ${timeNow} WIB` +
          `</blockquote>\n\n` +
          `<i>Data presensi Anda telah otomatis dicatat & disesuaikan di sistem. Terima kasih!</i>`;

        sendTelegramNotification(guruTgId, msgAcc);
      }
    } catch(errAccTg) {
      Logger.log("Error Telegram Notif ApproveIzin: " + errAccTg.toString());
    }

    return jsonResponse('success', 'Pengajuan Izin Disetujui & Absensi Otomatis Dicatat', { id });
  } catch (e) {
    return jsonResponse('error', 'Gagal Menyetujui Izin: ' + e.toString());
  }
}

function handleRejectPengajuanIzin(id, approver) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetIzin = ss.getSheetByName(SHEET_PENGAJUAN_IZIN);
    if (!sheetIzin) return jsonResponse('error', 'Sheet PengajuanIzin belum dibuat.');

    const data = sheetIzin.getDataRange().getValues();
    let targetRow = -1;
    let item = null;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(id)) {
        targetRow = i + 1;
        let tgl = data[i][5];
        if (tgl instanceof Date) tgl = getFormattedDate(tgl);

        item = {
          username: String(data[i][2]),
          nama: String(data[i][3]),
          tanggal: String(tgl),
          kategori: String(data[i][6]),
          keterangan: String(data[i][7])
        };
        break;
      }
    }

    if (targetRow === -1) {
      return jsonResponse('error', 'Pengajuan Izin tidak ditemukan.');
    }

    const timeNow = Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm:ss");
    sheetIzin.getRange(targetRow, 9).setValue('Ditolak');
    sheetIzin.getRange(targetRow, 10).setValue(approver || 'Kepala Sekolah');
    sheetIzin.getRange(targetRow, 11).setValue(timeNow);

    // === NOTIFIKASI TELEGRAM KE GURU (DITOLAK) ===
    try {
      if (item) {
        const config = getConfigObject(ss);
        const schoolTitle = config.namaSekolah ? config.namaSekolah.toUpperCase() : 'SMART SCHOOL';
        const guruTgId = getUserTelegramIdByUsername(ss, item.username);

        if (guruTgId) {
          const msgReject = `<b>❌ PENGAJUAN IZIN DITOLAK</b>\n` +
            `<b>${schoolTitle}</b>\n\n` +
            `<blockquote>` +
            `Halo <b>${item.nama}</b>, permohonan izin Anda pada tanggal <b>${item.tanggal}</b> telah <b>DITOLAK</b>.\n\n` +
            `<b>Kategori:</b> ${item.kategori}\n` +
            `<b>Keterangan:</b> ${item.keterangan || '-'}\n` +
            `<b>Ditindak Oleh:</b> ${approver || 'Kepala Sekolah'}` +
            `</blockquote>\n\n` +
            `<i>Silakan hubungi Kepala Sekolah atau Administrasi Sekolah untuk informasi lebih lanjut.</i>`;

          sendTelegramNotification(guruTgId, msgReject);
        }
      }
    } catch(errRejTg) {
      Logger.log("Error Telegram Notif RejectIzin: " + errRejTg.toString());
    }

    return jsonResponse('success', 'Pengajuan Izin Ditolak', { id });
  } catch (e) {
    return jsonResponse('error', 'Gagal Menolak Izin: ' + e.toString());
  }
}

function jsonResponse(status, message, data = null) {
  return ContentService.createTextOutput(JSON.stringify({ status, message, data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getFormattedDate(d) {
  if (!d) return '';
  if (d instanceof Date) {
    try {
      return Utilities.formatDate(d, TIMEZONE, "yyyy-MM-dd");
    } catch (e) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  }
  
  let str = String(d).trim();
  if (str.includes('T')) str = str.split('T')[0];
  else if (str.includes(' ')) str = str.split(' ')[0];

  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        const yyyy = parts[2];
        const p1 = parseInt(parts[0], 10);
        const p2 = parseInt(parts[1], 10);
        let mm = String(p2).padStart(2, '0');
        let dd = String(p1).padStart(2, '0');
        if (p1 <= 12 && p2 > 12) {
          mm = String(p1).padStart(2, '0');
          dd = String(p2).padStart(2, '0');
        }
        return `${yyyy}-${mm}-${dd}`;
      } else if (parts[0].length === 4) {
        const yyyy = parts[0];
        const mm = String(parseInt(parts[1], 10)).padStart(2, '0');
        const dd = String(parseInt(parts[2], 10)).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
    }
  } else if (str.includes('-')) {
    const parts = str.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        const yyyy = parts[0];
        const mm = String(parseInt(parts[1], 10)).padStart(2, '0');
        const dd = String(parseInt(parts[2], 10)).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      } else if (parts[2].length === 4) {
        const yyyy = parts[2];
        const mm = String(parseInt(parts[1], 10)).padStart(2, '0');
        const dd = String(parseInt(parts[0], 10)).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
    }
  }

  return str;
}

function getFormattedTime(d) {
  if (!d) return '08:00:00';
  if (typeof d === 'string') return d.length >= 8 ? d : '08:00:00';
  try {
    return Utilities.formatDate(new Date(d), TIMEZONE, "HH:mm:ss");
  } catch (e) {
    try {
      const dateObj = new Date(d);
      const hh = String(dateObj.getHours()).padStart(2, '0');
      const mm = String(dateObj.getMinutes()).padStart(2, '0');
      const ss = String(dateObj.getSeconds()).padStart(2, '0');
      return `${hh}:${mm}:${ss}`;
    } catch (e2) {
      return '08:00:00';
    }
  }
}

// === HANDLER MANAJEMEN HARI LIBUR NASIONAL & SCHOOL HOLIDAYS (GOOGLE SHEETS SYNC) ===
function handleGetHolidays() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_HOLIDAYS);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_HOLIDAYS);
      sheet.appendRow(['ID', 'Tanggal', 'Keterangan', 'Kategori', 'Updated_At']);
      return jsonResponse('success', 'Sheet HariLibur baru dibuat', []);
    }
    const data = sheet.getDataRange().getValues();
    const holidays = [];
    for (let i = 1; i < data.length; i++) {
      let tgl = data[i][1];
      if (tgl instanceof Date) tgl = getFormattedDate(tgl);
      else tgl = String(tgl || '').trim();
      const desc = String(data[i][2] || '').trim();
      const kat = String(data[i][3] || 'Libur').trim();
      if (tgl && desc) {
        holidays.push({
          id: String(data[i][0] || `H-${i}`),
          date: tgl,
          description: desc,
          category: kat
        });
      }
    }
    return jsonResponse('success', 'Data Hari Libur', holidays);
  } catch (err) {
    return jsonResponse('error', 'Gagal Ambil Data Hari Libur: ' + err.toString());
  }
}

function handleSaveAllHolidays(dataJson) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_HOLIDAYS);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_HOLIDAYS);
    }
    let list = [];
    if (typeof dataJson === 'string') {
      list = JSON.parse(dataJson);
    } else if (Array.isArray(dataJson)) {
      list = dataJson;
    }
    sheet.clear();
    sheet.appendRow(['ID', 'Tanggal', 'Keterangan', 'Kategori', 'Updated_At']);
    const timeNow = Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm:ss");

    list.forEach((item, idx) => {
      let tgl = item.date || item.tanggal;
      if (tgl instanceof Date) tgl = getFormattedDate(tgl);
      const desc = item.description || item.keterangan || '';
      const kat = item.category || item.kategori || 'Libur';
      if (tgl && desc) {
        sheet.appendRow([
          item.id || `H-${Date.now()}-${idx + 1}`,
          String(tgl).trim(),
          String(desc).trim(),
          String(kat).trim(),
          timeNow
        ]);
      }
    });
    return jsonResponse('success', 'Berhasil Menyimpan Data Hari Libur ke Google Sheet (' + list.length + ' Data)', { count: list.length });
  } catch (err) {
    return jsonResponse('error', 'Gagal Menyimpan Data Hari Libur ke Sheet: ' + err.toString());
  }
}

function handleAddHoliday(date, description, category) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_HOLIDAYS);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_HOLIDAYS);
      sheet.appendRow(['ID', 'Tanggal', 'Keterangan', 'Kategori', 'Updated_At']);
    }
    const timeNow = Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm:ss");
    const id = `H-${Date.now()}`;
    sheet.appendRow([id, String(date).trim(), String(description).trim(), String(category || 'Libur Sekolah').trim(), timeNow]);
    return jsonResponse('success', 'Hari Libur Berhasil Ditambahkan ke Sheet', { id, date, description });
  } catch (err) {
    return jsonResponse('error', 'Gagal Menambah Hari Libur ke Sheet: ' + err.toString());
  }
}

function handleDeleteHolidaySheet(date) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_HOLIDAYS);
    if (!sheet) return jsonResponse('error', 'Sheet HariLibur tidak ditemukan.');
    const data = sheet.getDataRange().getValues();
    const targetDate = String(date).trim();
    let deletedCount = 0;
    for (let i = data.length - 1; i >= 1; i--) {
      let tgl = data[i][1];
      if (tgl instanceof Date) tgl = getFormattedDate(tgl);
      if (String(tgl).trim() === targetDate) {
        sheet.deleteRow(i + 1);
        deletedCount++;
      }
    }
    return jsonResponse('success', 'Hari Libur Berhasil Dihapus dari Sheet', { date, deletedCount });
  } catch (err) {
    return jsonResponse('error', 'Gagal Menghapus Hari Libur dari Sheet: ' + err.toString());
  }
}

// === HANDLER MANAJEMEN DATA SISWA (CRUD & BULK EXCEL) ===

function ensureStudentGenderColumn(sheetSiswa) {
  if (!sheetSiswa) return;
  try {
    const lastRow = sheetSiswa.getLastRow();
    if (lastRow < 1) return;

    const lastCol = sheetSiswa.getLastColumn();
    if (lastCol < 5) {
      sheetSiswa.getRange(1, 5).setValue('JenisKelamin');
      sheetSiswa.getRange(1, 5).setFontWeight('bold').setBackground('#c9daf8');
    } else {
      const headerVal = String(sheetSiswa.getRange(1, 5).getValue() || '').trim();
      if (!headerVal) {
        sheetSiswa.getRange(1, 5).setValue('JenisKelamin');
        sheetSiswa.getRange(1, 5).setFontWeight('bold').setBackground('#c9daf8');
      }
    }

    if (lastRow > 1) {
      const dataRange = sheetSiswa.getRange(2, 1, lastRow - 1, Math.max(5, sheetSiswa.getLastColumn()));
      const values = dataRange.getValues();
      let hasChange = false;

      for (let i = 0; i < values.length; i++) {
        const currentGender = String(values[i][4] || '').trim();
        if (!currentGender) {
          const namaLower = String(values[i][2] || '').toLowerCase();
          let defaultGender = 'L';
          if (/\b(putri|ni|dewi|sarah|siti|nur|anisa|annisa|adelia|aulia|zahra|fitri|laila|maria|selvi|wulan|krisna|tania|dita)\b/i.test(namaLower)) {
            defaultGender = 'P';
          }
          sheetSiswa.getRange(i + 2, 5).setValue(defaultGender);
          hasChange = true;
        }
      }
    }
  } catch (e) {
    Logger.log('ensureStudentGenderColumn error: ' + e.toString());
  }
}

function handleGetStudents() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetSiswa = ss.getSheetByName(SHEET_SISWA);
  let students = [];
  if (sheetSiswa) {
    ensureStudentGenderColumn(sheetSiswa);
    const dataSiswa = sheetSiswa.getDataRange().getValues();
    for (let i = 1; i < dataSiswa.length; i++) {
      const nama = String(dataSiswa[i][2] || '').trim();
      if (!nama) continue;
      const gRaw = String(dataSiswa[i][4] || '').trim().toUpperCase();
      const gender = (gRaw === 'P' || gRaw.startsWith('PEREMPUAN')) ? 'P' : 'L';
      students.push({
        nisn: String(dataSiswa[i][0] || '').trim(),
        nis: String(dataSiswa[i][1] || '').trim(),
        nama: nama,
        kelas: String(dataSiswa[i][3] || '').trim(),
        gender: gender,
        id_mesin: String(dataSiswa[i][5] || '').trim(),
        id_telegram: String(dataSiswa[i][6] || '').trim()
      });
    }
  }
  return jsonResponse('success', 'Daftar Siswa', students);
}

function handleAddStudent(nisn, nis, nama, kelas, gender, id_mesin, id_telegram) {
  if (!nama || !kelas) {
    return jsonResponse('error', 'Nama Siswa dan Kelas wajib diisi.');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_SISWA);
  if (!sheet) {
    initialSetup();
    sheet = ss.getSheetByName(SHEET_SISWA);
  }

  const cleanNisn = String(nisn || '').trim();
  const cleanNis = String(nis || '').trim();
  const cleanNama = String(nama).trim();
  const cleanKelas = String(kelas).trim();
  const cleanGender = String(gender || 'L').trim().toUpperCase();
  const cleanIdMesin = String(id_mesin || '').trim();
  const cleanIdTelegram = String(id_telegram || '').trim();

  sheet.appendRow([cleanNisn, cleanNis, cleanNama, cleanKelas, cleanGender, cleanIdMesin, cleanIdTelegram]);
  clearStudentCache();

  return jsonResponse('success', `Siswa "${cleanNama}" kelas ${cleanKelas} berhasil ditambahkan.`);
}

function handleUpdateStudent(oldNis, oldNisn, nisn, nis, nama, kelas, gender, id_mesin, id_telegram) {
  if (!nama || !kelas) {
    return jsonResponse('error', 'Nama dan Kelas tidak boleh kosong.');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_SISWA);
  if (!sheet) return jsonResponse('error', 'Sheet DataSiswa tidak ditemukan.');

  const data = sheet.getDataRange().getValues();
  const targetOldNis = String(oldNis || '').trim().toLowerCase();
  const targetOldNisn = String(oldNisn || '').trim().toLowerCase();

  let targetRow = -1;
  let oldNama = '';
  let oldIdMesin = '';

  for (let i = 1; i < data.length; i++) {
    const rNisn = String(data[i][0] || '').trim().toLowerCase();
    const rNis = String(data[i][1] || '').trim().toLowerCase();

    if ((targetOldNis && rNis === targetOldNis) || (targetOldNisn && rNisn === targetOldNisn)) {
      targetRow = i + 1;
      oldNama = String(data[i][2] || '').trim();
      oldIdMesin = String(data[i][5] || '').trim();
      break;
    }
  }

  if (targetRow === -1) {
    return jsonResponse('error', 'Data siswa tidak ditemukan di database.');
  }

  const cleanNisn = String(nisn || '').trim();
  const cleanNis = String(nis || '').trim();
  const cleanNama = String(nama).trim();
  const cleanKelas = String(kelas).trim();
  const cleanGender = String(gender || 'L').trim().toUpperCase();
  const cleanIdMesin = String(id_mesin || '').trim();
  const cleanIdTelegram = String(id_telegram || '').trim();

  sheet.getRange(targetRow, 1, 1, 7).setValues([[cleanNisn, cleanNis, cleanNama, cleanKelas, cleanGender, cleanIdMesin, cleanIdTelegram]]);
  clearStudentCache();

  // Cascade Update across all related sheets (LogAbsen, LogIzinSiswa, LogPelanggaran, User_Mesin)
  cascadeUpdateStudentData(ss, oldNis, oldNisn, oldNama, cleanNis, cleanNisn, cleanNama, cleanKelas, cleanIdMesin, cleanIdTelegram, oldIdMesin);

  return jsonResponse('success', `Data siswa "${cleanNama}" berhasil diperbarui.`);
}

function handleDeleteStudent(nisn, nis) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_SISWA);
  if (!sheet) return jsonResponse('error', 'Sheet DataSiswa tidak ditemukan.');

  const data = sheet.getDataRange().getValues();
  const targetNis = String(nis || '').trim().toLowerCase();
  const targetNisn = String(nisn || '').trim().toLowerCase();

  let deletedCount = 0;
  for (let i = data.length - 1; i >= 1; i--) {
    const rNisn = String(data[i][0] || '').trim().toLowerCase();
    const rNis = String(data[i][1] || '').trim().toLowerCase();

    if ((targetNis && rNis === targetNis) || (targetNisn && rNisn === targetNisn)) {
      sheet.deleteRow(i + 1);
      deletedCount++;
    }
  }

  clearStudentCache();
  return jsonResponse('success', `Berhasil menghapus ${deletedCount} data siswa.`);
}

function handleSaveAllStudents(dataJson, mode) {
  try {
    let items = typeof dataJson === 'string' ? JSON.parse(dataJson) : dataJson;
    if (!Array.isArray(items)) return jsonResponse('error', 'Format data siswa bulk tidak valid.');

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_SISWA);
    if (!sheet) {
      initialSetup();
      sheet = ss.getSheetByName(SHEET_SISWA);
    }

    const isReplaceMode = (mode === 'replace');

    if (isReplaceMode) {
      sheet.clearContents();
      sheet.getRange(1, 1, 1, 7).setValues([['NISN', 'NIS', 'Nama', 'Kelas', 'JenisKelamin', 'ID_Mesin', 'ID_Telegram']]);
      sheet.getRange("A1:G1").setFontWeight("bold").setBackground("#c9daf8");
    }

    const rowsToAppend = [];
    items.forEach(it => {
      if (!it || !it.nama) return;
      rowsToAppend.push([
        String(it.nisn || '').trim(),
        String(it.nis || '').trim(),
        String(it.nama || '').trim(),
        String(it.kelas || '').trim(),
        String(it.gender || it.jk || 'L').trim().toUpperCase(),
        String(it.id_mesin || it.idMesin || '').trim(),
        String(it.id_telegram || it.idTelegram || '').trim()
      ]);
    });

    if (rowsToAppend.length > 0) {
      const startRow = sheet.getLastRow() + 1;
      sheet.getRange(startRow, 1, rowsToAppend.length, 7).setValues(rowsToAppend);
    }

    clearStudentCache();
    return jsonResponse('success', `Berhasil ${isReplaceMode ? 'mengganti' : 'menambahkan'} ${rowsToAppend.length} data siswa.`, { count: rowsToAppend.length });
  } catch (e) {
    return jsonResponse('error', 'Gagal simpan data siswa bulk: ' + e.toString());
  }
}

function clearStudentCache() {
  try {
    const cache = CacheService.getScriptCache();
    // Invalidate script cache if any
  } catch(e) {}
}

function ensureDeviceUserIdColumns() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Sheet DataSiswa (Kolom F: ID_Mesin, Kolom G: ID_Telegram)
    const sheetSiswa = ss.getSheetByName(SHEET_SISWA);
    if (sheetSiswa) {
      ensureStudentGenderColumn(sheetSiswa);
      const lastColSiswa = sheetSiswa.getLastColumn();
      if (lastColSiswa < 6 || !String(sheetSiswa.getRange(1, 6).getValue() || '').trim()) {
        sheetSiswa.getRange(1, 6).setValue('ID_Mesin');
        sheetSiswa.getRange(1, 6).setFontWeight('bold').setBackground('#c9daf8');
      }
      if (lastColSiswa < 7 || !String(sheetSiswa.getRange(1, 7).getValue() || '').trim()) {
        sheetSiswa.getRange(1, 7).setValue('ID_Telegram');
        sheetSiswa.getRange(1, 7).setFontWeight('bold').setBackground('#d9ead3');
      }
    }

    // 2. Sheet Users (Kolom F: ID_Mesin, Kolom G: ID_Telegram)
    const sheetUsers = ss.getSheetByName(SHEET_USERS);
    if (sheetUsers) {
      const lastColUsers = sheetUsers.getLastColumn();
      if (lastColUsers < 6 || !String(sheetUsers.getRange(1, 6).getValue() || '').trim()) {
        sheetUsers.getRange(1, 6).setValue('ID_Mesin');
        sheetUsers.getRange(1, 6).setFontWeight('bold').setBackground('#c9daf8');
      }
      if (lastColUsers < 7 || !String(sheetUsers.getRange(1, 7).getValue() || '').trim()) {
        sheetUsers.getRange(1, 7).setValue('ID_Telegram');
        sheetUsers.getRange(1, 7).setFontWeight('bold').setBackground('#d9ead3');
      }
    }
  } catch (e) {
    Logger.log('ensureDeviceUserIdColumns error: ' + e.toString());
  }
}

// === HELPER UTILITY KIRIM NOTIFIKASI TELEGRAM ===
function sendTelegramNotification(chatId, message) {
  if (!chatId || String(chatId).trim() === '') return;

  let botToken = '';
  try {
    botToken = PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN') || '';
  } catch(e) {}

  if (!botToken) {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const cfg = getConfigObject(ss);
      botToken = cfg.telegramBotToken || '';
    } catch(e) {}
  }

  if (!botToken) {
    Logger.log("Telegram Bot Token belum diset di Script Properties atau Sheet Pengaturan.");
    return;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const payload = {
    chat_id: String(chatId).trim(),
    text: message,
    parse_mode: 'HTML'
  };

  try {
    UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  } catch (e) {
    Logger.log("Gagal kirim Telegram: " + e.toString());
  }
}

// === HANDLER INTEGRASI MESIN ABSENSI WAJAH & SIDIK JARI (SOLUTION X902 / ZKTECO) ===
function handleDeviceAttendanceScan(pin, waktuScan, statusScan, namaMesin) {
  try {
    if (!pin) {
      return jsonResponse('error', 'PIN / NIS siswa atau ID guru tidak boleh kosong.');
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const cleanPin = String(pin).trim();
    const cleanNamaMesin = namaMesin ? String(namaMesin).trim() : '';
    const now = new Date();

    let scanDateStr = Utilities.formatDate(now, TIMEZONE, "yyyy-MM-dd");
    let scanTimeStr = Utilities.formatDate(now, TIMEZONE, "HH:mm:ss");

    if (waktuScan && String(waktuScan).trim() !== '') {
      const parts = String(waktuScan).trim().split(' ');
      if (parts.length >= 1) scanDateStr = parts[0];
      if (parts.length >= 2) scanTimeStr = parts[1];
    }

    const fullTimestampStr = `${scanDateStr} ${scanTimeStr}`;
    const statusVal = String(statusScan || 'HADIR').toUpperCase();

    // 1. CARI DI SHEET DATA SISWA (Prioritas: 1. ID_Mesin, 2. NIS, 3. NISN)
    const sheetSiswa = ss.getSheetByName(SHEET_SISWA);
    let matchedStudent = null;

    if (sheetSiswa) {
      const siswaData = sheetSiswa.getDataRange().getValues();
      for (let i = 1; i < siswaData.length; i++) {
        const nisn = String(siswaData[i][0] || '').trim();
        const nis = String(siswaData[i][1] || '').trim();
        const idMesin = String(siswaData[i][5] || '').trim();
        const idTelegram = String(siswaData[i][6] || '').trim();

        if ((idMesin && cleanPin === idMesin) || cleanPin === nis || cleanPin === nisn) {
          matchedStudent = {
            nisn: nisn,
            nis: nis,
            nama: String(siswaData[i][2] || '').trim(),
            kelas: String(siswaData[i][3] || '').trim(),
            id_telegram: idTelegram
          };
          break;
        }
      }
    }

    if (matchedStudent) {
      recordUserMesinActivity(ss, cleanPin, cleanNamaMesin, matchedStudent.nama, 'Siswa', matchedStudent.kelas, matchedStudent.id_telegram, fullTimestampStr);
      const sheetLog = ss.getSheetByName(SHEET_LOG);
      if (sheetLog) {
        const lastRow = sheetLog.getLastRow();
        let alreadyExistRow = -1;
        if (lastRow > 1) {
          const logs = sheetLog.getRange(2, 1, lastRow - 1, 7).getValues();
          for (let i = logs.length - 1; i >= 0; i--) {
            const lDate = getFormattedDate(logs[i][0]);
            const lNis = String(logs[i][2] || '').trim();
            const lNisn = String(logs[i][1] || '').trim();
            if (lDate === scanDateStr && (lNis === matchedStudent.nis || lNisn === matchedStudent.nisn)) {
              alreadyExistRow = i + 2;
              break;
            }
          }
        }

        const newRow = [fullTimestampStr, matchedStudent.nisn, matchedStudent.nis, matchedStudent.nama, matchedStudent.kelas, statusVal, 'Mesin Wajah Solution X902'];
        if (alreadyExistRow > 1) {
          sheetLog.getRange(alreadyExistRow, 1, 1, 7).setValues([newRow]);
        } else {
          sheetLog.appendRow(newRow);
        }
      }

      // KIRIM NOTIFIKASI TELEGRAM SISWA / ORTU
      if (matchedStudent.id_telegram) {
        const msgSiswa = `<b>PRESENSI DIGITAL SISWA</b>\n` +
          `<b>${config.namaSekolah ? config.namaSekolah.toUpperCase() : 'SEKOLAH'}</b>\n\n` +
          `<blockquote>` +
          `<b>Nama:</b> ${matchedStudent.nama}\n` +
          `<b>Kelas:</b> ${matchedStudent.kelas}\n` +
          `<b>Status:</b> ${statusVal}\n` +
          `<b>Waktu:</b> ${scanTimeStr} WIB (${scanDateStr})\n` +
          `<b>Metode:</b> Biometrik Solution X902` +
          `</blockquote>\n\n` +
          `<i>— Terekam otomatis oleh sistem presensi.</i>`;
        sendTelegramNotification(matchedStudent.id_telegram, msgSiswa);
      }

      return jsonResponse('success', `Absensi Wajah Siswa [${matchedStudent.nama} - Kelas ${matchedStudent.kelas}] Berhasil Dicatat (${scanTimeStr})`, {
        tipe: 'siswa',
        nama: matchedStudent.nama,
        kelas: matchedStudent.kelas,
        waktu: scanTimeStr,
        status: statusVal,
        telegram_sent: Boolean(matchedStudent.id_telegram)
      });
    }

    // 2. JIKA BUKAN SISWA, CARI DI SHEET USERS (Prioritas: 1. ID_Mesin, 2. Username)
    const sheetUsers = ss.getSheetByName(SHEET_USERS);
    let matchedUser = null;

    if (sheetUsers) {
      const uData = sheetUsers.getDataRange().getValues();
      for (let i = 1; i < uData.length; i++) {
        const uname = String(uData[i][1] || uData[i][0] || '').trim();
        const idMesin = String(uData[i][5] || '').trim();
        const idTelegram = String(uData[i][6] || '').trim();

        if ((idMesin && cleanPin === idMesin) || cleanPin === uname) {
          matchedUser = {
            username: uname,
            nama: String(uData[i][4] || uData[i][1] || '').trim(),
            role: String(uData[i][3] || 'Guru').trim(),
            id_telegram: idTelegram
          };
          break;
        }
      }
    }

    if (matchedUser) {
      recordUserMesinActivity(ss, cleanPin, cleanNamaMesin, matchedUser.nama, 'Guru/Staf', matchedUser.role, matchedUser.id_telegram, fullTimestampStr);
      const sheetLogGuru = ss.getSheetByName(SHEET_LOG_GURU);
      if (sheetLogGuru) {
        const newRowGuru = [
          'AG-DEV-' + Date.now(),
          fullTimestampStr,
          scanDateStr,
          matchedUser.username,
          matchedUser.nama,
          statusVal,
          'Scan Wajah Mesin Solution X902',
          'Mesin X902'
        ];
        sheetLogGuru.appendRow(newRowGuru);
      }

      // KIRIM NOTIFIKASI TELEGRAM GURU / STAF
      if (matchedUser.id_telegram) {
        const msgGuru = `<b>PRESENSI DIGITAL GURU / STAF</b>\n` +
          `<b>${config.namaSekolah ? config.namaSekolah.toUpperCase() : 'SEKOLAH'}</b>\n\n` +
          `<blockquote>` +
          `<b>Nama:</b> ${matchedUser.nama}\n` +
          `<b>Role / Jabatan:</b> ${matchedUser.role}\n` +
          `<b>Status:</b> ${statusVal}\n` +
          `<b>Waktu:</b> ${scanTimeStr} WIB (${scanDateStr})\n` +
          `<b>Metode:</b> Biometrik Solution X902` +
          `</blockquote>\n\n` +
          `<i>— Terekam otomatis oleh sistem presensi.</i>`;
        sendTelegramNotification(matchedUser.id_telegram, msgGuru);
      }

      return jsonResponse('success', `Absensi Wajah Guru [${matchedUser.nama}] Berhasil Dicatat (${scanTimeStr})`, {
        tipe: 'guru',
        nama: matchedUser.nama,
        waktu: scanTimeStr,
        status: statusVal,
        telegram_sent: Boolean(matchedUser.id_telegram)
      });
    }

    // Jika belum ada mapping, tetap catat ke sheet User_Mesin sebagai Unmapped
    recordUserMesinActivity(ss, cleanPin, cleanNamaMesin, '', '-', '-', '-', fullTimestampStr);

    return jsonResponse('error', `ID Mesin / PIN [${cleanPin}] dari Solution X902 belum dicocokkan dengan data Siswa atau Guru di database.`);

  } catch (err) {
    return jsonResponse('error', 'Gagal memproses scan mesin wajah: ' + err.toString());
  }
}

// === HANDLER DIAGNOSTIK TES NOTIFIKASI TELEGRAM ===
function handleTestTelegram(chatId) {
  if (!chatId || String(chatId).trim() === '') {
    return jsonResponse('error', 'Masukkan ID Telegram Chat target untuk uji coba.');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let botToken = '';
  try {
    botToken = PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN') || '';
  } catch(e) {}

  if (!botToken) {
    botToken = getConfigObject(ss).telegramBotToken || '';
  }

  if (!botToken) {
    return jsonResponse('error', 'Token Bot Telegram belum diset di Script Properties atau Sheet Pengaturan.');
  }

  const cleanChatId = String(chatId).trim();
  const testMessage = `🧪 <b>TES NOTIFIKASI TELEGRAM ABSENSI SEKOLAH</b>\n\n` +
    `Halo! Jika Anda menerima pesan ini, artinya <b>Bot Telegram Sekolah</b> dan <b>ID Telegram (${cleanChatId})</b> sudah terkonfigurasi dengan BERHASIL! 🎉\n\n` +
    `⏰ <i>Waktu Tes: ${Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm:ss")} WIB</i>`;

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const payload = {
    chat_id: cleanChatId,
    text: testMessage,
    parse_mode: 'HTML'
  };

  try {
    const res = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    const resText = res.getContentText();
    let resObj = {};
    try { resObj = JSON.parse(resText); } catch(err) {}

    if (resObj && resObj.ok) {
      return jsonResponse('success', 'Pesan tes Telegram BERHASIL terkirim! Silakan cek aplikasi Telegram Anda.', resObj);
    } else {
      let errMsg = resObj.description || resText;
      if (errMsg.includes('chat not found')) {
        errMsg = 'Chat ID tidak ditemukan. Pastikan Anda sudah membuka Bot di Telegram dan mengklik tombol /start !';
      } else if (errMsg.includes('Unauthorized')) {
        errMsg = 'Token Bot Telegram tidak valid. Periksa kembali Token Bot dari @BotFather.';
      }
      return jsonResponse('error', `Gagal dari API Telegram: ${errMsg}`, resObj);
    }
  } catch(e) {
    return jsonResponse('error', 'Error koneksi ke Telegram API: ' + e.toString());
  }
}

// === FUNGSI KHUSUS PEMICU OTORISASI GOOGLE (TANPA TRY-CATCH) ===
function authorizeScriptPermissions() {
  // Fungsi ini sengaja dibuat TANPA try-catch agar Google Apps Script WAJIB menampilkan Pop-Up Otorisasi Izin Internet
  const res = UrlFetchApp.fetch("https://api.telegram.org", { muteHttpExceptions: true });
  Logger.log("✅ OTORISASI BERHASIL! Status HTTP Telegram API: " + res.getResponseCode());
}

// === FUNGSI TES MANUAL LANGSUNG DI EDITOR APPS SCRIPT ===
function manualTestTelegram() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const config = getConfigObject(ss);
  
  let botToken = PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN') || config.telegramBotToken;
  Logger.log("Bot Token Terdeteksi: " + botToken);

  if (!botToken) {
    Logger.log("⚠️ Token Bot masih kosong! Isi Token Bot Telegram di sheet Pengaturan atau di Web App.");
    return;
  }

  // Uji koneksi ke Telegram API getMe
  const url = "https://api.telegram.org/bot" + botToken + "/getMe";
  const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  Logger.log("Balasan Telegram Bot: " + res.getContentText());
}

// === HANDLER AKTIVASI AUTO-REPLY WEBHOOK TELEGRAM ===
function handleSetTelegramWebhook(webAppUrl) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let botToken = PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN') || getConfigObject(ss).telegramBotToken;
  if (!botToken) {
    return jsonResponse('error', 'Token Bot Telegram belum diisi pada Pengaturan Sekolah!');
  }

  let activeUrl = String(webAppUrl || '').trim();
  if (!activeUrl) {
    try {
      activeUrl = ScriptApp.getService().getUrl();
    } catch(e) {}
  }

  if (!activeUrl) {
    return jsonResponse('error', 'URL Web App tidak valid atau belum diisi.');
  }

  // Gunakan drop_pending_updates=true untuk MEMBUANG SELURUH ANTREAN PESAN STUCK DI TELEGRAM
  const webhookUrl = `https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(activeUrl)}&drop_pending_updates=true`;
  try {
    const res = UrlFetchApp.fetch(webhookUrl, { muteHttpExceptions: true });
    const resObj = JSON.parse(res.getContentText());
    if (resObj && resObj.ok) {
      return jsonResponse('success', '✅ Auto-Reply Bot Telegram BERHASIL Diaktifkan & Antrean Pesan Lama Dihapus! Sekarang pengguna cukup chat /start ke Bot Sekolah untuk mendapatkan ID Telegram mereka.', resObj);
    } else {
      return jsonResponse('error', `Gagal mengaktifkan Webhook: ${resObj.description || res.getContentText()}`, resObj);
    }
  } catch(e) {
    return jsonResponse('error', 'Error Webhook: ' + e.toString());
  }
}

// === HANDLER NON-AKTIFKAN AUTO-REPLY TELEGRAM ===
function handleDeleteTelegramWebhook() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let botToken = PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN') || getConfigObject(ss).telegramBotToken;
  if (!botToken) {
    return jsonResponse('error', 'Token Bot Telegram belum diisi!');
  }
  const deleteUrl = `https://api.telegram.org/bot${botToken}/deleteWebhook?drop_pending_updates=true`;
  try {
    const res = UrlFetchApp.fetch(deleteUrl, { muteHttpExceptions: true });
    const resObj = JSON.parse(res.getContentText());
    if (resObj && resObj.ok) {
      return jsonResponse('success', '🛑 Auto-Reply Bot Telegram BERHASIL Dinonaktifkan & Antrean Pesan Dihapus!', resObj);
    } else {
      return jsonResponse('error', `Gagal menghapus Webhook: ${resObj.description || res.getContentText()}`, resObj);
    }
  } catch(e) {
    return jsonResponse('error', 'Error Delete Webhook: ' + e.toString());
  }
}

// === HANDLER KIRIM BROADCAST & PESAN INFORMASI TELEGRAM ===
function handleSendTelegramBroadcast(targetType, targetValue, subject, message) {
  if (!message || String(message).trim() === '') {
    return jsonResponse('error', 'Isi pesan pengumuman tidak boleh kosong.');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const config = getConfigObject(ss);

  let botToken = PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN') || config.telegramBotToken;
  if (!botToken) {
    return jsonResponse('error', 'Token Bot Telegram belum diisi pada Pengaturan Sekolah!');
  }

  let recipients = []; // Array of { name, id_telegram, type }
  const cleanTargetType = String(targetType || 'all_school').toLowerCase();
  const cleanTargetVal = String(targetValue || '').trim().toLowerCase();

  // 1. Ambil data Guru/Users jika diperlukan
  if (['all_teachers', 'all_school', 'single_user'].indexOf(cleanTargetType) !== -1) {
    const sheetUsers = ss.getSheetByName(SHEET_USERS);
    if (sheetUsers) {
      const uData = sheetUsers.getDataRange().getValues();
      for (let i = 1; i < uData.length; i++) {
        const username = String(uData[i][1] || '').trim();
        const nama = String(uData[i][4] || username).trim();
        const idTelegram = String(uData[i][6] || '').trim();

        if (idTelegram) {
          if (cleanTargetType === 'single_user') {
            if (username.toLowerCase() === cleanTargetVal || String(uData[i][0]).trim() === cleanTargetVal) {
              recipients.push({ name: nama, id_telegram: idTelegram, type: 'Guru' });
            }
          } else {
            recipients.push({ name: nama, id_telegram: idTelegram, type: 'Guru' });
          }
        }
      }
    }
  }

  // 2. Ambil data Siswa/Ortu jika diperlukan
  if (['all_students', 'all_school', 'class', 'single_student'].indexOf(cleanTargetType) !== -1) {
    const sheetSiswa = ss.getSheetByName(SHEET_SISWA);
    if (sheetSiswa) {
      const sData = sheetSiswa.getDataRange().getValues();
      for (let i = 1; i < sData.length; i++) {
        const nisn = String(sData[i][0] || '').trim();
        const nis = String(sData[i][1] || '').trim();
        const nama = String(sData[i][2] || '').trim();
        const kelas = String(sData[i][3] || '').trim();
        const idTelegram = String(sData[i][6] || '').trim();

        if (idTelegram) {
          if (cleanTargetType === 'single_student') {
            if (nis.toLowerCase() === cleanTargetVal || nisn.toLowerCase() === cleanTargetVal) {
              recipients.push({ name: nama, id_telegram: idTelegram, type: `Siswa (${kelas})` });
            }
          } else if (cleanTargetType === 'class') {
            if (kelas.toLowerCase() === cleanTargetVal) {
              recipients.push({ name: nama, id_telegram: idTelegram, type: `Siswa (${kelas})` });
            }
          } else {
            recipients.push({ name: nama, id_telegram: idTelegram, type: `Siswa (${kelas})` });
          }
        }
      }
    }
  }

  if (recipients.length === 0) {
    return jsonResponse('error', 'Tidak ditemukan penerima dengan ID Telegram terdaftar pada target yang dipilih.');
  }

  // DEDUP: Cegah pengiriman ganda ke ID Telegram yang sama dalam 1 kali blast
  const uniqueRecipients = [];
  const seenTelegramIds = {};
  for (let r = 0; r < recipients.length; r++) {
    const tgId = String(recipients[r].id_telegram).trim();
    if (tgId && !seenTelegramIds[tgId]) {
      seenTelegramIds[tgId] = true;
      uniqueRecipients.push(recipients[r]);
    }
  }
  recipients = uniqueRecipients;

  // Format pesan Telegram (Modern Typography & Clean HTML Blockquote)
  const formattedDate = Utilities.formatDate(new Date(), TIMEZONE, "dd MMMM yyyy HH:mm");
  
  let formattedMsg = `<b>INFORMASI RESMI SEKOLAH</b>\n` +
    `<b>${config.namaSekolah ? config.namaSekolah.toUpperCase() : 'SISTEM ABSENSI SEKOLAH'}</b>\n\n`;

  if (subject && String(subject).trim() !== '') {
    formattedMsg += `<b>▸ ${String(subject).trim()}</b>\n\n`;
  }

  formattedMsg += `<blockquote>${String(message).trim()}</blockquote>\n\n` +
    `<i>📅 ${formattedDate} WIB</i>\n` +
    `<i>— Layanan Presensi & Informasi Digital</i>`;

  let successCount = 0;
  let failCount = 0;

  for (let k = 0; k < recipients.length; k++) {
    try {
      sendTelegramNotification(recipients[k].id_telegram, formattedMsg);
      successCount++;
      Utilities.sleep(100); // 100ms pause to avoid rate limiting
    } catch(e) {
      failCount++;
    }
  }

  return jsonResponse('success', `Broadcast Telegram Selesai! Berhasil terkirim ke ${successCount} penerima.`, {
    target_count: recipients.length,
    success_count: successCount,
    failed_count: failCount
  });
}

// === HELPER & HANDLER SINKRONISASI SHEET USER MESIN SOLUTION ===
function ensureUserMesinSheet(ss) {
  let sheet = ss.getSheetByName(SHEET_USER_MESIN);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_USER_MESIN);
    const headers = [
      'ID_Mesin',
      'Nama_Mesin',
      'Nama Terhubung (DB)',
      'Tipe Pengguna',
      'Kelas / Role',
      'ID Telegram',
      'Scan Terakhir',
      'Total Scan',
      'Status Mapping'
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#1e293b')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  } else {
    // Pastikan header kolom ke-2 adalah Nama_Mesin untuk kompatibilitas sheet lama
    const hVal = String(sheet.getRange(1, 2).getValue() || '').trim();
    if (hVal !== 'Nama_Mesin') {
      sheet.insertColumnAfter(1);
      sheet.getRange(1, 2).setValue('Nama_Mesin').setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
    }
  }
  return sheet;
}

function recordUserMesinActivity(ss, idMesin, namaMesin, namaDB, tipe, kelasRole, idTelegram, scanTimestamp) {
  try {
    const sheet = ensureUserMesinSheet(ss);
    const data = sheet.getDataRange().getValues();
    const cleanId = String(idMesin).trim();
    
    let foundRow = -1;
    let existingTotal = 0;
    let existingNamaMesin = '';
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === cleanId) {
        foundRow = i + 1;
        existingNamaMesin = String(data[i][1] || '').trim();
        existingTotal = parseInt(data[i][7]) || 0;
        break;
      }
    }
    
    // NAMA MESIN BENAR-BENAR HANYA DARI MESIN (TIDAK DIAMBIL DARI DATA GURU/SISWA)
    const finalNamaMesin = (namaMesin && namaMesin !== '-') 
      ? namaMesin 
      : (existingNamaMesin && existingNamaMesin !== '-' ? existingNamaMesin : '-');
      
    const isMapped = (tipe && tipe !== 'Unmapped' && tipe !== 'Belum Diketahui' && tipe !== '-');
    const statusMapping = isMapped ? 'Terhubung ✅' : 'Belum Dihubungkan ⚠️';
    const newTotal = existingTotal + 1;
    
    if (foundRow > 1) {
      sheet.getRange(foundRow, 2, 1, 8).setValues([[
        finalNamaMesin,
        namaDB || '',
        tipe || '-',
        kelasRole || '-',
        idTelegram || '-',
        scanTimestamp || Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm:ss"),
        newTotal,
        statusMapping
      ]]);
    } else {
      sheet.appendRow([
        cleanId,
        finalNamaMesin,
        namaDB || '',
        tipe || '-',
        kelasRole || '-',
        idTelegram || '-',
        scanTimestamp || Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm:ss"),
        1,
        statusMapping
      ]);
    }
  } catch(e) {
    Logger.log("Error recordUserMesinActivity: " + e.toString());
  }
}

function handleGetDeviceUsers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ensureUserMesinSheet(ss);
  const data = sheet.getDataRange().getValues();
  
  let result = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      result.push({
        id_mesin: String(data[i][0]).trim(),
        nama_mesin: String(data[i][1] || '-').trim(),
        nama: String(data[i][2] || '').trim(),
        tipe: String(data[i][3] || '-').trim(),
        kelas_role: String(data[i][4] || '-').trim(),
        id_telegram: String(data[i][5] || '-').trim(),
        scan_terakhir: String(data[i][6] || '-').trim(),
        total_scan: parseInt(data[i][7]) || 0,
        status_mapping: String(data[i][8] || 'Belum Dihubungkan ⚠️').trim()
      });
    }
  }
  
  return jsonResponse('success', 'Berhasil memuat data User Mesin Solution', result);
}

function handleSyncDeviceUsers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetMesin = ensureUserMesinSheet(ss);
  
  // 1. Map Master Data Siswa
  let siswaMap = new Map();
  const sheetSiswa = ss.getSheetByName(SHEET_SISWA);
  if (sheetSiswa) {
    const sData = sheetSiswa.getDataRange().getValues();
    for (let i = 1; i < sData.length; i++) {
      const nisn = String(sData[i][0] || '').trim();
      const nis = String(sData[i][1] || '').trim();
      const nama = String(sData[i][2] || '').trim();
      const kelas = String(sData[i][3] || '').trim();
      const idMesin = String(sData[i][5] || '').trim();
      const idTelegram = String(sData[i][6] || '').trim();

      const studentObj = { nama: nama, kelas: kelas, idTelegram: idTelegram, tipe: 'Siswa' };
      if (idMesin) siswaMap.set(idMesin, studentObj);
      if (nis) siswaMap.set(nis, studentObj);
      if (nisn) siswaMap.set(nisn, studentObj);
    }
  }

  // 2. Map Master Data Users / Guru
  let usersMap = new Map();
  const sheetUsers = ss.getSheetByName(SHEET_USERS);
  if (sheetUsers) {
    const uData = sheetUsers.getDataRange().getValues();
    for (let i = 1; i < uData.length; i++) {
      const username = String(uData[i][1] || uData[i][0] || '').trim();
      const role = String(uData[i][3] || 'Guru').trim();
      const nama = String(uData[i][4] || username).trim();
      const idMesin = String(uData[i][5] || '').trim();
      const idTelegram = String(uData[i][6] || '').trim();

      const userObj = { nama: nama, role: role, idTelegram: idTelegram, tipe: 'Guru/Staf' };
      if (idMesin) usersMap.set(idMesin, userObj);
      if (username) usersMap.set(username, userObj);
    }
  }

  // 3. AMBIL SELURUH BARIS USER MESIN YANG SUDAH TERDAFTAR / TERSIMPAN DARI MESIN (TERMASUK UNMAPPED)
  const rawMesinData = sheetMesin.getDataRange().getValues();
  let deviceMap = new Map();

  for (let i = 1; i < rawMesinData.length; i++) {
    const pin = String(rawMesinData[i][0] || '').trim();
    if (pin) {
      deviceMap.set(pin, {
        nama_mesin: String(rawMesinData[i][1] || '-').trim(),
        scan_terakhir: String(rawMesinData[i][6] || '-').trim(),
        total_scan: parseInt(rawMesinData[i][7]) || 0
      });
    }
  }

  // 4. JUGA MASUKKAN PIN SISWA & GURU YANG MEMILIKI ID_MESIN DI DATABASE SISWA / GURU (JIKA ADA)
  if (sheetSiswa) {
    const sData = sheetSiswa.getDataRange().getValues();
    for (let i = 1; i < sData.length; i++) {
      const idMesin = String(sData[i][5] || '').trim();
      if (idMesin && !deviceMap.has(idMesin)) {
        deviceMap.set(idMesin, {
          nama_mesin: '-',
          scan_terakhir: 'Terdaftar di DB',
          total_scan: 0
        });
      }
    }
  }

  if (sheetUsers) {
    const uData = sheetUsers.getDataRange().getValues();
    for (let i = 1; i < uData.length; i++) {
      const idMesin = String(uData[i][5] || '').trim();
      if (idMesin && !deviceMap.has(idMesin)) {
        deviceMap.set(idMesin, {
          nama_mesin: '-',
          scan_terakhir: 'Terdaftar di DB',
          total_scan: 0
        });
      }
    }
  }

  // 5. BERSIHKAN DAN TULIS ULANG SHEET USER_MESIN
  if (sheetMesin.getLastRow() > 1) {
    sheetMesin.getRange(2, 1, sheetMesin.getLastRow() - 1, 9).clearContent();
  }

  let rowsToAppend = [];
  deviceMap.forEach((meta, pin) => {
    let matched = siswaMap.get(pin) || usersMap.get(pin);

    // NAMA MESIN MURNI DARI MESIN (TIDAK BOLEH MENGAMBIL DARI NAMA SISWA/GURU)
    const namaMesin = (meta.nama_mesin && meta.nama_mesin !== '') ? meta.nama_mesin : '-';
    const namaDB = matched ? matched.nama : '';
    const tipe = matched ? matched.tipe : '-';
    const kelasRole = matched ? (matched.kelas || matched.role || '-') : '-';
    const idTg = matched ? (matched.idTelegram || '-') : '-';
    const scanTerakhir = meta.scan_terakhir || '-';
    const totalScan = meta.total_scan || 0;
    const statusMapping = matched ? 'Terhubung ✅' : 'Belum Dihubungkan ⚠️';

    rowsToAppend.push([
      pin,
      namaMesin,
      namaDB,
      tipe,
      kelasRole,
      idTg,
      scanTerakhir,
      totalScan,
      statusMapping
    ]);
  });

  if (rowsToAppend.length > 0) {
    sheetMesin.getRange(2, 1, rowsToAppend.length, 9).setValues(rowsToAppend);
  }

  return handleGetDeviceUsers();
}

// === HANDLER PERBARUI PROFIL MANDIRI GURU, TU, KEPSEK & ADMIN (CASCADE UPDATE) ===
function handleUpdateSelfProfile(oldUsername, username, password, nama, id_mesin, id_telegram) {
  const oldU = String(oldUsername || '').trim().toLowerCase();
  const newU = String(username || '').trim();
  const newNama = String(nama || '').trim();
  const newPass = String(password || '').trim();
  const newIdMesin = String(id_mesin || '').trim();
  const newIdTelegram = String(id_telegram || '').trim();

  if (!oldU || !newU || !newNama) {
    return jsonResponse('error', 'Username lama, Username baru, dan Nama Lengkap wajib diisi.');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetUsers = ss.getSheetByName(SHEET_USERS);
  if (!sheetUsers) return jsonResponse('error', 'Sheet Users tidak ditemukan.');

  ensureUserColumns();

  const uData = sheetUsers.getDataRange().getValues();
  let userRowIndex = -1;
  let oldNama = '';
  let userRole = '';

  // 1. Cari user lama (berdasarkan Username atau Nama Lengkap)
  for (let i = 1; i < uData.length; i++) {
    const curU = String(uData[i][1] || uData[i][0] || '').trim().toLowerCase();
    const curNama = String(uData[i][4] || '').trim().toLowerCase();

    if (curU === oldU || curNama === oldU) {
      userRowIndex = i + 1;
      oldNama = String(uData[i][4] || '').trim();
      userRole = String(uData[i][3] || '').trim();
      break;
    }
  }

  if (userRowIndex === -1) {
    return jsonResponse('error', 'Data pengguna tidak ditemukan di database.');
  }

  if (oldU !== newU.toLowerCase()) {
    for (let i = 1; i < uData.length; i++) {
      const curU = String(uData[i][1] || '').trim().toLowerCase();
      if (curU === newU.toLowerCase()) {
        return jsonResponse('error', `Username "${newU}" sudah digunakan oleh pengguna lain.`);
      }
    }
  }

  // 2. Perbarui data di SHEET_USERS
  sheetUsers.getRange(userRowIndex, 2).setValue(newU); // Username
  if (newPass) sheetUsers.getRange(userRowIndex, 3).setValue(newPass); // Password (jika diisi)
  sheetUsers.getRange(userRowIndex, 5).setValue(newNama); // NamaLengkap
  sheetUsers.getRange(userRowIndex, 6).setValue(newIdMesin); // ID_Mesin
  sheetUsers.getRange(userRowIndex, 7).setValue(newIdTelegram); // ID_Telegram

  // 3. CASCADE UPDATE KE SELURUH SHEET TERHUBUNG DI DATABASE

  // A. LogAbsen (Petugas)
  const sheetLog = ss.getSheetByName(SHEET_LOG);
  if (sheetLog && sheetLog.getLastRow() > 1) {
    const logData = sheetLog.getRange(2, 7, sheetLog.getLastRow() - 1, 1).getValues();
    const oldUClean = oldU;
    const oldNamaClean = oldNama.toLowerCase();

    for (let i = 0; i < logData.length; i++) {
      const p = String(logData[i][0] || '').trim().toLowerCase();
      if (p === oldUClean || p === oldNamaClean) {
        sheetLog.getRange(i + 2, 7).setValue(newNama);
      }
    }
  }

  // B. LogAbsenGuru (Username, Nama, & InputBy)
  const sheetLogGuru = ss.getSheetByName(SHEET_LOG_GURU);
  if (sheetLogGuru && sheetLogGuru.getLastRow() > 1) {
    const guruData = sheetLogGuru.getRange(2, 1, sheetLogGuru.getLastRow() - 1, 8).getValues();
    for (let i = 0; i < guruData.length; i++) {
      const u = String(guruData[i][3] || '').trim().toLowerCase();
      const n = String(guruData[i][4] || '').trim().toLowerCase();
      const inp = String(guruData[i][7] || '').trim().toLowerCase();

      if (u === oldU) {
        sheetLogGuru.getRange(i + 2, 4).setValue(newU);
      }
      if (n === oldNama.toLowerCase() || u === oldU) {
        sheetLogGuru.getRange(i + 2, 5).setValue(newNama);
      }
      if (inp === oldU || inp === oldNama.toLowerCase()) {
        sheetLogGuru.getRange(i + 2, 8).setValue(newNama);
      }
    }
  }

  // C. LogPelanggaran (GuruPelapor)
  const sheetPelanggaran = ss.getSheetByName(SHEET_PELANGGARAN);
  if (sheetPelanggaran && sheetPelanggaran.getLastRow() > 1) {
    const pData = sheetPelanggaran.getRange(2, 9, sheetPelanggaran.getLastRow() - 1, 1).getValues();
    for (let i = 0; i < pData.length; i++) {
      const gp = String(pData[i][0] || '').trim().toLowerCase();
      if (gp === oldU || gp === oldNama.toLowerCase()) {
        sheetPelanggaran.getRange(i + 2, 9).setValue(newNama);
      }
    }
  }

  // D. PengajuanIzin (Username, Nama, DisetujuiOleh)
  const sheetIzin = ss.getSheetByName(SHEET_PENGAJUAN_IZIN);
  if (sheetIzin && sheetIzin.getLastRow() > 1) {
    const izData = sheetIzin.getRange(2, 1, sheetIzin.getLastRow() - 1, 10).getValues();
    for (let i = 0; i < izData.length; i++) {
      const u = String(izData[i][2] || '').trim().toLowerCase();
      const appBy = String(izData[i][9] || '').trim().toLowerCase();

      if (u === oldU) {
        sheetIzin.getRange(i + 2, 3).setValue(newU);
        sheetIzin.getRange(i + 2, 4).setValue(newNama);
      }
      if (appBy === oldU || appBy === oldNama.toLowerCase()) {
        sheetIzin.getRange(i + 2, 10).setValue(newNama);
      }
    }
  }

  // E. Synchronize User Mesin Sheet
  try {
    handleSyncDeviceUsers();
  } catch (e) {}

  // F. Clear User RAM Cache
  try {
    CacheService.getScriptCache().remove('users_cache');
  } catch (e) {}

  return jsonResponse('success', `Profil "${newNama}" berhasil diperbarui & seluruh data terkait telah disinkronkan di database!`, {
    username: newU,
    nama: newNama,
    role: userRole,
    id_mesin: newIdMesin,
    id_telegram: newIdTelegram
  });
}

function handleGetSelfProfile(username) {
  const u = String(username || '').trim().toLowerCase();
  if (!u) return jsonResponse('error', 'Username wajib diisi.');

  const users = getUsersFromCacheOrSheet();
  for (let i = 0; i < users.length; i++) {
    if (users[i].username.toLowerCase() === u) {
      return jsonResponse('success', 'Data profil ditemukan', {
        username: users[i].username,
        role: users[i].role,
        nama: users[i].nama,
        id_mesin: users[i].id_mesin || '',
        id_telegram: users[i].id_telegram || ''
      });
    }
  }
  return jsonResponse('error', 'Pengguna tidak ditemukan.');
}

// === OVERVIEW STATS & ANALYTICS SUMMARY ENDPOINT ===
function handleGetOverviewStats(forceServer) {
  const cache = CacheService.getScriptCache();
  if (!forceServer) {
    const cached = cache.get("OVERVIEW_STATS_CACHE");
    if (cached) {
      try {
        const obj = JSON.parse(cached);
        return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
      } catch (e) {}
    }
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Data Siswa & Gender & Kelas
  let totalSiswa = 0;
  let totalLaki = 0;
  let totalPerempuan = 0;
  const kelasMap = {};

  const sheetSiswa = ss.getSheetByName(SHEET_SISWA);
  if (sheetSiswa && sheetSiswa.getLastRow() > 1) {
    const sData = sheetSiswa.getRange(2, 1, sheetSiswa.getLastRow() - 1, 6).getValues();
    for (let i = 0; i < sData.length; i++) {
      const nama = String(sData[i][2] || '').trim();
      if (!nama) continue;

      totalSiswa++;
      const kls = String(sData[i][3] || 'Lainnya').trim();
      const gender = String(sData[i][4] || '').trim().toUpperCase();

      if (gender === 'L' || gender === 'LAKI-LAKI') totalLaki++;
      else if (gender === 'P' || gender === 'PEREMPUAN') totalPerempuan++;

      if (!kelasMap[kls]) kelasMap[kls] = { kls: kls, total: 0, L: 0, P: 0 };
      kelasMap[kls].total++;
      if (gender === 'L' || gender === 'LAKI-LAKI') kelasMap[kls].L++;
      else if (gender === 'P' || gender === 'PEREMPUAN') kelasMap[kls].P++;
    }
  }

  const todayFormatted = getFormattedDate(new Date());

  // 2. Data Absensi Siswa (Hari Ini & Historical Logs)
  let studentAbsenSummary = { Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0, Terlambat: 0 };
  const studentLogs = [];
  const sheetLog = ss.getSheetByName(SHEET_LOG);
  if (sheetLog && sheetLog.getLastRow() > 1) {
    const logData = sheetLog.getRange(2, 1, sheetLog.getLastRow() - 1, 7).getValues();
    for (let i = 0; i < logData.length; i++) {
      const rawDate = logData[i][0];
      if (!rawDate) continue;
      const logDateFormatted = getFormattedDate(rawDate);
      const nisn = String(logData[i][1] || '').trim();
      const nis = String(logData[i][2] || '').trim();
      const nama = String(logData[i][3] || '').trim();
      const kelas = String(logData[i][4] || '').trim();
      const st = String(logData[i][5] || '').trim().toUpperCase();

      studentLogs.push({
        tanggal: logDateFormatted,
        nisn: nisn,
        nis: nis,
        nama: nama,
        kelas: kelas,
        status: st
      });

      if (logDateFormatted === todayFormatted) {
        if (!st) continue;
        if (st.includes('HADIR') || st === 'H') studentAbsenSummary.Hadir++;
        else if (st.includes('SAKIT') || st === 'S') studentAbsenSummary.Sakit++;
        else if (st.includes('IZIN') || st === 'I') studentAbsenSummary.Izin++;
        else if (st.includes('ALPA') || st.includes('ALPHA') || st === 'A') studentAbsenSummary.Alpa++;
        else if (st.includes('TERLAMBAT') || st.includes('TELAT') || st === 'T') studentAbsenSummary.Terlambat++;
        else studentAbsenSummary.Hadir++;
      }
    }
  }

  // 3. Data Pelanggaran Siswa
  let violationSummary = {};
  let totalViolations = 0;
  const sheetPelanggaran = ss.getSheetByName(SHEET_PELANGGARAN);
  if (sheetPelanggaran && sheetPelanggaran.getLastRow() > 1) {
    const pData = sheetPelanggaran.getRange(2, 1, sheetPelanggaran.getLastRow() - 1, 6).getValues();
    for (let i = 0; i < pData.length; i++) {
      const kat = String(pData[i][5] || pData[i][4] || 'Lainnya').trim();
      if (!kat) continue;
      totalViolations++;
      violationSummary[kat] = (violationSummary[kat] || 0) + 1;
    }
  }

  // 4. Data Absensi Guru & Staf (Hari Ini)
  let guruAbsenSummary = { Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0, DinasLuar: 0 };
  let totalGuruLog = 0;
  const attendedGuruUsernames = new Set();
  const attendedGuruNames = new Set();

  const sheetLogGuru = ss.getSheetByName(SHEET_LOG_GURU);
  if (sheetLogGuru && sheetLogGuru.getLastRow() > 1) {
    const gData = sheetLogGuru.getRange(2, 1, sheetLogGuru.getLastRow() - 1, 7).getValues();
    for (let i = 0; i < gData.length; i++) {
      const rawDate = gData[i][1];
      if (!rawDate) continue;
      const logDateFormatted = getFormattedDate(rawDate);
      if (logDateFormatted !== todayFormatted) continue;

      const uName = String(gData[i][3] || '').trim().toLowerCase();
      const nama = String(gData[i][4] || '').trim().toLowerCase();
      if (uName) attendedGuruUsernames.add(uName);
      if (nama) attendedGuruNames.add(nama);

      const st = String(gData[i][6] || '').trim().toUpperCase();
      if (!st) continue;
      totalGuruLog++;
      if (st.includes('HADIR') || st === 'H') guruAbsenSummary.Hadir++;
      else if (st.includes('SAKIT') || st === 'S') guruAbsenSummary.Sakit++;
      else if (st.includes('IZIN') || st === 'I') guruAbsenSummary.Izin++;
      else if (st.includes('ALPA') || st.includes('ALPHA') || st === 'A') guruAbsenSummary.Alpa++;
      else if (st.includes('DINAS')) guruAbsenSummary.DinasLuar++;
      else guruAbsenSummary.Hadir++;
    }
  }

  // 5. Daftar Guru & Staf Yang Belum Presensi Hari Ini
  const unabsenGuruList = [];
  const sheetUsers = ss.getSheetByName(SHEET_USERS);
  if (sheetUsers && sheetUsers.getLastRow() > 1) {
    const uData = sheetUsers.getRange(2, 1, sheetUsers.getLastRow() - 1, 5).getValues();
    for (let i = 0; i < uData.length; i++) {
      const uName = String(uData[i][1] || uData[i][0] || '').trim();
      const role = String(uData[i][3] || 'Guru').trim();
      const nama = String(uData[i][4] || uName).trim();
      if (!nama || !uName) continue;

      const roleUpper = role.toUpperCase();
      if (roleUpper.includes('GURU') || roleUpper.includes('TATA USAHA') || roleUpper.includes('KEPALA') || roleUpper.includes('STAF') || roleUpper.includes('TU')) {
        const uNameLower = uName.toLowerCase();
        const namaLower = nama.toLowerCase();

        if (!attendedGuruUsernames.has(uNameLower) && !attendedGuruNames.has(namaLower)) {
          unabsenGuruList.push({
            username: uName,
            nama: nama,
            role: role
          });
        }
      }
    }
  }

  const resultObj = {
    totalSiswa: totalSiswa,
    totalLaki: totalLaki,
    totalPerempuan: totalPerempuan,
    totalKelas: Object.keys(kelasMap).length,
    kelasMap: kelasMap,
    studentAbsenSummary: studentAbsenSummary,
    totalViolations: totalViolations,
    violationSummary: violationSummary,
    totalGuruLog: totalGuruLog,
    guruAbsenSummary: guruAbsenSummary,
    unabsenGuruList: unabsenGuruList,
    studentLogs: studentLogs
  };

  try {
    cache.put("OVERVIEW_STATS_CACHE", JSON.stringify({
      status: 'success',
      message: 'Data overview (cached)',
      data: resultObj
    }), 45); // Cache for 45s
  } catch (e) {}

  return jsonResponse('success', 'Data overview berhasil ditarik', resultObj);
}

// ==========================================
// MANAJEMEN DATA MATA PELAJARAN (MAPEL) & TARGET KELAS
// ==========================================
const DEFAULT_MAPEL_DATA = [
  { nama: 'Informatika', target_kelas: 'X-1, X-2, X-3, X-4, XI-1, XI-2, XI-3, XI-4, XII-5' },
  { nama: 'IT Preneur', target_kelas: 'X-1, X-2, X-3, X-4, XII-1, XII-2, XII-3, XII-4, XII-5' },
  { nama: 'Geografi', target_kelas: 'X-1, X-2, X-3, X-4, XI-1, XI-2, XII-1, XII-2' },
  { nama: 'Pendidikan Agama Islam', target_kelas: 'X-1, X-2, X-3, X-4, XI-1, XI-2, XI-3, XI-4, XII-1, XII-2, XII-3, XII-4, XII-5' },
  { nama: 'Bahasa Indonesia', target_kelas: 'X-1, X-2, X-3, X-4, XI-1, XI-2, XI-3, XI-4, XII-1, XII-2, XII-3, XII-4, XII-5' },
  { nama: 'Ekonomi', target_kelas: 'X-1, X-2, X-3, X-4, XI-1, XI-2, XII-1, XII-2, XII-3' },
  { nama: 'PJOK', target_kelas: 'X-1, X-2, X-3, X-4, XI-1, XI-2, XI-3, XI-4, XII-1, XII-2, XII-3, XII-4, XII-5' },
  { nama: 'Bahasa Jerman', target_kelas: 'XI-1, XI-2, XII-1, XII-2, XII-3' },
  { nama: 'Sosiologi', target_kelas: 'X-1, X-2, X-3, X-4, XI-1, XI-2, XII-1, XII-2, XII-3' },
  { nama: 'Matematika', target_kelas: 'X-1, X-2, X-3, X-4, XI-1, XI-2, XI-3, XI-4, XII-1, XII-2, XII-3, XII-4, XII-5' },
  { nama: 'Matematika TL', target_kelas: 'XI-3, XI-4, XII-4, XII-5' },
  { nama: 'Kimia', target_kelas: 'X-1, X-2, X-3, X-4, XI-3, XI-4, XII-4, XII-5' },
  { nama: 'Pendidikan Pancasila', target_kelas: 'X-1, X-2, X-3, X-4, XI-1, XI-2, XI-3, XI-4, XII-1, XII-2, XII-3, XII-4, XII-5' },
  { nama: 'Bahasa Inggris', target_kelas: 'X-1, X-2, X-3, X-4, XI-1, XI-2, XI-3, XI-4, XII-1, XII-2, XII-3, XII-4, XII-5' },
  { nama: 'Fisika', target_kelas: 'X-1, X-2, X-3, X-4, XI-3, XI-4, XII-4, XII-5' },
  { nama: 'Seni Rupa', target_kelas: 'X-1, X-2, X-3, X-4, XI-1, XI-2, XI-3, XI-4, XII-1, XII-2, XII-3, XII-4, XII-5' },
  { nama: 'Sejarah', target_kelas: 'X-1, X-2, X-3, X-4, XI-1, XI-2, XI-3, XI-4, XII-1, XII-2, XII-3, XII-4, XII-5' },
  { nama: 'Biologi', target_kelas: 'X-1, X-2, X-3, X-4, XI-3, XI-4, XII-3, XII-4' }
];

function getOrCreateMapelSheet(ss) {
  let sheet = ss.getSheetByName(SHEET_MAPEL);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_MAPEL);
    sheet.appendRow(['Nama Mata Pelajaran', 'Target Kelas']);
    for (let i = 0; i < DEFAULT_MAPEL_DATA.length; i++) {
      sheet.appendRow([DEFAULT_MAPEL_DATA[i].nama, DEFAULT_MAPEL_DATA[i].target_kelas]);
    }
  }
  return sheet;
}

function handleGetMapel() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateMapelSheet(ss);
  const data = sheet.getDataRange().getValues();
  const list = [];
  
  if (data.length > 1) {
    for (let i = 1; i < data.length; i++) {
      const nama = String(data[i][0] || '').trim();
      const target = String(data[i][1] || '').trim();
      if (nama) {
        list.push({ nama: nama, target_kelas: target });
      }
    }
  } else {
    for (let i = 0; i < DEFAULT_MAPEL_DATA.length; i++) {
      sheet.appendRow([DEFAULT_MAPEL_DATA[i].nama, DEFAULT_MAPEL_DATA[i].target_kelas]);
      list.push(DEFAULT_MAPEL_DATA[i]);
    }
  }
  
  return jsonResponse('success', 'Data Mata Pelajaran berhasil ditarik', list);
}

function handleSaveMapel(nama, target_kelas, old_nama) {
  if (!nama) return jsonResponse('error', 'Nama Mata Pelajaran wajib diisi!');
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateMapelSheet(ss);
  const data = sheet.getDataRange().getValues();
  
  let foundRow = -1;
  const targetNamaSearch = String(old_nama || nama).trim().toLowerCase();
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0] || '').trim().toLowerCase() === targetNamaSearch) {
      foundRow = i + 1;
      break;
    }
  }
  
  if (foundRow > 0) {
    sheet.getRange(foundRow, 1, 1, 2).setValues([[nama, target_kelas || '']]);
    return jsonResponse('success', `Mata Pelajaran '${nama}' berhasil diperbarui!`);
  } else {
    sheet.appendRow([nama, target_kelas || '']);
    return jsonResponse('success', `Mata Pelajaran '${nama}' berhasil ditambahkan!`);
  }
}

function handleDeleteMapel(nama) {
  if (!nama) return jsonResponse('error', 'Nama Mata Pelajaran tidak valid!');
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateMapelSheet(ss);
  const data = sheet.getDataRange().getValues();
  const targetNamaSearch = String(nama).trim().toLowerCase();
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0] || '').trim().toLowerCase() === targetNamaSearch) {
      sheet.deleteRow(i + 1);
      return jsonResponse('success', `Mata Pelajaran '${nama}' berhasil dihapus!`);
    }
  }
  
  return jsonResponse('error', `Mata Pelajaran '${nama}' tidak ditemukan.`);
}

function handleSeedDefaultMapel() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_MAPEL);
  if (sheet) {
    ss.deleteSheet(sheet);
  }
  sheet = ss.insertSheet(SHEET_MAPEL);
  sheet.appendRow(['Nama Mata Pelajaran', 'Target Kelas']);
  
  for (let i = 0; i < DEFAULT_MAPEL_DATA.length; i++) {
    sheet.appendRow([DEFAULT_MAPEL_DATA[i].nama, DEFAULT_MAPEL_DATA[i].target_kelas]);
  }
  
  return jsonResponse('success', '18 Data Mata Pelajaran Bawaan berhasil disetup ulang!', DEFAULT_MAPEL_DATA);
}

// ==========================================
// MANAJEMEN MASTER DATA KELAS (DATAKELAS)
// ==========================================
const DEFAULT_KELAS_DATA = [
  { nama: 'X-1', tingkat: 'X', jurusan: 'Umum', wali_kelas: '-', kapasitas: '36' },
  { nama: 'X-2', tingkat: 'X', jurusan: 'Umum', wali_kelas: '-', kapasitas: '36' },
  { nama: 'X-3', tingkat: 'X', jurusan: 'Umum', wali_kelas: '-', kapasitas: '36' },
  { nama: 'X-4', tingkat: 'X', jurusan: 'Umum', wali_kelas: '-', kapasitas: '36' },
  { nama: 'XI-1', tingkat: 'XI', jurusan: 'Peminatan', wali_kelas: '-', kapasitas: '36' },
  { nama: 'XI-2', tingkat: 'XI', jurusan: 'Peminatan', wali_kelas: '-', kapasitas: '36' },
  { nama: 'XI-3', tingkat: 'XI', jurusan: 'Peminatan', wali_kelas: '-', kapasitas: '36' },
  { nama: 'XI-4', tingkat: 'XI', jurusan: 'Peminatan', wali_kelas: '-', kapasitas: '36' },
  { nama: 'XII-1', tingkat: 'XII', jurusan: 'Peminatan', wali_kelas: '-', kapasitas: '36' },
  { nama: 'XII-2', tingkat: 'XII', jurusan: 'Peminatan', wali_kelas: '-', kapasitas: '36' },
  { nama: 'XII-3', tingkat: 'XII', jurusan: 'Peminatan', wali_kelas: '-', kapasitas: '36' },
  { nama: 'XII-4', tingkat: 'XII', jurusan: 'Peminatan', wali_kelas: '-', kapasitas: '36' },
  { nama: 'XII-5', tingkat: 'XII', jurusan: 'Peminatan', wali_kelas: '-', kapasitas: '36' }
];

function getOrCreateKelasSheet(ss) {
  let sheet = ss.getSheetByName(SHEET_KELAS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_KELAS);
    sheet.appendRow(['Nama Kelas', 'Tingkat', 'Jurusan', 'Wali Kelas', 'Kapasitas']);
    for (let i = 0; i < DEFAULT_KELAS_DATA.length; i++) {
      sheet.appendRow([
        DEFAULT_KELAS_DATA[i].nama,
        DEFAULT_KELAS_DATA[i].tingkat,
        DEFAULT_KELAS_DATA[i].jurusan,
        DEFAULT_KELAS_DATA[i].wali_kelas,
        DEFAULT_KELAS_DATA[i].kapasitas
      ]);
    }
  }
  return sheet;
}

function handleGetKelas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateKelasSheet(ss);
  const data = sheet.getDataRange().getValues();

  // Create Wali Kelas lookup from Sheet Users (Single Source of Truth)
  const waliMap = {};
  const sheetUsers = ss.getSheetByName(SHEET_USERS);
  if (sheetUsers) {
    const uData = sheetUsers.getDataRange().getValues();
    for (let i = 1; i < uData.length; i++) {
      const role = String(uData[i][3] || '').trim();
      const namaGuru = String(uData[i][4] || uData[i][0] || '').trim();
      const wKelas = String(uData[i][7] || uData[i][8] || '').trim(); // Wali Kelas column
      if (wKelas && wKelas !== '-') {
        waliMap[wKelas.toLowerCase()] = namaGuru;
      }
    }
  }

  const list = [];
  
  if (data.length > 1) {
    for (let i = 1; i < data.length; i++) {
      const nama = String(data[i][0] || '').trim();
      const tingkat = String(data[i][1] || '').trim();
      const jurusan = String(data[i][2] || '-').trim();
      let wali = String(data[i][3] || '-').trim();
      
      // Auto resolve from Users sheet if empty/dash
      if ((!wali || wali === '-') && waliMap[nama.toLowerCase()]) {
        wali = waliMap[nama.toLowerCase()];
      }

      const kap = String(data[i][4] || '-').trim();
      if (nama) {
        list.push({ nama: nama, tingkat: tingkat, jurusan: jurusan, wali_kelas: wali, kapasitas: kap });
      }
    }
  } else {
    for (let i = 0; i < DEFAULT_KELAS_DATA.length; i++) {
      let wali = DEFAULT_KELAS_DATA[i].wali_kelas;
      if (waliMap[DEFAULT_KELAS_DATA[i].nama.toLowerCase()]) {
        wali = waliMap[DEFAULT_KELAS_DATA[i].nama.toLowerCase()];
      }
      sheet.appendRow([
        DEFAULT_KELAS_DATA[i].nama,
        DEFAULT_KELAS_DATA[i].tingkat,
        DEFAULT_KELAS_DATA[i].jurusan,
        wali,
        DEFAULT_KELAS_DATA[i].kapasitas
      ]);
      list.push({ ...DEFAULT_KELAS_DATA[i], wali_kelas: wali });
    }
  }
  
  return jsonResponse('success', 'Data Master Kelas berhasil ditarik', list);
}

function handleSaveKelas(nama, tingkat, jurusan, wali_kelas, kapasitas, old_nama) {
  if (!nama) return jsonResponse('error', 'Nama Kelas wajib diisi!');
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateKelasSheet(ss);
  const data = sheet.getDataRange().getValues();
  
  let foundRow = -1;
  const targetNamaSearch = String(old_nama || nama).trim().toLowerCase();
  const cleanWali = String(wali_kelas || '-').trim();

  // Deduplicate Wali Kelas: Ensure 1 Teacher is not assigned to multiple classes simultaneously
  if (cleanWali !== '-') {
    for (let i = 1; i < data.length; i++) {
      const rowNama = String(data[i][0] || '').trim().toLowerCase();
      const rowWali = String(data[i][3] || '').trim().toLowerCase();
      if (rowWali === cleanWali.toLowerCase() && rowNama !== targetNamaSearch) {
        sheet.getRange(i + 1, 4).setValue('-'); // Clear previous assignment
      }
    }
  }
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0] || '').trim().toLowerCase() === targetNamaSearch) {
      foundRow = i + 1;
      break;
    }
  }
  
  const cleanTingkat = tingkat || (nama.toUpperCase().startsWith('XII') ? 'XII' : nama.toUpperCase().startsWith('XI') ? 'XI' : 'X');
  
  if (foundRow > 0) {
    sheet.getRange(foundRow, 1, 1, 5).setValues([[nama, cleanTingkat, jurusan || '-', cleanWali, kapasitas || '36']]);
    if (old_nama && old_nama.trim() !== nama.trim()) {
      cascadeUpdateClassName(ss, old_nama.trim(), nama.trim());
    }
    return jsonResponse('success', `Data Kelas '${nama}' berhasil diperbarui!`);
  } else {
    sheet.appendRow([nama, cleanTingkat, jurusan || '-', cleanWali, kapasitas || '36']);
    return jsonResponse('success', `Data Kelas '${nama}' berhasil ditambahkan!`);
  }
}

function handleDeleteKelas(nama) {
  if (!nama) return jsonResponse('error', 'Nama Kelas tidak valid!');
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateKelasSheet(ss);
  const data = sheet.getDataRange().getValues();
  const targetNamaSearch = String(nama).trim().toLowerCase();
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0] || '').trim().toLowerCase() === targetNamaSearch) {
      sheet.deleteRow(i + 1);
      return jsonResponse('success', `Data Kelas '${nama}' berhasil dihapus!`);
    }
  }
  
  return jsonResponse('error', `Data Kelas '${nama}' tidak ditemukan.`);
}

function handleSeedDefaultKelas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_KELAS);
  if (sheet) {
    ss.deleteSheet(sheet);
  }
  sheet = ss.insertSheet(SHEET_KELAS);
  sheet.appendRow(['Nama Kelas', 'Tingkat', 'Jurusan', 'Wali Kelas', 'Kapasitas']);
  
  for (let i = 0; i < DEFAULT_KELAS_DATA.length; i++) {
    sheet.appendRow([
      DEFAULT_KELAS_DATA[i].nama,
      DEFAULT_KELAS_DATA[i].tingkat,
      DEFAULT_KELAS_DATA[i].jurusan,
      DEFAULT_KELAS_DATA[i].wali_kelas,
      DEFAULT_KELAS_DATA[i].kapasitas
    ]);
  }
  
  return jsonResponse('success', '13 Data Master Kelas Bawaan berhasil disetup ulang!', DEFAULT_KELAS_DATA);
}

// ==========================================
// OTOMATIS BERSIHKAN & PERBAIKI SELURUH DATABASE
// ==========================================
function handleCleanupAndRepairData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureDatabaseSetup();

  const log = [];

  // 1. Perbaiki & Standarkan DataKelas
  let sheetKelas = ss.getSheetByName(SHEET_KELAS);
  if (!sheetKelas) {
    sheetKelas = ss.insertSheet(SHEET_KELAS);
    sheetKelas.appendRow(['Nama Kelas', 'Tingkat', 'Jurusan', 'Wali Kelas', 'Kapasitas']);
    log.push('Tabel DataKelas baru saja dibuat.');
  }

  const kData = sheetKelas.getDataRange().getValues();
  const existingWaliMap = {};
  if (kData.length > 1) {
    for (let i = 1; i < kData.length; i++) {
      const namaK = String(kData[i][0] || '').trim();
      const waliK = String(kData[i][3] || '-').trim();
      if (namaK) {
        existingWaliMap[namaK.toLowerCase()] = waliK;
      }
    }
  }

  // Bersihkan dan susun ulang 13 rombel preset bawaan dengan Peminatan untuk XI & XII
  sheetKelas.clear();
  sheetKelas.appendRow(['Nama Kelas', 'Tingkat', 'Jurusan', 'Wali Kelas', 'Kapasitas']);

  for (let i = 0; i < DEFAULT_KELAS_DATA.length; i++) {
    const item = DEFAULT_KELAS_DATA[i];
    const prevWali = existingWaliMap[item.nama.toLowerCase()] || '-';
    sheetKelas.appendRow([
      item.nama,
      item.tingkat,
      item.jurusan,
      prevWali,
      item.kapasitas
    ]);
  }
  log.push('13 Rombel DataKelas disinkronkan & diperbaiki (XI & XII Peminatan).');

  // 2. Format ulang & bersihkan Tabel Users (Hapus kolom legacy Wali_Kelas dari Sheet Users)
  const sheetUsers = ss.getSheetByName(SHEET_USERS);
  if (sheetUsers) {
    const uData = sheetUsers.getDataRange().getValues();
    if (uData.length > 0) {
      const cleanUsersData = [
        ['ID', 'Username', 'Password', 'Role', 'NamaLengkap', 'ID_Mesin', 'ID_Telegram', 'Tugas_Piket']
      ];

      for (let i = 1; i < uData.length; i++) {
        const u = String(uData[i][1] || '').trim();
        if (!u) continue;
        const idUser = String(uData[i][0] || i);
        const pwd = String(uData[i][2] || '').trim();
        const role = String(uData[i][3] || 'Guru').trim();
        const nama = String(uData[i][4] || u).trim();
        const idMesin = String(uData[i][5] || '').trim();
        const idTg = String(uData[i][6] || '').trim();

        // Determine Tugas_Piket (If legacy 9-column format, col 9 [index 8], else col 8 [index 7])
        let tugasPiket = '-';
        if (uData[i].length >= 9) {
          tugasPiket = String(uData[i][8] || '-').trim();
        } else if (uData[i].length >= 8) {
          const val8 = String(uData[i][7] || '-').trim();
          if (!val8.toUpperCase().startsWith('X') && !val8.toUpperCase().startsWith('XI') && !val8.toUpperCase().startsWith('XII')) {
            tugasPiket = val8;
          }
        }

        cleanUsersData.push([idUser, u, pwd, role, nama, idMesin, idTg, tugasPiket]);
      }

      sheetUsers.clear();
      sheetUsers.getRange(1, 1, cleanUsersData.length, 8).setValues(cleanUsersData);
      log.push('Kolom Wali_Kelas berhasil dihapus dari sheet Users. Penugasan Wali Kelas 100% dipusatkan ke DataKelas.');
    }
  }

  return jsonResponse('success', '✅ Database berhasil dibersihkan, kolom Wali_Kelas di sheet Users dihapus, & disinkronkan!', {
    log: log
  });
}

// ==========================================
// MODUL PENGAJUAN IZIN SISWA & APPROVAL WALI KELAS
// ==========================================

function getOrCreateIzinSiswaSheet(ss) {
  let sheet = ss.getSheetByName(SHEET_IZIN_SISWA);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_IZIN_SISWA);
    const headers = [
      'ID', 'Waktu', 'Tanggal', 'NISN', 'NIS', 'Nama', 
      'Kelas', 'WaliKelas', 'Kategori', 'Keterangan', 
      'FotoUrl', 'Status', 'DisetujuiOleh', 'WaktuPersetujuan'
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#1e293b')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getWaliKelasForClass(ss, namaKelas) {
  if (!namaKelas) return '-';
  const targetKls = String(namaKelas).trim().toLowerCase();
  
  const sheetKls = ss.getSheetByName(SHEET_KELAS);
  if (sheetKls && sheetKls.getLastRow() > 1) {
    const data = sheetKls.getRange(2, 1, sheetKls.getLastRow() - 1, 6).getValues();
    for (let i = 0; i < data.length; i++) {
      const klsName = String(data[i][0] || '').trim().toLowerCase();
      if (klsName === targetKls) {
        return String(data[i][3] || '-').trim();
      }
    }
  }
  return '-';
}

function handleGetIzinSiswa() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getOrCreateIzinSiswaSheet(ss);
    const data = [];
    
    if (sheet.getLastRow() > 1) {
      const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 14).getValues();
      for (let i = rows.length - 1; i >= 0; i--) { // Reverse for newest first
        const r = rows[i];
        if (!r[0]) continue;
        data.push({
          id: String(r[0]),
          waktu: String(r[1] || ''),
          tanggal: getFormattedDate(r[2]),
          nisn: String(r[3] || '').trim().replace(/^'/, ''),
          nis: String(r[4] || '').trim().replace(/^'/, ''),
          nama: String(r[5] || ''),
          kelas: String(r[6] || ''),
          waliKelas: String(r[7] || ''),
          kategori: String(r[8] || ''),
          keterangan: String(r[9] || ''),
          fotoUrl: String(r[10] || ''),
          status: String(r[11] || 'Pending'),
          disetujuiOleh: String(r[12] || ''),
          waktuPersetujuan: String(r[13] || '')
        });
      }
    }
    
    return jsonResponse('success', 'Berhasil mengambil log izin siswa', data);
  } catch (err) {
    return jsonResponse('error', 'Gagal mengambil log izin siswa: ' + err.toString());
  }
}

function handleAddPengajuanIzinSiswa(dataObj) {
  try {
    if (!dataObj) return jsonResponse('error', 'Data pengajuan kosong');

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getOrCreateIzinSiswaSheet(ss);

    const id = 'IZIN-SISWA-' + Date.now();
    const waktu = new Date().toLocaleString('id-ID');
    const tanggal = dataObj.tanggal || getFormattedDate(new Date());
    let nisn = String(dataObj.nisn || '').trim().replace(/^'/, '');
    let nis = String(dataObj.nis || '').trim().replace(/^'/, '');
    const nama = String(dataObj.nama || '').trim();
    const kelas = String(dataObj.kelas || '').trim();
    const kategori = String(dataObj.kategori || 'Izin').trim();
    const keterangan = String(dataObj.keterangan || '').trim();
    const fotoUrl = String(dataObj.fotoUrl || dataObj.foto || '').trim();

    // Cross-check dengan DataSiswa untuk memastikan NISN & NIS lengkap dengan 0 di depan
    const sheetSiswa = ss.getSheetByName(SHEET_SISWA);
    if (sheetSiswa && sheetSiswa.getLastRow() > 1) {
      const sData = sheetSiswa.getRange(2, 1, sheetSiswa.getLastRow() - 1, 4).getValues();
      for (let i = 0; i < sData.length; i++) {
        const masterNisn = String(sData[i][0] || '').trim();
        const masterNis = String(sData[i][1] || '').trim();
        const masterNama = String(sData[i][2] || '').trim();

        if (
          (nisn && (masterNisn === nisn || Number(masterNisn) === Number(nisn))) ||
          (nis && (masterNis === nis || Number(masterNis) === Number(nis))) ||
          (nama && masterNama.toLowerCase() === nama.toLowerCase())
        ) {
          if (masterNisn) nisn = masterNisn;
          if (masterNis) nis = masterNis;
          break;
        }
      }
    }

    // Paksa Google Sheets menyimpan sebagai TEKS (agar angka 0 di depan tidak terhapus)
    const nisnForSheet = nisn ? (nisn.startsWith("'") ? nisn : "'" + nisn) : '';
    const nisForSheet = nis ? (nis.startsWith("'") ? nis : "'" + nis) : '';

    const waliKelas = getWaliKelasForClass(ss, kelas);

    const newRow = [
      id, waktu, tanggal, nisnForSheet, nisForSheet, nama,
      kelas, waliKelas, kategori, keterangan,
      fotoUrl, 'Pending', '', ''
    ];

    sheet.appendRow(newRow);

    // 1. Send Telegram Notification to Student (if id_telegram available)
    let studentTgId = String(dataObj.id_telegram || '').trim();
    if (!studentTgId) {
      if (sheetSiswa && sheetSiswa.getLastRow() > 1) {
        const sData = sheetSiswa.getRange(2, 1, sheetSiswa.getLastRow() - 1, 8).getValues();
        for (let i = 0; i < sData.length; i++) {
          const sNisn = String(sData[i][0] || '').trim();
          const sNis = String(sData[i][1] || '').trim();
          if ((nisn && sNisn === nisn) || (nis && sNis === nis)) {
            studentTgId = String(sData[i][7] || sData[i][6] || '').trim();
            break;
          }
        }
      }
    }

    if (studentTgId) {
      const msgSiswa = `📩 <b>Pengajuan Izin Berhasil Dikirim!</b>\n\n` +
        `👤 Nama: <b>${nama}</b>\n` +
        `🏫 Kelas: <b>${kelas}</b>\n` +
        `📅 Tanggal: <b>${tanggal}</b>\n` +
        `📝 Kategori: <b>${kategori}</b>\n` +
        `👨‍🏫 Wali Kelas: <b>${waliKelas}</b>\n` +
        `💬 Ket: <i>${keterangan || '-'}</i>\n\n` +
        `⏳ Status: <b>Menunggu Persetujuan Wali Kelas</b>`;
      sendTelegramNotification(studentTgId, msgSiswa);
    }

    // 2. Send Telegram Notification to Wali Kelas (if id_telegram available)
    let walasTgId = '';
    if (waliKelas && waliKelas !== '-') {
      const sheetUsers = ss.getSheetByName(SHEET_USERS);
      if (sheetUsers && sheetUsers.getLastRow() > 1) {
        const uData = sheetUsers.getRange(2, 1, sheetUsers.getLastRow() - 1, 8).getValues();
        const walasLower = waliKelas.toLowerCase();
        for (let i = 0; i < uData.length; i++) {
          const uNama = String(uData[i][4] || uData[i][1] || '').trim().toLowerCase();
          if (uNama && (uNama === walasLower || uNama.includes(walasLower) || walasLower.includes(uNama))) {
            walasTgId = String(uData[i][6] || '').trim();
            break;
          }
        }
      }
    }

    if (walasTgId) {
      const msgWalas = `🔔 <b>PERMOHONAN IZIN SISWA BARU</b>\n\n` +
        `👤 Nama Siswa: <b>${nama}</b> (${kelas})\n` +
        `📅 Tanggal Izin: <b>${tanggal}</b>\n` +
        `📌 Kategori: <b>${kategori}</b>\n` +
        `💬 Keterangan: <i>${keterangan || '-'}</i>\n\n` +
        `Silakan buka aplikasi Smart Absen untuk menyetujui / menolak permohonan ini.`;
      sendTelegramNotification(walasTgId, msgWalas);
    }

    return jsonResponse('success', 'Pengajuan izin siswa berhasil disimpan & notifikasi dikirim', {
      id: id,
      waliKelas: waliKelas,
      status: 'Pending'
    });
  } catch (err) {
    return jsonResponse('error', 'Gagal menyimpan pengajuan izin siswa: ' + err.toString());
  }
}

function handleApproveIzinSiswa(id, approverName, approverRole) {
  try {
    if (!id) return jsonResponse('error', 'ID Izin tidak valid');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getOrCreateIzinSiswaSheet(ss);

    if (sheet.getLastRow() <= 1) return jsonResponse('error', 'Data izin kosong');

    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 14).getValues();
    let rowIndex = -1;
    let targetRowData = null;

    for (let i = 0; i < data.length; i++) {
      if (String(data[i][0]) === String(id)) {
        rowIndex = i + 2;
        targetRowData = data[i];
        break;
      }
    }

    if (rowIndex === -1) return jsonResponse('error', 'Data permohonan izin tidak ditemukan');

    const timeNowStr = new Date().toLocaleString('id-ID');
    const nameStr = approverName || 'Wali Kelas';

    sheet.getRange(rowIndex, 12).setValue('Disetujui');
    sheet.getRange(rowIndex, 13).setValue(nameStr);
    sheet.getRange(rowIndex, 14).setValue(timeNowStr);

    const tanggal = getFormattedDate(targetRowData[2]);
    let nisn = String(targetRowData[3] || '').trim().replace(/^'/, '');
    let nis = String(targetRowData[4] || '').trim().replace(/^'/, '');
    const nama = String(targetRowData[5] || '').trim();
    const kelas = String(targetRowData[6] || '').trim();
    const kategori = String(targetRowData[8] || 'Izin').toUpperCase();

    // Cross-check dengan DataSiswa untuk memastikan NISN & NIS lengkap dengan 0 di depan
    const sheetSiswa = ss.getSheetByName(SHEET_SISWA);
    if (sheetSiswa && sheetSiswa.getLastRow() > 1) {
      const sData = sheetSiswa.getRange(2, 1, sheetSiswa.getLastRow() - 1, 4).getValues();
      for (let i = 0; i < sData.length; i++) {
        const masterNisn = String(sData[i][0] || '').trim();
        const masterNis = String(sData[i][1] || '').trim();
        const masterNama = String(sData[i][2] || '').trim();

        if (
          (nisn && (masterNisn === nisn || Number(masterNisn) === Number(nisn))) ||
          (nis && (masterNis === nis || Number(masterNis) === Number(nis))) ||
          (nama && masterNama.toLowerCase() === nama.toLowerCase())
        ) {
          if (masterNisn) nisn = masterNisn;
          if (masterNis) nis = masterNis;
          break;
        }
      }
    }

    // Paksa Google Sheets menyimpan sebagai TEKS (agar angka 0 di depan tidak terhapus)
    const nisnForSheet = nisn ? (nisn.startsWith("'") ? nisn : "'" + nisn) : '';
    const nisForSheet = nis ? (nis.startsWith("'") ? nis : "'" + nis) : '';

    // 1. AUTO-FILL PRESENSI (LogAbsen / SHEET_LOG)
    const sheetLog = ss.getSheetByName(SHEET_LOG);
    if (sheetLog) {
      let statusAbsen = 'IZIN';
      if (kategori.includes('SAKIT')) statusAbsen = 'SAKIT';
      else if (kategori.includes('IZIN')) statusAbsen = 'IZIN';

      let existingLogIndex = -1;
      if (sheetLog.getLastRow() > 1) {
        const logData = sheetLog.getRange(2, 1, sheetLog.getLastRow() - 1, 6).getValues();
        for (let i = 0; i < logData.length; i++) {
          const lTgl = getFormattedDate(logData[i][0]);
          const lNisn = String(logData[i][1] || '').trim().replace(/^'/, '');
          const lNis = String(logData[i][2] || '').trim().replace(/^'/, '');
          const lNama = String(logData[i][3] || '').trim();

          if (lTgl === tanggal && ((nisn && (lNisn === nisn || Number(lNisn) === Number(nisn))) || (nis && (lNis === nis || Number(lNis) === Number(nis))) || (nama && lNama.toLowerCase() === nama.toLowerCase()))) {
            existingLogIndex = i + 2;
            break;
          }
        }
      }

      const petugasTag = 'Auto-Izin (Walas: ' + nameStr + ')';
      if (existingLogIndex !== -1) {
        sheetLog.getRange(existingLogIndex, 2).setValue(nisnForSheet);
        sheetLog.getRange(existingLogIndex, 3).setValue(nisForSheet);
        sheetLog.getRange(existingLogIndex, 6).setValue(statusAbsen);
        sheetLog.getRange(existingLogIndex, 7).setValue(petugasTag);
      } else {
        sheetLog.appendRow([timeNowStr, nisnForSheet, nisForSheet, nama, kelas, statusAbsen, petugasTag]);
      }
    }

    // 2. Send Telegram Notification to Student
    let studentTgId = '';
    if (sheetSiswa && sheetSiswa.getLastRow() > 1) {
      const sData = sheetSiswa.getRange(2, 1, sheetSiswa.getLastRow() - 1, 8).getValues();
      for (let i = 0; i < sData.length; i++) {
        const sNisn = String(sData[i][0] || '').trim();
        const sNis = String(sData[i][1] || '').trim();
        if ((nisn && sNisn === nisn) || (nis && sNis === nis)) {
          studentTgId = String(sData[i][7] || sData[i][6] || '').trim();
          break;
        }
      }
    }

    if (studentTgId) {
      const msgSiswa = `✅ <b>PENGAJUAN IZIN DISETUJUI!</b>\n\n` +
        `Pengajuan izin Anda untuk tanggal <b>${tanggal}</b> (Kategori: <b>${targetRowData[8]}</b>) telah <b>DISETUJUI</b> oleh Wali Kelas/Petugas <b>${nameStr}</b>.\n\n` +
        `Status presensi Anda pada tanggal tersebut otomatis dicatat sebagai <b>${targetRowData[8]}</b>.`;
      sendTelegramNotification(studentTgId, msgSiswa);
    }

    // 3. Send Security Telegram Notification to Approver / Wali Kelas
    let walasTgId = '';
    const waliKelasName = String(targetRowData[7] || nameStr || '').trim();
    const sheetUsers = ss.getSheetByName(SHEET_USERS);
    if (sheetUsers && sheetUsers.getLastRow() > 1) {
      const uData = sheetUsers.getRange(2, 1, sheetUsers.getLastRow() - 1, 8).getValues();
      const searchName1 = String(approverName || '').trim().toLowerCase();
      const searchName2 = waliKelasName.toLowerCase();

      for (let i = 0; i < uData.length; i++) {
        const uNama = String(uData[i][4] || uData[i][1] || '').trim().toLowerCase();
        const uTgId = String(uData[i][6] || '').trim();
        if (uTgId && uNama && (
          (searchName1 && (uNama === searchName1 || uNama.includes(searchName1) || searchName1.includes(uNama))) ||
          (searchName2 && (uNama === searchName2 || uNama.includes(searchName2) || searchName2.includes(uNama)))
        )) {
          walasTgId = uTgId;
          break;
        }
      }
    }

    if (walasTgId) {
      const msgWalas = `🛡️ <b>KONFIRMASI PERSETUJUAN IZIN SISWA</b>\n\n` +
        `Anda baru saja <b>MENYETUJUI</b> permohonan izin berikut:\n\n` +
        `👤 Siswa: <b>${nama}</b> (${kelas})\n` +
        `📅 Tanggal: <b>${tanggal}</b>\n` +
        `📌 Kategori: <b>${targetRowData[8] || 'Izin'}</b>\n` +
        `💬 Keterangan: <i>${targetRowData[9] || '-'}</i>\n` +
        `⏰ Waktu ACC: <b>${timeNowStr}</b>\n\n` +
        `<i>Pesan keamanan ini dikirim ke Telegram Anda untuk mencegah penyalahgunaan akun.</i>`;
      sendTelegramNotification(walasTgId, msgWalas);
    }

    return jsonResponse('success', `Berhasil menyetujui izin ${nama} & presensi terisi otomatis`, {
      id: id,
      status: 'Disetujui',
      disetujuiOleh: nameStr
    });
  } catch (err) {
    return jsonResponse('error', 'Gagal menyetujui izin siswa: ' + err.toString());
  }
}

function handleRejectIzinSiswa(id, approverName, approverRole) {
  try {
    if (!id) return jsonResponse('error', 'ID Izin tidak valid');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getOrCreateIzinSiswaSheet(ss);

    if (sheet.getLastRow() <= 1) return jsonResponse('error', 'Data izin kosong');

    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 14).getValues();
    let rowIndex = -1;
    let targetRowData = null;

    for (let i = 0; i < data.length; i++) {
      if (String(data[i][0]) === String(id)) {
        rowIndex = i + 2;
        targetRowData = data[i];
        break;
      }
    }

    if (rowIndex === -1) return jsonResponse('error', 'Data permohonan izin tidak ditemukan');

    const timeNowStr = new Date().toLocaleString('id-ID');
    const nameStr = approverName || 'Wali Kelas';

    sheet.getRange(rowIndex, 12).setValue('Ditolak');
    sheet.getRange(rowIndex, 13).setValue(nameStr);
    sheet.getRange(rowIndex, 14).setValue(timeNowStr);

    const tanggal = getFormattedDate(targetRowData[2]);
    const nisn = String(targetRowData[3] || '');
    const nis = String(targetRowData[4] || '');
    const nama = String(targetRowData[5] || '');
    const kelas = String(targetRowData[6] || '');

    // 1. Send Telegram Notification to Student
    let studentTgId = '';
    const sheetSiswa = ss.getSheetByName(SHEET_SISWA);
    if (sheetSiswa && sheetSiswa.getLastRow() > 1) {
      const sData = sheetSiswa.getRange(2, 1, sheetSiswa.getLastRow() - 1, 8).getValues();
      for (let i = 0; i < sData.length; i++) {
        const sNisn = String(sData[i][0] || '').trim();
        const sNis = String(sData[i][1] || '').trim();
        if ((nisn && sNisn === nisn) || (nis && sNis === nis)) {
          studentTgId = String(sData[i][7] || sData[i][6] || '').trim();
          break;
        }
      }
    }

    if (studentTgId) {
      const msgSiswa = `❌ <b>PENGAJUAN IZIN DITOLAK</b>\n\n` +
        `Pengajuan izin Anda untuk tanggal <b>${tanggal}</b> telah <b>DITOLAK</b> oleh Wali Kelas/Petugas <b>${nameStr}</b>.\n\n` +
        `Silakan hubungi Wali Kelas Anda untuk informasi lebih lanjut.`;
      sendTelegramNotification(studentTgId, msgSiswa);
    }

    // 2. Send Security Telegram Notification to Approver / Wali Kelas
    let walasTgId = '';
    const waliKelasName = String(targetRowData[7] || nameStr || '').trim();
    const sheetUsers = ss.getSheetByName(SHEET_USERS);
    if (sheetUsers && sheetUsers.getLastRow() > 1) {
      const uData = sheetUsers.getRange(2, 1, sheetUsers.getLastRow() - 1, 8).getValues();
      const searchName1 = String(approverName || '').trim().toLowerCase();
      const searchName2 = waliKelasName.toLowerCase();

      for (let i = 0; i < uData.length; i++) {
        const uNama = String(uData[i][4] || uData[i][1] || '').trim().toLowerCase();
        const uTgId = String(uData[i][6] || '').trim();
        if (uTgId && uNama && (
          (searchName1 && (uNama === searchName1 || uNama.includes(searchName1) || searchName1.includes(uNama))) ||
          (searchName2 && (uNama === searchName2 || uNama.includes(searchName2) || searchName2.includes(uNama)))
        )) {
          walasTgId = uTgId;
          break;
        }
      }
    }

    if (walasTgId) {
      const msgWalas = `🛡️ <b>KONFIRMASI PENOLAKAN IZIN SISWA</b>\n\n` +
        `Anda baru saja <b>MENOLAK</b> permohonan izin berikut:\n\n` +
        `👤 Siswa: <b>${nama}</b> (${kelas})\n` +
        `📅 Tanggal: <b>${tanggal}</b>\n` +
        `📌 Kategori: <b>${targetRowData[8] || 'Izin'}</b>\n` +
        `⏰ Waktu Penolakan: <b>${timeNowStr}</b>\n\n` +
        `<i>Pesan keamanan ini dikirim ke Telegram Anda untuk mencegah penyalahgunaan akun.</i>`;
      sendTelegramNotification(walasTgId, msgWalas);
    }

    return jsonResponse('success', `Pengajuan izin ${nama} ditolak`, {
      id: id,
      status: 'Ditolak',
      disetujuiOleh: nameStr
    });
  } catch (err) {
    return jsonResponse('error', 'Gagal menolak izin siswa: ' + err.toString());
  }
}

// ==========================================
// FITUR EDU-IZIN (IZIN KBM) SISWA
// ==========================================

function getOrCreateDataIzinSheet(ss) {
  let sheet = ss.getSheetByName(SHEET_DATA_IZIN);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_DATA_IZIN);
    sheet.appendRow(['ID', 'Waktu', 'Nama Siswa', 'Kelas', 'Kategori', 'Alasan', 'Guru Pengajar', 'Petugas Piket', 'Status Guru', 'Status Piket', 'Link PDF', 'Keterangan Tolak']);
    sheet.setFrozenRows(1);
    sheet.getRange("A1:L1").setFontWeight("bold").setBackground("#c9daf8");
  }
  return sheet;
}

function findTelegramIdByNameOrUsername(ss, nameOrUsername) {
  if (!nameOrUsername || nameOrUsername === '-' || nameOrUsername === 'Tidak ada guru') return '';
  
  const cleanStr = function(str) {
    return String(str || '')
      .toLowerCase()
      .replace(/,?\s*(s\.pd|m\.pd|s\.kom|m\.kom|s\.si|m\.si|s\.t|m\.t|s\.ag|m\.ag|drs|dra|h|hj)\.?/gi, '')
      .trim();
  };

  const searchRaw = String(nameOrUsername).trim().toLowerCase();
  const searchClean = cleanStr(nameOrUsername);

  // 1. Cari di Sheet Users (Guru/Piket/Admin)
  const sheetUsers = ss.getSheetByName(SHEET_USERS);
  if (sheetUsers && sheetUsers.getLastRow() > 1) {
    const uData = sheetUsers.getRange(2, 1, sheetUsers.getLastRow() - 1, 8).getValues();
    for (let i = 0; i < uData.length; i++) {
      const username = String(uData[i][1] || '').trim().toLowerCase();
      const namaRaw = String(uData[i][4] || uData[i][0] || '').trim().toLowerCase();
      const namaClean = cleanStr(uData[i][4] || uData[i][0]);
      const tgId = String(uData[i][6] || uData[i][7] || '').trim();

      if (tgId && tgId !== '-') {
        if (username === searchRaw || namaRaw === searchRaw || namaClean === searchClean) return tgId;
        if (searchClean.length >= 3 && (namaClean.includes(searchClean) || searchClean.includes(namaClean))) return tgId;
      }
    }
  }

  // 2. Cari di Sheet DataSiswa
  const sheetSiswa = ss.getSheetByName(SHEET_SISWA);
  if (sheetSiswa && sheetSiswa.getLastRow() > 1) {
    const sData = sheetSiswa.getRange(2, 1, sheetSiswa.getLastRow() - 1, 7).getValues();
    for (let i = 0; i < sData.length; i++) {
      const nisn = String(sData[i][0] || '').trim().toLowerCase();
      const nis = String(sData[i][1] || '').trim().toLowerCase();
      const namaRaw = String(sData[i][2] || '').trim().toLowerCase();
      const namaClean = cleanStr(sData[i][2]);
      const tgId = String(sData[i][6] || '').trim();

      if (tgId && tgId !== '-') {
        if (nisn === searchRaw || nis === searchRaw || namaRaw === searchRaw || namaClean === searchClean) return tgId;
        if (searchClean.length >= 3 && (namaClean.includes(searchClean) || searchClean.includes(namaClean))) return tgId;
      }
    }
  }

  return '';
}

function handleGetDropdownDataEduIzin() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetUsers = ss.getSheetByName(SHEET_USERS);
  const gurus = [];
  const pikets = [];

  if (sheetUsers && sheetUsers.getLastRow() > 1) {
    const data = sheetUsers.getRange(2, 1, sheetUsers.getLastRow() - 1, 8).getValues();
    for (let i = 0; i < data.length; i++) {
      const role = String(data[i][3] || '');
      const nama = String(data[i][4] || data[i][0] || '').trim();
      const tugasPiket = String(data[i][7] || '').toLowerCase().trim();
      if (!nama) continue;
      
      const rLower = role.toLowerCase();
      // Hanya yang role nya guru
      if (rLower.includes('guru') || rLower.includes('walas')) {
        if (!gurus.includes(nama)) gurus.push(nama);
      }
      // Hanya yang tugas_piket sebagai piket
      if (tugasPiket.includes('piket') || rLower.includes('piket')) {
        if (!pikets.includes(nama)) pikets.push(nama);
      }
    }
  }
  return jsonResponse('success', 'Dropdown EduIzin', { gurus: gurus, pikets: pikets });
}

function handleSubmitEduIzin(data) {
  if (!data || !data.nama || !data.kategori || !data.piket) {
    return jsonResponse('error', 'Semua data pengajuan wajib diisi!');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateDataIzinSheet(ss);
  
  const id = 'IZIN-' + new Date().getTime();
  const waktu = new Date();
  const statusGuru = (data.guru === 'Tidak ada guru' || !data.guru) ? 'Lewati' : 'Menunggu';
  const statusPiket = 'Menunggu';
  
  sheet.appendRow([
    id,
    waktu,
    data.nama,
    data.kelas,
    data.kategori,
    data.alasan,
    data.guru || 'Tidak ada guru',
    data.piket,
    statusGuru,
    statusPiket,
    '',
    ''
  ]);

  const waktuFormatted = Utilities.formatDate(waktu, TIMEZONE, "dd/MM/yyyy HH:mm");
  
  // Notifikasi Telegram untuk SISWA (Konfirmasi Pengajuan Terkirim)
  const siswaTgId = findTelegramIdByNameOrUsername(ss, data.nama);
  if (siswaTgId) {
    const msgSiswaSubmit = `⏳ <b>[PERMOHONAN IZIN KBM TERKIRIM]</b>\n\n` +
      `Halo <b>${data.nama}</b>, permohonan izin <b>${data.kategori}</b> Anda telah diajukan ke sistem.\n` +
      `📌 Guru Pengajar: <b>${data.guru || 'Tidak ada guru'}</b>\n` +
      `👮‍♂️ Petugas Piket: <b>${data.piket}</b>\n\n` +
      `<i>Status saat ini sedang diproses. Anda akan menerima notifikasi Telegram saat izin disetujui.</i>`;
    sendTelegramNotification(siswaTgId, msgSiswaSubmit);
  }

  if (statusGuru === 'Menunggu') {
    const guruTgId = findTelegramIdByNameOrUsername(ss, data.guru);
    if (guruTgId) {
      const msgGuru = `📩 <b>[PENGAJUAN IZIN KBM SISWA BARU]</b>\n\n` +
        `👤 Siswa: <b>${data.nama}</b> (${data.kelas})\n` +
        `📌 Kategori: <b>${data.kategori}</b>\n` +
        `📝 Alasan: <i>${data.alasan}</i>\n` +
        `📅 Waktu: ${waktuFormatted} WIB\n` +
        `👮‍♂️ Petugas Piket: ${data.piket}\n\n` +
        `👉 <i>Mohon masuk ke Aplikasi SmartApp untuk menyetujui atau menolak permohonan ini.</i>`;
      sendTelegramNotification(guruTgId, msgGuru);
    }
  } else {
    const piketTgId = findTelegramIdByNameOrUsername(ss, data.piket);
    if (piketTgId) {
      const msgPiket = `📩 <b>[PENGAJUAN IZIN KBM - ANTREAN PIKET]</b>\n\n` +
        `👤 Siswa: <b>${data.nama}</b> (${data.kelas})\n` +
        `📌 Kategori: <b>${data.kategori}</b>\n` +
        `📝 Alasan: <i>${data.alasan}</i>\n` +
        `ℹ️ Status Guru: <b>Dilewati (Jam Kosong)</b>\n` +
        `📅 Waktu: ${waktuFormatted} WIB\n\n` +
        `👉 <i>Mohon masuk ke Aplikasi SmartApp untuk memproses izin di Meja Piket & mencetak PDF.</i>`;
      sendTelegramNotification(piketTgId, msgPiket);
    }
  }

  return jsonResponse('success', 'Permohonan izin KBM berhasil diajukan!');
}

function handleGetEduIzinRequests() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateDataIzinSheet(ss);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return jsonResponse('success', 'Data Izin Kosong', []);

  data.shift();
  const list = data.map(function(row) {
    let rawDate = row[1];
    let waktuStr = '-';
    if (rawDate) {
      try {
        waktuStr = Utilities.formatDate(new Date(rawDate), TIMEZONE, "dd/MM/yyyy HH:mm");
      } catch (e) {
        waktuStr = String(rawDate);
      }
    }
    return {
      id: String(row[0]),
      waktu: waktuStr,
      nama: String(row[2] || ''),
      kelas: String(row[3] || ''),
      kategori: String(row[4] || ''),
      alasan: String(row[5] || ''),
      guru: String(row[6] || ''),
      piket: String(row[7] || ''),
      statusGuru: String(row[8] || 'Menunggu'),
      statusPiket: String(row[9] || 'Menunggu'),
      linkPdf: String(row[10] || ''),
      keteranganTolak: String(row[11] || '')
    };
  }).reverse();

  return jsonResponse('success', 'Data Izin KBM', list);
}

function handleApproveEduIzinGuru(id, approver) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateDataIzinSheet(ss);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.getRange(i + 1, 9).setValue('Disetujui');

      const namaSiswa = data[i][2];
      const kelasSiswa = data[i][3];
      const kategori = data[i][4];
      const alasan = data[i][5];
      const namaGuru = data[i][6];
      const namaPiket = data[i][7];

      const piketTgId = findTelegramIdByNameOrUsername(ss, namaPiket);
      if (piketTgId) {
        const msgPiket = `✅ <b>[IZIN KBM SISWA DISETUJUI GURU -> ANTREAN PIKET]</b>\n\n` +
          `👤 Siswa: <b>${namaSiswa}</b> (${kelasSiswa})\n` +
          `📌 Kategori: <b>${kategori}</b>\n` +
          `👨‍🏫 Disetujui Guru: <b>${namaGuru}</b>\n` +
          `📝 Alasan: <i>${alasan}</i>\n\n` +
          `👉 <i>Mohon buka Meja Piket di sistem SmartApp untuk memproses izin & cetak PDF.</i>`;
        sendTelegramNotification(piketTgId, msgPiket);
      }

      const siswaTgId = findTelegramIdByNameOrUsername(ss, namaSiswa);
      if (siswaTgId) {
        const msgSiswa = `✅ <b>[UPDATE PERMOHONAN IZIN KBM]</b>\n\n` +
          `Guru Pengajar (<b>${namaGuru}</b>) telah <b>MENYETUJUI</b> izin ${kategori} Anda.\n` +
          `Saat ini permohonan diteruskan ke Petugas Piket (<b>${namaPiket}</b>) untuk pengesahan & penerbitan PDF.`;
        sendTelegramNotification(siswaTgId, msgSiswa);
      }

      return jsonResponse('success', 'Izin telah diverifikasi oleh Guru Pengajar!');
    }
  }

  return jsonResponse('error', 'Data permohonan izin tidak ditemukan.');
}

function handleApproveEduIzinPiket(id, approver) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateDataIzinSheet(ss);
  const data = sheet.getDataRange().getValues();

  let rowData = null;
  let rowIndex = -1;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      rowData = data[i];
      rowIndex = i + 1;
      break;
    }
  }

  if (rowData) {
    const pdfUrl = generateEduIzinPDF(rowData);
    sheet.getRange(rowIndex, 10).setValue('Disetujui');
    sheet.getRange(rowIndex, 11).setValue(pdfUrl);

    const namaSiswa = rowData[2];
    const kelasSiswa = rowData[3];
    const kategori = rowData[4];
    const namaGuru = rowData[6];
    const namaPiket = rowData[7];

    // 1. Notifikasi ke SISWA (Paling Utama: membawa link PDF Surat Izin)
    const siswaTgId = findTelegramIdByNameOrUsername(ss, namaSiswa);
    if (siswaTgId) {
      const msgSiswa = `🎉 <b>[SURAT IZIN KBM RESMI DITERBITKAN]</b>\n\n` +
        `Halo <b>${namaSiswa}</b>, permohonan izin <b>${kategori}</b> Anda telah DISAHKAN oleh Petugas Piket (<b>${namaPiket}</b>).\n\n` +
        `📄 <b>Link Surat Bukti Izin (PDF):</b>\n${pdfUrl}\n\n` +
        `<i>Tunjukkan Surat Izin PDF ini kepada Satpam atau Guru jika diminta.</i>`;
      sendTelegramNotification(siswaTgId, msgSiswa);
    }

    // 2. Notifikasi ke GURU PENGAJAR (Baik yang disetujui Guru maupun yang dilewati karena jam kosong)
    if (namaGuru && namaGuru !== 'Tidak ada guru') {
      const guruTgId = findTelegramIdByNameOrUsername(ss, namaGuru);
      if (guruTgId) {
        const msgGuru = `ℹ️ <b>[INFORMASI IZIN KBM SELESAI]</b>\n\n` +
          `Siswa <b>${namaSiswa}</b> (${kelasSiswa}) telah resmi diberikan izin <b>${kategori}</b> oleh Petugas Piket (<b>${namaPiket}</b>).\n` +
          `📄 <b>Link Bukti PDF:</b> ${pdfUrl}`;
        sendTelegramNotification(guruTgId, msgGuru);
      }
    }

    return jsonResponse('success', 'Izin disahkan oleh Piket & PDF Surat Izin berhasil dibuat!');
  }

  return jsonResponse('error', 'Data permohonan izin tidak ditemukan.');
}

function handleRejectEduIzin(id, tipe, alasan, approver) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateDataIzinSheet(ss);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      const namaSiswa = data[i][2];
      const kelasSiswa = data[i][3];
      const kategori = data[i][4];
      const namaGuru = data[i][6];
      const penolak = (tipe === 'guru') ? data[i][6] : data[i][7];

      if (tipe === 'guru') {
        sheet.getRange(i + 1, 9).setValue('Ditolak');
        sheet.getRange(i + 1, 10).setValue('Dibatalkan');
        sheet.getRange(i + 1, 12).setValue(alasan || 'Tidak disetujui');
      } else {
        sheet.getRange(i + 1, 10).setValue('Ditolak');
        sheet.getRange(i + 1, 12).setValue(alasan || 'Tidak disetujui');
      }

      // Notifikasi ke SISWA
      const siswaTgId = findTelegramIdByNameOrUsername(ss, namaSiswa);
      if (siswaTgId) {
        const msgReject = `❌ <b>[PERMOHONAN IZIN KBM DITOLAK]</b>\n\n` +
          `Halo <b>${namaSiswa}</b>, permohonan <b>${kategori}</b> Anda DITOLAK oleh ${tipe === 'guru' ? 'Guru Pengajar' : 'Petugas Piket'} (<b>${penolak}</b>).\n` +
          `💬 <b>Alasan Penolakan:</b> <i>${alasan || '-'}</i>`;
        sendTelegramNotification(siswaTgId, msgReject);
      }

      // Jika ditolak oleh Piket, beritahukan juga Guru Pengajarnya (jika ada)
      if (tipe === 'piket' && namaGuru && namaGuru !== 'Tidak ada guru') {
        const guruTgId = findTelegramIdByNameOrUsername(ss, namaGuru);
        if (guruTgId) {
          const msgGuruReject = `ℹ️ <b>[INFORMASI PENOLAKAN IZIN KBM]</b>\n\n` +
            `Permohonan izin <b>${kategori}</b> untuk siswa <b>${namaSiswa}</b> (${kelasSiswa}) telah DITOLAK oleh Petugas Piket (<b>${penolak}</b>).\n` +
            `💬 <b>Alasan:</b> <i>${alasan || '-'}</i>`;
          sendTelegramNotification(guruTgId, msgGuruReject);
        }
      }

      return jsonResponse('success', 'Permohonan izin berhasil ditolak!');
    }
  }

  return jsonResponse('error', 'Data permohonan izin tidak ditemukan.');
}

function generateEduIzinPDF(rowData) {
  const idIzin = rowData[0];
  const nama = rowData[2];
  const props = PropertiesService.getScriptProperties();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const cfg = getConfigObject(ss);
  
  const doc = DocumentApp.create('Temp_Izin_' + nama);
  const body = doc.getBody();

  body.setMarginTop(30).setMarginBottom(40).setMarginLeft(45).setMarginRight(45);

  const kopYayasan = String(cfg.kopYayasan || 'YAYASAN SEKAR LAUT PELNI').trim();
  const kopSekolah = String(cfg.kopSekolah || cfg.namaSekolah || 'SMA 1 BARUNAWATI').trim();
  const kopAlamat = String(cfg.kopAlamat || 'Jl. X-III Aipda KS Tubun II/III No.7, Slipi Palmerah, Jakarta Barat | Telp/Fax : (021) 5303083').trim();
  const kopLogo = String(cfg.kopLogo || '').trim();
  const kopLogoSize = parseInt(cfg.kopLogoSize || '85', 10) || 85;

  // HEADING KOP SURAT RESMI
  if (kopLogo) {
    try {
      const logoBlob = UrlFetchApp.fetch(kopLogo).getBlob();
      const kopTable = body.appendTable();
      kopTable.setBorderWidth(0);
      const kopRow = kopTable.appendTableRow();
      
      const cellLogo = kopRow.appendTableCell();
      cellLogo.setWidth(kopLogoSize + 10);
      const pImg = cellLogo.appendParagraph('');
      pImg.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      const inlineLogo = pImg.appendInlineImage(logoBlob);
      inlineLogo.setWidth(kopLogoSize).setHeight(kopLogoSize);

      const cellText = kopRow.appendTableCell();
      if (kopYayasan) {
        const pYys = cellText.appendParagraph(kopYayasan.toUpperCase());
        pYys.setFontFamily('Arial').setFontSize(10.5).setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      }
      const pSek = cellText.appendParagraph(kopSekolah.toUpperCase());
      pSek.setFontFamily('Arial').setFontSize(14).setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      
      if (kopAlamat) {
        const pAlm = cellText.appendParagraph(kopAlamat);
        pAlm.setFontFamily('Arial').setFontSize(8.5).setItalic(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      }
    } catch(e) {
      if (kopYayasan) {
        const pYys = body.appendParagraph(kopYayasan.toUpperCase());
        pYys.setFontFamily('Arial').setFontSize(10.5).setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      }
      const pSek = body.appendParagraph(kopSekolah.toUpperCase());
      pSek.setFontFamily('Arial').setFontSize(14).setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      if (kopAlamat) {
        const pAlm = body.appendParagraph(kopAlamat);
        pAlm.setFontFamily('Arial').setFontSize(8.5).setItalic(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      }
    }
  } else {
    if (kopYayasan) {
      const pYys = body.appendParagraph(kopYayasan.toUpperCase());
      pYys.setFontFamily('Arial').setFontSize(10.5).setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    }
    const pSek = body.appendParagraph(kopSekolah.toUpperCase());
    pSek.setFontFamily('Arial').setFontSize(14).setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    if (kopAlamat) {
      const pAlm = body.appendParagraph(kopAlamat);
      pAlm.setFontFamily('Arial').setFontSize(8.5).setItalic(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    }
  }

  body.appendHorizontalRule();
  body.appendParagraph('');

  const header = body.appendParagraph('SURAT BUKTI IZIN SISWA');
  header.setFontFamily('Arial').setFontSize(13).setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  body.appendParagraph('');

  let tglAju = '-';
  let jamAju = '-';
  try {
    const rawDt = new Date(rowData[1]);
    tglAju = Utilities.formatDate(rawDt, TIMEZONE, "dd MMMM yyyy");
    jamAju = Utilities.formatDate(rawDt, TIMEZONE, "HH:mm");
  } catch (e) {
    tglAju = String(rowData[1]);
  }

  const pIntro = body.appendParagraph('Berdasarkan validasi dan persetujuan dari pihak sekolah pada tanggal ' + tglAju + ', dengan ini memberikan izin kepada siswa/i dengan rincian sebagai berikut:');
  pIntro.setFontFamily('Arial').setFontSize(10.5);
  body.appendParagraph('');

  const table = body.appendTable();
  table.setBorderWidth(0);

  function addRow(label, value) {
    const tr = table.appendTableRow();
    tr.appendTableCell(label).setWidth(140).setFontFamily('Arial').setFontSize(10.5).setBold(true);
    tr.appendTableCell(':  ' + value).setFontFamily('Arial').setFontSize(10.5);
  }

  addRow('Nomor Registrasi', idIzin);
  addRow('Nama Lengkap', rowData[2]);
  addRow('Kelas', rowData[3]);
  addRow('Kategori Izin', rowData[4]);
  addRow('Alasan', rowData[5]);
  addRow('Waktu Pengajuan', jamAju + ' WIB');

  body.appendParagraph('');
  const pOutro = body.appendParagraph('Surat ini adalah dokumen resmi yang diterbitkan oleh sistem sekolah. Harap tunjukkan surat ini kepada petugas keamanan atau pihak terkait jika diminta.');
  pOutro.setFontFamily('Arial').setFontSize(10).setItalic(true);
  body.appendParagraph('');

  // OTOMATIS GENERATE BARCODE / QR CODE VERIFIKASI DIGITAL
  const namaSiswa = rowData[2] || '';
  const kelasSiswa = rowData[3] || '';
  const kategoriIzin = rowData[4] || '';
  const namaPiket = rowData[7] || '';
  const waktuLengkap = tglAju + ' ' + jamAju + ' WIB';

  const qrContent = "VERIFIKASI SURAT IZIN SISWA\n" +
    "ID: " + idIzin + "\n" +
    "Nama: " + namaSiswa + " (" + kelasSiswa + ")\n" +
    "Kategori: " + kategoriIzin + "\n" +
    "Waktu: " + waktuLengkap + "\n" +
    "Petugas Piket: " + namaPiket;

  const qrApiUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=0&data=" + encodeURIComponent(qrContent);

  try {
    const qrBlob = UrlFetchApp.fetch(qrApiUrl).getBlob();
    
    const qrTable = body.appendTable();
    qrTable.setBorderWidth(0);
    const qrRow = qrTable.appendTableRow();
    
    const cellImg = qrRow.appendTableCell();
    cellImg.setWidth(160);
    const imgPara = cellImg.appendParagraph('');
    imgPara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    imgPara.appendInlineImage(qrBlob);

    const cellInfo = qrRow.appendTableCell();
    const pValTitle = cellInfo.appendParagraph('BARCODE VERIFIKASI DIGITAL');
    pValTitle.setFontFamily('Arial').setFontSize(11).setBold(true).setForegroundColor('#0f172a');
    
    const pValSub = cellInfo.appendParagraph(
      'Dokumen ini disahkan secara resmi oleh Petugas Piket:\n' +
      '• Nama Siswa: ' + namaSiswa + ' (' + kelasSiswa + ')\n' +
      '• Tanggal/Waktu: ' + waktuLengkap + '\n' +
      '• Petugas Piket Bertugas: ' + namaPiket + '\n' +
      '• Status: SAH & TERVERIFIKASI SISTEM'
    );
    pValSub.setFontFamily('Arial').setFontSize(9.5).setForegroundColor('#334155');
  } catch (e) {
    Logger.log('Gagal mengunduh QR Code/Barcode: ' + e);
  }

  doc.saveAndClose();

  let folderId = props.getProperty('FOLDER_ID');
  if (!folderId) {
    const folders = DriveApp.getFoldersByName('Surat_Izin_PDF');
    const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder('Surat_Izin_PDF');
    folderId = folder.getId();
    props.setProperty('FOLDER_ID', folderId);
  }

  const folder = DriveApp.getFolderById(folderId);
  const pdfBlob = doc.getAs('application/pdf');
  const pdfFile = folder.createFile(pdfBlob).setName('Surat_Izin_' + nama + '_' + idIzin + '.pdf');
  pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  DriveApp.getFileById(doc.getId()).setTrashed(true);

  return pdfFile.getUrl();
}

function generateEduIzinRecapPDF(selectedIds) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateDataIzinSheet(ss);
  const data = sheet.getDataRange().getValues();

  const doc = DocumentApp.create('Temp_Rekap_Izin');
  const body = doc.getBody();
  body.setMarginTop(30).setMarginBottom(30).setMarginLeft(30).setMarginRight(30);

  const header = body.appendParagraph("REKAPITULASI IZIN SISWA KBM\nSMARTAPP SEKOLAH");
  header.setFontFamily('Arial').setFontSize(14).setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  body.appendParagraph('Dicetak pada: ' + Utilities.formatDate(new Date(), TIMEZONE, "dd/MM/yyyy HH:mm")).setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontSize(9.5).setFontFamily('Arial');
  body.appendParagraph('');

  const table = body.appendTable();
  const tr = table.appendTableRow();
  tr.appendTableCell('No').setBold(true).setWidth(25);
  tr.appendTableCell('Tgl / Waktu').setBold(true).setWidth(95);
  tr.appendTableCell('Nama Siswa').setBold(true);
  tr.appendTableCell('Kelas').setBold(true).setWidth(65);
  tr.appendTableCell('Kategori').setBold(true).setWidth(95);
  tr.appendTableCell('Status').setBold(true).setWidth(70);

  let targetIds = [];
  if (selectedIds) {
    if (typeof selectedIds === 'string') {
      try { targetIds = JSON.parse(selectedIds); } catch(e) { targetIds = selectedIds.split(','); }
    } else if (Array.isArray(selectedIds)) {
      targetIds = selectedIds;
    }
  }

  let no = 1;
  for (let i = 1; i < data.length; i++) {
    const rowId = String(data[i][0]);
    if (!targetIds || targetIds.length === 0 || targetIds.indexOf(rowId) !== -1) {
      const row = table.appendTableRow();
      row.appendTableCell(no.toString()).setFontSize(9.5).setFontFamily('Arial');
      let wStr = '-';
      try { wStr = Utilities.formatDate(new Date(data[i][1]), TIMEZONE, "dd/MM/yy HH:mm"); } catch(e) { wStr = String(data[i][1]); }

      row.appendTableCell(wStr).setFontSize(9.5).setFontFamily('Arial');
      row.appendTableCell(String(data[i][2] || '')).setFontSize(9.5).setFontFamily('Arial');
      row.appendTableCell(String(data[i][3] || '')).setFontSize(9.5).setFontFamily('Arial');
      row.appendTableCell(String(data[i][4] || '')).setFontSize(9.5).setFontFamily('Arial');

      let status = "Selesai";
      if (data[i][8] === 'Ditolak' || data[i][9] === 'Ditolak') { status = "Ditolak"; }
      else if (data[i][9] !== 'Disetujui') { status = "Proses"; }

      row.appendTableCell(status).setFontSize(9.5).setFontFamily('Arial');
      no++;
    }
  }

  doc.saveAndClose();
  const props = PropertiesService.getScriptProperties();
  let folderId = props.getProperty('FOLDER_ID');
  if (!folderId) {
    const folders = DriveApp.getFoldersByName('Surat_Izin_PDF');
    const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder('Surat_Izin_PDF');
    folderId = folder.getId();
    props.setProperty('FOLDER_ID', folderId);
  }

  const folder = DriveApp.getFolderById(folderId);
  const pdfBlob = doc.getAs('application/pdf');
  const pdfFile = folder.createFile(pdfBlob).setName('Rekap_Izin_KBM_' + new Date().getTime() + '.pdf');

  pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  DriveApp.getFileById(doc.getId()).setTrashed(true);
  return pdfFile.getUrl();
}
