window.FAM = (() => {
  // ===== Harmonic Succession (functions, progression, structural vs. embellishing chords). Engine: build/harmony/engine.js =====
  const FN = { T: "Tonic", PD: "Pre-dominant", D: "Dominant" };
  // chord tokens with their function (unambiguous ones only)
  const FUNC = {
    major: [["1", "T"], ["16", "T"], ["2", "PD"], ["26", "PD"], ["27", "PD"], ["265", "PD"], ["4", "PD"], ["46", "PD"], ["5", "D"], ["57", "D"], ["565", "D"], ["543", "D"], ["56", "D"], ["76", "D"], ["765", "D"]],
    minor: [["1", "T"], ["16", "T"], ["26", "PD"], ["265", "PD"], ["27", "PD"], ["4", "PD"], ["46", "PD"], ["5", "D"], ["57", "D"], ["565", "D"], ["542", "D"], ["77", "D"], ["765", "D"], ["76", "D"]],
  };
  // chart positions: I 0, iii 1, vi 2, IV/ii 3, V/vii° 4
  const PROG = [["1", "4"], ["1", "6"], ["1", "5"], ["1", "2"], ["3", "6"], ["6", "2"], ["6", "4"], ["6", "5"], ["4", "2"], ["4", "5"], ["4", "7"], ["2", "5"], ["2", "7"], ["5", "1"], ["7", "1"], ["5", "6"], ["4", "1"], ["1", "3"]];
  const RETRO = [["5", "4"], ["5", "2"], ["2", "6"], ["2", "4"].slice(0, 0), ["4", "6"], ["5", "3"], ["2", "3"], ["4", "3"], ["6", "3"], ["7", "4"], ["7", "2"]].filter(x => x.length);
  const POS = { 1: 0, 3: 1, 6: 2, 4: 3, 2: 3, 5: 4, 7: 4 };
  // phrase-model templates: tokens with areas
  const AREA = {
    major: [
      [["1", "T"], ["16", "T"], ["4", "PD"], ["26", "PD"], ["164", "D"], ["57", "D"], ["1", "T"]],
      [["1", "T"], ["56", "T"], ["46", "T"], ["164", "T"], ["4", "PD"], ["2", "PD"], ["164", "D"], ["57", "D"], ["1", "T"]],
      [["1", "T"], ["6", "T"], ["2", "PD"], ["5", "D"], ["1", "T"]],
      [["1", "T"], ["4", "T"], ["16", "T"], ["543", "T"], ["1", "T"], ["26", "PD"], ["5", "D"]],
      [["1", "T"], ["6", "T"], ["4", "PD"], ["2", "PD"], ["5", "D"], ["57", "D"], ["1", "T"]],
      [["1", "T"], ["4", "PD"], ["765", "D"], ["57", "D"], ["1", "T"]],
    ],
    minor: [
      [["1", "T"], ["16", "T"], ["4", "PD"], ["26", "PD"], ["164", "D"], ["57", "D"], ["1", "T"]],
      [["1", "T"], ["6", "PD"], ["26", "PD"], ["5", "D"], ["1", "T"]],
      [["1", "T"], ["4", "T"], ["16", "T"], ["543", "T"], ["1", "T"], ["46", "PD"], ["5", "D"]],
    ],
  };
  // embellishing chords: [tokens, index of the embellishing chord, type]
  const EMB = [
    [["1", "543", "16"], 1, "passing"], [["16", "543", "1"], 1, "passing"], [["1", "76", "16"], 1, "passing"], [["4", "164", "46"], 1, "passing"],
    [["1", "56", "1"], 1, "neighbor"], [["1", "565", "1"], 1, "neighbor"], [["16", "4", "16"], 1, "neighbor"].slice(0, 0),
    [["1", "464", "1"], 1, "pedal"], [["4", "164", "57", "1"], 1, "pedal"], [["2", "164", "5"], 1, "pedal"],
    [["1", "16", "4"], 1, "arpeggiating"], [["4", "46", "5"], 1, "arpeggiating"], [["5", "56", "1"], 1, "arpeggiating"],
  ].filter(x => x.length);
  const EMBN = { passing: "Passing chord", neighbor: "Neighbor chord", pedal: "Pedal chord", arpeggiating: "Arpeggiating chord" };
  const EMBW = { passing: "its bass passes by step between two structural chords, like a harmonized passing tone", neighbor: "its bass steps away from and back to the same note, like a harmonized neighbor tone", pedal: "its bass holds (or repeats) the bass of a neighboring chord, like a harmonized pedal tone", arpeggiating: "its bass skips between members of the same harmony" };

  // succession types from chord symbols (in a random key)
  const PAT = {
    circle: [[[3, "m"], [6, "m"], [2, "m"], [5, "M"], [1, "M"]], [[1, "M"], [4, "M"], [7, "d"], [3, "m"], [6, "m"], [2, "m"], [5, "M"], [1, "M"]], [[3, "7"], [6, "7"], [2, "7"], [5, "7"], [1, "M"]], [[6, "m7"], [2, "m7"], [5, "7"], [1, "M7"]]],
    practice: [[[1, "M"], [4, "M"], [5, "M"], [1, "M"]], [[1, "M"], [2, "m"], [5, "7"], [1, "M"]], [[1, "M"], [6, "m"], [4, "M"], [5, "M"]], [[1, "M"], [4, "M"], [2, "m"], [5, "7"], [1, "M"]]],
    retro: [[[-7, "M"], [4, "M"], [1, "M"]], [[5, "M"], [4, "M"], [1, "M"]], [[1, "M"], [5, "M"], [2, "M"], [6, "M"], [3, "M"]], [[2, "m"], [6, "m"], [5, "M"], [4, "M"]]],
    stream: [[[6, "m"], [5, "M"], [4, "M"], [3, "M"]], [[1, "M"], [2, "M"], [3, "M"], [-4.5, "M"]], [[6, "M"], [5, "M"], [4, "M"], [3, "M"]], [[1, "M"], [7, "m"], [6, "m"], [5, "M"]].slice(0, 0)].filter(x => x.length),
  };
  const PATN = { circle: "Circle progression", practice: "Common-practice progression", retro: "Retrogression", stream: "Chord stream" };
  const PATW = { circle: "the roots fall by 5ths (rise by 4ths) chord after chord, around the circle of fifths.", practice: "it follows the usual T → PD → D → T pattern.", retro: "the roots move “backwards” (right to left on the progression chart), like V–IV or ♭VII–IV–I.", stream: "the chords simply follow a stepwise bass line, without progression or retrogression." };
  const patChord = (H, k, d, q) => {
    let r;
    if (d === -7) r = H.down(H.deg(k, 1), 1, 2);          // ♭VII
    else if (d === -4.5) r = H.up(H.deg(k, 1), 3, 6);     // ♯IV (whole-tone stream)
    else r = H.deg(k, d);
    return H.chord(r, q).sym;
  };

  const FACTS = [
    ["Which pattern of root motion drives most common-practice progressions?", "roots falling by 5ths (rising by 4ths)", ["roots rising by 5ths", "roots moving by half step", "roots moving by tritone"], "Moving left to right on the progression chart is mostly motion by descending 5ths."],
    ["Which chord can progress to any other chord?", "the tonic", ["the dominant", "the supertonic", "the leading-tone chord"], "The tonic begins and ends harmonic patterns."],
    ["V going to vi instead of I is called…", "a deceptive resolution", ["a retrogression", "a plagal motion", "a chord stream"], "vi is a tonic substitute."],
    ["Why is vii° less common than V?", "diminished chords are weak (no perfect 5th)", ["it has no leading tone", "it's a pre-dominant", "it can't be inverted"], "V and vii° share dominant function."],
    ["Which two pre-dominant chords can substitute for each other?", "IV and ii", ["V and vi", "I and iii", "ii and V"], "They share pre-dominant function."],
    ["The phrase model is…", "T → PD → D → (T)", ["D → PD → T", "T → D → PD", "PD → T → D"], "Tonic area, pre-dominant area, dominant area, (tonic)."],
    ["Which is the most common way to expand the dominant area?", "the cadential ⁶₄", ["the Neapolitan", "a plagal cadence", "a chord stream"], "I⁶₄ decorates V at the cadence."],
    ["The doo-wop progression is…", "I – vi – ii – V (or I – vi – IV – V)", ["I – IV – I – V", "i – ♭VII – ♭VI – V", "I – V – vi – IV"], "I–vi is a tonic prolongation, then around the circle."],
    ["The Andalusian cadence is…", "a chord stream down a tetrachord, such as i – ♭VII – ♭VI – V", ["V – I in minor", "IV – I", "ii – V – I"], "Common in flamenco, rhythm and blues, and jazz."],
    ["In rock music, a common retrogression is…", "♭VII – IV – I", ["ii – V – I", "IV – V – I", "vi – ii – V"], "The reverse path around the circle of fifths."],
    ["Which chords are usually most “structural”?", "diatonic, root-position chords on strong beats, especially at cadences", ["inverted chords on weak beats", "chromatic chords with non-chord tones", "turnaround chords"], "Key, meter, inversion, prolongation and cadence all matter."],
    ["Turnaround chords are…", "not structural", ["always structural", "the strongest chords in the phrase", "always tonic chords"], "Cadence chords are structural; turnaround chords are not."],
  ];

  function make(mode, H) {
    if (mode === "func") {
      const k = H.randKey(["major", "minor"]), [t, f] = H.rnd(FUNC[k.mode]), c = H.tok(k, t);
      return H.mc(`In ${k.label}, what function does {rn:${c.rn}} (${c.sym}) have?`, FN[f], Object.values(FN), `${f === "T" ? "Tonic chords are home: I (and its inversions)." : f === "PD" ? "ii and IV (with their inversions and sevenths) lead to the dominant." : "V and vii° (with their inversions and sevenths) lead to the tonic."}`, { kicker: "Function", topic: "func" });
    }
    if (mode === "prog") {
      const k = H.key(H.rnd(H.KEYS.major), "major"), isP = Math.random() < .5, [a, b] = H.rnd(isP ? PROG : RETRO);
      const A = H.tok(k, a), B = H.tok(k, b), ans = isP ? "Progression" : "Retrogression";
      const w = isP ? (a === "1" ? "I can move to any chord." : a === "4" && b === "1" ? "IV–I is plagal motion, a common exception." : a === "5" && b === "6" ? "V–vi is a deceptive resolution." : a === "6" && b === "5" ? "vi can work as a pre-dominant, so vi–V isn't a retrogression." : "It moves left to right on the progression chart, toward the tonic.")
        : "It moves right to left on the progression chart, away from the tonic.";
      return H.mc(`In ${k.label}: is {rn:${A.rn}} → {rn:${B.rn}} (${A.sym} → ${B.sym}) a progression or a retrogression?`, ans, ["Progression", "Retrogression"], w, { kicker: "Progression?", play: H.satbPlay((H.voiceToks(k, [a, b]) || { vs: [] }).vs), playLabel: "Play it", topic: "func" });
    }
    if (mode === "area") {
      const k = H.randKey(["major", "minor"]), tpl = H.rnd(AREA[k.mode]), i = 1 + Math.floor(Math.random() * (tpl.length - 2));
      const x = H.voiceToks(k, tpl.map(t => t[0]));
      if (!x) return null;
      const a = tpl[i][1], c = x.chords[i];
      const w = c.rn === "I64" ? (a === "D" ? "Here the I⁶₄ resolves to V: it's a cadential ⁶₄, an embellishment of the dominant." : "Here the I⁶₄ is part of a tonic expansion (a passing ⁶₄), not a cadential ⁶₄.") : a === "T" ? "It sits inside the tonic area: the music hasn't left the tonic yet." : a === "PD" ? "It leads toward the dominant." : "It belongs to the dominant area, just before the tonic (or the half cadence).";
      return H.mc(`In ${k.label}: which area of the phrase model does the highlighted chord belong to?`, FN[a] + " area", Object.values(FN).map(v => v + " area"), w + ` Areas: ${tpl.map(t => t[1]).join(" – ")}.`, { kicker: "Phrase model", staff: H.satbSpec(x, { hl: [i] }), playQ: H.satbPlay(x.vs, .85), playQLabel: "Play", topic: "struct" });
    }
    if (mode === "embel") {
      const k = H.randKey(["major", "minor"]), [toks, i, type] = H.rnd(EMB), x = H.voiceToks(k, toks);
      if (!x) return null;
      return H.mc(`In ${k.label}: what kind of embellishing chord is highlighted?`, EMBN[type], Object.values(EMBN), `It's a ${EMBN[type].toLowerCase()}: ${EMBW[type]}.`, { kicker: "Embellishing chords", staff: H.satbSpec(x, { hl: [i] }), playQ: H.satbPlay(x.vs, .85), playQLabel: "Play", topic: "struct" });
    }
    if (mode === "pattern") {
      const type = H.rnd(Object.keys(PAT)), seq = H.rnd(PAT[type]);
      const k = H.key(H.rnd(["C", "G", "D", "F", "B♭", "A", "E"]), "major");
      const syms = seq.map(([d, q]) => patChord(H, k, d, q)).map(s => `{sym:${s}}`).join(" – ");
      return H.mc(`What kind of harmonic succession is this? ${syms}`, PATN[type], Object.values(PATN), `${PATN[type]}: ${PATW[type]}`, { kicker: "Patterns", topic: "func" });
    }
    const [q, a, w, y] = H.rnd(FACTS);
    return H.mc(q, a, w, y, { kicker: "Concepts" });
  }

  function reference(H) {
    return `<div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Area</th><th scope="col">Chords</th><th scope="col">Moves to</th></tr></thead><tbody>
      <tr><td><b>Tonic (T)</b></td><td>I (expanded with I⁶, vi, iii, passing and neighbor chords)</td><td>PD or D</td></tr>
      <tr><td><b>Pre-dominant (PD)</b></td><td>IV, ii (and vi as in vi–V)</td><td>D</td></tr>
      <tr><td><b>Dominant (D)</b></td><td>V, vii° (expanded with the cadential ⁶₄)</td><td>T</td></tr></tbody></table></div>
      <p class="legend">Progression chart (major): iii → vi → IV/ii → V/vii° → I, and I can go anywhere. Exceptions: IV–I (plagal) and vi–V. Moving right to left is retrogression.</p>`;
  }

  const sf = (H, U, k, toks, cap, o) => H.satbFig(U, k, toks, cap, o);
  const lesson = { defMode: "major", steps: [
    { title: "Chord functions", kick: "Tonic, pre-dominant, dominant", keyed: "both", render: (H, k, U) => `<p>Chord <b>progression</b> (the succession from one harmony to the next) follows patterns typical of a style. In common-practice music, diatonic chords group into three <b>functions</b>:</p>
      <div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Function</th><th scope="col">In ${k.label}</th></tr></thead><tbody>
      <tr><td><b>Tonic (T)</b></td><td>{rn:${H.rnOf(k, 1)}} (home)</td></tr><tr><td><b>Pre-dominant (PD)</b></td><td>{rn:${H.rnOf(k, 4)}}, {rn:${H.rnOf(k, 2)}} (and {rn:${H.rnOf(k, 6)}} in {rn:${H.rnOf(k, 6)}}–{rn:V})</td></tr><tr><td><b>Dominant (D)</b></td><td>{rn:V}, {rn:vii°}</td></tr></tbody></table></div>
      <p>Chords that share two tones with the tonic ({rn:${H.rnOf(k, 6)}}, {rn:${H.rnOf(k, 3)}}) can extend the tonic area. In minor, chord qualities change to fit the mode, including the raised 6th and 7th degrees.</p>`
      + H.check(`In ${k.label}, what function does {rn:${H.rnOf(k, 2)}} have?`, "Pre-dominant", ["Tonic", "Dominant"], "ii (like IV) leads to the dominant.") },
    { title: "The progression chart", kick: "A solar system", render: (H) => `<p>A classic diagram of common progressions in major:</p>
      <p class="steprow" aria-label="iii to vi to IV or ii to V or vii° to I"><span>{rn:iii}</span><i>→</i><span>{rn:vi}</span><i>→</i><span>{rn:IV} / {rn:ii}</span><i>→</i><span>{rn:V} / {rn:vii°}</span><i>→</i><span class="hot">{rn:I}</span></p>
      <p>Think of it as a solar system: the tonic is the star, and the other chords are planets whose pull toward it depends on how close they are. The farther right a chord is, the stronger its tendency to move right. The tonic can go anywhere.</p>
      <ul><li>{rn:IV} and {rn:ii} share pre-dominant function and can substitute for each other; so can {rn:V} and {rn:vii°} (dominant function). Diminished chords are weak (no perfect 5th), so {rn:vii°} is much less common than {rn:V}.</li>
      <li>{rn:V} usually goes to {rn:I}, but can go to {rn:vi} instead: a <b>deceptive resolution</b>.</li>
      <li>Two common exceptions: <b>plagal motion</b> {rn:IV}–{rn:I}, and {rn:vi} used as a pre-dominant in {rn:vi}–{rn:V} (even more common: {rn:VI}–{rn:V} in minor).</li></ul>`
      + H.check("Is V → IV a progression or a retrogression?", "Retrogression", ["Progression"], "It moves right to left on the chart.") },
    { title: "The phrase model", kick: "T → PD → D → (T)", keyed: "both", render: (H, k, U) => `<p>Common-practice phrases tend to move through “areas”: <b>tonic area (T) → pre-dominant area (PD) → dominant area (D) → (T)</b>. T can move to PD or D; PD only to D; D only to T.</p>
      <div class="lfigs">${sf(H, U, k, ["1", "4", "16", "543", "1"], "<b>Tonic expansion</b>: I – IV – I⁶ – V⁴₃ – I")}${sf(H, U, k, ["4", "2", "5"], "<b>Pre-dominant expansion</b>: IV – ii, then V")}${sf(H, U, k, ["1", "26", "164", "57", "1"], "<b>Dominant expansion</b>: the cadential ⁶₄ (I⁶₄ – V⁷)")}</div>
      <p>The tonic area can change position (I–I⁶), move to a chord sharing two tones (vi or iii), or insert ornamental chords between tonics. The pre-dominant area can include IV, ii and iii, and substitutes for them (secondary chords, augmented sixths, the Neapolitan). The dominant area most often uses the cadential ⁶₄, or V–V⁷, or vii°⁶(⁵)–V⁷.</p>` },
    { title: "Circle progressions", kick: "Down by 5ths", keyed: "major", render: (H, k, U) => {
      const circ = [1, 4, 7, 3, 6, 2, 5, 1].map(d => H.diat(k, d).sym).map(s => `{sym:${s}}`).join(" – ");
      const chrom = [3, 6, 2, 5].map(d => H.chord(H.deg(k, d), "7").sym).concat([H.diat(k, 1).sym]).map(s => `{sym:${s}}`).join(" – ");
      return `<p>A <b>circle progression</b> moves counterclockwise around the circle of fifths for an extended passage: each root falls a 5th (or rises a 4th).</p>
      <p>The <b>diatonic circle</b> uses only notes of the key; a complete one passes through the diminished chord: ${circ}</p>`
      + sf(H, U, k, ["3", "6", "2", "5", "1"], "iii – vi – ii – V – I", { small: false })
      + `<p>A <b>chromatic circle</b> keeps root motion by perfect 4ths/5ths regardless of key, usually as a stream of major or dominant 7th chords: ${chrom}. Jazz bridges often run through an extended chromatic circle.</p>
      <p>The <b>doo-wop progression</b> moves along the circle too: {rn:I}–{rn:vi}–{rn:ii}–{rn:V} or {rn:I}–{rn:vi}–{rn:IV}–{rn:V}; I–vi is a tonic prolongation.</p>`;
    } },
    { title: "An analysis", kick: "Common practice in a pop song", render: (H) => `<p>Many pop songs follow common-practice principles. Here is a typical verse in C, four lines long:</p>
      <div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Line</th><th scope="col">Chords</th><th scope="col">Function</th></tr></thead><tbody>
      <tr><td>1</td><td>{sym:C} | – | {sym:F} | {sym:G}</td><td>T – PD – D</td></tr><tr><td>2</td><td>{sym:C} | – | {sym:G7} | –</td><td>T – D</td></tr>
      <tr><td>3–4</td><td>{sym:E7} | – | {sym:Am} | – | {sym:F} | {sym:G} | {sym:C} | –</td><td>a circle progression: E7 ({rn:V7/vi}) is a chromatic variant of iii, F (IV) substitutes for ii, and F–G–C is PD–D–T</td></tr></tbody></table></div>
      <p>A bridge might prolong IV ({sym:F}–{sym:Em}–{sym:F}) before a PD–D–T cadence. then the same IV-to-iii “chord stream” launches another circle progression: {sym:Em} – {sym:Am} – {sym:D7} – {sym:Dm7} – {sym:G7} (iii – vi – V⁷/V – ii⁷ – V⁷, with D7–Dm7 prolonging the pre-dominant).</p>` },
    { title: "Retrogression", kick: "Backwards around the circle", render: (H) => `<p>A <b>retrogression</b> reverses common-practice motion, moving right to left on the chart: {rn:V}–{rn:IV}, {rn:iii}–{rn:ii}, {rn:ii}–{rn:vi}. (I–V isn't one, since I can go anywhere; neither is vi–V.)</p>
      <p>In rock, retrogressions often follow the reverse path around the circle of fifths, especially {rn:♭VII}–{rn:IV}–{rn:I}. A progression can go five stops: {sym:C} – {sym:G} – {sym:D} – {sym:A} – {sym:E}.</p>
      <p>A song can use diatonic retrogressions (ii–vi by falling 4th, V–IV by step) while its strong beats follow progression principles. A well-known Baroque ground bass alternates retrogressive falling 4ths with progressive rising steps (I–V–vi–iii–IV–I–IV–V); overall it's a progression, with the second half of each pair as an embellishing chord.</p>` },
    { title: "Chord streams", kick: "Following the bass", keyed: "minor", render: (H, k, U) => {
      const and = [[1, "m"], [7, "M"], [6, "M"], [5, "M"]].map(([d, q]) => { const r = d === 5 ? H.deg(k, 5) : H.deg(k, d); return H.chord(r, q).sym; }).map(s => `{sym:${s}}`).join(" – ");
      return `<p>In some music, root-position chords simply harmonize a stepwise bass line, following neither progression nor retrogression: a <b>chord stream</b>. Harmonizations can be diatonic or chromatic (often major chords over every bass note). A rock favorite puts major chords over the notes of the natural minor scale.</p>
      <p>The <b>Andalusian cadence</b> is a chord stream down a tetrachord, such as {rn:i}–{rn:♭VII}–{rn:♭VI}–{rn:V}: ${and}. It's common in flamenco, rhythm and blues, and jazz.</p>`
        + sf(H, U, k, ["1", Object.assign(H.chord(H.deg(k, 7), "M"), { rn: "VII", deg: 0 }), "6", "5"], "i – VII – VI – V (often written ♭VII and ♭VI)", { small: false })
        + `<p>Impressionist music can keep one chord type (say, major) over roots moving along the whole-tone scale.</p>`;
    } },
    { title: "Structural or embellishing?", kick: "The harmonic skeleton", render: () => `<p>Some chords are <b>structural</b>; others <b>embellish</b> (ornament) them. Skipping over embellishing chords reveals relationships between non-consecutive chords. What makes a chord more structural:</p>
      <ul><li><b>The prevailing key:</b> diatonic chords are more structural than chromatic ones; chords with non-chord tones are weaker.</li>
      <li><b>Meter:</b> chords on strong beats (and strong bars) are more structural. Watch for syncopation and agogic accents.</li>
      <li><b>Inversion:</b> inverted chords tend to be weaker than root-position ones.</li>
      <li><b>Prolongation:</b> chords inside a larger pattern that extends one area (tonic area, dominant area) form a region bordered by a harmony. In I – V⁶ – IV⁶ – I⁶₄ – IV – ii – I⁶₄ – V⁷, the first four chords are a tonic area, the next two pre-dominant, the last two dominant: the first I⁶₄ is a tonic, the second a cadential ⁶₄.</li>
      <li><b>Cadences:</b> cadence chords are always structural; turnaround chords are not.</li></ul>` },
    { title: "Embellishing chords", kick: "Harmonized non-chord tones", keyed: "both", render: (H, k, U) => `<p>Embellishing chords share names with non-chord tones: you can think of them as non-chord tones harmonized, with a whole chord made to fit the bass.</p>
      <div class="lfigs">${sf(H, U, k, ["1", "543", "16"], "<b>Passing chord</b>: V⁴₃ between I and I⁶", { hl: [1] })}${sf(H, U, k, ["1", "56", "1"], "<b>Neighbor chord</b>: V⁶ between two tonics", { hl: [1] })}${sf(H, U, k, ["1", "16", "4"], "<b>Arpeggiating chord</b>: the bass skips within one harmony", { hl: [1] })}${sf(H, U, k, ["1", "464", "1"], "<b>Pedal chord</b>: IV⁶₄ over a held bass", { hl: [1] })}</div>
      <p>The <b>cadential ⁶₄</b> is a special pedal chord that decorates the dominant at a cadence. Root-position <b>secondary chords</b> (like V⁷/V) can also embellish the diatonic chords they lead to.</p>` },
    { title: "In context", kick: "A hymn phrase", render: () => `<p>In a typical hymn setting in F, each harmony mostly lasts a whole bar: B♭ through bar 2, F through bar 3 (changing inversion), C in bar 4. Bar 1 has three chords, but F is the strongest: on the downbeat and twice as long as the other two.</p>
      <ul><li>The only inversion, F/A in bar 3, is an <b>arpeggiating chord</b>: its bass moves between members of the same chord.</li>
      <li>The weak C7 and Dm in bar 1 form a <b>tonic prolongation</b> leading to the B♭ (IV) of bar 2, which itself connects the tonics of bars 1 and 3.</li>
      <li>So the first phrase is a three-bar tonic prolongation and a cadence on the dominant: a I–V structure. The second phrase is I–IV–V–I, its dominant expanded by a cadential ⁶₄ (F/C to C7). A later phrase has B♭/F, a <b>pedal chord</b>, inside a long tonic prolongation.</li></ul>` },
    { title: "Quick check", kick: "Before the drills", render: (H) => [FACTS[1], FACTS[5], FACTS[9], FACTS[11]].map(([q, a, w, y]) => H.check(q, a, w, y)).join("") },
  ] };

  return {
    key: "silverapps-harmsucc-v1", lesson, make, reference,
    modes: [{ id: "func", kicker: "Function" }, { id: "prog", kicker: "Progression?" }, { id: "area", kicker: "Phrase model" }, { id: "embel", kicker: "Embellishing chords" }, { id: "pattern", kicker: "Patterns" }, { id: "concepts", kicker: "Concepts" }],
    topics: [],
  };
})();
