#!/bin/bash
# Rendert alle fertigen Videos mit Stimme und normalisiert die Lautheit.
#   bash scripts/video/render-all.sh ARBEITSORDNER AUSGABEORDNER [short1 short2 short3 intro]
set -e
W=$1; OUT=$2; shift 2
NAMES=${@:-short1 short2 short3 intro}
for n in $NAMES; do
  if [ "$n" = intro ]; then PG=scripts/video/intro/compositor.html; T=docs/SPRECHTEXT-INTRO.txt; VW=1920; VH=1080; LN=-15; F=SlimClick-Intro
  else PG=scripts/video/shorts/$n.html; T=docs/shorts/$n.txt; VW=1080; VH=1920; LN=-14; F=SlimClick-Short${n#short}; fi
  node scripts/video/intro/render.cjs "$W" --page "$PG" --w $VW --h $VH --text "$T" --durations "$(cat "$W/durations-$n.txt")" \
    --voicedir "$W/voice-$n" --voice "$W/voice-aligned-$n.wav" --out "$W/out/$n-master.mp4" | grep -E "fertig|Fehler" || true
  ffmpeg -v error -y -i "$W/out/$n-master.mp4" -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p \
    -af loudnorm=I=$LN:TP=-1.5:LRA=11 -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$OUT/$F.mp4"
  echo "ok $F"
done
