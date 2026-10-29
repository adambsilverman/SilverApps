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
  const accHTML = s => sdHTML(esc(s).replace(/([♭♯♮𝄫𝄪])/g, '<span class="acc">$1</span>'));
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
  const mc = (text, answer, wrong, explain, extra) => {
    const w = shuffle([...new Set(wrong.map(String))].filter(v => v !== String(answer))).slice(0, (extra && extra.nWrong) || 3);
    return Object.assign({ text, choices: shuffle([String(answer), ...w]), answer: String(answer), explain }, extra || {});
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
    const iv = t.map(n => mod(pc(n) - pc(r), 12)).join(",");
    const q = { "0,4,7": "M", "0,3,7": "m", "0,3,6": "d", "0,4,8": "A", "0,4,7,10": "7", "0,4,7,11": "M7", "0,3,7,10": "m7", "0,3,6,10": "h7", "0,3,6,9": "o7", "0,3,7,11": "mM7", "0,4,8,11": "AM7" }[iv] || "M";
    void t3;
    return QUAL[q] ? chord(r, q, bass) : Object.assign({ tones: t, q, bass, sym: nm(r) + "?" });
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
  const fmtVal = (v, f) => f === "rn" ? rnHTML(v) : f === "sym" ? symHTML(v) : accHTML(v);
  // inline markup in content text: {rn:V7/V} and {sym:F♯°7/A}
  const rich = s => sdHTML(esc(s)).replace(/\{rn:([^}]+)\}/g, (_, t) => rnHTML(t.replace(/&amp;/g, "&"))).replace(/\{sym:([^}]+)\}/g, (_, t) => symHTML(t)).replace(/(?<!"acc">)([♭♯♮𝄫𝄪])(?![^<]*>)/g, '<span class="acc">$1</span>');
  // the same inline markup inside HTML that is already escaped (lesson bodies): leaves tags and attributes alone
  const richHTML = s => sdHTML(String(s)).replace(/\{rn:([^}]+)\}/g, (_, t) => rnHTML(t)).replace(/\{sym:([^}]+)\}/g, (_, t) => symHTML(t)).replace(/(?<!"acc">)([♭♯𝄫𝄪])(?![^<]*>)/g, '<span class="acc">$1</span>');
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
  const playOf = spec => ({ chords: spec.cols.map(c => c.t.concat(c.b).map(s => midi(parse(s)))) });

  // ---------- Staff drawing (VexFlow) ----------
  function cssVar(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
  const VFACC = { "-2": "bb", "-1": "b", "0": "n", "1": "#", "2": "##" };
  function drawStaff(el, o) {
    el._args = o; el.innerHTML = "";
    if (!window.Vex || !Vex.Flow) { el.innerHTML = '<p class="staff-msg">The notation engine didn\'t load. Reload the page.</p>'; return; }
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
    const make = (clef, list, stem) => {
      const sorted = list.map(keyOf).sort((a, b) => midi(a.x) - midi(b.x));
      const sn = new VF.StaveNote({ clef, keys: sorted.map(y => y.k), duration: voiced ? "h" : "w", stem_direction: stem || 1, auto_stem: !stem && voiced });
      sorted.forEach((y, i) => { const a = accFor(y.x); if (a) sn.addModifier(new VF.Accidental(a), i); });
      sn.setStyle({ fillStyle: ink, strokeStyle: ink }); if (sn.setLedgerLineStyle) sn.setLedgerLineStyle({ strokeStyle: ink, fillStyle: ink });
      return sn;
    };
    const voices = [], notesAt = [];
    const lanes = voiced ? [["treble", "t", 1], ["treble", "a", -1], ["bass", "tn", 1], ["bass", "b", -1]] : [["treble", "t", 0], ["bass", "b", 0]];
    lanes.forEach(([clef, f, stem]) => {
      if (!cols.some(c => c[f] && c[f].length)) return;
      const tk = [];
      cols.forEach((c, i) => {
        if (i) tk.push(new VF.BarNote());
        const sn = c[f] && c[f].length ? make(clef, c[f], stem) : new VF.GhostNote({ duration: voiced ? "h" : "w" });
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
      cols.forEach((c, i) => {
        const sn = notesAt[i].find(x => x.getAbsoluteX) || notesAt[i][0], x = sn.getAbsoluteX() + 6;
        if (c.hl) mk("rect", { x: x - 22, y: yTop - 34, width: 46, height: yBot - yTop + 68, rx: 10, fill: cssVar("--hl") || "#F7E3A1", "fill-opacity": .85 }, svg, true);
        if (c.lab) rnSVG(mk, svg, x, yBot + 46, c.lab, ink);
        if (c.sym) { const t = mk("text", { x, y: yTop - 40, "text-anchor": "middle", "font-size": 17, "font-weight": 700, "font-family": "Literata, 'Noto Music', serif", fill: ink }, svg); t.textContent = c.sym; }
        if (c.tag) { const t = mk("text", { x, y: yBot + 66, "text-anchor": "middle", "font-size": 13, "font-family": "'Barlow Condensed', sans-serif", fill: ink }, svg); t.textContent = c.tag; }
      });
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
  function redrawStaves() { document.querySelectorAll(".staff").forEach(el => el._args && drawStaff(el, el._args)); }

  // ---------- Sound (Web Audio): soft keyboard tone; chords, progressions, or free events [midi, start, length] ----------
  let AC = null, bus = null;
  function audio() {
    if (AC) { if (AC.state === "suspended") AC.resume(); return AC; }
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    AC = new C(); const comp = AC.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4; comp.connect(AC.destination); AC._out = comp; return AC;
  }
  function newBus() { if (bus) { const old = bus; old.gain.setTargetAtTime(0, AC.currentTime, 0.04); setTimeout(() => old.disconnect(), 400); } bus = AC.createGain(); bus.gain.value = 1; bus.connect(AC._out); return bus; }
  function tone(out, m, t0, dur, vel = 1, timbre) {
    const f = 440 * Math.pow(2, (m - 69) / 12), g = AC.createGain(), lp = AC.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = Math.min(f * 7, 6000); g.connect(out); lp.connect(g);
    const parts = timbre === "voice" ? [[1, 1], [2, .35], [3, .15]] : [[1, 1], [2, .45], [3, .22], [4, .12]];
    parts.forEach(([h, a]) => { const o = AC.createOscillator(); o.type = timbre === "voice" ? "sine" : "triangle"; o.frequency.value = f * h; const og = AC.createGain(); og.gain.value = a / parts.length * 1.6; o.connect(og); og.connect(lp); o.start(t0); o.stop(t0 + dur + .6); });
    const pk = .22 * vel;
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(pk, t0 + .02);
    if (timbre === "voice") g.gain.setTargetAtTime(pk * .8, t0 + .05, .2); else g.gain.setTargetAtTime(pk * .45, t0 + .03, .5);
    g.gain.setTargetAtTime(0, t0 + dur, .08);
  }
  function play(p) {
    if (!p || !audio()) return; const out = newBus(), t = AC.currentTime + .06;
    if (p.ev) { p.ev.forEach(([m, s, d, v]) => tone(out, m, t + s, d, v || .8, p.timbre)); return; }
    const gap = p.gap || 1.05;
    (p.chords || [[p.m]]).forEach((ch, i) => ch.forEach(m => tone(out, m, t + i * gap, (p.dur || .95) * gap, 1 / Math.sqrt(ch.length) * 1.3, p.timbre)));
  }
  const stopSound = () => { if (bus && AC) { bus.gain.setTargetAtTime(0, AC.currentTime, .03); bus = null; } };
  const PLAY_SVG = '<svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M2 1l9 5-9 5z"/></svg>';
  const PLAY_BTN = (label, which) => `<div class="play-row"><button class="play" data-play="${which}">${PLAY_SVG}${esc(label)}</button></div>`;

  const H = { N, up, down, nm, nmO, nmSpoken, parse, midi, pc, samePC, mod, rnd, shuffle, mc, KEYS, key, deg, randKey, inKey, chord, diat, symOf, isChromatic, fig, rnOf, ROMAN, QUAL, QSYM, QNAME, grand, playOf, rnHTML, rnSpoken, symHTML, accHTML, esc, rich, plain, speak, LET, ACC };

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

  function newQuestion(mode) {
    const prev = Q[mode];
    const review = S.misses.filter(m => m.mode === mode && (!prev || !sameSpec(m.c, prev.c)) && topicOn(m.c.topic));
    if (review.length && Math.random() < .3) { const sp = rnd(review); return { mode, c: sp.c, tries: 0, done: false, review: true, correctValue: sp.c.answer }; }
    for (let i = 0; i < 60; i++) {
      let c = null; try { c = FAM.make(mode, H); } catch (e) { if (i > 50) throw e; }
      if (c && c.choices.length >= 2 && topicOn(c.topic) && (!prev || prev.c.text !== c.text || plain(prev.c.answer) !== plain(c.answer) || i > 40)) return { mode, c, tries: 0, done: false, correctValue: c.answer };
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
    let h = `<h2 class="kicker" id="qHead" tabindex="-1">${esc(c.kicker || modeInfo(S.mode).kicker)}${tag}</h2>`;
    if (c.big) h += `<div class="ins">${c.bigFmt ? fmtVal(c.big, c.bigFmt) : rich(c.big)}</div>`;
    h += `<p class="q-text" id="qText">${rich(c.text)}</p>`;
    if (c.staff) h += `<div class="staff ${c.staff.cols.length > 1 ? "wide" : "solo"}" id="promptStaff"></div>`;
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
    const q = Q[S.mode], c = q.c;
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
    ansBox.innerHTML = `<div class="answer">${c.staffAns ? `<div class="staff ${c.staffAns.cols.length > 1 ? "wide" : "solo"}" id="ansStaff"></div>` : ""}${c.play ? PLAY_BTN(c.playLabel || "Play", "a") : ""}<p class="explain">${rich(c.explain)}</p></div>`;
    if (c.staffAns) drawStaff($("ansStaff"), c.staffAns);
    if (S.settings.auto && c.play) play(c.play);
    renderControls(); nextBtn.focus();
  }
  function reveal() { const q = Q[S.mode]; if (q.done) return; q.tries = 1; choose(q.correctValue); }
  work.addEventListener("click", e => { const b = e.target.closest("[data-v]"); if (b && !b.disabled) choose(b.dataset.v); });
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
  const lessonEl = $("lessonView"), drillEl = $("drillView");
  let LS = { step: 0, seen: [0], key: null, mode: null };
  try { LS = Object.assign(LS, JSON.parse(localStorage.getItem(FAM.key + ":lesson") || "{}")); } catch (e) {}
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
    const fig = (spec, cap, opts = {}) => { const id = "f" + Object.keys(figs).length; figs[id] = { spec, play: opts.play || (spec.cols && spec.type !== "voices" ? playOf(spec) : null) }; return `<figure class="lfig${opts.small ? " small" : ""}"><div class="staff ${spec.cols.length > 1 ? "wide" : "solo"}" data-lfig="${id}"></div>${cap ? `<figcaption>${richHTML(cap)}</figcaption>` : ""}${figs[id].play ? `<button class="play" data-lplay="${id}">${PLAY_SVG}${esc(opts.playLabel || "Play")}</button>` : ""}</figure>`; };
    const sound = (p, label) => { const id = "s" + Object.keys(figs).length; figs[id] = { play: p }; return `<button class="play" data-lplay="${id}">${PLAY_SVG}${esc(label || "Play")}</button>`; };
    const body = richHTML(st.render(H, k, { fig, sound, rich, rn: rnHTML, sym: symHTML }));
    const keyRow = st.keyed ? `<div class="lkeys" role="group" aria-label="Choose a key">${st.keyed === "both" ? ["major", "minor"].map(m => `<button class="lk mode" data-lmode="${m}" aria-pressed="${LS.mode === m}">${m}</button>`).join("") + '<span class="lk-sep" aria-hidden="true"></span>' : ""}${KEYS[LS.mode].map(n => `<button class="lk" data-lkey="${esc(n)}" aria-pressed="${LS.key === n}"><span aria-hidden="true">${accHTML(n)}</span><span class="sr">${esc(speak(n))} ${LS.mode}</span></button>`).join("")}</div>` : "";
    lessonEl.innerHTML = `<ol class="lsteps" aria-label="Lesson steps">${L.steps.map((s, j) => `${s.part && (j === 0 || L.steps[j - 1].part !== s.part) ? `<li class="lpart" aria-hidden="true">${esc(s.part)}</li>` : ""}<li><button data-lstep="${j}" ${j === i ? 'aria-current="step"' : ""} class="${LS.seen.includes(j) ? "seen" : ""}"><span aria-hidden="true">${j + 1}</span><span class="sr">Step ${j + 1}: ${esc(s.title)}</span></button></li>`).join("")}</ol>
      <article class="lslide" aria-labelledby="lsTitle"><p class="lkick">${st.part ? esc(st.part) + " · " : ""}Step ${i + 1} of ${L.steps.length}${st.kick ? " · " + esc(st.kick) : ""}</p><h2 id="lsTitle" tabindex="-1">${rich(st.title)}</h2>${keyRow}${body}
      <div class="lnav"><button class="btn" data-lgo="-1" ${i === 0 ? "disabled" : ""}>← Back</button>${i < L.steps.length - 1 ? `<button class="btn primary" data-lgo="1">Next: ${rich(L.steps[i + 1].title)} →</button>` : (window.SA_PAGE && SA_PAGE.view === "lesson" ? `<a class="btn primary" href="${esc(SA_PAGE.other)}">Practice with the drills →</a>` : `<button class="btn primary" data-view="drills">Start the drills →</button>`)}</div></article>`;
    lessonEl.querySelectorAll("[data-lfig]").forEach(el => drawStaff(el, figs[el.dataset.lfig].spec));
    lessonEl.querySelectorAll(".lq").forEach(bindCheck);
    if (st.after) st.after(lessonEl, H, k, { play, drawStaff });
    if (focus) { const h = $("lsTitle"); if (h) h.focus(); }
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
    if (p && figs[p.dataset.lplay]) { play(figs[p.dataset.lplay].play); return; }
    if (kb) { LS.key = kb.dataset.lkey; saveL(); renderLesson(false); const again = lessonEl.querySelector(`[data-lkey="${CSS.escape(LS.key)}"]`); if (again) again.focus(); return; }
    if (mb) { LS.mode = mb.dataset.lmode; LS.key = null; saveL(); renderLesson(false); const again = lessonEl.querySelector(`[data-lmode="${LS.mode}"]`); if (again) again.focus(); }
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

  MODES.forEach(m => Q[m] = newQuestion(m));
  renderSettings(); renderScore(); renderPrompt(); renderControls();
  let v0 = "lesson"; try { v0 = localStorage.getItem(VKEY) || "lesson"; } catch (e) {}
  if (/[?&]solo=1/.test(location.search) || /join=/.test(location.hash)) v0 = "drills";
  if (window.SA_PAGE) v0 = SA_PAGE.view;   // separate lesson and drill pages
  setView(v0, false);
  // If a class game starts while the lesson is showing, switch to the drills.
  if (!window.SA_PAGE) new MutationObserver(() => { if (document.body.className.match(/\blc-/) && lessonEl && !lessonEl.hidden) setView("drills", false); }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", redrawStaves); } catch (e) {}
})();
