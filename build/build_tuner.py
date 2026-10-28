"""Build Shadow Tuner for SilverApps: indie skin, site strip, linked credit, screen-reader pitch readout.
(No class game — it's a personal practice tool.)
Source: build/src/shadow-tuner.html -> site/shadow-tuner.html      Run: python3 build/build_tuner.py
"""
import re, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from common import *
s = (ROOT / "build" / "src" / "shadow-tuner.html").read_text(encoding="utf-8")
def rep(old, new):
    global s
    assert old in s, old[:70]; s = s.replace(old, new, 1)

s = re.sub(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com/css2\?[^"]*">', "", s, count=1)
s = force_light(s)
s = set_title(s, "Shadow Tuner")
s = before_head_close(s, HEAD_ASSETS + '\n<link rel="stylesheet" href="assets/tuner-skin.css">')
s = after_body_open(s, strip_html(full_screen=False))
# canvases are pictures: give them an image role so their labels are read
rep('<canvas id="meter" aria-label="Cents meter">', '<canvas id="meter" role="img" aria-label="Cents meter: how far your pitch is from the nearest note">')
rep('<canvas id="trace" aria-label="Pitch trace in cents">', '<canvas id="trace" role="img" aria-label="Pitch trace: your tuning in cents over the last 8 seconds">')
# screen-reader readout of the pitch (off by default so it doesn't talk over playing)
rep('<p class="note-text" id="outNote"></p>',
    '<p class="note-text" id="outNote"></p>\n  <div class="start"><button class="ghost" id="srBtn" aria-pressed="false" type="button">Speak readings (screen reader)</button></div>\n'
    '  <p class="sr-only" id="srRead" role="status" aria-live="polite" aria-atomic="true"></p>')

# ---- octave fixes (2026-10-28) ----
# 1. detector: fall back to the deepest dip, then check tau/3 and tau/2 so a sub-octave lag isn't chosen
rep("""    let tau = -1;
    for (let t = tMin; t <= tMax; t++) {
      if (cmnd[t] < 0.12) {
        while (t + 1 <= tMax && cmnd[t + 1] < cmnd[t]) t++;
        tau = t; break;
      }
    }
    if (tau < 0) return { f: 0, db };""",
"""    let tau = -1, best = tMin;
    for (let t = tMin; t <= tMax; t++) {
      if (cmnd[t] < cmnd[best]) best = t;
      if (tau < 0 && cmnd[t] < 0.12) {
        while (t + 1 <= tMax && cmnd[t + 1] < cmnd[t]) t++;
        tau = t;
      }
    }
    if (tau < 0) { if (cmnd[best] < 0.25) tau = best; else return { f: 0, db }; }
    // octave check: YIN favours long lags, so a nearly-as-deep dip at tau/2 or tau/3 is the real pitch
    for (const k of [3, 2]) {
      const c0 = Math.round(tau / k); if (c0 < tMin + 1) continue;
      let mm = c0; for (let t = Math.max(tMin, c0 - 3); t <= Math.min(tMax - 1, c0 + 3); t++) if (cmnd[t] < cmnd[mm]) mm = t;
      if (cmnd[mm] < 0.18 && cmnd[mm] < cmnd[tau] + 0.05) { tau = mm; break; }
    }""")
# 2. tracker: don't let the reference tone (heard back through the mic) or a stray octave/fifth jump move the note
rep("""      const m = 69 + 12 * Math.log2(f / S.a4);
      let cand = Math.round(m);""",
"""      let m = 69 + 12 * Math.log2(f / S.a4);
      const fading = prevDb !== null && db < prevDb - 0.3 && db < S.gate + 15;
      if (cur !== null) {
        if (S.ref && S.octave !== 0 && Math.abs(m - (cur + 12 * S.octave)) < 0.6) m -= 12 * S.octave;   // our own tone coming back
        else for (const k of [12, -12, 24, -24, 19, -19]) {
          if (Math.abs(m - (cur + k)) < 0.6) {
            const r = Math.round(m); if (r === jumpTo) jumpN++; else { jumpTo = r; jumpN = 1; }
            if (fading || jumpN < 10) m -= k;   // a real octave leap must hold ~1/6 s
            break;
          }
        }
      }
      let cand = Math.round(m);""")
rep("""        if (pendN >= (cur === null ? 2 : 3)) {""",
"""        if (pendN >= (cur === null ? 2 : 3) && !fading) {""")
rep("""      lastHeard = now;
      lastMidiF = m;""", """      lastHeard = now;
      lastMidiF = m;
      prevDb = db;""")
rep("""    } else if (cur !== null && now - lastHeard > S.rel * 1000) {""",
"""    } else if ((prevDb = db, cur !== null && now - lastHeard > S.rel * 1000)) {""")
rep("let cur = null, pending = null, pendN = 0,", "let prevDb = null, jumpN = 0, jumpTo = null, cur = null, pending = null, pendN = 0,")

READOUT = r'''
<script>
/* SilverApps: optional spoken pitch readout for screen-reader users (every 2.5 s while a note is held). */
(function(){
  const btn=document.getElementById("srBtn"), out=document.getElementById("srRead"); let on=false, last="";
  btn.onclick=()=>{ on=!on; btn.setAttribute("aria-pressed", on); out.textContent = on ? "Readings on." : "Readings off."; };
  setInterval(()=>{
    if(!on) return;
    const n=document.getElementById("note"); if(!n || n.classList.contains("idle")) return;
    const name=n.childNodes[0] ? n.childNodes[0].textContent.trim() : "", oct=(document.getElementById("oct")||{}).textContent||"";
    const c=(document.getElementById("cents")||{}).firstChild; const cents=c ? c.textContent.trim() : "";
    const v=parseFloat(cents.replace("±","").replace("−","-")); const say=isNaN(v) ? "" : Math.abs(v) < 1 ? "in tune" : `${Math.abs(Math.round(v))} cents ${v>0?"sharp":"flat"}`;
    const t=`${name.replace("♯"," sharp").replace("♭"," flat")}${oct}, ${say}`; if(t!==last){ last=t; out.textContent=t; }
  }, 2500);
})();
</script>'''
s = before_body_close(s, READOUT + "\n" + CREDIT)
(SITE_DIR / "shadow-tuner.html").write_text(s, encoding="utf-8")
print("built shadow-tuner.html", len(s))
