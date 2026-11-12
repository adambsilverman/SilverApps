window.FAM = (() => {
  // ===== Understanding Piano Accompaniment: lesson only (practice: the Groove Maker). Examples: Adam's settings of Brother, Can You Spare a Dime? (build/harmony/dime.js). Engine: build/harmony/engine.js =====
  const tbl = (cap, head, rows) => `<div class="ltable-wrap" tabindex="0" role="region" aria-label="${cap}"><table class="ltable"><caption>${cap}</caption><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  const C = s => `{sym:${s}}`;
  const SIG = { 2: -1, 5: -1, 6: -1 };   // C minor / E♭ major: letter indices (C = 0)
  const SHOW = `<p class="small">The chord symbols are hidden. Work out which chord each part of the accompaniment spells, then press <b>Show the chords</b> to check: each chord's region is shaded.</p>`;
  // a grand-staff figure of single chords: each column { t, b, lab }
  const gfig = (H, U, cols, cap) => U.fig({ type: "grand", vf: "Eb", sig: SIG, cols: cols.map(c => Object.assign({ labNear: true }, c)) }, cap, { play: { chords: cols.map(c => (c.t || []).concat(c.b || []).map(s => H.midi(H.parse(s)))), gap: 1.3, dur: .95 } });
  // boom-chuck-chuck in 3/4: Cm, Fm, G7, Cm
  const N = (k, d, sym) => Object.assign({ k, d }, sym ? { sym } : {}), R = d => ({ k: [], d });
  const WALTZ = { type: "score", clefs: ["treble", "bass"], time: "3/4", vf: "Eb", sig: SIG, bpm: 132, final: true, rowW: 900, bars: [
    { t: [[R("q"), N(["G3", "C4", "E♭4"], "q", "Cm"), N(["G3", "C4", "E♭4"], "q")]], b: [[N(["C3"], "q"), R("q"), R("q")]] },
    { t: [[R("q"), N(["A♭3", "C4", "F4"], "q", "Fm"), N(["A♭3", "C4", "F4"], "q")]], b: [[N(["F2"], "q"), R("q"), R("q")]] },
    { t: [[R("q"), N(["G3", "B3", "F4"], "q", "G7"), N(["G3", "B3", "F4"], "q")]], b: [[N(["G2"], "q"), R("q"), R("q")]] },
    { t: [[R("q"), N(["G3", "C4", "E♭4"], "q", "Cm"), N(["G3", "C4", "E♭4"], "q")]], b: [[N(["C3"], "q"), R("q"), R("q")]] }] };

  const lesson = { steps: [
    { title: "From lead sheet to piano part", kick: "One song, many accompaniments", render: () => `<p>Most songs reach a pianist as a <a href="lead-sheets-lesson.html">lead sheet</a>: a melody, its lyrics, and chord symbols. Nothing on the page says what the piano should actually play. That's the accompanist's job: to turn each chord symbol into notes, in a rhythm and texture that suit the song.</p>
      <p>This lesson works from one lead sheet, the first eight bars of <i>Brother, Can You Spare a Dime?</i> (Jay Gorney and E. Y. Harburg, 1932):</p>
      <figure class="lfig lsfig"><img src="assets/img/dime/leadsheet.png" alt="Lead sheet of the first eight bars of Brother, Can You Spare a Dime? in C minor, 4/4, Medium Slow: melody with lyrics and chord symbols (Cm, G7/D, C7/E, F, B-flat/D, E-flat, G7, Dm7 flat 5, G7, Cm, A-flat 7, Fm6, G7, Cm, G7), ending with a first ending and a repeat sign." width="1600" height="553">
      <figcaption>${DIME.aud("leadsheet")}</figcaption></figure>
      <p>Every example that follows is an <b>expansion</b> of this page: the same melody and the same chords, written out for two hands in a different way: block chords, boom-chuck, stride, Alberti bass, and an active bass line. Along the way you'll see how to fit the notes in your hands, keep the chords in one place, and decide where the bass goes.</p>
      <p>In each setting the chord symbols are hidden at first. Before you show them, try to work out which chord each part of the accompaniment spells, using the lead sheet above.</p>` },
    { title: "Three jobs for two hands", kick: "Melody, harmony, bass", render: () => `<p>A lead sheet gives you a melody and chord symbols. To turn them into a piano part, split the music into three <b>layers</b>:</p>
      <ul><li><b>Melody</b>: on top, in the right hand, where it's easiest to hear.</li>
      <li><b>Harmony</b>: the other tones of each chord, tucked <b>under the melody</b> in the right hand (or in the middle of the keyboard).</li>
      <li><b>Bass</b>: the lowest note, in the left hand: the chord's root, or the note after the slash in a slash chord.</li></ul>
      <p>Here is the lead sheet set that way: the melody on top of the right hand with chord tones under it, and a bass line in the left hand.</p>
      ${DIME.fig("bassline", "Melody on top of the right hand, chord tones under it, bass in the left hand.", { g7d: true })}${SHOW}
      <p>When you accompany a <b>singer</b>, leave the melody out: the right hand plays only the chords (see “Keep the chords in one place”).</p>` },
    { title: "Fitting the notes in your hands", kick: "Span, spacing and register", render: (H, k, U) => `<p>Every note you write has to be playable. A few rules of thumb:</p>
      <ul><li><b>Each hand spans about an octave.</b> In the right hand, keep the chord tones within an octave below the melody note, so one hand can hold them all. Two chord tones under the melody is plenty; three gets thick.</li>
      <li><b>Low notes need space.</b> Close chords low on the keyboard sound muddy. In the bass, play a single note, an octave, or an open 5th, and keep 3rds above about C3.</li>
      <li><b>Leave a gap between the hands</b> so they don't collide, and so the chord tones don't bury the melody.</li>
      <li><b>You don't need every chord tone.</b> The bass usually has the root; the right hand can leave out the 5th, and should avoid doubling the 3rd.</li></ul>
      ${gfig(H, U, [{ t: ["G4", "C5", "E♭5"], b: ["C2", "E♭2", "G2"], lab: "muddy" }, { t: ["G4", "C5", "E♭5"], b: ["C2", "G2"], lab: "clear" }, { t: ["G3", "C4", "E♭4", "G4", "C5"], b: ["C3"], lab: "too wide" }, { t: ["C5", "E♭5", "G5"], b: ["C3"], lab: "fits" }], "C minor four ways. A close triad low in the bass is muddy; an open 5th is clear. A right-hand chord wider than an octave doesn't fit one hand; three notes within an octave do.")}` },
    { title: "Keep the chords in one place", kick: "Inversions instead of leaps", render: (H, k, U) => `<p>If you play every chord in <b>root position</b>, the right hand jumps around the keyboard and the harmony sounds disjointed. Instead, choose for each chord the <b>inversion</b> closest to the one before: keep common tones, and move the others by the smallest step. The chord shapes then stay in one comfortable <b>register</b>, and the left hand supplies the roots.</p>
      ${gfig(H, U, [{ t: ["C4", "E♭4", "G4"], b: ["C3"], lab: "Cm" }, { t: ["F4", "A♭4", "C5"], b: ["F2"], lab: "Fm" }, { t: ["G4", "B4", "D5", "F5"], b: ["G2"], lab: "G7" }, { t: ["C4", "E♭4", "G4"], b: ["C3"], lab: "Cm" }], "Root position every time: the right hand leaps.")}
      ${gfig(H, U, [{ t: ["C4", "E♭4", "G4"], b: ["C3"], lab: "Cm" }, { t: ["C4", "F4", "A♭4"], b: ["F2"], lab: "Fm" }, { t: ["B3", "D4", "F4", "G4"], b: ["G2"], lab: "G7" }, { t: ["C4", "E♭4", "G4"], b: ["C3"], lab: "Cm" }], "The nearest inversion each time: the same chords, in one place.")}
      <p>This is how a pianist accompanies a singer from a lead sheet: right-hand chords in the middle of the keyboard, left-hand bass notes, and the singer carries the melody (there's an example in “Boom-chuck and boom-chuck-chuck”).</p>`
      + H.check("Why play most right-hand chords in inversions rather than root position?", "so the chords stay in one register and move smoothly", ["because root position is wrong on a lead sheet", "so the bass is always the 3rd", "to make the chords louder"], "Nearest inversions keep common tones and small steps, so the hand barely moves.") },
    { title: "The bass doesn't need every beat", kick: "Mark the changes, then get out of the way", render: () => `<p>The bass note tells the listener which chord is sounding. It's strongest on <b>beat 1</b> and on <b>chord changes</b>; after that it can ring, move to another chord tone, or rest. A full chord with its bass on every beat gets heavy fast:</p>
      ${DIME.fig("pulse", "Left-hand chords on every beat: steady, but thick.", { g7d: true })}
      ${DIME.fig("block", "The same chords held for each region: calm, with space for the melody.", { g7d: true })}${SHOW}
      <ul><li>Put bass notes where the chord changes and on strong beats; let them sustain (with the pedal on an acoustic piano).</li>
      <li>When the melody is busy, the accompaniment can be still, and when the melody holds or rests, the accompaniment can move.</li>
      <li>On a held chord, the bass can alternate <b>root and 5th</b> to keep it moving without changing the harmony.</li></ul>` },
    { title: "Block chords", kick: "The simplest texture", render: () => `<p><b>Block chords</b> play all the chord tones together. Held for each chord's whole region, they suit hymns, slow ballads and the first time you read a song; repeated on the beats, they mark the pulse. Both settings in the step before are block chords: the held one changes only when the chord symbol changes, the other repeats each chord on every beat.</p>
      <p>When the left hand plays the chords, keep them compact and around the octave below middle C, so they don't get muddy. Slash chords such as ${C("G7/D")} and ${C("C7/E")} put their bass note at the bottom of the chord.</p>` },
    { title: "Boom-chuck and boom-chuck-chuck", kick: "Bass on the strong beats, chords on the weak ones", render: (H, k, U) => `<p>In a <b>boom-chuck</b> pattern the bass (“boom”) takes the strong beats and the chords answer (“chuck”) on the weak ones. In 4/4 that's bass on 1 and 3, chords on 2 and 4; in 2/4, bass on 1, chord on 2. It's the basis of marches, polkas, country, folk and ragtime. The bass can be in the left hand with the chords in the right, as in this accompaniment for a singer:</p>
      ${DIME.fig("singer", "Boom-chuck shared between the hands: left-hand bass on 1 and 3, right-hand chords on 2 and 4.")}${SHOW}
      <p>In 3/4, <b>boom-chuck-chuck</b> is the waltz accompaniment: bass on beat 1, chords on beats 2 and 3.</p>
      ${U.fig(WALTZ, "Boom-chuck-chuck in 3/4: Cm, Fm, G7, Cm.", { follow: true })}`
      + H.check("In a 4/4 boom-chuck pattern, where do the chords usually go?", "beats 2 and 4", ["beats 1 and 3", "every beat", "only beat 1"], "The bass takes the strong beats (1 and 3), the chords the weak ones (2 and 4).") },
    { title: "Stride", kick: "The left hand does both jobs", render: () => `<p><b>Stride</b> piano (Harlem in the 1920s: James P. Johnson, Fats Waller, Willie “The Lion” Smith) moves boom-chuck entirely into the left hand: a low bass note on beats 1 and 3, then a leap up to a chord in the middle of the keyboard on 2 and 4. That frees the right hand for the melody.</p>
      ${DIME.fig("stride", "Stride: low bass notes on 1 and 3, mid-range chords on 2 and 4, all in the left hand.")}${SHOW}
      <p>Keep the left-hand chords in one register (nearest inversions again) so the leap back to the bass is the only big move.</p>` },
    { title: "Alberti bass and broken chords", kick: "Low, high, middle, high", render: () => `<p>An <b>Alberti bass</b> (after Domenico Alberti, about 1710–1740) breaks each chord into a repeating figure: <b>low–high–middle–high</b>. It's everywhere in Classical keyboard music (Mozart, Haydn, early Beethoven). Keep it in close position, just above the bass, and let it run in steady eighths or sixteenths under the melody.</p>
      ${DIME.fig("alberti", "Alberti bass in eighth notes, with the melody alone in the right hand.", { g7d: true })}${SHOW}
      <p>Other <b>broken-chord</b> patterns spread the chord wider (bass, 5th, octave, then the 3rd above) for ballads; with the pedal they fill out the sound without getting thick.</p>` },
    { title: "Rhythmicized chords", kick: "A steady pattern for a singer", render: () => `<p>Another way to accompany a singer is to keep the chords moving in a <b>steady rhythm</b>. Here the right hand plays each chord as a repeating eighth-note figure (two chord tones on each beat, answered by a single lower note in between), while the left hand holds the bass in <b>half notes</b>, changing only with the chords. The pedal changes with each chord, so the sound stays connected but never blurs two harmonies together.</p>
      ${DIME.fig("rhythm", "Voice (in the bass clef) and piano: right-hand chords in a steady eighth-note pattern, left-hand bass in half notes, pedal changing with each chord.")}${SHOW}
      <ul><li>The pattern gives the song a pulse without the singer having to supply it.</li>
      <li>The right-hand chords stay in one register (nearest inversions), so the figure barely moves as the harmony changes.</li>
      <li>In bar 8 the pattern climbs to lead back to the top of the song: an accompaniment can fill the gaps the melody leaves.</li></ul>` },
    { title: "An active bass line", kick: "Connect the chords", render: () => `<p>Instead of repeating roots, the left hand can play a <b>bass line</b>: the chord's bass note on each change, connected by chord tones and steps. A note a step away from the next chord's bass leads into it smoothly. Above it, the right hand keeps the melody on top with chord tones under it.</p>
      ${DIME.fig("bassline", "An active bass line in the left hand; melody and chord tones in the right.", { g7d: true })}${SHOW}
      <p>Slash chords already sketch a line: ${C("Cm")}–${C("G7/D")}–${C("C7/E")}–${C("F")} gives a rising bass C–D–E–F before any extra notes are added.</p>` },
    { title: "Choosing a pattern", kick: "Style, tempo and the melody", render: H => `${tbl("Accompaniment patterns", ["Pattern", "What it does", "Good for"], [
        ["Block chords", "all chord tones together, held or on the beats", "hymns, slow ballads, sight-reading"],
        ["Boom-chuck", "bass on strong beats, chords on weak beats", "marches, folk, country, polkas, upbeat songs"],
        ["Boom-chuck-chuck", "bass on 1, chords on 2 and 3", "waltzes and other songs in 3/4"],
        ["Stride", "left hand leaps: bass on 1 and 3, chords on 2 and 4", "ragtime, early jazz, solo piano"],
        ["Alberti bass", "low–high–middle–high broken chord", "Classical style, gentle songs"],
        ["Broken chords", "wide arpeggios from the bass", "ballads, slow and lyrical songs"],
        ["Rhythmicized chords", "chord tones in a steady repeating rhythm over a held bass", "ballads and accompanying a singer"],
        ["Active bass line", "bass moves between chord tones and steps", "jazz, pop, gospel; adding motion"]])}
      <ul><li><b>Start simple</b>: block chords first, then add rhythm.</li>
      <li><b>Pick one pattern for a section</b> and keep it; change pattern at a new section to mark the form.</li>
      <li><b>Thin out under a busy melody</b>, and fill in when the melody holds or rests.</li>
      <li><b>Practice hands separately</b>, then together at a slow tempo.</li></ul>
      <p>To hear these patterns with any progression, try the <a href="groove-maker.html"><b>Groove Maker</b></a>.</p>`
      + H.check("Which pattern puts both the bass and the chords in the left hand?", "stride", ["Alberti bass", "block chords", "boom-chuck with chords in the right hand"], "Stride leaps between a low bass and a middle-register chord, all in the left hand.") },
  ] };
  return { key: "silverapps-accomp-v1", lesson, make: () => null, reference: () => "", modes: [], topics: [] };
})();
