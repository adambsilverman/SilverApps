# SilverApps for Music Training — Handoff

*Maintained in the `SilverApps for Music Training` folder (renamed from `Music Apps` on 2026-10-28). Update the "Change log" at the bottom whenever anything changes.*

## For future Claude sessions

- **Use the token saver skill** at the start of any session working on these files (long batch work).
- **Never hand-edit the built `.html` pages.** Edit the sources in `build/`, then run `sh build/build_all.sh`. The pages are regenerated from `build/src/` + the scripts + `assets/`.
- Many OneDrive files are "online-only". Reading them through the device bridge fails with *Resource deadlock avoided*; staging them (device_stage_files) downloads them first.
- After any change: rerun the build, test, then update this file.

## What this is

A multi-page static website of music apps for review, practice and skill building (theory, ear training, performance) by Adam Silverman, meant to be uploaded **as a group to a GitHub repository and published with GitHub Pages**. `index.html` is the front page; every app links back to it ("All SilverApps") and every page has a "Made by Adam Silverman" credit linking to https://adambsilverman.com.

Visual style: "warm paper" indie-film look — red-orange `#E8573F` top bar with film-strip sprockets, warm off-white paper `#FBF6EE`, rounded cards and pill buttons, soft shadows, lime green `#A9D27A` = correct, navy/purple accents. Fonts: **Satisfy** script for the site title only, **League Gothic** for headings, **Literata** (serif) for body text, **Barlow Condensed** caps for buttons and small labels. All defined once as `--fi-*` tokens in `assets/indie.css`; each app has a small skin file that maps its own design onto them.
- To change the title font: replace `assets/fonts/title.woff2` with another .woff2 (the CSS name "SilverApps Title" stays the same) and update the fallback name in `--fi-title`.

All pages meet **WCAG 2.1 AA** (the standard required by the ADA Title II rule): automated axe-core audits pass with zero violations on every page and every class-game state, desktop and phone. Notation has text alternatives, chord symbols are spoken correctly (C♯m7/E → "C sharp minor seventh, over E"), status changes are announced, contrast ≥ 4.5:1, keyboard-operable, reduced-motion respected.

## The apps

| Page | Course | Origin (original kept in `build/src/`) | Class game |
|---|---|---|---|
| `chord-figures-and-symbols.html` | MTC 112 | *Chord Lab Live* (renamed). Source `build/chordlab/src.html` | built-in (own engine) |
| `chord-extension-practicer.html` | MTC 501 | `Chord Extension Practicer.html` | `assets/live.js` |
| `modes-trainer.html` | MTC 501 | `Modes Trainer.html` | `assets/live.js` |
| `modulation-trainer.html` | MTC 501 | `Modulation Trainer.html` | `assets/live.js` |
| `rhythm-notation-trainer.html` | MTC 501 | `Rhythm Notation Trainer.html` | `assets/live.js` |
| `orchestration-foreign-terms.html` | MTC 341/541 | `Orchestration Foreign Terms.html` | built-in (own engine) |
| `instrument-transpositions.html` | MTC 341/541 | new, from the *Transposition* page. Parts in `build/transposition/` (`assemble.py` → `build/src/Instrument Transpositions.html`) | `assets/live.js` |
| `orchestration-strings.html` | MTC 341/541 | new, from *String Instruments* + its Extreme Orchestration readings | `assets/live.js` |
| `orchestration-winds-brass.html` | MTC 341/541 | new, from *Wind and Brass Instruments* + readings | `assets/live.js` |
| `orchestration-percussion.html` | MTC 341/541 | new, from *Percussion Instruments* + readings | `assets/live.js` |
| `score-and-parts.html` | MTC 341/541 | new, from *Score and Parts Preparation* | `assets/live.js` |
| `intervals-what-why-how.html` | any | new lesson, from Adam's “How Intervals Work” video script (`build/pages/`) | none — step-through lesson |
| `metronome.html` | any | new tool (`build/pages/`) | none — solo tool |
| `drone.html` | any | new tool (`build/pages/`) | none — solo tool |
| `shadow-tuner.html` | any | `shadow-tuner.html` (was already in Music Apps) | none — solo tool by design |

Not converted (by choice, Oct 2026): *Instrument Names Quiz* (older solo version of Foreign Terms), *Diatonic Modes*, *Distinguishing Secondary Function Chords*, *Harp Pedal Practice* (lesson/assignment pages), the D2L "Dusk" template demos.

## Folder layout

```
SilverApps for Music Training/
  index.html                      front page (generated from build/apps.json)
  verify.html                     professors paste a student report to check it (generated)
  *.html                          the seven apps (generated)
  assets/
    indie.css                     shared look + class-game panel styles + fonts (@font-face)
    trainer-skin.css              skin for the four MTC 501 trainers
    chordlab-skin.css             skin for Chord Figures and Symbols
    foreign-terms-skin.css        skin for Orchestration Foreign Terms
    tuner-skin.css                skin for Shadow Tuner
    live.js                       class-game layer used by the four trainers
    site.js                       full-screen button in the top strip
    progress.js                   "Your progress" panel, reset, completion report + verification code
    sfx.js                        correct chime / not-yet beep and the Sound on/off button
    mqtt.min.js, qrcode.js        libraries (MQTT over WebSocket; QR codes)
    fonts/                        League Gothic, Schibsted Grotesk, Literata, Barlow Condensed, title.woff2 = Satisfy (all OFL, self-hosted)
  build/
    build_all.sh                  rebuild everything
    common.py                     site strip, credit, helpers (SITE name lives here)
    apps.json                     front-page list (add new apps here)
    build_trainers.py             every trainer that uses assets/live.js (+ the live bridge code they get)
    transposition/                Instrument Transpositions: body.html, app.js, extra.css, assemble.py
    orchestration/                Strings, Winds & Brass, Percussion, Score and Parts: one shared engine.js,
                                  one content file each (strings.js, winds.js, percussion.js, scoreparts.js), assemble.py
    build_chordlab.py             Chord Figures and Symbols
    build_foreign_terms.py        Orchestration Foreign Terms
    build_tuner.py                Shadow Tuner
    build_index.py                front page
    build_verify.py               verify.html
    build_pages.py                stand-alone lessons and tools from build/pages/*.html (header comment gives title, sound, full-screen)
    pages/                        intervals-what-why-how.html, metronome.html, drone.html
    src/                          original source copies of every app (unchanged)
    chordlab/                     Chord Lab source, its original theme, VexFlow build
  .nojekyll                       tells GitHub Pages to serve files as-is
  README.md                       short public description for the GitHub repo
  LICENSE.md                      CC BY-NC-SA 4.0 for Adam's work + third-party licenses (keep the credit on every page)
  HANDOFF.md                      this file
```

## Rebuilding

```sh
cd "SilverApps for Music Training"
sh build/build_all.sh          # needs python3 only
```
`build_all.sh` first runs `transposition/assemble.py` and `orchestration/assemble.py` (which write the new apps' sources into `build/src/`), then the page builds. To change a question bank, edit the content file (e.g. `build/orchestration/winds.js`) and rebuild.
The scripts write pages into the folder that contains `build/` (or into `site/` if a `site/` folder exists — that was the original dev layout).

## Publishing on GitHub

1. Create a repository (e.g. `silverapps`), upload **everything in this folder** (including `assets/`, `build/`, `.nojekyll`).
2. Settings → Pages → Deploy from branch → `main` / root. The site appears at `https://<user>.github.io/silverapps/`.
3. Everything uses relative links, so it works under that sub-path. HTTPS is required for the microphone (Shadow Tuner) and is what GitHub Pages provides.
4. Students join class games from the same URL (QR code on the projector encodes `page#join=CODE`).

## How the class game works (trainers, `assets/live.js`)

- The host clicks **Host a class game**, picks time per question and a class goal, gets a 5-character room code + QR.
- Host chooses a question type with the trainer's own mode buttons/settings and presses **Send question**. The host broadcasts `{mode, settings, seed}`; every phone builds the **same question** by running the trainer's own `newQuestion()` inside a seeded random generator (`LiveClass.seeded`). No question content is sent over the network.
- Each phone grades with the trainer's own logic; the trainer's `score(q, correct)` was patched to call `LiveClass.answered(correct)`, which sends only right/wrong with a random anonymous id. One try per question; the card locks after answering; feedback stays hidden (`body.lc-hold`) until reveal.
- Host sees answers-in count and timer (+15 s, Stop & show answer). On reveal: % right/not yet, supportive message, class average vs goal; the trainer shows the answer (`adapter.showAnswer()` → the trainer's own `reveal()` or `choose(correctValue)` without scoring).
- **Work ahead**: on phones, a "Work ahead on your own" box embeds the same trainer (`?solo=1`) for private practice; nothing in it is sent to the class.
- Transport: public MQTT-over-WebSocket brokers (HiveMQ, EMQX, Mosquitto — tried in order; room code's first letter encodes which). Override for testing with `?broker=ws://host:port`.
- The bridge for each trainer is the `BRIDGE` template in `build/build_trainers.py` (config per app in `APPS`). It relies on these names inside each trainer's code: `S`, `Q`, `newQuestion`, `score`, `renderSettings`, plus per app `renderPrompt/renderControls/clearAnswer/choose/reveal/render/stopPlay/stopAll`. If a trainer's source is updated and renames these, update `APPS`.

Chord Figures and Symbols and Orchestration Foreign Terms have their own complete class-game engines (written earlier); they use the same brokers and the same ideas (timer, cutoff, anonymous %, class goal, work-ahead box).

## Progress, reports and sounds

- Every practice app (not Shadow Tuner) has a **Your progress** panel (`assets/progress.js`): totals by question type, **Reset my score** (tap twice), and **Completion report for my professor**.
- Solo answers count on first try only; class-game answers are recorded when the answer is revealed, labelled "Class game · …". The work-ahead frame counts as solo practice. Stored in the student's browser (`localStorage`, key per app), nothing is sent anywhere.
- The report asks for the student's name (course and professor email optional) and can be printed/saved as PDF, downloaded, emailed (opens their mail app) or copied. It ends with a **verification code**: a hash (cyrb53, salt `silverapps-report-v1`) of the report text. `verify.html` recomputes it — edits to the numbers make it fail. It's a deterrent, not cryptographic proof (the code is in public JavaScript).
- Sounds (`assets/sfx.js`): a short rising chime for correct, a soft falling beep for not yet, generated with WebAudio (no files). **Sound on/off** button in the top strip, remembered per browser. Chord Extensions keeps its own behaviour (plays the chord when you're right) and has no chime/beep.

## Adding a new app

1. Put its original HTML in `build/src/`.
2. If it follows the trainer design system (`nav.modes`, `main.card`, `S`/`Q`/`newQuestion`/`score`), add an entry to `APPS` in `build_trainers.py` — it gets the skin and class game automatically. Otherwise write a small `build_<name>.py` modelled on `build_tuner.py` (skin + strip + credit) and a skin CSS in `assets/`.
3. Add it to `build/apps.json`, add the script to `build_all.sh`, rebuild, test (below), update this file.

## Testing (what was run, Oct 2026)

- Local static server mimicking GitHub Pages (`/silverapps/` sub-path) + a local MQTT broker; Playwright with a projector browser and 2–3 phone browsers.
- For every trainer and every question type: host and phones showed identical questions; feedback hidden until reveal; correct % computed; answer revealed on all screens.
- Solo scoring unaffected; work-ahead practice doesn't count toward the class.
- axe-core WCAG 2.1 A/AA: 0 violations on every page (desktop + phone) and on lobby / question / reveal states.
- Not testable from the build machine: the public brokers themselves. **Before first use in class, test once on the classroom network** (if blocked, the host screen says so; solo practice works everywhere).

- Progress/report: record → report → verify.html round trip passes; a tampered report fails; reset clears.
- Shadow Tuner: synthetic voice/clarinet/brass/string tones at several noise levels — 0 wrong-octave frames; fake-microphone run in Chromium reads D3 correctly.

## Wording conventions

- Site name: **SilverApps for Music Training**. The link back to the front page is labelled **All SilverApps** (not “All trainers”).
- Describe the apps as for **review, practice and skill building** (theory, ear training, performance) — not just "review apps".
- **No course codes (MTC 112 etc.) on any page.** Front-page tiles show a topic label instead (`topic` in `build/apps.json`). The course mapping lives only in this file.
- Say "student devices" (not "phones") for where students answer, e.g. "Run it live with a whole class on student devices".
- "Everyone got it" appears only at a true 100%; percentages never round up to 100 or down to 0.
- Staves use plain treble, alto, tenor and bass clefs only: **no 8va/8vb (“8”) transposing clefs**. Keep written ranges sensible instead.
- Copyrighted melodies (e.g. “Over the Rainbow”) are described, never written out; lessons use original tunes with the same shape.
- No festive emoji in feedback. Chord symbols use △ for major 7th; no double sharps/flats in Chord Figures and Symbols.

## Change log

- **2026-10-28 (k)** — Added `LICENSE.md` (CC BY-NC-SA 4.0: credit to Adam Silverman required, non-commercial, share-alike; third-party MIT/OFL/Apache components listed) and a copyright/license line on the front page.

- **2026-10-28 (j)** — Folder renamed from `Music Apps` to `SilverApps for Music Training` (on Adam's Mac, in OneDrive › WCU › COURSES). Nothing inside depends on the folder name.

- **2026-10-28 (i)** — Intervals lesson now has 13 steps: new **Size and quality** (pick any two notes; letters → size, half steps → quality), **Stretch and squeeze** (perfect family vs major/minor family, stepping the top note through diminished/minor/major/augmented), and **Spelling counts** (enharmonic intervals such as C–D♯ = A2 vs C–E♭ = m3, C–F♯ vs C–G♭, C–B vs C–C♭; enharmonic scale spellings showing each letter once). Three new quick-check questions. The front-page link in every top bar now reads **All SilverApps**.

- **2026-10-28 (h)** — Drone: added **Pythagorean** tuning (all notes from pure 3:2 fifths) and a **Tune from** setting, so the tuning root can differ from the drone's root (e.g. a D chord tuned from A); the ratio column shows each note's ratio above the tuning root.

- **2026-10-28 (g)** — New: **Intervals: What, Why and How** (10-step interactive lesson with keyboard + measuring tape, bouncing-ball melody, transposition slider, inversion mirror, steps-vs-leaps canyon, tension band, major/minor chord flip, distance-from-home road, atonal pitch circle, quick check), **Metronome** (tap tempo; − / + step through traditional Maelzel markings 40–208, any tempo 20–300; simple, compound and irregular meters incl. custom groupings; per-beat accents; subdivisions; 5 sounds; silent-bar and speed trainers), **Drone** (root + any stack of notes; equal temperament or just intonation with cents shown; choice of just 7th; 4 timbres). Strings harmonics now answered with a note + accidental + octave picker (any pitch, octaves 2–7; enharmonic spellings accepted with a note). Instrument Transpositions no longer uses 8va/8vb clefs.

- **2026-10-28 (f)** — New apps (all solo + class game, progress reports, sounds): **Instrument Transpositions** (facts, read written → sounding, write concert → written, key signatures; no questions about specific pieces), **Strings** (instruments, open strings, natural/artificial harmonics drawn on the staff, bowing & effects), **Winds & Brass** (instruments, score order & shorthand, valves/partials, mutes & techniques), **Percussion** (instruments, playing & logistics, notation), **Score and Parts Preparation**. Fixed answer boxes whose text touched the border and degree tiles that had become pill-shaped; Chord Figures' top bar no longer overflows on narrow screens.

- **2026-10-28 (e)** — Renamed on screen: Chord Extension Practicer → **Chord Extensions**, Modes Trainer → **Modes**, Modulation Trainer → **Key Modulation**, Rhythm Notation Trainer → **Rhythm Notation** (names come from `APPS` in `build_trainers.py` and `build/apps.json`; the build also rewrites each page's `<h1>`). File names/URLs unchanged so existing links keep working; saved student progress carries over.

- **2026-10-28 (d)** — The site title in the top bar links to the front page on every page (Chord Figures and Symbols' title used to go to its own main screen; its "Main screen" button still does that).

- **2026-10-28 (c)** — "Warm paper" restyle (rounded, softer colours); Literata body serif; Barlow Condensed buttons/labels; Satisfy script site title in title case. Front page now describes the apps as review, practice and skill building for theory, ear training and performance. Correct/incorrect sounds with an on/off toggle (not in Chord Extension Practicer). Progress panel with reset and completion report in every practice app; new `verify.html`. Shadow Tuner octave fix: the pitch detector now checks for a half/third-length period (YIN was sometimes choosing the octave below), and the note tracker ignores its own reference tone heard back through the mic, needs an octave or fifth jump to last ~1/6 s before following it, and won't change note while a sound is fading.

- **2026-10-28 (b)** — Removed course codes from all pages; tiles show topic labels; Foreign Terms eyebrow now "Orchestration".

- **2026-10-28** — Created SilverApps: converted 7 apps from MTC 112, MTC 341/541, MTC 501 and Music Apps; indie theme; WCAG 2.1 AA pass; class games for the four MTC 501 trainers (`live.js`); front page; GitHub Pages layout; Chord Lab renamed "Chord Figures and Symbols"; credit links to adambsilverman.com; D2L-specific wording removed.
