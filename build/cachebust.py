"""Add ?v=<md5> to every local script (assets/*.js) referenced without one in the built pages, so browsers fetch changed files."""
import re, hashlib, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
for f in ROOT.glob("*.html"):
    s = f.read_text(encoding="utf-8")
    n = re.sub(r'(src="(assets/[\w.-]+\.js))(")', lambda m: m.group(1) + "?v=" + hashlib.md5((ROOT / m.group(2)).read_bytes()).hexdigest()[:8] + m.group(3) if (ROOT / m.group(2)).exists() else m.group(0), s)
    if n != s: f.write_text(n, encoding="utf-8"); print("cache-busted", f.name)
