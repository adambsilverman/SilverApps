"""Build "Chord Figures and Symbols" (formerly Chord Lab Live) for SilverApps.

Source: build/chordlab/src.html (the app, with /*@@VEXFLOW@@*/ etc. placeholders)
Skin:   site/assets/chordlab-skin.css (indie theme for this app) + site/assets/indie.css
Libs:   VexFlow is inlined (from build/chordlab/vexflow-bravura.js); mqtt + qrcode load from site/assets/.
Output: site/chord-figures-and-symbols.html          Run: python3 build/build_chordlab.py
"""
import re, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from common import *
D = ROOT / "build" / "chordlab"
NAME = "Chord Figures and Symbols"

s = (D / "src.html").read_text(encoding="utf-8")
def rep(old, new, count=1):
    global s
    assert old in s, old[:80]
    s = s.replace(old, new) if count == 0 else s.replace(old, new, count)

# --- name ---
rep("<title>Chord Lab Live — by Adam Silverman</title>", f"<title>{NAME} · {SITE}</title>")
rep('content="Chord Lab Live: a class theory game made by Adam Silverman."', f'content="{NAME}: a class theory game by Adam Silverman — part of {SITE}."')
rep('<button class="brand" id="brandbtn" title="Main screen"><div class="logo">♮</div><span>Chord Lab Live</span></button>',
    '<a class="brand" id="brandbtn" href="index.html" aria-label="SilverApps for Music Training — all SilverApps"><div class="logo" aria-hidden="true">♮</div><span>SilverApps<span class="lbl-long"> for Music Training</span></span></a>')
rep("$('#brandbtn').onclick = goHome;", "")
rep("<h1>Chords, figures & symbols — live.</h1>", f"<h1>{NAME}</h1>")
# --- link back to the front page from the app's own top bar ---
rep('<button class="fsbtn" id="homebtn"', '<a class="fsbtn" href="index.html" title="All SilverApps"><span aria-hidden="true">▦</span><span>All SilverApps</span></a>\n  <button class="fsbtn" id="homebtn"')
# --- answer sounds toggle in the app's top bar ---
rep('<a class="fsbtn" href="index.html"', '<button class="fsbtn" data-sfx aria-pressed="true" type="button" aria-label="Answer sounds on"><span aria-hidden="true">♪</span><span class="lbl">Sound on</span></button>\n  <a class="fsbtn" href="index.html"')
# --- progress record + sounds at each graded answer ---
rep("const g = grade(q, ans); log.push(g.ok);", "const g = grade(q, ans); log.push(g.ok); window.SFX && SFX.play(g.ok); window.SAprogress && SAprogress.record(DRILLS[q.drill].short, g.ok);")
rep("const g = grade(q, ans); P.n++; if (g.ok) P.score++;", "const g = grade(q, ans); P.n++; if (g.ok) P.score++; window.SFX && SFX.play(g.ok); window.SAprogress && SAprogress.record(DRILLS[q.drill].short, g.ok);")
rep("    if (g) S.mine[q.id] = g.ok;", "    if (g) { S.mine[q.id] = g.ok; window.SFX && SFX.play(g.ok); window.SAprogress && SAprogress.record('Class game · ' + DRILLS[q.drill].short, g.ok); }")
# --- credit links to adambsilverman.com ---
rep('<div class="wm" aria-label="Made by Adam Silverman"><span class="wm-n">♮</span> Made by <b>Adam Silverman</b></div>',
    '<a class="wm" href="https://adambsilverman.com" target="_blank" rel="noopener"><span class="wm-n" aria-hidden="true">♮</span> Made by <b>Adam Silverman</b><span class="sr-only"> (opens adambsilverman.com in a new tab)</span></a>')
# --- GitHub hosting: no D2L wording ---
s = re.sub(r"\$\{window\.top !== window\.self \? `<p class=\"notice\".*?: ''\}", "", s, count=1, flags=re.S)
rep("On your phone, open this same game in D2L${url?' — or scan the QR code':''}.", "On your phone, open this page${url?' — or scan the QR code':''}.")
rep("Scan to join (you may need to sign in to D2L)", "Scan to join")
rep("QR code appears when the game is opened from D2L or a web address.", "QR code appears when the game is opened from a web address.")
rep("// e.g. inside a D2L frame that blocks full screen", "// e.g. inside a frame that blocks full screen")
# --- staff figures in the display face ---
rep("""const FONT = '"Young Serif", Georgia, "Times New Roman", serif';""", """const FONT = '"League Gothic", "Arial Narrow", Impact, sans-serif';""")
# --- shared stylesheet + skin, light only ---
s = force_light(s)
s = before_head_close(s, HEAD_ASSETS + '\n<link rel="stylesheet" href="assets/chordlab-skin.css">')
# --- libraries ---
vex = (D / "vexflow-bravura.js").read_text(encoding="utf-8")
vex = re.sub(r"//# sourceMappingURL=.*", "", vex).replace("</script", "<\\/script")
rep("<script>/*@@VEXFLOW@@*/</script>", "<script>" + vex + "</script>")
rep("<script>/*@@MQTT@@*/</script>", '<script src="assets/mqtt.min.js"></script>')
rep("<script>/*@@QRCODE@@*/</script>", '<script src="assets/qrcode.js"></script>\n' + PROGRESS_SCRIPTS)
assert "@@" not in s.replace("/*@@FONTS@@*/", "")
s = s.replace("/*@@FONTS@@*/", "")   # fonts now come from assets/indie.css
s = before_body_close(s, '<script>SAprogress.init({ id: "chordfig", name: "Chord Figures and Symbols" });</script>')
(SITE_DIR / "chord-figures-and-symbols.html").write_text(s, encoding="utf-8")
print("built chord-figures-and-symbols.html", len(s))
