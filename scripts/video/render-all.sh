#!/bin/bash
# Rendert alle Videos der aktuellen Runde (scripts/video/videos.json) mit Stimme,
# setzt das Deckblatt davor, normalisiert die Lautheit und packt alles in das Liefer-ZIP.
#   bash scripts/video/render-all.sh ARBEITSORDNER AUSGABEORDNER [id …]
# Vorher: voice.py split, align.py je Video, node scripts/video/thumbnails.cjs AUSGABEORDNER
set -e
[ -f ~/SlimBit-Tools/env.sh ] && . ~/SlimBit-Tools/env.sh
W=$1; OUT=$2; shift 2
mkdir -p "$W/out" "$OUT"
APP=$(python3 -c "import json;print(json.load(open('scripts/video/videos.json'))['app'])")
IDS=${@:-$(python3 -c "import json;print(' '.join(v['id'] for v in json.load(open('scripts/video/videos.json'))['videos']))")}
for n in $IDS; do
  read PG T VW VH LN F THUMB MUS SEED < <(python3 -c "
import json;c=json.load(open('scripts/video/videos.json'));i,v=next((i,x) for i,x in enumerate(c['videos']) if x['id']=='$n')
print(v['page'],v['text'],v['w'],v['h'],v['lufs'],'$APP-'+v['title'].replace(' ',''),v['thumb'],v.get('music',c.get('music','none')),v.get('seed',i+1))")
  node scripts/video/intro/render.cjs "$W" --page "$PG" --w $VW --h $VH --text "$T" --durations "$(cat "$W/durations-$n.txt")" \
    --voicedir "$W/voice-$n" --voice "$W/voice-aligned-$n.wav" --out "$W/out/$n-master.mp4" | grep -E "fertig|Fehler" || true
  # Thumbnail als Deckblatt (0,5 s) vorne + Hintergrundmusik + Lautheit (zwei Durchgänge)
  bash scripts/video/finish.sh "$W/out/$n-master.mp4" "$OUT/$THUMB" "$OUT/$F.mp4" $LN $MUS $SEED
done
# Feste Ordnerstruktur + ein ZIP mit allem (Videos, Bilder, Texte)
python3 scripts/video/package.py "$OUT" --runde
