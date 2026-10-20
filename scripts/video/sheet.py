"""Kontaktbogen aus Standbildern (zum schnellen Prüfen von Bild und Sync).
  python3 scripts/video/sheet.py ORDNER_MIT_still-*.jpg AUSGABE.jpg [SPALTEN=6]"""
import glob, sys
from PIL import Image, ImageDraw

files = sorted(glob.glob(sys.argv[1] + '/still-*.jpg'))
ims = [Image.open(f) for f in files]
w, h = ims[0].size
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 6
tw = 2400 // cols; th = int(h * tw / w)
rows = (len(ims) + cols - 1) // cols
S = Image.new('RGB', (tw * cols, th * rows), (40, 40, 40))
d = ImageDraw.Draw(S)
for i, (im, f) in enumerate(zip(ims, files)):
    x, y = (i % cols) * tw, (i // cols) * th
    S.paste(im.resize((tw, th)), (x, y))
    d.text((x + 8, y + 8), str(int(f.split('still-')[1][:5]) / 10), fill=(255, 255, 0))
S.save(sys.argv[2], quality=80)
