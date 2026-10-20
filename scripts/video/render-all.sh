#!/bin/bash
# Rendert alle fertigen Videos mit Stimme, setzt das Deckblatt davor und normalisiert die Lautheit.
# Vorher die Thumbnails erzeugen: node scripts/video/thumbnails.cjs AUSGABEORDNER
#   bash scripts/video/render-all.sh ARBEITSORDNER AUSGABEORDNER [short1 short2 short3 intro]
set -e
[ -f ~/SlimBit-Tools/env.sh ] && . ~/SlimBit-Tools/env.sh
W=$1; OUT=$2; shift 2
NAMES=${@:-short1 short2 short3 intro}
for n in $NAMES; do
  if [ "$n" = intro ]; then PG=scripts/video/intro/compositor.html; T=docs/SPRECHTEXT-INTRO.txt; VW=1920; VH=1080; LN=-15; F=SlimClick-Intro
  else PG=scripts/video/shorts/$n.html; T=docs/shorts/$n.txt; VW=1080; VH=1920; LN=-14; F=SlimClick-Short${n#short}; fi
  node scripts/video/intro/render.cjs "$W" --page "$PG" --w $VW --h $VH --text "$T" --durations "$(cat "$W/durations-$n.txt")" \
    --voicedir "$W/voice-$n" --voice "$W/voice-aligned-$n.wav" --out "$W/out/$n-master.mp4" | grep -E "fertig|Fehler" || true
  # Thumbnail als Deckblatt (0,5 s) vorne + Lautheit (zwei Durchgänge)
  bash scripts/video/finish.sh "$W/out/$n-master.mp4" "$OUT/${F/-Intro/}-Thumbnail.jpg" "$OUT/$F.mp4" $LN
done
# Feste Ordnerstruktur + ein ZIP mit allem (Videos, Bilder, Texte)
python3 scripts/video/package.py "$OUT"
