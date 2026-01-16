# C64 Text & ASCII Generator

Un potente strumento web per generare testo e grafica in stile **Commodore 64 (PETSCII)**, progettato per creare contenuti retro-estetici perfetti per forum, social media o file di testo.

![C64 Style](https://via.placeholder.com/800x200?text=C64+GENERATOR+PREVIEW)

## 🚀 Funzionalità

Il generatore offre una suite completa di strumenti per l'arte ASCII e PETSCII, recentemente ottimizzata per performance e stabilità:

### 1. Elaborazione Testo
*   **Wrapping a 40 Colonne**: Il testo viene formattato automaticamente per rispettare la larghezza dello schermo originale del C64.
*   **Forza Maiuscolo**: Conversione automatica in maiuscolo per fedeltà storica.
*   **Modalità Blocchi**: Simula i caratteri "pesanti" del set C64.
*   **Generazione Bordi**: Aggiunge automaticamente una cornice in stile PETSCII (box drawing) attorno al testo.
*   **Performance**: Input di testo con sistema di **Debounce** (50ms) per garantire fluidità anche durante la digitazione rapida.

### 2. Testo Gigante (Big Text)
*   Scrivi titoli enormi utilizzando un font ASCII personalizzato 3x3.
*   Ogni lettera è composta da blocchi grafici (`▄`, `▀`, `█`) per un impatto visivo massimo.
*   Supporto completo per wrapping e bordi anche in questa modalità.

### 3. Convertitore Immagini (Image-to-ASCII)
*   **Caricamento Immagini**: Trascina o carica qualsiasi immagine (JPG, PNG).
*   **Conversione Rapida**: Algoritmo ottimizzato per convertire immagini in ASCII/Block art senza rallentare il browser.
*   **Vari Stili**: Supporta stili Outline, Shade e Blocks.

### 4. Strumenti di Layout e Utilità
*   **Allineamento Centrato**: Centra automaticamente il testo o l'ASCII art all'interno delle 40 colonne.
*   **Copia Smart**: Supporto Clipboard moderno con fallback legacy, garantendo il funzionamento su tutti i browser e dispositivi.
*   **Feedback Visivo**: Indicatori di stato (Processing/Ready) per un'esperienza utente reattiva.

## 🎨 Interfaccia "Professional Retro"
L'applicazione non è solo un tool, ma un'esperienza:
*   **Design Monitor CRT**: Cornice realistica, effetto scanlines, curvatura dello schermo e riflessi.
*   **Controlli Moderni**: Pannello di controllo laterale con switch animati e tema scuro (Dark Mode).
*   **Font Autentici**: Utilizza `VT323` e `Inter` per un mix perfetto di nostalgia e leggibilità.

## 🛠️ Installazione e Uso

Non è richiesta alcuna installazione complessa! Questo è un progetto web statico (HTML/JS/CSS).

1.  **Scarica** la cartella del progetto.
2.  Apri il file `index.html` con il tuo browser preferito (Chrome, Firefox, Edge).
3.  Inizia a digitare o carica un'immagine!

## 📂 Struttura del Progetto

*   `index.html`: La struttura della pagina e dell'interfaccia.
*   `style.css`: Stili CSS avanzati per l'estetica C64, effetti CRT e layout responsive.
*   `script.js`: Core logic ottimizzata per elaborazione testo, rendering font e conversione immagini.

## 📝 Licenza
Progetto open source creato per scopi educativi e nostalgici. Sentiti libero di modificarlo e migliorarlo!

---
*READY.*
