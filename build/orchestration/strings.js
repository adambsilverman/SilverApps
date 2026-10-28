window.FAM = (() => {
  const ROM = ["I", "II", "III", "IV"];
  const INS = [
    { id: "vn", name: "Violin", clef: "treble", s: ["E5", "A4", "D4", "G3"] },
    { id: "va", name: "Viola", clef: "alto", s: ["A4", "D4", "G3", "C3"] },
    { id: "vc", name: "Cello", clef: "bass", s: ["A3", "D3", "G2", "C2"] },
    { id: "cb", name: "Contrabass", clef: "bass", s: ["G2", "D2", "A1", "E1"], transposing: true },
  ];
  // Natural harmonics: touched interval above the open string → sounding interval above it (steps, semitones)
  const HARM = [
    { id: "oct", name: "octave harmonic", short: "octave (circle)", touch: [7, 12], sound: [7, 12], circle: true, what: "sounds where it is touched, an octave above the open string" },
    { id: "p5", name: "touch-P5 harmonic", short: "touch-P5", touch: [4, 7], sound: [11, 19], what: "sounds an octave plus a P5 above the string" },
    { id: "p4", name: "touch-P4 harmonic", short: "touch-P4", touch: [3, 5], sound: [14, 24], what: "sounds two octaves above the string" },
    { id: "M3", name: "touch-M3 harmonic", short: "touch-M3", touch: [2, 4], sound: [16, 28], what: "sounds two octaves plus a M3 above the string" },
    { id: "m3", name: "touch-m3 harmonic", short: "touch-m3", touch: [2, 3], sound: [18, 31], what: "sounds two octaves plus a P5 above the string" },
  ];
  const clefName = c => ({ treble: "Treble", alto: "Alto", bass: "Bass", tenor: "Tenor" })[c];

  const FACTS = [
    { t: "inst", q: "How many lines of string instruments does a standard orchestral score have?", a: "five: Violin I, Violin II, Violas, Cellos, Basses", w: ["four: Violins, Violas, Cellos, Basses", "three: Violins, Violas, Cellos and Basses", "six: Violin I, Violin II, Viola I, Viola II, Cellos, Basses"], why: "Violins are split into two parts that play identical instruments; Violin I is usually higher." },
    { t: "inst", q: "In 18th-century classical scores, cello and bass are typically…", a: "combined on one staff, with the bass an octave below the cello", w: ["written on separate staves in different keys", "left out of the score", "written in treble clef"], why: "The contrabass reinforces the cello line an octave lower." },
    { t: "inst", q: "Open strings of the violin, viola and cello are tuned…", a: "a perfect fifth apart", w: ["a perfect fourth apart", "a major third apart", "an octave apart"], why: "The contrabass is the exception: it's tuned in fourths." },
    { t: "inst", q: "The contrabass is tuned…", a: "in perfect fourths", w: ["in perfect fifths", "in major thirds", "in octaves"], why: "Violin, viola and cello are tuned in fifths." },
    { t: "inst", q: "Which is the only transposing instrument among the bowed strings?", a: "contrabass (sounds an octave lower)", w: ["viola (sounds a fifth lower)", "cello (sounds an octave lower)", "violin II"], why: "The bass is written an octave higher than it sounds." },
    { t: "inst", q: "Which clef does the viola normally read?", a: "alto clef", w: ["treble clef", "tenor clef", "bass clef"], why: "Higher viola passages may switch to treble clef." },
    { t: "inst", q: "High cello passages are written in…", a: "tenor or treble clef", w: ["alto clef only", "bass clef with many ledger lines", "percussion clef"], why: "Cello is usually in bass clef; tenor or treble avoids excessive ledger lines." },
    { t: "inst", q: "The cello is tuned exactly…", a: "one octave lower than the viola", w: ["one fifth lower than the viola", "one octave lower than the violin", "two octaves lower than the violin"], why: "Both are C G D A; the cello's strings are an octave lower." },
    { t: "inst", q: "How far apart are the strings of the viola and violin?", a: "the viola is tuned a fifth lower", w: ["the viola is tuned a fourth lower", "the viola is tuned an octave lower", "they are tuned the same"], why: "Violin G D A E; viola C G D A." },
    { t: "inst", q: "On the cello, the first-to-fourth finger span is about…", a: "a third", w: ["a fourth", "a fifth", "a major second"], why: "Violin spans a fourth; cello a third (a fourth in thumb position); bass only a major second." },
    { t: "inst", q: "On the contrabass, first to fourth finger in one position span only…", a: "a major second", w: ["a third", "a fourth", "a fifth"], why: "Notes are further apart on bass than any other string instrument." },
    { t: "inst", q: "Thumb position is used on which instruments?", a: "cello and contrabass", w: ["violin and viola", "all four bowed strings equally", "violin only"], why: "Stopping with the thumb lets the larger instruments reach wider intervals, especially up high." },
    { t: "inst", q: "Which bowed string's pizzicato has the most resonance and sustain?", a: "contrabass", w: ["violin", "viola", "cello"], why: "Larger instruments sustain plucked notes longer." },
    { t: "inst", q: "Many basses have an extension that lets them play down to…", a: "low C", w: ["low A", "low G", "low B♭"], why: "The low C attachment lengthens the E string; not every player has one." },
    { t: "inst", q: "Bass lines are usually doubled because…", a: "the bass doesn't project as clearly as other strings", w: ["bass players can't read the part", "the bass can't play in tune", "the bass sounds too bright"], why: "Undoubled bass lines often lack definition; cello, bassoon, trombone, tuba and others double it." },
    { t: "inst", q: "Which is the smallest, highest and most agile bowed string?", a: "violin", w: ["viola", "cello", "contrabass"], why: "The violin usually takes the soprano role." },
    { t: "inst", q: "Compared with the violin, the viola's upper register is…", a: "darker and mellower", w: ["more brilliant", "thinner and brighter", "identical"], why: "Viola harmonics have a bit more body; its quadruple stops are harder." },
    { t: "inst", q: "A symphony orchestra might have about…", a: "12 first violins, 10 seconds, 8 violas, 8 cellos, 6 basses", w: ["2 of each string instrument", "1 of each string instrument", "20 violins, 2 violas, 2 cellos, 1 bass"], why: "Strings use many players per part for power and warmth." },
    { t: "nums", q: "String numbers are written as…", a: "Roman numerals, highest string = I", w: ["Arabic numerals, lowest string = 1", "letter names only", "Roman numerals, lowest string = I"], why: "Violin string I is E; viola string II is D; cello string III is G; bass string IV is E." },
    { t: "nums", q: "How do you guarantee that an open string is played?", a: "write 0 above the note", w: ["write sul tasto", "write a circle above the note", "write V above the note"], why: "A circle means a harmonic; V is up-bow." },
    { t: "nums", q: "How do you ask for a passage on a particular string?", a: "write the Roman numeral, or sul + string name (sul G)", w: ["write the string name in the key signature", "write a diamond notehead", "write con sord."], why: "Without an indication, the choice of string is left to the player." },
    { t: "nums", q: "Playing a passage on a lower string in a higher position gives…", a: "a darker, more intense sound", w: ["a brighter, thinner sound", "exactly the same sound", "a harmonic"], why: "The higher string in a lower position is brighter." },
    { t: "nums", q: "Why do orchestral players often avoid open strings in exposed melodies?", a: "open strings can't be vibrated, so they stick out", w: ["open strings are always out of tune", "open strings are too quiet", "open strings require a mute"], why: "The same pitch is played stopped on the next lower string instead; the open IV string is the exception." },
    { t: "nums", q: "Which double stop is hardest to play in tune on violin, viola and cello?", a: "the perfect fifth (one finger stops both strings)", w: ["the major sixth", "the minor third", "any double stop with an open string"], why: "Double stops with open strings are the easiest." },
    { t: "nums", q: "All notes of a multiple stop must be…", a: "on adjacent strings in the same position", w: ["on the same string", "on non-adjacent strings", "harmonics"], why: "Three- and four-note chords are usually broken (arpeggiated) rather than sustained together." },
    { t: "nums", q: "What do most orchestras do with multiple stops in section parts?", a: "convert them to divisi", w: ["play them as harmonics", "leave out the top note", "play them pizzicato"], why: "Unless a special effect is wanted, divisi is usually the better choice." },
    { t: "nums", q: "Scordatura means…", a: "tuning strings to non-standard pitches", w: ["bowing near the bridge", "playing with the wood of the bow", "using a practice mute"], why: "It can extend the range lower, create drones, new harmonics and new multiple stops." },
  ];
  const TECH = [
    ["bow", "Bowing with the bow, the default way to play, is called…", "arco", ["pizzicato", "col legno", "tremolo"], "Only write arco to cancel pizz. or another way of playing."],
    ["bow", "The down-bow symbol (π) means the bow moves…", "from the frog toward the tip", ["from the tip toward the frog", "off the string", "near the bridge"], "Up-bow (V) moves from the tip toward the frog."],
    ["bow", "Which bow direction suits accents, downbeats and diminuendos?", "down-bow", ["up-bow", "either, always", "neither"], "Down-bows move from the heavy part of the bow to the light part."],
    ["bow", "Which bow direction suits crescendos and upbeats?", "up-bow", ["down-bow", "col legno", "spiccato"], "Up-bows move from light to heavy."],
    ["bow", "For string players, notes under one slur are…", "played in one bow direction", ["played with a new bow on each note", "plucked", "a phrase marking only"], "Slurs are not phrase markings for strings; long slurs that can't be played in one bow shouldn't be written."],
    ["bow", "Roughly how long can a violin bow stroke last at ff?", "1–3 seconds", ["10–15 seconds", "8–12 seconds", "30 seconds"], "pp: 10–15+ s; mf: 4–8 s; ff: 1–3 s. Cello and bass bows are shorter."],
    ["bow", "Continual alternation of down- and up-bows on consecutive notes is…", "détaché", ["martelé", "louré", "jeté"], "No special notation: just no slurs."],
    ["bow", "Slurred tenutos (a few nudged notes in one bow) are called…", "louré (brush stroke)", ["spiccato", "détaché", "col legno battuto"], "Often used on repeated pitches."],
    ["bow", "A hammered, accented on-the-string stroke that stops abruptly is…", "martelé", ["spiccato", "sautillé", "flautando"], "Martelé literally means hammered; it isn't possible on very fast notes."],
    ["bow", "Bouncing the bow off the string on separate strokes is…", "spiccato", ["martelé", "louré", "legato"], "Very fast, a loose sautillé keeps the hair on the string while the stick bounces."],
    ["bow", "“Throwing” the bow so it bounces several times in one stroke is…", "ricochet (jeté)", ["détaché", "louré", "col legno tratto"], "Usually 2–8 notes, best with a down-bow, notated as slurred staccatos."],
    ["bow", "A dotted long–short pair played in one bow is a…", "hooked bowing", ["ricochet", "double stop", "tremolo"], "Notated with a slur and a staccato or tenuto on the second note."],
    ["bow", "Bowed tremolo is notated with…", "three beams (slashes) through the stem", ["a trill sign", "a wavy line", "a diamond notehead"], "Fingered tremolos alternate between two pitches and should be slurred."],
    ["color", "Plucking the strings is indicated…", "pizz., cancelled by arco", ["col legno, cancelled by ord.", "l.v., cancelled by arco", "sul pont., cancelled by ord."], "Leave about a second to switch; end arco with an up-bow before pizz."],
    ["color", "To let a pizzicato note ring, write…", "l.v. (let vibrate) or an open tie", ["con sord.", "sul tasto", "a fermata over the bar line"], "Plucked notes on larger instruments sustain longer."],
    ["color", "As a rule of thumb, don't write pizzicato sixteenths faster than about…", "♩ = 84", ["♩ = 160", "♩ = 40", "any tempo works"], "Pizzicato is also tiring; leave rests."],
    ["color", "Muted strings are marked…", "con sord., cancelled by senza sord.", ["sul tasto, cancelled by ord.", "pizz., cancelled by arco", "flautando, cancelled by arco"], "Allow about 4 seconds to put the mute on and 2 to take it off."],
    ["color", "Bowing over the fingerboard (soft, fuzzy, flute-like) is…", "sul tasto or flautando", ["sul ponticello", "col legno battuto", "martelé"], "Cancelled by ord."],
    ["color", "Bowing near the bridge (eerie, glassy) is…", "sul ponticello", ["sul tasto", "flautando", "louré"], "Most effective for fast passages, trills and tremolos."],
    ["color", "Drawing the wood of the bow across the strings is…", "col legno tratto", ["col legno battuto", "sul tasto", "spiccato"], "A frail tone possible only at soft dynamics."],
    ["color", "Striking the strings with the wood of the bow is…", "col legno battuto", ["col legno tratto", "martelé", "pizzicato"], "A percussive attack, effective for rhythmic passages."],
    ["color", "To ask for no vibrato, write…", "non vib. (straight tone)", ["senza sord.", "sul tasto", "ord."], "Vibrato can't be applied to open strings or (usually) harmonics."],
    ["color", "String glissandos should almost always be marked with…", "a slur", ["a staccato", "an accent", "an up-bow"], "Kinds include single-string, harmonic and pizzicato glissandos."],
    ["div", "To split a section so half plays the top note and half the bottom, write…", "div.", ["unis.", "non div.", "tutti"], "For three ways, write div. a3."],
    ["div", "To cancel divisi, write…", "unis.", ["div.", "arco", "ord."], "Unisono: everyone plays the same line again."],
    ["div", "To make sure a multiple stop is not divided, write…", "non div.", ["div.", "unis.", "solo"], "Otherwise the section might split it."],
    ["div", "When one player plays alone and the rest of the section has another part, mark…", "solo and gli altri", ["div. and unis.", "tutti and senza", "arco and pizz."], "Gli altri means “the others.”"],
    ["div", "Dynamics and pizz./arco indications go…", "with the first note they affect, not under preceding rests", ["at the start of the bar, wherever the notes are", "under the rests before the notes", "only at the top of the score"], "Placement follows the notes they apply to."],
    ["harm", "Why use string harmonics?", "a silvery, flute-like tone, higher range and easier wide leaps", ["to play louder", "to avoid using the bow", "to play lower than the open string"], "They're best for pedal tones, isolated notes and slow, short melodies."],
    ["harm", "The most common and easiest artificial harmonic is the…", "touch-P4 (sounds two octaves above the stopped note)", ["touch-P5", "touch-m3", "touch-M6"], "Stopped note normal, touched note a P4 higher as a diamond."],
    ["harm", "Which harmonics are easier to play and speak more clearly?", "harmonics on cello and bass", ["harmonics on violin", "harmonics in fast passages", "artificial harmonics on bass"], "Touch-m3 artificial harmonics should only be considered on cello."],
  ];
  const facts = t => FACTS.filter(f => f.t === t);

  function openQ(H) {
    const x = H.rnd(INS), i = Math.floor(Math.random() * 4), n = H.parse(x.s[i]);
    const written = x.transposing ? H.up(n, 7, 12) : n, letter = x.s[i][0];
    const staff = { clef: x.clef, notes: [{ n: written }], label: `${clefName(x.clef)} clef, open-string note ${H.nmSpoken(written)}.` };
    const play = { m: H.midi(n) };
    const note = x.transposing ? " (written an octave higher than it sounds)" : "";
    const kind = Math.random();
    if (kind < .35) {
      const ch = x.s.map((s, k) => `${ROM[k]} (${s[0]})`);
      return H.mc(`Which open string of the ${x.name.toLowerCase()} is this?`, ch[i], ch, `${x.name} strings, I to IV: ${x.s.map((s, k) => `${ROM[k]} ${s}`).join(", ")}${x.transposing ? " (sounding)" : ""}.`, { big: x.name, staff, play, playLabel: "Play open string", kicker: "Open strings", topic: "open" });
    }
    if (kind < .7) {
      const others = INS.flatMap(y => y.s).concat(x.s).filter(s => s !== x.s[i]);
      return H.mc(`What is the ${x.name.toLowerCase()}'s string ${ROM[i]} (sounding pitch)?`, x.s[i], [...x.s.filter(s => s !== x.s[i]), ...H.shuffle(others)], `${x.name} strings from I down: ${x.s.join(", ")}.${x.transposing ? " Bass parts are written an octave higher." : ""}`, { big: x.name, staffAns: staff, staffAnsCap: `Written${note}`, play, playLabel: "Play open string", kicker: "Open strings", topic: "open" });
    }
    // which instrument has this string number at this sounding pitch?
    const who = INS.filter(y => y.s[i] === x.s[i]).map(y => y.name);
    return H.mc(`Which instrument's string ${ROM[i]} sounds ${x.s[i]}?`, x.name, INS.filter(y => !who.includes(y.name)).map(y => y.name), `${INS.map(y => `${y.name} ${ROM[i]} = ${y.s[i]}`).join("; ")}.`, { play, kicker: "String numbers", topic: "open" });
  }

  function harmQ(H) {
    const art = Math.random() < .3;
    if (art) {
      const x = H.rnd(INS.slice(0, 3)), lo = H.parse(x.s[3]).step + 1, hi = H.parse(x.s[0]).step + 3;
      let stopped;
      for (let k = 0; k < 50; k++) { stopped = H.mk(lo + Math.floor(Math.random() * (hi - lo)), Math.random() < .25 ? H.rnd([-1, 1]) : 0); if (H.okNote(stopped) && H.okNote(H.up(stopped, 3, 5))) break; }
      const touched = H.up(stopped, 3, 5), sounds = H.up(stopped, 14, 24);
            const clef = x.clef === "bass" && touched.step > 33 ? "tenor" : x.clef;
      return H.mc(`Artificial harmonic on the ${x.name.toLowerCase()}: the normal note is stopped and the diamond lightly touched. What pitch sounds?`, H.nm(sounds), [],
        `A touch-P4 artificial harmonic sounds two octaves above the stopped note: ${H.nm(stopped)} → ${H.nm(sounds)}.`,
        { big: x.name, kicker: "Artificial harmonic", topic: "harm", picker: { octaves: [2, 3, 4, 5, 6, 7] }, staff: { clef, groups: [[{ n: stopped }, { n: touched, head: "diamond" }]], label: `${clefName(clef)} clef: stopped note ${H.nmSpoken(stopped)} with a diamond notehead a perfect fourth above, ${H.nmSpoken(touched)}.` }, play: { m: H.midi(sounds), pure: true }, playLabel: "Play the harmonic" });
    }
    const x = H.rnd(INS.slice(0, 3)), i = Math.floor(Math.random() * 4), open = H.parse(x.s[i]);
    const h = H.rnd(HARM), touched = H.up(open, ...h.touch), sounds = H.up(open, ...h.sound);
        const staff = { clef: x.clef, notes: [{ n: touched, head: h.circle ? "normal" : "diamond", circle: h.circle }], label: `${clefName(x.clef)} clef, ${h.circle ? "note with a circle above" : "diamond notehead"} at ${H.nmSpoken(touched)}, on string ${ROM[i]} (${x.s[i][0]}).` };
    if (Math.random() < .3) {
      return H.mc(`On the ${x.name.toLowerCase()}'s ${x.s[i][0]} string (${ROM[i]}), which natural harmonic sounds ${H.nm(sounds)}?`, h.short, HARM.map(k => k.short),
        `${h.id === "oct" ? "An" : "A"} ${h.name} ${h.what}: ${x.s[i]} → ${H.nm(sounds)}. As the touched note moves down P5 → P4 → M3 → m3, the sounding pitch climbs the harmonic series.`,
        { big: x.name, kicker: "Natural harmonics", topic: "harm", staffAns: staff, play: { m: H.midi(sounds), pure: true }, playLabel: "Play the harmonic" });
    }
    return H.mc(`Natural harmonic on the ${x.name.toLowerCase()}'s ${x.s[i][0]} string (${ROM[i]}). What pitch sounds?`, H.nm(sounds), [],
      `This is ${h.id === "oct" ? "an" : "a"} ${h.name}: it ${h.what} (${x.s[i]} → ${H.nm(sounds)}).${h.circle ? "" : " Notice the pattern: as the touched note steps down P5 → P4 → M3 → m3, the sounding pitches climb the harmonic series."}`,
      { big: x.name, kicker: "Natural harmonics", topic: "harm", picker: { octaves: [2, 3, 4, 5, 6, 7] }, staff, play: { m: H.midi(sounds), pure: true }, playLabel: "Play the harmonic" });
  }

  const fromFacts = (H, list, kicker, topic) => { const f = H.rnd(list); return H.mc(f.q, f.a, f.w, f.why, { kicker, topic }); };
  const fromTech = (H, topicFilter) => { const pool = TECH.filter(t => !topicFilter || topicFilter.includes(t[0])); const [t, q, a, w, why] = H.rnd(pool); return H.mc(q, a, w, why, { kicker: { bow: "Bowing", color: "Colors & effects", div: "Section indications", harm: "Harmonics" }[t], topic: "tech" }); };

  return {
    key: "orch-strings",
    modes: [
      { id: "inst", kicker: "The instruments" }, { id: "open", kicker: "Open strings" }, { id: "harm", kicker: "Harmonics" }, { id: "tech", kicker: "Bowing & effects" },
    ],
    make(mode, H) {
      if (mode === "inst") return Math.random() < .7 ? fromFacts(H, facts("inst"), "The instruments", "inst") : fromFacts(H, facts("nums"), "Strings & positions", "inst");
      if (mode === "open") return openQ(H);
      if (mode === "harm") return Math.random() < .8 ? harmQ(H) : fromTech(H, ["harm"]);
      return fromTech(H, ["bow", "color", "div"]);
    },
    reference(H, esc) {
      const rows = INS.map(x => `<tr><th scope="row">${x.name}</th><td data-label="Clef">${clefName(x.clef)}</td>${x.s.map((s, k) => `<td data-label="${ROM[k]}">${s}</td>`).join("")}</tr>`).join("");
      const hr = HARM.map(h => `<tr><th scope="row">${esc(h.short)}</th><td data-label="Sounds">${esc(h.what)}</td></tr>`).join("");
      return `<div class="table-wrap"><table class="ref"><caption>Open strings (sounding pitch)</caption><thead><tr><th scope="col">Instrument</th><th scope="col">Clef</th><th scope="col">I</th><th scope="col">II</th><th scope="col">III</th><th scope="col">IV</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="legend">The contrabass is written an octave higher than it sounds. Violin, viola and cello are tuned in fifths; the bass in fourths.</p>
      <div class="table-wrap"><table class="ref"><caption>Natural harmonics</caption><thead><tr><th scope="col">Touch</th><th scope="col">Sounds</th></tr></thead><tbody>${hr}</tbody></table></div>
      <p class="legend">Octave harmonics are notated with a circle; the others with a diamond at the touched note. Artificial harmonics: a normal stopped note plus a diamond; the touch-P4 sounds two octaves above the stopped note. Touch-M6 gives the same pitch as touch-M3.</p>`;
    },
  };
})();
