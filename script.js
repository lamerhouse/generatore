document.addEventListener('DOMContentLoaded', () => {
    const inputText = document.getElementById('input-text');
    const outputText = document.getElementById('output-text');
    const copyBtn = document.getElementById('copy-btn');
    const statusMsg = document.getElementById('status-msg');
    
    const checkUppercase = document.getElementById('uppercase-mode');
    const checkBorder = document.getElementById('border-mode');
    const checkBlock = document.getElementById('block-mode');

    // C64 is 40 columns wide
    const SCREEN_WIDTH = 40;

    function processText() {
        let text = inputText.value;
        
        // 1. Convert to Uppercase if requested
        if (checkUppercase.checked) {
            text = text.toUpperCase();
        }

        // 2. Block Simulation (Simple mapping to heavier Unicode characters if requested)
        if (checkBlock.checked) {
            text = simulateBlocks(text);
        }

        // 3. Wrap Text and Apply Border
        const hasBorder = checkBorder.checked;
        const contentWidth = hasBorder ? SCREEN_WIDTH - 2 : SCREEN_WIDTH;
        
        const lines = wrapText(text, contentWidth);
        const formatted = formatOutput(lines, hasBorder, contentWidth);

        outputText.value = formatted;
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
        // Using heavy borders to simulate the "heavy" C64 look
        const TL = '▛'; // Top Left
        const TR = '▜'; // Top Right
        const BL = '▙'; // Bottom Left
        const BR = '▟'; // Bottom Right
        const H  = '▀'; // Horizontal Top
        const H_B = '▄'; // Horizontal Bottom
        const V  = '▌'; // Vertical Left (and Right mirrored mentally, or just block)
        // Let's use standard box drawing for better compatibility across systems
        // user asked for "heavy blocks"
        
        const borderChars = {
            tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║'
        };

        // If "Block Mode" is on, maybe use solid blocks?
        // Let's stick to the double line box drawing as it looks "retro" and "heavy"
        
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

        // Fill remaining height if we wanted a fixed screen, but dynamic is better for copy/paste
        
        if (hasBorder) {
            output += borderChars.bl + borderChars.h.repeat(width) + borderChars.br;
        }

        return output;
    }

    function simulateBlocks(text) {
        // Map standard ASCII to Fullwidth or similar "Blocky" Unicode
        // Fullwidth forms (U+FF01 to U+FF5E) correspond to ASCII U+0021 to U+007E
        // Shift is 0xFEE0
        
        let result = "";
        for (let i = 0; i < text.length; i++) {
            let code = text.charCodeAt(i);
            // Convert ASCII space to Fullwidth Space (U+3000) or keep normal? 
            // Normal space is better for wrapping algorithms usually, but for "Blocky" look:
            
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
