document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const elements = {
        input: document.getElementById('input-text'),
        output: document.getElementById('output-text'),
        copyBtn: document.getElementById('copy-btn'),
        statusMsg: document.getElementById('status-msg'),
        statusIndicator: document.querySelector('.status-indicator'),
        imgUpload: document.getElementById('img-upload'),
        imgAsciiStyle: document.getElementById('img-ascii-style'),
        settings: {
            uppercase: document.getElementById('uppercase-mode'),
            border: document.getElementById('border-mode'),
            block: document.getElementById('block-mode'),
            bigText: document.getElementById('big-text-mode'),
            center: document.getElementById('center-mode'),
            fourCol: document.getElementById('four-col-mode'),
            asciiOutline: document.getElementById('ascii-outline-mode'),
            bbs: document.getElementById('bbs-mode')
        }
    };

    let lastImage = null;
    let isProcessing = false;

    // C64 is 40 columns wide
    const SCREEN_WIDTH = 40;

    // --- Big Font Definition (3x3 blocks) ---
    // Uses C64/Block elements: ▄ ▀ █ ▌ ▐
    const C64_BIG_FONT = {
        'A': ["▄▀▄", "█▀█", "▀ ▀"],
        'B': ["█▀▄", "█▀▄", "▀▀ "],
        'C': ["▄▀▀", "█  ", "▀▄▄"],
        'D': ["█▀▄", "█ █", "▀▀ "],
        'E': ["█▀▀", "█▀▀", "▀▀▀"],
        'F': ["█▀▀", "█▀▀", "▀  "],
        'G': ["▄▀▀", "█ █", "▀▄█"],
        'H': ["█ █", "█▀█", "▀ ▀"],
        'I': [" █ ", " █ ", " ▀ "],
        'J': ["  █", "  █", "▀▀ "],
        'K': ["█▄ ", "█▀▄", "▀ ▀"],
        'L': ["█  ", "█  ", "▀▀▀"],
        'M': ["█▀█", "█ █", "▀ ▀"],
        'N': ["█▀█", "█ █", "▀ ▀"],
        'O': ["▄▀▄", "█ █", "▀▄▀"],
        'P': ["█▀▄", "█▀▀", "▀  "],
        'Q': ["▄▀▄", "█ █", "▀▄█"],
        'R': ["█▀▄", "█▀▄", "▀ ▀"],
        'S': ["▄▀▀", "▀▄▄", "▄▄▀"],
        'T': ["▀█▀", " █ ", " ▀ "],
        'U': ["█ █", "█ █", "▀▀▀"],
        'V': ["█ █", "█ █", " ▀ "],
        'W': ["█ █", "█ █", "▀▄▀"],
        'X': ["▀▄▀", " █ ", "▄▀▄"],
        'Y': ["█ █", " █ ", " ▀ "],
        'Z': ["▀▀█", " ▄▀", "█▄▄"],
        '0': ["▄▀▄", "█ █", "▀▄▀"],
        '1': [" ▄ ", " █ ", " ▀ "],
        '2': ["▀▀█", "▄▀ ", "▀▀▀"],
        '3': ["▀▀█", " ▄█", "▀▀ "],
        '4': ["█ █", "▀▀█", "  ▀"],
        '5': ["█▀▀", "▀▄▄", "▄▄▀"],
        '6': ["▄▀ ", "█▀▄", "▀▄▀"],
        '7': ["▀▀█", "  █", "  ▀"],
        '8': ["▄▀▄", "█▀█", "▀▄▀"],
        '9': ["▄▀▄", "▀▄█", " ▀ "],
        ' ': ["   ", "   ", "   "],
        '.': ["   ", "   ", " ▀ "],
        '!': [" █ ", " █ ", " ▀ "],
        '?': ["▀▀█", " ▄▀", " ▀ "],
        '-': ["   ", "▀▀▀", "   "],
        '+': [" █ ", "▀█▀", " ▀ "],
        '=': ["   ", "▀▀▀", "▀▀▀"],
        '*': ["▄▀▄", " █ ", "▀▄▀"],
        // Fallback for others handled dynamically or replaced by '?'
    };

    // --- Utilities ---

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function showStatus(msg, type = 'info') {
        elements.statusMsg.textContent = msg;
        elements.statusMsg.style.opacity = '1';

        // Update indicator logic
        if (type === 'processing') {
            elements.statusIndicator.style.backgroundColor = '#ffff00'; // Yellow
            elements.statusIndicator.style.boxShadow = '0 0 5px #ffff00';
        } else if (type === 'error') {
            elements.statusIndicator.style.backgroundColor = '#ff0000'; // Red
            elements.statusIndicator.style.boxShadow = '0 0 5px #ff0000';
            setTimeout(() => resetStatus(), 3000);
        } else {
            // Success/Ready
            elements.statusIndicator.style.backgroundColor = '#00ff00'; // Green
            elements.statusIndicator.style.boxShadow = '0 0 5px #00ff00';
            setTimeout(() => {
                elements.statusMsg.textContent = 'READY.';
            }, 2000);
        }
    }

    function resetStatus() {
        elements.statusIndicator.style.backgroundColor = '#00ff00';
        elements.statusIndicator.style.boxShadow = '0 0 5px #00ff00';
        elements.statusMsg.textContent = 'READY.';
    }

    // --- Core Logic ---

    // Optimized: Replaces repetitive string concatenation with array join where appropriate
    function getBorderChars(isBbs) {
        return isBbs
            ? { tl: '+', tr: '+', bl: '+', br: '+', h: '-', v: '|' }
            : { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' };
    }

    function processText() {
        if (isProcessing) return;
        isProcessing = true;
        showStatus("PROCESSING...", 'processing');

        // Use requestAnimationFrame to prevent UI locking
        requestAnimationFrame(() => {
            try {
                let text = elements.input.value;
                const config = {
                    uppercase: elements.settings.uppercase.checked,
                    border: elements.settings.border.checked,
                    block: elements.settings.block.checked,
                    bigText: elements.settings.bigText.checked,
                    center: elements.settings.center.checked,
                    fourCol: elements.settings.fourCol.checked,
                    asciiOutline: elements.settings.asciiOutline.checked,
                    bbs: elements.settings.bbs.checked
                };

                // Force Uppercase if needed
                if (config.uppercase || config.bigText || config.fourCol || config.asciiOutline || config.bbs) {
                    text = text.toUpperCase();
                }

                let formatted = "";

                if (config.bigText || config.fourCol || config.asciiOutline) {
                    formatted = generateBigText(text, config);
                } else {
                    if (config.block && !config.bbs) {
                        text = simulateBlocks(text);
                    }
                    const contentWidth = config.border ? SCREEN_WIDTH - 2 : SCREEN_WIDTH;
                    const lines = wrapText(text, contentWidth);
                    formatted = formatOutput(lines, config.border, contentWidth, config.bbs);
                }

                elements.output.value = formatted;
                showStatus("READY.");
            } catch (e) {
                console.error(e);
                showStatus("ERROR IN PROCESSING", 'error');
            } finally {
                isProcessing = false;
            }
        });
    }

    const debouncedProcessText = debounce(processText, 50);

    function reprocessImageIfAny() {
        if (lastImage) {
            const ascii = convertImageToAscii(lastImage);
            elements.output.value = ascii;
        } else {
            debouncedProcessText();
        }
    }

    // --- Image Processing ---

    elements.imgUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        showStatus("LOADING IMAGE...", 'processing');
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                lastImage = img;
                try {
                    const ascii = convertImageToAscii(img);
                    elements.input.value = "";
                    elements.output.value = ascii;
                    showStatus("IMAGE CONVERTED! READY.");
                    // Reset input value so same file can be selected again
                    elements.imgUpload.value = '';
                } catch (err) {
                    console.error(err);
                    showStatus("CONVERSION ERROR", 'error');
                }
            };
            img.onerror = () => showStatus("INVALID IMAGE", 'error');
            img.src = event.target.result;
        };
        reader.onerror = () => showStatus("READ ERROR", 'error');
        reader.readAsDataURL(file);
    });

    function convertImageToAscii(img) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const config = {
            border: elements.settings.border.checked,
            style: elements.imgAsciiStyle ? elements.imgAsciiStyle.value : 'outline',
            bbs: elements.settings.bbs.checked
        };

        const width = config.border ? SCREEN_WIDTH - 2 : SCREEN_WIDTH;

        const canvasWidth = width;
        const charAspect = config.style === 'shade' ? 0.5 : 0.55;
        const canvasHeight = Math.max(1, Math.floor(canvasWidth * (img.height / img.width) * charAspect));

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
        const data = ctx.getImageData(0, 0, canvasWidth, canvasHeight).data;

        const borderChars = getBorderChars(config.bbs);
        const outputBuffer = [];

        if (config.border) {
            outputBuffer.push(borderChars.tl + borderChars.h.repeat(width) + borderChars.tr);
        }

        const rampShade = " .:-=+*#%@";
        const rampBlock = " ░▒▓█";

        const getAvg = (x, y) => {
            if (x < 0 || x >= canvasWidth || y < 0 || y >= canvasHeight) return 0;
            const cx = Math.max(0, Math.min(canvasWidth - 1, x));
            const cy = Math.max(0, Math.min(canvasHeight - 1, y));
            const i = (cy * canvasWidth + cx) * 4;
            return (data[i] + data[i + 1] + data[i + 2]) / 3;
        };

        for (let y = 0; y < canvasHeight; y++) {
            let row = config.border ? borderChars.v : "";

            for (let x = 0; x < canvasWidth; x++) {
                const idx = (y * canvasWidth + x) * 4;
                const r = data[idx], g = data[idx + 1], b = data[idx + 2];
                // Simple average brightness
                const br = (r + g + b) / 3;

                if (config.style === 'shade') {
                    const id = Math.min(rampShade.length - 1, Math.floor(br / 256 * rampShade.length));
                    row += rampShade[id];
                } else if (config.style === 'blocks') {
                    const id = Math.min(rampBlock.length - 1, Math.floor(br / 256 * rampBlock.length));
                    row += rampBlock[id];
                } else {
                    // Outline / Edge detection logic
                    const il = getAvg(x - 1, y);
                    const ir = getAvg(x + 1, y);
                    const iu = getAvg(x, y - 1);
                    const idn = getAvg(x, y + 1);

                    const dx = ir - il;
                    const dy = idn - iu;
                    const mag = Math.sqrt(dx * dx + dy * dy);

                    const t1 = 25, t2 = 60;
                    if (mag < t1) row += " ";
                    else if (mag < t2) row += ".";
                    else {
                        const ang = Math.atan2(dy, dx);
                        const a = Math.abs(ang);
                        if (Math.abs(a - Math.PI / 2) < Math.PI / 8) row += "|";
                        else if (ang > 0 && a >= Math.PI / 8 && a <= 3 * Math.PI / 8) row += "/";
                        else if (ang < 0 && a >= Math.PI / 8 && a <= 3 * Math.PI / 8) row += "\\";
                        else row += "-";
                    }
                }
            }

            if (config.border) row += borderChars.v;
            outputBuffer.push(row);
        }

        if (config.border) {
            outputBuffer.push(borderChars.bl + borderChars.h.repeat(width) + borderChars.br);
        }

        return outputBuffer.join("\n");
    }

    // --- Big Text Helper ---

    function generateBigText(text, config) {
        // BBS Mode: 4 columns strict, Block fill, Professional alignment
        const isBbsPro = config.bbs;
        const charWidth = (config.fourCol || isBbsPro) ? 4 : 3;
        const letterSpacing = 1;

        const hasBorder = config.border;
        const availableWidth = hasBorder ? SCREEN_WIDTH - 2 : SCREEN_WIDTH;

        const lines = [];
        const words = text.split(/(\s+)/);
        let currentLineWords = [];
        let currentLineWidth = 0;

        words.forEach(word => {
            let wordWidth = 0;
            for (let j = 0; j < word.length; j++) {
                wordWidth += charWidth;
                if (j < word.length - 1) wordWidth += letterSpacing;
            }

            if (currentLineWidth + wordWidth > availableWidth && currentLineWidth > 0) {
                lines.push(currentLineWords);
                currentLineWords = [];
                currentLineWidth = 0;
            }

            currentLineWords.push(word);
            currentLineWidth += wordWidth;
        });

        if (currentLineWords.length > 0) lines.push(currentLineWords);

        const borderChars = getBorderChars(isBbsPro);
        const outputBuffer = [];

        if (hasBorder) {
            outputBuffer.push(borderChars.tl + borderChars.h.repeat(availableWidth) + borderChars.tr);
        }

        lines.forEach(lineWords => {
            let bigLine1 = "", bigLine2 = "", bigLine3 = "";

            lineWords.forEach((word, wIdx) => {
                for (let i = 0; i < word.length; i++) {
                    const char = word[i];
                    const map = C64_BIG_FONT[char] || C64_BIG_FONT['?'];

                    const scale = (row) => {
                        if (charWidth === 3) return row;

                        // BBS Pro: Symmetric stretch (0, 1, 1, 2)
                        if (isBbsPro) {
                            return row[0] + row[1] + row[1] + row[2];
                        }
                        // Default 4-col
                        let out = "";
                        for (let k = 0; k < 4; k++) out += row[Math.floor(k * 3 / 4)];
                        return out;
                    };

                    const fillFn = (row) => {
                        if (!isBbsPro) return row;
                        return row;
                    };

                    let r0 = scale(map[0]);
                    let r1 = scale(map[1]);
                    let r2 = scale(map[2]);

                    // Old 4-col logic: only use fill if NOT isBbsPro (since BbsPro keeps shapes but scales)
                    if (config.fourCol && !isBbsPro) {
                        const fill = /[A-Z0-9]/.test(char) ? char : 'X';
                        const toFill = (r, f) => {
                            let o = "";
                            for (let k = 0; k < r.length; k++) o += (r[k] === ' ') ? ' ' : f;
                            return o;
                        };
                        r0 = toFill(r0, fill);
                        r1 = toFill(r1, fill);
                        r2 = toFill(r2, fill);
                    }

                    bigLine1 += r0;
                    bigLine2 += r1;
                    bigLine3 += r2;

                    if (i < word.length - 1 && letterSpacing > 0) {
                        const sp = " ".repeat(letterSpacing);
                        bigLine1 += sp; bigLine2 += sp; bigLine3 += sp;
                    }
                }

                if (wIdx < lineWords.length - 1) {
                    const sp = " ".repeat(charWidth);
                    bigLine1 += sp; bigLine2 += sp; bigLine3 += sp;
                }
            });

            if (config.asciiOutline && !isBbsPro) {
                const outlined = outlineRows([bigLine1, bigLine2, bigLine3]);
                bigLine1 = outlined[0]; bigLine2 = outlined[1]; bigLine3 = outlined[2];
            }

            [bigLine1, bigLine2, bigLine3].forEach(row => {
                let rowStr = row.substring(0, availableWidth);

                if (config.center) {
                    const padding = availableWidth - rowStr.length;
                    if (padding > 0) {
                        const l = Math.floor(padding / 2);
                        const r = padding - l;
                        rowStr = " ".repeat(l) + rowStr + " ".repeat(r);
                    }
                } else {
                    rowStr = rowStr.padEnd(availableWidth, " ");
                }

                outputBuffer.push(config.border ? borderChars.v + rowStr + borderChars.v : rowStr);
            });

            if (hasBorder) {
                // Optimization: vertical spacing is good for readability
                // BBS Pro: maybe compact? Let's stick to standard.
                outputBuffer.push(borderChars.v + " ".repeat(availableWidth) + borderChars.v);
            } else {
                outputBuffer.push("");
            }
        });

        if (config.border) {
            outputBuffer.push(borderChars.bl + borderChars.h.repeat(availableWidth) + borderChars.br);
        }

        return outputBuffer.join("\n");
    }

    function outlineRows(rows) {
        // Optimized Outline Logic
        const h = rows.length;
        const w = rows[0].length;
        // Pre-compute boolean grid for speed
        const grid = rows.map(r => r.split('').map(c => c !== ' '));
        const out = [];

        for (let r = 0; r < h; r++) {
            let rowStr = "";
            for (let c = 0; c < w; c++) {
                if (!grid[r][c]) {
                    rowStr += " ";
                    continue;
                }
                const left = c > 0 ? grid[r][c - 1] : false;
                const right = c + 1 < w ? grid[r][c + 1] : false;
                const up = r > 0 ? grid[r - 1][c] : false;
                const down = r + 1 < h ? grid[r + 1][c] : false;

                const horiz = !left || !right;
                const vert = !up || !down;

                if (horiz && vert) rowStr += "+";
                else if (horiz) rowStr += "-";
                else if (vert) rowStr += "|";
                else rowStr += ".";
            }
            out.push(rowStr);
        }
        return out;
    }

    // --- Standard Text Helper ---
    function wrapText(text, width) {
        if (!text) return [];
        const lines = [];
        const inputLines = text.split('\n');

        inputLines.forEach(line => {
            if (line.length <= width) {
                lines.push(line);
                return;
            }
            // Hard wrapping
            let current = "";
            const words = line.split(/(\s+)/); // Preserve spaces
            words.forEach(word => {
                if ((current + word).length > width) {
                    if (word.length > width) {
                        // Word larger than line, force break
                        if (current) lines.push(current);
                        current = "";
                        for (let i = 0; i < word.length; i += width) {
                            const chunk = word.substring(i, i + width);
                            if (chunk.length === width) lines.push(chunk);
                            else current = chunk;
                        }
                    } else {
                        lines.push(current);
                        current = word;
                    }
                } else {
                    current += word;
                }
            });
            if (current) lines.push(current);
        });
        return lines;
    }

    function formatOutput(lines, hasBorder, width, isBbs) {
        const borderChars = getBorderChars(isBbs);
        const outputBuffer = [];

        if (hasBorder) {
            outputBuffer.push(borderChars.tl + borderChars.h.repeat(width) + borderChars.tr);
        }

        lines.forEach(line => {
            const padded = line.padEnd(width, " ");
            if (hasBorder) outputBuffer.push(borderChars.v + padded + borderChars.v);
            else outputBuffer.push(padded);
        });

        if (hasBorder) {
            outputBuffer.push(borderChars.bl + borderChars.h.repeat(width) + borderChars.br);
        }
        return outputBuffer.join("\n");
    }

    function simulateBlocks(text) {
        return text.split('').map(char => {
            const code = char.charCodeAt(0);
            if (code >= 33 && code <= 126) return String.fromCharCode(code + 0xFEE0);
            if (code === 32) return " ";
            return char;
        }).join('');
    }

    // --- Event Listeners ---

    // Use debounced version for text input
    elements.input.addEventListener('input', debouncedProcessText);

    // Immediate updates for settings to feel snappy, but still debounced slightly if complex
    // If we prefer immediate feedback for toggles, we can call processText direct, 
    // but debounced is safer if the function gets heavy. 
    // Let's use debounced for consistency.
    Object.values(elements.settings).forEach(el => {
        el.addEventListener('change', () => {
            if (lastImage) reprocessImageIfAny();
            else processText(); // Toggles should be immediate
        });
    });

    if (elements.imgAsciiStyle) {
        elements.imgAsciiStyle.addEventListener('change', reprocessImageIfAny);
    }

    // --- Clipboard ---
    elements.copyBtn.addEventListener('click', async () => {
        const val = elements.output.value;
        if (!val) return;

        try {
            elements.output.select();
            // Modern API
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(val);
                showStatus("COPIED TO CLIPBOARD!", 'success');
            } else {
                throw new Error("No Clipboard API");
            }
        } catch (err) {
            // Fallback
            try {
                document.execCommand('copy');
                showStatus("COPIED (FALLBACK)!", 'success');
            } catch (e) {
                showStatus("COPY FAILED", 'error');
            }
        }
    });

    // Initial Run
    processText();
});
