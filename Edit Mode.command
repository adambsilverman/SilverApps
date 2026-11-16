#!/bin/bash
# Double-click to edit the site. It opens a local preview in your browser and rebuilds
# every time you save a file in build/. Close this window (or press Ctrl+C) to stop.
cd "$(dirname "$0")" || exit 1
PORT=8000
while lsof -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; do PORT=$((PORT + 1)); done
python3 -m http.server $PORT --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT
sleep 1
open "http://localhost:$PORT/"
echo "Preview: http://localhost:$PORT/"
bash build/watch.sh
