window.FAM = (() => {
  // ===== Motive and Sequence. Engine: build/harmony/engine.js =====
  const KEYS = ["C", "G", "D", "F", "B♭", "E♭", "A"];
  const RHY = { 3: [[1, 1, 2], [.5, .5, 3], [1.5, .5, 2], [2, 1, 1]], 4: [[.5, .5, 1, 2], [1, .5, .5, 2], [1, 1, 1, 1], [.5, .5, .5, .5].slice(0, 0), [1.5, .5, 1, 1]], 5: [[.5, .5, .5, .5, 2], [1, .5, .5, 1, 1], [.5, .5, 1, 1, 1]] };
  const dn = (H, k, i) => { const s = k.scale[H.mod(i, 7)]; return H.N(s.l, s.a, s.o + Math.floor(i / 7)); };
  const ix = (k, x) => (x.o * 7 + x.l) - (k.scale[0].o * 7 + k.scale[0].l);   // note → scale index
  const PERM = { rep: "Repetition", tonal: "Tonal transposition", real: "Real transposition", inv: "Inversion", retro: "Retrograde", aug: "Augmentation", dim: "Diminution", frag: "Fragmentation" };
  const PERMW = {
    rep: "the same notes and rhythm again.", tonal: "the whole motive moves to another scale step, staying in the key: interval sizes stay the same, but some qualities change (a major 3rd may become minor).",
    real: "the whole motive moves with every interval kept exactly the same quality, so accidentals outside the key appear.", inv: "every interval goes the opposite direction: the contour is turned upside down.",
    retro: "the pitches come in reverse order (back to front), with the same rhythm.", aug: "the same pitches in longer note values.", dim: "the same pitches in shorter note values.", frag: "only part of the motive is used, broken off from the whole.",
  };
  function motive(H) {
    for (let g = 0; g < 200; g++) {
      const n = H.rnd([3, 4, 4, 5]), rh = H.rnd(RHY[n].filter(r => r.length)), idx = [H.rnd([2, 3, 4, 5, 6])];
      for (let i = 1; i < n; i++) idx.push(idx[i - 1] + H.rnd([-2, -1, -1, 1, 1, 2, 3, -3, 4]));
      if (idx.some(i => i < 0 || i > 9)) continue;
      if (new Set(idx).size < n - 1) continue;
      const ivs = idx.slice(1).map((x, i) => x - idx[i]);
      if (ivs.every(v => Math.abs(v) === 1)) continue;          // too plain
      if (idx.join() === idx.slice().reverse().join()) continue;
      if (ivs.some(v => v === 0)) continue;
      return { idx, rh };
    }
    return { idx: [2, 4, 3, 1], rh: [1, .5, .5, 2] };
  }
  const semis = (H, a, b) => H.midi(b) - H.midi(a);
  // build a permutation: returns { notes: [N], rh } or null when it would be ambiguous
  function permute(H, k, m, type) {
    const base = m.idx.map(i => dn(H, k, i));
    const ivSemis = ns => ns.slice(1).map((x, i) => semis(H, ns[i], x));
    if (type === "rep") return { notes: base, rh: m.rh };
    if (type === "tonal") {
      for (const sh of H.shuffle([-3, -2, -1, 1, 2, 3])) { const ns = m.idx.map(i => dn(H, k, i + sh)); if (ivSemis(ns).join() !== ivSemis(base).join() && ns.every(x => H.midi(x) >= 60 && H.midi(x) <= 81)) return { notes: ns, rh: m.rh }; }
      return null;
    }
    if (type === "real") {
      for (const [st, se] of H.shuffle([[1, 2], [-1, -2], [2, 4], [-2, -3], [3, 5], [-3, -5], [1, 1], [4, 7]])) {
        const ns = base.map(x => H.up(x, st, se)), tonal = m.idx.map(i => dn(H, k, i + st));
        if (ns.some(x => Math.abs(x.a) > 1) || ns.some(x => H.midi(x) < 60 || H.midi(x) > 81)) continue;
        if (ns.map(H.nm).join() === tonal.map(H.nm).join()) continue;     // must differ from the tonal version
        return { notes: ns, rh: m.rh };
      }
      return null;
    }
    if (type === "inv") { const sh = H.rnd([0, 0, 2, -2, 3]), first = m.idx[0] + sh; const ns = m.idx.map(i => dn(H, k, first - (i - m.idx[0]))); if (ns.some(x => H.midi(x) < 60 || H.midi(x) > 81)) return null; return { notes: ns, rh: m.rh }; }
    if (type === "retro") return { notes: base.slice().reverse(), rh: m.rh };
    if (type === "aug") { if (m.rh.reduce((a, b) => a + b, 0) * 2 > 8) return null; return { notes: base, rh: m.rh.map(x => x * 2) }; }
    if (type === "dim") { if (m.rh.some(x => x < 1)) return null; return { notes: base, rh: m.rh.map(x => x / 2) }; }
    if (type === "frag") {
      const opts = [2, 3].filter(n => n < m.idx.length && Number.isInteger(m.rh.slice(0, n).reduce((a, b) => a + b, 0)) && m.rh.slice(0, n).reduce((a, b) => a + b, 0) <= 2);
      if (!opts.length) return null;
      const n = H.rnd(opts), len = m.rh.slice(0, n).reduce((a, b) => a + b, 0), reps = Math.max(2, Math.min(3, Math.floor(4 / len))), ns = [], rh = [];
      for (let r = 0; r < reps; r++) m.idx.slice(0, n).forEach((i, j) => { ns.push(dn(H, k, i - r)); rh.push(m.rh[j]); });
      return { notes: ns, rh };
    }
    return null;
  }
  // notes → flat score notes, padded to whole bars with a rest; optional bracket label
  const flat = (H, ns, rh, label, per = 4) => {
    const out = ns.map((n, i) => ({ k: [H.nmO(n)], q: rh[i] }));
    if (label) { out[0].bs = label; out[out.length - 1].be = label; }
    const tot = rh.reduce((a, b) => a + b, 0), pad = (per - (tot % per)) % per;
    if (pad) { let p = pad; [2, 1, .5].forEach(v => { while (p >= v - 1e-9) { out.push({ k: [], q: v }); p -= v; } }); }
    return out;
  };
  const scoreOf = (H, k, parts, bpm = 96) => ({ type: "score", vf: k.vf, sig: k.sig, time: "4/4", clefs: ["treble"], bpm, bars: H.toBars({ t: [parts.flat()] }) });

  // sequences
  const SEQ = { tonal: "Tonal sequence", real: "Real sequence", modified: "Modified sequence", none: "Not a sequence (free continuation)" };
  function seqEx(H, type) {
    for (let g = 0; g < 100; g++) {
      const k = H.key(H.rnd(KEYS), "major"), m = motive(H);
      if (m.rh.reduce((a, b) => a + b, 0) !== 4) continue;
      const dir = H.rnd([-1, 1]), base = m.idx.map(i => dn(H, k, i + (dir < 0 ? 3 : -1)));
      const parts = [base];
      for (let s = 1; s < 3; s++) {
        if (type === "real") parts.push(base.map(x => H.up(x, dir * s, dir * 2 * s)));
        else parts.push(m.idx.map(i => dn(H, k, i + (dir < 0 ? 3 : -1) + dir * s)));
      }
      if (type === "modified") { const p = parts[2], j = p.length - 1 - H.rnd([0, 1]); p[j] = dn(H, k, ix(k, p[j]) + H.rnd([-2, 2, 3])); }
      if (type === "none") { parts[2] = parts[2].map((x, j) => j ? dn(H, k, H.rnd([0, 1, 2, 3, 4, 5, 6, 7])) : x); }
      if (parts.flat().some(x => H.midi(x) < 60 || H.midi(x) > 83 || Math.abs(x.a) > 1)) continue;
      if (type === "real" && parts.flat().map(H.nm).join() === [0, 1, 2].map(s => m.idx.map(i => H.nm(dn(H, k, i + (dir < 0 ? 3 : -1) + dir * s)))).flat().join()) continue;
      if (type === "modified" && parts[2].map(H.nm).join() === m.idx.map(i => H.nm(dn(H, k, i + (dir < 0 ? 3 : -1) + 2 * dir))).join()) continue;
      if (type === "none" && semisOk(H, parts)) continue;
      return { k, dir, spec: scoreOf(H, k, parts.map((p, i) => flat(H, p, m.rh, i === 0 ? "x" : i === 1 ? "x′" : null))) };
    }
    return null;
  }
  const semisOk = (H, parts) => { const iv = p => p.slice(1).map((x, i) => Math.sign(H.midi(x) - H.midi(p[i]))).join(); return iv(parts[2]) === iv(parts[0]); };

  const FACTS = [
    ["A motive is…", "a short, distinctive musical idea: the shortest part of a theme that keeps its identity", ["a complete phrase ending in a cadence", "any repeated accompaniment pattern", "the key of a piece"], "Melodic, harmonic, rhythmic, or a combination."],
    ["Motives are usually labeled with…", "lowercase letters from the end of the alphabet (x, y, z)", ["Roman numerals", "capital letters A, B, C", "scale-degree numbers"], "Capital letters label sections; lowercase a, b label phrases."],
    ["A short ostinato that repeats many times but isn't developed is…", "usually not considered a motive worth analyzing", ["always the main motive", "a sequence", "a cadence"], "Motives are distinctive and constructive."],
    ["Which permutations are most common?", "repetition, free variation and transposition", ["retrograde and inversion", "augmentation and diminution only", "fragmentation only"], "Others do occur, but less often."],
    ["Inversion vs. retrograde:", "inversion turns intervals upside down; retrograde plays the notes backwards", ["they're the same thing", "inversion is backwards; retrograde is upside down", "both change only the rhythm"], "Different axes: up/down vs. front/back."],
    ["A melodic sequence is…", "a melodic pattern repeated at successively higher or lower pitch levels", ["any repeated phrase", "a motive played backwards", "a series of cadences"], "Usually up or down by step."],
    ["A tonal sequence…", "stays in the key, so some interval qualities change", ["keeps every interval exactly", "always modulates", "has no harmony"], "A real sequence keeps exact intervals (and may change key)."],
    ["A real sequence…", "keeps the exact intervals, adding accidentals or changing key", ["stays in one key", "changes the rhythm", "is always descending"], "Exact transposition."],
    ["A modified sequence…", "adapts or embellishes a repetition (often the third), to avoid monotony", ["keeps every repetition identical", "has only two statements", "inverts the motive"], "Common on the third statement."],
    ["A mixed sequence is…", "real in some repetitions and tonal in others", ["melodic and harmonic at once", "a sequence that inverts", "a sequence in two keys at once"], "Often to avoid modulating too far."],
    ["The most common harmonic pattern in sequences is…", "descending fifths (around the circle of fifths)", ["ascending tritones", "repeated tonic chords", "chromatic chord streams"], "As in “Angels We Have Heard on High.”"],
    ["A “melodic-only” sequence…", "repeats a melodic pattern while the chords don't follow a sequential pattern", ["has no melody", "never changes key", "uses only one chord"], "As in As Time Goes By."],
    ["Augmentation means…", "longer note values for the same notes", ["more notes added", "a higher transposition", "playing it backwards"], "Diminution is the reverse; neither is usually strictly proportional."],
  ];

  function make(mode, H) {
    if (mode === "perm") {
      const pool = Object.keys(PERM).filter(t => H.topicOn(t === "frag" || t === "aug" || t === "dim" ? "rhythm" : t === "inv" || t === "retro" ? "mirror" : "trans"));
      for (let g = 0; g < 30; g++) {
        const k = H.key(H.rnd(KEYS), "major"), m = motive(H), type = H.rnd(pool.length ? pool : ["tonal"]), p = permute(H, k, m, type);
        if (!p) continue;
        const base = m.idx.map(i => dn(H, k, i));
        if (type !== "rep" && p.notes.map(H.nmO).join() === base.map(H.nmO).join() && p.rh.join() === m.rh.join()) continue;
        const spec = scoreOf(H, k, [flat(H, base, m.rh, "x"), flat(H, p.notes, p.rh, "?")]);
        return H.mc("Motive x starts the passage. How is it changed in the bracket marked “?”", PERM[type], Object.values(PERM), `${PERM[type]}: ${PERMW[type]}`, { kicker: "Motive changes", staff: spec, playQ: H.scorePlay(spec), playQLabel: "Play", topic: type === "frag" || type === "aug" || type === "dim" ? "rhythm" : type === "inv" || type === "retro" ? "mirror" : "trans" });
      }
      return null;
    }
    if (mode === "seq") {
      const type = H.rnd(["tonal", "tonal", "real", "modified", "none"]), x = seqEx(H, type);
      if (!x) return null;
      const W = { tonal: "Each statement moves a step within the key, so a few interval qualities change: a tonal sequence.", real: "Each statement keeps the exact intervals, so accidentals appear: a real sequence.", modified: "The second statement follows the pattern, but the third is changed: a modified sequence.", none: "The first two bars make a sequence, but the third bar doesn't continue the pattern: it's a free continuation." };
      return H.mc(`In ${x.k.label}: what happens to the pattern in this melody?`, SEQ[type], Object.values(SEQ), W[type], { kicker: "Sequences", staff: x.spec, playQ: H.scorePlay(x.spec), playQLabel: "Play", topic: "trans" });
    }
    const [q, a, w, y] = H.rnd(FACTS);
    return H.mc(q, a, w, y, { kicker: "Terms" });
  }

  function reference() {
    return `<div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Permutation</th><th scope="col">What changes</th></tr></thead><tbody>
      ${Object.keys(PERM).map(t => `<tr><td><b>${PERM[t]}</b></td><td>${PERMW[t]}</td></tr>`).join("")}</tbody></table></div>
      <p class="legend">Sequences: tonal (stays in key), real (exact intervals), modified (a statement is adapted), mixed (some real, some tonal); melodic, harmonic or both.</p>`;
  }

  const M = { idx: [2, 4, 3, 1], rh: [1, .5, .5, 2] };
  const lesson = { defMode: "major", steps: [
    { title: "What is a motive?", kick: "The smallest idea", keyed: "major", render: (H, k, U) => {
      const sp = scoreOf(H, k, [flat(H, M.idx.map(i => dn(H, k, i)), M.rh, "x")]);
      return `<p>A <b>motive</b> (or motif; the terms are interchangeable) is a short musical idea: melodic, harmonic, rhythmic, or any combination. It's usually thought of as the shortest part of a theme or phrase that still keeps its identity as an idea. (After William Drabkin, “Motif,” <i>Grove Music Online</i>.)</p>`
        + U.fig(sp, "A motive, labeled x.")
        + `<ul><li><b>Motives are small</b> (a few notes) and <b>distinctive</b>. A long gesture may be a phrase or sub-phrase; a nondescript one (like an undeveloped ostinato) isn't of much analytical interest.</li>
        <li><b>Motives are usually in the foreground.</b> In the accompaniment, they usually imitate the melody.</li>
        <li>Label motives with lowercase letters from the end of the alphabet: <b>x, y, z</b>.</li>
        <li>Favor observations about <b>audible processes</b> and compositional approach: an inversion might be obvious or might not; a retrograde is often more interesting to a composer than audible to a listener.</li></ul>`;
    } },
    { title: "Motives at work", kick: "Recurrence and rhythm", render: () => `<p>Motive can be found in most music, but it matters more where it's used thoroughly. In <i>The Eagles' Victory Song</i>, two fragments (x and y) are prominent, and a third (z) starts as a fragment of y before gaining independence. In Mel Tormé's <i>The Christmas Song</i>, motive x starts each two-bar unit, changing interval and scale position; motive y shifts with the harmony, then appears unexpectedly at the end of the phrase, forming an elision with the next verse.</p>
      <p>Rhythmic placement can be immediately interesting to a listener. A clever pattern: a motive at regular intervals, then an <b>acceleration</b> of its appearances (as in the third movement of Mozart's Sonata K. 331). Don't confuse this with <i>diminution</i>: it's about how often the motive appears.</p>` },
    { title: "Transposition", kick: "Same shape, new pitch", keyed: "major", render: (H, k, U) => {
      const base = M.idx.map(i => dn(H, k, i));
      const tonal = M.idx.map(i => dn(H, k, i + 1)), real = base.map(x => H.up(x, 1, 2));
      return `<p>A motive may recur within a phrase or at the start of parallel phrases, often <b>transposed</b> to start on another pitch:</p>
      <ul><li><b>Real</b> transposition keeps every interval's exact quality.</li><li><b>Tonal</b> transposition keeps interval sizes (2nds, 3rds…) but not necessarily their qualities (m2, M3…).</li><li>Many transpositions just keep the basic contour.</li></ul>`
        + U.fig(scoreOf(H, k, [flat(H, base, M.rh, "x"), flat(H, tonal, M.rh, "tonal"), flat(H, real, M.rh, "real")]), "x, then up a step tonally (in the key), then up a whole step exactly (real).");
    } },
    { title: "Changing the shape", kick: "Inversion and retrograde", keyed: "major", render: (H, k, U) => {
      const base = M.idx.map(i => dn(H, k, i)), inv = M.idx.map(i => dn(H, k, M.idx[0] + 3 - (i - M.idx[0]))), ret = base.slice().reverse();
      return `<ul><li><b>Inversion</b> reverses the contour: “upside down,” a mirror image. Each interval changes direction. Inversions may be transposed.</li><li><b>Retrograde</b> plays the notes backwards, keeping the original rhythm or reversing it too.</li></ul>`
        + U.fig(scoreOf(H, k, [flat(H, base, M.rh, "x"), flat(H, inv, M.rh, "inversion"), flat(H, ret, M.rh, "retrograde")]), "Inversion flips the intervals (up becomes down); retrograde reverses the order.")
        + `<p>Inversion and retrograde work on different axes. In <i>Do You Want to Build a Snowman</i> (from <i>Frozen</i>), a motive returns in augmentation, then an octave higher, then in retrograde.</p>`
        + H.check("The notes come back in reverse order. That's…", "retrograde", ["inversion", "augmentation", "tonal transposition"], "Back to front.");
    } },
    { title: "Rhythm and length", kick: "Augmentation, diminution, fragmentation", keyed: "major", render: (H, k, U) => {
      const base = M.idx.map(i => dn(H, k, i));
      return `<ul><li><b>Change of interval</b>, often to fit a change of harmony or a stepwise pattern of starting notes.</li>
        <li><b>Change of rhythm</b>, keeping pitches or contour: <b>augmentation</b> (longer values) and <b>diminution</b> (shorter values), usually not strictly proportional.</li>
        <li><b>Change of length</b>: <b>fragmentation</b> (breaking off part of a motive and developing it), or adding and removing notes through extension or ornamentation.</li></ul>`
        + U.fig(scoreOf(H, k, [flat(H, base, M.rh, "x"), flat(H, base, M.rh.map(v => v * 2), "augmentation"), flat(H, base.slice(0, 3).concat(M.idx.slice(0, 3).map(i => dn(H, k, i - 1))), [1, .5, .5, 1, .5, .5], "fragments")]), "Augmentation, then the motive's first three notes broken off and repeated a step lower (fragmentation).")
        + `<p>In <i>Let It Go</i>, a figure is repeated with its last two notes swapped, then heard a third time a diatonic step lower: a tonal transposition.</p>`;
    } },
    { title: "Sequence", kick: "Repetition at another level", keyed: "major", render: (H, k, U) => {
      const rh = [1, 1, 1, 1];
      const parts = [0, 1, 2].map(s => [4, 5, 4, 3].map(i => dn(H, k, i + 3 - s)));
      return `<p>A <b>sequence</b> is the more or less exact repetition of a melody at another level, higher or lower (<i>Oxford Companion to Music</i>). If only the melody repeats, with changed harmony, it's a <b>melodic sequence</b>; if the harmony follows the pattern too, a <b>harmonic sequence</b>.</p>`
        + U.fig(scoreOf(H, k, parts.map((p, i) => flat(H, p, rh, i === 0 ? "x" : null))), "A one-bar pattern stepping down: a tonal melodic sequence.")
        + `<p>In “Angels We Have Heard on High,” the “Gloria” is a one-bar pattern sequenced down by step over a descending-fifths chord pattern (D7–G–C–F–B♭ in F), before ordinary progression returns for the cadence.</p>`;
    } },
    { title: "Tonal, real, modified", kick: "Kinds of sequence", keyed: "major", render: (H, k, U) => {
      const p0 = [4, 5, 4, 2].map(i => dn(H, k, i + 3)), rh = [1, 1, 1, 1];
      const real = [0, 1, 2].map(s => p0.map(x => H.up(x, -s, -2 * s)));
      return `<ul><li><b>Tonal sequence</b>: the repetitions stay in the key, so some intervals get larger or smaller by a half step.</li>
        <li><b>Real sequence</b>: exact intervals are kept, so the key changes (or accidentals appear).</li>
        <li><b>Mixed sequence</b>: real in some repetitions, tonal in others (sometimes to avoid modulating too far).</li>
        <li><b>Modified sequence</b>: a repetition is adapted or embellished, most often the third, to avoid monotony (as in Schumann's “First Loss,” from bar 17).</li></ul>`
        + U.fig(scoreOf(H, k, real.map((p, i) => flat(H, p, rh, i === 0 ? "x" : null))), "A real sequence: each statement a whole step lower, with exactly the same intervals.")
        + `<p>Some sequences <b>modulate</b> (Billy Joel's “She's Always a Woman” moves from D♭ to E♭ major). Some are melodic only (<i>As Time Goes By</i>: the chords don't follow the pattern); others are harmonic only, with a free melody over them.</p>`;
    } },
    { title: "Transposition or sequence?", kick: "The spirit of sequence", render: () => `<p>Is every repetition at a new pitch a sequence? Billy Joel's <i>Allentown</i> transposes a segment up a 4th (a real transposition), its chords moving along with it like ii–V–I in D and then G, and a third repetition begins before the phrase moves on.</p>
      <p>Adam Silverman's view: there's a “spirit” of sequence missing there. A true sequence, rooted in Baroque practice, uses transposed motives and chord patterns to move a phrase along its path to the cadence. <i>Allentown</i> uses transposed gestures as the beginning of a musical <i>sentence</i> instead. Common usage often applies “sequence” to any transposition (even in descriptions of the sentence on openmusictheory.com), but that colloquial usage misses the majesty of a true sequence.</p>` },
    { title: "Quick check", kick: "Before the drills", render: (H) => [FACTS[4], FACTS[6], FACTS[8], FACTS[12]].map(([q, a, w, y]) => H.check(q, a, w, y)).join("") },
  ] };

  return {
    key: "silverapps-motive-v1", lesson, make, reference,
    modes: [{ id: "perm", kicker: "Motive changes" }, { id: "seq", kicker: "Sequences" }, { id: "terms", kicker: "Terms" }],
    topics: [{ id: "trans", name: "Repetition and transposition", group: "p" }, { id: "mirror", name: "Inversion and retrograde", group: "p" }, { id: "rhythm", name: "Rhythm and fragments", group: "p" }],
  };
})();
