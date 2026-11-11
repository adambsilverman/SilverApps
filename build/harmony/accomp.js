window.FAM = (() => {
  // ===== Understanding Piano Accompaniment: lesson only (practice: the Groove Player). Every example is generated from the chords of Hard Times (build/harmony/hardtimes.js). Engine: build/harmony/engine.js =====
  const tbl = (cap, head, rows) => `<div class="ltable-wrap" tabindex="0" role="region" aria-label="${cap}"><table class="ltable"><caption>${cap}</caption><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  const C = s => `{sym:${s}}`;
  const SIG = { 2: -1, 5: -1, 6: -1 };   // E♭ major: letter indices (C = 0)
  const ex = (U, o, cap) => U.fig(HT.spec(Object.assign({ from: -1, to: 16 }, o)), cap, { follow: true });
  // a grand-staff figure of single chords: each column { t, b, lab }
  const gfig = (H, U, cols, cap) => U.fig({ type: "grand", vf: "Eb", sig: SIG, cols: cols.map(c => Object.assign({ labNear: true }, c)) }, cap, { play: { chords: cols.map(c => (c.t || []).concat(c.b || []).map(s => H.midi(H.parse(s)))), gap: 1.3, dur: .95 } });

  const lesson = { steps: [
    { title: "Three jobs for two hands", kick: "Melody, harmony, bass", render: (H, k, U) => `<p>A lead sheet gives you a melody and chord symbols. To turn them into a piano part, split the music into three <b>layers</b>:</p>
      <ul><li><b>Melody</b>: on top, in the right hand, where it's easiest to hear.</li>
      <li><b>Harmony</b>: the other tones of each chord, tucked <b>under the melody</b> in the right hand (or in the middle of the keyboard).</li>
      <li><b>Bass</b>: the lowest note, in the left hand: the chord's root, or the note after the slash in a slash chord.</li></ul>
      <p>Here is the opening of <i>Hard Times</i> (from the <a href="lead-sheets-lesson.html">Lead Sheets</a> lesson) set that way: melody on top with two chord tones under it, and a bass note for each chord.</p>
      ${ex(U, { pattern: "melBlock", melody: "rh" }, "Melody on top of the right hand (stems up), chord tones under it (stems down), bass in the left hand.")}
      <p>We've moved the melody up an octave from the lead sheet. As written it sits around middle C, where there's no room under it for chord tones without crowding the left hand. When you accompany a <b>singer</b>, leave the melody out: the right hand plays only the chords (see “Keep the chords in one place”).</p>` },
    { title: "Fitting the notes in your hands", kick: "Span, spacing and register", render: (H, k, U) => `<p>Every note you write has to be playable. A few rules of thumb:</p>
      <ul><li><b>Each hand spans about an octave.</b> In the right hand, keep the chord tones within an octave below the melody note, so one hand can hold them all. Two chord tones under the melody is plenty; three gets thick.</li>
      <li><b>Low notes need space.</b> Close chords low on the keyboard sound muddy. In the bass, play a single note, an octave, or an open 5th, and keep 3rds above about C3.</li>
      <li><b>Leave a gap between the hands</b> so they don't collide, and so the chord tones don't bury the melody.</li>
      <li><b>You don't need every chord tone.</b> The bass usually has the root; the right hand can leave out the 5th, and should avoid doubling the 3rd.</li></ul>
      ${gfig(H, U, [{ t: ["G4", "B♭4", "E♭5"], b: ["E♭2", "G2", "B♭2"], lab: "muddy" }, { t: ["G4", "B♭4", "E♭5"], b: ["E♭2", "B♭2"], lab: "clear" }, { t: ["B♭3", "E♭4", "G4", "B♭4", "E♭5"], b: ["E♭3"], lab: "too wide" }, { t: ["E♭5", "G5", "B♭5"], b: ["E♭3"], lab: "fits" }], "E♭ major four ways. A close triad low in the bass is muddy; an open 5th is clear. A right-hand chord wider than an octave doesn't fit one hand; three notes within an octave do.")}` },
    { title: "Keep the chords in one place", kick: "Inversions instead of leaps", render: (H, k, U) => `<p>If you play every chord in <b>root position</b>, the right hand jumps around the keyboard and the harmony sounds disjointed. Instead, choose for each chord the <b>inversion</b> closest to the one before: keep common tones, and move the others by the smallest step. The chord shapes then stay in one comfortable <b>register</b> (here, around middle C), and the bass can supply the roots.</p>
      ${ex(U, { from: 0, pattern: "jumpy" }, "Every chord in root position: the right hand leaps.")}
      ${ex(U, { from: 0, pattern: "block" }, "The nearest inversion each time: the same chords, in one place.")}
      <p>This is also how a pianist accompanies a singer from a lead sheet: right-hand chords in the middle of the keyboard, left-hand bass notes, and the singer carries the melody.</p>`
      + H.check("Why play most right-hand chords in inversions rather than root position?", "so the chords stay in one register and move smoothly", ["because root position is wrong on a lead sheet", "so the bass is always the 3rd", "to make the chords louder"], "Nearest inversions keep common tones and small steps, so the hand barely moves.") },
    { title: "The bass doesn't need every beat", kick: "Mark the changes, then get out of the way", render: (H, k, U) => `<p>The bass note tells the listener which chord is sounding. It's strongest on <b>beat 1</b> and on <b>chord changes</b>; after that it can ring, move to another chord tone, or rest. A bass on every beat, under a chord on every beat, gets heavy fast:</p>
      ${ex(U, { from: 0, pattern: "pound" }, "Bass and chord on every beat: a lot of sound, and no shape.")}
      ${ex(U, { from: 0, pattern: "block" }, "Bass only on each change, chords held: calm, with space for a melody.")}
      <ul><li>Put bass notes where the chord changes and on strong beats; let them sustain (with the pedal on an acoustic piano).</li>
      <li>When the melody is busy, the accompaniment can be still, and when the melody holds or rests, the accompaniment can move.</li>
      <li>On a held chord, the bass can alternate <b>root and 5th</b> to keep it moving without changing the harmony.</li></ul>` },
    { title: "Block chords", kick: "The simplest texture", render: (H, k, U) => `<p><b>Block chords</b> play all the chord tones together. Held for each chord's whole region, they suit hymns, slow ballads and the first time you read a song. Repeated on the beats, they mark the pulse.</p>
      ${ex(U, { pattern: "melBlock", melody: "rh" }, "Block chords under the melody, changing only when the chord symbol changes.")}
      <p>To keep the melody on top, choose chord tones <b>below</b> the melody note at each change. When the melody drops below them later in the region, re-voice the chord or let it rest.</p>` },
    { title: "Boom-chuck and boom-chuck-chuck", kick: "Bass on the strong beats, chords on the weak ones", render: (H, k, U) => `<p>In a <b>boom-chuck</b> pattern the left hand plays the bass (“boom”) on the strong beats and the chords answer (“chuck”) on the weak ones. In 4/4 that's bass on 1 and 3, chords on 2 and 4; in 2/4, bass on 1, chord on 2. It's the basis of marches, polkas, country, folk and ragtime.</p>
      ${ex(U, { pattern: "boom", melody: "rh", opts: { under: true } }, "Boom-chuck in 4/4: the bass alternates root and 5th; chords under the melody on 2 and 4. Where a chord changes on a weak beat, it gets its own bass.")}
      <p>In 3/4, <b>boom-chuck-chuck</b> is the waltz accompaniment: bass on beat 1, chords on beats 2 and 3.</p>
      ${U.fig(HT.waltz(), "Boom-chuck-chuck in 3/4: E♭, A♭, B♭7, E♭.", { follow: true })}`
      + H.check("In a 4/4 boom-chuck pattern, where do the chords usually go?", "beats 2 and 4", ["beats 1 and 3", "every beat", "only beat 1"], "The bass takes the strong beats (1 and 3), the chords the weak ones (2 and 4).") },
    { title: "Stride", kick: "The left hand does both jobs", render: (H, k, U) => `<p><b>Stride</b> piano (Harlem in the 1920s: James P. Johnson, Fats Waller, Willie “The Lion” Smith) moves boom-chuck entirely into the left hand: a low bass note or octave on beats 1 and 3, then a leap up to a chord in the middle of the keyboard on 2 and 4. That frees the right hand for the melody.</p>
      ${ex(U, { pattern: "stride", melody: "rh" }, "Stride: low octaves on 1 and 3, mid-range chords on 2 and 4, all in the left hand.")}
      <p>Keep the left-hand chords in one register (nearest inversions again) so the leap back to the bass is the only big move.</p>` },
    { title: "Alberti bass", kick: "Low, high, middle, high", render: (H, k, U) => `<p>An <b>Alberti bass</b> (after Domenico Alberti, about 1710–1740) breaks each chord into a repeating figure: <b>low–high–middle–high</b>. It's everywhere in Classical keyboard music (Mozart, Haydn, early Beethoven). Keep it in close position, just above the bass, and let it run in steady eighths or sixteenths under the melody.</p>
      ${ex(U, { pattern: "alberti", melody: "rh" }, "Alberti bass in eighth notes, with the melody alone in the right hand.")}` },
    { title: "Broken chords", kick: "Rolling arpeggios", render: (H, k, U) => `<p><b>Broken chords</b> (arpeggios) spread a chord across a wide span: bass, 5th, octave, then the 3rd above (a 10th from the bass). They suit ballads and slow songs, and with the pedal they fill out the sound without getting thick. The right hand adds a chord tone or two under the melody on the strong beats.</p>
      ${ex(U, { pattern: "broken", melody: "rh" }, "Broken chords in the left hand; melody with a few chord tones in the right.")}` },
    { title: "An active bass line", kick: "Connect the chords", render: (H, k, U) => `<p>Instead of repeating roots, the left hand can play a <b>bass line</b>: the chord's bass note on each change, connected by chord tones and steps. A note a step away from the next chord's bass leads into it smoothly. Above it, the right hand plays block chords in one register.</p>
      ${ex(U, { from: 0, pattern: "walk" }, "A moving bass line in quarter notes; block chords above in the right hand.")}
      ${ex(U, { pattern: "walk", melody: "rh", opts: { melody: true } }, "The same bass line with the melody on top and chord tones under it.")}
      <p>Notice how a few slash chords already sketch a line: Foster's ${C("E♭")}–${C("E♭/G")}–${C("A♭")}–${C("B♭")}–${C("E♭/B♭")} gives a rising bass E♭–G–A♭–B♭ before any extra notes are added.</p>` },
    { title: "Choosing a pattern", kick: "Style, tempo and the melody", render: H => `${tbl("Accompaniment patterns", ["Pattern", "What it does", "Good for"], [
        ["Block chords", "all chord tones together, held or on the beats", "hymns, slow ballads, sight-reading"],
        ["Boom-chuck", "bass on strong beats, chords on weak beats", "marches, folk, country, polkas, upbeat songs"],
        ["Boom-chuck-chuck", "bass on 1, chords on 2 and 3", "waltzes and other songs in 3/4"],
        ["Stride", "left hand leaps: bass on 1 and 3, chords on 2 and 4", "ragtime, early jazz, solo piano"],
        ["Alberti bass", "low–high–middle–high broken chord", "Classical style, gentle songs"],
        ["Broken chords", "wide arpeggios from the bass", "ballads, slow and lyrical songs"],
        ["Active bass line", "bass moves between chord tones and steps", "jazz, pop, gospel; adding motion"]])}
      <ul><li><b>Start simple</b>: block chords first, then add rhythm.</li>
      <li><b>Pick one pattern for a section</b> and keep it; change pattern at a new section to mark the form.</li>
      <li><b>Thin out under a busy melody</b>, and fill in when the melody holds or rests.</li>
      <li><b>Practice hands separately</b>, then together at a slow tempo.</li></ul>
      <p>To hear these patterns with any progression, try the <a href="chord-progression-lab.html"><b>Groove Player</b></a>.</p>`
      + H.check("Which pattern puts both the bass and the chords in the left hand?", "stride", ["Alberti bass", "block chords", "boom-chuck with chords in the right hand"], "Stride leaps between a low bass and a middle-register chord, all in the left hand.") },
  ] };
  return { key: "silverapps-accomp-v1", lesson, make: () => null, reference: () => "", modes: [], topics: [] };
})();
