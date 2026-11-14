"""Fill the quiz list in gradebook-sync.html: every lesson page with a "Test yourself" quiz.
Runs after externalize.py (the quiz data lives in assets/shared/data-*.js). Run: python3 build/build_quizlist.py"""
import re, json, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from common import *
out = []
for f in sorted(SITE_DIR.glob("*.html")):
    s = f.read_text(encoding="utf-8")
    has = 'id="saqBox"' in s
    if not has and re.search(r'SA_PAGE\s*=\s*\{\s*view:\s*"lesson"', s):
        srcs = [s] + [(SITE_DIR / m.split("?")[0]).read_text(encoding="utf-8") for m in re.findall(r'<script src="(assets/shared/data-[^"]+)"', s) if (SITE_DIR / m.split("?")[0]).exists()]
        has = any("window.FAM.quiz" in t for t in srcs)
    if has:
        t = re.search(r"<title>(.*?)</title>", s, re.S).group(1).split(" · ")[0].strip()
        out.append({"page": f.stem, "title": t})
out.sort(key=lambda q: q["title"].lower())
p = SITE_DIR / "gradebook-sync.html"
s = p.read_text(encoding="utf-8")
s2 = re.sub(r"/\*QUIZLIST\*/\[.*?\];", lambda m: "/*QUIZLIST*/" + json.dumps(out, ensure_ascii=False) + ";", s, count=1, flags=re.S)
assert s2 != s or "/*QUIZLIST*/" + json.dumps(out, ensure_ascii=False) in s
p.write_text(s2, encoding="utf-8")
print("quiz list:", len(out), "quizzes")
