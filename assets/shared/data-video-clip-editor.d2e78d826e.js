
(() => {
  const $ = id => document.getElementById(id);
  const V = $("vid"), status = t => { $("status").textContent = t; };
  const fmtT = t => { t = Math.max(0, t || 0); const m = Math.floor(t / 60), s = t - m * 60; return `${m}:${s < 10 ? "0" : ""}${s.toFixed(1)}`; };
  const S = { name: "clip", dur: 0, vw: 0, vh: 0, inT: 0, outT: 0, splits: [], crop: { on: false, x: .1, y: .1, w: .8, h: .8, ar: "free" }, ig: { on: false, x: .3, y: 0, w: .3, h: 1, ar: .5625, inT: 0, outT: 0 }, buf: null, normGain: 1, busy: false, cancel: false };

  // ---------- open ----------
  async function open(f) {
    if (!f) return; if (!/^video\//.test(f.type) && !/\.(mp4|mov|m4v|webm|mkv)$/i.test(f.name)) { status("That doesn't look like a video file."); return; }
    S.name = f.name.replace(/\.[^.]+$/, ""); S.file = f; S.buf = null; S.splits = []; status("Loading…");
    if (V.src) URL.revokeObjectURL(V.src); V.src = URL.createObjectURL(f);
    await new Promise((ok, no) => { V.onloadedmetadata = ok; V.onerror = () => no(new Error("This browser can't play that video.")); }).catch(e => { status(e.message); throw e; });
    S.dur = V.duration; S.vw = V.videoWidth; S.vh = V.videoHeight; S.inT = 0; S.outT = S.dur; S.ig.inT = 0; S.ig.outT = Math.min(S.dur, 60);
    $("stage").style.aspectRatio = `${S.vw} / ${S.vh}`; $("stage").style.maxHeight = "70vh"; $("stage").style.width = `min(100%, calc(70vh * ${S.vw / S.vh}))`;
    $("work").hidden = false; $("dur").textContent = `of ${fmtT(S.dur)} · ${S.vw} × ${S.vh}`; igFit(); syncInputs(); drawTL(); drawSegs(); drawBoxes();
    status(`Opened ${f.name}.`);
    analyze();
  }
  $("file").onchange = e => open(e.target.files[0]).catch(() => {});
  const drop = $("drop");
  ["dragenter", "dragover"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove("over"); }));
  drop.addEventListener("drop", e => open(e.dataTransfer.files[0]).catch(() => {}));

  // ---------- audio: mastering chain (works on live and offline contexts) ----------
  const P = { hp: 20, low: 0, mud: 0, mid: 0, midF: 2500, high: 0, ess: 0, compOn: true, thr: -18, ratio: 2.5, atk: 10, rel: 200, makeup: 2, revMix: 0, revSize: 1.6, limOn: true, ceil: -1, out: 0 };
  const PRESETS = {
    clean: ["Clean (normalize only)", { hp: 20, low: 0, mid: 0, high: 0, compOn: false, revMix: 0, limOn: true, ceil: -1, out: 0 }],
    podcast: ["Podcast voice (speech from a computer mic)", { hp: 90, low: 2.5, mud: -4, mid: 3, midF: 4000, high: 2, ess: -4, compOn: true, thr: -32, ratio: 4, atk: 4, rel: 140, makeup: 10, revMix: 0, limOn: true, ceil: -1.5, out: 0 }, "-16"],
    voice: ["Voice / talking to camera", { hp: 80, low: -2, mid: 2, midF: 3000, high: 2, compOn: true, thr: -24, ratio: 3, atk: 8, rel: 180, makeup: 5, revMix: 0, limOn: true, ceil: -1, out: 0 }],
    music: ["Music performance", { hp: 30, low: 1, mid: 0, high: 1.5, compOn: true, thr: -18, ratio: 2, atk: 20, rel: 250, makeup: 2, revMix: 8, revSize: 1.8, limOn: true, ceil: -1, out: 0 }],
    warm: ["Warm", { hp: 30, low: 3, mid: -1, midF: 2500, high: -2, compOn: true, thr: -20, ratio: 2.5, atk: 15, rel: 220, makeup: 3, revMix: 5, revSize: 1.4, limOn: true, ceil: -1, out: 0 }],
    bright: ["Bright and clear", { hp: 60, low: -1, mid: 1, midF: 3000, high: 4, compOn: true, thr: -20, ratio: 2.5, atk: 10, rel: 200, makeup: 3, revMix: 0, limOn: true, ceil: -1, out: 0 }],
    loud: ["Loud and punchy", { hp: 40, low: 2, mid: 0, high: 2, compOn: true, thr: -28, ratio: 4, atk: 5, rel: 120, makeup: 8, revMix: 0, limOn: true, ceil: -1, out: 0 }],
    hall: ["Concert hall", { hp: 30, low: 0, mid: 0, high: 0, compOn: true, thr: -20, ratio: 2, atk: 20, rel: 300, makeup: 2, revMix: 32, revSize: 3.2, limOn: true, ceil: -1, out: 0 }],
    room: ["Small room", { hp: 40, low: 0, mid: 0, high: 0, compOn: true, thr: -20, ratio: 2, atk: 15, rel: 200, makeup: 2, revMix: 14, revSize: .8, limOn: true, ceil: -1, out: 0 }],
  };
  const KN = [["EQ", [["hp", "Low cut", 20, 300, 5, "Hz"], ["low", "Bass (120 Hz)", -12, 12, .5, "dB"], ["mud", "Boxiness (300 Hz)", -12, 6, .5, "dB"], ["mid", "Middle", -12, 12, .5, "dB"], ["midF", "Middle freq.", 300, 6000, 50, "Hz"], ["high", "Treble (8 kHz)", -12, 12, .5, "dB"], ["ess", "Sibilance, \"s\" sounds (7 kHz)", -12, 6, .5, "dB"]]],
    ["Compressor", [["thr", "Threshold", -50, 0, 1, "dB"], ["ratio", "Ratio", 1, 12, .5, ": 1"], ["atk", "Attack", 1, 100, 1, "ms"], ["rel", "Release", 30, 1000, 10, "ms"], ["makeup", "Makeup gain", 0, 18, .5, "dB"]]],
    ["Reverb, limiter, output", [["revMix", "Reverb amount", 0, 60, 1, "%"], ["revSize", "Room size", .3, 5, .1, "s"], ["ceil", "Limiter ceiling", -6, 0, .1, "dB"], ["out", "Output gain", -12, 12, .5, "dB"]]]];
  const db = x => Math.pow(10, x / 20);
  function chain(C) {
    const G = v => { const g = C.createGain(); g.gain.value = v; return g; }, BQ = (type, f, g, q) => { const b = C.createBiquadFilter(); b.type = type; b.frequency.value = f; if (g != null) b.gain.value = g; if (q) b.Q.value = q; return b; };
    const input = G(1), norm = G(1), hp = BQ("highpass", 20, null, .7), lo = BQ("lowshelf", 120, 0), mud = BQ("peaking", 300, 0, 1.2), mid = BQ("peaking", 2500, 0, .9), hi = BQ("highshelf", 8000, 0), ess = BQ("peaking", 7000, 0, 2.5), comp = C.createDynamicsCompressor(), mk = G(1), dry = G(1), wet = G(0), cv = C.createConvolver(), lim = C.createDynamicsCompressor(), out = G(1), byp = G(0), main = G(1), output = G(1);
    input.connect(norm); norm.connect(hp); hp.connect(lo); lo.connect(mud); mud.connect(mid); mid.connect(hi); hi.connect(ess); ess.connect(comp); comp.connect(mk); mk.connect(dry); mk.connect(cv); cv.connect(wet); dry.connect(lim); wet.connect(lim); lim.connect(out); out.connect(main); main.connect(output);
    input.connect(byp); byp.connect(output);
    lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = .002; lim.release.value = .08;
    let irSize = 0;
    function update(bypass) {
      const t = C.currentTime || 0, s = (prm, v) => prm.setTargetAtTime(v, t, .02);
      s(norm.gain, S.normGain); s(hp.frequency, P.hp); s(lo.gain, P.low); s(mid.gain, P.mid); s(mid.frequency, P.midF); s(hi.gain, P.high); s(mud.gain, P.mud); s(ess.gain, P.ess);
      if (P.compOn) { s(comp.threshold, P.thr); s(comp.ratio, P.ratio); s(comp.attack, P.atk / 1000); s(comp.release, P.rel / 1000); s(mk.gain, db(P.makeup)); } else { s(comp.threshold, 0); s(comp.ratio, 1); s(mk.gain, 1); }
      if (irSize !== P.revSize) { const L = Math.floor(C.sampleRate * P.revSize), b = C.createBuffer(2, L, C.sampleRate); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < L; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / L, 3) * .5; } cv.buffer = b; irSize = P.revSize; }
      s(wet.gain, P.revMix / 100); s(dry.gain, 1 - P.revMix / 250);
      if (P.limOn) { s(lim.threshold, P.ceil - .5); s(lim.ratio, 20); } else { s(lim.threshold, 0); s(lim.ratio, 1); }
      s(out.gain, db(P.out)); s(main.gain, bypass ? 0 : 1); s(byp.gain, bypass ? 1 : 0);
    }
    update(false);
    return { input, output, update, comp, lim };
  }
  let AC = null, CH = null, SRC = null, MON = null, DEST = null, AN = null, bypass = false;
  function audioUp() {
    if (AC) { if (AC.state === "suspended") AC.resume(); return AC; }
    const Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return null;
    AC = new Ctx(); CH = chain(AC); SRC = AC.createMediaElementSource(V); SRC.connect(CH.input);
    MON = AC.createGain(); CH.output.connect(MON); MON.connect(AC.destination);
    DEST = AC.createMediaStreamDestination(); CH.output.connect(DEST);
    AN = AC.createAnalyser(); AN.fftSize = 1024; CH.output.connect(AN);
    requestAnimationFrame(meter); return AC;
  }
  function meter() { if (AN) { const d = new Float32Array(AN.fftSize); AN.getFloatTimeDomainData(d); let pk = 0; for (const x of d) pk = Math.max(pk, Math.abs(x)); const dbv = 20 * Math.log10(pk || 1e-6); $("lvl").style.width = Math.max(0, Math.min(100, (dbv + 48) / 48 * 100)) + "%"; const gr = (CH.comp.reduction || 0) + (CH.lim.reduction || 0); $("grInfo").textContent = `peak ${dbv < -90 ? "−∞" : dbv.toFixed(1)} dB${P.compOn || P.limOn ? ` · reducing ${(-gr).toFixed(1)} dB` : ""}`; } requestAnimationFrame(meter); }
  const upd = () => { if (CH) CH.update(bypass); };

  // knobs UI
  $("preset").innerHTML = Object.entries(PRESETS).map(([k, [l]]) => `<option value="${k}">${l}</option>`).join("") + `<option value="custom">Custom</option>`;
  function drawKnobs() {
    $("knobs").innerHTML = KN.map(([g, list], gi) => `<fieldset><legend>${g}${gi === 1 ? ` <label style="text-transform:none;font-weight:600"><input type="checkbox" id="compOn" ${P.compOn ? "checked" : ""}> on</label>` : gi === 2 ? ` <label style="text-transform:none;font-weight:600"><input type="checkbox" id="limOn" ${P.limOn ? "checked" : ""}> limiter on</label>` : ""}</legend>${list.map(([k, l, mn, mx, st, u]) => `<label class="sl">${l}<input type="range" data-k="${k}" min="${mn}" max="${mx}" step="${st}" value="${P[k]}"><output data-o="${k}">${P[k]} ${u}</output></label>`).join("")}</fieldset>`).join("");
  }
  function applyPreset(k) {
    Object.assign(P, { mud: 0, ess: 0, midF: 2500, thr: -18, ratio: 2.5, atk: 10, rel: 200, makeup: 2, revSize: 1.6 }, PRESETS[k][1]); drawKnobs(); upd();
    if (PRESETS[k][2]) { $("norm").value = PRESETS[k][2]; setNorm(); }
    $("presetNote").textContent = k === "podcast" ? "Podcast voice: cuts rumble and boxiness, adds warmth and presence, tames harsh \"s\" sounds, and compresses firmly so every word sits at the same level, then normalizes to −16 LUFS, the podcast standard. Works best close to the mic (a hand's width or two away) in a quiet room: compression also raises background noise." : "";
  }
  $("preset").onchange = e => { if (e.target.value !== "custom") applyPreset(e.target.value); };
  $("knobs").addEventListener("input", e => { const k = e.target.dataset.k; if (k) { P[k] = +e.target.value; const u = KN.flatMap(x => x[1]).find(x => x[0] === k)[5]; document.querySelector(`[data-o="${k}"]`).textContent = `${P[k]} ${u}`; $("preset").value = "custom"; upd(); } });
  $("knobs").addEventListener("change", e => { if (e.target.id === "compOn") { P.compOn = e.target.checked; $("preset").value = "custom"; upd(); } if (e.target.id === "limOn") { P.limOn = e.target.checked; $("preset").value = "custom"; upd(); } });
  $("bypass").onclick = e => { bypass = !bypass; e.currentTarget.setAttribute("aria-pressed", bypass); audioUp(); upd(); };
  applyPreset("music"); $("preset").value = "music";

  // ---------- normalization: decode the audio and measure loudness (K-weighted, ungated, approximate LUFS) ----------
  async function analyze() {
    $("normInfo").textContent = "Measuring the sound…";
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext, tmp = new Ctx(), data = await S.file.arrayBuffer();
      S.buf = await new Promise((ok, no) => { const p = tmp.decodeAudioData(data, ok, no); if (p && p.catch) p.catch(no); }); tmp.close && tmp.close();
      await measure();
    } catch (e) { S.buf = null; S.normGain = 1; upd(); $("normInfo").textContent = "This video's sound couldn't be measured here (or it has no sound), so normalizing is off. Mastering still works while you play and export."; }
  }
  async function measure() {
    if (!S.buf) return; const b = S.buf, sr = b.sampleRate, s0 = Math.floor(S.inT * sr), s1 = Math.max(s0 + 1, Math.floor(S.outT * sr)), n = s1 - s0;
    let peak = 0; for (let c = 0; c < b.numberOfChannels; c++) { const d = b.getChannelData(c); for (let i = s0; i < s1; i++) { const v = Math.abs(d[i]); if (v > peak) peak = v; } }
    const C = new OfflineAudioContext(b.numberOfChannels, n, sr), src = C.createBufferSource(), seg = C.createBuffer(b.numberOfChannels, n, sr);
    for (let c = 0; c < b.numberOfChannels; c++) seg.getChannelData(c).set(b.getChannelData(c).subarray(s0, s1));
    src.buffer = seg; const sh = C.createBiquadFilter(); sh.type = "highshelf"; sh.frequency.value = 1500; sh.gain.value = 4; const hpf = C.createBiquadFilter(); hpf.type = "highpass"; hpf.frequency.value = 38; hpf.Q.value = .5;
    src.connect(sh); sh.connect(hpf); hpf.connect(C.destination); src.start(); const k = await C.startRendering();
    let ms = 0; for (let c = 0; c < k.numberOfChannels; c++) { const d = k.getChannelData(c); let s = 0; for (let i = 0; i < d.length; i += 2) s += d[i] * d[i]; ms += s / (d.length / 2); }
    S.lufs = -0.691 + 10 * Math.log10(ms || 1e-12); S.peakDb = 20 * Math.log10(peak || 1e-9); setNorm();
  }
  function setNorm() {
    const v = $("norm").value; if (!S.buf) { S.normGain = 1; upd(); return; }
    let g = 0; if (v === "peak") g = -1 - S.peakDb; else if (v !== "off") g = +v - S.lufs;
    g = Math.max(-30, Math.min(30, g)); S.normGain = db(g); upd();
    $("normInfo").textContent = `Trimmed part: loudness about ${S.lufs.toFixed(1)} LUFS, peak ${S.peakDb.toFixed(1)} dB. ${v === "off" ? "Normalizing is off." : `Gain ${g >= 0 ? "+" : ""}${g.toFixed(1)} dB to reach the target${v !== "peak" && S.peakDb + g > -1 ? " (the limiter catches the peaks)" : ""}.`}`;
  }
  $("norm").onchange = () => setNorm();

  // ---------- playback ----------
  let stopAt = null;
  $("play").onclick = () => { audioUp(); if (V.paused) { stopAt = null; V.play(); } else V.pause(); };
  V.onplay = () => { $("play").textContent = "❚❚ Pause"; tick(); }; V.onpause = () => { $("play").textContent = "▶ Play"; };
  function tick() { $("clock").textContent = fmtT(V.currentTime); drawTL(); if (stopAt != null && V.currentTime >= stopAt) { V.pause(); stopAt = null; } if (!V.paused) requestAnimationFrame(tick); }
  V.ontimeupdate = () => { if (V.paused) { $("clock").textContent = fmtT(V.currentTime); drawTL(); } };
  const seek = t => { V.currentTime = Math.max(0, Math.min(S.dur, t)); };
  $("back1").onclick = () => seek(V.currentTime - 1); $("fwd1").onclick = () => seek(V.currentTime + 1); $("frame").onclick = () => { V.pause(); seek(V.currentTime + 1 / 30); };
  const playRange = (a, b) => { audioUp(); seek(a); stopAt = b; V.play(); };
  $("playSel").onclick = () => playRange(S.inT, S.outT);

  // ---------- trim & splits ----------
  function syncInputs() { $("inT").value = S.inT.toFixed(1); $("outT").value = S.outT.toFixed(1); $("igInT").value = S.ig.inT.toFixed(1); $("igOutT").value = S.ig.outT.toFixed(1); $("igLen").textContent = `Length ${fmtT(S.ig.outT - S.ig.inT)}${S.ig.outT - S.ig.inT > 180 ? " (longer than Instagram allows: 3 minutes)" : ""}`; }
  const setTrim = (a, b) => { S.inT = Math.max(0, Math.min(a, S.dur)); S.outT = Math.max(S.inT + .1, Math.min(b, S.dur)); syncInputs(); drawTL(); drawSegs(); clearTimeout(S.mt); S.mt = setTimeout(measure, 300); };
  $("setIn").onclick = () => setTrim(V.currentTime, Math.max(S.outT, V.currentTime + .1)); $("setOut").onclick = () => setTrim(Math.min(S.inT, V.currentTime - .1), V.currentTime);
  $("inT").onchange = e => setTrim(+e.target.value, S.outT); $("outT").onchange = e => setTrim(S.inT, +e.target.value);
  $("split").onclick = () => { const t = +V.currentTime.toFixed(2); if (t <= S.inT + .05 || t >= S.outT - .05) { status("Move inside the trimmed part to split it."); return; } if (!S.splits.some(x => Math.abs(x - t) < .05)) S.splits.push(t); S.splits.sort((a, b) => a - b); drawTL(); drawSegs(); };
  $("clearSplits").onclick = () => { S.splits = []; drawTL(); drawSegs(); };
  const segments = () => { const pts = [S.inT, ...S.splits.filter(x => x > S.inT && x < S.outT), S.outT]; return pts.slice(1).map((b, i) => [pts[i], b]); };
  function drawSegs() {
    const sg = segments();
    $("segs").innerHTML = sg.length < 2 ? `<li class="note">No splits yet: the trimmed part is one clip. Move to a point and choose <b>Split here</b> to cut it into clips.</li>` : sg.map(([a, b], i) => `<li><b>Clip ${i + 1}</b><span>${fmtT(a)} – ${fmtT(b)} (${(b - a).toFixed(1)} s)</span><button class="tbtn sm" type="button" data-sp="${i}">▶ Play</button><button class="tbtn sm" type="button" data-sx="${i}">Export</button>${i ? `<button class="tbtn sm" type="button" data-sd="${i}">Remove the split before it</button>` : ""}</li>`).join("");
  }
  $("segs").onclick = e => { const sg = segments(), p = e.target.closest("[data-sp]"), x = e.target.closest("[data-sx]"), d = e.target.closest("[data-sd]");
    if (p) { const [a, b] = sg[+p.dataset.sp]; playRange(a, b); } if (x) { const i = +x.dataset.sx, [a, b] = sg[i]; runExports([{ a, b, rect: S.crop.on ? S.crop : null, ar: null, name: `${S.name}-clip${i + 1}` }]); }
    if (d) { const t = sg[+d.dataset.sd][0]; S.splits = S.splits.filter(s => Math.abs(s - t) > .001); drawTL(); drawSegs(); } };

  // ---------- timeline ----------
  const TL = $("tl");
  function drawTL() {
    if (!S.dur) return; const dpr = window.devicePixelRatio || 1, W = TL.clientWidth, H = TL.clientHeight; if (TL.width !== W * dpr) { TL.width = W * dpr; TL.height = H * dpr; }
    const g = TL.getContext("2d"), X = t => t / S.dur * W; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    g.fillStyle = "rgba(0,0,0,.06)"; g.fillRect(0, 0, W, H);
    if (S.buf) { if (!S.wave || S.wave.W !== W) { const d = S.buf.getChannelData(0), step = d.length / W, out = []; for (let i = 0; i < W; i++) { let m = 0; for (let j = Math.floor(i * step), e = Math.floor((i + 1) * step); j < e; j += 16) m = Math.max(m, Math.abs(d[j])); out.push(m); } S.wave = { W, out }; } g.fillStyle = "rgba(0,0,0,.25)"; S.wave.out.forEach((m, i) => { const h = m * (H - 22); g.fillRect(i, H / 2 + 4 - h / 2, 1, Math.max(1, h)); }); }
    g.fillStyle = "rgba(255,210,122,.45)"; g.fillRect(X(S.inT), 14, X(S.outT) - X(S.inT), H - 14);
    if (S.ig.on) { g.fillStyle = "rgba(238,42,123,.8)"; g.fillRect(X(S.ig.inT), 2, Math.max(2, X(S.ig.outT) - X(S.ig.inT)), 8); }
    g.fillStyle = "#222"; S.splits.forEach(t => g.fillRect(X(t) - 1, 12, 2, H - 12));
    g.fillStyle = "#c0392b"; g.fillRect(X(V.currentTime) - 1, 0, 2, H);
  }
  let tlDrag = false; const tlSeek = e => { const r = TL.getBoundingClientRect(); seek((e.clientX - r.left) / r.width * S.dur); };
  TL.addEventListener("pointerdown", e => { tlDrag = true; TL.setPointerCapture(e.pointerId); tlSeek(e); }); TL.addEventListener("pointermove", e => { if (tlDrag) tlSeek(e); }); TL.addEventListener("pointerup", () => { tlDrag = false; });
  window.addEventListener("resize", () => { S.wave = null; drawTL(); drawBoxes(); });

  // ---------- crop and Instagram boxes (normalized 0–1 coordinates) ----------
  const pxAR = r => r.w * S.vw / (r.h * S.vh);
  function fitAR(r, ar) { if (!ar) return; const cx = r.x + r.w / 2, cy = r.y + r.h / 2; let w = r.w, h = w * S.vw / (ar * S.vh); if (h > 1) { h = 1; w = h * ar * S.vh / S.vw; } if (w > 1) { w = 1; h = w * S.vw / (ar * S.vh); } r.w = w; r.h = h; r.x = Math.min(1 - w, Math.max(0, cx - w / 2)); r.y = Math.min(1 - h, Math.max(0, cy - h / 2)); }
  function igFit() { const r = S.ig; r.w = 1; r.h = 1; fitAR(r, r.ar); r.x = (1 - r.w) / 2; r.y = (1 - r.h) / 2; }
  function drawBoxes() {
    [["cropBox", S.crop], ["igBox", S.ig]].forEach(([id, r]) => { const el = $(id); el.hidden = !r.on; Object.assign(el.style, { left: r.x * 100 + "%", top: r.y * 100 + "%", width: r.w * 100 + "%", height: r.h * 100 + "%" }); });
    $("cropInfo").textContent = S.crop.on ? `${Math.round(S.crop.w * S.vw)} × ${Math.round(S.crop.h * S.vh)} pixels` : "Showing the whole frame.";
  }
  let drag = null;
  $("stage").addEventListener("pointerdown", e => {
    const h = e.target.closest(".handle"), box = e.target.closest(".box"); if (!box) return; e.preventDefault();
    const r = box.id === "cropBox" ? S.crop : S.ig, st = $("stage").getBoundingClientRect(); drag = { r, mode: h ? "size" : "move", x0: e.clientX, y0: e.clientY, r0: { ...r }, st, ar: box.id === "igBox" ? r.ar : (S.crop.ar === "free" ? 0 : +S.crop.ar) }; box.setPointerCapture(e.pointerId);
  });
  $("stage").addEventListener("pointermove", e => {
    if (!drag) return; const { r, r0, st } = drag, dx = (e.clientX - drag.x0) / st.width, dy = (e.clientY - drag.y0) / st.height;
    if (drag.mode === "move") { r.x = Math.min(1 - r.w, Math.max(0, r0.x + dx)); r.y = Math.min(1 - r.h, Math.max(0, r0.y + dy)); }
    else { r.w = Math.max(.05, Math.min(1 - r.x, r0.w + dx)); r.h = drag.ar ? r.w * S.vw / (drag.ar * S.vh) : Math.max(.05, Math.min(1 - r.y, r0.h + dy)); if (r.y + r.h > 1) { r.h = 1 - r.y; if (drag.ar) r.w = r.h * drag.ar * S.vh / S.vw; } }
    drawBoxes();
  });
  window.addEventListener("pointerup", () => { drag = null; });
  ["cropBox", "igBox"].forEach(id => $(id).addEventListener("keydown", e => {
    const r = id === "cropBox" ? S.crop : S.ig, ar = id === "igBox" ? r.ar : (S.crop.ar === "free" ? 0 : +S.crop.ar), st = .01 * (e.altKey ? .2 : 1), K = e.key; let hit = true;
    if (e.shiftKey) { if (K === "ArrowRight") r.w = Math.min(1 - r.x, r.w + st); else if (K === "ArrowLeft") r.w = Math.max(.05, r.w - st); else if (K === "ArrowDown") r.h = Math.min(1 - r.y, r.h + st); else if (K === "ArrowUp") r.h = Math.max(.05, r.h - st); else hit = false; if (hit && ar) { r.h = r.w * S.vw / (ar * S.vh); fitAR(r, ar); } }
    else if (K === "ArrowRight") r.x = Math.min(1 - r.w, r.x + st); else if (K === "ArrowLeft") r.x = Math.max(0, r.x - st); else if (K === "ArrowDown") r.y = Math.min(1 - r.h, r.y + st); else if (K === "ArrowUp") r.y = Math.max(0, r.y - st); else hit = false;
    if (hit) { e.preventDefault(); drawBoxes(); }
  }));
  $("cropOn").onclick = e => { S.crop.on = !S.crop.on; e.currentTarget.setAttribute("aria-pressed", S.crop.on); drawBoxes(); };
  $("cropAR").onchange = e => { S.crop.ar = e.target.value; if (S.crop.ar !== "free") fitAR(S.crop, +S.crop.ar); S.crop.on = true; $("cropOn").setAttribute("aria-pressed", "true"); drawBoxes(); };
  $("cropReset").onclick = () => { Object.assign(S.crop, { x: .1, y: .1, w: .8, h: .8 }); if (S.crop.ar !== "free") fitAR(S.crop, +S.crop.ar); drawBoxes(); };
  $("igOn").onclick = e => { S.ig.on = !S.ig.on; e.currentTarget.setAttribute("aria-pressed", S.ig.on); e.currentTarget.textContent = S.ig.on ? "Hide the Instagram frame" : "Show the Instagram frame"; drawBoxes(); drawTL(); };
  $("igAR").onchange = e => { S.ig.ar = +e.target.value; fitAR(S.ig, S.ig.ar); S.ig.on = true; $("igOn").setAttribute("aria-pressed", "true"); drawBoxes(); };
  $("igCenter").onclick = () => { S.ig.x = (1 - S.ig.w) / 2; S.ig.y = (1 - S.ig.h) / 2; drawBoxes(); };
  const setIG = (a, b) => { S.ig.inT = Math.max(0, Math.min(a, S.dur)); S.ig.outT = Math.max(S.ig.inT + .1, Math.min(b, S.dur)); S.ig.on = true; $("igOn").setAttribute("aria-pressed", "true"); syncInputs(); drawTL(); drawBoxes(); };
  $("igIn").onclick = () => setIG(V.currentTime, Math.max(S.ig.outT, V.currentTime + .1)); $("igOut").onclick = () => setIG(Math.min(S.ig.inT, V.currentTime - .1), V.currentTime);
  $("igInT").onchange = e => setIG(+e.target.value, S.ig.outT); $("igOutT").onchange = e => setIG(S.ig.inT, +e.target.value);
  $("igPlay").onclick = () => playRange(S.ig.inT, S.ig.outT);

  // ---------- export ----------
  const MIMES = [["video/mp4;codecs=avc1.640028,mp4a.40.2", "MP4 (H.264 + AAC)", "mp4"], ["video/mp4;codecs=avc1.42E01F,mp4a.40.2", "MP4 (H.264 + AAC)", "mp4"], ["video/mp4", "MP4", "mp4"], ["video/webm;codecs=vp9,opus", "WebM (VP9 + Opus)", "webm"], ["video/webm;codecs=vp8,opus", "WebM (VP8 + Opus)", "webm"], ["video/webm", "WebM", "webm"]];
  const okM = window.MediaRecorder ? MIMES.filter(([m]) => MediaRecorder.isTypeSupported(m)).filter((x, i, a) => a.findIndex(y => y[1] === x[1]) === i) : [];
  $("fmt").innerHTML = okM.length ? okM.map(([m, l], i) => `<option value="${i}">${l}</option>`).join("") : `<option>Video export isn't available in this browser</option>`;
  if (!okM.length) { $("exMain").disabled = $("exAll").disabled = $("igExport").disabled = true; }
  const prog = f => { $("prog").style.width = Math.round(Math.max(0, Math.min(1, f)) * 100) + "%"; };
  function save(blob, name) { const url = URL.createObjectURL(blob), a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 8000); }
  const even = n => Math.max(2, Math.round(n / 2) * 2);
  // one real-time recording of [a, b] from rect (normalized) to a canvas of the chosen size
  async function exportClip({ a, b, rect, outW, outH, name, mime }) {
    audioUp(); upd();
    const r = rect || { x: 0, y: 0, w: 1, h: 1 }, sx = r.x * S.vw, sy = r.y * S.vh, sw = r.w * S.vw, sh = r.h * S.vh, fps = +$("fps").value;
    if (!outW) { const lim = $("res").value === "orig" ? 1e9 : +$("res").value, sc = Math.min(1, lim / Math.min(sw, sh)); outW = even(sw * sc); outH = even(sh * sc); }
    const cv = document.createElement("canvas"); cv.width = outW; cv.height = outH; const g = cv.getContext("2d");
    const stream = cv.captureStream(fps), tracks = [...stream.getVideoTracks()]; if (DEST) tracks.push(...DEST.stream.getAudioTracks());
    const ms = new MediaStream(tracks), rec = new MediaRecorder(ms, { mimeType: mime[0], videoBitsPerSecond: outW * outH >= 1920 * 1080 * .9 ? 10e6 : outW * outH > 1e6 ? 6e6 : 3.5e6, audioBitsPerSecond: 192000 });
    const chunks = []; rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    const done = new Promise(ok => { rec.onstop = ok; });
    V.pause(); stopAt = null; V.currentTime = a; await new Promise(ok => { V.onseeked = () => { V.onseeked = null; ok(); }; });
    const draw = () => g.drawImage(V, sx, sy, sw, sh, 0, 0, outW, outH);
    draw(); MON.gain.value = $("mon").value === "on" ? 1 : 0;
    rec.start(500); await V.play();
    await new Promise(ok => {
      const step = () => { draw(); prog((V.currentTime - a) / (b - a)); if (S.cancel || V.currentTime >= b || V.ended) { V.pause(); ok(); return; } if (V.requestVideoFrameCallback) V.requestVideoFrameCallback(step); else requestAnimationFrame(step); };
      if (V.requestVideoFrameCallback) V.requestVideoFrameCallback(step); else requestAnimationFrame(step);
    });
    rec.stop(); await done; MON.gain.value = 1;
    if (S.cancel) return null;
    const blob = new Blob(chunks, { type: mime[0].split(";")[0] }), fname = `${name}.${mime[2]}`; save(blob, fname); return { fname, size: blob.size };
  }
  async function runExports(list) {
    if (S.busy) return; if (!okM.length) { status("This browser can't record video. Try Chrome, Edge or Safari."); return; }
    S.busy = true; S.cancel = false; $("cancel").hidden = false; ["exMain", "exAll", "igExport", "exAudio"].forEach(id => $(id).disabled = true);
    const mime = okM[+$("fmt").value] || okM[0], saved = [];
    try {
      for (let i = 0; i < list.length && !S.cancel; i++) { const it = list[i]; status(`Exporting ${list.length > 1 ? `clip ${i + 1} of ${list.length}` : it.name}… (${fmtT(it.b - it.a)} in real time)`); const r = await exportClip(Object.assign({ mime }, it)); if (r) saved.push(r); }
      status(S.cancel ? "Export cancelled." : `Saved ${saved.map(s => `${s.fname} (${(s.size / 1048576).toFixed(1)} MB)`).join(", ")}.`);
      window.__lastExport = saved;
    } catch (e) { status("Export failed: " + e.message); }
    S.busy = false; $("cancel").hidden = true; prog(0); ["exMain", "exAll", "igExport", "exAudio"].forEach(id => $(id).disabled = false);
  }
  $("cancel").onclick = () => { S.cancel = true; };
  $("exMain").onclick = () => runExports([{ a: S.inT, b: S.outT, rect: S.crop.on ? S.crop : null, name: `${S.name}-edit` }]);
  $("exAll").onclick = () => runExports(segments().map(([a, b], i) => ({ a, b, rect: S.crop.on ? S.crop : null, name: `${S.name}-clip${i + 1}` })));
  $("igExport").onclick = () => { if (S.ig.outT - S.ig.inT > 180.5) { status("Instagram allows up to 3 minutes: shorten the Instagram range first."); return; } const W = 1080, H = Math.round(1080 / S.ig.ar); S.ig.on = true; drawBoxes(); runExports([{ a: S.ig.inT, b: S.ig.outT, rect: S.ig, outW: W, outH: even(H), name: `${S.name}-instagram-${S.ig.ar < .6 ? "9x16" : S.ig.ar < .9 ? "4x5" : "1x1"}` }]); };

  // audio only: offline render of the trimmed part through the same chain (faster than real time)
  function wav(b) { const ch = b.numberOfChannels, n = b.length, ab = new ArrayBuffer(44 + n * ch * 2), v = new DataView(ab), w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, "RIFF"); v.setUint32(4, 36 + n * ch * 2, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true); v.setUint32(24, b.sampleRate, true); v.setUint32(28, b.sampleRate * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, n * ch * 2, true);
    const cs = Array.from({ length: ch }, (_, c) => b.getChannelData(c)); let o = 44; for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const x = Math.max(-1, Math.min(1, cs[c][i])); v.setInt16(o, x < 0 ? x * 32768 : x * 32767, true); o += 2; } return new Blob([ab], { type: "audio/wav" }); }
  const lame = () => new Promise((ok, no) => { if (window.lamejs) return ok(); const sc = document.createElement("script"); sc.src = "assets/lame.min.js?v=5a6238f8"; sc.onload = ok; sc.onerror = no; document.head.appendChild(sc); });
  async function mp3(b) { await lame(); const enc = new lamejs.Mp3Encoder(2, b.sampleRate, 192), I = d => Int16Array.from(d, x => Math.max(-32768, Math.min(32767, x * 32767))), L = I(b.getChannelData(0)), R = I(b.getChannelData(b.numberOfChannels > 1 ? 1 : 0)), parts = [];
    for (let i = 0; i < L.length; i += 1152) { const x = enc.encodeBuffer(L.subarray(i, i + 1152), R.subarray(i, i + 1152)); if (x.length) parts.push(new Uint8Array(x)); } const e = enc.flush(); if (e.length) parts.push(new Uint8Array(e)); return new Blob(parts, { type: "audio/mpeg" }); }
  $("exAudio").onclick = async () => {
    if (!S.buf) { status("The sound couldn't be read from this video, so audio-only export isn't available."); return; }
    status("Rendering the audio…"); const b = S.buf, sr = b.sampleRate, s0 = Math.floor(S.inT * sr), n = Math.floor((S.outT - S.inT) * sr) + Math.floor(sr * (P.revMix ? Math.min(P.revSize, 3) : .05));
    const C = new OfflineAudioContext(2, n, sr), ch = chain(C); ch.update(bypass); ch.output.connect(C.destination);
    const src = C.createBufferSource(); src.buffer = b; src.connect(ch.input); src.start(0, S.inT, S.outT - S.inT);
    const out = await C.startRendering(), fmt = $("afmt").value, blob = fmt === "mp3" ? await mp3(out) : wav(out), name = `${S.name}-audio.${fmt}`; save(blob, name);
    status(`Saved ${name} (${(blob.size / 1048576).toFixed(1)} MB).`); window.__lastAudio = { dur: out.duration, size: blob.size };
  };
  window.__vcm = { S, P, open, segments, runExports };   // used by automated tests
})();
