"""Build stand-alone lesson/tool pages from build/pages/*.html.
Each file starts with  <!-- title: … | sound: 1 | desc: … -->  then its <style> and body markup + script.
Run: python3 build/build_pages.py"""
import re, sys, pathlib, html
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from common import *
for f in sorted((ROOT / "build" / "pages").glob("*.html")):
    s = f.read_text(encoding="utf-8")
    m = re.match(r"<!--(.*?)-->\s*", s, re.S); meta = dict(kv.split(":", 1) for kv in m.group(1).split("|")); meta = {k.strip(): v.strip() for k, v in meta.items()}
    body = s[m.end():]
    page = f'''<!doctype html>
<html lang="en" data-theme="light">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(meta["title"])} · {SITE}</title>
<meta name="description" content="{html.escape(meta.get("desc", ""))}">
{HEAD_ASSETS}
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
{strip_html(full_screen=meta.get("fs") == "1", sound=meta.get("sound") == "1")}
{body}
{CREDIT}
<script src="assets/sfx.js"></script>
<script src="assets/site.js"></script>
</body></html>
'''
    (SITE_DIR / f.name).write_text(page, encoding="utf-8"); print("built", f.name, len(page))
