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
  function px(b) {
    if (!ac()) return; fresh();
    const k = b.dataset.px, f = +b.dataset.f || 220;
    if (k === "tone") tone(f, +b.dataset.d || 1.6, b.dataset.w || "sine", +b.dataset.a || .2);
    if (k === "pair") { const [x, y] = b.dataset.fs.split(" ").map(Number); tone(x, 1.2); tone(y, 1.2, "sine", .2, 1.3); tone(x, 2, "sine", .14, 2.7); tone(y, 2, "sine", .14, 2.7); }
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
    if (k === "stop") { /* fresh() already silenced */ }
  }
  if (!window.__pxWired) { window.__pxWired = true; document.addEventListener("click", e => { const b = e.target.closest("[data-px]"); if (b) px(b); }); }
  const btn = (label, attrs) => `<button class="play" ${Object.entries(attrs).map(([k, v]) => `data-${k}="${v}"`).join(" ")}><span aria-hidden="true">▶ </span>${label}</button>`;
  const stopBtn = `<button class="play" data-px="stop"><span aria-hidden="true">■ </span>Stop</button>`;
  const row = (...b) => `<div class="lbtns">${b.join("")}</div>`;

  // ---------- facts ----------
  const FACTS = [
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
        return H.mc(`Two tones sound at ${fl} Hz and ${fh} Hz. What interval do they make?`, INT_NAME[iv], PAIRS.slice(0, 8).map(p => INT_NAME[p[1]]), `${fh} : ${fl} = ${a} : ${b}, the ratio of ${RAT[rt]}.`, { fig: row(btn("Hear them", { px: "pair", fs: `${fl} ${fh}` })) }); }
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
      <p class="lnote">Each button is twice the frequency of the one before. Turn your volume down before you start.</p>` },
    { title: "Octaves, ratios and cents", kick: "Pitch is multiplication", render: () => `<p>We hear pitch <b>proportionally</b>. Doubling a frequency always sounds an <b>octave</b> higher, whether you go from 110 to 220 Hz or from 1000 to 2000 Hz. So 110 Hz → 220 Hz sounds as big a step as 440 Hz → 880 Hz, even though the second gap is four times as many hertz.</p>
      <p>Other simple ratios make the other consonant intervals:</p>
      <div class="ltable-wrap"><table class="ltable"><caption>Simple ratios</caption><thead><tr><th scope="col">Ratio</th><th scope="col">Interval</th><th scope="col">Example</th><th scope="col">Hear it</th></tr></thead><tbody>
      ${[["2 : 1", "octave", "200 → 400 Hz", "200 400"], ["3 : 2", "perfect 5th", "200 → 300 Hz", "200 300"], ["4 : 3", "perfect 4th", "300 → 400 Hz", "300 400"], ["5 : 4", "major 3rd", "200 → 250 Hz", "200 250"], ["6 : 5", "minor 3rd", "250 → 300 Hz", "250 300"]].map(([r, i, e, fs]) => `<tr><td>${r}</td><td>${i}</td><td>${e}</td><td>${btn(i, { px: "pair", fs })}</td></tr>`).join("")}</tbody></table></div>
      <p>Pianos and most fixed-pitch instruments use <b>equal temperament</b>: the octave is split into 12 equal semitones, each multiplying the frequency by the 12th root of 2 (about 1.0595). Equal-tempered 5ths and 3rds are a little off the simple ratios, so every key sounds equally (slightly) impure. Small pitch differences are measured in <b>cents</b>: 100 cents to an equal-tempered semitone, 1200 to the octave.</p>
      <p>When two tones are nearly but not quite the same, you hear <b>beats</b>: the loudness wavers at the difference between their frequencies. Musicians tune by listening for beats to slow down and disappear.</p>
      ${row(btn("440 + 441 Hz (1 beat per second)", { px: "beats", f: 440, df: 1 }), btn("440 + 444 Hz (4 beats per second)", { px: "beats", f: 440, df: 4 }))}` },
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
    { title: "Absolute pitch and pitch memory", kick: "Naming notes from nowhere", render: () => `<p><b>Absolute pitch</b> (often called perfect pitch) is the ability to name a note, or sing a named note, with no reference tone. It's rare: a figure often quoted is about 1 person in 10,000 in Western countries. It's much more common among musicians who began training in early childhood, and some studies find it more often among speakers of tone languages such as Mandarin or Cantonese, where pitch distinguishes words.</p>
      <p>Absolute pitch is a <b>labeling</b> skill. People with it hear an A as "A" the way most people see red as "red". It doesn't mean singing perfectly in tune, and it can be a nuisance with transposing instruments or music tuned to A = 415 Hz.</p>
      <p>Most people have more <b>pitch memory</b> than they think. Studies have found that people without absolute pitch, asked to sing a favorite recording from memory, often start within a semitone or two of the original key, and can tell when a familiar recording has been shifted in pitch. They remember the pitch; they just don't have names for it.</p>
      <p><b>Try it:</b> hear this A4, then come back tomorrow and hum the A before you play it again.</p>
      ${row(btn("A4 (440 Hz)", { px: "tone", f: 440, d: 2.2 }))}` },
    { title: "Relative pitch", kick: "Hearing relationships", render: () => `<p><b>Relative pitch</b> is hearing notes by their relationships: the interval between two notes, or a note's place in the key (its scale degree). It's what lets you recognize a tune whatever key it's in, sing in harmony, and take melodic dictation. Almost every musician relies on it, and unlike absolute pitch, it improves with practice at any age.</p>
      <p>Movable-do solfège, scale-degree numbers and interval singing are all ways of training relative pitch. The <b>Ear Training</b> app on this site practices them: sing-backs, intervals, scale degrees and dictation.</p>
      ${row(btn("C4 → E4", { px: "pair", fs: "261.63 329.63" }), btn("F4 → A4", { px: "pair", fs: "349.23 440" }))}
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
    { title: "Quick check", kick: "Before the drills", render: (H) => [0, 4, 5, 13, 23, 24].map(i => H.check(FACTS[i][0], FACTS[i][1], FACTS[i][2], FACTS[i][3])).join("") },
  ] };

  return {
    key: "silverapps-pitch-v1", lesson, make, reference,
    modes: [{ id: "freq", kicker: "Frequency and ratios" }, { id: "series", kicker: "The harmonic series" }, { id: "pulse", kicker: "Pulses into pitch" }, { id: "facts", kicker: "How pitch works" }],
    topics: [],
  };
})();
