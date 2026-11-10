
(window.FAMS = window.FAMS || {}).mix = (() => {
  // ===== Mode Mixture: content (lesson + drills). Engine: build/harmony/engine.js =====
  const okSp = c => c.tones.every(n => Math.abs(n.a) < 2);
  // borrowed chords in a major key, built from the parallel (natural) minor
  const BOR = [
    { d: 1, q: "m", rn: "i" }, { d: 2, q: "d", rn: "ii°" }, { d: 2, q: "h7", rn: "iiø7" }, { d: 3, q: "M", rn: "♭III" },
    { d: 4, q: "m", rn: "iv" }, { d: 4, q: "m7", rn: "iv7" }, { d: 5, q: "m", rn: "v" }, { d: 6, q: "M", rn: "♭VI" }, { d: 7, q: "M", rn: "♭VII" }, { d: 7, q: "o7", rn: "vii°7", lt: true },
  ];
  const MAJRN = ["I", "ii", "iii", "IV", "V", "vi", "vii°"];
  const pm = (H, k) => H.key(k.name, "minor");
  function bor(H, k, b, inv = 0) {
    const root = b.lt ? H.deg(k, 7) : H.deg(pm(H, k), b.d);
    const c = H.chord(root, b.q, inv);
    const sev = c.tones.length === 4, figs = sev ? ["7", "65", "43", "42"] : ["", "6", "64"];
    const base = b.rn.replace(/7$/, "");
    const rn = sev ? base + figs[inv] : b.rn + figs[inv];
    return { c, rn, b };
  }
  const usable = (H, k) => BOR.every(b => okSp(bor(H, k, b).c));
  function pickKey(H) { for (let i = 0; i < 40; i++) { const k = H.randKey(["major"]); if (usable(H, k)) return k; } return H.key("C", "major"); }
  const spell = (H, c) => c.tones.map(H.nm).join("–");
  const diatRN = (k, d) => MAJRN[d - 1];
  function whyB(H, k, s) {
    const d = s.b.d, dc = H.diat(k, d, s.c.tones.length === 4), m = pm(H, k);
    const ch = s.c.tones.filter(n => !H.inKey(k, n)).map(H.nm);
    return `{sym:${s.c.sym}} is ${spell(H, s.c)}. ${ch.length ? `${ch.join(" and ")} ${ch.length > 1 ? "come" : "comes"} from ${m.label}, the parallel minor.` : ""} ${s.b.lt ? `It's the leading-tone 7th chord with le (♭6̂) borrowed from minor, so it's fully diminished: {rn:${s.rn}}.` : `In ${k.label} the chord on that degree is normally {sym:${dc.sym}} ({rn:${diatRN(k, d)}}); borrowed from minor it becomes {rn:${s.rn}}${/^♭/.test(s.b.rn) ? ": capital for a major chord, ♭ for the lowered root" : /^[iv]/.test(s.b.rn) ? ": lower case for minor (or diminished)" : ""}.`}`;
  }
  // near-miss labels for a borrowed chord
  function wrongRN(s) {
    const r = s.rn, out = new Set();
    const flip = x => x.replace(/^(♭?)([ivIV]+)/, (_, f, n) => f + (n === n.toUpperCase() ? n.toLowerCase() : n.toUpperCase()));
    out.add(flip(r)); out.add(r.startsWith("♭") ? r.slice(1) : "♭" + r); out.add(flip(r.startsWith("♭") ? r.slice(1) : "♭" + r));
    const alts = { "♭III": ["iii", "III", "♭iii", "V/vi"], "♭VI": ["vi", "VI", "♭vi", "IV"], "♭VII": ["vii°", "VII", "♭vii", "♭VII7"], i: ["I", "vi", "♭I"], iv: ["IV", "ii", "♭IV"], v: ["V", "iii", "♭v"], "ii°": ["ii", "vii°", "♭II"], "iiø7": ["ii7", "viiø7", "♭II7"], iv7: ["IV7", "ii7", "IV△7"], "vii°7": ["viiø7", "vii°7/V", "V7"] };
    (alts[r.replace(/\d+$/, "")] || alts[r] || []).forEach(x => out.add(x + (/\d$/.test(r) && !/\d$/.test(x) ? r.match(/\d+$/)[0] : "")));
    out.delete(r);
    return [...out].filter(x => !/[ivIV]°\d*$/.test(x) || true);
  }
  // secondary decoys for the "kind" mode (major or dom7 / °7 chords that are not borrowed)
  function secDecoy(H, k) {
    for (let i = 0; i < 30; i++) {
      const d = H.rnd([2, 3, 4, 5, 6]), T = H.deg(k, d);
      if (Math.random() < .55) { const q = d === 4 ? "7" : H.rnd(["M", "7"]), c = H.chord(H.up(T, 4, 7), q); if (okSp(c) && H.isChromatic(k, c)) return { c, kind: "dom", rn: (q === "7" ? "V7/" : "V/") + MAJRN[d - 1] }; }
      else { const c = H.chord(H.down(T, 1, 1), "o7"); if (okSp(c) && H.isChromatic(k, c) && d !== 1) return { c, kind: "lt", rn: "vii°7/" + MAJRN[d - 1] }; }
    }
    return { c: H.chord(H.up(H.deg(k, 5), 4, 7), "7"), kind: "dom", rn: "V7/V" };
  }
  const KIND = { mix: "Mode mixture (borrowed)", dom: "Secondary dominant", lt: "Secondary leading-tone chord", dia: "Diatonic" };
  function progFor(H, k, s) {
    const I = H.diat(k, 1), IV = H.diat(k, 4), V = H.diat(k, 5), I64 = H.diat(k, 1, false, 2);
    const r = s.b.rn, c = s.c;
    const P = {
      "♭VI": [[I, c, H.diat(k, 4), V, I], ["I", "?", "IV", "V", "I"], 1],
      "♭VII": [[I, H.diat(k, 4), c, I], ["I", "IV", "?", "I"], 2],
      "♭III": [[I, c, IV, I], ["I", "?", "IV", "I"], 1],
      iv: [[I, IV, c, I], ["I", "IV", "?", "I"], 2],
      iv7: [[I, IV, c, V, I], ["I", "IV", "?", "V", "I"], 2],
      "ii°": [[I, c, V, I], ["I", "?", "V", "I"], 1],
      "iiø7": [[I, c, V, I], ["I", "?", "V", "I"], 1],
      v: [[I, c, IV, I], ["I", "?", "IV", "I"], 1],
      i: [[I, c, IV, V, I], ["I", "?", "IV", "V", "I"], 1],
      "vii°7": [[I, IV, c, I], ["I", "IV", "?", "I"], 2],
    }[r];
    return P;
  }
  const CONCEPT = [
    ["Mode mixture (modal borrowing) means…", "using chords from the parallel key", ["using chords from the relative key", "changing key with a cadence", "using two modes at once in different instruments"], "Parallel keys share a tonic: C major borrows from C minor."],
    ["Does mode mixture change the key?", "no: only a cadence can confirm a new key", ["yes, always", "yes, if the chord is minor", "only in minor keys"], "Borrowed chords color the key without leaving it."],
    ["In a major key, a major chord changed to minor (like iv for IV) usually shows…", "mode mixture", ["a secondary dominant", "a modulation", "a Picardy third"], "Major → minor: mixture. Minor → major: usually a secondary dominant."],
    ["In a major key, a minor chord changed to major (like II for ii) usually shows…", "a secondary dominant", ["mode mixture", "a Picardy third", "a Neapolitan"], "D major in C major is V/V, not a borrowed chord."],
    ["What is a Picardy third?", "a major tonic chord at the end of a minor-key passage", ["a minor tonic in a major key", "a chord on the third degree", "a third added above a melody"], "Many minor-key pieces end on I instead of i."],
    ["In minor, using the raised leading tone (V, vii°) is…", "normal in minor, not mode mixture", ["mode mixture", "a secondary function", "a Picardy third"], "The raised 7th (and melodic minor's raised 6th) are native to the minor mode."],
    ["In C major, what does ♭VI tell you about the chord?", "it's major, built on A♭ (the lowered 6th degree)", ["it's minor, built on A", "it's major, built on A", "it's diminished, built on A♭"], "Capital = major; ♭ = the root is the lowered scale degree."],
    ["Which borrowed chord shares two notes with V and leads well to it?", "iiø⁷", ["♭VII", "♭III", "i"], "iiø⁷ (borrowed from minor) is a strong pre-dominant."],
  ];

  function make(mode, H) {
    // no diminished triad (ii°) in the drills: D° in C major could just as well be vii°/♭III
    const k = pickKey(H), b = H.rnd(BOR.filter(x => x.q !== "d")), inv = b.q.length > 1 && Math.random() < .25 ? 1 : 0;
    const s = bor(H, k, b, b.d === 1 || b.lt ? 0 : inv);
    if (mode === "label") {
      if (Math.random() < .12) {
        const m = H.key(H.rnd(H.KEYS.minor), "minor"), I = H.chord(m.tonic, "M");
        return H.mc(`In ${m.label}, a piece ends on {sym:${I.sym}}. What is it?`, "I", ["i", "III", "V/iv"], `A major tonic at the end of a minor-key passage is a Picardy third: label it I (capital: major).`, { big: `{sym:${I.sym}}`, kicker: `Label it · ${m.label}`, fmt: "rn" });
      }
      return H.mc(`In ${k.label}, label {sym:${s.c.sym}} with a Roman numeral.`, s.rn, wrongRN(s), whyB(H, k, s), { big: `{sym:${s.c.sym}}`, kicker: `Label it · ${k.label}`, fmt: "rn" });
    }
    if (mode === "spell") {
      const w = new Set(), dc = H.diat(k, b.d, s.c.tones.length === 4, s.c.bass);
      if (!b.lt) w.add(dc.sym);
      const r = s.c.tones[0];
      if (r.a === -1) { const e = H.down(r, 1, 0); if (Math.abs(e.a) < 2) w.add(H.chord(e, b.q, s.c.bass).sym); }
      const flipQ = { M: "m", m: "M", d: "m", h7: "m7", m7: "7", o7: "h7" }[b.q]; w.add(H.chord(r, flipQ, s.c.bass).sym);
      const nat = H.N(r.l, r.a + 1); if (b.rn.startsWith("♭")) w.add(H.chord(nat, b.q, s.c.bass).sym);
      if (s.c.tones.length > 1) w.add(H.chord(r, b.q, (s.c.bass + 1) % s.c.tones.length).sym);
      w.delete(s.c.sym);
      return H.mc(`In ${k.label}, which chord is {rn:${s.rn}}?`, s.c.sym, [...w], whyB(H, k, s), { big: s.rn, bigFmt: "rn", kicker: `Spell it · ${k.label}`, fmt: "sym" });
    }
    if (mode === "kind") {
      const r = Math.random();
      if (r < .45) { const bb = H.rnd(BOR.filter(x => !x.lt && x.d !== 1 && x.q !== "d")), ss = bor(H, k, bb); return H.mc(`In ${k.label}, what kind of chord is {sym:${ss.c.sym}}?`, KIND.mix, [KIND.dom, KIND.lt, KIND.dia], whyB(H, k, ss), { big: `{sym:${ss.c.sym}}`, kicker: `Borrowed or secondary? · ${k.label}` }); }
      if (r < .85) { const x = secDecoy(H, k); return H.mc(`In ${k.label}, what kind of chord is {sym:${x.c.sym}}?`, KIND[x.kind], [KIND.mix, KIND.dom, KIND.lt, KIND.dia], `{sym:${x.c.sym}} is ${spell(H, x.c)}. ${x.kind === "dom" ? "It's a major or dom7 chord where the key has a minor or diminished one (or a dom7 on I): a minor chord made major points to a secondary dominant," : "It's fully diminished with a raised note leading up to its target:"} {rn:${x.rn}}.`, { big: `{sym:${x.c.sym}}`, kicker: `Borrowed or secondary? · ${k.label}` }); }
      const d = H.rnd([2, 3, 4, 5, 6]), c = H.diat(k, d, Math.random() < .3);
      return H.mc(`In ${k.label}, what kind of chord is {sym:${c.sym}}?`, KIND.dia, [KIND.mix, KIND.dom, KIND.lt], `{sym:${c.sym}} is ${spell(H, c)}: every note is in ${k.label}. It's diatonic: {rn:${MAJRN[d - 1]}}.`, { big: `{sym:${c.sym}}`, kicker: `Borrowed or secondary? · ${k.label}` });
    }
    // staff
    if (Math.random() < .15) {
      const m = H.key(H.rnd(["A", "E", "D", "G", "C", "B"]), "minor"), I = H.chord(m.tonic, "M");
      const ch = [H.diat(m, 1), H.diat(m, 4), H.diat(m, 5), I], lab = ["i", "iv", "V", "?"];
      const staff = H.grand({ key: m, chords: ch, labels: lab, hl: 3 });
      return H.mc(`Key: ${m.label}. Label the highlighted chord.`, "I", ["i", "III", "V/iv", "♭III"], "The final tonic is major in a minor key: a Picardy third, labeled I.", { kicker: `On the staff · ${m.label}`, fmt: "rn", staff, staffAns: H.grand({ key: m, chords: ch, labels: ["i", "iv", "V", "I"], hl: 3 }), playQ: H.playOf(staff), playQLabel: "Play the progression", play: H.playOf(staff), playLabel: "Play again" });
    }
    const s0 = bor(H, k, b, 0), P = progFor(H, k, s0);
    const staff = H.grand({ key: k, chords: P[0], labels: P[1], hl: P[2] });
    const done = H.grand({ key: k, chords: P[0], labels: P[1].map(x => x === "?" ? s0.rn : x), syms: P[0].map(c => c.sym), hl: P[2] });
    return H.mc(`Key: ${k.label}. Label the highlighted chord.`, s0.rn, wrongRN(s0), whyB(H, k, s0), { kicker: `On the staff · ${k.label}`, fmt: "rn", staff, staffAns: done, playQ: H.playOf(staff), playQLabel: "Play the progression", play: H.playOf(staff), playLabel: "Play again" });
  }

  function reference(H) {
    const k = H.key("C", "major");
    return `<p>Borrowed chords in a major key come from its parallel minor. In C major:</p><div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Label</th><th scope="col">C major</th><th scope="col">Instead of</th></tr></thead><tbody>${BOR.map(b => { const s = bor(H, k, b); return `<tr><td>${H.rnHTML(s.rn)}</td><td>${H.symHTML(s.c.sym)}</td><td>${b.lt ? H.rnHTML("viiø7") : H.rnHTML(MAJRN[b.d - 1] + (b.q.length > 1 && b.d !== 7 ? "7" : ""))}</td></tr>`; }).join("")}</tbody></table></div>
      <p class="legend">Capital = major, lower case = minor, ° = diminished, ø = half-diminished; ♭ before the numeral = lowered root. A major chord made minor → mixture; a minor chord made major → secondary dominant.</p>`;
  }

  const lesson = { steps: [
    { title: "Borrowing from the parallel key", kick: "Same tonic", keyed: "major", defKey: "G", render: (H, k, U) => {
      const m = pm(H, k), maj = [1, 2, 3, 4, 5, 6, 7].map(d => H.diat(k, d)), min = [1, 2, 3, 4, 5, 6, 7].map(d => d === 7 ? H.chord(H.deg(m, 7), "M") : d === 5 ? H.chord(H.deg(m, 5), "m") : H.diat(m, d));
      return `<p><b>Mode mixture</b> (also called <i>modal borrowing</i>) means using chords from the <b>parallel</b> key, the key with the same tonic: a passage in ${H.esc(k.label)} using chords from ${H.esc(m.label)}. It is not a modulation: without a cadence in a new key, the chords are simply “borrowed.”</p>`
      + `<div class="lfigs">${U.fig(H.grand({ key: k, chords: maj, labels: MAJRN, syms: maj.map(c => c.sym) }), `${k.label}`)}${U.fig(H.grand({ key: m, chords: min, labels: ["i", "ii°", "III", "iv", "v", "VI", "VII"], syms: min.map(c => c.sym) }), `${m.label} (natural minor)`)}</div>`
      + `<p class="note">Using the raised leading tone (V, vii°) or melodic minor (sol–la–ti–do) in a minor key is <i>not</i> mode mixture: those notes are native to minor.</p>`;
    } },
    { title: "How to label borrowed chords", kick: "Case and flats", keyed: "major", defKey: "G", render: (H, k, U) => {
      const b3 = bor(H, k, BOR[3]), b6 = bor(H, k, BOR[7]);
      return `<ul><li><b>Same root, different quality:</b> just change the case. IV → <b>iv</b>, I → <b>i</b>, V → <b>v</b>, ii → <b>ii°</b> (or <b>iiø⁷</b>).</li>
      <li><b>Different root:</b> the mediant, submediant and subtonic are a half step lower in minor. Add ♭ to show the lowered root, and a capital for the major quality: <b>♭III</b>, <b>♭VI</b>, <b>♭VII</b>.</li>
      <li>Compare: in ${H.esc(k.label)}, iii is {sym:${H.diat(k, 3).sym}}; ♭III is {sym:${b3.c.sym}}. vi is {sym:${H.diat(k, 6).sym}}; ♭VI is {sym:${b6.c.sym}}.</li></ul>`
      + U.fig(H.grand({ key: k, chords: [H.diat(k, 6), b6.c, H.diat(k, 3), b3.c], labels: ["vi", "♭VI", "iii", "♭III"], syms: [H.diat(k, 6).sym, b6.c.sym, H.diat(k, 3).sym, b3.c.sym] }), "Diatonic chord, then its borrowed replacement.")
      + H.check(`In ${k.label}, how do you label {sym:${b6.c.sym}}?`, "♭VI", ["vi", "VI", "♭vi"], "Major (capital) on the lowered 6th degree (♭).", "rn");
    } },
    { title: "The borrowed chords", kick: "From minor into major", keyed: "major", defKey: "C", render: (H, k, U) => {
      const list = BOR.map(b => bor(H, k, b));
      return `<p>These chords become available in ${H.esc(k.label)} by borrowing from ${H.esc(pm(H, k).label)}:</p>`
      + U.fig(H.grand({ key: k, chords: list.slice(0, 5).map(s => s.c), labels: list.slice(0, 5).map(s => s.rn), syms: list.slice(0, 5).map(s => s.c.sym) }), "")
      + U.fig(H.grand({ key: k, chords: list.slice(5).map(s => s.c), labels: list.slice(5).map(s => s.rn), syms: list.slice(5).map(s => s.c.sym) }), "Each one contains at least one note from the parallel minor: me (♭3̂), le (♭6̂) or te (♭7̂).");
    } },
    { title: "Borrowed or secondary?", kick: "The rule of thumb", keyed: "major", defKey: "F", render: (H, k, U) => {
      const iv = bor(H, k, BOR[4]), II = H.chord(H.up(H.deg(k, 5), 4, 7), "M");
      return `<div class="callout"><b>Which way did it change?</b>A <b>major chord changed to minor</b> (IV → iv, V → v) usually reflects <b>mode mixture</b>. A <b>minor chord changed to major</b> (ii → II) usually makes a <b>secondary dominant</b>.</div>`
      + `<div class="lfigs">${U.fig(H.grand({ key: k, chords: [H.diat(k, 4), iv.c, H.diat(k, 1)], labels: ["IV", "iv", "I"], hl: 1 }), "IV → iv: borrowed", { small: true })}${U.fig(H.grand({ key: k, chords: [H.diat(k, 2), II, H.diat(k, 5)], labels: ["ii", "V/V", "V"], hl: 1 }), "ii → II: secondary dominant (V/V)", { small: true })}</div>`
      + H.check(`In ${k.label}, {sym:${II.sym}} replaces {sym:${H.diat(k, 2).sym}}. What is it most likely to be?`, "a secondary dominant", ["mode mixture", "a Picardy third", "a Neapolitan"], "A minor chord made major: V/V.")
      + H.check(`In ${k.label}, {sym:${iv.c.sym}} replaces {sym:${H.diat(k, 4).sym}}. What is it?`, "mode mixture (iv)", ["a secondary dominant", "a modulation", "a diatonic chord"], "A major chord made minor: borrowed iv.");
    } },
    { title: "Hear the color", kick: "Progressions", keyed: "major", defKey: "D", render: (H, k, U) => {
      const s6 = bor(H, k, BOR[7]).c, s7 = bor(H, k, BOR[8]).c, s3 = bor(H, k, BOR[3]).c, iv = bor(H, k, BOR[4]).c, ii = bor(H, k, BOR[2]).c;
      const I = H.diat(k, 1), IV = H.diat(k, 4), V = H.diat(k, 5);
      return `<p>Borrowed chords darken a major key for a moment. Play each progression and listen for the borrowed chord.</p><div class="lfigs">`
      + U.fig(H.grand({ key: k, chords: [I, s6, s7, I], labels: ["I", "♭VI", "♭VII", "I"], hl: [1, 2] }), "I – ♭VI – ♭VII – I", { small: true })
      + U.fig(H.grand({ key: k, chords: [I, IV, iv, I], labels: ["I", "IV", "iv", "I"], hl: 2 }), "I – IV – iv – I", { small: true })
      + U.fig(H.grand({ key: k, chords: [I, s3, IV, I], labels: ["I", "♭III", "IV", "I"], hl: 1 }), "I – ♭III – IV – I", { small: true })
      + U.fig(H.grand({ key: k, chords: [I, ii, V, I], labels: ["I", "iiø7", "V", "I"], hl: 1 }), "I – iiø⁷ – V – I", { small: true }) + `</div>`;
    } },
    { title: "The Picardy third", kick: "And its opposite", keyed: "minor", defKey: "A", render: (H, k, U) => {
      const I = H.chord(k.tonic, "M");
      return `<p>Mixture works the other way too. The <b>Picardy third</b> is a <b>major tonic</b> in a minor key, usually at the very end of a piece or phrase. (Where the name comes from has been lost to history.) Label it <b>I</b>.</p>`
      + U.fig(H.grand({ key: k, chords: [H.diat(k, 1), H.diat(k, 6), H.diat(k, 2, false, 1), H.diat(k, 5), I], labels: ["i", "VI", "ii°6", "V", "I"], syms: [], hl: 4 }), `${k.label}: i – VI – ii°⁶ – V – I`)
      + `<p>The opposite, a <b>minor tonic</b> in a major key, is much rarer. It has a name too: see the next step.</p>`;
    } },
    { title: "The Mercury third", kick: "A term by Adam Silverman", render: (H, _k, U) => {
      // The end of the chorus of "We Are the Champions" (chords only, in F major as in the published version), from Dr. Silverman's analysis.
      const k = H.key("F", "major"), P = s => H.parse(s);
      const ch = (sym, bass, upper) => ({ sym, v: { bass: P(bass), upper: upper.map(P) } });
      const C = [ch("F", "F2", ["C4", "F4", "A4"]), ch("E♭9(♯11)/G", "G2", ["B♭3", "D♭4", "E♭4", "F4", "A4"]), ch("A♭6", "A♭2", ["C4", "E♭4", "F4", "A♭4"]),
        ch("B♭", "B♭2", ["D4", "F4", "B♭4"]), ch("C7(sus4)", "C3", ["B♭3", "F4", "G4"]), ch("Fm", "F2", ["A♭3", "C4", "F4"])];
      const labs = ["I", "♭VII6", "♭III", "IV", "V7sus4", "i"];
      const g = H.grand({ key: k, chords: C, labels: labs, syms: C.map(c => c.sym), hl: 5 });
      return `<p>If a major tonic in a minor key is a Picardy third, what do you call the opposite: a <b>minor tonic chord (i) arriving in a major-key context</b>? Dr. Adam Silverman calls it the <b>Mercury third</b>, after Freddie Mercury, Queen's singer and the composer of <i>We Are the Champions</i>, whose chorus ends on one. (Dr. Silverman suggests the name; please pass it on!)</p>
      <p>The chorus is in F major (as in the published version), and every diatonic chord of F major appears in it. Only at the end do borrowed chords take over:</p>`
      + U.fig(g, `The chords at the end of the chorus, in F major. Play them and listen for the minor tonic at the end.`)
      + `<ul><li>{sym:E♭9(♯11)/G} is {rn:♭VII6}: borrowed from F minor, with color tones (9th and ♯11th) added.</li>
      <li>{sym:A♭6} (an A♭ chord with F added) is {rn:♭III}.</li>
      <li>{sym:B♭} is the diatonic {rn:IV}, and {sym:C7(sus4)} is the dominant. The E♭ sung over it makes it sound like Cm⁷, which would be mode mixture too ({rn:v7}).</li>
      <li>{sym:Fm} is the <b>Mercury third</b>: {rn:i}, a minor tonic where a major one is expected. It also points toward the minor-key verse that follows.</li></ul>`
      + `<div class="callout"><b>Picardy third vs. Mercury third</b>Picardy third: minor key, ends on a <i>major</i> tonic (I). Mercury third: major key, ends on a <i>minor</i> tonic (i). Both are mode mixture applied to the tonic chord itself.</div>`
      + H.check("A phrase full of F-major chords ends on {sym:Fm}. What is it called?", "a Mercury third", ["a Picardy third", "a Neapolitan", "a secondary dominant"], "A minor tonic in a major key: Adam Silverman's “Mercury third.”");
    } },
    { title: "Quick check", kick: "Before the drills", keyed: "major", defKey: "E♭", render: (H, k) => {
      const a = bor(H, k, BOR[7]), b = bor(H, k, BOR[4]), c = bor(H, k, BOR[8]);
      return H.check(`In ${k.label}, label {sym:${a.c.sym}}.`, a.rn, wrongRN(a).slice(0, 3), whyB(H, k, a), "rn")
        + H.check(`In ${k.label}, which chord is {rn:${c.rn}}?`, c.c.sym, [H.diat(k, 7).sym, H.chord(H.N(c.c.tones[0].l, c.c.tones[0].a + 1), "M").sym, H.chord(c.c.tones[0], "m").sym], whyB(H, k, c), "sym")
        + H.check(`In ${k.label}, {sym:${b.c.sym}} is…`, KIND.mix, [KIND.dom, KIND.lt, KIND.dia], whyB(H, k, b))
        + H.check(CONCEPT[4][0], CONCEPT[4][1], CONCEPT[4][2], CONCEPT[4][3]);
    } },
  ] };

  return {
    key: "silverapps-mixture-v1", lesson, make, reference,
    modes: [{ id: "label", kicker: "Label it" }, { id: "spell", kicker: "Spell it" }, { id: "kind", kicker: "Borrowed or secondary?" }, { id: "staff", kicker: "On the staff" }],
    topics: [],
  };
})();

(window.FAMS = window.FAMS || {}).nea = (() => {
  // ===== Neapolitan Chords: content (lesson + drills). Engine: build/harmony/engine.js =====
  const okSp = c => c.tones.every(n => Math.abs(n.a) < 2);
  const nRoot = (H, k) => H.up(k.tonic, 1, 1);                       // ♭2̂: the letter above the tonic, a half step up
  const N = (H, k, inv = 1) => H.chord(nRoot(H, k), "M", inv, inv === 1 ? { rh: Math.random() < .5 ? [0, 2, 0] : [0, 2, 2] } : {});   // ♭II⁶: 3rd in the bass, right hand root + 5th with one of them doubled
  const usable = (H, k) => okSp(N(H, k));
  const T = k => k.mode === "minor" ? "i" : "I";
  function pickKey(H, modes) {
    const on = H.topicsOn(), ms = modes || [on.includes("maj") && "major", on.includes("min") && "minor"].filter(Boolean);
    for (let i = 0; i < 40; i++) { const k = H.randKey(ms.length ? ms : ["minor"]); if (usable(H, k)) return k; }
    return H.key("A", "minor");
  }
  const kt = k => k.mode === "major" ? "maj" : "min";
  const lt5 = (H, k) => H.chord(H.down(H.deg(k, 5), 1, 1), "o7", 0);   // vii°7/V
  const ivc = (H, k, inv = 0) => H.diat(k, 4, false, inv), iiC = (H, k, inv = 1) => H.diat(k, 2, false, inv);
  const ivRN = k => k.mode === "minor" ? "iv" : "IV", iiRN = k => k.mode === "minor" ? "ii°" : "ii";
  const VI = (H, k) => k.mode === "minor" ? H.diat(k, 6) : H.chord(H.down(H.deg(k, 6), 0, 1), "M");  // VI in minor, ♭VI in major
  const VIRN = k => k.mode === "minor" ? "VI" : "♭VI";
  const VofV = (H, k, inv = 0) => H.chord(H.up(H.deg(k, 5), 4, 7), "M", inv);
  // look-alikes for ♭II⁶: chords with the same bass (4̂) or a near-identical spelling
  function lookAlikes(H, k) {
    return [
      { c: iiC(H, k, 1), rn: iiRN(k) + "6", why: `${iiRN(k)}⁶ has the same bass, but its root is the diatonic 2̂ (${H.nm(H.deg(k, 2))}), not ♭2̂.` },
      { c: ivc(H, k, 0), rn: ivRN(k), why: `${ivRN(k)} has 4̂ in the bass too, but its root is 4̂ itself.` },
      { c: VI(H, k), rn: VIRN(k), why: `${VIRN(k)} is built on ♭6̂.` },
      { c: VofV(H, k, 0), rn: "V/V", why: `A major chord on the diatonic 2̂ is V/V, a secondary dominant.` },
    ].filter(x => okSp(x.c));
  }
  const RN_POOL = k => ["♭II6", "♭II", iiRN(k) + "6", ivRN(k), ivRN(k) + "6", VIRN(k), "V/V", "♭II64"];
  const tonesTxt = (H, c) => c.tones.map(H.nm).join("–");
  const whyN = (H, k, c) => `In ${k.label}, 2̂ is ${H.nm(H.deg(k, 2))}; lowered it is ${H.nm(nRoot(H, k))}. The Neapolitan is the major triad on it: ${tonesTxt(H, c)}${c.bass === 1 ? `, here with its 3rd (${H.nm(c.tones[1])}, which is 4̂) in the bass: {rn:♭II6}` : c.bass === 2 ? ", with its 5th in the bass: {rn:♭II64}" : ", in root position: {rn:♭II}"}.`;

  // progressions: index of the Neapolitan slot in each
  function prog(H, k) {
    const n = N(H, k, 1), i64 = H.diat(k, 1, false, 2), V = H.diat(k, 5), I = H.diat(k, 1);
    const opts = k.mode === "minor" ? [
      { ch: [I, ivc(H, k), n, i64, V, I], lab: ["i", "iv", "♭II6", "i64", "V", "i"], at: 2 },
      { ch: [I, n, lt5(H, k), V, I], lab: ["i", "♭II6", "vii°7/V", "V", "i"], at: 1 },
      { ch: [I, VI(H, k), n, V, I], lab: ["i", "VI", "♭II6", "V", "i"], at: 2 },
    ] : [
      { ch: [I, ivc(H, k), n, V, I], lab: ["I", "IV", "♭II6", "V", "I"], at: 2 },
      { ch: [I, H.diat(k, 6), n, i64, V, I], lab: ["I", "vi", "♭II6", "I64", "V", "I"], at: 2 },
    ];
    return H.rnd(opts);
  }

  const USE = [
    ["In ♭II⁶ voiced in keyboard style, what does the right hand play above the bass?", "the root and 5th, doubling one of them", ["the 3rd three times", "only the 3rd and 5th", "the leading tone and the root"], "The 3rd (4̂) is in the bass; the right hand takes ♭2̂ and ♭6̂, doubling the root or the 5th."],
    ["What chord does ♭II⁶ most often move to?", "V (or V⁷)", ["I", "IV", "vi"], "It is a strong pre-dominant: it leads to the dominant, sometimes through i⁶₄ or vii°⁷/V."],
    ["Which scale degree is in the bass of ♭II⁶?", "4̂ (fa)", ["♭2̂ (ra)", "♭6̂ (le)", "1̂ (do)"], "The 3rd of the chord is 4̂, which is why it sounds so much like iv or ii°⁶ at first."],
    ["Where does ♭2̂ (ra) tend to go?", "down, toward the leading tone (through 1̂)", ["up to 3̂", "up to 2̂", "it stays put"], "♭2̂ falls: ♭2̂–1̂–7̂, often with i⁶₄ or vii°⁷/V between ♭II⁶ and V."],
    ["Why does i⁶₄ or vii°⁷/V often come between ♭II⁶ and V?", "to smooth the melodic diminished 3rd from ♭2̂ down to 7̂", ["to avoid parallel octaves in the bass", "to change key", "to double the leading tone"], "With a chord in between, ♭2̂ steps down to 1̂ and then to 7̂."],
    ["The Neapolitan is a…", "major triad", ["minor triad", "diminished triad", "dominant seventh"], "Always major, built on ♭2̂."],
    ["In which mode is the Neapolitan more common?", "minor", ["major", "Dorian", "it is only used in major"], "It appears in both, but it fits minor best: in major it also borrows ♭6̂."],
    ["What does “Neapolitan sixth” refer to?", "♭II in first inversion", ["a chord built on the 6th degree", "a major 6th interval", "an augmented sixth chord"], "It is most often found in first inversion, so ♭II⁶."],
    ["The Neapolitan chord has which function?", "pre-dominant", ["tonic", "dominant", "it has no function"], "Like ii⁶ and iv, it prepares the dominant."],
    ["Why is the chord called “Neapolitan”?", "it was a favorite of composers in Naples in the 18th century", ["it was invented in Naples in the 20th century", "its root is the Neapolitan scale degree", "it was first used in Neapolitan folk songs only"], "The name points to its use by a group of 18th-century composers in Naples."],
  ];

  function make(mode, H) {
    if (mode === "spell") {
      const k = pickKey(H), inv = 1, c = N(H, k, inv), rn = "♭II6";
      const wrong = new Set();
      wrong.add(H.chord(nRoot(H, k), "M", inv ? 0 : 1).sym);
      wrong.add(H.chord(nRoot(H, k), "M", 2).sym);
      wrong.add(H.chord(nRoot(H, k), "m", inv).sym);
      const d2 = H.deg(k, 2), alt = H.chord(d2, "M", inv); if (okSp(alt)) wrong.add(alt.sym);
      const en = nRoot(H, k).a === -1 ? H.down(nRoot(H, k), 1, 0) : null;
      if (en && okSp(H.chord(en, "M", inv))) wrong.add(H.chord(en, "M", inv).sym);
      wrong.delete(c.sym);
      return H.mc(`In ${k.label}, which chord is {rn:${rn}}?`, c.sym, [...wrong], whyN(H, k, c), { big: rn, bigFmt: "rn", kicker: `Spell it · ${k.label}`, fmt: "sym", topic: kt(k) });
    }
    if (mode === "label") {
      const k = pickKey(H);
      if (Math.random() < .55) {
        const inv = 1, c = N(H, k, inv), rn = "♭II6";
        return H.mc(`In ${k.label}, label {sym:${c.sym}} with a Roman numeral.`, rn, RN_POOL(k), whyN(H, k, c), { big: `{sym:${c.sym}}`, kicker: `Label it · ${k.label}`, fmt: "rn", topic: kt(k) });
      }
      const x = H.rnd(lookAlikes(H, k)), n = N(H, k, 1);
      return H.mc(`In ${k.label}, label {sym:${x.c.sym}} with a Roman numeral.`, x.rn, ["♭II6", "♭II"].concat(RN_POOL(k)), `{sym:${x.c.sym}} is ${tonesTxt(H, x.c)}. ${x.why} The Neapolitan sixth here would be {sym:${n.sym}}.`, { big: `{sym:${x.c.sym}}`, kicker: `Label it · ${k.label}`, fmt: "rn", topic: kt(k) });
    }
    if (mode === "staff") {
      const k = pickKey(H), p = prog(H, k);
      let ans = "♭II6", why = whyN(H, k, p.ch[p.at]);
      if (Math.random() < .35) {
        const x = H.rnd(lookAlikes(H, k).filter(y => y.rn !== "V/V" || p.ch[p.at + 1] !== p.ch[p.at]));
        p.ch = p.ch.slice(); p.ch[p.at] = x.c; p.lab = p.lab.slice(); p.lab[p.at] = x.rn; ans = x.rn;
        why = `{sym:${x.c.sym}} is ${tonesTxt(H, x.c)}. ${x.why} The Neapolitan sixth in ${k.label} would be {sym:${N(H, k, 1).sym}}.`;
      }
      const labels = p.lab.map((l, i) => i === p.at ? "?" : l);
      const staff = H.grand({ key: k, chords: p.ch, labels, hl: p.at });
      const done = H.grand({ key: k, chords: p.ch, labels: p.lab, syms: p.ch.map(c => c.sym), hl: p.at });
      return H.mc(`Key: ${k.label}. Label the highlighted chord.`, ans, RN_POOL(k), why, { kicker: `On the staff · ${k.label}`, fmt: "rn", staff, staffAns: done, playQ: H.playOf(staff), playQLabel: "Play the progression", play: H.playOf(staff), playLabel: "Play again", topic: kt(k) });
    }
    // use
    if (Math.random() < .3) {
      const k = pickKey(H), c = N(H, k, 0);
      const others = H.KEYS[k.mode].filter(n => n !== k.name).map(n => H.key(n, k.mode)).filter(x => usable(H, x)).map(x => x.label);
      return H.mc(`{sym:${c.sym}} is the Neapolitan (♭II) of which key?`, k.label, others, `${H.nm(c.tones[0])} is a half step above ${H.nm(k.tonic)}, so it is ♭2̂ of ${k.label}.`, { kicker: "How it's used", topic: kt(k) });
    }
    const [q, a, w, why] = H.rnd(USE);
    return H.mc(q, a, w, why, { kicker: "How it's used" });
  }

  function reference(H) {
    const rows = H.KEYS.minor.map(n => H.key(n, "minor")).filter(k => usable(H, k)).map(k => `<tr><td>${H.accHTML(k.label)}</td><td>${H.symHTML(N(H, k, 0).sym)}</td><td>${H.symHTML(N(H, k, 1).sym)}</td></tr>`).join("");
    return `<p>♭II = a <b>major</b> triad on the lowered 2nd degree. ♭II⁶ puts its 3rd (4̂) in the bass, with the root and 5th above (one of them doubled); it resolves to V (often via i⁶₄ or vii°⁷/V).</p>
      <div class="ltable-wrap"><table class="ltable"><caption>The Neapolitan in minor keys</caption><thead><tr><th scope="col">Key</th><th scope="col">♭II</th><th scope="col">♭II⁶</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  const lesson = { defMode: "minor", steps: [
    { title: "A major chord on ♭2̂", kick: "What it is", keyed: "both", defKey: "A", render: (H, k, U) => {
      const n0 = N(H, k, 0), n6 = N(H, k, 1), d2 = H.deg(k, 2);
      return `<p>Build a major triad on the second scale degree <b>lowered by a half step</b> (♭2̂, “ra”) and you get the <b>Neapolitan</b> chord, labeled <b>♭II</b>. Its name points to a group of composers in Naples who used it often in the 18th century.</p>
      <p>In ${H.esc(k.label)}, 2̂ is ${H.esc(H.nm(d2))}; ♭2̂ is <b>${H.esc(H.nm(nRoot(H, k)))}</b>, so ♭II is {sym:${n0.sym}} (${H.esc(tonesTxt(H, n0))}). It is spelled on the letter above the tonic: it is <i>not</i> a chord on a raised 1̂.</p>`
      + U.fig(H.grand({ key: k, chords: [H.diat(k, 1), n6, H.diat(k, 5, true), H.diat(k, 1)], labels: [T(k), "♭II6", "V7", T(k)], syms: [H.diat(k, 1).sym, n6.sym, H.diat(k, 5, true).sym, H.diat(k, 1).sym], hl: 1 }), `♭II⁶ moving to V⁷. Listen to how dark and “far away” the chord sounds.`)
      + `<div class="callout"><b>Three things to remember</b>Always major. Always on ♭2̂. Most often in first inversion, as ♭II⁶ (the “Neapolitan sixth”).</div>`;
    } },
    { title: "Spell it in any key", kick: "Three steps", keyed: "both", defKey: "E", render: (H, k, U) => {
      if (!usable(H, k)) return `<p>In ${H.esc(k.label)} the Neapolitan would need a double flat. Choose another key above.</p>`;
      const n0 = N(H, k, 0), n6 = N(H, k, 1);
      return `<ol><li>Find 2̂ in the key: <b>${H.esc(H.nm(H.deg(k, 2)))}</b>.</li><li>Lower it a half step, keeping the same letter: <b>${H.esc(H.nm(nRoot(H, k)))}</b>.</li><li>Build a <b>major</b> triad on it: {sym:${n0.sym}} = ${H.esc(tonesTxt(H, n0))}. For ♭II⁶, put its 3rd in the bass: {sym:${n6.sym}}.</li></ol>`
      + U.fig(H.grand({ key: k, chords: [H.diat(k, 1), n6, H.diat(k, 5, true), H.diat(k, 1)], labels: [T(k), "♭II6", "V7", T(k)], syms: [H.diat(k, 1).sym, n6.sym, H.diat(k, 5, true).sym, H.diat(k, 1).sym], hl: 1 }), `${k.label}: ♭II⁶ (${n6.sym}). The 3rd of the chord, ${H.nm(n6.tones[1])}, is 4̂ of the key and is in the bass.`)
      + H.check(`In ${k.label}, which chord is {rn:♭II6}?`, n6.sym, [H.chord(nRoot(H, k), "M", 0).sym, H.chord(nRoot(H, k), "m", 1).sym, okSp(H.chord(H.deg(k, 2), "M", 1)) ? H.chord(H.deg(k, 2), "M", 1).sym : H.chord(nRoot(H, k), "M", 2).sym], "Major triad on ♭2̂, with the 3rd (4̂) in the bass.", "sym");
    } },
    { title: "First inversion: the 3rd in the bass", kick: "♭II⁶", keyed: "both", defKey: "D", render: (H, k, U) => {
      const n6 = N(H, k, 1), ii6 = iiC(H, k, 1), iv = ivc(H, k);
      return `<p>The Neapolitan is most often in <b>first inversion</b>, ♭II⁶, with 4̂ in the bass, the same bass note as ${k.mode === "minor" ? "iv and ii°⁶" : "IV and ii⁶"}, the other pre-dominants. Put the <b>3rd in the bass</b>; above it, the right hand plays the <b>root and 5th</b>, doubling one of them, as in every example here.</p>`
      + U.fig(H.grand({ key: k, chords: [iv, ii6, n6], labels: [ivRN(k), iiRN(k) + "6", "♭II6"], syms: [iv.sym, ii6.sym, n6.sym], hl: 2 }), `Three pre-dominants over the same bass. Only ♭II⁶ lowers 2̂ (${H.nm(H.deg(k, 2))} → ${H.nm(nRoot(H, k))}).`)
      + H.check("In ♭II⁶, which chord tone is in the bass?", "the 3rd (4̂)", ["the root (♭2̂)", "the 5th (♭6̂)", "the leading tone"], "First inversion: the 3rd of the chord, 4̂ of the key, is in the bass.");
    } },
    { title: "Where it goes", kick: "To the dominant", keyed: "both", defKey: "A", render: (H, k, U) => {
      const n6 = N(H, k, 1), V = H.diat(k, 5), I = H.diat(k, 1), i64 = H.diat(k, 1, false, 2), lt = lt5(H, k), t = T(k);
      return `<p>♭II⁶ is a strong <b>pre-dominant</b>: it moves to <b>V</b>. Because ♭2̂ falls toward the leading tone, a melodic diminished 3rd (♭2̂ down to 7̂) can appear; composers often put a chord in between to fill it in:</p>
      <ul><li><b>${t}⁶₄</b> (cadential six-four): ♭2̂ → 1̂ → 7̂.</li><li><b>vii°⁷/V</b>: the bass moves up chromatically (4̂ → ♯4̂ → 5̂).</li></ul>
      <div class="lfigs">${U.fig(H.grand({ key: k, chords: [n6, V, I], labels: ["♭II6", "V", t], hl: 0 }), "Straight to V", { small: true })}${U.fig(H.grand({ key: k, chords: [n6, i64, V, I], labels: ["♭II6", t + "64", "V", t], hl: 0 }), `Through ${t}⁶₄`, { small: true })}${U.fig(H.grand({ key: k, chords: [n6, lt, V, I], labels: ["♭II6", "vii°7/V", "V", t], hl: 0 }), "Through vii°⁷/V", { small: true })}</div>`;
    } },
    { title: "In major keys", kick: "Borrowed color", keyed: "major", defKey: "C", render: (H, k, U) => {
      if (!usable(H, k)) return `<p>In ${H.esc(k.label)} the Neapolitan would need a double flat. Choose another key above.</p>`;
      const n6 = N(H, k, 1), n0 = N(H, k, 0);
      return `<p>The Neapolitan appears in major keys too. There it needs <b>two</b> lowered notes: ♭2̂ and ♭6̂ (borrowed from the parallel minor). In ${H.esc(k.label)}: {sym:${n0.sym}} = ${H.esc(tonesTxt(H, n0))}.</p>`
      + U.fig(H.grand({ key: k, chords: [H.diat(k, 1), H.diat(k, 4), n6, H.diat(k, 1, false, 2), H.diat(k, 5), H.diat(k, 1)], labels: ["I", "IV", "♭II6", "I64", "V", "I"], hl: 2 }), `${k.label}: I – IV – ♭II⁶ – I⁶₄ – V – I`)
      + `<p>Chords on other lowered degrees (♭III, ♭VI, ♭VII) are covered in the Mode Mixture part of this lesson. In popular music you'll also hear ♭II in root position, and sometimes resolving straight to I.</p>`;
    } },
    { title: "Look-alike chords", kick: "Is it really ♭II?", keyed: "both", defKey: "G", render: (H, k, U) => {
      const xs = lookAlikes(H, k), n6 = N(H, k, 1);
      return `<p>Several chords share the Neapolitan's bass note or most of its letters. The test is simple: <b>is the root ♭2̂ and is the chord major?</b></p>
      <div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Chord</th><th scope="col">Label</th><th scope="col">Why</th></tr></thead><tbody>
      <tr><td>{sym:${n6.sym}}</td><td>{rn:♭II6}</td><td>major triad on ♭2̂, 4̂ in the bass</td></tr>
      ${xs.map(x => `<tr><td>{sym:${x.c.sym}}</td><td>{rn:${x.rn}}</td><td>${H.esc(x.why)}</td></tr>`).join("")}</tbody></table></div>`
      + U.fig(H.grand({ key: k, chords: [xs[0].c, n6], labels: [xs[0].rn, "♭II6"], syms: [xs[0].c.sym, n6.sym] }), "One note different, a different chord.");
    } },
    { title: "Quick check", kick: "Before the drills", keyed: "both", defKey: "E", render: (H, k) => {
      if (!usable(H, k)) return `<p>Choose another key above (this one would need a double flat).</p>`;
      const n6 = N(H, k, 1), x = lookAlikes(H, k)[0];
      return H.check(`In ${k.label}, which chord is {rn:♭II6}?`, n6.sym, [x.c.sym, H.chord(nRoot(H, k), "M", 0).sym, H.chord(nRoot(H, k), "m", 1).sym], whyN(H, k, n6), "sym")
        + H.check(`In ${k.label}, what is {sym:${x.c.sym}}?`, x.rn, ["♭II6", "♭II", "V/V"].filter(v => v !== x.rn), x.why, "rn")
        + H.check(USE[1][0], USE[1][1], USE[1][2], USE[1][3]) + H.check(USE[0][0], USE[0][1], USE[0][2], USE[0][3]);
    } },
  ] };

  return {
    key: "silverapps-neapolitan-v1", lesson, make, reference,
    modes: [{ id: "spell", kicker: "Spell it" }, { id: "label", kicker: "Label it" }, { id: "staff", kicker: "On the staff" }, { id: "use", kicker: "How it's used" }],
    topics: [{ id: "min", name: "Minor keys", group: "keys" }, { id: "maj", name: "Major keys", group: "keys" }],
  };
})();

(window.FAMS = window.FAMS || {}).aug = (() => {
  // ===== Augmented Sixth Chords: content (lesson + drills). Engine: build/harmony/engine.js =====
  const TYPES = ["It", "Fr", "Ger"], RN = { It: "It+6", Fr: "Fr+6", Ger: "Ger+6" }, NAME = { It: "Italian", Fr: "French", Ger: "German" };
  const ADD = { It: "do (1̂)", Fr: "do (1̂) and re (2̂)", Ger: "do (1̂) and me (♭3̂)" };
  const deg = (H, k, which) => ({
    le: k.mode === "minor" ? H.deg(k, 6) : H.down(H.deg(k, 6), 0, 1),
    fi: H.up(H.deg(k, 4), 0, 1), do: H.deg(k, 1), re: H.deg(k, 2),
    me: k.mode === "minor" ? H.deg(k, 3) : H.down(H.deg(k, 3), 0, 1),
    sol: H.deg(k, 5), solb: H.down(H.deg(k, 5), 0, 1),
  })[which];
  // tones listed bass first; rh = which tones the right hand takes
  function A6(H, k, t) {
    const le = deg(H, k, "le"), d = deg(H, k, "do"), fi = deg(H, k, "fi");
    const tones = t === "It" ? [le, d, fi] : [le, d, t === "Fr" ? deg(H, k, "re") : deg(H, k, "me"), fi];
    const rh = t === "It" ? [1, 1, 2] : [1, 2, 3];
    return { tones, q: t, bass: 0, rh, sym: lead(H, k, t) };
  }
  const lead = (H, k, t) => H.nm(deg(H, k, "le")) + (t === "Ger" ? "7" : t === "Fr" ? "7(♭5)" : "7(no5)");
  const okSp = c => c.tones.every(n => Math.abs(n.a) < 2);
  const usable = (H, k) => TYPES.every(t => okSp(A6(H, k, t))) && Math.abs(deg(H, k, "solb").a) < 2;
  const spell = (H, c) => c.tones.map(H.nm).join("–");
  const kt = k => k.mode === "major" ? "maj" : "min";
  function pickKey(H) {
    const on = H.topicsOn(), ms = [on.includes("min") && "minor", on.includes("maj") && "major"].filter(Boolean);
    for (let i = 0; i < 40; i++) { const k = H.randKey(ms.length ? ms : ["minor"]); if (usable(H, k)) return k; }
    return H.key("C", "minor");
  }
  const pickType = H => { const on = H.topicsOn().filter(t => TYPES.includes(t)); return H.rnd(on.length ? on : TYPES); };
  const T = k => k.mode === "minor" ? "i" : "I";
  // the dominant-7th twin of the German sixth: same sound, sol♭ instead of fi → V7 of ♭II
  const twin = (H, k) => ({ tones: [deg(H, k, "le"), deg(H, k, "do"), deg(H, k, "me"), deg(H, k, "solb")], q: "7", bass: 0, rh: [1, 2, 3], sym: H.nm(deg(H, k, "le")) + "7" });
  const whyType = (H, k, t) => {
    const c = A6(H, k, t);
    return `${spell(H, c)} in ${k.label}: le (${H.nm(c.tones[0])}) in the bass and fi (${H.nm(c.tones[c.tones.length - 1])}) above it make the augmented sixth. Adding ${ADD[t]} makes it ${NAME[t]}: {rn:${RN[t]}}.`;
  };
  function prog(H, k, t) {
    const a = A6(H, k, t), V = H.diat(k, 5), I = H.diat(k, 1), i64 = H.diat(k, 1, false, 2), iv6 = H.diat(k, 4, false, 1), t0 = T(k);
    const opts = k.mode === "minor" ? [
      { ch: [I, iv6, a, V, I], lab: ["i", "iv6", RN[t], "V", "i"], at: 2 },
      { ch: [I, H.diat(k, 6), a, i64, V, I], lab: ["i", "VI", RN[t], "i64", "V", "i"], at: 2 },
      { ch: [I, a, i64, V, I], lab: ["i", RN[t], "i64", "V", "i"], at: 1 },
    ] : [
      { ch: [I, H.diat(k, 4, false, 1), a, i64, V, I], lab: ["I", "IV6", RN[t], "I64", "V", "I"], at: 2 },
      { ch: [I, a, i64, V, I], lab: ["I", RN[t], "I64", "V", "I"], at: 1 },
    ];
    if (t !== "Ger") opts.push({ ch: [I, a, V, I], lab: [t0, RN[t], "V", t0], at: 1 });
    const p = H.rnd(opts);
    // the German sixth goes through the cadential six-four (no parallel fifths)
    if (t === "Ger" && p.lab[p.at + 1] === "V") { p.ch = p.ch.slice(); p.lab = p.lab.slice(); p.ch.splice(p.at + 1, 0, i64); p.lab.splice(p.at + 1, 0, t0 + "64"); }
    return p;
  }
  const POOL = k => ["It+6", "Fr+6", "Ger+6", k.mode === "minor" ? "iv6" : "IV6", "V7/♭II", "vii°7/V"];

  const CONCEPT = [
    ["The augmented sixth in these chords is formed by…", "le (♭6̂) and fi (♯4̂)", ["do (1̂) and le (♭6̂)", "re (2̂) and fi (♯4̂)", "sol (5̂) and me (♭3̂)"], "Le in the bass, fi above: an augmented sixth that expands to an octave on sol."],
    ["How does the augmented sixth resolve?", "outward: both notes move by half step to sol (5̂)", ["inward to a major 3rd", "both notes move down", "both notes stay"], "Le falls to sol and fi rises to sol, an octave apart."],
    ["What function do augmented sixth chords have?", "pre-dominant", ["tonic", "dominant", "subdominant substitute for I"], "They lead to V (or to the cadential six-four, then V)."],
    ["Which note does the German sixth add to the Italian?", "me (♭3̂)", ["re (2̂)", "sol (5̂)", "ti (7̂)"], "Italian: le, do, fi. German: le, do, me, fi."],
    ["Which note does the French sixth add to the Italian?", "re (2̂)", ["me (♭3̂)", "sol (5̂)", "la (6̂)"], "Italian: le, do, fi. French: le, do, re, fi."],
    ["Why does the German sixth often go to i⁶₄ (or I⁶₄) before V?", "to avoid parallel fifths between le–me and sol–re", ["to avoid parallel octaves in the bass", "because it can't reach V by step", "to double the leading tone"], "Ger+6 → V directly makes parallel perfect fifths; the cadential six-four avoids them."],
    ["In which voice is le (♭6̂) usually found?", "the bass", ["the soprano", "the alto", "it is usually left out"], "The chords are almost always built over le in the bass."],
    ["Which augmented sixth chord sounds exactly like a dominant seventh chord?", "German", ["Italian", "French", "none of them"], "Ger+6 on le sounds like a dom7 on ♭6̂; only the spelling (fi vs. sol♭) differs."],
    ["Which augmented sixth chord contains two tritones and sounds like a whole-tone chord?", "French", ["German", "Italian", "none of them"], "Le–re and do–fi are both tritones."],
    ["Augmented sixth chords are tertian (stacked in thirds).", "false: they are built around an interval, not stacked thirds", ["true: they are seventh chords", "true: they are triads", "only the German is tertian"], "They are named for the augmented sixth above the bass."],
    ["In jazz and pop lead sheets, augmented sixth chords are usually written as…", "dominant seventh chords on ♭VI", ["minor seventh chords on IV", "diminished chords on ♯IV", "sus chords on V"], "Ger+6 in C minor is written A♭7: that's how it sounds."],
    ["The tritone substitution resolves a dom7 down a half step. How is it related to the augmented sixth chord?", "it is the same sound used to embellish a tonic instead of V", ["it has no relation", "it is an Italian sixth on 5̂", "it is a French sixth on 2̂"], "Same tritone, same half-step resolutions in both outer voices."],
  ];

  function make(mode, H) {
    const k = pickKey(H);
    if (mode === "type") {
      const t = pickType(H), c = A6(H, k, t);
      if (Math.random() < .35) {
        const syl = { It: "le, do, fi", Fr: "le, do, re, fi", Ger: "le, do, me, fi" }[t];
        return H.mc(`A chord over le contains ${syl}. Which augmented sixth chord is it?`, RN[t], ["It+6", "Fr+6", "Ger+6", "V7/♭II"], `Italian: le, do, fi. French adds re; German adds me. So {rn:${RN[t]}}.`, { kicker: "Which type?", fmt: "rn", topic: t });
      }
      const staff = H.grand({ key: k, chords: [c] });
      return H.mc(`In ${k.label}, which augmented sixth chord is this?`, RN[t], ["It+6", "Fr+6", "Ger+6"], whyType(H, k, t), { kicker: `Which type? · ${k.label}`, fmt: "rn", staff, staffAns: H.grand({ key: k, chords: [c, H.diat(k, 5)], labels: [RN[t], "V"] }), play: H.playOf(H.grand({ key: k, chords: [c, H.diat(k, 5)] })), playLabel: "Play it, then V", playQ: H.playOf(staff), playQLabel: "Play", topic: [kt(k), t] });
    }
    if (mode === "spell") {
      const t = pickType(H), c = A6(H, k, t), others = TYPES.filter(x => x !== t).map(x => spell(H, A6(H, k, x)));
      const w = others.concat([spell(H, twin(H, k))]);
      const nat = H.deg(k, 6); if (k.mode === "major") w.push([nat, deg(H, k, "do"), deg(H, k, "fi")].map(H.nm).join("–"));
      return H.mc(`In ${k.label}, which notes make the {rn:${RN[t]}} (bass first)?`, spell(H, c), w, whyType(H, k, t), { big: RN[t], bigFmt: "rn", kicker: `Spell it · ${k.label}`, topic: [kt(k), t] });
    }
    if (mode === "staff") {
      const t = pickType(H), p = prog(H, k, t);
      const staff = H.grand({ key: k, chords: p.ch, labels: p.lab.map((l, i) => i === p.at ? "?" : l), hl: p.at });
      const done = H.grand({ key: k, chords: p.ch, labels: p.lab, hl: p.at });
      return H.mc(`Key: ${k.label}. Label the highlighted chord.`, RN[t], POOL(k), whyType(H, k, t), { kicker: `On the staff · ${k.label}`, fmt: "rn", staff, staffAns: done, playQ: H.playOf(staff), playQLabel: "Play the progression", play: H.playOf(staff), playLabel: "Play again", topic: [kt(k), t] });
    }
    // twin
    const r = Math.random();
    if (r < .4) {
      const isGer = Math.random() < .5, c = isGer ? A6(H, k, "Ger") : twin(H, k), nb = H.chord(H.up(k.tonic, 1, 1), "M");
      const staff = H.grand({ key: k, chords: [c] });
      const target = isGer ? H.diat(k, 5) : nb;
      return H.mc(`In ${k.label}, this chord is spelled ${spell(H, c)}. What is it?`, isGer ? "Ger+6" : "V7/♭II", ["Ger+6", "V7/♭II", "Fr+6", "V7/V"],
        isGer ? `The top note is fi (${H.nm(c.tones[3])}), a raised 4̂ that rises to sol: an augmented sixth above le. It's a German sixth, heading for V.` : `The top note is spelled ${H.nm(c.tones[3])}, a minor 7th above ${H.nm(c.tones[0])}: a dominant 7th that resolves down a 5th to ${H.nm(nb.tones[0])} (♭II). It sounds exactly like the German sixth; only the spelling shows the difference.`,
        { kicker: `Ger+6 or V⁷? · ${k.label}`, fmt: "rn", staff, staffAns: H.grand({ key: k, chords: [c, target], labels: [isGer ? "Ger+6" : "V7/♭II", isGer ? "V" : "♭II"] }), play: H.playOf(H.grand({ key: k, chords: [c, target] })), playLabel: "Play the resolution", topic: [kt(k), "Ger"] });
    }
    if (r < .65) {
      const t = pickType(H), w = [H.nm(deg(H, k, "fi")) + "7", H.nm(deg(H, k, "le")) + "m7", H.nm(deg(H, k, "re")) + "7", ...TYPES.filter(x => x !== t).map(x => lead(H, k, x))];
      return H.mc(`In a lead sheet in ${k.label}, how might the {rn:${RN[t]}} be written?`, lead(H, k, t), w, `Lead sheets write augmented sixth chords as dominant-type chords on ♭VI (${H.nm(deg(H, k, "le"))}), because that's how they sound: Ger+6 = ${lead(H, k, "Ger")}, Fr+6 = ${lead(H, k, "Fr")}, It+6 = ${lead(H, k, "It")}.`, { kicker: `Lead-sheet symbols · ${k.label}`, fmt: "sym", topic: [kt(k), t] });
    }
    const [q, a, w, why] = H.rnd(CONCEPT);
    return H.mc(q, a, w, why, { kicker: "Augmented sixth facts" });
  }

  function reference(H) {
    const keys = ["C", "A", "D", "G", "E"].map(n => H.key(n, "minor")).filter(k => usable(H, k));
    const rows = keys.map(k => `<tr><td>${H.accHTML(k.label)}</td>${TYPES.map(t => `<td>${H.accHTML(spell(H, A6(H, k, t)))}</td>`).join("")}</tr>`).join("");
    return `<p>Over le (♭6̂) in the bass: <b>Italian</b> = le, do, fi · <b>French</b> = le, do, re, fi · <b>German</b> = le, do, me, fi. Le and fi resolve outward to sol.</p>
      <div class="ltable-wrap"><table class="ltable"><caption>Spellings (bass first)</caption><thead><tr><th scope="col">Key</th><th scope="col">${H.rnHTML("It+6")}</th><th scope="col">${H.rnHTML("Fr+6")}</th><th scope="col">${H.rnHTML("Ger+6")}</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  const lesson = { defMode: "minor", steps: [
    { title: "An interval, not a stack of thirds", kick: "The frame", keyed: "both", defKey: "C", render: (H, k, U) => {
      if (!usable(H, k)) return `<p>Choose another key above (this one would need double sharps).</p>`;
      const le = deg(H, k, "le"), fi = deg(H, k, "fi"), so = deg(H, k, "sol");
      const frame = { tones: [le, fi], q: "x", bass: 0, rh: [1, 1, 1], v: { bass: H.N(le.l, le.a, 2 + (H.midi(H.N(le.l, le.a, 2)) < 40 ? 1 : 0)), upper: [H.N(fi.l, fi.a, 4)] } };
      const res = { tones: [so], q: "x", bass: 0, v: { bass: H.down(frame.v.bass, 1, 1), upper: [H.up(frame.v.upper[0], 1, 1)] } };
      return `<p>Augmented sixth chords are named for one interval: the <b>augmented sixth</b> between <b>le</b> (♭6̂) in the bass and <b>fi</b> (♯4̂) above it. Both notes are a half step from <b>sol</b> (5̂), so the interval opens outward to an octave on the dominant.</p>`
      + U.fig({ type: "grand", vf: k.vf, sig: k.sig, cols: [{ t: [H.nmO(frame.v.upper[0])], b: [H.nmO(frame.v.bass)], lab: "+6" }, { t: [H.nmO(res.v.upper[0])], b: [H.nmO(res.v.bass)], lab: "8" }] }, `${k.label}: ${H.nm(le)} and ${H.nm(fi)} (augmented 6th) open out to ${H.nm(so)} and ${H.nm(so)} (octave).`)
      + `<p>Because they're built around an interval and not stacked in thirds, these chords are not really <i>tertian</i>. They come in three kinds, named (for no deep reason) after three nationalities.</p>`;
    } },
    { title: "Italian, French, German", kick: "Three flavors", keyed: "both", defKey: "C", render: (H, k, U) => {
      if (!usable(H, k)) return `<p>Choose another key above (this one would need double sharps).</p>`;
      const cs = TYPES.map(t => A6(H, k, t));
      return `<p>Each adds notes to the le–fi frame. Think in scale degrees and every key works the same way:</p>
      <div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Chord</th><th scope="col">Adds to le + fi</th><th scope="col">Above the bass</th><th scope="col">In ${H.esc(k.label)}</th></tr></thead><tbody>
      <tr><td>{rn:It+6} Italian</td><td>do (1̂)</td><td>M3, +6</td><td>${H.esc(spell(H, cs[0]))}</td></tr>
      <tr><td>{rn:Fr+6} French</td><td>do and re (2̂)</td><td>M3, +4, +6</td><td>${H.esc(spell(H, cs[1]))}</td></tr>
      <tr><td>{rn:Ger+6} German</td><td>do and me (♭3̂)</td><td>M3, P5, +6</td><td>${H.esc(spell(H, cs[2]))}</td></tr></tbody></table></div>`
      + U.fig(H.grand({ key: k, chords: cs, labels: TYPES.map(t => RN[t]) }), "Italian, French and German sixths over the same bass.")
      + H.check("Which chord contains le, do, re and fi?", "Fr+6", ["It+6", "Ger+6", "V7/V"], "French adds re (2̂).", "rn");
    } },
    { title: "Resolving to the dominant", kick: "Pre-dominant", keyed: "both", defKey: "A", render: (H, k, U) => {
      if (!usable(H, k)) return `<p>Choose another key above.</p>`;
      const t0 = T(k), V = H.diat(k, 5), I = H.diat(k, 1), i64 = H.diat(k, 1, false, 2);
      const it = A6(H, k, "It"), fr = A6(H, k, "Fr"), ger = A6(H, k, "Ger");
      return `<p>All three are <b>pre-dominants</b>: think of them as an embellishment of the dominant, with le and fi closing in on sol from both sides. They move to <b>V</b>, or to the cadential six-four (${t0}⁶₄) and then V.</p>
      <div class="lfigs">${U.fig(H.grand({ key: k, chords: [it, V, I], labels: ["It+6", "V", t0], hl: 0 }), "Italian → V", { small: true })}${U.fig(H.grand({ key: k, chords: [fr, V, I], labels: ["Fr+6", "V", t0], hl: 0 }), "French → V", { small: true })}${U.fig(H.grand({ key: k, chords: [ger, i64, V, I], labels: ["Ger+6", t0 + "64", "V", t0], hl: 0 }), `German → ${t0}⁶₄ → V`, { small: true })}</div>
      <div class="callout"><b>Why the German detours</b>Going straight from Ger+6 to V, le–me moves to sol–re: parallel perfect fifths. Passing through ${H.esc(t0)}⁶₄ (or using the French sixth) avoids them.</div>`;
    } },
    { title: "The German sixth's double identity", kick: "Spelling = function", keyed: "minor", defKey: "C", render: (H, k, U) => {
      if (!usable(H, k)) return `<p>Choose another key above.</p>`;
      const ger = A6(H, k, "Ger"), tw = twin(H, k), nb = H.chord(H.up(k.tonic, 1, 1), "M");
      return `<p>Play a German sixth and a dominant 7th on the same root: they sound <b>identical</b>. Only one note is spelled differently: <b>fi</b> (${H.esc(H.nm(ger.tones[3]))}) in the German sixth, <b>sol♭</b> (${H.esc(H.nm(tw.tones[3]))}) in the dominant 7th.</p>`
      + `<div class="lfigs">${U.fig(H.grand({ key: k, chords: [ger, H.diat(k, 1, false, 2), H.diat(k, 5)], labels: ["Ger+6", "i64", "V"], hl: 0 }), `${spell(H, ger)}: fi rises to sol`, { small: true })}${U.fig(H.grand({ key: k, chords: [tw, nb], labels: ["V7/♭II", "♭II"], hl: 0 }), `${spell(H, tw)}: the 7th falls`, { small: true })}</div>`
      + `<p>The spelling tells you the direction: a raised note leads up, a lowered 7th leads down. Composers use this double identity to modulate (an <i>enharmonic modulation</i>). In lead sheets, augmented sixth chords are simply written as the dominant 7th they sound like: the German sixth in ${H.esc(k.label)} is {sym:${lead(H, k, "Ger")}}.</p>`;
    } },
    { title: "In major keys, and beyond", kick: "Borrowed le", keyed: "major", defKey: "C", render: (H, k, U) => {
      if (!usable(H, k)) return `<p>Choose another key above.</p>`;
      const cs = TYPES.map(t => A6(H, k, t));
      return `<p>In a major key, le (♭6̂) is borrowed from the parallel minor, and the German sixth borrows me (♭3̂) as well. In ${H.esc(k.label)}: ${cs.map(c => H.esc(spell(H, c))).join(", ")}.</p>`
      + U.fig(H.grand({ key: k, chords: [H.diat(k, 1), H.diat(k, 4, false, 1), cs[2], H.diat(k, 1, false, 2), H.diat(k, 5), H.diat(k, 1)], labels: ["I", "IV6", "Ger+6", "I64", "V", "I"], hl: 2 }), `${k.label}: the bass walks down la – le – sol.`)
      + `<p>Augmented sixth chords don't <i>have</i> to resolve to V. The same sound can embellish any major or minor chord a half step below its bass. A common jazz version is the <b>tritone substitution</b>: a dom7 a half step above the target, whose tritone resolves just like the dominant's.</p>`;
    } },
    { title: "Quick check", kick: "Before the drills", keyed: "both", defKey: "D", render: (H, k) => {
      if (!usable(H, k)) return `<p>Choose another key above.</p>`;
      const t = H.rnd(TYPES), c = A6(H, k, t);
      return H.check(`In ${k.label}, which chord is ${spell(H, c)}?`, RN[t], TYPES.filter(x => x !== t).map(x => RN[x]).concat(["V7/♭II"]), whyType(H, k, t), "rn")
        + H.check(CONCEPT[1][0], CONCEPT[1][1], CONCEPT[1][2], CONCEPT[1][3])
        + H.check(CONCEPT[7][0], CONCEPT[7][1], CONCEPT[7][2], CONCEPT[7][3])
        + H.check(`In ${k.label}, which notes make the {rn:Ger+6}?`, spell(H, A6(H, k, "Ger")), [spell(H, twin(H, k)), spell(H, A6(H, k, "Fr")), spell(H, A6(H, k, "It"))], whyType(H, k, "Ger"));
    } },
  ] };

  return {
    key: "silverapps-aug6-v1", lesson, make, reference,
    modes: [{ id: "type", kicker: "Which type?" }, { id: "spell", kicker: "Spell it" }, { id: "staff", kicker: "On the staff" }, { id: "twin", kicker: "Ger+6 or V⁷?" }],
    topics: [{ id: "min", name: "Minor keys", group: "keys" }, { id: "maj", name: "Major keys", group: "keys" },
      { id: "It", name: "Italian", group: "type" }, { id: "Fr", name: "French", group: "type" }, { id: "Ger", name: "German", group: "type" }],
  };
})();

(window.FAMS = window.FAMS || {}).med = (() => {
  // ===== Chromatic Mediants (part of Chromatic Chords). Engine: build/harmony/engine.js =====
  const REL = [[2, 4, "a major 3rd above"], [2, 3, "a minor 3rd above"], [-2, -4, "a major 3rd below"], [-2, -3, "a minor 3rd below"]];
  const sigSize = (H, n, q) => { try { const k = H.key(H.nm(n), q === "m" ? "minor" : "major"); return k.scale.reduce((t, x) => t + Math.abs(x.a), 0) + (k.scale.some(x => Math.abs(x.a) > 1) ? 9 : 0); } catch (e) { return 99; } };
  // the more common spelling of a root (fewest accidentals in its key; ties go to sharps)
  function spell(H, r, q) {
    const alts = [r, H.up(r, 1, 0), H.up(r, -1, 0)].filter(x => Math.abs(x.a) <= 1);
    return alts.sort((a, b) => sigSize(H, a, q) - sigSize(H, b, q) || b.a - a.a)[0];
  }
  const meds = (H, root, q) => REL.map(([st, se, how]) => ({ c: H.chord(spell(H, H.up(root, st, se), q), q), how }));
  const ct = (H, a, b) => a.tones.filter(x => b.tones.some(y => H.pc(x) === H.pc(y)));
  const ROOTS = ["C", "D", "E", "F", "G", "A", "B♭", "E♭", "B", "A♭"];
  const pair = (H, a, b, lab) => H.grand({ key: H.key("C", "major"), chords: [a, b], labels: lab || null, syms: [a.sym, b.sym] });
  const MRN = { "4": "III", "3": "♭III", "-4": "♭VI", "-3": "VI" };

  function make(sub, H) {
    const q = H.rnd(["M", "M", "m"]), root = spell(H, H.parse(H.rnd(ROOTS)), q), X = H.chord(root, q), M = meds(H, root, q);
    const r = Math.random();
    if (r < .3) {
      const pick = H.rnd(M), wrong = [H.chord(H.up(root, 2, q === "M" ? 4 : 3), q === "M" ? "m" : "M"), H.chord(H.up(root, -2, q === "M" ? -3 : -4), q === "M" ? "m" : "M"), H.chord(H.up(root, 1, 2), q), H.chord(H.up(pick.c.tones[0], 0, 0), q === "M" ? "m" : "M")];
      const sp = pair(H, X, pick.c);
      return H.mc(`What is the chromatic mediant ${pick.how} {sym:${X.sym}}?`, pick.c.sym, M.map(m => m.c.sym).concat(wrong.map(w => w.sym)), `Same quality, root ${pick.how}: {sym:${pick.c.sym}}. Common tone: ${ct(H, X, pick.c).map(H.nm).join(", ")}.`, { kicker: "Chromatic mediants", fmt: "sym", staffAns: sp, play: H.playOf(sp), playLabel: "Hear the pair" });
    }
    if (r < .55) {
      const pick = H.rnd(M), dia = [H.chord(H.up(root, 2, q === "M" ? 4 : 3), q === "M" ? "m" : "M"), H.chord(H.up(root, -2, q === "M" ? -3 : -4), q === "M" ? "m" : "M"), H.chord(H.up(pick.c.tones[0], 0, 0), q === "M" ? "m" : "M"), H.chord(H.up(root, 3, 5), q)];
      return H.mc(`Which chord is a chromatic mediant of {sym:${X.sym}}?`, pick.c.sym, dia.map(c => c.sym), `{sym:${pick.c.sym}}: the same quality, with its root ${pick.how}, and not in the same key. The others are diatonic mediants (sharing two tones, opposite quality), a different quality, or not a 3rd away.`, { kicker: "Chromatic mediants", fmt: "sym" });
    }
    if (r < .72) {
      const pick = H.rnd(M), c = ct(H, X, pick.c), sp = pair(H, X, pick.c);
      return H.mc(`What common tone do {sym:${X.sym}} and {sym:${pick.c.sym}} share?`, H.nm(c[0]), X.tones.concat(pick.c.tones).map(H.nm), `{sym:${X.sym}} = ${X.tones.map(H.nm).join("–")}; {sym:${pick.c.sym}} = ${pick.c.tones.map(H.nm).join("–")}. They share ${H.nm(c[0])}${H.nm(c[0]) !== H.nm(pick.c.tones.find(t => H.pc(t) === H.pc(c[0]))) ? ` (spelled ${H.nm(pick.c.tones.find(t => H.pc(t) === H.pc(c[0])))} in the second chord)` : ""}.`, { kicker: "Common tone", staff: sp, playQ: H.playOf(sp), playQLabel: "Play" });
    }
    if (r < .87) {
      const k = H.key(H.rnd(["C", "G", "D", "F", "B♭", "E♭", "A"]), "major"), I = H.diat(k, 1), m = H.rnd(REL), c = H.chord(H.up(k.tonic, m[0], m[1]), "M"), lab = MRN[String(m[1])];
      const sp = H.grand({ key: k, chords: [I, c, I], labels: ["I", "?", "I"], syms: [I.sym, c.sym, I.sym] });
      return H.mc(`In ${k.label}, label the chromatic mediant {sym:${c.sym}}.`, lab, ["III", "♭III", "VI", "♭VI", "iii", "vi"], `{sym:${c.sym}} is a major chord ${m[2]} the tonic: {rn:${lab}}${lab.startsWith("♭") ? " (its root is lowered from the diatonic degree)" : " (major, though the diatonic chord on that degree is minor)"}.`, { kicker: `Label it · ${k.label}`, fmt: "rn", staff: sp, playQ: H.playOf(sp), playQLabel: "Play" });
    }
    const kind = H.rnd(["yes", "dia", "qual"]);
    let Y, why;
    if (kind === "yes") { const pick = H.rnd(M); Y = pick.c; why = `Yes: a 3rd apart, both ${q === "M" ? "major" : "minor"}, not in one key, with a common tone (${ct(H, X, Y).map(H.nm).join(", ")}).`; }
    else if (kind === "dia") { Y = H.chord(H.up(root, 2, q === "M" ? 4 : 3), q === "M" ? "m" : "M"); why = "No: they're diatonic mediants (both fit in one key) and their qualities differ."; }
    else { const oq = q === "M" ? "m" : "M"; Y = H.chord(spell(H, H.rnd(M).c.tones[0], oq), oq); why = "No: a 3rd apart, but one is major and one is minor. Chromatic mediants share the same quality."; }
    const ans = kind === "yes" ? "Yes" : kind === "dia" ? "No: they're diatonically related" : "No: their qualities differ";
    return H.mc(`Are {sym:${X.sym}} and {sym:${Y.sym}} chromatic mediants?`, ans, ["Yes", "No: they're diatonically related", "No: their qualities differ", "No: they're not a 3rd apart"], why, { kicker: "Chromatic mediants?", play: H.playOf(pair(H, X, Y)), playLabel: "Hear the pair" });
  }

  function reference(H) {
    return `<p>Chromatic mediants: two chords (or keys) a <b>major or minor 3rd</b> apart, of the <b>same quality</b>, <b>not diatonically related</b>, sharing a <b>common tone</b>. Every major or minor chord has four: same quality, root a M3 or m3 above or below.</p>
      <div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Chord</th><th scope="col">Chromatic mediants</th></tr></thead><tbody>
      ${[["C", "M"], ["D", "M"], ["E", "m"], ["G", "m"]].map(([r, q]) => `<tr><td>{sym:${H.chord(H.parse(r), q).sym}}</td><td>${meds(H, H.parse(r), q).map(m => `{sym:${m.c.sym}}`).join(", ")}</td></tr>`).join("")}</tbody></table></div>`;
  }

  const lesson = { steps: [
    { title: "Chromatic mediants", kick: "Thirds apart, same quality", keyed: "major", render: (H, k, U) => {
      const I = H.diat(k, 1), M = meds(H, k.tonic, "M");
      return `<p>A <b>chromatic mediant relationship</b> joins two chords (or keys) that are:</p>
      <ol><li>a <b>3rd apart</b>, major or minor;</li><li>the <b>same quality</b>, both major or both minor;</li><li><b>not diatonically related</b> (not found together in one key);</li><li>sharing a <b>common tone</b>.</li></ol>
      <p>They're <i>chromatic</i> because they bring in notes outside the home key, and <i>mediants</i> because they relate by 3rds.</p>`
        + `<div class="lfigs">${M.map(m => U.fig(pair(H, I, m.c, ["I", MRN[String(REL.find(r => r[2] === m.how)[1])]]), `{sym:${I.sym}} → {sym:${m.c.sym}}: ${m.how}, common tone ${ct(H, I, m.c).map(H.nm).join("")}`, { small: true })).join("")}</div>`;
    } },
    { title: "Finding them", kick: "Four for every chord", render: (H) => `<p>Any major or minor chord has four chromatic mediants: the chords of the same quality with roots a major 3rd and a minor 3rd above and below. Enharmonic spellings are often used to make the chords more common: for F minor, C♯m rather than D♭m, and G♯m rather than A♭m.</p>${reference(H)}`
      + H.check("Which is a chromatic mediant of C major?", "E", ["Em", "Am", "D"], "E major: a major 3rd up, same quality, common tone E. Em and Am are diatonic to C.", "sym") },
    { title: "How they're used", kick: "Color and contrast", keyed: "major", render: (H, k, U) => {
      const I = H.diat(k, 1), c3 = H.chord(H.up(k.tonic, 2, 3), "M"), c6 = H.chord(H.up(k.tonic, -2, -4), "M");
      return `<p>Chromatic mediants create expressive harmonic shifts: color and contrast, while keeping a connection to the home key through the common tone (often, but not always, present in the melody).</p>
      <ul><li><b>Modulation:</b> because they share tones with the original key, chromatic mediants can be pivot or destination chords for smooth yet striking key changes.</li><li><b>Substitution:</b> a chromatic mediant can replace a diatonic chord for a surprising color.</li></ul>`
        + U.fig(H.grand({ key: k, chords: [I, c6, I, c3, H.diat(k, 4), H.diat(k, 5), I], labels: ["I", "♭VI", "I", "♭III", "IV", "V", "I"], syms: [I, c6, I, c3, H.diat(k, 4), H.diat(k, 5), I].map(c => c.sym) }), "Chromatic mediants as color chords between tonics.")
        + `<p>In some jazz, the “main chords” move by chromatic mediants that divide the octave into major 3rds (B → G → E♭), each embellished with secondary chords.</p>`;
    } },
    { title: "Quick check", kick: "Chromatic mediants", render: (H) => H.check("Are C and A♭ chromatic mediants?", "Yes", ["No: they're diatonically related", "No: their qualities differ"], "A major 3rd apart, both major, not in one key, sharing C.")
      + H.check("Are C and Am chromatic mediants?", "No: they're diatonically related", ["Yes", "No: their qualities differ"], "Am is vi in C major: a diatonic mediant.")
      + H.check("How many chromatic mediants does a major chord have?", "4", ["2", "3", "6"], "M3 and m3, above and below.") },
  ] };

  return { key: "silverapps-mediant-v1", lesson, make, reference, modes: [{ id: "med", kicker: "Chromatic mediants" }], topics: [] };
})();

window.FAM = (() => {
  // ===== Chromatic Chords: Mode Mixture + Neapolitan + Augmented Sixth in one app.
  // The three content files (mixture.js, neapolitan.js, aug6.js) register themselves in window.FAMS; this file combines them.
  const F = window.FAMS, FAMILY = { mix: "Mode mixture", nea: "Neapolitan", aug: "Augmented sixths", med: "Chromatic mediants" };
  // which sub-app modes feed each combined mode
  const MAP = {
    label: [["mix", "label"], ["nea", "label"], ["aug", "staff"]],
    spell: [["mix", "spell"], ["nea", "spell"], ["aug", "spell"]],
    staff: [["mix", "staff"], ["nea", "staff"], ["aug", "staff"]],
    type: [["aug", "type"]],
    kind: [["mix", "kind"]],
    use: [["nea", "use"], ["aug", "twin"]],
    med: [["med", "med"]],
  };
  const ALL_ON = ["maj", "min", "It", "Fr", "Ger"];
  function make(mode, H) {
    const on = H.topicsOn(), src = MAP[mode], pool = src.filter(([f]) => on.includes(f));
    const [fam, sub] = H.rnd(pool.length ? pool : src);
    const H2 = Object.assign({}, H, { topicsOn: () => ALL_ON });
    const c = F[fam].make(sub, H2);
    if (!c) return null;
    c.topic = src.length > 1 ? fam : undefined;   // single-family modes ignore the family toggles
    if (mode === "label") { c.widget = "rnpick"; c.text = c.text.replace(/\.?$/, "") + ": build the label from the parts below."; }
    return c;
  }
  const part = (k, name, defMode) => F[k].lesson.steps.map(s => Object.assign({}, s, { part: name, defMode: s.keyed === "both" ? defMode : undefined }));
  const lesson = { steps: [...part("mix", "Mode mixture", "major"), ...part("nea", "Neapolitan", "minor"), ...part("aug", "Augmented sixths", "minor"), ...part("med", "Chromatic mediants", "major")] };
  const reference = H => `<h3>Mode mixture</h3>${F.mix.reference(H)}<h3>Neapolitan</h3>${F.nea.reference(H)}<h3>Augmented sixths</h3>${F.aug.reference(H)}<h3>Chromatic mediants</h3>${F.med.reference(H)}`;
  // ---------- "Label it": build any Roman numeral from parts (accidental, numeral, quality, figure, applied-to), or pick an augmented sixth ----------
  const PARTS = {
    acc: [["", "none"], ["♭", "♭"], ["♯", "♯"]],
    num: ["I", "II", "III", "IV", "V", "VI", "VII", "i", "ii", "iii", "iv", "v", "vi", "vii"],
    qual: [["", "none"], ["°", "°"], ["ø", "ø"], ["+", "+"]],
    fig: [["", "none (root position triad)"], ["6", "6"], ["64", "6 4"], ["7", "7"], ["65", "6 5"], ["43", "4 3"], ["42", "4 2"]],
    app: [["", "none"], ["/ii", "/ii"], ["/iii", "/iii"], ["/IV", "/IV"], ["/iv", "/iv"], ["/V", "/V"], ["/vi", "/vi"], ["/♭II", "/♭II"]],
    six: ["It+6", "Fr+6", "Ger+6"],
  };
  const SPOKEN = { "": "none", "♭": "flat", "♯": "sharp", "°": "diminished", "ø": "half-diminished", "+": "augmented", "6": "six", "64": "six-four", "7": "seven", "65": "six-five", "43": "four-three", "42": "four-two" };
  const rnOf = q => q.six || (q.num ? (q.acc || "") + q.num + (q.qual || "") + (q.fig || "") + (q.app || "") : null);
  const widgets = { rnpick: {
    html(c, q, H) {
      const d = q.done ? " disabled" : "", P = (k, v) => q.six ? false : (q[k] || "") === v;
      const grp = (label, key, items, cls) => `<div class="pick-sec"><span class="pick-lab" aria-hidden="true">${label}</span><div class="pick-row" role="group" aria-label="${label}">${items.map(([v, t]) => `<button type="button" class="pk ${cls || ""}" data-rk="${key}" data-rv="${H.esc(v)}" aria-pressed="${P(key, v)}" aria-label="${H.esc(SPOKEN[v] || t)}"${d}><span aria-hidden="true">${!v ? "–" : v.length === 2 && /\d\d/.test(v) ? `<span class="pkfig"><span>${v[0]}</span><span>${v[1]}</span></span>` : v}</span></button>`).join("")}</div></div>`;
      const nums = (arr) => arr.map(v => [v, v]);
      return `<div class="pick rnpick">
        ${grp("Accidental", "acc", PARTS.acc)}
        <div class="pick-sec"><span class="pick-lab" aria-hidden="true">Numeral</span><div class="pick-row" role="group" aria-label="Numeral">${PARTS.num.map(v => `<button type="button" class="pk rn" data-rk="num" data-rv="${v}" aria-pressed="${!q.six && q.num === v}" aria-label="${v === v.toUpperCase() ? "uppercase " : "lowercase "}${v}"${d}>${v}</button>`).join("")}</div></div>
        ${grp("Quality sign", "qual", PARTS.qual)}
        ${grp("Figure (inversion)", "fig", PARTS.fig)}
        <div class="pick-sec"><span class="pick-lab" aria-hidden="true">Applied to</span><div class="pick-row" role="group" aria-label="Applied to (secondary chords)">${PARTS.app.map(([v, t]) => `<button type="button" class="pk" data-rk="app" data-rv="${v}" aria-pressed="${!q.six && (q.app || "") === v}" aria-label="${v ? "applied to " + v.slice(1) : "not applied"}"${d}>${v || "–"}</button>`).join("")}</div></div>
        <div class="pick-sec"><span class="pick-lab" aria-hidden="true">Augmented sixth</span><div class="pick-row" role="group" aria-label="Augmented sixth chords">${PARTS.six.map(v => `<button type="button" class="pk" data-rk="six" data-rv="${v}" aria-pressed="${q.six === v}"${d}>${H.rnHTML(v)}</button>`).join("")}</div></div>
        <p class="pick-prev" aria-live="polite">Your label: <b class="rnprev">${rnOf(q) ? H.rnHTML(rnOf(q)) : "–"}</b></p></div>`;
    },
    wire(root, c, q, H) {
      const box = root.querySelector(".rnpick"), btn = root.querySelector("[data-wcheck]");
      const sync = () => { box.querySelectorAll("[data-rk]").forEach(b => { const k = b.dataset.rk, v = b.dataset.rv; b.setAttribute("aria-pressed", String(k === "six" ? q.six === v : !q.six && (k === "num" ? q.num === v : (q[k] || "") === v))); });
        const r = rnOf(q); box.querySelector(".rnprev").innerHTML = r ? H.rnHTML(r) : "–"; btn.disabled = !r; };
      box.onclick = e => { const b = e.target.closest("[data-rk]"); if (!b || b.disabled) return; const k = b.dataset.rk, v = b.dataset.rv;
        if (k === "six") { q.six = q.six === v ? null : v; } else { q.six = null; q[k] = v; } sync(); };
      sync();
    },
    value(root) { const pr = root.querySelector(".rnprev"); const get = k => { const b = root.querySelector(`[data-rk="${k}"][aria-pressed=true]`); return b ? b.dataset.rv : ""; };
      const six = get("six"); if (six) return six; const num = get("num"); return num ? get("acc") + num + get("qual") + get("fig") + get("app") : null; },
  } };

  return {
    key: "silverapps-chromatic-v1", lesson, make, reference, widgets,
    modes: [{ id: "label", kicker: "Label it" }, { id: "spell", kicker: "Spell it" }, { id: "staff", kicker: "On the staff" },
      { id: "type", kicker: "Which augmented sixth?" }, { id: "kind", kicker: "Borrowed or secondary?" }, { id: "use", kicker: "How they work" }, { id: "med", kicker: "Chromatic mediants" }],
    topics: Object.entries(FAMILY).map(([id, name]) => ({ id, name, group: "fam" })),
  };
})();
