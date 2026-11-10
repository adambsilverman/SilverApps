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
  // ===== lesson: Adam's real-music examples first (images + recordings in assets/img|audio/nct-intro), generated any-key examples second =====
  const tbl = (cap, head, rows) => `<div class="ltable-wrap"><table class="ltable"><caption class="sr">${cap}</caption><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => i ? `<td>${c}</td>` : `<th scope="row">${c}</th>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  const IMG = (f, alt) => `<img src="assets/img/nct-intro/${f}" alt="${alt}" loading="lazy" style="width:100%;height:auto;background:#fff;border-radius:8px">`;
  const AUD = (f, label) => `<audio controls preload="none" src="assets/audio/nct-intro/${f}.mp3" aria-label="${label}" style="width:100%"></audio>`;
  const FIG = (inner, cap) => `<figure class="lfig nci-fig">${inner}<figcaption>${cap}</figcaption></figure>`;
  const ANYKEY = `<h3 class="nci-any">Compare them in any key</h3><p class="note">Generated examples: use the key buttons at the top of this step, and press Play.</p>`;
  // Dooley Wilson as Sam in Casablanca (1942): "Sing it, Sam" through "a sigh is just a sigh"
  const ATGB = `<div class="lvideo"><iframe src="https://www.youtube-nocookie.com/embed/Do2olZ49M54?start=26&amp;end=44" title="As Time Goes By, from Casablanca (YouTube)" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`;
  const ATGB_CAP = `Herman Hupfeld, “As Time Goes By” (1931), sung by Dooley Wilson as Sam in <i>Casablanca</i> (1942). The clip plays from “You must remember this” to “a sigh is just a sigh.”`;
  // image stepper: buttons swap one image for the next stage of the analysis
  const SW = (id, stages, cap) => `<figure class="lfig nci-fig" data-sw="${id}">
      <div class="lbtns" role="group" aria-label="Analysis stage">${stages.map(([lab], i) => `<button class="lk" data-swb="${i}" aria-pressed="${i === 0}">${lab}</button>`).join("")}</div>
      ${stages.map(([, f, alt], i) => `<div data-swi="${i}"${i ? " hidden" : ""}>${IMG(f, alt)}</div>`).join("")}
      <figcaption>${cap}</figcaption></figure>`;
  const wireSW = root => root.querySelectorAll("[data-sw]").forEach(fg => fg.addEventListener("click", e => { const b = e.target.closest("[data-swb]"); if (!b) return;
    fg.querySelectorAll("[data-swb]").forEach(x => x.setAttribute("aria-pressed", x === b)); fg.querySelectorAll("[data-swi]").forEach(x => x.hidden = x.dataset.swi !== b.dataset.swb); }));
  const ANS = (q, a, qalt, aalt, cap, aud) => `<figure class="lfig nci-fig">${IMG(q, qalt)}${aud ? AUD(aud[0], aud[1]) : ""}<figcaption>${cap}</figcaption>
      <details class="nci-ans"><summary>Show the answer key</summary>${IMG(a, aalt)}</details></figure>`;

  // ---- the "name that tone" finder: how a non-chord tone is approached and left ----
  const APPR = { step: "By step", leap: "By leap", same: "By the same note (held or repeated)" };
  const LEAVE = { step: { same: "Step in the same direction", opp: "Step back (opposite direction)", leap: "Leap", hold: "Same note" },
    leap: { step: "Step", leap: "Leap", hold: "Same note" }, same: { down: "Step down", up: "Step up", hold: "Same note", leap: "Leap" } };
  const RES = {
    "step.same": ["Passing tone (PT)", "Fills in the space between two chord tones, moving in one direction."],
    "step.opp": ["Neighbor tone (NT)", "Steps away from a chord tone and back to it. Upper or lower."],
    "step.leap": ["Escape tone (ET)", "Steps away, then leaps (usually in the opposite direction). An ET followed by an APP around one target is a double neighbor (DN)."],
    "step.hold": ["Anticipation (ANT)", "Arrives early: the next chord makes it a chord tone. If it leaps to a different tone of that chord instead, it is a harmonic anticipation (HA)."],
    "leap.step": ["Appoggiatura (APP)", "Leaps in, usually on a strong beat, and resolves by step (usually in the opposite direction)."],
    "leap.leap": ["Not a standard type", "Leaped to and from: check again whether it is really a chord tone, perhaps a chord seventh or extension."],
    "leap.hold": ["Anticipation (ANT)", "Leaps in early and is held into the chord it belongs to."],
    "same.down": ["Suspension (SUS)", "Held over from the previous chord (preparation), dissonant when the harmony changes (suspension), then steps down (resolution)."],
    "same.up": ["Retardation (RET)", "A suspension that resolves up instead of down."],
    "same.hold": ["Pedal tone (PED)", "A note held (or repeated), usually in the bass, while the harmonies above it change."],
    "same.leap": ["Not a standard type", "A held note that leaps away is usually a chord tone of the new chord. Check the harmony again."] };
  const finder = () => `<div class="nci-finder" role="group" aria-labelledby="nciFindH">
      <h3 id="nciFindH">Name that tone</h3>
      <p class="nci-lab" id="nciA">How is the non-chord tone approached?</p>
      <div class="lbtns" role="group" aria-labelledby="nciA">${Object.entries(APPR).map(([k, l]) => `<button class="lk" data-appr="${k}" aria-pressed="false">${l}</button>`).join("")}</div>
      <p class="nci-lab" id="nciL" hidden>How is it left?</p>
      <div class="lbtns" role="group" aria-labelledby="nciL" data-leave hidden></div>
      <div class="nci-res" aria-live="polite"></div></div>`;
  function wireFinder(root) {
    const box = root.querySelector(".nci-finder"); if (!box) return; let a = null;
    box.addEventListener("click", e => {
      const ap = e.target.closest("[data-appr]"), lv = e.target.closest("[data-lv]");
      if (ap) { a = ap.dataset.appr; box.querySelectorAll("[data-appr]").forEach(x => x.setAttribute("aria-pressed", x === ap));
        const L = box.querySelector("[data-leave]"); L.hidden = false; box.querySelector("#nciL").hidden = false; box.querySelector(".nci-res").innerHTML = "";
        L.innerHTML = Object.entries(LEAVE[a]).map(([k, l]) => `<button class="lk" data-lv="${k}" aria-pressed="false">${l}</button>`).join(""); }
      if (lv && a) { box.querySelectorAll("[data-lv]").forEach(x => x.setAttribute("aria-pressed", x === lv)); const [n, d] = RES[a + "." + lv.dataset.lv];
        box.querySelector(".nci-res").innerHTML = `<p><b>${n}</b>: ${d}</p>`; }
    });
  }

  // ---- Mozart, Requiem, "Domine Jesu," bars 43–46: find the suspensions, then measure them from the bass ----
  // note positions are in the original 2208 x 1188 score image (shown at any width, so stored as percentages)
  const MZ = [
    ["Tenors, bar 45, D", 261, 750, "S1"], ["Tenors, bar 45, C♯", 420, 760, "C♯ belongs to C♯ø7 (C♯–E–G–B♭). It is where the D above it resolves."], ["Tenors, bar 45, C♯", 516, 760, "A chord tone of C♯ø7."],
    ["Tenors, bar 45, G", 919, 719, "G is the 7th of A7: a chord tone. Keep an eye on it, though: it is held into the next bar."], ["Tenors, bar 45, G", 1078, 719, "Still the 7th of A7: a chord tone, and the preparation of what comes next."],
    ["Tenors, bar 46, G", 1223, 719, "S2"], ["Tenors, bar 46, F♯", 1452, 729, "F♯ is the 3rd of D7: the resolution of the G before it."],
    ["Tenors, bar 46, F", 1795, 729, "F is the 7th of G7: a chord tone."], ["Tenors, bar 46, F", 1947, 729, "A chord tone of G7."], ["Tenors, bar 46, F", 2061, 729, "A chord tone of G7."],
    ["Basses, bar 45, B♭", 375, 970, "B♭ is the 7th of C♯ø7: a chord tone."], ["Basses, bar 45, G", 516, 990, "G is the 5th of C♯ø7: a chord tone."],
    ["Basses, bar 45, A", 630, 980, "Not a suspension: this A is a passing tone, stepping from G up to B♭ in one direction."], ["Basses, bar 45, B♭", 718, 970, "A chord tone of C♯ø7."],
    ["Basses, bar 45, E", 805, 1010, "E is the 3rd of C♯ø7, and the bass named by the slash."], ["Basses, bar 45, A", 999, 979, "A is the root of A7."],
    ["Basses, bar 46, C", 1337, 959, "C is the 7th of D7: a chord tone."], ["Basses, bar 46, C", 1452, 959, "C is the 7th of D7: a chord tone."], ["Basses, bar 46, C", 1566, 959, "Still a chord tone of D7, and the preparation of what comes next."],
    ["Basses, bar 46, C", 1680, 959, "S3"], ["Basses, bar 46, B♮", 1851, 970, "B♮ is the 3rd of G7: the resolution of the C before it."], ["Basses, bar 46, B♮", 1947, 970, "A chord tone of G7."]];
  const SUSQ = {
    S1: { where: "Tenors, bar 45", fmt: "notation with chord symbols", sus: "D", res: "C♯", chord: "C♯ø7/E", opts: ["C♯", "E", "G", "D"], bass: "E", ladder: "EFGABCD", n: 7, r: 6, fig: "7-6",
      why: "The slash in C♯ø7/E names the bass: E. (On beat 1 the basses are resting; the orchestra plays the E.)", note: "Prepared as a chord tone of G minor in bar 44, held over the bar line, then down to C♯." },
    S2: { where: "Tenors, bar 46", fmt: "notation with chord symbols", sus: "G", res: "F♯", chord: "D7", opts: ["D", "F♯", "G", "C"], bass: "D", ladder: "DEFG", n: 4, r: 3, fig: "4-3",
      why: "D7 has no slash, so it is in root position: the bass is D.", note: "Prepared as the 7th of A7, repeated over the bar line, then down to F♯." },
    S3: { where: "Basses, bar 46", fmt: "notation with chord symbols", sus: "C", res: "B♮", chord: "G7", opts: ["C", "G", "B", "F"], bass: "G", ladder: "GABC", n: 4, r: 3, fig: "4-3",
      why: "G7 has no slash, so the bass is G: it lies below the singing basses (the orchestra plays it). The suspension is in the bass voice, but it is not the lowest note, so measure from G.", note: "Prepared as the 7th of D7, held into beat 3, then down to B♮." },
    S4: { where: "The Beatles, “You Never Give Me Your Money”", fmt: "lead sheet", sus: "E", res: "D", chord: "D7", opts: ["A", "D", "E", "C"], bass: "D", ladder: "DE", n: 9, r: 8, fig: "9-8",
      why: "A lead sheet implies the bass: D7 has no slash, so the bass is the root, D.", note: "Prepared as the 5th of Am7, held into D7 on “mo-ney,” then down to D.", ninth: 1 } };
  const MZPCT = ([, x, y]) => `left:${(x / 2208 * 100).toFixed(2)}%;top:${(y / 1188 * 100).toFixed(2)}%`;
  const mozartFind = () => `<div class="mz" role="group" aria-labelledby="mzH">
      <h3 id="mzH">Find the suspensions</h3>
      <p>W. A. Mozart, Requiem, “Domine Jesu,” bars 43–46 (tenors and basses; the orchestra is not shown). Recording: Les Arts Florissants, conducted by William Christie (Erato). Listen, then tap the notes in <b>bars 45–46</b> (the second system) that you think are suspensions. There are <b>three</b>.</p>
      ${AUD("mozart-domine", "Mozart, Requiem, Domine Jesu, bars 43 to 46")}
      <div class="mz-score">${IMG("mozart-domine.png", "Mozart, Requiem, Domine Jesu, bars 43 to 46 in G minor, tenors and basses with chord symbols: G minor, A diminished, D7, G minor; then C-sharp half-diminished 7 over E, A7, D7, G7. The notes of bars 45 and 46 are buttons.")}
        ${MZ.map((m, i) => `<button class="mz-n" style="${MZPCT(m)}" data-mz="${i}" aria-label="${m[0]}" aria-pressed="false"></button>`).join("")}</div>
      <p class="mz-fb" aria-live="polite">Found 0 of 3.</p>
      <div class="lbtns"><button class="lk" data-mzshow>Show the suspensions</button></div></div>`;
  const measure = () => `<div class="mm" role="group" aria-labelledby="mmH">
      <h3 id="mmH">Measure from the bass</h3>
      <p>A suspension figure counts the letter names from the <b>bass</b> up to the suspended note, then to its resolution. Pick a suspension:</p>
      <div class="lbtns" role="group" aria-label="Suspension">${Object.entries(SUSQ).map(([id, s], i) => `<button class="lk" data-mmpick="${id}" aria-pressed="${i === 0}">${s.where}</button>`).join("")}</div>
      <div class="mm-body" aria-live="polite"></div></div>`;
  function wireMozart(root) {
    const box = root.querySelector(".mz"); if (box) { const found = new Set(), fb = box.querySelector(".mz-fb");
      const mark = (i, show) => { const b = box.querySelector(`[data-mz="${i}"]`); b.classList.add("sus"); b.setAttribute("aria-pressed", "true"); b.setAttribute("aria-label", MZ[i][0] + " (suspension)"); };
      box.addEventListener("click", e => {
        const b = e.target.closest("[data-mz]");
        if (b) { const m = MZ[+b.dataset.mz];
          if (/^S\d$/.test(m[3])) { found.add(m[3]); mark(+b.dataset.mz); const s = SUSQ[m[3]];
            fb.innerHTML = `<b>Yes: ${m[0]} is a suspension</b> over ${s.chord}. ${s.note} Found ${found.size} of 3.${found.size === 3 ? " Now measure them below." : ""}`; }
          else { b.classList.add("no"); fb.innerHTML = `<b>${m[0]}:</b> ${m[3]} Found ${found.size} of 3.`; } }
        if (e.target.closest("[data-mzshow]")) { MZ.forEach((m, i) => { if (/^S\d$/.test(m[3])) { found.add(m[3]); mark(i); } });
          fb.innerHTML = "The three suspensions: the tenors' D in bar 45, the tenors' G in bar 46, and the basses' C on beat 3 of bar 46. (The basses' A in bar 45 is a passing tone, not a suspension.)"; }
      }); }
    const mm = root.querySelector(".mm"); if (!mm) return;
    let id = "S1", stage = 0;
    const NUMS = [2, 3, 4, 5, 6, 7, 8, 9];
    const ladder = (s, upto) => { const L = s.ladder.split(""); const n = Math.min(upto, s.ninth ? 9 : L.length); let out = [];
      for (let i = 0; i < n; i++) out.push(`<span class="mm-l"><b>${"CDEFGAB"[("CDEFGAB".indexOf(s.ladder[0]) + i) % 7]}</b><small>${i + 1}</small></span>`); return `<div class="mm-ladder" aria-hidden="true">${out.join("")}</div>`; };
    const draw = (msg = "") => { const s = SUSQ[id];
      let h = `<p class="mm-q"><b>${s.where}</b> (${s.fmt}): the suspended <b>${s.sus}</b> over <b>${s.chord}</b>, resolving to <b>${s.res}</b>.</p>`;
      h += `<p class="mm-q">1. Which note is the bass?</p><div class="lbtns">${s.opts.map(o => `<button class="lk" data-mmb="${o}" ${stage > 0 ? "disabled" : ""} aria-pressed="${stage > 0 && o === s.bass}">${o}</button>`).join("")}</div>`;
      if (stage > 0) h += `<p class="mm-ok">${s.why}</p><p class="mm-q">2. Count letter names from ${s.bass} (1) up to the suspended ${s.sus}. What number is it?</p><div class="lbtns">${NUMS.map(n => `<button class="lk" data-mmn="${n}" ${stage > 1 ? "disabled" : ""} aria-pressed="${stage > 1 && n === s.n}">${n}</button>`).join("")}</div>`;
      if (stage > 1) h += ladder(s, s.n) + `<p class="mm-ok">${s.bass} up to ${s.sus} is a ${s.n === 9 ? "9th" : s.n + (s.n === 2 ? "nd" : s.n === 3 ? "rd" : "th")}.${s.ninth ? " Counting letters gives 2, but the melody is above the bass by an octave plus a 2nd, so it is called a 9th: a suspension resolving to the octave is labeled 9-8, not 2-1." : ""}</p><p class="mm-q">3. Now count from ${s.bass} to the resolution, ${s.res}.</p><div class="lbtns">${NUMS.map(n => `<button class="lk" data-mmr="${n}" ${stage > 2 ? "disabled" : ""} aria-pressed="${stage > 2 && n === s.r}">${n}</button>`).join("")}</div>`;
      if (stage > 2) h += `<p class="mm-fig">${s.fig}</p><p class="mm-ok">A <b>${s.fig}</b> suspension: ${s.sus} is a ${s.n === 9 ? "9th" : s.n + "th"} above ${s.bass}, resolving to ${s.res}, a ${s.r === 8 ? "8ve (octave)" : s.r + (s.r === 3 ? "rd" : "th")}.</p>`;
      if (msg) h += `<p class="mm-no">${msg}</p>`;
      mm.querySelector(".mm-body").innerHTML = h; };
    mm.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; const s = SUSQ[id];
      if (b.dataset.mmpick) { id = b.dataset.mmpick; stage = 0; mm.querySelectorAll("[data-mmpick]").forEach(x => x.setAttribute("aria-pressed", x === b)); draw(); return; }
      if (b.dataset.mmb) { if (b.dataset.mmb === s.bass) { stage = 1; draw(); } else draw(b.dataset.mmb === s.sus ? `${s.sus} is the suspension itself. The bass is the lowest note of the chord: ${s.ninth ? "in a lead sheet, the root unless a slash names another note" : "check the chord symbol (a slash names the bass; otherwise it is the root)"}.` : `Not ${b.dataset.mmb}. ${s.ninth ? "In a lead sheet, the bass is the root unless a slash names another note." : "Look at the chord symbol: a slash names the bass; otherwise it is the root."}`); return; }
      if (b.dataset.mmn) { const n = +b.dataset.mmn; if (n === s.n) { stage = 2; draw(); } else draw(s.ninth && n === 2 ? "Close: the letters are a 2nd apart, but the melody is an octave higher than that. What is a 2nd plus an octave?" : `Not ${n}. Count ${s.bass} as 1 and say each letter name up to ${s.sus}.`); return; }
      if (b.dataset.mmr) { const n = +b.dataset.mmr; if (n === s.r) { stage = 3; draw(); } else draw(`Not ${n}. Count ${s.bass} as 1 again, up to ${s.res}${s.ninth ? " (an octave above the bass)" : ""}.`); }
    });
    draw();
  }

  // fetch every score image in the background once the lesson page has loaded, so later steps open instantly
  const PRE = ["atgb-lead.png", "atgb-circled-fm.png", "atgb-circled-all.png", "atgb-keyboard.png", "atgb-pt.png", "atgb-nt.png", "atgb-et-app.png", "atgb-accent.png", "tchaikovsky-pc1.png", "bruckner-kyrie.png", "bruckner-sus-phases.png", "sus-types.png", "bruckner-sus-figures.png", "beatles-money.png", "mozart-domine.png", "brahms-op29.png", "ex-mozart.png", "ans-mozart.png", "ex-haydn.png", "ans-haydn.png", "ex-tchaik-nocturne.png", "ans-tchaik-nocturne.png", "ex-sunshine.png", "ans-sunshine.png"];
  if (typeof window !== "undefined" && !window.__nciPre && /-lesson\.html$/.test(location.pathname)) { window.__nciPre = 1; const go = () => PRE.forEach((f, i) => setTimeout(() => { const im = new Image(); im.decoding = "async"; im.src = "assets/img/nct-intro/" + f; }, i * 60));
    if (document.readyState === "complete") setTimeout(go, 800); else window.addEventListener("load", () => setTimeout(go, 800)); }

  const lesson = { defMode: "major", steps: [
    { title: "What is a non-chord tone?", kick: "Consonance and dissonance", render: (H) => `
      <p>Most harmony is built from triads, but that does not mean every note sounding at a given moment belongs to the triad (or seventh chord) being implied. A <b>non-chord tone</b> is a pitch outside the three or four notes of the current chord.</p>
      <p>Another name for a non-chord tone is a <b>dissonance</b> (or dissonant tone). By contrast, a chord tone may be called a <b>consonance</b>.</p>
      <p>Non-chord tones may appear in the melody or the accompaniment, but mostly they are a melodic topic. When one turns up in the accompaniment, it is usually because there is polyphony or some other melodic activity there.</p>`
      + H.check("Over an F minor chord (F–A♭–C), which melody note is a non-chord tone?", "G", ["F", "A♭", "C"], "G is not in F–A♭–C, so it is a non-chord tone.") },

    { title: "Finding them in a lead sheet", kick: "Spell each chord", render: () => `
      <p>Hunting down the dissonances is part of the challenge: sometimes it is hard to tell which notes belong to the chord. In a lead sheet, spell each chord and compare its notes with the melody. Take this passage:</p>
      ${FIG(ATGB, ATGB_CAP)}
      ${SW("atgb", [["Melody and chords", "atgb-lead.png", "As Time Goes By, lead sheet in E-flat major, 4/4, with a pick-up: You must remember this, a kiss is still a kiss, a sigh is just a sigh. Chords: F minor, B-flat 7, F minor, B-flat 7, E-flat."],
        ["Circle the notes outside Fm", "atgb-circled-fm.png", "The same melody with the notes outside F minor circled in the two F minor bars: the G and E-flat in bar 1 and the B-flat and G in bar 2."],
        ["Circle every non-chord tone", "atgb-circled-all.png", "The same melody with every non-chord tone circled: also the G before bar 2 under B-flat 7, and in the last bar the D, C and the final C under E-flat."]],
        "Step through the analysis. Fm7 is F–A♭–C–E♭; B♭7 is B♭–D–F–A♭; E♭ is E♭–G–B♭.")}
      <p>The two Fm bars have the tones F–A♭–C–E♭, so we circle each pitch that does not belong to that chord. The same comparison works for B♭7 (B♭–D–F–A♭) and E♭ (E♭–G–B♭). There are quite a lot of non-chord tones in this melody: not as many as chord tones, but really quite a lot.</p>` , after: root => wireSW(root) },

    { title: "Finding them in a full score", kick: "Harmonic rhythm first", render: (H) => `
      <p>In fully notated music the chord symbols are not given above the staff, so you have to work out the harmony yourself. Here is a possible keyboard version of “As Time Goes By.”</p>
      ${FIG(IMG("atgb-keyboard.png", "Keyboard version of As Time Goes By: the right hand plays the melody; the left hand alternates a low single note with a chord, F then A-flat C chord, low B-flat then D F A-flat, and so on, with a full bar of E-flat in the last bar."), "A keyboard version. The low single notes in the left hand show where the chords change.")}
      <p>To label the harmony, first find the <b>harmonic rhythm</b> (how often the chords change), then name each chord. Here the left hand shows clearly which notes are chord tones, and its low single notes show where the chords change. Only in the third bar does the pattern of two beats per chord change to a whole bar per chord.</p>`
      + H.check("What is the harmonic rhythm?", "how often the chords change", ["the rhythm of the melody", "the tempo", "the rhythm of the bass alone"], "Harmonic rhythm is the rate of chord change.") },

    { title: "When it could go either way", kick: "Let style guide you", render: () => `
      <p>Part of the challenge is deciding which notes are the dissonances and which are the “proper” harmony. Sometimes more than one answer seems valid.</p>
      <p>Let stylistic assumptions guide your choices:</p>
      <ul><li><b>Progression types.</b> Is something an incomplete iii chord or a V chord? In most cases it will be V.</li>
      <li><b>Sevenths and extensions.</b> In classical and folk music, sevenths are usually dissonances, except on the dominant chord. In jazz they are usually treated as consonant chord tones.</li></ul>` },

    { title: "Step, leap or hold", kick: "How it is approached and left", render: () => `
      <p>To label a non-chord tone, sort it by how it is <b>approached</b> and how it is <b>resolved</b> (left): by <b>step</b>, by <b>leap</b> or by <b>hold</b> (a held or repeated note). Notes approached and left by step sound more natural than ones that involve leaps.</p>
      ${finder()}`, after: root => wireFinder(root) },

    { title: "Passing and neighbor tones", kick: "Step in, step out", keyed: "major", render: (H, k, U) => {
      const pt = ex(H, k, [[1], [1]], [[0, 1], [1, 1, "PT"], [2, 2]], { sym: true }), nt = ex(H, k, [[1], [1]], [[4, 1], [5, 1, "NT"], [4, 2]]), six = ex(H, k, [[1], [1]], [[[2, 7], 1], [[3, 8], 1, "PT"], [[4, 9], 2]]);
      return `<p>The most common non-chord tones use steps on both sides. If both steps go in the <b>same direction</b>, it is a <b>passing tone (PT)</b>. This example has a double passing tone: two in a row, filling in the fourth between the fifth and the root of the chord.</p>
      <p>If the melody <b>changes direction</b> around the non-chord tone, it is a <b>neighbor tone (NT)</b>.</p>
      ${SW("ptnt", [["Passing tones", "atgb-pt.png", "As Time Goes By with circled non-chord tones; PT labels under the G in bar 1, the G in bar 2, and the D and C in the last bar, which form a double passing tone."],
        ["Neighbor tone", "atgb-nt.png", "As Time Goes By with an NT label under the E-flat in bar 1, which steps down from F and back up to F."]], "“As Time Goes By”: passing tones and a neighbor tone.")}
      ${FIG(ATGB, ATGB_CAP)}
      ${ANYKEY}<div class="lfigs">${U.fig(pt, "<b>Passing tone</b>: step, then step in the <i>same</i> direction.", { small: true })}${U.fig(nt, "<b>Neighbor tone</b>: step away, then step <i>back</i>.", { small: true })}${U.fig(six, "<b>Two at once</b>: passing tones in parallel 6ths. Label each one.", { small: true })}</div>`
      + H.check("A non-chord tone stepped into and stepped away from in the same direction is…", "a passing tone", ["a neighbor tone", "an appoggiatura", "an escape tone"], "Same direction on both sides: passing tone.");
    }, after: root => wireSW(root) },

    { title: "Appoggiaturas, escape tones and double neighbors", kick: "One leap, one step", keyed: "major", render: (H, k, U) => {
      const app = ex(H, k, [[1], [4]], [[2, 1], [4, 1], [6, 1, "APP"], [5, 1]]), et = ex(H, k, [[5], [1]], [[6, 1], [5, 1, "ET"], [7, 2]]);
      const dnx = ex(H, k, [[1, 4], [5, 2], [1, 2]], [[4, 1], [5, 1, "DN"], [3, 1, "DN"], [4, 1], [6, 1], [4, 1], [2, 2]]);
      return `<p>Two types involve a leap on one side. An <b>appoggiatura (APP)</b> is approached by leap and resolved by step. An <b>escape tone (ET)</b> is the opposite: approached by step and left by leap. They are mirror images, so ask <b>which side the leap is on</b>.</p>
      <p>This example has both in a row around the same target, so it is better labeled a <b>double neighbor (DN)</b> or <b>changing tone (CT)</b>: an upper and a lower neighbor in succession directly before the resolution.</p>
      ${FIG(IMG("atgb-et-app.png", "As Time Goes By: the G before bar 2 is labeled ET and the B-flat on the downbeat of bar 2 APP, bracketed together as DN around the A-flat that follows."), "ET + APP around one note = double neighbor (DN).")}
      ${ANYKEY}<div class="lfigs">${U.fig(app, "<b>Appoggiatura</b>: <i>leap</i> in, <i>step</i> out.", { small: true })}${U.fig(et, "<b>Escape tone</b>: <i>step</i> in, <i>leap</i> out.", { small: true })}${U.fig(dnx, "<b>Double neighbor</b>: one on each side of the target.", { small: true })}</div>`
      + H.check("Approached by leap and resolved by step:", "appoggiatura", ["escape tone", "passing tone", "suspension"], "Leap in, step out: appoggiatura.");
    } },

    { title: "Accented and unaccented", kick: "Where the dissonance falls", keyed: "major", render: (H, k, U) => {
      const upt = ex(H, k, [[1], [5]], [[2, 1], [3, 1, "PT"], [4, 1], [6, 1]], { sym: true }), apt = ex(H, k, [[1], [2]], [[4, 1], [7, 1], [6, 1, "PT"], [5, 1]], { sym: true }), ant = ex(H, k, [[1], [4]], [[4, 1], [7, 1], [8, 1, "NT"], [7, 1]], { sym: true });
      return `<p>Non-chord tones also differ in <b>where they fall</b>. An <b>unaccented</b> non-chord tone comes between the beats or on a weak part of the beat, after the chord has already sounded. An <b>accented</b> one lands on a beat, so the dissonance is heard first and the chord tone arrives a moment later. Accented non-chord tones sound more expressive.</p>
      ${FIG(IMG("atgb-accent.png", "As Time Goes By with every non-chord tone circled and labeled UN for unaccented or ACC for accented: UN under the G and E-flat sixteenths in bar 1 and the G eighth before bar 2; ACC under the B-flat on the downbeat of bar 2 and the G on beat 2; UN under the D sixteenth in the last bar, ACC under the C on beat 2 and the final C on beat 3."), "“As Time Goes By”: UN = unaccented, ACC = accented.")}
      ${FIG(ATGB, ATGB_CAP)}
      <p>Listen to “As Time Goes By” with this in mind. The short notes after the beat (the G and E♭ in bar 1, the D in the last bar) slip by: they are <b>unaccented</b> passing and neighbor tones, and so is the escape tone G that leads into bar 2. But the B♭ on the downbeat of bar 2, “<i>a kiss</i>,” lands right on the beat: an <b>accented</b> appoggiatura, the most expressive moment in the phrase. The G on beat 2 of that bar and the C on beat 2 of the last bar are <b>accented passing tones</b>, and the long C on beat 3 of the last bar is accented too.</p>
      ${ANYKEY}<div class="lfigs">${U.fig(upt, "<b>Unaccented passing tone</b>: on a weak beat, inside one chord.", { small: true })}${U.fig(apt, `<b>Accented passing tone</b>: on the beat where the chord changes to ${H.diat(k, 2).sym}.`, { small: true })}${U.fig(ant, `<b>Accented neighbor tone</b>: the upper neighbor sounds as ${H.diat(k, 4).sym} arrives.`, { small: true })}</div>
      <p class="note">An appoggiatura is usually accented, which is why some books describe it as an accented incomplete neighbor.</p>`
        + H.check("In “As Time Goes By,” the B♭ on the downbeat of bar 2 is…", "an accented appoggiatura", ["an unaccented passing tone", "an accented suspension", "an unaccented escape tone"], "It is leaped to and resolved by step, and it lands on the downbeat.");
    } },

    { title: "Tchaikovsky: appoggiaturas and escape tones", kick: "Hear them in context", render: () => `
      <p>Tchaikovsky's Piano Concerto No. 1 has a wealth of appoggiaturas and escape tones, along with a strong bass pedal tone. Analyze the harmony of the piano chords (the upper grand staff) to understand the non-chord tones labeled in the orchestral melody (the lower grand staff). Notice which ones land on the beat.</p>
      ${FIG(IMG("tchaikovsky-pc1.png", "Tchaikovsky, Piano Concerto No. 1, bars 7 to 15, in D-flat major. Upper grand staff: the piano's big chords. Lower grand staff: the violins and cellos' melody, labeled PT, ET, APP, APP, ET, APP, ET, ET, APP and PT, with PED D-flat under two bars of held D-flat bass. A note explains that one appoggiatura is approached from above and resolved in the same direction.") + AUD("tchaikovsky-pc1", "Tchaikovsky, Piano Concerto No. 1, bars 7 to 15"),
        "Tchaikovsky, Piano Concerto No. 1, bars 7–15. Usually appoggiaturas are approached from below; the one marked with the arrow is approached from above and resolved in the same direction.")}` },

    { title: "Pedal tones", kick: "Held under changing chords", keyed: "major", render: (H, k, U) => {
      const t0 = dn(H, k, -14), ped = ex(H, k, [[1], [4], [5], [1]], [[7, 2], [5, 2], [6, 2], [7, 2]], { ped: H.nmO(H.N(t0.l, t0.a, H.midi(H.N(t0.l, t0.a, 2)) < 40 ? 3 : 2)) });
      const inv = ex(H, k, [[1], [2], [4], [1]], [[4, 2, null, true], [4, 2, "PED", true], [4, 2, "PED", true], [4, 2]]);
      return `<p>Bruckner's Mass in E minor has two more types. This passage from the Kyrie is for unaccompanied women's voices; chord symbols have been added to make the analysis easier.</p>
      ${FIG(IMG("bruckner-kyrie.png", "Bruckner, Kyrie from the Mass in E minor, two treble staves. Chords: E minor, F-sharp half-diminished 7 over E, B7, E minor. The lowest voice repeats E throughout; it is labeled PED twice under the B7 bar. NT marks a neighbor tone in the lower staff."), "Bruckner, Mass in E minor, Kyrie (women's voices). Recording: La Chapelle Royale, Collegium Vocale Gent and Ensemble Musique Oblique, conducted by Philippe Herreweghe (harmonia mundi).") + AUD("bruckner-kyrie", "Bruckner, Kyrie from the Mass in E minor")}
      <p>A <b>pedal tone (PED)</b> is a note that persists from one harmony into the next. Here the lowest voice repeats an E for the whole phrase. It is a chord tone under every chord except B7: when B7 sounds in bar 4, the E clashes with the “proper” notes of the chord.</p>
      ${ANYKEY}<div class="lfigs">${U.fig(ped, "<b>Pedal tone</b> in the bass: dissonant whenever it is not in the chord above.", { small: true })}${U.fig(inv, `<b>Inverted pedal</b>: the same idea in an upper voice; it clashes with ${H.diat(k, 2).sym} and ${H.diat(k, 4).sym}.`, { small: true })}</div>`
      + H.check("A note held or repeated (usually in the bass) while harmonies change above it is…", "a pedal tone", ["a suspension", "an anticipation", "a passing tone"], "Same note in, same note out: pedal tone.");
    } },

    { title: "Suspensions", kick: "Preparation, suspension, resolution", keyed: "major", render: (H, k, U) => {
      const sus = ex(H, k, [[4], [1]], [[7, 1], [5, 1, null, true], [5, 1, "SUS"], [4, 1]]), ret = ex(H, k, [[5], [1]], [[8, 1], [6, 1, null, true], [6, 1, "RET"], [7, 1]]);
      return `<p>The other type in the Bruckner is the <b>suspension (SUS)</b>: a note held over from the previous harmony (sometimes repeated rather than tied, with the same effect; both happen here) that then resolves by step down. A suspension has three phases:</p>
      <ol><li><b>Preparation:</b> the note is a consonant member of the previous harmony.</li>
      <li><b>Suspension:</b> the harmony changes while the note persists, so it becomes dissonant.</li>
      <li><b>Resolution:</b> the suspended note steps down to a consonance. Sometimes this happens at the same moment the harmony changes or the bass moves (the inversion changes), which complicates things a little.</li></ol>
      ${FIG(IMG("bruckner-sus-phases.png", "The Bruckner Kyrie with both suspensions labeled. First: the B in bar 2 is the preparation, tied into bar 3 as the suspension, resolving down to A. Second: the F-sharp in bar 4 is the preparation, repeated in bar 5 as the suspension, resolving down to E in bar 6.") + AUD("bruckner-kyrie", "Bruckner, Kyrie from the Mass in E minor"), "The two suspensions in the Bruckner: one tied over, one repeated. Recording: La Chapelle Royale, Collegium Vocale Gent and Ensemble Musique Oblique, conducted by Philippe Herreweghe (harmonia mundi).")}
      <p>A note held over that resolves <b>up</b> instead of down is a <b>retardation (RET)</b>. Suspensions are almost always <b>accented</b>: the dissonance arrives with the new chord.</p>
      ${ANYKEY}<div class="lfigs">${U.fig(sus, "<b>Suspension</b>: held over, then <i>down</i> by step.", { small: true })}${U.fig(ret, "<b>Retardation</b>: held over, then <i>up</i> by step.", { small: true })}</div>`
        + H.check("Held over and resolved UP by step:", "a retardation", ["a suspension", "an anticipation", "a neighbor tone"], "A suspension resolves down; a retardation resolves up.");
    } },

    { title: "Suspension figures", kick: "4-3, 9-8, 7-6, 2-3", keyed: "major", render: (H, k, U) => {
      const f43 = two(H, k, [[7, 4, true], [7, 2, false, "4"], [6, 2, false, "3"]], [[-7, 4], [-10, 4]]), f98 = two(H, k, [[8, 4, true], [8, 2, false, "9"], [7, 2, false, "8"]], [[-10, 4], [-7, 4]]);
      const f76 = two(H, k, [[8, 4, true], [8, 2, false, "7"], [7, 2, false, "6"]], [[-10, 4], [-5, 4]]), f23 = two(H, k, [[4, 4], [8, 4]], [[0, 4, true], [0, 2, false, "2"], [-1, 2, false, "3"]].map(([i, q, t, g]) => [i - 7, q, t, g]));
      return `<p>Suspensions are often labeled with numbers showing their intervals above the bass: the interval of the suspension, then of its resolution. The four types are <b>9-8</b>, <b>4-3</b>, <b>7-6</b> and <b>2-3</b> (the 2-3 is the inversion of the 7-6: the suspension is in the bass).</p>
      ${FIG(IMG("sus-types.png", "Four pure suspensions in C major. 4-3: V six-five to I. 9-8: V7 to I. 7-6: V7 to I six-four. 2-3: V four-two to I, with the suspension in the bass."), "“Pure” versions of the four suspension types.")}
      <div class="lfigs">${U.fig(f43, "<b>4-3</b>", { small: true })}${U.fig(f98, "<b>9-8</b>", { small: true })}${U.fig(f76, "<b>7-6</b>", { small: true })}${U.fig(f23, "<b>2-3</b>: the <i>bass</i> is suspended", { small: true })}</div>
      <p>Some things complicate the labels, such as the bass changing at the moment of resolution, or melodic embellishment. The first suspension in the Bruckner is tricky because it happens together with the pedal tone. Ignoring the pedal, it is a 4-3: the B is a fourth above the lowest chord tone (F♯) and moves down to A. The second is easier: a 9-8, because the suspended F♯ is a ninth above the lowest chord tone (E) and steps down to E.</p>
      ${FIG(IMG("bruckner-sus-figures.png", "The Bruckner Kyrie with suspension figures: 4-3 under the first suspension in bar 3 and 9-8 above the second in bar 5."), "The Bruckner suspensions labeled 4-3 and 9-8.")}
      <p>You can also label a suspension in a lead sheet, because a lead sheet implies a bass line: if the chord symbol shows no slash bass, the chord is in root position.</p>
      ${FIG(IMG("beatles-money.png", "The Beatles, You Never Give Me Your Money, lead sheet in C: Am7, D7, G7, C major 7. The E held over from Am7 into D7 on mo-ney resolves down to D: labeled 9-8. On fun-ny, the F over C major 7 is labeled APP.") + AUD("beatles-money", "The Beatles, You Never Give Me Your Money"), "The Beatles, “You Never Give Me Your Money” (lead sheet): a 9-8 suspension over D7 and an appoggiatura.")}`
      + H.check("In a 4-3 suspension, the suspended note is a fourth above the bass and resolves…", "down by step to a third above the bass", ["up by step to a fifth", "down by leap", "by staying on the same note"], "Suspensions resolve down by step: 4 → 3.");
    } },

    { title: "Measure it yourself", kick: "From the bass up", render: () => `
      <p>Now find and measure some suspensions on your own: three in Mozart's Requiem (notation with chord symbols) and the Beatles one from the previous step (a lead sheet).</p>
      ${mozartFind()}${measure()}`, after: root => wireMozart(root) },

    { title: "When suspensions get complicated", kick: "Moving bass, ornaments, chains", keyed: "major", render: (H, k, U) => {
      const orn = two(H, k, [[7, 4, true], [7, 1, false, "4"], [5, 1], [6, 2, false, "3"]], [[-7, 4], [-10, 4]]);
      const mov = two(H, k, [[7, 4, true], [7, 2, false, "4"], [6, 2, false, "6"]], [[-7, 4], [-10, 2], [-6, 2]]);
      const b = -2, chain = two(H, k, [[b + 5, 2], [b + 5, 2, true], [b + 5, 2, false, "7"], [b + 4, 2, true, "6"], [b + 4, 2, false, "7"], [b + 3, 2, true, "6"], [b + 3, 2, false, "7"], [b + 2, 2, false, "6"]], [[b - 7, 4], [b - 8, 4], [b - 9, 4], [b - 10, 4]], 80);
      return `<p>Real suspensions are rarely as tidy as the textbook figures. Generated examples in any key:</p>
        <div class="lfigs">${U.fig(orn, "<b>Ornamented resolution</b>: the 4 dips to a lower note before it resolves to 3. Label the suspension by where it finally lands.", { small: true })}${U.fig(mov, "<b>The bass moves at the resolution</b>: the 4 resolves as the bass moves up a 5th, so the resolution is a 6th above the new bass: a 4-6.", { small: true })}</div>
        ${U.fig(chain, "<b>A chain of suspensions</b>: each resolution is held over into the next bar and becomes the next preparation, over a bass that steps down: 7-6, 7-6, 7-6.")}`
        + H.check("In a chain of 7-6 suspensions, each resolution…", "becomes the preparation of the next suspension", ["leaps to the bass", "is a pedal tone", "resolves up by step"], "Resolve, hold over, clash, resolve again.");
    } },

    { title: "Anticipations", kick: "Arriving early", keyed: "major", render: (H, k, U) => {
      const ant = ex(H, k, [[5], [1]], [[6, 1], [7, 1, "ANT"], [7, 2]]), ha = ex(H, k, [[2], [5], [1, 4]], [[3, 1], [5, 1], [6, 1], [9, 1, "HA"], [7, 4]]);
      return `<p>The last type is the <b>anticipation (ANT)</b>: a melody note that arrives before the rest of its harmony. A <b>harmonic anticipation (HA)</b> anticipates a different tone of the following chord than the one the melody actually moves to.</p>
      ${FIG(IMG("brahms-op29.png", "Brahms, Motet Op. 29 No. 2, four bars in G major, 6/4, for choir. A 4-3 suspension and a neighbor tone in the tenor in bar 2; in bar 3 the soprano's G arrives on beat 3 before the G chord of bar 4, labeled ANT.") + AUD("brahms-op29", "Brahms, Motet Op. 29 No. 2"), "Johannes Brahms, Motet Op. 29 No. 2: a 4-3 suspension, a neighbor tone and an anticipation. Recording: St Bride's Church Choir, conducted by Matthew Morley.")}
      ${ANYKEY}<div class="lfigs">${U.fig(ant, "<b>Anticipation</b>: the next chord's note, early, then repeated.", { small: true })}${U.fig(ha, "<b>Harmonic anticipation</b>: it anticipates a note of the next chord, then leaps to a <i>different</i> note of that chord.", { small: true })}</div>`
        + H.check("A melody note that arrives before its chord and is held into it is…", "an anticipation", ["a suspension", "a retardation", "an appoggiatura"], "It anticipates the next chord.");
    } },

    { title: "The chart", kick: "All the types at once", render: () => tbl("Non-chord tones: how each type is approached and left", ["Type", "Approached by", "Left by"], [
      ["Neighbor tone (NT)", "step", "step in the opposite direction"], ["Passing tone (PT)", "step", "step in the same direction"],
      ["Double neighbor (DN) or changing tone (CT)", "step", "non-chord tones on either side of the resolution pitch"], ["Appoggiatura (APP)", "leap", "step"], ["Escape tone (ET)", "step", "leap"],
      ["Suspension (SUS)", "same note", "step down"], ["Retardation (RET)", "same note", "step up"], ["Anticipation (ANT)", "step or leap", "same note"],
      ["Harmonic anticipation (HA)", "step or leap", "a different note of the next harmony than the one actually used"], ["Pedal tone (PED)", "same note", "same note"]]) },

    { title: "Examples for labeling", kick: "Try it, then check", render: () => `
      <p>Find the chords, compare the melody, and label each non-chord tone (and whether it is accented). Then open the answer key.</p>
      ${ANS("ex-mozart.png", "ans-mozart.png", "Mozart, You Birds, So Every Year, voice and piano in C major, 2/4, eight bars, unlabeled.", "Answer: NT, NT in bar 1; NT, NT in bar 3; APP then PT, PT in bar 5.", "W. A. Mozart, “You Birds, So Every Year” (“Oiseaux, si tous les ans,” K. 307), performed by Juliane Banse and András Schiff", ["mozart-oiseaux", "Mozart, You Birds, So Every Year"])}
      ${ANS("ex-haydn.png", "ans-haydn.png", "Haydn, Piano Sonata No. 62 in E-flat major, finale, eight bars, unlabeled.", "Answer: the held low E-flat in the left hand is labeled PED three times.", "Joseph Haydn, Piano Sonata No. 62 in E♭ major, Hob. XVI:52, finale, performed by John Lill", ["haydn-sonata62", "Haydn, Piano Sonata No. 62, finale"])}
      ${ANS("ex-tchaik-nocturne.png", "ans-tchaik-nocturne.png", "Tchaikovsky, Nocturne, four bars in D minor, unlabeled.", "Answer: NT in bars 1 and 2, ET twice in bar 3, PT in bar 4.", "Piotr Tchaikovsky, Nocturne, performed by Alexandre Tharaud", ["tchaikovsky-nocturne", "Tchaikovsky, Nocturne, performed by Alexandre Tharaud"])}
      ${ANS("ex-sunshine.png", "ans-sunshine.png", "Oliver Hood, You Are My Sunshine, lead sheet in F, unlabeled.", "Answer: PT on the pick-up, NT on only, PT on make me, skies are, never, much I and don't take, and ET or HA on the last two non-chord tones.", "Oliver Hood, “You Are My Sunshine” (1939)")}` },

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
