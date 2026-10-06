#!/bin/sh
# Master renders -> web encodes + poster frames in frontend/public/media.
cd "$(dirname "$0")"
OUT=../../frontend/public/media
mkdir -p "$OUT"
poster() { case "$1" in hero) echo 9.5 ;; demo) echo 2.5 ;; product) echo 6 ;; ai) echo 7.5 ;; use-cases) echo 5 ;; schedule) echo 4.8 ;; *) echo 5.5 ;; esac; }
for c in hero schedule floorplan incidents assistant demo product ai use-cases; do
  [ -f "renders/$c.mp4" ] || { echo "missing renders/$c.mp4"; continue; }
  ffmpeg -loglevel error -y -i "renders/$c.mp4" -an -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p -movflags +faststart "$OUT/$c.mp4"
  ffmpeg -loglevel error -y -ss "$(poster $c)" -i "renders/$c.mp4" -frames:v 1 -q:v 4 "$OUT/$c.jpg"
done
ls -la "$OUT"
# Responsive WebP posters for the page's <img srcset> (the JPG stays as fallback and reduced-motion poster).
for c in hero schedule floorplan incidents assistant demo product ai use-cases; do
  ffmpeg -loglevel error -y -i "$OUT/$c.jpg" -c:v libwebp -quality 78 "$OUT/$c.webp"
  ffmpeg -loglevel error -y -i "$OUT/$c.jpg" -vf scale=800:-1 -c:v libwebp -quality 78 "$OUT/$c-800.webp"
done
