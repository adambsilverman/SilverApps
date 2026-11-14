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

/* ===== "Test yourself" quizzes (lessons and slide pages). SAquiz.html(id, qs) + SAquiz.wire(root, id, qs, opts).
   Each question: { q, a, w: [wrong…], hint, why, s: step number to look back at, fig: optional score spec }.
   Open notes: every question links to the step that covers it (new tab). A wrong answer shows the hint and allows another try;
   only first tries count toward the score. opts: { rich(html), href(stepNumber), stepName(stepNumber), draw(el, spec) }. ===== */
window.SAquiz = (function () {
  var ST = {};
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function state(id, qs) { if (!ST[id]) ST[id] = { i: 0, first: [], tries: 0, done: false, order: qs.map(function (q) { return shuffle([q.a].concat(q.w)); }) }; return ST[id]; }
  function html(id) { return '<div class="saq" id="saq-' + id + '"><p class="saq-intro">Open notes. Each question links back to the step that covers it, and a hint is there if you want one. If you miss, you get the hint and another try; only first tries count toward your score.</p><div class="saq-card" aria-live="polite"></div></div>'; }
  function wire(root, id, qs, o) {
    o = o || {}; var rich = o.rich || function (s) { return s; };
    var box = root.querySelector("#saq-" + id); if (!box) return;
    var card = box.querySelector(".saq-card"), S = state(id, qs);
    function look(q) { return q.s && o.href ? '<a class="saq-look" href="' + esc(o.href(q.s)) + '" target="_blank" rel="noopener">Look back: ' + esc(o.stepName ? o.stepName(q.s) : "step " + q.s) + '<span class="sr-only"> (opens in a new tab)</span></a>' : ""; }
    function draw() {
      if (S.done) {
        var right = S.first.filter(Boolean).length, miss = qs.filter(function (q, i) { return !S.first[i]; });
        card.innerHTML = '<p class="saq-score"><b>' + right + ' of ' + qs.length + '</b> right on the first try.</p>'
          + (miss.length ? '<p>Worth another look:</p><ul class="saq-miss">' + miss.map(function (q) { return '<li>' + rich(q.q) + (q.s ? ' ' + look(q) : "") + '</li>'; }).join("") + '</ul>' : '<p>Every one on the first try.</p>')
          + '<div class="saq-row"><button type="button" class="btn" data-saq="again">Start over</button></div>';
        return;
      }
      var q = qs[S.i];
      card.innerHTML = '<p class="saq-n">Question ' + (S.i + 1) + ' of ' + qs.length + '</p><p class="saq-q">' + rich(q.q) + '</p>' + (q.fig ? '<div class="staff saq-fig"></div>' : "")
        + '<div class="opts">' + S.order[S.i].map(function (v) { return '<button type="button" class="opt" data-saqv="' + esc(v) + '">' + rich(esc(v)) + '</button>'; }).join("") + '</div>'
        + '<div class="saq-row">' + (q.hint ? '<button type="button" class="btn saq-hb" data-saq="hint" aria-expanded="false">Hint</button>' : "") + look(q) + '</div>'
        + '<p class="saq-hint" hidden>' + rich(q.hint || "") + '</p><p class="saq-fb"></p>';
      if (q.fig && o.draw) try { o.draw(card.querySelector(".saq-fig"), q.fig); } catch (e) {}
      S.tries = 0;
    }
    if (!box.dataset.wired) { box.dataset.wired = "1";
      box.addEventListener("click", function (e) {
        var b = e.target.closest("[data-saqv]"), c = e.target.closest("[data-saq]");
        if (c && c.dataset.saq === "hint") { var h = card.querySelector(".saq-hint"); h.hidden = !h.hidden; c.setAttribute("aria-expanded", String(!h.hidden)); return; }
        if (c && c.dataset.saq === "next") { S.i++; if (S.i >= qs.length) S.done = true; draw(); var n = card.querySelector(".saq-q, .saq-score"); if (n) { n.setAttribute("tabindex", "-1"); n.focus({ preventScroll: true }); } return; }
        if (c && c.dataset.saq === "again") { delete ST[id]; S = state(id, qs); draw(); return; }
        if (!b || b.disabled) return;
        var q = qs[S.i], ok = b.dataset.saqv === q.a, fb = card.querySelector(".saq-fb");
        if (S.tries === 0) S.first[S.i] = ok; S.tries++;
        if (window.SFX) SFX.play(ok);
        if (ok) {
          card.querySelectorAll("[data-saqv]").forEach(function (x) { x.disabled = true; if (x === b) x.classList.add("right"); });
          fb.innerHTML = '<b>' + (S.tries === 1 ? "Yes." : "Yes, got it.") + '</b> ' + rich(q.why || "") + '<span class="saq-row"><button type="button" class="btn primary" data-saq="next">' + (S.i < qs.length - 1 ? "Next question →" : "See your score") + '</button></span>';
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
