#!/bin/sh
# Rebuild every page in site/ from build/. Run from the Music Apps folder (or anywhere): sh build/build_all.sh
cd "$(dirname "$0")/.." || exit 1
python3 build/transposition/assemble.py
python3 build/orchestration/assemble.py
python3 build/harmony/assemble.py
python3 build/build_trainers.py && python3 build/build_chordlab.py && python3 build/build_foreign_terms.py && python3 build/build_tuner.py && python3 build/build_index.py && python3 build/build_verify.py && python3 build/build_pages.py
