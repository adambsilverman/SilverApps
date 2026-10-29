"""Assemble the harmony / voice-leading apps into build/src/*.html (then build_trainers.py adds the site look + class game).
Each page = the Modes Trainer's CSS + transposition/extra.css + EXTRA below + a body with a Lesson view and a Drills view
+ VexFlow + <app>.js (content: lesson steps, question makers, reference) + engine.js (shared logic)."""
import pathlib, html
B = pathlib.Path(__file__).resolve().parent; SRC = B.parent / "src"
src = (SRC / "Modes Trainer.html").read_text(encoding="utf-8").split("\n")
HEAD = "\n".join(src[:229]); VEX = "\n".join(src[351:360])
assert HEAD.rstrip().endswith("</style>") and VEX.startswith("<script>")
HEAD = HEAD.replace(".modes button:first-child { grid-column: 1 / -1; }\n", "")
EXTRA = (B.parent / "transposition" / "extra.css").read_text(encoding="utf-8") + (B / "extra.css").read_text(encoding="utf-8")

APPS = [
  dict(src="Secondary Function Chords.html", data="secondary.js", title="Secondary Function Chords",
       desc="Tell secondary dominants, secondary leading-tone chords and secondary pre-dominants apart: name the chord, read its quality, find its target and write the Roman numeral.",
       modes=[("func", "Function", "dominant · leading-tone · pre-dominant", "what kind of secondary chord is it?"),
              ("label", "Label it", "chord symbol → Roman numeral", "write the full Roman numeral for a chord symbol"),
              ("staff", "On the staff", "find the target", "label the highlighted chord in a progression"),
              ("spell", "Spell it", "Roman numeral → chord", "choose the chord a Roman numeral stands for")],
       how=["<b>Name the chord</b> (stack the notes in thirds; slash = bass note).",
            "<b>Read its quality:</b> major or 7 (dom7) → secondary dominant; °7 → secondary leading-tone; minor or ø7 → secondary pre-dominant.",
            "<b>Find its target:</b> dominant → a P4 above the root; leading-tone → a m2 above; pre-dominant → a M2 below.",
            "<b>Add the figures</b> for inversions: 6, 6/4 for triads; 7, 6/5, 4/3, 4/2 for seventh chords."]),
  dict(src="Chromatic Chords.html", data=["mixture.js", "neapolitan.js", "aug6.js", "chromatic.js"], title="Chromatic Chords",
       desc="Mode mixture (borrowed chords and the Picardy third), the Neapolitan (♭II) and the Italian, French and German augmented sixth chords: build them in any key, label them, hear them resolve.",
       modes=[("label", "Label it", "chord → Roman numeral", "label borrowed, Neapolitan and augmented sixth chords"),
              ("spell", "Spell it", "Roman numeral → chord", "spell a chromatic chord in a key"),
              ("staff", "On the staff", "progressions", "label the highlighted chord in a progression"),
              ("type", "Which +6?", "It · Fr · Ger", "tell the Italian, French and German sixths apart"),
              ("kind", "Borrowed or secondary?", "sort chromatic chords", "decide whether a chromatic chord is borrowed, secondary or diatonic"),
              ("use", "How they work", "voice leading · Ger+6 vs V⁷", "doubling, resolution, and the German sixth's dominant-seventh twin")],
       how=["<b>Borrowed chords</b> come from the parallel minor: i, ii°, iiø⁷, iv, v, ♭III, ♭VI, ♭VII (and vii°⁷) in a major key. A major chord made minor → mixture; a minor chord made major → secondary dominant. <b>Picardy third:</b> I at the end of a minor-key passage.",
            "<b>Neapolitan:</b> a major triad on ♭2̂, usually ♭II⁶ (4̂ in the bass, doubled). It moves to V, often through i⁶₄ or vii°⁷/V.",
            "<b>Augmented sixths:</b> le (♭6̂) in the bass, fi (♯4̂) above, both resolving out to sol. Italian adds do; French adds do and re; German adds do and me.",
            "<b>German sixth vs. V⁷:</b> same sound; fi (raised 4̂) goes up to V, sol♭ (a 7th) goes down to ♭II."]),
  dict(src="Voice Motion and Polyphony.html", data="voicemotion.js", title="Voice Motion and Polyphony",
       desc="Contrary, oblique, similar and parallel motion; parallel 5ths and octaves; voice ranges, crossing and spacing; and the textures of polyphony, from drone and organum to canon and heterophony.",
       modes=[("motion", "Motion types", "contrary · oblique · similar · parallel", "name the motion between two voices"),
              ("parallels", "Parallels", "5ths and 8ves", "find forbidden parallel fifths and octaves"),
              ("satb", "Ranges & spacing", "SATB check", "voice ranges, crossing and spacing in four parts"),
              ("texture", "Textures", "hear it · name it", "monophony, homophony, polyphony, heterophony, organum, canon and more")],
       how=["<b>Contrary:</b> opposite directions. <b>Oblique:</b> one voice holds or repeats. <b>Similar:</b> same direction, different intervals. <b>Parallel:</b> same direction, same interval.",
            "<b>Avoid</b> parallel perfect unisons, fifths and octaves, even at the expense of normal doubling or spacing.",
            "<b>Ranges</b> (SATB): soprano C4–G5, alto G3–D5, tenor C3–G4, bass E2–C4. No more than an octave between adjacent upper voices; don't cross voices.",
            "<b>Textures:</b> monophony (one line), homophony (melody + chords), polyphony (independent lines), heterophony (one melody, varied at once)."]),
]

def body(f):
    n = len(f["modes"])
    nav = "\n".join(f'    <button data-mode="{m}" aria-pressed="{"true" if i == 0 else "false"}"><b>{b}</b><small><span aria-hidden="true">{s}</span><span class="sr">: {html.escape(sr)}</span></small></button>' for i, (m, b, s, sr) in enumerate(f["modes"]))
    how = "".join(f"<li>{h}</li>" for h in f["how"])
    return f'''<body>
<a class="skip" href="#views">Skip to the lesson and drills</a>
<div class="wrap">
  <header class="top">
    <div class="brand">
      <h1>{html.escape(f["title"])}</h1>
      <p>{f["desc"]}</p>
    </div>
    <div class="score">
      <div aria-hidden="true"><b><span id="scRight">0</span><span style="opacity:.45">/</span><span id="scTotal">0</span></b><small>correct / answered</small></div>
      <div aria-hidden="true"><b id="scStreak">0</b><small>streak</small></div>
      <p class="sr" id="scoreText" aria-live="polite"></p>
      <button class="score-reset" id="scoreReset">Reset<span class="sr"> score</span></button>
    </div>
  </header>
  <div class="viewtabs" id="views" role="group" aria-label="Lesson or drills">
    <button data-view="lesson" aria-pressed="true"><b>Lesson</b><small>step by step</small></button>
    <button data-view="drills" aria-pressed="false"><b>Drills</b><small>practice · class game</small></button>
  </div>
  <section class="lesson-view" id="lessonView" aria-label="Lesson"></section>
  <div id="drillView" hidden>
  <nav class="modes m{n}" aria-label="Practice mode">
{nav}
  </nav>
  <main class="card" id="practice" tabindex="-1">
    <div class="prompt" id="prompt"></div>
    <div id="work"></div>
    <div class="actions">
      <button class="btn" id="refBtn" aria-haspopup="dialog">Reference</button>
      <button class="btn ghost" id="nextBtn">Skip</button>
    </div>
    <div class="feedback" id="feedback" aria-live="polite" aria-atomic="true"></div>
    <div id="answerBox"></div>
  </main>
  <aside class="wrap-aside" aria-label="Settings and reference">
  <details class="panel" id="settingsPanel">
    <summary>Practice settings</summary>
    <div class="panel-body">
      <div class="set-row" role="group" aria-labelledby="grp1"><span id="grp1">Include</span>
        <div class="toggles" id="topicToggles"></div>
      </div>
      <div class="set-row" role="group" aria-labelledby="grp3"><span id="grp3">Sound</span>
        <div class="toggles" id="autoToggles">
          <button class="tog" data-auto="1">Play the music after each answer</button>
          <button class="tog" data-auto="0">Only when I tap Play</button>
        </div>
      </div>
      <button class="reset" id="resetBtn">Clear the review list</button>
    </div>
  </details>
  <details class="panel" id="refPanel">
    <summary>Quick reference</summary>
    <div class="panel-body"><div class="ref-slot"></div></div>
  </details>
  <details class="panel">
    <summary>Key ideas</summary>
    <div class="panel-body"><ol class="rules">{how}</ol></div>
  </details>
  </aside>
  </div>
  <footer class="credit">App by Adam Silverman</footer>
</div>
<dialog class="ref-dialog" id="refDialog" aria-labelledby="refTitle">
  <div class="dlg-head">
    <h2 id="refTitle">Quick reference</h2>
    <button class="btn" id="refClose">Close<span class="sr"> reference</span></button>
  </div>
  <div class="ref-slot"></div>
  <p class="legend">Your answer stays as you left it. Press Escape or Close to return.</p>
</dialog>
'''

MODES_CSS = """
@media (min-width: 640px) { .modes.m6 { grid-template-columns: repeat(3, 1fr); } .modes.m4 { grid-template-columns: repeat(4, 1fr); } .modes.m3 { grid-template-columns: repeat(3, 1fr); } .modes button { padding: 9px 4px; } .modes button b { font-size: 1.1rem; } .modes button small { font-size: .72rem; } }
"""
ENGINE = (B / "engine.js").read_text(encoding="utf-8")
for f in APPS:
    head = HEAD.replace("<title>Modes Trainer</title>", f"<title>{html.escape(f['title'])}</title>")
    head = head.replace("@media (min-width: 640px) { .modes { grid-template-columns: repeat(5, 1fr); } .modes button:first-child { grid-column: auto; } .modes button { padding: 9px 4px; } .modes button b { font-size: 1.1rem; } .modes button small { font-size: .72rem; white-space: nowrap; } }", "")
    head = head[:head.rstrip().rindex("</style>")] + EXTRA + MODES_CSS + "\n</style>"
    data = "\n".join((B / d).read_text(encoding="utf-8") for d in ([f["data"]] if isinstance(f["data"], str) else f["data"]))
    out = head + "\n</head>\n" + body(f) + VEX + "\n<script>\n" + data + "</script>\n<script>\n" + ENGINE + "</script>\n\n</body>\n</html>\n"
    (SRC / f["src"]).write_text(out, encoding="utf-8"); print("assembled", f["src"], len(out))
