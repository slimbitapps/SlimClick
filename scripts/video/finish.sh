#!/bin/bash
# Letzter Schritt: Deckblatt (0,5 s Thumbnail) vorne + Lautheit in zwei Durchgängen normalisieren.
#   bash scripts/video/finish.sh MASTER.mp4 THUMBNAIL.jpg FINAL.mp4 LUFS(-14 Shorts, -15 Intro)
set -e
M=$1; IMG=$2; OUT=$3; L=${4:--14}
TMP="${OUT%.mp4}-cover.mov"
bash "$(dirname "$0")/add-cover.sh" "$M" "$IMG" "$TMP" 0.5 >/dev/null
J=$(ffmpeg -nostats -i "$TMP" -af "loudnorm=I=$L:TP=-1.5:LRA=11:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
A=$(python3 -c "import json,sys;d=json.loads(sys.argv[1]);print(f\"measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}:measured_thresh={d['input_thresh']}:offset={d['target_offset']}:linear=true\")" "$J")
ffmpeg -v error -y -i "$TMP" -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -af "loudnorm=I=${L}:TP=-1.5:LRA=11:${A}" -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$OUT"
rm -f "$TMP"
echo "fertig: $OUT ($(ffmpeg -nostats -i "$OUT" -af ebur128 -f null - 2>&1 | grep -E '^\s+I:' | tail -1 | tr -s ' '))"
