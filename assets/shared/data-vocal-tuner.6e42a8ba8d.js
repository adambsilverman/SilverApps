
(() => {
  const $ = id => document.getElementById(id);
  const NAMES = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
  const SCALES = { "Major": [0, 2, 4, 5, 7, 9, 11], "Natural minor": [0, 2, 3, 5, 7, 8, 10], "Major pentatonic": [0, 2, 4, 7, 9], "Minor pentatonic": [0, 3, 5, 7, 10], "Chromatic": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] };
  $("key").innerHTML = NAMES.map((n, i) => `<option value="${i}">${n}</option>`).join("");
  let AC = null; const ac = () => { if (!AC) { const C = window.AudioContext || window.webkitAudioContext; AC = new C(); } if (AC.state === "suspended") AC.resume(); return AC; };
  let X = null, SR = 44100, name = "vocal", P = null, OUTB = null, src = null;   // X: mono input; P: pitch analysis; OUTB: processed buffer

  // ---------- loading ----------
  function fileRate(u) { const s4 = o => String.fromCharCode(u[o], u[o + 1], u[o + 2], u[o + 3]), le32 = o => (u[o] | u[o + 1] << 8 | u[o + 2] << 16 | u[o + 3] << 24) >>> 0;
    try { if (s4(0) === "RIFF") for (let o = 12; o < u.length - 8;) { const id = s4(o), sz = le32(o + 4); if (id === "fmt ") return le32(o + 12); o += 8 + sz + (sz & 1); } if (s4(0) === "fLaC") return (u[18] << 12) | (u[19] << 4) | (u[20] >> 4); } catch (e) {} return 0; }
  async function loadData(data, nm) {
    $("info").textContent = "Opening…";
    try {
      const r = fileRate(new Uint8Array(data)) || 44100, rate = [22050, 32000, 44100, 48000].includes(r) ? r : 44100;
      let b; try { b = await new OfflineAudioContext(1, 1, rate).decodeAudioData(data.slice(0)); } catch (e) { b = await new Promise((ok, no) => ac().decodeAudioData(data, ok, no)); }
      SR = b.sampleRate; const n = Math.min(b.length, SR * 120); X = new Float32Array(n);
      for (let c = 0; c < b.numberOfChannels; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) X[i] += d[i] / b.numberOfChannels; }
      name = nm.replace(/\.[^.]+$/, "");
      $("info").textContent = `${nm}: ${(n / SR).toFixed(1)} s${b.length > n ? " (shortened to 2 minutes)" : ""}. Analyzing pitch…`;
      await new Promise(r => setTimeout(r, 30));
      P = analyze(X, SR); $("fxBox").hidden = false; $("expBox").hidden = false;
      const voiced = P.f0.filter(f => f > 0).length / Math.max(1, P.f0.length);
      $("info").textContent = `${nm}: ${(n / SR).toFixed(1)} s, ${SR.toLocaleString("en-US")} Hz. ${voiced < .1 ? "Very little pitched singing was found; results may be odd." : "Pitch analyzed."}`;
      detectKey(); process();
    } catch (e) { $("info").textContent = "This browser couldn't read that file. Try WAV or MP3."; }
  }
  $("file").onchange = async e => { const f = e.target.files[0]; if (f) loadData(await f.arrayBuffer(), f.name); };
  const drop = $("drop");
  ["dragenter", "dragover"].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove("over"); }));
  drop.addEventListener("drop", async e => { const f = e.dataTransfer.files[0]; if (f) loadData(await f.arrayBuffer(), f.name); });
  let rec = null;
  $("rec").onclick = async () => {
    if (rec) { rec.stop(); return; }
    if (!navigator.mediaDevices || !window.MediaRecorder) { $("info").textContent = "Recording isn't available in this browser."; return; }
    try { const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }); const chunks = []; rec = new MediaRecorder(stream);
      rec.ondataavailable = e => chunks.push(e.data); rec.onstop = async () => { stream.getTracks().forEach(t => t.stop()); clearTimeout(rec.__t); rec = null; $("rec").textContent = "● Record with the microphone"; $("rec").setAttribute("aria-pressed", "false"); loadData(await new Blob(chunks).arrayBuffer(), "recording"); };
      rec.start(); rec.__t = setTimeout(() => rec && rec.stop(), 120000); $("rec").textContent = "■ Stop recording"; $("rec").setAttribute("aria-pressed", "true"); $("info").textContent = "Recording… sing, then press Stop recording."; }
    catch (e) { $("info").textContent = "The microphone is blocked or unavailable."; }
  };

  // ---------- pitch analysis (YIN on a 4× downsampled copy) ----------
  function analyze(x, sr) {
    const ds = sr >= 44100 ? 4 : sr >= 22050 ? 2 : 1, r = sr / ds, y = new Float32Array(Math.floor(x.length / ds));
    for (let i = 0; i < y.length; i++) { let s = 0; for (let k = 0; k < ds; k++) s += x[i * ds + k]; y[i] = s / ds; }
    const W = Math.round(r * .04), hop = Math.round(r * .01), tmin = Math.floor(r / 1000), tmax = Math.ceil(r / 65), f0 = [], d = new Float32Array(tmax + 1);
    let peak = 0; for (let i = 0; i < x.length; i += 64) peak = Math.max(peak, Math.abs(x[i]));
    for (let s = 0; s + W + tmax < y.length; s += hop) {
      let e = 0; for (let i = 0; i < W; i++) e += y[s + i] * y[s + i]; const rms = Math.sqrt(e / W);
      if (rms < peak * .03) { f0.push(0); continue; }
      let run = 0; d[0] = 1;
      for (let t = 1; t <= tmax; t++) { let sum = 0; for (let i = 0; i < W; i++) { const q = y[s + i] - y[s + i + t]; sum += q * q; } run += sum; d[t] = run ? sum * t / run : 1; }
      let tau = -1; for (let t = tmin; t <= tmax; t++) if (d[t] < .2) { while (t + 1 <= tmax && d[t + 1] < d[t]) t++; tau = t; break; }
      if (tau < 0) { let bt = tmin; for (let t = tmin; t <= tmax; t++) if (d[t] < d[bt]) bt = t; if (d[bt] < .35) tau = bt; }   // a less clear but still pitched frame
      if (tau < 0) { f0.push(0); continue; }
      const a = d[tau - 1] || d[tau], b = d[tau], c = d[tau + 1] || d[tau], den = a - 2 * b + c, tt = tau + (den ? (a - c) / (2 * den) : 0);
      f0.push(r / tt);
    }
    // fix octave jumps against the local median, median-smooth, drop isolated blips, and bridge short gaps (up to 80 ms)
    const med = (a, i, r) => { const w = a.slice(Math.max(0, i - r), i + r + 1).filter(z => z > 0).sort((p, q) => p - q); return w.length ? w[w.length >> 1] : 0; };
    let m = f0.map((v, i) => { if (!v) return 0; const md = med(f0, i, 6); if (!md) return v; const r = v / md; return r > 1.8 && r < 2.2 ? v / 2 : r > .45 && r < .55 ? v * 2 : v; });
    m = m.map((v, i) => { const w = m.slice(Math.max(0, i - 2), i + 3).filter(z => z > 0).sort((p, q) => p - q); return v > 0 && w.length >= 3 ? w[w.length >> 1] : 0; });
    for (let i = 1; i < m.length; i++) if (!m[i] && m[i - 1]) { let j = i; while (j < m.length && !m[j]) j++; if (j < m.length && j - i <= 8) { const a = Math.log(m[i - 1]), b = Math.log(m[j]); for (let k = i; k < j; k++) m[k] = Math.exp(a + (b - a) * (k - i + 1) / (j - i + 1)); } i = j; }
    return { f0: m, hop: hop * ds / sr };
  }
  const midiOf = f => 69 + 12 * Math.log2(f / 440);

  // ---------- target pitch curve ----------
  const S = { amt: 100, spd: 20, robot: false, xp: 0, fm: 0, harm: "", mix: 60 };
  function snap(m, key, sc) { let best = m, bd = 99; for (let o = -1; o <= 10; o++) sc.forEach(pc => { const c = 12 * o + key + pc, dd = Math.abs(c - m); if (dd < bd) { bd = dd; best = c; } }); return best; }
  function shiftCurve() {   // semitone shift per analysis frame (0 for unvoiced frames, plus transposition)
    const key = +$("key").value, sc = SCALES[$("scale").value], f0 = P.f0, out = new Float32Array(f0.length), a = 1 - Math.exp(-P.hop * 1000 / Math.max(1, S.spd));
    let robotNote = null; if (S.robot) { const ms = f0.filter(f => f > 0).map(midiOf).sort((p, q) => p - q); robotNote = ms.length ? snap(ms[ms.length >> 1], key, [0]) : 60; }
    let c = 0, was = false;
    for (let i = 0; i < f0.length; i++) {
      if (!f0[i]) { out[i] = c; was = false; continue; }
      const m = midiOf(f0[i]), target = S.robot ? robotNote : snap(m, key, sc), want = (target - m) * S.amt / 100;
      c = S.spd <= 0 ? want : !was && i && !f0[i - 1] && Math.abs(want - c) > 1 ? want : c + (want - c) * a; was = true; out[i] = c;
    }
    return out;
  }

  // ---------- TD-PSOLA pitch shifting with optional formant shift ----------
  function psola(x, sr, f0, hop, shiftSt, formant) {
    const N = x.length, y = new Float32Array(N), fr = i => Math.min(f0.length - 1, Math.max(0, Math.floor(i / sr / hop)));
    // analysis marks: one period apart in voiced parts, every 5 ms elsewhere
    const marks = []; let t = 0;
    while (t < N) {
      const k = fr(t), f = f0[k], T = f > 0 ? sr / f : sr * .005;
      marks.push([t, T, f > 0]); t += Math.max(1, T);   // marks one period apart (fractional), so the grains stay in phase
    }
    let ts = 0, mi = 0;
    while (ts < N) {
      while (mi + 1 < marks.length && Math.abs(marks[mi + 1][0] - ts) <= Math.abs(marks[mi][0] - ts)) mi++;
      const [ta, Ta, voiced] = marks[mi], k = fr(ts), ratio = Math.pow(2, ((voiced ? shiftSt[k] : 0) + S.xp) / 12), To = Ta / ratio;
      const fmr = formant, half = Math.max(2, Math.round(Math.max(Ta, To) / fmr)), g = To / half;   // grains at least as long as the output spacing, so big downward shifts don't leave gaps
      for (let j = -half; j <= half; j++) {
        const o = Math.round(ts) + j; if (o < 0 || o >= N) continue;
        const sp = ta + j * fmr, i0 = Math.floor(sp), fra = sp - i0; if (i0 < 0 || i0 + 1 >= N) continue;
        const w = .5 + .5 * Math.cos(Math.PI * j / half);
        y[o] += (x[i0] * (1 - fra) + x[i0 + 1] * fra) * w * g;
      }
      ts += Math.max(1, To);
    }
    return y;
  }
  const HARM = { "3u": [{ d: 2 }], "3d": [{ d: -2 }], "5u": [{ d: 4 }], "6d": [{ d: -5 }], "8u": [{ st: 12 }], "8d": [{ st: -12 }], "35": [{ d: 2 }, { d: 4 }] };   // d: scale steps, st: semitones
  function harmonyCurve(sh, steps) {   // a diatonic interval above/below the corrected note
    const key = +$("key").value, sc = SCALES[$("scale").value].length >= 7 ? SCALES[$("scale").value] : SCALES.Major, out = new Float32Array(sh.length);
    P.f0.forEach((f, i) => { if (!f) return; const m = Math.round(midiOf(f) + sh[i]), rel = ((m - key) % 12 + 12) % 12; let idx = sc.indexOf(rel); if (idx < 0) { out[i] = sh[i] + (steps > 0 ? 3 : -3); return; }
      const j = idx + steps, oct = Math.floor(j / sc.length), tgt = key + sc[((j % sc.length) + sc.length) % sc.length] + 12 * oct + (m - key - rel); out[i] = sh[i] + (tgt - m); });
    return out;
  }
  let busy = 0;
  function process() {
    if (!X) return; const my = ++busy; $("status").textContent = "Processing…";
    setTimeout(() => {
      if (my !== busy) return;
      const t = performance.now(), sh = shiftCurve(), fmt = Math.pow(2, S.fm / 12), main = psola(X, SR, P.f0, P.hop, sh, fmt);
      const voices = [main]; let hcurves = [];
      if (S.harm) HARM[S.harm].forEach(h => { const hc = h.st ? sh.map(v => v + h.st) : harmonyCurve(sh, h.d); hcurves.push(hc); voices.push(psola(X, SR, P.f0, P.hop, hc, fmt)); });
      const b = ac().createBuffer(2, X.length, SR), L = b.getChannelData(0), R = b.getChannelData(1), hm = S.mix / 100;
      for (let i = 0; i < X.length; i++) { let l = main[i], r = main[i]; for (let v = 1; v < voices.length; v++) { const pan = voices.length === 2 ? 0 : v === 1 ? -.5 : .5; l += voices[v][i] * hm * (1 - pan) * .8; r += voices[v][i] * hm * (1 + pan) * .8; } L[i] = l; R[i] = r; }
      let pk = 0; for (let i = 0; i < X.length; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i])); let xp = 0; for (let i = 0; i < X.length; i++) xp = Math.max(xp, Math.abs(X[i]));
      if (pk > .98 || pk > xp * 1.4) { const g = Math.min(.98, xp * 1.2) / pk; for (let i = 0; i < X.length; i++) { L[i] *= g; R[i] *= g; } }
      OUTB = b; draw(sh, hcurves); $("status").textContent = `Done in ${Math.round(performance.now() - t)} ms.`;
    }, 20);
  }

  // ---------- pitch graph ----------
  function draw(sh, hcs) {
    const cv = $("graph"), W = cv.clientWidth * devicePixelRatio, H = cv.clientHeight * devicePixelRatio; cv.width = W; cv.height = H;
    const g = cv.getContext("2d"), f0 = P.f0, ms = f0.filter(f => f > 0).map(midiOf); if (!ms.length) { g.clearRect(0, 0, W, H); return; }
    const all = ms.concat(f0.map((f, i) => f ? midiOf(f) + sh[i] : null).filter(v => v != null)), lo = Math.floor(Math.min(...all)) - 2, hi = Math.ceil(Math.max(...all)) + 2 + (hcs.length ? 6 : 0), lo2 = lo - (hcs.length ? 6 : 0);
    const x = i => 40 * devicePixelRatio + (W - 46 * devicePixelRatio) * i / f0.length, y = m => H - 6 - (H - 12) * (m - lo2) / (hi - lo2);
    const key = +$("key").value, sc = SCALES[$("scale").value];
    g.clearRect(0, 0, W, H); g.font = `${11 * devicePixelRatio}px sans-serif`;
    for (let m = Math.ceil(lo2); m <= hi; m++) { const pc = ((m - key) % 12 + 12) % 12; if (!sc.includes(pc)) continue; g.fillStyle = pc === 0 ? "rgba(0,0,0,.18)" : "rgba(0,0,0,.08)"; g.fillRect(40 * devicePixelRatio, y(m), W, 1); if ((hi - lo2) < 30 || pc === 0) { g.fillStyle = "#777"; g.fillText(NAMES[m % 12] + (Math.floor(m / 12) - 1), 2, y(m) + 4); } }
    const line = (fn, color, wd) => { g.strokeStyle = color; g.lineWidth = wd * devicePixelRatio; g.beginPath(); let on = false; f0.forEach((f, i) => { if (!f) { on = false; return; } const v = fn(f, i); if (!on) g.moveTo(x(i), y(v)); else g.lineTo(x(i), y(v)); on = true; }); g.stroke(); };
    line(f => midiOf(f), "#999", 2);
    hcs.forEach(hc => line((f, i) => midiOf(f) + hc[i] + S.xp, "rgba(46,109,180,.8)", 1.5));
    line((f, i) => midiOf(f) + sh[i] + S.xp, "#c0392b", 2);
  }

  // ---------- key detection ----------
  function detectKey() {
    const w = new Array(12).fill(0); P.f0.forEach(f => { if (f) w[((Math.round(midiOf(f)) % 12) + 12) % 12]++; });
    let best = 0, bs = -1, minor = false; for (let k = 0; k < 12; k++) [[SCALES.Major, false], [SCALES["Natural minor"], true]].forEach(([sc, mi]) => { const s = sc.reduce((a, pc) => a + w[(k + pc) % 12], 0) + w[k] * .5 + w[(k + 7) % 12] * .25; if (s > bs) { bs = s; best = k; minor = mi; } });
    $("key").value = best; $("scale").value = minor ? "Natural minor" : "Major"; return NAMES[best] + (minor ? " minor" : " major");
  }
  $("detect").onclick = () => { if (!P) return; const k = detectKey(); $("status").textContent = `Best guess: ${k}.`; process(); };

  // ---------- controls ----------
  const sync = () => { $("amtO").textContent = S.amt + "%"; $("spdO").textContent = S.spd + " ms" + (S.spd === 0 ? " (instant)" : ""); $("xpO").textContent = (S.xp > 0 ? "+" : "") + S.xp + " semitone" + (Math.abs(S.xp) === 1 ? "" : "s"); $("fmO").textContent = S.fm === 0 ? "0" : (S.fm > 0 ? "+" : "") + S.fm + (S.fm > 0 ? " (smaller voice)" : " (bigger voice)"); $("mixO").textContent = S.mix + "%";
    $("amt").value = S.amt; $("spd").value = S.spd; $("xp").value = S.xp; $("fm").value = S.fm; $("mix").value = S.mix; $("harm").value = S.harm; $("robot").checked = S.robot; };
  let deb = 0; const later = () => { clearTimeout(deb); deb = setTimeout(process, 250); };
  ["amt", "spd", "xp", "fm", "mix"].forEach(id => $(id).addEventListener("input", e => { S[id] = +e.target.value; sync(); later(); }));
  $("harm").onchange = e => { S.harm = e.target.value; later(); };
  $("robot").onchange = e => { S.robot = e.target.checked; later(); };
  ["key", "scale"].forEach(id => $(id).addEventListener("change", later));
  const PRE = { natural: { amt: 80, spd: 120, robot: false, xp: 0, fm: 0, harm: "" }, hard: { amt: 100, spd: 0, robot: false, xp: 0, fm: 0, harm: "" }, robot: { amt: 100, spd: 0, robot: true, xp: 0, fm: 0, harm: "" },
    chip: { amt: 0, spd: 40, robot: false, xp: 7, fm: 7, harm: "" }, deep: { amt: 0, spd: 40, robot: false, xp: -7, fm: -4, harm: "" }, helium: { amt: 0, spd: 40, robot: false, xp: 0, fm: 8, harm: "" }, giant: { amt: 0, spd: 40, robot: false, xp: 0, fm: -7, harm: "" },
    harm: { amt: 100, spd: 30, robot: false, xp: 0, fm: 0, harm: "3u", mix: 60 }, octave: { amt: 90, spd: 40, robot: false, xp: 0, fm: 0, harm: "8d", mix: 55 }, off: { amt: 0, spd: 40, robot: false, xp: 0, fm: 0, harm: "" } };
  document.querySelectorAll("[data-p]").forEach(b => b.onclick = () => { Object.assign(S, PRE[b.dataset.p]); sync(); document.querySelectorAll("[data-p]").forEach(x => x.setAttribute("aria-pressed", x === b)); process(); });
  sync();

  // ---------- playback and export ----------
  function stop() { if (src) { try { src.stop(); } catch (e) {} src = null; } }
  function playBuf(b) { stop(); ac(); src = AC.createBufferSource(); src.buffer = b; src.connect(AC.destination); src.start(); }
  $("playO").onclick = () => { if (!X) return; const b = ac().createBuffer(1, X.length, SR); b.getChannelData(0).set(X); playBuf(b); };
  $("playP").onclick = () => { if (OUTB) playBuf(OUTB); };
  $("stop").onclick = stop;
  function wav(b) {
    const ch = b.numberOfChannels, n = b.length, ab = new ArrayBuffer(44 + n * ch * 2), v = new DataView(ab), w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, "RIFF"); v.setUint32(4, 36 + n * ch * 2, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true); v.setUint32(24, b.sampleRate, true); v.setUint32(28, b.sampleRate * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, n * ch * 2, true);
    const cs = Array.from({ length: ch }, (_, c) => b.getChannelData(c)); let o = 44; for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const x = Math.max(-1, Math.min(1, cs[c][i])); v.setInt16(o, x < 0 ? x * 32768 : x * 32767, true); o += 2; }
    return new Blob([ab], { type: "audio/wav" });
  }
  async function mp3(b) {
    if (!window.lamejs) await new Promise((ok, no) => { const s = document.createElement("script"); s.src = "assets/lame.min.js?v=5a6238f8"; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
    const rate = [32000, 44100, 48000].includes(b.sampleRate) ? b.sampleRate : 44100;
    if (rate !== b.sampleRate) { const off = new OfflineAudioContext(2, Math.ceil(b.duration * rate), rate), s = off.createBufferSource(); s.buffer = b; s.connect(off.destination); s.start(); b = await off.startRendering(); }
    const enc = new lamejs.Mp3Encoder(2, rate, 192), I = d => Int16Array.from(d, x => Math.max(-32768, Math.min(32767, x * 32767))), L = I(b.getChannelData(0)), R = I(b.getChannelData(1)), parts = [];
    for (let i = 0; i < L.length; i += 1152) { const x = enc.encodeBuffer(L.subarray(i, i + 1152), R.subarray(i, i + 1152)); if (x.length) parts.push(new Uint8Array(x)); }
    const e = enc.flush(); if (e.length) parts.push(new Uint8Array(e)); return new Blob(parts, { type: "audio/mpeg" });
  }
  $("export").onclick = async () => { if (!OUTB) return; const f = $("fmt").value, blob = f === "mp3" ? await mp3(OUTB) : wav(OUTB), url = URL.createObjectURL(blob), a = document.createElement("a"); a.href = url; a.download = `${name}-tuned.${f}`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); $("status").textContent = `Saved ${a.download}.`; };
  window.__vt = { get P() { return P; }, get OUTB() { return OUTB; }, analyze, S, process, loadData };   // used by automated tests
})();
