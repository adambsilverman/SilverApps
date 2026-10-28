/* SilverApps — answer sounds: a happy chime for correct, a soft sad beep for incorrect.
   SFX.play(true|false). A "Sound" toggle ([data-sfx] button) is remembered per browser.
   Sounds are an extra cue only — every answer is also shown in text. */
(function () {
  const KEY = "silverapps-sound";
  let on = true; try { on = localStorage.getItem(KEY) !== "off"; } catch (e) {}
  let ctx = null;
  const ac = () => { if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); } if (ctx.state === "suspended") ctx.resume(); return ctx; };
  function tone(c, f, t, dur, type, gain, bendTo) {
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (bendTo) o.frequency.exponentialRampToValueAtTime(bendTo, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
  }
  function chime() {
    const c = ac(); if (!c) return; const t = c.currentTime + 0.01;
    [[1046.5, 0], [1318.5, 0.085], [1568, 0.17]].forEach(([f, d]) => { tone(c, f, t + d, 0.55, "sine", 0.16); tone(c, f * 2, t + d, 0.25, "sine", 0.035); });
  }
  function beep() {
    const c = ac(); if (!c) return; const t = c.currentTime + 0.01;
    tone(c, 392, t, 0.2, "triangle", 0.13, 370); tone(c, 311, t + 0.2, 0.38, "triangle", 0.13, 277);
  }
  function sync() { document.querySelectorAll("[data-sfx]").forEach(b => { b.setAttribute("aria-pressed", on); const l = b.querySelector(".lbl"); if (l) l.textContent = on ? "Sound on" : "Sound off"; b.setAttribute("aria-label", on ? "Answer sounds on" : "Answer sounds off"); }); }
  document.addEventListener("click", e => { const b = e.target.closest("[data-sfx]"); if (!b) return; on = !on; try { localStorage.setItem(KEY, on ? "on" : "off"); } catch (er) {} sync(); if (on) chime(); });
  document.addEventListener("DOMContentLoaded", sync); sync();
  window.SFX = { play(ok) { if (!on) return; try { ok ? chime() : beep(); } catch (e) {} }, get on() { return on; } };
})();
