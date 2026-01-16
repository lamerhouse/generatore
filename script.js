document.addEventListener('DOMContentLoaded', () => {
    const inputText = document.getElementById('input-text');
    const outputText = document.getElementById('output-text');
    const copyBtn = document.getElementById('copy-btn');
    const statusMsg = document.getElementById('status-msg');
    
    const checkUppercase = document.getElementById('uppercase-mode');
    const checkBorder = document.getElementById('border-mode');
    const checkBlock = document.getElementById('block-mode');
    const checkBigText = document.getElementById('big-text-mode');
    const checkCenter = document.getElementById('center-mode');
    const checkFourCol = document.getElementById('four-col-mode');
    const checkAsciiOutline = document.getElementById('ascii-outline-mode');
    const checkBbsMode = document.getElementById('bbs-mode');
    const imgAsciiStyle = document.getElementById('img-ascii-style');
    const imgUpload = document.getElementById('img-upload');
    let lastImage = null;

    // C64 is 40 columns wide
    const SCREEN_WIDTH = 40;

    // Image Upload Handling
    imgUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                lastImage = img;
                const ascii = convertImageToAscii(img);
                inputText.value = ""; // Clear input text as we are using image mode
                outputText.value = ascii;
                showStatus("IMMAGINE CONVERTITA! READY.");
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
    
    function reprocessImageIfAny() {
        if (lastImage) {
            const ascii = convertImageToAscii(lastImage);
            outputText.value = ascii;
        } else {
            processText();
        }
    }

    function convertImageToAscii(img) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const hasBorder = checkBorder.checked;
        const width = hasBorder ? SCREEN_WIDTH - 2 : SCREEN_WIDTH;
        const style = imgAsciiStyle ? imgAsciiStyle.value : 'outline';
        
        const canvasWidth = width;
        const charAspect = style === 'shade' ? 0.5 : 0.55;
        const canvasHeight = Math.max(1, Math.floor(canvasWidth * (img.height / img.width) * charAspect)); 
        
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
        const data = ctx.getImageData(0, 0, canvasWidth, canvasHeight).data;
        
        let output = "";
        
        const borderChars = checkBbsMode.checked 
            ? { tl: '+', tr: '+', bl: '+', br: '+', h: '-', v: '|' }
            : { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' };
        if (hasBorder) {
            output += borderChars.tl + borderChars.h.repeat(width) + borderChars.tr + "\n";
        }

        for (let y = 0; y < canvasHeight; y++) {
            if (hasBorder) output += borderChars.v;
            
            for (let x = 0; x < canvasWidth; x++) {
                const idx = (y * canvasWidth + x) * 4;
                const r = data[idx], g = data[idx+1], b = data[idx+2];
                const br = (r + g + b) / 3;
                if (style === 'shade') {
                    const ramp = " .:-=+*#%@";
                    const id = Math.min(ramp.length - 1, Math.floor(br / 256 * ramp.length));
                    output += ramp[id];
                } else if (style === 'blocks') {
                    // C64 Block style using density
                    const ramp = " ░▒▓█";
                    const id = Math.min(ramp.length - 1, Math.floor(br / 256 * ramp.length));
                    output += ramp[id];
                } else {
                    const il = (y * canvasWidth + Math.max(0, x - 1)) * 4;
                    const ir = (y * canvasWidth + Math.min(canvasWidth - 1, x + 1)) * 4;
                    const iu = (Math.max(0, y - 1) * canvasWidth + x) * 4;
                    const idn = (Math.min(canvasHeight - 1, y + 1) * canvasWidth + x) * 4;
                    const bl = (data[il] + data[il+1] + data[il+2]) / 3;
                    const brg = (data[ir] + data[ir+1] + data[ir+2]) / 3;
                    const bu = (data[iu] + data[iu+1] + data[iu+2]) / 3;
                    const bd = (data[idn] + data[idn+1] + data[idn+2]) / 3;
                    const dx = brg - bl;
                    const dy = bd - bu;
                    const mag = Math.sqrt(dx*dx + dy*dy);
                    const t1 = 25, t2 = 60;
                    if (mag < t1) output += " ";
                    else if (mag < t2) output += ".";
                    else {
                        const ang = Math.atan2(dy, dx);
                        const a = Math.abs(ang);
                        let ch = "-";
                        if (Math.abs(a - Math.PI/2) < Math.PI/8) ch = "|";
                        else if (ang > 0 && a >= Math.PI/8 && a <= 3*Math.PI/8) ch = "/";
                        else if (ang < 0 && a >= Math.PI/8 && a <= 3*Math.PI/8) ch = "\\";
                        output += ch;
                    }
                }
            }
            
            let rowEnd = "";
            if (hasBorder) rowEnd = borderChars.v + "\n"; else rowEnd = "\n";
            output += rowEnd;
        }

        if (hasBorder) {
            output += borderChars.bl + borderChars.h.repeat(width) + borderChars.br;
        }
        
        return output;
    }

    // Big Font Definition (3x3 blocks)
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
        '-': ["   ", "▀▀▀", "   "]
    };

    function processText() {
        let text = inputText.value;
        
        // 1. Force Uppercase for consistent mapping (Big Text only supports upper)
        // If big text is on, we generally want uppercase.
        if (checkUppercase.checked || checkBigText.checked || checkFourCol.checked || checkAsciiOutline.checked || checkBbsMode.checked) {
            text = text.toUpperCase();
        }

        let formatted = "";

        if (checkBigText.checked || checkFourCol.checked || checkAsciiOutline.checked) {
            // Big Text Mode (BBS Mode is now Standard ASCII only)
            formatted = generateBigText(text);
        } else {
            // Standard Mode
            
            // Block Simulation
            if (checkBlock.checked && !checkBbsMode.checked) {
                text = simulateBlocks(text);
            }

            // Wrap and Border
            const hasBorder = checkBorder.checked;
            const isBbs = checkBbsMode.checked;
            const contentWidth = hasBorder ? SCREEN_WIDTH - 2 : SCREEN_WIDTH;
            
            const lines = wrapText(text, contentWidth);
            formatted = formatOutput(lines, hasBorder, contentWidth, isBbs);
        }

        outputText.value = formatted;
    }
    
    function scaleRow(row, targetWidth) {
        const srcWidth = row.length;
        if (targetWidth === srcWidth) return row;
        let out = "";
        for (let i = 0; i < targetWidth; i++) {
            const idx = Math.floor(i * srcWidth / targetWidth);
            out += row[idx];
        }
        return out;
    }
    
    function toAlphaNumeric(row, fillChar) {
        let out = "";
        for (let i = 0; i < row.length; i++) {
            const ch = row[i];
            if (ch === ' ') out += ' ';
            else if (ch === '▀') out += '1';
            else if (ch === '▄') out += '0';
            else out += fillChar;
        }
        return out;
    }
    
    function toAlphaFill(row, fillChar) {
        let out = "";
        for (let i = 0; i < row.length; i++) {
            const ch = row[i];
            out += (ch === ' ') ? ' ' : fillChar;
        }
        return out;
    }
    
    function toAsciiOutline(row) {
        let out = "";
        for (let i = 0; i < row.length; i++) {
            const ch = row[i];
            if (ch === ' ') out += ' ';
            else if (ch === '▀') out += '-';
            else if (ch === '▄') out += '_';
            else out += '|'; // '█' -> vertical stroke
        }
        return out;
    }
    
    function outlineRows(rows) {
        const h = rows.length;
        const w = rows[0].length;
        const mask = Array.from({length: h}, (_, r) => 
            Array.from({length: w}, (_, c) => rows[r][c] !== ' ')
        );
        const out = Array.from({length: h}, () => Array(w).fill(' '));
        
        for (let r = 0; r < h; r++) {
            for (let c = 0; c < w; c++) {
                if (!mask[r][c]) continue;
                const left = c > 0 ? mask[r][c-1] : false;
                const right = c + 1 < w ? mask[r][c+1] : false;
                const up = r > 0 ? mask[r-1][c] : false;
                const down = r + 1 < h ? mask[r+1][c] : false;
                
                const horiz = !left || !right;
                const vert = !up || !down;
                
                let ch = '.';
                if (horiz && vert) ch = '+';
                else if (horiz) ch = '-';
                else if (vert) ch = '|';
                
                out[r][c] = ch;
            }
        }
        return out.map(arr => arr.join(''));
    }

    function generateBigText(text) {
        // We need to wrap words so they fit in 40 columns (SCREEN_WIDTH)
        // Each character is 3 columns wide + 1 spacing = 4 columns approx.
        // Actually, let's treat the big chars as blocks.
        
        const hasBorder = checkBorder.checked;
        const availableWidth = hasBorder ? SCREEN_WIDTH - 2 : SCREEN_WIDTH;
        const charWidth = checkFourCol.checked ? 4 : 3;
        const letterSpacing = 1;
        
        const lines = []; // Array of strings (the text lines)
        
        // Split into words to handle wrapping
        const words = text.split(/(\s+)/);
        let currentLineWords = [];
        let currentLineWidth = 0;

        words.forEach(word => {
            // Calculate width of this word in Big Font
            // Assuming 3 width per char + 1 spacer between chars
            // The spacer between words is handled by the space character itself which is width 3
            
            let wordWidth = 0;
            for(let j = 0; j < word.length; j++) {
                const char = word[j];
                const map = C64_BIG_FONT[char] || C64_BIG_FONT['?'];
                const cw = charWidth;
                wordWidth += cw;
                
                // Add spacing between chars (same as drawing logic)
                if (j < word.length - 1) {
                    wordWidth += letterSpacing;
                }
            }
            
            // Check if word fits
            if (currentLineWidth + wordWidth > availableWidth && currentLineWidth > 0) {
                // Push current line
                lines.push(currentLineWords);
                currentLineWords = [];
                currentLineWidth = 0;
            }

            currentLineWords.push(word);
            currentLineWidth += wordWidth;
        });
        
        if (currentLineWords.length > 0) {
            lines.push(currentLineWords);
        }

        // Now render each line of words
        let output = "";
        
        // Border Top
        const borderChars = checkBbsMode.checked 
            ? { tl: '+', tr: '+', bl: '+', br: '+', h: '-', v: '|' }
            : { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' };

        if (hasBorder) {
            output += borderChars.tl + borderChars.h.repeat(availableWidth) + borderChars.tr + "\n";
        }

        lines.forEach(lineWords => {
            // Each "line" of text becomes 3 lines of characters
            let bigLine1 = "";
            let bigLine2 = "";
            let bigLine3 = "";

            lineWords.forEach(word => {
                for (let i = 0; i < word.length; i++) {
                    const char = word[i];
                    const map = C64_BIG_FONT[char] || C64_BIG_FONT['?']; // Default to ? if unknown to match width calc
                    
                    // Add character parts
                    const r0 = scaleRow(map[0], charWidth);
                    const r1 = scaleRow(map[1], charWidth);
                    const r2 = scaleRow(map[2], charWidth);
                    const fill = /[A-Z0-9]/.test(char) ? char : 'X';
                    let rr0 = r0, rr1 = r1, rr2 = r2;
                    if (checkFourCol.checked || checkBbsMode.checked) {
                        const fc = checkBbsMode.checked ? fill : fill;
                        rr0 = toAlphaFill(rr0, fc);
                        rr1 = toAlphaFill(rr1, fc);
                        rr2 = toAlphaFill(rr2, fc);
                    }
                    bigLine1 += rr0;
                    bigLine2 += rr1;
                    bigLine3 += rr2;

                    // Add spacing between letters (1 column)
                    if (i < word.length - 1 && letterSpacing > 0) { 
                         const sp = " ".repeat(letterSpacing);
                         bigLine1 += sp;
                         bigLine2 += sp;
                         bigLine3 += sp;
                    }
                }
            });
            
            if (checkAsciiOutline.checked) {
                const outlined = outlineRows([bigLine1, bigLine2, bigLine3]);
                bigLine1 = outlined[0];
                bigLine2 = outlined[1];
                bigLine3 = outlined[2];
            }

            // Trim lines to fit or pad?
            // If wrapping logic was correct, they should fit.
            // But we need to pad to fill the border width if borders are on.
            
            // Helper to process a physical line
            [bigLine1, bigLine2, bigLine3].forEach(row => {
                // Truncate if too long (just in case)
                let rowStr = row.substring(0, availableWidth);
                
                // Alignment logic
                if (checkCenter.checked) {
                    // Center the string within availableWidth
                    const padding = availableWidth - rowStr.length;
                    if (padding > 0) {
                        const padLeft = Math.floor(padding / 2);
                        const padRight = padding - padLeft;
                        rowStr = " ".repeat(padLeft) + rowStr + " ".repeat(padRight);
                    }
                } else {
                    // Pad if short (Left Align)
                    rowStr = rowStr.padEnd(availableWidth, " ");
                }
                
                if (hasBorder) {
                    output += borderChars.v + rowStr + borderChars.v + "\n";
                } else {
                    output += rowStr + "\n";
                }
            });
            
            // Add a vertical gap between text lines?
            if (hasBorder) {
                 output += borderChars.v + " ".repeat(availableWidth) + borderChars.v + "\n";
            } else {
                 output += "\n";
            }
        });

        // Border Bottom
        if (hasBorder) {
            output += borderChars.bl + borderChars.h.repeat(availableWidth) + borderChars.br;
        }

        return output;
    }

    function wrapText(text, width) {
        if (!text) return [];
        
        const words = text.split(/(\s+)/); // Split keeping whitespace
        let lines = [];
        let currentLine = "";

        // Handle pre-existing newlines in input
        const inputLines = text.split('\n');
        
        // We re-process manually to ensure strict wrapping
        let processedLines = [];
        
        inputLines.forEach(line => {
            if (line.length <= width) {
                processedLines.push(line);
            } else {
                // Hard wrap logic
                let tempLine = "";
                const lineWords = line.split(/(\s+)/);
                
                lineWords.forEach(word => {
                    if ((tempLine + word).length > width) {
                        // If the word itself is longer than width, split it
                        if (word.length > width) {
                            if (tempLine) processedLines.push(tempLine);
                            // Chunk the long word
                            for (let i = 0; i < word.length; i += width) {
                                let chunk = word.substring(i, i + width);
                                if (chunk.length === width) {
                                    processedLines.push(chunk);
                                } else {
                                    tempLine = chunk;
                                }
                            }
                        } else {
                            processedLines.push(tempLine);
                            tempLine = word;
                        }
                    } else {
                        tempLine += word;
                    }
                });
                if (tempLine) processedLines.push(tempLine);
            }
        });

        return processedLines;
    }

    function formatOutput(lines, hasBorder, width, isBbs = false) {
        // PETSCII-like Box Drawing Characters
        const borderChars = isBbs
            ? { tl: '+', tr: '+', bl: '+', br: '+', h: '-', v: '|' }
            : { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' };

        let output = "";

        if (hasBorder) {
            output += borderChars.tl + borderChars.h.repeat(width) + borderChars.tr + "\n";
        }

        lines.forEach(line => {
            // Pad line to full width
            const paddedLine = line.padEnd(width, " ");
            if (hasBorder) {
                output += borderChars.v + paddedLine + borderChars.v + "\n";
            } else {
                output += paddedLine + "\n";
            }
        });

        if (hasBorder) {
            output += borderChars.bl + borderChars.h.repeat(width) + borderChars.br;
        }

        return output;
    }

    function simulateBlocks(text) {
        // Map standard ASCII to Fullwidth or similar "Blocky" Unicode
        let result = "";
        for (let i = 0; i < text.length; i++) {
            let code = text.charCodeAt(i);
            
            if (code >= 33 && code <= 126) {
                // Convert to Fullwidth
                result += String.fromCharCode(code + 0xFEE0);
            } else if (code === 32) {
                // Space
                result += " "; 
            } else {
                result += text.charAt(i);
            }
        }
        return result;
    }

    // Real-time processing
    inputText.addEventListener('input', processText);
    checkUppercase.addEventListener('change', processText);
    checkBorder.addEventListener('change', reprocessImageIfAny);
    checkBlock.addEventListener('change', processText);
    checkBigText.addEventListener('change', processText);
    checkCenter.addEventListener('change', reprocessImageIfAny);
    if (imgAsciiStyle) imgAsciiStyle.addEventListener('change', reprocessImageIfAny);
    checkFourCol.addEventListener('change', processText);
    checkAsciiOutline.addEventListener('change', processText);
    checkBbsMode.addEventListener('change', reprocessImageIfAny);

    // Initial run
    processText();

    // Copy functionality
    copyBtn.addEventListener('click', () => {
        outputText.select();
        outputText.setSelectionRange(0, 99999); // For mobile devices
        
        // Try the modern API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(outputText.value).then(() => {
                showStatus("COPIATO NEGLI APPUNTI! READY.");
            }).catch(err => {
                // Fallback if promise fails
                fallbackCopy();
            });
        } else {
            // Fallback for older browsers or file:// protocol restrictions
            fallbackCopy();
        }
    });

    function fallbackCopy() {
        try {
            document.execCommand('copy');
            showStatus("COPIATO (FALLBACK)! READY.");
        } catch (err) {
            showStatus("ERRORE COPIA MANUALE.");
        }
    }

    function showStatus(msg) {
        statusMsg.textContent = msg;
        setTimeout(() => statusMsg.textContent = "", 2000);
    }
});
