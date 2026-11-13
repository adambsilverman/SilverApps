(() => {
  // ===== Harmony trainer engine (Secondary Function, Neapolitan, Augmented Sixth, Mode Mixture, Voice Motion & Polyphony).
  // Content comes from window.FAM (one content file per app). Each app has a step-through Lesson and drill modes;
  // the drills use the same names as the other trainers (S, Q, newQuestion, score, choose…) so assets/live.js can run them as class games.
  const FAM = window.FAM;
  const LET = "CDEFGAB", NAT = [0, 2, 4, 5, 7, 9, 11];
  const ACC = { "-2": "𝄫", "-1": "♭", "0": "", "1": "♯", "2": "𝄪" };
  const SPOKEN_ACC = { "-2": " double flat", "-1": " flat", "0": "", "1": " sharp", "2": " double sharp" };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const sdHTML = s => s.replace(/(\d)\u0302(?![^<]*>)/g, '<span class="sd">$1</span>');   // scale-degree numbers with a caret
  const dimHTML = s => s.replace(/°(?![^<]*>)/g, '<span class="dimc" aria-hidden="true"></span>');   // ° drawn as a clear circle
  const accHTML = s => dimHTML(sdHTML(esc(s).replace(/([♭♯♮𝄫𝄪])/g, '<span class="acc">$1</span>')));
  const speak = s => String(s).replace(/𝄫/g, " double flat").replace(/𝄪/g, " double sharp").replace(/♭/g, " flat").replace(/♯/g, " sharp").replace(/♮/g, " natural").replace(/△/g, " major ").replace(/ø/g, " half-diminished ").replace(/°/g, " diminished ").replace(/\s+/g, " ").trim();
  const mod = (x, m) => ((x % m) + m) % m;

  // ---------- notes: { l: letter 0–6, a: accidental, o: octave } (C4 = middle C) ----------
  const N = (l, a = 0, o = 4) => ({ l, a, o });
  const midi = n => 12 * (n.o + 1) + NAT[n.l] + n.a;
  const pc = n => mod(NAT[n.l] + n.a, 12);
  function up(n, steps, semis) { const L = n.l + steps, l = mod(L, 7), o = n.o + Math.floor(L / 7); return { l, a: midi(n) + semis - (12 * (o + 1) + NAT[l]), o }; }
  const down = (n, steps, semis) => up(n, -steps, -semis);
  const nm = n => LET[n.l] + ACC[n.a];
  const nmO = n => nm(n) + n.o;
  const nmSpoken = n => LET[n.l] + SPOKEN_ACC[n.a];
  const parse = s => { const m = /^([A-G])(𝄫|𝄪|♭|♯|b|#)?(-?\d)?$/.exec(s); return N(LET.indexOf(m[1]), m[2] ? { "♭": -1, b: -1, "♯": 1, "#": 1, "𝄫": -2, "𝄪": 2 }[m[2]] : 0, m[3] != null ? +m[3] : 4); };
  const samePC = (x, y) => x.l === y.l && x.a === y.a;

  const rnd = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  // answers that are amounts ("3", "1½", "2 beats", "½ beat (an eighth note)") are listed smallest to largest instead of shuffled,
  // when every choice is an amount of the same unit; extra.order: "keep" keeps the given order, "shuffle" always shuffles
  const NUMW = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 }, FR = { "½": .5, "¼": .25, "¾": .75, "⅓": 1 / 3, "⅔": 2 / 3, "⅛": .125 };
  const qty = v => { const t = String(v).replace(/<[^>]+>/g, "").trim().toLowerCase();
    let m = /^(\d+(?:\.\d+)?)?\s*([½¼¾⅓⅔⅛])?(?:\s*\/\s*(\d+))?/.exec(t), q = null, rest = t;
    if (m && (m[1] || m[2])) { q = (m[1] ? +m[1] : 0) + (m[2] ? FR[m[2]] : 0); if (m[3]) q /= +m[3]; rest = t.slice(m[0].length); }
    else if ((m = /^(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/.exec(t))) { q = NUMW[m[1]]; rest = t.slice(m[0].length); }
    else if ((m = /^half an? /.exec(t))) { q = .5; rest = t.slice(m[0].length); }
    if (q == null) return null;
    const unit = (/^\s*([a-z-]+)/.exec(rest) || [, ""])[1].replace(/s$/, "");
    return { q, unit }; };
  const ordered = cs => { const qs = cs.map(qty); if (cs.some(c => /^(42|43|53|63|64|65)$/.test(c)) || qs.some(x => !x) || new Set(qs.map(x => x.unit)).size > 1 || new Set(qs.map(x => x.q)).size < cs.length) return null;
    return cs.map((c, i) => [c, qs[i].q]).sort((a, b) => a[1] - b[1]).map(x => x[0]); };
  const mc = (text, answer, wrong, explain, extra) => {
    const w = shuffle([...new Set(wrong.map(String))].filter(v => v !== String(answer))).slice(0, (extra && extra.nWrong) || 3);
    const cs = [String(answer), ...w], ord = extra && extra.order;
    return Object.assign({ text, choices: Array.isArray(ord) ? ord.map(String).filter(v => cs.includes(v)) : ord === "keep" ? cs : (ord !== "shuffle" && ordered(cs)) || shuffle(cs), answer: String(answer), explain }, extra || {});
  };

  // ---------- keys ----------
  const MAJ = [0, 2, 4, 5, 7, 9, 11], MIN = [0, 2, 3, 5, 7, 8, 10];
  const KEYS = { major: ["C", "G", "D", "A", "E", "F", "B♭", "E♭", "A♭"], minor: ["A", "E", "B", "F♯", "C♯", "D", "G", "C", "F"] };
  function key(name, mode) {
    const t = parse(name), steps = mode === "minor" ? MIN : MAJ;
    const scale = steps.map((s, i) => up(t, i, s));
    const sig = {}; scale.forEach(n => sig[n.l] = n.a);
    const tn = nm(t);
    return { name, mode, tonic: t, scale, sig, label: `${tn} ${mode}`, vf: tn.replace("♭", "b").replace("♯", "#") + (mode === "minor" ? "m" : "") };
  }
  const deg = (k, d) => { const n = k.scale[mod(d - 1, 7)]; return N(n.l, n.a, 4); };
  const randKey = modes => { const m = rnd(modes); return key(rnd(KEYS[m]), m); };
  // Is this note in the key? (minor keys also allow the raised 6th and 7th)
  const inKey = (k, n) => k.scale.some(s => samePC(s, n)) || (k.mode === "minor" && [5, 6].some(i => samePC(up(k.scale[i], 0, 1), n)));

  // ---------- chords ----------
  // qualities: intervals above the root as [letter steps, half steps]
  const QUAL = {
    M: [[0, 0], [2, 4], [4, 7]], m: [[0, 0], [2, 3], [4, 7]], d: [[0, 0], [2, 3], [4, 6]], A: [[0, 0], [2, 4], [4, 8]],
    "7": [[0, 0], [2, 4], [4, 7], [6, 10]], M7: [[0, 0], [2, 4], [4, 7], [6, 11]], m7: [[0, 0], [2, 3], [4, 7], [6, 10]],
    h7: [[0, 0], [2, 3], [4, 6], [6, 10]], o7: [[0, 0], [2, 3], [4, 6], [6, 9]],
  };
  const QSYM = { M: "", m: "m", d: "°", A: "+", "7": "7", M7: "△7", m7: "m7", h7: "ø7", o7: "°7" };
  const QNAME = { M: "major", m: "minor", d: "diminished", A: "augmented", "7": "dominant seventh", M7: "major seventh", m7: "minor seventh", h7: "half-diminished seventh", o7: "fully diminished seventh" };
  // chord = { tones: [root, 3rd, 5th, (7th)], q, bass: index of the bass tone, sym }
  function chord(root, q, bass = 0, extra) {
    const r = N(root.l, root.a, 4), tones = QUAL[q].map(([s, h]) => up(r, s, h));
    const c = Object.assign({ tones, q, bass }, extra || {});
    c.sym = symOf(c); return c;
  }
  const symOf = c => nm(c.tones[0]) + QSYM[c.q] + (c.bass ? "/" + nm(c.tones[c.bass]) : "");
  // chord on scale degree d of key k with its diatonic quality (minor: natural minor, but V and vii° use the raised 7th)
  function diat(k, d, seventh = false, bass = 0) {
    const r = deg(k, d), t3 = up(r, 2, 0), t = [0, 2, 4, 6].slice(0, seventh ? 4 : 3).map(s => deg(k, d + s));
    if (k.mode === "minor" && (d === 5 || d === 7)) { const lt = up(k.scale[6], 0, 1); t.forEach((n, i) => { if (samePC(n, k.scale[6])) t[i] = N(lt.l, lt.a, 4); }); }
    const iv = t.map(n => mod(pc(n) - pc(t[0]), 12)).join(",");
    const q = { "0,4,7": "M", "0,3,7": "m", "0,3,6": "d", "0,4,8": "A", "0,4,7,10": "7", "0,4,7,11": "M7", "0,3,7,10": "m7", "0,3,6,10": "h7", "0,3,6,9": "o7", "0,3,7,11": "mM7", "0,4,8,11": "AM7" }[iv] || "M";
    void t3;
    return QUAL[q] ? chord(t[0], q, bass) : Object.assign({ tones: t, q, bass, sym: nm(t[0]) + "?" });
  }
  const isChromatic = (k, c) => c.tones.some(n => !inKey(k, n));
  const FIG3 = ["", "6", "64"], FIG7 = ["7", "65", "43", "42"];
  const fig = (c, seventhOverride) => (c.tones.length === 4 || seventhOverride ? FIG7 : FIG3)[c.bass];
  const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];
  // diatonic Roman numeral of a degree (no figure)
  function rnOf(k, d) {
    const c = diat(k, d), R = ROMAN[d - 1];
    return c.q === "M" ? R : c.q === "m" ? R.toLowerCase() : c.q === "d" ? R.toLowerCase() + "°" : R + "+";
  }

  // ---------- Roman numerals: text like "vii°65/V", "♭II6", "Ger+6" → HTML with stacked figures, and spoken text ----------
  const RNRE = /^([♭♯]?)(It|Fr|Ger|[ivIV]+)([°ø+]?)(\d*)$/;
  function rnPart(p) {
    const m = RNRE.exec(p); if (!m) return accHTML(p);
    let h = (m[1] ? `<span class="acc">${m[1]}</span>` : "") + m[2];
    const q = m[3], f = m[4];
    if (q) h += q === "°" ? `<span class="rq dim"></span>` : `<span class="rq">${q}</span>`;   // the degree-sign glyph is tiny in text fonts: draw a circle   // °, ø, + : larger than the figures so they stay readable
    if (f.length === 2) h += `<span class="fg"><span>${f[0]}</span><span>${f[1]}</span></span>`;
    else if (f) h += `<sup>${f}</sup>`;
    return h;
  }
  const WORD = { I: "one", II: "two", III: "three", IV: "four", V: "five", VI: "six", VII: "seven" };
  function rnSpokenPart(p) {
    const m = RNRE.exec(p); if (!m) return speak(p);
    const base = { It: "Italian augmented", Fr: "French augmented", Ger: "German augmented" }[m[2]];
    let s = (m[1] === "♭" ? "flat " : m[1] === "♯" ? "sharp " : "") + (base || ((m[2] === m[2].toLowerCase() ? "small " : "") + WORD[m[2].toUpperCase()]));
    if (!base) s += { "°": " diminished", "ø": " half-diminished", "+": " augmented", "": "" }[m[3]];
    if (m[4]) s += " " + (m[4] === "42" ? "four two" : m[4] === "43" ? "four three" : m[4] === "65" ? "six five" : m[4] === "64" ? "six four" : m[4] === "6" ? (base ? "sixth" : "six") : m[4] === "7" ? "seven" : m[4]);
    return s;
  }
  const rnHTML = t => `<span class="rn" role="img" aria-label="${esc(rnSpoken(t))}"><span aria-hidden="true">${String(t).split("/").map(rnPart).join("/")}</span></span>`;
  const rnSpoken = t => String(t).split("/").map(rnSpokenPart).join(" of ");
  const symHTML = t => `<span class="csym" role="img" aria-label="${esc(speak(t))}"><span aria-hidden="true">${accHTML(t)}</span></span>`;
  const fmtVal = (v, f) => f === "rn" ? rnHTML(v) : f === "sym" ? symHTML(v) : /\{(rn|sym):/.test(String(v)) ? rich(String(v)) : accHTML(v);   // answers may embed {rn:…}/{sym:…}
  // inline markup in content text: {rn:V7/V} and {sym:F♯°7/A}
  const rich = s => dimHTML(sdHTML(esc(s)).replace(/\{rn:([^}]+)\}/g, (_, t) => rnHTML(t.replace(/&amp;/g, "&"))).replace(/\{sym:([^}]+)\}/g, (_, t) => symHTML(t)).replace(/(?<!"acc">)([♭♯♮𝄫𝄪])(?![^<]*>)/g, '<span class="acc">$1</span>'));
  // the same inline markup inside HTML that is already escaped (lesson bodies): leaves tags and attributes alone
  const richHTML = s => dimHTML(sdHTML(String(s)).replace(/\{rn:([^}]+)\}/g, (_, t) => rnHTML(t)).replace(/\{sym:([^}]+)\}/g, (_, t) => symHTML(t)).replace(/(?<!"acc">)([♭♯𝄫𝄪])(?![^<]*>)/g, '<span class="acc">$1</span>'));
  const plain = s => String(s).replace(/\{rn:([^}]+)\}/g, (_, t) => t).replace(/\{sym:([^}]+)\}/g, (_, t) => t);

  // ---------- voicing: keyboard style (bass in the left hand, three notes in the right hand) ----------
  function placeBass(n, prev) {
    let best = null;
    for (let o = 1; o <= 3; o++) { const x = N(n.l, n.a, o), m = midi(x); if (m < 40 || m > 57) continue; const s = prev ? Math.abs(m - midi(prev)) : Math.abs(m - 50); if (!best || s < best.s) best = { x, s }; }
    return best ? best.x : N(n.l, n.a, 2);
  }
  function perms(a) { if (a.length <= 1) return [a]; const out = []; a.forEach((x, i) => perms(a.slice(0, i).concat(a.slice(i + 1))).forEach(p => out.push([x].concat(p)))); return out; }
  function placeUpper(pcs, prev, bass) {
    let best = null;
    for (const p of perms(pcs)) for (let o = 3; o <= 5; o++) {
      const v = []; let ok = true;
      p.forEach((n, i) => { let x = N(n.l, n.a, i ? v[i - 1].o : o); while (i && midi(x) <= midi(v[i - 1])) x = N(x.l, x.a, x.o + 1); v.push(x); });
      const lo = midi(v[0]), hi = midi(v[v.length - 1]);
      if (lo < 55 || hi > 81 || hi - lo > 16 || lo <= midi(bass)) ok = false;
      if (!ok) continue;
      const s = prev ? v.reduce((t, x, i) => t + Math.abs(midi(x) - midi(prev[i])), 0) + (hi - lo > 12 ? 2 : 0) : Math.abs((lo + hi) / 2 - 69) + (hi - lo) * .3;
      if (!best || s < best.s) best = { v, s };
    }
    return best ? best.v : pcs.map((n, i) => N(n.l, n.a, 4 + (i > 1 ? 1 : 0)));
  }
  // which three tones go in the right hand (c.rh can override, as indexes into c.tones)
  function rhTones(c) {
    if (c.rh) return c.rh.map(i => c.tones[i]);
    const t = c.tones;
    if (t.length === 4) return [0, 1, 2, 3].filter(i => i !== c.bass).map(i => t[i]);
    if (c.bass === 1 && !c.double3) return [t[0], t[2], t[0]];
    return [t[0], t[1], t[2]];
  }
  function realize(chords) {
    let pb = null, pu = null;
    return chords.map(c => {
      if (c.v) return c.v;   // already voiced by hand
      const bass = placeBass(c.tones[c.bass], pb), upper = placeUpper(rhTones(c), pu, bass);
      pb = bass; pu = upper; return { bass, upper };
    });
  }
  // grand-staff spec: { key, chords, labels?, syms?, hl? } → adds voiced notes (JSON-safe for review lists and class games)
  function grand(o) {
    const v = realize(o.chords);
    return { type: "grand", vf: o.key ? o.key.vf : "C", sig: o.key ? o.key.sig : {}, cols: v.map((x, i) => ({ t: x.upper.map(nmO), b: [nmO(x.bass)], lab: o.labels ? o.labels[i] : null, sym: o.syms ? o.syms[i] : null, hl: o.hl === i || (Array.isArray(o.hl) && o.hl.includes(i)) })), label: o.label || "" };
  }
  const playOf = spec => spec.type === "score" ? scorePlay(spec) : spec.type === "voices" ? { chords: spec.cols.map(c => ["t", "a", "tn", "b"].flatMap(f => c[f] || []).map(s => midi(parse(s)))), timbre: "voice", gap: spec.gap || 1 } : ({ chords: spec.cols.map(c => c.t.concat(c.b).map(s => midi(parse(s)))) });
  const wideOf = spec => spec.type === "score" || spec.cols.length > 1 ? "wide" : "solo";

  // ---------- Staff drawing (VexFlow) ----------
  function cssVar(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
  const VFACC = { "-2": "bb", "-1": "b", "0": "n", "1": "#", "2": "##" };
  function drawStaff(el, o) {
    el._args = o; el.innerHTML = "";
    if (!window.Vex || !Vex.Flow) { el.innerHTML = '<p class="staff-msg">The notation engine didn\'t load. Reload the page.</p>'; return; }
    if (o.type === "score") return drawScore(el, o);
    const VF = Vex.Flow, ink = cssVar("--ink") || "#222";
    const cols = o.cols, n = cols.length, voiced = o.type === "voices";
    const r = new VF.Renderer(el, VF.Renderer.Backends.SVG);
    const sigN = Object.values(o.sig || {}).filter(a => a).length;
    const firstX = 10, W = Math.round(firstX + 80 + sigN * 11 + n * (o.colW || 74) + 10);
    const topY = o.syms && cols.some(c => c.sym) ? 34 : 14, gap = voiced ? 130 : 100, Ht = topY + gap + 130;
    r.resize(W, Ht);
    const ctx = r.getContext(); ctx.setFillStyle(ink); ctx.setStrokeStyle(ink);
    const tr = new VF.Stave(firstX, topY, W - firstX - 6), bs = new VF.Stave(firstX, topY + gap, W - firstX - 6);
    tr.addClef("treble"); bs.addClef("bass");
    if (o.vf && o.vf !== "C" && o.vf !== "Am") { tr.addKeySignature(o.vf); bs.addKeySignature(o.vf); }
    [tr, bs].forEach(s => { s.setStyle({ fillStyle: ink, strokeStyle: ink }); s.setContext(ctx).draw(); });
    [["brace"], ["singleLeft"], ["singleRight"]].forEach(([t]) => { const c = new VF.StaveConnector(tr, bs); c.setType(t); c.setStyle && c.setStyle({ fillStyle: ink, strokeStyle: ink }); c.setContext(ctx).draw(); });
    const keyOf = s => { const x = parse(s); return { k: LET[x.l].toLowerCase() + "/" + x.o, x }; };
    const accFor = x => (o.sig && (o.sig[x.l] || 0)) === x.a ? null : VFACC[x.a];
    // Build tickables per stave: one note (or chord) per column, a barline between columns.
    const make = (clef, list, stem, light) => {
      const sorted = list.map(keyOf).sort((a, b) => midi(a.x) - midi(b.x));
      const sn = new VF.StaveNote({ clef, keys: sorted.map(y => y.k), duration: voiced ? "h" : "w", stem_direction: stem || 1, auto_stem: !stem && voiced });
      sorted.forEach((y, i) => { const a = accFor(y.x); if (a) sn.addModifier(new VF.Accidental(a), i); });
      const col = light ? (cssVar("--muted-ink") || "#8a8178") : ink;
      sn.setStyle({ fillStyle: col, strokeStyle: col }); if (sn.setLedgerLineStyle) sn.setLedgerLineStyle({ strokeStyle: ink, fillStyle: ink });
      if (light) sn.getModifiers && sn.getModifiers().forEach(m => m.setStyle && m.setStyle({ fillStyle: col, strokeStyle: col }));
      return sn;
    };
    const voices = [], notesAt = [];
    const lanes = voiced ? [["treble", "t", 1], ["treble", "a", -1], ["bass", "tn", 1], ["bass", "b", -1]] : [["treble", "t", 0], ["bass", "b", 0]];
    lanes.forEach(([clef, f, stem]) => {
      if (!cols.some(c => c[f] && c[f].length)) return;
      const tk = [];
      cols.forEach((c, i) => {
        if (i) tk.push(new VF.BarNote());
        const sn = c[f] && c[f].length ? make(clef, c[f], stem, (o.light || []).includes(f)) : new VF.GhostNote({ duration: voiced ? "h" : "w" });
        tk.push(sn); (notesAt[i] = notesAt[i] || []).push(sn);
      });
      const v = new VF.Voice({ num_beats: (voiced ? 2 : 4) * n, beat_value: 4 }).setMode(VF.Voice.Mode.SOFT).addTickables(tk);
      voices.push({ v, stave: clef === "treble" ? tr : bs });
    });
    const fmt = new VF.Formatter();
    const tv = voices.filter(x => x.stave === tr).map(x => x.v), bv = voices.filter(x => x.stave === bs).map(x => x.v);
    if (tv.length) fmt.joinVoices(tv); if (bv.length) fmt.joinVoices(bv);
    const startX = Math.max(tr.getNoteStartX(), bs.getNoteStartX()); tr.setNoteStartX(startX); bs.setNoteStartX(startX);
    fmt.format(voices.map(x => x.v), tr.getNoteEndX() - startX - 16);
    voices.forEach(x => x.v.draw(ctx, x.stave));
    const svg = el.querySelector("svg");
    if (svg) {
      const NS = "http://www.w3.org/2000/svg";
      const mk = (tag, at, parent, first) => { const e = document.createElementNS(NS, tag); Object.entries(at).forEach(([k, v]) => e.setAttribute(k, v)); first ? parent.insertBefore(e, parent.firstChild) : parent.appendChild(e); return e; };
      const yTop = tr.getYForLine(0), yBot = bs.getYForLine(4);
      // bar lines run through both staves of the grand staff (BarNotes only draw within their own stave)
      if (voices.length) voices[0].v.getTickables().filter(t => t instanceof VF.BarNote).forEach(b => mk("rect", { x: b.getAbsoluteX(), y: yTop, width: 1, height: yBot - yTop, fill: ink }, svg));
      const yLow = Math.max(yBot, ...notesAt.flat().filter(x => x.getYs && !(x instanceof VF.GhostNote)).flatMap(x => x.getYs().map(y => y + (x.getStemDirection && x.getStemDirection() === -1 ? 30 : 6))));
      cols.forEach((c, i) => {
        const sn = notesAt[i].find(x => x.getAbsoluteX && !(x instanceof VF.GhostNote)) || notesAt[i][0], x = sn.getAbsoluteX() + 6;
        if (c.hl) mk("rect", { x: x - 22, y: yTop - 34, width: 46, height: yBot - yTop + 68, rx: 10, fill: cssVar("--hl") || "#F7E3A1", "fill-opacity": .85 }, svg, true);
        if (c.lab) rnSVG(mk, svg, x, c.labNear ? Math.max(yBot + 13, yLow + 14) : Math.max(yBot + 46, yLow + 26), c.lab, ink);   // labNear: a figure, right under the bass staff
        if (c.sym) { const t = mk("text", { x, y: yTop - 40, "text-anchor": "middle", "font-size": 17, "font-weight": 700, "font-family": "Literata, 'Noto Music', serif", fill: ink }, svg); t.textContent = c.sym; }
        if (c.tag) { const t = mk("text", { x, y: Math.max(yBot + 66, yLow + 46), "text-anchor": "middle", "font-size": 13, "font-family": "'Barlow Condensed', sans-serif", fill: ink }, svg); t.textContent = c.tag; }
      });
      // pivot bracket: old-key numerals on the first line, new-key numerals on a second line from the pivot on; the pivot's two labels are bracketed
      if (o.pivot != null) {
        const row1 = Math.max(yBot + 46, yLow + 26), row2 = row1 + 32, xs = cols.map((c, i) => { const sn = notesAt[i].find(x => x.getAbsoluteX && !(x instanceof VF.GhostNote)) || notesAt[i][0]; return sn.getAbsoluteX() + 6; });
        cols.forEach((c, i) => { if (c.lab2) rnSVG(mk, svg, xs[i], row2, c.lab2, ink); });
        const kt = (x, y, t) => { const e = mk("text", { x, y, "text-anchor": "end", "font-size": 17, "font-weight": 700, "font-family": "Literata, 'Noto Music', serif", fill: ink }, svg); e.textContent = t; };
        const first = cols.findIndex(c => c.lab); if (o.key1 && first >= 0) kt(xs[first] - 24, row1, o.key1);
        const px = xs[o.pivot], bl = px - 26, br = px + 26, red = cssVar("--fi-red-dk") || "#A8321F";
        if (o.key2) kt(bl - 6, row2, o.key2);
        mk("path", { d: `M${bl + 7} ${row1 - 20} H${bl} V${row2 + 8} H${bl + 7} M${br - 7} ${row1 - 20} H${br} V${row2 + 8} H${br - 7}`, fill: "none", stroke: red, "stroke-width": 2 }, svg);
      }
      let vb = `0 0 ${W} ${Ht}`;
      try { const bb = svg.getBBox(); if (bb.width) vb = `${bb.x - 4} ${bb.y - 6} ${bb.width + 8} ${bb.height + 12}`; } catch (e) {}
      svg.setAttribute("viewBox", vb); svg.removeAttribute("width"); svg.removeAttribute("height");
      svg.style.width = "100%"; svg.style.height = "auto"; svg.style.maxWidth = Math.round(W * 1.25) + "px";
      svg.setAttribute("role", "img"); svg.setAttribute("focusable", "false");
      svg.setAttribute("aria-label", o.label || describe(o));
    }
  }
  // Roman numeral under the bass staff: base, superscript quality, stacked figures
  function rnSVG(mk, svg, x, y, t, ink) {
    const g = mk("text", { x, y, "text-anchor": "middle", "font-size": 18, "font-family": "Literata, 'Noto Music', serif", fill: ink }, svg);
    String(t).split("/").forEach((p, pi) => {
      if (pi) { const s = mk("tspan", {}, g); s.textContent = "/"; }
      const m = RNRE.exec(p);
      if (!m) { const s = mk("tspan", {}, g); s.textContent = p; return; }
      const b = mk("tspan", {}, g); b.textContent = m[1] + m[2];
      if (m[3]) { const dim = m[3] === "°", q = mk("tspan", dim ? { dy: -8, "font-size": 13, "font-family": "'Schibsted Grotesk', Arial, sans-serif" } : { dy: -6, "font-size": 16, "font-weight": 700 }, g); q.textContent = dim ? "o" : m[3]; const z = mk("tspan", { dy: dim ? 8 : 6, "font-size": 18 }, g); z.textContent = "\u200A"; }   // °, ø, + larger than the figures
      if (m[4].length === 1) { const s = mk("tspan", { dy: -7, "font-size": 12 }, g); s.textContent = m[4]; const z = mk("tspan", { dy: 7, "font-size": 18 }, g); z.textContent = "\u200A"; }
      if (m[4].length === 2) { const s1 = mk("tspan", { dy: -8, "font-size": 12 }, g); s1.textContent = m[4][0]; const s2 = mk("tspan", { dx: -6.5, dy: 11, "font-size": 12 }, g); s2.textContent = m[4][1]; const z = mk("tspan", { dy: -3, "font-size": 18 }, g); z.textContent = " "; }
    });
  }
  function describe(o) {
    const sp = s => { const x = parse(s); return nmSpoken(x) + " " + x.o; };
    return `Grand staff${o.vf && o.vf !== "C" ? ", key signature of " + speak(nm(parse(o.vf.replace(/m$/, "").replace("b", "♭").replace("#", "♯")))) + (o.vf.endsWith("m") ? " minor" : " major") : ""}. ` + o.cols.map((c, i) => {
      const parts = o.type === "voices" ? [["soprano", c.t], ["alto", c.a], ["tenor", c.tn], ["bass", c.b]].filter(([, v]) => v && v.length).map(([w, v]) => `${w} ${v.map(sp).join(" ")}`).join(", ") : `${c.b.map(sp).join(" ")} in the bass, ${c.t.map(sp).join(", ")} above`;
      return `${o.cols.length > 1 ? "Chord " + (i + 1) + (c.hl ? " (highlighted)" : "") + ": " : ""}${parts}${c.lab ? `, labeled ${rnSpoken(c.lab)}` : ""}`;
    }).join(". ") + ".";
  }
  // ---------- Measured notation (VexFlow): melodies, rhythms, two-voice and grand-staff passages ----------
  // spec: { type: "score", vf, sig, time: "4/4", clefs: ["treble", "bass"] | ["treble"] | ["percussion"], bpm,
  //         bars: [ { t: [voice, voice?], b: [voice, voice?] } ], final: true, label }
  // voice = [ note ]; note = { k: ["C5"] (or [] for a rest), d: "q" | "h" | "w" | "8" | "16" (+ "d" for each dot),
  //   tie, lab (under the lowest staff), sym (chord symbol above), tag (text above), n (number above), ly (lyric),
  //   hl (circle the note), hlc (shade the whole column), bs: "x" (start a bracket labeled x), be (end the bracket), hs (half-step wedge to the next note) }
  const DURQ = { w: 4, h: 2, q: 1, "8": .5, "16": .25 };
  const durOf = d => { const m = /^(w|h|q|8|16)(d*)$/.exec(d); let b = DURQ[m[1]], add = b; for (let i = 0; i < m[2].length; i++) { add /= 2; b += add; } return b; };
  const staffIds = o => o.ids || (o.clefs || ["treble", "bass"]).map(c => c === "bass" ? "b" : "t");   // o.ids lets two staves share a clef (e.g. two percussion staves)
  // Proportional justification: VexFlow otherwise pushes a bar's last note against the bar line. Justify to the point where the
  // last note starts (as a share of the bar), so the space after it matches its value; never narrower than the notes need.
  function justifyW(VF, fmt, vs, avail) {   // format, then re-space so the gap after the last note matches its value
    let w = avail; fmt.format(vs, w);
    for (let it = 0; it < 5; it++) {
      let tot = 0; const pts = [];
      vs.forEach(v => { let t = 0; v.getTickables().forEach(n => { if (!(n instanceof VF.GhostNote) && n.getTickContext()) pts.push([t, n.getTickContext().getX()]); t += n.getTicks().value(); }); tot = Math.max(tot, t); });   // the bar's own length: a pickup ends right after its last note
      if (pts.length < 2) return fitInside(VF, fmt, vs, avail, w);
      pts.sort((a, b) => a[0] - b[0]); const [t0, x0] = pts[0], [t1, x1] = pts[pts.length - 1];
      if (t1 <= t0 || t1 >= tot) return fitInside(VF, fmt, vs, avail, w);   // a single note, or a bar without a meter
      const need = x0 + (x1 - x0) / (t1 - t0) * (tot - t0), end = avail + 6;
      if (Math.abs(need - end) <= 2) break;
      const nw = Math.max(10, Math.min(avail * 2, w * (end - x0) / (need - x0))); if (Math.abs(nw - w) < .5) break;
      w = nw; fmt.format(vs, w);
    }
    return fitInside(VF, fmt, vs, avail, w);
  }
  // after justification: shrink until every note (with its dots, flags and accidentals) ends clear of the bar line
  function fitInside(VF, fmt, vs, avail, w) {
    for (let it = 0; it < 8; it++) {
      let right = 0;
      vs.forEach(v => v.getTickables().forEach(n => { if (n instanceof VF.GhostNote || !n.getTickContext()) return; const m = n.getMetrics ? n.getMetrics() : null; right = Math.max(right, n.getTickContext().getX() + (m ? m.notePx + m.modRightPx : 12)); }));
      if (right <= avail - 12) return w;
      w = Math.max(10, w * (avail - 16) / right); fmt.format(vs, w);
    }
    return w;
  }
  function drawScore(el, o) {
    const VF = Vex.Flow, ink = cssVar("--ink") || "#222", clefs = o.clefs || ["treble", "bass"], ids = staffIds(o);
    const time = o.time || "4/4", sigN = Object.values(o.sig || {}).filter(a => a).length;
    const rest = { treble: "b/4", bass: "d/3", percussion: "b/4", alto: "c/4", tenor: "a/3" };
    const restW = { treble: "d/5", bass: "f/3", percussion: "d/5", alto: "e/4", tenor: "c/4" };   // the whole rest hangs from the 4th line (one line above the half rest)
    const wNote = n => ({ w: 58, h: 46, q: 36, "8": 27, "16": 22 }[/^(w|h|q|8|16)/.exec(n.d)[1]]) + (n.d.match(/d/g) || []).length * 8 + Math.min(30, n.k.filter(s => /[♭♯𝄫𝄪]/.test(s)).length * 10) + (n.ly ? Math.max(0, String(n.ly).length * 6 - 26) : 0) + (n.lab ? 14 : 0) + tagW(n);
    const tagW = n => o.tagSide && n.tag ? String(n.tag).length * 11 + 10 : 0;   // a side tag needs room beside its note
    const durN = n => durOf(n.d) * (n.tu ? (n.tuo || 2) / (n.tun || 3) : 1);
    const propW = bar => {   // the densest note sets pixels per beat; the bar gets that rate times its length (so a half note gets twice a quarter's room)
      const vs = ids.flatMap(id => bar[id] || []); if (!vs.length) return 0;
      const rate = Math.max(0, ...vs.flat().filter(n => !n.ghost).map(n => wNote(n) / durN(n))), len = Math.max(...vs.map(v => v.reduce((t, n) => t + durN(n), 0)));
      return Math.min(rate * len, 640) * .92;
    };
    let evenOK = null;   // evenBars: no bar much narrower than the widest, as long as the whole passage still fits on one line
    const barW = bar => { if (!o.evenBars) return barW0(bar); const top = .75 * Math.max(...o.bars.map(barW0));
      if (evenOK === null) evenOK = o.bars.reduce((t, b) => t + Math.max(barW0(b), top), 0) + 120 <= (o.rowW || 680);
      return evenOK ? Math.max(barW0(bar), top) : barW0(bar); };
    const barW0 = bar => (bar.time ? 26 : 0) + Math.max(bar.minBar || o.minBar || 70, propW(bar), ...ids.map(id => Math.max(0, ...((bar[id] || []).map(v => v.reduce((t, n) => t + wNote(n), 0)))))) + 26;
    const headW = first => 44 + sigN * 11 + (first && o.time !== null ? 28 : 0);
    const MAXW = o.rowW || 680, rows = [];
    let cur = [], w = 0;
    o.bars.forEach((b, i) => { const bw = barW(b) + (cur.length ? 0 : headW(i === 0)); if (cur.length && w + bw > MAXW) { rows.push(cur); cur = []; w = 0; } cur.push(i); w += cur.length === 1 ? barW(b) + headW(i === 0) : bw; });
    if (cur.length) rows.push(cur);
    if (rows.length > 1) {   // balance the rows (no lone bar on the last line): equal numbers of bars per row when they fit
      const N = o.bars.length, per = Math.ceil(N / rows.length), even = [];
      for (let i = 0; i < N; i += per) even.push(o.bars.slice(i, i + per).map((_, j) => i + j));
      const fits = even.every(r => r.reduce((t, bi, j) => t + barW(o.bars[bi]) + (j ? 0 : headW(bi === 0)), 0) <= MAXW * 1.12);
      if (fits && even.length === rows.length) rows.splice(0, rows.length, ...even);
    }
    const all = o.bars.flatMap(b => ids.flatMap(id => (b[id] || []).flat()));
    const has = f => all.some(n => n[f]);
    const above = (has("sym") ? 24 : 0) + (has("tag") || has("n") || o.beatNums ? 22 : 0) + (has("bs") ? 26 : 0);
    const gap = clefs.length > 1 ? (has("ly") ? 120 : 96) : 0;
    const rowH = above + 20 + gap * Math.max(1, clefs.length - 1) + 90 + (has("lab") ? 40 : 0) + (clefs.length === 1 && has("ly") ? 30 : 0);
    const totalW = Math.max(...rows.map(r => r.reduce((t, bi, j) => t + barW(o.bars[bi]) + (j ? 0 : headW(bi === 0)), 0))) + 14;
    const r = new VF.Renderer(el, VF.Renderer.Backends.SVG);
    r.resize(totalW, rows.length * rowH + 10);
    const ctx = r.getContext(); ctx.setFillStyle(ink); ctx.setStrokeStyle(ink);
    const meta = [], ties = [], last = {}, beatMarks = [];   // last note per staff+voice (for ties); beat numbers (o.beatNums)
    const st = s => (s.setStyle && s.setStyle({ fillStyle: ink, strokeStyle: ink }), s);
    let curT = time;   // the meter in force (bars can change it with bar.time)
    let barQ = 0;
    rows.forEach((row, ri) => {
      let x = 8; const y0 = ri * rowH + above + 10;
      // a passage that wraps: stretch every row to the same width, so lines end together (no row wider than the widest)
      const hw = headW(row[0] === 0), natural = row.reduce((t, bi) => t + barW(o.bars[bi]), 0), k0 = rows.length > 1 ? Math.max(1, (totalW - 14 - hw) / natural) : 1, k = ri === rows.length - 1 && k0 > 1.2 ? 1 : k0;   // a short last line stays its natural width (not right-justified)
      const rowStaves = [];
      row.forEach((bi, j) => {
        const bar = o.bars[bi]; let bw = barW(bar) * k + (j ? 0 : headW(bi === 0));
        if (bar.time) curT = bar.time;
        const nextT = j === row.length - 1 && o.bars[bi + 1] && o.bars[bi + 1].time;   // cautionary time signature at the end of the line
        const staves = clefs.map((c, si) => { const s = new VF.Stave(x, y0 + si * gap, bw); if (j === 0) { s.addClef(c); if (c !== "percussion" && o.vf && o.vf !== "C" && o.vf !== "Am") s.addKeySignature(o.vf); } if ((bi === 0 && o.time !== null) || (bi > 0 && bar.time)) s.addTimeSignature(curT); if (nextT && s.setEndTimeSignature) s.setEndTimeSignature(nextT); if (bar.dbl) s.setEndBarType(VF.Barline.type.DOUBLE); if (bi === o.bars.length - 1 && o.final !== false) s.setEndBarType(VF.Barline.type.END); return s; });
        { // size the bar from the space its clef, key and time signatures really take, so equal bars get equal room for notes
          const plain = new VF.Stave(x, 0, 100), offS = plain.getNoteStartX() - x, offE = x + 100 - plain.getNoteEndX();
          const head = Math.max(...staves.map(s => s.getNoteStartX())) - x - offS, tail = x + bw - Math.min(...staves.map(s => s.getNoteEndX())) - offE;
          bw = barW(bar) * k - (bar.time ? 26 : 0) + Math.max(0, head) + Math.max(0, tail); staves.forEach(s => s.setWidth(bw)); }
        staves.forEach(s => { st(s); s.setContext(ctx).draw(); });
        if (clefs.length > 1 && o.brace !== false) {   // two staves: a braced grand staff. Three: a melody staff above a braced grand staff (system line on the left; bar lines join the grand staff only)
          const gs = clefs.length > 2 ? 1 : 0, conn = (a, b, t) => { const c = new VF.StaveConnector(a, b); c.setType(t); st(c); c.setContext(ctx).draw(); };
          if (j === 0) { conn(staves[0], staves[staves.length - 1], "singleLeft"); conn(staves[gs], staves[gs + 1], "brace"); }
          conn(staves[gs], staves[gs + 1], j === row.length - 1 && bi === o.bars.length - 1 && o.final !== false ? "boldDoubleRight" : "singleRight");
        }
        const startX = Math.max(...staves.map(s => s.getNoteStartX())); staves.forEach(s => s.setNoteStartX(startX));
        const vlist = [], beams = [], tuplets = [];
        clefs.forEach((c, si) => {
          const id = ids[si], vs = bar[id] || [], acc = {};
          vs.forEach((voice, vi) => {
            const stem = vs.length > 1 ? (vi ? -1 : 1) : 0;
            const notes = voice.map(n => {
              if (n.ghost) { const gn = new VF.GhostNote({ duration: n.d }); last[si + ":" + vi] = null; return gn; }   // invisible placeholder
              const isRest = !n.k.length;
              const shown = n.barRest ? "w" : n.d;   // n.barRest: a whole-bar rest in any meter: drawn as a whole rest, timed as the bar (n.d = the bar's length, e.g. "hd" in 3/4 or 6/8)
              const keys = isRest ? [/^w/.test(shown) ? restW[c] : rest[c]] : n.k.map(s => { const p = parse(s); return { s: LET[p.l].toLowerCase() + "/" + p.o, p }; }).sort((a, b) => midi(a.p) - midi(b.p));
              const sn = new VF.StaveNote({ clef: c === "percussion" ? "percussion" : c, keys: isRest ? keys : keys.map(y => y.s), duration: shown + (isRest ? "r" : ""), stem_direction: stem || 1, auto_stem: !stem && !isRest, align_center: !!n.center || (isRest && /^w/.test(shown) && voice.length === 1) });   // n.center: a whole-bar rest centered in the bar
              if (n.center && !isRest) sn._saCenter = true;
              if (!isRest && c !== "percussion") keys.forEach((y, ki) => {
                const kk = y.p.l + "/" + y.p.o, cur = kk in acc ? acc[kk] : ((o.sig && o.sig[y.p.l]) || 0);
                const tiedIn = last[si + ":" + vi] && last[si + ":" + vi].tie && last[si + ":" + vi].sn && last[si + ":" + vi].n.k.includes(n.k[0]);
                if (cur !== y.p.a && !tiedIn) sn.addModifier(new VF.Accidental(VFACC[y.p.a]), ki);
                acc[kk] = y.p.a;
              });
              for (let dd = (shown.match(/d/g) || []).length; dd > 0; dd--) VF.Dot.buildAndAttach([sn], { all: true });
              st(sn); if (sn.setLedgerLineStyle) sn.setLedgerLineStyle({ strokeStyle: ink, fillStyle: ink });
              const L = last[si + ":" + vi];
              if (L && L.tie && !isRest) ties.push({ a: L.sn, b: sn, ra: L.row, rb: ri, n: keys.length, dir: L.n.tieDir });   // n.tieDir 1/-1 forces the tie's side (for "wrong side" examples)
              last[si + ":" + vi] = { sn, tie: n.tie, row: ri, n };
              if (n.color) { const sty = { fillStyle: n.color, strokeStyle: n.color }; sn.setStyle(sty); if (sn.setLedgerLineStyle) sn.setLedgerLineStyle(sty); sn.getModifiers().forEach(m => m.setStyle && m.setStyle(sty)); }   // n.color: tint one note (and its accidental)
              meta.push({ sn, n, si, ri, staves });
              return sn;
            });
            const tg = {}; voice.forEach((n, i) => { if (n.tu) (tg[n.tu] = tg[n.tu] || []).push(i); });   // tuplets: notes sharing n.tu; n.tun notes in the time of n.tuo
            Object.values(tg).forEach(ix => { const n0 = voice[ix[0]]; tuplets.push(new VF.Tuplet(ix.map(i => notes[i]), { num_notes: n0.tun || ix.length, notes_occupied: n0.tuo || 2, bracketed: true })); });
            const v = new VF.Voice({ num_beats: +curT.split("/")[0], beat_value: +curT.split("/")[1] }).setMode(VF.Voice.Mode.SOFT).addTickables(notes);
            vlist.push({ v, s: staves[si], si });
            // beams: explicit groups (n.bm ids), none (o.beam === false), custom groups (bar.groups / o.groups like ["3/8", "2/8"]) or the meter's defaults
            if (voice.some(n => n.bm)) { const bg = {}; voice.forEach((n, i) => { if (n.bm) (bg[n.bm] = bg[n.bm] || []).push(notes[i]); }); Object.values(bg).forEach(g => { if (g.length > 1) beams.push(new VF.Beam(g)); }); }
            else if (o.beam !== false && bar.beam !== false) { try { const gs = bar.groups || o.groups; const bm = VF.Beam.generateBeams(notes, Object.assign({ groups: gs ? gs.map(g => new VF.Fraction(...g.split("/").map(Number))) : VF.Beam.getDefaultBeamGroups(curT) }, stem ? { stem_direction: stem } : {})); beams.push(...bm); } catch (e) {} }
          });
        });
        const fmt = new VF.Formatter();
        clefs.forEach((c, si) => { const vv = vlist.filter(x => x.si === si).map(x => x.v); if (vv.length) fmt.joinVoices(vv); });
        if (vlist.length) { const vs = vlist.map(x => x.v); justifyW(VF, fmt, vs, Math.max(20, staves[0].getNoteEndX() - startX - 12)); }
        vlist.forEach(x => x.v.draw(ctx, x.s));
        // centered notes (n.center): VexFlow centers the notehead and ignores accidentals, so re-center the whole drawn chord (heads + accidentals) in the bar
        vlist.forEach(x => x.v.getTickables().forEach(n => { if (!n._saCenter) return; try { const el = n.getSVGElement && n.getSVGElement(); if (!el || !el.getBBox) return; const bb = el.getBBox(), a = x.s.getNoteStartX(), b = x.s.getNoteEndX(), dx = (a + b) / 2 - (bb.x + bb.width / 2);
          if (Math.abs(dx) > .5) { el.setAttribute("transform", `translate(${dx.toFixed(1)} 0)`); n._saDx = dx; } } catch (e) {} }));
        { const Q = VF.RESOLUTION / 4; let used = 0;   // each note's onset in quarter notes from the start (sn._q), for highlighting during playback
          vlist.forEach(x => { let tk = 0; x.v.getTickables().forEach(n => { n._q = barQ + tk / Q; tk += n.getTicks().value(); }); used = Math.max(used, tk / Q); });
          barQ += used; }
        if (o.beatNums && vlist.length) {   // o.beatNums: number every beat above the staff, even beats with no note (x interpolated in time between notes)
          const Q = VF.RESOLUTION / 4, pts = [];
          vlist.filter(x => x.si === 0).forEach(x => { let tk = 0; x.v.getTickables().forEach(n => { if (!(n instanceof VF.GhostNote)) pts.push([tk / Q, n.getAbsoluteX() + 6]); tk += n.getTicks().value(); }); });
          pts.sort((a, b) => a[0] - b[0]);
          const [num, den] = curT.split("/").map(Number), full = num * 4 / den, len = Math.max(0, ...vlist.map(x => x.v.getTicksUsed ? x.v.getTicksUsed().value() / Q : 0)) || full, start = bi === 0 && len < full - 1e-9 ? full - len : 0;
          pts.push([len, staves[0].getNoteEndX()]);
          beatPos(curT, bar.groups || o.groups).forEach((q, k) => { if (q < start - 1e-9) return; const t = q - start; let xx = pts[0][1];
            for (let i = 0; i < pts.length; i++) { if (Math.abs(pts[i][0] - t) < 1e-6) { xx = pts[i][1]; break; } if (i && pts[i - 1][0] < t && pts[i][0] > t) { xx = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * (t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]); break; } }
            beatMarks.push({ x: xx, ri, label: String(k + 1) }); });
        }
        beams.forEach(b => { st(b); b.setContext(ctx).draw(); });
        tuplets.forEach(t => { st(t); t.setContext(ctx).draw(); });
        rowStaves.push(staves);
        x += bw;
      });
    });
    ties.forEach(t => {
      const idx = [...Array(t.n).keys()];
      const mkTie = (a, b) => { const tie = new VF.StaveTie({ first_note: a, last_note: b, first_indices: idx, last_indices: idx }); if (t.dir) tie.setDirection(t.dir); st(tie); tie.setContext(ctx).draw(); };
      if (t.ra === t.rb) mkTie(t.a, t.b); else { mkTie(t.a, null); mkTie(null, t.b); }
    });
    const svg = el.querySelector("svg");
    if (!svg) return;
    const NS = "http://www.w3.org/2000/svg";
    const mk = (tag, at, parent, first) => { const e = document.createElementNS(NS, tag); Object.entries(at).forEach(([k, v]) => e.setAttribute(k, v)); first ? parent.insertBefore(e, parent.firstChild) : parent.appendChild(e); return e; };
    const txt = (x, y, s, at) => { const t = mk("text", Object.assign({ x, y, "text-anchor": "middle", "font-size": 15, "font-family": "'Schibsted Grotesk', Arial, sans-serif", fill: ink }, at || {}), svg); t.textContent = s; return t; };
    const brOpen = {}, rowTop = {}, lyr = [];
    meta.forEach(({ sn, si, ri, staves }) => { if (si) return; const ys = sn.getYs ? sn.getYs() : []; rowTop[ri] = Math.min(rowTop[ri] ?? staves[0].getYForLine(0), staves[0].getYForLine(0), ...ys.map(y => y - (sn.getStemDirection && sn.getStemDirection() === 1 && sn.getDuration() !== "w" ? 34 : 6))); });
    const hasN = has("n") || !!o.beatNums, hasTag = !o.tagSide && all.some(n => n.tag), hasSym = has("sym");
    beatMarks.forEach(b => txt(b.x, (rowTop[b.ri] ?? 40) - 12, b.label, { "font-size": 13, "font-weight": 700, "fill-opacity": .75 }));
    meta.forEach(({ sn, n, si, ri, staves }) => {
      const x = sn.getAbsoluteX() + 6 + (sn._saDx || 0), top = staves[0].getYForLine(0), bot = staves[staves.length - 1].getYForLine(4), ys = sn.getYs ? sn.getYs() : [top];
      const nY = rowTop[ri] - 12, tagY = nY - (hasN ? 18 : 0), symY = tagY - (hasTag ? 20 : 0) - (hasN || hasTag ? 4 : 12), brY = symY - (hasSym ? 24 : 0) - 2;
      if (n.hlc) mk("rect", { x: x - 20, y: top - 26, width: 42, height: bot - top + 52, rx: 10, fill: cssVar("--hl") || "#F7E3A1", "fill-opacity": .85 }, svg, true);
      if (n.hl) {   // circle centered on the notehead itself, a little wider than the head (whole notes are wide)
        let hx = x, hw = 12; try { const b0 = sn.getNoteHeadBeginX(), b1 = sn.getNoteHeadEndX(); if (b1 > b0) { hx = (b0 + b1) / 2; hw = (b1 - b0) / 2; } } catch (e) {}
        ys.forEach(y => mk("ellipse", { cx: hx, cy: y, rx: hw + 8, ry: 11.5, fill: "none", stroke: cssVar("--fi-red-dk") || "#b33", "stroke-width": 2.2 }, svg)); }
      if (n.n != null) txt(x, si ? bot + 26 : nY, String(n.n), { "font-size": 13, "font-weight": 700 });
      if (n.tag && o.tagSide) {   // the name beside the notehead (right of its circle), so labels above the staff stay low
        let hx = x + 12; try { hx = sn.getNoteHeadEndX(); } catch (e) {}
        txt(hx + (n.hl ? 11 : 5), Math.min(...ys) + 6, n.tag, { "text-anchor": "start", "font-size": 17, "font-weight": 700, "font-family": "'Barlow Condensed', 'Schibsted Grotesk', sans-serif" });
      } else if (n.tag) txt(x, si ? bot + (n.n != null ? 44 : 26) : tagY, n.tag, { "font-size": 14, "font-weight": 700 });
      if (n.sym) txt(x, symY, n.sym, { "font-size": o.symSize || 16, "font-weight": 700, "font-family": "Literata, 'Noto Music', serif" });
      if (n.lab) rnSVG(mk, svg, x, bot + 44, n.lab, ink);
      lyr.push({ si, ri, x, y: staves[si].getYForLine(4) + 34, n, sn, el: n.ly != null ? txt(x, staves[si].getYForLine(4) + 34, n.ly, { "font-size": 15, "font-family": "Literata, serif" }) : null });
      if (n.bs) brOpen[si + ":" + n.bs] = { x: x - 10, ri, label: n.bs };
      if (n.be) { const key = Object.keys(brOpen).find(k2 => k2.startsWith(si + ":") && (n.be === true || k2 === si + ":" + n.be)); if (key) { const b = brOpen[key]; delete brOpen[key]; const yb = brY - 6; mk("path", { d: `M${b.x} ${yb + 7} V${yb} H${x + 12} V${yb + 7}`, fill: "none", stroke: ink, "stroke-width": 1.6 }, svg); txt(b.x + 2, yb - 5, b.label, { "text-anchor": "start", "font-size": 15, "font-weight": 700, "font-style": "italic", "font-family": "Literata, serif" }); } }
    });
    // lyric hyphens (n.hy: centered between this syllable and the next), extender lines (n.ex) and slurs (n.sls … n.sle)
    const edge = (el, side) => { try { const b = el.getBBox(); return side < 0 ? b.x : b.x + b.width; } catch (e) { return +el.getAttribute("x"); } };
    lyr.forEach((L, i) => {
      if (L.el && (L.n.hy || L.n.ex)) {
        let j = i + 1; while (j < lyr.length && lyr[j].si === L.si && !lyr[j].el) j++;
        const nx = j < lyr.length && lyr[j].si === L.si && lyr[j].ri === L.ri ? lyr[j] : null, x1 = edge(L.el, 1);
        if (L.n.hy) { const x2 = nx ? edge(nx.el, -1) : x1 + 24, gapW = x2 - x1, count = gapW > 120 ? Math.floor(gapW / 60) : 1;
          for (let h = 1; h <= count; h++) mk("line", { x1: x1 + gapW * h / (count + 1) - 4, x2: x1 + gapW * h / (count + 1) + 4, y1: L.y - 5, y2: L.y - 5, stroke: ink, "stroke-width": 1.3 }, svg); }
        if (L.n.ex) { const last = lyr[Math.max(i, j - 1)]; mk("line", { x1: x1 + 2, x2: last.x + 8, y1: L.y + 1, y2: L.y + 1, stroke: ink, "stroke-width": 1.2 }, svg); }
      }
    });
    // half-step wedges: n.hs on a note draws a caret from its notehead to the next note's on the same staff and row
    lyr.forEach((L, i) => { if (!L.n.hs) return; const N = lyr.slice(i + 1).find(x => x.si === L.si); if (!N || N.ri !== L.ri) return;
      try { const y1 = Math.min(...L.sn.getYs()), y2 = Math.min(...N.sn.getYs()), top = Math.min(y1, y2) - 16;
        mk("path", { d: `M${L.x + 2} ${y1 - 8} L${(L.x + N.x) / 2} ${top} L${N.x + 4} ${y2 - 9}`, fill: "none", stroke: ink, "stroke-width": 1.6, "stroke-linejoin": "round" }, svg); } catch (e) {} });
    const slOpen = {};
    lyr.forEach(L => { if (L.n.sls) slOpen[L.si] = { sn: L.sn, n: L.n }; if (L.n.sle && slOpen[L.si]) { try { const S0 = slOpen[L.si];
        // a slur goes on the notehead side when all stems agree, above when they're mixed; n.slStem on the first note puts it on the stem side (a "wrong" example)
        const dirs = [S0.sn, L.sn].map(x => x.getStemDirection ? x.getStemDirection() : 1), above = S0.n.slStem ? dirs[0] === 1 : !(dirs[0] === 1 && dirs[1] === 1);
        const pos = d => (above ? (d === 1 ? 2 : 1) : (d === 1 ? 1 : 2));   // 1 = at the notehead, 2 = at the stem tip
        const c = new VF.Curve(S0.sn, L.sn, { cps: [{ x: 0, y: 16 }, { x: 0, y: 16 }], position: pos(dirs[0]), position_end: pos(dirs[1]), invert: dirs[0] !== dirs[1] ? dirs[0] === -1 : above !== (dirs[0] === -1) }); st(c); c.setContext(ctx).draw(); } catch (e) {} delete slOpen[L.si]; } });
    let vb = `0 0 ${totalW} ${rows.length * rowH}`;
    try { const bb = svg.getBBox(); if (bb.width) vb = `${bb.x - 4} ${bb.y - 6} ${bb.width + 8} ${bb.height + 12}`; } catch (e) {}
    svg.setAttribute("viewBox", vb); svg.removeAttribute("width"); svg.removeAttribute("height");
    svg.style.width = "100%"; svg.style.height = "auto"; svg.style.maxWidth = Math.round(Math.min(totalW, MAXW + 20) * (o.scale || 1.25)) + "px"; svg.style.display = "block"; svg.style.margin = "0 auto";
    svg.setAttribute("role", "img"); svg.setAttribute("focusable", "false");
    svg.setAttribute("aria-label", o.label || describeScore(o));
    el._notes = meta.filter(m => m.n.k.length && !m.n.ghost).map(m => ({ g: m.sn.getSVGElement ? m.sn.getSVGElement() : null, q: m.sn._q || 0, n: m.n })).filter(x => x.g);
    // o.pick: notes with n.pv are buttons (click or Enter/Space) that fire a bubbling "sa-pick" event with that value (e.g. "click the non-chord tone")
    if (o.pick) {
      svg.setAttribute("role", "group");
      el._notes.forEach(x => { if (x.n.pv == null) return; const g = x.g;
        g.setAttribute("role", "button"); g.setAttribute("tabindex", "0"); g.classList.add("nclick", "npick"); g.setAttribute("aria-label", x.n.pl || x.n.pv);
        try { const b = g.getBBox(); mk("rect", { x: b.x - 8, y: b.y - 8, width: b.width + 16, height: b.height + 16, fill: "transparent", stroke: "none", "pointer-events": "all" }, g, true); } catch (e) {}
        const go = () => el.dispatchEvent(new CustomEvent("sa-pick", { bubbles: true, detail: x.n.pv }));
        g.addEventListener("click", go);
        g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
      });
    }
  }
  const DURNAME = { w: "whole note", h: "half note", q: "quarter note", "8": "eighth note", "16": "sixteenth note" };
  function describeScore(o) {
    const ids = staffIds(o), clefs = o.clefs || ["treble", "bass"];
    const sp = s => { const x = parse(s); return nmSpoken(x) + " " + x.o; };
    const nd = n => { if (n.barRest) return "whole-bar rest"; const m = /^(w|h|q|8|16)(d*)$/.exec(n.d); const d = (m[2] ? "dotted " : "") + DURNAME[m[1]]; return (n.k.length ? (clefs[0] === "percussion" ? "" : n.k.map(sp).join(" ") + " ") + d : d.replace("note", "rest")) + (n.tie ? " tied" : "") + (n.tag ? ` (${n.tag})` : "") + (n.hl ? " (circled)" : "") + (n.ly ? ` “${n.ly}”` : "") + (n.lab ? `, ${rnSpoken(n.lab)}` : ""); };
    const kd = o.vf && o.vf !== "C" && clefs[0] !== "percussion" ? `key signature of ${speak(nm(parse(o.vf.replace(/m$/, "").replace("b", "♭").replace("#", "♯"))))}${o.vf.endsWith("m") ? " minor" : " major"}, ` : "";
    return `Music, ${kd}${o.time !== null ? (o.time || "4/4") + " time" : ""}. ` + o.bars.map((b, i) => `Bar ${i + 1}: ` + ids.map((id, si) => (b[id] || []).map(v => v.map(nd).join(", ")).join("; ") ? `${clefs.length > 1 ? (o.names ? o.names[si] + " " : si ? "bass staff " : "treble staff ") : ""}${(b[id] || []).map(v => v.map(nd).join(", ")).join("; ")}` : "").filter(x => x).join(". ")).join(". ") + ".";
  }
  // a metronome click on every beat of a score spec (pick-up bars start mid-bar), merged with the music
  // beat positions (in quarter notes) within a bar: simple meters by their beat note, compound meters by the dotted quarter,
  // and asymmetrical x/8 bars by their beam groups (5/8 as 3 + 2 → two clicks; 7/8 as 2 + 2 + 3 → three)
  function beatPos(T, groups) {
    const [num, den] = T.split("/").map(Number), full = num * 4 / den, comp = den === 8 && num % 3 === 0 && num > 3, out = [];
    if (den === 8 && !comp && num > 3) {
      const gs = (groups ? groups.map(g => { const [a, b] = g.split("/").map(Number); return a * 4 / b; }) : num === 5 ? [1.5, 1] : num === 7 ? [1, 1, 1.5] : num === 8 ? [1.5, 1.5, 1] : []).filter(g => g > 0);
      if (gs.length) { let q = 0; for (let i = 0; q < full - 1e-9 && i < 64; i++) { out.push(q); q += gs[i % gs.length]; } return out; }
    }
    const beat = comp ? 1.5 : den === 8 ? .5 : 4 / den;
    for (let q = 0; q < full - 1e-9; q += beat) out.push(q);
    return out;
  }
  function withClick(o, p) {
    p = p || scorePlay(o);
    const spb = 60 / (o.bpm || 100), ids = staffIds(o), ev = (p.ev || []).slice();
    const barLen = b => Math.max(...ids.map(id => Math.max(0, ...((b[id] || []).map(v => v.reduce((s2, n) => s2 + durOf(n.d) * (n.tu ? (n.tuo || 2) / (n.tun || 3) : 1), 0))))));
    let t = 0, T = o.time || "4/4";
    o.bars.forEach((b, i) => {
      if (b.time) T = b.time;
      const [num, den] = T.split("/").map(Number), full = num * 4 / den;
      const len = barLen(b) || full, start = i === 0 && len < full - 1e-9 ? full - len : 0;
      beatPos(T, b.groups || o.groups).forEach(q => { if (q < start - 1e-9) return; ev.push([q < 1e-9 ? 96 : 89, t + (q - start) * spb, .05, q < 1e-9 ? .9 : .6, q < 1e-9 ? "clickHi" : "click"]); });
      t += len * spb;
    });
    return Object.assign({}, p, { ev });
  }
  // spoken counting on every note of the top voice, with the metronome click only (no instrument): "1 e & a" (simple),
  // "1 & a" (compound and triplets). Syllables are Adam's recorded clips, assets/count-voice-Adam/<syllable>.wav (1–9, e, and, a),
  // placed exactly on each note.
  function countSyl(pos, beat, comp, tu) {
    const bi = Math.floor(pos / beat + 1e-6), f = (pos - bi * beat) / beat, near = x => Math.abs(f - x) < 1e-3;
    if (near(0)) return bi < 9 ? String(bi + 1) : null;
    if (comp || tu) return near(1 / 3) ? "and" : near(2 / 3) ? "a" : null;
    return near(.5) ? "and" : near(.25) ? "e" : near(.75) ? "a" : null;
  }
  function withCount(o) {
    const p = withClick(o, { ev: [] }), spb = 60 / (o.bpm || 100), ids = staffIds(o), ev = p.ev.slice();   // clicks only, then the voice
    const dq = n => durOf(n.d) * (n.tu ? (n.tuo || 2) / (n.tun || 3) : 1);
    const barLen = b => Math.max(...ids.map(id => Math.max(0, ...((b[id] || []).map(v => v.reduce((s2, n) => s2 + dq(n), 0))))));
    let t = 0, T = o.time || "4/4", tied = false;
    o.bars.forEach((b, i) => {
      if (b.time) T = b.time;
      const [num, den] = T.split("/").map(Number), full = num * 4 / den, comp = den === 8 && num % 3 === 0 && num > 3;
      const beat = comp ? 1.5 : den === 8 ? .5 : 4 / den, len = barLen(b) || full, start = i === 0 && len < full - 1e-9 ? full - len : 0;
      let pos = start;
      ((b[ids[0]] || [])[0] || []).forEach(n => {
        if (n.k.length && !tied) { const syl = countSyl(pos, beat, comp, !!n.tu); if (syl) ev.push([0, t + (pos - start) * spb, 0, /^\d/.test(syl) ? 1 : .8, "say", syl]); }
        tied = !!(n.k.length && n.tie); pos += dq(n);
      });
      t += len * spb;
    });
    return Object.assign({}, p, { ev });
  }
  // sung playback: a recorded singer (Cantai) sings each note's letter name at pitch. Clips in "assets/pitch-voice-Cantai/Cantai pitch letters/"
  // cover C2–C6: every natural, every sharp and every flat, including B♯, E♯, C♭, F♭ (file names use "s" for sharp: Cs4, Db4, Bs3, Cb4;
  // B♯n sounds as C(n+1), C♭n as B(n−1)). Double sharps/flats or notes outside the range fall back to the piano tone.
  const SING_DIR = "assets/pitch-voice-Cantai/Cantai%20pitch%20letters/";   // (folder name has spaces: URL-encoded)
  function singFile(sp) {
    const m = /^([A-G])(𝄫|𝄪|♭|♯|b|#)?(-?\d)$/.exec(sp || ""); if (!m) return null;
    const acc = m[2] ? { "♯": "s", "#": "s", "♭": "b", b: "b" }[m[2]] : ""; if (acc == null) return null;
    const mi = midi(parse(sp)); if (mi < 36 || mi > 84 || sp === "B#1" || sp === "B♯1") return null;   // every letter has a sharp and a flat clip, C2–C6 (no B♯1)
    return m[1] + acc + m[3];
  }
  // a score's playback with every lone note sung (chords stay on the piano), slowed if needed so each name has time to sound (≥ 0.85 s apart)
  function singOf(o, p) {
    p = p || scorePlay(o); const ev = p.ev.slice().sort((a, b) => a[1] - b[1]);
    const starts = [...new Set(ev.map(e => Math.round(e[1] * 1e4)))]; let gap = Infinity; for (let i = 1; i < starts.length; i++) gap = Math.min(gap, (starts[i] - starts[i - 1]) / 1e4);
    const f = gap < .85 ? .85 / gap : 1;
    return Object.assign({}, p, { ev: ev.map(e => { const solo = !e[4] && ev.filter(x => Math.abs(x[1] - e[1]) < 1e-4).length === 1, fn = solo ? singFile(e[7]) : null;
      return fn ? [e[0], e[1] * f, e[2] * f, e[3], "sing", fn] : [e[0], e[1] * f, e[2] * f, ...e.slice(3)]; }) });
  }
  // events [midi, start, length, velocity] for a score spec (ties joined)
  function scorePlay(o) {
    const spb = 60 / (o.bpm || 100), ev = [], ids = staffIds(o), perc = (o.clefs || [])[0] === "percussion";
    ids.forEach((id, si) => { for (let vi = 0; vi < 2; vi++) {
      let t = 0, held = null, barStart = 0;
      o.bars.forEach(b => {
        const voice = (b[id] || [])[vi]; t = barStart;
        if (voice) voice.forEach(n => {
          const d = durOf(n.d) * (n.tu ? (n.tuo || 2) / (n.tun || 3) : 1) * spb;
          if (n.k.length) {
            if (held && held.k === n.k.join()) held.evs.forEach(e => e[2] += d);
            else { const evs = n.k.map(s => perc ? [76, t, d * .95, .9, "perc"] : [midi(parse(s)), t, d * .95, (si === 0 && vi === 0 ? .9 : .6) / Math.sqrt(n.k.length), undefined, undefined, undefined, s]); ev.push(...evs); held = { k: n.k.join(), evs }; }   // event [7] = the note's spelling (for sung playback)
            if (!n.tie) held = null;
          } else held = null;
          t += d;
        });
        barStart += Math.max(...ids.map(id2 => Math.max(0, ...((b[id2] || []).map(v => v.reduce((s, n) => s + durOf(n.d) * (n.tu ? (n.tuo || 2) / (n.tun || 3) : 1), 0)))))) * spb;
      });
    } });
    // rhythms on a percussion staff play on one steady pitch (C5), not a drum; o.drum keeps the drum sound
    if (perc && !o.drum) ev.filter(e => e[4] === "perc").forEach(e => { e[0] = 72; e[3] = .8; e.length = 4; });
    return { ev, timbre: o.timbre };
  }

  function redrawStaves() { document.querySelectorAll(".staff").forEach(el => el._args && drawStaff(el, el._args)); }

  // ---------- Sound (Web Audio): soft keyboard tone; chords, progressions, or free events [midi, start, length] ----------
  let AC = null, bus = null;
  function audio() {
    if (AC) { if (AC.state === "suspended") AC.resume(); return AC; }
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    AC = new C(); const comp = AC.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4; comp.connect(AC.destination); AC._out = comp; return AC;
  }
  function newBus() { if (bus) { const old = bus; old.gain.setTargetAtTime(0, AC.currentTime, 0.04); setTimeout(() => old.disconnect(), 400); } bus = AC.createGain(); bus.gain.value = 1; bus.connect(AC._out); return bus; }
  // unpitched sounds: "click" / "clickHi" (metronome), "perc" (a clear, mid-low drum hit for rhythms)
  let NZ = null;
  function hit(out, kind, t0, vel) {
    if (!NZ) { NZ = AC.createBuffer(1, AC.sampleRate * .5, AC.sampleRate); const d = NZ.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const g = AC.createGain(); g.connect(out);
    if (kind === "click" || kind === "clickHi") {   // a woody metronome tick: a very short tone plus a burst of filtered noise
      const f = kind === "clickHi" ? 2000 : 1300, o = AC.createOscillator(), og = AC.createGain(), n = AC.createBufferSource(), bp = AC.createBiquadFilter(), ng = AC.createGain();
      o.type = "sine"; o.frequency.value = f; og.gain.setValueAtTime(0, t0); og.gain.linearRampToValueAtTime(.5 * vel, t0 + .001); og.gain.exponentialRampToValueAtTime(.001, t0 + .035);
      n.buffer = NZ; bp.type = "bandpass"; bp.frequency.value = f * 1.6; bp.Q.value = 2.5; ng.gain.setValueAtTime(.6 * vel, t0); ng.gain.exponentialRampToValueAtTime(.001, t0 + .015);
      o.connect(og); og.connect(g); n.connect(bp); bp.connect(ng); ng.connect(g); g.gain.value = .9; o.start(t0); o.stop(t0 + .05); n.start(t0); n.stop(t0 + .03); return;
    }
    // "perc": a tom-like drum with a sharp attack, well below the click's range
    const o = AC.createOscillator(), og = AC.createGain(), n = AC.createBufferSource(), lp = AC.createBiquadFilter(), ng = AC.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(260, t0); o.frequency.exponentialRampToValueAtTime(150, t0 + .08);
    og.gain.setValueAtTime(0, t0); og.gain.linearRampToValueAtTime(.75 * vel, t0 + .002); og.gain.exponentialRampToValueAtTime(.001, t0 + .28);
    n.buffer = NZ; lp.type = "lowpass"; lp.frequency.value = 3500; ng.gain.setValueAtTime(.35 * vel, t0); ng.gain.exponentialRampToValueAtTime(.001, t0 + .03);
    o.connect(og); og.connect(g); n.connect(lp); lp.connect(ng); ng.connect(g); o.start(t0); o.stop(t0 + .3); n.start(t0); n.stop(t0 + .04);
  }
  function tone(out, m, t0, dur, vel = 1, timbre, pan) {
    const f = 440 * Math.pow(2, (m - 69) / 12), g = AC.createGain(), lp = AC.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = Math.min(f * (timbre === "reed" ? 10 : 7), 7000);
    if (pan && AC.createStereoPanner) { const pn = AC.createStereoPanner(); pn.pan.value = pan; g.connect(pn); pn.connect(out); } else g.connect(out);
    lp.connect(g);
    const parts = timbre === "voice" ? [[1, 1], [2, .35], [3, .15]] : timbre === "reed" ? [[1, 1], [3, .7], [5, .45], [7, .3], [9, .18]] : [[1, 1], [2, .45], [3, .22], [4, .12]];
    parts.forEach(([h, a]) => { const o = AC.createOscillator(); o.type = timbre === "voice" || timbre === "reed" ? "sine" : "triangle"; o.frequency.value = f * h; const og = AC.createGain(); og.gain.value = a / parts.length * 1.6; o.connect(og); og.connect(lp); o.start(t0); o.stop(t0 + dur + .6); });
    const pk = .22 * vel;
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(pk, t0 + .02);
    if (timbre === "voice" || timbre === "reed") g.gain.setTargetAtTime(pk * .8, t0 + .05, .2); else g.gain.setTargetAtTime(pk * .45, t0 + .03, .5);
    g.gain.setTargetAtTime(0, t0 + dur, .08);
  }
  // recorded counting syllables (see withCount), fetched and decoded on first use
  const VOICE = {}, VOICE_DIR = "assets/count-voice-Adam/";
  const clipURL = e => e[4] === "say" ? VOICE_DIR + e[5] + ".wav" : e[4] === "sing" ? SING_DIR + e[5] + ".mp3" : null;
  const sayKeys = ev => [...new Set(ev.map(clipURL).filter(Boolean))];
  const loadVoice = keys => Promise.all(keys.filter(k => !(k in VOICE)).map(k => fetch(k).then(r => { if (!r.ok) throw 0; return r.arrayBuffer(); })
    .then(b => new Promise((res, rej) => AC.decodeAudioData(b, res, rej))).then(buf => { buf._lv = voiceLevel(buf); VOICE[k] = buf; }).catch(() => { VOICE[k] = null; })));
  // even out the recordings' loudness: gain that brings each clip's sounding RMS to the same level (peaks kept below full scale)
  function voiceLevel(buf) { const d = buf.getChannelData(0); let ss = 0, n = 0, pk = 0; for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > pk) pk = a; if (a > .01) { ss += a * a; n++; } }
    const rms = n ? Math.sqrt(ss / n) : .1; return Math.min(.12 / Math.max(rms, 1e-4), .95 / Math.max(pk, 1e-4)); }
  function play(p) {
    if (!p || !audio()) return;
    if (p.ev) { const keys = sayKeys(p.ev); if (keys.some(k => !(k in VOICE))) { newBus(); const ticket = bus; loadVoice(keys).then(() => { if (bus === ticket) play(p); }); return; } }
    const out = newBus(), t = AC.currentTime + .06;
    if (p.ev) {
      p.ev.forEach(([m, s, d, v, kind, tim, pan]) => kind === "say" || kind === "sing" ? 0 : kind ? hit(out, kind, t + s, v || .8) : tone(out, m, t + s, d, v || .8, tim || p.timbre, pan));
      // each syllable is cut off (with a short fade) where the next one starts, so fast subdivisions stay in time
      const says = p.ev.filter(e => e[4] === "say").sort((a, b) => a[1] - b[1]);
      says.forEach((e, i) => { const buf = VOICE[clipURL(e)]; if (!buf) return;
        const src = AC.createBufferSource(), g = AC.createGain(), t0 = t + e[1], end = Math.min(t0 + buf.duration, i + 1 < says.length ? t + says[i + 1][1] : Infinity), lv = (buf._lv || 1) * (e[3] || 1);
        src.buffer = buf; g.gain.setValueAtTime(lv, t0); g.gain.setValueAtTime(lv, Math.max(t0, end - .02)); g.gain.linearRampToValueAtTime(0, end);
        src.connect(g); g.connect(out); src.start(t0); src.stop(end + .01); });
      // sung notes (clips already normalized): each lasts its note value, but at least 0.9 s so the name is heard; a missing clip falls back to the tone
      p.ev.filter(e => e[4] === "sing").forEach(e => { const buf = VOICE[clipURL(e)]; if (!buf) { tone(out, e[0], t + e[1], e[2], e[3] || .8, p.timbre); return; }
        const src = AC.createBufferSource(), g = AC.createGain(), t0 = t + e[1], end = t0 + Math.min(buf.duration, Math.max(e[2], .9)), lv = 1.15 * Math.min(1, (e[3] || .8) / .9);
        src.buffer = buf; g.gain.setValueAtTime(lv, t0); g.gain.setValueAtTime(lv, Math.max(t0, end - .06)); g.gain.linearRampToValueAtTime(0, end);
        src.connect(g); g.connect(out); src.start(t0); src.stop(end + .02); });
      return;
    }
    const gap = p.gap || 1.05;
    (p.chords || [[p.m]]).forEach((ch, i) => ch.forEach((m, j) => tone(out, m, t + i * gap, (p.dur || .95) * gap, (p.vels && p.vels[i] ? p.vels[i][j] : 1) / Math.sqrt(ch.length) * 1.3, p.timbre)));
  }
  const stopSound = () => { if (bus && AC) { bus.gain.setTargetAtTime(0, AC.currentTime, .03); bus = null; } followClear(); };
  const PLAY_SVG = '<svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M2 1l9 5-9 5z"/></svg>';
  const PLAY_BTN = (label, which) => `<div class="play-row"><button class="play" data-play="${which}">${PLAY_SVG}${esc(label)}</button></div>`;

  // ---------- Four-part (SATB) voicing and part-writing checks ----------
  const SR = { S: [60, 79], A: [55, 74], T: [48, 67], B: [40, 62] };
  const ltPC = k => mod(pc(k.tonic) + 11, 12);
  // all acceptable four-part voicings of chord c (bass = c.tones[c.bass]); opts.loose keeps faulty ones too (for error drills)
  function satbCands(k, c, opts = {}) {
    const T = c.tones, n = T.length, out = [];
    const place = (t, r) => { const res = []; for (let o = 1; o <= 6; o++) { const x = N(t.l, t.a, o), m = midi(x); if (m >= r[0] && m <= r[1]) res.push(x); } return res; };
    const ext = opts.loose ? 2 : 0, R = v => [SR[v][0] - ext, SR[v][1] + ext];
    const Bs = place(T[c.bass], R("B"));
    const lt = ltPC(k), sev = n === 4 ? pc(T[3]) : -1;
    for (const B of Bs) for (let si = 0; si < n; si++) for (let ai = 0; ai < n; ai++) for (let ti = 0; ti < n; ti++) {
      const idx = [si, ai, ti, c.bass], has = i => idx.includes(i);
      for (const S of place(T[si], R("S"))) for (const A of place(T[ai], R("A"))) for (const Tn of place(T[ti], R("T"))) {
        const m = [midi(S), midi(A), midi(Tn), midi(B)];
        if (!(m[0] > m[1] && m[1] > m[2] && m[2] > m[3])) { if (!opts.loose) continue; }
        if (m[3] > m[2] || m[2] - m[3] > 26 || m[0] === m[1] || m[1] === m[2]) continue;
        const v = { S, A, T: Tn, B, m, idx, cost: 0, flags: [] };
        if (m[0] < m[1] || m[1] < m[2]) v.flags.push("cross");
        if (m[0] - m[1] > 12 || m[1] - m[2] > 12) v.flags.push("space");
        if (!has(0)) v.flags.push("noroot");
        if (!has(1)) v.flags.push("no3");
        if (n === 4 && !has(3)) v.flags.push("no7");
        const cnt = i => idx.filter(x => x === i).length, pcs = idx.map(i => pc(T[i]));
        if (pcs.filter(p => p === lt).length > 1 && T.some(t => pc(t) === lt)) v.flags.push("dblLT");
        if (sev >= 0 && cnt(3) > 1) v.flags.push("dbl7");
        if (["S", "A", "T", "B"].some((x, i) => m[i] < SR[x][0] || m[i] > SR[x][1])) v.flags.push("range");
        if (v.flags.length && !opts.loose) continue;
        // doubling preferences
        if (n === 3) {
          const dbl = [0, 1, 2].find(i => cnt(i) > 1);
          if (cnt(0) === 3) v.cost += 3;
          else if (c.bass === 0) v.cost += dbl === 0 ? 0 : dbl === 2 ? 2 : 5;
          else if (c.bass === 1) v.cost += dbl === 1 ? (c.q === "d" ? 0 : 3) : 0;
          else v.cost += dbl === 2 ? 0 : 4;
          if (c.q === "d" && c.bass === 0) v.cost += 2;
        } else if (!has(2)) { if (opts.full) continue; v.cost += 1; }
        v.dcost = v.cost;
        v.cost += Math.abs(m[0] - 71) * .12 + Math.abs(m[1] - 64) * .06 + Math.abs(m[2] - 57) * .06;   // comfortable registers
        if (opts.sop != null && si !== opts.sop) continue;
        out.push(v);
      }
    }
    return out;
  }
  const letterStep = n => n.o * 7 + n.l;
  // interval between two notes: [letter steps, semitones]
  const ivl = (lo, hi) => [letterStep(hi) - letterStep(lo), midi(hi) - midi(lo)];
  const perfectOf = (lo, hi) => { const [st, se] = ivl(lo, hi); if (st % 7 === 4 && se % 12 === 7) return "5"; if (st % 7 === 0 && se % 12 === 0) return "8"; return null; };
  const VN = ["S", "A", "T", "B"], VNAMES = { S: "soprano", A: "alto", T: "tenor", B: "bass" };
  // part-writing problems moving from voicing v1 (chord c1) to v2 (chord c2); returns [{ code, text }]
  function pwIssues(k, c1, v1, c2, v2) {
    const out = [], add = (code, text) => out.push({ code, text });
    const lt = ltPC(k), n1 = VN.map(x => v1[x]), n2 = VN.map(x => v2[x]);
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
      const p1 = perfectOf(n1[j], n1[i]), p2 = perfectOf(n2[j], n2[i]);
      const di = midi(n2[i]) - midi(n1[i]), dj = midi(n2[j]) - midi(n1[j]);
      if (p1 && p1 === p2 && (di || dj)) {
        const nm5 = p1 === "5" ? "5ths" : (letterStep(n1[i]) === letterStep(n1[j]) ? "unisons" : "octaves");
        if (Math.sign(di) === Math.sign(dj) && di && dj) add(p1 === "5" ? "par5" : "par8", `parallel ${nm5} between the ${VNAMES[VN[j]]} and ${VNAMES[VN[i]]}`);
        else if (di && dj) add(p1 === "5" ? "con5" : "con8", `consecutive ${nm5} by contrary motion between the ${VNAMES[VN[j]]} and ${VNAMES[VN[i]]}`);
      }
    }
    const ds = midi(v2.S) - midi(v1.S), db = midi(v2.B) - midi(v1.B), pOut = perfectOf(v2.B, v2.S);
    if (pOut && ds && db && Math.sign(ds) === Math.sign(db) && Math.abs(ds) > 2 && perfectOf(v1.B, v1.S) !== pOut) add(pOut === "5" ? "dir5" : "dir8", `direct (hidden) ${pOut === "5" ? "5th" : "octave"}: the outer voices move in the same direction into a perfect ${pOut === "5" ? "5th" : "octave"} with a leap in the soprano`);
    const dom = [5, 7].includes(c1.deg) || c1.dom, tonicNext = c2.deg === 1 || c2.deg === 6;
    VN.forEach((x, i) => {
      const a = v1[x], b = v2[x], d = midi(b) - midi(a), st = letterStep(b) - letterStep(a);
      if (dom && tonicNext && pc(a) === lt && x === "S" && !(st === 1 && d === 1)) add("lt", `the leading tone (${nm(a)}) in the soprano doesn't resolve up to the tonic`);
      if (c1.tones.length === 4 && pc(a) === pc(c1.tones[3]) && !(st === -1 && (d === -1 || d === -2)) && !(d === 0 && c2.keep7)) add("sev", `the chordal 7th (${nm(a)}) in the ${VNAMES[x]} doesn't resolve down by step`);
      if (st === 1 && d === 3 || st === -1 && d === -3) add("aug2", `the ${VNAMES[x]} leaps an augmented 2nd (${nm(a)}–${nm(b)})`);
      if (Math.abs(d) > 12 || (x !== "B" && Math.abs(st) === 6)) add("leap", `the ${VNAMES[x]} leaps ${Math.abs(d) > 12 ? "more than an octave" : "a 7th"}`);
    });
    for (let i = 0; i < 3; i++) { if (midi(v2[VN[i + 1]]) > midi(v1[VN[i]]) || midi(v2[VN[i]]) < midi(v1[VN[i + 1]])) { add("overlap", `the ${VNAMES[VN[i]]} and ${VNAMES[VN[i + 1]]} overlap`); break; } }
    return out;
  }
  const HARD = ["par5", "par8", "con5", "con8", "dir5", "dir8", "lt", "sev", "aug2", "leap"];
  // voice a progression in four parts: chords (with .deg set where known); opts.sop: soprano tone index for the last chord
  function satb(k, chords, opts = {}) {
    const C = chords.map((c, i) => satbCands(k, c, { sop: i === chords.length - 1 ? opts.sop : (opts.sops || [])[i], full: opts.full }));
    if (C.some(x => !x.length)) return null;
    let prev = C[0].map(v => ({ v, cost: v.cost + Math.random() * 3 + (opts.firstS != null ? Math.abs(v.m[0] - opts.firstS) * .3 : Math.abs(v.m[0] - 70) * .15), back: null }));
    const layers = [prev];
    for (let i = 1; i < C.length; i++) {
      const cur = C[i].map(v => {
        let best = null;
        for (const p of prev) {
          if (p.cost === Infinity) continue;
          const iss = pwIssues(k, chords[i - 1], p.v, chords[i], v);
          if (iss.some(x => HARD.includes(x.code))) continue;
          const mv = [0, 1, 2].reduce((t, j) => { const d = Math.abs(v.m[j] - p.v.m[j]); return t + d + (d > 5 ? 4 : 0); }, 0);
          const c = p.cost + v.cost + mv + (iss.length ? 6 : 0) + Math.random() * 1.2;
          if (!best || c < best.cost) best = { v, cost: c, back: p };
        }
        return best || { v, cost: Infinity, back: null };
      });
      layers.push(cur); prev = cur;
    }
    let end = prev.filter(x => x.cost < Infinity).sort((a, b) => a.cost - b.cost)[0];
    if (!end) return null;
    const res = []; for (let x = end; x; x = x.back) res.unshift(x.v);
    return res;
  }
  // voices-spec columns from satb() output
  const satbCols = (vs, labs) => vs.map((v, i) => ({ t: [nmO(v.S)], a: [nmO(v.A)], tn: [nmO(v.T)], b: [nmO(v.B)], lab: labs ? labs[i] : null }));
  const satbPlay = (vs, gap) => ({ chords: vs.map(v => v.m), timbre: "voice", gap: gap || 1 });


  // flat note lists → bars. staffs: { t: [voice, voice?], b: [...] }; note: { k: ["C5"] or [], q: length in quarter notes, ...marks }.
  // Notes that cross a barline are split and tied; marks stay on the first piece. pickup: length of an incomplete first bar.
  const QD = [[4, "w"], [3, "hd"], [2, "h"], [1.5, "qd"], [1, "q"], [.75, "8d"], [.5, "8"], [.25, "16"]];
  function toBars(staffs, per = 4, pickup = 0) {
    const bars = [];
    Object.entries(staffs).forEach(([id, voices]) => voices.forEach((flat, vi) => {
      let bi = 0, room = pickup || per;
      flat.forEach(n0 => {
        let left = n0.q, first = true;
        while (left > 1e-6) {
          const take = Math.min(left, room);
          let rem = take; const parts = [];
          while (rem > 1e-6) { const f = QD.find(([v]) => v <= rem + 1e-6); parts.push(f[1]); rem -= f[0]; }
          parts.forEach((d, pi) => {
            const lastPiece = left - take < 1e-6 && pi === parts.length - 1;
            const n = Object.assign({}, first ? n0 : { k: n0.k }, { d }); delete n.q; delete n.be; first = false;
            if (!lastPiece) { if (n0.k.length) n.tie = true; } else { n.tie = n0.tie; if (n0.be) n.be = n0.be; }
            const b = bars[bi] = bars[bi] || {}; (b[id] = b[id] || []); (b[id][vi] = b[id][vi] || []).push(n);
          });
          left -= take; room -= take;
          if (room < 1e-6) { bi++; room = per; }
        }
      });
    }));
    return bars;
  }
  // a close, root-position-or-inverted triad/7th for the left hand (bass clef), as note names
  function lh(c, lo = 41) {
    const b = c.tones[c.bass]; let o = 2; while (midi(N(b.l, b.a, o)) < lo) o++; while (midi(N(b.l, b.a, o)) >= lo + 12) o--;
    const out = [N(b.l, b.a, o)];
    for (let i = 1; i < c.tones.length; i++) { const t = c.tones[(c.bass + i) % c.tones.length]; let x = N(t.l, t.a, out[i - 1].o); while (midi(x) <= midi(out[i - 1])) x = N(x.l, x.a, x.o + 1); out.push(x); }
    return out.map(nmO);
  }

  // A smoothly voice-led left-hand part for a chord progression: the bass note low (F2–E3), and the other chord tones
  // in close position above it (lowest about B2–A3, top no higher than D4), choosing each voicing to move as little as possible from the last.
  function lhSeq(chords, lo = 41) {
    let prev = null;
    return chords.map(c => {
      const b = c.tones[c.bass]; let o = 2; while (midi(N(b.l, b.a, o)) < lo) o++; while (midi(N(b.l, b.a, o)) >= lo + 12) o--;
      const bass = N(b.l, b.a, o), bm = midi(bass);
      let ups = c.tones.filter((t, i) => i !== c.bass || (c.tones.length === 3 && c.bass === 0));   // root-position triads keep all three tones above the bass (doubling the root); inversions and 7th chords leave out the bass tone
      if (ups.length > 3) ups = ups.slice(0, 3);
      const cands = [];
      ups.forEach((_, r) => {
        const order = ups.slice(r).concat(ups.slice(0, r));
        for (let oo = 2; oo <= 4; oo++) {
          const v = [N(order[0].l, order[0].a, oo)];
          for (let i = 1; i < order.length; i++) { let x = N(order[i].l, order[i].a, v[i - 1].o); while (midi(x) <= midi(v[i - 1])) x = N(x.l, x.a, x.o + 1); v.push(x); }
          const lowM = midi(v[0]), topM = midi(v[v.length - 1]);
          if (lowM >= Math.max(47, bm + 3) && lowM <= 57 && topM <= 62) cands.push(v);   // keep the chord below middle C as far as possible, under the melody
        }
      });
      const high = v => 2 * Math.max(0, midi(v[v.length - 1]) - 59);
      const cost = v => high(v) + (prev ? v.reduce((a, x, i) => a + Math.abs(midi(x) - midi(prev[Math.min(i, prev.length - 1)])), 0) : Math.abs(midi(v[0]) - 52));
      const best = cands.sort((x, y) => cost(x) - cost(y))[0] || lh(c, lo).slice(1).map(parse);
      prev = best;
      return [nmO(bass)].concat(best.map(nmO));
    });
  }


  // chord token like "5", "57", "26", "164", "765" (degree + optional figure) → diatonic chord with .rn and .deg
  const TINV = { "": 0, "6": 1, "64": 2, "7": 0, "65": 1, "43": 2, "42": 3 };
  function tok(k, t) {
    const m = /^(\d)(7|65|43|42|64|6)?$/.exec(t), d = +m[1], f = m[2] || "", sev = ["7", "65", "43", "42"].includes(f);
    const c = Object.assign(diat(k, d, sev, TINV[f]), { deg: d });
    let rn = rnOf(k, d);
    if (sev && c.q === "h7") rn = rn.replace("°", "") + "ø";
    c.rn = rn + f;
    return c;
  }


  // voice a list of chord tokens in four parts (tries a few times); o.sop: soprano tone index for the last chord
  function voiceToks(k, toks, o = {}) { for (let i = 0; i < 8; i++) { const chords = toks.map(t => typeof t === "string" ? tok(k, t) : t), vs = satb(k, chords, o); if (vs) return { k, chords, vs }; } return null; }
  const satbSpec = (x, o = {}) => ({ type: "voices", vf: x.k.vf, sig: x.k.sig, cols: satbCols(x.vs, o.labels === false ? null : x.chords.map((c, i) => (o.labs && o.labs[i] != null) ? o.labs[i] : c.rn)).map((c, i) => Object.assign(c, (o.hl || []).includes(i) ? { hl: true } : {})) });
  function satbFig(U, k, toks, cap, o = {}) { const x = voiceToks(k, toks, o); return x ? U.fig(satbSpec(x, o), cap, { small: o.small !== false, play: satbPlay(x.vs, o.gap || .9) }) : ""; }


  // ---------- a light SVG staff for interactive figures (clickable notes, arrows) ----------
  // Accidental shapes in staff-space units, anchored at (0, 0) = the line or space they belong to.
  const ACCP = {
    "1": { w: 1, top: -1.55, bot: 1.55, d: "M.25 -1.45h.12v3h-.12zM.63 -1.55h.12v3h-.12zM0 -.3L1 -.62v.26L0 -.04zM0 .52L1 .2v.26L0 .78z" },
    "0": { w: .72, top: -1.5, bot: 1.5, d: "M0 -1.5h.12v1.95H0zM.58 -.45h.12V1.5h-.12zM0 -.28L.7 -.5v.24L0 -.04zM0 .3L.7 .08v.24L0 .54z" },
    "-1": { w: .86, top: -1.45, bot: .55, d: "M0 -1.45h.14v2H0zM.14 .55C1.05 .05 1 -.6 .14 -.25V-.04C.66 -.34 .72 .1 .14 .36z" },
    "-2": { w: 1.56, top: -1.45, bot: .55, d: "M0 -1.45h.14v2H0zM.14 .55C1.05 .05 1 -.6 .14 -.25V-.04C.66 -.34 .72 .1 .14 .36zM.7 -1.45h.14v2H.7zM.84 .55C1.75 .05 1.7 -.6 .84 -.25V-.04C1.36 -.34 1.42 .1 .84 .36z" },
    "2": { w: .8, top: -.52, bot: .52, d: "M0 -.4L.28 0L0 .4L.12 .52L.4 .24L.68 .52L.8 .4L.52 0L.8 -.4L.68 -.52L.4 -.24L.12 -.52Z" },
  };
  // o.ks = { n, sh }: a key signature of n sharps (sh) or flats after the clef (treble or bass); notes then pass acc only where they differ from it.
  // o.extra(xs, stepY, y0, W) returns extra SVG drawn on top (e.g. labels under the notes); o.bottom adds room below.
  const KS_SH = [8, 5, 9, 6, 3, 7, 4], KS_FL = [4, 7, 3, 6, 2, 5, 1];   // treble-clef staff steps (E4 = 0); bass clef is two steps lower
  function miniStaff(o) {
    const sp = o.sp || 10, y0 = 40, x0 = 10, n = o.notes.length, dx = o.dx || 50, ksW = o.ks && o.ks.n ? o.ks.n * sp * 1.05 + 8 : 0, startX = (o.startX || 64) + ksW, W = o.w ? o.w + ksW : Math.max(240, startX + n * dx + 20);
    const lineY = i => y0 + i * sp, stepY = st => y0 + 4 * sp - st * sp / 2, ink = "currentColor";
    let g = "";
    for (let i = 0; i < 5; i++) g += `<line x1="${x0}" x2="${W - 6}" y1="${lineY(i)}" y2="${lineY(i)}" stroke="${ink}" stroke-width="1"/>`;
    // [glyph, reference line (0 = top), size, baseline offset below that line in staff spaces (measured from Noto Music)]
    const CL = { treble: ["&#x1D11E;", 3, 2.95, 1.1], bass: ["&#x1D122;", 1, 3.3, 3.08], alto: ["&#x1D121;", 2, 3.1, 2.2], tenor: ["&#x1D121;", 1, 3.1, 2.2] }[o.clef || "treble"];
    g += `<text x="${x0 + 4}" y="${lineY(CL[1]) + CL[3] * sp}" font-family="'Noto Music', serif" font-size="${sp * CL[2] * 1.4}" fill="${ink}" aria-hidden="true">${CL[0]}</text>`;
    if (o.ks && o.ks.n) { const shift = (o.clef || "treble") === "bass" ? -2 : 0, A = ACCP[o.ks.sh ? "1" : "-1"];
      (o.ks.sh ? KS_SH : KS_FL).slice(0, o.ks.n).forEach((st, j) => { g += `<path d="${A.d}" transform="translate(${(o.startX || 64) - 6 + j * sp * 1.05} ${stepY(st + shift)}) scale(${sp})" fill="${ink}"/>`; }); }
    const xs = [];
    o.notes.forEach((nt, i) => {
      const x = startX + i * dx + dx / 2, y = stepY(nt.s); xs.push([x, y]);
      let led = ""; for (let st = -2; st >= nt.s; st -= 2) led += `<line x1="${x - 11}" x2="${x + 11}" y1="${stepY(st)}" y2="${stepY(st)}" stroke="${ink}" stroke-width="1.2"/>`; for (let st = 10; st <= nt.s; st += 2) led += `<line x1="${x - 11}" x2="${x + 11}" y1="${stepY(st)}" y2="${stepY(st)}" stroke="${ink}" stroke-width="1.2"/>`;
      const acc = nt.acc != null && ACCP[nt.acc] ? `<path d="${ACCP[nt.acc].d}" transform="translate(${x - 9 - 8 - ACCP[nt.acc].w * sp} ${y}) scale(${sp})" fill="${nt.fill || ink}"/>` : "";
      const head = `<ellipse cx="${x}" cy="${y}" rx="${sp * .72}" ry="${sp * .5}" transform="rotate(-20 ${x} ${y})" fill="none" stroke="${nt.fill || ink}" stroke-width="${sp * .26}"/>`;
      const lab = nt.label ? `<text x="${x}" y="${y0 + 4 * sp + 30}" text-anchor="middle" font-size="13" fill="${ink}">${nt.label}</text>` : "";
      g += nt.attrs ? `<g ${nt.attrs}><rect x="${x - dx / 2 + 2}" y="${y0 - 34}" width="${dx - 4}" height="${4 * sp + 74}" rx="8" class="mshit"/>${led}${acc}${head}${lab}</g>` : led + acc + head + lab;
    });
    (o.arrows || []).forEach(([a, b, t]) => {
      const [xa, ya] = xs[a], [xb, yb] = xs[b], top = Math.min(ya, yb, y0) - 14;
      g += `<path d="M${xa} ${ya - 9} Q ${(xa + xb) / 2} ${top - 10} ${xb - 4} ${yb - 9}" fill="none" stroke="${ink}" stroke-width="1.6" marker-end="url(#ms-arr)"/>`;
      if (t) g += `<text x="${(xa + xb) / 2}" y="${top - 12}" text-anchor="middle" font-size="12" fill="${ink}">${t}</text>`;
    });
    const defs = `<defs><marker id="ms-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${ink}"/></marker></defs>`;
    if (o.extra) g += o.extra(xs, stepY, y0, W);
    const vh = (o.fitBottom ? Math.max(y0 + 4 * sp + 16, ...xs.map(([, y]) => y + 16)) + 14 : 4 * sp + 108) + (o.bottom || 0);   // o.fitBottom: no empty room below the staff unless a low note needs it
    return `<svg class="ministaff" viewBox="0 -14 ${W} ${vh}" role="${o.role || "img"}" ${o.label ? `aria-label="${esc(o.label)}"` : ""}>${defs}${g}</svg>`;
  }
  const H = { N, up, down, nm, nmO, nmSpoken, parse, midi, pc, samePC, mod, rnd, shuffle, mc, KEYS, key, deg, randKey, inKey, chord, diat, symOf, isChromatic, fig, rnOf, ROMAN, QUAL, QSYM, QNAME, grand, playOf, rnHTML, rnSpoken, symHTML, accHTML, esc, rich, plain, speak, LET, ACC, satb, satbCands, satbCols, satbPlay, pwIssues, perfectOf, ivl, letterStep, durOf, scorePlay, ltPC, toBars, lh, lhSeq, tok, withClick, withCount, singOf, singFile, voiceToks, satbSpec, satbFig, miniStaff, ACCP, play, dc: (k, d, sev, bass) => Object.assign(diat(k, d, sev, bass), { deg: d }) };

  // ---------- State ----------
  const MODES = FAM.modes.map(m => m.id);
  const DEFAULTS = { auto: false, topics: Object.fromEntries((FAM.topics || []).map(t => [t.id, t.on !== false])) };
  let S = { mode: MODES[0], settings: JSON.parse(JSON.stringify(DEFAULTS)), right: 0, total: 0, streak: 0, misses: [] };
  try { const saved = JSON.parse(localStorage.getItem(FAM.key) || "null"); if (saved) S = Object.assign(S, saved, { settings: Object.assign({}, S.settings, saved.settings, { topics: Object.assign({}, DEFAULTS.topics, (saved.settings || {}).topics) }) }); } catch (e) {}
  if (!MODES.includes(S.mode)) S.mode = MODES[0];
  const save = () => { try { localStorage.setItem(FAM.key, JSON.stringify({ mode: S.mode, settings: S.settings, right: S.right, total: S.total, streak: S.streak, misses: S.misses.slice(-40) })); } catch (e) {} };
  const Q = Object.fromEntries(MODES.map(m => [m, null]));
  const sameSpec = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const topicOn = t => !t || !FAM.topics || (Array.isArray(t) ? t.every(x => S.settings.topics[x] !== false) : S.settings.topics[t] !== false);
  H.topicOn = topicOn;
  H.topicsOn = () => (FAM.topics || []).filter(t => S.settings.topics[t.id] !== false).map(t => t.id);

  const hasDouble = c => /𝄪|𝄫/.test([c.text, c.answer, c.explain, ...(c.choices || [])].join(" "));
  function newQuestion(mode) {
    const prev = Q[mode];
    const review = S.misses.filter(m => m.mode === mode && (!prev || !sameSpec(m.c, prev.c)) && topicOn(m.c.topic));
    if (review.length && Math.random() < .3) { const sp = rnd(review); return { mode, c: sp.c, tries: 0, done: false, review: true, correctValue: sp.c.answer }; }
    for (let i = 0; i < 60; i++) {
      let c = null; try { c = FAM.make(mode, H); } catch (e) { if (i > 50) throw e; }
      if (c && !FAM.allowDouble && i < 55 && hasDouble(c)) continue;   // never ask about double sharps or flats (FAM.allowDouble: a drill that teaches them)
      if (c && (c.widget || c.choices.length >= 2) && topicOn(c.topic) && (!prev || prev.c.text !== c.text || plain(prev.c.answer) !== plain(c.answer) || i > 40)) return { mode, c, tries: 0, done: false, correctValue: c.answer };
    }
    const c = FAM.make(mode, H); return { mode, c, tries: 0, done: false, correctValue: c.answer };
  }

  // ---------- DOM ----------
  const $ = id => document.getElementById(id);
  const promptEl = $("prompt"), fb = $("feedback"), ansBox = $("answerBox"), work = $("work"), nextBtn = $("nextBtn");
  function renderScore() { $("scRight").textContent = S.right; $("scTotal").textContent = S.total; $("scStreak").textContent = S.streak; $("scoreText").textContent = `Score: ${S.right} correct out of ${S.total} answered. Streak: ${S.streak}.`; }
  function msg(cls, label, text) { return `<div class="verdict"><span class="pill ${cls}">${label}</span><span>${text}</span></div>`; }
  const modeInfo = m => FAM.modes.find(x => x.id === m);

  function renderPrompt() {
    const q = Q[S.mode], c = q.c;
    const tag = q.review ? ' <span class="pill warn">review</span>' : "";
    const appName = (window.__SA_APP && __SA_APP.name) || FAM.title || "";   // the drill app's name tops every question (handy in full screen and class games)
    let h = `<h2 class="kicker" id="qHead" tabindex="-1">${appName ? `<span class="kapp">${esc(appName)}</span><span class="ksep" aria-hidden="true"> · </span>` : ""}${esc(c.kicker || modeInfo(S.mode).kicker)}${tag}</h2>`;
    if (c.big) h += `<div class="ins">${c.bigFmt ? fmtVal(c.big, c.bigFmt) : rich(c.big)}</div>`;
    h += `<p class="q-text" id="qText">${rich(c.text)}</p>`;
    if (c.fig) h += `<div class="fig-box">${c.fig}</div>`;   // trusted HTML from the content file (e.g. pulse buttons)
    if (c.staff) h += `<div class="staff ${wideOf(c.staff)}" id="promptStaff"></div>`;
    if (c.playQ) h += PLAY_BTN(c.playQLabel || "Play", "q");
    promptEl.innerHTML = h;
    if (c.staff) drawStaff($("promptStaff"), c.staff);
    renderWork();
  }
  function choiceBtn(value, q) {
    let cls = "choice", mark = "";
    if (q.done) {
      if (value === q.correctValue) { cls += " right"; mark = `<span class="mark"><span aria-hidden="true">✓</span><span class="sr">correct answer</span></span>`; }
      else if (value === q.chosen) { cls += " wrong"; mark = `<span class="mark"><span aria-hidden="true">✗</span><span class="sr">your answer, incorrect</span></span>`; }
    }
    return `<button class="${cls}" data-v="${esc(value)}"${q.done ? " disabled" : ""}><span>${fmtVal(value, q.c.fmt)}</span>${mark}</button>`;
  }
  function renderWork() {
    const q = Q[S.mode], c = q.c, W = c.widget && FAM.widgets && FAM.widgets[c.widget];
    // custom answer widgets (e.g. drag a note): FAM.widgets[name] = { html(c, q, H), wire(root, c, q, H), value(root) }
    if (c.pick && !q.done) { work.innerHTML = `<p class="pick-hint">${rich(c.pick)}</p>`; return; }   // the answer is a click on the prompt's staff (see o.pick in drawScore); c.choices stay for class games
    if (c.pick) { work.innerHTML = ""; return; }
    if (W) { work.innerHTML = `<div class="widget">${W.html(c, q, H)}</div>${q.done ? "" : '<div class="choice-row"><button class="btn primary" data-wcheck disabled>Check</button></div>'}`; if (W.wire && !q.done) W.wire(work, c, q, H); return; }
    const short = c.fmt === "rn" || c.fmt === "sym" || c.choices.every(v => v.length <= 18);
    work.innerHTML = `<div class="choice-row ${c.fmt ? "fmt " + c.fmt : ""} ${short ? "" : "wide"}" role="group" aria-labelledby="qText">${c.choices.map(v => choiceBtn(v, q)).join("")}</div>`;
  }
  function renderControls() {
    const q = Q[S.mode];
    document.querySelectorAll(".modes [data-mode]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mode === S.mode)));
    const finished = q.done || q.revealed;
    nextBtn.textContent = finished ? "Next question" : "Skip";
    nextBtn.classList.toggle("primary", !!finished);
  }
  function score(q, correct) {
    if (q.tries > 0) return;
    S.total++;
    const sp = { mode: q.mode, c: q.c };
    if (correct) { S.right++; S.streak++; S.misses = S.misses.filter(m => !sameSpec(m.c, q.c)); }
    else { S.streak = 0; if (!S.misses.some(m => sameSpec(m.c, q.c))) S.misses.push(sp); }
    save(); renderScore();
  }
  function choose(value) {
    const q = Q[S.mode], c = q.c;
    if (q.done) return;
    const correct = value === q.correctValue;
    score(q, correct);
    q.tries++; q.done = true; q.chosen = value;
    renderWork();
    const A = fmtVal(c.answer, c.fmt);
    fb.innerHTML = msg(correct ? "good" : "bad", correct ? "Correct" : "Not quite", correct ? `${A}.` : `You chose ${fmtVal(value, c.fmt)}. The answer is ${A}.`);
    ansBox.innerHTML = `<div class="answer">${c.staffAns ? `<div class="staff ${wideOf(c.staffAns)}" id="ansStaff"></div>` : ""}${c.play ? PLAY_BTN(c.playLabel || "Play", "a") : ""}<p class="explain">${rich(c.explain)}</p></div>`;
    if (c.staffAns) drawStaff($("ansStaff"), c.staffAns);
    if (S.settings.auto && c.play) play(c.play);
    renderControls(); nextBtn.focus();
  }
  function reveal() { const q = Q[S.mode]; if (q.done) return; q.tries = 1; choose(q.correctValue); }
  work.addEventListener("click", e => { const w = e.target.closest("[data-wcheck]"); if (w && !w.disabled) { const q = Q[S.mode], W = FAM.widgets[q.c.widget], v = W && W.value(work); if (v != null) choose(v); return; } });
  work.addEventListener("click", e => { const b = e.target.closest("[data-v]"); if (b && !b.disabled) choose(b.dataset.v); });
  promptEl.addEventListener("sa-pick", e => { const q = Q[S.mode]; if (q && !q.done && q.c.pick) choose(e.detail); });
  document.addEventListener("click", e => { const b = e.target.closest("[data-play]"); if (b && Q[S.mode]) play(b.dataset.play === "a" ? Q[S.mode].c.play : Q[S.mode].c.playQ); });

  function clearAnswer() { fb.innerHTML = ""; ansBox.innerHTML = ""; }
  function next(focus = true) { stopSound(); Q[S.mode] = newQuestion(S.mode); clearAnswer(); renderPrompt(); renderControls(); if (focus) { const h = $("qHead"); if (h) h.focus(); } }
  function setMode(m) { if (S.mode === m) return; stopSound(); S.mode = m; save(); clearAnswer(); if (!Q[m] || Q[m].done) Q[m] = newQuestion(m); renderPrompt(); renderControls(); }

  // ---------- Events & settings ----------
  document.querySelectorAll(".modes [data-mode]").forEach(b => b.onclick = () => setMode(b.dataset.mode));
  nextBtn.onclick = () => next(true);
  function renderSettings() {
    document.querySelectorAll("[data-auto]").forEach(b => b.setAttribute("aria-pressed", String((S.settings.auto !== false) === (b.dataset.auto === "1"))));
    document.querySelectorAll("[data-topic]").forEach(b => b.setAttribute("aria-pressed", String(S.settings.topics[b.dataset.topic] !== false)));
  }
  const autoT = $("autoToggles"); if (autoT) autoT.onclick = e => { const b = e.target.closest("[data-auto]"); if (b) { S.settings.auto = b.dataset.auto === "1"; save(); renderSettings(); } };
  const topT = $("topicToggles");
  if (topT) {
    if (!(FAM.topics || []).length) topT.closest(".set-row").hidden = true;
    topT.innerHTML = (FAM.topics || []).map(t => `<button class="tog" data-topic="${t.id}">${esc(t.name)}${t.sub ? ` <small>${esc(t.sub)}</small>` : ""}</button>`).join("");
    topT.onclick = e => {
      const b = e.target.closest("[data-topic]"); if (!b) return;
      const t = b.dataset.topic, on = S.settings.topics[t] === false;
      const grp = (FAM.topics.find(x => x.id === t) || {}).group, same = FAM.topics.filter(x => x.group === grp).map(x => x.id);
      if (!on && same.filter(x => S.settings.topics[x] !== false).length === 1) return;   // keep at least one in each group
      S.settings.topics[t] = on; save(); renderSettings(); MODES.forEach(m => Q[m] = newQuestion(m)); clearAnswer(); renderPrompt(); renderControls();
    };
  }
  $("resetBtn").onclick = () => { S.misses = []; save(); $("resetBtn").textContent = "Review list cleared"; };
  let armTimer = null;
  $("scoreReset").onclick = () => {
    const b = $("scoreReset");
    if (!b.classList.contains("armed")) { b.classList.add("armed"); b.innerHTML = 'Tap again to reset<span class="sr"> the score</span>'; armTimer = setTimeout(() => { b.classList.remove("armed"); b.innerHTML = 'Reset<span class="sr"> score</span>'; }, 3000); return; }
    clearTimeout(armTimer); S.right = 0; S.total = 0; S.streak = 0; save(); renderScore(); b.classList.remove("armed"); b.innerHTML = 'Reset<span class="sr"> score</span>';
  };
  // Reference
  document.querySelectorAll(".ref-slot").forEach(el => { el.innerHTML = FAM.reference(H); el.querySelectorAll("[data-fig]").forEach(f => drawStaff(f, JSON.parse(f.dataset.fig))); });
  const dlg = $("refDialog"); let dlgReturn = null;
  $("refBtn").onclick = () => { dlgReturn = document.activeElement; if (dlg.showModal) dlg.showModal(); else { $("refPanel").open = true; $("refPanel").scrollIntoView(); return; } $("refClose").focus(); };
  $("refClose").onclick = () => dlg.close();
  dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", () => { if (dlgReturn && dlgReturn.focus) dlgReturn.focus(); });

  // ---------- Lesson (step-through) ----------
  const L = FAM.lesson, VKEY = FAM.key + ":view";
  // every lesson ends on a page that leads to its drills
  if (window.SA_PAGE && SA_PAGE.view === "lesson" && SA_PAGE.other && L && L.steps && !/^Practice/.test(L.steps[L.steps.length - 1].title)) {
    const modes = (FAM.modes || []).map(m => m.kicker).filter(Boolean);
    L.steps.push({ title: "Practice", kick: "On to the drills", render: () => `<p>You've finished the lesson. Now practice what you learned in the <b>${esc(SA_PAGE.otherName || "drills")}</b>${modes.length ? ":" : "."}</p>${modes.length ? `<ul>${modes.map(m => `<li>${esc(m)}</li>`).join("")}</ul>` : ""}
      <p>Each question explains its answer, and items you miss come back for review. Your progress is saved in this browser, and you can print a completion report for your professor. ${SA_PAGE.cls !== false ? "Teachers can also host the drills as a <b>class game</b>: students join on their own devices." : ""}</p>
      <p class="note">You can come back to any page of this lesson with the numbered buttons above.</p>` });
  }
  const lessonEl = $("lessonView"), drillEl = $("drillView");
  let LS = { step: 0, seen: [0], key: null, mode: null };
  try { LS = Object.assign(LS, JSON.parse(localStorage.getItem(FAM.key + ":lesson") || "{}")); } catch (e) {}
  { const mh = /[#&]step=(\d+)/.exec(location.hash); if (mh) { LS.step = Math.max(0, +mh[1] - 1); if (!LS.seen.includes(LS.step)) LS.seen.push(LS.step); } }   // deep link: lesson.html#step=N
  const saveL = () => { try { localStorage.setItem(FAM.key + ":lesson", JSON.stringify(LS)); } catch (e) {} };
  let figs = {};
  function lessonKey(st) {
    if (st.part && LS.part !== st.part) { LS.part = st.part; if (st.defMode) { LS.mode = st.defMode; LS.key = null; } }   // entering a new part of a combined lesson
    const modes = st.keyed === "both" ? ["major", "minor"] : [st.keyed];
    if (!LS.mode || !modes.includes(LS.mode)) LS.mode = (st.defMode || L.defMode) && modes.includes(st.defMode || L.defMode) ? (st.defMode || L.defMode) : modes[0];
    const list = KEYS[LS.mode];
    if (!LS.key || !list.includes(LS.key)) LS.key = st.defKey && list.includes(st.defKey) ? st.defKey : list[0];
    return key(LS.key, LS.mode);
  }
  function renderLesson(focus) {
    if (!L || !lessonEl) return;
    const i = Math.min(LS.step, L.steps.length - 1), st = L.steps[i];
    const k = st.keyed ? lessonKey(st) : null;
    figs = {};
    const fig = (spec, cap, opts = {}) => { const id = "f" + Object.keys(figs).length; figs[id] = { spec, follow: !!opts.follow, play: opts.play || (opts.play === false ? null : FAM.sing && spec.type === "score" ? singOf(spec) : playOf(spec)) }; if (opts.count) figs[id + "c"] = { spec, play: withCount(spec) };   // FAM.sing: the lesson's examples are sung (letter names) if (opts.count) figs[id + "c"] = { play: opts.count === true ? withCount(spec) : opts.count };   // opts.count: add a "Play with counting" button (spoken count)
      return `<figure class="lfig${opts.small ? " small" : ""}"><div class="staff ${wideOf(spec)}" data-lfig="${id}"></div>${cap ? `<figcaption>${richHTML(cap)}</figcaption>` : ""}${figs[id].play ? `<button class="play" data-lplay="${id}">${PLAY_SVG}${esc(opts.playLabel || "Play")}</button>` : ""}${opts.count ? `<button class="play" data-lplay="${id}c">${PLAY_SVG}Play with counting</button>` : ""}</figure>`; };
    const sound = (p, label) => { const id = "s" + Object.keys(figs).length; figs[id] = { play: p }; return `<button class="play" data-lplay="${id}">${PLAY_SVG}${esc(label || "Play")}</button>`; };
    const body = richHTML(st.render(H, k, { fig, sound, rich, rn: rnHTML, sym: symHTML }));
    const keyRow = st.keyed ? `<div class="lkeys" role="group" aria-label="Choose a key">${st.keyed === "both" ? ["major", "minor"].map(m => `<button class="lk mode" data-lmode="${m}" aria-pressed="${LS.mode === m}">${m}</button>`).join("") + '<span class="lk-sep" aria-hidden="true"></span>' : ""}${KEYS[LS.mode].map(n => `<button class="lk" data-lkey="${esc(n)}" aria-pressed="${LS.key === n}"><span aria-hidden="true">${accHTML(n)}</span><span class="sr">${esc(speak(n))} ${LS.mode}</span></button>`).join("")}</div>` : "";
    lessonEl.innerHTML = `<ol class="lsteps" aria-label="Lesson steps">${L.steps.map((s, j) => `${s.part && (j === 0 || L.steps[j - 1].part !== s.part) ? `<li class="lpart" aria-hidden="true">${esc(s.part)}</li>` : ""}<li><button data-lstep="${j}" ${j === i ? 'aria-current="step"' : ""} class="${LS.seen.includes(j) ? "seen" : ""}"><span aria-hidden="true">${j + 1}</span><span class="sr">Step ${j + 1}: ${esc(s.title)}</span></button></li>`).join("")}</ol>
      <article class="lslide" aria-labelledby="lsTitle"><p class="lkick">${st.part ? esc(st.part) + " · " : ""}Step ${i + 1} of ${L.steps.length}${st.kick ? " · " + esc(st.kick) : ""}</p><h2 id="lsTitle" tabindex="-1">${rich(st.title)}</h2>${keyRow}${body}
      <div class="lnav"><button class="btn" data-lgo="-1" ${i === 0 ? "disabled" : ""}>← Back</button>${i < L.steps.length - 1 ? `<button class="btn primary" data-lgo="1">Next: ${rich(L.steps[i + 1].title)} →</button>` : (window.SA_PAGE && SA_PAGE.view === "lesson" ? `<a class="btn primary" href="${esc(SA_PAGE.other)}">Start the drills →</a>` : `<button class="btn primary" data-view="drills">Start the drills →</button>`)}</div></article>`;
    lessonEl.querySelectorAll("[data-lfig]").forEach(el => { drawStaff(el, figs[el.dataset.lfig].spec); if (figs[el.dataset.lfig].follow) wireFollow(el, figs[el.dataset.lfig]); });
    lessonEl.querySelectorAll(".lq").forEach(bindCheck);
    if (st.after) st.after(lessonEl, H, k, { play, drawStaff });
    lessonEl.querySelectorAll(".ltable-wrap:not([tabindex])").forEach((w, i) => { w.tabIndex = 0; w.setAttribute("role", "region"); w.setAttribute("aria-label", (w.querySelector("caption") || {}).textContent || "Table"); });   // keyboard users can scroll wide tables
    if (focus) { const h = $("lsTitle"); if (h) h.focus(); }
  }
  // following figures (fig option follow: true): each note lights up while it sounds; click (or Enter/Space on) a note to hear it
  var followT = [];   // var + function declaration: stopSound() may run before this point
  function followClear() { (followT || []).forEach(clearTimeout); followT = []; document.querySelectorAll(".staff .nhl").forEach(g => g.classList.remove("nhl")); }
  function lightNote(g, ms) { g.classList.add("nhl"); followT.push(setTimeout(() => g.classList.remove("nhl"), ms)); }
  function followPlay(el, F) {
    followClear(); if (!el || !el._notes) return;
    const spb = 60 / (F.spec.bpm || 100), lead = 60;   // play() starts 60 ms ahead
    el._notes.forEach(x => { const d = durOf(x.n.d) * (x.n.tu ? (x.n.tuo || 2) / (x.n.tun || 3) : 1) * spb * 1000;
      followT.push(setTimeout(() => lightNote(x.g, Math.max(120, d * .95)), lead + x.q * spb * 1000)); });
  }
  function wireFollow(el, F) {
    const svg = el.querySelector("svg"); if (!svg || !el._notes) return;
    svg.setAttribute("role", "group");   // the notes inside are buttons
    el._notes.forEach(x => {
      const g = x.g, ms = x.n.k.map(k => midi(parse(k)));
      g.setAttribute("role", "button"); g.setAttribute("tabindex", "0"); g.classList.add("nclick");
      g.setAttribute("aria-label", "Play " + x.n.k.map(k => { const p = parse(k); return nmSpoken(p) + " " + p.o; }).join(" and "));
      const go = () => { followClear(); play({ chords: [ms], gap: 1.05 }); lightNote(g, 900); };
      g.addEventListener("click", go);
      g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    });
  }
  // quick-check questions inside lessons: <div class="lq" data-a="answer"> with .opt buttons
  function bindCheck(box) {
    box.addEventListener("click", e => {
      const b = e.target.closest(".opt"); if (!b || box.dataset.done) return;
      const ok = b.dataset.v === box.dataset.a; box.dataset.done = "1";
      box.querySelectorAll(".opt").forEach(x => { x.disabled = true; if (x.dataset.v === box.dataset.a) x.classList.add("right"); else if (x === b) x.classList.add("wrong"); });
      const f = box.querySelector(".lfb"); if (f) f.innerHTML = (ok ? "<b>Yes!</b> " : "<b>Not quite.</b> ") + (box.dataset.why ? rich(box.dataset.why) : "");
      if (window.SFX) SFX.play(ok);
    });
  }
  H.check = (q, a, w, why, fmt) => `<div class="lq" data-a="${esc(a)}" data-why="${esc(why || "").replace(/\{/g, "&#123;")}"><p class="lqq">${rich(q)}</p><div class="opts">${shuffle([a, ...w]).map(v => `<button class="opt" data-v="${esc(v)}">${fmtVal(v, fmt)}</button>`).join("")}</div><p class="lfb" aria-live="polite"></p></div>`;
  if (lessonEl) lessonEl.addEventListener("click", e => {
    const s = e.target.closest("[data-lstep]"), g = e.target.closest("[data-lgo]"), p = e.target.closest("[data-lplay]"), kb = e.target.closest("[data-lkey]"), mb = e.target.closest("[data-lmode]");
    if (s || g) { stopSound(); LS.step = s ? +s.dataset.lstep : Math.max(0, Math.min(L.steps.length - 1, LS.step + +g.dataset.lgo)); if (!LS.seen.includes(LS.step)) LS.seen.push(LS.step); saveL(); renderLesson(true); window.scrollTo({ top: Math.max(0, lessonEl.getBoundingClientRect().top + scrollY - 90), behavior: "smooth" }); return; }
    if (p && figs[p.dataset.lplay]) { const F = figs[p.dataset.lplay]; play(F.play); if (F.follow) followPlay(lessonEl.querySelector(`[data-lfig="${p.dataset.lplay}"]`), F); return; }
    if (kb) { LS.key = kb.dataset.lkey; saveL(); renderLesson(false); const again = lessonEl.querySelector(`[data-lkey="${CSS.escape(LS.key)}"]`); if (again) again.focus(); return; }
    if (mb) { LS.mode = mb.dataset.lmode; LS.key = null; saveL(); renderLesson(false); const again = lessonEl.querySelector(`[data-lmode="${LS.mode}"]`); if (again) again.focus(); }
  });
  // ← / → move between lesson steps (not while typing, choosing from a list, using a slider or another widget that uses arrow keys)
  if (lessonEl) document.addEventListener("keydown", e => {
    if (lessonEl.hidden || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
    const t = e.target; if (t && t.closest && t.closest("input, textarea, select, audio, video, iframe, [contenteditable], [role=slider], [role=listbox], [role=radiogroup], [role=tablist], [role=grid], .pbld, .gwrap")) return;
    const b = lessonEl.querySelector(`[data-lgo="${e.key === "ArrowLeft" ? -1 : 1}"]:not([disabled])`); if (b) { e.preventDefault(); b.click(); }
  });
  // Lesson / Drills switch
  function setView(v, focus) {
    if (!lessonEl) return;
    stopSound();
    const lesson = v === "lesson";
    lessonEl.hidden = !lesson; drillEl.hidden = lesson;
    document.querySelectorAll("[data-view]").forEach(b => { if (b.closest(".viewtabs")) b.setAttribute("aria-pressed", String(b.dataset.view === v)); });
    if (!window.SA_PAGE) try { localStorage.setItem(VKEY, v); } catch (e) {}
    if (lesson) renderLesson(focus); else if (focus) { const h = $("qHead"); if (h) h.focus(); }
    if (!lesson) redrawStaves();
  }
  document.addEventListener("click", e => { const b = e.target.closest("[data-view]"); if (b) { setView(b.dataset.view, true); if (!b.closest(".viewtabs")) window.scrollTo({ top: 0, behavior: "smooth" }); } });
  H.play = play; H.drawStaff = drawStaff;
  window.__harm = { H, FAM, newQuestion };   // for automated tests

  if (MODES.length) { MODES.forEach(m => Q[m] = newQuestion(m)); renderSettings(); renderScore(); renderPrompt(); renderControls(); }
  let v0 = "lesson"; try { v0 = localStorage.getItem(VKEY) || "lesson"; } catch (e) {}
  if (/[?&]solo=1/.test(location.search) || /join=/.test(location.hash)) v0 = "drills";
  if (window.SA_PAGE) v0 = SA_PAGE.view;   // separate lesson and drill pages
  setView(v0, false);
  // If a class game starts while the lesson is showing, switch to the drills.
  if (!window.SA_PAGE) new MutationObserver(() => { if (document.body.className.match(/\blc-/) && lessonEl && !lessonEl.hidden) setView("drills", false); }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", redrawStaves); } catch (e) {}
})();
