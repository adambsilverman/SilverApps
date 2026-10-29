(() => {
  // ===== Orchestration family trainer engine. Content comes from window.FAM (strings.js, winds.js, percussion.js). =====
  const FAM = window.FAM;
  const LET = "CDEFGAB", NAT = [0, 2, 4, 5, 7, 9, 11];
  const ACC = { "-2": "𝄫", "-1": "♭", "0": "", "1": "♯", "2": "𝄪" };
  const SPOKEN_ACC = { "-2": " double flat", "-1": " flat", "0": "", "1": " sharp", "2": " double sharp" };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const accHTML = s => esc(s).replace(/([♭♯♮𝄫𝄪])/g, '<span class="acc">$1</span>');
  const speak = s => String(s).replace(/𝄫/g, " double flat").replace(/𝄪/g, " double sharp").replace(/♭/g, " flat").replace(/♯/g, " sharp").replace(/♮/g, " natural").replace(/π/g, "down-bow").replace(/\bV\b(?= )/g, "V");

  // ---------- notes: { l, a, step } with C4 = step 28 ----------
  const mk = (step, a = 0) => ({ l: ((step % 7) + 7) % 7, a, step });
  const oct = n => Math.floor(n.step / 7);
  const midi = n => 12 * (oct(n) + 1) + NAT[((n.step % 7) + 7) % 7] + n.a;
  function up(n, st, se) { const step = n.step + st, l = ((step % 7) + 7) % 7; return { l, a: midi(n) + se - (12 * (Math.floor(step / 7) + 1) + NAT[l]), step }; }
  const nm = n => LET[n.l] + ACC[n.a] + oct(n);
  const nmSpoken = n => LET[n.l] + SPOKEN_ACC[n.a] + " " + oct(n);
  const parse = s => { const m = /^([A-G])(♭|♯|b|#)?(-?\d)$/.exec(s); const l = LET.indexOf(m[1]); return mk(+m[3] * 7 + l, m[2] === "♯" || m[2] === "#" ? 1 : m[2] ? -1 : 0); };
  const okNote = n => Math.abs(n.a) <= 1 && !(n.a === 1 && (n.l === 2 || n.l === 6)) && !(n.a === -1 && (n.l === 3 || n.l === 0));

  const rnd = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  // A multiple-choice question; wrong answers are de-duplicated and trimmed to three.
  const mc = (text, answer, wrong, explain, extra) => {
    const w = shuffle([...new Set(wrong.map(String))].filter(v => v !== String(answer))).slice(0, 3);
    return Object.assign({ text, choices: shuffle([String(answer), ...w]), answer: String(answer), explain }, extra || {});
  };
  const H = { oct, mk, up, nm, nmSpoken, parse, midi, okNote, rnd, shuffle, mc, LET, ACC };

  // ---------- Staff (VexFlow); notes may be { n, head: "diamond" | "normal", circle } ----------
  function cssVar(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
  const GLYPH = { "-1": "b", "0": "n", "1": "#" };
  function drawStaff(el, o) {
    el._args = o; el.innerHTML = "";
    if (!window.Vex || !Vex.Flow) { el.innerHTML = '<p class="staff-msg">The notation engine didn\'t load. Reload the page.</p>'; return; }
    const VF = Vex.Flow, ink = cssVar("--ink");
    const r = new VF.Renderer(el, VF.Renderer.Backends.SVG);
    const stave = new VF.Stave(4, 30, 400);
    stave.addClef(o.clef || "treble");
    const sx = stave.getNoteStartX(), groups = o.groups || [o.notes || []];
    const W = Math.round(sx + 26 + groups.length * 62), Hh = 170;
    stave.setWidth(W - 8); r.resize(W, Hh);
    const ctx = r.getContext(); ctx.setFillStyle(ink); ctx.setStrokeStyle(ink);
    stave.setStyle({ fillStyle: ink, strokeStyle: ink }); stave.setContext(ctx).draw();
    const sns = groups.map(g => {
      const ns = g.slice().sort((a, b) => a.n.step - b.n.step);
      const sn = new VF.StaveNote({ clef: o.clef || "treble", keys: ns.map(x => LET[x.n.l].toLowerCase() + "/" + oct(x.n)), duration: "w" });
      sn.setStyle({ fillStyle: ink, strokeStyle: ink });
      if (sn.setLedgerLineStyle) sn.setLedgerLineStyle({ strokeStyle: ink, fillStyle: ink });
      ns.forEach((x, i) => {
        if (x.n.a !== 0) { const acc = new VF.Accidental(GLYPH[x.n.a]); acc.setStyle({ fillStyle: ink, strokeStyle: ink }); sn.addModifier(acc, i); }   // own style: a hidden (diamond) notehead must not hide its accidental
        if (x.head === "diamond") sn.setKeyStyle(i, { fillStyle: "rgba(0,0,0,0)", strokeStyle: "rgba(0,0,0,0)" });
      });
      if (ns.some(x => x.circle)) sn.addModifier(new VF.Annotation("o").setVerticalJustification(1), 0);
      sn._ns = ns; return sn;
    });
    const voice = new VF.Voice({ num_beats: 4 * sns.length, beat_value: 4 }).addTickables(sns);
    new VF.Formatter().joinVoices([voice]).format([voice], stave.getNoteEndX() - stave.getNoteStartX() - 16);
    voice.draw(ctx, stave);
    // Hollow diamond noteheads, drawn by hand so they sit exactly on the line or space.
    sns.forEach(sn => sn._ns.forEach((x, i) => {
      if (x.head !== "diamond") return;
      const y = sn.getYs()[i], cx = sn.getNoteHeadBeginX() + 8, w = 6.5, h = 5.2;
      ctx.beginPath(); ctx.moveTo(cx - w, y); ctx.lineTo(cx, y - h); ctx.lineTo(cx + w, y); ctx.lineTo(cx, y + h); ctx.closePath();
      ctx.setLineWidth(1.6); ctx.setStrokeStyle(ink); ctx.stroke();
    }));
    const svg = el.querySelector("svg");
    if (svg) {
      let vb = `0 0 ${W} ${Hh}`;
      try { const bb = svg.getBBox(); if (bb.width) vb = `${bb.x - 4} ${bb.y - 8} ${bb.width + 8} ${bb.height + 16}`; } catch (e) {}
      svg.setAttribute("viewBox", vb); svg.removeAttribute("width"); svg.removeAttribute("height");
      svg.style.width = "100%"; svg.style.height = "auto";
      svg.setAttribute("role", "img"); svg.setAttribute("focusable", "false");
      svg.setAttribute("aria-label", o.label || "Staff");
    }
  }
  function redrawStaves() { document.querySelectorAll(".staff").forEach(el => el._args && drawStaff(el, el._args)); }
  try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", redrawStaves); } catch (e) {}

  // ---------- Sound (Web Audio): a soft bowed/organ-like tone, or a plain sine for harmonics ----------
  let AC = null, bus = null;
  function audio() {
    if (AC) { if (AC.state === "suspended") AC.resume(); return AC; }
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    AC = new C(); const comp = AC.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.connect(AC.destination); AC._out = comp; return AC;
  }
  function newBus() { if (bus) { const old = bus; old.gain.setTargetAtTime(0, AC.currentTime, 0.04); setTimeout(() => old.disconnect(), 400); } bus = AC.createGain(); bus.connect(AC._out); return bus; }
  function tone(out, m, t0, dur, pure) {
    const f = 440 * Math.pow(2, (m - 69) / 12), g = AC.createGain(), lp = AC.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = Math.min(f * (pure ? 2 : 6), 7000); g.connect(out); lp.connect(g);
    const parts = pure ? [[1, 1]] : [[1, 1], [2, .5], [3, .32], [4, .2], [5, .12]];
    parts.forEach(([h, a]) => { const o = AC.createOscillator(); o.frequency.value = f * h; const og = AC.createGain(); og.gain.value = a * (f < 90 ? .9 : .55) / parts.length * 2; o.connect(og); og.connect(lp); o.start(t0); o.stop(t0 + dur + .5); });
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.32, t0 + .08); g.gain.setTargetAtTime(.25, t0 + .1, .3); g.gain.setTargetAtTime(0, t0 + dur, .12);
  }
  function play(p) { if (!p || !audio()) return; const out = newBus(), t = AC.currentTime + .05; (p.seq || [p.m]).forEach((m, i) => tone(out, m, t + i * (p.gap || .7), p.dur || 1.1, p.pure)); }
  function autoPlay(q) { if (S.settings.auto !== false && q.c.play) play(q.c.play); }
  document.addEventListener("click", e => { const b = e.target.closest("[data-play]"); if (b && Q[S.mode]) play(b.dataset.play === "a" ? Q[S.mode].c.play : Q[S.mode].c.playQ); });
  const PLAY_BTN = (label, which) => `<div class="play-row"><button class="play" data-play="${which}"><svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M2 1l9 5-9 5z"/></svg>${label}</button></div>`;

  // ---------- State ----------
  const MODES = FAM.modes.map(m => m.id);
  const DEFAULTS = { auto: true, topics: Object.fromEntries((FAM.topics || []).map(t => [t.id, true])) };
  let S = { mode: MODES[0], settings: JSON.parse(JSON.stringify(DEFAULTS)), right: 0, total: 0, streak: 0, misses: [] };
  try { const saved = JSON.parse(localStorage.getItem(FAM.key) || "null"); if (saved) S = Object.assign(S, saved, { settings: Object.assign({}, S.settings, saved.settings, { topics: Object.assign({}, DEFAULTS.topics, (saved.settings || {}).topics) }) }); } catch (e) {}
  if (!MODES.includes(S.mode)) S.mode = MODES[0];
  const save = () => { try { localStorage.setItem(FAM.key, JSON.stringify({ mode: S.mode, settings: S.settings, right: S.right, total: S.total, streak: S.streak, misses: S.misses.slice(-40) })); } catch (e) {} };
  const Q = Object.fromEntries(MODES.map(m => [m, null]));
  const sameSpec = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const topicOn = t => !t || !FAM.topics || S.settings.topics[t] !== false;
  H.topicOn = topicOn;

  function newQuestion(mode) {
    const prev = Q[mode];
    const review = S.misses.filter(m => m.mode === mode && (!prev || !sameSpec(m.c, prev.c)) && topicOn(m.c.topic));
    if (review.length && Math.random() < .3) { const sp = rnd(review); return { mode, c: sp.c, tries: 0, done: false, review: true, correctValue: sp.c.answer }; }
    for (let i = 0; i < 40; i++) {
      const c = FAM.make(mode, H);
      if (c && (c.picker || c.choices.length >= 2) && topicOn(c.topic) && (!prev || prev.c.text !== c.text || i > 30)) return { mode, c, tries: 0, done: false, correctValue: c.answer };
    }
    const c = FAM.make(mode, H); return { mode, c, tries: 0, done: false, correctValue: c.answer };
  }

  // ---------- DOM ----------
  const $ = id => document.getElementById(id);
  const promptEl = $("prompt"), fb = $("feedback"), ansBox = $("answerBox"), work = $("work"), nextBtn = $("nextBtn");
  function renderScore() { $("scRight").textContent = S.right; $("scTotal").textContent = S.total; $("scStreak").textContent = S.streak; $("scoreText").textContent = `Score: ${S.right} correct out of ${S.total} answered. Streak: ${S.streak}.`; }
  function msg(cls, label, text) { return `<div class="verdict"><span class="pill ${cls}">${label}</span><span>${text}</span></div>`; }
  const modeInfo = m => FAM.modes.find(x => x.id === m);

  function renderPrompt() {
    const q = Q[S.mode], c = q.c;
    const tag = q.review ? ' <span class="pill warn">review</span>' : "";
    let h = `<h2 class="kicker" id="qHead" tabindex="-1">${esc(c.kicker || modeInfo(S.mode).kicker)}${tag}</h2>`;
    if (c.big) h += `<div class="ins">${accHTML(c.big)}</div>`;
    h += `<p class="q-text" id="qText">${accHTML(c.text)}</p>`;
    if (c.staff) h += `<div class="staff solo" id="promptStaff"></div>`;
    if (c.playQ) h += PLAY_BTN(c.playQLabel || "Play", "q");
    promptEl.innerHTML = h;
    if (c.staff) drawStaff($("promptStaff"), c.staff);
    renderWork();
  }
  function choiceBtn(value, q) {
    let cls = "choice", mark = "";
    if (q.done) {
      if (value === q.correctValue) { cls += " right"; mark = `<span class="mark"><span aria-hidden="true">✓</span><span class="sr">correct answer</span></span>`; }
      else if (value === q.chosen) { cls += " wrong"; mark = `<span class="mark"><span aria-hidden="true">✗</span><span class="sr">your answer, incorrect</span></span>`; }
    }
    const sr = /^[A-G][♭♯]?-?\d$/.test(value) ? `<span aria-hidden="true">${accHTML(value)}</span><span class="sr">${esc(nmSpoken(parse(value)))}</span>` : accHTML(value);
    return `<button class="${cls}" data-v="${esc(value)}"${q.done ? " disabled" : ""}><span>${sr}</span>${mark}</button>`;
  }
  // Pitch + octave picker: any letter, any accidental, any normal octave.
  function renderPicker(q) {
    const c = q.c, P = q.pick || (q.pick = { l: null, a: 0, o: null });
    const ans = parse(c.answer), ch = q.chosen ? parse(q.chosen) : null;
    const mark = (kind, v) => {
      if (!q.done) return "";
      const right = kind === "l" ? v === ans.l : kind === "a" ? v === ans.a : v === oct(ans);
      const mine = ch && (kind === "l" ? v === ch.l : kind === "a" ? v === ch.a : v === oct(ch));
      return right ? " right" : mine ? " wrong" : "";
    };
    const btn = (kind, v, label, sr) => `<button class="pk${P[kind] === v ? " on" : ""}${mark(kind, v)}" data-pk="${kind}" data-val="${v}" aria-pressed="${P[kind] === v}"${q.done ? " disabled" : ""}><span aria-hidden="true">${label}</span>${sr ? `<span class="sr">${sr}</span>` : ""}</button>`;
    const octs = c.picker.octaves || [1, 2, 3, 4, 5, 6, 7];
    const ready = P.l !== null && P.o !== null;
    work.innerHTML = `<div class="picker" role="group" aria-labelledby="qText">
      <div class="pk-row" role="group" aria-label="Note letter"><span class="pk-lab" aria-hidden="true">Note</span>${LET.split("").map((L, i) => btn("l", i, L, "")).join("")}</div>
      <div class="pk-row" role="group" aria-label="Accidental"><span class="pk-lab" aria-hidden="true">Accidental</span>${[[-1, "♭", "flat"], [0, "♮", "natural"], [1, "♯", "sharp"]].map(([v, g, sr]) => btn("a", v, `<span class="acc">${g}</span>`, sr)).join("")}</div>
      <div class="pk-row" role="group" aria-label="Octave number"><span class="pk-lab" aria-hidden="true">Octave</span>${octs.map(o => btn("o", o, String(o), `octave ${o}`)).join("")}</div>
      <div class="pk-row"><span class="pk-now" aria-live="polite">${ready ? `Your answer: <b>${accHTML(LET[P.l] + ACC[P.a] + P.o)}</b>` : "Choose a note and an octave."}</span>${q.done ? "" : `<button class="btn primary" id="pkCheck"${ready ? "" : " disabled"}>Check</button>`}</div>
      <p class="legend">Octave numbers: middle C is C4; each octave number starts on C.</p></div>`;
  }
  work.addEventListener("click", e => {
    const q = Q[S.mode]; if (!q || !q.c.picker || q.done) return;
    const b = e.target.closest("[data-pk]");
    if (b) { q.pick[b.dataset.pk] = +b.dataset.val; renderPicker(q); const again = work.querySelector(`[data-pk="${b.dataset.pk}"][data-val="${b.dataset.val}"]`); if (again) again.focus(); return; }
    if (e.target.closest("#pkCheck")) { const P = q.pick; choose(LET[P.l] + ACC[P.a] + P.o); }
  });
  function renderWork() {
    const q = Q[S.mode], c = q.c;
    if (c.picker) return renderPicker(q);
    const notes = c.choices.every(v => /^[A-G][♭♯]?-?\d$/.test(v));
    const short = !notes && c.choices.every(v => v.length <= 18);
    const list = notes ? c.choices.slice().sort((a, b) => midi(parse(a)) - midi(parse(b))) : c.choices;
    work.innerHTML = `<div class="choice-row ${notes ? "notes" : short ? "" : "wide"}" role="group" aria-labelledby="qText">${list.map(v => choiceBtn(v, q)).join("")}</div>${notes ? '<p class="legend">Octave numbers: middle C is C4.</p>' : ""}`;
  }
  function renderControls() {
    const q = Q[S.mode];
    document.querySelectorAll(".modes [data-mode]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mode === S.mode)));
    const finished = q.done || q.revealed;
    nextBtn.textContent = finished ? "Next question" : "Skip";
    nextBtn.classList.toggle("primary", !!finished);
  }
  function score(q, correct) {
    if (q.tries > 0) return;
    S.total++;
    const sp = { mode: q.mode, c: q.c };
    if (correct) { S.right++; S.streak++; S.misses = S.misses.filter(m => !sameSpec(m.c, q.c)); }
    else { S.streak = 0; if (!S.misses.some(m => sameSpec(m.c, q.c))) S.misses.push(sp); }
    save(); renderScore();
  }
  function choose(value) {
    const q = Q[S.mode], c = q.c;
    if (q.done) return;
    const enh = c.picker && value !== q.correctValue && midi(parse(value)) === midi(parse(c.answer));
    const correct = value === q.correctValue || enh;
    score(q, correct);
    q.tries++; q.done = true; q.chosen = value;
    renderWork();
    fb.innerHTML = msg(correct ? "good" : "bad", correct ? "Correct" : "Not quite", enh ? `${accHTML(value)} is the right pitch; it's usually spelled ${accHTML(c.answer)}.` : correct ? `${accHTML(c.answer)}.` : c.picker ? `You chose ${accHTML(value)}. The answer is ${accHTML(c.answer)}.` : `The answer is ${accHTML(c.answer)}.`);
    ansBox.innerHTML = `<div class="answer">${c.staffAns ? `<div class="staff" id="ansStaff"></div>` : ""}${c.staffAnsCap ? `<p class="legend">${accHTML(c.staffAnsCap)}</p>` : ""}${c.play ? PLAY_BTN(c.playLabel || "Play", "a") : ""}<p class="explain">${accHTML(c.explain)}</p></div>`;
    if (c.staffAns) drawStaff($("ansStaff"), c.staffAns);
    autoPlay(q);
    renderControls(); nextBtn.focus();
  }
  function reveal() { const q = Q[S.mode]; if (q.done) return; q.tries = 1; choose(q.correctValue); }
  work.addEventListener("click", e => { if (Q[S.mode] && Q[S.mode].c.picker) return; const b = e.target.closest("[data-v]"); if (b && !b.disabled) choose(b.dataset.v); });

  function clearAnswer() { fb.innerHTML = ""; ansBox.innerHTML = ""; }
  function next(focus = true) { Q[S.mode] = newQuestion(S.mode); clearAnswer(); renderPrompt(); renderControls(); if (focus) { const h = $("qHead"); if (h) h.focus(); } }
  function setMode(m) { if (S.mode === m) return; S.mode = m; save(); clearAnswer(); if (!Q[m] || Q[m].done) Q[m] = newQuestion(m); renderPrompt(); renderControls(); }

  // ---------- Events & settings ----------
  document.querySelectorAll(".modes [data-mode]").forEach(b => b.onclick = () => setMode(b.dataset.mode));
  nextBtn.onclick = () => next(true);
  function renderSettings() {
    document.querySelectorAll("[data-auto]").forEach(b => b.setAttribute("aria-pressed", String((S.settings.auto !== false) === (b.dataset.auto === "1"))));
    document.querySelectorAll("[data-topic]").forEach(b => b.setAttribute("aria-pressed", String(S.settings.topics[b.dataset.topic] !== false)));
  }
  const autoT = $("autoToggles"); if (autoT) autoT.onclick = e => { const b = e.target.closest("[data-auto]"); if (b) { S.settings.auto = b.dataset.auto === "1"; save(); renderSettings(); } };
  const topT = $("topicToggles");
  if (topT) {
    topT.innerHTML = (FAM.topics || []).map(t => `<button class="tog" data-topic="${t.id}">${esc(t.name)}${t.sub ? ` <small>${esc(t.sub)}</small>` : ""}</button>`).join("");
    topT.onclick = e => {
      const b = e.target.closest("[data-topic]"); if (!b) return;
      const t = b.dataset.topic, on = S.settings.topics[t] === false;
      if (!on && Object.values(S.settings.topics).filter(v => v !== false).length === 1) return;
      S.settings.topics[t] = on; save(); renderSettings(); MODES.forEach(m => Q[m] = newQuestion(m)); clearAnswer(); renderPrompt(); renderControls();
    };
  }
  $("resetBtn").onclick = () => { S.misses = []; save(); $("resetBtn").textContent = "Review list cleared"; };
  let armTimer = null;
  $("scoreReset").onclick = () => {
    const b = $("scoreReset");
    if (!b.classList.contains("armed")) { b.classList.add("armed"); b.innerHTML = 'Tap again to reset<span class="sr"> the score</span>'; armTimer = setTimeout(() => { b.classList.remove("armed"); b.innerHTML = 'Reset<span class="sr"> score</span>'; }, 3000); return; }
    clearTimeout(armTimer); S.right = 0; S.total = 0; S.streak = 0; save(); renderScore(); b.classList.remove("armed"); b.innerHTML = 'Reset<span class="sr"> score</span>';
  };
  // Reference
  document.querySelectorAll(".ref-slot").forEach(el => el.innerHTML = FAM.reference(H, esc, accHTML));
  const dlg = $("refDialog"); let dlgReturn = null;
  $("refBtn").onclick = () => { dlgReturn = document.activeElement; if (dlg.showModal) dlg.showModal(); else { $("refPanel").open = true; $("refPanel").scrollIntoView(); return; } $("refClose").focus(); };
  $("refClose").onclick = () => dlg.close();
  dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", () => { if (dlgReturn && dlgReturn.focus) dlgReturn.focus(); });

  MODES.forEach(m => Q[m] = newQuestion(m));
  renderSettings(); renderScore(); renderPrompt(); renderControls();
})();
