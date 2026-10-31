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
    if (k === "pair") { const [x, y] = b.dataset.hz.split(" ").map(Number); tone(x, 1.2); tone(y, 1.2, "sine", .2, 1.3); tone(x, 2, "sine", .14, 2.7); tone(y, 2, "sine", .14, 2.7); }
    if (k === "series") { const n = +b.dataset.n; for (let h = 1; h <= n; h++) tone(f * h, 1.1, "sine", .22 / Math.sqrt(h), (h - 1) * .55); }
    if (k === "build") { const n = +b.dataset.n; for (let h = 1; h <= n; h++) tone(f * h, 5.2 - (h - 1) * .45, "sine", .2 / h, (h - 1) * .45); }
    if (k === "rate") pulses([[+b.dataset.r, +b.dataset.r]], 0, 2.2);
    if (k === "sweep") pulses([[2, 400]], 9, 2);
    if (k === "poly") { const r = frac(b.dataset.r), lo = +b.dataset.lo || 2, hi = +b.dataset.hi || 165; pulses([[lo, hi, .26], [lo * r, hi * r, .26]], +b.dataset.s || 10, 3); }
    if (k === "polyfast") { const r = frac(b.dataset.r), hi = +b.dataset.hi || 165; pulses([[hi, hi, .26], [hi * r, hi * r, .26]], 0, 2.5); }
    if (k === "polyslow") { const r = frac(b.dataset.r), lo = +b.dataset.lo || 2; pulses([[lo, lo, .3], [lo * r, lo * r, .3]], 0, 4.5); }
    if (k === "wave") tone(f, 1.6, b.dataset.w, b.dataset.w === "sine" ? .22 : b.dataset.w === "triangle" ? .2 : .08);
    if (k === "filter") { const o = AC.createOscillator(), lp = AC.createBiquadFilter(), g = AC.createGain(), t0 = AC.currentTime + .05; o.type = "sawtooth"; o.frequency.value = f; lp.type = "lowpass"; lp.Q.value = 6; lp.frequency.setValueAtTime(150, t0); lp.frequency.exponentialRampToValueAtTime(6000, t0 + 2.5); lp.frequency.exponentialRampToValueAtTime(150, t0 + 5); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.12, t0 + .05); g.gain.setValueAtTime(.12, t0 + 4.8); g.gain.linearRampToValueAtTime(0, t0 + 5.1); o.connect(lp); lp.connect(g); g.connect(bus); o.start(t0); o.stop(t0 + 5.2); }
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
    const b = e.target.closest("[data-pcs]"); if (b) { setF(b.dataset.pcs.split(",").map(Number).map(v => v || null)); return; }
    if (e.target.closest("#pcTri")) { const base = +document.getElementById("pcBase").value || 220, r = TRI[document.getElementById("pcQ").value]; setF(r.map(x => base * x)); } }); }
  if (!window.__pxWired) { window.__pxWired = true; document.addEventListener("click", e => { const b = e.target.closest("[data-px]"); if (b) px(b); }); }
  const btn = (label, attrs) => `<button class="play" ${Object.entries(attrs).map(([k, v]) => `data-${k}="${v}"`).join(" ")}><span aria-hidden="true">▶ </span>${label}</button>`;
  const stopBtn = `<button class="play" data-px="stop"><span aria-hidden="true">■ </span>Stop</button>`;
  const row = (...b) => `<div class="lbtns">${b.join("")}</div>`;

  // ---------- facts ----------
  const FACTS = [
    ["Two tones at 440 Hz and 444 Hz produce how many beats per second?", "4", ["2", "8", "440"], "The beat rate is the difference between the frequencies."],
    ["The critical bandwidth is…", "the frequency range within which two tones interact (beats, roughness) instead of sounding separate", ["the range of human hearing", "the width of a filter in a synthesizer", "the distance between two octaves"], "In the middle register it is roughly a minor 3rd wide."],
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
      <div class="pcpanel">${[1, 2, 3].map((n, i) => `<label class="pcf"><input type="checkbox" id="pcOn${n}" ${i < 2 ? "checked" : ""} aria-label="Use tone ${n}"> Tone ${n} <input type="number" id="pcF${n}" min="10" max="22000" step="0.01" value="${[440, 660, 550][i]}" aria-label="Tone ${n} frequency in hertz"> Hz</label>`).join("")}
        <label class="pcf">Wave <select id="pcW"><option>sine</option><option>triangle</option><option>square</option><option>sawtooth</option></select></label></div>
      ${row(btn("Play together", { px: "custom" }), btn("Play one by one", { px: "custom", seq: 1 }), stopBtn)}
      <div class="pcpanel"><label class="pcf">Triad above <input type="number" id="pcBase" min="20" max="5000" step="0.01" value="220" aria-label="Lowest note of the triad in hertz"> Hz</label><label class="pcf"><select id="pcQ" aria-label="Kind of triad">${["major (just 4:5:6)", "minor (just 10:12:15)", "major (equal-tempered)", "minor (equal-tempered)", "diminished", "augmented"].map(q => `<option>${q}</option>`).join("")}</select></label><button class="play" id="pcTri" type="button">Fill in the triad</button></div>
      <p class="lnote">Try these:</p>
      <div class="lbtns">${[["A major triad on A3 (just)", "220,275,330"], ["Beating unison: 440 and 442", "440,442"], ["Out-of-tune 5th: 200 and 302", "200,302"], ["Baroque, modern and orchestral A", "415,440,442"], ["Lowest piano note (27.5 Hz)", "27.5"], ["Highest piano note (4186 Hz)", "4186"], ["The “mosquito tone” (17,400 Hz)", "17400"], ["Hearing check: 8, 12 and 15 kHz", "8000,12000,15000"]].map(([l, v]) => `<button class="play" data-pcs="${v}">${l}</button>`).join("")}</div>
      <p class="lnote">The <b>mosquito tone</b> (around 17 kHz) is easy for most children and teenagers to hear, but most adults lose hearing that high with age, a change called presbycusis. Keep the volume low when trying very high or very low tones, and stop if anything is uncomfortable. Laptop and phone speakers may not reproduce the lowest tones at all.</p>` },
    { title: "Octaves, ratios and cents", kick: "Pitch is multiplication", render: () => `<p>We hear pitch <b>proportionally</b>. Doubling a frequency always sounds an <b>octave</b> higher, whether you go from 110 to 220 Hz or from 1000 to 2000 Hz. So 110 Hz → 220 Hz sounds as big a step as 440 Hz → 880 Hz, even though the second gap is four times as many hertz.</p>
      <p>Other simple ratios make the other consonant intervals:</p>
      <div class="ltable-wrap"><table class="ltable"><caption>Simple ratios</caption><thead><tr><th scope="col">Ratio</th><th scope="col">Interval</th><th scope="col">Example</th><th scope="col">Hear it</th></tr></thead><tbody>
      ${[["2 : 1", "octave", "200 → 400 Hz", "200 400"], ["3 : 2", "perfect 5th", "200 → 300 Hz", "200 300"], ["4 : 3", "perfect 4th", "300 → 400 Hz", "300 400"], ["5 : 4", "major 3rd", "200 → 250 Hz", "200 250"], ["6 : 5", "minor 3rd", "250 → 300 Hz", "250 300"]].map(([r, i, e, fs]) => `<tr><td>${r}</td><td>${i}</td><td>${e}</td><td>${btn(i, { px: "pair", hz: fs })}</td></tr>`).join("")}</tbody></table></div>
      <p>Pianos and most fixed-pitch instruments use <b>equal temperament</b>: the octave is split into 12 equal semitones, each multiplying the frequency by the 12th root of 2 (about 1.0595). Equal-tempered 5ths and 3rds are a little off the simple ratios, so every key sounds equally (slightly) impure. Small pitch differences are measured in <b>cents</b>: 100 cents to an equal-tempered semitone, 1200 to the octave.</p>
      <p>When two tones are nearly but not quite the same, you hear <b>beats</b>: the loudness wavers at the difference between their frequencies. Musicians tune by listening for beats to slow down and disappear.</p>
      ${row(btn("440 + 441 Hz (1 beat per second)", { px: "beats", f: 440, df: 1 }), btn("440 + 444 Hz (4 beats per second)", { px: "beats", f: 440, df: 4 }))}` },
    { title: "Beats and the chorus effect", kick: "Almost in tune", render: () => `<p>When two tones are <b>almost</b> the same frequency, their waves drift in and out of step. When the peaks line up they reinforce each other; half a cycle later they cancel. You hear the loudness pulse: <b>beats</b>. The number of beats per second equals the <b>difference</b> between the two frequencies.</p>
      ${row(btn("440 + 440 Hz (no beats)", { px: "beats", f: 440, df: 0 }), btn("440 + 441 (1 per second)", { px: "beats", f: 440, df: 1 }), btn("440 + 443 (3 per second)", { px: "beats", f: 440, df: 3 }), btn("440 + 447 (7 per second)", { px: "beats", f: 440, df: 7 }))}
      <p>Musicians use beats to tune: slow beats mean nearly in tune, and the beats vanish when the pitches match. Beats also appear between <b>overtones</b>: in a slightly mistuned 5th (200 and 302 Hz), the 3rd partial of the lower note (600) and the 2nd partial of the upper (604) beat 4 times a second. That is why piano tuners and string players can tune 5ths, 4ths and octaves so precisely by ear, and why equal-tempered 3rds and 5ths beat slightly on a piano.</p>
      <h3>The chorus effect</h3>
      <p>Slow, gentle beating between slightly different copies of the same sound is what makes a choir or a string section sound rich: no two singers or players are ever exactly in tune or in time. The audio <b>chorus effect</b> imitates this: it mixes a sound with copies passed through very short delays whose length slowly wobbles, so each copy is a tiny bit sharp, then flat, then late, then early. Instead of one steady beat you hear a shimmering, widened sound.</p>
      ${row(btn("Plain tone", { px: "chorus", f: 220, mode: "dry" }), btn("Two copies detuned slightly (steady beating)", { px: "chorus", f: 220, mode: "detune" }), btn("Chorus effect (wobbling copies)", { px: "chorus", f: 220, mode: "chorus" }))}` },
    { title: "Critical bandwidth", kick: "Fused or separate?", render: () => `<p>As two tones move apart, the way we hear them changes:</p>
      <ol><li><b>Very close</b> (a few hertz apart): one tone, beating slowly.</li>
      <li><b>Further apart</b> (beating faster than about 15–20 per second): the beats blur into <b>roughness</b>, a buzzy, grating quality.</li>
      <li><b>Further still</b>: two separate, smooth tones.</li></ol>
      <p>The boundary is the <b>critical bandwidth</b>: the range of frequencies that the inner ear's basilar membrane cannot fully separate. Two tones inside one critical band interact (beats, roughness); outside it, they are heard as separate pitches. In the middle of the musical range the critical band is roughly a minor 3rd wide (about 15–20% of the frequency); in the low register it is much wider (around 100 Hz). Roughness is strongest when tones are about a quarter of a critical band apart.</p>
      ${row(btn("Glide a second tone away from 440 Hz", { px: "sweep2", f: 440, r: 1.5, t: 14 }), btn("Same, starting low (110 Hz)", { px: "sweep2", f: 110, r: 1.5, t: 14 }), stopBtn)}
      <p>This is one reason chords sound muddy when they are packed closely in the bass: low tones a 3rd apart sit inside one critical band and clash, while the same 3rd high up sounds clear. Composers and arrangers space chords widely at the bottom and more closely at the top, following the harmonic series.</p>` },
    { title: "Overtones", kick: "The harmonic series", render: (H, k, U) => `<p>A string or air column doesn't vibrate at just one frequency. It vibrates as a whole, and also in halves, thirds, quarters and so on, all at once. The whole-length vibration gives the <b>fundamental</b>; the others give <b>overtones</b> (also called harmonics or upper partials) at 2, 3, 4, 5… times the fundamental's frequency. Together they form the <b>harmonic series</b>.</p>
      ${U.fig(seriesSpec, "The harmonic series on C2, partials 1–10. Partial 7 is noticeably flatter than the equal-tempered note.", { play: false })}
      ${row(btn("Play partials 1–10 one by one", { px: "series", f: 65.41, n: 10 }), btn("Add them up into one tone", { px: "build", f: 65.41, n: 10 }))}
      <p>We don't usually hear the overtones separately: they fuse into one pitch, the fundamental. But their balance decides the <b>tone color</b> (timbre). A flute's tone has weak upper partials; an oboe's or a trumpet's has strong ones; a clarinet's low notes are strong in the odd-numbered partials. The harmonic series also explains why octaves, 5ths and 4ths sound so stable: their notes share many overtones.</p>` },
    { title: "From rhythm to pitch", kick: "Speed up a pulse", render: () => `<p>Pitch and rhythm are the same thing at different speeds. A click repeated 4 times a second is a rhythm. Speed it up past about <b>20 per second</b> and the clicks fuse: you hear a buzzy tone whose pitch is the click rate.</p>
      ${row(btn("4 per second", { px: "rate", r: 4 }), btn("10", { px: "rate", r: 10 }), btn("20", { px: "rate", r: 20 }), btn("40", { px: "rate", r: 40 }), btn("110", { px: "rate", r: 110 }), btn("220", { px: "rate", r: 220 }), stopBtn)}
      ${row(btn("Sweep from 2 to 400 per second", { px: "sweep" }), stopBtn)}
      <p>Try the sweep and listen for the moment the rhythm turns into a pitch. Composers and researchers have explored this boundary, and it's the idea behind this step's game.</p>` },
    { title: "Polyrhythms become intervals", kick: "A playful experiment", render: () => `<p>Now take <b>two</b> pulse streams in a simple ratio, such as 3 clicks against 2 (a 3-against-2 polyrhythm). Speed both up together, keeping the ratio. When they cross into the pitch range, the rhythm turns into an <b>interval</b>: 3 : 2 becomes a perfect 5th, 2 : 1 an octave, 5 : 4 a major 3rd.</p>
      <p><b>Game:</b> press a slow button and tap along with the polyrhythm. Then predict the interval before you press <b>Speed up</b>.</p>
      <div class="ltable-wrap"><table class="ltable"><caption>Pulse ratios</caption><thead><tr><th scope="col">Ratio</th><th scope="col">Slow</th><th scope="col">Speed up</th><th scope="col">Becomes</th></tr></thead><tbody>
      ${[["2/1", "2 against 1"], ["3/2", "3 against 2"], ["4/3", "4 against 3"], ["5/4", "5 against 4"], ["6/5", "6 against 5"]].map(([r, l]) => `<tr><td>${l}</td><td>${btn("Slow", { px: "polyslow", r, lo: 1.2 })}</td><td>${btn("Speed up", { px: "poly", r, lo: 1.2, hi: 140, s: 9 })}</td><td><details class="ldet"><summary>Reveal</summary>${RAT[r]}</details></td></tr>`).join("")}</tbody></table></div>
      ${row(btn("Out of tune: 3.03 against 2", { px: "poly", r: "303/200", lo: 1.2, hi: 140, s: 9 }), stopBtn)}
      <p class="lnote">In the out-of-tune version the slow rhythm drifts out of alignment; sped up, that drift becomes beating in a slightly sour 5th. The same arithmetic links rhythm and tuning.</p>` },
    { title: "Shepard tones", kick: "Endlessly rising", render: () => `<p>In 1964 the psychologist <b>Roger Shepard</b> built a tone that seems to rise forever. Each <b>Shepard tone</b> is a stack of sine waves an octave apart, with the loudest ones in the middle of the range and the highest and lowest fading to silence. Step the whole stack up a semitone at a time: the top octaves fade out while new ones fade in at the bottom, so after twelve steps you are back where you started, yet every step sounds higher.</p>
      ${row(btn("Shepard scale: endlessly rising", { px: "shep", mode: "up" }), btn("Endlessly falling", { px: "shep", mode: "down" }), stopBtn)}
      <p>The composer and physicist <b>Jean-Claude Risset</b> extended the idea into a continuous glide, the <b>Shepard–Risset glissando</b>, and applied the same trick to tempo: a rhythm that seems to <b>accelerate forever</b> (Risset's rhythm, sometimes called the endless accelerando). Pulse layers at tempos an octave apart (each twice as fast as the last) all speed up together; the fastest layer fades out as a new slow one fades in.</p>
      ${row(btn("Shepard–Risset glissando (30 s)", { px: "shep", mode: "gliss" }), btn("Risset's endless accelerando (30 s)", { px: "shep", mode: "rhythm" }), stopBtn)}
      <p class="lnote">The illusion works because pitch has two dimensions: <b>pitch class</b> (which note: C, D, E…) circles round, while <b>pitch height</b> (how high) is kept ambiguous by the fading octaves. Film and game composers use the same trick to build endless tension.</p>` },
    { title: "The tritone paradox", kick: "Up or down?", render: () => `<p>Play two Shepard tones a <b>tritone</b> apart (half an octave, such as C then F♯). Because each tone is an ambiguous stack of octaves, the second is exactly as far "up" as "down" from the first. Yet most people hear a clear direction, and the psychologist <b>Diana Deutsch</b> discovered in 1986 that the direction depends on <b>which</b> notes are played, and differs between listeners. People who grew up with different speech patterns (for example, in different regions or countries) tend to hear the pairs differently.</p>
      <p>Listen to each pair and note whether it seems to go up or down:</p>
      <div class="lbtns">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(pc => btn(["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"][pc] + " → " + ["F♯", "G", "A♭", "A", "B♭", "B", "C", "C♯", "D", "E♭", "E", "F"][pc], { px: "shep", mode: "pair", pc })).join("")}</div>
      <p>Most listeners hear some pairs rising and others falling, with a turning point somewhere around the circle of pitch classes. Compare your answers with a classmate's: you may find your turning points are in different places.</p>` },
    { title: "Absolute pitch and pitch memory", kick: "Naming notes from nowhere", render: () => `<p><b>Absolute pitch</b> (often called perfect pitch) is the ability to name a note, or sing a named note, with no reference tone. It's rare: a figure often quoted is about 1 person in 10,000 in Western countries. It's much more common among musicians who began training in early childhood, and some studies find it more often among speakers of tone languages such as Mandarin or Cantonese, where pitch distinguishes words.</p>
      <p>Absolute pitch is a <b>labeling</b> skill. People with it hear an A as "A" the way most people see red as "red". It doesn't mean singing perfectly in tune, and it can be a nuisance with transposing instruments or music tuned to A = 415 Hz.</p>
      <p>Most people have more <b>pitch memory</b> than they think. Studies have found that people without absolute pitch, asked to sing a favorite recording from memory, often start within a semitone or two of the original key, and can tell when a familiar recording has been shifted in pitch. They remember the pitch; they just don't have names for it.</p>
      <p><b>Try it:</b> hear this A4, then come back tomorrow and hum the A before you play it again.</p>
      ${row(btn("A4 (440 Hz)", { px: "tone", f: 440, d: 2.2 }))}` },
    { title: "Relative pitch", kick: "Hearing relationships", render: () => `<p><b>Relative pitch</b> is hearing notes by their relationships: the interval between two notes, or a note's place in the key (its scale degree). It's what lets you recognize a tune whatever key it's in, sing in harmony, and take melodic dictation. Almost every musician relies on it, and unlike absolute pitch, it improves with practice at any age.</p>
      <p>Movable-do solfège, scale-degree numbers and interval singing are all ways of training relative pitch. The <b>Ear Training</b> app on this site practices them: sing-backs, intervals, scale degrees and dictation.</p>
      ${row(btn("C4 → E4", { px: "pair", hz: "261.63 329.63" }), btn("F4 → A4", { px: "pair", hz: "349.23 440" }))}
      <p class="lnote">Different notes, same relationship: both pairs are major 3rds (frequency ratio about 5 : 4).</p>` },
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
      <li>Digital instruments name pitches with <b>MIDI note numbers</b>: 60 = middle C, 69 = A4 = 440 Hz, one number per semitone. Frequency = 440 × 2<sup>(n − 69)/12</sup>.</li></ul>` },
    { title: "Quick check", kick: "Before the drills", render: (H) => [0, 1, 5, 9, 18, 29].map(i => H.check(FACTS[i][0], FACTS[i][1], FACTS[i][2], FACTS[i][3])).join("") },
  ] };

  return {
    key: "silverapps-pitch-v1", lesson, make, reference,
    modes: [{ id: "freq", kicker: "Frequency and ratios" }, { id: "series", kicker: "The harmonic series" }, { id: "pulse", kicker: "Pulses into pitch" }, { id: "facts", kicker: "How pitch works" }],
    topics: [],
  };
})();
