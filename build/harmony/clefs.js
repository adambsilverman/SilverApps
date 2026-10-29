window.FAM = (() => {
  // ===== Reading Pitch: treble, bass, alto, tenor and grand staff. Engine: build/harmony/engine.js =====
  const LETTERS = "CDEFGAB";
  const BOTTOM = { treble: [2, 4], bass: [4, 2], alto: [3, 3], tenor: [1, 3] };   // bottom line: [letter index, octave] = E4, G2, F3, D3
  const CNAME = { treble: "treble", bass: "bass", alto: "alto", tenor: "tenor" };
  const MNEM = {
    treble: { lines: "E G B D F", lw: "Every Good Boy Does Fine", spaces: "F A C E", sw: "FACE" },
    bass: { lines: "G B D F A", lw: "Good Boys Do Fine Always", spaces: "A C E G", sw: "All Cows Eat Grass" },
    alto: { lines: "F A C E G", lw: "Fat Alley Cats Eat Grapes", spaces: "G B D F", sw: "Good Birds Don't Fly" },
    tenor: { lines: "D F A C E", lw: "Don't Forget Any Cello Etudes", spaces: "E G B D", sw: "Every Good Bassoon Delights" },
  };
  // staff step s (0 = bottom line … 8 = top line) → natural note
  const noteAt = (H, clef, s) => { const [l, o] = BOTTOM[clef], x = o * 7 + l + s; return H.N(H.mod(x, 7), 0, Math.floor(x / 7)); };
  const stepOf = (clef, n) => n.o * 7 + n.l - (BOTTOM[clef][1] * 7 + BOTTOM[clef][0]);
  const ORD = ["1st", "2nd", "3rd", "4th", "5th"];
  function where(s) {
    if (s >= 0 && s <= 8) return s % 2 === 0 ? `${ORD[s / 2]} line` : `${ORD[(s - 1) / 2]} space`;
    if (s === -1) return "space below the staff";
    if (s === 9) return "space above the staff";
    if (s < 0) { const k = -s; return k % 2 === 0 ? `${ORD[k / 2 - 1]} ledger line below` : `space below the ${ORD[(k - 1) / 2 - 1]} ledger line`; }
    const k = s - 8; return k % 2 === 0 ? `${ORD[k / 2 - 1]} ledger line above` : `space above the ${ORD[(k - 1) / 2 - 1]} ledger line`;
  }
  const nameO = (H, n) => H.nm(n) + n.o + (n.l === 0 && n.o === 4 ? " (middle C)" : "");
  // one staff, a row of whole notes (no time signature); notes: [{ k, ly, hl }]
  const one = (clef, notes, o = {}) => ({ type: "score", clefs: [clef], time: null, vf: "C", sig: {}, bpm: 70, final: false, rowW: o.rowW || 700, minBar: notes.length === 1 ? 110 : 70, scale: notes.length === 1 ? 1.9 : 1.25, bars: [{ [clef === "bass" ? "b" : "t"]: [notes.map(n => Object.assign({ d: "w" }, n))] }] });
  const grand = (cols, o = {}) => ({ type: "score", clefs: ["treble", "bass"], time: null, vf: "C", sig: {}, bpm: 70, final: false, rowW: o.rowW || 760, minBar: cols.length === 1 ? 110 : 70, scale: cols.length === 1 ? 1.6 : 1.25, bars: [{ t: [cols.map(c => Object.assign({ d: "w" }, c.t))], b: [cols.map(c => Object.assign({ d: "w" }, c.b))] }] });
  const rest = { k: [], ghost: true };
  const clefsOn = H => ["treble", "bass", "alto", "tenor"].filter(c => H.topicOn(c));
  function pickStep(H) {
    const staff = H.topicOn("staff"), ledger = H.topicOn("ledger");
    const opts = []; for (let s = -4; s <= 12; s++) { const inS = s >= -1 && s <= 9; if ((inS && staff) || (!inS && ledger)) opts.push(s); }
    return H.rnd(opts.length ? opts : [0, 1, 2, 3, 4, 5, 6, 7, 8]);
  }

  const FACTS = [
    ["Which clef curls around the G above middle C?", "the treble (G) clef", ["the bass (F) clef", "the alto (C) clef", "the tenor (C) clef"], "Its curl circles the 2nd line: G4."],
    ["The two dots of the bass clef surround which line?", "F below middle C (F3)", ["middle C", "G2", "A3"], "The bass clef is an F clef."],
    ["In the alto clef, which line is middle C?", "the middle (3rd) line", ["the 4th line", "the bottom line", "a ledger line below"], "The C clef's center marks middle C."],
    ["In the tenor clef, which line is middle C?", "the 4th line", ["the 3rd line", "the top line", "the 2nd line"], "The same C clef, placed one line higher than alto."],
    ["Which instrument reads mainly in alto clef?", "viola", ["violin", "cello", "trumpet"], "Alto clef is the viola's home clef."],
    ["Which instruments use tenor clef for their higher range?", "cello, bassoon and trombone", ["violin and flute", "viola and horn", "piano"], "It avoids ledger lines above the bass clef."],
    ["On the grand staff, middle C sits…", "on a ledger line between the two staves", ["on the top line of the treble staff", "in the bass clef's 3rd space", "on the middle line of the treble staff"], "One ledger line below the treble staff, or above the bass staff."],
    ["Moving from a line to the next space up (or a space to the next line) moves…", "one letter (a step)", ["two letters", "an octave", "a half step only"], "Line to line or space to space is a skip (a 3rd)."],
    ["The lines of the bass staff, middle C, and the lines of the treble staff together spell…", "every other letter: G B D F A C E G B D F", ["the C major scale", "only C, F and G", "nothing in particular"], "The great staff: eleven lines a 3rd apart."],
    ["Clef signs began as…", "letters (C, F and G) written on a staff line", ["pictures of instruments", "numbers", "abbreviations of Italian words"], "Over centuries the letters became today's stylized signs."],
    ["Who is credited with the staff of lines a 3rd apart, around the year 1000?", "Guido of Arezzo", ["J. S. Bach", "Pythagoras", "Johannes Gutenberg"], "Guido also colored the F line red and the C line yellow."],
    ["Why did older music move C clefs to different lines?", "to keep each voice's range on the staff, with few ledger lines", ["to change the key", "to show the tempo", "to mark a modulation"], "Soprano, mezzo-soprano, alto, tenor and baritone clefs all put middle C on a different line."],
    ["Notes that sound at the same time are written…", "vertically aligned, across every staff", ["slightly staggered", "aligned only within one staff", "with the bass note first"], "A grand staff, score or chord: same moment, same horizontal position."],
    ["In a chord with a 2nd, the noteheads…", "sit on opposite sides of the stem, the higher note to the right", ["overlap on the same side", "are written in different bars", "always use separate stems"], "The higher note of the 2nd is always to the right."],
    ["An accidental is placed…", "just before the notehead, exactly on its line or space", ["above the note", "after the note", "anywhere in the bar"], "And it lasts for the rest of the bar, on that line or space."],
    ["In a chord with several accidentals, which accidental goes closest to the chord?", "the highest one", ["the lowest one", "the loudest one", "it doesn't matter"], "Then the lowest, then the next highest, working inward in columns."],
    ["Does an accidental change where the beat's notes line up?", "no: the noteheads still align; space is made for the accidental in front", ["yes: the accidental aligns with the other notes", "yes: the note moves after the beat", "only in the bass clef"], "Line up noteheads, not accidentals."],
  ];

  function make(mode, H) {
    const clefs = clefsOn(H), clef = H.rnd(clefs.length ? clefs : ["treble"]);
    if (mode === "name" || mode === "octave") {
      const s = pickStep(H), n = noteAt(H, clef, s), grandStaff = (clef === "treble" || clef === "bass") && clefs.includes("treble") && clefs.includes("bass") && Math.random() < .35;
      const spec = grandStaff ? grand([clef === "treble" ? { t: { k: [H.nmO(n)], hl: false }, b: rest } : { t: rest, b: { k: [H.nmO(n)] } }]) : one(clef, [{ k: [H.nmO(n)] }]);
      if (grandStaff) { spec.bars[0][clef === "treble" ? "b" : "t"] = []; }
      const ans = mode === "name" ? H.nm(n) : nameO(H, n);
      const wrong = mode === "name" ? LETTERS.split("") : [-7, 7, -1, 1, -2, 2].map(d => { const x = n.o * 7 + n.l + d; return nameO(H, H.N(H.mod(x, 7), 0, Math.floor(x / 7))); });
      const m = MNEM[clef], line = s >= 0 && s <= 8 && s % 2 === 0;
      const why = `In ${CNAME[clef]} clef, the ${where(s)} is ${nameO(H, n)}.${s >= 0 && s <= 8 ? ` ${line ? `Lines: ${m.lines} (“${m.lw}”).` : `Spaces: ${m.spaces} (“${m.sw}”).`}` : " Count up or down by step from the nearest line you know."}`;
      return Object.assign(H.mc(`${grandStaff ? "On the grand staff" : `In ${CNAME[clef]} clef`}: what note is this?`, ans, wrong, why, { kicker: mode === "name" ? "Name the note" : "Note and octave", staff: spec, playQ: { chords: [[H.midi(n)]], dur: 1.2 }, playQLabel: "Play", topic: clef }), mode === "name" ? { choices: "ABCDEFG".split("") } : {});
    }
    if (mode === "where") {
      const s = pickStep(H), n = noteAt(H, clef, s), opts = [s - 2, s - 1, s + 1, s + 2, s + 7, s - 7].filter(x => x >= -4 && x <= 12);
      return H.mc(`Where is ${nameO(H, n)} in ${CNAME[clef]} clef?`, where(s), opts.map(where), `${nameO(H, n)} is on the ${where(s)} of the ${CNAME[clef]} staff.`, { kicker: "Find the line or space", staffAns: one(clef, [{ k: [H.nmO(n)], hl: true }]), topic: clef });
    }
    if (mode === "same") {
      const others = ["treble", "bass", "alto", "tenor"].filter(c => c !== clef && clefs.includes(c));
      const to = H.rnd(others.length ? others : ["treble", "bass", "alto", "tenor"].filter(c => c !== clef));
      let s, n, s2;
      for (let g = 0; g < 50; g++) { s = pickStep(H); n = noteAt(H, clef, s); s2 = stepOf(to, n); if (s2 >= -4 && s2 <= 12) break; }
      if (s2 < -4 || s2 > 12) return null;
      const opts = [s2 - 1, s2 + 1, s2 - 2, s2 + 2, s, s2 + 7, s2 - 7].filter(x => x >= -4 && x <= 12 && x !== s2);
      return H.mc(`This note is in ${CNAME[clef]} clef. Where is the same pitch in ${CNAME[to]} clef?`, where(s2), opts.map(where), `It's ${nameO(H, n)}: the ${where(s)} in ${CNAME[clef]} clef, the ${where(s2)} in ${CNAME[to]} clef.`, { kicker: "Same pitch, new clef", staff: one(clef, [{ k: [H.nmO(n)] }]), staffAns: one(to, [{ k: [H.nmO(n)], hl: true }]), playQ: { chords: [[H.midi(n)]], dur: 1.2 }, playQLabel: "Play", topic: [clef, to] });
    }
    // devices and principles
    if (Math.random() < .5) {
      const c = H.rnd(clefs.length ? clefs : ["treble"]), m = MNEM[c], lines = Math.random() < .5;
      const all = Object.values(MNEM).flatMap(x => [x.lines, x.spaces]);
      return H.mc(`${lines ? "The lines" : "The spaces"} of the ${CNAME[c]} staff, bottom to top, are…`, lines ? m.lines : m.spaces, all, `${lines ? m.lines : m.spaces}: “${lines ? m.lw : m.sw}.”`, { kicker: "Memory devices", topic: c });
    }
    const [q, a, w, y] = H.rnd(FACTS);
    return H.mc(q, a, w, y, { kicker: "Clefs and alignment" });
  }

  function reference() {
    return `<div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Clef</th><th scope="col">Lines</th><th scope="col">Spaces</th><th scope="col">Middle C</th></tr></thead><tbody>
      ${Object.entries(MNEM).map(([c, m]) => `<tr><td><b>${CNAME[c]}</b></td><td>${m.lines}<br><small>${m.lw}</small></td><td>${m.spaces}<br><small>${m.sw}</small></td><td>${{ treble: "1st ledger line below", bass: "1st ledger line above", alto: "3rd (middle) line", tenor: "4th line" }[c]}</td></tr>`).join("")}</tbody></table></div>`;
  }

  const lineNotes = (H, clef, which) => [0, 1, 2, 3, 4].map(i => which === "lines" ? 2 * i : 2 * i + 1).filter(s => s <= 8).map(s => { const n = noteAt(H, clef, s); return { k: [H.nmO(n)], ly: H.nm(n) }; });
  const lesson = { steps: [
    { title: "The staff", kick: "Lines, spaces, letters", render: (H, k, U) => `<p>Pitch is written on a <b>staff</b> of five lines and four spaces, counted from the <b>bottom</b>. Moving from a line to the next space (or a space to the next line) is one <b>step</b>: the next letter. Line to line, or space to space, is a <b>skip</b> (a 3rd): every other letter.</p>
      <p>The musical alphabet is just seven letters, <b>A B C D E F G</b>, repeating. Octave numbers tell the repetitions apart: each octave starts on C, and <b>middle C</b> is <b>C4</b>.</p>`
      + U.fig(one("treble", [0, 1, 2, 3, 4, 5, 6, 7, 8].map(s => { const n = noteAt(H, "treble", s); return { k: [H.nmO(n)], ly: H.nm(n) }; })), "Line, space, line, space…: each step is the next letter.")
      + `<p><b>Ledger lines</b> extend the staff above and below for notes outside it. A <b>clef</b> tells you which line is which pitch.</p>` },
    { title: "Treble clef", kick: "The G clef", render: (H, k, U) => `<p>The treble clef is a <b>G clef</b>: it began as a letter G, and its curl still circles the 2nd line, <b>G4</b> (the G above middle C).</p>
      <div class="lfigs">${U.fig(one("treble", lineNotes(H, "treble", "lines")), `<b>Lines: E G B D F</b>: “Every Good Boy Does Fine”`, { small: true })}${U.fig(one("treble", lineNotes(H, "treble", "spaces")), "<b>Spaces: F A C E</b>: they spell “FACE”", { small: true })}</div>`
      + H.check("Treble clef, 3rd line:", "B", ["G", "D", "C"], "E G B D F: the 3rd line is B.") },
    { title: "Bass clef", kick: "The F clef", render: (H, k, U) => `<p>The bass clef is an <b>F clef</b>: it began as a letter F, and its two dots still surround the 4th line, <b>F3</b> (the F below middle C).</p>
      <div class="lfigs">${U.fig(one("bass", lineNotes(H, "bass", "lines")), `<b>Lines: G B D F A</b>: “Good Boys Do Fine Always”`, { small: true })}${U.fig(one("bass", lineNotes(H, "bass", "spaces")), "<b>Spaces: A C E G</b>: “All Cows Eat Grass”", { small: true })}</div>`
      + `<p>Another device: each bass-clef line or space is <b>two letters later</b> in the alphabet than the same line or space in treble clef (treble E → bass G, treble F → bass A).</p>`
      + H.check("Bass clef, 2nd space:", "C", ["A", "E", "B"], "A C E G: the 2nd space is C.") },
    { title: "The grand staff", kick: "Middle C in the middle", render: (H, k, U) => `<p>Piano music joins a treble and a bass staff with a brace: the <b>grand staff</b>. <b>Middle C</b> sits on a ledger line between them: one ledger line below the treble staff, or one above the bass staff. The same pitch can be written either way.</p>`
      + U.fig(grand([{ t: { k: ["C4"], ly: "C4" }, b: rest }, { t: rest, b: { k: ["C4"], ly: "C4" } }, { t: { k: ["D4"], ly: "D4" }, b: rest }, { t: rest, b: { k: ["B3"], ly: "B3" } }, { t: { k: ["G4"], ly: "G4" }, b: { k: ["F3"], ly: "F3" } }].map(c => c)), "Middle C from either staff; the notes just above and below it; and the clefs' own notes, G4 and F3.")
      + `<p><b>Landmarks:</b> learn a few notes cold and read the rest by step or skip from them: treble G (the clef's curl), bass F (between the dots), middle C, high G (the space above the treble staff) and low G (the bass staff's bottom line).</p>` },
    { title: "The great staff", kick: "Eleven lines", render: (H, k, U) => {
      const lines = ["G2", "B2", "D3", "F3", "A3"].map(s => ({ t: rest, b: { k: [s], ly: s.slice(0, -1) } })).concat([{ t: { k: ["C4"], ly: "C" }, b: rest }]).concat(["E4", "G4", "B4", "D5", "F5"].map(s => ({ t: { k: [s], ly: s.slice(0, -1) }, b: rest })));
      return `<p>Here's the secret connecting all the clefs. The bass staff's lines, middle C's ledger line, and the treble staff's lines are one continuous ladder of lines a 3rd apart: <b>G B D F A C E G B D F</b>. Think of it as an eleven-line <b>great staff</b>, with the two clefs as windows onto it.</p>`
        + U.fig(grand(lines), "Every line of the grand staff, bottom to top: every other letter, all the way up.")
        + `<p>Every clef is just a window of five lines onto this great staff, labeled by the pitch it points to: the G clef marks G4, the F clef F3, and the C clef middle C.</p>`;
    } },
    { title: "Alto and tenor clefs", kick: "The C clef", render: (H, k, U) => `<p>The <b>C clef</b> points its center at <b>middle C</b>. Placed on the 3rd line it's the <b>alto clef</b> (the viola's clef); on the 4th line, the <b>tenor clef</b> (used by cello, bassoon and trombone for their higher notes, to avoid ledger lines).</p>
      <div class="lfigs">${U.fig(one("alto", lineNotes(H, "alto", "lines")), "<b>Alto lines: F A C E G</b>: “Fat Alley Cats Eat Grapes”", { small: true })}${U.fig(one("alto", lineNotes(H, "alto", "spaces")), "<b>Alto spaces: G B D F</b>: “Good Birds Don't Fly”", { small: true })}${U.fig(one("tenor", lineNotes(H, "tenor", "lines")), "<b>Tenor lines: D F A C E</b>: “Don't Forget Any Cello Etudes”", { small: true })}${U.fig(one("tenor", lineNotes(H, "tenor", "spaces")), "<b>Tenor spaces: E G B D</b>: “Every Good Bassoon Delights”", { small: true })}</div>
      <p>On the great staff, the alto clef's five lines are the <i>middle</i> five (F3 A3 C4 E4 G4); the tenor clef's are the next five down (D3 F3 A3 C4 E4).</p>`
      + H.check("Alto clef, middle line:", "C", ["B", "D", "A"], "The C clef's center marks middle C.") },
    { title: "A short history of clefs", kick: "Letters on lines", render: () => `<p>Early chant notation (neumes) showed the shape of a melody but not exact pitches. Around the year 1000, <b>Guido of Arezzo</b> is credited with the staff of lines a 3rd apart, marking key lines with letters (and colors: red for F, yellow for C) so singers could find exact pitches.</p>
      <p>Those letters are our clefs. Over centuries the written <b>C</b>, <b>F</b> and <b>G</b> became today's stylized signs: the C clef's two curves frame its line, the F clef's two dots frame theirs, and the G clef's curl circles G.</p>
      <p>Clefs were <b>movable</b>. Rather than add ledger lines, scribes slid the clef up or down so each voice's range fit on the five lines. The C clef had a position for each voice: <b>soprano</b> (C on the 1st line), <b>mezzo-soprano</b> (2nd), <b>alto</b> (3rd), <b>tenor</b> (4th) and <b>baritone</b> (5th; the F clef on the 3rd line made the same staff). Renaissance and Baroque choral parts, and many older editions, use them.</p>
      <p>As music standardized, most parts settled into the G clef on the 2nd line (treble) and the F clef on the 4th line (bass). Today the C clef survives as the <b>alto</b> clef (viola) and <b>tenor</b> clef (cello, bassoon, trombone). Every one of these is still a five-line window onto the same great staff.</p>` },
    { title: "Reading strategies", kick: "Faster reading", render: () => `<ul><li><b>Memory devices</b> (EGBDF, FACE, GBDFA, ACEG…) get you started; drill until you don't need them.</li>
      <li><b>Landmarks:</b> know the clef's own note (G4, F3, middle C) and a few others instantly; read nearby notes by counting steps.</li>
      <li><b>Intervals:</b> read the <i>distance</i> to the next note: next line or space = a step; line to line or space to space = a skip (3rd); and so on.</li>
      <li><b>Patterns:</b> lines and spaces each spell every other letter, so if you know one line you know them all.</li>
      <li><b>Same pitch, different clef:</b> find middle C in each clef first, then count.</li></ul>` },
    { title: "Lining things up", kick: "Notes and accidentals", render: (H, k, U) => {
      const sp = { type: "score", clefs: ["treble", "bass"], time: "4/4", vf: "C", sig: {}, bpm: 80, minBar: 260, bars: [{ t: [[{ k: ["C5", "E5", "G5"], d: "h" }, { k: ["F♯4", "A4", "D5"], d: "q" }, { k: ["G4", "A4", "C5"], d: "q" }]], b: [[{ k: ["C3"], d: "q" }, { k: ["E3"], d: "q" }, { k: ["D3"], d: "q" }, { k: ["E♭3", "G3"], d: "q" }]] }, { t: [[{ k: ["C♯5", "E♭5", "G♯5"], d: "w" }]], b: [[{ k: ["A2"], d: "w" }]] }] };
      return `<ul><li><b>Notes that sound together line up vertically</b>, across every staff of a system: chords, grand staff, full scores. Horizontal spacing follows time: longer values get more room, so a half note in one hand lines up with the first of two quarters in the other.</li>
        <li><b>Seconds in a chord:</b> the two noteheads sit on opposite sides of the stem, with the <b>higher note always to the right</b>.</li>
        <li><b>Accidentals</b> go immediately before the notehead, centered on exactly the same line or space, and last until the bar line for that line or space (in that octave).</li>
        <li><b>Several accidentals in a chord</b> stack in columns: the highest goes closest to the chord, then the lowest, then the next highest, working inward. Accidentals a 7th or more apart can share a column.</li>
        <li><b>Accidentals don't change the alignment</b>: the noteheads line up, and space is made in front for the accidental in every part.</li></ul>`
        + U.fig(sp, "Noteheads align across both staves; a 2nd in a chord puts the higher note on the right; accidentals stack in columns in front of the chord.");
    } },
    { title: "Quick check", kick: "Before the drills", render: (H) => H.check("Bass clef, top line:", "A", ["F", "G", "B"], "G B D F A.") + H.check("Treble clef, 1st space:", "F", ["E", "G", "A"], "F A C E.") + H.check(FACTS[3][0], FACTS[3][1], FACTS[3][2], FACTS[3][3]) + H.check(FACTS[15][0], FACTS[15][1], FACTS[15][2], FACTS[15][3]) },
  ] };

  return {
    key: "silverapps-clefs-v1", lesson, make, reference,
    modes: [{ id: "name", kicker: "Name the note" }, { id: "octave", kicker: "Note and octave" }, { id: "where", kicker: "Find the line or space" }, { id: "same", kicker: "Same pitch, new clef" }, { id: "devices", kicker: "Devices and principles" }],
    topics: [{ id: "treble", name: "Treble clef", group: "c" }, { id: "bass", name: "Bass clef", group: "c" }, { id: "alto", name: "Alto clef", group: "c" }, { id: "tenor", name: "Tenor clef", group: "c", on: false },
      { id: "staff", name: "On the staff", group: "r" }, { id: "ledger", name: "Ledger lines", group: "r", on: false }],
  };
})();
