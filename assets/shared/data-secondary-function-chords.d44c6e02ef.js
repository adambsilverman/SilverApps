
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
  // Secondary leading-tone chords are always fully diminished 7ths. Secondary pre-dominants: ii or ii7 (minor, m7) when the target is major; iiø7 only when the target is minor.
  const QUALS = { dom: ["7", "7", "M"], lt: ["o7"], pd: ["m", "m7"] };
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
      if (f === "pd") qs = tMajor(k, d) ? ["m", "m7"] : ["h7"];
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
    // every pattern ends with a cadence: authentic (V7–I) or a half cadence on V7 (never on a plain V)
    const V7 = H.diat(k, 5, true);
    if (s.d === 5) { chords.push(V7); labels.push("V7"); } else { chords.push(tgt, V7); labels.push(s.target, "V7"); }
    if (Math.random() < .65) { chords.push(H.diat(k, 1)); labels.push(TGT_RN[k.mode][0]); }
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
      <tr><td>minor or m7 (target is a major chord); half-diminished ø7 (target is a minor chord)</td><td>secondary pre-dominant</td><td>${H.rnHTML("ii/x")}, ${H.rnHTML("ii7/x")}; ${H.rnHTML("iiø7/x")}</td><td>M2 below the root</td></tr></tbody></table></div>
      <div class="ltable-wrap"><table class="ltable"><caption class="sr">Inversion figures</caption><thead><tr><th scope="col">Bass</th><th scope="col">Triad</th><th scope="col">Seventh chord</th></tr></thead><tbody>
      <tr><td>root</td><td>(none)</td><td>7</td></tr><tr><td>3rd</td><td>6</td><td>6/5</td></tr><tr><td>5th</td><td>6/4</td><td>4/3</td></tr><tr><td>7th</td><td>—</td><td>4/2</td></tr></tbody></table></div>
      <p class="legend">Spelling counts: the secondary leading tone is a half step <i>below</i> the target's root, spelled as its lower neighbor (D♯ to E, never E♭).</p>`;
  }

  // examples from Dr. Silverman's course materials (assets/img|audio/secondary); lyrics removed, excerpts used for educational purposes
  const SX = (f, w, h, alt, cap, aud, max) => { if (aud && !Array.isArray(aud)) { max = aud; aud = null; } return `<figure class="lfig"${max ? ` style="max-width:${max}px;margin-inline:auto"` : ""}>${aud ? `<audio controls preload="none" src="assets/audio/secondary/${aud[0]}.mp3" aria-label="${aud[1]}" style="width:100%">Your browser can't play this audio clip.</audio>` : ""}<img src="assets/img/secondary/${f}" width="${w}" height="${h}" alt="${alt}" loading="lazy" style="width:100%;height:auto;background:#fff">${cap ? `<figcaption>${cap}</figcaption>` : ""}</figure>`; };
  // step 1's switchable circle progression: [diatonic degree, its label, the secondary dominant that replaces it]
  const SWAP = [[3, "iii7", "V7/vi"], [6, "vi7", "V7/ii"], [2, "ii7", "V7/V"]], DEG_AFTER = { 3: 6, 6: 2, 2: 5 }, SWON = [false, false, false];
  // ---------- lesson ----------
  const lesson = { steps: [
    { part: "Reading secondary chords", title: "What makes a chord “secondary”?", kick: "Tonicization", keyed: "major", render: (H, k, U) => `<p>A <b>secondary</b> chord is a chromatic chord that briefly treats some chord other than the tonic as if it were a tonic. That is called <b>tonicization</b>. It doesn't change the key: only a cadence can confirm a new key.</p>
      <p>The three common kinds are <b>secondary dominants</b> ({rn:V/x}, {rn:V7/x}), <b>secondary leading-tone chords</b> ({rn:vii°7/x}) and <b>secondary pre-dominants</b> ({rn:ii/x} or {rn:ii7/x} for a major target, {rn:iiø7/x} for a minor target). The “x” is the <b>target</b>: the chord being tonicized.</p>
      <p>Hear it in a circle progression with 5̂–5̂–5̂–4̂–4̂–3̂ on top. Each switch turns a diatonic minor 7th chord into the dom7 that leads to the next chord: its 3rd goes up a half step and becomes a secondary leading tone. When that note is in the melody, you'll hear 5̂ or 4̂ raised.</p>
      <div class="sw-tog" role="group" aria-label="Swap in secondary dominants">${SWAP.map((w, i) => `<button class="lk" data-swap="${i}" aria-pressed="${!!SWON[i]}">${U.rn(w[1])} → ${U.rn(w[2])}</button>`).join("")}</div>
      <figure class="lfig"><div class="staff wide" id="swFig"></div><figcaption id="swCap"></figcaption><button class="play" id="swPlay"><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M7 4v16l13-8z" fill="currentColor"/></svg>Play</button></figure>`.replace(/\{rn:([^}]+)\}/g, (_, t) => U.rn(t))
      + `<div class="callout"><b>The short version</b>Major or 7 (dom7) where the key would give a different chord → secondary dominant. °7 (dim7) → secondary leading-tone chord. Minor or m7 where the key would give a different chord → secondary pre-dominant of a <i>major</i> chord; ø7 (half-dim7) → secondary pre-dominant of a <i>minor</i> chord.</div>`,
      after: (root, H, k, tools) => {
        // I – iii7 – vi7 – ii7 – V7 – I, with each minor 7th swappable for the secondary dominant of the chord after it
        let spec = null;
        const draw = () => {
          const ch = [H.diat(k, 1)], lb = ["I"], chromatic = [];
          SWAP.forEach(([d, rn], i) => { if (SWON[i]) { const s = sec(H, k, "dom", DEG_AFTER[d], 0, "7"); ch.push(s.c); lb.push(s.rn); chromatic.push(`{sym:${s.c.sym}} = ${H.nm(s.c.tones[1])} leads up to ${H.nm(H.deg(k, DEG_AFTER[d]))}`); } else { ch.push(H.diat(k, d, true)); lb.push(rn); } });
          ch.push(H.diat(k, 5, true), H.diat(k, 1)); lb.push("V7", "I");
          // hand voicing: the melody is 5̂–5̂–5̂–4̂–4̂–3̂ (raised to ♯5̂ or ♯4̂ when a secondary dominant needs it), two inner notes just below it, the root in the bass
          const top = [5, 5, 5, 4, 4, 3]; let prevS = null;
          ch.forEach((c, i) => {
            const L = H.deg(k, top[i]).l, st = c.tones.find(t => t.l === L), rest = c.tones.filter(t => t !== st);
            const inner = (rest.length > 2 ? rest.filter(t => t !== c.tones[0]) : rest).slice(0, 2);
            const at = (t, lo, hi) => { for (let o = 1; o < 7; o++) { const n = H.N(t.l, t.a, o), m = H.midi(n); if (m >= lo && m <= hi) return n; } return H.N(t.l, t.a, 4); };
            const sop = prevS == null ? at(st, 65, 76) : at(st, H.midi(prevS) - 6, H.midi(prevS) + 5); prevS = sop;
            const upper = inner.map(t => at(t, H.midi(sop) - 12, H.midi(sop) - 1)).concat(sop).sort((x, y) => H.midi(x) - H.midi(y));
            c.v = { bass: at(c.tones[0], 41, 52), upper };
          });
          spec = H.grand({ key: k, chords: ch, labels: lb, syms: ch.map(c => c.sym), hl: SWAP.map((_, i) => SWON[i] ? i + 1 : -1).filter(x => x > 0) });
          tools.drawStaff(root.querySelector("#swFig"), spec);
          root.querySelector("#swCap").innerHTML = H.rich(`In ${k.label}: ${lb.map(l => "{rn:" + l + "}").join(" – ")}. ` + (chromatic.length ? `Highlighted: ${chromatic.join("; ")}.` : "All six chords are diatonic. Switch one on to hear a secondary dominant."));
        };
        root.querySelectorAll("[data-swap]").forEach(b => b.addEventListener("click", () => { const i = +b.dataset.swap; SWON[i] = !SWON[i]; b.setAttribute("aria-pressed", SWON[i]); draw(); tools.play(H.playOf(spec)); }));
        root.querySelector("#swPlay").addEventListener("click", () => tools.play(H.playOf(spec)));
        draw();
      } },
    { part: "Reading secondary chords", title: "Step 1: Name the chord", kick: "Stack it in thirds", keyed: "both", render: (H, k, U) => {
      const ex = [sec(H, k, "dom", k.mode === "major" ? 6 : 4, 2, "7"), sec(H, k, "lt", 5, 1, "o7"), sec(H, k, "pd", k.mode === "major" ? 2 : 4, 0, "h7")].filter(s => s.c.tones.every(n => Math.abs(n.a) < 2));
      const row = s => { const c = s.c, bass = c.tones[c.bass], rest = H.shuffle(c.tones.filter((_, i) => i !== c.bass)); return `<tr><td>${[bass, ...rest].map(H.nm).map(H.accHTML).join(", ")}</td><td>${H.accHTML(c.tones.map(H.nm).join("–"))}</td><td>${H.accHTML(H.nm(c.tones[0]))}</td><td>${H.QNAME[c.q]}</td><td>${U.sym(c.sym)}</td></tr>`; };
      return `<p>Before you can tell what a chord <i>does</i>, you need to know what it <i>is</i>. Gather every note sounding (in all staves), then:</p>
      <ol><li><b>Stack the notes in thirds.</b> Rearrange the letters so each is a third above the last. The bottom note of the stack is the <b>root</b>.</li>
      <li><b>Identify the quality</b> from the intervals above the root: major, minor, diminished, dominant 7th, fully diminished 7th, half-diminished 7th…</li>
      <li><b>Check the bass.</b> If the lowest note isn't the root, add a slash and the bass note: the chord is inverted.</li></ol>
      <div class="ltable-wrap"><table class="ltable"><caption class="sr">Naming three chords in ${H.esc(k.label)}</caption><thead><tr><th scope="col">Notes (bass first)</th><th scope="col">In thirds</th><th scope="col">Root</th><th scope="col">Quality</th><th scope="col">Name</th></tr></thead><tbody>${ex.map(row).join("")}</tbody></table></div>
      <p class="note">Tip: if you're not sure how to stack the notes, try each note as the root until the others fall into thirds above it.</p>`;
    } },
    { part: "Reading secondary chords", title: "Step 2: Read the quality", kick: "Quality → function", keyed: "both", render: (H, k, U) => {
      const v2 = sec(H, k, k.mode === "major" ? "dom" : "dom", k.mode === "major" ? 5 : 4, 0, k.mode === "major" ? "M" : "M");
      const d0 = diatOn(H, k, v2.c.tones[0]), dia = H.diat(k, d0);
      const g = H.grand({ key: k, chords: [dia, v2.c], labels: [H.rnOf(k, d0), v2.rn], syms: [dia.sym, v2.c.sym] });
      return `<p>Compare the chord with the chord the key would normally give you on that root. If the quality doesn't match the key, the chord is chromatic, and its quality points to its function:</p>
      <div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">If the chord is…</th><th scope="col">Function</th><th scope="col">Label</th></tr></thead><tbody>
      <tr><td>a <b>major</b> triad where the key has a different quality, or any <b>dominant 7th</b></td><td>Secondary dominant</td><td>${U.rn("V/x")} or ${U.rn("V7/x")}</td></tr>
      <tr><td>a <b>fully diminished 7th</b> (°7)</td><td>Secondary leading-tone chord</td><td>${U.rn("vii°7/x")}</td></tr>
      <tr><td>a <b>minor</b> triad or <b>m7</b> chord where the key has a different quality (the target is major)</td><td>Secondary pre-dominant</td><td>${U.rn("ii/x")} or ${U.rn("ii7/x")}</td></tr><tr><td>a <b>half-diminished 7th</b> (ø7) (the target is minor)</td><td>Secondary pre-dominant</td><td>${U.rn("iiø7/x")}</td></tr></tbody></table></div>`
      + U.fig(g, `Same root, different quality: in ${k.label}, ${dia.sym} is diatonic (${H.rnOf(k, d0)}); ${v2.c.sym} is chromatic, a major chord where the key has a ${H.QNAME[dia.q]} one.`)
      + `<p><b>Why “any dominant 7th”?</b> A dom7 is so strongly tied to dominant function that it signals a secondary dominant even on a root that is already major: in a major key the I chord with a minor 7th added is ${U.rn("V7/IV")}. The only dom7 that is <i>not</i> secondary is the key's own ${U.rn("V7")}.</p>`
      + H.check(`In ${k.label}, a fully diminished seventh chord appears. What is it most likely to be?`, "a secondary leading-tone chord", ["a secondary dominant", "a secondary pre-dominant", "a borrowed tonic"], "°7 quality → vii°7/x.");
    } },
    { part: "Reading secondary chords", title: "Step 3: Find the target", kick: "Write the label", keyed: "both", render: (H, k, U) => {
      const t = k.mode === "major" ? 4 : 6, TR = TGT_RN[k.mode][t - 1], ss = [sec(H, k, "dom", t, 0, "7"), sec(H, k, "lt", t, 0, "o7"), sec(H, k, "pd", t, 0, "m7")];
      const v7 = domOf(H, k, t), V = diatChord(H, k, t);
      const figs = ss.map(s => { const I0 = H.diat(k, 1), T0 = TGT_RN[k.mode][0], V7c = H.diat(k, 5, true), ch = (s.fn === "dom" ? [I0, s.c, V] : [I0, s.c, v7.c, V]).concat([V7c, I0]), lb = (s.fn === "dom" ? [T0, s.rn, TR] : [T0, s.rn, v7.rn, TR]).concat(["V7", T0]); return U.fig(H.grand({ key: k, chords: ch, labels: lb, syms: ch.map(c => c.sym), hl: 1 }), `${s.c.sym} → ${H.nm(s.T)}: ${FNSHORT[s.fn]}${s.fn === "dom" ? "" : `, followed by the secondary dominant of the same target (${v7.c.sym})`}`, { small: true }); }).join("");
      return `<p>Every secondary chord points to a <b>target</b> chord (the “x” in V/x). Each function has its own distance from its root to the target's root:</p>
      <div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Function</th><th scope="col">Target's root is…</th><th scope="col">In ${H.esc(k.label)} (target ${H.esc(H.nm(H.deg(k, t)))}, ${TR})</th></tr></thead><tbody>
      <tr><td>Secondary dominant</td><td>a P4 <b>above</b> (P5 below) the chord root</td><td>${U.sym(ss[0].c.sym)} → ${U.rn(ss[0].rn)}</td></tr>
      <tr><td>Secondary leading-tone</td><td>a m2 <b>above</b> the chord root</td><td>${U.sym(ss[1].c.sym)} → ${U.rn(ss[1].rn)}</td></tr>
      <tr><td>Secondary pre-dominant</td><td>a M2 <b>below</b> the chord root</td><td>${U.sym(ss[2].c.sym)} → ${U.rn(ss[2].rn)}</td></tr></tbody></table></div>
      <p class="note">The target here is major, so the pre-dominant is minor (ii or ii⁷). When the target is a minor chord, it is half-diminished: iiø⁷/x.</p>
      <div class="lfigs">${figs}</div>`;
    } },
    { part: "Reading secondary chords", title: "Inversions: the figures", kick: "Slash chords", keyed: "both", render: (H, k, U) => {
      const d = k.mode === "major" ? 5 : 4, inv = [0, 1, 2, 3].map(i => sec(H, k, "dom", d, i, "7"));
      const g = H.grand({ key: k, chords: inv.map(s => s.c), labels: inv.map(s => s.rn), syms: inv.map(s => s.c.sym) });
      return `<p>If the chord is inverted (it has a slash bass), add the inversion figure to the Roman numeral, before the slash:</p>
      <div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Bass note</th><th scope="col">Triad</th><th scope="col">Seventh chord</th></tr></thead><tbody>
      <tr><td>Root</td><td>(none)</td><td>7</td></tr><tr><td>3rd</td><td>6</td><td>6/5</td></tr><tr><td>5th</td><td>6/4</td><td>4/3</td></tr><tr><td>7th</td><td>—</td><td>4/2</td></tr></tbody></table></div>`
      + U.fig(g, `${inv[0].rn.split("/")[0]} of ${inv[0].target} in all four positions.`)
      + H.check(`In ${k.label}, which label fits {sym:${inv[2].c.sym}}?`, inv[2].rn, [inv[1].rn, inv[3].rn, inv[0].rn], `The 5th (${H.nm(inv[2].c.tones[2])}) is in the bass: 4/3.`, "rn");
    } },
    { part: "Reading secondary chords", title: "Examples", kick: "Hear them resolve", keyed: "both", render: (H, k, U) => {
      // Each example starts on the tonic (so the key is heard and seen), tonicizes the target, then returns home with V–I.
      const I = H.diat(k, 1), V7 = H.diat(k, 5, true), T0 = TGT_RN[k.mode][0];
      const fam = (fn, list) => list.map(([d, inv, q]) => { const s = sec(H, k, fn, d, inv, q); if (!okSpell(s.c) || !H.isChromatic(k, s.c)) return ""; const tg = diatChord(H, k, d), v = domOf(H, k, d);
        const ch = [I, s.c], lb = [T0, s.rn]; if (fn !== "dom") { ch.push(v.c); lb.push(v.rn); } ch.push(tg); lb.push(s.target);
        if (d === 5) { ch[ch.length - 1] = V7; lb[lb.length - 1] = "V7"; } else { ch.push(V7); lb.push("V7"); } ch.push(I); lb.push(T0);
        return U.fig(H.grand({ key: k, chords: ch, labels: lb, syms: ch.map(c => c.sym), hl: 1 }), `${k.label}. The highlighted chord: ${s.c.sym} = ${s.c.tones.map(H.nm).join("–")}.`); }).join("");
      const M = k.mode === "major";
      return `<p>Each example is in a simple keyboard texture (three notes in the right hand, one in the left) and is heard in its key: it starts on the tonic, tonicizes the target, and comes home with an authentic cadence (V⁷–I). Play each one and listen for the chromatic note leading into the target, and for the return to the home key. Secondary leading-tone chords and secondary pre-dominants are shown as they usually appear: followed by the secondary dominant of the same target, then the target itself.</p>
      <h3>Secondary dominants</h3><div class="lfigs one">${fam("dom", M ? [[5, 0, "7"], [6, 2, "7"], [2, 0, "M"]] : [[4, 0, "7"], [6, 1, "7"], [5, 3, "7"]])}</div>
      <h3>Secondary leading-tone chords</h3><div class="lfigs one">${fam("lt", M ? [[5, 1, "o7"], [2, 0, "o7"], [6, 0, "o7"]] : [[5, 1, "o7"], [4, 0, "o7"], [6, 0, "o7"]])}</div>
      <h3>Secondary pre-dominants</h3><div class="lfigs one">${fam("pd", M ? [[4, 0, "m7"], [2, 1, "h7"], [3, 0, "h7"]] : [[6, 0, "m"], [4, 0, "h7"], [6, 1, "m7"]])}</div>`;
    } },
    { part: "Reading secondary chords", title: "Spelling counts", kick: "Lower neighbor", keyed: "both", render: (H, k, U) => {
      const d = 5, T = H.deg(k, d), lt = H.down(T, 1, 1), sd = sec(H, k, "dom", d, 0, "7"), sl = sec(H, k, "lt", d, 0, "o7"), sp = sec(H, k, "pd", k.mode === "major" ? 4 : 6, 0, "m");   // ii/x needs a major target (V would give a diatonic chord)
      const e = enh(H, lt);
      return `<p>Secondary dominants and secondary leading-tone chords both contain a <b>secondary leading tone</b>, a half step <i>below</i> the target's root. It is always spelled as the target's lower neighbor.</p>
      <ol><li>Find the target's root. For ${U.rn("V")} in ${H.esc(k.label)}: <b>${H.accHTML(H.nm(T))}</b>.</li>
      <li>Find the note a half step below it, spelled with the letter below: <b>${H.accHTML(H.nm(lt))}</b>${e && Math.abs(e.a) < 2 ? ` (not ${H.accHTML(H.nm(e))})` : ""}.</li>
      <li>Build the chord. As the <b>3rd</b> of a dom7: ${U.sym(sd.c.sym)} = ${U.rn(sd.rn)}. As the <b>root</b> of a dim7: ${U.sym(sl.c.sym)} = ${U.rn(sl.rn)}.</li></ol>
      <p>For a <b>secondary pre-dominant</b>, start a whole step <i>above</i> the target's root: ${U.sym(sp.c.sym)} = ${U.rn(sp.rn)} (minor for a major target; ø7 for a minor target).</p>
      <div class="callout"><b>Why not respell?</b>Each note shows where it is going. The raised note leads <i>up</i> to the target's root and a lowered 7th leads <i>down</i>. An enharmonic respelling hides that.</div>`
      + H.check(`Which chord is ${"{rn:vii°7/V}"} in ${k.label}?`, sl.c.sym, [e && Math.abs(e.a) < 2 ? H.nm(e) + "°7" : sd.c.sym, sd.c.sym, H.chord(T, "o7").sym].filter((x, i, a) => x !== sl.c.sym && a.indexOf(x) === i), "Its root is the secondary leading tone, spelled as the lower neighbor.", "sym");
    } },
    { part: "Reading secondary chords", title: "Quick check", kick: "Before the drills", keyed: "both", render: (H, k) => {
      const qs = [];
      const s1 = randomSec(H, k, "dom"), s2 = randomSec(H, k, "lt"), s3 = randomSec(H, k, "pd");
      qs.push(H.check(`In ${k.label}, what is {sym:${s1.c.sym}}?`, s1.rn, wrongLabels(H, k, s1), why(H, k, s1), "rn"));
      qs.push(H.check(`In ${k.label}, what is {sym:${s2.c.sym}}?`, s2.rn, wrongLabels(H, k, s2), why(H, k, s2), "rn"));
      qs.push(H.check(`What kind of chord is {sym:${s3.c.sym}} in ${k.label}?`, FN.pd, [FN.dom, FN.lt, FN.dia], why(H, k, s3)));
      return `<p>Three questions in ${H.esc(k.label)}. Pick another key above for a new set.</p>${qs.join("")}`;
    } },
    // ---------- one part per kind of secondary chord, with examples from Dr. Silverman's course (assets/img|audio/secondary) ----------
    { part: "Secondary dominants", title: "The dominant of another chord", kick: "V/x and V⁷/x", render: () => `<p>A <b>secondary dominant</b> is the V or V⁷ of a diatonic chord other than the tonic. It's always major or dom7 in quality, and it usually comes from a diatonic minor or diminished chord whose 3rd has been raised: ii, iii or vi in a major key, ii° or iv in a minor key.</p>`
      + SX("secondary-doms.png", 1936, 536, "Two progressions in C major. 1: Dm (ii), D (V of V), G (V). 2: Dm (ii), D7 (V7 of V), G (V). The F of D minor becomes F-sharp.", "In C major, ii becomes V/V (1) or V⁷/V (2) when F rises to F♯.")
      + `<p>Label it V/x or V⁷/x, where x is the Roman numeral of the chord being tonicized. In C major, A7 isn't in the key, but it is V⁷ of D minor (ii): A7 → Dm is {rn:V7/ii} → {rn:ii}.</p>`
      + SX("secondary-doms-2.png", 1640, 546, "A7 to D in D major, labeled V7 to I. The same A7 and D in G major, followed by G, labeled V7 of V, V7, I.", "The same A7 → D: V⁷ → I in D major, but {rn:V7/V} → V⁷ in G major.")
      + `<div class="callout"><b>Two different slashes</b>In a chord symbol, the slash adds a bass note: {sym:C/E} is a C chord in first inversion. In a Roman numeral, it names the target: {rn:V65/IV} in C major is a C7 chord in first inversion, aimed at F.</div>`
      + SX("dom7-resolution.png", 1285, 466, "B7 resolving to E in A major, labeled V7 of V to V. The root B rises a perfect 4th to E; the third, D-sharp, rises a half step to E.", "{rn:V7/V} → V in A major: the root rises a 4th and the 3rd (the secondary leading tone, D♯) rises a half step.", 640) },
    { part: "Secondary dominants", title: "Which chords can be tonicized?", kick: "Diatonic chords, intensified", render: () => `<p>Here is a secondary dominant for each diatonic chord. Minor chords such as Dm, Em and Am get a raised 3rd; that's the chromatic note.</p>`
      + SX("secondary-doms-of-diatonic.png", 2896, 1119, "Two rows of chord pairs. In major (C major): G7 to C, A7 to Dm, B7 to Em, C7 to F, D7 to G, E7 to Am, and B diminished with no secondary dominant. In minor (A minor): E7 to Am, B diminished with none, G7 to C, A7 to Dm, B7 to Em, C7 to F, D7 to G. Circled numbers mark the special cases.", "Secondary dominants of the diatonic chords in C major and A minor. Boxed chords are secondary dominants; circled numbers mark the special cases below.")
      + `<ul class="ex-notes"><li><b>1a.</b> No accidental needed. V⁷ is a primary (diatonic) chord, of course. In minor, {rn:V7/III} (G7 → C in A minor) can still count as a secondary dominant even though it isn't chromatic.</li>
      <li><b>1b.</b> Raising the leading tone in minor isn't chromatic the way other alterations are, so E7 in A minor is just V⁷.</li>
      <li><b>2.</b> Most secondary dominants need one raised note (the 3rd). These need two to make the dom7 quality: B7 in C major has D♯ and F♯.</li>
      <li><b>3.</b> {rn:V7/IV} in major and {rn:V7/VI} in minor are built on a diatonic major triad. There's no V/IV in major (it's just I) or V/VI in minor (it's just III), but adding a minor 7th makes a secondary dominant.</li>
      <li><b>4.</b> Diminished chords (vii° in major, ii° in minor) aren't tonicized: a diminished chord can't sound like a temporary tonic.</li></ul>` },
    { part: "Secondary dominants", title: "Three ways to resolve", kick: "Expected, sort of, or not", render: () => `<p>A secondary dominant can go:</p>
      <ol><li>to the <b>expected chord</b>, whose root is a 4th above, the way V⁷ goes to I. {rn:V7/vi} goes to vi.</li>
      <li>to an <b>expected tone</b> harmonized some other way. In C major, D7 ({rn:V7/V}) can move to an E♭ chord: the F♯ still rises to G, but G isn't the root.</li>
      <li>somewhere <b>unexpected</b>, which is common in pop and jazz.</li></ol>
      <p>Otis Redding uses the second kind twice in four bars.</p>`
      + SX("dock-of-the-bay.png", 2912, 677, "Melody in G major with chords G, B, C, A, G, labeled I, V of vi, IV, V of V, I. A second staff shows the chord pitches: the D-sharp of the B chord moves to E, and the C-sharp of the A chord moves to D.", "Otis Redding and Steve Cropper, “(Sittin' On) The Dock of the Bay” (lyrics removed). B (V/vi) goes to C, not Em: its D♯ rises to E, the 3rd of C. A (V/V) goes to G, not D: its C♯ rises to D, the 5th of G.", ["dock-of-the-bay", "Dock of the Bay, excerpt"]) },
    { part: "Secondary leading-tone chords", title: "The leading-tone chord of another chord", kick: "vii°/x and vii°⁷/x", render: () => `<p>A <b>secondary leading-tone chord</b> is the vii° or vii°⁷ of a diatonic chord other than the tonic. It's diminished or fully diminished (almost never half-diminished). Raise a note to a half step below the target's root, spelled as its lower neighbor (F♯ to G, not G♭), and build the dim7 chord on it.</p>`
      + SX("secondary-lt-chords.png", 2032, 1051, "A chain in C major: C, C-sharp dim7, Dm, D-sharp dim7, C over E, E dim7, Dm over F, F-sharp dim7, C over G, G-sharp dim7, Am, B dim7, C, labeled I, vii°7 of ii, ii, vii°7 of iii, I6, vii°7 of IV, ii6, vii°7 of V, I 6 4, vii°7 of vi, vi, vii° 6 5, I.", "Secondary leading-tone chords in C major. Some go to the expected chord (C♯°7 → Dm); others go to an expected tone in a different chord (D♯°7 → C/E).", ["secondary-lt-chords", "Secondary leading-tone chords in C major"])
      + `<p>They have a lot in common with secondary dominants: the raised note does the same job. For each target, the root, 3rd and 5th of vii°⁷/x are the 3rd, 5th and 7th of V⁷/x.</p>`
      + SX("v7-vs-viio7.png", 2880, 450, "Three pairs in C major: G-sharp dim7 to Am beside E7 to Am; C-sharp dim7 to Dm beside A7 to Dm; E dim7 to F beside C7 to F. The shared notes are shown in red.", "vii°⁷/x beside V⁷/x for the same targets (vi, ii, IV). The shared notes are in red.")
      + SX("dim7-resolution.png", 1304, 419, "D-sharp dim7 resolving to E in A major, labeled vii7 of V to V. The root D-sharp rises a half step to E.", "{rn:vii°7/V} → V in A major: the root (the secondary leading tone) rises a half step.", 640) },
    { part: "Secondary leading-tone chords", title: "How they resolve", kick: "Collapsing inward", render: () => `<p>Like secondary dominants, these can go to the expected chord (root a minor 2nd above), to an expected tone in another chord, or somewhere unexpected. In C minor, F♯°7 ({rn:vii°7/V}) might go to an E♭ chord: F♯ still rises to G. Because a dim7 chord is built from stacked minor 3rds, its notes tend to close inward when they resolve.</p>`
      + SX("dim7-resolutions.png", 1870, 295, "Three dim7 resolutions with arrows: G-sharp dim7 to A minor (vii°7 to i), C-sharp dim7 to D minor (vii°7 of iv to iv), D-sharp dim7 to E major (vii°7 of V to V).", "vii°⁷ → i, {rn:vii°7/iv} → iv and {rn:vii°7/V} → V, in A minor.") },
    { part: "Secondary leading-tone chords", title: "Common-tone diminished 7ths", kick: "Same chord, different job", render: () => `<p>Not every chromatic dim7 is a leading-tone chord. A <b>common-tone dim7</b> (CT°⁷) shares a note with the chord it goes to, and that shared note ties them together. A secondary leading-tone chord shares no notes with its target. Romantic music and jazz use both.</p>`
      + SX("common-tone-dim7.png", 1336, 396, "F-sharp dim7 over C going to C major, with C circled as a common tone; then the same F-sharp dim7 over C resolving to G, with arrows showing each note's resolution.", "The same F♯°7/C: a common-tone dim7 when it goes to C, a secondary leading-tone chord when it goes to G.", 720)
      + `<p>Randy Newman puts both in the first bars of “Almost There” from <i>The Princess and the Frog</i>.</p>`
      + SX("almost-there.png", 2312, 997, "Voice and piano in C major: C, F-sharp dim7 over C, C, then F-sharp dim7 over A, G7 sus, C. Labels: I, vii° 4 3 of V marked common-tone dim7, I, vii° 6 5 of V marked secondary leading-tone, V7, I.", "Randy Newman, “Almost There” (lyrics removed). F♯°7/C between two C chords is a common-tone dim7; F♯°7/A going to G7 is a secondary leading-tone chord.", ["almost-there", "Almost There, excerpt"]) },
    { part: "Secondary pre-dominants", title: "ii–V of another chord", kick: "ii/x and iiø⁷/x", render: () => `<p>A <b>secondary pre-dominant</b> prepares a secondary dominant, the way ii or IV prepares V. Together they make a ii–V–I (or iiø–V–i) aimed at a chord other than the tonic. To spell one, go a whole step <i>above</i> the target's root: minor (or m7) for a major target, half-diminished for a minor target.</p>
      <p>Look at bar 5 of this middle section from “Have Yourself a Merry Little Christmas.” A half-diminished 7th usually means the supertonic of a minor key. Cø7 is iiø⁷ of B♭ minor, F7 is its V⁷, and B♭ minor is iii in G♭ major: a two-chord tonicization of iii. The bracket shows the same thing as {rn:iiø7/iii} – {rn:V7/iii}.</p>`
      + SX("have-yourself.png", 2112, 755, "Lead sheet in G-flat major with Roman numerals. First line: C-flat (IV), B-flat minor (iii), A-flat minor (ii), D-flat 7 (V7), G-flat (I). Second line: C half-diminished 7, F7, bracketed as ii°7 V7 of iii; B-flat minor (iii), E-flat 7 (V7 of ii); D-flat over A-flat and A-flat 7, bracketed as I 6 4, V7 of V; A-flat minor (ii), D-flat 7 (V7).", "Hugh Martin and Ralph Blane, “Have Yourself a Merry Little Christmas,” middle eight (lyrics removed). D♭/A♭ isn't chromatic, but the bracket shows it working as I⁶₄ of D♭, setting up A♭7 (V⁷/V).", ["have-yourself", "Have Yourself a Merry Little Christmas, middle eight"]) },
    { part: "Secondary pre-dominants", title: "Following a chain", kick: "One tonicization after another", render: () => `<p>“Where Is Love?” from Lionel Bart's <i>Oliver!</i> sets up C major with I, ii⁷ and V⁷ in bars 1–4. Then, in the middle of bar 5, Cm7 appears. It isn't diatonic in C, so ask two questions. Could it be the ii of some other key? And do the next two chords finish a ii–V–I there? Cm7 – F7 – B♭maj7 is ii⁷ – V⁷ – I in B♭, and B♭ is ♭VII in C (mode mixture): {rn:ii7/♭VII} – {rn:V7/♭VII} – {rn:♭VII}. Then B♭maj7 turns into B♭m7, and the same question gets the same answer. B♭m7 – E♭7 – A♭ is {rn:ii7/♭VI} – {rn:V7/♭VI} – {rn:♭VI}.</p>`
      + SX("where-is-love.png", 2224, 691, "Lead sheet in C major: C, Dm7, G7, C twice; then Dm7, G7, Cm7, F7, B-flat major 7, B-flat minor 7, E-flat 7, A-flat, Dm7, G7.", "Lionel Bart, “Where Is Love?” from <i>Oliver!</i> (lyrics removed).", ["where-is-love", "Where Is Love?, excerpt"])
      + `<p>A tonicization can also use a secondary subdominant: IV/x or IV⁷/x for a major target, iv/x or iv⁷/x for a minor one. Or it can stretch over several chords. In the Beach Boys' “God Only Knows,” bars 6–7 spend a long time on ii, vii°⁷ turns up in a major key, and II ({rn:V7/V}) moves to IV instead of V in bars 13–14.</p>`
      + SX("god-only-knows.png", 2920, 1247, "Lead sheet in E major, bars 6 to 17, with Roman numerals: D over A (VI 6 4 of ii), B minor 6 (iv of ii), F-sharp minor (ii), B7 over A (V 4 2), E over B (I 6 4), D-sharp dim7 over C (vii° 4 2), E over B (I 6 4), F-sharp 9 (V7 of V), A (IV), E over G-sharp (I6), F-sharp minor 7 (ii7), E (I).", "Brian Wilson and Tony Asher, “God Only Knows” (lyrics removed).", ["god-only-knows", "God Only Knows, excerpt"]) },
  ] };

  return {
    key: "silverapps-secondary-v1", lesson, make, reference,
    modes: [{ id: "func", kicker: "Function" }, { id: "label", kicker: "Label it" }, { id: "staff", kicker: "On the staff" }, { id: "spell", kicker: "Spell it" }],
    topics: [{ id: "maj", name: "Major keys", group: "keys" }, { id: "min", name: "Minor keys", group: "keys" },
      { id: "dom", name: "Secondary dominants", group: "fn" }, { id: "lt", name: "Leading-tone chords", group: "fn" }, { id: "pd", name: "Pre-dominants", group: "fn" }],
  };
})();
// ===== Test yourself quiz (engine adds it as the step before Practice; s = step to look back at) =====
window.FAM.quiz = [{"s": 1, "q": "What is tonicization?", "a": "briefly treating a chord other than the tonic as if it were the tonic", "w": ["changing to a new key with a cadence", "playing the tonic chord twice", "raising every note a half step"], "hint": "It doesn't change the key.", "why": "Tonicization is brief; only a cadence confirms a new key."}, {"s": 2, "q": "Stack B, D, E, G♯ in 3rds. What chord is it?", "a": "E7 with B in the bass (E7/B)", "w": ["B minor 7th", "G♯ diminished", "E minor"], "hint": "Try each note as the root until the others fall into 3rds above it.", "why": "E–G♯–B–D is a dominant 7th on E; B is the bass, so E7/B."}, {"s": 3, "q": "A fully diminished 7th chord turns up outside the key. What is it most likely?", "a": "a secondary leading-tone chord", "w": ["a secondary dominant", "a secondary pre-dominant", "the key's own V⁷"], "hint": "Check the quality → function table.", "why": "dim7 → secondary leading-tone chord (vii°7/x)."}, {"s": 3, "q": "In G major, the chord G7 appears. What is it?", "a": "{rn:V7/IV}", "w": ["{rn:I7}", "{rn:V7}", "{rn:V7/V}"], "hint": "Any dominant 7th other than the key's own V7 is a secondary dominant.", "why": "G7 is the dominant 7th of C, which is IV in G major."}, {"s": 4, "q": "For a secondary dominant, where is the target's root?", "a": "a perfect 4th above (5th below) the chord's root", "w": ["a minor 2nd above", "a major 2nd below", "a major 3rd above"], "hint": "Think of V going to I.", "why": "V's root is a 5th above I's, so the target sits a P4 above the secondary dominant's root."}, {"s": 4, "q": "In G major, A7 is…", "a": "{rn:V7/V}", "w": ["{rn:V7/ii}", "{rn:ii7}", "{rn:V7/vi}"], "hint": "A is a 5th above which chord root in G major?", "why": "A7 resolves to D, the V chord of G major: V7/V."}, {"s": 5, "q": "In G major, A7 with C♯ in the bass is labeled…", "a": "{rn:V65/V}", "w": ["{rn:V43/V}", "{rn:V42/V}", "{rn:V7/V}"], "hint": "C♯ is the chord's 3rd. Seventh chords: root 7, 3rd 6/5, 5th 4/3, 7th 4/2.", "why": "3rd in the bass is first inversion: V65/V."}, {"s": 7, "q": "In G major, which chord is {rn:vii°7/V}?", "a": "C♯°7", "w": ["D♭°7", "F♯°7", "A7"], "hint": "Find V's root, then the note a half step below it, spelled with the letter below.", "why": "V is D. A half step below, spelled as its lower neighbor: C♯. C♯–E–G–B♭."}, {"s": 7, "q": "Why spell the secondary leading tone as a lower neighbor (F♯, not G♭, below G)?", "a": "It shows the note leads up to the target's root", "w": ["Sharps are easier to read", "G♭ is not a real note", "It makes the chord minor"], "hint": "Each note's spelling shows where it's going.", "why": "F♯ rises to G; an enharmonic G♭ would hide that."}, {"s": 1, "q": "Does a secondary chord change the key?", "a": "no: only a cadence can confirm a new key", "w": ["yes, always", "only if it's a seventh chord", "only in minor"], "hint": "Tonicization is brief.", "why": "A secondary chord treats a chord as a temporary tonic without modulating."}, {"s": 1, "q": "In V/x, what is x?", "a": "the target: the chord being tonicized", "w": ["the bass note", "the key", "the inversion"], "hint": "V of what?", "why": "x is the chord the secondary chord points to."}, {"s": 2, "q": "Stack A, C, F♯, E♭ in 3rds. What chord is it?", "a": "F♯°7 (fully diminished seventh) over A", "w": ["Am6", "A7", "Cm7"], "hint": "Start from F♯.", "why": "F♯–A–C–E♭ is a fully diminished seventh on F♯; A in the bass makes it inverted."}, {"s": 2, "q": "After stacking a chord in 3rds, how do you show that it's inverted?", "a": "add a slash and the bass note", "w": ["circle it", "write it in lowercase", "add a ♯"], "hint": "Check the bass.", "why": "If the lowest note isn't the root, write a slash chord."}, {"s": 3, "q": "In C major, what does a D major chord (instead of D minor) suggest?", "a": "a secondary dominant", "w": ["a borrowed chord", "a secondary pre-dominant", "a Picardy third"], "hint": "Major where the key gives minor.", "why": "A major triad where the key has another quality points to a secondary dominant."}, {"s": 3, "q": "A half-diminished 7th outside the key usually signals…", "a": "a secondary pre-dominant with a minor target (iiø7/x)", "w": ["a secondary dominant", "a secondary leading-tone chord", "a Neapolitan"], "hint": "ø7 points to a minor target.", "why": "Half-diminished secondary chords are pre-dominants of minor chords."}, {"s": 4, "q": "For a secondary leading-tone chord, where is the target's root?", "a": "a minor 2nd above the chord's root", "w": ["a perfect 4th above", "a major 2nd below", "a perfect 5th below"], "hint": "Leading tone to tonic.", "why": "The chord's root is the target's leading tone, a half step below it."}, {"s": 4, "q": "In C major, Gm7 going to F is…", "a": "{rn:ii7/IV}", "w": ["{rn:V7/IV}", "{rn:vii°7/IV}", "{rn:iv7}"], "hint": "A major 2nd below the target's root.", "why": "Gm7 is the pre-dominant of F: ii7/IV."}, {"s": 5, "q": "In C major, which label fits D7/A?", "a": "{rn:V43/V}", "w": ["{rn:V65/V}", "{rn:V42/V}", "{rn:V7/V}"], "hint": "A is the 5th of D7.", "why": "Second-inversion seventh chords take 4/3."}, {"s": 5, "q": "Where does the inversion figure go in a secondary label?", "a": "after the numeral, before the slash", "w": ["after the slash", "before the numeral", "under the bass note only"], "hint": "V6/5/V.", "why": "Figures attach to the first numeral: V⁶₅/V."}, {"s": 6, "q": "How do secondary leading-tone chords and pre-dominants usually appear in the examples?", "a": "followed by the secondary dominant of the same target, then the target", "w": ["at the very end of the piece", "without any target", "only in minor keys"], "hint": "A chain toward the target.", "why": "E7 → C7 → F, or Gm7 → C7 → F."}, {"s": 7, "q": "In C major, the leading tone of V (G) is spelled…", "a": "F♯, not G♭", "w": ["G♭, not F♯", "either way", "E♯"], "hint": "The target's lower neighbor.", "why": "The secondary leading tone uses the letter below the target's root."}, {"s": 7, "q": "How do you start spelling a secondary pre-dominant?", "a": "a whole step above the target's root", "w": ["a half step below the target's root", "a 5th above the target's root", "on the tonic"], "hint": "Gm = ii/IV.", "why": "Pre-dominants sit a step above the target's root."}, {"s": 9, "q": "In C major, which chord is V⁷/ii?", "a": "A7", "w": ["D7", "Am7", "G7"], "hint": "ii is D minor. What is the V⁷ of D?", "why": "The dominant of D is A; A7 (A–C♯–E–G) is V⁷/ii. The C♯ is the chromatic note."}, {"s": 10, "q": "Why is there no secondary dominant of vii° in a major key?", "a": "a diminished chord can't act as a temporary tonic", "w": ["its root is already chromatic", "it has no 5th", "it's always in first inversion"], "hint": "Could you end a phrase on it as if it were home?", "why": "Only major and minor chords are tonicized; diminished chords (vii° in major, ii° in minor) aren't."}, {"s": 11, "q": "In “Dock of the Bay” (G major), B (V/vi) moves to C instead of Em. What still resolves as expected?", "a": "D♯ rises to E, the 3rd of C", "w": ["B falls to E", "nothing: it's a mistake", "F♯ rises to G"], "hint": "Follow the secondary leading tone.", "why": "V/vi's leading tone D♯ goes up to E; E just belongs to a C chord instead of Em."}, {"s": 12, "q": "Which quality does a secondary leading-tone chord almost always have?", "a": "diminished or fully diminished", "w": ["half-diminished", "major", "dominant 7th"], "hint": "Like vii° in the home key, often with a diminished 7th.", "why": "vii°/x or vii°⁷/x: the root is the raised note a half step below the target."}, {"s": 12, "q": "In C major, what is vii°⁷/V?", "a": "F♯°7 (F♯–A–C–E♭)", "w": ["G♭°7 (G♭–B𝄫–D𝄫–F𝄫)", "D7 (D–F♯–A–C)", "F°7 (F–A♭–C♭–E♭♭)"], "hint": "Start a half step below G, spelled as its lower neighbor.", "why": "The secondary leading tone is F♯, not G♭; stack minor 3rds above it."}, {"s": 14, "q": "What separates a common-tone dim7 from a secondary leading-tone chord?", "a": "it shares a note with the chord it goes to", "w": ["it's half-diminished", "it's always in root position", "it only appears in minor keys"], "hint": "Look at F♯°7/C going to C.", "why": "A CT°⁷ shares a note with its resolution; a secondary leading-tone chord shares none with its target."}, {"s": 15, "q": "To spell ii/V in A major, where do you start?", "a": "a whole step above E (F♯), building a minor chord: F♯–A–C♯", "w": ["a half step below E (D♯)", "a 5th above E (B)", "on A itself"], "hint": "Secondary pre-dominants sit a whole step above the target's root.", "why": "V in A is E. A whole step above is F♯; for a major target the chord is minor: F♯m."}, {"s": 16, "q": "In C major, Cm7 – F7 – B♭maj7 is best labeled…", "a": "ii⁷/♭VII – V⁷/♭VII – ♭VII", "w": ["i⁷ – IV⁷ – ♭VII", "ii⁷/V – V⁷/V – V", "iv⁷ – ♭VII⁷ – ♭III"], "hint": "Is it a ii–V–I in some other key?", "why": "Cm7–F7–B♭ is ii⁷–V⁷–I in B♭, and B♭ is ♭VII (mode mixture) in C."}];
