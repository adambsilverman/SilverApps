
window.FAM = (() => {
  // ===== Texture: monophony, heterophony, homophony, polyphony and more. Engine: build/harmony/engine.js =====
  const tbl = (cap, head, rows) => `<div class="ltable-wrap" tabindex="0" role="region" aria-label="${cap}"><table class="ltable"><caption>${cap}</caption><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  // ---------- audio kit ----------
  let AC = null, bus = null;
  function ac() { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; if (!AC) AC = new C(); if (AC.state === "suspended") AC.resume(); return AC; }
  function fresh() { if (bus) { const o = bus; o.gain.setTargetAtTime(0, AC.currentTime, .03); setTimeout(() => o.disconnect(), 400); } bus = AC.createGain(); bus.gain.value = .9; bus.connect(AC.destination); return bus; }
  const mf = m => 440 * Math.pow(2, (m - 69) / 12);
  const PW = {};
  const pw = (k, amps) => { if (!PW[k] || PW[k].ctx !== AC) { const re = new Float32Array(amps.length + 1), im = new Float32Array(amps.length + 1); amps.forEach((a, i) => im[i + 1] = a); PW[k] = { w: AC.createPeriodicWave(re, im), ctx: AC }; } return PW[k].w; };
  const TIMB = { flute: [[1, .25, .08, .03], [.06, .9, .1], 8], clar: [[1, .02, .7, .02, .45, .02, .3, .01, .18], [.04, .9, .08], 0], oboe: [[.45, .85, 1, .8, .55, .4, .3, .2], [.03, .85, .08], 5], str: [[1, .5, .33, .25, .2, .16, .14, .12, .1, .09], [.08, .9, .12], 10], horn: [[1, .7, .45, .3, .18, .1, .06], [.05, .9, .1], 0], piano: [[1, .5, .3, .2, .12, .08, .05], [.005, 0, .25], 0], bass: [[1, .6, .3, .15, .08], [.01, .6, .08], 0], voice: [[1, .7, .5, .45, .3, .15, .1, .06], [.07, .9, .12], 9] };
  function note(tim, m, t, d, v = 1) {
    const [amps, [A, Sus, R], vib] = TIMB[tim], o = AC.createOscillator(), g = AC.createGain(); o.setPeriodicWave(pw(tim, amps)); o.frequency.value = mf(m); o.connect(g); g.connect(bus);
    if (vib) { const l = AC.createOscillator(), lg = AC.createGain(); l.frequency.value = 5.3; lg.gain.value = vib; l.connect(lg); lg.connect(o.detune); l.start(t + .15); l.stop(t + d + .6); }
    const pk = .16 * v; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(pk, t + A);
    if (tim === "piano") g.gain.setTargetAtTime(0, t + A, .5); else { g.gain.setTargetAtTime(pk * Sus, t + A, .1); g.gain.setValueAtTime(pk * Sus, t + Math.max(A, d - .02)); }
    g.gain.setTargetAtTime(0, t + Math.max(A, d), R / 3); o.start(t); o.stop(t + d + R * 3 + (tim === "piano" ? 2 : .1));
  }
  // ---------- generating short examples (4 bars of 4/4 in a major key) ----------
  const SC = [0, 2, 4, 5, 7, 9, 11];
  const dm = (tonic, d) => tonic + 12 * Math.floor(d / 7) + SC[((d % 7) + 7) % 7];   // scale degree (0-based, any octave) → MIDI
  const PROGS = [[0, 3, 4, 0], [0, 5, 4, 0], [0, 1, 4, 0], [0, 5, 3, 0]];   // every tune ends on the tonic chord
  const RHY = [[1, 1, 1, 1], [1, .5, .5, 1, 1], [2, 1, 1], [1.5, .5, 1, 1], [1, 1, 2], [.5, .5, 1, 1, 1]];
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  function gen0(tonic) {
    const prog = rnd(PROGS); let d = rnd([2, 4, 7]); const mel = [];
    prog.forEach((ch, bar) => {
      const r = bar === 3 ? [2, 2] : rnd(RHY); let t = bar * 4;
      r.forEach((len, i) => { const strong = t % 1 === 0 && (t % 2 === 0 || len >= 1); const tones = [ch, ch + 2, ch + 4].map(x => ((x % 7) + 7) % 7);
        if (bar === 3 && i === r.length - 1) d = Math.abs(d - 7) < Math.abs(d) ? 7 : 0;
        else if (strong || bar === 3) { let best = d, bd = 99; for (let c = -3; c <= 10; c++) if (tones.includes(((c % 7) + 7) % 7) && Math.abs(c - d) < bd && Math.abs(c - d) > 0) { best = c; bd = Math.abs(c - d); } d = Math.random() < .3 ? best + (Math.random() < .5 ? 2 : -2) : best; if (!tones.includes(((d % 7) + 7) % 7)) d = best; }
        else d += Math.random() < .5 ? 1 : -1;
        d = Math.max(-1, Math.min(9, d)); mel.push({ t, d: len, deg: d, ch }); t += len; });
    });
    return { tonic, prog, mel };
  }
  // ---------- counterpoint checks: generate many candidates and keep the one that breaks the fewest rules ----------
  const PERF = i => i === 0 || i === 7;
  const sounding = (v, t) => v.find(n => n.t <= t && t < n.t + n.d);
  // two voices (arrays of {t, d, m}, v1 above v2): strong-beat dissonance, parallel 5ths/8ves, crossing, big leaps
  function cpCost(v1, v2, o = {}) {
    const ts = [...new Set([...v1, ...v2].map(n => n.t))].sort((a, b) => a - b); let c = 0, prev = null;
    ts.forEach(t => { const a = sounding(v1, t), b = sounding(v2, t); if (!a || !b) { prev = null; return; }
      const iv = a.m - b.m, pc = ((iv % 12) + 12) % 12, strong = t % 1 === 0;
      if (iv < 0) c += 12;
      const dis = [1, 2, 6, 10, 11].includes(pc) || (pc === 5 && !o.fourthOK);
      if (dis) c += t % 2 === 0 ? 10 : strong ? 3 : 1;   // downbeats and beat 3 must be consonant; beats 2 and 4 may carry passing dissonance
      if (strong && iv === 0) c += 3;
      if (prev && PERF(pc) && prev.pc === pc && a.m !== prev.a && b.m !== prev.b) c += 20;   // parallel (or consecutive) 5ths / octaves
      if (prev && PERF(pc) && !PERF(prev.pc) && Math.sign(a.m - prev.a) === Math.sign(b.m - prev.b) && a.m !== prev.a && Math.abs(a.m - prev.a) > 2) c += 4;   // hidden 5th/8ve with a leap on top
      prev = { pc, a: a.m, b: b.m }; });
    return c;
  }
  const leaps = v => v.slice(1).reduce((c, n, i) => { const L = Math.abs(n.m - v[i].m); return c + (L > 7 ? 6 : L > 5 ? 1 : 0) + (L === 6 ? 5 : 0); }, 0);
  const melV = g => g.mel.map(n => ({ t: n.t, d: n.d, m: dm(g.tonic, n.deg) }));
  const bassV = g => g.prog.map((ch, bar) => ({ t: bar * 4, d: 4, m: dm(g.tonic, ch) - 24 }));
  const comesV = g => melV(g).filter(n => n.t < 12).map(n => ({ t: n.t + 4, d: n.d, m: n.m - 12 }));
  // a countermelody below the tune: long notes where the tune is busy, motion where it rests; stepwise, consonant, contrary where it can be
  function counterOf(g) {
    const mv = melV(g), bv = bassV(g); let best = null;
    for (let tr = 0; tr < 120; tr++) {
      const v = []; let prevD = null;
      g.prog.forEach((ch, bar) => {
        const fast = g.mel.filter(n => n.t >= bar * 4 && n.t < bar * 4 + 4).length >= 4, pts = bar === 3 ? [0] : fast ? [0, 2] : rnd([[0, 1, 1.5, 2, 3], [0, 1, 2, 3], [0, 2, 3]]);
        pts.forEach((p, i) => { const t = bar * 4 + p, d = (pts[i + 1] ?? 4) - p, top = sounding(mv, t), tones = [ch, ch + 2, ch + 4];
          const cands = []; for (let x = -9; x <= 4; x++) { const m = dm(g.tonic, x), ct = tones.some(y => ((y - x) % 7 + 7) % 7 === 0);
            if (top && m >= top.m - 2) continue; let c = (ct ? 0 : t % 1 === 0 ? 8 : 1) + Math.random() * 1.5;
            if (prevD != null) { const L = Math.abs(x - prevD); c += L === 0 ? 2 : L === 1 ? 0 : L === 2 ? .5 : L <= 4 ? 2 : 9; }
            if (top) { const pc = ((top.m - m) % 12 + 12) % 12; if ([3, 4, 8, 9].includes(pc)) c -= 1.5; }
            if (bar === 3) c += ct && x % 7 === 0 ? 0 : 6;
            cands.push({ x, m, c }); }
          const pick = cands.sort((a, b) => a.c - b.c)[0]; prevD = pick.x; v.push({ t, d, m: pick.m }); });
      });
      const cost = cpCost(mv, v) + cpCost(v, bv, { fourthOK: true }) * .5 + leaps(v);
      if (!best || cost < best.cost) best = { v, cost };
    }
    return best.v;
  }
  // chordal homophony: four voices, a chord on every melody note, smooth inner voices, complete triads, no parallel 5ths or octaves
  function chordalOf(g) {
    const CHS = [0, 3, 4, 5, 1], pcOf = m => ((m - g.tonic) % 12 + 12) % 12;
    const cands = g.mel.map((n, ni) => {   // every acceptable voicing for this melody note, with its own cost
      const S = dm(g.tonic, n.deg), last = ni === g.mel.length - 1, list = [];
      CHS.forEach(ch => { const pcs = [ch, ch + 2, ch + 4].map(x => ((x % 7) + 7) % 7); if (!pcs.includes(((n.deg % 7) + 7) % 7) || (last && ch !== 0)) return;
        const chC = ch === n.ch ? 0 : ch === 0 || ch === 3 || ch === 4 ? 4 : 7, pm = pcs.map(x => SC[x]);
        const inR = (lo, hi) => { const r = []; for (let m = lo; m <= hi; m++) if (pm.includes(pcOf(m))) r.push(m); return r; };
        inR(g.tonic - 22, g.tonic - 8).forEach(B => { const inv = pcOf(B) === pm[0] ? 0 : pcOf(B) === pm[1] && !last ? 3 : 99; if (inv > 50) return;
          inR(Math.max(B + 3, g.tonic - 17), S - 3).forEach(T => inR(Math.max(T + 1, g.tonic - 10), S - 1).forEach(A => {
            if (S - A > 12 || A - T > 12) return; const V = [S, A, T, B];
            let c = chC + inv + (new Set(V.map(pcOf)).size < 3 ? 25 : 0);
            if (V.filter(m => pcOf(m) === pm[1]).length > 1) c += 6; if (V.filter(m => pcOf(m) === 11).length > 1) c += 40;
            list.push({ V, c }); })); }); });
      return list.length ? list : [{ V: [S, ...chordTones(g.tonic, n.ch, -1).slice(0, 2), dm(g.tonic, n.ch) - 24], c: 50 }];
    });
    const trans = (P, V) => { let c = Math.abs(V[1] - P[1]) + Math.abs(V[2] - P[2]) + Math.abs(V[3] - P[3]) * .3;
      for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) { const p1 = ((P[i] - P[j]) % 12 + 12) % 12, p2 = ((V[i] - V[j]) % 12 + 12) % 12; if (PERF(p2) && p1 === p2 && V[i] !== P[i] && V[j] !== P[j]) c += 200; }
      return c; };
    // best path through the voicings (dynamic programming), so a cadence can be prepared a chord ahead
    let row = cands[0].map(x => ({ c: x.c, back: -1 })); const backs = [row];
    for (let i = 1; i < cands.length; i++) { row = cands[i].map(x => { let best = null; cands[i - 1].forEach((p, j) => { const c = backs[i - 1][j].c + trans(p.V, x.V); if (!best || c < best.c) best = { c, back: j }; }); return { c: best.c + x.c, back: best.back }; }); backs.push(row); }
    let j = row.reduce((bi, r, i) => r.c < row[bi].c ? i : bi, 0); const out = [];
    for (let i = cands.length - 1; i >= 0; i--) { out.unshift({ t: g.mel[i].t, d: g.mel[i].d, V: cands[i][j].V }); j = backs[i][j].back; }
    return out;
  }
  // the tune itself: also check its outer voices against the bass, and (for a canon) against itself a bar later
  function gen(tonic = 60 + rnd([0, 2, -3, 5, -5]), canon) {
    let best = null;
    for (let tr = 0; tr < (canon ? 2000 : 60); tr++) { const g = gen0(tonic), mv = melV(g);
      let c = cpCost(mv, bassV(g), { fourthOK: true }) * .5 + leaps(mv);
      if (canon) c += cpCost(mv, comesV(g)) * 2;
      if (!best || c < best.c) best = { g, c }; if (c === 0) break; }
    return best.g;
  }
  const chordTones = (tonic, ch, oct) => [ch, ch + 2, ch + 4].map(x => dm(tonic, x) + 12 * oct);
  // schedule one texture; returns its length in seconds
  function render(kind, g, t0, bpm = 92) {
    const b = 60 / bpm, T = x => t0 + x * b, M = n => dm(g.tonic, n.deg);
    const melT = kind === "hetero" ? "voice" : kind === "chordal" ? "voice" : "flute";
    if (kind !== "chordal") g.mel.forEach(n => note(melT, M(n), T(n.t), n.d * b * .95));
    if (kind === "hetero") g.mel.forEach((n, i) => {   // a second performer: same tune, ornamented, slightly late
      const m = M(n) - 12 + 12, lag = .03 + Math.random() * .03, nx = g.mel[i + 1];
      if (n.d >= 1 && nx) { note("oboe", m, T(n.t) + lag, n.d * b * .45, .8); const step = nx.deg > n.deg ? -1 : 1; note("oboe", dm(g.tonic, n.deg + step), T(n.t + n.d / 2) + lag, n.d * b * .2, .7); note("oboe", m, T(n.t + n.d * .75) + lag, n.d * b * .23, .7); }
      else note("oboe", m, T(n.t) + lag, n.d * b * .95, .8); });
    if (kind === "chordal") (g.chordal || (g.chordal = chordalOf(g))).forEach(c => c.V.forEach((m, i) => note("voice", m, T(c.t), c.d * b * .95, [1.1, .7, .7, .9][i])));
    if (kind === "melacc") g.prog.forEach((ch, bar) => { const c = chordTones(g.tonic, ch, -1); note("bass", dm(g.tonic, ch) - 24, T(bar * 4), 4 * b * .9, 1.1); [0, 2, 1, 2, 0, 2, 1, 2].forEach((k, i) => note("piano", c[k], T(bar * 4 + i * .5), b * .5, .6)); });
    if (kind === "canon") g.mel.forEach(n => { if (n.t < 12) note("clar", M(n) - 12, T(n.t + 4), n.d * b * .95, .9); });
    if (kind === "free") { (g.counter || (g.counter = counterOf(g))).forEach(n => note("clar", n.m, T(n.t), n.d * b * .95, .85)); bassV(g).forEach(n => note("bass", n.m, T(n.t), n.d * b * .9, .5)); }
    return 16 * b + (kind === "canon" ? 4 * b : 0);
  }
  const KIND = { mono: "Monophony", hetero: "Heterophony", chordal: "Homophony: chordal (homorhythmic)", melacc: "Homophony: melody and accompaniment", canon: "Polyphony: imitative", free: "Polyphony: free (non-imitative)" };
  const WHY = { mono: "one unaccompanied melody", hetero: "two performers play the same tune at once, one with ornaments and slightly different timing", chordal: "all voices move together in the same rhythm, in block chords", melacc: "a clear melody over a supporting accompaniment (broken chords and bass)", canon: "a second voice enters later with the same melody", free: "two independent melodies with different rhythms and contours" };
  let SEED = {};
  function playKind(kind, key) { if (!ac()) return; fresh(); if (!SEED[key]) SEED[key] = gen(undefined, kind === "canon"); render(kind, SEED[key], AC.currentTime + .1); }
  // texture builder: layers over one tune
  const LAY = { melody: "Melody (flute)", double: "Melody doubled an octave lower (clarinet)", counter: "Countermelody (clarinet)", canon: "Canon: the melody a bar later", block: "Block chords (strings)", broken: "Broken chords (piano)", bass: "Bass line", drone: "Drone on the tonic" };
  const LS = { on: { melody: true }, g: null };
  function builderName() {
    const o = LS.on, poly = o.counter || o.canon, acc = o.block || o.broken || o.bass || o.drone;
    if (!o.melody && !Object.values(o).some(Boolean)) return "Silence";
    if (!o.melody) return "Accompaniment only (no melody)";
    if (poly) return o.canon && !o.counter ? "Polyphony (imitative)" + (acc ? " with accompaniment" : "") : "Polyphony" + (acc ? " with accompaniment" : "");
    if (acc) return o.drone && !o.block && !o.broken && !o.bass ? "Melody over a drone (often grouped with homophony)" : "Homophony (melody and accompaniment)";
    return o.double ? "Monophony (doubled in octaves: still one line)" : "Monophony";
  }
  function playBuilder() {
    if (!ac()) return; fresh(); if (!LS.g) LS.g = gen(undefined, true); const g = LS.g, b = 60 / 92, t0 = AC.currentTime + .1, T = x => t0 + x * b, o = LS.on;
    if (o.melody) g.mel.forEach(n => note("flute", dm(g.tonic, n.deg), T(n.t), n.d * b * .95));
    if (o.double) g.mel.forEach(n => note("clar", dm(g.tonic, n.deg) - 12, T(n.t), n.d * b * .95, .8));
    if (o.canon) g.mel.forEach(n => { if (n.t < 12) note("horn", dm(g.tonic, n.deg) - 12, T(n.t + 4), n.d * b * .95, .8); });
    g.prog.forEach((ch, bar) => { const c = chordTones(g.tonic, ch, -1);
      if (o.block) c.forEach(m => note("str", m, T(bar * 4), 4 * b * .95, .5));
      if (o.broken) [0, 1, 2, 1, 0, 1, 2, 1].forEach((k, i) => note("piano", c[k] + (k === 0 ? 0 : 0), T(bar * 4 + i * .5), b * .5, .55));
      if (o.bass) [0, 2].forEach(bt => note("bass", dm(g.tonic, ch) - 24 + (bt === 2 && bar % 2 ? 7 - 12 : 0), T(bar * 4 + bt), 2 * b * .9, 1));
    });
    if (o.drone) { note("str", g.tonic - 24, T(0), 16 * b, .8); note("str", g.tonic - 17, T(0), 16 * b, .6); }
    if (o.counter) (g.counter || (g.counter = counterOf(g))).forEach(n => note("clar", n.m, T(n.t), n.d * b * .95, .8));
  }
  if (!window.__txWired) { window.__txWired = true;
    document.addEventListener("click", e => {
      const b = e.target.closest("[data-tx]"); if (!b) return; const k = b.dataset.tx;
      if (k === "kind") playKind(b.dataset.k, b.dataset.s || b.dataset.k);
      if (k === "new") { SEED = {}; LS.g = null; }
      if (k === "build") playBuilder();
      if (k === "stop") { if (ac()) fresh(); }
    });
    document.addEventListener("change", e => { const c = e.target.closest("[data-lay]"); if (!c) return; LS.on[c.dataset.lay] = c.checked; const o = document.getElementById("txName"); if (o) o.textContent = builderName(); });
  }
  const btn = (label, attrs) => `<button class="play" ${Object.entries(attrs).map(([k, v]) => `data-${k}="${v}"`).join(" ")}><span aria-hidden="true">▶ </span>${label}</button>`;
  const row = (...b) => `<div class="lbtns">${b.join("")}</div>`;
  const stop = `<button class="play" data-tx="stop"><span aria-hidden="true">■ </span>Stop</button>`;
  const newTune = `<button class="play" data-tx="new">New tune</button>`;
  const builder = () => `<div class="toy"><fieldset class="txlay"><legend>Layers</legend>${Object.entries(LAY).map(([k, l]) => `<label><input type="checkbox" data-lay="${k}" ${LS.on[k] ? "checked" : ""}> ${l}</label>`).join("")}</fieldset>
    <p class="lnote">Texture: <b id="txName" aria-live="polite">${builderName()}</b></p>${row(btn("Play", { tx: "build" }), stop, newTune)}</div>`;

  const FACTS = [
    ["Musical texture describes…", "how the layers of sound combine: how many, and how they relate", ["how loud the music is", "the tone color of one instrument", "the speed of the beat"], "Texture is often compared to the weave of a fabric."],
    ["Monophony is…", "a single melodic line with no accompaniment", ["two melodies at once", "a melody with chords", "music without melody"], "Plainchant, a solo unaccompanied song, or a group singing in unison."],
    ["A choir singing one melody in octaves (men and women) is…", "still monophony", ["polyphony", "homophony", "heterophony"], "Octave doubling doesn't create a new line."],
    ["Heterophony is…", "simultaneous variations of the same melody", ["a melody with chordal accompaniment", "two different melodies", "a drone with melody"], "Found in many traditions, from Middle Eastern ensembles and Javanese gamelan to folk fiddling with a singer."],
    ["Homophony is…", "one main melody supported by accompaniment, or voices moving together in chords", ["two equally important melodies", "a single unaccompanied line", "the same melody in canon"], "Chordal (homorhythmic) homophony and melody-and-accompaniment are its two main types."],
    ["A hymn sung in four parts with all voices in the same rhythm is…", "chordal homophony (homorhythm)", ["imitative polyphony", "monophony", "heterophony"], "Block chords moving together."],
    ["Polyphony is…", "two or more independent melodic lines at once", ["one melody with chords", "one melody in octaves", "silence between phrases"], "Also called counterpoint."],
    ["A round or a canon is an example of…", "imitative polyphony", ["monophony", "chordal homophony", "heterophony"], "Each voice enters with the same melody at a delay."],
    ["An Alberti bass (low–high–middle–high broken chords) is typical of…", "melody-and-accompaniment homophony", ["monophony", "imitative polyphony", "heterophony"], "It's a classic Classical-era keyboard accompaniment."],
    ["A fugue is built mainly on…", "imitative polyphony", ["chordal homophony", "monophony", "heterophony"], "A subject enters in each voice in turn."],
    ["Describing texture as 'thin' or 'thick' refers to…", "how many layers or notes sound at once (density)", ["the tempo", "the key", "the dynamics only"], "A solo flute is thin; full orchestra with doublings is thick."],
    ["A sustained or repeated note under changing harmony or melody is…", "a drone or pedal point", ["an ostinato", "a canon", "a cadence"], "Drones are central to many traditions, such as bagpipe music and Indian classical music."],
    ["Micropolyphony, associated with György Ligeti, is…", "many dense lines blurring into a shimmering mass", ["one melody played very quietly", "a fast monophonic line", "two-part counterpoint"], "Individual lines are hard to hear; the overall texture is what you perceive."],
    ["In a typical pop arrangement, adding layers through a verse and chorus and stripping them out for a breakdown changes the…", "texture and density", ["key", "meter", "tempo"], "Builds and drops are texture changes."],
  ];
  function make(mode, H) {
    if (mode === "listen") {
      const kind = H.rnd(Object.keys(KIND)), s = "q" + Math.random().toString(36).slice(2, 8);
      return H.mc("Listen. Which texture is this?", KIND[kind], Object.values(KIND), `It's ${KIND[kind].toLowerCase()}: ${WHY[kind]}.`, { kicker: "Listen: texture", fig: row(btn("Play", { tx: "kind", k: kind, s }), stop) });
    }
    if (mode === "describe" || mode === "concepts") {
      if (Math.random() < .45) { const [q, a, w, y] = H.rnd(FACTS); return H.mc(q, a, w, y, { kicker: "Describe and define" }); }
      const D = [["A single voice sings an unaccompanied chant.", "Monophony"], ["A singer and a fiddler perform the same tune together, each decorating it differently.", "Heterophony"], ["A four-part choir sings a hymn, all voices in the same rhythm.", "Homophony"], ["A singer is accompanied by strummed guitar chords.", "Homophony"], ["Three voices sing a round, each entering a few beats after the last.", "Polyphony"], ["A violin and a cello play two different, equally important melodies at once.", "Polyphony"], ["An orchestra plays one melody in unison and octaves, with nothing else.", "Monophony"], ["A pianist plays a tune in the right hand over Alberti-bass broken chords.", "Homophony"], ["The subject of a fugue enters in one voice, then another, while the first continues.", "Polyphony"], ["Two flutes play the same melody at the same time, one adding trills and runs.", "Heterophony"]];
      const [q, a] = H.rnd(D); return H.mc(`${q} Which texture is this?`, a, ["Monophony", "Heterophony", "Homophony", "Polyphony"], { Monophony: "One line, even if doubled in unison or octaves.", Heterophony: "Simultaneous variants of one melody.", Homophony: "One main melody with accompaniment, or block chords moving together.", Polyphony: "Independent lines: imitative (rounds, canons, fugues) or free." }[a], { kicker: "Describe and define" });
    }
  }
  function reference() {
    return tbl("The four basic textures", ["Texture", "What you hear", "Examples"], [["Monophony", "one line (even in unison or octaves)", "chant, solo song, unison singing"], ["Heterophony", "variants of one melody at once", "folk ensembles, gamelan, Middle Eastern ensembles"], ["Homophony", "melody + accompaniment, or block chords", "hymns, songs with guitar or piano"], ["Polyphony", "independent lines", "rounds, canons, fugues, Renaissance motets"]]);
  }
  const ex = (k, label) => row(btn(label || "Play an example", { tx: "kind", k }), stop, newTune);
  // real-music examples (from Adam's course pages): YouTube embeds, hosted excerpts, score images
  const YT = (id, title, start) => `<div class="lvideo"><iframe src="https://www.youtube-nocookie.com/embed/${id}${start ? `?start=${start}` : ""}" title="${title} (YouTube)" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`;
  const AUD = f => `<audio controls preload="none" src="assets/audio/texture/${f}.mp3" style="width:100%;margin-top:8px"></audio>`;
  const IMG = (f, alt) => `<img src="assets/img/texture/${f}" alt="${alt}" loading="lazy" style="width:100%;height:auto;background:#fff;border-radius:8px">`;
  const EXF = (cap, ...parts) => `<figure class="lfig txex">${parts.join("")}<figcaption>${cap}${/<audio\b/.test(parts.join("")) ? `<p class="note lcite fair-use" data-fair-use></p>` : ""}</figcaption></figure>`;   // fair-use note when someone else's recording is hosted here
  const SCORE = (f, label = "score (PDF)") => ` [<a href="assets/scores/texture/${f}.pdf" target="_blank" rel="noopener">${label}</a>]`;
  const lesson = { steps: [
    { title: "What is texture?", kick: "The weave of the music", render: H => `<p><b>Texture</b> is how the layers of a piece fit together: how many there are, what each one does, and how they relate. Like the weave of a fabric, a texture can be thin or thick, transparent or dense, and it can change from moment to moment.</p>
      <p>Musicians usually describe four basic textures: <b>monophony</b>, <b>heterophony</b>, <b>homophony</b> and <b>polyphony</b>. Build one yourself: switch layers on and off over the same tune and see what the result is called.</p>${builder()}` + H.check("Texture describes…", "how layers of sound combine", ["how loud the music is", "one instrument's tone color", "the tempo"], "How many layers and how they relate.") },
    { title: "Monophony", kick: "One line", render: H => `<p><b>Monophony</b> ("one sound") is a single melodic line without accompaniment: plainchant, a lullaby sung alone, a solo flute, a crowd singing in unison. Doubling the line in unison or octaves doesn't change the texture: there's still only one line.</p>${ex("mono")}
      ${EXF("<b>Monophony in real music:</b> Hildegard von Bingen (1098–1179), <i>O virtus Sapientiae</i>, a single unaccompanied melodic line, sung by Hildegard von Blingin'.", YT("C9K9PfjRjxM", "Hildegard von Bingen, O virtus Sapientiae"))}
      <p>Monophony is the oldest and most widespread texture. The earliest notated Western music, such as Gregorian chant and the songs of Hildegard of Bingen (12th century), is monophonic.</p>` + H.check("Men and women sing the same melody an octave apart. The texture is…", "monophony", ["polyphony", "homophony", "heterophony"], "Octave doubling is still one line.") },
    { title: "Heterophony", kick: "Variations at once", render: H => `<p><b>Heterophony</b> ("different sounds") happens when several performers play or sing the <i>same</i> melody at the same time, each in their own way: one adds ornaments, another simplifies, timing differs slightly. It's central to many traditions: Middle Eastern and Turkish ensembles, Javanese and Balinese gamelan, Japanese gagaku, Gaelic psalm singing, Irish and old-time fiddle and vocal music, and countless folk groups.</p>${ex("hetero")}
      <p>Listen for one tune that seems to be "smeared" or decorated in one part: not two different tunes, and not chords.</p>
      <h3>Heterophony in real music</h3>
      ${EXF("<b>Middle Eastern music:</b> instruments and voice follow the same melody with different embellishments. <i>Nami Nami</i>, a traditional Egyptian lullaby, performed by the ODO Ensemble.", YT("L0pQVnLIDig", "Nami Nami, ODO Ensemble"))}
      ${EXF("<b>Southeast Asian gamelan:</b> variations of a core melody are layered, from slow, plain versions to fast, elaborate ones. Gamelan from Indonesia (Genelec Music Channel, <i>Sound Tracker</i>).", YT("UEWCCSuHsuQ", "Sound Tracker, Gamelan (Indonesia)"))}
      ${EXF("<b>Appalachian fiddle tunes and Celtic music:</b> musicians play the same melody with personal flourishes. <i>Snake Chapman's Tune</i>, played by Jeff Norman.", YT("9ygk-wN1544", "Snake Chapman's Tune, Jeff Norman"))}
      ${EXF("<b>Western classical music:</b> heterophony is relatively rare but appears in both historic and modern music. A video essay from Score Circuit, starting at 2:11.", YT("kTN1y3Mx7xI", "The chaotic texture loved by the masters: Heterophony (Score Circuit)", 131))}
      ${EXF(`Adam Silverman, <i>Together</i>, performed by the BRN Duo${SCORE("silverman-together-score")}.`, YT("-m7ziVMrjxc", "Adam Silverman, Together (feat. BRN Duo)"))}
      ${EXF("David Lang, <i>sunray</i>: clarinet, vibraphone and electric guitar all play the same line, while the piano's right hand plays a busier version of it (\"shadow the vibes\").", IMG("lang-sunray.jpg", "Score excerpt of David Lang's sunray for clarinet, piano, vibraphone, electric guitar, cello and double bass in changing meters (3/8, 2/4, 5/8). The clarinet, vibraphone and electric guitar share one melody, marked legato; the piano right hand plays a running eighth-note version of it; cello and double bass hold long bass notes."), AUD("lang-sunray"))}` + H.check("A fiddler and a singer perform the same tune, the fiddler adding runs and ornaments. The texture is…", "heterophony", ["homophony", "monophony", "imitative polyphony"], "Simultaneous variants of one melody.") },
    { title: "Homophony", kick: "Melody with support", render: H => `<p><b>Homophony</b> has one main melody supported by other parts. It comes in two main kinds:</p>
      <p><b>Chordal homophony</b> (homorhythm): all voices move together in the same rhythm, in block chords, as in a hymn or a barbershop tag.</p>${ex("chordal", "Play chordal homophony")}
      <p><b>Melody and accompaniment</b>: a melody over chords that have their own rhythm: strummed guitar, block or broken piano chords, an Alberti bass, a pop band's groove.</p>${ex("melacc", "Play melody and accompaniment")}
      <p>Homophony dominates most popular music and much music since about 1600: a singer with a band, an aria with orchestra, a piano piece with melody in the right hand.</p>` + H.check("A singer with strummed guitar chords is…", "homophony (melody and accompaniment)", ["polyphony", "heterophony", "monophony"], "One main melody, with the guitar supporting it.") },
    { title: "Polyphony", kick: "Independent lines", render: H => `<p><b>Polyphony</b> ("many sounds"), also called <b>counterpoint</b>, combines two or more independent melodies. Each has its own rhythm and shape, yet together they make harmony.</p>
      <ul><li><b>Imitative polyphony</b>: voices enter one after another with the same melody: rounds, canons, fugues, and the points of imitation in Renaissance motets.</li>
      <li><b>Free (non-imitative) polyphony</b>: different melodies at once, like a countermelody against a tune, or the independent lines of a jazz ensemble or a medieval motet.</li></ul>
      <p>Polyphony flourished in Renaissance choral music and in the works of J. S. Bach; it's also found in Dixieland jazz, in many African and Central African vocal traditions, and whenever a pop arrangement adds a real countermelody.</p>
      <h3>Before polyphony: melody over a drone</h3>
      <p>Around the world, harmony often begins with a melody over a steady <b>drone</b>: it's implied in the music of <a href="https://youtu.be/-JKNqnDYwj0" target="_blank" rel="noopener">ancient Greece</a> and heard in <a href="https://youtu.be/e70Py6kgEsc" target="_blank" rel="noopener">Indian classical music</a>, <a href="https://youtu.be/hnSNfxjrwck" target="_blank" rel="noopener">bagpipe playing</a> and Central Asian throat singing.</p>
      <h3>Early polyphony: organum</h3>
      <p>Western polyphony begins with <b>organum</b> in the Middle Ages (roughly the 9th to 13th centuries): a second voice added to a plainchant, at first doubling it in simple intervals, then growing more independent in rhythm.</p>
      ${EXF(`<b>Parallel organum</b> (9th–10th centuries): the added voice moves in parallel 4ths or 5ths with the chant. <i>Tu patris sempiternus es filius</i>, from the <i>Musica enchiriadis</i> (9th century), the first treatise with rules for polyphony.`, YT("W4rYZmEnZO8", "Parallel organum, Tu patris sempiternus, Musica enchiriadis"))}
      ${EXF(`<b>Free organum</b> (10th–11th centuries): the added voice moves note against note, using a variety of intervals and directions. <i>Dicant nunc judei</i>, from the Chartres fragment (about 11th century), the earliest fully legible practical source of composed polyphony.`, YT("SgHzH5iDcGQ", "Music of the Middle Ages: Early Organum"))}
      ${EXF(`<b>Melismatic organum</b> (11th–12th centuries): the upper voices sing long melismas over very long held notes in the lowest voice, which still carries the chant. Pérotin, <i>Sederunt principes</i> (about 1199).`, YT("PhqWgfGK1Xw", "Pérotin, Sederunt principes, with score"))}
      <h3>Polyphony in Musical Theater</h3>
      <p>A good polyphonic texture balances <b>linear independence</b> (every line has melodic interest and its own rhythm), <b>harmonic coherence</b> (the lines still make intended consonances and dissonances together) and <b>contrapuntal interaction</b> (imitation, canon, answering lines).</p>
      ${EXF(`Frank Loesser, “Fugue for Tinhorns” from <i>Guys and Dolls</i> (1950). Despite the title, it isn't a fugue: the melody that begins in bar 7 is layered against new entries as other characters join in bars 19 and 23.`, YT("BAIlVCStp3c", "Frank Loesser, Fugue for Tinhorns"))}
      <h3>Imitative polyphony: a fugue</h3>
      ${EXF(`J. S. Bach, Fugue in C minor from <i>The Well-Tempered Clavier</i>, Book I (1722)${SCORE("bach-fugue-c-minor")}. Entries of the subject in bar 1 (treble staff, down-stems), bar 3 (up-stems, a 5th higher) and bar 7 (bass staff, an octave lower), then an episode that develops fragments of the subject, and a return to the home key in bar 26.`, AUD("bach-fugue-c-minor"))}
      <h3>Free polyphony in real music</h3>
      ${EXF(`Claudio Monteverdi, “Lasciatemi morire” from the opera <i>L'Arianna</i> (1608)${SCORE("monteverdi-lasciatemi-morire")}: independent voices with different material.`, AUD("monteverdi-lasciatemi-morire"))}
      ${EXF(`Lin-Manuel Miranda, “We Don't Talk About Bruno” from <i>Encanto</i>: different melodies from different characters, sung at once.`, AUD("miranda-bruno"))}
      ${EXF(`Arvo Pärt, <i>I Am the True Vine</i> (opening): the voices work “cooperatively”, passing the melody among themselves to build one overall shape.`, AUD("part-true-vine"))}` + H.check("In a round, each voice sings the same tune but starts later. That's…", "imitative polyphony", ["chordal homophony", "heterophony", "monophony"], "Imitation at a time delay.") },
    { title: "Beyond the four types", kick: "Density, layers and change", render: H => `<p>Real music often mixes textures, and the four labels are a starting point. Other things to listen for:</p>
      ${tbl("Texture vocabulary", ["Term", "Meaning"], [["Density", "how many notes or layers sound at once: thin ↔ thick, sparse ↔ dense"], ["Spacing and register", "close or wide spacing; high, middle and low layers"], ["Doubling", "the same line in unison or octaves (more weight, not more lines)"], ["Drone / pedal point", "a held or repeated note under changing music"], ["Ostinato, riff, loop", "a repeating figure that forms a layer"], ["Call and response", "alternating leader and group (or two groups)"], ["Stratification", "contrasting layers that seem to run independently"], ["Sound mass, micropolyphony", "so many lines that they blur into one shimmering whole (Ligeti, Penderecki)"], ["Build-up and breakdown", "layers added and removed to shape form, as in pop and dance music"]])}
      <h3>More polyphonic techniques</h3>
      ${EXF("<b>Hocket:</b> a single melody, or small groups of its notes, is passed back and forth between voices or instruments. Maddie Ashman, <i>Bonfire (Otherworld)</i>.", YT("puIH0MFvH2E", "Maddie Ashman, Bonfire (Otherworld)"))}
      ${EXF("<b>Antiphony:</b> two groups or voices alternate, often as call and response, sometimes placed apart in the performance space. The Edwin Hawkins Singers, <i>Oh Happy Day</i> (1969).", YT("PevFV3qAvQw", "The Edwin Hawkins Singers, Oh Happy Day"))}
      <p><b>Canon</b> (the same melody in every voice, starting at different times) is the strictest kind of imitation: sung rounds such as <i>Row, Row, Row Your Boat</i>, or in Baroque practice a melody in canon over a ground bass, like Pachelbel's Canon in D. It became a favorite tool of 20th- and 21st-century composers, especially minimalists, who often write canonic lines as close as a single division of the beat:</p>
      <div class="lfigs">${EXF("Emma O'Halloran, <i>Night Music</i> (2014), for saxophone quartet.", YT("c4RvAKi5M7M", "Emma O'Halloran, Night Music"))}${EXF("Steve Reich, <i>Proverb</i>, with score.", YT("YAWobfclhGo", "Steve Reich, Proverb"))}${EXF("Louis Andriessen, <i>Hout</i> (Wood), played by Asko|Schönberg.", YT("1FDayJX2Eq4", "Louis Andriessen, Hout, Asko|Schönberg"))}</div>
      <p>In popular music, each layer has a role: lead vocal (melody), hooks and countermelodies, pads or rhythm guitar (harmony), bass, and drums. Arrangers change the texture section by section: sparse verses, fuller choruses, a stripped-down bridge, a big final chorus.</p>` + H.check("Adding instruments for a chorus and dropping most of them for a breakdown changes the…", "texture and density", ["key", "meter", "tempo"], "That's a texture change.") },
    { title: "Quick check", kick: "Before the drills", render: H => [1, 3, 4, 6, 7, 2].map(i => { const [q, a, w, y] = FACTS[i]; return H.check(q, a, w, y); }).join("") },
  ] };
  return {
    key: "silverapps-texture-v1", lesson, make, reference,
    modes: [{ id: "listen", kicker: "Listen: texture" }, { id: "describe", kicker: "Describe and define" }],
    topics: [],
  };
})();
