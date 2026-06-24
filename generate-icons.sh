#!/usr/bin/env bash
# Generate PNG icons from icon.svg using ImageMagick or rsvg-convert.
# Run this script once after cloning to produce icon-192.png and icon-512.png.

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SVG="$SCRIPT_DIR/icon.svg"

if command -v rsvg-convert &>/dev/null; then
  echo "Using rsvg-convert..."
  rsvg-convert -w 192 -h 192 "$SVG" -o "$SCRIPT_DIR/icon-192.png"
  rsvg-convert -w 512 -h 512 "$SVG" -o "$SCRIPT_DIR/icon-512.png"
  echo "Icons generated via rsvg-convert."
elif command -v convert &>/dev/null; then
  echo "Using ImageMagick convert..."
  convert -background none -resize 192x192 "$SVG" "$SCRIPT_DIR/icon-192.png"
  convert -background none -resize 512x512 "$SVG" "$SCRIPT_DIR/icon-512.png"
  echo "Icons generated via ImageMagick."
else
  echo "Neither rsvg-convert nor ImageMagick (convert) found."
  echo "Install one of them and re-run this script, or use an online SVG-to-PNG converter on icon.svg."
  echo "The placeholder PNG files (icon-192.png, icon-512.png) are solid purple (#3C3489) and valid but have no 'D' glyph."
  exit 1
fi
