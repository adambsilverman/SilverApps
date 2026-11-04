"""Build Orchestration Foreign Terms for SilverApps (GitHub-hosted, indie skin, no D2L wording).
Source: build/src/Orchestration Foreign Terms.html  ->  site/orchestration-foreign-terms.html
Run: python3 build/build_foreign_terms.py
"""
import re, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from common import *
s = (ROOT / "build" / "src" / "Orchestration Foreign Terms.html").read_text(encoding="utf-8")

def rep(old, new, regex=False):
    global s
    if regex:
        n = len(re.findall(old, s, flags=re.S)); assert n, old[:70]; s = re.sub(old, new, s, flags=re.S)
    else:
        assert old in s, old[:70]; s = s.replace(old, new)

# ---- GitHub hosting: drop the D2L sign-in requirements ----
rep(r'<p class="notice"><b>Sign in to D2L first\.</b>.*?</p>', "", True)
rep(r'\$\{FRAMED\?`<p class="notice">Running inside D2L\?.*?`:""\}', "", True)
rep(r'<li><b>Sign in to D2L</b>[^<]*</li>\s*', "", True)
rep("from the course page${qrSvg?", "on your phone${qrSvg?")
rep("Scan to join. Sign in to D2L on your phone first.", "Scan to join.")
rep("A QR code appears when the game is opened from D2L or another web address.", "A QR code appears when the game is opened from a web address.")
rep(r'<p class="notice"><b>Signed in to D2L on this device\?</b>.*?</p>', "", True)
rep("Make sure you’re signed in to D2L on this device and connected to the internet", "Make sure you’re connected to the internet")
rep("Terms from the course page <i>Instrument Terms in Four Languages</i>.", "Terms from <i>Instrument Terms in Four Languages</i>.")
s = s.replace("Run a live game with the whole class on their phones", "Run it live with a whole class on student devices")
s = s.replace("same question on their phones", "same question on student devices")
s = s.replace("Run a live game with the whole class on their phones", "Run it live with a whole class on student devices")
s = s.replace("term on their phones.", "term on their devices.")
s = s.replace('<p class="eyebrow">MTC 341/541 · Orchestration</p>', '<p class="eyebrow">Orchestration</p>')
assert "on their phones" not in s, "phones wording left"
assert not re.search(r"MTC ?\d{3}", re.sub(r"<script>\"use strict\";var mqtt.*?</script>", "", s, flags=re.S)), "course code left"
assert "D2L" not in re.sub(r"<script>\"use strict\";var mqtt.*?</script>", "", s, flags=re.S), "D2L text left"

# ---- progress record + sounds at each graded answer ----
rep("const rev=revealOf(q); const g=grade(q,ans,rev);\n    G.ctl.mark(rev,ans);", "const rev=revealOf(q); const g=grade(q,ans,rev); window.SFX&&SFX.play(g.ok); window.SAprogress&&SAprogress.record(q.fam,g.ok);\n    G.ctl.mark(rev,ans);")
rep("if(mine!=null) S.mine[q.id]=g.ok;", "if(mine!=null){ S.mine[q.id]=g.ok; window.SFX&&SFX.play(g.ok); window.SAprogress&&SAprogress.record('Class game · '+q.fam,g.ok); }")
rep("P.n++;const g=grade(q,ans,revealOf(q));if(g.ok)P.score++;", "P.n++;const g=grade(q,ans,revealOf(q));if(g.ok)P.score++; window.SFX&&SFX.play(g.ok); window.SAprogress&&SAprogress.record(q.fam,g.ok);")

# ---- "thinking music": shaker loop while a question is open (solo practice, and the host's screen in a class game; not on student phones) ----
rep("  return ctl;\n}\nfunction rowcardHTML", "  if(o.shaker&&window.Shaker){const el=box.firstElementChild;Shaker.watch(()=>!locked&&!!el&&el.isConnected)}\n  return ctl;\n}\nfunction rowcardHTML")
rep('G.ctl=renderQ(st.querySelector("[data-q]"),q,{giveUp:true,onSubmit:', 'G.ctl=renderQ(st.querySelector("[data-q]"),q,{giveUp:true,shaker:true,onSubmit:')
rep('const ctl=renderQ(app.querySelector("[data-q]"),q,{display:true});', 'const ctl=renderQ(app.querySelector("[data-q]"),q,{display:true,shaker:!r}); if(r) ctl.lock();')

# ---- alternate acceptable answers (typed mode only; the answer key and prompts are unchanged) ----
rep("function gradeTyped(list,v){\n  v=(v||\"\").trim(); if(!v) return {ok:false};", """/* other common names that count as correct when typed (keys are entries in D) */
const ALT = {
  "strings":["string instruments","string section","string"],
  "violin":["fiddle"],
  "violoncello":["cello","cellos"],
  "double bass":["bass","contrabass","upright bass","string bass"],
  "string bass":["bass","contrabass","upright bass","double bass"],
  "mute on":["with mute","with mutes","muted","mute","mutes on","con sordino"],
  "wind instruments":["winds","wind","wind instrument"],
  "woodwind instruments":["woodwinds","woodwind","woodwind instrument","winds","wind"],
  "piccolo":["piccolo flute"],
  "English horn":["cor anglais"],
  "saxophone":["sax"],
  "fluttertongue":["flutter tongue","flutter tonguing","fluttertonguing","flutter"],
  "brass instruments":["brass","brass instrument"],
  "horn":["French horn"],
  "keyboard instrument":["keyboard instruments","keyboards","keyboard"],
  "piano":["pianoforte"],
  "organ":["pipe organ"],
  "celesta":["celeste"],
  "percussion instruments":["percussion","percussion instrument"],
  "cymbals":["cymbal","crash cymbals","clash cymbals"],
  "drum":["drums"],
  "glockenspiel":["orchestra bells","bells"],
  "snare drum":["snare","side drum"],
  "timpani":["kettledrums","kettle drums","kettledrum","timpano"],
  "tubular bells":["chimes"],
  "bassoon":["bassoons"],
  "violoncelle":["cello"],
  "Violoncello":["Cello"],
};
function gradeTyped(list,v){
  v=(v||"").trim(); if(!v) return {ok:false};
  list=list.flatMap(a=>[a,...(ALT[a]||[])]);""")

# ---- look ----
s = re.sub(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com/css2\?[^"]*">', "", s, count=1)
s = force_light(s)
s = set_title(s, "Orchestration Foreign Terms")
s = before_head_close(s, HEAD_ASSETS + '\n<link rel="stylesheet" href="assets/foreign-terms-skin.css">')
s = after_body_open(s, strip_html(full_screen=False, sound=True))
rep(r'<p class="credit"><span class="mk" aria-hidden="true">♮</span>Made by <b>Adam Silverman</b></p>', "", True)
s = before_body_close(s, PROGRESS_SCRIPTS + '<script>SAprogress.init({ id: "foreignterms", name: "Orchestration Foreign Terms", before: ".fi-credit" });</script>\n' + CREDIT)
s = before_body_close(s, '<script src="assets/site.js"></script>\n<script src="assets/shaker.js"></script>')
(SITE_DIR / "orchestration-foreign-terms.html").write_text(s, encoding="utf-8")
print("built orchestration-foreign-terms.html", len(s))
