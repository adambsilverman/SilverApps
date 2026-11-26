
window.FAM = (() => {
  // ===== Harmonization (Creating Music): writing a melody over chords, choosing chords for a melody, non-chord tones and the
  // "no more than two in a row" guideline, triads and seventh chords, diatonic and chromatic options, and the melodic/harmonic
  // divorce (Temperley 2007; Nobile 2015). The lab lets students try all of it. Every example is original or public domain. =====
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const tbl = (cap, head, rows) => `<div class="ltable-wrap" tabindex="0" role="region" aria-label="${cap}"><table class="ltable"><caption>${cap}</caption><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => i ? `<td>${c}</td>` : `<th scope="row">${c}</th>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  const sc = (bars, o = {}) => Object.assign({ type: "score", clefs: ["treble"], time: "4/4", vf: "C", sig: {}, bpm: 92, minBar: 170, tagSide: true, bars: bars.map(b => ({ t: [b] })) }, o);
  const n = (k, d, x = {}) => Object.assign({ k: k ? [k] : [], d }, x);
  const HC = () => window.__harm && window.__harm.H;
  const mod = (a, m) => ((a % m) + m) % m;
  const MAJ = [0, 2, 4, 5, 7, 9, 11];
  const NCTC = "#b3471b", RUNC = "#b3121f";   // colors: a non-chord tone, and one in a run of three or more

  // ---------- keys and chords ----------
  const HKEYS = ["C", "G", "F", "D", "B♭"];
  function hkey(H, name) { const k = H.key(name, "major"); let t = H.N(k.tonic.l, k.tonic.a, 4); if (H.midi(t) > 67) t = H.N(k.tonic.l, k.tonic.a, 3); k.T0 = t; return k; }
  const noteOf = (H, k, d, a) => H.up(k.T0, d, MAJ[mod(d, 7)] + 12 * Math.floor(d / 7) + a);   // scale step d from the tonic (may be negative or above 7), altered by a half steps
  // [id, Roman numeral, family, root scale step, root alteration, quality]
  const CH = [
    ["I", "I", "dt", 0, 0, "M"], ["ii", "ii", "dt", 1, 0, "m"], ["iii", "iii", "dt", 2, 0, "m"], ["IV", "IV", "dt", 3, 0, "M"], ["V", "V", "dt", 4, 0, "M"], ["vi", "vi", "dt", 5, 0, "m"], ["viio", "vii°", "dt", 6, 0, "d"],
    ["IM7", "IM7", "d7", 0, 0, "M7"], ["ii7", "ii7", "d7", 1, 0, "m7"], ["iii7", "iii7", "d7", 2, 0, "m7"], ["IVM7", "IVM7", "d7", 3, 0, "M7"], ["V7", "V7", "d7", 4, 0, "7"], ["vi7", "vi7", "d7", 5, 0, "m7"], ["viih7", "viiø7", "d7", 6, 0, "h7"],
    ["Vii", "V/ii", "sd", 5, 0, "M"], ["Viii", "V/iii", "sd", 6, 0, "M"], ["VV", "V/V", "sd", 1, 0, "M"], ["Vvi", "V/vi", "sd", 2, 0, "M"],
    ["V7ii", "V7/ii", "sd", 5, 0, "7"], ["V7iii", "V7/iii", "sd", 6, 0, "7"], ["V7IV", "V7/IV", "sd", 0, 0, "7"], ["V7V", "V7/V", "sd", 1, 0, "7"], ["V7vi", "V7/vi", "sd", 2, 0, "7"],
    ["i", "i", "bm", 0, 0, "m"], ["iio", "ii°", "bm", 1, 0, "d"], ["iih7", "iiø7", "bm", 1, 0, "h7"], ["iv", "iv", "bm", 3, 0, "m"], ["bIII", "♭III", "bm", 2, -1, "M"], ["bVI", "♭VI", "bm", 5, -1, "M"], ["bVII", "♭VII", "bm", 6, -1, "M"],
    ["N", "♭II", "oc", 1, -1, "M"], ["viio7", "vii°7", "oc", 6, 0, "o7"], ["Vaug", "V+", "oc", 4, 0, "A"],
  ];
  const CATS = [["dt", "Diatonic triads"], ["d7", "Diatonic seventh chords"], ["sd", "Secondary dominants"], ["bm", "Borrowed from the minor key"], ["oc", "Other chromatic chords"]];
  function chordOf(H, k, id) {
    const c = CH.find(x => x[0] === id); if (!c) return null;
    const root = H.up(k.T0, c[3], MAJ[c[3]] + c[4]), ch = H.chord(root, c[5]);
    return { id, rn: c[1], cat: c[2], q: c[5], sym: ch.sym, tones: ch.tones, pcs: ch.tones.map(H.pc), chrom: c[2] !== "dt" && c[2] !== "d7", seventh: ch.tones.length === 4 };
  }
  const ROLE = ["root", "3rd", "5th", "7th"];

  // ---------- the lab's state: 4 bars of 4/4 in eighth notes; a chord can change on beats 1 and 3 ----------
  // mel[slot]: [step, alteration] starts a note; "r" starts a rest; null continues whatever came before. chords[half bar]: an id, or null = keep the last one
  const HL = { key: "C", bpm: 84, mel: Array(32).fill(null), chords: Array(8).fill(null), div: false, chrom: false, tint: true, acc: "pulse", loop: false, on: false, t0: 0, raf: 0, timer: 0, sug: null, preset: "" };
  const P = (H, s) => { const m = [], o = Array(32).fill(null); s.split(" ").forEach(t => m.push(t)); let i = 0;   // "d,a/len" tokens, e.g. "2/2" (step 2 for a quarter), "r/2", "3,1/1"
    m.forEach(t => { const [v, len] = t.split("/"); o[i] = v === "r" ? "r" : v.split(",").map(Number).concat([0]).slice(0, 2); i += +len; }); return o; };
  const PRESETS = {
    over: { name: "Write a melody over I–vi–IV–V", key: "C", mel: "r/32", chords: ["I", null, "vi", null, "IV", null, "V", null] },
    under: { name: "Harmonize Beethoven's Ode to Joy", key: "C", mel: "2/2 2/2 3/2 4/2 4/2 3/2 2/2 1/2 0/2 0/2 1/2 2/2 2/3 1/1 1/4", chords: Array(8).fill(null) },
    sevenths: { name: "Seventh chords: ii7–V7–IM7–I", key: "C", mel: "3/2 5/2 7/4 6/4 8/2 10/2 9/4 6/4 7/8", chords: ["ii7", null, "V7", null, "IM7", null, "I", null] },
    chrom: { name: "Chromatic: a secondary dominant and a borrowed iv", key: "C", mel: "2/2 4/2 7/4 7,1/4 5/4 5/4 5,-1/4 4/4 7/4", chords: ["I", null, "V7ii", null, "IV", "iv", "V7", "I"] },
    divorce: { name: "Melodic/harmonic divorce: a pentatonic loop over I–♭VII–IV–I", key: "C", mel: "4/2 2/2 1/2 0/2 4/2 2/2 1/2 0/2 4/2 2/2 1/2 0/2 4/2 2/2 0/4", chords: ["I", null, "bVII", null, "IV", null, "I", null], div: true },
  };
  function loadPreset(H, id) {
    const p = PRESETS[id]; if (!p) return; HL.preset = id; HL.key = p.key; HL.mel = P(H, p.mel); HL.chords = p.chords.slice(); HL.div = !!p.div; HL.sug = null;
    if (/,[-1]/.test(p.mel)) HL.chrom = true;
  }

  // ---------- analysis ----------
  function eff(H, k) { const out = []; let cur = null; for (let h = 0; h < 8; h++) { if (HL.chords[h]) cur = chordOf(H, k, HL.chords[h]); out.push(cur); } return out; }
  function events(H, k) {
    const E = []; let cur = null;
    for (let s = 0; s < 32; s++) { const v = HL.mel[s]; if (v === "r") { cur = null; continue; } if (v) { const nt = noteOf(H, k, v[0], v[1]); cur = { s, len: 1, d: v[0], a: v[1], m: H.midi(nt), nt }; E.push(cur); } else if (cur) cur.len++; }
    return E;
  }
  // a note spelled the way the chord spells it (G♯ over E7, not A♭)
  function spell(H, c, e) { if (c) { const t = c.tones.find(x => H.pc(x) === mod(e.m, 12)); if (t) for (let o = 1; o < 8; o++) { const x = H.N(t.l, t.a, o); if (H.midi(x) === e.m) return x; } } return e.nt; }
  const isStep = (a, b) => { const d = Math.abs(a - b); return d >= 1 && d <= 2; };
  function analyse(H, k) {
    const C = eff(H, k), E = events(H, k), S = [];
    E.forEach(e => { let s = e.s; const end = e.s + e.len; while (s < end) { const stop = Math.min(end, (Math.floor(s / 4) + 1) * 4); S.push({ e, s, len: stop - s, held: s !== e.s, h: Math.floor(s / 4), m: e.m }); s = stop; } });
    S.forEach((g, i) => {
      g.c = C[g.h]; g.ct = !!g.c && g.c.pcs.includes(mod(g.m, 12)); g.role = g.ct ? ROLE[g.c.pcs.indexOf(mod(g.m, 12))] : null;
      const prev = i && S[i - 1].s + S[i - 1].len === g.s ? S[i - 1] : null, next = S[i + 1] && g.s + g.len === S[i + 1].s ? S[i + 1] : null;
      g.prev = prev; g.next = next; if (g.ct || !g.c) return;
      const pIn = prev && prev.e !== g.e ? prev : null;   // a held-over note is "prepared" by itself
      if (g.held || (pIn && pIn.m === g.m && pIn.c !== g.c)) { g.type = next && isStep(g.m, next.m) ? (next.m < g.m ? "SUS" : "RET") : "FREE"; return; }
      const inS = pIn && isStep(pIn.m, g.m), outS = next && isStep(g.m, next.m), dIn = pIn ? Math.sign(g.m - pIn.m) : 0, dOut = next ? Math.sign(next.m - g.m) : 0;
      if (next && next.m === g.m && next.c !== g.c && next.c && next.c.pcs.includes(mod(g.m, 12))) g.type = "ANT";
      else if (inS && outS) g.type = dIn === dOut ? "PT" : "NT";
      else if (outS) g.type = "APP";
      else if (inS && next) g.type = "ET";
      else g.type = "FREE";
    });
    // runs: three or more non-chord tones in a row (a rest or a chord tone ends a run; a held note counts once)
    const runs = []; let run = [];
    const flush = () => { const notes = [...new Set(run.map(g => g.e))]; if (notes.length >= 3) runs.push(run.slice()); run = []; };
    S.forEach(g => { if (!g.c) { flush(); return; } if (!g.ct && (!run.length || run[run.length - 1].s + run[run.length - 1].len === g.s)) run.push(g); else { flush(); if (!g.ct) run.push(g); } });
    flush(); runs.forEach(r => r.forEach(g => g.run = true));
    // how closely the melody follows the chords: chord-tone share of the melody's time, weighted toward strong beats
    let tot = 0, ctw = 0; S.forEach(g => { if (!g.c) return; const w = g.len * (g.s % 4 === 0 ? 2 : g.s % 2 === 0 ? 1.5 : 1); tot += w; if (g.ct) ctw += w; });
    const fit = tot ? ctw / tot : 1, free = S.filter(g => g.type === "FREE").length;
    const clash = S.filter(g => !g.ct && g.c && g.len >= 2 && g.s % 2 === 0 && g.c.pcs.some(p => mod(g.m - p, 12) === 1));
    return { C, E, S, runs, fit, free, clash };
  }
  const where = s => `bar ${Math.floor(s / 8) + 1}, ${s % 2 ? `the “and” of beat ${Math.floor((s % 8) / 2) + 1}` : `beat ${(s % 8) / 2 + 1}`}`;
  const TYPE = { PT: "passing tone", NT: "neighbor tone", APP: "appoggiatura", ET: "escape tone", SUS: "suspension", RET: "retardation", ANT: "anticipation", FREE: "free (unresolved) tone" };
  function feedback(H, k, A) {
    const out = [], nm = g => H.nm(spell(H, g.c, g.e));
    if (!A.E.length) out.push(["info", "Add melody notes in the grids: click a square to start a note there. It lasts until the next note or rest."]);
    if (!A.C.some(Boolean)) out.push(["info", "Choose chords above the grids, or press Suggest chords."]);
    const noChord = A.S.filter(g => !g.c); if (noChord.length && A.C.some(Boolean)) out.push(["info", `The melody starts before the first chord (${where(noChord[0].s)}).`]);
    A.runs.forEach(r => { const ns = [...new Set(r.map(g => g.e))], parts = [];
      r.forEach(g => { const last = parts[parts.length - 1], x = nm(g); if (last && last.c === g.c) { if (!last.ns.includes(x) || last.e !== g.e) last.ns.push(x); last.e = g.e; } else parts.push({ c: g.c, ns: [x], e: g.e }); });
      out.push([HL.div ? "info" : "warn", `${where(r[0].s)}: ${ns.length} non-chord tones in a row (${parts.map(p => `${p.ns.join(", ")} over ${p.c.sym}`).join(", then ")}).${HL.div ? " You're going for that effect: in divorce mode, the melody doesn't have to follow the chords." : " Unless you want that effect, make one of them a chord tone, or change the chord so it contains them."}`]); });
    A.clash.forEach(g => out.push(["warn", `${where(g.s)}: ${nm(g)} sits a half step above the chord's ${H.nm(g.c.tones[g.c.pcs.findIndex(p => mod(g.m - p, 12) === 1)])} on a strong beat. That minor 9th grates; it works best short, or moving on by step.`]));
    const free = A.S.filter(g => g.type === "FREE");
    if (free.length) out.push([HL.div ? "info" : "warn", `${free.length} non-chord tone${free.length > 1 ? "s" : ""} ${free.length > 1 ? "don't" : "doesn't"} move on by step (first: ${nm(free[0])} over ${free[0].c.sym}, ${where(free[0].s)}). ${HL.div ? "Unresolved tones like these are the clearest sign of a melodic/harmonic divorce." : "Out of the divorce style, a tone that leaps away can sound like a wrong note."}`]);
    const last = A.C[7], pen = A.C[6] || A.C[5];
    if (A.C.some(Boolean) && last && !/^(I|IM7)$/.test(last.id)) out.push(["info", `The last chord is ${last.rn}, not I: the phrase ends open (fine for a first phrase, or on purpose).`]);
    else if (last && pen && !/^(V|V7|viio|viih7|viio7|IV|iv)$/.test(pen.id)) out.push(["info", `To make the ending sound final, try V or V7 (or IV) just before the last I.`]);
    const lastE = A.E[A.E.length - 1]; if (lastE && last && /^(I|IM7)$/.test(last.id) && mod(lastE.m - H.midi(k.T0), 12) !== 0 && lastE.s + lastE.len >= 28) out.push(["info", "The melody ends on a note other than the tonic. Ending on the tonic (or the 3rd) sounds most final."]);
    if (!out.some(x => x[0] === "warn") && A.E.length && A.C.some(Boolean)) out.push(["ok", HL.div ? "The melody and the chords each follow their own logic. Listen for whether it sounds intentional." : "No problems found: strong beats mostly on chord tones, non-chord tones moving by step."]);
    return out;
  }

  // ---------- chord suggestions for each half bar: chord tones on strong beats and long notes score highest ----------
  function suggest(H, k) {
    const A = analyse(H, k), out = [];
    for (let h = 0; h < 8; h++) {
      const segs = A.S.filter(g => g.h === h);
      if (!segs.length) { out.push([]); continue; }
      const rank = CH.map(c => { const ch = chordOf(H, k, c[0]); let s = 0;
        segs.forEach(g => { const w = g.len * (g.s % 4 === 0 ? 2 : g.s % 2 === 0 ? 1.3 : .8); s += ch.pcs.includes(mod(g.m, 12)) ? w : -.75 * w; });
        if (ch.chrom) s -= 1.2; if (ch.seventh) s -= .3; if (/^(iii|iii7|viio|viih7)$/.test(ch.id)) s -= .8; if (h === 7 && /^(V|V7)$/.test(ch.id)) s += 1; if (h === 7 && ch.id === "I") s += 2.5; if (h === 6 && /^(V|V7)$/.test(ch.id)) s += 1; if (h === 0 && ch.id === "I") s += 1.5;
        return { ch, s }; }).sort((a, b) => b.s - a.s);
      const best = rank.filter(x => !x.ch.chrom).slice(0, 3), col = rank.find(x => x.ch.chrom && x.s > rank[0].s - 4);
      out.push(best.concat(col ? [col] : []).map(x => x.ch));
    }
    return out;
  }

  // ---------- notation ----------
  function spec(H, k, A) {
    const bars = [];
    for (let b = 0; b < 4; b++) {
      const bar = [], put = (x, s) => { if (s % 4 === 0) { const h = s / 4, c = A.C[h]; if (c && (HL.chords[h] || h === 0)) { x.sym = c.sym; x.lab = c.rn; } } bar.push(x); };
      for (let h = b * 2; h < b * 2 + 2; h++) {
        let s = h * 4; const segs = A.S.filter(g => g.h === h);
        const rest = (from, to) => { let x = from; while (x < to) { const left = to - x; if (left === 4 && x % 4 === 0) { put(n(null, "h"), x); x += 4; } else if (x % 2 === 0 && left >= 2) { put(n(null, "q"), x); x += 2; } else { put(n(null, "8"), x); x += 1; } } };
        segs.forEach(g => { if (g.s > s) rest(s, g.s);
          const d = { 1: "8", 2: "q", 3: "qd", 4: "h" }[g.len], nt = spell(H, g.c, g.e), x = n(H.nmO(nt), d);
          if (!g.ct && g.c) { x.tag = g.type; x.color = g.run ? RUNC : NCTC; }
          if (g.next && g.next.e === g.e) x.tie = true;
          put(x, g.s); s = g.s + g.len; });
        if (s < h * 4 + 4) rest(s, h * 4 + 4);
      }
      bars.push(bar);
    }
    return sc(bars, { vf: k.vf, sig: k.sig, bpm: HL.bpm, minBar: 190 });
  }

  // ---------- playback: piano chords (block, pulse or broken) under a clarinet-like melody ----------
  function voicing(H, c) {
    const bass = H.pc(c.tones[0]); let b = 36 + bass; while (b < 40) b += 12; while (b > 51) b -= 12;
    const up = c.tones.slice(1).concat(c.tones.length === 3 ? [c.tones[0]] : []).map(t => { let m = 48 + H.pc(t); while (m < 53) m += 12; while (m > 64) m -= 12; return m; }).sort((x, y) => x - y);
    return { b, up };
  }
  function events2(H, k) {
    const A = analyse(H, k), sp = 60 / HL.bpm / 2, ev = [];
    A.C.forEach((c, h) => { if (!c) return; const v = voicing(H, c), t0 = h * 4 * sp;
      if (HL.acc === "block") { ev.push([v.b, t0, 4 * sp * .95, .6]); v.up.forEach(m => ev.push([m, t0, 4 * sp * .95, .42])); }
      else if (HL.acc === "pulse") { ev.push([v.b, t0, 4 * sp * .95, .6]); [0, 2].forEach(q => v.up.forEach(m => ev.push([m, t0 + q * sp, 1.6 * sp, .38]))); }
      else { ev.push([v.b, t0, 4 * sp * .95, .6]); const ar = [v.up[0], v.up[1], v.up[2], v.up[1]]; for (let i = 0; i < 4; i++) ev.push([ar[i % ar.length], t0 + i * sp, sp * 1.4, .4]); } });
    A.E.forEach(e => ev.push([e.m, e.s * sp, e.len * sp * .93, .85, undefined, "reed"]));
    return { ev, len: 32 * sp, sp };
  }

  // ---------- the lab's markup ----------
  function rows(H, k) {
    const out = [];
    for (let d = 9; d >= -3; d--) {
      out.push([d, 0]);
      const m = mod(d - 1, 7);   // the chromatic note between step d-1 and d, where they're a whole step apart
      if (HL.chrom && [0, 1, 3, 4, 5].includes(m)) out.push(m === 0 || m === 3 ? [d - 1, 1] : [d, -1]);
    }
    return out;
  }
  function chordSelect(H, k, h) {
    const v = HL.chords[h] || "";
    const opts = CATS.map(([cat, lab]) => `<optgroup label="${lab}">${CH.filter(c => c[2] === cat).map(c => { const ch = chordOf(H, k, c[0]); return `<option value="${c[0]}"${v === c[0] ? " selected" : ""}>${esc(c[1])}  (${esc(ch.sym)})</option>`; }).join("")}</optgroup>`).join("");
    return `<label class="hz-cl"><span class="sr-only">Chord for bar ${Math.floor(h / 2) + 1}, beat ${h % 2 ? 3 : 1}</span><select class="hz-cs" data-hzc="${h}"><option value="">${h ? "(same chord)" : "(no chord)"}</option>${opts}</select></label>`;
  }
  function grid(H, k, A, b) {
    const R = rows(H, k), head = `<div></div>${Array.from({ length: 8 }, (_, i) => `<div class="hz-h" aria-hidden="true">${i % 2 ? "&amp;" : i / 2 + 1}</div>`).join("")}`;
    const at = s => { let e = null; A.E.forEach(x => { if (s >= x.s && s < x.s + x.len) e = x; }); return e; };
    const cells = R.map(([d, a]) => { const nt = noteOf(H, k, d, a), m = H.midi(nt), lab = H.nmO(nt);
      return `<div class="hz-l${a ? " ch" : ""}" aria-hidden="true">${lab}</div>` + Array.from({ length: 8 }, (_, i) => { const s = b * 8 + i, v = HL.mel[s], on = Array.isArray(v) && v[0] === d && v[1] === a, e = at(s), held = !on && e && e.m === m && e.d === d && e.a === a, c = A.C[Math.floor(s / 4)], ct = HL.tint && c && c.pcs.includes(mod(m, 12));
        return `<button type="button" class="hz-c${on ? " on" : ""}${held ? " held" : ""}${ct ? " ct" : ""}${i % 2 ? "" : " beat"}${i === 4 ? " half" : ""}" data-hzm="${s},${d},${a}" aria-pressed="${on}" aria-label="Bar ${b + 1}, ${i % 2 ? `and of beat ${Math.floor(i / 2) + 1}` : `beat ${i / 2 + 1}`}: ${lab}${ct ? " (chord tone)" : ""}${held ? " (held)" : ""}"></button>`; }).join(""); }).join("");
    const rest = `<div class="hz-l" aria-hidden="true">Rest</div>` + Array.from({ length: 8 }, (_, i) => { const s = b * 8 + i, on = HL.mel[s] === "r";
      return `<button type="button" class="hz-c rest${on ? " on" : ""}${i % 2 ? "" : " beat"}" data-hzr="${s}" aria-pressed="${on}" aria-label="Bar ${b + 1}, ${i % 2 ? `and of beat ${Math.floor(i / 2) + 1}` : `beat ${i / 2 + 1}`}: rest"></button>`; }).join("");
    const sug = HL.sug ? [b * 2, b * 2 + 1].map(h => `<div class="hz-sug" role="group" aria-label="Suggested chords, bar ${b + 1} beat ${h % 2 ? 3 : 1}">${(HL.sug[h] || []).map((c, j) => `<button type="button" class="hz-chip${c.chrom ? " chrom" : ""}${HL.chords[h] === c.id ? " on" : ""}" data-hzs="${h},${c.id}">${esc(c.rn)} <small>${esc(c.sym)}${j === 3 ? ", color" : ""}</small></button>`).join("") || "<small>no melody here</small>"}</div>`).join("") : "";
    return `<div class="hz-bar"><h4 class="hz-bh" id="hzB${b}">Bar ${b + 1}</h4><div class="hz-chords">${chordSelect(H, k, b * 2)}${chordSelect(H, k, b * 2 + 1)}</div>${sug ? `<div class="hz-sugs">${sug}</div>` : ""}<div class="hz-grid" role="group" aria-labelledby="hzB${b}">${head}${cells}${rest}</div></div>`;
  }
  function meter(A) {
    const p = Math.round(A.fit * 100), lab = A.fit >= .75 && A.free < 2 ? "Married: the melody follows the chords" : A.fit >= .5 && A.free < 3 ? "Separated: some independence" : "Divorced: melody and chords go their own ways";
    return `<div class="hz-meter"><p class="hz-mt"><b>${p}%</b> of the melody is on chord tones (strong beats count more). <b>${lab}.</b></p><div class="hz-mbar" role="img" aria-label="${p}% chord tones"><i style="width:${p}%"></i><span style="left:50%"></span><span style="left:75%"></span></div><p class="hz-mk" aria-hidden="true"><span style="left:0">divorced</span><span style="left:50%">separated</span><span style="left:75%">married</span></p></div>`;
  }
  function labHTML() {
    const H = HC(); if (!H) return "";
    const k = hkey(H, HL.key), A = analyse(H, k), F = feedback(H, k, A);
    return `<div class="hz" id="hzLab">
      <div class="toy-row"><label>Start from <select id="hzPre"><option value="">Choose an example…</option>${Object.entries(PRESETS).map(([id, p]) => `<option value="${id}"${HL.preset === id ? " selected" : ""}>${esc(p.name)}</option>`).join("")}</select></label>
        <label>Key <select id="hzKey">${HKEYS.map(x => `<option${x === HL.key ? " selected" : ""}>${x}</option>`).join("")}</select> major</label></div>
      <div class="toy-row"><button type="button" class="play" data-hz="play" aria-pressed="${HL.on}"><span aria-hidden="true">${HL.on ? "■" : "▶"} </span>${HL.on ? "Stop" : "Play"}</button>
        <label><input type="checkbox" id="hzLoop"${HL.loop ? " checked" : ""}> Loop</label>
        <label>Tempo <input type="range" id="hzBpm" min="60" max="132" step="4" value="${HL.bpm}"> <span id="hzBpmV">${HL.bpm}</span></label>
        <label>Chords <select id="hzAcc"><option value="block"${HL.acc === "block" ? " selected" : ""}>block</option><option value="pulse"${HL.acc === "pulse" ? " selected" : ""}>on the beat</option><option value="arp"${HL.acc === "arp" ? " selected" : ""}>broken</option></select></label></div>
      <div class="toy-row"><button type="button" class="pr-btn" data-hz="sug" aria-pressed="${!!HL.sug}">${HL.sug ? "Hide suggestions" : "Suggest chords"}</button><button type="button" class="pr-btn" data-hz="fill">Fill in the best chords</button><button type="button" class="pr-btn" data-hz="clrm">Clear the melody</button><button type="button" class="pr-btn" data-hz="clrc">Clear the chords</button></div>
      <div class="toy-row"><label><input type="checkbox" id="hzTint"${HL.tint ? " checked" : ""}> Shade chord tones</label><label><input type="checkbox" id="hzChrom"${HL.chrom ? " checked" : ""}> Chromatic notes</label><label class="hz-div"><input type="checkbox" id="hzDiv"${HL.div ? " checked" : ""}> Going for an effect (melodic/harmonic divorce)</label></div>
      <div class="hz-bars">${[0, 1, 2, 3].map(b => grid(H, k, A, b)).join("")}</div>
      <div class="staff wide" id="hzStaff" role="img" aria-label="The melody in notation, with chord symbols above, Roman numerals below and non-chord tones labeled"></div>
      ${meter(A)}
      <ul class="hz-fb" aria-live="polite">${F.map(([t, s]) => `<li class="${t}"><span aria-hidden="true">${t === "warn" ? "!" : t === "ok" ? "✓" : "•"}</span> ${esc(s)}</li>`).join("")}</ul></div>`;
  }
  function labDraw() { const H = HC(), el = document.getElementById("hzStaff"); if (!H || !el) return; const k = hkey(H, HL.key); el.innerHTML = ""; try { H.drawStaff(el, spec(H, k, analyse(H, k))); } catch (e) { el.textContent = ""; } }
  function labRedraw() {
    const el = document.getElementById("hzLab"); if (!el) return;
    const a = document.activeElement, f = a && a.dataset && (a.dataset.hzm ? "data-hzm" : a.dataset.hzr ? "data-hzr" : a.dataset.hzs ? "data-hzs" : a.dataset.hz ? "data-hz" : a.dataset.hzc ? "data-hzc" : null), fv = f && a.getAttribute(f), fid = !f && a && a.id;
    el.outerHTML = labHTML(); labDraw();
    const b = f ? document.querySelector(`[${f}="${fv}"]`) : fid ? document.getElementById(fid) : null; if (b) b.focus({ preventScroll: true });
  }
  function mark(s) { document.querySelectorAll("#hzLab .now").forEach(e => e.classList.remove("now")); if (s < 0) return; document.querySelectorAll(`#hzLab [data-hzm^="${s},"], #hzLab [data-hzr="${s}"]`).forEach(e => e.classList.add("now")); }
  function stop() { HL.on = false; clearTimeout(HL.timer); cancelAnimationFrame(HL.raf); const H = HC(); if (H) H.play({ ev: [] }); labRedraw(); }
  function play() {
    const H = HC(); if (!H) return; const k = hkey(H, HL.key), P2 = events2(H, k); if (!P2.ev.length) return;
    HL.on = true; labRedraw();
    H.play({ ev: P2.ev }, () => { HL.t0 = performance.now() + 60; cancelAnimationFrame(HL.raf);
      const tick = () => { if (!HL.on) return; const s = Math.floor((performance.now() - HL.t0) / 1000 / P2.sp); mark(s >= 0 && s < 32 ? s : -1); HL.raf = requestAnimationFrame(tick); }; tick();
      clearTimeout(HL.timer); HL.timer = setTimeout(() => { if (!HL.on) return; if (HL.loop) play(); else stop(); }, P2.len * 1000 + 80); });
  }
  function wireLab() {
    if (window.__hzWired) return; window.__hzWired = true;
    document.addEventListener("click", e => {
      const H = HC(); if (!H || !e.target.closest("#hzLab")) return; const k = hkey(H, HL.key);
      const c = e.target.closest("[data-hzm]"), r = e.target.closest("[data-hzr]"), s = e.target.closest("[data-hzs]"), b = e.target.closest("[data-hz]");
      if (c) { const [sl, d, a] = c.dataset.hzm.split(",").map(Number), v = HL.mel[sl]; HL.mel[sl] = Array.isArray(v) && v[0] === d && v[1] === a ? null : [d, a];
        if (HL.mel[sl] && !HL.on) { const ch = eff(H, k)[Math.floor(sl / 4)], ev = [[H.midi(noteOf(H, k, d, a)), 0, .45, .85, undefined, "reed"]]; if (ch) { const v2 = voicing(H, ch); ev.push([v2.b, 0, .5, .35]); v2.up.forEach(m => ev.push([m, 0, .5, .25])); } H.play({ ev }); }
        if (HL.sug) HL.sug = suggest(H, k); labRedraw(); return; }
      if (r) { const sl = +r.dataset.hzr; HL.mel[sl] = HL.mel[sl] === "r" ? null : "r"; if (HL.sug) HL.sug = suggest(H, k); labRedraw(); return; }
      if (s) { const [h, id] = s.dataset.hzs.split(","); HL.chords[+h] = id; if (!HL.on) { const ch = chordOf(H, k, id), v2 = voicing(H, ch); H.play({ ev: [[v2.b, 0, .9, .55]].concat(v2.up.map(m => [m, 0, .9, .4])) }); } labRedraw(); return; }
      if (!b) return; const a = b.dataset.hz;
      if (a === "play") { if (HL.on) stop(); else play(); }
      else if (a === "sug") { HL.sug = HL.sug ? null : suggest(H, k); labRedraw(); }
      else if (a === "fill") { const sg = suggest(H, k); let last = null; sg.forEach((l, h) => { const id = l[0] ? l[0].id : null; HL.chords[h] = id && id !== last ? id : h === 0 ? id : null; if (id) last = id; }); if (HL.sug) HL.sug = sg; labRedraw(); }
      else if (a === "clrm") { HL.mel = Array(32).fill(null); HL.preset = ""; if (HL.sug) HL.sug = suggest(H, k); labRedraw(); }
      else if (a === "clrc") { HL.chords = Array(8).fill(null); HL.preset = ""; labRedraw(); }
    });
    document.addEventListener("change", e => {
      const H = HC(); if (!H || !e.target.closest("#hzLab")) return; const t = e.target;
      if (t.dataset.hzc != null) { HL.chords[+t.dataset.hzc] = t.value || null; if (t.value && !HL.on) { const k = hkey(H, HL.key), ch = chordOf(H, k, t.value), v2 = voicing(H, ch); H.play({ ev: [[v2.b, 0, .9, .55]].concat(v2.up.map(m => [m, 0, .9, .4])) }); } labRedraw(); }
      else if (t.id === "hzPre") { if (t.value) { if (HL.on) stop(); loadPreset(H, t.value); labRedraw(); } }
      else if (t.id === "hzKey") { HL.key = t.value; if (HL.sug) HL.sug = suggest(H, hkey(H, HL.key)); labRedraw(); }
      else if (t.id === "hzAcc") HL.acc = t.value;
      else if (t.id === "hzLoop") HL.loop = t.checked;
      else if (t.id === "hzTint") { HL.tint = t.checked; labRedraw(); }
      else if (t.id === "hzChrom") { HL.chrom = t.checked; labRedraw(); }
      else if (t.id === "hzDiv") { HL.div = t.checked; labRedraw(); }
    });
    let rz = 0; window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(labDraw, 200); });   // the notation fits the new width
    document.addEventListener("input", e => { if (e.target.id === "hzBpm") { HL.bpm = +e.target.value; const v = document.getElementById("hzBpmV"); if (v) v.textContent = HL.bpm; } });
  }

  // ---------- lesson figures (C major) ----------
  const T = (k, d, tag) => n(k, d, tag ? { tag, color: NCTC } : {});
  const ode = sc([
    [n("E4", "q", { sym: "C", lab: "I" }), n("E4", "q"), T("F4", "q", "PT"), n("G4", "q")],
    [n("G4", "q", { sym: "G7", lab: "V7" }), n("F4", "q"), T("E4", "q", "PT"), n("D4", "q")],
    [n("C4", "q", { sym: "C", lab: "I" }), n("C4", "q"), T("D4", "q", "PT"), n("E4", "q")],
    [Object.assign(T("E4", "qd", "SUS"), { sym: "G", lab: "V" }), n("D4", "8"), n("D4", "h")]]);
  const types = sc([
    [n("C4", "q", { sym: "C" }), T("D4", "q", "PT"), n("E4", "q"), n("G4", "q")],
    [n("E4", "q", { sym: "C" }), T("F4", "q", "NT"), n("E4", "q"), n("C4", "q")],
    [n("C4", "q", { sym: "C" }), T("A4", "q", "APP"), n("G4", "q"), n("E4", "q")],
    [n("G4", "q", { sym: "C" }), T("A4", "q", "ET"), n("E4", "q"), n("C4", "q")]]);
  const run3 = sc([
    [n("C4", "q", { sym: "C", lab: "I" }), n("D4", "q", { tag: "ET", color: RUNC }), n("F4", "q", { tag: "FREE", color: RUNC }), n("A4", "q", { tag: "APP", color: RUNC })],
    [n("G4", "h", { sym: "G", lab: "V" }), n(null, "h")],
    [n("C4", "q", { sym: "C", lab: "I" }), n("D4", "q", { sym: "Dm", lab: "ii" }), n("F4", "q"), n("A4", "q")],
    [n("G4", "h", { sym: "G", lab: "V" }), n(null, "h")]]);
  const over = sc([
    [n("G4", "q", { sym: "C", lab: "I" }), n("E4", "q"), T("F4", "q", "PT"), n("G4", "q")],
    [n("A4", "q", { sym: "Am", lab: "vi" }), n("C5", "q"), T("B4", "q", "PT"), n("A4", "q")],
    [n("A4", "q", { sym: "F", lab: "IV" }), T("G4", "q", "PT"), n("F4", "q"), n("C5", "q")],
    [n("B4", "h", { sym: "G", lab: "V" }), n("D5", "h")]]);
  const sev = sc([
    [n("F4", "q", { sym: "Dm7", lab: "ii7" }), n("A4", "q"), n("C5", "h")],
    [n("B4", "h", { sym: "G7", lab: "V7" }), n("D5", "q"), n("F5", "q")],
    [n("E5", "h", { sym: "C△7", lab: "IM7" }), n("B4", "h")],
    [n("C5", "w", { sym: "C", lab: "I" })]]);
  const chrom = sc([
    [n("E4", "q", { sym: "C", lab: "I" }), n("G4", "q"), n("C5", "h")],
    [n("C♯5", "h", { sym: "A7", lab: "V7/ii" }), n("A4", "h")],
    [n("D5", "h", { sym: "F", lab: "IV" }), n("A♭4", "h", { sym: "Fm", lab: "iv" })],
    [n("G4", "h", { sym: "G7", lab: "V7" }), n("C5", "h", { sym: "C", lab: "I" })]]);
  const div = sc([
    [n("G4", "q", { sym: "C", lab: "I" }), n("E4", "q"), T("D4", "q", "PT"), n("C4", "q")],
    [n("G4", "q", { sym: "B♭", lab: "♭VII", tag: "FREE", color: NCTC }), T("E4", "q", "APP"), n("D4", "q"), T("C4", "q", "ET")],
    [n("G4", "q", { sym: "F", lab: "IV", tag: "FREE", color: RUNC }), n("E4", "q", { tag: "APP", color: RUNC }), n("D4", "q", { tag: "PT", color: RUNC }), n("C4", "q")],
    [n("G4", "q", { sym: "C", lab: "I" }), n("E4", "q"), n("C4", "h")]]);

  const lesson = { steps: [
    { title: "What harmonizing means", kick: "Harmonization", render: (H, k, U) => `<p>A melody and its chords are written for each other. You can work in either direction: start from a chord progression and write a <b>melody over the chords</b>, or start from a tune and choose <b>chords under the melody</b>. Either way, the same question comes up again and again: is this melody note one of the notes of the chord sounding with it?</p>
      <p>Notes that belong to the chord are <b>chord tones</b>. The rest are <b>non-chord tones</b>: notes that pass between chord tones, decorate them, or lean on them. A good melody uses both. Chord tones anchor it to the harmony; non-chord tones give it motion.</p>`
      + U.fig(ode, "Beethoven, “Ode to Joy” (Symphony No. 9), opening phrase with one possible harmonization. Chord symbols above, Roman numerals below; non-chord tones are labeled.")
      + `<p>In the example, every beat 1 and beat 3 lands on a chord tone except the E at the start of bar 4, a suspension held over from the C chord. The other non-chord tones are passing tones on weak beats.</p>`
      + H.check("Notes of a melody that belong to the chord sounding with them are called…", "chord tones", ["passing tones", "pedal tones", "tendency tones"], "The others are non-chord tones.") },
    { title: "Chord tones on strong beats", kick: "Where the chord tones go", render: (H, k, U) => `<p>Listeners hear the notes on strong beats (beat 1, and beat 3 in 4/4) and long notes as the melody's skeleton. When those are chord tones, the melody sounds settled against its harmony; weaker beats and short notes are where non-chord tones usually go.</p>
      <p>The common non-chord tones are named for how they are approached and left:</p>`
      + tbl("Non-chord tones", ["Name", "Approached by", "Left by", "Usual place"], [
        ["Passing tone (PT)", "step", "step in the same direction", "weak beat, between two chord tones"],
        ["Neighbor tone (NT)", "step", "step back to the same note", "weak beat"],
        ["Appoggiatura (APP)", "leap", "step, usually the other way", "strong beat: it leans, then resolves"],
        ["Escape tone (ET)", "step", "leap, usually the other way", "weak beat"],
        ["Suspension (SUS)", "the same note, held or repeated from the chord before", "step down", "strong beat"],
        ["Anticipation (ANT)", "step or leap", "the same note, which belongs to the next chord", "just before the chord change"]])
      + U.fig(types, "Over a C chord: a passing tone, a neighbor tone, an appoggiatura and an escape tone.")
      + `<p>For more practice naming them, see <a href="non-chord-tones-lesson.html">Understanding Non-Chord Tones</a>.</p>`
      + H.check("A non-chord tone approached by leap and left by step is…", "an appoggiatura", ["a passing tone", "a neighbor tone", "an escape tone"], "It leans on the chord tone it resolves to.") },
    { title: "No more than two in a row", kick: "A guideline", render: (H, k, U) => `<p>A useful rule of thumb while you work: <b>don't use more than two non-chord tones in a row</b>, unless you're going for a specific effect. After two, the ear starts to hear the melody as outlining a different chord, and the harmony underneath begins to sound wrong rather than colorful.</p>`
      + U.fig(run3, "Bar 1: D, F and A over C are three non-chord tones in a row, and they spell a D minor chord. Bar 3: the same melody with the chord changed to Dm on beat 2, so they become chord tones.")
      + `<p>When you hit a run like this, you have three fixes: make one of the notes a chord tone, change the chord so it contains them (here, ii), or change the harmonic rhythm so the chord changes sooner.</p>
      <p>Some effects deliberately break the guideline: a fast scale run that sweeps past many notes, a chain of appoggiaturas for expressive weight, or a melody that follows its own pattern while the chords move independently. That last one has a name, and you'll meet it later in this lesson: the <b>melodic/harmonic divorce</b>.</p>`
      + H.check("Three non-chord tones in a row often sound wrong because…", "the ear hears them as outlining a different chord", ["they are always too high", "they change the meter", "they are always out of the key"], "Fix it with a chord tone, a different chord, or an earlier chord change.") },
    { title: "Writing a melody over chords", kick: "Melody over chords", render: (H, k, U) => `<p>Start with the chords and write the skeleton first:</p>
      <ol><li>On each chord change (and each strong beat), pick a chord tone. Choose ones that move by step or small leap from the one before, and give the line a shape: a rise to a high point, then a fall.</li>
      <li>Connect the skeleton notes with passing and neighbor tones on the weaker beats.</li>
      <li>Vary the rhythm: a few longer notes on chord tones, quicker notes between them.</li>
      <li>End on the tonic (or its 3rd) over the final I chord.</li></ol>`
      + U.fig(over, "A melody over I–vi–IV–V in C. Each bar starts on a chord tone; the passing tones (PT) connect chord tones on weak beats; the high point is the C in bar 2.")
      + H.check("When writing a melody over chords, which notes should you choose first?", "chord tones on the strong beats", ["passing tones on the weak beats", "the highest note in the range", "the last note only"], "Then connect them with non-chord tones.") },
    { title: "Choosing chords for a melody", kick: "Chords under a melody", render: (H, k, U) => `<p>Going the other way, look at the notes on strong beats and the longest notes in each half bar or bar, and ask which chords contain them. Every note belongs to several chords:</p>`
      + tbl("Diatonic chords that contain C, in C major", ["Chord", "C is its…"], [["C (I)", "root"], ["Am (vi)", "3rd"], ["F (IV)", "5th"], ["Dm7 (ii7)", "7th"], ["F△7 (IVM7)", "5th"], ["Am7 (vi7)", "3rd"]])
      + `<p>Then choose among the candidates with the larger shape in mind:</p>
      <ul><li><b>Harmonic rhythm</b>: change chords at a steady rate (every bar, or every half bar), and faster toward a cadence.</li>
      <li><b>Cadences</b>: end phrases on V (a half cadence) or V–I (an authentic cadence). The melody's last notes usually point to these.</li>
      <li><b>Strong progressions</b>: roots moving down a 5th (ii–V–I) or down a 3rd (I–vi–IV) sound purposeful.</li>
      <li><b>The bass</b>: the chord's root (or an inversion) should make a good line against the melody, often moving the other way.</li></ul>
      <p>In the lab at the end of this lesson, <b>Suggest chords</b> ranks the chords that fit each half bar, weighting strong beats and long notes, so you can test the options by ear.</p>`
      + H.check("In C major, which chord has C as its 7th?", "Dm7 (ii7)", ["C△7 (IM7)", "Am7 (vi7)", "G7 (V7)"], "D, F, A, C.") },
    { title: "Triads and seventh chords", kick: "Seventh chords", render: (H, k, U) => `<p>Seventh chords add a fourth note, which gives a melody more chord tones to land on and adds color. Two habits are worth knowing:</p>
      <ul><li>When the melody holds a chord's <b>7th</b> (C over Dm7, F over G7), it usually moves <b>down by step</b> when the chord changes.</li>
      <li>A <b>major 7th</b> in the melody over I (B over C△7) is a soft, jazzy color rather than a tension that has to resolve.</li></ul>`
      + U.fig(sev, "ii7–V7–IM7–I in C. The C over Dm7 is the chord's 7th and falls to B over G7; the B over C△7 is a major-7th color note.")
      + `<p>Triads are plainer and sturdier; seventh chords sound richer and lean more strongly toward the next chord. In the lab, try a phrase both ways.</p>`
      + H.check("When the melody holds the 7th of a chord, it usually moves…", "down by step when the chord changes", ["up by leap", "nowhere: it stays", "up an octave"], "The 7th tends to resolve down.") },
    { title: "Chromatic chords", kick: "Beyond the key", render: (H, k, U) => `<p>Chords from outside the key add color, but they bring a note from outside the key with them, and the melody has to agree with it.</p>
      <ul><li><b>Secondary dominants</b> (V/ii, V/V, V7/vi…) are the dominants of chords other than I. In C, V7/ii is A7: its C♯ leads up to D. A melody note C over A7 clashes; C♯ fits.</li>
      <li><b>Borrowed chords</b> come from the parallel minor: iv (Fm in C), ♭VI (A♭), ♭VII (B♭), iiø7. Over Fm, the melody's A must become A♭.</li>
      <li><b>Other chromatic chords</b>: the Neapolitan ♭II (D♭ in C), the fully diminished vii°7, the augmented V+.</li></ul>`
      + U.fig(chrom, "In C: V7/ii (A7) with C♯ in the melody, then IV changing to the borrowed iv (Fm), with the melody's A lowered to A♭.")
      + `<p>A quick test: if the chord you choose contains a ♯ or ♭ that the key doesn't, look for that letter in the melody nearby and make it match.</p>`
      + H.check("In C major, the melody has C where the chord is A7 (V7/ii). Which note fits the chord?", "C♯", ["C", "D", "B♭"], "A7 is A, C♯, E, G.") },
    { title: "The melodic/harmonic divorce", kick: "When the melody goes its own way", render: (H, k, U) => `<p>In much rock and pop, the melody doesn't follow the chords the way the guidelines above describe. The music theorist David Temperley called this the <b>melodic/harmonic divorce</b> (“The Melodic-Harmonic ‘Divorce’ in Rock,” <i>Popular Music</i>, 2007). Its clearest sign is non-chord tones that <b>don't resolve by step</b>. Temperley found it most often in pentatonic melodies and in verses; a chorus often “remarries” melody and harmony.</p>
      <p>Drew Nobile (“Counterpoint in Rock Music: Unpacking the ‘Melodic-Harmonic Divorce’,” <i>Music Theory Spectrum</i>, 2015) describes three kinds:</p>
      <ul><li><b>Hierarchy divorce</b>: the melody stays on notes of a deeper harmony (often the tonic chord) while the surface chords change.</li>
      <li><b>Loop divorce</b>: the melody repeats its own figure over a repeating chord loop, so it fits some chords and rubs against others.</li>
      <li><b>Syntax divorce</b>: melody and chords both head for a cadence, but in incompatible ways.</li></ul>`
      + U.fig(div, "A loop divorce: the same pentatonic figure (G E D C) over I–♭VII–IV–I in C. Over B♭ and F most of its notes are non-chord tones, and the G leaps in and out without resolving (FREE). Over F, three come in a row.")
      + `<p>Divorce is a choice, not an accident: it works when the melody's own pattern is strong enough that the listener follows it. In the lab, load the divorce example, then switch <b>Going for an effect</b> on and off to compare how the feedback changes. Then try making the same melody “remarry” the chords by changing the chords instead.</p>`
      + H.check("According to Temperley, the clearest sign of a melodic/harmonic divorce is…", "non-chord tones that don't resolve by step", ["a key change", "a slower tempo", "a melody made only of chord tones"], "Popular Music 26/2 (2007).") },
    { title: "Try it: the harmonization lab", kick: "Harmonization lab", render: (H, k, U) => { wireLab(); setTimeout(labDraw, 0); return `<p>Each bar has two chord menus (beat 1 and beat 3) and a grid of eighth notes. Click a square to start a note; it lasts until the next note or rest. Shaded squares are chord tones of the chord at that moment. Every change is checked right away: non-chord tones are named in the notation, runs of three or more are marked in red, and the meter shows how closely the melody follows the chords.</p>
      <ul><li><b>Melody over chords:</b> start from “Write a melody over I–vi–IV–V.”</li>
      <li><b>Chords under a melody:</b> start from Ode to Joy, then choose chords, or press <b>Suggest chords</b>.</li>
      <li>Try the same melody with triads, then seventh chords, then a chromatic chord or two.</li>
      <li>Load the divorce example and turn <b>Going for an effect</b> on and off.</li></ul>${labHTML()}`; } },
  ] };

  // ---------- drills ----------
  const F = {
    ideas: [
      ["David Temperley's term for a melody that doesn't follow its chords, common in rock, is…", "the melodic/harmonic divorce", ["the deceptive cadence", "voice exchange", "the Picardy third"], "Popular Music, 2007."],
      ["In a loop divorce, the melody…", "repeats its own figure over a repeating chord loop", ["only uses chord tones", "stops while the chords play", "doubles the bass line"], "Nobile's three kinds: hierarchy, loop, syntax."],
      ["In a hierarchy divorce, the melody stays on notes of…", "a deeper harmony, often the tonic chord, while surface chords change", ["the bass line", "a different key", "a single non-chord tone"], "Nobile, Music Theory Spectrum, 2015."],
      ["A useful guideline while harmonizing: avoid more than how many non-chord tones in a row, unless you want an effect?", "two", ["one", "four", "six"], "After two, the ear hears another chord."],
      ["Writing a melody over chords, it's usually best to choose first…", "chord tones for the strong beats", ["passing tones", "the rhythm of the last bar", "the highest note"], "Then connect them."],
      ["Changing chords faster as a phrase nears its cadence is a change in…", "harmonic rhythm", ["tempo", "meter", "key"], "The rate at which chords change."],
      ["Temperley found the melodic/harmonic divorce most often in…", "verses with pentatonic melodies", ["final cadences", "classical minuets", "chorale harmonizations"], "Choruses often bring melody and harmony back together."],
    ],
    nct: [
      ["A non-chord tone approached and left by step in the same direction is…", "a passing tone", ["a neighbor tone", "an escape tone", "an appoggiatura"], "It passes between two chord tones."],
      ["A non-chord tone that steps away and steps back to the same note is…", "a neighbor tone", ["a passing tone", "a suspension", "an anticipation"], "Upper or lower neighbor."],
      ["A note held from the previous chord that becomes a non-chord tone, then steps down, is…", "a suspension", ["an anticipation", "a passing tone", "an escape tone"], "Preparation, suspension, resolution."],
      ["A non-chord tone that sounds the next chord's note early is…", "an anticipation", ["a suspension", "an appoggiatura", "a neighbor tone"], "It's then repeated when the chord arrives."],
      ["Which non-chord tone is usually on a strong beat?", "the appoggiatura", ["the passing tone", "the escape tone", "the anticipation"], "It leans on its resolution."],
    ],
    chrom: [
      ["A secondary dominant is…", "the dominant of a chord other than I", ["any minor chord", "the chord on the 7th degree", "a chord borrowed from another piece"], "V/V, V/ii, V/vi…"],
      ["Chords taken from the parallel minor key are called…", "borrowed chords", ["secondary dominants", "Neapolitan chords", "pedal chords"], "Also called mode mixture."],
      ["In C major, ♭VII is…", "B♭ major", ["B diminished", "B major", "B♭ minor"], "Borrowed from C minor."],
      ["The Neapolitan chord in C major is…", "D♭ major (♭II)", ["D minor (ii)", "D major (V/V)", "D♭ minor"], "Usually in first inversion before V."],
      ["In C major, the borrowed iv chord is F minor. Which melody note has to change to fit it?", "A becomes A♭", ["C becomes C♯", "F becomes F♯", "E becomes E♭"], "F, A♭, C."],
    ],
  };
  const NCTNAME = { PT: "passing tone", NT: "neighbor tone", APP: "appoggiatura", ET: "escape tone" };
  const GEN = {
    fit: H => { const k = hkey(H, H.rnd(HKEYS)), id = H.rnd(["I", "ii", "iii", "IV", "V", "vi", "IM7", "ii7", "V7", "vi7", "IVM7"]), c = chordOf(H, k, id);
      const pick = H.shuffle(c.tones.map((t, i) => i)).slice(0, Math.min(3, c.tones.length)).sort((a, b) => a - b), notes = pick.map(i => { const t = c.tones[i]; let x = H.N(t.l, t.a, 4); while (H.midi(x) < H.midi(k.T0) - 2) x = H.N(t.l, t.a, x.o + 1); while (H.midi(x) > H.midi(k.T0) + 14) x = H.N(t.l, t.a, x.o - 1); return x; });
      const pcs = notes.map(H.pc), others = CH.filter(x => x[2] === c.cat || x[2] === (c.seventh ? "d7" : "dt")).map(x => chordOf(H, k, x[0])).filter(x => x.id !== id && !pcs.every(p => x.pcs.includes(p)));
      const spec = sc([notes.map(x => n(H.nmO(x), "q")).concat(notes.length < 4 ? [n(null, notes.length === 3 ? "q" : "h")] : [])], { vf: k.vf, sig: k.sig, minBar: 200 });
      return H.mc(`In ${k.label}, which chord contains all of these melody notes?`, `${c.sym} (${c.rn})`, others.map(x => `${x.sym} (${x.rn})`), `${notes.map(H.nm).join(", ")}: in ${c.sym}, they are its ${pick.map(i => ROLE[i]).join(", ")}.`, { kicker: "Which chord fits?", staff: spec, playQ: { ev: notes.map((x, i) => [H.midi(x), i * .6, .55, .85]) } }); },
    nct: H => { const type = H.rnd(["PT", "NT", "APP", "ET"]), k = hkey(H, H.rnd(HKEYS)), id = H.rnd(["I", "IV", "V"]), c = chordOf(H, k, id), r = CH.find(x => x[0] === id)[3];
      const st = { PT: [r, r + 1, r + 2], NT: [r + 2, r + 3, r + 2], APP: [r, r + 3, r + 2], ET: [r + 2, r + 3, r] }[type], ns = st.map(d => noteOf(H, k, d, 0));
      const spec = sc([[Object.assign(n(H.nmO(ns[0]), "q"), { sym: c.sym }), n(H.nmO(ns[1]), "q"), n(H.nmO(ns[2]), "h")]], { vf: k.vf, sig: k.sig, minBar: 200 });
      const v = voicing(H, c), ev = [[v.b, 0, 2.3, .5]].concat(v.up.map(m => [m, 0, 2.3, .35]), ns.map((x, i) => [H.midi(x), i * .6, i === 2 ? 1.1 : .55, .9, undefined, "reed"]));
      return H.mc(`Over ${c.sym}, what kind of non-chord tone is the middle note?`, NCTNAME[type], Object.values(NCTNAME).filter(x => x !== NCTNAME[type]), `${H.nm(ns[1])} is ${{ PT: "approached and left by step in the same direction", NT: "approached by step and left by step back to the same note", APP: "approached by leap and left by step", ET: "approached by step and left by leap" }[type]}.`, { kicker: "Non-chord tones", staff: spec, playQ: { ev } }); },
    chrom: H => { const k = hkey(H, H.rnd(HKEYS)), id = H.rnd(["V7ii", "V7V", "V7vi", "VV", "Vvi", "iv", "bVI", "bVII", "N"]), c = chordOf(H, k, id);
      const t = c.tones.find(x => !k.scale.some(s => H.pc(s) === H.pc(x))); if (!t) return GEN.fit(H);
      const dia = k.scale.find(s => s.l === t.l), wrong = [H.nm(dia)].concat(k.scale.filter(s => s.l !== t.l).map(H.nm));
      return H.mc(`In ${k.label}, the chord changes to ${c.rn} (${c.sym}). The melody has ${H.nm(dia)} there. Which note fits the chord instead?`, H.nm(t), wrong, `${c.sym} is ${c.tones.map(H.nm).join(", ")}: ${H.nm(t)} is the note from outside the key.`, { kicker: "Chromatic chords" }); },
  };
  function make(mode, H) {
    if (mode === "fit") return GEN.fit(H);
    if (mode === "nct" && Math.random() < .7) return GEN.nct(H);
    if (mode === "chrom" && Math.random() < .7) return GEN.chrom(H);
    const pool = { nct: F.nct, chrom: F.chrom, ideas: F.ideas }[mode] || F.ideas;
    const [q, a, w, y] = H.rnd(pool); return H.mc(q, a, w, y);
  }
  const reference = () => `<ul><li><b>Chord tones</b> on strong beats and long notes; <b>non-chord tones</b> (passing, neighbor, appoggiatura, escape, suspension, anticipation) between them.</li><li><b>Guideline</b>: no more than two non-chord tones in a row, unless you want an effect.</li><li><b>Melody over chords</b>: skeleton of chord tones first, then connect them.</li><li><b>Chords under a melody</b>: find the chords that contain the strong-beat notes; steady harmonic rhythm; cadences.</li><li><b>Sevenths</b>: a melody on the 7th steps down; a major 7th over I is color.</li><li><b>Chromatic chords</b>: the melody must agree with the chord's outside note.</li><li><b>Melodic/harmonic divorce</b> (Temperley; Nobile): the melody follows its own logic; unresolved non-chord tones.</li></ul>`;
  return { key: "silverapps-harmonize-v1", lesson, make, reference, modes: [{ id: "fit", kicker: "Which chord fits?" }, { id: "nct", kicker: "Non-chord tones" }, { id: "chrom", kicker: "Chromatic chords" }, { id: "ideas", kicker: "Ideas and guidelines" }], topics: [] };
})();

window.FAM.quiz = [
  {"s": 1, "q": "Melody notes that belong to the chord sounding with them are…", "a": "chord tones", "w": ["passing tones", "pedal tones", "suspensions"], "hint": "They anchor the melody.", "why": "The others are non-chord tones."},
  {"s": 1, "q": "Harmonizing can start from either…", "a": "the chords or the melody", "w": ["only the chords", "only the lyrics", "only the bass line"], "hint": "Two directions.", "why": "Write a melody over chords, or choose chords under a melody."},
  {"s": 2, "q": "In 4/4, which beats are strong?", "a": "beats 1 and 3", "w": ["beats 2 and 4", "only beat 4", "every off-beat"], "hint": "Where the skeleton goes.", "why": "Melodies usually put chord tones there."},
  {"s": 2, "q": "A non-chord tone approached by step and left by step in the same direction is…", "a": "a passing tone", "w": ["a neighbor tone", "an escape tone", "an appoggiatura"], "hint": "It moves through.", "why": "It connects two chord tones."},
  {"s": 2, "q": "A non-chord tone reached by leap and resolved by step is…", "a": "an appoggiatura", "w": ["a passing tone", "an escape tone", "an anticipation"], "hint": "It leans.", "why": "Usually on a strong beat."},
  {"s": 2, "q": "A note held over from the previous chord that then steps down is…", "a": "a suspension", "w": ["a neighbor tone", "an anticipation", "an escape tone"], "hint": "Preparation, then resolution.", "why": "It's prepared by the same note in the chord before."},
  {"s": 3, "q": "A useful guideline: avoid more than how many non-chord tones in a row?", "a": "two", "w": ["one", "four", "eight"], "hint": "Unless you want an effect.", "why": "After that, the ear hears a different chord."},
  {"s": 3, "q": "Three non-chord tones in a row can be fixed by…", "a": "changing the chord so it contains them", "w": ["playing louder", "slowing the tempo", "adding a rest at the end"], "hint": "Harmony can move too.", "why": "Or make one of them a chord tone, or change chords sooner."},
  {"s": 4, "q": "Writing a melody over chords, the skeleton notes should be…", "a": "chord tones on the strong beats", "w": ["non-chord tones on the strong beats", "all the same pitch", "only leaps"], "hint": "Anchor first.", "why": "Then connect them with passing and neighbor tones."},
  {"s": 4, "q": "A final melody note that sounds most finished over the last I chord is…", "a": "the tonic", "w": ["the 7th degree", "the 4th degree", "the 2nd degree"], "hint": "Home.", "why": "The 3rd also works."},
  {"s": 5, "q": "In C major, C is the 5th of which chord?", "a": "F (IV)", "w": ["C (I)", "Am (vi)", "G (V)"], "hint": "Count up from the root.", "why": "F, A, C."},
  {"s": 5, "q": "The rate at which chords change is called…", "a": "harmonic rhythm", "w": ["tempo", "meter", "texture"], "hint": "Every bar, every half bar…", "why": "It often speeds up toward a cadence."},
  {"s": 5, "q": "A phrase ending on V is a…", "a": "half cadence", "w": ["authentic cadence", "plagal cadence", "deceptive cadence"], "hint": "Open.", "why": "V–I is an authentic cadence."},
  {"s": 6, "q": "When the melody holds a chord's 7th, it usually moves…", "a": "down by step at the next chord", "w": ["up by leap", "up by step", "to the bass"], "hint": "The 7th falls.", "why": "C over Dm7 falls to B over G7."},
  {"s": 6, "q": "B in the melody over C△7 is…", "a": "the chord's major 7th, a color note", "w": ["a wrong note", "the root", "a suspension that must resolve up"], "hint": "C, E, G, B.", "why": "It doesn't need to resolve."},
  {"s": 7, "q": "In C major, V7/V is…", "a": "D7", "w": ["G7", "A7", "Dm7"], "hint": "The dominant of G.", "why": "D, F♯, A, C."},
  {"s": 7, "q": "Over a borrowed iv chord in C (F minor), the melody's A should become…", "a": "A♭", "w": ["A♯", "B♭", "G♯"], "hint": "F minor.", "why": "F, A♭, C."},
  {"s": 7, "q": "Chords from the parallel minor used in a major key are…", "a": "borrowed chords", "w": ["secondary dominants", "pivot chords", "pedal chords"], "hint": "Mode mixture.", "why": "iv, ♭VI, ♭VII, iiø7…"},
  {"s": 8, "q": "Who named the melodic/harmonic divorce in rock?", "a": "David Temperley", "w": ["Leonard Meyer", "Heinrich Schenker", "Walter Piston"], "hint": "Popular Music, 2007.", "why": "Drew Nobile later described three kinds."},
  {"s": 8, "q": "The clearest sign of a melodic/harmonic divorce is…", "a": "non-chord tones that don't resolve by step", "w": ["a melody of chord tones only", "a key change", "a slower harmonic rhythm"], "hint": "Unresolved.", "why": "The melody follows its own logic."},
  {"s": 8, "q": "A melody repeating its own figure over a repeating chord loop is Nobile's…", "a": "loop divorce", "w": ["hierarchy divorce", "syntax divorce", "deceptive cadence"], "hint": "Loops.", "why": "The figure fits some chords and rubs against others."},
];
