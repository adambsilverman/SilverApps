/* =====================================================================
   SilverApps for Music Training — live class game layer
   ---------------------------------------------------------------------
   Adds "Host a class game" / "Join a game" to a trainer page.
   The host broadcasts {question type, settings, random seed}; every phone
   builds the *same* question locally from that seed, grades its own answer
   with the trainer's normal grading, and sends back only right/wrong.
   Answers are anonymous: phones send a random per-tab id, never a name.

   A trainer plugs in by calling LiveClass.register(adapter) with:
     id, name            short id (used in room topics) and display name
     mount               element to insert the class panel before
     card                the practice card element (shown/hidden/locked)
     getConfig()         -> {mode, settings} currently chosen on this page
     label(cfg)          -> human label for that config (e.g. "Spell it")
     load(cfg)           build + render the question (called inside a seeded RNG)
     showAnswer()        show the correct answer without scoring
   and by calling LiveClass.answered(correct) from its score() function;
   if that returns true the trainer must skip its own solo scoring.

   Needs assets/mqtt.min.js (global `mqtt`) and assets/qrcode.js (`qrcode`).
   ===================================================================== */
(function () {
  "use strict";
  const PARAMS = new URLSearchParams(location.search);
  const HASH = new URLSearchParams(location.hash.slice(1));
  const BROKER_OVERRIDE = PARAMS.get("broker") || HASH.get("broker");
  const BROKERS = BROKER_OVERRIDE ? [BROKER_OVERRIDE] :
    ["wss://broker.hivemq.com:8884/mqtt", "wss://broker.emqx.io:8084/mqtt", "wss://test.mosquitto.org:8081/mqtt"];
  const ALPH = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const EMBED = PARAMS.has("solo") || window.top !== window.self;
  const SMOOTH = (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) ? "auto" : "smooth";

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const randId = (n = 10) => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => ALPH[b % 32]).join("");
  const pctR = p => p >= 100 ? 100 : p <= 0 ? 0 : Math.min(99, Math.max(1, Math.round(p)));
  const fmtT = ms => { const t = Math.ceil(ms / 1000); return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0"); };

  /* ---- seeded random: identical questions on every device ---- */
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function seeded(seed, fn) { const orig = Math.random; Math.random = mulberry32(seed >>> 0); try { return fn(); } finally { Math.random = orig; } }

  /* ---- supportive messages ---- */
  function classMsg(pct, n) {
    if (!n) return "No answers came in this time — that's okay. Let's look at it together.";
    if (pct >= 100) return "Everyone got it — excellent work!";
    if (pct >= 85) return "Almost everyone got it — great work.";
    if (pct >= 60) return "Most of the class has this. Let's look at it together.";
    if (pct >= 35) return "A split decision — a perfect one to talk through.";
    return "A tricky one! That's exactly why we practice — let's unpack it.";
  }
  function endMsg(pct) {
    if (pct >= 100) return "A perfect session — every answer correct!";
    if (pct >= 85) return "Outstanding work, everyone!";
    if (pct >= 65) return "Solid session — you're really getting this.";
    if (pct >= 45) return "Good progress! A few more reps and these will feel automatic.";
    return "Great effort. Tough material — every round makes it easier.";
  }

  let A = null;           // adapter
  let el = null;          // panel root
  let H = null, S = null; // host / student state
  const live = () => H || S;

  const LiveClass = {
    register(adapter) { A = adapter; if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot(); },
    answered(correct) {
      if (!S) return !!H;                       // host never scores; solo -> app handles it
      if (S.phase !== "q" || S.mine[S.qn] != null) return true;
      S.mine[S.qn] = !!correct; S.send({ t: "ans", qn: S.qn, ok: !!correct });
      document.body.classList.add("lc-locked"); lockCard(true);
      studentRender(); announce("Answer locked in. Waiting for the rest of the class.");
      return true;
    },
    get active() { return !!live(); },
    get role() { return H ? "host" : S ? "student" : "solo"; },
    seeded,
  };
  window.LiveClass = LiveClass;

  /* ---------------------------------------------------------------- boot */
  function boot() {
    if (EMBED) { document.body.classList.add("lc-embed"); return; }
    el = document.createElement("section");
    el.className = "lc"; el.id = "lc"; el.setAttribute("aria-label", "Class game");
    A.mount.parentNode.insertBefore(el, A.mount);
    const sr = document.createElement("div");
    sr.innerHTML = '<div id="lc-live" class="sr-only" aria-live="polite" aria-atomic="true"></div><div id="lc-alert" class="sr-only" aria-live="assertive" aria-atomic="true"></div>';
    document.body.appendChild(sr);
    idle();
    const j = HASH.get("join"); if (j != null) joinForm(j.toUpperCase());
    setInterval(tick, 250);
  }
  function announce(t, urgent) { const n = document.getElementById(urgent ? "lc-alert" : "lc-live"); if (!n) return; n.textContent = ""; setTimeout(() => { n.textContent = t; }, 60); }
  const q$ = s => el.querySelector(s);

  function idle() {
    document.body.classList.remove("lc-host", "lc-student", "lc-q", "lc-hold", "lc-locked", "lc-idle");
    lockCard(false);
    el.innerHTML = `<div class="lc-bar"><span class="lc-title">Class game</span>
      <button class="lc-btn primary" data-a="host">Host a class game</button><button class="lc-btn" data-a="join">Join a game</button>
      <p class="lc-sub">Play together: the instructor projects each question, students answer anonymously on their own devices, and everyone sees how the class did.</p></div>`;
    q$('[data-a="host"]').onclick = hostSetup;
    q$('[data-a="join"]').onclick = () => joinForm("");
  }

  /* ------------------------------------------------------------ network */
  function connectTo(url) {
    return new Promise((res, rej) => {
      let done = false;
      const c = mqtt.connect(url, { clientId: "sa_" + randId(12), keepalive: 30, reconnectPeriod: 2500, connectTimeout: 8000, clean: true });
      const t = setTimeout(() => { if (!done) { done = true; c.end(true); rej(new Error("timeout")); } }, 9000);
      c.once("connect", () => { if (!done) { done = true; clearTimeout(t); res(c); } });
      c.on("error", e => { if (!done) { done = true; clearTimeout(t); c.end(true); rej(e); } });
    });
  }
  const topic = code => `silverapps/v1/${A.id}/${code}`;
  const brokerFor = code => BROKERS[ALPH.indexOf(code[0]) % BROKERS.length];

  /* =============================================================== HOST */
  function hostSetup() {
    el.innerHTML = `<div class="lc-panel"><p class="lc-label">Host a class game</p>
      <div class="lc-row">
        <div class="lc-field"><label for="lc-secs">Time per question</label><select id="lc-secs" class="lc-sel">${[[20, "20 seconds"], [30, "30 seconds"], [45, "45 seconds"], [60, "1 minute"], [90, "90 seconds"], [120, "2 minutes"], [0, "No timer (you stop it)"]].map(([v, t]) => `<option value="${v}" ${v === 60 ? "selected" : ""}>${t}</option>`).join("")}</select></div>
        <div class="lc-field"><label for="lc-goal">Class goal</label><select id="lc-goal" class="lc-sel">${[60, 70, 80, 90].map(v => `<option value="${v}" ${v === 70 ? "selected" : ""}>${v}% class average</option>`).join("")}</select></div>
      </div>
      <p class="lc-sub" style="margin:10px 0">You choose each question type with the trainer's own buttons and settings below, then send it to the class. You can switch types between questions.</p>
      <div class="lc-row"><button class="lc-btn" data-a="cancel">Cancel</button><span class="lc-grow"></span><button class="lc-btn primary big" data-a="go">Create room</button></div>
      <p data-msg role="status"></p></div>`;
    q$('[data-a="cancel"]').onclick = idle;
    q$('[data-a="go"]').onclick = async () => {
      const msg = q$("[data-msg]"); q$('[data-a="go"]').disabled = true;
      let client = null, bi = -1;
      for (let k = 0; k < BROKERS.length && !client; k++) { msg.textContent = `Opening a room… (server ${k + 1} of ${BROKERS.length})`; try { client = await connectTo(BROKERS[k]); bi = k; } catch (e) {} }
      if (!client) { msg.innerHTML = '<span class="lc-err" style="display:block">Couldn\'t reach a live server from this network. Solo practice still works; or try another network (e.g. a phone hotspot).</span>'; q$('[data-a="go"]').disabled = false; return; }
      let code; do { code = randId(5); } while (ALPH.indexOf(code[0]) % BROKERS.length !== bi);
      hostStart(client, code, +q$("#lc-secs").value, +q$("#lc-goal").value);
    };
  }
  function hostStart(client, code, secs, goal) {
    H = { client, code, secs, goal, phase: "lobby", qn: 0, cfg: null, seed: 0, label: "", deadline: null, limit: secs * 1000, seen: new Map(), answers: new Map(), results: [] };
    const T = topic(code);
    client.subscribe(T + "/up", { qos: 1 });
    client.on("message", (tp, buf) => {
      if (tp !== T + "/up" || !H) return;
      let m; try { m = JSON.parse(buf.toString()); } catch (e) { return; }
      if (!m || typeof m.id !== "string") return;
      H.seen.set(m.id, Date.now());
      if (m.t === "ans" && H.phase === "q" && m.qn === H.qn && !H.answers.has(m.id)) H.answers.set(m.id, !!m.ok);
      if (m.t === "hi") publish();
      hostCounts();
    });
    client.on("connect", publish);
    H.timers = [setInterval(hostCounts, 3000), setInterval(() => { if (H && H.phase === "q") H.client.publish(T + "/tick", JSON.stringify(tickPayload()), { qos: 0 }); }, 2000)];
    window.addEventListener("beforeunload", () => { try { H && H.client.publish(T + "/down", JSON.stringify({ phase: "closed" }), { retain: true }); } catch (e) {} });
    document.body.classList.add("lc-host");
    publish(); hostLobby();
  }
  const activeCount = () => { if (!H) return 0; const now = Date.now(); let n = 0; H.seen.forEach(t => { if (now - t < 50000) n++; }); return n; };
  const tickPayload = () => ({ left: H.deadline ? Math.max(0, H.deadline - Date.now()) : null, limit: H.limit || null, answered: H.answers.size, joined: Math.max(activeCount(), H.answers.size) });
  function classStats() { const rs = H.results.filter(r => r.n); return { avg: rs.length ? rs.reduce((a, r) => a + r.pct, 0) / rs.length : null, done: rs.length, goal: H.goal }; }
  function publish() {
    if (!H) return;
    const st = { v: 1, phase: H.phase, qn: H.qn, secs: H.secs, goal: H.goal, cls: classStats() };
    if (H.phase === "q" || H.phase === "reveal") { st.cfg = H.cfg; st.seed = H.seed; st.label = H.label; }
    if (H.phase === "q") Object.assign(st, tickPayload());
    if (H.phase === "reveal") st.reveal = H.results[H.results.length - 1];
    if (H.phase === "end") st.recap = H.results;
    H.client.publish(topic(H.code) + "/down", JSON.stringify(st), { retain: true, qos: 1 });
  }
  function joinURL() {
    if (!/^https?:/.test(location.protocol)) return null;
    const u = new URL(location.href); u.search = BROKER_OVERRIDE ? "?broker=" + encodeURIComponent(BROKER_OVERRIDE) : ""; u.hash = "join=" + H.code;
    return u.toString();
  }
  function fsBtn() { return `<button class="lc-btn" data-a="fs" aria-pressed="${!!document.fullscreenElement}">Full screen</button>`; }
  function bindFs() { const b = q$('[data-a="fs"]'); if (b) b.onclick = toggleFs; }
  function toggleFs() {
    const d = document.documentElement;
    if (document.fullscreenElement) { document.exitFullscreen(); return; }
    if (d.requestFullscreen) d.requestFullscreen().catch(() => {});
  }
  document.addEventListener("fullscreenchange", () => { document.body.classList.toggle("lc-fs", !!document.fullscreenElement); const b = el && q$('[data-a="fs"]'); if (b) b.setAttribute("aria-pressed", !!document.fullscreenElement); });

  function howTo(student) {
    const items = [
      ["Same question, same time", "Each question appears on the big screen and on your phone at the same moment."],
      ["Answer on your phone", "Answer the way you normally would in this trainer, then lock it in. You get one try per class question."],
      ["Watch the clock", H && H.secs || S && S.secs ? `You have <b>${(H || S).secs} seconds</b> per question. When time runs out — or your instructor stops the clock — answers lock.` : "Your instructor decides when to stop answering."],
      ["See how the class did", "The correct answer appears for everyone, with the percent of the class that got it right."],
      ["Anonymous", "No names. Nobody sees your answers — only you see your own score."],
      ["Finished early? Work ahead", "Once you've locked in, open <b>Work ahead on your own</b> below to practice any part of this trainer privately while the class finishes. When the next class question starts, you'll be brought back to it.", "hl"],
      ["A class goal", `We're working together toward a <b>${(H || S).goal || 70}% class average</b>.`],
    ];
    return `<p class="lc-label">How it works</p><ol class="lc-howto">${items.map(([t, d, c], i) => `<li class="${c || ""}"><span class="hn" aria-hidden="true">${i + 1}</span><div><b>${t}</b><span>${d}</span></div></li>`).join("")}</ol>`;
  }
  function hostLobby() {
    H.phase = "lobby"; publish();
    const url = joinURL(); let qr = "";
    if (url && window.qrcode) { try { const g = qrcode(0, "M"); g.addData(url); g.make(); qr = g.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); } catch (e) {} }
    el.innerHTML = `<div class="lc-panel"><div class="lc-host-grid"><div>
        <p class="lc-label">Join code</p><div class="lc-code" aria-label="Join code ${H.code.split("").join(" ")}">${H.code}</div>
        <ol class="lc-steps"><li>On your phone, open this page${url ? " — or scan the QR code" : ""}.</li><li>Under <b>Class game</b>, tap <b>Join a game</b> and enter <b>${H.code}</b>.</li><li>No names — answers are anonymous.</li></ol>
        <p><span class="lc-big" data-joined>${activeCount()}</span> <span>students joined</span></p>
      </div><div style="text-align:center">${qr ? `<div class="lc-qr" role="img" aria-label="QR code to join this game">${qr}</div><p class="lc-sub">Scan to join</p>` : ""}</div></div>
      <div class="lc-row" style="margin-top:12px"><button class="lc-btn" data-a="end">End</button>${fsBtn()}<span class="lc-grow"></span><button class="lc-btn primary big" data-a="intro">Show how it works →</button></div></div>`;
    q$('[data-a="intro"]').onclick = hostIntro; q$('[data-a="end"]').onclick = hostEndSession; bindFs();
  }
  function hostIntro() {
    H.phase = "intro"; publish();
    el.innerHTML = `<div class="lc-panel">${howTo(false)}
      <div class="lc-row" style="margin-top:14px"><span class="lc-sub">Room <b>${H.code}</b> · <span data-joined>${activeCount()}</span> joined — late arrivals can still join.</span><span class="lc-grow"></span>${fsBtn()}
      <button class="lc-btn" data-a="back">← Join code</button></div>
      <p class="lc-msg" style="margin-top:12px"><b>Next:</b> choose a question type with the trainer's buttons below (and its settings, if you like), then send it.</p>
      <div class="lc-row"><span class="lc-grow"></span><button class="lc-btn primary big" data-a="send">Send question to class →</button></div></div>`;
    q$('[data-a="back"]').onclick = hostLobby; q$('[data-a="send"]').onclick = hostSend; bindFs();
  }
  function hostSend() {
    H.cfg = A.getConfig(); H.seed = (Math.random() * 2 ** 32) >>> 0; H.qn++; H.label = A.label(H.cfg);
    H.answers = new Map(); H.limit = H.secs * 1000; H.deadline = H.secs ? Date.now() + H.limit : null; H.phase = "q";
    seeded(H.seed, () => A.load(H.cfg));
    document.body.classList.add("lc-q"); lockCard(true, true);
    publish(); hostQPanel();
    A.card.scrollIntoView({ behavior: SMOOTH, block: "start" });
  }
  function hostQPanel() {
    el.innerHTML = `<div class="lc-panel"><div class="lc-row"><div class="lc-grow"><p class="lc-label">Question ${H.qn} · ${esc(H.label)}</p>
        ${H.deadline ? `<div class="lc-timer" data-timer>${fmtT(H.limit)}</div><div class="lc-tbar"><i data-tbar style="width:100%"></i></div>` : `<p>No time limit — stop answering whenever the class is ready.</p>`}</div>
        <div><p class="lc-label">Answers in</p><div class="lc-big"><span data-ans>0</span><span style="font-size:.5em"> / <span data-of>0</span></span></div><p data-allin hidden style="font-weight:700">Everyone's in!</p></div></div>
      <div class="lc-row" style="margin-top:10px">${H.deadline ? '<button class="lc-btn" data-a="more">+15 s</button>' : ""}${fsBtn()}<span class="lc-grow"></span><button class="lc-btn primary big" data-a="stop">Stop &amp; show answer</button></div></div>`;
    q$('[data-a="stop"]').onclick = () => hostReveal(false);
    const more = q$('[data-a="more"]'); if (more) more.onclick = () => { H.deadline = Math.max(H.deadline, Date.now()) + 15000; H.limit = Math.max(H.limit, H.deadline - Date.now()); publish(); };
    bindFs(); hostCounts();
  }
  function hostCounts() {
    if (!H) return;
    el.querySelectorAll("[data-joined]").forEach(n => n.textContent = activeCount());
    const a = q$("[data-ans]"); if (!a) return;
    const n = H.answers.size, tot = Math.max(activeCount(), n);
    a.textContent = n; q$("[data-of]").textContent = tot;
    const all = q$("[data-allin]"); if (all) all.hidden = !(tot && n >= tot);
  }
  function hostReveal(timeUp) {
    if (!H || H.phase !== "q") return;
    let c = 0; H.answers.forEach(ok => { if (ok) c++; });
    const n = H.answers.size;
    H.results.push({ qn: H.qn, label: H.label, pct: n ? c / n * 100 : 0, n, timeUp: !!timeUp });
    H.deadline = null; H.phase = "reveal";
    document.body.classList.remove("lc-q"); lockCard(false);
    A.showAnswer(); lockCard(true, true);
    publish();
    const r = H.results[H.results.length - 1], g = pctR(r.pct);
    el.innerHTML = `<div class="lc-panel"><p class="lc-label">${timeUp ? "Time's up · " : ""}Question ${H.qn} · class results</p>
      ${r.n ? `<div class="lc-pcts"><div class="g"><div class="n">${g}%</div><small>got it</small></div><div class="b"><div class="n">${100 - g}%</div><small>not yet</small></div></div>${bars(r.pct, r.n)}<p class="lc-sub">${r.n} answer${r.n === 1 ? "" : "s"}</p>` : ""}
      <div class="lc-msg"><h3>${esc(classMsg(r.pct, r.n))}</h3><p>The answer is shown in the trainer below.</p></div>${goalHTML(classStats())}
      <p class="lc-sub" style="margin-top:10px">Change the question type below if you like, then send the next one.</p>
      <div class="lc-row"><button class="lc-btn" data-a="finish">Finish &amp; recap</button>${fsBtn()}<span class="lc-grow"></span><button class="lc-btn primary big" data-a="next">Next question →</button></div></div>`;
    q$('[data-a="next"]').onclick = hostSend; q$('[data-a="finish"]').onclick = hostFinish; bindFs();
    announce(`${r.n ? g + " percent got it. " : ""}${classMsg(r.pct, r.n)}`);
  }
  function hostFinish() {
    H.phase = "end"; publish(); lockCard(false); document.body.classList.remove("lc-q");
    const cs = classStats(), avg = cs.avg || 0;
    el.innerHTML = `<div class="lc-panel"><p class="lc-label">Session recap</p><h2 class="lc-title" style="font-family:var(--fi-display);font-weight:400;text-transform:uppercase;font-size:44px;margin:0">${esc(endMsg(avg))}</h2>
      <div class="lc-pcts" style="margin-top:8px"><div class="g"><div class="n">${pctR(avg)}%</div><small>class average</small></div><div><div class="n">${H.goal}%</div><small>class goal ${avg >= H.goal ? "— reached!" : "— next time!"}</small></div></div>
      <div class="lc-recap">${H.results.map(r => `<div class="r"><b>${r.qn}</b><span>${esc(r.label)}</span><div class="mb" role="img" aria-label="${r.n ? pctR(r.pct) + " percent" : "no answers"}"><i style="width:${r.pct}%"></i></div><span>${r.n ? pctR(r.pct) + "%" : "—"}</span></div>`).join("")}</div>
      <div class="lc-row" style="margin-top:14px"><button class="lc-btn" data-a="end">End session</button><span class="lc-grow"></span><button class="lc-btn primary big" data-a="again">Play another round (same room)</button></div></div>`;
    q$('[data-a="again"]').onclick = () => { H.results = []; H.qn = 0; hostIntro(); };
    q$('[data-a="end"]').onclick = hostEndSession;
  }
  function hostEndSession() {
    if (!H) return idle();
    try { H.client.publish(topic(H.code) + "/down", JSON.stringify({ phase: "closed" }), { retain: true, qos: 1 }); const c = H.client; setTimeout(() => c.end(true), 500); } catch (e) {}
    (H.timers || []).forEach(clearInterval); H = null; idle();
  }
  function bars(pct, n) {
    if (!n) return "";
    const g = pctR(pct);
    return `<div class="lc-bars" role="img" aria-label="${g} percent correct, ${100 - g} percent not yet">${g ? `<div class="g" style="width:${Math.max(g, 8)}%;${g === 100 ? "flex:1" : ""}">${g}%</div>` : ""}${g < 100 ? `<div class="b">${100 - g}%</div>` : ""}</div>`;
  }
  function goalHTML(cs) {
    if (!cs || cs.avg == null) return `<div class="lc-goal"><b>Class goal: ${cs ? cs.goal : 70}%</b> — we're all in this together. Every answer counts toward the class average.</div>`;
    const a = pctR(cs.avg), met = a >= cs.goal;
    return `<div class="lc-goal"><div class="lc-row"><b>Class average: ${a}%</b><span class="lc-grow"></span><span>Goal ${cs.goal}%${met ? " ✓ on track!" : ""}</span></div>
      <div class="lc-tbar" role="img" aria-label="Class average ${a} percent; goal ${cs.goal} percent"><i style="width:${a}%"></i><span class="mark" style="left:${cs.goal}%"></span></div>
      <span>${met ? "The class is above the goal — keep it going!" : "Keep going together — every question is a fresh chance."} (${cs.done} question${cs.done === 1 ? "" : "s"} so far)</span></div>`;
  }

  /* ============================================================ STUDENT */
  function joinForm(prefill) {
    el.innerHTML = `<div class="lc-panel"><p class="lc-label">Join a class game</p>
      <p>Enter the code on the projector screen. No name needed — your answers are anonymous.</p>
      <div class="lc-row"><input class="lc-codein" id="lc-code" maxlength="5" aria-label="Room code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="•••••" value="${esc(prefill || "")}">
      <button class="lc-btn primary big" data-a="join">Join</button><button class="lc-btn" data-a="cancel">Cancel</button></div><p data-msg role="status"></p></div>`;
    const inp = q$("#lc-code");
    inp.oninput = () => { inp.value = inp.value.toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/[IO01]/g, c => ({ I: "1", O: "0" }[c] || c)).slice(0, 5); };
    q$('[data-a="cancel"]').onclick = idle;
    const go = async () => {
      const code = inp.value.toUpperCase(), msg = q$("[data-msg]");
      if (code.length !== 5 || [...code].some(c => !ALPH.includes(c))) { msg.textContent = "Codes are 5 characters — check the screen."; return; }
      q$('[data-a="join"]').disabled = true; msg.textContent = "Connecting…";
      try { startStudent(await connectTo(brokerFor(code)), code); }
      catch (e) { msg.innerHTML = '<span class="lc-err" style="display:block">Couldn\'t connect. Check your internet connection (try switching Wi-Fi ↔ cellular) and tap Join again.</span>'; q$('[data-a="join"]').disabled = false; }
    };
    q$('[data-a="join"]').onclick = go; inp.onkeydown = e => { if (e.key === "Enter") go(); };
    if (prefill && prefill.length === 5) go(); else inp.focus();
  }
  function startStudent(client, code) {
    let id; try { id = sessionStorage.getItem("sa_id_" + code); } catch (e) {}
    if (!id) { id = randId(12); try { sessionStorage.setItem("sa_id_" + code, id); } catch (e) {} }
    S = { client, code, id, phase: "wait", qn: 0, mine: {}, secs: 0, goal: 70, deadline: null, limit: null, got: false };
    const T = topic(code);
    S.send = m => client.publish(T + "/up", JSON.stringify({ ...m, id }), { qos: 1 });
    client.subscribe(T + "/down", { qos: 1 }); client.subscribe(T + "/tick", { qos: 0 });
    client.on("connect", () => S && S.send({ t: "hi" }));
    client.on("message", (tp, buf) => {
      if (!S || S.client !== client) return;
      let m; try { m = JSON.parse(buf.toString()); } catch (e) { return; }
      if (tp === T + "/tick") { if (S.phase === "q") { S.deadline = m.left != null ? Date.now() + m.left : null; S.limit = m.limit; S.answeredN = m.answered; S.joinedN = m.joined; crowd(); } return; }
      if (tp === T + "/down") { S.got = true; studentState(m); }
    });
    S.timers = [setInterval(() => S && S.send({ t: "hb" }), 15000)];
    S.send({ t: "hi" });
    document.body.classList.add("lc-student", "lc-idle");
    studentRender();
    setTimeout(() => { if (S && !S.got) { S.note = `Waiting for room ${code}… if nothing happens, double-check the code on the screen.`; studentRender(); } }, 6000);
  }
  function studentState(st) {
    if (st.phase === "closed") { leaveStudent("The session has ended — thanks for playing!"); return; }
    S.secs = st.secs || 0; S.goal = st.goal || 70; S.cls = st.cls;
    const prevPhase = S.phase, prevQn = S.qn;
    S.phase = st.phase; S.qn = st.qn || 0;
    if (st.phase === "q" || st.phase === "reveal") {
      S.label = st.label;
      if (S.qn !== S.loadedQn) {           // new question: build it from the shared seed
        S.loadedQn = S.qn;
        document.body.classList.remove("lc-locked", "lc-idle"); lockCard(false);
        document.body.classList.add("lc-hold");
        seeded(st.seed, () => A.load(st.cfg));
        if (st.phase === "q") { window.scrollTo({ top: 0, behavior: SMOOTH }); toast(""); announce(`Question ${S.qn}: ${st.label}`); }
      }
      if (st.phase === "q") { S.deadline = st.left != null ? Date.now() + st.left : null; S.limit = st.limit; S.answeredN = st.answered; S.joinedN = st.joined; }
      if (st.phase === "reveal" && (prevPhase !== "reveal" || prevQn !== S.qn)) {
        S.reveal = st.reveal;
        document.body.classList.remove("lc-hold");
        if (S.mine[S.qn] == null) { lockCard(false); A.showAnswer(); }
        lockCard(true);
        const r = st.reveal || { pct: 0, n: 0 }, mine = S.mine[S.qn];
        if (mine != null) { if (window.SFX) SFX.play(mine); if (window.SAprogress) SAprogress.record("Class game · " + (S.label || A.name), mine); }
        announce(`${mine == null ? "Time's up." : mine ? "You got it!" : "Not quite — check the answer."} ${r.n ? pctR(r.pct) + " percent of the class got it." : ""}`);
        if (inPractice()) toast("Class answer is in — tap to see");
      }
    } else {
      document.body.classList.remove("lc-hold", "lc-locked"); lockCard(false);
      document.body.classList.add("lc-idle");
    }
    if (st.phase === "end") S.recap = st.recap;
    studentRender();
  }
  function studentRender() {
    if (!S) return;
    const st = S, mine = st.mine[st.qn];
    const done = Object.keys(st.mine).length, right = Object.values(st.mine).filter(Boolean).length;
    let main = "";
    if (st.phase === "q") {
      main = `<p class="lc-label">Question ${st.qn} · ${esc(st.label || "")}</p>
        <div data-stimer ${st.deadline ? "" : "hidden"}><div class="lc-row"><span class="lc-timer" style="font-size:48px" data-sclock>0:00</span><span class="lc-grow"></span><span data-crowd></span></div><div class="lc-tbar"><i data-sbar style="width:100%"></i></div></div>
        ${mine != null ? `<div class="lc-msg"><h3>Answer locked in</h3><p>Waiting for the rest of the class… the answer appears on everyone's screen at the same time.</p></div>` : `<p>Answer in the trainer below — you get one try.</p>`}`;
    } else if (st.phase === "reveal") {
      const r = st.reveal || { pct: 0, n: 0 };
      const head = mine == null ? "Time ran out — no problem! Here's the answer." : mine ? "You got it!" : "Not quite — and that's how learning sticks.";
      main = `<p class="lc-label">Question ${st.qn} · ${esc(st.label || "")}</p>
        <div class="lc-msg ${mine == null ? "" : mine ? "good" : "bad"}"><h3>${esc(head)}</h3><p>The answer and explanation are in the trainer below.</p></div>
        <p class="lc-label" style="margin-top:10px">Class</p>${r.n ? bars(r.pct, r.n) + `<p class="lc-sub">${pctR(r.pct)}% of the class got this one · ${esc(classMsg(r.pct, r.n))}</p>` : `<p class="lc-sub">${esc(classMsg(0, 0))}</p>`}${goalHTML(st.cls)}`;
    } else if (st.phase === "end") {
      const cs = st.cls || {}, avg = cs.avg || 0;
      main = `<p class="lc-label">That's a wrap</p><div class="lc-pcts"><div class="g"><div class="n">${right}/${done}</div><small>you got right</small></div><div><div class="n">${pctR(avg)}%</div><small>class average</small></div></div>
        ${cs.avg != null ? `<p><b>${avg >= cs.goal ? `The class reached its ${cs.goal}% goal together!` : `Class goal was ${cs.goal}% — we'll get there together next time.`}</b></p>` : ""}<p class="lc-sub">Only you can see your own score.</p>`;
    } else {
      main = `<div class="lc-wait"><span class="lc-pulse" aria-hidden="true"></span><b>You're in!</b> <span>${esc(st.note || (st.phase === "intro" ? "The first question is coming up." : "The game will start soon."))}</span></div><div style="margin-top:12px">${howTo(true)}</div>`;
    }
    el.innerHTML = `<div class="lc-panel"><div class="lc-row" style="margin-bottom:8px"><span class="lc-label" style="margin:0">Room ${esc(st.code)}${done ? ` · You: ${right}/${done}` : ""}</span><span class="lc-grow"></span><button class="lc-btn" data-a="leave">Leave</button></div>${main}</div>
      ${practiceBox()}`;
    q$('[data-a="leave"]').onclick = () => { if (confirm("Leave this class game?")) leaveStudent(); };
    bindPractice(); crowd(); clock();
  }
  function leaveStudent(note) {
    if (!S) return;
    try { S.client.end(true); } catch (e) {}
    (S.timers || []).forEach(clearInterval); S = null;
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    idle();
    if (note) { const p = document.createElement("p"); p.className = "lc-msg"; p.textContent = note; el.appendChild(p); announce(note); }
  }
  function crowd() { const c = q$ && el && q$("[data-crowd]"); if (c && S && S.joinedN) c.textContent = `${S.answeredN || 0} of ${S.joinedN} answered`; }
  function clock() {
    if (!S || S.phase !== "q" || !el) return;
    const w = q$("[data-stimer]"); if (!w) return;
    if (!S.deadline) { w.hidden = true; return; }
    w.hidden = false;
    const left = Math.max(0, S.deadline - Date.now());
    q$("[data-sclock]").textContent = fmtT(left);
    q$("[data-sclock]").classList.toggle("low", left <= 5000);
    q$("[data-sbar]").style.width = (S.limit ? left / S.limit * 100 : 0) + "%";
    q$("[data-sbar]").parentNode.classList.toggle("low", left <= 5000);
    const sec = Math.ceil(left / 1000);
    if ((sec === 10 || sec === 5) && S.warned !== sec + ":" + S.qn) { S.warned = sec + ":" + S.qn; announce(`${sec} seconds left`, true); }
    if (left <= 0 && S.mine[S.qn] == null && !S.timedOut) { S.timedOut = S.qn; lockCard(true); }
  }
  function tick() {
    clock();
    if (!H || H.phase !== "q" || !H.deadline) return;
    const left = H.deadline - Date.now();
    const t = q$("[data-timer]"); if (t) { t.textContent = fmtT(Math.max(0, left)); t.classList.toggle("low", left <= 5000); }
    const b = q$("[data-tbar]"); if (b) { b.style.width = Math.max(0, left / H.limit * 100) + "%"; b.parentNode.classList.toggle("low", left <= 5000); }
    if (left <= 0) hostReveal(true);
  }

  /* ---- work ahead: the same trainer, privately, in an embedded frame ---- */
  function practiceBox() {
    const open = S && S.practiceOpen;
    return `<details class="lc-practice" ${open ? "open" : ""}><summary>Work ahead on your own <small>private practice — nothing here is sent to the class</small></summary>
      ${open ? `<iframe title="Private practice: ${esc(A.name)}" src="${esc(location.pathname)}?solo=1" loading="lazy"></iframe>` : ""}</details>`;
  }
  function bindPractice() {
    const d = q$(".lc-practice"); if (!d) return;
    d.addEventListener("toggle", () => {
      if (!S) return;
      S.practiceOpen = d.open;
      if (d.open && !d.querySelector("iframe")) d.insertAdjacentHTML("beforeend", `<iframe title="Private practice: ${esc(A.name)}" src="${esc(location.pathname)}?solo=1"></iframe>`);
      sizeFrame();
    });
    // keep the open frame across re-renders
    if (S && S.frame && S.practiceOpen) { const f = d.querySelector("iframe"); if (f) f.replaceWith(S.frame); }
    sizeFrame();
  }
  function sizeFrame() {
    const f = el && q$(".lc-practice iframe"); if (!f) return;
    S.frame = f;
    const fit = () => { try { const h = f.contentDocument.documentElement.scrollHeight; if (h) f.style.height = h + "px"; } catch (e) {} };
    f.onload = () => { fit(); try { new ResizeObserver(fit).observe(f.contentDocument.body); } catch (e) { setInterval(fit, 1000); } };
    fit();
  }
  const inPractice = () => { const d = el && q$(".lc-practice[open]"); return d && d.getBoundingClientRect().top < window.innerHeight * .4; };
  function toast(text) {
    let t = document.getElementById("lc-toast");
    if (!t) { t = document.createElement("button"); t.id = "lc-toast"; t.className = "lc-toast"; document.body.appendChild(t); t.onclick = () => { window.scrollTo({ top: 0, behavior: SMOOTH }); t.classList.remove("show"); }; }
    if (!text) { t.classList.remove("show"); return; }
    t.textContent = text; t.classList.add("show"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 7000);
  }

  /* ---- lock / unlock the practice card ---- */
  function lockCard(on, hostView) {
    const card = A && A.card; if (!card) return;
    card.querySelectorAll("button, input, select, textarea").forEach(n => {
      const keep = n.closest(".play, .play-row, [data-play], .lc-keep") || /play|listen|hear/i.test(n.className + " " + (n.dataset.play || ""));
      if (on && !keep) { if (!n.hasAttribute("data-lc-dis")) { n.setAttribute("data-lc-dis", n.disabled ? "1" : "0"); n.disabled = true; } }
      else if (!on && n.hasAttribute("data-lc-dis")) { n.disabled = n.getAttribute("data-lc-dis") === "1"; n.removeAttribute("data-lc-dis"); }
    });
    card.classList.toggle("lc-locked-card", !!on);
    if (on && !hostView) card.setAttribute("aria-describedby", "lc-live");
  }
  // trainers re-render their card; re-apply the lock when they do
  new MutationObserver(() => {
    if (!A || !A.card) return;
    const shouldLock = (H && H.phase === "q") || (S && (S.mine[S.qn] != null || S.phase === "reveal" || S.timedOut === S.qn) && (S.phase === "q" || S.phase === "reveal"));
    if (shouldLock) lockCard(true, !!H);
  }).observe(document.documentElement, { subtree: true, childList: true });
})();
