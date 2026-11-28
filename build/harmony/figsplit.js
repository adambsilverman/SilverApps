// ===== Two shorter lessons cut from Chord Figures and Symbols (figlesson.js, loaded first): Triads (with sus4) and Seventh Chords.
// assemble.py loads figlesson.js, then this file, then figsplit-triads.js or figsplit-sevenths.js, which calls figSplit(part).
// Steps are taken from the full lesson by title (so edits there show up here), with a few steps of their own; the Test Yourself bank
// is the full lesson's questions for the kept steps (renumbered) plus questions of its own.
window.figSplit = function (part) {
  const FULL = window.FAM, H0 = FULL._h, all = FULL.lesson.steps, bank = window.FAM.quiz || [];
  const byTitle = t => { const st = all.find(x => x.title === t); if (!st) throw new Error("figsplit: no step " + t); return st; };
  const { tfig, gfig, tbl, C } = H0;
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
  const P = {
    triads: { key: "silverapps-triads-v1", steps: [byTitle("Triads"), byTitle("Suspended chords (sus4)"), TRIAD_INV], from: ["Triads", "Suspended chords (sus4)", "Inversions"],
      skip: /seventh|7th|G7|ø7|°7|B♭|7\//i,
      more: [{ t: "Triads", q: "Spell an F minor triad.", a: "F–A♭–C", w: ["F–A–C", "F–A♭–C♭", "F–G–C"], hint: "Minor: a minor 3rd and a perfect 5th above the root.", why: "F up a minor 3rd is A♭; up a perfect 5th is C." },
        { t: "Triads", q: "A major triad is built from…", a: "a major 3rd with a minor 3rd on top", w: ["two major 3rds", "a minor 3rd with a major 3rd on top", "two minor 3rds"], hint: "Check the table of four triad qualities.", why: "C–E is a major 3rd and E–G a minor 3rd." },
        { t: "Suspended chords (sus4)", q: "Which chord replaces its 3rd with a perfect 4th?", a: "sus4", w: ["sus2", "augmented", "diminished"], hint: "The name says what's held over.", why: "Sus4: root, perfect 4th, perfect 5th." },
        { t: "Inversions", q: "A triad with its 5th in the bass is in…", a: "second inversion", w: ["first inversion", "root position", "third inversion"], hint: "Root, 3rd, 5th in the bass: root position, first, second.", why: "5th in the bass: second inversion (C/G)." }] },
    sevenths: { key: "silverapps-sevenths-v1", steps: [byTitle("Seventh chords"), MORE7, byTitle("Inversions"), byTitle("Chord symbols and slash chords"), byTitle("Identifying chords fast")], from: ["Seventh chords", "Three more seventh chords", "Inversions", "Chord symbols and slash chords", "Identifying chords fast"],
      skip: /^(?!x)x/,
      more: [{ t: "Three more seventh chords", q: "A minor triad with a major 7th is a…", a: "minor-major seventh", w: ["minor seventh", "major seventh", "half-diminished seventh"], hint: "Name the triad, then the 7th.", why: "Minor triad + major 7th: Cm(△7), C–E♭–G–B." },
        { t: "Three more seventh chords", q: "C–E–G♯–B♭ is a…", a: "augmented seventh", w: ["dominant seventh", "augmented major seventh", "half-diminished seventh"], hint: "Look at the 5th first.", why: "An augmented triad (C–E–G♯) plus a minor 7th (B♭): C+7, also written C7(♯5)." },
        { t: "Seventh chords", q: "Spell a D dominant seventh chord.", a: "D–F♯–A–C", w: ["D–F♯–A–C♯", "D–F–A–C", "D–F♯–A♯–C"], hint: "A major triad plus a minor 7th.", why: "D major triad D–F♯–A plus a minor 7th, C." }] },
  }[part];
  const oldTitle = s => (all[s - 1] || {}).title;
  const quiz = bank.filter(q => P.from.includes(oldTitle(q.s)) && !P.skip.test(q.q + " " + q.a)).map(q => Object.assign({}, q, { s: P.from.indexOf(oldTitle(q.s)) + 1 }))
    .concat(P.more.map(q => Object.assign({ s: P.from.indexOf(q.t) + 1 }, q, { t: undefined })));
  window.FAM = Object.assign({}, FULL, { key: P.key, lesson: { steps: P.steps } });
  window.FAM.quiz = quiz;
};
