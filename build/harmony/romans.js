window.FAM = (() => {
  // ===== Introduction to Roman Numeral Analysis (lesson + drills). Engine: build/harmony/engine.js =====
  const tbl = (cap, head, rows) => `<div class="ltable-wrap" tabindex="0" role="region" aria-label="${cap}"><table class="ltable"><caption>${cap}</caption><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  const ok = c => c.tones.every(n => Math.abs(n.a) < 2);
  const majOf = (H, k) => H.key(k.name, "major");
  // chromatic chord on a degree of the parallel major, with an accidental on the root
  function cc(H, k, acc, d, q, rn, inv = 0) { const r = H.deg(majOf(H, k), d), c = H.chord(H.N(r.l, r.a + acc, 4), q, inv); c.rn = rn; return c; }
  // applied chord: V, V7 or vii°7 of the diatonic chord on degree d
  function app(H, k, d, kind, rn, inv = 0) { const T = H.deg(k, d), c = kind === "lt" ? H.chord(H.down(T, 1, 1), "o7", inv) : H.chord(H.up(T, 4, 7), kind, inv); c.rn = rn; return c; }
  const MAJRN = ["I", "ii", "iii", "IV", "V", "vi", "vii°"];
  // chromatic chords in a major key: [acc, degree, quality, numeral, kind]
  const CHROM = [[-1, 3, "M", "♭III", "borrowed from the parallel minor"], [0, 4, "m", "iv", "borrowed from the parallel minor"], [-1, 6, "M", "♭VI", "borrowed from the parallel minor"], [-1, 7, "M", "♭VII", "borrowed from the parallel minor"], [0, 1, "m", "i", "borrowed from the parallel minor"], [0, 5, "m", "v", "borrowed from the parallel minor"], [-1, 2, "M", "♭II", "the Neapolitan (lowered supertonic)"], [0, 3, "M", "III", "a chromatic mediant (or V/vi)"], [0, 6, "M", "VI", "a chromatic mediant (or V/ii)"]];
  const APPL = [[2, "7", "V7/ii"], [4, "7", "V7/IV"], [5, "7", "V7/V"], [6, "7", "V7/vi"], [5, "M", "V/V"], [6, "M", "V/vi"], [5, "lt", "vii°7/V"], [2, "M", "V/ii"]];
  function chromSet(H, k) {
    const out = CHROM.map(([a, d, q, rn, why]) => Object.assign(cc(H, k, a, d, q, rn), { why }));
    APPL.forEach(([d, kind, rn]) => out.push(Object.assign(app(H, k, d, kind, rn), { why: rn.startsWith("vii") ? `the leading-tone 7th chord of ${MAJRN[d - 1]}` : `the dominant of ${MAJRN[d - 1]} (an applied, or secondary, dominant)` })));
    return out;
  }
  // minor-key diatonic chords: [degree, quality, classical numeral, major-referenced numeral, note]
  const MINT = [[1, "m", "i", "i", ""], [2, "d", "ii°", "ii°", ""], [3, "M", "III", "♭III", "built on the lowered 3rd of the parallel major"], [4, "m", "iv", "iv", ""], [5, "m", "v", "v", "natural minor"], [5, "M", "V", "V", "raised 7th (harmonic minor)"], [6, "M", "VI", "♭VI", ""], [7, "M", "VII", "♭VII", "natural 7th: the subtonic"], [7, "d", "vii°", "vii°", "raised 7th: the leading tone"]];
  function minChord(H, k, d, q) { const r = d === 7 && q === "d" ? H.up(H.deg(k, 7), 0, 1) : H.deg(k, d); return H.chord(r, q); }
  const PROGS = { major: [["1", "6", "4", "5"], ["1", "4", "5", "1"], ["2", "5", "1"], ["1", "5", "6", "4"], ["6", "4", "1", "5"], ["1", "26", "57", "1"]], minor: [["1", "4", "5", "1"], ["1", "6", "4", "5"], ["1", "7", "6", "5"], ["1", "26", "57", "1"]] };
  // minor-progression tokens 6 and 7 mean VI and VII (natural) in drills; the engine's diatonic 7 in minor is vii°, so build them by hand
  function pTok(H, k, t) {
    if (k.mode === "minor" && t === "7") { const c = H.chord(H.deg(k, 7), "M"); c.rn = "VII"; return c; }
    return H.tok(k, t);
  }

  const FACTS = [
    ["An uppercase Roman numeral (like IV) shows…", "a major triad", ["a minor triad", "a diminished triad", "a chord in first inversion"], "Uppercase = major, lowercase = minor; ° = diminished, + = augmented."],
    ["In any major key, which triads are minor?", "ii, iii and vi", ["I, IV and V", "ii, IV and vi", "iii, vi and vii°"], "Major keys: I ii iii IV V vi vii°."],
    ["A Roman numeral names a chord by…", "the scale degree of its root, in a particular key", ["its lowest note", "its letter name", "how many notes it has"], "The same chord (say, G major) is V in C, IV in D and I in G."],
    ["When a progression is transposed to a new key, its Roman numerals…", "stay the same", ["all move up a step", "change to lowercase", "need new accidentals"], "Every chord moves by the same interval, so each root keeps its distance from the new tonic."],
    ["In C minor, the A♭ major triad is labeled VI in one system and ♭VI in the other. The ♭VI system measures roots against…", "the major scale on the same tonic", ["the key signature", "the relative major", "the circle of fifths"], "Major-referenced numerals use one yardstick for every key and mode: the major scale. ♭VI means 'a half step below the 6th degree of major'."],
    ["V/V (\"five of five\") is…", "the dominant of the dominant: in C, D (or D7)", ["the fifth chord twice: G then G", "a chord built on the 5th of V", "a borrowed chord"], "Applied (secondary) chords borrow the dominant of a chord other than the tonic."],
    ["In C major, A♭ major is labeled…", "♭VI", ["vi", "♯V", "VI"], "Its root is a half step below A, the 6th degree of C major; uppercase because it's major. It's borrowed from C minor."],
    ["The Neapolitan chord is labeled…", "♭II (usually ♭II⁶, in first inversion)", ["N7", "ii°", "♯I"], "A major triad on the lowered 2nd degree: D♭ major in C."],
    ["V⁶₅ means…", "a dominant 7th chord with its 3rd in the bass", ["a V chord with an added 6th and 5th", "a dominant chord in 6/5 time", "a V chord with its 5th in the bass"], "Seventh-chord figures: 7 (root), ⁶₅ (3rd), ⁴₃ (5th), ⁴₂ (7th in the bass)."],
    ["Why might a minor-key analysis show both VII and vii°?", "they're built on different 7th degrees: the subtonic and the raised leading tone", ["it's a mistake", "one is a seventh chord", "one is in a different key"], "In A minor, VII = G major (natural 7th) and vii° = G♯ diminished (raised 7th)."],
    ["In jazz and lead sheets, the ii–V–I in C (Dm7–G7–C△7) is often written…", "ii⁷–V⁷–I△⁷ (or IIm7–V7–I△7)", ["2–5–1 in figured bass", "i–v–i", "IV–V–I"], "Jazz often uses uppercase numerals with chord-symbol suffixes; classical analysis uses case for quality."],
    ["In C major, the chord E–G♯–B–D is…", "V7/vi", ["V7/iii", "III7 borrowed", "vi7"], "It's the dominant 7th of A minor (vi)."],
  ];

  function make(mode, H) {
    if (mode === "name" || mode === "build") {
      const k = H.randKey(["major", "minor"]), toks = k.mode === "major" ? ["1", "2", "3", "4", "5", "6", "7", "57", "27", "16", "46", "56", "565", "543", "765"] : ["1", "26", "4", "5", "6", "57", "77", "16", "46", "56", "565", "4"];
      const t = H.rnd(toks), c = H.tok(k, t), others = toks.filter(x => x !== t).map(x => H.tok(k, x));
      if (mode === "name") return H.mc(`In ${k.label}, which Roman numeral labels {sym:${c.sym}}?`, c.rn, others.map(o => o.rn), `{sym:${c.sym}} (${c.tones.map(H.nm).join("–")}) has its root on scale degree ${c.deg}${c.bass ? `, with its ${["root", "3rd", "5th", "7th"][c.bass]} in the bass` : ""}: {rn:${c.rn}}.`, { kicker: "Name the chord", fmt: "rn", topic: "dia" });
      return H.mc(`In ${k.label}, which chord is {rn:${c.rn}}?`, c.sym, others.map(o => o.sym), `Count up to scale degree ${c.deg} (${H.nm(c.tones[0])}) and build the chord in the key: ${c.tones.map(H.nm).join("–")}.`, { kicker: "Build the chord", fmt: "sym", topic: "dia" });
    }
    if (mode === "chrom") {
      let k, set; for (let i = 0; i < 30; i++) { k = H.randKey(["major"]); set = chromSet(H, k); if (set.every(ok)) break; }
      const c = H.rnd(set), wr = set.filter(x => x.rn !== c.rn && x.sym !== c.sym).map(x => x.rn).concat(MAJRN);
      if (Math.random() < .5) return H.mc(`In ${k.label}, which Roman numeral labels {sym:${c.sym}}?`, c.rn, wr, `{sym:${c.sym}} (${c.tones.map(H.nm).join("–")}) is ${c.why}: {rn:${c.rn}}.`, { kicker: "Chromatic numerals", fmt: "rn", topic: "chr" });
      return H.mc(`In ${k.label}, which chord is {rn:${c.rn}}?`, c.sym, set.filter(x => x.sym !== c.sym).map(x => x.sym), `{rn:${c.rn}} is ${c.why}: ${c.tones.map(H.nm).join("–")}.`, { kicker: "Chromatic numerals", fmt: "sym", topic: "chr" });
    }
    if (mode === "minor") {
      const k = H.randKey(["minor"]), [d, q, cl, mj, note] = H.rnd(MINT.filter(m => m[2] !== m[3] || Math.random() < .3)), c = minChord(H, k, d, q), sys = Math.random() < .5 ? "cl" : "mj";
      const ans = sys === "cl" ? cl : mj, pool = ["i", "ii°", "III", "♭III", "iii", "iv", "v", "V", "VI", "♭VI", "vi", "VII", "♭VII", "vii°"];
      const sysName = sys === "cl" ? "numerals relative to the minor scale (III, VI, VII)" : "numerals relative to the major scale on the same tonic (♭III, ♭VI, ♭VII)";
      return H.mc(`In ${k.label}, using ${sysName}, how is {sym:${c.sym}} labeled?`, ans, pool, `${c.tones.map(H.nm).join("–")} is built on degree ${d}${note ? ` (${note})` : ""}. Minor-scale numerals: {rn:${cl}}; major-referenced: {rn:${mj}}.`, { kicker: "Numerals in minor", fmt: "rn", topic: "min" });
    }
    if (mode === "trans") {
      const m = Math.random() < .7 ? "major" : "minor", p = H.rnd(PROGS[m]), a = H.randKey([m]); let b; do b = H.randKey([m]); while (b.name === a.name);
      const sy = k => p.map(t => pTok(H, k, t).sym), rns = p.map(t => pTok(H, a, t).rn);
      const right = sy(b).join(" – ");
      const wrong = new Set();
      H.KEYS[m].filter(n => n !== b.name && n !== a.name).forEach(n => wrong.add(sy(H.key(n, m)).join(" – ")));
      const shifted = sy(b).slice(); shifted[shifted.length - 1] = sy(a)[sy(a).length - 1]; wrong.add(shifted.join(" – "));
      const pick = H.shuffle([...wrong]).filter(w => w !== right).slice(0, 3);
      if (Math.random() < .5) return H.mc(`In ${a.label}, a progression is ${sy(a).map(s => `{sym:${s}}`).join(" – ")}. What is the same progression in ${b.label}?`, right, pick, `Its numerals are ${rns.map(r => `{rn:${r}}`).join(" – ")}. Build the same numerals in ${b.label}: ${sy(b).map(s => `{sym:${s}}`).join(" – ")}.`, { kicker: "Transposition", fmt: "sym", topic: "trans" });
      const wr = new Set(); for (let i = 0; i < 8; i++) { const alt = rns.slice(); const j = Math.floor(Math.random() * alt.length); alt[j] = H.rnd(m === "major" ? ["I", "ii", "iii", "IV", "V", "vi", "V7", "I6"] : ["i", "iv", "V", "VI", "VII", "III", "V7"]); if (alt.join() !== rns.join()) wr.add(alt.join(" – ")); }
      return H.mc(`What are the Roman numerals of ${sy(b).map(s => `{sym:${s}}`).join(" – ")} in ${b.label}?`, rns.join(" – "), [...wr], `Measured from ${H.nm(b.tonic)}: ${rns.map(r => `{rn:${r}}`).join(" – ")}. The same numerals describe this progression in every ${m} key.`, { kicker: "Transposition", topic: "trans" });
    }
    const [q, a, w, y] = H.rnd(FACTS);
    return H.mc(q, a, w, y, { kicker: "Concepts" });
  }

  function reference() {
    return tbl("Roman numeral symbols", ["Symbol", "Meaning", "Example in C major"], [
      ["Uppercase / lowercase", "major / minor triad", "{rn:IV} = F; {rn:ii} = Dm"], ["°  ø  +", "diminished, half-diminished, augmented", "{rn:vii°} = B°; {rn:viiø7} = Bø7"],
      ["⁶, ⁶₄", "triad inversions (3rd, 5th in the bass)", "{rn:I6} = C/E; {rn:I64} = C/G"], ["⁷, ⁶₅, ⁴₃, ⁴₂", "seventh chord: root, 3rd, 5th, 7th in the bass", "{rn:V65} = G7/B"],
      ["♭ or ♯ before the numeral", "root lowered or raised from the major scale", "{rn:♭VI} = A♭; {rn:♭VII} = B♭"], ["/", "applied (secondary): 'of'", "{rn:V7/V} = D7; {rn:vii°7/V} = F♯°7"]])
      + `<p class="legend">In minor, numerals are either relative to the minor scale (i ii° III iv v/V VI VII vii°) or to the major scale on the same tonic (i ii° ♭III iv v/V ♭VI ♭VII vii°).</p>`;
  }

  const sf = (H, U, k, toks, cap, o) => H.satbFig(U, k, toks, cap, o);
  const lesson = { defMode: "major", steps: [
    { title: "What Roman numerals show", kick: "Chords by scale degree", keyed: "both", render: (H, k, U) => {
      const ds = [1, 2, 3, 4, 5, 6, 7].map(d => k.mode === "minor" && d === 7 ? H.tok(k, "7") : H.tok(k, String(d)));
      return `<p><b>Roman numeral analysis</b> labels each chord by the <b>scale degree of its root</b> in the current key. The numeral's form shows the chord's quality:</p>
      <ul><li><b>Uppercase</b> (I, IV, V): major triad. <b>Lowercase</b> (ii, iii, vi): minor triad.</li><li><b>°</b> (vii°): diminished triad. <b>+</b> (III+): augmented triad.</li></ul>
      ${tbl(`Triads in ${k.label}`, ["Degree", "Numeral", "Chord", "Notes"], ds.map((c, i) => [i + 1, `{rn:${c.rn}}`, `{sym:${c.sym}}`, c.tones.map(H.nm).join("–")]))}
      ${sf(H, U, k, k.mode === "major" ? ["1", "4", "2", "5", "6", "3", "4", "5", "1"] : ["1", "4", "26", "5", "6", "4", "5", "1"], "Diatonic chords in four voices", { small: false })}
      <p>In <b>major</b> keys the pattern is always I ii iii IV V vi vii°. ${k.mode === "minor" ? "In <b>minor</b> it depends on which form of the scale a chord uses; the raised 7th degree makes V major and vii° diminished, as here. (See <i>Numerals in minor</i>.)" : "Switch to minor above to see how the pattern changes."}</p>`
      + H.check(`In ${k.label}, what is {sym:${ds[3].sym}}?`, ds[3].rn, ds.filter((_, i) => i !== 3).map(c => c.rn), "It's built on the 4th scale degree.", "rn"); } },
    { title: "Why numerals?", kick: "Relationships, not letter names", render: () => `<p>A chord symbol such as {sym:G7} tells a player <i>what</i> to play. A Roman numeral tells a musician <i>what the chord does</i> in the key: {sym:G7} is {rn:V7} in C major (it pulls home to C), {rn:IV7} in D major, and {rn:♭VII7} in A major. The numeral captures the relationship to the tonic, and that relationship is what we hear as function.</p>
      ${tbl("Three ways to write the same progression in C major", ["System", "Progression", "Used by"], [["Chord symbols", "{sym:C} – {sym:Am} – {sym:F} – {sym:G7}", "lead sheets, guitar charts"], ["Roman numerals", "{rn:I} – {rn:vi} – {rn:IV} – {rn:V7}", "analysis in every style"], ["Nashville numbers", "1 – 6m – 4 – 5⁷", "session players, especially in country music"]])}
      <ul><li>Numerals make patterns visible: a cadence, a circle of fifths, or a loop looks the same in every key.</li><li>They help you hear: once you know the sound of {rn:IV}–{rn:V}–{rn:I}, you can recognize it anywhere.</li><li>They make transposing, improvising and arranging faster.</li></ul>
      <p>Roman numerals for chords became standard in the 19th century; Gottfried Weber's writing in the 1810s and 1820s spread the use of uppercase and lowercase numerals for chord quality.</p>` },
    { title: "Inversions and seventh chords", kick: "Figures after the numeral", keyed: "major", render: (H, k, U) => `<p>Small numbers after the numeral (borrowed from figured bass) show which chord tone is in the bass:</p>
      ${tbl("Inversion figures", ["Bass note", "Triad", "Seventh chord"], [["root", "{rn:V} (no figure; ⁵₃)", "{rn:V7}"], ["3rd", "{rn:V6}", "{rn:V65}"], ["5th", "{rn:V64}", "{rn:V43}"], ["7th", "–", "{rn:V42}"]])}
      <p>Seventh chords add signs for the 7th's quality: {rn:V7} (major triad, minor 7th: dominant 7th), {rn:ii7} (minor 7th), {rn:viiø7} (half-diminished), {rn:vii°7} (fully diminished), and I△7 or IV△7 (major 7th; some books write IM7).</p>
      ${sf(H, U, k, ["1", "16", "265", "57", "1"], `I – I⁶ – ii⁶₅ – V⁷ – I in ${k.label}`, { small: false })}`
      + H.check("Which figure means a seventh chord with its 5th in the bass?", "⁴₃", ["⁶₅", "⁴₂", "⁶₄"], "⁷ root, ⁶₅ 3rd, ⁴₃ 5th, ⁴₂ 7th.") },
    { title: "Numerals in minor", kick: "Two systems", keyed: "minor", render: (H, k, U) => {
      const rows = MINT.map(([d, q, cl, mj, note]) => { const c = minChord(H, k, d, q); return [d, `{sym:${c.sym}}`, `{rn:${cl}}`, `{rn:${mj}}`, note]; });
      return `<p>In minor, the 3rd, 6th and 7th degrees are a half step lower than in major. There are two common ways to label the chords built on them:</p>
      <ol><li><b>Relative to the minor scale</b> (common in classical theory books): count degrees of the minor key itself. Chords on the 3rd, 6th and 7th degrees are simply <b>III, VI, VII</b>; an accidental is written only when a chord's root is altered from the minor scale (like ♭II, the Neapolitan).</li>
      <li><b>Relative to the major scale</b> (common in pop, rock and jazz, and in some textbooks): every key and mode is measured against the major scale on the same tonic, so those chords are <b>♭III, ♭VI, ♭VII</b>.</li></ol>
      ${tbl(`Chords in ${k.label}`, ["Degree", "Chord", "Relative to minor", "Relative to major", "Note"], rows)}
      <ul><li>The first system keeps numerals short and matches the key signature. Watch out for the 7th degree: {rn:VII} (subtonic, natural 7th) and {rn:vii°} (leading tone, raised 7th) have roots a half step apart.</li>
      <li>The second system means one numeral always means one chord relative to the tonic: {rn:♭VI} is the same chord in C major and C minor, which makes borrowing between modes easy to see.</li>
      <li>Both systems agree on i, ii°, iv, v, V and vii°. Pick one and use it consistently; the Chord Progression Lab lets you switch between them.</li></ul>
      ${sf(H, U, k, ["1", "6", "4", "5", "1"], `i – VI (♭VI) – iv – V – i in ${k.label}`, { small: false })}`
      + H.check(`In ${k.label}, using numerals relative to the major scale, how is the chord on the 7th degree of natural minor labeled?`, "♭VII", ["VII", "vii°", "♯VII"], "It's a major triad a whole step below the tonic: ♭VII.", "rn"); } },
    { title: "Transposition", kick: "The numerals don't change", keyed: "both", render: (H, k, U) => {
      const p = k.mode === "major" ? ["1", "6", "4", "5", "1"] : ["1", "4", "5", "1"], keys = H.KEYS[k.mode].slice(0, 6);
      const rns = p.map(t => H.tok(k, t).rn);
      return `<p>To <b>transpose</b> is to move every note by the same interval. Each chord's root keeps the same distance from the tonic, and each chord keeps its quality, so <b>the Roman numerals stay exactly the same</b>. Only the letter names change.</p>
      ${tbl(`${rns.join(" – ")} in several keys`, ["Key", "Chords", "Numerals"], keys.map(n => { const kk = H.key(n, k.mode); return [kk.label, p.map(t => `{sym:${H.tok(kk, t).sym}}`).join(" – "), rns.map(r => `{rn:${r}}`).join(" – ")]; }))}
      ${sf(H, U, k, p, `${rns.join(" – ")} in ${k.label}: choose another key above and listen`, { small: false })}
      <p>This is why numerals are so useful: learn a progression once, and you can play it, recognize it, or write it in any key. A singer who needs a song lower can ask for it "down a whole step", and a band that thinks in numbers just plays the same numbers from a new tonic.</p>`
      + H.check(`I–IV–V–I in G major is G–C–D–G. What is it in E♭ major?`, "E♭–A♭–B♭–E♭", ["E♭–A–B♭–E♭", "E♭–A♭–B–E♭", "E♭–F–G–E♭"], "Same numerals from the new tonic: I = E♭, IV = A♭, V = B♭."); } },
    { title: "Chromatic numerals", kick: "Accidentals before the numeral", keyed: "major", render: (H, k, U) => {
      const set = chromSet(H, k), b = set.slice(0, 6);
      return `<p>Chords with notes outside the key get numerals too. An <b>accidental before the numeral</b> shows that the root is lowered (♭) or raised (♯) from the major scale; case and quality signs work as usual. (♭ means "lowered", even in sharp keys where the actual note may carry a natural.)</p>
      <p><b>Borrowed chords</b> (mode mixture) come from the parallel minor:</p>
      ${tbl(`Borrowed chords in ${k.label}`, ["Numeral", "Chord", "Notes"], b.map(c => [`{rn:${c.rn}}`, `{sym:${c.sym}}`, c.tones.map(H.nm).join("–")]))}
      ${sf(H, U, k, ["1", cc(H, k, -1, 6, "M", "♭VI"), cc(H, k, -1, 7, "M", "♭VII"), "1"], `I – ♭VI – ♭VII – I in ${k.label}`, { small: false })}
      ${sf(H, U, k, ["1", "4", cc(H, k, 0, 4, "m", "iv"), "1"], `I – IV – iv – I`, { small: false })}`
      + H.check(`In ${k.label}, how is {sym:${b[3].sym}} labeled?`, "♭VII", ["vii°", "VII", "♭vii"], "A major triad on the lowered 7th degree.", "rn"); } },
    { title: "Applied chords", kick: "V of V and friends", keyed: "major", render: (H, k, U) => {
      const rows = [[2, "7", "V7/ii"], [3, "7", "V7/iii"], [4, "7", "V7/IV"], [5, "7", "V7/V"], [6, "7", "V7/vi"], [5, "lt", "vii°7/V"], [6, "lt", "vii°7/vi"]].map(([d, kind, rn]) => { const c = app(H, k, d, kind, rn); return [`{rn:${rn}}`, `{sym:${c.sym}}`, `${MAJRN[d - 1]} = {sym:${H.tok(k, String(d)).sym}}`]; });
      return `<p>An <b>applied</b> (or <b>secondary</b>) chord acts as the dominant or leading-tone chord of a chord other than the tonic. The slash reads "of": {rn:V7/V} is "five-seven of five", the dominant 7th of the dominant.</p>
      ${tbl(`Applied chords in ${k.label}`, ["Numeral", "Chord", "Resolves to"], rows)}
      ${sf(H, U, k, ["1", app(H, k, 5, "7", "V7/V", 1), "5", "1"], `I – V⁶₅/V – V – I`, { small: false })}
      ${sf(H, U, k, ["1", app(H, k, 6, "7", "V7/vi"), "6", app(H, k, 2, "7", "V7/ii"), "2", "57", "1"], `I – V⁷/vi – vi – V⁷/ii – ii – V⁷ – I`, { small: false })}
      <p>There's no V/I (that's just V) and no V/vii° (a diminished chord can't act as a temporary tonic). Learn more in the <a href="secondary-function-chords-lesson.html">Secondary Function Chords</a> lesson.</p>`
      + H.check(`In ${k.label}, what is {sym:${app(H, k, 5, "7", "V7/V").sym}}?`, "V7/V", ["V7/ii", "II7", "V7/vi"], "It's the dominant 7th of V.", "rn"); } },
    { title: "More chromatic labels", kick: "♭II, augmented sixths, mediants", render: () => tbl("Other chromatic chords (examples in C major)", ["Label", "Chord", "What it is"], [
        ["{rn:♭II6}", "{sym:D♭/F}", "the <b>Neapolitan</b>: a major triad on the lowered 2nd degree, usually in first inversion, going to V"],
        ["It+6, Fr+6, Ger+6", "A♭–C–F♯, A♭–C–D–F♯, A♭–C–E♭–F♯", "<b>augmented sixth chords</b>: ♭6̂ and ♯4̂ expand outward to the octave on 5̂"],
        ["{rn:III}, {rn:VI}, {rn:♭III}, {rn:♭VI}", "{sym:E}, {sym:A}, {sym:E♭}, {sym:A♭}", "<b>chromatic mediants</b>: roots a 3rd from the tonic, same quality, one common tone"],
        ["{rn:II}", "{sym:D}", "a major II: in pop often used without resolving to V (when it does resolve, it's V/V)"],
        ["{rn:♭VII}", "{sym:B♭}", "subtonic, very common in rock (♭VII–IV–I)"],
        ["{rn:V+}", "{sym:G+}", "augmented dominant: the raised 5th pushes up to the 3rd of I"]])
      + `<p>These are covered in depth in <a href="chromatic-chords-lesson.html">Chromatic Chords</a>. The idea is always the same: find the root, measure it from the tonic, and show the quality.</p>` },
    { title: "Pop and jazz conventions", kick: "Numerals on lead sheets", render: () => `<p>Outside classical analysis, Roman numerals often borrow chord-symbol suffixes:</p>
      ${tbl("Common variants", ["Style", "ii–V–I in C", "Notes"], [["Classical analysis", "{rn:ii7} – {rn:V7} – I△7", "case shows quality; figures show inversions"], ["Jazz (all uppercase)", "IIm7 – V7 – I△7", "uppercase numerals with suffixes, as in many jazz texts"], ["Pop and rock", "ii – V – I, I/3, ♭VII, IVadd9", "slash numbers show the bass (I/3 = I with its 3rd in the bass)"], ["Nashville numbers", "2m – 5 – 1", "plain numbers; minor, 7ths and extensions as suffixes"]])}
      <p>In pop and rock, "I7" usually means a dominant 7th on the tonic (as in the blues), while classical analysis would write it as {rn:V7/IV} when it leads to IV. Context tells you which convention a writer is using.</p>` },
    { title: "Try it: the Chord Progression Lab", kick: "Build, voice and groove", render: () => `<p>The <a href="chord-progression-lab.html"><b>Chord Progression Lab</b></a> lets you build progressions from diatonic, borrowed, applied and other chromatic numerals, choose voicings (close, open, drop 2, shell, rootless, quartal, power chords, clusters), add accompaniment patterns, a bass line and a drum beat, transpose to any key with one menu, switch between the two minor-key systems, and export audio.</p>
      <p>Try this: load a preset, then change the key. The numerals stay put while every chord symbol changes. Then swap one diatonic chord for a borrowed one (IV → iv, or vi → ♭VI) and listen to the change in color.</p>` },
    { title: "Quick check", kick: "Before the drills", render: H => [0, 2, 3, 4, 6, 9].map(i => { const [q, a, w, y] = FACTS[i]; return H.check(q, a, w, y); }).join("") },
  ] };

  return {
    key: "silverapps-romans-v1", lesson, make, reference,
    modes: [{ id: "name", kicker: "Name the chord" }, { id: "build", kicker: "Build the chord" }, { id: "minor", kicker: "Numerals in minor" }, { id: "chrom", kicker: "Chromatic numerals" }, { id: "trans", kicker: "Transposition" }, { id: "concepts", kicker: "Concepts" }],
    topics: [],
  };
})();
