"""Build the four MTC 501 trainers for SilverApps.

For each source trainer (build/src/*.html) this:
  * restyles it (assets/indie.css + assets/trainer-skin.css, light theme only)
  * adds the site strip, linked "Made by Adam Silverman" credit and page title
  * hooks score() and registers a LiveClass adapter so the trainer can be played
    as a live class game (assets/live.js, mqtt.min.js, qrcode.js)
and writes site/<slug>.html.  Run:  python3 build/build_trainers.py
"""
import re, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from common import *

SRC, OUT = ROOT / "build" / "src", SITE_DIR

BRIDGE = r'''
  // ===== SilverApps bridge (added by build/build_trainers.py) =====
  function __saLabel(m) { const b = document.querySelector(%(labelsel_m)s); return b ? b.textContent.trim() : m; }
  if (window.SAprogress) SAprogress.init({ id: "%(id)s", name: "%(name)s", before: ".wrap-aside",
    onReset: () => { S.right = 0; S.total = 0; S.streak = 0; S.misses = []; save(); renderScore(); } });
  if (window.LiveClass) (function () {
    const clone = o => JSON.parse(JSON.stringify(o));
    const relabel = () => { const p = document.querySelector("#feedback .verdict .pill"); if (p) { p.className = "pill warn"; p.textContent = "Answer"; } };
    const tidy = () => document.querySelectorAll("#feedback .verdict span:last-child").forEach(n => { n.innerHTML = n.innerHTML.replace(/\s*(Study it, then try the next one\.\s*)?Th(is|ese) [\w-]+ will come back for review\./, "").trim() || "Here's the answer."; });
    LiveClass.register({
      id: "%(id)s", name: "%(name)s",
      mount: document.querySelector("nav.modes"),
      card: document.querySelector("main.card"),
      getConfig: () => ({ mode: S.mode, settings: clone(S.settings) }),
      label: cfg => __saLabel(cfg.mode),
      load(cfg) {
        %(stop)s
        const keep = S.misses; S.misses = [];
        S.settings = clone(cfg.settings);
        if (LiveClass.role === "student" && "auto" in S.settings) S.settings.auto = false;
        S.mode = cfg.mode; Q[cfg.mode] = null; Q[cfg.mode] = newQuestion(cfg.mode); S.misses = keep;
        %(render)s
      },
      showAnswer() { const q = Q[S.mode]; if (!q || q.done || q.revealed) return; %(show)s tidy(); }
    });
  })();
'''

APPS = [
  dict(src="Modes Trainer.html", out="modes-trainer.html", id="modes", name="Modes",
       labelsel_m='`.modes [data-mode="${m}"] b`', sfx=True, stop="",
       render="clearAnswer(); renderSettings(); renderPrompt(); renderControls();",
       show='if (S.mode === "spell") reveal(); else { q.tries = 1; choose(q.correctValue); relabel(); }'),
  dict(src="Modulation Trainer.html", out="modulation-trainer.html", id="modulation", name="Key Modulation",
       labelsel_m='`.modes [data-mode="${m}"] b`', sfx=True, stop="stopPlay();",
       render='clearAnswer(); renderSettings(); renderPrompt(); renderControls(); if (LiveClass.role === "host") autoPlay();',
       show="q.tries = 1; choose(q.correctValue); relabel();"),
  dict(src="Rhythm Notation Trainer.html", out="rhythm-notation-trainer.html", id="rhythm", name="Rhythm Notation",
       labelsel_m='`.modes [data-mode="${m}"] b`', sfx=True, stop="stopAll();",
       render='fb.innerHTML = ""; renderSettings(); render();',
       show="reveal();"),
  dict(src="Chord Extension Practicer.html", out="chord-extension-practicer.html", id="chordext", name="Chord Extensions",
       labelsel_m='m === "spell" ? "#tabSpell b" : "#tabName b"', sfx=False, stop="",
       render='fb.innerHTML = ""; notesInput.value = ""; symInput.value = ""; renderSettings(); render();',
       show="reveal();"),
  dict(src="Instrument Transpositions.html", out="instrument-transpositions.html", id="transpose", name="Instrument Transpositions",
       labelsel_m='`.modes [data-mode="${m}"] b`', sfx=True, stop="",
       render="clearAnswer(); renderSettings(); renderPrompt(); renderControls();",
       show="q.tries = 1; choose(q.correctValue); relabel();"),
  dict(src="Orchestration Strings.html", out="orchestration-strings.html", id="orchstrings", name="Strings",
       labelsel_m='`.modes [data-mode="${m}"] b`', sfx=True, stop="",
       render="clearAnswer(); renderSettings(); renderPrompt(); renderControls();",
       show="q.tries = 1; choose(q.correctValue); relabel();"),
  dict(src="Orchestration Winds and Brass.html", out="orchestration-winds-brass.html", id="orchwinds", name="Winds & Brass",
       labelsel_m='`.modes [data-mode="${m}"] b`', sfx=True, stop="",
       render="clearAnswer(); renderSettings(); renderPrompt(); renderControls();",
       show="q.tries = 1; choose(q.correctValue); relabel();"),
  dict(src="Orchestration Percussion.html", out="orchestration-percussion.html", id="orchperc", name="Percussion",
       labelsel_m='`.modes [data-mode="${m}"] b`', sfx=True, stop="",
       render="clearAnswer(); renderSettings(); renderPrompt(); renderControls();",
       show="q.tries = 1; choose(q.correctValue); relabel();"),
  dict(src="Orchestration Harp.html", out="orchestration-harp.html", id="orchharp", name="Harp",
       labelsel_m='`.modes [data-mode="${m}"] b`', sfx=True, stop="",
       render="clearAnswer(); renderSettings(); renderPrompt(); renderControls();",
       show="q.tries = 1; choose(q.correctValue); relabel();"),
  dict(src="Orchestration Piano.html", out="orchestration-piano.html", id="orchpiano", name="Keyboard Instruments",
       labelsel_m='`.modes [data-mode="${m}"] b`', sfx=True, stop="",
       render="clearAnswer(); renderSettings(); renderPrompt(); renderControls();",
       show="q.tries = 1; choose(q.correctValue); relabel();"),
  dict(src="Orchestration Plucked.html", out="orchestration-plucked.html", id="orchplucked", name="Plucked Hand-held Instruments",
       labelsel_m='`.modes [data-mode="${m}"] b`', sfx=True, stop="",
       render="clearAnswer(); renderSettings(); renderPrompt(); renderControls();",
       show="q.tries = 1; choose(q.correctValue); relabel();"),
  dict(src="Score and Parts Preparation.html", out="score-and-parts.html", id="scoreparts", name="Score and Parts Preparation",
       labelsel_m='`.modes [data-mode="${m}"] b`', sfx=True, stop="",
       render="clearAnswer(); renderSettings(); renderPrompt(); renderControls();",
       show="q.tries = 1; choose(q.correctValue); relabel();"),
  dict(src="Secondary Function Chords.html", out="secondary-function-chords.html", id="secondary", name="Secondary Function Chords",
       labelsel_m='`.modes [data-mode="${m}"] b`', sfx=True, stop="stopSound();",
       render="clearAnswer(); renderSettings(); renderPrompt(); renderControls();",
       show="q.tries = 1; choose(q.correctValue); relabel();"),
  dict(src="Chromatic Chords.html", out="chromatic-chords.html", id="chromatic", name="Chromatic Chords",
       labelsel_m='`.modes [data-mode="${m}"] b`', sfx=True, stop="stopSound();",
       render="clearAnswer(); renderSettings(); renderPrompt(); renderControls();",
       show="q.tries = 1; choose(q.correctValue); relabel();"),
  dict(src="Voice Motion and Polyphony.html", out="voice-motion-and-polyphony.html", id="voicemotion", name="Voice Motion and Polyphony",
       labelsel_m='`.modes [data-mode="${m}"] b`', sfx=True, stop="stopSound();",
       render="clearAnswer(); renderSettings(); renderPrompt(); renderControls();",
       show="q.tries = 1; choose(q.correctValue); relabel();"),
  dict(src="Secondary Function Chords Lesson.html", out="secondary-function-chords-lesson.html", id="secondary-lesson", name="Understanding Secondary Function Chords",
       labelsel_m='`.modes [data-mode="${m}"] b`', sfx=True, stop="stopSound();",
       render="clearAnswer(); renderSettings(); renderPrompt(); renderControls();",
       show="q.tries = 1; choose(q.correctValue); relabel();"),
  dict(src="Chromatic Chords Lesson.html", out="chromatic-chords-lesson.html", id="chromatic-lesson", name="Understanding Chromatic Chords",
       labelsel_m='`.modes [data-mode="${m}"] b`', sfx=True, stop="stopSound();",
       render="clearAnswer(); renderSettings(); renderPrompt(); renderControls();",
       show="q.tries = 1; choose(q.correctValue); relabel();"),
  dict(src="Voice Motion and Polyphony Lesson.html", out="voice-motion-and-polyphony-lesson.html", id="voicemotion-lesson", name="Understanding Voice Motion and Polyphony",
       labelsel_m='`.modes [data-mode="${m}"] b`', sfx=True, stop="stopSound();",
       render="clearAnswer(); renderSettings(); renderPrompt(); renderControls();",
       show="q.tries = 1; choose(q.correctValue); relabel();"),
]

# harmony / theory lesson + drill apps from build/harmony/assemble.py: (source, output, id, name)
HARM = [
  ("Non-Chord Tones.html", "non-chord-tones.html", "nct", "Non-Chord Tones"),
  ("Non-Chord Tones Lesson.html", "non-chord-tones-lesson.html", "nct-lesson", "Understanding Non-Chord Tones"),
  ("Cadences.html", "cadences.html", "cadences", "Cadences"),
  ("Cadences Lesson.html", "cadences-lesson.html", "cadences-lesson", "Understanding Cadences"),
  ("Harmonic Succession.html", "harmonic-succession.html", "harmsucc", "Harmonic Succession"),
  ("Part-Writing.html", "part-writing.html", "partwriting", "Part-Writing"),
  ("Part-Writing Lesson.html", "part-writing-lesson.html", "partwriting-lesson", "Understanding Part-Writing"),
  ("Keys and Scale Degrees.html", "keys-and-scale-degrees.html", "keys", "Keys, Scale Degrees and Tendency Tones"),
  ("Keys and Scale Degrees Lesson.html", "keys-and-scale-degrees-lesson.html", "keys-lesson", "Understanding Keys, Scale Degrees and Tendency Tones"),
  ("Motive and Sequence.html", "motive-and-sequence.html", "motive", "Motive and Sequence"),
  ("Motive and Sequence Lesson.html", "motive-and-sequence-lesson.html", "motive-lesson", "Understanding Motive and Sequence"),
  ("Phrases.html", "phrases.html", "phrases", "Phrases and Phrase Combinations"),
  ("Phrases Lesson.html", "phrases-lesson.html", "phrases-lesson", "Understanding Phrases and Phrase Combinations"),
  ("Forms.html", "forms.html", "forms", "Musical Forms"),
  ("Forms Lesson.html", "forms-lesson.html", "forms-lesson", "Understanding Musical Forms"),
  ("Extended and Altered Chords Lesson.html", "extended-and-altered-chords-lesson.html", "extlesson", "Understanding Extended and Altered Chords"),
  ("Modulation Lesson.html", "modulation-lesson.html", "modlesson", "Understanding Modulation"),
  ("Rhythm Notation Lesson.html", "rhythm-notation-lesson.html", "rhythmlesson", "Understanding Rhythm Notation"),
  ("Reading Pitch.html", "reading-pitch.html", "pitch", "Reading Pitch"),
  ("Reading Pitch Lesson.html", "reading-pitch-lesson.html", "pitch-lesson", "Understanding Clefs and Pitch Reading"),
  ("Note Values.html", "note-values.html", "notevalues", "Note Values and Rhythm"),
  ("Note Values Lesson.html", "note-values-lesson.html", "notevalues-lesson", "Understanding Note Values and Rhythm"),
  ("Meter.html", "meter.html", "meter", "Meter and Beaming"),
  ("Meter Lesson.html", "meter-lesson.html", "meter-lesson", "Understanding Meter and Beaming"),
  ("Pitch.html", "introduction-to-pitch.html", "pitchintro", "Pitch"),
  ("Pitch Lesson.html", "introduction-to-pitch-lesson.html", "pitch-intro-lesson", "Introduction to Pitch"),
  ("Music Software.html", "music-software.html", "software", "Music Software"),
  ("Music Software Lesson.html", "music-software-lesson.html", "software-lesson", "About Music Software"),
  ("Composition.html", "composition.html", "composition", "Composition"),
  ("Composition Lesson.html", "composition-lesson.html", "composition-lesson", "Understanding Composition"),
  ("Improvisation.html", "improvisation.html", "improvisation", "Improvisation"),
  ("Improvisation Lesson.html", "improvisation-lesson.html", "improvisation-lesson", "Understanding Improvisation"),
  ("Collaboration.html", "collaboration.html", "collaboration", "Collaboration"),
  ("Collaboration Lesson.html", "collaboration-lesson.html", "collaboration-lesson", "Understanding Musical Collaboration"),
  ("Lyrics.html", "lyrics.html", "lyrics", "Lyrics"),
  ("Lyrics Lesson.html", "lyrics-lesson.html", "lyrics-lesson", "Understanding Lyrics"),
  ("Minimalism and Ambient.html", "minimalism-and-ambient.html", "minimal", "Minimalism and Ambient"),
  ("Minimalism and Ambient Lesson.html", "minimalism-and-ambient-lesson.html", "minimal-lesson", "Understanding Minimalist and Ambient Music"),
  ("Pop Production.html", "pop-production.html", "popprod", "Pop Production"),
  ("Pop Production Lesson.html", "pop-production-lesson.html", "popprod-lesson", "How Popular Music Is Produced"),
  ("Film and Game Scoring.html", "film-and-game-scoring.html", "scoring", "Film and Game Scoring"),
  ("Film and Game Scoring Lesson.html", "film-and-game-scoring-lesson.html", "scoring-lesson", "Understanding Film and Game Scoring"),
  ("Distribution and Rights.html", "music-distribution-and-rights.html", "distribution", "Music Distribution and Rights"),
  ("Distribution and Rights Lesson.html", "music-distribution-and-rights-lesson.html", "distribution-lesson", "Understanding Music Distribution and Rights"),
  ("Intervals.html", "intervals.html", "intervals", "Intervals"),
  ("Scales.html", "major-and-minor-scales.html", "scales", "Major and Minor Scales"),
  ("Scales Lesson.html", "major-and-minor-scales-lesson.html", "scales-lesson", "Understanding Major and Minor Scales"),
  ("Harmonic Succession Lesson.html", "harmonic-succession-lesson.html", "harmsucc-lesson", "Understanding Harmonic Succession"),
]
APPS += [dict(src=a, out=b, id=c, name=d, labelsel_m='`.modes [data-mode="${m}"] b`', sfx=True, stop="stopSound();",
              render="clearAnswer(); renderSettings(); renderPrompt(); renderControls();",
              show="q.tries = 1; choose(q.correctValue); relabel();") for a, b, c, d in HARM]

SCORE_HOOK = ("if (!(window.LiveClass && LiveClass.active)) { %(sfxcall)s"
              "if (window.SAprogress && q.tries === 0 && !q.revealed) SAprogress.record(__saLabel(S.mode), correct); }\n    "
              "if (window.LiveClass && LiveClass.active && LiveClass.answered(correct)) return;")
FONTS = ''   # Noto Music is self-hosted in assets/indie.css

def build(a):
    s = (SRC / a["src"]).read_text(encoding="utf-8")
    # 1. fonts: drop the old display/body faces (we use League Gothic + Schibsted Grotesk), keep Noto Music for 𝄫 𝄪
    s = re.sub(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com/css2\?[^"]*">', FONTS, s, count=1)
    # 2. theme
    s = force_light(s)
    s = set_title(s, a["name"])
    s, nh = re.subn(r"<h1>[^<]*</h1>", "<h1>" + a["name"] + "</h1>", s, count=1); assert nh == 1
    s = before_head_close(s, HEAD_ASSETS + '\n<link rel="stylesheet" href="assets/trainer-skin.css">')
    # 3. site strip + credit
    s = after_body_open(s, strip_html(sound=a["sfx"]))
    s = re.sub(r'<footer class="credit">.*?</footer>', "", s, flags=re.S)
    # 4. live class: libraries before the app script, score hook, bridge inside the app closure
    scripts = list(re.finditer(r"<script>(.*?)</script>", s, re.S))
    app = scripts[-1]
    js = app.group(1)
    assert js.count("function score(q, correct) {") == 1, a["src"]
    hook = SCORE_HOOK % {"sfxcall": "if (window.SFX) SFX.play(correct); " if a["sfx"] else ""}
    js = js.replace("function score(q, correct) {", "function score(q, correct) {\n    " + hook, 1)
    end = js.rindex("})();")
    js = js[:end] + (BRIDGE % a) + js[end:]
    libs = (PROGRESS_SCRIPTS + '<script src="assets/mqtt.min.js"></script>\n<script src="assets/qrcode.js"></script>\n'
            '<script src="assets/live.js"></script>\n<script src="assets/site.js"></script>\n')
    s = s[:app.start()] + libs + "<script>" + js + "</script>" + s[app.end():]
    s = before_body_close(s, CREDIT)
    (OUT / a["out"]).write_text(s, encoding="utf-8")
    print("built", a["out"], len(s))

if __name__ == "__main__":
    for a in APPS: build(a)
