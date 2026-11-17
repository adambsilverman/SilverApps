"""Fill the quiz list in gradebook-sync.html: every Test Yourself page (marked data-sa-quiz="<lesson title>").
Run after the page builds: python3 build/build_quizlist.py"""
import re, json, sys, pathlib, html
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from common import *
out = []
for f in sorted(SITE_DIR.glob("*.html")):
    m = re.search(r'data-sa-quiz="([^"]+)"', f.read_text(encoding="utf-8"))
    if m: out.append({"page": f.stem, "title": html.unescape(m.group(1))})
out.sort(key=lambda q: q["title"].lower())
p = SITE_DIR / "gradebook-sync.html"
s = p.read_text(encoding="utf-8")
s = re.sub(r"/\*QUIZLIST\*/\[.*?\];", lambda m: "/*QUIZLIST*/" + json.dumps(out, ensure_ascii=False) + ";", s, count=1, flags=re.S)
p.write_text(s, encoding="utf-8")
print("quiz list:", len(out), "quizzes")
