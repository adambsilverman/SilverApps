window.FAM = (() => {
  // ===== Secondary Function Chords: content (lesson + drills). Engine: build/harmony/engine.js =====
  const TGT_RN = { major: ["I", "ii", "iii", "IV", "V", "vi", "vii°"], minor: ["i", "ii°", "III", "iv", "V", "VI", "VII"] };
  const TARGETS = { major: [2, 3, 4, 5, 6], minor: [3, 4, 5, 6, 7] };
  const FN = { dom: "Secondary dominant", lt: "Secondary leading-tone chord", pd: "Secondary pre-dominant", dia: "Diatonic (not secondary)" };
  const FNSHORT = { dom: "secondary dominant", lt: "secondary leading-tone chord", pd: "secondary pre-dominant" };
  const FIG3 = ["", "6", "64"], FIG7 = ["7", "65", "43", "42"];
  const tMajor = (k, d) => /^[A-Z]/.test(TGT_RN[k.mode][d - 1]) && !/°/.test(TGT_RN[k.mode][d - 1]);

  // Build a secondary chord. fn: dom | lt | pd; d: target degree; inv: bass index; q: chord quality
  function sec(H, k, fn, d, inv, q) {
    const T = H.deg(k, d);
    const root = fn === "dom" ? H.up(T, 4, 7) : fn === "lt" ? H.down(T, 1, 1) : H.up(T, 1, 2);
    const c = H.chord(root, q, inv);
    const sev = c.tones.length === 4;
    const base = fn === "dom" ? "V" : fn === "lt" ? "vii°" : q === "h7" ? "iiø" : q === "d" ? "ii°" : "ii";
    let f = sev ? FIG7[inv] : FIG3[inv];
    if (fn === "lt" && sev && inv === 0) f = "7";
    const rn = base + f + "/" + TGT_RN[k.mode][d - 1];
    return { c, rn, fn, d, T, target: TGT_RN[k.mode][d - 1] };
  }
  // No diminished triads: a °-triad is both vii°/x and ii°/y (e.g. vii°/IV = ii°/ii), so it can't be labeled without more context.
  // Secondary leading-tone chords are always fully diminished 7ths; pre-dominants are ø7 (or minor / m7 when the target is major).
  const QUALS = { dom: ["7", "7", "M"], lt: ["o7"], pd: ["m", "m7", "h7"] };
  // Same notes as a chord that has another common explanation? (borrowed from the parallel mode, melodic-minor IV / ii,
  // Picardy I in minor): then a chord-symbol question without context would have two right answers, so skip it.
  function otherReading(H, k, c) {
    const par = H.key(k.name, k.mode === "major" ? "minor" : "major"), set = x => x.tones.map(H.nm).sort().join(",");
    const mine = set(c), alt = [];
    for (let d = 1; d <= 7; d++) [false, true].forEach(sev => { const x = par.mode === "minor" && d === 7 ? H.chord(H.deg(par, 7), sev ? "7" : "M") : par.mode === "minor" && d === 5 ? H.chord(H.deg(par, 5), sev ? "m7" : "m") : H.diat(par, d, sev); if (H.QUAL[x.q]) alt.push(x); });
    return alt.some(x => set(x) === mine);
  }
  function okSpell(c) { return c.tones.every(n => Math.abs(n.a) < 2); }
  function pickKey(H) {
    const on = H.topicsOn(), modes = [on.includes("maj") && "major", on.includes("min") && "minor"].filter(Boolean);
    return H.randKey(modes.length ? modes : ["major"]);
  }
  function pickFn(H) { const on = H.topicsOn().filter(t => ["dom", "lt", "pd"].includes(t)); return H.rnd(on.length ? on : ["dom", "lt", "pd"]); }
  function randomSec(H, k, fn) {
    for (let i = 0; i < 80; i++) {
      const f = fn || pickFn(H), d = H.rnd(TARGETS[k.mode]);
      let qs = QUALS[f];
      if (f === "pd") qs = tMajor(k, d) ? ["m", "m7", "h7"] : ["h7"];
      const q = H.rnd(qs), sev = H.QUAL[q].length === 4, inv = Math.random() < .45 ? 0 : Math.floor(Math.random() * (sev ? 4 : 2));
      const s = sec(H, k, f, d, inv, q);
      if (!okSpell(s.c) || !H.isChromatic(k, s.c) || otherReading(H, k, s.c)) continue;
      return s;
    }
    return sec(H, H.key("C", "major"), "dom", 5, 0, "7");
  }
  const tonesTxt = (H, c) => c.tones.map(H.nm).join("–");
  // the key's own chord on a degree (in minor, VII is the major chord on the natural 7th)
  const diatChord = (H, k, d, sev = false, bass = 0) => k.mode === "minor" && d === 7 ? H.chord(H.deg(k, 7), sev ? "7" : "M", bass) : H.diat(k, d, sev, bass);
  const diatOn = (H, k, root) => { for (let d = 1; d <= 7; d++) { const n = H.deg(k, d); if (H.samePC(n, root)) return d; } return 0; };
  function why(H, k, s) {
    const c = s.c, root = c.tones[0], d0 = diatOn(H, k, root);
    const dc = d0 ? diatChord(H, k, d0, c.tones.length === 4) : null;
    const dist = s.fn === "dom" ? "a P4 above" : s.fn === "lt" ? "a m2 above" : "a M2 below";
    const inv = c.bass ? ` With the ${["root", "3rd", "5th", "7th"][c.bass]} (${H.nm(c.tones[c.bass])}) in the bass, it takes the figure ${(c.tones.length === 4 ? FIG7[c.bass] : FIG3[c.bass]).split("").join("/")}.` : "";
    return `{sym:${c.sym}} is ${tonesTxt(H, c)}, a ${H.QNAME[c.q]} chord.${dc ? ` In ${k.label} the chord on ${H.nm(root)} would be {sym:${dc.sym}}, so this one is chromatic.` : ` ${H.nm(root)} isn't in ${k.label}, so it's chromatic.`} Its quality makes it a ${FNSHORT[s.fn]}; the target is ${dist} the root: ${H.nm(s.T)} ({rn:${s.target}}).${inv} Label: {rn:${s.rn}}.`;
  }
  // A short progression around the chord: tonic, a diatonic chord, the secondary chord, its target (and the tonic again after V)
  function prog(H, k, s) {
    const fill = H.rnd([4, 6, 2, 3].filter(d => d !== s.d && !(k.mode === "minor" && d === 2)));
    const tgt = diatChord(H, k, s.d);
    const chords = [H.diat(k, 1), diatChord(H, k, fill), s.c], labels = [TGT_RN[k.mode][0], TGT_RN[k.mode][fill - 1], "?"];
    // a secondary leading-tone chord or pre-dominant is always followed by the secondary dominant of the same target
    if (s.fn !== "dom") { const v = domOf(H, k, s.d); chords.push(v.c); labels.push(v.rn); }
    chords.push(tgt); labels.push(s.target);
    if (s.d === 5) { chords.push(H.diat(k, 1)); labels.push(TGT_RN[k.mode][0]); }
    return { chords, labels };
  }
  const domOf = (H, k, d) => sec(H, k, "dom", d, 0, "7");
  function wrongLabels(H, k, s) {
    const out = new Set(), c = s.c, sev = c.tones.length === 4, inv = c.bass;
    const t = s.target, others = TARGETS[k.mode].filter(d => d !== s.d).map(d => TGT_RN[k.mode][d - 1]);
    const base = s.rn.split("/")[0];
    others.forEach(o => out.add(base + "/" + o));
    const figs = sev ? FIG7 : FIG3, b = base.replace(/(\d+)$/, "");
    figs.forEach((f, i) => { if (i !== inv) out.add((s.fn === "lt" && sev && i === 0 ? b + "7" : b + f) + "/" + t); });
    const fsev = sev ? FIG7[inv] : FIG3[inv];
    ["V", "vii°", "ii", "iiø"].forEach(x => { if (!base.startsWith(x === "ii" ? "ii" : x) || x === "iiø") out.add(x + (x === "iiø" ? FIG7[inv] : (x === "vii°" && sev && inv === 0 ? "7" : fsev)) + "/" + t); });
    out.delete(s.rn);
    const arr = H.shuffle([...out]);
    // one of each kind if possible: other target, other figure, other function
    const pick = [arr.find(x => x.startsWith(base + "/")), arr.find(x => x.split("/")[1] === t && x.startsWith(b) && x !== s.rn), arr.find(x => x.split("/")[1] === t && !x.startsWith(b))].filter(Boolean);
    return [...new Set(pick.concat(arr))].slice(0, 3);
  }
  const enh = (H, n) => n.a === 1 ? H.up(n, 1, 0) : n.a === -1 ? H.down(n, 1, 0) : null;
  function wrongSyms(H, k, s) {
    const c = s.c, out = new Set();
    const r = c.tones[0], e = enh(H, r);
    if (e && Math.abs(e.a) < 2) { const be = enh(H, c.tones[c.bass]); const bs = c.bass ? (be && Math.abs(be.a) < 2 ? H.nm(be) : H.nm(c.tones[c.bass])) : ""; out.add(H.nm(e) + H.QSYM[c.q] + (c.bass ? "/" + bs : "")); }
    // the other functions built for the same target, same inversion
    ["dom", "lt", "pd"].filter(f => f !== s.fn).forEach(f => { const q = f === "dom" ? (c.tones.length === 4 ? "7" : "M") : f === "lt" ? (c.tones.length === 4 ? "o7" : "d") : (c.tones.length === 4 ? "h7" : "m"); const o = sec(H, k, f, s.d, c.bass, q); if (okSpell(o.c)) out.add(o.c.sym); });
    // wrong inversion
    const ib = (c.bass + 1) % c.tones.length; out.add(H.chord(r, c.q, ib).sym);
    // the diatonic chord on the same root
    const d0 = diatOn(H, k, r); if (d0) out.add(diatChord(H, k, d0, c.tones.length === 4, c.bass).sym);
    out.delete(c.sym);
    return [...out];
  }

  function make(mode, H) {
    const k = pickKey(H), kt = k.mode === "major" ? "maj" : "min";
    if (mode === "func") {
      if (Math.random() < .2) {
        const d = H.rnd([2, 3, 4, 5, 6, 7].filter(x => !(k.mode === "minor" && x === 2))), sev = Math.random() < .5, c = H.diat(k, d, sev, 0);
        if (!H.QUAL[c.q]) return null;
        return H.mc(`In ${k.label}, what kind of chord is {sym:${c.sym}}?`, FN.dia, [FN.dom, FN.lt, FN.pd], `{sym:${c.sym}} is ${tonesTxt(H, c)}: every note belongs to ${k.label}${k.mode === "minor" ? " (with the raised leading tone)" : ""}, so it is a diatonic chord, ${H.rnOf(k, d)}${sev ? "7" : ""}, not a secondary one.`, { big: `{sym:${c.sym}}`, kicker: `Function · ${k.label}`, topic: [kt] });
      }
      const s = randomSec(H, k);
      return H.mc(`In ${k.label}, what kind of chord is {sym:${s.c.sym}}?`, FN[s.fn], [FN.dom, FN.lt, FN.pd, FN.dia], why(H, k, s), { big: `{sym:${s.c.sym}}`, kicker: `Function · ${k.label}`, topic: [kt, s.fn] });
    }
    if (mode === "label") {
      const s = randomSec(H, k);
      return H.mc(`In ${k.label}, label {sym:${s.c.sym}} with a Roman numeral.`, s.rn, wrongLabels(H, k, s), why(H, k, s), { big: `{sym:${s.c.sym}}`, kicker: `Label it · ${k.label}`, fmt: "rn", topic: [kt, s.fn] });
    }
    if (mode === "staff") {
      const s = randomSec(H, k), p = prog(H, k, s);
      const staff = H.grand({ key: k, chords: p.chords, labels: p.labels, hl: 2 });
      const ans = H.grand({ key: k, chords: p.chords, labels: p.labels.map(x => x === "?" ? s.rn : x), syms: p.chords.map(c => c.sym), hl: 2 });
      return H.mc(`Key: ${k.label}. Label the highlighted chord.`, s.rn, wrongLabels(H, k, s), why(H, k, s), { kicker: `On the staff · ${k.label}`, fmt: "rn", staff, staffAns: ans, playQ: H.playOf(staff), playQLabel: "Play the progression", play: H.playOf(staff), playLabel: "Play again", topic: [kt, s.fn] });
    }
    // spell
    const s = randomSec(H, k);
    return H.mc(`In ${k.label}, which chord is {rn:${s.rn}}?`, s.c.sym, wrongSyms(H, k, s), why(H, k, s), { big: s.rn, bigFmt: "rn", kicker: `Spell it · ${k.label}`, fmt: "sym", topic: [kt, s.fn] });
  }

  // ---------- reference ----------
  function reference(H) {
    return `<div class="ltable-wrap"><table class="ltable"><caption class="sr">Chord quality and secondary function</caption><thead><tr><th scope="col">Quality</th><th scope="col">Function</th><th scope="col">Label</th><th scope="col">Target root</th></tr></thead><tbody>
      <tr><td>major, or any dom7 (other than V⁷)</td><td>secondary dominant</td><td>${H.rnHTML("V/x")}, ${H.rnHTML("V7/x")}</td><td>P4 above the root</td></tr>
      <tr><td>fully diminished 7th (°7)</td><td>secondary leading-tone</td><td>${H.rnHTML("vii°7/x")}</td><td>m2 above the root</td></tr>
      <tr><td>minor, m7 or half-diminished (ø7)</td><td>secondary pre-dominant</td><td>${H.rnHTML("ii/x")}, ${H.rnHTML("iiø7/x")}</td><td>M2 below the root</td></tr></tbody></table></div>
      <div class="ltable-wrap"><table class="ltable"><caption class="sr">Inversion figures</caption><thead><tr><th scope="col">Bass</th><th scope="col">Triad</th><th scope="col">Seventh chord</th></tr></thead><tbody>
      <tr><td>root</td><td>(none)</td><td>7</td></tr><tr><td>3rd</td><td>6</td><td>6/5</td></tr><tr><td>5th</td><td>6/4</td><td>4/3</td></tr><tr><td>7th</td><td>—</td><td>4/2</td></tr></tbody></table></div>
      <p class="legend">Spelling counts: the secondary leading tone is a half step <i>below</i> the target's root, spelled as its lower neighbor (D♯ to E, never E♭).</p>`;
  }

  // ---------- lesson ----------
  const lesson = { steps: [
    { title: "What makes a chord “secondary”?", kick: "Tonicization", keyed: "both", render: (H, k, U) => {
      const s = sec(H, k, "dom", 5, 0, "7");
      const g = H.grand({ key: k, chords: [H.diat(k, 1), H.diat(k, k.mode === "major" ? 2 : 4), s.c, H.diat(k, 5), H.diat(k, 1)], labels: [TGT_RN[k.mode][0], TGT_RN[k.mode][k.mode === "major" ? 1 : 3], s.rn, "V", TGT_RN[k.mode][0]], syms: [], hl: 2 });
      return `<p>A <b>secondary</b> chord is a chromatic chord that briefly treats some chord other than the tonic as if it were a tonic. That is called <b>tonicization</b>. It doesn't change the key: only a cadence can confirm a new key.</p>
      <p>The three common kinds are <b>secondary dominants</b> ({rn:V/x}, {rn:V7/x}), <b>secondary leading-tone chords</b> ({rn:vii°7/x}) and <b>secondary pre-dominants</b> ({rn:ii/x}, {rn:iiø7/x}). The “x” is the <b>target</b>: the chord being tonicized.</p>`.replace(/\{rn:([^}]+)\}/g, (_, t) => U.rn(t))
      + U.fig(g, `In ${k.label}: ${H.nm(s.c.tones[1])} is not in the key. It leads up to ${H.nm(H.deg(k, 5))}, the root of V, so the highlighted chord is ${s.rn} (“five-seven of five”).`)
      + `<div class="callout"><b>The short version</b>Major or 7 (dom7) where the key would give a different chord → secondary dominant. °7 (dim7) → secondary leading-tone chord. ø7 (half-dim7) or minor where the key would give a different chord → secondary pre-dominant.</div>`;
    } },
    { title: "Step 1: Name the chord", kick: "Stack it in thirds", keyed: "both", render: (H, k, U) => {
      const ex = [sec(H, k, "dom", k.mode === "major" ? 6 : 4, 2, "7"), sec(H, k, "lt", 5, 1, "o7"), sec(H, k, "pd", 5, 0, "h7")].filter(s => s.c.tones.every(n => Math.abs(n.a) < 2));
      const row = s => { const c = s.c, bass = c.tones[c.bass], rest = H.shuffle(c.tones.filter((_, i) => i !== c.bass)); return `<tr><td>${[bass, ...rest].map(H.nm).map(H.accHTML).join(", ")}</td><td>${H.accHTML(c.tones.map(H.nm).join("–"))}</td><td>${H.accHTML(H.nm(c.tones[0]))}</td><td>${H.QNAME[c.q]}</td><td>${U.sym(c.sym)}</td></tr>`; };
      return `<p>Before you can tell what a chord <i>does</i>, you need to know what it <i>is</i>. Gather every note sounding (in all staves), then:</p>
      <ol><li><b>Stack the notes in thirds.</b> Rearrange the letters so each is a third above the last. The bottom note of the stack is the <b>root</b>.</li>
      <li><b>Identify the quality</b> from the intervals above the root: major, minor, diminished, dominant 7th, fully diminished 7th, half-diminished 7th…</li>
      <li><b>Check the bass.</b> If the lowest note isn't the root, add a slash and the bass note: the chord is inverted.</li></ol>
      <div class="ltable-wrap"><table class="ltable"><caption class="sr">Naming three chords in ${H.esc(k.label)}</caption><thead><tr><th scope="col">Notes (bass first)</th><th scope="col">In thirds</th><th scope="col">Root</th><th scope="col">Quality</th><th scope="col">Name</th></tr></thead><tbody>${ex.map(row).join("")}</tbody></table></div>
      <p class="note">Tip: if you're not sure how to stack the notes, try each note as the root until the others fall into thirds above it.</p>`;
    } },
    { title: "Step 2: Read the quality", kick: "Quality → function", keyed: "both", render: (H, k, U) => {
      const v2 = sec(H, k, k.mode === "major" ? "dom" : "dom", k.mode === "major" ? 5 : 4, 0, k.mode === "major" ? "M" : "M");
      const d0 = diatOn(H, k, v2.c.tones[0]), dia = H.diat(k, d0);
      const g = H.grand({ key: k, chords: [dia, v2.c], labels: [H.rnOf(k, d0), v2.rn], syms: [dia.sym, v2.c.sym] });
      return `<p>Compare the chord with the chord the key would normally give you on that root. If the quality doesn't match the key, the chord is chromatic, and its quality points to its function:</p>
      <div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">If the chord is…</th><th scope="col">Function</th><th scope="col">Label</th></tr></thead><tbody>
      <tr><td>a <b>major</b> triad where the key has a different quality, or any <b>dominant 7th</b></td><td>Secondary dominant</td><td>${U.rn("V/x")} or ${U.rn("V7/x")}</td></tr>
      <tr><td>a <b>fully diminished 7th</b> (°7)</td><td>Secondary leading-tone chord</td><td>${U.rn("vii°7/x")}</td></tr>
      <tr><td>a <b>half-diminished 7th</b> (ø7), or a <b>minor</b> triad where the key has a different quality</td><td>Secondary pre-dominant</td><td>${U.rn("iiø7/x")} or ${U.rn("ii/x")}</td></tr></tbody></table></div>`
      + U.fig(g, `Same root, different quality: in ${k.label}, ${dia.sym} is diatonic (${H.rnOf(k, d0)}); ${v2.c.sym} is chromatic, a major chord where the key has a ${H.QNAME[dia.q]} one.`)
      + `<p><b>Why “any dominant 7th”?</b> A dom7 is so strongly tied to dominant function that it signals a secondary dominant even on a root that is already major: in a major key the I chord with a minor 7th added is ${U.rn("V7/IV")}. The only dom7 that is <i>not</i> secondary is the key's own ${U.rn("V7")}.</p>`
      + H.check(`In ${k.label}, a fully diminished seventh chord appears. What is it most likely to be?`, "a secondary leading-tone chord", ["a secondary dominant", "a secondary pre-dominant", "a borrowed tonic"], "°7 quality → vii°7/x.");
    } },
    { title: "Step 3: Find the target", kick: "Write the label", keyed: "both", render: (H, k, U) => {
      const t = 5, ss = [sec(H, k, "dom", t, 0, "7"), sec(H, k, "lt", t, 0, "o7"), sec(H, k, "pd", t, 0, "h7")];
      const v7 = domOf(H, k, t), V = H.diat(k, t);
      const figs = ss.map(s => { const ch = s.fn === "dom" ? [s.c, V] : [s.c, v7.c, V], lb = s.fn === "dom" ? [s.rn, "V"] : [s.rn, v7.rn, "V"]; return U.fig(H.grand({ key: k, chords: ch, labels: lb, syms: ch.map(c => c.sym), hl: 0 }), `${s.c.sym} → ${H.nm(s.T)}: ${FNSHORT[s.fn]}${s.fn === "dom" ? "" : `, followed by the secondary dominant of the same target (${v7.c.sym})`}`, { small: true }); }).join("");
      return `<p>Every secondary chord points to a <b>target</b> chord (the “x” in V/x). Each function has its own distance from its root to the target's root:</p>
      <div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Function</th><th scope="col">Target's root is…</th><th scope="col">In ${H.esc(k.label)} (target ${H.esc(H.nm(H.deg(k, t)))}, V)</th></tr></thead><tbody>
      <tr><td>Secondary dominant</td><td>a P4 <b>above</b> (P5 below) the chord root</td><td>${U.sym(ss[0].c.sym)} → ${U.rn(ss[0].rn)}</td></tr>
      <tr><td>Secondary leading-tone</td><td>a m2 <b>above</b> the chord root</td><td>${U.sym(ss[1].c.sym)} → ${U.rn(ss[1].rn)}</td></tr>
      <tr><td>Secondary pre-dominant</td><td>a M2 <b>below</b> the chord root</td><td>${U.sym(ss[2].c.sym)} → ${U.rn(ss[2].rn)}</td></tr></tbody></table></div>
      <div class="lfigs">${figs}</div>`;
    } },
    { title: "Inversions: the figures", kick: "Slash chords", keyed: "both", render: (H, k, U) => {
      const d = k.mode === "major" ? 5 : 4, inv = [0, 1, 2, 3].map(i => sec(H, k, "dom", d, i, "7"));
      const g = H.grand({ key: k, chords: inv.map(s => s.c), labels: inv.map(s => s.rn), syms: inv.map(s => s.c.sym) });
      return `<p>If the chord is inverted (it has a slash bass), add the inversion figure to the Roman numeral, before the slash:</p>
      <div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Bass note</th><th scope="col">Triad</th><th scope="col">Seventh chord</th></tr></thead><tbody>
      <tr><td>Root</td><td>(none)</td><td>7</td></tr><tr><td>3rd</td><td>6</td><td>6/5</td></tr><tr><td>5th</td><td>6/4</td><td>4/3</td></tr><tr><td>7th</td><td>—</td><td>4/2</td></tr></tbody></table></div>`
      + U.fig(g, `${inv[0].rn.split("/")[0]} of ${inv[0].target} in all four positions.`)
      + H.check(`In ${k.label}, which label fits {sym:${inv[2].c.sym}}?`, inv[2].rn, [inv[1].rn, inv[3].rn, inv[0].rn], `The 5th (${H.nm(inv[2].c.tones[2])}) is in the bass: 4/3.`, "rn");
    } },
    { title: "Examples", kick: "Hear them resolve", keyed: "both", render: (H, k, U) => {
      const fam = (fn, list) => list.map(([d, inv, q]) => { const s = sec(H, k, fn, d, inv, q); if (!okSpell(s.c) || !H.isChromatic(k, s.c)) return ""; const tg = diatChord(H, k, d), v = domOf(H, k, d); const ch = fn === "dom" ? [s.c, tg] : [s.c, v.c, tg], lb = fn === "dom" ? [s.rn, s.target] : [s.rn, v.rn, s.target]; return U.fig(H.grand({ key: k, chords: ch, labels: lb, syms: ch.map(c => c.sym), hl: 0 }), `${s.c.sym}: ${s.c.tones.map(H.nm).join("–")}`, { small: true }); }).join("");
      const M = k.mode === "major";
      return `<p>Each example is in a simple keyboard texture: three notes in the right hand and one in the left. Play each one and listen for the chromatic note leading into the target. Secondary leading-tone chords and secondary pre-dominants are shown as they usually appear: followed by the secondary dominant of the same target, then the target itself.</p>
      <h3>Secondary dominants</h3><div class="lfigs">${fam("dom", M ? [[5, 0, "7"], [6, 2, "7"], [2, 0, "M"]] : [[4, 0, "7"], [6, 1, "7"], [5, 3, "7"]])}</div>
      <h3>Secondary leading-tone chords</h3><div class="lfigs">${fam("lt", M ? [[5, 1, "o7"], [2, 0, "o7"], [6, 0, "o7"]] : [[5, 1, "o7"], [4, 0, "o7"], [6, 0, "o7"]])}</div>
      <h3>Secondary pre-dominants</h3><div class="lfigs">${fam("pd", M ? [[5, 0, "h7"], [4, 0, "m7"], [2, 1, "h7"]] : [[6, 0, "m"], [4, 0, "h7"], [6, 1, "m7"]])}</div>`;
    } },
    { title: "Spelling counts", kick: "Lower neighbor", keyed: "both", render: (H, k, U) => {
      const d = 5, T = H.deg(k, d), lt = H.down(T, 1, 1), sd = sec(H, k, "dom", d, 0, "7"), sl = sec(H, k, "lt", d, 0, "o7"), sp = sec(H, k, "pd", d, 0, "m");
      const e = enh(H, lt);
      return `<p>Secondary dominants and secondary leading-tone chords both contain a <b>secondary leading tone</b>, a half step <i>below</i> the target's root. It is always spelled as the target's lower neighbor.</p>
      <ol><li>Find the target's root. For ${U.rn("V")} in ${H.esc(k.label)}: <b>${H.accHTML(H.nm(T))}</b>.</li>
      <li>Find the note a half step below it, spelled with the letter below: <b>${H.accHTML(H.nm(lt))}</b>${e && Math.abs(e.a) < 2 ? ` (not ${H.accHTML(H.nm(e))})` : ""}.</li>
      <li>Build the chord. As the <b>3rd</b> of a dom7: ${U.sym(sd.c.sym)} = ${U.rn(sd.rn)}. As the <b>root</b> of a dim7: ${U.sym(sl.c.sym)} = ${U.rn(sl.rn)}.</li></ol>
      <p>For a <b>secondary pre-dominant</b>, start a whole step <i>above</i> the target's root: ${U.sym(sp.c.sym)} = ${U.rn(sp.rn)} (minor for a major target; ø7 for a minor target).</p>
      <div class="callout"><b>Why not respell?</b>Each note shows where it is going. The raised note leads <i>up</i> to the target's root and a lowered 7th leads <i>down</i>. An enharmonic respelling hides that.</div>`
      + H.check(`Which chord is ${"{rn:vii°7/V}"} in ${k.label}?`, sl.c.sym, [e && Math.abs(e.a) < 2 ? H.nm(e) + "°7" : sd.c.sym, sd.c.sym, H.chord(T, "o7").sym].filter((x, i, a) => x !== sl.c.sym && a.indexOf(x) === i), "Its root is the secondary leading tone, spelled as the lower neighbor.", "sym");
    } },
    { title: "Quick check", kick: "Before the drills", keyed: "both", render: (H, k) => {
      const qs = [];
      const s1 = randomSec(H, k, "dom"), s2 = randomSec(H, k, "lt"), s3 = randomSec(H, k, "pd");
      qs.push(H.check(`In ${k.label}, what is {sym:${s1.c.sym}}?`, s1.rn, wrongLabels(H, k, s1), why(H, k, s1), "rn"));
      qs.push(H.check(`In ${k.label}, what is {sym:${s2.c.sym}}?`, s2.rn, wrongLabels(H, k, s2), why(H, k, s2), "rn"));
      qs.push(H.check(`What kind of chord is {sym:${s3.c.sym}} in ${k.label}?`, FN.pd, [FN.dom, FN.lt, FN.dia], why(H, k, s3)));
      return `<p>Three questions in ${H.esc(k.label)}. Pick another key above for a new set.</p>${qs.join("")}`;
    } },
  ] };

  return {
    key: "silverapps-secondary-v1", lesson, make, reference,
    modes: [{ id: "func", kicker: "Function" }, { id: "label", kicker: "Label it" }, { id: "staff", kicker: "On the staff" }, { id: "spell", kicker: "Spell it" }],
    topics: [{ id: "maj", name: "Major keys", group: "keys" }, { id: "min", name: "Minor keys", group: "keys" },
      { id: "dom", name: "Secondary dominants", group: "fn" }, { id: "lt", name: "Leading-tone chords", group: "fn" }, { id: "pd", name: "Pre-dominants", group: "fn" }],
  };
})();
