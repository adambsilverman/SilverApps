/* SilverApps — tiny shared page script: full-screen button in the top strip. */
(function () {
  function sync() {
    const on = !!document.fullscreenElement;
    document.body.classList.toggle("lc-fs", on);
    document.querySelectorAll("[data-fs]").forEach(b => { b.setAttribute("aria-pressed", on); const l = b.querySelector(".lbl"); if (l) l.textContent = on ? "Exit full screen" : "Full screen"; });
  }
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-fs]"); if (!b) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
  });
  document.addEventListener("fullscreenchange", sync);
})();

/* "Jump to…" menu in the top strip on every page: lists every app, so nobody needs the browser's back button. */
(function () {
  function ready(f) { if (document.readyState !== "loading") f(); else document.addEventListener("DOMContentLoaded", f); }
  ready(function () {
    // the menu goes where the page marks a slot (or, on older pages, next to a front-page button)
    var slot = document.getElementById("saJumpSlot"), home = slot || document.querySelector('a.site-btn[href="index.html"], a.fsbtn[href="index.html"]');
    if (!home || document.getElementById("saJump")) return;
    var btn = document.createElement("button"); btn.type = "button"; btn.id = "saJump"; btn.className = slot ? slot.getAttribute("data-cls") : home.className;
    btn.setAttribute("aria-haspopup", "dialog"); btn.innerHTML = '<span aria-hidden="true">☰</span><span class="lbl">Jump to…</span>'; btn.setAttribute("aria-label", "Jump to another app");
    if (slot) slot.parentNode.replaceChild(btn, slot); else home.parentNode.insertBefore(btn, home.nextSibling);
    var dlg = null;
    function build() {
      dlg = document.createElement("dialog"); dlg.id = "saJumpDlg"; dlg.setAttribute("aria-labelledby", "saJumpH");
      var html = '<div class="saj-head"><h2 id="saJumpH">Jump to an app</h2><button type="button" class="saj-x" aria-label="Close">✕</button></div><label class="saj-find">Find <input type="search" id="saJumpQ" placeholder="e.g. cadences, rhythm, tuner" autocomplete="off"></label><div class="saj-body">';
      (window.SA_NAV || []).forEach(function (sec) {
        html += '<section class="saj-sec"><h3>' + sec[0] + '</h3><ul>';
        sec[1].forEach(function (t) { html += '<li data-q="' + (sec[0] + " " + t[0]).toLowerCase().replace(/"/g, "") + '"><span class="saj-name">' + t[0] + '</span>' + t[1].map(function (l) { return '<a href="' + l[1] + '" aria-label="' + l[0] + ': ' + t[0].replace(/"/g, "") + '">' + l[0] + '</a>'; }).join("") + '</li>'; });
        html += '</ul></section>';
      });
      dlg.innerHTML = html + '</div><p class="saj-home"><a href="index.html">Go to the front page</a></p>';
      document.body.appendChild(dlg);
      dlg.querySelector(".saj-x").onclick = function () { dlg.close(); };
      dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
      dlg.addEventListener("close", function () { btn.focus(); });
      dlg.querySelector("#saJumpQ").addEventListener("input", function (e) { var q = e.target.value.trim().toLowerCase(); dlg.querySelectorAll("li[data-q]").forEach(function (li) { li.hidden = q && li.getAttribute("data-q").indexOf(q) < 0; }); dlg.querySelectorAll(".saj-sec").forEach(function (s) { s.hidden = !s.querySelector("li:not([hidden])"); }); });
      var here = location.pathname.split("/").pop(); dlg.querySelectorAll('a[href="' + here + '"]').forEach(function (a) { a.setAttribute("aria-current", "page"); });
    }
    function open() {
      if (!dlg) build();
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
      var q = dlg.querySelector("#saJumpQ"); if (q && window.matchMedia("(pointer:fine)").matches) q.focus();
    }
    btn.addEventListener("click", function () {
      if (window.SA_NAV) return open();
      var s = document.createElement("script"); s.src = "assets/nav.js?d=" + Math.floor(Date.now() / 36e5); s.onload = open; s.onerror = function () { location.href = "index.html"; }; document.head.appendChild(s);
    });
  });
})();

// Long question prompts (instructions rather than questions) get smaller, lighter text: .q-text.q-long (assets/trainer-skin.css)
(function () {
  function tag() { document.querySelectorAll(".q-text").forEach(function (p) { var l = (p.textContent || "").trim().length > 85; if (p.classList.contains("q-long") !== l) p.classList.toggle("q-long", l); }); }
  function go() { tag(); if (window.MutationObserver) new MutationObserver(tag).observe(document.body, { childList: true, subtree: true, characterData: true }); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go); else go();
})();

// Fair-use notice: every [data-fair-use] element (placed under each hosted excerpt of someone else's music: score
// images, recordings, videos) gets the same wording, kept here so it reads identically across all apps.
(function () {
  var T = "Short excerpts are included for teaching under fair use (educational use, 17 U.S.C. § 107). All rights remain with the artists and copyright holders.";
  function fill() { document.querySelectorAll("[data-fair-use]").forEach(function (p) { if (!p.textContent) { p.textContent = T + " "; var a = document.createElement("a"); a.href = "about-this-site.html"; a.textContent = "More about this"; p.appendChild(a); } }); }
  function go() { fill(); if (window.MutationObserver) new MutationObserver(fill).observe(document.body, { childList: true, subtree: true }); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go); else go();
})();

// Every embedded YouTube video gets a small "Report a dead link" link under it. The address is never in the page:
// it's assembled from character codes only when the link is clicked (keeps it away from address-harvesting bots).
(function () {
  var C = [97, 115, 105, 108, 118, 101, 114, 109, 97, 110, 64, 119, 99, 117, 112, 97, 46, 101, 100, 117];
  function addr() { return C.map(function (c) { return String.fromCharCode(c); }).join(""); }
  function vid(src) { var m = /(?:embed\/|youtu\.be\/|[?&]v=)([\w-]{11})/.exec(src || ""); return m ? m[1] : ""; }
  function scan() {
    document.querySelectorAll('iframe[src*="youtube"], iframe[src*="youtu.be"]').forEach(function (f) {
      if (f.hasAttribute("data-ytrep")) return; f.setAttribute("data-ytrep", "1");
      var box = f.closest(".lvideo, .aw-vid, .ytwrap, .video, figure") || f.parentElement, id = vid(f.getAttribute("src"));
      var p = document.createElement("p"); p.className = "yt-report";
      var a = document.createElement("a"); a.href = "#"; a.textContent = "Report a dead link"; a.setAttribute("data-yt", id);
      a.setAttribute("aria-label", "Report a dead link for this video (opens your email)");
      p.appendChild(a); box.parentNode.insertBefore(p, box.nextSibling);
    });
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest(".yt-report a"); if (!a) return; e.preventDefault();
    var id = a.getAttribute("data-yt"), sub = "Dead video link: " + document.title, body = "This video doesn't play:\nhttps://www.youtube.com/watch?v=" + id + "\n\nPage: " + location.href + "\n";
    location.href = "mailto:" + addr() + "?subject=" + encodeURIComponent(sub) + "&body=" + encodeURIComponent(body);
  });
  function go() { scan(); if (window.MutationObserver) new MutationObserver(scan).observe(document.body, { childList: true, subtree: true }); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go); else go();
})();

/* ===== Test Yourself quizzes (their own pages: <lesson>-quiz.html). SAquiz.html(id, qs) + SAquiz.wire(root, id, qs, opts).
   Each question: { q, a, w: [wrong…], hint, why, s: step number to look back at, fig: optional score spec }.
   The list is a question bank: each attempt draws up to 15 (at least 12 when the bank is bigger), covering every step of
   the lesson once before any step gets a second question, in lesson order. "Start over" draws a fresh set.
   Open notes: every question links to the step that covers it (new tab). A wrong answer shows the hint and allows another try;
   only first tries count toward the score. Every text field is escaped here, then passed through opts.rich, which must not escape again
   (lesson pages pass the engine's richHTML, for {rn:…} numerals and accidentals). opts: { rich(html), href(stepNumber), stepName(stepNumber), draw(el, spec), links: [{href, label, primary}] shown when finished }. ===== */
window.SAquiz = (function () {
  var ST = {};
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pick(bank) {
    var all = bank.map(function (q, i) { var c = {}; for (var k in q) c[k] = q[k]; c._id = i + 1; return c; });
    var groups = {}; all.forEach(function (q) { var k = q.s || 0; (groups[k] = groups[k] || []).push(q); });
    var keys = Object.keys(groups), N = all.length <= 12 ? all.length : Math.min(15, Math.max(12, keys.length)), out = [];
    keys.forEach(function (k) { groups[k] = shuffle(groups[k]); });
    while (out.length < N) {   // one round = one more question from each step that still has some, steps in random order
      var round = shuffle(keys.filter(function (k) { return groups[k].length; })); if (!round.length) break;
      round.forEach(function (k) { if (out.length < N) out.push(groups[k].shift()); });
    }
    return out.sort(function (a, b) { return (a.s || 0) - (b.s || 0) || a._id - b._id; });
  }
  function state(id, bank) {
    if (!ST[id]) { var qs = pick(bank); ST[id] = { qs: qs, i: 0, first: [], tries: 0, done: false, order: qs.map(function (q) { return shuffle([q.a].concat(q.w)); }) }; }
    return ST[id];
  }
  /* Finished attempts are kept in this browser (silverapps-quiz-<page>) for the professor report;
     inside an LMS (SCORM package from gradebook-sync.html) each finished attempt is also posted to the wrapper page. */
  var PAGE = (location.pathname.split("/").pop() || "index.html").replace(/\.html?$/, "");
  var LESSON = (function () { var m = document.querySelector("[data-sa-quiz]"); return m ? m.getAttribute("data-sa-quiz") : (document.title || PAGE).split(" · ")[0].replace(/^Test Yourself:\s*/, ""); })();
  var LOGKEY = "silverapps-quiz-" + PAGE;
  function plain(s) { var d = document.createElement("div"); d.innerHTML = String(s); return (d.textContent || "").replace(/\s+/g, " ").trim(); }
  function log() { try { return JSON.parse(localStorage.getItem(LOGKEY) || "null") || { attempts: [] }; } catch (e) { return { attempts: [] }; } }
  function fmt(t) { return new Date(t).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }); }
  function pc(r, n) { return n ? Math.round(r / n * 100) : 0; }
  function finish(qs, S) {
    var right = S.first.filter(Boolean).length, L = log();
    var att = { t: Date.now(), right: right, n: qs.length, missed: qs.filter(function (q, i) { return !S.first[i]; }).map(function (q) { return plain(q.q).slice(0, 200); }) };
    L.attempts.push(att); if (L.attempts.length > 50) L.attempts = L.attempts.slice(-50);
    try { localStorage.setItem(LOGKEY, JSON.stringify(L)); } catch (e) {}
    if (window.parent !== window) try {
      window.parent.postMessage({ type: "silverapps-quiz-result", v: 1, page: PAGE, lesson: LESSON, right: right, n: qs.length, pct: pc(right, qs.length),
        questions: qs.map(function (q, i) { return { id: "q" + (q._id || i + 1), text: plain(q.q).slice(0, 250), correct: !!S.first[i] }; }) }, "*");
    } catch (e) {}
  }
  function best(L) { return L.attempts.reduce(function (b, a) { return !b || a.right / a.n > b.right / b.n ? a : b; }, null); }
  function reportBody(st) {
    var L = log(), last = L.attempts[L.attempts.length - 1], b = best(L);
    return [
      "SilverApps Interactive Music Training — Quiz report",
      "Lesson: " + LESSON,
      "Quiz: Test Yourself (open notes; first tries count)",
      "Student: " + st.name,
      st.sid ? "Student ID or username: " + st.sid : null,
      st.course ? "Course or section: " + st.course : null,
      "Report created: " + fmt(Date.now()),
      "Attempts finished: " + L.attempts.length,
      "Latest attempt: " + fmt(last.t) + " — " + last.right + " of " + last.n + " (" + pc(last.right, last.n) + "%)",
      "Best attempt: " + fmt(b.t) + " — " + b.right + " of " + b.n + " (" + pc(b.right, b.n) + "%)",
      "Score: " + b.right + " of " + b.n + " (" + pc(b.right, b.n) + "%)",
      (last.missed || last.miss || []).length ? "Missed on the first try (latest attempt):" : "Latest attempt: every question right on the first try.",
    ].concat((last.missed || []).map(function (t) { return "- " + t; })).filter(function (l) { return l !== null; }).join("\n");
  }
  function needReport(cb) {
    if (window.SAreport) return cb();
    var me = document.querySelector('script[src*="assets/site.js"]'), sc = document.createElement("script");
    sc.src = me ? me.src.replace(/site\.js(\?.*)?$/, "progress.js") : "assets/progress.js";
    sc.onload = cb; document.head.appendChild(sc);
  }
  function openReport() {
    needReport(function () {
      SAreport.open({ app: LESSON, kind: "quiz report", title: "Quiz report for your professor",
        intro: "Your report shows this lesson, your name, the date, how many tries you've finished, your best and latest first-try scores, and the questions you missed, with a verification code your professor can check.",
        build: function (st) { return reportBody(st); } });
    });
  }
  function html(id) { return '<div class="saq" id="saq-' + id + '"><p class="saq-intro">Open notes. Each question links back to the step that covers it, and a hint is there if you want one. If you miss, you get the hint and another try; only first tries count toward your score. Every try draws a fresh set of questions covering the whole lesson.</p><div class="saq-card" aria-live="polite"></div></div>'; }
  function wire(root, id, bank, o) {
    o = o || {}; var rich = o.rich || function (s) { return s; };
    var box = root.querySelector("#saq-" + id); if (!box) return;
    var card = box.querySelector(".saq-card"), S = state(id, bank), qs = S.qs;
    function look(q) { return q.s && o.href ? '<a class="saq-look" href="' + esc(o.href(q.s)) + '" target="_blank" rel="noopener">Look back: ' + esc(o.stepName ? o.stepName(q.s) : "step " + q.s) + '<span class="sr-only"> (opens in a new tab)</span></a>' : ""; }
    function draw() {
      if (S.done) {
        var right = S.first.filter(Boolean).length, miss = qs.filter(function (q, i) { return !S.first[i]; });
        card.innerHTML = '<p class="saq-score"><b>' + right + ' of ' + qs.length + '</b> right on the first try.</p>'
          + (miss.length ? '<p>Worth another look:</p><ul class="saq-miss">' + miss.map(function (q) { return '<li>' + rich(esc(q.q)) + (q.s ? ' ' + look(q) : "") + '</li>'; }).join("") + '</ul>' : '<p>Every one on the first try.</p>')
          + (function () { var L = log(), b = best(L); return L.attempts.length > 1 ? '<p class="saq-best">Best so far: ' + b.right + ' of ' + b.n + ' (' + L.attempts.length + ' tries finished).</p>' : ""; })()
          + '<div class="saq-row"><button type="button" class="btn primary" data-saq="report">Report for my professor</button><button type="button" class="btn" data-saq="again">Start over</button></div>'
          + (o.links && o.links.length ? '<div class="saq-row saq-next">' + o.links.map(function (l) { return '<a class="btn' + (l.primary ? ' primary' : '') + '" href="' + esc(l.href) + '">' + esc(l.label) + '</a>'; }).join("") + '</div>' : "")
          + (window.SAlms ? '<p class="saq-lms">Your score was sent to your course gradebook.</p>' : "");
        return;
      }
      var q = qs[S.i];
      card.innerHTML = '<p class="saq-n">Question ' + (S.i + 1) + ' of ' + qs.length + '</p><p class="saq-q">' + rich(esc(q.q)) + '</p>' + (q.fig ? '<div class="staff saq-fig"></div>' : "")
        + '<div class="opts">' + S.order[S.i].map(function (v) { return '<button type="button" class="opt" data-saqv="' + esc(v) + '">' + rich(esc(v)) + '</button>'; }).join("") + '</div>'
        + '<div class="saq-row">' + (q.hint ? '<button type="button" class="btn saq-hb" data-saq="hint" aria-expanded="false">Hint</button>' : "") + look(q) + '</div>'
        + '<p class="saq-hint" hidden>' + rich(esc(q.hint || "")) + '</p><p class="saq-fb"></p>';
      if (q.fig && o.draw) try { o.draw(card.querySelector(".saq-fig"), q.fig); } catch (e) {}
      S.tries = 0;
    }
    if (!box.dataset.wired) { box.dataset.wired = "1";
      box.addEventListener("click", function (e) {
        var b = e.target.closest("[data-saqv]"), c = e.target.closest("[data-saq]");
        if (c && c.dataset.saq === "hint") { var h = card.querySelector(".saq-hint"); h.hidden = !h.hidden; c.setAttribute("aria-expanded", String(!h.hidden)); return; }
        if (c && c.dataset.saq === "next") { S.i++; if (S.i >= qs.length) { S.done = true; finish(qs, S); } draw(); var n = card.querySelector(".saq-q, .saq-score"); if (n) { n.setAttribute("tabindex", "-1"); n.focus({ preventScroll: true }); } return; }
        if (c && c.dataset.saq === "report") { openReport(); return; }
        if (c && c.dataset.saq === "again") { delete ST[id]; S = state(id, bank); qs = S.qs; draw(); return; }
        if (!b || b.disabled) return;
        var q = qs[S.i], ok = b.dataset.saqv === q.a, fb = card.querySelector(".saq-fb");
        if (S.tries === 0) S.first[S.i] = ok; S.tries++;
        if (window.SFX) SFX.play(ok);
        if (ok) {
          card.querySelectorAll("[data-saqv]").forEach(function (x) { x.disabled = true; if (x === b) x.classList.add("right"); });
          fb.innerHTML = '<b>' + (S.tries === 1 ? "Yes." : "Yes, got it.") + '</b> ' + rich(esc(q.why || "")) + '<span class="saq-row"><button type="button" class="btn primary" data-saq="next">' + (S.i < qs.length - 1 ? "Next question →" : "See your score") + '</button></span>';
        } else {
          b.disabled = true; b.classList.add("wrong");
          var h = card.querySelector(".saq-hint"), hb = card.querySelector(".saq-hb");
          if (q.hint && h.hidden) { h.hidden = false; if (hb) hb.setAttribute("aria-expanded", "true"); }
          fb.innerHTML = '<b>Not yet.</b> ' + (q.hint ? "Read the hint and try again." : "Try again.");
        }
      });
    }
    draw();
  }
  return { html: html, wire: wire };
})();

/* ===== LMS bridge: a SCORM package made on gradebook-sync.html shows this page in a frame and sends
   {type:"silverapps-lms", name, id} with the student's name from the gradebook. The quiz posts its result back (see SAquiz). ===== */
(function () {
  if (window.parent === window) return;
  window.addEventListener("message", function (e) {
    var d = e.data; if (!d || d.type !== "silverapps-lms" || e.source !== window.parent) return;
    window.SAlms = { name: String(d.name || "").slice(0, 120), id: String(d.id || "").slice(0, 120), lms: String(d.lms || "") };
    document.documentElement.classList.add("sa-in-lms");
  });
  try { window.parent.postMessage({ type: "silverapps-ready", page: (location.pathname.split("/").pop() || "").replace(/\.html?$/, "") }, "*"); } catch (e) {}
})();

/* ===== Enlarge music images: every score image on a page (not the generated staves) can be clicked, or opened with its
   "Enlarge" button, to view it full-screen in a <dialog>. Lessons re-render as steps change, so a MutationObserver keeps up. ===== */
(function () {
  var dlg = null;
  function open(box) {
    var imgs = Array.prototype.filter.call(box.querySelectorAll("img"), function (im) { return !im.hidden && getComputedStyle(im).display !== "none"; }); if (!imgs.length) return;
    if (!dlg) {
      dlg = document.createElement("dialog"); dlg.className = "sa-lb"; dlg.setAttribute("aria-label", "Enlarged music");
      dlg.innerHTML = '<div class="sa-lb-bar"><button type="button" class="sa-lb-zoom" aria-pressed="false">Zoom in</button><button type="button" class="sa-lb-x">Close ✕</button></div><div class="sa-lb-body"></div><p class="sa-lb-cap"></p>';
      document.body.appendChild(dlg);
      dlg.querySelector(".sa-lb-x").addEventListener("click", function () { dlg.close(); });
      dlg.querySelector(".sa-lb-zoom").addEventListener("click", function () { var z = dlg.classList.toggle("zoom"); this.setAttribute("aria-pressed", String(z)); this.textContent = z ? "Fit to screen" : "Zoom in"; });
      dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
      dlg.addEventListener("close", function () { dlg.querySelector(".sa-lb-body").innerHTML = ""; if (dlg._from) try { dlg._from.focus(); } catch (e) {} });
    }
    var body = dlg.querySelector(".sa-lb-body"), st = document.createElement("div"); st.className = "sa-lb-stack";
    imgs.forEach(function (im, i) { var c = document.createElement("img"); c.src = im.currentSrc || im.src; c.alt = i ? "" : (im.alt || ""); if (i) c.className = "sa-lb-layer"; st.appendChild(c); });   // layered images (labels over a score) stay stacked
    body.innerHTML = ""; body.appendChild(st);
    var fig = box.closest("figure"), cap = fig && fig.querySelector("figcaption"), cc = cap && cap.cloneNode(true); if (cc) cc.querySelectorAll("button, .fair-use, [data-fair-use]").forEach(function (x) { x.remove(); }); dlg.querySelector(".sa-lb-cap").textContent = cc ? cc.textContent.replace(/\s+/g, " ").trim().slice(0, 300) : "";
    dlg.classList.remove("zoom"); var zb = dlg.querySelector(".sa-lb-zoom"); zb.setAttribute("aria-pressed", "false"); zb.textContent = "Zoom in";
    dlg._from = document.activeElement; if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
  }
  function big(im) { var w = +im.getAttribute("width") || im.naturalWidth || 0; return w >= 400; }
  function scan() {
    document.querySelectorAll("img").forEach(function (im) {
      if (im.dataset.lb || im.closest(".sa-lb, .site-strip, .fi-credit, button, a") || !big(im)) return;
      var par = im.parentElement, box;
      if (par.dataset.lbBox) { im.dataset.lb = "1"; return; }   // a second layer in a box already handled
      if (getComputedStyle(par).position !== "static" && par.tagName !== "FIGURE") box = par;   // e.g. a hotspot map or layered labels
      else { box = document.createElement("span"); box.className = "sa-lb-wrap"; par.insertBefore(box, im); box.appendChild(im); }
      box.dataset.lbBox = "1"; box.classList.add("sa-lb-box"); im.dataset.lb = "1";
      box.querySelectorAll("img").forEach(function (x) { x.dataset.lb = "1"; x.classList.add("sa-lb-img"); });
      var b = document.createElement("button"); b.type = "button"; b.className = "sa-lb-btn"; b.innerHTML = '<span aria-hidden="true">⤢</span> Enlarge'; b.setAttribute("aria-label", "Enlarge this music");
      b.addEventListener("click", function (e) { e.stopPropagation(); open(box); }); var row = document.createElement("span"); row.className = "sa-lb-under"; row.appendChild(b); box.parentNode.insertBefore(row, box.nextSibling);   // under the image, so it never covers the music
      box.addEventListener("click", function (e) { if (e.target.closest("button, a, .cad-hs")) return; if (e.target.tagName === "IMG") open(box); });
    });
  }
  var t = null;
  function kick() { clearTimeout(t); t = setTimeout(scan, 120); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", kick); else kick();
  try { new MutationObserver(kick).observe(document.documentElement, { childList: true, subtree: true }); } catch (e) {}
})();
