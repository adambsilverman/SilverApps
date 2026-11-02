/* SilverApps — "thinking music": a looping shaker groove with a suspense bed (heartbeat kick and a slowly opening,
   rising drone) that plays while a question is open. Shaker.watch(isActive) starts the loop and stops it when
   isActive() returns false (checked every 150 ms). Follows the site's Sound toggle (window.SFX.on).
   Everything is synthesized with Web Audio; no files. */
(function () {
  const BPM = 132, SIX = 60 / BPM / 4, AHEAD = 0.12;
  let ctx = null, noise = null, bus = null, run = null, poll = null;
  const ac = () => {
    if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); }
    if (ctx.state === "suspended") ctx.resume();
    if (!noise) { const n = Math.floor(ctx.sampleRate * 0.5); noise = ctx.createBuffer(1, n, ctx.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; }
    return ctx;
  };
  // one shaker stroke: filtered noise; forward strokes are softer and slower to speak than the accented back strokes
  function shake(t, amp, soft) {
    const s = ctx.createBufferSource(); s.buffer = noise; s.playbackRate.value = 0.9 + Math.random() * 0.2;
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 3800;
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 7000 + Math.random() * 1500; bp.Q.value = 0.7;
    const g = ctx.createGain(), a = soft ? 0.022 : 0.006, d = soft ? 0.07 : 0.095;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(amp, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    s.connect(hp).connect(bp).connect(g).connect(run.out);
    s.start(t, Math.random() * 0.3, a + d + 0.02);
  }
  // heartbeat-style kick: a sine that drops in pitch
  function thump(t, amp) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.16);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(amp, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    o.connect(g).connect(run.out); o.start(t); o.stop(t + 0.32);
  }
  // a ticking clock click on the off-beats once the tension builds
  function tick(t, amp) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "square"; o.frequency.value = 2400;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(amp, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    o.connect(g).connect(run.out); o.start(t); o.stop(t + 0.05);
  }
  // drone: two low saws a minor 2nd apart (A and B-flat) under a low-pass that opens over about 24 seconds
  function drone(t0) {
    const lp = ctx.createBiquadFilter(), g = ctx.createGain(), oscs = [];
    lp.type = "lowpass"; lp.Q.value = 6; lp.frequency.setValueAtTime(160, t0); lp.frequency.exponentialRampToValueAtTime(1400, t0 + 24);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.05, t0 + 3);
    [55, 58.27, 110.2].forEach((f, i) => { const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; o.detune.value = i * 4; o.connect(lp); o.start(t0); oscs.push(o); });
    lp.connect(g).connect(run.out);
    return { stop(t) { g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0.0001, t, 0.06); oscs.forEach(o => o.stop(t + 0.5)); } };
  }
  const ACC = [1, 0.32, 0.55, 0.38];   // 16th-note accents within a beat
  function schedule() {
    const now = ctx.currentTime;
    while (run.next < now + AHEAD) {
      const i = run.step, t = run.next, sw = (i % 2) ? SIX * 0.12 : 0;   // a little swing
      const build = Math.min(1, (t - run.t0) / 16);                          // intensity grows over 16 seconds
      shake(t + sw, (0.16 + 0.12 * build) * ACC[i % 4] * (0.9 + Math.random() * 0.2), i % 2 === 1);
      if (i % 4 === 0) thump(t, 0.32 + 0.18 * build);
      if (i % 4 === 1 && build > 0.25) thump(t, 0.12 + 0.08 * build);      // the "dub" of the heartbeat
      if (i % 4 === 2 && build > 0.5) tick(t, 0.03 * build);
      run.step++; run.next += SIX;
    }
  }
  function start() {
    if (run || !(window.SFX ? SFX.on : true)) return;
    const c = ac(); if (!c) return;
    const out = c.createGain(); out.gain.setValueAtTime(0.0001, c.currentTime); out.gain.exponentialRampToValueAtTime(0.55, c.currentTime + 0.4); out.connect(c.destination);
    run = { out, t0: c.currentTime + 0.05, next: c.currentTime + 0.05, step: 0 };
    run.drone = drone(run.t0);
    run.timer = setInterval(schedule, 40); schedule();
  }
  function stop() {
    if (!run) return; const r = run; run = null; clearInterval(r.timer);
    const t = ctx.currentTime; r.out.gain.cancelScheduledValues(t); r.out.gain.setTargetAtTime(0.0001, t, 0.08); r.drone.stop(t + 0.3);
    setTimeout(() => r.out.disconnect(), 800);
  }
  // play while isActive() stays true; a new watch replaces the old one
  function watch(isActive) {
    clearInterval(poll); stop();
    let first = true;
    poll = setInterval(() => {
      const on = isActive() && !document.hidden && (window.SFX ? SFX.on : true);
      if (on && first) { first = false; start(); }
      else if (!on) { clearInterval(poll); stop(); }
    }, 150);
  }
  // create and unlock the audio context on the first tap or key press, so the loop can start when a question appears
  ["pointerdown", "keydown"].forEach(ev => document.addEventListener(ev, () => { if (window.SFX ? SFX.on : true) ac(); }, { capture: true, passive: true }));
  window.Shaker = { watch, start, stop, get playing() { return !!run; }, get _ctx() { return ctx; }, get _out() { return run && run.out; } };
})();
