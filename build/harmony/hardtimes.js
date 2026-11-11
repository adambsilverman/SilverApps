// ===== Stephen Foster, "Hard Times Come Again No More" (1854; public domain): melody, lyrics and chords of bars 1–8 as data,
// plus generators that turn the chords into piano accompaniments (notated score specs for the engine's drawScore / scorePlay).
// Shared by the Lead Sheets lesson (leadsheets.js) and the Piano Accompaniment lesson (accomp.js). Time in quarter-note beats; bar 1 starts at 0.
window.HT = (() => {
  const NM = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];
  const name = m => NM[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
  const E4 = 63, F4 = 65, G4 = 67, Ab4 = 68, Bb4 = 70, C5 = 72;
  // melody: [start, length, midi, lyric]
  const MEL = [[-1, .5, E4, "Let"], [-.5, .5, F4, "us"],
    [0, 1, G4, "pause"], [1, .5, G4, "in"], [1.5, .5, F4, "life's"], [2, .5, G4, "plea-"], [2.5, 1, Bb4, "-sures"], [3.5, .5, G4, "and"],
    [4, .5, F4, "count"], [4.5, .5, E4, "its"], [5, .5, E4, "ma-"], [5.5, .5, F4, "-ny"], [6, 1, E4, "tears"], [7, .75, C5, "While"], [7.75, .25, Bb4, "we"],
    [8, 1, Bb4, "all"], [9, .75, G4, "sup"], [9.75, .25, G4, ""], [10, .75, G4, "sor-"], [10.75, .25, E4, "-row"], [11, .75, F4, "with"], [11.75, .25, F4, "the"],
    [12, 2, E4, "poor."], [15, .5, E4, "There's"], [15.5, .5, F4, "a"],
    [16, 1, G4, "song"], [17, .5, G4, "that"], [17.5, .5, F4, "will"], [18, .5, G4, "lin-"], [18.5, 1, Bb4, "-ger"], [19.5, .5, G4, "for-"],
    [20, .5, F4, "-e-"], [20.5, .5, E4, "-ver"], [21, .5, E4, "in"], [21.5, .5, F4, "our"], [22, 1, E4, "ears;"], [23, 1, C5, "Oh!"],
    [24, 1, Bb4, "Hard"], [25, 1, G4, "Times,"], [26, .75, G4, "come"], [26.75, .25, E4, "a-"], [27, .75, F4, "-gain"], [27.75, .25, F4, "no"],
    [28, 2, E4, "more."], [31, .5, G4, "'Tis"], [31.5, .5, Ab4, "the"]];
  const CHORD = { "E♭": { pcs: [3, 7, 10], bass: 3, sp: "E♭–G–B♭" }, "E♭/G": { pcs: [3, 7, 10], bass: 7, sp: "E♭–G–B♭, G in the bass" }, "E♭/B♭": { pcs: [3, 7, 10], bass: 10, sp: "E♭–G–B♭, B♭ in the bass" },
    "A♭": { pcs: [8, 0, 3], bass: 8, sp: "A♭–C–E♭" }, "B♭": { pcs: [10, 2, 5], bass: 10, sp: "B♭–D–F" }, "B♭7": { pcs: [10, 2, 5, 8], bass: 10, sp: "B♭–D–F–A♭" } };
  // chord changes: [start, symbol]
  const CH = [[0, "E♭"], [3, "E♭/G"], [4, "A♭"], [5, "B♭"], [6, "E♭"], [7, "A♭"], [8, "E♭/B♭"], [11, "B♭7"], [12, "E♭"], [14, "A♭"], [15, "E♭"],
    [16, "E♭"], [19, "E♭/G"], [20, "A♭"], [21, "B♭"], [22, "E♭"], [23, "A♭"], [24, "E♭/B♭"], [27, "B♭7"], [28, "E♭"], [30, "B♭7"], [31, "E♭"]];
  const END = 32;
  const segs = (from, to, ch = CH, end = END) => ch.map(([s, sym], i) => ({ s, e: i + 1 < ch.length ? ch[i + 1][0] : end, sym, c: CHORD[sym] })).filter(g => g.s < to && g.e > from).map(g => Object.assign(g, { s: Math.max(g.s, from), e: Math.min(g.e, to) }));
  const chordAt = (b, ch = CH) => { let r = ch[0]; ch.forEach(c => { if (c[0] <= b + 1e-9) r = c; }); return CHORD[r[1]]; };
  const inChord = (c, m) => c.pcs.includes(((m % 12) + 12) % 12);
  // ---------- voicings ----------
  const inRange = (pc, lo, hi) => { const r = []; for (let m = lo; m <= hi; m++) if (((m % 12) + 12) % 12 === pc) r.push(m); return r; };
  const bassOf = (c, lo = 38, hi = 50) => inRange(c.bass, lo, hi)[0];
  // close-position chords (every tone once, within an octave) whose notes all lie in [lo, hi]
  function closeVoicings(c, lo, hi) {
    const out = [];
    for (let b = lo; b <= hi; b++) { const pc = ((b % 12) + 12) % 12; if (!c.pcs.includes(pc)) continue;
      const v = [b]; c.pcs.filter(p => p !== pc).forEach(p => { let m = b + 1; while (((m % 12) + 12) % 12 !== p) m++; v.push(m); });
      v.sort((x, y) => x - y); if (v[v.length - 1] <= hi && v[v.length - 1] - v[0] < 12) out.push(v); }
    return out;
  }
  // smoothest path through the chords: each voicing as close as possible to the one before (stays in one register)
  function smooth(list, lo = 55, hi = 70, start = 62) {
    let prev = null;
    return list.map(c => { const cands = closeVoicings(c, lo, hi); const cost = v => prev ? v.reduce((t, m, i) => t + Math.abs(m - (prev[i] !== undefined ? prev[i] : prev[prev.length - 1])), 0) + (v.length !== prev.length ? 2 : 0) : Math.abs(v[0] + v[v.length - 1] - 2 * start);
      const v = cands.sort((a, b) => cost(a) - cost(b))[0]; prev = v; return v; });
  }
  // root position, always: the "jumping" alternative
  const rootPos = (c, lo = 48) => { const r = inRange(c.pcs[0], lo, lo + 11)[0]; return c.pcs.map(p => { let m = r; while (((m % 12) + 12) % 12 !== p) m++; return m; }).sort((a, b) => a - b); };
  // n chord tones just below a melody note (inside the octave under it), at or above floor
  function under(c, top, n = 2, floor = 55) {
    const r = []; for (let m = top - 1; m > top - 12 && r.length < n; m--) if (m >= floor && inChord(c, m) && (((m - top) % 12) + 12) % 12 !== 0) r.push(m);
    return r.sort((a, b) => a - b);
  }
  const melIn = (s, e, up) => MEL.filter(n => n[0] >= s - 1e-9 && n[0] < e - 1e-9).map(n => n[2] + up);
  const melAt = (b, up) => { let r = null; MEL.forEach(n => { if (n[0] <= b + 1e-9 && n[0] + n[1] > b + 1e-9) r = n[2] + up; }); return r; };
  // ---------- notation: events → bars of notes and rests ----------
  const VAL = [[4, "w"], [3, "hd"], [2, "h"], [1.5, "qd"], [1, "q"], [.75, "8d"], [.5, "8"], [.25, "16"]];
  const ok = (p, pos, rest) => { const f = x => Math.abs(pos / x - Math.round(pos / x)) < 1e-6;
    if (p === 4) return f(4); if (p === 3) return f(1) && pos < 1.01; if (p === 2) return rest ? f(2) : f(1); if (p === 1.5) return rest ? false : f(.5); if (p === 1) return rest ? f(1) : f(.5); if (p === .75) return rest ? false : f(.25); if (p === .5) return f(.5); return f(.25); };
  function pieces(len, pos, rest) { const out = []; let guard = 0;
    while (len > 1e-6 && guard++ < 20) { const v = VAL.find(([p]) => p <= len + 1e-6 && ok(p, pos, rest)) || VAL[VAL.length - 1]; out.push(v); len -= v[0]; pos += v[0]; }
    return out; }
  // ev: { s, d, m: [midi], ly, sym }; bars: [[start, end], ...]; syms: [[time, text]] placed on the first piece starting at or after each time
  function voice(ev, bars, syms = []) {
    const out = bars.map(() => []), sy = syms.map(x => x.slice());
    const put = (bi, n, t) => { const hit = sy.find(x => !x.used && x[0] <= t + 1e-6); if (hit) { n.sym = hit[1]; hit.used = true; } out[bi].push(n); };
    bars.forEach(([b0, b1], bi) => {
      let t = b0;
      const inBar = ev.filter(e => e.s < b1 - 1e-6 && e.s + e.d > b0 + 1e-6).sort((a, b) => a.s - b.s);
      inBar.forEach(e => {
        const s = Math.max(e.s, b0), en = Math.min(e.s + e.d, b1);
        if (s > t + 1e-6) { pieces(s - t, t - b0, true).forEach(([p, d]) => { put(bi, { k: [], d }, t); t += p; }); }
        const ps = pieces(en - s, s - b0, false);
        ps.forEach(([p, d], i) => { const n = { k: e.m.map(name), d }; if (i === 0 && s === e.s && e.ly) n.ly = e.ly; if (i < ps.length - 1 || e.s + e.d > b1 + 1e-6) n.tie = true; put(bi, n, t); t += p; });
      });
      if (b1 > t + 1e-6) pieces(b1 - t, t - b0, true).forEach(([p, d]) => { put(bi, { k: [], d }, t); t += p; });
    });
    return out;
  }
  const barsOf = (from, to) => { const r = []; if (from < 0) r.push([from, 0]); for (let b = Math.max(0, from); b < to; b += 4) r.push([b, Math.min(b + 4, to)]); return r; };
  // ---------- accompaniment patterns: each returns { rh: [events], lh: [events] } for the chords between from and to ----------
  const E = (s, d, m) => ({ s, d, m: [].concat(m) });
  const P = {
    // block chords held for each chord's whole region (lead-sheet comping): one register, smooth voice leading
    block(from, to) { const g = segs(from, to), v = smooth(g.map(x => x.c)); return { rh: g.map((x, i) => E(x.s, x.e - x.s, v[i])), lh: g.map(x => E(x.s, x.e - x.s, bassOf(x.c))) }; },
    // the same chords in root position, every one: the hand jumps
    jumpy(from, to) { const g = segs(from, to); return { rh: g.map(x => E(x.s, x.e - x.s, rootPos(x.c, 60))), lh: g.map(x => E(x.s, x.e - x.s, bassOf(x.c))) }; },
    // chords repeated on every beat, bass on every beat (heavy)
    pound(from, to) { const rh = [], lh = [], g = segs(from, to), v = smooth(g.map(x => x.c));
      g.forEach((x, i) => { for (let b = x.s; b < x.e - 1e-6; b++) { rh.push(E(b, 1, v[i])); lh.push(E(b, 1, bassOf(x.c))); } }); return { rh, lh }; },
    // melody on top of the right hand, two chord tones under it held through each region; bass held in the left hand
    melBlock(from, to) { const up = 12, rh = [], lh = [];
      segs(from, to).forEach(x => { const lowM = Math.min(...melIn(x.s, x.e, up).concat([melAt(x.s, up) || 99])); if (lowM < 99) { const u = under(x.c, lowM, 2, 58); if (u.length) rh.push(E(x.s, x.e - x.s, u)); } lh.push(E(x.s, x.e - x.s, bassOf(x.c))); });
      return { rh, lh }; },
    // boom-chuck (4/4): bass on beats 1 and 3 (root, then the 5th if the chord hasn't changed), chords on 2 and 4; a change on 2 or 4 gets its bass too
    boom(from, to, o = {}) { const rh = [], lh = [], g = segs(from, to), v = o.under ? null : smooth(g.map(x => x.c), 55, 70);
      for (let b = Math.ceil(from); b < to - 1e-6; b++) { const i = g.findIndex(x => x.s <= b + 1e-6 && x.e > b + 1e-6); if (i < 0) continue; const x = g[i], pos = ((b % 4) + 4) % 4, change = Math.abs(x.s - b) < 1e-6;
        const chord = o.under ? under(x.c, melAt(b, 12) || 82, 2, 58) : v[i];
        if (pos % 2 === 0 || (change && !o.strict)) { const root = bassOf(x.c), fifth = inRange((x.c.bass + 7) % 12, 36, 50).filter(m => Math.abs(m - root) <= 7)[0];
          lh.push(E(b, 1, pos === 2 && !change && fifth ? fifth : root)); if (change && pos % 2) rh.push(E(b, 1, chord)); }
        else rh.push(E(b, 1, chord)); }
      return { rh, lh }; },
    // stride: the left hand leaps between a low bass (1 and 3) and a chord in the middle (2 and 4); the right hand plays the melody
    stride(from, to) { const lh = [], g = segs(from, to), v = smooth(g.map(x => x.c), 52, 64, 57);
      for (let b = Math.ceil(from); b < to - 1e-6; b++) { const i = g.findIndex(x => x.s <= b + 1e-6 && x.e > b + 1e-6); if (i < 0) continue; const x = g[i], pos = ((b % 4) + 4) % 4;
        if (pos % 2 === 0) { const r = inRange(x.c.bass, 31, 43)[0]; lh.push(E(b, 1, [r, r + 12])); } else lh.push(E(b, 1, v[i])); }
      return { rh: [], lh }; },
    // Alberti bass: low–high–middle–high in eighths, close position just above the bass
    alberti(from, to) { const lh = [];
      for (let t = Math.ceil(from); t < to - 1e-6; t += .5) { const c = chordAt(t), b = inRange(c.bass, 48, 59)[0], up = c.pcs.filter(p => p !== c.bass).map(p => { let m = b + 1; while (((m % 12) + 12) % 12 !== p) m++; return m; }).sort((x, y) => x - y);
        const k = Math.round(((t % 2) + 2) % 2 * 2); lh.push(E(t, .5, [b, up[up.length - 1], up[0], up[up.length - 1]][k])); }
      return { rh: [], lh }; },
    // broken chords (ballad): the left hand rolls up from the bass in eighths (bass, 5th, octave, 3rd above); two chord tones under the melody on beats 1 and 3
    broken(from, to) { const rh = [], lh = [];
      for (let t = Math.ceil(from); t < to - 1e-6; t += .5) { const c = chordAt(t), b = bassOf(c, 36, 47), k = Math.round(((t % 2) + 2) % 2 * 2);
        const up = []; for (let m = b + 3; m <= b + 20; m++) if (inChord(c, m)) up.push(m);
        const fifth = up.find(m => m - b >= 6 && m - b <= 8) || up[1], oct = up.find(m => m - b === 12) || up[2], tenth = up.find(m => m - b >= 15) || up[up.length - 1];
        lh.push(E(t, .5, [b, fifth, oct, tenth][k])); }
      segs(from, to).forEach(x => { for (let b = x.s; b < x.e - 1e-6; b++) { if (((b % 2) + 2) % 2 === 0 || Math.abs(b - x.s) < 1e-6) { const top = melAt(b, 12); if (top) { const u = under(x.c, top, 2, 60); if (u.length) rh.push(E(b, 1, u)); } } } });
      return { rh, lh }; },
    // an active bass line: chord tones on the changes, connected by steps and chord tones; block chords above in the right hand
    walk(from, to, o = {}) { const lh = [], g = segs(from, to), v = smooth(g.map(x => x.c), 55, 70); const SC = [3, 5, 7, 8, 10, 0, 2];   // E♭ major
      const near = (pc, prev) => { const c = inRange(pc, 36, 55); return prev ? c.sort((a, b) => Math.abs(a - prev) - Math.abs(b - prev))[0] : c.find(m => m >= 39); };
      const step = (m, dir) => { let x = m + dir; while (!SC.includes(((x % 12) + 12) % 12)) x += dir; return x; };
      let prev = null;
      g.forEach((x, i) => { const L = Math.round(x.e - x.s), root = near(x.c.bass, prev), nxt = g[i + 1] ? near(g[i + 1].c.bass, root) : null;
        const line = [root];
        for (let j = 1; j < L; j++) { if (j === L - 1 && nxt != null) line.push(step(nxt, nxt > line[j - 1] ? -1 : 1)); else { const ct = []; for (let m = line[j - 1] + 1; m <= line[j - 1] + 9; m++) if (inChord(x.c, m)) ct.push(m); line.push(ct[0] || step(line[j - 1], 1)); } }
        line.forEach((m, j) => lh.push(E(x.s + j, 1, m))); prev = line[line.length - 1]; });
      const rh = o.melody ? segs(from, to).map(x => { const lowM = Math.min(...melIn(x.s, x.e, 12).concat([melAt(x.s, 12) || 99])); const u = under(x.c, lowM, 2, 60); return u.length ? E(x.s, x.e - x.s, u) : null; }).filter(Boolean) : g.map((x, i) => E(x.s, x.e - x.s, v[i]));
      return { rh, lh }; },
  };
  // ---------- whole score specs ----------
  // o: { from, to, pattern, melody: "rh" (melody on top of the right hand, an octave up) | "staff" (a separate voice staff, as written) | null, bpm, label }
  function spec(o) {
    const from = o.from == null ? -1 : o.from, to = o.to || 16, bars = barsOf(from, to), pat = P[o.pattern](Math.max(0, from), to, o.opts || {});
    const syms = segs(Math.max(0, from), to).map(x => [x.s, x.sym]);
    const mel = MEL.filter(n => n[0] >= from - 1e-6 && n[0] < to - 1e-6).map(n => ({ s: n[0], d: n[1], m: [n[2] + (o.melody === "rh" ? 12 : 0)], ly: n[3] }));
    const mv = o.melody ? voice(mel, bars, syms) : null, rv = pat.rh.length ? voice(pat.rh, bars, o.melody ? [] : syms) : null, lv = voice(pat.lh, bars, (o.melody || pat.rh.length) ? [] : syms);
    const three = o.melody === "staff";
    const B = bars.map((_, i) => {
      const b = {};
      if (three) { b.m = [mv[i]]; b.t = [rv ? rv[i] : voice([], bars)[i]]; b.b = [lv[i]]; }
      else { b.t = mv && rv ? [mv[i], rv[i]] : [mv ? mv[i] : rv ? rv[i] : voice([], bars)[i]]; b.b = [lv[i]]; }
      return b; });
    return { type: "score", clefs: three ? ["treble", "treble", "bass"] : ["treble", "bass"], ids: three ? ["m", "t", "b"] : ["t", "b"], time: o.time || "4/4", vf: "Eb", sig: { 2: -1, 5: -1, 6: -1 }, bpm: o.bpm || 76, final: false, rowW: o.rowW || (o.melody ? 1080 : 760), bars: B };
  }
  // a short chord progression in 3/4 for boom-chuck-chuck (no melody)
  function waltz() {
    const ch = [[0, "E♭"], [3, "A♭"], [6, "B♭7"], [9, "E♭"]], bars = [[0, 3], [3, 6], [6, 9], [9, 12]], rh = [], lh = [], g = segs(0, 12, ch, 12), v = smooth(g.map(x => x.c));
    g.forEach((x, i) => { lh.push(E(x.s, 1, bassOf(x.c))); rh.push(E(x.s + 1, 1, v[i]), E(x.s + 2, 1, v[i])); });
    const syms = ch.map(c => [c[0], c[1]]), rv = voice(rh, bars, syms), lv = voice(lh, bars);
    return { type: "score", clefs: ["treble", "bass"], time: "3/4", vf: "Eb", sig: { 2: -1, 5: -1, 6: -1 }, bpm: 132, final: true, rowW: 1000, bars: bars.map((_, i) => ({ t: [rv[i]], b: [lv[i]] })) };
  }
  // play a span of the song: melody + block chords (for the lead-sheet regions)
  function regionPlay(s, e, sym) { const c = CHORD[sym], spb = 60 / 76, ev = [];
    const v = closeVoicings(c, 55, 67)[0] || rootPos(c); v.forEach(m => ev.push([m, 0, (e - s) * spb, .45])); ev.push([bassOf(c), 0, (e - s) * spb, .55]);
    MEL.filter(n => n[0] >= s - 1e-6 && n[0] < e - 1e-6).forEach(n => ev.push([n[2] + 12, (n[0] - s) * spb, n[1] * spb * .95, .9]));
    return { ev }; }
  return { MEL, CH, CHORD, END, segs, chordAt, inChord, name, spec, waltz, regionPlay, smooth, rootPos, bassOf };
})();
