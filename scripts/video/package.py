"""Legt alle fertigen Videos, Bilder und Texte in einer IMMER GLEICHEN Ordnerstruktur ab und packt sie als ZIP.

  python3 scripts/video/package.py [AUSGABEORDNER=video-out]
Ergebnis: AUSGABEORDNER/<App>-Videos.zip mit

  <App>-Videos/
    LIESMICH.txt                  was wo liegt + Reihenfolge zum Posten
    Texte-zum-Kopieren.txt        alle Titel, Beschreibungen, Tags, Kommentare, TikTok/Instagram-Texte
    1-Intro/                      Intro.mp4 · Vorschaubild-1280x720.jpg · Untertitel-EN.srt
    2-Short1-…/ 3-… 4-…           ShortN.mp4 · Cover-1080x1920.jpg
    Bilder/YouTube|TikTok|Instagram|Logo|Screenshots/
Fehlt eine Datei, bricht das Skript mit einer klaren Meldung ab (nichts Halbfertiges verschicken).
"""
import glob, json, os, shutil, subprocess, sys, tempfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CFG = json.load(open(os.path.join(ROOT, 'scripts', 'video', 'videos.json')))
APP = CFG['app']
OUT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'video-out'))
missing = []


def need(p):
    p = p if os.path.isabs(p) else os.path.join(ROOT, p)
    if not os.path.exists(p):
        missing.append(os.path.relpath(p, ROOT))
    return p


tmp = tempfile.mkdtemp()
Z = os.path.join(tmp, f'{APP}-Videos')
copies = []  # (Quelle, Ziel relativ zu Z)
shorts = [v for v in CFG['videos'] if v['id'] != 'intro']
for v in CFG['videos']:
    name = v['title'].replace(' ', '')
    copies.append((need(os.path.join(OUT, f"{APP}-{name}.mp4")), f"{v['folder']}/{name}.mp4"))
    if v['id'] == 'intro':
        copies.append((need(os.path.join(OUT, v['thumb'])), f"{v['folder']}/Vorschaubild-1280x720.jpg"))
        copies.append((need(f'docs/{APP}-Intro-EN.srt'), f"{v['folder']}/Untertitel-EN.srt"))
    else:
        copies.append((need(os.path.join(OUT, v['thumb'])), f"{v['folder']}/Cover-1080x1920.jpg"))
# Bilder nach Plattform
B = 'Bilder'
intro = next(v for v in CFG['videos'] if v['id'] == 'intro')
copies += [(need(os.path.join(OUT, intro['thumb'])), f'{B}/YouTube/Intro-Vorschaubild-1280x720.jpg'),
           (need(os.path.join(OUT, f'{APP}-Square.jpg')), f'{B}/YouTube/Community-Beitrag-1080x1080.jpg'),
           (need('brand/slimbit-avatar-800.png'), f'{B}/YouTube/Kanal-Profilbild-800x800.png'),
           (need('brand/slimbit-youtube-banner-2560x1440.jpg'), f'{B}/YouTube/Kanal-Banner-2560x1440.jpg'),
           (need('brand/slimbit-avatar-800.png'), f'{B}/TikTok/Profilbild-800x800.png'),
           (need('brand/slimbit-avatar-800.png'), f'{B}/Instagram/Profilbild-800x800.png'),
           (need(os.path.join(OUT, f'{APP}-Square.jpg')), f'{B}/Instagram/Post-Quadrat-1080x1080.jpg'),
           (need(os.path.join(OUT, f'{APP}-Story.jpg')), f'{B}/Instagram/Story-1080x1920.jpg')]
for i, v in enumerate(shorts, 1):
    t = need(os.path.join(OUT, v['thumb']))
    copies += [(t, f'{B}/YouTube/Short{i}-Cover-1080x1920.jpg'), (t, f'{B}/TikTok/Short{i}-Cover-1080x1920.jpg'),
               (t, f'{B}/Instagram/Reel{i}-Cover-1080x1920.jpg')]
for f in sorted(glob.glob(os.path.join(OUT, f'{APP}-Post-*.jpg'))):
    copies.append((f, f"{B}/Instagram/{os.path.basename(f).replace(APP + '-', '').replace('.jpg', '-1080x1350.jpg')}"))
copies += [(need('build/icon.png'), f'{B}/Logo/{APP}-Symbol-1024.png'), (need('brand/logo-square.png'), f'{B}/Logo/{APP}-Logo-512.png'),
           (need('brand/slimclick.png'), f'{B}/Logo/{APP}-Symbol-256.png'), (need('brand/logo.svg'), f'{B}/Logo/{APP}-Logo.svg')]
for f in sorted(glob.glob(os.path.join(ROOT, 'marketing', 'screenshots', 'en-*.png'))):
    copies.append((f, f"{B}/Screenshots/{os.path.basename(f)[3:]}"))

if missing:
    sys.exit('Es fehlen Dateien – zuerst rendern bzw. thumbnails.cjs ausführen:\n  ' + '\n  '.join(missing))

for src, dst in copies:
    d = os.path.join(Z, dst)
    os.makedirs(os.path.dirname(d), exist_ok=True)
    shutil.copy2(src, d)
subprocess.run([sys.executable, os.path.join(ROOT, 'scripts', 'video', 'upload-texte.py'), os.path.join(Z, 'Texte-zum-Kopieren.txt')], check=True, capture_output=True)
order = '\n'.join(f'  {i + 1}. {v["title"]:8s} → Ordner {v["folder"]}' for i, v in enumerate(CFG['videos']))
open(os.path.join(Z, 'LIESMICH.txt'), 'w').write(f"""{APP} – alle Videos, Bilder und Texte

So ist der Ordner aufgebaut (bei jeder App gleich):
  Texte-zum-Kopieren.txt   Titel, Beschreibung, Tags, Kommentar, TikTok- und Instagram-Texte für jedes Video
  1-Intro/ …               je Video: das fertige MP4 + Titelbild (Intro zusätzlich die englischen Untertitel)
  Bilder/                  alle Bilder sortiert nach YouTube, TikTok, Instagram, Logo, Screenshots

Reihenfolge zum Posten (Abstand 2–3 Tage, So–Do 18–20 Uhr):
{order}

Titelbild: Jedes Video beginnt mit einer halben Sekunde Deckblatt. Beim Hochladen als Cover den Regler
ganz an den Anfang schieben. (Eigene Bilder hochladen geht bei deinem YouTube-Konto noch nicht.)
""")
zf = os.path.join(OUT, f'{APP}-Videos.zip')
if os.path.exists(zf):
    os.remove(zf)
subprocess.run(['zip', '-qr', zf, f'{APP}-Videos'], cwd=tmp, check=True)
shutil.rmtree(tmp)
size = os.path.getsize(zf) / 1e6
print(f'→ {zf} ({size:.0f} MB, {len(copies) + 2} Dateien)')
