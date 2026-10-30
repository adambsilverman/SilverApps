window.FAM = (() => {
  // ===== Harp. Sources: the MTC 341/541 Harp and Harp Pedal Practice pages, and Freund & Cutler, Extreme Orchestration (harp intro and scoring). =====
  const F = (q, a, w, why) => ({ q, a, w, why });
  const ORDER = ["D", "C", "B", "E", "F", "G", "A"];              // pedal order, left foot | right foot
  const NAT = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const ACC = { "-1": "♭", "0": "♮", "1": "♯" };
  const ACCW = { "-1": "flat", "0": "natural", "1": "sharp" };
  const foot = L => ORDER.indexOf(L) < 3 ? "left" : "right";
  const pc = (L, a) => (NAT[L] + a + 12) % 12;
  const letters = set => ORDER.slice(0, 3).map(L => L + ACC[set[L]]).join(" ") + " | " + ORDER.slice(3).map(L => L + ACC[set[L]]).join(" ");
  // Pedal diagram: a mark above the line = flat, on the line = natural, below = sharp; a bar separates the feet.
  function diag(set, cap) {
    const xs = [26, 54, 82, 138, 166, 194, 222], y0 = 40;
    const marks = ORDER.map((L, i) => { const a = set[L], y = a < 0 ? y0 - 22 : a > 0 ? y0 + 6 : y0 - 8; return `<rect x="${xs[i] - 3}" y="${y}" width="6" height="16" rx="1.5" fill="currentColor"/>`; }).join("");
    const label = `Harp pedal diagram: ${letters(set).replace(/♭/g, " flat").replace(/♮/g, " natural").replace(/♯/g, " sharp").replace("|", ", then right foot:")}`;
    return `<figure class="pedal"><svg viewBox="0 0 248 80" role="img" aria-label="${label}" focusable="false"><line x1="8" y1="${y0}" x2="240" y2="${y0}" stroke="currentColor" stroke-width="2"/><line x1="110" y1="10" x2="110" y2="70" stroke="currentColor" stroke-width="2.5"/>${marks}</svg>${cap ? `<figcaption>${cap}</figcaption>` : ""}</figure>`;
  }
  const MAJ = { "C♭": -7, "G♭": -6, "D♭": -5, "A♭": -4, "E♭": -3, "B♭": -2, F: -1, C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, "F♯": 6, "C♯": 7 };
  const REL = { "C♭": "A♭", "G♭": "E♭", "D♭": "B♭", "A♭": "F", "E♭": "C", "B♭": "G", F: "D", C: "A", G: "E", D: "B", A: "F♯", E: "C♯", B: "G♯", "F♯": "D♯", "C♯": "A♯" };
  const keySet = k => { const n = MAJ[k], s = {}; ORDER.forEach(L => s[L] = 0); if (n > 0) "FCGDAEB".slice(0, n).split("").forEach(L => s[L] = 1); if (n < 0) "BEADGCF".slice(0, -n).split("").forEach(L => s[L] = -1); return s; };
  const keyName = k => `${k} major / ${REL[k]} minor`;
  // chord glissandos: every one of the seven strings must sound a chord tone
  const ROOTS = ["C", "D♭", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
  const CH = { "7": [0, 4, 7, 10], "m7": [0, 3, 7, 10], "△7": [0, 4, 7, 11], "ø7": [0, 3, 6, 10], "°7": [0, 3, 6, 9], "9": [0, 2, 4, 7, 10] };
  function glissSet(root, q) {
    const s = new Set(CH[q].map(x => (x + ROOTS.indexOf(root)) % 12)), set = {};
    for (const L of ORDER) { const a = [0, -1, 1].find(a => s.has(pc(L, a))); if (a === undefined) return null; set[L] = a; }
    return set;
  }
  const GLISS = []; ROOTS.forEach(r => Object.keys(CH).forEach(q => { const s = glissSet(r, q); if (s) GLISS.push({ sym: r + q, set: s }); }));

  const INST = [
    F("How many strings does the modern concert (double-action pedal) harp have?", "47", ["36", "52", "88"], "Spanning over six and a half octaves, from C♭1 to G♯7."),
    F("Harp strings are color-coded. Which are usually red?", "the Cs", ["the Fs", "the Gs", "the As"], "Cs are red, Fs black or purple, the rest white: landmarks for leaps."),
    F("Which hand can't reach the lowest strings?", "the right hand (it reaches down only to about G2)", ["the left hand", "neither hand", "both hands, equally"], "The harp rests on the right shoulder; the left hand can play the whole range."),
    F("How many fingers per hand does a harpist use?", "four (never the little finger)", ["five", "three", "two"], "That's why groups of more than four notes per hand are awkward."),
    F("Which strings are NOT connected to the pedals?", "the lowest C and D and the highest G", ["all the C strings", "the middle octave", "the wound bass strings"], "They're tuned with the tuning key before the piece and stay that way."),
    F("Plucked harp strings…", "ring until they stop on their own or are damped", ["stop as soon as the finger leaves", "sustain only with a pedal down", "sound for exactly the written value"], "Low strings ring longest; low passages can get muddy, like piano with the damper pedal down."),
    F("Why must harp music use careful enharmonic spelling?", "A♯ and B♭ are played on different strings", ["harpists read only sharps", "it changes the pitch", "the harp has no flats"], "To the harpist's hands, A♯ and B♭ are as different as A♭ and B♯."),
    F("Can double sharps or double flats be written for harp?", "no: respell them enharmonically", ["yes, with two pedal notches", "only in the bass", "only in glissandos"], "Each pedal has only three positions: flat, natural, sharp."),
    F("Why is sight-reading especially hard on the harp?", "the pedal changes have to be worked out and marked first", ["the strings must be retuned every page", "harp parts have no rhythm", "harpists can't see the conductor"], "If parts are due at the last minute, produce the harp part first."),
    F("How long can it take a harpist to tune all the strings before a performance?", "ten minutes or more", ["about ten seconds", "an hour", "harps don't need tuning"], "Each string is tuned individually with a tuning key."),
    F("A harpist can comfortably reach, in one hand…", "a tenth", ["only a sixth", "two octaves", "only a fifth"], "Harp strings are closer together than piano keys."),
    F("Where does the harp go in the orchestral score?", "after the percussion, before the keyboards and strings", ["at the top", "between oboes and clarinets", "after the strings"], "Score order: winds, brass, percussion, harp, keyboards, strings."),
    F("Which is EASY to play on the harp?", "glissandos and a few rolled chords", ["abundant rapid chromaticism", "five-finger piano figuration", "rapid repeated attacks on the same chord"], "A melody over a simple harmonization, or a steady ‘motor’ figure in one hand, also works well."),
    F("Which is DIFFICULT on the harp?", "lots of quickly changing chromatic notes and chords", ["a single doubling harmonic", "a glissando", "a melody with a simple accompaniment"], "Every chromatic change may need a pedal change."),
  ];
  const PEDAL = [
    F("From left to right, the harp pedals are…", "D C B | E F G A", ["C D E | F G A B", "A G F | E D C B", "D C B E | F G A"], "“Did Columbus Bring Enough Food Going (to) America?” or “Do Cow Boys Ever Fear God Almighty?”"),
    F("Which foot works the D, C and B pedals?", "the left foot", ["the right foot", "either foot", "the knees"], "Left foot: D C B. Right foot: E F G A."),
    F("A pedal in its top (raised) notch makes its strings…", "flat", ["natural", "sharp", "muted"], "Top = flat, middle = natural, bottom = sharp, in every octave."),
    F("With all seven pedals raised (top notches), the harp plays…", "C♭ major", ["C major", "C♯ major", "a chromatic scale"], "All middle: C major. All down: C♯ major."),
    F("Each pedal changes…", "every string of that letter, in all octaves", ["one string", "the strings in one octave", "only the bass strings"], "The D pedal sets every D string."),
    F("How many pedal changes can be made at the same moment?", "two, one with each foot", ["any number", "one", "three"], "B♭→B♮ and G♯→G♭ together is fine; B♭→B♮ and C♯→C♭ is not (both left foot)."),
    F("Where should a pedal diagram or pedal letters go in a harp part?", "above the top staff or below the bottom one", ["between the two staves", "in the bass clef only", "at the end of the piece"], "The preferred method is a diagram."),
    F("Who should usually decide where pedal changes go?", "the harpist (spell logically; indicate settings at the start or in glissandos)", ["the conductor", "the composer, on every beat", "the concertmaster"], "Harpists have individual preferences."),
    F("Why can a pedal change be heard even when the string isn't plucked?", "a string that's still ringing changes pitch when its pedal moves", ["pedals click loudly", "the soundboard buzzes", "it can't be heard"], "Any string of that letter that's still sounding bends to the new pitch."),
    F("How long does it take to reset all seven pedals?", "a few seconds", ["less than a tenth of a second", "about a minute", "they can't all be reset"], "But frequent wholesale changes are a burden: the number one harp pitfall after impossible notes."),
    F("A harp pedal glissando is…", "moving the pedal after plucking, so the ringing note bends", ["a glissando played with the feet only", "a scale on the pedals", "an electronic effect"], "Usually a half step, best on octaves in the low register."),
  ];
  const TECH = [
    F("Harp harmonics sound…", "an octave higher than written", ["as written", "two octaves higher", "an octave lower"], "Notate them where they're played, with a small circle over the note."),
    F("Harp harmonics work best…", "at mf or softer, within the treble and bass staves", ["fortissimo", "in the highest octave", "only in the lowest octave"], "A harmonic played f isn't much louder than one played p."),
    F("Can a harpist play more than one harmonic at once in one hand?", "yes: small intervals, and even three-note chords", ["no, never", "only in the right hand", "only at ff"], "Keep the notes close together (sources give up to a 4th, or up to a 6th); no more than three at once."),
    F("Unless marked otherwise, block chords on the harp are…", "rolled quickly upward", ["played exactly together", "rolled downward", "played as harmonics"], "For unrolled chords, bracket them or write non arpeggiato (non arp.); cancel with ord."),
    F("How do you notate a glissando so the pedal setting is clear?", "write the first seven notes (often as 32nds), then a line to the last note", ["write only the last note", "write the word gliss. alone", "write every note of the glissando"], "Or give a pedal diagram; show exactly where it starts and ends in time."),
    F("A fingernail glissando…", "adds a glittery, metallic sound; descending, ppp to mf", ["is played upward at ff", "uses a guitar pick", "mutes the strings"], "A plectrum glissando can go both ways, f or softer."),
    F("Bisbigliando (“whispering”) is…", "a soft, rapid tremolo on two or more strings with both hands", ["a one-hand trill", "a glissando with fingernails", "a damped chord"], "Enharmonic strings tuned to the same pitch help; pedals can change during it."),
    F("Why are staccato notes harder on the harp than on most instruments?", "each note must be plucked and then damped", ["the strings break", "harps have no staccato", "the pedals must move"], "So staccato passages work only at moderate or slow tempos."),
    F("Étouffez means…", "damp (stop) the strings", ["let vibrate", "play near the soundboard", "play with nails"], "A damping symbol below the bass staff means the same. l.v. means let vibrate."),
    F("Près de la table (p.d.l.t.) gives…", "a nasal, guitar-like tone, plucked near the soundboard", ["a bell-like harmonic", "a metallic buzz", "a muted thud"], "Possible at f or softer; return with ord."),
    F("Sons xylophoniques are…", "dry, muffled notes: the string is damped near the soundboard as it's plucked", ["harmonics", "glissandos", "notes played with mallets"], "A dry, wooden sound."),
    F("Which glissando direction allows double notes (thirds, fourths) in one hand?", "ascending", ["descending", "neither", "both equally"], "Downward glissandos use the thumb: single notes only."),
    F("A harp trill is most effective when…", "played with two hands, ideally with an enharmonic doubling", ["played with one finger", "played in the lowest octave", "played as harmonics"], "A one-hand trill is slow and weak."),
    F("Slurs in harp music mostly…", "show phrasing, and go over glissandos and tremolos", ["change the attack of each note", "mean let vibrate", "mean pedal changes"], "A slurred and an unslurred passage may be played the same way."),
    F("Harp arpeggios split between the hands should be grouped in…", "groups of four or fewer notes", ["groups of five", "groups of eight", "any grouping"], "Only four fingers per hand are used. Figures that switch direction (like Alberti bass) are harder."),
  ];
  const fromList = (H, list, kicker, topic) => { const f = H.rnd(list); return H.mc(f.q, f.a, f.w, f.why, { kicker, topic }); };
  const LETTERS = "CDEFGAB";
  function harmonicQ(H) {
    const clef = H.rnd(["treble", "bass"]), lo = clef === "treble" ? 30 : 18, step = lo + Math.floor(Math.random() * 8);
    let n = H.mk(step, 0); const L = LETTERS[n.l]; const a = H.rnd([0, 0, 0, -1, 1]); if (H.okNote(H.mk(step, a))) n = H.mk(step, a);
    const sounds = H.up(n, 7, 12);
    return H.mc(`A harp harmonic is written like this (a circle over the note). What does it sound?`, H.nm(sounds), [H.nm(n), H.nm(H.up(n, 14, 24)), H.nm(H.up(n, 4, 7)), H.nm(H.up(n, -7, -12))],
      `Harp harmonics sound an octave above the written note: ${H.nm(n)} sounds ${H.nm(sounds)}.`, { kicker: "Harmonics", topic: "tech", staff: { clef, groups: [[{ n, circle: true }]], label: `${clef} clef: ${H.nmSpoken(n)} with a harmonic circle.` }, play: { m: H.midi(sounds), pure: true }, playLabel: "Play the harmonic" });
  }
  function pedalQ(H) {
    const r = Math.random();
    if (r < .3) return fromList(H, PEDAL, "Pedals", "pedal");
    if (r < .55) {   // read a diagram: which key?
      const ks = Object.keys(MAJ), k = H.rnd(ks), set = keySet(k), near = ks.filter(x => x !== k && Math.abs(MAJ[x] - MAJ[k]) <= 3);
      return H.mc("Which key's scale does this pedal setting play?", keyName(k), H.shuffle(near).slice(0, 3).map(keyName), `${letters(set)}: the key signature of ${keyName(k)}.`, { kicker: "Read the diagram", topic: "pedal", fig: diag(set) });
    }
    if (r < .75) {   // simultaneous changes
      const [a, b] = H.shuffle(ORDER).slice(0, 2), ok = foot(a) !== foot(b);
      const ch = L => { const from = H.rnd([-1, 0, 1]), to = H.rnd([-1, 0, 1].filter(x => x !== from)); return `${L}${ACC[from]} → ${L}${ACC[to]}`; };
      return H.mc(`Can a harpist make these two pedal changes at the same moment: ${ch(a)} and ${ch(b)}?`, ok ? "Yes: one foot each" : "No: both pedals are on the same foot", ["Yes: one foot each", "No: both pedals are on the same foot"], `${a} is a ${foot(a)}-foot pedal and ${b} a ${foot(b)}-foot pedal. Left foot: D C B. Right foot: E F G A.`, { kicker: "Pedal changes", topic: "pedal" });
    }
    // enharmonic spelling with a given setting
    const k = H.rnd(Object.keys(MAJ).filter(x => Math.abs(MAJ[x]) <= 5)), set = keySet(k), L = H.rnd(ORDER), alt = H.rnd([-1, 0, 1].filter(x => x !== set[L])); set[L] = alt;
    const target = Math.floor(Math.random() * 12), strings = ORDER.filter(X => pc(X, set[X]) === target);
    const spell = [];
    ORDER.forEach(X => [-1, 0, 1].forEach(a => { if (pc(X, a) === target) spell.push(X + ACC[a]); }));
    const sp = s => s.replace("♮", "");
    const NA = "not playable with this setting";
    const sound = sp(spell.find(s => s.endsWith("♮")) || spell[0]);
    const ans = strings.length ? sp(strings[0] + ACC[set[strings[0]]]) : NA;
    if (strings.length > 1) return pedalQ(H);
    return H.mc(`With this pedal setting, how must the harpist's part spell the pitch that sounds like ${sound}?`, ans, spell.map(sp).concat([NA]), strings.length ? `Only the ${strings[0]} strings (set to ${strings[0]}${ACC[set[strings[0]]]}) sound that pitch here: ${letters(set)}.` : `No string sounds that pitch with ${letters(set)}; a pedal change is needed.`, { kicker: "Enharmonic spelling", topic: "pedal", fig: diag(set) });
  }
  function glissQ(H) {
    if (Math.random() < .3) return fromList(H, [
      F("Can a harp glissando sound only the notes of a major or minor triad?", "no: some string will always be a non-chord tone", ["yes, easily", "only in C major", "only with harmonics"], "Seven strings and only three pitch classes: D and A, for example, can't be retuned to C, E or G."),
      F("Which chord can be glissed with a pedal setting on any root?", "the diminished seventh", ["the major triad", "the dominant seventh", "the minor seventh"], "Its four notes are evenly spaced, so every letter has a chord tone a half step away at most."),
      F("Which 7th-chord types CAN be glissed (on some roots)?", "dominant, minor, major and half-diminished 7ths, and diminished 7ths on all roots", ["only major triads", "none", "only dominant 9ths"], "Each letter needs a flat, natural or sharp that's a chord tone; add a 9th or 11th to open up more roots."),
      F("A glissando of a whole seven-note scale needs…", "each pedal set to that scale's note", ["no pedals at all", "only the left-foot pedals", "harmonics"], "Any seven-note scale works, including exotic ones."),
    ], "Chord glissandos", "gliss");
    const g = H.rnd(GLISS), others = H.shuffle(GLISS.filter(x => x.sym !== g.sym)).slice(0, 3).map(x => x.sym);
    return H.mc("This pedal setting is for a chord glissando. Which chord does it sound?", g.sym, others, `${letters(g.set)}: every string is a tone of ${g.sym}, using enharmonic doublings.`, { kicker: "Chord glissandos", topic: "gliss", fig: diag(g.set) });
  }
  return {
    key: "orch-harp",
    modes: [{ id: "inst", kicker: "The instrument" }, { id: "pedal", kicker: "Pedals" }, { id: "gliss", kicker: "Glissandos" }, { id: "tech", kicker: "Techniques & notation" }],
    make(mode, H) {
      if (mode === "inst") return fromList(H, INST, "The instrument", "inst");
      if (mode === "pedal") return pedalQ(H);
      if (mode === "gliss") return glissQ(H);
      return Math.random() < .3 ? harmonicQ(H) : fromList(H, TECH, "Techniques & notation", "tech");
    },
    reference(H, esc) {
      return `<p><b>Pedals</b> (left foot | right foot): <b>D C B | E F G A</b>. Top notch = flat, middle = natural, bottom = sharp; each pedal sets that letter in every octave. Up to two changes at once, one per foot.</p>
      <div class="pedal-row">${diag(keySet("C"), "C major: all natural")}${diag(keySet("D"), "D major: C♯ and F♯")}${diag(GLISS.find(x => x.sym === "C°7").set, "C°7 chord glissando")}</div>
      <ul class="ref-list"><li><b>Range:</b> 47 strings, C♭1–G♯7. Right hand down to about G2. Four fingers per hand; tenths are easy.</li>
      <li><b>Spelling:</b> no double sharps or flats; spell to match the pedals (A♯ and B♭ are different strings).</li>
      <li><b>Harmonics:</b> circle over the written note; sound an octave higher; mf or softer, within the staves.</li>
      <li><b>Glissandos:</b> scales or 7th chords (no triads); show the first seven notes or a pedal diagram.</li>
      <li><b>Terms:</b> non arp., bisbigliando, étouffez, l.v., p.d.l.t., sons xylophoniques, ord.</li></ul>`;
    },
  };
})();
