
window.FAM = (() => {
  // ===== What a Conductor Does (Orchestration): beat patterns, preparation and release, fermatas, expressive gesture, leading
  // the ensemble, choral and instrumental conductors, the film studio, and the jazz band. Two toys: an animated beat-pattern
  // viewer, and a "conduct the ensemble" chorale that follows the student's taps (tempo, gesture size = dynamics, fermatas, cutoffs).
  // The chorale is original. =====
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const tbl = (cap, head, rows) => `<div class="ltable-wrap" tabindex="0" role="region" aria-label="${cap}"><table class="ltable"><caption>${cap}</caption><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => i ? `<td>${c}</td>` : `<th scope="row">${c}</th>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  const HC = () => window.__harm && window.__harm.H;

  // ---------- beat patterns: the ictus points (x, y in a 100 × 80 box; the "beat plane" is near y = 62) ----------
  const PAT = {
    "1": { name: "1 (one beat per bar)", beats: 1, pts: [[50, 64]], dir: ["down"] },
    "2": { name: "2 (2/4, 2/2, fast 6/8)", beats: 2, pts: [[50, 64], [62, 58]], dir: ["down", "up (a small rebound to the right, then up)"] },
    "3": { name: "3 (3/4, 3/8)", beats: 3, pts: [[50, 64], [80, 58], [56, 30]], dir: ["down", "right (out)", "up"] },
    "4": { name: "4 (4/4)", beats: 4, pts: [[50, 64], [24, 58], [80, 59], [56, 30]], dir: ["down", "left (in)", "right (out)", "up"] },
    "5a": { name: "5 as 3 + 2 (5/4)", beats: 5, pts: [[50, 64], [32, 59], [16, 56], [80, 59], [56, 30]], dir: ["down", "left", "further left", "right", "up"] },
    "5b": { name: "5 as 2 + 3 (5/4)", beats: 5, pts: [[50, 64], [24, 58], [68, 60], [86, 56], [56, 30]], dir: ["down", "left", "right", "further right", "up"] },
    "6": { name: "6 (slow 6/8, German style)", beats: 6, pts: [[50, 64], [36, 60], [20, 57], [66, 61], [84, 57], [56, 30]], dir: ["down", "left", "further left", "right", "further right", "up"] },
  };
  // the baton's path from ictus i to ictus i+1: a rebound up from the ictus, then a fall into the next one
  function seg(P, i, size) {
    const pts = P.pts.map(([x, y]) => [50 + (x - 50) * size, 64 - (64 - y) * size]), a = pts[i], b = pts[(i + 1) % pts.length], last = i === pts.length - 1;
    if (P.beats === 1) return { a, b, c1: [a[0] + 6 * size, a[1] - 40 * size], c2: [b[0] - 6 * size, b[1] - 40 * size] };
    if (last) return { a, b, c1: [a[0] - 2 * size, a[1] - 8 * size], c2: [b[0], b[1] - 40 * size] };   // from the upbeat straight down into beat 1
    if (i + 1 === pts.length - 1 && P.beats > 2) return { a, b, c1: [a[0] - (a[0] - b[0]) * .05, a[1] - 14 * size], c2: [b[0] + (a[0] - b[0]) * .3, b[1] + 12 * size] };   // rising to the upbeat
    return { a, b, c1: [a[0] + (b[0] - a[0]) * .25, a[1] - 10 * size], c2: [b[0] - (b[0] - a[0]) * .25, b[1] - 7 * size] };   // rebound, then across into the next ictus
  }
  const bez = (s, t) => { const u = 1 - t; return [0, 1].map(k => u * u * u * s.a[k] + 3 * u * u * t * s.c1[k] + 3 * u * t * t * s.c2[k] + t * t * t * s.b[k]); };
  function patSVG(id, o = {}) {
    const P = PAT[id], size = o.size || 1, d = P.pts.map((_, i) => { const s = seg(P, i, size); return `${i ? "" : `M${s.a.join(" ")}`} C${s.c1.join(" ")} ${s.c2.join(" ")} ${s.b.join(" ")}`; }).join(" ");
    const pts = P.pts.map((_, i) => seg(P, i, size).a);
    return `<svg viewBox="0 0 100 80" class="cd-svg" role="img" aria-label="Beat pattern in ${esc(P.name)}: ${P.dir.map((x, i) => `beat ${i + 1} ${x}`).join(", ")}" ${o.id ? `id="${o.id}"` : ""}>
      <line x1="6" x2="94" y1="66" y2="66" class="cd-plane"/><path d="${d}" class="cd-path"/>
      ${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="2.2" class="cd-ict"/><text x="${p[0] + (i === 0 ? 3.5 : p[0] < 50 ? -6 : 3.5)}" y="${p[1] + (i === P.beats - 1 && P.beats > 1 ? -3 : 9)}" class="cd-num">${i + 1}</text>`).join("")}
      ${o.dot ? `<circle r="3.4" class="cd-dot" cx="${pts[0][0]}" cy="${pts[0][1]}"/>` : ""}</svg>`;
  }

  // ---------- toy 1: the beat-pattern viewer (an animated baton tip with a click on each ictus) ----------
  const BV = { pat: "4", bpm: 72, style: "legato", size: 1, on: false, raf: 0, t0: 0, last: -1, sub: false };
  function bvHTML() {
    return `<div class="cd-bv" id="cdBV"><div class="cd-stage">${patSVG(BV.pat, { size: BV.size, dot: true, id: "cdBVs" })}<p class="cd-count" id="cdCount" aria-hidden="true"></p></div>
      <div class="toy-row"><button type="button" class="play" data-cd="bv" aria-pressed="${BV.on}"><span aria-hidden="true">${BV.on ? "■" : "▶"} </span>${BV.on ? "Stop" : "Start the baton"}</button>
        <label>Pattern <select id="cdPat">${Object.entries(PAT).map(([id, p]) => `<option value="${id}"${id === BV.pat ? " selected" : ""}>${esc(p.name)}</option>`).join("")}</select></label></div>
      <div class="toy-row"><label>Tempo <input type="range" id="cdBpm" min="40" max="160" step="4" value="${BV.bpm}"> <span id="cdBpmV">${BV.bpm}</span></label>
        <label>Style <select id="cdSty"><option value="legato"${BV.style === "legato" ? " selected" : ""}>legato (smooth)</option><option value="marcato"${BV.style === "marcato" ? " selected" : ""}>marcato (heavy)</option><option value="staccato"${BV.style === "staccato" ? " selected" : ""}>staccato (light, stopping)</option></select></label>
        <label>Size <select id="cdSize"><option value=".55"${BV.size === .55 ? " selected" : ""}>small (piano)</option><option value="1"${BV.size === 1 ? " selected" : ""}>medium (mezzo)</option><option value="1.3"${BV.size === 1.3 ? " selected" : ""}>large (forte)</option></select></label>
        <label><input type="checkbox" id="cdSub"${BV.sub ? " checked" : ""}> Click subdivisions</label></div>
      <p class="lnote" id="cdBVt">${esc(bvText())}</p></div>`;
  }
  function bvText() { const P = PAT[BV.pat]; return `${P.name}: ${P.dir.map((x, i) => `${i + 1} ${x}`).join(", ")}. ${BV.style === "legato" ? "Legato: the baton never stops; the ictus is felt, not hit." : BV.style === "marcato" ? "Marcato: the baton speeds into each ictus and rebounds firmly." : "Staccato: a quick, small flick to each ictus, then a stop until the next."} ${BV.size > 1 ? "A large pattern asks for a loud sound." : BV.size < 1 ? "A small pattern asks for a soft sound." : ""}`; }
  // progress through a beat (0–1) shaped by the style
  const ease = (f, sty) => sty === "staccato" ? Math.min(1, f / .32) ** .7 : sty === "marcato" ? f * f * (1.6 - .6 * f) : f - Math.sin(2 * Math.PI * f) / (2 * Math.PI) * .35;
  function bvTick() {
    if (!BV.on) return; const P = PAT[BV.pat], H = HC(), beat = 60 / BV.bpm, t = (performance.now() - BV.t0) / 1000, n = Math.floor(t / beat), f = t / beat - n, i = n % P.beats;
    const sEl = document.getElementById("cdBVs"), dot = sEl && sEl.querySelector(".cd-dot"); if (!dot) { BV.on = false; return; }
    // during beat i the tip travels from ictus i (where it was on the click) toward ictus i + 1
    const q = bez(seg(P, i, BV.size), Math.min(1, ease(f, BV.style)));
    dot.setAttribute("cx", q[0].toFixed(2)); dot.setAttribute("cy", q[1].toFixed(2));
    if (n !== BV.last) { BV.last = n;
      const c = document.getElementById("cdCount"); if (c) c.textContent = String(i + 1);
      if (H) { const ev = [[0, 0, .05, i === 0 ? 1 : .6, i === 0 ? "clickHi" : "click"]]; if (BV.sub) ev.push([0, beat / 2, .04, .35, "click"]); H.play({ ev }); } }
    BV.raf = requestAnimationFrame(bvTick);
  }
  function bvRedraw() { const el = document.getElementById("cdBV"); if (!el) return; const a = document.activeElement, id = a && a.id, dc = a && a.dataset && a.dataset.cd; el.outerHTML = bvHTML(); const b = id ? document.getElementById(id) : dc ? document.querySelector(`[data-cd="${dc}"]`) : null; if (b) b.focus({ preventScroll: true }); }
  function bvStart() { BV.on = true; BV.last = -1; BV.t0 = performance.now(); bvRedraw(); cancelAnimationFrame(BV.raf); BV.raf = requestAnimationFrame(bvTick); }
  function bvStop() { BV.on = false; cancelAnimationFrame(BV.raf); bvRedraw(); }

  // ---------- toy 2: conduct the ensemble — an original chorale in three phrases, each ending with a fermata ----------
  // [soprano, alto, tenor, bass] for every beat; fermata on beats 8, 16 and 24
  const CHO = [
    ["E4", "C4", "G3", "C3"], ["F4", "C4", "A3", "F3"], ["G4", "C4", "G3", "E3"], ["A4", "C4", "A3", "F3"], ["G4", "E4", "C4", "C3"], ["F4", "D4", "B3", "G2"], ["E4", "C4", "G3", "C3"], ["D4", "B3", "G3", "G2"],
    ["G4", "E4", "C4", "C3"], ["A4", "F4", "C4", "F3"], ["B4", "G4", "D4", "G3"], ["C5", "G4", "E4", "C3"], ["B4", "G4", "D4", "B2"], ["A4", "E4", "C4", "A2"], ["G4", "D4", "B3", "G2"], ["A4", "E4", "C4", "A2"],
    ["E4", "C4", "G3", "C3"], ["D4", "B3", "G3", "B2"], ["C4", "A3", "E3", "A2"], ["E4", "C4", "G3", "E3"], ["F4", "C4", "A3", "F3"], ["E4", "C4", "G3", "G2"], ["D4", "B3", "F3", "G2"], ["C4", "G3", "E3", "C3"]];
  const FERM = [7, 15, 23], DYN = [["mp", .55], ["f", 1], ["p", .35]];   // per phrase: marking, target gesture size (0–1)
  const CD = { i: -1, prep: false, taps: [], sizes: [], held: [], cut: [], size: .6, lastXY: null, travel: 0, done: false, msg: "" };
  const dynOf = i => DYN[Math.min(2, Math.floor(Math.max(0, i) / 8))];
  function cdReset() { Object.assign(CD, { i: -1, prep: false, taps: [], sizes: [], held: [], cut: [], lastXY: null, travel: 0, done: false, msg: "" }); const H = HC(); if (H) H.play({ ev: [] }); }
  function cdBeat(size) {
    const H = HC(); if (!H || CD.done) return; const now = performance.now();
    if (!CD.prep) { CD.prep = true; CD.taps = [now]; CD.msg = "Preparation beat. The ensemble breathes, and comes in on your next beat."; cdRender(); return; }
    // a beat after a cutoff that wasn't at a fermata still counts; after the last chord, nothing more
    CD.i++; CD.taps.push(now); CD.sizes.push(size);
    if (CD.i >= CHO.length) { CD.i = CHO.length - 1; CD.done = true; cdRender(); return; }
    const vel = .2 + .75 * Math.min(1, size), ch = CHO[CD.i];
    H.play({ ev: ch.map((x, v) => [H.midi(H.parse(x)), 0, 12, vel * (v === 0 ? 1 : .8), undefined, "strings", [-.25, -.08, .08, .25][v]]) });
    CD.msg = FERM.includes(CD.i) ? "Fermata: hold it as long as you like. Then cut off, or go straight on with the next beat." : ""; cdRender();
  }
  function cdCut() {
    const H = HC(); if (!H || CD.i < 0) return; H.play({ ev: [] }); CD.cut.push(CD.i);
    if (CD.i === CHO.length - 1) { CD.done = true; CD.msg = ""; }
    else CD.msg = FERM.includes(CD.i) ? "Cut off. Give the next beat when you're ready: the ensemble waits for you." : "That cutoff stopped the music in the middle of a phrase. Give the next beat to go on.";
    cdRender();
  }
  function cdReport() {
    const iv = []; for (let k = 2; k < CD.taps.length; k++) iv.push({ d: CD.taps[k] - CD.taps[k - 1], after: k - 2 });   // after: the beat index the interval follows
    const plain = iv.filter(x => !FERM.includes(x.after)).map(x => x.d), med = plain.slice().sort((a, b) => a - b)[Math.floor(plain.length / 2)] || 0;
    const dev = plain.length ? Math.sqrt(plain.reduce((a, d) => a + (d - med) ** 2, 0) / plain.length) / med : 0;
    const ferm = FERM.filter(f => f < CHO.length - 1).map(f => { const x = iv.find(y => y.after === f); return x ? x.d / med : null; });
    const dyn = [0, 1, 2].map(p => { const s = CD.sizes.slice(p * 8, p * 8 + 8); return s.length ? s.reduce((a, b) => a + b, 0) / s.length : null; });
    const out = [];
    out.push(med ? `Your tempo: about ${Math.round(60000 / med)} beats per minute, ${dev < .08 ? "very steady" : dev < .16 ? "fairly steady" : "unsteady"} (beats varied by about ${Math.round(dev * 100)}%).` : "");
    ferm.forEach((r, k) => { if (r != null) out.push(`Fermata ${k + 1}: held ${r.toFixed(1)} times a beat${r < 1.5 ? ", barely longer than a beat; let it breathe" : r > 4 ? ", a long hold" : ""}.${CD.cut.includes(FERM[k]) ? " You cut it off before going on." : " You went straight on without a cutoff."}`); });
    const ord = dyn.every(x => x != null) ? (dyn[1] > dyn[0] && dyn[2] < dyn[0] ? "Your gestures followed the dynamics: medium for mp, large for f, small for p." : `Your gesture sizes didn't follow the dynamics (mp, f, p): average sizes ${dyn.map(x => Math.round(x * 100)).join(", ")}.`) : "";
    if (ord) out.push(ord);
    out.push(CD.cut.includes(CHO.length - 1) ? "You gave a final cutoff." : "The last chord had no cutoff: the ensemble is still holding it!");
    return out.filter(Boolean);
  }
  function cdHTML() {
    const pos = CD.i, [mk] = dynOf(pos < 0 ? 0 : pos);
    const beats = CHO.map((_, k) => `<span class="cd-b${k === pos ? " now" : ""}${k < pos ? " past" : ""}${FERM.includes(k) ? " ferm" : ""}${k % 4 === 0 ? " bar" : ""}" aria-hidden="true"></span>`).join("");
    const phr = DYN.map(([m], p) => `<span class="cd-ph" style="grid-column:${p * 8 + 1} / span 8"><b>${m}</b></span>`).join("");
    return `<div class="cd-co" id="cdCO">
      <div class="cd-tl" aria-hidden="true">${phr}${beats}</div>
      <p class="cd-st" role="status" aria-live="polite">${CD.done ? "Finished." : !CD.prep ? "Ready: give a preparation beat to start." : pos < 0 ? "Now the first beat…" : `Beat ${pos % 4 + 1} of bar ${Math.floor(pos / 4) + 1} · phrase ${Math.floor(pos / 8) + 1} (${mk})`} ${esc(CD.msg)}</p>
      <div class="cd-pad" id="cdPad" tabindex="0" role="button" aria-label="Conducting pad. Press Space or tap for each beat, C or Enter to cut off; arrow keys change the size of your gesture." aria-describedby="cdHow">${patSVG("4", { size: 1.15 })}<span class="cd-ring" id="cdRing" aria-hidden="true"></span></div>
      <p id="cdHow" class="lnote">Tap (or click) the pad on each beat, following the 4 pattern. Tap the points far apart for a big gesture (loud), close together for a small one (soft). With a keyboard: Space for each beat, ↑ and ↓ for gesture size (now <b id="cdSz">${Math.round(CD.size * 100)}%</b>), C for a cutoff.</p>
      <div class="toy-row"><button type="button" class="pr-btn" data-cd="cut">Cut off</button><button type="button" class="pr-btn" data-cd="again">Start over</button></div>
      ${CD.done ? `<div class="cd-rep"><h4>How it went</h4><ul>${cdReport().map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}</div>`;
  }
  function cdRender() { const el = document.getElementById("cdCO"); if (!el) return; const pad = document.activeElement && document.activeElement.id === "cdPad", dc = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.cd; el.outerHTML = cdHTML(); const f = pad ? document.getElementById("cdPad") : dc ? document.querySelector(`[data-cd="${dc}"]`) : null; if (f) f.focus({ preventScroll: true }); }
  function wire() {
    if (window.__cdWired) return; window.__cdWired = true;
    document.addEventListener("click", e => {
      const b = e.target.closest("[data-cd]"); if (!b) return; const a = b.dataset.cd;
      if (a === "bv") { if (BV.on) bvStop(); else bvStart(); }
      else if (a === "cut") cdCut();
      else if (a === "again") { cdReset(); cdRender(); }
    });
    document.addEventListener("change", e => { const t = e.target;
      if (t.id === "cdPat") { BV.pat = t.value; bvRedraw(); } else if (t.id === "cdSty") { BV.style = t.value; bvRedraw(); } else if (t.id === "cdSize") { BV.size = +t.value; bvRedraw(); } else if (t.id === "cdSub") BV.sub = t.checked; });
    document.addEventListener("input", e => { if (e.target.id === "cdBpm") { const was = BV.on, now = performance.now(), P = 60 / BV.bpm, ph = was ? ((now - BV.t0) / 1000) / P : 0; BV.bpm = +e.target.value; if (was) BV.t0 = now - ph * (60 / BV.bpm) * 1000; const v = document.getElementById("cdBpmV"); if (v) v.textContent = BV.bpm; } });
    // the pad: each pointer press is a beat; the gesture size is how far apart the taps are (or how far the mouse traveled)
    document.addEventListener("pointermove", e => { const pad = e.target.closest && e.target.closest("#cdPad"); if (!pad || e.pointerType !== "mouse") return; if (CD.lastXY) CD.travel += Math.hypot(e.clientX - CD.lastXY[0], e.clientY - CD.lastXY[1]); CD.lastXY = [e.clientX, e.clientY]; });
    document.addEventListener("pointerdown", e => { const pad = e.target.closest && e.target.closest("#cdPad"); if (!pad) return; e.preventDefault(); pad.focus({ preventScroll: true });
      const r = pad.getBoundingClientRect(), dia = Math.hypot(r.width, r.height);
      let size;
      if (e.pointerType === "mouse" && CD.travel > 0) size = Math.min(1, CD.travel / (dia * .9));
      else size = CD.lastTap ? Math.min(1, Math.hypot(e.clientX - CD.lastTap[0], e.clientY - CD.lastTap[1]) / (dia * .45)) : CD.size;
      CD.lastTap = [e.clientX, e.clientY]; CD.travel = 0; CD.size = Math.max(.1, size);
      const ring = document.getElementById("cdRing"); if (ring) { ring.style.left = (e.clientX - r.left) + "px"; ring.style.top = (e.clientY - r.top) + "px"; ring.style.setProperty("--s", .5 + CD.size); ring.classList.remove("go"); void ring.offsetWidth; ring.classList.add("go"); }
      cdBeat(CD.size); });
    document.addEventListener("keydown", e => {
      if (!e.target.closest || !e.target.closest("#cdPad")) return;
      if (e.key === " " || e.key === "Spacebar") { e.preventDefault(); if (!e.repeat) cdBeat(CD.size); }
      else if (e.key === "Enter" || e.key === "c" || e.key === "C") { e.preventDefault(); cdCut(); }
      else if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); CD.size = Math.max(.1, Math.min(1, CD.size + (e.key === "ArrowUp" ? .15 : -.15))); const s = document.getElementById("cdSz"); if (s) s.textContent = Math.round(CD.size * 100) + "%"; }
    });
  }

  // ---------- lesson ----------
  const fig = (svg, cap) => `<figure class="cd-fig">${svg}<figcaption>${cap}</figcaption></figure>`;
  const lesson = { steps: [
    { title: "What a conductor does", kick: "The conductor", render: (H) => `<p>A conductor is the one musician in the ensemble who makes no sound. Their job is to turn a group of players or singers into one performance: to set and change the tempo, show where the beat is, balance the parts, cue entrances, shape dynamics and phrasing, and make the interpretive decisions that a group can't make by vote.</p>
      <p>Much of the work happens before the concert. A conductor studies the score until they can hear it in their head, decides how each passage should go, plans rehearsals, and in rehearsal listens, diagnoses, and asks for changes. In performance, the gestures remind the ensemble of everything they rehearsed and react to what is happening now.</p>
      <p>Conducting with a stick is old. In 1687 the French composer Jean-Baptiste Lully beat time by striking a heavy staff on the floor, hit his own foot, and died of the infection. The light baton held in the hand became standard in the 19th century, with conductors such as Louis Spohr and Felix Mendelssohn.</p>`
      + H.check("Which of these is part of a conductor's job before the concert?", "studying the score and planning rehearsals", ["tuning every instrument", "writing the program notes", "playing the hardest parts"], "In performance, the gestures recall what was rehearsed.") },
    { title: "The beat: preparation, ictus, rebound", kick: "The beat", render: (H) => `<p>Every beat a conductor gives has three parts:</p>
      <ul><li>The <b>preparation</b>: the motion before the beat, which tells the ensemble when it will arrive, how fast, how loud and in what style.</li>
      <li>The <b>ictus</b>: the exact moment of the beat, the lowest point of the motion, where the baton seems to bounce. It sits on an imaginary horizontal line, the <b>beat plane</b>.</li>
      <li>The <b>rebound</b>: the bounce after the ictus, which carries the baton toward the next beat.</li></ul>
      <p>Players watch the preparation more than the ictus: they need to see the beat coming. That's why a good conductor's motion is smooth and predictable, with speed changing in a way the eye can read.</p>`
      + fig(patSVG("2"), "The 2 pattern: beat 1 falls to the beat plane and rebounds; beat 2 is a smaller bounce, then the baton rises to prepare beat 1.")
      + H.check("The exact point of the beat in a conductor's motion is the…", "ictus", ["rebound", "preparation", "cutoff"], "It sits on the beat plane.") },
    { title: "Beat patterns", kick: "Patterns", render: (H) => { wire(); return `<p>Each meter has a standard pattern. They all share two rules: <b>beat 1 always comes straight down</b> (the downbeat), and <b>the last beat always goes up</b> (the upbeat), preparing the next bar. In 4, beat 2 goes <b>in</b> (toward the body: left for the right hand) and beat 3 <b>out</b>; in 3, beat 2 goes out.</p>`
      + tbl("Standard beat patterns (right hand)", ["Pattern", "Used for", "Directions"], Object.values(PAT).map(p => [p.name.split(" (")[0], esc(p.name.replace(/^[^(]*\(?/, "").replace(/\)$/, "")), p.dir.map((d, i) => `${i + 1} ${d}`).join(", ")]))
      + `<p>Fast music is conducted in fewer beats (a fast 3/4 in 1, a fast 6/8 in 2), and slow music in more (a slow 4/4 subdivided, a slow 6/8 in 6). Try each pattern with the animated baton:</p>${bvHTML()}`
      + H.check("In a 4 pattern, beat 2 goes…", "in, toward the body (left for the right hand)", ["out, away from the body", "straight up", "straight down"], "Then beat 3 goes out, and beat 4 up."); } },
    { title: "Starting, stopping, and fermatas", kick: "Starting and stopping", render: (H) => `<p><b>Starting.</b> One preparatory beat, in the new tempo, is all an ensemble needs. The conductor breathes with it, so wind players and singers breathe too. If the music starts on beat 1, the preparation is an upbeat; if it starts on another beat, the preparation is the beat before it.</p>
      <p><b>Stopping.</b> A <b>cutoff</b> (or release) is a small loop or flick that ends on a clear point: the sound stops there. It needs its own preparation, just like an entrance.</p>
      <p><b>Fermatas.</b> A fermata (a curve over a dot) means hold the note longer than its value, as long as the conductor decides. The baton stops moving, often sustaining with a slight motion or the left hand to keep the sound alive. Then there are two choices:</p>
      <ul><li><b>Cut off</b>, then give a new preparation for what follows (typical when there's a rest or a breath after the fermata).</li>
      <li><b>Go on without a cutoff</b>: the release of the fermata becomes the preparation for the next beat (when the music connects).</li></ul>`
      + H.check("A fermata lasts…", "as long as the conductor decides", ["exactly twice the note value", "exactly one extra beat", "until the next bar line"], "There's no fixed length.") },
    { title: "Expression: size, style and the left hand", kick: "Expression", render: (H) => { wire(); return `<p>The pattern tells the ensemble where the beat is; everything else about the gesture tells them how to play.</p>
      <ul><li><b>Size</b> shows dynamics: small for soft, large for loud. A gradually growing pattern asks for a crescendo.</li>
      <li><b>Style</b> shows articulation: smooth, continuous curves for legato; quick motion stopping on each point for staccato; a heavy, accelerating ictus for marcato and accents.</li>
      <li><b>Height</b>: a pattern close to the body feels intimate; a high one feels intense.</li>
      <li><b>The left hand</b> doesn't mirror the right. It cues entrances, shows dynamics (palm down to quiet, palm up to grow), shapes phrases and sustains fermatas.</li>
      <li><b>The face and eyes</b>: eye contact before a cue, breathing with the singers or winds, and an expression that matches the music.</li></ul>
      <p>Try the same pattern in each style and size:</p>${bvHTML()}`
      + H.check("Mirroring the right hand with the left is generally avoided because…", "the left hand is needed for cues, dynamics and phrasing", ["it's physically impossible", "orchestras forbid it", "it makes the beat slower"], "Each hand has its own job."); } },
    { title: "Leading the ensemble", kick: "Leadership", render: (H) => `<p>Conducting is leadership as much as gesture. A conductor:</p>
      <ul><li><b>Knows the score</b> better than anyone in the room: every part, every transposition, every text.</li>
      <li><b>Listens</b>: for balance (can the melody be heard?), ensemble (are we together?), intonation, and style, and decides what to fix first.</li>
      <li><b>Uses rehearsal time well</b>: plans which passages need the most work, talks briefly, and lets the ensemble play.</li>
      <li><b>Communicates</b> with gesture first and words second, with specific, positive requests (“shorter notes in bar 12” rather than “that was bad”).</li>
      <li><b>Builds trust</b>: musicians play freely only when they trust the conductor's beat and decisions.</li>
      <li><b>Makes interpretive decisions</b>: tempo, rubato, balance and character, grounded in study of the composer and the style.</li></ul>`
      + H.check("“Shorter notes in bar 12” is better rehearsal feedback than “that was bad” because…", "it's specific and tells the players what to change", ["it's longer", "it names a composer", "it's louder"], "Specific and positive.") },
    { title: "Choral and instrumental conductors", kick: "Choirs and instruments", render: (H) => `<p>The basic technique is the same, but choirs and instrumental ensembles need different things.</p>`
      + tbl("Choral and instrumental conducting", ["", "Choral conductor", "Instrumental conductor"], [
        ["Baton", "Often none: the open hands shape sound and vowels", "Usually a baton, for clarity at a distance"],
        ["Text", "Diction, vowels and consonants; cutoffs placed on final consonants", "No text; articulation, bowings and breath marks"],
        ["Breath", "Breathes with the singers; shows breaths in the gesture", "Shows breaths for winds and brass"],
        ["Pitch", "Gives starting pitches; works constantly on tuning without fixed keys", "Instruments tune before; works on balance between sections"],
        ["The score", "Voice parts at concert pitch", "Many transposing instruments and clefs"],
        ["Rehearsal", "Warm-ups, sound and blend, learning notes and text, often memorizing", "Sectionals, balance, bowings, mostly reading from parts"],
        ["Gesture", "Rounder, more legato; often smaller, closer to the body", "Clearer ictus for large groups; patterns readable from far away"]])
      + `<p>Many conductors do both. The choral conductor's strengths in breath, text and line make instrumental phrasing sing; the instrumental conductor's clarity helps large choirs stay together.</p>`
      + H.check("A choral conductor often places a cutoff…", "on the final consonant of a word", ["on the vowel", "only at the end of the piece", "a beat early"], "Singers need to know when to close the consonant.") },
    { title: "Conducting in the film studio", kick: "Film scoring sessions", render: (H) => `<p>Recording a film score adds one more partner: the picture. Every cue has to line up with the film, often to a fraction of a second, so a scoring-stage conductor works with tools concert conductors don't use:</p>
      <ul><li><b>The click track</b>: a metronome heard in headphones by the conductor and players, generated from the cue's tempo map, so the music lands exactly on the picture's hit points.</li>
      <li><b>Streamers and punches</b>: a streamer is a line that sweeps across a screen in front of the conductor and ends on an important moment; a punch is a flash of light on a beat or a hit point. They let a conductor work in <b>free timing</b> (without a click), shaping tempo by feel while still landing on the picture.</li>
      <li><b>Timecode and the cue sheet</b>: each cue is identified by number and timecode; the score marks where the hit points fall in bars and beats.</li>
      <li><b>Efficiency</b>: studio players read the music for the first time at the session, and cues are recorded in a few takes. The conductor's beat must be absolutely clear, and rehearsal is minimal.</li></ul>
      <p>The same tools now appear in concert halls, where orchestras play scores live to a projected film: conductors watch streamers and punches on a monitor, with or without a click.</p>`
      + H.check("A line that sweeps across the conductor's screen and ends on an important moment in the film is a…", "streamer", ["punch", "click track", "cue sheet"], "A punch is a flash of light.") },
    { title: "Leading a jazz band", kick: "Jazz", render: (H) => `<p>A jazz big band works differently. Once the tune starts, the <b>rhythm section</b> (drums, bass, piano, guitar) keeps time; a conductor beating patterns would get in the way of the swing. So a band leader:</p>
      <ul><li><b>Counts off</b> the tune, setting the tempo and feel (“one… two… one, two, three, four”), often snapping on 2 and 4.</li>
      <li><b>Cues</b> sections and soloists: who solos, for how many choruses, when the backgrounds come in, when the shout chorus begins.</li>
      <li><b>Shows the form</b> with hand signals: a circling finger to repeat or go back to the top, a raised fist or open hand for the last time or the ending, a pointing finger for the next soloist.</li>
      <li><b>Sets up and cuts off</b> the big moments: hits, fermatas and the final chord, which do need clear conducted gestures.</li>
      <li>Often <b>plays in the band</b> too, leading from the piano or the trumpet section.</li></ul>
      <p>In rehearsal, a jazz director works on what notation can't fully show: swing feel, articulation and phrasing in the style, balance within the sections, and the shape of the solos.</p>`
      + H.check("Why doesn't a big band leader conduct beat patterns through a whole tune?", "the rhythm section keeps time, and patterns would get in the way of the swing", ["jazz has no meter", "players can't see a baton", "the tempo never changes"], "The leader counts off, cues and shows the form.") },
    { title: "Try it: conduct the ensemble", kick: "Conduct the ensemble", render: (H) => { wire(); return `<p>Here is a short chorale for strings in three phrases, marked <b>mp</b>, <b>f</b> and <b>p</b>, each ending with a fermata. The ensemble plays one chord each time you give a beat, and holds it until the next one, so it follows your tempo exactly.</p>
      <ol><li>Give one <b>preparation beat</b>; the ensemble comes in on the next.</li>
      <li>Keep a steady tempo through each phrase, and match the size of your gesture to the dynamics.</li>
      <li>At each fermata, hold as long as you like; then <b>cut off</b> and start again, or go straight on.</li>
      <li>End with a final cutoff. You'll get a report on your tempo, fermatas, dynamics and cutoffs.</li></ol>${cdHTML()}`; } },
  ] };

  // ---------- drills ----------
  const F = {
    gesture: [
      ["The motion just before a beat, which shows when it will arrive and how it should sound, is the…", "preparation", ["ictus", "rebound", "cutoff"], "Players watch it to anticipate the beat."],
      ["The bounce after the ictus is the…", "rebound", ["preparation", "downbeat", "fermata"], "It carries the baton toward the next beat."],
      ["A small loop or flick that ends the sound is a…", "cutoff (release)", ["preparation", "downbeat", "cue"], "It needs its own preparation."],
      ["To ask for a soft sound, a conductor uses…", "a small pattern", ["a large pattern", "a faster tempo", "a higher pattern"], "Size shows dynamics."],
      ["For staccato, the baton…", "moves quickly to each point and stops", ["never stops moving", "beats only on beat 1", "makes larger circles"], "Legato is smooth and continuous."],
      ["The left hand is mainly used for…", "cues, dynamics, phrasing and sustaining", ["mirroring the right hand", "holding the score", "beating subdivisions"], "Each hand has its own job."],
      ["A fermata is held…", "as long as the conductor decides", ["for exactly two beats", "until the next bar", "for one extra beat"], "Then a cutoff, or straight on."],
      ["How many preparatory beats does an ensemble need?", "one, in the new tempo", ["four", "a full bar", "none"], "Breathe with it."],
    ],
    settings: [
      ["A metronome heard in headphones at a film scoring session is a…", "click track", ["streamer", "punch", "cue sheet"], "It's generated from the cue's tempo map."],
      ["A flash of light on a beat or hit point in a film session is a…", "punch", ["streamer", "click", "cutoff"], "A streamer sweeps across the screen."],
      ["Conducting a film cue without a click, using streamers and punches, is called…", "free timing", ["rubato timing", "cut time", "tempo primo"], "The conductor shapes the tempo by feel."],
      ["In a jazz big band, time is kept mainly by…", "the rhythm section", ["the conductor's baton", "the lead trumpet", "the audience"], "Drums, bass, piano, guitar."],
      ["A band leader's circling finger usually means…", "repeat, or go back to the top", ["play softer", "end now", "next soloist"], "Hand signals show the form."],
      ["A jazz band leader starts a tune by…", "counting it off", ["giving a downbeat with a baton", "playing a tuning note", "showing a fermata"], "“One… two… one, two, three, four.”"],
      ["Choral conductors often conduct without…", "a baton", ["a score", "a pattern", "a preparation"], "Open hands help shape vowels and line."],
      ["A choral conductor often places cutoffs…", "on final consonants", ["on vowels", "a beat early", "only at the end"], "Singers close the word together."],
      ["Which conductor deals most with transposing instruments in the score?", "an orchestra or band conductor", ["a choral conductor", "a jazz combo leader", "a soloist"], "Choral parts are at concert pitch."],
    ],
  };
  const PDIR = ["4", "3", "2", "6", "5a", "5b"];
  const GEN = {
    pattern: H => { const id = H.rnd(PDIR), P = PAT[id], b = Math.floor(Math.random() * P.beats), ans = P.dir[b];
      const all = [...new Set(Object.values(PAT).flatMap(p => p.dir))].filter(x => x !== ans && !(ans.includes("left") && x.includes("in")));
      return H.mc(`In the ${P.name.replace(/\s*\(.*/, "")} pattern (${P.name.replace(/^[^(]*\(|\)$/g, "")}), beat ${b + 1} goes…`, ans, all, `The ${P.name.split(" (")[0]} pattern: ${P.dir.map((d, i) => `${i + 1} ${d}`).join(", ")}.`, { kicker: "Beat patterns", order: "shuffle" }); },
    meter: H => { const m = H.rnd([["2/4", "2"], ["3/4", "3"], ["4/4", "4"], ["slow 6/8", "6"], ["fast 6/8", "2"], ["fast 3/4", "1"], ["5/4 grouped 3 + 2", "5a"], ["cut time (2/2)", "2"]]), ans = PAT[m[1]].name.split(" (")[0];
      return H.mc(`Which beat pattern usually fits ${m[0]}?`, ans, ["1", "2", "3", "4", "5 as 3 + 2", "5 as 2 + 3", "6"].filter(x => x !== ans), `Fast music takes fewer beats; slow music more.`, { kicker: "Beat patterns" }); },
  };
  function make(mode, H) {
    if (mode === "pattern") return Math.random() < .6 ? GEN.pattern(H) : GEN.meter(H);
    const pool = mode === "settings" ? F.settings : F.gesture, [q, a, w, y] = H.rnd(pool); return H.mc(q, a, w, y);
  }
  const reference = () => `<ul><li><b>Beat</b>: preparation, ictus (on the beat plane), rebound.</li><li><b>Patterns</b>: 1 down; last beat up; in 4: down, in, out, up; in 3: down, out, up.</li><li><b>Start</b> with one preparatory beat; <b>stop</b> with a cutoff; a <b>fermata</b> lasts as long as the conductor decides.</li><li><b>Size</b> = dynamics; <b>style</b> = articulation; the left hand cues and shapes.</li><li><b>Choral</b>: often no baton, text, breath, consonant cutoffs. <b>Film</b>: click track, streamers, punches, free timing. <b>Jazz</b>: count-off, cues, hand signals for form; the rhythm section keeps time.</li></ul>`;
  return { key: "silverapps-conduct-v1", lesson, make, reference, modes: [{ id: "pattern", kicker: "Beat patterns" }, { id: "gesture", kicker: "Gesture and technique" }, { id: "settings", kicker: "Choirs, film and jazz" }], topics: [] };
})();

window.FAM.quiz = [
  {"s": 1, "q": "Which member of the ensemble makes no sound?", "a": "the conductor", "w": ["the concertmaster", "the principal oboe", "the timpanist"], "hint": "The silent musician.", "why": "Their sound is the ensemble's."},
  {"s": 1, "q": "Much of a conductor's work happens…", "a": "before the concert, in score study and rehearsal", "w": ["only during the concert", "after the concert", "in the tuning before the concert"], "hint": "Preparation.", "why": "Gestures recall what was rehearsed."},
  {"s": 2, "q": "The moment of the beat, at the bottom of the motion, is the…", "a": "ictus", "w": ["rebound", "preparation", "release"], "hint": "On the beat plane.", "why": "The rebound follows it."},
  {"s": 2, "q": "Players watch which part of the beat most closely?", "a": "the preparation", "w": ["the rebound", "the cutoff", "the conductor's feet"], "hint": "They need to see it coming.", "why": "It shows when the beat will arrive."},
  {"s": 3, "q": "In every standard pattern, beat 1 goes…", "a": "straight down", "w": ["up", "to the left", "to the right"], "hint": "The downbeat.", "why": "The last beat always goes up."},
  {"s": 3, "q": "In a 3 pattern, beat 2 goes…", "a": "out, away from the body", "w": ["in, toward the body", "up", "down"], "hint": "Down, out, up.", "why": "In 4, beat 2 goes in."},
  {"s": 3, "q": "A fast 6/8 is usually conducted in…", "a": "2", "w": ["6", "3", "4"], "hint": "Two dotted-quarter beats.", "why": "A slow 6/8 is conducted in 6."},
  {"s": 3, "q": "In a 4 pattern, beat 3 goes…", "a": "out, away from the body", "w": ["in, toward the body", "up", "straight down"], "hint": "Down, in, out, up.", "why": "Beat 4 goes up."},
  {"s": 4, "q": "To start an ensemble, a conductor gives…", "a": "one preparatory beat in the new tempo", "w": ["a full bar of beats", "four clicks", "a downbeat with no preparation"], "hint": "Breathe with it.", "why": "It shows tempo, dynamic and style."},
  {"s": 4, "q": "After a fermata, the conductor can…", "a": "cut off, or go straight on without a cutoff", "w": ["only cut off", "only go straight on", "restart the piece"], "hint": "Two choices.", "why": "It depends on whether the music connects."},
  {"s": 5, "q": "A small pattern asks for…", "a": "a soft sound", "w": ["a loud sound", "a faster tempo", "staccato"], "hint": "Size shows dynamics.", "why": "A large one asks for loud."},
  {"s": 5, "q": "Smooth, continuous motion asks for…", "a": "legato", "w": ["staccato", "marcato", "a cutoff"], "hint": "Never stopping.", "why": "Staccato stops on each point."},
  {"s": 5, "q": "The left hand is mostly for…", "a": "cues, dynamics and phrasing", "w": ["mirroring the right hand", "beating time", "holding the baton"], "hint": "A separate job.", "why": "Mirroring wastes it."},
  {"s": 6, "q": "Listening for whether the melody can be heard over the accompaniment is listening for…", "a": "balance", "w": ["intonation", "tempo", "diction"], "hint": "Loudness between parts.", "why": "Then decide what to fix first."},
  {"s": 7, "q": "Choral conductors often work without a baton because…", "a": "open hands help shape vowels, breath and line", "w": ["batons are not allowed in churches", "singers can't see a baton", "choirs never need a beat"], "hint": "Shaping sound.", "why": "Large choirs with orchestra may still use one."},
  {"s": 7, "q": "Which conductor reads many transposing instruments in the score?", "a": "an instrumental conductor", "w": ["a choral conductor", "neither", "only a jazz leader"], "hint": "Clarinets, horns, trumpets…", "why": "Voice parts are at concert pitch."},
  {"s": 8, "q": "At a film scoring session, a metronome in the headphones is the…", "a": "click track", "w": ["streamer", "punch", "cue sheet"], "hint": "It keeps the music on the picture.", "why": "It comes from the cue's tempo map."},
  {"s": 8, "q": "Conducting to picture without a click, using streamers and punches, is…", "a": "free timing", "w": ["rubato", "cut time", "a tempo"], "hint": "Shaping tempo by feel.", "why": "The streamer shows the hit point coming."},
  {"s": 9, "q": "In a big band, who keeps time once the tune starts?", "a": "the rhythm section", "w": ["the conductor's baton", "the saxophones", "the soloist"], "hint": "Drums, bass, piano, guitar.", "why": "The leader counts off, cues and shows the form."},
  {"s": 9, "q": "A jazz band leader's job during a tune includes…", "a": "cueing soloists, backgrounds and the ending", "w": ["beating every bar", "tuning the band", "turning pages for the pianist"], "hint": "Form and cues.", "why": "With hand signals."},
];
