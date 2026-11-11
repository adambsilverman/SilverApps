window.FAM = (() => {
  // ===== Note Values and Rhythm Reading. Engine: build/harmony/engine.js =====
  const P = "B4";
  const VAL = [["w", 4, "whole note", "semibreve"], ["hd", 3, "dotted half note", ""], ["h", 2, "half note", "minim"], ["qd", 1.5, "dotted quarter note", ""], ["q", 1, "quarter note", "crotchet"], ["8d", .75, "dotted eighth note", ""], ["8", .5, "eighth note", "quaver"], ["16", .25, "sixteenth note", "semiquaver"], ["hdd", 3.5, "double-dotted half note", ""], ["qdd", 1.75, "double-dotted quarter note", ""]];
  const V = Object.fromEntries(VAL.map(v => [v[0], v]));
  const frac = x => { const w = Math.floor(x), f = x - w, F = { .25: "¼", .5: "½", .75: "¾" }[f] || ""; return (w || !F ? String(w) : "") + F; };
  // percussion-staff bars from tokens like "q", "8r", "8~", "8t1" (triplet group 1)
  const tokN = x => { const rest = /r/.test(x), tie = /~/.test(x), tu = (/t(\d)/.exec(x) || [])[1], d = x.replace(/[r~]|t\d/g, ""); return Object.assign({ k: rest ? [] : [P], d, tie }, tu ? { tu: "g" + tu } : {}); };
  const rh = (time, bars, o = {}) => ({ type: "score", clefs: ["percussion"], time, vf: "C", sig: {}, bpm: o.bpm || 90, final: o.final, bars: bars.map(b => ({ t: [b.split(" ").map(tokN)] })) });
  // every rhythm figure plays with a click on the beat; o.play === false for silent figures
  const fig = (U, sp, cap, o) => U.fig(sp, cap, Object.assign({ small: true, play: window.__harm ? window.__harm.H.withClick(sp) : null }, o || {}));
  const METERS = [["2/4", "simple duple", 2, "quarter"], ["3/4", "simple triple", 3, "quarter"], ["4/4", "simple quadruple", 4, "quarter"], ["2/2", "simple duple (cut time)", 2, "half"], ["6/8", "compound duple", 2, "dotted quarter"], ["9/8", "compound triple", 3, "dotted quarter"], ["12/8", "compound quadruple", 4, "dotted quarter"], ["3/8", "simple triple", 3, "eighth"]];

  // incomplete bars: fill all but one value
  const PIECES = ["h", "q", "q", "8", "8", "qd", "16"];
  function incomplete(H) {
    for (let g = 0; g < 200; g++) {
      const [ts, len, beam] = H.rnd([["4/4", 4], ["3/4", 3], ["2/4", 2], ["6/8", 3]]);
      const miss = H.rnd(ts === "6/8" ? ["qd", "q", "8", "h"] : ["h", "q", "qd", "8", "hd", "16", "8d"]);
      let left = len - V[miss][1]; if (left <= 0) continue;
      const seq = []; let t = 0;
      while (left > 1e-9) { const opts = PIECES.filter(p => V[p][1] <= left + 1e-9 && (ts !== "6/8" || V[p][1] !== 2 || t % 1.5 === 0)); if (!opts.length) break; const p = H.rnd(opts); seq.push(p); left -= V[p][1]; t += V[p][1]; }
      if (left > 1e-9) continue;
      // keep notation tidy: values must not cross the middle of the bar (4/4) or a dotted-quarter beat (6/8)
      let pos = 0, ok = true; const all = seq.concat([miss]);
      const order = H.shuffle(seq).concat([miss]); pos = 0;   // the missing value is always the last one, so the shown notes sit where they belong
      for (const p of order) { const d = V[p][1], end = pos + d; if (ts === "4/4" && pos < 2 && end > 2 && !(pos === 0 && d >= 2)) ok = false; if (ts === "6/8" && Math.floor(pos / 1.5 + 1e-9) !== Math.floor((end - 1e-9) / 1.5) && !(pos % 1.5 === 0 && d % 1.5 === 0)) ok = false; if (ts !== "6/8" && Math.floor(pos + 1e-9) !== Math.floor(end - 1e-9) && pos % 1 > 1e-9) ok = false; /* anything that crosses a beat must start on a beat */ if (d >= .5 && pos % .5 > 1e-9) ok = false; pos = end; }
      if (!ok) continue;
      const gap = order.length - 1;
      const shown = order.map((p, i) => i === gap ? null : p).filter(Boolean);
      return { ts, miss, order, gap, shown };
    }
    return null;
  }

  const FACTS = [
    ["Tempo is measured in…", "beats per minute (BPM)", ["bars per minute", "hertz", "notes per bar"], "At 60 BPM each beat lasts one second."],
    ["Ritardando means…", "gradually slowing down", ["gradually getting louder", "suddenly faster", "return to the original tempo"], "Accelerando speeds up; a tempo returns to the earlier speed."],
    ["The division of the beat is…", "the beat split into its first smaller level (two parts in simple meter, three in compound)", ["the beat itself", "a whole bar", "the tempo"], "Below the division comes the subdivision."],
    ["In 6/8, the subdivision is…", "six sixteenth notes per dotted-quarter beat", ["three eighth notes", "two eighth notes", "four sixteenth notes"], "Beat: dotted quarter. Division: three eighths. Subdivision: six sixteenths."],
    ["A dot after a note adds…", "half of the note's value", ["one beat", "a quarter of its value", "the value of the next note"], "A dotted half = half + quarter = 3 quarter-note beats."],
    ["A second dot adds…", "half the value of the first dot", ["another full half of the note", "one beat", "nothing; it's decoration"], "Double-dotted half = 2 + 1 + ½ = 3½ beats."],
    ["What's the difference between a tie and a slur?", "a tie joins two notes of the same pitch into one sound; a slur joins different pitches", ["there's none", "a slur joins the same pitch", "ties are only for rests"], "Ties add durations; slurs shape phrasing."],
    ["In 6/8, the beat is…", "a dotted quarter note (two beats per bar)", ["an eighth note (six beats per bar)", "a quarter note", "a half note"], "Compound meter: the eighth is the division, not the beat."],
    ["In 2/2 (cut time), the beat is…", "a half note", ["a quarter note", "a whole note", "a dotted quarter note"], "Two half-note beats per bar."],
    ["A triplet is…", "three notes in the time of two of the same value", ["three notes in one beat, always", "a dotted rhythm", "three tied notes"], "Eighth-note triplets: three in the time of two eighths (one quarter beat)."],
    ["In 4/4, a quarter-note triplet lasts…", "2 beats", ["1 beat", "3 beats", "1½ beats"], "Three triplet quarters take the time of two quarters."],
    ["A duplet in 6/8 is…", "two notes in the time of three eighths (one beat)", ["two beats", "a dotted rhythm", "two tied eighths"], "The compound-meter version of a tuplet."],
    ["The British name for a quarter note is…", "crotchet", ["quaver", "minim", "semibreve"], "Quaver = eighth, minim = half, semibreve = whole, semiquaver = sixteenth."],
    ["The British name for an eighth note is…", "quaver", ["crotchet", "semiquaver", "minim"], "A semiquaver is a sixteenth."],
    ["A whole rest by itself in a bar of 3/4 means…", "rest for the whole bar", ["rest for four beats", "an error", "rest for one beat"], "The whole rest (bar rest) fills any complete bar, centered in it."],
    ["Where does a whole-bar rest go?", "centered in the bar", ["on beat 1", "at the end of the bar", "above the staff"], "A bar rest is centered, whatever the meter."],
    ["Which bars end with a bar line?", "every bar, including the last bar of each line", ["only the last bar of the piece", "only bars with notes", "every other bar"], "The end of the piece gets a final (thin–thick) bar line."],
    ["Beams group notes…", "by beat, so the meter is visible", ["by pitch", "always in fours", "only in pairs"], "In 6/8, beam in threes; in 2/4 and 3/4, in twos (or by beat)."],
    ["Notes that occur at the same moment in different parts are…", "vertically aligned", ["written slightly apart", "aligned only if they're the same pitch", "joined with a tie"], "Line up beats across every staff of a system."],
    ["Stem direction: a note above the middle line has its stem…", "down (on the left)", ["up (on the right)", "either way, randomly", "no stem"], "Below the middle line, stems go up; on the middle line, usually down."],
  ];

  function make(mode, H) {
    if (mode === "value") {
      const v = H.rnd(VAL), rest = Math.random() < .3 && !/dd/.test(v[0]);
      const sp = rh("4/4", [v[0] + (rest ? "r" : "")], { final: false }); sp.time = null; sp.minBar = 110; sp.scale = 1.9;
      const all = ["4", "3½", "3", "2", "1¾", "1½", "1", "¾", "½", "¼"];
      return H.mc(`In 4/4, how many quarter-note beats does this ${rest ? "rest" : "note"} last?`, frac(v[1]), all, `A ${v[2].replace("note", rest ? "rest" : "note")} lasts ${frac(v[1])} beat${v[1] === 1 ? "" : "s"} when the quarter note gets the beat.${/d/.test(v[0]) ? " Each dot adds half of the value before it." : ""}`, { kicker: "Note values", staff: sp, topic: "values" });
    }
    if (mode === "math") {   // drag (or tap) note values into a row on the right until it lasts as long as the given note on the left
      if (Math.random() < .55) {
        const pairs = [];
        VAL.forEach(a => VAL.forEach(b => { const r = a[1] / b[1]; if (a !== b && r > 1 && Number.isInteger(r) && r <= 12 && !/d/.test(b[0])) pairs.push([a, b, r]); }));
        const [a, b, r] = H.rnd(pairs);
        return { text: `Fill the right side with ${b[2]}s until it lasts exactly as long as one ${a[2]}.`, answer: `${r} ${b[2]}s`, choices: [], widget: "valfill", nvA: a[0], nvT: a[1], nvPal: [b[0]],
          explain: `${a[2]} = ${frac(a[1])} quarter-note beats; ${b[2]} = ${frac(b[1])}. ${frac(a[1])} ÷ ${frac(b[1])} = ${r}, so ${r} ${b[2]}s.`, kicker: "Value math", topic: "values" };
      }
      const a = H.rnd(VAL.filter(v => v[1] >= 1.5));
      return { text: `Fill the right side with any note values that add up to exactly one ${a[2]}.`, answer: `notes adding up to ${frac(a[1])} beats`, choices: [], widget: "valfill", nvA: a[0], nvT: a[1], nvPal: ["w", "hd", "h", "qd", "q", "8d", "8", "16"],
        explain: `A ${a[2]} lasts ${frac(a[1])} quarter-note beats, so any combination adding up to ${frac(a[1])} is right (for example ${{ 4: "two half notes", 3: "a half note and a quarter", 3.5: "a dotted half and an eighth", 2: "two quarter notes", 1.75: "a quarter, an eighth and a sixteenth", 1.5: "a quarter and an eighth" }[a[1]] || "several shorter values"}).`, kicker: "Value math", topic: "values" };
    }
    if (mode === "complete") {
      const x = incomplete(H);
      if (!x) return null;
      const sp = rh(x.ts, [x.shown.join(" ")], { final: false });
      const full = rh(x.ts, [x.order.join(" ")]); full.bars[0].t[0][x.gap].hl = true;
      return H.mc(`This bar of ${x.ts} is missing one value. Which single note completes it?`, V[x.miss][2], VAL.slice(0, 8).map(v => v[2]), `The bar holds ${x.ts === "6/8" ? "six eighths (two dotted-quarter beats)" : x.ts.split("/")[0] + " quarter-note beats"}; the notes shown add up to ${frac(x.shown.reduce((t, p) => t + V[p][1], 0) * (x.ts === "6/8" ? 2 : 1))} ${x.ts === "6/8" ? "eighths" : "beats"}, so a ${V[x.miss][2]} completes it (circled).`, { kicker: "Complete the bar", staff: sp, staffAns: full, playQ: H.withClick(full), playQLabel: "Play the full bar with the beat", topic: "meter" });
    }
    if (mode === "tuplet") {
      const kind = H.rnd(["8t", "qt", "16t", "dup"]);
      if (kind === "dup") {
        const sp = rh("6/8", ["8t1 8t1 8 8 8"]); sp.bars[0].t[0].forEach((n, i) => { if (i < 2) { n.tun = 2; n.tuo = 3; } });
        return H.mc("In 6/8, how much time does the bracketed group of two take?", "one beat (three eighths)", ["two beats", "two eighths", "half a beat"], "A duplet: two notes in the time of three eighths, which is one dotted-quarter beat in 6/8.", { kicker: "Tuplets", staff: sp, playQ: H.scorePlay(sp), playQLabel: "Play", topic: "tuplets" });
      }
      const spec = { "8t": ["8t1 8t1 8t1 q h", "1 beat (a quarter note)", "three triplet eighths take the time of two regular eighths: one quarter-note beat."], "qt": ["qt1 qt1 qt1 h", "2 beats (a half note)", "three triplet quarters take the time of two quarters: two beats."], "16t": ["16t1 16t1 16t1 8 q h", "½ beat (an eighth note)", "three triplet sixteenths take the time of two sixteenths: one eighth note, half a beat."] }[kind];
      const sp = rh("4/4", [spec[0]]);
      return H.mc("In 4/4, how much time does the bracketed triplet take?", spec[1], ["½ beat (an eighth note)", "1 beat (a quarter note)", "1½ beats (a dotted quarter)", "2 beats (a half note)", "3 beats (a dotted half)"], `A triplet is three in the time of two: ${spec[2]}`, { kicker: "Tuplets", staff: sp, playQ: H.scorePlay(sp), playQLabel: "Play", topic: "tuplets" });
    }
    if (mode === "meter") {
      const [ts, kind, beats, unit] = H.rnd(METERS);
      if (Math.random() < .5) return H.mc(`What kind of meter is ${ts}?`, kind, [...new Set(METERS.map(m => m[1]))], `${ts}: ${beats} beats per bar, the beat a ${unit} note${unit.startsWith("dotted") ? " (each beat divides into three eighths: compound)" : " (each beat divides into two: simple)"}.`, { kicker: "Meter", topic: "meter" });
      return H.mc(`In ${ts}, what gets the beat?`, `the ${unit} note`, ["the quarter note", "the eighth note", "the half note", "the dotted quarter note"], `${ts} is ${kind}: ${beats} ${unit}-note beats per bar.`, { kicker: "Meter", topic: "meter" });
    }
    const [q, a, w, y] = H.rnd(FACTS);
    return H.mc(q, a, w, y, { kicker: "Terms and principles" });
  }

  function reference() {
    return `<div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Value</th><th scope="col">British name</th><th scope="col">Beats in 4/4</th></tr></thead><tbody>
      ${VAL.filter(v => !/dd/.test(v[0])).map(v => `<tr><td>${v[2]}</td><td>${v[3] || "—"}</td><td>${frac(v[1])}</td></tr>`).join("")}</tbody></table></div>
      <p class="legend">Dot = + half the value; second dot = + half of the first dot. Triplet = 3 in the time of 2; duplet (compound meter) = 2 in the time of 3.</p>`;
  }

  // ---------- "Value math" widget: the given note on the left; the student's notes line up in a row on the right ----------
  const GLYPH = { w: "𝅝", hd: "𝅗𝅥.", h: "𝅗𝅥", qd: "♩.", q: "♩", "8d": "♪.", "8": "♪", "16": "𝅘𝅥𝅯" };
  const fillSpec = toks => { const sp = rh("4/4", [toks.join(" ")], { final: false }); sp.time = null; sp.minBar = 90; return sp; };
  const fillSum = q => (q.nvAdd || []).reduce((t, x) => t + V[x][1], 0);
  function fillDraw(root, c, q, H) {
    const L = root.querySelector("#nvL"), Z = root.querySelector("#nvZone"); if (!L || !Z) return;
    const sp = fillSpec([c.nvA]); sp.minBar = 110; H.drawStaff(L, sp);
    const add = q.nvAdd || [];
    if (add.length) H.drawStaff(Z, fillSpec(add)); else Z.innerHTML = `<p class="nvempty">${q.done ? "(nothing)" : "Drag note values here, or tap them"}</p>`;
    const lab = root.querySelector("#nvSum"); if (lab) lab.textContent = add.length ? `${add.length} note${add.length > 1 ? "s" : ""}: ${add.map(x => V[x][2]).join(", ")}` : "No notes yet";
  }
  const widgets = { valfill: {
    html(c, q, H) {
      if (!q.nvAdd) q.nvAdd = [];
      setTimeout(() => { const w = document.querySelector("#work .widget"); if (w) fillDraw(w, c, q, H); }, 0);
      return `<div class="nvpair"><figure><figcaption>Given</figcaption><div class="staff nvstaff" id="nvL" role="img" aria-label="one ${V[c.nvA][2]}"></div><p class="nvname">one ${V[c.nvA][2]}</p></figure>
        <span class="cdarrow" aria-hidden="true">=</span>
        <figure class="nvright"><figcaption>Your notes</figcaption><div class="nvzone${q.done ? "" : " live"}" id="nvZone"></div><p class="nvname" id="nvSum" aria-live="polite"></p></figure></div>
        ${q.done ? "" : `<div class="nvpal" role="group" aria-label="Note values to add">${c.nvPal.map(x => `<button class="nvv" data-nv="${x}" aria-label="Add a ${V[x][2]}"><span class="nvg" aria-hidden="true">${GLYPH[x]}</span><span class="nvt">${V[x][2].replace(" note", "")}</span></button>`).join("")}</div>
        <div class="choice-row nvedit"><button class="btn" data-nvundo>Undo last</button><button class="btn" data-nvclear>Clear</button></div>`}`;
    },
    wire(root, c, q, H) {
      const btn = root.querySelector("[data-wcheck]"), zone = root.querySelector("#nvZone"); root._nv = { c, q };
      const upd = () => { fillDraw(root, c, q, H); btn.disabled = !q.nvAdd.length; };
      const add = x => { if (q.nvAdd.length >= 16) return; q.nvAdd.push(x); upd(); };
      upd();
      root.querySelector("[data-nvundo]").onclick = () => { q.nvAdd.pop(); upd(); };
      root.querySelector("[data-nvclear]").onclick = () => { q.nvAdd = []; upd(); };
      // tap, keyboard or drag a value onto the right side
      let drag = null;
      root.querySelectorAll("[data-nv]").forEach(b => {
        b.onclick = e => { if (e.detail === 0 || !b._dragged) add(b.dataset.nv); b._dragged = false; };
        b.onpointerdown = e => { if (e.button) return; drag = { b, x: e.clientX, y: e.clientY, ghost: null }; b._dragged = false; };
      });
      const move = e => { if (!drag) return; if (!drag.ghost && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 6) { drag.b._dragged = true; drag.ghost = Object.assign(document.createElement("div"), { className: "nvghost", textContent: GLYPH[drag.b.dataset.nv] }); document.body.appendChild(drag.ghost); }
        if (drag.ghost) { e.preventDefault(); drag.ghost.style.left = e.clientX + "px"; drag.ghost.style.top = e.clientY + "px"; const r = zone.getBoundingClientRect(); zone.classList.toggle("over", e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom); } };
      const up = e => { if (!drag) return; const d = drag; drag = null; if (d.ghost) { d.ghost.remove(); zone.classList.remove("over"); const r = zone.getBoundingClientRect(); if (e.clientX >= r.left - 20 && e.clientX <= r.right + 20 && e.clientY >= r.top - 20 && e.clientY <= r.bottom + 20) add(d.b.dataset.nv); } };
      document.addEventListener("pointermove", move); document.addEventListener("pointerup", up); document.addEventListener("pointercancel", up);
      const off = setInterval(() => { if (!document.body.contains(zone) || q.done) { document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up); document.removeEventListener("pointercancel", up); clearInterval(off); } }, 500);
    },
    value(root) { const x = root._nv; if (!x || !x.q.nvAdd.length) return null; const { c, q } = x, tot = fillSum(q);
      return Math.abs(tot - c.nvT) < 1e-9 ? c.answer : c.nvPal.length === 1 ? `${q.nvAdd.length} ${V[c.nvPal[0]][2]}${q.nvAdd.length > 1 ? "s" : ""}` : `notes adding up to ${frac(tot)} beat${tot === 1 ? "" : "s"}`; },
  } };

  // labeled diagram for "Parts of a note": notehead, stem, flag, beam, two flags, stem direction
  function partsFig() {
    const W = 660, sp = 12, top = 96, Y = st => top + 4 * sp - st * sp / 2, ink = "currentColor", red = "var(--fi-red-dk, #b33a26)";
    let g = ""; for (let i = 0; i < 5; i++) g += `<line x1="16" x2="${W - 16}" y1="${top + i * sp}" y2="${top + i * sp}" stroke="${ink}" stroke-width="1.2"/>`;
    const head = (x, st, open) => { const y = Y(st); return `<ellipse cx="${x}" cy="${y}" rx="${sp * .68}" ry="${sp * .48}" transform="rotate(-20 ${x} ${y})" fill="${open ? "none" : ink}" stroke="${ink}" stroke-width="${open ? sp * .22 : 1}"/>`; };
    const stemUp = (x, st, len = 3.5) => { const y = Y(st), xs = x + sp * .62; return { x: xs, y1: y - 2, y2: y - len * sp, svg: `<line x1="${xs}" x2="${xs}" y1="${y - 2}" y2="${y - len * sp}" stroke="${ink}" stroke-width="1.6"/>` }; };
    const flag = (x, y) => `<path d="M${x} ${y} c 1 11 15 15 13 33 c 5 -15 -4 -23 -13 -26 z" fill="${ink}"/>`;
    // a leader line from the label toward the part; it stops short (with a small arrowhead) so the note itself stays clear
    const label = (tx, ty, x2, y2, t, anchor = "middle") => { const x1 = tx, y1 = ty + (ty < y2 ? 6 : -16), dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, gapPx = 9;
      const ex = x2 - ux * gapPx, ey = y2 - uy * gapPx, ah = 7, aw = 3.6, bx = ex - ux * ah, by = ey - uy * ah;
      return `<line x1="${x1}" y1="${y1}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="${red}" stroke-width="1.4"/><path d="M${ex.toFixed(1)} ${ey.toFixed(1)} L${(bx - uy * aw).toFixed(1)} ${(by + ux * aw).toFixed(1)} L${(bx + uy * aw).toFixed(1)} ${(by - ux * aw).toFixed(1)} Z" fill="${red}"/><text x="${tx}" y="${ty}" text-anchor="${anchor}" font-size="15" font-weight="700" fill="${red}">${t}</text>`; };
    // 1 half note (open head), 2 quarter (filled head, stem), 3 eighth (flag), 4–5 beamed eighths, 6 sixteenth (two flags), 7 a high note: stem down on the left
    const xs = [70, 160, 250, 335, 385, 475, 580];
    g += head(xs[0], 1, true) + stemUp(xs[0], 1).svg;
    const s2 = stemUp(xs[1], 2); g += head(xs[1], 2) + s2.svg;
    const s3 = stemUp(xs[2], 1); g += head(xs[2], 1) + s3.svg + flag(s3.x, s3.y2);
    const s4 = stemUp(xs[3], 2), s5 = stemUp(xs[4], 3, 3.25); g += head(xs[3], 2) + head(xs[4], 3) + s4.svg + `<line x1="${s5.x}" x2="${s5.x}" y1="${s5.y1}" y2="${s4.y2}" stroke="${ink}" stroke-width="1.6"/>` + `<rect x="${s4.x - .8}" y="${s4.y2}" width="${s5.x - s4.x + 1.6}" height="${sp * .5}" fill="${ink}"/>`;
    const s6 = stemUp(xs[5], 1, 3.8); g += head(xs[5], 1) + s6.svg + flag(s6.x, s6.y2) + flag(s6.x, s6.y2 + 10);
    const y7 = Y(7), xl = xs[6] - sp * .62; g += head(xs[6], 7) + `<line x1="${xl}" x2="${xl}" y1="${y7 + 2}" y2="${y7 + 3.5 * sp}" stroke="${ink}" stroke-width="1.6"/>`;
    g += label(xs[0] - 6, 200, xs[0], Y(1) + 4, "open notehead") + label(xs[1] + 30, 40, s2.x, Y(2) - 2.2 * sp, "stem") + label(xs[1] + 30, 226, xs[1], Y(2) + 4, "filled notehead");
    g += label(xs[2] + 30, 30, s3.x + 7, s3.y2 + 12, "flag") + label(360, 22, (s4.x + s5.x) / 2, s4.y2 + 3, "beam") + label(xs[5] + 20, 200, s6.x + 8, s6.y2 + 22, "two flags: a 16th");
    g += label(W - 12, 30, xl, y7 + 2.6 * sp, "high note: stem down, on the left", "end");
    const desc = "A staff with labeled note parts: a half note with an open notehead and a stem; a quarter note with a filled notehead and a stem; an eighth note with one flag; two eighth notes joined by a beam instead of flags; a sixteenth note with two flags; and a note above the middle line whose stem points down on the left side of the notehead.";
    return `<figure class="lfig"><svg viewBox="0 0 ${W} 236" role="img" aria-label="${desc}" style="width:100%;max-width:${W}px">${g}</svg><figcaption>The parts of a note. Notes below the middle line have stems up, on the right; notes above it have stems down, on the left.</figcaption></figure>`;
  }

  // ---------- lesson tools: a Dr. Beat-style metronome (Tempo) and a tuplet explorer (Triplets and tuplets) ----------
  let AC = null, NZ = null;
  const ac = () => { if (!AC) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; AC = new C(); } if (AC.state === "suspended") AC.resume(); return AC; };
  // a woody click (beat), lighter and higher ticks for the divisions, and a bell-like DING for the accent
  function snd(t, kind, vol) {
    if (!(vol > 0)) return;
    const out = AC.createGain(); out.gain.value = vol; out.connect(AC.destination);
    if (kind === "ding") {
      [[1760, 1, .9], [3520, .32, .45], [5280, .12, .25], [880, .25, .6]].forEach(([f, a, d]) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.42 * a, t + .002); g.gain.exponentialRampToValueAtTime(.0005, t + d); o.connect(g); g.connect(out); o.start(t); o.stop(t + d + .05); });
      return;
    }
    if (!NZ) { NZ = AC.createBuffer(1, AC.sampleRate * .2, AC.sampleRate); const d = NZ.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const [f, a, len] = { click: [1250, .9, .04], div: [1850, .55, .03], trip: [2250, .5, .03], sub: [2700, .4, .025], lo: [700, .8, .05], hi: [1500, .7, .04] }[kind];
    const o = AC.createOscillator(), og = AC.createGain(), n = AC.createBufferSource(), bp = AC.createBiquadFilter(), ng = AC.createGain();
    o.type = "sine"; o.frequency.value = f; og.gain.setValueAtTime(0, t); og.gain.linearRampToValueAtTime(.55 * a, t + .001); og.gain.exponentialRampToValueAtTime(.001, t + len);
    n.buffer = NZ; bp.type = "bandpass"; bp.frequency.value = f * 1.6; bp.Q.value = 2.5; ng.gain.setValueAtTime(.6 * a, t); ng.gain.exponentialRampToValueAtTime(.001, t + .015);
    o.connect(og); og.connect(out); n.connect(bp); bp.connect(ng); ng.connect(out); o.start(t); o.stop(t + len + .02); n.start(t); n.stop(t + .03);
  }

  // Dr. Beat-style metronome: tempo, meter, and a mixer of levels for accent (DING on beat 1), beat (click), division, triplet division and subdivision
  const MB = { bpm: 96, beats: 4, comp: false, acc: 80, beat: 80, div: 0, trip: 0, sub: 0, on: false, next: 0, n: 0, timer: 0, raf: 0, queue: [], taps: [] };
  const MB_METERS = [["2/4", 2, false], ["3/4", 3, false], ["4/4", 4, false], ["5/4", 5, false], ["6/4", 6, false], ["7/4", 7, false], ["1/4 (no accent pattern)", 1, false], ["6/8", 2, true], ["9/8", 3, true], ["12/8", 4, true]];
  const mbSliders = () => [["acc", "Accent (DING on beat 1)"], ["beat", "Beat"], ["div", MB.comp ? "Division (three eighths)" : "Division (eighths)"], ["trip", "Triplet division"], ["sub", MB.comp ? "Subdivision (six sixteenths)" : "Subdivision (sixteenths)"]]
    .map(([k, l]) => { const off = k === "trip" && MB.comp; return `<label class="syk mbs">${l}<input type="range" min="0" max="100" step="1" value="${off ? 0 : MB[k]}" data-mb="${k}" ${off ? "disabled" : ""} aria-valuetext="${off ? "not used in compound meter" : MB[k] + " percent"}"><output data-mbo="${k}">${off ? "—" : MB[k] + "%"}</output></label>`; }).join("");
  const mbLights = () => Array.from({ length: MB.beats }, (_, i) => `<span class="mblight${i ? "" : " acc"}" data-mbl="${i}">${i + 1}</span>`).join("");
  function metroToy() {
    return `<div class="toy mbtoy" id="mbToy">
      <div class="toy-row"><button class="play" id="mbGo" aria-pressed="${MB.on}">${MB.on ? "■ Stop" : "▶ Start"}</button>
        <label for="mbMeter">Meter <select id="mbMeter">${MB_METERS.map(([n, b, c], i) => `<option value="${i}" ${b === MB.beats && c === MB.comp ? "selected" : ""}>${n}</option>`).join("")}</select></label>
        <button class="play" id="mbTap">Tap tempo</button></div>
      <div class="toy-row mbtempo"><button class="play" data-mbstep="-1" aria-label="Slower by 1 BPM">−</button>
        <label for="mbBpm" class="mbbig"><span id="mbUnit">${MB.comp ? "♩." : "♩"}</span> =&nbsp;<input type="number" id="mbBpmN" min="30" max="250" value="${MB.bpm}" aria-label="Beats per minute"></label>
        <button class="play" data-mbstep="1" aria-label="Faster by 1 BPM">+</button>
        <input type="range" id="mbBpm" min="30" max="250" step="1" value="${MB.bpm}" aria-label="Tempo in beats per minute" style="flex:1;min-width:160px"><span class="small" id="mbTerm"></span></div>
      <div class="mblights" id="mbLights" aria-hidden="true">${mbLights()}</div>
      <div class="sygrid" id="mbMix">${mbSliders()}</div>
      <p class="small" style="margin:0">Like a practice metronome with a mixer: raise <b>Division</b> to hear the “&amp;”s, <b>Subdivision</b> for “e &amp; a”, or <b>Triplet division</b> to practice triplets against the beat. Turn the <b>Beat</b> down to zero and keep only the accent to test your inner pulse.</p></div>`;
  }
  const TERMS = [[60, "Largo"], [66, "Larghetto"], [76, "Adagio"], [108, "Andante"], [120, "Moderato"], [156, "Allegro"], [176, "Vivace"], [200, "Presto"], [999, "Prestissimo"]];
  const mbTerm = () => { const e = document.getElementById("mbTerm"); if (e) e.textContent = "about " + TERMS.find(([b]) => MB.bpm < b)[1]; };
  function mbSchedule() {
    const look = AC.currentTime + .12;
    while (MB.next < look) {
      const t = MB.next, spb = 60 / MB.bpm, b = MB.n % MB.beats, v = k => MB[k] / 100;
      if (b === 0 && MB.beats > 1) snd(t, "ding", v("acc"));
      snd(t, "click", v("beat") * (b === 0 && MB.beats > 1 ? .9 : 1));
      if (MB.comp) { [1, 2].forEach(i => snd(t + spb * i / 3, "div", v("div"))); [1, 2, 3, 4, 5].forEach(i => snd(t + spb * i / 6, "sub", v("sub") * (i % 2 ? 1 : .7))); }
      else { snd(t + spb / 2, "div", v("div")); [1, 2].forEach(i => snd(t + spb * i / 3, "trip", v("trip"))); [1, 2, 3].forEach(i => snd(t + spb * i / 4, "sub", v("sub") * (i === 2 ? .7 : 1))); }
      MB.queue.push([t, b]); MB.next += spb; MB.n++;
    }
  }
  function mbDraw() {
    if (!document.getElementById("mbToy") || !MB.on) { MB.raf = 0; return; }
    while (MB.queue.length && MB.queue[0][0] <= AC.currentTime) { const [, b] = MB.queue.shift(); document.querySelectorAll("[data-mbl]").forEach(e => e.classList.toggle("on", +e.dataset.mbl === b)); }
    MB.raf = requestAnimationFrame(mbDraw);
  }
  function mbStart() { if (!ac()) return; MB.on = true; MB.n = 0; MB.queue = []; MB.next = AC.currentTime + .08; mbSchedule(); MB.timer = setInterval(mbSchedule, 25); if (!MB.raf) MB.raf = requestAnimationFrame(mbDraw); mbBtn(); }
  function mbStop() { MB.on = false; clearInterval(MB.timer); MB.timer = 0; document.querySelectorAll("[data-mbl]").forEach(e => e.classList.remove("on")); mbBtn(); }
  const mbBtn = () => { const b = document.getElementById("mbGo"); if (b) { b.setAttribute("aria-pressed", String(MB.on)); b.textContent = MB.on ? "■ Stop" : "▶ Start"; } };
  function mbSetBpm(x, from) { MB.bpm = Math.max(30, Math.min(250, Math.round(x) || MB.bpm)); const r = document.getElementById("mbBpm"), n = document.getElementById("mbBpmN"); if (r && from !== r) r.value = MB.bpm; if (n && from !== n) n.value = MB.bpm; mbTerm(); }

  // tuplet explorer: n notes in the time of m, drawn on a shared timeline over the common grid, played together or separately
  const TP = { n: 3, m: 2, rate: 60, hearM: true, hearN: true, on: false, t0: 0, timer: 0, raf: 0, next: 0, cyc: 0 };
  const TP_PRE = [[3, 2, "Triplet: 3 in the time of 2"], [2, 3, "Duplet: 2 in the time of 3"], [4, 3, "4 in the time of 3"], [5, 4, "Quintuplet: 5 in the time of 4"], [6, 4, "Sextuplet: 6 in the time of 4"], [7, 4, "Septuplet: 7 in the time of 4"]];
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  function tpSVG() {
    const W = 620, x0 = 14, L = W - x0 - 14, lcm = TP.n * TP.m / gcd(TP.n, TP.m), red = "var(--fi-red-dk, #b33a26)", ink = "currentColor";
    let g = "";
    for (let i = 0; i <= lcm; i++) { const x = x0 + L * i / lcm; g += `<line x1="${x}" x2="${x}" y1="18" y2="140" stroke="${ink}" stroke-opacity="${i % (lcm / TP.m) === 0 && i % (lcm / TP.n) === 0 ? .55 : .14}" stroke-width="1" ${i % (lcm / TP.m) === 0 && i % (lcm / TP.n) === 0 ? "" : 'stroke-dasharray="3 3"'}/>`; }
    const row = (k, y, col) => { let s = "";
      for (let i = 0; i < k; i++) { const xa = x0 + L * i / k, w = L / k; s += `<rect class="tpb" data-tpr="${k === TP.m ? "m" : "n"}${i}" x="${xa + 2}" y="${y}" width="${w - 4}" height="32" rx="7" fill="${col}" fill-opacity=".18" stroke="${col}" stroke-width="1.6"/><circle cx="${xa + 9}" cy="${y + 16}" r="4.5" fill="${col}"/>`; }
      return s; };
    g += row(TP.m, 26, ink) + row(TP.n, 92, red);
    g += `<line id="tpHead" x1="${x0}" x2="${x0}" y1="14" y2="144" stroke="${red}" stroke-width="2.5" opacity="0"/>`;
    const lbl = `Timeline: ${TP.m} regular notes on top and ${TP.n} tuplet notes below, taking the same total time; they start together, and a grid of ${lcm} equal steps shows where each note falls.`;
    return `<p class="tplegend"><span class="tpk reg"></span>${TP.m} regular note${TP.m > 1 ? "s" : ""} (top) <span class="tpk tup"></span>${TP.n} tuplet notes (bottom)</p><svg viewBox="0 0 ${W} 156" role="img" aria-label="${lbl}" style="width:100%;max-width:${W}px;display:block;margin:0 auto">${g}</svg>`;
  }
  const tpInfo = () => { const f = TP.m / TP.n, lcm = TP.n * TP.m / gcd(TP.n, TP.m), fr = (a, b) => { const d = gcd(a, b); return `${a / d}/${b / d}`; };
    return `<b>${TP.n} in the time of ${TP.m}.</b> Each tuplet note lasts ${fr(TP.m, TP.n)} of a regular note (${f > 1 ? "longer" : "shorter"}). Counted on a grid of ${lcm}, the regular notes fall every ${lcm / TP.m} steps and the tuplet notes every ${lcm / TP.n}${gcd(TP.n, TP.m) > 1 ? "" : "; they only line up at the start"}.`; };
  function tupletToy() {
    const opt = (id, v, lo, hi) => `<select id="${id}">${Array.from({ length: hi - lo + 1 }, (_, i) => i + lo).map(x => `<option ${x === v ? "selected" : ""}>${x}</option>`).join("")}</select>`;
    return `<div class="toy" id="tpToy">
      <div class="toy-row" role="group" aria-label="Presets">${TP_PRE.map(([n, m, l]) => `<button class="play" data-tpp="${n},${m}" aria-pressed="${n === TP.n && m === TP.m}">${l.split(":")[0]}</button>`).join("")}</div>
      <div class="toy-row"><label>Play ${opt("tpN", TP.n, 2, 9)} notes</label><label>in the time of ${opt("tpM", TP.m, 1, 8)} regular notes</label></div>
      <div id="tpFig">${tpSVG()}</div>
      <p class="lnote" id="tpInfo" aria-live="polite" style="margin:0">${tpInfo()}</p>
      <div class="toy-row"><button class="play" id="tpGo" aria-pressed="false">▶ Play (loops)</button>
        <label><input type="checkbox" id="tpHM" ${TP.hearM ? "checked" : ""}> Hear regular notes (low)</label><label><input type="checkbox" id="tpHN" ${TP.hearN ? "checked" : ""}> Hear tuplet (high)</label></div>
      <label class="syk" style="max-width:420px">Speed<input type="range" id="tpRate" min="30" max="120" step="1" value="${TP.rate}"><output id="tpRateO">${TP.rate}</output></label>
      <p class="small" style="margin:0">Speed is in regular notes per minute. Listen to each layer alone, then together: the tuplet keeps its own even pulse while the regular notes keep theirs, and both start together at the top of each cycle.</p></div>`;
  }
  function tpSchedule() {
    const look = AC.currentTime + .12, cyc = 60 / TP.rate * TP.m;
    while (TP.next < look) {
      const t = TP.next;
      if (TP.hearM) for (let i = 0; i < TP.m; i++) snd(t + cyc * i / TP.m, "lo", i ? .7 : 1);
      if (TP.hearN) for (let i = 0; i < TP.n; i++) snd(t + cyc * i / TP.n, "hi", i ? .6 : .85);
      TP.next += cyc;
    }
  }
  function tpDraw() {
    const head = document.getElementById("tpHead"); if (!head || !TP.on) { TP.raf = 0; if (head) head.setAttribute("opacity", "0"); document.querySelectorAll(".tpb").forEach(r => r.setAttribute("fill-opacity", ".18")); return; }
    const cyc = 60 / TP.rate * TP.m, ph = (((AC.currentTime - TP.t0) % cyc) + cyc) % cyc / cyc, x0 = 14, L = 620 - x0 - 14;
    head.setAttribute("x1", x0 + L * ph); head.setAttribute("x2", x0 + L * ph); head.setAttribute("opacity", AC.currentTime >= TP.t0 ? "1" : "0");
    document.querySelectorAll(".tpb").forEach(r => { const k = r.dataset.tpr[0] === "m" ? TP.m : TP.n, i = +r.dataset.tpr.slice(1); r.setAttribute("fill-opacity", Math.floor(ph * k) === i ? ".55" : ".18"); });
    TP.raf = requestAnimationFrame(tpDraw);
  }
  function tpStart() { if (!ac()) return; TP.on = true; TP.t0 = TP.next = AC.currentTime + .08; tpSchedule(); TP.timer = setInterval(tpSchedule, 25); if (!TP.raf) TP.raf = requestAnimationFrame(tpDraw); tpBtn(); }
  function tpStop() { TP.on = false; clearInterval(TP.timer); TP.timer = 0; tpBtn(); }
  const tpBtn = () => { const b = document.getElementById("tpGo"); if (b) { b.setAttribute("aria-pressed", String(TP.on)); b.textContent = TP.on ? "■ Stop" : "▶ Play (loops)"; } };
  function tpRefresh() { const f = document.getElementById("tpFig"), i = document.getElementById("tpInfo"); if (f) f.innerHTML = tpSVG(); if (i) i.innerHTML = tpInfo();
    document.querySelectorAll("[data-tpp]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.tpp === TP.n + "," + TP.m)));
    const n = document.getElementById("tpN"), m = document.getElementById("tpM"); if (n) n.value = TP.n; if (m) m.value = TP.m;
    if (TP.on) { TP.t0 = TP.next = AC.currentTime + .08; } }

  if (!window.__nvWired) { window.__nvWired = true;
    document.addEventListener("click", e => {
      if (e.target.closest("#mbGo")) { MB.on ? mbStop() : mbStart(); return; }
      const st = e.target.closest("[data-mbstep]"); if (st) { mbSetBpm(MB.bpm + +st.dataset.mbstep); return; }
      if (e.target.closest("#mbTap")) { const now = performance.now(); MB.taps = MB.taps.filter(x => now - x < 2500).concat(now); if (MB.taps.length > 1) { const d = (MB.taps[MB.taps.length - 1] - MB.taps[0]) / (MB.taps.length - 1); mbSetBpm(60000 / d); } return; }
      if (e.target.closest("#tpGo")) { TP.on ? tpStop() : tpStart(); return; }
      const pp = e.target.closest("[data-tpp]"); if (pp) { [TP.n, TP.m] = pp.dataset.tpp.split(",").map(Number); tpRefresh(); }
    });
    document.addEventListener("input", e => {
      const k = e.target.dataset && e.target.dataset.mb; if (k) { MB[k] = +e.target.value; const o = document.querySelector(`[data-mbo="${k}"]`); if (o) o.textContent = MB[k] + "%"; e.target.setAttribute("aria-valuetext", MB[k] + " percent"); return; }
      if (e.target.id === "mbBpm") { mbSetBpm(+e.target.value, e.target); return; }
      if (e.target.id === "tpRate") { const old = 60 / TP.rate * TP.m, ph = TP.on ? ((AC.currentTime - TP.t0) % old) / old : 0; TP.rate = +e.target.value; document.getElementById("tpRateO").textContent = TP.rate;
        if (TP.on) { TP.t0 = AC.currentTime - ph * 60 / TP.rate * TP.m; TP.next = TP.t0 + 60 / TP.rate * TP.m; } }
    });
    document.addEventListener("change", e => {
      if (e.target.id === "mbBpmN") { mbSetBpm(+e.target.value, e.target); return; }
      if (e.target.id === "mbMeter") { const [, b, c] = MB_METERS[+e.target.value]; MB.beats = b; MB.comp = c; document.getElementById("mbLights").innerHTML = mbLights(); document.getElementById("mbMix").innerHTML = mbSliders(); document.getElementById("mbUnit").textContent = c ? "♩." : "♩"; return; }
      if (e.target.id === "tpN" || e.target.id === "tpM") { TP[e.target.id === "tpN" ? "n" : "m"] = +e.target.value; tpRefresh(); return; }
      if (e.target.id === "tpHM") TP.hearM = e.target.checked; if (e.target.id === "tpHN") TP.hearN = e.target.checked;
    });
    setInterval(() => { if (MB.on && !document.getElementById("mbToy")) mbStop(); if (TP.on && !document.getElementById("tpToy")) tpStop(); }, 300);
  }

  // ===== Rhythm grid (lesson step after "Counting"): a drum machine. Mode "count": one row of boxes, spoken with Adam's counting syllables
  // (assets/count-voice-Adam/). Mode "beat": eight rows of Adam's beatbox one-shots (assets/audio/beatbox/, round-robin through each sound's
  // takes), one sound per box, notated on a percussion staff (hi-hat F5, snare C5, ooh B4, sweep A4, shaker G4, kick F4, KKhh 2 E4, KKhh 1 D4).
  // Each beat is notated on its own: rests before the first attack, then each attack lasts until the next one or the end of the beat.
  // Audio: its own lookahead scheduler on this file's AudioContext; samples → (beatbox: distortion) → dry + convolution reverb → out.
  const RG = { mode: "count", meter: "4/4", on: {}, bb: {}, bpm: 76, click: true, rev: 15, dist: 0, playing: false, timer: 0, next: 0, step: 0, rr: {}, hl: [] };
  const RG_M = ["2/4", "3/4", "4/4", "5/4", "6/8", "9/8", "12/8"];
  const BB = [["hh", "Hi-hat", "F5", 5], ["sn", "Snare", "C5", 4], ["oo", "Ooh", "B4", 3], ["sw", "Sweep", "A4", 0], ["sh", "Shaker", "G4", 0], ["kk", "Kick", "F4", 4], ["k2", "KKhh 2", "E4", 0], ["k1", "KKhh 1", "D4", 0]];
  const BBF = { hh: "hihat", sn: "snare", oo: "ooh", sw: "sweep", sh: "shaker", kk: "kick", k2: "kkhh-2", k1: "kkhh-1" };
  const bbFiles = r => { const n = BB.find(x => x[0] === r)[3]; return n ? Array.from({ length: n }, (_, i) => `assets/audio/beatbox/${BBF[r]}-${i + 1}.wav`) : [`assets/audio/beatbox/${BBF[r]}.wav`]; };
  const rgInfo = m => { const [n, d] = m.split("/").map(Number), comp = d === 8 && n % 3 === 0; return { comp, beats: comp ? n / 3 : n, per: comp ? 3 : 4, unit: comp ? .5 : .25 }; };
  const rgSyl = (b, j, comp) => j === 0 ? String(b + 1) : comp ? ["and", "a"][j - 1] : ["e", "and", "a"][j - 1];
  const rgShow = s => s === "and" ? "&" : s;
  const rgKey = (b, j) => b + "." + j;
  const rgRows = () => RG.mode === "beat" ? BB.map(x => x[0]) : ["c"];
  const rgIsOn = (r, key) => r === "c" ? !!RG.on[key] : !!(RG.bb[r] && RG.bb[r][key]);
  const rgSet = (r, key, v) => { if (r === "c") RG.on[key] = v; else (RG.bb[r] = RG.bb[r] || {})[key] = v; };
  const rgKeysAt = key => RG.mode === "beat" ? BB.filter(x => rgIsOn(x[0], key)).map(x => x[2]) : (RG.on[key] ? [P] : []);
  function rgBeat(b, I) {
    const on = []; for (let j = 0; j < I.per; j++) if (rgKeysAt(rgKey(b, j)).length) on.push(j);
    const len = I.per * I.unit, D = { .25: "16", .5: "8", .75: "8d", 1: "q", 1.5: "qd" };
    if (!on.length) return [{ k: [], d: I.comp ? "qd" : "q" }];
    const out = [], lead = on[0] * I.unit, R = d => ({ k: [], d });
    if (lead) out.push(...(I.comp ? [R(lead === 1 ? "q" : "8")] : { .25: [R("16")], .5: [R("8")], .75: [R("8"), R("16")] }[lead]));
    on.forEach((j, i) => { const end = i + 1 < on.length ? on[i + 1] * I.unit : len; out.push({ k: rgKeysAt(rgKey(b, j)), d: D[end - j * I.unit] }); });
    return out;
  }
  const rgSpec = () => { const I = rgInfo(RG.meter), notes = []; for (let b = 0; b < I.beats; b++) notes.push(...rgBeat(b, I));
    return { type: "score", clefs: ["percussion"], time: RG.meter, vf: "C", sig: {}, bpm: RG.bpm, final: true, minBar: 300, bars: [{ t: [notes] }] }; };
  const rgRowHTML = (r, lab, I) => `<div class="rg-row">${lab ? `<span class="rg-lab">${lab}</span>` : ""}${Array.from({ length: I.beats }, (_, b) => `<div class="rg-beat">${Array.from({ length: I.per }, (_, j) => { const s = rgSyl(b, j, I.comp), key = rgKey(b, j);
      return `<button type="button" class="rg-b${j === 0 ? " big" : ""}" data-rg="${r}|${key}" aria-pressed="${rgIsOn(r, key)}" aria-label="${lab ? lab + ", " : ""}beat ${b + 1}${j ? ", " + (s === "and" ? "and" : s) : ""}">${rgShow(s)}</button>`; }).join("")}</div>`).join("")}</div>`;
  function rgHTML() {
    const I = rgInfo(RG.meter), beat = RG.mode === "beat";
    return `<div class="toy rg" id="rgToy">
      <div class="toy-row"><div class="toy-row" role="group" aria-label="Sound"><button class="play" data-rgmode="count" aria-pressed="${!beat}">Counting</button><button class="play" data-rgmode="beat" aria-pressed="${beat}">Beatbox</button></div>
        <label>Meter <select id="rgM">${RG_M.map(m => `<option ${m === RG.meter ? "selected" : ""}>${m}</option>`).join("")}</select></label></div>
      <div class="toy-row" role="group" aria-label="Patterns">${beat ? `<button class="play" data-rgp="groove">Basic groove</button>` : `<button class="play" data-rgp="beats">Beats only</button><button class="play" data-rgp="all">Every box</button>`}<button class="play" data-rgp="rand">Surprise me</button><button class="play" data-rgp="clear">Clear</button></div>
      <div class="staff rg-staff" id="rgStaff" aria-hidden="true"></div>
      <p class="sr" id="rgSay" aria-live="polite"></p>
      <div class="rg-wrap" tabindex="0" role="region" aria-label="Rhythm grid"><div class="rg-grid${beat ? " bb" : ""}" role="group" aria-label="One box per ${I.comp ? "eighth note" : "sixteenth note"}; turn boxes on to make the rhythm">${beat ? BB.map(x => rgRowHTML(x[0], x[1], I)).join("") : rgRowHTML("c", "", I)}</div></div>
      <div class="toy-row"><button class="play" id="rgGo" aria-pressed="${RG.playing}">${RG.playing ? "■ Stop" : "▶ Play (loops)"}</button>
        <label><input type="checkbox" id="rgClick" ${RG.click ? "checked" : ""}> Click on the beat</label>
        <label>Tempo <input type="range" id="rgBpm" min="40" max="140" step="1" value="${RG.bpm}"><output id="rgBpmO">${RG.bpm}</output></label></div>
      <div class="toy-row"><label>Reverb <input type="range" id="rgRev" min="0" max="100" step="1" value="${RG.rev}"><output id="rgRevO">${RG.rev}</output></label>
        ${beat ? `<label>Distortion <input type="range" id="rgDist" min="0" max="100" step="1" value="${RG.dist}"><output id="rgDistO">${RG.dist}</output></label>` : ""}</div>
      <p class="small" style="margin:0">Each box is one ${I.comp ? "eighth note (beats divide in three: 1 &amp; a)" : "sixteenth note (beats divide in four: 1 e &amp; a)"}. A note lasts until the next box that's on, or the end of its beat; empty boxes at the start of a beat are rests.${beat ? " Each sound sits on its own line or space of the staff, and each box holds one sound: turning on a new sound in a box replaces the old one." : ""}</p></div>`;
  }
  // ---------- audio ----------
  const RGB = {};   // url → AudioBuffer (with ._lv), null if it failed
  const rgLevel = buf => { const d = buf.getChannelData(0); let ss = 0, n = 0, pk = 0; for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > pk) pk = a; if (a > .01) { ss += a * a; n++; } }
    const rms = n ? Math.sqrt(ss / n) : .1; return Math.min(.12 / Math.max(rms, 1e-4), .95 / Math.max(pk, 1e-4)); };
  const rgLoad = urls => Promise.all(urls.filter(u => !(u in RGB)).map(u => fetch(u).then(r => { if (!r.ok) throw 0; return r.arrayBuffer(); })
    .then(b => new Promise((res, rej) => AC.decodeAudioData(b, res, rej))).then(buf => { buf._lv = rgLevel(buf); RGB[u] = buf; }).catch(() => { RGB[u] = null; })));
  let FX = null;
  function rgFX() {
    if (FX) return FX;
    const out = AC.createGain(), dry = AC.createGain(), wet = AC.createGain(), cv = AC.createConvolver(), bb = AC.createGain(), ws = AC.createWaveShaper(), post = AC.createGain(), voice = AC.createGain();
    const L = AC.sampleRate * 2.2, ir = AC.createBuffer(2, L, AC.sampleRate); for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < L; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / L, 3); }
    cv.buffer = ir; bb.connect(ws); ws.connect(post); post.connect(out); voice.connect(out); out.connect(dry); out.connect(cv); cv.connect(wet); dry.connect(AC.destination); wet.connect(AC.destination);
    FX = { out, dry, wet, ws, post, bb, voice }; rgMix(); return FX;
  }
  function rgMix() {
    if (!FX) return; const t = AC.currentTime, r = RG.rev / 100, k = RG.dist / 100 * 60;
    FX.wet.gain.setTargetAtTime(r * .7, t, .03); FX.dry.gain.setTargetAtTime(1 - r * .35, t, .03);
    const c = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; c[i] = k ? (1 + k) * x / (1 + k * Math.abs(x)) : x; }
    FX.ws.curve = c; FX.post.gain.setTargetAtTime(k ? 1 / (1 + k * .06) : 1, t, .03);
  }
  function rgSample(url, t, vol, dest, stopAt) { const buf = RGB[url]; if (!buf) return;
    const s = AC.createBufferSource(), g = AC.createGain(), lv = (buf._lv || 1) * vol; s.buffer = buf; g.gain.setValueAtTime(lv, t);
    if (stopAt) { g.gain.setValueAtTime(lv, Math.max(t, stopAt - .02)); g.gain.linearRampToValueAtTime(0, stopAt); }
    s.connect(g); g.connect(dest); s.start(t); if (stopAt) s.stop(stopAt + .01); }
  function rgSchedule() {
    const I = rgInfo(RG.meter), n = I.beats * I.per, dt = 60 / RG.bpm / I.per, look = AC.currentTime + .12;
    while (RG.next < look) {
      const i = RG.step % n, b = Math.floor(i / I.per), j = i % I.per, key = rgKey(b, j), t = RG.next;
      if (RG.click && j === 0) snd(t, b ? "click" : "hi", b ? .45 : .6);
      if (RG.mode === "beat") BB.forEach(([r]) => { if (rgIsOn(r, key)) { const f = bbFiles(r), k2 = RG.rr[r] = ((RG.rr[r] || 0) + 1) % f.length; rgSample(f[k2], t, .9, FX.bb); } });
      else if (RG.on[key]) { let m = 1; while (m < n && !RG.on[rgKey(Math.floor(((i + m) % n) / I.per), (i + m) % n % I.per)]) m++;
        rgSample(`assets/count-voice-Adam/${rgSyl(b, j, I.comp)}.wav`, t, j ? .85 : 1, FX.voice, t + m * dt); }
      RG.hl.push(setTimeout(() => { document.querySelectorAll(".rg-b.now").forEach(x => x.classList.remove("now")); document.querySelectorAll(`[data-rg$="|${key}"]`).forEach(x => x.classList.add("now")); }, Math.max(0, (t - AC.currentTime) * 1000)));
      if (RG.hl.length > 64) RG.hl.splice(0, 32);
      RG.next += dt; RG.step++;
    }
  }
  function rgStop() { RG.playing = false; clearInterval(RG.timer); RG.timer = 0; RG.hl.forEach(clearTimeout); RG.hl = []; document.querySelectorAll(".rg-b.now").forEach(x => x.classList.remove("now"));
    const g = document.getElementById("rgGo"); if (g) { g.setAttribute("aria-pressed", "false"); g.textContent = "▶ Play (loops)"; } }
  function rgStart() {
    if (!ac()) return; rgFX(); RG.playing = true;
    const g = document.getElementById("rgGo"); if (g) { g.setAttribute("aria-pressed", "true"); g.textContent = "■ Stop"; }
    const urls = RG.mode === "beat" ? BB.flatMap(x => bbFiles(x[0])) : ["1", "2", "3", "4", "5", "e", "and", "a"].map(s => `assets/count-voice-Adam/${s}.wav`);
    rgLoad(urls).then(() => { if (!RG.playing) return; RG.next = AC.currentTime + .08; RG.step = 0; rgSchedule(); RG.timer = setInterval(() => { if (!document.getElementById("rgToy")) { rgStop(); return; } rgSchedule(); }, 25); });
  }
  function rgWire(root) {
    const toy = root.querySelector("#rgToy"); if (!toy) return;
    const draw = () => { const st = toy.querySelector("#rgStaff"); RGdraw(st, rgSpec());
      const I = rgInfo(RG.meter), words = []; for (let b = 0; b < I.beats; b++) for (let j = 0; j < I.per; j++) { const ks = rgKeysAt(rgKey(b, j)); if (ks.length) words.push(RG.mode === "beat" ? BB.filter(x => ks.includes(x[2])).map(x => x[1]).join("+") : rgShow(rgSyl(b, j, I.comp))); }
      toy.querySelector("#rgSay").textContent = words.length ? "Pattern: " + words.join(", ") : "No boxes on: a bar of rests."; };
    const rebuild = () => { toy.outerHTML = rgHTML(); rgWire(root); };
    toy.addEventListener("click", e => {
      const b = e.target.closest("[data-rg]");
      if (b) { const [r, key] = b.dataset.rg.split("|"), v = !rgIsOn(r, key);
        if (v && r !== "c") BB.forEach(([o]) => { if (o !== r && rgIsOn(o, key)) { rgSet(o, key, false); const x = toy.querySelector(`[data-rg="${o}|${key}"]`); if (x) x.setAttribute("aria-pressed", "false"); } });   // one sound per box
        rgSet(r, key, v); b.setAttribute("aria-pressed", String(v)); draw(); return; }
      const m = e.target.closest("[data-rgmode]"); if (m) { if (RG.mode !== m.dataset.rgmode) { RG.mode = m.dataset.rgmode; const was = RG.playing; if (was) rgStop(); rebuild(); if (was) rgStart(); } return; }
      const p = e.target.closest("[data-rgp]");
      if (p) { const I = rgInfo(RG.meter), v = p.dataset.rgp;
        if (RG.mode === "beat") { RG.bb = {};
          for (let bb = 0; bb < I.beats; bb++) for (let j = 0; j < I.per; j++) { const key = rgKey(bb, j);
            if (v === "groove") { if (j === 0) rgSet(bb % 2 ? "sn" : "kk", key, true); else if (I.comp || j === 2) rgSet("hh", key, true); }
            if (v === "rand") { const x = Math.random(), r = j === 0 ? (x < .45 ? "kk" : x < .75 ? "sn" : x < .9 ? "hh" : "") : (x < .35 ? "hh" : x < .45 ? "kk" : x < .52 ? "sn" : x < .6 ? "sh" : x < .66 ? "k1" : x < .72 ? "k2" : x < .76 ? "oo" : ""); if (r) rgSet(r, key, true); } } }
        else { RG.on = {}; for (let bb = 0; bb < I.beats; bb++) for (let j = 0; j < I.per; j++) { const on = v === "all" || (v === "beats" && j === 0) || (v === "rand" && (j === 0 ? Math.random() < .75 : Math.random() < .4)); if (on) RG.on[rgKey(bb, j)] = true; } }
        toy.querySelectorAll("[data-rg]").forEach(x => { const [r, key] = x.dataset.rg.split("|"); x.setAttribute("aria-pressed", String(rgIsOn(r, key))); }); draw(); return; }
      if (e.target.closest("#rgGo")) RG.playing ? rgStop() : rgStart();
    });
    toy.querySelector("#rgM").onchange = e => { RG.meter = e.target.value; const I = rgInfo(RG.meter); RG.on = {}; RG.bb = {}; for (let b = 0; b < I.beats; b++) RG.on[rgKey(b, 0)] = true; rebuild(); };
    toy.querySelector("#rgClick").onchange = e => { RG.click = e.target.checked; };
    toy.querySelector("#rgBpm").oninput = e => { RG.bpm = +e.target.value; toy.querySelector("#rgBpmO").textContent = RG.bpm; };
    toy.querySelector("#rgRev").oninput = e => { RG.rev = +e.target.value; toy.querySelector("#rgRevO").textContent = RG.rev; rgMix(); };
    const d = toy.querySelector("#rgDist"); if (d) d.oninput = e => { RG.dist = +e.target.value; toy.querySelector("#rgDistO").textContent = RG.dist; rgMix(); };
    draw();
  }
  let RGdraw = () => {};
  RG.on = { "0.0": true, "1.0": true, "1.2": true, "2.0": true, "2.1": true, "2.2": true, "2.3": true, "3.0": true };
  RG.bb = { hh: { "0.2": true, "1.2": true, "2.2": true, "3.2": true }, kk: { "0.0": true, "2.0": true, "2.3": true }, sn: { "1.0": true, "3.0": true } };


  const lesson = { steps: [
    { title: "Note values", kick: "Halving and halving again", render: (H, k, U) => `<p>Each note value is half the one before it: one <b>whole note</b> = two <b>halves</b> = four <b>quarters</b> = eight <b>eighths</b> = sixteen <b>sixteenths</b>.</p>`
      + U.fig(rh("4/4", ["w", "h h", "q q q q", "8 8 8 8 8 8 8 8", "16 16 16 16 16 16 16 16 16 16 16 16 16 16 16 16"]), "Each bar of 4/4 holds the same amount of time, divided into smaller and smaller values.", { small: false, play: H.withClick(rh("4/4", ["w", "h h", "q q q q", "8 8 8 8 8 8 8 8", "16 16 16 16 16 16 16 16 16 16 16 16 16 16 16 16"])) })
      + `<div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">American</th><th scope="col">British</th><th scope="col">In 4/4</th></tr></thead><tbody><tr><td>whole note</td><td>semibreve</td><td>4 beats</td></tr><tr><td>half note</td><td>minim</td><td>2</td></tr><tr><td>quarter note</td><td>crotchet</td><td>1</td></tr><tr><td>eighth note</td><td>quaver</td><td>½</td></tr><tr><td>sixteenth note</td><td>semiquaver</td><td>¼</td></tr></tbody></table></div>` },
    { title: "Parts of a note", kick: "Heads, stems, flags, beams", render: () => partsFig() + `<ul><li><b>Notehead</b>: open (whole and half notes) or filled (quarter and shorter).</li><li><b>Stem</b>: every value shorter than a whole note has one. Notes above the middle line take stems <b>down</b> (on the left of the head); below it, <b>up</b> (on the right); on the middle line, usually down.</li><li><b>Flags</b>: one for an eighth, two for a sixteenth, and so on.</li><li><b>Beams</b> replace flags to group notes by beat, so the meter is easy to see.</li></ul>` },
    { title: "Rests", kick: "Measured silence", render: (H, k, U) => {
      const V = [["w", "whole"], ["h", "half"], ["q", "quarter"], ["8", "eighth"], ["16", "sixteenth"]];
      const sp = { type: "score", clefs: ["percussion", "percussion"], ids: ["t", "b"], brace: false, time: null, vf: "C", sig: {}, final: false, minBar: 108, rowW: 780, bars: V.map(([d, n]) => ({ t: [[{ k: [P], d, ly: n + " note", center: true }]], b: [[{ k: [], d, ly: n + " rest", center: true }]] })) };
      return U.fig(sp, "Each rest (below) lasts as long as the note value above it.", { small: false, play: false })
      + `<p>The half rest sits on the 3rd line (“a hat”); the whole rest hangs from the 4th line (“a hole”). The eighth and sixteenth rests have one and two flags, like their notes.</p>
      <p>The whole-rest symbol is also the <b>bar rest</b>: a whole bar of silence in any meter, centered in the bar (see the next step).</p>
      <p>Rests follow the same rule as notes: show the beats. In 4/4, two quarter rests (not a half rest) fill beats 2–3, so the middle of the bar stays visible.</p>`;
    } },
    { title: "Bar lines and bar rests", kick: "Every bar is complete", render: (H, k, U) => {
      // bar rests: drawn as whole rests, but they last exactly one bar (3 beats in 3/4, two dotted-quarter beats in 6/8)
      const bars = rh("3/4", ["q q q", "hdr", "h q"]); Object.assign(bars.bars[1].t[0][0], { barRest: true, center: true });
      const bars2 = rh("6/8", ["qd qd", "hdr", "q 8 qd"]); Object.assign(bars2.bars[1].t[0][0], { barRest: true, center: true });
      return `<ul><li><b>Every bar ends with a bar line</b>, including the last bar on each line (system) of music. The very end of a piece gets a <b>final bar line</b> (thin–thick); a <b>double bar line</b> (two thin lines) marks the end of a section.</li>
        <li>A bar must contain exactly the number of beats the time signature says (except a pick-up and the bar that balances it).</li>
        <li>A <b>bar rest</b> (the whole-rest symbol) means “rest for the whole bar” in <b>any</b> meter, even 3/4 or 6/8, where a whole note wouldn't fit. It's <b>centered</b> in the bar, not placed on beat 1.</li>
        <li>Several silent bars in a part become a <b>multi-bar rest</b>: a thick bar with the number of bars above it.</li></ul>
        <div class="lfigs">${fig(U, bars, "3/4: a centered bar rest fills the middle bar")}${fig(U, bars2, "6/8: the same symbol, still a full bar")}</div>`;
    } },
    { title: "Dots and ties", kick: "Longer values", render: (H, k, U) => `<p>A <b>dot</b> adds half of the note's value: a dotted half = 2 + 1 = 3 beats; a dotted quarter = 1 + ½ = 1½. A <b>second dot</b> adds half of the first dot: a double-dotted half = 2 + 1 + ½ = 3½.</p>
      <div class="lfigs">${fig(U, rh("4/4", ["hd q"]), "Dotted half + quarter")}${fig(U, rh("4/4", ["h~ q q"]), "The same rhythm with a tie")}${fig(U, rh("4/4", ["qd 8 qd 8"]), "Dotted quarter + eighth, twice")}${fig(U, rh("4/4", ["hdd 8"]), "Double-dotted half + eighth")}</div>
      <p>A <b>tie</b> joins two notes of the same pitch into one sound. Ties can cross bar lines (dots can't), and they keep the beat visible inside a bar.</p>`
      + H.check("How many beats is a dotted quarter note in 4/4?", "1½", ["1", "2", "1¾"], "1 + ½.") },
    { title: "Meter and the beat", kick: "Simple and compound", render: (H, k, U) => `<p>The top number of a time signature says how many; the bottom number says what kind. In <b>simple meter</b> each beat divides into two; in <b>compound meter</b> each beat is dotted and divides into three.</p>
      <div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Meter</th><th scope="col">Kind</th><th scope="col">Beats × beat unit</th></tr></thead><tbody>${METERS.map(m => `<tr><td>${m[0]}</td><td>${m[1]}</td><td>${m[2]} × ${m[3]} note</td></tr>`).join("")}</tbody></table></div>
      <div class="lfigs">${fig(U, rh("3/4", ["8 8 8 8 8 8"]), "3/4: three beats, beamed in twos")}${fig(U, rh("6/8", ["8 8 8 8 8 8"]), "6/8: two beats, beamed in threes")}</div>
      <p>Three levels of pulse:</p>
      <ul><li><b>Beat</b>: the main pulse you tap your foot to (the quarter note in 2/4, 3/4, 4/4; the dotted quarter in 6/8, 9/8, 12/8).</li><li><b>Division</b>: the beat split into its first smaller level: two eighths in simple meter, three eighths in compound meter.</li><li><b>Subdivision</b>: the division split again: sixteenths in both (four per beat in simple meter, six in compound).</li></ul>
      ${fig(U, rh("2/4", ["q q", "8 8 8 8", "16 16 16 16 16 16 16 16"]), "2/4: beat, division, subdivision", { small: false })}${fig(U, rh("6/8", ["qd qd", "8 8 8 8 8 8", "16 16 16 16 16 16 16 16 16 16 16 16"]), "6/8: beat, division, subdivision", { small: false })}`
      + H.check("In 6/8, how many beats are in a bar?", "2", ["6", "3", "8"], "Two dotted-quarter beats.")
      + H.check("In 3/4, the division of the beat is…", "two eighth notes", ["three eighth notes", "four sixteenth notes", "a half note"], "Simple meter: the beat divides in two; the subdivision is four sixteenths.") },
    { title: "Tempo", kick: "How fast the beat goes", render: (H) => `<p><b>Tempo</b> is the speed of the beat, measured in <b>beats per minute</b> (BPM). At 60 BPM each beat lasts one second; at 120 BPM, half a second. Tempo is separate from meter: a 3/4 waltz can be slow or fast, and the time signature doesn't say which.</p>
      <ul><li>A <b>metronome mark</b> such as ♩ = 96 gives the beat unit and its speed. In compound meters the beat is the dotted quarter: ♩. = 60 in 6/8 means one beat per second, with three eighth notes in each.</li>
      <li>The mechanical metronome was patented by Johann Maelzel in 1815; "M.M." in old scores stands for Maelzel's Metronome. The <a href="metronome.html">Metronome</a> app on this site keeps time for practice.</li>
      <li>DAWs, drum machines and sequencers set the tempo in BPM, and their bars-and-beats ruler follows it.</li></ul>
      <h3>Try it: a practice metronome</h3>${metroToy()}
      <div class="ltable-wrap" tabindex="0" role="region" aria-label="Tempo terms"><table class="ltable"><caption>Common tempo terms (approximate; sources and styles differ)</caption><thead><tr><th scope="col">Term</th><th scope="col">Meaning</th><th scope="col">About</th></tr></thead><tbody>
      ${[["Grave, Largo", "very slow, broad", "40–60"], ["Adagio", "slow, at ease", "66–76"], ["Andante", "at a walking pace", "76–108"], ["Moderato", "moderate", "108–120"], ["Allegro", "fast, lively", "120–156"], ["Vivace", "lively and fast", "156–176"], ["Presto", "very fast", "168–200"], ["Prestissimo", "as fast as possible", "200+"]].map(r => `<tr><td><i>${r[0]}</i></td><td>${r[1]}</td><td>${r[2]} BPM</td></tr>`).join("")}</tbody></table></div>
      <p><b>Changing tempo:</b> <i>accelerando</i> (accel.) speeds up; <i>ritardando</i> (rit.) and <i>rallentando</i> (rall.) slow down; <i>a tempo</i> returns to the previous tempo; <i>rubato</i> means flexible, expressive timing; a <b>fermata</b> (𝄐) holds a note or rest longer than written.</p>`
      + H.check("At 120 BPM, how long does each beat last?", "half a second", ["one second", "two seconds", "a quarter of a second"], "60 seconds ÷ 120 beats = 0.5 seconds per beat.")
      + H.check("Which tempo term means 'at a walking pace'?", "Andante", ["Allegro", "Presto", "Largo"], "From the Italian andare, to walk.") },
    { title: "Triplets and tuplets", kick: "Three in the time of two", render: (H, k, U) => {
      const dup = rh("6/8", ["8t1 8t1 8 8 8"]); dup.bars[0].t[0].forEach((n, i) => { if (i < 2) { n.tun = 2; n.tuo = 3; } });
      const q5 = rh("4/4", ["16t1 16t1 16t1 16t1 16t1 q h"]); q5.bars[0].t[0].forEach((n, i) => { if (i < 5) { n.tun = 5; n.tuo = 4; } });
      return `<p>A <b>tuplet</b> fits a different number of notes into a beat (or group of beats) than the meter normally allows. The number over the bracket tells how many.</p>
      <ul><li><b>Triplet</b>: three in the time of two. Eighth-note triplets fill one quarter beat; quarter-note triplets fill two beats.</li><li><b>Duplet</b>: two in the time of three, in compound meter (two eighths in one dotted-quarter beat).</li><li>Other tuplets work the same way: a <b>quintuplet</b> puts five sixteenths in the time of four.</li></ul>
      <div class="lfigs">${fig(U, rh("4/4", ["8t1 8t1 8t1 8t2 8t2 8t2 q q"]), "Eighth-note triplets: three per beat")}${fig(U, rh("4/4", ["qt1 qt1 qt1 h"]), "Quarter-note triplet: three in two beats")}${fig(U, dup, "Duplet in 6/8: two in one beat")}${fig(U, q5, "Quintuplet: five sixteenths in one beat")}</div>`
        + `<h3>Try it: tuplets on a timeline</h3>${tupletToy()}`
        + H.check("In 4/4, a quarter-note triplet lasts…", "2 beats", ["1 beat", "3 beats", "1½ beats"], "Three triplet quarters in the time of two quarters.");
    } },
    { title: "Counting", kick: "Saying the rhythm", render: (H, k, U) => `<ul><li><b>Simple meter:</b> beats “1 2 3 4”; eighths “1 &amp; 2 &amp;”; sixteenths “1 e &amp; a”.</li><li><b>Compound meter:</b> beats “1 2” in 6/8, each dividing “1 &amp; a”.</li><li><b>Triplets:</b> “1 &amp; a 2 &amp; a”, like a beat of compound meter.</li></ul><p>Press <b>Play with counting</b> to hear each rhythm counted aloud over the click.</p>`
      + `<div class="lfigs">${fig(U, rh("4/4", ["16 16 16 16 8 8 q q"], { bpm: 72 }), "1 e &amp; a, 2 &amp;, 3, 4", { count: true })}${fig(U, rh("6/8", ["8 8 8 qd"]), "1 &amp; a, 2", { count: true })}${fig(U, rh("4/4", ["8t1 8t1 8t1 8t2 8t2 8t2 q q"], { bpm: 72 }), "1 &amp; a, 2 &amp; a, 3, 4", { count: true })}</div>` },
    { title: "Rhythm grid", kick: "Build a rhythm, hear it counted", render: () => `<p>Turn boxes on to build a rhythm, like a drum machine. Press <b>Play</b> to hear it counted aloud, one syllable for each box that's on (or switch to <b>Beatbox</b> and build a groove from beatbox sounds), and watch the notation above the grid change as you go: every beat is written as a quarter note, a rest, or the subdivision that matches its boxes.</p>${rgHTML()}`, after: (root, H, k, tools) => { RGdraw = tools.drawStaff; rgWire(root); } },
    { title: "Lining up rhythm", kick: "Vertical alignment", render: (H, k, U) => {
      const sp = { type: "score", clefs: ["treble", "bass"], time: "4/4", vf: "C", sig: {}, bpm: 84, minBar: 320, bars: [{ t: [[{ k: ["E5"], d: "q" }, { k: ["D5"], d: "8" }, { k: ["C5"], d: "8" }, { k: ["B4"], d: "h" }]], b: [[{ k: ["C3"], d: "h" }, { k: ["G2"], d: "8" }, { k: ["A2"], d: "8" }, { k: ["B2"], d: "8" }, { k: ["G2"], d: "8" }]] }] };
      return `<ul><li>Notes and rests that happen at the same moment line up <b>vertically</b>, across every staff of a system.</li><li>Horizontal space follows time: longer values get more room (though not strictly in proportion), so the beat is easy to see.</li><li>Beam by beat, and don't hide the middle of a 4/4 bar (see the Rhythm Notation lesson for more).</li></ul>`
        + U.fig(sp, "Beat 3 lines up in both staves, even though the hands have different rhythms.");
    } },
    { title: "Quick check", kick: "Before the drills", render: (H) => H.check("How many sixteenth notes equal a dotted quarter?", "6", ["4", "3", "8"], "1½ beats = 6 sixteenths.") + H.check(FACTS[7][0], FACTS[7][1], FACTS[7][2], FACTS[7][3]) + H.check(FACTS[5][0], FACTS[5][1], FACTS[5][2], FACTS[5][3]) + H.check(FACTS[10][0], FACTS[10][1], FACTS[10][2], FACTS[10][3]) },
  ] };

  return {
    key: "silverapps-notevalues-v1", lesson, make, reference, widgets,
    modes: [{ id: "value", kicker: "Note values" }, { id: "math", kicker: "Value math" }, { id: "complete", kicker: "Complete the bar" }, { id: "tuplet", kicker: "Tuplets" }, { id: "meter", kicker: "Meter" }, { id: "terms", kicker: "Terms and principles" }],
    topics: [],
  };
})();
