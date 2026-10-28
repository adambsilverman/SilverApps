"""Shared bits for the SilverApps build scripts (site strip, credit, head tags)."""
import re

SITE = "SilverApps for Music Training"

import pathlib as _pl
ROOT = _pl.Path(__file__).resolve().parent.parent          # the "Music Apps" folder
# Pages are written to ROOT (the folder you upload to GitHub). In the original dev setup they went to ROOT/site.
SITE_DIR = ROOT / "site" if (ROOT / "site").is_dir() else ROOT

def strip_html(full_screen=True, sound=False):
    fs = ('<button class="site-btn" data-fs aria-pressed="false" type="button" aria-label="Full screen">'
          '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>'
          '<span class="lbl">Full screen</span></button>') if full_screen else ""
    snd = ('<button class="site-btn" data-sfx aria-pressed="true" type="button" aria-label="Answer sounds on">'
           '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/></svg>'
           '<span class="lbl">Sound on</span></button>') if sound else ""
    return ('<header class="site-strip" role="banner"><a class="site-home" href="index.html" aria-label="SilverApps for Music Training — all SilverApps">'
            '<span class="mk" aria-hidden="true">♮</span><span>SilverApps<span class="lbl-long"> for Music Training</span></span></a>'
            '<span class="spacer"></span><a class="site-btn" href="index.html" aria-label="All SilverApps"><span aria-hidden="true">▦</span><span class="lbl">All SilverApps</span></a>'
            + snd + fs + '</header>')

CREDIT = ('<footer class="fi-credit"><a href="https://adambsilverman.com" target="_blank" rel="noopener">'
          '<span class="mk" aria-hidden="true">♮</span>Made by <b>Adam Silverman</b><span class="sr-only"> (opens adambsilverman.com in a new tab)</span></a></footer>'
          '<div class="fi-filmstrip" aria-hidden="true"></div>')

HEAD_ASSETS = '<link rel="stylesheet" href="assets/indie.css">'

def set_title(s, title):
    full = f"{title} · {SITE}"
    if re.search(r"<title>.*?</title>", s, re.S):
        return re.sub(r"<title>.*?</title>", f"<title>{full}</title>", s, count=1, flags=re.S)
    return s.replace("<head>", f"<head>\n<title>{full}</title>", 1)

def force_light(s):
    return re.sub(r"<html([^>]*)>", lambda m: "<html" + re.sub(r'\sdata-theme="[^"]*"', "", m.group(1)) + ' data-theme="light">', s, count=1)

def after_body_open(s, html):
    m = re.search(r"<body[^>]*>", s)
    return s[:m.end()] + "\n" + html + "\n" + s[m.end():]

def before_body_close(s, html):
    i = s.rindex("</body>")
    return s[:i] + html + "\n" + s[i:]

def before_head_close(s, html):
    i = s.index("</head>")
    return s[:i] + html + "\n" + s[i:]

PROGRESS_SCRIPTS = '<script src="assets/progress.js"></script>\n<script src="assets/sfx.js"></script>\n'
