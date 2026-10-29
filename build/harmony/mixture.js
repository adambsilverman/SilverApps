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
    const alts = { "♭III": ["iii", "III", "♭iii", "V/vi"], "♭VI": ["vi", "VI", "♭vi", "IV"], "♭VII": ["vii°", "VII", "♭vii", "V/♭III"], i: ["I", "vi", "♭I"], iv: ["IV", "ii", "♭IV"], v: ["V", "iii", "♭v"], "ii°": ["ii", "vii°", "♭II"], "iiø7": ["ii7", "viiø7", "♭II7"], iv7: ["IV7", "ii7", "IV△7"], "vii°7": ["viiø7", "vii°7/V", "V7"] };
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
    const k = pickKey(H), b = H.rnd(BOR), inv = b.q.length > 1 && Math.random() < .25 ? 1 : 0;
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
      if (r < .45) { const bb = H.rnd(BOR.filter(x => !x.lt && x.d !== 1)), ss = bor(H, k, bb); return H.mc(`In ${k.label}, what kind of chord is {sym:${ss.c.sym}}?`, KIND.mix, [KIND.dom, KIND.lt, KIND.dia], whyB(H, k, ss), { big: `{sym:${ss.c.sym}}`, kicker: `Borrowed or secondary? · ${k.label}` }); }
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
      + `<p>The opposite, a <b>minor tonic</b> in a major key, is much rarer. Dr. Silverman's name for it: the “<b>Mercury third</b>,” after Freddie Mercury, who used one in a famous stadium anthem.</p>`;
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
