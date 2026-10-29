window.FAM = (() => {
  // ===== Phrases and Phrase Combinations. Engine: build/harmony/engine.js =====
  const KEYS = ["C", "G", "D", "F", "B♭", "E♭", "A"];
  const dn = (H, k, i) => { const s = k.scale[H.mod(i, 7)]; return H.N(s.l, s.a, s.o + Math.floor(i / 7)); };
  const isCT = (d, i) => [0, 2, 4].includes(((i - (d - 1)) % 7 + 7) % 7);
  // harmonic plans: two chords per bar (degrees); the 4th bar is one chord
  const OPEN = [[[1, 1], [4, 1], [2, 5], [5]], [[1, 5], [1, 4], [6, 2], [5]], [[1, 4], [1, 5], [4, 2], [5]]];
  const CLOSE = [[[1, 1], [4, 1], [2, 5], [1]], [[1, 5], [1, 4], [4, 5], [1]], [[1, 4], [1, 5], [2, 5], [1]]];
  const BRIDGE = [[[6, 6], [2, 5], [4, 5], [1]], [[4, 4], [1, 6], [2, 5], [1]], [[6, 4], [5, 1], [2, 5], [1]]];
  const RH = [[1, 1, 1, 1], [2, 1, 1], [1, 1, 2], [1.5, .5, 1, 1]];
  // a melody for one phrase: bars of chords; start/end constraints; returns [{ i, q }]
  function melody(H, plan, end, seedBars) {
    for (let g = 0; g < 400; g++) {
      const notes = [], bars = seedBars ? seedBars.map(b => b.slice()) : [];
      let prev = notes.length ? notes[notes.length - 1].i : H.rnd([2, 4, 7]), ok = true;
      bars.forEach(b => b.forEach(n => { notes.push(n); prev = n.i; }));
      for (let b = bars.length; b < 4 && ok; b++) {
        if (b === 3) { // cadence bar: one whole note
          const want = end === "open" ? H.rnd([1, 4, 6]) : 0;
          let i = [want, want + 7, want - 7].sort((x, y) => Math.abs(x - prev) - Math.abs(y - prev))[0];
          if (Math.abs(i - prev) > 3) { ok = false; break; }
          notes.push({ i, q: 4, bar: b }); break;
        }
        const rh = H.rnd(RH); let t = 0;
        for (const q of rh) {
          const d = plan[b][t < 2 ? 0 : 1];
          const c = []; for (let i = -1; i <= 8; i++) if (isCT(d, i) && Math.abs(i - prev) <= 3 && (i !== prev || Math.random() < .15)) c.push(i);
          if (!c.length) { ok = false; break; }
          const w = c.flatMap(i => Array(Math.abs(i - prev) <= 2 ? 3 : 1).fill(i));
          const i = H.rnd(w); notes.push({ i, q, bar: b }); prev = i; t += q;
        }
      }
      if (!ok) continue;
      if (notes.some(n => n.i < -1 || n.i > 8)) continue;
      const hi = Math.max(...notes.map(n => n.i)); if (notes.filter(n => n.i === hi).length > 2) continue;   // one climax, more or less
      return notes;
    }
    return null;
  }
  const barsOf = notes => [0, 1, 2, 3].map(b => notes.filter(n => n.bar === b));
  // two-phrase passage for a combination type
  const COMBO = { pp: "Parallel period", cp: "Contrasting period", rp: "Repeated phrase", ppg: "Parallel phrase group", cpg: "Contrasting phrase group" };
  const COMBOW = { pp: "the phrases begin alike (a, a′), and the first ends open (half cadence) while the second closes (authentic cadence): antecedent and consequent.", cp: "the phrases begin differently (a, b), the first open and the second closed: antecedent and consequent.", rp: "the second phrase is the same as the first.", ppg: "the phrases begin alike (a, a′) but both end closed, so they don't form antecedent and consequent.", cpg: "the phrases are different (a, b) and both end closed, so they belong together without forming a period." };
  function passage(H, type) {
    for (let g = 0; g < 60; g++) {
      const k = H.key(H.rnd(KEYS), "major");
      const end1 = type === "pp" || type === "cp" ? "open" : type === "rp" ? H.rnd(["open", "closed"]) : "closed";
      const p1 = H.rnd(end1 === "open" ? OPEN : CLOSE), m1 = melody(H, p1, end1);
      if (!m1) continue;
      let p2, m2;
      if (type === "rp") { p2 = p1; m2 = m1.map(n => Object.assign({}, n)); }
      else if (type === "pp" || type === "ppg") { p2 = type === "pp" ? CLOSE[OPEN.indexOf(p1)] : H.rnd(CLOSE.filter(x => x[0].join() === p1[0].join() && x[1].join() === p1[1].join() && x !== p1).concat([[p1[0], p1[1], [4, 5], [1]]])); m2 = melody(H, p2, "closed", barsOf(m1).slice(0, 2)); if (m2 && m2.map(n => n.i).join() === m1.map(n => n.i).join()) continue; }
      else { p2 = H.rnd(BRIDGE); m2 = melody(H, p2, "closed"); if (m2 && barsOf(m2)[0].map(n => n.i).join() === barsOf(m1)[0].map(n => n.i).join()) continue; }
      if (!m2) continue;
      if (type === "ppg" && p1[3][0] !== 1) continue;
      return { k, type, p: [p1, p2], m: [m1, m2] };
    }
    return null;
  }
  function specOf(H, x, o = {}) {
    const mel = [], bass = [];
    [0, 1].forEach(ph => {
      x.m[ph].forEach((n, j) => mel.push(Object.assign({ k: [H.nmO(dn(H, x.k, n.i))], q: n.q }, o.br && j === 0 ? { bs: ph ? (x.type === "pp" || x.type === "ppg" ? "a′" : x.type === "rp" ? "a" : "b") : "a" } : {}, o.br && j === x.m[ph].length - 1 ? { be: true } : {})));
      x.p[ph].forEach((bar, b) => bar.forEach(d => { const c = H.diat(x.k, d); bass.push({ k: H.lh(c), q: bar.length === 1 ? 4 : 2, lab: o.labs ? H.rnOf(x.k, d) : null }); }));
    });
    return { type: "score", vf: x.k.vf, sig: x.k.sig, time: "4/4", bpm: 112, rowW: 900, bars: H.toBars({ t: [mel], b: [bass] }) };
  }

  // text diagrams
  const DIAG = [
    ["a (open) → a′ (closed)", "Parallel period"], ["a (open) → b (closed)", "Contrasting period"], ["a (any) → a (same)", "Repeated phrase"],
    ["a (closed) → a′ (closed)", "Parallel phrase group"], ["a (closed) → b (closed)", "Contrasting phrase group"],
    ["open → open → closed (three phrases)", "Three-phrase period"], ["open → open → open → closed (four phrases)", "Double period"],
    ["a (weak: IAC) → a′ (closed: PAC)", "Parallel period"], ["a (weak: DC) → b (closed: PAC)", "Contrasting period"],
  ];
  const DNAMES = ["Parallel period", "Contrasting period", "Repeated phrase", "Parallel phrase group", "Contrasting phrase group", "Three-phrase period", "Double period"];
  const FACTS = [
    ["A phrase is…", "a passage with a sense of completeness, like a sentence, usually ending with a cadence", ["any four bars", "a short motive", "a section of a sonata"], "Most strongly marked by a melodic arch and a cadential gesture."],
    ["Phrases are labeled with…", "lowercase letters (a, a′, b)", ["Roman numerals", "x, y, z", "capital letters only"], "a′ (“a prime”) is a varied return of a."],
    ["A divided phrase is made of…", "sub-phrases that show too little harmonic progression to be phrases themselves", ["two complete phrases", "two cadences", "a motive and its inversion"], "Each sub-phrase covers a harmonic motion, but only the phrase ends with a cadence."],
    ["A sentence has two phases:", "presentation and continuation", ["antecedent and consequent", "exposition and development", "verse and chorus"], "An idea, repeated or sequenced, then material leading to a cadence."],
    ["Why can the 12-bar blues be considered a sentence?", "it's a series of fragments with no inner cadence", ["it has two cadences", "it modulates", "it's in ternary form"], "Like a presentation followed by a continuation."],
    ["A period is…", "two phrases forming antecedent and consequent, the second with a more conclusive cadence", ["any two phrases", "a single long phrase", "a phrase with a deceptive cadence"], "Open (or weak), then closed."],
    ["A balanced period has…", "phrases of the same length", ["the same melody twice", "two authentic cadences", "no cadences"], "Phrases of different lengths make it asymmetrical."],
    ["A progressive period…", "modulates", ["has three phrases", "is always parallel", "ends with a half cadence"], "It ends in a different key."],
    ["What makes a double period?", "four phrases where the cadence ending the first pair is weaker than the final cadence", ["two periods in different songs", "two phrases repeated", "any eight bars"], "The middle cadence lacks closure, so the four phrases don't split into two pairs."],
    ["Small, distinctive melodic units that aren't developed like motives are called…", "figures or gestures", ["periods", "sentences", "cadences"], "Distinctive, but not developed."],
    ["In a double period, the second phrase can end with an authentic cadence when…", "it's in a contrasting key (like the relative major)", ["it's in the tonic", "it's a plagal cadence", "never"], "The contrasting key provides the needed openness (as in Clara Schumann's Piano Concerto, third movement)."],
  ];

  function make(mode, H) {
    if (mode === "staff") {
      const type = H.rnd(Object.keys(COMBO)), x = passage(H, type);
      if (!x) return null;
      const spec = specOf(H, x), ans = specOf(H, x, { br: true, labs: true });
      const cad = p => p[3][0] === 5 ? "a half cadence (open)" : "an authentic cadence (closed)";
      return H.mc(`In ${x.k.label}: bars 1–4 and 5–8 are two phrases. How do they combine?`, COMBO[type], Object.values(COMBO), `Phrase 1 ends with ${cad(x.p[0])}; phrase 2 ends with ${cad(x.p[1])}. ${COMBO[type]}: ${COMBOW[type]}`, { kicker: "On the staff", staff: spec, staffAns: ans, playQ: H.scorePlay(spec), playQLabel: "Play", nWrong: 4 });
    }
    if (mode === "diagram") {
      const [d, a] = H.rnd(DIAG);
      return H.mc(`Phrase plan: ${d}. What's the combination?`, a, DNAMES, `Open = half (or plagal half, secondary half) cadence; weak = deceptive or imperfect authentic; closed = perfect authentic or plagal. ${a}.`, { kicker: "Phrase diagrams" });
    }
    const [q, a, w, y] = H.rnd(FACTS);
    return H.mc(q, a, w, y, { kicker: "Terms" });
  }

  function reference() {
    return `<div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Combination</th><th scope="col">Phrases and cadences</th></tr></thead><tbody>
      <tr><td><b>Repeated phrase</b></td><td>a (any) – a (same)</td></tr>
      <tr><td><b>Parallel period</b></td><td>a (open) – a′ (closed)</td></tr><tr><td><b>Contrasting period</b></td><td>a (open) – b (closed)</td></tr>
      <tr><td><b>Parallel phrase group</b></td><td>a (closed) – a′ (closed)</td></tr><tr><td><b>Contrasting phrase group</b></td><td>a (closed) – b (closed)</td></tr>
      <tr><td><b>Three-phrase period</b></td><td>open or weak – open or weak – closed</td></tr>
      <tr><td><b>Double period</b></td><td>open/weak – open/weak – open/weak – closed</td></tr></tbody></table></div>
      <p class="legend">Open: half, plagal half, secondary half cadences. Weak: deceptive, imperfect authentic. Closed: (perfect) authentic, plagal.</p>`;
  }

  const ex = (H, type) => { const x = passage(H, type); return x ? specOf(H, x, { br: true, labs: true }) : null; };
  const lesson = { steps: [
    { title: "What is a phrase?", kick: "Musical sentences", render: () => `<p>Writers agree that a phrase must show some degree of completeness and come to a point of relative repose. In this course:</p>
      <div class="callout"><b>Phrase</b>A passage distinguished by melodic and harmonic features that give it a sense of “completeness,” like a sentence in language. A melodic arch ending in a strong cadential gesture marks a phrase most clearly; elision, a missing melody, or an amorphous line can blur it while keeping its function.</div>
      <p>Label phrases with lowercase letters: <b>a</b> for the first, <b>a′</b> (“a prime”) for a varied return, <b>b</b> for contrasting material, and so on.</p>` },
    { title: "Indivisible or divided", kick: "Phrase structure", render: () => `<ul><li><b>Indivisible phrases</b> can't be split into smaller units (like the opening of Bach's Cantata 147).</li>
      <li><b>Divided phrases</b> are made of <b>sub-phrases</b>: smaller melodic units with too little harmonic progression to be phrases themselves. A phrase ends with a cadence; sub-phrases divide it into two or more harmonic motions. In <i>Nearer, My God, to Thee</i>, the first phrase has two sub-phrases (I to IV, then I to V); the second spans one complete T–PD–D–T motion.</li></ul>
      <p>Small melodic units that are distinctive but not developed like motives are called <b>figures</b> or <b>gestures</b>.</p>` },
    { title: "The sentence", kick: "Presentation + continuation", render: () => `<p>A <b>sentence</b> is a phrase with a specific construction: a melodic idea is repeated or sequenced, then followed by related or unrelated material leading to a cadence (<i>Music Theory for the 21st-Century Classroom</i>). Typically eight bars, it splits into a <b>presentation</b> and a <b>continuation</b>:</p>
      <p class="steprow" aria-label="Sentence: idea, idea repeated, continuation, cadence"><span>idea (2 bars)</span><span>idea again or sequenced (2)</span><span class="hot">continuation (3–4)</span><i>→</i><span>cadence</span></p>
      <p>The <b>12-bar blues</b> can be thought of as a sentence: a series of fragments with no inner cadence. For more, see “Sentences and Periods” in <i>Fundamentals, Function, and Form</i>.</p>` },
    { title: "Pairs: periods", kick: "Antecedent and consequent", render: (H, k, U) => {
      const pp = ex(H, "pp"), cp = ex(H, "cp");
      return `<p>Phrases combine according to <b>closure</b>: the more open a phrase ends, the more likely it's followed by a phrase with a more final cadence. A <b>period</b> is a pair of phrases that group naturally: an <b>antecedent</b> and a <b>consequent</b>, usually with progressively more conclusive cadences. Periods can be:</p>
        <ul><li><b>balanced</b> (phrases the same length) or <b>asymmetrical</b>;</li><li><b>parallel</b> (similar beginnings) or <b>contrasting</b>;</li><li>in one key, or <b>progressive</b> (modulating).</li></ul>`
        + (pp ? U.fig(pp, "A parallel period: a ends with a half cadence; a′ begins the same way and closes with an authentic cadence.") : "")
        + (cp ? U.fig(cp, "A contrasting period: a (open), then b (closed).") : "");
    } },
    { title: "Phrase groups", kick: "Together, but not a period", render: (H, k, U) => {
      const g = ex(H, "ppg");
      return `<p>A <b>phrase group</b> is two or more phrases that seem to belong together but don't form antecedent and consequent: for instance, both end closed. It can be parallel or contrasting (Couperin's <i>Le Petit Rien</i> has a parallel phrase group). The <b>repeated phrase</b> is one kind of phrase group.</p>`
        + (g ? U.fig(g, "A parallel phrase group: both phrases end with authentic cadences.") : "");
    } },
    { title: "Three and four phrases", kick: "Chains and double periods", render: () => `<p>In a <b>three-phrase period</b> (sometimes called a phrase chain), the phrases belong together and the last has the most conclusive cadence (as in Mozart's “Giovinette, che fatte all'amore”).</p>
      <p>Four phrases in two pairs form a <b>double period</b> when the cadence ending the first pair is weaker than the one ending the whole group. In Amy Beach's “Phantoms”: phrase 1, IAC in A major; phrase 2, IAC in C♯ minor (weaker because of the modulation); phrase 3, IAC in A; phrase 4, PAC in A.</p>
      <p>The key: the four phrases don't split into two pairs because there's no closure in the middle. In Dave Frishberg's “Dodger Blue,” the second phrase ends open with a half cadence, as does the third; only the fourth closes. At the start of the third movement of Clara Schumann's Piano Concerto, phrase 2 ends with an authentic cadence in a contrasting key (the relative major), which supplies the openness instead.</p>` },
    { title: "Summary", kick: "Diagrams", render: (H) => reference(H) },
    { title: "Quick check", kick: "Before the drills", render: (H) => H.check("a (half cadence) → a′ (perfect authentic cadence):", "Parallel period", ["Contrasting period", "Parallel phrase group", "Double period"], "Open, then closed, with similar beginnings.") + [FACTS[3], FACTS[5], FACTS[8]].map(([q, a, w, y]) => H.check(q, a, w, y)).join("") },
  ] };

  return {
    key: "silverapps-phrases-v1", lesson, make, reference,
    modes: [{ id: "staff", kicker: "On the staff" }, { id: "diagram", kicker: "Phrase diagrams" }, { id: "terms", kicker: "Terms" }],
    topics: [],
  };
})();
