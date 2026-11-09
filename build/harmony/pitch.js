window.FAM = (() => {
  // ===== Introduction to Pitch: frequency, overtones, absolute and relative pitch, how voices and instruments make pitch,
  // synthesis, and intervals made by speeding up pulses. Engine: build/harmony/engine.js =====

  // ---------- small audio kit for the lesson's buttons (data-px) ----------
  let AC = null, bus = null;
  function ac() { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; if (!AC) AC = new C(); if (AC.state === "suspended") AC.resume(); return AC; }
  function fresh() { if (bus) { const o = bus; o.gain.setTargetAtTime(0, AC.currentTime, .03); setTimeout(() => o.disconnect(), 400); } bus = AC.createGain(); bus.gain.value = .9; bus.connect(AC.destination); return bus; }
  function tone(f, dur = 1.6, type = "sine", amp = .2, t = 0, out = bus) {
    const o = AC.createOscillator(), g = AC.createGain(), t0 = AC.currentTime + .05 + t; o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(amp, t0 + .03); g.gain.setValueAtTime(amp, t0 + dur - .15); g.gain.linearRampToValueAtTime(0, t0 + dur);
    o.connect(g); g.connect(out); o.start(t0); o.stop(t0 + dur + .05); return o;
  }
  // Pulse trains rendered into a buffer. rates: [[r0, r1], …] pulses per second, sweeping exponentially from r0 to r1 over `sweep` s, then holding r1 for `hold` s.
  function pulses(streams, sweep, hold) {
    const sr = AC.sampleRate, T = sweep + hold, N = Math.ceil(T * sr), buf = AC.createBuffer(1, N, sr), d = buf.getChannelData(0);
    const click = [1, .7, .35, .12, -.2, -.25, -.1];   // a short, bright click
    streams.forEach(([r0, r1, amp]) => {
      const k = Math.log(r1 / r0);
      let ph = 0, last = -1;
      for (let i = 0; i < N; i++) {
        const t = i / sr, r = t < sweep && sweep > 0 ? r0 * Math.exp(k * t / sweep) : r1;
        ph += r / sr;
        const n = Math.floor(ph);
        if (n !== last) { last = n; for (let j = 0; j < click.length && i + j < N; j++) d[i + j] += click[j] * (amp || .32); }
      }
    });
    const fade = Math.floor(.05 * sr); for (let i = 0; i < fade; i++) d[N - 1 - i] *= i / fade;
    const src = AC.createBufferSource(); src.buffer = buf; src.connect(bus); src.start(AC.currentTime + .05); return src;
  }
  const RAT = { "2/1": "an octave", "3/2": "a perfect 5th", "4/3": "a perfect 4th", "5/4": "a major 3rd", "6/5": "a minor 3rd", "5/3": "a major 6th", "8/5": "a minor 6th", "9/8": "a major 2nd", "3/1": "an octave and a 5th (a 12th)", "4/1": "two octaves", "15/8": "a major 7th", "16/15": "a minor 2nd" };
  const frac = s => { const [a, b] = s.split("/").map(Number); return a / b; };
  // ---------- Shepard tones, the Shepard–Risset glissando, Risset's accelerating rhythm and the tritone paradox ----------
  const bell = x => Math.exp(-Math.pow((x - .5) / .17, 2) / 2);   // amplitude over the span of octaves (x from 0 to 1)
  function shepTone(pc, t, dur, amp) {   // one Shepard tone: octave-spaced sines under a fixed bell-shaped envelope
    const base = 16.35 * Math.pow(2, pc / 12);   // C0 = 16.35 Hz
    for (let o = 0; o < 9; o++) { const fr = base * Math.pow(2, o), x = (o + pc / 12) / 9, g = AC.createGain(), osc = AC.createOscillator(); osc.frequency.value = fr; const a = bell(x) * amp;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + .03); g.gain.setValueAtTime(a, t + dur - .08); g.gain.linearRampToValueAtTime(0, t + dur); osc.connect(g); g.connect(bus); osc.start(t); osc.stop(t + dur + .05); }
  }
  function shepard(mode, pc) {
    const t0 = AC.currentTime + .05;
    if (mode === "up" || mode === "down") { for (let i = 0; i < 36; i++) shepTone(((mode === "up" ? i : -i) % 12 + 12) % 12, t0 + i * .35, .33, .07); return; }
    if (mode === "pair") { shepTone(pc, t0, .7, .08); shepTone((pc + 6) % 12, t0 + .8, .7, .08); return; }
    if (mode === "gliss") {   // continuous: each component rises an octave every 8 s and wraps at the bottom, where it is silent
      const T = 8, D = 32, R = 50, n = D * R;
      for (let c = 0; c < 9; c++) { const fr = new Float32Array(n), am = new Float32Array(n);
        for (let i = 0; i < n; i++) { const pos = ((c + i / R / T) % 9) / 9; fr[i] = 27.5 * Math.pow(2, pos * 9); am[i] = bell(pos) * .07 * Math.min(1, i / R, (n - i) / R); }
        const o = AC.createOscillator(), g = AC.createGain(); g.gain.value = 0; o.frequency.setValueCurveAtTime(fr, t0, D); g.gain.setValueCurveAtTime(am, t0, D); o.connect(g); g.connect(bus); o.start(t0); o.stop(t0 + D + .05); }
      return;
    }
    if (mode === "rhythm") {   // Risset's endless accelerando: pulse layers at tempos an octave apart, each speeding up and fading in or out
      const sr = AC.sampleRate, D = 30, N = Math.ceil(D * sr), buf = AC.createBuffer(1, N, sr), d = buf.getChannelData(0), T = 10, L = 5, r0 = .75;
      for (let c = 0; c < L; c++) { let ph = 0, last = -1;
        for (let i = 0; i < N; i++) { const t = i / sr, pos = ((c + t / T) % L) / L, rate = r0 * Math.pow(2, pos * L); ph += rate / sr; const nIdx = Math.floor(ph);
          if (nIdx !== last) { last = nIdx; const a = bell(pos) * .9 * Math.min(1, t / 1, (D - t) / 1); for (let j = 0; j < 260 && i + j < N; j++) d[i + j] += a * Math.sin(2 * Math.PI * (120 + 900 * Math.exp(-j / 40)) * j / sr) * Math.exp(-j / 70); } } }
      const src = AC.createBufferSource(); src.buffer = buf; src.connect(bus); src.start(t0);
    }
  }
  function px(b) {
    if (!ac()) return; fresh();
    const k = b.dataset.px, f = +b.dataset.f || 220;
    if (k === "tone") tone(f, +b.dataset.d || 1.6, b.dataset.w || "sine", +b.dataset.a || .2);
    if (k === "pair") { const [x, y] = b.dataset.hz.split(" ").map(Number); tone(x, 2.4, "sine", .15); tone(y, 2.4, "sine", .15); }   // both tones at once, as a dyad
    if (k === "series") { const n = +b.dataset.n; for (let h = 1; h <= n; h++) tone(f * h, 1.1, "sine", .22 / Math.sqrt(h), (h - 1) * .55); }
    if (k === "build") { const n = +b.dataset.n; for (let h = 1; h <= n; h++) tone(f * h, 5.2 - (h - 1) * .45, "sine", .2 / h, (h - 1) * .45); }
    if (k === "rate") pulses([[+b.dataset.r, +b.dataset.r]], 0, 2.2);
    if (k === "sweep") pulses([[2, 400]], 9, 2);
    if (k === "poly") { const r = frac(b.dataset.r), lo = +b.dataset.lo || 2, hi = +b.dataset.hi || 165; pulses([[lo, hi, .26], [lo * r, hi * r, .26]], +b.dataset.s || 10, 3); }
    if (k === "polyfast") { const r = frac(b.dataset.r), hi = +b.dataset.hi || 165; pulses([[hi, hi, .26], [hi * r, hi * r, .26]], 0, 2.5); }
    if (k === "polyslow") { const r = frac(b.dataset.r), lo = +b.dataset.lo || 2; pulses([[lo, lo, .3], [lo * r, lo * r, .3]], 0, 4.5); }
    if (k === "wave") tone(f, 1.6, b.dataset.w, b.dataset.w === "sine" ? .22 : b.dataset.w === "triangle" ? .2 : .08);
    if (k === "filter") { const o = AC.createOscillator(), lp = AC.createBiquadFilter(), g = AC.createGain(), t0 = AC.currentTime + .05; o.type = "sawtooth"; o.frequency.value = f; lp.type = "lowpass"; lp.Q.value = 6; lp.frequency.setValueAtTime(150, t0); lp.frequency.exponentialRampToValueAtTime(6000, t0 + 2.5); lp.frequency.exponentialRampToValueAtTime(150, t0 + 5); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.12, t0 + .05); g.gain.setValueAtTime(.12, t0 + 4.8); g.gain.linearRampToValueAtTime(0, t0 + 5.1); o.connect(lp); lp.connect(g); g.connect(bus); o.start(t0); o.stop(t0 + 5.2); }
    if (k === "hpair") { const [x, y] = b.dataset.hz.split(" ").map(Number); [x, y].forEach(fr => { for (let h = 1; h <= 6; h++) tone(fr * h, 4.5, "sine", .11 / h); }); }
    if (k === "beats") { tone(f, 4, "sine", .16); tone(f + (+b.dataset.df), 4, "sine", .16); }
    if (k === "custom") { const w = document.getElementById("pcW").value, seq = b.dataset.seq === "1"; [1, 2, 3].forEach((n, i) => { const on = document.getElementById("pcOn" + n).checked, hz = +document.getElementById("pcF" + n).value; if (on && hz >= 10 && hz <= 22000) tone(hz, seq ? 1.2 : 2.6, w, (w === "sine" ? .18 : .08) / (hz > 12000 ? 1 : 1), seq ? i * 1.3 : 0); }); }
    if (k === "chorus") {   // dry sawtooth vs a chorus: copies through short delays whose time slowly wobbles
      const t0 = AC.currentTime + .05, T = 3.2, mk = () => { const o = AC.createOscillator(), lp = AC.createBiquadFilter(); o.type = "sawtooth"; o.frequency.value = f; lp.type = "lowpass"; lp.frequency.value = 2500; o.connect(lp); o.start(t0); o.stop(t0 + T + .2); return lp; };
      const g = AC.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.09, t0 + .05); g.gain.setValueAtTime(.09, t0 + T - .2); g.gain.linearRampToValueAtTime(0, t0 + T); g.connect(bus);
      const src = mk(); src.connect(g);
      if (b.dataset.mode === "chorus") [[.015, .4, .003], [.022, .55, .004], [.03, .33, .0035]].forEach(([dt, rate, depth]) => { const d = AC.createDelay(.1), l = AC.createOscillator(), lg = AC.createGain(); d.delayTime.value = dt; l.frequency.value = rate; lg.gain.value = depth; l.connect(lg); lg.connect(d.delayTime); l.start(t0); l.stop(t0 + T + .2); src.connect(d); d.connect(g); });
      if (b.dataset.mode === "detune") { const o2 = AC.createOscillator(), lp2 = AC.createBiquadFilter(); o2.type = "sawtooth"; o2.frequency.value = f * 1.004; lp2.type = "lowpass"; lp2.frequency.value = 2500; o2.connect(lp2); lp2.connect(g); o2.start(t0); o2.stop(t0 + T + .2); }
    }
    if (k === "sweep2") {   // one tone fixed, the other gliding away from it: beats, then roughness, then two separate tones
      const t0 = AC.currentTime + .05, T = +b.dataset.t || 12, f2 = f * (+b.dataset.r || 1.5);
      [[f, f], [f, f2]].forEach(([a, z], i) => { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(a, t0); if (i) o.frequency.exponentialRampToValueAtTime(z, t0 + T); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.14, t0 + .1); g.gain.setValueAtTime(.14, t0 + T); g.gain.linearRampToValueAtTime(0, t0 + T + .3); o.connect(g); g.connect(bus); o.start(t0); o.stop(t0 + T + .4); });
    }
    if (k === "shep") shepard(b.dataset.mode, +b.dataset.pc || 0);
    if (k === "stop") { /* fresh() already silenced */ }
  }
  const TRI = { "major (just 4:5:6)": [1, 5 / 4, 3 / 2], "minor (just 10:12:15)": [1, 6 / 5, 3 / 2], "major (equal-tempered)": [1, Math.pow(2, 4 / 12), Math.pow(2, 7 / 12)], "minor (equal-tempered)": [1, Math.pow(2, 3 / 12), Math.pow(2, 7 / 12)], "diminished": [1, Math.pow(2, 3 / 12), Math.pow(2, 6 / 12)], "augmented": [1, Math.pow(2, 4 / 12), Math.pow(2, 8 / 12)] };
  function setF(list) { [0, 1, 2].forEach(i => { const v = list[i]; document.getElementById("pcF" + (i + 1)).value = v ? +v.toFixed(2) : ""; document.getElementById("pcOn" + (i + 1)).checked = !!v; }); }
  if (!window.__pcWired) { window.__pcWired = true; document.addEventListener("click", e => {
    const playIt = () => { const p = document.querySelector('[data-px="custom"]:not([data-seq])'); if (p) setTimeout(() => p.click(), 0); };
    const b = e.target.closest("[data-pcs]"); if (b) { setF(b.dataset.pcs.split(",").map(Number).map(v => v || null)); playIt(); return; }
    if (e.target.closest("#pcTri")) { const base = +document.getElementById("pcBase").value || 220, r = TRI[document.getElementById("pcQ").value]; setF(r.map(x => base * x)); playIt(); } }); }
  if (!window.__pxWired) { window.__pxWired = true; document.addEventListener("click", e => { const b = e.target.closest("[data-px]"); if (b) px(b); }); }
  // ---------- illustrations ----------
  const NAMES = ["A", "", "B", "C", "", "D", "", "E", "F", "", "G", "", "A"];   // naturals only: the lesson's rich-text pass would turn sharps into HTML inside the SVG
  function etFig() {
    const W = 640, L = 40, R = 600, xC = c => L + (R - L) * c / 1200, xHz = f => L + (R - L) * (f - 220) / 220;
    let g = `<text x="${L}" y="16" font-size="13" font-weight="700" fill="currentColor">In hertz, the 12 steps from A3 to A4 grow wider…</text><line x1="${L}" x2="${R}" y1="44" y2="44" stroke="currentColor"/>`;
    for (let i = 0; i <= 12; i++) { const f = 220 * Math.pow(2, i / 12), x = xHz(f); g += `<circle cx="${x}" cy="44" r="4.5" fill="var(--fi-red, #E8573F)"/>`; if (i % 3 === 0) g += `<text x="${x}" y="66" text-anchor="middle" font-size="11" fill="currentColor">${Math.round(f)} Hz</text>`; }
    g += `<text x="${L}" y="98" font-size="13" font-weight="700" fill="currentColor">…but each one is the same ×1.0595, so in cents (how we hear) they're all 100 apart</text><line x1="${L}" x2="${R}" y1="128" y2="128" stroke="currentColor"/>`;
    for (let i = 0; i <= 12; i++) { const x = xC(i * 100); g += `<line x1="${x}" x2="${x}" y1="120" y2="136" stroke="currentColor" stroke-width="2"/><text x="${x}" y="114" text-anchor="middle" font-size="10" fill="currentColor">${NAMES[i]}</text>`; if (i % 3 === 0) g += `<text x="${x}" y="150" text-anchor="middle" font-size="10" fill="currentColor">${i * 100}¢</text>`; }
    const J = [["m3", 315.6, "6:5"], ["M3", 386.3, "5:4"], ["P4", 498, "4:3"], ["P5", 702, "3:2"], ["M6", 884.4, "5:3"]];
    g += `<text x="${L}" y="178" font-size="13" font-weight="700" fill="currentColor">Pure (just) intervals, ▲, fall between: equal temperament is a little off each one</text>`;
    J.forEach(([n, c, r]) => { const x = xC(c), et = Math.round(c / 100) * 100, d = et - c; g += `<path d="M${x} 194 l-6 10 h12z" fill="var(--fi-green-dk, #2d6a1f)"/><text x="${x + (n === "m3" ? 6 : n === "M3" ? -6 : 0)}" y="218" text-anchor="${n === "m3" ? "end" : n === "M3" ? "start" : "middle"}" font-size="11" font-weight="700" fill="currentColor">${n} ${r}</text><text x="${x + (n === "m3" ? 6 : n === "M3" ? -6 : 0)}" y="232" text-anchor="${n === "m3" ? "end" : n === "M3" ? "start" : "middle"}" font-size="10" fill="currentColor">ET ${d > 0 ? "+" : "−"}${Math.abs(d).toFixed(d > 3 || d < -3 ? 0 : 1)}¢</text><line x1="${x}" x2="${x}" y1="136" y2="192" stroke="var(--fi-green-dk, #2d6a1f)" stroke-dasharray="2 3"/>`; });
    return `<figure class="lfig"><svg viewBox="0 0 ${W} 242" role="img" aria-label="Equal temperament. Top: the 13 notes from A3 (220 Hz) to A4 (440 Hz) on a hertz scale; the gaps grow from about 13 Hz to about 25 Hz. Middle: the same notes on a cents scale, evenly spaced 100 cents apart. Bottom: pure intervals fall between the equal-tempered notes: the minor 3rd (6:5) is 316 cents, so equal temperament is 16 cents flat; the major 3rd (5:4) is 386 cents, 14 cents sharp; the 4th (4:3) is 498 cents, 2 cents sharp; the 5th (3:2) is 702 cents, 2 cents flat; the major 6th (5:3) is 884 cents, 16 cents sharp." style="width:100%;max-width:${W}px">${g}</svg><figcaption>Equal temperament makes every semitone the same <i>ratio</i>. The 4ths and 5ths land within 2 cents of pure; the 3rds and 6ths are 14 to 16 cents off, enough to beat.</figcaption></figure>`;
  }
  function wavesFig() {
    const W = 640, L = 70, R = 620, N = 400, a = 14, c1 = 20, c2 = 22, y = [36, 96, 176];
    const path = (fn, y0) => { let d = ""; for (let i = 0; i <= N; i++) { const t = i / N, x = L + (R - L) * t; d += (i ? "L" : "M") + x.toFixed(1) + " " + (y0 - fn(t)).toFixed(1); } return d; };
    const s1 = t => a * Math.sin(2 * Math.PI * c1 * t), s2 = t => a * Math.sin(2 * Math.PI * c2 * t), env = t => 2 * a * Math.abs(Math.cos(Math.PI * (c2 - c1) * t));
    let g = `<path d="${path(s1, y[0])}" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="${path(s2, y[1])}" fill="none" stroke="currentColor" stroke-width="1.4"/>
      <path d="${path(t => s1(t) + s2(t), y[2])}" fill="none" stroke="var(--fi-red, #E8573F)" stroke-width="1.6"/>
      <path d="${path(env, y[2])}" fill="none" stroke="currentColor" stroke-dasharray="4 4"/><path d="${path(t => -env(t), y[2])}" fill="none" stroke="currentColor" stroke-dasharray="4 4"/>`;
    g += `<text x="6" y="${y[0] + 4}" font-size="12" fill="currentColor">tone 1</text><text x="6" y="${y[1] + 4}" font-size="12" fill="currentColor">tone 2</text><text x="6" y="${y[2] + 4}" font-size="12" font-weight="700" fill="currentColor">together</text>`;
    [0, .5, 1].forEach(t => g += `<text x="${L + (R - L) * t}" y="${y[2] + 2 * a + 22}" text-anchor="middle" font-size="11" fill="currentColor">${t === .5 ? "quiet" : "loud"}</text>`);
    return `<figure class="lfig"><svg viewBox="0 0 ${W} 250" role="img" aria-label="Two waves at slightly different frequencies, and their sum. The sum is loud where the peaks line up, at the start and end, and almost silent in the middle where they cancel: one beat." style="width:100%;max-width:${W}px">${g}</svg><figcaption>Tone 2 cycles slightly faster. Where the waves' peaks line up they add (loud); where they're opposite they cancel (quiet). The swell from loud to quiet to loud is one <b>beat</b>. (Real tones cycle hundreds of times per beat; this is slowed down.)</figcaption></figure>`;
  }
  function partialFig() {
    const W = 640, Hh = 300, base = 270, top = 20, Y = f => base - (base - top) * f / 1900, xa = 210, xb = 430;
    let g = `<text x="${xa}" y="${Hh - 6}" text-anchor="middle" font-size="12" font-weight="700" fill="currentColor">200 Hz tone</text><text x="${xb}" y="${Hh - 6}" text-anchor="middle" font-size="12" font-weight="700" fill="currentColor">302 Hz tone</text>`;
    for (let h = 1; h <= 9; h++) { const f = 200 * h, y = Y(f); g += `<line x1="${xa - 40}" x2="${xa + 40}" y1="${y}" y2="${y}" stroke="currentColor" stroke-width="2"/><text x="${xa - 46}" y="${y + 4}" text-anchor="end" font-size="11" fill="currentColor">${f}</text>`; }
    for (let h = 1; h <= 6; h++) { const f = 302 * h, y = Y(f); g += `<line x1="${xb - 40}" x2="${xb + 40}" y1="${y}" y2="${y}" stroke="currentColor" stroke-width="2"/><text x="${xb + 46}" y="${y + 4}" font-size="11" fill="currentColor">${f}</text>`; }
    [[600, 604], [1200, 1208], [1800, 1812]].forEach(([p, q]) => { g += `<line x1="${xa + 44}" x2="${xb - 44}" y1="${Y(p)}" y2="${Y(q)}" stroke="var(--fi-red, #E8573F)" stroke-width="2.5"/><text x="${(xa + xb) / 2}" y="${Y(p) - 7}" text-anchor="middle" font-size="12" font-weight="700" fill="var(--fi-red-dk, #b33a26)">${q - p} beats/sec</text>`; });
    return `<figure class="lfig"><svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Partials of a 200 Hz tone (200, 400, 600 and up to 1800) beside partials of a 302 Hz tone (302, 604, 906, 1208, 1510, 1812). Three pairs nearly coincide and beat: 600 and 604 at 4 per second, 1200 and 1208 at 8, 1800 and 1812 at 12." style="width:100%;max-width:${W}px">${g}</svg><figcaption>A 5th tuned slightly wide (200 and 302 Hz instead of 300): the fundamentals are far apart, but the partials that should coincide are a few hertz apart and <b>beat</b>. Tune the upper note to exactly 300 Hz and all three pairs line up: the beats stop.</figcaption></figure>`;
  }
  // ---------- overtones: waves → notes ----------
  // [partial, written note, staff ("t"/"b"), staff step (0 = bottom line), accidental, label]
  const OVT = [[1, "C2", "b", -4], [2, "C3", "b", 3], [3, "G3", "b", 7], [4, "C4", "t", -2], [5, "E4", "t", 0], [6, "G4", "t", 2], [7, "B4", "t", 4, -1], [8, "C5", "t", 5], [9, "D5", "t", 6], [10, "E5", "t", 7]];
  function overtoneFig(H) {
    const L = 78, cw = 62, W = L + cw * OVT.length + 8, sp = 10, tT = 168, bT = 248, f0 = 65.41, cx = i => L + i * cw + cw / 2;
    const ty = st => tT + 4 * sp - st * sp / 2, by = st => bT + 4 * sp - st * sp / 2;
    let g = `<text x="8" y="22" font-size="11" font-weight="700" fill="currentColor">partial</text><text x="8" y="66" font-size="11" fill="currentColor">wave</text><text x="8" y="112" font-size="11" fill="currentColor">frequency</text>`;
    for (let i = 0; i < 5; i++) g += `<line x1="${L - 56}" x2="${W - 6}" y1="${tT + i * sp}" y2="${tT + i * sp}" stroke="currentColor"/><line x1="${L - 56}" x2="${W - 6}" y1="${bT + i * sp}" y2="${bT + i * sp}" stroke="currentColor"/>`;
    g += `<line x1="${L - 56}" x2="${L - 56}" y1="${tT}" y2="${bT + 4 * sp}" stroke="currentColor" stroke-width="1.5"/><line x1="${W - 6}" x2="${W - 6}" y1="${tT}" y2="${bT + 4 * sp}" stroke="currentColor" stroke-width="2.5"/>`;
    g += `<text x="${L - 52}" y="${tT + 3 * sp + 1.1 * sp}" font-family="'Noto Music', serif" font-size="${sp * 2.95 * 1.4}" fill="currentColor">&#x1D11E;</text><text x="${L - 52}" y="${bT + sp + 3.08 * sp}" font-family="'Noto Music', serif" font-size="${sp * 3.3 * 1.4}" fill="currentColor">&#x1D122;</text>`;
    OVT.forEach(([n, nm, st, step, acc], i) => {
      const x = cx(i), f = f0 * n, y = st === "t" ? ty(step) : by(step), top = st === "t" ? tT : bT, bot = top + 4 * sp;
      // n cycles of a sine in the same time window: twice the frequency, twice the cycles
      let d = ""; for (let k = 0; k <= 60; k++) { const u = k / 60; d += (k ? "L" : "M") + (x - 26 + 52 * u).toFixed(1) + " " + (62 - 16 * Math.sin(2 * Math.PI * n * u)).toFixed(1); }
      g += `<g data-px="tone" data-f="${f.toFixed(2)}" data-d="1.4" data-a=".22" role="button" tabindex="0" aria-label="Play partial ${n}: ${nm[0]}${acc ? " flat" : ""} ${nm.slice(1)}, ${Math.round(f)} hertz" style="cursor:pointer"><rect x="${x - cw / 2 + 2}" y="6" width="${cw - 4}" height="${bot + 30}" rx="8" fill="transparent" class="ovhit"/>
        <text x="${x}" y="22" text-anchor="middle" font-size="13" font-weight="700" fill="currentColor">${n}</text>
        <path d="${d}" fill="none" stroke="var(--fi-red, #E8573F)" stroke-width="1.6"/>
        <text x="${x}" y="100" text-anchor="middle" font-size="10" fill="currentColor">×${n}</text><text x="${x}" y="113" text-anchor="middle" font-size="10" fill="currentColor">${Math.round(f)} Hz</text>
        <line x1="${x}" x2="${x}" y1="120" y2="${Math.min(y, top) - 8}" stroke="currentColor" stroke-opacity=".35" stroke-dasharray="2 3"/>`;
      for (let l = -2; l >= step; l -= 2) g += `<line x1="${x - 12}" x2="${x + 12}" y1="${st === "t" ? ty(l) : by(l)}" y2="${st === "t" ? ty(l) : by(l)}" stroke="currentColor" stroke-width="1.2"/>`;
      if (acc) { const P = H.ACCP[acc]; g += `<path d="${P.d}" transform="translate(${x - 9 - 6 - P.w * sp} ${y}) scale(${sp})" fill="currentColor"/>`; }
      g += `<ellipse cx="${x}" cy="${y}" rx="${sp * .72}" ry="${sp * .5}" transform="rotate(-20 ${x} ${y})" fill="none" stroke="currentColor" stroke-width="${sp * .26}"/>`;
      const ly = bT + 4 * sp + 44;
      g += acc ? `<text x="${x - 2}" y="${ly}" text-anchor="end" font-size="11" font-weight="700" fill="currentColor">${nm[0]}</text><path d="${H.ACCP[acc].d}" transform="translate(${x - 1} ${ly - 4}) scale(5.5)" fill="currentColor"/><text x="${x + 5}" y="${ly}" font-size="11" font-weight="700" fill="currentColor">${nm.slice(1)}*</text></g>` : `<text x="${x}" y="${ly}" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">${nm}</text></g>`;
    });
    return `<figure class="lfig ovfig"><svg viewBox="0 0 ${W} ${bT + 4 * sp + 56}" role="group" aria-label="The harmonic series on C2, partials 1 to 10: for each, a wave with that many cycles, its frequency, and its note on the grand staff. Partial 1: C2, 65 Hz; 2: C3, 131 Hz; 3: G3, 196 Hz; 4: C4 (middle C), 262 Hz; 5: E4, 327 Hz; 6: G4, 392 Hz; 7: B flat 4, 458 Hz (flatter than a piano's B flat); 8: C5, 523 Hz; 9: D5, 589 Hz; 10: E5, 654 Hz. Select a partial to hear it." style="width:100%;max-width:${W}px">${g}</svg><figcaption>Each partial vibrates 2, 3, 4… times as fast as the fundamental: in the same moment of time, partial 2's wave fits 2 cycles, partial 3's fits 3, and so on. Each wave's frequency lands on a note: the gaps shrink from an octave to a 5th, a 4th, a 3rd… Select a column to hear that partial. *Partial 7 is about a third of a semitone flatter than a piano's B♭.</figcaption></figure>`;
  }
  if (!window.__ovKeys) { window.__ovKeys = true; document.addEventListener("keydown", e => { const g = e.target.closest && e.target.closest("g[data-px]"); if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); g.dispatchEvent(new MouseEvent("click", { bubbles: true })); } }); }

  // ---------- critical bandwidth: find where two tones split ----------
  const CBR = { low: ["Low (A2, 110 Hz)", 110], mid: ["Middle (A3, 220 Hz)", 220], up: ["Upper (A4, 440 Hz)", 440], high: ["High (A6, 1760 Hz)", 1760] };
  const CB = { reg: "up", c: 0, oscs: null, g: null, marks: {}, raf: 0 };
  const cbHz = f => 25 + 75 * Math.pow(1 + 1.4 * Math.pow(f / 1000, 2), .69);   // Zwicker's critical bandwidth
  const bark = f => 13 * Math.atan(.00076 * f) + 3.5 * Math.atan(Math.pow(f / 7500, 2));
  const cbF1 = () => CBR[CB.reg][1], cbF2 = () => cbF1() * Math.pow(2, CB.c / 1200);
  const cbCents = f => 1200 * Math.log2((f + cbHz(f)) / f);
  const IVN = ["unison", "minor 2nd", "major 2nd", "minor 3rd", "major 3rd", "perfect 4th", "tritone", "perfect 5th", "minor 6th", "major 6th", "minor 7th", "major 7th", "octave"];
  const art = w => (/^[aeiou]/.test(w) ? "an " : "a ") + w;
  const ivName = c => { const k = Math.round(c / 100), off = c - k * 100; return Math.abs(off) < 12 ? art(IVN[k]) : `between ${art(IVN[Math.floor(c / 100)])} and ${art(IVN[Math.ceil(c / 100)])}`; };
  function cbSVG() {
    const W = 560, Hh = 170, f1 = cbF1(), z1 = bark(f1), z0 = z1 - 1.5, z9 = z1 + 4.5, X = z => 20 + (W - 40) * (z - z0) / (z9 - z0), base = 118, top = 26;
    const bump = zc => z => Math.exp(-Math.pow((z - zc) / .42, 2) / 2), b1 = bump(z1), b2 = bump(bark(cbF2()));
    let p1 = "", p2 = "", ov = ""; for (let k = 0; k <= 200; k++) { const z = z0 + (z9 - z0) * k / 200, x = X(z); p1 += (k ? "L" : "M") + x.toFixed(1) + " " + (base - (base - top) * b1(z)).toFixed(1); p2 += (k ? "L" : "M") + x.toFixed(1) + " " + (base - (base - top) * b2(z)).toFixed(1); ov += (k ? "L" : "M") + x.toFixed(1) + " " + (base - (base - top) * Math.min(b1(z), b2(z))).toFixed(1); }
    let g = `<path d="${ov}L${X(z9)} ${base}L${X(z0)} ${base}Z" fill="var(--fi-red, #E8573F)" fill-opacity=".45"/><path d="${p1}" fill="none" stroke="currentColor" stroke-width="2"/><path d="${p2}" fill="none" stroke="var(--fi-red-dk, #b33a26)" stroke-width="2"/>
      <line x1="20" x2="${W - 20}" y1="${base}" y2="${base}" stroke="currentColor"/><text x="20" y="${base + 46}" font-size="11" fill="currentColor">low ← where each tone excites the inner ear (spaced in critical bands) → high</text>
      <text x="20" y="16" font-size="12" font-weight="700" fill="currentColor">Shaded = overlap: the two tones share part of the inner ear</text>`;
    const m = CB.marks[CB.reg];
    if (m != null) { const xc = X(bark(f1 + cbHz(f1))), xm = X(bark(f1 * Math.pow(2, m / 1200))); g += `<line x1="${xc}" x2="${xc}" y1="${top - 4}" y2="${base}" stroke="var(--fi-green-dk, #2d6a1f)" stroke-width="2" stroke-dasharray="5 3"/><text x="${xc + 4}" y="${top + 8}" font-size="11" font-weight="700" fill="var(--fi-green-dk, #2d6a1f)">1 critical band</text><path d="M${xm} ${base + 2} l-6 10 h12z" fill="#1a5fb4"/><text x="${xm}" y="${base + 26}" text-anchor="middle" font-size="11" font-weight="700" fill="#1a5fb4">your mark</text>`; }
    return `<svg viewBox="0 0 ${W} ${Hh}" aria-hidden="true" style="width:100%;max-width:${W}px">${g}</svg>`;
  }
  function cbTable() {
    const rows = Object.entries(CBR).map(([k, [n, f]]) => { const m = CB.marks[k], c = cbCents(f); return `<tr><td>${n}</td><td>${m == null ? "–" : `${Math.round(m)} cents (${ivName(m)}), ${Math.round(f * Math.pow(2, m / 1200) - f)} Hz apart`}</td><td>${Math.round(c)} cents (${ivName(c)}), ${Math.round(cbHz(f))} Hz</td></tr>`; }).join("");
    return `<div class="ltable-wrap" tabindex="0" role="region" aria-label="Your marks"><table class="ltable"><caption>Your marks vs. the critical bandwidth</caption><thead><tr><th scope="col">Register (lower tone)</th><th scope="col">Where you heard them split</th><th scope="col">Critical bandwidth</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  const cbDesc = () => `upper tone ${Math.round(CB.c)} cents above the lower (${ivName(CB.c)}), ${Math.round(cbF2() - cbF1())} Hz apart`;
  function cbToy() {
    return `<div class="toy" id="cbToy">
      <div class="toy-row" role="group" aria-label="Register">${Object.entries(CBR).map(([k, [n]]) => `<button class="play" data-cbreg="${k}" aria-pressed="${CB.reg === k}">${n}</button>`).join("")}</div>
      <div id="cbVis">${cbSVG()}</div>
      <label class="toy-row" for="cbX" style="font-weight:700;gap:10px">Distance<input type="range" id="cbX" min="0" max="1200" step="1" value="${CB.c}" style="flex:1;min-width:160px" aria-valuetext="${cbDesc()}"></label>
      <p class="msinfo" id="cbNow" style="margin:0">${cbDesc()[0].toUpperCase() + cbDesc().slice(1)}</p>
      <div class="toy-row"><button class="play" id="cbPlay" aria-pressed="false"><span aria-hidden="true">▶ </span>Play both tones</button><button class="play" data-cbnudge="-5">◀ closer</button><button class="play" data-cbnudge="5">farther ▶</button><button class="play primary" id="cbMark">They split here</button></div>
      <p class="msinfo" id="cbInfo" aria-live="polite">Press Play and start with the slider at the left (one tone). Move it right slowly: beats, then roughness, then two clear tones. Mark the point where you first hear two separate, smooth pitches.</p>
      <div id="cbTab">${cbTable()}</div></div>`;
  }
  function cbStop() { if (!CB.oscs) return; const t = AC.currentTime; CB.g.gain.cancelScheduledValues(t); CB.g.gain.setTargetAtTime(0, t, .05); CB.oscs.forEach(o => o.stop(t + .4)); CB.oscs = null; const b = document.getElementById("cbPlay"); if (b) { b.setAttribute("aria-pressed", "false"); b.innerHTML = '<span aria-hidden="true">▶ </span>Play both tones'; } }
  function cbStart() {
    if (!ac()) return; fresh(); const t = AC.currentTime + .03, g = AC.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(CB.reg === "high" ? .11 : .16, t + .1); g.connect(bus);
    CB.g = g; CB.oscs = [cbF1(), cbF2()].map((f, i) => { const o = AC.createOscillator(); o.frequency.value = f; o._w = i; o.connect(g); o.start(t); return o; });
    const b = document.getElementById("cbPlay"); b.setAttribute("aria-pressed", "true"); b.innerHTML = '<span aria-hidden="true">■ </span>Stop';
  }
  function cbUpdate() {
    const x = document.getElementById("cbX"); if (x) { x.value = CB.c; x.setAttribute("aria-valuetext", cbDesc()); }
    const n = document.getElementById("cbNow"); if (n) n.textContent = cbDesc()[0].toUpperCase() + cbDesc().slice(1);
    const v = document.getElementById("cbVis"); if (v) v.innerHTML = cbSVG();
    if (CB.oscs) CB.oscs.forEach(o => o.frequency.setTargetAtTime(o._w ? cbF2() : cbF1(), AC.currentTime, .02));
  }
  if (!window.__cbWired) { window.__cbWired = true;
    document.addEventListener("input", e => { if (e.target.id === "cbX") { CB.c = +e.target.value; cbUpdate(); } });
    document.addEventListener("click", e => {
      if (e.target.closest("#cbPlay")) { CB.oscs ? cbStop() : cbStart(); return; }
      const nd = e.target.closest("[data-cbnudge]"); if (nd) { CB.c = Math.max(0, Math.min(1200, CB.c + +nd.dataset.cbnudge)); cbUpdate(); return; }
      const rg = e.target.closest("[data-cbreg]"); if (rg) { CB.reg = rg.dataset.cbreg; CB.c = 0; document.querySelectorAll("[data-cbreg]").forEach(b => b.setAttribute("aria-pressed", b === rg)); if (CB.oscs) { cbStop(); cbStart(); } cbUpdate(); document.getElementById("cbInfo").textContent = `${CBR[CB.reg][0]}: start at the left and move right until the tones split.`; return; }
      if (e.target.closest("#cbMark")) { if (CB.c < 5) { document.getElementById("cbInfo").textContent = "Move the slider first: at the far left the two tones are the same pitch."; return; }
        CB.marks[CB.reg] = CB.c; const f = cbF1(), c = cbCents(f), d = CB.c - c;
        document.getElementById("cbInfo").innerHTML = `<b>Marked: ${Math.round(CB.c)} cents (${ivName(CB.c)}).</b> The critical bandwidth here is about ${Math.round(cbHz(f))} Hz, or ${Math.round(c)} cents (${ivName(c)}). ${Math.abs(d) < c * .25 ? "Very close: you split them right around one critical band." : d < 0 ? "You heard them split a little before one full critical band, which is common: roughness fades gradually." : "You marked a bit beyond one critical band: the last of the roughness can linger."} Now try another register and compare.`;
        document.getElementById("cbTab").innerHTML = cbTable(); cbUpdate(); return; }
      if (e.target.closest("[data-px]")) cbStop(); });
    setInterval(() => { if (CB.oscs && !document.getElementById("cbToy")) cbStop(); }, 300);
  }

  // ---------- a mini synthesizer ----------
  const SY = { wave: "sawtooth", det: 7, osc2: true, cut: 1800, q: 4, env: 40, a: .01, d: .3, s: .6, r: .4, lfoR: 5, lfoD: 0, vol: .7, oct: 0, voices: {}, out: null, an: null, raf: 0, last: null };
  const SYP = {
    "Pure sine": { wave: "sine", osc2: false, det: 0, cut: 8000, q: .7, env: 0, a: .02, d: .2, s: 1, r: .3, lfoD: 0 },
    "Brass": { wave: "sawtooth", osc2: true, det: 6, cut: 700, q: 2, env: 70, a: .06, d: .25, s: .75, r: .25, lfoD: 8, lfoR: 5.5 },
    "Pluck": { wave: "sawtooth", osc2: false, det: 0, cut: 400, q: 6, env: 90, a: .002, d: .35, s: 0, r: .3, lfoD: 0 },
    "Soft pad": { wave: "triangle", osc2: true, det: 14, cut: 1200, q: 1, env: 15, a: .8, d: 1, s: .8, r: 1.5, lfoD: 4, lfoR: 4 },
    "Hollow (clarinet-ish)": { wave: "square", osc2: false, det: 0, cut: 1600, q: 1, env: 20, a: .04, d: .2, s: .85, r: .2, lfoD: 6, lfoR: 5 },
    "Wah bass": { wave: "sawtooth", osc2: true, det: 4, cut: 250, q: 14, env: 85, a: .005, d: .5, s: .3, r: .2, lfoD: 0 },
  };
  const SYK = [["sy", "Waveform"], ["det", "Oscillator 2 detune", 0, 50, 1, " cents"], ["cut", "Filter cutoff", 80, 8000, 1, " Hz"], ["q", "Filter resonance", .5, 20, .1, ""], ["env", "Envelope → filter", 0, 100, 1, "%"], ["a", "Attack", .002, 2, .001, " s"], ["d", "Decay", .02, 2, .01, " s"], ["s", "Sustain", 0, 1, .01, ""], ["r", "Release", .02, 3, .01, " s"], ["lfoD", "Vibrato depth", 0, 50, 1, " cents"], ["lfoR", "Vibrato speed", .5, 10, .1, " Hz"], ["vol", "Volume", 0, 1, .01, ""]];
  const NN = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"], NS = ["C", "C sharp", "D", "D sharp", "E", "F", "F sharp", "G", "G sharp", "A", "A sharp", "B"];
  const KEYMAP = "awsedftgyhujkolp;'";   // computer keys → semitones from the bottom C
  const syHz = m => 440 * Math.pow(2, (m - 69) / 12);
  function syOut() {
    if (SY.out) return SY.out;
    const o = AC.createGain(), comp = AC.createDynamicsCompressor(); o.gain.value = SY.vol * .5; comp.threshold.value = -12; comp.ratio.value = 4;
    SY.an = AC.createAnalyser(); SY.an.fftSize = 2048; o.connect(comp); comp.connect(SY.an); SY.an.connect(AC.destination); SY.out = o; return o;
  }
  function syOn(m, vel = 1) {
    if (!ac() || SY.voices[m]) return; const t = AC.currentTime + .005, f = syHz(m), out = syOut(), pk = .35 * vel;
    const lp = AC.createBiquadFilter(), g = AC.createGain(), lfo = AC.createOscillator(), lg = AC.createGain();
    lp.type = "lowpass"; lp.Q.value = SY.q;
    const peak = Math.min(16000, SY.cut * Math.pow(2, SY.env / 100 * 5));
    lp.frequency.setValueAtTime(SY.env ? peak : SY.cut, t); lp.frequency.setTargetAtTime(SY.cut, t + SY.a, Math.max(.01, SY.d / 3));
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(pk, t + SY.a); g.gain.setTargetAtTime(pk * SY.s, t + SY.a, Math.max(.01, SY.d / 3));
    lfo.frequency.value = SY.lfoR; lg.gain.value = SY.lfoD; lfo.connect(lg); lfo.start(t);
    const oscs = (SY.osc2 ? [0, 1] : [0]).map(i => { const o = AC.createOscillator(); o.type = SY.wave; o.frequency.value = f; o.detune.value = i ? SY.det : 0; lg.connect(o.detune); o.connect(lp); o.start(t); return o; });
    lp.connect(g); g.connect(out);
    SY.voices[m] = { g, oscs, lfo, lp }; SY.last = m; syShow(m);
    const k = document.querySelector(`[data-sykey="${m}"]`); if (k) k.classList.add("on");
    if (!SY.raf) SY.raf = requestAnimationFrame(syScope);
  }
  function syOff(m) {
    const v = SY.voices[m]; if (!v) return; delete SY.voices[m]; const t = AC.currentTime;
    v.g.gain.cancelScheduledValues(t); v.g.gain.setValueAtTime(v.g.gain.value, t); v.g.gain.setTargetAtTime(0, t, Math.max(.005, SY.r / 4));
    const end = t + SY.r * 1.5 + .05; v.oscs.forEach(o => o.stop(end)); v.lfo.stop(end);
    const k = document.querySelector(`[data-sykey="${m}"]`); if (k) k.classList.remove("on");
  }
  const syAllOff = () => Object.keys(SY.voices).forEach(m => syOff(+m));
  function syShow(m) { const el = document.getElementById("syNote"); if (el) el.innerHTML = `<b>${NN[m % 12]}${Math.floor(m / 12) - 1}</b> · MIDI ${m} · ${syHz(m).toFixed(1)} Hz`; }
  function syScope() {
    const cv = document.getElementById("syScope"); if (!cv || !SY.an) { SY.raf = 0; return; }
    const c = cv.getContext("2d"), W = cv.width, Hh = cv.height, d = new Float32Array(SY.an.fftSize); SY.an.getFloatTimeDomainData(d);
    let st = 0; for (let i = 1; i < d.length / 2; i++) if (d[i - 1] < 0 && d[i] >= 0) { st = i; break; }   // trigger on a rising zero crossing so the wave stands still
    c.clearRect(0, 0, W, Hh); c.strokeStyle = "rgba(0,0,0,.15)"; c.beginPath(); c.moveTo(0, Hh / 2); c.lineTo(W, Hh / 2); c.stroke();
    let pk = .05; for (let i = 0; i < d.length; i++) pk = Math.max(pk, Math.abs(d[i])); SY.pk = Math.max(pk, (SY.pk || .05) * .97);   // auto-scale, easing back down slowly
    c.strokeStyle = "#E8573F"; c.lineWidth = 2; c.beginPath(); const n = 900; for (let i = 0; i < n; i++) { const x = i / n * W, y = Hh / 2 - (d[st + i] || 0) / SY.pk * Hh * .42; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    SY.raf = requestAnimationFrame(syScope);
  }
  const syFmt = (k, v) => { const sp = SYK.find(x => x[0] === k); return (k === "cut" ? Math.round(v) : +(+v).toFixed(sp[4] < .01 ? 3 : sp[4] < 1 ? 2 : 0)) + sp[5]; };
  function syKnobs() {
    return SYK.map(([k, l, mn, mx, st]) => k === "sy" ? `<label class="sl">${l}<select id="syWave">${["sine", "triangle", "square", "sawtooth"].map(w => `<option value="${w}"${SY.wave === w ? " selected" : ""}>${w}</option>`).join("")}</select></label><label class="sl"><span><input type="checkbox" id="syOsc2"${SY.osc2 ? " checked" : ""}> Oscillator 2 (a second, detuned copy)</span></label>`
      : `<label class="sl">${l}<input type="range" data-syk="${k}" min="${mn}" max="${mx}" step="${st}" value="${SY[k]}"><output data-syo="${k}">${syFmt(k, SY[k])}</output></label>`).join("");
  }
  function syKeys() {
    const base = 48 + 12 * SY.oct; let w = "", b = "", wi = 0;
    for (let i = 0; i <= 24; i++) { const m = base + i, pc = m % 12, blk = [1, 3, 6, 8, 10].includes(pc), kc = KEYMAP[i] ? ` (key ${KEYMAP[i].toUpperCase()})` : "";
      const btn = `<button type="button" class="sykey ${blk ? "blk" : "wht"}" data-sykey="${m}" aria-label="${NS[pc]} ${Math.floor(m / 12) - 1}${kc}" ${blk ? `style="left:calc(${wi} * (100% / 15) - (100% / 15) * .3)"` : ""}>${!blk && pc === 0 ? `<span>C${Math.floor(m / 12) - 1}</span>` : ""}</button>`;
      if (blk) b += btn; else { w += btn; wi++; } }
    return `<div class="sykb" role="group" aria-label="Keyboard: press keys to play">${w}${b}</div>`;
  }
  function synthToy() {
    return `<div class="toy" id="syToy">
      <div class="toy-row" role="group" aria-label="Presets">${Object.keys(SYP).map(n => `<button class="play" data-sypre="${n}">${n}</button>`).join("")}</div>
      <canvas id="syScope" width="560" height="110" aria-hidden="true" style="width:100%;max-width:560px;height:auto;display:block;margin:0 auto;background:var(--fi-paper, #fbf6ec);border-radius:10px"></canvas>
      <p class="msinfo" id="syNote" aria-live="polite" style="margin:0;text-align:center">Play a key: the note, its MIDI number and its frequency appear here.</p>
      <div class="toy-row"><button class="play" data-syoct="-1" aria-label="Octave down">◀ octave</button><span id="syOctL" class="msinfo">C${3 + SY.oct}–C${5 + SY.oct}</span><button class="play" data-syoct="1" aria-label="Octave up">octave ▶</button></div>
      <div id="syKb">${syKeys()}</div>
      <p class="small" style="margin:0">Click or touch the keys (hold for a long note), or select a key and type on your computer keyboard: A W S E D F T G Y H U J K… play the white and black keys from C.</p>
      <div class="toy-row"><button class="play" id="syMidi" aria-pressed="false">Use a MIDI keyboard</button><span class="small" id="syMidiS" aria-live="polite" style="flex:1;min-width:200px">Plug in a USB or Bluetooth MIDI keyboard, then press this (Chrome, Edge, Firefox or Opera).</span></div>
      <div class="sygrid" id="syKnobs">${syKnobs()}</div></div>`;
  }
  if (!window.__syWired) { window.__syWired = true;
    const down = new Set();
    document.addEventListener("pointerdown", e => { const k = e.target.closest("[data-sykey]"); if (!k) return; e.preventDefault(); k.setPointerCapture && k.releasePointerCapture && k.releasePointerCapture(e.pointerId); syOn(+k.dataset.sykey); down.add(+k.dataset.sykey); });
    document.addEventListener("pointerover", e => { const k = e.target.closest("[data-sykey]"); if (k && e.buttons) { syOn(+k.dataset.sykey); down.add(+k.dataset.sykey); } });
    document.addEventListener("pointerout", e => { const k = e.target.closest("[data-sykey]"); if (k && down.has(+k.dataset.sykey)) { syOff(+k.dataset.sykey); down.delete(+k.dataset.sykey); } });
    const upAll = () => { down.forEach(m => syOff(m)); down.clear(); };
    document.addEventListener("pointerup", upAll); document.addEventListener("pointercancel", upAll);
    document.addEventListener("keydown", e => {
      const toy = document.getElementById("syToy"); if (!toy || !toy.contains(document.activeElement) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.activeElement.matches("select")) return;
      const kb = document.activeElement.closest("[data-sykey]");
      if (kb && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); if (!e.repeat) { const m = +kb.dataset.sykey; syOn(m); setTimeout(() => syOff(m), 450); } return; }
      const i = KEYMAP.indexOf(e.key.toLowerCase()); if (i < 0) return;
      e.preventDefault(); if (e.repeat) return; syOn(48 + 12 * SY.oct + i); });
    document.addEventListener("keyup", e => { const i = KEYMAP.indexOf(e.key.toLowerCase()); if (i >= 0) syOff(48 + 12 * SY.oct + i); });
    document.addEventListener("input", e => { const k = e.target.dataset && e.target.dataset.syk; if (!k) return; SY[k] = +e.target.value; const o = document.querySelector(`[data-syo="${k}"]`); if (o) o.textContent = syFmt(k, SY[k]); if (k === "vol" && SY.out) SY.out.gain.setTargetAtTime(SY.vol * .5, AC.currentTime, .02);
      if (k === "cut" || k === "q") Object.values(SY.voices).forEach(v => { if (k === "q") v.lp.Q.setTargetAtTime(SY.q, AC.currentTime, .02); else { v.lp.frequency.cancelScheduledValues(AC.currentTime); v.lp.frequency.setTargetAtTime(SY.cut, AC.currentTime, .02); } }); });
    document.addEventListener("change", e => { if (e.target.id === "syWave") SY.wave = e.target.value; if (e.target.id === "syOsc2") SY.osc2 = e.target.checked; });
    document.addEventListener("click", e => {
      const pr = e.target.closest("[data-sypre]"); if (pr) { Object.assign(SY, SYP[pr.dataset.sypre]); document.getElementById("syKnobs").innerHTML = syKnobs(); const m = SY.last || 60; if (ac()) { syOn(m); setTimeout(() => syOff(m), 700); } return; }
      const oc = e.target.closest("[data-syoct]"); if (oc) { syAllOff(); SY.oct = Math.max(-2, Math.min(2, SY.oct + +oc.dataset.syoct)); document.getElementById("syKb").innerHTML = syKeys(); document.getElementById("syOctL").textContent = `C${3 + SY.oct}–C${5 + SY.oct}`; } });
    setInterval(() => { if (!document.getElementById("syToy") && Object.keys(SY.voices).length) syAllOff(); }, 400);
    // external MIDI keyboard (Web MIDI): note on/off with velocity, sustain pedal (CC 64); plays only while the synth is on screen
    const MI = { acc: null, held: new Set(), ped: false, pedHeld: new Set() };
    const miStatus = () => { const s = document.getElementById("syMidiS"), b = document.getElementById("syMidi"); if (!s || !MI.acc) return; const ins = [...MI.acc.inputs.values()].filter(i => i.state !== "disconnected");
      s.textContent = ins.length ? `Listening to ${ins.map(i => i.name || "MIDI input").join(", ")}. Play any key.` : "No MIDI keyboard found yet: plug one in (it's picked up automatically)."; if (b) b.setAttribute("aria-pressed", String(!!ins.length)); };
    const miMsg = e => {
      if (!document.getElementById("syToy")) return; const [st, d1, d2] = e.data, cmd = st & 0xf0;
      if (cmd === 0x90 && d2 > 0) { MI.pedHeld.delete(d1); if (SY.voices[d1]) syOff(d1); syOn(d1, .25 + .75 * d2 / 127); MI.held.add(d1); }
      else if (cmd === 0x80 || (cmd === 0x90 && d2 === 0)) { MI.held.delete(d1); if (MI.ped) MI.pedHeld.add(d1); else syOff(d1); }
      else if (cmd === 0xb0 && d1 === 64) { MI.ped = d2 >= 64; if (!MI.ped) { MI.pedHeld.forEach(m => { if (!MI.held.has(m)) syOff(m); }); MI.pedHeld.clear(); } }
      else if (cmd === 0xb0 && (d1 === 123 || d1 === 120)) syAllOff();
    };
    const miWire = () => { MI.acc.inputs.forEach(i => { i.onmidimessage = miMsg; }); miStatus(); };
    document.addEventListener("click", e => {
      if (!e.target.closest("#syMidi")) return; const s = document.getElementById("syMidiS");
      if (!navigator.requestMIDIAccess) { s.textContent = "This browser can't use MIDI keyboards (Safari can't). Try Chrome, Edge, Firefox or Opera."; return; }
      if (MI.acc) { miWire(); return; }
      ac(); s.textContent = "Asking the browser for MIDI access…";
      navigator.requestMIDIAccess().then(acc => { MI.acc = acc; acc.onstatechange = miWire; miWire(); }, () => { s.textContent = "MIDI access was blocked. Allow MIDI for this site in the browser's settings, then try again."; });
    });
  }

  // ---------- tuning game: remove the beats ----------
  const TI = { uni: ["Unison", 1, 1], oct: ["Octave", 2, 1], p5: ["Perfect 5th", 3, 2], m3: ["Major 3rd", 5, 4] };   // [name, p, q]: upper ≈ lower × p/q; partial q of the upper meets partial p of the lower
  const TU = { iv: "p5", f1: 220, v: 50, c0: 50, span: 70, on: false, oscs: null, g: null, done: false, raf: 0, ph: 0, last: 0 };
  const tuF2 = () => { const [, p, q] = TI[TU.iv]; return TU.f1 * p / q * Math.pow(2, (TU.v - TU.c0) / 100 * TU.span / 1200); };
  const tuCents = () => (TU.v - TU.c0) / 100 * TU.span;
  const tuBeats = () => { const [, p, q] = TI[TU.iv]; return Math.abs(q * tuF2() - p * TU.f1); };
  const tuWord = b => b < .25 ? "no beats you can hear: in tune!" : b < 1 ? "very slow beats: almost there" : b < 3 ? "slow beats: close" : b < 8 ? "beating clearly: getting closer" : "fast beats or roughness: far off";
  function tuNew() { TU.c0 = 18 + Math.random() * 64; TU.v = Math.random() < .5 ? Math.max(0, TU.c0 - 25 - Math.random() * 15) : Math.min(100, TU.c0 + 25 + Math.random() * 15); if (Math.abs(TU.v - TU.c0) < 20) TU.v = TU.c0 > 50 ? 0 : 100; TU.done = false; }
  tuNew();
  function tuToy() {
    return `<div class="toy" id="tuToy">
      <div class="toy-row" role="group" aria-label="Interval to tune">${Object.entries(TI).map(([k, [n]]) => `<button class="play" data-tuiv="${k}" aria-pressed="${TU.iv === k}">${n}</button>`).join("")}</div>
      <canvas id="tuCan" width="560" height="120" aria-hidden="true" style="width:100%;max-width:560px;height:auto;display:block;margin:0 auto;background:var(--fi-paper, #fbf6ec);border-radius:10px"></canvas>
      <div class="tumeter" aria-hidden="true"><span>far</span><div class="tubar"><i id="tuFill"></i></div><span>in tune</span></div>
      <label class="toy-row" for="tuX" style="font-weight:700;gap:10px">Upper note<input type="range" id="tuX" min="0" max="100" step=".1" value="${TU.v}" style="flex:1;min-width:160px" aria-valuetext="${tuWord(tuBeats())}"></label>
      <div class="toy-row"><button class="play" id="tuPlay" aria-pressed="false"><span aria-hidden="true">▶ </span>Play both notes</button><button class="play" data-tunudge="-1" aria-label="Lower the upper note a little">◀ lower</button><button class="play" data-tunudge="1" aria-label="Raise the upper note a little">higher ▶</button><button class="play" id="tuNew">New puzzle</button><span class="msinfo" id="tuInfo" aria-live="polite">Press Play, then move the slider until the beats disappear.</span></div>
      <p class="small" style="margin:0">The lower note stays at 220 Hz. Each note has overtones, so even the 5th and 3rd beat when they're slightly off: listen for a wobble in the sound and make it slow down until it stops. The wave above shows the loudness swelling and fading at the beat rate; the bar fills as you get closer. For fine tuning, use the ◀ lower and higher ▶ buttons or the arrow keys.</p></div>`;
  }
  function tuDraw(now) {
    const cv = document.getElementById("tuCan"); if (!cv) { cancelAnimationFrame(TU.raf); TU.raf = 0; return; }
    const c = cv.getContext("2d"), W = cv.width, Hh = cv.height, b = tuBeats(), dt = TU.last ? (now - TU.last) / 1000 : 0; TU.last = now;
    if (TU.on) TU.ph += dt * Math.min(b, 30);
    const err = Math.abs(tuCents()), close = Math.max(0, 1 - err / 30), col = `hsl(${Math.round(8 + close * 112)} 70% ${40 - close * 8}%)`;
    c.clearRect(0, 0, W, Hh); c.lineWidth = 2;
    // envelope: |cos| at the beat rate over a 2-second window (fast beats drawn as a dense blur)
    c.beginPath(); for (let x = 0; x <= W; x += 2) { const t = x / W * 2, a = !TU.on ? .5 : b < .25 ? .95 : Math.abs(Math.cos(Math.PI * (Math.min(b, 30) * t + TU.ph))); const y = Hh / 2 - a * (Hh / 2 - 10); x ? c.lineTo(x, y) : c.moveTo(x, y); }
    for (let x = W; x >= 0; x -= 2) { const t = x / W * 2, a = !TU.on ? .5 : b < .25 ? .95 : Math.abs(Math.cos(Math.PI * (Math.min(b, 30) * t + TU.ph))); c.lineTo(x, Hh / 2 + a * (Hh / 2 - 10)); }
    c.closePath(); c.fillStyle = col; c.globalAlpha = .35; c.fill(); c.globalAlpha = 1; c.strokeStyle = col; c.stroke();
    const lbl = TU.on ? (b < .25 ? "steady: no beats" : `about ${b < 10 ? b.toFixed(1) : Math.round(b)} beats per second`) : "press Play to hear it"; c.font = "bold 14px sans-serif"; c.fillStyle = "rgba(251,246,236,.92)"; c.fillRect(4, 3, c.measureText(lbl).width + 14, 22); c.fillStyle = "#222"; c.fillText(TU.on ? (b < .25 ? "steady: no beats" : `about ${b < 10 ? b.toFixed(1) : Math.round(b)} beats per second`) : "press Play to hear it", 10, 18);
    const fill = document.getElementById("tuFill"); if (fill) { fill.style.width = (close * 100).toFixed(1) + "%"; fill.style.background = col; }
    TU.raf = requestAnimationFrame(tuDraw);
  }
  function tuStop() { if (!TU.oscs) return; const t = AC.currentTime; TU.g.gain.cancelScheduledValues(t); TU.g.gain.setTargetAtTime(0, t, .05); TU.oscs.forEach(o => o.stop(t + .4)); TU.oscs = null; TU.on = false; const b = document.getElementById("tuPlay"); if (b) { b.setAttribute("aria-pressed", "false"); b.innerHTML = '<span aria-hidden="true">▶ </span>Play both notes'; } }
  function tuStart() {
    if (!ac()) return; fresh(); const t = AC.currentTime + .03, g = AC.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.16, t + .1); g.connect(bus);
    TU.g = g; TU.oscs = [];
    [0, 1].forEach(w => { for (let h = 1; h <= 6; h++) { const o = AC.createOscillator(), og = AC.createGain(); o.frequency.value = (w ? tuF2() : TU.f1) * h; og.gain.value = .5 / h; o.connect(og); og.connect(g); o.start(t); o._w = w; o._h = h; TU.oscs.push(o); } });
    TU.on = true; const b = document.getElementById("tuPlay"); b.setAttribute("aria-pressed", "true"); b.innerHTML = '<span aria-hidden="true">■ </span>Stop';
  }
  function tuUpdate() {
    const x = document.getElementById("tuX"), b = tuBeats();
    if (x) x.setAttribute("aria-valuetext", tuWord(b));
    if (TU.oscs) TU.oscs.forEach(o => { if (o._w) o.frequency.setTargetAtTime(tuF2() * o._h, AC.currentTime, .02); });
    const info = document.getElementById("tuInfo");
    if (b < .25 && !TU.done) { TU.done = true; if (info) info.innerHTML = `<b>In tune!</b> The beats are gone: you were ${Math.abs(tuCents()) < .1 ? "exactly on" : "within " + Math.max(.1, Math.abs(tuCents())).toFixed(1) + " cents of"} a pure ${TI[TU.iv][0].toLowerCase()} (${TI[TU.iv][1]}:${TI[TU.iv][2]}). Try another interval or a new puzzle.`; if (window.SFX) setTimeout(() => SFX.play(true), 150); }
    else if (b >= .25) { if (TU.done) TU.done = false; if (info) info.textContent = tuWord(b)[0].toUpperCase() + tuWord(b).slice(1) + "."; }
  }
  if (!window.__tuWired) { window.__tuWired = true;
    document.addEventListener("input", e => { if (e.target.id === "tuX") { TU.v = +e.target.value; tuUpdate(); } });
    document.addEventListener("click", e => {
      const nd = e.target.closest("[data-tunudge]"); if (nd) { TU.v = Math.max(0, Math.min(100, TU.v + .3 * +nd.dataset.tunudge)); const x = document.getElementById("tuX"); x.value = TU.v; tuUpdate(); return; }
      if (e.target.closest("#tuPlay")) { TU.oscs ? tuStop() : tuStart(); if (!TU.raf) TU.raf = requestAnimationFrame(tuDraw); return; }
      const iv = e.target.closest("[data-tuiv]"), nw = e.target.closest("#tuNew");
      if (iv || nw) { if (iv) { TU.iv = iv.dataset.tuiv; document.querySelectorAll("[data-tuiv]").forEach(x => x.setAttribute("aria-pressed", x === iv)); } tuNew(); const x = document.getElementById("tuX"); x.value = TU.v; if (TU.oscs) TU.oscs.forEach(o => o.frequency.setTargetAtTime((o._w ? tuF2() : TU.f1) * o._h, AC.currentTime, .02)); document.getElementById("tuInfo").textContent = `${TI[TU.iv][0]}: move the slider until the beats disappear.`; tuUpdate(); TU.done = false; return; }
      if (e.target.closest("[data-px]")) tuStop(); });
    setInterval(() => { if (!document.getElementById("tuToy")) { if (TU.oscs) tuStop(); } else if (!TU.raf) TU.raf = requestAnimationFrame(tuDraw); }, 300);
  }
  const btn = (label, attrs) => `<button class="play" ${Object.entries(attrs).map(([k, v]) => `data-${k}="${v}"`).join(" ")}><span aria-hidden="true">▶ </span>${label}</button>`;
  const stopBtn = `<button class="play" data-px="stop"><span aria-hidden="true">■ </span>Stop</button>`;
  const row = (...b) => `<div class="lbtns">${b.join("")}</div>`;

  // ---------- facts ----------
  const FACTS = [
    ["Two tones at 440 Hz and 444 Hz produce how many beats per second?", "4", ["2", "8", "440"], "The beat rate is the difference between the frequencies."],
    ["The chorus effect imitates…", "many slightly out-of-tune, out-of-time copies of a sound, as in a choir", ["an echo", "distortion", "a single pure tone"], "It mixes the sound with copies through short, slowly changing delays."],
    ["A Shepard tone seems to rise forever because…", "its octave components fade out at the top as new ones fade in at the bottom", ["it really rises forever", "it gets louder", "it speeds up"], "Pitch class circles round while pitch height stays ambiguous."],
    ["The tritone paradox, discovered by Diana Deutsch, shows that…", "listeners disagree about whether a tritone between Shepard tones rises or falls", ["tritones are always heard rising", "nobody can hear tritones", "tritones are consonant"], "The heard direction depends on the notes and on the listener."],
    ["Pitch is mainly how we hear a sound's…", "frequency (vibrations per second)", ["loudness", "duration", "timbre"], "More vibrations per second → a higher pitch."],
    ["Frequency is measured in…", "hertz (Hz): cycles per second", ["decibels", "cents", "beats per minute"], "Loudness is measured in decibels; cents measure small pitch differences."],
    ["The usual tuning standard today is…", "A4 = 440 Hz", ["C4 = 440 Hz", "A4 = 432 Hz", "A4 = 415 Hz"], "Some orchestras tune a little higher (442–443 Hz); Baroque ensembles often use A = 415 Hz."],
    ["The range of human hearing is roughly…", "20 Hz to 20,000 Hz", ["200 Hz to 2,000 Hz", "1 Hz to 1,000 Hz", "50 Hz to 100,000 Hz"], "The upper limit drops with age and noise exposure."],
    ["Going up an octave…", "doubles the frequency", ["adds 12 Hz", "adds 100 Hz", "halves the frequency"], "A3 = 220, A4 = 440, A5 = 880."],
    ["Two tones in the frequency ratio 3:2 make…", "a perfect 5th", ["an octave", "a major 3rd", "a perfect 4th"], "For example 200 Hz and 300 Hz."],
    ["In equal temperament, each semitone multiplies the frequency by…", "the 12th root of 2 (about 1.0595)", ["1.5", "2", "1.1"], "Twelve equal semitones make exactly one octave (×2)."],
    ["A cent is…", "a hundredth of an equal-tempered semitone", ["a tenth of a hertz", "a hundredth of an octave", "one vibration"], "1200 cents = one octave."],
    ["Overtones (harmonics) are…", "the higher frequencies that sound along with the fundamental", ["echoes", "the loudest note in a chord", "notes played by other instruments"], "Most musical tones contain partials at 2, 3, 4… times the fundamental."],
    ["What mostly makes a flute and a violin sound different on the same note?", "the different strengths of their overtones (and how the sound starts and changes)", ["their frequency", "their loudness", "their key"], "This tone color is called timbre."],
    ["The 2nd partial of the harmonic series is…", "an octave above the fundamental", ["a 5th above", "a major 3rd above", "the same pitch"], "Partial 1 is the fundamental; partial 2 = ×2."],
    ["Which partial is the first to sound a major 3rd (two octaves up)?", "the 5th", ["the 3rd", "the 4th", "the 7th"], "On C2: C2 C3 G3 C4 E4 — E4 is the 5th partial."],
    ["Absolute (perfect) pitch is…", "the ability to name or sing a pitch without a reference note", ["singing perfectly in tune", "hearing very high frequencies", "naming intervals"], "It's rare, and more common in people who began musical training very young."],
    ["Relative pitch is…", "hearing pitches by their relationships (intervals, scale degrees)", ["naming notes with no reference", "tuning by machine", "hearing only octaves"], "It's what most musicians use, and it can be trained at any age."],
    ["Many people without absolute pitch still…", "remember familiar recordings close to their original key", ["can't remember any pitches", "hear all music a 5th low", "need a tuning fork to sing"], "Long-term pitch memory is common, even when note names are not."],
    ["The voice makes pitch with…", "the vocal folds vibrating in the larynx", ["the tongue", "the lungs vibrating", "the teeth"], "Air from the lungs sets the folds vibrating; tension and length set the pitch."],
    ["Vowels (ah, ee, oo) differ because…", "the throat and mouth shape boost different overtone regions (formants)", ["they have different fundamental frequencies", "of the vocal folds' length", "of breath pressure"], "You can sing different vowels on the same pitch."],
    ["A string's pitch rises when it is…", "shorter, tighter or lighter", ["longer", "looser", "heavier"], "Stopping a string on a fingerboard shortens it."],
    ["On wind instruments, the pitch is mostly set by…", "the length of the vibrating air column", ["the size of the bell", "the player's lung size", "the instrument's color"], "Holes and valves change the effective length; overblowing jumps to higher partials."],
    ["Bells, drums and bars usually have…", "inharmonic overtones (not whole-number multiples)", ["no overtones", "only the fundamental", "exactly the harmonic series"], "That's why many percussion sounds have an unclear pitch."],
    ["A sine wave has…", "no overtones: just the fundamental", ["only odd overtones", "all overtones", "random overtones"], "Square waves have odd harmonics; sawtooth waves have all harmonics."],
    ["Subtractive synthesis starts with a rich waveform and…", "filters out some of its overtones", ["adds sine waves one by one", "records a real instrument", "adds reverb"], "Additive synthesis builds a tone from sine waves instead."],
    ["MIDI note number 69 is…", "A4 (440 Hz)", ["middle C", "A0", "C5"], "Middle C (C4) is MIDI note 60."],
    ["Pulses (clicks) repeating faster than about 20 per second are heard as…", "a pitch", ["a slower rhythm", "silence", "a chord"], "Below that we hear separate events: rhythm. Above it they fuse into a tone."],
    ["Two pulse streams in the ratio 3:2 (like a three-against-two polyrhythm), sped up into the audible range, sound…", "a perfect 5th", ["an octave", "a major 3rd", "a unison"], "The ratio of the rhythms becomes the ratio of the frequencies."],
    ["Two tones a few hertz apart (440 and 443 Hz) produce…", "beats: a wavering loudness 3 times a second", ["a perfect 5th", "a new octave", "silence"], "Tuners and players use beats to tune unisons and octaves."],
  ];

  // ---------- drills ----------
  const PAIRS = [["2/1", "P8"], ["3/2", "P5"], ["4/3", "P4"], ["5/4", "M3"], ["6/5", "m3"], ["5/3", "M6"], ["8/5", "m6"], ["9/8", "M2"], ["3/1", "P12 (octave + 5th)"]];
  const INT_NAME = { P8: "octave", P5: "perfect 5th", P4: "perfect 4th", M3: "major 3rd", m3: "minor 3rd", M6: "major 6th", m6: "minor 6th", M2: "major 2nd", "P12 (octave + 5th)": "octave + 5th (12th)" };
  const SERIES = ["C2", "C3", "G3", "C4", "E4", "G4", "B♭4 (flat)", "C5", "D5", "E5", "F♯5 (flat)", "G5", "A5 (flat)", "B♭5 (flat)", "B5", "C6"];
  const SER_INT = { 2: "an octave", 3: "an octave and a 5th", 4: "two octaves", 5: "two octaves and a major 3rd", 6: "two octaves and a 5th", 8: "three octaves" };
  function make(mode, H) {
    if (mode === "freq") {
      const r = Math.random();
      if (r < .35) { const n = H.rnd([-2, -1, 1, 2]), base = H.rnd(n < 0 ? [220, 440, 880] : [55, 110, 220]), f = base * Math.pow(2, n), name = { 55: "A1", 110: "A2", 220: "A3", 440: "A4", 880: "A5" }[base];
        return H.mc(`${name} is ${base} Hz. What is the frequency ${Math.abs(n) === 1 ? "an octave" : "two octaves"} ${n > 0 ? "higher" : "lower"}?`, `${f} Hz`, [f * 2, f / 2, base + 12 * n, base + 100 * n, f * 1.5].map(x => `${+x.toFixed(2)} Hz`), `Each octave ${n > 0 ? "doubles" : "halves"} the frequency: ${base} → ${f} Hz.`, { fig: row(btn(`${base} Hz`, { px: "tone", f: base }), btn(`${f} Hz`, { px: "tone", f })) }); }
      if (r < .7) { const [rt, iv] = H.rnd(PAIRS.slice(0, 8)), [a, b] = rt.split("/").map(Number), base = H.rnd([100, 110, 120, 150, 200]), fl = base * b, fh = base * a;
        return H.mc(`Two tones sound at ${fl} Hz and ${fh} Hz. What interval do they make?`, INT_NAME[iv], PAIRS.slice(0, 8).map(p => INT_NAME[p[1]]), `${fh} : ${fl} = ${a} : ${b}, the ratio of ${RAT[rt]}.`, { fig: row(btn("Hear them", { px: "pair", hz: `${fl} ${fh}` })) }); }
      const f = H.rnd([220, 261.63, 300, 330, 440]), [rt, iv] = H.rnd(PAIRS.slice(0, 5)), [a, b] = rt.split("/").map(Number), ans = +(f * a / b).toFixed(1);
      return H.mc(`What frequency is a pure (just) ${INT_NAME[iv]} above ${f} Hz?`, `${ans} Hz`, [f * 2, f * 1.5, f * 4 / 3, f * 1.25, f * 1.2, f + 100].map(x => `${+x.toFixed(1)} Hz`), `${INT_NAME[iv]} = ${a}:${b}, so ${f} × ${a}/${b} = ${ans} Hz.`);
    }
    if (mode === "series") {
      const n = 2 + Math.floor(Math.random() * 7), r = Math.random();
      if (r < .55) return H.mc(`In the harmonic series on C2, what is partial ${n}?`, SERIES[n - 1], SERIES.slice(1, 10).filter((_, i) => i + 2 !== n), `Partials 1–10 on C2: ${SERIES.slice(0, 10).join(", ")}. Partial n vibrates n times as fast as the fundamental.`, { fig: row(btn(`Partials 1–${n}`, { px: "series", f: 65.41, n })) });
      if (r < .8) { const f = H.rnd([55, 100, 110, 200]), ans = f * n; return H.mc(`A string's fundamental is ${f} Hz. What is the frequency of its ${n}${["", "st", "nd", "rd"][n] || "th"} partial?`, `${ans} Hz`, [f * (n - 1), f * (n + 1), f + n, f * n * 2].map(x => `${x} Hz`), `Partial ${n} = ${n} × ${f} = ${ans} Hz.`); }
      const k = H.rnd(Object.keys(SER_INT)); return H.mc(`How far above the fundamental is partial ${k}?`, SER_INT[k], Object.values(SER_INT), `Partial ${k} is ${k} times the fundamental's frequency.`);
    }
    if (mode === "pulse") {
      const [rt, iv] = H.rnd(PAIRS.slice(0, 7)), [a, b] = rt.split("/").map(Number);
      if (Math.random() < .5) return H.mc(`Listen to the two pulse streams: ${a} pulses against ${b}. Then hear them sped up until they become tones. What interval do they make?`, INT_NAME[iv], PAIRS.slice(0, 7).map(p => INT_NAME[p[1]]), `${a} against ${b} is the ratio ${a}:${b}: ${RAT[rt]}. Speeding up a polyrhythm doesn't change the ratio, only whether we hear it as rhythm or pitch.`,
        { fig: row(btn(`Slow (${a} against ${b})`, { px: "polyslow", r: rt, lo: b === 1 ? 1.5 : 1.2 }), btn("Speed up", { px: "poly", r: rt, lo: 1.2, hi: 140, s: 9 }), stopBtn) });
      const lo = H.rnd([100, 120, 150, 200]), hi = lo * a / b;
      return H.mc(`One stream of clicks repeats ${lo} times a second; another repeats ${hi} times a second. What interval do you hear?`, INT_NAME[iv], PAIRS.slice(0, 7).map(p => INT_NAME[p[1]]), `${hi} : ${lo} = ${a} : ${b}: ${RAT[rt]}.`, { fig: row(btn("Hear the clicks", { px: "polyfast", r: rt, hi: lo }), stopBtn) });
    }
    const [q, a, w, y] = H.rnd(FACTS);
    return H.mc(q, a, w, y);
  }

  function reference(H) {
    return `<ul><li><b>Frequency</b> (Hz) = vibrations per second; higher frequency → higher pitch. A4 = 440 Hz; hearing spans about 20–20,000 Hz.</li>
      <li><b>Octave</b> = ×2. <b>Just intervals:</b> 3:2 P5, 4:3 P4, 5:4 M3, 6:5 m3, 5:3 M6, 8:5 m6, 9:8 M2. <b>Equal temperament:</b> semitone = ×1.0595 (100 cents).</li>
      <li><b>Harmonic series</b> on C2: ${SERIES.slice(0, 10).join(", ")}…</li>
      <li><b>Absolute pitch:</b> naming a pitch without a reference. <b>Relative pitch:</b> hearing relationships; trainable.</li>
      <li><b>Voice:</b> vocal folds set the pitch; the vocal tract's formants shape vowels. <b>Strings:</b> shorter, tighter, lighter = higher. <b>Winds:</b> air-column length. <b>Percussion:</b> often inharmonic overtones.</li>
      <li><b>Synthesis:</b> sine (no overtones), triangle and square (odd harmonics), sawtooth (all harmonics); additive, subtractive, FM, sampling. MIDI 69 = A4, 60 = C4.</li>
      <li><b>Pulses → pitch:</b> above about 20 per second, clicks fuse into a tone; a polyrhythm's ratio becomes an interval.</li></ul>`;
  }

  const seriesSpec = { type: "score", clefs: ["treble", "bass"], time: null, vf: "C", sig: {}, final: false, minBar: 420, bars: [{ t: [[{ k: [], d: "q", ghost: true }, { k: [], d: "q", ghost: true }, { k: [], d: "q", ghost: true }, { k: ["C4"], d: "q", ly: "4" }, { k: ["E4"], d: "q", ly: "5" }, { k: ["G4"], d: "q", ly: "6" }, { k: ["B♭4"], d: "q", ly: "7 (flat)" }, { k: ["C5"], d: "q", ly: "8" }, { k: ["D5"], d: "q", ly: "9" }, { k: ["E5"], d: "q", ly: "10" }]], b: [[{ k: ["C2"], d: "q", ly: "1" }, { k: ["C3"], d: "q", ly: "2" }, { k: ["G3"], d: "q", ly: "3" }, { k: [], d: "q", ghost: true }, { k: [], d: "q", ghost: true }, { k: [], d: "q", ghost: true }, { k: [], d: "q", ghost: true }, { k: [], d: "q", ghost: true }, { k: [], d: "q", ghost: true }, { k: [], d: "q", ghost: true }]] }] };

  const lesson = { steps: [
    { title: "What is pitch?", kick: "Vibration and frequency", render: () => `<p>Every sound is a <b>vibration</b>: a string, a column of air, the vocal folds or a loudspeaker cone moves back and forth and pushes the air into waves of higher and lower pressure. When the vibration repeats regularly, we hear a <b>pitch</b>.</p>
      <p>The number of vibrations per second is the <b>frequency</b>, measured in <b>hertz</b> (Hz). More vibrations per second sound higher. People hear roughly from 20 Hz (a deep rumble) to 20,000 Hz (a faint hiss), though the top of that range drops with age. A piano runs from about 27.5 Hz to 4,186 Hz.</p>
      <p>Today most musicians tune to <b>A4 = 440 Hz</b> (the A above middle C). That's a convention, not a law of nature: many orchestras tune to 442 or 443 Hz, and Baroque ensembles often use A = 415 Hz, about a semitone lower.</p>
      ${row(btn("110 Hz", { px: "tone", f: 110 }), btn("220 Hz", { px: "tone", f: 220 }), btn("440 Hz", { px: "tone", f: 440 }), btn("880 Hz", { px: "tone", f: 880 }), btn("1760 Hz", { px: "tone", f: 1760, a: .12 }))}
      <p class="lnote">Each button is twice the frequency of the one before. Turn your volume down before you start.</p>
      <h3>Choose your own pitches</h3>
      <div class="pcbox">
        <p class="pcstep"><span class="pcn">1</span> <b>Set up to three tones.</b> Tick the ones you want to hear.</p>
        <div class="pcgrid">${[1, 2, 3].map((n, i) => `<label class="pcf"><input type="checkbox" id="pcOn${n}" ${i < 2 ? "checked" : ""}> Tone ${n}</label><label class="pcf pchz"><input type="number" id="pcF${n}" min="10" max="22000" step="0.01" value="${[440, 660, 550][i]}" aria-label="Tone ${n} frequency in hertz"> Hz</label>`).join("")}
          <label class="pcf" for="pcW">Wave</label><select id="pcW"><option>sine</option><option>triangle</option><option>square</option><option>sawtooth</option></select></div>
        <p class="pcstep"><span class="pcn">2</span> <b>Listen.</b></p>
        ${row(btn("Play together", { px: "custom" }), btn("Play one by one", { px: "custom", seq: 1 }), stopBtn)}
        <p class="pcstep"><span class="pcn">3</span> <b>Or start from an example.</b> Each button fills in the tones above and plays them.</p>
        <div class="lbtns">${[["A major triad on A3 (just)", "220,275,330"], ["Beating unison: 440 and 442", "440,442"], ["Out-of-tune 5th: 200 and 302", "200,302"], ["Baroque, modern and orchestral A", "415,440,442"], ["Lowest piano note (27.5 Hz)", "27.5"], ["Highest piano note (4186 Hz)", "4186"], ["The “mosquito tone” (17,400 Hz)", "17400"], ["Hearing check: 8, 12 and 15 kHz", "8000,12000,15000"]].map(([l, v]) => `<button class="play" data-pcs="${v}">${l}</button>`).join("")}</div>
        <div class="pcpanel"><label class="pcf">Or build a triad on <input type="number" id="pcBase" min="20" max="5000" step="0.01" value="220" aria-label="Lowest note of the triad in hertz"> Hz:</label><select id="pcQ" aria-label="Kind of triad">${["major (just 4:5:6)", "minor (just 10:12:15)", "major (equal-tempered)", "minor (equal-tempered)", "diminished", "augmented"].map(q => `<option>${q}</option>`).join("")}</select><button class="play" id="pcTri" type="button"><span aria-hidden="true">▶ </span>Fill in and play</button></div>
      </div>
      <p class="lnote">The <b>mosquito tone</b> (around 17 kHz) is easy for most children and teenagers to hear, but most adults lose hearing that high with age, a change called presbycusis. Keep the volume low when trying very high or very low tones, and stop if anything is uncomfortable. Laptop and phone speakers may not reproduce the lowest tones at all.</p>` },
    { title: "Octaves, ratios and cents", kick: "Pitch is multiplication", render: () => `<p>We hear pitch <b>proportionally</b>. Doubling a frequency always sounds an <b>octave</b> higher, whether you go from 110 to 220 Hz or from 1000 to 2000 Hz. So 110 Hz → 220 Hz sounds as big a step as 440 Hz → 880 Hz, even though the second gap is four times as many hertz.</p>
      <p>Other simple ratios make the other consonant intervals:</p>
      <div class="ltable-wrap"><table class="ltable"><caption>Simple ratios</caption><thead><tr><th scope="col">Ratio</th><th scope="col">Interval</th><th scope="col">Example</th><th scope="col">Hear it</th></tr></thead><tbody>
      ${[["2 : 1", "octave", "200 → 400 Hz", "200 400"], ["3 : 2", "perfect 5th", "200 → 300 Hz", "200 300"], ["4 : 3", "perfect 4th", "300 → 400 Hz", "300 400"], ["5 : 4", "major 3rd", "200 → 250 Hz", "200 250"], ["6 : 5", "minor 3rd", "250 → 300 Hz", "250 300"]].map(([r, i, e, fs]) => `<tr><td>${r}</td><td>${i}</td><td>${e}</td><td>${btn(i, { px: "pair", hz: fs })}</td></tr>`).join("")}</tbody></table></div>
      <p>Pianos and most fixed-pitch instruments use <b>equal temperament</b>: the octave is split into 12 equal semitones, each multiplying the frequency by the 12th root of 2 (about 1.0595). Equal-tempered 5ths and 3rds are a little off the simple ratios, so every key sounds equally (slightly) impure. Small pitch differences are measured in <b>cents</b>: 100 cents to an equal-tempered semitone, 1200 to the octave.</p>
      ${etFig()}
      ${row(btn("Pure major 3rd: 200 + 250 Hz", { px: "hpair", hz: "200 250" }), btn("Equal-tempered major 3rd: 200 + 252 Hz", { px: "hpair", hz: "200 251.98" }))}` },
    { title: "Beats and the chorus effect", kick: "Almost in tune", render: () => `<p>When two tones are <b>almost</b> the same frequency, their waves drift in and out of step. When the peaks line up they reinforce each other; half a cycle later they cancel. You hear the loudness pulse: <b>beats</b>. The number of beats per second equals the <b>difference</b> between the two frequencies.</p>
      ${wavesFig()}
      ${row(btn("440 + 440 Hz (no beats)", { px: "beats", f: 440, df: 0 }), btn("440 + 441 (1 per second)", { px: "beats", f: 440, df: 1 }), btn("440 + 443 (3 per second)", { px: "beats", f: 440, df: 3 }), btn("440 + 447 (7 per second)", { px: "beats", f: 440, df: 7 }))}
      <p>Musicians use beats to tune: slow beats mean nearly in tune, and the beats vanish when the pitches match. Beats also appear between <b>overtones</b>: in a slightly mistuned 5th (200 and 302 Hz), the 3rd partial of the lower note (600) and the 2nd partial of the upper (604) beat 4 times a second. That is why piano tuners and string players can tune 5ths, 4ths and octaves so precisely by ear, and why equal-tempered 3rds and 5ths beat slightly on a piano.</p>
      ${partialFig()}
      ${row(btn("Pure 5th: 200 + 300 Hz", { px: "hpair", hz: "200 300" }), btn("Mistuned 5th: 200 + 302 Hz (beats)", { px: "hpair", hz: "200 302" }))}
      <h3>Try it: tune by ear</h3>
      <p>Tuners and string players tune by making the beats go away. Pick an interval, press Play, and slide the upper note until the sound stops wobbling.</p>
      ${tuToy()}
      <h3>The chorus effect</h3>
      <p>Slow, gentle beating between slightly different copies of the same sound is what makes a choir or a string section sound rich: no two singers or players are ever exactly in tune or in time. The audio <b>chorus effect</b> imitates this: it mixes a sound with copies passed through very short delays whose length slowly wobbles, so each copy is a tiny bit sharp, then flat, then late, then early. Instead of one steady beat you hear a shimmering, widened sound.</p>
      ${row(btn("Plain tone", { px: "chorus", f: 220, mode: "dry" }), btn("Two copies detuned slightly (steady beating)", { px: "chorus", f: 220, mode: "detune" }), btn("Chorus effect (wobbling copies)", { px: "chorus", f: 220, mode: "chorus" }))}` },
    { title: "Overtones", kick: "The harmonic series", render: (H, k, U) => `<p>A string or air column doesn't vibrate at just one frequency. It vibrates as a whole, and also in halves, thirds, quarters and so on, all at once. The whole-length vibration gives the <b>fundamental</b>; the others give <b>overtones</b> (also called harmonics or upper partials) at 2, 3, 4, 5… times the fundamental's frequency. Together they form the <b>harmonic series</b>.</p>
      ${overtoneFig(H)}
      ${row(btn("Play partials 1–10 one by one", { px: "series", f: 65.41, n: 10 }), btn("Add them up into one tone", { px: "build", f: 65.41, n: 10 }))}
      <p>We don't usually hear the overtones separately: they fuse into one pitch, the fundamental. But their balance decides the <b>tone color</b> (timbre). A flute's tone has weak upper partials; an oboe's or a trumpet's has strong ones; a clarinet's low notes are strong in the odd-numbered partials. The harmonic series also explains why octaves, 5ths and 4ths sound so stable: their notes share many overtones.</p>` },
    { title: "From rhythm to pitch", kick: "Pulses, polyrhythms and intervals", render: () => `<p>Pitch and rhythm are the same thing at different speeds. A click repeated 4 times a second is a rhythm. Speed it up past about <b>20 per second</b> and the clicks fuse: you hear a buzzy tone whose pitch is the click rate.</p>
      ${row(btn("4 per second", { px: "rate", r: 4 }), btn("10", { px: "rate", r: 10 }), btn("20", { px: "rate", r: 20 }), btn("40", { px: "rate", r: 40 }), btn("110", { px: "rate", r: 110 }), btn("220", { px: "rate", r: 220 }), stopBtn)}
      ${row(btn("Sweep from 2 to 400 per second", { px: "sweep" }), stopBtn)}
      <p>Try the sweep and listen for the moment the rhythm turns into a pitch.</p>
      <h3>Polyrhythms become intervals</h3>
      <p>Now take <b>two</b> pulse streams in a simple ratio, such as 3 clicks against 2 (a 3-against-2 polyrhythm). Speed both up together, keeping the ratio. When they cross into the pitch range, the rhythm turns into an <b>interval</b>: 3 : 2 becomes a perfect 5th, 2 : 1 an octave, 5 : 4 a major 3rd.</p>
      <p><b>Game:</b> press a slow button and tap along with the polyrhythm. Then predict the interval before you press <b>Speed up</b>.</p>
      <div class="ltable-wrap"><table class="ltable"><caption>Pulse ratios</caption><thead><tr><th scope="col">Ratio</th><th scope="col">Slow</th><th scope="col">Speed up</th><th scope="col">Becomes</th></tr></thead><tbody>
      ${[["2/1", "2 against 1"], ["3/2", "3 against 2"], ["4/3", "4 against 3"], ["5/4", "5 against 4"], ["6/5", "6 against 5"]].map(([r, l]) => `<tr><td>${l}</td><td>${btn("Slow", { px: "polyslow", r, lo: 1.2 })}</td><td>${btn("Speed up", { px: "poly", r, lo: 1.2, hi: 140, s: 9 })}</td><td><details class="ldet"><summary>Reveal</summary>${RAT[r]}</details></td></tr>`).join("")}</tbody></table></div>
      ${row(btn("Out of tune: 3.03 against 2", { px: "poly", r: "303/200", lo: 1.2, hi: 140, s: 9 }), stopBtn)}
      <p class="lnote">In the out-of-tune version the slow rhythm drifts out of alignment; sped up, that drift becomes beating in a slightly sour 5th. The same arithmetic links rhythm and tuning.</p>` },
    { title: "Shepard tones and the tritone paradox", kick: "Endlessly rising; up or down?", render: () => `<p>In 1964 the psychologist <b>Roger Shepard</b> built a tone that seems to rise forever. Each <b>Shepard tone</b> is a stack of sine waves an octave apart, with the loudest ones in the middle of the range and the highest and lowest fading to silence. Step the whole stack up a semitone at a time: the top octaves fade out while new ones fade in at the bottom, so after twelve steps you are back where you started, yet every step sounds higher.</p>
      ${row(btn("Shepard scale: endlessly rising", { px: "shep", mode: "up" }), btn("Endlessly falling", { px: "shep", mode: "down" }), stopBtn)}
      <p>The composer and physicist <b>Jean-Claude Risset</b> extended the idea into a continuous glide, the <b>Shepard–Risset glissando</b>, and applied the same trick to tempo: a rhythm that seems to <b>accelerate forever</b> (Risset's rhythm, sometimes called the endless accelerando). Pulse layers at tempos an octave apart (each twice as fast as the last) all speed up together; the fastest layer fades out as a new slow one fades in.</p>
      ${row(btn("Shepard–Risset glissando (30 s)", { px: "shep", mode: "gliss" }), btn("Risset's endless accelerando (30 s)", { px: "shep", mode: "rhythm" }), stopBtn)}
      <p class="lnote">The illusion works because pitch has two dimensions: <b>pitch class</b> (which note: C, D, E…) circles round, while <b>pitch height</b> (how high) is kept ambiguous by the fading octaves. Film and game composers use the same trick to build endless tension.</p>
      <h3>The tritone paradox</h3>
      <p>Play two Shepard tones a <b>tritone</b> apart (half an octave, such as C then F♯). Because each tone is an ambiguous stack of octaves, the second is exactly as far "up" as "down" from the first. Yet most people hear a clear direction, and the psychologist <b>Diana Deutsch</b> discovered in 1986 that the direction depends on <b>which</b> notes are played, and differs between listeners. People who grew up with different speech patterns (for example, in different regions or countries) tend to hear the pairs differently.</p>
      <p>Listen to each pair and note whether it seems to go up or down:</p>
      <div class="lbtns">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(pc => btn(["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"][pc] + " → " + ["F♯", "G", "A♭", "A", "B♭", "B", "C", "C♯", "D", "E♭", "E", "F"][pc], { px: "shep", mode: "pair", pc })).join("")}</div>
      <p>Most listeners hear some pairs rising and others falling, with a turning point somewhere around the circle of pitch classes. Compare your answers with a classmate's: you may find your turning points are in different places.</p>` },
    { title: "Absolute and relative pitch", kick: "Naming notes, hearing relationships", render: () => `<p><b>Absolute pitch</b> (often called perfect pitch) is the ability to name a note, or sing a named note, with no reference tone. It's rare: a figure often quoted is about 1 person in 10,000 in Western countries. It's much more common among musicians who began training in early childhood, and some studies find it more often among speakers of tone languages such as Mandarin or Cantonese, where pitch distinguishes words.</p>
      <p>Absolute pitch is a <b>labeling</b> skill. People with it hear an A as "A" the way most people see red as "red". It doesn't mean singing perfectly in tune, and it can be a nuisance with transposing instruments or music tuned to A = 415 Hz.</p>
      <div class="lvideo"><iframe src="https://www.youtube-nocookie.com/embed/t3Cb1qwCUvI" title="Video about absolute pitch (YouTube)" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>
      <p>Most people have more <b>pitch memory</b> than they think. Studies have found that people without absolute pitch, asked to sing a favorite recording from memory, often start within a semitone or two of the original key, and can tell when a familiar recording has been shifted in pitch. They remember the pitch; they just don't have names for it.</p>
      <h3>Relative pitch</h3>
      <p><b>Relative pitch</b> is hearing notes by their relationships: the interval between two notes, or a note's place in the key (its scale degree). It's what lets you recognize a tune whatever key it's in, sing in harmony, and take melodic dictation. Almost every musician relies on it, and unlike absolute pitch, it improves with practice at any age.</p>
      <p>Movable-do solfège, scale-degree numbers and interval singing are all ways of training relative pitch. The <b>Ear Training</b> app on this site practices them: sing-backs, intervals, scale degrees and dictation.</p>` },
    { title: "How voices and instruments make pitch", kick: "Sources and resonators", render: () => `<p>Every acoustic instrument has a <b>vibrating source</b> and something that sets its frequency.</p>
      <ul><li><b>The voice:</b> air from the lungs sets the <b>vocal folds</b> in the larynx vibrating. Stretching and thinning the folds raises the pitch. Typical speaking pitches are around 100–125 Hz for adult men and 200–220 Hz for adult women. The throat, mouth and nose then act as a <b>resonator</b>: their shape boosts certain overtone regions, called <b>formants</b>, which is how we make different vowels on the same pitch.</li>
      <li><b>Strings</b> (violin, guitar, piano, harp): a string's pitch rises when it's <b>shorter, tighter or lighter</b>. Players shorten strings with their fingers; tuning pegs set the tension; low strings are thicker or wound with wire. The body or soundboard amplifies the vibration.</li>
      <li><b>Winds and brass:</b> a vibrating <b>column of air</b> sets the pitch; its length is changed with holes, keys, valves or a slide. Air is set moving by an air jet (flute), a reed (clarinet, oboe, saxophone, bassoon) or the player's buzzing lips (brass). <b>Overblowing</b> jumps to higher partials of the same tube, which is how brass players get many notes from one valve setting.</li>
      <li><b>Percussion:</b> bars, plates, membranes and bells vibrate in complex patterns whose overtones usually aren't whole-number multiples (<b>inharmonic</b>). That's why many drums and cymbals have no clear pitch, and why xylophone and marimba bars are carved underneath to tune their overtones.</li>
      <li><b>Electronic instruments:</b> an oscillator produces the vibration as an electrical signal, and a loudspeaker turns it into sound.</li></ul>` },
    { title: "Synthesizing pitch", kick: "Oscillators and filters", render: () => `<p>A synthesizer builds sound from <b>oscillators</b>. Its pitch is simply the oscillator's frequency; its tone color depends on the waveform and what is done to it next.</p>
      ${row(btn("Sine", { px: "wave", w: "sine", f: 220 }), btn("Triangle", { px: "wave", w: "triangle", f: 220 }), btn("Square", { px: "wave", w: "square", f: 220 }), btn("Sawtooth", { px: "wave", w: "sawtooth", f: 220 }))}
      <ul><li><b>Sine:</b> a pure tone with no overtones. <b>Triangle</b> and <b>square:</b> odd-numbered harmonics only (weak in the triangle, strong in the square), a hollow, clarinet-like color. <b>Sawtooth:</b> all harmonics, bright and buzzy, like brass or bowed strings.</li>
      <li><b>Subtractive synthesis</b> starts with a rich wave and removes overtones with a <b>filter</b>; sweeping the filter is the classic synth "wah". ${btn("Filter sweep on a sawtooth", { px: "filter", f: 110 })}</li>
      <li><b>Additive synthesis</b> builds a tone from sine waves, as in the Overtones step. <b>FM synthesis</b> makes one oscillator wobble another's frequency very fast, giving bell-like and electric-piano sounds. <b>Sampling</b> plays back recordings, re-pitched for each note. <b>Wavetable</b> synthesis moves through a series of stored waveforms.</li>
      <li>Digital instruments name pitches with <b>MIDI note numbers</b>: 60 = middle C, 69 = A4 = 440 Hz, one number per semitone. Frequency = 440 × 2<sup>(n − 69)/12</sup>.</li></ul>
      <h3>Try it: a mini synthesizer</h3>
      <p>Pick a preset or start from scratch. Try a sawtooth with the filter cutoff low, then raise it; add resonance for a "wah"; give it a slow attack for a pad or zero sustain for a pluck. The scope shows the waveform you're hearing.</p>
      ${synthToy()}
      <ul class="small"><li><b>Oscillators</b> make the raw wave; a second, slightly detuned oscillator beats against the first for a thicker, chorused sound.</li><li>The <b>filter</b> removes overtones above the cutoff; <b>resonance</b> boosts the overtones right at the cutoff. <b>Envelope → filter</b> opens the filter at the start of each note and lets it close as the note decays.</li><li>The <b>envelope</b> (attack, decay, sustain, release) shapes loudness over the life of a note. <b>Vibrato</b> is a slow wobble in pitch from a low-frequency oscillator (LFO).</li></ul>` },
    { title: "Quick check", kick: "Before the drills", render: (H) => [0, 4, 8, 12, 17, 28].map(i => H.check(FACTS[i][0], FACTS[i][1], FACTS[i][2], FACTS[i][3])).join("") },
  ] };

  return {
    key: "silverapps-pitch-v1", lesson, make, reference,
    modes: [{ id: "freq", kicker: "Frequency and ratios" }, { id: "series", kicker: "The harmonic series" }, { id: "pulse", kicker: "Pulses into pitch" }, { id: "facts", kicker: "How pitch works" }],
    topics: [],
  };
})();
