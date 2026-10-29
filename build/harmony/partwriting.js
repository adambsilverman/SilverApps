window.FAM = (() => {
  // ===== Part-Writing: principles and techniques in four voices. Engine: build/harmony/engine.js =====
  const ERR = { par5: "Parallel 5ths", par8: "Parallel octaves", dir: "Direct (hidden) 5th or octave", lt: "Unresolved leading tone", sev: "Unresolved chordal 7th", dbl: "Doubled leading tone", cross: "Voice crossing", space: "Spacing: upper voices too far apart", no3: "Missing 3rd", ok: "Nothing: it's well written" };
  const ISS = { par5: "par5", par8: "par8", dir5: "dir", dir8: "dir", lt: "lt", sev: "sev" };
  const FLAG = { dblLT: "dbl", cross: "cross", space: "space", no3: "no3" };
  const PAIRS = [["1", "4"], ["1", "5"], ["4", "5"], ["5", "1"], ["57", "1"], ["2", "5"], ["27", "5"], ["6", "4"], ["4", "1"], ["1", "6"], ["5", "6"], ["6", "2"], ["2", "57"], ["4", "2"]];
  const PAIRS_FOR = { lt: [["5", "1"], ["57", "1"], ["5", "6"]], sev: [["57", "1"], ["27", "5"], ["57", "6"]], dbl: [["5", "1"], ["4", "5"], ["1", "5"], ["2", "5"]] };
  const errsOf = (H, k, c1, v1, c2, v2) => {
    const iss = H.pwIssues(k, c1, v1, c2, v2), out = new Set(), bad = [];
    iss.forEach(x => ISS[x.code] ? out.add(ISS[x.code]) : bad.push(x.code));
    [v1, v2].forEach(v => v.flags.forEach(f => FLAG[f] ? out.add(FLAG[f]) : bad.push(f)));
    return { set: out, bad, iss };
  };
  function errorQ(H, want) {
    for (let g = 0; g < 40; g++) {
      const k = H.randKey(["major", "major", "minor"]), [a, b] = H.rnd(PAIRS_FOR[want] || PAIRS);
      const c1 = H.tok(k, a), c2 = H.tok(k, b);
      const flagT = ["dbl", "cross", "space", "no3"].includes(want);
      const okV = v => !v.flags.length && v.dcost <= 2;
      let L1 = H.satbCands(k, c1, { loose: true }), L2 = H.satbCands(k, c2, { loose: true });
      const want1 = v => v.flags.length === 1 && FLAG[v.flags[0]] === want;
      if (flagT) { if (Math.random() < .5) { L1 = L1.filter(want1); L2 = L2.filter(okV); } else { L1 = L1.filter(okV); L2 = L2.filter(want1); } }
      else { L1 = L1.filter(okV); L2 = L2.filter(okV); }
      if (!L1.length || !L2.length) continue;
      for (let t = 0; t < 2500; t++) {
        const v1 = H.rnd(L1), v2 = H.rnd(L2);
        if (t < 1500 && !(v1.m[0] >= 65 && v1.m[0] <= 77)) continue;
        if ([0, 1, 2].some(i => Math.abs(v1.m[i] - v2.m[i]) > 7) || Math.abs(v1.m[3] - v2.m[3]) > 12) continue;
        const e = errsOf(H, k, c1, v1, c2, v2);
        if (e.bad.length) continue;
        if (want === "ok" ? e.set.size === 0 : e.set.size === 1 && e.set.has(want)) return { k, c1, c2, v1, v2, e };
      }
    }
    return null;
  }
  const FLAGTXT = (H, k, c, v, f) => ({
    dblLT: () => `the leading tone (${H.nm(c.tones.find(t => H.pc(t) === H.ltPC(k)))}) is doubled in {rn:${c.rn}}; it would make parallel octaves when it resolves`,
    cross: () => `voices cross in {rn:${c.rn}} (${v.m[0] < v.m[1] ? "the alto is above the soprano" : "the tenor is above the alto"})`,
    space: () => `in {rn:${c.rn}}, ${v.m[0] - v.m[1] > 12 ? "soprano and alto" : "alto and tenor"} are more than an octave apart`,
    no3: () => `{rn:${c.rn}} has no 3rd: never omit the root or 3rd`,
  })[f]();

  // V7–I solutions
  const V7CAT = { inc: "Incomplete V⁷ (no 5th)", frus: "Frustrated leading tone", trip: "Tripled root in I", dbl: "Doubled root and 3rd in I", par: "Parallel 5ths (avoid)" };
  function v7cat(H, k, c1, v1, c2, v2) {
    const lt = H.ltPC(k), VN = ["S", "A", "T", "B"];
    const sevOK = VN.every(x => H.pc(v1[x]) !== H.pc(c1.tones[3]) || H.midi(v2[x]) - H.midi(v1[x]) < 0 && H.midi(v2[x]) - H.midi(v1[x]) >= -2);
    if (!sevOK) return null;
    if (H.pc(v1.S) === lt && H.midi(v2.S) - H.midi(v1.S) !== 1) return null;
    const iss = H.pwIssues(k, c1, v1, c2, v2).map(x => x.code).filter(c => !["sev", "lt"].includes(c));
    const par = iss.includes("par5");
    if (iss.some(c => c !== "par5")) return null;
    const cnt1 = i => v1.idx.filter(x => x === i).length, cnt2 = i => v2.idx.filter(x => x === i).length;
    const frus = VN.some(x => x !== "S" && H.pc(v1[x]) === lt && H.midi(v2[x]) < H.midi(v1[x]));
    const cats = [];
    if (par) return cnt1(2) && cnt2(2) ? "par" : null;
    if (!cnt1(2)) cats.push("inc");
    if (frus) cats.push("frus");
    if (cnt2(0) === 3) cats.push("trip");
    if (cnt2(0) === 2 && cnt2(1) === 2) cats.push("dbl");
    return cats.length === 1 ? cats[0] : null;
  }
  function v7ex(H, k, want) {
    const c1 = H.tok(k, "57"), c2 = H.tok(k, "1");
    const L1 = H.satbCands(k, c1, { loose: true }).filter(v => !v.flags.length), L2 = H.satbCands(k, c2, { loose: true }).filter(v => !v.flags.length);
    const mid = v => v.m[0] >= 67 && v.m[0] <= 77 && v.m[1] >= 59;
    for (let t = 0; t < 6000; t++) {
      const v1 = H.rnd(L1), v2 = H.rnd(L2);
      if (t < 4000 && !mid(v1)) continue;
      if ([0, 1, 2].some(i => Math.abs(v1.m[i] - v2.m[i]) > (want === "par" ? 5 : 4)) || ![5, -7].includes(v2.m[3] - v1.m[3])) continue;
      if (v7cat(H, k, c1, v1, c2, v2) === want) return { k, chords: [c1, c2], vs: [v1, v2] };
    }
    return null;
  }

  const FACTS = [
    ["Part-writing rhythm should be…", "simple, with durations equal to or longer than the beat", ["full of syncopation", "mostly sixteenth notes", "different in every voice"], "Keep it simple."],
    ["Each part's melodic contour should be…", "mostly conjunct (stepwise), with a single climax", ["mostly leaps", "always rising", "a series of octave leaps"], "Steps, with one high point."],
    ["Which melodic intervals should be avoided?", "augmented intervals, 7ths, and anything larger than an octave", ["major and minor 2nds", "perfect 4ths and 5ths", "3rds and 6ths"], "Diminished intervals are OK if the line then turns back by step."],
    ["A leap larger than a P4 is best…", "approached and left in the direction opposite to the leap", ["followed by another leap the same way", "avoided in the bass", "held for two beats"], "Recover from big leaps by moving the other way."],
    ["Smaller leaps in the same direction should…", "outline a triad", ["form a 7th", "be avoided entirely", "only appear in the alto"], "Like an arpeggio."],
    ["Which tones should you never omit from a chord?", "the root and the 3rd", ["the 5th", "the 7th", "the bass note"], "The 5th can be left out."],
    ["Why never double scale degree 7̂?", "it creates parallel octaves when both resolve to 1̂", ["it's too high to sing", "it makes the chord minor", "it hides the bass"], "The leading tone has only one good resolution."],
    ["In a root-position triad, double…", "the root (or the 5th if the root can't be doubled)", ["the 3rd", "the leading tone", "nothing"], "Root doubling is the default."],
    ["In a first-inversion triad, avoid doubling…", "the bass (the 3rd of the chord)", ["the root", "the 5th", "the soprano"], "Double the root or 5th instead."],
    ["In a second-inversion triad, usually double…", "the bass (the 5th of the chord)", ["the 3rd", "the root", "the soprano"], "As in the cadential ⁶₄."],
    ["Chordal 7ths should resolve…", "down by step", ["up by step", "by leap", "to the root"], "Especially in an upper voice."],
    ["Parallel 4ths are acceptable…", "between inner voices, but not between the outer voices", ["between the outer voices only", "never", "only in the bass"], "Parallel P4s in the outer voices make parallel ⁶₄ chords."],
    ["Consecutive 5ths or octaves by contrary motion are…", "avoided too (though sometimes allowed at cadences)", ["always fine", "required at cadences", "the same as direct 5ths"], "Moving from one octave to another in contrary motion still counts."],
    ["Direct (hidden) 5ths and octaves happen when…", "the outer voices move the same way into a P5 or P8 with a leap in the soprano", ["any voice leaps a 5th", "the bass holds a note", "two voices cross"], "The effect is like parallels."],
    ["The main principle of part-writing technique is…", "move each voice to the nearest chord tone, favoring contrary motion", ["keep every voice moving by leap", "move all voices in parallel", "always double the 3rd"], "Smallest interval possible."],
    ["Roots a 4th or 5th apart: what do you do?", "keep the common tone in the same voice; move the others to the nearest chord tones", ["move all upper voices in contrary motion to the bass", "keep two common tones", "move everything in parallel"], "One tone is shared."],
    ["Roots a 2nd apart: what do you do?", "move the upper voices in contrary motion to the bass", ["keep the common tone", "keep two common tones", "double the 3rd in both chords"], "There's no common tone."],
    ["Roots a 3rd apart: what do you do?", "keep the two common tones; move the remaining voice to the nearest chord tone", ["move everything contrary to the bass", "leap every voice", "keep one common tone"], "Two tones are shared."],
    ["V⁴₂ is almost always followed by…", "I⁶", ["I", "IV", "vi"], "The 7th in the bass resolves down to the 3rd of I."],
    ["The only way to resolve a complete V⁷ to a complete I is…", "with parallel 5ths (so it's avoided)", ["with a frustrated leading tone", "with a tripled root", "with the 7th going up"], "Something has to give: leave out a 5th, triple the root, or frustrate the leading tone."],
    ["A “frustrated” leading tone…", "goes down a 3rd to the 5th of I, in an inner voice", ["goes up to the tonic", "is doubled", "is left out"], "Only in an inner voice, where it's less audible."],
    ["Why is vii°⁷–i easy to write?", "the vii°⁷ has no perfect 5th, so there are no parallel 5ths to worry about", ["it has no leading tone", "it never resolves", "it's always in root position"], "Just resolve each tendency tone to the nearest chord tone."],
  ];

  function make(mode, H) {
    if (mode === "error") {
      const want = H.rnd(Object.keys(ERR).concat(["ok"])), x = errorQ(H, want);
      if (!x) return null;
      const spec = { type: "voices", vf: x.k.vf, sig: x.k.sig, cols: H.satbCols([x.v1, x.v2], [x.c1.rn, x.c2.rn]) };
      const flags = [[x.c1, x.v1], [x.c2, x.v2]].flatMap(([c, v]) => v.flags.map(f => FLAGTXT(H, x.k, c, v, f)));
      const iss = x.e.iss.filter(i => ISS[i.code]).map(i => i.text);
      const all = flags.concat(iss);
      return H.mc(`In ${x.k.label}: what's wrong with this part-writing?`, ERR[want], Object.values(ERR), all.length ? all[0].charAt(0).toUpperCase() + all[0].slice(1) + "." : "Complete chords with good doubling, every voice in range, no parallels, and tendency tones resolved.", { kicker: "Find the error", staff: spec, playQ: H.satbPlay([x.v1, x.v2], 1.1), playQLabel: "Play", topic: "err" });
    }
    if (mode === "v7") {
      const want = H.rnd(Object.keys(V7CAT)), k = H.randKey(["major", "minor"]), x = v7ex(H, k, want);
      if (!x) return null;
      const W = { inc: "The V⁷ has no 5th, so the I can be complete without parallels.", frus: "The leading tone is in an inner voice and drops to the 5th of I, so I stays complete.", trip: "The I has three roots and no 5th.", dbl: "The I doubles both its root and its 3rd, with no 5th.", par: "Complete V⁷ to complete I: two voices move in parallel 5ths. This is the one to avoid." };
      return H.mc(`In ${k.label}: which solution does this V⁷–I resolution use?`, V7CAT[want], Object.values(V7CAT), W[want] + " In every case the 7th steps down and the leading tone (when it's in the soprano) steps up.", { kicker: "Resolving V⁷", staff: H.satbSpec(x), playQ: H.satbPlay(x.vs, 1.1), playQLabel: "Play", topic: "tech" });
    }
    if (mode === "double") {
      const k = H.randKey(["major", "minor"]), form = H.rnd(["root", "root", "first", "second", "never"]);
      if (form === "never") {
        const c = H.tok(k, H.rnd(["5", "57", "76"]));
        const lt = c.tones.find(t => H.pc(t) === H.ltPC(k));
        return H.mc(`In ${k.label}, which tone of {rn:${c.rn}} (${c.sym}) should never be doubled?`, H.nm(lt), c.tones.map(H.nm), `${H.nm(lt)} is the leading tone (7̂). Doubled, both would resolve to 1̂: parallel octaves.`, { kicker: "Doubling", topic: "princ" });
      }
      const d = H.rnd(k.mode === "major" ? [1, 2, 4, 5, 6] : [1, 4, 5, 6]), c = H.tok(k, String(d) + (form === "first" ? "6" : form === "second" ? "64" : "")), names = c.tones.map(H.nm);
      if (form === "root") return H.mc(`In ${k.label}, which note is best doubled in a four-voice {rn:${c.rn}} chord (${c.sym})?`, names[0], names, `Root position: double the root, ${names[0]} (the 5th is the next choice).`, { kicker: "Doubling", topic: "princ" });
      if (form === "second") return H.mc(`In ${k.label}, which note is usually doubled in a four-voice {rn:${c.rn}} chord (${c.sym})?`, names[2], names, `Second inversion: double the bass, ${names[2]} (the chord's 5th).`, { kicker: "Doubling", topic: "princ" });
      return H.mc(`In ${k.label}, which note should you avoid doubling in a four-voice {rn:${c.rn}} chord (${c.sym})?`, names[1], names, `First inversion: avoid doubling the bass, ${names[1]} (the chord's 3rd); double the root or 5th.`, { kicker: "Doubling", topic: "princ" });
    }
    if (mode === "tend") {
      const k = H.randKey(["major", "minor"]), v = H.tok(k, "57"), lt = v.tones[1], sev = v.tones[3], s4 = H.deg(k, 4), s3 = H.deg(k, 3), s1 = H.deg(k, 1);
      const qs = [
        [`In ${k.label}, V⁷ (${v.sym}) goes to I. Where does its 7th, ${H.nm(sev)}, go?`, H.nm(s3), [H.nm(H.deg(k, 5)), H.nm(s1), H.nm(H.deg(k, 2))], `Chordal 7ths resolve down by step: ${H.nm(sev)} → ${H.nm(s3)}.`],
        [`In ${k.label}, where does the leading tone ${H.nm(lt)} resolve?`, H.nm(s1), [H.nm(H.deg(k, 5)), H.nm(s3), H.nm(H.deg(k, 6))], `7̂ goes up to 8̂: ${H.nm(lt)} → ${H.nm(s1)}.`],
        [`In ${k.label}, where does scale degree 4̂ (${H.nm(s4)}) tend to resolve?`, H.nm(s3), [H.nm(H.deg(k, 5)), H.nm(s1), H.nm(H.deg(k, 2))], `4̂ goes down to 3̂.`],
        [`In ${k.label}, V⁴₂ (${H.tok(k, "542").sym}) almost always resolves to…`, `{rn:${H.rnOf(k, 1)}6}`, [`{rn:${H.rnOf(k, 1)}}`, `{rn:${H.rnOf(k, 4)}}`, `{rn:${H.rnOf(k, 6)}}`], `The 7th (${H.nm(sev)}) is in the bass and must step down to ${H.nm(s3)}: the 3rd of I, so I⁶.`],
      ];
      const [q, a, w, y] = H.rnd(qs);
      return H.mc(q, a, w, y, { kicker: "Tendency tones", topic: "tech" });
    }
    const [q, a, w, y] = H.rnd(FACTS);
    return H.mc(q, a, w, y, { kicker: "Principles", topic: "princ" });
  }

  function reference() {
    return `<ul class="rules"><li><b>Never</b> omit the root or 3rd; never double 7̂ (or a chordal 7th).</li>
      <li><b>Doubling:</b> root position → root (or 5th); first inversion → not the bass; second inversion → the bass.</li>
      <li><b>Spacing:</b> adjacent upper voices within an octave; no voice crosses above the soprano or below the bass.</li>
      <li><b>Tendency tones:</b> 7̂ up to 8̂, 4̂ down to 3̂, chordal 7ths down by step.</li>
      <li><b>Avoid</b> parallel (and consecutive) P1, P5, P8; direct 5ths/8ves in the outer voices with a soprano leap.</li>
      <li><b>Technique:</b> roots a 4th/5th apart → keep the common tone; a 2nd apart → upper voices contrary to the bass; a 3rd apart → keep two common tones.</li></ul>`;
  }

  const sf = (H, U, k, toks, cap, o) => H.satbFig(U, k, toks, cap, o);
  const errFig = (H, U, k, want, cap) => { const x = errorQ(H, want); return x && x.k ? U.fig({ type: "voices", vf: x.k.vf, sig: x.k.sig, cols: H.satbCols([x.v1, x.v2], [x.c1.rn, x.c2.rn]).map(c => Object.assign(c, { hl: true })) }, cap + ` <i>(in ${x.k.label})</i>`, { small: true, play: H.satbPlay([x.v1, x.v2], 1.1) }) : ""; };
  const v7fig = (H, U, k, want, cap) => { const x = v7ex(H, k, want); return x ? U.fig(H.satbSpec(x), cap, { small: true, play: H.satbPlay(x.vs, 1.1) }) : ""; };
  const lesson = { defMode: "major", steps: [
    { title: "Voice-leading and part-writing", kick: "SATB", render: () => `<p><b>Voice-leading</b> and <b>part-writing</b> focus on how individual lines move and interact: each voice should move smoothly from one note or chord to the next, keeping both melodic interest and harmonic clarity.</p>
      <p>The usual framework is four-part <b>SATB</b> writing (soprano, alto, tenor, bass), familiar from hymns and chorales. The soprano and bass define the outer structure; alto and tenor support from inside. It makes abstract harmonic ideas concrete.</p>
      <p>This lesson covers progressions between root-position triads, seventh chords resolving by a 4th or 5th (including V⁷ in inversion), and vii°⁷.</p>` },
    { title: "Each line is a melody", kick: "Rhythm, contour, leaps", render: () => `<ul><li><b>Rhythm:</b> keep it simple, with durations equal to or longer than the beat.</li>
      <li><b>Non-chord tones:</b> use them carefully (if at all), favoring passing tones, neighbor tones and suspensions, and resolve them properly.</li>
      <li><b>Contour:</b> mostly conjunct (stepwise) motion, with a single climax.</li>
      <li><b>Leaps:</b> avoid augmented intervals, 7ths and anything larger than an octave. Diminished intervals are OK if the line changes direction by step right after. Approach and leave a leap larger than a P4 in the opposite direction. Smaller leaps in the same direction should outline a triad.</li></ul>` },
    { title: "Spacing and doubling", kick: "Building each chord", keyed: "both", render: (H, k, U) => `<ul><li><b>Spacing and crossing:</b> no voice crosses above the soprano or below the bass; keep adjacent upper voices (S–A, A–T) within an octave.</li>
      <li><b>Never omit</b> the root or 3rd. <b>Never double</b> 7̂: it makes parallel octaves when it resolves to 1̂.</li>
      <li><b>Root position:</b> double the root, unless that causes poor voice-leading; then the 5th.</li><li><b>First inversion:</b> avoid doubling the bass (the 3rd).</li><li><b>Second inversion:</b> double the bass (the 5th).</li></ul>
      <div class="lfigs">${errFig(H, U, k, "dbl", "Doubled leading tone")}${errFig(H, U, k, "space", "Upper voices too far apart")}${errFig(H, U, k, "cross", "Voice crossing")}</div>` },
    { title: "Tendency tones", kick: "Where notes want to go", keyed: "both", render: (H, k, U) => `<p>Resolve tendency tones by step whenever possible, especially in the soprano: <b>7̂ up to 8̂</b> and <b>4̂ down to 3̂</b>. <b>Chordal 7ths resolve down</b>, especially in an upper voice.</p>
      <div class="lfigs">${errFig(H, U, k, "lt", "The leading tone in the soprano doesn't resolve")}${errFig(H, U, k, "sev", "The chordal 7th doesn't resolve down")}</div>` },
    { title: "Parallels and direct intervals", kick: "Keeping voices independent", keyed: "both", render: (H, k, U) => `<ul><li>Avoid <b>parallel perfect unisons, octaves and 5ths</b>. Parallel 4ths between inner voices are fine, but not between the outer voices (they make parallel ⁶₄ chords).</li>
      <li><b>Consecutive 5ths and octaves</b> by contrary motion are avoided too (though often allowed at cadences).</li>
      <li>Avoid <b>direct</b> (hidden) 5ths and octaves: the outer voices move the same way into a P5 or P8 with a leap in the soprano. It sounds like parallels.</li></ul>
      <div class="lfigs">${errFig(H, U, k, "par5", "Parallel 5ths")}${errFig(H, U, k, "par8", "Parallel octaves")}${errFig(H, U, k, "dir", "Direct 5th or octave")}</div>` },
    { title: "Root-position triads", kick: "Easy steps", keyed: "both", render: (H, k, U) => `<p>The main principle: <b>move each voice to the next chord tone by the smallest interval possible, favoring contrary motion.</b></p>
      <div class="lfigs">${sf(H, U, k, ["1", "4", "1", "5", "1"], "<b>Roots a 4th or 5th apart:</b> keep the common tone in the same voice; move the others to the nearest chord tones (keep chords complete).")}${sf(H, U, k, ["4", "5", "6"], "<b>Roots a 2nd apart:</b> move the upper voices in contrary motion to the bass. When the bass moves up a step, one voice may move in parallel 3rds (10ths) with it, doubling the 3rd of the second chord.")}${sf(H, U, k, ["1", "6", "4"], "<b>Roots a 3rd apart:</b> keep the two common tones; move the remaining voice to the nearest chord tone.")}</div>` },
    { title: "Resolving V⁷", kick: "Five possibilities", keyed: "both", render: (H, k, U) => `<p>A 7th chord resolving by root motion down a 5th (V⁷–I, ii⁷–V, V⁷/V–V) is the hardest progression to write without parallels. Its two tendency tones: the <b>7th</b> (resolve down by step) and the <b>3rd</b> (resolve up by step, always when it's in the soprano). Following them leads to five possibilities:</p>
      <div class="lfigs">${v7fig(H, U, k, "inc", "<b>Incomplete V⁷</b> (no 5th)")}${v7fig(H, U, k, "frus", "<b>Frustrated 3rd</b>: the leading tone, in an inner voice, drops to the 5th of I")}${v7fig(H, U, k, "trip", "<b>Tripled root</b> in I (no 5th)")}${v7fig(H, U, k, "dbl", "<b>Doubled root and 3rd</b> in I (no 5th)")}${v7fig(H, U, k, "par", "<b>Parallel 5ths</b>: the only way from complete V⁷ to complete I, so it's avoided")}</div>` },
    { title: "V⁷ in inversion, and vii°⁷", kick: "Follow the tendency tones", keyed: "both", render: (H, k, U) => `<p><b>V⁶₅</b> and <b>V⁴₃</b> are easy to resolve if you follow the tendency tones. <b>V⁴₂</b> is almost always followed by <b>I⁶</b>, because its 7th (in the bass) resolves down.</p>
      <div class="lfigs">${sf(H, U, k, ["1", "565", "1"], "V⁶₅ – I")}${sf(H, U, k, ["1", "543", "1"], "V⁴₃ – I")}${sf(H, U, k, ["1", "542", "16"], "V⁴₂ – I⁶")}</div>
      ${k.mode === "minor" ? `<p>The <b>vii°⁷–i</b> progression has no complications in any position, since vii°⁷ has no perfect 5th. Resolve each tendency tone to the nearest chord tone, minding 7̂ and 4̂.</p><div class="lfigs">${sf(H, U, k, ["1", "77", "1"], "vii°⁷ – i")}${sf(H, U, k, ["16", "765", "1"], "vii°⁶₅ – i")}</div>` : `<p>Switch to a minor key to see <b>vii°⁷–i</b>: with no perfect 5th in vii°⁷, it resolves without complications in any position.</p>`}` },
    { title: "Quick check", kick: "Before the drills", render: (H) => [FACTS[6], FACTS[8], FACTS[16], FACTS[19]].map(([q, a, w, y]) => H.check(q, a, w, y)).join("") },
  ] };

  return {
    key: "silverapps-partwriting-v1", lesson, make, reference,
    modes: [{ id: "error", kicker: "Find the error" }, { id: "double", kicker: "Doubling" }, { id: "tend", kicker: "Tendency tones" }, { id: "v7", kicker: "Resolving V⁷" }, { id: "princ", kicker: "Principles" }],
    topics: [],
  };
})();
