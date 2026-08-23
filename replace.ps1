$html = Get-Content -Path 'index.html' -Raw
$newPanel = Get-Content -Path 'temp_panel.html' -Raw
$startStr = "<!-- PANEL: PENGAJUAN IZIN SISWA (SISWA ONLY) -->"
$endStr = "<!-- PANEL: APPROVAL IZIN SISWA (GURU / WALAS / ADMIN / KEPSEK) -->"
$startIdx = $html.IndexOf($startStr)
$endIdx = $html.IndexOf($endStr)
if ($startIdx -ge 0 -and $endIdx -ge 0) {
    $html = $html.Substring(0, $startIdx) + $newPanel + "

            " + $html.Substring($endIdx)
    Set-Content -Path 'index.html' -Value $html -NoNewline
    Write-Host "Replaced successfully!"
} else {
    Write-Host "Indices not found: start $startIdx, end $endIdx"
}
