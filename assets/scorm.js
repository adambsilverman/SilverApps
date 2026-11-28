/* SilverApps SCORM 1.2 packages, shared by gradebook-sync.html (one Test Yourself quiz) and test-maker.html (a professor's test).
   SAscorm.pkg(q, site, pass) returns the bytes of a .zip: imsmanifest.xml + index.html, a page that shows the live quiz from the
   site in a frame and passes the score to the LMS. q: { page or id, title, url (relative to site; default page + ".html#quiz"),
   item (the LMS item title; default "<title>: Test Yourself"), orgTitle, mastery }. SAscorm.zip(files) and SAscorm.save(bytes, name) too.
   Mastery packages (Skill Tests, q.mastery = the percent that counts as mastered, e.g. 80): the gradebook gets 100% once the student
   has ever reached mastery and 0% until then, so a 1-point grade item shows 1 or 0; the best percent is kept in suspend_data.
   (Built from build/shared/scorm.js into assets/scorm.js.) */
window.SAscorm = (() => {
  /* ---- minimal ZIP writer (stored, no compression) ---- */
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(files) {   // files: [{name, data: Uint8Array|string}]
    const enc = new TextEncoder(), parts = [], central = []; let off = 0;
    const d = new Date(), dt = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF, dd = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
    for (const f of files) {
      const name = enc.encode(f.name), data = typeof f.data === "string" ? enc.encode(f.data) : f.data, crc = crc32(data);
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint16(10, dt, true); h.setUint16(12, dd, true);
      h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
      parts.push(new Uint8Array(h.buffer), name, data);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true); c.setUint16(12, dt, true); c.setUint16(14, dd, true);
      c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, off, true);
      central.push(new Uint8Array(c.buffer), name);
      off += 30 + name.length + data.length;
    }
    const csize = central.reduce((n, p) => n + p.length, 0), e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, csize, true); e.setUint32(16, off, true);
    const blob = [...parts, ...central, new Uint8Array(e.buffer)], out = new Uint8Array(blob.reduce((n, p) => n + p.length, 0)); let o = 0;
    for (const p of blob) { out.set(p, o); o += p.length; }
    return out;
  }
  const x = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  function manifest(q, pass) {
    const id = "silverapps-" + (q.id || q.page).replace(/[^\w-]/g, "").slice(0, 80);
    return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${id}" version="1.0" xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2" xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata><schema>ADL SCORM</schema><schemaversion>1.2</schemaversion></metadata>
  <organizations default="org1">
    <organization identifier="org1">
      <title>${x(q.orgTitle || q.title + " quiz")}</title>
      <item identifier="item1" identifierref="res1" isvisible="true">
        <title>${x(q.item || q.title + ": Test Yourself")}</title>${pass !== "" ? `\n        <adlcp:masteryscore>${pass}</adlcp:masteryscore>` : ""}
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res1" type="webcontent" adlcp:scormtype="sco" href="index.html"><file href="index.html"/></resource>
  </resources>
</manifest>
`;
  }
  function wrapper(q, site, pass) {
    const url = q.url ? new URL(q.url, site).href : new URL(q.page + ".html#quiz", site).href, item = q.item || (q.title + ": Test Yourself");
    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${x(item)}</title>
<style>html,body{margin:0;height:100%;background:#fffdf9}body{display:flex;flex-direction:column}#bar{font:15px/1.4 Georgia,serif;padding:8px 14px;background:#fff4d6;border-bottom:1px solid #e5d3a0;color:#231d19}#bar[hidden]{display:none}iframe{flex:1;border:0;width:100%;min-height:600px}a{color:#9b2a14}</style>
</head><body>
<p id="bar" hidden role="status"></p>
<iframe id="sa" title="${x(item)}" allow="autoplay; fullscreen; microphone; clipboard-write" src="${x(url)}"></iframe>
<script>
/* SilverApps SCORM 1.2 package. Generated by gradebook-sync.html.
   Shows the live quiz from the SilverApps site; when the student finishes, the first-try score (percent) is sent to the LMS.
   The best score is kept: a lower later attempt does not replace a higher one. */
(function () {
  var QUIZ = ${JSON.stringify(url)}, ORIGIN = new URL(QUIZ).origin, PASS = ${pass === "" ? "null" : Number(pass)}, MASTERY = ${q.mastery ? Number(q.mastery) : "null"};
  var frame = document.getElementById("sa"), bar = document.getElementById("bar"), api = null, live = false, finished = false;
  function say(t) { bar.textContent = t; bar.hidden = !t; }
  function find(w) { for (var n = 0; w && n < 12; n++) { try { if (w.API) return w.API; } catch (e) {} if (w.parent === w) break; w = w.parent; } return null; }
  api = find(window) || (window.opener ? find(window.opener) : null);
  function get(k) { try { return String(api.LMSGetValue(k) || ""); } catch (e) { return ""; } }
  function set(k, v) { try { return api.LMSSetValue(k, String(v)); } catch (e) { return false; } }
  if (api) { try { live = String(api.LMSInitialize("")) === "true"; } catch (e) {} }
  if (live) { var st = get("cmi.core.lesson_status"); if (!st || st === "not attempted") { set("cmi.core.lesson_status", "incomplete"); try { api.LMSCommit(""); } catch (e) {} } }
  else say("This quiz isn't connected to a gradebook here, so scores won't be recorded. Open it from your course to have your score count.");
  function hello() {
    if (!live) return;
    var n = get("cmi.core.student_name"), parts = n.split(","), name = parts.length > 1 ? (parts.slice(1).join(",").trim() + " " + parts[0].trim()).trim() : n;
    try { frame.contentWindow.postMessage({ type: "silverapps-lms", name: name, id: get("cmi.core.student_id"), lms: "scorm12" }, ORIGIN); } catch (e) {}
  }
  frame.addEventListener("load", hello);
  window.addEventListener("message", function (e) {
    if (e.origin !== ORIGIN || e.source !== frame.contentWindow || !e.data) return;
    if (e.data.type === "silverapps-ready") { hello(); return; }
    if (e.data.type !== "silverapps-quiz-result" || !live) return;
    var pct = Math.max(0, Math.min(100, Math.round(+e.data.pct || 0))), prev = parseFloat(get("cmi.core.score.raw"));
    var qs = e.data.questions || [], base = parseInt(get("cmi.interactions._count"), 10) || 0, i, p;
    if (MASTERY !== null) {   // Skill Test: all or nothing, and once mastered it stays mastered
      var sd = {}; try { sd = JSON.parse(get("cmi.suspend_data") || "{}") || {}; } catch (e3) {}
      var bestP = Math.max(+sd.best || 0, pct), was = sd.mastered === true || get("cmi.core.lesson_status") === "passed" || prev >= 100, now = pct >= MASTERY, done = was || now;
      set("cmi.core.score.min", 0); set("cmi.core.score.max", 100); set("cmi.core.score.raw", done ? 100 : 0);
      set("cmi.core.lesson_status", done ? "passed" : "incomplete");
      for (i = 0; i < qs.length && base + i < 250; i++) { p = "cmi.interactions." + (base + i) + "."; set(p + "id", String(qs[i].id || ("q" + (i + 1))).replace(/[^\\w.-]/g, "_").slice(0, 250)); set(p + "type", "choice"); set(p + "result", qs[i].correct ? "correct" : "wrong"); }
      set("cmi.suspend_data", JSON.stringify({ best: bestP, last: pct, mastered: done, at: new Date().toISOString() }).slice(0, 4000));
      try { api.LMSCommit(""); } catch (e4) {}
      say(now ? "Mastered (" + pct + "%). Full credit for this skill is in your gradebook." : was ? "This try: " + pct + "%. You've already mastered this skill, so your credit stays." : "This try: " + pct + "%. Mastery takes " + MASTERY + "%, so no credit yet. Try again: every try has new questions.");
      return;
    }
    if (isNaN(prev) || pct >= prev) { set("cmi.core.score.min", 0); set("cmi.core.score.max", 100); set("cmi.core.score.raw", pct); }
    var bestPct = isNaN(prev) ? pct : Math.max(prev, pct);
    set("cmi.core.lesson_status", PASS === null ? "completed" : (bestPct >= PASS ? "passed" : "failed"));
    for (i = 0; i < qs.length && base + i < 250; i++) {
      p = "cmi.interactions." + (base + i) + ".";
      set(p + "id", String(qs[i].id || ("q" + (i + 1))).replace(/[^\\w.-]/g, "_").slice(0, 250)); set(p + "type", "choice"); set(p + "result", qs[i].correct ? "correct" : "wrong");
    }
    set("cmi.suspend_data", JSON.stringify({ best: bestPct, last: pct, at: new Date().toISOString() }).slice(0, 4000));
    try { api.LMSCommit(""); } catch (e2) {}
    say("Score sent to your gradebook: " + pct + "%" + (pct < bestPct ? " (your best, " + bestPct + "%, is the one kept)." : "."));
  });
  function quit() { if (live && !finished) { finished = true; try { api.LMSCommit(""); api.LMSFinish(""); } catch (e) {} } }
  window.addEventListener("pagehide", quit); window.addEventListener("beforeunload", quit);
})();
<\/script>
</body></html>
`;
  }
  function pkg(q, site, pass) {
    pass = pass === "" || pass == null ? "" : String(Math.max(0, Math.min(100, Math.round(+pass))));
    site = site.endsWith("/") ? site : site + "/";
    if (q.mastery) pass = "";
    return zip([{ name: "imsmanifest.xml", data: manifest(q, pass) }, { name: "index.html", data: wrapper(q, site, pass) }]);
  }
  /* ---- Skill Mastery: ONE package (one grade item) holding every Skill Test ----
     The package page lists the tests (from build/shared/skilltest.js) with each one's best score; a test opens in a frame.
     The grade is the average of the best score on each skill (a skill not taken yet counts 0), so it only goes up.
     suspend_data: {"v":1,"b":{"<skill id>":best percent},"t":{"<skill id>":tries}}. lesson_status: incomplete until every
     skill has been tried, then completed; passed once every skill is at its mastery mark.
     For the instructor's reports: one SCORM objective per skill, in order (cmi.objectives.<n-1>, id "Skill-<n>-<Title>",
     score = best percent, status not attempted / incomplete / passed), so the LMS's Objectives report shows each student's best
     score on every skill; and one interaction per finished try (id "Skill-<n>-try<k>", learner response = percent, result
     correct = reached mastery). */
  function suite(skills, site, o) {
    o = o || {}; site = site.endsWith("/") ? site : site + "/";
    const title = o.title || "Skill Mastery", list = skills.map(k => ({ id: k.id, n: k.n, title: k.title, desc: k.desc, pass: k.pass, count: k.count, url: new URL(k.url, site).href }));
    const man = manifest({ id: "skill-mastery", title, item: title, orgTitle: "SilverApps " + title }, "");
    const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${x(title)}</title>
<style>
html,body{margin:0;background:#fbf6ee;color:#231d19;font:17px/1.5 Georgia,"Times New Roman",serif}
#menu{max-width:860px;margin:0 auto;padding:18px 18px 40px}
h1{font:700 30px/1.15 Georgia,serif;margin:0 0 6px}
.lead{margin:0 0 14px}
.total{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 16px;border:2px solid #231d19;border-radius:12px;background:#fff;padding:12px 16px;margin:0 0 16px}
.total b{font-size:34px;line-height:1}
.bar{flex:1 1 100%;height:10px;border-radius:5px;background:#e6ddd0;overflow:hidden}.bar i{display:block;height:100%;background:#9b2a14}
ol{list-style:none;margin:0;padding:0;display:grid;gap:10px}
li{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 14px;align-items:center;background:#fff;border:1.5px solid #cdbfae;border-radius:12px;padding:12px 14px}
li h2{font:700 19px/1.25 Georgia,serif;margin:0}
li p{margin:2px 0 0;font-size:15px;color:#4d443c}
.st{font-weight:700}.st.ok{color:#1d6b2f}.st.go{color:#8a4b08}
button{font:700 15px/1 Georgia,serif;border:2px solid #231d19;border-radius:999px;background:#fff;color:#231d19;padding:10px 16px;cursor:pointer;white-space:nowrap}
button.primary{background:#9b2a14;border-color:#9b2a14;color:#fff}
button:focus-visible{outline:3px solid #1f4e8c;outline-offset:2px}
#test{display:none;flex-direction:column;height:100vh}
#top{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;padding:8px 12px;background:#fff4d6;border-bottom:1px solid #e5d3a0}
#top span{font-weight:700}
#bar{margin:0;flex:1 1 260px;font-size:15px}
iframe{flex:1;border:0;width:100%;min-height:600px}
.warn{background:#fff4d6;border-left:6px solid #c98a00;padding:10px 14px;border-radius:6px}
body.testing #menu{display:none}body.testing #test{display:flex}
@media (max-width:560px){li{grid-template-columns:1fr}}
</style></head><body>
<main id="menu">
<h1>${x(title)}</h1>
<p class="lead">${list.length} Skill Tests of ${list[0] ? list[0].count : 20} questions each. Your grade for each skill is your <b>best score</b> on its test, and your ${x(title)} grade is the average of the ${list.length}. Taking a test again can only raise it, and every try has new questions. ${list[0] ? list[0].pass : 80}% or better means the skill is mastered.</p>
<p id="warn" class="warn" hidden>This page isn't connected to a gradebook here, so scores won't be recorded. Open ${x(title)} from your course to have your scores count.</p>
<div class="total" role="status" aria-live="polite"><span>Your ${x(title)} grade:</span><b id="tot">0%</b><span id="totSub"></span><span class="bar" aria-hidden="true"><i id="totBar" style="width:0"></i></span></div>
<ol id="list"></ol>
</main>
<div id="test"><div id="top"><button type="button" id="back">&larr; All Skill Tests</button><span id="now"></span><p id="bar" role="status" aria-live="polite"></p></div>
<iframe id="sa" title="Skill Test" allow="autoplay; fullscreen; microphone; clipboard-write"></iframe></div>
<script>
/* SilverApps ${x(title)} (SCORM 1.2). Generated by gradebook-sync.html. */
(function () {
  var SK = ${JSON.stringify(list)}, ORIGIN = new URL(SK[0].url).origin;
  var api = null, live = false, quit = false, cur = null, B = {}, T = {};
  var $ = function (id) { return document.getElementById(id); }, frame = $("sa");
  function esc(s) { return String(s).split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;").split('"').join("&quot;"); }
  function find(w) { for (var n = 0; w && n < 12; n++) { try { if (w.API) return w.API; } catch (e) {} if (w.parent === w) break; w = w.parent; } return null; }
  api = find(window) || (window.opener ? find(window.opener) : null);
  function get(k) { try { return String(api.LMSGetValue(k) || ""); } catch (e) { return ""; } }
  function set(k, v) { try { return api.LMSSetValue(k, String(v)); } catch (e) { return false; } }
  if (api) { try { live = String(api.LMSInitialize("")) === "true"; } catch (e) {} }
  if (live) {
    try { var sd = JSON.parse(get("cmi.suspend_data") || "{}") || {}; B = sd.b || {}; T = sd.t || {}; } catch (e) {}
    var st = get("cmi.core.lesson_status"); if (!st || st === "not attempted") { set("cmi.core.lesson_status", "incomplete"); try { api.LMSCommit(""); } catch (e) {} }
  } else $("warn").hidden = false;
  function objId(k) { var t = k.title, o = ""; for (var i = 0; i < t.length; i++) { var c = t.charAt(i); o += /[A-Za-z0-9]/.test(c) ? c : (o.slice(-1) === "-" ? "" : "-"); } return ("Skill-" + k.n + "-" + o).replace(/-$/, "").slice(0, 250); }
  function objective(i) {   // write skill i's objective (index = its place in the list; SCORM 1.2 needs them in order)
    var k = SK[i], b = B[k.id], p = "cmi.objectives." + i + ".";
    set(p + "id", objId(k));
    if (b != null) { set(p + "score.min", 0); set(p + "score.max", 100); set(p + "score.raw", b); }
    set(p + "status", b == null ? "not attempted" : b >= k.pass ? "passed" : "incomplete");
  }
  if (live) { for (var oi = 0; oi < SK.length; oi++) objective(oi); try { api.LMSCommit(""); } catch (e) {} }
  function total() { var s = 0; SK.forEach(function (k) { s += +B[k.id] || 0; }); return Math.round(s / SK.length * 10) / 10; }
  function draw() {
    var t = total(), m = 0;
    $("list").innerHTML = SK.map(function (k) {
      var b = B[k.id], has = b != null, ok = has && b >= k.pass; if (ok) m++;
      return '<li><div><h2>Skill Test ' + k.n + ': ' + esc(k.title) + '</h2><p>' + esc(k.desc) + '</p><p class="st ' + (ok ? "ok" : has ? "go" : "") + '">' + (has ? "Best score: " + b + "%" + (ok ? " \\u00b7 Mastered \\u2713" : " \\u00b7 not mastered yet") + (T[k.id] ? " (" + T[k.id] + (T[k.id] === 1 ? " try)" : " tries)") : "") : "Not taken yet") + '</p></div>'
        + '<button type="button" class="' + (has ? "" : "primary") + '" data-k="' + k.id + '">' + (has ? "Try again" : "Take the test") + '<span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">: Skill Test ' + k.n + '</span></button></li>';
    }).join("");
    $("tot").textContent = t + "%"; $("totBar").style.width = t + "%";
    $("totSub").textContent = m + " of " + SK.length + " skills mastered";
  }
  function open(id) {
    for (var i = 0; i < SK.length; i++) if (SK[i].id === id) cur = SK[i];
    if (!cur) return;
    $("now").textContent = "Skill Test " + cur.n + ": " + cur.title; $("bar").textContent = B[cur.id] != null ? "Your best so far: " + B[cur.id] + "%." : "";
    frame.title = "Skill Test " + cur.n + ": " + cur.title; frame.src = cur.url;
    document.body.classList.add("testing"); window.scrollTo(0, 0); $("back").focus();
  }
  function back() { document.body.classList.remove("testing"); frame.src = "about:blank"; var id = cur && cur.id; cur = null; draw(); var b = document.querySelector('[data-k="' + id + '"]'); if (b) b.focus(); window.scrollTo(0, 0); }
  $("list").addEventListener("click", function (e) { var b = e.target.closest("[data-k]"); if (b) open(b.getAttribute("data-k")); });
  $("back").addEventListener("click", back);
  function hello() {
    if (!live) return;
    var n = get("cmi.core.student_name"), parts = n.split(","), name = parts.length > 1 ? (parts.slice(1).join(",").trim() + " " + parts[0].trim()).trim() : n;
    try { frame.contentWindow.postMessage({ type: "silverapps-lms", name: name, id: get("cmi.core.student_id"), lms: "scorm12" }, ORIGIN); } catch (e) {}
  }
  frame.addEventListener("load", hello);
  window.addEventListener("message", function (e) {
    if (e.origin !== ORIGIN || e.source !== frame.contentWindow || !e.data) return;
    if (e.data.type === "silverapps-ready") { hello(); return; }
    if (e.data.type !== "silverapps-quiz-result" || !cur || e.data.skill !== cur.id) return;
    var pct = Math.max(0, Math.min(100, Math.round(+e.data.pct || 0))), prev = B[cur.id], up = prev == null || pct > prev;
    if (up) B[cur.id] = pct; T[cur.id] = (T[cur.id] || 0) + 1;
    var t = total(), tried = 0, mastered = 0;
    SK.forEach(function (k) { if (B[k.id] != null) tried++; if (B[k.id] >= k.pass) mastered++; });
    if (live) {
      set("cmi.core.score.min", 0); set("cmi.core.score.max", 100); set("cmi.core.score.raw", t);
      set("cmi.core.lesson_status", mastered === SK.length ? "passed" : tried === SK.length ? "completed" : "incomplete");
      var c = parseInt(get("cmi.interactions._count"), 10) || 0;
      objective(SK.indexOf(cur));
      if (c < 250) { var p = "cmi.interactions." + c + "."; set(p + "id", "Skill-" + cur.n + "-try" + T[cur.id]); set(p + "type", "performance"); set(p + "student_response", pct); set(p + "result", pct >= cur.pass ? "correct" : "wrong"); }
      set("cmi.suspend_data", JSON.stringify({ v: 1, b: B, t: T, at: new Date().toISOString() }).slice(0, 4000));
      try { api.LMSCommit(""); } catch (e2) {}
    }
    $("bar").textContent = (up ? (prev == null ? "Saved: " + pct + "% on this skill." : "New best on this skill: " + pct + "% (was " + prev + "%).") : "This try: " + pct + "%. Your best, " + prev + "%, still counts.") + (live ? " " + "Your grade is now " + t + "%." : "");
  });
  function finish() { if (live && !quit) { quit = true; try { api.LMSCommit(""); api.LMSFinish(""); } catch (e) {} } }
  window.addEventListener("pagehide", finish); window.addEventListener("beforeunload", finish);
  draw();
})();
<\/script>
</body></html>
`;
    return zip([{ name: "imsmanifest.xml", data: man }, { name: "index.html", data: page }]);
  }
  /* ---- Weekly Check-ins: ONE package (one grade item) holding every week's short feedback survey ----
     spec = window.SAcheckins (build/shared/checkins.js). The questions are built into the package (no frame, nothing loaded
     from the site), so a change to the questions needs a new package (Upload New Version in the LMS).
     A week opens on its start date and stays open until spec.end. Grade: required = spec.reqPoints, optional = spec.bonusPoints,
     out of spec.outOf, capped at 100%. suspend_data: {"v":1,"d":{"<week>":"<ISO time>"}}.
     For the instructor's reports: one objective per week (id "Week-03", status completed / not attempted) and one interaction per
     answer (id "W03-time" with type likert and the 1-5 answer; written answers as type fill-in, split into 255-character parts
     "W03-helpful-p1", "-p2", ...). */
  function checkins(spec, o) {
    o = o || {};
    const title = o.title || spec.title || "Weekly Check-ins";
    const man = manifest({ id: "weekly-checkins", title, item: title, orgTitle: "SilverApps " + title }, "");
    const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${x(title)}</title>
<style>
html,body{margin:0;background:#fbf6ee;color:#231d19;font:17px/1.5 Georgia,"Times New Roman",serif}
main{max-width:860px;margin:0 auto;padding:18px 18px 48px}
h1{font:700 30px/1.15 Georgia,serif;margin:0 0 6px}
h2{font:700 22px/1.2 Georgia,serif;margin:0 0 4px}
.lead{margin:0 0 14px}
.total{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 16px;border:2px solid #231d19;border-radius:12px;background:#fff;padding:12px 16px;margin:0 0 16px}
.total b{font-size:34px;line-height:1}
.bar{flex:1 1 100%;height:10px;border-radius:5px;background:#e6ddd0;overflow:hidden}.bar i{display:block;height:100%;background:#9b2a14}
ol{list-style:none;margin:0;padding:0;display:grid;gap:10px}
li{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 14px;align-items:center;background:#fff;border:1.5px solid #cdbfae;border-radius:12px;padding:12px 14px}
li h3{font:700 19px/1.25 Georgia,serif;margin:0}
li p{margin:2px 0 0;font-size:15px;color:#4d443c}
.tag{display:inline-block;font:700 12px/1 Georgia,serif;letter-spacing:.04em;text-transform:uppercase;border-radius:999px;padding:4px 8px;margin-left:6px;vertical-align:2px}
.tag.req{background:#9b2a14;color:#fff}.tag.opt{background:#e6ddd0;color:#231d19}
.st{font-weight:700}.st.ok{color:#1d6b2f}.st.go{color:#8a4b08}
button{font:700 15px/1 Georgia,serif;border:2px solid #231d19;border-radius:999px;background:#fff;color:#231d19;padding:10px 16px;cursor:pointer;white-space:nowrap}
button.primary{background:#9b2a14;border-color:#9b2a14;color:#fff}
button:disabled{opacity:.5;cursor:default}
button:focus-visible,input:focus-visible,textarea:focus-visible{outline:3px solid #1f4e8c;outline-offset:2px}
.warn{background:#fff4d6;border-left:6px solid #c98a00;padding:10px 14px;border-radius:6px}
fieldset{border:1.5px solid #cdbfae;border-radius:12px;background:#fff;margin:0 0 12px;padding:10px 14px 12px}
legend{font-weight:700;padding:0 6px}
.opts{display:grid;gap:4px;margin-top:4px}
.opts label{display:flex;gap:10px;align-items:flex-start;padding:6px 8px;border-radius:8px;cursor:pointer}
.opts label:hover{background:#fbf6ee}
.opts input{margin-top:5px;width:18px;height:18px;flex:none}
.q{display:block;font-weight:700;margin:0 0 6px}
textarea{width:100%;box-sizing:border-box;min-height:96px;font:16px/1.45 Georgia,serif;border:1.5px solid #8f8478;border-radius:8px;padding:8px 10px;background:#fff;color:#231d19}
.small{font-size:14px;color:#4d443c}
.err{color:#9b2a14;font-weight:700}
.row{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:14px}
#form[hidden],#menu[hidden]{display:none}
@media (max-width:560px){li{grid-template-columns:1fr}}
</style></head><body>
<main id="menu">
<h1>${x(title)}</h1>
<p class="lead">A short check-in at the end of each week: about 2 minutes. Each week's check-in opens on the first day of that week and stays open until the end of the term. <b>Required</b> weeks count 2 points each; the others are <b>optional bonus</b> (1 point each), which can make up for a missed required week. Your grade is your points out of ${Number(spec.outOf)}.</p>
<p id="warn" class="warn" hidden>This page isn't connected to a gradebook here, so check-ins won't be saved. Open ${x(title)} from your course to have them count.</p>
<div class="total" role="status" aria-live="polite"><span>Your ${x(title)} grade:</span><b id="tot">0%</b><span id="totSub"></span><span class="bar" aria-hidden="true"><i id="totBar" style="width:0"></i></span></div>
<p id="saved" role="status" aria-live="polite"></p>
<ol id="list"></ol>
</main>
<main id="form" hidden>
<p><button type="button" id="back">&larr; All check-ins</button></p>
<h1 id="fh"></h1>
<p id="fsub" class="lead"></p>
<p id="fwarn" class="warn" hidden></p>
<form id="f" novalidate></form>
</main>
<script>
/* SilverApps ${x(title)} (SCORM 1.2). Generated by gradebook-sync.html from build/shared/checkins.js. */
(function () {
  var C = ${JSON.stringify(spec)};
  var api = null, live = false, quit = false, D = {}, cur = null;
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s).split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;").split('"').join("&quot;"); }
  function find(w) { for (var n = 0; w && n < 12; n++) { try { if (w.API) return w.API; } catch (e) {} if (w.parent === w) break; w = w.parent; } return null; }
  api = find(window) || (window.opener ? find(window.opener) : null);
  function get(k) { try { return String(api.LMSGetValue(k) || ""); } catch (e) { return ""; } }
  function set(k, v) { try { return api.LMSSetValue(k, String(v)); } catch (e) { return false; } }
  if (api) { try { live = String(api.LMSInitialize("")) === "true"; } catch (e) {} }
  if (live) {
    try { var sd = JSON.parse(get("cmi.suspend_data") || "{}") || {}; D = sd.d || {}; } catch (e) {}
    var st = get("cmi.core.lesson_status"); if (!st || st === "not attempted") { set("cmi.core.lesson_status", "incomplete"); try { api.LMSCommit(""); } catch (e) {} }
  } else $("warn").hidden = false;
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function day(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  var END = day(C.end); END.setHours(23, 59, 59);
  var MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  function nice(d) { return DAYS[d.getDay()] + " " + MONTHS[d.getMonth()] + " " + d.getDate(); }
  function state(w) { var now = new Date(); if (D[w.n]) return "done"; if (now < day(w.start)) return "soon"; if (now > END) return "closed"; return "open"; }
  function points() { var p = 0; C.weeks.forEach(function (w) { if (D[w.n]) p += w.required ? C.reqPoints : C.bonusPoints; }); return p; }
  function pct() { return Math.min(100, Math.round(points() / C.outOf * 1000) / 10); }
  function objective(i) { var w = C.weeks[i], p = "cmi.objectives." + i + "."; set(p + "id", "Week-" + pad(w.n)); set(p + "status", D[w.n] ? "completed" : "not attempted"); if (D[w.n]) { set(p + "score.min", 0); set(p + "score.max", 100); set(p + "score.raw", 100); } }
  if (live) { for (var oi = 0; oi < C.weeks.length; oi++) objective(oi); try { api.LMSCommit(""); } catch (e) {} }
  function draw() {
    var req = C.weeks.filter(function (w) { return w.required; }), reqDone = req.filter(function (w) { return D[w.n]; }).length, opt = C.weeks.filter(function (w) { return !w.required && D[w.n]; }).length;
    $("list").innerHTML = C.weeks.map(function (w) {
      var s = state(w), d = D[w.n] ? new Date(D[w.n]) : null;
      var stx = s === "done" ? '<p class="st ok">Submitted ' + nice(d) + ' &#10003;</p>' : s === "open" ? '<p class="st go">Open now</p>' : s === "soon" ? '<p class="st">Opens ' + nice(day(w.start)) + '</p>' : '<p class="st">Closed</p>';
      var btn = s === "open" ? '<button type="button" class="primary" data-w="' + w.n + '">Start<span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)"> the Week ' + w.n + ' check-in</span></button>'
        : '<button type="button" data-w="' + w.n + '" data-preview="1">' + (s === "done" ? "See questions" : "Preview") + '<span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">: Week ' + w.n + '</span></button>';
      return '<li><div><h3>Week ' + w.n + ': ' + esc(w.title) + (w.required ? '<span class="tag req">Required</span>' : '<span class="tag opt">Optional bonus</span>') + '</h3>' + stx + '</div>' + btn + '</li>';
    }).join("");
    var t = pct(); $("tot").textContent = t + "%"; $("totBar").style.width = t + "%";
    $("totSub").textContent = reqDone + " of " + req.length + " required done" + (opt ? ", plus " + opt + " optional" : "") + " (" + points() + " of " + C.outOf + " points)";
  }
  function open(n, preview) {
    cur = null; C.weeks.forEach(function (w) { if (w.n === n) cur = w; }); if (!cur) return;
    var ro = preview || state(cur) !== "open";
    $("fh").textContent = "Week " + cur.n + " Check-in"; $("fsub").textContent = cur.title + (cur.required ? " · Required (2 points)" : " · Optional bonus (1 point)");
    $("fwarn").hidden = !ro; $("fwarn").textContent = state(cur) === "done" ? "You submitted this check-in on " + nice(new Date(D[cur.n])) + ". Here are its questions." : state(cur) === "soon" ? "This check-in opens " + nice(day(cur.start)) + ". Here are its questions; you can't submit it yet." : state(cur) === "closed" ? "This check-in is closed." : "";
    var h = "", qn = 0;
    cur.likert.forEach(function (q) { qn++; h += '<fieldset><legend>' + qn + '. ' + esc(q.q) + '</legend><div class="opts">' + q.opts.map(function (o, i) { return '<label><input type="radio" name="' + q.id + '" value="' + (i + 1) + '"' + (ro ? " disabled" : "") + '> <span>' + (i + 1) + ' = ' + esc(o) + '</span></label>'; }).join("") + '</div></fieldset>'; });
    cur.text.forEach(function (q) { qn++; h += '<fieldset><label class="q" for="t-' + q.id + '">' + qn + '. ' + esc(q.q) + (q.optional ? ' <span class="small">(optional)</span>' : "") + '</label><textarea id="t-' + q.id + '" name="' + q.id + '" maxlength="1500"' + (ro ? " disabled" : "") + '></textarea></fieldset>'; });
    h += '<p id="ferr" class="err" role="alert"></p><div class="row">' + (ro ? "" : '<button type="submit" class="primary">Submit check-in</button>') + '<button type="button" id="cancel">' + (ro ? "Back" : "Cancel") + '</button></div>';
    $("f").innerHTML = h; $("menu").hidden = true; $("form").hidden = false; window.scrollTo(0, 0); $("fh").setAttribute("tabindex", "-1"); $("fh").focus();
    $("cancel").onclick = back;
  }
  function back() { $("form").hidden = true; $("menu").hidden = false; var n = cur && cur.n; cur = null; draw(); var b = document.querySelector('[data-w="' + n + '"]'); if (b) b.focus(); window.scrollTo(0, 0); }
  $("back").onclick = back;
  $("list").addEventListener("click", function (e) { var b = e.target.closest("[data-w]"); if (b) open(+b.getAttribute("data-w"), !!b.getAttribute("data-preview")); });
  $("f").addEventListener("submit", function (e) {
    e.preventDefault(); if (!cur || state(cur) !== "open") return;
    var f = $("f"), miss = [], ans = [], qn = 0;
    cur.likert.forEach(function (q) { qn++; var c = f.querySelector('input[name="' + q.id + '"]:checked'); if (!c) miss.push(qn); else ans.push({ id: q.id, type: "likert", v: c.value }); });
    cur.text.forEach(function (q) { qn++; var v = f.querySelector('textarea[name="' + q.id + '"]').value.trim(); if (!v && !q.optional) miss.push(qn); else if (v) ans.push({ id: q.id, type: "fill-in", v: v }); });
    if (miss.length) { $("ferr").textContent = "Please answer question" + (miss.length > 1 ? "s " : " ") + miss.join(", ") + "."; return; }
    D[cur.n] = new Date().toISOString();
    if (live) {
      var c = parseInt(get("cmi.interactions._count"), 10) || 0, pre = "W" + pad(cur.n) + "-";
      ans.forEach(function (a) {
        var parts = a.type === "likert" ? [a.v] : (function (s) { var out = []; for (var i = 0; i < s.length; i += 255) out.push(s.slice(i, i + 255)); return out; })(a.v.replace(/[\\r\\n]+/g, " "));
        parts.forEach(function (pv, k) { if (c >= 1000) return; var p = "cmi.interactions." + c + "."; set(p + "id", pre + a.id + (parts.length > 1 ? "-p" + (k + 1) : "")); set(p + "type", a.type); set(p + "student_response", pv); set(p + "result", "neutral"); c++; });
      });
      objective(C.weeks.indexOf(cur));
      var req = C.weeks.filter(function (w) { return w.required; }), allReq = req.every(function (w) { return D[w.n]; });
      set("cmi.core.score.min", 0); set("cmi.core.score.max", 100); set("cmi.core.score.raw", pct());
      set("cmi.core.lesson_status", allReq ? "completed" : "incomplete");
      set("cmi.suspend_data", JSON.stringify({ v: 1, d: D }).slice(0, 4000));
      try { api.LMSCommit(""); } catch (e2) {}
    }
    var n = cur.n, r = cur.required; back();
    $("saved").textContent = live ? "Thanks! Your Week " + n + " check-in is submitted (" + (r ? "+2 points" : "+1 bonus point") + "). Your grade is now " + pct() + "%." : "Thanks! (Not saved: this page isn't connected to a gradebook.)";
  });
  function finish() { if (live && !quit) { quit = true; try { api.LMSCommit(""); api.LMSFinish(""); } catch (e) {} } }
  window.addEventListener("pagehide", finish); window.addEventListener("beforeunload", finish);
  draw();
})();
<\/script>
</body></html>
`;
    return zip([{ name: "imsmanifest.xml", data: man }, { name: "index.html", data: page }]);
  }
  function save(bytes, name) {
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([bytes], { type: "application/zip" })); a.download = name.replace(/[\\/:*?"<>|]/g, "");
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  return { zip, pkg, suite, checkins, save };
})();
