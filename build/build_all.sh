#!/bin/sh
# Rebuild every page in site/ from build/. Run from the Music Apps folder (or anywhere): sh build/build_all.sh
cd "$(dirname "$0")/.." || exit 1
# one build at a time (Edit Mode, the watcher and a manual run can overlap): wait for a running build; clear a lock older than 15 minutes
LOCK=build/.build.lock
while ! mkdir "$LOCK" 2>/dev/null; do
  if [ -n "$(find "$LOCK" -maxdepth 0 -mmin +15 2>/dev/null)" ]; then rmdir "$LOCK" 2>/dev/null; continue; fi
  sleep 1
done
trap 'rmdir "$LOCK" 2>/dev/null' EXIT INT TERM
python3 build/transposition/assemble.py
python3 build/orchestration/assemble.py
python3 build/harmony/assemble.py
python3 build/build_trainers.py && python3 build/build_chordlab.py && python3 build/build_foreign_terms.py && python3 build/build_tuner.py && python3 build/build_index.py && python3 build/build_verify.py && python3 build/build_pages.py
python3 build/externalize.py
python3 build/build_quizlist.py
python3 build/cachebust.py
