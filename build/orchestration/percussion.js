window.FAM = (() => {
  const F = (q, a, w, why) => ({ q, a, w, why });
  // name, pitched?, material, how it's played
  const INS = [
    ["Timpani", "pitched", "membrane (drum)", "struck"], ["Snare drum", "non-pitched", "membrane (drum)", "struck"], ["Bass drum", "non-pitched", "membrane (drum)", "struck"],
    ["Tom-toms", "non-pitched", "membrane (drum)", "struck"], ["Bongos", "non-pitched", "membrane (drum)", "struck"], ["Congas", "non-pitched", "membrane (drum)", "struck"],
    ["Timbales", "non-pitched", "membrane (drum)", "struck"], ["Roto-toms", "pitched", "membrane (drum)", "struck"],
    ["Xylophone", "pitched", "wood", "struck"], ["Marimba", "pitched", "wood", "struck"], ["Vibraphone", "pitched", "metal", "struck"],
    ["Glockenspiel", "pitched", "metal", "struck"], ["Crotales", "pitched", "metal", "struck"], ["Chimes (tubular bells)", "pitched", "metal", "struck"], ["Almglocken", "pitched", "metal", "struck"],
    ["Crash cymbals", "non-pitched", "metal", "struck"], ["Suspended cymbal", "non-pitched", "metal", "struck"], ["Tam-tam", "non-pitched", "metal", "struck"], ["Triangle", "non-pitched", "metal", "struck"],
    ["Cowbell", "non-pitched", "metal", "struck"], ["Brake drum", "non-pitched", "metal", "struck"], ["Anvil", "non-pitched", "metal", "struck"],
    ["Woodblock", "non-pitched", "wood", "struck"], ["Temple blocks", "non-pitched", "wood", "struck"], ["Claves", "non-pitched", "wood", "struck"], ["Slapstick (whip)", "non-pitched", "wood", "struck"], ["Castanets", "non-pitched", "wood", "struck"],
    ["Maracas", "non-pitched", "gourd/seeds", "shaken"], ["Cabasa", "non-pitched", "gourd/beads", "shaken"], ["Shekere", "non-pitched", "gourd/beads", "shaken"], ["Tambourine", "non-pitched", "membrane (drum)", "shaken or struck"],
    ["Rainstick", "non-pitched", "wood", "turned over"], ["Guiro", "non-pitched", "gourd/beads", "scraped"], ["Washboard", "non-pitched", "metal", "scraped"], ["Sandblocks", "non-pitched", "wood", "rubbed"],
    ["Ratchet", "non-pitched", "wood", "cranked"], ["Wind machine", "non-pitched", "other", "cranked"], ["Thundersheet", "non-pitched", "metal", "shaken"], ["Flexatone", "pitched", "metal", "shaken"],
  ];
  const MATS = ["membrane (drum)", "wood", "metal", "gourd/seeds", "gourd/beads"];
  const HOWS = ["struck", "shaken", "scraped", "cranked", "rubbed"];
  const FACTS = [
    F("Which are the oldest pitched percussion instruments in the orchestra?", "timpani", ["xylophone", "chimes", "glockenspiel"], "Orchestral literature features timpani more than any other percussion instrument."),
    F("On timpani, pressing the pedal down…", "tightens the head and raises the pitch", ["loosens the head and lowers the pitch", "mutes the drum", "turns on the snares"], "Glissandos are possible by moving the pedal while playing."),
    F("Should a timpanist be asked to play other instruments too?", "no: in professional orchestras timpanists play only timpani", ["yes, always xylophone too", "yes, whatever the percussionists can't cover", "only cymbals"], "Another percussionist can be asked to play timpani instead."),
    F("Roto-toms change pitch by…", "rotating the drum's frame", ["a foot pedal", "turning off the snares", "changing sticks"], "They can't do rolled glissandos, since one hand turns the drum."),
    F("The snare drum gets its rattle from…", "wires (snares) vibrating against the bottom head", ["metal jingles in the frame", "a loose top head", "beads around the shell"], "Turn the snares off to stop sympathetic buzzing."),
    F("The default roll in orchestral and band music is…", "the closed (buzz) roll", ["the open (crush) roll", "the thumb roll", "the shake roll"], "Write “crush” for the open roll common in marching bands."),
    F("A rim shot produces…", "a very sharp attack, like a gunshot", ["a soft muffled thud", "a sustained ring", "a pitch bend"], "Most common on snare drum."),
    F("Playing a drum precisely in the center gives…", "a dark, blunt thud", ["a bright, brittle tone", "a snare buzz", "a harmonic"], "Near the edge is strident and brittle; write ord. to return."),
    F("Bongos and congas: which is higher pitched?", "bongos", ["congas", "they're the same", "it depends on the sticks"], "Never use sticks on calf-skin bongos."),
    F("The tambourine is part drum, part…", "cymbal (metal jingles)", ["woodblock", "shaker", "bell"], "Rolls can be finger, shake or thumb rolls."),
    F("Which mallet instrument first joined the orchestra?", "xylophone", ["marimba", "vibraphone", "glockenspiel"], "Biting and crisp, it can't sustain without rolls."),
    F("The marimba compared with the xylophone is…", "darker, mellower and softer", ["brighter and harder", "made of metal", "higher pitched"], "Soft mallets are needed; four-mallet technique is most developed on marimba."),
    F("What makes the vibraphone different from the xylophone and marimba?", "metal bars, a sustain pedal and a motor", ["wooden bars", "no resonators", "only one octave"], "Motor on gives an amplitude tremolo; many school vibes have broken motors."),
    F("Holding a vibraphone mallet against the bar after striking it is called…", "dead sticking", ["rolling", "pedaling", "bowing"], "Notated with an x over the stem plus instructions."),
    F("Crotales are also called…", "antique cymbals", ["finger cymbals", "temple bells", "almglocken"], "Sets usually cover one octave; the upper octave is more common."),
    F("Chimes (tubular bells) resemble…", "church bells", ["triangles", "woodblocks", "a xylophone"], "Two rows of brass tubes hang in a keyboard layout."),
    F("Crash cymbals crashed and immediately damped against the body are…", "choked", ["sizzled", "rolled", "bowed"], "Notated with staccatos or the word “choke.”"),
    F("Drawing a bass bow on the rim of a cymbal or tam-tam gives…", "an eerie, ethereal squeal with many overtones", ["a dry click", "a short crash", "no sound"], "Most effective on larger cymbals."),
    F("Which suspended-cymbal beater is best for smooth rolls?", "yarn mallets", ["wire brushes", "triangle beaters", "hammers"], "Sticks give the clearest articulation; brushes only work softly."),
    F("The instrument struck on “The Gong Show” was actually a…", "tam-tam", ["gong", "cymbal", "bell plate"], "Tam-tams are unpitched; gongs have a definite pitch."),
    F("A water gong is…", "a tam-tam lowered into water after it's struck", ["a gong filled with water", "a bowl of water struck with a mallet", "an electronic effect"], "The pitch drops as it's submerged."),
    F("Temple blocks usually come in sets of five tuned roughly to…", "a pentatonic scale", ["a chromatic scale", "a major triad", "one pitch"], "They're still treated as non-pitched."),
    F("In a drum set, the bass drum (kick) is played with…", "a foot pedal (right foot)", ["mallets", "brushes", "the left hand"], "The hi-hat pedal is the left foot."),
    F("Brake drums and anvils should usually be struck with…", "hammers", ["yarn mallets", "brushes", "fingers"], "Sticks and brass mallets get ruined quickly."),
  ];
  const PLAYING = [
    F("Why must percussion parts allow time between instruments?", "players need time to move and change implements", ["percussion must rest every bar", "instruments need retuning each time", "the conductor asks for it"], "If xylophone and snare use different sticks or sit apart, include rests."),
    F("Hard beaters compared with soft ones give…", "a more percussive, direct attack", ["a mellower attack", "no change in sound", "a longer sustain"], "Beater material, shape, size and weight all change the color."),
    F("Which is a common creative choice of implement?", "a bow on cymbal, tam-tam, vibraphone or crotales", ["a violin bow on snare drum heads", "a mute on the marimba", "a reed on a timpano"], "Others: dowels, hands on stick drums, a superball on drumheads."),
    F("A useful trick when a percussionist plays many instruments:", "put copies of the part on several stands around the setup", ["memorize the part", "play everything with one stick", "seat them in the strings"], "Including a setup diagram in the score helps too."),
    F("Sharing one instrument between several percussionists…", "causes congestion; give them separate instruments instead", ["is the standard practice", "is required for timpani", "makes the part easier"], "Multiple instruments placed around the stage also sound great."),
    F("Do percussionists prefer parts with many instruments?", "generally no, for logistical reasons", ["yes, always", "only in chamber music", "only for mallets"], "If an instrument plays only a note or two, reconsider it."),
    F("Grace notes before a drum stroke (flams, drags, ruffs) should be…", "slurred to the main note", ["accented", "played on the beat", "notated as separate notes in rhythm"], "They're played slightly before the beat."),
    F("An unmeasured roll is shown with…", "a tremolo mark (three slashes)", ["a fermata", "a slur", "a diamond notehead"], "Some scores use a trill sign."),
    F("Which articulation mark has little meaning for percussion and should be avoided?", "tenuto", ["accent", "staccato", "slur"], "Staccato means muffle soon after the attack."),
    F("To let a cymbal or tam-tam ring, write…", "l.v. (let vibrate)", ["secco", "ord.", "senza sord."], "Otherwise the note is muffled at the end of its written value."),
    F("For very short instruments (snare, claves) the notation should…", "show the attacks clearly without fussy rests", ["show exact durations with many rests", "always use whole notes", "use only rolls"], "Long-sustaining instruments get written rhythms and l.v. as needed."),
  ];
  const NOTATION = [
    F("On a multi-instrument percussion staff, where does the snare drum go?", "the third space from the bottom", ["the bottom space", "the top line", "the middle line"], "Snare: third space; bass drum: bottom space."),
    F("On a percussion staff, where does the bass drum go?", "the bottom space", ["the third space", "the top line", "below the staff"], "Higher instruments go higher on the staff."),
    F("Metal instruments on a shared percussion staff usually go…", "on the lines", ["in the spaces", "below the staff", "on separate staves"], "Drums usually take the spaces."),
    F("A set of three toms or five temple blocks should be placed…", "all on lines or all on spaces", ["alternating lines and spaces", "on one line", "on separate staves"], "Keep homogeneous groups together; higher instruments higher."),
    F("What MUST appear at the start of a multi-instrument percussion part?", "a legend (key) showing where each instrument sits", ["a tempo marking in seconds", "a list of mallet prices", "a drum-set diagram only"], "Show sizes (small, medium, large) too."),
    F("Pitched percussion (marimba, xylophone…) is written on…", "a five-line staff in treble or bass clef, or a grand staff", ["a one-line staff", "a percussion clef staff", "tablature"], "Marimba most often uses a grand staff."),
    F("Which instrument indications should be AVOIDED in percussion parts?", "pictograms of instruments and mallets", ["the instrument's name", "a legend", "x noteheads with an explanation"], "Pictograms aren't standard and are risky."),
    F("Using triangle, square or diamond noteheads for different instruments…", "should be avoided", ["is the standard practice", "is required for drum set", "is only for timpani"], "Write the instrument's name instead."),
    F("When are x noteheads clearly useful?", "for unusual techniques (rim, bell), alternate beaters, and drum-set metals", ["for every percussion note", "for pitched percussion", "for timpani rolls"], "Always explain what an x notehead means."),
    F("Drum-set notation…", "puts all instruments compactly on one staff, with a legend", ["needs one staff per drum", "is the same as timpani notation", "never shows cymbals"], "Drummers may also get only a style description to interpret."),
    F("Older scores give each percussion instrument its own staff. What is more practical?", "a single part for each player", ["one staff per instrument in the parts", "no percussion parts", "graphic notation"], "The principal assigns players when each instrument has its own line."),
  ];
  const fromList = (H, list, kicker, topic) => { const f = H.rnd(list); return H.mc(f.q, f.a, f.w, f.why, { kicker, topic }); };
  function instQ(H) {
    const k = Math.random();
    if (k < .45) return fromList(H, FACTS, "The instruments", "inst");
    const x = H.rnd(INS);
    if (k < .6) { const same = INS.filter(y => y[1] === x[1]); const diff = INS.filter(y => y[1] !== x[1]); const a = H.rnd(x[1] === "pitched" ? same : same), w = H.shuffle(diff).slice(0, 3).map(y => y[0]); return H.mc(`Which of these is ${a[1] === "pitched" ? "a pitched" : "a non-pitched"} percussion instrument?`, a[0], w, `Pitched: ${INS.filter(y => y[1] === "pitched").map(y => y[0]).join(", ")}. The line between pitched and non-pitched is often fine.`, { kicker: "Pitched or not?", topic: "inst" }); }
    if (k < .8) return H.mc(`What is the ${x[0].toLowerCase()} mainly made of (what vibrates)?`, x[2], MATS, `${x[0]}: ${x[2]}, ${x[3]}${x[1] === "pitched" ? ", pitched" : ""}.`, { kicker: "Materials", topic: "inst" });
    const y = H.rnd(INS.filter(z => z[3] !== "struck")); return H.mc(`How is the ${y[0].toLowerCase()} normally played?`, y[3], HOWS.concat(["bowed"]), `Percussion can be struck, shaken, scraped, rubbed, cranked, blown and more; most instruments allow several techniques.`, { kicker: "How it's played", topic: "inst" });
  }
  return {
    key: "orch-percussion",
    modes: [{ id: "inst", kicker: "The instruments" }, { id: "play", kicker: "Playing & logistics" }, { id: "nota", kicker: "Notation" }],
    make(mode, H) {
      if (mode === "inst") return instQ(H);
      if (mode === "play") return fromList(H, PLAYING, "Playing & logistics", "play");
      return fromList(H, NOTATION, "Notation", "nota");
    },
    reference(H, esc) {
      const rows = INS.map(x => `<tr><th scope="row">${esc(x[0])}</th><td data-label="Pitch">${x[1]}</td><td data-label="Material">${esc(x[2])}</td><td data-label="Played">${esc(x[3])}</td></tr>`).join("");
      return `<p><b>Shared staff:</b> snare drum on the third space, bass drum on the bottom space, other drums on spaces, metals on lines; higher instruments higher. Always include a legend.</p>
      <div class="table-wrap"><table class="ref"><caption>Instruments</caption><thead><tr><th scope="col">Instrument</th><th scope="col">Pitch</th><th scope="col">Material</th><th scope="col">Played</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    },
  };
})();
