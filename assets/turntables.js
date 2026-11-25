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
  const CSS = `.satt{container-type:inline-size;--bg:#141518;--panel:#1e2024;--panel2:#26292e;--line:#3a3e45;--ink:#ecebe8;--dim:#a9a6a0;--a:#ff7a45;--b:#38c7f0;--ok:#7ee08f;color:var(--ink);background:var(--bg);border-radius:16px;padding:10px;font-family:var(--fi-ui,system-ui)}
.satt-rig{-webkit-user-select:none;user-select:none;display:grid;grid-template-columns:1fr;grid-template-areas:"a" "b" "m";gap:8px;align-items:start}
@container (min-width:520px){.satt-rig{grid-template-columns:1fr 1fr;grid-template-areas:"a b" "m m"}}
@container (min-width:860px){.satt-rig{grid-template-columns:1fr 230px 1fr;grid-template-areas:"a m b"}}
.satt-deck,.satt-mixer{background:linear-gradient(180deg,var(--panel2),var(--panel));border:1px solid var(--line);border-radius:12px;padding:8px 10px;min-width:0;box-shadow:inset 0 1px 0 rgba(255,255,255,.05)}
.satt-deck[data-i="0"]{grid-area:a;--acc:var(--a)}.satt-deck[data-i="1"]{grid-area:b;--acc:var(--b)}.satt-mixer{grid-area:m;justify-self:center;width:100%;max-width:330px;box-sizing:border-box}
.satt-top{display:flex;gap:8px;align-items:center;margin-bottom:6px}
.satt-name{font:700 22px/1 var(--fi-display,system-ui);margin:0;color:var(--acc,var(--ink));min-width:1em}
.satt-src,.satt-sel{flex:1;min-width:0;font:13px var(--fi-ui,system-ui);padding:5px 6px;border:1px solid var(--line);border-radius:7px;background:#121316;color:var(--ink)}
.satt-sel{flex:none;padding:3px 4px;font-size:12px}
.satt-body{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}
.satt-plat-wrap{position:relative;width:min(150px,100%);aspect-ratio:1;margin:0 auto;padding:6px;border-radius:12px;background:#101114;box-shadow:inset 0 0 0 1px var(--line)}
.satt-plat{width:100%;height:100%;border-radius:50%;background:radial-gradient(circle,transparent 0 31%,rgba(255,255,255,.06) 31.5% 32%,transparent 32.5%),repeating-radial-gradient(circle,#0c0c0d 0 1.5px,#1b1b1e 1.5px 3px);box-shadow:0 0 0 3px #2b2e33,0 4px 12px rgba(0,0,0,.6);position:relative;touch-action:none;cursor:grab}
.satt-plat.held{cursor:grabbing;box-shadow:0 0 0 3px var(--acc),0 4px 12px rgba(0,0,0,.6)}
.satt-label{position:absolute;inset:35%;border-radius:50%;background:var(--acc);color:#141518;display:flex;align-items:center;justify-content:center;font:700 16px var(--fi-display,system-ui);pointer-events:none}
.satt-mark{position:absolute;left:50%;top:4%;width:2px;height:28%;margin-left:-1px;background:#f3ece2;border-radius:2px;pointer-events:none;opacity:.85}
.satt-beat{position:absolute;right:6px;top:6px;width:9px;height:9px;border-radius:50%;background:#3a3e45}
.satt-beat.on{background:var(--acc);box-shadow:0 0 8px var(--acc)}
.satt-pitch{display:flex;flex-direction:column;align-items:center;gap:4px}
.satt-pitch output{font:700 12px/1 ui-monospace,Menlo,monospace;color:var(--acc);min-width:5.2em;text-align:center}
.satt-pl{font:700 10px var(--fi-ui,system-ui);letter-spacing:.08em;text-transform:uppercase;color:var(--dim)}
.satt-row{display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin-top:6px}
.satt-row .gap{flex:1}
.satt-btn{font:700 11px var(--fi-ui,system-ui);text-transform:uppercase;letter-spacing:.05em;padding:0 9px;height:30px;min-width:30px;border-radius:7px;border:1px solid var(--line);background:#2d3036;color:var(--ink);cursor:pointer;touch-action:manipulation;-webkit-user-select:none;user-select:none;box-shadow:0 1px 0 rgba(0,0,0,.4)}
.satt-btn:hover{background:#363a41}
.satt-btn.go{background:var(--acc);border-color:var(--acc);color:#141518;font-size:13px;min-width:38px}
.satt-btn[aria-pressed="true"]{background:var(--acc,var(--ink));border-color:var(--acc,var(--ink));color:#141518}
.satt-mixer .satt-btn[aria-pressed="true"]{background:var(--ink);border-color:var(--ink)}
.satt-btn.mute[aria-pressed="true"],.satt-rec[aria-pressed="true"]{background:#e5484d;border-color:#e5484d;color:#fff}
.satt-btn.primary{background:var(--ink);border-color:var(--ink);color:#141518}
.satt-btn:focus-visible,.satt input:focus-visible,.satt-src:focus-visible,.satt-sel:focus-visible,.satt-knob:focus-visible{outline:2px solid #fff;outline-offset:2px}
.satt input[type=range]{-webkit-appearance:none;appearance:none;background:transparent;margin:0;padding:0;cursor:pointer}
.satt input[type=range]::-webkit-slider-runnable-track{background:#0e0f11;border-radius:3px;box-shadow:inset 0 0 0 1px var(--line)}
.satt input[type=range]::-moz-range-track{background:#0e0f11;border-radius:3px;border:1px solid var(--line)}
.satt input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;background:linear-gradient(#f4f2ee,#b9b5ae);border:1px solid #111;border-radius:3px}
.satt input[type=range]::-moz-range-thumb{background:linear-gradient(#f4f2ee,#b9b5ae);border:1px solid #111;border-radius:3px}
.satt .satt-pf,.satt .satt-vf{writing-mode:vertical-lr;direction:rtl;width:26px!important;height:118px!important;max-width:none!important}
.satt .satt-pf::-webkit-slider-runnable-track,.satt .satt-vf::-webkit-slider-runnable-track{width:6px;margin:0 auto}
.satt .satt-pf::-webkit-slider-thumb,.satt .satt-vf::-webkit-slider-thumb{width:24px;height:12px;margin-left:-9px}
.satt .satt-pf::-moz-range-thumb,.satt .satt-vf::-moz-range-thumb{width:22px;height:10px}
.satt .satt-pf::-webkit-slider-thumb{background:linear-gradient(#fff,var(--acc))}
.satt .satt-h{width:100%!important;max-width:none!important;height:24px!important}
.satt .satt-h::-webkit-slider-runnable-track{height:6px}
.satt .satt-h::-webkit-slider-thumb{width:14px;height:24px;margin-top:-9px}
.satt .satt-h::-moz-range-thumb{width:12px;height:22px}
.satt-nud{display:flex;gap:3px}
.satt-nud .satt-btn{padding:0 6px;min-width:28px}
.satt-strips{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.satt-strip{display:flex;flex-direction:column;align-items:center;gap:5px;min-width:0;padding:4px 2px 6px;border-radius:9px;background:rgba(0,0,0,.18)}
.satt-knobs{display:grid;grid-template-columns:1fr 1fr;gap:3px 6px}
.satt-strip[data-i="0"]{--acc:var(--a)}.satt-strip[data-i="1"]{--acc:var(--b)}
.satt-ch{font:700 15px/1 var(--fi-display,system-ui);margin:2px 0 0;color:var(--acc)}
.satt-kn{display:flex;flex-direction:column;align-items:center;gap:1px}
.satt-knob{width:30px;height:30px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#55595f,#24272b 70%);box-shadow:0 2px 4px rgba(0,0,0,.6),inset 0 0 0 1px #000;position:relative;cursor:ns-resize;touch-action:none}
.satt-knob i{position:absolute;left:50%;top:3px;width:2px;height:10px;margin-left:-1px;background:var(--acc,#fff);border-radius:1px;transform-origin:1px 12px}
.satt-kl{font:700 9px var(--fi-ui,system-ui);letter-spacing:.08em;text-transform:uppercase;color:var(--dim)}
.satt-fadewrap{display:flex;gap:6px;align-items:stretch;justify-content:center}
.satt-meter{width:6px;height:118px;border-radius:3px;background:#0e0f11;position:relative;overflow:hidden;box-shadow:inset 0 0 0 1px var(--line)}
.satt-meter i{position:absolute;left:0;right:0;bottom:0;height:0;background:linear-gradient(to top,#3ccf5b 0 70%,#f5c518 70% 88%,#e5484d 88%)}
.satt-xf{margin-top:6px;padding-top:6px;border-top:1px solid var(--line)}
.satt-xrow{display:flex;gap:6px;align-items:center}
.satt-xrow b{font:700 13px var(--fi-display,system-ui)}
.satt-xrow b:first-child{color:var(--a)}.satt-xrow b:last-of-type{color:var(--b)}
.satt-mrow{display:flex;gap:6px;align-items:center;justify-content:space-between;margin-top:4px}
.satt-bar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:8px}
.satt-bar .satt-btn{height:34px;padding:0 12px;font-size:12px}
.satt-stat{margin:6px 2px 0;font:14px/1.45 var(--fi-serif,system-ui);color:var(--ink)}
.satt-stat b{color:#fff}
.satt-live{font:700 14px var(--fi-serif,system-ui);min-height:1.3em;color:var(--ok);margin:2px}
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
      for (let i = 0; i < 2; i++) { const b = $(`#${T.id}go${i}`); if (b) { b.innerHTML = `<span aria-hidden="true">${T.run[i] ? "■" : "▶"}</span>`; b.setAttribute("aria-label", `${T.run[i] ? "Stop" : "Start"} deck ${"AB"[i]}`); } }
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
    const deck = i => `<div class="satt-deck" data-i="${i}" role="group" aria-labelledby="${ID("n", i)}">
      <div class="satt-top"><p class="satt-name" id="${ID("n", i)}"><span class="sr">Deck </span>${D(i)}</p><label class="sr" for="${ID("s", i)}">Deck ${D(i)} record</label><select class="satt-src" id="${ID("s", i)}" data-i="${i}"><option>Built-in groove (100 bpm)</option></select></div>
      <div class="satt-body"><div class="satt-plat-wrap" aria-hidden="true"><div class="satt-plat" id="${ID("p", i)}" data-i="${i}"><span class="satt-label">${D(i)}</span><span class="satt-mark"></span></div><span class="satt-beat" id="${ID("b", i)}"></span></div>
        <div class="satt-pitch"><span class="satt-pl" aria-hidden="true">Pitch</span><output id="${ID("v", i)}" for="${ID("f", i)}">${fmtF(T.fader[i])}</output><label class="sr" for="${ID("f", i)}">Deck ${D(i)} pitch (speed)</label><input type="range" class="satt-f satt-pf" id="${ID("f", i)}" data-i="${i}" min="-8" max="8" step="0.1" value="${T.fader[i]}">
          <div class="satt-nud"><button type="button" class="satt-btn" data-n="${i},-1" aria-label="Hold to slow deck ${D(i)}">◀</button><button type="button" class="satt-btn" data-n="${i},1" aria-label="Hold to push deck ${D(i)}">▶</button></div>
          <label class="sr" for="${ID("r", i)}">Deck ${D(i)} pitch range</label><select class="satt-sel" id="${ID("r", i)}" data-i="${i}"><option value="8">±8%</option><option value="16">±16%</option><option value="50">±50%</option></select><button type="button" class="satt-btn" data-d="zero,${i}" aria-label="Reset deck ${D(i)}'s pitch to 0">0%</button></div></div>
      <div class="satt-row"><button type="button" class="satt-btn go" id="${ID("go", i)}" data-d="go,${i}" aria-label="Start deck ${D(i)}"><span aria-hidden="true">▶</span></button><button type="button" class="satt-btn" data-d="cue,${i}" aria-label="Back to deck ${D(i)}'s cue point">Cue</button><button type="button" class="satt-btn" data-d="setcue,${i}" aria-label="Set deck ${D(i)}'s cue point here">Set</button><button type="button" class="satt-btn" data-d="rev,${i}" aria-pressed="false" aria-label="Reverse deck ${D(i)}">Rev</button>
        <span class="gap"></span><button type="button" class="satt-btn" data-rpm="${i},33" aria-pressed="true" aria-label="Deck ${D(i)} at 33⅓ rpm">33</button><button type="button" class="satt-btn" data-rpm="${i},45" aria-pressed="false" aria-label="Deck ${D(i)} at 45 rpm">45</button><button type="button" class="satt-btn" data-d="sync,${i}" aria-label="Sync deck ${D(i)}'s tempo to deck ${D(1 - i)}">Sync</button></div></div>`;
    const kText = (key, v) => key[0] === "e" ? (v <= EQMIN ? "cut (kill)" : `${v > 0 ? "+" : ""}${v} dB`) : key[0] === "f" ? (Math.abs(v) <= .02 ? "off" : v < 0 ? `low-pass ${Math.round(-v * 100)}%` : `high-pass ${Math.round(v * 100)}%`) : Math.round(v * 100) + "%";
    const knob = (key, lab, short, min, max, step, val) => `<div class="satt-kn"><div class="satt-knob" role="slider" tabindex="0" aria-label="${lab}" aria-valuemin="${min}" aria-valuemax="${max}" aria-valuenow="${val}" aria-valuetext="${kText(key, val)}" data-k="${key}" data-min="${min}" data-max="${max}" data-step="${step}" data-def="${val}"><i></i></div><span class="satt-kl" aria-hidden="true">${short}</span></div>`;
    const strip = i => `<div class="satt-strip" data-i="${i}" role="group" aria-label="Channel ${D(i)}"><p class="satt-ch" aria-hidden="true">${D(i)}</p>
      <div class="satt-knobs">${knob(`e,${i},2`, `Deck ${D(i)} high EQ`, "Hi", EQMIN, 6, 1, 0)}${knob(`e,${i},1`, `Deck ${D(i)} mid EQ`, "Mid", EQMIN, 6, 1, 0)}${knob(`e,${i},0`, `Deck ${D(i)} low EQ`, "Low", EQMIN, 6, 1, 0)}${knob(`f,${i}`, `Deck ${D(i)} filter`, "Filter", -1, 1, .02, 0)}</div>
      <button type="button" class="satt-btn mute" data-mute="${i}" aria-pressed="false" aria-label="Mute deck ${D(i)}">Mute</button>
      <div class="satt-fadewrap"><div class="satt-meter" id="${ID("m", i)}" aria-hidden="true"><i></i></div><label class="sr" for="${ID("vol", i)}">Deck ${D(i)} volume</label><input type="range" class="satt-vf" id="${ID("vol", i)}" data-vol="${i}" min="0" max="1" step="0.01" value="${T.vol[i]}" aria-valuetext="${Math.round(T.vol[i] * 100)}%"></div></div>`;
    host.innerHTML = `<div class="satt"><div class="satt-rig">${deck(0)}
      <div class="satt-mixer" role="group" aria-label="Mixer"><div class="satt-strips">${strip(0)}${strip(1)}</div>
        <div class="satt-xf"><label class="sr" for="${T.id}xf">Crossfader</label><div class="satt-xrow"><b aria-hidden="true">A</b><input type="range" class="satt-h" id="${T.id}xf" data-xf min="-1" max="1" step="0.01" value="0" aria-valuetext="center"><b aria-hidden="true">B</b></div>
          <div class="satt-mrow"><button type="button" class="satt-btn" data-a="cut" aria-pressed="false" aria-label="Scratch curve for the crossfader">Scratch</button><button type="button" class="satt-btn" data-a="xc" aria-label="Center the crossfader">Center</button>${knob("m", "Master volume", "Master", 0, 1, .01, T.master)}</div></div></div>
      ${deck(1)}</div>
      <div class="satt-bar"><button type="button" class="satt-btn primary satt-play" data-a="play"><span aria-hidden="true">▶ </span>Play both</button><button type="button" class="satt-btn" data-a="new">New challenge</button>${opts.record ? '<button type="button" class="satt-btn satt-rec" data-a="rec" aria-pressed="false"><span aria-hidden="true">● </span>Record to a new audio track</button>' : ""}</div>
      <p class="satt-stat"></p><p class="satt-live" role="status" aria-live="polite"></p></div>`;
    // knobs: drag up or down, arrow keys / Page Up / Page Down / Home / End, double-click to reset
    function setKnob(el, v) {
      const min = +el.dataset.min, max = +el.dataset.max, st = +el.dataset.step, k = el.dataset.k; v = Math.max(min, Math.min(max, Math.round(v / st) * st)); v = +v.toFixed(3);
      el.setAttribute("aria-valuenow", v); el.setAttribute("aria-valuetext", kText(k, v)); el.firstChild.style.transform = `rotate(${-135 + 270 * (v - min) / (max - min)}deg)`;
      const p = k.split(","); if (p[0] === "e") T.eq[+p[1]][+p[2]] = v; else if (p[0] === "f") T.filt[+p[1]] = v; else T.master = v; mix(); }
    host.querySelectorAll(".satt-knob").forEach(el => setKnob(el, +el.dataset.def));
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
      const kn = e.target.closest(".satt-knob"); if (kn) { e.preventDefault(); try { kn.setPointerCapture(e.pointerId); } catch (x) {} kn.focus(); T.kn = { el: kn, y: e.clientY, v: +kn.getAttribute("aria-valuenow") }; return; }
      const nb = e.target.closest("[data-n]"); if (nb) { e.preventDefault(); nudge(nb, true); return; }
      const el = e.target.closest(".satt-plat"); if (!el) return; e.preventDefault(); const i = +el.dataset.i;
      if (!AC()) return; if (!T.list.length) await loadList(); engine(); if (!T.raf) tick();
      try { el.setPointerCapture(e.pointerId); } catch (x) {} T.grab[i] = { a: ang(el, e), t: performance.now(), rot: (T.pos[i] / 1.8) * 360 }; T.scr[i] = 0; el.classList.add("held"); };
    const onMove = e => { if (T.kn) { const k = T.kn.el; setKnob(k, T.kn.v + (T.kn.y - e.clientY) / 140 * (+k.dataset.max - +k.dataset.min)); return; }
      const el = e.target.closest && e.target.closest(".satt-plat"); if (!el) return; const i = +el.dataset.i, g = T.grab[i]; if (!g) return;
      const a = ang(el, e), now = performance.now(); let da = a - g.a; if (da > 180) da -= 360; if (da < -180) da += 360; const dt = Math.max(.008, (now - g.t) / 1000);
      T.scr[i] = Math.max(-6, Math.min(6, (da / 360 * 1.8) / dt)); g.a = a; g.t = now; g.rot += da; el.style.transform = `rotate(${g.rot % 360}deg)`; };
    const onUp = () => { T.kn = null; T.nudge = [0, 0]; for (let i = 0; i < 2; i++) if (T.grab[i]) { T.grab[i] = null; T.scr[i] = 0; const p = $(`#${T.id}p${i}`); if (p) p.classList.remove("held"); } };
    const onKey = (e, down) => { const kn = down && e.target.closest && e.target.closest(".satt-knob");
      if (kn) { const st = +kn.dataset.step, v = +kn.getAttribute("aria-valuenow"), d = { ArrowUp: st, ArrowRight: st, ArrowDown: -st, ArrowLeft: -st, PageUp: st * 10, PageDown: -st * 10 }[e.key];
        if (d != null) { e.preventDefault(); setKnob(kn, v + d); } else if (e.key === "Home" || e.key === "End") { e.preventDefault(); setKnob(kn, +kn.dataset[e.key === "Home" ? "min" : "max"]); } return; } const b = e.target.closest && e.target.closest("[data-n]"); if (b && (e.key === " " || e.key === "Enter")) { e.preventDefault(); if (!e.repeat) nudge(b, down); } };
    const kd = e => onKey(e, true), ku = e => onKey(e, false);
    const onInput = e => { const t = e.target;
      if (t.classList.contains("satt-f")) setFader(+t.dataset.i, +t.value);
      else if (t.dataset.eq) { const [i, k] = t.dataset.eq.split(",").map(Number); T.eq[i][k] = +t.value; t.setAttribute("aria-valuetext", +t.value <= EQMIN ? "cut (kill)" : `${t.value > 0 ? "+" : ""}${t.value} dB`); mix(); }
      else if (t.dataset.filt != null) { const i = +t.dataset.filt, v = +t.value; T.filt[i] = v; t.setAttribute("aria-valuetext", Math.abs(v) <= .02 ? "off" : v < 0 ? `low-pass ${Math.round(-v * 100)}%` : `high-pass ${Math.round(v * 100)}%`); mix(); }
      else if (t.dataset.vol != null) { const i = +t.dataset.vol; T.vol[i] = +t.value; t.setAttribute("aria-valuetext", Math.round(T.vol[i] * 100) + "%"); mix(); }
      else if (t.dataset.xf != null) { T.xf = +t.value; t.setAttribute("aria-valuetext", Math.abs(T.xf) < .02 ? "center" : `${Math.round(Math.abs(T.xf) * 100)}% toward ${T.xf < 0 ? "A" : "B"}`); mix(); }
      else if (t.dataset.master != null) { T.master = +t.value; t.setAttribute("aria-valuetext", Math.round(T.master * 100) + "%"); mix(); } };
    const onChange = e => { const s = e.target.closest(".satt-src"); if (s) setSrc(+s.dataset.i, s.value); const r = e.target.closest(".satt-sel"); if (r) setRange(+r.dataset.i, +r.value); };
    host.addEventListener("dblclick", e => { const kn = e.target.closest(".satt-knob"); if (kn) setKnob(kn, +kn.dataset.def); });
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
