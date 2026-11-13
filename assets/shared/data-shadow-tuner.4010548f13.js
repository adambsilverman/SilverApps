
(() => {
  const $ = id => document.getElementById(id);
  const SHARP = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
  const FLAT  = ['C','D♭','D','E♭','E','F','G♭','G','A♭','A','B♭','B'];

  // Audio and tracking state (declared first so the controls can reference it safely)
  let ac, stream, src, analyser, buf, osc, toneGain, lp, comp, boost, running = false, raf, wake, cmnd;
  const waves = {}, brightWaves = {};
  let prevDb = null, jumpN = 0, jumpTo = null, cur = null, pending = null, pendN = 0, lastHeard = 0, shownCents = 0, lastMidiF = null;

  const S = { vol:.35, timbre:'soft', octave:0, a4:440, gate:-48, tol:5, rel:.2, names:'sharp', speaker:false, ref:true };
  try { Object.assign(S, JSON.parse(localStorage.getItem('shadowTuner') || '{}')); } catch (e) {}
  if (S.aec) { S.speaker = true; delete S.aec; }
  const save = () => { try { localStorage.setItem('shadowTuner', JSON.stringify(S)); } catch (e) {} };

  // ---------- controls ----------
  const bind = (id, key, fmt, parse = Number) => {
    const el = $(id), out = $(id + 'O');
    el.value = S[key];
    const upd = () => { S[key] = parse(el.value); if (out) out.textContent = fmt(S[key]); save(); applyTone(); };
    el.addEventListener('input', upd); upd();
  };
  bind('vol', 'vol', v => Math.round(v * 100) + '%');
  bind('timbre', 'timbre', null, String);
  bind('octave', 'octave');
  bind('a4', 'a4', null, v => Math.min(480, Math.max(400, Number(v) || 440)));
  bind('gate', 'gate', v => v + ' dB');
  bind('tol', 'tol', v => '±' + v + '¢');
  bind('rel', 'rel', v => v.toFixed(2) + ' s');
  bind('names', 'names', null, String);
  const outBtn = $('outBtn');
  const showOut = () => {
    outBtn.setAttribute('aria-pressed', S.speaker);
    outBtn.textContent = S.speaker ? 'Output: Speaker (boosted)' : 'Output: Headphones';
    $('outNote').innerHTML = S.speaker
      ? '<strong>Speaker mode.</strong> The tone is boosted, compressed and brightened so it carries on a phone speaker, and echo cancellation stops the mic from hearing it. Turn your phone volume all the way up. For low instruments, set Tone octave to “One above”: phone speakers can’t play low notes well.'
      : '<strong>Wear headphones.</strong> Without echo cancellation the microphone can hear the reference tone and lock onto it. Switch Output to Speaker to play through the phone.';
  };
  outBtn.addEventListener('click', async () => {
    S.speaker = !S.speaker; save(); showOut();
    if (running) { await stop(); start(); }
  });
  showOut();
  const refBtn = $('refBtn');
  const showRef = () => { refBtn.setAttribute('aria-pressed', S.ref); refBtn.textContent = S.ref ? 'Reference tone on' : 'Reference tone off'; };
  refBtn.addEventListener('click', () => { S.ref = !S.ref; save(); showRef(); applyTone(); });
  showRef();

  // ---------- audio ----------

  function makeWaves() {
    const spec = {
      pure:   [0, 1],
      soft:   [0, 1, .45, .2, .1, .05],
      reed:   [0, 1, .05, .45, .04, .28, .03, .18, .02, .1],
      string: [0, 1, .5, .33, .25, .2, .16, .14, .12, .1],
    };
    // Bright variants for small speakers: lift harmonics 2–6 so the pitch is heard
    // even when the speaker can't reproduce the fundamental.
    const lift = [0, 1, .6, .5, .4, .3, .22];
    for (const k in spec) {
      const re = new Float32Array(spec[k].length), im = new Float32Array(spec[k]);
      waves[k] = ac.createPeriodicWave(re, im);
      const n = Math.max(spec[k].length, lift.length);
      const bi = new Float32Array(n);
      for (let i = 0; i < n; i++) bi[i] = Math.max(spec[k][i] || 0, lift[i] || 0);
      brightWaves[k] = ac.createPeriodicWave(new Float32Array(n), bi);
    }
  }

  async function start() {
    if (!window.isSecureContext && location.protocol !== 'file:') {
      setStatus('Needs https', 'err'); return;
    }
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
      await ac.resume();
      try { if (navigator.audioSession) navigator.audioSession.type = 'play-and-record'; } catch (e) {}
      stream = await navigator.mediaDevices.getUserMedia({ audio: {
        echoCancellation: S.speaker, noiseSuppression: false, autoGainControl: false } });
    } catch (e) {
      setStatus('Mic blocked', 'err'); return;
    }
    if (!Object.keys(waves).length) makeWaves();
    src = ac.createMediaStreamSource(stream);
    analyser = ac.createAnalyser();
    analyser.fftSize = 2048;
    src.connect(analyser);
    buf = new Float32Array(analyser.fftSize);
    cmnd = new Float32Array(analyser.fftSize);

    osc = ac.createOscillator();
    lp = ac.createBiquadFilter(); lp.type = 'lowpass';
    toneGain = ac.createGain(); toneGain.gain.value = 0;
    comp = ac.createDynamicsCompressor();
    comp.knee.value = 6; comp.attack.value = .003; comp.release.value = .12;
    boost = ac.createGain();
    osc.connect(lp).connect(toneGain).connect(comp).connect(boost).connect(ac.destination);
    setOutputChain();
    osc.start();

    running = true;
    $('go').textContent = 'Stop'; $('go').classList.add('on');
    setStatus('Listening', 'live');
    try { wake = await navigator.wakeLock?.request('screen'); } catch (e) {}
    loop();
  }

  async function stop() {
    running = false;
    cancelAnimationFrame(raf);
    try { toneGain.gain.setTargetAtTime(0, ac.currentTime, .02); } catch (e) {}
    try { osc.stop(ac.currentTime + .15); } catch (e) {}
    stream?.getTracks().forEach(t => t.stop());
    try { wake?.release(); } catch (e) {}
    cur = null; pending = null;
    $('go').textContent = 'Start listening'; $('go').classList.remove('on');
    setStatus('Mic off', '');
    showIdle();
  }
  $('go').addEventListener('click', () => running ? stop() : start());
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && running) { try { wake = await navigator.wakeLock?.request('screen'); } catch (e) {} }
  });

  function setStatus(t, cls) { const s = $('status'); s.textContent = t; s.className = 'chip ' + (cls || ''); }

  // ---------- pitch detection (YIN) ----------
  function detect(b, sr) {
    let sum = 0;
    for (let i = 0; i < b.length; i++) sum += b[i] * b[i];
    const db = 20 * Math.log10(Math.sqrt(sum / b.length) + 1e-12);
    if (db < S.gate) return { f: 0, db };
    const W = 1024;
    const tMin = Math.max(2, Math.floor(sr / 2100));
    const tMax = Math.min(b.length - W - 1, Math.floor(sr / 50));
    let run = 0;
    cmnd[0] = 1;
    for (let t = 1; t <= tMax; t++) {
      let s = 0;
      for (let i = 0; i < W; i++) { const d = b[i] - b[i + t]; s += d * d; }
      run += s;
      cmnd[t] = run ? s * t / run : 1;
    }
    let tau = -1, best = tMin;
    for (let t = tMin; t <= tMax; t++) {
      if (cmnd[t] < cmnd[best]) best = t;
      if (tau < 0 && cmnd[t] < 0.12) {
        while (t + 1 <= tMax && cmnd[t + 1] < cmnd[t]) t++;
        tau = t;
      }
    }
    if (tau < 0) { if (cmnd[best] < 0.25) tau = best; else return { f: 0, db }; }
    // octave check: YIN favours long lags, so a nearly-as-deep dip at tau/2 or tau/3 is the real pitch
    for (const k of [3, 2]) {
      const c0 = Math.round(tau / k); if (c0 < tMin + 1) continue;
      let mm = c0; for (let t = Math.max(tMin, c0 - 3); t <= Math.min(tMax - 1, c0 + 3); t++) if (cmnd[t] < cmnd[mm]) mm = t;
      if (cmnd[mm] < 0.18 && cmnd[mm] < cmnd[tau] + 0.05) { tau = mm; break; }
    }
    const a = cmnd[tau - 1], c = cmnd[tau], d2 = cmnd[tau + 1] ?? c;
    const den = a + d2 - 2 * c;
    const shift = den ? (a - d2) / (2 * den) : 0;
    return { f: sr / (tau + Math.max(-1, Math.min(1, shift))), db };
  }

  // ---------- note tracking ----------
  const trace = [];
  const TRACE_MS = 8000;

  const etFreq = m => S.a4 * Math.pow(2, (m - 69) / 12);
  const name = m => (S.names === 'flat' ? FLAT : SHARP)[((m % 12) + 12) % 12];

  function setOutputChain() {
    if (!comp) return;
    if (S.speaker) {
      // Compress hard, then add make-up gain: louder without clipping.
      comp.threshold.value = -24; comp.ratio.value = 12;
      boost.gain.value = 3.2; lp.frequency.value = 9000;
    } else {
      comp.threshold.value = -1; comp.ratio.value = 4;
      boost.gain.value = 1; lp.frequency.value = 4000;
    }
  }

  function applyTone() {
    if (!ac || !osc) return;
    const set = S.speaker ? brightWaves : waves;
    const w = set[S.timbre] || set.soft;
    if (osc._wave !== w) { osc.setPeriodicWave(w); osc._wave = w; }
    const t = ac.currentTime;
    if (cur !== null && S.ref && running) {
      osc.frequency.setTargetAtTime(etFreq(cur) * Math.pow(2, S.octave), t, .004);
      toneGain.gain.setTargetAtTime(S.vol * 0.5, t, .015);
    } else {
      toneGain.gain.setTargetAtTime(0, t, Math.max(.01, S.rel / 4));
    }
  }

  function loop() {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    analyser.getFloatTimeDomainData(buf);
    const { f, db } = detect(buf, ac.sampleRate);
    const now = performance.now();
    $('lvl').textContent = isFinite(db) ? Math.round(db) + ' dB' : '—';

    if (f) {
      let m = 69 + 12 * Math.log2(f / S.a4);
      const fading = prevDb !== null && db < prevDb - 0.3 && db < S.gate + 15;
      if (cur !== null) {
        if (S.ref && S.octave !== 0 && Math.abs(m - (cur + 12 * S.octave)) < 0.6) m -= 12 * S.octave;   // our own tone coming back
        else for (const k of [12, -12, 24, -24, 19, -19]) {
          if (Math.abs(m - (cur + k)) < 0.6) {
            const r = Math.round(m); if (r === jumpTo) jumpN++; else { jumpTo = r; jumpN = 1; }
            if (fading || jumpN < 10) m -= k;   // a real octave leap must hold ~1/6 s
            break;
          }
        }
      }
      let cand = Math.round(m);
      if (cur !== null && Math.abs(m - cur) < 0.6) cand = cur;   // hysteresis at the ±50¢ edge
      if (cand === cur) { pending = null; pendN = 0; }
      else {
        if (cand === pending) pendN++; else { pending = cand; pendN = 1; }
        if (pendN >= (cur === null ? 2 : 3) && !fading) { cur = cand; pending = null; pendN = 0; shownCents = (m - cur) * 100; }
      }
      lastHeard = now;
      lastMidiF = m;
      prevDb = db;
      if (cur !== null) {
        const cents = (m - cur) * 100;
        shownCents += (cents - shownCents) * 0.35;
        trace.push({ t: now, c: Math.max(-60, Math.min(60, cents)) });
        render(f);
        applyTone();
      }
    } else if ((prevDb = db, cur !== null && now - lastHeard > S.rel * 1000)) {
      cur = null; lastMidiF = null;
      applyTone();
      showIdle(true);
    } else {
      trace.push({ t: now, c: null });
    }
    while (trace.length && now - trace[0].t > TRACE_MS) trace.shift();
    drawMeter(cur !== null ? shownCents : null);
    drawTrace(now);
  }

  function stateColor(c) {
    const a = Math.abs(c);
    return a <= S.tol ? cssv('--good') : a <= 20 ? cssv('--warn') : cssv('--bad');
  }

  function render(f) {
    const n = $('note');
    n.classList.remove('idle');
    n.firstChild.nodeValue = name(cur);
    $('oct').textContent = Math.floor(cur / 12) - 1;
    const c = Math.round(shownCents);
    const ce = $('cents');
    ce.firstChild.nodeValue = (c > 0 ? '+' : c < 0 ? '−' : '±') + Math.abs(c);
    ce.style.color = stateColor(shownCents);
    $('fYou').textContent = f.toFixed(1) + ' Hz';
    $('fRef').textContent = (etFreq(cur) * Math.pow(2, S.octave)).toFixed(1) + ' Hz';
  }

  function showIdle(keepFreq) {
    $('note').classList.add('idle');
    $('cents').style.color = '';
    $('cents').firstChild.nodeValue = '±0';
    if (!keepFreq) { $('fYou').textContent = '—'; $('fRef').textContent = '—'; $('lvl').textContent = '—'; }
    drawMeter(null);
  }

  // ---------- drawing ----------
  let cssCache = {}, cssAt = 0;
  function cssv(n) {
    const now = performance.now();
    if (now - cssAt > 1000) { cssCache = {}; cssAt = now; }
    return cssCache[n] ??= getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  }
  function fit(cv) {
    const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return [g, r.width, r.height];
  }

  function drawMeter(c) {
    const [g, w, h] = fit($('meter'));
    g.clearRect(0, 0, w, h);
    const pad = 14, x = v => pad + (v + 50) / 100 * (w - 2 * pad), base = h - 20;
    g.fillStyle = cssv('--band');
    g.fillRect(x(-S.tol), 4, x(S.tol) - x(-S.tol), base - 4);
    g.strokeStyle = cssv('--line'); g.fillStyle = cssv('--muted');
    g.font = '11px ' + cssv('--mono'); g.textAlign = 'center';
    for (let v = -50; v <= 50; v += 5) {
      const major = v % 25 === 0;
      g.lineWidth = v === 0 ? 2 : 1;
      g.strokeStyle = v === 0 ? cssv('--ink') : cssv('--line');
      g.beginPath(); g.moveTo(x(v), base); g.lineTo(x(v), base - (major ? 22 : v % 10 === 0 ? 14 : 8)); g.stroke();
      if (major) g.fillText(v > 0 ? '+' + v : v < 0 ? '−' + -v : '0', x(v), h - 4);
    }
    if (c === null) return;
    const cc = Math.max(-50, Math.min(50, c));
    g.strokeStyle = stateColor(c); g.lineWidth = 3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x(cc), 4); g.lineTo(x(cc), base); g.stroke();
    g.fillStyle = stateColor(c);
    g.beginPath(); g.arc(x(cc), 6, 5, 0, Math.PI * 2); g.fill();
  }

  function drawTrace(now) {
    const [g, w, h] = fit($('trace'));
    g.clearRect(0, 0, w, h);
    const y = c => h / 2 - c / 50 * (h / 2 - 6);
    const x = t => w - (now - t) / TRACE_MS * w;
    g.fillStyle = cssv('--band');
    g.fillRect(0, y(S.tol), w, y(-S.tol) - y(S.tol));
    g.strokeStyle = cssv('--line'); g.lineWidth = 1;
    for (const v of [-50, -25, 25, 50]) { g.beginPath(); g.moveTo(0, y(v)); g.lineTo(w, y(v)); g.stroke(); }
    g.strokeStyle = cssv('--muted'); g.beginPath(); g.moveTo(0, y(0)); g.lineTo(w, y(0)); g.stroke();
    g.fillStyle = cssv('--muted'); g.font = '10px ' + cssv('--mono'); g.textAlign = 'left';
    g.fillText('+25¢', 4, y(25) - 3); g.fillText('−25¢', 4, y(-25) + 11);
    g.lineWidth = 2.5; g.lineJoin = 'round'; g.lineCap = 'round';
    let prev = null;
    for (const p of trace) {
      if (p.c === null) { prev = null; continue; }
      if (prev) {
        g.strokeStyle = stateColor(p.c);
        g.beginPath(); g.moveTo(x(prev.t), y(prev.c)); g.lineTo(x(p.t), y(p.c)); g.stroke();
      }
      prev = p;
    }
  }

  window.addEventListener('resize', () => { drawMeter(null); drawTrace(performance.now()); });
  showIdle();
  drawTrace(performance.now());
})();
