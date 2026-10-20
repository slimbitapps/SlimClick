#!/bin/bash
# Sync-Prüfung eines fertigen Videos: Standbilder zu bestimmten Zeiten + Kontaktbogen + Lautheit.
#   bash scripts/video/stills.sh VIDEO.mp4 ORDNER ZEIT1 ZEIT2 …   → ORDNER.jpg
[ -f ~/SlimBit-Tools/env.sh ] && . ~/SlimBit-Tools/env.sh
V=$1; D=$2; shift 2; rm -rf "$D"; mkdir -p "$D"
for t in "$@"; do ffmpeg -v error -y -ss "$t" -i "$V" -frames:v 1 -vf scale=360:-1 "$D/still-$(printf %05d "$(python3 -c "print(int($t*10))")").jpg"; done
python3 "$(dirname "$0")/sheet.py" "$D" "$D.jpg" 6
ffmpeg -nostats -i "$V" -af ebur128 -f null - 2>&1 | grep -E '^\s+I:' | tail -1
