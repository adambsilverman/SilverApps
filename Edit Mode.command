#!/bin/bash
# Double-click to edit the site. Opens a private preview in your browser (this Mac only).
# Turn on "Edit" in the page's lower-left corner, click any text, change it, Save: the change is
# written into the source file under build/ and the site rebuilds. Saving a file in your own
# editor also triggers a rebuild. Close this window (or press Ctrl+C) to stop.
cd "$(dirname "$0")" || exit 1
exec python3 build/editor/server.py
