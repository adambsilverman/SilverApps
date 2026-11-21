
window.FAM = (() => {
  // ===== Composition: finding ideas, developing them, form, texture and craft. =====
  const tbl = (cap, head, rows) => `<div class="ltable-wrap" tabindex="0" role="region" aria-label="${cap}"><table class="ltable"><caption>${cap}</caption><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  const F = {
    ideas: [
      ["A motive is…", "a short, recognizable musical idea that can be developed", ["a whole movement", "a chord progression only", "a tempo marking"], "Often just a few notes with a distinctive rhythm or interval."],
      ["Why do many composers work with constraints (a limited set of notes, a fixed rhythm, one instrument)?", "limits force decisions and often spark more original ideas", ["constraints are required by copyright law", "to make the music shorter", "constraints make music easier to play only"], "A blank page offers too many choices; a constraint gives a starting point."],
      ["A quick, rough recording or notation of an idea is called…", "a sketch", ["a master", "a part", "an orchestration"], "Capture ideas fast; refine later."],
      ["Studying how other composers solved a problem is called working from…", "models", ["samples", "stems", "presets"], "Analyze form, texture and orchestration in pieces you admire, then make your own choices."],
      ["Improvising at an instrument while composing helps because…", "the hands and ears find ideas the planning mind might not", ["it replaces notation", "it always produces finished pieces", "it avoids revision"], "Record improvisations and pick out the best moments."],
      ["When setting a text, the music usually begins from…", "the words' rhythm, stresses and meaning", ["the key signature", "the instrument list", "the title page"], "Stressed syllables generally fall on stronger beats or longer notes."],
    ],
    develop: [
      ["Playing a motive upside down (each interval in the opposite direction) is called…", "inversion", ["retrograde", "augmentation", "sequence"], "Retrograde plays it backwards; retrograde inversion does both."],
      ["Doubling a motive's note values is called…", "augmentation", ["diminution", "fragmentation", "inversion"], "Diminution halves them."],
      ["Repeating a motive at a different pitch level, usually several times in a row, is…", "a sequence", ["a canon", "an ostinato", "a cadence"], "Sequences are a quick way to build momentum or move between keys."],
      ["Fragmentation means…", "developing just part of a motive", ["deleting the motive", "playing it in a new key", "doubling it in octaves"], "Often a sign of building tension toward a climax."],
      ["Why combine repetition and variation?", "repetition makes ideas memorable; variation keeps them interesting", ["repetition is always boring", "variation is never needed", "to make the piece longer only"], "Too much repetition can feel static; too much novelty, incoherent."],
      ["An ostinato is…", "a pattern repeated many times, often in the bass or accompaniment", ["a single long note", "a free cadenza", "a key change"], "Ostinatos give a stable ground for other parts to change over."],
    ],
    form: [
      ["Ternary form is…", "A B A: statement, contrast, return", ["A A A", "A B only", "through-composed"], "The return gives a sense of closure."],
      ["Through-composed music…", "keeps presenting new material rather than repeating sections", ["repeats every verse", "uses only one chord", "has no melody"], "Common in art songs that follow a story."],
      ["Strophic form…", "repeats the same music for each verse of text", ["never repeats", "alternates A and B", "is always instrumental"], "Hymns and many folk songs are strophic."],
      ["Which of these creates contrast between sections?", "changes of key, texture, register, tempo or dynamics", ["exact repetition", "the same instrumentation and dynamics throughout", "a longer title"], "Contrast in several dimensions at once makes a new section clear."],
      ["Many pieces place their main climax…", "well past the middle, then wind down", ["in the first bar", "exactly at the start of the last bar", "nowhere"], "A late climax followed by release is a very common shape."],
      ["Rondo form has…", "a recurring main section alternating with contrasting episodes (A B A C A…)", ["two halves only", "no repetition", "only variations"], "The refrain's returns organize the piece."],
    ],
    craft: [
      ["Writing idiomatically means…", "writing what suits the instrument and is comfortable for the player", ["using only whole notes", "copying another piece", "avoiding all difficult passages"], "Check ranges, breathing, bowing, hand position and page turns."],
      ["Close-position chords in a low register tend to…", "sound muddy", ["sound bright", "sound out of tune by themselves", "disappear"], "Spread low chords out (like the harmonic series) and keep close spacing higher up."],
      ["Why ask performers to read through drafts?", "they find problems and possibilities the score doesn't reveal", ["to fill time", "because software can't print", "it's required for copyright"], "Their feedback on playability, balance and notation is invaluable."],
      ["When revising, a useful first question is…", "does each section do its job, and is it the right length?", ["how many notes can be added?", "which font is best?", "how loud is the computer playback?"], "Cutting is often the most effective revision."],
      ["Software playback of a draft…", "can hide balance and playability problems", ["is exactly what live players will sound like", "is required before revising", "makes notation unnecessary"], "Imagine the real players: breath, bow changes, effort and blend."],
      ["Writer's block is often eased by…", "changing something: a constraint, an instrument, a time limit, or starting in the middle", ["waiting for inspiration only", "never sketching", "throwing away all drafts"], "Momentum matters more than perfection in early drafts."],
    ],
  };
  const LET = "CDEFGAB";
  const GEN = {
    develop: H => {
      const start = Math.floor(Math.random() * 3) + 7, steps = [start]; for (let i = 0; i < 3; i++) { let d; do d = H.rnd([-2, -1, 1, 1, 2, 3]); while (steps[i] + d < 3 || steps[i] + d > 13); steps.push(steps[i] + d); }
      const nm = s => s.map(x => LET[((x % 7) + 7) % 7]).join(" ");
      const inv = steps.map(x => 2 * steps[0] - x), ret = steps.slice().reverse(), seq = steps.map(x => x + 1);
      const ops = [["inversion", inv, "each step goes the opposite way from the same first note"], ["retrograde", ret, "the notes in reverse order"], ["a sequence a step higher", seq, "every note one scale step higher"]];
      const [name, res, why] = H.rnd(ops);
      return H.mc(`The motive ${nm(steps)} (in C major). Which is its ${name}?`, nm(res), ops.filter(o => o[0] !== name).map(o => nm(o[1])).concat([nm(steps.map(x => x - 1))]), `${name[0].toUpperCase() + name.slice(1)}: ${why}.`);
    },
  };
  const motif = { type: "score", clefs: ["treble"], time: "4/4", vf: "C", sig: {}, bpm: 96, minBar: 200, bars: [
    { t: [[{ k: ["E4"], d: "8", ly: "motive" }, { k: ["F4"], d: "8" }, { k: ["G4"], d: "q" }, { k: ["C5"], d: "h" }]] },
    { t: [[{ k: ["F4"], d: "8", ly: "sequence" }, { k: ["G4"], d: "8" }, { k: ["A4"], d: "q" }, { k: ["D5"], d: "h" }]] },
    { t: [[{ k: ["E5"], d: "8", ly: "inversion" }, { k: ["D5"], d: "8" }, { k: ["C5"], d: "q" }, { k: ["G4"], d: "h" }]] },
    { t: [[{ k: ["E4"], d: "q", ly: "augmentation" }, { k: ["F4"], d: "q" }, { k: ["G4"], d: "h" }]] },
    { t: [[{ k: ["E4"], d: "8", ly: "fragment" }, { k: ["F4"], d: "8" }, { k: ["G4"], d: "q" }, { k: ["F4"], d: "8" }, { k: ["G4"], d: "8" }, { k: ["A4"], d: "q" }]] }] };
  const lesson = { steps: [
    { title: "Finding ideas", kick: "Starting points", render: () => `<p>Composers start in many places, and most use several:</p>
      <ul><li><b>A motive</b>: a few notes with a distinctive rhythm or interval.</li><li><b>Improvising</b> at an instrument or with the voice, recording everything, and keeping the best moments.</li><li><b>A text</b>: its rhythm, sound and meaning suggest melody and form.</li><li><b>A sound or texture</b>: an unusual instrument technique, a drone, a rhythm loop.</li><li><b>A plan or constraint</b>: a form, a set of pitches, a time limit, a dramatic shape, or a performer's strengths.</li><li><b>Models</b>: studying how pieces you admire handle form, texture and orchestration, then making your own choices.</li></ul>
      <p>Write ideas down quickly as <b>sketches</b> (notation, voice memos, DAW clips). Judging comes later.</p>` },
    { title: "Developing material", kick: "Doing more with less", render: (H, k, U) => `<p>A piece rarely needs many ideas; it needs good things done with a few. Classic techniques:</p>
      ${U.fig(motif, "One motive, five ways: sequence, inversion, augmentation and fragmentation.")}
      ${tbl("Development techniques", ["Technique", "What changes"], [["Repetition", "nothing, but context changes how we hear it"], ["Sequence", "the pitch level"], ["Inversion / retrograde", "the direction / the order"], ["Augmentation / diminution", "the note lengths"], ["Fragmentation", "only part of the idea is used"], ["Reharmonization", "the chords under it"], ["Re-orchestration", "instrument, register or texture"]])}
      <p>The Motive and Sequence app on this site practices these transformations.</p>` },
    { title: "Unity, variety and form", kick: "Shaping time", render: () => `<p>Listeners need enough <b>repetition</b> to recognize ideas and enough <b>contrast</b> to stay engaged. Form is how a piece balances the two over time.</p>
      <ul><li><b>Strophic</b>: the same music for each verse. <b>Verse–chorus</b>: alternating sections, the chorus returning with the same words.</li><li><b>Binary</b> (A B) and <b>ternary</b> (A B A).</li><li><b>Rondo</b> (A B A C A…) and <b>theme and variations</b>.</li><li><b>Through-composed</b>: continuous new material, often following a text or story.</li></ul>
      <p>New sections are clearest when several things change at once: key or mode, texture, register, instrumentation, tempo, dynamics. Plan the large shape too: where is the climax, and how does the energy rise and fall around it? Many pieces put their main climax well past the midpoint.</p>` },
    { title: "Texture, spacing and instruments", kick: "How it sounds", render: () => `<ul><li><b>Texture</b>: a single line, melody with accompaniment, chords, independent lines (counterpoint), or layers that each have a role (melody, bass, harmony, rhythm, color).</li>
      <li><b>Spacing</b>: follow the harmonic series, with wide intervals low and closer ones high. Close chords in the bass sound muddy.</li>
      <li><b>Register and color</b>: the same melody sounds very different in a flute's low register and a trumpet's high one. Changing register is one of the simplest ways to vary an idea.</li>
      <li><b>Idiomatic writing</b>: know the ranges, breathing, bowing, hand positions and what's easy or awkward on each instrument (see the Orchestration apps).</li></ul>` },
    { title: "Choosing a musical language", kick: "Pitch and harmony", render: () => `<p>Composers choose (and sometimes mix) pitch languages: <b>tonal</b> (keys and functional harmony), <b>modal</b> (modes and drones), <b>chromatic</b> (many borrowed and altered chords), <b>post-tonal</b> (pitch-class sets, twelve-tone rows), <b>minimalist</b> (repetition and slow change) and <b>spectral</b> (harmony drawn from the overtones of sounds). Listeners follow a piece more easily when its language stays consistent. So a deliberate switch, say from tonal to atonal halfway through, lands as a structural event, as clearly as a new section.</p>` },
    { title: "Craft and process", kick: "Finishing pieces", render: () => `<ul><li><b>Draft fast, revise slowly.</b> Finish a rough version of the whole piece before polishing details.</li>
      <li><b>Revise</b> by asking what each section does and whether it's the right length. Cutting is often the best fix.</li>
      <li><b>Hear it.</b> Software playback helps, but real performers reveal balance, playability and notation problems. Ask players to read drafts.</li>
      <li><b>Notate clearly</b>: tempo, dynamics, articulations, and instructions for anything unusual. Prepare clean parts (see Score and Parts Preparation).</li>
      <li><b>Keep going</b>: deadlines, regular writing time and small constraints help with writer's block.</li></ul>` },
    { title: "Quick check", kick: "Before the drills", render: H => Object.keys(F).map(m => { const [q, a, w, y] = F[m][0]; return H.check(q, a, w, y); }).join("") },
  ] };
  const ALL = Object.values(F).flat();
  function make(mode, H) { if (GEN[mode] && Math.random() < .4) return GEN[mode](H); const [q, a, w, y] = H.rnd(F[mode] || ALL); return H.mc(q, a, w, y); }
  const reference = () => `<ul><li><b>Ideas</b>: motive, improvisation, text, sound, constraint, models. Sketch fast.</li><li><b>Development</b>: repetition, sequence, inversion, retrograde, augmentation, diminution, fragmentation, reharmonization, re-orchestration.</li><li><b>Form</b>: strophic, verse–chorus, binary, ternary, rondo, variations, through-composed. Contrast several elements at once.</li><li><b>Texture</b>: wide spacing low, close spacing high; write idiomatically.</li><li><b>Process</b>: draft the whole piece, then revise; get performers' feedback.</li></ul>`;
  return { key: "silverapps-composition-v1", lesson, make, reference, modes: [{ id: "ideas", kicker: "Finding ideas" }, { id: "develop", kicker: "Developing material" }, { id: "form", kicker: "Form" }, { id: "craft", kicker: "Craft and process" }], topics: [] };
})();
window.FAM.quiz = [
  {"s": 1, "q": "A motive is best described as…", "a": "a few notes with a distinctive rhythm or interval", "w": ["a complete movement", "a chord progression on its own", "a tempo marking"], "hint": "It's small but recognizable.", "why": "A motive is short enough to remember and distinctive enough to develop."},
  {"s": 1, "q": "When should early sketches be judged?", "a": "later: write ideas down quickly first", "w": ["before anything is written down", "only once the parts are printed", "while choosing the title"], "hint": "Speed first, evaluation after.", "why": "Sketch fast in notation, voice memos or DAW clips; judging comes later."},
  {"s": 1, "q": "A composer starts from a set form, a fixed group of pitches or a time limit. That starting point is…", "a": "a plan or constraint", "w": ["a motive", "a text", "a model"], "hint": "Limits can generate ideas.", "why": "Forms, pitch sets, time limits and a performer's strengths are all constraints that get a piece started."},
  {"s": 1, "q": "Studying how admired pieces handle form and orchestration, then making your own choices, is working from…", "a": "models", "w": ["constraints", "improvisation", "a text"], "hint": "Learning from other composers' work.", "why": "Models show how others solved problems; the composer then decides independently."},
  {"s": 2, "q": "In a sequence, what changes?", "a": "the pitch level", "w": ["the note lengths", "the order of the notes", "the instrument"], "hint": "The same shape, somewhere else.", "why": "A sequence repeats an idea starting on a different pitch."},
  {"s": 2, "q": "Augmentation changes…", "a": "the note lengths, making them longer", "w": ["the pitch level", "the direction of each interval", "the chords underneath"], "hint": "Its opposite is diminution.", "why": "Augmentation lengthens the durations; diminution shortens them."},
  {"s": 2, "q": "Playing a motive backward, last note first, is called…", "a": "retrograde", "w": ["inversion", "augmentation", "sequence"], "hint": "It reverses the order.", "why": "Retrograde reverses the order of the notes; inversion flips the direction of the intervals."},
  {"s": 2, "q": "Turning each interval of a motive in the opposite direction is called…", "a": "inversion", "w": ["retrograde", "diminution", "fragmentation"], "hint": "Upside down, not backward.", "why": "Inversion keeps the order but flips each interval's direction."},
  {"s": 2, "q": "Developing only part of an idea is called…", "a": "fragmentation", "w": ["inversion", "augmentation", "reharmonization"], "hint": "A piece of the whole.", "why": "Fragmentation takes a few notes of a motive and works with those alone."},
  {"s": 2, "q": "Keeping a melody but changing the chords under it is…", "a": "reharmonization", "w": ["sequence", "diminution", "fragmentation"], "hint": "What changes is underneath.", "why": "Reharmonization gives the same melody a new harmonic context."},
  {"s": 2, "q": "Moving an idea to another instrument, register or texture is…", "a": "re-orchestration", "w": ["retrograde", "sequence", "augmentation"], "hint": "Same notes, new color.", "why": "Re-orchestration changes how the idea sounds without changing its pitches or rhythm."},
  {"s": 3, "q": "Rondo form follows the pattern…", "a": "A B A C A", "w": ["A B A", "A A A", "A B"], "hint": "A refrain keeps coming back between contrasting sections.", "why": "Rondo alternates a returning A section with different episodes."},
  {"s": 3, "q": "Strophic form uses…", "a": "the same music for every verse", "w": ["continuously new music", "a statement, contrast and return", "alternating verse and chorus music"], "hint": "Think of a hymn.", "why": "In strophic form each verse is sung to the same music."},
  {"s": 3, "q": "Through-composed music…", "a": "keeps presenting new material, often following a text or story", "w": ["repeats one section many times", "always follows A B A", "has no melody"], "hint": "It doesn't loop back.", "why": "Through-composed music continues with new material instead of repeating sections."},
  {"s": 3, "q": "A new section is clearest to listeners when…", "a": "several things change at once, such as key, texture, register and tempo", "w": ["only the dynamics change", "nothing changes", "the melody repeats exactly"], "hint": "Many signals together.", "why": "When several elements change together, listeners hear a clear boundary."},
  {"s": 3, "q": "Where do many pieces place their main climax?", "a": "well past the midpoint", "w": ["at the very beginning", "exactly halfway", "in the first phrase"], "hint": "Energy usually builds for a while first.", "why": "Many pieces build for most of their length and peak well past the middle."},
  {"s": 3, "q": "Form is a balance between…", "a": "repetition and contrast", "w": ["loud and soft", "fast and slow tempos", "major and minor keys only"], "hint": "Recognition versus interest.", "why": "Listeners need repetition to recognize ideas and contrast to stay engaged."},
  {"s": 4, "q": "Following the harmonic series, a chord's spacing should have…", "a": "wide intervals low and closer ones high", "w": ["close intervals low and wide ones high", "equal intervals throughout", "every note within one octave"], "hint": "Look at how overtones are spaced.", "why": "The harmonic series is widely spaced at the bottom and closer at the top; chords spaced that way sound clear."},
  {"s": 4, "q": "Close chords low in the bass register tend to sound…", "a": "muddy", "w": ["bright", "thin", "piercing"], "hint": "Low intervals need space.", "why": "Close intervals low down blur together."},
  {"s": 4, "q": "Writing idiomatically means…", "a": "writing what suits the instrument and is comfortable for the player", "w": ["using only whole notes", "avoiding every difficult passage", "copying another piece"], "hint": "Know ranges, breathing, bowing and hand positions.", "why": "Idiomatic writing fits the way the instrument is actually played."},
  {"s": 4, "q": "A texture of independent lines is called…", "a": "counterpoint", "w": ["melody with accompaniment", "a single line", "block chords"], "hint": "Several melodies at once.", "why": "Counterpoint combines lines that each have their own shape and rhythm."},
  {"s": 4, "q": "One of the simplest ways to vary a returning idea is to change its…", "a": "register", "w": ["title", "time signature only", "key signature only"], "hint": "Low flute versus high trumpet.", "why": "The same melody sounds very different in another register."},
  {"s": 5, "q": "A musical language built on harmony drawn from the overtones of sounds is…", "a": "spectral", "w": ["minimalist", "modal", "tonal"], "hint": "Named after the spectrum of a sound.", "why": "Spectral composers derive harmony from the overtone content of sounds."},
  {"s": 5, "q": "Twelve-tone rows and pitch-class sets belong to … music.", "a": "post-tonal", "w": ["modal", "tonal", "spectral"], "hint": "After functional harmony.", "why": "Rows and sets organize pitch without keys or functional harmony."},
  {"s": 5, "q": "Modal music typically relies on…", "a": "modes and drones", "w": ["functional harmony", "tone rows", "constant modulation"], "hint": "A sustained note underneath helps define the color.", "why": "Modal music centers on a mode's color, often over a drone."},
  {"s": 5, "q": "Repetition with slow, gradual change is the hallmark of … music.", "a": "minimalist", "w": ["spectral", "chromatic", "post-tonal"], "hint": "Less material, more time.", "why": "Minimalism builds pieces from repetition and slow change."},
  {"s": 5, "q": "A deliberate switch from tonal to atonal language halfway through a piece is heard as…", "a": "a structural event, like a new section", "w": ["a mistake", "no change at all", "a change of tempo"], "hint": "Consistency makes change noticeable.", "why": "Because listeners expect a consistent language, a switch marks a formal boundary."},
  {"s": 6, "q": "\"Draft fast, revise slowly\" means…", "a": "finish a rough version of the whole piece before polishing details", "w": ["perfect each bar before writing the next", "never revise", "write the ending first and stop"], "hint": "The whole shape first.", "why": "A complete rough draft shows what each section needs before detail work starts."},
  {"s": 6, "q": "When revising, which fix often works best?", "a": "cutting", "w": ["adding more sections", "repeating everything twice", "changing the title"], "hint": "Ask whether each section is the right length.", "why": "Many drafts improve most when unnecessary material is removed."},
  {"s": 6, "q": "Why have performers read a draft?", "a": "they reveal balance, playability and notation problems that software playback misses", "w": ["software playback is always wrong", "to avoid notating dynamics", "so they can rewrite it"], "hint": "Real players, real problems.", "why": "Playback can't show what's awkward to play or unclear to read."},
  {"s": 6, "q": "Which of these helps with writer's block?", "a": "deadlines, regular writing time and small constraints", "w": ["waiting for inspiration only", "unlimited time", "starting a new piece every day"], "hint": "Structure keeps work moving.", "why": "Routine and limits make it easier to keep going."}
];
