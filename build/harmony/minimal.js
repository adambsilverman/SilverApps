window.FAM = (() => {
  // ===== Minimalist and ambient music techniques. =====
  const tbl = (cap, head, rows) => `<div class="ltable-wrap" tabindex="0" role="region" aria-label="${cap}"><table class="ltable"><caption>${cap}</caption><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  const F = {
    proc: [
      ["Process music is music in which…", "a gradual, audible process shapes the piece", ["every note is improvised freely", "the form is verse–chorus", "nothing repeats"], "Listeners can follow the process as it unfolds."],
      ["Phasing is…", "two identical patterns drifting or stepping out of alignment and back", ["a sudden key change", "a vocal technique", "playing in unison throughout"], "Steve Reich explored it with tape loops and then live performers."],
      ["Additive process means…", "a pattern grows by adding notes or units (1; 1 2; 1 2 3…)", ["notes are removed one at a time", "two melodies alternate", "the tempo doubles"], "Subtractive process removes them. Philip Glass used both in early works."],
      ["In many minimalist pieces, a steady pulse…", "runs underneath slowly changing patterns", ["is avoided", "changes every bar", "is replaced by silence"], "The pulse makes small changes easy to hear."],
      ["Modules that performers repeat and move through at their own pace…", "create ever-shifting overlaps between players", ["require strict unison", "are always written for solo piano", "remove repetition"], "Terry Riley used this idea in an influential 1960s ensemble piece."],
      ["Minimalism emerged as a recognized style in…", "the 1960s, in the United States", ["the 1830s, in Vienna", "the 1990s, in Japan", "the Renaissance"], "La Monte Young, Terry Riley, Steve Reich and Philip Glass are often named as founders."],
    ],
    harm: [
      ["A drone is…", "a sustained or repeated pitch (or pitches) under changing music", ["a fast scale", "a rest", "a type of cadence"], "Found in many traditions; La Monte Young built long works on drones in just intonation."],
      ["Slow harmonic rhythm in minimalist and ambient music…", "lets a single chord or mode last a long time so details come forward", ["means chords change every beat", "requires twelve-tone rows", "avoids all chords"], "Listeners focus on timbre, rhythm and small changes."],
      ["Arvo Pärt's tintinnabuli technique pairs…", "a melodic voice moving mostly by step with a voice using only the notes of one triad", ["two twelve-tone rows", "a drum and a drone", "random notes"], "From the Latin for little bells."],
      ["Just intonation is attractive for drone-based music because…", "pure intervals ring without beating against a sustained drone", ["it uses more notes", "it's easier to notate", "it requires electronic instruments"], "Try the Drone app's just-intonation settings."],
      ["Pauline Oliveros developed 'Deep Listening', a practice of…", "attentive listening to all sounds, including the environment and one's own", ["listening at high volume", "listening only to recordings", "transcribing solos"], "Influential in improvisation and ambient practice."],
    ],
    amb: [
      ["The term 'ambient music' was popularized by…", "Brian Eno in the late 1970s", ["Ludwig van Beethoven", "Hildegard of Bingen", "Scott Joplin"], "He described music that could be listened to closely or simply sit in the background."],
      ["Erik Satie's idea of 'furniture music' (musique d'ameublement) anticipated…", "music meant to be part of the environment rather than the focus", ["the symphony", "opera", "the march"], "An early precursor of ambient music."],
      ["Layering loops of different lengths (e.g. 7 and 9 seconds) produces…", "constantly changing combinations that repeat only after a long time", ["exact repetition every 7 seconds", "silence", "a key change"], "Eno used tape loops of unrelated lengths this way."],
      ["Generative music is…", "music produced by a system of rules or chance, so it may never repeat exactly", ["music written note by note", "only improvised jazz", "a film score"], "The composer designs the system rather than every note."],
      ["Long reverb and delay in ambient music…", "blur attacks and blend sounds into a continuous texture", ["make every note short", "remove the bass", "speed up the tempo"], "Sounds overlap and decay slowly."],
      ["Field recordings in ambient music are…", "recordings of environmental sounds (rain, birds, cities) used as material", ["recordings of orchestras only", "MIDI files", "metronome clicks"], "They place the music in a sense of place."],
      ["Éliane Radigue is known for…", "slowly evolving electronic drones", ["rapid piano études", "marching band music", "opera overtures"], "Her music changes so gradually that listeners notice shifts only over minutes."],
    ],
    people: [
      ["Steve Reich is closely associated with…", "phasing and rhythmic process", ["twelve-tone rows", "bebop", "Baroque opera"], "Also with pulse-based ensemble music and speech melody."],
      ["Philip Glass is known for…", "repeating arpeggios and additive and subtractive rhythmic processes", ["serialism", "atonal opera only", "Gregorian chant"], "He wrote for his own ensemble, for opera and for film."],
      ["La Monte Young is known for…", "very long durations, drones and just intonation", ["fast virtuosic études", "hip-hop production", "string quartets in sonata form"], "His work influenced drone, ambient and rock musicians."],
      ["Terry Riley is known for…", "repeating modules, tape-delay loops and improvisation", ["twelve-tone symphonies", "marching band arrangements", "church cantatas"], "He also drew on Indian classical music."],
      ["Julius Eastman was…", "a composer and performer whose minimalist works built up by accumulation and repetition", ["a Baroque organist", "a film editor", "a lute maker"], "His music has been widely rediscovered in recent years."],
      ["Meredith Monk is known for…", "extended vocal techniques and repetitive, layered vocal music", ["electric guitar solos", "serial piano music", "brass band marches"], "She works across music, theater and film."],
      ["Arvo Pärt is known for…", "tintinnabuli: triad-based bell-like voices with stepwise melody", ["phasing tape loops", "big-band jazz", "twelve-tone rows only"], "An Estonian composer whose style emerged in the 1970s."],
    ],
  };
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const TRI = { A: "C", B: "C", C: "E", D: "E", E: "A", F: "A", G: "A" };
  const GEN = {
    proc: H => {
      if (Math.random() < .5) { const n = H.rnd([4, 5]), u = "1 2 3 4 5".split(" ").slice(0, n), k = 3 + Math.floor(Math.random() * (n - 2)); const stage = j => u.slice(0, j).join(" ");
        return H.mc(`An additive process grows the pattern ${u.join(" ")} like this: “${stage(1)}”, then “${stage(2)}”… What is stage ${k}?`, stage(k), [stage(k - 1), stage(k + 1 > n ? k - 2 || 1 : k + 1), u.slice(n - k).join(" "), u.slice(0, k).reverse().join(" ")], `Each stage adds the next unit: stage ${k} = ${stage(k)}.`); }
      const a = H.rnd([3, 4, 5, 6]), b = H.rnd([4, 5, 7, 8, 9].filter(x => x !== a)), l = a * b / gcd(a, b);
      return H.mc(`Two loops start together. One is ${a} beats long, the other ${b}. After how many beats do they start together again?`, `${l} beats`, [a + b, Math.max(a, b) * 2, a * b + a, l / 2 > Math.max(a, b) ? l / 2 : l + a].filter(x => x !== l).map(x => `${x} beats`), `The least common multiple of ${a} and ${b} is ${l}.`);
    },
    harm: H => { const m = H.rnd(Object.keys(TRI)); return H.mc(`Tintinnabuli in A minor: the triad voice uses only A, C and E, taking the nearest triad note above the melody note. If the melody note is ${m}, which note does the triad voice take?`, TRI[m], ["A", "C", "E"].filter(x => x !== TRI[m]).concat([m]), `The nearest A-minor triad note above ${m} is ${TRI[m]}.`); },
  };
  // additive process: each bar adds an eighth, so the meter grows (2/8, 3/8, 4/8, 5/8); each bar beamed as one group
  const ADD = ["C5", "G4", "E5", "G4", "D5"];
  const add = { type: "score", clefs: ["treble"], time: "2/8", vf: "C", sig: {}, bpm: 160, minBar: 60, final: true, bars: [2, 3, 4, 5].map((n, b) => Object.assign({ t: [ADD.slice(0, n).map((k, i) => Object.assign({ k: [k], d: "8" }, i === 0 ? { ly: String(b + 1) } : {}))], groups: [n + "/8"] }, b ? { time: n + "/8" } : {})) };
  const lesson = { steps: [
    { title: "Less, slowly", kick: "What minimalism is", render: () => `<p><b>Minimalism</b> emerged in the 1960s in the United States, in the work of La Monte Young, Terry Riley, Steve Reich and Philip Glass, and soon spread widely. Its music typically uses:</p>
      <ul><li><b>Repetition</b> of short patterns, often over a steady <b>pulse</b>.</li><li><b>Gradual change</b>: small, audible steps rather than sudden contrasts.</li><li><b>Limited material</b>: few pitches, a single mode or chord for a long time.</li><li><b>Process</b>: a rule that generates the music, which the listener can follow.</li></ul>
      <p>Because so little changes, each change, such as a new note, a shifted accent or a different instrument, becomes an event.</p>` },
    { title: "Processes", kick: "Phasing, adding, subtracting", render: (H, k, U) => `<ul><li><b>Phasing</b>: two players (or tape loops) play the same pattern, one gradually or step by step moving ahead, through every alignment until they meet again. Try it in Rhythm Performance's Clapping Music modes.</li>
      <li><b>Additive process</b>: a pattern grows one unit at a time; <b>subtractive process</b> removes units.</li>
      <li><b>Modules</b>: short fragments each performer repeats and moves through at their own pace, creating shifting overlaps.</li>
      <li><b>Augmentation</b> of a pattern into very long durations.</li></ul>
      ${U.fig(add, "Additive process: each repetition adds one note to the pattern.")}` },
    { title: "Harmony that stands still", kick: "Drones, modes, tintinnabuli", render: () => `<ul><li><b>Drones</b> and pedal points: a sustained pitch under everything, as in many traditions. La Monte Young built very long works on drones tuned in <b>just intonation</b>, where pure intervals ring without beating.</li>
      <li><b>Slow harmonic rhythm</b>: one chord or mode for minutes, so timbre and rhythm come forward.</li>
      <li><b>Modal and diatonic</b> pitch collections, often without functional cadences.</li>
      <li><b>Tintinnabuli</b> (Arvo Pärt): a melodic voice moves mostly by step while a second voice uses only the notes of one triad, like bells.</li>
      <li><b>Deep Listening</b> (Pauline Oliveros): attending to every sound, including the room and the listener's own body.</li></ul>
      ${tbl("Tintinnabuli in A minor: triad note above each melody note", ["Melody", "A", "B", "C", "D", "E", "F", "G"], [["Triad voice", ...["A", "B", "C", "D", "E", "F", "G"].map(m => TRI[m])]])}` },
    { title: "Ambient music", kick: "Music as environment", render: () => `<p>Erik Satie's idea of <b>furniture music</b> (around 1917) imagined music as part of a room's environment. In the late 1970s <b>Brian Eno</b> popularized the term <b>ambient music</b>: music that rewards close listening but can also sit in the background.</p>
      <ul><li><b>Loops of different lengths</b>: layered loops that don't divide evenly (7 and 9 seconds, say) realign only rarely, so the texture keeps changing.</li>
      <li><b>Generative systems</b>: rules and chance produce the music, so it may never repeat exactly.</li>
      <li><b>Texture and timbre</b> over melody; slow attacks and long releases.</li>
      <li><b>Long reverb and delay</b> blur notes into a continuous wash.</li>
      <li><b>Field recordings</b> and environmental sound.</li>
      <li><b>Slowly evolving drones</b>, as in Éliane Radigue's electronic music.</li></ul>` },
    { title: "Using these techniques", kick: "In your own music", render: () => `<ul><li>Start with a short pattern and a rule (add a note each time; shift by one pulse; drop a note), and let the rule run.</li>
      <li>Layer loops of different lengths and listen for the moments they line up.</li>
      <li>Hold one chord or a drone for a long time and vary only timbre, register or density.</li>
      <li>Write a melody by step and add a triad voice in the tintinnabuli way.</li>
      <li>In a DAW: long reverbs, delays synced to unusual note values, slow filter and volume automation.</li></ul>
      <p>Try all of these in the <a href="process-lab.html">Minimalist Process Lab</a>: write a fragment and set canons, phasing, additive and subtractive processes, chord loops and drones running in several voices.</p>
      <p>These techniques are everywhere: in film and game scores, electronic dance music, pop production and contemporary classical music.</p>` },
    { title: "Quick check", kick: "Before the drills", render: H => Object.keys(F).map(m => { const [q, a, w, y] = F[m][0]; return H.check(q, a, w, y); }).join("") },
  ] };
  const ALL = Object.values(F).flat();
  function make(mode, H) { if (GEN[mode] && Math.random() < .4) return GEN[mode](H); const [q, a, w, y] = H.rnd(F[mode] || ALL); return H.mc(q, a, w, y); }
  const reference = () => `<ul><li><b>Minimalism</b> (1960s, US): repetition, pulse, gradual audible process, limited material.</li><li><b>Processes</b>: phasing, additive and subtractive process, modules, augmentation.</li><li><b>Harmony</b>: drones, just intonation, slow harmonic rhythm, modal collections, tintinnabuli.</li><li><b>Ambient</b>: furniture music (Satie), ambient music (Eno), loops of different lengths, generative systems, reverb and delay, field recordings, drones.</li><li><b>People</b>: La Monte Young, Terry Riley, Steve Reich, Philip Glass, Pauline Oliveros, Julius Eastman, Meredith Monk, Arvo Pärt, Brian Eno, Éliane Radigue.</li></ul>`;
  return { key: "silverapps-minimal-v1", lesson, make, reference, modes: [{ id: "proc", kicker: "Process" }, { id: "harm", kicker: "Harmony and listening" }, { id: "amb", kicker: "Ambient" }, { id: "people", kicker: "Composers" }], topics: [] };
})();
