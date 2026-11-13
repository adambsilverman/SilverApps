
(() => {
  const $ = id => document.getElementById(id);
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const NAMES = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
  const SCALES = { "Major": [0, 2, 4, 5, 7, 9, 11], "Natural minor": [0, 2, 3, 5, 7, 8, 10], "Dorian": [0, 2, 3, 5, 7, 9, 10], "Mixolydian": [0, 2, 4, 5, 7, 9, 10], "Lydian": [0, 2, 4, 6, 7, 9, 11], "Major pentatonic": [0, 2, 4, 7, 9], "Minor pentatonic": [0, 3, 5, 7, 10], "Whole tone": [0, 2, 4, 6, 8, 10] };
  const INST = { marimba: "Marimba", vibes: "Vibraphone", piano: "Piano", epiano: "Electric piano", pluck: "Plucked string", flute: "Flute", strings: "Strings", pad: "Synth pad", organ: "Organ", bass: "Synth bass", bell: "Bells" };
  const PROCS = { orig: "Repeat the fragment", canon: "Canon (delayed copy)", phase: "Phasing, step by step", drift: "Phasing, gradual drift", add: "Additive process", sub: "Subtractive process", aug: "Augmentation", retro: "Retrograde (backwards)", inv: "Inversion (upside down)", chords: "Chord loop", drone: "Drone" };
  const XP = [[-7, "an octave below"], [-5, "a 6th below"], [-4, "a 5th below"], [-3, "a 4th below"], [-2, "a 3rd below"], [-1, "a 2nd below"], [0, "at pitch"], [1, "a 2nd above"], [2, "a 3rd above"], [3, "a 4th above"], [4, "a 5th above"], [5, "a 6th above"], [7, "an octave above"]];
  const PROGS = { "I": [0], "I–IV": [0, 3], "I–V–vi–IV": [0, 4, 5, 3], "vi–IV–I–V": [5, 3, 0, 4], "i–VI–III–VII": [0, 5, 2, 6], "i–iv–v–i": [0, 3, 4, 0], "I–iii–vi–IV": [0, 2, 5, 3] };
  const COLORS = ["#c0392b", "#2e6db4", "#2e8b57", "#b8860b", "#7b4ea3", "#d2691e"];

  // ---------- state ----------
  const F = { tonic: 0, scale: "Major", len: 8, stepv: 2, bpm: 96, notes: [] };   // notes: { s: step, d: degree row, n: length in steps }
  const def = (o) => Object.assign({ on: true, inst: "marimba", proc: "orig", xp: 0, oct: 0, vol: 80, pan: 0, delay: 2, every: 4, drift: 2, aug: 2, prog: "I–V–vi–IV", arp: false, restart: true }, o);
  let V = [def({ inst: "marimba", pan: -40 }), def({ inst: "marimba", proc: "phase", pan: 40 })];
  const seedFrag = () => { F.notes = [[0, 7], [1, 4], [2, 9], [3, 4], [4, 8], [5, 4], [6, 10], [7, 9]].map(([s, d]) => ({ s, d, n: 1 })); };
  seedFrag();

  // ---------- pitch ----------
  const SC = () => SCALES[F.scale];
  const rows = () => SC().length * 2 + 1;
  function midiOf(d) { const sc = SC(), L = sc.length, o = Math.floor(d / L), i = ((d % L) + L) % L; return 60 + F.tonic + 12 * o + sc[i]; }
  const nm = m => NAMES[m % 12] + (Math.floor(m / 12) - 1);
  const stepSec = () => 60 / F.bpm / F.stepv;

  // ---------- setup controls ----------
  $("tonic").innerHTML = NAMES.map((n, i) => `<option value="${i}">${n}</option>`).join("");
  $("scale").innerHTML = Object.keys(SCALES).map(s => `<option>${s}</option>`).join("");
  $("tonic").onchange = e => { F.tonic = +e.target.value; drawGrid(); };
  $("scale").onchange = e => { const oldL = SC().length; F.scale = e.target.value; const r = rows(); F.notes.forEach(n => { n.d = Math.min(r - 1, Math.round(n.d * SC().length / oldL)); }); drawGrid(); };
  $("len").onchange = e => { F.len = Math.max(2, Math.min(24, Math.round(+e.target.value) || 8)); e.target.value = F.len; F.notes = F.notes.filter(n => n.s < F.len).map(n => Object.assign(n, { n: Math.min(n.n, F.len - n.s) })); drawGrid(); };
  $("stepv").onchange = e => { F.stepv = +e.target.value; drawGrid(); };
  $("bpm").oninput = e => { F.bpm = +e.target.value; $("bpmO").textContent = F.bpm; };

  // ---------- fragment grid ----------
  const grid = $("grid");
  function drawGrid() {
    const R = rows(), per = F.stepv === 3 ? 3 : F.stepv;   // steps per beat
    grid.style.gridTemplateColumns = `3.2em repeat(${F.len}, 30px)`;
    let h = "";
    for (let d = R - 1; d >= 0; d--) {
      const ton = d % SC().length === 0;
      h += `<span class="rlab${ton ? " ton" : ""}" aria-hidden="true">${nm(midiOf(d))}</span>`;
      for (let s = 0; s < F.len; s++) {
        const start = F.notes.find(n => n.s === s && n.d === d), cont = !start && F.notes.find(n => n.d === d && s > n.s && s < n.s + n.n);
        h += `<button class="cell${s % per === 0 ? " beat" : ""}${ton ? " ton" : ""}${start ? " on" : ""}${cont ? " cont" : ""}" data-s="${s}" data-d="${d}" aria-pressed="${!!(start || cont)}" aria-label="${nm(midiOf(d))}, step ${s + 1}${start ? `, note, ${start.n} step${start.n > 1 ? "s" : ""} long` : cont ? ", held" : ""}"></button>`;
      }
    }
    grid.innerHTML = h;
  }
  let drag = null;
  grid.addEventListener("pointerdown", e => {
    const c = e.target.closest(".cell"); if (!c) return; e.preventDefault();
    const s = +c.dataset.s, d = +c.dataset.d, hitN = F.notes.find(n => n.d === d && s >= n.s && s < n.s + n.n);
    if (hitN) { F.notes = F.notes.filter(n => n !== hitN); drawGrid(); return; }
    F.notes = F.notes.filter(n => !(s >= n.s && s < n.s + n.n));   // one note at a time
    const note = { s, d, n: 1 }; F.notes.push(note); drag = { note, id: e.pointerId }; tone("marimba", midiOf(d), ac() && AC.currentTime + .01, .3, .8, OUT);
    drawGrid(); grid.setPointerCapture(e.pointerId);
  });
  grid.addEventListener("pointermove", e => {
    if (!drag) return; const el = document.elementFromPoint(e.clientX, e.clientY), c = el && el.closest && el.closest(".cell"); if (!c) return;
    const s = +c.dataset.s, n = Math.max(1, s - drag.note.s + 1); if (n === drag.note.n) return;
    drag.note.n = Math.min(n, F.len - drag.note.s); F.notes = F.notes.filter(x => x === drag.note || x.s + x.n <= drag.note.s || x.s >= drag.note.s + drag.note.n || x.s < drag.note.s && (x.n = drag.note.s - x.s)); drawGrid();
  });
  grid.addEventListener("pointerup", () => { drag = null; });
  grid.addEventListener("keydown", e => { if (e.key !== "Enter" && e.key !== " ") return; const c = e.target.closest(".cell"); if (!c) return; e.preventDefault();
    const s = +c.dataset.s, d = +c.dataset.d, hitN = F.notes.find(n => n.d === d && s >= n.s && s < n.s + n.n);
    if (hitN) F.notes = F.notes.filter(n => n !== hitN); else { F.notes = F.notes.filter(n => !(s >= n.s && s < n.s + n.n)); F.notes.push({ s, d, n: 1 }); }
    drawGrid(); const again = grid.querySelector(`[data-s="${s}"][data-d="${d}"]`); if (again) again.focus(); });
  $("clear").onclick = () => { F.notes = []; drawGrid(); };
  $("rand").onclick = () => { F.notes = []; const R = rows(); let s = 0, d = 7; while (s < F.len) { const n = Math.random() < .25 && s < F.len - 1 ? 2 : 1; if (Math.random() < .85) { d = Math.max(0, Math.min(R - 1, d + [-2, -1, 1, 2, 3, -3, 0][Math.floor(Math.random() * 7)])); F.notes.push({ s, d, n }); } s += n; } drawGrid(); };
  $("audition").onclick = () => { if (!ac()) return; const t0 = AC.currentTime + .05; F.notes.forEach(n => tone(V[0] ? V[0].inst : "marimba", midiOf(n.d), t0 + n.s * stepSec(), n.n * stepSec(), .9, OUT)); };

  // ---------- voices UI ----------
  const opt = (obj, cur) => Object.entries(obj).map(([k, v]) => `<option value="${k}" ${k === String(cur) ? "selected" : ""}>${v}</option>`).join("");
  function drawVoices() {
    $("voices").innerHTML = V.map((v, i) => `<div class="voice${v.on ? "" : " off"}" style="--vc:${COLORS[i]}" data-v="${i}">
      <h3>Voice ${i + 1}<button class="tbtn" data-vk="on" aria-pressed="${v.on}">${v.on ? "On" : "Off"}</button>${V.length > 1 ? `<button class="tbtn" data-vk="del" aria-label="Remove voice ${i + 1}">Remove</button>` : ""}</h3>
      <div class="vrow">
        <label class="fld">Process<select data-vk="proc">${opt(PROCS, v.proc)}</select></label>
        <label class="fld">Instrument<select data-vk="inst">${opt(INST, v.inst)}</select></label>
        <label class="fld">Transpose<select data-vk="xp">${XP.map(([k, l]) => `<option value="${k}" ${k === v.xp ? "selected" : ""}>${l}</option>`).join("")}</select></label>
        <label class="fld">Octave<select data-vk="oct">${[-2, -1, 0, 1, 2].map(o => `<option value="${o}" ${o === v.oct ? "selected" : ""}>${o > 0 ? "+" : ""}${o}</option>`).join("")}</select></label>
        <label class="fld" ${v.proc === "canon" ? "" : "hidden"}>Starts after (steps)<input type="number" data-vk="delay" min="0" max="64" value="${v.delay}"></label>
        <label class="fld" ${["phase", "add", "sub"].includes(v.proc) ? "" : "hidden"}>${v.proc === "phase" ? "Shift one step every" : "Change every"} (repeats)<input type="number" data-vk="every" min="1" max="16" value="${v.every}"></label>
        <label class="fld" ${v.proc === "drift" ? "" : "hidden"}>Faster by (%)<input type="number" data-vk="drift" min="0.2" max="20" step="0.1" value="${v.drift}"></label>
        <label class="fld" ${v.proc === "aug" ? "" : "hidden"}>Slower by (×)<select data-vk="aug">${[2, 3, 4, 8].map(a => `<option ${a === v.aug ? "selected" : ""}>${a}</option>`).join("")}</select></label>
        <label class="fld" ${v.proc === "chords" ? "" : "hidden"}>Chords<select data-vk="prog">${Object.keys(PROGS).map(p => `<option ${p === v.prog ? "selected" : ""}>${p}</option>`).join("")}</select></label>
        <label class="fld" ${v.proc === "chords" ? "" : "hidden"}><span>Arpeggiate</span><input type="checkbox" data-vk="arp" ${v.arp ? "checked" : ""}></label>
        <label class="fld" ${["add", "sub"].includes(v.proc) ? "" : "hidden"}><span>Start over when done</span><input type="checkbox" data-vk="restart" ${v.restart ? "checked" : ""}></label>
        <label class="fld">Volume<input type="range" data-vk="vol" min="0" max="100" value="${v.vol}"></label>
        <label class="fld">Pan<input type="range" data-vk="pan" min="-100" max="100" value="${v.pan}"></label>
      </div><p class="note">${explain(v)}</p></div>`).join("");
  }
  function explain(v) {
    return { orig: "Plays the fragment over and over.", canon: `Plays the fragment, starting ${v.delay} step${v.delay == 1 ? "" : "s"} later: a canon (round) with the other voices.`, phase: `Every ${v.every} repeats, moves the pattern one step ahead of the others, until it comes back into unison.`, drift: `Plays ${v.drift}% faster, so it slowly slides out of step with the others and back again.`, add: `Starts with the first note and adds one more every ${v.every} repeat${v.every == 1 ? "" : "s"}.`, sub: `Starts with the whole fragment and drops the last note every ${v.every} repeat${v.every == 1 ? "" : "s"}.`, aug: `Plays the fragment ${v.aug} times slower.`, retro: "Plays the fragment backwards.", inv: "Turns the fragment upside down: each step up becomes a step down.", chords: `Holds a chord for each repeat of the fragment: ${v.prog}${v.arp ? ", broken into an arpeggio" : ""}.`, drone: "Holds the tonic and the 5th underneath everything." }[v.proc];
  }
  $("voices").addEventListener("change", e => { const t = e.target.closest("[data-vk]"), box = e.target.closest("[data-v]"); if (!t || !box) return; const v = V[+box.dataset.v], k = t.dataset.vk;
    if (t.type === "checkbox") v[k] = t.checked; else if (["inst", "proc", "prog"].includes(k)) v[k] = t.value; else v[k] = +t.value;
    if (["proc", "arp", "every", "delay", "drift", "aug", "prog", "restart"].includes(k)) { drawVoices(); if (playing) restart(); } else if (k === "inst" || k === "xp" || k === "oct") { /* takes effect on the next notes */ } });
  $("voices").addEventListener("input", e => { const t = e.target.closest('[data-vk="vol"],[data-vk="pan"]'), box = e.target.closest("[data-v]"); if (!t || !box) return; V[+box.dataset.v][t.dataset.vk] = +t.value; applyMix(); });
  $("voices").addEventListener("click", e => { const t = e.target.closest("button[data-vk]"), box = e.target.closest("[data-v]"); if (!t || !box) return; const i = +box.dataset.v;
    if (t.dataset.vk === "on") { V[i].on = !V[i].on; applyMix(); } if (t.dataset.vk === "del") { V.splice(i, 1); if (playing) restart(); } drawVoices(); });
  $("addV").onclick = () => { if (V.length >= 6) return; V.push(def({ proc: "canon", delay: 2 * V.length, inst: ["flute", "vibes", "pluck", "strings"][V.length % 4], pan: [-50, 50, -20, 20][V.length % 4] })); drawVoices(); if (playing) restart(); };

  // ---------- presets ----------
  $("preset").onchange = e => { const p = e.target.value; e.target.value = ""; if (!p) return;
    if (p === "phase") { V = [def({ inst: "marimba", pan: -50 }), def({ inst: "marimba", proc: "phase", every: 4, pan: 50 })]; }
    if (p === "drift") { V = [def({ inst: "epiano", pan: -50 }), def({ inst: "epiano", proc: "drift", drift: 2, pan: 50 })]; }
    if (p === "canon") { V = [def({ inst: "flute", pan: -40 }), def({ inst: "pluck", proc: "canon", delay: 2, xp: 3, pan: 40 }), def({ inst: "vibes", proc: "canon", delay: 4, xp: 7 }), def({ inst: "organ", proc: "drone", vol: 45 })]; }
    if (p === "additive") { V = [def({ inst: "marimba", proc: "add", every: 2, pan: -30 }), def({ inst: "bass", proc: "aug", aug: 2, oct: -1, vol: 70 }), def({ inst: "pad", proc: "chords", prog: "I–V–vi–IV", vol: 45, pan: 30 })]; }
    if (p === "subtractive") { V = [def({ inst: "piano", proc: "sub", every: 2, pan: -30 }), def({ inst: "piano", proc: "orig", oct: -1, pan: 30, vol: 60 })]; }
    if (p === "ambient") { V = [def({ inst: "vibes", proc: "aug", aug: 4, pan: -40 }), def({ inst: "bell", proc: "retro", oct: 1, aug: 3, vol: 45, pan: 40 }), def({ inst: "pad", proc: "chords", prog: "I–iii–vi–IV", vol: 50 }), def({ inst: "strings", proc: "drone", vol: 40 })]; $("space").value = 70; setSpace(); }
    if (p === "chords") { V = [def({ inst: "pluck", proc: "chords", prog: "vi–IV–I–V", arp: true, pan: -30 }), def({ inst: "pad", proc: "chords", prog: "vi–IV–I–V", vol: 50, pan: 30 }), def({ inst: "flute", proc: "canon", delay: 0, oct: 1, vol: 60 }), def({ inst: "bass", proc: "drone", oct: 0, vol: 50 })]; }
    drawVoices(); if (playing) restart(); else start(); };

  // ---------- audio ----------
  let AC = null, OUT = null, REV = null, DRY = null, NZ = null;
  function ac() { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; if (!AC) { AC = new C(); build(); }
    if (AC.state === "suspended") AC.resume(); return AC; }
  function build() { { const comp = AC.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; const master = AC.createGain(); master.gain.value = .8; comp.connect(master); master.connect(AC.destination); OUT = AC.createGain(); DRY = AC.createGain(); REV = AC.createGain(); OUT.connect(DRY); DRY.connect(comp);
      const L = AC.sampleRate * 3, ir = AC.createBuffer(2, L, AC.sampleRate); for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < L; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / L, 3.5); } const cv = AC.createConvolver(); cv.buffer = ir; OUT.connect(cv); cv.connect(REV); REV.connect(comp);
      NZ = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const nd = NZ.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1; AC.__master = master; setSpace(); setVol(); } }
  function setSpace() { const v = +$("space").value; $("spaceO").textContent = v + "%"; if (AC) { DRY.gain.value = 1 - v / 250; REV.gain.value = v / 100 * .7; } }
  function setVol() { const v = +$("vol").value; $("volO").textContent = v + "%"; if (AC) AC.__master.gain.value = v / 100; }
  $("space").oninput = setSpace; $("vol").oninput = setVol;
  const mf = m => 440 * Math.pow(2, (m - 69) / 12);
  // one note on a synthesized instrument
  function tone(inst, m, t, dur, vel, dest) {
    if (!AC || t == null) return; const f = mf(m), g = AC.createGain(); g.connect(dest);
    const osc = (type, fr, gain, det) => { const o = AC.createOscillator(), og = AC.createGain(); o.type = type; o.frequency.value = fr; if (det) o.detune.value = det; og.gain.value = gain; o.connect(og); og.connect(g); return o; };
    const env = (a, peak, decay, sus, rel, len) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak * vel, t + a); if (decay) g.gain.setTargetAtTime(peak * vel * sus, t + a, decay); g.gain.setTargetAtTime(0, t + Math.max(a, len), rel); return t + Math.max(a, len) + rel * 5; };
    let os = [], end;
    if (inst === "marimba") { os = [osc("sine", f, 1), osc("sine", f * 3.93, .25)]; end = env(.003, .32, .12, 0, .1, .05); }
    else if (inst === "vibes") { os = [osc("sine", f, 1), osc("sine", f * 4, .2)]; const l = AC.createOscillator(), lg = AC.createGain(); l.frequency.value = 5.5; lg.gain.value = .25; l.connect(lg); const tg = AC.createGain(); g.disconnect(); g.connect(tg); tg.connect(dest); lg.connect(tg.gain); l.start(t); l.__s = 1; os.push(l); end = env(.003, .28, .9, 0, .4, dur); }
    else if (inst === "piano") { os = [osc("triangle", f, 1), osc("sine", f * 2, .3), osc("sine", f * 3, .1)]; end = env(.004, .3, .6, .15, .2, dur); }
    else if (inst === "epiano") { const car = osc("sine", f, 1), mod = AC.createOscillator(), mg = AC.createGain(); mod.frequency.value = f; mg.gain.setValueAtTime(f * 1.4, t); mg.gain.setTargetAtTime(f * .1, t, .15); mod.connect(mg); mg.connect(car.frequency); os = [car, mod]; end = env(.004, .3, .8, .2, .25, dur); }
    else if (inst === "pluck") { os = [osc("sawtooth", f, .6)]; const lp = AC.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.setValueAtTime(f * 8, t); lp.frequency.setTargetAtTime(f * 1.5, t, .08); g.disconnect(); os[0].disconnect(); const og = AC.createGain(); og.gain.value = .6; os[0].connect(og); og.connect(lp); lp.connect(g); g.connect(dest); end = env(.002, .32, .25, 0, .1, .05); }
    else if (inst === "flute") { os = [osc("sine", f, 1), osc("sine", f * 2, .12)]; const l = AC.createOscillator(), lg = AC.createGain(); l.frequency.value = 5; lg.gain.value = 8; l.connect(lg); lg.connect(os[0].detune); l.start(t + .15); l.__s = 1; os.push(l); end = env(.06, .22, .2, .85, .08, dur); }
    else if (inst === "strings" || inst === "pad") { const lp = AC.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = inst === "pad" ? 1400 : 2600; os = [-9, 0, 9].map(d => { const o = AC.createOscillator(), og = AC.createGain(); o.type = "sawtooth"; o.frequency.value = f; o.detune.value = d; og.gain.value = .33; o.connect(og); og.connect(lp); return o; }); lp.connect(g); end = env(inst === "pad" ? .6 : .15, .14, 0, 1, inst === "pad" ? .8 : .3, dur); }
    else if (inst === "organ") { os = [1, 2, 3, 4, 6].map((h, i) => osc("sine", f * h, [1, .6, .35, .25, .15][i])); end = env(.01, .12, 0, 1, .05, dur); }
    else if (inst === "bass") { os = [osc("sawtooth", f, .7), osc("square", f / 2, .3)]; const lp = AC.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.setValueAtTime(900, t); lp.frequency.setTargetAtTime(250, t, .15); g.disconnect(); const g2 = AC.createGain(); os.forEach(o => { o.disconnect(); o.connect(g2); }); g2.connect(lp); lp.connect(g); g.connect(dest); end = env(.005, .3, .3, .5, .08, dur); }
    else if (inst === "bell") { os = [[1, 1], [2.76, .4], [5.4, .25], [8.93, .12]].map(([r, a]) => osc("sine", f * r, a)); end = env(.002, .2, 1.4, 0, .6, dur); }
    os.forEach(o => { if (!o.__s) { o.start(t); o.__s = 1; } o.stop(end + .05); });
  }

  // ---------- processes ----------
  const sorted = () => F.notes.slice().sort((a, b) => a.s - b.s);
  // one cycle of a voice: { len (steps), ev: [{ s, n, m }] }
  function cycle(v, i) {
    const notes = sorted(), L = F.len, P = d => midiOf(d + v.xp) + 12 * v.oct;
    const plain = list => list.map(x => ({ s: x.s, n: x.n, m: P(x.d) }));
    if (v.proc === "drone") return { len: L * 4, ev: [{ s: 0, n: L * 4 + 1, m: midiOf(0) - 24 + 12 * v.oct }, { s: 0, n: L * 4 + 1, m: midiOf(0) - 17 + 12 * v.oct }] };
    if (v.proc === "chords") { const prog = PROGS[v.prog], r = prog[i % prog.length], tones = [r, r + 2, r + 4].map(d => midiOf(d + v.xp) - 12 + 12 * v.oct);
      if (!v.arp) return { len: L, ev: tones.map(m => ({ s: 0, n: L, m })) };
      const order = tones.concat([tones[0] + 12, tones[2] - 0, tones[1]]); return { len: L, ev: Array.from({ length: L }, (_, k) => ({ s: k, n: 1, m: order[k % order.length] + 12 })) }; }
    if (!notes.length) return { len: L, ev: [] };
    if (v.proc === "add" || v.proc === "sub") {
      const N = notes.length, stage = Math.floor(i / v.every); let k;
      if (v.proc === "add") k = v.restart ? (stage % N) + 1 : Math.min(N, stage + 1); else k = v.restart ? N - (stage % N) : Math.max(1, N - stage);
      const part = notes.slice(0, k), len = k < N ? notes[k].s : L;
      return { len: Math.max(1, len), ev: plain(part) };
    }
    if (v.proc === "phase") { const sh = Math.floor(i / v.every) % L; return { len: L, ev: plain(notes).map(x => Object.assign(x, { s: (x.s - sh + L) % L })) }; }
    if (v.proc === "aug") return { len: L * v.aug, ev: plain(notes).map(x => Object.assign(x, { s: x.s * v.aug, n: x.n * v.aug })) };
    if (v.proc === "retro") { return { len: L, ev: plain(notes).map(x => Object.assign(x, { s: L - x.s - x.n })) }; }
    if (v.proc === "inv") { const d0 = notes[0].d; return { len: L, ev: notes.map(x => ({ s: x.s, n: x.n, m: P(2 * d0 - x.d) })) }; }
    return { len: L, ev: plain(notes) };   // orig, canon, drift
  }

  // ---------- drums ----------
  const D = { style: "off", vol: 60, inBars: 0 };
  $("dStyle").onchange = e => { D.style = e.target.value; };
  $("dVol").oninput = e => { D.vol = +e.target.value; if (DB) DB.gain.setTargetAtTime(D.vol / 100, AC.currentTime, .05); };
  $("dIn").onchange = e => { D.inBars = Math.max(0, +e.target.value || 0); };
  // patterns: 16 sixteenths per 4/4 bar (12 for the 6/8 groove); k kick, s snare, c clap, h closed hat, o open hat, z shaker, t tom
  const DP = {
    pulse: { n: 16, k: [0], h: [0, 2, 4, 6, 8, 10, 12, 14] },
    shaker: { n: 16, z: [...Array(16).keys()], k: [0, 8] },
    four: { n: 16, k: [0, 4, 8, 12], c: [4, 12], o: [2, 6, 10, 14], h: [1, 3, 5, 7, 9, 11, 13, 15] },
    back: { n: 16, k: [0, 8, 10], s: [4, 12], h: [0, 2, 4, 6, 8, 10, 12, 14] },
    half: { n: 16, k: [0, 3, 10], s: [8], h: [0, 2, 4, 6, 8, 10, 12, 14] },
    break: { n: 16, k: [0, 6, 10], s: [4, 12, 15], h: [...Array(16).keys()] },
    six: { n: 12, k: [0, 10], s: [6], h: [0, 2, 4, 6, 8, 10], z: [...Array(12).keys()] } };
  let DB = null;
  function drum(kind, t, v) {
    const g = AC.createGain(); g.connect(DB);
    const nz = (type, f, len, a) => { const n = AC.createBufferSource(), fl = AC.createBiquadFilter(), ng = AC.createGain(); n.buffer = NZ; fl.type = type; fl.frequency.value = f; ng.gain.setValueAtTime(a * v, t); ng.gain.exponentialRampToValueAtTime(.001, t + len); n.connect(fl); fl.connect(ng); ng.connect(g); n.start(t, Math.random() * .5); n.stop(t + len + .02); };
    const osc = (f0, f1, len, a) => { const o = AC.createOscillator(), og = AC.createGain(); o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + len * .5); og.gain.setValueAtTime(0, t); og.gain.linearRampToValueAtTime(a * v, t + .002); og.gain.exponentialRampToValueAtTime(.001, t + len); o.connect(og); og.connect(g); o.start(t); o.stop(t + len + .02); };
    if (kind === "k") osc(150, 45, .42, .9);
    if (kind === "s") { nz("bandpass", 2000, .2, .45); osc(200, 150, .12, .3); }
    if (kind === "c") nz("bandpass", 1300, .18, .5);
    if (kind === "h") nz("highpass", 8000, .05, .25);
    if (kind === "o") nz("highpass", 7000, .3, .2);
    if (kind === "z") nz("highpass", 10000, .03, .12);
  }
  let DS = null;
  function drumTick(horizon) {
    if (D.style === "off") { if (DS) DS.t = Math.max(DS.t, horizon); return; }
    const P = DP[D.style], sx = P.n === 12 ? 60 / F.bpm / 6 : 60 / F.bpm / 4;   // in 6/8 the tempo counts the dotted-quarter beat (six sixteenths)
    if (!DS) DS = { t: t0 + D.inBars * 4 * 60 / F.bpm, i: 0 };
    while (DS.t < horizon) { const p = DS.i % P.n; ["k", "s", "c", "h", "o", "z"].forEach(k => { if (P[k] && P[k].includes(p)) drum(k, DS.t, p === 0 ? 1 : .8); }); DS.t += sx; DS.i++; }
  }

  // ---------- scheduler ----------
  let playing = false, timer = 0, raf = 0, VS = [], log = [], t0 = 0;
  const vbus = [];
  function busFor(i) { if (!DB) { DB = AC.createGain(); DB.gain.value = D.vol / 100; DB.connect(OUT); } if (!vbus[i]) { const g = AC.createGain(), p = AC.createStereoPanner(); g.connect(p); p.connect(OUT); vbus[i] = { g, p }; } return vbus[i]; }
  function applyMix() { if (!AC) return; V.forEach((v, i) => { const b = busFor(i); b.g.gain.setTargetAtTime(v.on ? v.vol / 100 : 0, AC.currentTime, .05); b.p.pan.setTargetAtTime(v.pan / 100, AC.currentTime, .05); }); }
  function start() { if (!ac()) return; DS = null; playing = true; $("play").textContent = "■ Stop"; t0 = AC.currentTime + .1; VS = V.map(v => ({ i: 0, t: t0 + (v.proc === "canon" ? v.delay * stepSec() : 0) })); log = []; applyMix(); timer = setInterval(tick, 30); raf = requestAnimationFrame(draw); status(); }
  function stop() { playing = false; $("play").textContent = "▶ Play"; clearInterval(timer); cancelAnimationFrame(raf); vbus.forEach(b => b && b.g.gain.setTargetAtTime(0, AC.currentTime, .08)); if (DB) { DB.disconnect(); DB = null; } setTimeout(() => { if (!playing) vbus.forEach((b, i) => b && V[i] && b.g.gain.setValueAtTime(V[i].on ? V[i].vol / 100 : 0, AC.currentTime)); }, 700); }
  function restart() { stop(); setTimeout(start, 120); }
  function tick(until) {
    const horizon = until != null ? until : AC.currentTime + .25; busFor(0); drumTick(horizon);
    V.forEach((v, vi) => {
      const st = VS[vi]; if (!st) { VS[vi] = { i: 0, t: AC.currentTime + .05 }; return; }
      while (st.t < horizon) {
        const sp = stepSec() / (v.proc === "drift" ? 1 + v.drift / 100 : 1), c = cycle(v, st.i);
        c.ev.forEach(e => { const t = st.t + e.s * sp, d = e.n * sp; try { tone(v.inst, e.m, t, d * .95, .9, busFor(vi).g); } catch (x) {} if (v.on) log.push({ vi, t, d, m: e.m }); });
        st.t += c.len * sp; st.i++;
      }
    });
    if (log.length > 3000) log = log.filter(e => e.t + e.d > AC.currentTime - 3);
  }
  function status() { $("status").textContent = playing ? V.map((v, i) => v.on ? `Voice ${i + 1}: ${PROCS[v.proc].toLowerCase()}` : null).filter(Boolean).join(" · ") : ""; }

  // ---------- scrolling picture ----------
  const cv = $("roll");
  function draw() {
    if (!playing) return; const W = cv.clientWidth * devicePixelRatio, Hh = cv.clientHeight * devicePixelRatio; if (cv.width !== W) { cv.width = W; cv.height = Hh; }
    const g = cv.getContext("2d"), now = AC.currentTime, span = 8, x = t => (t - now + span * .25) / span * W, y = m => Hh - 8 - (m - 30) / 70 * (Hh - 16);
    g.clearRect(0, 0, W, Hh);
    log.forEach(e => { const x0 = x(e.t), x1 = x(e.t + e.d); if (x1 < 0 || x0 > W) return; g.fillStyle = COLORS[e.vi]; g.globalAlpha = e.t <= now && now < e.t + e.d ? 1 : .55; g.fillRect(x0, y(e.m) - 4 * devicePixelRatio, Math.max(2, x1 - x0 - 1), 8 * devicePixelRatio); });
    g.globalAlpha = 1; g.fillStyle = css("--fi-ink") || "#222"; g.fillRect(W * .25, 0, 2 * devicePixelRatio, Hh);
    raf = requestAnimationFrame(draw);
  }

  // ---------- export: render the piece offline, then encode ----------
  function wav(b) {
    const ch = b.numberOfChannels, n = b.length, ab = new ArrayBuffer(44 + n * ch * 2), v = new DataView(ab), w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, "RIFF"); v.setUint32(4, 36 + n * ch * 2, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true); v.setUint32(24, b.sampleRate, true); v.setUint32(28, b.sampleRate * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, n * ch * 2, true);
    const cs = Array.from({ length: ch }, (_, c) => b.getChannelData(c)); let o = 44; for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const x = Math.max(-1, Math.min(1, cs[c][i])); v.setInt16(o, x < 0 ? x * 32768 : x * 32767, true); o += 2; }
    return new Blob([ab], { type: "audio/wav" });
  }
  const lame = () => new Promise((ok, no) => { if (window.lamejs) return ok(); const sc = document.createElement("script"); sc.src = "assets/lame.min.js?v=5a6238f8"; sc.onload = ok; sc.onerror = no; document.head.appendChild(sc); });
  async function mp3(b) { await lame(); const enc = new lamejs.Mp3Encoder(2, b.sampleRate, 192), I = d => Int16Array.from(d, x => Math.max(-32768, Math.min(32767, x * 32767))), L = I(b.getChannelData(0)), R = I(b.getChannelData(1)), parts = [];
    for (let i = 0; i < L.length; i += 1152) { const x = enc.encodeBuffer(L.subarray(i, i + 1152), R.subarray(i, i + 1152)); if (x.length) parts.push(new Uint8Array(x)); } const e = enc.flush(); if (e.length) parts.push(new Uint8Array(e)); return new Blob(parts, { type: "audio/mpeg" }); }
  $("export").onclick = async () => {
    if (!ac()) return; const dur = +$("expLen").value, fmt = $("expFmt").value, btn = $("export"); btn.disabled = true; $("status").textContent = "Rendering… (this can take a little while for long pieces)";
    const was = playing; if (playing) stop();
    const save = { AC, OUT, REV, DRY, DB, vb: vbus.splice(0), VS, DS, t0 };
    try {
      AC = new OfflineAudioContext(2, Math.ceil(44100 * (dur + 4)), 44100); DB = null; build(); setSpace(); setVol();
      t0 = .05; DS = null; VS = V.map(v => ({ i: 0, t: t0 + (v.proc === "canon" ? v.delay * stepSec() : 0) })); log = []; applyMix();
      tick(dur);
      AC.__master.gain.setValueAtTime(+$("vol").value / 100, dur - 3); AC.__master.gain.linearRampToValueAtTime(0, dur + .5);
      const buf = await AC.startRendering(), blob = fmt === "mp3" ? await mp3(buf) : wav(buf), url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = "process-piece." + fmt; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
      $("status").textContent = `Saved process-piece.${fmt} (${(blob.size / 1048576).toFixed(1)} MB).`; window.__lastExport = { size: blob.size, dur: buf.duration };
    } catch (e) { $("status").textContent = "Export failed: " + e.message; }
    ({ AC, OUT, REV, DRY, DB, VS, DS, t0 } = save); vbus.length = 0; save.vb.forEach((b, i) => vbus[i] = b); log = []; btn.disabled = false; if (was) start();
  };
  $("play").onclick = () => playing ? stop() : start();
  $("restart").onclick = () => restart();
  // share the whole setup as a link (?p=…)
  try { const q = new URLSearchParams(location.search).get("p"); if (q) { const o = JSON.parse(decodeURIComponent(escape(atob(q)))); if (o.F) Object.assign(F, o.F); if (Array.isArray(o.V) && o.V.length) V = o.V.map(v => def(v)); ["tonic", "scale", "len", "stepv", "bpm"].forEach(k => { const el = $(k); if (el) el.value = F[k]; }); if ($("bpmO")) $("bpmO").textContent = F.bpm; } } catch (e) {}
  $("share").onclick = () => { const code = btoa(unescape(encodeURIComponent(JSON.stringify({ F, V })))), url = location.href.split(/[?#]/)[0] + "?p=" + encodeURIComponent(code); if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => { $("status").textContent = "Link copied: it opens this setup."; }, () => { $("status").textContent = url; }); else $("status").textContent = url; };
  drawGrid(); drawVoices();
  window.__lab = { F, get V() { return V; }, cycle, get log() { return log; } };   // used by automated tests
})();
