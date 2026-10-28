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
