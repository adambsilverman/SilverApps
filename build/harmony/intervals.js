window.FAM = (() => {
  // ===== Interval drills: name intervals, write a note an interval above or below, count half steps; optional keyboard. =====
  const NUM = ["unison", "2nd", "3rd", "4th", "5th", "6th", "7th", "octave"];
  const BASE = [0, 2, 4, 5, 7, 9, 11, 12];               // major / perfect sizes in half steps
  const PERF = [true, false, false, true, true, false, false, true];
  const QN = { P: "perfect", M: "major", m: "minor", A: "augmented", d: "diminished" };
  const qualsFor = (i, ad) => (PERF[i] ? ["P"] : ["M", "m"]).concat(ad ? (PERF[i] ? (i === 0 ? ["A"] : ["A", "d"]) : ["A", "d"]) : []);
  const off = (i, q) => q === "P" || q === "M" ? 0 : q === "m" ? -1 : q === "A" ? 1 : PERF[i] ? -1 : -2;
  const nameOf = (i, q) => i === 0 && q === "P" ? "perfect unison" : `${QN[q]} ${NUM[i]}`;
  const abbr = (i, q) => q + (i === 7 ? 8 : i + 1);

  // ---------- keyboard (optional, shown inside a details element whose open state is remembered) ----------
  let AC = null;
  function beep(m) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return; if (!AC) AC = new C(); if (AC.state === "suspended") AC.resume();
    const t = AC.currentTime + .02, o = AC.createOscillator(), g = AC.createGain(); o.type = "triangle"; o.frequency.value = 440 * Math.pow(2, (m - 69) / 12); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.25, t + .01); g.gain.setTargetAtTime(0, t + .3, .25); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + 1.5); }
  if (!window.__ikbWired) { window.__ikbWired = true;
    document.addEventListener("click", e => { const k = e.target.closest("[data-ikb]"); if (!k) return; const m = +k.dataset.ikb; beep(m);
      // show the pitch name on the key while it sounds (black keys: both spellings)
      const old = k.querySelector(".iknm"); if (old) old.remove(); clearTimeout(k._t);
      const nmEl = document.createElement("i"); nmEl.className = "iknm"; nmEl.setAttribute("aria-hidden", "true"); nmEl.innerHTML = PCN[m % 12].split("/").join("<br>"); k.appendChild(nmEl); k.classList.add("on");
      const live = document.getElementById("ikLive"); if (live) live.textContent = PCN[m % 12].replace("/", " or ");
      k._t = setTimeout(() => { nmEl.remove(); k.classList.remove("on"); }, 1100); });
    new MutationObserver(() => document.querySelectorAll("details.ikbd:not([data-set])").forEach(d => { d.dataset.set = "1"; d.open = kbOpen(); })).observe(document.documentElement, { childList: true, subtree: true });
    document.addEventListener("toggle", e => { if (e.target.matches && e.target.matches("details.ikbd")) try { localStorage.setItem("silverapps-intervals-kb", e.target.open ? "1" : "0"); } catch (x) {} }, true); }
  const kbOpen = () => { try { return localStorage.getItem("silverapps-intervals-kb") === "1"; } catch (e) { return false; } };
  const PCN = ["C", "C♯/D♭", "D", "D♯/E♭", "E", "F", "F♯/G♭", "G", "G♯/A♭", "A", "A♯/B♭", "B"];
  function keyboard(marks) {   // marks: { midi: label }
    const ms = Object.keys(marks).map(Number), lo = Math.floor(Math.min(...ms) / 12) * 12, hi = Math.max(lo + 23, Math.ceil((Math.max(...ms) + 1) / 12) * 12 - 1);
    const whites = []; for (let m = lo; m <= hi; m++) if (![1, 3, 6, 8, 10].includes(m % 12)) whites.push(m);
    const w = 100 / whites.length; let h = "";
    whites.forEach((m, i) => { h += `<button class="ik w${marks[m] ? " mk" : ""}" data-ikb="${m}" style="left:${i * w}%;width:${w}%" aria-label="${PCN[m % 12]} ${Math.floor(m / 12) - 1}${marks[m] ? ", " + marks[m] : ""}">${marks[m] ? `<b>${marks[m]}</b>` : ""}${m % 12 === 0 ? `<span>C${Math.floor(m / 12) - 1}</span>` : ""}</button>`; });
    for (let m = lo; m <= hi; m++) if ([1, 3, 6, 8, 10].includes(m % 12)) { const i = whites.indexOf(m - 1); h += `<button class="ik b${marks[m] ? " mk" : ""}" data-ikb="${m}" style="left:${(i + 1) * w - w * .3}%;width:${w * .6}%" aria-label="${PCN[m % 12]} ${Math.floor(m / 12) - 1}${marks[m] ? ", " + marks[m] : ""}">${marks[m] ? `<b>${marks[m]}</b>` : ""}</button>`; }
    return `<details class="ikbd"${kbOpen() ? " open" : ""}><summary>Show keyboard</summary><div class="ikbwrap"><div class="ikb" role="group" aria-label="Keyboard for counting half steps; click a key to hear it">${h}</div></div><p class="ikbnote">Count half steps from key to key (black keys included). Click keys to hear them and see their names.</p><p class="sr" id="ikLive" aria-live="polite"></p></details>`;
  }

  // ---------- question building ----------
  function pick(H) {
    const pool = ["pmm", "ad"].filter(t => H.topicOn(t)), topic = pool.length === 2 ? (Math.random() < .3 ? "ad" : "pmm") : pool[0] || "pmm", i = Math.floor(Math.random() * 8);
    const qs = qualsFor(i, true).filter(q => topic === "ad" ? q === "A" || q === "d" : q === "P" || q === "M" || q === "m");
    return { i, q: H.rnd(qs), topic };
  }
  function lowNote(H, clef) {
    const base = clef === "treble" ? H.N(0, 0, 4) : H.N(4, 0, 2);   // C4 or E2
    for (let g = 0; g < 50; g++) { const s = Math.floor(Math.random() * 8), n = H.up(base, s, 0), a = H.rnd([0, 0, 0, -1, 1]); const x = H.N(n.l, n.a + a, n.o); if (Math.abs(x.a) <= 1 && !(x.a === 1 && (x.l === 2 || x.l === 6)) && !(x.a === -1 && (x.l === 3 || x.l === 0))) return x; }
    return base;
  }
  const okSpell = n => Math.abs(n.a) <= 2;
  const staff = (H, notes, clef, harm) => ({ type: "score", clefs: [clef], time: null, vf: "C", sig: {}, bpm: 100, final: false, minBar: harm ? 60 : 110, scale: 1.3, bars: [{ [clef === "bass" ? "b" : "t"]: [harm ? [{ k: notes.map(H.nmO), d: "w" }] : notes.map(n => ({ k: [H.nmO(n)], d: "w" }))] }] });
  const play = (H, lo, hi, harm) => harm ? { chords: [[H.midi(lo), H.midi(hi)]], gap: 1.4 } : { chords: [[H.midi(lo)], [H.midi(hi)]], gap: .8 };
  const why = (H, lo, hi, i, q) => `${H.nm(lo)} up to ${H.nm(hi)}: ${i + 1} letter names (${Array.from({ length: i + 1 }, (_, k) => "CDEFGAB"[(lo.l + k) % 7]).join(" ")}), so ${i === 0 ? "a unison" : i === 7 ? "an octave" : "a " + NUM[i]}; ${H.midi(hi) - H.midi(lo)} half steps, so ${nameOf(i, q)}.`;

  function make(mode, H) {
    if (mode === "note" || mode === "above" || mode === "below") mode = mode === "note" ? (Math.random() < .5 ? "above" : "below") : mode;   // one "write the note" drill, above or below at random
    const clef = Math.random() < .7 ? "treble" : "bass";
    for (let g = 0; g < 80; g++) {
      const { i, q, topic } = pick(H), semis = BASE[i] + off(i, q);
      if (semis < 0 || (i === 0 && q === "d") || (i === 0 && topic === "pmm" && (mode !== "name" || Math.random() < .8)) || (i === 7 && topic === "pmm" && (mode === "above" || mode === "below"))) continue;
      if (mode === "semis" && (semis < 1 || semis > 12)) continue;   // half-step counts 1–12
      if (mode === "name" || mode === "semis") {
        const lo = lowNote(H, clef), hi = H.up(lo, i, semis); if (!okSpell(hi) || Math.abs(hi.a) > 1 && Math.random() < .7) continue;
        const harm = Math.random() < .4, marks = { [H.midi(lo)]: "1" }; marks[H.midi(hi)] = H.midi(hi) === H.midi(lo) ? "1" : "2";
        if (mode === "semis") {
          const ans = String(semis); return Object.assign(H.mc(`How many half steps are in this interval (${nameOf(i, q)})?`, ans, [semis - 1, semis + 1].filter(x => x >= 0).map(String), why(H, lo, hi, i, q), { kicker: "Count half steps", topic, staff: staff(H, [lo, hi], clef, harm), playQ: play(H, lo, hi, harm), fig: keyboard(marks) }), { choices: Array.from({ length: 12 }, (_, n) => String(n + 1)) });   // every count 1–12, in order
        }
        const wrong = [...new Set(qualsFor(i, H.topicOn("ad")).filter(x => x !== q).map(x => nameOf(i, x)).concat([i > 0 ? nameOf(i - 1, PERF[i - 1] ? "P" : q === "M" ? "M" : "m") : null, i < 7 ? nameOf(i + 1, PERF[i + 1] ? "P" : q === "m" ? "m" : "M") : null].filter(Boolean)))];
        return H.mc(`Name this ${harm ? "harmonic" : "melodic"} interval: choose its quality and number.`, nameOf(i, q), wrong, why(H, lo, hi, i, q), { kicker: "Name the interval", topic, staff: staff(H, [lo, hi], clef, harm), playQ: play(H, lo, hi, harm), fig: keyboard(marks), widget: "ivpick", ad: H.topicOn("ad") });
      }
      // write a note above or below
      const given = lowNote(H, clef), above = mode === "above";
      if (!above) given.o += 1;
      const other = above ? H.up(given, i, semis) : H.up(given, -i, -semis); if (Math.abs(other.a) > 1 || (Math.abs(other.a) === 1 && Math.abs(given.a) === 1 && Math.random() < .3)) continue;
      const lo = above ? given : other, hi = above ? other : given;
      // distractors: same letter with other accidentals, the enharmonic spelling, and a neighbouring letter
      const cands = [-1, 0, 1].map(a => H.N(other.l, a, other.o)).filter(n => n.a !== other.a);
      const enh = [-1, 1].map(st => H.up(other, st, 0)).filter(n => Math.abs(n.a) <= 1);
      const wrong = [...new Set(cands.concat(enh).map(H.nm))].filter(x => x !== H.nm(other));
      const ansStaff = staff(H, [lo, hi], clef, false);
      return H.mc(`Which note is ${/^[aeiou]/.test(nameOf(i, q)) ? "an" : "a"} ${nameOf(i, q)} ${above ? "above" : "below"} ${H.nm(given)}? Choose its letter and accidental.`, H.nm(other), wrong, why(H, lo, hi, i, q) + (enh.some(n => H.midi(n) === H.midi(other)) ? ` The spelling matters: ${i === 7 ? "an octave" : "a " + NUM[i]} must span ${i + 1} letter names, so the enharmonic note is a different interval.` : ""), { widget: "pitchpick", kicker: above ? "Write the note above" : "Write the note below", topic, staff: staff(H, [given], clef, false), staffAns: ansStaff, playQ: { chords: [[H.midi(given)]] }, play: play(H, lo, hi, false), fig: keyboard({ [H.midi(given)]: "★" }) });
    }
    return make(mode, H);
  }

  const reference = () => `<table class="ltable"><caption>Interval sizes</caption><thead><tr><th scope="col">Interval</th><th scope="col">Half steps</th><th scope="col">Example from C</th></tr></thead><tbody>
    ${[["perfect unison", 0, "C"], ["minor 2nd", 1, "D♭"], ["major 2nd", 2, "D"], ["minor 3rd", 3, "E♭"], ["major 3rd", 4, "E"], ["perfect 4th", 5, "F"], ["augmented 4th", 6, "F♯"], ["diminished 5th", 6, "G♭"], ["perfect 5th", 7, "G"], ["minor 6th", 8, "A♭"], ["major 6th", 9, "A"], ["minor 7th", 10, "B♭"], ["major 7th", 11, "B"], ["perfect octave", 12, "C"]].map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join("")}</tbody></table>
    <p><b>Number</b>: count the letter names, including both notes. <b>Quality</b>: count half steps. Perfect intervals (unison, 4th, 5th, octave) become augmented (+1) or diminished (−1); major intervals become minor (−1), augmented (+1) or diminished (−2).</p>`;

  // ---------- answer pickers (any interval, any pitch) ----------
  const QORD = ["d", "m", "P", "M", "A"], QSHORT = { d: "diminished", m: "minor", P: "perfect", M: "major", A: "augmented" };
  const validIv = (q, i) => q === "P" ? PERF[i] : q === "M" || q === "m" ? !PERF[i] : q === "d" ? i !== 0 : true;
  const pressed = (on) => `aria-pressed="${on}"`;
  const widgets = {
    ivpick: {
      html(c, q) {
        const qs = QORD.filter(x => c.ad || !["d", "A"].includes(x)), dis = q.done ? " disabled" : "";
        return `<div class="pick"><div class="pick-row" role="group" aria-label="Quality">${qs.map(x => `<button type="button" class="pk" data-pq="${x}" ${pressed(q.selQ === x)}${dis}>${QSHORT[x]}</button>`).join("")}</div>
          <div class="pick-row" role="group" aria-label="Number">${NUM.map((n, i) => `<button type="button" class="pk" data-pn="${i}" ${pressed(q.selN === i)}${dis || (q.selQ && !validIv(q.selQ, i) ? " disabled" : "")}>${n}</button>`).join("")}</div></div>`;
      },
      wire(root, c, q) {
        const box = root.querySelector(".pick"), btn = root.querySelector("[data-wcheck]");
        const sync = () => { box.querySelectorAll("[data-pq]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.pq === q.selQ)));
          box.querySelectorAll("[data-pn]").forEach(b => { const i = +b.dataset.pn; b.setAttribute("aria-pressed", String(i === q.selN)); b.disabled = !!q.selQ && !validIv(q.selQ, i); });
          btn.disabled = !(q.selQ && q.selN != null && validIv(q.selQ, q.selN)); };
        box.onclick = e => { const a = e.target.closest("[data-pq]"), b = e.target.closest("[data-pn]");
          if (a) { q.selQ = a.dataset.pq; if (q.selN != null && !validIv(q.selQ, q.selN)) q.selN = null; }
          if (b && !b.disabled) q.selN = +b.dataset.pn;
          sync(); };
        sync();
      },
      value(root) { const q = root.querySelector("[data-pq][aria-pressed=true]"), n = root.querySelector("[data-pn][aria-pressed=true]"); return q && n ? nameOf(+n.dataset.pn, q.dataset.pq) : null; },
    },
    pitchpick: {
      html(c, q, H) {
        const dis = q.done ? " disabled" : "", sa = q.selA == null ? 0 : q.selA;
        return `<div class="pick"><div class="pick-row" role="group" aria-label="Letter">${"CDEFGAB".split("").map((L, i) => `<button type="button" class="pk lt" data-pl="${i}" ${pressed(q.selL === i)}${dis}>${L}</button>`).join("")}</div>
          <div class="pick-row" role="group" aria-label="Accidental">${[[-2, "double flat"], [-1, "flat"], [0, "natural"], [1, "sharp"], [2, "double sharp"]].map(([a, w]) => `<button type="button" class="pk acc" data-pa="${a}" ${pressed(sa === a)} aria-label="${w}"${dis}><span aria-hidden="true">${a ? H.accHTML(H.ACC[a]) : "♮"}</span></button>`).join("")}</div></div>`;
      },
      wire(root, c, q, H) {
        const box = root.querySelector(".pick"), btn = root.querySelector("[data-wcheck]");
        const sync = () => { box.querySelectorAll("[data-pl]").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.pl === q.selL)));
          box.querySelectorAll("[data-pa]").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.pa === (q.selA || 0)))); btn.disabled = q.selL == null; };
        box.onclick = e => { const l = e.target.closest("[data-pl]"), a = e.target.closest("[data-pa]"); if (l) q.selL = +l.dataset.pl; if (a) q.selA = +a.dataset.pa; sync(); };
        sync();
      },
      value(root) { const l = root.querySelector("[data-pl][aria-pressed=true]"), a = root.querySelector("[data-pa][aria-pressed=true]"); return l ? "CDEFGAB"[+l.dataset.pl] + ({ "-2": "𝄫", "-1": "♭", "0": "", "1": "♯", "2": "𝄪" })[a ? a.dataset.pa : "0"] : null; },
    },
  };

  const lesson = { steps: [{ title: "Intervals", kick: "Lesson", render: () => `<p>The lesson for these drills is <a href="intervals-what-why-how.html">Intervals: What, Why and How</a>.</p>` }] };
  return {
    key: "silverapps-intervals-v1", lesson, make, reference, widgets,
    modes: [{ id: "name", kicker: "Name the interval" }, { id: "note", kicker: "Write the note" }, { id: "semis", kicker: "Count half steps" }],
    topics: [{ id: "pmm", name: "Perfect, major, minor", group: "q" }, { id: "ad", name: "Augmented, diminished", group: "q" }],
  };
})();
