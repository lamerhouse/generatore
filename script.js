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
    const imgUpload = document.getElementById('img-upload');

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
                const ascii = convertImageToAscii(img);
                inputText.value = ""; // Clear input text as we are using image mode
                outputText.value = ascii;
                showStatus("IMMAGINE CONVERTITA! READY.");
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    function convertImageToAscii(img) {
        // We use a canvas to read pixel data
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const hasBorder = checkBorder.checked;
        const width = hasBorder ? SCREEN_WIDTH - 2 : SCREEN_WIDTH;
        
        // We use 1x2 block characters (Upper Half Block ▀)
        // So vertical resolution is double the character rows.
        // We want final aspect ratio to be roughly correct.
        // C64 pixels are roughly square-ish (wide pixels).
        // Char aspect ratio is approx 1:1 in our grid (VT323).
        // Using ▀ means 1 char = 2 vertical pixels.
        // So we need height = width * (imgHeight/imgWidth).
        // But since we pack 2 vertical pixels into 1 char, we resize height to 2 * rows.
        
        // Let's fix width to 'width' columns.
        const scale = width / img.width;
        // Aspect ratio correction: Text chars are usually higher than wide (e.g. 8x16 or 10x20).
        // But in VT323 they are roughly 0.6 aspect?
        // Let's assume 1:1 for simplicity or adjust.
        // Standard ASCII art correction is often 0.5 width.
        // But here we use Block Elements which are square-ish.
        
        const canvasWidth = width;
        // We map 2 vertical pixels to 1 char.
        // So canvas height should be even number ideally.
        const canvasHeight = Math.floor(canvasWidth * (img.height / img.width)); 
        
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
        const data = ctx.getImageData(0, 0, canvasWidth, canvasHeight).data;
        
        let output = "";
        
        // Border Top
        const borderChars = { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' };
        if (hasBorder) {
            output += borderChars.tl + borderChars.h.repeat(width) + borderChars.tr + "\n";
        }

        // Process 2 rows at a time
        for (let y = 0; y < canvasHeight; y += 2) {
            if (hasBorder) output += borderChars.v;
            
            for (let x = 0; x < canvasWidth; x++) {
                // Get pixel (x, y) - Top Half
                const i1 = (y * canvasWidth + x) * 4;
                const r1 = data[i1], g1 = data[i1+1], b1 = data[i1+2];
                const bri1 = (r1 + g1 + b1) / 3;
                
                // Get pixel (x, y+1) - Bottom Half
                let bri2 = 0;
                if (y + 1 < canvasHeight) {
                    const i2 = ((y + 1) * canvasWidth + x) * 4;
                    const r2 = data[i2], g2 = data[i2+1], b2 = data[i2+2];
                    bri2 = (r2 + g2 + b2) / 3;
                }
                
                // Threshold for black/white (Simple monochrome)
                // C64 is high contrast.
                const threshold = 128;
                const top = bri1 > threshold;
                const bottom = bri2 > threshold;
                
                // Construct char
                // Top=1, Bot=1 -> Full Block █
                // Top=1, Bot=0 -> Upper Block ▀
                // Top=0, Bot=1 -> Lower Block ▄
                // Top=0, Bot=0 -> Space
                
                if (top && bottom) output += "█";
                else if (top && !bottom) output += "▀";
                else if (!top && bottom) output += "▄";
                else output += " ";
            }
            
            if (hasBorder) output += borderChars.v + "\n";
            else output += "\n";
        }

        // Border Bottom
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
        if (checkUppercase.checked || checkBigText.checked || checkFourCol.checked || checkAsciiOutline.checked) {
            text = text.toUpperCase();
        }

        let formatted = "";

        if (checkBigText.checked || checkFourCol.checked || checkAsciiOutline.checked) {
            // Big Text Mode
            formatted = generateBigText(text);
        } else {
            // Standard Mode
            
            // Block Simulation
            if (checkBlock.checked) {
                text = simulateBlocks(text);
            }

            // Wrap and Border
            const hasBorder = checkBorder.checked;
            const contentWidth = hasBorder ? SCREEN_WIDTH - 2 : SCREEN_WIDTH;
            
            const lines = wrapText(text, contentWidth);
            formatted = formatOutput(lines, hasBorder, contentWidth);
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

    function generateBigText(text) {
        // We need to wrap words so they fit in 40 columns (SCREEN_WIDTH)
        // Each character is 3 columns wide + 1 spacing = 4 columns approx.
        // Actually, let's treat the big chars as blocks.
        
        const hasBorder = checkBorder.checked;
        const availableWidth = hasBorder ? SCREEN_WIDTH - 2 : SCREEN_WIDTH;
        const charWidth = checkFourCol.checked ? 4 : 3;
        const letterSpacing = checkFourCol.checked ? 0 : 1;
        
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
        const borderChars = { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' };

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
                    if (checkAsciiOutline.checked) {
                        bigLine1 += toAsciiOutline(r0);
                        bigLine2 += toAsciiOutline(r1);
                        bigLine3 += toAsciiOutline(r2);
                    } else if (checkFourCol.checked) {
                        const fill = /[A-Z0-9]/.test(char) ? char : 'X';
                        bigLine1 += toAlphaNumeric(r0, fill);
                        bigLine2 += toAlphaNumeric(r1, fill);
                        bigLine3 += toAlphaNumeric(r2, fill);
                    } else {
                        bigLine1 += r0;
                        bigLine2 += r1;
                        bigLine3 += r2;
                    }

                    // Add spacing between letters (1 column)
                    if (i < word.length - 1 && letterSpacing > 0) { 
                         const sp = " ".repeat(letterSpacing);
                         bigLine1 += sp;
                         bigLine2 += sp;
                         bigLine3 += sp;
                    }
                }
            });

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

    function formatOutput(lines, hasBorder, width) {
        // PETSCII-like Box Drawing Characters
        const borderChars = {
            tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║'
        };

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
    checkBorder.addEventListener('change', processText);
    checkBlock.addEventListener('change', processText);
    checkBigText.addEventListener('change', processText);
    checkCenter.addEventListener('change', processText);
    checkFourCol.addEventListener('change', processText);
    checkAsciiOutline.addEventListener('change', processText);

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
