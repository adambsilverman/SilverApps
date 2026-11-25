/* Two turntables (SilverApps): beatmatching, nudging and scratching, shared by the Introduction to Pitch lesson and the Multitrack Studio.
   Copied to assets/turntables.js by build/build_trainers.py.
   SATT.mount(host, opts) draws the decks into host and returns { refresh(), destroy() }. opts:
     ctx()        → the page's AudioContext (created on first use)
     out()        → the node to play into (default: ctx().destination)
     sources()    → async list of records: [{ id, name, buf (AudioBuffer), bpm }]; the built-in groove is always offered first
     record       → true: show "Record to a new audio track"; onRecorded(AudioBuffer) gets the take
     onRecStart() → called as recording starts (the studio starts its own playback here)
   Each deck reads its record at its own position and speed in one audio callback, so a deck can run at any speed, stop, or go backward (scratching).
   Decks: start/stop each (the motor eases up to speed and spins down), cue point, reverse, 33⅓/45 rpm, pitch fader with ±8/16/50% range, sync, nudge.
   Mixer: per deck 3-band EQ (bottom of travel = kill), low-/high-pass filter sweep, mute, channel fader with level meter; crossfader (smooth or scratch curve); master.
   Recording takes the mixer's output. */
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
  const CSS = `.satt{container-type:inline-size;--c-card:var(--satt-card,var(--fi-card,#fffdf9));--c-ink:var(--satt-ink,var(--fi-ink,#231d19));--c-line:var(--satt-line,var(--fi-line,#cfc6bb));--c-acc:var(--satt-accent,var(--fi-red,#d94a32));--c-ok:var(--satt-ok,#1d6b2f);--c-muted:var(--satt-muted,#5f5650)}
.satt-rig{display:grid;grid-template-columns:1fr;grid-template-areas:"a" "b" "m";gap:12px;margin:10px 0}
@container (min-width:540px){.satt-rig{grid-template-columns:1fr 1fr;grid-template-areas:"a b" "m m"}}
@container (min-width:900px){.satt-rig{grid-template-columns:1fr minmax(260px,.95fr) 1fr;grid-template-areas:"a m b"}}
.satt-deck,.satt-mixer{border:1.5px solid var(--c-line);border-radius:14px;background:var(--c-card);color:var(--c-ink);padding:10px 14px;min-width:0}
.satt-deck[data-i="0"]{grid-area:a}.satt-deck[data-i="1"]{grid-area:b}.satt-mixer{grid-area:m}
.satt-name{font:700 20px/1 var(--fi-display,system-ui);margin:0 0 8px;text-transform:uppercase}
.satt-l{display:block;font:700 12px var(--fi-ui,system-ui);text-transform:uppercase;letter-spacing:.05em;margin:0 0 3px}
.satt-src,.satt-sel{width:100%;font:15px var(--fi-serif,system-ui);padding:6px 8px;border:1.5px solid var(--c-line);border-radius:8px;background:var(--c-card);color:var(--c-ink);margin-bottom:8px}
.satt-sel{width:auto;margin:0;padding:4px 6px;font-size:14px}
.satt-plat-wrap{position:relative;width:min(170px,58vw);aspect-ratio:1;max-width:100%;margin:6px auto 10px}
.satt-plat{width:100%;height:100%;border-radius:50%;background:repeating-radial-gradient(circle,#1c1917 0 2px,#2a2522 2px 4px);box-shadow:0 0 0 6px #8d8379,0 3px 10px rgba(0,0,0,.35);position:relative;touch-action:none;cursor:grab}
.satt-plat.held{cursor:grabbing;box-shadow:0 0 0 6px var(--c-acc),0 3px 10px rgba(0,0,0,.35)}
.satt-label{position:absolute;inset:34%;border-radius:50%;background:var(--c-acc);color:#1a0d08;display:flex;align-items:center;justify-content:center;font:700 20px var(--fi-display,system-ui);pointer-events:none}
.satt-mark{position:absolute;left:50%;top:6%;width:3px;height:26%;margin-left:-1.5px;background:#f3ece2;border-radius:2px;pointer-events:none}
.satt-beat{position:absolute;right:-6px;top:-6px;width:20px;height:20px;border-radius:50%;background:#d8d0c6;border:2px solid #8d8379}
.satt-beat.on{background:#f2b705}
.satt-fl{display:flex;justify-content:space-between;gap:8px;font:700 13px var(--fi-ui,system-ui);margin-top:6px}
.satt .satt-f,.satt .satt-h{width:100%!important;max-width:none!important;accent-color:var(--c-acc);margin:4px 0}
.satt-btns{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}
.satt-btn{font:700 13px var(--fi-ui,system-ui);text-transform:uppercase;letter-spacing:.04em;padding:7px 12px;min-height:40px;min-width:44px;border-radius:999px;border:1.5px solid var(--c-line);background:var(--c-card);color:var(--c-ink);cursor:pointer;touch-action:manipulation;-webkit-user-select:none;user-select:none}
.satt-btn.primary{background:var(--c-acc);border-color:var(--c-acc);color:#1a0d08}
.satt-btn[aria-pressed="true"]{background:var(--c-ink);color:var(--c-card);border-color:var(--c-ink)}
.satt-btn.mute[aria-pressed="true"],.satt-rec[aria-pressed="true"]{background:#b3121f;border-color:#b3121f;color:#fff}
.satt-btn:focus-visible,.satt input:focus-visible,.satt-src:focus-visible,.satt-sel:focus-visible{outline:3px solid var(--c-acc);outline-offset:2px}
.satt-strips{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.satt-strip{border-top:2px solid var(--c-line);padding-top:6px;min-width:0}
.satt-ch{font:700 18px/1 var(--fi-display,system-ui);margin:0 0 4px}
.satt-eq{display:grid;grid-template-columns:auto 1fr;gap:0 6px;align-items:center;font:700 12px var(--fi-ui,system-ui);text-transform:uppercase}
.satt-eq input{width:100%;min-width:0;accent-color:var(--c-ink);margin:3px 0}
.satt-fadewrap{display:flex;gap:10px;align-items:stretch;justify-content:center;margin-top:8px}
.satt .satt-vf{writing-mode:vertical-lr;direction:rtl;width:32px!important;height:140px;accent-color:var(--c-acc);margin:0;background:linear-gradient(var(--c-line),var(--c-line)) center/4px 100% no-repeat}
.satt-meter{width:10px;height:140px;border-radius:3px;background:#3a3532;position:relative;overflow:hidden}
.satt-meter i{position:absolute;left:0;right:0;bottom:0;height:0;background:linear-gradient(to top,#2f9e44 0 70%,#f2b705 70% 88%,#e03131 88%)}
.satt-xf{margin-top:12px;border-top:2px solid var(--c-line);padding-top:8px}
.satt-xends{display:flex;justify-content:space-between;font:700 13px var(--fi-ui,system-ui)}
.satt-stat{margin:4px 0;font:15px/1.45 var(--fi-serif,system-ui);color:var(--c-ink)}
.satt-live{font:700 16px var(--fi-serif,system-ui);min-height:1.4em;color:var(--c-ok);margin:0}
.satt .sr{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}`;
  const style = () => { if (document.getElementById("sattCss")) return; const s = document.createElement("style"); s.id = "sattCss"; s.textContent = CSS; document.head.appendChild(s); };
  const EQMIN = -26, db = v => Math.pow(10, v / 20);
  function mount(host, opts) {
    style();
    const T = { src: [null, null], list: [], fader: [0, 0], range: [8, 8], rpm45: [false, false], rev: [false, false], run: [false, false], cue: [0, 0],
      nudge: [0, 0], grab: [null, null], scr: [0, 0], cur: [0, 0], pos: [0, 0], seek: null, sp: null, raf: 0, said: "", rec: null,
      vol: [.8, .8], mute: [false, false], eq: [[0, 0, 0], [0, 0, 0]], filt: [0, 0], xf: 0, cut: false, master: .9, N: null,
      id: "satt" + Math.random().toString(36).slice(2, 7) };
    const AC = () => opts.ctx(), $ = s => host.querySelector(s), on = () => T.run[0] || T.run[1];
    const rate = i => (T.rpm45[i] ? 1.35 : 1) * (1 + T.fader[i] / 100) * (1 + T.nudge[i]);   // the speed relative to the record's own
    const ready = () => T.src[0] && T.src[1];
    async function loadList() {
      const C = AC(); if (!C) return; const base = { id: "groove", name: "Built-in groove (100 bpm)", buf: await groove(C.sampleRate), bpm: BPM0 };
      let more = []; try { more = (opts.sources ? await opts.sources() : []) || []; } catch (e) {}
      T.list = [base].concat(more.filter(s => s && s.buf));
      for (let i = 0; i < 2; i++) if (!T.src[i] || !T.list.some(s => s.id === T.src[i].s.id)) T.src[i] = { s: T.list[0], data: mono(T.list[0].buf), sr: T.list[0].buf.sampleRate };
      host.querySelectorAll(".satt-src").forEach((sel, i) => { sel.innerHTML = T.list.map(s => `<option value="${esc(s.id)}"${T.src[i].s.id === s.id ? " selected" : ""}>${esc(s.name)}</option>`).join(""); });
    }
    function setSrc(i, id) { const s = T.list.find(x => x.id === id); if (!s) return; T.src[i] = { s, data: mono(s.buf), sr: s.buf.sampleRate }; seek(i, 0); T.cue[i] = 0; status(); }
    function seek(i, t) { T.seek = T.seek || [null, null]; T.seek[i] = t; T.pos[i] = t; }
    // ---- audio: one callback reads both records (deck A on channel 0, B on channel 1); each deck then has its own EQ, filter and fader into the crossfader and master ----
    function engine() {
      const C = AC(); if (T.sp || !C || !C.createScriptProcessor) return !!T.sp;
      const sp = C.createScriptProcessor(1024, 0, 2), pos = [0, 0];
      sp.onaudioprocess = ev => {
        const out = [ev.outputBuffer.getChannelData(0), ev.outputBuffer.getChannelData(1)]; if (!ready()) { out[0].fill(0); out[1].fill(0); return; }
        if (T.seek) { T.seek.forEach((x, i) => { if (x == null) return; const N = T.src[i].data.length; pos[i] = ((x * T.src[i].sr) % N + N) % N; }); T.seek = null; }
        for (let i = 0; i < 2; i++) {
          const d = T.src[i].data, N = d.length, o = out[i], step = T.src[i].sr / C.sampleRate;
          const tgt = T.grab[i] ? T.scr[i] : T.run[i] ? rate(i) * (T.rev[i] ? -1 : 1) : 0, k = T.grab[i] ? .006 : .00012;   // the motor eases a platter up to speed and back down
          let p = pos[i], c = T.cur[i];
          for (let n = 0; n < o.length; n++) { c += (tgt - c) * k; p = (p + c * step) % N; if (p < 0) p += N; const a = Math.floor(p), f = p - a; o[n] = (d[a] + (d[(a + 1) % N] - d[a]) * f) * .6 * Math.min(1, Math.abs(c) * 5); }   // a stopped or barely turning record makes no sound (and no DC)
          pos[i] = p; T.cur[i] = c; T.pos[i] = p / T.src[i].sr;
        }
      };
      const split = C.createChannelSplitter(2), sum = C.createGain(), master = C.createGain(), tap = C.createScriptProcessor(1024, 2, 2);
      sp.connect(split);
      const ch = [0, 1].map(i => {
        const lo = C.createBiquadFilter(), mid = C.createBiquadFilter(), hi = C.createBiquadFilter(), filt = C.createBiquadFilter(), g = C.createGain(), an = C.createAnalyser(), pan = C.createStereoPanner ? C.createStereoPanner() : null;
        lo.type = "lowshelf"; lo.frequency.value = 220; mid.type = "peaking"; mid.frequency.value = 1100; mid.Q.value = .8; hi.type = "highshelf"; hi.frequency.value = 3800;
        filt.type = "lowpass"; filt.frequency.value = 22000; filt.Q.value = 1.2; an.fftSize = 512;
        split.connect(lo, i); lo.connect(mid); mid.connect(hi); hi.connect(filt); filt.connect(g); g.connect(an);
        if (pan) { pan.pan.value = i ? .3 : -.3; g.connect(pan); pan.connect(sum); } else g.connect(sum);
        return { lo, mid, hi, filt, g, an, buf: new Float32Array(512) };
      });
      tap.onaudioprocess = ev => { for (let c = 0; c < 2; c++) { const x = ev.inputBuffer.getChannelData(c); ev.outputBuffer.getChannelData(c).set(x); if (T.rec) T.rec[c].push(x.slice()); } };
      sum.connect(master); master.connect(tap); tap.connect(opts.out ? opts.out() : C.destination);
      T.sp = sp; T.N = { ch, master, split, sum, tap }; mix(); return true;
    }
    // the mixer: EQ (at the bottom of its travel a band is cut entirely: a "kill"), a filter sweep, the channel fader, mute and the crossfader
    function xfGain(i) { const x = (T.xf + 1) / 2, v = i ? x : 1 - x;   // 0 … 1 toward this deck's side
      return T.cut ? Math.min(1, v / .08) : Math.min(1, Math.sin(v * Math.PI / 2) / Math.SQRT1_2); }   // scratch curve: full on almost at once; smooth: both full at center
    function mix() {
      if (!T.N) return; const C = AC(), t = C.currentTime, set = (p, v) => p.setTargetAtTime(v, t, .012);
      T.N.ch.forEach((c, i) => {
        [c.lo, c.mid, c.hi].forEach((b, k) => set(b.gain, T.eq[i][k] <= EQMIN ? -60 : T.eq[i][k]));
        const f = T.filt[i]; if (f < -.02) { c.filt.type = "lowpass"; set(c.filt.frequency, 20000 * Math.pow(2, f * 9.5)); } else if (f > .02) { c.filt.type = "highpass"; set(c.filt.frequency, 20 * Math.pow(2, f * 9.5)); } else { c.filt.type = "lowpass"; set(c.filt.frequency, 22000); }
        set(c.g.gain, T.mute[i] ? 0 : T.vol[i] * T.vol[i] * xfGain(i));
      });
      set(T.N.master.gain, T.master);
    }
    function tick() {
      if (!host.isConnected) { destroy(); return; }   // the page re-rendered without the decks: stop playing
      for (let i = 0; i < 2; i++) { if (T.grab[i] && performance.now() - T.grab[i].t > 60) T.scr[i] *= .5;   // holding a platter still stops its sound
        const p = $(`#${T.id}p${i}`), l = $(`#${T.id}b${i}`), s = T.src[i] && T.src[i].s, beat = 60 / ((s && s.bpm) || BPM0);
        if (p && !T.grab[i]) p.style.transform = `rotate(${(T.pos[i] / 1.8) * 360 % 360}deg)`;   // 33⅓ rpm: one turn every 1.8 s at normal speed
        if (l) l.classList.toggle("on", Math.abs(T.cur[i]) > .2 && ((T.pos[i] % beat) + beat) % beat / beat < .18);
        const m = $(`#${T.id}m${i} i`); if (m && T.N) { const c = T.N.ch[i]; c.an.getFloatTimeDomainData(c.buf); let r = 0; for (const x of c.buf) r += x * x; r = Math.sqrt(r / c.buf.length);
          const dB = 20 * Math.log10(r + 1e-6); m.style.height = Math.max(0, Math.min(100, (dB + 48) / 48 * 100)) + "%"; } }
      status(); T.raf = requestAnimationFrame(tick);
    }
    function status() {
      const el = $(".satt-stat"), live = $(".satt-live"); if (!el || !ready()) return;
      const sa = T.src[0].s, sb = T.src[1].s, same = sa.id === sb.id, bA = sa.bpm ? sa.bpm * rate(0) : 0, bB = sb.bpm ? sb.bpm * rate(1) : 0;
      const r = same ? rate(1) / rate(0) : bA && bB ? bB / bA : 1, pct = (r - 1) * 100, c = Math.round(1200 * Math.log2(r));
      let ph = null; if (bA && bB) { const fa = T.pos[0] * sa.bpm / 60, fb = T.pos[1] * sb.bpm / 60; ph = ((fb - fa) % 1 + 1) % 1; if (ph > .5) ph -= 1; }
      const both = T.run[0] && T.run[1] && !T.rev[0] && !T.rev[1];
      const tempo = `Deck A: <b>${bA ? bA.toFixed(1) + " bpm" : fmtF(T.fader[0])}</b> · Deck B: <b>${bB ? bB.toFixed(1) + " bpm" : fmtF(T.fader[1])}</b>.`;
      const diff = Math.abs(pct) < .005 ? " Same tempo." : ` B is ${Math.abs(pct).toFixed(2)}% ${pct > 0 ? "faster" : "slower"}` + (same ? `, so it sounds <b>${Math.abs(c)} cents ${c > 0 ? "sharp" : "flat"}</b>${Math.abs(c) >= 90 ? ` (about ${Math.round(Math.abs(c) / 100)} semitone${Math.round(Math.abs(c) / 100) > 1 ? "s" : ""})` : ""}.` : ".");
      const sync = Math.abs(pct) < .15, inPh = ph != null && Math.abs(ph) < .06;
      el.innerHTML = tempo + (same || (bA && bB) ? diff : "") + (both && ph != null ? ` The beats are ${inPh ? "lined up" : `${Math.round(Math.abs(ph) * 100)}% of a beat apart (B is ${ph > 0 ? "ahead" : "behind"})`}.` : "");
      const v = !both ? "" : sync && inPh ? "Synchronized: same tempo, beats together." + (same ? " Same pitch, too." : "") : sync ? "Same tempo. Now nudge B to line up the beats." : Math.abs(pct) < 1 ? "Very close: listen for the slow drift between the two records." : "";
      if (live && v !== T.said && !T.rec) { live.textContent = v; T.said = v; }
      const pb = $(".satt-play"); if (pb) pb.innerHTML = `<span aria-hidden="true">${on() ? "■" : "▶"} </span>${on() ? "Stop both" : "Play both"}`;
      for (let i = 0; i < 2; i++) { const b = $(`#${T.id}go${i}`); if (b) { b.innerHTML = `<span aria-hidden="true">${T.run[i] ? "■" : "▶"} </span>${T.run[i] ? "Stop" : "Start"}`; b.setAttribute("aria-label", `${T.run[i] ? "Stop" : "Start"} deck ${"AB"[i]}`); } }
    }
    async function start(which = [0, 1]) { if (!AC()) return; if (!T.list.length) await loadList(); engine(); which.forEach(i => T.run[i] = true); if (!T.raf) tick(); status(); }
    function setFader(i, v) { T.fader[i] = Math.max(-T.range[i], Math.min(T.range[i], Math.round(v * 100) / 100)); const f = $(`#${T.id}f${i}`); if (f) f.value = T.fader[i]; const o = $(`#${T.id}v${i}`); if (o) o.textContent = fmtF(T.fader[i]); status(); }
    function setRange(i, r) { T.range[i] = r; const f = $(`#${T.id}f${i}`); if (f) { f.min = -r; f.max = r; f.step = r > 16 ? .5 : .1; } setFader(i, T.fader[i]); }
    function challenge() { const s = (Math.random() < .5 ? -1 : 1) * (2.5 + Math.random() * 4.5); T.rpm45 = [false, false]; host.querySelectorAll("[data-rpm]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.rpm.endsWith(",33"))));
      setFader(0, 0); setFader(1, Math.round(s * 10) / 10); seek(0, 0); seek(1, Math.random() * .6); status(); }
    // sync: set this deck's pitch fader so its tempo matches the other deck's (the beats still need lining up)
    function syncTo(i) { const j = 1 - i, si = T.src[i] && T.src[i].s, sj = T.src[j] && T.src[j].s; if (!si || !sj) return;
      const want = (sj.bpm || BPM0) * rate(j) / ((si.bpm || BPM0) * (T.rpm45[i] ? 1.35 : 1)), pct = (want - 1) * 100;
      if (Math.abs(pct) > T.range[i]) { const r = [8, 16, 50].find(x => x >= Math.abs(pct)) || 50; setRange(i, r); const sel = $(`#${T.id}r${i}`); if (sel) sel.value = r; }
      setFader(i, pct); say(`Deck ${"AB"[i]} now matches deck ${"AB"[j]}'s tempo. Line up the beats with the nudge buttons or the platter.`); }
    function say(t) { const l = $(".satt-live"); if (l) { l.textContent = t; T.said = t; } }
    // recording: the mixer's output (both decks, after EQ, faders and crossfader) goes into a new audio track
    function recToggle() {
      const b = $(".satt-rec"), C = AC(); if (!C) return;
      if (!T.rec) { if (!on()) start(); engine(); T.rec = [[], []]; if (opts.onRecStart) try { opts.onRecStart(); } catch (e) {}
        b.innerHTML = '<span aria-hidden="true">■ </span>Stop recording'; b.setAttribute("aria-pressed", "true"); say("Recording the turntables…"); return; }
      const R = T.rec; T.rec = null; b.innerHTML = '<span aria-hidden="true">● </span>Record to a new audio track'; b.setAttribute("aria-pressed", "false"); say("");
      const n = R[0].reduce((s, x) => s + x.length, 0); if (n < C.sampleRate * .2) return;
      const buf = C.createBuffer(2, n, C.sampleRate); let o = 0; R[0].forEach((x, i) => { buf.getChannelData(0).set(x, o); buf.getChannelData(1).set(R[1][i], o); o += x.length; });
      if (opts.onRecorded) opts.onRecorded(buf);
    }
    const D = i => "AB"[i], ID = (k, i) => `${T.id}${k}${i}`;
    const deck = i => `<div class="satt-deck" data-i="${i}" role="group" aria-labelledby="${ID("n", i)}"><p class="satt-name" id="${ID("n", i)}">Deck ${D(i)}</p>
      <label class="satt-l" for="${ID("s", i)}">Record</label><select class="satt-src" id="${ID("s", i)}" data-i="${i}"><option>Built-in groove (100 bpm)</option></select>
      <div class="satt-plat-wrap" aria-hidden="true"><div class="satt-plat" id="${ID("p", i)}" data-i="${i}"><span class="satt-label">${D(i)}</span><span class="satt-mark"></span></div><span class="satt-beat" id="${ID("b", i)}"></span></div>
      <div class="satt-btns"><button type="button" class="satt-btn primary" id="${ID("go", i)}" data-d="go,${i}"><span aria-hidden="true">▶ </span>Start</button><button type="button" class="satt-btn" data-d="cue,${i}" aria-label="Back to deck ${D(i)}'s cue point">Cue</button><button type="button" class="satt-btn" data-d="setcue,${i}" aria-label="Set deck ${D(i)}'s cue point here">Set cue</button><button type="button" class="satt-btn" data-d="rev,${i}" aria-pressed="false" aria-label="Reverse deck ${D(i)}">Reverse</button></div>
      <div class="satt-btns" role="group" aria-label="Deck ${D(i)} speed"><button type="button" class="satt-btn" data-rpm="${i},33" aria-pressed="true">33⅓</button><button type="button" class="satt-btn" data-rpm="${i},45" aria-pressed="false">45</button><button type="button" class="satt-btn" data-d="sync,${i}" aria-label="Sync deck ${D(i)}'s tempo to deck ${D(1 - i)}">Sync</button><button type="button" class="satt-btn" data-d="zero,${i}" aria-label="Reset deck ${D(i)}'s pitch to 0">Pitch 0</button></div>
      <div class="satt-fl"><label for="${ID("f", i)}">Pitch (speed) <output id="${ID("v", i)}" for="${ID("f", i)}">${fmtF(T.fader[i])}</output></label><label>Range <select class="satt-sel" id="${ID("r", i)}" data-i="${i}"><option value="8">±8%</option><option value="16">±16%</option><option value="50">±50%</option></select></label></div>
      <input type="range" class="satt-f" id="${ID("f", i)}" data-i="${i}" min="-8" max="8" step="0.1" value="${T.fader[i]}">
      <div class="satt-btns"><button type="button" class="satt-btn" data-n="${i},-1">◀ Hold to slow</button><button type="button" class="satt-btn" data-n="${i},1">Hold to push ▶</button></div></div>`;
    const eqRow = (i, k, lab) => `<label for="${ID("e" + k, i)}">${lab}</label><input type="range" id="${ID("e" + k, i)}" data-eq="${i},${k}" min="${EQMIN}" max="6" step="1" value="0" aria-valuetext="0 dB">`;
    const strip = i => `<div class="satt-strip" role="group" aria-label="Channel ${D(i)}"><p class="satt-ch" aria-hidden="true">${D(i)}</p>
      <div class="satt-eq">${eqRow(i, 2, "High")}${eqRow(i, 1, "Mid")}${eqRow(i, 0, "Low")}<label for="${ID("fx", i)}">Filter</label><input type="range" id="${ID("fx", i)}" data-filt="${i}" min="-1" max="1" step="0.02" value="0" aria-valuetext="off"></div>
      <div class="satt-btns"><button type="button" class="satt-btn mute" data-mute="${i}" aria-pressed="false" aria-label="Mute deck ${D(i)}">Mute</button></div>
      <div class="satt-fadewrap"><div class="satt-meter" id="${ID("m", i)}" aria-hidden="true"><i></i></div><label class="sr" for="${ID("vol", i)}">Deck ${D(i)} volume</label><input type="range" class="satt-vf" id="${ID("vol", i)}" data-vol="${i}" min="0" max="1" step="0.01" value="${T.vol[i]}" aria-valuetext="${Math.round(T.vol[i] * 100)}%"></div></div>`;
    host.innerHTML = `<div class="satt"><div class="satt-rig">${deck(0)}
      <div class="satt-mixer" role="group" aria-labelledby="${T.id}mx"><p class="satt-name" id="${T.id}mx">Mixer</p><div class="satt-strips">${strip(0)}${strip(1)}</div>
        <div class="satt-xf"><label class="satt-l" for="${T.id}xf">Crossfader</label><div class="satt-xends" aria-hidden="true"><span>A</span><span>B</span></div><input type="range" class="satt-h" id="${T.id}xf" data-xf min="-1" max="1" step="0.01" value="0" aria-valuetext="center">
          <div class="satt-btns"><button type="button" class="satt-btn" data-a="cut" aria-pressed="false">Scratch curve</button><button type="button" class="satt-btn" data-a="xc">Center</button></div>
          <label class="satt-l" for="${T.id}ms">Master volume</label><input type="range" class="satt-h" id="${T.id}ms" data-master min="0" max="1" step="0.01" value="${T.master}" aria-valuetext="${Math.round(T.master * 100)}%"></div></div>
      ${deck(1)}</div>
      <div class="satt-btns"><button type="button" class="satt-btn primary satt-play" data-a="play"><span aria-hidden="true">▶ </span>Play both</button><button type="button" class="satt-btn" data-a="new">New challenge</button>${opts.record ? '<button type="button" class="satt-btn satt-rec" data-a="rec" aria-pressed="false"><span aria-hidden="true">● </span>Record to a new audio track</button>' : ""}</div>
      <p class="satt-stat"></p><p class="satt-live" role="status" aria-live="polite"></p></div>`;
    challenge();
    // ---- events (scoped to this host) ----
    const ang = (el, e) => { const r = el.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI; };
    const onClick = e => {
      const b = e.target.closest("[data-a],[data-d],[data-rpm],[data-mute]"); if (!b) return;
      if (b.dataset.mute != null) { const i = +b.dataset.mute; T.mute[i] = !T.mute[i]; b.setAttribute("aria-pressed", String(T.mute[i])); mix(); return; }
      if (b.dataset.rpm) { const [i, r] = b.dataset.rpm.split(","); T.rpm45[+i] = r === "45"; host.querySelectorAll(`[data-rpm^="${i},"]`).forEach(x => x.setAttribute("aria-pressed", String(x === b))); status(); return; }
      if (b.dataset.d) { const [a, s] = b.dataset.d.split(","), i = +s;
        if (a === "go") { if (T.run[i]) { T.run[i] = false; status(); } else start([i]); }
        else if (a === "cue") seek(i, T.cue[i]);
        else if (a === "setcue") { T.cue[i] = T.pos[i]; say(`Deck ${D(i)}'s cue point is set. Press Cue to jump back to it.`); }
        else if (a === "rev") { T.rev[i] = !T.rev[i]; b.setAttribute("aria-pressed", String(T.rev[i])); status(); }
        else if (a === "sync") syncTo(i);
        else if (a === "zero") setFader(i, 0);
        return; }
      const a = b.dataset.a;
      if (a === "play") { if (on()) { T.run = [false, false]; status(); } else start(); }
      else if (a === "new") challenge();
      else if (a === "cut") { T.cut = !T.cut; b.setAttribute("aria-pressed", String(T.cut)); mix(); }
      else if (a === "xc") { T.xf = 0; const x = $(`#${T.id}xf`); x.value = 0; x.setAttribute("aria-valuetext", "center"); mix(); }
      else if (a === "rec") recToggle(); };
    const nudge = (b, down) => { const [i, d] = b.dataset.n.split(",").map(Number); T.nudge[i] = down ? d * .04 : 0; };
    const onDown = async e => {
      const nb = e.target.closest("[data-n]"); if (nb) { e.preventDefault(); nudge(nb, true); return; }
      const el = e.target.closest(".satt-plat"); if (!el) return; e.preventDefault(); const i = +el.dataset.i;
      if (!AC()) return; if (!T.list.length) await loadList(); engine(); if (!T.raf) tick();
      try { el.setPointerCapture(e.pointerId); } catch (x) {} T.grab[i] = { a: ang(el, e), t: performance.now(), rot: (T.pos[i] / 1.8) * 360 }; T.scr[i] = 0; el.classList.add("held"); };
    const onMove = e => { const el = e.target.closest && e.target.closest(".satt-plat"); if (!el) return; const i = +el.dataset.i, g = T.grab[i]; if (!g) return;
      const a = ang(el, e), now = performance.now(); let da = a - g.a; if (da > 180) da -= 360; if (da < -180) da += 360; const dt = Math.max(.008, (now - g.t) / 1000);
      T.scr[i] = Math.max(-6, Math.min(6, (da / 360 * 1.8) / dt)); g.a = a; g.t = now; g.rot += da; el.style.transform = `rotate(${g.rot % 360}deg)`; };
    const onUp = () => { T.nudge = [0, 0]; for (let i = 0; i < 2; i++) if (T.grab[i]) { T.grab[i] = null; T.scr[i] = 0; const p = $(`#${T.id}p${i}`); if (p) p.classList.remove("held"); } };
    const onKey = (e, down) => { const b = e.target.closest && e.target.closest("[data-n]"); if (b && (e.key === " " || e.key === "Enter")) { e.preventDefault(); if (!e.repeat) nudge(b, down); } };
    const kd = e => onKey(e, true), ku = e => onKey(e, false);
    const onInput = e => { const t = e.target;
      if (t.classList.contains("satt-f")) setFader(+t.dataset.i, +t.value);
      else if (t.dataset.eq) { const [i, k] = t.dataset.eq.split(",").map(Number); T.eq[i][k] = +t.value; t.setAttribute("aria-valuetext", +t.value <= EQMIN ? "cut (kill)" : `${t.value > 0 ? "+" : ""}${t.value} dB`); mix(); }
      else if (t.dataset.filt != null) { const i = +t.dataset.filt, v = +t.value; T.filt[i] = v; t.setAttribute("aria-valuetext", Math.abs(v) <= .02 ? "off" : v < 0 ? `low-pass ${Math.round(-v * 100)}%` : `high-pass ${Math.round(v * 100)}%`); mix(); }
      else if (t.dataset.vol != null) { const i = +t.dataset.vol; T.vol[i] = +t.value; t.setAttribute("aria-valuetext", Math.round(T.vol[i] * 100) + "%"); mix(); }
      else if (t.dataset.xf != null) { T.xf = +t.value; t.setAttribute("aria-valuetext", Math.abs(T.xf) < .02 ? "center" : `${Math.round(Math.abs(T.xf) * 100)}% toward ${T.xf < 0 ? "A" : "B"}`); mix(); }
      else if (t.dataset.master != null) { T.master = +t.value; t.setAttribute("aria-valuetext", Math.round(T.master * 100) + "%"); mix(); } };
    const onChange = e => { const s = e.target.closest(".satt-src"); if (s) setSrc(+s.dataset.i, s.value); const r = e.target.closest(".satt-sel"); if (r) setRange(+r.dataset.i, +r.value); };
    host.addEventListener("click", onClick); host.addEventListener("pointerdown", onDown); host.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp); window.addEventListener("pointercancel", onUp);
    host.addEventListener("keydown", kd); host.addEventListener("keyup", ku); host.addEventListener("input", onInput); host.addEventListener("change", onChange);
    setTimeout(() => { status(); const el = $(".satt-stat"); if (el && !ready()) el.innerHTML = "Deck A and deck B both hold the built-in groove at 100 bpm, but B's speed is off. Press <b>Play both</b>."; }, 0);
    function destroy() { T.run = [false, false]; T.rec = null; cancelAnimationFrame(T.raf); T.raf = 0;
      if (T.sp) { T.sp.disconnect(); T.sp.onaudioprocess = null; T.sp = null; } if (T.N) { T.N.tap.disconnect(); T.N.tap.onaudioprocess = null; T.N = null; }
      window.removeEventListener("pointerup", onUp); window.removeEventListener("pointercancel", onUp); if (host.isConnected) host.innerHTML = ""; }
    if (AC && opts.ctx && opts.eager !== false) loadList().then(status).catch(() => {});
    return {
      refresh: () => loadList().then(status),
      setSource: (i, id) => loadList().then(() => { setSrc(i, id); const s = $(`#${T.id}s${i}`); if (s) s.value = id; }),
      stop: () => { T.run = [false, false]; status(); },
      destroy,
      state: T,
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
