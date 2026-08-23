$html = Get-Content 'd:\PROJECT\absensi-baruna\index.html' -Raw -Encoding UTF8

$kbmMarker = '<!-- RIWAYAT IZIN KBM -->'
$kbmStartIndex = $html.IndexOf($kbmMarker)
# We know the block ends right before TAB 2 marker. Let's find exactly the end tab-kbm `</div>` which is before TAB 2.
$tab2Marker = '<!-- TAB 2: IZIN TIDAK HADIR / SAKIT       -->'
$tab2Index = $html.IndexOf($tab2Marker)

# We want the content between $kbmStartIndex and the third </div> counting backwards from $tab2Index
# Actually, since I have the exact line numbers: 4785 to 4826, 4917 to 4972. Wait! Let's just index strings.

$lines = Get-Content 'd:\PROJECT\absensi-baruna\index.html' -Encoding UTF8
$kbmBlock = $lines[4785..4825] -join "`n"
$thBlock = $lines[4916..4971] -join "`n"

$beforeKbm = $lines[0..4784] -join "`n"
$betweenBlocks = $lines[4826..4915] -join "`n"
$afterTh = $lines[4972..($lines.Length - 1)] -join "`n"

# Remove the .izin-siswa-content-grid grids and replace with centered single column
$beforeKbm = $beforeKbm -replace '<div class="izin-siswa-content-grid".*?>', '<div style="max-width: 800px; margin: 0 auto; width: 100%;">'
$betweenBlocks = $betweenBlocks -replace '<div class="izin-siswa-content-grid".*?>', '<div style="max-width: 800px; margin: 0 auto; width: 100%;">'

$newTab = @"
                    <!-- ========================== -->
                    <!-- TAB 3: RIWAYAT PENGAJUAN IZIN -->
                    <!-- ========================== -->
                    <div id="tab-riwayat" class="izin-siswa-tab-content" style="display: none;">
                        <div style="display: flex; flex-direction: column; gap: 24px; max-width: 900px; margin: 0 auto; width: 100%;">
$kbmBlock
$thBlock
                        </div>
                    </div>
"@

$newHtml = $beforeKbm + "`n" + $betweenBlocks + "`n" + $newTab + "`n" + $afterTh
Set-Content -Path 'd:\PROJECT\absensi-baruna\index.html' -Value $newHtml -Encoding UTF8
Write-Output "Berhasil merestrukturisasi layout tab izin siswa secara akurat!"
