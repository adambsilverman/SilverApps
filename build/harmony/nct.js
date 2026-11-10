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
    // accompaniment on a grand staff: the bass note in the left hand, the three chord tones in close position in the right hand
    const acc = rhSeq(H, x.prog.map(d => H.diat(k, d)));
    const rh = acc.map(v => ({ k: v.rh, q: 2 })), lh = x.prog.map((d, i) => { const c = H.diat(k, d); return { k: [acc[i].bass], q: 2, sym: o.sym === false ? null : c.sym }; });
    return { type: "score", clefs: ["treble", "treble", "bass"], ids: ["m", "t", "b"], names: ["melody staff", "right hand", "left hand"], tagSide: true, symSize: 20, rowW: 820, vf: k.vf, sig: k.sig, time: "4/4", bpm: 84, bars: H.toBars({ m: [mel], t: [rh], b: [lh] }) };
  }
  // right hand: the triad's three tones in close position (lowest note G3–F4, top note at most D5), each chord moving as little as possible from the last; left hand: the root, F2–E3
  function rhSeq(H, chords) {
    let prev = null;
    return chords.map(c => {
      const b = c.tones[0]; let o = 2; while (H.midi(H.N(b.l, b.a, o)) < 41) o++; while (H.midi(H.N(b.l, b.a, o)) >= 53) o--;
      const tones = c.tones.slice(0, 3), cands = [];
      tones.forEach((_, r) => { const order = tones.slice(r).concat(tones.slice(0, r));
        for (let oo = 3; oo <= 4; oo++) { const v = [H.N(order[0].l, order[0].a, oo)];
          for (let i = 1; i < 3; i++) { let y = H.N(order[i].l, order[i].a, v[i - 1].o); while (H.midi(y) <= H.midi(v[i - 1])) y = H.N(y.l, y.a, y.o + 1); v.push(y); }
          if (H.midi(v[0]) >= 55 && H.midi(v[0]) <= 65 && H.midi(v[2]) <= 74) cands.push(v); } });
      const cost = v => prev ? v.reduce((t, n, i) => t + Math.abs(H.midi(n) - H.midi(prev[i])), 0) : Math.abs(H.midi(v[1]) - 64);
      const best = cands.sort((p, q) => cost(p) - cost(q))[0]; prev = best;
      return { bass: H.nmO(H.N(b.l, b.a, o)), rh: best.map(H.nmO) };
    });
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
      const nn = H.nm(dn(H, x.k, n.i)), why = `In ${x.k.label}, the chord there is ${c.sym} (${c.tones.map(H.nm).join("–")}), so ${nn} is not a chord tone. It's approached by ${HOW[want][0]} and left by ${HOW[want][1]}: ${NAME[want].toLowerCase()} (${want}).`;
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
  // every lesson example: melody staff (with the non-chord tones) over a grand staff (three close-position chord tones in the right hand, the root in the left)
  const ex = (H, k, prog, mel, o = {}) => {
    const notes = mel.map(([i, q, tag, tie]) => ({ k: (Array.isArray(i) ? i : [i]).map(j => H.nmO(dn(H, k, j))), q, tag: tag || undefined, hl: !!tag, tie: !!tie }));
    const acc = rhSeq(H, prog.map(([d]) => H.diat(k, d)));
    const rh = prog.map(([d, q], i) => ({ k: acc[i].rh, q: q || 2 })), lh = prog.map(([d, q], i) => ({ k: o.ped ? [o.ped] : [acc[i].bass], q: q || 2, tie: !!o.ped && i < prog.length - 1, lab: o.ped && i === 0 ? "PED" : undefined, sym: o.sym === false ? null : H.diat(k, d).sym }));
    return { type: "score", clefs: ["treble", "treble", "bass"], ids: ["m", "t", "b"], names: ["melody staff", "right hand", "left hand"], tagSide: true, evenBars: true, symSize: 20, rowW: o.rowW || 820, vf: k.vf, sig: k.sig, time: o.time || "4/4", bpm: o.bpm || 80, bars: H.toBars({ m: [notes], t: [rh], b: [lh] }) };
  };
  // two-staff example for suspensions: top / bottom = [[scale index (or array), quarters, tie, figure tag]]
  const two = (H, k, top, bot, bpm = 72) => { const v = a => a.map(([i, q, tie, tag]) => ({ k: (Array.isArray(i) ? i : [i]).map(j => H.nmO(dn(H, k, j))), q, tie, tag, hl: !!tag })); return { type: "score", vf: k.vf, sig: k.sig, time: "4/4", bpm, bars: H.toBars({ t: [v(top)], b: [v(bot)] }) }; };
  const NEWEX = ["PT", "NT", "APP", "ET", "SUS", "RET", "ANT", "DN"];
  const lesson = { defMode: "major", steps: [
    { title: "Recap", kick: "Start with the Introduction", keyed: "major", render: (H, k) => `
      <p>This lesson picks up where <a href="introduction-to-non-chord-tones-lesson.html"><b>Introduction to Non-Chord Tones</b></a> leaves off. There you met each type in real music (“As Time Goes By,” Tchaikovsky, Bruckner, Brahms). Here every example is generated <b>in any key</b> (pick one above) and can be played, so you can compare similar types side by side and then meet the trickier cases.</p>
      <p>The routine is the same: find the chords, spell each one, compare the melody, and name each non-chord tone by how it is <b>approached</b> and <b>left</b>.</p>${reference(H)}`
      + H.check(`In ${k.label}, the chord is ${H.diat(k, 5).sym} and the melody note is ${H.nm(dn(H, k, 0))}. Is it a chord tone?`, "No", ["Yes"], `${H.diat(k, 5).sym} is ${H.diat(k, 5).tones.map(H.nm).join("–")}, so ${H.nm(dn(H, k, 0))} is a non-chord tone.`) },
    { title: "Passing vs. neighbor", kick: "Both step in and step out", keyed: "major", render: (H, k, U) => {
      const pt = ex(H, k, [[1], [1]], [[0, 1], [1, 1, "PT"], [2, 2]], { sym: true }), nt = ex(H, k, [[1], [1]], [[4, 1], [5, 1, "NT"], [4, 2]]);
      return `<p>Both are stepped into and out of. The difference is <b>direction</b>: a passing tone keeps going; a neighbor tone turns back.</p><div class="lfigs">${U.fig(pt, "<b>Passing tone (PT)</b>: step, then step in the <i>same</i> direction, filling the gap between two chord tones.", { small: true })}${U.fig(nt, "<b>Neighbor tone (NT)</b>: step away, then step <i>back</i> to the same note (upper or lower neighbor).", { small: true })}</div>`
        + H.check(`A melody goes ${[0, 1, 2].map(i => H.nm(dn(H, k, i))).join(" – ")} over ${H.diat(k, 1).sym}. What is ${H.nm(dn(H, k, 1))}?`, "Passing tone", ["Neighbor tone", "Appoggiatura", "Escape tone"], "Step up, then step up again: a passing tone.")
        + H.check(`A melody goes ${[4, 5, 4].map(i => H.nm(dn(H, k, i))).join(" – ")} over ${H.diat(k, 1).sym}. What is ${H.nm(dn(H, k, 5))}?`, "Neighbor tone", ["Passing tone", "Suspension", "Escape tone"], "Step up, then step back down: a neighbor tone.");
    } },
    { title: "Appoggiatura vs. escape tone", kick: "One leap, one step", keyed: "major", render: (H, k, U) => {
      const app = ex(H, k, [[1], [4]], [[2, 1], [4, 1], [6, 1, "APP"], [5, 1]]), et = ex(H, k, [[5], [1]], [[6, 1], [5, 1, "ET"], [7, 2]]);
      return `<p>Each has one leap and one step; they are mirror images. Ask <b>which side the leap is on</b>.</p><div class="lfigs">${U.fig(app, "<b>Appoggiatura (APP)</b>: <i>leap</i> in, <i>step</i> out (usually in the opposite direction). Often on a strong beat.", { small: true })}${U.fig(et, "<b>Escape tone (ET)</b>: <i>step</i> in, <i>leap</i> out (usually in the opposite direction). Usually on a weak beat.", { small: true })}</div>`
        + H.check("Approached by leap, left by step:", "Appoggiatura", ["Escape tone", "Passing tone", "Anticipation"], "Leap in, step out.")
        + H.check("Approached by step, left by leap:", "Escape tone", ["Appoggiatura", "Neighbor tone", "Retardation"], "Step in, leap out.");
    } },
    { title: "Accented and unaccented", kick: "Where the dissonance falls", keyed: "major", render: (H, k, U) => {
      const upt = ex(H, k, [[1], [5]], [[2, 1], [3, 1, "PT"], [4, 1], [6, 1]], { sym: true }), apt = ex(H, k, [[1], [2]], [[4, 1], [7, 1], [6, 1, "PT"], [5, 1]], { sym: true });
      const ant = ex(H, k, [[1], [4]], [[4, 1], [7, 1], [8, 1, "NT"], [7, 1]], { sym: true });
      return `<p>Most passing and neighbor tones are <b>unaccented</b>: they fall between the beats or on a weak beat, after the chord has already sounded. An <b>accented</b> non-chord tone lands on a strong beat, often right as the chord changes, so the dissonance is heard first and the chord tone arrives a moment later. Accented non-chord tones sound more expressive.</p>
        <div class="lfigs">${U.fig(upt, "<b>Unaccented passing tone</b>: on a weak beat, inside one chord.", { small: true })}${U.fig(apt, `<b>Accented passing tone</b>: on the downbeat of ${H.diat(k, 2).sym}, where the chord changes.`, { small: true })}${U.fig(ant, `<b>Accented neighbor tone</b>: the upper neighbor sounds as ${H.diat(k, 4).sym} arrives.`, { small: true })}</div>
        <p class="note">An appoggiatura is usually accented too, which is why some books describe it as an accented incomplete neighbor.</p>`
        + H.check("An accented non-chord tone falls…", "on a strong beat, often as the chord changes", ["between beats, after the chord has sounded", "only in the bass", "only at cadences"], "Accented: the dissonance arrives with the beat.");
    } },
    { title: "Suspension, retardation, anticipation", kick: "Held over or early", keyed: "major", render: (H, k, U) => {
      const sus = ex(H, k, [[4], [1]], [[7, 1], [5, 1, null, true], [5, 1, "SUS"], [4, 1]]), ret = ex(H, k, [[5], [1]], [[8, 1], [6, 1, null, true], [6, 1, "RET"], [7, 1]]), ant = ex(H, k, [[5], [1]], [[6, 1], [7, 1, "ANT"], [7, 2]]);
      return `<p>All three involve the <b>same note</b> on one side. A suspension and a retardation are <b>late</b>: the note is held from the previous chord (preparation), clashes with the new chord, then resolves by step. An anticipation is <b>early</b>: the note belongs to the next chord and arrives before it.</p>
        <div class="lfigs">${U.fig(sus, "<b>Suspension (SUS)</b>: held over, then <i>down</i> by step.", { small: true })}${U.fig(ret, "<b>Retardation (RET)</b>: held over, then <i>up</i> by step.", { small: true })}${U.fig(ant, "<b>Anticipation (ANT)</b>: the next chord's note, early, then repeated.", { small: true })}</div>`
        + H.check("Held over and resolved UP by step:", "Retardation", ["Suspension", "Anticipation", "Neighbor tone"], "A suspension resolves down; a retardation resolves up.");
    } },
    { title: "Anticipation vs. harmonic anticipation", kick: "Arriving early", keyed: "major", render: (H, k, U) => {
      const ant = ex(H, k, [[5], [1]], [[6, 1], [7, 1, "ANT"], [7, 2]]), ha = ex(H, k, [[2], [5], [1, 4]], [[3, 1], [5, 1], [6, 1], [9, 1, "HA"], [7, 4]]);
      return `<div class="lfigs">${U.fig(ant, "<b>Anticipation (ANT)</b>: a note of the next chord arrives early, then repeats (or holds) when the chord changes. Often a side effect of syncopation.", { small: true })}${U.fig(ha, "<b>Harmonic anticipation (HA)</b>: it anticipates a note of the next chord, but the melody then leaps to a <i>different</i> note of that chord.", { small: true })}</div>`
        + H.check("An anticipation that leaps to a different tone of the chord it anticipated is…", "a harmonic anticipation", ["an escape tone", "a suspension", "a pedal tone"], "It still belongs to the next chord, but the melody doesn't stay on it.");
    } },
    { title: "Suspension figures", kick: "4-3, 9-8, 7-6, 2-3", keyed: "major", render: (H, k, U) => {
      const f43 = two(H, k, [[7, 4, true], [7, 2, false, "4"], [6, 2, false, "3"]], [[-7, 4], [-10, 4]]);
      const f98 = two(H, k, [[8, 4, true], [8, 2, false, "9"], [7, 2, false, "8"]], [[-10, 4], [-7, 4]]);
      const f76 = two(H, k, [[8, 4, true], [8, 2, false, "7"], [7, 2, false, "6"]], [[-10, 4], [-5, 4]]);
      const f23 = two(H, k, [[4, 4], [8, 4]], [[0, 4, true], [0, 2, false, "2"], [-1, 2, false, "3"]].map(([i, q, t, g]) => [i - 7, q, t, g]));
      return `<p>Suspensions are labeled with two numbers: the interval from the <b>bass</b> to the suspended note, then to its resolution (compound intervals are reduced, except the 9-8).</p>
        <div class="lfigs">${U.fig(f43, "<b>4-3</b>", { small: true })}${U.fig(f98, "<b>9-8</b>", { small: true })}${U.fig(f76, "<b>7-6</b>", { small: true })}${U.fig(f23, "<b>2-3</b>: the <i>bass</i> is suspended (the inversion of a 7-6)", { small: true })}</div>`;
    } },
    { title: "When suspensions get complicated", kick: "Moving bass, ornaments, chains", keyed: "major", render: (H, k, U) => {
      const orn = two(H, k, [[7, 4, true], [7, 1, false, "4"], [5, 1], [6, 2, false, "3"]], [[-7, 4], [-10, 4]]);
      const mov = two(H, k, [[7, 4, true], [7, 2, false, "4"], [6, 2, false, "6"]], [[-7, 4], [-10, 2], [-6, 2]]);
      const b = -2, chain = two(H, k, [[b + 5, 2], [b + 5, 2, true], [b + 5, 2, false, "7"], [b + 4, 2, true, "6"], [b + 4, 2, false, "7"], [b + 3, 2, true, "6"], [b + 3, 2, false, "7"], [b + 2, 2, false, "6"]], [[b - 7, 4], [b - 8, 4], [b - 9, 4], [b - 10, 4]], 80);
      return `<p>Real suspensions are rarely as tidy as the textbook figures.</p>
        <div class="lfigs">${U.fig(orn, "<b>Ornamented resolution</b>: the 4 dips to a lower note before it resolves to 3. Label the suspension by where it finally lands.", { small: true })}${U.fig(mov, "<b>The bass moves at the resolution</b>: the 4 resolves as the bass moves up a 5th, so the resolution is a 6th above the new bass: a 4-6.", { small: true })}</div>
        ${U.fig(chain, "<b>A chain of suspensions</b>: each resolution is held over into the next bar and becomes the next preparation, over a bass that steps down: 7-6, 7-6, 7-6.")}`
        + H.check("In a chain of 7-6 suspensions, each resolution…", "becomes the preparation of the next suspension", ["leaps to the bass", "is a pedal tone", "resolves up by step"], "Resolve, hold over, clash, resolve again.");
    } },
    { title: "Several at once", kick: "Thirds, inner voices and inverted pedals", keyed: "major", render: (H, k, U) => {
      const thirds = ex(H, k, [[1], [1]], [[[2, 7], 1], [[3, 8], 1, "PT"], [[4, 9], 2]]);
      const inv = ex(H, k, [[1], [2], [4], [1]], [[4, 2, null, true], [4, 2, "PED", true], [4, 2, "PED", true], [4, 2]]);
      return `<p>Non-chord tones often travel in pairs. Two voices moving in parallel 3rds or 6ths produce two passing tones at once; each one is labeled separately. They can also appear in inner voices, not just the melody.</p>
        <div class="lfigs">${U.fig(thirds, "<b>Double passing tones in 6ths</b>: both notes on beat 2 are passing tones.", { small: true })}${U.fig(inv, `<b>Inverted pedal</b>: a held note in an upper voice (here the 5th scale degree) while the chords change below; it clashes with ${H.diat(k, 2).sym} and ${H.diat(k, 4).sym}.`, { small: true })}</div>`
        + H.check("A pedal tone held in the melody rather than the bass is called…", "an inverted pedal", ["a retardation", "a double neighbor", "an anticipation"], "Inverted (or upper) pedal: same note, same note, in an upper voice.");
    } },
    { title: "Double neighbors and pedal tones", kick: "Around and under", keyed: "major", render: (H, k, U) => {
      const dnx = ex(H, k, [[1, 4], [5, 2], [1, 2]], [[4, 1], [5, 1, "DN"], [3, 1, "DN"], [4, 1], [6, 1], [4, 1], [2, 2]]);
      const t0 = dn(H, k, -14), ped = ex(H, k, [[1], [4], [5], [1]], [[7, 2], [5, 2], [6, 2], [7, 2]], { ped: H.nmO(H.N(t0.l, t0.a, H.midi(H.N(t0.l, t0.a, 2)) < 40 ? 3 : 2)) });
      return `${U.fig(dnx, "<b>Double neighbor (DN)</b>, or <b>changing tones</b>: two non-chord tones surround the note they resolve to, one on each side (often an ET followed by an APP).")}${U.fig(ped, "<b>Pedal tone (PED)</b>: a held or repeated bass note that persists while the chords change; it's dissonant whenever it isn't in the chord above.")}`;
    } },
    { title: "Locate and label", kick: "A new example every time", render: () => `
      <p>Find the chords, compare the melody, and name the non-chord tone (or tones). Then show the labels to check. Each press of <b>New example</b> makes a new phrase in a new key.</p>
      <div class="lfig nct-gen"><div class="lbtns"><button class="lk" data-ngen>New example</button><button class="play" data-nplay><svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M2 1l9 5-9 5z"/></svg>Play</button><button class="lk" data-nshow aria-pressed="false">Show the labels</button></div>
        <div class="staff wide" role="img" aria-label="A melody over chords"></div><p class="nct-gen-ans" aria-live="polite"></p></div>
      <p>For unlimited practice by type, use the <a href="non-chord-tones.html">Non-Chord Tones drills</a>.</p>`,
      after: (root, H, k, tools) => {
        const box = root.querySelector(".nct-gen"); if (!box) return; let x = null, shown = false;
        const draw = () => { const st = box.querySelector(".staff"); tools.drawStaff(st, spec(H, x, shown ? { tags: true, hl: true } : { hl: false }));
          st.setAttribute("aria-label", `A two-bar melody in ${x.k.label} over ${x.prog.map(d => H.diat(x.k, d).sym).join(", ")}.`);
          box.querySelector("[data-nshow]").setAttribute("aria-pressed", shown);
          box.querySelector(".nct-gen-ans").innerHTML = shown ? `${x.ncts.map(a => `${H.nm(dn(H, x.k, x.notes[a].i))}: <b>${NAME[x.lab[a]]}</b> (${x.lab[a]})`).join("; ")}.` : ""; };
        const fresh = () => { for (let t = 0; t < 20 && !x; t++) x = gen(H, H.rnd(NEWEX)); };
        box.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return;
          if (b.hasAttribute("data-ngen")) { x = null; fresh(); shown = false; draw(); }
          else if (b.hasAttribute("data-nshow")) { shown = !shown; draw(); }
          else if (b.hasAttribute("data-nplay") && x) H.play(H.scorePlay(spec(H, x))); });
        fresh(); draw();
      } },
  ] };

  return {
    key: "silverapps-nct-v1", lesson, make, reference,
    modes: [{ id: "name", kicker: "Name it" }, { id: "find", kicker: "Find it" }, { id: "sus", kicker: "Suspension figures" }, { id: "def", kicker: "Definitions" }],
    topics: [{ id: "step", name: "Step-based (PT, NT, DN)", group: "t" }, { id: "leap", name: "One leap (APP, ET)", group: "t" }, { id: "held", name: "Held and early (SUS, RET, ANT, HA)", group: "t" }],
  };
})();
