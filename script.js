document.addEventListener('DOMContentLoaded', () => {
    const inputText = document.getElementById('input-text');
    const outputText = document.getElementById('output-text');
    const copyBtn = document.getElementById('copy-btn');
    const statusMsg = document.getElementById('status-msg');
    
    const checkUppercase = document.getElementById('uppercase-mode');
    const checkBorder = document.getElementById('border-mode');
    const checkBlock = document.getElementById('block-mode');
    const checkBigText = document.getElementById('big-text-mode');

    // C64 is 40 columns wide
    const SCREEN_WIDTH = 40;

    // Big Font Definition (3x3 blocks)
    // Uses C64/Block elements: ▄ ▀ █ ▌ ▐
    const C64_BIG_FONT = {
        'A': ["▄▀▄", "█▀█", "▀ ▀"],
        'B': ["█▀▄", "█▀▄", "▀▀ "],
        'C': ["▄▀▀", "█  ", "▀▄▄"],
        'D': ["█▀▄", "█ █", "▀▀ "],
        'E': ["█▀▀", "╠═ ", "▀▀▀"],
        'F': ["█▀▀", "╠═ ", "▀  "],
        'G': ["▄▀▀", "█ █", "▀▄█"],
        'H': ["█ █", "█▀█", "▀ ▀"],
        'I': [" █ ", " █ ", " ▀ "],
        'J': ["  █", "  █", "▀▀ "],
        'K': ["█▄ ", "█▀▄", "▀ ▀"],
        'L': ["█  ", "█  ", "▀▀▀"],
        'M': ["▛▀▜", "█ █", "▀ ▀"],
        'N': ["▛▀█", "█ █", "▀ ▀"],
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
        if (checkUppercase.checked || checkBigText.checked) {
            text = text.toUpperCase();
        }

        let formatted = "";

        if (checkBigText.checked) {
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

    function generateBigText(text) {
        // We need to wrap words so they fit in 40 columns (SCREEN_WIDTH)
        // Each character is 3 columns wide + 1 spacing = 4 columns approx.
        // Actually, let's treat the big chars as blocks.
        
        const hasBorder = checkBorder.checked;
        const availableWidth = hasBorder ? SCREEN_WIDTH - 2 : SCREEN_WIDTH;
        
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
            for(let char of word) {
                const map = C64_BIG_FONT[char] || C64_BIG_FONT['?'];
                // If not found, use ? or skip. Let's use ? width (3)
                const charWidth = map ? map[0].length : 3;
                wordWidth += charWidth + 1; // +1 for spacing between letters
            }
            // Remove last spacer of the word? No, keep simple.

            // Check if word fits
            if (currentLineWidth + wordWidth > availableWidth && currentLineWidth > 0) {
                // Push current line
                lines.push(currentLineWords);
                currentLineWords = [];
                currentLineWidth = 0;
            }

            // If word is massive (wider than screen), we might need to split it, 
            // but for now let's assume it fits or clips.
            
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
                    const map = C64_BIG_FONT[char] || C64_BIG_FONT[' ']; // Default to space if unknown
                    
                    // Add character parts
                    bigLine1 += map[0];
                    bigLine2 += map[1];
                    bigLine3 += map[2];

                    // Add spacing between letters (1 column)
                    // Only if it fits? 
                    // Let's add a space column
                    if (i < word.length - 1 || word === ' ') { 
                         // Don't add spacing after the last letter of a word? 
                         // Or do we? 
                         // "RIPRAGGI" -> R I P...
                         // Usually spacing is good.
                         bigLine1 += " ";
                         bigLine2 += " ";
                         bigLine3 += " ";
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
                // Pad if short
                rowStr = rowStr.padEnd(availableWidth, " ");
                
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
