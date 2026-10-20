"""Schreibt alle Texte zu allen Videos in EINE einfache Text-Datei (zum Kopieren beim Hochladen).

  python3 scripts/video/upload-texte.py [AUSGABE.txt]
Quelle: docs/YOUTUBE-INTRO.md, docs/shorts/SHORT*-UPLOAD.md, docs/SOCIAL-POSTS.md und die Sprechtexte.
Markdown wird zu reinem Text (keine Sternchen, keine Code-Kästen, Tabellen als „Feld: Wert“).
"""
import glob, os, re, sys

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'docs', 'UPLOAD-TEXTE.txt')
LINE = '=' * 72


def plain(md):
    out = []
    for ln in md.splitlines():
        if ln.strip().startswith('```') or ln.strip() == '---':
            continue
        if re.match(r'^\|\s*-+', ln):  # Tabellen-Trennlinie
            continue
        m = re.match(r'^\|(.+)\|\s*$', ln)
        if m:  # Tabellenzeile → „Feld: Wert“
            cells = [c.strip() for c in m.group(1).split('|')]
            if cells[0] in ('Feld', 'Zeit'):
                continue
            ln = f'- {cells[0]}: ' + ' | '.join(cells[1:])
        ln = re.sub(r'^#{1,6}\s+', '', ln)  # nur Überschriften, keine Hashtags
        ln = ln.replace('**', '').replace('`', '')
        ln = re.sub(r'^> ?', '', ln)
        out.append(ln.rstrip())
    text = '\n'.join(out)
    return re.sub(r'\n{3,}', '\n\n', text).strip()


def section(title, md, speech=None):
    parts = [LINE, title.upper(), LINE, '']
    if speech and os.path.exists(speech):
        parts += ['SPRECHTEXT (für Clipchamp)', '', open(speech).read().strip(), '', '-' * 72, '']
    parts.append(plain(md))
    return '\n'.join(parts) + '\n\n'


docs = os.path.join(ROOT, 'docs')
text = f'ALLE TEXTE ZU DEN VIDEOS – zum Kopieren\n(automatisch erzeugt aus docs/*.md – bei Änderungen dort neu erzeugen)\n\n'
intro = os.path.join(docs, 'YOUTUBE-INTRO.md')
if os.path.exists(intro):
    text += section('Intro-Video (YouTube)', open(intro).read(), os.path.join(docs, 'SPRECHTEXT-INTRO.txt'))
for f in sorted(glob.glob(os.path.join(docs, 'shorts', 'SHORT*-UPLOAD.md'))):
    n = re.search(r'SHORT(\d+)', f).group(1)
    text += section(f'Short {n}', open(f).read(), os.path.join(docs, 'shorts', f'short{n}.txt'))
social = os.path.join(docs, 'SOCIAL-POSTS.md')
if os.path.exists(social):
    text += section('Bilder-Posts (Instagram, Story, YouTube-Community)', open(social).read())
open(OUT, 'w').write(text.rstrip() + '\n')
print('→', OUT)
