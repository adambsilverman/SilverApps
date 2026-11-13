
(() => {
  // ---------- Theory engine ----------
  const LET = "CDEFGAB";
  const NAT = [0, 2, 4, 5, 7, 9, 11];
  const MAJ = NAT, MIN = [0, 2, 3, 5, 7, 8, 10];
  const ACC = { "-2": "𝄫", "-1": "♭", "0": "", "1": "♯", "2": "𝄪" };
  const SPOKEN_ACC = { "-2": " double flat", "-1": " flat", "0": "", "1": " sharp", "2": " double sharp" };
  const pc = n => (((NAT[n.l] + n.a) % 12) + 12) % 12;
  const nName = n => LET[n.l] + ACC[n.a];
  const nSpoken = n => LET[n.l] + SPOKEN_ACC[n.a];
  const sameN = (a, b) => a.l === b.l && a.a === b.a;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // Accidental glyphs in the display font render poorly, so wrap them for Noto Music.
  const accHTML = s => esc(s).replace(/([♭♯♮𝄫𝄪])/g, '<span class="acc">$1</span>').replace(/(\d)̂/g, '<span class="sd">$1</span>');
  const speak = s => String(s).replace(/𝄫/g, " double flat").replace(/𝄪/g, " double sharp").replace(/♭/g, " flat").replace(/♯/g, " sharp").replace(/♮/g, " natural")
    .replace(/ø7/g, " half-diminished seventh").replace(/°7/g, " diminished seventh").replace(/°/g, " diminished").replace(/ø/g, " half-diminished");
  const clone = o => JSON.parse(JSON.stringify(o));
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  const rint = n => Math.floor(Math.random() * n);
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // Spell the note `semi` semitones above root, on the letter `deg` steps up (deg 1 = root letter).
  function spell(root, deg, semi) {
    const l = (((root.l + deg - 1) % 7) + 7) % 7;
    let d = (((pc(root) + semi - NAT[l]) % 12) + 12) % 12;
    if (d > 6) d -= 12;
    return { l, a: d };
  }
  const rootOf = s => ({ l: LET.indexOf(s[0]), a: s[1] === "#" ? 1 : s[1] === "b" ? -1 : 0 });

  // ---------- Keys ----------
  const LETFIFTHS = [0, 2, 4, -1, 1, 3, 5];
  const majorSig = t => LETFIFTHS[t.l] + 7 * t.a;
  const sigOf = k => majorSig(k.t) - (k.minor ? 3 : 0);
  const KS_NAME = { "-7": "Cb", "-6": "Gb", "-5": "Db", "-4": "Ab", "-3": "Eb", "-2": "Bb", "-1": "F", "0": "C", "1": "G", "2": "D", "3": "A", "4": "E", "5": "B", "6": "F#", "7": "C#" };
  const sigText = n => n === 0 ? "no sharps or flats" : `${Math.abs(n)} ${n > 0 ? "sharp" : "flat"}${Math.abs(n) > 1 ? "s" : ""}`;
  const kName = k => nName(k.t) + (k.minor ? " minor" : " major");
  const kMark = k => (k.minor ? LET[k.t.l].toLowerCase() : LET[k.t.l]) + ACC[k.t.a] + ":";
  const scaleOf = k => k.minor ? MIN : MAJ;
  const move = (k, letters, semis, minor) => ({ t: spell(k.t, letters + 1, semis), minor: !!minor });
  const keyOK = (k, lim = 6) => Math.abs(k.t.a) <= 1 && Math.abs(sigOf(k)) <= lim;
  const TONIC_NAMES = ["C", "G", "D", "A", "E", "B", "F#", "C#", "F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb", "G#", "D#", "A#"];
  function allKeys(lim) {
    const out = [];
    TONIC_NAMES.forEach(n => [false, true].forEach(m => { const k = { t: rootOf(n), minor: m }; if (keyOK(k, lim)) out.push(k); }));
    return out;
  }
  function pickKey(minor) {
    const pool = allKeys(S.settings.range).filter(k => minor === undefined || k.minor === minor);
    return clone(rnd(pool));
  }
  function closeKeys(k) {
    const rel = k.minor ? [[2, 3, false], [4, 7, true], [3, 5, true], [5, 8, false], [6, 10, false]] : [[4, 7, false], [3, 5, false], [5, 9, true], [2, 4, true], [1, 2, true]];
    return rel.map(([L, Sm, m]) => move(k, L, Sm, m));
  }

  // ---------- Chords ----------
  // Each quality lists [letter steps above the root, semitones above the root].
  const QUAL = {
    M: [[2, 4], [4, 7]], m: [[2, 3], [4, 7]], d: [[2, 3], [4, 6]], A: [[2, 4], [4, 8]],
    Mm7: [[2, 4], [4, 7], [6, 10]], mm7: [[2, 3], [4, 7], [6, 10]], MM7: [[2, 4], [4, 7], [6, 11]],
    hd7: [[2, 3], [4, 6], [6, 10]], d7: [[2, 3], [4, 6], [6, 9]], Ger: [[2, 4], [4, 7], [5, 10]],
  };
  const build = (root, q) => [root].concat(QUAL[q].map(([s, st]) => spell(root, s + 1, st)));
  const rootIn = (k, deg, alt = 0) => spell(k.t, deg, scaleOf(k)[deg - 1] + alt);
  const mkc = (root, q, rn, inv = 0) => { const tones = build(root, q); return { tones, q, bass: tones[inv], rn }; };
  // Diatonic chords: [degree, alteration from the key's scale, quality, numeral].
  const DIA = {
    maj: [[1, 0, "M", "I"], [2, 0, "m", "ii"], [3, 0, "m", "iii"], [4, 0, "M", "IV"], [5, 0, "M", "V"], [6, 0, "m", "vi"], [7, 0, "d", "vii°"]],
    min: [[1, 0, "m", "i"], [2, 0, "d", "ii°"], [3, 0, "M", "III"], [4, 0, "m", "iv"], [5, 0, "M", "V"], [6, 0, "M", "VI"], [7, 1, "d", "vii°"]],
  };
  const DIA7 = {
    maj: [[5, 0, "Mm7", "V"], [7, 0, "hd7", "viiø"], [2, 0, "mm7", "ii"]],
    min: [[5, 0, "Mm7", "V"], [7, 1, "d7", "vii°"], [2, 0, "hd7", "iiø"]],
  };
  const tonicRn = k => k.minor ? "i" : "I";
  function dc(k, rn, inv = 0) {
    const seventh = rn.endsWith("7"), base = seventh ? rn.slice(0, -1) : rn;
    const e = (seventh ? DIA7 : DIA)[k.minor ? "min" : "maj"].find(x => x[3] === base);
    if (!e) throw new Error("No " + rn);
    return mkc(rootIn(k, e[0], e[1]), e[2], base, inv);
  }
  const diaTriads = k => DIA[k.minor ? "min" : "maj"].map(e => mkc(rootIn(k, e[0], e[1]), e[2], e[3]));
  const diaAll = k => diaTriads(k).concat(DIA7[k.minor ? "min" : "maj"].map(e => mkc(rootIn(k, e[0], e[1]), e[2], e[3])));
  const sameSet = (a, b) => a.length === b.length && a.every(n => b.some(m => sameN(m, n)));
  const samePcs = (a, b) => a.length === b.length && a.every(n => b.some(m => pc(m) === pc(n)));
  const inKey = (c, k) => !!k && !c.lone && diaAll(k).some(d => sameSet(d.tones, c.tones));
  const inKeyPc = (c, k) => !!k && !c.lone && diaAll(k).some(d => samePcs(d.tones, c.tones));
  const T = k => dc(k, tonicRn(k));
  // Secondary dominant (or leading-tone seventh) of the chord on `tDeg`.
  function sec(k, tDeg, tAlt, tRn, q = "Mm7", inv = 0) {
    const target = rootIn(k, tDeg, tAlt);
    const lt = q === "d7";
    return mkc(lt ? spell(target, 7, 11) : spell(target, 5, 7), q, (lt ? "vii°" : "V") + "/" + tRn, inv);
  }

  // Chord symbols and Roman-numeral labels. A label is "base^figure/secondary", e.g. "V^65/V".
  const SUF = { M: "", m: "m", d: "°", A: "+", Mm7: "7", mm7: "m7", MM7: "maj7", hd7: "ø7", d7: "°7", Ger: " Ger+6" };
  const symOf = (tones, q, bass) => nName(tones[0]) + SUF[q] + (bass && pc(bass) !== pc(tones[0]) && q !== "Ger" ? "/" + nName(bass) : "");
  function figOf(r, bass) {
    if (r.q === "Ger") return "";
    const i = r.tones.findIndex(t => pc(t) === pc(bass));
    return r.tones.length === 4 ? ["7", "65", "43", "42"][i] : ["", "6", "64"][i];
  }
  function labelOf(r, bass) {
    const f = figOf(r, bass), k = r.rn.indexOf("/");
    const base = k < 0 ? r.rn : r.rn.slice(0, k), secd = k < 0 ? "" : r.rn.slice(k);
    return base + (f ? "^" + f : "") + secd;
  }
  function rnParts(s) {
    const m = /^([^\^\/]*)(?:\^(\d+))?(\/.*)?$/.exec(s || "");
    return m ? { base: m[1] || "", fig: m[2] || "", sec: m[3] || "" } : { base: s, fig: "", sec: "" };
  }
  const withFig = (s, f) => { const p = rnParts(s); return p.base + (f ? "^" + f : "") + p.sec; };
  function rnHTML(s) {
    const { base, fig, sec: sc } = rnParts(s);
    let f = "";
    if (fig.length === 1) f = `<sup class="fig">${fig}</sup>`;
    else if (fig.length === 2) f = `<span class="fig2"><span>${fig[0]}</span><span>${fig[1]}</span></span>`;
    return `<span class="rn">${accHTML(base)}${f}${accHTML(sc)}</span>`;
  }
  const FIGWORD = { "7": " seven", "6": " six", "64": " six-four", "65": " six-five", "43": " four-three", "42": " four-two" };
  function rnSpoken(s) {
    const { base, fig, sec: sc } = rnParts(s);
    return speak(base.replace(/^♭/, "flat ")).replace("+6", " augmented sixth") + (FIGWORD[fig] || "") + (sc ? " of " + speak(sc.slice(1)) : "");
  }
  const rnA = s => `<span aria-hidden="true">${rnHTML(s)}</span><span class="sr">${esc(rnSpoken(s))}</span>`;
  const stackHTML = (top, bot) => `<span class="stack" aria-hidden="true"><span>${rnHTML(top)}</span><span>${rnHTML(bot)}</span></span><span class="sr">${esc(rnSpoken(top))} over ${esc(rnSpoken(bot))}</span>`;

  // Row helpers: r1 = analysis in the old key (top line), r2 = new key (bottom line).
  const O = c => { c.r1 = { rn: c.rn, tones: c.tones, q: c.q }; return c; };
  const Nw = (c, k2) => { c.r2 = { rn: c.rn, tones: c.tones, q: c.q }; if (k2) c.mark2 = kMark(k2); return c; };
  const ann = (c, a) => { c.ann = a; return c; };
  // A pivot: `a` read in the old key, `b` in the new key; `show` picks the spelling on the staff.
  function P(a, b, k2, opts = {}) {
    const s = opts.show === "b" ? b : a, o = s === a ? b : a;
    const inv = opts.inv || 0;
    const c = { tones: s.tones, q: s.q, bass: s.tones[inv], r1: a.rn ? { rn: a.rn, tones: a.tones, q: a.q } : null, r2: { rn: b.rn, tones: b.tones, q: b.q }, mark2: kMark(k2), ann: opts.ann || "pivot", piv: true };
    if (!sameSet(a.tones, b.tones)) c.alt = { tones: o.tones, q: o.q };
    return c;
  }

  // ---------- Progression generators (one per method on the Modulation Techniques page) ----------
  function genDiatonic() {
    const k1 = pickKey(), k2 = rnd(closeKeys(k1).filter(k => keyOK(k, 7)));
    if (!k2) return null;
    const d1 = diaTriads(k1), d2 = diaTriads(k2);
    let commons = [];
    d1.forEach(a => { const b = d2.find(x => sameSet(x.tones, a.tones)); if (b && !/^(I|i|V)$/.test(b.rn)) commons.push([a, b]); });
    const pref = commons.filter(([, b]) => ["ii", "IV", "vi", "iv", "VI", "ii°"].includes(b.rn));
    if (pref.length) commons = pref;
    if (!commons.length) return null;
    const [a, b] = rnd(commons);
    const inv = a.q === "d" ? 1 : (Math.random() < .3 ? 1 : 0);
    const xs = d1.filter(c => !d2.some(x => sameSet(x.tones, c.tones)) && !/^(I|i)$/.test(c.rn));
    const ch = [O(T(k1))];
    if (xs.length && Math.random() < .85) { const x = rnd(xs); ch.push(O(dc(k1, x.rn, x.q === "d" ? 1 : 0))); }
    ch.push(P(a, b, k2, { inv }));
    if (Math.random() < .45) ch.push(ann(Nw(dc(k2, tonicRn(k2), 2)), "cad. 6/4"));
    ch.push(Nw(dc(k2, "V7")), Nw(T(k2)));
    return { type: "diatonic", k1, k2, chords: ch };
  }

  function genChromatic() {
    const v = rint(7);
    const maj = () => pickKey(false);
    if (v === 0) { // I in the old key = ♭III in the new
      const k1 = maj(), k2 = move(k1, -2, -3, false);
      return { type: "chromatic", k1, k2, chords: [O(T(k1)), O(dc(k1, "V", 1)), P(T(k1), mkc(rootIn(k2, 3, -1), "M", "♭III"), k2), Nw(dc(k2, "IV")), Nw(dc(k2, "V7")), Nw(T(k2))] };
    }
    if (v === 1) { // I = ♭VI
      const k1 = maj(), k2 = move(k1, 2, 4, false);
      return { type: "chromatic", k1, k2, chords: [O(T(k1)), O(dc(k1, "ii", 1)), O(dc(k1, "V")), P(T(k1), mkc(rootIn(k2, 6, -1), "M", "♭VI"), k2), Nw(dc(k2, "V7")), Nw(T(k2))] };
    }
    if (v === 2) { // IV = ♭VI
      const k1 = maj(), k2 = move(k1, -2, -3, false);
      return { type: "chromatic", k1, k2, chords: [O(T(k1)), O(dc(k1, "vi")), P(dc(k1, "IV"), mkc(rootIn(k2, 6, -1), "M", "♭VI"), k2), ann(Nw(dc(k2, "I", 2)), "cad. 6/4"), Nw(dc(k2, "V7")), Nw(T(k2))] };
    }
    if (v === 3) { // vi = borrowed iv
      const k1 = maj(), k2 = move(k1, 2, 4, false);
      return { type: "chromatic", k1, k2, chords: [O(T(k1)), O(dc(k1, "V", 1)), P(dc(k1, "vi"), mkc(rootIn(k2, 4, 0), "m", "iv"), k2), ann(Nw(dc(k2, "I", 2)), "cad. 6/4"), Nw(dc(k2, "V7")), Nw(T(k2))] };
    }
    if (v === 4) { // ii = borrowed iv
      const k1 = maj(), k2 = move(k1, 5, 9, false);
      return { type: "chromatic", k1, k2, chords: [O(T(k1)), O(dc(k1, "vi")), P(dc(k1, "ii"), mkc(rootIn(k2, 4, 0), "m", "iv"), k2), ann(Nw(dc(k2, "I", 2)), "cad. 6/4"), Nw(dc(k2, "V7")), Nw(T(k2))] };
    }
    if (v === 5) { // IV = Neapolitan
      const k1 = maj(), k2 = move(k1, 2, 4, Math.random() < .5);
      return { type: "chromatic", k1, k2, chords: [O(T(k1)), O(dc(k1, "V", 1)), P(dc(k1, "IV"), mkc(rootIn(k2, 2, -1), "M", "♭II"), k2, { inv: 1 }), ann(Nw(dc(k2, tonicRn(k2), 2)), "cad. 6/4"), Nw(dc(k2, "V7")), Nw(T(k2))] };
    }
    // minor: VI = Neapolitan of the dominant key
    const k1 = pickKey(true), k2 = move(k1, 4, 7, Math.random() < .5);
    return { type: "chromatic", k1, k2, chords: [O(T(k1)), O(dc(k1, "iv")), P(dc(k1, "VI"), mkc(rootIn(k2, 2, -1), "M", "♭II"), k2, { inv: 1 }), ann(Nw(dc(k2, tonicRn(k2), 2)), "cad. 6/4"), Nw(dc(k2, "V7")), Nw(T(k2))] };
  }

  function genEnharmonic() {
    if (Math.random() < .65) { // fully diminished seventh, respelled
      const k1 = pickKey();
      const [L, Sm] = rnd([[2, 3], [3, 6], [4, 6], [5, 9]]);
      const k2 = move(k1, L, Sm, Math.random() < .6);
      if (!keyOK(k2, 6)) return null;
      const a = mkc(rootIn(k1, 7, k1.minor ? 1 : 0), "d7", "vii°"), b = mkc(rootIn(k2, 7, k2.minor ? 1 : 0), "d7", "vii°");
      if (!samePcs(a.tones, b.tones)) return null;
      const show = Math.random() < .6 ? "b" : "a";
      const pd1 = k1.minor ? "iv" : "IV", pd2 = k2.minor ? "iv" : "IV";
      return { type: "enharmonic", sub: "dim7", k1, k2, chords: [O(T(k1)), O(dc(k1, pd1)), P(a, b, k2, { show, inv: rint(3) }), Nw(T(k2)), Nw(dc(k2, pd2)), Nw(dc(k2, "V7")), Nw(T(k2))] };
    }
    if (Math.random() < .5) { // V7 of the old key = Ger+6 of the key a half step lower
      const k1 = pickKey(false), k2 = move(k1, -1, -1, Math.random() < .5);
      const a = dc(k1, "V7"), b = mkc(rootIn(k2, 6, k2.minor ? 0 : -1), "Ger", "Ger+6");
      if (!samePcs(a.tones, b.tones)) return null;
      return { type: "enharmonic", sub: "ger", k1, k2, chords: [O(T(k1)), O(dc(k1, "IV")), P(a, b, k2, { show: rnd(["a", "b"]) }), ann(Nw(dc(k2, tonicRn(k2), 2)), "cad. 6/4"), Nw(dc(k2, "V7")), Nw(T(k2))] };
    }
    // Ger+6 of the old key = V7 of the key a half step higher
    const k1 = pickKey(), k2 = move(k1, 1, 1, false);
    const a = mkc(rootIn(k1, 6, k1.minor ? 0 : -1), "Ger", "Ger+6"), b = dc(k2, "V7");
    if (!samePcs(a.tones, b.tones)) return null;
    return { type: "enharmonic", sub: "ger", k1, k2, chords: [O(T(k1)), O(dc(k1, k1.minor ? "iv" : "IV", 1)), P(a, b, k2, { show: rnd(["a", "b"]) }), Nw(T(k2)), Nw(dc(k2, "IV")), Nw(dc(k2, "V7")), Nw(T(k2))] };
  }

  function genCommonTone() {
    const k1 = pickKey(), t1 = T(k1);
    const cands = [];
    // One spelling per key: the one whose signature sits nearest the old key's.
    const best = {};
    allKeys(6).forEach(k => { const id = pc(k.t) + (k.minor ? "m" : ""); if (!best[id] || Math.abs(sigOf(k) - sigOf(k1)) < Math.abs(sigOf(best[id]) - sigOf(k1))) best[id] = k; });
    Object.values(best).forEach(k2 => {
      const dd = ((sigOf(k2) - sigOf(k1)) % 12 + 12) % 12;
      if (pc(k2.t) === pc(k1.t) || dd <= 1 || dd >= 11) return;
      [T(k2), dc(k2, "V7")].forEach((J, ji) => {
        const sh = t1.tones.filter(a => J.tones.some(b => pc(a) === pc(b)));
        if (sh.length !== 1 || inKeyPc(t1, k2) || inKeyPc(J, k1)) return;
        cands.push({ k2, ji, ct: sh[0] });
      });
    });
    if (!cands.length) return null;
    const tonics = cands.filter(c => c.ji === 0);
    const c = tonics.length && Math.random() < .65 ? rnd(tonics) : rnd(cands);
    const k2 = clone(c.k2), ctp = pc(c.ct);
    const last1 = O(T(k1)); last1.top = ctp;
    const J = ann(Nw(c.ji === 0 ? T(k2) : dc(k2, "V7"), k2), "new key"); J.top = ctp;
    const pd2 = k2.minor ? "iv" : "IV";
    const ch = [O(T(k1)), O(dc(k1, "V7")), last1, { lone: true, tone: c.ct, ann: "common tone" }, J];
    if (c.ji === 0) ch.push(Nw(dc(k2, pd2)), Nw(dc(k2, "V7")), Nw(T(k2)));
    else ch.push(Nw(T(k2)), Nw(dc(k2, pd2)), Nw(dc(k2, "V7")), Nw(T(k2)));
    return { type: "commontone", k1, k2, chords: ch };
  }

  function genShift() {
    const v = rnd(["dom", "min", "min", "maj", "ger"]);
    const qs = { ann: "quality shift" };
    if (v === "dom") { // minor tonic → dominant seventh on the same root, leading to the subdominant key
      const k1 = pickKey(true), k2 = move(k1, 3, 5, Math.random() < .5);
      return { type: "shift", sub: v, k1, k2, chords: [O(T(k1)), O(dc(k1, "V7")), O(T(k1)), P(mkc(k1.t, "Mm7", "V/iv"), mkc(k1.t, "Mm7", "V"), k2, qs), Nw(T(k2)), Nw(dc(k2, k2.minor ? "iv" : "IV")), Nw(dc(k2, "V7")), Nw(T(k2))] };
    }
    if (v === "min") { // major tonic → minor
      const k1 = pickKey(false);
      const w = rnd([["vi", 2, 3, false], ["ii", -1, -2, false], ["iv", 4, 7, true]]);
      const k2 = move(k1, w[1], w[2], w[3]);
      const tail = w[0] === "vi" ? [Nw(dc(k2, "ii", 1)), Nw(dc(k2, "V7")), Nw(T(k2))]
        : [ann(Nw(dc(k2, tonicRn(k2), 2)), "cad. 6/4"), Nw(dc(k2, "V7")), Nw(T(k2))];
      return { type: "shift", sub: v, k1, k2, chords: [O(T(k1)), O(dc(k1, "V7")), O(T(k1)), P(mkc(k1.t, "m", "i"), mkc(k1.t, "m", w[0]), k2, qs), ...tail] };
    }
    if (v === "maj") { // minor tonic → major
      const k1 = pickKey(true);
      const iv = Math.random() < .5;
      const k2 = iv ? move(k1, 4, 7, false) : move(k1, 3, 5, Math.random() < .5);
      const tail = iv ? [ann(Nw(dc(k2, "I", 2)), "cad. 6/4"), Nw(dc(k2, "V7")), Nw(T(k2))] : [Nw(T(k2)), Nw(dc(k2, k2.minor ? "iv" : "IV")), Nw(dc(k2, "V7")), Nw(T(k2))];
      return { type: "shift", sub: v, k1, k2, chords: [O(T(k1)), O(dc(k1, "V7")), O(T(k1)), P(mkc(k1.t, "M", "I"), mkc(k1.t, "M", iv ? "IV" : "V"), k2, qs), ...tail] };
    }
    // major tonic → German augmented sixth (its ♯4̂ and ♭6̂ point to 5̂ of the new key)
    const k1 = pickKey(false), k2 = move(k1, 2, 4, false);
    const g = mkc(k1.t, "Ger", "Ger+6");
    return { type: "shift", sub: v, k1, k2, chords: [O(T(k1)), O(dc(k1, "V7")), O(T(k1)), P({ tones: g.tones, q: "Ger", rn: null }, g, k2, qs), ann(Nw(dc(k2, "I", 2)), "cad. 6/4"), Nw(dc(k2, "V7")), Nw(T(k2))] };
  }

  function genSequence() {
    const up = Math.random() < .5, [L, Sm] = up ? [1, 2] : [-1, -2];
    const k1 = pickKey(false), via = move(k1, L, Sm, false), k2 = move(via, L, Sm, false);
    if (!keyOK(via, 6) || !keyOK(k2, 6)) return null;
    return { type: "sequence", k1, k2, via, dir: up ? "up" : "down", chords: [
      O(T(k1)), ann(O(dc(k1, "ii")), "model"), O(dc(k1, "V7")),
      ann(Nw(dc(via, "ii"), via), "copy"), Nw(dc(via, "V7")),
      ann(Nw(dc(k2, "ii"), k2), "copy"), Nw(dc(k2, "V7")), Nw(T(k2))] };
  }

  function genDirect() {
    const k1 = pickKey();
    const [L, Sm] = rnd([[1, 1], [1, 2], [1, 1], [1, 2], [2, 3], [2, 4], [-1, -2], [5, 9], [-2, -4]]);
    const k2 = move(k1, L, Sm, k1.minor);
    if (!keyOK(k2, 6) || inKeyPc(T(k1), k2) || inKeyPc(T(k2), k1)) return null;
    const pd1 = k1.minor ? "iv" : "IV", pd2 = k2.minor ? "iv" : "IV";
    const end = ann(O(T(k1)), "cadence"); end.end = true;
    const ch = [O(T(k1)), O(dc(k1, pd1)), O(dc(k1, "V7")), end];
    const turn = Math.random() < .4;
    if (turn) ch.push(ann(Nw(dc(k2, "V7"), k2), "turnaround"));
    ch.push(ann(Nw(T(k2), turn ? null : k2), "new phrase"), Nw(dc(k2, pd2)), Nw(dc(k2, "V7")), Nw(T(k2)));
    return { type: "direct", k1, k2, chords: ch, turn, step: L === 1 ? Sm : 0 };
  }

  function genTonicize() {
    const k1 = pickKey(), mi = k1.minor, v = rint(3);
    if (v === 0) { // V tonicized right before a half cadence
      const s = Math.random() < .6 ? sec(k1, 5, 0, "V", "Mm7", 1) : sec(k1, 5, 0, "V", "d7", 0);
      const last = ann(O(dc(k1, "V")), "half cadence");
      return { type: "tonicize", k1, k2: null, hc: true, target: "V", chords: [O(T(k1)), O(dc(k1, mi ? "iv" : "vi")), ann(O(s), "tonicizes V"), last] };
    }
    if (v === 1) { // a chord tonicized mid-phrase, then a cadence at home
      const t = rnd(mi ? [["iv", 4, "V7"], ["III", 3, "iv"], ["VI", 6, "ii°"]] : [["vi", 6, "IV"], ["ii", 2, "V7"], ["IV", 4, "ii"]]);
      const s = sec(k1, t[1], 0, t[0], "Mm7", rint(2));
      const after = t[2] === "V7" ? [] : [O(dc(k1, t[2], t[2].includes("°") || t[2] === "ii" ? 1 : 0))];
      return { type: "tonicize", k1, k2: null, target: t[0], chords: [O(T(k1)), ann(O(s), "tonicizes " + t[0]), O(dc(k1, t[0])), ...after, O(dc(k1, "V7")), ann(O(T(k1)), "cadence")] };
    }
    const s = sec(k1, 5, 0, "V", "Mm7", 1);
    return { type: "tonicize", k1, k2: null, target: "V", chords: [O(T(k1)), O(dc(k1, mi ? "iv" : "IV")), ann(O(s), "tonicizes V"), O(dc(k1, "V7")), ann(O(T(k1)), "cadence")] };
  }

  const GEN = { direct: genDirect, diatonic: genDiatonic, chromatic: genChromatic, enharmonic: genEnharmonic, commontone: genCommonTone, shift: genShift, sequence: genSequence, tonicize: genTonicize };

  // The textbook test for a diatonic pivot: find the first chord foreign to the old key, step back one
  // (and back past a cadential 6/4 of the new key). If that chord is diatonic in the new key, it's the pivot.
  const firstForeign = p => p.chords.findIndex(c => !c.lone && !inKey(c, p.k1));
  function isCad64(c, k) {
    if (!k || c.lone) return false;
    const t = T(k);
    return sameSet(c.tones, t.tones) && pc(c.bass) === pc(t.tones[2]);
  }
  function rulePivot(p) {
    const f = firstForeign(p);
    if (f < 1 || !p.k2) return null;
    let j = f - 1, cad = false;
    if (j > 0 && isCad64(p.chords[j], p.k2)) { j--; cad = true; }
    if (p.chords[j].lone) return null;
    return inKey(p.chords[j], p.k2) ? { j, cad } : null;
  }

  function fin(p) {
    p.chords.forEach(c => {
      if (c.lone) return;
      c.sym = symOf(c.tones, c.q, c.bass);
      if (c.alt) { const ab = c.alt.tones.find(t => pc(t) === pc(c.bass)); c.altSym = symOf(c.alt.tones, c.alt.q, ab); }
      if (c.r1) c.l1 = labelOf(c.r1, c.bass);
      if (c.r2) c.l2 = labelOf(c.r2, c.bass);
      delete c.r1; delete c.r2; delete c.rn; delete c.alt;
    });
    p.pivot = p.chords.findIndex(c => c.piv);
    const lone = p.chords.findIndex(c => c.lone);
    p.hl = p.pivot >= 0 ? p.pivot : lone >= 0 ? lone : p.type === "direct" ? p.chords.findIndex(c => c.ann === "new phrase") : -1;
    p.id = [p.type, kName(p.k1), p.k2 ? kName(p.k2) : "", p.chords.map(c => c.lone ? "·" + nName(c.tone) : c.sym).join(" ")].join("|");
    return p;
  }
  function validate(p) {
    if (p.chords.length > 9) return false;
    if (p.chords.some(c => !c.lone && c.tones.some(t => Math.abs(t.a) > 2))) return false;
    if (p.k2 && !keyOK(p.k2, 7)) return false;
    const r = rulePivot(p);
    if (p.type === "diatonic") return !!r && r.j === p.pivot;
    if (p.type === "tonicize") return true;
    return !r;
  }
  function makeProg(type) {
    for (let i = 0; i < 80; i++) {
      let p = null;
      try { p = GEN[type](); } catch (e) { p = null; }
      if (p && validate(fin(p))) return p;
    }
    return null;
  }

  // ---------- Voicing: bass alone in the bass clef, three upper voices kept close and smooth ----------
  const midiAt = (n, o) => 12 * (o + 1) + NAT[n.l] + n.a;
  const octOf = (n, m) => Math.round((m - NAT[n.l] - n.a) / 12) - 1;
  function nearest(n, target, lo, hi) {
    let best = null;
    for (let o = 0; o < 9; o++) { const m = midiAt(n, o); if (m < lo || m > hi) continue; if (best === null || Math.abs(m - target) < Math.abs(best - target)) best = m; }
    return best;
  }
  function upperTones(c) {
    if (c.tones.length === 4) { const i = c.tones.findIndex(t => pc(t) === pc(c.bass)); return c.tones.filter((_, j) => j !== i); }
    return c.tones.slice();
  }
  function voiceProg(p) {
    let pu = null, pb = null;
    p.chords.forEach(c => {
      if (c.lone) { const ref = pu ? pu[pu.length - 1] : 72; c.v = { u: [{ n: c.tone, m: nearest(c.tone, ref, 55, 84) }], b: null }; return; }
      const bm = nearest(c.bass, pb === null ? 48 : pb, 38, 57);
      const ups = upperTones(c), target = pu || [64, 67, 72];
      const opts = ups.map(n => [2, 3, 4, 5, 6].map(o => midiAt(n, o)).filter(m => m >= 58 && m <= 81));
      const search = useTop => {
        let best = null;
        opts[0].forEach(a => opts[1].forEach(b => opts[2].forEach(d => {
          const arr = [{ n: ups[0], m: a }, { n: ups[1], m: b }, { n: ups[2], m: d }].sort((x, y) => x.m - y.m);
          if (arr[0].m === arr[1].m || arr[1].m === arr[2].m || arr[2].m - arr[0].m > 12) return;
          if (useTop && c.top !== undefined && pc(arr[2].n) !== c.top) return;
          const cost = arr.reduce((s, x, j) => s + Math.abs(x.m - target[j]), 0) + (arr[2].m > 79 ? 3 : 0) + (arr[0].m < 60 ? 2 : 0);
          if (!best || cost < best.cost) best = { arr, cost };
        })));
        return best;
      };
      const best = search(true) || search(false);
      c.v = { u: best.arr, b: { n: c.bass, m: bm } };
      pu = best.arr.map(x => x.m); pb = bm;
    });
  }

  // ---------- Grand staff (VexFlow) ----------
  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  const GLYPH = { "-2": "bb", "-1": "b", "0": "n", "1": "#", "2": "##" };
  const SHARP_ORDER = [3, 0, 4, 1, 5, 2, 6], FLAT_ORDER = [6, 2, 5, 1, 4, 0, 3];
  function sigAccs(n) {
    const a = [0, 0, 0, 0, 0, 0, 0];
    if (n > 0) SHARP_ORDER.slice(0, n).forEach(l => a[l] = 1);
    if (n < 0) FLAT_ORDER.slice(0, -n).forEach(l => a[l] = -1);
    return a;
  }
  const SVGNS = "http://www.w3.org/2000/svg";
  function svgEl(tag, attrs, text) {
    const e = document.createElementNS(SVGNS, tag);
    Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v));
    if (text !== undefined) e.textContent = text;
    return e;
  }
  // A Roman numeral centered at cx, figures drawn small and stacked; an optional key name hangs to its left.
  function rnSVG(svg, cx, y, label, mark, cls = "") {
    const g = svgEl("g", { class: "t-rn " + cls }); svg.appendChild(g);
    const { base, fig, sec: sc } = rnParts(label);
    const t = svgEl("text", { x: 0, y }, base); g.appendChild(t);
    let w = t.getComputedTextLength();
    if (fig.length === 1) { const f = svgEl("text", { x: w + 1, y: y - 8, class: "t-fig" }, fig); g.appendChild(f); w += 1 + f.getComputedTextLength(); }
    else if (fig.length === 2) {
      const f1 = svgEl("text", { x: w + 1, y: y - 8, class: "t-fig" }, fig[0]), f2 = svgEl("text", { x: w + 1, y: y + 2, class: "t-fig" }, fig[1]);
      g.appendChild(f1); g.appendChild(f2); w += 1 + Math.max(f1.getComputedTextLength(), f2.getComputedTextLength());
    }
    if (sc) { const s = svgEl("text", { x: w + 1, y }, sc); g.appendChild(s); w += 1 + s.getComputedTextLength(); }
    g.setAttribute("transform", `translate(${(cx - w / 2).toFixed(1)} 0)`);
    if (mark) svg.appendChild(svgEl("text", { x: (cx - w / 2 - 6).toFixed(1), y, "text-anchor": "end", class: "t-key" }, mark));
  }

  function drawProg(el, p, opts = {}) {
    el._args = [p, opts];
    el.innerHTML = "";
    if (!window.Vex || !Vex.Flow) { el.innerHTML = '<p class="staff-msg">The notation engine didn\'t load. Reload the page.</p>'; return; }
    voiceProg(p);
    const VF = Vex.Flow, ink = cssVar("--ink");
    const N = p.chords.length, wide = (el.clientWidth || 640) >= 520;
    const perRow = wide ? 9 : 4, rows = Math.ceil(N / perRow), per = Math.ceil(N / rows);
    const MW = 90, SYS = 300, X0 = 44;
    const r = new VF.Renderer(el, VF.Renderer.Backends.SVG);
    r.resize(X0 + per * MW + 200, rows * SYS + 40);
    const ctx = r.getContext();
    ctx.setFillStyle(ink); ctx.setStrokeStyle(ink);
    const sig = sigOf(p.k1), base = sigAccs(sig);
    const svg = el.querySelector("svg");
    const nx = [], meas = [], notes = [];
    const C = VF.StaveConnector.type;
    for (let row = 0; row < rows; row++) {
      const y0 = 40 + row * SYS;
      let x = X0;
      for (let i = row * per, j = 0; i < Math.min(N, (row + 1) * per); i++, j++) {
        const c = p.chords[i];
        const ts = new VF.Stave(x, y0, MW), bs = new VF.Stave(x, y0 + 100, MW);
        if (j === 0) {
          ts.addClef("treble").addKeySignature(KS_NAME[sig]); bs.addClef("bass").addKeySignature(KS_NAME[sig]);
          const pad = Math.max(ts.getNoteStartX(), bs.getNoteStartX()) - x;
          ts.setWidth(pad + MW); bs.setWidth(pad + MW);
          ts.setNoteStartX(x + pad); bs.setNoteStartX(x + pad);
        }
        const last = i === N - 1;
        if (last) { ts.setEndBarType(VF.Barline.type.END); bs.setEndBarType(VF.Barline.type.END); }
        else if (c.end) { ts.setEndBarType(VF.Barline.type.DOUBLE); bs.setEndBarType(VF.Barline.type.DOUBLE); }
        [ts, bs].forEach(s => { s.setStyle({ fillStyle: ink, strokeStyle: ink }); s.setContext(ctx).draw(); });
        const conn = t => { const k = new VF.StaveConnector(ts, bs).setType(t); k.setContext(ctx).draw(); };
        if (j === 0) { conn(C.BRACE); conn(C.SINGLE_LEFT); }
        conn(last ? C.BOLD_DOUBLE_RIGHT : c.end ? C.THIN_DOUBLE : C.SINGLE_RIGHT);
        const mk = (arr, clef) => {
          if (!arr || !arr.length) return { sn: new VF.StaveNote({ clef, keys: [clef === "bass" ? "f/3" : "d/5"], duration: "wr", align_center: true }), sorted: [] };
          const sorted = arr.slice().sort((a, b) => (octOf(a.n, a.m) * 7 + a.n.l) - (octOf(b.n, b.m) * 7 + b.n.l));
          const sn = new VF.StaveNote({ clef, keys: sorted.map(x => LET[x.n.l].toLowerCase() + "/" + octOf(x.n, x.m)), duration: "w" });
          sn.setStyle({ fillStyle: ink, strokeStyle: ink });
          if (sn.setLedgerLineStyle) sn.setLedgerLineStyle({ strokeStyle: ink, fillStyle: ink });
          sorted.forEach((x, k) => { if (x.n.a !== base[x.n.l]) { const a = new VF.Accidental(GLYPH[x.n.a]); a.setStyle({ fillStyle: ink, strokeStyle: ink }); sn.addModifier(a, k); } });
          return { sn, sorted };
        };
        const tn = mk(c.v.u, "treble"), bn = mk(c.v.b ? [c.v.b] : null, "bass");
        [[tn, ts], [bn, bs]].forEach(([n, s]) => {
          const v = new VF.Voice({ num_beats: 4, beat_value: 4 }).addTickables([n.sn]);
          new VF.Formatter().joinVoices([v]).format([v], MW - 30);
          v.draw(ctx, s);
        });
        notes[i] = tn;
        nx[i] = tn.sn.getAbsoluteX() + 7;
        meas[i] = { x0: j === 0 ? ts.getNoteStartX() - 14 : x, x1: x + ts.getWidth(), y0, row };
        x += ts.getWidth();
      }
    }
    // Ties hold the common tone through the bar where it sounds alone.
    p.chords.forEach((c, i) => {
      if (!c.lone) return;
      [[i - 1, i], [i, i + 1]].forEach(([a, b]) => {
        if (a < 0 || b >= N || meas[a].row !== meas[b].row) return;
        const A = notes[a], B = notes[b];
        const ta = A.sorted[A.sorted.length - 1], tb = B.sorted[B.sorted.length - 1];
        if (!ta || !tb || !sameN(ta.n, tb.n) || ta.m !== tb.m) return;
        new VF.StaveTie({ first_note: A.sn, last_note: B.sn, first_indices: [A.sorted.length - 1], last_indices: [B.sorted.length - 1] }).setContext(ctx).draw();
      });
    });
    if (!svg) return;
    // Measure backgrounds go first so they sit behind the music.
    const first = svg.firstChild;
    meas.forEach((m, i) => {
      const cls = "mrect" + (opts.hl && i === p.hl ? " pv" : "");
      svg.insertBefore(svgEl("rect", { x: m.x0.toFixed(1), y: m.y0 - 34, width: (m.x1 - m.x0).toFixed(1), height: 290, rx: 6, class: cls, "data-i": i }), first);
    });
    meas.forEach((m, i) => {
      const c = p.chords[i], x = nx[i], y0 = m.y0;
      if (opts.symbols && !c.lone) svg.appendChild(svgEl("text", { x, y: y0 + 20, "text-anchor": "middle", class: "t-sym" }, c.sym));
      if (opts.labels && c.altSym) svg.appendChild(svgEl("text", { x, y: y0 + (opts.symbols ? 2 : 20), "text-anchor": "middle", class: "t-sym t-alt" }, c.altSym));
      if (opts.anns && c.ann) svg.appendChild(svgEl("text", { x, y: y0 - 18, "text-anchor": "middle", class: "t-ann" }, c.ann.toUpperCase()));
      if (opts.labels) {
        const hide = opts.hidePivot && c.piv;
        if (c.l1) rnSVG(svg, x, y0 + 216, hide ? "?" : c.l1, i === 0 ? kMark(p.k1) : null, hide ? "t-q" : "");
        else if (i === 0 && !c.lone) rnSVG(svg, x, y0 + 216, "", kMark(p.k1));
        if (c.l2) rnSVG(svg, x, y0 + 244, hide ? "?" : c.l2, c.mark2 || null, hide ? "t-q" : "");
      }
    });
    let vb = `0 0 ${X0 + per * MW + 200} ${rows * SYS + 40}`;
    try { const bb = svg.getBBox(); if (bb.width) vb = `${(bb.x - 6).toFixed(1)} ${(bb.y - 6).toFixed(1)} ${(bb.width + 12).toFixed(1)} ${(bb.height + 12).toFixed(1)}`; } catch (e) {}
    svg.setAttribute("viewBox", vb);
    svg.removeAttribute("width"); svg.removeAttribute("height");
    svg.style.width = "100%"; svg.style.height = "auto";
    svg.setAttribute("role", "img");
    svg.setAttribute("focusable", "false");
    const list = p.chords.map((c, i) => `${i + 1}: ` + (c.lone ? `${nSpoken(c.tone)} held alone` : speak(c.sym)) + (opts.labels && (c.l1 || c.l2) && !(opts.hidePivot && c.piv) ? ` (${[c.l1, c.l2].filter(Boolean).map(rnSpoken).join(" over ")})` : ""));
    svg.setAttribute("aria-label", `Grand staff with a key signature of ${sigText(sig)}. ${N} chords, one per bar: ${list.join("; ")}.`);
  }
  function redrawStaves() { document.querySelectorAll(".prog").forEach(el => el._args && drawProg(el, ...el._args)); }
  try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", redrawStaves); } catch (e) {}
  new MutationObserver(redrawStaves).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
  let lastWide = null, rsT = null;
  window.addEventListener("resize", () => { clearTimeout(rsT); rsT = setTimeout(() => { const el = document.querySelector(".prog"); const w = el ? el.clientWidth >= 520 : null; if (w !== lastWide) { lastWide = w; redrawStaves(); } }, 150); });

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
  let playTimers = [];
  function stopPlay() {
    playTimers.forEach(clearTimeout); playTimers = [];
    document.querySelectorAll(".mrect.on").forEach(r => r.classList.remove("on"));
    if (bus && AC) bus.gain.setTargetAtTime(0, AC.currentTime, 0.03);
  }
  const mark = (i, on) => document.querySelectorAll(`.mrect[data-i="${i}"]`).forEach(r => r.classList.toggle("on", on));
  // Play chords from..to; `pre` sounds that key's tonic first, so the new key is "in the ear" (as in the video).
  function playProg(p, from = 0, to = p.chords.length - 1, pre = null) {
    if (!audio()) return;
    stopPlay(); voiceProg(p);
    const out = newBus(), t0 = AC.currentTime + 0.08, gap = 0.95;
    let t = t0;
    if (pre) {
      const tn = T(pre).tones;
      [nearest(tn[0], 48, 38, 57), nearest(tn[0], 60, 58, 70), nearest(tn[1], 64, 60, 76), nearest(tn[2], 67, 62, 79)].forEach(m => pianoNote(out, m, t, 1.4, 0.2));
      t += 1.9;
    }
    for (let i = from; i <= to; i++) {
      const c = p.chords[i], last = i === to;
      const ms = c.v.u.map(x => x.m).concat(c.v.b ? [c.v.b.m] : []);
      ms.forEach(m => pianoNote(out, m, t, last ? 2 : gap * 1.05, c.lone ? 0.3 : 0.2));
      const on = (t - AC.currentTime) * 1000, off = on + (last ? 1800 : gap * 1000);
      playTimers.push(setTimeout(() => mark(i, true), on), setTimeout(() => mark(i, false), off));
      t += gap;
    }
  }

  // ---------- Method metadata (field guide) ----------
  const TYPES = [
    { id: "direct", name: "Direct (phrase) modulation", short: "Direct", spot: "A cadence ends one phrase; the next phrase starts in the new key with no shared chord. Turnaround chords may soften the shift. Up a half or whole step before a last chorus: the truck driver's gear change.", label: "Write the new key's name under the first chord in the new key." },
    { id: "diatonic", name: "Pivot: diatonic common chord", short: "Diatonic common chord", spot: "One chord is diatonic in both keys. Find the first chord foreign to the old key and step back one (back past a cadential 6/4 of the new key). The most routine method.", label: "Stack the pivot's numerals: old key over new key." },
    { id: "chromatic", name: "Pivot: chromatic common chord", short: "Chromatic common chord", spot: "The hinge chord is diatonic in one key but borrowed or chromatic in the other, e.g. C as I in C major and ♭III in A major. Used for more distant keys.", label: "Stacked numerals, with the chromatic one (♭III, ♭VI, iv, ♭II…)." },
    { id: "enharmonic", name: "Pivot: enharmonic common chord", short: "Enharmonic common chord", spot: "A fully diminished seventh, or a Ger+6 that sounds like a dominant seventh, is respelled and resolves in the new key: same sound, new identity.", label: "Both spellings stacked above; stacked numerals below (the inversion can change)." },
    { id: "commontone", name: "Pivot: common tone", short: "Common tone", spot: "Only a single tone links the keys, often held alone; keys are often a chromatic third apart; the tone may be respelled. Rare: use it only when no common chord exists.", label: "No pivot numerals; the new key's name at its first chord." },
    { id: "shift", name: "Pivot: chord-quality shift", short: "Chord-quality shift", spot: "A chord keeps its root but changes quality (tonic → dom7, major ↔ minor, major → Ger+6), redirecting the music. The common tone is the root.", label: "Stack the numerals where the chord works in both keys." },
    { id: "sequence", name: "Pivot: sequence", short: "Sequence", spot: "A pattern repeats at new pitch levels and passes through chords that function clearly in neither key. (Many modulating sequences can simply be labeled as common-chord modulations.)", label: "Label each unit; mark the key at each new level." },
    { id: "tonicize", name: "Tonicization (not a modulation)", short: "Tonicization only", spot: "A chord is briefly treated as a tonic with secondary dominants, but no cadence confirms a new key; a V tonicized before a half cadence stays in the home key.", label: "Secondary numerals (V⁷/V) in the home key." },
  ];
  const TYPE = Object.fromEntries(TYPES.map(t => [t.id, t]));
  const TYPE_IDS = TYPES.map(t => t.id);
  const TYPE_GROUPS = [["Between phrases", ["direct"]], ["Pivot chord", ["diatonic", "chromatic", "enharmonic", "shift"]], ["Other links", ["commontone", "sequence"]], ["No new key", ["tonicize"]]];
  const DECIDE = [
    "<b>Find the last cadence.</b> If nothing cadences in a new key, it's a <b>tonicization</b>, not a modulation. A V tonicized right before a half cadence stays in the home key.",
    "<b>Did a new phrase simply begin in the new key</b> right after a cadence, with no chord or tone bridging the seam? That's <b>direct</b>. Turnaround chords don't change this.",
    "<b>Find the first chord foreign to the old key and step back one</b> (back past a cadential 6/4 of the new key). If that chord is diatonic in both keys, it's a <b>diatonic common chord</b>, even if a tone is also held across.",
    "<b>Does a chord keep its root but change quality</b> right at the turn (C → C7, C → Cm, F → Ger+6)? <b>Chord-quality shift.</b>",
    "<b>Is the hinge a dim7 or a Ger+6/dom7 that's respelled</b> for the new key? <b>Enharmonic common chord</b>: the whole chord is the tool, not the tone it shares.",
    "<b>Is the hinge diatonic in one key but borrowed or chromatic in the other</b>? <b>Chromatic common chord.</b>",
    "<b>Does a pattern repeat at new pitch levels</b> through chords that fit neither key? <b>Sequence.</b>",
    "<b>Does only a single tone connect the keys?</b> <b>Common tone</b> (rare).",
  ];

  // ---------- Explanations ----------
  const keyH = k => `<b>${accHTML(kName(k))}</b>`;
  const symH = c => `<b>${accHTML(c.sym)}</b>`;
  function explain(p) {
    const ch = p.chords, pv = p.pivot >= 0 ? ch[p.pivot] : null, f = firstForeign(p);
    const K1 = keyH(p.k1), K2 = p.k2 ? keyH(p.k2) : "";
    switch (p.type) {
      case "diatonic": {
        const r = rulePivot(p);
        return `${symH(pv)} is ${rnA(pv.l1)} in ${K1} and ${rnA(pv.l2)} in ${K2}: diatonic in both keys. The first chord that doesn't belong to ${K1} is ${symH(ch[f])}; step back one${r && r.cad ? ", then back past the cadential 6/4 (it belongs to the new key)," : ""} and you reach the pivot. The cadence in ${K2} confirms the modulation.`;
      }
      case "chromatic":
        return `${symH(pv)} is ${rnA(pv.l1)} in ${K1}, but in ${K2} it's ${rnA(pv.l2)}, a borrowed (chromatic) chord. No chord at the turn is diatonic in both keys, so the pivot is a chromatic common chord. The cadence in ${K2} confirms the move.`;
      case "enharmonic":
        if (pv.q === "d7" || /°/.test(pv.l1)) {
          const figs = rnParts(pv.l1).fig !== rnParts(pv.l2).fig;
          return `${symH(pv)} sounds exactly like ${`<b>${accHTML(pv.altSym)}</b>`}. Read in ${K1} it's ${rnA(pv.l1)}; respelled for ${K2} it's ${rnA(pv.l2)}, and it resolves there. ${figs ? "Respelling a dim7 moves its root, so the inversion figures change too. " : ""}A tone may be shared at the border, but the whole chord is the tool: that's an enharmonic pivot.`;
        }
        return `${symH(pv)} sounds exactly like ${`<b>${accHTML(pv.altSym)}</b>`}. In ${K1} it's ${rnA(pv.l1)}; in ${K2} it's ${rnA(pv.l2)}. Respelling the tone a +6 above the bass flips a German augmented sixth into a dominant seventh (or back), so the chord resolves in the other key.`;
      case "commontone": {
        const li = ch.findIndex(c => c.lone), prev = ch[li - 1], J = ch[li + 1];
        const ct = ch[li].tone, ctNew = J.tones.find(t => pc(t) === pc(ct));
        const enh = !sameN(ct, ctNew);
        return `Only <b>${accHTML(nName(ct))}</b> links the keys. It's held alone between ${symH(prev)} (${rnA(prev.l1)} in ${K1}) and ${symH(J)} (${rnA(J.l2)} in ${K2}), and neither chord is diatonic in the other key, so no common chord exists.${enh ? ` The tone is respelled as <b>${accHTML(nName(ctNew))}</b>: an enharmonic common-tone modulation.` : ""} Common-tone modulations are rare and often join keys a chromatic third apart.`;
      }
      case "shift": {
        const prev = ch[p.pivot - 1];
        if (p.sub === "dom") return `${symH(prev)} becomes ${symH(pv)}: same root, new quality. Labeled ${rnA(pv.l1)} in ${K1}, it's ${rnA(pv.l2)} in ${K2}, and it pushes to that key's tonic. The cadence confirms the modulation.`;
        if (p.sub === "ger") return `${symH(prev)} gains a raised tone and becomes a German augmented sixth, ${rnA(pv.l2)} in ${K2}. Its tendency tones (♭6̂ and ♯4̂ of ${K2}) resolve outward to 5̂, landing on the cadential 6/4.`;
        return `${symH(prev)} becomes ${symH(pv)}: same root, ${p.sub === "min" ? "major → minor" : "minor → major"}. Labeled ${rnA(pv.l1)} in ${K1}, it's ${rnA(pv.l2)} in ${K2} and leads to that key's cadence.`;
      }
      case "sequence":
        return `The ii–V⁷ pattern (the model) repeats a whole step ${p.dir === "up" ? "higher" : "lower"} each time, passing through ${keyH(p.via)} on the way to ${K2}. Those middle chords function clearly in neither ${K1} nor ${K2}: the sequence itself carries the modulation.`;
      case "direct": {
        const turn = ch.find(c => c.ann === "turnaround");
        return `The first phrase closes with a cadence in ${K1}. The next phrase starts in ${K2}, with no chord or tone shared at the seam.${turn ? ` ${symH(turn)} is a turnaround chord: it sets up ${K2} but doesn't function in the first phrase, so it isn't a pivot.` : ""}${p.step === 1 || p.step === 2 ? ` Up a ${p.step === 1 ? "half" : "whole"} step: a truck driver's gear change.` : ""}`;
      }
      case "tonicize": {
        const s = ch.find(c => /\//.test(c.l1 || ""));
        return `${symH(s)} (${rnA(s.l1)}) briefly tonicizes ${rnA(p.target)}, but no cadence confirms a new key: the phrase ${p.hc ? "ends on a half cadence in" : "cadences in"} ${K1}. That's a tonicization, not a modulation.`;
      }
    }
    return "";
  }
  function whyNot(chosen, p) {
    const t = p.type;
    let s = "";
    if (t === "tonicize") s = "No cadence confirms a new key, so this isn't a modulation at all.";
    else if (chosen === "tonicize") s = "A cadence in the new key confirms it: that makes it a modulation, not just a tonicization.";
    else if (chosen === "commontone" && t === "diatonic") s = "A tone may carry across, but a whole chord here is diatonic in both keys. The common chord is the more typical, more evident method.";
    else if (chosen === "commontone" && t === "enharmonic") s = "A tone is shared, but the whole respelled chord is what does the work.";
    else if (chosen === "direct" && t === "commontone") s = "The held tone bridges the keys, so the change isn't unprepared.";
    else if (chosen === "direct") s = "The new key is prepared inside the passage; it doesn't just start at a new phrase.";
    else if (t === "direct") s = "Nothing links the keys: the first phrase cadences, and the next phrase simply begins in the new key.";
    else if (chosen === "diatonic") s = t === "sequence" ? "Step back from the first foreign chord: that chord isn't diatonic in the new key. The repeated pattern does the work." : "Step back from the first foreign chord: that chord isn't diatonic in the new key.";
    else if (chosen === "chromatic" && t === "shift") s = "Watch the root: it stays put while the chord's quality changes. That's a chord-quality shift.";
    else if (chosen === "chromatic" && t === "enharmonic") s = "This chord changes its spelling (and identity) between keys, not just its function.";
    else if (chosen === "shift") s = "No chord keeps its root while changing quality at the turn.";
    else if (chosen === "enharmonic") s = "No chord is respelled: the hinge chord keeps the same spelling in both keys.";
    else if (chosen === "sequence") s = "There's no repeating pattern carrying the music through other keys.";
    else s = `${TYPE[chosen].short}: ${TYPE[chosen].spot}`;
    return `<p class="why-not">${accHTML(s)}</p>`;
  }

  // ---------- Label it ----------
  const ROM = ["I", "II", "III", "IV", "V", "VI", "VII"];
  function altLabels(label) {
    const { base, fig, sec: sc } = rnParts(label);
    const out = [];
    const triadF = ["", "6", "64"], sevF = ["7", "65", "43", "42"];
    const figs = sevF.includes(fig) ? sevF : triadF;
    if (/°/.test(base) && sevF.includes(fig)) figs.filter(f => f !== fig).forEach(f => out.push(base + (f ? "^" + f : "") + sc));
    if (base === "Ger+6") return ["V^7", "It+6", "Fr+6"];
    const m = /^(♭?)([ivIV]+)(°|ø)?$/.exec(base);
    if (!m) return out;
    const [, flat, num, qual] = m, up = num === num.toUpperCase(), idx = ROM.indexOf(num.toUpperCase());
    const mk = (fl, n, q) => fl + n + (q || "") + (fig ? "^" + fig : "") + sc;
    if (qual) { out.push(mk("", "ii", qual)); return out; }
    out.push(mk(flat, up ? num.toLowerCase() : num.toUpperCase(), ""));
    [-2, -1, 1, 2].forEach(d => { const n = ROM[(idx + d + 7) % 7]; out.push(mk("", up ? n : n.toLowerCase(), "")); });
    // No ♭/♮ twins (♭III vs III): in minor keys numerals follow natural minor (III = the major chord a m3 above the tonic), so a flat-only difference would be confusing.
    return out;
  }
  function labelChoices(p) {
    const pv = p.chords[p.pivot], ans = pv.l1 + "|" + pv.l2;
    const first = [], rest = new Set();
    const ok = v => v !== ans && !first.includes(v);
    if (pv.l1 !== pv.l2) first.push(pv.l2 + "|" + pv.l1);
    const f1 = rnParts(pv.l1).fig, f2 = rnParts(pv.l2).fig;
    if (f1 !== f2) { const v = pv.l1 + "|" + withFig(pv.l2, f1); if (ok(v)) first.push(v); }
    shuffle(altLabels(pv.l2)).forEach(b => { const v = pv.l1 + "|" + b; if (ok(v)) rest.add(v); });
    shuffle(altLabels(pv.l1)).forEach(t => { const v = t + "|" + pv.l2; if (ok(v)) rest.add(v); });
    const wrong = first.concat(shuffle([...rest])).slice(0, 3);
    return { answer: ans, choices: shuffle([ans, ...wrong]) };
  }

  // ---------- Key relations ----------
  const REL = {
    maj: [[4, 7, false, "the dominant (V)"], [3, 5, false, "the subdominant (IV)"], [5, 9, true, "the relative minor (vi)"], [2, 4, true, "the relative minor of the dominant (iii)"], [1, 2, true, "the relative minor of the subdominant (ii)"],
      [0, 0, true, "the parallel minor"], [1, 1, false, "the key a half step up (♭II)"], [1, 2, false, "the major key a whole step up"], [2, 4, false, "the major key a major third up"], [5, 8, false, "the key on ♭VI"], [2, 3, false, "the key on ♭III"], [4, 7, true, "the minor key on the dominant"]],
    min: [[2, 3, false, "the relative major (III)"], [4, 7, true, "the minor dominant (v)"], [3, 5, true, "the subdominant (iv)"], [5, 8, false, "the relative major of the subdominant (VI)"], [6, 10, false, "the relative major of the dominant (VII)"],
      [0, 0, false, "the parallel major"], [4, 7, false, "the major key on the dominant"], [1, 1, false, "the key a half step up (♭II)"], [2, 4, true, "the minor key a major third up"], [3, 6, true, "the minor key a tritone up"]],
  };
  function relations(home) {
    return REL[home.minor ? "min" : "maj"].map(([L, Sm, m, name]) => { const k = move(home, L, Sm, m); return { k, name, d: Math.abs(sigOf(k) - sigOf(home)), close: Math.abs(sigOf(k) - sigOf(home)) <= 1 }; })
      .filter(r => keyOK(r.k, 7));
  }
  const sigLine = (a, b) => `${kName(a)} has ${sigText(sigOf(a))}; ${kName(b)} has ${sigText(sigOf(b))}`;
  const mc = (text, answer, wrong, explain) => {
    const w = shuffle([...new Set(wrong)].filter(x => x !== answer)).slice(0, 3);
    return { text, choices: shuffle([answer, ...w]), answer, explain };
  };
  function makeKeyQ() {
    const home = pickKey(), rel = relations(home), close = rel.filter(r => r.close && r.d <= 1 && kName(r.k) !== kName(home)), far = rel.filter(r => !r.close);
    const v = rint(6);
    if (v === 0) { const a = rnd(close); return mc(`Which key is closely related to ${kName(home)}?`, kName(a.k), far.map(r => kName(r.k)), `${sigLine(home, a.k)}: they differ by ${a.d === 0 ? "nothing (relative keys share a signature)" : "one accidental"}. Closely related keys differ by no more than one accidental, so they share more tones.`); }
    if (v === 1) { const a = rnd(far); return mc(`Which key is NOT closely related to ${kName(home)}?`, kName(a.k), close.map(r => kName(r.k)), `${sigLine(home, a.k)}: a difference of ${a.d}. Closely related keys differ by no more than one accidental.`); }
    if (v === 2) { const a = Math.random() < .65 ? rnd(close) : rnd(far); return mc(`${kName(home)} to ${kName(a.k)}: how are the keys related? ${kName(a.k)} is…`, a.name, rel.filter(r => r !== a && kName(r.k) !== kName(a.k)).map(r => r.name), `${sigLine(home, a.k)}. ${a.close ? "Closely related." : "Distantly related."}`); }
    if (v === 3) { const a = rnd(close.concat(far.slice(0, 1))); return mc(`What is ${a.name} of ${kName(home)}?`, kName(a.k), rel.filter(r => kName(r.k) !== kName(a.k)).map(r => kName(r.k)), `${kName(a.k)} is ${a.name} of ${kName(home)}. ${sigLine(home, a.k)}.`); }
    if (v === 4) {
      const a = Math.random() < .5 ? rnd(close) : rnd(far);
      const q = { text: `${kName(home)} and ${kName(a.k)}: closely or distantly related?`, answer: a.close ? "Closely related" : "Distantly related", explain: `${sigLine(home, a.k)}: a difference of ${a.d}. ${a.close ? "No more than one accidental apart, so they're closely related, and a modulation between them sounds subtle." : "More than one accidental apart, so they're distantly related, and the change sounds more striking."}` };
      q.choices = ["Closely related", "Distantly related"];
      return q;
    }
    const names = list => list.map(r => kName(r.k)).join(", ");
    const ans = names(close);
    const swaps = far.map(f => { const c = close.slice(); c[rint(c.length)] = f; return names(c); });
    return mc(`Which list gives the closely related keys of ${kName(home)}?`, ans, swaps, `${kName(home)} has ${sigText(sigOf(home))}. Its closely related keys differ by no more than one accidental: ${ans}. ${home.minor ? "Modulations from minor most often go to the relative major." : "In common-practice music, modulations most often go to the dominant, the subdominant, or the relative minor."}`);
  }

  // ---------- Concepts (About Modulation, Modulation Techniques, and the video) ----------
  const FACTS = [
    ["What confirms a modulation, as opposed to a tonicization?", "A cadence in the new key", ["A secondary dominant", "A new key signature", "An accidental in the melody"], "A key may be tonicized mid-phrase, but without a confirming cadence it isn't a full modulation."],
    ["A phrase tonicizes V just before ending on a half cadence. How is that labeled?", "As a secondary dominant in the home key: no modulation", ["As a modulation to the dominant key", "As a direct modulation", "As a common-tone modulation"], "The music continues in the same key, so the chord gets a secondary label (V/V). A half cadence ends on V; it doesn't move to V's key."],
    ["Which kind of modulation happens within a phrase, with a chord or tone heard in both keys?", "A pivot modulation", ["A direct modulation", "A tonicization", "A truck driver's gear change"], "The shared element is the pivot chord or pivot tone."],
    ["A new phrase begins abruptly in a new key, with no shared chord. This is…", "a direct (phrase) modulation", ["a common-chord modulation", "a tonicization", "a sequential modulation"], "Direct modulations most often happen between phrases."],
    ["Brief chords after a cadence that set up the next phrase's new key are called…", "turnaround chords", ["pivot chords", "cadential 6/4 chords", "common tones"], "They aren't pivots, because they don't function within the original phrase."],
    ["Closely related keys have key signatures that differ by…", "no more than one accidental", ["exactly two accidentals", "a tritone", "the same number of sharps as flats"], "C major's closely related keys: G, F, A minor, E minor, D minor."],
    ["In common-practice music, a major-key piece most often modulates to…", "the dominant, the subdominant, or the relative minor", ["the parallel minor", "the key a half step up", "a chromatic mediant"], "All five closely related keys are possible, but these three are most common."],
    ["Why do modulations between closely related keys sound subtle?", "The keys share more tones", ["They use the same tonic", "They avoid cadences", "They always use a pivot tone"], "Fewer changed pitches means a smoother shift."],
    ["What's the most reliable way to locate a modulation?", "Compare a passage's starting key with the key of its final cadence", ["Find the first accidental", "Look for a new key signature", "Find the highest melody note"], "It often helps to hear the key change first, then study the score for the exact point and method."],
    ["How is a pivot chord labeled?", "Two stacked numerals: old key on top, new key below", ["New key on top, old key below", "One numeral, in the new key only", "With its chord symbol only"], "After the pivot, every numeral reflects the new key, whose name is written at the pivot."],
    ["How do you label a direct modulation?", "Write the new key's name under the beat where its harmony begins", ["Stack two numerals on the first new chord", "Bracket the last chord of the old key", "Write nothing until the next cadence"], "All later numerals reflect the new key."],
    ["To locate a diatonic pivot chord, find the first harmony that doesn't belong to the old key, then…", "go back one chord: if it's diatonic in both keys, it's the pivot", ["go forward one chord", "label that chord as the pivot", "go back to the previous cadence"], "That first foreign harmony usually needs an accidental."],
    ["The first chromatic chord is V of the new key, preceded by its cadential 6/4. Where is the pivot?", "Before the cadential 6/4", ["On the cadential 6/4", "On the V chord", "There isn't one"], "The cadential 6/4 is part of the new key, so the pivot precedes it."],
    ["A C major chord is I in C major and ___ in A major.", "♭III", ["V", "♭VI", "vi"], "A chromatic pivot chord, used for a remote modulation with no true diatonic common chord."],
    ["Why can a fully diminished seventh chord serve as an enharmonic pivot?", "Respelled, any of its tones can become the root, so it can lead to different tonics", ["It contains a perfect fifth", "It belongs to every major key", "It never needs to resolve"], "All its tones are a minor third (or augmented second) apart, so it sounds the same however it's spelled."],
    ["A dim7 chord has a strong tendency to resolve to the tone…", "a half step above its root", ["a whole step below its root", "a fifth above its root", "a tritone away from its root"], "Dim7 chords function as “seven of” something."],
    ["Respelling one tone of a German +6 (the one a +6 above the bass) turns it into…", "a dominant seventh chord", ["a diminished seventh chord", "an Italian +6", "a minor seventh chord"], "Same sound, different tendency tones."],
    ["Respelled as a dom7, a Ger+6 becomes V⁷ of which chord?", "♭II, the Neapolitan", ["V", "IV", "vi"], "That's why it links a key with its Neapolitan key: in F minor, D♭7 is V⁷ of G♭ (♭II), and respelling its C♭ as B♮ makes it the Ger+6 of F minor."],
    ["Common-tone modulations often connect chords whose roots are…", "a chromatic third apart", ["a perfect fifth apart", "a whole step apart", "the same"], "A third apart but not diatonic, such as C major and A♭ major."],
    ["The A♯ (third of an F♯ major tonic) is held and becomes B♭, the root of the new tonic. This is…", "an enharmonic common-tone modulation", ["a direct modulation", "a chord-quality shift", "a sequence"], "The shared tone is respelled at the point of modulation."],
    ["When is a modulation best called “by sequence”?", "When a repeating pattern passes through chords that function clearly in neither key", ["Whenever a sequence appears", "When the melody repeats exactly", "When the key changes at a new phrase"], "Most modulating sequences can simply be labeled as common-chord modulations."],
    ["Modulating sequences are most traditionally found in…", "Baroque music", ["1980s pop ballads", "twelve-bar blues", "Gregorian chant"], "Pop songs use them too, sometimes with a tritone substitution."],
    ["In a chord-quality shift, which part of the chord is the common tone?", "The root", ["The third", "The fifth", "The seventh"], "It's more like a common-tone modulation than a common-chord one."],
    ["Turning the tonic triad into a dominant seventh most often modulates…", "from the dominant key back to the tonic, or to the subdominant", ["to the relative minor", "up a half step", "to the parallel minor"], "A dominant seventh built on the tonic leads to IV."],
    ["A German +6 built from a major chord has tendency tones (♯4̂ and ♭6̂) that point to…", "5̂ of the new key", ["1̂ of the old key", "3̂ of the new key", "the leading tone"], "The bass falls a half step to the new dominant, confirmed by a cadence. For example, a Ger+6 on A♭ moves to I6/4 in C major."],
    ["A pivot area has a sustained common tone, and the whole chord there is diatonic in both keys. Call it…", "a common-chord modulation", ["a common-tone modulation", "a direct modulation", "a sequence"], "Common-chord modulations are routine; the whole chord outranks a single shared tone."],
    ["Common-tone modulations are…", "rare, so the term is reserved for cases with no diatonic common chord", ["the most common kind of modulation", "always between closely related keys", "the same as direct modulations"], "Use it when only a single tone links the chords at the border."],
    ["A dim7 respelled for the new key also shares a tone with the next chord. Best label?", "Enharmonic pivot chord modulation", ["Common-tone modulation", "Direct modulation", "Tonicization"], "The whole respelled chord is the more relevant tool."],
    ["When a dim7 is respelled as an enharmonic pivot, what else can change in its label?", "Its inversion", ["Its quality", "Its key signature", "Nothing"], "B in the bass is the root of B°7 but the third of G♯°7 (first inversion)."],
    ["How is an enharmonic pivot labeled?", "Both chord spellings stacked above, and stacked numerals (old key over new) below", ["Only the notated spelling, with one numeral", "With a bracket and the word “enharmonic”", "Only with the new key's numeral"], "Show the spelling that isn't notated too."],
    ["What's a truck driver's gear change?", "A sudden direct modulation up a half or whole step, often before the final chorus", ["A pivot through the dominant", "A slow modulation by sequence", "A move to the parallel minor"], "It lifts the energy without any pivot: the new key simply starts."],
    ["Where are modulations usually found in a piece's form?", "At sectional boundaries", ["Only in the first phrase", "Only at the final cadence", "Only in introductions"], "Binary and ternary forms often use contrasting, closely related keys for their sections."],
    ["When several modulation methods seem to apply, choose…", "the most evident method, favoring the more typical paradigm", ["the rarest method", "the method with the most accidentals", "always the common-tone method"], "A process of elimination works best."],
    ["The term “turnaround” is most often heard in…", "jazz", ["Baroque counterpoint", "Gregorian chant", "serialism"], "It can apply to much music: chords after a cadence that keep things moving or set up a new key."],
    ["The progression B | E | A | C♯m | F♯m | B moves from A major back to E major. Which chord is the pivot?", "F♯m", ["A", "C♯m", "B"], "F♯m is vi in A major and ii in E major, and it leads to B (V in E)."],
    ["An F♯°7 first acts as vii°4/3 in G minor. Respelled as D♯°7, the same-sounding chord…", "resolves into E minor", ["resolves to G major", "becomes a Ger+6", "is held as a common tone"], "A dim7 can be heard (and spelled) as leading to a different tonic."],
  ];
  const makeConcept = () => { const f = rnd(FACTS); return mc(f[0], f[1], f[2], f[3]); };

  // ---------- State ----------
  const DEFAULTS = { types: Object.fromEntries(TYPE_IDS.map(t => [t, true])), range: 3, symbols: true, auto: true };
  let S = { mode: "type", settings: clone(DEFAULTS), right: 0, total: 0, streak: 0, misses: [] };
  try {
    const saved = JSON.parse(localStorage.getItem("modulation-trainer") || "null");
    if (saved) S = Object.assign(S, saved, { settings: Object.assign(clone(DEFAULTS), saved.settings, { types: Object.assign({}, DEFAULTS.types, (saved.settings || {}).types) }) });
  } catch (e) {}
  const MODES = ["type", "find", "label", "keys", "concept"];
  if (!MODES.includes(S.mode)) S.mode = "type";
  if (!Array.isArray(S.misses)) S.misses = [];
  if (![3, 6].includes(S.settings.range)) S.settings.range = 3;
  const save = () => { try { localStorage.setItem("modulation-trainer", JSON.stringify({ mode: S.mode, settings: S.settings, right: S.right, total: S.total, streak: S.streak, misses: S.misses.slice(-30) })); } catch (e) {} };
  const Q = {};
  const isProg = m => m === "type" || m === "find" || m === "label";
  const strip = p => { const c = clone(p); c.chords.forEach(x => delete x.v); return c; };

  const enabledTypes = () => TYPE_IDS.filter(t => S.settings.types[t]);
  function progFor(mode) {
    let pool;
    if (mode === "type") pool = enabledTypes();
    else {
      pool = ["diatonic", "chromatic", "enharmonic", "shift"].filter(t => S.settings.types[t]);
      if (!pool.length) pool = ["diatonic"];
      if (pool.includes("diatonic")) pool.push("diatonic");
    }
    for (let i = 0; i < 40; i++) {
      const p = makeProg(rnd(pool));
      if (!p) continue;
      if (mode === "label" && !(p.chords[p.pivot].l1 && p.chords[p.pivot].l2)) continue;
      return p;
    }
    return makeProg("diatonic");
  }
  function specOK(m) { return !(m.mode === "type" && m.p && !S.settings.types[m.p.type]); }
  function newQuestion(mode) {
    const prev = Q[mode];
    const review = S.misses.filter(m => m.mode === mode && (!prev || m.id !== prev.id) && specOK(m));
    if (review.length && Math.random() < .3) { const sp = clone(rnd(review)); return { mode, id: sp.id, p: sp.p, c: sp.c, review: true, tries: 0, done: false }; }
    if (isProg(mode)) {
      let p = progFor(mode);
      for (let i = 0; i < 5 && prev && p.id === prev.id; i++) p = progFor(mode);
      const q = { mode, id: (mode === "label" ? "L" : mode === "find" ? "F" : "") + p.id, p, tries: 0, done: false };
      if (mode === "label") q.c = labelChoices(p);
      return q;
    }
    let c = null;
    for (let i = 0; i < 30; i++) { c = mode === "keys" ? makeKeyQ() : makeConcept(); if (c.choices.length >= 2 && (!prev || prev.c.text !== c.text)) break; }
    return { mode, id: c.text + "|" + c.answer, c, tries: 0, done: false };
  }

  // ---------- DOM ----------
  const $ = id => document.getElementById(id);
  const promptEl = $("prompt"), hintBox = $("hintBox"), fb = $("feedback"), ansBox = $("answerBox"), work = $("work");
  const hintBtn = $("hintBtn"), nextBtn = $("nextBtn");
  const PLAY_ICON = '<svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M2 1l9 5-9 5z"/></svg>';
  const STOP_ICON = '<svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M2 2h8v8H2z"/></svg>';

  function renderScore() { $("scRight").textContent = S.right; $("scTotal").textContent = S.total; $("scStreak").textContent = S.streak; $("scoreText").textContent = `Score: ${S.right} correct out of ${S.total} answered. Streak: ${S.streak}.`; }
  function msg(cls, label, text) { return `<div class="verdict"><span class="pill ${cls}">${label}</span><span>${text}</span></div>`; }

  function renderPrompt() {
    const q = Q[S.mode];
    const tag = q.review ? ' <span class="pill warn">review</span>' : "";
    let h;
    if (isProg(S.mode)) {
      const p = q.p;
      const head = { type: "What kind of modulation is this, if any?", find: "Tap the pivot chord", label: "Label the highlighted pivot chord" }[S.mode];
      const keys = S.mode === "type"
        ? `<p class="keys">${accHTML(kName(p.k1))}<span class="arrow" aria-hidden="true">→</span><span class="unk" aria-hidden="true">?</span><span class="sr">, ending in an unknown key</span></p>`
        : `<p class="keys">${accHTML(kName(p.k1))}<span class="arrow" aria-hidden="true">→</span><span class="sr"> to </span>${accHTML(kName(p.k2))}</p>`;
      h = `<h2 class="kicker" id="qHead" tabindex="-1">${head}${tag}</h2>${keys}<div class="prog" id="promptStaff"></div>
        <div class="play-row"><button class="play" data-play="all">${PLAY_ICON}Play</button><button class="play quiet" data-play="stop">${STOP_ICON}Stop</button></div>`;
    } else {
      h = `<h2 class="kicker" id="qHead" tabindex="-1">${S.mode === "keys" ? "Key relationships" : "Concept check"}${tag}</h2><p class="q-text" id="qText">${accHTML(q.c.text)}</p>`;
    }
    promptEl.innerHTML = h;
    if (isProg(S.mode)) drawPromptStaff();
    renderWork();
  }
  function drawPromptStaff() {
    const q = Q[S.mode], el = $("promptStaff");
    if (!el || !q.p) return;
    drawProg(el, q.p, { symbols: S.settings.symbols, labels: q.done || S.mode === "label", hidePivot: S.mode === "label" && !q.done, anns: q.done, hl: q.done || S.mode === "label" });
    lastWide = el.clientWidth >= 520;
  }

  function choiceBtn(value, inner, q, sr) {
    let cls = "choice", markH = "";
    if (q.done) {
      if (value === q.correctValue) { cls += " right"; markH = `<span class="mark"><span aria-hidden="true">✓</span><span class="sr">correct answer</span></span>`; }
      else if (value === q.chosen) { cls += " wrong"; markH = `<span class="mark"><span aria-hidden="true">✗</span><span class="sr">your answer, incorrect</span></span>`; }
    }
    return `<button class="${cls}" data-v="${esc(value)}"${q.done ? " disabled" : ""}${sr ? ` aria-label="${esc(sr)}"` : ""}>${inner}${markH}</button>`;
  }
  function renderWork() {
    const q = Q[S.mode];
    let h = "";
    if (S.mode === "type") {
      q.correctValue = q.p.type;
      h = `<div class="choices" role="group" aria-labelledby="qHead">` + TYPE_GROUPS.map(([g, ids]) =>
        `<div class="choice-group"><span aria-hidden="true">${g}</span><div class="choice-row">${ids.map(id => choiceBtn(id, `<span>${esc(TYPE[id].short)}</span>`, q)).join("")}</div></div>`).join("") + `</div>`;
    } else if (S.mode === "find") {
      q.correctValue = String(q.p.pivot);
      h = `<div class="choice-row picks" role="group" aria-labelledby="qHead">${q.p.chords.map((c, i) => choiceBtn(String(i), `<small>${i + 1}</small><b>${accHTML(c.sym)}</b>`, q, `Chord ${i + 1}, ${speak(c.sym)}`)).join("")}</div>`;
    } else if (S.mode === "label") {
      q.correctValue = q.c.answer;
      h = `<div class="choice-row labels" role="group" aria-labelledby="qHead">${q.c.choices.map(v => { const [t, b] = v.split("|"); return choiceBtn(v, stackHTML(t, b), q); }).join("")}</div>`;
    } else {
      q.correctValue = q.c.answer;
      h = `<div class="choice-row wide" role="group" aria-labelledby="qText">${q.c.choices.map(c => choiceBtn(c, `<span>${accHTML(c)}</span>`, q)).join("")}</div>`;
    }
    work.innerHTML = h;
  }

  function renderControls() {
    const q = Q[S.mode];
    document.querySelectorAll(".modes [data-mode]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mode === S.mode)));
    hintBox.hidden = !q.hinted;
    if (q.hinted) hintBox.innerHTML = hintHTML(q);
    hintBtn.hidden = !isProg(S.mode) || q.done || q.hinted;
    nextBtn.textContent = q.done ? "Next question" : "Skip";
    nextBtn.classList.toggle("primary", !!q.done);
  }

  function hintHTML(q) {
    const p = q.p, f = firstForeign(p), K1 = keyH(p.k1);
    if (S.mode === "type") {
      const endK = p.k2 || p.k1, lastC = p.chords[p.chords.length - 1];
      let s = `The last chord is ${symH(lastC)}${p.type === "tonicize" && p.hc ? ", a half cadence in " + keyH(endK) : `; the passage ends in ${keyH(endK)}`}. `;
      if (f >= 1) s += `The first chord that doesn't belong to ${K1} is chord ${f + 1} (${symH(p.chords[f])}). Does chord ${f} belong to both keys? `;
      return s + `<ol>${DECIDE.map(d => `<li>${d}</li>`).join("")}</ol>`;
    }
    if (S.mode === "find") {
      if (p.type === "enharmonic") return "Look for a chord that could be spelled two ways: a fully diminished seventh, or a dominant seventh that could be a German +6.";
      if (p.type === "shift") return "Look for a chord that keeps the root of the chord before it but changes its quality.";
      const r = rulePivot(p);
      return `The first chord that doesn't belong to ${K1} is chord ${f + 1} (${symH(p.chords[f])}). Step back one${r && r.cad ? " (and back past the cadential 6/4, which belongs to the new key)" : ""}.`;
    }
    const pv = p.chords[p.pivot];
    return `Top numeral: what ${symH(pv)} does in ${K1}. Bottom: what it does in ${keyH(p.k2)}. Check the bass note for the figures.${pv.altSym ? ` Spell it as ${`<b>${accHTML(pv.altSym)}</b>`} for the other key; the inversion can change.` : ""}`;
  }

  function segs(p) {
    const last = p.chords.length - 1;
    if (p.pivot >= 0) return [[0, p.pivot, null, "Old key, through the pivot"], [p.pivot, last, p.k2, "New tonic, then from the pivot"]];
    const li = p.chords.findIndex(c => c.lone);
    if (li >= 0) return [[0, li, null, "Old key, to the held tone"], [li, last, p.k2, "New tonic, then from the held tone"]];
    const ei = p.chords.findIndex(c => c.end);
    if (ei >= 0) return [[0, ei, null, "Phrase 1"], [ei + 1, last, null, "Phrase 2"]];
    return [];
  }
  function segHTML(p) {
    const s = segs(p);
    if (!s.length) return "";
    return `<div class="play-row">${s.map((x, i) => `<button class="play" data-play="seg${i}">${PLAY_ICON}${x[3]}</button>`).join("")}</div>
      <p class="legend">${p.pivot >= 0 || p.type === "commontone" ? "Each half should sound like it belongs to one key." : "Hear each phrase settle in its own key."}</p>`;
  }

  function score(q, correct) {
    if (!(window.LiveClass && LiveClass.active)) { if (window.SFX) SFX.play(correct); if (window.SAprogress && q.tries === 0 && !q.revealed) SAprogress.record(__saLabel(S.mode), correct); }
    if (window.LiveClass && LiveClass.active && LiveClass.answered(correct)) return;
    if (q.tries > 0) return;
    S.total++;
    if (correct) { S.right++; S.streak++; S.misses = S.misses.filter(m => m.id !== q.id); }
    else { S.streak = 0; if (!S.misses.some(m => m.id === q.id)) S.misses.push({ mode: q.mode, id: q.id, p: q.p ? strip(q.p) : undefined, c: q.c }); }
    save(); renderScore();
  }

  function choose(value) {
    const q = Q[S.mode];
    if (q.done) return;
    const correct = value === q.correctValue;
    score(q, correct);
    q.tries++; q.done = true; q.chosen = value;
    stopPlay();
    renderWork();
    let verdict, body;
    const ok = correct ? "good" : "bad", word = correct ? "Correct" : "Not quite";
    if (S.mode === "type") {
      const t = TYPE[q.p.type];
      verdict = msg(ok, word, correct ? `${esc(t.name)}.` : `You chose ${esc(TYPE[value].short)}; this is ${esc(t.name)}.`);
      body = (correct ? "" : whyNot(value, q.p)) + `<p class="explain">${explain(q.p)}</p>`;
    } else if (S.mode === "find") {
      const pv = q.p.chords[q.p.pivot];
      verdict = msg(ok, word, correct ? `Chord ${q.p.pivot + 1}, ${symH(pv)}, is the pivot.` : `You chose chord ${+value + 1}; the pivot is chord ${q.p.pivot + 1}, ${symH(pv)}.`);
      body = `<p class="explain">${explain(q.p)}</p><p class="legend">Method: ${esc(TYPE[q.p.type].name)}.</p>`;
    } else if (S.mode === "label") {
      const [t, b] = q.c.answer.split("|"), pv = q.p.chords[q.p.pivot];
      verdict = msg(ok, word, `${symH(pv)} is ${rnA(t)} in ${keyH(q.p.k1)} over ${rnA(b)} in ${keyH(q.p.k2)}.`);
      body = `<p class="explain">${explain(q.p)}</p><p class="legend">Method: ${esc(TYPE[q.p.type].name)}.</p>`;
    } else {
      verdict = msg(ok, word, correct ? accHTML(q.c.answer) + "." : `The answer is ${accHTML(q.c.answer)}.`);
      body = `<p class="explain">${accHTML(q.c.explain)}</p>`;
    }
    fb.innerHTML = verdict;
    ansBox.innerHTML = `<div class="answer">${body}${isProg(S.mode) ? segHTML(q.p) : ""}</div>`;
    if (isProg(S.mode)) drawPromptStaff();
    renderControls();
    nextBtn.focus();
  }
  work.addEventListener("click", e => { const b = e.target.closest("[data-v]"); if (b && !b.disabled) choose(b.dataset.v); });

  document.addEventListener("click", e => {
    const b = e.target.closest("[data-play]"); if (!b) return;
    const q = Q[S.mode]; if (!q || !q.p) return;
    const v = b.dataset.play;
    if (v === "stop") return stopPlay();
    if (v === "all") return playProg(q.p);
    const s = segs(q.p)[+v.slice(3)];
    if (s) playProg(q.p, s[0], s[1], s[2]);
  });

  function clearAnswer() { fb.innerHTML = ""; ansBox.innerHTML = ""; }
  function autoPlay() { const q = Q[S.mode]; if (S.settings.auto && q && q.p) playProg(q.p); }
  function next(focus = true) {
    stopPlay();
    Q[S.mode] = newQuestion(S.mode);
    clearAnswer(); renderPrompt(); renderControls();
    if (focus) { const h = $("qHead"); if (h) h.focus(); }
    autoPlay();
  }
  function setMode(m) {
    if (S.mode === m) return;
    stopPlay();
    S.mode = m; save();
    clearAnswer();
    if (!Q[m] || Q[m].done) Q[m] = newQuestion(m);
    renderPrompt(); renderControls();
  }

  // ---------- Events ----------
  document.querySelectorAll(".modes [data-mode]").forEach(b => b.onclick = () => setMode(b.dataset.mode));
  hintBtn.onclick = () => { Q[S.mode].hinted = true; renderControls(); hintBox.setAttribute("tabindex", "-1"); hintBox.focus(); };
  nextBtn.onclick = () => next(true);

  // Settings
  $("typeToggles").innerHTML = TYPES.map(t => `<button class="tog" data-type="${t.id}">${esc(t.short)}</button>`).join("");
  function renderSettings() {
    document.querySelectorAll("[data-type]").forEach(b => b.setAttribute("aria-pressed", String(!!S.settings.types[b.dataset.type])));
    document.querySelectorAll("[data-range]").forEach(b => b.setAttribute("aria-pressed", String(S.settings.range === +b.dataset.range)));
    document.querySelectorAll("[data-sym]").forEach(b => b.setAttribute("aria-pressed", String(S.settings.symbols === (b.dataset.sym === "1"))));
    document.querySelectorAll("[data-auto]").forEach(b => b.setAttribute("aria-pressed", String(S.settings.auto === (b.dataset.auto === "1"))));
  }
  function settingsChanged() {
    save(); renderSettings(); stopPlay();
    MODES.forEach(m => { if (isProg(m)) Q[m] = newQuestion(m); });
    clearAnswer(); renderPrompt(); renderControls();
  }
  $("typeToggles").onclick = e => {
    const b = e.target.closest("[data-type]"); if (!b) return;
    const t = b.dataset.type, on = !S.settings.types[t];
    if (!on && enabledTypes().length === 1) return;
    S.settings.types[t] = on; settingsChanged();
  };
  $("rangeToggles").onclick = e => { const b = e.target.closest("[data-range]"); if (b) { S.settings.range = +b.dataset.range; settingsChanged(); } };
  $("symToggles").onclick = e => { const b = e.target.closest("[data-sym]"); if (b) { S.settings.symbols = b.dataset.sym === "1"; save(); renderSettings(); drawPromptStaff(); } };
  $("autoToggles").onclick = e => { const b = e.target.closest("[data-auto]"); if (b) { S.settings.auto = b.dataset.auto === "1"; save(); renderSettings(); } };
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

  // Reference: one copy in the fold-away panel, one in the pop-up.
  const guideRows = TYPES.map(t => `<tr><th scope="row">${esc(t.name)}</th><td data-label="Spot it">${accHTML(t.spot)}</td><td data-label="Label it">${accHTML(t.label)}</td></tr>`).join("");
  document.querySelectorAll(".guide-slot").forEach(el => el.innerHTML =
    `<table class="ref"><caption class="sr">Modulation methods</caption><thead><tr><th scope="col">Method</th><th scope="col">How to spot it</th><th scope="col">How to label it</th></tr></thead><tbody>${guideRows}</tbody></table>`);
  $("decideList").innerHTML = DECIDE.map(d => `<li>${d}</li>`).join("");
  const dlg = $("guideDialog");
  let dlgReturn = null;
  $("guideBtn").onclick = () => {
    dlgReturn = document.activeElement;
    if (dlg.showModal) dlg.showModal(); else { $("guidePanel").open = true; $("guidePanel").scrollIntoView(); return; }
    $("guideClose").focus();
  };
  $("guideClose").onclick = () => dlg.close();
  dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", () => { if (dlgReturn && dlgReturn.focus) dlgReturn.focus(); });

  if (location.hash === "#debug") window.__MT = { makeProg, rulePivot, validate, GEN, labelChoices, makeKeyQ, makeConcept, explain, TYPE_IDS, S, Q };

  Q[S.mode] = newQuestion(S.mode);
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
        stopPlay();
        const keep = S.misses; S.misses = [];
        S.settings = clone(cfg.settings);
        if (LiveClass.role === "student" && "auto" in S.settings) S.settings.auto = false;
        S.mode = cfg.mode; Q[cfg.mode] = null; Q[cfg.mode] = newQuestion(cfg.mode); S.misses = keep;
        clearAnswer(); renderSettings(); renderPrompt(); renderControls(); if (LiveClass.role === "host") autoPlay();
      },
      showAnswer() { const q = Q[S.mode]; if (!q || q.done || q.revealed) return; q.tries = 1; choose(q.correctValue); relabel(); tidy(); }
    });
  })();
})();

