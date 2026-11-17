window.FAM = (() => {
  // ===== Meter and Beaming. Engine: build/harmony/engine.js =====
  const P = "B4";
  const tokN = x => { const rest = /r/.test(x), tie = /~/.test(x), d = x.replace(/[r~]/g, ""); return { k: rest ? [] : [P], d, tie }; };
  // percussion rhythm: bars are strings of tokens, or { r: "tokens", time: "5/8", groups: [...] }
  const rh = (time, bars, o = {}) => ({ type: "score", clefs: ["percussion"], time, vf: "C", sig: {}, bpm: o.bpm || 96, final: o.final, groups: o.groups, minBar: o.minBar, bars: bars.map(b => typeof b === "string" ? { t: [b.split(" ").map(tokN)] } : Object.assign({ t: [b.r.split(" ").map(tokN)] }, b.time ? { time: b.time } : {}, b.groups ? { groups: b.groups } : {}, b.minBar ? { minBar: b.minBar } : {})) });
  // Dr. Silverman's MTC 501 examples (assets/img|audio/meter); lyrics removed, excerpts used for educational purposes
  const MX = (f, w, h, alt, cap, aud, max) => `<figure class="lfig"${max ? ` style="max-width:${max}px;margin-inline:auto"` : ""}>${aud ? `<audio controls preload="none" src="assets/audio/meter/${aud[0]}.mp3" aria-label="${aud[1]}" style="width:100%">Your browser can't play this audio clip.</audio>` : ""}<img src="assets/img/meter/${f}" width="${w}" height="${h}" alt="${alt}" loading="lazy" style="width:100%;height:auto;background:#fff">${cap ? `<figcaption>${cap}</figcaption>` : ""}</figure>`;
  const fig = (U, sp, cap, o) => U.fig(sp, cap, Object.assign({ small: true, play: window.__harm ? window.__harm.H.withClick(sp) : null }, o || {}));
  const KIND = {
    "2/4": "simple duple", "3/4": "simple triple", "4/4": "simple quadruple", "2/2": "simple duple", "3/8": "simple triple", "3/2": "simple triple",
    "6/8": "compound duple", "9/8": "compound triple", "12/8": "compound quadruple", "6/4": "compound duple",
    "5/8": "asymmetrical", "7/8": "asymmetrical", "5/4": "asymmetrical", "7/4": "asymmetrical", "11/8": "asymmetrical",
  };
  const BEATS = { "2/4": [2, "quarter"], "3/4": [3, "quarter"], "4/4": [4, "quarter"], "2/2": [2, "half"], "3/8": [3, "eighth"], "3/2": [3, "half"], "6/8": [2, "dotted quarter"], "9/8": [3, "dotted quarter"], "12/8": [4, "dotted quarter"], "6/4": [2, "dotted half"] };
  // one beat of rhythm (tokens)
  const SIMPLE = [["q"], ["8", "8"], ["8", "8"], ["16", "16", "16", "16"], ["8d", "16"], ["8", "16", "16"], ["16", "16", "8"]];
  const COMPOUND = [["qd"], ["8", "8", "8"], ["8", "8", "8"], ["q", "8"], ["8", "q"], ["16", "16", "8", "8"], ["8d", "16", "8"]];
  const METERS = { "2/4": ["s", 2, ["1/4"]], "3/4": ["s", 3, ["1/4"]], "4/4": ["s", 4, ["1/4"]], "6/8": ["c", 2, ["3/8"]], "9/8": ["c", 3, ["3/8"]], "12/8": ["c", 4, ["3/8"]] };
  function barOf(H, ts) {
    const [t, n] = METERS[ts]; let cells = [];
    for (let g = 0; g < 30; g++) { cells = Array.from({ length: n }, () => H.rnd(t === "s" ? SIMPLE : COMPOUND)); if (t === "s" && ts !== "2/4" ? cells.some(c => c.length > 1 && c[0] !== "q") : true) break; }
    return cells.flat().join(" ");
  }

  // ---------- meter player: beats and divisions on a synthesized drum kit ----------
  const MP = { m: "4/4", div: true, beat: true, bpm: 84, on: false };
  const MTR = {   // groups: divisions per beat; kind
    "2/4": [[2, 2], "Simple duple"], "3/4": [[2, 2, 2], "Simple triple"], "4/4": [[2, 2, 2, 2], "Simple quadruple"],
    "6/8": [[3, 3], "Compound duple"], "9/8": [[3, 3, 3], "Compound triple"], "12/8": [[3, 3, 3, 3], "Compound quadruple"],
    "5/8 (2+3)": [[2, 3], "Asymmetrical: 2 + 3"], "5/8 (3+2)": [[3, 2], "Asymmetrical: 3 + 2"], "7/8 (2+2+3)": [[2, 2, 3], "Asymmetrical: 2 + 2 + 3"], "7/8 (3+2+2)": [[3, 2, 2], "Asymmetrical: 3 + 2 + 2"] };
  let KAC = null, KNZ = null, kTimer = 0, kNext = 0, kI = 0, kQ = [];
  function kac() { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; if (!KAC) KAC = new C(); if (KAC.state === "suspended") KAC.resume(); return KAC; }
  function kdrum(kind, t, v) {
    const A = KAC; if (!KNZ) { KNZ = A.createBuffer(1, A.sampleRate * .5, A.sampleRate); const d = KNZ.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const g = A.createGain(); g.connect(A.destination);
    const nz = (type, f, len, a) => { const n = A.createBufferSource(), fl = A.createBiquadFilter(), ng = A.createGain(); n.buffer = KNZ; fl.type = type; fl.frequency.value = f; ng.gain.setValueAtTime(a * v, t); ng.gain.exponentialRampToValueAtTime(.001, t + len); n.connect(fl); fl.connect(ng); ng.connect(g); n.start(t); n.stop(t + len + .02); };
    const osc = (f0, f1, len, a) => { const o = A.createOscillator(), og = A.createGain(); o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + len * .5); og.gain.setValueAtTime(0, t); og.gain.linearRampToValueAtTime(a * v, t + .002); og.gain.exponentialRampToValueAtTime(.001, t + len); o.connect(og); og.connect(g); o.start(t); o.stop(t + len + .02); };
    if (kind === "kick") osc(150, 45, .45, 1);
    if (kind === "snare") { nz("bandpass", 2000, .2, .55); osc(200, 150, .12, .35); }
    if (kind === "tom") osc(170, 110, .3, .7);
    if (kind === "hat") nz("highpass", 7500, .05, .35);
  }
  // strong beat = kick; medium (the 3rd beat of quadruple meters) = tom; weak beats = snare; divisions = hi-hat
  function kStart() { if (!kac()) return; MP.on = true; kI = 0; kQ = []; kNext = KAC.currentTime + .1; kTimer = setInterval(kTick, 25); requestAnimationFrame(kDraw); }
  function kStop() { MP.on = false; clearInterval(kTimer); document.querySelectorAll(".mpd.now").forEach(e => e.classList.remove("now")); }
  function kTick() {
    if (!document.querySelector("[data-mp]")) { kStop(); return; }
    const g = MTR[MP.m][0], n = g.reduce((a, b) => a + b, 0), simple = g.every(x => x === 2), dv = simple ? 60 / MP.bpm / 2 : 60 / MP.bpm / 3;   // in compound and asymmetrical meters the eighth stays constant
    const starts = []; g.reduce((a, b) => (starts.push(a), a + b), 0);
    while (kNext < KAC.currentTime + .12) {
      const i = kI % n, b = starts.indexOf(i), quad = g.length === 4;
      if (b >= 0 && MP.beat) kdrum(b === 0 ? "kick" : quad && b === 2 ? "tom" : "snare", kNext, b === 0 ? 1 : .8);
      if (MP.div) kdrum("hat", kNext, b >= 0 ? .9 : .6);
      kQ.push([kNext, i]); kNext += dv; kI++;
    }
  }
  function kDraw() { if (!MP.on) return; let cur = null; while (kQ.length && kQ[0][0] <= KAC.currentTime) cur = kQ.shift()[1]; if (cur != null) { document.querySelectorAll(".mpd.now").forEach(e => e.classList.remove("now")); const el = document.querySelector(`.mpd[data-i="${cur}"]`); if (el) el.classList.add("now"); } requestAnimationFrame(kDraw); }
  const mpDots = () => { const g = MTR[MP.m][0]; let i = 0; return g.map((d, b) => `<span class="mpb">${Array.from({ length: d }, (_, k) => `<i class="mpd${k === 0 ? " beat" : ""}${k === 0 && b === 0 ? " one" : ""}" data-i="${i++}"></i>`).join("")}</span>`).join(""); };
  const mpView = () => `<div class="toy" data-mp>
    ${[["Simple", ["2/4", "3/4", "4/4"]], ["Compound", ["6/8", "9/8", "12/8"]], ["Asymmetrical", ["5/8 (2+3)", "5/8 (3+2)", "7/8 (2+2+3)", "7/8 (3+2+2)"]]].map(([lab, ms]) => `<div class="toy-row mprow" role="group" aria-label="${lab} meters"><span class="mplab">${lab}</span>${ms.map(m => `<button class="play" data-mpm="${m}" aria-pressed="${m === MP.m}">${m}</button>`).join("")}</div>`).join("")}
    <div class="toy-row"><button class="play" data-mpx="go">${MP.on ? "■ Stop" : "▶ Play"}</button>
      <label><input type="checkbox" data-mpx="beat" ${MP.beat ? "checked" : ""}> Beats (kick, snare${"/"}tom)</label>
      <label><input type="checkbox" data-mpx="div" ${MP.div ? "checked" : ""}> Divisions (hi-hat)</label>
      <label>Tempo <input type="range" data-mpx="bpm" min="40" max="160" value="${MP.bpm}"> <output id="mpBpm">${MP.bpm}</output></label></div>
    <p class="mpkind" id="mpKind"><b>${MTR[MP.m][1]}</b>: ${MTR[MP.m][0].length} beats, each divided into ${[...new Set(MTR[MP.m][0])].join(" or ")}.</p>
    <div class="mpdots" id="mpDots" aria-hidden="true">${mpDots()}</div></div>`;
  if (!window.__mpWired) { window.__mpWired = true;
    document.addEventListener("click", e => { const m = e.target.closest("[data-mpm]"); if (m) { MP.m = m.dataset.mpm; document.querySelectorAll("[data-mpm]").forEach(b => b.setAttribute("aria-pressed", b === m)); document.getElementById("mpDots").innerHTML = mpDots(); const g = MTR[MP.m][0]; document.getElementById("mpKind").innerHTML = `<b>${MTR[MP.m][1]}</b>: ${g.length} beats, each divided into ${[...new Set(g)].join(" or ")}.`; kI = 0; kQ = []; if (!MP.on) kStart(); return; }
      const x = e.target.closest('[data-mpx="go"]'); if (x) { MP.on ? kStop() : kStart(); x.textContent = MP.on ? "■ Stop" : "▶ Play"; } });
    document.addEventListener("change", e => { const x = e.target.closest("[data-mpx]"); if (!x || x.type !== "checkbox") return; MP[x.dataset.mpx] = x.checked; });
    document.addEventListener("input", e => { const x = e.target.closest('[data-mpx="bpm"]'); if (!x) return; MP.bpm = +x.value; document.getElementById("mpBpm").textContent = MP.bpm; }); }

  const FACTS = [
    ["Meter is…", "the recurring pattern of strong and weak beats", ["the speed of the beat", "the length of a phrase", "the key of a piece"], "Duple (strong–weak), triple (strong–weak–weak), quadruple."],
    ["In simple meter, each beat divides into…", "two", ["three", "four", "five"], "The beat is an undotted value."],
    ["In compound meter, each beat divides into…", "three", ["two", "four", "five"], "The beat is a dotted value."],
    ["In compound meter, the top number of the time signature counts…", "divisions of the beat (beats × 3)", ["beats", "bars", "measures per phrase"], "6/8 = two beats of three eighths."],
    ["An asymmetrical meter…", "has beats of unequal length, like 5/8 grouped 2 + 3", ["changes time signature often", "has no beat", "is always compound"], "Also called additive or irregular meter."],
    ["Mixed meter means…", "the time signature changes often, as a consistent feature", ["two meters at once", "a single change for a new section", "meter with no time signature"], "Two meters at once is polymeter."],
    ["When the meter changes at the start of a new line, you should…", "put a cautionary time signature at the end of the previous line", ["repeat the time signature on every line", "omit the new time signature", "add a double bar in every part"], "Readers get a warning before the line break."],
    ["An anacrusis (pick-up) is…", "one or more notes before the first downbeat", ["an accented note on beat 1", "a note held over the bar line", "a change of meter"], "The last bar is often shortened to balance it."],
    ["Syncopation is…", "a note starting on a weak beat or offbeat and held into a stronger one", ["three notes in the time of two", "a pick-up", "a change of tempo"], "It goes against the meter's normal accents."],
    ["A hemiola is…", "three groups in the time of two (or two in the time of three), shifting the meter's feel", ["a note before the downbeat", "any tied note", "a fast tempo"], "Often two bars of 3/4 felt as three bars of 2/4, at cadences."],
    ["Beams should show…", "the beats of the meter", ["the melodic contour", "the syllables of the text", "nothing in particular"], "Beam by beat: in twos (or fours) in simple meter, threes in compound."],
    ["In 4/4, eighth notes may be beamed in fours, but never…", "across the middle of the bar (beats 2–3)", ["within beat 1", "in pairs", "with a rest"], "The middle of the bar must stay visible."],
    ["Older vocal music beamed notes…", "only within a melisma (one syllable); each syllable got its own flag", ["the same as instrumental music", "never", "in groups of four always"], "Modern editions usually beam vocal parts by beat, like instrumental music."],
    ["3/4 and 6/8 both hold six eighth notes. What tells them apart?", "the grouping: 3/4 beams in twos (three beats), 6/8 in threes (two beats)", ["nothing", "6/8 is faster", "3/4 always has quarter notes"], "Beaming shows the beat."],
  ];

  // ---------- add the bar lines: notes in a row with no bar lines; tap the gaps where each bar ends ----------
  const EI = { w: 8, hd: 6, h: 4, qd: 3, q: 2, "8d": 1.5, "8": 1, "16": .5 };
  const GL = { w: "𝅝", hd: "𝅗𝅥.", h: "𝅗𝅥", qd: "♩.", q: "♩", "8d": "♪.", "8": "♪", "16": "𝅘𝅥𝅯" };
  const GN = { w: "whole note", hd: "dotted half note", h: "half note", qd: "dotted quarter note", q: "quarter note", "8d": "dotted eighth note", "8": "eighth note", "16": "sixteenth note" };
  const LONG = { "2/4": ["h", "q q"], "3/4": ["hd", "h q", "q h"], "4/4": ["w", "h h", "h q q", "q q h", "hd q", "q hd"], "6/8": ["hd", "qd qd"], "9/8": ["hd qd", "qd hd"], "12/8": ["hd hd", "hd qd qd"] };
  const blAns = list => list.length ? `bar lines after note${list.length > 1 ? "s" : ""} ${list.length > 1 ? list.slice(0, -1).join(", ") + " and " + list[list.length - 1] : list[0]}` : "no bar lines";
  function barsQ(H) {
    let ts, bars, notes;
    for (let k = 0; k < 40; k++) {
      ts = H.rnd(Object.keys(METERS)); const nb = /4\/4|12\/8/.test(ts) ? 3 : 4;
      bars = Array.from({ length: nb }, () => Math.random() < .3 ? H.rnd(LONG[ts]) : barOf(H, ts));
      notes = bars.map(b => b.split(" ")); const n = notes.flat().length;
      if (n >= 8 && n <= 26 && new Set(bars).size > 1) break;
    }
    const after = []; let c = 0; notes.slice(0, -1).forEach(b => { c += b.length; after.push(c); });
    const flat = notes.flat(), sp = rh(ts, bars, { groups: METERS[ts][2], final: true });
    const ans = blAns(after), eighths = METERS[ts][0] === "s" ? METERS[ts][1] * 2 : METERS[ts][1] * 3;
    const wrong = [blAns(after.map(x => x + 1)), blAns(after.map(x => Math.max(1, x - 1))), blAns(after.slice(0, -1))];
    return H.mc(`The time signature is ${ts}. Tap the gaps between the notes where each bar ends. The last bar line is already there.`, ans, wrong,
      `Each bar of ${ts} holds ${BEATS[ts][0]} ${BEATS[ts][1]} beat${BEATS[ts][0] > 1 ? "s" : ""}, the length of ${eighths} eighth notes. Counting in eighths, the bars end after notes ${after.join(", ")}. Here it is with bar lines and beaming.`,
      { widget: "barlines", blTs: ts, blNotes: flat, blAfter: after, staffAns: sp, play: H.withClick(sp), playLabel: "Play with the beat" });
  }
  const widgets = { barlines: {
    html(c, q) {
      if (!q.blSel) q.blSel = [];
      const n = c.blNotes.length, ok = new Set(c.blAfter);
      let h = `<div class="blrow" role="group" aria-label="Notes in ${c.blTs} without bar lines. Each gap is a button: press it to add or remove a bar line."><span class="blts" aria-hidden="true"><span>${c.blTs.split("/")[0]}</span><span>${c.blTs.split("/")[1]}</span></span>`;
      c.blNotes.forEach((t, i) => { h += `<span class="bln" style="--w:${16 + EI[t] * 9}px" role="img" aria-label="Note ${i + 1}: ${GN[t]}">${GL[t]}</span>`;
        if (i < n - 1) { const on = q.blSel.includes(i + 1), st = !q.done ? "" : on && ok.has(i + 1) ? " good" : on ? " bad" : ok.has(i + 1) ? " miss" : "";
          h += `<button type="button" class="blgap${on ? " on" : ""}${st}" data-bl="${i + 1}" aria-pressed="${on}" aria-label="Bar line after note ${i + 1}"${q.done ? " disabled" : ""}><i></i></button>`; } });
      h += `<span class="blend" aria-hidden="true"></span></div>`;
      if (q.done) h += `<p class="bllegend"><span class="good">█</span> correct bar line <span class="bad">█</span> not a bar line <span class="miss">┆</span> missed bar line</p>`;
      return h;
    },
    wire(root, c, q) {
      root._bl = { c, q }; const btn = root.querySelector("[data-wcheck]");
      const upd = () => { if (btn) btn.disabled = !q.blSel.length; };
      root.querySelectorAll("[data-bl]").forEach(b => b.onclick = () => { const i = +b.dataset.bl, k = q.blSel.indexOf(i); if (k < 0) q.blSel.push(i); else q.blSel.splice(k, 1); const on = k < 0; b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); upd(); });
      upd();
    },
    value(root) { const x = root._bl; if (!x || !x.q.blSel.length) return null; return blAns(x.q.blSel.slice().sort((a, b) => a - b)); },
  } };

  function make(mode, H) {
    if (mode === "classify") {
      if (Math.random() < .15) {
        const seq = H.shuffle(["3/4", "2/4", "5/8", "3/8", "4/4", "7/8"]).slice(0, 4);
        return H.mc(`A piece's time signatures go ${seq.join(" → ")} → ${seq[0]}… changing every bar or two. What is this called?`, "mixed meter", ["mixed meter", "asymmetrical meter", "compound meter", "polymeter"], "The meter keeps changing as a consistent feature: mixed meter (polymeter is two meters at the same time).", { kicker: "Kinds of meter" });
      }
      const ts = H.rnd(Object.keys(KIND)), k = KIND[ts];
      return H.mc(`What kind of meter is ${ts}?`, k, ["simple duple", "simple triple", "simple quadruple", "compound duple", "compound triple", "compound quadruple", "asymmetrical"], k === "asymmetrical" ? `${ts} divides into unequal groups (such as ${ts.startsWith("5") ? "2 + 3" : ts.startsWith("7") ? "2 + 2 + 3" : "3 + 3 + 3 + 2"}): asymmetrical.` : `${ts}: ${BEATS[ts][0]} beats, the beat a ${BEATS[ts][1]} note, ${k.startsWith("simple") ? "dividing in two" : "dividing in three"}.`, { kicker: "Kinds of meter" });
    }
    if (mode === "which") {
      const ts = H.rnd(Object.keys(METERS)), b1 = barOf(H, ts), b2 = barOf(H, ts);
      const sp = rh(ts, [b1, b2], { groups: METERS[ts][2] }); sp.time = null;
      const full = rh(ts, [b1, b2], { groups: METERS[ts][2] });
      return H.mc("The time signature is missing. Judging by the bar length and the beaming, what is it?", ts, Object.keys(METERS), `Each bar holds ${ts.endsWith("8") ? +ts.split("/")[0] + " eighths" : ts.split("/")[0] + " quarters"}, beamed ${METERS[ts][0] === "c" ? "in threes (dotted-quarter beats): compound" : "by quarter-note beat: simple"}: ${ts}.`, { kicker: "Find the meter", staff: sp, staffAns: full, playQ: H.scorePlay(full), playQLabel: "Play", play: H.withClick(full), playLabel: "Play with the beat" });
    }
    if (mode === "group") {
      const opts = H.rnd([["5/8", ["2+3", "3+2"]], ["7/8", ["2+2+3", "3+2+2", "2+3+2"]], ["8/8", ["3+3+2", "3+2+3", "2+3+3"]]]), ts = opts[0], g = H.rnd(opts[1]);
      const toks = g.split("+").map(n => Array(+n).fill("8").join(" ")).join(" ");
      const sp = rh(ts, [toks, toks], { groups: g.split("+").map(n => n + "/8") });
      return H.mc(`How are the eighth notes grouped in this ${ts} bar?`, g, opts[1].concat(["2+2+2+2", "3+3"]).filter((v, i, a) => a.indexOf(v) === i), `The beams group ${g.split("+").join(", ")} eighths: ${g}. Each group is one (unequal) beat${ts === "8/8" ? "; 3+3+2 is a classic “tresillo” grouping" : ""}.`, { kicker: "Asymmetrical grouping", staff: sp, playQ: Object.assign(H.scorePlay(sp), {}), playQLabel: "Play" });
    }
    if (mode === "bars") return barsQ(H);
    if (mode === "beam" && Math.random() < .4) mode = "group";   // beaming and asymmetrical grouping share a mode
    if (mode === "classify" && Math.random() < .5) mode = "terms";   // kinds of meter and terms share a mode
    if (mode === "beam") {
      const ts = H.rnd(["2/4", "3/4", "4/4", "6/8", "9/8"]), good = Math.random() < .45;
      const b = METERS[ts] ? Array(+ts.split("/")[0] * (ts.endsWith("8") ? 1 : 2)).fill("8").join(" ") : "";
      const wrong = { "2/4": ["3/8"], "3/4": ["3/8"], "4/4": ["3/8", "2/8", "3/8"], "6/8": ["2/8"], "9/8": ["2/8", "2/8", "2/8", "3/8"] }[ts];
      const sp = rh(ts, [b], { groups: good ? METERS[ts][2] : wrong });
      const W = { "2/4": "in 2/4 the eighths should be beamed by quarter-note beat (or all four together); grouping 3 + 1 hides beat 2", "3/4": "grouped in threes, it looks like 6/8; in 3/4 beam by quarter beat (2 + 2 + 2, or all six)", "4/4": "3 + 2 + 3 hides beats 2 and 3 (and crosses the middle of the bar); beam 2 + 2 + 2 + 2 or 4 + 4", "6/8": "grouped in twos, it looks like 3/4; in 6/8 beam in threes to show the two dotted-quarter beats", "9/8": "pairs hide the three dotted-quarter beats; beam in threes" };
      return H.mc(`Is this ${ts} bar beamed clearly?`, good ? "Yes: the beams show the beats" : "No: the beams hide the beats", ["Yes: the beams show the beats", "No: the beams hide the beats"], good ? `The beams group by ${ts.endsWith("8") ? "dotted-quarter" : "quarter-note"} beat${ts === "4/4" || ts === "2/4" ? " (beaming a whole half bar together is also fine)" : ""}.` : `No: ${W[ts]}.`, { kicker: "Beaming", staff: sp });
    }
    if (mode === "device") {
      const kind = H.rnd(["ana", "sync", "hem", "none"]);
      const T = {
        ana: [["3/4", [{ r: "q" }, "h q", "q q q", "h"]], ["4/4", [{ r: "8 8" }, "q q q q", "h q 8 8", "hd"]], ["6/8", [{ r: "8" }, "q 8 q 8", "qd qd", "q 8 q"]]],
        sync: [["4/4", ["8 q 8 q q", "q q h"]], ["4/4", ["q 8 q 8 q", "h h"]], ["2/4", ["8 q 8", "q q"]], ["4/4", ["8 8~ 8 8~ 8 8 q", "w"]]],
        hem: [["3/4", ["h q~", "q h", "hd"]], ["6/8", ["q q q", "qd qd", "qd qd"]].slice(0, 0)].filter(x => x.length),
        none: [["4/4", ["q q q q", "h h"]], ["3/4", ["q 8 8 q", "hd"]], ["6/8", ["8 8 8 qd", "qd qd"]]],
      };
      const [ts, bars] = H.rnd(T[kind]), sp = rh(ts, bars);
      const N = { ana: "Anacrusis (pick-up)", sync: "Syncopation", hem: "Hemiola", none: "None of these" };
      const W = { ana: "The first bar is incomplete: the music starts with a pick-up before the first downbeat.", sync: "Notes start off the beat and are held into a stronger beat: syncopation.", hem: "Across two bars of 3/4, three half-note groups replace two bars of three beats: a hemiola (it sounds like 3/2).", none: "The rhythms line up with the meter's strong beats: no pick-up, syncopation or hemiola." };
      return H.mc("Which rhythmic device does this passage use?", N[kind], Object.values(N), W[kind], { kicker: "Pick-ups, syncopation, hemiola", staff: sp, playQ: H.withClick(sp), playQLabel: "Play with the beat" });
    }
    const [q, a, w, y] = H.rnd(FACTS);
    return H.mc(q, a, w, y, { kicker: "Terms" });
  }

  function reference() {
    return `<div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Kind</th><th scope="col">Examples</th><th scope="col">Beat</th></tr></thead><tbody>
      <tr><td><b>Simple</b> (beat ÷ 2)</td><td>2/4, 3/4, 4/4, 2/2, 3/8</td><td>undotted</td></tr>
      <tr><td><b>Compound</b> (beat ÷ 3)</td><td>6/8, 9/8, 12/8, 6/4</td><td>dotted; top number ÷ 3 = beats</td></tr>
      <tr><td><b>Asymmetrical</b></td><td>5/8, 7/8, 5/4, 11/8</td><td>unequal beats (2 + 3…)</td></tr>
      <tr><td><b>Mixed</b></td><td>changing time signatures</td><td>—</td></tr></tbody></table></div>
      <p class="legend">Beam by beat; never hide the middle of a 4/4 bar; in compound meter beam in threes.</p>`;
  }

  const lesson = { steps: [
    { title: "Beat and meter", kick: "Strong and weak", render: (H, k, U) => `<p>The <b>beat</b> is the steady pulse; <b>meter</b> groups beats into recurring patterns of strong and weak, marked off by bar lines: <b>duple</b> (strong–weak), <b>triple</b> (strong–weak–weak) and <b>quadruple</b> (strong–weak–medium–weak).</p>
      <div class="lfigs">${fig(U, rh("2/4", ["q q", "q q"]), "Duple")}${fig(U, rh("3/4", ["q q q", "q q q"]), "Triple")}${fig(U, rh("4/4", ["q q q q", "q q q q"]), "Quadruple")}</div>
      <p>The <b>time signature</b> sets the meter. Each beat can also divide: into two (simple meter) or three (compound meter).</p>` },
    { title: "Kinds of meter", kick: "Simple, compound, asymmetrical", render: () => `<p>Meters are named in two ways at once: by <b>how many beats</b> are in a bar (duple = 2, triple = 3, quadruple = 4), and by <b>how each beat divides</b>:</p>
      <ul><li><b>Simple</b>: every beat divides into <b>two</b> (1 & 2 &).</li>
      <li><b>Compound</b>: every beat divides into <b>three</b> (1 & a 2 & a).</li>
      <li><b>Asymmetrical</b> (additive): the beats are <b>unequal</b>, mixing groups of two and three (1 & 2 & a).</li></ul>
      <p>Choose a meter and listen. The kick drum marks beat 1, the snare (and in quadruple meters a tom on the medium-strong beat 3) marks the other beats, and the hi-hat plays the divisions. Turn the layers on and off to hear the beat alone, then how it divides. The next steps show how each kind is written.</p>
      ${mpView()}` },
    { title: "Simple meter", kick: "Beats divide in two", render: (H, k, U) => `<p>In <b>simple meter</b> the beat is an undotted note and divides into two. The top number is the number of beats; the bottom number is the beat's note value (4 = quarter, 2 = half, 8 = eighth).</p>
      <div class="lfigs">${fig(U, rh("2/4", ["8 8 q", "16 16 8 q"]), "2/4")}${fig(U, rh("3/4", ["q 8 8 q", "hd"]), "3/4")}${fig(U, rh("4/4", ["8 8 8 8 q q", "h h"]), "4/4")}${fig(U, rh("2/2", ["h q q", "w"]), "2/2 (cut time): half-note beats")}</div>` },
    { title: "Compound meter", kick: "Beats divide in three", render: (H, k, U) => `<p>In <b>compound meter</b> the beat is a <b>dotted</b> note and divides into three. The top number counts the divisions, so divide it by 3 to get the beats: 6/8 = 2 beats, 9/8 = 3, 12/8 = 4, each a dotted quarter.</p>
      <div class="lfigs">${fig(U, rh("6/8", ["8 8 8 8 8 8", "q 8 qd"]), "6/8: compound duple")}${fig(U, rh("9/8", ["8 8 8 q 8 qd"]), "9/8: compound triple")}${fig(U, rh("12/8", ["qd 8 8 8 q 8 qd"]), "12/8: compound quadruple")}</div>`
      + H.check("How many beats are in a bar of 9/8?", "3", ["9", "4", "6"], "Nine eighths in groups of three: three dotted-quarter beats.") },
    { title: "Same notes, different meter", kick: "3/4 or 6/8?", render: (H, k, U) => `<p>A bar of 3/4 and a bar of 6/8 both hold six eighth notes, but they feel and look different. 3/4 has three beats (strong–weak–weak), each dividing in two; 6/8 has two beats (strong–weak), each dividing in three. <b>Beaming shows the difference.</b></p>
      <div class="lfigs">${fig(U, rh("3/4", ["8 8 8 8 8 8", "q q q"]), "3/4: 2 + 2 + 2")}${fig(U, rh("6/8", ["8 8 8 8 8 8", "qd qd"]), "6/8: 3 + 3")}</div>
      <p>Likewise 4/4 and 12/8 often sound alike at the beat level, but 12/8's beats divide in three (a “shuffle” or triplet feel).</p>` },
    { title: "Asymmetrical meter", kick: "Unequal beats", render: (H, k, U) => `<p>In an <b>asymmetrical</b> (additive, irregular) meter the beats are unequal: groups of two and three eighths. 5/8 can be 2 + 3 or 3 + 2; 7/8 can be 2 + 2 + 3, 3 + 2 + 2 or 2 + 3 + 2. Even an even number of eighths can be grouped unevenly (3 + 3 + 2 in 8/8 or 4/4), shown by the beaming, which may change as the music goes on.</p>
      <div class="lfigs">${fig(U, rh("5/8", ["8 8 8 8 8"], { groups: ["2/8", "3/8"] }), "5/8 as 2 + 3")}${fig(U, rh("7/8", ["8 8 8 8 8 8 8"], { groups: ["2/8", "2/8", "3/8"] }), "7/8 as 2 + 2 + 3")}${fig(U, rh("8/8", ["8 8 8 8 8 8 8 8"], { groups: ["3/8", "3/8", "2/8"] }), "3 + 3 + 2")}</div>
      <p>The same idea works with quarter-note beats: 5/4 can be felt as 3 + 2 or 2 + 3. The beaming (or, with longer values, the way the notes are grouped) tells the performer which.</p>`
      + MX("moeran-fantasy-quartet.png", 1667, 416, "Oboe melody in 8/8 after a 2/4 pick-up bar, marked Allegro con brio. Handwritten counts above each bar show the eighths grouped 3 + 3 + 2 (1 + + 2 + + 3 +) or 3 + 2 + 3, changing from bar to bar.", "E. J. Moeran, <i>Fantasy Quartet</i>: 8/8 bars grouped 3 + 3 + 2, 3 + 2 + 3 and other ways, shown by the beaming and the counts.", ["moeran-fantasy-quartet", "Moeran, Fantasy Quartet, excerpt"]) },
    { title: "Mixed meter", kick: "Changing time signatures", render: (H, k, U) => {
      const sp = rh("3/4", ["q q q", { r: "8 8 8 8 8", time: "5/8", groups: ["3/8", "2/8"] }, { r: "q q", time: "2/4" }, { r: "8 8 8 8 8 8 8", time: "7/8", groups: ["2/8", "2/8", "3/8"] }, { r: "hd", time: "3/4" }]);
      return `<p><b>Mixed meter</b>: the time signature changes as a consistent feature of the music, not just once for a new section. Each change gets a new time signature; if a change falls at the start of a line, add a <b>cautionary</b> time signature at the end of the previous line.</p>`
        + U.fig(sp, "3/4, 5/8, 2/4, 7/8, 3/4: a new time signature at every change.", { play: H.withClick(sp) })
        + `<p>Some music changes meter so often that the beaming, not the time signature, is the clearest guide to the groups. In Jessie Montgomery's <i>Strum</i>, the eighth-note groupings are so flexible that the usual rules for simple and compound meter fall away: there's even a 2 + 4 grouping in 6/8.</p>`
        + MX("montgomery-strum.png", 991, 263, "Two lines of a melody whose time signature changes almost every bar: 7/8, 6/8, 5/8, 7/8, 6/8, 6/8, 7/8, 5/8, with beams grouping the eighths unevenly.", "Jessie Montgomery, <i>Strum</i> (from bar 13): 7/8, 6/8 and 5/8 in quick succession.", ["montgomery-strum", "Montgomery, Strum, excerpt"], 760)
        + `<p>Other music grows or shrinks a repeating pattern by one note at a time. In “Knee 3” from Philip Glass's <i>Einstein on the Beach</i>, the meter contracts and expands one note per section, so the time signature keeps changing while the chord pattern stays steady. The chorus sings the counts.</p>`
        + MX("glass-knee-3.png", 1400, 1832, "Score page of Knee 3 for chorus and organ. Section 1 has bars of eight eighth notes counted 1 2 3 4 1 2 3 4; section 2 has seven, counted 1 2 3 4 1 2 3; section 3 has six, counted 1 2 3 1 2 3; section 4 has five, counted 1 2 3 1 2.", "Philip Glass, “Knee 3” from <i>Einstein on the Beach</i>: eight eighths per bar, then seven, six and five, over the same chords.", ["glass-knee-3", "Glass, Knee 3, opening"], 640)
        + `<p>(Two meters at the <i>same</i> time is <b>polymeter</b>.)</p>`;
    } },
    { title: "Beaming shows the beat", kick: "Making everything clear", render: (H, k, U) => `<ul><li><b>Beam by beat</b>: by quarter note in 2/4, 3/4, 4/4; in threes in 6/8, 9/8, 12/8; by the written groups in asymmetrical meters.</li>
      <li>In 4/4, eighths may be beamed in fours (half a bar), but <b>never across the middle</b> of the bar (beats 2–3).</li>
      <li>Sixteenths are beamed by beat (four per quarter beat), with secondary beams that can break to show the subdivision.</li>
      <li>Rests can sit inside a beamed group; beams can extend over a rest when the group is still one beat.</li>
      <li>Don't use a note value that hides a beat (see the Rhythm Notation lesson): <b>clarity for the reader</b> comes first.</li></ul>
      <div class="lfigs">${fig(U, rh("4/4", ["8 8 8 8 8 8 8 8"], { groups: ["2/8"] }), "Clear: by beat")}${fig(U, rh("4/4", ["8 8 8 8 8 8 8 8"], { groups: ["4/8"] }), "Clear: half bars")}${fig(U, rh("4/4", ["8 8 8 8 8 8 8 8"], { groups: ["3/8", "2/8", "3/8"] }), "Unclear: hides beats 2 and 3")}${fig(U, rh("6/8", ["8 8 8 8 8 8"], { groups: ["2/8"] }), "Unclear in 6/8: looks like 3/4")}</div>` },
    { title: "Historical vocal beaming", kick: "One flag per syllable", render: (H, k, U) => {
      // syllables with hy (a hyphen follows) and slurs over the melisma on "ex-"
      const notes = [["G4", "Glo", 1], ["A4", "ri", 1], ["B4", "a"], ["C5", "in"], ["D5", "ex", 1, "s"], ["C5", null], ["B4", null, 0, "e"], ["C5", "cel", 1]];
      const nt = ([p, l, hy, sl], bm) => Object.assign({ k: [p], d: "8" }, l != null ? { ly: l } : {}, hy ? { hy: true } : {}, sl === "s" ? { sls: true } : {}, sl === "e" ? { sle: true } : {}, bm ? { bm } : {});
      const mk = (bm) => ({ type: "score", clefs: ["treble"], time: "2/4", vf: "C", sig: {}, bpm: 90, beam: bm ? undefined : false, bars: [{ t: [notes.slice(0, 4).map(x => nt(x))] }, { t: [notes.slice(4).map((x, i) => nt(x, !bm && i < 3 ? "m" : null))] }, { t: [[{ k: ["B4"], d: "q", ly: "sis" }, { k: [], d: "q" }]] }] });
      return `<p>Older vocal music (and many editions into the 20th century) beamed notes only when they were sung to one syllable: in a <b>melisma</b>. Every new syllable got its own flagged note, so the beams showed the text, not the beat.</p>
      <div class="lfigs">${fig(U, mk(false), "Traditional vocal notation: flags for each syllable, a beam only for the melisma on “ex-”")}${fig(U, mk(true), "Modern practice: beamed by beat, as in instrumental music")}</div>
      <p>Today most editions beam vocal parts by beat, like instrumental music, because it shows the meter and is easier to read. Either way, a <b>slur</b> joins the notes of a melisma, each syllable is centered under its first note, and a <b>hyphen</b> sits centered in the space between the syllables of a word (in a long melisma, several hyphens may be spread through the gap). A word's last syllable sung to a melisma gets an <b>extender line</b> instead.</p>`;
    } },
    { title: "Pick-ups", kick: "Anacrusis", render: (H, k, U) => `<p>An <b>anacrusis</b> (pick-up, upbeat) is one or more notes before the first downbeat of a phrase. The first bar is incomplete. Traditionally the final bar is shortened to balance it, so the two together make one full bar, but many pieces simply end with a full bar. Bar numbering usually starts with the first <i>complete</i> bar.</p>`
      + fig(U, rh("3/4", [{ r: "q", minBar: 26 }, "h q", "q q q", "q q q", "hd"]), "A one-beat pick-up in 3/4 (the click starts on beat 3). This example ends with a full bar.", { small: false }) },
    { title: "Syncopation", kick: "Against the beat", render: (H, k, U) => `<p><b>Syncopation</b> begins a note on a weak beat or an offbeat and sustains it into a normally accented position, so the accent falls “between” beats.</p>
      <div class="lfigs">${fig(U, rh("4/4", ["8 q 8 q q", "q q h"]), "Eighth–quarter–eighth: a classic syncopation")}${fig(U, rh("4/4", ["8 8~ 8 8~ 8 8 q", "w"]), "Ties across beats, keeping every beat visible")}</div>` },
    { title: "Hemiola", kick: "Three against two", render: (H, k, U) => `<p>A <b>hemiola</b> shifts the feel of the meter by asserting three groups in the time of two, or vice versa. The classic case: two bars of 3/4 (2 × 3 beats) heard as three half notes (3 × 2), often just before a cadence.</p>`
      + fig(U, rh("3/4", ["q q q", "h q~", "q h", "hd"]), "Bars 2–3 regroup six beats as three half notes (written with a tie to keep the bar line clear).", { small: false })
      + `<p>Alternating 6/8 and 3/4 (strong–weak / strong–weak–weak) is a related effect.</p>`
      + `<p>Pop uses all three of these devices constantly. In this chorus, each phrase starts with a pick-up, groups its sixteenths in threes against the 4/4 beat (a hemiola), and ends with a syncopation.</p>`
      + MX("till-the-world-ends.png", 2000, 314, "Melody in 4/4, two phrases. Each is labeled: an eighth-note anacrusis, a hemiola of dotted eighths tied across the beat, and a syncopated ending.", "Britney Spears, “Till the World Ends” (lyrics removed): anacrusis, hemiola and syncopation, twice.", ["till-the-world-ends", "Till the World Ends, excerpt"]) },
    { title: "Beyond the bar", kick: "Swing, free time, layered meters", render: (H, k, U) => `<p><b>Swing</b> (jazz), <b>shuffle</b> (boogie-woogie, some pop) and <b>notes inégales</b> (French Baroque, probably from the 16th century on) all play written even eighths unevenly, usually close to a long–short triplet. Swing tends to vary more, sometimes approaching a dotted eighth and sixteenth.</p>`
      + MX("higher-ground.png", 2000, 947, "Two versions of the same melody in E-flat major and 4/4: as written, in plain eighth notes, and as it sounds, with each pair of eighths turned into a long-short triplet pattern.", "Stevie Wonder, “Higher Ground” (lyrics removed): written in even eighths, sung in a swung, triplet-based rhythm.", ["higher-ground", "Higher Ground, excerpt"])
      + `<p><b>Unmeasured rhythm</b> asks performers to sing or play out of sync or without a steady pulse. One way to notate it: no stems, with open noteheads for notes held longer than closed ones.</p>`
      + MX("shaw-allemande.png", 687, 428, "Eight-voice score page: voices 1, 2 and 4 sing a descending line of stemless open and closed noteheads; voices 5 to 8 hold long notes with dotted lines toward a boxed whole note.", "Caroline Shaw, Allemande from <i>Partita for 8 Voices</i> (text removed): unmeasured, stemless notation.", ["shaw-allemande", "Shaw, Allemande, excerpt"], 560)
      + `<p><b>Polyrhythm</b> sets rhythms against each other that divide the beat differently: in 3:2, one part plays three even notes while another plays two. <b>Polymeter</b> keeps the same beat but gives the parts different bar lengths: 4/4 against 3/4 lines up only every 12 beats. <a href="https://www.youtube.com/watch?v=oDEutnQxp40" target="_blank" rel="noopener">Video: polyrhythm and polymeter</a>.</p>
      <p><b>Metric modulation</b> changes tempo or meter by reinterpreting a note value from the old tempo as a different value in the new one, written as an equation such as ♩ = ♩. above the bar. In “We Can Work It Out,” the half note stays constant: half a bar of 4/4 becomes a whole bar of 3/4 (half = dotted half), and the music swings into a waltz.</p>`
      + MX("we-can-work-it-out.png", 2000, 1238, "Melody with chords Bm, Bm/A, G, F-sharp sus4, F-sharp in 4/4, then a change to 3/4 marked half note equals dotted half note, over Bm, Bm/A, Bm/G, Bm/F-sharp, and back to 4/4 marked dotted half equals half.", "The Beatles, “We Can Work It Out” (lyrics removed): half note = dotted half into 3/4, and back.", ["we-can-work-it-out", "We Can Work It Out, excerpt"])
      + `<p>Elliott Carter's String Quartet No. 1 combines metric modulation with polyrhythm. The second violin starts with steady dotted eighths against the 4/4 meter, then the cello plays quintuplets. Carter then modulates so each note of the cello's quintuplet becomes a plain sixteenth, keeping the cello's pace while the meter regroups it, first in fives (10/16 as two beats of five sixteenths), then in threes.</p>`
      + MX("carter-quartet-1.png", 2000, 1524, "String quartet score: before rehearsal 15 the cello plays quintuplet sixteenths; at the double bar each part is marked quarter note equals five sixteenths, and the meter changes to 10/16, then 5/16, 6/16 and 9/16, with sixteenth equals sixteenth and dotted eighth equals 120 markings.", "Elliott Carter, String Quartet No. 1, leading into rehearsal 15.") + `<p><a href="https://www.youtube.com/watch?v=f4DQisryKJ8" target="_blank" rel="noopener">Video: Carter, String Quartet No. 1</a>.</p>` },
    { title: "Quick check", kick: "Before the drills", render: (H) => H.check("6/8 is…", "compound duple", ["simple triple", "compound triple", "asymmetrical"], "Two dotted-quarter beats.") + H.check("7/8 grouped 2 + 2 + 3 is…", "asymmetrical", ["compound", "simple", "mixed"], "Unequal beats.") + H.check(FACTS[11][0], FACTS[11][1], FACTS[11][2], FACTS[11][3]) + H.check(FACTS[9][0], FACTS[9][1], FACTS[9][2], FACTS[9][3]) },
  ] };

  return {
    key: "silverapps-meter-v1", lesson, make, reference, widgets,
    modes: [{ id: "classify", kicker: "Kinds of meter and terms" }, { id: "which", kicker: "Find the meter" }, { id: "bars", kicker: "Add the bar lines" }, { id: "beam", kicker: "Beaming and asymmetrical grouping" }, { id: "device", kicker: "Pick-ups, syncopation, hemiola" }],
    topics: [],
  };
})();
// ===== Test yourself quiz (engine adds it as the step before Practice; s = step to look back at) =====
window.FAM.quiz = [{"s": 1, "q": "Quadruple meter's pattern of strong and weak beats is…", "a": "strong–weak–medium–weak", "w": ["strong–weak", "strong–weak–weak", "strong–strong–weak–weak"], "hint": "Duple is strong–weak and triple is strong–weak–weak. Quadruple adds a medium beat.", "why": "Beat 3 of a quadruple bar is medium-strong."}, {"s": 3, "q": "In 2/2 (cut time), which note gets the beat?", "a": "the half note", "w": ["the quarter note", "the whole note", "the eighth note"], "hint": "In simple meter the bottom number is the beat's note value: 4 = quarter, 2 = half.", "why": "2/2 has two half-note beats."}, {"s": 4, "q": "How many beats are in a bar of 12/8?", "a": "4", "w": ["12", "6", "3"], "hint": "In compound meter, divide the top number by 3.", "why": "12 ÷ 3 = 4 dotted-quarter beats: compound quadruple."}, {"s": 5, "q": "Six eighth notes beamed 3 + 3. Which time signature fits?", "a": "6/8", "w": ["3/4", "2/4", "3/8"], "hint": "3/4 beams its six eighths in pairs, one pair per beat.", "why": "Beaming in threes shows two compound beats: 6/8. In 3/4 they'd be beamed 2 + 2 + 2."}, {"s": 6, "q": "A bar of 7/8 beamed 2 + 2 + 3 has how many beats?", "a": "3, and they aren't equal", "w": ["7, all equal", "2, both equal", "3, all equal"], "hint": "Each beamed group is one beat in an asymmetrical meter.", "why": "Three beats: two short (2 eighths) and one long (3 eighths)."}, {"s": 7, "q": "A piece goes 3/4, 5/8, 2/4, 7/8 as a regular feature. That's…", "a": "mixed meter", "w": ["polymeter", "hemiola", "syncopation"], "hint": "Two meters at the same time has a different name.", "why": "Changing time signatures as an ongoing feature is mixed meter. Polymeter is two meters at once."}, {"s": 8, "q": "How should eighth notes be beamed in 6/8?", "a": "in threes", "w": ["in pairs", "in fours", "all six together"], "hint": "Beam by beat, and a 6/8 beat is a dotted quarter.", "why": "Each dotted-quarter beat holds three eighths, so beam in threes."}, {"s": 9, "q": "In older vocal music, beams showed…", "a": "the syllables of the text (joined notes shared one syllable: a melisma)", "w": ["the beat, as in instrumental music", "the dynamics", "which notes to breathe after"], "hint": "Every new syllable got its own flagged note.", "why": "Traditional vocal beaming followed the text. Modern editions usually beam by beat."}, {"s": 10, "q": "A piece in 3/4 begins with a single quarter-note pick-up. Which bar is usually bar 1?", "a": "the first complete bar", "w": ["the pick-up bar", "the last bar", "the bar after the first phrase"], "hint": "Bar numbering skips the incomplete bar.", "why": "Bar numbering usually starts with the first complete bar."}, {"s": 11, "q": "An eighth–quarter–eighth rhythm puts the longest note on the offbeat. That's…", "a": "syncopation", "w": ["hemiola", "an anacrusis", "compound meter"], "hint": "It starts a note between beats and holds it into an accented spot.", "why": "Starting on an offbeat and sustaining into a stronger position is syncopation."}, {"s": 12, "q": "Two bars of 3/4 heard as three half notes, just before a cadence, is a…", "a": "hemiola", "w": ["syncopation", "mixed meter", "pick-up"], "hint": "Three groups in the time of two.", "why": "Six beats regrouped 3 × 2 instead of 2 × 3 is the classic hemiola."}, {"s": 1, "q": "Triple meter's pattern of strong and weak beats is…", "a": "strong–weak–weak", "w": ["strong–weak", "strong–weak–medium–weak", "weak–strong–weak"], "hint": "Three beats.", "why": "Triple meter: one strong beat, then two weak ones."}, {"s": 1, "q": "In simple meter, each beat divides into…", "a": "two", "w": ["three", "four", "unequal groups"], "hint": "1 & 2 &.", "why": "Simple meter divides the beat in two; compound in three."}, {"s": 2, "q": "A meter whose beats are unequal, mixing groups of two and three, is…", "a": "asymmetrical (additive)", "w": ["compound", "simple", "mixed"], "hint": "1 & 2 & a.", "why": "Asymmetrical meters combine beats of two and three divisions."}, {"s": 2, "q": "In compound meter, how is a beat counted?", "a": "1 & a", "w": ["1 & 2 &", "1 e & a", "1 2 3 4"], "hint": "Three divisions per beat.", "why": "Each compound beat divides in three: 1 & a."}, {"s": 3, "q": "In a simple time signature, what does the bottom number show?", "a": "the note value that gets the beat", "w": ["the number of beats", "the tempo", "how many bars to play"], "hint": "4 = quarter, 2 = half.", "why": "The top number counts beats; the bottom names the beat's note value."}, {"s": 4, "q": "How many beats are in a bar of 6/8?", "a": "2", "w": ["6", "3", "4"], "hint": "Divide the top number by 3.", "why": "6/8 is compound duple: two dotted-quarter beats."}, {"s": 4, "q": "In compound meter, the beat is…", "a": "a dotted note", "w": ["always a quarter note", "an eighth note", "a half note"], "hint": "It divides into three.", "why": "Compound beats are dotted values, like the dotted quarter in 6/8."}, {"s": 5, "q": "A bar of 3/4 and a bar of 6/8 both hold six eighths. How do they differ?", "a": "3/4 has three beats in twos; 6/8 has two beats in threes", "w": ["they're identical", "6/8 is always faster", "3/4 has six beats"], "hint": "Look at the beaming.", "why": "Same total, different grouping: 2 + 2 + 2 versus 3 + 3."}, {"s": 5, "q": "12/8 often sounds like 4/4 with…", "a": "a shuffle or triplet feel", "w": ["half as many beats", "a faster tempo", "no strong beats"], "hint": "Each beat divides in three.", "why": "Four beats in both, but 12/8's beats divide in three."}, {"s": 6, "q": "How can 5/8 be grouped?", "a": "2 + 3 or 3 + 2", "w": ["only 2 + 2 + 1", "5 equal beats", "only 3 + 2"], "hint": "Groups of two and three eighths.", "why": "Asymmetrical meters mix groups of two and three; the beaming shows which."}, {"s": 7, "q": "A mixed-meter change falls at the start of a new line. What else do you write?", "a": "a cautionary time signature at the end of the system before it", "w": ["nothing", "a double bar", "a repeat sign"], "hint": "Warn the reader ahead of time.", "why": "The cautionary time signature at the end of the line warns of the change."}, {"s": 7, "q": "Two different meters sounding at the same time is…", "a": "polymeter", "w": ["mixed meter", "hemiola", "syncopation"], "hint": "Poly = many at once.", "why": "Mixed meter changes over time; polymeter layers meters simultaneously."}, {"s": 8, "q": "In 4/4, eighth notes may be beamed in fours, but never…", "a": "across the middle of the bar (beats 2–3)", "w": ["in pairs", "on beat 1", "with a rest inside"], "hint": "Keep the half bar visible.", "why": "Beaming across beats 2–3 hides the middle of the bar."}, {"s": 8, "q": "How are sixteenth notes beamed?", "a": "by beat, four per quarter-note beat", "w": ["eight at a time", "by half bar", "one flag each"], "hint": "Show the beat.", "why": "Sixteenths are beamed by beat, with secondary beams showing subdivision."}, {"s": 9, "q": "In vocal music, what joins the notes of a melisma?", "a": "a slur", "w": ["a tie", "a hyphen", "an extender line"], "hint": "One syllable, several notes.", "why": "A slur joins a melisma; hyphens and extenders belong to the lyrics."}, {"s": 9, "q": "A word's last syllable is sung to a melisma. What follows it under the notes?", "a": "an extender line", "w": ["a hyphen", "a slur", "nothing"], "hint": "Hyphens are for between syllables.", "why": "The extender line shows the final syllable is held through the melisma."}, {"s": 10, "q": "Traditionally, a piece that starts with a pick-up ends with…", "a": "a shortened final bar that completes the pick-up's bar", "w": ["an extra full bar", "a fermata", "a repeat"], "hint": "The two together make one full bar.", "why": "The pick-up and the shortened last bar add up to one bar (though many pieces end with a full bar)."}, {"s": 11, "q": "Syncopation puts the accent…", "a": "between the beats, on a weak beat or offbeat sustained into a strong position", "w": ["only on beat 1", "on every beat equally", "only in compound meter"], "hint": "Against the beat.", "why": "A note starting off the beat and held into an accented spot shifts the accent."}, {"s": 12, "q": "Alternating 6/8 and 3/4 creates an effect related to…", "a": "hemiola", "w": ["syncopation", "an anacrusis", "mixed meter only"], "hint": "Two groups of three versus three groups of two.", "why": "6/8 (3 + 3) against 3/4 (2 + 2 + 2) is the hemiola's three-against-two."}];
