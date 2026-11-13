
(() => {
  // ---------- Theory engine ----------
  const LET = "CDEFGAB";
  const NAT = [0, 2, 4, 5, 7, 9, 11];
  const MAJ = NAT, MIN = [0, 2, 3, 5, 7, 8, 10];
  const ACC = { "-2": "𝄫", "-1": "♭", "0": "", "1": "♯", "2": "𝄪" };
  const SPOKEN_ACC = { "-2": " double flat", "-1": " flat", "0": "", "1": " sharp", "2": " double sharp" };
  const ACCVAL = { "𝄫": -2, "♭♭": -2, "bb": -2, "♭": -1, "b": -1, "♮": 0, "n": 0, "♯": 1, "#": 1, "𝄪": 2, "♯♯": 2, "##": 2, "x": 2 };
  const pc = n => (((NAT[n.l] + n.a) % 12) + 12) % 12;
  const nName = n => LET[n.l] + ACC[n.a];
  const nSpoken = n => LET[n.l] + SPOKEN_ACC[n.a];
  const key = n => n.l + ":" + n.a;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // Accidental glyphs in the display font render poorly, so wrap them for Noto Music.
  const accHTML = s => esc(s).replace(/([♭♯♮𝄫𝄪])/g, '<span class="acc">$1</span>').replace(/(\d)\u0302/g, '<span class="sd">$1</span>');
  const speak = s => s.replace(/𝄫/g, " double flat").replace(/𝄪/g, " double sharp").replace(/♭/g, " flat").replace(/♯/g, " sharp").replace(/♮/g, " natural");

  function spell(root, deg, semi) {
    const l = (root.l + deg - 1) % 7;
    let d = (((pc(root) + semi - NAT[l]) % 12) + 12) % 12;
    if (d > 6) d -= 12;
    return { l, a: d };
  }
  function degLabel(deg, semi) {
    let d = semi - MAJ[deg - 1];
    if (d > 6) d -= 12; if (d < -6) d += 12;
    return (ACC[d] ?? "") + deg;
  }
  const D = (...s) => s.map((v, i) => [i + 1, v]);

  // ---------- Scales (from the Diatonic Modes and More Modes pages) ----------
  const SCALES = [
    { id: "lydian", name: "Lydian", fam: "dia", parent: "major", tag: "major ♯4", deg: D(0, 2, 4, 6, 7, 9, 11), solf: "FI instead of FA", ks: 1, rel: 4 },
    { id: "ionian", name: "Ionian", aka: "major", fam: "dia", parent: "major", tag: "major (the major scale)", deg: D(0, 2, 4, 5, 7, 9, 11), ks: 0, rel: 1 },
    { id: "mixolydian", name: "Mixolydian", fam: "dia", parent: "major", tag: "major ♭7", deg: D(0, 2, 4, 5, 7, 9, 10), solf: "TE instead of TI", ks: -1, rel: 5 },
    { id: "dorian", name: "Dorian", fam: "dia", parent: "minor", tag: "minor ♯6", deg: D(0, 2, 3, 5, 7, 9, 10), solf: "LA instead of LE", ks: -2, rel: 2 },
    { id: "aeolian", name: "Aeolian", aka: "natural minor", fam: "dia", parent: "minor", tag: "minor (natural minor)", deg: D(0, 2, 3, 5, 7, 8, 10), ks: -3, rel: 6 },
    { id: "phrygian", name: "Phrygian", fam: "dia", parent: "minor", tag: "minor ♭2", deg: D(0, 1, 3, 5, 7, 8, 10), solf: "RA instead of RE", ks: -4, rel: 3 },
    { id: "locrian", name: "Locrian", fam: "loc", parent: "minor", tag: "minor ♭2 ♭5", deg: D(0, 1, 3, 5, 6, 8, 10), solf: "RA and SE instead of RE and SOL", ks: -5, rel: 7 },
    { id: "harmonic", name: "Harmonic minor", fam: "aug2", parent: "minor", tag: "minor ♯7", deg: D(0, 2, 3, 5, 7, 8, 11) },
    { id: "hungarian", name: "Hungarian minor", fam: "aug2", parent: "minor", tag: "minor ♯4 ♯7", deg: D(0, 2, 3, 6, 7, 8, 11) },
    { id: "phrygdom", name: "Phrygian dominant", aka: "Freygish", fam: "aug2", parent: "major", tag: "major ♭2 ♭6 ♭7", deg: D(0, 1, 4, 5, 7, 8, 10) },
    { id: "byzantine", name: "Byzantine", fam: "aug2", parent: "major", tag: "major ♭2 ♭6", deg: D(0, 1, 4, 5, 7, 8, 11) },
    { id: "majpent", name: "Major pentatonic", fam: "pent", tag: "major without 4 and 7", deg: [[1, 0], [2, 2], [3, 4], [5, 7], [6, 9]] },
    { id: "minpent", name: "Minor pentatonic", fam: "pent", tag: "natural minor without 2 and ♭6", deg: [[1, 0], [3, 3], [4, 5], [5, 7], [7, 10]] },
    { id: "blues", name: "Blues scale", fam: "pent", tag: "minor pentatonic + ♯4/♭5", deg: [[1, 0], [3, 3], [4, 5], [4, 6], [5, 7], [7, 10]], alt: [[1, 0], [3, 3], [4, 5], [5, 6], [5, 7], [7, 10]] },
    { id: "wholetone", name: "Whole-tone", fam: "sym", tag: "all whole steps", deg: D(0, 2, 4, 6, 8, 10), pcOnly: true },
    { id: "oct1", name: "Octatonic (W\u2060–\u2060H)", fam: "sym", tag: "whole, half, whole, half… (mode 1)", deg: [[1, 0], [2, 2], [3, 3], [4, 5], [5, 6], [6, 8], [6, 9], [7, 11]], pcOnly: true },
    { id: "oct2", name: "Octatonic (H\u2060–\u2060W)", fam: "sym", tag: "half, whole, half, whole… (mode 2)", deg: [[1, 0], [2, 1], [3, 3], [3, 4], [4, 6], [5, 7], [6, 9], [7, 10]], pcOnly: true },
  ];
  const BY = Object.fromEntries(SCALES.map(s => [s.id, s]));
  const FAMS = { dia: "Diatonic (PADMIL)", loc: "Locrian", pent: "Pentatonic & blues", aug2: "Augmented-second modes", sym: "Symmetrical" };
  const PADMIL = ["phrygian", "aeolian", "dorian", "mixolydian", "ionian", "lydian"];
  const RAISES = ["2̂ (RA → RE)", "6̂ (LE → LA)", "3̂ (ME → MI)", "7̂ (TE → TI)", "4̂ (FA → FI)"];
  SCALES.forEach(s => {
    s.formula = s.deg.map(([d, v]) => degLabel(d, v)).join(" ");
    const semis = s.deg.map(x => x[1]).concat(12);
    s.pattern = semis.slice(1).map((v, i) => {
      const st = v - semis[i];
      return st === 1 ? "H" : st === 2 ? "W" : st === 3 ? (s.deg.length === 7 ? "+2" : "m3") : st + "";
    }).join("–");
    s.full = s.aka ? `${s.name} (${s.aka})` : s.name;
  });

  const LETFIFTHS = [0, 2, 4, -1, 1, 3, 5];
  const majorSig = t => LETFIFTHS[t.l] + 7 * t.a;
  const sigText = n => n === 0 ? "no sharps or flats" : `${Math.abs(n)} ${n > 0 ? "sharp" : "flat"}${Math.abs(n) > 1 ? "s" : ""}`;
  const sigShort = n => n === 0 ? "0" : `${Math.abs(n)}${n > 0 ? "♯" : "♭"}`;
  const OFFSET = { 1: "one sharp more than major (one flat fewer)", 0: "the same as major", "-1": "one flat more than major (one sharp fewer)", "-2": "two flats more than major", "-3": "three flats more than major", "-4": "four flats more than major", "-5": "five flats more than major" };
  const KS_NAME = { "-7": "Cb", "-6": "Gb", "-5": "Db", "-4": "Ab", "-3": "Eb", "-2": "Bb", "-1": "F", "0": "C", "1": "G", "2": "D", "3": "A", "4": "E", "5": "B", "6": "F#", "7": "C#" };
  const SHARP_ORDER = [3, 0, 4, 1, 5, 2, 6], FLAT_ORDER = [6, 2, 5, 1, 4, 0, 3];
  function sigAccs(n) {
    const a = [0, 0, 0, 0, 0, 0, 0];
    if (n > 0) SHARP_ORDER.slice(0, n).forEach(l => a[l] = 1);
    if (n < 0) FLAT_ORDER.slice(0, -n).forEach(l => a[l] = -1);
    return a;
  }

  const TONICS = ["C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B", "Cb"];
  const rootOf = s => ({ l: LET.indexOf(s[0]), a: s[1] === "#" ? 1 : s[1] === "b" ? -1 : 0 });
  const scaleNotes = (t, sc, degs = sc.deg) => degs.map(([d, s]) => Object.assign(spell(t, d, s), { deg: d, semi: s }));

  function parseNotes(text) {
    const re = /([A-Ga-g])(𝄫|𝄪|♭♭|♯♯|bb|##|x|♭|♯|♮|b|#|n)?/g;
    const notes = []; let m;
    while ((m = re.exec(text))) notes.push({ l: LET.indexOf(m[1].toUpperCase()), a: m[2] ? ACCVAL[m[2]] : 0 });
    const left = text.replace(re, "").replace(/[\s,;\-–—\/|]+/g, "");
    return { notes, junk: left };
  }

  // Staff placement: the tonic sits between C4 and B4; each later degree goes up a letter.
  // Steps are diatonic: octave*7 + letter. The upper tonic closes the scale.
  function placeScale(q) {
    const start = 28 + q.tonic.l;
    const out = q.notes.map(n => ({ l: n.l, a: n.a, step: start + n.deg - 1 }));
    out.push({ l: q.tonic.l, a: q.tonic.a, step: start + 7 });
    return out;
  }

  // ---------- Staff (VexFlow) ----------
  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  const GLYPH = { "-2": "bb", "-1": "b", "0": "n", "1": "#", "2": "##" };
  function drawScale(el, q, opts = {}) {
    el._args = [q, opts];
    el.innerHTML = "";
    if (!window.Vex || !Vex.Flow) { el.innerHTML = '<p class="staff-msg">The notation engine didn\'t load. Reload the page.</p>'; return; }
    const VF = Vex.Flow, ink = cssVar("--ink");
    const notes = placeScale(q);
    const ks = opts.keySig ?? null;
    const r = new VF.Renderer(el, VF.Renderer.Backends.SVG);
    const stave = new VF.Stave(4, 20, 1000);
    stave.addClef("treble");
    if (ks !== null) stave.addKeySignature(KS_NAME[ks]);
    const sx = stave.getNoteStartX();
    const W = Math.round(sx + notes.length * 46 + 24), H = 150;
    stave.setWidth(W - 8);
    r.resize(W, H);
    const ctx = r.getContext();
    ctx.setFillStyle(ink); ctx.setStrokeStyle(ink);
    stave.setStyle({ fillStyle: ink, strokeStyle: ink });
    stave.setContext(ctx).draw();
    // Accidentals: shown whenever a note differs from what the key signature (or an earlier note on the same line) implies.
    const base = sigAccs(ks ?? 0), cur = {};
    const sns = notes.map((n, i) => {
      const sn = new VF.StaveNote({ clef: "treble", keys: [LET[n.l].toLowerCase() + "/" + Math.floor(n.step / 7)], duration: "w" });
      const implied = n.step in cur ? cur[n.step] : base[n.l];
      const c = opts.colors && opts.colors[i] ? cssVar(opts.colors[i]) : ink;
      sn.setStyle({ fillStyle: c, strokeStyle: c });
      if (sn.setLedgerLineStyle) sn.setLedgerLineStyle({ strokeStyle: ink, fillStyle: ink });
      if (n.a !== implied) {
        const acc = new VF.Accidental(GLYPH[n.a]);
        acc.setStyle({ fillStyle: c, strokeStyle: c });
        sn.addModifier(acc, 0);
      }
      cur[n.step] = n.a;
      return sn;
    });
    const voice = new VF.Voice({ num_beats: 4 * sns.length, beat_value: 4 }).addTickables(sns);
    new VF.Formatter().joinVoices([voice]).format([voice], stave.getNoteEndX() - stave.getNoteStartX() - 16);
    voice.draw(ctx, stave);
    const svg = el.querySelector("svg");
    if (svg) {
      let vb = `0 0 ${W} ${H}`;
      try { const bb = svg.getBBox(); if (bb.width) vb = `${bb.x - 4} ${bb.y - 8} ${bb.width + 8} ${bb.height + 16}`; } catch (e) {}
      svg.setAttribute("viewBox", vb);
      svg.removeAttribute("width"); svg.removeAttribute("height");
      svg.style.width = "100%"; svg.style.height = "auto";
      svg.setAttribute("role", "img");
      svg.setAttribute("focusable", "false");
      const label = opts.label || (ks !== null
        ? `Treble staff with a key signature of ${sigText(ks)}. Whole notes ascending, with no added accidentals: ${notes.map(n => LET[n.l]).join(", ")}.`
        : `Treble staff, whole notes ascending: ${notes.map(n => nSpoken(n) + " " + Math.floor(n.step / 7)).join(", ")}.`);
      svg.setAttribute("aria-label", label);
    }
  }
  function redrawStaves() { document.querySelectorAll(".staff").forEach(el => el._args && drawScale(el, ...el._args)); }
  try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", redrawStaves); } catch (e) {}
  new MutationObserver(redrawStaves).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });

  // ---------- Piano (synthesized with Web Audio, no sample files) ----------
  let AC = null, bus = null, verb = null;
  function audio() {
    if (AC) { if (AC.state === "suspended") AC.resume(); return AC; }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    AC = new Ctx();
    const comp = AC.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 3;
    comp.connect(AC.destination);
    verb = AC.createConvolver();
    const len = Math.floor(AC.sampleRate * 1.6), ir = AC.createBuffer(2, len, AC.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    verb.buffer = ir;
    const wet = AC.createGain(); wet.gain.value = 0.16;
    verb.connect(wet); wet.connect(comp);
    AC._out = comp;
    return AC;
  }
  function newBus() {
    if (bus) { const old = bus; old.gain.setTargetAtTime(0, AC.currentTime, 0.04); setTimeout(() => old.disconnect(), 400); }
    bus = AC.createGain(); bus.connect(AC._out); bus.connect(verb);
    return bus;
  }
  function pianoNote(out, midi, t0, dur, vel) {
    const f = 440 * Math.pow(2, (midi - 69) / 12);
    const B = 0.00035, decayBase = 3.2 * Math.pow(261.6 / f, 0.55);
    const filt = AC.createBiquadFilter();
    filt.type = "lowpass"; filt.Q.value = 0.4;
    filt.frequency.setValueAtTime(Math.min(f * 9, 9000), t0);
    filt.frequency.exponentialRampToValueAtTime(Math.max(f * 2.2, 300), t0 + 1.2);
    const ng = AC.createGain(); ng.gain.value = vel;
    filt.connect(ng); ng.connect(out);
    const end = t0 + dur;
    for (let n = 1; n <= 9; n++) {
      const fn = n * f * Math.sqrt(1 + B * n * n);
      if (fn > 12000) break;
      const o = AC.createOscillator(), g = AC.createGain();
      o.frequency.value = fn;
      const amp = (n === 1 ? 1 : 0.55 / Math.pow(n, 1.25)) * (n === 2 ? 1.25 : 1);
      const tau = Math.max(0.15, decayBase / Math.pow(n, 0.7));
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(amp, t0 + 0.004);
      g.gain.setTargetAtTime(amp * 0.35, t0 + 0.004, 0.08 + tau * 0.05);
      g.gain.setTargetAtTime(0, t0 + 0.2, tau);
      g.gain.setTargetAtTime(0, end, 0.12);
      o.connect(g); g.connect(filt);
      o.start(t0); o.stop(end + 1);
    }
    const nb = AC.createBuffer(1, Math.floor(AC.sampleRate * 0.03), AC.sampleRate), d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = AC.createBufferSource(), bp = AC.createBiquadFilter(), hg = AC.createGain();
    src.buffer = nb; bp.type = "bandpass"; bp.frequency.value = Math.min(f * 5, 6000); bp.Q.value = 1.2; hg.gain.value = 0.18;
    src.connect(bp); bp.connect(hg); hg.connect(ng); src.start(t0);
  }
  const midiOf = n => 12 * (Math.floor(n.step / 7) + 1) + NAT[n.step % 7] + n.a;
  function playScale(q, how) {
    if (!q || !q.notes || !audio()) return;
    const up = placeScale(q).map(midiOf);
    const seq = how === "updown" ? up.concat(up.slice(0, -1).reverse()) : up;
    const out = newBus(), t = AC.currentTime + 0.05, gap = 0.3;
    seq.forEach((m, i) => pianoNote(out, m, t + i * gap, i === seq.length - 1 ? 1.6 : 0.55, 0.3));
  }
  function autoPlay(q) { if (S.settings.auto !== false && q.notes) playScale(q, "up"); }
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-play]"); if (!b) return;
    playScale(Q[S.mode], b.dataset.play);
  });
  const PLAY_BTNS = `<div class="play-row"><button class="play" data-play="up"><svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M2 1l9 5-9 5z"/></svg>Play scale</button><button class="play" data-play="updown"><svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M1 11h2V8H1zM5 11h2V5H5zM9 11h2V1H9z"/></svg>Up and down</button></div>`;

  // ---------- State ----------
  const DEFAULTS = { fam: { dia: true, loc: true, pent: true, aug2: true, sym: true }, tonics: "all", dbl: false, auto: true };
  let S = { mode: "pitch", settings: JSON.parse(JSON.stringify(DEFAULTS)), right: 0, total: 0, streak: 0, misses: [] };
  try { const saved = JSON.parse(localStorage.getItem("modes-trainer") || "null"); if (saved) S = Object.assign(S, saved, { settings: Object.assign({}, S.settings, saved.settings, { fam: Object.assign({}, DEFAULTS.fam, (saved.settings || {}).fam) }) }); } catch (e) {}
  if (!["spell", "name", "keysig", "concept", "pitch"].includes(S.mode)) S.mode = "spell";
  const save = () => { try { localStorage.setItem("modes-trainer", JSON.stringify({ mode: S.mode, settings: S.settings, right: S.right, total: S.total, streak: S.streak, misses: S.misses.slice(-40) })); } catch (e) {} };
  const Q = { spell: null, name: null, keysig: null, concept: null, pitch: null };
  const isMC = m => m === "concept" || m === "pitch";

  const rnd = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const enabled = () => SCALES.filter(s => S.settings.fam[s.fam]);
  const diatonicPool = () => SCALES.filter(s => s.fam === "dia" || (s.fam === "loc" && S.settings.fam.loc));
  const tonicPool = () => S.settings.tonics === "nat" ? TONICS.filter(t => t.length === 1) : TONICS;
  const okNotes = notes => notes.every(n => Math.abs(n.a) <= (S.settings.dbl ? 2 : 1));

  function makeScaleQ(mode, tonicStr, sc, extra = {}) {
    const tonic = rootOf(tonicStr);
    return Object.assign({ mode, tonicStr, tonic, sc, notes: scaleNotes(tonic, sc), tries: 0, done: false, revealed: false, hinted: false }, extra);
  }
  const qTitle = q => `${nName(q.tonic)} ${q.sc.name}`;
  const qSpoken = q => `${nSpoken(q.tonic)} ${q.sc.name}`;
  const specOf = q => isMC(q.mode) ? { mode: q.mode, c: q.c } : { mode: q.mode, t: q.tonicStr, s: q.sc.id, ty: q.type };
  const sameSpec = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  function fromSpec(sp) {
    if (isMC(sp.mode)) return { mode: sp.mode, c: sp.c, tries: 0, done: false };
    const sc = BY[sp.s]; if (!sc) return null;
    if (sp.mode === "keysig") return makeKeyQ(sp.t, sc, sp.ty);
    return makeScaleQ(sp.mode, sp.t, sc);
  }
  function makeKeyQ(tonicStr, sc, type) {
    const q = makeScaleQ("keysig", tonicStr, sc, { type });
    q.major = majorSig(q.tonic); q.sig = q.major + sc.ks;
    return q;
  }
  function validQ(q) {
    if (!q) return false;
    if (isMC(q.mode)) return true;
    if (!okNotes(q.notes)) return false;
    if (q.mode === "keysig") return Math.abs(q.sig) <= 7 && Math.abs(q.major) <= 7 && (q.sc.fam === "dia" || S.settings.fam.loc);
    return !!S.settings.fam[q.sc.fam];
  }

  function newQuestion(mode) {
    const prev = Q[mode];
    const review = S.misses.filter(m => m.mode === mode && (!prev || !sameSpec(m, specOf(prev))));
    if (review.length && Math.random() < .3) {
      const q = fromSpec(rnd(review));
      if (validQ(q)) { q.review = true; return q; }
    }
    if (isMC(mode)) {
      const make = mode === "pitch" ? makePitchQ : makeConcept;
      for (let i = 0; i < 50; i++) {
        const c = make();
        if (c && (!prev || prev.c.text !== c.text)) return { mode, c, tries: 0, done: false };
      }
      return { mode, c: make(), tries: 0, done: false };
    }
    const pool = mode === "keysig" ? diatonicPool() : enabled();
    const tonics = tonicPool();
    for (let i = 0; i < 300; i++) {
      const sc = rnd(pool), t = rnd(tonics);
      if (prev && prev.sc === sc && prev.tonicStr === t) continue;
      const q = mode === "keysig" ? makeKeyQ(t, sc, Math.random() < .5 ? "sig" : "mode") : makeScaleQ(mode, t, sc);
      if (validQ(q)) return q;
    }
    return mode === "keysig" ? makeKeyQ("D", BY.dorian, "sig") : makeScaleQ(mode, "D", BY.dorian);
  }

  // ---------- Concept questions ----------
  const mc = (text, answer, wrong, explain) => {
    const w = shuffle(wrong.filter(x => x !== answer)).slice(0, 3);
    return { text, choices: shuffle([answer, ...w]), answer, explain };
  };
  const names = list => list.map(s => s.name);
  const FACTS = [
    { fam: "dia", text: "Which mode is left out of the PADMIL acronym because it is so rarely used?", ans: "Locrian", wrong: ["Lydian", "Phrygian", "Mixolydian"], why: "Locrian fits on the far left: lowering 5̂ of Phrygian produces Locrian." },
    { fam: "dia", text: "Lowering 5̂ of C Phrygian (G → G♭) produces which mode?", ans: "C Locrian", wrong: ["C Aeolian", "C Dorian", "C Lydian"], why: "Locrian is Phrygian with SE instead of SOL, with five flats on C." },
    { fam: "dia", text: "PADMIL is ___ in disguise.", ans: "the circle of fifths", wrong: ["the chromatic scale", "the harmonic series", "the whole-tone scale"], why: "Moving right, the flats disappear in reverse order (D♭, A♭, E♭, B♭), then the sharps begin (F♯)." },
    { fam: "dia", text: "Which three PADMIL modes have a minor third above the tonic?", ans: "Phrygian, Aeolian, Dorian", wrong: ["Mixolydian, Ionian, Lydian", "Phrygian, Dorian, Lydian", "Aeolian, Mixolydian, Ionian"], why: "The three on the left are minor; the three on the right are major." },
    { fam: "dia", text: "Viewed as relative modes, the diatonic modes share the same tones but…", ans: "each starts on a different tonic", wrong: ["each changes one note of the key", "each uses only five pitches", "each needs chromatic accidentals"], why: "Shifting which degree of C major is the tonic gives all seven modes with no sharps or flats." },
    { fam: "dia", text: "In real modal music, the key signature…", ans: "is often the tonic's ordinary major or minor signature, with accidentals for the modal degree", wrong: ["always shows the modal key signature", "never needs accidentals", "always has no sharps or flats"], why: "A piece in F♯ Dorian might use the F♯ minor signature with added D♯s for the raised 6th instead of a modal signature." },
    { fam: "dia", text: "When identifying a mode by ear, what is the first step?", ans: "Find the tonic", wrong: ["Count the sharps", "Find the highest note", "Name the first chord"], why: "Find the tonic, decide whether the third is major or minor, then find the degree that differs from major or natural minor." },
    { fam: "dia", text: "Which step in PADMIL order changes the key signature by one accidental?", ans: "Every step", wrong: ["Only the steps between major modes", "Only Dorian → Mixolydian", "None of them"], why: "Each step right raises one degree a half step: one more sharp or one fewer flat." },
    { fam: "pent", text: "Pentatonic modes are typically made entirely of intervals that are…", ans: "larger than half steps", wrong: ["half steps", "augmented seconds", "tritones"], why: "Whole steps and minor thirds, with no half steps." },
    { fam: "pent", text: "Major and minor pentatonic relate to each other like…", ans: "relative major and minor: same notes, different tonic", wrong: ["parallel keys: same tonic, different notes", "a scale and its inversion", "two whole-tone scales"], why: "The black keys of a piano give both, depending on which one is tonic." },
    { fam: "pent", text: "Which keys on a piano form a pentatonic scale?", ans: "the black keys", wrong: ["the white keys from C to G", "every other white key", "the keys of a C major triad"], why: "The five black keys make a pentatonic collection." },
    { fam: "pent", text: "The blues scale is a minor pentatonic scale with which added tone?", ans: "♯4 / ♭5", wrong: ["♭2", "6", "♮7"], why: "In C: C E♭ F F♯ (or G♭) G B♭." },
    { fam: "pent", text: "Outside of strictly pentatonic folk music, a pentatonic melody is usually…", ans: "harmonized with chords that include notes outside the pentatonic set", wrong: ["left unaccompanied", "harmonized only with pentatonic notes", "played only on harps or percussion"], why: "The melody stays pentatonic while the accompanying harmonies add other pitches." },
    { fam: "aug2", text: "In Western common-practice music, which scale is the only one with an augmented second?", ans: "Harmonic minor", wrong: ["Natural minor", "Dorian", "Major"], why: "The +2 falls between 6̂ and 7̂ (LE and TI)." },
    { fam: "aug2", text: "Where is the augmented second in the harmonic minor scale?", ans: "between 6̂ and 7̂ (LE and TI)", wrong: ["between 2̂ and 3̂ (RE and ME)", "between 3̂ and 4̂ (ME and FA)", "between 5̂ and 6̂ (SOL and LE)"], why: "W–H–W–W–H–+2–H." },
    { fam: "aug2", text: "“Freygish” is another name for which scale?", ans: "Phrygian dominant", wrong: ["Byzantine", "Hungarian minor", "Harmonic minor"], why: "Phrygian dominant is major ♭2 ♭6 ♭7." },
    { fam: "aug2", text: "What separates the Byzantine scale from Phrygian dominant?", ans: "Byzantine has ♮7; Phrygian dominant has ♭7", wrong: ["Byzantine has ♭3", "Byzantine has ♯4", "Byzantine has no 5th"], why: "Byzantine is major ♭2 ♭6; Phrygian dominant adds ♭7." },
    { fam: "aug2", text: "How many augmented seconds does the Hungarian minor scale contain?", ans: "2", wrong: ["0", "1", "3"], why: "W–H–+2–H–H–+2–H: one between 3̂ and ♯4̂, one between 6̂ and 7̂." },
    { fam: "sym", text: "How many pitches per octave does the whole-tone scale have?", ans: "6", wrong: ["5", "7", "8"], why: "W–W–W–W–W–W divides the octave into six equal steps." },
    { fam: "sym", text: "How many pitches per octave does the octatonic scale have?", ans: "8", wrong: ["6", "7", "9"], why: "Alternating half and whole steps gives eight pitches." },
    { fam: "sym", text: "How many different whole-tone collections exist before the pitches repeat?", ans: "2", wrong: ["3", "4", "12"], why: "Up a half step gives the other six pitches; up another half step duplicates the first." },
    { fam: "sym", text: "How many different octatonic collections exist before the pitches repeat?", ans: "3", wrong: ["2", "4", "6"], why: "Transposing up three semitones duplicates the original collection." },
    { fam: "sym", text: "Which symmetrical scale has to repeat a letter name?", ans: "Octatonic", wrong: ["Whole-tone", "Major pentatonic", "Hungarian minor"], why: "Eight pitches need eight note names but there are only seven letters." },
    { fam: "sym", text: "Writing a whole-tone scale always leaves…", ans: "a gap: one letter name is skipped", wrong: ["a repeated letter name", "two augmented seconds", "a half step at the top"], why: "Six pitches use only six of the seven letters." },
    { fam: "sym", text: "Octatonic “mode 1” begins with…", ans: "a whole step (W–H–W–H…)", wrong: ["a half step (H–W–H–W…)", "an augmented second", "a minor third"], why: "Mode 2 begins with a half step." },
    { fam: "sym", text: "Because of their symmetry, these scales often have…", ans: "an ambiguous tonal center", wrong: ["a strong leading tone", "exactly seven tones", "a fixed key signature"], why: "Every note has the same surroundings, so none stands out as tonic." },
  ];

  // ---------- Modal pitch questions ----------
  // Degrees and solfège for each scale's alterations against its parent (major or natural minor).
  const SOLF = { 2: { 1: "RA", 2: "RE", 3: "RI" }, 3: { 3: "ME", 4: "MI" }, 4: { 5: "FA", 6: "FI" }, 5: { 6: "SE", 7: "SOL", 8: "SI" }, 6: { 8: "LE", 9: "LA", 10: "LI" }, 7: { 10: "TE", 11: "TI" } };
  const HAT = "\u0302";
  const listAnd = a => a.length === 1 ? a[0] : a.length === 2 ? `${a[0]} and ${a[1]}` : `${a.slice(0, -1).join(", ")}, and ${a[a.length - 1]}`;
  function alterations(s) {
    if (!s.parent || s.pcOnly) return [];
    const par = s.parent === "major" ? MAJ : MIN;
    return s.deg.filter(([d, v]) => par[d - 1] !== v).map(([d, v]) => ({ d, from: par[d - 1], to: v, dir: v > par[d - 1] ? "raised" : "lowered" }));
  }
  function makePitchQ() {
    let pool = SCALES.filter(s => S.settings.fam[s.fam] && alterations(s).length);
    if (!pool.length) pool = SCALES.filter(s => s.fam === "dia" && alterations(s).length);
    const s = rnd(pool), alts = alterations(s), dir = alts[0].dir, same = alts.filter(a => a.dir === dir);
    const other = alts.filter(a => a.dir !== dir);
    const parentName = s.parent === "major" ? "major" : "natural minor";
    const solfLine = alts.map(a => `${a.d}${HAT} ${a.dir} (${SOLF[a.d][a.from]} → ${SOLF[a.d][a.to]})`);
    const explain = `${s.full} is ${s.tag}: compared with ${parentName}, ${listAnd(solfLine)}.`;
    const plural = same.length > 1;
    const combos = size => {
      const out = [], degs = [2, 3, 4, 5, 6, 7];
      const rec = (start, acc) => { if (acc.length === size) { out.push(acc.slice()); return; } for (let i = start; i < degs.length; i++) { acc.push(degs[i]); rec(i + 1, acc); acc.pop(); } };
      rec(0, []); return out;
    };
    const kind = Math.random();
    if (kind < .4) {
      // Which scale degree(s)?
      const fmt = ds => listAnd(ds.map(d => d + HAT));
      const answer = fmt(same.map(a => a.d));
      const wrong = combos(same.length).map(fmt).filter(x => x !== answer);
      return Object.assign(mc(`Compared to a ${parentName} scale, which scale degree${plural ? "s" : ""} of ${s.full} ${plural ? "are" : "is"} ${dir}${other.length ? " (ignore any degrees that move the other way)" : ""}?`, answer, wrong, explain), { show: { t: "C", s: s.id } });
    }
    if (kind < .75) {
      // Which pitch(es), on a real tonic?
      for (let i = 0; i < 60; i++) {
        const t = rnd(tonicPool()), tonic = rootOf(t);
        const scaleN = scaleNotes(tonic, s), parentN = scaleNotes(tonic, { deg: D(...(s.parent === "major" ? MAJ : MIN)) });
        if (!okNotes(scaleN) || !okNotes(parentN)) continue;
        const par = s.parent === "major" ? MAJ : MIN;
        // Options are (degree, direction) pairs: the right ones plus moves of other degrees, either way.
        const opt = (d, dr) => { const n = spell(tonic, d, par[d - 1] + (dr === "raised" ? 1 : -1)); return { d, dr, n, text: `${nName(n)} (not ${nName(parentN[d - 1])})` }; };
        const right = alts.map(a => opt(a.d, a.dir));
        const singles = [];
        [2, 3, 4, 5, 6, 7].forEach(d => ["raised", "lowered"].forEach(dr => { const o = opt(d, dr); if (!right.some(r => r.d === d) && okNotes([o.n])) singles.push(o); }));
        const fmt = os => listAnd(os.slice().sort((x, y) => x.d - y.d).map(o => o.text));
        const answer = fmt(right);
        const wrong = new Set();
        for (let k = 0; k < 200 && wrong.size < 6; k++) {
          // Swap one or more of the right options for wrong ones, keeping the same count.
          const pick = right.map(r => Math.random() < .5 ? r : rnd(singles));
          if (pick.every((o, i) => o === right[i])) pick[Math.floor(Math.random() * pick.length)] = rnd(singles);
          if (new Set(pick.map(o => o.d)).size !== pick.length) continue;
          const f = fmt(pick); if (f !== answer) wrong.add(f);
        }
        if (wrong.size < 3) continue;
        const tn = nName(tonic);
        return Object.assign(mc(`Compared to ${tn} ${parentName}, which pitch${alts.length > 1 ? "es" : ""} of ${tn} ${s.name} ${alts.length > 1 ? "are" : "is"} changed?`, answer, [...wrong], explain), { show: { t, s: s.id } });
      }
    }
    // Which mode has this alteration?
    const sig = alts.map(a => `${a.dir} ${a.d}${HAT}`);
    const desc = listAnd(sig);
    const rivals = SCALES.filter(x => x !== s && x.parent && !x.pcOnly && alterations(x).map(a => a.dir + a.d).join() !== alts.map(a => a.dir + a.d).join());
    const sameParent = rivals.filter(x => x.parent === s.parent);
    return Object.assign(mc(`Which mode is the ${parentName} scale with a ${desc}?`, s.name, names(sameParent.length >= 3 ? sameParent : rivals), explain), { show: { t: "C", s: s.id } });
  }

  function makeConcept() {
    const fam = S.settings.fam, ES = enabled(), pool = ES.length >= 4 ? ES : SCALES;
    const gens = [];
    const add = (w, f) => { for (let i = 0; i < w; i++) gens.push(f); };
    add(3, () => { const s = rnd(ES); return mc(`Which description fits the ${s.full} scale?`, s.tag, pool.filter(x => x !== s).map(x => x.tag), `${s.name}: ${s.tag}. Degrees ${s.formula}.`); });
    add(3, () => { const s = rnd(ES.filter(x => x.id !== "ionian" && x.id !== "aeolian")); if (!s) return null; return mc(`Which scale is ${s.tag}?`, s.name, names(pool.filter(x => x !== s)), `${s.name}: ${s.formula}.`); });
    add(2, () => { const s = rnd(ES); return mc(`Which degrees make up ${s.full}, measured against the major scale?`, s.formula, pool.filter(x => x !== s && x.formula !== s.formula).map(x => x.formula), `${s.name}: ${s.tag}.`); });
    add(2, () => { const s = rnd(ES); return mc(`Which scale has the step pattern ${s.pattern}?`, s.name, names(pool.filter(x => x !== s && x.pattern !== s.pattern)), `${s.name}: ${s.pattern}.`); });
    const solfPool = SCALES.filter(s => s.solf && fam[s.fam]);
    if (solfPool.length) add(2, () => { const s = rnd(solfPool); return mc(`${s.name} sounds like the ${s.parent} scale, but with…`, s.solf, SCALES.filter(x => x.solf && x !== s).map(x => x.solf), `${s.name} is ${s.tag}.`); });
    if (fam.dia) {
      add(2, () => { const i = Math.floor(Math.random() * 5); const a = BY[PADMIL[i]], b = BY[PADMIL[i + 1]]; return mc(`In PADMIL order, which mode comes right after ${a.name}?`, b.name, names(PADMIL.map(id => BY[id]).filter(x => x !== b && x !== a)), `Phrygian → Aeolian → Dorian → Mixolydian → Ionian → Lydian. ${a.name} → ${b.name} raises ${RAISES[i]}.`); });
      add(2, () => { const i = Math.floor(Math.random() * 5); const a = BY[PADMIL[i]], b = BY[PADMIL[i + 1]]; return mc(`Moving from ${a.name} to ${b.name} while keeping the same tonic pitch raises which scale degree?`, RAISES[i], RAISES.concat(["5̂ (SE → SOL)"]), `Each step to the right raises exactly one degree by a half step, which adds one sharp or removes one flat.`); });
      add(2, () => { const s = rnd(diatonicPool()); return mc(`Compared with the major key signature on the same tonic, ${s.name}'s key signature has…`, OFFSET[s.ks], Object.values(OFFSET), `Count along PADMIL from Ionian. ${s.name} is ${s.tag}.`); });
      add(2, () => { const s = rnd(diatonicPool()); const L = LET[s.rel - 1]; return mc(`Play only the white keys from ${L} up to the next ${L}. Which mode is that?`, `${L} ${s.name}`, diatonicPool().filter(x => x !== s).map(x => `${L} ${x.name}`), `${L} is scale degree ${s.rel} of C major, so the C major notes starting on ${L} make ${L} ${s.name}.`); });
      add(1, () => { const maj = Math.random() < .5; const right = diatonicPool().filter(x => (x.parent === "major") === maj); const wrongs = diatonicPool().filter(x => (x.parent === "major") !== maj); const s = rnd(right); return mc(`Which of these modes has a ${maj ? "major" : "minor"} third above its tonic?`, s.name, names(wrongs), `Major-third modes: Lydian, Ionian, Mixolydian. Minor-third modes: Dorian, Aeolian, Phrygian, Locrian.`); });
    }
    const facts = FACTS.filter(f => fam[f.fam]);
    if (facts.length) add(3, () => { const f = rnd(facts); return mc(f.text, f.ans, f.wrong, f.why); });
    for (let i = 0; i < 20; i++) { const c = rnd(gens)(); if (c && c.choices.length >= 2) return c; }
    return mc("Which mode is major ♭7?", "Mixolydian", ["Lydian", "Dorian", "Phrygian"], "Mixolydian: TE instead of TI.");
  }

  // ---------- DOM ----------
  const $ = id => document.getElementById(id);
  const promptEl = $("prompt"), hintBox = $("hintBox"), fb = $("feedback"), ansBox = $("answerBox"), work = $("work");
  const notesInput = $("notesInput");
  const checkBtn = $("checkBtn"), hintBtn = $("hintBtn"), showBtn = $("showBtn"), nextBtn = $("nextBtn");

  function renderScore() { $("scRight").textContent = S.right; $("scTotal").textContent = S.total; $("scStreak").textContent = S.streak; $("scoreText").textContent = `Score: ${S.right} correct out of ${S.total} answered. Streak: ${S.streak}.`; }
  function msg(cls, label, text) { return `<div class="verdict"><span class="pill ${cls}">${label}</span><span>${text}</span></div>`; }

  // Prompt: rebuilt only when the question or mode changes.
  function renderPrompt() {
    const q = Q[S.mode];
    const tag = q.review ? ' <span class="pill warn">review</span>' : "";
    let h = "";
    if (S.mode === "spell") {
      h = `<h2 class="kicker" id="qHead" tabindex="-1">Spell this scale${tag}<span class="sr">: ${esc(qSpoken(q))}</span></h2><div class="big" aria-hidden="true">${accHTML(qTitle(q))}</div><p class="sub">${q.notes.length} different notes</p>`;
    } else if (S.mode === "name") {
      h = `<h2 class="kicker" id="qHead" tabindex="-1">Which scale is this?${tag}</h2><div class="staff" id="promptStaff"></div>${PLAY_BTNS}`;
    } else if (S.mode === "keysig") {
      if (q.type === "sig") h = `<h2 class="kicker" id="qHead" tabindex="-1">Which key signature does this mode use?${tag}<span class="sr"> ${esc(qSpoken(q))}</span></h2><div class="big" aria-hidden="true">${accHTML(qTitle(q))}</div>`;
      else h = `<h2 class="kicker" id="qHead" tabindex="-1">The tonic is ${esc(nSpoken(q.tonic))} and the key signature has ${sigText(q.sig)}. Which mode?${tag}</h2><div class="staff" id="promptStaff"></div>${PLAY_BTNS}`;
    } else {
      h = `<h2 class="kicker" id="qHead" tabindex="-1">${S.mode === "pitch" ? "Modal pitches" : "Concept check"}${tag}</h2><p class="q-text" id="qText">${accHTML(q.c.text)}</p>`;
    }
    promptEl.innerHTML = h;
    if ($("promptStaff")) drawScale($("promptStaff"), q, S.mode === "keysig" ? { keySig: q.sig } : {});
    renderWork();
  }

  // Answer controls for the choice-based modes.
  function choiceBtn(value, inner, q) {
    let cls = "choice", mark = "";
    if (q.done) {
      if (value === q.correctValue) { cls += " right"; mark = `<span class="mark"><span aria-hidden="true">✓</span><span class="sr">correct answer</span></span>`; }
      else if (value === q.chosen) { cls += " wrong"; mark = `<span class="mark"><span aria-hidden="true">✗</span><span class="sr">your answer, incorrect</span></span>`; }
    }
    return `<button class="${cls}" data-v="${esc(value)}"${q.done ? " disabled" : ""}><span>${inner}</span>${mark}</button>`;
  }
  function renderWork() {
    const q = Q[S.mode];
    $("spellIn").hidden = S.mode !== "spell";
    if (S.mode === "spell") { work.innerHTML = ""; return; }
    let h = "";
    if (S.mode === "name") {
      q.correctValue = q.sc.id;
      const groups = Object.keys(FAMS).filter(f => S.settings.fam[f]);
      h = `<div class="choices" role="group" aria-labelledby="qHead">` + groups.map(f =>
        `<div class="choice-group"><span aria-hidden="true">${FAMS[f]}</span><div class="choice-row">${SCALES.filter(s => s.fam === f).map(s => choiceBtn(s.id, esc(s.name), q)).join("")}</div></div>`).join("") + `</div>`;
    } else if (S.mode === "keysig" && q.type === "sig") {
      q.correctValue = String(q.sig);
      const vals = [-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7];
      h = `<div class="choice-row sig" role="group" aria-labelledby="qHead">${vals.map(v => choiceBtn(String(v), `<span aria-hidden="true">${accHTML(sigShort(v))}</span><span class="sr">${sigText(v)}</span>`, q)).join("")}</div>`;
    } else if (S.mode === "keysig") {
      q.correctValue = q.sc.id;
      h = `<div class="choice-row" role="group" aria-labelledby="qHead">${diatonicPool().map(s => choiceBtn(s.id, esc(s.name), q)).join("")}</div>`;
    } else {
      q.correctValue = q.c.answer;
      h = `<div class="choice-row wide" role="group" aria-labelledby="qText">${q.c.choices.map(c => choiceBtn(c, accHTML(c), q)).join("")}</div>`;
    }
    work.innerHTML = h;
  }

  function renderControls() {
    const q = Q[S.mode];
    document.querySelectorAll(".modes [data-mode]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mode === S.mode)));
    const finished = q.done || q.revealed;
    hintBox.hidden = !q.hinted;
    if (q.hinted) hintBox.innerHTML = hintHTML(q);
    checkBtn.hidden = S.mode !== "spell" || finished;
    hintBtn.hidden = isMC(S.mode) || finished || q.hinted;
    showBtn.hidden = !(S.mode === "spell" && q.tries > 0 && !finished);
    nextBtn.textContent = finished ? "Next question" : "Skip";
    nextBtn.classList.toggle("primary", !!finished);
  }

  function hintHTML(q) {
    const s = q.sc;
    if (S.mode === "spell") {
      if (s.pcOnly) return `Step pattern <span class="mono">${s.pattern}</span>, starting on ${nName(q.tonic)}. Any enharmonic spelling is accepted.`;
      const letters = s.deg.length === 7 ? `One letter per degree, counting up from ${nName(q.tonic)}.` : `Use the letters for degrees ${s.deg.map(d => d[0]).join(", ")} above ${nName(q.tonic)}.`;
      return `Formula <span class="mono">${accHTML(s.formula)}</span> (${accHTML(s.tag)}). ${letters}`;
    }
    if (S.mode === "name") {
      const third = q.notes.find(n => n.deg === 3);
      const t = third ? (third.semi === 4 ? "major" : "minor") : null;
      return `This scale has ${q.notes.length} different notes${t ? ` and a ${t} third above the tonic` : ""}. Find the degree that differs from major or natural minor.`;
    }
    if (q.type === "sig") return `Start from ${nName(q.tonic)} major: ${sigText(q.major)}. Then count along PADMIL: ${s.name} is ${OFFSET[s.ks]}.`;
    const diff = q.sig - q.major;
    return `${nName(q.tonic)} major has ${sigText(q.major)}. This signature has ${diff === 0 ? "the same" : `${Math.abs(diff)} ${diff > 0 ? "more sharp" : "more flat"}${Math.abs(diff) > 1 ? "s" : ""} (or ${diff > 0 ? "fewer flats" : "fewer sharps"})`}. Count along PADMIL from Ionian.`;
  }

  // The scale shown in full: staff, playback, and each degree.
  function answerHTML(q, status, extra = "") {
    const s = q.sc;
    const par = s.parent === "major" ? MAJ : s.parent === "minor" ? MIN : null;
    const cols = q.notes.map((n, i) => {
      const st = status ? status[i] : null;
      const ch = par && !s.pcOnly && par[n.deg - 1] !== n.semi;
      const em = st && st.text ? `<em>${esc(st.text)}</em>` : st && st.cls === "ok" ? `<span class="sr">correct</span>` : "";
      return `<div class="deg ${st ? st.cls : ""}${ch ? " char" : ""}"><i>${accHTML(degLabel(n.deg, n.semi))}${ch ? `<span class="sr">, differs from ${s.parent}</span>` : ""}</i><b>${accHTML(nName(n))}</b>${em}</div>`;
    }).join("");
    const hasChar = par && !s.pcOnly && q.notes.some(n => par[n.deg - 1] !== n.semi);
    const sound = s.solf ? ` Sounds like ${s.parent} with ${s.solf}.` : "";
    return `<div class="answer"><div class="answer-head"><h3>${accHTML(qTitle(q))}</h3><span class="legend">${accHTML(s.tag)}</span></div>${PLAY_BTNS}
      <div class="staff" id="ansStaff"></div><div class="degs" style="--n:${q.notes.length}">${cols}</div>
      <p class="legend">Steps: <span class="mono">${s.pattern}</span>.${sound}${hasChar ? ` <span aria-hidden="true">* marks the degrees that differ from ${s.parent}.</span>` : ""}</p>${extra}</div>`;
  }

  function score(q, correct) {
    if (!(window.LiveClass && LiveClass.active)) { if (window.SFX) SFX.play(correct); if (window.SAprogress && q.tries === 0 && !q.revealed) SAprogress.record(__saLabel(S.mode), correct); }
    if (window.LiveClass && LiveClass.active && LiveClass.answered(correct)) return;
    if (q.tries > 0) return;
    S.total++;
    const sp = specOf(q);
    if (correct) { S.right++; S.streak++; S.misses = S.misses.filter(m => !sameSpec(m, sp)); }
    else { S.streak = 0; if (!S.misses.some(m => sameSpec(m, sp))) S.misses.push(sp); }
    save(); renderScore();
  }

  const CHIP_SR = { ok: "correct", enh: "right pitch, wrong letter", no: "not in the scale" };
  const CHIP_MARK = { ok: "✓", enh: "≈", no: "✗" };
  const chip = (cls, text) => `<span class="chip ${cls}"><span aria-hidden="true">${CHIP_MARK[cls]} </span>${accHTML(text)}<span class="sr"> (${CHIP_SR[cls]})</span></span>`;

  // --- Spell it grading ---
  function gradeStrict(target, user) {
    const used = user.map(() => false);
    const status = target.map(t => {
      const i = user.findIndex((u, j) => !used[j] && key(u) === key(t));
      if (i >= 0) { used[i] = true; return { cls: "ok", user: i }; }
      return null;
    });
    target.forEach((t, k) => {
      if (status[k]) return;
      const i = user.findIndex((u, j) => !used[j] && pc(u) === pc(t));
      if (i >= 0) { used[i] = true; status[k] = { cls: "enh", user: i, text: "you: " + nName(user[i]) }; }
      else status[k] = { cls: "miss", text: "missing" };
    });
    const userCls = user.map((u, j) => { const k = status.findIndex(s => s.user === j); return k < 0 ? "no" : status[k].cls; });
    const correct = status.every(s => s.cls === "ok") && user.length === target.length;
    return { status, userCls, correct };
  }
  function gradePc(target, user) {
    const status = target.map(t => { const i = user.findIndex(u => pc(u) === pc(t)); return i >= 0 ? { cls: "ok", user: i } : { cls: "miss", text: "missing" }; });
    const userCls = user.map((u, j) => target.some(t => pc(t) === pc(u)) && user.findIndex(v => pc(v) === pc(u)) === j ? "ok" : "no");
    return { status, userCls, correct: user.length === target.length && userCls.every(c => c === "ok") };
  }

  function checkSpell() {
    const q = Q.spell;
    const { notes: user, junk } = parseNotes(notesInput.value);
    if (junk) { fb.innerHTML = msg("warn", "Can't read", `“${esc(junk)}” isn't a note. Use letters A–G with ♭ ♯ 𝄫 𝄪 (or b # bb x).`); return; }
    if (!user.length) { fb.innerHTML = msg("warn", "Empty", "Enter the notes first, from the tonic up."); return; }
    if (user.length === q.notes.length + 1 && key(user[0]) === key(user[user.length - 1])) user.pop();
    let g = q.sc.pcOnly ? gradePc(q.notes, user) : gradeStrict(q.notes, user), alt = false;
    if (!g.correct && q.sc.alt) { const g2 = gradeStrict(scaleNotes(q.tonic, q.sc, q.sc.alt), user); if (g2.correct) { g = g2; alt = true; } }
    score(q, g.correct); q.tries++;
    if (g.correct) {
      q.done = true; autoPlay(q);
      let note = "Every note spelled right.";
      if (alt) note = "Every note right, with the blue note spelled as ♭5. Both ♯4 and ♭5 are accepted.";
      else if (q.sc.pcOnly) note = "All the right pitches. Symmetrical scales can be spelled more than one way; one spelling is below.";
      fb.innerHTML = msg("good", "Correct", note);
      ansBox.innerHTML = answerHTML(q, q.notes.map(() => ({ cls: "ok" })));
      drawScale($("ansStaff"), q);
    } else {
      const chips = user.map((u, j) => chip(g.userCls[j], nName(u))).join("");
      const missing = g.status.filter(s => s.cls === "miss").length;
      const parts = [];
      if (g.userCls.includes("enh")) parts.push("amber notes are the right pitch on the wrong letter");
      if (g.userCls.includes("no")) parts.push(q.sc.pcOnly ? "red notes aren't in the scale or are repeated" : "red notes aren't in the scale");
      if (missing > 0) parts.push(`${missing} scale tone${missing > 1 ? "s" : ""} missing`);
      if (!parts.length && user.length > q.notes.length) parts.push("a note is doubled");
      fb.innerHTML = msg("bad", "Not yet", parts.join("; ").replace(/^./, c => c.toUpperCase()) + ".") + `<div class="note-list" role="list" aria-label="Your notes">${chips.replace(/<span class="chip/g, '<span role="listitem" class="chip')}</div>`;
      q.lastStatus = g.status;
    }
    renderControls();
    if (q.done) nextBtn.focus();
  }

  function reveal() {
    const q = Q.spell;
    q.revealed = true;
    const status = q.lastStatus || null;
    fb.innerHTML = msg("warn", "Answer", "Study it, then try the next one. This scale will come back for review.");
    ansBox.innerHTML = answerHTML(q, status);
    const colors = status ? status.map(s => s.cls === "ok" ? "--good" : s.cls === "enh" ? "--warn" : "--bad").concat([status[0].cls === "ok" ? "--good" : status[0].cls === "enh" ? "--warn" : "--bad"]) : null;
    drawScale($("ansStaff"), q, { colors });
    autoPlay(q);
    renderControls();
    nextBtn.focus();
  }

  // --- Choice grading (Name it, Key sigs, Concepts) ---
  function choose(value) {
    const q = Q[S.mode];
    if (q.done) return;
    const correct = value === q.correctValue;
    score(q, correct);
    q.tries++; q.done = true; q.chosen = value;
    renderWork();
    let extra = "";
    if (isMC(S.mode)) {
      fb.innerHTML = msg(correct ? "good" : "bad", correct ? "Correct" : "Not quite", correct ? accHTML(q.c.answer) + "." : `The answer is ${accHTML(q.c.answer)}.`);
      if (q.c.show && BY[q.c.show.s]) {
        // Show the scale itself, with the altered degrees starred.
        Object.assign(q, makeScaleQ("pitch", q.c.show.t, BY[q.c.show.s]), { mode: S.mode, c: q.c, done: true, tries: q.tries, chosen: q.chosen, correctValue: q.correctValue, review: q.review });
        ansBox.innerHTML = answerHTML(q, null, `<p class="explain">${accHTML(q.c.explain)}</p>`);
        drawScale($("ansStaff"), q);
        autoPlay(q);
      } else ansBox.innerHTML = `<div class="answer"><p class="explain">${accHTML(q.c.explain)}</p></div>`;
    } else if (S.mode === "name") {
      const picked = BY[value];
      fb.innerHTML = msg(correct ? "good" : "bad", correct ? "Correct" : "Not quite", correct ? `It's ${accHTML(qTitle(q))}.` : `You chose ${esc(picked.name)}; this is ${accHTML(qTitle(q))}.`);
      if (!correct && picked) extra = `<p class="legend">${esc(picked.name)} would be ${accHTML(picked.tag)}: <span class="mono">${accHTML(picked.formula)}</span>.</p>`;
      ansBox.innerHTML = answerHTML(q, null, extra);
      drawScale($("ansStaff"), q);
      autoPlay(q);
    } else {
      const line = `${accHTML(nName(q.tonic))} major has ${sigText(q.major)}; ${esc(q.sc.name)} is ${OFFSET[q.sc.ks]}, so ${accHTML(qTitle(q))} has ${sigText(q.sig)}.`;
      if (q.type === "sig") fb.innerHTML = msg(correct ? "good" : "bad", correct ? "Correct" : "Not quite", correct ? `${accHTML(qTitle(q))} has ${sigText(q.sig)}.` : `You chose ${sigText(+value)}. ${accHTML(qTitle(q))} has ${sigText(q.sig)}.`);
      else fb.innerHTML = msg(correct ? "good" : "bad", correct ? "Correct" : "Not quite", correct ? `It's ${accHTML(qTitle(q))}.` : `You chose ${esc(BY[value].name)}; this is ${accHTML(qTitle(q))}.`);
      ansBox.innerHTML = answerHTML(q, null, `<p class="legend">${line}</p>`);
      drawScale($("ansStaff"), q, { keySig: q.sig });
      autoPlay(q);
    }
    renderControls();
    nextBtn.focus();
  }
  work.addEventListener("click", e => { const b = e.target.closest("[data-v]"); if (b && !b.disabled) choose(b.dataset.v); });

  function clearAnswer() { fb.innerHTML = ""; ansBox.innerHTML = ""; notesInput.value = ""; }
  function next(focus = true) {
    Q[S.mode] = newQuestion(S.mode);
    clearAnswer();
    renderPrompt(); renderControls();
    if (focus) { if (S.mode === "spell") notesInput.focus(); else { const h = $("qHead"); if (h) h.focus(); } }
  }
  function setMode(m) {
    if (S.mode === m) return;
    S.mode = m; save();
    clearAnswer();
    if (!Q[m]) Q[m] = newQuestion(m);
    renderPrompt(); renderControls();
    if (Q[m].done) restoreAnswer();
  }
  // When returning to a mode whose question is already answered, keep the controls but start fresh.
  function restoreAnswer() { Q[S.mode] = newQuestion(S.mode); renderPrompt(); renderControls(); }

  // ---------- Events ----------
  document.querySelectorAll(".modes [data-mode]").forEach(b => b.onclick = () => setMode(b.dataset.mode));
  checkBtn.onclick = checkSpell;
  hintBtn.onclick = () => { Q[S.mode].hinted = true; renderControls(); hintBox.setAttribute("tabindex", "-1"); hintBox.focus(); };
  showBtn.onclick = reveal;
  nextBtn.onclick = () => next(true);
  notesInput.addEventListener("keydown", e => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const q = Q.spell;
    if (q.done || q.revealed) next(true); else checkSpell();
  });

  $("spellPad").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    const notes = parseNotes(notesInput.value).notes;
    if (b.dataset.l) notes.push({ l: +b.dataset.l, a: 0 });
    else if (b.dataset.a !== undefined && notes.length) notes[notes.length - 1].a = +b.dataset.a;
    else if (b.dataset.cmd === "back") notes.pop();
    else if (b.dataset.cmd === "clear") notes.length = 0;
    notesInput.value = notes.map(nName).join(" ");
  });

  // Settings
  function renderSettings() {
    document.querySelectorAll("[data-fam]").forEach(b => b.setAttribute("aria-pressed", String(!!S.settings.fam[b.dataset.fam])));
    document.querySelectorAll("[data-tonics]").forEach(b => b.setAttribute("aria-pressed", String(S.settings.tonics === b.dataset.tonics)));
    document.querySelectorAll("[data-auto]").forEach(b => b.setAttribute("aria-pressed", String((S.settings.auto !== false) === (b.dataset.auto === "1"))));
    document.querySelectorAll("[data-dbl]").forEach(b => b.setAttribute("aria-pressed", String(!!S.settings.dbl === (b.dataset.dbl === "1"))));
  }
  function settingsChanged() {
    save(); renderSettings();
    Object.keys(Q).forEach(m => Q[m] = newQuestion(m));
    clearAnswer(); renderPrompt(); renderControls();
  }
  $("famToggles").onclick = e => {
    const b = e.target.closest("[data-fam]"); if (!b) return;
    const f = b.dataset.fam, on = !S.settings.fam[f];
    if (!on && Object.values(S.settings.fam).filter(Boolean).length === 1) return;
    S.settings.fam[f] = on; settingsChanged();
  };
  $("tonicToggles").onclick = e => { const b = e.target.closest("[data-tonics]"); if (b) { S.settings.tonics = b.dataset.tonics; settingsChanged(); } };
  $("autoToggles").onclick = e => { const b = e.target.closest("[data-auto]"); if (b) { S.settings.auto = b.dataset.auto === "1"; save(); renderSettings(); } };
  $("dblToggles").onclick = e => { const b = e.target.closest("[data-dbl]"); if (b) { S.settings.dbl = b.dataset.dbl === "1"; settingsChanged(); } };
  $("resetBtn").onclick = () => { S.misses = []; save(); $("resetBtn").textContent = "Review list cleared"; };
  let armTimer = null;
  $("scoreReset").onclick = () => {
    const b = $("scoreReset");
    if (!b.classList.contains("armed")) {
      b.classList.add("armed"); b.innerHTML = 'Tap again to reset<span class="sr"> the score</span>';
      armTimer = setTimeout(() => { b.classList.remove("armed"); b.innerHTML = 'Reset<span class="sr"> score</span>'; }, 3000);
      return;
    }
    clearTimeout(armTimer);
    S.right = 0; S.total = 0; S.streak = 0; save(); renderScore();
    b.classList.remove("armed"); b.innerHTML = 'Reset<span class="sr"> score</span>';
  };

  // Reference table: one in the fold-away panel, one in the pop-up.
  const refRows = SCALES.map(s =>
    `<tr><th scope="row">${esc(s.full)}</th><td data-label="Sounds like"><span>${accHTML(s.tag)}</span></td><td class="mono" data-label="Degrees"><span>${accHTML(s.formula)}</span></td><td class="mono" data-label="Steps"><span>${s.pattern}</span></td></tr>`).join("");
  document.querySelectorAll(".ref-slot").forEach(el => el.innerHTML =
    `<table class="ref"><caption class="sr">Formulas, measured against the major scale</caption><thead><tr><th scope="col">Scale</th><th scope="col">Sounds like</th><th scope="col">Degrees</th><th scope="col">Steps</th></tr></thead><tbody>${refRows}</tbody></table>`);
  const dlg = $("formulaDialog");
  let dlgReturn = null;
  $("formulaBtn").onclick = () => {
    dlgReturn = document.activeElement;
    if (dlg.showModal) dlg.showModal(); else { $("formulaPanel").open = true; $("formulaPanel").scrollIntoView(); return; }
    $("formulaClose").focus();
  };
  $("formulaClose").onclick = () => dlg.close();
  dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", () => { if (dlgReturn && dlgReturn.focus) dlgReturn.focus(); });

  Object.keys(Q).forEach(m => Q[m] = newQuestion(m));
  renderSettings(); renderScore(); renderPrompt(); renderControls();

  // ===== SilverApps bridge (added by build/build_trainers.py) =====
  // the app's name tops every question heading (pages built on the harmony engine add it themselves)
  (function () { const tag = () => { const h = document.getElementById("qHead"); if (h && !h.querySelector(".kapp") && __SA_APP && __SA_APP.name) h.insertAdjacentHTML("afterbegin", '<span class="kapp">' + __SA_APP.name.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])) + '</span><span class="ksep" aria-hidden="true"> · </span>'); };
    const w = document.getElementById("work") || document.body; tag(); new MutationObserver(tag).observe(w, { childList: true, subtree: true }); })();
  function __saLabel(m) { const b = document.querySelector(`.modes [data-mode="${m}"] b`); return b ? b.textContent.trim() : m; }
  if (window.SAprogress) SAprogress.init({ id: __SA_APP.id, name: __SA_APP.name, before: ".wrap-aside",
    onReset: () => { S.right = 0; S.total = 0; S.streak = 0; S.misses = []; save(); renderScore(); } });
  if (window.LiveClass) (function () {
    const clone = o => JSON.parse(JSON.stringify(o));
    const relabel = () => { const p = document.querySelector("#feedback .verdict .pill"); if (p) { p.className = "pill warn"; p.textContent = "Answer"; } };
    const tidy = () => document.querySelectorAll("#feedback .verdict span:last-child").forEach(n => { n.innerHTML = n.innerHTML.replace(/\s*(Study it, then try the next one\.\s*)?Th(is|ese) [\w-]+ will come back for review\./, "").trim() || "Here's the answer."; });
    LiveClass.register({
      id: __SA_APP.id, name: __SA_APP.name,
      mount: document.querySelector("nav.modes"),
      card: document.querySelector("main.card"),
      getConfig: () => ({ mode: S.mode, settings: clone(S.settings) }),
      label: cfg => __saLabel(cfg.mode),
      load(cfg) {
        
        const keep = S.misses; S.misses = [];
        S.settings = clone(cfg.settings);
        if (LiveClass.role === "student" && "auto" in S.settings) S.settings.auto = false;
        S.mode = cfg.mode; Q[cfg.mode] = null; Q[cfg.mode] = newQuestion(cfg.mode); S.misses = keep;
        clearAnswer(); renderSettings(); renderPrompt(); renderControls();
      },
      showAnswer() { const q = Q[S.mode]; if (!q || q.done || q.revealed) return; if (S.mode === "spell") reveal(); else { q.tries = 1; choose(q.correctValue); relabel(); } tidy(); }
    });
  })();
})();
