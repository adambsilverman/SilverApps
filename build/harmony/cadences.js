window.FAM = (() => {
  // ===== Cadences: content (lesson + drills). Engine: build/harmony/engine.js =====
  const NAME = { PAC: "Perfect authentic (PAC)", IAC: "Imperfect authentic (IAC)", HC: "Half cadence (HC)", PC: "Plagal (PC)", DC: "Deceptive (DC)", PHC: "Plagal half (PHC)", SHC: "Secondary half (SHC)" };
  const SHORT = { PAC: "authentic", IAC: "authentic", HC: "half", PC: "plagal", DC: "deceptive", PHC: "half", SHC: "half" };
  const CLOSURE = { PAC: "closed", PC: "closed", IAC: "weak", DC: "weak", HC: "open", PHC: "open", SHC: "open" };
  // chord tokens: degree, then options: "7" seventh, "6"/"64"/"65"/"43"/"42" inversion figure
  const tok = (H, k, t) => H.tok(k, t);
  // phrase endings for each cadence type, by mode (each starts on the tonic)
  const T = {
    major: {
      PAC: [["1", "4", "5", "1"], ["1", "2", "5", "1"], ["1", "26", "164", "57", "1"], ["1", "6", "4", "57", "1"]],
      IAC: [["1", "4", "5", "1"], ["1", "2", "57", "1"], ["1", "4", "56", "1"], ["1", "4", "76", "1"], ["1", "26", "565", "1"]],
      HC: [["1", "4", "5"], ["1", "6", "26", "5"], ["1", "4", "164", "5"], ["1", "2", "5"], ["16", "4", "5"]],
      PC: [["1", "5", "1", "4", "1"], ["1", "6", "4", "1"], ["1", "4", "1"]],
      DC: [["1", "4", "5", "6"], ["1", "2", "57", "6"], ["1", "26", "57", "6"]],
      PHC: [["1", "5", "6", "4"], ["1", "56", "6", "4"]],
    },
    minor: {
      PAC: [["1", "4", "5", "1"], ["1", "6", "4", "57", "1"], ["1", "4", "164", "57", "1"]],
      IAC: [["1", "4", "5", "1"], ["1", "4", "56", "1"], ["1", "4", "76", "1"], ["1", "46", "565", "1"]],
      HC: [["1", "4", "5"], ["1", "6", "4", "5"], ["1", "46", "5"], ["1", "4", "164", "5"]],
      PC: [["1", "5", "1", "4", "1"], ["1", "6", "4", "1"]],
      DC: [["1", "4", "5", "6"], ["1", "6", "4", "57", "6"]],
      PHC: [["1", "5", "6", "4"]],
    },
  };
  const pick = (H, mode, type) => H.rnd(T[mode][type]);
  // build and voice a phrase ending in a cadence of the given type; returns { k, chords, vs }
  function phrase(H, type, modes) {
    for (let g = 0; g < 30; g++) {
      const k = H.randKey(modes || ["major", "minor"]);
      if (type === "PHC" && k.mode === "minor" && Math.random() < .5) continue;
      const toks = pick(H, k.mode, type), chords = toks.map(t => tok(H, k, t));
      const last = chords[chords.length - 1], pen = chords[chords.length - 2];
      let sop = null;
      if (type === "PAC") sop = 0;
      if (type === "IAC" && pen.bass === 0) sop = H.rnd([1, 2]);
      const vs = H.satb(k, chords, { sop });
      if (!vs) continue;
      // PAC/IAC must really be what they claim
      const lastS = vs[vs.length - 1].idx[0];
      if (type === "PAC" && (lastS !== 0 || pen.bass !== 0 || last.bass !== 0)) continue;
      if (type === "IAC" && lastS === 0 && pen.bass === 0) continue;
      return { k, chords, vs, type };
    }
    return null;
  }
  const voicesOf = (H, x, labels) => ({ type: "voices", vf: x.k.vf, sig: x.k.sig, cols: H.satbCols(x.vs, labels ? x.chords.map(c => c.rn) : null).map((c, i, a) => Object.assign(c, labels && i >= a.length - 2 ? { hl: true } : {})) });
  function why(H, x) {
    const c = x.chords, n = c.length, last = c[n - 1], pen = c[n - 2], s = x.vs[n - 1];
    const rn = `{rn:${pen.rn}} – {rn:${last.rn}}`;
    switch (x.type) {
      case "PAC": return `${rn}: dominant to tonic with both chords in root position and the tonic (${H.nm(s.S)}) in the soprano: a perfect authentic cadence.`;
      case "IAC": return `${rn}: dominant to tonic, but ${pen.bass ? "the dominant chord is inverted" : `the soprano ends on ${H.nm(s.S)}, not the tonic`}: an imperfect authentic cadence.`;
      case "HC": return `The phrase stops on {rn:${last.rn}} (the dominant): an open, inconclusive half cadence.${pen.rn.startsWith("iv6") && x.k.mode === "minor" ? " (iv⁶–V in minor is often called a Phrygian half cadence.)" : ""}`;
      case "PC": return `${rn}: subdominant to tonic, a plagal cadence.`;
      case "DC": return `${rn}: the dominant goes to a “tonic substitute” instead of the tonic: a deceptive cadence.`;
      case "PHC": return `The phrase stops on {rn:${last.rn}} (the subdominant): an open ending, sometimes called a plagal half cadence.`;
    }
    return "";
  }

  // lead-sheet questions
  const LS = {
    PAC: [["2m7", "57", "1"], ["4", "57", "1"]], HC: [["1", "2m", "5"], ["1", "4", "5"]], PC: [["1", "4", "1"], ["6m", "4", "1"]], DC: [["4", "57", "6m"], ["2m7", "57", "6m"]], PHC: [["1", "5", "6m", "4"]],
    SHC: [["1", "4", "57", "3d7"], ["1", "2m", "57", "3d7"]],
  };
  const symQ = (H, type) => {
    const k = H.key(H.rnd(H.KEYS.major), "major");
    const seq = H.rnd(LS[type]).map(t => {
      const d = +t[0], r = H.deg(k, d);
      if (t.endsWith("d7")) { const root = H.deg(k, 3); return H.chord(root, "7").sym; }   // V7/vi
      const q = t.slice(1) === "7" ? "7" : t.slice(1) === "m7" ? "m7" : t.slice(1) === "m" ? "m" : "M";
      return H.chord(r, q).sym;
    });
    return { k, seq };
  };

  const FACTS = [
    ["A cadence is…", "a phrase-ending pattern that gives a sense of completion", ["any V–I progression", "the loudest point of a phrase", "the first chord of a phrase"], "Closure ranges from open to closed, depending mostly on the last harmony."],
    ["Which cadences have the greatest degree of closure?", "those ending on the tonic (or a tonic substitute)", ["those ending on V", "those ending on IV", "those ending on vii°"], "Cadences ending on V or IV are the weakest."],
    ["What is elision?", "a new phrase beginning at the moment of the previous phrase's cadence", ["a cadence on V", "a chord added after a cadence", "a change of meter"], "The cadence and the next downbeat are the same moment."],
    ["What is a turnaround?", "chords after a cadence point, before the next phrase begins", ["a cadence on IV", "a phrase that modulates", "the last chord of a song"], "Often ii–V, or a dominant; the term comes from jazz."],
    ["In a balanced four-bar phrase, the cadence usually arrives…", "on or near the downbeat of bar 3 or 4", ["on beat 1 of bar 1", "in the middle of bar 2", "after bar 5"], "The melody reaches its point of repose as the harmony closes."],
    ["Which is NOT required for a perfect authentic cadence?", "a seventh in the V chord", ["V in root position", "I in root position", "the tonic in the soprano at the end"], "V or V7 both work."],
    ["A half cadence most often ends on…", "V", ["I", "vi", "ii"], "IV is also possible (a plagal half cadence)."],
    ["The deceptive cadence most often goes from V to…", "vi (VI in minor)", ["IV", "I⁶", "iii"], "A tonic substitute: weak closure."],
    ["A secondary half cadence ends on…", "a secondary dominant", ["the tonic", "a Neapolitan chord", "the subdominant"], "A deceptive move to a secondary dominant; not common terminology."],
    ["Which closure category fits an imperfect authentic cadence?", "weak", ["open", "closed"], "Deceptive and imperfect authentic cadences give weak closure."],
    ["Which closure category fits a half cadence?", "open", ["closed", "weak"], "Half, plagal half and secondary half cadences are open."],
    ["Which closure category fits a perfect authentic cadence?", "closed", ["open", "weak"], "Authentic and plagal cadences are closed."],
  ];

  function make(mode, H) {
    if (mode === "staff" || mode === "hear") {
      const types = mode === "hear" ? ["PAC", "HC", "PC", "DC"] : ["PAC", "IAC", "HC", "PC", "DC", "PHC"];
      const type = H.rnd(types), x = phrase(H, type);
      if (!x) return null;
      const play = H.satbPlay(x.vs, .9), plain = voicesOf(H, x, false), ans = voicesOf(H, x, true);
      if (mode === "hear") {
        const A = { PAC: "Authentic", HC: "Half", PC: "Plagal", DC: "Deceptive" };
        return H.mc("Listen. How does this phrase end?", A[type], Object.values(A), why(H, x), { kicker: "Hear it", playQ: play, playQLabel: "Play the phrase", play, playLabel: "Play again", staffAns: ans, auto: true });
      }
      return H.mc(`In ${x.k.label}: which cadence ends this phrase?`, NAME[type], ["PAC", "IAC", "HC", "PC", "DC", "PHC"].map(t => NAME[t]), why(H, x), { kicker: "Name it", staff: plain, staffAns: ans, playQ: play, playQLabel: "Play", nWrong: 3 });
    }
    if (mode === "symbols") {
      const type = H.rnd(["PAC", "HC", "PC", "DC", "PHC", "SHC"]), q = symQ(H, type), seq = q.seq.map(s => `{sym:${s}}`).join(" – ");
      const A = { PAC: "Authentic", HC: "Half", PC: "Plagal", DC: "Deceptive", PHC: "Plagal half", SHC: "Secondary half" };
      const W = { PAC: "V⁷ (or V) to I: an authentic cadence.", HC: "it stops on V: a half cadence.", PC: "IV to I: a plagal cadence.", DC: "V⁷ to vi instead of I: a deceptive cadence.", PHC: "it stops on IV: a plagal half cadence.", SHC: "V⁷ moves to a secondary dominant (V⁷/vi) and the phrase stops there: a secondary half cadence." };
      return H.mc(`A phrase in ${q.k.label} ends with these chords: ${seq}. What kind of cadence?`, A[type], Object.values(A), `In ${q.k.label}, ${W[type]}`, { kicker: "Lead sheet" });
    }
    if (Math.random() < .4) {
      const t = H.rnd(Object.keys(CLOSURE));
      return H.mc(`What degree of closure does a ${NAME[t].replace(/ \(.*/, "").toLowerCase()} cadence give?`, CLOSURE[t], ["open", "closed", "weak"], "Open: half, plagal half, secondary half. Closed: authentic (perfect) and plagal. Weak: deceptive and imperfect authentic.", { kicker: "Closure" });
    }
    const [q, a, w, y] = H.rnd(FACTS);
    return H.mc(q, a, w, y, { kicker: "Terms" });
  }

  function reference() {
    return `<div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Cadence</th><th scope="col">Ends</th><th scope="col">Closure</th></tr></thead><tbody>
      <tr><td><b>Perfect authentic (PAC)</b></td><td>V(⁷)–I, both root position, tonic in the soprano</td><td>closed</td></tr>
      <tr><td><b>Imperfect authentic (IAC)</b></td><td>V–I otherwise (inverted dominant, or 3rd/5th in the soprano)</td><td>weak</td></tr>
      <tr><td><b>Plagal (PC)</b></td><td>IV–I</td><td>closed</td></tr>
      <tr><td><b>Half (HC)</b></td><td>on V</td><td>open</td></tr>
      <tr><td><b>Plagal half (PHC)</b></td><td>on IV</td><td>open</td></tr>
      <tr><td><b>Deceptive (DC)</b></td><td>V–vi (or another tonic substitute)</td><td>weak</td></tr>
      <tr><td><b>Secondary half (SHC)</b></td><td>a deceptive move to a secondary dominant</td><td>open</td></tr></tbody></table></div>`;
  }

  // fixed lesson examples, voiced in the chosen key
  const exV = (H, k, toks, sop) => { for (let i = 0; i < 6; i++) { const chords = toks.map(t => tok(H, k, t)), vs = H.satb(k, chords, { sop }); if (vs) return { k, chords, vs }; } return null; };
  const fig = (H, k, U, toks, cap, sop) => { const x = exV(H, k, toks, sop); return x ? U.fig({ type: "voices", vf: k.vf, sig: k.sig, cols: H.satbCols(x.vs, x.chords.map(c => c.rn)) }, cap, { small: true, play: H.satbPlay(x.vs, .9) }) : ""; };
  const lesson = { defMode: "major", steps: [
    { title: "What is a cadence?", kick: "Endings", render: () => `<p>A <b>cadence</b> is a phrase-ending pattern: melodic and/or harmonic elements that give a sense of completion. That sense of <b>closure</b> ranges from <b>open</b> (suggesting that a later phrase will resolve it) to <b>closed</b>, mostly depending on the final chord.</p>
      <ul><li>Cadences ending on the <b>tonic</b> (or a tonic substitute) have the greatest closure.</li><li>Cadences ending on the <b>dominant</b> or <b>subdominant</b> have the weakest.</li></ul>
      <p>Cadences are described with a handful of formulas. The examples in this lesson are in four voices; choose a key to hear them anywhere.</p>` },
    { title: "Authentic cadences", kick: "Dominant → tonic", keyed: "both", render: (H, k, U) => `<p>The <b>authentic</b> (or full) cadence goes from dominant to tonic. It's a <b>perfect authentic cadence (PAC)</b> when V and I are both in root position and the final I has its root in <b>both outer voices</b>. Anything else is an <b>imperfect authentic cadence (IAC)</b>.</p>
      <div class="lfigs">${fig(H, k, U, ["1", "4", "57", "1"], "<b>PAC</b>: root-position V⁷–I, tonic in the soprano", 0)}${fig(H, k, U, ["1", "4", "5", "1"], "<b>IAC</b>: the soprano ends on the 3rd or 5th", 1)}${fig(H, k, U, ["1", "4", "76", "1"], "<b>IAC</b>: an inverted dominant-function chord (vii°⁶)")}</div>`
      + H.check("V⁷–I, both in root position, but the soprano ends on the 3rd of I. Which cadence?", "IAC", ["PAC", "HC", "DC"], "Without the tonic in the soprano, it's imperfect.") },
    { title: "Half cadences", kick: "Ending on V", keyed: "both", render: (H, k, U) => `<p>The <b>half cadence (HC)</b>, or semicadence, is open: the phrase stops on a chord that needs to go on. The most common final chord is <b>V</b>. It's often approached by a pre-dominant or a cadential ⁶₄.</p>
      <div class="lfigs">${fig(H, k, U, ["1", "4", "5"], "I – IV – V")}${fig(H, k, U, ["1", "4", "164", "5"], "with a cadential ⁶₄")}${k.mode === "minor" ? fig(H, k, U, ["1", "46", "5"], "iv⁶–V in minor: the “Phrygian” half cadence") : fig(H, k, U, ["1", "6", "26", "5"], "I – vi – ii⁶ – V")}</div>
      <p>Other endings are possible, including IV, as in <i>Auld Lang Syne</i> at the words “never brought to mind.” That's sometimes called a <b>plagal half cadence (PHC)</b>.</p>` },
    { title: "Plagal and deceptive", kick: "IV–I and V–vi", keyed: "both", render: (H, k, U) => `<div class="lfigs">${fig(H, k, U, ["1", "5", "1", "4", "1"], "<b>Plagal cadence (PC)</b>: subdominant to tonic (IV–I), the “amen” cadence")}${fig(H, k, U, ["1", "4", "57", "6"], "<b>Deceptive cadence (DC)</b>: V goes to a tonic substitute, usually vi (VI in minor)")}</div>
      <p>The deceptive cadence gives weak closure: we expect I and get something else. A <b>secondary half cadence (SHC)</b> (not common terminology) is a deceptive move to a <i>secondary dominant</i>, such as V⁷ → V⁷/vi, ending the phrase there.</p>`
      + H.check("V⁷ – vi at the end of a phrase:", "Deceptive", ["Plagal", "Half", "Authentic"], "V goes to a tonic substitute.") },
    { title: "Open, closed or weak", kick: "Degrees of closure", render: () => `<p>When phrases combine, what matters most is how <i>final</i> each cadence sounds:</p>
      <div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Closure</th><th scope="col">Cadences</th></tr></thead><tbody>
      <tr><td><b>Open</b></td><td>half, plagal half, secondary half</td></tr><tr><td><b>Weak</b></td><td>deceptive, imperfect authentic</td></tr><tr><td><b>Closed</b></td><td>(perfect) authentic, plagal</td></tr></tbody></table></div>
      <p>An open phrase is usually answered by a phrase with a stronger cadence: that's how periods work.</p>` },
    { title: "Where cadences land", kick: "Rhythm, elision, turnarounds", render: (H) => `<p>In a balanced four-bar phrase, the cadence usually arrives on or near the downbeat of bar 3 or 4. The melody's point of repose (“arrival”) coincides with the conclusive harmony, while the accompaniment often keeps going to balance the stopped melody.</p>
      <p>The cadence point can be obscured when melody and harmony arrive on different beats, or by <b>elision</b>: a new phrase begins at the very moment the previous one cadences (as in Cyndi Lauper's <i>Time After Time</i>).</p>
      <p>Chords sometimes keep changing after the cadence point, before the next phrase begins. This post-cadential motion is a <b>turnaround</b> (a jazz term that applies to other music too):</p>
      <ul><li>a single chord, usually the dominant, after a closed cadence;</li><li>a series of chords, usually {rn:ii}–{rn:V}, sometimes extended with secondary chords or a cadential ⁶₄ (as in <i>Georgia on My Mind</i>);</li><li>chords in a new key that set up a tonicization or modulation for the next phrase.</li></ul>`
      + H.check("A new phrase starts on the same downbeat where the last one cadences. That's…", "elision", ["a turnaround", "a half cadence", "a deceptive cadence"], "The two phrases overlap at the cadence.") },
    { title: "Quick check", kick: "Before the drills", render: (H) => FACTS.slice(0, 3).map(([q, a, w, y]) => H.check(q, a, w, y)).join("") + H.check("A phrase stops on V. How much closure?", "open", ["closed", "weak"], "Half cadences are open.") },
  ] };

  return {
    key: "silverapps-cadences-v1", lesson, make, reference,
    modes: [{ id: "staff", kicker: "Name it" }, { id: "hear", kicker: "Hear it" }, { id: "symbols", kicker: "Lead sheet" }, { id: "terms", kicker: "Closure & terms" }],
    topics: [],
  };
})();
