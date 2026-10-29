"""Build the SilverApps front page (site/index.html) from build/apps.json.   Run: python3 build/build_index.py"""
import json, sys, pathlib, html
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from common import *
cfg = json.loads((ROOT / "build" / "apps.json").read_text(encoding="utf-8"))
e = html.escape
COLORS = ["red", "green", "black", "purple"]

tiles, k = [], 0
HOW = """<ul class="how"><li><b>Practice solo</b>Open any app and start — it explains each answer and brings missed items back for review.</li>
      <li><b>Host a class game</b>On the projector, open an app and choose <i>Host a class game</i>. You pick each question; the class answers anonymously.</li>
      <li><b>Join from any device</b>On a phone, tablet or laptop, open the same app, tap <i>Join a game</i>, and enter the room code (or scan the QR code).</li></ul>"""
def group_html(g, n, level):
    global k
    cards = []
    for a in g["apps"]:
        c = COLORS[k % len(COLORS)]; k += 1
        badge = f'<span class="badge">{e(a["badge"])}</span>' if a.get("badge") else ('<span class="badge">Solo + class game</span>' if a["class"] else '<span class="badge">Solo tool</span>')
        cards.append(f'''<li><a class="tile t-{c}" href="{e(a["file"])}"><span class="course">{e(a["topic"])}</span>
          <span class="tname">{e(a["name"])}</span><span class="blurb">{e(a["blurb"])}</span>{badge}<span class="go" aria-hidden="true">Open ▸</span></a></li>''')
    return f'''<section class="group {'sub' if level == 3 else ''}" aria-labelledby="g{n}"><h{level} id="g{n}">{e(g["title"])}</h{level}>
      <ul class="tiles">{"".join(cards)}</ul></section>'''
done = set()
for n, g in enumerate(cfg["groups"]):
    kind = "drills" if g.get("drills") else "lessons" if g.get("lessons") else None
    if kind:
        if kind not in done:
            done.add(kind)
            subs = [x for x in cfg["groups"] if x.get(kind)]
            inner = "".join(group_html(x, f"{n}-{i}", 3) for i, x in enumerate(subs))
            if kind == "drills":
                tiles.append(f'''<section class="drills" aria-labelledby="gdrills"><h2 id="gdrills">Drills and Games</h2>
      <p class="lead">Every drill works three ways:</p>{HOW}{inner}</section>''')
            else:
                tiles.append(f'''<section class="drills lessons" aria-labelledby="glessons"><h2 id="glessons">Lessons</h2>
      <p class="lead">Step-by-step interactive lessons with examples to see and hear. Each one links to its drills.</p>{inner}</section>''')
        continue
    tiles.append(group_html(g, n, 2))

page = f'''<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(cfg["site"])}</title>
<meta name="description" content="Apps for review, practice and skill building in music theory, ear training and performance, by Adam Silverman. Practice solo or play together as a live class game.">
{HEAD_ASSETS}
<style>
body{{margin:0;background:var(--fi-paper);color:var(--fi-ink);font-family:var(--fi-serif)}}
main{{max-width:1120px;margin:0 auto;padding:26px 16px 10px}}
.hero{{border-top:2px solid var(--fi-red);padding-top:16px}}
.hero h1{{font-family:var(--fi-title);font-weight:400;font-size:clamp(52px,9vw,108px);line-height:1.02;margin:0}}
.hero h1 span{{color:var(--fi-red-dk)}}
.hero p{{font-size:19px;max-width:62ch;line-height:1.55;margin:14px 0 0}}
.how{{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:22px 0 6px;padding:0;list-style:none}}
.how li{{background:var(--fi-card);border:1.5px solid var(--fi-line);border-radius:var(--fi-r);padding:14px 16px;box-shadow:var(--fi-shadow);line-height:1.5}}
.how b{{display:block;font-family:var(--fi-display);font-weight:400;font-size:30px;line-height:1;margin-bottom:4px}}
@media (max-width:760px){{.how{{grid-template-columns:1fr}}}}
.drills>h2{{font-family:var(--fi-display);font-weight:400;font-size:clamp(46px,6vw,70px);margin:40px 0 4px;border-top:2px solid var(--fi-red);padding-top:10px;line-height:.95}}
.lead{{margin:6px 0 0;font-size:18px}}
.group.sub h3{{font-family:var(--fi-display);font-weight:400;font-size:clamp(34px,4vw,46px);margin:30px 0 12px;line-height:.95}}
.group h2{{font-family:var(--fi-display);font-weight:400;font-size:clamp(40px,5vw,58px);margin:34px 0 12px;border-top:2px solid var(--fi-red);padding-top:10px;line-height:.95}}
.tiles{{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}}
.tile{{box-sizing:border-box;display:flex;flex-direction:column;gap:8px;height:100%;padding:20px;border-radius:var(--fi-r);text-decoration:none;color:var(--fi-ink);box-shadow:var(--fi-shadow);transition:transform .12s, box-shadow .12s}}
.tile:hover,.tile:focus-visible{{transform:translateY(-3px);box-shadow:0 14px 28px -12px rgba(40,25,10,.55)}}
.tile:focus-visible{{outline:3px solid var(--fi-red-dk);outline-offset:3px}}
.t-red{{background:var(--fi-red);color:#000}} .t-green{{background:var(--fi-green)}} .t-black{{background:var(--fi-navy);color:#fff}} .t-purple{{background:var(--fi-purple);color:#fff}}
.course{{font-size:14px;text-transform:uppercase}}
.tname{{font-family:var(--fi-display);font-size:42px;line-height:.95}}
.blurb{{line-height:1.5;flex:1}}
.badge{{align-self:flex-start;border:1.5px solid currentColor;border-radius:var(--fi-pill);padding:3px 10px;font-weight:700;font-size:14px;text-transform:uppercase}}
.go{{font:700 15px var(--fi-ui);text-transform:uppercase;letter-spacing:.03em}}
.prof{{margin:34px 0 0;padding-top:12px;border-top:1px solid var(--fi-soft);color:var(--fi-muted)}}
.prof a{{color:var(--fi-red-dk);font-weight:700}}
</style>
</head>
<body>
{strip_html(full_screen=False)}
<main id="main">
  <section class="hero"><h1>SilverApps <span>for Music Training</span></h1>
    <p>Apps for review, practice and skill building in music theory, ear training and performance. Practice on your own with instant feedback, or run any trainer live with a whole class on student devices.</p>
  </section>
  {"".join(tiles)}
  <p class="prof">For instructors: students can make a completion report in any trainer ("Your progress" panel). <a href="verify.html">Check a student's report</a>.</p>
  <p class="prof">Privacy: this site may count visits anonymously (which app, and the approximate city, state and country) to see how it is used. It sets no cookies and records no names; progress and completion reports stay on your own device until you choose to send them.</p>
  <p class="prof">© 2025–2026 Adam Silverman. Shared under <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" rel="license">CC BY-NC-SA 4.0</a>: free to use and adapt for non-commercial teaching with credit to Adam Silverman (adambsilverman.com). See LICENSE.md.</p>
</main>
{CREDIT}
</body>
</html>
'''
(SITE_DIR / "index.html").write_text(page, encoding="utf-8")
print("built index.html")
