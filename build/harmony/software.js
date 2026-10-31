window.FAM = (() => {
  // ===== About Music Software: digital audio, DAWs, synthesizers and virtual instruments, notation and production software. =====
  const tbl = (cap, head, rows) => `<div class="ltable-wrap" tabindex="0" role="region" aria-label="${cap}"><table class="ltable"><caption>${cap}</caption><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  // ===================== Interactive toys for the Music Software lesson =====================
  // MIDI playground, mini mixer (buses and sends), synthesizer and drum machine. State lives here so it survives step changes.
  let AC = null, OUT = null;
  function ac() { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; if (!AC) { AC = new C(); OUT = AC.createGain(); OUT.gain.value = .8; OUT.connect(AC.destination); } if (AC.state === "suspended") AC.resume(); return AC; }
  const $q = s => document.querySelector(s);
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const NN = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"], nn = m => NN[m % 12] + (Math.floor(m / 12) - 1);
  const hex = n => n.toString(16).toUpperCase().padStart(2, "0");
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  let NOISE = null; const noise = () => { if (!NOISE) { NOISE = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const d = NOISE.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } return NOISE; };

  // ---------- a small polyphonic voice used by the MIDI playground and the synth ----------
  // p: { wave, cutoff, res, a, d, s, r, lfoRate, lfoDepth, lfoTo, osc2 (cents or null) }
  function voice(m, vel, p, dest, bend) {
    const t = AC.currentTime, g = AC.createGain(), f = AC.createBiquadFilter(), oscs = [];
    f.type = "lowpass"; f.frequency.value = p.cutoff; f.Q.value = p.res; f.connect(g); g.connect(dest || OUT);
    const lfo = AC.createOscillator(), lg = AC.createGain(); lfo.frequency.value = p.lfoRate; lg.gain.value = p.lfoTo === "pitch" ? p.lfoDepth * 100 : p.lfoTo === "filter" ? p.lfoDepth * p.cutoff * .9 : p.lfoDepth * .5; lfo.connect(lg); lfo.start(t);
    [0].concat(p.osc2 != null ? [p.osc2] : []).forEach(dc => { const o = AC.createOscillator(); o.type = p.wave; o.frequency.value = mtof(m); o.detune.value = dc + (bend || 0); if (p.lfoTo === "pitch") lg.connect(o.detune); o.connect(f); o.start(t); oscs.push(o); });
    if (p.lfoTo === "filter") lg.connect(f.frequency);
    const amp = .22 * (vel / 127) / Math.sqrt(oscs.length);
    if (p.lfoTo === "volume") { const vg = AC.createGain(); vg.gain.value = 1; g.disconnect(); g.connect(vg); vg.connect(dest || OUT); lg.connect(vg.gain); }
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(amp, t + Math.max(.003, p.a)); g.gain.setTargetAtTime(amp * p.s, t + Math.max(.003, p.a), Math.max(.01, p.d) / 3);
    return { m, oscs, lfo, lg, g, setBend: c => oscs.forEach((o, i) => o.detune.setTargetAtTime((i ? p.osc2 : 0) + c, AC.currentTime, .01)), setLfo: v => lg.gain.setTargetAtTime(v, AC.currentTime, .02),
      stop() { const t2 = AC.currentTime; g.gain.cancelScheduledValues(t2); g.gain.setValueAtTime(g.gain.value, t2); g.gain.setTargetAtTime(0, t2, Math.max(.01, p.r) / 3); const end = t2 + Math.max(.05, p.r) * 1.5 + .05; oscs.forEach(o => o.stop(end)); lfo.stop(end); } };
  }

  // ---------- soft keyboard (shared) ----------
  const isBlack = m => [1, 3, 6, 8, 10].includes(m % 12);
  function keyboard(id, lo, hi) {
    const whites = []; for (let m = lo; m <= hi; m++) if (!isBlack(m)) whites.push(m);
    const w = 100 / whites.length;
    let h = `<div class="skb" data-kb="${id}" role="group" aria-label="Keyboard: click or tap keys; with the keyboard focused, the computer keys A W S E D F T G Y H U J K also play">`;
    whites.forEach((m, i) => { h += `<button class="wk" data-kbn="${m}" style="left:${i * w}%;width:${w}%" aria-label="${nn(m)}">${m % 12 === 0 ? `<span>${nn(m)}</span>` : ""}</button>`; });
    for (let m = lo; m <= hi; m++) if (isBlack(m)) { const i = whites.indexOf(m - 1); h += `<button class="bk" data-kbn="${m}" style="left:${(i + 1) * w - w * .3}%;width:${w * .6}%" aria-label="${nn(m)}"></button>`; }
    return h + "</div>";
  }
  const KEYMAP = "awsedftgyhujkolp;'".split("");
  const KB = {};   // id → { on(m, vel), off(m), base }
  const held = new Map();
  document.addEventListener("pointerdown", e => {
    const k = e.target.closest("[data-kbn]"); if (!k) return; const kb = k.closest("[data-kb]"), h = KB[kb.dataset.kb]; if (!h || !ac()) return;
    e.preventDefault();
    const r = k.getBoundingClientRect(), vel = Math.max(20, Math.min(127, Math.round(30 + 97 * (e.clientY - r.top) / r.height)));
    const m = +k.dataset.kbn; held.set(e.pointerId, { h, m, k }); k.classList.add("on"); h.on(m, vel);
  });
  document.addEventListener("click", e => {   // keyboard users: Enter or Space on a key plays a short note
    if (e.detail !== 0) return; const k = e.target.closest("[data-kbn]"); if (!k) return; const h = KB[k.closest("[data-kb]").dataset.kb]; if (!h || !ac()) return;
    const m = +k.dataset.kbn; k.classList.add("on"); h.on(m, 100); setTimeout(() => { k.classList.remove("on"); h.off(m); }, 400);
  });
  const release = e => { const x = held.get(e.pointerId); if (!x) return; held.delete(e.pointerId); x.k.classList.remove("on"); x.h.off(x.m); };
  document.addEventListener("pointerup", release); document.addEventListener("pointercancel", release);
  const downKeys = new Set();
  document.addEventListener("keydown", e => {
    const toy = document.activeElement && document.activeElement.closest && document.activeElement.closest("[data-toy]"); if (!toy || e.repeat || e.metaKey || e.ctrlKey) return;
    if (document.activeElement.matches("input[type=number],input[type=text],select")) return;
    const kb = toy.querySelector("[data-kb]"); if (!kb) return; const h = KB[kb.dataset.kb], i = KEYMAP.indexOf(e.key.toLowerCase()); if (!h || i < 0 || !ac()) return;
    e.preventDefault(); const m = h.base + i; if (downKeys.has(m)) return; downKeys.add(m); const el = kb.querySelector(`[data-kbn="${m}"]`); if (el) el.classList.add("on"); h.on(m, 100);
  });
  document.addEventListener("keyup", e => { const i = KEYMAP.indexOf(e.key.toLowerCase()); if (i < 0) return; Object.values(KB).forEach(h => { const m = h.base + i; if (downKeys.has(m)) { downKeys.delete(m); const el = document.querySelector(`[data-kbn="${m}"].on`); if (el) el.classList.remove("on"); h.off(m); } }); });

  // ================= MIDI playground =================
  const GM = [[0, "Acoustic Grand Piano", "triangle"], [4, "Electric Piano 1", "sine"], [16, "Drawbar Organ", "square"], [24, "Acoustic Guitar (nylon)", "triangle"], [32, "Acoustic Bass", "sine"], [40, "Violin", "sawtooth"], [48, "String Ensemble 1", "sawtooth"], [56, "Trumpet", "sawtooth"], [73, "Flute", "sine"], [80, "Lead 1 (square)", "square"]];
  const MS = { ch: 0, prog: 0, bend: 0, mod: 0, sus: false, log: [], voices: new Map(), sustained: new Set() };
  const midiPatch = () => { const w = (GM.find(g => g[0] === MS.prog) || GM[0])[2]; return { wave: w, cutoff: w === "sawtooth" ? 2600 : 5000, res: .7, a: w === "sawtooth" && MS.prog >= 40 && MS.prog < 72 ? .08 : .005, d: .6, s: MS.prog < 32 && MS.prog !== 16 ? .25 : .8, r: .35, lfoRate: 5.5, lfoDepth: 0, lfoTo: "pitch", osc2: null }; };
  function mlog(bytes, text) {
    MS.log.unshift({ bytes, text }); MS.log.length = Math.min(MS.log.length, 14);
    const el = $q("#midiLog"); if (el) el.innerHTML = MS.log.map(x => `<li><code>${x.bytes.map(hex).join(" ")}</code><span>${esc(x.text)}</span></li>`).join("");
  }
  function midiIn(bytes, fromDevice) {   // handle any MIDI message: from the soft controls or a real device
    const [st, d1 = 0, d2 = 0] = bytes, type = st & 0xF0, ch = (st & 15) + 1;
    if (type === 0x90 && d2 > 0) { mlog(bytes, `Note On · ch ${ch} · ${nn(d1)} (note ${d1}) · velocity ${d2}`); if (!ac()) return; const old = MS.voices.get(d1); if (old) old.stop(); MS.sustained.delete(d1); MS.voices.set(d1, voice(d1, d2, midiPatch(), null, MS.bend / 8192 * 200)); MS.voices.get(d1).setLfo(MS.mod / 127 * 60); }
    else if (type === 0x80 || (type === 0x90 && d2 === 0)) { mlog(bytes, `Note Off · ch ${ch} · ${nn(d1)} (note ${d1})${type === 0x90 ? " (Note On, velocity 0)" : ""}`); if (MS.sus) MS.sustained.add(d1); else { const v = MS.voices.get(d1); if (v) { v.stop(); MS.voices.delete(d1); } } }
    else if (type === 0xE0) { const v14 = (d2 << 7) | d1; MS.bend = v14 - 8192; mlog(bytes, `Pitch Bend · ch ${ch} · ${v14} (${MS.bend >= 0 ? "+" : ""}${MS.bend}; center = 8192)`); MS.voices.forEach(v => v.setBend(MS.bend / 8192 * 200)); }
    else if (type === 0xB0) { const names = { 1: "Modulation wheel", 7: "Channel volume", 10: "Pan", 11: "Expression", 64: "Sustain pedal" };
      mlog(bytes, `Control Change · ch ${ch} · CC${d1} ${names[d1] || ""} = ${d2}${d1 === 64 ? (d2 >= 64 ? " (down)" : " (up)") : ""}`);
      if (d1 === 1) { MS.mod = d2; MS.voices.forEach(v => v.setLfo(d2 / 127 * 60)); }
      if (d1 === 64) { MS.sus = d2 >= 64; if (!MS.sus) { MS.sustained.forEach(m => { const v = MS.voices.get(m); if (v) { v.stop(); MS.voices.delete(m); } }); MS.sustained.clear(); } } }
    else if (type === 0xC0) { MS.prog = d1; const g = GM.find(x => x[0] === d1); mlog(bytes, `Program Change · ch ${ch} · program ${d1} (shown to musicians as ${d1 + 1})${g ? ": " + g[1] : ""}`); }
    else mlog(bytes, `Other message (status ${hex(st)})`);
    if (fromDevice) { const s = $q("#midiSus"); if (s) s.setAttribute("aria-pressed", MS.sus); }
  }
  KB.midi = { base: 60, on: (m, v) => midiIn([0x90 | MS.ch, m, v]), off: m => midiIn([0x80 | MS.ch, m, 64]) };
  const midiToy = () => `<div class="toy" data-toy="midi">
    <div class="toy-row"><label>Channel <select data-mt="ch">${Array.from({ length: 16 }, (_, i) => `<option value="${i}" ${i === MS.ch ? "selected" : ""}>${i + 1}</option>`).join("")}</select></label>
      <label>Program <select data-mt="prog">${GM.map(g => `<option value="${g[0]}" ${g[0] === MS.prog ? "selected" : ""}>${g[0] + 1}. ${g[1]}</option>`).join("")}</select></label>
      <button class="play" id="midiSus" data-mt="sus" aria-pressed="${MS.sus}">Sustain pedal</button>
      ${navigator.requestMIDIAccess ? `<button class="play" data-mt="dev">Use my MIDI keyboard</button>` : ""}</div>
    <div class="toy-row wheels"><label class="wheel">Pitch bend<input type="range" data-mt="bend" min="-8192" max="8191" value="0" step="1"></label><label class="wheel">Mod wheel (CC1)<input type="range" data-mt="mod" min="0" max="127" value="${MS.mod}"></label></div>
    ${keyboard("midi", 48, 72)}
    <p class="lnote">Click lower on a key for a harder (louder) hit. The pitch bend springs back to the center when you let go.</p>
    <div class="midimon"><p><b>MIDI monitor</b> (newest first): status byte, data bytes, meaning</p><ol id="midiLog" aria-live="polite" tabindex="0" aria-label="MIDI messages">${MS.log.map(x => `<li><code>${x.bytes.map(hex).join(" ")}</code><span>${esc(x.text)}</span></li>`).join("")}</ol></div></div>`;
  document.addEventListener("input", e => {
    const t = e.target.closest("[data-mt]"); if (!t) return; const k = t.dataset.mt;
    if (k === "bend") { const v = +t.value + 8192; midiIn([0xE0 | MS.ch, v & 127, v >> 7]); }
    if (k === "mod") midiIn([0xB0 | MS.ch, 1, +t.value]);
  });
  document.addEventListener("change", e => {
    const t = e.target.closest("[data-mt]"); if (!t) return; const k = t.dataset.mt;
    if (k === "ch") MS.ch = +t.value;
    if (k === "prog") midiIn([0xC0 | MS.ch, +t.value]);
    if (k === "bend") { t.value = 0; midiIn([0xE0 | MS.ch, 0, 64]); }
  });
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-mt]"); if (!t) return; const k = t.dataset.mt;
    if (k === "sus") { midiIn([0xB0 | MS.ch, 64, MS.sus ? 0 : 127]); t.setAttribute("aria-pressed", MS.sus); }
    if (k === "dev") navigator.requestMIDIAccess().then(acc => { let n = 0; acc.inputs.forEach(inp => { n++; inp.onmidimessage = ev => { if (ev.data[0] < 0xF0) midiIn([...ev.data], true); }; }); mlog([], n ? `Listening to ${n} MIDI input${n > 1 ? "s" : ""}. Play your keyboard.` : "No MIDI inputs found. Connect a keyboard and try again."); }, () => mlog([], "MIDI access was blocked or isn't available in this browser."));
  });

  // ================= drum and synth sounds =================
  function drum(kind, t, dest, vel = 1, note) {
    const g = AC.createGain(); g.connect(dest); const v = vel;
    const env = (a, d, peak) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak * v, t + a); g.gain.exponentialRampToValueAtTime(.001, t + a + d); };
    const nz = (type, f, q, len) => { const s = AC.createBufferSource(), fl = AC.createBiquadFilter(); s.buffer = noise(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; s.connect(fl); fl.connect(g); s.start(t, Math.random() * .5); s.stop(t + len); };
    const osc = (type, f0, f1, len, gg) => { const o = AC.createOscillator(), og = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + len * .6); og.gain.value = gg; o.connect(og); og.connect(g); o.start(t); o.stop(t + len); };
    if (kind === "kick") { env(.003, .45, 1); osc("sine", 150, 42, .5, 1); }
    if (kind === "snare") { env(.002, .22, .7); nz("bandpass", 2200, .8, .25); osc("triangle", 190, 160, .12, .5); }
    if (kind === "clap") { g.gain.setValueAtTime(0, t); [0, .01, .02].forEach(o => { g.gain.linearRampToValueAtTime(.7 * v, t + o + .001); g.gain.exponentialRampToValueAtTime(.2 * v, t + o + .008); }); g.gain.exponentialRampToValueAtTime(.001, t + .2); nz("bandpass", 1300, 1.2, .25); }
    if (kind === "chh") { env(.001, .05, .35); nz("highpass", 7500, .7, .08); }
    if (kind === "ohh") { env(.002, .32, .3); nz("highpass", 7000, .7, .4); }
    if (kind === "tom") { env(.003, .3, .8); osc("sine", 160, 95, .35, 1); }
    if (kind === "cow") { env(.001, .18, .35); const bp = AC.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 800; g.disconnect(); g.connect(bp); bp.connect(dest); osc("square", 540, 0, .2, .5); osc("square", 800, 0, .2, .5); }
    if (kind === "beep") { env(.004, .12, .22); osc("square", mtof(note), 0, .16, .6); }
    if (kind === "boop") { env(.004, .25, .5); osc("sine", mtof(note) * 1.5, mtof(note), .3, 1); }
  }

  // ================= drum machine (step sequencer) =================
  const ROWS = [["kick", "Kick"], ["snare", "Snare"], ["clap", "Clap"], ["chh", "Closed hi-hat"], ["ohh", "Open hi-hat"], ["tom", "Tom"], ["cow", "Cowbell"], ["beep", "Beep (pitched)"], ["boop", "Boop (pitched)"]];
  const DM = { beats: 4, div: 4, bpm: 100, swing: 0, brush: 72, grid: {}, playing: false, step: -1 };
  const steps = () => DM.beats * DM.div;
  function dmPreset(name) {
    DM.grid = {}; const set = (r, i, v = true) => { if (i < steps()) DM.grid[r + ":" + i] = v; };
    const D = DM.div, B = DM.beats;
    if (name === "rock") { for (let b = 0; b < B; b++) { set(b % 2 ? "snare" : "kick", b * D); for (let s = 0; s < D; s += Math.max(1, Math.floor(D / 2))) set("chh", b * D + s); } }
    if (name === "four") { for (let b = 0; b < B; b++) { set("kick", b * D); if (D % 2 === 0) set("ohh", b * D + D / 2); if (b % 2) set("clap", b * D); } }
    if (name === "clave") { DM.beats = 4; DM.div = 4; [0, 3, 6, 10, 12].forEach(i => set("cow", i)); [0, 8].forEach(i => set("kick", i)); }
    if (name === "melody") { const sc = [60, 62, 64, 67, 69, 72, 74, 76]; for (let i = 0; i < steps(); i += Math.max(1, Math.floor(D / 2))) if (Math.random() < .7) set("beep", i, sc[Math.floor(Math.random() * sc.length)]); for (let b = 0; b < B; b++) set("boop", b * D, [48, 43, 45, 41][b % 4]); }
  }
  const PITCHES = []; for (let m = 36; m <= 96; m++) PITCHES.push(m);
  const dmToy = () => {
    const n = steps(), cells = r => Array.from({ length: n }, (_, i) => { const v = DM.grid[r + ":" + i], beat = Math.floor(i / DM.div) + 1, d = i % DM.div + 1;
      return `<button class="dmc${i % DM.div === 0 ? " beat" : ""}${v ? " on" : ""}" data-dm="${r}:${i}" aria-pressed="${!!v}" aria-label="${r}, beat ${beat}${DM.div > 1 ? `, part ${d} of ${DM.div}` : ""}${typeof v === "number" ? ", " + nn(v) : ""}">${typeof v === "number" ? `<small>${nn(v)}</small>` : ""}</button>`; }).join("");
    return `<div class="toy" data-toy="dm">
      <div class="toy-row"><button class="play" data-dmx="play">${DM.playing ? "■ Stop" : "▶ Play"}</button>
        <label>Tempo <input type="number" data-dmx="bpm" min="30" max="300" value="${DM.bpm}"> BPM</label>
        <label>Beats <input type="number" data-dmx="beats" min="1" max="16" value="${DM.beats}"></label>
        <label>Divisions per beat <input type="number" data-dmx="div" min="1" max="8" value="${DM.div}"></label>
        <label>Swing <input type="range" data-dmx="swing" min="0" max="60" value="${DM.swing}"></label></div>
      <div class="toy-row"><label>Pitch for beeps and boops <select data-dmx="brush">${PITCHES.map(m => `<option value="${m}" ${m === DM.brush ? "selected" : ""}>${nn(m)}</option>`).join("")}</select></label>
        <button class="play" data-dmx="p:rock">Rock beat</button><button class="play" data-dmx="p:four">Four on the floor</button><button class="play" data-dmx="p:clave">Clave</button><button class="play" data-dmx="p:melody">Random melody</button><button class="play" data-dmx="p:clear">Clear</button></div>
      <div class="dmgrid" tabindex="0" role="region" aria-label="Drum machine grid" style="--n:${n}">${ROWS.map(([r, l]) => `<div class="dmrow"><span class="dml">${l}</span><div class="dmcells">${cells(r)}</div></div>`).join("")}</div>
      <p class="lnote">${DM.beats} beats × ${DM.div} division${DM.div > 1 ? "s" : ""} = ${n} steps per loop. Try 3 or 6 divisions for triplet and compound feels, 5 or 7 for something unusual.</p></div>`;
  };
  const dmRedraw = () => { const t = $q('[data-toy="dm"]'); if (t) { t.outerHTML = dmToy(); } };
  document.addEventListener("click", e => {
    const c = e.target.closest("[data-dm]"); if (c) { const [r] = c.dataset.dm.split(":"), key = c.dataset.dm, pitched = r === "beep" || r === "boop", cur = DM.grid[key];
      if (pitched) { if (cur === DM.brush) delete DM.grid[key]; else DM.grid[key] = DM.brush; } else { if (cur) delete DM.grid[key]; else DM.grid[key] = true; }
      const v = DM.grid[key]; c.classList.toggle("on", !!v); c.setAttribute("aria-pressed", !!v); c.innerHTML = typeof v === "number" ? `<small>${nn(v)}</small>` : "";
      if (v && ac()) drum(r, AC.currentTime + .01, OUT, .9, typeof v === "number" ? v : 60); return; }
    const x = e.target.closest("[data-dmx]"); if (!x) return; const k = x.dataset.dmx;
    if (k === "play") { DM.playing ? dmStop() : dmStart(); x.textContent = DM.playing ? "■ Stop" : "▶ Play"; }
    if (k.startsWith("p:")) { const p = k.slice(2); if (p === "clear") DM.grid = {}; else dmPreset(p); dmRedraw(); }
  });
  document.addEventListener("change", e => {
    const x = e.target.closest("[data-dmx]"); if (!x) return; const k = x.dataset.dmx, v = +x.value;
    if (k === "bpm") DM.bpm = Math.max(30, Math.min(300, v || 100));
    if (k === "beats" || k === "div") { const old = { b: DM.beats, d: DM.div }, ng = {}; DM[k] = Math.max(1, Math.min(k === "beats" ? 16 : 8, Math.round(v) || 1));
      Object.entries(DM.grid).forEach(([key, val]) => { const [r, i] = key.split(":"), b = Math.floor(i / old.d), s = i % old.d, frac = s / old.d, ns = Math.round(frac * DM.div); if (b < DM.beats && ns < DM.div) ng[r + ":" + (b * DM.div + ns)] = val; });
      DM.grid = ng; dmRedraw(); }
    if (k === "brush") DM.brush = v;
  });
  document.addEventListener("input", e => { const x = e.target.closest('[data-dmx="swing"]'); if (x) DM.swing = +x.value; });
  let dmTimer = 0, dmNext = 0, dmI = 0, dmQ = [];
  function dmStart() { if (!ac()) return; DM.playing = true; dmI = 0; dmNext = AC.currentTime + .08; dmQ = []; dmTimer = setInterval(dmTick, 25); requestAnimationFrame(dmDraw); }
  function dmStop() { DM.playing = false; clearInterval(dmTimer); document.querySelectorAll(".dmc.now").forEach(c => c.classList.remove("now")); }
  function dmTick() {
    if (!$q('[data-toy="dm"]')) { dmStop(); return; }
    const stepDur = 60 / DM.bpm / DM.div;
    while (dmNext < AC.currentTime + .12) {
      const i = dmI % steps(), sw = DM.div % 2 === 0 && i % 2 === 1 ? DM.swing / 100 * stepDur * .66 : 0, t = dmNext + sw;
      ROWS.forEach(([r]) => { const v = DM.grid[r + ":" + i]; if (v) drum(r, t, OUT, i % DM.div === 0 ? 1 : .8, typeof v === "number" ? v : 60); });
      dmQ.push([t, i]); dmNext += stepDur; dmI++;
    }
  }
  function dmDraw() {
    if (!DM.playing) return; let cur = null; while (dmQ.length && dmQ[0][0] <= AC.currentTime) cur = dmQ.shift()[1];
    if (cur != null) { document.querySelectorAll(".dmc.now").forEach(c => c.classList.remove("now")); document.querySelectorAll(`[data-dm$=":${cur}"]`).forEach(c => c.classList.add("now")); }
    requestAnimationFrame(dmDraw);
  }

  // ================= synthesizer =================
  const SY = { wave: "sawtooth", osc2: 7, cutoff: 1800, res: 4, a: .01, d: .3, s: .6, r: .4, lfoRate: 5, lfoDepth: 0, lfoTo: "pitch", oct: 0, voices: new Map() };
  const SYP = { Bass: { wave: "sawtooth", osc2: null, cutoff: 600, res: 6, a: .005, d: .25, s: .4, r: .12, lfoDepth: 0, oct: -12 }, Pad: { wave: "sawtooth", osc2: 9, cutoff: 1400, res: 1, a: .9, d: 1, s: .8, r: 1.6, lfoRate: .3, lfoDepth: .3, lfoTo: "filter", oct: 0 },
    Pluck: { wave: "square", osc2: null, cutoff: 2500, res: 3, a: .002, d: .18, s: 0, r: .15, lfoDepth: 0, oct: 0 }, Lead: { wave: "square", osc2: 5, cutoff: 3500, res: 2, a: .01, d: .2, s: .8, r: .2, lfoRate: 5.5, lfoDepth: .25, lfoTo: "pitch", oct: 12 },
    Wobble: { wave: "sawtooth", osc2: 12, cutoff: 500, res: 12, a: .01, d: .2, s: .9, r: .2, lfoRate: 3, lfoDepth: .9, lfoTo: "filter", oct: -12 }, Flute: { wave: "sine", osc2: null, cutoff: 6000, res: .7, a: .08, d: .2, s: .9, r: .25, lfoRate: 5, lfoDepth: .1, lfoTo: "pitch", oct: 12 } };
  KB.synth = { base: 60, on: (m, v) => { const mm = m + SY.oct, old = SY.voices.get(m); if (old) old.stop(); SY.voices.set(m, voice(mm, v, SY)); }, off: m => { const x = SY.voices.get(m); if (x) { x.stop(); SY.voices.delete(m); } } };
  const envSVG = () => { const W = 260, H = 70, tot = SY.a + SY.d + .6 + SY.r, x = s => 6 + (W - 12) * s / tot, y = v => H - 6 - (H - 12) * v;
    return `<svg viewBox="0 0 ${W} ${H}" class="envsvg" role="img" aria-label="Envelope: attack ${SY.a} s, decay ${SY.d} s, sustain ${Math.round(SY.s * 100)}%, release ${SY.r} s"><polyline fill="none" stroke="currentColor" stroke-width="2.5" points="${x(0)},${y(0)} ${x(SY.a)},${y(1)} ${x(SY.a + SY.d)},${y(SY.s)} ${x(SY.a + SY.d + .6)},${y(SY.s)} ${x(tot)},${y(0)}"/><g font-size="11" fill="currentColor"><text x="${x(SY.a / 2) - 3}" y="${H - 1}">A</text><text x="${x(SY.a + SY.d / 2) - 3}" y="${H - 1}">D</text><text x="${x(SY.a + SY.d + .3) - 3}" y="${H - 1}">S</text><text x="${x(SY.a + SY.d + .6 + SY.r / 2) - 3}" y="${H - 1}">R</text></g></svg>`; };
  const sl = (k, label, min, max, step, fmt) => `<label class="syk">${label}<input type="range" data-sy="${k}" min="${min}" max="${max}" step="${step}" value="${SY[k]}"><output data-syo="${k}">${fmt(SY[k])}</output></label>`;
  const FMT = { cutoff: v => Math.round(v) + " Hz", res: v => (+v).toFixed(1), a: v => (+v).toFixed(2) + " s", d: v => (+v).toFixed(2) + " s", s: v => Math.round(v * 100) + "%", r: v => (+v).toFixed(2) + " s", lfoRate: v => (+v).toFixed(1) + " Hz", lfoDepth: v => Math.round(v * 100) + "%" };
  const synthToy = () => `<div class="toy" data-toy="synth">
    <div class="toy-row"><span>Presets:</span>${Object.keys(SYP).map(p => `<button class="play" data-syp="${p}">${p}</button>`).join("")}</div>
    <div class="sygrid">
      <fieldset><legend>Oscillators</legend><label class="syk">Wave<select data-sy="wave">${["sine", "triangle", "square", "sawtooth"].map(w => `<option ${w === SY.wave ? "selected" : ""}>${w}</option>`).join("")}</select></label>
        <label class="syk">2nd oscillator<select data-sy="osc2"><option value="off" ${SY.osc2 == null ? "selected" : ""}>off</option>${[5, 7, 9, 12, 700, 1200].map(c => `<option value="${c}" ${SY.osc2 === c ? "selected" : ""}>${c < 100 ? `detuned ${c} cents` : c === 700 ? "a 5th up" : "an octave up"}</option>`).join("")}</select></label>
        <label class="syk">Octave<select data-sy="oct">${[-24, -12, 0, 12, 24].map(o => `<option value="${o}" ${SY.oct === o ? "selected" : ""}>${o > 0 ? "+" : ""}${o / 12}</option>`).join("")}</select></label></fieldset>
      <fieldset><legend>Filter (low-pass)</legend>${sl("cutoff", "Cutoff", 80, 8000, 1, FMT.cutoff)}${sl("res", "Resonance", .1, 20, .1, FMT.res)}</fieldset>
      <fieldset><legend>Envelope (ADSR)</legend>${sl("a", "Attack", 0, 2, .01, FMT.a)}${sl("d", "Decay", 0, 2, .01, FMT.d)}${sl("s", "Sustain", 0, 1, .01, FMT.s)}${sl("r", "Release", 0, 3, .01, FMT.r)}<div id="syEnv">${envSVG()}</div></fieldset>
      <fieldset><legend>LFO</legend>${sl("lfoRate", "Rate", .1, 15, .1, FMT.lfoRate)}${sl("lfoDepth", "Depth", 0, 1, .01, FMT.lfoDepth)}<label class="syk">Moves<select data-sy="lfoTo">${["pitch", "filter", "volume"].map(w => `<option ${w === SY.lfoTo ? "selected" : ""}>${w}</option>`).join("")}</select></label></fieldset>
    </div>
    ${keyboard("synth", 48, 72)}
    <p class="lnote">Click the keyboard or the box above it, then use the computer keys A W S E D F T G Y H U J K. Hold a note while moving the sliders: new settings apply to the next note.</p></div>`;
  document.addEventListener("input", e => { const x = e.target.closest("[data-sy]"); if (!x || x.tagName !== "INPUT") return; const k = x.dataset.sy; SY[k] = +x.value; const o = $q(`[data-syo="${k}"]`); if (o) o.textContent = FMT[k](SY[k]); if ("adsr".includes(k)) { const ev = $q("#syEnv"); if (ev) ev.innerHTML = envSVG(); } });
  document.addEventListener("change", e => { const x = e.target.closest("[data-sy]"); if (!x || x.tagName !== "SELECT") return; const k = x.dataset.sy; SY[k] = k === "wave" || k === "lfoTo" ? x.value : x.value === "off" ? null : +x.value; });
  document.addEventListener("click", e => { const p = e.target.closest("[data-syp]"); if (!p) return; Object.assign(SY, { lfoRate: 5, lfoTo: "pitch" }, SYP[p.dataset.syp]); const t = $q('[data-toy="synth"]'); if (t) t.outerHTML = synthToy(); const kb = $q('[data-toy="synth"] [data-kbn="60"]'); if (kb && ac()) { KB.synth.on(60, 100); setTimeout(() => KB.synth.off(60), 450); } });

  // ================= mini mixer: channels, buses, sends =================
  const TR = [["drums", "Drums"], ["bass", "Bass"], ["keys", "Keys"], ["lead", "Lead"]];
  const MX = { ch: {}, bus: 0.8, rev: 0.7, master: 0.85, busComp: false, playing: false };
  TR.forEach(([k]) => MX.ch[k] = { vol: .8, pan: k === "keys" ? -.4 : k === "lead" ? .4 : 0, mute: false, solo: false, send: k === "lead" ? .3 : 0, out: "master" });
  let G = null;
  function mixGraph() {
    if (G) return G; G = { ch: {} };
    G.master = AC.createGain(); G.mAn = AC.createAnalyser(); G.mAn.fftSize = 512; G.master.connect(G.mAn); G.mAn.connect(OUT);
    G.bus = AC.createGain(); G.comp = AC.createDynamicsCompressor(); G.comp.threshold.value = -24; G.comp.ratio.value = 4; G.busIn = AC.createGain(); G.bAn = AC.createAnalyser(); G.bAn.fftSize = 512;
    G.busIn.connect(G.bus); G.bus.connect(G.bAn); G.bAn.connect(G.master);
    const len = AC.sampleRate * 2.6, ir = AC.createBuffer(2, len, AC.sampleRate); for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    G.revIn = AC.createGain(); G.conv = AC.createConvolver(); G.conv.buffer = ir; G.ret = AC.createGain(); G.rAn = AC.createAnalyser(); G.rAn.fftSize = 512; G.revIn.connect(G.conv); G.conv.connect(G.ret); G.ret.connect(G.rAn); G.rAn.connect(G.master);
    TR.forEach(([k]) => { const c = { in: AC.createGain(), fader: AC.createGain(), pan: AC.createStereoPanner(), mute: AC.createGain(), send: AC.createGain(), an: AC.createAnalyser() };
      c.an.fftSize = 512; c.in.connect(c.fader); c.fader.connect(c.pan); c.pan.connect(c.mute); c.mute.connect(c.an); c.mute.connect(c.send); c.send.connect(G.revIn); G.ch[k] = c; });
    mixApply(); return G;
  }
  function mixApply() {
    if (!G) return; const anySolo = TR.some(([k]) => MX.ch[k].solo);
    TR.forEach(([k]) => { const s = MX.ch[k], c = G.ch[k]; c.fader.gain.value = s.vol; c.pan.pan.value = s.pan; c.mute.gain.value = s.mute || (anySolo && !s.solo) ? 0 : 1; c.send.gain.value = s.send; c.an.disconnect(); c.an.connect(s.out === "bus" ? G.busIn : G.master); });
    G.bus.gain.value = MX.bus; G.ret.gain.value = MX.rev; G.master.gain.value = MX.master;
    G.busIn.disconnect(); if (MX.busComp) { G.busIn.connect(G.comp); G.comp.connect(G.bus); } else G.busIn.connect(G.bus);
    const fl = $q("#mixFlow"); if (fl) fl.innerHTML = flowText();
  }
  const flowText = () => TR.map(([k, l]) => { const s = MX.ch[k]; return `${l} → ${s.out === "bus" ? "Bus 1 → " : ""}Master${s.send > 0 ? ` (and a send → Reverb → Master)` : ""}`; }).join("<br>");
  // a 2-bar loop at 104 BPM
  const MBPM = 104, CH = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], BASS = [45, 41, 36, 43], LEAD = [76, 74, 72, 74, 76, 79, 76, 74, 72, 69, 72, 74, 72, 71, 67, 69];
  function mixNote(k, t, m, dur) {
    const c = G.ch[k].in;
    if (k === "drums") return;
    const o = AC.createOscillator(), g = AC.createGain(), f = AC.createBiquadFilter(); o.type = k === "bass" ? "sawtooth" : k === "keys" ? "triangle" : "square"; o.frequency.value = mtof(m); f.type = "lowpass"; f.frequency.value = k === "bass" ? 700 : k === "lead" ? 2600 : 3000;
    const pk = k === "bass" ? .28 : k === "keys" ? .1 : .07; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(pk, t + .01); g.gain.setTargetAtTime(pk * .5, t + .02, .2); g.gain.setTargetAtTime(0, t + dur, .05);
    o.connect(f); f.connect(g); g.connect(c); o.start(t); o.stop(t + dur + .4);
  }
  let mxTimer = 0, mxNext = 0, mxI = 0;
  function mixTick() {
    if (!$q('[data-toy="mix"]')) { mixStop(); return; }
    const e8 = 60 / MBPM / 2;
    while (mxNext < AC.currentTime + .15) {
      const i = mxI % 32, bar = Math.floor(i / 8) % 4, t = mxNext;
      if (i % 4 === 0) drum("kick", t, G.ch.drums.in); if (i % 8 === 4) drum("snare", t, G.ch.drums.in); drum("chh", t, G.ch.drums.in, i % 2 ? .6 : .9);
      if (i % 8 === 0) CH[bar].forEach(m => mixNote("keys", t, m, e8 * 7)); if (i % 2 === 0) mixNote("bass", t, BASS[bar], e8 * 1.6);
      if (i % 2 === 0) mixNote("lead", t, LEAD[(i / 2) % 16], e8 * 1.8);
      mxNext += e8; mxI++;
    }
  }
  function mixStart() { if (!ac()) return; mixGraph(); MX.playing = true; mxNext = AC.currentTime + .1; mxI = 0; mxTimer = setInterval(mixTick, 25); requestAnimationFrame(meters); }
  function mixStop() { MX.playing = false; clearInterval(mxTimer); }
  const buf = new Float32Array(512);
  function level(an) { an.getFloatTimeDomainData(buf); let s = 0; for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i]; return Math.sqrt(s / buf.length); }
  function meters() {
    if (!G) return; const set = (id, an) => { const el = document.getElementById(id); if (el) el.style.height = Math.min(100, Math.max(0, (20 * Math.log10(level(an) + 1e-6) + 48) / 48 * 100)) + "%"; };
    TR.forEach(([k]) => set("mtr-" + k, G.ch[k].an)); set("mtr-bus", G.bAn); set("mtr-rev", G.rAn); set("mtr-master", G.mAn);
    if (MX.playing || level(G.mAn) > .001) requestAnimationFrame(meters);
  }
  const dB = v => v <= .001 ? "−∞" : (20 * Math.log10(v)).toFixed(1);
  const strip = (id, label, vol, extra) => `<div class="strip"><b>${label}</b>${extra || ""}<div class="fadebox"><input type="range" class="fader" data-mx="${id}:vol" min="0" max="1.4" step=".01" value="${vol}" aria-label="${label} fader" orient="vertical"><span class="meter" aria-hidden="true"><i id="mtr-${id}"></i></span></div><output data-mxo="${id}">${dB(vol)} dB</output></div>`;
  const mixToy = () => `<div class="toy" data-toy="mix">
    <div class="toy-row"><button class="play" data-mxb="play">${MX.playing ? "■ Stop" : "▶ Play the loop"}</button><span class="lnote">A 4-bar loop at ${MBPM} BPM in 4/4.</span></div>
    <div class="mixer" tabindex="0" role="region" aria-label="Mixer channels">${TR.map(([k, l]) => { const s = MX.ch[k]; return strip(k, l, s.vol, `
      <div class="ms"><button class="mbtn" data-mx="${k}:mute" aria-pressed="${s.mute}" aria-label="Mute ${l}">M</button><button class="mbtn" data-mx="${k}:solo" aria-pressed="${s.solo}" aria-label="Solo ${l}">S</button></div>
      <label class="mk">Pan<input type="range" data-mx="${k}:pan" min="-1" max="1" step=".05" value="${s.pan}"></label>
      <label class="mk">Send → Reverb<input type="range" data-mx="${k}:send" min="0" max="1" step=".01" value="${s.send}"></label>
      <label class="mk">Output<select data-mx="${k}:out"><option value="master" ${s.out === "master" ? "selected" : ""}>Master</option><option value="bus" ${s.out === "bus" ? "selected" : ""}>Bus 1</option></select></label>`); }).join("")}
      <span class="mixdiv" aria-hidden="true"></span>
      ${strip("bus", "Bus 1", MX.bus, `<label class="mk"><input type="checkbox" data-mx="bus:comp" ${MX.busComp ? "checked" : ""}> Compressor</label>`)}
      ${strip("rev", "Reverb return", MX.rev, `<p class="mk lnote">An aux (FX) bus fed by the sends.</p>`)}
      ${strip("master", "Master", MX.master)}</div>
    <p class="lnote"><b>Signal flow:</b><br><span id="mixFlow">${flowText()}</span></p></div>`;
  document.addEventListener("input", e => { const x = e.target.closest("[data-mx]"); if (!x) return; const [id, k] = x.dataset.mx.split(":"), v = +x.value;
    if (k === "vol") { if (id === "bus") MX.bus = v; else if (id === "rev") MX.rev = v; else if (id === "master") MX.master = v; else MX.ch[id].vol = v; const o = $q(`[data-mxo="${id}"]`); if (o) o.textContent = dB(v) + " dB"; }
    if (k === "pan" || k === "send") MX.ch[id][k] = v; mixApply(); });
  document.addEventListener("change", e => { const x = e.target.closest("[data-mx]"); if (!x) return; const [id, k] = x.dataset.mx.split(":");
    if (k === "out") MX.ch[id].out = x.value; if (k === "comp") MX.busComp = x.checked; mixApply(); });
  document.addEventListener("click", e => { const x = e.target.closest("[data-mx]"); if (x && x.tagName === "BUTTON") { const [id, k] = x.dataset.mx.split(":"); MX.ch[id][k] = !MX.ch[id][k]; x.setAttribute("aria-pressed", MX.ch[id][k]); mixApply(); return; }
    const b = e.target.closest('[data-mxb="play"]'); if (b) { MX.playing ? mixStop() : mixStart(); b.textContent = MX.playing ? "■ Stop" : "▶ Play the loop"; } });
  // ===================== end of toys =====================

  const F = {
    audio: [
      ["The sample rate of digital audio is…", "how many times per second the sound wave is measured", ["how loud the audio is", "how many bits each sample has", "how many tracks there are"], "CD audio uses 44,100 samples per second (44.1 kHz); video and most production work use 48 kHz."],
      ["The highest frequency a digital system can record is…", "half the sample rate (the Nyquist frequency)", ["the sample rate", "twice the sample rate", "20 Hz"], "At 44.1 kHz that's 22,050 Hz, just above the limit of human hearing."],
      ["Bit depth sets…", "how precisely each sample's level is stored, and so the dynamic range", ["the highest pitch", "the tempo", "the number of channels"], "Each bit adds about 6 dB: 16-bit ≈ 96 dB, 24-bit ≈ 144 dB in theory."],
      ["WAV and AIFF files are usually…", "uncompressed", ["lossy, like MP3", "MIDI files", "video files"], "FLAC and ALAC are lossless compressed; MP3, AAC and Ogg Vorbis are lossy."],
      ["A lossy format such as MP3 or AAC makes files smaller by…", "discarding detail that listeners are less likely to notice", ["lowering the pitch", "removing the drums", "storing only MIDI"], "Good for streaming and portable listening; keep lossless masters for production."],
      ["Latency in a recording setup is…", "the delay between a sound going in and coming back out", ["the length of a song", "a kind of distortion", "the tempo of the click"], "Smaller audio buffers lower the latency but work the computer harder."],
      ["Clipping happens when…", "a digital signal goes above 0 dBFS, the loudest level the system can store", ["the volume is too low", "the sample rate is too high", "a MIDI note is too long"], "The waveform's peaks are flattened and it distorts. Leave headroom when recording."],
      ["An audio interface…", "converts between analog sound (mics, speakers) and digital audio for the computer", ["is a kind of synthesizer", "prints sheet music", "is a streaming service"], "It contains the analog-to-digital and digital-to-analog converters, mic preamps and headphone outputs."],
      ["MIDI carries…", "performance instructions (which note, how hard, when), not sound", ["recorded audio", "MP3 files", "sheet music images"], "A synthesizer or sampler turns MIDI into sound."],
      ["MIDI note velocity runs from…", "0 to 127", ["0 to 100", "1 to 16", "0 to 255"], "Velocity usually controls loudness and brightness. MIDI 1.0 has 16 channels."],
    ],
    daw: [
      ["DAW stands for…", "digital audio workstation", ["digital audio waveform", "direct audio wiring", "dynamic audio window"], "Software for recording, editing, arranging and mixing audio and MIDI."],
      ["Editing in a DAW is usually non-destructive, meaning…", "the original recordings aren't changed; edits can be undone or adjusted", ["edits permanently overwrite the files", "you can't cut audio", "only MIDI can be edited"], "Clips point to the audio files; trimming, fades and moves can be revised later."],
      ["An insert effect on a track…", "processes that track's whole signal (e.g. EQ, compression)", ["is shared by many tracks", "records new audio", "changes the tempo"], "Insert effects are in the signal chain; effects like reverb are often put on a shared bus and fed with sends."],
      ["A send…", "routes a copy of a track's signal to a bus, often with a shared reverb or delay", ["deletes the track", "exports the song", "quantizes MIDI"], "Several tracks can share one reverb, which saves processing and glues the mix together."],
      ["Automation in a DAW…", "records changes to settings (volume, pan, effect levels) over time", ["writes the melody", "adds a click track", "converts audio to MIDI"], "Drawn as lines or curves on a track's lane."],
      ["Quantizing MIDI notes…", "moves them toward the nearest grid position", ["changes their pitch", "makes them louder", "turns them into audio"], "Partial quantize or swing settings keep some human feel."],
      ["The piano roll shows…", "MIDI notes as bars on a grid of pitch against time", ["audio waveforms", "the mixer", "a printed score"], "Bar length = duration; vertical position = pitch."],
      ["Common plug-in formats are…", "VST3, AU and AAX", ["MP3, WAV and AIFF", "PDF, PNG and SVG", "MIDI, OSC and DMX"], "AU is Apple's; AAX is for Pro Tools; VST3 works in most DAWs."],
      ["'Bouncing' a mix means…", "rendering the tracks and effects into a single audio file", ["deleting the project", "speeding it up", "printing the score"], "Also called exporting or mixdown."],
      ["Which DAW layout is built around launching loops and clips in real time?", "a clip (session) view, as in Ableton Live or Bitwig", ["a notation view", "a cue sheet", "a tape machine"], "Most DAWs also have a linear timeline (arrangement) view."],
    ],
    synth: [
      ["In subtractive synthesis, the filter…", "removes some overtones from a bright oscillator wave", ["adds new notes", "changes the tempo", "records audio"], "A low-pass filter's cutoff sets how bright the sound is; resonance boosts the area near the cutoff."],
      ["ADSR stands for…", "attack, decay, sustain, release", ["audio, delay, sample, rate", "amplitude, distortion, sine, reverb", "attack, delay, sweep, reverse"], "An envelope shapes a sound over time from key-down to after key-up."],
      ["An LFO (low-frequency oscillator) is used to…", "move another setting slowly and repeatedly, e.g. vibrato or a filter wobble", ["make the bass notes", "record vocals", "set the sample rate"], "It runs below the audible range, typically under 20 Hz."],
      ["A sawtooth wave is…", "bright, containing all the harmonics", ["pure, with no harmonics", "only odd harmonics", "silent"], "Square waves have odd harmonics; sine waves have none."],
      ["FM synthesis makes tones by…", "using one oscillator to vary another's frequency very fast", ["filtering noise", "playing back recordings", "layering drum loops"], "Known for bells, metallic tones and electric pianos."],
      ["A sampler or sample library…", "plays recordings of real sounds, mapped across the keyboard", ["synthesizes sine waves only", "prints parts", "measures loudness"], "Orchestral libraries record each instrument at several dynamics and articulations."],
      ["Polyphony on a synthesizer means…", "how many notes it can play at once", ["how loud it is", "how many presets it has", "its tuning system"], "A monophonic synth plays one note at a time."],
      ["Wavetable synthesis…", "moves through a series of stored single-cycle waveforms", ["only uses sine waves", "needs a microphone", "is the same as sampling a whole song"], "Sweeping the wavetable position changes the timbre over time."],
      ["A virtual instrument is…", "software that makes sound inside the DAW from MIDI", ["a hardware keyboard", "an audio interface", "a microphone model"], "Also called a soft synth or instrument plug-in."],
    ],
    nota: [
      ["MusicXML is used to…", "exchange notated music between notation programs", ["compress audio", "control lights", "stream music"], "Most notation software can import and export it."],
      ["A free, open-source notation program is…", "MuseScore", ["Pro Tools", "Logic Pro", "Auto-Tune"], "Dorico and Sibelius are commercial; LilyPond is a free text-based engraver."],
      ["Step-time entry in notation software means…", "choosing a duration, then entering pitches one at a time", ["recording while a click plays", "singing into a microphone", "scanning paper music"], "Real-time entry records from a MIDI keyboard and needs cleanup."],
      ["Why do notation programs generate parts automatically?", "each player's part comes from the same score data, so changes stay consistent", ["parts are printed in the DAW", "parts are always handwritten", "to save audio space"], "Part layouts still need checking for page turns, cues and multi-bar rests."],
      ["Playback from notation software is…", "a useful check, but no substitute for real players' judgment", ["exactly how an orchestra will sound", "required for printing", "always in perfect balance"], "Libraries can make impossible or badly balanced writing sound fine."],
      ["Pitch-correction software such as Auto-Tune or Melodyne…", "adjusts the pitch of recorded audio, subtly or as an obvious effect", ["writes notation", "adds reverb", "converts MP3 to WAV"], "Fast retune settings give the well-known robotic effect."],
      ["A DAW known as a standard in professional recording studios is…", "Pro Tools", ["MuseScore", "Dorico", "Finale"], "Logic Pro, Ableton Live, Cubase, FL Studio, Studio One and Reaper are also widely used."],
      ["FL Studio became especially popular with…", "beat makers, for its pattern-based step sequencer", ["orchestral engravers", "church organists", "radio announcers"], "Many hip-hop and electronic producers started on it."],
    ],
  };
  const pick = (H, a) => H.rnd(a);
  const GEN = {
    audio: H => {
      const r = Math.random();
      if (r < .4) { const sr = pick(H, [22050, 32000, 44100, 48000, 88200, 96000]), ny = sr / 2; return H.mc(`At a sample rate of ${sr.toLocaleString("en-US")} Hz, what is the highest frequency that can be recorded?`, `${ny.toLocaleString("en-US")} Hz`, [sr, sr * 2, sr / 4, 20000].map(x => `${x.toLocaleString("en-US")} Hz`), `The Nyquist frequency is half the sample rate.`); }
      if (r < .7) { const buf = pick(H, [64, 128, 256, 512, 1024]), sr = pick(H, [44100, 48000]), ms = (buf / sr * 1000).toFixed(1); return H.mc(`A buffer of ${buf} samples at ${sr / 1000} kHz adds about how much delay?`, `${ms} ms`, [(buf / sr * 2000).toFixed(1), (buf / sr * 500).toFixed(1), (buf / 1000).toFixed(1), (buf / 10).toFixed(1)].map(x => `${x} ms`), `${buf} ÷ ${sr} = ${ms} thousandths of a second (each direction adds its own buffer).`); }
      const bits = pick(H, [8, 16, 20, 24]), db = bits * 6; return H.mc(`About how much dynamic range does ${bits}-bit audio have?`, `${db} dB`, [bits * 3, bits * 12, bits * 6 + 20, 120].filter(x => x !== db).map(x => `${x} dB`), `Each bit adds about 6 dB: ${bits} × 6 ≈ ${db} dB.`);
    },
    synth: H => {
      const names = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"], n = 36 + Math.floor(Math.random() * 48), nm = names[n % 12] + (Math.floor(n / 12) - 1);
      return H.mc(`Middle C (C4) is MIDI note 60. What MIDI note number is ${nm}?`, String(n), [n + 1, n - 1, n + 12, n - 12].map(String), `One number per semitone: ${nm} is ${n - 60 >= 0 ? n - 60 + " above" : 60 - n + " below"} C4, so ${n}.`);
    },
  };
  const lesson = { steps: [
    { title: "Sound becomes numbers", kick: "Sampling", render: () => `<p>A microphone turns air-pressure waves into a changing voltage. An <b>analog-to-digital converter</b> (in an audio interface) measures that voltage thousands of times per second and stores each measurement as a number. Playing back reverses the process.</p>
      <ul><li><b>Sample rate</b>: measurements per second. 44.1 kHz (CD), 48 kHz (video and most production), 96 kHz (some high-resolution work). A system can capture frequencies up to half its sample rate, the <b>Nyquist frequency</b>; higher frequencies must be filtered out first or they fold back as false tones (<b>aliasing</b>).</li>
      <li><b>Bit depth</b>: how finely each measurement is stored. Each bit adds about 6 dB of dynamic range: 16-bit (CD) ≈ 96 dB, 24-bit (recording) ≈ 144 dB in theory.</li>
      <li><b>dBFS</b> (decibels relative to full scale): 0 dBFS is the loudest possible level. Anything above <b>clips</b>, so leave headroom when recording.</li></ul>
      ${tbl("Common audio formats", ["Kind", "Formats", "Use"], [["Uncompressed", "WAV, AIFF", "recording, editing, masters"], ["Lossless compressed", "FLAC, ALAC", "archiving, hi-fi listening"], ["Lossy compressed", "MP3, AAC, Ogg Vorbis, Opus", "streaming, portable files"]])}` },
    { title: "MIDI", kick: "Instructions, not sound", render: () => `<p><b>MIDI</b> (Musical Instrument Digital Interface, 1983) sends performance data: <i>note on</i> (which key, how hard), <i>note off</i>, and controller messages. It contains no sound; a synthesizer or sampler turns it into sound, so the same MIDI part can be played by a piano, strings or a synth.</p>
      <ul><li>Note numbers 0–127, one per semitone: 60 = middle C (C4), 69 = A4.</li><li>Velocity 0–127; 16 channels per connection.</li><li>Continuous controllers (CC): 1 = mod wheel, 7 = volume, 11 = expression, 64 = sustain pedal.</li><li>MIDI 2.0 (2020) adds higher resolution and two-way communication between devices.</li></ul>
      <p>Because MIDI is just data, it's easy to edit: fix wrong notes, change the tempo or the instrument, quantize the timing, or print it as notation.</p>
      <h3>MIDI playground</h3><p>Play the keyboard, bend the pitch, move the mod wheel, press the sustain pedal or change the program, and watch the messages a MIDI controller would send. Each message starts with a <b>status byte</b> (in hexadecimal: 9 = Note On, 8 = Note Off, B = Control Change, C = Program Change, E = Pitch Bend; the second digit is the channel, 0–F for channels 1–16), followed by one or two <b>data bytes</b> (0–127).</p>${midiToy()}` },
    { title: "The digital audio workstation", kick: "Tracks, clips and the mixer", render: () => `<p>A <b>DAW</b> combines a multitrack recorder, an editor, a MIDI sequencer and a mixing desk.</p>
      <ul><li><b>Tracks:</b> audio tracks hold recordings; instrument (MIDI) tracks play virtual instruments; <b>buses</b> (aux tracks) combine or process groups of tracks.</li>
      <li><b>Clips (regions):</b> pieces of audio or MIDI on the timeline. Editing is <b>non-destructive</b>: trimming, moving and fading don't change the original files.</li>
      <li><b>Mixer:</b> each channel has level, pan, <b>inserts</b> (effects in the channel's path, such as EQ and compression) and <b>sends</b> (copies of the signal to a shared bus, often with reverb or delay).</li>
      <li><b>Automation:</b> recorded or drawn changes over time to any setting.</li>
      <li><b>Views:</b> a linear arrangement timeline; a piano roll for MIDI; in some DAWs a clip or session grid for launching loops live.</li>
      <li><b>Plug-ins</b> add instruments and effects: VST3 (most DAWs), AU (Apple), AAX (Pro Tools).</li></ul>
      ${tbl("Some widely used DAWs", ["DAW", "Known for"], [['<a href="https://www.avid.com/pro-tools" target="_blank" rel="noopener">Pro Tools</a> (Avid)', "professional studio recording and editing; film and TV post-production"], ['<a href="https://www.apple.com/logic-pro/" target="_blank" rel="noopener">Logic Pro</a> (Apple)', "Mac songwriting and production with many built-in instruments"], ['<a href="https://www.ableton.com/" target="_blank" rel="noopener">Ableton Live</a> (Ableton)', "clip-based composing and live performance"], ['<a href="https://www.image-line.com/" target="_blank" rel="noopener">FL Studio</a> (Image-Line)', "pattern-based beat making"], ['<a href="https://www.steinberg.net/cubase/" target="_blank" rel="noopener">Cubase</a> (Steinberg)', "long-established all-round production; strong MIDI editing"], ['<a href="https://www.fender.com/" target="_blank" rel="noopener">Fender Studio Pro</a> (formerly PreSonus Studio One)', "all-round production with drag-and-drop workflow"], ['<a href="https://www.reaper.fm/" target="_blank" rel="noopener">Reaper</a> (Cockos)', "inexpensive and very customizable"], ['<a href="https://www.bitwig.com/" target="_blank" rel="noopener">Bitwig Studio</a> (Bitwig)', "clip-based, with a built-in modular system"], ['<a href="https://www.apple.com/mac/garageband/" target="_blank" rel="noopener">GarageBand</a> (Apple)', "free on Apple devices; a gentle start"]])}
      <h3>DAW tools and other SilverApps</h3>
      ${tbl("Where DAW ideas connect to other lessons", ["In the DAW", "Musical idea", "Learn it in"], [
        ["Tempo (BPM), tempo changes", "how fast the beat goes", '<a href="note-values-lesson.html#step=7">Note Values: Tempo</a> · <a href="metronome.html">Metronome</a>'],
        ["Bars and beats ruler, time signature", "meter", '<a href="meter-lesson.html">Understanding Meter and Beaming</a>'],
        ["Grid and quantize values (1/4, 1/8, 1/16, triplets)", "beat, division, subdivision; tuplets", '<a href="note-values-lesson.html#step=6">Note Values: Meter and the beat</a> · <a href="note-values-lesson.html#step=8">Triplets and tuplets</a>'],
        ["Swing / groove settings", "uneven divisions, feel", '<a href="rhythm-notation-lesson.html">Rhythm Notation</a>'],
        ["Click track and count-in", "playing in time", '<a href="rhythm-performance.html">Rhythm Performance</a>'],
        ["Piano roll (pitch on a vertical grid)", "pitch and the staff", '<a href="reading-pitch-lesson.html">Clefs and Pitch Reading</a>'],
        ["Key and scale settings, transpose", "keys and scales", '<a href="keys-and-scale-degrees-lesson.html">Keys and Scale Degrees</a> · <a href="major-and-minor-scales-lesson.html">Major and Minor Scales</a>'],
        ["Chord tracks and chord detection", "chord symbols", '<a href="chord-figures-and-symbols.html">Chord Figures and Symbols</a>'],
        ["Tuning reference (A = 440 Hz), MIDI note numbers", "frequency and pitch", '<a href="introduction-to-pitch-lesson.html">Introduction to Pitch</a> · <a href="drone.html">Drone</a>'],
        ["Arranger track, markers (verse, chorus)", "form", '<a href="forms-lesson.html">Forms</a>'],
        ["Track list and instrument plug-ins", "orchestration and ranges", '<a href="orchestration-strings.html">Orchestration apps</a>'],
        ["Mixing and mastering", "production", '<a href="pop-production-lesson.html">How Pop Music Is Produced</a>']])}
      <p>To try editing real audio (trimming, normalizing, reverb, converting formats), open the <a href="audio-clip-editor.html">Audio Clip Editor</a>.</p>` },
    { title: "Try a mixer", kick: "Channels, buses and sends", render: () => `<p>This mixer plays a short loop through four channels. Each channel has a <b>fader</b> (level), <b>pan</b>, <b>mute</b> and <b>solo</b>, a <b>send</b> to a shared reverb, and an <b>output</b> that goes either straight to the master or to <b>Bus 1</b>, a group bus with its own fader and an optional compressor.</p>
      <ol><li>Play the loop. Solo the bass, then un-solo it.</li><li>Route Drums and Bass to Bus 1. Now Bus 1's fader turns both down together. Switch on its compressor.</li><li>Raise the Keys' reverb send: the keys gain space without the other tracks changing. Then lower the Reverb return to change the reverb on everything at once.</li><li>Pan Keys and Lead apart and listen to the stereo picture widen.</li><li>Watch the meters: keep the master out of the red.</li></ol>
      ${mixToy()}` },
    { title: "Synthesizers and virtual instruments", kick: "Making sound from scratch", render: () => `<p>A synthesizer generates sound electronically. The classic <b>subtractive</b> design chains a few modules:</p>
      <ul><li><b>Oscillators</b> make the raw tone (sine, triangle, square, sawtooth, noise) at a pitch set by the keyboard.</li>
      <li>A <b>filter</b> removes some overtones. Low-pass <b>cutoff</b> = brightness; <b>resonance</b> emphasizes the cutoff region.</li>
      <li>An <b>amplifier</b> shaped by an <b>envelope</b>: <b>ADSR</b> (attack, decay, sustain level, release).</li>
      <li><b>LFOs</b> (slow oscillators) move other settings repeatedly: vibrato, tremolo, filter wobble.</li></ul>
      <p>Other methods: <b>FM</b> (one oscillator modulates another's frequency: bells, electric pianos), <b>wavetable</b> (sweeping through stored waveforms), <b>granular</b> (clouds of tiny sound grains), <b>physical modeling</b> (simulating a vibrating string or tube), and <b>sampling</b> (playing back recordings). Modular synthesizers let the user patch modules together freely.</p>
      <p>A <b>virtual instrument</b> (soft synth) runs inside the DAW. Orchestral <b>sample libraries</b> record each instrument at many pitches, dynamics and articulations (legato, staccato, pizzicato…), switched with <b>keyswitches</b> or controllers.</p>
      <h3>Try a synthesizer</h3><p>A two-oscillator subtractive synth. Start from a preset, then change one thing at a time and listen.</p>${synthToy()}` },
    { title: "Drum machine", kick: "Step sequencing", render: () => `<p>Drum machines and step sequencers divide a loop into a grid of <b>steps</b>: beats, each split into equal divisions. Switch steps on to place sounds; pitched rows (beeps and boops) take the pitch chosen in the menu. Every DAW has a version of this, often called a step sequencer or drum rack.</p>
      ${dmToy()}
      <ul><li>4 divisions per beat = sixteenth-note steps (the classic drum-machine grid); 3 or 6 = triplets; 2 = eighths.</li><li><b>Swing</b> delays every second step slightly, for a shuffled feel.</li><li>The beat, division and subdivision are explained in <a href="note-values-lesson.html#step=6">Note Values: Meter and the beat</a>.</li></ul>` },
    { title: "Notation software", kick: "Scores and parts", render: () => `<p>Notation programs produce printed or digital scores and parts. Widely used ones include <a href="https://www.steinberg.net/dorico/" target="_blank" rel="noopener">Dorico</a> (Steinberg), <a href="https://www.avid.com/sibelius" target="_blank" rel="noopener">Sibelius</a> (Avid) and <a href="https://musescore.org/" target="_blank" rel="noopener">MuseScore</a> (free and open source), the text-based engraver <a href="https://lilypond.org/" target="_blank" rel="noopener">LilyPond</a>, and browser-based editors such as <a href="https://www.noteflight.com/" target="_blank" rel="noopener">Noteflight</a> and <a href="https://flat.io/" target="_blank" rel="noopener">Flat</a>. Finale, long an industry standard, was discontinued by its publisher in 2024.</p>
      <ul><li><b>Input:</b> step-time (choose a duration, enter pitches from the computer or a MIDI keyboard), real-time (play along to a click, then clean up), or importing MIDI or MusicXML.</li>
      <li><b>Parts</b> are generated from the score, so edits stay consistent; check page turns, cues and multi-bar rests.</li>
      <li><b>Playback</b> with sample libraries is a good proof-listening tool, but balance and playability still need a musician's judgment.</li>
      <li><b>MusicXML</b> moves notation between programs; <b>MIDI</b> moves performance data between notation software and DAWs.</li></ul>` },
    { title: "Production tools", kick: "From recording to release", render: () => `<p>Production software covers everything between an idea and a finished master:</p>
      <ul><li><b>Recording</b>: interface, microphones, monitoring with low latency.</li>
      <li><b>Editing</b>: comping the best takes, timing correction, pitch correction (<a href="https://www.antarestech.com/" target="_blank" rel="noopener">Auto-Tune</a>, <a href="https://www.celemony.com/" target="_blank" rel="noopener">Melodyne</a>), noise reduction.</li>
      <li><b>Mixing</b>: EQ (tone), compression (controlling dynamics), reverb and delay (space), panning, automation.</li>
      <li><b>Mastering</b>: final EQ, compression and limiting for a consistent, competitive level, and preparing files for release.</li></ul>
      <p>The Pop Production and Film and Game Scoring apps on this site go further into how these tools are used.</p>` },
    { title: "Quick check", kick: "Before the drills", render: H => Object.keys(F).map(m => { const [q, a, w, y] = F[m][0]; return H.check(q, a, w, y); }).join("") },
  ] };
  const ALL = Object.values(F).flat();
  function make(mode, H) { if (GEN[mode] && Math.random() < .4) return GEN[mode](H); const [q, a, w, y] = H.rnd(F[mode] || ALL); return H.mc(q, a, w, y); }
  const reference = () => `<ul><li><b>Sample rate</b> ÷ 2 = highest recordable frequency. 44.1 kHz (CD), 48 kHz (video).</li><li><b>Bit depth</b>: ≈ 6 dB per bit (16-bit ≈ 96 dB). 0 dBFS = maximum; above it clips.</li><li><b>Formats</b>: WAV/AIFF uncompressed; FLAC/ALAC lossless; MP3/AAC lossy.</li><li><b>MIDI</b>: data, not sound. Notes and velocity 0–127, 60 = C4, 16 channels, CC1 mod, CC7 volume, CC64 sustain.</li><li><b>DAW</b>: tracks, clips, buses, inserts vs sends, automation, piano roll, plug-ins (VST3, AU, AAX).</li><li><b>Synth</b>: oscillator → filter → amplifier, ADSR envelope, LFO. Also FM, wavetable, granular, sampling.</li><li><b>Notation</b>: Dorico, Sibelius, MuseScore, LilyPond; MusicXML for exchange.</li></ul>`;
  return { key: "silverapps-software-v1", lesson, make, reference, modes: [{ id: "audio", kicker: "Digital audio" }, { id: "daw", kicker: "The DAW" }, { id: "synth", kicker: "Synths and MIDI" }, { id: "nota", kicker: "Notation and production software" }], topics: [] };
})();
