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
  const NOTEL = (H, x, i) => `note ${i + 1} (${H.nm(dn(H, x.k, x.notes[i].i))})`;   // "Find it": the value of a clicked melody note
  function spec(H, x, o = {}) {
    const k = x.k;
    const mel = x.notes.map((n, a) => Object.assign({ k: [H.nmO(dn(H, k, n.i))], q: n.q, tie: n.tie }, o.hl && x.ncts.includes(a) ? { hl: true } : {}, o.num ? { n: a + 1 } : {}, o.pick ? { pv: NOTEL(H, x, a), pl: `Melody note ${a + 1}: ${H.nm(dn(H, k, n.i))}` } : {}, o.tags && x.ncts.includes(a) ? { tag: x.lab[a] } : {}));
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

  // ===== drill: "A Whole New World" (Menken/Rice) lead sheet. Click melody notes; name each non-chord tone.
  // AW: one entry per notehead, in reading order. x,y = % of assets/img/nct-intro/awnw.png; n = pitch; c = chord; l = line; k = note number on the line;
  // w = lyric; t = type; acc = other accepted types; o = optional (accepted, not required); g = index of the note this one is tied from; ex = explanation; cl = clue; m = chord-tone message
  const AW = [{"x":12.81,"y":8.8,"n":"F♯","c":"D","l":1,"k":1},{"x":16.03,"y":9.26,"n":"E","c":"D","l":1,"k":2,"w":"can","t":"DN","cl":"One of two notes that circle the F♯ that follows.","ex":"E over D: E and G circle around F♯, one on each side, before the melody lands on it. Double neighbor (changing tones)."},{"x":20.62,"y":8.46,"n":"G","c":"D","l":1,"k":3,"w":"show","t":"DN","cl":"One of two notes that circle the F♯ that follows.","ex":"G over D: E and G circle around F♯, one on each side, before the melody lands on it. Double neighbor (changing tones)."},{"x":25.21,"y":8.8,"n":"F♯","c":"D","l":1,"k":4},{"x":29.52,"y":9.6,"n":"D","c":"D","l":1,"k":5},{"x":34.32,"y":10.63,"n":"A","c":"D","l":1,"k":6},{"x":44.66,"y":8.8,"n":"F♯","c":"D","l":1,"k":7},{"x":49.18,"y":9.26,"n":"E","c":"D","l":1,"k":8,"w":"-ing","t":"DN","cl":"One of two notes that circle the F♯ that follows.","ex":"E over D: E and G circle around F♯, one on each side, before the melody lands on it. Double neighbor (changing tones)."},{"x":53.77,"y":8.46,"n":"G","c":"D","l":1,"k":9,"w":"shim-","t":"DN","cl":"One of two notes that circle the F♯ that follows.","ex":"G over D: E and G circle around F♯, one on each side, before the melody lands on it. Double neighbor (changing tones)."},{"x":58.01,"y":8.8,"n":"F♯","c":"D","l":1,"k":10},{"x":62.12,"y":9.6,"n":"D","c":"D","l":1,"k":11},{"x":66.78,"y":8.86,"n":"F♯","c":"G/B","l":1,"k":12,"w":"splen-","t":"APP","cl":"Approached by leap up from D; left by step down to E.","ex":"F♯ over G/B: leap up from D, then step down to E. Appoggiatura (accented)."},{"x":72.33,"y":9.26,"n":"E","c":"A/C♯","l":1,"k":13},{"x":78.77,"y":9.26,"n":"E","c":"Em/G","l":1,"k":14},{"x":82.88,"y":9.6,"n":"D♯","c":"Em/G","l":1,"k":15,"w":"me","t":"ET","cl":"Approached by step down from E; left by leap up to F♯.","ex":"D♯ over Em/G: step down from E, then leap up to F♯. Escape tone. (You can also hear D♯ and F♯ as a double neighbor around the E on “now.”)","acc":["ET","DN"]},{"x":85.75,"y":8.8,"n":"F♯","c":"Em/G","l":1,"k":16,"w":"prin-","t":"ANT","cl":"Approached by leap up from D♯; left by step down to E.","ex":"F♯ over Em/G: it sounds before F♯7 arrives, then the same note continues as a chord tone. Anticipation."},{"x":88.49,"y":8.8,"n":"F♯","c":"F♯7","l":1,"k":17,"g":15,"m":"F♯ is a chord tone of F♯7: the tied note where the anticipation lands."},{"x":91.71,"y":9.26,"n":"E","c":"F♯7","l":1,"k":18},{"x":96.37,"y":10.06,"n":"C♯","c":"F♯7","l":1,"k":19},{"x":8.97,"y":29.6,"n":"E","c":"Bm","l":2,"k":1,"w":"when","t":"APP","cl":"Approached by leap up from C♯; left by step down to D.","ex":"E over Bm: leap up from C♯, then step down to D. Appoggiatura (accented)."},{"x":13.49,"y":29.94,"n":"D","c":"Bm","l":2,"k":2},{"x":17.33,"y":30.4,"n":"C♯","c":"Bm/A","l":2,"k":3,"w":"You","t":"NT","cl":"Approached by step down from D; left by step up to D.","ex":"C♯ over Bm/A: step away from D and straight back. Neighbor tone."},{"x":21.37,"y":29.94,"n":"D","c":"Bm/A","l":2,"k":4},{"x":26.1,"y":30.74,"n":"B","c":"G","l":2,"k":5},{"x":29.93,"y":30.4,"n":"C♯","c":"G","l":2,"k":6,"w":"your","t":"DN","cl":"One of two notes that circle the D that follows.","ex":"C♯ over G: C♯ and E circle around D, one on each side, before the melody lands on it. Double neighbor (changing tones)."},{"x":33.36,"y":29.6,"n":"E","c":"G","l":2,"k":7,"w":"heart","t":"DN","cl":"One of two notes that circle the D that follows.","ex":"E over G: C♯ and E circle around D, one on each side, before the melody lands on it. Double neighbor (changing tones)."},{"x":36.71,"y":29.6,"n":"E","c":"G","l":2,"k":8,"g":25,"t":"DN","ex":"E over G: C♯ and E circle around D, one on each side, before the melody lands on it. Double neighbor (changing tones)."},{"x":39.86,"y":29.94,"n":"D","c":"G","l":2,"k":9},{"x":42.47,"y":31.14,"n":"A","c":"G","l":2,"k":10,"w":"-cide","t":"ANT","cl":"Approached by leap down from D; left by step up to B.","ex":"A over G: it sounds before D arrives, then the same note continues as a chord tone. Anticipation."},{"x":47.95,"y":30.97,"n":"A","c":"D","l":2,"k":11,"g":28,"m":"A is a chord tone of D: the tied note where the anticipation lands."},{"x":60.55,"y":30.74,"n":"B","c":"G","l":2,"k":12},{"x":63.97,"y":30.4,"n":"C♯","c":"G","l":2,"k":13,"w":"-ic","t":"DN","cl":"One of two notes that circle the D that follows.","ex":"C♯ over G: C♯ and E circle around D, one on each side, before the melody lands on it. Double neighbor (changing tones)."},{"x":67.12,"y":29.6,"n":"E","c":"G","l":2,"k":14,"w":"car-","t":"DN","cl":"One of two notes that circle the D that follows.","ex":"E over G: C♯ and E circle around D, one on each side, before the melody lands on it. Double neighbor (changing tones)."},{"x":70.48,"y":29.6,"n":"E","c":"G","l":2,"k":15,"g":32,"t":"DN","ex":"E over G: C♯ and E circle around D, one on each side, before the melody lands on it. Double neighbor (changing tones)."},{"x":73.22,"y":29.94,"n":"D","c":"G","l":2,"k":16},{"x":76.44,"y":29.14,"n":"F♯","c":"G","l":2,"k":17,"w":"ride","t":"ANT","cl":"Approached by leap up from D; left by the same note.","ex":"F♯ over G: it sounds before D arrives, then the same note continues as a chord tone. Anticipation."},{"x":81.58,"y":29.14,"n":"F♯","c":"D","l":2,"k":18,"g":35,"m":"F♯ is a chord tone of D: the tied note where the anticipation lands."},{"x":86.78,"y":29.14,"n":"F♯","c":"D","l":2,"k":19},{"x":90.89,"y":28.8,"n":"G","c":"D","l":2,"k":20,"w":"whole","t":"DN","cl":"One of two notes that circle the A that follows.","ex":"G over D: G and B circle around A, one on each side, before the melody lands on it. Double neighbor (changing tones)."},{"x":96.1,"y":28.0,"n":"B","c":"D","l":2,"k":21,"w":"new","t":"DN","cl":"One of two notes that circle the A that follows.","ex":"B over D: G and B circle around A, one on each side, before the melody lands on it. Double neighbor (changing tones)."},{"x":9.25,"y":47.49,"n":"A","c":"A7","l":3,"k":1},{"x":19.25,"y":47.43,"n":"A","c":"D","l":3,"k":2,"g":40},{"x":25.75,"y":48.23,"n":"F♯","c":"D","l":3,"k":3},{"x":29.04,"y":47.89,"n":"G","c":"D","l":3,"k":4,"w":"new","t":"DN","cl":"One of two notes that circle the A that follows.","ex":"G over D: G and B circle around A, one on each side, before the melody lands on it. Double neighbor (changing tones)."},{"x":32.88,"y":47.14,"n":"B","c":"D","l":3,"k":5,"w":"fan-","t":"DN","cl":"One of two notes that circle the A that follows.","ex":"B over D: G and B circle around A, one on each side, before the melody lands on it. Double neighbor (changing tones)."},{"x":38.01,"y":47.43,"n":"A","c":"A","l":3,"k":6},{"x":41.85,"y":48.69,"n":"E","c":"A","l":3,"k":7},{"x":44.59,"y":47.89,"n":"G","c":"A","l":3,"k":8,"w":"point","t":"ANT","o":1,"cl":"Approached by leap up from E; left by step down to F♯.","ex":"G on “point” sounds under A, but it’s tied into A♯°7, where it’s the 7th. You can call it an anticipation, or count it with the A♯°7 chord. Optional."},{"x":47.33,"y":47.89,"n":"G","c":"A♯°7","l":3,"k":9,"g":47,"m":"G is a chord tone of A♯°7 (its 7th): the G on “point” is tied into it."},{"x":50.07,"y":48.23,"n":"F♯","c":"A♯°7","l":3,"k":10,"w":"of","t":"ANT","cl":"Approached by step down from G; left by the same note.","ex":"F♯ over A♯°7: it sounds before Bm arrives, then the same note continues as a chord tone. Anticipation."},{"x":53.9,"y":48.23,"n":"F♯","c":"A♯°7","l":3,"k":11,"w":"view","t":"ANT","cl":"Approached by the same note from F♯; left by the same note.","ex":"F♯ over A♯°7: it sounds before Bm arrives, then the same note continues as a chord tone. Anticipation."},{"x":63.29,"y":48.23,"n":"F♯","c":"Bm","l":3,"k":12,"g":50,"m":"F♯ is a chord tone of Bm: the tied note where the anticipation lands."},{"x":70.89,"y":48.23,"n":"F♯","c":"D7","l":3,"k":13},{"x":74.52,"y":47.89,"n":"G","c":"D7","l":3,"k":14,"w":"one","t":"PT","cl":"Approached by step up from F♯; left by step up to A.","ex":"G over D7: step up from F♯, then on to A in the same direction. Passing tone."},{"x":77.74,"y":47.43,"n":"A","c":"D7","l":3,"k":15},{"x":82.19,"y":46.74,"n":"C♯","c":"G","l":3,"k":16,"w":"tell","t":"APP","cl":"Approached by leap up from A; left by step down to B.","ex":"C♯ over G: leap up from A, then step down to B. Appoggiatura (accented)."},{"x":85.96,"y":47.14,"n":"B","c":"G","l":3,"k":17},{"x":89.79,"y":47.43,"n":"A","c":"D/F♯","l":3,"k":18},{"x":96.3,"y":49.03,"n":"D","c":"D/F♯","l":3,"k":19},{"x":8.97,"y":62.34,"n":"C♯","c":"G","l":4,"k":1,"w":"where","t":"APP","cl":"Approached by leap up from D; left by step up to D.","ex":"C♯ over G: leap up from D, then step up to D. Appoggiatura (accented)."},{"x":13.29,"y":61.94,"n":"D","c":"G","l":4,"k":2},{"x":15.82,"y":63.03,"n":"A","c":"G","l":4,"k":3,"w":"go","t":"ANT","cl":"Approached by leap down from D; left by leap down to D.","ex":"A over G: it sounds before D/F♯ arrives, then the same note continues as a chord tone. Anticipation."},{"x":18.42,"y":63.03,"n":"A","c":"D/F♯","l":4,"k":4,"g":61,"m":"A is a chord tone of D/F♯: the tied note where the anticipation lands."},{"x":24.45,"y":64.63,"n":"D","c":"D/F♯","l":4,"k":5},{"x":28.9,"y":63.83,"n":"F♯","c":"Bm7","l":4,"k":6},{"x":33.42,"y":64.29,"n":"E","c":"Bm7","l":4,"k":7,"w":"we’re","t":"PT","cl":"Approached by step down from F♯; left by step down to D.","ex":"E over Bm7: step down from F♯, then on to D in the same direction. Passing tone."},{"x":37.12,"y":64.63,"n":"D","c":"Bm7","l":4,"k":8},{"x":39.66,"y":64.63,"n":"D","c":"E7","l":4,"k":9},{"x":42.26,"y":65.43,"n":"B","c":"E7","l":4,"k":10},{"x":46.51,"y":64.63,"n":"D","c":"E7","l":4,"k":11},{"x":52.19,"y":64.29,"n":"E","c":"A7sus4","l":4,"k":12},{"x":58.22,"y":63.83,"n":"F♯","c":"A7sus4","l":4,"k":13,"w":"A","t":"PT","cl":"Approached by step up from E; left by step up to G.","ex":"F♯ over A7sus4: step up from E, then on to G in the same direction. Passing tone."},{"x":62.4,"y":63.49,"n":"G","c":"A7sus4","l":4,"k":14},{"x":67.67,"y":62.69,"n":"B","c":"A7sus4","l":4,"k":15,"w":"new","t":"APP","o":1,"cl":"Approached by leap up from G; left by step down to A.","ex":"B over A7sus4: leap up from G, then step down to A in the next bar. You can call it an appoggiatura, or hear it as a 9th added to the chord. Optional."},{"x":72.81,"y":63.09,"n":"A","c":"A7","l":4,"k":16},{"x":82.12,"y":63.03,"n":"A","c":"D","l":4,"k":17},{"x":88.22,"y":63.83,"n":"F♯","c":"D","l":4,"k":18},{"x":91.23,"y":63.49,"n":"G","c":"D","l":4,"k":19,"w":"daz-","t":"DN","cl":"One of two notes that circle the A that follows.","ex":"G over D: G and B circle around A, one on each side, before the melody lands on it. Double neighbor (changing tones)."},{"x":95.82,"y":62.69,"n":"B","c":"D","l":4,"k":20,"w":"-zling","t":"DN","cl":"One of two notes that circle the A that follows.","ex":"B over D: G and B circle around A, one on each side, before the melody lands on it. Double neighbor (changing tones)."},{"x":8.97,"y":78.91,"n":"A","c":"A","l":5,"k":1},{"x":12.33,"y":80.17,"n":"E","c":"A","l":5,"k":2},{"x":16.3,"y":79.37,"n":"G","c":"A","l":5,"k":3},{"x":19.66,"y":79.37,"n":"G","c":"A♯°7","l":5,"k":4,"g":81,"m":"G is a chord tone of A♯°7 (its 7th), tied over from the bar’s first G."},{"x":22.53,"y":79.71,"n":"F♯","c":"A♯°7","l":5,"k":5,"w":"-ver","t":"ANT","cl":"Approached by step down from G; left by the same note.","ex":"F♯ over A♯°7: it sounds before Bm arrives, then the same note continues as a chord tone. Anticipation."},{"x":27.05,"y":79.71,"n":"F♯","c":"A♯°7","l":5,"k":6,"w":"knew","t":"ANT","cl":"Approached by the same note from F♯; left by the same note.","ex":"F♯ over A♯°7: it sounds before Bm arrives, then the same note continues as a chord tone. Anticipation."},{"x":37.12,"y":79.71,"n":"F♯","c":"Bm","l":5,"k":7,"g":84,"m":"F♯ is a chord tone of Bm: the tied note where the anticipation lands."},{"x":45.07,"y":79.71,"n":"F♯","c":"D7","l":5,"k":8},{"x":49.79,"y":79.37,"n":"G","c":"D7","l":5,"k":9,"w":"when","t":"PT","cl":"Approached by step up from F♯; left by step up to A.","ex":"G over D7: step up from F♯, then on to A in the same direction. Passing tone."},{"x":54.38,"y":78.91,"n":"A","c":"D7","l":5,"k":10},{"x":58.97,"y":78.11,"n":"C♯","c":"G","l":5,"k":11,"w":"way","t":"APP","cl":"Approached by leap up from A; left by step down to B.","ex":"C♯ over G: leap up from A, then step down to B. Appoggiatura (accented)."},{"x":62.95,"y":78.57,"n":"B","c":"G","l":5,"k":12},{"x":66.85,"y":78.91,"n":"A","c":"D/F♯","l":5,"k":13},{"x":73.7,"y":80.51,"n":"D","c":"D/F♯","l":5,"k":14},{"x":77.95,"y":78.11,"n":"C♯","c":"G","l":5,"k":15,"w":"cry","t":"APP","cl":"Approached by leap up from D; left by step up to D.","ex":"C♯ over G: leap up from D, then step up to D. Appoggiatura (accented)."},{"x":81.92,"y":77.77,"n":"D","c":"G","l":5,"k":16},{"x":86.3,"y":78.91,"n":"A","c":"G","l":5,"k":17,"w":"clear","t":"ANT","o":1,"cl":"Approached by leap down from D; left by leap down to D.","ex":"A over G on “clear”: it arrives before D/F♯ and is held into it. An anticipation. Optional: some analysts count it, some don’t."},{"x":89.66,"y":78.91,"n":"A","c":"D/F♯","l":5,"k":18,"g":95,"m":"A is a chord tone of D/F♯: the tied note where the A on “clear” lands."},{"x":96.51,"y":80.51,"n":"D","c":"D/F♯","l":5,"k":19},{"x":8.97,"y":95.2,"n":"F♯","c":"Bm7","l":6,"k":1},{"x":15.34,"y":95.66,"n":"E","c":"Bm7","l":6,"k":2,"w":"I’m","t":"PT","cl":"Approached by step down from F♯; left by step down to D.","ex":"E over Bm7: step down from F♯, then on to D in the same direction. Passing tone."},{"x":21.71,"y":96.0,"n":"D","c":"E7","l":6,"k":3},{"x":28.08,"y":95.66,"n":"E","c":"E7","l":6,"k":4},{"x":35.82,"y":94.86,"n":"G","c":"C","l":6,"k":5},{"x":42.19,"y":95.2,"n":"F♯","c":"C","l":6,"k":6,"w":"new","t":"ET","cl":"Approached by step down from G; left by leap down to D.","ex":"F♯ over C: step down from G, then leap down to D. Escape tone. (You can also hear F♯ and D as a double neighbor around the E on “with.”)","acc":["ET","DN"]},{"x":48.56,"y":96.0,"n":"D","c":"A7","l":6,"k":7,"w":"world","t":"APP","cl":"Approached by leap down from F♯; left by step up to E.","ex":"D over A7: leap down from F♯, then step up to E. Appoggiatura (accented)."},{"x":54.93,"y":95.66,"n":"E","c":"A7","l":6,"k":8},{"x":63.01,"y":96.06,"n":"D","c":"D","l":6,"k":9},{"x":79.04,"y":96.06,"n":"D","c":"D","l":6,"k":10,"g":106}];
  const AWT = { D: "D–F♯–A", "G/B": "G–B–D", "A/C♯": "A–C♯–E", "Em/G": "E–G–B", "F♯7": "F♯–A♯–C♯–E", Bm: "B–D–F♯", "Bm/A": "B–D–F♯ over A", G: "G–B–D", A7: "A–C♯–E–G", "A7/C♯": "A–C♯–E–G",
    A: "A–C♯–E", "A♯°7": "A♯–C♯–E–G", D7: "D–F♯–A–C", "D/F♯": "D–F♯–A", Bm7: "B–D–F♯–A", E7: "E–G♯–B–D", A7sus4: "A–D–E–G", C: "C–E–G" };
  const AWK = ["PT", "NT", "DN", "APP", "ET", "SUS", "RET", "ANT", "HA", "PED"];
  // ===== "click the score" activities: a notated example whose noteheads are buttons. Click a note: chord tone → which chord; non-chord tone → choose its type.
  // Each set: notes [{ x, y (% of the image), n pitch, c chord, l "bar 3"/"line 2", k note number there, w lyric, t type, acc other accepted types, o optional, g tied-from index, ex, cl clue, m chord-tone message, lh left hand }]
  const EXN = {"mozart":[{"x":9.44,"y":25.79,"n":"G","c":"C","l":"pickup","k":1,"w":"Oi-","m":"G: the pickup. It leads into the C major chord, where G is the 5th: a chord tone."},{"x":13.75,"y":21.63,"n":"C","c":"C","l":"bar 1","k":1,"w":"-seaux"},{"x":17.81,"y":23.02,"n":"B","c":"C","l":"bar 1","k":2,"w":"si","t":"NT","ex":"B over C: a step down from C and straight back up. Neighbor tone (unaccented).","cl":"Approached by step down from C; left by step up back to C."},{"x":20.62,"y":21.63,"n":"C","c":"C","l":"bar 1","k":3,"w":"tous"},{"x":24.69,"y":23.02,"n":"B","c":"C","l":"bar 1","k":4,"w":"les","t":"NT","ex":"B over C: again a step down from C and back. Neighbor tone.","cl":"Approached by step down from C; left by step up back to C."},{"x":28.25,"y":21.63,"n":"C","c":"C","l":"bar 2","k":1,"w":"ans"},{"x":35.12,"y":25.79,"n":"G","c":"C","l":"bar 2","k":2,"w":"Vous"},{"x":39.44,"y":20.04,"n":"D","c":"G7","l":"bar 3","k":1,"w":"chan-"},{"x":43.62,"y":21.63,"n":"C♯","c":"G7","l":"bar 3","k":2,"w":"-gez","t":"NT","ex":"C♯ over G7: a step down from D and back up. A chromatic neighbor tone.","cl":"Approached by step down from D; left by step up back to D."},{"x":46.5,"y":20.04,"n":"D","c":"G7","l":"bar 3","k":3,"w":"de"},{"x":50.5,"y":21.63,"n":"C","c":"G7","l":"bar 3","k":4,"w":"cli","t":"NT","ex":"C over G7: a step down from D and back up. Neighbor tone. (C isn’t in G7: G–B–D–F.)","cl":"Approached by step down from D; left by step up back to D."},{"x":54.19,"y":20.04,"n":"D","c":"G7","l":"bar 4","k":1,"w":"mats"},{"x":61.12,"y":18.65,"n":"E","c":"C","l":"bar 4","k":2,"w":"Vous"},{"x":65.44,"y":15.87,"n":"G","c":"F","l":"bar 5","k":1,"w":"chan-","t":"APP","ex":"G over F: a leap up from E, then a step down to F. Appoggiatura, on the downbeat.","cl":"Approached by leap up from E; left by step down to F."},{"x":68.31,"y":17.26,"n":"F","c":"F","l":"bar 5","k":2},{"x":71.19,"y":18.65,"n":"E","c":"F","l":"bar 5","k":3,"w":"-gez","t":"PT","ex":"E over F: a step down from F, then on down to D. Passing tone.","cl":"Approached by step down from F; left by step down to D."},{"x":74.12,"y":20.04,"n":"D","c":"F","l":"bar 5","k":4,"t":"PT","ex":"D over F: the second of two passing tones, stepping from E down to C (a chord tone of the next chord).","cl":"Approached by step down from E; left by step down to C."},{"x":78.31,"y":21.63,"n":"C","c":"C/G","l":"bar 6","k":1,"w":"de"},{"x":82.38,"y":23.02,"n":"B","c":"G7","l":"bar 6","k":2,"w":"cli"},{"x":90.25,"y":21.63,"n":"C","c":"C","l":"bar 7","k":1,"w":"mats"}],"haydn":[{"x":12.75,"y":33.54,"n":"G","c":"E♭","l":"pickup","k":1},{"x":17.06,"y":33.54,"n":"G","c":"E♭","l":"bar 1","k":1},{"x":19.38,"y":33.54,"n":"G","c":"E♭","l":"bar 1","k":2},{"x":21.62,"y":33.54,"n":"G","c":"E♭","l":"bar 1","k":3},{"x":23.94,"y":33.54,"n":"G","c":"E♭","l":"bar 1","k":4},{"x":27.62,"y":33.54,"n":"G","c":"E♭","l":"bar 2","k":1},{"x":28.38,"y":87.46,"n":"E♭","c":"E♭","l":"bar 2","k":1,"m":"The low E♭ is the root of E♭: a chord tone. Listen for how long it is held.","lh":1},{"x":31.56,"y":71.47,"n":"E♭","c":"E♭","l":"bar 2","k":2,"lh":1,"m":"E♭ is the root of E♭: a chord tone. Keep it in mind: these repeated E♭s carry on into the next bar."},{"x":33.88,"y":29.15,"n":"B♭","c":"E♭","l":"bar 2","k":2},{"x":33.88,"y":71.47,"n":"E♭","c":"E♭","l":"bar 2","k":3,"lh":1,"m":"E♭ is the root of E♭: a chord tone. Keep it in mind: these repeated E♭s carry on into the next bar."},{"x":36.19,"y":38.24,"n":"E♭","c":"E♭","l":"bar 2","k":3},{"x":36.19,"y":71.47,"n":"E♭","c":"E♭","l":"bar 2","k":4,"lh":1,"m":"E♭ is the root of E♭: a chord tone. Keep it in mind: these repeated E♭s carry on into the next bar."},{"x":39.81,"y":40.13,"n":"D","c":"B♭7","l":"bar 3","k":1},{"x":39.81,"y":71.47,"n":"E♭","c":"B♭7","l":"bar 3","k":1,"t":"PED","lh":1,"ex":"E♭ under B♭7: the left hand keeps repeating E♭ while the harmony changes above it. Pedal tone (the low tied E♭ is the same pedal, an octave lower).","cl":"The same note repeats while the chords change above it.","alt":[14,16,18,20],"alttxt":"or any other left-hand E♭ in this bar"},{"x":39.81,"y":87.46,"n":"E♭","c":"B♭7","l":"bar 3","k":2,"t":"PED","lh":1,"ex":"Low E♭ under B♭7 (B♭–D–F–A♭): it is held over from the E♭ chord and stays while the harmony changes. Pedal tone.","cl":"The same note is held while the chords change above it.","alt":[13,16,18,20],"alttxt":"or any other left-hand E♭ in this bar"},{"x":42.12,"y":35.74,"n":"F","c":"B♭7","l":"bar 3","k":2},{"x":42.12,"y":71.47,"n":"E♭","c":"B♭7","l":"bar 3","k":3,"t":"PED","lh":1,"ex":"E♭ under B♭7: the left hand keeps repeating E♭ while the harmony changes above it. Pedal tone (the low tied E♭ is the same pedal, an octave lower).","cl":"The same note repeats while the chords change above it.","alt":[13,14,18,20],"alttxt":"or any other left-hand E♭ in this bar"},{"x":44.38,"y":31.35,"n":"A♭","c":"B♭7","l":"bar 3","k":3},{"x":44.44,"y":71.47,"n":"E♭","c":"B♭7","l":"bar 3","k":4,"t":"PED","lh":1,"ex":"E♭ under B♭7: the left hand keeps repeating E♭ while the harmony changes above it. Pedal tone (the low tied E♭ is the same pedal, an octave lower).","cl":"The same note repeats while the chords change above it.","alt":[13,14,16,20],"alttxt":"or any other left-hand E♭ in this bar"},{"x":46.75,"y":40.13,"n":"D","c":"B♭7","l":"bar 3","k":4},{"x":46.75,"y":71.47,"n":"E♭","c":"B♭7","l":"bar 3","k":5,"t":"PED","lh":1,"ex":"E♭ under B♭7: the left hand keeps repeating E♭ while the harmony changes above it. Pedal tone (the low tied E♭ is the same pedal, an octave lower).","cl":"The same note repeats while the chords change above it.","alt":[13,14,16,18],"alttxt":"or any other left-hand E♭ in this bar"},{"x":50.38,"y":38.24,"n":"E♭","c":"E♭","l":"bar 4","k":1},{"x":50.38,"y":87.46,"n":"E♭","c":"E♭","l":"bar 4","k":1,"lh":1,"m":"Over E♭ the low E♭ is the root: a chord tone. Watch what happens when it’s tied into the next bar."},{"x":52.81,"y":33.54,"n":"G","c":"E♭","l":"bar 4","k":2},{"x":52.81,"y":71.47,"n":"E♭","c":"E♭","l":"bar 4","k":2,"lh":1,"m":"E♭ is the root of E♭: a chord tone. Keep it in mind: these repeated E♭s carry on into the next bar."},{"x":55.44,"y":44.83,"n":"B♭","c":"E♭","l":"bar 4","k":3},{"x":55.44,"y":71.47,"n":"E♭","c":"E♭","l":"bar 4","k":3,"lh":1,"m":"E♭ is the root of E♭: a chord tone. Keep it in mind: these repeated E♭s carry on into the next bar."},{"x":57.75,"y":44.51,"n":"B♭","c":"E♭","l":"bar 4","k":4},{"x":57.75,"y":71.47,"n":"E♭","c":"E♭","l":"bar 4","k":4,"lh":1,"m":"E♭ is the root of E♭: a chord tone. Keep it in mind: these repeated E♭s carry on into the next bar."},{"x":61.38,"y":47.34,"n":"A♭","c":"B♭7","l":"bar 5","k":1},{"x":61.38,"y":71.47,"n":"E♭","c":"B♭7","l":"bar 5","k":1,"t":"PED","lh":1,"ex":"E♭ under B♭7: the left hand keeps repeating E♭ while the harmony changes above it. Pedal tone (the low tied E♭ is the same pedal, an octave lower).","cl":"The same note repeats while the chords change above it.","alt":[31,33,35,37],"alttxt":"or any other left-hand E♭ in this bar"},{"x":61.38,"y":87.46,"n":"E♭","c":"B♭7","l":"bar 5","k":2,"t":"PED","lh":1,"ex":"Low E♭ under B♭7 again: held through a chord it doesn’t belong to. Pedal tone.","cl":"The same note is held while the chords change above it.","alt":[30,33,35,37],"alttxt":"or any other left-hand E♭ in this bar"},{"x":63.69,"y":40.13,"n":"D","c":"B♭7","l":"bar 5","k":2},{"x":63.69,"y":71.47,"n":"E♭","c":"B♭7","l":"bar 5","k":3,"t":"PED","lh":1,"ex":"E♭ under B♭7: the left hand keeps repeating E♭ while the harmony changes above it. Pedal tone (the low tied E♭ is the same pedal, an octave lower).","cl":"The same note repeats while the chords change above it.","alt":[30,31,35,37],"alttxt":"or any other left-hand E♭ in this bar"},{"x":65.94,"y":35.74,"n":"F","c":"B♭7","l":"bar 5","k":3},{"x":66.0,"y":71.47,"n":"E♭","c":"B♭7","l":"bar 5","k":4,"t":"PED","lh":1,"ex":"E♭ under B♭7: the left hand keeps repeating E♭ while the harmony changes above it. Pedal tone (the low tied E♭ is the same pedal, an octave lower).","cl":"The same note repeats while the chords change above it.","alt":[30,31,33,37],"alttxt":"or any other left-hand E♭ in this bar"},{"x":68.31,"y":40.13,"n":"D","c":"B♭7","l":"bar 5","k":4},{"x":68.31,"y":71.47,"n":"E♭","c":"B♭7","l":"bar 5","k":5,"t":"PED","lh":1,"ex":"E♭ under B♭7: the left hand keeps repeating E♭ while the harmony changes above it. Pedal tone (the low tied E♭ is the same pedal, an octave lower).","cl":"The same note repeats while the chords change above it.","alt":[30,31,33,35],"alttxt":"or any other left-hand E♭ in this bar"},{"x":71.94,"y":38.24,"n":"E♭","c":"E♭","l":"bar 6","k":1},{"x":71.94,"y":87.46,"n":"E♭","c":"E♭","l":"bar 6","k":1,"lh":1,"m":"Over E♭ the low E♭ is the root: a chord tone."},{"x":74.38,"y":33.54,"n":"G","c":"E♭","l":"bar 6","k":2},{"x":74.44,"y":71.47,"n":"E♭","c":"E♭","l":"bar 6","k":2,"lh":1,"m":"E♭ is the root of E♭: a chord tone. Keep it in mind: these repeated E♭s carry on into the next bar."},{"x":77.0,"y":44.51,"n":"B♭","c":"E♭","l":"bar 6","k":3},{"x":77.06,"y":71.47,"n":"E♭","c":"E♭","l":"bar 6","k":3,"lh":1,"m":"E♭ is the root of E♭: a chord tone. Keep it in mind: these repeated E♭s carry on into the next bar."},{"x":79.31,"y":44.83,"n":"B♭","c":"E♭","l":"bar 6","k":4},{"x":79.31,"y":71.47,"n":"E♭","c":"E♭","l":"bar 6","k":4,"lh":1,"m":"E♭ is the root of E♭: a chord tone. Keep it in mind: these repeated E♭s carry on into the next bar."},{"x":82.94,"y":87.46,"n":"E♭","c":"B♭7","l":"bar 7","k":1,"t":"PED","lh":1,"ex":"Low E♭ under B♭7 a third time: a pedal tone.","cl":"The same note is held while the chords change above it.","alt":[48,50,52,54],"alttxt":"or any other left-hand E♭ in this bar"},{"x":83.0,"y":47.34,"n":"A♭","c":"B♭7","l":"bar 7","k":1},{"x":83.0,"y":71.47,"n":"E♭","c":"B♭7","l":"bar 7","k":2,"t":"PED","lh":1,"ex":"E♭ under B♭7: the left hand keeps repeating E♭ while the harmony changes above it. Pedal tone (the low tied E♭ is the same pedal, an octave lower).","cl":"The same note repeats while the chords change above it.","alt":[46,50,52,54],"alttxt":"or any other left-hand E♭ in this bar"},{"x":85.25,"y":40.13,"n":"D","c":"B♭7","l":"bar 7","k":2},{"x":85.25,"y":71.47,"n":"E♭","c":"B♭7","l":"bar 7","k":3,"t":"PED","lh":1,"ex":"E♭ under B♭7: the left hand keeps repeating E♭ while the harmony changes above it. Pedal tone (the low tied E♭ is the same pedal, an octave lower).","cl":"The same note repeats while the chords change above it.","alt":[46,48,52,54],"alttxt":"or any other left-hand E♭ in this bar"},{"x":87.56,"y":35.74,"n":"F","c":"B♭7","l":"bar 7","k":3},{"x":87.56,"y":71.47,"n":"E♭","c":"B♭7","l":"bar 7","k":4,"t":"PED","lh":1,"ex":"E♭ under B♭7: the left hand keeps repeating E♭ while the harmony changes above it. Pedal tone (the low tied E♭ is the same pedal, an octave lower).","cl":"The same note repeats while the chords change above it.","alt":[46,48,50,54],"alttxt":"or any other left-hand E♭ in this bar"},{"x":89.88,"y":40.13,"n":"D","c":"B♭7","l":"bar 7","k":4},{"x":89.88,"y":71.47,"n":"E♭","c":"B♭7","l":"bar 7","k":5,"t":"PED","lh":1,"ex":"E♭ under B♭7: the left hand keeps repeating E♭ while the harmony changes above it. Pedal tone (the low tied E♭ is the same pedal, an octave lower).","cl":"The same note repeats while the chords change above it.","alt":[46,48,50,52],"alttxt":"or any other left-hand E♭ in this bar"},{"x":93.44,"y":87.46,"n":"E♭","c":"E♭","l":"bar 8","k":1,"lh":1},{"x":93.5,"y":38.24,"n":"E♭","c":"E♭","l":"bar 8","k":1},{"x":93.56,"y":71.47,"n":"E♭","c":"E♭","l":"bar 8","k":2,"lh":1,"m":"E♭ is the root of E♭: a chord tone. Keep it in mind: these repeated E♭s carry on into the next bar."}],"tchaik":[{"x":12.94,"y":49.88,"n":"A","c":"Dm","l":"bar 1","k":1},{"x":16.0,"y":39.24,"n":"F","c":"Dm","l":"bar 1","k":2},{"x":19.0,"y":41.37,"n":"E","c":"Dm","l":"bar 1","k":3,"t":"NT","ex":"E over D minor: a step down from F and straight back up. Neighbor tone.","cl":"Approached by step down from F; left by step up back to F."},{"x":22.0,"y":39.24,"n":"F","c":"Dm","l":"bar 1","k":4},{"x":25.5,"y":45.39,"n":"C♯","c":"A7/E","l":"bar 1","k":5},{"x":35.44,"y":43.26,"n":"D","c":"Dm/F","l":"bar 2","k":1},{"x":38.44,"y":34.99,"n":"A","c":"Dm/F","l":"bar 2","k":2},{"x":41.69,"y":37.12,"n":"G♯","c":"Dm/F","l":"bar 2","k":3,"t":"NT","ex":"G♯ over D minor: a chromatic step down from A and back up. Neighbor tone.","cl":"Approached by step down from A; left by step up back to A."},{"x":44.69,"y":34.99,"n":"A","c":"Dm/F","l":"bar 2","k":4},{"x":47.75,"y":41.37,"n":"E","c":"E°/G","l":"bar 2","k":5},{"x":57.69,"y":39.24,"n":"F","c":"Dm/A","l":"bar 3","k":1},{"x":60.75,"y":37.12,"n":"G","c":"Dm/A","l":"bar 3","k":2,"t":"ET","ex":"G over D minor: a step up from F, then a leap down to D. Escape tone.","cl":"Approached by step up from F; left by leap down to D."},{"x":63.69,"y":43.26,"n":"D","c":"Dm/A","l":"bar 3","k":3},{"x":67.88,"y":41.37,"n":"E","c":"A","l":"bar 3","k":4},{"x":70.88,"y":39.24,"n":"F","c":"A","l":"bar 3","k":5,"t":"ET","ex":"F over A major: a step up from E, then a leap down to C♯. Escape tone.","cl":"Approached by step up from E; left by leap down to C♯."},{"x":74.31,"y":45.63,"n":"C♯","c":"A","l":"bar 3","k":6},{"x":80.12,"y":43.97,"n":"D","c":"Gm or Cm","l":"bar 4","k":1,"t":"APP","acc":["NT"],"alt":[17],"alttxt":"or the C after it","q":"If you hear C minor here (C–E♭–G), D is the dissonance. What kind of non-chord tone is it?","ex":"Hearing C minor: D arrives on the downbeat, a step up from C♯, and resolves down by step to C. An accented non-chord tone: call it an appoggiatura (or an accented neighbor). Hear G minor instead and D is a chord tone, while C becomes the passing tone.","cl":"Approached by step up from C♯; left by step down to C. Is the chord here G minor or C minor?"},{"x":84.31,"y":45.63,"n":"C","c":"Gm or Cm","l":"bar 4","k":2,"t":"PT","alt":[16],"alttxt":"or the D before it","q":"If you hear G minor here (G–B♭–D), C is the dissonance. What kind of non-chord tone is it?","ex":"Hearing G minor: C steps down from D and on down to B♭. Passing tone. Hear C minor instead and C is a chord tone, while the D before it is the dissonance.","cl":"Approached by step down from D; left by step down to B♭. Is the chord here G minor or C minor?"},{"x":87.44,"y":47.28,"n":"B♭","c":"Gm or Cm","l":"bar 4","k":3,"m":"B♭ fits either reading: it’s in G minor, and over the B♭ in the bass it’s the 7th of C minor (Cm7)."},{"x":90.38,"y":49.65,"n":"A","c":"A","l":"bar 4","k":4}],"sunshine":[{"x":9.56,"y":40.67,"n":"C","c":"F","l":"pickup","k":1,"w":"You"},{"x":13.12,"y":35.51,"n":"F","c":"F","l":"pickup","k":2,"w":"are"},{"x":16.69,"y":33.93,"n":"G","c":"F","l":"pickup","k":3,"w":"my","t":"PT","ex":"G in the pickup: a step up from F, then on up to A. Passing tone.","cl":"Approached by step up from F; left by step up to A."},{"x":21.69,"y":32.13,"n":"A","c":"F","l":"bar 1","k":1,"w":"sun-"},{"x":28.81,"y":32.13,"n":"A","c":"F","l":"bar 1","k":2,"w":"-shine"},{"x":37.31,"y":32.13,"n":"A","c":"F","l":"bar 1","k":3,"w":"my"},{"x":41.12,"y":33.93,"n":"G♯","c":"F","l":"bar 1","k":4,"w":"on-","t":"NT","ex":"G♯ over F: a chromatic step down from A and back up. Neighbor tone.","cl":"Approached by step down from A; left by step up back to A."},{"x":44.69,"y":32.13,"n":"A","c":"F","l":"bar 1","k":5,"w":"-ly"},{"x":49.62,"y":35.51,"n":"F","c":"F7","l":"bar 2","k":1,"w":"sun-"},{"x":54.56,"y":35.51,"n":"F","c":"F7","l":"bar 2","k":2,"w":"-shine"},{"x":63.06,"y":35.51,"n":"F","c":"F7","l":"bar 2","k":3,"w":"you"},{"x":67.31,"y":33.93,"n":"G","c":"F7","l":"bar 2","k":4,"w":"make","t":"PT","ex":"G over F7: a step up from F, then on up to A. Passing tone.","cl":"Approached by step up from F; left by step up to A."},{"x":71.31,"y":32.13,"n":"A","c":"F7","l":"bar 2","k":5,"w":"me"},{"x":76.19,"y":30.56,"n":"B♭","c":"B♭","l":"bar 3","k":1,"w":"hap-"},{"x":81.19,"y":27.42,"n":"D","c":"B♭","l":"bar 3","k":2,"w":"-py"},{"x":87.81,"y":27.42,"n":"D","c":"B♭","l":"bar 3","k":3,"w":"when"},{"x":92.62,"y":28.99,"n":"C","c":"B♭","l":"bar 3","k":4,"w":"skies","t":"PT","ex":"C over B♭: a step down from D, then on down to B♭. Passing tone.","cl":"Approached by step down from D; left by step down to B♭."},{"x":96.38,"y":30.79,"n":"B♭","c":"B♭","l":"bar 3","k":5,"w":"are"},{"x":9.25,"y":74.61,"n":"A","c":"F","l":"bar 4","k":1,"w":"gray"},{"x":16.19,"y":81.35,"n":"F","c":"F7","l":"bar 4","k":2,"w":"You"},{"x":19.88,"y":79.78,"n":"G","c":"F7","l":"bar 4","k":3,"w":"nev-","t":"PT","ex":"G over F7: a step up from F, then on up to A. Passing tone.","cl":"Approached by step up from F; left by step up to A."},{"x":22.94,"y":78.2,"n":"A","c":"F7","l":"bar 4","k":4,"w":"-er"},{"x":26.69,"y":76.4,"n":"B♭","c":"B♭","l":"bar 5","k":1,"w":"know,"},{"x":31.69,"y":73.26,"n":"D","c":"B♭","l":"bar 5","k":2,"w":"dear,"},{"x":36.31,"y":73.26,"n":"D","c":"B♭","l":"bar 5","k":3,"w":"how"},{"x":40.88,"y":74.83,"n":"C","c":"B♭","l":"bar 5","k":4,"w":"much","t":"PT","ex":"C over B♭: a step down from D, then on down to B♭. Passing tone.","cl":"Approached by step down from D; left by step down to B♭."},{"x":44.0,"y":76.4,"n":"B♭","c":"B♭","l":"bar 5","k":5,"w":"I"},{"x":47.94,"y":78.2,"n":"A","c":"F","l":"bar 6","k":1,"w":"love"},{"x":52.0,"y":81.35,"n":"F","c":"F","l":"bar 6","k":2,"w":"you."},{"x":58.81,"y":81.35,"n":"F","c":"Dm","l":"bar 6","k":3,"w":"Please"},{"x":63.94,"y":79.78,"n":"G","c":"Dm","l":"bar 6","k":4,"w":"don’t","t":"PT","ex":"G over D minor: a step up from F, then on up to A. Passing tone.","cl":"Approached by step up from F; left by step up to A."},{"x":68.12,"y":78.2,"n":"A","c":"F/C","l":"bar 7","k":1,"w":"take"},{"x":72.69,"y":76.4,"n":"B♭","c":"F/C","l":"bar 7","k":2,"w":"my","t":"ET","acc":["HA"],"ex":"B♭ over F/C: a step up from A, then a leap down to G. Escape tone, or a harmonic anticipation: B♭ belongs to the C7 that follows, but the melody leaps to a different note of it (G).","cl":"Approached by step up from A; left by leap down to G."},{"x":75.94,"y":79.78,"n":"G","c":"C7","l":"bar 7","k":3,"w":"sun-"},{"x":80.38,"y":79.78,"n":"G","c":"C7","l":"bar 7","k":4,"w":"-shine"},{"x":83.44,"y":78.2,"n":"A","c":"C7","l":"bar 7","k":5,"w":"a-","t":"ET","acc":["HA"],"ex":"A over C7: a step up from G, then a leap down to F. Escape tone, or a harmonic anticipation of the F chord.","cl":"Approached by step up from G; left by leap down to F."},{"x":87.38,"y":81.35,"n":"F","c":"F","l":"bar 8","k":1,"w":"-way."}]};
  const TONES = Object.assign({}, AWT, { C: "C–E–G", "C/G": "C–E–G", F: "F–A–C", G7: "G–B–D–F", "E♭": "E♭–G–B♭", "B♭7": "B♭–D–F–A♭", Dm: "D–F–A", "Dm/F": "D–F–A", "Dm/A": "D–F–A",
    "A7/E": "A–C♯–E–G", "E°/G": "E–G–B♭", "B♭": "B♭–D–F", F7: "F–A–C–E♭", "F/C": "F–A–C", C7: "C–E–G–B♭" });
  const SFI = (f, w, h, alt) => `<img src="assets/img/nct-intro/${f}" alt="${alt}" width="${w}" height="${h}">`;
  const AWVID = `<div class="aw-vid"><iframe src="https://www.youtube-nocookie.com/embed/hZ1Rb9hC4JY?start=16&rel=0" title="A Whole New World, from Aladdin (1992), on YouTube" loading="lazy" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`;
  const SFA = (f, label) => `<audio controls preload="none" src="assets/audio/nct-intro/${f}.mp3" aria-label="${label}" style="width:100%"></audio>`;
  const SFS = {
    song: { notes: AW.map(e => Object.assign({}, e, { l: "line " + e.l })), img: SFI("awnw.png", 1460, 1750, "Lead sheet of A Whole New World in D major, 28 bars in six lines, melody with lyrics and chord symbols. Each melody note is a button."), min: 620, kicker: "A Whole New World",
      text: "Listen, then click every melody note that doesn't belong to the chord above it. Each time you find one, name its type. Click Check at any point for a hint about what's left.", fig: AWVID,
      explain: "In this song: 14 double-neighbor notes (Menken loves circling a note before landing on it), 8 anticipations, 7 appoggiaturas, 5 passing tones, 2 escape tones and 1 neighbor tone. Alan Menken and Tim Rice, “A Whole New World,” from Aladdin (1992)." },
    mozart: { notes: EXN.mozart, img: SFI("ex-mozart.png", 1600, 504, "Mozart, You Birds, So Every Year: voice and piano in C major, 2/4, a pickup and seven bars. Each note of the vocal line is a button."), min: 640, kicker: "Mozart: You Birds",
      text: "The harmony is in the piano. Click each note of the vocal line that isn't in the chord the piano plays under it, and name its type.", fig: SFA("mozart-oiseaux", "Mozart, You Birds, So Every Year, performed by Juliane Banse and András Schiff"),
      explain: "Four neighbor tones in the first phrase, then an appoggiatura and two passing tones on “changez.” W. A. Mozart, “You Birds, So Every Year” (“Oiseaux, si tous les ans,” K. 307), performed by Juliane Banse and András Schiff." },
    haydn: { notes: EXN.haydn, img: SFI("ex-haydn.png", 1600, 319, "Haydn, Piano Sonata No. 62 in E-flat major, finale: a pickup and eight bars for piano. Each right-hand note and each left-hand E-flat is a button."), min: 640, kicker: "Haydn: Sonata No. 62",
      text: "Every right-hand note fits its chord, so look lower: click the right-hand notes and the left-hand E♭s, and find the non-chord tones.", fig: SFA("haydn-sonata62", "Haydn, Piano Sonata No. 62, finale, performed by John Lill"),
      explain: "In each B♭7 bar the left hand holds the low E♭ and keeps repeating the E♭ above it: neither is in B♭7, so both are the pedal tone (any of them counts), three times. Joseph Haydn, Piano Sonata No. 62 in E♭ major, Hob. XVI:52, finale, performed by John Lill." },
    tchaik: { notes: EXN.tchaik, img: SFI("ex-tchaik-nocturne.png", 1600, 423, "Tchaikovsky, Nocturne: four bars for piano in D minor. Each note of the right-hand melody is a button."), min: 640, kicker: "Tchaikovsky: Nocturne",
      text: "The chords are in the left hand. Click each melody note that doesn't belong to the chord under it, and name its type.", fig: SFA("tchaikovsky-nocturne", "Tchaikovsky, Nocturne, performed by Alexandre Tharaud"),
      explain: "Two neighbor tones and two escape tones; then in the last bar, a passing tone on C if you hear G minor, or an accented D if you hear C minor. Piotr Tchaikovsky, Nocturne, performed by Alexandre Tharaud." },
    sunshine: { notes: EXN.sunshine, img: SFI("ex-sunshine.png", 1600, 445, "Oliver Hood, You Are My Sunshine: lead sheet in F major with chord symbols and lyrics, a pickup and eight bars on two lines. Each melody note is a button."), min: 640, kicker: "You Are My Sunshine",
      text: "Compare each melody note with the chord symbol above it. Click the ones that don't belong, and name their types.",
      explain: "Six passing tones and a neighbor tone, then two notes at the end that are escape tones or harmonic anticipations. Oliver Hood, “You Are My Sunshine” (1939)." },
  };
  // double neighbors come in pairs: D.pair[i] = the other note of i's pair (naming one names both)
  Object.values(SFS).forEach(D => { D.pair = {}; const dn = D.notes.map((e, i) => i).filter(i => D.notes[i].t === "DN" && D.notes[i].g == null); for (let k = 0; k + 1 < dn.length; k += 2) { D.pair[dn[k]] = dn[k + 1]; D.pair[dn[k + 1]] = dn[k]; } });
  Object.values(SFS).forEach(D => { D.req = D.notes.map((e, i) => i).filter(i => { const e = D.notes[i]; return e.t && !e.o && e.g == null && !(e.alt && e.alt.some(j => j < i)); }); });
  // e.alt: an either/or pair (two analyses); finding and naming either note satisfies the one required answer
  const sfF = (D, st, i) => !!(st.f[i] || (D.notes[i].alt || []).some(j => st.f[j])), sfOK = (D, st, i) => !!(st.ok[i] || (D.notes[i].alt || []).some(j => st.ok[j]));
  const sfWhere = (D, i) => { const e = D.notes[i]; return `${e.l === "pickup" ? "the pickup" : e.l}, ${e.lh ? "left hand, " : ""}note ${e.k}${e.w ? ` (“${e.w}”)` : ""}`; };
  const sfLab = (D, st, i, done) => { const e = D.notes[i], named = (done || st.ok[i]) && e.t && e.g == null;
    return `${sfWhere(D, i).replace(/ \(“.*”\)$/, "").replace(/^./, s => s.toUpperCase())}: ${e.n}${named ? `, ${NAME[e.t]}` : st.f[i] ? ", non-chord tone, type not yet named" : st.ct[i] ? ", chord tone" : ""}`; };
  function sfTag(D, st, i, done) {
    const e = D.notes[i], p = D.pair[i];
    if (!((st.ok[i] || (done && !(e.alt && e.alt.some(j => j < i)))) && e.t && e.g == null)) return "";
    if (p != null) { if (p < i) return ""; const f = D.notes[p], top = Math.min(e.y, f.y);
      return `<span class="aw-join" style="left:${e.x}%;width:${f.x - e.x}%;top:${top}%" aria-hidden="true"></span><span class="aw-tag" style="left:${(e.x + f.x) / 2}%;top:${top}%" aria-hidden="true">DN</span>`; }
    return `<span class="aw-tag" style="left:${e.x}%;top:${e.y}%" aria-hidden="true">${e.t}${e.o ? "?" : ""}</span>`;
  }
  function sfHTML(D, st, H, done) {
    const cls = i => { const e = D.notes[i]; if (done) return e.t && e.g == null ? (e.o || e.alt ? " ok op" : " ok") : ""; if (st.ok[i]) return e.o ? " ok op" : " ok"; if (st.f[i]) return " nf"; if (st.ct[i]) return " ct"; return ""; };
    const tag = i => sfTag(D, st, i, done);
    const key = done ? `<details class="aw-key" open><summary>Answer key</summary><ul>${D.notes.map((e, i) => e.t && e.g == null ? (e.alt && e.alt.some(j => j < i)) ? "" : `<li>${e.o ? "(optional) " : ""}<b>${e.t}</b>: ${sfWhere(D, i)}${e.alttxt ? " " + e.alttxt : ""}. ${H.esc(e.ex)}</li>` : "").join("")}</ul></details>` : "";
    return `<div class="aw">
      <div class="aw-wrap"${done ? ' tabindex="0" role="region" aria-label="Score with the answers marked"' : ""}><div class="aw-score" style="min-width:${D.min || 620}px">${D.img}
        ${D.notes.map((e, i) => `<button type="button" class="aw-n${cls(i)}" style="left:${e.x}%;top:${e.y}%" data-aw="${i}" aria-label="${H.esc(sfLab(D, st, i, done))}"${done ? " disabled" : ""}></button>${tag(i)}`).join("")}</div></div>
      ${done ? "" : `<div class="aw-pick" hidden><p class="aw-q"></p><div class="pick-row" role="group" aria-label="Type of non-chord tone">${AWK.map(t => `<button type="button" class="pk" data-awt="${t}">${NAME[t]} (${t})</button>`).join("")}</div></div>`}
      <p class="aw-fb" aria-live="polite"></p>
      <p class="aw-tally" aria-live="polite"></p><div class="aw-hints" aria-live="polite"></div>${key}</div>`;
  }
  function sfWire(box, D, st, H) {
    const pick = box.querySelector(".aw-pick"), fb = box.querySelector(".aw-fb"), N = D.notes;
    let cur = null;
    const say = h => { fb.innerHTML = h; };
    const tally = () => { const f = D.req.filter(i => sfF(D, st, i)).length, n = D.req.filter(i => sfOK(D, st, i)).length;
      box.querySelector(".aw-tally").textContent = `Non-chord tones found: ${f} of ${D.req.length}. Named correctly: ${n}.`; };
    const paint = i => { const b = box.querySelector(`[data-aw="${i}"]`), e = N[i];
      b.className = "aw-n" + (st.ok[i] ? (e.o ? " ok op" : " ok") : st.f[i] ? " nf" : st.ct[i] ? " ct" : "");
      b.setAttribute("aria-label", sfLab(D, st, i, false));
      while (b.nextElementSibling && /aw-(tag|join)/.test(b.nextElementSibling.className)) b.nextElementSibling.remove();
      b.insertAdjacentHTML("afterend", sfTag(D, st, i, false)); };
    const tones = c => TONES[c] ? ` (${TONES[c]})` : "";
    box.addEventListener("click", ev => {
      const n = ev.target.closest("[data-aw]"), t = ev.target.closest("[data-awt]");
      if (n) {
        let i = +n.dataset.aw; const e0 = N[i];
        if (e0.g != null && N[e0.g].t && !N[e0.g].o && e0.t) i = e0.g;   // the tied half of a non-chord tone
        const e = N[i]; n.classList.remove("awh");
        if (!e.t) { pick.hidden = true; cur = null; st.ct[i] = 1; paint(i); say(e.m ? H.esc(e.m) : `<b>${e.n}</b> is a chord tone of ${e.c}${tones(e.c)}.`); return; }
        if (st.ok[i]) { pick.hidden = true; say(`<b>${NAME[e.t]}.</b> ${H.esc(e.ex)}`); return; }
        st.f[i] = 1; paint(i); tally(); say(""); cur = i; pick.hidden = false;
        pick.querySelector(".aw-q").innerHTML = e.q ? H.esc(e.q) : `Yes: <b>${e.n}</b> is not in ${e.c}${tones(e.c)}. What kind of non-chord tone is it?`;
        pick.querySelector("[data-awt]").focus(); return;
      }
      if (t && cur != null) {
        const e = N[cur], v = t.dataset.awt, good = v === e.t || (e.acc || []).includes(v);
        if (good || e.o) { st.ok[cur] = 1; const p = v === "DN" ? D.pair[cur] : null;
          if (p != null) { st.f[p] = st.ok[p] = 1; paint(p); }   // naming one double neighbor names its partner too
          paint(cur); tally(); pick.hidden = true;
          say(`${good ? "<b>Right.</b> " : `<b>Most would call it ${NAME[e.t].toLowerCase()}.</b> `}${H.esc(e.ex)}${p != null ? ` The ${N[p].n}${N[p].w ? ` on “${N[p].w}”` : ""} is the other half of the pair, so it’s marked too.` : ""}`);
          const b = box.querySelector(`[data-aw="${cur}"]`); cur = null; b.focus(); return; }
        say(`Not ${/^[AEIOU]/.test(NAME[v]) ? "an" : "a"} ${NAME[v].toLowerCase()}. Clue: ${H.esc(e.cl)} Compare with the chart: ${NAME[v].toLowerCase()} is approached by ${HOW[v][0]} and left by ${HOW[v][1]}.`);
      }
    });
    tally();
  }
  // graded hints on Check; true when every required note is found and named
  function sfCheck(box, D, st) {
    const miss = D.req.filter(i => !sfF(D, st, i)), un = D.req.filter(i => sfF(D, st, i) && !sfOK(D, st, i));
    if (!miss.length && !un.length) return true;
    st.chk++;
    const lv = Math.min(st.chk, 3), where = {}, N = D.notes; miss.forEach(i => where[N[i].l] = (where[N[i].l] || 0) + 1);
    let h = `<p><b>Not finished yet.</b> ${miss.length ? `${miss.length} non-chord tone${miss.length > 1 ? "s are" : " is"} still unfound.` : "You've found them all."}${un.length ? ` ${un.length} found note${un.length > 1 ? "s" : ""} (orange) still need${un.length > 1 ? "" : "s"} a type: click ${un.length > 1 ? "them" : "it"} again.` : ""}</p>`;
    if (miss.length) {
      if (lv === 1) h += `<p>Where to look: ${Object.entries(where).map(([l, n]) => `${l === "pickup" ? "the pickup" : l} (${n})`).join(", ")}. For each note, ask: is it in the chord sounding with it? Check again for more help.</p>`;
      else if (lv === 2) h += `<p>Try these:</p><ul>${miss.map(i => `<li>${sfWhere(D, i)}${N[i].alttxt ? " " + N[i].alttxt : ""}: ${N[i].n} over ${N[i].c}</li>`).join("")}</ul><p>Check again to see them outlined.</p>`;
      else { h += `<p>The missing notes are outlined in blue. Click each one and choose its type.</p><ul>${miss.map(i => `<li>${sfWhere(D, i)}: ${H_esc(N[i].cl)}</li>`).join("")}</ul>`;
        miss.forEach(i => [i, ...(N[i].alt || [])].forEach(j => box.querySelector(`[data-aw="${j}"]`).classList.add("awh"))); }
    }
    box.querySelector(".aw-hints").innerHTML = h;
    return false;
  }
  const sfState = () => ({ f: {}, ok: {}, ct: {}, chk: 0 });
  // drill mode "real": one question = one piece; buttons switch pieces (each keeps its own progress); finishing the shown piece answers the question
  const SFR = ["song", "mozart", "haydn", "tchaik", "sunshine"];
  let sfrNext = 0;
  const SFRW = {
    html(c, q, H) {
      const R = q.sr || (q.sr = { cur: c.ds, st: {} }), D = SFS[R.cur], st = R.st[R.cur] || (R.st[R.cur] = sfState());
      return `<h3 class="sfr-name">${D.kicker}</h3><p class="sfr-text">${D.text}</p>${D.fig || ""}${sfHTML(D, st, H, q.done)}`;
    },
    wire(root, c, q, H) {
      root.__awq = q; root.__awH = H; root.querySelector("[data-wcheck]").disabled = false;
      sfWire(root.querySelector(".aw"), SFS[q.sr.cur], q.sr.st[q.sr.cur], H);
    },
    value(root) { const q = root.__awq, R = q.sr, D = SFS[R.cur];
      if (!sfCheck(root.querySelector(".aw"), D, R.st[R.cur])) return null;
      q.c.answer = `All ${D.req.length} found and named in ${D.kicker}`; q.c.explain = D.explain; return q.correctValue; },
  };
  // the "Real music" mode button opens a menu of pieces (each piece keeps its progress while the question is open)
  function sfrPick(id, btn) {
    const work = document.getElementById("work"), modeOn = btn.getAttribute("aria-pressed") === "true";
    sfrNext = SFR.indexOf(id);
    if (!modeOn) btn.onclick && btn.onclick();
    const q = work.__awq, live = q && q.c && q.c.widget === "sfr" && work.querySelector(".aw button:not([disabled])");
    if (live) { sfrNext = SFR.indexOf(id) + 1; if (q.sr.cur !== id) { q.sr.cur = id; work.querySelector(".widget").innerHTML = SFRW.html(q.c, q, work.__awH); SFRW.wire(work, q.c, q, work.__awH); } }
    else { const nb = document.getElementById("nextBtn"); if (nb) nb.click(); }
    const h = document.getElementById("qHead"); if (h) h.focus();
  }
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    let menu = null, opener = null;
    const close = (back) => { if (!menu) return; menu.remove(); menu = null; opener.setAttribute("aria-expanded", "false"); if (back) opener.focus(); };
    const open = btn => {
      opener = btn; btn.setAttribute("aria-expanded", "true");
      const r = btn.getBoundingClientRect();
      menu = document.createElement("div"); menu.className = "sfr-menu"; menu.setAttribute("role", "menu"); menu.setAttribute("aria-label", "Choose a piece");
      menu.innerHTML = SFR.map(id => `<button type="button" role="menuitem" data-sfm="${id}">${SFS[id].kicker}</button>`).join("");
      menu.style.top = (r.bottom + scrollY + 4) + "px"; menu.style.left = Math.max(8, Math.min(r.left + scrollX, scrollX + document.documentElement.clientWidth - 288)) + "px"; menu.style.minWidth = Math.min(r.width, 280) + "px";
      document.body.appendChild(menu); menu.querySelector("button").focus();
    };
    const setup = () => { const b = document.querySelector('.modes [data-mode="real"]'); if (b) { b.setAttribute("aria-haspopup", "menu"); b.setAttribute("aria-expanded", "false"); } };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup); else setup();
    window.addEventListener("click", e => {
      const b = e.target.closest && e.target.closest('.modes [data-mode="real"]');
      if (b) { e.stopPropagation(); e.preventDefault(); if (menu) close(true); else open(b); return; }
      const it = menu && e.target.closest && e.target.closest("[data-sfm]");
      if (it) { e.stopPropagation(); const id = it.dataset.sfm, btn = opener; close(false); sfrPick(id, btn); return; }
      if (menu && !menu.contains(e.target)) close(false);
    }, true);
    window.addEventListener("keydown", e => {
      if (!menu) return;
      const items = [...menu.querySelectorAll("[data-sfm]")], i = items.indexOf(document.activeElement);
      if (e.key === "Escape") { e.preventDefault(); close(true); }
      else if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); e.stopPropagation(); items[(i + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length].focus(); }
      else if (e.key === "Home" || e.key === "End") { e.preventDefault(); items[e.key === "Home" ? 0 : items.length - 1].focus(); }
      else if (e.key === "Tab") close(false);
    }, true);
  }
  const widgets = { sfr: SFRW };
  // ===== drill: complete the chart (selects in blank cells; one check, then the full chart with ✓/✗) =====
  const CHART = [["PT", "step", "step in the same direction"], ["NT", "step", "step in the opposite direction"], ["DN", "step", "skip to the other side of the target, then step to it"],
    ["APP", "leap", "step"], ["ET", "step", "leap"], ["SUS", "same note", "step down"], ["RET", "same note", "step up"], ["ANT", "step or leap", "same note"],
    ["HA", "step or leap", "a different note of the next chord"], ["PED", "same note", "same note"]];
  const CCOL = ["Type", "Approached by", "Left by"], cval = (r, c) => c ? CHART[r][c] : `${NAME[CHART[r][0]]} (${CHART[r][0]})`;
  const COPT = [0, 1, 2].map(c => [...new Set(CHART.map((_, r) => cval(r, c)))].sort());
  widgets.ncchart = {
    html(c, q, H) {
      const v = q.cc || (q.cc = {}), bl = new Set(c.cb.map(([r, k]) => r + "," + k));
      const cell = (r, k) => { const id = r + "," + k, right = cval(r, k);
        if (!bl.has(id)) return k ? H.esc(right) : `<b>${H.esc(right)}</b>`;
        if (q.done) return v[id] === right ? `<span class="cc-ok">✓ ${H.esc(right)}</span>` : `<span class="cc-bad"><s>${H.esc(v[id] || "—")}</s></span> <span class="cc-ok">${H.esc(right)}</span>`;
        const rowName = k ? cval(r, 0) : `row ${r + 1} (approached by ${CHART[r][1]}, left by ${CHART[r][2]})`;
        return `<select data-cc="${id}" aria-label="${H.esc(CCOL[k])} for ${H.esc(rowName)}"><option value="">Choose…</option>${COPT[k].map(o => `<option${v[id] === o ? " selected" : ""}>${H.esc(o)}</option>`).join("")}</select>`; };
      return `<div class="ltable-wrap cc" tabindex="0" role="region" aria-label="Non-chord tone chart"><table class="ltable"><caption class="sr">Non-chord tone chart with blanks to fill in</caption><thead><tr>${CCOL.map(h => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${CHART.map((_, r) => `<tr>${[0, 1, 2].map(k => k ? `<td>${cell(r, k)}</td>` : `<th scope="row">${cell(r, k)}</th>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    },
    wire(root, c, q) {
      const btn = root.querySelector("[data-wcheck]"), sel = [...root.querySelectorAll("[data-cc]")];
      const sync = () => { btn.disabled = sel.some(s => !s.value); };
      root.querySelector(".cc").onchange = e => { const s = e.target.closest("[data-cc]"); if (s) { q.cc[s.dataset.cc] = s.value; sync(); } };
      sync();
    },
    value(root) {
      const sel = [...root.querySelectorAll("[data-cc]")]; if (sel.some(s => !s.value)) return null;
      const ok = sel.filter(s => { const [r, k] = s.dataset.cc.split(",").map(Number); return s.value === cval(r, k); }).length;
      return ok === sel.length ? "every blank filled in correctly" : `a chart with ${ok} of ${sel.length} blanks right`;
    },
  };
  const H_esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

  function make(mode, H) {
    if (mode === "chart") {
      const cells = H.shuffle(CHART.flatMap((_, r) => [0, 1, 2].map(k => [r, k]))), cb = [], per = {};
      for (const [r, k] of cells) { if (cb.length >= 7) break; if ((per[r] || 0) >= 2) continue; per[r] = (per[r] || 0) + 1; cb.push([r, k]); }
      return { kicker: "The chart", text: "Complete the chart: choose the missing type, approach or resolution in each blank, then Check.", answer: "every blank filled in correctly", choices: [], widget: "ncchart", cb,
        explain: "Read each row as a recipe: how the melody gets to the non-chord tone (approached by) and how it gets away (left by). Steps on both sides: passing and neighbor tones. One leap: appoggiatura (leap in) or escape tone (leap out). Held over: suspension (down) or retardation (up). Early: anticipation." };
    }
    if (mode === "real") { const id = SFR[sfrNext++ % SFR.length]; return { kicker: "Real music", text: "Listen, then click every note that doesn't belong to the chord sounding with it, and name its type. Check gives a hint about what's left. Use the Real music menu to switch pieces.", answer: `All found and named in ${SFS[id].kicker}`, choices: [], widget: "sfr", ds: id, explain: SFS[id].explain }; }
    if (mode === "name" || mode === "find") {
      const pool = ["PT", "NT", "APP", "ET", "SUS", "RET", "ANT", "HA", "DN"].filter(t => H.topicOn(TOPIC[t]) && !(mode === "find" && t === "DN"));
      const want = H.rnd(pool.length ? pool : ["PT"]), x = gen(H, want);
      if (!x) return null;
      const a = x.ncts[0], n = x.notes[a], d = x.prog[Math.min(3, Math.floor(n.t / 2))], c = H.diat(x.k, d);
      const nn = H.nm(dn(H, x.k, n.i)), why = `In ${x.k.label}, the chord there is ${c.sym} (${c.tones.map(H.nm).join("–")}), so ${nn} is not a chord tone. It's approached by ${HOW[want][0]} and left by ${HOW[want][1]}: ${NAME[want].toLowerCase()} (${want}).`;
      const play = spec(H, x).bars && H.scorePlay(spec(H, x));
      if (mode === "name")
        return H.mc(`In ${x.k.label}: what kind of non-chord tone is circled?`, NAME[want], Object.values(NAME).filter(v => v !== NAME.PED), why, { kicker: "Name it", staff: spec(H, x, { hl: true }), staffAns: spec(H, x, { tags: true, hl: true }), playQ: play, playQLabel: "Play", topic: TOPIC[want] });
      return H.mc(`In ${x.k.label}: click the non-chord tone in the melody.`, NOTEL(H, x, a), x.notes.map((_, i) => NOTEL(H, x, i)).filter((_, i) => i !== a && i > 0 && i < x.notes.length - 1), why, { kicker: "Find it", staff: Object.assign(spec(H, x, { pick: true }), { pick: true }), staffAns: spec(H, x, { tags: true, hl: true }), pick: "Click a note in the melody (the top staff), or tab to it and press Enter.", playQ: play, playQLabel: "Play", topic: TOPIC[want], nWrong: 3 });
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
  // note positions are in the original 2256 x 1232 score image (shown at any width, so stored as percentages)
  const MZ = [
    ["Basses, bar 43, G", 578, 358, "G is the root of G minor: a chord tone."], ["Basses, bar 43, G", 695, 358, "A chord tone of G minor."], ["Basses, bar 43, G", 811, 358, "Still a chord tone of G minor, and the preparation of what comes next."],
    ["Basses, bar 43, G", 928, 358, "B43"], ["Basses, bar 43, F♯", 1066, 369, "F♯ is where the G before it resolves."], ["Basses, bar 43, F♯", 1161, 369, "The resolution, held."],
    ["Basses, bar 44, C", 1469, 327, "C is the 7th of D7: a chord tone."], ["Basses, bar 44, C", 1630, 327, "Still the 7th of D7, and the preparation of what comes next."], ["Basses, bar 44, C", 1746, 327, "B44"], ["Basses, bar 44, B♭", 1979, 338, "B♭ is the 3rd of G minor: the resolution of the C before it."],
    ["Tenors, bar 44, D", 1863, 152, "D is the 5th of G minor: a chord tone."], ["Tenors, bar 44, D", 1979, 152, "A chord tone of G minor."], ["Tenors, bar 44, D", 2095, 152, "A chord tone of G minor, and the preparation of what comes next."],
    ["Tenors, bar 45, D", 282, 768, "T45"], ["Tenors, bar 45, C♯", 442, 778, "C♯ belongs to C♯ø7 (C♯–E–G–B♭). It is where the D above it resolves."], ["Tenors, bar 45, C♯", 538, 778, "A chord tone of C♯ø7."],
    ["Tenors, bar 45, G", 941, 738, "G is the 7th of A7: a chord tone. Keep an eye on it, though: it is held into the next bar."], ["Tenors, bar 45, G", 1100, 738, "Still the 7th of A7: a chord tone, and the preparation of what comes next."],
    ["Tenors, bar 46, G", 1245, 738, "T46"], ["Tenors, bar 46, F♯", 1474, 747, "F♯ is the 3rd of D7: the resolution of the G before it."],
    ["Tenors, bar 46, F", 1817, 747, "F is the 7th of G7: a chord tone."], ["Tenors, bar 46, F", 1969, 747, "A chord tone of G7."], ["Tenors, bar 46, F", 2084, 747, "A chord tone of G7."],
    ["Basses, bar 45, B♭", 397, 988, "B♭ is the 7th of C♯ø7: a chord tone."], ["Basses, bar 45, G", 538, 1008, "G is the 5th of C♯ø7: a chord tone."],
    ["Basses, bar 45, A", 652, 998, "PT"], ["Basses, bar 45, B♭", 740, 988, "A chord tone of C♯ø7."],
    ["Basses, bar 45, E", 827, 1029, "E is the 3rd of C♯ø7, and the bass named by the slash."], ["Basses, bar 45, A", 1021, 998, "A is the root of A7."],
    ["Basses, bar 46, C", 1359, 977, "C is the 7th of D7: a chord tone."], ["Basses, bar 46, C", 1474, 977, "C is the 7th of D7: a chord tone."], ["Basses, bar 46, C", 1588, 977, "Still a chord tone of D7, and the preparation of what comes next."],
    ["Basses, bar 46, C", 1703, 977, "B46"], ["Basses, bar 46, B♮", 1874, 988, "B♮ is the 3rd of G7: the resolution of the C before it."], ["Basses, bar 46, B♮", 1969, 988, "A chord tone of G7."]];
  const SUSQ = {
    B43: { where: "Basses, bar 43", fmt: "notation with chord symbols", sus: "G", res: "F♯", chord: "A°", opts: ["A", "C", "E♭", "G"], bass: "A", ladder: "ABCDEFG", n: 7, r: 6, fig: "7-6",
      why: "A° has no slash, so the bass is its root, A, below the singing basses (the orchestra plays it). The suspension is in the bass voice, but it is not the lowest note, so measure from A.", note: "Prepared as the root of G minor, held into beat 3, then down to F♯." },
    B44: { where: "Basses, bar 44", fmt: "notation with chord symbols", sus: "C", res: "B♭", chord: "Gm", opts: ["G", "B♭", "D", "C"], bass: "G", ladder: "GABC", n: 4, r: 3, fig: "4-3",
      why: "Gm has no slash, so the bass is its root, G (played by the orchestra, below the singing basses).", note: "Prepared as the 7th of D7, held into beat 3, then down to B♭." },
    T45: { where: "Tenors, bar 45", fmt: "notation with chord symbols", sus: "D", res: "C♯", chord: "C♯ø7/E", opts: ["C♯", "E", "G", "D"], bass: "E", ladder: "EFGABCD", n: 7, r: 6, fig: "7-6",
      why: "The slash in C♯ø7/E names the bass: E. (On beat 1 the basses are resting; the orchestra plays the E.)", note: "Prepared as a chord tone of G minor in bar 44, repeated over the bar line, then down to C♯." },
    T46: { where: "Tenors, bar 46", fmt: "notation with chord symbols", sus: "G", res: "F♯", chord: "D7", opts: ["D", "F♯", "G", "C"], bass: "D", ladder: "DEFG", n: 4, r: 3, fig: "4-3",
      why: "D7 has no slash, so it is in root position: the bass is D.", note: "Prepared as the 7th of A7, repeated over the bar line, then down to F♯." },
    B46: { where: "Basses, bar 46", fmt: "notation with chord symbols", sus: "C", res: "B♮", chord: "G7", opts: ["C", "G", "B", "F"], bass: "G", ladder: "GABC", n: 4, r: 3, fig: "4-3",
      why: "G7 has no slash, so the bass is G: it lies below the singing basses (the orchestra plays it). The suspension is in the bass voice, but it is not the lowest note, so measure from G.", note: "Prepared as the 7th of D7, held into beat 3, then down to B♮." } };
  const MZPCT = ([, x, y]) => `left:${(x / 2256 * 100).toFixed(2)}%;top:${(y / 1232 * 100).toFixed(2)}%`;
  const mozartFind = () => `<div class="mz" role="group" aria-labelledby="mzH">
      <h3 id="mzH">Find the suspensions</h3>
      <p>W. A. Mozart, Requiem, “Domine Jesu,” bars 43–46 (tenors and basses; the orchestra is not shown). Recording: Les Arts Florissants, conducted by William Christie (Erato). Listen, then tap the notes you think are suspensions. There are <b>five</b>, and the basses have three of them. There is also one <b>passing tone</b>: find it too (hint: look for sixteenth notes in the basses).</p>
      ${AUD("mozart-domine", "Mozart, Requiem, Domine Jesu, bars 43 to 46")}
      <div class="mz-score">${IMG("mozart-domine.png", "Mozart, Requiem, Domine Jesu, bars 43 to 46 in G minor, tenors and basses with chord symbols: G minor, A diminished, D7, G minor; then C-sharp half-diminished 7 over E, A7, D7, G7. The notes are buttons.")}
        ${MZ.map((m, i) => `<button class="mz-n" style="${MZPCT(m)}" data-mz="${i}" aria-label="${m[0]}" aria-pressed="false"></button>`).join("")}</div>
      <p class="mz-fb" aria-live="polite">Suspensions found: 0 of 5. Passing tone: not yet.</p>
      <div class="lbtns"><button class="lk" data-mzshow>Show the answers</button></div></div>`;
  const measure = () => `<div class="mm" role="group" aria-labelledby="mmH">
      <h3 id="mmH">Measure from the bass</h3>
      <p>A suspension figure counts the letter names from the <b>bass</b> up to the suspended note, then to its resolution. Here, always measure from the <b>bass note indicated by the chord symbol</b>: the root, or the note after the slash (C♯ø7/E has E in the bass). That note is played by the orchestra, which is not shown, so it is often lower than any singer. Pick a suspension:</p>
      <div class="lbtns" role="group" aria-label="Suspension">${Object.entries(SUSQ).map(([id, s], i) => `<button class="lk" data-mmpick="${id}" aria-pressed="${i === 0}">${s.where}</button>`).join("")}</div>
      <div class="mm-body" aria-live="polite"></div></div>`;
  function wireMozart(root) {
    const box = root.querySelector(".mz"); if (box) { const found = new Set(), fb = box.querySelector(".mz-fb");
      const mark = (i, show) => { const b = box.querySelector(`[data-mz="${i}"]`); b.classList.add("sus"); b.setAttribute("aria-pressed", "true"); b.setAttribute("aria-label", MZ[i][0] + " (suspension)"); };
      let pt = false; const tally = () => ` Suspensions found: ${found.size} of 5. Passing tone: ${pt ? "found" : "not yet"}.${found.size === 5 && pt ? " Now measure the suspensions below." : ""}`;
      box.addEventListener("click", e => {
        const b = e.target.closest("[data-mz]");
        if (b) { const m = MZ[+b.dataset.mz];
          if (SUSQ[m[3]]) { found.add(m[3]); mark(+b.dataset.mz); const s = SUSQ[m[3]];
            fb.innerHTML = `<b>Yes: ${m[0]} is a suspension</b> over ${s.chord}. ${s.note}` + tally(); }
          else if (m[3] === "PT") { pt = true; b.classList.add("pt"); b.setAttribute("aria-pressed", "true"); b.setAttribute("aria-label", m[0] + " (passing tone)");
            fb.innerHTML = `<b>Yes: ${m[0]} is a passing tone.</b> It is not in C♯ø7 (C♯–E–G–B♭), and it fills the step from G up to B♭, moving in one direction. It falls between the beats, so it is unaccented.` + tally(); }
          else { b.classList.add("no"); fb.innerHTML = `<b>${m[0]}:</b> ${m[3]}` + tally(); } }
        if (e.target.closest("[data-mzshow]")) { MZ.forEach((m, i) => { if (SUSQ[m[3]]) { found.add(m[3]); mark(i); } if (m[3] === "PT") { pt = true; const x = box.querySelector(`[data-mz="${i}"]`); x.classList.add("pt"); x.setAttribute("aria-pressed", "true"); } });
          fb.innerHTML = "The five suspensions, all on beat 1 or beat 3: the basses' G in bar 43 and C in bar 44, the tenors' D in bar 45 and G in bar 46, and the basses' C in bar 46. The passing tone is the basses' A, the first sixteenth note in bar 45."; }
      }); }
    const mm = root.querySelector(".mm"); if (!mm) return;
    let id = "B43", stage = 0;
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
      if (b.dataset.mmb) { if (b.dataset.mmb === s.bass) { stage = 1; draw(); } else draw(b.dataset.mmb === s.sus ? `${s.sus} is the suspension itself. Measure from the bass note the chord symbol indicates: the note after a slash, or otherwise the root of ${s.chord}.` : `Not ${b.dataset.mmb}. Use the bass note the chord symbol indicates: the note after a slash, or otherwise the root of ${s.chord}.`); return; }
      if (b.dataset.mmn) { const n = +b.dataset.mmn; if (n === s.n) { stage = 2; draw(); } else draw(s.ninth && n === 2 ? "Close: the letters are a 2nd apart, but the melody is an octave higher than that. What is a 2nd plus an octave?" : `Not ${n}. Count ${s.bass} as 1 and say each letter name up to ${s.sus}.`); return; }
      if (b.dataset.mmr) { const n = +b.dataset.mmr; if (n === s.r) { stage = 3; draw(); } else draw(`Not ${n}. Count ${s.bass} as 1 again, up to ${s.res}${s.ninth ? " (an octave above the bass)" : ""}.`); }
    });
    draw();
  }

  // fetch every score image in the background once the lesson page has loaded, so later steps open instantly
  const PRE = ["atgb-lead.png", "atgb-circled-fm.png", "atgb-circled-all.png", "atgb-keyboard.png", "atgb-pt.png", "atgb-nt.png", "atgb-et-app.png", "atgb-accent.png", "tchaikovsky-pc1.png", "bruckner-kyrie.png", "bruckner-sus-phases.png", "sus-types.png", "bruckner-sus-figures.png", "beatles-money.png", "mozart-domine.png", "brahms-op29.png"];
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
      <p>Now find and measure some suspensions on your own, in Mozart's Requiem. Measure each one from the bass note that the chord symbol indicates.</p>
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
      ["Harmonic anticipation (HA)", "step or leap", "a different note of the next harmony than the one actually used"], ["Pedal tone (PED)", "same note", "same note"]]) + `<p>To practice finding and naming non-chord tones in real music (Mozart, Haydn, Tchaikovsky, “You Are My Sunshine” and “A Whole New World”), open the <a href="non-chord-tones.html"><b>Non-Chord Tones drills</b></a> and choose <b>Real music</b>.</p>` },

  ] };

  return {
    key: "silverapps-nct-v1", lesson, make, reference, widgets,
    modes: [{ id: "name", kicker: "Name it" }, { id: "find", kicker: "Find it" }, { id: "sus", kicker: "Suspension figures" }, { id: "def", kicker: "Definitions" }, { id: "chart", kicker: "The chart" }, { id: "real", kicker: "Real music" }],
    topics: [{ id: "step", name: "Step-based (PT, NT, DN)", group: "t" }, { id: "leap", name: "One leap (APP, ET)", group: "t" }, { id: "held", name: "Held and early (SUS, RET, ANT, HA)", group: "t" }],
  };
})();
