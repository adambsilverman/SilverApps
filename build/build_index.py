"""Build the SilverApps front page (site/index.html) from build/apps.json.   Run: python3 build/build_index.py"""
import json, sys, pathlib, html
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from common import *
cfg = json.loads((ROOT / "build" / "apps.json").read_text(encoding="utf-8"))
e = html.escape
HOW = """<ul class="how"><li><b>Practice solo</b>Open any drill and start: it explains each answer and brings missed items back for review.</li>
      <li><b>Host a class game</b>On the projector, open a drill and choose <i>Host a class game</i>. You pick each question; the class answers anonymously.</li>
      <li><b>Join from any device</b>On a phone, tablet or laptop, open the same drill, tap <i>Join a game</i>, and enter the room code (or scan the QR code).</li></ul>"""
def card(t, color):
    btns = []
    if t.get("lesson"): btns.append(f'<a class="btn" href="{e(t["lesson"])}">Lesson<span class="sr">: {e(t["name"])}</span></a>')
    if t.get("drills"): btns.append(f'<a class="btn" href="{e(t["drills"])}">Drills<span class="sr">: {e(t["name"])}</span></a>')
    if t.get("open"): btns.append(f'<a class="btn" href="{e(t["open"])}">Open<span class="sr"> {e(t["name"])}</span></a>')
    note = t.get("note") or ("Drills include a class game" if t.get("class") else "")
    words = " ".join([t["name"], t["topic"], t["blurb"]]).lower()
    return f'''<li class="card t-{color}" data-q="{e(words)}"><div class="cname"><span class="course">{e(t["topic"])}</span>
        <h3 class="tname">{e(t["name"])}</h3></div><div class="cinfo"><p class="blurb">{e(t["blurb"])}</p>{f'<p class="note">{e(note)}</p>' if note else ""}</div>
        <div class="btns">{"".join(btns)}</div></li>'''
tiles = []
for sec in cfg["sections"]:
    tiles.append(f'''<section class="group" id="{sec["id"]}" aria-labelledby="h-{sec["id"]}"><h2 id="h-{sec["id"]}"><span class="dot t-{sec["color"]}" aria-hidden="true"></span>{e(sec["title"])}</h2>
      <ul class="tiles">{"".join(card(t, sec["color"]) for t in sec["topics"])}</ul></section>''')
jump = "".join(f'<li><a href="#{s["id"]}"><span class="dot t-{s["color"]}" aria-hidden="true"></span>{e(s["title"])}</a></li>' for s in cfg["sections"])
SEARCH_JS = """<script>
(function () {
  var box = document.getElementById("find"), out = document.getElementById("findCount");
  if (!box) return;
  box.addEventListener("input", function () {
    var q = box.value.trim().toLowerCase(), n = 0;
    document.querySelectorAll(".card").forEach(function (c) { var hit = !q || c.getAttribute("data-q").indexOf(q) >= 0; c.hidden = !hit; if (hit) n++; });
    document.querySelectorAll(".group").forEach(function (g) { g.hidden = !g.querySelector(".card:not([hidden])"); });
    out.textContent = q ? (n ? n + (n === 1 ? " topic matches." : " topics match.") : "No topics match. Try another word.") : "";
  });
})();
</script>"""

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
.how{{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:12px 0 6px;padding:0;list-style:none}}
.how li{{background:var(--fi-card);border:1.5px solid var(--fi-line);border-radius:var(--fi-r);padding:14px 16px;line-height:1.5}}
.how b{{display:block;font-family:var(--fi-display);font-weight:400;font-size:28px;line-height:1;margin-bottom:4px}}
@media (max-width:760px){{.how{{grid-template-columns:1fr}}}}
.tools{{display:flex;flex-wrap:wrap;gap:12px 20px;align-items:center;margin:22px 0 0;padding:14px 0;border-top:2px solid var(--fi-red);border-bottom:1px solid var(--fi-soft)}}
.jump{{display:flex;flex-wrap:wrap;gap:8px;list-style:none;margin:0;padding:0;flex:1 1 520px}}
.jump a{{display:inline-flex;align-items:center;gap:7px;min-height:40px;padding:4px 14px;border:1.5px solid var(--fi-line);border-radius:var(--fi-pill);background:var(--fi-card);color:var(--fi-ink);font:700 15px var(--fi-ui);text-decoration:none}}
.jump a:hover{{background:var(--fi-gray)}}
.jump a:focus-visible,.find input:focus-visible,.btn:focus-visible,.inst summary:focus-visible{{outline:3px solid var(--fi-red-dk);outline-offset:2px}}
.dot{{display:inline-block;width:14px;height:14px;border-radius:50%;flex:none;border:1.5px solid var(--fi-ink)}}
.find{{display:flex;flex-direction:column;gap:4px;flex:0 1 300px}}
@media (max-width:640px){{.find{{order:-1;flex:1 1 100%}}}}
.find label{{font:700 14px var(--fi-ui);text-transform:uppercase;letter-spacing:.04em}}
.find input{{font:17px var(--fi-serif);padding:9px 14px;border:1.5px solid var(--fi-ink);border-radius:var(--fi-pill);background:var(--fi-card);color:var(--fi-ink);min-height:44px;box-sizing:border-box;width:100%}}
.count{{margin:6px 0 0;min-height:1.2em;font-weight:700}}
.inst{{margin:14px 0 0;border:1.5px solid var(--fi-line);border-radius:var(--fi-r);background:var(--fi-card);padding:0 16px}}
.inst summary{{cursor:pointer;padding:12px 0;font:700 16px var(--fi-ui);text-transform:uppercase;letter-spacing:.03em}}
.inst p{{margin:4px 0 12px;line-height:1.5}}
.group h2{{display:flex;align-items:center;gap:12px;font-family:var(--fi-display);font-weight:400;font-size:clamp(38px,5vw,54px);margin:34px 0 12px;line-height:.95}}
.group h2 .dot{{width:22px;height:22px}}
.group{{scroll-margin-top:90px}}
.tiles{{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}}
.card{{box-sizing:border-box;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.5fr) 220px;align-items:center;gap:6px 22px;padding:12px 18px;border-radius:var(--fi-r);box-shadow:var(--fi-shadow)}}
.cname{{display:flex;flex-direction:column;gap:2px}} .cinfo{{display:flex;flex-direction:column;gap:4px}}
@media (max-width:820px){{.card{{grid-template-columns:1fr;gap:8px}}}}
.card[hidden],.group[hidden]{{display:none}}
.t-red{{background:var(--fi-red);color:#000}} .t-green{{background:var(--fi-green);color:#000}} .t-black{{background:var(--fi-navy);color:#fff}} .t-purple{{background:var(--fi-purple);color:#fff}}
.course{{font-size:13px;text-transform:uppercase}}
.tname{{font-family:var(--fi-display);font-weight:400;font-size:28px;line-height:1;margin:0}}
.blurb{{line-height:1.4;margin:0}}
.btns{{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end}} @media (max-width:820px){{.btns{{justify-content:flex-start}}}}
.btn{{display:inline-flex;align-items:center;justify-content:center;min-height:44px;min-width:96px;padding:0 18px;border-radius:var(--fi-pill);border:2px solid currentColor;color:inherit;text-decoration:none;font:700 15px var(--fi-ui);text-transform:uppercase;letter-spacing:.03em;box-sizing:border-box}}
.btn:hover{{background:rgba(255,255,255,.35)}} .t-black .btn:hover,.t-purple .btn:hover{{background:rgba(255,255,255,.18)}}
.btn:first-child{{background:var(--fi-card);color:var(--fi-ink);border-color:var(--fi-card)}}
.note{{margin:0;font-size:13px;opacity:.9}}
.sr{{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}}
.prof{{margin:34px 0 0;padding-top:12px;border-top:1px solid var(--fi-soft);color:var(--fi-muted)}}
.prof a{{color:var(--fi-red-dk);font-weight:700}}
</style>
</head>
<body>
{strip_html(full_screen=False)}
<main id="main">
  <section class="hero"><h1>SilverApps <span>for Music Training</span></h1>
    <p>Apps for review, practice and skill building in music theory, ear training and performance. Each topic has an interactive lesson, drills with instant feedback, or both. Every drill can also run live as a class game on student devices.</p>
  </section>
  <nav class="tools" aria-label="Topics">
    <ul class="jump">{jump}</ul>
    <div class="find" role="search"><label for="find">Find a topic</label><input id="find" type="search" placeholder="e.g. cadence, modes, strings" autocomplete="off"></div>
  </nav>
  <p class="count" id="findCount" aria-live="polite"></p>
  <details class="inst"><summary>For instructors: running a class game</summary>{HOW}<p>Students can also make a completion report in any drill (“Your progress” panel). <a href="verify.html">Check a student's report</a>.</p></details>
  {"".join(tiles)}
  <p class="prof">Privacy: this site may count visits anonymously (which app, and the approximate city, state and country) to see how it is used. It sets no cookies and records no names; progress and completion reports stay on your own device until you choose to send them.</p>
  <p class="prof">© 2025–2026 Adam Silverman. Shared under <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" rel="license">CC BY-NC-SA 4.0</a>: free to use and adapt for non-commercial teaching with credit to Adam Silverman (adambsilverman.com). See LICENSE.md.</p>
</main>
{CREDIT}
{SEARCH_JS}
</body>
</html>
'''
(SITE_DIR / "index.html").write_text(page, encoding="utf-8")
print("built index.html")
