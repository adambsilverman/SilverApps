window.FAM = (() => {
  // ===== Non-Chord Tones: content (lesson + drills). Engine: build/harmony/engine.js =====
  const KEYS = ["C", "G", "D", "F", "B♭", "E♭", "A"];
  const NAME = { PT: "Passing tone", NT: "Neighbor tone", APP: "Appoggiatura", ET: "Escape tone", SUS: "Suspension", RET: "Retardation", ANT: "Anticipation", HA: "Harmonic anticipation", DN: "Double neighbor", PED: "Pedal tone" };
  const HOW = {
    PT: ["step", "step in the same direction"], NT: ["step", "step back in the opposite direction"], APP: ["leap", "step (usually in the opposite direction)"],
    ET: ["step", "leap (usually in the opposite direction)"], SUS: ["the same note (held or repeated)", "step down"], RET: ["the same note (held or repeated)", "step up"],
    ANT: ["step or leap", "the same note, which becomes a chord tone"], HA: ["step or leap", "leap to a different tone of the chord it anticipated"],
    DN: ["step", "skip to the other side of the target, then step to it"], PED: ["the same note", "the same note"],
  };
  const TOPIC = { PT: "step", NT: "step", DN: "step", APP: "leap", ET: "leap", SUS: "held", RET: "held", ANT: "held", HA: "held" };
  const PROGS = [[1, 4, 5, 1], [1, 2, 5, 1], [1, 6, 4, 5], [1, 4, 1, 5], [6, 4, 5, 1], [1, 6, 2, 5], [4, 5, 1, 1], [1, 5, 6, 4], [1, 4, 2, 5]];

  // scale index i (0 = tonic in octave 4) → note
  const dn = (H, k, i) => { const s = k.scale[H.mod(i, 7)]; return H.N(s.l, s.a, s.o + Math.floor(i / 7)); };
  const isCT = (d, i) => [0, 2, 4].includes(((i - (d - 1)) % 7 + 7) % 7);
  const rnD = (H, k, d) => H.rnOf(k, d);

  // label every melody note: notes [{ i, t, q }], chordAt(t) → degree
  function classify(notes, chordAt) {
    return notes.map((x, j) => {
      const d = chordAt(x.t);
      if (isCT(d, x.i)) return "CT";
      const p = notes[j - 1], n = notes[j + 1];
      if (!p || !n) return "?";
      const a = x.i - p.i, r = n.i - x.i, dn2 = chordAt(n.t), changes = dn2 !== d, inNext = changes && isCT(dn2, x.i);
      const q = notes[j + 2], pp = notes[j - 2];
      if (a === 0) { if (!isCT(chordAt(p.t), p.i) || chordAt(p.t) === d) return "?"; return r === -1 ? "SUS" : r === 1 ? "RET" : "?"; }
      if (q && Math.abs(a) === 1 && n.i === p.i - a && q.i === p.i && !isCT(chordAt(n.t), n.i) && isCT(chordAt(q.t), q.i)) return "DN";
      if (pp && !isCT(chordAt(p.t), p.i) && Math.abs(p.i - pp.i) === 1 && x.i === 2 * pp.i - p.i && n.i === pp.i) return "DN";
      if (r === 0) return inNext ? "ANT" : "?";
      if (Math.abs(a) === 1 && Math.abs(r) === 1) return Math.sign(a) === Math.sign(r) ? "PT" : "NT";
      if (Math.abs(a) >= 2 && Math.abs(r) === 1) return "APP";
      if (Math.abs(r) >= 2 && inNext && isCT(dn2, n.i)) return "HA";
      if (Math.abs(a) === 1 && Math.abs(r) >= 2) return "ET";
      return "?";
    });
  }

  // a two-bar melody over four chords (two beats each) with exactly one kind of non-chord tone
  function gen(H, want) {
    for (let g = 0; g < 600; g++) {
      const k = H.key(H.rnd(KEYS), "major"), prog = H.rnd(PROGS);
      let lo = -3, hi = 12; while (H.midi(dn(H, k, lo)) < 62) lo++; while (H.midi(dn(H, k, hi)) > 79) hi--;
      const ch = j => prog[Math.min(3, Math.floor(j / 2))];
      const m = [];
      const cts = (j, near) => { const out = []; for (let i = lo; i <= hi; i++) if (isCT(ch(j), i) && (near == null || Math.abs(i - near) <= 4)) out.push(i); return out; };
      m.push(H.rnd(cts(0).filter(i => i >= lo + 2 && i <= hi - 3)));
      let ok = m[0] != null;
      for (let j = 1; j < 8 && ok; j++) {
        const c = cts(j, m[j - 1]); if (!c.length) { ok = false; break; }
        const w = c.flatMap(i => Array(Math.abs(i - m[j - 1]) <= 2 ? (i === m[j - 1] ? 1 : 4) : 1).fill(i));
        m.push(H.rnd(w));
      }
      if (!ok) continue;
      const odd = [1, 3, 5], even = [2, 4, 6];
      let j, notes, ncts = [], tieAt = -1;
      const pick = a => H.rnd(a), s1 = H.rnd([-1, 1]);
      if (want === "PT") { j = pick(odd); m[j] = m[j - 1] + s1; m[j + 1] = m[j] + s1; }
      else if (want === "NT") { j = pick(odd); m[j] = m[j - 1] + s1; m[j + 1] = m[j - 1]; }
      else if (want === "APP") { j = pick(even); const lp = H.rnd([2, 3, 4]) * s1; m[j] = m[j - 1] + lp; m[j + 1] = m[j] - s1; }
      else if (want === "ET") { j = pick(odd); m[j] = m[j - 1] + s1; const c = cts(j + 1).filter(i => (i - m[j]) * s1 <= -2 && Math.abs(i - m[j]) <= 4); if (!c.length) continue; m[j + 1] = pick(c); }
      else if (want === "SUS" || want === "RET") { j = pick(even); m[j] = m[j - 1]; m[j + 1] = m[j] + (want === "SUS" ? -1 : 1); tieAt = j - 1; }
      else if (want === "ANT") { j = pick(odd); m[j] = m[j + 1]; }
      else if (want === "HA") { j = pick(odd); const c = cts(j + 1).filter(i => !isCT(ch(j), i) && Math.abs(i - m[j - 1]) <= 4); if (!c.length) continue; m[j] = pick(c); const c2 = cts(j + 1).filter(i => Math.abs(i - m[j]) >= 2 && Math.abs(i - m[j]) <= 4); if (!c2.length) continue; m[j + 1] = pick(c2); }
      // build notes (DN replaces one quarter with two eighths)
      if (want === "DN") {
        j = pick(odd); const x = m[j - 1]; m[j + 1] = x;
        notes = []; for (let a = 0; a < 8; a++) { if (a === j) { notes.push({ i: x + s1, t: a, q: .5 }, { i: x - s1, t: a + .5, q: .5 }); } else notes.push({ i: m[a], t: a, q: 1 }); }
      } else notes = m.map((i, a) => ({ i, t: a, q: 1 }));
      if (notes.some(x => x.i < lo || x.i > hi)) continue;
      if (notes.some((x, a) => a && Math.abs(x.i - notes[a - 1].i) > 5)) continue;
      const lab = classify(notes, t => ch(Math.floor(t)));
      ncts = lab.map((l, a) => l === "CT" ? -1 : a).filter(a => a >= 0);
      const expect = want === "DN" ? 2 : 1;
      if (ncts.length !== expect || ncts.some(a => lab[a] !== want)) continue;
      // no more than two repeated notes in a row, and the melody ends on a chord tone
      if (notes.some((x, a) => a > 1 && x.i === notes[a - 1].i && x.i === notes[a - 2].i)) continue;
      if (tieAt >= 0) notes[tieAt].tie = true;
      // the last two beats become one half note when nothing happens there
      const last = notes[notes.length - 1], prev = notes[notes.length - 2];
      if (!ncts.some(a => a >= notes.length - 2) && prev.i === last.i && !prev.tie) { prev.q = 2; notes.pop(); }
      return { k, prog, notes, ncts, lab, want };
    }
    return null;
  }
  function spec(H, x, o = {}) {
    const k = x.k;
    const mel = x.notes.map((n, a) => Object.assign({ k: [H.nmO(dn(H, k, n.i))], q: n.q, tie: n.tie }, o.hl && x.ncts.includes(a) ? { hl: true } : {}, o.num ? { n: a + 1 } : {}, o.tags && x.ncts.includes(a) ? { tag: x.lab[a] } : {}));
    const bass = x.prog.map(d => { const c = H.diat(k, d); return { k: H.lh(c), q: 2, lab: o.rn === false ? null : rnD(H, k, d), sym: o.sym === false ? null : c.sym }; });
    return { type: "score", vf: k.vf, sig: k.sig, time: "4/4", bpm: 84, bars: H.toBars({ t: [mel], b: [bass] }) };
  }

  // ---------- suspensions with figures ----------
  const CONS = { 2: [3, 4], 5: [8, 9], 7: [0, 12] };   // consonant 3rds, 6ths, octaves: letter steps (mod 7) → allowed semitones (mod 12)
  const consonant = (H, lo, hi) => { const [st, se] = H.ivl(lo, hi), s7 = H.mod(st, 7), m = H.mod(se, 12); return (s7 === 2 && [3, 4].includes(m)) || (s7 === 5 && [8, 9].includes(m)) || (s7 === 0 && m === 0) || (s7 === 4 && m === 7); };
  const SUSF = { "4-3": [3, 2], "9-8": [8, 7], "7-6": [6, 5], "2-3": [1, 2] };
  function susEx(H, want) {
    for (let g = 0; g < 400; g++) {
      const k = H.key(H.rnd(KEYS), "major");
      if (want !== "2-3") {
        // bass b2 under the suspension; upper note u = b2 + figure; resolution one step down
        const [up1] = SUSF[want];
        const bi = -16 + Math.floor(Math.random() * 10), b2 = dn(H, k, bi);
        if (H.midi(b2) < 40 || H.midi(b2) > 57) continue;
        const ups = [0, 7, 14].map(o => bi + up1 + o).filter(i => H.midi(dn(H, k, i)) >= 62 && H.midi(dn(H, k, i)) <= 79 && H.midi(dn(H, k, i)) - H.midi(b2) <= 26);
        if (!ups.length) continue;
        const ui = H.rnd(ups), u = dn(H, k, ui), r = dn(H, k, ui - 1);
        if (!consonant(H, b2, r)) continue;
        if (want === "7-6" ? false : H.mod(H.midi(u) - H.midi(b2), 12) === 6) continue;
        // a bass note before it that makes the upper note consonant (preparation)
        const opts = [-4, -3, -2, -1, 1, 2, 3, 4].map(d => bi + d).filter(b => { const b1 = dn(H, k, b); return H.midi(b1) >= 40 && H.midi(b1) <= 57 && consonant(H, b1, u); });
        if (!opts.length) continue;
        const b1 = dn(H, k, H.rnd(opts));
        if (H.ivl(b1, u)[1] > 26 || H.ivl(b2, u)[1] > 26) continue;
        const top = [{ k: [H.nmO(u)], q: 4, tie: true }, { k: [H.nmO(u)], q: 2, hl: true, tag: "SUS" }, { k: [H.nmO(r)], q: 2 }];
        const bot = [{ k: [H.nmO(b1)], q: 4 }, { k: [H.nmO(b2)], q: 4 }];
        return { k, want, sp: { type: "score", vf: k.vf, sig: k.sig, time: "4/4", bpm: 72, bars: H.toBars({ t: [top], b: [bot] }) }, u, r, b1, b2, prep: H.ivl(b1, u)[0] };
      }
      // 2-3: the bass is suspended under a moving upper voice
      const bi = H.rnd([-13, -12, -11, -10, -9]), b = dn(H, k, bi), br = dn(H, k, bi - 1);
      const ui = bi + 8, u = dn(H, k, ui), u0opts = [2, 4, 5, 7, 9].map(d => bi + d + 7).filter(i => i !== ui && Math.abs(i - ui) <= 3 && consonant(H, b, dn(H, k, i)));
      if (!u0opts.length || !consonant(H, br, u) || H.midi(u) > 79 || H.midi(b) < 40) continue;
      const u0 = dn(H, k, H.rnd(u0opts));
      const top = [{ k: [H.nmO(u0)], q: 4 }, { k: [H.nmO(u)], q: 4 }];
      const bot = [{ k: [H.nmO(b)], q: 4, tie: true }, { k: [H.nmO(b)], q: 2, hl: true, tag: "SUS" }, { k: [H.nmO(br)], q: 2 }];
      return { k, want, sp: { type: "score", vf: k.vf, sig: k.sig, time: "4/4", bpm: 72, bars: H.toBars({ t: [top], b: [bot] }) }, u, r: u, b1: b, b2: br };
    }
    return null;
  }

  // ---------- definitions ----------
  const DEFS = Object.keys(HOW).map(t => [t, `Approached by ${HOW[t][0]}; left by ${HOW[t][1]}.`]);
  const FACTS = [
    ["A non-chord tone is also called…", "a dissonance (dissonant tone)", ["a consonance", "a chord member", "a turnaround"], "A chord tone may be called a consonance; a non-chord tone a dissonance."],
    ["Non-chord tones are classified by…", "how they are approached and left (step, leap or same note)", ["how long they last", "which voice they are in", "whether they are sharp or flat"], "Steps sound more “natural” than leaps."],
    ["What are the three phases of a suspension?", "preparation, suspension, resolution", ["approach, leap, return", "tonic, dominant, tonic", "anticipation, pedal, resolution"], "Prepared as a chord tone, held into the new chord, resolved down by step."],
    ["Suspension figures (4-3, 7-6, 9-8) measure the interval from…", "the bass to the suspended note and to its resolution", ["the soprano to the bass", "the root to the 3rd", "one chord root to the next"], "2-3 is the exception: it's the bass that is suspended."],
    ["Which suspension has the suspended note in the bass?", "2-3", ["4-3", "7-6", "9-8"], "The 2-3 is the inversion of the 7-6."],
    ["Which is the most common non-chord tone?", "the passing tone", ["the escape tone", "the retardation", "the harmonic anticipation"], "Steps in the same direction on both sides."],
    ["An anticipation is often a side effect of…", "syncopation", ["a pedal tone", "modulation", "a cadential 6/4"], "The melody arrives early, before the chord changes."],
    ["In classical and folk music, chordal 7ths are usually…", "dissonances, except on the dominant", ["always consonant", "never used", "treated as pedal tones"], "In jazz, 7ths (and extensions) usually count as chord tones."],
    ["A pedal tone is usually found in…", "the bass", ["the soprano only", "the alto only", "no particular voice; it never sounds"], "A held (or repeated) bass note persists while the chords change above it."],
    ["“Harmonic rhythm” means…", "the rate at which chords change", ["the rhythm of the melody", "the meter", "the tempo"], "Find it first when labeling non-chord tones in notated music."],
    ["Another name for the double neighbor is…", "changing tones", ["passing tones", "escape tones", "incomplete neighbors"], "Two non-chord tones surround the note they resolve to."],
    ["Another name for the appoggiatura (in some books) is…", "incomplete neighbor", ["changing tone", "passing tone", "pedal point"], "Leap to it, step away."],
  ];

  function make(mode, H) {
    if (mode === "name" || mode === "find") {
      const pool = ["PT", "NT", "APP", "ET", "SUS", "RET", "ANT", "HA", "DN"].filter(t => H.topicOn(TOPIC[t]) && !(mode === "find" && t === "DN"));
      const want = H.rnd(pool.length ? pool : ["PT"]), x = gen(H, want);
      if (!x) return null;
      const a = x.ncts[0], n = x.notes[a], d = x.prog[Math.min(3, Math.floor(n.t / 2))], c = H.diat(x.k, d);
      const nn = H.nm(dn(H, x.k, n.i)), why = `In ${x.k.label}, the chord there is ${c.sym} ({rn:${rnD(H, x.k, d)}}: ${c.tones.map(H.nm).join("–")}), so ${nn} is not a chord tone. It's approached by ${HOW[want][0]} and left by ${HOW[want][1]}: ${NAME[want].toLowerCase()} (${want}).`;
      const play = spec(H, x).bars && H.scorePlay(spec(H, x));
      if (mode === "name")
        return H.mc(`In ${x.k.label}: what kind of non-chord tone is circled?`, NAME[want], Object.values(NAME).filter(v => v !== NAME.PED), why, { kicker: "Name it", staff: spec(H, x, { hl: true }), staffAns: spec(H, x, { tags: true, hl: true }), playQ: play, playQLabel: "Play", topic: TOPIC[want] });
      return H.mc(`In ${x.k.label}: which melody note is the non-chord tone?`, `Note ${a + 1}`, x.notes.map((_, i) => `Note ${i + 1}`).filter((_, i) => i !== a && i > 0 && i < x.notes.length - 1), why, { kicker: "Find it", staff: spec(H, x, { num: true }), staffAns: spec(H, x, { num: true, tags: true, hl: true }), playQ: play, playQLabel: "Play", topic: TOPIC[want], nWrong: 3 });
    }
    if (mode === "sus") {
      const want = H.rnd(Object.keys(SUSF)), x = susEx(H, want);
      if (!x) return null;
      const why = want === "2-3" ? `The bass ${H.nm(x.b1)} is held while the upper voice moves to ${H.nm(x.u)}: a 2nd (9th) above the bass. The bass then steps down to ${H.nm(x.b2)}, making a 3rd (10th). That's a 2-3 suspension, the inversion of the 7-6.`
        : `Over the new bass note ${H.nm(x.b2)}, the held ${H.nm(x.u)} is a ${want.split("-")[0]}th above the bass${want === "9-8" ? " (a 9th stays “9” because it resolves to an octave)" : " (compound intervals are reduced)"}. It steps down to ${H.nm(x.r)}, a ${want.split("-")[1] === "3" ? "3rd" : want.split("-")[1] === "6" ? "6th" : "octave"} above the bass: ${want}.`;
      return H.mc("Which kind of suspension is this?", want, Object.keys(SUSF), why, { kicker: "Suspension figures", staff: x.sp, playQ: H.scorePlay(x.sp), playQLabel: "Play", topic: "held" });
    }
    // definitions
    if (Math.random() < .6) {
      const [t, d] = H.rnd(DEFS);
      if (Math.random() < .5) return H.mc(`Which non-chord tone is this? ${d}`, NAME[t], Object.values(NAME), `${NAME[t]} (${t}): approached by ${HOW[t][0]}, left by ${HOW[t][1]}.`, { kicker: "Definitions" });
      return H.mc(`How is a${/^[AE]/.test(NAME[t]) ? "n" : ""} ${NAME[t].toLowerCase()} (${t}) approached and left?`, d, DEFS.map(x => x[1]), `${NAME[t]}: approached by ${HOW[t][0]}, left by ${HOW[t][1]}.`, { kicker: "Definitions" });
    }
    const [q, a, w, why] = H.rnd(FACTS);
    return H.mc(q, a, w, why, { kicker: "Terms" });
  }

  function reference() {
    return `<div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Type</th><th scope="col">Approached by</th><th scope="col">Left by</th></tr></thead><tbody>
      ${Object.keys(NAME).map(t => `<tr><td><b>${NAME[t]}</b> (${t})</td><td>${HOW[t][0]}</td><td>${HOW[t][1]}</td></tr>`).join("")}</tbody></table></div>
      <p class="legend">Suspension figures count from the bass: 4-3, 7-6, 9-8; in a 2-3 the bass is suspended.</p>`;
  }

  // ---------- lesson examples (scale indexes over chords; each chord = 2 beats) ----------
  const ex = (H, k, prog, mel, o = {}) => {
    const notes = mel.map(([i, q, tag, tie]) => ({ k: [H.nmO(dn(H, k, i))], q, tag: tag || undefined, hl: !!tag, tie: !!tie }));
    const bass = prog.map(([d, q]) => { const c = H.diat(k, d); return { k: H.lh(c), q: q || 2, lab: H.rnOf(k, d), sym: o.sym === false ? null : c.sym }; });
    return { type: "score", vf: k.vf, sig: k.sig, time: o.time || "4/4", bpm: o.bpm || 80, bars: H.toBars({ t: [notes], b: [bass] }) };
  };
  const lesson = { defMode: "major", steps: [
    { title: "Chord tones and non-chord tones", kick: "Consonance and dissonance", keyed: "major", render: (H, k, U) => {
      const sp = ex(H, k, [[1, 4], [5, 4], [1, 4]], [[2, 1], [3, 1, "PT"], [4, 1], [5, 1, "NT"], [4, 1], [5, 1, "PT"], [6, 2], [7, 4]]);
      return `<p>Most harmony is built from triads (or seventh chords), but not every note in the music belongs to the chord that's sounding. A <b>non-chord tone</b> is a pitch outside the three (or four) tones of the current chord. Another name for it is a <b>dissonance</b> or <b>dissonant tone</b>; a chord tone may be called a <b>consonance</b>.</p>`
        + U.fig(sp, "Circled notes don't belong to the chord below them. Chord symbols above, Roman numerals below.")
        + `<p>Non-chord tones can be in the accompaniment too (usually when it has melodic activity of its own), but mostly they're a matter of melody.</p>`;
    } },
    { title: "How to find them", kick: "Spell each chord", keyed: "major", render: (H, k, U) => {
      return `<ol><li><b>Find the chords.</b> In a lead sheet they're given. In fully notated music, first find the <b>harmonic rhythm</b> (the rate at which chords change), then decide which chord best represents each span.</li>
        <li><b>Spell each chord</b> and compare its tones with the melody notes above it.</li>
        <li>Any melody note that isn't in the chord is a non-chord tone. <b>Label it</b> by how it is approached and left.</li></ol>
        <div class="callout"><b>Let style guide you</b>Is something an incomplete iii or a V? In most cases, V. In classical and folk music, chord 7ths are usually dissonances except on the dominant chord; in jazz, 7ths (and extensions) are usually chord tones.</div>`
        + H.check(`In ${k.label}, the chord is ${H.diat(k, 5).sym} and the melody note is ${H.nm(dn(H, k, 0))}. Is it a chord tone?`, "No", ["Yes"], `${H.diat(k, 5).sym} is ${H.diat(k, 5).tones.map(H.nm).join("–")}, so ${H.nm(dn(H, k, 0))} is a non-chord tone.`);
    } },
    { title: "Step, leap or hold", kick: "Approach and resolution", render: (H) => {
      return `<p>Non-chord tones are named by how they are <b>approached</b> (from the note before) and <b>resolved</b> or left (to the note after): by <b>step</b>, by <b>leap</b>, or by <b>hold</b> (the same note, held or repeated). Notes approached and left by step sound the most “natural.”</p>${reference(H)}`;
    } },
    { title: "Passing and neighbor tones", kick: "Step in, step out", keyed: "major", render: (H, k, U) => {
      const pt = ex(H, k, [[1], [1]], [[0, 1], [1, 1, "PT"], [2, 2]], { sym: true }), nt = ex(H, k, [[1], [1]], [[4, 1], [5, 1, "NT"], [4, 2]]);
      return `<p>The most common non-chord tones are stepped into and out of.</p><div class="lfigs">${U.fig(pt, "<b>Passing tone (PT)</b>: step, then step in the <i>same</i> direction, filling in the gap between two chord tones.", { small: true })}${U.fig(nt, "<b>Neighbor tone (NT)</b>: step away, then step back to the same note.", { small: true })}</div>`
        + H.check("A melody goes E – F – G over a C chord. What is F?", "Passing tone", ["Neighbor tone", "Appoggiatura", "Escape tone"], "Step up, then step up again: a passing tone.");
    } },
    { title: "Appoggiaturas and escape tones", kick: "One leap, one step", keyed: "major", render: (H, k, U) => {
      const app = ex(H, k, [[1], [4]], [[2, 1], [4, 1], [6, 1, "APP"], [5, 1]]), et = ex(H, k, [[5], [1]], [[6, 1], [5, 1, "ET"], [7, 2]]);
      return `<div class="lfigs">${U.fig(app, "<b>Appoggiatura (APP)</b>: <i>leap</i> to the dissonance, then <i>step</i> to a chord tone, usually in the opposite direction. Often on a strong beat.", { small: true })}${U.fig(et, "<b>Escape tone (ET)</b>: <i>step</i> to the dissonance, then <i>leap</i> away to a chord tone, usually in the opposite direction.", { small: true })}</div>`
        + H.check("Approached by leap, left by step:", "Appoggiatura", ["Escape tone", "Passing tone", "Anticipation"], "Leap in, step out.");
    } },
    { title: "Suspensions and retardations", kick: "Held over", keyed: "major", render: (H, k, U) => {
      const sus = ex(H, k, [[4], [1]], [[7, 1], [5, 1, null, true], [5, 1, "SUS"], [4, 1]]), ret = ex(H, k, [[5], [1]], [[8, 1], [6, 1, null, true], [6, 1, "RET"], [7, 1]]);
      return `<p>A <b>suspension (SUS)</b> is a note held over (or repeated) from the previous chord into a new one, where it is dissonant, then resolved <b>down by step</b>. It has three phases:</p>
        <ol><li><b>Preparation</b>: the note is a consonant member of the previous chord.</li><li><b>Suspension</b>: the chord changes while the note holds, making a dissonance.</li><li><b>Resolution</b>: the suspended note steps down to a consonance.</li></ol>
        <div class="lfigs">${U.fig(sus, "<b>Suspension</b>: tied into the new chord, then down a step.", { small: true })}${U.fig(ret, "<b>Retardation (RET)</b>: the same, but it resolves <i>up</i> by step.", { small: true })}</div>`;
    } },
    { title: "Suspension figures", kick: "4-3, 9-8, 7-6, 2-3", keyed: "major", render: (H, k, U) => {
      const two = (top, bot) => ({ type: "score", vf: k.vf, sig: k.sig, time: "4/4", bpm: 70, bars: H.toBars({ t: [top.map(([i, q, tie, tag]) => ({ k: [H.nmO(dn(H, k, i))], q, tie, tag, hl: !!tag }))], b: [bot.map(([i, q, tie, tag]) => ({ k: [H.nmO(dn(H, k, i))], q, tie, tag, hl: !!tag }))] }) });
      const f43 = two([[7, 4, true], [7, 2, false, "4"], [6, 2, false, "3"]], [[-7, 4], [-10, 4]]);
      const f98 = two([[8, 4, true], [8, 2, false, "9"], [7, 2, false, "8"]], [[-10, 4], [-7, 4]]);
      const f76 = two([[8, 4, true], [8, 2, false, "7"], [7, 2, false, "6"]], [[-10, 4], [-5, 4]]);
      const f23 = two([[4, 4], [8, 4]], [[0, 4, true], [0, 2, false, "2"], [-1, 2, false, "3"]].map(([i, q, t, g]) => [i - 7, q, t, g]));
      return `<p>Suspensions are often labeled with two numbers: the interval from the <b>bass</b> to the suspended note, then to its resolution (compound intervals are usually reduced, except the 9-8).</p>
        <div class="lfigs">${U.fig(f43, "<b>4-3</b>", { small: true })}${U.fig(f98, "<b>9-8</b>", { small: true })}${U.fig(f76, "<b>7-6</b>", { small: true })}${U.fig(f23, "<b>2-3</b>: the <i>bass</i> is suspended (the inversion of a 7-6)", { small: true })}</div>
        <p class="note">Real music complicates things: the bass may move at the moment of resolution, or the resolution may be ornamented. A lead sheet implies a bass line, so you can label suspensions there too: with no slash bass, the chord is in root position.</p>`;
    } },
    { title: "Anticipations", kick: "Arriving early", keyed: "major", render: (H, k, U) => {
      const ant = ex(H, k, [[5], [1]], [[6, 1], [7, 1, "ANT"], [7, 2]]), ha = ex(H, k, [[2], [5], [1, 4]], [[3, 1], [5, 1], [6, 1], [9, 1, "HA"], [7, 4]]);
      return `<div class="lfigs">${U.fig(ant, "<b>Anticipation (ANT)</b>: a note of the next chord arrives early, then repeats (or holds) when the chord changes. Often a side effect of syncopation.", { small: true })}${U.fig(ha, "<b>Harmonic anticipation (HA)</b>: anticipates a note of the next chord, but not the next melody note: it leaps to a different chord tone.", { small: true })}</div>`;
    } },
    { title: "Double neighbors and pedal tones", kick: "Around and under", keyed: "major", render: (H, k, U) => {
      const dnx = { type: "score", vf: k.vf, sig: k.sig, time: "4/4", bpm: 80, bars: H.toBars({ t: [[[4, 1], [5, .5, "DN"], [3, .5, "DN"], [4, 2]].map(([i, q, tag]) => ({ k: [H.nmO(dn(H, k, i))], q, tag, hl: !!tag }))], b: [[{ k: H.lh(H.diat(k, 1)), q: 4, lab: "I", sym: H.diat(k, 1).sym }]] }) };
      const t0 = dn(H, k, -14), ped = { type: "score", vf: k.vf, sig: k.sig, time: "4/4", bpm: 80, bars: H.toBars({ t: [[1, 4, 5, 1].map(d => ({ k: H.lh(H.diat(k, d), 60), q: 2, sym: H.diat(k, d).sym }))], b: [[{ k: [H.nmO(H.N(t0.l, t0.a, H.midi(H.N(t0.l, t0.a, 2)) < 40 ? 3 : 2))], q: 4, tie: true }, { k: [H.nmO(H.N(t0.l, t0.a, H.midi(H.N(t0.l, t0.a, 2)) < 40 ? 3 : 2))], q: 4, tag: "PED" }]] }) };
      return `<div class="lfigs">${U.fig(dnx, "<b>Double neighbor (DN)</b>, or <b>changing tones</b>: two non-chord tones surround the note they resolve to, one on each side.", { small: true })}${U.fig(ped, "<b>Pedal tone (PED)</b>: a held or repeated note (usually in the bass) that persists while the chords change; it's dissonant whenever it isn't in the chord above.", { small: true })}</div>
        <p>Imagine a phrase in E minor whose lowest voice holds E throughout. It works as a chord tone under every chord except the B7, where it becomes a pedal-tone dissonance.</p>`;
    } },
    { title: "Locate and label", kick: "Put it together", keyed: "major", render: (H, k, U) => {
      const sp = ex(H, k, [[1], [6], [4], [5], [1, 4]], [[7, 1], [6, 1, "PT"], [5, 1], [6, 1, "NT"], [5, 1], [5, 1, null, true], [5, 1, "SUS"], [4, 1], [7, 4]]);
      return `<p>A full example: chord by chord, compare the melody with each chord's tones. Then name each non-chord tone by its approach and resolution.</p>`
        + U.fig(sp, "A passing tone, a neighbor tone and a 9-8 suspension: the note tied into the V chord is a 9th above its bass and resolves down by step.")
        + H.check("The note tied into the V chord resolves down by step. What is it?", "Suspension", ["Retardation", "Anticipation", "Pedal tone"], "Prepared, held into the new chord, resolved down by step.")
        + H.check("Approached by step, left by leap:", "Escape tone", ["Appoggiatura", "Passing tone", "Double neighbor"], "Step in, leap out.")
        + H.check("Held over and resolved UP by step:", "Retardation", ["Suspension", "Anticipation", "Neighbor tone"], "A suspension resolves down; a retardation resolves up.");
    } },
  ] };

  return {
    key: "silverapps-nct-v1", lesson, make, reference,
    modes: [{ id: "name", kicker: "Name it" }, { id: "find", kicker: "Find it" }, { id: "sus", kicker: "Suspension figures" }, { id: "def", kicker: "Definitions" }],
    topics: [{ id: "step", name: "Step-based (PT, NT, DN)", group: "t" }, { id: "leap", name: "One leap (APP, ET)", group: "t" }, { id: "held", name: "Held and early (SUS, RET, ANT, HA)", group: "t" }],
  };
})();
