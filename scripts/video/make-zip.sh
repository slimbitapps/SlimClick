#!/bin/bash
# Packt alle Bilder für YouTube, TikTok und Instagram in EIN ZIP (nach Plattform sortiert).
#   bash scripts/video/make-zip.sh AUSGABEORDNER     (vorher: node scripts/video/thumbnails.cjs AUSGABEORDNER)
set -e
OUT=${1:-video-out}; APP=SlimClick
T=$(mktemp -d); Z="$T/$APP-Bilder"
mkdir -p "$Z/YouTube" "$Z/TikTok" "$Z/Instagram" "$Z/Logo" "$Z/Screenshots"
c() { cp "$1" "$2"; }
# YouTube
c "$OUT/$APP-Thumbnail.jpg"            "$Z/YouTube/Intro-Vorschaubild-1280x720.jpg"
for n in 1 2 3; do c "$OUT/$APP-Short$n-Thumbnail.jpg" "$Z/YouTube/Short$n-Cover-1080x1920.jpg"; done
c "$OUT/$APP-Square.jpg"               "$Z/YouTube/Community-Beitrag-1080x1080.jpg"
c brand/slimbit-avatar-800.png         "$Z/YouTube/Kanal-Profilbild-800x800.png"
c brand/slimbit-youtube-banner-2560x1440.jpg "$Z/YouTube/Kanal-Banner-2560x1440.jpg"
# TikTok
for n in 1 2 3; do c "$OUT/$APP-Short$n-Thumbnail.jpg" "$Z/TikTok/Short$n-Cover-1080x1920.jpg"; done
c brand/slimbit-avatar-800.png         "$Z/TikTok/Profilbild-800x800.png"
# Instagram
for n in 1 2 3; do c "$OUT/$APP-Short$n-Thumbnail.jpg" "$Z/Instagram/Reel$n-Cover-1080x1920.jpg"; done
c "$OUT/$APP-Post-1-Clicker.jpg"       "$Z/Instagram/Post1-Clicker-1080x1350.jpg"
c "$OUT/$APP-Post-2-Laser.jpg"         "$Z/Instagram/Post2-Laser-1080x1350.jpg"
c "$OUT/$APP-Post-3-WiFi.jpg"          "$Z/Instagram/Post3-WiFi-1080x1350.jpg"
c "$OUT/$APP-Square.jpg"               "$Z/Instagram/Post-Quadrat-1080x1080.jpg"
c "$OUT/$APP-Story.jpg"                "$Z/Instagram/Story-1080x1920.jpg"
c brand/slimbit-avatar-800.png         "$Z/Instagram/Profilbild-800x800.png"
# Logo + Screenshots
c build/icon.png                       "$Z/Logo/$APP-Symbol-1024.png"
c brand/logo-square.png                "$Z/Logo/$APP-Logo-512.png"
c brand/slimclick.png                  "$Z/Logo/$APP-Symbol-256.png"
c brand/logo.svg                       "$Z/Logo/$APP-Logo.svg"
for f in marketing/screenshots/en-*.png; do c "$f" "$Z/Screenshots/$(basename "$f" | sed 's/^en-//')"; done
cat > "$Z/LIESMICH.txt" <<TXT
$APP – alle Bilder für Social Media

YouTube/    Intro-Vorschaubild, Cover der 3 Shorts, Bild für einen Community-Beitrag, Kanal-Profilbild und -Banner
            (Eigene Vorschaubilder darf dein Konto noch nicht hochladen – die Cover stecken als Deckblatt
            in der ersten halben Sekunde jedes Videos. Profilbild und Banner gehen trotzdem.)
TikTok/     Cover der 3 Shorts, Profilbild
Instagram/  Reel-Cover, 3 Feed-Posts (4:5), quadratischer Post, Story, Profilbild
Logo/       App-Symbol und Logo in mehreren Größen
Screenshots/ 8 beschriftete Werbebilder (1920x1080)

Die Texte zu allen Videos stehen in $APP-Upload-Texte.txt.
TXT
rm -f "$OUT/$APP-Bilder.zip"; (cd "$T" && zip -qr - "$APP-Bilder") > "$OUT/$APP-Bilder.zip"; rm -rf "$T"
echo "→ $OUT/$APP-Bilder.zip"
