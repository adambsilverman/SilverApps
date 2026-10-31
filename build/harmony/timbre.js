window.FAM = (() => {
  // ===== Timbre: spectrum, envelope, formants, noise, performance and orchestration. Engine: build/harmony/engine.js =====
  const tbl = (cap, head, rows) => `<div class="ltable-wrap" tabindex="0" role="region" aria-label="${cap}"><table class="ltable"><caption>${cap}</caption><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  // ---------- audio kit ----------
  let AC = null, bus = null, NZ = null;
  function ac() { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; if (!AC) AC = new C(); if (AC.state === "suspended") AC.resume(); return AC; }
  function fresh() { if (bus) { const o = bus; o.gain.setTargetAtTime(0, AC.currentTime, .03); setTimeout(() => o.disconnect(), 400); } bus = AC.createGain(); bus.gain.value = .9; bus.connect(AC.destination); return bus; }
  const noise = () => { if (!NZ) { NZ = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate); const d = NZ.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } return NZ; };
  const pwave = amps => { const re = new Float32Array(amps.length + 1), im = new Float32Array(amps.length + 1); amps.forEach((a, i) => im[i + 1] = a); return AC.createPeriodicWave(re, im, { disableNormalization: false }); };
  // envelope on a gain node: a, d (s), s (0–1), r (s)
  function envG(g, t, dur, A, D, Sus, R, peak) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + A); g.gain.setTargetAtTime(peak * Sus, t + A, Math.max(.001, D / 3)); g.gain.setValueAtTime(g.gain.value, t + dur); g.gain.setTargetAtTime(0, t + Math.max(A, dur), Math.max(.005, R / 4)); return t + Math.max(A, dur) + R + .1; }
  // a note from an amplitude spectrum (partials 1…n) with an envelope
  function specNote(amps, f, t, dur, env = [.02, .2, .85, .15], amp = .22, dest = bus, vib = 0) {
    const o = AC.createOscillator(), g = AC.createGain(); o.setPeriodicWave(pwave(amps)); o.frequency.value = f; o.connect(g); g.connect(dest);
    if (vib) { const l = AC.createOscillator(), lg = AC.createGain(); l.frequency.value = 5.5; lg.gain.value = vib; l.connect(lg); lg.connect(o.detune); l.start(t + .15); l.stop(t + dur + 1); }
    const end = envG(g, t, dur, ...env, amp); o.start(t); o.stop(end); return o;
  }
  const SPEC = {
    sine: [1], triangle: [1, 0, -1 / 9, 0, 1 / 25, 0, -1 / 49, 0, 1 / 81, 0, -1 / 121], square: [1, 0, 1 / 3, 0, 1 / 5, 0, 1 / 7, 0, 1 / 9, 0, 1 / 11, 0, 1 / 13, 0, 1 / 15], sawtooth: Array.from({ length: 24 }, (_, i) => 1 / (i + 1)),
    "flute-like": [1, .25, .08, .03], "clarinet-like": [1, .02, .7, .02, .45, .02, .3, .01, .18, .01, .1], "oboe-like": [.45, .85, 1, .8, .55, .4, .3, .2, .12, .08], "brass-like": [1, .9, .8, .7, .6, .5, .42, .35, .28, .22, .17, .13, .1, .08], "organ (drawbars)": [1, .8, .5, .6, 0, .4, 0, .3], "hollow (odd only)": [1, 0, .6, 0, .4, 0, .25, 0, .15],
  };
  // synthesized instruments (approximations, for comparison only)
  function instr(name, f, t, dur, dest = bus) {
    if (name === "flute") { specNote(SPEC["flute-like"], f, t, dur, [.08, .2, .9, .12], .26, dest, 9); const n = AC.createBufferSource(), bp = AC.createBiquadFilter(), g = AC.createGain(); n.buffer = noise(); bp.type = "bandpass"; bp.frequency.value = f * 2; bp.Q.value = 2; n.connect(bp); bp.connect(g); g.connect(dest); envG(g, t, dur, .05, .2, .5, .1, .05); n.start(t); n.stop(t + dur + .4); }
    if (name === "clarinet") specNote(SPEC["clarinet-like"], f, t, dur, [.04, .2, .9, .08], .22, dest, 0);
    if (name === "oboe") specNote(SPEC["oboe-like"], f, t, dur, [.03, .15, .85, .08], .2, dest, 6);
    if (name === "trumpet") { const o = AC.createOscillator(), lp = AC.createBiquadFilter(), g = AC.createGain(); o.type = "sawtooth"; o.frequency.value = f; lp.type = "lowpass"; lp.frequency.setValueAtTime(f * 1.5, t); lp.frequency.linearRampToValueAtTime(f * 9, t + .07); lp.frequency.setTargetAtTime(f * 6, t + .1, .2); lp.Q.value = 1.5; o.connect(lp); lp.connect(g); g.connect(dest); const e = envG(g, t, dur, .05, .2, .8, .08, .2); o.start(t); o.stop(e); }
    if (name === "violin") { const o = AC.createOscillator(), g = AC.createGain(), mix = AC.createGain(), l = AC.createOscillator(), lg = AC.createGain(); o.type = "sawtooth"; o.frequency.value = f; l.frequency.value = 6; lg.gain.value = 14; l.connect(lg); lg.connect(o.detune); l.start(t + .2); l.stop(t + dur + 1);
      [[280, 4, 1], [1000, 3, .8], [2800, 3, .6], [4500, 3, .25]].forEach(([fq, q, a]) => { const bp = AC.createBiquadFilter(), ga = AC.createGain(); bp.type = "bandpass"; bp.frequency.value = fq; bp.Q.value = q; ga.gain.value = a * 1.6; o.connect(bp); bp.connect(ga); ga.connect(mix); });
      mix.connect(g); g.connect(dest); const e = envG(g, t, dur, .12, .2, .9, .15, .3); o.start(t); o.stop(e); }
    if (name === "plucked") { const o = AC.createOscillator(), lp = AC.createBiquadFilter(), g = AC.createGain(); o.type = "sawtooth"; o.frequency.value = f; lp.type = "lowpass"; lp.frequency.setValueAtTime(f * 12, t); lp.frequency.setTargetAtTime(f * 1.5, t, .15); o.connect(lp); lp.connect(g); g.connect(dest); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.3, t + .003); g.gain.setTargetAtTime(0, t + .003, .45); o.start(t); o.stop(t + 3); }
    if (name === "piano") specNote([1, .5, .3, .2, .12, .08, .05], f, t, dur, [.005, 1.2, 0, .3], .3, dest);
    if (name === "bell") [[.56, 1, 1.4], [.92, .67, 1], [1.19, 1, .7], [1.71, 1.8, .55], [2, 2.7, .5], [2.74, 1.67, .35], [3, 1.46, .3], [3.76, 1.33, .2], [4.07, 1.33, .15]].forEach(([r, a, d]) => { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.value = f * 2 * r; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.07 * a, t + .003); g.gain.setTargetAtTime(0, t + .003, d); o.connect(g); g.connect(dest); o.start(t); o.stop(t + d * 6); });
  }
  const INSTR = { flute: "Flute-like", clarinet: "Clarinet-like", oboe: "Oboe-like", trumpet: "Trumpet-like", violin: "Violin-like", plucked: "Plucked string", piano: "Piano-like", bell: "Bell" };
  const VOW = { a: ["ah (as in “father”)", [730, 1090, 2440]], e: ["eh (as in “bed”)", [530, 1840, 2480]], i: ["ee (as in “see”)", [270, 2290, 3010]], o: ["aw (as in “law”)", [570, 840, 2410]], u: ["oo (as in “boot”)", [300, 870, 2240]] };
  function vowel(v, f, t, dur, dest = bus) {
    const o = AC.createOscillator(), g = AC.createGain(), mix = AC.createGain(), l = AC.createOscillator(), lg = AC.createGain(); o.type = "sawtooth"; o.frequency.value = f; l.frequency.value = 5.3; lg.gain.value = 15; l.connect(lg); lg.connect(o.detune); l.start(t + .25); l.stop(t + dur + 1);
    VOW[v][1].forEach((fq, i) => { const bp = AC.createBiquadFilter(), ga = AC.createGain(); bp.type = "bandpass"; bp.frequency.value = fq; bp.Q.value = fq / (60 + 30 * i); ga.gain.value = [3, 2, 1][i]; o.connect(bp); bp.connect(ga); ga.connect(mix); });
    mix.connect(g); g.connect(dest); const e = envG(g, t, dur, .08, .2, .9, .15, .4); o.start(t); o.stop(e);
  }
  const ENVS = { perc: ["Percussive: instant attack, then it dies away", [.003, .5, 0, .2]], sus: ["Sustained: quick attack, steady level, quick release", [.02, .1, .95, .05]], swell: ["Swell: slow attack, held, slow release", [.9, .2, 1, .8]], rev: ["Reversed: grows slowly, then stops suddenly", [1.4, .1, 1, .01]] };
  function envNote(kind, f, t, dest = bus) { const o = AC.createOscillator(), lp = AC.createBiquadFilter(), g = AC.createGain(); o.type = "sawtooth"; o.frequency.value = f; lp.type = "lowpass"; lp.frequency.value = f * 5; o.connect(lp); lp.connect(g); g.connect(dest); const [A, D, Sus, R] = ENVS[kind][1], e = envG(g, t, kind === "perc" ? .1 : 1.6, A, D, Sus, R, .25); o.start(t); o.stop(e); }
  function brightNote(cut, f, t, dur, dest = bus) { const o = AC.createOscillator(), lp = AC.createBiquadFilter(), g = AC.createGain(); o.type = "sawtooth"; o.frequency.value = f; lp.type = "lowpass"; lp.frequency.value = cut; lp.Q.value = .7; o.connect(lp); lp.connect(g); g.connect(dest); const e = envG(g, t, dur, .02, .2, .9, .1, .25); o.start(t); o.stop(e); }

  // ---------- toys ----------
  const TS = { amps: [1, .5, .33, .25, .2, .17, .14, .12, .11, .1], env: [.02, .3, .7, .3], cut: 1500, f: 220, live: null };
  function play(b) {
    if (!ac()) return; const k = b.dataset.tm, f = +b.dataset.f || 220, t = AC.currentTime + .05; fresh();
    if (k === "wave") specNote(SPEC[b.dataset.w], f, t, 1.4, undefined, .22);
    if (k === "inst") instr(b.dataset.i, f, t, 1.6);
    if (k === "install") Object.keys(INSTR).forEach((n, i) => instr(n, f, t + i * 1.3, 1));
    if (k === "vowel") vowel(b.dataset.v, f, t, 1.4);
    if (k === "vowels") "aeiou".split("").forEach((v, i) => vowel(v, f, t + i * 1.1, .9));
    if (k === "env") envNote(b.dataset.e, f, t);
    if (k === "bright") brightNote(+b.dataset.c, f, t, 1.3);
    if (k === "ab") { brightNote(+b.dataset.a, f, t, 1); brightNote(+b.dataset.b, f, t + 1.4, 1); }
    if (k === "build") { const o = specNote(TS.amps, TS.f, t, 2.5, [.02, .2, .9, .2], .22); TS.live = o; }
    if (k === "adsr") specNote(SPEC.sawtooth.slice(0, 12), TS.f, t, 1.2, TS.env, .2);
    if (k === "sweep") { const o = AC.createOscillator(), lp = AC.createBiquadFilter(), g = AC.createGain(); o.type = "sawtooth"; o.frequency.value = f; lp.type = "lowpass"; lp.frequency.setValueAtTime(150, t); lp.frequency.exponentialRampToValueAtTime(8000, t + 3); lp.frequency.exponentialRampToValueAtTime(150, t + 6); o.connect(lp); lp.connect(g); g.connect(bus); envG(g, t, 6, .05, .1, 1, .2, .25); o.start(t); o.stop(t + 6.5); }
    if (k === "cut") { const n = b.dataset.i; instr(n, f, t, 1.4); const g = AC.createGain(); g.connect(bus); g.gain.setValueAtTime(0, t + 2); g.gain.linearRampToValueAtTime(1, t + 2.35); instr(n, f, t + 2, 1.4, g); }
    if (k === "harm") { specNote([1, .5, .3, .2, .15, .1], f, t, 1.5, undefined, .25); }
    if (k === "inharm") instr("bell", f, t, 1.5);
    if (k === "breath") { const n = AC.createBufferSource(), bp = AC.createBiquadFilter(), g = AC.createGain(); n.buffer = noise(); bp.type = "bandpass"; bp.frequency.value = 1200; bp.Q.value = .8; n.connect(bp); bp.connect(g); g.connect(bus); envG(g, t, 1.2, .2, .2, .8, .3, .4); n.start(t); n.stop(t + 2); }
    if (k === "double") { const a = b.dataset.a.split(","); if (b.dataset.mode === "seq") { instr(a[0], f, t, 1.2); instr(a[1], f, t + 1.5, 1.2); instr(a[0], f, t + 3, 1.2); instr(a[1], f, t + 3, 1.2); } }
    if (k === "kfm") [["flute", 392], ["clarinet", 330], ["oboe", 349], ["violin", 294], ["trumpet", 262], ["plucked", 392], ["bell", 330]].forEach(([n, fr], i) => instr(n, fr, t + i * .55, .5));
    if (k === "stop") { /* fresh() silenced it */ }
  }
  if (!window.__tmWired) { window.__tmWired = true;
    document.addEventListener("click", e => { const b = e.target.closest("[data-tm]"); if (b) play(b); });
    document.addEventListener("input", e => {
      const s = e.target.closest("[data-tp]"); if (s) { TS.amps[+s.dataset.tp] = +s.value; const o = document.querySelector(`[data-tpo="${s.dataset.tp}"]`); if (o) o.textContent = (+s.value).toFixed(2); if (TS.live) try { TS.live.setPeriodicWave(pwave(TS.amps)); } catch (x) {} const sv = document.getElementById("tmSpec"); if (sv) sv.outerHTML = specSVG(TS.amps, "Your spectrum", "tmSpec"); return; }
      const a = e.target.closest("[data-te]"); if (a) { TS.env[+a.dataset.te] = +a.value; const o = document.querySelector(`[data-teo="${a.dataset.te}"]`); if (o) o.textContent = a.value + (a.dataset.te === "2" ? "" : " s"); return; }
    });
    document.addEventListener("change", e => { const p = e.target.closest("#tmPre"); if (!p) return; const v = SPEC[p.value]; if (!v) return; TS.amps = Array.from({ length: 10 }, (_, i) => Math.abs(v[i] || 0)); const w = document.getElementById("tmBuild"); if (w) w.outerHTML = buildToy(); });
  }
  const btn = (label, attrs) => `<button class="play" ${Object.entries(attrs).map(([k, v]) => `data-${k}="${v}"`).join(" ")}><span aria-hidden="true">▶ </span>${label}</button>`;
  const row = (...b) => `<div class="lbtns">${b.join("")}</div>`;
  const stop = `<button class="play" data-tm="stop"><span aria-hidden="true">■ </span>Stop</button>`;
  function specSVG(amps, cap, id) {
    const n = Math.min(16, amps.length), W = 320, Hh = 110, bw = W / 16;
    const bars = Array.from({ length: n }, (_, i) => { const a = Math.min(1, Math.abs(amps[i] || 0)), h = a * 85; return `<rect x="${i * bw + 3}" y="${92 - h}" width="${bw - 6}" height="${h}" rx="2" fill="currentColor"/><text x="${i * bw + bw / 2}" y="106" font-size="9" text-anchor="middle" fill="currentColor">${i + 1}</text>`; }).join("");
    return `<svg ${id ? `id="${id}"` : ""} class="tmspec" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="${cap}: strengths of partials 1 to ${n}: ${Array.from({ length: n }, (_, i) => Math.abs(amps[i] || 0).toFixed(2)).join(", ")}">${bars}<line x1="0" y1="92" x2="${W}" y2="92" stroke="currentColor" stroke-width="1"/></svg>`;
  }
  function waveSVG(type) {
    const pts = []; for (let i = 0; i <= 200; i++) { const x = i / 200 * 2, ph = x % 1; const y = type === "sine" ? Math.sin(2 * Math.PI * x) : type === "square" ? (ph < .5 ? 1 : -1) : type === "sawtooth" ? 1 - 2 * ph : (ph < .25 ? 4 * ph : ph < .75 ? 2 - 4 * ph : 4 * ph - 4); pts.push(`${(i * 1.5).toFixed(1)},${(40 - y * 30).toFixed(1)}`); }
    return `<svg class="tmwave" viewBox="0 0 300 80" aria-hidden="true"><polyline points="${pts.join(" ")}" fill="none" stroke="currentColor" stroke-width="2.5"/><line x1="0" y1="40" x2="300" y2="40" stroke="currentColor" stroke-opacity=".3"/></svg>`;
  }
  const buildToy = () => `<div class="toy" id="tmBuild"><div class="toy-row"><label>Start from <select id="tmPre"><option value="">choose…</option>${Object.keys(SPEC).map(k => `<option>${k}</option>`).join("")}</select></label>${btn("Play (2.5 s)", { tm: "build" })}</div>
    <div class="sygrid">${TS.amps.map((a, i) => `<label class="syk">Partial ${i + 1}<input type="range" min="0" max="1" step=".01" value="${a}" data-tp="${i}"><output data-tpo="${i}">${a.toFixed(2)}</output></label>`).join("")}</div>
    ${specSVG(TS.amps, "Your spectrum", "tmSpec")}<p class="lnote">Move sliders while it plays to hear the color change. The pitch never changes: only the recipe of partials.</p></div>`;
  const adsrToy = () => `<div class="toy"><div class="sygrid">${[["Attack", 0, 0, 2, .005], ["Decay", 1, .01, 2, .01], ["Sustain level", 2, 0, 1, .01], ["Release", 3, .01, 3, .01]].map(([l, i, mn, mx, st]) => `<label class="syk">${l}<input type="range" min="${mn}" max="${mx}" step="${st}" value="${TS.env[i]}" data-te="${i}"><output data-teo="${i}">${TS.env[i]}${i === 2 ? "" : " s"}</output></label>`).join("")}</div>${row(btn("Play the same tone with this envelope", { tm: "adsr" }))}</div>`;

  // ---------- drills ----------
  const FACTS = [
    ["Timbre is…", "the color or quality that makes two sounds of the same pitch and loudness sound different", ["how high or low a sound is", "how loud a sound is", "the speed of the beat"], "Also called tone color. It depends on the spectrum, the envelope, noise and how all of these change over time."],
    ["Two instruments play the same pitch. What mainly differs in their spectra?", "the relative strengths of the partials", ["the frequency of the fundamental", "the number of octaves", "the key"], "Same fundamental, different recipe of overtones."],
    ["A clarinet's low register sounds hollow because its spectrum…", "is strong in odd-numbered partials", ["has only even partials", "has no fundamental", "is pure noise"], "A cylindrical tube closed at one end favors odd harmonics in the low register."],
    ["Removing the first fraction of a second (the attack) from recorded notes…", "makes many instruments hard to identify", ["makes no difference", "raises the pitch", "makes them louder"], "Much of an instrument's identity is in its attack transient."],
    ["Formants are…", "resonant frequency regions that stay fixed while the pitch changes", ["the lowest notes of an instrument", "the notes of a chord", "the beats in a bar"], "Vowels are recognized by their formants; instrument bodies have them too."],
    ["Which sound has inharmonic partials (not whole-number multiples)?", "a bell", ["a flute", "a clarinet", "a violin"], "Bells, gongs and many drums have inharmonic spectra, which is why their pitch can sound ambiguous."],
    ["Playing louder on most acoustic instruments makes the tone…", "brighter: higher partials grow stronger", ["darker", "lower in pitch", "purely sinusoidal"], "Dynamics and timbre are linked; a loud trumpet is brassier than a soft one."],
    ["A sine wave contains…", "only the fundamental", ["all harmonics equally", "only odd harmonics", "only noise"], "It's the simplest, 'purest' tone."],
    ["Which waveform contains all harmonics, getting weaker as they rise (1/n)?", "sawtooth", ["sine", "square", "triangle"], "Square and triangle contain only odd harmonics; triangle's fade much faster."],
    ["Sul ponticello on a string instrument means bowing…", "near the bridge, for a glassy, bright sound", ["over the fingerboard, for a soft sound", "with the wood of the bow", "plucking the string"], "Near the bridge, higher partials are emphasized."],
    ["Klangfarbenmelodie (\"sound-color melody\"), a term Arnold Schoenberg used in 1911, describes…", "a line passed among different instruments, so timbre changes like pitch", ["a melody with no rhythm", "a melody in parallel 5ths", "an instrument's lowest notes"], "Composers such as Anton Webern spread a melody across many instruments, one or a few notes each."],
    ["Doubling a melody in flute and clarinet in unison mostly…", "creates a blended new color", ["makes the melody higher", "creates harmony", "cancels the sound"], "Unison doublings mix spectra into a composite timbre."],
    ["A low-pass filter makes a sound…", "darker, by removing high partials", ["brighter", "higher in pitch", "louder at all frequencies"], "Turning down the cutoff of a low-pass filter is the classic synth 'darkening' move."],
    ["Bright, dark, warm, nasal, breathy and reedy are…", "words musicians use to describe timbre", ["dynamic markings", "tempo markings", "names of chords"], "There's no single scale for timbre, so we rely on descriptive words linked to spectrum and noise."],
  ];
  function make(mode, H) {
    if (mode === "wave") { const w = H.rnd(["sine", "triangle", "square", "sawtooth"]), f = H.rnd([147, 165, 196, 220, 262]);
      return H.mc("Listen. Which waveform is this?", w, ["sine", "triangle", "square", "sawtooth"], { sine: "A sine is pure: just the fundamental, smooth and flute-like.", triangle: "A triangle has weak odd harmonics: soft, a little hollow.", square: "A square has strong odd harmonics: hollow and buzzy, like a clarinet's low register.", sawtooth: "A sawtooth has every harmonic: bright and brassy or string-like." }[w], { kicker: "Listen: waveform", fig: row(btn("Play", { tm: "wave", w, f })) }); }
    if (mode === "env") { const e = H.rnd(Object.keys(ENVS)), f = H.rnd([196, 220, 262]);
      return H.mc("Listen. Which describes this sound's envelope (how its loudness changes)?", ENVS[e][0], Object.values(ENVS).map(x => x[0]), "The tone color is identical each time; only the envelope changes.", { kicker: "Listen: envelope", fig: row(btn("Play", { tm: "env", e, f })) }); }
    if (mode === "vowel") { const v = H.rnd(["a", "i", "u", "o", "e"]), f = H.rnd([110, 131, 147, 165]);
      return H.mc("Listen. Which vowel is this synthetic voice singing?", VOW[v][0], Object.values(VOW).map(x => x[0]), `Its formants are at about ${VOW[v][1].join(", ")} Hz.`, { kicker: "Listen: vowels", fig: row(btn("Play", { tm: "vowel", v, f })) }); }
    if (mode === "inst") { const n = H.rnd(Object.keys(INSTR)), f = n === "bell" ? H.rnd([262, 330]) : n === "trumpet" || n === "violin" ? H.rnd([294, 392, 440]) : H.rnd([220, 262, 330, 392]);
      const why = { flute: "Nearly pure, with breath noise and gentle vibrato.", clarinet: "Strong odd partials: hollow.", oboe: "Partials 2–4 stronger than the fundamental: nasal and reedy.", trumpet: "Many partials, with a brightening attack: brassy.", violin: "A bowed sawtooth through body resonances, with vibrato.", plucked: "Sharp attack, then the high partials die first.", piano: "Struck: fast attack, long decay, no sustain.", bell: "Inharmonic partials with long, uneven decays." }[n];
      return H.mc("Listen. Which synthesized instrument is this?", INSTR[n], Object.values(INSTR), why + " (These are simple synthesized models, not recordings.)", { kicker: "Listen: instruments", fig: row(btn("Play", { tm: "inst", i: n, f })) }); }
    if (mode === "bright") { const lo = H.rnd([500, 700, 900]), hi = lo * H.rnd([4, 6, 8]), aFirst = Math.random() < .5, f = H.rnd([131, 165, 196]);
      const same = Math.random() < .15, a = same ? lo * 2 : aFirst ? hi : lo, b = same ? lo * 2 : aFirst ? lo : hi, ans = same ? "They're the same" : aFirst ? "The first is brighter" : "The second is brighter";
      return H.mc("Listen to two tones. Which is brighter (has stronger high partials)?", ans, ["The first is brighter", "The second is brighter", "They're the same"], "Same pitch and waveform; the low-pass filter cutoff differs: higher cutoff, more high partials, brighter tone.", { kicker: "Listen: brightness", fig: row(btn("Play both", { tm: "ab", a, b, f })), nWrong: 2 }); }
    const [q, a, w, y] = H.rnd(FACTS); return H.mc(q, a, w, y, { kicker: "Concepts" });
  }
  function reference() {
    return tbl("What shapes timbre", ["Ingredient", "What to listen for"], [["Spectrum", "which partials are present and how strong (bright vs dark, hollow, nasal)"], ["Envelope", "attack, decay, sustain, release; the attack transient especially"], ["Formants", "fixed resonances: vowels, instrument bodies"], ["Noise", "breath, bow, hammer, consonants"], ["Change over time", "vibrato, brightening, decay of high partials"]]);
  }

  const lesson = { steps: [
    { title: "What is timbre?", kick: "Tone color", render: H => `<p><b>Timbre</b> (pronounced TAM-ber), or <b>tone color</b>, is what lets you tell a flute from a violin when both play the same pitch at the same loudness. A standard acoustical definition says just that: timbre is the attribute that distinguishes two sounds with the same pitch, loudness and duration.</p>
      <p>Here is the same note played by eight simple synthesized "instruments":</p>
      ${row(...Object.keys(INSTR).map(n => btn(INSTR[n], { tm: "inst", i: n, f: 262 })), btn("All in turn", { tm: "install", f: 262 }), stop)}
      <p>Timbre comes from several ingredients: the <b>spectrum</b> (which overtones sound and how strongly), the <b>envelope</b> (how the sound starts, holds and fades), <b>resonances</b> (formants), <b>noise</b>, and how all of these <b>change over time</b>. The next steps take them one at a time.</p>` + H.check("Two sounds have the same pitch, loudness and length but sound different. What differs?", "timbre", ["tempo", "meter", "key"], "That's the definition of timbre.") },
    { title: "Waveforms and spectra", kick: "The recipe of partials", render: H => `<p>Almost every pitched sound is a blend of <b>partials</b>: the fundamental plus overtones at 2, 3, 4… times its frequency (the harmonic series; see Introduction to Pitch). The strengths of the partials are the sound's <b>spectrum</b>. Four classic synthesizer waveforms show how much the recipe matters:</p>
      <div class="lfigs">${["sine", "triangle", "square", "sawtooth"].map(w => `<figure class="lfig small">${waveSVG(w)}${specSVG(SPEC[w], w + " spectrum")}<figcaption><b>${w}</b>: ${{ sine: "fundamental only; pure", triangle: "odd partials, fading fast; soft", square: "odd partials (1/n); hollow, clarinet-like", sawtooth: "all partials (1/n); bright, brassy or string-like" }[w]}</figcaption>${row(btn("Play", { tm: "wave", w, f: 220 }))}</figure>`).join("")}</div>
      <p>Real instruments have their own recipes: a flute is close to a sine; a clarinet in its low register favors odd partials; an oboe's 2nd–4th partials are stronger than its fundamental, giving its nasal sound; brass and bowed strings are rich in high partials.</p>` + H.check("Which waveform has only odd-numbered partials, at 1/n strength?", "square", ["sine", "sawtooth", "triangle"], "Square: 1, 1/3, 1/5, 1/7…; triangle has odd partials too, but much weaker (1/n²).") },
    { title: "Build a timbre", kick: "Additive synthesis", render: () => `<p>Set the strength of each of the first ten partials and listen. This is <b>additive synthesis</b>, the method behind pipe organ stops (each "rank" adds a partial) and the drawbars of a Hammond organ.</p>${buildToy()}
      <p>Try: only odd partials (hollow), only the fundamental and partial 2 (sweet), partials 3–6 strong (nasal), or everything strong (buzzy).</p>` },
    { title: "Envelope", kick: "Attack, decay, sustain, release", render: H => `<p>The <b>envelope</b> is the loudness shape of a note. Synthesizers describe it with four stages, <b>ADSR</b>: attack (time to reach full level), decay (time to fall to the sustain level), sustain (the level held while the note is held) and release (time to fade after it ends).</p>
      ${adsrToy()}
      <p>The <b>attack</b> is especially important: in classic experiments, listeners often misidentified instruments once the first fraction of a second was removed. Hear a plucked note and a trumpet-like note, each first normally and then with its attack faded in:</p>
      ${row(btn("Plucked: normal, then no attack", { tm: "cut", i: "plucked", f: 196 }), btn("Trumpet-like: normal, then no attack", { tm: "cut", i: "trumpet", f: 262 }), btn("Piano-like: normal, then no attack", { tm: "cut", i: "piano", f: 262 }))}
      <p>Struck and plucked instruments (piano, guitar, harp, marimba) have no sustain: they only decay. Bowed and blown instruments, organs and voices can sustain and swell.</p>` + H.check("Which instruments can't sustain a note at a steady level?", "plucked and struck ones like guitar and piano", ["bowed strings", "organ", "voices"], "Once plucked or struck, the string or bar can only ring and decay.") },
    { title: "Brightness and filters", kick: "Bright or dark", render: H => `<p>The most noticeable dimension of timbre is <b>brightness</b>: how much energy is in the high partials. Here a sawtooth plays through a low-pass filter, which removes partials above a cutoff:</p>
      ${row(...[300, 800, 2000, 6000].map(c => btn(`Cutoff ${c} Hz`, { tm: "bright", c, f: 131 })), btn("Slow filter sweep", { tm: "sweep", f: 110 }), stop)}
      ${tbl("Some words for timbre", ["Word", "Often linked to"], [["bright / brilliant", "strong high partials"], ["dark / mellow / warm", "weak high partials, strong low ones"], ["hollow", "weak even partials (clarinet's low register)"], ["nasal / reedy", "strong partials in the middle of the spectrum (oboe)"], ["brassy", "many strong partials that grow as the note gets louder"], ["breathy / airy", "noise mixed with the tone"], ["pure", "few partials (flute, sine)"], ["metallic", "inharmonic partials (bells, cymbals)"]])}
      <p>On acoustic instruments brightness goes up with <b>loudness</b>: a fortissimo trumpet has far more high partials than a pianissimo one. That's one reason a recording made louder doesn't sound like the performer playing louder.</p>` + H.check("Lowering the cutoff of a low-pass filter makes a tone…", "darker", ["brighter", "higher", "faster"], "It removes high partials.") },
    { title: "Formants: voices and vowels", kick: "Resonances that stay put", render: H => `<p>The vocal folds make a buzz rich in harmonics. The throat, mouth and lips then act as filters with a few resonant peaks called <b>formants</b>. Changing the shape of your mouth moves the formants, and we hear that as different <b>vowels</b>, even at the same pitch:</p>
      ${row(...Object.keys(VOW).map(v => btn(VOW[v][0].split(" (")[0], { tm: "vowel", v, f: 131 })), btn("All five", { tm: "vowels", f: 131 }), btn("All five, higher", { tm: "vowels", f: 262 }))}
      ${tbl("Approximate formants (adult male voice)", ["Vowel", "F1", "F2", "F3"], Object.values(VOW).map(([n, f]) => [n, f[0] + " Hz", f[1] + " Hz", f[2] + " Hz"]))}
      <p>Formants don't move when the pitch changes, which is why a vowel stays recognizable across a melody and why speeding up a recording (moving formants up too) produces the "chipmunk" effect. Instruments have formants as well: the body of a violin or the bore of an oboe emphasizes the same frequency regions on every note. Trained classical singers add a <b>singer's formant</b> (a peak around 2,500–3,500 Hz) that helps a voice carry over an orchestra.</p>` + H.check("Why does a vowel stay recognizable when you sing it on different pitches?", "its formants stay in roughly the same place", ["its fundamental stays the same", "it has no partials", "vowels have no timbre"], "Formants are tied to the shape of the vocal tract, not to the pitch.") },
    { title: "Noise and inharmonic sounds", kick: "Breath, bow and bells", render: H => `<p>Not every component of a sound is a neat harmonic:</p>
      <ul><li><b>Noise</b> is part of many timbres: the breath in a flute, the scrape of a bow, the thump of a piano hammer, the consonants of speech.</li>
      <li><b>Inharmonic</b> partials (not whole-number multiples of the fundamental) give bells, gongs, cymbals and many drums their metallic or ambiguous pitch. Piano strings are slightly inharmonic too: their upper partials run a little sharp.</li></ul>
      ${row(btn("Harmonic tone", { tm: "harm", f: 262 }), btn("Inharmonic bell", { tm: "inharm", f: 262 }), btn("Breath noise", { tm: "breath" }))}` + H.check("Why does a bell's pitch sometimes seem unclear?", "its partials are inharmonic", ["it has no overtones", "it has only odd partials", "it's always out of tune"], "Partials that don't line up with the harmonic series weaken the sense of a single pitch.") },
    { title: "Timbre in performance", kick: "Register, dynamics, technique", render: H => `<p>Performers change timbre constantly. Each instrument has distinct colors in each <b>register</b> (the clarinet's dark chalumeau and bright clarion; a voice's chest and head registers), and techniques can change the color without changing the pitch:</p>
      ${tbl("Some timbre-changing techniques", ["Technique", "Effect"], [["Vibrato (more, less, none)", "warmth and shimmer; straight tone sounds purer"], ["Mutes (strings, brass)", "veiled or buzzy colors: straight, cup, harmon, practice mutes"], ["Sul ponticello / sul tasto", "bowing near the bridge (glassy, bright) or over the fingerboard (soft, flute-like)"], ["Pizzicato", "plucked instead of bowed: percussive envelope"], ["Harmonics", "light, pure, flute-like tones on strings and harp"], ["Flutter-tonguing, growls", "rough, noisy colors on winds and brass"], ["Breathy tone, subtone", "airy colors on voice and saxophone"], ["Piano pedal, una corda", "more resonance, or a softer, darker sound"], ["Guitar pick position", "near the bridge bright, near the neck warm"]])}
      <p>The orchestration apps (Strings, Winds & Brass, Percussion, Harp, Keyboard Instruments, Plucked Instruments) describe each instrument's registers and colors in detail.</p>` + H.check("Bowing over the fingerboard (sul tasto) makes a string sound…", "softer and flute-like", ["glassy and bright", "plucked", "an octave higher"], "Bowing farther from the bridge weakens the high partials.") },
    { title: "Combining timbres", kick: "Blend, contrast and color melodies", render: H => `<p>Orchestrators mix timbres like paint:</p>
      <ul><li><b>Unison doubling</b> blends spectra into a new color: flute and clarinet together sound like neither alone.</li>
      <li><b>Octave doubling</b> adds brilliance (an octave above) or weight (an octave below).</li>
      <li><b>Contrast</b> separates layers: a melody in a reed instrument stands out from string accompaniment.</li>
      <li><b>Klangfarbenmelodie</b> ("sound-color melody"), a term Arnold Schoenberg introduced in 1911, treats timbre as a melodic element: a line passed from instrument to instrument. Anton Webern often passed a melody among instruments a few notes at a time.</li></ul>
      ${row(btn("Flute, then clarinet, then both together", { tm: "double", a: "flute,clarinet", mode: "seq", f: 330 }), btn("A line passed among timbres", { tm: "kfm" }))}
      <p>Electronic music opened timbre up completely: <b>synthesizers</b> build sounds from oscillators, filters and envelopes; <b>samplers</b> replay recorded sounds; and <b>effects</b> (distortion, chorus, reverb and more; see About Music Software) reshape any sound. In much pop, electronic and film music, the choice of sounds is as central as melody and harmony.</p>` + H.check("Playing the same line in flute and clarinet at once usually…", "makes a blended new color", ["makes harmony", "raises the pitch", "cancels the sound"], "Unison doubling mixes the spectra.") },
    { title: "Quick check", kick: "Before the drills", render: H => [0, 1, 3, 4, 5, 6].map(i => { const [q, a, w, y] = FACTS[i]; return H.check(q, a, w, y); }).join("") },
  ] };
  return {
    key: "silverapps-timbre-v1", lesson, make, reference,
    modes: [{ id: "wave", kicker: "Listen: waveform" }, { id: "bright", kicker: "Listen: brightness" }, { id: "env", kicker: "Listen: envelope" }, { id: "vowel", kicker: "Listen: vowels" }, { id: "inst", kicker: "Listen: instruments" }, { id: "concepts", kicker: "Concepts" }],
    topics: [],
  };
})();
