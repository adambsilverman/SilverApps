
window.FAM = (() => {
  // ===== Contemporary rhythmic approaches (from Adam Silverman's Composition II supplement "Rhythm and Meter"). Engine: build/harmony/engine.js =====
  const P = "B4", P2 = "E4";
  const tokN = (x, p) => { const rest = /r/.test(x), tie = /~/.test(x), tu = (/t(\d)/.exec(x) || [])[1], d = x.replace(/[r~]|t\d/g, ""); return Object.assign({ k: rest ? [] : [p || P], d, tie }, tu ? { tu: "g" + tu } : {}); };
  // percussion rhythm: bars are strings of tokens, or { r: "tokens", r2: "second voice", time, groups }
  const rh = (time, bars, o = {}) => ({ type: "score", clefs: ["percussion"], time, vf: "C", sig: {}, bpm: o.bpm || 96, final: o.final, groups: o.groups, minBar: o.minBar || 120, bars: bars.map(b => typeof b === "string" ? { t: [b.split(" ").map(x => tokN(x))] } : Object.assign({ t: [b.r.split(" ").map(x => tokN(x)), ...(b.r2 ? [b.r2.split(" ").map(x => tokN(x, P2))] : [])] }, b.time ? { time: b.time } : {}, b.groups ? { groups: b.groups } : {})) });
  const fig = (U, sp, cap, o) => U.fig(sp, cap, Object.assign({ small: true, play: window.__harm ? window.__harm.H.withClick(sp) : null, playLabel: "Play with the beat" }, o || {}));
  const gcd = (a, b) => b ? gcd(b, a % b) : a, lcm = (a, b) => a * b / gcd(a, b);
  // note values in quarter notes, for metric modulation
  const NV = [["whole note", 4], ["dotted half", 3], ["half note", 2], ["dotted quarter", 1.5], ["quarter", 1], ["triplet quarter", 2 / 3], ["dotted eighth", .75], ["eighth", .5], ["triplet eighth", 1 / 3], ["sixteenth", .25], ["quintuplet sixteenth", .2], ["five sixteenths", 1.25], ["three eighths", 1.5]];
  const newTempo = (old, a, b) => old * b / a;
  const FR = { "0.2": "⅕", "0.25": "¼", "0.333": "⅓", "0.5": "½", "0.667": "⅔", "0.75": "¾", "1.25": "1¼", "1.5": "1½" };
  const r1 = x => FR[String(Math.round(x * 1000) / 1000)] || String(Math.round(x * 10) / 10);
  const tbl = (cap, head, rows) => `<div class="ltable-wrap" tabindex="0" role="region" aria-label="${cap}"><table class="ltable"><caption>${cap}</caption><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;

  const F = {
    concept: [
      ["In Messiaen's “Liturgy of Crystal” (Quartet for the End of Time), the instruments…", "each seem to move at their own pace", ["play in strict unison", "follow a constant 4/4 backbeat", "improvise freely with no score"], "Listen for what, if anything, coordinates them, and where you hear downbeats."],
      ["A propulsive beat helps listeners…", "follow complex rhythms, because the steady pulse is easy to hear", ["ignore the rhythm", "hear only the harmony", "tell the meter is free"], "Bartók's String Quartet No. 2 (II) groups small 2/4 bars into phrases of different lengths over constant eighth notes."],
      ["An unbalanced (asymmetrical) meter such as 5/8…", "combines beats of different lengths, like 2 + 3 eighths", ["has five equal beats", "is always compound", "can't be conducted"], "Beats of two and three eighths mix simple and compound feel."],
      ["Metric modulation changes tempo by…", "making a note value in the old tempo equal a different note value in the new one", ["slowing down gradually", "changing key", "switching instruments"], "Elliott Carter is especially known for it."],
      ["Additive rhythm means…", "rhythms built from units of different lengths, so gestures keep changing length", ["every bar has the same rhythm", "notes are removed one at a time", "the tempo doubles"], "It can appear as changing time signatures or within one time signature."],
      ["A polyrhythm is…", "two or more rhythmic paces at the same time", ["a rhythm played by many instruments in unison", "a change of meter", "a very fast tempo"], "Tuplets (3 against 2) and layered ostinati of different lengths both create them."],
      ["In Silverman's Pounding Fists, ostinati of 2 beats, 4 beats, 5 eighths, 3 eighths and 5 sixteenths…", "repeat at different lengths over a shared sixteenth-note grid, so their alignment keeps changing", ["all start and stop together every bar", "use different tempos", "are improvised"], "They realign only after the least common multiple of their lengths."],
      ["Messiaen left the meter of “Dance of Fury, for the Seven Trumpets” unnotated because…", "its bars mix simple and compound beats and beats of five sixteenths", ["it's in strict 4/4", "it was improvised", "it has no rhythm"], "The music is all in octaves and unisons, so rhythm carries everything."],
      ["Stravinsky's The Rite of Spring is famous for…", "constantly changing meters and shifting accents", ["a steady waltz meter", "twelve-tone rows", "metric modulation"], "Many of its dances change time signature almost every bar."],
    ],
  };
  const GROUPS = { "5/8": ["2+3", "3+2"], "7/8": ["2+2+3", "2+3+2", "3+2+2"], "8/8": ["3+3+2", "3+2+3", "2+3+3"], "9/8": ["2+2+2+3", "3+3+3", "2+3+2+2"], "11/8": ["3+3+3+2", "2+2+3+2+2"] };
  const GEN = {
    meter: H => {
      if (Math.random() < .5) { const ts = H.rnd(Object.keys(GROUPS)), g = H.rnd(GROUPS[ts]), n = +ts.split("/")[0];
        const bad = [[n - 1, g.split("+").slice(1).join("+")], [n + 1, g + "+1"]].map(([, x]) => x).concat(g.split("+").map(Number).map(x => x + 1).join("+"));
        return H.mc(`Which grouping of eighth notes fits a bar of ${ts}?`, g, bad.concat(Object.values(GROUPS).flat().filter(x => x.split("+").reduce((a, b) => a + +b, 0) !== n)), `${g} adds up to ${n} eighths.`); }
      const m = H.rnd([["2/4", "simple"], ["3/4", "simple"], ["6/8", "compound"], ["9/8", "compound"], ["12/8", "compound"], ["5/8", "unbalanced (asymmetrical)"], ["7/8", "unbalanced (asymmetrical)"], ["11/8", "unbalanced (asymmetrical)"], ["4/4", "simple"]]);
      return H.mc(`What kind of meter is ${m[0]}?`, m[1], ["simple", "compound", "unbalanced (asymmetrical)"], m[1] === "simple" ? "Its beats divide in two." : m[1] === "compound" ? "Its beats are dotted, dividing in three." : "Its beats are a mix of two- and three-eighth lengths.", { order: "keep" });
    },
    mod: H => {
      const pairs = [["quarter", "dotted quarter"], ["triplet eighth", "eighth"], ["eighth", "triplet eighth"], ["dotted quarter", "quarter"], ["quarter", "half note"], ["five sixteenths", "quarter"], ["sixteenth", "quintuplet sixteenth"], ["triplet quarter", "quarter"], ["dotted eighth", "eighth"]];
      const [an, bn] = H.rnd(pairs), a = NV.find(x => x[0] === an)[1], b = NV.find(x => x[0] === bn)[1];
      let old; do { old = H.rnd([60, 72, 80, 84, 90, 96, 100, 108, 112, 120, 132, 144]); } while (Math.abs(newTempo(old, a, b) - Math.round(newTempo(old, a, b))) > 1e-9);
      const n = Math.round(newTempo(old, a, b));
      return H.mc(`Tempo: quarter = ${old}. The ${an} of this tempo becomes the ${bn} of the next. What is the new quarter-note tempo?`, `quarter = ${n}`, [Math.round(old * a / b), old, Math.round(old * 1.5), Math.round(old * 2 / 3), Math.round(n / 2), n * 2].filter(x => x !== n).map(x => `quarter = ${x}`), `New tempo = old tempo × (new value ÷ old value), with values measured in quarter notes: ${old} × ${r1(b)} ÷ ${r1(a)} = ${n}.`);
    },
    poly: H => {
      if (Math.random() < .5) { const a = H.rnd([2, 3, 4, 5, 6]), b = H.rnd([3, 4, 5, 7, 8].filter(x => x !== a && gcd(x, a) < Math.min(x, a))), l = lcm(a, b);
        return H.mc(`Two ostinati share a sixteenth-note grid. One repeats every ${a} sixteenths, the other every ${b}. After how many sixteenths do they line up again?`, l, [a + b, a * b === l ? l + a : a * b, Math.max(a, b) * 2, l - Math.min(a, b)].filter(x => x !== l), `The least common multiple of ${a} and ${b} is ${l}.`); }
      const [x, y] = H.rnd([[3, 2], [2, 3], [3, 4], [4, 3], [5, 4], [5, 2]]);
      return H.mc(`In a ${x}:${y} polyrhythm, one layer plays ${x} evenly spaced notes against the other's ${y}. How many times do the two layers attack together in each cycle?`, "once, at the start", ["every note", `${x} times`, `${y} times`], `${x} and ${y} share no common factor, so the attacks coincide only on the first beat of each cycle.`);
    },
  };

  const lesson = { steps: [
    { title: "Beyond the steady bar", kick: "Rhythm as a composer's material", render: () => `<p>Plenty of contemporary concert music has ordinary rhythm. But many composers build a piece's character from rhythm itself: how players coordinate, how beats are grouped, how tempo changes, how several paces sound at once.</p>
      <p>This lesson walks through six approaches, each with pieces to hear: music that seems free, a propulsive beat, unbalanced and changing meters, metric modulation, additive rhythm, and polyrhythm.</p>` },
    { title: "Free or loosely coordinated", kick: "Each player at their own pace", render: () => `<p>Sometimes the instruments seem to move independently, or the notation gives only loose guidance about timing.</p>
      <ul><li><b>Messiaen, <i>Quartet for the End of Time</i>, I. “Liturgy of Crystal”</b>: each instrument seems to keep its own pace. As you listen with the score: what coordinates the music? Do the instruments line up with the meter, or with each other? Where do you hear downbeats?</li>
      <li><b>Aleksandra Vrebalov, <i>My Desert, My Rose</i></b>: the players coordinate by reading the score until rehearsal letter T (about 4:41 in the recording), where the music settles into a steady 7/8.</li></ul>` },
    { title: "A propulsive beat", kick: "Groove makes complexity audible", render: (H, k, U) => `<p>A strong, persistent pulse makes complicated rhythm easy to follow, in classical music as in rock and jazz. In the second movement of <b>Bartók's String Quartet No. 2</b>, short 2/4 bars combine into phrases of different lengths over a constant stream of eighth notes.</p>`
      + fig(U, rh("2/4", ["8 8 8 8", "8 8 8 8", "8 8 8 8", "8 8 8 8", "8 8 8 8"], { bpm: 132 }), "Constant eighths in 2/4. Group the bars 2 + 3 and the phrase lengths change while the pulse doesn't.") },
    { title: "Unbalanced and changing meters", kick: "5/8, 7/8 and constant change", render: (H, k, U) => `<p>Traditional meters are <b>simple</b> (beats divide in two) or <b>compound</b> (beats divide in three). <b>Unbalanced</b> meters mix the two: 5/8 is one two-eighth beat and one three-eighth beat, in either order.</p>`
      + fig(U, rh("5/8", [{ r: "8 8 8 8 8", groups: ["2/8", "3/8"] }, { r: "8 8 8 8 8", groups: ["3/8", "2/8"] }, { r: "8 8 8 8 8 8 8", time: "7/8", groups: ["2/8", "2/8", "3/8"] }], { bpm: 120 }), "5/8 as 2 + 3, then 3 + 2; 7/8 as 2 + 2 + 3. The beams show the beats.")
      + `<ul><li><b>Messiaen, <i>Quartet for the End of Time</i>, VI. “Dance of Fury, for the Seven Trumpets”</b>: all octaves and unisons. Bars mix simple and compound beats, some beats last five sixteenths, and Messiaen didn't write a meter at all.</li>
      <li><b>A consistent uncommon meter</b> can sound fresh and unpredictable: Reich's <i>Eight Lines</i>.</li>
      <li><b>Constantly changing meters</b>: Reich's <i>Proverb</i>, Stravinsky's <i>The Rite of Spring</i> and Bartók's <i>Mikrokosmos</i> No. 140, “Free Variations.”</li></ul>` },
    { title: "Metric modulation", kick: "Changing tempo exactly", render: () => `<p><b>Metric modulation</b> moves to a new tempo by making a note value in the old tempo equal a <i>different</i> note value in the new one. If a triplet eighth at quarter = 120 becomes the new plain eighth, every eighth now lasts as long as a triplet eighth did, and the quarter-note tempo jumps to 180.</p>
      <p class="note">New tempo = old tempo × (new value ÷ old value), measuring both values in quarter notes. Triplet eighth = ⅓, eighth = ½: 120 × ½ ÷ ⅓ = 180.</p>
      <p><b>Elliott Carter</b> (1908–2012) is known for metric modulation layered on already complex rhythm. In <i>Shard</i> for solo guitar, bar 5 turns a sixteenth note of the old tempo into one note of a triplet in the new; in bar 17, five sixteenths become the new quarter-note pulse, so the tempo becomes four-fifths of what it was.</p>
      <div class="mmcalc" role="group" aria-label="Metric modulation calculator">
        <label>Old tempo (quarter =) <input type="number" id="mmOld" value="120" min="20" max="400"></label>
        <label>This value in the old tempo <select id="mmA">${NV.map(([n], i) => `<option value="${i}" ${n === "triplet eighth" ? "selected" : ""}>${n}</option>`).join("")}</select></label>
        <label>becomes this value in the new <select id="mmB">${NV.map(([n], i) => `<option value="${i}" ${n === "eighth" ? "selected" : ""}>${n}</option>`).join("")}</select></label>
        <p class="mmout" id="mmOut" role="status" aria-live="polite"></p></div>`,
      after: root => { const o = root.querySelector("#mmOld"), a = root.querySelector("#mmA"), b = root.querySelector("#mmB"), out = root.querySelector("#mmOut");
        const go = () => { const old = +o.value || 0, A = NV[+a.value], B = NV[+b.value], n = newTempo(old, A[1], B[1]); out.textContent = old > 0 ? `New tempo: quarter = ${Math.round(n * 10) / 10}  (${old} × ${r1(B[1])} ÷ ${r1(A[1])})` : "Enter the old tempo."; };
        [o, a, b].forEach(e => e.addEventListener("input", go)); go(); } },
    { title: "Additive rhythm", kick: "Gestures of changing length", render: (H, k, U) => `<p>In <b>additive rhythm</b>, short units of different lengths are strung together, so the length of each gesture keeps changing. It can show up as changing time signatures or inside a single time signature. Jacob ter Veldhuis's <i>Caterpillar</i> is one example.</p>`
      + fig(U, rh("3/8", [{ r: "8 8 8", groups: ["3/8"] }, { r: "8 8 8 8", time: "4/8", groups: ["4/8"] }, { r: "8 8 8 8 8", time: "5/8", groups: ["5/8"] }, { r: "8 8 8", time: "3/8", groups: ["3/8"] }, { r: "8 8 8 8 8", time: "5/8", groups: ["5/8"] }], { bpm: 152 }), "Gestures of 3, 4, 5, 3 and 5 eighths: each bar is one gesture, so the meter changes with it.") },
    { title: "Polyrhythm", kick: "Several paces at once", render: (H, k, U) => `<p>A <b>polyrhythm</b> sets two or more paces against each other.</p>
      <ul><li><b>Tuplets:</b> in the second movement of Ives's <i>Trio</i> (about 6:22), triplets in the cello and the pianist's right hand sound against sextuplets and septuplets in the other parts.</li>
      <li><b>Layered ostinati on a shared grid:</b> from bar 5 of Adam Silverman's <i>Pounding Fists</i>, percussion ostinati of different lengths repeat over the same sixteenth-note grid, so their alignment keeps shifting.</li></ul>`
      + tbl("Pounding Fists, from bar 5: ostinato lengths", ["Instrument", "Repeats every", "In sixteenths"], [["Triangle", "2 beats", "8"], ["Bell tree", "4 beats", "16"], ["Glockenspiel", "5 eighths", "10"], ["Two vibraphones", "3 eighths", "6"], ["Two marimbas", "5 sixteenths", "5"]])
      + `<p>All five line up again only after the least common multiple of 8, 16, 10, 6 and 5: 240 sixteenths, or 60 beats. Until then every bar brings a new combination.</p>`
      + fig(U, rh("2/4", [{ r: "qt1 qt1 qt1", r2: "q q" }, { r: "qt1 qt1 qt1", r2: "q q" }], { bpm: 72 }), "Three against two: triplet quarters on top, plain quarters below.") },
    { title: "Using these approaches", kick: "In your own music", render: () => `<ul><li>Write a passage where each player repeats a figure at their own speed, cued from the score, then lock everyone into one meter for contrast, as Vrebalov does.</li>
      <li>Keep a constant stream of eighths and vary only how the bars group them.</li>
      <li>Pick an unbalanced meter and change its grouping (2 + 2 + 3, then 3 + 2 + 2) without changing the time signature.</li>
      <li>Plan a metric modulation with the calculator, and write the bar before it so the new pulse is already audible.</li>
      <li>Layer ostinati of different lengths on one grid; work out when they realign and make that moment matter.</li></ul>
      <p>The <a href="process-lab.html">Minimalist Process Lab</a> and <a href="groove-maker.html">Groove Maker</a> are handy for trying layered loops and odd meters. For score excerpts and recordings of the pieces here, see Dr. Silverman's post <a href="https://adambsilverman.com/2019/01/composition-ii-rhythm-and-meter/" target="_blank" rel="noopener">Composition II – Rhythm and Meter</a>.</p>` },
    { title: "Quick check", kick: "Before the drills", render: H => F.concept.slice(2, 6).map(([q, a, w, y]) => H.check(q, a, w, y)).join("") },
  ] };
  function make(mode, H) { if (GEN[mode]) return GEN[mode](H); const [q, a, w, y] = H.rnd(F.concept); return H.mc(q, a, w, y); }
  const reference = () => `<ul><li><b>Free or loose coordination:</b> players at their own pace (Messiaen, “Liturgy of Crystal”; Vrebalov, <i>My Desert, My Rose</i>).</li><li><b>Propulsive beat:</b> constant pulse, changing phrase lengths (Bartók, Quartet No. 2, II).</li><li><b>Unbalanced meters:</b> 5/8 = 2+3 or 3+2; 7/8 = 2+2+3 etc. <b>Changing meters:</b> Stravinsky, Reich, Bartók.</li><li><b>Metric modulation:</b> new tempo = old × (new value ÷ old value), values in quarter notes (Carter).</li><li><b>Additive rhythm:</b> units of different lengths strung together.</li><li><b>Polyrhythm:</b> tuplets (3:2) or ostinati of different lengths; they realign after the least common multiple.</li></ul>`;
  return { key: "silverapps-contemprhythm-v1", lesson, make, reference, modes: [{ id: "meter", kicker: "Meters" }, { id: "mod", kicker: "Metric modulation" }, { id: "poly", kicker: "Polyrhythm" }, { id: "concept", kicker: "Approaches and pieces" }], topics: [] };
})();
// ===== Test yourself quiz (engine adds it as the step before Practice; s = step to look back at) =====
window.FAM.quiz = [
  {"s": 2, "q": "In Messiaen's “Liturgy of Crystal,” what's the rhythmic effect?", "a": "the instruments seem to move at their own paces", "w": ["everyone plays a strict march rhythm", "the music stops every bar", "only one instrument plays"], "hint": "Listen for what coordinates the players.", "why": "Each part keeps its own pace, so downbeats are hard to locate."},
  {"s": 2, "q": "In Vrebalov's My Desert, My Rose, what happens at rehearsal letter T?", "a": "loose coordination gives way to a steady 7/8", "w": ["the players start improvising", "the tempo halves", "the music modulates to a new key"], "hint": "From free to fixed.", "why": "Until T the players coordinate by reading the score; then the music locks into 7/8."},
  {"s": 3, "q": "In Bartók's String Quartet No. 2 (II), what stays constant while the phrase lengths change?", "a": "a stream of eighth notes in short 2/4 bars", "w": ["the harmony", "a 7/8 meter", "a drone"], "hint": "It's the propulsive part.", "why": "Small 2/4 bars group into phrases of different lengths over steady eighths."},
  {"s": 4, "q": "Which grouping fits a bar of 7/8?", "a": "2 + 2 + 3", "w": ["3 + 3", "2 + 2 + 2 + 2", "3 + 3 + 3"], "hint": "The groups must add up to 7.", "why": "2 + 2 + 3 = 7 eighths; so do 2 + 3 + 2 and 3 + 2 + 2."},
  {"s": 5, "q": "Quarter = 120. The triplet eighth becomes the new eighth. What's the new tempo?", "a": "quarter = 180", "w": ["quarter = 80", "quarter = 240", "quarter = 120"], "hint": "New = old × (new value ÷ old value), in quarter notes.", "why": "120 × ½ ÷ ⅓ = 180."},
  {"s": 5, "q": "In Carter's Shard, five sixteenths become the new quarter. The new tempo is…", "a": "four-fifths of the old tempo", "w": ["five-fourths of the old tempo", "twice the old tempo", "the same tempo"], "hint": "The new beat is longer than the old one.", "why": "Old × 1 ÷ 1¼ = old × ⅘."},
  {"s": 6, "q": "Additive rhythm builds music from…", "a": "units of different lengths, so gestures keep changing length", "w": ["one repeated bar", "notes that always fall on the beat", "gradually slower tempos"], "hint": "Think 3 + 4 + 5 + 3…", "why": "It can appear as changing meters or inside one meter."},
  {"s": 7, "q": "Ostinati of 6 and 10 sixteenths start together. When do they line up again?", "a": "after 30 sixteenths", "w": ["after 16 sixteenths", "after 60 sixteenths", "after 20 sixteenths"], "hint": "Least common multiple.", "why": "LCM(6, 10) = 30."},
  {"s": 7, "q": "In Pounding Fists, why does the percussion texture keep changing even though every part repeats?", "a": "the ostinati have different lengths, so their alignment shifts", "w": ["each player improvises", "the tempo changes every bar", "the meter changes every bar"], "hint": "2 beats, 4 beats, 5 eighths, 3 eighths, 5 sixteenths.", "why": "They all realign only after 240 sixteenths."},
];
