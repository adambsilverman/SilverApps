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
