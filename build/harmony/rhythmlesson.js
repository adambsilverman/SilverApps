window.FAM = (() => {
  // ===== Rhythm Notation (with notation of lyrics): lesson only (the drills are the Rhythm Notation app). Engine: build/harmony/engine.js =====
  const P = "B4";
  // percussion-staff rhythm: bars of duration codes; "r" suffix = rest, "~" suffix = tie to the next note
  const rh = (time, bars, o = {}) => ({ type: "score", clefs: ["percussion"], time, vf: "C", sig: {}, bpm: o.bpm || 92, bars: bars.map(b => ({ t: [b.split(" ").map(x => { const rest = x.endsWith("r"), tie = x.endsWith("~"), d = x.replace(/[r~]$/, ""); return { k: rest ? [] : [P], d, tie }; })] })) });
  // rhythm figures: beat numbers above every beat (even beats without a note), and playback with the metronome click
  const fig = (U, sp, cap) => { sp.beatNums = true; return U.fig(sp, cap, { small: true, play: window.__harm ? window.__harm.H.withClick(sp) : null }); };
  // a click on every beat for free event lists: n beats of spb seconds, accent every `per` beats
  const clicks = (n, spb, per) => Array.from({ length: n }, (_, i) => [i % per ? 89 : 96, i * spb, .05, i % per ? .6 : .9, i % per ? "click" : "clickHi"]);
  // ties and slurs on a treble staff: notes [pitch, value, marks]
  const tn = (k, d, x) => Object.assign({ k: [k], d }, x || {});
  const tsp = (time, ...bars) => ({ type: "score", clefs: ["treble"], time, vf: "C", sig: {}, bpm: 84, minBar: 150, bars: bars.map(v => ({ t: [v] })) });
  const tfig = (U, sp, cap) => U.fig(sp, cap, { small: true });
  // Fantasie Quartet excerpt (oboe part): marked time signatures and bar lines, drawn over the image (image px: 557 × 200)
  function fantasieFig() {
    const W = 557, Hh = 200, red = "#C2381F", blue = "#1a5fb4";
    const bars = [[158, 34, 58], [278, 34, 58], [415, 34, 58], [532, 34, 58], [292, 100, 124], [547, 100, 124], [226, 150, 174], [308, 150, 174], [386, 150, 174], [489, 150, 174], [547, 150, 174]];
    const box = (x, y, w, h, n, nx, ny) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${red}" fill-opacity=".12" stroke="${red}" stroke-width="1.6"/><circle cx="${nx}" cy="${ny}" r="7.5" fill="${red}"/><text x="${nx}" y="${ny + 3.6}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#fff" font-family="Arial, sans-serif">${n}</text>`;
    let g = bars.map(([x, y1, y2]) => `<rect x="${x - 2.5}" y="${y1 - 3}" width="5" height="${y2 - y1 + 6}" rx="2" fill="${blue}" fill-opacity=".28"/>`).join("");
    g += box(26, 34, 16, 24, 1, 34, 23) + box(531, 31, 18, 29, 2, 551, 22) + box(25, 98, 17, 28, 3, 16, 88) + box(222, 148, 16, 32, 4, 230, 139);
    g += `<path d="M540 62 C 520 92, 80 72, 44 96" fill="none" stroke="${red}" stroke-width="1.6" stroke-dasharray="5 3" marker-end="url(#fqArrow)"/>`;
    const desc = "Three lines of an oboe part. Marked: (1) the opening cut-time signature; (2) a cautionary 3/2 time signature at the end of the first line, with an arrow to (3) the 3/2 time signature that starts the second line; (4) a change back to cut time in the middle of the third line. Every bar line is shaded, including the bar line that ends each line.";
    return `<figure class="lfig fqfig"><svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="${desc}" style="width:100%;max-width:840px;display:block;margin:0 auto;background:#fff;border-radius:8px">
      <defs><marker id="fqArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${red}"/></marker></defs>
      <image href="assets/img/Fantasie%20Quartet.png" x="0" y="0" width="${W}" height="${Hh}"/>${g}</svg>
      <figcaption><ol class="fqkey"><li>The time signature (cut time) appears once, at the start.</li><li>A <b>cautionary</b> 3/2 at the end of the first line warns that the meter changes on the next line…</li><li>…where the new 3/2 time signature appears.</li><li>A meter change in the middle of a line simply gets its time signature where it happens.</li></ol>
      <p>Shaded in blue: bar lines, including the one that ends every line.</p>
      <p class="small lcite">Oboe part from <i>Fantasie Quartet</i> by Adam Silverman (2023). Used by permission.</p></figcaption></figure>`;
  }
  const ev = (list, spb = .5, m = 72) => ({ ev: list.map(([t, d, mm, v]) => [mm || m, t * spb, d * spb * .9, v || .8]) });
  const lesson = { steps: [
    { title: "Before you start", kick: "Prerequisites", render: (H) => `<p>This lesson assumes you know proportional rhythmic values, meter types (simple vs. compound, duple vs. triple), time signatures, dots, ties and tuplets. If any of these checks trip you up, review them first in the <a href="note-values-lesson.html">Understanding Units of Rhythm</a> lesson.</p>`
      + H.check("How many beats are in a bar of 3/4?", "3 (quarter-note beats)", ["4", "6", "2"], "Three quarter-note beats.")
      + H.check("How many beats are in a bar of 6/8?", "2 (dotted-quarter beats)", ["6", "3", "8"], "In compound meter, the eighth is the division, not the beat.")
      + H.check("In 4/4, a double-dotted half note starts a bar. What completes it?", "an eighth note", ["a quarter note", "a sixteenth note", "a half note"], "Half (2 beats) + dot (1) + second dot (½) = 3½ beats.")
      + H.check("In 3/4, how many beats does a quarter-note triplet occupy?", "2", ["3", "1", "1½"], "Three triplet quarters take the time of two quarters.") },
    { title: "Show the beat", kick: "Durations and meter", render: (H, k, U) => `<p>Note values should reveal the meter's basic stresses (after Elaine Gould, <i>Behind Bars</i>, pp. 166–170). In the examples, the numbers above the staff mark every beat, and <b>Play</b> adds a metronome click, so you can see and hear where each beat falls.</p>
      <ul><li>Values sustained across a beat or half-bar must expose the beat structure.</li><li>Three-beat meters must show two out of three beats.</li><li>Only very straightforward rhythms may be written across the beat or half-bar.</li><li>The more complex the division, the more of the beat you must reveal.</li><li>A long note that starts on the beat may be a single value.</li><li>In compound time, no value should cross the beat, except combined whole beats.</li></ul>
      <div class="lfigs">${fig(U, rh("4/4", ["q h q"]), "Avoid: a half note on beat 2 hides beat 3")}${fig(U, rh("4/4", ["q q~ q q"]), "Better: beat 3 is visible")}${fig(U, rh("4/4", ["8 q q q 8"]), "Avoid: a long syncopation that hides beats 2, 3 and 4")}${fig(U, rh("4/4", ["8 q 8~ 8 8 q"]), "Better: beat 3 shows")}${fig(U, rh("6/8", ["q q q"]), "Avoid in 6/8: hides the second beat")}${fig(U, rh("6/8", ["q 8~ 8 q"]), "Better: the dotted-quarter beat shows")}</div>` },
    { title: "Common errors", kick: "Don't obscure the big beats", render: (H, k, U) => `<p>From Kurt Knecht's notes for composers (MusicSpoke): professional players form an opinion on the first reading, so anything that slows it down hurts the piece.</p>
      <ul><li>Don't break beams for each syllable in vocal music (an old 19th-century practice): it hides the beat.</li><li><b>Whatever you do, don't obscure the big beats.</b> An extended syncopation is fine as long as the strong beats stay visible.</li><li>Dotted notes belong on the front side of strong beats. A dotted note on a weak beat hides the next strong beat.</li><li>Follow these rules in keyboard music too, even when the other hand shows the beat.</li></ul>
      <div class="lfigs">${fig(U, rh("4/4", ["q qd 8 q"]), "Avoid: a dotted note on beat 2 hides beat 3")}${fig(U, rh("4/4", ["q q~ 8 8 q"]), "Better")}${fig(U, rh("4/4", ["qd 8 qd 8"]), "Fine: dots on the strong beats")}</div>` },
    { title: "Beaming shows the meter", kick: "3/4 or 6/8?", render: (H, k, U) => `<p>Six eighth notes fill a bar of 3/4 or of 6/8, but they're beamed differently: in 3/4 by quarter-note beat (2 + 2 + 2), in 6/8 by dotted-quarter beat (3 + 3).</p>
      <div class="lfigs">${fig(U, rh("3/4", ["8 8 8 8 8 8"]), "3/4: three beats")}${fig(U, rh("6/8", ["8 8 8 8 8 8"]), "6/8: two beats")}</div>
      <p>A tie into beat 3, or quarter notes that would otherwise have to be split to show beat 2 of a compound bar, also tell you the meter.</p>` },
    { title: "Ties and slurs", kick: "Curves that look alike", render: (H, k, U) => `<p>Both are curved lines, but they mean different things:</p>
      <ul><li>A <b>tie</b> joins two notes of the <i>same pitch</i> into one sustained note. Ties connect noteheads, not stems: stems down, tie above; stems up, tie below. In chords, ties may split above and below to show which notes are tied.</li>
      <li>A <b>slur</b> joins two or more <i>different</i> pitches to be played unbroken. Like a tie, it curves on the notehead side: all stems up, below; all stems down, above; if the stems point both ways, above. When parts share a staff, slurs go above and below. A slur continues to the end of any tie chain on its last note. In piano music slurs often mark phrases; for strings and winds they mark bowing or articulation, so they usually don't cross rests.</li></ul>
      <div class="callout"><b>The most common error</b>Ties and slurs curve on the notehead side, opposite the stem: the curve hugs the notehead. Notation software sometimes puts it on the stem side, especially in condensed scores or when voices aren't assigned, so check by eye. In two-voice writing on one staff, the upper voice's slurs go above and the lower voice's below.</div>`
      + `<h3>Correct and incorrect</h3><div class="lfigs">`
      + tfig(U, tsp("4/4", [tn("G4", "h", { tie: true }), tn("G4", "q"), tn("A4", "q")]), "✓ Correct: stems up, so the tie curves below, at the noteheads")
      + tfig(U, tsp("4/4", [tn("G4", "h", { tie: true, tieDir: -1 }), tn("G4", "q"), tn("A4", "q")]), "✗ Incorrect: the tie is on the stem side")
      + tfig(U, tsp("4/4", [tn("D5", "h", { tie: true }), tn("D5", "q"), tn("C5", "q")]), "✓ Correct: stems down, so the tie curves above")
      + tfig(U, tsp("4/4", [tn("D5", "h", { tie: true, tieDir: 1 }), tn("D5", "q"), tn("C5", "q")]), "✗ Incorrect: the tie is on the stem side")
      + tfig(U, tsp("4/4", [tn("E5", "q", { sls: true }), tn("D5", "q"), tn("C5", "q"), tn("B4", "q", { sle: true })]), "✓ Correct: all stems down, so the slur goes above, at the noteheads")
      + tfig(U, tsp("4/4", [tn("E5", "q", { sls: true, slStem: true }), tn("D5", "q"), tn("C5", "q"), tn("B4", "q", { sle: true })]), "✗ Incorrect: the slur is on the stem side, below the stems")
      + tfig(U, tsp("4/4", [tn("E4", "q", { sls: true }), tn("F4", "q"), tn("G4", "q"), tn("A4", "q", { sle: true })]), "✓ Correct: all stems up, so the slur goes below, at the noteheads")
      + tfig(U, tsp("4/4", [tn("E4", "q", { sls: true }), tn("G4", "q"), tn("C5", "q"), tn("E5", "q", { sle: true })]), "✓ Correct: stems point both ways, so the slur goes above")
      + tfig(U, tsp("4/4", [tn("C5", "q", { sls: true }), tn("D5", "q"), tn("E5", "q", { tie: true }), tn("E5", "q", { sle: true })]), "✓ Correct: the slur continues to the end of the tie chain")
      + tfig(U, tsp("4/4", [tn("C5", "q", { sls: true }), tn("D5", "q"), tn("E5", "q", { tie: true, sle: true }), tn("E5", "q")]), "✗ Incorrect: the slur stops at the first note of the tie")
      + `</div>` },
    { title: "Time signatures and bar lines", kick: "Layout", render: () => `${fantasieFig()}<ul><li>Every system begins with a clef and key signature, but the <b>time signature appears only at the start</b>, unless the meter changes.</li><li>When a meter change falls at the start of a new system, put a <b>cautionary time signature</b> at the end of the previous system.</li><li><b>Bar lines</b> should end every system (except rare cases where a bar can't fit). In ensemble or keyboard music, they also connect the staves of a system.</li></ul>` },
    { title: "Against the meter", kick: "Rhythm terms", render: (H, k, U) => {
      // each example plays with a metronome click on the beat (3/4 for the hemiola; 4/4 for straight and swung eighths)
      const hem = ev([[0, 1, 72], [1, 1, 72], [2, 1, 72], [3, 2, 79], [5, 2, 79], [7, 2, 79], [0, 3, 48, .5], [3, 3, 48, .5], [6, 3, 48, .5]], .4); hem.ev.push(...clicks(9, .4, 3));
      const swing = { ev: [0, 1, 2, 3, 4, 5, 6, 7].map(i => [74 + (i % 4 === 3 ? 3 : i % 2 ? 2 : 0), Math.floor(i / 2) * .6 + (i % 2 ? .4 : 0), i % 2 ? .18 : .36, .8]).concat(clicks(4, .6, 4)) };
      const straight = { ev: [0, 1, 2, 3, 4, 5, 6, 7].map(i => [74 + (i % 4 === 3 ? 3 : i % 2 ? 2 : 0), i * .3, .27, .8]).concat(clicks(4, .6, 4)) };
      return `<ul><li><b>Anacrusis</b> (pickup): one or more notes before the first downbeat of a phrase.</li>
        <li><b>Syncopation</b>: a note begins on an unaccented part of the bar and is sustained into an accented part.</li>
        <li><b>Hemiola</b>: a rhythm that conflicts with the meter, typically three notes in the place of two, or vice versa. ${U.sound(hem, "Hear a hemiola")}</li>
        <li><b>Asymmetrical meter</b>: uneven groups of beats in a bar, such as 5/8 as 2 + 3 or 3 + 2 (or uneven beamings within an even meter, such as 3 + 3 + 2 eighths in 4/4).</li>
        <li><b>Mixed meter</b>: time signatures changing as a consistent feature (not one change for a whole section), sometimes growing or shrinking a repeating pattern one note at a time.</li>
        <li><b>Swing, shuffle and notes inégales</b>: steady eighths performed as unequal, long–short pairs. Notes inégales go back to the 16th century (Baroque performance); swing (jazz) varies more than shuffle (boogie-woogie, some pop). ${U.sound(straight, "Straight")} ${U.sound(swing, "Swung")}</li>
        <li><b>Unmeasured rhythm</b>: music performed without measured rhythm, sometimes notated without stems.</li></ul>`;
    } },
    { title: "Layers of time", kick: "Polyrhythm, polymeter, metric modulation", render: (H, k, U) => {
      const p32 = { ev: [0, 1, 2, 3].flatMap(c => [[76, c * 1.2, .15, .8], [76, c * 1.2 + .4, .15, .8], [76, c * 1.2 + .8, .15, .8], [60, c * 1.2, .2, .8], [60, c * 1.2 + .6, .2, .8]]) };
      return `<ul><li><b>Polyrhythm</b>: two or more simultaneous patterns that don't share the same beat subdivision, aligning at the start of each cycle (3:2 means three even notes against two). ${U.sound(p32, "Hear 3 against 2")}</li>
        <li><b>Polymeter</b>: two or more meters at once, each part keeping its own; with the same pulse, 4/4 against 3/4 lines up only every 12 beats.</li>
        <li><b>Metric modulation</b>: a change of tempo or pulse by reinterpreting a rhythmic value as a different one, notated like “♩ = ♩.”. For example, if the half note stays constant, half a bar of 4/4 can become a whole bar of 3/4. Metric modulation is often combined with polyrhythm.</li></ul>`;
    } },
    { title: "Notating lyrics", kick: "Writing for voice", render: (H, k, U) => {
      return `<ul><li>Beam vocal music by the same principles as instrumental music; the old practice of breaking beams at each syllable has largely been abandoned.</li>
        <li>Lyrics go <b>below</b> the staff (except in unusual circumstances); in vocal music, dynamics go <b>above</b> to avoid the lyrics (pop melodies often omit dynamics).</li>
        <li>Each syllable lines up under the note (or group of notes) it's sung on. <b>Hyphens</b> separate syllables within a word; <b>spaces</b> separate words.</li>
        <li>A <b>melisma</b> (several notes on one syllable) is slurred, and an underscore <b>extender</b> line continues to its last note.</li>
        <li>Keep ordinary spellings; never divide a single syllable. Divide syllables as dictionaries do.</li></ul>`
        + `<figure class="lfig"><img src="assets/img/Supremes%20-%20Baby%20Love.png" alt="Eight bars of a pop vocal melody in 4/4, on two lines, with the lyrics below the staff. Each syllable sits under its note; a hyphen splits a two-syllable word; extender lines follow held words; slurs join the notes of melismas." style="width:100%;max-width:900px;display:block;margin:0 auto;background:#fff;border-radius:8px">
          <figcaption>Lyrics in a pop melody: syllables line up under their notes, beams follow the beat (not the syllables), hyphens split words, and slurred melismas get extender lines to their last note.</figcaption>
          <audio controls preload="none" src="assets/audio/Supremes%20-%20Baby%20Love.mp3" style="width:100%;max-width:520px;display:block;margin:8px auto 0">Your browser can't play this audio clip.</audio>
          <p class="small lcite">The Supremes, “Baby Love” (words and music by Brian Holland, Lamont Dozier and Edward Holland Jr.; Motown, 1964).</p><p class="note lcite fair-use" data-fair-use></p></figure>`;
    } },
    { title: "Quick check", kick: "Then practice", render: (H) => H.check("In 4/4, why avoid a half note starting on beat 2?", "it hides beat 3", ["it's too long", "half notes can't follow quarters", "it changes the meter"], "Show the middle of the bar.") + H.check("Where do ties go when stems point up?", "below the noteheads", ["above the stems", "through the stems", "anywhere"], "Ties curve on the notehead side, away from the stems.") + H.check("Three notes against two, as in 3:2, is…", "a polyrhythm", ["a polymeter", "a hemiola only in 6/8", "a metric modulation"], "Different subdivisions at once.") + H.check("In vocal music, dynamics usually go…", "above the staff", ["below the lyrics", "between the syllables", "in the bass clef"], "Lyrics take the space below.") },
  ] };
  return { key: "silverapps-rhythmlesson-v1", lesson, make: () => null, reference: () => "", modes: [], topics: [] };
})();
