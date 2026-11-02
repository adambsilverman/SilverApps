window.FAM = (() => {
  // one staff showing every clef in order (treble, the five C-clef positions, bass), each with middle C
  function clefLine() {
    const sp = 10, y0 = 34, seg = 104, x0 = 6, L = [["treble", "Treble", "&#x1D11E;", 3, 2.95, -2], ["c", "Soprano", "&#x1D121;", 4, 3.1, 0], ["c", "Mezzo-soprano", "&#x1D121;", 3, 3.1, 2], ["c", "Alto", "&#x1D121;", 2, 3.1, 4], ["c", "Tenor", "&#x1D121;", 1, 3.1, 6], ["c", "Baritone", "&#x1D121;", 0, 3.1, 8], ["bass", "Bass", "&#x1D122;", 1, 3.3, 10]];
    const W = x0 + seg * L.length + 4, ly = i => y0 + i * sp, sy = st => y0 + 4 * sp - st * sp / 2;
    let g = ""; for (let i = 0; i < 5; i++) g += `<line x1="${x0}" x2="${W - 4}" y1="${ly(i)}" y2="${ly(i)}" stroke="currentColor"/>`;
    L.forEach(([, name, gl, li, f, st], n) => {
      const x = x0 + n * seg, nx = x + 70, y = sy(st);
      g += `<line x1="${x + seg}" x2="${x + seg}" y1="${ly(0)}" y2="${ly(4)}" stroke="currentColor" stroke-width="${n === L.length - 1 ? 3 : 1}"/>`;
      g += `<text x="${x + 8}" y="${ly(li) + (gl === "&#x1D121;" ? 2.2 : gl === "&#x1D122;" ? 3.08 : 1.1) * sp}" font-family="'Noto Music', serif" font-size="${sp * f * 1.4}" fill="currentColor">${gl}</text>`;
      if (st < 0 || st > 8) g += `<line x1="${nx - 12}" x2="${nx + 12}" y1="${y}" y2="${y}" stroke="currentColor" stroke-width="1.2"/>`;
      g += `<ellipse cx="${nx}" cy="${y}" rx="${sp * .72}" ry="${sp * .5}" transform="rotate(-20 ${nx} ${y})" fill="none" stroke="currentColor" stroke-width="${sp * .26}"/>`;
      g += `<text x="${x + seg / 2}" y="${y0 + 4 * sp + 40}" text-anchor="middle" font-size="13" font-weight="700" fill="currentColor">${name}</text>`;
    });
    const label = "One staff showing the clefs in order, each with middle C: treble clef, middle C on a ledger line below the staff; soprano clef, middle C on line 1; mezzo-soprano, line 2; alto, line 3; tenor, line 4; baritone, line 5; bass clef, middle C on a ledger line above the staff.";
    return `<figure class="lfig"><svg class="clefline" viewBox="0 0 ${W} ${y0 + 4 * sp + 52}" role="img" aria-label="${label}" style="width:100%;max-width:${W * 1.2}px">${g}</svg><figcaption>From treble to bass: each clef puts middle C (the whole note) in a different place. The C clef's center always points to middle C.</figcaption></figure>`;
  }
  // ===== Reading Pitch: treble, bass, alto, tenor and grand staff. Engine: build/harmony/engine.js =====
  const LETTERS = "CDEFGAB";
  const BOTTOM = { treble: [2, 4], bass: [4, 2], alto: [3, 3], tenor: [1, 3] };   // bottom line: [letter index, octave] = E4, G2, F3, D3
  const CNAME = { treble: "treble", bass: "bass", alto: "alto", tenor: "tenor" };
  const MNEM = {
    treble: { lines: "E G B D F", lw: "Every Good Boy Does Fine", spaces: "F A C E", sw: "FACE" },
    bass: { lines: "G B D F A", lw: "Good Boys Do Fine Always", spaces: "A C E G", sw: "All Cows Eat Grass" },
    alto: { lines: "F A C E G", lw: "Fat Alley Cats Eat Grapes", spaces: "G B D F", sw: "Good Birds Don't Fly" },
    tenor: { lines: "D F A C E", lw: "Don't Forget Any Cello Etudes", spaces: "E G B D", sw: "Every Good Bassoon Delights" },
  };
  // staff step s (0 = bottom line … 8 = top line) → natural note
  const noteAt = (H, clef, s) => { const [l, o] = BOTTOM[clef], x = o * 7 + l + s; return H.N(H.mod(x, 7), 0, Math.floor(x / 7)); };
  const stepOf = (clef, n) => n.o * 7 + n.l - (BOTTOM[clef][1] * 7 + BOTTOM[clef][0]);
  const ORD = ["1st", "2nd", "3rd", "4th", "5th"];
  function where(s) {
    if (s >= 0 && s <= 8) return s % 2 === 0 ? `${ORD[s / 2]} line` : `${ORD[(s - 1) / 2]} space`;
    if (s === -1) return "space below the staff";
    if (s === 9) return "space above the staff";
    if (s < 0) { const k = -s; return k % 2 === 0 ? `${ORD[k / 2 - 1]} ledger line below` : `space below the ${ORD[(k - 1) / 2 - 1]} ledger line`; }
    const k = s - 8; return k % 2 === 0 ? `${ORD[k / 2 - 1]} ledger line above` : `space above the ${ORD[(k - 1) / 2 - 1]} ledger line`;
  }
  const nameO = (H, n) => H.nm(n) + n.o + (n.l === 0 && n.o === 4 ? " (middle C)" : "");
  // one staff, a row of whole notes (no time signature); notes: [{ k, ly, hl }]
  const one = (clef, notes, o = {}) => ({ type: "score", clefs: [clef], time: null, vf: "C", sig: {}, bpm: 240, final: false, rowW: o.rowW || 700, minBar: notes.length === 1 ? 110 : 70, scale: notes.length === 1 ? 1.9 : 1.25, bars: [{ [clef === "bass" ? "b" : "t"]: [notes.map(n => Object.assign({ d: "w" }, n))] }] });
  const grand = (cols, o = {}) => ({ type: "score", clefs: ["treble", "bass"], time: null, vf: "C", sig: {}, bpm: 240, final: false, rowW: o.rowW || 760, minBar: cols.length === 1 ? 110 : 70, scale: cols.length === 1 ? 1.6 : 1.25, bars: [{ t: [cols.map(c => Object.assign({ d: "w" }, c.t))], b: [cols.map(c => Object.assign({ d: "w" }, c.b))] }] });
  const rest = { k: [], ghost: true };
  const clefsOn = H => ["treble", "bass", "alto", "tenor"].filter(c => H.topicOn(c));
  function pickStep(H) {
    const staff = H.topicOn("staff"), ledger = H.topicOn("ledger");
    const opts = []; for (let s = -4; s <= 12; s++) { const inS = s >= -1 && s <= 9; if ((inS && staff) || (!inS && ledger)) opts.push(s); }
    return H.rnd(opts.length ? opts : [0, 1, 2, 3, 4, 5, 6, 7, 8]);
  }

  const FACTS = [
    ["Which clef curls around the G above middle C?", "the treble (G) clef", ["the bass (F) clef", "the alto (C) clef", "the tenor (C) clef"], "Its curl circles the 2nd line: G4."],
    ["The two dots of the bass clef surround which line?", "F below middle C (F3)", ["middle C", "G2", "A3"], "The bass clef is an F clef."],
    ["In the alto clef, which line is middle C?", "the middle (3rd) line", ["the 4th line", "the bottom line", "a ledger line below"], "The C clef's center marks middle C."],
    ["In the tenor clef, which line is middle C?", "the 4th line", ["the 3rd line", "the top line", "the 2nd line"], "The same C clef, placed one line higher than alto."],
    ["Which instrument reads mainly in alto clef?", "viola", ["violin", "cello", "trumpet"], "Alto clef is the viola's home clef."],
    ["Which instruments use tenor clef for their higher range?", "cello, bassoon and trombone", ["violin and flute", "viola and horn", "piano"], "It avoids ledger lines above the bass clef."],
    ["On the grand staff, middle C sits…", "on a ledger line between the two staves", ["on the top line of the treble staff", "in the bass clef's 3rd space", "on the middle line of the treble staff"], "One ledger line below the treble staff, or above the bass staff."],
    ["Moving from a line to the next space up (or a space to the next line) moves…", "one letter (a step)", ["two letters", "an octave", "a half step only"], "Line to line or space to space is a skip (a 3rd)."],
    ["The lines of the bass staff, middle C, and the lines of the treble staff together spell…", "every other letter: G B D F A C E G B D F", ["the C major scale", "only C, F and G", "nothing in particular"], "The great staff: eleven lines a 3rd apart."],
    ["Clef signs began as…", "letters (C, F and G) written on a staff line", ["pictures of instruments", "numbers", "abbreviations of Italian words"], "Over centuries the letters became today's stylized signs."],
    ["Who is credited with the staff of lines a 3rd apart, around the year 1000?", "Guido of Arezzo", ["J. S. Bach", "Pythagoras", "Johannes Gutenberg"], "Guido also colored the F line red and the C line yellow."],
    ["Why did older music move C clefs to different lines?", "to keep each voice's range on the staff, with few ledger lines", ["to change the key", "to show the tempo", "to mark a modulation"], "Soprano, mezzo-soprano, alto, tenor and baritone clefs all put middle C on a different line."],
    ["Notes that sound at the same time are written…", "vertically aligned, across every staff", ["slightly staggered", "aligned only within one staff", "with the bass note first"], "A grand staff, score or chord: same moment, same horizontal position."],
    ["In a chord with a 2nd, the noteheads…", "sit on opposite sides of the stem, the higher note to the right", ["overlap on the same side", "are written in different bars", "always use separate stems"], "The higher note of the 2nd is always to the right."],
    ["An accidental is placed…", "just before the notehead, exactly on its line or space", ["above the note", "after the note", "anywhere in the bar"], "And it lasts for the rest of the bar, on that line or space."],
    ["In a chord with several accidentals, which accidental goes closest to the chord?", "the highest one", ["the lowest one", "the loudest one", "it doesn't matter"], "Then the lowest, then the next highest, working inward in columns."],
    ["Does an accidental change where the beat's notes line up?", "no: the noteheads still align; space is made for the accidental in front", ["yes: the accidental aligns with the other notes", "yes: the note moves after the beat", "only in the bass clef"], "Line up noteheads, not accidentals."],
    ["An F♯ appears early in a bar. Later in the same bar, an F on the same line has no accidental. What is it?", "F♯ (the sharp still applies)", ["F natural", "F♭", "it depends on the clef"], "An accidental lasts until the bar line, for that line or space."],
    ["An F♯ is written in one bar. In the next bar, an F on the same line has no accidental (key of C). What is it?", "F natural", ["F♯", "F♭", "F𝄪"], "The bar line cancels accidentals; a courtesy natural is often added as a reminder."],
    ["What does a double sharp (𝄪) do?", "raises a note two semitones", ["raises a note one semitone", "lowers a note two semitones", "cancels a sharp"], "C𝄪 sounds the same as D."],
    ["Which pair are enharmonic (same key on the piano)?", "E♯ and F", ["E♭ and F", "E and F♭♭", "B♭ and C"], "E♯ is one semitone above E: the key we usually call F."],
    ["Where does an accidental go?", "just before the notehead, on the same line or space", ["just after the notehead", "above the note", "at the start of the bar"], "It is centered on the notehead's line or space and written before it."],
    ["Does an accidental on C5 affect C4 later in the same bar?", "no: it applies only to that line or space (that octave)", ["yes: it affects every C in the bar", "yes, but only in treble clef", "only if they are tied"], "Many editors still add a courtesy accidental in the other octave."],
  ];

  function make(mode, H) {
    const clefs = clefsOn(H), clef = H.rnd(clefs.length ? clefs : ["treble"]);
    if (mode === "name" || mode === "octave") {
      const s = pickStep(H), n = noteAt(H, clef, s), grandStaff = (clef === "treble" || clef === "bass") && clefs.includes("treble") && clefs.includes("bass") && Math.random() < .35;
      const spec = grandStaff ? grand([clef === "treble" ? { t: { k: [H.nmO(n)], hl: false }, b: rest } : { t: rest, b: { k: [H.nmO(n)] } }]) : one(clef, [{ k: [H.nmO(n)] }]);
      if (grandStaff) { spec.bars[0][clef === "treble" ? "b" : "t"] = []; }
      const ans = mode === "name" ? H.nm(n) : nameO(H, n);
      const wrong = mode === "name" ? LETTERS.split("") : [-7, 7, -1, 1, -2, 2].map(d => { const x = n.o * 7 + n.l + d; return nameO(H, H.N(H.mod(x, 7), 0, Math.floor(x / 7))); });
      const m = MNEM[clef], line = s >= 0 && s <= 8 && s % 2 === 0;
      const why = `In ${CNAME[clef]} clef, the ${where(s)} is ${nameO(H, n)}.${s >= 0 && s <= 8 ? ` ${line ? `Lines: ${m.lines} (“${m.lw}”).` : `Spaces: ${m.spaces} (“${m.sw}”).`}` : " Count up or down by step from the nearest line you know."}`;
      return Object.assign(H.mc(`${grandStaff ? "On the grand staff" : `In ${CNAME[clef]} clef`}: what note is this?`, ans, wrong, why, { kicker: mode === "name" ? "Name the note" : "Note and octave", staff: spec, playQ: { chords: [[H.midi(n)]], dur: 1.2 }, playQLabel: "Play", topic: clef }), mode === "name" ? { choices: "ABCDEFG".split("") } : {});
    }
    if (mode === "where") {
      const s = pickStep(H), n = noteAt(H, clef, s), opts = [s - 2, s - 1, s + 1, s + 2, s + 7, s - 7].filter(x => x >= -4 && x <= 12);
      return H.mc(`Where is ${nameO(H, n)} in ${CNAME[clef]} clef?`, where(s), opts.map(where), `${nameO(H, n)} is on the ${where(s)} of the ${CNAME[clef]} staff.`, { kicker: "Find the line or space", staffAns: one(clef, [{ k: [H.nmO(n)], hl: true }]), topic: clef });
    }
    if (mode === "same") {
      const others = ["treble", "bass", "alto", "tenor"].filter(c => c !== clef && clefs.includes(c));
      const to = H.rnd(others.length ? others : ["treble", "bass", "alto", "tenor"].filter(c => c !== clef));
      let s, n, s2;
      for (let g = 0; g < 50; g++) { s = pickStep(H); n = noteAt(H, clef, s); s2 = stepOf(to, n); if (s2 >= -4 && s2 <= 12) break; }
      if (s2 < -4 || s2 > 12) return null;
      const opts = [s2 - 1, s2 + 1, s2 - 2, s2 + 2, s, s2 + 7, s2 - 7].filter(x => x >= -4 && x <= 12 && x !== s2);
      return H.mc(`This note is in ${CNAME[clef]} clef. Drag the note on the ${CNAME[to]} staff to the same pitch, then choose Check.`, where(s2), opts.map(where), `It's ${nameO(H, n)}: the ${where(s)} in ${CNAME[clef]} clef, the ${where(s2)} in ${CNAME[to]} clef.`, { kicker: "Same pitch, new clef", widget: "clefDrag", from: clef, to, s, s2, staffAns: one(to, [{ k: [H.nmO(n)], hl: true }]), playQ: { chords: [[H.midi(n)]], dur: 1.2 }, playQLabel: "Play", topic: [clef, to] });
    }
    // devices and principles
    if (Math.random() < .5) {
      const c = H.rnd(clefs.length ? clefs : ["treble"]), m = MNEM[c], lines = Math.random() < .5;
      const all = Object.values(MNEM).flatMap(x => [x.lines, x.spaces]);
      return H.mc(`${lines ? "The lines" : "The spaces"} of the ${CNAME[c]} staff, bottom to top, are…`, lines ? m.lines : m.spaces, all, `${lines ? m.lines : m.spaces}: “${lines ? m.lw : m.sw}.”`, { kicker: "Memory devices", topic: c });
    }
    const [q, a, w, y] = H.rnd(FACTS);
    return H.mc(q, a, w, y, { kicker: "Clefs and alignment" });
  }

  function reference() {
    return `<div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Clef</th><th scope="col">Lines</th><th scope="col">Spaces</th><th scope="col">Middle C</th></tr></thead><tbody>
      ${Object.entries(MNEM).map(([c, m]) => `<tr><td><b>${CNAME[c]}</b></td><td>${m.lines}<br><small>${m.lw}</small></td><td>${m.spaces}<br><small>${m.sw}</small></td><td>${{ treble: "1st ledger line below", bass: "1st ledger line above", alto: "3rd (middle) line", tenor: "4th line" }[c]}</td></tr>`).join("")}</tbody></table></div>`;
  }

  const lineNotes = (H, clef, which) => [0, 1, 2, 3, 4].map(i => which === "lines" ? 2 * i : 2 * i + 1).filter(s => s <= 8).map(s => { const n = noteAt(H, clef, s); return { k: [H.nmO(n)], ly: H.nm(n) }; });

  // ---------- interactive: move a note on the staff ----------
  let HC = null; const MV = { clef: "treble", s: 4, a: 0 };
  function mvInner(H) {
    const n = noteAt(H, MV.clef, MV.s), nn = H.N(n.l, MV.a, n.o);
    const svg = H.miniStaff({ clef: MV.clef, notes: [{ s: MV.s, acc: MV.a ? MV.a : null }], startX: 110, dx: 80, w: 260, label: `${MV.clef} clef, a note on the ${where(MV.s)}: ${nameO(H, nn)}` });
    return `${svg}<p class="msinfo" aria-live="polite">${where(MV.s)[0].toUpperCase() + where(MV.s).slice(1)}: <b>${H.nm(nn)}</b> (${nameO(H, nn).replace(" (middle C)", ", middle C")})</p>`;
  }
  function mvToy(H) {
    HC = H;
    return `<div class="toy mvtoy" id="mvToy"><div class="toy-row" role="group" aria-label="Clef">${["treble", "bass", "alto", "tenor"].map(c => `<button class="play" data-mvc="${c}" aria-pressed="${MV.clef === c}">${c}</button>`).join("")}</div>
      <div id="mvStaff" class="mvstaff">${mvInner(H)}</div>
      <div class="toy-row"><button class="play" data-mv="1">▲ Up a step</button><button class="play" data-mv="-1">▼ Down a step</button><span role="group" aria-label="Accidental">${[[-1, "♭"], [0, "none"], [1, "♯"]].map(([a, l]) => `<button class="play" data-mva="${a}" aria-pressed="${MV.a === a}">${l}</button>`).join("")}</span></div>
      <p class="lnote">Drag the note up or down, use the buttons, or select the staff and press the arrow keys.</p></div>`;
  }
  function mvSet(st, sound = true) {
    MV.s = Math.max(-6, Math.min(14, st)); const box = document.getElementById("mvStaff"); if (!box || !HC) return; box.innerHTML = mvInner(HC);
    const svg = box.querySelector("svg"); svg.setAttribute("tabindex", "0"); svg.setAttribute("role", "slider"); svg.setAttribute("aria-valuemin", "-6"); svg.setAttribute("aria-valuemax", "14"); svg.setAttribute("aria-valuenow", MV.s);
    const n = noteAt(HC, MV.clef, MV.s); svg.setAttribute("aria-valuetext", nameO(HC, HC.N(n.l, MV.a, n.o)));
    if (sound) HC.play({ chords: [[HC.midi(HC.N(n.l, MV.a, n.o))]], gap: 1.05 });
  }
  if (!window.__mvWired) { window.__mvWired = true;
    document.addEventListener("click", e => {
      const c = e.target.closest("[data-mvc]"); if (c) { MV.clef = c.dataset.mvc; document.querySelectorAll("[data-mvc]").forEach(b => b.setAttribute("aria-pressed", String(b === c))); mvSet(MV.s); return; }
      const a = e.target.closest("[data-mva]"); if (a) { MV.a = +a.dataset.mva; document.querySelectorAll("[data-mva]").forEach(b => b.setAttribute("aria-pressed", String(b === a))); mvSet(MV.s); return; }
      const m = e.target.closest("[data-mv]"); if (m) mvSet(MV.s + +m.dataset.mv);
    });
    document.addEventListener("keydown", e => { if (!e.target.closest || !e.target.closest("#mvStaff svg")) return; if (e.key === "ArrowUp") { e.preventDefault(); mvSet(MV.s + 1); setTimeout(() => { const s = document.querySelector("#mvStaff svg"); if (s) s.focus(); }); } if (e.key === "ArrowDown") { e.preventDefault(); mvSet(MV.s - 1); setTimeout(() => { const s = document.querySelector("#mvStaff svg"); if (s) s.focus(); }); } });
    let drag = false;
    const yToS = (svg, ev) => { const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; const p = pt.matrixTransform(svg.getScreenCTM().inverse()); return Math.round((80 - p.y) / 5); };
    document.addEventListener("pointerdown", e => { const svg = e.target.closest && e.target.closest("#mvStaff svg"); if (!svg) return; drag = true; svg.setPointerCapture && svg.setPointerCapture(e.pointerId); const st = yToS(svg, e); if (st !== MV.s) mvSet(st); });
    document.addEventListener("pointermove", e => { if (!drag) return; const svg = document.querySelector("#mvStaff svg"); if (!svg) return; const st = yToS(svg, e); if (st !== MV.s && st >= -6 && st <= 14) mvSet(st, false); });
    document.addEventListener("pointerup", () => { if (drag) { drag = false; mvSet(MV.s, true); } });
  }

  // ---------- interactive: place and size an accidental ----------
  const AZ = {};
  function azNew() { Object.assign(AZ, { acc: [1, 0, -1][Math.floor(Math.random() * 3)], s: Math.floor(Math.random() * 9), sc: [.5, .6, 1.6, 1.9][Math.floor(Math.random() * 4)], done: false });
    // start just above the staff, to the right of the clef
    const P = HC ? HC.ACCP[AZ.acc] : { bot: .6 }; AZ.x = 58; AZ.y = 32 - P.bot * AZ.sc * 10; }
  const AZX = 150, azY = () => 80 - AZ.s * 5;
  function azSVG(H) {
    const st = H.miniStaff({ notes: [{ s: AZ.s }], startX: 110, dx: 80, w: 260, label: `Treble staff with a whole note on the ${["1st line", "1st space", "2nd line", "2nd space", "3rd line", "3rd space", "4th line", "4th space", "5th line"][AZ.s]}, and a ${AZ.acc > 0 ? "sharp" : AZ.acc < 0 ? "flat" : "natural"} sign to place in front of it` }), P = H.ACCP[AZ.acc];
    const g = `<g id="azG" transform="translate(${AZ.x.toFixed(1)} ${AZ.y.toFixed(1)}) scale(${(AZ.sc * 10).toFixed(2)})" tabindex="0" role="img" aria-label="${AZ.acc > 0 ? "sharp" : AZ.acc < 0 ? "flat" : "natural"} sign: drag it, or use the arrow keys; plus and minus change its size" style="cursor:grab"><rect class="azring" x="-.3" y="${P.top - .3}" width="${P.w + .6}" height="${P.bot - P.top + .6}" rx=".2" fill="transparent" stroke="none" stroke-width="2" stroke-dasharray="4 3" vector-effect="non-scaling-stroke"/><path d="${P.d}" fill="currentColor"/></g>`;
    return st.replace(/viewBox="0 -14 /, 'viewBox="0 -36 ').replace("</svg>", g + "</svg>");
  }
  function azDraw() { const box = document.getElementById("azBox"); if (!box || !HC) return; box.innerHTML = azSVG(HC); const sz = document.getElementById("azSize"); if (sz) sz.value = AZ.sc; }
  function azToy(H) { HC = H; if (AZ.acc == null || AZ.x == null) azNew(); return `<div class="toy"><div id="azBox" class="mvstaff">${azSVG(H)}</div>
    <div class="toy-row"><label>Size <input type="range" id="azSize" min=".4" max="2.2" step=".05" value="${AZ.sc}"></label><button class="play" data-az="check">Check</button><button class="play" data-az="new">New note</button></div>
    <p class="msinfo" id="azFb" aria-live="polite">Drag the ${AZ.acc > 0 ? "sharp" : AZ.acc < 0 ? "flat" : "natural"} into place in front of the note and make it the right size.</p></div>`; }
  function azCheck() {
    const P = HC.ACCP[AZ.acc], k = AZ.sc * 10, right = AZ.x + P.w * k, noteL = AZX - 8, dy = AZ.y - azY(), gap = noteL - right, out = [];
    const vOK = Math.abs(dy) <= 2.5, sOK = AZ.sc >= .8 && AZ.sc <= 1.25, hOK = gap >= 0 && gap <= 9;
    out.push(vOK ? "✓ Height: centered on the note's " + (AZ.s % 2 ? "space" : "line") + (AZ.acc < 0 ? " (the flat's round belly sits on it)" : "") : `✗ Height: move it ${dy > 0 ? "up" : "down"}; ${AZ.acc < 0 ? "the flat's belly" : "its center"} should sit on the note's ${AZ.s % 2 ? "space" : "line"}`);
    out.push(sOK ? "✓ Size: about three staff spaces tall" + (AZ.acc < 0 ? " (a flat is a little shorter)" : "") : `✗ Size: make it ${AZ.sc < .8 ? "bigger" : "smaller"}: about three staff spaces tall`);
    out.push(hOK ? "✓ Placement: just in front of the notehead" : gap < 0 ? "✗ Placement: it touches or overlaps the notehead; move it left" : "✗ Placement: it's too far from the note; move it right, just in front of the notehead");
    const ok = vOK && sOK && hOK; document.getElementById("azFb").innerHTML = (ok ? "<b>Well placed!</b> " : "") + out.join("<br>");
    if (ok && window.SFX) SFX.play(true);
  }
  if (!window.__azWired) { window.__azWired = true;
    let dr = null;
    const pt = (svg, e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
    document.addEventListener("pointerdown", e => { const g = e.target.closest && e.target.closest("#azG"); if (!g) return; e.preventDefault(); const svg = g.ownerSVGElement, p = pt(svg, e); dr = { svg, dx: p.x - AZ.x, dy: p.y - AZ.y }; });
    document.addEventListener("pointermove", e => { if (!dr) return; const p = pt(dr.svg, e); AZ.x = p.x - dr.dx; AZ.y = p.y - dr.dy; const g = document.getElementById("azG"); if (g) g.setAttribute("transform", `translate(${AZ.x.toFixed(1)} ${AZ.y.toFixed(1)}) scale(${(AZ.sc * 10).toFixed(2)})`); });
    document.addEventListener("pointerup", () => { if (dr) { dr = null; azDraw(); const g = document.getElementById("azG"); if (g) g.focus(); } });
    document.addEventListener("input", e => { if (e.target.id === "azSize") { AZ.sc = +e.target.value; const g = document.getElementById("azG"); if (g) g.setAttribute("transform", `translate(${AZ.x.toFixed(1)} ${AZ.y.toFixed(1)}) scale(${(AZ.sc * 10).toFixed(2)})`); } });
    document.addEventListener("keydown", e => { if (!e.target.closest || !e.target.closest("#azG")) return; const st = e.shiftKey ? 5 : 1, K = e.key; let hit = true;
      if (K === "ArrowLeft") AZ.x -= st; else if (K === "ArrowRight") AZ.x += st; else if (K === "ArrowUp") AZ.y -= st; else if (K === "ArrowDown") AZ.y += st; else if (K === "+" || K === "=") AZ.sc = Math.min(2.2, AZ.sc + .05); else if (K === "-") AZ.sc = Math.max(.4, AZ.sc - .05); else hit = false;
      if (hit) { e.preventDefault(); azDraw(); document.getElementById("azG").focus(); } });
    document.addEventListener("click", e => { const b = e.target.closest("[data-az]"); if (!b) return; if (b.dataset.az === "check") azCheck(); else { azNew(); const t = b.closest(".toy"); if (t) t.outerHTML = azToy(HC); } });
  }

  // ---------- tablature and the DAW piano roll ----------
  let PAC = null;
  const pac = () => { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; if (!PAC) PAC = new C(); if (PAC.state === "suspended") PAC.resume(); return PAC; };
  // a plucked or keyboard-like note: a few decaying partials
  function pnote(m, t, dur, pluck) {
    const c = PAC, f = 440 * Math.pow(2, (m - 69) / 12), g = c.createGain(), lp = c.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.setValueAtTime(pluck ? 3500 : 2500, t); lp.frequency.exponentialRampToValueAtTime(pluck ? 700 : 1200, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(.16, t + .008); g.gain.exponentialRampToValueAtTime(pluck ? .0008 : .02, t + dur + (pluck ? .6 : 0)); g.gain.linearRampToValueAtTime(0, t + dur + (pluck ? .7 : .12));
    [1, 2, 3, 4].forEach(h => { const o = c.createOscillator(), og = c.createGain(); o.type = h === 1 ? "triangle" : "sine"; o.frequency.value = f * h; og.gain.value = 1 / (h * h); o.connect(og); og.connect(lp); o.start(t); o.stop(t + dur + .8); });
    lp.connect(g); g.connect(c.destination);
  }
  // C major scale, written C4–C5: [staff step, string (1 = high E), fret, written MIDI]
  const TAB = [[-2, 5, 3, 60], [-1, 4, 0, 62], [0, 4, 2, 64], [1, 4, 3, 65], [2, 3, 0, 67], [3, 3, 2, 69], [4, 2, 0, 71], [5, 2, 1, 72]];
  function tabFig(H) {
    const W = 560, sx = 90, dx = 58, xs = i => sx + i * dx + dx / 2;
    const staff = H.miniStaff({ notes: TAB.map(([st]) => ({ s: st })), startX: sx, dx, w: W, label: "Treble staff: C, D, E, F, G, A, B, C, written from middle C up an octave" });
    const sp = 13, y0 = 18; let g = "";
    for (let i = 0; i < 6; i++) g += `<line x1="26" x2="${W - 6}" y1="${y0 + i * sp}" y2="${y0 + i * sp}" stroke="currentColor"/><text x="14" y="${y0 + i * sp + 4}" font-size="11" fill="currentColor" text-anchor="middle">${["e", "B", "G", "D", "A", "E"][i]}</text>`;
    g += `<rect x="40" y="${y0 + 2}" width="20" height="${5 * sp - 4}" fill="var(--fi-paper, #fbf6ec)"/>`;
    g += ["T", "A", "B"].map((l, i) => `<text x="50" y="${y0 + 18 + i * 20}" text-anchor="middle" font-size="17" font-weight="700" fill="currentColor">${l}</text>`).join("");
    TAB.forEach(([, str, fr], i) => { const y = y0 + (str - 1) * sp; g += `<rect x="${xs(i) - 7}" y="${y - 8}" width="14" height="16" fill="var(--fi-paper, #fbf6ec)"/><text x="${xs(i)}" y="${y + 5}" text-anchor="middle" font-size="15" font-weight="700" fill="currentColor">${fr}</text>`; });
    const tab = `<svg viewBox="0 0 ${W} ${y0 + 5 * sp + 16}" role="img" aria-label="Guitar tablature for the same notes: A string 3rd fret; D string open, 2nd fret, 3rd fret; G string open, 2nd fret; B string open, 1st fret" style="width:100%;max-width:${W}px">${g}</svg>`;
    return `<figure class="lfig"><div style="width:100%;max-width:${W}px">${staff.replace("<svg ", '<svg style="width:100%" ')}${tab}</div><figcaption>The same eight notes in standard notation and in guitar tab. The staff says <i>which pitch</i>; the tab says <i>which string and fret</i>.</figcaption><button class="play" data-tabplay="tab"><span aria-hidden="true">▶ </span>Play</button></figure>`;
  }
  // piano roll: [MIDI note, start beat, length in beats, velocity 0–1]
  const ROLL = [[60, 0, 1, .8], [64, 1, .5, .6], [67, 1.5, .5, .7], [69, 2, 1, .9], [67, 3, 1, .6], [65, 4, .5, .7], [64, 4.5, .5, .55], [62, 5, 1, .75], [60, 6, 2, .85], [64, 6, 2, .6], [67, 6, 2, .65]];
  const BLACK = [1, 3, 6, 8, 10];
  function rollFig() {
    const lo = 59, hi = 72, rh = 15, kw = 92, bw = 62, beats = 8, W = kw + beats * bw + 10, top = 26, gridH = (hi - lo + 1) * rh, velTop = top + gridH + 18, Hh = velTop + 58;
    const y = m => top + (hi - m) * rh, x = b => kw + b * bw;
    let g = "";
    for (let m = lo; m <= hi; m++) { const blk = BLACK.includes(m % 12); g += `<rect x="${kw}" y="${y(m)}" width="${beats * bw}" height="${rh}" fill="${blk ? "rgba(0,0,0,.07)" : "rgba(255,255,255,.55)"}"/><rect x="${blk ? 30 : 6}" y="${y(m) + 1}" width="${blk ? kw - 36 : kw - 12}" height="${rh - 2}" rx="2" fill="${blk ? "#222" : "#fff"}" stroke="#999" stroke-width=".6"/>`;
      if (m % 12 === 0) g += `<text x="${kw - 10}" y="${y(m) + rh - 4}" text-anchor="end" font-size="10" font-weight="700" fill="#222">C${m / 12 - 1}</text>`; }
    for (let b = 0; b <= beats * 2; b++) g += `<line x1="${x(b / 2)}" x2="${x(b / 2)}" y1="${top}" y2="${top + gridH}" stroke="currentColor" stroke-opacity="${b % 8 === 0 ? .9 : b % 2 === 0 ? .35 : .15}" stroke-width="${b % 8 === 0 ? 1.6 : 1}"/>`;
    for (let bar = 0; bar < 2; bar++) for (let bt = 0; bt < 4; bt++) g += `<text x="${x(bar * 4 + bt) + 3}" y="${top - 8}" font-size="${bt ? 10 : 12}" font-weight="${bt ? 400 : 700}" fill="currentColor">${bar + 1}${bt ? "." + (bt + 1) : ""}</text>`;
    ROLL.forEach(([m, st, len, v]) => { g += `<rect x="${x(st) + 1}" y="${y(m) + 1}" width="${len * bw - 2}" height="${rh - 2}" rx="3" fill="var(--fi-red, #E8573F)" stroke="#7a2a1a" stroke-width=".8"/>`; g += `<line x1="${x(st) + 2}" x2="${x(st) + 2}" y1="${velTop + 44}" y2="${velTop + 44 - 40 * v}" stroke="var(--fi-red, #E8573F)" stroke-width="3"/><circle cx="${x(st) + 2}" cy="${velTop + 44 - 40 * v}" r="3" fill="var(--fi-red, #E8573F)"/>`; });
    g += `<line x1="${kw}" x2="${x(beats)}" y1="${velTop + 44}" y2="${velTop + 44}" stroke="currentColor"/><text x="${kw - 10}" y="${velTop + 30}" text-anchor="end" font-size="11" fill="currentColor">velocity</text>`;
    g += `<line id="rollHead" x1="${kw}" x2="${kw}" y1="${top - 4}" y2="${velTop + 46}" stroke="#1a5fb4" stroke-width="2" opacity="0"/>`;
    const desc = "Piano roll. Time runs left to right over two bars; each row is one semitone, with a keyboard at the left. Notes: C4 for a beat, E4 and G4 as eighth notes, A4, G4; then F4 and E4 as eighths, D4, and a C major chord (C4, E4, G4) held for two beats. A velocity lane below shows how hard each note is played.";
    return `<figure class="lfig"><svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="${desc}" style="width:100%;max-width:${W}px" data-rollkw="${kw}" data-rollbw="${bw}">${g}</svg><figcaption>A DAW piano roll: <b>left to right is time</b> (bars and beats along the top), <b>up and down is pitch</b> (one row per semitone, keyboard at the left), the <b>length</b> of each bar is the note's duration, and the <b>velocity</b> lane shows how hard each note is played.</figcaption><button class="play" data-tabplay="roll"><span aria-hidden="true">▶ </span>Play</button></figure>`;
  }
  const ROLLSCORE = { type: "score", clefs: ["treble"], time: "4/4", vf: "C", sig: {}, bpm: 100, bars: [
    { t: [[{ k: ["C4"], d: "q" }, { k: ["E4"], d: "8" }, { k: ["G4"], d: "8" }, { k: ["A4"], d: "q" }, { k: ["G4"], d: "q" }]] },
    { t: [[{ k: ["F4"], d: "8" }, { k: ["E4"], d: "8" }, { k: ["D4"], d: "q" }, { k: ["C4", "E4", "G4"], d: "h" }]] }] };
  if (!window.__tabWired) { window.__tabWired = true;
    document.addEventListener("click", e => { const b = e.target.closest("[data-tabplay]"); if (!b || !pac()) return; const t0 = PAC.currentTime + .08;
      if (b.dataset.tabplay === "tab") TAB.forEach(([, , , m], i) => pnote(m - 12, t0 + i * .45, .42, true));   // guitar sounds an octave below written
      else { const spb = .6; ROLL.forEach(([m, st, len, v]) => pnote(m, t0 + st * spb, len * spb * .95, false));
        const svg = b.closest("figure").querySelector("svg"), head = svg.querySelector("#rollHead"), kw = +svg.dataset.rollkw, bw = +svg.dataset.rollbw, T = 8 * spb, start = performance.now() + 80;
        head.setAttribute("opacity", "1");
        const step = now => { const tt = (now - start) / 1000; if (tt > T || !head.isConnected) { head.setAttribute("opacity", "0"); return; } if (tt >= 0) { const xx = kw + Math.max(0, tt) / spb * bw; head.setAttribute("x1", xx); head.setAttribute("x2", xx); } requestAnimationFrame(step); };
        requestAnimationFrame(step); } }); }

  // ---------- clef history pictures ----------
  const lesson = { steps: [
    { title: "The staff", kick: "Lines, spaces, letters", render: (H, k, U) => `<p>Pitch is written on a <b>staff</b> of five lines and four spaces, counted from the <b>bottom</b>. Moving from a line to the next space (or a space to the next line) is one <b>step</b>: the next letter. Line to line, or space to space, is a <b>skip</b> (a 3rd): every other letter.</p>
      <p>The musical alphabet is just seven letters, <b>A B C D E F G</b>, repeating. Octave numbers tell the repetitions apart: each octave starts on C, and <b>middle C</b> is <b>C4</b>.</p>`
      + U.fig(one("treble", [0, 1, 2, 3, 4, 5, 6, 7, 8].map(s => { const n = noteAt(H, "treble", s); return { k: [H.nmO(n)], ly: H.nm(n) }; })), "Line, space, line, space…: each step is the next letter.")
      + `<p><b>Ledger lines</b> extend the staff above and below for notes outside it. A <b>clef</b> tells you which line is which pitch.</p>
      <h3>Try it: move the note</h3>${mvToy(H)}` },
    { title: "Treble clef", kick: "The G clef", render: (H, k, U) => `<p>The treble clef is a <b>G clef</b>: it began as a letter G, and its curl still circles the 2nd line, <b>G4</b> (the G above middle C).</p>
      <div class="lfigs">${U.fig(one("treble", lineNotes(H, "treble", "lines")), `<b>Lines: E G B D F</b>: “Every Good Boy Does Fine”`, { small: true })}${U.fig(one("treble", lineNotes(H, "treble", "spaces")), "<b>Spaces: F A C E</b>: they spell “FACE”", { small: true })}</div>`
      + H.check("Treble clef, 3rd line:", "B", ["G", "D", "C"], "E G B D F: the 3rd line is B.") },
    { title: "Bass clef", kick: "The F clef", render: (H, k, U) => `<p>The bass clef is an <b>F clef</b>: it began as a letter F, and its two dots still surround the 4th line, <b>F3</b> (the F below middle C).</p>
      <div class="lfigs">${U.fig(one("bass", lineNotes(H, "bass", "lines")), `<b>Lines: G B D F A</b>: “Good Boys Do Fine Always”`, { small: true })}${U.fig(one("bass", lineNotes(H, "bass", "spaces")), "<b>Spaces: A C E G</b>: “All Cows Eat Grass”", { small: true })}</div>`
      + `<p>Another device: each bass-clef line or space is <b>two letters later</b> in the alphabet than the same line or space in treble clef (treble E → bass G, treble F → bass A).</p>`
      + H.check("Bass clef, 2nd space:", "C", ["A", "E", "B"], "A C E G: the 2nd space is C.") },
    { title: "The grand staff", kick: "Middle C in the middle", render: (H, k, U) => `<p>Piano music joins a treble and a bass staff with a brace: the <b>grand staff</b>. <b>Middle C</b> sits on a ledger line between them: one ledger line below the treble staff, or one above the bass staff. The same pitch can be written either way.</p>`
      + U.fig(grand([{ t: { k: ["C4"], ly: "C4" }, b: rest }, { t: rest, b: { k: ["C4"], ly: "C4" } }, { t: { k: ["D4"], ly: "D4" }, b: rest }, { t: rest, b: { k: ["B3"], ly: "B3" } }, { t: { k: ["G4"], ly: "G4" }, b: { k: ["F3"], ly: "F3" } }].map(c => c)), "Middle C from either staff; the notes just above and below it; and the clefs' own notes, G4 and F3.")
      + `<p><b>Landmarks:</b> learn a few notes cold and read the rest by step or skip from them: treble G (the clef's curl), bass F (between the dots), middle C, high G (the space above the treble staff) and low G (the bass staff's bottom line).</p>` },
    { title: "The great staff", kick: "Eleven lines", render: (H, k, U) => {
      const lines = ["G2", "B2", "D3", "F3", "A3"].map(s => ({ t: rest, b: { k: [s], ly: s.slice(0, -1) } })).concat([{ t: { k: ["C4"], ly: "C" }, b: rest }]).concat(["E4", "G4", "B4", "D5", "F5"].map(s => ({ t: { k: [s], ly: s.slice(0, -1) }, b: rest })));
      return `<p>Here's the secret connecting all the clefs. The bass staff's lines, middle C's ledger line, and the treble staff's lines are one continuous ladder of lines a 3rd apart: <b>G B D F A C E G B D F</b>. Think of it as an eleven-line <b>great staff</b>, with the two clefs as windows onto it.</p>`
        + U.fig(grand(lines), "Every line of the grand staff, bottom to top: every other letter, all the way up.")
        + `<p>Every clef is just a window of five lines onto this great staff, labeled by the pitch it points to: the G clef marks G4, the F clef F3, and the C clef middle C.</p>`;
    } },
    { title: "Alto and tenor clefs", kick: "The C clef", render: (H, k, U) => `<p>The <b>C clef</b> points its center at <b>middle C</b>. Placed on the 3rd line it's the <b>alto clef</b> (the viola's clef); on the 4th line, the <b>tenor clef</b> (used by cello, bassoon and trombone for their higher notes, to avoid ledger lines).</p>
      <div class="lfigs">${U.fig(one("alto", lineNotes(H, "alto", "lines")), "<b>Alto lines: F A C E G</b>: “Fat Alley Cats Eat Grapes”", { small: true })}${U.fig(one("alto", lineNotes(H, "alto", "spaces")), "<b>Alto spaces: G B D F</b>: “Good Birds Don't Fly”", { small: true })}${U.fig(one("tenor", lineNotes(H, "tenor", "lines")), "<b>Tenor lines: D F A C E</b>: “Don't Forget Any Cello Etudes”", { small: true })}${U.fig(one("tenor", lineNotes(H, "tenor", "spaces")), "<b>Tenor spaces: E G B D</b>: “Every Good Bassoon Delights”", { small: true })}</div>
      <p>On the great staff, the alto clef's five lines are the <i>middle</i> five (F3 A3 C4 E4 G4); the tenor clef's are the next five down (D3 F3 A3 C4 E4).</p>`
      + H.check("Alto clef, middle line:", "C", ["B", "D", "A"], "The C clef's center marks middle C.") },
    { title: "A short history of clefs", kick: "Letters on lines", render: (H, k, U) => `<p>Early chant notation (neumes) showed the shape of a melody but not exact pitches. Around the year 1000, <b>Guido of Arezzo</b> is credited with the staff of lines a 3rd apart, marking key lines with letters (and colors: often red for F, and yellow or green for C) so singers could find exact pitches.</p>
      <figure class="lfig"><img class="histimg" src="assets/img/schoyen-ms207-chant.jpg" width="1090" height="708" alt="A page of 12th-century chant: Latin words under rows of neumes written along staff lines drawn in red and green, with letter clefs at the start of each staff."><figcaption>Chant from the 12th century, written in neumes on staff lines drawn in color, with letter clefs at the left edge marking which line is which pitch. Schøyen Collection MS 207 (Wikimedia Commons, public domain).</figcaption></figure>
      <p>Those letters are our clefs. Over centuries the written <b>C</b>, <b>F</b> and <b>G</b> became today's stylized signs: the C clef's two curves frame its line, the F clef's two dots frame theirs, and the G clef's curl circles G.</p>
      <figure class="lfig"><img class="histimg" src="assets/img/clef-evolution.png" width="386" height="205" style="max-width:520px" alt="A chart of how the C, F and G clefs developed: in each row, the written letter gradually changes shape from left to right until it becomes today's C clef, bass clef and treble clef, shown at the right."><figcaption>From letters to signs: over the centuries scribes' C, F and G turned into today's C, bass and treble clefs. Image: creator unknown, via <a href="https://www.reddit.com/r/mildlyinteresting/comments/9yz18j/the_evolution_of_music_clefs/" target="_blank" rel="noopener">r/mildlyinteresting, “The evolution of music clefs”</a>.</figcaption></figure>
      <p>Clefs were <b>movable</b>. Rather than add ledger lines, scribes slid the clef up or down so each voice's range fit on the five lines. The C clef had a position for each voice: <b>soprano</b> (C on the 1st line), <b>mezzo-soprano</b> (2nd), <b>alto</b> (3rd), <b>tenor</b> (4th) and <b>baritone</b> (5th; the F clef on the 3rd line made the same staff). Renaissance and Baroque choral parts, and many older editions, use them.</p>
      ${clefLine()}
      <p>As music standardized, most parts settled into the G clef on the 2nd line (treble) and the F clef on the 4th line (bass). Today the C clef survives as the <b>alto</b> clef (viola) and <b>tenor</b> clef (cello, bassoon, trombone). Every one of these is still a five-line window onto the same great staff.</p>` },
    { title: "Reading strategies", kick: "Faster reading", render: () => `<ul><li><b>Memory devices</b> (EGBDF, FACE, GBDFA, ACEG…) get you started; drill until you don't need them.</li>
      <li><b>Landmarks:</b> know the clef's own note (G4, F3, middle C) and a few others instantly; read nearby notes by counting steps.</li>
      <li><b>Intervals:</b> read the <i>distance</i> to the next note: next line or space = a step; line to line or space to space = a skip (3rd); and so on.</li>
      <li><b>Patterns:</b> lines and spaces each spell every other letter, so if you know one line you know them all.</li>
      <li><b>Same pitch, different clef:</b> find middle C in each clef first, then count.</li></ul>` },
    { title: "Lining things up", kick: "Notes and accidentals", render: (H, k, U) => {
      const sp = { type: "score", clefs: ["treble", "bass"], time: "4/4", vf: "C", sig: {}, bpm: 120, minBar: 260, bars: [{ t: [[{ k: ["C5", "E5", "G5"], d: "h" }, { k: ["F♯4", "A4", "D5"], d: "q" }, { k: ["G4", "A4", "C5"], d: "q" }]], b: [[{ k: ["C3"], d: "q" }, { k: ["E3"], d: "q" }, { k: ["D3"], d: "q" }, { k: ["E♭3", "G3"], d: "q" }]] }, { t: [[{ k: ["C♯5", "E♭5", "G♯5"], d: "w" }]], b: [[{ k: ["A2"], d: "w" }]] }] };
      return `<ul><li><b>Notes that sound together line up vertically</b>, across every staff of a system: chords, grand staff, full scores. Horizontal spacing follows time: longer values get more room, so a half note in one hand lines up with the first of two quarters in the other.</li>
        <li><b>Seconds in a chord:</b> the two noteheads sit on opposite sides of the stem, with the <b>higher note always to the right</b>.</li>
        <li><b>Accidentals</b> go immediately before the notehead, centered on exactly the same line or space, and last until the bar line for that line or space (in that octave).</li>
        <li><b>Several accidentals in a chord</b> stack in columns: the highest goes closest to the chord, then the lowest, then the next highest, working inward. Accidentals a 7th or more apart can share a column.</li>
        <li><b>Accidentals don't change the alignment</b>: the noteheads line up, and space is made in front for the accidental in every part.</li></ul>`
        + U.fig(sp, "Noteheads align across both staves; a 2nd in a chord puts the higher note on the right; accidentals stack in columns in front of the chord.");
    } },
    { title: "Accidentals", kick: "Sharps, flats and naturals", render: (H, k, U) => {
      const a = { type: "score", clefs: ["treble"], time: "4/4", vf: "C", sig: {}, bpm: 60, minBar: 240, bars: [{ t: [[{ k: ["F4"], d: "q", ly: "F" }, { k: ["F♯4"], d: "q", ly: "F♯" }, { k: ["G4"], d: "q", ly: "G" }, { k: ["F♯4"], d: "q", ly: "still F♯" }]] }, { t: [[{ k: ["F4"], d: "q", ly: "F again" }, { k: ["B♭4"], d: "q", ly: "B♭" }, { k: ["B4"], d: "q", ly: "B♮" }, { k: ["B4"], d: "q", ly: "still B♮" }]] }] };
      const b = { type: "score", clefs: ["treble"], time: "4/4", vf: "C", sig: {}, bpm: 60, minBar: 200, bars: [{ t: [[{ k: ["C4"], d: "q", ly: "C" }, { k: ["C♯4"], d: "q", ly: "C♯" }, { k: ["C𝄪4"], d: "q", ly: "C𝄪" }, { k: ["D4"], d: "q", ly: "D" }]] }, { t: [[{ k: ["E4"], d: "q", ly: "E" }, { k: ["E♭4"], d: "q", ly: "E♭" }, { k: ["E𝄫4"], d: "q", ly: "E𝄫" }, { k: ["D4"], d: "q", ly: "D" }]] }] };
      return `<p>An <b>accidental</b> raises or lowers the note it is attached to:</p>
        <div class="ltable-wrap"><table class="ltable"><caption>Accidentals</caption><thead><tr><th scope="col">Sign</th><th scope="col">Name</th><th scope="col">Effect</th></tr></thead><tbody>
        <tr><td><span style="font-size:1.7em;line-height:1">♯</span></td><td>sharp</td><td>up one semitone</td></tr>
        <tr><td><span style="font-size:1.7em;line-height:1">♭</span></td><td>flat</td><td>down one semitone</td></tr>
        <tr><td><span style="font-size:1.7em;line-height:1">♮</span></td><td>natural</td><td>cancels a sharp or flat (from the key signature or earlier in the bar)</td></tr>
        <tr><td><span style="font-size:1.7em;line-height:1">𝄪</span></td><td>double sharp</td><td>up two semitones</td></tr>
        <tr><td><span style="font-size:1.7em;line-height:1">𝄫</span></td><td>double flat</td><td>down two semitones</td></tr></tbody></table></div>
        <ul><li><b>An accidental lasts until the bar line</b>, for every later note on that same line or space in that bar. It does not need repeating.</li>
        <li><b>The bar line cancels it.</b> In the next bar the note goes back to what the key signature says.</li>
        <li><b>Only that line or space</b> (that octave) is affected. An F♯4 doesn't change an F5 in the same bar, though careful editors add a reminder.</li>
        <li><b>Ties carry it across the bar line</b>: a tied note keeps its accidental without rewriting it. A fresh note after the tie needs its own.</li>
        <li><b>Courtesy (cautionary) accidentals</b> are optional reminders, sometimes in parentheses, e.g. a natural in the bar after a sharp, or in another octave or part.</li></ul>`
        + U.fig(a, "Bar 1: the second F♯ needs no sign. Bar 2: the bar line has cancelled the sharp; a natural cancels the flat and lasts to the bar line.")
        + U.fig(b, "Double sharps and double flats move two semitones: C𝄪 sounds the same as D, and E𝄫 the same as D.", { small: true });
    } },
    { title: "Writing accidentals", kick: "Size, place, stacking, enharmonics", render: (H, k, U) => {
      const c = { type: "score", clefs: ["treble"], time: "4/4", vf: "C", sig: {}, bpm: 120, minBar: 260, bars: [{ t: [[{ k: ["E♭4", "G4", "B♭4"], d: "h" }, { k: ["C♯4", "F♯4", "A♯4", "C♯5"], d: "h" }]] }, { t: [[{ k: ["D♭4", "F4", "A♭4", "C♭5"], d: "w" }]] }] };
      const e = { type: "score", clefs: ["treble"], time: "4/4", vf: "C", sig: {}, bpm: 60, minBar: 220, bars: [{ t: [[{ k: ["C♯4"], d: "q", ly: "C♯" }, { k: ["D♭4"], d: "q", ly: "D♭" }, { k: ["E♯4"], d: "q", ly: "E♯" }, { k: ["F4"], d: "q", ly: "F" }]] }, { t: [[{ k: ["B♯4"], d: "q", ly: "B♯" }, { k: ["C5"], d: "q", ly: "C" }, { k: ["C♭5"], d: "q", ly: "C♭" }, { k: ["B4"], d: "q", ly: "B" }]] }] };
      return `<ul><li><b>Placement:</b> immediately before the notehead, centered on exactly the same line or space. A sharp's center box or a flat's round belly sits on that line or space. In text, accidentals come after the letter (F♯), but on the staff they come first.</li>
        <li><b>Size:</b> about the height of three staff spaces for a sharp or natural (a flat is a little shorter), so the sign reaches roughly a space above and below its note. Too small and it is hard to read; too large and it crowds the notes around it. Accidentals for grace notes and cue notes are reduced with the notehead.</li>
        <li><b>Stacking in chords:</b> accidentals can't overlap, so they fan out to the left in columns. The usual order: highest accidental closest to the chord, then the lowest, then the next highest, then the next lowest, working in toward the middle. Accidentals a 7th or more apart can share a column. Notation software does this for you, but check it.</li>
        <li><b>Spacing:</b> make room for the accidental in front of the note; the noteheads of other staves still line up vertically.</li></ul>`
        + U.fig(c, "Accidentals in chords stack in columns to the left of the noteheads.")
        + `<p><b>Enharmonic</b> notes sound the same but are spelled differently: C♯ and D♭, F♯ and G♭, and also the white-key pairs E♯ = F, B♯ = C, C♭ = B and F♭ = E. Spelling matters because it shows the note's job: in A major the third of the chord is C♯, not D♭, and the leading tone of F♯ minor is E♯, not F. Each letter name is used once in a scale, so scales and chords "spell" correctly with stacked thirds.</p>`
        + U.fig(e, "Enharmonic pairs: each pair sounds the same pitch on a piano.", { small: true })
        + `<h3>Try it: place the accidental</h3><p>Drag the sign in front of the note and set its size until all three checks pass. (Keyboard: select the sign, then use the arrow keys to move it and + or − to resize it.)</p>${azToy(H)}`
        + H.check("In the same bar, after a B♭, the next B on that line has no sign. It is…", "B♭", ["B natural", "B♯", "it depends on the clef"], "The flat lasts until the bar line.")
        + H.check("Which is enharmonic with B♯?", "C", ["B", "C♯", "A𝄪"], "B♯ is a semitone above B.");
    } },
    { title: "Tablature", kick: "Strings and frets instead of pitches", render: (H, k, U) => `<p><b>Tablature</b> (<b>tab</b>) is a way of writing music for fretted instruments such as guitar and bass. Instead of showing pitches, it shows <b>where to put your fingers</b>:</p>
      <ul><li>Each <b>line</b> is a <b>string</b>. Guitar tab has six lines: the <b>top line is the highest-sounding string</b> (high E) and the bottom line is the lowest (low E). Bass tab has four (G D A E, top to bottom).</li>
      <li>Each <b>number</b> is a <b>fret</b>: 0 means the open string, 3 means press behind the 3rd fret. Numbers stacked vertically are played together (a chord).</li>
      <li>Basic tab shows <b>no rhythm</b>. Many published parts pair tab with standard notation, or add stems and beams to the numbers, so you get rhythm from the staff and fingering from the tab.</li></ul>
      ${tabFig(H)}
      <p>Notice that the same pitch can sit in different places: the G above middle C (written) is the open G string, but also the 5th fret of the D string and the 10th fret of the A string. Tab chooses one; the staff doesn't. Guitar music is written in treble clef but <b>sounds an octave lower</b> than written, which is why the Play button sounds lower than the staff suggests.</p>
      <p>Tab is quick to learn and great for showing a specific fingering, but it is tied to one instrument and its tuning, and it hides the pitch relationships (intervals, keys, chords) that the staff makes visible.</p>`
      + H.check("In guitar tab, the top line stands for…", "the highest-sounding string (high E)", ["the lowest-sounding string (low E)", "the highest note in the bar", "the 1st fret"], "Tab is drawn as if you were looking down at the guitar on your lap: the thinnest, highest string on top.")
      + H.check("In tab, a 0 on a line means…", "play that string open (no finger on a fret)", ["rest", "the note C", "mute the string"], "Numbers count frets; 0 is the open string.") },
    { title: "Pitch in a DAW", kick: "The timeline and the piano roll", render: (H, k, U) => `<p>A <b>digital audio workstation</b> (DAW) shows music on a <b>timeline</b>: time runs from left to right, measured in bars and beats along a ruler at the top, and each <b>track</b> (vocals, drums, a synth part) is a horizontal lane. A <b>playhead</b> line sweeps across as the music plays.</p>
      <ul><li><b>Audio clips</b> show a <b>waveform</b>: the height is loudness, not pitch. You can see where notes start and how loud they are, but not which notes they are.</li>
      <li><b>MIDI clips</b> open in the <b>piano roll</b>, which <i>does</i> show pitch: a keyboard runs down the left edge, and each note is a bar whose height is its pitch and whose length is its duration.</li></ul>
      ${rollFig()}
      <p>The same two bars in standard notation:</p>
      ${U.fig(ROLLSCORE, "The piano roll's notes on a staff: a quarter, two eighths, two quarters; two eighths, a quarter, and a half-note chord.")}
      <h3>Piano roll vs. staff</h3>
      <ul><li>On the staff, each line or space is a <b>letter</b> (a step of the scale), and sharps and flats are added as signs. In the piano roll, <b>every semitone gets its own row</b>, black keys included, so there are no accidentals or key signatures; the same note is always on the same row.</li>
      <li>On the staff, rhythm is shown by the note's <b>shape</b> (quarter, eighth, half). In the piano roll it's shown by <b>length and position</b> against the grid.</li>
      <li>Each piano-roll note has a <b>MIDI note number</b>: middle C is 60, and each semitone adds 1. Watch the octave labels: many DAWs call middle C <b>C3</b>, while most music theory books (and this site) call it <b>C4</b>. It's the same note: check for the label on the keyboard's middle C.</li></ul>`
      + H.check("In a piano roll, how is a note's pitch shown?", "by which row it's on: higher rows are higher pitches", ["by the bar's length", "by its color", "by the velocity lane"], "Length is duration; velocity is how hard it's played.")
      + H.check("MIDI note 60 is…", "middle C (labeled C4 in theory books, C3 in many DAWs)", ["A440", "the lowest note on a piano", "C5 everywhere"], "Each semitone adds 1: 61 is C♯, 69 is the A above middle C.") },
    { title: "Quick check", kick: "Before the drills", render: (H) => H.check("Bass clef, top line:", "A", ["F", "G", "B"], "G B D F A.") + H.check("Treble clef, 1st space:", "F", ["E", "G", "A"], "F A C E.") + H.check(FACTS[3][0], FACTS[3][1], FACTS[3][2], FACTS[3][3]) + H.check(FACTS[15][0], FACTS[15][1], FACTS[15][2], FACTS[15][3]) },
  ] };

  // drill widget: two staves side by side; drag the note on the second to the same pitch
  const CD = { sp: 10, y0: 40, x: 120, lo: -4, hi: 12 };
  const cdY = st => CD.y0 + 4 * CD.sp - st * CD.sp / 2;
  function cdNote(st, cls, extra = "") {
    let led = ""; for (let t = -2; t >= st; t -= 2) led += `<line x1="${CD.x - 13}" x2="${CD.x + 13}" y1="${cdY(t)}" y2="${cdY(t)}" stroke="currentColor" stroke-width="1.2"/>`; for (let t = 10; t <= st; t += 2) led += `<line x1="${CD.x - 13}" x2="${CD.x + 13}" y1="${cdY(t)}" y2="${cdY(t)}" stroke="currentColor" stroke-width="1.2"/>`;
    const y = cdY(st);
    return `<g class="${cls}" ${extra}><rect class="cdhit" x="${CD.x - 22}" y="${y - 12}" width="44" height="24" rx="8" fill="transparent"/>${led}<ellipse cx="${CD.x}" cy="${y}" rx="${CD.sp * .72}" ry="${CD.sp * .5}" transform="rotate(-20 ${CD.x} ${y})" fill="none" stroke="currentColor" stroke-width="${CD.sp * .26}"/></g>`;
  }
  const cdStaff = (H, clef, inner, label, role) => H.miniStaff({ clef, notes: [], w: 170, label, role }).replace("</svg>", inner + "</svg>");
  const stepOfWhere = w => { for (let x = CD.lo; x <= CD.hi; x++) if (where(x) === w) return x; return 4; };
  function cdRight(c, q, H) {
    const st = q.done ? stepOfWhere(q.chosen) : (q.cdS != null ? q.cdS : 4), moved = q.done || q.cdS != null, ok = q.done && q.chosen === c.answer;
    const note = cdNote(st, `cdmove${q.done ? (ok ? " right" : " wrong") : ""}${moved ? "" : " fresh"}`, q.done ? "" : `id="cdN" tabindex="0" role="slider" aria-label="Note on the ${CNAME[c.to]} staff" aria-valuemin="${CD.lo}" aria-valuemax="${CD.hi}" aria-valuenow="${st}" aria-valuetext="${moved ? where(st) : "not placed yet: drag it, or use the up and down arrow keys"}"`);
    return cdStaff(H, c.to, (q.done && !ok ? cdNote(c.s2, "cdright") : "") + note, `${CNAME[c.to]} staff${q.done ? `: your note on the ${where(st)}${ok ? "" : `; the correct place, shown in green, is the ${where(c.s2)}`}` : ""}`, q.done ? "img" : "group");
  }
  const widgets = { clefDrag: {
    html(c, q, H) {
      const left = cdStaff(H, c.from, cdNote(c.s, "cdfix"), `${CNAME[c.from]} staff with a note on the ${where(c.s)}`);
      return `<div class="cdpair"><figure><figcaption>${CNAME[c.from]} clef</figcaption>${left}</figure><span class="cdarrow" aria-hidden="true">→</span><figure><figcaption>${CNAME[c.to]} clef${q.done ? "" : ": drag the note"}</figcaption><div class="cdbox">${cdRight(c, q, H)}</div></figure></div>`;
    },
    wire(root, c, q, H) {
      const box = root.querySelector(".cdbox"), btn = root.querySelector("[data-wcheck]");
      const set = (st, focus) => { q.cdS = Math.max(CD.lo, Math.min(CD.hi, st)); box.innerHTML = cdRight(c, q, H); btn.disabled = false; if (focus) box.querySelector("#cdN").focus(); };
      let drag = false;
      const stAt = e => { const svg = box.querySelector("svg"), p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const y = p.matrixTransform(svg.getScreenCTM().inverse()).y; return Math.round((CD.y0 + 4 * CD.sp - y) / (CD.sp / 2)); };
      box.onpointerdown = e => { drag = true; e.preventDefault(); set(stAt(e)); };
      box.onpointermove = e => { if (drag) { const st = Math.max(CD.lo, Math.min(CD.hi, stAt(e))); if (st !== q.cdS) set(st); } };
      box.onpointerup = box.onpointercancel = box.onpointerleave = () => { if (drag) { drag = false; set(q.cdS, true); } };
      box.onkeydown = e => { if (!e.target.closest("#cdN")) return; const cur = q.cdS != null ? q.cdS : 4, d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key]; if (d) { e.preventDefault(); set(cur + d, true); } else if (e.key === "Enter" && q.cdS != null) { e.preventDefault(); btn.click(); } };
      if (q.cdS != null) btn.disabled = false;
    },
    value(root) { const n = root.querySelector("#cdN"); return n && n.getAttribute("aria-valuenow") != null ? where(+n.getAttribute("aria-valuenow")) : null; },
  } };

  return {
    key: "silverapps-clefs-v1", lesson, make, reference, widgets,
    modes: [{ id: "name", kicker: "Name the note" }, { id: "octave", kicker: "Note and octave" }, { id: "same", kicker: "Same pitch, new clef" }, { id: "devices", kicker: "Devices and principles" }],
    topics: [{ id: "treble", name: "Treble clef", group: "c" }, { id: "bass", name: "Bass clef", group: "c" }, { id: "alto", name: "Alto clef", group: "c" }, { id: "tenor", name: "Tenor clef", group: "c", on: false },
      { id: "staff", name: "On the staff", group: "r" }, { id: "ledger", name: "Ledger lines", group: "r", on: false }],
  };
})();
