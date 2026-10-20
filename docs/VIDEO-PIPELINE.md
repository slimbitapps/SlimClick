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

## Ablauf (so wenig Handgriffe wie möglich)
0. Werkzeuge: `bash scripts/setup-tools.sh` (einmalig, dauerhaft in `~/SlimBit-Tools`), dann `. ~/SlimBit-Tools/env.sh`.
1. **Texte schreiben** (`docs/SPRECHTEXT-INTRO.txt`, `docs/shorts/shortN.txt`, aktuelle Runde in `scripts/video/videos.json`,
   fertige Runden stehen dort unter `done`),
   dann **ein** gemeinsamer Text: `python3 scripts/video/voice.py text` → `docs/SPRECHTEXT-ALLE.txt`
   (zwischen den Videos „Next video.“). Diesen Text bekommt der Nutzer. **Noch kein Video bauen.**
2. Nutzer spricht ihn in **Clipchamp** ein (Stimme *Andrew*) und schickt **eine** Datei → nach `private/` (nie committen).
3. **Zerschneiden:** `python3 scripts/video/voice.py split private/AUFNAHME.m4a` → `private/voice/<id>.wav`
   + Bericht (erste/letzte Wörter, Warnung, wenn die Wortzahl nicht passt).
4. **Prüfen + Absätze:** je Video `python3 scripts/video/intro/words.py private/voice/<id>.wav TEXT` – richtiger Text?
   Absatzgrenzen anhand der Wortzeiten setzen, dann
   `ALIGN_BOUNDS=… python3 scripts/video/intro/align.py private/voice/<id>.wav private/work TEXT <id> MIN…` (MIN aus videos.json).
5. **Ereignisse auf Wörter legen:** Wortzeiten je Szene (aus `words.py` auf `voice-aligned-<id>.wav`) in die Szenen-HTML eintragen.
6. **Bilder:** `node scripts/video/thumbnails.cjs video-out` (Thumbnails, Cover, Feed-Posts, Quadrat, Story).
7. **Alles rendern + fertig machen:** `bash scripts/video/render-all.sh private/work video-out`
   → je Video: Rendern, 0,5 s Deckblatt, Lautheit (zwei Durchgänge); danach `package.py`.
   Untertitel (nur Englisch): `python3 scripts/video/intro/subtitles.py private/work docs/SPRECHTEXT-INTRO.txt docs/<App>-Intro-EN.srt intro`.
8. **Sync prüfen:** `words.py` auf jedem fertigen MP4 + `bash scripts/video/stills.sh VIDEO.mp4 private/check/x ZEITEN…`
   (Standbilder an den Schlüsselwörtern, alle Zeiten +0,5 s wegen Deckblatt).
9. **Upload-Texte:** je Video `docs/upload/<id>.json` (YouTube: Titel, Beschreibung, Tags, Kommentar · TikTok · Instagram · Hinweise),
   Bilder-Posts in `docs/upload/posts.json`. **Kein Sprechtext** darin. Daraus baut `scripts/video/texts.py` die
   **HTML-Seite mit Kopier-Knöpfen** und die Text-Datei.
10. **Liefern:** `python3 scripts/video/package.py video-out --runde` → **`<App>-Videos[-RundeN].zip`** (nur die neue Runde),
   ohne `--runde` → **`<App>-Komplett.zip`** (alle Runden, neu durchnummeriert). Beide in fester Struktur:
   `Upload-Texte.html` (Kopier-Knöpfe) · `Upload-Texte.txt` · `LIESMICH.txt` ·
   je Video ein Ordner mit ALLEM zum Hochladen (Video.mp4, Texte.html, YouTube-/TikTok-/Instagram-Cover und -Profilbild,
   beim Intro Vorschaubild + Untertitel) · `Bilder-Posts/` · `Kanal/` · `Logo-und-Screenshots/`. Fehlt etwas, bricht es ab.

## Regeln
- **Keine Übersetzungen** liefern (keine deutschen Untertitel/Titel) – nur Englisch.
- **Deckblatt** immer 0,5 s am Anfang (finish.sh).
- Dem Nutzer **nur das eine ZIP** schicken (10.) – darin Videos, alle Bilder und die Kopier-Seite mit allen Texten.
- Hook in der 1. Sekunde, ein Gedanke pro Short, 25–35 s, Prinzip als Animation, am Ende echte App + Logo + „Link in profile“.
- Zielgruppe Schüler & Studenten: Referat-Situation, lockere Sprache, schnelle Schnitte, große Wörter.
- Keine Maus-/Tastatur-Einblendungen über der echten App. Wortenden der Stimme nie abschneiden.
- Dateien des Nutzers (Stimmen, Fotos) liegen in `private/` – steht in `.gitignore`.

## Hintergrundmusik (eigene, per Code)
- `python3 scripts/video/music.py STIL SEKUNDEN OUT.wav [--seed N]` – Stile `pop` (fröhlich, 116 BPM), `lofi` (ruhig, 78 BPM),
  `epic` (filmisch, 92 BPM). Nur numpy, gehört uns → keine Content-ID-Ansprüche. `--seed` = andere Variante.
- `finish.sh` legt sie automatisch unter (Lautstärke 16 %, `MUSIC_VOL=` zum Ändern, Ducking über die Stimme).
  Stil in `videos.json` → `"music"` (für alle) oder je Video `"music"`/`"seed"`; `"none"` = ohne Musik.
- Prüfen: `words.py` auf dem fertigen Video muss die Stimme genauso gut erkennen wie ohne Musik.
