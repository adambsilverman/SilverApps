window.FAM = (() => {
  // ===== Meter and Beaming. Engine: build/harmony/engine.js =====
  const P = "B4";
  const tokN = x => { const rest = /r/.test(x), tie = /~/.test(x), d = x.replace(/[r~]/g, ""); return { k: rest ? [] : [P], d, tie }; };
  // percussion rhythm: bars are strings of tokens, or { r: "tokens", time: "5/8", groups: [...] }
  const rh = (time, bars, o = {}) => ({ type: "score", clefs: ["percussion"], time, vf: "C", sig: {}, bpm: o.bpm || 96, final: o.final, groups: o.groups, minBar: o.minBar, bars: bars.map(b => typeof b === "string" ? { t: [b.split(" ").map(tokN)] } : Object.assign({ t: [b.r.split(" ").map(tokN)] }, b.time ? { time: b.time } : {}, b.groups ? { groups: b.groups } : {}, b.minBar ? { minBar: b.minBar } : {})) });
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
    <div class="toy-row" role="group" aria-label="Meter">${Object.keys(MTR).map(m => `<button class="play" data-mpm="${m}" aria-pressed="${m === MP.m}">${m}</button>`).join("")}</div>
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
      <li><b>Compound</b>: every beat divides into <b>three</b> (1 la li 2 la li).</li>
      <li><b>Asymmetrical</b> (additive): the beats are <b>unequal</b>, mixing groups of two and three (1 & 1 la li).</li></ul>
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
      <p>The same idea works with quarter-note beats: 5/4 can be felt as 3 + 2 or 2 + 3. The beaming (or, with longer values, the way the notes are grouped) tells the performer which.</p>` },
    { title: "Mixed meter", kick: "Changing time signatures", render: (H, k, U) => {
      const sp = rh("3/4", ["q q q", { r: "8 8 8 8 8", time: "5/8", groups: ["3/8", "2/8"] }, { r: "q q", time: "2/4" }, { r: "8 8 8 8 8 8 8", time: "7/8", groups: ["2/8", "2/8", "3/8"] }, { r: "hd", time: "3/4" }]);
      return `<p><b>Mixed meter</b>: the time signature changes as a consistent feature of the music, not just once for a new section. Each change gets a new time signature; if a change falls at the start of a line, add a <b>cautionary</b> time signature at the end of the previous line.</p>`
        + U.fig(sp, "3/4, 5/8, 2/4, 7/8, 3/4: a new time signature at every change.", { play: H.withClick(sp) })
        + `<p>Some music changes meter so often that the beaming, not the time signature, is the clearest guide to the groups; other music grows or shrinks a repeating pattern by one note at a time. (Two meters at the <i>same</i> time is <b>polymeter</b>.)</p>`;
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
      + `<p>Alternating 6/8 and 3/4 (strong–weak / strong–weak–weak) is a related effect.</p>` },
    { title: "Quick check", kick: "Before the drills", render: (H) => H.check("6/8 is…", "compound duple", ["simple triple", "compound triple", "asymmetrical"], "Two dotted-quarter beats.") + H.check("7/8 grouped 2 + 2 + 3 is…", "asymmetrical", ["compound", "simple", "mixed"], "Unequal beats.") + H.check(FACTS[11][0], FACTS[11][1], FACTS[11][2], FACTS[11][3]) + H.check(FACTS[9][0], FACTS[9][1], FACTS[9][2], FACTS[9][3]) },
  ] };

  return {
    key: "silverapps-meter-v1", lesson, make, reference,
    modes: [{ id: "classify", kicker: "Kinds of meter" }, { id: "which", kicker: "Find the meter" }, { id: "group", kicker: "Asymmetrical grouping" }, { id: "beam", kicker: "Beaming" }, { id: "device", kicker: "Pick-ups, syncopation, hemiola" }, { id: "terms", kicker: "Terms" }],
    topics: [],
  };
})();
