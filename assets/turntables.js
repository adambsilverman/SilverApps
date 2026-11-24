/* Two turntables (SilverApps): beatmatching, nudging and scratching, shared by the Introduction to Pitch lesson and the Multitrack Studio.
   Copied to assets/turntables.js by build/build_trainers.py.
   SATT.mount(host, opts) draws the decks into host and returns { refresh(), destroy() }. opts:
     ctx()        → the page's AudioContext (created on first use)
     out()        → the node to play into (default: ctx().destination)
     sources()    → async list of records: [{ id, name, buf (AudioBuffer), bpm }]; the built-in groove is always offered first
     record       → true: show "Record to a new audio track"; onRecorded(AudioBuffer) gets the take
     onRecStart() → called as recording starts (the studio starts its own playback here)
   Each deck reads its record at its own position and speed in one audio callback, so a deck can run at any speed, stop, or go backward (scratching). */
window.SATT = (() => {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const BPM0 = 100, LEN0 = 8 * 60 / BPM0;   // the built-in record: two bars of 4/4 at 100 bpm
  // the built-in record: an original groove (drums, bass and a short synth riff in A minor), rendered once per sample rate
  const made = {};
  async function groove(sr) {
    if (made[sr]) return made[sr];
    const O = new OfflineAudioContext(1, Math.ceil(LEN0 * sr), sr), beat = 60 / BPM0, out = O.createGain(); out.gain.value = .8; out.connect(O.destination);
    const nz = O.createBuffer(1, sr * .4, sr), d = nz.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const kick = t => { const o = O.createOscillator(), g = O.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + .14); g.gain.setValueAtTime(1, t); g.gain.exponentialRampToValueAtTime(.001, t + .35); o.connect(g); g.connect(out); o.start(t); o.stop(t + .4); };
    const noise = (t, f, len, v) => { const n = O.createBufferSource(), fl = O.createBiquadFilter(), g = O.createGain(); n.buffer = nz; fl.type = "highpass"; fl.frequency.value = f; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + len); n.connect(fl); fl.connect(g); g.connect(out); n.start(t); n.stop(t + len + .02); };
    const note = (m, t, len, type, v, cut) => { const o = O.createOscillator(), g = O.createGain(), f = O.createBiquadFilter(); o.type = type; o.frequency.value = 440 * Math.pow(2, (m - 69) / 12); f.type = "lowpass"; f.frequency.value = cut;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .01); g.gain.setTargetAtTime(v * .6, t + .02, .08); g.gain.setTargetAtTime(0, t + len, .03); o.connect(f); f.connect(g); g.connect(out); o.start(t); o.stop(t + len + .2); };
    for (let b = 0; b < 8; b++) { const t = b * beat; if (b % 2 === 0) kick(t); else noise(t, 1800, .18, .55); noise(t, 7000, .04, .18); noise(t + beat / 2, 7000, .04, .12); }
    kick(5.5 * beat);
    [[45, 0, .45], [45, .75, .2], [57, 1, .4], [52, 1.5, .4], [48, 2, .45], [48, 2.75, .2], [55, 3, .4], [50, 3.5, .4], [41, 4, .45], [41, 4.75, .2], [53, 5, .4], [48, 5.5, .4], [43, 6, .45], [43, 6.75, .2], [55, 7, .3], [56, 7.5, .3]]
      .forEach(([m, b, l]) => note(m, b * beat, l * beat * 2, "sawtooth", .28, 700));
    [[69, .5], [72, 1.5], [76, 2.5], [74, 3.5], [72, 4.5], [69, 5.5], [71, 6.5], [68, 7.5]].forEach(([m, b]) => note(m, b * beat, beat * .45, "square", .09, 2400));
    return (made[sr] = await O.startRendering());
  }
  const mono = b => { if (b.numberOfChannels < 2) return b.getChannelData(0); const L = b.getChannelData(0), R = b.getChannelData(1), m = new Float32Array(L.length); for (let i = 0; i < L.length; i++) m[i] = (L[i] + R[i]) / 2; return m; };
  const fmtF = v => (v > 0 ? "+" : v < 0 ? "−" : "±") + Math.abs(v).toFixed(1) + "%";

  // styles, injected once; colors come from the page's own tokens where it has them (--satt-* overrides, then the site's --fi-* tokens)
  const CSS = `.satt{--c-card:var(--satt-card,var(--fi-card,#fffdf9));--c-ink:var(--satt-ink,var(--fi-ink,#231d19));--c-line:var(--satt-line,var(--fi-line,#cfc6bb));--c-acc:var(--satt-accent,var(--fi-red,#d94a32));--c-ok:var(--satt-ok,#1d6b2f);--c-muted:var(--satt-muted,#5f5650)}
.satt-decks{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;margin:10px 0}
.satt-deck{border:1.5px solid var(--c-line);border-radius:14px;background:var(--c-card);color:var(--c-ink);padding:10px 14px;min-width:0}
.satt-name{font:700 20px/1 var(--fi-display,system-ui);margin:0 0 8px;text-transform:uppercase}
.satt-l{display:block;font:700 12px var(--fi-ui,system-ui);text-transform:uppercase;letter-spacing:.05em;margin:0 0 3px}
.satt-src{width:100%;font:15px var(--fi-serif,system-ui);padding:6px 8px;border:1.5px solid var(--c-line);border-radius:8px;background:var(--c-card);color:var(--c-ink);margin-bottom:8px}
.satt-plat-wrap{position:relative;width:min(170px,58vw);aspect-ratio:1;max-width:100%;margin:6px auto 10px}
.satt-plat{width:100%;height:100%;border-radius:50%;background:repeating-radial-gradient(circle,#1c1917 0 2px,#2a2522 2px 4px);box-shadow:0 0 0 6px #8d8379,0 3px 10px rgba(0,0,0,.35);position:relative;touch-action:none;cursor:grab}
.satt-plat.held{cursor:grabbing;box-shadow:0 0 0 6px var(--c-acc),0 3px 10px rgba(0,0,0,.35)}
.satt-label{position:absolute;inset:34%;border-radius:50%;background:var(--c-acc);color:#1a0d08;display:flex;align-items:center;justify-content:center;font:700 20px var(--fi-display,system-ui);pointer-events:none}
.satt-mark{position:absolute;left:50%;top:6%;width:3px;height:26%;margin-left:-1.5px;background:#f3ece2;border-radius:2px;pointer-events:none}
.satt-beat{position:absolute;right:-6px;top:-6px;width:20px;height:20px;border-radius:50%;background:#d8d0c6;border:2px solid #8d8379}
.satt-beat.on{background:#f2b705}
.satt-fl{display:flex;justify-content:space-between;font:700 13px var(--fi-ui,system-ui)}
.satt .satt-f{width:100%!important;max-width:none!important;accent-color:var(--c-acc)}
.satt-btns{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}
.satt-btn{font:700 14px var(--fi-ui,system-ui);text-transform:uppercase;letter-spacing:.04em;padding:8px 14px;min-height:42px;border-radius:999px;border:1.5px solid var(--c-line);background:var(--c-card);color:var(--c-ink);cursor:pointer;touch-action:manipulation;-webkit-user-select:none;user-select:none}
.satt-btn.primary{background:var(--c-acc);border-color:var(--c-acc);color:#1a0d08}
.satt-btn[aria-pressed="true"]{background:var(--c-ink);color:var(--c-card);border-color:var(--c-ink)}
.satt-rec[aria-pressed="true"]{background:#b3121f;border-color:#b3121f;color:#fff}
.satt-btn:focus-visible,.satt-f:focus-visible,.satt-src:focus-visible{outline:3px solid var(--c-acc);outline-offset:2px}
.satt-stat{margin:4px 0;font:15px/1.45 var(--fi-serif,system-ui);color:var(--c-ink)}
.satt-live{font:700 16px var(--fi-serif,system-ui);min-height:1.4em;color:var(--c-ok);margin:0}`;
  const style = () => { if (document.getElementById("sattCss")) return; const s = document.createElement("style"); s.id = "sattCss"; s.textContent = CSS; document.head.appendChild(s); };
  function mount(host, opts) {
    style();
    const T = { src: [null, null], list: [], fader: [0, 0], nudge: [0, 0], grab: [null, null], scr: [0, 0], cur: [0, 0], pos: [0, 0], seek: null, on: false, sp: null, raf: 0, wide: false, said: "", rec: null, id: "satt" + Math.random().toString(36).slice(2, 7) };
    const AC = () => opts.ctx(), $ = s => host.querySelector(s);
    const rate = i => (1 + T.fader[i] / 100) * (1 + T.nudge[i]);
    const ready = () => T.src[0] && T.src[1];
    async function loadList() {
      const C = AC(); if (!C) return; const base = { id: "groove", name: "Built-in groove (100 bpm)", buf: await groove(C.sampleRate), bpm: BPM0 };
      let more = []; try { more = (opts.sources ? await opts.sources() : []) || []; } catch (e) {}
      T.list = [base].concat(more.filter(s => s && s.buf));
      for (let i = 0; i < 2; i++) if (!T.src[i] || !T.list.some(s => s.id === T.src[i].s.id)) T.src[i] = { s: T.list[0], data: mono(T.list[0].buf), sr: T.list[0].buf.sampleRate };
      host.querySelectorAll(".satt-src").forEach((sel, i) => { sel.innerHTML = T.list.map(s => `<option value="${esc(s.id)}"${T.src[i].s.id === s.id ? " selected" : ""}>${esc(s.name)}</option>`).join(""); });
    }
    function setSrc(i, id) { const s = T.list.find(x => x.id === id); if (!s) return; T.src[i] = { s, data: mono(s.buf), sr: s.buf.sampleRate }; T.seek = T.seek || T.pos.slice(); T.seek[i] = 0; status(); }
    function engine() {   // one callback plays both decks: each reads its record at its own position and speed, easing toward the target like a platter
      const C = AC(); if (T.sp || !C || !C.createScriptProcessor) return !!T.sp;
      const sp = C.createScriptProcessor(1024, 0, 2), pos = [0, 0];
      sp.onaudioprocess = ev => {
        const L = ev.outputBuffer.getChannelData(0), R = ev.outputBuffer.getChannelData(1); if (!ready()) { L.fill(0); R.fill(0); return; }
        if (T.seek) { T.seek.forEach((x, i) => { const N = T.src[i].data.length; pos[i] = ((x * T.src[i].sr) % N + N) % N; }); T.seek = null; }
        const tgt = [0, 1].map(i => T.grab[i] ? T.scr[i] : T.on ? rate(i) : 0), k = [0, 1].map(i => T.grab[i] ? .006 : .00012), step = [0, 1].map(i => T.src[i].sr / C.sampleRate);
        for (let n = 0; n < L.length; n++) { let l = 0, r = 0;
          for (let i = 0; i < 2; i++) { const d = T.src[i].data, N = d.length; T.cur[i] += (tgt[i] - T.cur[i]) * k[i]; let p = (pos[i] + T.cur[i] * step[i]) % N; if (p < 0) p += N; pos[i] = p;
            const a = Math.floor(p), f = p - a, v = (d[a] + (d[(a + 1) % N] - d[a]) * f) * .55; if (i) { l += v * .7; r += v; } else { l += v; r += v * .7; } }
          L[n] = l; R[n] = r; }
        T.pos = [0, 1].map(i => pos[i] / T.src[i].sr);
        if (T.rec) { T.rec.L.push(L.slice()); T.rec.R.push(R.slice()); }
      };
      sp.connect(opts.out ? opts.out() : C.destination); T.sp = sp; return true;
    }
    function tick() {
      if (!host.isConnected) { destroy(); return; }   // the page re-rendered without the decks: stop playing
      for (let i = 0; i < 2; i++) { if (T.grab[i] && performance.now() - T.grab[i].t > 60) T.scr[i] *= .5;   // holding a platter still stops its sound
        const p = $(`#${T.id}p${i}`), l = $(`#${T.id}b${i}`), s = T.src[i] && T.src[i].s, beat = 60 / ((s && s.bpm) || BPM0);
        if (p && !T.grab[i]) p.style.transform = `rotate(${(T.pos[i] / 1.8) * 360 % 360}deg)`;   // 33⅓ rpm: one turn every 1.8 s at normal speed
        if (l) l.classList.toggle("on", Math.abs(T.cur[i]) > .2 && ((T.pos[i] % beat) + beat) % beat / beat < .18); }
      status(); T.raf = requestAnimationFrame(tick);
    }
    function status() {
      const el = $(".satt-stat"), live = $(".satt-live"); if (!el || !ready()) return;
      const sa = T.src[0].s, sb = T.src[1].s, same = sa.id === sb.id, bA = sa.bpm ? sa.bpm * rate(0) : 0, bB = sb.bpm ? sb.bpm * rate(1) : 0;
      const r = same ? rate(1) / rate(0) : bA && bB ? bB / bA : 1, pct = (r - 1) * 100, c = Math.round(1200 * Math.log2(r));
      let ph = null; if (bA && bB) { const fa = T.pos[0] * sa.bpm / 60, fb = T.pos[1] * sb.bpm / 60; ph = ((fb - fa) % 1 + 1) % 1; if (ph > .5) ph -= 1; }
      const tempo = `Deck A: <b>${bA ? bA.toFixed(1) + " bpm" : fmtF(T.fader[0])}</b> · Deck B: <b>${bB ? bB.toFixed(1) + " bpm" : fmtF(T.fader[1])}</b>.`;
      const diff = Math.abs(pct) < .005 ? " Same tempo." : ` B is ${Math.abs(pct).toFixed(2)}% ${pct > 0 ? "faster" : "slower"}` + (same ? `, so it sounds <b>${Math.abs(c)} cents ${c > 0 ? "sharp" : "flat"}</b>${Math.abs(c) >= 90 ? ` (about ${Math.round(Math.abs(c) / 100)} semitone${Math.round(Math.abs(c) / 100) > 1 ? "s" : ""})` : ""}.` : ".");
      const sync = Math.abs(pct) < .15, inPh = ph != null && Math.abs(ph) < .06;
      el.innerHTML = tempo + (same || (bA && bB) ? diff : "") + (T.on && ph != null ? ` The beats are ${inPh ? "lined up" : `${Math.round(Math.abs(ph) * 100)}% of a beat apart (B is ${ph > 0 ? "ahead" : "behind"})`}.` : "");
      const v = !T.on ? "" : sync && inPh ? "Synchronized: same tempo, beats together." + (same ? " Same pitch, too." : "") : sync ? "Same tempo. Now nudge B to line up the beats." : Math.abs(pct) < 1 ? "Very close: listen for the slow drift between the two records." : "";
      if (live && v !== T.said) { live.textContent = v; T.said = v; }
      const pb = $(".satt-play"); if (pb) pb.innerHTML = `<span aria-hidden="true">${T.on ? "■" : "▶"} </span>${T.on ? "Stop both" : "Play both"}`;
    }
    async function start() { if (!AC()) return; await loadList(); engine(); T.on = true; if (!T.raf) tick(); status(); }
    function challenge() { const s = (Math.random() < .5 ? -1 : 1) * (2.5 + Math.random() * 4.5); T.fader = [0, Math.round(s * 10) / 10]; T.pos = [0, Math.random() * .6]; T.seek = T.pos.slice();
      for (let i = 0; i < 2; i++) { const f = $(`#${T.id}f${i}`); if (f) f.value = T.fader[i]; const v = $(`#${T.id}v${i}`); if (v) v.textContent = fmtF(T.fader[i]); } status(); }
    // recording: whatever the decks play (and nothing else) goes into a new audio track
    function recToggle() {
      const b = $(".satt-rec"), C = AC(); if (!C) return;
      if (!T.rec) { if (!T.on) start(); engine(); T.rec = { L: [], R: [] }; if (opts.onRecStart) try { opts.onRecStart(); } catch (e) {}
        b.innerHTML = '<span aria-hidden="true">■ </span>Stop recording'; b.setAttribute("aria-pressed", "true"); const l = $(".satt-live"); if (l) { l.textContent = "Recording the turntables…"; T.said = l.textContent; } return; }
      const R = T.rec; T.rec = null; b.innerHTML = '<span aria-hidden="true">● </span>Record to a new audio track'; b.setAttribute("aria-pressed", "false");
      const n = R.L.reduce((s, x) => s + x.length, 0); if (n < C.sampleRate * .2) return;
      const buf = C.createBuffer(2, n, C.sampleRate); let o = 0; R.L.forEach((x, i) => { buf.getChannelData(0).set(x, o); buf.getChannelData(1).set(R.R[i], o); o += x.length; });
      if (opts.onRecorded) opts.onRecorded(buf);
    }
    const deck = i => `<div class="satt-deck"><p class="satt-name">Deck ${"AB"[i]}</p>
      <label class="satt-l" for="${T.id}s${i}">Record</label><select class="satt-src" id="${T.id}s${i}" data-i="${i}"><option>Built-in groove (100 bpm)</option></select>
      <div class="satt-plat-wrap" aria-hidden="true"><div class="satt-plat" id="${T.id}p${i}" data-i="${i}"><span class="satt-label">${"AB"[i]}</span><span class="satt-mark"></span></div><span class="satt-beat" id="${T.id}b${i}"></span></div>
      <label class="satt-fl" for="${T.id}f${i}">Pitch (speed) <output id="${T.id}v${i}" for="${T.id}f${i}">${fmtF(T.fader[i])}</output></label>
      <input type="range" class="satt-f" id="${T.id}f${i}" data-i="${i}" min="-8" max="8" step="0.1" value="${T.fader[i]}">
      <div class="satt-btns"><button type="button" class="satt-btn" data-n="${i},-1">◀ Hold to slow</button><button type="button" class="satt-btn" data-n="${i},1">Hold to push ▶</button></div></div>`;
    host.innerHTML = `<div class="satt"><div class="satt-decks">${deck(0)}${deck(1)}</div>
      <div class="satt-btns"><button type="button" class="satt-btn primary satt-play" data-a="play"><span aria-hidden="true">▶ </span>Play both</button><button type="button" class="satt-btn" data-a="new">New challenge</button><button type="button" class="satt-btn" data-a="wide" aria-pressed="false">Wide range (±16%)</button><button type="button" class="satt-btn" data-a="45">B at 45 rpm (+35%)</button>${opts.record ? '<button type="button" class="satt-btn satt-rec" data-a="rec" aria-pressed="false"><span aria-hidden="true">● </span>Record to a new audio track</button>' : ""}</div>
      <p class="satt-stat"></p><p class="satt-live" role="status" aria-live="polite"></p></div>`;
    challenge();
    // ---- events (scoped to this host) ----
    const ang = (el, e) => { const r = el.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI; };
    const onClick = e => { const b = e.target.closest("[data-a]"); if (!b) return; const a = b.dataset.a;
      if (a === "play") { if (T.on) { T.on = false; status(); } else start(); }
      else if (a === "new") challenge();
      else if (a === "wide") { T.wide = !T.wide; b.setAttribute("aria-pressed", T.wide); host.querySelectorAll(".satt-f").forEach(f => { f.min = T.wide ? -16 : -8; f.max = T.wide ? 16 : 8; }); }
      else if (a === "45") { T.fader = [0, 35]; host.querySelectorAll(".satt-f").forEach((f, i) => { f.min = -16; f.max = 35; f.value = T.fader[i]; const v = $(`#${T.id}v${i}`); if (v) v.textContent = fmtF(T.fader[i]); }); if (!T.on) start(); else status(); }
      else if (a === "rec") recToggle(); };
    const nudge = (b, on) => { const [i, d] = b.dataset.n.split(",").map(Number); T.nudge[i] = on ? d * .04 : 0; };
    const onDown = async e => {
      const nb = e.target.closest("[data-n]"); if (nb) { e.preventDefault(); nudge(nb, true); return; }
      const el = e.target.closest(".satt-plat"); if (!el) return; e.preventDefault(); const i = +el.dataset.i;
      if (!AC()) return; if (!T.list.length) await loadList(); engine(); if (!T.raf) tick();
      try { el.setPointerCapture(e.pointerId); } catch (x) {} T.grab[i] = { a: ang(el, e), t: performance.now(), rot: (T.pos[i] / 1.8) * 360 }; T.scr[i] = 0; el.classList.add("held"); };
    const onMove = e => { const el = e.target.closest && e.target.closest(".satt-plat"); if (!el) return; const i = +el.dataset.i, g = T.grab[i]; if (!g) return;
      const a = ang(el, e), now = performance.now(); let da = a - g.a; if (da > 180) da -= 360; if (da < -180) da += 360; const dt = Math.max(.008, (now - g.t) / 1000);
      T.scr[i] = Math.max(-6, Math.min(6, (da / 360 * 1.8) / dt)); g.a = a; g.t = now; g.rot += da; el.style.transform = `rotate(${g.rot % 360}deg)`; };
    const onUp = () => { T.nudge = [0, 0]; for (let i = 0; i < 2; i++) if (T.grab[i]) { T.grab[i] = null; T.scr[i] = 0; const p = $(`#${T.id}p${i}`); if (p) p.classList.remove("held"); } };
    const onKey = (e, on) => { const b = e.target.closest && e.target.closest("[data-n]"); if (b && (e.key === " " || e.key === "Enter")) { e.preventDefault(); if (!e.repeat) nudge(b, on); } };
    const kd = e => onKey(e, true), ku = e => onKey(e, false);
    const onInput = e => { const f = e.target.closest(".satt-f"); if (!f) return; const i = +f.dataset.i; T.fader[i] = +f.value; const v = $(`#${T.id}v${i}`); if (v) v.textContent = fmtF(T.fader[i]); status(); };
    const onChange = e => { const s = e.target.closest(".satt-src"); if (s) setSrc(+s.dataset.i, s.value); };
    host.addEventListener("click", onClick); host.addEventListener("pointerdown", onDown); host.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp); window.addEventListener("pointercancel", onUp);
    host.addEventListener("keydown", kd); host.addEventListener("keyup", ku); host.addEventListener("input", onInput); host.addEventListener("change", onChange);
    setTimeout(() => { status(); const el = $(".satt-stat"); if (el && !ready()) el.innerHTML = "Deck A and deck B both hold the built-in groove at 100 bpm, but B's speed is off. Press <b>Play both</b>."; }, 0);
    function destroy() { T.on = false; T.rec = null; cancelAnimationFrame(T.raf); T.raf = 0; if (T.sp) { T.sp.disconnect(); T.sp.onaudioprocess = null; T.sp = null; }
      window.removeEventListener("pointerup", onUp); window.removeEventListener("pointercancel", onUp); if (host.isConnected) host.innerHTML = ""; }
    if (AC && opts.ctx && opts.eager !== false) loadList().then(status).catch(() => {});
    return {
      refresh: () => loadList().then(status),
      setSource: (i, id) => loadList().then(() => { setSrc(i, id); const s = $(`#${T.id}s${i}`); if (s) s.value = id; }),
      stop: () => { T.on = false; status(); },
      destroy,
    };
  }
  // records sent from the Groove Maker (IndexedDB "silverapps-studio", key "turntable": { ch: [L, R], sr, bpm, name })
  function fromGrooveMaker(ctx) {
    return new Promise(ok => { try { const r = indexedDB.open("silverapps-studio", 1); r.onupgradeneeded = () => r.result.createObjectStore("x"); r.onerror = () => ok(null);
      r.onsuccess = () => { try { const q = r.result.transaction("x", "readonly").objectStore("x").get("turntable"); q.onsuccess = () => { const x = q.result; if (!x || !ctx) return ok(null);
        const b = ctx.createBuffer(2, x.ch[0].length, x.sr); b.getChannelData(0).set(x.ch[0]); b.getChannelData(1).set(x.ch[1]); ok({ id: "gm", name: x.name || "From the Groove Maker", buf: b, bpm: x.bpm }); }; q.onerror = () => ok(null); } catch (e) { ok(null); } };
    } catch (e) { ok(null); } });
  }
  return { mount, groove, fromGrooveMaker };
})();
