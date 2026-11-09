
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
    ["In jazz and lead sheets, the ii–V–I in C (Dm7–G7–C△7) is often written…", "IIm7–V7–I△7", ["2–5–1 in figured bass", "i–v–i", "IV–V–I"], "Jazz often uses uppercase numerals with chord-symbol suffixes. Classical analysis would write ii⁷–V⁷–I⁷, using case for quality and no △."],
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
  // a Nashville chord chart: lines of bars; "4 5⁷" = split bar (underlined), "◇4" = diamond (let ring)
  function nchart(lines, head, f = x => x) {
    const bar = b => { const parts = b.split(" "), split = parts.length > 1;
      const one = x => x.startsWith("◇") ? `<span class="nch-dia">${f(x.slice(1))}</span><span class="sr"> (diamond: hit and let ring)</span>` : f(x);
      return `<span class="nch-bar${split ? " split" : ""}">${parts.map(one).join(" ")}${split ? '<span class="sr"> (split bar)</span>' : ""}</span>`; };
    return `<div class="nchart"><div class="nch-head">${head.map(h => `<span>${h}</span>`).join("")}</div>${lines.map(([sec, bars]) => `<div class="nch-line" style="grid-template-columns: 2em repeat(${bars.length}, 1fr)">${sec ? `<span class="nch-sec"><span class="sr">${sec === "V" ? "Verse" : "Chorus"}: </span><span aria-hidden="true">${sec}</span></span>` : '<span class="nch-sec" aria-hidden="true"></span>'}${bars.map(bar).join("")}</div>`).join("")}</div>`;
  }
  // like sf, but every seventh chord keeps all four tones (no omitted 5th)
  const full = (x, H) => x.vs.every((v, j) => x.chords[j].tones.length < 4 || new Set([v.S, v.A, v.T, v.B].map(H.pc)).size === 4);
  function sfFull(H, U, k, toks, cap, o = {}) {
    for (let i = 0; i < 60; i++) { const x = H.voiceToks(k, toks, o); if (x && full(x, H)) return U.fig(H.satbSpec(x, o), cap, { small: o.small !== false, play: H.satbPlay(x.vs, o.gap || .9) }); }
    return sf(H, U, k, toks, cap, Object.assign({}, o, { full: false }));
  }
  // ===== Groove player (hookpad / time-unit-box style): palette of diatonic chords, bass-tone and 7th choice, styles, meters, instruments, editable beat =====
  const FIG3 = ["", "6", "64"], FIG7 = ["7", "65", "43", "42"], BASSN = ["Root", "3rd", "5th", "7th"];
  // minor palette: [id, degree, triad quality, seventh quality, minor-scale numeral, major-referenced numeral, raised root]
  const MINP = [["i", 1, "m", "m7", "i", "i"], ["ii°", 2, "d", "h7", "ii°", "ii°"], ["III", 3, "M", "M7", "III", "♭III"], ["iv", 4, "m", "m7", "iv", "iv"], ["v", 5, "m", "m7", "v", "v"], ["V", 5, "M", "7", "V", "V"], ["VI", 6, "M", "M7", "VI", "♭VI"], ["VII", 7, "M", "7", "VII", "♭VII"], ["vii°", 7, "d", "o7", "vii°", "vii°", 1]];
  const PBDEF = { major: [{ d: 1, b: 0, s: 0 }, { d: 6, b: 0, s: 0 }, { d: 2, b: 1, s: 1 }, { d: 5, b: 0, s: 1 }], minor: [{ id: "i", b: 0, s: 0 }, { id: "VI", b: 0, s: 0 }, { id: "iv", b: 1, s: 0 }, { id: "V", b: 0, s: 1 }] };
  const PBKEY = "silverapps-romans-groove", PBMAX = 8;
  // meters on a 16th-note grid: n pulses per bar, beat starts, felt-beat (group) starts, counting syllables
  const METERS = {
    "2/4": { n: 8, beats: [0, 4], felt: [0, 4] }, "3/4": { n: 12, beats: [0, 4, 8], felt: [0, 4, 8] }, "4/4": { n: 16, beats: [0, 4, 8, 12], felt: [0, 4, 8, 12] },
    "5/4": { n: 20, beats: [0, 4, 8, 12, 16], felt: [0, 4, 8, 12, 16], groups: [0, 12] }, "6/8": { n: 12, beats: [0, 2, 4, 6, 8, 10], felt: [0, 6], comp: 1 }, "7/8": { n: 14, beats: [0, 2, 4, 6, 8, 10, 12], felt: [0, 4, 8], comp: 1 } };
  const countOf = (M, p) => { const bi = M.beats.indexOf(p); if (bi >= 0) return String(bi + 1); return M.comp ? "+" : ["", "e", "+", "a"][p % 4]; };
  const rng = (n, st) => [...Array(Math.ceil(n / st))].map((_, i) => i * st);
  const CI = { piano: "Piano", organ: "Organ", eguitar: "Clean guitar", dist: "Distortion guitar", nylon: "Nylon guitar", chip: "Chiptune square", pad: "Synth pad", marimba: "Marimba" };
  const BI = { ebass: "Electric bass", upright: "Upright bass", synth: "Synth bass", chip: "Chiptune triangle", b808: "808 bass", tuba: "Tuba" };
  const KITS = { rock: ["Kick", "Snare", "Hi-hat"], chip: ["Kick", "Noise snare", "Noise hat"], samba: ["Surdo", "Tamborim", "Shaker"], k808: ["808 kick", "Clap", "Hat"] };
  // styles: instruments, kit, tempo, preferred meter, bass-note cycle, arpeggio flag, and a pattern generator for any meter
  const STYLES = {
    ballad: { name: "Pop ballad", ci: "piano", bi: "ebass", kit: "rock", bpm: 76, meter: "4/4", seq: ["b"], gen: M => { const F = M.felt; return { chord: F, bass: F.filter((_, i) => i % 2 === 0), d: [F.filter((_, i) => i % 2 === 0), F.filter((_, i) => i % 2), rng(M.n, 2)] }; } },
    rock: { name: "Guitar rock", ci: "dist", bi: "ebass", kit: "rock", bpm: 126, meter: "4/4", seq: ["b"], gen: M => { const F = M.felt, E = rng(M.n, 2); return { chord: E, bass: E, d: [F.filter((_, i) => i % 2 === 0).concat(M.n === 16 ? [10] : []), F.filter((_, i) => i % 2), E] }; } },
    chip: { name: "Chiptune", ci: "chip", bi: "chip", kit: "chip", bpm: 144, meter: "4/4", seq: ["b", "8"], arp: 1, gen: M => { const F = M.felt, E = rng(M.n, 2); return { chord: rng(M.n, 1), bass: E, d: [F.filter((_, i) => i % 2 === 0), F.filter((_, i) => i % 2), E] }; } },
    samba: { name: "Samba", ci: "nylon", bi: "upright", kit: "samba", bpm: 100, meter: "2/4", seq: ["b", "5"], gen: M => { const F = M.felt, S = rng(M.n, 1); return { chord: S.filter(p => [0, 3, 6].includes(p % 8)), bass: [...new Set(F.concat(F.map(f => f + 3)).filter(p => p < M.n))].sort((a, b) => a - b), d: [F, S.filter(p => [0, 2, 3].includes(p % 4)), S] }; } },
    reggae: { name: "Reggae", ci: "organ", bi: "ebass", kit: "rock", bpm: 76, meter: "4/4", seq: ["b", "b", "5", "8"], gen: M => { const F = M.felt, mid = F[Math.floor(F.length / 2)] || 0; return { chord: M.beats.map(b => b + (M.comp ? 1 : 2)).filter(p => p < M.n), bass: [0, 3, 6, 10].filter(p => p < M.n), d: [[mid], [mid], rng(M.n, 2)] }; } },
    waltz: { name: "Waltz", ci: "piano", bi: "upright", kit: "rock", bpm: 132, meter: "3/4", seq: ["b", "5"], gen: M => { const F = M.felt; return { chord: F.slice(1), bass: F.filter((_, i) => i % 2 === 0 && i < F.length - (F.length % 2 ? 0 : 1)), d: [[], [], []] }; } },
    synthwave: { name: "Synthwave", ci: "pad", bi: "synth", kit: "k808", bpm: 108, meter: "4/4", seq: ["b", "8"], gen: M => { const F = M.felt, E = rng(M.n, 2); return { chord: [0], bass: E, d: [F, F.filter((_, i) => i % 2), E.filter(p => !F.includes(p))] }; } },
    marimba: { name: "Marimba groove", ci: "marimba", bi: "b808", kit: "k808", bpm: 96, meter: "6/8", seq: ["b", "5", "8"], arp: 1, gen: M => { const F = M.felt; return { chord: rng(M.n, 2), bass: F.concat(F.map(f => f + 4)).filter(p => p < M.n).sort((a, b) => a - b), d: [F, F.slice(1).concat(F.length < 2 ? [Math.floor(M.n / 2)] : []), rng(M.n, 2)] }; } } };
  const pbState = () => { if (!window.__pb) { let s = null; try { s = JSON.parse(localStorage.getItem(PBKEY)); } catch (e) { } window.__pb = s && s.major && s.minor && s.cfg ? s : { major: PBDEF.major.map(x => ({ ...x })), minor: PBDEF.minor.map(x => ({ ...x })), cfg: null }; if (!window.__pb.cfg) pbStyle(window.__pb, "rock"); } return window.__pb; };
  const pbSave = () => { try { localStorage.setItem(PBKEY, JSON.stringify(window.__pb)); } catch (e) { } };
  function pbStyle(S, id, keepMeter) { const st = STYLES[id], meter = keepMeter && S.cfg ? S.cfg.meter : st.meter, g = st.gen(METERS[meter]);
    S.cfg = Object.assign(S.cfg || {}, { style: id, meter, bpm: keepMeter && S.cfg ? S.cfg.bpm : st.bpm, ci: keepMeter && S.cfg ? S.cfg.ci : st.ci, bi: keepMeter && S.cfg ? S.cfg.bi : st.bi, kit: keepMeter && S.cfg ? S.cfg.kit : st.kit, rows: [g.chord, g.bass, ...g.d] });
    if (S.cfg.bassLvl == null) S.cfg.bassLvl = 1.2; }
  const curSys = () => (document.querySelector("[data-rsysbtn][aria-pressed='true']") || { dataset: { rsysbtn: window.__rsys || "cl" } }).dataset.rsysbtn;
  // one progression entry -> chord object with .rn (figure included)
  function pbChord(H, k, e, sys) {
    const f = e.s ? FIG7[e.b] : FIG3[e.b];
    if (k.mode === "major") return H.tok(k, e.d + f);
    const p = MINP.find(m => m[0] === e.id) || MINP[0], root = p[6] ? H.up(H.deg(k, 7), 0, 1) : H.deg(k, p[1]);
    const c = H.chord(root, e.s ? p[3] : p[2], e.b);
    let rn = sys === "mj" ? p[5] : p[4];
    if (e.s && p[0] === "ii°") rn = "iiø";
    c.rn = rn + f; return c;
  }
  const pbSay = (H, c) => `${H.rnSpoken(c.rn)}, ${H.speak(c.sym)}`;

  // ---------- synth (own Web Audio graph so chords, bass and drums each get their own instrument) ----------
  let AC = null, NOISE = null;
  const ctx = () => { if (!AC) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; AC = new C(); const comp = AC.createDynamicsCompressor(); comp.connect(AC.destination); AC._out = comp;
    NOISE = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const d = NOISE.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } if (AC.state === "suspended") AC.resume(); return AC; };
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  function env(g, t, pk, a, dec, sus, end, rel = .06) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(pk, t + a); g.gain.setTargetAtTime(pk * sus, t + a, dec); g.gain.setTargetAtTime(0, end, rel); }
  function osc(type, f, t, end, to, det = 0) { const o = AC.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = det; o.connect(to); o.start(t); o.stop(end + .6); return o; }
  function lpf(f, q = .7, to) { const x = AC.createBiquadFilter(); x.type = "lowpass"; x.frequency.value = f; x.Q.value = q; x.connect(to); return x; }
  let CURVE = null; const curve = () => { if (!CURVE) { CURVE = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; CURVE[i] = Math.tanh(x * 6); } } return CURVE; };
  const VOICES = {
    piano: (m, t, d, v, o) => { const g = AC.createGain(); g.connect(o); env(g, t, .2 * v, .005, .35, .25, t + d); osc("triangle", hz(m), t, t + d, g); const g2 = AC.createGain(); g2.gain.value = .3; g2.connect(g); osc("sine", hz(m) * 2, t, t + d, g2); },
    organ: (m, t, d, v, o) => { const g = AC.createGain(); g.connect(o); env(g, t, .09 * v, .01, 1, 1, t + d, .03); [1, 2, 3, 4].forEach((h, i) => { const gg = AC.createGain(); gg.gain.value = [1, .6, .35, .25][i]; gg.connect(g); osc("sine", hz(m) * h, t, t + d, gg); }); },
    eguitar: (m, t, d, v, o) => { const g = AC.createGain(); g.connect(o); env(g, t, .14 * v, .003, .5, .15, t + d); osc("sawtooth", hz(m), t, t + d, lpf(2200, 2, g)); },
    dist: (m, t, d, v, o) => { const g = AC.createGain(); g.connect(o); env(g, t, .07 * v, .004, .8, .6, t + d, .05); const ws = AC.createWaveShaper(); ws.curve = curve(); ws.connect(lpf(3200, 1, g)); const pre = AC.createGain(); pre.gain.value = .6; pre.connect(ws); osc("sawtooth", hz(m), t, t + d, pre, -6); osc("sawtooth", hz(m), t, t + d, pre, 6); },
    nylon: (m, t, d, v, o) => { const g = AC.createGain(); g.connect(o); env(g, t, .2 * v, .003, .3, .1, t + d); const f = lpf(1800, 1, g); osc("triangle", hz(m), t, t + d, f); const g2 = AC.createGain(); g2.gain.value = .25; g2.connect(f); osc("sawtooth", hz(m), t, t + d, g2); },
    chip: (m, t, d, v, o) => { const g = AC.createGain(); g.connect(o); env(g, t, .07 * v, .002, .15, .6, t + d * .9, .02); osc("square", hz(m), t, t + d, g); },
    pad: (m, t, d, v, o) => { const g = AC.createGain(); g.connect(o); env(g, t, .06 * v, .18, 1, 1, t + d, .35); const f = lpf(1300, 1, g); [-9, 0, 9].forEach(dt => osc("sawtooth", hz(m), t, t + d, f, dt)); },
    marimba: (m, t, d, v, o) => { const g = AC.createGain(); g.connect(o); env(g, t, .22 * v, .002, .18, .0, t + Math.min(d, .5)); osc("sine", hz(m), t, t + d, g); const g2 = AC.createGain(); g2.connect(o); env(g2, t, .06 * v, .001, .03, 0, t + .1); osc("sine", hz(m) * 4, t, t + .2, g2); } };
  const BASSV = {
    ebass: (m, t, d, v, o) => { const g = AC.createGain(); g.connect(o); env(g, t, .3 * v, .004, .5, .4, t + d); osc("sawtooth", hz(m), t, t + d, lpf(700, 1.5, g)); osc("sine", hz(m), t, t + d, g); },
    upright: (m, t, d, v, o) => { const g = AC.createGain(); g.connect(o); env(g, t, .36 * v, .008, .25, .15, t + d); const f = lpf(900, 1, g); osc("triangle", hz(m), t, t + d, f); osc("sine", hz(m) * 2, t, t + d, f); },
    synth: (m, t, d, v, o) => { const g = AC.createGain(); g.connect(o); env(g, t, .22 * v, .005, .3, .5, t + d); const f = lpf(300, 8, g); f.frequency.setValueAtTime(2400, t); f.frequency.setTargetAtTime(300, t, .08); osc("square", hz(m), t, t + d, f); },
    chip: (m, t, d, v, o) => { const g = AC.createGain(); g.connect(o); env(g, t, .32 * v, .002, 1, 1, t + d * .9, .02); osc("triangle", hz(m), t, t + d, g); },
    b808: (m, t, d, v, o) => { const g = AC.createGain(); g.connect(o); env(g, t, .45 * v, .003, .6, .3, t + d, .1); const x = osc("sine", hz(m), t, t + d, g); x.frequency.setValueAtTime(hz(m) * 2, t); x.frequency.exponentialRampToValueAtTime(hz(m), t + .05); },
    tuba: (m, t, d, v, o) => { const g = AC.createGain(); g.connect(o); env(g, t, .3 * v, .04, .6, .7, t + d, .08); osc("sawtooth", hz(m), t, t + d, lpf(450, 1, g)); } };
  function noise(t, dur, type, f, q, pk, o) { const s = AC.createBufferSource(); s.buffer = NOISE; const fl = AC.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = AC.createGain(); s.connect(fl); fl.connect(g); g.connect(o); g.gain.setValueAtTime(pk, t); g.gain.exponentialRampToValueAtTime(.001, t + dur); s.start(t); s.stop(t + dur + .02); }
  function thump(t, f0, f1, dur, pk, type, o) { const g = AC.createGain(); g.connect(o); g.gain.setValueAtTime(pk, t); g.gain.exponentialRampToValueAtTime(.001, t + dur); const x = osc(type, f0, t, t + dur, g); x.frequency.exponentialRampToValueAtTime(f1, t + dur * .5); x.stop(t + dur + .02); }
  const DRUM = {
    rock: [(t, v, o) => thump(t, 150, 45, .35, .9 * v, "sine", o), (t, v, o) => { noise(t, .18, "bandpass", 1800, .8, .5 * v, o); thump(t, 220, 160, .1, .3 * v, "triangle", o); }, (t, v, o) => noise(t, .05, "highpass", 7000, .7, .22 * v, o)],
    chip: [(t, v, o) => thump(t, 200, 50, .12, .35 * v, "square", o), (t, v, o) => noise(t, .1, "lowpass", 5000, .5, .35 * v, o), (t, v, o) => noise(t, .03, "highpass", 9000, .5, .2 * v, o)],
    samba: [(t, v, o) => thump(t, 95, 60, .45, .9 * v, "sine", o), (t, v, o) => { thump(t, 900, 820, .06, .3 * v, "triangle", o); noise(t, .03, "bandpass", 3000, 2, .2 * v, o); }, (t, v, o) => noise(t, .06, "bandpass", 6500, 1.5, .14 * v, o)],
    k808: [(t, v, o) => thump(t, 110, 42, .6, 1 * v, "sine", o), (t, v, o) => [0, .012, .024].forEach(x => noise(t + x, .12, "bandpass", 1300, 1.2, .35 * v, o)), (t, v, o) => noise(t, .04, "highpass", 8000, .7, .2 * v, o)] };

  // voicings: upper chord tones voice-led around middle C; the bass in its own low register
  const pcOf = (H, n) => H.pc(n);
  function uppers(H, c, prev, power) { let pcs = c.tones.map(n => pcOf(H, n)); if (power) pcs = [pcs[0], pcs[2]];
    let best = null; for (let r = 0; r < pcs.length; r++) { const rot = pcs.slice(r).concat(pcs.slice(0, r)), out = []; let m = 52 + ((rot[0] - 52) % 12 + 12) % 12; out.push(m); for (let i = 1; i < rot.length; i++) { m += ((rot[i] - m) % 12 + 12) % 12 || 12; out.push(m); } if (power) out.push(out[0] + 12);
      const cost = prev ? out.reduce((s, x, i) => s + Math.abs(x - (prev[i] ?? prev[prev.length - 1])), 0) : Math.abs(out[0] + out[out.length - 1] - 124); if (!best || cost < best[0]) best = [cost, out]; }
    return best[1]; }
  const bassM = (H, c) => 36 + ((pcOf(H, c.tones[c.bass]) - 36) % 12 + 12) % 12;
  function bassNote(H, c, kind) { const b = bassM(H, c); if (kind === "8") return b + 12; if (kind === "5") { const f = pcOf(H, c.tones[(c.bass + 2) % c.tones.length]); return b + (((f - b) % 12 + 12) % 12 || 12); } return b; }

  const pbHTML = (mode, id, trans) => `<div class="pbld" data-pb="${mode}" id="${id}"${trans ? " data-trans" : ""}>
    <div class="pb-row pb-styles" role="group" aria-label="Style">${Object.entries(STYLES).map(([s, x]) => `<button class="lk pb-sty" data-pbstyle="${s}" aria-pressed="false">${x.name}</button>`).join("")}</div>
    <div class="pb-row pb-sets">
      <label>Meter <select data-pbmeter>${Object.keys(METERS).map(m => `<option>${m}</option>`).join("")}</select></label>
      <label>Tempo <input type="range" min="60" max="180" step="2" data-pbbpm> <span data-pbbpmv></span></label>
      <label>Chords <select data-pbci>${Object.entries(CI).map(([v, n]) => `<option value="${v}">${n}</option>`).join("")}</select></label>
      <label>Bass <select data-pbbi>${Object.entries(BI).map(([v, n]) => `<option value="${v}">${n}</option>`).join("")}</select></label>
      <label>Drums <select data-pbkit><option value="rock">Rock kit</option><option value="chip">Chiptune</option><option value="samba">Samba</option><option value="k808">808</option><option value="off">No drums</option></select></label>
      <label>Bass level <input type="range" min="0" max="2" step=".1" data-pblvl></label></div>
    ${trans ? `<div class="pb-row pb-keys" role="group" aria-label="Key"></div>` : `<div class="pb-row" role="group" aria-label="Bass tone and 7th for the next chord"><span class="pb-lab" aria-hidden="true">Bass tone:</span>${BASSN.map((n, i) => `<button class="lk" data-pbb="${i}" aria-pressed="${i === 0}">${n}</button>`).join("")}<button class="lk" data-pbs aria-pressed="false">Add 7th</button></div>
    <div class="pb-pal" role="group" aria-label="Chords in the key (tap to add)"></div>`}
    <div class="pb-prog" role="group" aria-label="Your progression, one chord per bar"></div>
    <div class="pb-row"><button class="play pb-go" data-pbplay><svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M2 1l9 5-9 5z"/></svg><span>Play</span></button><button class="lk" data-pbloop aria-pressed="true">Loop</button>${trans ? "" : `<button class="lk" data-pbdel>Remove last</button><button class="lk" data-pbclr>Clear</button><button class="lk" data-pbreset>Example</button>`}</div>
    <div class="pb-grid-wrap" tabindex="0" role="region" aria-label="One-bar pattern: tap boxes to change when chords, bass and drums play"><div class="pb-grid"></div></div>
    <p class="sr" aria-live="polite" data-pblive></p></div>`;

  function pbMount(root, H, k0, opts = {}) {
    const box = root.querySelector(".pbld"); if (!box) return;
    const mode = box.dataset.pb, trans = box.hasAttribute("data-trans"), S = pbState(), C = S.cfg;
    const prog = () => (trans && !S[mode].length ? PBDEF[mode] : S[mode]);
    let b = 0, s = 0, sel = null, k = k0, playing = null;
    const pal = mode === "major" ? [1, 2, 3, 4, 5, 6, 7].map(d => ({ d })) : MINP.map(m => ({ id: m[0] }));
    const $ = q => box.querySelector(q), live = t => { $("[data-pblive]").textContent = t; };
    const chordOf = e => pbChord(H, k, e, curSys());
    const degOf = e => e.d || (MINP.find(m => m[0] === e.id) || [0, 1])[1];
    const label = c => `<span aria-hidden="true">${H.rnHTML(c.rn)}<small>${H.symHTML(c.sym)}</small></span>`;
    const M = () => METERS[C.meter], st = () => STYLES[C.style];
    const lanes = () => ["Chords", "Bass"].concat(C.kit === "off" ? [] : KITS[C.kit]);
    function sets() { box.querySelectorAll("[data-pbstyle]").forEach(x => x.setAttribute("aria-pressed", x.dataset.pbstyle === C.style)); $("[data-pbmeter]").value = C.meter; $("[data-pbbpm]").value = C.bpm; $("[data-pbbpmv]").textContent = C.bpm; $("[data-pbci]").value = C.ci; $("[data-pbbi]").value = C.bi; $("[data-pbkit]").value = C.kit; $("[data-pblvl]").value = C.bassLvl; }
    function grid() { const m = M(), L = lanes();
      $(".pb-grid").style.setProperty("--n", m.n);
      $(".pb-grid").innerHTML = `<span class="pb-gl" aria-hidden="true">Count</span>` + rng(m.n, 1).map(p => `<span class="pb-cnt${m.beats.includes(p) ? " bt" : ""}" aria-hidden="true" data-col="${p}">${countOf(m, p)}</span>`).join("")
        + L.map((ln, r) => `<span class="pb-gl${r === 1 ? " bass" : ""}">${ln}</span>` + rng(m.n, 1).map(p => `<button class="pb-cell${r === 1 ? " bass" : r === 0 ? " chd" : ""}${m.beats.includes(p) ? " bt" : ""}${m.felt.includes(p) ? " ft" : ""}" data-row="${r}" data-col="${p}" aria-pressed="${C.rows[r].includes(p)}" aria-label="${ln}, count ${p + 1}"></button>`).join("")).join(""); }
    function draw() {
      if (!trans) { box.querySelectorAll("[data-pbb]").forEach(x => x.setAttribute("aria-pressed", +x.dataset.pbb === b)); $("[data-pbs]").setAttribute("aria-pressed", !!s);
        $(".pb-pal").innerHTML = pal.map((p, i) => { const c = chordOf(Object.assign({}, p, { b, s })); return `<button class="pb-ch" data-deg="${degOf(p)}" data-pbi="${i}" aria-label="${H.esc(pbSay(H, c))}${sel != null ? " (replaces the selected chord)" : ""}">${label(c)}</button>`; }).join(""); }
      else $(".pb-keys").innerHTML = `<span class="pb-lab" aria-hidden="true">Key:</span>` + H.KEYS[mode].map(n => `<button class="lk" data-pbkey="${H.esc(n)}" aria-pressed="${n === k.name}">${H.symHTML(n + (mode === "minor" ? "m" : ""))}</button>`).join("");
      const P = prog();
      $(".pb-prog").innerHTML = P.length ? P.map((e, i) => { const c = chordOf(e); return `<button class="pb-chip" data-deg="${degOf(e)}" data-pbc="${i}" aria-pressed="${sel === i}" aria-label="Bar ${i + 1}: ${H.esc(pbSay(H, c))}"${trans ? " tabindex=\"-1\"" : ""}><span class="pb-bar" aria-hidden="true">${i + 1}</span>${label(c)}</button>`; }).join("") : `<p class="pb-empty">Tap chords above to build a progression (up to ${PBMAX} bars).</p>`;
      if (!trans) { $("[data-pbdel]").disabled = !P.length; $("[data-pbdel]").textContent = sel != null ? "Remove selected" : "Remove last"; }
      $("[data-pbplay]").disabled = !P.length;
    }
    // ----- playback -----
    function hit(c, t, dur, prev, idx, out, kinds) { // one chord-row hit
      const up = uppers(H, c, prev, C.ci === "dist"), V = VOICES[C.ci], arp = st().arp && kinds.arp;
      if (arp) { const seq = up.concat(up[0] + 12); V(seq[idx % seq.length], t, dur, 1, out); }
      else up.forEach((m, j) => V(m, t + (["eguitar", "dist", "nylon"].includes(C.ci) ? j * .012 : 0), dur, 1, out));
      return up; }
    function bar(i, t0, out) { const P = prog(); if (!P.length) return; const c = chordOf(P[i % P.length]), m = M(), pd = 60 / C.bpm / 4, end = t0 + m.n * pd;
      const R = C.rows.map(r => r.slice().sort((a, b) => a - b)), nextOf = (r, p) => { const q = R[r].find(x => x > p); return q == null ? m.n : q; };
      let prev = box._prev; R[0].forEach((p, j) => { prev = hit(c, t0 + p * pd, (nextOf(0, p) - p) * pd * .95, prev, j, out, { arp: 1 }); }); box._prev = prev;
      const bo = AC.createGain(); bo.gain.value = C.bassLvl; bo.connect(out); const seq = st().seq;
      R[1].forEach((p, j) => BASSV[C.bi](bassNote(H, c, seq[j % seq.length]), t0 + p * pd, (nextOf(1, p) - p) * pd * .92, 1, bo));
      if (C.kit !== "off") [2, 3, 4].forEach((r, li) => R[r].forEach(p => DRUM[C.kit][li](t0 + p * pd, m.felt.includes(p) ? 1 : m.beats.includes(p) ? .8 : .6, out)));
      return end; }
    function stop() { if (!playing) return; clearInterval(playing.iv); cancelAnimationFrame(playing.raf); const g = playing.out; g.gain.setTargetAtTime(0, AC.currentTime, .03); setTimeout(() => g.disconnect(), 300); playing = null; box._prev = null;
      box.querySelectorAll(".now").forEach(x => x.classList.remove("now")); $("[data-pbplay] span").textContent = "Play"; }
    function start() { if (!ctx() || !prog().length) return; stop(); const out = AC.createGain(); out.connect(AC._out); let t = AC.currentTime + .08, i = 0; const log = [];
      playing = { out };
      const tick = () => { if (!box.isConnected) { stop(); return; } const P = prog(); while (playing && t < AC.currentTime + .25) { if (i >= P.length) { if ($("[data-pbloop]").getAttribute("aria-pressed") !== "true") { if (AC.currentTime > t) stop(); return; } i = 0; } log.push([t, i]); const e = bar(i, t, out); t = e; i++; } };
      const anim = () => { if (!playing) return; const now = AC.currentTime; let cur = null; for (const L of log) if (L[0] <= now) cur = L; if (cur) { const pd = 60 / C.bpm / 4, p = Math.floor((now - cur[0]) / pd);
          box.querySelectorAll(".pb-chip").forEach((x, j) => x.classList.toggle("now", j === cur[1])); box.querySelectorAll(".pb-grid [data-col]").forEach(x => x.classList.toggle("now", +x.dataset.col === p)); }
        while (log.length > 4 && log[1][0] <= now) log.shift(); playing.raf = requestAnimationFrame(anim); };
      playing.iv = setInterval(tick, 25); tick(); playing.raf = requestAnimationFrame(anim); $("[data-pbplay] span").textContent = "Stop"; }
    function preview(c) { if (!ctx() || playing) return; const out = AC.createGain(); out.connect(AC._out); const up = uppers(H, c, null, C.ci === "dist"); up.forEach((m, j) => VOICES[C.ci](m, AC.currentTime + .03 + j * .012, .9, 1, out));
      const bo = AC.createGain(); bo.gain.value = C.bassLvl; bo.connect(out); BASSV[C.bi](bassNote(H, c, "b"), AC.currentTime + .03, .9, 1, bo); }
    const changed = () => { pbSave(); };
    box.addEventListener("click", ev => {
      const t = ev.target.closest("button"); if (!t || !box.contains(t)) return; const P = S[mode];
      if (t.dataset.pbstyle) { pbStyle(S, t.dataset.pbstyle); box._prev = null; sets(); grid(); changed(); live(`${STYLES[C.style].name}: ${CI[C.ci]}, ${BI[C.bi]}, ${C.meter}.`); if (!playing) start(); return; }
      if (t.dataset.row != null) { const r = +t.dataset.row, p = +t.dataset.col, a = C.rows[r], j = a.indexOf(p); if (j >= 0) a.splice(j, 1); else a.push(p); t.setAttribute("aria-pressed", j < 0); changed(); return; }
      if (t.hasAttribute("data-pbplay")) { playing ? stop() : start(); return; }
      if (t.hasAttribute("data-pbloop")) { t.setAttribute("aria-pressed", t.getAttribute("aria-pressed") !== "true"); return; }
      if (t.dataset.pbkey) { k = H.key(t.dataset.pbkey, mode); box._prev = null; draw(); if (opts.onKey) opts.onKey(k); live(`Now in ${k.label}.`); if (!playing) start(); return; }
      if (t.dataset.pbb != null) { b = +t.dataset.pbb; if (b === 3) s = 1; if (sel != null) { Object.assign(P[sel], { b, s }); changed(); preview(chordOf(P[sel])); } draw(); return; }
      if (t.hasAttribute("data-pbs")) { s = s ? 0 : 1; if (!s && b === 3) b = 0; if (sel != null) { Object.assign(P[sel], { b, s }); changed(); preview(chordOf(P[sel])); } draw(); return; }
      if (t.dataset.pbi != null) { const e = Object.assign({}, pal[+t.dataset.pbi], { b, s }), c = chordOf(e);
        if (sel != null) { P[sel] = e; live(`Bar ${sel + 1} is now ${pbSay(H, c)}.`); sel = null; }
        else if (P.length < PBMAX) { P.push(e); live(`Added ${pbSay(H, c)}.`); } else live(`The progression is full (${PBMAX} bars). Select a bar to replace its chord.`);
        changed(); preview(c); draw(); return; }
      if (t.dataset.pbc != null && !trans) { const i = +t.dataset.pbc; sel = sel === i ? null : i; if (sel != null) { b = P[i].b; s = P[i].s; preview(chordOf(P[i])); live(`Bar ${i + 1} selected. Choose a chord, bass tone or 7th to change it.`); } draw(); box.querySelector(`[data-pbc="${i}"]`).focus(); return; }
      if (t.hasAttribute("data-pbdel")) { P.splice(sel != null ? sel : P.length - 1, 1); sel = null; changed(); live("Chord removed."); draw(); return; }
      if (t.hasAttribute("data-pbclr")) { stop(); P.length = 0; sel = null; changed(); live("Progression cleared."); draw(); return; }
      if (t.hasAttribute("data-pbreset")) { S[mode] = PBDEF[mode].map(x => ({ ...x })); sel = null; changed(); live("Example progression loaded."); draw(); return; }
    });
    box.addEventListener("change", ev => { const t = ev.target;
      if (t.matches("[data-pbmeter]")) { C.meter = t.value; const g = st().gen(M()); C.rows = [g.chord, g.bass, ...g.d]; grid(); live(`Meter ${C.meter}; the ${st().name} pattern now fits it. Tap boxes to change it.`); }
      if (t.matches("[data-pbci]")) C.ci = t.value; if (t.matches("[data-pbbi]")) C.bi = t.value; if (t.matches("[data-pbkit]")) { C.kit = t.value; grid(); }
      changed(); });
    box.addEventListener("input", ev => { const t = ev.target; if (t.matches("[data-pbbpm]")) { C.bpm = +t.value; $("[data-pbbpmv]").textContent = C.bpm; } if (t.matches("[data-pblvl]")) C.bassLvl = +t.value; changed(); });
    box._redraw = draw; sets(); grid(); draw();
  }
  // Transposition: the progression built earlier, in any key of the same mode, plus a table across keys
  function pbTrans(root, H, k) {
    const S = pbState(), P = S[k.mode].length ? S[k.mode] : PBDEF[k.mode], sys = curSys();
    const rns = P.map(e => pbChord(H, k, e, sys).rn), syms = kk => P.map(e => pbChord(H, kk, e, sys).sym);
    root.querySelector(".pbtr-note").innerHTML = `Your ${k.mode} progression: ${rns.map(r => H.rnHTML(r)).join(" – ")}${S[k.mode].length ? "" : " (an example: build your own in the earlier steps)"}. Press Play, then tap keys while it loops: the numerals stay the same while every letter name changes.`;
    root.querySelector(".pbtr-tbl").innerHTML = tbl(`Your progression in every ${k.mode} key`, ["Key", "Chords", "Numerals"], H.KEYS[k.mode].map(n => { const kk = H.key(n, k.mode); return [kk.label, syms(kk).map(s => H.symHTML(s)).join(" – "), rns.map(r => H.rnHTML(r)).join(" – ")]; }));
    pbMount(root, H, k);
  }
  const lesson = { defMode: "major", steps: [
    { title: "What Roman numerals show", kick: "Chords by scale degree", keyed: "both", render: (H, k, U) => {
      const ds = [1, 2, 3, 4, 5, 6, 7].map(d => k.mode === "minor" && d === 7 ? H.tok(k, "7") : H.tok(k, String(d)));
      return `<p><b>Roman numeral analysis</b> labels each chord by the <b>scale degree of its root</b> in the current key. The numeral's form shows the chord's quality:</p>
      <ul><li><b>Uppercase</b> (I, IV, V): major triad. <b>Lowercase</b> (ii, iii, vi): minor triad.</li><li><b>°</b> (vii°): diminished triad. <b>+</b> (III+): augmented triad.</li></ul>
      ${tbl(`Triads in ${k.label}`, ["Degree", "Numeral", "Chord", "Notes"], ds.map((c, i) => [i + 1, `{rn:${c.rn}}`, `{sym:${c.sym}}`, c.tones.map(H.nm).join("–")]))}
      ${sf(H, U, k, k.mode === "major" ? ["1", "4", "2", "5", "6", "3", "4", "5", "1"] : ["1", "4", "26", "5", "6", "4", "5", "1"], "Diatonic chords in four voices", { small: false })}
      <p>In <b>major</b> keys the pattern is always I ii iii IV V vi vii°. ${k.mode === "minor" ? "In <b>minor</b> it depends on which form of the scale a chord uses; the raised 7th degree makes V major and vii° diminished, as here. (See <i>Numerals in minor</i>.)" : "Switch to minor above to see how the pattern changes."}</p>`
      + H.check(`In ${k.label}, what is {sym:${ds[3].sym}}?`, ds[3].rn, ds.filter((_, i) => i !== 3).map(c => c.rn), "It's built on the 4th scale degree.", "rn"); } },
    { title: "Why numerals?", kick: "Relationships, not letter names", render: () => `<p>A chord symbol such as {sym:G7} tells a player <i>what</i> to play. A Roman numeral tells a musician <i>what the chord does</i> in the key: {sym:G7} is {rn:V7} in C major (it pulls home to C), {rn:IV7} in D major, and {rn:♭VII7} in A major. The numeral captures the relationship to the tonic, and that relationship is what we hear as <b>function</b>.</p>
      ${tbl("Three ways to write the same progression in C major", ["System", "Progression", "Used by"], [["Chord symbols", "{sym:C} – {sym:Am} – {sym:F} – {sym:G7}", "lead sheets, guitar charts"], ["Roman numerals", "{rn:I} – {rn:vi} – {rn:IV} – {rn:V7}", "analysis in every style"], ["Nashville numbers", "1 – 6- – 4 – 5⁷", "session players, especially in country music (see the next steps)"]])}
      <ul><li>Numerals make patterns visible: a cadence, a circle of fifths, or a loop looks the same in every key.</li><li>They help you hear: once you know the sound of {rn:IV}–{rn:V}–{rn:I}, you can recognize it anywhere.</li><li>They make transposing, improvising and arranging faster.</li></ul>
      <p>Roman numerals for chords became standard in the 19th century; Gottfried Weber's writing in the 1810s and 1820s spread the use of uppercase and lowercase numerals for chord quality.</p>` },
    { title: "Inversions and seventh chords", kick: "Figures after the numeral", keyed: "major", render: (H, k, U) => `<p>A Roman numeral names a chord's root and quality, not which note is in the bass. To show an inversion, <b>figures</b> are often attached to the numeral: {rn:V6} is a V chord in first inversion, {rn:ii65} a ii⁷ chord in first inversion. The figures themselves (what ⁶, ⁶₄, ⁶₅, ⁴₃ and ⁴₂ mean, and how to find them) are covered in <a href="chord-figures-and-symbols-lesson.html">Chord Figures and Symbols</a>.</p>
      <p>Seventh chords add a sign for the chord's quality: {rn:V7} (major triad, minor 7th: dominant 7th), {rn:ii7} (minor 7th), {rn:viiø7} (half-diminished) and {rn:vii°7} (fully diminished). A major 7th chord, such as the one on I or IV, is simply {rn:I7} or {rn:IV7}: the key tells you its 7th is major.</p>
      <h3>Build a progression</h3>
      <p>Choose a <b>bass tone</b> (and whether to <b>add the 7th</b>), then tap chords to add them, one per bar; each numeral updates to show its figure. Tap a bar to select it and change its chord, bass tone or 7th. Pick a style, a meter and instruments for the chords, bass and drums, press Play, and tap the boxes in the pattern grid to change when each part plays. Turn up <b>Bass level</b> to make the bass line pop out. Your progression is saved for the <b>Transposition</b> step.</p>
      ${pbHTML("major", "pbMaj")}`
      + H.check("Figures attached to a Roman numeral show…", "which chord tone is in the bass (the inversion)", ["the chord's root", "the key", "how long the chord lasts"], "The numeral gives the root and quality; the figures give the inversion."),
      after: (root, H, k, tools) => pbMount(root, H, k, tools) },
    { title: "Numerals in minor and chromatic numerals", kick: "III or ♭III? Accidentals before the numeral", keyed: "minor", render: (H, k, U) => {
      const sys = (cl, mj) => cl === mj ? `{rn:${cl}}` : `<span data-rsys="cl">{rn:${cl}}</span><span data-rsys="mj" hidden>{rn:${mj}}</span>`;
      const rows = MINT.map(([d, q, cl, mj, note]) => { const c = minChord(H, k, d, q); return [d, `{sym:${c.sym}}`, sys(cl, mj), note]; });
      const kM = majOf(H, k), set = chromSet(H, kM), b = set.slice(0, 6);
      return `<p>In minor, the 3rd, 6th and 7th degrees are a half step lower than in major. There are two common ways to label the chords built on them. Switch between them:</p>
      <div class="lbtns rsys" role="group" aria-label="Numeral system"><button class="lk" data-rsysbtn="cl" aria-pressed="true">Relative to minor: III, VI, VII</button><button class="lk" data-rsysbtn="mj" aria-pressed="false">Relative to major: ♭III, ♭VI, ♭VII</button></div>
      <div data-rsys="cl"><p><b>Relative to the minor scale</b> (common in classical theory books): count degrees of the minor key itself. Chords on the 3rd, 6th and 7th degrees are simply <b>III, VI, VII</b>; an accidental is written only when a chord's root is altered from the minor scale (like ♭II, the Neapolitan). This keeps numerals short and matches the key signature. Watch out for the 7th degree: {rn:VII} (subtonic, natural 7th) and {rn:vii°} (leading tone, raised 7th) have roots a half step apart.</p></div>
      <div data-rsys="mj" hidden><p><b>Relative to the major scale</b> (common in pop, rock and jazz, and in some textbooks): every key and mode is measured against the major scale on the same tonic, so those chords are <b>♭III, ♭VI, ♭VII</b>. One numeral then always means one chord relative to the tonic: {rn:♭VI} is the same chord in ${kM.label} and ${k.label}, which makes borrowing between modes easy to see.</p></div>
      ${tbl(`Chords in ${k.label}`, ["Degree", "Chord", "Numeral", "Note"], rows)}
      <h3>Build a minor-key progression</h3>
      <p>The palette has both chords on the 5th degree (v and V) and both on the 7th (VII and vii°), and its labels follow the numeral system chosen above. Try {rn:v} and then {rn:V} before {rn:i} to hear what the raised 7th does, or {rn:VII} against {rn:vii°}. This progression is also used in the <b>Transposition</b> step.</p>
      ${pbHTML("minor", "pbMin")}
      <p>Both systems agree on i, ii°, iv, v, V and vii°. Pick one and use it consistently; the Chord Progression Lab lets you switch between them.</p>
      <h3>Chromatic numerals</h3>
      <p>Chords with notes outside the key get numerals too. An <b>accidental before the numeral</b> shows that the root is lowered (♭) or raised (♯) from the scale it's measured against; case and quality signs work as usual. (♭ means "lowered", even in sharp keys where the actual note may carry a natural.)</p>
      <p><b>Borrowed chords</b> (mode mixture) bring chords of the minor key into its parallel major. In ${kM.label}, measured against the major scale, both systems label them the same way:</p>
      ${tbl(`Borrowed chords in ${kM.label}`, ["Numeral", "Chord", "Notes"], b.map(c => [`{rn:${c.rn}}`, `{sym:${c.sym}}`, c.tones.map(H.nm).join("–")]))}
      ${sf(H, U, kM, ["1", cc(H, kM, -1, 6, "M", "♭VI"), cc(H, kM, -1, 7, "M", "♭VII"), "1"], `I – ♭VI – ♭VII – I in ${kM.label}`, { small: false })}
      ${sf(H, U, kM, ["1", "4", cc(H, kM, 0, 4, "m", "iv"), "1"], `I – IV – iv – I in ${kM.label}`, { small: false })}`
      + H.check(`In ${k.label}, using numerals relative to the major scale, how is the chord on the 7th degree of natural minor labeled?`, "♭VII", ["VII", "vii°", "♯VII"], "It's a major triad a whole step below the tonic: ♭VII.", "rn")
      + H.check(`In ${kM.label}, how is {sym:${b[3].sym}} labeled?`, "♭VII", ["vii°", "VII", "♭vii"], "A major triad on the lowered 7th degree.", "rn"); },
      after: (root, H, k, tools) => { const set = v => { window.__rsys = v; root.querySelectorAll("[data-rsysbtn]").forEach(b => b.setAttribute("aria-pressed", b.dataset.rsysbtn === v)); root.querySelectorAll("[data-rsys]").forEach(e => e.hidden = e.dataset.rsys !== v); const pb = root.querySelector(".pbld"); if (pb && pb._redraw) pb._redraw(); };
        pbMount(root, H, k, tools); if (window.__rsys && window.__rsys !== "cl") set(window.__rsys);
        root.querySelectorAll("[data-rsysbtn]").forEach(b => b.addEventListener("click", () => set(b.dataset.rsysbtn))); } },
    { title: "Transposition", kick: "The numerals don't change", keyed: "both", render: (H, k, U) => {
      return `<p>To <b>transpose</b> is to move every note by the same interval. Each chord's root keeps the same distance from the tonic, and each chord keeps its quality, so <b>the Roman numerals stay exactly the same</b>. Only the letter names change.</p>
      <h3>Your progression in any key</h3>
      <p class="pbtr-note"></p>
      ${pbHTML(k.mode, "pbTr", true)}
      <div class="pbtr-tbl"></div>
      <p>This is why numerals are so useful: learn a progression once, and you can play it, recognize it, or write it in any key. A singer who needs a song lower can ask for it "down a whole step", and a band that thinks in numbers just plays the same numbers from a new tonic.</p>`
      + H.check(`I–IV–V–I in G major is G–C–D–G. What is it in E♭ major?`, "E♭–A♭–B♭–E♭", ["E♭–A–B♭–E♭", "E♭–A♭–B–E♭", "E♭–F–G–E♭"], "Same numerals from the new tonic: I = E♭, IV = A♭, V = B♭."); },
      after: (root, H, k) => pbTrans(root, H, k) },
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
      ${tbl("Common variants", ["Style", "ii–V–I in C", "Notes"], [["Classical analysis", "{rn:ii7} – {rn:V7} – {rn:I7}", "case shows quality; a plain ⁷ means the 7th that occurs in the key, so I⁷ is a major 7th chord; figures show inversions"], ["Jazz (all uppercase)", "IIm7 – V7 – I△7", "uppercase numerals with chord-symbol suffixes; △7 (or maj7) marks a major 7th"], ["Nashville numbers", "2m – 5 – 1", "plain numbers; minor, 7ths and extensions as suffixes"]])}
      <p>Classical analysis doesn't use "maj7" or the triangle (△): the key signature already decides the quality of each 7th. Those suffixes belong to chord symbols and jazz-style numerals.</p>
      <p>Watch out for "I7": with chord-symbol suffixes it means a dominant 7th on the tonic (as in the blues), but in classical analysis {rn:I7} is a major 7th chord, and a dominant 7th on the tonic leading to IV is written {rn:V7/IV}. Context tells you which convention a writer is using.</p>` },
    { title: "Nashville numbers", kick: "Charts in any key", keyed: "major", render: (H, k, U) => {
      const N = { "1": H.tok(k, "1"), "2": H.tok(k, "2"), "4": H.tok(k, "4"), "5": H.tok(k, "5"), "6": H.tok(k, "6"), "57": H.tok(k, "57") };
      const sy = t => `{sym:${N[t].sym}}`, b3 = H.chord(H.deg(k, 3), "M"), bass3 = H.nm(H.deg(k, 3));
      const chart = [["1", "1", "4", "1"], ["6-", "4", "1/3", "5"], ["1", "4", "6-", "4 5⁷"], ["1", "◇4", "1", "1"]];
      const sym = c => c.split(" ").map(x => { const m = /^◇?(\d)(-?)(⁷?)(\/3)?$/.exec(x); if (!m) return x; const c0 = H.tok(k, m[1] + (m[3] ? "7" : "")); return `{sym:${c0.sym}${m[4] ? "/" + bass3 : ""}}`; }).join(" ");
      return `<p>The <b>Nashville Number System</b> is a shorthand chart used by session musicians, especially in country, gospel and pop recording studios. It grew up in Nashville in the late 1950s; Neal Matthews Jr. of the vocal group the Jordanaires is usually credited with developing it, and studio players such as Charlie McCoy spread it among the session world. Like Roman numerals, it names chords by scale degree, so one chart works in every key: when the singer wants it lower, nobody rewrites anything.</p>
      ${tbl("How the symbols work", ["Symbol", "Means", `In ${k.label}`], [
        ["1  4  5", "major chords on scale degrees 1, 4, 5 (major is assumed)", `${sy("1")} ${sy("4")} ${sy("5")}`],
        ["6-  or  6m", "minor chord on degree 6", sy("6")],
        ["2-⁷, 5⁷, 1△⁷", "seventh chords: minor 7th, dominant 7th, major 7th", `{sym:${H.tok(k, "27").sym}} {sym:${N["57"].sym}} {sym:${H.chord(H.deg(k, 1), "M7").sym}}`],
        ["1/3", "1 chord with scale degree 3 in the bass (a slash shows the bass note's degree)", `{sym:${N["1"].sym}/${bass3}}`],
        ["♭7, ♭3", "chords on lowered degrees", `{sym:${H.chord(H.down(H.deg(k, 1), 1, 2), "M").sym}} {sym:${H.chord(H.down(H.deg(k, 3), 0, 1), "M").sym}}`],
        ["one number", "one bar (in the song's meter)", ""],
        ["4 5 (underlined or boxed)", "a split bar: several chords share one bar", ""],
        ["◇ (diamond)", "hit the chord and let it ring", ""],
        ["^ or &gt; above a number", "a push: the chord anticipates the beat", ""]])}
      <p>A Nashville chart is written like this: each number is one bar, a line usually holds four bars, and section letters sit at the left. Here is a short one, then how it sounds in four voices:</p>
      ${nchart([["", ["1", "4", "1/3", "5", "1"]]], [`Key: ${k.label.replace(/ major$/, "")}`, "4/4"])}
      ${sf(H, U, k, ["1", "4", "16", "5", "1"], `The chart above played in ${k.label}: 1 4 1/3 5 1`, { small: false, labels: false })}
      <p>A longer chart (verse and chorus, four bars per line) and the same chart in chord symbols for ${k.label}:</p>
      <div class="nch-pair">${nchart(chart.map((l, i) => [i === 0 ? "V" : i === 2 ? "C" : "", l]), [`Key: ${k.label.replace(/ major$/, "")}`, "4/4"])}
      ${nchart(chart.map((l, i) => [i === 0 ? "V" : i === 2 ? "C" : "", l]), [`In ${k.label}`, "4/4"], sym)}</div>
      <ul><li>Unlike Roman numerals, the numbers don't show quality by case: minor needs a minus sign or "m".</li>
      <li>Songs in minor keys are often charted with the minor tonic as 6- (counting from the relative major), though some players write 1- instead. Agree on which before the session.</li>
      <li>Players add their own marks for stops, rests, key changes and section names (V for verse, C for chorus, B for bridge), so charts vary a little from studio to studio.</li></ul>`
      + H.check(`In ${k.label}, what chord is 6- in Nashville numbers?`, N["6"].sym, [N["4"].sym, N["2"].sym, N["5"].sym, H.chord(H.deg(k, 6), "M").sym], "Count up six scale degrees; the minus sign means minor.", "sym"); } },
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
