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
| `secondary-function-chords.html` | MTC 501 | new (replaces the *Distinguishing Secondary Function Chords* page), from the Secondary Harmony pages. `build/harmony/secondary.js` | `assets/live.js` |
| `chromatic-chords.html` | MTC 501 | new: Mode Mixture + Neapolitan + Augmented Sixth + Chromatic Mediants in one app (mediants from *Chromatic Mediant Chords*, `mediant.js`), from *Mode Mixture and Borrowed Chords*, *Chords with Roots on Chromatic Scale Degrees*, *Augmented Sixth Chords*. Content in `build/harmony/mixture.js`, `neapolitan.js`, `aug6.js` (each registers in `window.FAMS`), combined by `chromatic.js` | `assets/live.js` |
| `voice-motion-and-polyphony.html` | MTC 501 | new, for module “12. Voice Motion and Polyphony” (*Polyphony*, *Heterophony*, *Voice Ranges and Motion Types*). `build/harmony/voicemotion.js` | `assets/live.js` |
| `non-chord-tones.html` | MTC 501 | new, from *Non-Chord Tones*, *Suspensions, Retardations and Pedal Tones*, *Locating Non-Chord Tones*. `build/harmony/nct.js` | `assets/live.js` |
| `cadences.html` | MTC 501 | new, from *Cadences* (and the closure categories of *Phrase Combinations*). `build/harmony/cadences.js` | `assets/live.js` |
| `harmonic-succession.html` | MTC 501 | new, from *Diatonic Chord Functions*, *Harmonic Succession*, *Structural vs. Embellishing Chords*. `build/harmony/harmsucc.js` | `assets/live.js` |
| `part-writing.html` | MTC 501 | new, from *Voice-Leading and Part-Writing Introduction*, *Part-Writing Principles*, *Part-Writing Techniques*. `build/harmony/partwriting.js` | `assets/live.js` |
| `keys-and-scale-degrees.html` | MTC 501 | new, from *Keys*, *Tendency Tones*, *Key Determination*. `build/harmony/keys.js` | `assets/live.js` |
| `motive-and-sequence.html` | MTC 501 | new, from *Motive* and *Sequence*. `build/harmony/motive.js` | `assets/live.js` |
| `phrases.html` | MTC 501 | new, from *Phrases* and *Phrase Combinations*. `build/harmony/phrases.js` | `assets/live.js` |
| `forms.html` | MTC 501 | new, from *Simple Forms*, *Larger Forms*, *Sonata Form*, *Popular Music Forms*. `build/harmony/forms.js` | `assets/live.js` |
| each of the above `…-lesson.html` | MTC 501 | the matching step-through lesson (same content file) | none — lesson |
| `extended-and-altered-chords-lesson.html`, `modulation-lesson.html`, `rhythm-notation-lesson.html` | MTC 501 | lesson-only pages (no drills of their own; they link to Chord Extensions, Key Modulation and Rhythm Notation). From *Extended and Altered Chords*; *About Modulation* + *Modulation Techniques*; *Notating Rhythm* + *Rhythm Terminology and Techniques* + *Notation of Lyrics*. `extlesson.js`, `modlesson.js`, `rhythmlesson.js` | none — lesson |
| `intervals-what-why-how.html` | any | new lesson, from Adam's “How Intervals Work” video script (`build/pages/`) | none — step-through lesson |
| `modes-the-simple-truth.html` | MTC 501 | new lesson, from the *Diatonic Modes* page and the Modes trainer's non-diatonic material (`build/pages/`) | none — step-through lesson |
| `rhythm-performance.html` | any | new tool (`build/pages/`): read a generated rhythm, count-in, tap/space bar or clap (mic onsets); per-note timing grading, timeline, latency calibration | none — solo, with progress report |
| `ear-training.html` | any | new tool (`build/pages/`): sing intervals and patterns (mic, YIN pitch detection), chord quality, melodic dictation | none — solo, with progress report |
| `metronome.html` | any | new tool (`build/pages/`) | none — solo tool |
| `drone.html` | any | new tool (`build/pages/`) | none — solo tool |
| `shadow-tuner.html` | any | `shadow-tuner.html` (was already in Music Apps) | none — solo tool by design |

Not converted (by choice, Oct 2026): *Instrument Names Quiz* (older solo version of Foreign Terms), *Diatonic Modes*, *Harp Pedal Practice* (lesson/assignment pages), the D2L "Dusk" template demos.

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
    harmony/                      the lesson + drill apps (Secondary Function, Chromatic Chords,
                                  Voice Motion and Polyphony): one shared engine.js (theory, keyboard-style voicing, grand-staff
                                  drawing with key signatures and Roman numerals, sound, lesson stepper), extra.css, one content
                                  file each (lesson steps + question makers + reference), assemble.py
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
`build_all.sh` first runs `transposition/assemble.py`, `orchestration/assemble.py` and `harmony/assemble.py` (which write the new apps' sources into `build/src/`), then the page builds. To change a question bank, edit the content file (e.g. `build/orchestration/winds.js`) and rebuild.
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
- Host sees answers-in count and timer (+15 s, Stop & show answer). When the timer runs out, answering closes on student devices (“Time's up”) but the answer is **not** shown until the professor clicks **Show answer** (same in Chord Figures and Symbols and Foreign Terms). On reveal: % right/not yet, supportive message, class average vs goal; the trainer shows the answer (`adapter.showAnswer()` → the trainer's own `reveal()` or `choose(correctValue)` without scoring).
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

## Visitor analytics (who uses the site, and where)

No logins, so no names or emails: the statistics are anonymous visits with approximate location. `build/common.py` has a hook for **Umami Cloud** (free Hobby plan): sign up at https://cloud.umami.is, add the website `adambsilverman.github.io`, copy its website ID into `UMAMI_WEBSITE_ID`, run `sh build/build_all.sh`, upload. The Umami dashboard shows visitors and views in total and per page (each app is its own page), by country, region/state and city, plus referrers (e.g. D2L), browsers and devices, for any date range. `data-domains` keeps local testing out of the counts. The free plan keeps data for a limited time (6 months at the time of writing); export from the dashboard to keep longer records. A GoatCounter hook (`GOATCOUNTER_CODE`; country and region but no city) is there as an alternative. The front page footer carries a privacy note. Named completion data still comes only from students' completion reports (verify.html).

## Wording conventions

- Site name: **SilverApps for Music Training**. The link back to the front page is labelled **All SilverApps** (not “All trainers”).
- Describe the apps as for **review, practice and skill building** (theory, ear training, performance) — not just "review apps".
- **No course codes (MTC 112 etc.) on any page.** Front-page tiles show a topic label instead (`topic` in `build/apps.json`). The course mapping lives only in this file.
- Say "student devices" (not "phones") for where students answer, e.g. "Run it live with a whole class on student devices".
- "Everyone got it" appears only at a true 100%; percentages never round up to 100 or down to 0.
- Staves use plain treble, alto, tenor and bass clefs only: **no 8va/8vb (“8”) transposing clefs**. Keep written ranges sensible instead.
- Copyrighted melodies (e.g. “Over the Rainbow”) are described, never written out; lessons use original tunes with the same shape.
- No festive emoji in feedback. Chord symbols use △ for major 7th; no double sharps/flats in Chord Figures and Symbols.

## Harmony lesson + drill apps (build/harmony)

Each app is built as two pages: a lesson page (in Lessons on the front page) and a drills page (with the class game); they link to each other. Lessons are step-through slides; most steps have a key picker (major/minor + key) that re-spells every example and figure, with Play buttons and quick-check questions (not scored). Drills are four modes each, multiple choice, with grand-staff progressions (highlighted chord, Roman numerals drawn under the bass), chord-symbol and Roman-numeral answer buttons, review list, progress report and class game. Content conventions: ♭II (not N), It+6 / Fr+6 / Ger+6, minor keys use natural-minor numerals (III, VI, VII) with V and vii° from the raised 7th, borrowed chords ♭III ♭VI ♭VII i ii° iiø⁷ iv v vii°⁷. Notation is engraved with VexFlow; voicings are keyboard style (bass + three right-hand notes, nearest-note voice leading; N⁶ doubles the bass; Ger+6 goes through the cadential 6/4). `window.__harm` exposes the engine for automated tests (stress test: every mode × 300 questions; the answer is always among 4 distinct choices). Voice Motion's SATB check uses ranges S C4–G5, A G3–D5, T C3–G4, B E2–C4 and stems S/T up, A/B down; its texture questions generate audio examples (monophony, homophony, canon, non-imitative polyphony, heterophony, drone, parallel organum, plus hocket and antiphony in the lesson).

**Engine additions (Oct 29, 2026).** `engine.js` now also has: (1) a measured-notation renderer, spec `{ type: "score", vf, sig, time, clefs: ["treble","bass"] | ["treble"] | ["percussion"], bars: [{ t: [voice, voice?], b: [...] }] }`, with notes `{ k: ["C5"] or [] (rest), d: "q"|"8"|"hd"…, tie, lab (Roman numeral under the bottom staff), sym (chord symbol), tag (text above; under the bass staff for bass notes), n (number), ly (lyric), hl (circle), hlc (shade the column), bs/be (bracket with a label) }`; it wraps long passages into rows, beams by time signature, handles ties across bars and rows, and keeps accidentals for the rest of the bar. Build bars from flat lists with `H.toBars({ t: [[{ k, q (quarters), …marks }]], b: [...] }, beatsPerBar)` (splits and ties notes over bar lines); `H.scorePlay(spec)` gives the audio. (2) SATB voicing: `H.satb(key, chords, { sop })` (dynamic programming over every four-part voicing: complete chords, doubling preferences, ranges, spacing, no crossing; no parallel/consecutive 5ths or 8ves, direct 5ths/8ves with a soprano leap, unresolved soprano leading tone, unresolved 7ths, augmented 2nds; smallest motion), `H.satbCands(key, chord, { loose })` (with `flags`: cross, space, no3, dblLT…, used by the Part-Writing error drill), `H.pwIssues(...)`, `H.tok(key, "57")` (degree + figure → chord with `.rn`), `H.voiceToks`, `H.satbSpec`, `H.satbFig(U, key, tokens, caption)`. (3) Lesson-only apps: an entry in `assemble.py` with `lesson_only=True` and an existing `drills` page; its content file has `modes: []`. (4) Front page: see the z11 change log entry (one card per topic in `apps.json` → `sections`).

## Change log

- **2026-10-29 (z15)** — Removed named repertoire examples from Meter and Beaming (Brubeck, Moeran, Montgomery, Glass) and from Rhythm Notation (lesson: Moeran, Montgomery, Glass, Shaw, the Beatles, Carter; trainer: the “We Can Work It Out” and Shaw questions), replaced with general descriptions.
- **2026-10-29 (z14)** — Two new lesson + drill apps and Note Values updates. **Meter and Beaming** (`meter.js`; Rhythm, after Note Values): beat and meter, simple and compound, 3/4 vs 6/8, asymmetrical (2 + 3, 2 + 2 + 3, 3 + 3 + 2), mixed meter with cautionary time signatures, beaming rules, historical vocal beaming (flags per syllable, beams only for melismas), pick-ups, syncopation, hemiola; drills: kinds of meter, find the meter from the beaming, asymmetrical grouping, clear beaming, rhythmic devices, terms. **Major and Minor Scales** (`scales.js`; Foundations, before Keys): half and whole steps, the major scale and tetrachords, why we use key signatures, reading key signatures (orders of sharps and flats, finding the key), circle of fifths and enharmonic keys, natural minor and relative/parallel keys, harmonic and melodic minor and why 6̂ and 7̂ are raised; drills: spell the scale, name the scale, key signatures (both ways, major/minor topic toggles), relative and parallel, steps, why it works. **Note Values**: the rests figure is silent (no play button); new step “Bar lines and bar rests” (every bar ends with a bar line, final and double bar lines, centered bar rests in any meter, multi-bar rests); rhythm figures (including dots and ties) and “complete the bar” play with a metronome click on the beat. Engine: score bars can change time signature (`bar.time`, with a cautionary signature at the end of the previous line), `bar.dbl` double bar, beaming by `groups` (e.g. `["3/8","2/8"]`), `beam:false` plus manual beam ids (`bm`) for vocal beaming, `center:true` centered bar rests, and `H.withClick(spec)` adds beat clicks (dotted-quarter beats in compound meters, pick-up aware). Scale-degree carets sit a little lower (`.sd::before`).
- **2026-10-29 (z13)** — Two new lesson + drill apps. **Reading Pitch** (`clefs.js`; first in Foundations): the staff, treble/bass/alto/tenor clefs and the grand staff, the eleven-line “great staff” that connects all clefs, a short history of clefs (Guido of Arezzo, letters C/F/G, movable C clefs: soprano, mezzo-soprano, alto, tenor, baritone), memory devices, reading strategies, and alignment of notes, seconds and accidentals; drills: name the note, note + octave, find the line or space, same pitch in a new clef, devices and principles (topic toggles for each clef and for ledger lines). **Note Values and Rhythm** (`notevalues.js`; first in Rhythm): values and rests (with British names), parts of a note, dots, double dots and ties, simple and compound meter, triplets, duplets and quintuplets, counting, vertical alignment; drills: beats per value, value math, complete the bar, tuplets, meter, terms. Engine: score notes can be tuplets (`tu` group id, `tun` notes in the time of `tuo`), invisible placeholders (`ghost: true`), double dots, alto/tenor clefs; score specs take `minBar` (minimum bar width) and `scale` (display size).
- **2026-10-29 (z12)** — Front page: Cadences and Non-Chord Tones moved from Harmony to Foundations; the Harmony section is now titled “Advanced Harmony” (its id stays `harmony`).
- **2026-10-29 (z11)** — Front page redesigned (`build/build_index.py`, `build/apps.json`). `apps.json` now has `sections` (id, title, color) with `topics`; each topic is one card with up to three links: `lesson`, `drills` (with `class: true` when the drills have the class game) or `open` (tools), plus an optional `note`. Each section has one card color (red, green, navy, purple). At the top: jump links to each section and a “Find a topic” search that filters cards as you type (count announced to screen readers); the class-game instructions and the completion-report link moved into a collapsed “For instructors” panel. The page is about half as long as before (≈4,400 px vs. ≈8,000 px at 1000 px wide). To add an app: add or extend a topic in `apps.json`.
- **2026-10-29 (z10)** — Lesson flow rows (`.steprow`, e.g. the progression chart iii → vi → IV/ii → V/vii° → I): the box style now applies only to each step, not to the spans inside Roman numerals, which had drawn nested boxes around every numeral.
- **2026-10-29 (z9)** — Keys, Scale Degrees and Tendency Tones, “Which key?”: all 24 major and minor keys are choices (12 majors around the circle of fifths, then their relative minors), and the passages now use all 12 key signatures.
- **2026-10-29 (z8)** — Keys, Scale Degrees and Tendency Tones: in “Name the pitch” and “Name the degree,” every pitch (or degree name) of the key is a choice, in scale order (minor keys include both the subtonic and the leading tone).
- **2026-10-29 (z7)** — Built the rest of the recommended MTC 501 apps, each a lesson page + a drills page (class game): **Non-Chord Tones** (name the circled NCT in a generated melody over chords, find it, suspension figures 4-3/7-6/9-8/2-3, definitions; every generated melody is checked by a classifier so it has exactly one kind of NCT), **Cadences** (four-voice phrases: PAC/IAC/HC/PC/DC/PHC on the staff, by ear, from chord symbols; closure), **Harmonic Succession** (functions, progression vs. retrogression, phrase-model areas, embellishing chords, circle/retrogression/chord-stream patterns), **Part-Writing** (find the error in a two-chord SATB connection, doubling, tendency tones, the five ways to resolve V⁷), **Keys, Scale Degrees and Tendency Tones** (degree names/pitches, tendencies, major vs. relative minor on the staff), **Motive and Sequence** (generated motives and their permutations; tonal/real/modified sequences), **Phrases and Phrase Combinations** (generated two-phrase passages: periods, phrase groups, repeated phrase; diagrams), **Musical Forms** (plans, generated listening examples, sonata, song sections). Chromatic Chords gained a fourth part and drill mode: **Chromatic Mediants**. Lesson-only pages: **Extended and Altered Chords**, **Modulation**, **Rhythm Notation** (with notation of lyrics), each linking to its existing drills. Front page: Lessons split into Foundations / Harmony / Voice Leading / Melody, Phrase and Form; drills regrouped into Keys, Scales and Chords / Harmony / Voice Leading / Melody, Phrase and Form / Rhythm / Orchestration. Copyrighted melodies are only described; examples are original or generated. Engine fix: `diat()` built the wrong chord on degree 7 in minor keys (it now gives vii° from the raised leading tone); RN labels under the bass staff now drop below low notes.
- **2026-10-29 (z6)** — Neapolitan: every example and drill uses ♭II⁶ (root position ♭II only appears as a wrong answer). Voicing: the 3rd (4̂) in the bass, the right hand plays root and 5th with one of them doubled (the 3rd is not doubled); lesson text, reference, key ideas and the “How it's used” question changed to match. The first two Neapolitan figures now show i – ♭II⁶ – V⁷ – i.

- **2026-10-29 (z5)** — Understanding Chromatic Chords: new step 7, **The Mercury third** (a term by Adam Silverman for a minor tonic arriving in a major-key context, from the end of the chorus of Queen's *We Are the Champions*: ♭VII⁶ – ♭III – i), using the actual chords at the end of the chorus in F major (F – E♭9(♯11)/G – A♭6 – B♭ – C7(sus4) – Fm), and a quick check. The Picardy-third step now points to it. Degree circles (°) enlarged again.

- **2026-10-29 (z4)** — Secondary Function Chords: half-diminished secondary pre-dominants (iiø⁷/x) only tonicize **minor** chords; major targets get ii/x or ii⁷/x (minor or m7). Drills, examples, tables and the reference follow this; the lesson's “Find the target” step now uses IV (major keys) / VI (minor keys) as the target so all three chord types are chromatic. Lesson examples now start on the tonic and end with V–I (the “Examples” and “Find the target” figures), so the home key is heard and seen. Drill progressions (“On the staff”) always end with a cadence: authentic V⁷–I (about 2 in 3) or a half cadence on V⁷ (never a plain V); lesson examples end V⁷–I.

- **2026-10-29 (z3)** — Lessons split from the drills: `secondary-function-chords-lesson.html`, `chromatic-chords-lesson.html` and `voice-motion-and-polyphony-lesson.html` (“Understanding …”) are listed under **Lessons** on the front page; the drill pages (same file names as before) keep the class game. Each page links to the other (the lesson's last step goes to the drills). Both come from the same content files: `harmony/assemble.py` writes a drills source and a “… Lesson.html” source for each app (`window.SA_PAGE` tells the engine which view to show).

- **2026-10-29 (z2)** — Metronome: two new sounds, **Drums (plain)** and **Drums (swing)**, from a synthesized kit (kick, snare, hi-hat, pedal hat, ride, crash). Plain: three straight 16th-note grooves (rock, funky 16ths with ghost notes, four-on-the-floor) that change every 8 bars; compound meters get a triplet groove; 5/8, 7/8 and custom groupings put kick and snare on the group starts. Swing: jazz ride pattern (“spang-a-lang”), hi-hat on 2 and 4, feathered bass drum and light snare comping. Every 4th bar ends with a fill and the next bar starts with a crash. Beats set to silent and the silent-bar trainer still work. Drone: the notes table scrolls sideways on phones instead of widening the page.

- **2026-10-29 (z)** — Drone: with Just intonation selected, a **Prime limit** choice appears: 5-limit (as before; the minor 7th is 9:5 or 16:9), 7-limit (adds 7:4 harmonic 7th and 7:5 tritone), 11-limit (adds 11:8 for the tritone), 13-limit (adds 13:8 for the minor 6th). Equal temperament and Pythagorean are unchanged. Old saved settings that used the 7:4 seventh open in 7-limit.

- **2026-10-29 (y)** — **Accidentals in text:** new `assets/fonts/sa-accidentals.woff2` (♭ ♮ ♯ 𝄪 𝄫 only, from Noto Music, side bearings trimmed and ♯/♮/𝄪 centered on the text line) is first in every `--fi-*` font stack (and Chord Figures' stacks), so accidentals in any text — headings, buttons, chord symbols, SVG labels — get even, letter-like spacing instead of whatever wide system fallback the browser picked. "Noto Music" is now self-hosted in `indie.css` (the trainers no longer load it from Google Fonts). **Secondary Function Chords:** no diminished-triad secondary chords any more (a °-triad is both vii°/x and ii°/y, e.g. vii°/IV = ii°/ii); leading-tone chords are always °7; pre-dominants are ii/ii⁷ for major targets and iiø⁷ for minor targets; chord-symbol questions skip any chord that also has a common non-secondary reading (borrowed from the parallel mode, Picardy I, melodic-minor IV/ii). In every example and staff progression, a secondary leading-tone chord or pre-dominant is followed by the secondary dominant of the same target (vii°⁷/V → V⁷/V → V). Mode Mixture drills: no ii° triad (D° in C could be vii°/♭III), and the distractor V/♭III (a possible reading of ♭VII) was removed. **Diminished sign:** the text fonts' ° is a tiny dot, so `sa-accidentals.woff2` also carries a clear circle for ° (U+00B0) used in all text; in the harmony apps every ° (Roman numerals, chord symbols, text) is drawn as a CSS circle (`.rn .rq.dim`, `.dimc`) about the size of ø, and on staves as a small “o”. The font file is referenced as `sa-accidentals.woff2?v=4` so browsers fetch the new version; bump the number if the font changes again.

- **2026-10-29 (x)** — Neapolitan, Augmented Sixth and Mode Mixture merged into one app, **Chromatic Chords** (`chromatic-chords.html`): the lesson runs in three parts (Mode mixture 1–7, Neapolitan 8–14, Augmented sixths 15–20; the key picker switches to the part's usual mode when you enter it), six drill modes (Label it, Spell it, On the staff mix all three; Which +6?, Borrowed or secondary?, How they work), and “Include” toggles per family in Practice settings. The three separate pages were deleted. Strings: accidentals on diamond (touched) noteheads were invisible, so touch-m3 harmonics looked like touch-M3 (B♭ read as B) and vice versa; they now show. (The pitch math and grading were already right: checked against the harmonic series for every string.)

- **2026-10-29 (w)** — New lesson + drill apps (all with class game): **Secondary Function Chords** (replaces the *Distinguishing Secondary Function Chords* page), **Neapolitan Chords**, **Augmented Sixth Chords**, **Mode Mixture**, **Voice Motion and Polyphony** (MTC 501 module 12). Class games (all trainers, Chord Figures and Symbols, Foreign Terms): when time runs out answers close but the professor clicks **Show answer** to reveal (the +15 s button hides at that point); also fixed students' timer not locking after the first timed-out question. Chord Extensions: accidentals in chord symbols are now set in the music font, smaller and tight to the letter (no extra space around ♭/♯). Strings: artificial harmonics only on playable stopped notes (violin A3–D5, viola D3–G4, cello D3–A4 in thumb position; it used to allow cello in first position, where the P4 stretch is impossible, and sounding pitches up to G7), and no touch-M3/touch-m3 natural harmonics on the violin's and viola's top string (G♯7–B7). Ear Training: removed the 7♭5 chord (“Dominant 7th ♭5”) from chord quality; Sing patterns has a “Show solfège under the notes” checkbox, **off by default** (the boxes show ♪ until the pattern is finished, then the syllables appear).

- **2026-10-28 (u)** — Ear Training patterns: Key setting adds "Alternate major and minor" (switches every melody). Keys now come from `KEYDEF` by mode with their own key signatures: major C, G, D, A, E, F, B♭, E♭, A♭ and minor A, E, B, F♯, C♯, D, G, C, F; keys with 1–4 sharps or flats are three times as likely as C major / A minor.
- **2026-10-28 (t)** — Ear Training dictation: "Chromatic notes" setting (none / stepwise: chromatic passing and neighbor notes / approached by leap, resolved by step in the other direction / both). Chromatic notes always resolve by half step and use the usual syllables (di ri fi si li, ra me se le te); `addChromatics()` inserts one (two in 5–6-note melodies, sometimes). Movable-do gets a chromatic syllable row; fixed-do and note-name inputs get an accidental row ("As in the key", ♭ ♮ ♯). Playback: tonic chord, the given first note alone, a pause, then the melody. Wrong answers get a Compare toggle: "▶ Your version" (wrong notes red) and "▶ Correct" (corrections in blue), each played on click.
- **2026-10-28 (s)** — Ear Training, Sing patterns: much more forgiving grading — within ±80 cents (any octave), held 0.12 s, pitch smoothed over the last 5 readings, time in tune accumulates instead of decaying, and a note that isn't matched within 4 s is skipped (shown red). A pattern counts as correct with every note matched, or all but one for 4+ notes. (Tightened at 5:30 PM: ±50 cents held 0.3 s, a 0.3 s gap after each matched note so a held note can't fill the next, repeated notes must be re-sung, skip after 6 s.) Microphone echo cancellation is now off (it distorted sung pitch), only steady readings are graded, and the readout says "a little high/low" within 1.5 semitones. A version line under the title helps spot stale copies. `listen()` takes an options object (tol, hold, stuck, forgiving, onMiss).
- **2026-10-28 (r)** — Instrument Transpositions: "What key is … in?" and "Which of these instruments is in …?" now use only instruments whose names don't state the key (alto flute, English horn, saxophones, bass clarinets, flugelhorn, euphonium, and the horn shown as "French horn"), so answers can't be read off a name like "Horn in F".
- **2026-10-28 (q)** — Ear Training: fixed a spelling bug that put flat-key notes (e.g. B♭) an octave low; melodies (singing and dictation) now appear in the clefs the student ticks (treble, alto, tenor, bass; one clef per example, chosen at random), centered on the staff with at most two ledger lines; staff-click input and the octave buttons stay within that range. Dictation: 'Answer with' buttons above the pad, a '▶ First note' button, the given note named and outlined, and Octave ↑/↓ for name inputs.
- **2026-10-28 (p)** — New **Rhythm Performance** drill (Rhythm Drills): six levels (quarters/halves → eighths → dotted & eighth rests → sixteenths → syncopation → triplets), 2/4, 3/4, 4/4, 6/8, 1–4 bars, tempo, timing tolerance (relaxed ±170 ms, normal ±120, strict ±75; double taps within 90 ms of a good tap are ignored), click throughout or count-in only, tap pad / space bar / clapping into the mic, and a "Calibrate timing" step that measures the device's tap or mic delay. `window.__rp` exposes state for automated tests. Ear Training dictation: answer with movable-do, fixed-do, note names in the key, note names with any accidental, or by clicking on the staff (mouse or ↑ ↓ Enter); graded by spelling. Ear Training staff notes use automatic stem direction.
- **2026-10-28 (o)** — Ear Training: the microphone is requested and listening starts automatically after each reference (no extra button; "Try again" restarts), with a live input-level bar, a "can't find a clear pitch" hint, and clear messages when the mic is blocked or the page is opened from a file. Chord quality sets: triads, usual 7ths (7, △7, m7, ø7, °7), all 7ths (adds m△7, +7, +△7, 7♭5, °△7), triads + 7ths, extended (9, 11, 13), altered extended (♭9, ♯9, ♯11, ♭13, alt), all extended; △ used for major 7ths. Melodic patterns (singing and dictation): motion = stepwise / steps + skips / steps + skips + leaps, and start on the tonic or any degree. Modes lesson: tonic-degree picker on any major scale (step 1), any tonic in PADMIL, and scale + chord progression playback in "Name that mode by ear".
- **2026-10-28 (n)** — Modes lesson renamed "Modes: The Simple Truth" (file `modes-the-simple-truth.html`). Key Modulation: the Neapolitan is labeled ♭II (not N); named pieces and songs were removed from questions, hints and the methods guide (concept questions rewritten generically). Statistics hook switched to Umami Cloud so the dashboard shows city, state and country per app.
- **2026-10-28 (m)** — Front page: the "practice solo / host a class game / join" cards moved into a new **Drills and Games** section (groups with `"drills": true` in apps.json render as subsections; tile badges can be overridden with `"badge"`); groups renamed "Harmony & Theory Drills", "Rhythm Drills", "Orchestration Drills", "Ear Training & Practice Tools". The small SilverApps logo (`assets/silverapps-logo-light.png`) now heads every inside page's top bar. Visitor statistics hook, Umami or GoatCounter (off until an ID is set; see *Visitor analytics*). Chord Figures and Symbols: "What do you want to drill?" choice (all chords, triads, seventh chords, inversions) in setup and as a chip row; inversions mode forces inverted chords and spells slash chords from the bass. New lesson **Modes: The Simple Truth** (relative/parallel modes, major vs minor modes, PADMIL, modal key signatures, modes by ear, augmented-second scales, pentatonic and blues, whole-tone and octatonic, quiz). New **Ear Training** tool (sing intervals above a given note, chord quality, sing patterns, melodic dictation; mic grading is octave-equivalent within ±40 cents held 0.35 s; self-check fallback without a mic). Key Modulation: minor keys use natural-minor numerals (III, VI, VII, no flat) — added a "Minor keys" labeling rule, and "Label it" no longer offers flat/no-flat twins (♭III vs III) or ♭II as a wrong answer for N.
- **2026-10-28 (l)** — Intervals lesson: the interval steps (What is an interval?, Size and quality, Stretch and squeeze, Spelling counts) now show each interval three ways at once: letters (counted), a treble staff (melodic and harmonic), and a keyboard (half steps arched). Staves are engraved with VexFlow (Bravura font), so clefs and accidentals are standard size and placement; `build_pages.py` inlines VexFlow when a page's header comment has `vex: 1`. Added `assets/silverapps-logo.png` (also copied into the MTC 110 pages folder and used on week-10.html).

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
