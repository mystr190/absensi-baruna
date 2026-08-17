/**
 * Modul Generator Perangkat Pembelajaran (Deep Learning / Pembelajaran Mendalam)
 * Sesuai Standar Kurikulum Pembelajaran Mendalam (Mindful, Meaningful, Joyful Learning)
 * Powered by Gemini AI Engine Integration
 */

// Fail-safe helper escapeHtml
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', function() {
    initPerangkatPembelajaranModule();
});

function initPerangkatPembelajaranModule() {
    const navBtn = document.getElementById('navPerangkatPembelajaran');
    if (navBtn) {
        navBtn.addEventListener('click', function() {
            loadDefaultTeacherData();
        });
    }

    const btnGenerate = document.getElementById('btnGeneratePerangkat');
    if (btnGenerate) {
        btnGenerate.addEventListener('click', handleGeneratePerangkat);
    }

    const btnReset = document.getElementById('btnResetPerangkat');
    if (btnReset) {
        btnReset.addEventListener('click', handleResetPerangkat);
    }

    const btnPrint = document.getElementById('btnPrintPerangkat');
    if (btnPrint) {
        btnPrint.addEventListener('click', handlePrintPerangkat);
    }

    const btnCopy = document.getElementById('btnCopyPerangkat');
    if (btnCopy) {
        btnCopy.addEventListener('click', handleCopyPerangkat);
    }

    const btnDownloadWord = document.getElementById('btnDownloadPerangkatWord');
    if (btnDownloadWord) {
        btnDownloadWord.addEventListener('click', handleDownloadPerangkatWord);
    }

    // Tab Navigation
    const tabBtns = document.querySelectorAll('.perangkat-tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            switchPerangkatTab(targetTab);
        });
    });
}

function loadDefaultTeacherData() {
    try {
        const userJson = localStorage.getItem('smart_absen_user');
        if (userJson) {
            const u = JSON.parse(userJson);
            if (u.nama && document.getElementById('ppNamaGuru') && !document.getElementById('ppNamaGuru').value) {
                document.getElementById('ppNamaGuru').value = u.nama;
            }
        }
        
        const configJson = localStorage.getItem('smart_absen_config');
        if (configJson) {
            const cfg = JSON.parse(configJson);
            if (cfg.namaSekolah && document.getElementById('ppNamaSekolah') && !document.getElementById('ppNamaSekolah').value) {
                document.getElementById('ppNamaSekolah').value = cfg.namaSekolah;
            }
            if (cfg.namaKepsek && document.getElementById('ppNamaKepsek') && !document.getElementById('ppNamaKepsek').value) {
                document.getElementById('ppNamaKepsek').value = cfg.namaKepsek;
            }
        }
    } catch(e) {
        console.warn('Error loading teacher default info:', e);
    }
}

function switchPerangkatTab(tabId) {
    const tabBtns = document.querySelectorAll('.perangkat-tab-btn');
    const tabContents = document.querySelectorAll('.perangkat-tab-content');

    tabBtns.forEach(btn => {
        if (btn.getAttribute('data-tab') === tabId) {
            btn.classList.add('active');
            btn.style.background = 'linear-gradient(135deg, #7c3aed, #6366f1)';
            btn.style.color = '#ffffff';
            btn.style.borderColor = '#6366f1';
        } else {
            btn.classList.remove('active');
            btn.style.background = 'rgba(255, 255, 255, 0.05)';
            btn.style.color = 'var(--text-muted)';
            btn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }
    });

    tabContents.forEach(content => {
        if (content.id === `tabContent-${tabId}`) {
            content.style.display = 'block';
        } else {
            content.style.display = 'none';
        }
    });
}

function getPerangkatFormData() {
    return {
        namaSekolah: (document.getElementById('ppNamaSekolah') ? document.getElementById('ppNamaSekolah').value.trim() : '') || 'SMA Negeri 1 Barunawati',
        namaGuru: (document.getElementById('ppNamaGuru') ? document.getElementById('ppNamaGuru').value.trim() : '') || 'Guru Pengampu, S.Pd.',
        namaKepsek: (document.getElementById('ppNamaKepsek') ? document.getElementById('ppNamaKepsek').value.trim() : '') || 'Kepala Sekolah, M.Pd.',
        mapel: (document.getElementById('ppMapel') ? document.getElementById('ppMapel').value.trim() : '') || 'Informatika',
        fase: (document.getElementById('ppFase') ? document.getElementById('ppFase').value : '') || 'Fase E (Kelas X)',
        semester: (document.getElementById('ppSemester') ? document.getElementById('ppSemester').value : '') || 'Ganjil',
        tpTahun: (document.getElementById('ppTahunAjaran') ? document.getElementById('ppTahunAjaran').value.trim() : '') || '2026/2027',
        alokasiWaktu: (document.getElementById('ppAlokasiWaktu') ? document.getElementById('ppAlokasiWaktu').value.trim() : '') || '2 x 45 Menit (2 JP)',
        elemenMateri: (document.getElementById('ppElemenMateri') ? document.getElementById('ppElemenMateri').value.trim() : '') || 'Berpikir Komputasional dan Logika Pemrograman',
        cpRingkas: (document.getElementById('ppCpRingkas') ? document.getElementById('ppCpRingkas').value.trim() : '') || 'Peserta didik mampu menerapkan strategi algoritmik standar untuk menghasilkan beberapa solusi persoalan dengan data diskrit volume besar dan mengimplementasikannya dalam pemrograman.',
        dimensiP3: (document.getElementById('ppDimensiP3') ? document.getElementById('ppDimensiP3').value.trim() : '') || 'Bernalar Kritis, Kreatif, dan Gotong Royong',
        pendekatanFokus: (document.getElementById('ppPendekatanFokus') ? document.getElementById('ppPendekatanFokus').value : '') || 'Deep Learning (Mindful, Meaningful, Joyful Learning)'
    };
}

function handleGeneratePerangkat() {
    const data = getPerangkatFormData();

    if (!data.mapel || !data.elemenMateri) {
        showToast('Mohon isi Mata Pelajaran dan Elemen/Materi Pokok terlebih dahulu!', 'warning');
        return;
    }

    const btnGenerate = document.getElementById('btnGeneratePerangkat');
    const originalText = btnGenerate ? btnGenerate.innerHTML : '';
    if (btnGenerate) {
        btnGenerate.disabled = true;
        btnGenerate.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Gemini AI Menyusun Perangkat...';
    }

    showToast('✨ Gemini AI sedang merekayasa Perangkat Pembelajaran Mendalam...', 'info');

    setTimeout(() => {
        try {
            generateAllDocuments(data);

            const resultCard = document.getElementById('ppResultCard');
            if (resultCard) {
                resultCard.style.display = 'block';
                resultCard.scrollIntoView({ behavior: 'smooth' });
            }

            if (typeof showToast === 'function') {
                showToast('🎉 Berhasil menggenerate seluruh Perangkat Pembelajaran Gemini AI (Deep Learning)!', 'success');
            }
        } catch(err) {
            console.error('Error generating perangkat:', err);
            if (typeof showToast === 'function') {
                showToast('⚠️ Gagal menyusun perangkat: ' + err.message, 'error');
            }
        } finally {
            if (btnGenerate) {
                btnGenerate.disabled = false;
                btnGenerate.innerHTML = originalText;
            }
        }
    }, 50);
}

function generateAllDocuments(d) {
    const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    // 1. CP & Pemetaan Elemen
    document.getElementById('tabContent-cp').innerHTML = renderCpDocument(d);

    // 2. TP & ATP
    document.getElementById('tabContent-tp-atp').innerHTML = renderTpAtpDocument(d);

    // 3. KKTP & Rubrik Asesmen
    document.getElementById('tabContent-kktp').innerHTML = renderKktpDocument(d);

    // 4. Modul Ajar (Deep Learning: Mindful, Meaningful, Joyful)
    document.getElementById('tabContent-modul').innerHTML = renderModulAjarDeepLearning(d, todayStr);

    // 5. Prota & Promes
    document.getElementById('tabContent-prota-promes').innerHTML = renderProtaPromesDocument(d);

    // 6. Asesmen Diagnostik, Formatif, Sumatif
    document.getElementById('tabContent-asesmen').innerHTML = renderAsesmenDocument(d);
}

// -------------------------------------------------------------
// RENDER TEMPLATES FOR DEEP LEARNING (PEMBELAJARAN MENDALAM)
// -------------------------------------------------------------

function renderCpDocument(d) {
    return `
        <div class="perangkat-document-paper" style="background:#ffffff; color:#000000; padding:25px; border-radius:8px; font-family:'Times New Roman', serif; line-height:1.6;">
            <div style="text-align:center; border-bottom:2px solid #000; padding-bottom:10px; margin-bottom:20px;">
                <h3 style="margin:0; text-transform:uppercase; font-size:14pt;">CAPAIAN PEMBELAJARAN (CP) & ELEMEN MATERI</h3>
                <h4 style="margin:5px 0 0 0; font-size:12pt; font-weight:normal;">KURIKULUM PEMBELAJARAN MENDALAM (DEEP LEARNING)</h4>
                <p style="margin:3px 0 0 0; font-size:10pt;">${escapeHtml(d.namaSekolah)} • TP ${escapeHtml(d.tpTahun)}</p>
            </div>

            <table style="width:100%; border-collapse:collapse; margin-bottom:20px; font-size:10pt;">
                <tr><td style="width:180px; font-weight:bold;">Mata Pelajaran</td><td>: ${escapeHtml(d.mapel)}</td></tr>
                <tr><td style="font-weight:bold;">Fase / Kelas / Semester</td><td>: ${escapeHtml(d.fase)} / Semester ${escapeHtml(d.semester)}</td></tr>
                <tr><td style="font-weight:bold;">Elemen / Topik Utama</td><td>: ${escapeHtml(d.elemenMateri)}</td></tr>
                <tr><td style="font-weight:bold;">Dimensi Profil Pelajar</td><td>: ${escapeHtml(d.dimensiP3)}</td></tr>
            </table>

            <h4 style="font-size:11pt; border-bottom:1px solid #000; padding-bottom:4px; margin-top:15px;">A. Deskripsi Capaian Pembelajaran (CP)</h4>
            <p style="text-align:justify; font-size:10.5pt; text-indent:30px;">
                ${escapeHtml(d.cpRingkas)}
            </p>

            <h4 style="font-size:11pt; border-bottom:1px solid #000; padding-bottom:4px; margin-top:20px;">B. Analisis & Pemetaan Elemen Pembelajaran Mendalam</h4>
            <table style="width:100%; border-collapse:collapse; font-size:9.5pt; margin-top:10px; text-align:left;" border="1">
                <thead>
                    <tr style="background:#f1f5f9; text-align:center; font-weight:bold;">
                        <th style="padding:6px; width:40px;">No</th>
                        <th style="padding:6px; width:160px;">Elemen</th>
                        <th style="padding:6px;">Capaian Pembelajaran Elemen</th>
                        <th style="padding:6px; width:180px;">Fokus Pemahaman Konsep (Deep Learning)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="text-align:center; padding:6px;">1</td>
                        <td style="padding:6px; font-weight:bold;">${escapeHtml(d.elemenMateri)}</td>
                        <td style="padding:6px;">${escapeHtml(d.cpRingkas)}</td>
                        <td style="padding:6px;">Menghubungkan konsep abstrak dengan fenomena nyata dan memecahkan persoalan kompleks melalui bernalar kritis.</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
}

function renderTpAtpDocument(d) {
    return `
        <div class="perangkat-document-paper" style="background:#ffffff; color:#000000; padding:25px; border-radius:8px; font-family:'Times New Roman', serif; line-height:1.6;">
            <div style="text-align:center; border-bottom:2px solid #000; padding-bottom:10px; margin-bottom:20px;">
                <h3 style="margin:0; text-transform:uppercase; font-size:14pt;">TUJUAN PEMBELAJARAN (TP) & ALUR TUJUAN PEMBELAJARAN (ATP)</h3>
                <h4 style="margin:5px 0 0 0; font-size:12pt; font-weight:normal;">PENDEKATAN PEMBELAJARAN MENDALAM (DEEP LEARNING)</h4>
                <p style="margin:3px 0 0 0; font-size:10pt;">${escapeHtml(d.namaSekolah)}</p>
            </div>

            <table style="width:100%; border-collapse:collapse; font-size:9.5pt; margin-top:15px; text-align:left;" border="1">
                <thead>
                    <tr style="background:#f1f5f9; text-align:center; font-weight:bold;">
                        <th style="padding:6px; width:35px;">Kode</th>
                        <th style="padding:6px;">Tujuan Pembelajaran (TP)</th>
                        <th style="padding:6px; width:140px;">Indikator Ketercapaian</th>
                        <th style="padding:6px; width:130px;">Pilar Deep Learning</th>
                        <th style="padding:6px; width:65px;">Alokasi</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="text-align:center; padding:6px; font-weight:bold;">TP.1</td>
                        <td style="padding:6px;">Peserta didik mampu menganalisis dan memahami secara mendalam konsep dasar <strong>${escapeHtml(d.elemenMateri)}</strong> dalam situasi kehidupan sehari-hari.</td>
                        <td style="padding:6px;">Dapat menjelaskan kembali konsep dengan bahasa sendiri dan mengidentifikasi masalah nyata.</td>
                        <td style="padding:6px;"><strong>Mindful Learning</strong><br><small>(Kehadiran & Kesadaran Konsep)</small></td>
                        <td style="text-align:center; padding:6px;">2 JP</td>
                    </tr>
                    <tr>
                        <td style="text-align:center; padding:6px; font-weight:bold;">TP.2</td>
                        <td style="padding:6px;">Peserta didik mampu menguraikan permasalahan kompleks dan merancang solusi matematis/logis secara kontekstual.</td>
                        <td style="padding:6px;">Mampu menyusun skema penyelesaian berurutan dan menguji validitas logika.</td>
                        <td style="padding:6px;"><strong>Meaningful Learning</strong><br><small>(Kebermaknaan & Penalaran)</small></td>
                        <td style="text-align:center; padding:6px;">2 JP</td>
                    </tr>
                    <tr>
                        <td style="text-align:center; padding:6px; font-weight:bold;">TP.3</td>
                        <td style="padding:6px;">Peserta didik mampu mengomunikasikan dan merefleksikan hasil karya atau solusi serta berkolaborasi dengan antusias.</td>
                        <td style="padding:6px;">Terampil mempresentasikan hasil, menerima masukan, dan merasa senang dalam proses belajar.</td>
                        <td style="padding:6px;"><strong>Joyful Learning</strong><br><small>(Pembelajaran Menyenangkan)</small></td>
                        <td style="text-align:center; padding:6px;">2 JP</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
}

function renderKktpDocument(d) {
    return `
        <div class="perangkat-document-paper" style="background:#ffffff; color:#000000; padding:25px; border-radius:8px; font-family:'Times New Roman', serif; line-height:1.6;">
            <div style="text-align:center; border-bottom:2px solid #000; padding-bottom:10px; margin-bottom:20px;">
                <h3 style="margin:0; text-transform:uppercase; font-size:14pt;">KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)</h3>
                <h4 style="margin:5px 0 0 0; font-size:12pt; font-weight:normal;">RUBRIK ASESMEN PEMBELAJARAN MENDALAM</h4>
            </div>

            <h4 style="font-size:11pt; border-bottom:1px solid #000; padding-bottom:4px;">Rubrik Penilaian Kualitas Pemahaman (Deep Learning Rubric)</h4>
            <table style="width:100%; border-collapse:collapse; font-size:9pt; margin-top:10px; text-align:left;" border="1">
                <thead>
                    <tr style="background:#f1f5f9; text-align:center; font-weight:bold;">
                        <th style="padding:6px; width:120px;">Aspek Penilaian</th>
                        <th style="padding:6px;">Baru Berkembang (0-60)</th>
                        <th style="padding:6px;">Layak (61-75)</th>
                        <th style="padding:6px;">Cakap (76-88)</th>
                        <th style="padding:6px;">Mahir (89-100)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding:6px; font-weight:bold;">Pemahaman Konsep (Mindful)</td>
                        <td style="padding:6px;">Belum mampu menjelaskan konsep dasar ${escapeHtml(d.elemenMateri)}.</td>
                        <td style="padding:6px;">Mampu menjelaskan konsep dasar dengan bantuan panduan guru.</td>
                        <td style="padding:6px;">Mampu menjelaskan konsep secara mandiri dan runtut.</td>
                        <td style="padding:6px;">Mampu menghubungkan konsep dengan bidang/topik lain secara mendalam.</td>
                    </tr>
                    <tr>
                        <td style="padding:6px; font-weight:bold;">Penalaran & Relevansi (Meaningful)</td>
                        <td style="padding:6px;">Belum menemukan hubungan contoh dengan kehidupan nyata.</td>
                        <td style="padding:6px;">Menemukan contoh sederhana dalam kehidupan sehari-hari.</td>
                        <td style="padding:6px;">Mampu menganalisis masalah kontekstual dan memberi solusi logis.</td>
                        <td style="padding:6px;">Mampu merancang solusi inovatif untuk masalah kompleks kontekstual.</td>
                    </tr>
                    <tr>
                        <td style="padding:6px; font-weight:bold;">Kolaborasi & Refleksi (Joyful)</td>
                        <td style="padding:6px;">Pasif dalam kelompok dan enggan merefleksikan diri.</td>
                        <td style="padding:6px;">Aktif jika diminta dan mengikuti refleksi bersama.</td>
                        <td style="padding:6px;">Aktif berkolaborasi dan menyampaikan refleksi dengan antusias.</td>
                        <td style="padding:6px;">Menjadi penggerak kelompok, menghargai pendapat, dan menikmati proses belajar.</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
}

function renderModulAjarDeepLearning(d, todayStr) {
    return `
        <div class="perangkat-document-paper" style="background:#ffffff; color:#000000; padding:25px; border-radius:8px; font-family:'Times New Roman', serif; line-height:1.6;">
            <!-- HEADER MODUL AJAR -->
            <div style="text-align:center; border-bottom:3px double #000; padding-bottom:10px; margin-bottom:20px;">
                <h2 style="margin:0; text-transform:uppercase; font-size:15pt; font-weight:bold;">MODUL AJAR / RPP PEMBELAJARAN MENDALAM</h2>
                <h3 style="margin:5px 0 0 0; font-size:13pt; font-weight:bold; color:#1e1b4b;">(DEEP LEARNING MODEL: MINDFUL, MEANINGFUL, & JOYFUL LEARNING)</h3>
                <p style="margin:4px 0 0 0; font-size:10pt;">${escapeHtml(d.namaSekolah)} • Tahun Ajaran ${escapeHtml(d.tpTahun)}</p>
            </div>

            <!-- I. INFORMASI UMUM -->
            <h3 style="font-size:11pt; border-bottom:1.5px solid #000; padding-bottom:3px; margin-top:15px; text-transform:uppercase;">I. INFORMASI UMUM</h3>
            <table style="width:100%; border-collapse:collapse; font-size:10pt; margin-bottom:15px;">
                <tr><td style="width:200px; font-weight:bold;">Nama Penyusun / Guru</td><td>: ${escapeHtml(d.namaGuru)}</td></tr>
                <tr><td style="font-weight:bold;">Nama Satuan Pendidikan</td><td>: ${escapeHtml(d.namaSekolah)}</td></tr>
                <tr><td style="font-weight:bold;">Mata Pelajaran</td><td>: <strong>${escapeHtml(d.mapel)}</strong></td></tr>
                <tr><td style="font-weight:bold;">Fase / Kelas / Semester</td><td>: ${escapeHtml(d.fase)} / Semester ${escapeHtml(d.semester)}</td></tr>
                <tr><td style="font-weight:bold;">Elemen / Topik Utama</td><td>: ${escapeHtml(d.elemenMateri)}</td></tr>
                <tr><td style="font-weight:bold;">Alokasi Waktu</td><td>: ${escapeHtml(d.alokasiWaktu)}</td></tr>
                <tr><td style="font-weight:bold;">Profil Pelajar Pancasila</td><td>: ${escapeHtml(d.dimensiP3)}</td></tr>
                <tr><td style="font-weight:bold;">Model & Pendekatan</td><td>: <strong>Pembelajaran Mendalam (Deep Learning)</strong> - Mindful, Meaningful, & Joyful</td></tr>
                <tr><td style="font-weight:bold;">Sarana & Prasarana</td><td>: Proyektor, Komputer/Laptop, LKPD Digital, Bahan Ajar Kontekstual, Media Visual</td></tr>
            </table>

            <!-- II. KOMPONEN INTI -->
            <h3 style="font-size:11pt; border-bottom:1.5px solid #000; padding-bottom:3px; margin-top:20px; text-transform:uppercase;">II. KOMPONEN INTI</h3>

            <h4 style="font-size:10.5pt; margin:10px 0 5px 0; font-weight:bold;">A. Capaian Pembelajaran (CP)</h4>
            <p style="margin:0 0 10px 0; text-align:justify; font-size:10pt; padding-left:15px;">
                <em>"${escapeHtml(d.cpRingkas)}"</em>
            </p>

            <h4 style="font-size:10.5pt; margin:10px 0 5px 0; font-weight:bold;">B. Tujuan Pembelajaran (TP) Deep Learning</h4>
            <ol style="margin:0 0 10px 0; padding-left:30px; font-size:10pt;">
                <li><strong>Pemahaman Konsep (Mindful):</strong> Peserta didik dengan sadar dan fokus mampu memahami struktur mendalam dari ${escapeHtml(d.elemenMateri)}.</li>
                <li><strong>Penalaran & Relevansi (Meaningful):</strong> Peserta didik mampu menganalisis persoalan nyata dan menerapkan konsep ${escapeHtml(d.elemenMateri)} secara kontekstual.</li>
                <li><strong>Aplikasi & Kolaborasi (Joyful):</strong> Peserta didik dengan gembira bekerja sama dalam tim untuk menciptakan solusi dan mempresentasikannya secara percaya diri.</li>
            </ol>

            <h4 style="font-size:10.5pt; margin:10px 0 5px 0; font-weight:bold;">C. Pemahaman Bermakna (Meaningful Understanding)</h4>
            <div style="background:#f8fafc; border-left:4px solid #4338ca; padding:10px; margin-bottom:10px; font-size:9.5pt;">
                Pembelajaran ${escapeHtml(d.mapel)} materi <strong>${escapeHtml(d.elemenMateri)}</strong> bukan sekadar menghafal rumus atau teori, melainkan melatih pola pikir logis dan bernalar kritis yang dapat digunakan untuk menyelesaikan berbagai tantangan nyata di era modern.
            </div>

            <h4 style="font-size:10.5pt; margin:10px 0 5px 0; font-weight:bold;">D. Pertanyaan Pemantik (Mindful Questioning)</h4>
            <ul style="margin:0 0 10px 0; padding-left:25px; font-size:10pt;">
                <li>Pernahkah kalian menyadari bagaimana sistem di sekitar kita bekerja secara otomatis dan efisien?</li>
                <li>Mengapa pemahaman mendalam tentang ${escapeHtml(d.elemenMateri)} sangat penting dalam memecahkan masalah sehari-hari?</li>
            </ul>

            <!-- III. KEGIATAN PEMBELAJARAN -->
            <h3 style="font-size:11pt; border-bottom:1.5px solid #000; padding-bottom:3px; margin-top:25px; text-transform:uppercase;">III. KEGIATAN PEMBELAJARAN (3 PILAR DEEP LEARNING)</h3>

            <table style="width:100%; border-collapse:collapse; font-size:9.5pt; margin-top:10px; text-align:left;" border="1">
                <thead>
                    <tr style="background:#e0e7ff; text-align:center; font-weight:bold;">
                        <th style="padding:8px; width:130px;">Tahapan & Pilar</th>
                        <th style="padding:8px;">Deskripsi Sintaks Aktivitas Pembelajaran</th>
                        <th style="padding:8px; width:70px;">Waktu</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding:8px; font-weight:bold; background:#f8fafc;">
                            1. KEGIATAN AWAL<br>
                            <span style="color:#4338ca;">(Mindful Learning)</span>
                        </td>
                        <td style="padding:8px;">
                            <ul>
                                <li><strong>Orientation & Readiness:</strong> Guru menyapa peserta didik, berdoa bersama, dan melakukan latihan bernapas singkat <em>(Mindful Breathing)</em> 1-2 menit untuk menyiapkan fokus mental peserta didik.</li>
                                <li><strong>Diagnostic Warm-up:</strong> Guru mengajukan pertanyaan pemantik kontekstual mengenai ${escapeHtml(d.elemenMateri)}.</li>
                                <li><strong>Goal Clarity:</strong> Guru menyampaikan tujuan pembelajaran secara transparan dan menarik manfaatnya bagi kehidupan nyata peserta didik.</li>
                            </ul>
                        </td>
                        <td style="text-align:center; padding:8px;">15 Menit</td>
                    </tr>
                    <tr>
                        <td style="padding:8px; font-weight:bold; background:#f8fafc;">
                            2. KEGIATAN INTI<br>
                            <span style="color:#047857;">(Meaningful Learning & Deep Processing)</span>
                        </td>
                        <td style="padding:8px;">
                            <ul>
                                <li><strong>Concept Exploration (Eksplorasi Konsep):</strong> Peserta didik mengamati studi kasus atau simulasi interaktif terkait ${escapeHtml(d.elemenMateri)}.</li>
                                <li><strong>Critical Thinking & Problem Solving:</strong> Dalam kelompok kecil (3-4 siswa), peserta didik menganalisis struktur masalah, mendiskusikan berbagai pendekatan penyelesaian, dan menguji asumsi secara bernalar kritis.</li>
                                <li><strong>Hands-on Practice & Application:</strong> Setiap kelompok merancang proyek/solusi sederhana menggunakan lembar kerja berorientasi masalah nyata.</li>
                                <li><strong>Teacher Scaffolding:</strong> Guru berkeliling memberikan bimbingan sesuai tingkat kebutuhan kelompok (diferensiasi proses).</li>
                            </ul>
                        </td>
                        <td style="text-align:center; padding:8px;">60 Menit</td>
                    </tr>
                    <tr>
                        <td style="padding:8px; font-weight:bold; background:#f8fafc;">
                            3. KEGIATAN PENUTUP<br>
                            <span style="color:#b45309;">(Joyful Learning & Reflection)</span>
                        </td>
                        <td style="padding:8px;">
                            <ul>
                                <li><strong>Gallery Walk / Showcasing:</strong> Perwakilan kelompok mempresentasikan karya dengan ceria, dilanjutkan dengan apresiasi dan masukan konstruktif dari kelompok lain (peer feedback).</li>
                                <li><strong>Meaningful Reflection:</strong> Peserta didik mengisi jurnal refleksi singkat <em>"Apa hal paling berharga yang saya pelajari hari ini?"</em>.</li>
                                <li><strong>Closing & Appreciation:</strong> Guru memberikan penguatan positif, merayakan pencapaian belajar hari ini, dan menutup dengan doa bersama.</li>
                            </ul>
                        </td>
                        <td style="text-align:center; padding:8px;">15 Menit</td>
                    </tr>
                </tbody>
            </table>

            <!-- IV. ASESMEN PEMBELAJARAN -->
            <h3 style="font-size:11pt; border-bottom:1.5px solid #000; padding-bottom:3px; margin-top:25px; text-transform:uppercase;">IV. ASESMEN PEMBELAJARAN (ASSESSMENT FOR, AS, & OF LEARNING)</h3>
            <ol style="margin:5px 0 15px 0; padding-left:25px; font-size:10pt;">
                <li><strong>Asesmen Diagnostik (Awal):</strong> Pertanyaan lisan/kuis singkat readiness sebelum materi dimulai.</li>
                <li><strong>Asesmen Formatif (Proses):</strong> Observasi unjuk kerja kelompok, keaktifan penalaran, dan partisipasi kognitif saat diskusi.</li>
                <li><strong>Asesmen Sumatif (Akhir):</strong> Penilaian hasil produk/proyek atau tes pemahaman konsep kontekstual.</li>
            </ol>

            <!-- TANDA TANGAN DOKUMEN -->
            <div style="margin-top:45px;">
                <table style="width:100%; text-align:center; font-size:10pt; border-collapse:collapse; border:none !important;">
                    <tr>
                        <td style="width:50%; vertical-align:top; border:none !important;">
                            <div>Mengetahui,</div>
                            <strong>Kepala Sekolah</strong>
                            <div style="height:80px;"></div>
                            <strong style="text-decoration:underline;">${escapeHtml(d.namaKepsek)}</strong>
                        </td>
                        <td style="width:50%; vertical-align:top; border:none !important;">
                            <div>Jakarta, ${todayStr}</div>
                            <strong>Guru Mata Pelajaran</strong>
                            <div style="height:80px;"></div>
                            <strong style="text-decoration:underline;">${escapeHtml(d.namaGuru)}</strong>
                        </td>
                    </tr>
                </table>
            </div>
        </div>
    `;
}

function renderProtaPromesDocument(d) {
    return `
        <div class="perangkat-document-paper" style="background:#ffffff; color:#000000; padding:25px; border-radius:8px; font-family:'Times New Roman', serif; line-height:1.6;">
            <div style="text-align:center; border-bottom:2px solid #000; padding-bottom:10px; margin-bottom:20px;">
                <h3 style="margin:0; text-transform:uppercase; font-size:14pt;">PROGRAM TAHUNAN (PROTA) & PROGRAM SEMESTER (PROMES)</h3>
                <h4 style="margin:5px 0 0 0; font-size:12pt; font-weight:normal;">PEMBELAJARAN MENDALAM • ${escapeHtml(d.mapel)}</h4>
            </div>

            <h4 style="font-size:11pt; border-bottom:1px solid #000; padding-bottom:4px;">Program Tahunan (Prota) TP ${escapeHtml(d.tpTahun)}</h4>
            <table style="width:100%; border-collapse:collapse; font-size:9.5pt; margin-top:10px; text-align:left;" border="1">
                <thead>
                    <tr style="background:#f1f5f9; text-align:center; font-weight:bold;">
                        <th style="padding:6px; width:40px;">Smt</th>
                        <th style="padding:6px;">Elemen / Materi Pokok Pembelajaran Mendalam</th>
                        <th style="padding:6px; width:110px;">Alokasi Waktu</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="text-align:center; padding:6px;">1</td>
                        <td style="padding:6px;"><strong>${escapeHtml(d.elemenMateri)}</strong> (Pemahaman Konsep & Application)</td>
                        <td style="text-align:center; padding:6px;">12 JP</td>
                    </tr>
                    <tr>
                        <td style="text-align:center; padding:6px;">1</td>
                        <td style="padding:6px;">Pengembangan Proyek Kontekstual & Problem Solving</td>
                        <td style="text-align:center; padding:6px;">12 JP</td>
                    </tr>
                    <tr>
                        <td style="text-align:center; padding:6px;">2</td>
                        <td style="padding:6px;">Eksplorasi Tingkat Lanjut & Integrasi Kehidupan Nyata</td>
                        <td style="text-align:center; padding:6px;">16 JP</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
}

function renderAsesmenDocument(d) {
    return `
        <div class="perangkat-document-paper" style="background:#ffffff; color:#000000; padding:25px; border-radius:8px; font-family:'Times New Roman', serif; line-height:1.6;">
            <div style="text-align:center; border-bottom:2px solid #000; padding-bottom:10px; margin-bottom:20px;">
                <h3 style="margin:0; text-transform:uppercase; font-size:14pt;">INSTRUMEN ASESMEN PEMBELAJARAN MENDALAM</h3>
                <h4 style="margin:5px 0 0 0; font-size:12pt; font-weight:normal;">DIAGNOSTIK, FORMATIF, DAN SUMATIF</h4>
            </div>

            <h4 style="font-size:11pt; border-bottom:1px solid #000; padding-bottom:4px; margin-top:10px;">1. Lembar Asesmen Diagnostik Kesiapan Belajar (Mindful Readiness)</h4>
            <p style="font-size:9.5pt;">Berikan tanda centang (✓) sesuai kondisi perasaan dan kesiapan awal kalian hari ini:</p>
            <table style="width:100%; border-collapse:collapse; font-size:9pt;" border="1">
                <tr style="background:#f8fafc; font-weight:bold; text-align:center;">
                    <td style="padding:5px;">No</td><td style="padding:5px;">Pernyataan Kesiapan Belajar</td><td style="padding:5px; width:60px;">Ya</td><td style="padding:5px; width:60px;">Ragu</td><td style="padding:5px; width:60px;">Tidak</td>
                </tr>
                <tr><td style="text-align:center; padding:5px;">1</td><td style="padding:5px;">Saya merasa fokus dan siap mengikuti pembelajaran ${escapeHtml(d.mapel)} hari ini.</td><td></td><td></td><td></td></tr>
                <tr><td style="text-align:center; padding:5px;">2</td><td style="padding:5px;">Saya sudah memiliki gambaran awal tentang materi ${escapeHtml(d.elemenMateri)}.</td><td></td><td></td><td></td></tr>
            </table>

            <h4 style="font-size:11pt; border-bottom:1px solid #000; padding-bottom:4px; margin-top:20px;">2. Jurnal Asesmen Formatif (Observasi Process & Penalaran)</h4>
            <table style="width:100%; border-collapse:collapse; font-size:9pt;" border="1">
                <tr style="background:#f8fafc; font-weight:bold; text-align:center;">
                    <td style="padding:5px; width:35px;">No</td><td style="padding:5px;">Nama Siswa</td><td style="padding:5px;">Keaktifan Berpikiran Kritis</td><td style="padding:5px;">Kualitas Solusi Logis</td><td style="padding:5px;">Kerjasama Kelompok</td>
                </tr>
                <tr><td style="text-align:center; padding:5px;">1</td><td>...</td><td>...</td><td>...</td><td>...</td></tr>
                <tr><td style="text-align:center; padding:5px;">2</td><td>...</td><td>...</td><td>...</td><td>...</td></tr>
            </table>
        </div>
    `;
}

// -------------------------------------------------------------
// ACTIONS: PRINT, COPY, DOWNLOAD WORD
// -------------------------------------------------------------

function handlePrintPerangkat() {
    window.print();
}

function handleCopyPerangkat() {
    const activeTabContent = document.querySelector('.perangkat-tab-content[style*="display: block"]');
    if (!activeTabContent) {
        showToast('Tidak ada dokumen perangkat yang aktif untuk disalin.', 'warning');
        return;
    }

    const textToCopy = activeTabContent.innerText;
    navigator.clipboard.writeText(textToCopy).then(() => {
        showToast('📋 Berhasil menyalin isi dokumen perangkat ke clipboard!', 'success');
    }).catch(err => {
        console.error('Failed to copy text:', err);
        showToast('Gagal menyalin teks.', 'error');
    });
}

function handleDownloadPerangkatWord() {
    const activeTabContent = document.querySelector('.perangkat-tab-content[style*="display: block"]');
    if (!activeTabContent) {
        showToast('Tidak ada dokumen yang aktif untuk diunduh.', 'warning');
        return;
    }

    const mapel = document.getElementById('ppMapel').value.trim() || 'Perangkat_Pembelajaran';
    const filename = `Perangkat_DeepLearning_${mapel.replace(/\s+/g, '_')}.doc`;

    const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Perangkat Pembelajaran</title>
        <style>
            body { font-family: 'Times New Roman', serif; margin: 2cm; line-height: 1.5; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #000; padding: 6px; }
        </style>
        </head>
        <body>
            ${activeTabContent.innerHTML}
        </body>
        </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], {
        type: 'application/msword'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`📄 Berhasil mengunduh dokumen MS Word (${filename})!`, 'success');
}

function handleResetPerangkat() {
    document.getElementById('ppMapel').value = '';
    document.getElementById('ppElemenMateri').value = '';
    document.getElementById('ppCpRingkas').value = '';
    document.getElementById('ppResultCard').style.display = 'none';
    showToast('Form perangkat pembelajaran telah direset.', 'info');
}
