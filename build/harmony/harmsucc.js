window.FAM = (() => {
  // ===== Harmonic Succession (functions, progression, structural vs. embellishing chords). Engine: build/harmony/engine.js =====
  const FN = { T: "Tonic", PD: "Pre-dominant", D: "Dominant" };
  // chord tokens with their function (unambiguous ones only)
  const FUNC = {
    major: [["1", "T"], ["16", "T"], ["2", "PD"], ["26", "PD"], ["27", "PD"], ["265", "PD"], ["4", "PD"], ["46", "PD"], ["5", "D"], ["57", "D"], ["565", "D"], ["543", "D"], ["56", "D"], ["76", "D"], ["765", "D"]],
    minor: [["1", "T"], ["16", "T"], ["26", "PD"], ["265", "PD"], ["27", "PD"], ["4", "PD"], ["46", "PD"], ["5", "D"], ["57", "D"], ["565", "D"], ["542", "D"], ["77", "D"], ["765", "D"], ["76", "D"]],
  };
  // chart positions: I 0, iii 1, vi 2, IV/ii 3, V/vii° 4
  const PROG = [["1", "4"], ["1", "6"], ["1", "5"], ["1", "2"], ["3", "6"], ["6", "2"], ["6", "4"], ["6", "5"], ["4", "2"], ["4", "5"], ["4", "7"], ["2", "5"], ["2", "7"], ["5", "1"], ["7", "1"], ["5", "6"], ["4", "1"], ["1", "3"]];
  const RETRO = [["5", "4"], ["5", "2"], ["2", "6"], ["2", "4"].slice(0, 0), ["4", "6"], ["5", "3"], ["2", "3"], ["4", "3"], ["6", "3"], ["7", "4"], ["7", "2"]].filter(x => x.length);
  const POS = { 1: 0, 3: 1, 6: 2, 4: 3, 2: 3, 5: 4, 7: 4 };
  // phrase-model templates: tokens with areas
  const AREA = {
    major: [
      [["1", "T"], ["16", "T"], ["4", "PD"], ["26", "PD"], ["164", "D"], ["57", "D"], ["1", "T"]],
      [["1", "T"], ["56", "T"], ["46", "T"], ["164", "T"], ["4", "PD"], ["2", "PD"], ["164", "D"], ["57", "D"], ["1", "T"]],
      [["1", "T"], ["6", "T"], ["2", "PD"], ["5", "D"], ["1", "T"]],
      [["1", "T"], ["4", "T"], ["16", "T"], ["543", "T"], ["1", "T"], ["26", "PD"], ["5", "D"]],
      [["1", "T"], ["6", "T"], ["4", "PD"], ["2", "PD"], ["5", "D"], ["57", "D"], ["1", "T"]],
      [["1", "T"], ["4", "PD"], ["765", "D"], ["57", "D"], ["1", "T"]],
    ],
    minor: [
      [["1", "T"], ["16", "T"], ["4", "PD"], ["26", "PD"], ["164", "D"], ["57", "D"], ["1", "T"]],
      [["1", "T"], ["6", "PD"], ["26", "PD"], ["5", "D"], ["1", "T"]],
      [["1", "T"], ["4", "T"], ["16", "T"], ["543", "T"], ["1", "T"], ["46", "PD"], ["5", "D"]],
    ],
  };
  // embellishing chords: [tokens, index of the embellishing chord, type]
  const EMB = [
    [["1", "543", "16"], 1, "passing"], [["16", "543", "1"], 1, "passing"], [["1", "76", "16"], 1, "passing"], [["4", "164", "46"], 1, "passing"],
    [["1", "56", "1"], 1, "neighbor"], [["1", "565", "1"], 1, "neighbor"], [["16", "4", "16"], 1, "neighbor"].slice(0, 0),
    [["1", "464", "1"], 1, "pedal"], [["4", "164", "57", "1"], 1, "pedal"], [["2", "164", "5"], 1, "pedal"],
    [["1", "16", "4"], 1, "arpeggiating"], [["4", "46", "5"], 1, "arpeggiating"], [["5", "56", "1"], 1, "arpeggiating"],
  ].filter(x => x.length);
  const EMBN = { passing: "Passing chord", neighbor: "Neighbor chord", pedal: "Pedal chord", arpeggiating: "Arpeggiating chord" };
  const EMBW = { passing: "its bass passes by step between two structural chords, like a harmonized passing tone", neighbor: "its bass steps away from and back to the same note, like a harmonized neighbor tone", pedal: "its bass holds (or repeats) the bass of a neighboring chord, like a harmonized pedal tone", arpeggiating: "its bass skips between members of the same harmony" };

  // succession types from chord symbols (in a random key)
  const PAT = {
    circle: [[[3, "m"], [6, "m"], [2, "m"], [5, "M"], [1, "M"]], [[1, "M"], [4, "M"], [7, "d"], [3, "m"], [6, "m"], [2, "m"], [5, "M"], [1, "M"]], [[3, "7"], [6, "7"], [2, "7"], [5, "7"], [1, "M"]], [[6, "m7"], [2, "m7"], [5, "7"], [1, "M7"]]],
    practice: [[[1, "M"], [4, "M"], [5, "M"], [1, "M"]], [[1, "M"], [2, "m"], [5, "7"], [1, "M"]], [[1, "M"], [6, "m"], [4, "M"], [5, "M"]], [[1, "M"], [4, "M"], [2, "m"], [5, "7"], [1, "M"]]],
    retro: [[[-7, "M"], [4, "M"], [1, "M"]], [[5, "M"], [4, "M"], [1, "M"]], [[1, "M"], [5, "M"], [2, "M"], [6, "M"], [3, "M"]], [[2, "m"], [6, "m"], [5, "M"], [4, "M"]]],
    stream: [[[6, "m"], [5, "M"], [4, "M"], [3, "M"]], [[1, "M"], [2, "M"], [3, "M"], [-4.5, "M"]], [[6, "M"], [5, "M"], [4, "M"], [3, "M"]], [[1, "M"], [7, "m"], [6, "m"], [5, "M"]].slice(0, 0)].filter(x => x.length),
  };
  const PATN = { circle: "Circle progression", practice: "Common-practice progression", retro: "Retrogression", stream: "Chord stream" };
  const PATW = { circle: "the roots fall by 5ths (rise by 4ths) chord after chord, around the circle of fifths.", practice: "it follows the usual T → PD → D → T pattern.", retro: "the roots move “backwards” (right to left on the progression chart), like V–IV or ♭VII–IV–I.", stream: "the chords simply follow a stepwise bass line, without progression or retrogression." };
  const patChord = (H, k, d, q) => {
    let r;
    if (d === -7) r = H.down(H.deg(k, 1), 1, 2);          // ♭VII
    else if (d === -4.5) r = H.up(H.deg(k, 1), 3, 6);     // ♯IV (whole-tone stream)
    else r = H.deg(k, d);
    return H.chord(r, q).sym;
  };

  const FACTS = [
    ["Which pattern of root motion drives most common-practice progressions?", "roots falling by 5ths (rising by 4ths)", ["roots rising by 5ths", "roots moving by half step", "roots moving by tritone"], "Moving left to right on the progression chart is mostly motion by descending 5ths."],
    ["Which chord can progress to any other chord?", "the tonic", ["the dominant", "the supertonic", "the leading-tone chord"], "The tonic begins and ends harmonic patterns."],
    ["V going to vi instead of I is called…", "a deceptive resolution", ["a retrogression", "a plagal motion", "a chord stream"], "vi is a tonic substitute."],
    ["Why is vii° less common than V?", "diminished chords are weak (no perfect 5th)", ["it has no leading tone", "it's a pre-dominant", "it can't be inverted"], "V and vii° share dominant function."],
    ["Which two pre-dominant chords can substitute for each other?", "IV and ii", ["V and vi", "I and iii", "ii and V"], "They share pre-dominant function."],
    ["The phrase model is…", "T → PD → D → (T)", ["D → PD → T", "T → D → PD", "PD → T → D"], "Tonic area, pre-dominant area, dominant area, (tonic)."],
    ["Which is the most common way to expand the dominant area?", "the cadential ⁶₄", ["the Neapolitan", "a plagal cadence", "a chord stream"], "I⁶₄ decorates V at the cadence."],
    ["The doo-wop progression is…", "I – vi – ii – V (or I – vi – IV – V)", ["I – IV – I – V", "i – ♭VII – ♭VI – V", "I – V – vi – IV"], "I–vi is a tonic prolongation, then around the circle."],
    ["The Andalusian cadence is…", "a chord stream down a tetrachord, such as i – ♭VII – ♭VI – V", ["V – I in minor", "IV – I", "ii – V – I"], "Common in flamenco, rhythm and blues, and jazz."],
    ["In rock music, a common retrogression is…", "♭VII – IV – I", ["ii – V – I", "IV – V – I", "vi – ii – V"], "The reverse path around the circle of fifths."],
    ["Which chords are usually most “structural”?", "diatonic, root-position chords on strong beats, especially at cadences", ["inverted chords on weak beats", "chromatic chords with non-chord tones", "turnaround chords"], "Key, meter, inversion, prolongation and cadence all matter."],
    ["Turnaround chords are…", "not structural", ["always structural", "the strongest chords in the phrase", "always tonic chords"], "Cadence chords are structural; turnaround chords are not."],
  ];

  function make(mode, H) {
    if (mode === "func") {
      const k = H.randKey(["major", "minor"]), [t, f] = H.rnd(FUNC[k.mode]), c = H.tok(k, t);
      return H.mc(`In ${k.label}, what function does {rn:${c.rn}} (${c.sym}) have?`, FN[f], Object.values(FN), `${f === "T" ? "Tonic chords are home: I (and its inversions)." : f === "PD" ? "ii and IV (with their inversions and sevenths) lead to the dominant." : "V and vii° (with their inversions and sevenths) lead to the tonic."}`, { kicker: "Function", topic: "func" });
    }
    if (mode === "prog") {
      const k = H.key(H.rnd(H.KEYS.major), "major"), isP = Math.random() < .5, [a, b] = H.rnd(isP ? PROG : RETRO);
      const A = H.tok(k, a), B = H.tok(k, b), ans = isP ? "Progression" : "Retrogression";
      const w = isP ? (a === "1" ? "I can move to any chord." : a === "4" && b === "1" ? "IV–I is plagal motion, a common exception." : a === "5" && b === "6" ? "V–vi is a deceptive resolution." : a === "6" && b === "5" ? "vi can work as a pre-dominant, so vi–V isn't a retrogression." : "It moves left to right on the progression chart, toward the tonic.")
        : "It moves right to left on the progression chart, away from the tonic.";
      return H.mc(`In ${k.label}: is {rn:${A.rn}} → {rn:${B.rn}} (${A.sym} → ${B.sym}) a progression or a retrogression?`, ans, ["Progression", "Retrogression"], w, { kicker: "Progression?", play: H.satbPlay((H.voiceToks(k, [a, b]) || { vs: [] }).vs), playLabel: "Play it", topic: "func" });
    }
    if (mode === "area") {
      const k = H.randKey(["major", "minor"]), tpl = H.rnd(AREA[k.mode]), i = 1 + Math.floor(Math.random() * (tpl.length - 2));
      const x = H.voiceToks(k, tpl.map(t => t[0]));
      if (!x) return null;
      const a = tpl[i][1], c = x.chords[i];
      const w = c.rn === "I64" ? (a === "D" ? "Here the I⁶₄ resolves to V: it's a cadential ⁶₄, an embellishment of the dominant." : "Here the I⁶₄ is part of a tonic expansion (a passing ⁶₄), not a cadential ⁶₄.") : a === "T" ? "It sits inside the tonic area: the music hasn't left the tonic yet." : a === "PD" ? "It leads toward the dominant." : "It belongs to the dominant area, just before the tonic (or the half cadence).";
      return H.mc(`In ${k.label}: which area of the phrase model does the highlighted chord belong to?`, FN[a] + " area", Object.values(FN).map(v => v + " area"), w + ` Areas: ${tpl.map(t => t[1]).join(" – ")}.`, { kicker: "Phrase model", staff: H.satbSpec(x, { hl: [i] }), playQ: H.satbPlay(x.vs, .85), playQLabel: "Play", topic: "struct" });
    }
    if (mode === "embel") {
      const k = H.randKey(["major", "minor"]), [toks, i, type] = H.rnd(EMB), x = H.voiceToks(k, toks);
      if (!x) return null;
      return H.mc(`In ${k.label}: what kind of embellishing chord is highlighted?`, EMBN[type], Object.values(EMBN), `It's a ${EMBN[type].toLowerCase()}: ${EMBW[type]}.`, { kicker: "Embellishing chords", staff: H.satbSpec(x, { hl: [i] }), playQ: H.satbPlay(x.vs, .85), playQLabel: "Play", topic: "struct" });
    }
    if (mode === "pattern") {
      const type = H.rnd(Object.keys(PAT)), seq = H.rnd(PAT[type]);
      const k = H.key(H.rnd(["C", "G", "D", "F", "B♭", "A", "E"]), "major");
      const syms = seq.map(([d, q]) => patChord(H, k, d, q)).map(s => `{sym:${s}}`).join(" – ");
      return H.mc(`What kind of harmonic succession is this? ${syms}`, PATN[type], Object.values(PATN), `${PATN[type]}: ${PATW[type]}`, { kicker: "Patterns", topic: "func" });
    }
    const [q, a, w, y] = H.rnd(FACTS);
    return H.mc(q, a, w, y, { kicker: "Concepts" });
  }

  function reference(H) {
    return `<div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Area</th><th scope="col">Chords</th><th scope="col">Moves to</th></tr></thead><tbody>
      <tr><td><b>Tonic (T)</b></td><td>I (expanded with I⁶, vi, iii, passing and neighbor chords)</td><td>PD or D</td></tr>
      <tr><td><b>Pre-dominant (PD)</b></td><td>IV, ii (and vi as in vi–V)</td><td>D</td></tr>
      <tr><td><b>Dominant (D)</b></td><td>V, vii° (expanded with the cadential ⁶₄)</td><td>T</td></tr></tbody></table></div>
      <p class="legend">Progression chart (major): iii → vi → IV/ii → V/vii° → I, and I can go anywhere. Exceptions: IV–I (plagal) and vi–V. Moving right to left is retrogression.</p>`;
  }

  const sf = (H, U, k, toks, cap, o) => H.satbFig(U, k, toks, cap, o);
  // Adam's MTC 501 examples: his typeset excerpts (lyrics left out) with short recordings
  const FU = `<p class="note lcite fair-use" data-fair-use></p>`;
  const AUD = (f, label) => `<audio controls preload="none" src="assets/audio/harmsucc/${f}.mp3" aria-label="${label}" style="width:100%">Your browser can't play this audio clip.</audio>`;
  const IMG = (f, w, h, alt) => `<img src="assets/img/harmsucc/${f}.png" width="${w}" height="${h}" alt="${alt}" loading="lazy" style="width:100%;height:auto;background:#fff;border-radius:8px">`;
  const EX = (f, w, h, alt, cap, audLabel) => `<figure class="lfig hs-fig">${audLabel ? AUD(f, audLabel) : ""}${IMG(f, w, h, alt)}<figcaption><p>${cap}</p>${FU}</figcaption></figure>`;
  const YT = (id, label) => `<a href="https://youtu.be/${id}" target="_blank" rel="noopener">${label}</a>`;

  // ===== Progression chart (Adam's layout: build/… PSD "Harmonic prog chart"): boxes, arrows, the V→vi arc and the tonic circle, drawn as SVG.
  // Minor adds a VII box at the left. Slots: c0 (minor only) c1 c2 pdT pdB dT dB t =====
  const CHART = {
    major: { c1: "iii", c2: "vi", pdT: "ii", pdB: "IV", dT: "V", dB: "vii°", t: "I" },
    minor: { c0: "VII", c1: "III", c2: "VI", pdT: "ii°", pdB: "iv", dT: "V", dB: "vii°", t: "i" } };
  const CMIDI = { major: { iii: [64, 67, 71], vi: [57, 60, 64], ii: [62, 65, 69], IV: [65, 69, 72], V: [67, 71, 74], "vii°": [59, 62, 65], I: [60, 64, 67] },
    minor: { VII: [55, 59, 62], III: [60, 64, 67], VI: [65, 69, 72], "ii°": [59, 62, 65], iv: [62, 65, 69], V: [64, 68, 71], "vii°": [56, 59, 62], i: [57, 60, 64] } };
  const CAP = { c0: "a 5th above III", c1: "a 5th above the next box", c2: "a 5th above ii", pd: "Pre-dominant", d: "Dominant", t: "Tonic" };
  const SLOTPOS = { c0: "first box", c1: "box before the pre-dominants (far left)", c2: "box just before the pre-dominants", pdT: "upper middle box", pdB: "lower middle box", dT: "upper box before the tonic", dB: "lower box before the tonic", t: "the circle" };
  function chartSVG(mode, fill, o = {}) {
    const m = mode === "minor", X = m ? 180 : 0, W = 1000 + X, S = 136;
    const box = { c0: [51, 189], c1: [51 + X, 189], c2: [231 + X, 190], pdT: [408 + X, 105], pdB: [408 + X, 273], dT: [591 + X, 106], dB: [591 + X, 274] };
    const lab = (t, x, y, big) => t ? `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-family="Literata, 'Noto Music', serif" font-size="${big ? 60 : 54}" fill="currentColor">${t.replace("°", "<tspan font-size='0.6em' dy='-0.9em'>o</tspan>")}</text>` : "";
    const slot = (id, inner) => o.slots ? `<g class="pc-slot" data-slot="${id}" role="button" tabindex="0" aria-label="${o.aria(id)}">${inner}</g>` : o.play ? `<g class="pc-chord" data-chord="${fill[id]}" role="button" tabindex="0" aria-label="Play ${fill[id]}">${inner}</g>` : inner;
    const st = id => o.state && o.state[id] ? ` class="pc-${o.state[id]}"` : "";
    const sq = id => { const [x, y] = box[id]; return slot(id, `<rect${st(id)} x="${x}" y="${y}" width="${S}" height="${S}" fill="var(--fi-card, #fff)" stroke="currentColor" stroke-width="7"/>${lab(fill[id], x + S / 2, y + S / 2 + 2)}`); };
    const arrow = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="currentColor" stroke-width="4" marker-end="url(#pcA${o.uid})"/>`;
    const ids = (m ? ["c0"] : []).concat(["c1", "c2", "pdT", "pdB", "dT", "dB"]);
    const caps = o.caps ? [m ? ["c0", 51 + S / 2] : null, ["c1", 51 + X + S / 2], ["c2", 231 + X + S / 2], ["pd", 476 + X], ["d", 659 + X], ["t", 860 + X]].filter(Boolean).map(([k, x]) => `<text x="${x}" y="${k === "pd" || k === "d" ? 448 : k === "t" ? 370 : 360}" text-anchor="middle" font-size="19" font-style="italic" fill="currentColor">${k === "c1" && m ? "a 5th above VI" : k === "c1" ? "a 5th above vi" : CAP[k]}</text>`).join("") : "";
    return `<svg class="pc-svg" viewBox="0 0 ${W} 470" role="${o.slots || o.play ? "group" : "img"}" aria-label="${o.label || ""}"><defs><marker id="pcA${o.uid}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker></defs>
      ${m ? arrow(187, 257, 224, 257) : ""}${arrow(187 + X, 257, 224 + X, 257)}${arrow(367 + X, 257, 402 + X, 257)}${arrow(544 + X, 257, 584 + X, 257)}${arrow(727 + X, 257, 768 + X, 257)}
      ${arrow(476 + X, 275, 476 + X, 247)}${arrow(659 + X, 276, 659 + X, 248)}
      <path id="pcArc${o.uid}" d="M${657 + X},${104} C${610 + X},${8} ${380 + X},${-10} ${300 + X},${183}" fill="none" stroke="currentColor" stroke-width="5" marker-end="url(#pcA${o.uid})"/>
      ${o.labels ? `<path id="pcArcT${o.uid}" d="M${300 + X},${183} C${380 + X},${-10} ${610 + X},${8} ${657 + X},${104}" fill="none"/><text font-size="22" font-style="italic" fill="currentColor" dy="-12"><textPath href="#pcArcT${o.uid}" startOffset="50%" text-anchor="middle">deceptive resolution</textPath></text>
      <text x="${476 + X}" y="445" text-anchor="middle" font-size="17" font-weight="700" letter-spacing="1" fill="currentColor">PRE-DOMINANTS</text><text x="${659 + X}" y="445" text-anchor="middle" font-size="17" font-weight="700" letter-spacing="1" fill="currentColor">DOMINANTS</text><text x="${860 + X}" y="375" text-anchor="middle" font-size="17" font-weight="700" letter-spacing="1" fill="currentColor">TONIC</text>` : ""}
      ${ids.map(sq).join("")}
      ${slot("t", `<circle${st("t")} cx="${860 + X}" cy="258" r="81" fill="var(--fi-card, #fff)" stroke="currentColor" stroke-width="7"/>${lab(fill.t, 860 + X, 260, true)}`)}${caps}</svg>`;
  }
  const PC = { mode: "major", place: {}, sel: null, hints: 0, checked: false };
  const pcHTML = () => `<div class="toy pc-act" id="pcAct"><div class="toy-row" role="group" aria-label="Key"><button type="button" class="play" data-pcm="major" aria-pressed="${PC.mode === "major"}">Major</button><button type="button" class="play" data-pcm="minor" aria-pressed="${PC.mode === "minor"}">Minor</button></div>
      <div class="pc-wrap" id="pcBlank"></div>
      <div class="pc-tiles" id="pcTiles" role="group" aria-label="Chords to place"></div>
      <div class="toy-row"><button type="button" class="play" id="pcCheck">Check</button><button type="button" class="play" id="pcHint">Hint</button><button type="button" class="play" id="pcReset">Start over</button></div>
      <p class="pc-say" id="pcSay" aria-live="polite">Drag each chord into a box, or tap a chord and then tap a box.</p></div>`;
  function pcWire(root, tools) {
    const act = root.querySelector("#pcAct"); if (!act) return;
    const ans = () => CHART[PC.mode], say = t => { act.querySelector("#pcSay").textContent = t; };
    const draw = () => {
      const a = ans(), state = {};
      if (PC.checked) Object.keys(a).forEach(id => { if (PC.place[id]) state[id] = PC.place[id] === a[id] ? "ok" : "no"; });
      act.querySelector("#pcBlank").innerHTML = chartSVG(PC.mode, PC.place, { slots: true, uid: "b", caps: PC.hints > 0, state, label: `Blank progression chart, ${PC.mode}`, aria: id => `${SLOTPOS[id]}: ${PC.place[id] ? PC.place[id] + (state[id] === "ok" ? ", correct" : state[id] === "no" ? ", not right" : "") : "empty"}` });
      const used = new Set(Object.values(PC.place));
      if (!PC.order || PC.order.length !== Object.keys(a).length || PC.order.some(c => !Object.values(a).includes(c))) { PC.order = Object.values(a); for (let i = PC.order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [PC.order[i], PC.order[j]] = [PC.order[j], PC.order[i]]; } }
      act.querySelector("#pcTiles").innerHTML = PC.order.filter(c => !used.has(c)).map(c => `<button type="button" class="pc-tile" draggable="true" data-tile="${c}" aria-pressed="${PC.sel === c}">${c.replace("°", "<sup>o</sup>")}</button>`).join("") || `<span class="small">All placed. Press Check.</span>`;
    };
    const put = (id, c) => { Object.keys(PC.place).forEach(k => { if (PC.place[k] === c) delete PC.place[k]; }); PC.place[id] = c; PC.sel = null; PC.checked = false; draw(); say(`${c} placed in the ${SLOTPOS[id]}.`); };
    act.addEventListener("click", e => {
      const m = e.target.closest("[data-pcm]"); if (m) { PC.mode = m.dataset.pcm; PC.place = {}; PC.sel = null; PC.hints = 0; PC.checked = false; act.querySelectorAll("[data-pcm]").forEach(x => x.setAttribute("aria-pressed", String(x === m))); draw(); say(`${PC.mode === "minor" ? "Minor" : "Major"}: ${Object.keys(ans()).length} chords to place.`); return; }
      const t = e.target.closest("[data-tile]"); if (t) { PC.sel = PC.sel === t.dataset.tile ? null : t.dataset.tile; draw(); if (PC.sel) say(`${PC.sel} selected. Now tap a box.`); return; }
      const sl = e.target.closest("[data-slot]"); if (sl) { const id = sl.dataset.slot; if (PC.sel) put(id, PC.sel); else if (PC.place[id]) { const c = PC.place[id]; delete PC.place[id]; PC.checked = false; draw(); say(`${c} taken out.`); } return; }
      if (e.target.closest("#pcCheck")) { const a = ans(), ids = Object.keys(a), right = ids.filter(id => PC.place[id] === a[id]).length; PC.checked = true; draw();
        say(right === ids.length ? "All correct. That's the chart." : `${right} of ${ids.length} correct${Object.keys(PC.place).length < ids.length ? ", and some boxes are still empty" : ""}. Boxes in red need another look.`); return; }
      if (e.target.closest("#pcHint")) { const a = ans();
        if (PC.hints === 0) { PC.hints = 1; draw(); say("Hint: the labels under the chart name each column. Start from the tonic and work right to left: each box to the left has a root a 5th higher."); return; }
        const miss = Object.keys(a).find(id => PC.place[id] !== a[id]); if (!miss) { say("Everything is already in place."); return; }
        PC.hints++; put(miss, a[miss]); say(`Hint: ${a[miss]} goes in the ${SLOTPOS[miss]}.`); return; }
      if (e.target.closest("#pcReset")) { PC.order = null; PC.place = {}; PC.sel = null; PC.hints = 0; PC.checked = false; draw(); say("Cleared."); }
    });
    act.addEventListener("keydown", e => { const sl = e.target.closest("[data-slot]"); if (sl && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); sl.dispatchEvent(new MouseEvent("click", { bubbles: true })); } });
    act.addEventListener("dragstart", e => { const t = e.target.closest("[data-tile]"); if (t) { e.dataTransfer.setData("text/plain", t.dataset.tile); e.dataTransfer.effectAllowed = "move"; } });
    act.addEventListener("dragover", e => { if (e.target.closest("[data-slot]")) e.preventDefault(); });
    act.addEventListener("drop", e => { const sl = e.target.closest("[data-slot]"); if (!sl) return; e.preventDefault(); const c = e.dataTransfer.getData("text/plain"); if (c) put(sl.dataset.slot, c); });
    draw();
  }
  const PCREF = { mode: "major" };
  const refHTML = () => `<div class="toy pc-ref" id="pcRef"><div class="toy-row" role="group" aria-label="Key"><button type="button" class="play" data-pcr="major" aria-pressed="${PCREF.mode === "major"}">Major</button><button type="button" class="play" data-pcr="minor" aria-pressed="${PCREF.mode === "minor"}">Minor</button><span class="small">Tap a chord to hear it (in C major or A minor).</span></div><div class="pc-wrap" id="pcRefChart"></div></div>`;
  function refWire(root, tools) {
    const box = root.querySelector("#pcRef"); if (!box) return;
    const draw = () => { const f = CHART[PCREF.mode]; box.querySelector("#pcRefChart").innerHTML = chartSVG(PCREF.mode, f, { play: true, labels: true, uid: "r", label: PCREF.mode === "major" ? "Progression chart in major: iii to vi to ii or IV (IV can move up to ii) to V or vii diminished (vii diminished can move up to V) to I. An arc from V back to vi." : "Progression chart in minor: VII to III to VI to ii diminished or iv (iv can move up to ii diminished) to V or vii diminished (vii diminished can move up to V) to i. An arc from V back to VI." }); };
    box.addEventListener("click", e => { const b = e.target.closest("[data-pcr]"); if (b) { PCREF.mode = b.dataset.pcr; box.querySelectorAll("[data-pcr]").forEach(x => x.setAttribute("aria-pressed", String(x === b))); draw(); return; }
      const c = e.target.closest("[data-chord]"); if (c) tools.play({ chords: [CMIDI[PCREF.mode][c.dataset.chord]], gap: 1.2 }); });
    box.addEventListener("keydown", e => { const c = e.target.closest("[data-chord]"); if (c && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); c.dispatchEvent(new MouseEvent("click", { bubbles: true })); } });
    draw();
  }
  const lesson = { defMode: "major", steps: [
    { title: "Chord functions", kick: "Tonic, pre-dominant, dominant", keyed: "both", render: (H, k, U) => `<p>Chord <b>progression</b> (the succession from one harmony to the next) follows patterns typical of a style. In common-practice music, diatonic chords group into three <b>functions</b>:</p>
      <div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Function</th><th scope="col">In ${k.label}</th></tr></thead><tbody>
      <tr><td><b>Tonic (T)</b></td><td>{rn:${H.rnOf(k, 1)}} (home)</td></tr><tr><td><b>Pre-dominant (PD)</b></td><td>{rn:${H.rnOf(k, 4)}}, {rn:${H.rnOf(k, 2)}} (and {rn:${H.rnOf(k, 6)}} in {rn:${H.rnOf(k, 6)}}–{rn:V})</td></tr><tr><td><b>Dominant (D)</b></td><td>{rn:V}, {rn:vii°}</td></tr></tbody></table></div>
      <p>Chords that share two tones with the tonic ({rn:${H.rnOf(k, 6)}}, {rn:${H.rnOf(k, 3)}}) can extend the tonic area. In minor, chord qualities change to fit the mode, including the raised 6th and 7th degrees.</p>`
      + H.check(`In ${k.label}, what function does {rn:${H.rnOf(k, 2)}} have?`, "Pre-dominant", ["Tonic", "Dominant"], "ii (like IV) leads to the dominant.") },
    { title: "The progression chart", kick: "Which chord goes where", render: (H) => `<p>Common progressions in major move left to right across this chart, toward the tonic:</p>
      ${refHTML()}
      <p>The tonic is the star, and the other chords are planets whose pull toward it depends on how close they are. The farther right a chord sits, the stronger its pull to keep moving right. The tonic can go anywhere.</p>
      <p>Each box to the left has a root a 5th above the one it leads to: {rn:vi} is a 5th above {rn:ii}, {rn:iii} a 5th above {rn:vi}. {rn:IV} and {rn:ii} share pre-dominant function, and {rn:IV} often moves up to {rn:ii}. {rn:V} and {rn:vii°} share dominant function. Diminished chords have no perfect 5th, so {rn:vii°} is much less common than {rn:V}. The arc is the <b>deceptive resolution</b>: {rn:V} going to {rn:vi} instead of {rn:I}.</p>
      <p>In minor the chart grows a box at the left. {rn:VII}, built on the lowered 7th degree, is a 5th above {rn:III} and leads to it the way {rn:V} leads to {rn:I}. The dominants still use the raised leading tone, so {rn:V} is major and {rn:vii°} diminished.</p>
      <p>Two common exceptions: <b>plagal motion</b> {rn:IV}–{rn:I}, and {rn:vi} as a pre-dominant in {rn:vi}–{rn:V} (even more common: {rn:VI}–{rn:V} in minor).</p>
`
      + H.check("Is V → IV a progression or a retrogression?", "Retrogression", ["Progression"], "It moves right to left on the chart."),
      after: (root, H, k, tools) => refWire(root, tools) },
    { title: "Fill in the chart", kick: "Drag the chords into place", render: () => `<p>Put each chord in its box. Drag it, or tap a chord and then tap a box; tap a placed chord to take it back out. Switch to Minor for the longer chart. Hint shows labels under the columns first, then fills in one box at a time.</p>${pcHTML()}<p>For class: <a href="chord-progressions-in-real-songs.html">Chord Progressions in Real Songs</a> puts the chart to work on five songs.</p>`,
      after: (root, H, k, tools) => pcWire(root, tools) },
    { title: "The phrase model", kick: "T → PD → D → (T)", render: (H) => `<p>Common-practice phrases tend to move through “areas”: <b>tonic area (T) → pre-dominant area (PD) → dominant area (D) → (T)</b>. T can move to PD or D; PD only to D; D only to T.</p>
      <p>Each area can be expanded: the tonic as in {rn:I}–{rn:IV}–{rn:I6}–{rn:V43}–{rn:I}, the pre-dominant as {rn:IV}–{rn:ii} before {rn:V}, the dominant with the cadential six-four, {rn:I64}–{rn:V7}.</p>
      <p>The tonic area can change position (I–I⁶), move to a chord sharing two tones (vi or iii), or insert ornamental chords between tonics. The pre-dominant area can include IV, ii and iii, and substitutes for them (secondary chords, augmented sixths, the Neapolitan). The dominant area most often uses the cadential ⁶₄, or V–V⁷, or vii°⁶(⁵)–V⁷.</p>` },
    { title: "Circle progressions", kick: "Down by 5ths", keyed: "major", render: (H, k, U) => {
      const circ = [1, 4, 7, 3, 6, 2, 5, 1].map(d => H.diat(k, d).sym).map(s => `{sym:${s}}`).join(" – ");
      const chrom = [3, 6, 2, 5].map(d => H.chord(H.deg(k, d), "7").sym).concat([H.diat(k, 1).sym]).map(s => `{sym:${s}}`).join(" – ");
      return `<p>A <b>circle progression</b> moves counterclockwise around the circle of fifths for an extended passage: each root falls a 5th (or rises a 4th).</p>
      <p>The <b>diatonic circle</b> uses only notes of the key; a complete one passes through the diminished chord: ${circ}</p>`
      + `<p>Run the whole diatonic circle and it seems to drift from a major key to its relative minor. “Autumn Leaves” does exactly that: ii⁷–V⁷–I–IV in F major, then the same falling 5ths land in D minor, where F's IV is D minor's VI.</p>`
      + EX("autumn-leaves", 2096, 506, "Autumn Leaves, eight bars on a grand staff in F major with chord symbols Gm7, C7, Fmaj7, Bbmaj7, Em7(b5), A7, Dm7. Analysis under the bass: F major ii7, V7, I, IV, overlapping with D minor VI, ii half-diminished 7, V7, i.", "Joseph Kosma, “Autumn Leaves,” sung by Nat King Cole. Roots fall by 5ths the whole way: G–C–F–B♭–E–A–D.", "Autumn Leaves, Nat King Cole, excerpt")
      + `<p>A <b>chromatic circle</b> keeps root motion by perfect 4ths/5ths regardless of key, usually as a stream of major or dominant 7th chords: ${chrom}. Jazz bridges often run through an extended chromatic circle.</p>
      <p>The bridge of Duke Jordan's “Jordu” is two of them. The tune is in C minor; the first half of the bridge starts on the dominant and falls by 5ths, all dominant 7ths, until it cadences on D♭⁷. Then the whole phrase is moved down a whole step before the tune comes back to C minor.</p>`
      + EX("jordu", 2200, 668, "Jordu, bridge, two lines of melody in C minor with chord symbols G7, C7, F7, Bb7, Eb7, Ab7, Db7, then F7, Bb7, Eb7, Ab7, Db7, Gb7, N.C.", "Duke Jordan, “Jordu,” bridge (bar 11 on).", "Jordu, excerpt")
      + `<p>The <b>doo-wop progression</b> moves along the circle too: {rn:I}–{rn:vi}–{rn:ii}–{rn:V}, as in ${YT("2sAHiR0rkJg", "“Why Do Fools Fall in Love”")} (Frankie Lymon and the Teenagers), or {rn:I}–{rn:vi}–{rn:IV}–{rn:V}, as in ${YT("425GpjTSlS4", "“Please Mr. Postman”")} (the Marvelettes). In both, I–vi is a tonic prolongation.</p>`;
    } },
    { title: "An analysis", kick: "Common practice in a pop song", render: (H) => `<p>Gerry Goffin and Carole King's “Will You Love Me Tomorrow” runs on common-practice principles from start to finish. Listen to Carole King's recording and follow the chords (lyrics left out).</p>
      <figure class="lfig hs-fig">${AUD("will-you-love-me-tomorrow", "Carole King, Will You Love Me Tomorrow, excerpt")}<figcaption><p>Gerry Goffin and Carole King, “Will You Love Me Tomorrow,” recorded by Carole King on <i>Tapestry</i> (1971).</p>${FU}</figcaption></figure>
      <div class="ltable-wrap"><table class="ltable"><caption>Verse and bridge, one bar per chord slot</caption><thead><tr><th scope="col">Line</th><th scope="col">Chords</th><th scope="col">What happens</th></tr></thead><tbody>
      <tr><td>1</td><td>{sym:C} | – | {sym:F} | {sym:G}</td><td>T – PD – D</td></tr><tr><td>2</td><td>{sym:C} | – | {sym:G7} | –</td><td>T – D</td></tr>
      <tr><td>3–4</td><td>{sym:E7} | – | {sym:Am} | – | {sym:F} | {sym:G} | {sym:C} | –</td><td>a circle progression: E7 ({rn:V7/vi}) is a chromatic variant of iii, F (IV) substitutes for ii, and F–G–C is PD–D–T</td></tr>
      <tr><td>5–6 (bridge)</td><td>{sym:F} | – | {sym:Em} | – | {sym:F} | {sym:G} | {sym:C} | –</td><td>IV prolonged (F–Em–F), then PD–D–T</td></tr>
      <tr><td>7–8</td><td>{sym:F} | – | {sym:Em} | – | {sym:Am} | {sym:D7} | {sym:Dm7} | {sym:G7}</td><td>the same IV-to-iii chord stream starts again but turns into a circle: iii – vi – V⁷/V – ii⁷ – V⁷, with D7–Dm7 prolonging the pre-dominant</td></tr></tbody></table></div>
      <p>Line 1 is the whole phrase model in four bars. Line 2 skips the pre-dominant. Lines 3 and 4 stretch the model out with a circle that starts far from home, on E7, and walks back by 5ths.</p>` },
    { title: "Retrogression", kick: "Backwards around the circle", render: (H) => `<p>A <b>retrogression</b> reverses common-practice motion, moving right to left on the chart: {rn:V}–{rn:IV}, {rn:iii}–{rn:ii}, {rn:ii}–{rn:vi}. (I–V isn't one, since I can go anywhere; neither is vi–V.)</p>
      <p>In rock, retrogressions often follow the reverse path around the circle of fifths, especially {rn:♭VII}–{rn:IV}–{rn:I}. Jimi Hendrix's “Hey Joe” pushes that path out five stops, C – G – D – A – E, and implies two keys on the way.</p>`
      + EX("hey-joe", 2168, 520, "Hey Joe, four bars of melody with chord symbols C, G, D, A, E. Analysis below in E: flat VI, flat III, flat VII, IV, I; or in G: IV, I, then in E: IV of IV, IV, I.", "Jimi Hendrix, “Hey Joe.” Heard in E, it's ♭VI–♭III–♭VII–IV–I; heard as starting in G, it's IV–I, then IV/IV–IV–I in E.", "Hey Joe, Jimi Hendrix, excerpt")
      + `<p>Bruce Hornsby's “The Way It Is” uses two kinds of diatonic retrogression: roots falling by 4ths (ii–vi) and roots falling by step (V–IV). Look only at the strong beats, though, and the phrase is common practice, ii – V – I, until it ends on IV: a plagal half cadence.</p>`
      + EX("the-way-it-is", 2168, 531, "The Way It Is, four bars in G with chord symbols Am7, Em, D, C, G, D, C(add2). Brackets mark three retrogressions, ii to vi, V to IV, V to IV, and a longer bracket marks the common-practice line ii, V, I, IV.", "Bruce Hornsby and the Range, “The Way It Is” (1986).", "The Way It Is, excerpt")
      + `<p>Pachelbel's Canon works the same way. The bass alternates retrogressive falling 4ths with progressive rising steps, but the main chords on each downbeat make a progression, I – vi – IV – IV – V. The second chord in each of the first three bars embellishes.</p>`
      + EX("canon-in-d", 2160, 317, "Canon in D bass line in D major, half notes D, A, B, F sharp, G, D, G, A. Main progression chords below: I, vi, IV, IV, V; embellishing chords: V, iii, I.", "Johann Pachelbel, Canon in D, the ground bass with its main and embellishing chords.", "Canon in D, excerpt") },
    { title: "Chord streams", kick: "Following the bass", keyed: "minor", render: (H, k, U) => {
      const and = [[1, "m"], [7, "M"], [6, "M"], [5, "M"]].map(([d, q]) => { const r = d === 5 ? H.deg(k, 5) : H.deg(k, d); return H.chord(r, q).sym; }).map(s => `{sym:${s}}`).join(" – ");
      return `<p>In some music, root-position chords simply harmonize a stepwise bass line, following neither progression nor retrogression: a <b>chord stream</b>. Harmonizations can be diatonic or chromatic (often major chords over every bass note). A rock favorite puts major chords over the notes of the natural minor scale.</p>
      <p>The <b>Andalusian cadence</b> is a chord stream down a tetrachord, such as {rn:i}–{rn:♭VII}–{rn:♭VI}–{rn:V}: ${and}. It's common in flamenco, rhythm and blues, and jazz.</p>`
        + `<p>Lennon and McCartney's “Here, There and Everywhere” harmonizes a rising bass with diatonic chords, G – Am – Bm – C, each a step above the last.</p>`
        + EX("here-there-everywhere", 2160, 210, "Here, There and Everywhere, two bars in G with chord symbols G, Am, Bm, C over a rising line.", "The Beatles, “Here, There and Everywhere” (1966), opening of the verse.", "Here, There and Everywhere, excerpt")
        + `<p>“(I'm Not Your) Steppin' Stone,” by Tommy Boyce and Bobby Hart for the Monkees, is the rock favorite: major chords on E, G, A and C, the roots of E natural minor's scale steps 1, 3, 4 and 6, every one of them major.</p>`
        + EX("stepping-stone", 2160, 197, "Steppin' Stone, four bars in E with chord symbols E, G, A, C, then E, G, A, C again.", "Tommy Boyce and Bobby Hart, “(I'm Not Your) Steppin' Stone,” recorded by the Monkees (1966).", "Steppin' Stone, the Monkees, excerpt")
        + `<p>${YT("ySA_QYVWj9k", "Flamenco")} uses the Andalusian cadence constantly, and so does Ray Charles' “Hit the Road Jack.” Ann Ronnell's “Willow Weep for Me” has it in bars 3 and 4, where the chords step down under a sequence in the melody. In bars 7 and 8 the descent comes back with chords slipped in between to make a circle progression.</p>`
        + EX("willow-weep-for-me", 2168, 616, "Willow Weep for Me, two lines in F with chord symbols B flat minor 7, G minor 7 flat 5, C7 flat 9, F minor, F7, B flat minor, A flat 9, G flat 7, F7; the second line adds E flat 9, A flat minor 7, D flat 9, G flat 7, C7 sharp 5.", "Ann Ronnell, “Willow Weep for Me” (1932), recorded by Louis Armstrong.", "Willow Weep for Me, Louis Armstrong, excerpt")
        + `<p>Impressionist music can keep one chord type (say, major) over roots moving along the whole-tone scale. Ben Folds Five do it in a rock song: G – F – E♭ – D♭, then E♭ – C♭ – D♭ – E♭ – F, all major chords.</p>`
        + EX("battle-of-who-could-care-less", 2176, 595, "Battle of Who Could Care Less, block chords with symbols G, F, E flat, D flat, then E flat, C flat, D flat, E flat, F.", "Ben Folds Five, “Battle of Who Could Care Less” (1997).", "Battle of Who Could Care Less, excerpt");
    } },
    { title: "Structural or embellishing?", kick: "The harmonic skeleton", render: () => `<p>Some chords are <b>structural</b>; others <b>embellish</b> (ornament) them. Skipping over embellishing chords reveals relationships between non-consecutive chords. What makes a chord more structural:</p>
      <ul><li><b>The prevailing key:</b> diatonic chords are more structural than chromatic ones; chords with non-chord tones are weaker.</li>
      <li><b>Meter:</b> chords on strong beats (and strong bars) are more structural. Watch for syncopation and agogic accents.</li>
      <li><b>Inversion:</b> inverted chords tend to be weaker than root-position ones.</li>
      <li><b>Prolongation:</b> chords inside a larger pattern that extends one area (tonic area, dominant area) form a region bordered by a harmony. In I – V⁶ – IV⁶ – I⁶₄ – IV – ii – I⁶₄ – V⁷, the first four chords are a tonic area, the next two pre-dominant, the last two dominant: the first I⁶₄ is a tonic, the second a cadential ⁶₄.</li>
      <li><b>Cadences:</b> cadence chords are always structural; turnaround chords are not.</li></ul>
      <h3>Case study: “Goodbye Yellow Brick Road”</h3>
      <p>Listen to ${YT("wy709iNG6i8", "Elton John's recording")} with the sheet music from class. Mark which chords are structural and which embellish, then check whether the structural ones follow the progression chart.</p>` },
    { title: "Embellishing chords", kick: "Harmonized non-chord tones", render: (H) => `<p>Embellishing chords share names with non-chord tones: you can think of them as non-chord tones harmonized, with a whole chord made to fit the bass.</p>
      <ul><li><b>Passing chord</b>: {rn:V43} between {rn:I} and {rn:I6}, carrying the bass up by step.</li>
      <li><b>Neighbor chord</b>: {rn:V6} between two tonics; the bass steps down and back.</li>
      <li><b>Arpeggiating chord</b>: {rn:I}–{rn:I6}, the bass skipping within one harmony.</li>
      <li><b>Pedal chord</b>: {rn:IV64} over a held tonic bass, between two tonics.</li></ul>
      <figure class="lfig hs-fig"><img src="assets/img/harmsucc/embellishing-chords.png" width="2042" height="460" alt="Four embellishing chords in G minor on a grand staff. Gm/Bb to F/A to Gm is labeled passing chord, with an arrow along the stepwise bass B flat, A, G. Gm to Gm/Bb is labeled arpeggiating chord, with an arc over the bass skip G to B flat. A half-diminished 7/C to A7 is labeled root position secondary chord. Gm/D to D over a held D is labeled pedal chord. Analysis: i6, V6, i, i6, ii half-diminished 6-5, V7, i 6-4 to 5-3." loading="lazy" style="width:100%;height:auto;background:#fff;border-radius:8px"><figcaption><p>Embellishing chords in G minor: passing (V⁶ between i⁶ and i), arpeggiating (i to i⁶), a root-position secondary chord, and a pedal chord (the cadential ⁶₄ over a held D).</p></figcaption></figure>
      <h3>Video: real emotional chords</h3>
      <figure class="lfig"><video controls preload="metadata" playsinline src="assets/video/Real%20Emotional%20Chords%20-%20audio%20improved.mp4" style="width:100%;height:auto;border-radius:8px;background:#000">Your browser can't play this video.</video><figcaption><p>Adam Silverman, “Real Emotional Chords” (5:37).</p></figcaption></figure>
      <p>The <b>cadential ⁶₄</b> is a special pedal chord that decorates the dominant at a cadence. Root-position <b>secondary chords</b> (like V⁷/V) can also embellish the diatonic chords they lead to.</p>` },
    { title: "In context", kick: "A hymn phrase", render: () => `<p>Take the hymn “Nearer, My God, to Thee” in F. In the first phrase each harmony mostly lasts a whole bar: B♭ through bar 2, F through bar 3 (changing inversion), C in bar 4. Bar 1 has three chords, but F is the strongest: on the downbeat and twice as long as the other two.</p>
      <figure class="lfig hs-fig"><img src="assets/img/harmsucc/nearer-phrase-1.png" width="2104" height="511" alt="Nearer, My God, to Thee, phrase 1, four bars in F for four voices with chord symbols F, C7, Dm, B flat, F, F/A, F, C." loading="lazy" style="width:100%;height:auto;background:#fff;border-radius:8px"><figcaption><p>Phrase 1: a three-bar tonic prolongation, then the dominant.</p></figcaption></figure>
      <ul><li>All the chords are diatonic, so their strength depends on how close they sit to the tonic on the progression chart: mostly F and C (C7), with some B♭ and a little Dm.</li>
      <li>The only inversion, F/A in bar 3, is an <b>arpeggiating chord</b>: its bass moves between members of the same chord.</li>
      <li>The weak C7 and Dm in bar 1 form a <b>tonic prolongation</b> leading to the B♭ (IV) of bar 2, which itself connects the tonics of bars 1 and 3.</li>
      <li>So the first phrase is a three-bar tonic prolongation and a cadence on the dominant: a I–V structure.</li></ul>
      <p>The second phrase starts the same way but cadences differently. Its structure is I–IV–V–I, with the dominant expanded by a cadential ⁶₄ (F/C to C7).</p>
      <figure class="lfig hs-fig"><img src="assets/img/harmsucc/nearer-phrase-2.png" width="2104" height="523" alt="Nearer, My God, to Thee, phrase 2, four bars in F with chord symbols F, C7, Dm, B flat, F/C, C7, F." loading="lazy" style="width:100%;height:auto;background:#fff;border-radius:8px"><figcaption><p>Phrase 2: I–IV–V–I, the V⁷ prolonged by the cadential ⁶₄.</p></figcaption></figure>
      <p>The third phrase adds a <b>pedal chord</b>, B♭/F, inside a long tonic prolongation that runs from its first bar to the middle of its last.</p>
      <figure class="lfig hs-fig"><img src="assets/img/harmsucc/nearer-phrase-3.png" width="2104" height="508" alt="Nearer, My God, to Thee, phrase 3, four bars in F with chord symbols F, B flat/F, F, then B flat, F, C." loading="lazy" style="width:100%;height:auto;background:#fff;border-radius:8px"><figcaption><p>Phrase 3: B♭/F over a held F is a pedal chord.</p></figcaption></figure>` },
    { title: "Quick check", kick: "Before the drills", render: (H) => [FACTS[1], FACTS[5], FACTS[9], FACTS[11]].map(([q, a, w, y]) => H.check(q, a, w, y)).join("") },
  ] };

  return {
    key: "silverapps-harmsucc-v1", lesson, make, reference,
    modes: [{ id: "func", kicker: "Function" }, { id: "prog", kicker: "Progression?" }, { id: "area", kicker: "Phrase model" }, { id: "embel", kicker: "Embellishing chords" }, { id: "pattern", kicker: "Patterns" }, { id: "concepts", kicker: "Concepts" }],
    topics: [],
  };
})();
// ===== Test yourself quiz (engine adds it as the step before Practice; s = step to look back at) =====
window.FAM.quiz = [{"s": 1, "q": "Which two chords share pre-dominant function in major?", "a": "{rn:IV} and {rn:ii}", "w": ["{rn:V} and {rn:vii°}", "{rn:I} and {rn:vi}", "{rn:iii} and {rn:V}"], "hint": "Check the function table.", "why": "IV and ii are pre-dominants. V and vii° are dominants."}, {"s": 2, "q": "On the progression chart, each box leads to the box to its right. How are their roots related?", "a": "each root is a 5th above the one it leads to", "w": ["each root is a step below", "each root is a 3rd above", "the roots are the same"], "hint": "vi leads to ii, iii leads to vi.", "why": "Moving right, roots fall by 5ths: iii → vi → ii → V → I."}, {"s": 2, "q": "What does the arc on the chart, V going to vi, represent?", "a": "the deceptive resolution", "w": ["a plagal cadence", "a retrogression", "a modulation"], "hint": "V is expected to go to I.", "why": "V → vi instead of I is the deceptive resolution."}, {"s": 2, "q": "Is ii → V a progression or a retrogression?", "a": "a progression", "w": ["a retrogression", "neither", "only in minor"], "hint": "Progressions move left to right on the chart.", "why": "ii sits left of V, so ii → V moves toward the tonic: a progression."}, {"s": 4, "q": "In the phrase model, where can the pre-dominant area go?", "a": "only to the dominant", "w": ["only to the tonic", "anywhere", "back to the tonic or to the dominant"], "hint": "T can go to PD or D; D only to T.", "why": "T → PD → D → (T). PD leads only to D."}, {"s": 5, "q": "A circle progression's roots…", "a": "fall by 5ths (or rise by 4ths)", "w": ["rise by step", "fall by 3rds", "stay the same"], "hint": "It moves counterclockwise around the circle of fifths.", "why": "iii – vi – ii – V – I: each root falls a 5th."}, {"s": 7, "q": "Which of these is a retrogression?", "a": "{rn:V} – {rn:IV}", "w": ["{rn:IV} – {rn:V}", "{rn:I} – {rn:V}", "{rn:vi} – {rn:V}"], "hint": "I can go anywhere, and vi–V is a common exception.", "why": "V → IV moves right to left on the chart."}, {"s": 8, "q": "The Andalusian cadence, i – ♭VII – ♭VI – V, is an example of a…", "a": "chord stream down a tetrachord", "w": ["circle progression", "plagal cadence", "tonic prolongation"], "hint": "Root-position chords over a stepwise bass.", "why": "Cm – B♭ – A♭ – G harmonizes a falling bass line, one chord per step."}, {"s": 9, "q": "Which chord is likely to be more structural?", "a": "a root-position diatonic chord on a strong beat", "w": ["an inverted chord on a weak beat", "a chromatic chord inside a turnaround", "a chord full of non-chord tones"], "hint": "Key, meter, inversion and cadences all count.", "why": "Diatonic, root position and strong beats all make a chord more structural."}, {"s": 10, "q": "V⁴₃ between I and I⁶, with the bass walking up by step, is a…", "a": "passing chord", "w": ["neighbor chord", "pedal chord", "cadential ⁶₄"], "hint": "Embellishing chords share names with non-chord tones.", "why": "The bass passes from 1 to 3 through 2: a passing chord."}];
