// ===== Two shorter lessons cut from Chord Figures and Symbols (figlesson.js, loaded first): Triads (with sus4) and Seventh Chords.
// assemble.py loads figlesson.js, then this file, then figsplit-triads.js or figsplit-sevenths.js, which calls figSplit(part).
// Steps are taken from the full lesson by title (so edits there show up here), with a few steps of their own; the Test Yourself bank
// is the full lesson's questions for the kept steps (renumbered) plus questions of its own.
window.figSplit = function (part) {
  const FULL = window.FAM, H0 = FULL._h, all = FULL.lesson.steps, bank = window.FAM.quiz || [];
  const byTitle = t => { const st = all.find(x => x.title === t); if (!st) throw new Error("figsplit: no step " + t); return st; };
  const { tfig, gfig, tbl, C, F, gsSVG, faHTML, faWire, slHTML, slWire } = H0;
  H0.setSize(part === "triads" ? 3 : 4);   // the Figures and slash-chord activities use only this lesson's chords
  const TRIAD_INV = { title: "Inversions", kick: "Which note is in the bass?", render: (H, k, U) => `<p>A triad is named by its root wherever its notes are placed. Its <b>inversion</b> depends only on which chord member is in the <b>bass</b> (the lowest note):</p>
      ${gfig(H, U, [{ t: ["E4", "G4", "C5"], b: ["C3"] }, { t: ["E4", "G4", "C5"], b: ["E3"] }, { t: ["E4", "G4", "C5"], b: ["G3"] }], "C major in root position, first inversion and second inversion. The right hand stays the same; only the bass note changes, and that alone sets the inversion.")}
      ${tbl("Triad inversions", ["Bass note", "Position", "Chord symbol in C"], [["root", "root position", C("C")], ["3rd", "first inversion", C("C/E")], ["5th", "second inversion", C("C/G")]])}
      <p>The upper notes don't affect the inversion: C in the bass with E–G–C, G–C–E or E–C–G above is always root position. To find the root of an inverted triad, rearrange the notes into stacked 3rds; the bottom of the stack is the root. Shortcut: in close position, the root is the upper note of the 4th. A sus4 chord is usually played in root position.</p>`
      + H.check("E in the bass, with G and C above it. What is the chord and its position?", "C major, first inversion", ["E minor, root position", "C major, root position", "C major, second inversion"], "Stacked in 3rds it's C–E–G; the 3rd (E) is in the bass.") };
  const MORE7 = { title: "Three more seventh chords", kick: "Minor-major and augmented sevenths", render: (H, k, U) => `<p>The five seventh chords so far are the everyday ones. Three more turn up in jazz, film and chromatic music. Each is still a triad plus a 7th:</p>
      ${tfig(H, U, [[["C4", "E♭4", "G4", "B4"], "Cm(△7)"], [["C4", "E4", "G♯4", "B♭4"], "C+7"], [["C4", "E4", "G♯4", "B4"], "C+△7"]], "Minor-major seventh, augmented seventh and augmented major seventh on C.")}
      ${tbl("All eight seventh chords", ["Name", "Triad + 7th", "On C", "Symbol"], [["major seventh", "major + major 7th", "C–E–G–B", C("C△7")], ["dominant seventh", "major + minor 7th", "C–E–G–B♭", C("C7")], ["minor seventh", "minor + minor 7th", "C–E♭–G–B♭", C("Cm7")], ["half-diminished seventh", "diminished + minor 7th", "C–E♭–G♭–B♭", `${C("Cø7")}, ${C("Cm7(♭5)")}`], ["fully diminished seventh", "diminished + diminished 7th", "C–E♭–G♭–B𝄫", C("C°7")], ["minor-major seventh", "minor + major 7th", "C–E♭–G–B", C("Cm(△7)")], ["augmented seventh", "augmented + minor 7th", "C–E–G♯–B♭", `${C("C+7")}, ${C("C7(♯5)")}`], ["augmented major seventh", "augmented + major 7th", "C–E–G♯–B", C("C+△7")]])}
      <p>To spell any of them: build the triad first, then add the 7th. A <b>major 7th</b> is a half step below the root's octave; a <b>minor 7th</b> is a whole step below it; a <b>diminished 7th</b> is a minor 3rd below it.</p>`
      + H.check("C–E–G♯–B is a…", "augmented major seventh", ["augmented seventh", "major seventh", "minor-major seventh"], "An augmented triad (C–E–G♯) plus a major 7th (B).") };
  const FIGINTRO = `<p><b>Figures</b> (from <b>figured bass</b>) are small numbers showing the <b>intervals above the bass note</b>. Baroque keyboard and lute players read a bass line with figures and improvised the chords from them; today figures are also attached to chord labels (like V⁶ or ii⁶₅) to show inversions.</p>
      <p>To read them, count letter names up from the bass, calling the bass 1. Octaves don't matter: a 10th counts as a 3rd, a 13th as a 6th, and a note an octave above the bass is an 8.</p>`;
  const TRIAD_FIG = { title: "Figures for triads", kick: "Nothing, 6, 6-4", render: (H, k, U) => FIGINTRO
      + gsSVG([{ t: ["E4", "G4", "C5"], b: ["C3"], ivs: true, sym: "C" }, { t: ["E4", "G4", "C5"], b: ["E3"], ivs: true, fig: ["6"], sym: "C/E" }, { t: ["E4", "G4", "C5"], b: ["G3"], ivs: true, fig: ["6", "4"], sym: "C/G" }], { label: "C major in three positions; each right-hand note is labeled with its interval above the bass, and the figures are written under the bass" })
      + `<p class="lcap" style="text-align:center">C major in all three positions. Red numbers: each upper note's interval above the bass. Under the bass: the figures.</p>
      ${tbl("Triad figures", ["Position", "Intervals above the bass", "Written as", "Example in C"], [["root position", F(5, 3), "(nothing)", C("C")], ["first inversion", F(6, 3), F(6), `${C("C/E")}: E with ${F(6)}`], ["second inversion", F(6, 4), F(6, 4), `${C("C/G")}: G with ${F(6, 4)}`]])}
      <p><b>Memory aid</b>: triads are nothing, 6, 6-4. A plain bass note means a root-position triad.</p>
      <h3>Try it</h3>${faHTML()}`
      + H.check("E in the bass with the figure 6, in C major. Which notes go above it?", "G and C (C major, first inversion)", ["G and B (E minor)", "G♯ and B (E major)", "A and C (A minor, first inversion)"], "A 3rd above E is G and a 6th above E is C: the notes of C major with its 3rd in the bass."),
    after: (root, H, k, tools) => faWire(root, Object.assign({ H }, tools)) };
  const TRIAD_SYM = { title: "Chord symbols and slash chords", kick: "Lead-sheet style", render: (H, k, U) => `<p>Lead sheets name chords with <b>chord symbols</b>: the root's letter, then the quality (${C("C")}, ${C("Cm")}, ${C("C°")}, ${C("C+")}, ${C("Csus4")}). Inversions are shown with a <b>slash</b>: the letter after the slash is the bass note.</p>
      ${tbl("Figures and symbols side by side", ["Chord and position", "Figure over the bass", "Chord symbol", "Bass note"], [["C, root position", "(none)", C("C"), "C"], ["C, 1st inversion", F(6), C("C/E"), "E"], ["C, 2nd inversion", F(6, 4), C("C/G"), "G"], ["Am, 1st inversion", F(6), C("Am/C"), "C"], ["F, 2nd inversion", F(6, 4), C("F/C"), "C"]])}
      <p>A slash chord can also put a note that isn't in the chord in the bass, like ${C("D/C")} (a D major triad over a C bass) or a pedal point under changing chords. Figures describe intervals above a bass; chord symbols just say what to play.</p>
      <h3>Try it</h3>${slHTML()}`
      + H.check("What does Am/C mean?", "an A minor triad with C in the bass (first inversion)", ["an A minor chord followed by C", "a C chord over an A bass", "A minor with an added C"], "The letter after the slash is the bass note; C is the 3rd of A minor."),
    after: (root, H, k, tools) => slWire(root, Object.assign({ H }, tools)) };
  const TRIAD_ID = { title: "Identifying triads fast", kick: "A routine", render: (H, k, U) => `<ol><li><b>Stack the notes in 3rds</b> (ignore octaves and doublings). If they don't stack, look for a 4th where the 3rd should be: a sus4.</li>
      <li>The bottom of the stack is the <b>root</b>. Shortcut: in an inverted triad, the root is the upper note of the 4th.</li>
      <li>Measure the 3rd and 5th above the root to find the <b>quality</b>.</li>
      <li>Look at the <b>bass</b> to find the <b>inversion</b>, its figure, and the slash in the chord symbol.</li></ol>
      ${gfig(H, U, [{ t: ["B3", "D4", "G4"], b: ["D3"], lab: "?" }], "Try it: D in the bass, B–D–G above.")}
      <p>Answer: stacked, the notes are G–B–D, a G major triad; its 5th (D) is in the bass, so it's second inversion (figure ${F(6, 4)}, symbol ${C("G/D")}).</p>`
      + H.check("A in the bass, with C and F above. What is it?", "F major, first inversion (F/A)", ["A minor, root position", "A minor, second inversion", "F major, second inversion"], "Stacked: F–A–C, so F major with its 3rd (A) in the bass: figure 6.") };
  const SEVENTH_INV = { title: "Inversions of seventh chords", kick: "Four positions", render: (H, k, U) => `<p>A seventh chord has four notes, so it has <b>four positions</b>: root position and three inversions. As with triads, only the <b>bass</b> note decides which one it is; the upper notes can be in any order.</p>
      ${gfig(H, U, [{ t: ["D4", "F4", "B4"], b: ["G2"] }, { t: ["D4", "F4", "G4"], b: ["B2"] }, { t: ["B3", "F4", "G4"], b: ["D3"] }, { t: ["B3", "D4", "G4"], b: ["F3"] }], "G7 with G, B, D and then F in the bass: root position, first, second and third inversion.")}
      ${tbl("Seventh-chord inversions", ["Bass note", "Position", "G7", "Dm7"], [["root", "root position", C("G7"), C("Dm7")], ["3rd", "first inversion", C("G7/B"), C("Dm7/F")], ["5th", "second inversion", C("G7/D"), C("Dm7/A")], ["7th", "third inversion", C("G7/F"), C("Dm7/C")]])}
      <p><b>Third inversion</b> (the 7th in the bass) exists only for seventh chords. In an inverted seventh chord, look for the <b>2nd</b> between two notes: the upper note of the 2nd is the root (in F–G–B–D, G is the root). Stacking the notes in 3rds always works too.</p>`
      + H.check("F in the bass, with G, B and D above. What is the chord and its position?", "G7, third inversion", ["G7, second inversion", "F major 7th, root position", "B diminished, first inversion"], "Stacked in 3rds it's G–B–D–F; the 7th (F) is in the bass.") };
  const SEVENTH_FIG = { title: "Figures for seventh chords", kick: "7, 6-5, 4-3, 4-2", render: (H, k, U) => FIGINTRO
      + gsSVG([{ t: ["D4", "F4", "B4"], b: ["G2"], ivs: true, fig: ["7"], sym: "G7" }, { t: ["D4", "F4", "G4"], b: ["B2"], ivs: true, fig: ["6", "5"], sym: "G7/B" }, { t: ["B3", "F4", "G4"], b: ["D3"], ivs: true, fig: ["4", "3"], sym: "G7/D" }, { t: ["B3", "D4", "G4"], b: ["F3"], ivs: true, fig: ["4", "2"], sym: "G7/F" }], { label: "G7 in four positions; each right-hand note is labeled with its interval above the bass, and the figures are written under the bass" })
      + `<p class="lcap" style="text-align:center">G7 in all four positions. Red numbers: each upper note's interval above the bass. Under the bass: the figures, the essential intervals only.</p>
      ${tbl("Seventh-chord figures", ["Position", "Full figures", "Written as", "Example"], [["root position", F(7, 5, 3), F(7), `${C("G7")}: G with ${F(7)}`], ["first inversion", F(6, 5, 3), F(6, 5), `${C("G7/B")}: B with ${F(6, 5)}`], ["second inversion", F(6, 4, 3), F(4, 3), `${C("G7/D")}: D with ${F(4, 3)}`], ["third inversion", F(6, 4, 2), `${F(4, 2)} (or ${F(2)})`, `${C("G7/F")}: F with ${F(4, 2)}`]])}
      <p><b>Memory aid</b>: the figures count down from 7: 7, 6-5, 4-3, 4-2. (Triads: nothing, 6, 6-4.)</p>
      <h3>Try it</h3>${faHTML()}`
      + H.check("Which figure shows a seventh chord in third inversion (7th in the bass)?", "4/2", ["6/5", "4/3", "6/4"], "The 7th is in the bass, so the root is a 2nd above it: four-two."),
    after: (root, H, k, tools) => faWire(root, Object.assign({ H }, tools)) };
  const SEVENTH_SYM = { title: "Chord symbols and slash chords", kick: "Lead-sheet style", render: (H, k, U) => `<p>Seventh-chord symbols add the type of 7th after the root: ${C("C△7")} (or Cmaj7), ${C("C7")}, ${C("Cm7")}, ${C("Cø7")} (or Cm7♭5), ${C("C°7")}. Inversions use a <b>slash</b>: the letter after the slash is the bass note.</p>
      ${tbl("Figures and symbols side by side", ["Chord and position", "Figure over the bass", "Chord symbol", "Bass note"], [["G7, root position", F(7), C("G7"), "G"], ["G7, 1st inversion", F(6, 5), C("G7/B"), "B"], ["G7, 2nd inversion", F(4, 3), C("G7/D"), "D"], ["G7, 3rd inversion", F(4, 2), C("G7/F"), "F"], ["Dm7, 1st inversion", F(6, 5), C("Dm7/F"), "F"]])}
      <p>Figures describe intervals above a bass; chord symbols just say what to play. The <a href="extended-and-altered-chords-lesson.html">Extended and Altered Chords</a> lesson covers 9ths, 11ths, 13ths and alterations.</p>
      <h3>Try it</h3>${slHTML()}`
      + H.check("What does G7/B mean?", "a G dominant 7th chord with B in the bass (first inversion)", ["a G7 chord followed by B", "G7 with an added B", "a B chord over G"], "The letter after the slash is the bass note."),
    after: (root, H, k, tools) => slWire(root, Object.assign({ H }, tools)) };
  const P = {
    triads: { key: "silverapps-triads-v1", steps: [byTitle("Triads"), byTitle("Suspended chords (sus4)"), TRIAD_INV, TRIAD_FIG, byTitle("Accidentals in figures"), TRIAD_SYM, TRIAD_ID],
      from: ["Triads", "Suspended chords (sus4)", "Inversions", "Figures", "Accidentals in figures", "Chord symbols and slash chords", "Identifying chords fast"],
      skip: /seventh|7th|G7|ø7|°7|B♭|7\//i,
      more: [{ t: "Triads", q: "Spell an F minor triad.", a: "F–A♭–C", w: ["F–A–C", "F–A♭–C♭", "F–G–C"], hint: "Minor: a minor 3rd and a perfect 5th above the root.", why: "F up a minor 3rd is A♭; up a perfect 5th is C." },
        { t: "Triads", q: "A major triad is built from…", a: "a major 3rd with a minor 3rd on top", w: ["two major 3rds", "a minor 3rd with a major 3rd on top", "two minor 3rds"], hint: "Check the table of four triad qualities.", why: "C–E is a major 3rd and E–G a minor 3rd." },
        { t: "Suspended chords (sus4)", q: "Which chord replaces its 3rd with a perfect 4th?", a: "sus4", w: ["sus2", "augmented", "diminished"], hint: "The name says what's held over.", why: "Sus4: root, perfect 4th, perfect 5th." },
        { t: "Figures", q: "A triad in second inversion is figured…", a: "6/4", w: ["6", "4/3", "nothing"], hint: "Triads: nothing, 6, 6-4.", why: "The 5th is in the bass, so the root is a 4th above it and the 3rd a 6th above it: six-four." },
        { t: "Chord symbols and slash chords", q: "F major with C in the bass is written…", a: "F/C", w: ["C/F", "Fsus4", "C7"], hint: "The letter after the slash is the bass.", why: "C is the 5th of F, so F/C is F major in second inversion." },
        { t: "Inversions", q: "A triad with its 5th in the bass is in…", a: "second inversion", w: ["first inversion", "root position", "third inversion"], hint: "Root, 3rd, 5th in the bass: root position, first, second.", why: "5th in the bass: second inversion (C/G)." }] },
    sevenths: { key: "silverapps-sevenths-v1", steps: [byTitle("Seventh chords"), MORE7, SEVENTH_INV, SEVENTH_FIG, SEVENTH_SYM, byTitle("Identifying chords fast")],
      from: ["Seventh chords", "Three more seventh chords", "Inversions", "Figures", "Chord symbols and slash chords", "Identifying chords fast"],
      keep: /seventh|7|ø|°7/i,   // from the shared steps, only the questions about seventh chords
      more: [{ t: "Three more seventh chords", q: "A minor triad with a major 7th is a…", a: "minor-major seventh", w: ["minor seventh", "major seventh", "half-diminished seventh"], hint: "Name the triad, then the 7th.", why: "Minor triad + major 7th: Cm(△7), C–E♭–G–B." },
        { t: "Three more seventh chords", q: "C–E–G♯–B♭ is a…", a: "augmented seventh", w: ["dominant seventh", "augmented major seventh", "half-diminished seventh"], hint: "Look at the 5th first.", why: "An augmented triad (C–E–G♯) plus a minor 7th (B♭): C+7, also written C7(♯5)." },
        { t: "Inversions", q: "Dm7 with C in the bass is in…", a: "third inversion", w: ["second inversion", "first inversion", "root position"], hint: "C is which member of D–F–A–C?", why: "C is the 7th of Dm7; the 7th in the bass is third inversion (Dm7/C, figured 4/2)." },
        { t: "Inversions", q: "Only seventh chords have a third inversion because…", a: "they have a 4th chord member (the 7th) that can be in the bass", w: ["triads can't be inverted", "the 7th is always on top", "third inversion needs a sus4"], hint: "Count the chord members.", why: "Root, 3rd, 5th, 7th: four possible bass notes, so four positions." },
        { t: "Seventh chords", q: "Spell a D dominant seventh chord.", a: "D–F♯–A–C", w: ["D–F♯–A–C♯", "D–F–A–C", "D–F♯–A♯–C"], hint: "A major triad plus a minor 7th.", why: "D major triad D–F♯–A plus a minor 7th, C." }] },
  }[part];
  const oldTitle = s => (all[s - 1] || {}).title;
  const quiz = bank.filter(q => P.from.includes(oldTitle(q.s)) && !(P.skip && P.skip.test(q.q + " " + q.a)) && (!P.keep || oldTitle(q.s) === "Seventh chords" || P.keep.test(q.q + " " + q.a))).map(q => Object.assign({}, q, { s: P.from.indexOf(oldTitle(q.s)) + 1 }))
    .concat(P.more.map(q => Object.assign({ s: P.from.indexOf(q.t) + 1 }, q, { t: undefined })));
  window.FAM = Object.assign({}, FULL, { key: P.key, lesson: { steps: P.steps } });
  window.FAM.quiz = quiz;
};
