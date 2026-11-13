
(() => {
  const $ = id => document.getElementById(id);
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const LET = "CDEFGAB", NAT = [0, 2, 4, 5, 7, 9, 11], ACC = { "-2": "𝄫", "-1": "♭", "0": "", "1": "♯", "2": "𝄪" }, SAY = { "-2": " double flat", "-1": " flat", "0": "", "1": " sharp", "2": " double sharp" };
  const pc = n => (((NAT[n.l] + n.a) % 12) + 12) % 12;
  const nm = n => LET[n.l] + ACC[n.a], sp = n => LET[n.l] + SAY[n.a];
  const midi = n => 12 * (n.o + 1) + NAT[n.l] + n.a;
  const spell = (t, i, semi) => { const l = (t.l + i) % 7, o = t.o + Math.floor((t.l + i) / 7); let d = (((pc(t) + semi - NAT[l]) % 12) + 12) % 12; if (d > 6) d -= 12; return { l, a: d, o }; };

  // ---------- data ----------
  const D = (id, name, fam, deg, tag, extra = {}) => Object.assign({ id, name, fam, deg, tag }, extra);
  const MAJ = [0, 2, 4, 5, 7, 9, 11], MIN = [0, 2, 3, 5, 7, 8, 10];
  const MODES = [
    D("lydian", "Lydian", "major", [0, 2, 4, 6, 7, 9, 11], "major ♯4", { solf: "FI instead of FA", ks: 1, rel: "F" }),
    D("ionian", "Ionian", "major", MAJ, "the major scale", { ks: 0, rel: "C", aka: "major" }),
    D("mixolydian", "Mixolydian", "major", [0, 2, 4, 5, 7, 9, 10], "major ♭7", { solf: "TE instead of TI", ks: -1, rel: "G" }),
    D("dorian", "Dorian", "minor", [0, 2, 3, 5, 7, 9, 10], "minor ♯6", { solf: "LA instead of LE", ks: -2, rel: "D" }),
    D("aeolian", "Aeolian", "minor", MIN, "natural minor", { ks: -3, rel: "A", aka: "natural minor" }),
    D("phrygian", "Phrygian", "minor", [0, 1, 3, 5, 7, 8, 10], "minor ♭2", { solf: "RA instead of RE", ks: -4, rel: "E" }),
    D("locrian", "Locrian", "minor", [0, 1, 3, 5, 6, 8, 10], "minor ♭2 ♭5", { solf: "RA and SE instead of RE and SOL", ks: -5, rel: "B" }),
  ];
  const BY = Object.fromEntries(MODES.map(m => [m.id, m]));
  const PADMIL = ["locrian", "phrygian", "aeolian", "dorian", "mixolydian", "ionian", "lydian"];
  const AUG = [
    { id: "harm", name: "Harmonic minor", deg: [0, 2, 3, 5, 7, 8, 11], par: MIN, tag: "minor ♯7", note: "The +2 sits between <span class='sd'>6</span> and <span class='sd'>7</span> (LE and TI). It's the only augmented 2nd in common-practice music." },
    { id: "hung", name: "Hungarian minor", deg: [0, 2, 3, 6, 7, 8, 11], par: MIN, tag: "minor ♯4 ♯7", note: "Two augmented 2nds: between <span class='sd'>3</span> and ♯<span class='sd'>4</span>, and between <span class='sd'>6</span> and <span class='sd'>7</span>." },
    { id: "freyg", name: "Phrygian dominant (Freygish)", deg: [0, 1, 4, 5, 7, 8, 10], par: MAJ, tag: "major ♭2 ♭6 ♭7", note: "The +2 sits between ♭<span class='sd'>2</span> and <span class='sd'>3</span>: the sound of much klezmer and flamenco music." },
    { id: "byz", name: "Byzantine", deg: [0, 1, 4, 5, 7, 8, 11], par: MAJ, tag: "major ♭2 ♭6", note: "Two augmented 2nds, between ♭<span class='sd'>2</span> and <span class='sd'>3</span> and between ♭<span class='sd'>6</span> and <span class='sd'>7</span>. Like Phrygian dominant but with ♮7." },
  ];
  const PEN = [
    { id: "majp", name: "Major pentatonic", tonic: { l: 0, a: 0, o: 4 }, items: [[0, 0], [1, 2], [2, 4], [4, 7], [5, 9]], tag: "major without 4 and 7", note: "C D E G A: whole steps and minor 3rds only." },
    { id: "minp", name: "Minor pentatonic", tonic: { l: 5, a: 0, o: 3 }, items: [[0, 0], [2, 3], [3, 5], [4, 7], [6, 10]], tag: "natural minor without 2 and ♭6", note: "A C D E G: the same notes as C major pentatonic, starting on A — relatives." },
    { id: "blues", name: "Blues scale", tonic: { l: 5, a: 0, o: 3 }, items: [[0, 0], [2, 3], [3, 5], [3, 6], [4, 7], [6, 10]], tag: "minor pentatonic + ♯4/♭5", note: "A C D D♯ E G: the added ‘blue note’ may be spelled ♯4 (D♯) or ♭5 (E♭)." },
  ];
  const SYM = [
    { id: "wt", name: "Whole-tone", semis: [0, 2, 4, 6, 8, 10], letters: [0, 1, 2, 3, 4, 5], tag: "all whole steps · 6 notes · 2 collections", period: 2 },
    { id: "oct1", name: "Octatonic (W–H)", semis: [0, 2, 3, 5, 6, 8, 9, 11], letters: [0, 1, 2, 3, 3, 4, 5, 6], tag: "whole, half, whole, half… · 8 notes · 3 collections", period: 3 },
    { id: "oct2", name: "Octatonic (H–W)", semis: [0, 1, 3, 4, 6, 7, 9, 10], letters: [0, 1, 2, 2, 3, 4, 5, 6], tag: "half, whole, half, whole… · 8 notes · 3 collections", period: 3 },
  ];
  const scale = (t, deg) => deg.map((s, i) => spell(t, i, s)).concat([{ l: t.l, a: t.a, o: t.o + 1 }]);
  const stepNames = (semis, m3) => { const all = semis.concat(12); return all.slice(1).map((v, i) => { const d = v - all[i]; return d === 1 ? "H" : d === 2 ? "W" : d === 3 ? (m3 ? "m3" : "+2") : String(d); }); };   // m3: a 3-half-step gap that skips a letter (pentatonic, blues)
  const stepsHTML = (semis, hilite = [], m3) => stepNames(semis, m3).map((s, i) => `<span class="${s === "H" ? "H" : s === "+2" ? "A" : ""}" ${hilite.includes(i) ? 'style="outline:3px solid var(--fi-red-dk)"' : ""}>${s}</span>`).join("");
  const changed = (deg, par) => deg.map((v, i) => par && v !== par[i]);

  // ---------- sound ----------
  let AC = null, bus = null;
  function ac() { if (!AC) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; AC = new C(); const c = AC.createDynamicsCompressor(); c.threshold.value = -14; c.connect(AC.destination); AC._o = c; } if (AC.state === "suspended") AC.resume(); return AC; }
  function newBus() { if (bus) { const o = bus; o.gain.setTargetAtTime(0, AC.currentTime, .03); setTimeout(() => o.disconnect(), 300); } bus = AC.createGain(); bus.connect(AC._o); return bus; }
  function note(out, m, t, d, v = .3) {
    const f = 440 * Math.pow(2, (m - 69) / 12), g = AC.createGain(), lp = AC.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.setValueAtTime(Math.min(f * 8, 8000), t); lp.frequency.exponentialRampToValueAtTime(Math.max(f * 2, 400), t + 1); g.connect(out); lp.connect(g);
    [[1, 1], [2, .4], [3, .18], [4, .08]].forEach(([h, a]) => { const o = AC.createOscillator(); o.type = h === 1 ? "triangle" : "sine"; o.frequency.value = f * h; const og = AC.createGain(); og.gain.value = a; o.connect(og); og.connect(lp); o.start(t); o.stop(t + d + .8); });
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .01); g.gain.setTargetAtTime(v * .35, t + .02, .35); g.gain.setTargetAtTime(0, t + d, .15);
  }
  function seq(ms, gap = .34, onStep) { if (!ac()) return; const out = newBus(), t0 = AC.currentTime + .06; ms.forEach((m, i) => { (Array.isArray(m) ? m : [m]).forEach(x => x != null && note(out, x, t0 + i * gap, i === ms.length - 1 ? 1.2 : gap * .95, Array.isArray(m) ? .2 : .3)); if (onStep) setTimeout(() => onStep(i), (i * gap + .06) * 1000); }); return t0; }
  const playScale = (notes, extraFirst = []) => seq(extraFirst.concat(notes.map(midi)), .32);

  // ---------- staff (VexFlow) ----------
  const VFA = { "-2": "bb", "-1": "b", "0": "n", "1": "#", "2": "##" };
  const KSN = { "-7": "Cb", "-6": "Gb", "-5": "Db", "-4": "Ab", "-3": "Eb", "-2": "Bb", "-1": "F", "0": "C", "1": "G", "2": "D", "3": "A", "4": "E", "5": "B", "6": "F#", "7": "C#" };
  const SHARP_ORD = [3, 0, 4, 1, 5, 2, 6], FLAT_ORD = [6, 2, 5, 1, 4, 0, 3];
  const sigAccs = n => { const a = [0, 0, 0, 0, 0, 0, 0]; if (n > 0) SHARP_ORD.slice(0, n).forEach(l => a[l] = 1); if (n < 0) FLAT_ORD.slice(0, -n).forEach(l => a[l] = -1); return a; };
  function staff(box, notes, o = {}) {
    if (typeof box === "string") box = $(box);
    box.innerHTML = "";
    if (!window.Vex || !Vex.Flow) { box.textContent = notes.map(nm).join(" "); return; }
    const VF = Vex.Flow, ink = css("--fi-ink"), red = css("--fi-red-dk");
    const r = new VF.Renderer(box, VF.Renderer.Backends.SVG), W = 40 + notes.length * 44 + (o.ks != null ? 70 : 0) + 60; r.resize(W, 150);
    const ctx = r.getContext(); ctx.setFillStyle(ink); ctx.setStrokeStyle(ink);
    const st = new VF.Stave(4, 20, W - 8); st.addClef("treble"); if (o.ks != null) st.addKeySignature(KSN[o.ks]); st.setStyle({ fillStyle: ink, strokeStyle: ink }); st.setContext(ctx).draw();
    const base = sigAccs(o.ks || 0); let curA = {};
    const sns = [];
    notes.forEach((n, i) => {
      if (o.barAt && i === o.barAt) { sns.push(new VF.BarNote()); curA = {}; }
      const sn = new VF.StaveNote({ clef: "treble", keys: [LET[n.l].toLowerCase() + "/" + n.o], duration: "w" }), key = n.o * 7 + n.l;
      const implied = key in curA ? curA[key] : base[n.l], c = o.colors && o.colors[i] ? red : ink;
      sn.setStyle({ fillStyle: c, strokeStyle: c }); if (sn.setLedgerLineStyle) sn.setLedgerLineStyle({ strokeStyle: ink, fillStyle: ink });
      if (n.a !== implied || (o.colors && o.colors[i] && o.ks != null)) { const acc = new VF.Accidental(VFA[n.a]); if (n.a === implied) acc.setAsCautionary(); acc.setStyle({ fillStyle: c, strokeStyle: c }); sn.addModifier(acc, 0); }
      curA[key] = n.a; sns.push(sn);
    });
    const voice = new VF.Voice({ num_beats: 4 * notes.length, beat_value: 4 }).setMode(VF.Voice.Mode.SOFT).addTickables(sns);
    new VF.Formatter().joinVoices([voice]).format([voice], st.getNoteEndX() - st.getNoteStartX() - 16); voice.draw(ctx, st);
    const svg = box.querySelector("svg");
    try { const bb = svg.getBBox(); svg.setAttribute("viewBox", `${bb.x - 4} ${bb.y - 6} ${bb.width + 8} ${bb.height + 12}`); } catch (e) {}
    svg.removeAttribute("width"); svg.removeAttribute("height"); svg.removeAttribute("style"); svg.style.width = "100%"; svg.style.height = "auto";
    svg.setAttribute("role", "img"); svg.setAttribute("aria-label", o.label || `Treble staff: ${notes.map(sp).join(", ")}.`);
  }

  // ---------- keyboard ----------
  function keyboard(box, notes, o = {}) {
    if (typeof box === "string") box = $(box);
    box.innerHTML = "";
    const ms = notes.map(midi), start = 48 + 12 * Math.floor((Math.min(...ms) - 48) / 12), whites = []; let k = start; while (whites.length < 15) { if (![1, 3, 6, 8, 10].includes(k % 12)) whites.push(k); k++; }
    const end = whites[whites.length - 1], KW = 22, W = whites.length * KW + 2, H = 92, X = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": o.label || `Keyboard with ${notes.map(sp).join(", ")} highlighted.` });
    const on = new Set(ms), red = new Set((o.red || []).map(midi)), xOf = {};
    whites.forEach((m, i) => { xOf[m] = 1 + i * KW; el("rect", { x: 1 + i * KW, y: 4, width: KW, height: 84, rx: 3, fill: red.has(m) ? css("--fi-red") : on.has(m) ? "#FFE07A" : "#fff", stroke: css("--fi-line"), "stroke-width": 1.2 }, X); });
    for (let m = start; m <= end; m++) if ([1, 3, 6, 8, 10].includes(m % 12)) { const x = xOf[m - 1] + KW - 7; xOf[m] = x; el("rect", { x, y: 4, width: 14, height: 52, rx: 2, fill: red.has(m) ? css("--fi-red-dk") : on.has(m) ? "#C79A1E" : css("--fi-ink"), stroke: on.has(m) ? css("--fi-ink") : "none" }, X); }
    notes.forEach(n => { const m = midi(n); if (xOf[m] == null) return; const blk = [1, 3, 6, 8, 10].includes(m % 12); const t = el("text", { x: xOf[m] + (blk ? 7 : KW / 2), y: blk ? 50 : 82, "text-anchor": "middle", "font-size": blk ? 8 : 10, "font-weight": 700, "font-family": "Literata, serif", fill: blk || red.has(m) ? "#fff" : css("--fi-ink") }, X); t.textContent = nm(n); });
    box.appendChild(X);
  }
  const btnRow = (id, items, cur, onPick, cls = "lbtn") => { $(id).innerHTML = items.map(([v, label, small]) => `<button type="button" class="${cls}" data-v="${v}" aria-pressed="${v === cur}">${small !== undefined ? `<b>${label}</b><small>${small}</small>` : label}</button>`).join(""); $(id).onclick = e => { const b = e.target.closest("[data-v]"); if (b) onPick(b.dataset.v); }; };

  // ---------- steps ----------
  document.addEventListener("play", e => { if (e.target.tagName === "AUDIO") document.querySelectorAll(".mex audio").forEach(x => { if (x !== e.target) x.pause(); }); }, true);   // one excerpt at a time
  const slides = [...document.querySelectorAll(".slide")], stepsEl = $("steps"), SL = t => slides.find(x => x.dataset.title === t);
  let cur = 0; const seen = new Set([0]);
  slides.forEach((s, i) => { const li = document.createElement("li"); li.innerHTML = `<button type="button" aria-label="Step ${i + 1}: ${s.dataset.title}">${i + 1}</button>`; li.firstChild.onclick = () => go(i, true); stepsEl.appendChild(li); });
  function go(i, focus) {
    cur = Math.max(0, Math.min(slides.length - 1, i)); seen.add(cur);
    slides.forEach((s, k) => s.hidden = k !== cur);
    [...stepsEl.querySelectorAll("button")].forEach((b, k) => { b.removeAttribute("aria-current"); if (k === cur) b.setAttribute("aria-current", "step"); b.classList.toggle("seen", seen.has(k)); });
    $("back").disabled = cur === 0; $("fwd").textContent = cur === slides.length - 1 ? "Start the drills →" : "Next →";
    $("where").textContent = `Step ${cur + 1} of ${slides.length}: ${slides[cur].dataset.title}`;
    if (focus) { const h = slides[cur].querySelector("h2"); h.tabIndex = -1; h.focus(); }
    if (slides[cur].onshow) slides[cur].onshow();
    try { localStorage.setItem("silverapps-modes-step", cur); } catch (e) {}
  }
  $("back").onclick = () => go(cur - 1, true);
  $("fwd").onclick = () => (cur === slides.length - 1 ? (location.href = "modes-trainer.html") : go(cur + 1, true));
  document.addEventListener("keydown", e => { if (e.target.closest("input,textarea,select")) return; if (e.key === "ArrowRight") go(cur + 1, true); if (e.key === "ArrowLeft") go(cur - 1, true); });

  // 1. relative modes
  // parent major keys: [label, letter, accidental, key-signature count]
  const PARENTS = [["C", 0, 0, 0], ["G", 4, 0, 1], ["D", 1, 0, 2], ["A", 5, 0, 3], ["E", 2, 0, 4], ["B", 6, 0, 5], ["F♯", 3, 1, 6], ["F", 3, 0, -1], ["B♭", 6, -1, -2], ["E♭", 2, -1, -3], ["A♭", 5, -1, -4], ["D♭", 1, -1, -5], ["G♭", 4, -1, -6]];
  const DEG_MODES = ["ionian", "dorian", "phrygian", "lydian", "mixolydian", "aeolian", "locrian"];
  const ORD = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"];
  let relKey = 0, relDeg = 1;
  try { const v = JSON.parse(localStorage.getItem("silverapps-modes-rel") || "null"); if (v) { relKey = v[0]; relDeg = v[1]; } } catch (e) {}
  $("relKey").innerHTML = PARENTS.map((p, i) => `<option value="${i}">${p[0]} major (${p[3] === 0 ? "no sharps or flats" : Math.abs(p[3]) + (p[3] > 0 ? " sharp" : " flat") + (Math.abs(p[3]) > 1 ? "s" : "")})</option>`).join("");
  const relNotes = () => {
    const P = PARENTS[relKey], pt = { l: P[1], a: P[2], o: 4 }, m = BY[DEG_MODES[relDeg]], t0 = spell(pt, relDeg, MAJ[relDeg]);
    const t = { l: t0.l, a: t0.a, o: t0.l >= 5 ? 3 : 4 }; return { P, m, t, ns: scale(t, m.deg) };
  };
  function drawRel(play) {
    const { P, m, t, ns } = relNotes(), pt = { l: P[1], a: P[2], o: 4 };
    $("relKey").value = relKey;
    btnRow("relBtns", DEG_MODES.map((id, i) => [String(i), `${i + 1} → ${nm(spell(pt, i, MAJ[i]))} ${BY[id].name}`]), String(relDeg), v => { relDeg = +v; save(); drawRel(true); });
    $("relRead").innerHTML = `${nm(t)} ${m.name}<small>The notes of ${P[0]} major, from its ${ORD[relDeg]} degree (${nm(t)}) to ${nm(t)}: ${m.fam} 3rd above the tonic.</small>`;
    staff("relStaff", ns, { ks: P[3], label: `${nm(t)} ${m.name}, with the key signature of ${P[0]} major: ${ns.map(sp).join(", ")}.` }); keyboard("relKb", ns); $("relSteps").innerHTML = stepsHTML(m.deg);
    if (play) playScale(ns);
  }
  const save = () => { try { localStorage.setItem("silverapps-modes-rel", JSON.stringify([relKey, relDeg])); } catch (e) {} };
  $("relKey").onchange = e => { relKey = +e.target.value; save(); drawRel(true); };
  $("relPlay").onclick = () => playScale(relNotes().ns);
  SL("Relative modes").onshow = () => drawRel(false);

  // 2. parallel modes on C
  let par = "dorian";
  const C4 = { l: 0, a: 0, o: 4 };
  function drawPar(play) {
    const m = BY[par], ns = scale(C4, m.deg), parent = m.fam === "major" ? MAJ : MIN, ch = changed(m.deg, parent).concat([false]);
    btnRow("parBtns", MODES.map(x => [x.id, x.name, x.tag]), par, v => { par = v; drawPar(true); }, "mcard");
    $("parBtns").querySelectorAll(".mcard").forEach(b => b.classList.add(BY[b.dataset.v].fam === "major" ? "maj" : "min"));
    $("parRead").innerHTML = `C ${m.name}: <span class="chg">${m.tag}</span><small>${m.solf ? `Sounds like ${m.fam === "major" ? "major" : "natural minor"} with ${m.solf}.` : `This is the ${m.aka} scale itself.`}</small>`;
    staff("parStaff", ns, { colors: ch, label: `C ${m.name}: ${ns.map(sp).join(", ")}.` }); keyboard("parKb", ns, { red: ns.filter((n, i) => ch[i]) }); $("parSteps").innerHTML = stepsHTML(m.deg);
    if (play) playScale(ns);
  }
  $("parPlay").onclick = () => playScale(scale(C4, BY[par].deg));
  $("parCmp").onclick = () => { const m = BY[par], p = scale(C4, m.fam === "major" ? MAJ : MIN), ns = scale(C4, m.deg); seq(p.map(midi).concat([null]).concat(ns.map(midi)), .3); };
  SL("Parallel modes").onshow = () => drawPar(false);

  // 3. families
  let famPick = null;
  function drawFam(play) {
    const mk = list => list.map(x => `<button type="button" class="mcard ${x.fam === "major" ? "maj" : "min"}" data-v="${x.id}" aria-pressed="${x.id === famPick}"><b>${x.name}</b><small>${x.tag}${x.solf ? ` · ${x.solf}` : ""}</small></button>`).join("");
    $("famMaj").innerHTML = mk(MODES.filter(x => x.fam === "major")); $("famMin").innerHTML = mk(MODES.filter(x => x.fam === "minor"));
    if (!famPick) return;
    const m = BY[famPick], parent = m.fam === "major" ? MAJ : MIN, p = scale(C4, parent), ns = scale(C4, m.deg), ch = changed(m.deg, parent).concat([false]);
    $("famRead").innerHTML = `C ${m.name} = ${m.fam === "major" ? "C major" : "C natural minor"} ${m.solf ? `with <span class="chg">${m.solf}</span>` : "exactly"}<small>Listen: the parent scale first, then the mode. The red note is the one that changes.</small>`;
    $("famStaff").hidden = false; staff("famStaffIn", p.concat(ns), { barAt: p.length, colors: p.map(() => false).concat(ch), label: `Parent scale ${p.map(sp).join(", ")}, then C ${m.name} ${ns.map(sp).join(", ")}; changed notes highlighted.` });
    if (play) seq(p.map(midi).concat([null]).concat(ns.map(midi)), .28);
  }
  ["famMaj", "famMin"].forEach(id => $(id).onclick = e => { const b = e.target.closest("[data-v]"); if (b) { famPick = b.dataset.v; drawFam(true); } });
  SL("Major or minor?").onshow = () => drawFam(false);

  // 4. PADMIL
  const TONICS = [["C", { l: 0, a: 0 }], ["C♯", { l: 0, a: 1 }], ["D♭", { l: 1, a: -1 }], ["D", { l: 1, a: 0 }], ["D♯", { l: 1, a: 1 }], ["E♭", { l: 2, a: -1 }], ["E", { l: 2, a: 0 }], ["F", { l: 3, a: 0 }], ["F♯", { l: 3, a: 1 }], ["G♭", { l: 4, a: -1 }], ["G", { l: 4, a: 0 }], ["G♯", { l: 4, a: 1 }], ["A♭", { l: 5, a: -1 }], ["A", { l: 5, a: 0 }], ["A♯", { l: 5, a: 1 }], ["B♭", { l: 6, a: -1 }], ["B", { l: 6, a: 0 }]];
  $("pdTon").innerHTML = TONICS.map(([n]) => `<option value="${n}">${n}</option>`).join("");
  $("pdTon").onchange = e => { pdT = e.target.value; drawPd(true); };
  const LETF = [0, 2, 4, -1, 1, 3, 5], majSig = t => LETF[t.l] + 7 * t.a;
  let pdT = "C", pdI = 5;
  const tonicOf = name => { const t = TONICS.find(x => x[0] === name)[1]; return { l: t.l, a: t.a, o: t.l >= 5 ? 3 : 4 }; };
  function drawPd(play) {
    $("pdTon").value = pdT;
    $("pdBtns").innerHTML = PADMIL.map((id, i) => `${i ? '<span class="arr" aria-hidden="true">→</span>' : ""}<button type="button" data-i="${i}" aria-pressed="${i === pdI}">${id === "locrian" ? "Lo" : BY[id].name[0]}</button>`).join("");
    const t = tonicOf(pdT), m = BY[PADMIL[pdI]], ns = scale(t, m.deg), ks = majSig(t) + m.ks;
    const prev = pdI > 0 ? BY[PADMIL[pdI - 1]] : null, ch = prev ? m.deg.map((v, i) => v !== prev.deg[i]).concat([false]) : null;
    const RAISE = { 1: "<span class='sd'>5</span> (SE → SOL)", 2: "<span class='sd'>2</span> (RA → RE)", 3: "<span class='sd'>6</span> (LE → LA)", 4: "<span class='sd'>3</span> (ME → MI)", 5: "<span class='sd'>7</span> (TE → TI)", 6: "<span class='sd'>4</span> (FA → FI)" };
    $("pdRead").innerHTML = `${nm(t)} ${m.name}: ${Math.abs(ks) > 7 ? `${Math.abs(ks)} ${ks > 0 ? "sharps" : "flats"} (impractical)` : ks === 0 ? "no sharps or flats" : `${Math.abs(ks)} ${ks > 0 ? "sharp" : "flat"}${Math.abs(ks) > 1 ? "s" : ""}`}<small>${prev ? `From ${prev.name}, raise ${RAISE[pdI]} by a half step (shown in red).` : "Locrian: the far left. Lower <span class='sd'>5</span> of Phrygian to get here."}</small>`;
    $("pdBtns").querySelectorAll("button").forEach(b => b.setAttribute("aria-label", BY[PADMIL[+b.dataset.i]].name));
    if (Math.abs(ks) <= 7) staff("pdStaff", ns, { ks, colors: ch, label: `${nm(t)} ${m.name} with a key signature of ${ks} ${ks >= 0 ? "sharps" : "flats"}.` }); else $("pdStaff").textContent = `A key signature can hold at most 7 ${ks > 0 ? "sharps" : "flats"}, so ${nm(t)} ${m.name} is usually written enharmonically instead (try ${ks > 0 ? "the flat" : "the sharp"} spelling of this tonic).`;
    keyboard("pdKb", ns, { red: ch ? ns.filter((n, i) => ch[i]) : [] });
    $("pdLeft").disabled = pdI === 0; $("pdRight").disabled = pdI === PADMIL.length - 1;
    if (play) playScale(ns);
  }
  $("pdBtns").onclick = e => { const b = e.target.closest("[data-i]"); if (b) { pdI = +b.dataset.i; drawPd(true); } };
  $("pdLeft").onclick = () => { if (pdI > 0) { pdI--; drawPd(true); } }; $("pdRight").onclick = () => { if (pdI < 6) { pdI++; drawPd(true); } };
  $("pdPlay").onclick = () => playScale(scale(tonicOf(pdT), BY[PADMIL[pdI]].deg));
  SL("PADMIL").onshow = () => drawPd(false);

  // 5. key signatures
  let ksT = "D", ksM = "mixolydian";
  const sigWords = n => n === 0 ? "no sharps or flats" : `${Math.abs(n)} ${n > 0 ? "sharp" : "flat"}${Math.abs(n) > 1 ? "s" : ""}`;
  function drawKs(play) {
    btnRow("ksTon", TONICS.map(([n]) => [n, n]), ksT, v => { ksT = v; drawKs(true); }, "pkb");
    btnRow("ksModes", MODES.map(x => [x.id, x.name, `${x.ks > 0 ? "+" : x.ks < 0 ? "" : "±"}${x.ks} from major`]), ksM, v => { ksM = v; drawKs(true); }, "mcard");
    const t = tonicOf(ksT), m = BY[ksM], maj = majSig(t), ks = maj + m.ks, ns = scale(t, m.deg);
    $("ksRead").innerHTML = Math.abs(ks) > 7 ? `${nm(t)} ${m.name} would need more than 7 flats<small>Choose another tonic or mode.</small>` : `${nm(t)} ${m.name}: ${sigWords(ks)}<small>${nm(t)} major has ${sigWords(maj)}; ${m.name} is ${m.ks === 0 ? "the same" : m.ks > 0 ? "one sharp more (or one flat fewer)" : `${-m.ks} flat${m.ks < -1 ? "s" : ""} more (or ${-m.ks} sharp${m.ks < -1 ? "s" : ""} fewer)`}, so ${maj} ${m.ks >= 0 ? "+" : "−"} ${Math.abs(m.ks)} = ${ks > 0 ? ks + "♯" : ks < 0 ? -ks + "♭" : "0"}.</small>`;
    if (Math.abs(maj) <= 7) staff("ksMaj", scale(t, MAJ), { ks: maj, label: `${nm(t)} major with ${sigWords(maj)}.` });
    if (Math.abs(ks) <= 7) staff("ksMod", ns, { ks, label: `${nm(t)} ${m.name} with ${sigWords(ks)}.` }); else $("ksMod").textContent = "—";
    if (play && Math.abs(ks) <= 7) playScale(ns);
  }
  SL("Key signatures").onshow = () => drawKs(false);

  // 6. by ear
  let ear = null, earR = 0, earN = 0;
  const earPlay = () => { if (ear) playScale(ear.ns); };
  function earNew() {
    const m = MODES[Math.floor(Math.random() * MODES.length)], t = { l: [0, 1, 3, 4, 5][Math.floor(Math.random() * 5)], a: 0, o: 4 };
    t.o = t.l >= 5 ? 3 : 4; ear = { m, t, ns: scale(t, m.deg), done: false };
    btnRow("earOpts", MODES.map(x => [x.id, x.name, x.tag]), null, v => earPick(v), "mcard");
    $("earRead").textContent = ""; earPlay();
  }
  function earPick(v) {
    if (!ear || ear.done) return; ear.done = true; earN++;
    const ok = v === ear.m.id; if (ok) earR++;
    if (window.SFX) SFX.play(ok);
    $("earOpts").querySelectorAll("[data-v]").forEach(b => { b.disabled = true; if (b.dataset.v === ear.m.id) b.style.background = css("--fi-green"); else if (b.dataset.v === v) b.style.background = css("--fi-red-pale"); });
    $("earRead").innerHTML = `${ok ? "Yes!" : "Not quite."} It was ${nm(ear.t)} ${ear.m.name}<small>${ear.m.fam} 3rd; ${ear.m.tag}${ear.m.solf ? ` (${ear.m.solf})` : ""}.</small>`;
    $("earScore").textContent = `${earR} of ${earN} correct so far.`;
  }
  $("earNew").onclick = earNew; $("earAgain").onclick = earPlay;
  $("earDrone").onclick = () => { if (ear) seq([midi(ear.ns[0]), [midi(ear.ns[0]), midi(ear.ns[2])]], .5); };
  SL("By ear").onshow = () => { if (!ear) btnRow("earOpts", MODES.map(x => [x.id, x.name, x.tag]), null, v => earPick(v), "mcard"); };

  // 7. augmented 2nds
  let aug = "harm";
  function drawAug(play) {
    const s = AUG.find(x => x.id === aug), ns = scale(C4, s.deg), ch = changed(s.deg, s.par).concat([false]);
    btnRow("augBtns", AUG.map(x => [x.id, x.name, x.tag]), aug, v => { aug = v; drawAug(true); }, "mcard");
    const plus = stepNames(s.deg).map((x, i) => x === "+2" ? i : -1).filter(i => i >= 0);
    $("augRead").innerHTML = `C ${s.name}: ${s.tag}<small>${s.note}</small>`;
    staff("augStaff", ns, { colors: ch }); keyboard("augKb", ns, { red: ns.filter((n, i) => ch[i]) }); $("augSteps").innerHTML = stepsHTML(s.deg, plus);
    if (play) playScale(ns);
  }
  $("augPlay").onclick = () => { const s = AUG.find(x => x.id === aug); playScale(scale(C4, s.deg)); };
  SL("Augmented 2nds").onshow = () => drawAug(false);

  // 8. pentatonic & blues
  let pen = "majp";
  function drawPen(play) {
    const s = PEN.find(x => x.id === pen), ns = s.items.map(([i, se]) => spell(s.tonic, i, se)).concat([{ ...s.tonic, o: s.tonic.o + 1 }]);
    btnRow("penBtns", PEN.map(x => [x.id, x.name, x.tag]), pen, v => { pen = v; drawPen(true); }, "mcard");
    $("penRead").innerHTML = `${nm(s.tonic)} ${s.name}<small>${s.note}</small>`;
    staff("penStaff", ns); keyboard("penKb", ns, { red: pen === "blues" ? [ns[3]] : [] }); $("penSteps").innerHTML = stepsHTML(s.items.map(x => x[1]), [], true);
    if (play) playScale(ns);
  }
  $("penPlay").onclick = () => { const s = PEN.find(x => x.id === pen); playScale(s.items.map(([i, se]) => spell(s.tonic, i, se)).concat([{ ...s.tonic, o: s.tonic.o + 1 }])); };
  SL("Pentatonic & blues").onshow = () => drawPen(false);

  // 9. symmetrical
  let sym = "wt", rot = 0;
  const PCN = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
  function drawSym(play) {
    const s = SYM.find(x => x.id === sym), svg = $("symSvg"); svg.querySelectorAll(":scope > :not(desc)").forEach(x => x.remove());
    btnRow("symBtns", SYM.map(x => [x.id, x.name, x.tag]), sym, v => { sym = v; rot = 0; drawSym(true); }, "mcard");
    const pcs = s.semis.map(x => (x + rot) % 12), cx = 160, cy = 160, R = 120, P = k => [cx + R * Math.sin(k / 12 * 2 * Math.PI), cy - R * Math.cos(k / 12 * 2 * Math.PI)];
    el("circle", { cx, cy, r: R, fill: "none", stroke: "#b9a9c2", "stroke-width": 2 }, svg);
    el("polygon", { points: pcs.map(P).map(p => p.join(",")).join(" "), fill: "rgba(142,69,148,.22)", stroke: css("--fi-purple"), "stroke-width": 3 }, svg);
    for (let k = 0; k < 12; k++) { const [x, y] = P(k), on = pcs.includes(k); el("circle", { cx: x, cy: y, r: on ? 16 : 12, fill: on ? css("--fi-purple") : css("--fi-card"), stroke: css("--fi-ink"), "stroke-width": 1.5 }, svg); const t = el("text", { x, y: y + 5, "text-anchor": "middle", "font-size": 13, "font-weight": 700, "font-family": "Barlow Condensed, sans-serif", fill: on ? "#fff" : css("--fi-ink") }, svg); t.textContent = PCN[k]; }
    // symmetrical scales are heard by pitch, so each note takes its simplest name (no double sharps or flats)
    const SPL = [[0, 0], [0, 1], [1, 0], [2, -1], [2, 0], [3, 0], [3, 1], [4, 0], [5, -1], [5, 0], [6, -1], [6, 0]];
    const byPc = m => { const [l, a] = SPL[((m % 12) + 12) % 12]; return { l, a, o: Math.floor((m - NAT[l] - a) / 12) - 1 }; };
    const t = byPc(60 + rot), ns = s.semis.map(se => byPc(60 + rot + se)).concat([byPc(72 + rot)]);
    staff("symStaff", ns); $("symSteps").innerHTML = stepsHTML(s.semis);
    const coll = rot % s.period;
    $("symRead").innerHTML = `${s.name} on ${nm(t)}<small>Collection ${coll + 1} of ${s.period}. ${rot >= s.period ? `Same notes as the scale ${rot - coll} half step${rot - coll > 1 ? "s" : ""} lower: it repeats.` : s.period === 2 ? "Move up a half step for the other collection; again and the first one returns." : "Move up a half step to reach the next collection; after 3 shifts it repeats."}</small>`;
    $("symDesc").textContent = `Pitch circle with ${pcs.map(k => PCN[k]).join(", ")} highlighted: a symmetrical shape.`;
    if (play) playScale(ns);
  }
  $("symRot").onclick = () => { rot = (rot + 1) % 12; drawSym(true); };
  $("symPlay").onclick = () => drawSym(true);
  SL("Symmetrical scales").onshow = () => drawSym(false);

  // 10. quiz
  const QZ = [
    ["Dorian sounds like…", ["natural minor with a raised 6th (LA)", "major with a lowered 7th (TE)", "natural minor with a lowered 2nd (RA)"], 0, "Dorian is minor ♯6."],
    ["Which mode is major with a lowered 7th?", ["Mixolydian", "Lydian", "Dorian"], 0, "Mixolydian: TE instead of TI."],
    ["In PADMIL order, which mode comes right after Mixolydian?", ["Ionian", "Dorian", "Lydian"], 0, "P → A → D → M → I → L."],
    ["A Mixolydian has which key signature?", ["2 sharps", "3 sharps", "1 sharp"], 0, "A major (3♯) with one flat more = 2♯."],
    ["Using only the white keys from E to E gives…", ["E Phrygian", "E Aeolian", "E Dorian"], 0, "E is scale degree 3 of C major."],
    ["Which scale contains an augmented 2nd?", ["harmonic minor", "Dorian", "major pentatonic"], 0, "Between <span class='sd'>6</span> and <span class='sd'>7</span> (LE and TI)."],
    ["How many different whole-tone collections are there?", ["2", "3", "6"], 0, "Shift up a half step for the second; again and the first returns."],
  ];
  $("quiz").innerHTML = `<h3 class="readout" style="margin:6px 0 0">Quick check</h3>` + QZ.map((q, i) => `<div class="q" role="group" aria-labelledby="qz${i}"><p id="qz${i}"><b>${i + 1}.</b> ${q[0]}</p><div class="opts">${q[1].map((o, j) => ({ o, j })).sort((a, b) => ((a.j * 7 + i * 3) % 5) - ((b.j * 7 + i * 3) % 5)).map(({ o, j }) => `<button class="opt" type="button" data-q="${i}" data-o="${j}">${o}</button>`).join("")}</div><p class="fbk" id="qf${i}" aria-live="polite"></p></div>`).join("");
  $("quiz").onclick = e => {
    const b = e.target.closest(".opt"); if (!b || b.disabled) return; const i = +b.dataset.q, j = +b.dataset.o, q = QZ[i], ok = j === q[2];
    b.parentNode.querySelectorAll(".opt").forEach(x => { x.disabled = true; if (+x.dataset.o === q[2]) x.classList.add("right"); });
    if (!ok) b.classList.add("wrong"); if (window.SFX) SFX.play(ok);
    $("qf" + i).innerHTML = (ok ? "Yes! " : "Not quite. ") + q[3];
  };

  let start = 0; try { start = +localStorage.getItem("silverapps-modes-step") || 0; } catch (e) {}
  go(Math.min(start, slides.length - 1), false);
})();
