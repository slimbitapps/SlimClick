"""Legt alle fertigen Videos, Bilder und Texte in einer IMMER GLEICHEN Ordnerstruktur ab und packt sie als ZIP.

  python3 scripts/video/package.py [AUSGABEORDNER=video-out]
Ergebnis: AUSGABEORDNER/<App>-Videos[-RundeN].zip mit

  <App>-Videos/
    Upload-Texte.html        ALLE Texte mit Kopier-Knöpfen (Titel, Beschreibung, Tags, Kommentar, TikTok, Instagram)
    Upload-Texte.txt         dasselbe als reiner Text
    LIESMICH.txt             was wo liegt + Reihenfolge zum Posten
    1-…/ 2-… 3-…             je Video ALLES zum Hochladen: Video.mp4 · Texte.html ·
                             YouTube-Cover/-Vorschaubild · TikTok-Cover · Instagram-Cover · Profilbilder (· Untertitel)
    Bilder-Posts/            Instagram-Feed-Posts, Story, Quadrat, YouTube-Community-Bild
    Kanal/                   Profilbilder + YouTube-Banner (einmalig einrichten)
    Logo-und-Screenshots/    App-Symbol, Logo, beschriftete Werbebilder
Fehlt eine Datei, bricht das Skript mit einer klaren Meldung ab (nichts Halbfertiges verschicken).
"""
import glob, json, os, shutil, subprocess, sys, tempfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CFG = json.load(open(os.path.join(ROOT, 'scripts', 'video', 'videos.json')))
APP = CFG['app']
OUT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'video-out'))
TEXTS = os.path.join(ROOT, 'scripts', 'video', 'texts.py')
missing, copies = [], []  # copies: (Quelle, Ziel relativ zum Paket)


def need(p):
    p = p if os.path.isabs(p) else os.path.join(ROOT, p)
    if not os.path.exists(p):
        missing.append(os.path.relpath(p, ROOT))
    return p


AVATAR = need('brand/slimbit-avatar-800.png')
BANNER = need('brand/slimbit-youtube-banner-2560x1440.jpg')
for v in CFG['videos']:
    d, name = v['folder'], v['title'].replace(' ', '')
    copies.append((need(os.path.join(OUT, f'{APP}-{name}.mp4')), f'{d}/{name}.mp4'))
    thumb = need(os.path.join(OUT, v['thumb']))
    if v['id'] == 'intro':
        copies += [(thumb, f'{d}/YouTube-Vorschaubild-1280x720.jpg'), (need(f'docs/{APP}-Intro-EN.srt'), f'{d}/YouTube-Untertitel-EN.srt'),
                   (AVATAR, f'{d}/YouTube-Profilbild-800x800.png')]
    else:
        for plat in ('YouTube', 'TikTok', 'Instagram'):
            copies += [(thumb, f'{d}/{plat}-Cover-1080x1920.jpg'), (AVATAR, f'{d}/{plat}-Profilbild-800x800.png')]

# Bilder-Posts (Namen wie in docs/upload/posts.json)
for src, dst in [('Post-1-Clicker', 'Instagram-Post1-Clicker-1080x1350'), ('Post-2-Laser', 'Instagram-Post2-Laser-1080x1350'),
                 ('Post-3-WiFi', 'Instagram-Post3-WiFi-1080x1350'), ('Story', 'Instagram-Story-1080x1920'),
                 ('Square', 'Instagram-Post-Quadrat-1080x1080'), ('Square', 'YouTube-Community-Beitrag-1080x1080')]:
    f = os.path.join(OUT, f'{APP}-{src}.jpg')
    if os.path.exists(f):
        copies.append((f, f'Bilder-Posts/{dst}.jpg'))
# Kanal (einmalig)
copies += [(AVATAR, f'Kanal/{p}-Profilbild-800x800.png') for p in ('YouTube', 'TikTok', 'Instagram')] + [(BANNER, 'Kanal/YouTube-Banner-2560x1440.jpg')]
# Logo + Screenshots
copies += [(need('build/icon.png'), f'Logo-und-Screenshots/{APP}-Symbol-1024.png'), (need('brand/logo-square.png'), f'Logo-und-Screenshots/{APP}-Logo-512.png'),
           (need('brand/slimclick.png'), f'Logo-und-Screenshots/{APP}-Symbol-256.png'), (need('brand/logo.svg'), f'Logo-und-Screenshots/{APP}-Logo.svg')]
for f in sorted(glob.glob(os.path.join(ROOT, 'marketing', 'screenshots', 'en-*.png'))):
    copies.append((f, f'Logo-und-Screenshots/Screenshot-{os.path.basename(f)[3:]}'))
for v in CFG['videos']:
    need(v['upload'])

if missing:
    sys.exit('Es fehlen Dateien – zuerst rendern, thumbnails.cjs ausführen bzw. docs/upload/<id>.json anlegen:\n  ' + '\n  '.join(missing))

tmp = tempfile.mkdtemp()
Z = os.path.join(tmp, f'{APP}-Videos')
for src, dst in copies:
    p = os.path.join(Z, dst)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    shutil.copy2(src, p)
run = lambda *a: subprocess.run([sys.executable, TEXTS, *a], check=True, capture_output=True)
run('html', os.path.join(Z, 'Upload-Texte.html'))
run('txt', os.path.join(Z, 'Upload-Texte.txt'))
for v in CFG['videos']:
    run('html', os.path.join(Z, v['folder'], 'Texte.html'), v['id'])

order = '\n'.join(f'  {i + 1}. {v["title"]:8s} → Ordner {v["folder"]}' for i, v in enumerate(CFG['videos']))
open(os.path.join(Z, 'LIESMICH.txt'), 'w').write(f"""{APP} – Videos, Bilder und Texte

Am einfachsten: Upload-Texte.html doppelklicken – dort hat jedes Textfeld einen Kopieren-Knopf.

So ist der Ordner aufgebaut (bei jeder App gleich):
  Upload-Texte.html        alle Texte mit Kopier-Knöpfen (auch als Upload-Texte.txt)
  1-… 2-… 3-…              je Video ALLES zum Hochladen: das Video, Texte.html, Cover und Profilbild
                           für YouTube, TikTok und Instagram (Dateiname beginnt mit der Plattform)
  Bilder-Posts/            Bilder für Instagram-Feed, Story und YouTube-Community (Texte in Upload-Texte.html)
  Kanal/                   Profilbilder und YouTube-Banner – nur einmal beim Einrichten der Kanäle
  Logo-und-Screenshots/    App-Symbol, Logo, Werbebilder

Reihenfolge zum Posten (Abstand 2–3 Tage, So–Do 18–20 Uhr):
{order}

Titelbild: Jedes Video beginnt mit einer halben Sekunde Deckblatt. Beim Hochladen als Cover den Regler
ganz an den Anfang schieben. (Eigene Bilder hochladen geht bei deinem YouTube-Konto noch nicht.)
""")
suffix = f"-Runde{CFG['batch']}" if CFG.get('batch', 1) > 1 else ''
zf = os.path.join(OUT, f'{APP}-Videos{suffix}.zip')
if os.path.exists(zf):
    os.remove(zf)
subprocess.run(['zip', '-qr', zf, f'{APP}-Videos'], cwd=tmp, check=True)
shutil.copytree(Z, os.path.join(OUT, f'{APP}-Videos{suffix}'), dirs_exist_ok=True)  # entpackt zum Ansehen
shutil.rmtree(tmp)
print(f'→ {zf} ({os.path.getsize(zf) / 1e6:.0f} MB, {len(copies) + 3 + len(CFG["videos"])} Dateien)')
