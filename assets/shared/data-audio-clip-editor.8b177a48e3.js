
(() => {
  const $ = id => document.getElementById(id);
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  let AC = null; const ac = () => { if (!AC) { const C = window.AudioContext || window.webkitAudioContext; AC = new C(); } if (AC.state === "suspended") AC.resume(); return AC; };
  let buf = null, name = "clip", sel = [0, 0], undo = [], src = null, playStart = 0, playOff = 0, playEnd = 0, raf = 0;
  const status = t => $("status").textContent = t;
  const dur = () => buf ? buf.duration : 0;
  const fmtT = s => s.toFixed(2) + " s";
  const db = x => x > 0 ? (20 * Math.log10(x)).toFixed(1) : "−∞";
  function stats(b) { let pk = 0, ss = 0, n = 0; for (let c = 0; c < b.numberOfChannels; c++) { const d = b.getChannelData(c); for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > pk) pk = a; ss += d[i] * d[i]; } n += d.length; } return { pk, rms: Math.sqrt(ss / Math.max(1, n)) }; }
  function showInfo() { const s = stats(buf); $("info").textContent = `${name}: ${fmtT(dur())}, ${buf.sampleRate.toLocaleString("en-US")} Hz, ${buf.numberOfChannels === 1 ? "mono" : buf.numberOfChannels === 2 ? "stereo" : buf.numberOfChannels + " channels"}. Peak ${db(s.pk)} dBFS, RMS ${db(s.rms)} dBFS.`; }
  function newBuf(ch, len, rate) { return ac().createBuffer(ch, Math.max(1, len), rate || buf.sampleRate); }
  function setBuf(b, label) { if (buf) { undo.push({ buf, sel: sel.slice() }); if (undo.length > 15) undo.shift(); } buf = b; sel = [Math.min(sel[0], dur()), Math.min(sel[1], dur())]; $("undo").disabled = !undo.length; showInfo(); draw(); syncSel(); if (label) status(label); }
  function load(b, nm) { stop(); buf = b; name = nm; undo = []; sel = [0, 0]; $("undo").disabled = true; $("editor").hidden = false; $("exportBox").hidden = false; $("fname").value = nm.replace(/\.[^.]+$/, "") + "-edit"; showInfo(); requestAnimationFrame(() => { draw(); syncSel(); }); status(""); }
  async function openFile(f) {
    if (!f) return; $("info").textContent = `Opening ${f.name}…`;
    try { const data = await f.arrayBuffer(), rate = fileRate(new Uint8Array(data)) || ac().sampleRate;
      let b; try { b = await new OfflineAudioContext(1, 1, rate).decodeAudioData(data.slice(0)); } catch (e) { b = await new Promise((ok, no) => ac().decodeAudioData(data, ok, no)); }
      load(b, f.name); }
    catch (e) { $("info").textContent = `This browser couldn't read ${f.name}. Try WAV or MP3, or convert the file first.`; }
  }
  // Find the file's own sample rate (WAV, FLAC, MP3, AIFF) so decoding keeps it instead of using the device's rate.
  function fileRate(u) {
    const s4 = o => String.fromCharCode(u[o], u[o + 1], u[o + 2], u[o + 3]), le32 = o => u[o] | u[o + 1] << 8 | u[o + 2] << 16 | (u[o + 3] << 24 >>> 0);
    try {
      if (s4(0) === "RIFF" && s4(8) === "WAVE") { for (let o = 12; o < u.length - 8; ) { const id = s4(o), sz = le32(o + 4); if (id === "fmt ") return le32(o + 12); o += 8 + sz + (sz & 1); } }
      if (s4(0) === "fLaC") return (u[18] << 12) | (u[19] << 4) | (u[20] >> 4);
      if (s4(0) === "FORM" && (s4(8) === "AIFF" || s4(8) === "AIFC")) { for (let o = 12; o < u.length - 8; ) { const id = s4(o), sz = (u[o + 4] << 24 | u[o + 5] << 16 | u[o + 6] << 8 | u[o + 7]) >>> 0; if (id === "COMM") { const e = ((u[o + 16] & 127) << 8 | u[o + 17]) - 16383, m = (u[o + 18] << 24 | u[o + 19] << 16 | u[o + 20] << 8 | u[o + 21]) >>> 0; return Math.round(m * Math.pow(2, e - 31)); } o += 8 + sz + (sz & 1); } }
      let o = 0; if (s4(0).startsWith("ID3")) o = 10 + ((u[6] & 127) << 21 | (u[7] & 127) << 14 | (u[8] & 127) << 7 | (u[9] & 127));
      for (let i = o; i < Math.min(u.length - 4, o + 65536); i++) if (u[i] === 255 && (u[i + 1] & 0xE0) === 0xE0) { const ver = (u[i + 1] >> 3) & 3, layer = (u[i + 1] >> 1) & 3, ri = (u[i + 2] >> 2) & 3; if (layer === 0 || ri === 3 || ver === 1) continue; const base = [44100, 48000, 32000][ri]; return ver === 3 ? base : ver === 2 ? base / 2 : base / 4; }
    } catch (e) {}
    return 0;
  }
  $("file").onchange = e => openFile(e.target.files[0]);
  const drop = $("drop");
  ["dragenter", "dragover"].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove("over"); }));
  drop.addEventListener("drop", e => openFile(e.dataTransfer.files[0]));
  $("demo").onclick = () => { const r = 44100, L = r * 4, b = ac().createBuffer(2, L, r); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < L; i++) { const t = i / r, n = Math.floor(t * 2), f = [220, 277.18, 329.63, 440, 329.63, 277.18, 220, 165][n % 8], e = Math.exp(-3 * (t % .5)); d[i] = .5 * e * Math.sin(2 * Math.PI * f * t) * (c ? .9 : 1); } } load(b, "test-tone.wav"); };

  // ---------- waveform ----------
  const cv = $("wave");
  function draw(head) {
    if (!buf) return; const W = cv.clientWidth * devicePixelRatio, H = cv.clientHeight * devicePixelRatio; cv.width = W; cv.height = H;
    const g = cv.getContext("2d"), n = buf.length, chs = buf.numberOfChannels, lane = H / chs;
    g.clearRect(0, 0, W, H);
    if (sel[1] > sel[0]) { g.fillStyle = "rgba(231,90,62,.18)"; g.fillRect(sel[0] / dur() * W, 0, (sel[1] - sel[0]) / dur() * W, H); }
    g.fillStyle = css("--fi-ink") || "#222";
    for (let c = 0; c < chs; c++) { const d = buf.getChannelData(c), mid = lane * c + lane / 2;
      for (let x = 0; x < W; x++) { const a = Math.floor(x / W * n), b = Math.max(a + 1, Math.floor((x + 1) / W * n)); let lo = 1, hi = -1; for (let i = a; i < b; i += Math.max(1, Math.floor((b - a) / 200))) { const v = d[i]; if (v < lo) lo = v; if (v > hi) hi = v; } g.fillRect(x, mid - hi * lane / 2 * .95, 1, Math.max(1, (hi - lo) * lane / 2 * .95)); } }
    g.fillStyle = css("--fi-red-dk") || "#b33"; [sel[0], sel[1]].forEach(t => { if (sel[1] > sel[0]) g.fillRect(t / dur() * W - 1, 0, 2 * devicePixelRatio, H); });
    if (head != null) { g.fillStyle = "#1f6feb"; g.fillRect(head / dur() * W, 0, 2 * devicePixelRatio, H); }
    $("r1").textContent = fmtT(dur() / 2); $("r2").textContent = fmtT(dur());
  }
  addEventListener("resize", () => draw());
  let dragA = null;
  const tAt = e => { const r = cv.getBoundingClientRect(); return Math.max(0, Math.min(dur(), (e.clientX - r.left) / r.width * dur())); };
  cv.addEventListener("pointerdown", e => { if (!buf) return; cv.setPointerCapture(e.pointerId); dragA = tAt(e); sel = [dragA, dragA]; draw(); syncSel(); });
  cv.addEventListener("pointermove", e => { if (dragA == null) return; const t = tAt(e); sel = [Math.min(dragA, t), Math.max(dragA, t)]; draw(); syncSel(); });
  cv.addEventListener("pointerup", () => { dragA = null; });
  cv.addEventListener("keydown", e => {
    if (!buf) return; const step = dur() / 100 * (e.shiftKey ? 5 : 1);
    if (e.key === " ") { e.preventDefault(); src ? stop() : playRange(sel[1] > sel[0] ? sel[0] : 0, sel[1] > sel[0] ? sel[1] : dur()); return; }
    const k = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowDown: [0, -step], ArrowUp: [0, step] }[e.key]; if (!k) return; e.preventDefault();
    sel = [Math.max(0, Math.min(dur(), sel[0] + k[0])), Math.max(0, Math.min(dur(), sel[1] + k[1]))]; if (sel[1] < sel[0]) sel[1] = sel[0]; draw(); syncSel();
  });
  function syncSel() { $("selA").value = sel[0].toFixed(2); $("selB").value = sel[1].toFixed(2); $("selA").max = $("selB").max = dur().toFixed(2); }
  ["selA", "selB"].forEach(id => $(id).addEventListener("change", () => { let a = +$("selA").value || 0, b = +$("selB").value || 0; a = Math.max(0, Math.min(dur(), a)); b = Math.max(0, Math.min(dur(), b)); sel = [Math.min(a, b), Math.max(a, b)]; draw(); syncSel(); }));
  $("selAll").onclick = () => { sel = [0, dur()]; draw(); syncSel(); };
  $("selNone").onclick = () => { sel = [0, 0]; draw(); syncSel(); };

  // ---------- playback ----------
  function stop() { if (src) { try { src.stop(); } catch (e) {} src = null; } cancelAnimationFrame(raf); draw(); }
  function playRange(a, b, node) {
    stop(); if (!buf) return; ac(); src = AC.createBufferSource(); src.buffer = node ? node : buf; src.connect(AC.destination);
    playStart = AC.currentTime + .03; playOff = a; playEnd = b; src.start(playStart, a, Math.max(.01, b - a)); src.onended = () => { if (src && src.buffer === (node || buf)) { src = null; cancelAnimationFrame(raf); draw(); } };
    const tick = () => { if (!src) return; const t = playOff + (AC.currentTime - playStart); draw(Math.min(t, dur())); raf = requestAnimationFrame(tick); }; raf = requestAnimationFrame(tick);
  }
  $("play").onclick = () => playRange(0, dur());
  $("playSel").onclick = () => sel[1] > sel[0] ? playRange(sel[0], sel[1]) : status("Select a region first (drag on the waveform).");
  $("stop").onclick = stop;
  $("undo").onclick = () => { const u = undo.pop(); if (!u) return; stop(); buf = u.buf; sel = u.sel; $("undo").disabled = !undo.length; showInfo(); draw(); syncSel(); status("Undone."); };

  // ---------- edits ----------
  const S = t => Math.round(t * buf.sampleRate);
  const range = () => sel[1] > sel[0] ? [S(sel[0]), S(sel[1])] : [0, buf.length];
  function splice(a, b, keep) {   // keep: "in" keeps [a,b); "out" removes [a,b)
    const len = keep === "in" ? b - a : buf.length - (b - a), out = newBuf(buf.numberOfChannels, len);
    for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c), o = out.getChannelData(c); if (keep === "in") o.set(d.subarray(a, b)); else { o.set(d.subarray(0, a)); o.set(d.subarray(b), a); } }
    return out;
  }
  function copy() { const o = newBuf(buf.numberOfChannels, buf.length); for (let c = 0; c < buf.numberOfChannels; c++) o.getChannelData(c).set(buf.getChannelData(c)); return o; }
  function irBuf(ctx, decay, pre, chs) {
    const r = ctx.sampleRate, p = Math.floor(pre / 1000 * r), L = Math.floor(decay * r) + p, ir = ctx.createBuffer(2, L, r);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = p; i < L; i++) { const t = (i - p) / r; d[i] = (Math.random() * 2 - 1) * Math.pow(10, -3 * t / decay); } }
    return ir;
  }
  async function reverbRender(input, whole) {
    const decay = +$("rvSize").value, mix = +$("rvMix").value / 100, pre = +$("rvPre").value, tone = +$("rvTone").value, chs = Math.max(2, input.numberOfChannels);
    const tail = whole ? Math.ceil((decay + pre / 1000) * input.sampleRate) : 0;
    const off = new OfflineAudioContext(chs, input.length + tail, input.sampleRate), s = off.createBufferSource(); s.buffer = input;
    const dry = off.createGain(), wet = off.createGain(), cv2 = off.createConvolver(), lp = off.createBiquadFilter();
    dry.gain.value = Math.cos(mix * Math.PI / 2); wet.gain.value = Math.sin(mix * Math.PI / 2) * .6; lp.type = "lowpass"; lp.frequency.value = tone;
    cv2.normalize = true; cv2.buffer = irBuf(off, decay, pre, chs);
    s.connect(dry); dry.connect(off.destination); s.connect(cv2); cv2.connect(lp); lp.connect(wet); wet.connect(off.destination); s.start();
    return off.startRendering();
  }
  async function resample(input, rate, chs) {
    const off = new OfflineAudioContext(chs, Math.ceil(input.duration * rate), rate), s = off.createBufferSource(); s.buffer = input;
    s.connect(off.destination);   // a mono destination mixes stereo down to (L + R) / 2
    s.start(); return off.startRendering();
  }
  document.addEventListener("click", async e => {
    const b = e.target.closest("[data-op]"); if (!b || !buf) return; stop(); const op = b.dataset.op, has = (sel[1] - sel[0]) * buf.sampleRate >= 1, [a, z] = range();
    if (["crop", "cutFront", "cutEnd", "del", "silence"].includes(op) && !has) { status("Select a region first: drag across the waveform."); return; }
    if (op === "crop") { setBuf(splice(a, z, "in"), `Kept ${fmtT(sel[1] - sel[0])}; trimmed the front and end.`); sel = [0, dur()]; draw(); syncSel(); }
    if (op === "cutFront") { setBuf(splice(0, a, "out"), `Trimmed ${fmtT(a / buf.sampleRate)} from the front.`); const L = sel[1] - sel[0]; sel = [0, L]; draw(); syncSel(); }
    if (op === "cutEnd") { const removed = (buf.length - z) / buf.sampleRate; setBuf(splice(z, buf.length, "out"), `Trimmed ${fmtT(removed)} from the end.`); }
    if (op === "del") { const L = (z - a) / buf.sampleRate; setBuf(splice(a, z, "out"), `Deleted ${fmtT(L)} from the middle.`); sel = [sel[0], sel[0]]; draw(); syncSel(); }
    if (op === "silence") { const o = copy(); for (let c = 0; c < o.numberOfChannels; c++) o.getChannelData(c).fill(0, a, z); setBuf(o, "Selection silenced."); }
    if (op === "gain" || op === "norm") {
      let g; if (op === "gain") g = Math.pow(10, (+$("gainDb").value || 0) / 20);
      else { let pk = 0; for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = a; i < z; i++) pk = Math.max(pk, Math.abs(d[i])); } if (!pk) { status("That part is silent."); return; } g = Math.pow(10, Math.min(0, +$("normDb").value || -1) / 20) / pk; }
      const o = copy(); let clip = 0; for (let c = 0; c < o.numberOfChannels; c++) { const d = o.getChannelData(c); for (let i = a; i < z; i++) { let v = d[i] * g; if (v > 1) { v = 1; clip++; } else if (v < -1) { v = -1; clip++; } d[i] = v; } }
      setBuf(o, (op === "norm" ? `Normalized ${has ? "the selection" : "the clip"} to ${$("normDb").value} dBFS (gain ${db(g)} dB).` : `Applied ${$("gainDb").value} dB of gain.`) + (clip ? ` Warning: ${clip} samples clipped.` : ""));
    }
    if (op === "fadeIn" || op === "fadeOut") { const o = copy(); let A = a, Z = z; if (!has) { const n = Math.floor(buf.length * .1); [A, Z] = op === "fadeIn" ? [0, n] : [buf.length - n, buf.length]; }
      for (let c = 0; c < o.numberOfChannels; c++) { const d = o.getChannelData(c); for (let i = A; i < Z; i++) { const x = (i - A) / Math.max(1, Z - A); d[i] *= op === "fadeIn" ? x * x : (1 - x) * (1 - x); } }
      setBuf(o, op === "fadeIn" ? "Faded in." : "Faded out."); }
    if (op === "reverse") { const o = copy(); for (let c = 0; c < o.numberOfChannels; c++) o.getChannelData(c).subarray(a, z).reverse(); setBuf(o, `Reversed ${has ? "the selection" : "the clip"}.`); }
    if (op === "reverb") { status("Adding reverb…");
      if (!has) { setBuf(await reverbRender(buf, true), "Reverb added to the whole clip (with its tail)."); }
      else { const part = splice(a, z, "in"), wetBuf = await reverbRender(part, false), chs = Math.max(buf.numberOfChannels, wetBuf.numberOfChannels), o = newBuf(chs, buf.length);
        for (let c = 0; c < chs; c++) { const d = buf.getChannelData(Math.min(c, buf.numberOfChannels - 1)), od = o.getChannelData(c); od.set(d); od.set(wetBuf.getChannelData(c).subarray(0, z - a), a); }
        setBuf(o, "Reverb added to the selection."); } }
    if (op === "convert") { const r = +$("rate").value || buf.sampleRate, ch = +$("chans").value || buf.numberOfChannels; if (r === buf.sampleRate && ch === buf.numberOfChannels) { status("Nothing to change: choose a new sample rate or channel setting."); return; }
      status("Converting…"); setBuf(await resample(buf, r, ch), `Converted to ${r.toLocaleString("en-US")} Hz, ${ch === 1 ? "mono" : "stereo"}.`); }
  });
  ["rvSize", "rvMix", "rvPre"].forEach(id => $(id).addEventListener("input", () => { const v = +$(id).value; $(id + "O").textContent = id === "rvSize" ? v.toFixed(1) + " s" : id === "rvMix" ? v + "%" : v + " ms"; }));
  $("rvPreview").onclick = async () => { if (!buf) return; const has = sel[1] > sel[0], [a, z] = range(), part = has ? splice(a, z, "in") : buf; status("Rendering preview…"); const r = await reverbRender(part, true); status("Preview (not applied yet)."); playRange(0, r.duration, r); };

  // ---------- export ----------
  function wav(b, bits) {
    const ch = b.numberOfChannels, n = b.length, bps = bits / 8, data = n * ch * bps, ab = new ArrayBuffer(44 + data), v = new DataView(ab), fl = bits === 32;
    const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, "RIFF"); v.setUint32(4, 36 + data, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, fl ? 3 : 1, true); v.setUint16(22, ch, true); v.setUint32(24, b.sampleRate, true); v.setUint32(28, b.sampleRate * ch * bps, true); v.setUint16(32, ch * bps, true); v.setUint16(34, bits, true); w(36, "data"); v.setUint32(40, data, true);
    const chans = Array.from({ length: ch }, (_, c) => b.getChannelData(c)); let o = 44;
    for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { let s = Math.max(-1, Math.min(1, chans[c][i]));
      if (fl) { v.setFloat32(o, s, true); o += 4; }
      else if (bits === 16) { v.setInt16(o, s < 0 ? s * 32768 : s * 32767, true); o += 2; }
      else { const x = Math.round(s < 0 ? s * 8388608 : s * 8388607); v.setUint8(o, x & 255); v.setUint8(o + 1, (x >> 8) & 255); v.setUint8(o + 2, (x >> 16) & 255); o += 3; } }
    return new Blob([ab], { type: "audio/wav" });
  }
  let lameP = null; const lame = () => lameP || (lameP = new Promise((ok, no) => { if (window.lamejs) return ok(); const s = document.createElement("script"); s.src = "assets/lame.min.js?v=5a6238f8"; s.onload = ok; s.onerror = no; document.head.appendChild(s); }));
  async function mp3(b, kbps) {
    await lame(); if ([32000, 44100, 48000].indexOf(b.sampleRate) < 0) b = await resample(b, 44100, b.numberOfChannels);
    const ch = Math.min(2, b.numberOfChannels), enc = new lamejs.Mp3Encoder(ch, b.sampleRate, kbps), toI = d => { const o = new Int16Array(d.length); for (let i = 0; i < d.length; i++) { const s = Math.max(-1, Math.min(1, d[i])); o[i] = s < 0 ? s * 32768 : s * 32767; } return o; };
    const L = toI(b.getChannelData(0)), R = ch > 1 ? toI(b.getChannelData(1)) : null, parts = [];
    for (let i = 0; i < L.length; i += 1152) { const x = ch > 1 ? enc.encodeBuffer(L.subarray(i, i + 1152), R.subarray(i, i + 1152)) : enc.encodeBuffer(L.subarray(i, i + 1152)); if (x.length) parts.push(new Uint8Array(x)); }
    const end = enc.flush(); if (end.length) parts.push(new Uint8Array(end));
    return new Blob(parts, { type: "audio/mpeg" });
  }
  $("export").onclick = async () => {
    if (!buf) return; const f = $("fmt").value; status("Exporting…");
    try {
      const blob = f.startsWith("wav") ? wav(buf, +f.slice(3)) : await mp3(buf, +f.split("-")[1]), ext = f.startsWith("wav") ? "wav" : "mp3";
      const fn = ($("fname").value.trim() || "clip").replace(/[\\/:*?"<>|]+/g, "-") + "." + ext, url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = fn; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
      status(`Saved ${fn} (${(blob.size / 1048576).toFixed(2)} MB).`);
      window.__lastExport = { size: blob.size, type: blob.type, name: fn };
    } catch (e) { status("Export failed: " + e.message); }
  };
  window.__ace = { get buf() { return buf; }, set sel(v) { sel = v; draw(); syncSel(); }, load };   // used by automated tests
})();
