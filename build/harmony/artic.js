window.FAM = (() => {
  // ===== Articulation and phrasing: articulation marks, slurs and phrase marks, shaping a phrase, and text setting
  // (where a songwriter puts the stressed syllables: strong beats, long notes, syncopations). Every lyric here is original. =====
  const tbl = (cap, head, rows) => `<div class="ltable-wrap" tabindex="0" role="region" aria-label="${cap}"><table class="ltable"><caption>${cap}</caption><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => i ? `<td>${c}</td>` : `<th scope="row">${c}</th>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ---------- score helpers: one treble staff ----------
  const sc = (time, bars, o = {}) => Object.assign({ type: "score", clefs: ["treble"], time, vf: "C", sig: {}, bpm: 92, minBar: 210, scale: 1, lyFit: true, rowW: typeof innerWidth === "number" && innerWidth < 600 ? 680 : 1000, bars: bars.map(b => ({ t: [b] })) }, o);
  const n = (k, d, x = {}) => Object.assign({ k: k ? [k] : [], d }, x);
  const MEL = ["E5", "D5", "C5", "D5", "E5", "E5", "E5", "D5"];   // one short tune, articulated different ways
  const melBar = (art, extra = {}) => [0, 4].map(s => MEL.slice(s, s + 4).map((k, i) => n(k, "q", Object.assign(art ? { art: [art] } : {}, extra[s + i] || {}))));
  const ARTS = [["a.", "staccato", "a dot over or under the notehead", "short and detached: about half the written length"],
    ["a-", "tenuto", "a short line", "full length, often with a slight lean"], ["a>", "accent", "a sideways wedge (>)", "a stronger attack than the notes around it"],
    ["a^", "marcato", "an upright wedge (^)", "a strong, heavy attack, a little separated"], ["a@a", "fermata", "an arc over a dot", "held longer than written, as long as the performer chooses"]];
  const artFig = code => sc("4/4", melBar(code));
  // dynamics: one four-bar phrase, marked different ways (x: extra props by note index 0–15)
  const DMEL = ["C5", "D5", "E5", "F5", "G5", "A5", "G5", "F5", "E5", "F5", "G5", "A5", "B5", "G5", "E5", "C5"];
  const dynFig = (x = {}, o = {}) => sc("4/4", [0, 4, 8, 12].map(st => DMEL.slice(st, st + 4).map((k, i) => n(k, "q", x[st + i] || {}))), Object.assign({ minBar: 170 }, o));
  const DYNS = [["pp", "pianissimo", "very soft"], ["p", "piano", "soft"], ["mp", "mezzo-piano", "moderately soft"], ["mf", "mezzo-forte", "moderately loud"], ["f", "forte", "loud"], ["ff", "fortissimo", "very loud"]];
  const terraced = dynFig({ 0: { dyn: "p" }, 8: { dyn: "f" } }), swell = dynFig({ 0: { dyn: "p", hp: "<" }, 11: { dyn: "f", hpe: 1 }, 12: { hp: ">" }, 15: { dyn: "p", hpe: 1 } }), sfz = dynFig({ 0: { dyn: "mp" }, 6: { dyn: "sfz" } });
  const legato = sc("4/4", melBar(null, { 0: { sls: 1 }, 3: { sle: 1 }, 4: { sls: 1 }, 7: { sle: 1 } }));

  // ---------- the text-setting examples (original lyrics) ----------
  // a syllable: [text, stressed?, hyphen to the next?]
  const W = (s) => s.split(" ").map(t => { const st = /[A-Z]{2}|^[A-Z]$/.test(t.replace(/-$/, "")) && t.replace(/-$/, "") !== "I", hy = /-$/.test(t); const w = t.replace(/-$/, ""); return [w === "I" ? "I" : w.toLowerCase(), st, hy]; });
  // a setting: bars of [duration, syllable index (null: rest, or the held end of a tie), pitch, extra]
  const setFig = (sylls, bars, o = {}) => sc(o.time || "4/4", bars.map(b => b.map(([d, si, p, x]) => { const sy = si == null ? null : sylls[si];
    return n(p || null, d, Object.assign(sy ? { ly: sy[1] ? sy[0].toUpperCase() : sy[0], hy: sy[2] } : {}, x || {})); })), Object.assign({ bpm: o.bpm || 88 }, o.rowW ? { rowW: o.rowW } : {}));
  const L_MORN = W("I re- MEM- ber the MOR- ning we LEFT");
  const good = setFig(L_MORN, [[["q"], ["8", 0, "C5"], ["8", 1, "D5"], ["q", 2, "E5"], ["8", 3, "D5"], ["8", 4, "C5"]], [["hd", 5, "G5"], ["8", 6, "E5"], ["8", 7, "D5"]], [["w", 8, "C5"]]]);
  const bad = setFig(L_MORN, [[["q", 0, "C5"], ["qd", 1, "D5"], ["8", 2, "E5"], ["q", 3, "D5"]], [["hd", 4, "C5"], ["8", 5, "G5"], ["8", 6, "E5"]], [["h", 7, "D5"], ["8", 8, "C5"], ["8"], ["q"]]]);
  const L_HOLD = W("HOLD on to the LIGHT");
  const longs = setFig(L_HOLD, [[["h", 0, "G4"], ["8", 1, "A4"], ["8", 2, "B4"], ["q", 3, "C5"]], [["w", 4, "D5"]]]);
  const melis = setFig(L_HOLD, [[["h", 0, "G4"], ["8", 1, "A4"], ["8", 2, "B4"], ["q", 3, "C5"]], [["8", 4, "D5", { sls: 1, ex: 1 }], ["8", null, "E5"], ["8", null, "D5"], ["8", null, "C5", { sle: 1 }], ["h"]]]);
  const L_TOM = W("to- MOR- row will CAR- ry us HOME");
  const straight = setFig(L_TOM, [[["h"], ["q"], ["8"], ["8", 0, "G4"]], [["q", 1, "C5"], ["8", 2, "B4"], ["8", 3, "A4"], ["q", 4, "G4"], ["8", 5, "A4"], ["8", 6, "B4"]], [["h", 7, "C5"], ["h"]]]);
  const pushed = setFig(L_TOM, [[["h"], ["q"], ["8", 0, "G4"], ["8", 1, "C5", { tie: 1 }]], [["8", null, "C5"], ["8", 2, "B4"], ["8", 3, "A4"], ["8", 4, "G4", { tie: 1 }], ["8", null, "G4"], ["8", 5, "A4"], ["8", 6, "B4"], ["8", 7, "C5", { tie: 1 }]], [["h", null, "C5"], ["h"]]], typeof innerWidth === "number" && innerWidth >= 600 ? { rowW: 1180 } : {});

  // ---------- Try it: place the syllables (drums + a synthetic singer; 2 bars of 4/4 in eighth notes) ----------
  const LINES = [
    { id: "light", text: "Hold on to the light", syl: [["hold", 1, "o"], ["on", 0, "ah"], ["to", 0, "u"], ["the", 0, "uh"], ["light", 1, "ah"]], mel: [67, 69, 71, 72, 74] },
    { id: "morn", text: "I remember the morning we left", syl: [["I", 0, "ah"], ["re", 0, "i"], ["mem", 1, "e"], ["ber", 0, "uh"], ["the", 0, "uh"], ["mor", 1, "o"], ["ning", 0, "i"], ["we", 0, "i"], ["left", 1, "e"]], mel: [72, 74, 76, 74, 72, 79, 76, 74, 72] },
    { id: "tom", text: "Tomorrow will carry us home", syl: [["to", 0, "u"], ["mor", 1, "o"], ["row", 0, "o"], ["will", 0, "i"], ["car", 1, "ah"], ["ry", 0, "i"], ["us", 0, "uh"], ["home", 1, "o"]], mel: [67, 72, 71, 69, 67, 69, 71, 72] },
    { id: "river", text: "Nobody told me the river was deep", syl: [["no", 1, "o"], ["bo", 0, "o"], ["dy", 0, "i"], ["told", 1, "o"], ["me", 0, "i"], ["the", 0, "uh"], ["riv", 1, "i"], ["er", 0, "uh"], ["was", 0, "uh"], ["deep", 1, "i"]], mel: [74, 72, 71, 72, 71, 69, 71, 69, 67, 67] },
  ];
  const SLOTS = 16, COUNT = ["1", "&", "2", "&", "3", "&", "4", "&"];
  const PR = { line: 1, pos: [], cur: 0, bpm: 88 };
  const stressIdx = L => L.syl.map((s, i) => s[1] ? i : -1).filter(i => i >= 0);
  // the five presets, built from the line's stress pattern
  function preset(L, kind) {
    const S = stressIdx(L), k = S.length, sp = k <= 2 ? 8 : 4, w0 = S[0];
    const base = w0 > 0 ? (sp === 8 ? 4 : 4) : 0, pos = new Array(L.syl.length).fill(0);
    if (kind === "even") { L.syl.forEach((_, i) => pos[i] = i); return pos; }
    S.forEach((si, j) => { pos[si] = base + j * sp; });
    if (base + (k - 1) * sp > SLOTS - 1) S.forEach((si, j) => { pos[si] = j * Math.floor(SLOTS / k); });
    for (let j = 0; j < k; j++) {   // weak syllables between stress j and j+1 (or before the first)
      const from = j === 0 ? 0 : S[j - 1] + 1, to = S[j], cnt = to - from;
      for (let i = from; i < to; i++) pos[i] = kind === "beat" && j > 0 ? pos[S[j - 1]] + 1 + (i - from) : pos[to] - (to - i);
    }
    const lastS = S[k - 1]; for (let i = lastS + 1; i < L.syl.length; i++) pos[i] = pos[lastS] + (i - lastS);
    if (kind === "push") S.forEach((si, j) => { if (j === 0) return; const from = S[j - 1] + 1; for (let i = from; i <= si; i++) pos[i] -= 1; });
    if (kind === "wrong") S.forEach((si, j) => { if (si === 0) return; const prev = si - 1; if (L.syl[prev][1]) return; pos[prev] = pos[si]; pos[si] = pos[si] + 1;
      for (let i = si + 1; i < L.syl.length && pos[i] <= pos[i - 1]; i++) pos[i] = pos[i - 1] + 1; });
    return pos.map(p => Math.max(0, Math.min(SLOTS - 1, p)));
  }
  const PRESETS = [["beat", "Stresses on the strong beats"], ["long", "Stressed syllables held long"], ["push", "Syncopated: pushed ahead of the beat"], ["even", "Even eighths from the downbeat"], ["wrong", "Weak syllables on the strong beats"]];
  const lenOf = (pos, i) => (i + 1 < pos.length ? pos[i + 1] : SLOTS) - pos[i];
  const beatName = p => `bar ${Math.floor(p / 8) + 1}, ${p % 2 ? `the “and” of ${Math.floor((p % 8) / 2) + 1}` : `beat ${(p % 8) / 2 + 1}`}`;
  function judge(L, pos) {
    const out = []; let good = 0, bad = 0;
    L.syl.forEach(([t, st], i) => {
      const p = pos[i], len = lenOf(pos, i), strong = p % 4 === 0, onBeat = p % 2 === 0, cross = !onBeat && len >= 2;
      if (st) {
        if (strong) { out.push([t, "good", `on a strong beat (${beatName(p)})${len >= 3 ? ", and held" : ""}`]); good++; }
        else if (onBeat) { out.push([t, len >= 2 ? "good" : "ok", `on ${beatName(p)}, a weaker beat${len >= 2 ? ", but held, so it still stands out" : ""}`]); len >= 2 ? good++ : 0; }
        else if ((p - 1) % 4 === 0 && pos.indexOf(p - 1) >= 0 && !L.syl[pos.indexOf(p - 1)][1]) { out.push([t, "bad", `late: “${L.syl[pos.indexOf(p - 1)][0]}” took the strong beat, and this stress comes an eighth after it`]); bad++; }
        else if (cross) { out.push([t, "push", `pushed: it starts on ${beatName(p)} and holds across the beat (a syncopation)`]); good++; }
        else { out.push([t, "bad", `short and off the beat (${beatName(p)}), so it gets lost`]); bad++; }
      } else {
        const nb = [pos[i - 1], pos[i + 1]].filter(x => x != null);
        if (strong && len >= 2 && L.syl.some((s, j) => s[1] && lenOf(pos, j) < len)) { out.push([t, "bad", `a weak syllable on a strong beat (${beatName(p)}), held longer than a stressed one`]); bad++; }
        else if (strong) out.push([t, "ok", `a weak syllable on a strong beat (${beatName(p)}); keep it short and light`]);
      }
    });
    const verdict = bad === 0 ? (out.some(o => o[1] === "push") ? "Natural, with a push: the syncopated stresses give the line forward motion." : "Natural: every stressed syllable gets weight from the beat or from its length.") : bad === 1 ? "One stress is in an awkward place. Listen for the word that sounds wrong." : "Several stresses fight the beat. The words will sound mispronounced when sung.";
    return { out, verdict };
  }
  const prToy = () => {
    const L = LINES[PR.line];
    return `<div class="toy pr-toy" id="prToy">
      <div class="toy-row"><label for="prLine">Line <select id="prLine">${LINES.map((l, i) => `<option value="${i}"${i === PR.line ? " selected" : ""}>${esc(l.text)}</option>`).join("")}</select></label></div>
      <p class="lnote" id="prWords" aria-label="Syllables, stressed ones in capitals">${L.syl.map((s, i) => `<span class="pr-w${s[1] ? " st" : ""}${i === PR.cur && PR.pos.length < L.syl.length ? " next" : ""}">${esc(s[1] ? s[0].toUpperCase() : s[0])}</span>`).join(" ")}</p>
      <p class="lnote" id="prAsk" aria-live="polite">${PR.pos.length < L.syl.length ? `Click the eighth note where <b>“${esc(L.syl[PR.pos.length][0])}”</b> starts.` : PR.sel != null ? `Moving <b>“${esc(L.syl[PR.sel][0])}”</b>: click an empty eighth note between its neighbors, or use the arrow keys.` : "All placed. Drag a syllable to another eighth note to change the rhythm (or click it, then click where it goes), then play it."}</p>
      ${[0, 1].map(b => `<div class="pr-bar" role="group" aria-label="Bar ${b + 1}"><span class="pr-bn" aria-hidden="true">${b + 1}</span>${COUNT.map((c, j) => { const p = b * 8 + j, i = PR.pos.indexOf(p), held = PR.pos.some((q, k) => q < p && (k + 1 < PR.pos.length ? PR.pos[k + 1] : (PR.pos.length === L.syl.length ? SLOTS : q + 1)) > p);
        return `<button type="button" class="pr-slot${j % 4 === 0 ? " strong" : j % 2 === 0 ? " beat" : ""}${i >= 0 ? " on" + (L.syl[i][1] ? " st" : "") + (PR.sel === i ? " sel" : "") : held ? " held" : ""}" data-prs="${p}"${i >= 0 ? ` data-pri="${i}" aria-pressed="${PR.sel === i}"` : ""} aria-label="${beatName(p)}${i >= 0 ? `: ${L.syl[i][0]}${PR.pos.length === L.syl.length ? " (drag, or press arrow keys to move)" : ""}` : held ? ": held" : ""}"><span class="pr-c" aria-hidden="true">${c}</span><span class="pr-s">${i >= 0 ? esc(L.syl[i][1] ? L.syl[i][0].toUpperCase() : L.syl[i][0]) : ""}</span></button>`; }).join("")}</div>`).join("")}
      <div class="pr-staff staff wide" id="prStaff" role="img" aria-label="The setting in notation"></div>
      <div class="toy-row"><button type="button" class="play" data-pr="play"><span aria-hidden="true">▶ </span>Play</button><button type="button" class="btn" data-pr="undo">Undo</button><button type="button" class="btn" data-pr="clear">Clear</button>
        <label for="prBpm">Tempo <input type="range" id="prBpm" min="60" max="132" step="2" value="${PR.bpm}"> <span id="prBpmV">${PR.bpm}</span></label></div>
      <div class="toy-row" role="group" aria-label="Presets">${PRESETS.map(([k, l]) => `<button type="button" class="btn" data-prp="${k}">${l}</button>`).join("")}</div>
      <div id="prOut" aria-live="polite">${PR.pos.length === L.syl.length ? (() => { const J = judge(L, PR.pos); return `<p><b>${J.verdict}</b></p><ul class="pr-list">${J.out.map(([t, c, d]) => `<li class="pr-${c}"><b>${esc(t)}</b>: ${d}</li>`).join("")}</ul>`; })() : ""}</div></div>`;
  };
  const prRedraw = (focusAt) => { const el = document.getElementById("prToy"); if (el) { const f = focusAt != null ? focusAt : document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.prs : null; el.outerHTML = prToy(); if (f != null) { const b = document.querySelector(`[data-prs="${f}"]`); if (b) b.focus(); } prStaff(); } };
  // the setting in notation: each syllable lasts until the next one starts (the last to the end of bar 2); rests fill the gaps.
  // Durations follow the usual 4/4 rules: nothing crosses the middle of the bar unless it starts there, no dotted rests, offbeat notes start with an eighth.
  const NM = m => "C C D D E F F G G A A B".split(" ")[m % 12] + (Math.floor(m / 12) - 1);
  // a note or rest from eighth a to eighth b of a 4/4 bar, as tied pieces in the usual notation:
  // off the beat, one piece if it doesn't cross the middle of the bar (8, quarter or dotted quarter), otherwise an eighth up to the beat;
  // on the beat, the largest value that starts there (no dotted rests; a dotted half, or a half from beat 2 to beat 4, only for notes).
  function chunks(a, b, rest) { const out = [];
    const ok = (a, s) => s === 8 ? a === 0 : s === 6 ? !rest && a === 0 : s === 4 ? a % 4 === 0 || (!rest && a === 2 && b === 6) : s === 3 ? !rest && a % 4 === 0 : true;
    while (a < b) {
      if (a % 2) { const lim = a < 4 ? 4 : 8, len = b - a; if (!rest && b <= lim && len <= 3) { out.push(len); a = b; } else { out.push(1); a += 1; } continue; }
      const sz = [8, 6, 4, 3, 2, 1].find(z => a + z <= b && ok(a, z)); out.push(sz); a += sz; }
    return out; }
  const DUR = { 8: "w", 6: "hd", 4: "h", 3: "qd", 2: "q", 1: "8" };
  function settingSpec(L, pos) {
    const words = L.text.toLowerCase().replace(/[^a-z ]/g, "").split(" "), wordOf = []; let w = 0, acc = "";
    L.syl.forEach((sy, i) => { wordOf[i] = w; acc += sy[0].toLowerCase(); if (acc === words[w]) { w++; acc = ""; } });
    const bars = [[], []], ev = [];   // [start, end, syllable index or -1]
    let t = 0; pos.forEach((p, i) => { if (p > t) ev.push([t, p, -1]); ev.push([p, i + 1 < pos.length ? pos[i + 1] : SLOTS, i]); t = i + 1 < pos.length ? pos[i + 1] : SLOTS; }); if (t < SLOTS) ev.push([t, SLOTS, -1]);
    ev.forEach(([a, b, i]) => { let first = true; for (let bar = Math.floor(a / 8); bar * 8 < b; bar++) { const lo = Math.max(a, bar * 8) - bar * 8, hi = Math.min(b, bar * 8 + 8) - bar * 8; if (hi <= lo) continue;
      const cs = chunks(lo, hi, i < 0); cs.forEach((z, c) => { const last = c === cs.length - 1 && Math.min(b, bar * 8 + 8) === b;
        if (i < 0) bars[bar].push(n(null, DUR[z])); else { const sy = L.syl[i]; bars[bar].push(n(NM(L.mel[i % L.mel.length]), DUR[z], Object.assign(first ? { ly: sy[0] === "I" ? "I" : sy[1] ? sy[0].toUpperCase() : sy[0], hy: i + 1 < L.syl.length && wordOf[i + 1] === wordOf[i] } : {}, last ? {} : { tie: 1 }))); first = false; } }); } });
    return sc("4/4", bars, { bpm: PR.bpm });
  }
  function prStaff() { const el = document.getElementById("prStaff"), L = LINES[PR.line]; if (!el || !window.__harm) return; el.innerHTML = "";
    if (PR.pos.length !== L.syl.length) { el.innerHTML = '<p class="lnote">The notation appears when every syllable is placed.</p>'; return; }
    try { window.__harm.H.drawStaff(el, settingSpec(L, PR.pos)); } catch (e) {} }
  const prMove = (i, at) => { const L = LINES[PR.line], pos = PR.pos, ask = document.getElementById("prAsk");
    if (at < 0 || at >= SLOTS || at === pos[i]) return false;
    const lo = i ? pos[i - 1] : -1, hi = i + 1 < pos.length ? pos[i + 1] : SLOTS;
    if (at <= lo || at >= hi) { if (ask) ask.innerHTML = `Syllables stay in order: “${esc(L.syl[i][0])}” has to go after ${i ? `“${esc(L.syl[i - 1][0])}”` : "the start"} and before ${i + 1 < pos.length ? `“${esc(L.syl[i + 1][0])}”` : "the end"}.`; return false; }
    pos[i] = at; prStop(); prRedraw(at); return true; };

  // sound: kick on 1 and 3, snare on 2 and 4, hi-hat eighths, a soft pad; a sawtooth "voice" through vowel formants, every syllable at the same loudness
  let AC = null, bus = null, NZ = null;
  const VF_ = { ah: [730, 1090, 2440], e: [530, 1840, 2480], i: [300, 2200, 2900], o: [500, 860, 2450], u: [320, 870, 2250], uh: [600, 1170, 2400] };
  function ctx() { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; if (!AC) AC = new C(); if (AC.state === "suspended") AC.resume(); return AC; }
  function noise() { if (NZ) return NZ; NZ = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const d = NZ.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return NZ; }
  function prStop() { if (bus) { const o = bus; o.gain.setTargetAtTime(0, AC.currentTime, .02); setTimeout(() => o.disconnect(), 200); bus = null; } document.querySelectorAll(".pr-w.sing").forEach(e => e.classList.remove("sing")); clearTimeout(prStop.t); (prStop.ts || []).forEach(clearTimeout); prStop.ts = []; }
  function prPlay() {
    if (window.SFX && SFX.muted && SFX.muted()) return; if (!ctx()) return; prStop();
    const L = LINES[PR.line], pos = PR.pos.slice(); if (!pos.length) return;
    bus = AC.createGain(); bus.gain.value = .9; bus.connect(AC.destination);
    const e8 = 30 / PR.bpm, t0 = AC.currentTime + .12, start = t0 + 8 * e8;   // one bar of hi-hat count-in
    const kick = t => { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(45, t + .12); g.gain.setValueAtTime(.7, t); g.gain.exponentialRampToValueAtTime(.001, t + .25); o.connect(g); g.connect(bus); o.start(t); o.stop(t + .3); };
    const hiss = (t, f, lv, dur) => { const s = AC.createBufferSource(), hp = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = noise(); hp.type = "highpass"; hp.frequency.value = f; g.gain.setValueAtTime(lv, t); g.gain.exponentialRampToValueAtTime(.001, t + dur); s.connect(hp); hp.connect(g); g.connect(bus); s.start(t); s.stop(t + dur + .02); };
    const pad = (ms, t, d) => ms.forEach(m => { const o = AC.createOscillator(), g = AC.createGain(), lp = AC.createBiquadFilter(); o.type = "triangle"; o.frequency.value = 440 * Math.pow(2, (m - 69) / 12); lp.type = "lowpass"; lp.frequency.value = 1400; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + .08); g.gain.setValueAtTime(.05, t + d - .15); g.gain.linearRampToValueAtTime(0, t + d); o.connect(lp); lp.connect(g); g.connect(bus); o.start(t); o.stop(t + d + .05); });
    for (let i = 0; i < 24; i++) { const t = t0 + i * e8, inBars = i >= 8; hiss(t, 7000, i % 2 ? .05 : .08, .05); if (inBars && i % 4 === 0) kick(t); if (inBars && i % 4 === 2) hiss(t, 1800, .28, .14); }
    pad([48, 55, 64], start, 8 * e8); pad([45, 52, 60], start + 8 * e8, 8 * e8);
    const sing = (m, t, d, v) => {
      const o = AC.createOscillator(), g = AC.createGain(), mix = AC.createGain(), lf = AC.createOscillator(), lg = AC.createGain(); o.type = "sawtooth"; o.frequency.value = 440 * Math.pow(2, (m - 69) / 12);
      lf.frequency.value = 5.3; lg.gain.value = d > .5 ? 10 : 0; lf.connect(lg); lg.connect(o.detune);
      (VF_[v] || VF_.ah).forEach((f, i) => { const bp = AC.createBiquadFilter(), ga = AC.createGain(); bp.type = "bandpass"; bp.frequency.value = f; bp.Q.value = f / (70 + 40 * i); ga.gain.value = [2.6, 1.6, .7][i]; o.connect(bp); bp.connect(ga); ga.connect(mix); });
      mix.connect(g); g.connect(bus); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.32, t + .04); g.gain.setValueAtTime(.32, t + Math.max(.05, d - .06)); g.gain.linearRampToValueAtTime(0, t + d);
      o.start(t); o.stop(t + d + .02); lf.start(t); lf.stop(t + d + .02);
    };
    const words = [...document.querySelectorAll(".pr-w")];
    prStop.ts = [];
    pos.forEach((p, i) => { const t = start + p * e8, d = Math.min(lenOf(pos, i), 6) * e8 * .94, [txt, , v] = L.syl[i]; if (/^[stkfhcp]/.test(txt)) hiss(t - .02, 3000, .12, .05); sing(L.mel[i % L.mel.length], t, d, v);
      prStop.ts.push(setTimeout(() => { words.forEach(w => w.classList.remove("sing")); if (words[i]) words[i].classList.add("sing"); }, (t - AC.currentTime) * 1000)); });
    prStop.t = setTimeout(() => words.forEach(w => w.classList.remove("sing")), (start + 16 * e8 - AC.currentTime) * 1000);
  }
  if (!window.__prToyWired) { window.__prToyWired = true;
    document.addEventListener("click", e => {
      const s = e.target.closest("[data-prs]"), b = e.target.closest("[data-pr]"), p = e.target.closest("[data-prp]"); if (!s && !b && !p) return;
      const L = LINES[PR.line], ask = () => document.getElementById("prAsk");
      if (s) { const at = +s.dataset.prs, si = s.dataset.pri != null ? +s.dataset.pri : -1;
        if (Date.now() - (PR.dropT || 0) < 350) return;   // the click a drag ends with
        if (si >= 0 && PR.pos.length >= L.syl.length) { PR.sel = PR.sel === si ? null : si; prRedraw(at); return; }
        if (PR.sel != null && si < 0) { const i = PR.sel; if (prMove(i, at)) PR.sel = null, prRedraw(at); return; }
        if (PR.pos.length >= L.syl.length) { if (ask()) ask().textContent = "Every syllable is placed. Drag one to move it, or Clear to start over."; return; }
        if (PR.pos.length && at <= PR.pos[PR.pos.length - 1]) { if (ask()) ask().textContent = "Syllables go in order: pick a later eighth note."; return; }
        if (SLOTS - at < L.syl.length - PR.pos.length) { if (ask()) ask().textContent = "There wouldn't be room for the rest of the line. Pick an earlier eighth note."; return; }
        PR.pos.push(at); prRedraw(); return; }
      if (p) { PR.sel = null; PR.pos = preset(L, p.dataset.prp); prRedraw(); prPlay(); return; }
      if (b.dataset.pr === "play") prPlay(); else if (b.dataset.pr === "undo") { PR.sel = null; PR.pos.pop(); prStop(); prRedraw(); } else if (b.dataset.pr === "clear") { PR.sel = null; PR.pos = []; prStop(); prRedraw(); }
    });
    // drag a placed syllable to another eighth note (pointer events on window, so the drag keeps working off the button)
    let drag = null;
    document.addEventListener("pointerdown", e => { const s = e.target.closest("#prToy [data-pri]"); if (!s || PR.pos.length < LINES[PR.line].syl.length || e.button > 0) return;
      const i = +s.dataset.pri, r = s.getBoundingClientRect(), g = document.createElement("div"); g.className = "pr-ghost"; g.textContent = s.querySelector(".pr-s").textContent; g.setAttribute("aria-hidden", "true");
      drag = { i, x0: e.clientX, y0: e.clientY, g, on: false, dx: e.clientX - r.left, dy: e.clientY - r.top, rects: [...document.querySelectorAll("#prToy [data-prs]")].map(b => [+b.dataset.prs, b.getBoundingClientRect()]) }; });
    window.addEventListener("pointermove", e => { if (!drag) return; if (!drag.on && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
      if (!drag.on) { drag.on = true; document.body.appendChild(drag.g); document.body.classList.add("pr-dragging"); }
      drag.g.style.transform = `translate(${e.clientX - drag.dx}px, ${e.clientY - drag.dy}px)`; e.preventDefault(); }, { passive: false });
    window.addEventListener("pointerup", e => { if (!drag) return; const d = drag; drag = null; d.g.remove(); document.body.classList.remove("pr-dragging"); if (!d.on) return;
      PR.dropT = Date.now(); const hit = d.rects.find(([, r]) => e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom); PR.sel = null; if (hit) prMove(d.i, hit[0]); else prRedraw(); });
    window.addEventListener("pointercancel", () => { if (drag) { drag.g.remove(); document.body.classList.remove("pr-dragging"); drag = null; } });
    document.addEventListener("keydown", e => { const s = e.target.closest && e.target.closest("#prToy [data-pri]"); if (!s || PR.pos.length < LINES[PR.line].syl.length) return;
      const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (!step) return; e.preventDefault(); const i = +s.dataset.pri; prMove(i, PR.pos[i] + step); });
    document.addEventListener("change", e => { if (e.target.id === "prLine") { PR.line = +e.target.value; PR.sel = null; PR.pos = preset(LINES[PR.line], "beat"); prStop(); prRedraw(); } });
    document.addEventListener("input", e => { if (e.target.id === "prBpm") { PR.bpm = +e.target.value; const v = document.getElementById("prBpmV"); if (v) v.textContent = PR.bpm; } });
  }
  PR.pos = preset(LINES[PR.line], "beat");

  // ---------- drill content ----------
  const F = {
    marks: [
      ["A staccato note is played…", "short and detached", ["louder than its neighbors", "held longer than written", "smoothly connected to the next"], "The dot shortens the note, roughly to half its value."],
      ["A tenuto line over a note asks for…", "its full value, often with a slight lean", ["half its value", "a sudden loud attack", "a pause of any length"], "Tenuto means held."],
      ["An accent (>) means…", "a stronger attack than the notes around it", ["a shorter note", "a softer note", "a held note"], "The wedge points to the note that should stand out."],
      ["A fermata tells the performer to…", "hold the note longer than written", ["play it twice", "play it very short", "skip it"], "The conductor or player decides how long."],
      ["Marcato (^) is…", "a heavy, strong attack, a little separated", ["a very soft attack", "a tie", "a slide between notes"], "Stronger than an accent."],
      ["Legato means…", "smooth and connected, with no gaps between notes", ["short and detached", "very loud", "slowing down"], "A slur over a group of notes asks for legato."],
    ],
    dyn: [
      ["Piano (p) means…", "soft", ["loud", "slowly", "smoothly"], "Forte (f) is loud."],
      ["Which is the loudest?", "ff (fortissimo)", ["f (forte)", "mf (mezzo-forte)", "mp (mezzo-piano)"], "Each extra f is a step louder."],
      ["A crescendo means…", "gradually louder", ["gradually softer", "suddenly soft", "gradually faster"], "It's shown with cresc. or a widening wedge."],
      ["A diminuendo (or decrescendo) means…", "gradually softer", ["gradually louder", "suddenly loud", "gradually slower"], "It's shown with dim., decresc. or a narrowing wedge."],
      ["Sforzando (sfz) asks for…", "one note suddenly strong, then back to the level around it", ["the whole passage loud", "a gradual crescendo", "a held note"], "It's a dynamic accent on a single note."],
      ["Forte-piano (fp) means…", "a loud attack, then at once soft", ["loud, then gradually softer", "soft, then suddenly loud", "a moderate level throughout"], "The soft part comes right after the attack."],
      ["Mezzo-forte (mf) is…", "moderately loud", ["very loud", "moderately soft", "very soft"], "Mezzo means moderately."],
      ["The wedge-shaped crescendo and diminuendo signs are called…", "hairpins", ["slurs", "fermatas", "ties"], "Two lines that open out or close in."],
      ["Subito piano means…", "suddenly soft, with no diminuendo", ["gradually soft", "a little louder", "play the passage again"], "Subito: at once."],
    ],
    phrase: [
      ["A slur connects…", "notes of different pitches, to be played smoothly", ["two notes of the same pitch into one sound", "two bars of rest", "the first and last notes of a piece"], "Notes of the same pitch joined by a curve are tied, not slurred."],
      ["A tie connects…", "two notes of the same pitch into one longer sound", ["notes of different pitches", "a phrase to the next phrase", "two chords in a progression"], "The second note isn't played again."],
      ["A phrase mark is…", "a long slur over a whole phrase, showing how the music is grouped", ["a tie over a bar line", "a staccato dot", "a dynamic"], "It shapes the phrase rather than asking for one bow or one breath."],
      ["A breath mark (,) shows…", "where a singer or wind player can breathe", ["where to play louder", "where the piece ends", "a short note"], "Breathing at the end of a phrase keeps the sense of the words."],
      ["In a vocal score, a slur over several notes sung to one syllable shows…", "a melisma", ["a tie", "a rest", "a key change"], "One syllable over many notes."],
      ["Where does a phrase usually feel heaviest?", "at its goal, the strong-beat arrival near the end", ["on the very first note", "on every weak beat", "on the rests"], "Many phrases grow toward a goal and relax after it."],
    ],
    stress: [
      ["In a natural setting, a stressed syllable usually falls on…", "a strong beat or a long note", ["the shortest note", "an offbeat sixteenth", "a rest"], "Stress and the beat agree."],
      ["Holding a stressed syllable longer than the syllables around it gives it…", "an agogic accent: emphasis from length", ["a dynamic accent", "a melisma", "a syncopation"], "Length alone can make a syllable stand out."],
      ["A songwriter sings a stressed syllable an eighth note before the beat and holds it through the beat. That's…", "a syncopation (a pushed or anticipated stress)", ["a misaccent", "a fermata", "a hemiola"], "Very common in pop, R&B and country: it makes the line move forward."],
      ["Putting “the” on beat 1 and the stressed syllable of the next word on a short offbeat note usually sounds…", "awkward: the weak word gets the emphasis", ["natural", "syncopated", "legato"], "The beat gives weight; the wrong word gets it."],
      ["Which helps a stressed syllable stand out?", "a strong beat, a longer note or a higher note", ["a rest after every syllable", "a weak offbeat sixteenth", "a lower, shorter note"], "Any one of these can carry the stress; the strongest settings use two or more."],
      ["Why do singers often sing a consonant slightly before the beat?", "so the vowel, which carries the pitch, lands on the beat", ["to sing louder", "to avoid the melody", "because consonants are long"], "“Stop” on beat 1: the s and t come just ahead, the vowel sits on 1."],
    ],
    shape: [
      ["A phrase often grows toward…", "a goal note, usually its high point or its cadence", ["its first note", "a rest in the middle", "every downbeat equally"], "Then it relaxes."],
      ["Playing every note of a phrase at the same loudness and length usually sounds…", "mechanical", ["legato", "expressive", "syncopated"], "Shape comes from small differences in weight."],
      ["A crescendo (<) means…", "gradually louder", ["gradually softer", "suddenly loud", "gradually slower"], "Its opposite is a decrescendo or diminuendo (>)."],
      ["Where do performers usually take time or breathe?", "between phrases, at the cadences", ["in the middle of a word", "before every beat", "only at the end of the piece"], "Breathing mid-word breaks up the text."],
      ["Two phrases that end with the same word stressed on the same beat sound…", "parallel and balanced", ["unrelated", "out of time", "atonal"], "Matching stress placement is part of what makes a period feel paired."],
    ],
  };
  const DESC = ARTS.map(a => a[1]);
  const GEN = {
    dyn: H => { if (Math.random() < .5) { const [m, it, me] = H.rnd(DYNS); return H.mc(`What does the marking ${m} (${it}) mean?`, me, DYNS.map(d => d[2]).filter(x => x !== me), `${m} = ${it}: ${me}.`, { kicker: "Dynamics" }); }
      const x = H.rnd([[swell, "louder toward the high point, then softer again", "A crescendo hairpin to forte, then a diminuendo back to piano."], [terraced, "soft for two bars, then suddenly loud", "Piano, then forte: a contrast with no gradual change."], [sfz, "moderately soft with one suddenly strong note", "Mezzo-piano, with a sforzando on one note."]]);
      return H.mc("What do the dynamics in this phrase ask for?", x[1], ["louder toward the high point, then softer again", "soft for two bars, then suddenly loud", "moderately soft with one suddenly strong note", "the same level throughout"], x[2], { kicker: "Dynamics", staff: x[0], playQ: H.scorePlay(x[0]) }); },
    marks: H => { const a = H.rnd(ARTS), sp = artFig(a[0]); return H.mc("Which articulation is marked on these notes?", a[1], DESC.concat(["legato (slurred)"]), `${a[1][0].toUpperCase() + a[1].slice(1)}: ${a[2]}; ${a[3]}.`, { kicker: "Articulation", staff: sp, playQ: H.scorePlay(sp) }); },
    stress: H => { const [w, s, nn] = H.rnd(ST); const ord = ["", "1st", "2nd", "3rd", "4th"]; return H.mc(`Which syllable of “${w}” is stressed, and so belongs on a strong beat or a long note?`, `the ${ord[s]} syllable`, [1, 2, 3, 4].slice(0, Math.max(nn, 3)).filter(x => x !== s).map(x => `the ${ord[x]} syllable`), `Say “${w}” aloud: the ${ord[s]} syllable is the stressed one.`, { kicker: "Word stress" }); },
    setting: H => { const x = H.rnd([[good, "natural: the stressed syllables are on strong beats or long notes", "MEM and MOR land on beats; LEFT is held."], [bad, "awkward: weak syllables get the strong beats", "“I” and “the” sit on strong beats while MEM- and MOR- are short."], [pushed, "syncopated: the stresses are pushed ahead of the beat", "MOR-, CAR- and HOME arrive an eighth early and hold through the beat."], [straight, "natural: the stressed syllables are on strong beats or long notes", "MOR-, CAR- and HOME each land on a beat."]]);
      return H.mc("How does this setting place the stressed syllables (in capitals)?", x[1], ["natural: the stressed syllables are on strong beats or long notes", "awkward: weak syllables get the strong beats", "syncopated: the stresses are pushed ahead of the beat"], x[2], { kicker: "Text setting", staff: x[0], playQ: H.withClick(x[0]), order: "keep" }); },
  };
  const ST = [["tomorrow", 2, 3], ["remember", 2, 3], ["morning", 1, 2], ["believe", 2, 2], ["river", 1, 2], ["together", 2, 3], ["yesterday", 1, 3], ["forever", 2, 3], ["afraid", 2, 2], ["window", 1, 2], ["beautiful", 1, 3], ["December", 2, 3], ["melody", 1, 3], ["away", 2, 2], ["carry", 1, 2], ["nobody", 1, 3], ["photograph", 1, 3], ["guitar", 2, 2], ["imagine", 2, 3], ["everybody", 1, 4]];

  const lesson = { steps: [
    { title: "Articulation marks", kick: "How each note starts and ends", render: (H, k, U) => `<p><b>Articulation</b> is how a note begins, how long it lasts and how it ends. The same four notes sound different depending on the marks over them.</p>
      ${tbl("Articulation marks", ["Mark", "What it looks like", "How it sounds"], ARTS.map(([, nm, look, how]) => [nm[0].toUpperCase() + nm.slice(1), look, how]).concat([["Legato (slur)", "a curve over notes of different pitches", "smooth and connected, no gaps"]]))}
      <h3>Hear them</h3>
      ${U.fig(artFig("a."), "Staccato.", { small: true })}${U.fig(artFig("a-"), "Tenuto.", { small: true })}${U.fig(artFig("a>"), "Accents.", { small: true })}${U.fig(legato, "Legato, with slurs.", { small: true })}
      <p>Marks are instructions about weight and length, not exact measurements. A staccato note in a slow ballad is longer than one in a fast march.</p>`
      + H.check("Which mark asks for a short, detached note?", "staccato (a dot)", ["tenuto (a line)", "fermata (an arc over a dot)", "a slur"], "The dot shortens the note.") },
    { title: "Dynamics", kick: "How loud, and how it changes", render: (H, k, U) => `<p><b>Dynamics</b> are markings for loudness. They're written under the staff (above it in vocal music when the words are below) in Italian words or their abbreviations.</p>
      ${tbl("Dynamic markings", ["Marking", "Italian", "Meaning"], DYNS.map(([m, it, me]) => [`<i class="dynm">${m}</i>`, it, me]).concat([["<i class=\"dynm\">cresc.</i> or a widening wedge (&lt;)", "crescendo", "gradually louder"], ["<i class=\"dynm\">dim.</i> or a narrowing wedge (&gt;)", "diminuendo, decrescendo", "gradually softer"], ["<i class=\"dynm\">sfz</i>", "sforzando", "one note suddenly strong, then back to the level around it"], ["<i class=\"dynm\">fp</i>", "forte-piano", "loud attack, then at once soft"], ["<i class=\"dynm\">subito p</i>", "subito piano", "suddenly soft, with no diminuendo"]]))}
      <h3>Hear them</h3>
      ${U.fig(terraced, "Contrast: two bars piano, then two bars forte.", { small: true })}${U.fig(swell, "A swell: a crescendo from piano to forte at the high point, then a diminuendo back to piano. The wedges are called hairpins.", { small: true })}${U.fig(sfz, "Mezzo-piano with one sforzando note.", { small: true })}
      <p>Dynamics are relative. Forte for a solo flute is quieter than forte for a brass section, and a pop singer's “loud” chorus may be closer to the microphone, not louder. What a dynamic marking really asks for is a level compared with what's around it. An accent works the same way: it's stronger than the notes next to it, whatever the dynamic.</p>
      <p>In songs, dynamics usually follow the form: verses lower, the chorus higher, a drop before the last chorus so it can grow again. Inside a phrase, a slight crescendo toward the goal and a diminuendo after it shape the line, and the word at the goal gets the most weight.</p>`
      + H.check("Which marking is the softer of these two: mp or mf?", "mp (mezzo-piano)", ["mf (mezzo-forte)", "they're the same level", "it depends on the tempo"], "Piano is soft; forte is loud; mezzo means moderately.")
      + H.check("A widening wedge (<) under a group of notes asks for…", "a gradual crescendo", ["a sudden accent", "a slower tempo", "a shorter note"], "It opens out as the sound grows.") },
    { title: "Slurs, ties and phrase marks", kick: "Curves that look alike", render: (H, k, U) => `<p>Three curved lines do three different jobs.</p>
      <ul><li>A <b>tie</b> joins two notes of the <i>same</i> pitch into one longer sound. The second note isn't played again.</li>
      <li>A <b>slur</b> joins notes of <i>different</i> pitches: play them smoothly. For strings it often means one bow; for winds, one breath and no tonguing; for singers, one syllable (a <b>melisma</b>).</li>
      <li>A <b>phrase mark</b> is a long slur over a whole phrase. It shows grouping and shape, the way a sentence groups words.</li></ul>
      <p>A <b>breath mark</b> (a comma above the staff) shows where to breathe. Singers breathe between phrases or between words, never in the middle of a word.</p>
      ${U.fig(melis, "A melisma: one syllable (LIGHT) slurred across four notes.", {})}`
      + H.check("Two notes of the same pitch joined by a curve are…", "tied: one longer sound", ["slurred: played smoothly", "a melisma", "a phrase mark"], "Same pitch: tie.") },
    { title: "Shaping a phrase", kick: "Where the weight goes", render: (H) => `<p>A phrase is a musical sentence. Played with every note the same, it sounds mechanical. Performers give it shape by leaning toward a <b>goal</b>, usually the high point or the cadence, and relaxing after it.</p>
      <ul><li><b>Weight</b>: notes on strong beats and long notes get a little more; pickups and passing notes get less.</li>
      <li><b>Dynamics</b>: a slight crescendo toward the goal, a diminuendo after it.</li>
      <li><b>Time</b>: a little extra space at the goal, or a breath before the next phrase.</li>
      <li><b>Articulation</b>: legato inside the phrase, a clear release at the end.</li></ul>
      <p>Songwriters build the same shape into the words. The most important word of a line usually sits at the melody's goal: on a strong beat, on a long note, often on the highest note.</p>`
      + H.check("Where does a phrase usually carry the most weight?", "at its goal, near the end", ["on the first note", "equally on every note", "on the rests"], "It grows toward the goal, then relaxes.") },
    { title: "Word stress and the beat", kick: "to-MOR-row, not TO-mor-row", render: (H, k, U) => `<p>Every word of more than one syllable has a stressed syllable: re-<b>MEM</b>-ber, <b>MOR</b>-ning. In a sentence some whole words are stressed and others (the, a, to, we) are light. A natural setting puts the stressed syllables where the music has weight.</p>
      <p>The strongest beats in 4/4 are 1 and 3, then 2 and 4, then the offbeats (the “ands”). In the first setting the stressed syllables land on beats. In the second, “I” and “the” get the strong beats while MEM- and MOR- are squeezed onto short notes, and the line sounds mispronounced.</p>
      ${U.fig(good, "Natural: re-MEM-ber and MOR-ning stressed on the beat, LEFT held to the end.", { play: H.withClick(good) })}
      ${U.fig(bad, "Awkward: the weak syllables are on the strong beats.", { play: H.withClick(bad) })}`
      + H.check("Which word should get the strong beat in “the MOR-ning”?", "the stressed syllable MOR-", ["“the”", "-ning", "none of them"], "Weak words like “the” go before the beat.") },
    { title: "Long notes on stressed syllables", kick: "Emphasis from length", render: (H, k, U) => `<p>A note can stand out because it's long. Music theorists call this an <b>agogic accent</b>. Songwriters use it all the time: the stressed syllable gets the long note, and the light syllables move quickly around it.</p>
      ${U.fig(longs, "HOLD and LIGHT get the long notes; “on to the” moves in eighths.", { play: H.withClick(longs) })}
      <p>A long note can also become a <b>melisma</b>, one syllable sung across several pitches. Melismas almost always go on stressed syllables and open vowels (ah, oh), which are easy to sustain.</p>
      ${U.fig(melis, "The same line with a melisma on LIGHT.", { play: H.withClick(melis) })}`
      + H.check("Holding a stressed syllable longer than the syllables around it is…", "an agogic accent", ["a staccato", "a hemiola", "a misaccent"], "Emphasis from length.") },
    { title: "Stresses that push: syncopation", kick: "Ahead of the beat", render: (H, k, U) => `<p>In much popular music the stressed syllable arrives <i>just before</i> the beat and holds through it. The stress is still strong, because the note is long, but it lands early, so the line pushes forward. That's a syncopation in the vocal line, sometimes called an anticipation or a push.</p>
      ${U.fig(straight, "Straight: MOR-, CAR- and HOME each land on a beat.", { play: H.withClick(straight) })}
      ${U.fig(pushed, "Pushed: the same stresses come an eighth note early and are held across the beat.", { play: H.withClick(pushed) })}
      <p>A push works when the stressed syllable is held across the beat. A stressed syllable on a short offbeat note, with a weak syllable on the next beat, sounds like a mistake instead. Conversational styles (R&B, rap, country storytelling) use pushes and speech rhythms constantly; hymns and marches mostly keep stresses on the beat.</p>`
      + H.check("What makes a pushed stress sound natural rather than wrong?", "it's held across the beat", ["it's very short", "it's on a rest", "it's in a different key"], "Early, but long.") },
    { title: "Try it: place the syllables", kick: "Hear the difference", render: () => `<p>Choose a line, then click the eighth note where each syllable starts, in order. Each syllable lasts until the next one starts. Stressed syllables are in capitals. Play it with the drums (kick on 1 and 3, snare on 2 and 4) and read what each stress lands on. Every syllable is sung at the same loudness, so only its placement can give it weight.</p>
      ${prToy()}
      <p class="lnote">The presets show five ways to set the same words. Try “Weak syllables on the strong beats” and then fix it one syllable at a time.</p>` },
    { title: "Articulation in singing", kick: "Consonants, vowels and releases", render: (H) => `<ul><li><b>Vowels carry the pitch.</b> Singers place the vowel on the beat and put the consonant just before it: in “stop” on beat 1, the s and t come early.</li>
      <li><b>Final consonants</b> mark where a note ends. A clean t or d at the release is the singer's version of a staccato or a cutoff.</li>
      <li><b>Diphthongs</b> (two vowels in one syllable, like the “ai” in “light”) are sung on the first vowel, with the second added at the very end.</li>
      <li><b>Legato singing</b> connects vowel to vowel; consonants are quick so the line doesn't break.</li>
      <li><b>Speech-like delivery</b> (rap, patter songs, recitative) uses many syllables per beat and lets word stress set the rhythm.</li></ul>`
      + H.check("Why do singers put the consonant slightly before the beat?", "so the vowel lands on the beat", ["to sing louder", "to make the note shorter", "to change key"], "The vowel holds the pitch.") },
    { title: "Quick check", kick: "Before the drills", render: H => Object.keys(F).map(m => { const [q, a, w, y] = F[m][0]; return H.check(q, a, w, y); }).join("") },
  ] };
  const ALL = Object.values(F).flat();
  function make(mode, H) {
    if (mode === "marks" && Math.random() < .55) return GEN.marks(H);
    if (mode === "dyn" && Math.random() < .5) return GEN.dyn(H);
    if (mode === "stress") { const r = Math.random(); if (r < .35) return GEN.stress(H); if (r < .7) return GEN.setting(H); }
    const [q, a, w, y] = H.rnd(F[mode] || ALL); return H.mc(q, a, w, y);
  }
  const reference = () => `<ul><li><b>Articulation</b>: staccato (short), tenuto (full, leaned), accent (stronger attack), marcato (heavy), fermata (held), legato (connected).</li><li><b>Dynamics</b>: pp, p, mp, mf, f, ff (very soft to very loud); crescendo (&lt;) louder, diminuendo (&gt;) softer; sfz one strong note; fp loud then soft.</li><li><b>Curves</b>: tie (same pitch), slur (different pitches; a melisma in a vocal line), phrase mark (grouping).</li><li><b>Text setting</b>: stressed syllables on strong beats, long notes or high notes; a push (syncopation) lands early and holds across the beat.</li></ul>`;
  return { key: "silverapps-artic-v1", lesson, make, reference, modes: [{ id: "marks", kicker: "Articulation marks" }, { id: "dyn", kicker: "Dynamics" }, { id: "phrase", kicker: "Slurs, ties and phrases" }, { id: "stress", kicker: "Word stress and setting" }, { id: "shape", kicker: "Shaping a phrase" }], topics: [] };
})();

window.FAM.quiz = [
  {"s": 1, "q": "A dot over or under a notehead asks for…", "a": "a short, detached note", "w": ["a held note", "a louder attack", "a smooth connection to the next note"], "hint": "Staccato.", "why": "Staccato shortens the note, roughly to half its value."},
  {"s": 1, "q": "A short horizontal line over a note asks for…", "a": "its full value, often with a slight lean", "w": ["half its value", "a sudden loud attack", "a pause"], "hint": "Tenuto.", "why": "Tenuto: held for its full length."},
  {"s": 1, "q": "Which mark asks for a stronger attack than the surrounding notes?", "a": ">", "w": ["a dot", "a short line", "an arc over a dot"], "hint": "A sideways wedge.", "why": "The accent mark points at the note that should stand out."},
  {"s": 1, "q": "A fermata tells the performer to…", "a": "hold the note longer than written", "w": ["play it very short", "play it twice", "skip it"], "hint": "An arc over a dot.", "why": "How long is up to the performer or conductor."},
  {"s": 1, "q": "Marcato (^) compared with an ordinary accent is…", "a": "heavier and a little separated", "w": ["softer", "smoother", "exactly the same"], "hint": "An upright wedge.", "why": "Marcato is the strongest of the attack marks."},
  {"s": 2, "q": "Which dynamic marking means moderately soft?", "a": "mp", "w": ["mf", "pp", "ff"], "hint": "Mezzo means moderately; piano means soft.", "why": "mp is mezzo-piano: moderately soft. mf is mezzo-forte: moderately loud."},
  {"s": 2, "q": "A narrowing wedge (>) under several notes asks for…", "a": "a gradual diminuendo", "w": ["an accent on each note", "a gradual crescendo", "a pause"], "hint": "The wedge closes in.", "why": "A hairpin that closes is a diminuendo (decrescendo): gradually softer."},
  {"s": 2, "q": "Sforzando (sfz) on one note means…", "a": "that note suddenly strong, then back to the level around it", "w": ["the rest of the passage loud", "a gradual crescendo", "hold the note"], "hint": "One note only.", "why": "It's a dynamic accent on a single note."},
  {"s": 3, "q": "A curve joining two notes of the same pitch is…", "a": "a tie", "w": ["a slur", "a phrase mark", "a melisma"], "hint": "Same pitch.", "why": "The second note isn't played again; the two make one longer sound."},
  {"s": 3, "q": "A curve over several notes of different pitches asks for…", "a": "legato: smooth and connected", "w": ["one long held pitch", "short, detached notes", "a pause"], "hint": "A slur.", "why": "For singers it usually means one syllable over all the notes."},
  {"s": 3, "q": "One syllable sung across several notes is called…", "a": "a melisma", "w": ["syllabic setting", "a tie", "a fermata"], "hint": "The opposite of one note per syllable.", "why": "Melismas usually fall on stressed syllables and open vowels."},
  {"s": 3, "q": "A breath mark (,) above the staff shows…", "a": "where a singer or wind player can breathe", "w": ["where to get louder", "where the piece ends", "a short note"], "hint": "It looks like a comma.", "why": "Breaths belong between phrases or words, not inside a word."},
  {"s": 4, "q": "Where does a phrase usually carry the most weight?", "a": "at its goal, near the end", "w": ["on its first note", "equally on every note", "on the rests"], "hint": "It grows toward something.", "why": "Phrases lean toward a goal, usually the high point or the cadence, and relax after it."},
  {"s": 4, "q": "Playing every note of a phrase at the same weight and length usually sounds…", "a": "mechanical", "w": ["expressive", "syncopated", "legato"], "hint": "No shape.", "why": "Shape comes from small differences in weight, dynamics and time."},
  {"s": 4, "q": "Where do performers usually breathe or take a little time?", "a": "between phrases", "w": ["in the middle of a word", "before every beat", "only at the end of the piece"], "hint": "Think of a sentence.", "why": "Breathing at phrase ends keeps the words and the musical sentence together."},
  {"s": 5, "q": "In a natural setting, the stressed syllable of a word usually falls on…", "a": "a strong beat or a long note", "w": ["the shortest note in the bar", "an offbeat sixteenth", "a rest"], "hint": "Stress and the beat agree.", "why": "The beat gives weight; the stressed syllable should get it."},
  {"s": 5, "q": "In 4/4, which beats are strongest?", "a": "1 and 3", "w": ["2 and 4", "the offbeats", "all four equally"], "hint": "Then 2 and 4, then the “ands.”", "why": "Beat 1 is strongest, beat 3 next; 2 and 4 are weaker, and offbeats weaker still."},
  {"s": 5, "q": "Putting “the” on beat 1 and the stressed syllable of the next word on a short offbeat usually sounds…", "a": "awkward: the light word gets the emphasis", "w": ["natural", "syncopated", "legato"], "hint": "Which word deserves the weight?", "why": "Light words like “the” belong before the beat."},
  {"s": 5, "q": "Which syllable of “tomorrow” is stressed?", "a": "the 2nd", "w": ["the 1st", "the 3rd", "none"], "hint": "Say it aloud.", "why": "to-MOR-row."},
  {"s": 6, "q": "Emphasis that comes from a note's length is called…", "a": "an agogic accent", "w": ["a dynamic accent", "a staccato", "a hemiola"], "hint": "Long notes stand out.", "why": "A long note draws attention even without extra volume."},
  {"s": 6, "q": "Melismas most often go on…", "a": "stressed syllables with open vowels", "w": ["unstressed syllables like “the”", "consonants", "rests"], "hint": "Easy to sustain.", "why": "Open vowels (ah, oh) carry long notes well, and the stress deserves the time."},
  {"s": 7, "q": "A stressed syllable sung an eighth note before the beat and held through it is…", "a": "a syncopation (a push)", "w": ["a misaccent", "a fermata", "a tie between phrases"], "hint": "Early, but long.", "why": "The early arrival gives the line forward motion; holding it keeps the stress."},
  {"s": 7, "q": "What makes a pushed stress sound natural rather than wrong?", "a": "it's held across the beat", "w": ["it's very short", "it's followed by a rest on the beat", "it's sung softer"], "hint": "Length.", "why": "A stressed syllable on a short offbeat note, with a weak syllable on the next beat, sounds misplaced."},
  {"s": 7, "q": "Which styles use pushed, speech-like stresses most often?", "a": "conversational styles such as R&B, rap and country storytelling", "w": ["marches", "hymns", "Gregorian chant"], "hint": "Close to how people talk.", "why": "Hymns and marches mostly keep stresses on the beat."},
  {"s": 8, "q": "A line is set so every stressed syllable falls on a short offbeat note. How does it sound?", "a": "the words sound mispronounced", "w": ["natural", "pushed and lively", "legato"], "hint": "Short and off the beat.", "why": "Stresses need either a beat or length; with neither, they get lost."},
  {"s": 9, "q": "Why do singers put a word's first consonant slightly before the beat?", "a": "so the vowel lands on the beat", "w": ["to make the note shorter", "to sing louder", "to change the key"], "hint": "Which part carries the pitch?", "why": "The vowel holds the pitch, so it belongs on the beat."},
  {"s": 9, "q": "A diphthong such as the vowel in “light” is usually sung…", "a": "on its first vowel, with the second added at the very end", "w": ["on its second vowel throughout", "as two separate notes always", "without any vowel"], "hint": "ah… then a quick ee.", "why": "Holding the first vowel keeps the tone open."}
];
