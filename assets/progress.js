/* =====================================================================
   SilverApps — "Your progress" panel + completion report
   ---------------------------------------------------------------------
   SAprogress.init({id, name, onReset})   call once per app page
   SAprogress.record(category, correct)   call once per graded question
   Progress is kept in this browser (localStorage) until the student resets it.
   The report includes a verification code; verify.html recomputes it, so
   edited numbers are detected. (A deterrent, not cryptographic proof.)
   ===================================================================== */
(function () {
  "use strict";
  const SALT = "silverapps-report-v1";
  let APP = null, D = null, box = null;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const key = () => "silverapps-progress-" + APP.id;
  const blank = () => ({ since: null, last: null, n: 0, r: 0, cats: {} });
  const load = () => { try { return Object.assign(blank(), JSON.parse(localStorage.getItem(key()) || "null") || {}); } catch (e) { return blank(); } };
  const save = () => { try { localStorage.setItem(key(), JSON.stringify(D)); } catch (e) {} };
  const pct = (r, n) => n ? Math.round(r / n * 100) : 0;
  const fmt = t => t ? new Date(t).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";
  const EMBED = new URLSearchParams(location.search).has("solo") || window.top !== window.self;

  /* cyrb53: small deterministic hash -> verification code */
  function cyrb53(str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) { ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  }
  const norm = text => text.replace(/\r/g, "").split("\n").map(l => l.trim()).filter(l => l && !/^Verification code:/i.test(l) && !/^Check it at:/i.test(l)).join("\n");
  const codeFor = text => { const h = cyrb53(SALT + "\n" + norm(text)).toString(36).toUpperCase().padStart(11, "0").slice(-10); return h.slice(0, 5) + "-" + h.slice(5); };
  window.SAverify = { codeFor, norm };

  function panel() {
    if (!box) return;
    const p = pct(D.r, D.n), cats = Object.entries(D.cats);
    box.innerHTML = `<div class="pr-head"><h2 class="pr-title">Your progress</h2>
        <p class="pr-sum"><b>${D.r}</b> of <b>${D.n}</b> correct${D.n ? ` · <b>${p}%</b>` : ""}${D.since ? ` <span>since ${esc(fmt(D.since))}</span>` : ""}</p></div>
      ${cats.length ? `<ul class="pr-cats">${cats.map(([c, v]) => `<li><span>${esc(c)}</span><span class="pr-mini" role="img" aria-label="${pct(v.r, v.n)} percent"><i style="width:${pct(v.r, v.n)}%"></i></span><b>${v.r}/${v.n}</b></li>`).join("")}</ul>` : `<p class="pr-note">Answer some questions and your record appears here. It stays in this browser until you reset it.</p>`}
      <div class="pr-actions"><button type="button" class="pr-btn primary" data-pr="report" ${D.n ? "" : "disabled"}>Completion report for my professor</button>
        <button type="button" class="pr-btn" data-pr="reset" ${D.n ? "" : "disabled"}>Reset my score</button></div>
      <p class="pr-note" data-pr-msg role="status"></p>`;
    box.querySelector('[data-pr="report"]').onclick = openReport;
    const rb = box.querySelector('[data-pr="reset"]');
    rb.onclick = () => {
      if (rb.dataset.armed) { reset(); return; }
      rb.dataset.armed = "1"; rb.textContent = "Tap again to reset"; rb.classList.add("armed");
      box.querySelector("[data-pr-msg]").textContent = "This clears your record for this app. Tap again to confirm.";
      setTimeout(() => { if (rb.isConnected && rb.dataset.armed) { delete rb.dataset.armed; rb.textContent = "Reset my score"; rb.classList.remove("armed"); box.querySelector("[data-pr-msg]").textContent = ""; } }, 4000);
    };
  }
  function reset() { D = blank(); save(); if (APP.onReset) try { APP.onReset(); } catch (e) {} panel(); const m = box.querySelector("[data-pr-msg]"); if (m) m.textContent = "Your score has been reset."; }

  /* ---------------- report ---------------- */
  function reportText(name, course) {
    const lines = [
      "SilverApps for Music Training — Completion report",
      `App: ${APP.name}`,
      `Student: ${name}`,
      course ? `Course or section: ${course}` : null,
      `Report created: ${fmt(Date.now())}`,
      `Practice period: ${fmt(D.since)} to ${fmt(D.last)}`,
      `Questions answered: ${D.n}`,
      `Correct: ${D.r} (${pct(D.r, D.n)}%)`,
      "By question type:",
      ...Object.entries(D.cats).map(([c, v]) => `- ${c}: ${v.r}/${v.n} (${pct(v.r, v.n)}%)`),
    ].filter(Boolean);
    const body = lines.join("\n");
    const verify = new URL("verify.html", location.href).toString();
    return body + `\nVerification code: ${codeFor(body)}\nCheck it at: ${verify}`;
  }
  function openReport() {
    let dlg = document.getElementById("pr-dialog");
    if (!dlg) { dlg = document.createElement("dialog"); dlg.id = "pr-dialog"; dlg.className = "pr-dialog"; dlg.setAttribute("aria-labelledby", "pr-dlg-title"); document.body.appendChild(dlg); }
    let saved = {}; try { saved = JSON.parse(localStorage.getItem("silverapps-student") || "{}"); } catch (e) {}
    dlg.innerHTML = `<form method="dialog" class="pr-form"><h2 id="pr-dlg-title">Completion report</h2>
      <p>Your report shows this app, your name, the date, how many questions you answered and your percent correct, with a verification code your professor can check.</p>
      <label>Your name <input name="name" required autocomplete="name" value="${esc(saved.name || "")}"></label>
      <label>Course or section <small>(optional)</small><input name="course" value="${esc(saved.course || "")}"></label>
      <label>Professor's email <small>(optional, for the Email button)</small><input name="email" type="email" autocomplete="off" value="${esc(saved.email || "")}"></label>
      <div class="pr-actions"><button class="pr-btn" value="cancel" type="button" data-x>Cancel</button><button class="pr-btn primary" type="submit" value="make">Make my report</button></div></form>`;
    const f = dlg.querySelector("form");
    dlg.querySelector("[data-x]").onclick = () => dlg.close();
    f.onsubmit = e => {
      e.preventDefault();
      const name = f.name.value.trim(); if (!name) { f.name.focus(); return; }
      const course = f.course.value.trim(), email = f.email.value.trim();
      try { localStorage.setItem("silverapps-student", JSON.stringify({ name, course, email })); } catch (er) {}
      showReport(dlg, reportText(name, course), name, email);
    };
    dlg.showModal(); (f.name.value ? f.querySelector('[type="submit"]') : f.name).focus();
  }
  function showReport(dlg, text, name, email) {
    const fileBase = `${APP.name} report - ${name}`.replace(/[\\/:*?"<>|]/g, "");
    dlg.innerHTML = `<div class="pr-report"><h2 id="pr-dlg-title">Your completion report</h2>
      <pre class="pr-text" tabindex="0" aria-label="Report text">${esc(text)}</pre>
      <p class="pr-note">Send it any of these ways. Your professor can paste it into the "Check it at" page to confirm the numbers haven't been changed.</p>
      <div class="pr-actions wrap">
        <button type="button" class="pr-btn primary" data-r="print">Print or save as PDF</button>
        <button type="button" class="pr-btn" data-r="download">Download file</button>
        <a class="pr-btn" data-r="email" href="mailto:${encodeURIComponent(email || "")}?subject=${encodeURIComponent(APP.name + " — completion report — " + name)}&body=${encodeURIComponent(text)}">Email it</a>
        <button type="button" class="pr-btn" data-r="copy">Copy text</button>
        <button type="button" class="pr-btn" data-r="close">Close</button></div>
      <p class="pr-note" data-r-msg role="status"></p></div>`;
    const msg = t => { dlg.querySelector("[data-r-msg]").textContent = t; };
    dlg.querySelector('[data-r="close"]').onclick = () => dlg.close();
    dlg.querySelector('[data-r="copy"]').onclick = async () => { try { await navigator.clipboard.writeText(text); msg("Copied. Paste it into an email or your course's assignment box."); } catch (e) { const r = document.createRange(); r.selectNodeContents(dlg.querySelector(".pr-text")); getSelection().removeAllRanges(); getSelection().addRange(r); msg("Text selected — press Ctrl+C / ⌘C to copy."); } };
    dlg.querySelector('[data-r="download"]').onclick = () => {
      const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(fileBase)}</title><style>body{font:16px/1.5 Georgia,serif;max-width:640px;margin:40px auto;padding:0 16px;color:#231d19}pre{white-space:pre-wrap;font:16px/1.6 Georgia,serif;border:1.5px solid #3a322c;border-radius:12px;padding:16px;background:#fffdf9}</style></head><body><pre>${esc(text)}</pre></body></html>`;
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([html], { type: "text/html" })); a.download = fileBase + ".html"; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      msg("Downloaded. Attach the file to an email or upload it to your course.");
    };
    dlg.querySelector('[data-r="print"]').onclick = () => {
      let pr = document.getElementById("pr-print"); if (!pr) { pr = document.createElement("div"); pr.id = "pr-print"; document.body.appendChild(pr); }
      pr.innerHTML = `<pre>${esc(text)}</pre>`; document.body.classList.add("pr-printing");
      const done = () => { document.body.classList.remove("pr-printing"); window.removeEventListener("afterprint", done); };
      window.addEventListener("afterprint", done); dlg.close(); setTimeout(() => { window.print(); setTimeout(done, 1500); }, 50);
    };
    dlg.querySelector(".pr-text").focus();
  }

  window.SAprogress = {
    init(app) {
      APP = app; D = load();
      if (EMBED) return;   // the work-ahead frame records, but the panel lives on the main page
      const mount = () => {
        box = document.createElement("section"); box.className = "pr"; box.setAttribute("aria-labelledby", "pr-title-" + app.id);
        const anchor = document.querySelector(app.before || ".fi-credit, .wm");
        if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(box, anchor); else document.body.appendChild(box);
        panel(); box.querySelector(".pr-title").id = "pr-title-" + app.id;
      };
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
      window.addEventListener("storage", e => { if (e.key === key()) { D = load(); panel(); } });   // practice frame updates the panel
    },
    record(category, correct) {
      if (!APP) return;
      D = load();
      const now = Date.now(); if (!D.since) D.since = now; D.last = now;
      D.n++; if (correct) D.r++;
      const c = D.cats[category] || (D.cats[category] = { n: 0, r: 0 }); c.n++; if (correct) c.r++;
      save(); panel();
    },
    reset,
  };
})();
