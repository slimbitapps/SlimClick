# Video-Pipeline (Intro + Shorts) – SlimClick

Übernommen aus slimbitapps/SlimSort (`docs/VIDEO-PIPELINE.md`, `scripts/video/`), angepasst für den **Mac**
und für SlimClick: keine Bildschirmaufnahme nötig – die Videos bestehen aus sauberen Animationen
(Folien, Handy-Fernbedienung, Beamer, Laser) plus echten App-Screenshots aus dem E2E-Test (`marketing/raw/en/`).

## Werkzeuge (einmalig, alles kostenlos)
- Node 22, Google Chrome (Rendern über `playwright-core`), ffmpeg + ffprobe
  (z. B. `npm i ffmpeg-static ffprobe-static` in einem Werkzeug-Ordner und in den PATH legen)
- Python 3 mit `numpy`, `pillow`, `pocketsphinx` (`pip install --user --only-binary :all: pocketsphinx`)
- Soundeffekte: `python3 scripts/video/motion/make-sfx.py` (selbst berechnet → frei nutzbar)

## Dateien
| Datei | Inhalt |
|---|---|
| `docs/SPRECHTEXT-INTRO.txt`, `docs/shorts/short1–3.txt` | Sprechtexte – **ein Absatz = eine Szene** |
| `scripts/video/intro/compositor.html` | Intro 1920×1080 (11 Szenen) |
| `scripts/video/shorts/short1–3.html` | Shorts 1080×1920 |
| `scripts/video/motion/core.js` | Szenen-Engine (Zeitleiste, Easing, Untertitel, Laptop) |
| `scripts/video/motion/slimclick.js` | Bausteine: Beispiel-Präsentation, Handy, Beamer + Laser, Kamera mit QR |
| `scripts/video/intro/render.cjs` | Rendert Bild für Bild, mischt Stimme + Effekte (Ducking) |
| `scripts/video/intro/words.py`, `align.py`, `subtitles.py` | Stimme prüfen, aufteilen, SRT erzeugen |

## Ablauf
1. **Vorschau ohne Stimme** (Szenenlängen aus dem Text geschätzt):
   `node scripts/video/intro/render.cjs WORK --page scripts/video/shorts/short1.html --w 1080 --h 1920 --text docs/shorts/short1.txt --preview --out video-out/Vorschau-Short1.mp4`
   Standbilder statt Video: `--stills 1,5,9`.
2. **Stimme** (Clipchamp, Stimme *Andrew*): jeden Text **am Stück** einsprechen → `.mp3`/`.m4a` nach `private/` (nie committen).
3. **Prüfen:** `python3 scripts/video/intro/words.py private/short1.mp3 docs/shorts/short1.txt`
   → richtiger Text? Vorschlag für Absatzgrenzen (`ALIGN_BOUNDS`).
4. **Aufteilen:** `[ALIGN_BOUNDS=…] python3 scripts/video/intro/align.py private/short1.mp3 WORK docs/shorts/short1.txt short1`
   → `WORK/voice-short1/absatz-XX.wav`, `WORK/voice-aligned-short1.wav`, `WORK/durations-short1.txt`.
5. **Rendern:** wie 1., aber ohne `--preview` und mit
   `--durations $(cat WORK/durations-short1.txt) --voicedir WORK/voice-short1 --voice WORK/voice-aligned-short1.wav`.
   Danach Ereignisse an die echten Wortzeiten aus `words.py` anpassen.
6. **Thumbnails:** `node scripts/video/thumbnails.cjs video-out`
7. **Fertig machen:** `bash scripts/video/finish.sh master.mp4 THUMBNAIL.jpg FINAL.mp4 -14` (Intro: `-15`)
   → setzt das Thumbnail **0,5 s als Deckblatt** vor das Video (eigene Thumbnails darf das Konto noch nicht hochladen;
   so lässt es sich beim Hochladen als Titelbild auswählen) und normalisiert die Lautheit in zwei Durchgängen.
   Alles auf einmal (Rendern + Deckblatt + Lautheit): `bash scripts/video/render-all.sh WORK video-out`.
   Untertitel (nur Englisch): `python3 scripts/video/intro/subtitles.py WORK docs/SPRECHTEXT-INTRO.txt docs/SlimClick-Intro-EN.srt intro`
   (berücksichtigt das Deckblatt automatisch).
8. **Sync prüfen:** `words.py FINAL.mp4` + Standbilder an den Schlüsselwörtern (alle Zeiten +0,5 s wegen Deckblatt).

## Regeln
- **Keine Übersetzungen** liefern (keine deutschen Untertitel/Titel) – nur Englisch.
- **Deckblatt** immer 0,5 s am Anfang (siehe 7.).
- Hook in der 1. Sekunde, ein Gedanke pro Short, 25–35 s, Prinzip als Animation, am Ende echte App + Logo + „Link in profile“.
- Zielgruppe Schüler & Studenten: Referat-Situation, lockere Sprache, schnelle Schnitte, große Wörter.
- Keine Maus-/Tastatur-Einblendungen über der echten App. Wortenden der Stimme nie abschneiden.
- Dateien des Nutzers (Stimmen, Fotos) liegen in `private/` – steht in `.gitignore`.
