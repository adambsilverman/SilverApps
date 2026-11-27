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
  function save(bytes, name) {
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([bytes], { type: "application/zip" })); a.download = name.replace(/[\\/:*?"<>|]/g, "");
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  return { zip, pkg, save };
})();
