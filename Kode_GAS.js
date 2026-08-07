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
const TIMEZONE = 'Asia/Jakarta'; // Menggunakan Timezone WIB Indonesia

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
    else if (action === 'initial_setup') {
      return handleInitialSetupWeb();
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
    else if (action === 'device_scan' || action === 'solution_scan') {
      return handleDeviceAttendanceScan(e.parameter.pin || e.parameter.nis, e.parameter.waktu, e.parameter.status);
    }
    else if (action === 'setup_device_columns') {
      ensureDeviceUserIdColumns();
      return jsonResponse('success', 'Header kolom ID_Mesin di Sheet DataSiswa dan Users berhasil dikonfigurasi!');
    }

    return jsonResponse('success', 'API Active');
  } catch (err) {
    return jsonResponse('error', 'Server Error: ' + err.toString());
  }
}

// === DUKUNGAN POST (Login, Absensi, Pelanggaran & Manajemen User) ===
function doPost(e) {
  try {
    let action = e ? e.parameter ? e.parameter.action : null : null;

    if (action === 'login') {
      return handleLogin(e.parameter.username, e.parameter.password);
    }
    else if (action === 'get_students') {
      return handleGetStudents();
    }
    else if (action === 'add_student') {
      return handleAddStudent(e.parameter.nisn, e.parameter.nis, e.parameter.nama, e.parameter.kelas, e.parameter.gender);
    }
    else if (action === 'update_student') {
      return handleUpdateStudent(e.parameter.old_nis, e.parameter.old_nisn, e.parameter.nisn, e.parameter.nis, e.parameter.nama, e.parameter.kelas, e.parameter.gender);
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
      return handleAddUser(e.parameter.username, e.parameter.password, e.parameter.role, e.parameter.nama, e.parameter.id_mesin);
    }
    else if (action === 'update_user') {
      return handleUpdateUser(e.parameter.old_username, e.parameter.username, e.parameter.password, e.parameter.role, e.parameter.nama, e.parameter.id_mesin);
    }
    else if (action === 'delete_user') {
      return handleDeleteUser(e.parameter.username);
    }
    else if (action === 'save_config') {
      return handleSaveConfig(e.parameter.nama_sekolah, e.parameter.tahun_pelajaran);
    }
    else if (action === 'initial_setup') {
      return handleInitialSetupWeb();
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
    else if (action === 'setup_device_columns') {
      ensureDeviceUserIdColumns();
      return jsonResponse('success', 'Header kolom ID_Mesin di Sheet DataSiswa dan Users berhasil dikonfigurasi!');
    }

    return jsonResponse('error', 'Action tidak ditemukan.');
  } catch (err) {
    return jsonResponse('error', 'Server Error: ' + err.toString());
  }
}

// Helper Ambil Data Pengguna / User
function getUsersFromCacheOrSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_USERS);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  let users = [];

  for (let i = 1; i < data.length; i++) {
    const u = String(data[i][1] || '').trim();
    if (!u) continue;
    users.push({
      nis: String(data[i][0] || ''),
      username: u,
      password: String(data[i][2] || '').trim(),
      role: String(data[i][3] || ''),
      nama: String(data[i][4] || '')
    });
  }

  return users;
}

function handleLogin(username, password) {
  const u = String(username || '').trim();
  const p = String(password || '').trim();

  if (!u || !p) {
    return jsonResponse('error', 'Username dan Password wajib diisi.');
  }

  const users = getUsersFromCacheOrSheet();

  for (let i = 0; i < users.length; i++) {
    if (users[i].username === u && users[i].password === p) {
      return jsonResponse('success', 'Berhasil', {
        username: users[i].username,
        role: users[i].role,
        nama: users[i].nama
      });
    }
  }
  return jsonResponse('error', 'Username atau Password salah!');
}

// === HANDLER MANAJEMEN GURU / PENGGUNA (CRUD) ===
function fetchUsersList(ss) {
  const sheet = ss.getSheetByName(SHEET_USERS);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  let users = [];

  for (let i = 1; i < data.length; i++) {
    const id = String(data[i][0] || '').trim();
    const username = String(data[i][1] || '').trim();
    const password = String(data[i][2] || '').trim();
    const role = String(data[i][3] || '').trim();
    const nama = String(data[i][4] || '').trim();
    const id_mesin = String(data[i][5] || '').trim();

    if (username) {
      users.push({ id, username, password, role, nama, id_mesin });
    }
  }

  return users;
}

function handleGetUsers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return jsonResponse('success', 'Daftar Pengguna', fetchUsersList(ss));
}

function handleAddUser(username, password, role, nama, id_mesin) {
  if (!username || !password || !nama) {
    return jsonResponse('error', 'Username, Password, dan Nama Lengkap wajib diisi.');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
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
  sheet.appendRow([newId, username.trim(), password.trim(), role || 'Guru', nama.trim(), String(id_mesin || '').trim()]);

  return jsonResponse('success', `Pengguna "${nama}" berhasil ditambahkan.`);
}

function handleUpdateUser(oldUsername, username, password, role, nama, id_mesin) {
  if (!oldUsername || !username || !nama) {
    return jsonResponse('error', 'Data pengguna tidak lengkap.');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_USERS);
  if (!sheet) return jsonResponse('error', 'Sheet Users tidak ditemukan.');

  const data = sheet.getDataRange().getValues();
  const targetOld = String(oldUsername).trim().toLowerCase();

  for (let i = 1; i < data.length; i++) {
    const currentUsername = String(data[i][1] || '').trim().toLowerCase();
    if (currentUsername === targetOld) {
      const rowIndex = i + 1;
      sheet.getRange(rowIndex, 2).setValue(username.trim()); // Username
      if (password) sheet.getRange(rowIndex, 3).setValue(password.trim()); // Password
      sheet.getRange(rowIndex, 4).setValue(role || 'Guru'); // Role
      sheet.getRange(rowIndex, 5).setValue(nama.trim()); // NamaLengkap
      sheet.getRange(rowIndex, 6).setValue(String(id_mesin || '').trim()); // ID_Mesin

      return jsonResponse('success', `Data "${nama}" berhasil diperbarui.`);
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

  if (sheetLog) {
    const lastRow = sheetLog.getLastRow();
    if (lastRow > 1) {
      const startRow = 2; // Scan SELURUH data log agar rekap dan status kunci absensi 100% akurat
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
          alreadySubmitted = true;
          submittedBy = String(logData[i][6] || 'Petugas');
          submittedTime = logTimeStr;

          const nisn = String(logData[i][1] || '').trim();
          const nis = String(logData[i][2] || '').trim();
          const nama = String(logData[i][3] || '').trim().toLowerCase();
          const status = String(logData[i][5] || 'HADIR');

          if (nis) todayStatus[nis] = status;
          if (nisn) todayStatus[nisn] = status;
          if (nama) todayStatus[nama] = status;
        }
      }
    }
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
          nisn: String(logData[i][1] || ''),
          nis: String(logData[i][2] || ''),
          nama: String(logData[i][3] || ''),
          kelas: String(logData[i][4] || ''),
          status: String(logData[i][5] || 'HADIR'),
          petugas: String(logData[i][6] || 'Petugas')
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
    tahunPelajaran: '2026-2027'
  };

  if (!sheetConfig) {
    sheetConfig = ss.insertSheet(SHEET_CONFIG);
    sheetConfig.appendRow(['Key', 'Value']);
    sheetConfig.appendRow(['NamaSekolah', config.namaSekolah]);
    sheetConfig.appendRow(['TahunPelajaran', config.tahunPelajaran]);
    sheetConfig.getRange("A1:B1").setFontWeight("bold").setBackground("#d9ead3");
  } else {
    const data = sheetConfig.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const rawKey = String(data[i][0] || '').trim();
      const val = String(data[i][1] || '').trim();
      const normKey = rawKey.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (normKey.includes('sekolah') || normKey.includes('nama')) {
        if (val) config.namaSekolah = val;
      }
      if (normKey.includes('tahun') || normKey.includes('ajaran') || normKey.includes('pelajaran') || normKey === 'tp' || normKey === 'ta') {
        if (val) config.tahunPelajaran = val;
      }
    }
  }
  return config;
}

function handleGetConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return jsonResponse('success', 'Config Loaded', getConfigObject(ss));
}

function handleSaveConfig(namaSekolah, tahunPelajaran) {
  if (!namaSekolah || !tahunPelajaran) {
    return jsonResponse('error', 'Nama Sekolah dan Tahun Pelajaran wajib diisi.');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheetConfig = ss.getSheetByName(SHEET_CONFIG);
  if (!sheetConfig) {
    sheetConfig = ss.insertSheet(SHEET_CONFIG);
    sheetConfig.appendRow(['Key', 'Value']);
    sheetConfig.appendRow(['NamaSekolah', namaSekolah.trim()]);
    sheetConfig.appendRow(['TahunPelajaran', tahunPelajaran.trim()]);
  } else {
    const data = sheetConfig.getDataRange().getValues();
    let foundNama = false;
    let foundTahun = false;

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
    }

    if (!foundNama) sheetConfig.appendRow(['NamaSekolah', namaSekolah.trim()]);
    if (!foundTahun) sheetConfig.appendRow(['TahunPelajaran', tahunPelajaran.trim()]);
  }

  return jsonResponse('success', 'Pengaturan sekolah & tahun pelajaran berhasil diperbarui.');
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

    if (isEditMode) {
      // MODE EDIT: Hapus log lama untuk kelas & tanggal ini agar ter-update tanpa duplikasi
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
      // SIMPAN NORMAL: Tolak simpan ganda jika data sudah tersimpan di sheet
      for (let i = existingLogs.length - 1; i >= 0; i--) {
        const rawDate = existingLogs[i][0];
        if (!rawDate) continue;

        const logDateStr = getFormattedDate(rawDate);
        const logKelas = String(existingLogs[i][4] || '').trim().toLowerCase().replace(/[\s\-]/g, '');

        if (logKelas === normSampleKelas && logDateStr === targetTanggalStr) {
          return jsonResponse('error', `Gagal menyimpan: Data absensi kelas ${firstStudent.kelas} untuk tanggal ${targetTanggalStr} sudah ada di database sheet. Klik tombol 'Edit Data Absensi' jika ingin mengedit.`);
        }
      }
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
  const targetTanggal = String(tanggalFilter || 'Semua').trim();

  const startRow = Math.max(2, lastRow - 5000);
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

  // 10. Hapus Sheet bawaan "Sheet1" / "Sheet 1" jika ada
  let defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Sheet 1');
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch (e) { }
  }

  try {
    SpreadsheetApp.getUi().alert('✅ Setup Database Berhasil!\nSemua sheet (Users, DataSiswa, LogAbsen, Pengaturan, LogPelanggaran, DataPelanggaran, LogAbsenGuru, PengajuanIzin, HariLibur) telah siap digunakan.');
  } catch (e) { }

  return jsonResponse('success', 'Setup Database Google Sheets Berhasil! Semua sheet (termasuk HariLibur & Presensi Guru) telah dibuat.');
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

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(id)) {
        targetRow = i + 1;
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
        gender: gender
      });
    }
  }
  return jsonResponse('success', 'Daftar Siswa', students);
}

function handleAddStudent(nisn, nis, nama, kelas, gender, id_mesin) {
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

  sheet.appendRow([cleanNisn, cleanNis, cleanNama, cleanKelas, cleanGender, cleanIdMesin]);
  clearStudentCache();

  return jsonResponse('success', `Siswa "${cleanNama}" kelas ${cleanKelas} berhasil ditambahkan.`);
}

function handleUpdateStudent(oldNis, oldNisn, nisn, nis, nama, kelas, gender, id_mesin) {
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
  for (let i = 1; i < data.length; i++) {
    const rNisn = String(data[i][0] || '').trim().toLowerCase();
    const rNis = String(data[i][1] || '').trim().toLowerCase();

    if ((targetOldNis && rNis === targetOldNis) || (targetOldNisn && rNisn === targetOldNisn)) {
      targetRow = i + 1;
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

  sheet.getRange(targetRow, 1, 1, 6).setValues([[cleanNisn, cleanNis, cleanNama, cleanKelas, cleanGender, cleanIdMesin]]);
  clearStudentCache();

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
      sheet.getRange(1, 1, 1, 6).setValues([['NISN', 'NIS', 'Nama', 'Kelas', 'JenisKelamin', 'ID_Mesin']]);
      sheet.getRange("A1:F1").setFontWeight("bold").setBackground("#c9daf8");
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
        String(it.id_mesin || it.idMesin || '').trim()
      ]);
    });

    if (rowsToAppend.length > 0) {
      const startRow = sheet.getLastRow() + 1;
      sheet.getRange(startRow, 1, rowsToAppend.length, 6).setValues(rowsToAppend);
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

    // 1. Sheet DataSiswa (Kolom F: ID_Mesin)
    const sheetSiswa = ss.getSheetByName(SHEET_SISWA);
    if (sheetSiswa) {
      ensureStudentGenderColumn(sheetSiswa);
      const lastColSiswa = sheetSiswa.getLastColumn();
      if (lastColSiswa < 6 || !String(sheetSiswa.getRange(1, 6).getValue() || '').trim()) {
        sheetSiswa.getRange(1, 6).setValue('ID_Mesin');
        sheetSiswa.getRange(1, 6).setFontWeight('bold').setBackground('#c9daf8');
      }
    }

    // 2. Sheet Users (Kolom F: ID_Mesin)
    const sheetUsers = ss.getSheetByName(SHEET_USERS);
    if (sheetUsers) {
      const lastColUsers = sheetUsers.getLastColumn();
      if (lastColUsers < 6 || !String(sheetUsers.getRange(1, 6).getValue() || '').trim()) {
        sheetUsers.getRange(1, 6).setValue('ID_Mesin');
        sheetUsers.getRange(1, 6).setFontWeight('bold').setBackground('#c9daf8');
      }
    }
  } catch (e) {
    Logger.log('ensureDeviceUserIdColumns error: ' + e.toString());
  }
}

// === HANDLER INTEGRASI MESIN ABSENSI WAJAH & SIDIK JARI (SOLUTION X902 / ZKTECO) ===
function handleDeviceAttendanceScan(pin, waktuScan, statusScan) {
  try {
    if (!pin) {
      return jsonResponse('error', 'PIN / NIS siswa atau ID guru tidak boleh kosong.');
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const cleanPin = String(pin).trim();
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

        if ((idMesin && cleanPin === idMesin) || cleanPin === nis || cleanPin === nisn) {
          matchedStudent = {
            nisn: nisn,
            nis: nis,
            nama: String(siswaData[i][2] || '').trim(),
            kelas: String(siswaData[i][3] || '').trim()
          };
          break;
        }
      }
    }

    if (matchedStudent) {
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

      return jsonResponse('success', `Absensi Wajah Siswa [${matchedStudent.nama} - Kelas ${matchedStudent.kelas}] Berhasil Dicatat (${scanTimeStr})`, {
        tipe: 'siswa',
        nama: matchedStudent.nama,
        kelas: matchedStudent.kelas,
        waktu: scanTimeStr,
        status: statusVal
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

        if ((idMesin && cleanPin === idMesin) || cleanPin === uname) {
          matchedUser = {
            username: uname,
            nama: String(uData[i][4] || uData[i][1] || '').trim(),
            role: String(uData[i][3] || 'Guru').trim()
          };
          break;
        }
      }
    }

    if (matchedUser) {
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

      return jsonResponse('success', `Absensi Wajah Guru [${matchedUser.nama}] Berhasil Dicatat (${scanTimeStr})`, {
        tipe: 'guru',
        nama: matchedUser.nama,
        waktu: scanTimeStr,
        status: statusVal
      });
    }

    return jsonResponse('error', `ID Mesin / PIN [${cleanPin}] dari Solution X902 belum dicocokkan dengan data Siswa atau Guru di database.`);

  } catch (err) {
    return jsonResponse('error', 'Gagal memproses scan mesin wajah: ' + err.toString());
  }
}
