const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, 'index.html');
let html = fs.readFileSync(target, 'utf-8');

// The marker where we can insert the new tab content
// It should be right after the </div> of tab-tidakhadir
// Let's find <!-- ===================================== -->
// <!-- TAB 2: IZIN TIDAK HADIR / SAKIT       -->
// And its closing.

// Better way: parse out the riwayat blocks
const kbmStart = html.indexOf('<!-- RIWAYAT IZIN KBM -->');
let kbmEnd = html.indexOf('</div>\n                        </div>\n                    </div>\n\n                    <!-- ===================================== -->\n                    <!-- TAB 2: IZIN TIDAK HADIR / SAKIT       -->');
if (kbmEnd === -1) {
    kbmEnd = html.indexOf('</div>\n                        </div>\n                    </div>\n\n                    <!-- ===================================== -->');
}

// Just slice it manually with careful indices. We know the history block starts at `<!-- RIWAYAT IZIN KBM -->`
// The glass-card of it ends when its flex container and card ends.

function extractBlock(htmlStr, startMarker) {
    const startIndex = htmlStr.indexOf(startMarker);
    if (startIndex === -1) return null;

    // find the matching closing div for the glass-card
    let pos = startIndex;
    let divCount = 0;
    let started = false;
    let endIndex = pos;

    while (pos < htmlStr.length) {
        if (htmlStr.startsWith('<div', pos)) {
            divCount++;
            started = true;
        } else if (htmlStr.startsWith('</div', pos)) {
            divCount--;
        }

        if (started && divCount === 0) {
            endIndex = pos + 6; // length of </div>
            break;
        }
        pos++;
    }

    return {
        content: htmlStr.substring(startIndex, endIndex),
        startIndex,
        endIndex
    };
}

const kbmBlock = extractBlock(html, '<!-- RIWAYAT IZIN KBM -->');
const thBlock = extractBlock(html, '<!-- RIWAYAT PENGAKUAN IZIN -->') || extractBlock(html, '<!-- RIWAYAT IZIN TIDAK HADIR -->') || extractBlock(html, '<!-- RIWAYAT IZIN SAKIT -->');

// Let's find exactly the TH riwayat marker!
const thMarkerRegex = /<!-- RIWAYAT.*?IZIN.*?-->/;
const thMatch = html.match(thMarkerRegex);

console.log("KBM Block found:", !!kbmBlock);
if (thBlock) console.log("TH Block found:", !!thBlock);

// Instead of automated full replacement, let's just log the findings and write back if successful.
if (kbmBlock && thBlock) {
    // 1. Remove them from original string (remove from bottom up to preserve indices)
    html = html.substring(0, thBlock.startIndex) + html.substring(thBlock.endIndex);
    html = html.substring(0, kbmBlock.startIndex) + html.substring(kbmBlock.endIndex);

    // 2. Insert the new tab after the end of tab-tidakhadir
    const tab2EndMarker = '<!-- MODAL/DIALOG -->'; // Wait, it's safer to find the end of tab-tidakhadir

    const tabRiwayatHTML = `
                    <!-- ========================== -->
                    <!-- TAB 3: RIWAYAT PENGAJUAN   -->
                    <!-- ========================== -->
                    <div id="tab-riwayat" class="izin-siswa-tab-content" style="display: none;">
                        <div style="display: flex; flex-direction: column; gap: 24px; max-width: 900px; margin: 0 auto;">
                            \${kbmBlock.content}
                            \${thBlock.content}
                        </div>
                    </div>
`;
    // We can insert this right before <!-- PANEL: REKAP SISWA -->
    const panelRekapMarker = '<!-- PANEL: REKAP SISWA -->';
    if (html.includes(panelRekapMarker)) {
        html = html.replace(panelRekapMarker, tabRiwayatHTML + '\n            ' + panelRekapMarker);

        // Also remove the .izin-siswa-content-grid classes from tab-kbm and tab-tidakhadir since they are now single column centered
        html = html.replace(
            /<div class="izin-siswa-content-grid"\\s+style="gap: 22px; align-items: start;">/g,
            '<div style="max-width: 700px; margin: 0 auto;">'
        );
        html = html.replace(
            /<div class="izin-siswa-content-grid"\\s+style="display: grid; grid-template-columns: 1fr; gap: 22px; align-items: start;">/g,
            '<div style="max-width: 700px; margin: 0 auto;">'
        );
        html = html.replace(
            /<div class="izin-siswa-content-grid"\\s*style="gap: 22px; align-items: start;">/g,
            '<div style="max-width: 700px; margin: 0 auto;">'
        );
        html = html.replace(/<div class="izin-siswa-content-grid"\\s*style="[^"]*">/g, '<div style="max-width: 700px; margin: 0 auto;">');

        fs.writeFileSync(target, html);
        console.log("Successfully wrote updated HTML.");
    } else {
        console.log("panelRekapMarker not found.");
    }
} else {
    // Try to find the exact name of the TH history block marker
    console.log("Match for TH:", html.match(/<!-- RIWAYAT.*?-->/g));
}
