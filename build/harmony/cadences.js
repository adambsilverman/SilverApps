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
      case "HC": return `The phrase stops on {rn:${last.rn}} (the dominant): an open, inconclusive half cadence.`;
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
    ["A cadence is…", "a phrase-ending combination of harmonic and melodic factors that gives a sense of completion", ["any V–I progression", "the loudest point of a phrase", "the first chord of a phrase"], "Closure ranges from open to closed, depending mostly on the last harmony."],
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

  // ----- popular-music cadences (after Stephenson, What To Listen For in Rock, ch. 3, and the MTC 543 pages) -----
  // [id, approach chords as [steps above tonic, semitones, quality], label, explanation]
  const POP = [
    ["IV", [[0, 0, "M"], [4, 7, "M"], [5, 9, "m"], [3, 5, "M"]], "open cadence on IV", "The most common open ending in pop (a plagal half cadence). The phrase stops on IV; in a loop, the I that starts the next cycle follows, but the phrase itself ends open."],
    ["♭VII", [[0, 0, "M"], [3, 5, "M"], [6, 10, "M"]], "open cadence on ♭VII", "♭VII, borrowed from Mixolydian or the parallel minor, leaves the phrase hanging a whole step below the tonic."],
    ["♭VI", [[0, 0, "M"], [6, 10, "M"], [5, 8, "M"]], "open cadence on ♭VI", "♭VI, borrowed from the parallel minor, ends the phrase away from the tonic. (In minor keys VI is diatonic, and ending on it is very common.)"],
    ["II", [[3, 5, "M"], [0, 0, "M"], [1, 2, "M"]], "open cadence on II", "A major II (a chromatic chord, like V/V) ends the phrase pointing onward instead of home."],
    ["iv", [[0, 0, "M"], [3, 5, "M"], [3, 5, "m"]], "open cadence on iv", "The minor iv, borrowed from the parallel minor, ends the phrase with a darker, unresolved color."],
    ["Vsus4", [[0, 0, "M"], [1, 2, "m"], [4, 7, "sus"]], "open cadence on Vsus4", "A half cadence on a suspended dominant: the 4th replaces the leading tone, so the ending is open but without the leading tone's urgency."],
    ["V", [[0, 0, "M"], [3, 5, "M"], [4, 7, "M"]], "half cadence (on V)", "The familiar open ending, used in pop just as elsewhere."],
  ];
  const RN = { "0,0": "I", "1,2": "II", "2,3": "♭III", "3,5": "IV", "4,7": "V", "5,8": "♭VI", "5,9": "VI", "6,10": "♭VII" };
  const popRN = ([st, se, q]) => q === "sus" ? "Vsus4" : q === "m" ? RN[st + "," + se].replace(/[IV]+/, x => x.toLowerCase()) : RN[st + "," + se];
  const popChord = (H, k, [st, se, q]) => { const r = H.up(k.tonic, st, se); if (q !== "sus") return H.chord(r, q); const c = H.chord(r, "M"); c.tones[1] = H.up(c.tones[0], 3, 5); c.sym = H.nm(r) + "sus4"; return c; };
  const PLACE = [
    ["Is every V–I progression a cadence?", "no: only one that ends a phrase (at a point of closure or elision)", ["yes, always", "only in minor keys", "only when V has a 7th"], "A V–I near the start or in the middle of a phrase is just a progression; cadence names are for phrase endings."],
    ["A phrase goes I – V⁶ – I – IV – V⁷ – I. Where is the cadence?", "the final V⁷ – I", ["the first V⁶ – I", "both V–I motions", "IV – V⁷"], "The first V⁶–I prolongs the tonic inside the phrase; only the phrase-ending V⁷–I is a cadence."],
    ["A cadence is created by…", "harmonic and melodic factors together, at a point of closure or elision", ["the harmony alone", "the melody alone", "any chord change on a downbeat"], "The chords, the melody's arrival and the rhythm all work together at the phrase ending."],
    ["In a four-bar phrase, a cadence most often arrives…", "on the downbeat of bar 4 (or bar 3)", ["on the downbeat of bar 1", "on beat 2 of bar 2", "after the phrase ends"], "Stephenson calls the bar-4 arrival the “fourth-downbeat cadence.”"],
    ["In much pop and rock, what makes a chord cadential?", "mostly where it falls: the last strong downbeat of the phrase", ["only being V or I", "being the loudest chord", "being a seventh chord"], "Because of that, a phrase can end, open, on IV, ♭VII, ♭VI or another chord."],
    ["A pop phrase ends on ♭VII on its last strong downbeat. What kind of cadence is it?", "an open cadence", ["a closed cadence", "not a cadence", "a deceptive cadence"], "It ends on a non-tonic chord, so it's open, like a half cadence."],
    ["A cadence on the downbeat of bar 3 of a four-bar phrase tends to give…", "partial, provisional closure", ["the strongest possible closure", "no closure at all", "a modulation"], "The phrase hasn't reached its fourth downbeat yet, so the arrival feels provisional."],
    ["Why can cadences in a repeating four-chord loop sound less final?", "the loop restarts at once, and one chord per bar gives no chord extra weight", ["loops are always in minor", "loops never use the tonic", "loops have no melody"], "A loop ending on I may still feel open, because the next cycle begins immediately."],
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
    if (mode === "pop") {
      const k = H.key(H.rnd(["C", "G", "D", "A", "E", "F", "B♭", "E♭"]), "major"), [, cs, label, why] = H.rnd(POP);
      const chords = cs.map(c => popChord(H, k, c)), seq = chords.map(c => `{sym:${c.sym}}`).join(" – ");
      return H.mc(`A pop phrase in ${k.label} ends with ${seq}, the last chord on the final strong downbeat. How does it end?`, label, POP.map(x => x[2]).filter(x => x !== label), `${cs.map(popRN).join(" – ")}: ${label}. ${why}`, { kicker: "Open cadences", play: { chords: H.grand({ key: k, chords }).cols.map(c => c.t.concat(c.b).map(x => H.midi(H.parse(x)))) }, playLabel: "Hear it" });
    }
    if (mode === "where") { const [q, a, w, y] = H.rnd(PLACE); return H.mc(q, a, w, y, { kicker: "Where cadences happen" }); }
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
      <tr><td><b>Secondary half (SHC)</b></td><td>a deceptive move to a secondary dominant</td><td>open</td></tr></tbody></table></div>
      <div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Open cadence</th><th scope="col">How it works</th></tr></thead><tbody>${POP.map(x => `<tr><td><b>${x[2]}</b></td><td>${x[3]}</td></tr>`).join("")}</tbody></table></div>
      <p class="legend">Cadences happen only at phrase endings (points of closure or elision); a V–I inside a phrase is not a cadence. Most cadences land on the downbeat of bar 4 (or bar 3) of a four-bar phrase.</p>`;
  }

  // fixed lesson examples, voiced in the chosen key
  const exV = (H, k, toks, sop) => { for (let i = 0; i < 6; i++) { const chords = toks.map(t => tok(H, k, t)), vs = H.satb(k, chords, { sop }); if (vs) return { k, chords, vs }; } return null; };
  const fig = (H, k, U, toks, cap, sop) => { const x = exV(H, k, toks, sop); return x ? U.fig({ type: "voices", vf: k.vf, sig: k.sig, cols: H.satbCols(x.vs, x.chords.map(c => c.rn)) }, cap, { small: true, play: H.satbPlay(x.vs, .9) }) : ""; };
  const lesson = { defMode: "major", steps: [
    { title: "What is a cadence?", kick: "Endings", render: (H, _k, U) => `<p>A <b>cadence</b> is a phrase-ending pattern: a combination of <b>harmonic and melodic</b> factors that gives a sense of completion. Cadences happen only at <b>points of closure</b> (the ends of phrases) or at an <b>elision</b>, where one phrase ends just as the next begins. That sense of <b>closure</b> ranges from <b>open</b> (suggesting that a later phrase will resolve it) to <b>closed</b>, mostly depending on the final chord.</p>
      <ul><li>Cadences ending on the <b>tonic</b> (or a tonic substitute) have the greatest closure.</li><li>Cadences ending on the <b>dominant</b> or <b>subdominant</b> have the weakest.</li></ul>
      <figure class="lfig cad-fig"><audio controls preload="none" src="assets/audio/cadences/auld-lang-syne.mp3" aria-label="Auld Lang Syne, sung by the Strathclyde University Chamber Choir">Your browser can't play this audio clip.</audio>
        <img src="assets/img/cadences/auld-lang-syne.jpg" width="2216" height="902" alt="Lead sheet of the first two phrases of Auld Lang Syne in F major with chord symbols. The first phrase, ending on “brought to mind?”, is boxed and labeled: open cadence, ending on IV (B-flat), with the melody on scale degree 6. The second phrase, ending on “auld lang syne?”, is boxed and labeled: closed cadence, Gm, C7, F, ending on I with the melody on scale degree 1." loading="lazy">
        <figcaption><p>“Auld Lang Syne” (traditional Scottish tune; words by Robert Burns), first two phrases. Sung by the Strathclyde University Chamber Choir, from <i>Sae Fresh and Fair: Scottish Romantic Choral Songs</i>.</p><p class="note lcite fair-use" data-fair-use></p></figcaption></figure>
      <p>Listen to “Auld Lang Syne.” The first phrase stops on “mind?” over a B♭ chord, {rn:IV} in F, with the melody hanging on D, scale degree 6. It's a question, and the music sounds like one. The second phrase asks the same thing in the same words, but this time Gm – C⁷ – F carries it home: {rn:ii} – {rn:V7} – {rn:I}, with the melody landing on F, the tonic. Open, then closed. Most of what this lesson names is some version of that difference.</p>
      <p>Between open and closed sits a third group, the <b>weak</b> cadences: they end on the tonic or near it, but something holds back the full stop. Here's where each cadence in this lesson falls:</p>
      <div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Closure</th><th scope="col">Cadences</th></tr></thead><tbody>
      <tr><td><b>Open</b></td><td>half, plagal half, secondary half</td></tr><tr><td><b>Weak</b></td><td>deceptive, imperfect authentic</td></tr><tr><td><b>Closed</b></td><td>(perfect) authentic, plagal</td></tr></tbody></table></div>
      <p>An open phrase is usually answered by one with a stronger cadence, the way “Auld Lang Syne” answers its first phrase. That's how periods work.</p>
      <p>Cadences are described with a handful of formulas. The examples in this lesson are in four voices; choose a key to hear them anywhere.</p>
      <div class="callout"><b>Not every V–I is a cadence</b>The cadence names below describe <i>phrase-ending</i> scenarios only. A V–I (or IV–I, or V–vi) at the start or in the middle of a phrase is simply a progression: in I – V⁶ – I – IV – V⁷ – I, only the final V⁷–I is a cadence; the first V⁶–I just prolongs the tonic.</div>` },
    { title: "The cadence patterns", kick: "An outline", render: (H) => `<p>Every cadence is named for its last two chords, or for its last chord alone. Here's the whole set before the real examples.</p>
      <div class="ltable-wrap" tabindex="0" role="region" aria-label="Cadence patterns"><table class="ltable cad-pat"><thead><tr><th scope="col">Cadence</th><th scope="col">Last chords</th><th scope="col">What makes it</th><th scope="col">Closure</th></tr></thead><tbody>
      <tr><th scope="row">Perfect authentic (PAC)</th><td>{rn:V} (or {rn:V7}) → {rn:I}</td><td>Both chords in root position; the tonic in the bass <i>and</i> the melody at the end.</td><td>closed</td></tr>
      <tr><th scope="row">Imperfect authentic (IAC)</th><td>{rn:V} → {rn:I}</td><td>Anything short of perfect: the melody ends on 3̂ or 5̂, or a chord is inverted, or vii° stands in for V.</td><td>weak</td></tr>
      <tr><th scope="row">Half (HC)</th><td>… → {rn:V}</td><td>The phrase stops on the dominant, often after a pre-dominant ({rn:IV}, {rn:ii}), a cadential ⁶₄, or V/V.</td><td>open</td></tr>
      <tr><th scope="row">Secondary half (SHC)</th><td>… → {rn:V7/x}</td><td>The phrase stops on a secondary dominant, the dominant of some chord other than I.</td><td>open</td></tr>
      <tr><th scope="row">Plagal (PC)</th><td>{rn:IV} → {rn:I}</td><td>Subdominant to tonic, the “amen” at the end of a hymn.</td><td>closed</td></tr>
      <tr><th scope="row">Plagal half (PHC)</th><td>… → {rn:IV}</td><td>The phrase stops on IV, the most common open ending in pop.</td><td>open</td></tr>
      <tr><th scope="row">Deceptive (DC)</th><td>{rn:V} → {rn:vi}</td><td>V goes somewhere other than I, usually vi (VI in minor). We expect home and don't get it.</td><td>weak</td></tr>
      <tr><th scope="row">Authentic on another chord (AC on III, AC on V…)</th><td>{rn:V7/x} → x</td><td>A chord's own dominant leads to it at the end of a phrase. It's a real arrival, just not on the tonic.</td><td>weak</td></tr>
      </tbody></table></div>
      <p>Pop songs stretch the open endings further. A phrase can land on <b>♭VII</b> or <b>♭VI</b> (borrowed from Mixolydian or the parallel minor), on a major <b>II</b>, on a minor <b>iv</b>, or on <b>Vsus4</b>, a half cadence with a 4th in place of the leading tone. What makes any of these a cadence is <i>where</i> it falls: at the end of the phrase, usually on its last strong downbeat. The same chord mid-phrase is just a chord.</p>`
      + H.check("V⁷–I, both in root position, but the melody ends on the 3rd of I. Which cadence?", "IAC", ["PAC", "HC", "DC"], "Without the tonic in the melody, it's imperfect.")
      + H.check("V⁷ – vi at the end of a phrase:", "Deceptive", ["Plagal", "Half", "Authentic"], "V goes to a tonic substitute.")
      + H.check("A pop phrase in G ends C – F, with F on the last strong downbeat. What kind of cadence?", "an open cadence on ♭VII", ["a closed cadence", "an authentic cadence", "not a cadence"], "F is ♭VII in G major; ending on a non-tonic chord makes the cadence open.") },
    { title: "Authentic and plagal cadences", kick: "“Rubber Duckie,” “Innocent When You Dream”", render: (H) => `<h3>Authentic cadences: “Rubber Duckie”</h3><p>The same V⁷ – I, twice, and only one of them is perfect. Watch from 0:06 to 0:30 with the score.</p>
      <figure class="lfig cad-fig cad-video"><div class="lvideo"><iframe src="https://www.youtube-nocookie.com/embed/ltMDeoxT5rs?start=6&amp;end=30&amp;rel=0" title="Rubber Duckie (YouTube), 0:06 to 0:30" loading="lazy" allow="encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>
        <img src="assets/img/cadences/rubber-duckie.jpg" width="2576" height="1569" alt="Lead sheet of Rubber Duckie in B-flat major, 16 bars. Bars 6 to 7 are marked V7–I, imperfect authentic cadence: F7 to B-flat, with the melody ending on F. Bar 8 has circled turnaround chords B diminished 7, C minor 7, F7. Bars 14 to 15 are marked V7–I, perfect authentic cadence: F7 to B-flat, with the melody ending on B-flat." loading="lazy">
        <figcaption><p>Jeff Moss, “Rubber Duckie” (1970), from <i>Sesame Street</i>.</p><p class="note lcite fair-use" data-fair-use></p></figcaption></figure>
      <p><b>Bars 6–7: imperfect.</b> F⁷ goes to B♭, {rn:V7} to {rn:I}, both chords in root position. That much is a perfect cadence. But listen to the last sung note. It's F, scale degree 5, and the melody hangs there over the tonic chord. The tonic isn't on top, so the cadence is imperfect, and the song keeps going.</p>
      <p><b>Bar 8: turnaround.</b> While the voice fills in (“vo-vo-vo-de-o”), the band plays B°⁷ – Cm⁷ – F⁷. That's motion after the cadence chord: a chromatic step up from B♭ to B, then {rn:ii7} – {rn:V7}, steering straight back to B♭ for the second verse.</p>
      <p><b>Bars 14–15: perfect.</b> The same F⁷ to B♭, and this time the melody lands on B♭. Root-position V⁷ to root-position I, tonic in the bass and on top. Same chords, a different last note, and the song is over.</p>`
      + H.check("Bars 6–7 and 14–15 both go F⁷ → B♭. What makes the second one perfect?", "The melody ends on B♭, the tonic", ["The chords are louder", "F⁷ is in inversion", "It's in a different key"], "Both are root-position V⁷ – I. Only the second has the tonic in the melody.")
      + `<h3>Plagal cadences: “Innocent When You Dream”</h3>
      <p>A <b>plagal cadence</b> goes {rn:IV} → {rn:I}. It ends on the tonic, so it closes, but there's no leading tone pulling up into the last chord, and the closure is softer than an authentic cadence's. Watch from 0:15 to 0:38 with the lead sheet. The song has three cadences, and the last one goes back over the same ground as the plagal one and does it properly.</p>
      <figure class="lfig cad-fig cad-video"><div class="lvideo"><iframe src="https://www.youtube-nocookie.com/embed/fOO64voDRNE?start=15&amp;end=38&amp;rel=0" title="Tom Waits, Innocent When You Dream (YouTube), 0:15 to 0:38" loading="lazy" allow="encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>
        <img src="assets/img/cadences/innocent-when-you-dream.jpg" width="2208" height="934" alt="Lead sheet of Innocent When You Dream in F major, 3/4, three lines with chord symbols. Line 1: F, D7 over F-sharp, G minor, C7 over E. Line 2: C7 to F, boxed V7 to I and labeled IAC, with the melody ending on A; then A7 and D minor. Line 3: B-flat to F, boxed IV to I and labeled PC, with the melody ending on low C; then B-flat, C7, F, boxed IV, V7, I and labeled PAC, with the melody rising E to F." loading="lazy">
        <figcaption><p>Tom Waits, “Innocent When You Dream,” from <i>Franks Wild Years</i> (1987).</p><p class="note lcite fair-use" data-fair-use></p></figcaption></figure>
      <details class="cad-more"><summary>Show the explanations</summary>
      <p><b>First cadence: imperfect authentic.</b> F – D⁷/F♯ – Gm – C⁷/E – C⁷ – F is {rn:I} – {rn:V65/ii} – {rn:ii} – {rn:V65} – {rn:V7} – {rn:I}. The chords close, but the melody stops on A, scale degree 3. The G♯ just before it is a chromatic passing tone from G up to A.</p>
      <p><b>Second cadence: plagal.</b> A⁷ – Dm – B♭ – F is {rn:V7/vi} – {rn:vi} – {rn:IV} – {rn:I}. The phrase reaches the tonic chord without any dominant, and the melody sinks to low C, scale degree 5. It's an ending, but a soft one.</p>
      <p><b>Third cadence: perfect authentic.</b> Then the line is repeated, and this time the music corrects the ending: B♭ – C⁷ – F, {rn:IV} – {rn:V7} – {rn:I}. The same IV is still there, but now V⁷ comes between it and I, and the melody rises E – F, 7̂ to 1̂. The leading tone resolves and the tonic is in both the bass and the melody. This is a <b>revised cadence</b>: the plagal ending was enough to pause on, and the authentic one replaces it with stronger closure.</p></details>`
      + H.check("The second and third cadences both arrive on F from B♭. What does the third one add?", "V⁷ between IV and I, with the melody rising 7̂ – 1̂", ["a deceptive resolution", "a key change", "nothing: they're the same cadence"], "Look at what comes between B♭ and F.")
      + H.check("Why does a plagal cadence close more softly than an authentic one?", "There's no leading tone resolving into the tonic", ["It ends on V", "It never reaches the tonic", "It's always in minor"], "IV doesn't contain scale degree 7.") },
    { title: "Weakly closed cadences", kick: "“Castle on a Cloud”", render: (H) => `<p>A closed cadence comes to rest on a stable chord. Some cadences close only partway: the music settles, but on a chord other than the tonic, or on a chord we weren't expecting. These are <b>weakly closed</b>. Two kinds turn up all the time.</p>
      <ul><li><b>Deceptive cadence (DC).</b> {rn:V} goes to something other than {rn:I}, usually {rn:vi} ({rn:VI} in minor). The pull toward home is there, and then home doesn't come.</li>
      <li><b>Authentic cadence on a non-tonic chord.</b> A chord's own dominant leads to it at the end of a phrase, {rn:V/III} → {rn:III} for example. It sounds like an arrival because it is one, just not at home. Name it for where it lands: “AC on III.”</li></ul>
      <p>“Castle on a Cloud” has both, in between two perfect authentic cadences. Listen, then look at how each of the four phrases ends.</p>
      <figure class="lfig cad-fig"><audio controls preload="none" src="assets/audio/cadences/castle-on-a-cloud.mp3" aria-label="Castle on a Cloud, from the Les Misérables film soundtrack">Your browser can't play this audio clip.</audio>
        <img src="assets/img/cadences/castle-on-a-cloud.jpg" width="2192" height="745" alt="Lead sheet of Castle on a Cloud in A minor, four short phrases alternating bars of 3/4 and 2/4, with chord symbols and Roman numerals. Phrase 1: Am, F, Dm, E, Am, i VI iv V i, boxed PAC. Phrase 2: Am, G, C, i, VII (V of III), III, boxed AC on III. Phrase 3: Dm, Am over E, E, F, iv, i six-four, V, VI, boxed DC. Phrase 4: Dm, E, Am, iv V i, boxed PAC." loading="lazy">
        <figcaption><p>Claude-Michel Schönberg (music) and Herbert Kretzmer (English words), “Castle on a Cloud,” from <i>Les Misérables</i>. Recording from the film soundtrack (2012).</p><p class="note lcite fair-use" data-fair-use></p></figcaption></figure>
      <details class="cad-more"><summary>Show the explanations</summary>
      <p><b>Phrase 1: perfect authentic cadence.</b> Am – F – Dm – E – Am is {rn:i} – {rn:VI} – {rn:iv} – {rn:V} – {rn:i}, and the melody comes down to A. Fully closed, at home.</p>
      <p><b>Phrase 2: authentic cadence on III.</b> It starts like phrase 1, but G takes the place of E. G is {rn:VII} in A minor, and it's also the dominant of C, so G → C works as V → I in C major. The phrase settles on C, {rn:III}, as if the relative major were home for a moment. It closes, on the wrong chord.</p>
      <p><b>Phrase 3: deceptive cadence.</b> Dm – Am/E – E is {rn:iv} – {rn:i64} – {rn:V}, the cadential six-four, the strongest setup for {rn:i} there is. F arrives instead: {rn:VI}. The melody even lands on A, the tonic, but A is sitting in an F chord now.</p>
      <p><b>Phrase 4: perfect authentic cadence.</b> Dm – E – Am, {rn:iv} – {rn:V} – {rn:i}, with the melody dropping to low A. This is the arrival phrase 3 held back.</p></details>`
      + H.check("Phrase 3 sets up i⁶₄ – V. What makes its ending deceptive?", "V moves to VI instead of i", ["the melody avoids the tonic", "there's no dominant", "the phrase ends on V"], "Look at the last chord: F, not Am.")
      + H.check("Phrase 2 ends G – C in A minor. Why is that only weakly closed?", "it lands on III, not the tonic", ["G isn't a dominant of anything", "it ends on V", "the melody leaps"], "G is V of C, and C is III in A minor.") },
    { title: "“Don't Think Twice, It's All Right”", kick: "Bob Dylan, 1963", render: (H) => `<p>Dylan plays this in C-major shapes with a capo on the 4th fret, so it sounds in E major. Watch the first verse, from 0:07 to 0:45, and follow the boxed chords: three of the four lines end with a cadence.</p>
      <figure class="lfig cad-fig cad-video"><div class="lvideo"><iframe src="https://www.youtube-nocookie.com/embed/1iHhWh9FtsQ?start=7&amp;end=45&amp;rel=0" title="Bob Dylan, Don't Think Twice, It's All Right (YouTube), 0:07 to 0:45" loading="lazy" allow="encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>
        <figcaption><p>Bob Dylan, “Don't Think Twice, It's All Right,” from <i>The Freewheelin' Bob Dylan</i> (1963), first verse.</p></figcaption></figure>
      <figure class="lfig cad-fig"><img src="assets/img/cadences/dont-think-twice.jpg" width="2224" height="1239" alt="Lead sheet of the first verse of Don't Think Twice, It's All Right in E major, four lines with chord symbols. Line 1 ends A to E, labeled IV to I, plagal cadence, followed by a circled B7 turnaround chord. Line 2 ends F-sharp 7 over A-sharp to B7, labeled V four-two of V to V7, half cadence. Line 3 runs E, E7, A, F-sharp 7 over A-sharp with no label. Line 4 ends E over B, B7, E, labeled I six-four, V7, I, perfect authentic cadence." loading="lazy">
        <figcaption><p>“Don't Think Twice, It's All Right,” first verse, with its cadences marked.</p><p class="note lcite fair-use" data-fair-use></p></figcaption></figure>

      <details class="cad-more"><summary>Show the explanations</summary>
      <p><b>Line 1: plagal cadence.</b> A to E is {rn:IV} – {rn:I}, the “amen” ending. The line closes on the tonic, but softly, without the pull of a leading tone. The circled B⁷ after it is a <b>turnaround</b>: like the extra chords in bar 4 of “America,” it keeps the harmony moving into the next line and isn't part of the cadence.</p>
      <p><b>Line 2: half cadence, approached by V⁷/V.</b> F♯⁷ with A♯ in the bass is {rn:V42/V}. The A♯ is a leading tone to B, so it pushes up a half step into B⁷, and the line stops on V. That's what V/V does: it makes V sound more like an arrival without changing the key.</p>
      <p><b>Line 3: no cadence.</b> E – E⁷ – A – F♯⁷/A♯ never settles. The line ends on a secondary dominant, but the words and the melody run straight into line 4, so this is a halfway point, not a phrase ending.</p>
      <p><b>Line 4: perfect authentic cadence.</b> E/B – B⁷ – E is {rn:I64} – {rn:V7} – {rn:I}, the cadential six-four, and the melody comes down to E on “right.” After the soft close of line 1 and the open end of line 2, this is the one that finishes the verse.</p></details>`
      + H.check("Line 2 ends F♯⁷/A♯ – B⁷. In E major, what kind of cadence is that?", "a half cadence approached by V⁷/V", ["a perfect authentic cadence", "a deceptive cadence", "a plagal cadence"], "B is V in E. F♯⁷ is V⁷ of B, so it leads into the half cadence.")
      + H.check("Line 1 ends A – E. What kind of cadence is that?", "a plagal cadence (IV – I)", ["a half cadence", "an imperfect authentic cadence", "a deceptive cadence"], "A is IV in E major, and the line closes on I without passing through V.") },
    { title: "Four cadences in one song", kick: "“America the Beautiful”", render: (H) => `<p>You've met the cadence types one at a time. Here are four of them in a single sixteen-bar song: four phrases, four different endings. Listen once through, then look at how each phrase stops.</p>
      <figure class="lfig cad-fig"><audio controls preload="none" src="assets/audio/cadences/america-the-beautiful.mp3" aria-label="America the Beautiful, played by a US military band">Your browser can't play this audio clip.</audio>
<div class="cad-map">        <img src="assets/img/cadences/america-the-beautiful.jpg" width="2184" height="1369" alt="Lead sheet of America the Beautiful in C major, four lines of four bars, with chord symbols. Bar 4: C on grain, then C-sharp diminished 7 and G7 over D. Bar 8: G7 on plain, after G over D and D. Bar 12: C7 on thee. Bar 16: C over G, G7, then C on sea." loading="lazy"><span class="cad-hs" style="left:58.5%;top:1.5%;width:27.35%;height:14.6%"><button type="button" class="cad-hot" data-cadp="cadP-iac" aria-describedby="cadTipiac" aria-controls="cadP-iac"><span class="cad-badge">IAC</span><span class="sr-only">Bars 3–4: imperfect authentic cadence</span></button><span class="cad-tip" role="tooltip" id="cadTipiac"><b>Imperfect authentic cadence.</b> Dm⁷ – G⁷ – C is ii⁷ – V⁷ – I, but the melody lands on G, scale degree 5, not the tonic.</span></span><span class="cad-hs" style="left:86.2%;top:1.5%;width:13.35%;height:14.6%"><button type="button" class="cad-hot" data-cadp="cadP-turn" aria-describedby="cadTipturn" aria-controls="cadP-turn"><span class="cad-badge">Turn</span><span class="sr-only">Bar 4: turnaround chords</span></button><span class="cad-tip" role="tooltip" id="cadTipturn"><b>Turnaround.</b> C♯°⁷ and G⁷/D keep the harmony moving under the held note, back toward the next phrase.</span></span><span class="cad-hs" style="left:84%;top:28%;width:15%;height:20%"><button type="button" class="cad-hot" data-cadp="cadP-hc" aria-describedby="cadTiphc" aria-controls="cadP-hc"><span class="cad-badge">HC</span><span class="sr-only">Bar 8: half cadence</span></button><span class="cad-tip" role="tooltip" id="cadTiphc"><b>Half cadence.</b> The phrase stops on G⁷, the dominant, after D (V/V).</span></span><span class="cad-hs up" style="left:84%;top:51%;width:15%;height:20%"><button type="button" class="cad-hot" data-cadp="cadP-shc" aria-describedby="cadTipshc" aria-controls="cadP-shc"><span class="cad-badge">HC</span><span class="sr-only">Bar 12: half cadence on a secondary dominant</span></button><span class="cad-tip" role="tooltip" id="cadTipshc"><b>Half cadence on a secondary dominant.</b> C⁷ is V⁷/IV; bar 13 goes to F.</span></span><span class="cad-hs up" style="left:70%;top:75.5%;width:29%;height:23%"><button type="button" class="cad-hot" data-cadp="cadP-pac" aria-describedby="cadTippac" aria-controls="cadP-pac"><span class="cad-badge">PAC</span><span class="sr-only">Bar 16: perfect authentic cadence</span></button><span class="cad-tip" role="tooltip" id="cadTippac"><b>Perfect authentic cadence.</b> C/G – G⁷ – C, with the melody falling 2̂ to 1̂.</span></span></div>
        <figcaption><p>“America the Beautiful” (music by Samuel A. Ward; words by Katharine Lee Bates). Played by US Military Bands, from <i>Patriotic Music for All Occasions</i>.</p><p class="note lcite fair-use" data-fair-use></p></figcaption></figure>
      <p class="small">Point at a highlighted box for a quick label. Click it to open (or close) the full explanation below.</p>
      <details class="cad-more"><summary>Show all the explanations</summary>
      <p id="cadP-iac"><b>Bars 3–4, “amber waves of grain”: imperfect authentic cadence (IAC).</b> Dm⁷ – G⁷ – C is {rn:ii7} – {rn:V7} – {rn:I}, so the harmony closes. The melody doesn't. It's sitting on G, scale degree 5, and a perfect cadence needs the tonic on top.</p>
      <p id="cadP-turn"><b>Bar 4, after “grain”: a turnaround.</b> While the singer holds the note, the chords keep going: C♯°⁷, G⁷/D, and G⁷ on the pickup. That's harmonic motion after the cadence chord, carrying the music back to the start of the next phrase.</p>
      <p id="cadP-hc"><b>Bar 8, “plain”: half cadence (HC).</b> The phrase stops on G⁷, the dominant. D major just before it, with the C♯ in the melody, is the dominant <i>of</i> G, which makes G sound like a goal for a moment. It's still an open ending: V, waiting for I.</p>
      <p id="cadP-shc"><b>Bar 12, “thee”: half cadence on a secondary dominant.</b> This one ends on C⁷, which is not V of C major. It's the dominant of F, {rn:V7/IV}, and that's exactly where bar 13 goes. A phrase that stops on a chord like this sounds open in the same way a half cadence does. Chords that act as the dominant of something other than the tonic get their own unit, <a href="secondary-function-chords-lesson.html">Secondary Function Chords</a>.</p>
      <p id="cadP-pac"><b>Bar 16, “sea”: perfect authentic cadence (PAC).</b> C/G – G⁷ – C, with the bass on G and then C, and the melody falling D to C, 2̂ to 1̂. Root-position V to root-position I, tonic in both outer voices. That's the ending the other three were putting off.</p>
      </details>`
      + H.check("Why is the cadence in bars 3–4 imperfect rather than perfect?", "The melody ends on scale degree 5, not the tonic", ["The last chord isn't I", "V is in inversion", "There's no dominant"], "Dm⁷ – G⁷ – C closes the harmony, but a PAC also needs the tonic on top. Here the melody holds G."),
      after: root => { const hs = [...root.querySelectorAll(".cad-hs")], det = root.querySelector(".cad-more");
        // clicking a box opens the explanations at that paragraph; clicking the same box again closes them
        const reset = () => { root.querySelectorAll(".cad-more p").forEach(x => x.classList.remove("cad-cur")); hs.forEach(x => x.querySelector(".cad-hot").setAttribute("aria-expanded", "false")); };
        hs.forEach(h => { const btn = h.querySelector(".cad-hot"); btn.setAttribute("aria-expanded", "false");
          btn.addEventListener("click", e => { e.stopPropagation(); const id = btn.dataset.cadp, para = root.querySelector("#" + id), again = det.open && det.dataset.cur === id;
            reset(); if (again) { det.open = false; det.dataset.cur = ""; return; }
            det.open = true; det.dataset.cur = id; btn.setAttribute("aria-expanded", "true"); if (para) { para.classList.add("cad-cur"); para.scrollIntoView({ block: "nearest", behavior: "smooth" }); } }); });
        det.addEventListener("toggle", () => { if (!det.open) { det.dataset.cur = ""; reset(); } });
        root.addEventListener("keydown", e => { if (e.key === "Escape") hs.forEach(x => x.querySelector(".cad-hot").blur()); }); } },
    { title: "Where cadences land", kick: "Rhythm, elision, turnarounds", render: (H) => `<p>In a balanced four-bar phrase, the cadence usually arrives on or near the downbeat of bar 3 or 4. The melody's point of repose (“arrival”) coincides with the conclusive harmony, while the accompaniment often keeps going to balance the stopped melody.</p>
      <ul><li>The <b>fourth downbeat</b> (the downbeat of bar 4) is the most typical cadence point; Ken Stephenson calls this the <b>fourth-downbeat cadence</b>.<sup class="fnref"><a href="#fn-stephenson" id="fnref-stephenson" aria-label="Footnote 1">1</a></sup></li>
      <li>A cadence on the <b>third downbeat</b> gives more partial, provisional closure: the phrase hasn't reached its last strong downbeat.</li>
      <li>In much popular music, a chord is cadential mostly because of <b>where</b> it falls (the last strong downbeat of the phrase), not only because of which chord it is. That's why IV, ♭VII and other chords can be cadential arrivals.</li>
      <li>When chords change at a steady rate (often one per bar) in a repeating loop, no chord gets extra weight from its length, and a loop that ends on I may still sound open because the next cycle begins at once.</li></ul>
      <p>The cadence point can be obscured when melody and harmony arrive on different beats, or by <b>elision</b>: a new phrase begins at the very moment the previous one cadences.</p>
      <figure class="lfig cad-fig"><audio controls preload="none" src="assets/audio/cadences/ive-got-a-dream.mp3" aria-label="I've Got a Dream, from the Tangled soundtrack">Your browser can't play this audio clip.</audio>
        <img src="assets/img/cadences/ive-got-a-dream.jpg" width="2256" height="744" alt="Lead sheet in E major, two staves. The solo melody runs B7, E, A, F-sharp 7 over A-sharp, then G7, D-flat 7, F-sharp minor 7, B7, and lands on a whole-note E, boxed PAC. On that same downbeat a second staff, the chorus, starts a new phrase over E, A, B, E, F-sharp 7 and ends on B7, boxed HC. A box between the staves reads: elision, new phrase begins at the cadence point of the previous phrase." loading="lazy">
        <figcaption><p>Alan Menken (music) and Glenn Slater (words), “I've Got a Dream,” from <i>Tangled</i> (2010). Recording from the film soundtrack.</p><p class="note lcite fair-use" data-fair-use></p></figcaption></figure>
      <p>In “I've Got a Dream,” the solo line closes with a perfect authentic cadence on E. A chromatic run-up, G⁷ – D♭⁷, slides into {rn:ii7} – {rn:V7} – {rn:I}, and the melody comes down to E. On that same downbeat the chorus starts the next phrase, so the arrival of one phrase is the first beat of the next. There's no gap between them. The chorus's phrase then runs four bars, {rn:I} – {rn:IV} – {rn:V} – {rn:I} – {rn:V7/V}, and stops on B⁷: a half cadence.</p>
      <p>Chords sometimes keep changing after the cadence point, before the next phrase begins. This post-cadential motion is a <b>turnaround</b> (a jazz term that applies to other music too):</p>
      <ul><li>a single chord, usually the dominant, after a closed cadence;</li><li>a series of chords, usually {rn:ii}–{rn:V}, sometimes extended with secondary chords or a cadential ⁶₄;</li><li>chords in a new key that set up a tonicization or modulation for the next phrase.</li></ul>`
      + H.check("A new phrase starts on the same downbeat where the last one cadences. That's…", "elision", ["a turnaround", "a half cadence", "a deceptive cadence"], "The two phrases overlap at the cadence.")
      + `<aside class="footnotes" aria-label="Footnotes"><ol><li id="fn-stephenson">Ken Stephenson, <a href="https://yalebooks.yale.edu/9780300092394/what-to-listen-for-in-rock" target="_blank" rel="noopener"><i>What to Listen For in Rock: A Stylistic Analysis</i></a> (New Haven: Yale University Press, 2002), chapter 3, “Cadences.” <a href="#fnref-stephenson" aria-label="Back to the text">↩</a></li></ol></aside>` },
    { title: "Quick check", kick: "Before the drills", render: (H) => FACTS.slice(0, 3).concat([PLACE[0], PLACE[3]]).map(([q, a, w, y]) => H.check(q, a, w, y)).join("") + H.check("A phrase stops on V. How much closure?", "open", ["closed", "weak"], "Half cadences are open.") },
  ] };

  return {
    key: "silverapps-cadences-v1", lesson, make, reference,
    modes: [{ id: "staff", kicker: "Name it" }, { id: "hear", kicker: "Hear it" }, { id: "symbols", kicker: "Lead sheet" }, { id: "pop", kicker: "Open cadences" }, { id: "where", kicker: "Where cadences happen" }, { id: "terms", kicker: "Closure & terms" }],
    topics: [],
  };
})();
// ===== Test yourself quiz (engine adds it as the step before Practice; s = step to look back at) =====
window.FAM.quiz = [{"s": 5, "q": "A line stops on a secondary dominant, but the melody runs straight on into the next line. Is that a cadence?", "a": "no: the melody has to pause for a phrase to end", "w": ["yes: any dominant 7th makes one", "yes: a half cadence", "only if the chord is in root position"], "hint": "A cadence needs a phrase ending.", "why": "Only phrase endings are cadences. A chord the melody passes through is just a point along the way."}, {"s": 5, "q": "A phrase in E major ends E/B – B⁷ – E, with the melody on E. What is that?", "a": "a perfect authentic cadence with a cadential six-four", "w": ["a plagal cadence", "a half cadence", "a deceptive cadence"], "hint": "E/B is I with its 5th in the bass.", "why": "I⁶₄ – V⁷ – I, with the melody ending on the tonic: a PAC."}, {"s": 2, "q": "What makes an authentic cadence perfect (PAC)?", "a": "V and I both in root position, with the tonic in both outer voices", "w": ["any V–I at the end of a piece", "a V⁷ instead of V", "the soprano ending on the 3rd"], "hint": "Anything else is imperfect.", "why": "Root-position V and I, and the final I has its root in the bass and the soprano."}, {"s": 3, "q": "A phrase ends V⁷ → I, both in root position, with scale degree 5 on top of the last chord. Which cadence is it?", "a": "imperfect authentic (IAC)", "w": ["perfect authentic (PAC)", "half (HC)", "plagal (PC)"], "hint": "What note is on top of the final chord?", "why": "Without the tonic on top, the authentic cadence is imperfect."}, {"s": 2, "q": "A phrase ends on V. That's a…", "a": "half cadence", "w": ["perfect authentic cadence", "plagal cadence", "deceptive cadence"], "hint": "It's open: the music needs to go on.", "why": "Ending on V is a half cadence (semicadence)."}, {"s": 2, "q": "Which cadence is often called the “amen” cadence?", "a": "plagal (IV–I)", "w": ["deceptive (V–vi)", "half (I–V)", "authentic (V–I)"], "hint": "Sung at the end of many hymns.", "why": "Subdominant to tonic, IV–I, is the plagal or “amen” cadence."}, {"s": 2, "q": "Why does a deceptive cadence give only weak closure?", "a": "We expect I after V and get a substitute, usually vi", "w": ["It ends on V", "It has no dominant", "It's in a minor key"], "hint": "It's named for what it does to our expectation.", "why": "V sets up I, and the cadence swaps in vi instead."}, {"s": 2, "q": "In a pop loop like I–V–vi–IV, where does each phrase end?", "a": "open, on IV", "w": ["closed, on I", "on V, a half cadence", "on vi, a deceptive cadence"], "hint": "IV is the most common open ending in pop.", "why": "The phrase lands on IV (a plagal half cadence), even though the next cycle starts on I."}, {"s": 1, "q": "Which group lists only open cadences?", "a": "half, plagal half, secondary half", "w": ["deceptive, imperfect authentic", "authentic, plagal", "perfect authentic, half"], "hint": "Check the closure table.", "why": "Open: half, plagal half, secondary half. Weak: deceptive, IAC. Closed: authentic, plagal."}, {"s": 7, "q": "In a balanced four-bar phrase, where does the cadence most often land?", "a": "on the downbeat of bar 4", "w": ["on beat 1 of bar 1", "in the middle of bar 2", "on the last beat of bar 4"], "hint": "Ken Stephenson's name for it gives it away.", "why": "The fourth-downbeat cadence is the most typical."}, {"s": 7, "q": "Chords that keep changing after the cadence, before the next phrase, are called a…", "a": "turnaround", "w": ["elision", "pickup", "pedal"], "hint": "It's a jazz term.", "why": "Post-cadential motion is a turnaround."}, {"s": 6, "q": "A phrase in C major ends on C⁷, and the next phrase starts on F. What is that ending?", "a": "a half cadence on a secondary dominant (V⁷/IV)", "w": ["a perfect authentic cadence", "a plagal cadence", "a deceptive cadence"], "hint": "C⁷ is the dominant of which chord?", "why": "C⁷ is V⁷ of F (IV), and the next phrase goes there. Stopping on it is an open, secondary half cadence."}, {"s": 1, "q": "Where do cadences happen?", "a": "only at the ends of phrases (or at an elision)", "w": ["at every V–I progression", "on every downbeat", "only at the end of a piece"], "hint": "Phrase-ending patterns.", "why": "A V–I in the middle of a phrase is just a progression; a cadence closes a phrase."}, {"s": 1, "q": "Which final chords give a cadence the most closure?", "a": "the tonic (or a tonic substitute)", "w": ["the dominant", "the subdominant", "the leading-tone chord"], "hint": "Home base.", "why": "Endings on the tonic are the most closed; endings on V or IV the weakest."}, {"s": 2, "q": "V⁷–I, both in root position, but the soprano ends on the 3rd of I. Which cadence?", "a": "imperfect authentic (IAC)", "w": ["perfect authentic (PAC)", "half cadence", "deceptive cadence"], "hint": "Perfect needs the tonic on top too.", "why": "A PAC needs the tonic in both outer voices; with the 3rd on top it's imperfect."}, {"s": 2, "q": "vii°⁶ going to I at the end of a phrase is…", "a": "an imperfect authentic cadence", "w": ["a perfect authentic cadence", "a plagal cadence", "a half cadence"], "hint": "It's still dominant-function to tonic.", "why": "An inverted dominant-function chord makes the authentic cadence imperfect."}, {"s": 2, "q": "Besides a pre-dominant chord, what often comes right before the V of a half cadence?", "a": "a cadential ⁶₄", "w": ["a deceptive vi", "a ♭VII", "a secondary half cadence"], "hint": "A ⁶₄ chord over the dominant bass note.", "why": "Half cadences are often approached by a pre-dominant or a cadential ⁶₄."}, {"s": 2, "q": "A phrase that stops on IV can be called a…", "a": "plagal half cadence", "w": ["plagal cadence", "deceptive cadence", "imperfect authentic cadence"], "hint": "It ends away from the tonic, so it's open.", "why": "Ending on IV is open, like a half cadence: a plagal half cadence (PHC)."}, {"s": 2, "q": "V⁷ to vi at the end of a phrase is a…", "a": "deceptive cadence", "w": ["plagal cadence", "half cadence", "imperfect authentic cadence"], "hint": "We expect I and get something else.", "why": "V going to a tonic substitute, usually vi, is a deceptive cadence."}, {"s": 2, "q": "In a minor key, the deceptive cadence usually goes from V to…", "a": "VI", "w": ["iv", "III", "i"], "hint": "The minor-key version of vi.", "why": "In minor the tonic substitute is VI."}, {"s": 2, "q": "What makes a chord like ♭VII cadential in a pop song?", "a": "the melody and the phrase arrive on it, usually on the last strong downbeat", "w": ["it is always followed by I", "it is in root position", "it is borrowed from minor"], "hint": "Where it falls matters.", "why": "Any non-tonic chord can be an open cadential arrival if the phrase lands on it."}, {"s": 2, "q": "How is Vsus4 different from an ordinary half cadence on V?", "a": "the 4th replaces the leading tone, so it's open without the leading tone's pull", "w": ["it's closed, like an authentic cadence", "it ends on the tonic", "it adds a 7th to V"], "hint": "Sus4 means no 3rd.", "why": "The suspended 4th takes the place of the leading tone (the 3rd of V)."}, {"s": 1, "q": "Which pair are both closed cadences?", "a": "perfect authentic and plagal", "w": ["half and plagal half", "deceptive and imperfect authentic", "half and deceptive"], "hint": "Both end on the tonic with full closure.", "why": "PAC and plagal are closed; deceptive and IAC are weak; half cadences are open."}, {"s": 1, "q": "What usually answers an open phrase?", "a": "one that ends with a stronger cadence", "w": ["another open one", "one with no cadence at all", "a change of meter"], "hint": "That's how periods work.", "why": "An open (half) cadence is answered by a more conclusive one."}, {"s": 7, "q": "A cadence on the third downbeat of a four-bar phrase gives…", "a": "partial, provisional closure", "w": ["the strongest possible closure", "no closure at all", "a deceptive cadence"], "hint": "The phrase hasn't reached its last strong downbeat.", "why": "The fourth downbeat is the typical cadence point; the third gives provisional closure."}, {"s": 7, "q": "When one phrase ends just as the next one begins, that's…", "a": "an elision", "w": ["a turnaround", "a fermata", "a half cadence"], "hint": "The two phrases overlap.", "why": "At an elision the cadence and the next phrase's start share the same moment."}, {"s": 4, "q": "A phrase in A minor ends G – C, with G acting as the dominant of C. What kind of ending is that?", "a": "an authentic cadence on III: weakly closed", "w": ["a perfect authentic cadence on the tonic", "a half cadence", "a plagal cadence"], "hint": "Where does it land, and is that home?", "why": "G – C is V – I in C, but C is III in A minor, so the phrase closes away from the tonic."}, {"s": 4, "q": "Why does a deceptive cadence count as only weakly closed?", "a": "V resolves, but not to the tonic", "w": ["it stops on V", "it has no dominant", "it only happens in minor"], "hint": "Where does V go?", "why": "V moves to a stable chord, usually vi (VI in minor), and the return home is put off."}];
