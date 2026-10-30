window.FAM = (() => {
  // ===== Piano (and the orchestral keyboards). Written from general orchestration and piano-writing practice. =====
  const F = (q, a, w, why) => ({ q, a, w, why });
  const INST = [
    F("How many keys does a standard modern piano have?", "88", ["76", "61", "97"], "From A0 to C8: seven and a quarter octaves."),
    F("What are the lowest and highest notes of a standard piano?", "A0 and C8", ["C1 and C8", "A0 and A7", "C0 and C8"], "Middle C is C4."),
    F("How does a piano make its sound?", "felt hammers strike the strings, then dampers stop them when the key is released", ["the strings are plucked", "air is blown across pipes", "the strings are bowed"], "That's why the piano is often grouped with the percussion in orchestration books."),
    F("How many strings does a middle-register piano note have?", "three, tuned in unison", ["one", "two, an octave apart", "five"], "The upper bass has two per note; the lowest bass notes have one thick wound string."),
    F("Can a pianist crescendo on a single held note?", "no: every note starts to fade as soon as it's struck", ["yes, by pressing harder", "yes, with the soft pedal", "only in the bass"], "Repeated notes, tremolos or the orchestra around it can create a crescendo."),
    F("Which register sustains longest?", "the bass", ["the top octave", "the middle", "they're all the same"], "High notes die away quickly; the top octave and a half have no dampers at all."),
    F("Why do close-position chords low in the bass sound muddy?", "the low strings' strong overtones clash when notes are close together", ["the low keys are out of tune", "the dampers don't work there", "the left hand is weaker"], "Space low chords widely (octaves, fifths, tenths) and put thirds higher up."),
    F("What lets a grand piano repeat a note very quickly?", "the double-escapement (repetition) action", ["the sostenuto pedal", "the una corda pedal", "extra strings"], "The hammer can be re-struck before the key returns all the way up."),
    F("What's the main difference between a grand and an upright piano?", "the grand's strings and action are horizontal, giving faster repetition and more control", ["the upright has fewer keys", "the grand has no pedals", "the upright is always louder"], "Uprights often have a practice mute in place of a true sostenuto pedal."),
    F("What is a comfortable stretch for one hand?", "an octave (a 9th or 10th for larger hands)", ["two octaves", "a fifth", "a twelfth"], "Write widely spaced chords as rolled or split between the hands."),
    F("How many notes can one hand play in a chord?", "up to five, within the hand's reach", ["one", "eight", "any number"], "Thumbs can sometimes take two adjacent white keys."),
  ];
  const PEDALS = [
    F("The right pedal is the…", "damper (sustain) pedal: it lifts all the dampers", ["soft pedal", "sostenuto pedal", "practice mute"], "Everything played keeps ringing, along with sympathetic resonance from other strings."),
    F("The left pedal on a grand piano is the…", "una corda (soft) pedal: the hammers strike fewer strings", ["damper pedal", "sostenuto pedal", "volume pedal"], "It softens and veils the tone. Cancel with tre corde (or tutte le corde)."),
    F("The middle pedal on a grand piano is the…", "sostenuto pedal: it sustains only the notes already held down when it's pressed", ["damper pedal for the bass only", "una corda", "a mute"], "Lets you hold a bass note or chord while playing staccato above it. Write Sost. Ped."),
    F("How is the damper pedal traditionally marked?", "Ped. to press, ✱ to release", ["u.c. and t.c.", "m.d. and m.s.", "8va and loco"], "Many editions use a bracket line under the staff instead, with notches for changes."),
    F("Legato (syncopated) pedaling means…", "changing the pedal just after each new note, so the sounds connect without blurring", ["holding the pedal through a whole piece", "pedaling on the beat before the note", "using only the soft pedal"], "The most common pedaling; pianists usually work it out themselves."),
    F("“Ped. ad lib.” or “con Ped.” tells the pianist…", "to pedal as they see fit", ["not to pedal", "to hold the pedal throughout", "to use the soft pedal"], "Write exact pedaling only when the effect matters (a blur, a long resonance)."),
    F("“senza Ped.” means…", "without the damper pedal", ["with the pedal", "soft pedal", "half pedal"], "Useful for dry, detached textures."),
    F("Half-pedaling…", "lets the dampers touch the strings lightly, thinning the resonance", ["presses two pedals at once", "is the soft pedal", "mutes the bass only"], "Used to clear harmonies without a complete break in sound."),
    F("Holding keys down silently, then playing other notes with the damper pedal up, produces…", "sympathetic resonance from the held strings", ["no sound", "a harmonic glissando", "a buzz"], "The silently held keys are usually notated with diamond noteheads."),
  ];
  const NOTA = [
    F("Piano music is normally written on…", "a grand staff, treble over bass, joined by a brace", ["one treble staff", "a percussion staff", "three staves always"], "Complex textures can use three staves."),
    F("m.d. and m.s. stand for…", "mano destra (right hand) and mano sinistra (left hand)", ["mezzo and mezzo-forte", "main and minor", "molto and meno"], "French: m.d. and m.g. (main droite, main gauche). English: r.h. and l.h."),
    F("When the right hand plays notes on the bass staff, you can…", "write cross-staff notation or change the clef", ["never notate it", "use a percussion clef", "write it an octave higher"], "Stem direction and beams can show which hand plays what."),
    F("For very high or low passages, it's clearer to use…", "ottava lines (8va, 8vb, 15ma) instead of many ledger lines", ["a new clef for each note", "alto clef", "tablature"], "End the line with loco if needed."),
    F("A piano glissando is easiest on…", "the white keys (with the nail or back of the finger)", ["chromatic notes", "the black and white keys together", "the lowest strings only"], "Black-key glissandos are possible; chromatic ones aren't. Write the first and last notes with a line."),
    F("A cluster is…", "a group of adjacent notes played together with the palm, fist or forearm", ["a rolled chord", "a fast scale", "a pedal marking"], "Notated as a thick bar or block between the outer notes, with sharps or flats for black keys."),
    F("A piano tremolo…", "alternates rapidly between two notes or chords to sustain the sound", ["is a vibrato", "is played with the soft pedal", "is impossible"], "Written like a measured or unmeasured tremolo between the notes."),
    F("A wavy vertical line before a chord means…", "roll (arpeggiate) the chord, bottom to top", ["play it twice", "trill the top note", "use the pedal"], "An arrow can show a downward roll."),
    F("Where do pedal markings usually go?", "below the bottom staff", ["above the top staff", "between the staves", "in a footnote"], "Dynamics usually go between the staves."),
  ];
  const ENS = [
    F("Where does the piano go in an orchestral score?", "with the keyboards, after the harp and before the strings", ["at the top of the score", "with the brass", "after the strings"], "A solo (concerto) piano goes just above the strings."),
    F("In an orchestra, the piano is often used to…", "add a crisp attack and color, doubling bass lines, pizzicato or high melodies", ["play every note of the strings", "replace the brass", "keep the tempo"], "A low piano with the basses adds definition; a high one adds glitter."),
    F("The celesta…", "has hammers striking metal bars and sounds an octave higher than written", ["is a small harpsichord", "sounds as written", "has strings and dampers like a piano"], "It's usually played by the orchestra's keyboardist."),
    F("The harpsichord differs from the piano because…", "its strings are plucked, so dynamics hardly change with touch", ["it has hammers", "it has no keys", "it sounds an octave lower"], "Color and volume change with registers (stops), not touch."),
    F("Playing directly on the strings inside the piano (plucking, muting, sweeping)…", "is possible, but check the venue and instrument and give clear instructions", ["is never allowed", "needs no instructions", "only works on uprights"], "Mark which strings to touch; pianists often use tape or chalk to find them."),
    F("A prepared piano…", "has objects (screws, bolts, rubber) placed between the strings to change their sound", ["has been tuned specially", "has extra pedals", "is an electronic piano"], "Give a preparation chart; ask permission first, since preparations can harm an instrument."),
    F("Touching a string at its midpoint inside the piano while playing the key gives…", "a harmonic an octave higher", ["a muted thud", "the same note", "no sound"], "Notate it like a string harmonic, with a circle or diamond and an explanation."),
    F("Pressing a finger on a string while playing its key (without finding a node) gives…", "a muted, plucked or wooden sound", ["a louder note", "a harmonic", "a glissando"], "Often notated with a + over the note and an explanation."),
    F("Which piano writing tends to cover an orchestra?", "thick, pedaled chords in the low and middle registers", ["single high notes", "light staccato octaves", "notes doubling the flute"], "Keep the piano clear of the registers you want the orchestra to own."),
  ];
  const MARKS = [["Ped.", "press the damper pedal"], ["✱", "release the damper pedal"], ["u.c.", "una corda: soft pedal down"], ["tre corde", "release the soft pedal"], ["Sost. Ped.", "press the sostenuto pedal"], ["m.d.", "right hand"], ["m.s.", "left hand"], ["8va", "play an octave higher than written"], ["8vb", "play an octave lower than written"], ["15ma", "play two octaves higher than written"], ["loco", "play at written pitch again"], ["senza Ped.", "don't use the damper pedal"]];
  const fromList = (H, list, kicker, topic) => { const f = H.rnd(list); return H.mc(f.q, f.a, f.w, f.why, { kicker, topic }); };
  function markQ(H) {
    const [m, mean] = H.rnd(MARKS);
    return H.mc(`In a piano part, what does “${m}” mean?`, mean, MARKS.map(x => x[1]), `${m}: ${mean}.`, { kicker: "Markings", topic: "nota", big: m });
  }
  function rangeQ(H) {
    const IN = ["A0", "B♭0", "B0", "C1", "D1", "C8", "B7", "A7", "G7"], OUT = ["G0", "G♯0", "F0", "C♯8", "D8", "E8"];
    const out = H.rnd(OUT), ins = H.shuffle(IN).slice(0, 3);
    return H.mc("Which of these notes is NOT on a standard 88-key piano?", out, ins, `The piano runs from A0 to C8; ${out} is outside that range.`, { kicker: "Range", topic: "inst" });
  }
  function celestaQ(H) {
    const step = 28 + Math.floor(Math.random() * 12), a = H.rnd([0, 0, 0, 1, -1]); let n = H.mk(step, 0); if (H.okNote(H.mk(step, a))) n = H.mk(step, a);
    const s = H.up(n, 7, 12);
    return H.mc("The celesta part shows this note. What pitch sounds?", H.nm(s), [H.nm(n), H.nm(H.up(n, -7, -12)), H.nm(H.up(n, 14, 24))], `The celesta sounds an octave higher than written: ${H.nm(n)} sounds ${H.nm(s)}.`, { kicker: "Celesta", topic: "ens", staff: { clef: "treble", groups: [[{ n }]], label: `Treble clef: ${H.nmSpoken(n)}.` }, play: { m: H.midi(s), pure: true }, playLabel: "Play the sounding pitch" });
  }
  return {
    key: "orch-piano",
    modes: [{ id: "inst", kicker: "The instrument" }, { id: "ped", kicker: "Pedals" }, { id: "nota", kicker: "Writing for the hands" }, { id: "ens", kicker: "In the ensemble" }],
    make(mode, H) {
      if (mode === "inst") return Math.random() < .25 ? rangeQ(H) : fromList(H, INST, "The instrument", "inst");
      if (mode === "ped") return fromList(H, PEDALS, "Pedals", "ped");
      if (mode === "nota") return Math.random() < .35 ? markQ(H) : fromList(H, NOTA, "Writing for the hands", "nota");
      return Math.random() < .25 ? celestaQ(H) : fromList(H, ENS, "In the ensemble", "ens");
    },
    reference(H, esc) {
      const rows = MARKS.map(([m, d]) => `<tr><th scope="row">${esc(m)}</th><td data-label="Meaning">${esc(d)}</td></tr>`).join("");
      return `<ul class="ref-list"><li><b>Range:</b> 88 keys, A0–C8 (middle C = C4). Bass notes ring longest; the top octave and a half has no dampers.</li>
      <li><b>Pedals:</b> right = damper (sustain); middle = sostenuto (holds only notes already down); left = una corda (soft).</li>
      <li><b>Hands:</b> an octave is comfortable (9th or 10th for large hands); up to five notes per hand.</li>
      <li><b>Low register:</b> space chords widely; close thirds in the bass sound muddy.</li>
      <li><b>Keyboards in the score:</b> after harp, before strings. Celesta sounds an octave higher than written.</li></ul>
      <div class="table-wrap"><table class="ref"><caption>Markings</caption><thead><tr><th scope="col">Marking</th><th scope="col">Meaning</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    },
  };
})();
