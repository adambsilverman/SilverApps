
(() => {
  // ---------- Theory engine ----------
  const LET = "CDEFGAB";
  const NAT = [0, 2, 4, 5, 7, 9, 11];
  const ACC = { "-2": "𝄫", "-1": "♭", "0": "", "1": "♯", "2": "𝄪" };
  const pc = n => (((NAT[n.l] + n.a) % 12) + 12) % 12;
  const nName = n => LET[n.l] + ACC[n.a];
  const SPOKEN_ACC = { "-2": " double flat", "-1": " flat", "0": "", "1": " sharp", "2": " double sharp" };
  const nSpoken = n => LET[n.l] + SPOKEN_ACC[n.a];
  const speakSym = s => s.replace(/𝄫/g, " double flat ").replace(/𝄪/g, " double sharp ").replace(/♭/g, " flat ").replace(/♯/g, " sharp ")
    .replace(/mΔ/g, " minor major ").replace(/Δ/g, " major ").replace(/ø/g, " half-diminished ").replace(/°/g, " diminished ").replace(/\+/g, " augmented ").replace(/^([A-G](?: \w+ )?)m/, "$1 minor ")
    .replace(/[(),\/]/g, " ").replace(/\s+/g, " ").trim();
  const key = n => n.l + ":" + n.a;

  function spell(root, deg, semi) {
    const l = (root.l + deg - 1) % 7;
    let d = (((pc(root) + semi - NAT[l]) % 12) + 12) % 12;
    if (d > 6) d -= 12;
    return { l, a: d };
  }
  const NATSEMI = { 1: 0, 3: 4, 5: 7, 7: 11, 9: 2, 11: 5, 13: 9 };
  function degLabel(deg, semi) {
    let d = semi - NATSEMI[deg];
    if (d > 6) d -= 12; if (d < -6) d += 12;
    return ({ "-2": "𝄫", "-1": "♭", "0": "", "1": "♯", "2": "𝄪" }[d] ?? (d < 0 ? "♭".repeat(-d) : "♯".repeat(d))) + deg;
  }

  const QUAL = { maj: [4, 11], dom: [4, 10], min: [3, 10], mmaj: [3, 11], dim: [3, 9] };
  const ALT = { "b5": [5, 6], "#5": [5, 8], "b9": [9, 1], "#9": [9, 3], "#11": [11, 6], "b13": [13, 8] };
  const ACCVAL = { "𝄫": -2, "♭♭": -2, "bb": -2, "♭": -1, "b": -1, "♮": 0, "n": 0, "♯": 1, "#": 1, "𝄪": 2, "♯♯": 2, "##": 2, "x": 2 };

  function parseSuffix(raw) {
    let t = raw.replace(/♭/g, "b").replace(/♯/g, "#").replace(/[−–—]/g, "-").replace(/Δ/g, "maj").replace(/[()\[\]\s,\/]/g, "");
    t = t.replace(/^ø(13|11|9|7)?/, (m, n) => "m" + (n || "7") + "b5");
    t = t.replace(/^(aug|\+)(maj|Maj|ma|M)(13|11|9|7)/, (m, a, q, n) => "maj" + n + "#5");
    t = t.replace(/^(aug|\+)(13|11|9|7)/, (m, a, n) => n + "#5");
    t = t.replace(/^(dim|°|º|o)(?=\d)/, "dim");
    let qual, m;
    if ((m = t.match(/^dim(?=\d)/))) qual = "dim";
    else if ((m = t.match(/^(min|mi|m|-)(maj|ma|M)(?=\d)/))) qual = "mmaj";
    else if ((m = t.match(/^(maj|Maj|MAJ|ma|Ma|M)(?=\d)/))) qual = "maj";
    else if ((m = t.match(/^(min|mi|m|-)(?=\d)/))) qual = "min";
    else if (/^\d/.test(t)) { qual = "dom"; m = [""]; }
    else if (t === "" || /^(maj|ma|M|min|mi|m|-|\+|aug|dim|°|o)$/.test(t)) return { error: "This drill uses 7th chords and up. Add a 7, 9, 11 or 13." };
    else return { error: `Couldn't read “${t}” after the root.` };
    t = t.slice(m[0].length);
    const e = t.match(/^(13|11|9|7)/);
    if (!e) return { error: /^6/.test(t) ? "6 chords aren't part of this drill. Try a 7, 9, 11 or 13." : "Add the chord's highest number: 7, 9, 11 or 13." };
    const ext = +e[1];
    t = t.slice(e[1].length).replace(/\+(?=(13|11|9|5))/g, "#").replace(/-(?=(13|11|9|5))/g, "b");
    const alts = [];
    while (t.length) {
      const a = t.match(/^(b|#)(13|11|9|5)/);
      if (!a) return { error: `Couldn't read “${t}”. Alterations look like ♭9, ♯11 or ♭13.` };
      if (!ALT[a[0]]) return { error: `${a[0].replace("b", "♭").replace("#", "♯")} isn't one of the alterations used here (♭5 ♯5 ♭9 ♯9 ♯11 ♭13).` };
      alts.push(a[0]); t = t.slice(a[0].length);
    }
    const tones = { 1: 0, 3: QUAL[qual][0], 5: qual === "dim" ? 6 : 7, 7: QUAL[qual][1] };
    if (ext >= 9) tones[9] = 2;
    if (ext >= 11) tones[11] = 5;
    if (ext >= 13) tones[13] = 9;
    for (const a of alts) { const [d, s] = ALT[a]; tones[d] = s; }
    // Stacked thirds: an 11th (natural or altered) brings the 9th; a 13th brings the 9th and 11th.
    if (tones[11] !== undefined || tones[13] !== undefined) { if (tones[9] === undefined) tones[9] = 2; }
    if (tones[13] !== undefined && tones[11] === undefined) tones[11] = 5;
    return { tones: Object.keys(tones).map(Number).sort((x, y) => x - y).map(d => [d, tones[d]]) };
  }

  function parseSymbol(str) {
    const s = str.trim();
    const m = s.match(/^([A-Ga-g])(𝄫|𝄪|♭♭|♯♯|bb|##|x|♭|♯|b|#)?/);
    if (!m) return { error: "Start with the root, like C, B♭ or F♯." };
    const root = { l: LET.indexOf(m[1].toUpperCase()), a: m[2] ? ACCVAL[m[2]] : 0 };
    const r = parseSuffix(s.slice(m[0].length));
    if (r.error) return r;
    return { root, tones: r.tones };
  }

  const chordNotes = (root, tones) => tones.map(([d, s]) => Object.assign(spell(root, d, s), { deg: d, semi: s }));

  function parseNotes(text) {
    const re = /([A-Ga-g])(𝄫|𝄪|♭♭|♯♯|bb|##|x|♭|♯|♮|b|#|n)?/g;
    const notes = []; let m;
    while ((m = re.exec(text))) notes.push({ l: LET.indexOf(m[1].toUpperCase()), a: m[2] ? ACCVAL[m[2]] : 0 });
    const left = text.replace(re, "").replace(/[\s,;\-–—\/|]+/g, "");
    return { notes, junk: left };
  }

  // ---------- Chord pool ----------
  const CHORDS = [
    ["maj7", "7"], ["7", "7"], ["m7", "7"], ["m7b5", "7"], ["m(maj7)", "7"],
    ["maj9", "9"], ["9", "9"], ["m9", "9"], ["m9b5", "9"], ["m(maj9)", "9"],
    ["m11", "11"], ["m11b5", "11"],
    ["maj13", "13"], ["13", "13"], ["m13", "13"],
    ["7(b9)", "alt"], ["7(#9)", "alt"], ["7(b5)", "alt"], ["7(#5)", "alt"], ["7(#5,#9)", "alt"],
    ["7(b9,#11,b13)", "alt"], ["7(b9,#11)", "alt"], ["9(#11)", "alt"], ["9(#5)", "alt"],
    ["13(b9)", "alt"], ["13(#9)", "alt"], ["13(#11)", "alt"],
    ["maj9(#11)", "alt"], ["maj13(#11)", "alt"], ["maj7(#5)", "alt"],
    ["m13(b9,#11)", "alt"],
  ];
  const ROOTS = {
    common: ["C", "Db", "D", "Eb", "E", "F", "F#", "Gb", "G", "Ab", "A", "Bb", "B"],
    all: ["C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B", "Cb"],
  };
  const rootOf = s => ({ l: LET.indexOf(s[0]), a: s[1] === "#" ? 1 : s[1] === "b" ? -1 : 0 });

  // ---------- Display helpers ----------
  const prettyAcc = s => s.replace(/m\(maj(\d+)\)/, "mΔ$1").replace(/maj/g, "Δ").replace(/^dim/, "°").replace(/b(?=\d)/g, "♭").replace(/#/g, "♯").replace(/,/g, "/");
  const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function symText(q) { return nName(q.root) + prettyAcc(q.suffix); }
  function symHTML(q, cls = "") {
    let base = q.suffix, alts = null;
    const m = q.suffix.match(/^(.*?)\(([^)]*[b#][^)]*)\)$/);
    if (m) { base = m[1]; alts = m[2].split(","); }
    let h = `<span class="sym ${cls}" role="img" aria-label="${esc(speakSym(symText(q)))}"><span>${nName(q.root)}</span><span class="sym-q">${prettyAcc(base)}</span>`;
    if (alts) {
      h += `<span class="sym-alts"><span class="stack one"><span>(${alts.map(prettyAcc).join("/")})</span></span></span>`;
    }
    return h.replace(/(<span[^>]*>)|([♭♯𝄫𝄪])/gu, (m, tag, a) => tag || `<span class="sym-acc">${a}</span>`) + "</span>";
  }

  // ---------- Staff (VexFlow) ----------
  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  // Grand-staff voicing: the root (plus sometimes the 5th or 7th) on the bass staff,
  // the remaining tones stacked in thirds on the treble staff. Steps are diatonic: octave*7 + letter.
  function voicing(q) {
    const root = q.notes[0];
    let rs = 14 + root.l; if (rs < 16) rs += 7;            // root between E2 and D3
    const inBass = n => q.bass.includes(n.deg);
    const placed = q.notes.map(n => inBass(n) ? { staff: "bass", step: rs + n.deg - 1 } : null);
    const maxBass = Math.max(...placed.filter(Boolean).map(p => p.step));
    const tre = q.notes.map((n, i) => [n, i]).filter(([n]) => !inBass(n));
    if (tre.length) {
      const first = tre[0][0].deg, last = tre[tre.length - 1][0].deg;
      let base = rs + first - 1;
      while (base < 27 || base <= maxBass) base += 7;      // at or above B3, clear of the bass notes
      if (base + (last - first) > 43 && base - 7 >= 24 && base - 7 > maxBass) base -= 7;
      tre.forEach(([n, i]) => { placed[i] = { staff: "treble", step: base + (n.deg - first) }; });
    }
    return placed;
  }

  function drawStaff(el, q, colors) {
    el._args = [q, colors];
    el.innerHTML = "";
    if (!window.Vex || !Vex.Flow) { el.innerHTML = '<p class="staff-msg">The notation engine didn\'t load. Check your connection and reload the page.</p>'; return; }
    const VF = Vex.Flow, W = 240, H = 240, X = 28;
    const ink = cssVar("--ink");
    const r = new VF.Renderer(el, VF.Renderer.Backends.SVG);
    r.resize(W, H);
    const ctx = r.getContext();
    ctx.setFillStyle(ink); ctx.setStrokeStyle(ink);
    const ts = new VF.Stave(X, 10, W - X - 8), bs = new VF.Stave(X, 110, W - X - 8);
    ts.addClef("treble"); bs.addClef("bass");
    const placed = voicing(q);
    const all = q.notes.map((_, i) => i);
    const GLYPH = { "-2": "accidentalDoubleFlat", "-1": "accidentalFlat", "1": "accidentalSharp", "2": "accidentalDoubleSharp" };
    const metric = code => { const m = new VF.Glyph(code, 39).getMetrics(); return { x0: 0, x1: m.width }; };

    // Accidental columns by engraving convention: the highest accidental sits nearest the chord,
    // then the lowest, then the next highest, and so on from the outside in. Each takes the
    // column closest to the notes where nothing within a 6th of it already sits; accidentals
    // a 7th or more apart may share a column.
    function layoutAccidentals(idx) {
      const accs = idx.filter(i => q.notes[i].a !== 0).map(i => ({ i, step: placed[i].step, code: GLYPH[q.notes[i].a] }))
        .sort((a, b) => b.step - a.step);
      const order = [];
      for (let lo = 0, hi = accs.length - 1, top = true; lo <= hi; top = !top) order.push(top ? accs[lo++] : accs[hi--]);
      const cols = [];
      order.forEach(a => {
        let c = 0;
        while (cols[c] && cols[c].some(b => Math.abs(b.step - a.step) < 6)) c++;
        (cols[c] = cols[c] || []).push(a); a.col = c;
      });
      const colW = cols.map(col => Math.max(...col.map(a => { const m = metric(a.code); return m.x1 - m.x0; })));
      const width = colW.reduce((s, w) => s + w + 2, 0);
      return { accs, colW, width };
    }
    const groups = {
      treble: all.filter(i => placed[i].staff === "treble"),
      bass: all.filter(i => placed[i].staff === "bass"),
    };
    const lay = { treble: layoutAccidentals(groups.treble), bass: layoutAccidentals(groups.bass) };

    const sx = Math.max(ts.getNoteStartX(), bs.getNoteStartX()) + Math.max(lay.treble.width, lay.bass.width) + 10;
    [ts, bs].forEach(s => { s.setNoteStartX(sx); s.setStyle({ fillStyle: ink, strokeStyle: ink }); s.setContext(ctx).draw(); });
    const T = VF.StaveConnector.type;
    [T.BRACE, T.SINGLE_LEFT, T.SINGLE_RIGHT].forEach(type => { const c = new VF.StaveConnector(ts, bs); c.setType(type); c.setContext(ctx).draw(); });

    const mk = (clef, idx, stave) => {
      const sn = new VF.StaveNote({ clef, keys: idx.map(i => LET[placed[i].step % 7].toLowerCase() + "/" + Math.floor(placed[i].step / 7)), duration: "w" });
      sn.setStave(stave);
      sn.setStyle({ fillStyle: ink, strokeStyle: ink });
      if (sn.setLedgerLineStyle) sn.setLedgerLineStyle({ strokeStyle: ink, fillStyle: ink });
      idx.forEach((i, k) => {
        const c = colors && colors[i] ? cssVar(colors[i]) : ink;
        if (c !== ink) sn.setKeyStyle(k, { fillStyle: c, strokeStyle: c });
      });
      return { sn, voice: new VF.Voice({ num_beats: 4, beat_value: 4 }).addTickables([sn]) };
    };
    const tn = mk("treble", groups.treble, ts), bn = mk("bass", groups.bass, bs);
    new VF.Formatter().format([tn.voice, bn.voice], 60);
    tn.voice.draw(ctx, ts); bn.voice.draw(ctx, bs);

    [["treble", tn.sn], ["bass", bn.sn]].forEach(([staff, sn]) => {
      const { accs, colW } = lay[staff], idx = groups[staff], ys = sn.getYs();
      const right = [sn.getNoteHeadBeginX() - 3];
      for (let c = 1; c < colW.length; c++) right[c] = right[c - 1] - colW[c - 1] - 2;
      accs.forEach(a => {
        const m = metric(a.code), k = idx.indexOf(a.i);
        const c = colors && colors[a.i] ? cssVar(colors[a.i]) : ink;
        ctx.setFillStyle(c); ctx.setStrokeStyle(c);
        VF.Glyph.renderGlyph(ctx, right[a.col] - m.x1, ys[k], 39, a.code);
      });
      ctx.setFillStyle(ink); ctx.setStrokeStyle(ink);
    });
    const svg = el.querySelector("svg");
    if (svg) {
      let vb = `0 0 ${W} ${H}`;
      try { const bb = svg.getBBox(); if (bb.width) vb = `${bb.x - 4} ${bb.y - 8} ${bb.width + 8} ${bb.height + 16}`; } catch (e) {}
      svg.setAttribute("viewBox", vb);
      svg.removeAttribute("width"); svg.removeAttribute("height");
      svg.style.width = "100%"; svg.style.height = "auto";
      svg.setAttribute("role", "img");
      const spoken = st => groups[st].map(i => nSpoken(q.notes[i]) + " " + Math.floor(placed[i].step / 7)).join(", ");
      svg.setAttribute("aria-label", `Grand staff, whole notes. Bass clef, low to high: ${spoken("bass")}. Treble clef, low to high: ${spoken("treble")}.`);
    }
  }
  function redrawStaves() { document.querySelectorAll(".staff").forEach(el => el._args && drawStaff(el, ...el._args)); }
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
    // Small room: a short decaying-noise impulse response.
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
      g.gain.setTargetAtTime(amp * 0.35, t0 + 0.004, 0.08 + tau * 0.05); // quick initial drop
      g.gain.setTargetAtTime(0, t0 + 0.2, tau);                          // long sustain decay
      g.gain.setTargetAtTime(0, end, 0.12);                             // damper
      o.connect(g); g.connect(filt);
      o.start(t0); o.stop(end + 1);
    }
    // Hammer: a 25 ms burst of filtered noise.
    const nb = AC.createBuffer(1, Math.floor(AC.sampleRate * 0.03), AC.sampleRate), d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = AC.createBufferSource(), bp = AC.createBiquadFilter(), hg = AC.createGain();
    src.buffer = nb; bp.type = "bandpass"; bp.frequency.value = Math.min(f * 5, 6000); bp.Q.value = 1.2; hg.gain.value = 0.18;
    src.connect(bp); bp.connect(hg); hg.connect(ng); src.start(t0);
  }
  function chordMidis(q) {
    return voicing(q).map((p, i) => 12 * (Math.floor(p.step / 7) + 1) + NAT[p.step % 7] + q.notes[i].a).sort((a, b) => a - b);
  }
  function playChord(q, mode) {
    if (!audio()) return;
    const out = newBus(), t = AC.currentTime + 0.03, ms = chordMidis(q);
    const vel = 0.32 / Math.sqrt(ms.length);
    ms.forEach((m, i) => {
      const start = mode === "arp" ? t + i * 0.16 : t + i * 0.008;
      pianoNote(out, m, start, mode === "arp" ? 3.2 - i * 0.1 : 2.6, vel * (m < 48 ? 1.15 : 1));
    });
  }
  function autoPlay(q) { if (S.settings.auto !== false) playChord(q, "chord"); }
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-play]"); if (!b) return;
    playChord(Q[S.mode], b.dataset.play);
  });

  // ---------- State ----------
  const DEFAULTS = { fam: { "7": false, "9": true, "11": true, "13": true, alt: true }, roots: "common", dbl: true, auto: true };
  let S = { mode: "spell", settings: JSON.parse(JSON.stringify(DEFAULTS)), right: 0, total: 0, streak: 0, misses: [] };
  try { const saved = JSON.parse(localStorage.getItem("tension-trainer") || "null"); if (saved) S = Object.assign(S, saved, { settings: Object.assign({}, S.settings, saved.settings, { fam: Object.assign({}, DEFAULTS.fam, (saved.settings || {}).fam) }) }); } catch (e) {}
  const save = () => { try { localStorage.setItem("tension-trainer", JSON.stringify({ mode: S.mode, settings: S.settings, right: S.right, total: S.total, streak: S.streak, misses: S.misses.slice(-30) })); } catch (e) {} };
  const Q = { spell: null, name: null };

  function makeQ(rootStr, suffix, bass) {
    const root = rootOf(rootStr);
    const notes = chordNotes(root, parseSuffix(suffix).tones);
    return { rootStr, root, suffix, notes, bass: Array.isArray(bass) ? bass : pickClef(), tries: 0, done: false, revealed: false, hinted: false };
  }
  function okNotes(notes) { return notes.every(n => Math.abs(n.a) <= 2 && (S.settings.dbl || Math.abs(n.a) < 2)); }
  // Bass-staff voicing for this question: root alone, root + 5th, root + 7th, or root + 5th + 7th.
  function pickClef() { const v = [[1], [1, 5], [1, 7], [1, 5, 7]]; return v[Math.floor(Math.random() * v.length)]; }

  function newQuestion(mode) {
    const prev = Q[mode];
    const review = S.misses.filter(m => m.mode === mode && (!prev || m.root !== prev.rootStr || m.suffix !== prev.suffix));
    if (review.length && Math.random() < .35) {
      const m = review[Math.floor(Math.random() * review.length)];
      const q = makeQ(m.root, m.suffix, pickClef());
      if (okNotes(q.notes)) { q.review = true; return q; }
    }
    const pool = CHORDS.filter(c => S.settings.fam[c[1]]);
    const roots = ROOTS[S.settings.roots];
    for (let i = 0; i < 200; i++) {
      const c = pool[Math.floor(Math.random() * pool.length)];
      const r = roots[Math.floor(Math.random() * roots.length)];
      if (prev && prev.suffix === c[0] && prev.rootStr === r) continue;
      const q = makeQ(r, c[0], pickClef());
      if (okNotes(q.notes)) return q;
    }
    return makeQ("C", "9", "treble");
  }

  // ---------- DOM ----------
  const $ = id => document.getElementById(id);
  const promptEl = $("prompt"), hintBox = $("hintBox"), fb = $("feedback");
  const notesInput = $("notesInput"), symInput = $("symInput");
  const checkBtn = $("checkBtn"), hintBtn = $("hintBtn"), showBtn = $("showBtn"), nextBtn = $("nextBtn");

  function renderScore() { $("scRight").textContent = S.right; $("scTotal").textContent = S.total; $("scStreak").textContent = S.streak; $("scoreText").textContent = `Score: ${S.right} correct out of ${S.total} answered. Streak: ${S.streak}.`; }

  function render() {
    const q = Q[S.mode];
    $("tabSpell").setAttribute("aria-pressed", S.mode === "spell");
    $("tabName").setAttribute("aria-pressed", S.mode === "name");
    $("spellIn").hidden = S.mode !== "spell";
    $("nameIn").hidden = S.mode !== "name";
    const tag = q.review ? '<span class="pill warn">review</span>' : "";
    if (S.mode === "spell") {
      promptEl.innerHTML = `<div class="kicker">Spell this chord ${tag}</div>${symHTML(q, "sym-big")}`;
    } else {
      promptEl.innerHTML = `<div class="kicker">Name this root-position chord ${tag}</div><div class="staff" id="promptStaff"></div><div class="play-row"><button class="play" data-play="chord"><svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M2 1l9 5-9 5z"/></svg>Play chord</button><button class="play" data-play="arp"><svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M1 11h2V8H1zM5 11h2V5H5zM9 11h2V1H9z"/></svg>Arpeggiate</button></div>`;
      drawStaff($("promptStaff"), q);
    }
    hintBox.hidden = !q.hinted;
    if (q.hinted) hintBox.innerHTML = hintHTML(q);
    checkBtn.hidden = q.done || q.revealed;
    hintBtn.hidden = q.done || q.revealed || q.hinted;
    showBtn.hidden = !(q.tries > 0 && !q.done && !q.revealed);
    nextBtn.textContent = q.done || q.revealed ? "Next chord" : "Skip";
    nextBtn.classList.toggle("primary", q.done || q.revealed);
  }

  function hintHTML(q) {
    const f = q.notes.map(n => degLabel(n.deg, n.semi)).join("  ");
    return S.mode === "spell"
      ? `Formula: <span class="mono">${f}</span>. Each degree gets its own letter, counting up from ${nName(q.root)}.`
      : `The chord contains degrees <span class="mono">${f}</span>.`;
  }

  function answerHTML(q, status) {
    const cols = q.notes.map((n, i) => {
      const st = status ? status[i] : null;
      const cls = st ? st.cls : "";
      const note = st && st.text ? `<em>${st.text}</em>` : (st && st.cls === "ok" ? `<span class="sr">correct</span>` : "");
      return `<div class="deg ${cls}"><i>${degLabel(n.deg, n.semi)}</i><b>${nName(n)}</b>${note}</div>`;
    }).join("");
    return `<div class="answer"><div class="answer-head">${symHTML(q)}<span class="legend">${q.notes.length} notes, root position</span></div><div class="play-row"><button class="play" data-play="chord"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1l9 5-9 5z"/></svg>Play chord</button><button class="play" data-play="arp"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M1 11h2V8H1zM5 11h2V5H5zM9 11h2V1H9z"/></svg>Arpeggiate</button></div>
      <div class="answer-body"><div class="staff" id="ansStaff"></div><div class="degs" style="--n:${q.notes.length}">${cols}</div></div></div>`;
  }

  function score(q, correct) {
    if (!(window.LiveClass && LiveClass.active)) { if (window.SAprogress && q.tries === 0 && !q.revealed) SAprogress.record(__saLabel(S.mode), correct); }
    if (window.LiveClass && LiveClass.active && LiveClass.answered(correct)) return;
    if (q.tries > 0) return;
    S.total++;
    if (correct) { S.right++; S.streak++; S.misses = S.misses.filter(m => !(m.mode === S.mode && m.root === q.rootStr && m.suffix === q.suffix)); }
    else { S.streak = 0; if (!S.misses.some(m => m.mode === S.mode && m.root === q.rootStr && m.suffix === q.suffix)) S.misses.push({ mode: S.mode, root: q.rootStr, suffix: q.suffix }); }
    save(); renderScore();
  }

  const CHIP_SR = { ok: "correct", enh: "right pitch, wrong letter", no: "not in the chord" };
  const CHIP_MARK = { ok: "✓", enh: "≈", no: "✗" };
  const chip = (cls, text) => `<span class="chip ${cls}"><span aria-hidden="true">${CHIP_MARK[cls]} </span>${text}<span class="sr"> (${CHIP_SR[cls]})</span></span>`;
  function msg(cls, label, text) { return `<div class="verdict"><span class="pill ${cls}">${label}</span><span>${text}</span></div>`; }

  // --- Spell it grading ---
  function gradeSpell(q, user) {
    const used = user.map(() => false);
    const status = q.notes.map(t => {
      const i = user.findIndex((u, j) => !used[j] && key(u) === key(t));
      if (i >= 0) { used[i] = true; return { cls: "ok", user: i }; }
      return null;
    });
    q.notes.forEach((t, k) => {
      if (status[k]) return;
      const i = user.findIndex((u, j) => !used[j] && pc(u) === pc(t));
      if (i >= 0) { used[i] = true; status[k] = { cls: "enh", user: i, text: "you: " + nName(user[i]) }; }
      else status[k] = { cls: "miss", text: "missing" };
    });
    const userCls = user.map((u, j) => {
      const k = status.findIndex(s => s.user === j);
      return k < 0 ? "no" : status[k].cls;
    });
    const correct = status.every(s => s.cls === "ok") && user.length === q.notes.length;
    return { status, userCls, correct };
  }

  function checkSpell() {
    const q = Q.spell;
    const { notes: user, junk } = parseNotes(notesInput.value);
    if (junk) { fb.innerHTML = msg("warn", "Can't read", `“${esc(junk)}” isn't a note. Use letters A–G with ♭ ♯ 𝄫 𝄪 (or b # bb x).`); return; }
    if (!user.length) { fb.innerHTML = msg("warn", "Empty", "Enter the notes first, root up."); return; }
    const g = gradeSpell(q, user);
    score(q, g.correct); q.tries++;
    if (g.correct) {
      q.done = true; autoPlay(q);
      const inOrder = user.every((u, i) => key(u) === key(q.notes[i]));
      fb.innerHTML = msg("good", "Correct", inOrder ? "Every note spelled right." : "All the right notes. Stacked in thirds, they run as below.") + answerHTML(q, q.notes.map(() => ({ cls: "ok" })));
      drawStaff($("ansStaff"), q);
    } else {
      const chips = user.map((u, j) => chip(g.userCls[j], nName(u))).join("");
      const enh = g.userCls.includes("enh"), no = g.userCls.includes("no");
      const missing = q.notes.length - g.status.filter(s => s.cls !== "miss").length;
      const parts = [];
      if (enh) parts.push("amber notes are the right pitch on the wrong letter");
      if (no) parts.push("red notes aren't in the chord");
      if (missing > 0) parts.push(`${missing} chord tone${missing > 1 ? "s" : ""} missing`);
      if (!parts.length && user.length > q.notes.length) parts.push("a note is doubled");
      fb.innerHTML = msg("bad", "Not yet", parts.join("; ").replace(/^./, c => c.toUpperCase()) + ".") + `<div class="note-list">${chips}</div>`;
      q.lastStatus = g.status;
    }
    render();
  }

  // --- Name it grading ---
  function checkName() {
    const q = Q.name;
    const p = parseSymbol(symInput.value);
    if (p.error) { fb.innerHTML = msg("warn", "Can't read", esc(p.error)); return; }
    const user = chordNotes(p.root, p.tones);
    const target = new Set(q.notes.map(key));
    const correct = user.length === q.notes.length && user.every(n => target.has(key(n)));
    score(q, correct); q.tries++;
    if (correct) {
      q.done = true; autoPlay(q);
      const same = symInput.value.replace(/\s/g, "") === symText(q).replace(/\s/g, "");
      fb.innerHTML = msg("good", "Correct", same ? "That's the chord." : `Also written ${symText(q)}.`) + answerHTML(q);
      drawStaff($("ansStaff"), q);
    } else {
      const tPcs = q.notes.map(pc).sort().join(), uPcs = user.map(pc).sort().join();
      const chips = user.map(n => chip(target.has(key(n)) ? "ok" : (q.notes.some(t => pc(t) === pc(n)) ? "enh" : "no"), nName(n))).join("");
      const typed = esc(symInput.value.trim());
      let text = `Your ${typed} spells the notes below. Green ones match the staff.`;
      if (tPcs === uPcs) text = `Your ${typed} sounds the same, but it's spelled differently from the staff. Read the letters on the staff.`;
      else if (key(p.root) !== key(q.notes[0])) text = `Your ${typed} has a different root. In root position the bottom note is the root.`;
      fb.innerHTML = msg("bad", "Not yet", text) + `<div class="note-list">${chips}</div>`;
    }
    render();
  }

  function reveal() {
    const q = Q[S.mode];
    q.revealed = true;
    const status = S.mode === "spell" && q.lastStatus ? q.lastStatus : null;
    fb.innerHTML = msg("warn", "Answer", "Study it, then try the next one. This chord will come back for review.") + answerHTML(q, status);
    const colors = status ? status.map(s => s.cls === "ok" ? "--good" : s.cls === "enh" ? "--warn" : "--bad") : null;
    drawStaff($("ansStaff"), q, colors);
    autoPlay(q);
    render();
  }

  function next() {
    Q[S.mode] = newQuestion(S.mode);
    fb.innerHTML = "";
    notesInput.value = ""; symInput.value = "";
    render();
  }

  function setMode(m) {
    if (S.mode === m) return;
    S.mode = m; save();
    fb.innerHTML = "";
    if (!Q[m]) Q[m] = newQuestion(m);
    render();
  }

  // ---------- Events ----------
  $("tabSpell").onclick = () => setMode("spell");
  $("tabName").onclick = () => setMode("name");
  checkBtn.onclick = () => (S.mode === "spell" ? checkSpell() : checkName());
  hintBtn.onclick = () => { Q[S.mode].hinted = true; render(); };
  showBtn.onclick = reveal;
  nextBtn.onclick = next;
  [notesInput, symInput].forEach(inp => inp.addEventListener("keydown", e => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const q = Q[S.mode];
    if (q.done || q.revealed) next(); else checkBtn.click();
  }));
  document.addEventListener("keydown", e => {
    if (e.key === "Enter" && e.target === document.body) { const q = Q[S.mode]; if (q.done || q.revealed) next(); }
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

  let symCaret = null;
  symInput.addEventListener("blur", () => { symCaret = symInput.selectionStart; });
  $("namePad").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    const v = symInput.value;
    const at = symCaret == null ? v.length : Math.min(symCaret, v.length);
    if (b.dataset.ins) { symInput.value = v.slice(0, at) + b.dataset.ins + v.slice(at); symCaret = at + b.dataset.ins.length; }
    else if (b.dataset.cmd === "back") { const n = Array.from(v.slice(0, at)); n.pop(); const head = n.join(""); symInput.value = head + v.slice(at); symCaret = head.length; }
    else if (b.dataset.cmd === "clear") { symInput.value = ""; symCaret = 0; }
  });

  // Settings
  function renderSettings() {
    document.querySelectorAll("[data-fam]").forEach(b => b.setAttribute("aria-pressed", !!S.settings.fam[b.dataset.fam]));
    document.querySelectorAll("[data-roots]").forEach(b => b.setAttribute("aria-pressed", S.settings.roots === b.dataset.roots));
    document.querySelectorAll("[data-auto]").forEach(b => b.setAttribute("aria-pressed", String(S.settings.auto !== false) === String(b.dataset.auto === "1")));
    document.querySelectorAll("[data-dbl]").forEach(b => b.setAttribute("aria-pressed", String(S.settings.dbl) === String(b.dataset.dbl === "1")));
  }
  function settingsChanged() { save(); renderSettings(); Q.spell = newQuestion("spell"); Q.name = newQuestion("name"); fb.innerHTML = ""; notesInput.value = ""; symInput.value = ""; render(); }
  $("famToggles").onclick = e => {
    const b = e.target.closest("[data-fam]"); if (!b) return;
    const f = b.dataset.fam, on = !S.settings.fam[f];
    if (!on && Object.values(S.settings.fam).filter(Boolean).length === 1) return;
    S.settings.fam[f] = on; settingsChanged();
  };
  $("rootToggles").onclick = e => { const b = e.target.closest("[data-roots]"); if (b) { S.settings.roots = b.dataset.roots; settingsChanged(); } };
  $("autoToggles").onclick = e => { const b = e.target.closest("[data-auto]"); if (b) { S.settings.auto = b.dataset.auto === "1"; save(); renderSettings(); } };
  $("dblToggles").onclick = e => { const b = e.target.closest("[data-dbl]"); if (b) { S.settings.dbl = b.dataset.dbl === "1"; settingsChanged(); } };
  $("resetBtn").onclick = () => { S.misses = []; save(); $("resetBtn").textContent = "Review list cleared"; };
  let armTimer = null;
  $("scoreReset").onclick = () => {
    const b = $("scoreReset");
    if (!b.classList.contains("armed")) {
      b.classList.add("armed"); b.textContent = "Tap again to reset";
      armTimer = setTimeout(() => { b.classList.remove("armed"); b.textContent = "Reset"; }, 3000);
      return;
    }
    clearTimeout(armTimer);
    S.right = 0; S.total = 0; S.streak = 0; save(); renderScore();
    b.classList.remove("armed"); b.textContent = "Reset";
  };

  // Every session starts on a random chord in each mode.
  Q.spell = newQuestion("spell");
  Q.name = newQuestion("name");
  renderSettings(); renderScore(); render();


  // ===== SilverApps bridge (added by build/build_trainers.py) =====
  // the app's name tops every question heading (pages built on the harmony engine add it themselves)
  (function () { const tag = () => { const h = document.getElementById("qHead"); if (h && !h.querySelector(".kapp") && __SA_APP && __SA_APP.name) h.insertAdjacentHTML("afterbegin", '<span class="kapp">' + __SA_APP.name.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])) + '</span><span class="ksep" aria-hidden="true"> · </span>'); };
    const w = document.getElementById("work") || document.body; tag(); new MutationObserver(tag).observe(w, { childList: true, subtree: true }); })();
  function __saLabel(m) { const b = document.querySelector(m === "spell" ? "#tabSpell b" : "#tabName b"); return b ? b.textContent.trim() : m; }
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
        fb.innerHTML = ""; notesInput.value = ""; symInput.value = ""; renderSettings(); render();
      },
      showAnswer() { const q = Q[S.mode]; if (!q || q.done || q.revealed) return; reveal(); tidy(); }
    });
  })();
})();
