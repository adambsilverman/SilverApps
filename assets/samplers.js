// Sampled keyboards shared by the studio pages: piano (assets/audio/piano), Rhodes and Wurlitzer electric pianos (assets/audio/epiano).
// SAMP.load(ctx, kind) fetches and decodes once per audio context; SAMP.ready(ctx, kind) says whether it can play yet;
// SAMP.note(ctx, kind, midi, t, vel, dest, dur) plays one note and returns { stop(t) } (dur optional: without it the note holds until stop).
(() => {
  const EP = {"wurli":{"s":[[33,-5],[40,-4],[45,-2],[51,-9],[56,-8],[61,4],[66,7],[71,-5],[73,3],[79,-8],[85,6],[92,2]],"h":[[33,-5],[36,-7],[41,-6],[47,-8],[52,-4],[56,-11],[61,-2],[68,0],[73,3],[79,-7],[85,0],[92,0]]},"rhodes":{"s":[[29,0],[35,0],[40,0],[45,0],[50,0],[55,0],[59,0],[62,0],[65,0],[71,0],[76,0],[81,0],[86,0],[91,0],[96,0]],"h":[[29,0],[35,0],[40,0],[45,0],[50,0],[55,0],[59,0],[62,0],[65,0],[71,0],[76,0],[81,0],[86,0],[91,0],[96,0]]}};
  const PIANO = { s: [] }; for (let o = 1; o <= 7; o++) [0, 3, 6, 9].forEach(i => PIANO.s.push([12 + o * 12 + i, 0])); PIANO.s.push([108, 0]);
  const PN = ["C", "Ds", "Fs", "A"];
  const KINDS = {
    piano: { map: PIANO, url: (l, m) => "assets/audio/piano/" + (m === 108 ? "C8" : PN[(m % 12) / 3] + (Math.floor(m / 12) - 1)) + ".mp3", lv: .5 },
    rhodes: { map: EP.rhodes, url: (l, m) => "assets/audio/epiano/rhodes/" + l + m + ".mp3", lv: .44 },
    wurli: { map: EP.wurli, url: (l, m) => "assets/audio/epiano/wurli/" + l + m + ".mp3", lv: .62 },
  };
  const store = C => C.__samp || (C.__samp = {});
  function load(C, kind) {
    const K = KINDS[kind], S = store(C); if (!K || !C) return Promise.resolve();
    if (S[kind]) return S[kind].p;
    const bufs = {}; S[kind] = { bufs, done: false };
    const jobs = []; Object.entries(K.map).forEach(([l, list]) => list.forEach(([m]) => jobs.push(fetch(K.url(l, m)).then(r => { if (!r.ok) throw 0; return r.arrayBuffer(); })
      .then(b => new Promise((res, rej) => C.decodeAudioData(b, res, rej))).then(buf => { bufs[l + m] = buf; }).catch(() => {}))));
    S[kind].p = Promise.all(jobs).then(() => { S[kind].done = true; });
    return S[kind].p;
  }
  const ready = (C, kind) => { const S = C && C.__samp && C.__samp[kind]; return !!(S && S.done && Object.keys(S.bufs).length); };
  function note(C, kind, m, t, vel, dest, dur) {
    const K = KINDS[kind], bufs = C.__samp[kind].bufs, v = Math.max(.03, Math.min(1, vel || .8));
    const layers = Object.keys(K.map), layer = layers.length > 1 && v >= .72 ? "h" : "s";
    let best = null, bd = 99; for (const [sm, tune] of K.map[layer]) { const b = bufs[layer + sm]; if (b && Math.abs(sm - m) < bd) { bd = Math.abs(sm - m); best = [sm, tune, b]; } }
    if (!best) return null;
    const [sm, tune, buf] = best, src = C.createBufferSource(), lp = C.createBiquadFilter(), g = C.createGain(), rate = Math.pow(2, (m - sm) / 12 + tune / 1200);
    src.buffer = buf; src.playbackRate.value = rate;
    lp.type = "lowpass"; lp.Q.value = .4; lp.frequency.value = 1400 + 15000 * v * v;
    src.connect(lp); lp.connect(g); g.connect(dest);
    // the recordings are a few seconds long: past their end, loop the last stretch and keep it fading, so long notes don't stop dead
    const len = buf.duration, tail = len / rate;
    if (kind !== "piano" && len > .8) { src.loop = true; src.loopStart = len - .4; src.loopEnd = len - .1; }
    const lv = K.lv * Math.pow(v, 1.2), at = t + .003;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(lv, at); g.gain.setValueAtTime(lv, t + tail - .3); g.gain.setTargetAtTime(0, t + tail - .3, kind === "piano" ? .5 : 1);
    src.start(t);
    const stop = te => { const s = Math.max(te, at + .01); g.gain.cancelScheduledValues(s); g.gain.setTargetAtTime(0, s, kind === "piano" ? .12 : .08); try { src.stop(s + .6); } catch (e) {} };
    if (dur != null) stop(t + Math.max(dur, .05)); else src.stop(t + tail + 6);
    return { stop };
  }
  window.SAMP = { load, ready, note };
})();
