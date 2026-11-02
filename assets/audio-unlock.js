/* SilverApps — make Web Audio play on iPhone and iPad.
   1. Every AudioContext a page creates is remembered and resumed (with a silent one-sample sound) on the first tap, click or key,
      and again whenever the page comes back into view (iOS suspends audio when you switch apps or lock the screen).
   2. iOS mutes Web Audio when the ring/silent switch is set to silent. Declaring the page a "playback" audio session (iOS 17+)
      and, on older versions, playing a silent <audio> loop makes the apps play like a music app instead. */
(function () {
  var Base = window.AudioContext || window.webkitAudioContext;
  if (!Base) return;
  var list = [], unlocked = false, isApple = /iPad|iPhone|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && "ontouchend" in document);
  function kick(c) {
    try { if (c.state !== "running" && c.state !== "closed") { var p = c.resume(); if (p && p.catch) p.catch(function () {}); } } catch (e) {}
    try { var b = c.createBuffer(1, 1, 22050), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); } catch (e) {}
  }
  function Wrapped(opts) { var c = opts ? new Base(opts) : new Base(); list.push(c); if (unlocked) kick(c); return c; }
  Wrapped.prototype = Base.prototype;
  try { window.AudioContext = Wrapped; if (window.webkitAudioContext) window.webkitAudioContext = Wrapped; } catch (e) {}
  try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}
  var tag = null;
  function silentLoop() {   // a valid half-second of silence, looped, so older iOS treats the page as media playback
    if (tag || !isApple) return;
    var n = 4000, buf = new Uint8Array(44 + n), v = new DataView(buf.buffer), w = function (o, s) { for (var i = 0; i < s.length; i++) buf[o + i] = s.charCodeAt(i); };
    w(0, "RIFF"); v.setUint32(4, 36 + n, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, "data"); v.setUint32(40, n, true);
    for (var i = 0; i < n; i++) buf[44 + i] = 128;
    tag = document.createElement("audio"); tag.setAttribute("playsinline", ""); tag.setAttribute("x-webkit-airplay", "deny"); tag.loop = true; tag.preload = "auto";
    tag.src = URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
    var p = tag.play(); if (p && p.catch) p.catch(function () {});
  }
  function unlock() {
    unlocked = true;
    if (isApple && !(navigator.audioSession)) silentLoop();
    list.forEach(kick);
  }
  ["touchend", "pointerup", "click", "keydown"].forEach(function (ev) { window.addEventListener(ev, unlock, true); });
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") { list.forEach(kick); if (tag && tag.paused) { var p = tag.play(); if (p && p.catch) p.catch(function () {}); } }
    else if (tag) tag.pause();
  });
})();
