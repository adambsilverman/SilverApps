window.FAM = (() => {
  const F = (q, a, w, why) => ({ q, a, w, why });
  const INST = [
    F("Which woodwinds make their sound without a reed or buzzing lips?", "the flute family", ["the oboe family", "the clarinet family", "the saxophone family"], "Air is directed across the embouchure hole, free of a mouthpiece."),
    F("“Flute” on its own means…", "the C flute", ["the alto flute", "the piccolo", "any member of the flute family"], "Piccolo and alto flute are its auxiliaries."),
    F("The most common auxiliary instrument in the orchestra is the…", "piccolo", ["English horn", "bass clarinet", "contrabassoon"], "It's virtually a half-size flute sounding an octave higher."),
    F("The piccolo's lowest written note is…", "D4", ["C4", "B3", "E4"], "The flute goes down to C4 (or B3 with a B foot)."),
    F("Where is the flute weakest?", "in its lowest register", ["in its top octave", "in the middle of the staff", "it's equally strong throughout"], "Notes in the staff or below add little to a full tutti."),
    F("Compared with other winds, the flute needs…", "more air and more breaths", ["less air than any other wind", "no breaths in long phrases", "circular breathing"], "Overlapping two flutes can make an endless line."),
    F("The oboe's dynamic shape is the inverse of the flute's: its basic volume…", "diminishes as it goes higher", ["grows as it goes higher", "is the same in every register", "is loudest at the very top"], "Its overall dynamic range is relatively limited."),
    F("What makes the oboe's sound so distinctive?", "its double reed", ["its single reed", "its conical brass body", "its wide bell"], "Oboists spend much of their lives making and adjusting reeds."),
    F("Why can an oboist sustain such long lines?", "the oboe uses far less air than normal breathing", ["the oboe has a breath reservoir", "the oboist breathes through the nose while playing", "the reed stores air"], "Players must exhale stale air as well as inhale during breaks."),
    F("The English horn is pitched…", "a perfect fifth below the oboe", ["an octave below the oboe", "a fourth below the oboe", "a major second below the oboe"], "It's neither a horn nor English; the English call it cor anglais."),
    F("The English horn's lowest written note is…", "B3", ["B♭3", "C4", "A3"], "The B♭ key would fall where the d'amore bell is."),
    F("The bulb-shaped bell of the English horn is called…", "a d'amore bell", ["a bocal", "a crook", "a bell flare"], "The metal pipe connecting reed to body is a bocal (also on bassoons)."),
    F("Clarinets have a cylindrical bore, which favors…", "the odd partials of the harmonic series", ["the even partials", "only the fundamental", "no partials at all"], "The strong 3rd partial gives the clarinet its smooth, hollow sound."),
    F("The clarinet overblows at the…", "twelfth", ["octave", "fifth", "double octave"], "Flutes, oboes, saxophones and bassoons overblow at the octave."),
    F("The clarinet's low register, from written E3 to about F4, is called the…", "chalumeau register", ["clarion register", "altissimo register", "throat register"], "Dark, rich and hollow."),
    F("The least colorful notes of the clarinet, just above the chalumeau, are the…", "throat tones", ["clarion tones", "pedal tones", "altissimo tones"], "Good players and instruments minimize this pocket."),
    F("Which woodwind can begin a note from nothing (niente) and play at the threshold of audibility?", "clarinet", ["oboe", "bassoon", "piccolo"], "Its dynamic range practically doubles that of other woodwinds except saxophones."),
    F("On the clarinet, which kind of leap is nearly impossible to slur?", "downward leaps of a 10th or more", ["upward leaps of a 10th", "any step", "octave leaps up"], "Slurring large skips upward is no problem."),
    F("Why did orchestras use clarinets in both B♭ and A?", "one for flat keys and one for sharp keys", ["one for loud and one for soft music", "one for solo and one for section playing", "to cover a wider range"], "Most professional clarinetists own both."),
    F("The saxophone is classed as a woodwind because…", "it uses a single reed", ["it is made of wood", "it has a cylindrical bore", "it has valves"], "All saxophones are made of brass."),
    F("Who invented the whole saxophone family around 1840?", "Adolphe Sax", ["Theobald Boehm", "Hector Berlioz", "Johann Denner"], "The entire family appeared at once, so it is unusually consistent."),
    F("The common saxophone quartet is…", "B♭ soprano, E♭ alto, B♭ tenor, E♭ baritone", ["E♭ sopranino, B♭ soprano, E♭ alto, B♭ bass", "C soprano, F alto, C tenor, F baritone", "B♭ alto, E♭ tenor, B♭ baritone, E♭ bass"], "B♭ bass, E♭ sopranino and E♭ contrabass are rarer."),
    F("Saxophones blend especially well with…", "brass", ["percussion", "harp", "voices only"], "In bands they bridge the woodwinds and brass."),
    F("Bassoons are…", "double-reed, conical-bore instruments", ["single-reed, cylindrical-bore instruments", "edge-tone instruments", "brass instruments with a reed"], "Less nasal and more relaxed than the oboes."),
    F("The bassoon's high register is preferably written in…", "tenor clef", ["alto clef", "treble 8vb clef", "percussion clef"], "Treble clef is becoming more common; bassoonists read bass-clef ledger lines up to B4."),
    F("The contrabassoon sounds…", "an octave lower than written", ["as written", "a fifth lower than written", "two octaves lower than written"], "It plays lower than any orchestral instrument except the piano (by one semitone)."),
    F("Which woodwind has the narrowest dynamic range?", "bassoon", ["clarinet", "saxophone", "flute"], "Its timbre is almost always attractive, adding warmth to any context."),
    F("Woodwind keys raise the pitch by…", "opening tone holes, shortening the air column", ["adding tubing", "tightening the reed", "changing the mouthpiece"], "Brass valves do the opposite: they add tubing."),
    F("All brass instruments make their sound by…", "buzzing the lips into a mouthpiece", ["vibrating a reed", "blowing across an edge", "striking the bell"], "The flaring bell amplifies the sound and helps upper partials."),
    F("Which brass instruments have proportionally more conical tubing, giving a darker sound?", "horns and tubas", ["trumpets and trombones", "trumpets and tubas", "cornets and trombones"], "Trumpets and trombones are more cylindrical."),
    F("The horn mouthpiece is…", "funnel-shaped", ["a deep cup", "a shallow cup", "a reed"], "Other brass mouthpieces have cups; shallow cups sound brighter."),
    F("All modern horn parts are written in…", "F, sounding a perfect fifth lower", ["B♭, sounding a major second lower", "C, at concert pitch", "E♭, sounding a major sixth lower"], "Bass clef is used for the lowest notes."),
    F("Horns 1 and 3 are traditionally the…", "high horns (2 and 4 are the low horns)", ["low horns", "solo horns", "stopped horns"], "The pairs come from writing two pairs of horns in different keys."),
    F("Which brass instrument is generally the most tiring to play?", "horn", ["tuba", "trombone", "euphonium"], "Orchestras often hire an assistant principal horn."),
    F("Which is arguably the loudest, most powerful orchestral instrument (organ and some percussion aside)?", "trumpet", ["horn", "trombone", "piccolo"], "A single trumpet at f in its middle-high register can always be heard."),
    F("The default trumpets today are…", "B♭ and C trumpets", ["F and E♭ trumpets", "D and A trumpets", "bass and piccolo trumpets"], "B♭ is slightly fuller, C slightly brighter."),
    F("Cornet and flugelhorn are mellower than the trumpet because…", "they have more conical tubing", ["they are made of wood", "they use a double reed", "they have no valves"], "The flugelhorn is completely conical except the valve tubing."),
    F("The trombone's slide has how many positions?", "seven, spanning a tritone", ["five, spanning a fourth", "three, spanning a minor third", "twelve, spanning an octave"], "It allows complete control of intonation and glissandos up to a tritone."),
    F("The F attachment on a trombone lowers the first-position fundamental from B♭1 to…", "F1", ["E♭1", "C1", "G1"], "It adds a third more tubing and makes the low E♭2 to C2 available."),
    F("The standard orchestral trombone section is…", "two tenor trombones and one bass trombone", ["three tenor trombones", "alto, tenor and bass trombones", "two bass trombones and a tuba"], "“Trombone” alone means tenor trombone."),
    F("Pedal tones are more effective on which brass instrument than any other?", "trombone", ["trumpet", "horn", "piccolo trumpet"], "Easier still on bass trombone than tenor."),
    F("The heart of the tuba's range is about…", "C2 to G3", ["C4 to G5", "C1 to G1", "C3 to G4"], "Its lowest octave responds slowly."),
    F("The euphonium has exactly the same range as…", "the tenor trombone", ["the horn", "the tuba", "the trumpet"], "It's sometimes called tenor tuba in orchestral scores."),
    F("Which needs the most air of the brass?", "tuba", ["trumpet", "horn", "piccolo trumpet"], "A tuba player breathes about twice as often as a trumpet or horn player."),
  ];
  const COLOR = [
    F("Which brass mute is by far the most common, and works at any dynamic?", "straight mute", ["cup mute", "Harmon mute", "plunger"], "It gives a reedy, edgy tone, especially insistent at f."),
    F("Which mute gives a darker, mellower tone that blends with woodwinds and strings?", "cup mute", ["straight mute", "Harmon mute", "solotone mute"], "The cup catches the sound after it leaves the bell."),
    F("Which mute is filled with sound-absorbing material and clips onto the bell?", "bucket mute", ["cup mute", "practice mute", "straight mute"], "It sounds like an echo, stripped of brilliance."),
    F("Which mute is held in front of the bell for “wah-wah” effects?", "plunger", ["straight mute", "bucket mute", "stopping mute"], "A plumber's helper without the handle."),
    F("The Harmon mute with the stem removed sounds…", "extremely stuffy and focused", ["bright and metallic", "exactly like open horn", "louder than open"], "“Stem in” is bright and metallic; avoid the ambiguous “stem out.”"),
    F("Which is the quietest brass mute?", "practice mute", ["cup mute", "straight mute", "hat"], "Playing loudly with it is impossible."),
    F("Which mutes are available for tuba?", "straight mutes (and practice mutes, rarely)", ["cup and Harmon mutes", "plungers and hats", "stopping mutes"], "Tuba mutes are large, heavy and slow to insert."),
    F("Horns normally use…", "a straight mute or a stopping mute", ["a plunger", "a Harmon mute", "a bucket mute"], "Other horn mutes are so rare that “mute” for horn means straight mute."),
    F("How long can it take to put a mute in securely?", "up to about 10 seconds", ["about one second", "one beat at any tempo", "no time at all"], "Changing from one mute to another takes even longer; a dropped mute is disastrous."),
    F("Stopped horn (hand fully in the bell) raises the pitch…", "a minor second, so the player fingers a half step lower", ["a fifth", "an octave", "not at all"], "It's notated normally; loud stopped horn sounds nasal and sinister."),
    F("Half-stopping (echo horn) lowers the pitch about…", "a minor second, with a distant muted sound", ["a major third", "an octave", "a quarter tone"], "The player fingers a half step higher to compensate."),
    F("“Brassy” describes…", "a harsh, strident tone possible only at f and above", ["a muted tone", "a soft, mellow tone", "playing into the stand"], "Write the word with the dynamic."),
    F("Circular breathing works by…", "breathing in through the nose while pushing air out with the cheeks", ["breathing between every note", "using a second player", "playing only short notes"], "It's a rare skill; don't assume it in standard writing."),
    F("One way to make a wind multiphonic is to…", "sing while playing", ["play with a mute", "play staccato", "use the F attachment"], "Possible on all brass, flutes and single reeds; it creates a difference tone."),
    F("Another way to make woodwind multiphonics is…", "special fingerings with controlled overblowing", ["double tonguing", "a cup mute", "playing into the stand"], "Most common on saxophones, clarinets and flutes."),
    F("A horn “rip” is a…", "fast harmonic glissando", ["stopped note", "valve trill", "flutter tongue"], "Harmonic glisses can also be slow arpeggios."),
    F("A brass lip trill is only possible where…", "the partials are a step or half step apart", ["valves are pressed", "a mute is used", "pedal tones are played"], "A wider lip tremolo is a “shake.”"),
    F("Half-step valve trills use…", "the 2nd valve", ["the 1st valve", "the 3rd valve", "all three valves"], "Whole-step valve trills use the 1st valve."),
    F("Brass instruments generally need…", "more rests than woodwinds", ["fewer rests than woodwinds", "no rests at all", "rests only at ff"], "Lip endurance matters; low and loud notes use more air."),
    F("Much of the rhythmic energy in brass writing comes from…", "repeated notes, single-, double- or triple-tongued", ["wide leaps", "trills", "glissandos only"], "Brass are less agile than woodwinds for rapid or disjunct notes."),
  ];

  const ORDER_WW = ["Piccolo", "Flutes", "Alto flute", "Oboes", "English horn", "Clarinet in E♭", "Clarinets in B♭", "Bass clarinet", "Bassoons", "Contrabassoon"];
  const ORDER_BR = ["Horns", "Piccolo trumpet", "Trumpets", "Trombones", "Bass trombone", "Tuba"];
  const ALL = ORDER_WW.concat(ORDER_BR);
  const ERAS = [
    ["Classical (18th century)", "0–2 flutes, 1–2 oboes, 0–2 bassoons, 2–4 horns, 0–2 trumpets"],
    ["Romantic (19th century)", "2 flutes, 2 oboes, 2 clarinets, 2 bassoons, 4 horns, 2 trumpets, 0–3 trombones"],
    ["Late Romantic and modern", "2–4 flutes, 2–3 oboes, 2–4 clarinets, 2–3 bassoons, 4–6 horns, 2–3 trumpets, 1–4 trombones, 1 tuba"],
  ];
  const ORDF = [
    F("In the score, woodwinds are grouped in which order (top to bottom)?", "flutes, oboes, clarinets, bassoons", ["oboes, flutes, bassoons, clarinets", "clarinets, flutes, oboes, bassoons", "flutes, clarinets, oboes, bassoons"], "Then the brass: horns, trumpets, trombones, tuba."),
    F("In an orchestral score, brass are ordered…", "horns, trumpets, trombones, tuba", ["trumpets, horns, trombones, tuba", "tuba, trombones, trumpets, horns", "trumpets, trombones, horns, tuba"], "Horns sit above trumpets even though they're lower in pitch."),
    F("When a player doubles an auxiliary (flute and piccolo), who usually plays it?", "the last-chair player (e.g. flute 3 doubles piccolo)", ["the principal player", "the second player", "a percussionist"], "Oboe 3 doubles English horn, and so on."),
    F("In a wind band score, where is the saxophone choir usually placed?", "between the woodwinds and the brass", ["above the flutes", "below the tuba", "with the percussion"], "Often AATB or SATB."),
    F("In a big band chart, the saxophone section is typically…", "AATTB, above the brass", ["SATB, below the brass", "a single alto", "AATB with the rhythm section"], "Five saxes: two altos, two tenors, baritone."),
    F("In chamber music and band scores, the horns' position…", "varies: sometimes above, sometimes below the trumpets", ["is always at the top of the score", "is always below the tuba", "is always with the woodwinds"], "In orchestral scores, horns come first in the brass."),
    F("Why must wind writing leave places to breathe?", "players must pause to inhale, which shapes phrasing and endurance", ["it doesn't: winds can sustain forever", "only to turn pages", "only in slow music"], "Unplayable passages come from ignoring breath."),
  ];
  const SLOTS = ["flutes", "oboes", "clarinets", "bassoons", "horns", "trumpets", "trombones", "tubas"];

  const fromList = (H, list, kicker, topic) => { const f = H.rnd(list); return H.mc(f.q, f.a, f.w, f.why, { kicker, topic }); };
  function orderQ(H) {
    const k = Math.random();
    if (k < .3) {
      const i = Math.floor(Math.random() * (ALL.length - 1));
      return H.mc(`In score order, which comes directly below ${ALL[i].toLowerCase()}?`, ALL[i + 1], ALL.filter((x, j) => j !== i + 1 && j !== i), `Woodwinds: ${ORDER_WW.join(" – ")}. Brass: ${ORDER_BR.join(" – ")}.`, { kicker: "Score order", topic: "order" });
    }
    if (k < .5) {
      const pick = H.shuffle(ALL).slice(0, 4), top = pick.slice().sort((a, b) => ALL.indexOf(a) - ALL.indexOf(b))[0];
      return H.mc("Which of these is listed highest in the score?", top, pick, `Auxiliary instruments sit next to their family by size: ${ORDER_WW.join(" – ")}; ${ORDER_BR.join(" – ")}.`, { kicker: "Score order", topic: "order" });
    }
    if (k < .75) {
      const nums = [H.rnd([1, 2, 3]), H.rnd([1, 2, 3]), H.rnd([0, 2, 3]), H.rnd([2, 3]), H.rnd([2, 4, 6]), H.rnd([2, 3, 4]), H.rnd([0, 2, 3]), H.rnd([0, 1])];
      const code = `${nums.slice(0, 4).join(", ")} – ${nums.slice(4).join(", ")}, timp., str.`;
      const s = Math.floor(Math.random() * 8);
      return H.mc(`In the scoring shorthand ${code}, how many ${SLOTS[s]} are there?`, String(nums[s]), [0, 1, 2, 3, 4, 6].map(String), `The numbers follow score order: flutes, oboes, clarinets, bassoons – horns, trumpets, trombones, tuba.`, { kicker: "Scoring shorthand", topic: "order" });
    }
    if (k < .88) { const e = H.rnd(ERAS); return H.mc(`Which wind and brass forces are typical of the ${e[0]} orchestra?`, e[1], ERAS.map(x => x[1]), `${ERAS.map(x => `${x[0]}: ${x[1]}`).join(". ")}.`, { kicker: "Orchestras through time", topic: "order" }); }
    return fromList(H, ORDF, "Score order", "order");
  }

  const VALVES = [["1", "a major 2nd", 2], ["2", "a minor 2nd", 1], ["3", "a minor 3rd", 3], ["1 + 2", "a minor 3rd", 3], ["2 + 3", "a major 3rd", 4], ["1 + 3", "a perfect 4th", 5], ["1 + 2 + 3", "a tritone", 6]];
  const IVS = ["a minor 2nd", "a major 2nd", "a minor 3rd", "a major 3rd", "a perfect 4th", "a tritone", "a perfect 5th"];
  // Harmonic series above C2 (partials 1–10, nearest notes)
  const PART = ["C2", "C3", "G3", "C4", "E4", "G4", "B♭4", "C5", "D5", "E5"];
  function brassQ(H) {
    const k = Math.random();
    if (k < .3) { const v = H.rnd(VALVES); return H.mc(`Pressing valve${v[0].length > 1 ? "s" : ""} ${v[0]} lowers the pitch by…`, v[1], IVS, `Valve 1 lowers a M2, valve 2 a m2, valve 3 a m3. Together: 1+2 = m3, 2+3 = M3, 1+3 = P4, 1+2+3 = tritone.`, { kicker: "Valves", topic: "brass" }); }
    if (k < .45) { const v = H.rnd(VALVES.filter(x => x[0] !== "3" && x[0] !== "1 + 2")); return H.mc(`Which valve combination lowers the pitch ${v[1]}?`, v[0], VALVES.map(x => x[0]), `Valve 1 = M2, 2 = m2, 3 = m3 (also 1+2), 2+3 = M3, 1+3 = P4, 1+2+3 = tritone.`, { kicker: "Valves", topic: "brass" }); }
    if (k < .65) {
      const v = H.rnd(VALVES), start = H.rnd([{ s: "C5", n: H.parse("C5") }, { s: "G4", n: H.parse("G4") }, { s: "E5", n: H.parse("E5") }, { s: "D5", n: H.parse("D5") }]);
      const steps = { 1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 3 }[v[2]];
      const res = H.up(start.n, -steps, -v[2]);
      const wr = [1, 2, 3, 4, 5].filter(x => x !== v[2]).map(se => H.nm(H.up(start.n, -({ 1: 1, 2: 1, 3: 2, 4: 2, 5: 3 }[se]), -se)));
      return H.mc(`A trumpet plays ${start.s} open (no valves). With valve${v[0].length > 1 ? "s" : ""} ${v[0]} down on the same partial, which written note sounds?`, H.nm(res), wr, `Valve${v[0].length > 1 ? "s" : ""} ${v[0]} lower${v[0].length > 1 ? "" : "s"} the pitch ${v[1]}: ${start.s} → ${H.nm(res)}.`, { kicker: "Valves", topic: "brass", play: { seq: [H.midi(start.n), H.midi(res)] }, playLabel: "Play both notes" });
    }
    if (k < .82) {
      const p = 2 + Math.floor(Math.random() * 8);
      const ans = PART[p - 1];
      return H.mc(`On a brass instrument whose fundamental is C2, which pitch is the ${p}${["", "st", "nd", "rd"][p] || "th"} partial?`, ans, PART.filter(x => x !== ans), `Partials above C2: ${PART.map((x, i) => `${i + 1}: ${x}`).join(", ")}. The 7th (and 11th) are nearly a quarter tone flat.`, { kicker: "The harmonic series", topic: "brass", play: { seq: PART.slice(0, p).map(x => H.midi(H.parse(x))), gap: .35, dur: .5 }, playLabel: "Play partials 1 up" });
    }
    const BF = [
      F("Brass pitch depends on two things:", "the fundamental (valves or slide) and the partial (embouchure)", ["the reed and the fingering", "the bell and the mute", "tube length only"], "Pressing the right valve doesn't guarantee the right note: the lips choose the partial."),
      F("Valves and slides lower the pitch by…", "adding tubing", ["opening tone holes", "tightening the lips", "shortening the bell"], "That's the opposite of woodwind keys."),
      F("Which partials are nearly a quarter tone flat?", "the 7th and 11th", ["the 2nd and 4th", "the 3rd and 6th", "the 5th and 10th"], "Trumpets and trombones rarely play above the 10th partial."),
      F("The modern trumpet responds most comfortably to partials…", "3 through 8", ["1 through 3", "8 through 16", "only the fundamental"], "The horn's core uses higher partials, which are closer together, so horn players miss more notes."),
      F("Why can't brass use “harmonics” as a color the way strings do?", "every brass note already is a partial of the harmonic series", ["brass can't play high", "the bell blocks them", "mutes prevent them"], "Adding tubing changes the color very little."),
      F("Large leaps on brass instruments are…", "substantially harder than on other instruments", ["easier than steps", "the same as on woodwinds", "impossible"], "The lips must find each new partial."),
      F("A trombone slide glissando is possible only…", "between positions on the same partial (up to a tritone)", ["across any interval", "with a mute", "on the F attachment only"], "Lip glisses across partials can fake larger ones."),
      F("Before valves, natural brass instruments could play…", "only the partials of one fundamental (the instrument's key)", ["every chromatic note", "only the fundamental", "only one octave"], "Players changed crooks to change key."),
    ];
    return fromList(H, BF, "How brass works", "brass");
  }

  return {
    key: "orch-winds",
    modes: [{ id: "inst", kicker: "The instruments" }, { id: "order", kicker: "Score order" }, { id: "brass", kicker: "How brass works" }, { id: "color", kicker: "Mutes & techniques" }],
    make(mode, H) {
      if (mode === "inst") return fromList(H, INST, "The instruments", "inst");
      if (mode === "order") return orderQ(H);
      if (mode === "brass") return brassQ(H);
      return fromList(H, COLOR, "Mutes & techniques", "color");
    },
    reference(H, esc, accHTML) {
      const vr = VALVES.map(v => `<tr><th scope="row">${v[0]}</th><td data-label="Lowers by">${v[1]}</td></tr>`).join("");
      const er = ERAS.map(e => `<tr><th scope="row">${e[0]}</th><td data-label="Winds and brass">${e[1]}</td></tr>`).join("");
      return `<p><b>Score order.</b> ${accHTML(ORDER_WW.join(" – "))}; ${ORDER_BR.join(" – ")}.</p>
      <p class="legend">Shorthand lists flutes, oboes, clarinets, bassoons – horns, trumpets, trombones, tuba: e.g. 2, 2, 2, 2 – 4, 2, 3, 1, timp., str.</p>
      <div class="table-wrap"><table class="ref"><caption>Valves</caption><thead><tr><th scope="col">Valves</th><th scope="col">Lowers by</th></tr></thead><tbody>${vr}</tbody></table></div>
      <div class="table-wrap"><table class="ref"><caption>Winds and brass through time</caption><thead><tr><th scope="col">Orchestra</th><th scope="col">Winds and brass</th></tr></thead><tbody>${er}</tbody></table></div>`;
    },
  };
})();
