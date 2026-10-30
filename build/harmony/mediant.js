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
