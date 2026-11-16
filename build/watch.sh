#!/bin/bash
# Rebuild the site whenever a source file under build/ is saved.
# Run from anywhere: bash build/watch.sh   (Ctrl+C to stop)
# "Edit Mode.command" in the SilverApps folder runs this plus a local preview server.
cd "$(dirname "$0")/.." || exit 1
STAMP="$(mktemp "${TMPDIR:-/tmp}/sa-watch.XXXXXX")"
LOG="$(mktemp "${TMPDIR:-/tmp}/sa-build.XXXXXX")"
trap 'rm -f "$STAMP" "$LOG"; echo; echo "Stopped watching."; exit 0' INT TERM

# source files saved since the last build (skips generated output and hidden/editor files)
changed() { find build \( -path build/gen -o -name __pycache__ -o -name '.*' \) -prune -o -type f -newer "$STAMP" ! -name '*~' ! -name '*.swp' -print 2>/dev/null; }

notify() { command -v osascript >/dev/null 2>&1 && osascript -e "display notification \"$2\" with title \"SilverApps\" subtitle \"$1\"" >/dev/null 2>&1; }

# JavaScript syntax check (macOS only, using the built-in JavaScript engine): catches a stray backtick or quote before it breaks a page
jscheck() {
  command -v osascript >/dev/null 2>&1 || return 0
  osascript -l JavaScript -e 'function run(argv) { ObjC.import("Foundation"); const s = $.NSString.stringWithContentsOfFileEncodingError(argv[0], 4, null).js; try { new Function(s); return ""; } catch (e) { if (/regular expression/i.test(e.message)) return ""; return e.message + (e.line ? " (near line " + e.line + ")" : ""); } }' "$1" 2>/dev/null
}

build() {
  local bad="" f msg
  for f in $(echo "$1" | grep '\.js$'); do
    msg="$(jscheck "$f")"
    if [ -n "$msg" ]; then bad="$f: $msg"; break; fi
  done
  if [ -n "$bad" ]; then
    echo "  NOT BUILT. Syntax error in $bad"
    echo "  (Usually a missing or extra backtick \` or quote. Fix it and save again.)"
    notify "Syntax error, not built" "$(basename "${bad%%:*}")"
    return
  fi
  printf '%s  Building... ' "$(date +%H:%M:%S)"
  for try in 1 2 3; do   # OneDrive sometimes locks a file for a moment; a retry gets past it
    bash build/build_all.sh >"$LOG" 2>&1
    grep -q "Traceback\|Error" "$LOG" || break
    grep -q "PermissionError" "$LOG" || break
    sleep 3
  done
  if grep -q "Traceback\|Error" "$LOG"; then
    echo "FAILED:"; grep -B2 -A6 "Traceback\|Error" "$LOG" | tail -14
    notify "Build failed" "See the Terminal window for the error."
  else
    echo "done. Reload the page."
    notify "Rebuilt" "Reload the page to see your change."
  fi
}

echo "Watching build/ for saved changes. Press Ctrl+C to stop."
touch "$STAMP"
while :; do
  if [ -n "$(changed)" ]; then
    sleep 1                      # let the editor finish writing (and catch several files saved together)
    files="$(changed)"
    touch "$STAMP"               # anything saved during the build triggers another round
    echo "Saved: $(echo "$files" | sed 's#^build/##' | tr '\n' ' ')"
    build "$files"
  fi
  sleep 1
done
