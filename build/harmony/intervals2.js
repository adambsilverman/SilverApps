window.FAM = (() => {
  // ===== More About Intervals: lesson only (practice: the Interval drills). Follows "Intervals: What, Why and How".
  // Consonance, melodic/harmonic, half step vs. 2nd, non-adjacent intervals (Over the Rainbow), compound intervals and extensions,
  // intervals above the tonic in major and minor scales, interval inversion (the rule of nine). Engine: build/harmony/engine.js =====
  const tbl = (cap, head, rows) => `<div class="ltable-wrap" tabindex="0" role="region" aria-label="${cap}"><table class="ltable"><caption>${cap}</caption><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  const FU = `<p class="note lcite fair-use" data-fair-use></p>`;
  // interval name from two spelled notes: number from letters, quality from half steps
  const BASE = [0, 2, 4, 5, 7, 9, 11], PERF = new Set([0, 3, 4]);
  function ivName(H, lo, hi) {
    const [st, se] = H.ivl(lo, hi), d = se - (BASE[st % 7] + 12 * Math.floor(st / 7)), num = st + 1;
    const q = PERF.has(st % 7) ? ({ "-2": "dd", "-1": "d", 0: "P", 1: "A", 2: "AA" })[d] : ({ "-2": "d", "-1": "m", 0: "M", 1: "A" })[d];
    return { q: q || "?", num, short: (q || "?") + num };
  }
  const QW = { P: "perfect", M: "major", m: "minor", A: "augmented", d: "diminished" };
  const ord = n => n + (n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th");
  const longName = iv => iv.num === 1 ? `${QW[iv.q]} unison` : iv.num === 8 && iv.q === "P" ? "octave" : `${QW[iv.q]} ${ord(iv.num)}`;
  const score = (bars, o = {}) => ({ type: "score", clefs: [o.clef || "treble"], time: o.time || null, vf: o.vf || "C", sig: o.sig || {}, bpm: o.bpm || 90, final: !!o.final, minBar: o.minBar || 70, scale: o.scale, bars: bars.map(v => ({ t: [v] })) });
  const N = (k, d = "w", x = {}) => Object.assign({ k: Array.isArray(k) ? k : [k], d }, x);

  // step 1: consonant and dissonant intervals above C4, harmonic
  const CONS = [["Perfect consonances", [["C5", "P8"], ["G4", "P5"], ["C4", "P1"]]], ["Imperfect consonances", [["E4", "M3"], ["E♭4", "m3"], ["A4", "M6"], ["A♭4", "m6"]]],
    ["Dissonances", [["D♭4", "m2"], ["D4", "M2"], ["B♭4", "m7"], ["B4", "M7"], ["F♯4", "A4 (tritone)"]]]];
  const consSpec = () => score(CONS.map(([, ivs]) => ivs.map(([t, lab]) => N(["C4", t], "w", { ly: lab }))), { minBar: 60 });

  // step 4: Over the Rainbow, first phrase, in C (Harold Arlen and E. Y. Harburg, 1939); the hidden stepwise line is circled
  const HL = { hl: true, color: "#B3261E" };
  const RAIN = [[N("C4", "h"), N("C5", "h", HL)], [N("B4", "q", HL), N("G4", "8"), N("A4", "8"), N("B4", "q"), N("C5", "q")], [N("C4", "h"), N("A4", "h", HL)], [N("G4", "w", HL)]];
  const rainSpec = () => score(RAIN, { time: "4/4", bpm: 80, final: false, minBar: 90 });

  // step 5: simple vs compound, and a C9 chord voiced two ways
  const compSpec = () => score([[N(["C4", "D4"], "w", { ly: "M2" })], [N(["C4", "D5"], "w", { ly: "M9" })], [N(["C4", "E5"], "w", { ly: "M10" })], [N(["C4", "G5"], "w", { ly: "P12" })]], { minBar: 70 });
  const ninthSpec = () => score([[N(["C4", "E4", "G4", "B♭4", "D5"], "w", { ly: "stacked" })], [N(["C4", "D4", "E4", "B♭4"], "w", { ly: "close" })]], { minBar: 90 });

  // step 6: intervals above the tonic in each scale
  const SC = { tonic: "C", type: "major" }, TONICS = ["C", "G", "D", "A", "E", "F", "B♭", "E♭", "A♭"];
  function scaleNotes(H) {
    const k = H.key(SC.tonic, SC.type === "major" ? "major" : "minor"), s = k.scale.slice();
    if (SC.type === "harmonic" || SC.type === "melodic") s[6] = H.up(s[6], 0, 1);
    if (SC.type === "melodic") s[5] = H.up(s[5], 0, 1);
    const t = s[0], base = H.midi(t) >= 72 ? -1 : 0, out = s.map(n => H.N(n.l, n.a, n.o + base)); out.push(H.N(t.l, t.a, t.o + base + 1));
    return out;
  }
  const scSpec = H => { const ns = scaleNotes(H); return score([ns.map((n, i) => N(H.nmO(n), "w", { ly: i ? ivName(H, ns[0], n).short : "1", color: [1, 3, 4].includes(i) ? "#2E7D32" : [2, 5, 6].includes(i) ? "#B3261E" : undefined }))], { minBar: 480 }); };
  const SCN = { major: "major", natural: "natural minor", harmonic: "harmonic minor", melodic: "melodic minor (ascending)" };
  const scHTML = () => `<div class="toy" id="i2Sc"><div class="toy-row"><label>Tonic <select id="i2Ton">${TONICS.map(t => `<option ${t === SC.tonic ? "selected" : ""}>${t}</option>`).join("")}</select></label>
      <div class="toy-row" role="group" aria-label="Scale">${Object.entries(SCN).map(([v, l]) => `<button type="button" class="play" data-i2s="${v}" aria-pressed="${SC.type === v}">${l}</button>`).join("")}</div>
      <button type="button" class="play" id="i2ScPlay">▶ Play</button></div>
    <div class="staff" id="i2ScStaff" style="width:100%"></div><p class="small" id="i2ScSay" aria-live="polite" style="margin:0"></p></div>`;

  // step 7: inversion explorer, intervals above C4
  const INV = [["D4", "M2"], ["E♭4", "m3"], ["E4", "M3"], ["F4", "P4"], ["F♯4", "A4"], ["G4", "P5"], ["A♭4", "m6"], ["A4", "M6"], ["B♭4", "m7"], ["B4", "M7"]];
  const IV = { i: 2 };
  const invHTML = () => `<div class="toy" id="i2Inv"><div class="toy-row"><label>Interval above C <select id="i2InvSel">${INV.map(([t, l], i) => `<option value="${i}" ${i === IV.i ? "selected" : ""}>${l} (C–${t.slice(0, -1)})</option>`).join("")}</select></label>
      <button type="button" class="play" id="i2InvPlay">▶ Play</button></div>
    <p class="small" style="margin:6px 0 0">Drag either note into the empty bar. The lower note goes up an octave; the upper note goes down one.</p>
    <div class="staff i2-drag" id="i2InvStaff" style="width:100%"></div>
    <div class="toy-row"><button type="button" class="play" id="i2InvLo"></button><button type="button" class="play" id="i2InvHi"></button><button type="button" class="play" id="i2InvReset">Start over</button></div>
    <p id="i2InvSay" aria-live="polite" style="margin:0"></p></div>`;

  const lesson = { steps: [
    { title: "Consonant and dissonant", kick: "How an interval sounds", render: (H, k, U) => `<p>Play C and G together and the sound sits still. Play C and D♭ together and it rubs. That difference has a name: <b>consonance</b> (stable, at rest) and <b>dissonance</b> (tense, wanting to move).</p>
      <p>The <b>perfect consonances</b> are the unison, the octave and the 5th. They blend so completely that they can sound almost like one note. The <b>imperfect consonances</b>, 3rds and 6ths, are stable too, but sweeter and fuller, which is why so much harmony is built from them. Everything else is <b>dissonant</b>: 2nds, 7ths, and the tritone (the augmented 4th or diminished 5th).</p>`
      + U.fig(consSpec(), "Above C: perfect consonances, imperfect consonances, dissonances.", { play: { chords: CONS.flatMap(([, ivs]) => ivs.map(([t]) => t === "C4" ? [60] : [60, H.midi(H.parse(t))])), gap: 1.1 } })
      + `<p>The perfect 4th is the odd one out. On its own it sounds open and consonant, but in common-practice harmony a 4th above the bass is treated as a dissonance. That's why a ⁶₄ chord usually resolves.</p>
      <p>Dissonant doesn't mean wrong. It means unstable. A dominant 7th chord is full of dissonance, and that's exactly what pushes it toward home.</p>`
      + H.check("Which of these is a dissonance?", "a major 7th", ["a perfect 5th", "a minor 6th", "a major 3rd"], "2nds, 7ths and the tritone are dissonant; 3rds and 6ths are imperfect consonances.")
      + H.check("Which pair are both imperfect consonances?", "a minor 3rd and a major 6th", ["a perfect 5th and an octave", "a major 2nd and a minor 7th", "a perfect 4th and a tritone"], "3rds and 6ths, major or minor.") },

    { title: "Melodic and harmonic", kick: "One after the other, or together", render: (H, k, U) => `<p>The same two notes can be heard two ways. Sung one after the other, C then E is a <b>melodic</b> interval. Played at once, it's a <b>harmonic</b> interval. The name doesn't change: it's a major 3rd either way.</p>`
      + U.fig(score([[N("C4", "h", { ly: "melodic" }), N("E4", "h")], [N(["C4", "E4"], "w", { ly: "harmonic" })]], { minBar: 90 }), "A major 3rd, melodic (one note at a time), then harmonic (together).", { play: { chords: [[60], [64], [60, 64]], gap: .8 } })
      + `<p>What changes is how strongly you feel consonance and dissonance. A melodic 2nd is just a step, the most ordinary move a tune can make. A harmonic 2nd is a clash. Melody uses intervals as motion; harmony uses them as color.</p>`
      + H.check("A singer moves from G up to B. That's…", "a melodic interval", ["a harmonic interval", "a compound interval", "an inversion"], "One note after the other.") },

    { title: "Half steps, whole steps and 2nds", kick: "Two ways of naming a step", render: (H, k, U) => `<p>“Half step” and “whole step” measure distance on the keyboard: 1 key and 2 keys. “Minor 2nd” and “major 2nd” name spelled intervals, so they also count letters.</p>
      <p>Most of the time they match. E up to F is a half step and a minor 2nd; C up to D is a whole step and a major 2nd. But a half step can also be spelled with one letter: C to C♯ is an <b>augmented unison</b>.</p>`
      + U.fig(score([[N("E4", "h", { ly: "m2" }), N("F4", "h")], [N("C4", "h", { ly: "A1" }), N("C♯4", "h")], [N("C4", "h", { ly: "M2" }), N("D4", "h")]], { minBar: 80 }), "Two half steps, a minor 2nd and an augmented unison, then a whole step, a major 2nd.", { play: { chords: [[64], [65], [60], [61], [60], [62]], gap: .55 } })
      + `<p>So every minor 2nd is a half step, but not every half step is a minor 2nd. In a scale, where each letter is used once, the steps are always 2nds, so “half step” and “minor 2nd” can be used interchangeably there.</p>`
      + H.check("C up to C♯ is a half step. What is the interval called?", "an augmented unison", ["a minor 2nd", "a diminished 2nd", "a major 2nd"], "Same letter, one half step apart: an augmented unison. A minor 2nd needs two letters (C–D♭).") },

    { title: "Intervals across a melody", kick: "Notes that aren't next to each other", render: (H, k, U) => `<p>“Somewhere over the rainbow” opens with an octave leap, from C up to C (shown here in C). Then the tune drifts down to G and climbs back up to C before leaping from the same low C to A.</p>`
      + U.fig(rainSpec(), "Harold Arlen and E. Y. Harburg, “Over the Rainbow” (1939), the opening phrase, shown in C. Circled: the notes that make a hidden stepwise line.")
      + `<p>The ear doesn't only connect notes that sit side by side. It hears intervals across a gap, too.</p>
      <p>Compare the two leaps. Both start on the same low C: the first goes up an octave, the second only a 6th. The second reach falls short of the first, and that's part of why the phrase sounds like it's settling.</p>
      <p>Now follow the high points: C, then B, then A, then G at the end. Spread across four bars, the peaks walk down a scale, step by step. Nobody sings that line as a line, but you hear it. It gives the phrase its direction under all the leaping.</p>`
      + FU },

    { title: "Simple and compound intervals", kick: "Bigger than an octave", render: (H, k, U) => `<p>An interval an octave or smaller is <b>simple</b>. Anything larger is <b>compound</b>: a 9th is a 2nd plus an octave, a 10th a 3rd plus an octave. To find the simple interval inside a compound one, subtract 7. Not 8: the octave's two notes share one count.</p>`
      + U.fig(compSpec(), "A major 2nd, then the same notes an octave apart (a major 9th); a major 10th; a perfect 12th.", { play: { chords: [[60, 62], [60, 74], [60, 76], [60, 79]], gap: 1.1 } })
      + tbl("Compound intervals and their simple equivalents", ["Compound", "Simple", "In chord symbols"], [["9th", "2nd", "9 (C9, Cadd9)"], ["10th", "3rd", "(the 3rd itself)"], ["11th", "4th", "11 (C11, Cm11)"], ["12th", "5th", "(the 5th itself)"], ["13th", "6th", "13 (C13)"]])
      + `<p>Chord extensions are named this way. Stack 3rds above a 7th chord and the next notes are the 9th, 11th and 13th. In a C9 chord the D is the 9th, and it stays the 9th wherever the pianist puts it. Played right next to the C, it's a 2nd on the page and still a 9th in the chord.</p>`
      + U.fig(ninthSpec(), "C9 two ways: stacked in 3rds (C E G B♭ D), and in close position with the D just above the C (and no G).", { play: { chords: [[60, 64, 67, 70, 74], [60, 62, 64, 70]], gap: 1.6 } })
      + H.check("What is the simple form of a compound 11th?", "a 4th", ["a 3rd", "a 5th", "a 2nd"], "11 − 7 = 4.")
      + H.check("In a C9 chord the D is played just above the C. What is it called in the chord?", "the 9th", ["the 2nd", "the 11th", "an added tone"], "Extensions keep their names in any octave.") },

    { title: "Intervals in scales", kick: "Measured from the tonic", render: () => `<p>A major or minor scale has seven notes, one on each letter, starting from the tonic. Measure each note against the tonic and a pattern shows up. Three intervals never change: every major and minor scale has a <b>major 2nd</b>, a <b>perfect 4th</b> and a <b>perfect 5th</b> above the tonic (green below). The 3rd, 6th and 7th (red) are where the scales differ.</p>
      ${scHTML()}
      ${tbl("Intervals above the tonic", ["Scale", "3rd", "6th", "7th"], [["Major", "M3", "M6", "M7"], ["Natural minor", "m3", "m6", "m7"], ["Harmonic minor", "m3", "m6", "M7"], ["Melodic minor, ascending", "m3", "M6", "M7"]])}
      <p>The 3rd decides major or minor. The 6th and 7th move around inside minor, depending on which form is used. Scales get a unit of their own later, where the <a href="major-and-minor-scales-lesson.html">Major and Minor Scales</a> lesson builds each one step by step.</p>`,
      after: (root, H, k, tools) => {
        const box = root.querySelector("#i2Sc"); if (!box) return;
        const draw = () => { tools.drawStaff(box.querySelector("#i2ScStaff"), scSpec(H)); const ns = scaleNotes(H);
          box.querySelector("#i2ScSay").textContent = `${SC.tonic} ${SCN[SC.type]}: ` + ns.slice(1, 7).map(n => `${H.nm(n)} ${ivName(H, ns[0], n).short}`).join(", ") + "."; };
        box.addEventListener("click", e => { const b = e.target.closest("[data-i2s]"); if (b) { SC.type = b.dataset.i2s; box.querySelectorAll("[data-i2s]").forEach(x => x.setAttribute("aria-pressed", String(x === b))); draw(); }
          if (e.target.closest("#i2ScPlay")) tools.play({ chords: scaleNotes(H).map(n => [H.midi(n)]), gap: .4 }); });
        box.querySelector("#i2Ton").onchange = e => { SC.tonic = e.target.value; draw(); };
        draw();
      } },

    { title: "Inverting intervals", kick: "The rule of nine", render: H => `<p>Take C up to E, a 3rd, and move the C up an octave. Now it's E up to C: a 6th. That's <b>inversion</b>: the lower note goes above the upper one (or the upper below the lower).</p>
      <p>The two numbers always add up to <b>nine</b>. A 2nd inverts to a 7th, a 3rd to a 6th, a 4th to a 5th, a unison to an octave. The quality flips too: major becomes minor, augmented becomes diminished, and perfect stays perfect. The half steps add up to 12, since the two intervals together fill one octave.</p>
      ${invHTML()}
      ${tbl("Inversion", ["Interval", "Inverts to", "Check"], [["M3 (4 half steps)", "m6 (8)", "3 + 6 = 9"], ["m7 (10)", "M2 (2)", "7 + 2 = 9"], ["P4 (5)", "P5 (7)", "4 + 5 = 9"], ["A4 (6)", "d5 (6)", "4 + 5 = 9"]])}
      <p>This saves work. A 6th or a 7th is hard to count; its inversion, a 3rd or a 2nd, is easy. Name the small one, then flip it: C up to B♭? B♭ up to C is a major 2nd, so C up to B♭ is a minor 7th.</p>`
      + H.check("What does a minor 3rd invert to?", "a major 6th", ["a minor 6th", "a major 7th", "a perfect 5th"], "3 + 6 = 9, and minor becomes major.")
      + H.check("What does an augmented 4th invert to?", "a diminished 5th", ["an augmented 5th", "a perfect 5th", "a diminished 4th"], "4 + 5 = 9, and augmented becomes diminished. Both are tritones.")
      + H.check("A perfect 5th inverts to…", "a perfect 4th", ["a perfect 5th", "a major 4th", "a diminished 4th"], "Perfect stays perfect; 5 + 4 = 9."),
      after: (root, H, k, tools) => {
        const box = root.querySelector("#i2Inv"); if (!box) return;
        const staff = box.querySelector("#i2InvStaff");
        const an = iv => (/^[aeiou]/.test(longName(iv)) ? "an " : "a ") + longName(iv);
        // IV.mv: null (nothing moved yet), "lo" (C taken up an octave) or "hi" (the upper note taken down an octave)
        const cur = () => { const lo = H.parse("C4"), hi = H.parse(INV[IV.i][0]);
          const inv = IV.mv === "lo" ? [hi, H.N(lo.l, lo.a, lo.o + 1)] : IV.mv === "hi" ? [H.N(hi.l, hi.a, hi.o - 1), lo] : null;
          return { lo, hi, a: ivName(H, lo, hi), inv, b: inv && ivName(H, inv[0], inv[1]) }; };
        const draw = () => { const c = cur();
          tools.drawStaff(staff, score([[N(["C4", H.nmO(c.hi)], "w", { sym: c.a.short })], [c.inv ? N(c.inv.map(H.nmO), "w", { sym: c.b.short, color: "#B3261E" }) : N([], "w")]], { minBar: 130 }));
          const hn = H.nm(c.hi);
          box.querySelector("#i2InvLo").textContent = `Move C up an octave`; box.querySelector("#i2InvHi").textContent = `Move ${hn} down an octave`;
          box.querySelector("#i2InvSay").innerHTML = !c.inv ? `C up to ${hn} is <b>${an(c.a)}</b>. Move one of the notes to invert it.`
            : `C up to ${hn} is <b>${an(c.a)}</b>. ${H.nm(c.inv[0])} up to ${H.nm(c.inv[1])} is <b>${an(c.b)}</b>. ${c.a.num} + ${c.b.num} = 9.`;
          const f1 = staff.querySelector(".vf-stavenote"); if (f1) f1.querySelectorAll(".vf-notehead").forEach(h => h.style.cursor = "grab"); };
        const playIt = () => { const c = cur(), ch = [[60, H.midi(c.hi)]]; if (c.inv) ch.push(c.inv.map(n => H.midi(n))); tools.play({ chords: ch, gap: 1.2 }); };
        const move = w => { IV.mv = w; draw(); playIt(); };
        box.querySelector("#i2InvSel").onchange = e => { IV.i = +e.target.value; IV.mv = null; draw(); };
        box.querySelector("#i2InvPlay").onclick = playIt;
        box.querySelector("#i2InvLo").onclick = () => move("lo");
        box.querySelector("#i2InvHi").onclick = () => move("hi");
        box.querySelector("#i2InvReset").onclick = () => { IV.mv = null; draw(); };
        // drag: grab a notehead in the first bar, drop it anywhere right of that chord
        let drag = null;
        staff.addEventListener("pointerdown", e => {
          const svg = staff.querySelector("svg"), first = staff.querySelector(".vf-stavenote"); if (!svg || !first) return;
          const heads = [...first.querySelectorAll(".vf-notehead")].map(h => ({ h, r: h.getBoundingClientRect() }));
          const hit = heads.map(o => ({ ...o, d: Math.hypot(e.clientX - (o.r.left + o.r.width / 2), e.clientY - (o.r.top + o.r.height / 2)) })).sort((a, b) => a.d - b.d)[0];
          if (!hit || hit.d > 22) return;
          const top = heads.reduce((m, o) => o.r.top < m.r.top ? o : m, heads[0]);
          const ghost = hit.h.cloneNode(true); ghost.setAttribute("opacity", ".6"); ghost.style.pointerEvents = "none"; svg.appendChild(ghost);
          const k = svg.viewBox.baseVal && svg.viewBox.baseVal.width ? svg.viewBox.baseVal.width / svg.getBoundingClientRect().width : 1;
          drag = { which: hit === top ? "hi" : "lo", x0: e.clientX, y0: e.clientY, k, ghost, edge: first.getBoundingClientRect().right + 12 };
          staff.setPointerCapture(e.pointerId); e.preventDefault(); });
        staff.addEventListener("pointermove", e => { if (!drag) return; drag.ghost.setAttribute("transform", `translate(${(e.clientX - drag.x0) * drag.k} ${(e.clientY - drag.y0) * drag.k})`); });
        const end = e => { if (!drag) return; const d = drag; drag = null; d.ghost.remove(); if (e.type === "pointerup" && e.clientX > d.edge) move(d.which); };
        staff.addEventListener("pointerup", end); staff.addEventListener("pointercancel", end);
        draw();
      } },

    { title: "Practice", kick: "Naming and writing intervals", render: () => `<p>The <a href="intervals.html"><b>Interval drills</b></a> practice naming intervals, writing a note a given interval above or below, and counting half steps. For the basics of size and quality, go back to <a href="intervals-what-why-how.html">Intervals: What, Why and How</a>.</p>` },
  ] };
  return { key: "silverapps-intervals2-v1", lesson, make: () => null, reference: () => "", modes: [], topics: [] };
})();
