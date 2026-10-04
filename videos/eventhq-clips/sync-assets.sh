#!/bin/sh
# Each clip is its own HyperFrames project (lint/check/render work per directory); share one asset source.
cd "$(dirname "$0")"
for d in hero schedule floorplan incidents assistant; do mkdir -p "$d/assets" && cp assets/* "$d/assets/"; done
