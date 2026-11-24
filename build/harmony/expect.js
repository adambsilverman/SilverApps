window.FAM = (() => {
  // ===== Musical expectation: how listeners predict what comes next (pulse, rhythmic patterns, key, melodic tendencies,
  // sequences, phrase lengths), with "rhyme" as the running analogy. Every example is original or generated. =====
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const tbl = (cap, head, rows) => `<div class="ltable-wrap" tabindex="0" role="region" aria-label="${cap}"><table class="ltable"><caption>${cap}</caption><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => i ? `<td>${c}</td>` : `<th scope="row">${c}</th>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  const sc = (bars, o = {}) => Object.assign({ type: "score", clefs: ["treble"], time: "4/4", vf: "C", sig: {}, bpm: 96, minBar: 170, bars: bars.map(b => ({ t: [b] })) }, o);
  const n = (k, d, x = {}) => Object.assign({ k: k ? [k] : [], d }, x);
  const seq = (s, d = "q") => s.split(" ").map(t => t === "r" ? n(null, d) : n(t, d));
  const HC = () => window.__harm && window.__harm.H;

  // ---------- the expectation model (used by the game and the drills) ----------
  // Probe-tone profiles (Krumhansl & Kessler 1982): how well each of the 12 pitch classes "fits" after a key is set up, tonic = 0.
  const KK = { major: [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88], minor: [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17] };
  // weights for every candidate next pitch, after Narmour's implication-realization model as simplified by Schellenberg (proximity, reversal),
  // Huron's melodic tendencies (step inertia, step declination, regression after a leap), the tonal hierarchy, and pattern continuation.
  function model(ctx, T, mode, implied) {
    const last = ctx[ctx.length - 1], prev = ctx[ctx.length - 2], L = prev == null ? 0 : last - prev, out = [];
    for (let c = Math.max(52, last - 12); c <= Math.min(88, last + 12); c++) {
      const d = c - last, r = [], pcRel = ((c - T) % 12 + 12) % 12;
      let w = Math.exp(-Math.abs(d) / 3); if (Math.abs(d) <= 2 && d) r.push("a small step (pitch proximity)");
      if (d === 0) w *= .45;
      const kk = KK[mode][pcRel]; w *= (kk * kk) / 40; if (pcRel === 0) r.push("the tonic, the most stable note in the key"); else if (pcRel === 7) r.push("the 5th of the key, very stable");
      if (Math.abs(L) >= 5 && d) { if (Math.sign(d) === -Math.sign(L)) { w *= 2.2; r.push("it turns back after a leap (gap fill)"); } else w *= .4; }
      else if (Math.abs(L) >= 1 && Math.abs(L) <= 2 && Math.sign(d) === Math.sign(L) && Math.abs(d) <= 2) { w *= 1.35; r.push("it keeps going the same way (step inertia)"); }
      if (d < 0 && d >= -2) w *= 1.1;
      const lastRel = ((last - T) % 12 + 12) % 12;
      if (lastRel === 11 && d === 1) { w *= 2.6; r.push("the leading tone pulls up to the tonic"); }
      if (lastRel === 5 && pcRel === 4 && d < 0 && d >= -2) { w *= 1.4; r.push("scale degree 4 tends to fall to 3"); }
      if (implied != null && c === implied) { w *= 8; r.push("it continues the pattern"); }
      out.push({ m: c, w, r });
    }
    const sum = out.reduce((s, x) => s + x.w, 0); out.forEach(x => x.p = x.w / sum);
    return out.sort((a, b) => b.p - a.p);
  }
  // keys for the game: tonic as a note, octave chosen so the tunes sit around the treble staff
  const GKEYS = [["C", "major"], ["G", "major"], ["F", "major"], ["D", "major"], ["B♭", "major"], ["A", "minor"], ["E", "minor"], ["D", "minor"]];
  function gkey(H, name, mode) { const k = H.key(name, mode), o = k.tonic.l >= 4 ? 3 : 4; const sh = o - k.tonic.o; k.scale = k.scale.map(s => ({ l: s.l, a: s.a, o: s.o + sh })); k.tonic = Object.assign({}, k.tonic, { o }); return k; }
  const at = (k, di) => { const s = k.scale[((di % 7) + 7) % 7]; return { l: s.l, a: s.a, o: s.o + Math.floor(di / 7) }; };
  // name a MIDI pitch in a key: its scale spelling if it's in the scale, otherwise the raised 7th (minor) or a sharp/flat that matches the key
  function spellIn(H, k, m) {
    for (let di = -14; di <= 21; di++) { const x = at(k, di); if (H.midi(x) === m) return x; }
    if (k.mode === "minor") for (const i of [5, 6]) for (let o = -2; o <= 3; o++) { const x = at(k, i + 7 * o); const y = { l: x.l, a: x.a + 1, o: x.o }; if (H.midi(y) === m) return y; }
    const flat = Object.values(k.sig).some(a => a < 0), pcs = [0, 2, 4, 5, 7, 9, 11], o = Math.floor(m / 12) - 1, p = m % 12;
    if (pcs.includes(p)) return { l: pcs.indexOf(p), a: 0, o };
    if (flat) { const l = pcs.indexOf(p + 1); if (l >= 0) return { l, a: -1, o: p + 1 === 12 ? o + 1 : o }; }
    const l = pcs.indexOf(p - 1); return l >= 0 ? { l, a: 1, o } : { l: pcs.indexOf(p), a: 0, o };
  }
  // the game's situations, written in scale steps from the tonic (0); "next" is the continuation the pattern or the tendencies point to
  const SITS = [
    { id: "run", label: "a scale climbing toward the tonic", steps: () => [2, 3, 4, 5, 6], rhythm: "q q q q h", implied: null },
    { id: "close", label: "a phrase ending", steps: () => [4, 4, 3, 2, 3, 1], rhythm: "q q q q q q", implied: null },
    { id: "leap", label: "a leap up", steps: () => [0, 1, 2, 0, 5], rhythm: "q q q q h", implied: null },
    { id: "seq", label: "a falling sequence", steps: () => [3, 5, 4, 2, 4, 3, 1, 3], rhythm: "q q h q q h q q", implied: 2 },
    { id: "rep", label: "a repeated figure", steps: () => [0, 4, 2, 0, 4, 2, 0, 4], rhythm: "q q h q q h q q", implied: 2 },
    { id: "arch", label: "a melody at its high point", steps: () => [0, 2, 4, 7, 6], rhythm: "q q q q h", implied: null },
  ];
  function makeRound(H, sit) {
    const [name, mode] = H.rnd(GKEYS), k = gkey(H, name, mode), S = sit || H.rnd(SITS), st = S.steps();
    const notes = st.map(d => at(k, d)), ctx = notes.map(H.midi), T = H.midi(k.tonic);
    const implied = S.implied != null ? H.midi(at(k, S.implied)) : null;
    // minor keys: a climb to the tonic uses the raised 7th (the leading tone)
    if (mode === "minor" && S.id === "run") { const i = notes.length - 1; notes[i] = Object.assign({}, notes[i], { a: notes[i].a + 1 }); ctx[i] += 1; }
    return { k, S, notes, ctx, T, mode, implied, rank: model(ctx, T, mode, implied) };
  }
  // the context as notation: durations from the situation's rhythm, bars of 4/4 (the last note ends where the question begins)
  function roundSpec(H, R, extra) {
    const durs = R.S.rhythm.split(" "), ev = R.notes.map((x, i) => [H.nmO(x), durs[i] || "q"]); if (extra) ev.push([H.nmO(extra), "q", true]);
    const len = { q: 1, h: 2, w: 4, "8": .5 }, bars = [[]]; let t = 0;
    ev.forEach(([k, d, hi]) => { if (t >= 4) { bars.push([]); t = 0; } bars[bars.length - 1].push(n(k, d)); t += len[d]; });
    const fill = 4 - t; if (fill > 0) bars[bars.length - 1].push(...(fill >= 2 ? [n(null, "h")] : []).concat(fill % 2 ? [n(null, "q")] : []));
    return sc(bars, { vf: R.k.vf, sig: R.k.sig, bpm: 88 });
  }
  const pNm = (H, R, m) => H.nm(spellIn(H, R.k, m)) + (Math.floor(m / 12) - 1);

  // ---------- the game: hear a tune, guess the next pitch ----------
  const G = { R: null, pick: null, score: 0, rounds: 0, done: false, sit: "any" };
  function gameHTML() {
    const H = HC(); if (!H) return "";
    if (!G.R) G.R = makeRound(H, G.sit === "any" ? null : SITS.find(s => s.id === G.sit));
    const R = G.R, last = R.ctx[R.ctx.length - 1], lo = last - 7, hi = last + 7, keys = [];
    for (let m = lo; m <= hi; m++) keys.push(m);
    const whites = keys.filter(m => [0, 2, 4, 5, 7, 9, 11].includes(m % 12)), W = 100 / whites.length;
    const kcls = m => (G.pick === m ? " pick" : "") + (G.done && R.rank[0].m === m ? " best" : "");
    const kb = whites.map(m => `<button type="button" class="eg-w${kcls(m)}" data-egk="${m}" aria-label="${esc(pNm(H, R, m))}"${G.done ? " disabled" : ""}>${m % 12 === 0 ? "C" + (Math.floor(m / 12) - 1) : ""}</button>`).join("")
      + keys.filter(m => !whites.includes(m)).map(m => { const i = whites.findIndex(w => w > m); return `<button type="button" class="eg-b${kcls(m)}" data-egk="${m}" aria-label="${esc(pNm(H, R, m))}" style="left:calc(${i * W}% - ${W * .3}%);width:${W * .6}%"${G.done ? " disabled" : ""}></button>`; }).join("");
    let res = "";
    if (G.done) {
      const ri = R.rank.findIndex(x => x.m === G.pick), pts = ri === 0 ? 3 : ri === 1 ? 2 : ri === 2 ? 1 : 0;
      res = `<div class="eg-res"><p><b>${pts ? `${pts} point${pts > 1 ? "s" : ""}.` : "No points this time."}</b> You chose ${esc(pNm(H, R, G.pick))}${ri >= 0 && ri < 12 ? `, the ${["most", "2nd most", "3rd most"][ri] || (ri + 1) + "th most"} expected note` : ""}.</p>
        <ol>${R.rank.slice(0, 3).map(x => `<li><b>${esc(pNm(H, R, x.m))}</b> (${Math.round(x.p * 100)}%): ${x.r.length ? x.r.join("; ") : "possible, but less likely"}.</li>`).join("")}</ol>
        <p class="lnote">Percentages come from the model described in this lesson: real listeners vary, and composers often choose the less likely note on purpose.</p></div>`;
    }
    return `<div class="eg" id="egGame"><div class="toy-row">
      <label>Situation <select id="egSit"><option value="any"${G.sit === "any" ? " selected" : ""}>Any</option>${SITS.map(s => `<option value="${s.id}"${G.sit === s.id ? " selected" : ""}>${s.label[0].toUpperCase() + s.label.slice(1)}</option>`).join("")}</select></label>
      <span class="eg-score" aria-live="polite">Score: <b>${G.score}</b> in ${G.rounds} round${G.rounds === 1 ? "" : "s"}</span></div>
      <p class="lnote">${esc(R.k.label)}: ${esc(R.S.label)}. Listen, then choose the note you expect next on the keyboard.</p>
      <div class="staff wide" id="egStaff" role="img" aria-label="The tune so far, in ${esc(R.k.label)}: ${R.notes.map(x => esc(H.nmSpoken(x))).join(", ")}"></div>
      <div class="toy-row"><button type="button" class="play" data-eg="play">▶ Play the tune</button><button type="button" class="pr-btn" data-eg="try"${G.pick == null || G.done ? " disabled" : ""}>▶ Tune + my note</button>
        <button type="button" class="pr-btn primary" data-eg="guess"${G.pick == null || G.done ? " disabled" : ""}>That's my guess</button>${G.done ? `<button type="button" class="pr-btn" data-eg="best">▶ Tune + most expected</button><button type="button" class="pr-btn primary" data-eg="next">Next round</button>` : ""}</div>
      <div class="eg-kb" role="group" aria-label="Keyboard: choose the next note">${kb}</div>
      <p class="lnote" aria-live="polite">${G.pick != null && !G.done ? `Your note: <b>${esc(pNm(H, R, G.pick))}</b>.` : ""}</p>${res}</div>`;
  }
  function gameDraw() { const H = HC(), el = document.getElementById("egStaff"); if (!H || !el || !G.R) return; el.innerHTML = ""; try { H.drawStaff(el, roundSpec(H, G.R, G.done ? spellIn(H, G.R.k, G.R.rank[0].m) : null)); } catch (e) {} }
  function gameRedraw() { const el = document.getElementById("egGame"); if (!el) return; const f = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.eg || (document.activeElement.dataset.egk && "k" + document.activeElement.dataset.egk) : null; el.outerHTML = gameHTML(); gameDraw(); if (f) { const b = document.querySelector(f[0] === "k" ? `[data-egk="${f.slice(1)}"]` : `[data-eg="${f}"]`); if (b && !b.disabled) b.focus(); } }
  function gamePlay(extra) { const H = HC(), R = G.R; if (!H || !R) return; const len = { q: .62, h: 1.24, w: 2.48, "8": .31 }, durs = R.S.rhythm.split(" "), ev = []; let t = 0;
    R.ctx.forEach((m, i) => { const d = len[durs[i] || "q"]; ev.push([m, t, d * .95, .8]); t += d; }); if (extra != null) ev.push([extra, t + .08, 1.1, .85]); H.play({ ev }); }
  function wireGame() {
    if (window.__egWired) return; window.__egWired = true;
    document.addEventListener("click", e => {
      const k = e.target.closest("[data-egk]"), b = e.target.closest("[data-eg]"); const H = HC(); if (!H) return;
      if (k && !G.done) { G.pick = +k.dataset.egk; H.play({ ev: [[G.pick, 0, .7, .85]] }); gameRedraw(); return; }
      if (!b) return; const a = b.dataset.eg;
      if (a === "play") gamePlay(null);
      else if (a === "try") gamePlay(G.pick);
      else if (a === "best") gamePlay(G.R.rank[0].m);
      else if (a === "guess" && G.pick != null) { const ri = G.R.rank.findIndex(x => x.m === G.pick); G.score += ri === 0 ? 3 : ri === 1 ? 2 : ri === 2 ? 1 : 0; G.rounds++; G.done = true; gameRedraw(); gamePlay(G.R.rank[0].m); }
      else if (a === "next") { G.R = null; G.pick = null; G.done = false; gameRedraw(); }
    });
    document.addEventListener("change", e => { if (e.target.id === "egSit") { G.sit = e.target.value; G.R = null; G.pick = null; G.done = false; gameRedraw(); } });
  }

  // ---------- the pattern maker: a pulse, a repeating cell, and a departure in bar 4 ----------
  const PITCH = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5"];   // row 0 = C4 … row 9 = E5
  const PM = { len: 4, cell: [0, 2, 4, 2], bpm: 96, dep: "keep" };   // cell: row index per eighth, or -1 for a rest
  const DEPS = [["keep", "Keep the pattern going (no departure)"], ["tonic", "End on a long C, the tonic"], ["high", "Jump up high on the downbeat"], ["shift", "Shift everything an eighth late"], ["stop", "Stop: two beats of silence"], ["outside", "Land on F♯, a note outside the key"]];
  function pmSlots() {   // 32 eighths: the cell repeats from beat 1 of bar 1; bar 4 (slots 24–31) gets the departure
    const out = []; for (let i = 0; i < 32; i++) out.push(PM.cell[i % PM.len]);
    const b4 = out.slice(24);
    if (PM.dep === "tonic") { for (let i = 24; i < 32; i++) out[i] = -1; out[24] = 7; out.__long = 24; }
    else if (PM.dep === "high") { const r = out[24] >= 0 ? out[24] : 0; out[24] = Math.min(9, r + 6); }
    else if (PM.dep === "shift") { for (let i = 31; i > 24; i--) out[i] = b4[i - 25]; out[24] = -1; }
    else if (PM.dep === "stop") { for (let i = 28; i < 32; i++) out[i] = -1; }
    else if (PM.dep === "outside") { out[24] = -2; }
    return out;
  }
  const pmName = r => r === -2 ? "F♯4" : PITCH[r];
  function pmSpec() {
    const sl = pmSlots(), bars = [];
    for (let b = 0; b < 4; b++) { const bar = [];
      if (b === 3 && sl.__long === 24) { bars.push([n("C5", "h"), n(null, "h")]); continue; }
      for (let i = 0; i < 8; i++) { const r = sl[b * 8 + i];
        if (r === -1 && i % 2 === 0 && sl[b * 8 + i + 1] === -1) { bar.push(n(null, "q")); i++; continue; }
        bar.push(r === -1 ? n(null, "8") : n(pmName(r), "8")); }
      bars.push(bar); }
    return sc(bars, { bpm: PM.bpm, minBar: 150 });
  }
  function pmAnalyse() {
    const on = PM.cell.map((r, i) => r >= 0 ? i : -1).filter(i => i >= 0), aligned = 8 % PM.len === 0;
    const onBeat = on.filter(i => i % 2 === 0).length, msg = [];
    if (!on.length) return "Put at least one note in the pattern.";
    msg.push(aligned ? `Your ${PM.len}-eighth pattern fits the 4/4 bar evenly, so it lines up with the pulse every time it starts${PM.len < 8 ? ` (${8 / PM.len} times a bar)` : ""}.`
      : `Your ${PM.len}-eighth pattern doesn't divide the bar evenly: it starts in a different place against the beat each time and lines up with the bar line again only every ${PM.len === 3 ? 3 : PM.len === 6 ? 3 : PM.len === 5 ? 5 : PM.len === 7 ? 7 : PM.len} bars. That works against the pulse (a cross-rhythm).`);
    // a note between beats followed by a silent beat is heard as pushed ahead of the beat (a syncopation); over 3 bars of repeats
    const sl = pmSlots().slice(0, 24), push = sl.filter((r, i) => r >= 0 && i % 2 === 1 && sl[i + 1] === -1).length;
    msg.push(push ? `${push} time${push > 1 ? "s" : ""} in bars 1–3, a note between beats is followed by a silent beat, so it's heard as pushed ahead of the beat (a syncopation) and works against the pulse.` : !aligned ? "" : onBeat === on.length ? "All its notes start on beats, so it works with the pulse." : "Its notes between beats are surrounded by notes on the beat, so the pulse stays clear: it works with the pulse.");
    const d = { keep: "Bar 4 keeps the pattern, so the expectation set up in bars 1–3 is simply met. Try a departure.", tonic: "Bar 4 breaks the pattern with a long tonic: a strong close, like the rhyme at the end of a verse.", high: "Bar 4 starts with a big leap: the pattern is there, but its first note jumps out of the expected register.", shift: "Bar 4 moves everything an eighth late: the same notes, now against the beat.", stop: "Bar 4 stops halfway: silence where the pattern was expected, which makes the missing notes almost audible.", outside: "Bar 4 lands on F♯, outside C major: the pattern returns, but on a note the key didn't prepare." }[PM.dep];
    msg.push(d); return msg.filter(Boolean).join(" ");
  }
  function pmHTML() {
    const rows = PITCH.map((p, r) => r).reverse();
    const grid = `<div class="pm-grid" role="group" aria-label="Pattern: ${PM.len} eighth notes; choose a pitch for each, or leave it silent" style="grid-template-columns:4em repeat(${PM.len},minmax(34px,1fr))">`
      + `<div></div>${Array.from({ length: PM.len }, (_, i) => `<div class="pm-h" aria-hidden="true">${i % 2 ? "&amp;" : Math.floor(i / 2) % 4 + 1}</div>`).join("")}`
      + rows.map(r => `<div class="pm-l" aria-hidden="true">${PITCH[r]}</div>` + Array.from({ length: PM.len }, (_, i) => `<button type="button" class="pm-c${PM.cell[i] === r ? " on" : ""}${i % 2 ? "" : " beat"}" data-pmc="${i},${r}" aria-pressed="${PM.cell[i] === r}" aria-label="Eighth ${i + 1}: ${PITCH[r]}"></button>`).join("")).join("") + `</div>`;
    return `<div class="pm" id="pmToy"><div class="toy-row">
      <label>Pattern length <select id="pmLen">${[2, 3, 4, 5, 6, 8].map(x => `<option value="${x}"${PM.len === x ? " selected" : ""}>${x} eighths</option>`).join("")}</select></label>
      <label>Bar 4 <select id="pmDep">${DEPS.map(([v, t]) => `<option value="${v}"${PM.dep === v ? " selected" : ""}>${t}</option>`).join("")}</select></label>
      <label>Pulse <input type="range" id="pmBpm" min="60" max="140" step="4" value="${PM.bpm}"> <span id="pmBpmV">${PM.bpm}</span> beats a minute</label></div>
      ${grid}
      <div class="toy-row"><button type="button" class="play" data-pm="play">▶ Play with the pulse</button><button type="button" class="pr-btn" data-pm="clear">Clear the pattern</button></div>
      <div class="staff wide" id="pmStaff" role="img" aria-label="The four bars in notation"></div>
      <p class="lnote" id="pmOut" aria-live="polite">${esc(pmAnalyse())}</p></div>`;
  }
  function pmDraw() { const H = HC(), el = document.getElementById("pmStaff"); if (!H || !el) return; el.innerHTML = ""; try { H.drawStaff(el, pmSpec()); } catch (e) {} }
  function pmRedraw() { const el = document.getElementById("pmToy"); if (!el) return; const f = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.pmc; el.outerHTML = pmHTML(); pmDraw(); if (f) { const b = document.querySelector(`[data-pmc="${f}"]`); if (b) b.focus(); } }
  function pmPlay() { const H = HC(); if (!H) return; const sp = 60 / PM.bpm / 2, sl = pmSlots(), ev = [];
    for (let b = 0; b < 16; b++) ev.push([0, b * sp * 2, .05, b % 4 ? .45 : .8, b % 4 ? "click" : "clickHi"]);
    sl.forEach((r, i) => { if (r === -1) return; const m = H.midi(H.parse(pmName(r))); ev.push([m, i * sp, sl.__long === i ? sp * 8 : sp * .9, .85]); });
    H.play({ ev }); }
  function wirePm() {
    if (window.__pmWired) return; window.__pmWired = true;
    document.addEventListener("click", e => { const c = e.target.closest("[data-pmc]"), b = e.target.closest("[data-pm]"); const H = HC();
      if (c) { const [i, r] = c.dataset.pmc.split(",").map(Number); PM.cell[i] = PM.cell[i] === r ? -1 : r; if (PM.cell[i] >= 0 && H) H.play({ ev: [[H.midi(H.parse(PITCH[r])), 0, .3, .8]] }); pmRedraw(); return; }
      if (b && b.dataset.pm === "play") pmPlay();
      if (b && b.dataset.pm === "clear") { PM.cell = PM.cell.map(() => -1); pmRedraw(); } });
    document.addEventListener("change", e => {
      if (e.target.id === "pmLen") { const L = +e.target.value; PM.cell = Array.from({ length: L }, (_, i) => PM.cell[i] != null ? PM.cell[i] : -1); PM.len = L; pmRedraw(); }
      if (e.target.id === "pmDep") { PM.dep = e.target.value; pmRedraw(); } });
    document.addEventListener("input", e => { if (e.target.id === "pmBpm") { PM.bpm = +e.target.value; const v = document.getElementById("pmBpmV"); if (v) v.textContent = PM.bpm; } });
  }

  // ---------- lesson figures ----------
  const pulse = sc([seq("C5 C5 C5 C5"), seq("C5 C5 C5 C5"), seq("C5 C5 C5 C5"), [n("C5", "q"), n("C5", "8"), n("C5", "q"), n("C5", "8"), n("C5", "q")]], { bpm: 104 });
  const rhyPat = sc([[n("G4", "q"), n("G4", "8"), n("G4", "8"), n("G4", "h")], [n("A4", "q"), n("A4", "8"), n("A4", "8"), n("A4", "h")], [n("B4", "q"), n("B4", "8"), n("B4", "8"), n("B4", "h")], [n("C5", "w")]], { bpm: 100 });
  const keyAmb = sc([seq("E4 G4 E4 G4"), seq("D4 F4 D4 F4")], { bpm: 100 });
  const keyC = sc([seq("E4 G4 E4 G4"), seq("D4 F4 B3 D4"), [n("C4", "w")]], { bpm: 100 });
  const keyA = sc([seq("E4 G♯4 E4 G♯4"), seq("D4 F4 B3 D4"), [n("A3", "w")]], { bpm: 100 });
  const gapFill = sc([[n("C4", "q"), n("A4", "h"), n("G4", "q")], seq("F4 E4 D4 C4")], { bpm: 96 });
  const steps = sc([seq("E4 F4 G4 A4"), [n("B4", "h"), n("C5", "h")]], { bpm: 96 });
  const seqFig = sc([seq("E5 G5 F5 D5"), seq("F5 E5 C5 E5"), seq("D5 B4 D5 C5"), [n("C5", "w")]], { bpm: 96 });
  const period = sc([seq("E4 F4 G4 E4"), [n("F4", "h"), n("D4", "h")], seq("E4 G4 F4 D4"), [n("D4", "w")], seq("E4 F4 G4 E4"), [n("F4", "h"), n("D4", "h")], seq("E4 G4 D4 B3"), [n("C4", "w")]], { bpm: 108 });
  const deceptive = sc([seq("E4 F4 G4 E4"), [n("F4", "h"), n("D4", "h")], seq("E4 G4 D4 B3"), [n("A3", "w")]], { bpm: 108 });

  const lesson = { steps: [
    { title: "Listening is predicting", kick: "Expectation", render: (H, k, U) => { wireGame(); wirePm(); return `<p>As music unfolds, listeners keep guessing what comes next, mostly without noticing. When a guess comes true, the music feels right and settled; when it's delayed or denied, we feel tension, surprise or delight. The music theorist Leonard Meyer argued in <i>Emotion and Meaning in Music</i> (1956) that much of music's emotional effect comes from exactly this: expectations being set up, delayed and resolved.</p>
      <p>The psychologist David Huron (<i>Sweet Anticipation</i>, 2006) describes five stages: we <b>imagine</b> what might happen, feel <b>tension</b> as the moment approaches, then react to the outcome right away (<b>prediction</b>: was our guess right?), more slowly (<b>reaction</b>), and on reflection (<b>appraisal</b>). A surprise can feel bad in the first instant and good a moment later, once we realize it fits.</p>
      <p>Expectations come from two places. Some are learned from a lifetime of listening to a particular style: the more often a pattern occurs in the music around us, the more we expect it (statistical learning). Others are set up by the piece itself, as it repeats ideas and teaches us its patterns.</p>
      <h3>Music rhymes</h3>
      <p>Poetry and lyrics work the same way. Once a rhyme scheme is set up, you wait for the rhyming sound at the end of the line. A perfect rhyme meets the expectation; a slant rhyme bends it; a line that doesn't rhyme at all stands out. This lesson uses rhyme as a running comparison: music sets up patterns of pulse, rhythm, pitch and phrase length, and then meets them, bends them or breaks them.</p>`
      + H.check("According to Meyer, much of music's emotional effect comes from…", "expectations being set up, delayed and resolved", ["the loudness of the music", "the number of instruments", "the key a piece is in"], "Meyer, Emotion and Meaning in Music (1956)."); } },
    { title: "The pulse", kick: "Expecting the next beat", render: (H, k, U) => `<p>After only a few beats, listeners lock onto a steady <b>pulse</b> and expect the next beat to arrive on time; our attention rises just as each beat is due (the psychologists Edward Large and Mari Riess Jones call this <i>entrainment</i>). Meter adds a second layer: we expect strong beats to come at regular distances, every 2, 3 or 4 beats.</p>
      <p>Because the pulse is so strongly expected, anything that works against it is easy to notice: a note that starts between beats and holds through the next one (a syncopation), a rest where a beat should sound, or an accent in the wrong place.</p>`
      + U.fig(pulse, "Three bars of steady quarter notes set up the pulse; bar 4 pushes two notes off the beat.", { play: H.withClick(pulse) })
      + H.check("Why does a syncopation stand out?", "the listener expects notes to start on the beat", ["it is always louder", "it changes the key", "it is played by a different instrument"], "Syncopation works only because the pulse is expected.") },
    { title: "Rhythmic patterns", kick: "Twice, three times, then change", render: (H, k, U) => `<p>When a rhythm repeats, listeners begin to expect it again. Repetition is one of music's most basic tools: once a pattern has been heard two or three times, we predict a fourth, which gives the composer a choice: meet the expectation, or break it. A very common plan is to state a pattern three times and change it the fourth time, often to end the phrase. (The music theorist Elizabeth Hellmuth Margulis, in <i>On Repeat</i> (2014), shows how repetition makes music feel like music, and how it lets listeners anticipate and take part.)</p>`
      + U.fig(rhyPat, "The same rhythm three times (each a step higher), then a whole note that ends the pattern.", { play: H.withClick(rhyPat) })
      + `<p>Like the third line of a limerick setting up its punch line, the repetitions make the change land.</p>`
      + H.check("A rhythm is heard three times in a row. What do listeners expect next?", "the same rhythm again", ["silence", "a key change", "a slower tempo"], "Repetition creates the expectation of more repetition, which a change can then break.") },
    { title: "Hearing the key", kick: "Which note is home?", render: (H, k, U) => `<p>How do we know what key something is in, just from the sound? Listeners don't hear key signatures; they hear which notes are used, which are emphasized, and how they move. In experiments where listeners rated how well each of the 12 pitches “fits” after a key was set up, the answers formed a stable ranking, now called the <b>tonal hierarchy</b> (Carol Krumhansl and Edward Kessler, 1982): the tonic fits best, then the 5th and 3rd, then the other notes of the scale, and the notes outside the scale least.</p>`
      + tbl("How well each note fits in a major key (Krumhansl and Kessler's ratings, highest first)", ["Note", "Fit", "In C major"], [["Tonic (1)", "6.4", "C"], ["5th (5)", "5.2", "G"], ["3rd (3)", "4.4", "E"], ["4th (4)", "4.1", "F"], ["6th (6)", "3.7", "A"], ["2nd (2)", "3.5", "D"], ["7th (7)", "2.9", "B"], ["Notes outside the scale", "2.2–2.5", "C♯, E♭, F♯, A♭, B♭"]])
      + `<p>Clues listeners use to find the key:</p><ul><li><b>Which notes appear most, and for longest.</b> Melodies spend more time on the tonic, 5th and 3rd. A computer can find the key of a passage surprisingly well just by comparing its note durations with these ratings (the Krumhansl–Schmuckler key-finding method).</li>
      <li><b>Where phrases end.</b> Final and long notes tend to be stable ones, most of all the tonic.</li>
      <li><b>Rare intervals.</b> A major scale has only one tritone (in C major, F–B), and a half step resolving up to a strong note (B–C) points to the tonic. Hearing these narrows down the key quickly.</li></ul>`
      + `<div class="lfigs">${U.fig(keyAmb, "Ambiguous: E–G and D–F could belong to several keys.", { small: true })}${U.fig(keyC, "B rising to C at the end settles it: C major.", { small: true })}${U.fig(keyA, "The same shape with G♯ points instead to A minor.", { small: true })}</div>`
      + H.check("Which note fits best once a key is established?", "the tonic", ["the 7th", "a note outside the scale", "the 2nd"], "The tonal hierarchy: tonic, then 5th and 3rd, then the other scale notes.") },
    { title: "Where melodies go", kick: "Tendencies listeners learn", render: (H, k, U) => `<p>Studies of thousands of melodies, and of what listeners predict, point to a few strong tendencies. The theorist Eugene Narmour proposed a detailed model (the implication-realization model, 1990); the psychologist Glenn Schellenberg showed that two of its principles, proximity and reversal, explain most of what listeners expect. Huron lists five tendencies in Western melodies:</p>`
      + tbl("Melodic tendencies", ["Tendency", "What happens"], [["Pitch proximity", "The next note is usually close to the last one: steps are far more common than leaps."], ["Step declination", "Steps more often go down than up."], ["Step inertia", "After a small step, the melody tends to keep going the same way."], ["Melodic regression", "After a leap, the melody tends to turn back toward the middle of its range (often heard as “gap fill”)."], ["Melodic arch", "Phrases tend to rise and then fall."]])
      + `<div class="lfigs">${U.fig(gapFill, "A leap up of a 6th, then steps down that fill the gap.", { small: true })}${U.fig(steps, "Steps keep going up, and the leading tone B pulls to C.", { small: true })}</div>`
      + `<p>Tonal tendencies add to these: the leading tone (7) pulls up to the tonic, 4 tends to fall to 3, and phrases tend to end on stable notes. Researchers have built computer models of melodic expectation from these principles, or simply from statistics learned from large collections of music (such as Marcus Pearce's IDyOM), and their predictions match listeners' guesses well.</p>`
      + H.check("After a large leap upward, a melody most often…", "turns back down, usually by step", ["leaps up again", "stops", "repeats the high note many times"], "Gap fill, explained by Huron and Paul von Hippel as regression toward the middle of the range.") },
    { title: "Sequences", kick: "Patterns at new pitch levels", render: (H, k, U) => `<p>A <b>sequence</b> repeats a melodic idea at a different pitch level, usually a step higher or lower each time. After two statements, the listener can predict the third almost note for note: the pattern of the first statement and the distance between statements give it away. Sequences usually run for three statements and then break off, often heading to a cadence, so the break is part of the expectation too.</p>`
      + U.fig(seqFig, "A four-note idea stated three times, each a step lower, then a long C that ends the chain.", { play: H.withClick(seqFig) })
      + H.check("A melodic idea has been heard twice, the second time a step lower. What do listeners expect?", "a third statement, another step lower", ["the first statement again, at the same pitch", "a long rest", "a leap up an octave"], "The pattern and the distance between statements predict the next one.") },
    { title: "Phrase lengths and cadences", kick: "Rhymes at the ends of lines", render: (H, k, U) => `<p>Phrases in much Western music come in regular lengths, most often 4 and 8 bars, and groups of bars are felt as strong and weak, like beats on a larger scale (<b>hypermeter</b>; Fred Lerdahl and Ray Jackendoff's <i>A Generative Theory of Tonal Music</i>, 1983, describes these grouping preferences). After a few 4-bar phrases, listeners expect the next cadence about 4 bars later; a phrase that runs longer, or one cut short, is noticed.</p>
      <p>Cadences are where music rhymes. In a <b>period</b>, the first phrase ends with a half cadence, like a line that sets up a rhyme without completing it. The second phrase starts the same way and ends with an authentic cadence on the tonic: the rhyme arrives.</p>`
      + U.fig(period, "A period in C major: phrase 1 ends on D over a half cadence (open); phrase 2 begins the same way and ends on C (closed). Like a couplet, the second line completes the rhyme.", { play: H.withClick(period) })
      + `<p>And a denied rhyme: the same second phrase, but the last note goes to A, the 6th degree, where a deceptive cadence would put the vi chord. Expecting C, we get a near miss: closer to a slant rhyme or a surprise word than to a mistake, and it makes us want the phrase again.</p>`
      + U.fig(deceptive, "The expected arrival on C is replaced by A.", { play: H.withClick(deceptive) })
      + H.check("In a period, the first phrase usually ends with a half cadence. In the rhyme comparison, it's like…", "a line that sets up a rhyme the next line completes", ["the end of the poem", "a word that doesn't rhyme with anything", "the title"], "The open ending leaves the expectation unresolved until the second phrase.") },
    { title: "Try it: set up and break a pattern", kick: "Pattern maker", render: (H, k, U) => { wirePm(); setTimeout(pmDraw, 0); return `<p>Build a short pattern of eighth notes. It repeats for three bars over a steady pulse, setting up an expectation; then choose what happens in bar 4. Try a pattern that fits the bar evenly (2, 4 or 8 eighths), then one that doesn't (3, 5 or 6), which keeps shifting against the beat. Notes placed on the “&amp;” columns start between beats.</p>${pmHTML()}`; } },
    { title: "Play: what comes next?", kick: "The expectation game", render: (H, k, U) => { wireGame(); setTimeout(gameDraw, 0); return `<p>Listen to a short tune and guess the next note on the keyboard. Your guess is scored against a model built from the research in this lesson: pitch proximity, step inertia, regression after a leap, the tonal hierarchy, the pull of the leading tone, and pattern continuation. The most expected note earns 3 points, the second 2, the third 1. After each guess, you see the top three and why.</p>${gameHTML()}`; } },
    { title: "Quick check", kick: "Before the drills", render: H => Object.keys(F).map(m => { const [q, a, w, y] = F[m][0]; return H.check(q, a, w, y); }).join("") },
  ] };

  // ---------- drills ----------
  const F = {
    ideas: [
      ["Leonard Meyer's <i>Emotion and Meaning in Music</i> (1956) links musical emotion to…", "expectations that are set up, delayed and resolved", ["the composer's biography", "the loudness of the music", "the length of the piece"], "Tension comes from delayed or denied expectations."],
      ["Learning which patterns are common simply by hearing them often is called…", "statistical learning", ["entrainment", "hypermeter", "gap fill"], "Infants and adults pick up the statistics of tone sequences (Saffran and colleagues, 1999)."],
      ["Locking onto a steady pulse so attention peaks on each beat is called…", "entrainment", ["statistical learning", "regression", "modulation"], "Large and Jones describe attention as synchronizing with the beat."],
      ["In Huron's account, a surprise can feel bad at first and good a moment later because…", "a fast first reaction is followed by a slower appraisal", ["surprises are always pleasant", "listeners forget the surprise", "the music gets louder"], "Prediction, reaction and appraisal happen at different speeds."],
      ["Expectations that come from the piece itself (not from the style) are built mostly by…", "repetition within the piece", ["the title", "the key signature", "the instrument list"], "Once a piece repeats an idea, listeners expect it again."],
    ],
    melody: [
      ["After a small step, a melody tends to…", "keep going in the same direction", ["leap an octave", "stop", "repeat the note many times"], "Step inertia."],
      ["After a leap, a melody tends to…", "turn back toward the middle of its range", ["leap again in the same direction", "stay on the high note", "move up by step"], "Melodic regression, often heard as gap fill."],
      ["Which is the most common melodic motion in Western melodies?", "a step", ["a leap of a 6th", "a leap of an octave", "a tritone"], "Pitch proximity: small intervals are far more common."],
      ["Steps in melodies more often go…", "down", ["up", "neither: always sideways", "only between phrases"], "Step declination."],
      ["Phrases tend to rise and then fall, a tendency called the…", "melodic arch", ["sequence", "hemiola", "cadence"], "One of Huron's five melodic tendencies."],
      ["Which two of Narmour's principles explain most listener predictions, according to Schellenberg?", "pitch proximity and pitch reversal", ["meter and tempo", "harmony and timbre", "dynamics and articulation"], "His simplified model keeps just these two."],
    ],
    key: [
      ["Which note fits best once a major key has been set up?", "the tonic", ["the 7th", "the 2nd", "a note outside the scale"], "Krumhansl and Kessler's tonal hierarchy."],
      ["After the tonic, which notes fit best?", "the 5th and the 3rd", ["the 2nd and the 7th", "notes outside the scale", "the 4th and the 6th"], "The tonic triad tops the hierarchy."],
      ["A computer can guess the key of a passage by comparing its note durations with…", "listeners' ratings of how well each note fits a key", ["the tempo marking", "the time signature", "the number of bars"], "The Krumhansl–Schmuckler key-finding method."],
      ["Why does a single tritone (like F–B) help listeners find a major key?", "a major scale contains only one", ["every scale has six tritones", "it always ends the piece", "it's the tonic"], "Rare intervals narrow down the key."],
      ["The leading tone tends to move…", "up a half step to the tonic", ["down a step", "up a 4th", "nowhere: it's stable"], "One of the strongest tonal tendencies."],
    ],
    form: [
      ["A sequence repeats a melodic idea…", "at a different pitch level", ["at exactly the same pitch", "backward", "in a different meter"], "Usually a step up or down each time."],
      ["Sequences usually run for about…", "three statements, then break off", ["one statement", "twelve statements", "the whole piece"], "Listeners expect the chain to end."],
      ["In a period, the first phrase usually ends with…", "a half cadence", ["an authentic cadence", "a key change", "silence"], "It sets up the second phrase."],
      ["In the rhyme comparison, an authentic cadence at the end of a period is like…", "the rhyme arriving at the end of the second line", ["a line with no rhyme", "the title", "a slant rhyme"], "It completes what the first phrase set up."],
      ["Feeling groups of bars as strong and weak, like large-scale beats, is called…", "hypermeter", ["syncopation", "entrainment", "tessitura"], "Phrases of 4 and 8 bars make it easy to feel."],
      ["A deceptive cadence, in the rhyme comparison, is most like…", "a surprise word where the rhyme was expected", ["a perfect rhyme", "the first line of a poem", "a repeated line"], "The expected arrival is replaced by something near it."],
    ],
  };
  const GEN = {
    next: H => { const R = makeRound(H), best = R.rank[0], SC = R.mode === "minor" ? [0, 2, 3, 5, 7, 8, 10, 11] : [0, 2, 4, 5, 7, 9, 11], inK = x => SC.includes(((x.m - R.T) % 12 + 12) % 12) && x.m !== R.ctx[R.ctx.length - 1];
      const others = R.rank.slice(3).filter(inK).slice(0, 5).map(x => pNm(H, R, x.m));   // distractors: notes in the key, but well down the ranking
      return H.mc(`In ${R.k.label} (${R.S.label}), which note is most expected next?`, pNm(H, R, best.m), others, `${pNm(H, R, best.m)}: ${best.r.join("; ") || "the closest stable note"}.`, { kicker: "What comes next?", staff: roundSpec(H, R), playQ: { ev: R.ctx.map((m, i) => [m, i * .6, .57, .8]) }, order: "shuffle" }); },
    key: H => { const [name, mode] = H.rnd(GKEYS.filter(x => x[1] === "major")), k = gkey(H, name, mode), d = H.rnd([[2, 4, 2, 0, 1, 3, 2, 0], [4, 2, 3, 1, 4, 6, 7, 7], [0, 2, 4, 7, 6, 4, 1, 0]]);
      const ns = d.map(x => at(k, x)), last = ns.length - 1, spec = sc([ns.slice(0, 4).map(x => n(H.nmO(x), "q")), [...ns.slice(4, 7).map(x => n(H.nmO(x), "q")), n(H.nmO(ns[last]), "q")]], { vf: k.vf, sig: k.sig, bpm: 92 });
      const nm = x => H.nm(at(k, x)), wrong = [nm(4), nm(1), nm(3), nm(5)];
      return H.mc("Which note sounds like home (the tonic) in this melody?", nm(0), wrong, `The melody is in ${k.label}: ${nm(0)} is the tonic${d[last] === 0 ? ", where it ends" : ""}; ${nm(6)} leads up to it.`, { kicker: "Hearing the key", staff: spec, playQ: H.scorePlay(spec) }); },
    pattern: H => { const cell = H.rnd([["q", "8", "8"], ["8", "8", "q"], ["q.", "8"]]), bad = 2 + Math.floor(Math.random() * 3), pit = H.rnd(["G4", "A4", "E4"]);
      const len = { q: 1, "8": .5, "q.": 1.5 }, mk = cell => { const out = []; let t = 0; while (t < 4) { cell.forEach(d => { if (t < 4) { out.push(n(pit, d === "q." ? "qd" : d)); t += len[d]; } }); } return out; };
      const alt = [n(pit, "h"), n(pit, "q"), n(null, "q")], bars = [1, 2, 3, 4].map(b => b === bad ? alt : mk(cell)), spec = sc(bars, { bpm: 100 });
      return H.mc("A rhythmic pattern is set up and then broken. In which bar does it change?", `bar ${bad}`, ["bar 1", "bar 2", "bar 3", "bar 4"], `Bars before ${bad} set up the pattern; bar ${bad} replaces it with a half note, a quarter and a rest.`, { kicker: "Patterns", staff: spec, playQ: H.withClick(spec), order: ["bar 1", "bar 2", "bar 3", "bar 4"] }); },
  };
  const ALL = Object.values(F).flat();
  function make(mode, H) {
    if (mode === "next") return GEN.next(H);
    if (mode === "hearkey" && Math.random() < .6) return GEN.key(H);
    if (mode === "pattern" && Math.random() < .5) return GEN.pattern(H);
    const pool = { hearkey: F.key, pattern: F.form, ideas: F.ideas.concat(F.melody) }[mode] || ALL;
    const [q, a, w, y] = H.rnd(pool); return H.mc(q, a, w, y);
  }
  const reference = () => `<ul><li><b>Expectation</b> (Meyer, Huron): music sets up predictions, then meets, delays or breaks them.</li><li><b>Pulse</b>: after a few beats we expect the next one (entrainment); syncopations and rests work against it.</li><li><b>Patterns</b>: repetition creates expectation; three statements and a change is a common plan.</li><li><b>Key</b>: tonic fits best, then 5th and 3rd, then other scale notes, then notes outside the scale (Krumhansl and Kessler).</li><li><b>Melody</b>: steps more than leaps; steps continue; leaps turn back; steps tend down; phrases arch.</li><li><b>Sequences</b> run about three times; <b>phrases</b> come in 4 and 8 bars; <b>cadences</b> are the rhymes.</li></ul>`;
  return { key: "silverapps-expect-v1", lesson, make, reference, modes: [{ id: "next", kicker: "What comes next?" }, { id: "hearkey", kicker: "Hearing the key" }, { id: "pattern", kicker: "Patterns and phrases" }, { id: "ideas", kicker: "Ideas and tendencies" }], topics: [] };
})();

window.FAM.quiz = [
  {"s": 1, "q": "Leonard Meyer argued that much of music's emotional effect comes from…", "a": "expectations being set up, delayed and resolved", "w": ["the size of the ensemble", "the key a piece is in", "how loud it is"], "hint": "Emotion and Meaning in Music (1956).", "why": "Tension comes from expectations that are delayed or denied, and resolution from their fulfillment."},
  {"s": 1, "q": "Expectations learned from a lifetime of hearing a style come from…", "a": "statistical learning", "w": ["entrainment", "hypermeter", "gap fill"], "hint": "Common patterns become expected.", "why": "The more often a pattern occurs in the music we hear, the more we expect it."},
  {"s": 1, "q": "In Huron's model, the fast reaction to whether a guess came true is followed by…", "a": "a slower appraisal", "w": ["a key change", "silence", "a faster tempo"], "hint": "Several responses at different speeds.", "why": "That's how a surprise can feel bad at first and good a moment later."},
  {"s": 2, "q": "Synchronizing attention with a steady beat is called…", "a": "entrainment", "w": ["statistical learning", "melodic regression", "modulation"], "hint": "Large and Jones.", "why": "Attention rises just as each beat is due."},
  {"s": 2, "q": "A syncopation stands out because listeners…", "a": "expect notes to start on the beat", "w": ["expect a key change", "expect silence", "expect a louder dynamic"], "hint": "It works against something.", "why": "Without an expected pulse, there would be nothing to push against."},
  {"s": 3, "q": "After a rhythm has been heard three times, listeners most likely expect…", "a": "a fourth statement", "w": ["a modulation", "a slower tempo", "the end of the piece"], "hint": "Repetition builds more expectation.", "why": "Which gives the composer the choice to meet the expectation or break it."},
  {"s": 4, "q": "Krumhansl and Kessler's ratings rank which note highest in a major key?", "a": "the tonic", "w": ["the 7th", "the 2nd", "a note outside the scale"], "hint": "Home.", "why": "Then the 5th and 3rd, the other scale notes, and the notes outside the scale."},
  {"s": 4, "q": "Which notes fit least well once a key is established?", "a": "notes outside the scale", "w": ["the tonic", "the 5th", "the 3rd"], "hint": "Chromatic notes.", "why": "They sit at the bottom of the tonal hierarchy."},
  {"s": 4, "q": "Which clue helps listeners find the tonic?", "a": "which notes are heard most often and longest", "w": ["the key signature", "the title", "the time signature"], "hint": "Listeners don't see the score.", "why": "Melodies spend more time on stable notes; key-finding methods use this."},
  {"s": 4, "q": "A major scale contains how many tritones?", "a": "one", "w": ["none", "three", "six"], "hint": "In C major: F–B.", "why": "A rare interval like this narrows down the key quickly."},
  {"s": 5, "q": "Steps are much more common than leaps in melodies. This tendency is called…", "a": "pitch proximity", "w": ["step declination", "melodic arch", "hemiola"], "hint": "Close together.", "why": "Small intervals are the norm."},
  {"s": 5, "q": "After a leap, the melody's tendency to turn back is called…", "a": "melodic regression (gap fill)", "w": ["step inertia", "entrainment", "hypermeter"], "hint": "It fills in the space it skipped.", "why": "Von Hippel and Huron explain it as a return toward the middle of the range."},
  {"s": 5, "q": "After a small step, a melody tends to continue in the same direction. This is…", "a": "step inertia", "w": ["step declination", "melodic regression", "pitch reversal"], "hint": "Keeps going.", "why": "One of Huron's five tendencies."},
  {"s": 5, "q": "Which way do steps in melodies more often go?", "a": "down", "w": ["up", "neither", "only up at cadences"], "hint": "Step declination.", "why": "Descending steps outnumber ascending ones."},
  {"s": 5, "q": "The leading tone most strongly tends to move…", "a": "up by half step to the tonic", "w": ["down a step to 6", "up a 3rd", "down a 5th"], "hint": "Scale degree 7.", "why": "It's the strongest pull in a major key."},
  {"s": 6, "q": "After two statements of a sequence, listeners can predict…", "a": "the third statement", "w": ["the end of the piece", "a key change", "a change of meter"], "hint": "Pattern plus distance.", "why": "The idea and the distance between statements give the next one away."},
  {"s": 6, "q": "Sequences usually break off after about…", "a": "three statements", "w": ["one statement", "ten statements", "twenty statements"], "hint": "A short chain.", "why": "Often heading to a cadence."},
  {"s": 7, "q": "Groups of bars felt as strong and weak, like large-scale beats, are called…", "a": "hypermeter", "w": ["syncopation", "tessitura", "statistical learning"], "hint": "Meter above the bar.", "why": "Regular 4- and 8-bar phrases make it easy to feel."},
  {"s": 7, "q": "In a period, the first phrase usually ends with…", "a": "a half cadence", "w": ["an authentic cadence", "a modulation", "a fermata"], "hint": "Open.", "why": "The second phrase then closes with an authentic cadence."},
  {"s": 7, "q": "In the rhyme comparison, an authentic cadence ending a period is like…", "a": "the rhyme arriving at the end of the second line", "w": ["an unrhymed line", "the title of the poem", "a repeated first line"], "hint": "The second line of a couplet.", "why": "It completes what the half cadence left open."},
  {"s": 7, "q": "A deceptive cadence, in the rhyme comparison, is most like…", "a": "a surprise word where the rhyme was expected", "w": ["a perfect rhyme", "the poem's first line", "a line repeated exactly"], "hint": "Near, but not what we expected.", "why": "The expected arrival on the tonic is replaced by something close to it."},
];
