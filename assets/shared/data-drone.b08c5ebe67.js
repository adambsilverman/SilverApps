
(() => {
  const $ = id => document.getElementById(id);
  const PCN = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
  const spoken = s => s.replace("♯", " sharp").replace("♭", " flat");
  // Just ratios from the harmonic series (5-limit, with a choice of 7th)
  const IVS = [
    { s: 0, n: "Root", r: [1, 1] }, { s: 1, n: "minor 2nd", r: [16, 15] }, { s: 2, n: "major 2nd", r: [9, 8] }, { s: 3, n: "minor 3rd", r: [6, 5] }, { s: 4, n: "major 3rd", r: [5, 4] },
    { s: 5, n: "perfect 4th", r: [4, 3] }, { s: 6, n: "tritone", r: [45, 32] }, { s: 7, n: "perfect 5th", r: [3, 2] }, { s: 8, n: "minor 6th", r: [8, 5] }, { s: 9, n: "major 6th", r: [5, 3] },
    { s: 10, n: "minor 7th", r: [7, 4] }, { s: 11, n: "major 7th", r: [15, 8] }, { s: 12, n: "octave", r: [2, 1] }, { s: 16, n: "major 10th", r: [5, 2] }, { s: 19, n: "12th (5th + 8ve)", r: [3, 1] },
  ];
  const PRESETS = [["Root only", [0]], ["Open fifth", [0, 7]], ["Root + octave", [0, 12]], ["Major triad", [0, 4, 7]], ["Minor triad", [0, 3, 7]], ["Dominant 7th", [0, 4, 7, 10]], ["Major 7th", [0, 4, 7, 11]], ["Sus4", [0, 5, 7]], ["Overtones: 8ve, 12th, 10th", [0, 12, 19, 16]]];
  let S = { root: 2, octave: 3, a4: 440, tune: "ji", on: [0, 7], timbre: "organ", vol: .55, sev: "7/4", pulse: 0 };
  try { Object.assign(S, JSON.parse(localStorage.getItem("silverapps-drone") || "{}")); } catch (e) {}
  const save = () => { try { localStorage.setItem("silverapps-drone", JSON.stringify(S)); } catch (e) {} };
  if (!("tonic" in S)) S.tonic = "follow";
  if (!Array.isArray(S.ot)) S.ot = [];
  // Overtone grid: partial n (1–13) of the drone root, or the pure 4th/5th above or below it. Key "n:k".
  const OTK = [["-5", 2 / 3, "P5 below"], ["-4", 3 / 4, "P4 below"], ["0", 1, "harmonic"], ["4", 4 / 3, "P4 above"], ["5", 3 / 2, "P5 above"]];
  const OTFR = { "-5": "2/3", "-4": "3/4", "0": "1", "4": "4/3", "5": "3/2" };
  const otRatio = key => { const [n, k] = key.split(":"); return +n * OTK.find(x => x[0] === k)[1]; };
  const otRatioTxt = key => { const [n, k] = key.split(":"); const [a, b] = OTFR[k].split("/").map(Number); let p = +n * a, q = b || 1; const g = gcd(p, q); return `${p / g}:${q / g}`; };
  if (!S.limit) S.limit = S.sev === "7/4" ? 7 : 5;          // older saved settings used 7:4 as a choice of 7th
  if (S.sev === "7/4") S.sev = "9/5";
  // Ratios above the tuning root, by semitone (one octave). Just: 5-limit; Pythagorean: chains of pure fifths.
  // Just intonation by prime limit: each limit keeps the 5-limit ratios and adds intervals from higher harmonics.
  const JI5 = [[1, 1], [16, 15], [9, 8], [6, 5], [5, 4], [4, 3], [45, 32], [3, 2], [8, 5], [5, 3], null, [15, 8]];   // null = the chosen 5-limit 7th
  const JILIM = {
    5: JI5,
    7: JI5.map((r, k) => ({ 6: [7, 5], 10: [7, 4] })[k] || r),                 // harmonic 7th 7:4 (−31¢), septimal tritone 7:5 (−17¢)
    11: JI5.map((r, k) => ({ 6: [11, 8], 10: [7, 4] })[k] || r),               // 11th harmonic 11:8 (−49¢)
    13: JI5.map((r, k) => ({ 6: [11, 8], 8: [13, 8], 10: [7, 4] })[k] || r),   // 13th harmonic 13:8 (+41¢)
  };
  const LIMNOTE = {
    5: "Ratios built from 2, 3 and 5 only: pure 5ths (3:2) and pure major 3rds (5:4). The classic just intonation of triads.",
    7: "Adds the 7th harmonic: a harmonic minor 7th of 7:4 (31¢ flat, the barbershop seventh) and a 7:5 tritone (17¢ flat).",
    11: "Adds the 11th harmonic: 11:8, halfway between a perfect 4th and a tritone (49¢ flat of the equal-tempered tritone). Plus the 7-limit 7th.",
    13: "Adds the 13th harmonic: 13:8, a neutral sixth between minor and major (41¢ sharp of the equal-tempered minor 6th). Plus 11:8 and 7:4.",
  };
  const PY = [[1, 1], [256, 243], [9, 8], [32, 27], [81, 64], [4, 3], [729, 512], [3, 2], [128, 81], [27, 16], [16, 9], [243, 128]];
  const TNAME = { et: "equal temperament", ji: "just intonation", py: "Pythagorean tuning" };
  const etHz = m => S.a4 * Math.pow(2, (m - 69) / 12);
  const rootMidi = () => (S.octave + 1) * 12 + S.root;
  const tonicPc = () => S.tonic === "follow" ? S.root : +S.tonic;
  const tonicMidi = () => rootMidi() - ((S.root - tonicPc() + 12) % 12);
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  // ratio of a drone note above the tuning root, as [num, den] (octaves folded in)
  function ratio(iv) {
    const d = rootMidi() + iv.s - tonicMidi(), k = d % 12, o = Math.floor(d / 12);
    const r = (S.tune === "py" ? PY : JILIM[S.limit] || JI5)[k] || S.sev.split("/").map(Number);
    let n = r[0] * Math.pow(2, o), q = r[1]; const g = gcd(n, q); return [n / g, q / g];
  }
  const rootHz = () => etHz(rootMidi());
  const hzOf = iv => { if (S.tune === "et") return etHz(rootMidi() + iv.s); const r = ratio(iv); return etHz(tonicMidi()) * r[0] / r[1]; };
  const centsOff = iv => 1200 * Math.log2(hzOf(iv) / etHz(rootMidi() + iv.s));
  const otHz = key => rootHz() * otRatio(key);
  const otName = key => { const semi = 12 * Math.log2(otRatio(key)), r = Math.round(semi), c = (semi - r) * 100, m = rootMidi() + r; return { name: PCN[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1), c }; };
  const centsTxt = c => Math.abs(c) < .5 ? "0¢" : `${c > 0 ? "+" : "−"}${Math.abs(c).toFixed(0)}¢`;
  const otOn = () => S.tune === "ji" ? S.ot : [];
  const noteName = iv => PCN[(S.root + iv.s) % 12] + (S.octave + Math.floor((S.root + iv.s) / 12));

  // ---------- audio ----------
  let AC = null, master = null, voices = {}, running = false, lfo = null;
  const WAVES = {};
  function wave(kind) {
    if (WAVES[kind]) return WAVES[kind];
    const H = { organ: [1, .6, .35, .25, .12, .08, .05, .04], strings: [1, .55, .4, .3, .22, .16, .12, .09, .07, .05], reed: [1, .2, .7, .15, .5, .12, .35, .1, .2], sine: [1] }[kind];
    const re = new Float32Array(H.length + 1), im = new Float32Array(H.length + 1); H.forEach((a, i) => im[i + 1] = a);
    return WAVES[kind] = AC.createPeriodicWave(re, im);
  }
  function ac() { if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = 0; const comp = AC.createDynamicsCompressor(); comp.threshold.value = -18; master.connect(comp); comp.connect(AC.destination); } if (AC.state === "suspended") AC.resume(); return AC; }
  function voiceFor(iv) {
    const o = AC.createOscillator(), o2 = AC.createOscillator(), g = AC.createGain(), lp = AC.createBiquadFilter();
    o.setPeriodicWave(wave(S.timbre)); o2.setPeriodicWave(wave(S.timbre)); lp.type = "lowpass"; lp.frequency.value = S.timbre === "sine" ? 8000 : 3200;
    const f = iv.hz || hzOf(iv); o.frequency.value = f; o2.frequency.value = f; o2.detune.value = S.timbre === "strings" ? 6 : 0;
    const g2 = AC.createGain(); g2.gain.value = S.timbre === "strings" ? .5 : 0;
    o.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); g.connect(master);
    g.gain.value = 0; o.start(); o2.start();
    return { o, o2, g, iv };
  }
  function level() { const n = Math.max(1, S.on.length + otOn().length); return S.vol * .5 / Math.sqrt(n); }
  let otv = {};
  function syncOt(t) {
    const keys = new Set(Object.keys(otv).concat(otOn()));
    keys.forEach(key => {
      const want = otOn().includes(key); let v = otv[key];
      if (want && !v) { v = otv[key] = voiceFor({ s: 0, hz: otHz(key) }); }
      if (v) { const f = otHz(key); v.o.frequency.setTargetAtTime(f, t, .05); v.o2.frequency.setTargetAtTime(f, t, .05);
        v.g.gain.setTargetAtTime(want ? level() * .75 : 0, t, .25);
        if (!want) { const dead = v; delete otv[key]; setTimeout(() => { try { dead.o.stop(); dead.o2.stop(); } catch (e) {} }, 1500); } }
    });
  }
  function sync() {
    if (!running) return;
    const t = AC.currentTime;
    IVS.forEach(iv => {
      const want = S.on.includes(iv.s); let v = voices[iv.s];
      if (want && !v) v = voices[iv.s] = voiceFor(iv);
      if (v) {
        const f = hzOf(iv); v.o.frequency.setTargetAtTime(f, t, .05); v.o2.frequency.setTargetAtTime(f, t, .05);
        v.g.gain.setTargetAtTime(want ? level() * (iv.s === 0 ? 1 : .8) : 0, t, .25);
        if (!want) { const dead = v; delete voices[iv.s]; setTimeout(() => { try { dead.o.stop(); dead.o2.stop(); } catch (e) {} }, 1500); }
      }
    });
    syncOt(t);
    master.gain.setTargetAtTime(1, t, .3);
  }
  function rebuildTimbre() { if (!running) return; Object.values(voices).concat(Object.values(otv)).forEach(v => { v.o.setPeriodicWave(wave(S.timbre)); v.o2.setPeriodicWave(wave(S.timbre)); }); }
  function setPulse() {
    if (!AC) return;
    if (lfo) { try { lfo.o.stop(); } catch (e) {} lfo = null; }
    if (S.pulse && running) { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.value = .12; g.gain.value = .25; o.connect(g); g.connect(master.gain); o.start(); lfo = { o }; }
  }
  function start() { ac(); running = true; sync(); setPulse(); $("go").textContent = "■ Stop drone"; $("go").setAttribute("aria-pressed", "true"); status(); }
  function stop() { running = false; if (master) master.gain.setTargetAtTime(0, AC.currentTime, .25); setTimeout(() => { if (!running) { Object.values(voices).concat(Object.values(otv)).forEach(v => { try { v.o.stop(); v.o2.stop(); } catch (e) {} }); voices = {}; otv = {}; if (lfo) { try { lfo.o.stop(); } catch (e) {} lfo = null; } } }, 1200); $("go").textContent = "▶ Start drone"; $("go").setAttribute("aria-pressed", "false"); $("status").textContent = "Stopped."; }
  $("go").onclick = () => running ? stop() : start();

  // ---------- UI ----------
  function status() { if (running) $("status").textContent = `Sounding: ${S.on.slice().sort((a, b) => a - b).map(s => spoken(noteName(IVS.find(i => i.s === s)))).join(", ")} (${TNAME[S.tune]}${S.tune === "ji" ? `, ${S.limit}-limit` : ""}${S.tune !== "et" ? `, tuned from ${spoken(PCN[tonicPc()])}` : ""}).`; }
  function render() {
    $("pcs").innerHTML = PCN.map((n, i) => `<button type="button" class="pc${[1, 3, 6, 8, 10].includes(i) ? " blk" : ""}" data-pc="${i}" aria-pressed="${S.root === i}" aria-label="Root ${spoken(n)}">${n}</button>`).join("");
    $("ivs").innerHTML = IVS.map(iv => iv.s === 0 ? `<div class="iv root" role="note"><b>${noteName(iv)}</b><small>root (always on)</small></div>` : `<button type="button" class="iv" data-s="${iv.s}" aria-pressed="${S.on.includes(iv.s)}"><b>${noteName(iv)}</b><small>${iv.n}</small></button>`).join("");
    document.querySelectorAll("[data-tune]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.tune === S.tune)));
    $("presets").innerHTML = PRESETS.map((p, i) => `<button type="button" class="tbtn" data-pre="${i}">${p[0]}</button>`).join("");
    $("sevWrap").hidden = S.tune !== "ji" || S.limit !== 5;
    $("limWrap").hidden = $("limNote").hidden = S.tune !== "ji";
    $("limNote").textContent = LIMNOTE[S.limit];
    document.querySelectorAll("[data-lim]").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.lim === S.limit)));
    $("tonic").value = S.tonic;
    const tn = PCN[tonicPc()];
    $("tuneNote").textContent = S.tune === "et" ? "Every half step is exactly 100 cents; no note is favored." : S.tune === "ji" ? `Pure ratios from the harmonic series of ${tn}. Thirds and sixths are calm and beat-free; ${S.tonic === "follow" ? "change the tuning root to hear how other chords go out of tune." : "chords on other roots may sound rough."}` : `Every note comes from pure 3:2 fifths above or below ${tn}. Fifths are pure; major thirds are wide (+8¢) and bright.`;
    let rows = S.on.slice().sort((a, b) => a - b).map(s => IVS.find(i => i.s === s)).map(iv => { const r = ratio(iv), c = S.tune === "et" ? 0 : centsOff(iv), cs = Math.abs(c) < .5 ? "0¢" : `${c > 0 ? "+" : "−"}${Math.abs(c).toFixed(1)}¢`; return `<tr><th scope="row">${noteName(iv)}</th><td>${iv.n}</td><td>${S.tune === "et" ? `2^(${iv.s}/12)` : `${r[0]}:${r[1]} above ${tn}`}</td><td class="cents ${c < -.5 ? "flat" : c > .5 ? "sharp" : ""}">${cs}${S.tune !== "et" && Math.abs(c) > .5 ? (c < 0 ? " (lower)" : " (higher)") : ""}</td><td>${hzOf(iv).toFixed(2)} Hz</td></tr>`; }).join("");
    $("otWrap").hidden = S.tune !== "ji";
    if (S.tune === "ji") {
      $("otPre").innerHTML = [["Harmonics 1–6", 6], ["Harmonics 1–8", 8], ["All 13 harmonics", 13], ["Clear overtones", 0]].map(([t, n]) => `<button type="button" class="tbtn" data-otp="${n}">${t}</button>`).join("");
      let g = `<span class="ohd" aria-hidden="true">#</span>` + OTK.map(x => `<span class="ohd" aria-hidden="true">${x[2]}</span>`).join("");
      for (let n = 1; n <= 13; n++) { g += `<span class="onum" aria-hidden="true">${n}</span>` + OTK.map(([k, , lab]) => { const key = `${n}:${k}`, nn = otName(key); return `<button type="button" class="${k === "0" ? "h" : ""}" data-ot="${key}" aria-pressed="${S.ot.includes(key)}" aria-label="${k === "0" ? `Harmonic ${n}` : `${lab} harmonic ${n}`}: ${spoken(nn.name)}, ratio ${otRatioTxt(key)}, ${centsTxt(nn.c).replace("−", "minus ")} from equal temperament">${nn.name}<small>${otRatioTxt(key)} · ${centsTxt(nn.c)}</small></button>`; }).join(""); }
      $("otGrid").innerHTML = g;
      rows += otOn().slice().sort((a, b) => otRatio(a) - otRatio(b)).map(key => { const nn = otName(key), [n, k] = key.split(":"); return `<tr><th scope="row">${nn.name}</th><td>${k === "0" ? `harmonic ${n}` : `${OTK.find(x => x[0] === k)[2]} harmonic ${n}`}</td><td>${otRatioTxt(key)}</td><td>${centsTxt(nn.c)}</td><td>${otHz(key).toFixed(1)} Hz</td></tr>`; }).join("");
    }
    $("nowRows").innerHTML = rows;
    status(); save();
  }
  // Waveform sketch of the combined drone: beating is visible in equal temperament, smooth in just intonation.
  function drawViz() {
    const svg = $("viz"), f0 = rootHz(), N = 600, T = 6 / f0 * 4; let d = "", mx = 0; const ys = [];
    for (let i = 0; i <= N; i++) { const t = i / N * T * 40; let y = 0; S.on.forEach(s => { y += Math.sin(2 * Math.PI * hzOf(IVS.find(v => v.s === s)) * t); }); otOn().forEach(k => { y += Math.sin(2 * Math.PI * otHz(k) * t); }); ys.push(y); mx = Math.max(mx, Math.abs(y)); }
    ys.forEach((y, i) => d += `${i ? "L" : "M"}${i} ${60 - y / (mx || 1) * 50}`);
    svg.innerHTML = `<path d="${d}" fill="none" stroke="${getComputedStyle(document.documentElement).getPropertyValue("--fi-navy")}" stroke-width="1.2"/>`;
  }
  $("pcs").onclick = e => { const b = e.target.closest("[data-pc]"); if (!b) return; S.root = +b.dataset.pc; render(); sync(); $("pcs").querySelector(`[data-pc="${S.root}"]`).focus(); };
  $("ivs").onclick = e => { const b = e.target.closest("[data-s]"); if (!b) return; const s = +b.dataset.s; S.on = S.on.includes(s) ? S.on.filter(x => x !== s) : S.on.concat(s); if (!S.on.includes(0)) S.on.push(0); render(); sync(); $("ivs").querySelector(`[data-s="${s}"]`).focus(); };
  $("otGrid").onclick = e => { const b = e.target.closest("[data-ot]"); if (!b) return; const k = b.dataset.ot; S.ot = S.ot.includes(k) ? S.ot.filter(x => x !== k) : S.ot.concat(k); render(); sync(); const again = $("otGrid").querySelector(`[data-ot="${k}"]`); if (again) again.focus(); };
  $("otPre").onclick = e => { const b = e.target.closest("[data-otp]"); if (!b) return; const n = +b.dataset.otp; S.ot = S.ot.filter(k => !k.endsWith(":0")).concat(Array.from({ length: n }, (_, i) => `${i + 1}:0`)); if (!n) S.ot = []; render(); sync(); };
  $("presets").onclick = e => { const b = e.target.closest("[data-pre]"); if (!b) return; S.on = PRESETS[+b.dataset.pre][1].slice(); render(); sync(); };
  document.querySelectorAll("[data-tune]").forEach(b => b.onclick = () => { S.tune = b.dataset.tune; render(); sync(); });
  document.querySelectorAll("[data-lim]").forEach(b => b.onclick = () => { S.limit = +b.dataset.lim; render(); sync(); });
  $("tonic").innerHTML = '<option value="follow">The drone\'s root (moves with it)</option>' + PCN.map((n, i) => `<option value="${i}">${n}</option>`).join("");
  $("tonic").onchange = e => { S.tonic = e.target.value; render(); sync(); };
  $("octave").value = S.octave; $("a4").value = S.a4; $("timbre").value = S.timbre; $("vol").value = Math.round(S.vol * 100); $("sev").value = S.sev; $("pulse").value = S.pulse;
  $("octave").onchange = e => { S.octave = +e.target.value; render(); sync(); };
  $("a4").onchange = e => { S.a4 = Math.max(400, Math.min(480, +e.target.value || 440)); e.target.value = S.a4; render(); sync(); };
  $("timbre").onchange = e => { S.timbre = e.target.value; save(); rebuildTimbre(); };
  $("vol").oninput = e => { S.vol = e.target.value / 100; save(); sync(); };
  $("sev").onchange = e => { S.sev = e.target.value; render(); sync(); };
  $("pulse").onchange = e => { S.pulse = +e.target.value; save(); setPulse(); };
  document.addEventListener("keydown", e => { if (e.code === "Space" && !e.target.closest("input,select,textarea,button")) { e.preventDefault(); running ? stop() : start(); } });
  render();
})();
