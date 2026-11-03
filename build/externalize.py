"""Move code that many pages share into cached files in assets/shared/.

The page builders inline everything (VexFlow, the lesson/drill engine, styles, each app's lesson data), which made
every page about 1.2 MB. This step finds inline <script> and <style> blocks of at least MIN characters that appear
in two or more built pages, writes each once to assets/shared/<name>.<hash>.js|css, and replaces the inline copies
with <script src> / <link rel="stylesheet">. File names carry a content hash, so browsers cache them across pages and
fetch a new copy only when the content changes. Order of execution is unchanged (plain, non-deferred script tags).

Runs after the page builders and before cachebust.py.   Run: python3 build/externalize.py
"""
import re, hashlib, collections, pathlib, shutil

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "shared"
MIN = 8000
SCRIPT = re.compile(r"<script>(.*?)</script>", re.S)   # plain inline scripts only (no src, no type)
STYLE = re.compile(r"<style>(.*?)</style>", re.S)

pages = sorted(ROOT.glob("*.html"))
text = {p: p.read_text(encoding="utf-8") for p in pages}
uses = collections.defaultdict(set)   # (kind, content) -> pages using it
for p, s in text.items():
    for kind, rx in (("js", SCRIPT), ("css", STYLE)):
        for m in rx.finditer(s):
            if len(m.group(1)) >= MIN: uses[(kind, m.group(1))].add(p)

def name_of(kind, body, users):
    if kind == "js":
        if "Vex.Flow" in body[:3000] or "VexFlow" in body[:3000]: return "vexflow"
        if "SilverApps bridge" in body: return "app-engine"
        stem = min(u.stem for u in users).replace("-lesson", "")
        return "data-" + stem
    return "styles-" + ("apps" if len(users) > 20 else min(u.stem for u in users).replace("-lesson", ""))

if OUT.exists(): shutil.rmtree(OUT)
OUT.mkdir(parents=True)
shared = {}
for (kind, body), users in uses.items():
    if len(users) < 2: continue
    h = hashlib.md5(body.encode("utf-8")).hexdigest()[:10]
    fn = f"{name_of(kind, body, users)}.{h}.{kind}"
    (OUT / fn).write_text(body, encoding="utf-8")
    shared[(kind, body)] = "assets/shared/" + fn

for p, s in text.items():
    n = SCRIPT.sub(lambda m: f'<script src="{shared[("js", m.group(1))]}"></script>' if ("js", m.group(1)) in shared else m.group(0), s)
    n = STYLE.sub(lambda m: f'<link rel="stylesheet" href="{shared[("css", m.group(1))]}">' if ("css", m.group(1)) in shared else m.group(0), n)
    if n != s: p.write_text(n, encoding="utf-8")

total_before = sum(len(s) for s in text.values()); total_after = sum(p.stat().st_size for p in pages)
print(f"externalized {len(shared)} shared blocks into assets/shared/; pages {total_before / 1e6:.1f} MB -> {total_after / 1e6:.1f} MB")
