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
