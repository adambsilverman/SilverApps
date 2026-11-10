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
