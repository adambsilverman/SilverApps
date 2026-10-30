"""Assemble the orchestration-family trainers into build/src/*.html (then run build_trainers.py).
Each page = the Modes Trainer's CSS + transposition/extra.css + a body made from FAMILIES below
+ (VexFlow if the family draws staves) + <family>.js (content) + engine.js (shared logic)."""
import pathlib, html
B = pathlib.Path(__file__).resolve().parent; SRC = B.parent / "src"
src = (SRC / "Modes Trainer.html").read_text(encoding="utf-8").split("\n")
HEAD = "\n".join(src[:229]); VEX = "\n".join(src[351:360])
assert HEAD.rstrip().endswith("</style>") and VEX.startswith("<script>")
HEAD = HEAD.replace(".modes button:first-child { grid-column: 1 / -1; }\n", "")
EXTRA = (B.parent / "transposition" / "extra.css").read_text(encoding="utf-8") + """
.q-text { max-width: 44ch; }
.choice-row.wide .choice { text-align: left; }
.picker { display: grid; gap: 10px; }
.pk-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.pk-lab { font-family: var(--mono); font-size: .8125rem; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); min-width: 6.5em; }
.pk { min-width: 44px; min-height: 44px; border: 2px solid var(--line); background: var(--field); border-radius: 10px; font-family: var(--display); font-weight: 800; font-size: 1.3rem; }
.pk .acc { font-family: "Noto Music", var(--body); font-weight: 400; }
.pk.on { background: var(--ink); color: var(--bg); border-color: var(--ink); }
.pk.right { background: var(--good-soft); border-color: var(--good); color: var(--good); }
.pk.wrong { background: var(--bad-soft); border-color: var(--bad); color: var(--bad); }
.pk-now { margin-right: auto; }
@media (max-width: 420px) { .pk-lab { min-width: 100%; } }
.fig-box { display: flex; justify-content: center; margin: 4px 0 10px; }
.pedal { margin: 0; color: var(--ink); text-align: center; }
.pedal svg { display: block; width: min(260px, 100%); height: auto; margin: 0 auto; }
.pedal figcaption { font-size: .85rem; color: var(--muted); margin-top: 2px; }
.pedal-row { display: flex; flex-wrap: wrap; gap: 14px 22px; justify-content: center; margin: 10px 0; }
.pedal-row .pedal svg { width: 190px; }
.ref-list { padding-left: 1.2em; } .ref-list li { margin: .3em 0; }
"""

FAMILIES = [
  dict(src="Orchestration Strings.html", title="Strings", vex=True, sound=True,
       desc="The bowed strings: the instruments, open strings and string numbers, natural and artificial harmonics, and bowings and color effects.",
       modes=[("inst", "Instruments", "violin → bass", "the four bowed strings, tuning, clefs and positions"),
              ("open", "Open strings", "I II III IV", "open strings and string numbers on the staff"),
              ("harm", "Harmonics", "touch → sounds", "find the pitch a natural or artificial harmonic sounds"),
              ("tech", "Bowing & effects", "arco · pizz. · sul pont.", "bow strokes, colors and section indications")],
       how=["<b>String numbers</b> are Roman numerals from the highest string: violin I = E, viola II = D, cello III = G, bass IV = E.",
            "<b>Natural harmonics:</b> octave (circle) sounds where touched; touch-P5 sounds an octave + P5 above the open string; touch-P4 two octaves; touch-M3 two octaves + M3; touch-m3 two octaves + P5.",
            "<b>Artificial harmonics:</b> stop a note, touch the diamond a P4 higher: it sounds two octaves above the stopped note.",
            "The contrabass sounds an octave lower than written; the others sound as written."]),
  dict(src="Orchestration Winds and Brass.html", title="Winds & Brass", vex=False, sound=True,
       desc="Woodwind and brass families: how each instrument works and sounds, score order and scoring shorthand, valves and the harmonic series, and mutes and techniques.",
       modes=[("inst", "Instruments", "flute → tuba", "woodwind and brass instruments and their registers"),
              ("order", "Score order", "2, 2, 2, 2 – 4, 2, 3, 1", "score order, doubling and scoring shorthand"),
              ("brass", "Brass", "valves · partials", "valves, slide positions and the harmonic series"),
              ("color", "Mutes & effects", "straight · cup · Harmon", "brass mutes and wind techniques")],
       how=["<b>Score order:</b> flutes, oboes, clarinets, bassoons, then horns, trumpets, trombones, tuba. Auxiliaries sit next to their family by size.",
            "<b>Valves:</b> 1 lowers a M2, 2 a m2, 3 a m3; 1+3 a P4; 1+2+3 a tritone. The lips choose the partial.",
            "<b>Mutes</b> change color and volume; allow up to 10 seconds to put one in."]),
  dict(src="Orchestration Percussion.html", title="Percussion", vex=False, sound=False,
       desc="Percussion: the instruments and what they're made of, beaters and playing logistics, and how to notate percussion parts.",
       modes=[("inst", "Instruments", "drums · mallets · metals", "the percussion instruments, materials and how they're played"),
              ("play", "Playing", "beaters · logistics", "beaters, techniques and getting from one instrument to another"),
              ("nota", "Notation", "staff · legend", "how to write percussion parts")],
       how=["<b>Logistics:</b> leave time to move between instruments and change beaters.",
            "<b>Shared staff:</b> snare on the third space, bass drum on the bottom space, metals on lines; always include a legend."]),
  dict(src="Orchestration Harp.html", title="Harp", vex=True, sound=True,
       desc="The pedal harp: the instrument and its strings, reading and setting pedals, enharmonic spelling, chord glissandos, harmonics and special techniques.",
       modes=[("inst", "Instrument", "strings · range · hands", "the harp's strings, range, hands and practicalities"),
              ("pedal", "Pedals", "D C B | E F G A", "reading pedal diagrams, pedal changes and enharmonic spelling"),
              ("gliss", "Glissandos", "scales · 7th chords", "pedal settings for chord glissandos"),
              ("tech", "Techniques", "harmonics · bisbigliando", "harmonics, special techniques and notation")],
       how=["<b>Pedals:</b> D C B (left foot) | E F G A (right foot). Top notch = flat, middle = natural, bottom = sharp, in every octave.",
            "<b>Spell for the pedals:</b> A♯ and B♭ are different strings; never write double sharps or flats. Two pedal changes at once only with opposite feet.",
            "<b>Glissandos:</b> any seven-note scale, or 7th chords using enharmonic doublings; triads can't be glissed.",
            "<b>Harmonics:</b> a circle over the written note; they sound an octave higher, best at mf or softer."]),
  dict(src="Orchestration Piano.html", title="Keyboard Instruments", vex=True, sound=True,
       desc="Piano, organ, celesta and harpsichord: range and registers, the piano's pedals, writing for the hands, characteristic accompaniments, organ stops and registration, prepared piano, and keyboards in the ensemble.",
       modes=[("inst", "Piano", "range · registers", "the piano's range, sound and registers"),
              ("ped", "Pedals", "damper · sostenuto · una corda", "the three pedals and how they're marked"),
              ("nota", "Writing", "hands · markings", "writing for the hands and piano notation"),
              ("acc", "Accompaniments", "Alberti · stride · comping", "characteristic keyboard accompaniments and spacing in the bass"),
              ("organ", "Organ", "manuals · stops", "the pipe organ and Hammond organ"),
              ("prep", "Prepared piano", "bolts · rubber · inside", "prepared piano and playing inside the piano"),
              ("ens", "Ensemble", "orchestra · celesta", "the piano, celesta and other keyboards in the ensemble")],
       how=["<b>Keep the bass register clear:</b> below about C3 use octaves, 5ths, 10ths or a single bass note; close-position chords low down sound muddy unless that color is wanted.",
            "<b>Piano pedals:</b> right = damper (Ped. … ✱), middle = sostenuto, left = una corda (u.c. … tre corde).",
            "<b>Organ:</b> manuals plus pedalboard on three staves; 8′ = written pitch, 4′ = octave higher, 16′ = octave lower.",
            "<b>Prepared piano:</b> give a preparation table, get permission, and allow setup time.",
            "<b>Score order:</b> keyboards come after the harp and before the strings. The celesta sounds an octave higher than written."]),
  dict(src="Score and Parts Preparation.html", title="Score and Parts Preparation", vex=False, sound=False,
       desc="What a professional score and set of parts must include, and the typesetting conventions players and conductors expect.",
       modes=[("score", "The score", "pages · names · bars", "what a score must include and how it's laid out"),
              ("parts", "The parts", "turns · cues · rests", "what parts must include"),
              ("type", "Typesetting", "dynamics · tempo · text", "common typesetting conventions and mistakes")],
       how=["Score and parts go through a second proofreader before they reach players.", "Cues go in parts (after 8+ bars of rest), never in the score."]),
]

def body(f):
    n = len(f["modes"])
    nav = "\n".join(f'    <button data-mode="{m}" aria-pressed="{"true" if i == 0 else "false"}"><b>{html.escape(b)}</b><small><span aria-hidden="true">{html.escape(s)}</span><span class="sr">: {html.escape(sr)}</span></small></button>' for i, (m, b, s, sr) in enumerate(f["modes"]))
    sound = '''      <div class="set-row" role="group" aria-labelledby="grp3"><span id="grp3">Sound</span>
        <div class="toggles" id="autoToggles">
          <button class="tog" data-auto="1">Play the sound after each answer</button>
          <button class="tog" data-auto="0">Only when I tap Play</button>
        </div>
      </div>''' if f["sound"] else '<p class="set-note">Missed questions come back for review now and then.</p>'
    how = "".join(f"<li>{h}</li>" for h in f["how"])
    return f'''<body>
<a class="skip" href="#practice">Skip to the practice question</a>
<div class="wrap">
  <header class="top">
    <div class="brand">
      <h1>{html.escape(f["title"])}</h1>
      <p>{html.escape(f["desc"])}</p>
    </div>
    <div class="score">
      <div aria-hidden="true"><b><span id="scRight">0</span><span style="opacity:.45">/</span><span id="scTotal">0</span></b><small>correct / answered</small></div>
      <div aria-hidden="true"><b id="scStreak">0</b><small>streak</small></div>
      <p class="sr" id="scoreText" aria-live="polite"></p>
      <button class="score-reset" id="scoreReset">Reset<span class="sr"> score</span></button>
    </div>
  </header>
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
{sound}
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
@media (min-width: 640px) { .modes.m4 { grid-template-columns: repeat(4, 1fr); } .modes.m3 { grid-template-columns: repeat(3, 1fr); } .modes button { padding: 9px 4px; } .modes button b { font-size: 1.1rem; } .modes button small { font-size: .72rem; white-space: nowrap; } }
.modes.m3 button:last-child:nth-child(odd) { grid-column: 1 / -1; }
@media (min-width: 640px) { .modes.m7 { grid-template-columns: repeat(4, 1fr); } .modes.m7 button { padding: 9px 4px; } .modes.m7 button b { font-size: 1.1rem; } .modes.m7 button small { font-size: .72rem; } }
.callout-lite { border-left: 4px solid var(--accent, #c0392b); padding: 6px 12px; background: rgba(0,0,0,.03); }
@media (min-width: 640px) { .modes.m3 button:last-child:nth-child(odd) { grid-column: auto; } }
"""
ENGINE = (B / "engine.js").read_text(encoding="utf-8")
DATA = {"Orchestration Strings.html": "strings.js", "Orchestration Winds and Brass.html": "winds.js", "Orchestration Percussion.html": "percussion.js", "Score and Parts Preparation.html": "scoreparts.js", "Orchestration Harp.html": "harp.js", "Orchestration Piano.html": "piano.js"}
for f in FAMILIES:
    head = HEAD.replace("<title>Modes Trainer</title>", f"<title>{html.escape(f['title'])}</title>")
    head = head.replace("@media (min-width: 640px) { .modes { grid-template-columns: repeat(5, 1fr); } .modes button:first-child { grid-column: auto; } .modes button { padding: 9px 4px; } .modes button b { font-size: 1.1rem; } .modes button small { font-size: .72rem; white-space: nowrap; } }", "")
    head = head[:head.rstrip().rindex("</style>")] + EXTRA + MODES_CSS + "\n</style>"
    data = (B / DATA[f["src"]]).read_text(encoding="utf-8")
    out = (head + "\n</head>\n" + body(f) + (VEX + "\n" if f["vex"] else "") + "<script>\n" + data + "</script>\n<script>\n" + ENGINE + "</script>\n\n</body>\n</html>\n")
    (SRC / f["src"]).write_text(out, encoding="utf-8"); print("assembled", f["src"], len(out))
