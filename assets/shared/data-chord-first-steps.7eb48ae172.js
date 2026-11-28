
(() => {
  const $ = id => document.getElementById(id);
  const LET = "CDEFGAB", NAT = [0, 2, 4, 5, 7, 9, 11], ACC = { "-2": "𝄫", "-1": "♭", "0": "", "1": "♯", "2": "𝄪" };
  const nm = n => LET[n.l] + ACC[n.a], midi = n => 12 * (n.o + 1) + NAT[n.l] + n.a, pos = n => n.o * 7 + n.l;
  const ORD = ["", "unison", "2nd", "3rd", "4th", "5th", "6th", "7th", "octave"];
  const rnd = a => a[Math.floor(Math.random() * a.length)], shuffle = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);
  const TRI = { M: ["major", [4, 7]], m: ["minor", [3, 7]], d: ["diminished", [3, 6]], A: ["augmented", [4, 8]], sus: ["sus4", [5, 7]] };   // sus4: a perfect 4th replaces the 3rd (always root position here)
  const SEV = { M7: ["major seventh", [4, 7, 11], "M"], "7": ["dominant seventh (major-minor)", [4, 7, 10], "M"], m7: ["minor seventh", [3, 7, 10], "m"], h7: ["half-diminished seventh", [3, 6, 10], "d"], o7: ["fully diminished seventh", [3, 6, 9], "d"],
    mM7: ["minor-major seventh", [3, 7, 11], "m"], A7: ["augmented seventh", [4, 8, 10], "A"], AM7: ["augmented major seventh", [4, 8, 11], "A"] };
  const SYM = { M: "", m: "m", d: "°", A: "+", sus: "sus4", M7: "△7", "7": "7", m7: "m7", h7: "ø7", o7: "°7", mM7: "m(△7)", A7: "+7", AM7: "+△7" };
  // chord members' names: a sus4 chord has a 4th where other triads have a 3rd
  const memOf = i => C && C.q === "sus" ? ["root", "4th", "5th"][i] : MEM[i];
  const isSus = () => C && C.q === "sus";
  // every note name in everyday use (no E♯, F♭, B♯ or C♭), in three rows: naturals, sharps, flats
  const USUAL = ["C", "D", "E", "F", "G", "A", "B", "C♯", "D♯", "F♯", "G♯", "A♯", "D♭", "E♭", "G♭", "A♭", "B♭"];
  const MEM = ["root", "3rd", "5th", "7th"], INV = ["root position", "first inversion", "second inversion", "third inversion"];
  const FIG3 = ["(no figure)", "6", "6/4"], FIG7 = ["7", "6/5", "4/3", "4/2"];
  const PAGE = (location.pathname.split("/").pop() || "").replace(/\.html?$/, ""), FIX = PAGE === "triads-first-steps" ? "tri" : PAGE === "seventh-chords-first-steps" ? "sev" : null;
  if (FIX) {   // one kind of chord only: the kind menu goes away and the heading says which
    $("kind").value = FIX; $("kind").closest("label").hidden = true;
    document.querySelector("header h1").innerHTML = FIX === "tri" ? 'Triads: <span>First Steps</span>' : 'Seventh Chords: <span>First Steps</span>';
    document.querySelector("header p").innerHTML = FIX === "tri"
      ? "Two step-by-step activities for <b>triads</b>, including <b>sus4</b> chords: <b>identify</b> a triad you see, or <b>spell</b> one from its root, quality and position. To identify, you read each note from the bottom up, measure the distance between neighbors, find the root, check the 3rd (or the 4th, in a sus4 chord) and the 5th above the root, then name the quality and the position. When triads feel easy, go on to <a href=\"seventh-chords-first-steps.html\">Seventh Chords: First Steps</a>."
      : "Two step-by-step activities for <b>seventh chords</b>, all eight kinds: <b>identify</b> a seventh chord you see, or <b>spell</b> one from its root, quality and position. To identify, you read each note from the bottom up, measure the distance between neighbors, find the root, check the 3rd, 5th and 7th above the root, then name the quality and the position. New to chords? Start with <a href=\"triads-first-steps.html\">Triads: First Steps</a>.";
  }
  if (window.SAprogress) SAprogress.init({ id: FIX === "tri" ? "triadsfirststeps" : FIX === "sev" ? "seventhsfirststeps" : "chordfirststeps", name: FIX === "tri" ? "Triads: First Steps" : FIX === "sev" ? "Seventh Chords: First Steps" : "Triads and Seventh Chords: First Steps", before: ".fi-credit" });

  // ---------- make a chord ----------
  let C = null;
  function make() {
    const kind = $("kind").value, accs = $("acc").value, invs = $("inv").value;
    for (let g = 0; g < 500; g++) {
      const sev = kind === "sev" || (kind === "both" && Math.random() < .5);
      const q = sev ? rnd(Object.keys(SEV)) : rnd(["M", "M", "m", "m", "d", "A", "sus"]);
      const rootL = Math.floor(Math.random() * 7), rootA = accs === "none" ? 0 : rnd([0, 0, -1, 1]);
      const semis = [0].concat(sev ? SEV[q][1] : TRI[q][1]), steps = q === "sus" ? [0, 3, 4] : [0, 2, 4, 6].slice(0, semis.length);
      const root = { l: rootL, a: rootA }, tones = steps.map((st, i) => { const l = (rootL + st) % 7, want = (NAT[rootL] + rootA + semis[i]) % 12; let a = ((want - NAT[l]) % 12 + 18) % 12 - 6; return { l, a }; });
      if (tones.some(t => Math.abs(t.a) > 1) || (accs === "none" && tones.some(t => t.a))) continue;
      // keep to chords musicians actually spell: no A♯ roots and no F♭, C♭, E♯ or B♯ anywhere in the chord
      if ((rootL === 5 && rootA === 1) || tones.some(t => (t.a === -1 && (t.l === 3 || t.l === 0)) || (t.a === 1 && (t.l === 2 || t.l === 6)))) continue;
      const inv = invs === "root" || q === "sus" ? 0 : Math.floor(Math.random() * tones.length);
      const clef = $("clef").value === "mix" ? rnd(["treble", "bass"]) : $("clef").value;
      // close position from the bass up, placed on the staff
      const order = tones.slice(inv).concat(tones.slice(0, inv)), lo = clef === "treble" ? 62 : 41, hi = clef === "treble" ? 81 : 60;
      let o = 2; const first = order[0]; while (midi({ ...first, o }) < lo) o++;
      const notes = [{ ...first, o }]; for (let i = 1; i < order.length; i++) { const p = notes[i - 1]; let n = { ...order[i], o: p.o }; while (pos(n) <= pos(p)) n.o++; notes.push(n); }
      if (midi(notes[notes.length - 1]) > hi) continue;
      C = { q, sev, root, tones, inv, clef, notes, rootIdx: (tones.length - inv) % tones.length, k: 0, steps: [], ok: true };
      return;
    }
  }

  // ---------- drawing ----------
  // accidental shapes in staff-space units, anchored on the note's line or space (same shapes as the lessons use)
  const ACCP = {
    "1": { w: 1, d: "M.25 -1.45h.12v3h-.12zM.63 -1.55h.12v3h-.12zM0 -.3L1 -.62v.26L0 -.04zM0 .52L1 .2v.26L0 .78z" },
    "0": { w: .72, d: "M0 -1.5h.12v1.95H0zM.58 -.45h.12V1.5h-.12zM0 -.28L.7 -.5v.24L0 -.04zM0 .3L.7 .08v.24L0 .54z" },
    "-1": { w: .86, d: "M0 -1.45h.14v2H0zM.14 .55C1.05 .05 1 -.6 .14 -.25V-.04C.66 -.34 .72 .1 .14 .36z" },
  };
  const BOT = { treble: 30, bass: 18 };   // diatonic position of the bottom line: E4 = 4*7+2, G2 = 2*7+4
  function staffSVG(notes, clef, o = {}) {
    const sp = 10, top = 30, W = 200, bline = top + 40, x = 120, yOf = n => bline - (pos(n) - BOT[clef]) * sp / 2;
    let s = "";
    for (let i = 0; i < 5; i++) s += `<line x1="6" x2="${W - 6}" y1="${top + i * sp}" y2="${top + i * sp}" stroke="currentColor"/>`;
    s += `<text x="12" y="${clef === "treble" ? top + 41 : top + 40.8}" font-family="'Noto Music', serif" font-size="${clef === "treble" ? 41.3 : 46.2}" fill="currentColor">${clef === "treble" ? "&#x1D11E;" : "&#x1D122;"}</text>`;
    // noteheads: a note a 2nd above the previous one goes to the right side
    const xs = []; notes.forEach((n, i) => { const prev = notes[i - 1]; xs.push(prev && pos(n) - pos(prev) === 1 && xs[i - 1] === x ? x + 13 : x); });
    // accidentals in columns, in the usual order: highest closest to the chord, then the lowest, then the next highest, and so on;
    // accidentals a 7th or more apart may share a column
    const withAcc = [...notes.keys()].filter(i => notes[i].a || o.showNat).sort((p, q) => pos(notes[q]) - pos(notes[p])), seq = [];
    while (withAcc.length) { seq.push(withAcc.shift()); if (withAcc.length) seq.push(withAcc.pop()); }
    const left = Math.min(...xs) - 9, accX = {}, cols = [];
    seq.forEach(i => { const n = notes[i], w = ACCP[n.a].w * sp; let c = 0; while (cols.some(([cc, p]) => cc === c && Math.abs(p - pos(n)) < 6)) c++; cols.push([c, pos(n)]); accX[i] = left - 2 - c * 12 - w; });
    const labs = [];
    notes.forEach((n, i) => {
      const y = yOf(n), col = (o.hl || []).includes(i) ? "#c0392b" : (o.dim || []).includes(i) ? "#9a9088" : "currentColor";
      for (let p = BOT[clef] - 2; p >= pos(n); p -= 2) s += `<line x1="${xs[i] - 11}" x2="${xs[i] + 11}" y1="${bline - (p - BOT[clef]) * sp / 2}" y2="${bline - (p - BOT[clef]) * sp / 2}" stroke="currentColor"/>`;
      for (let p = BOT[clef] + 10; p <= pos(n); p += 2) s += `<line x1="${xs[i] - 11}" x2="${xs[i] + 11}" y1="${bline - (p - BOT[clef]) * sp / 2}" y2="${bline - (p - BOT[clef]) * sp / 2}" stroke="currentColor"/>`;
      if (accX[i] != null) s += `<path d="${ACCP[n.a].d}" transform="translate(${accX[i].toFixed(1)} ${y}) scale(${sp})" fill="${col}"/>`;
      s += `<ellipse cx="${xs[i]}" cy="${y}" rx="7.2" ry="5" transform="rotate(-20 ${xs[i]} ${y})" fill="none" stroke="${col}" stroke-width="2.6"/>`;
      if (o.labels && o.labels[i]) labs.push({ y, t: o.labels[i], col });
    });
    // labels to the right of the staff, bottom to top in the same order as the notes, spread so they never overlap
    labs.sort((p, q) => q.y - p.y); let last = 1e9; labs.forEach(L => { L.ly = Math.min(L.y + 4, last - 13); last = L.ly; });
    const lx = W + 2; labs.forEach(L => { s += `<text x="${lx}" y="${L.ly}" font-size="11.5" font-family="sans-serif" font-weight="600" fill="${L.col}">${L.t}</text>`; });
    let vbw = W + 66;
    if (o.slots) {
      // drop boxes beside the staff: one per note ("names"), each joined to its note by a thin line; for "ivs" the names are written
      // there instead and a box sits between each neighboring pair, joined by a bracket
      const GAP = 26, ys = notes.map((n, i) => yOf(n)); let ly = []; ys.forEach((y, i) => ly.push(i ? Math.min(y, ly[i - 1] - GAP) : y));
      const shift = ys.reduce((a, b) => a + b, 0) / ys.length - ly.reduce((a, b) => a + b, 0) / ly.length; ly = ly.map(v => v + shift);
      const lo = Math.max(...ly), hi = Math.min(...ly); if (lo > 98) ly = ly.map(v => v - (lo - 98)); if (hi < 2) ly = ly.map(v => v + (2 - hi));
      const bx = W + 6, bw = 50, pts = [];
      notes.forEach((n, i) => s += `<line x1="${xs[i] + 9}" y1="${ys[i]}" x2="${bx - 2}" y2="${ly[i]}" stroke="currentColor" stroke-width=".8" stroke-dasharray="2 2" opacity=".7"/>`);
      if (o.slots === "names") { ly.forEach(y => pts.push({ x: bx, y, w: bw, h: 22 })); vbw = bx + bw + 4; }
      else {
        ly.forEach((y, i) => s += `<text x="${bx + bw / 2}" y="${y + 5}" text-anchor="middle" font-size="14" font-family="serif" font-weight="700" fill="currentColor">${nm(notes[i])}</text>`);
        const ix = bx + bw + 14, iw = 50;
        for (let i = 1; i < ly.length; i++) { const a = ly[i - 1] - 4, b = ly[i] + 4, m = (ly[i - 1] + ly[i]) / 2;
          s += `<path d="M${bx + bw + 2} ${a} h5 V${b} h-5 M${bx + bw + 7} ${m} h5" fill="none" stroke="currentColor" stroke-width="1.2"/>`; pts.push({ x: ix, y: m, w: iw, h: 22 }); }
        vbw = ix + iw + 4;
      }
      C.slotGeom = { vbw, vy0: -10, vbh: 120, pts };
    }
    return `<svg class="cs" viewBox="0 -10 ${vbw} 120" role="img" aria-label="${o.aria || ""}">${s}</svg>`;
  }
  function drawStaves() {
    if (MODE === "spell") return drawSpell();
    const st = C.steps[C.k] || {}, labels = C.notes.map((n, i) => i <= C.read ? nm(n) : "");
    if (st.kind === "drag") {
      if (!C.fill) { C.fill = st.ans.map(() => null); C.lock = st.ans.map(() => false); C.bad = []; C.sel = null; }
      const svg = staffSVG(C.notes, C.clef, { slots: st.mode, aria: `A ${C.notes.length}-note chord in ${C.clef} clef${st.mode === "ivs" ? ", from the bottom: " + C.notes.map(nm).join(", ") : ""}` }), G = C.slotGeom;
      const boxes = G.pts.map((p, i) => { const v = C.fill[i], ok = C.lock[i];
        const where = st.mode === "names" ? `Note ${i + 1} from the bottom` : `Between ${nm(C.notes[i])} and ${nm(C.notes[i + 1])}`;
        return `<button type="button" class="slot${v ? " full" : ""}${ok ? " ok" : ""}${C.bad && C.bad.includes(i) ? " bad" : ""}" data-slot="${i}" style="left:${(p.x / G.vbw * 100).toFixed(2)}%;top:${((p.y - p.h / 2 - G.vy0) / G.vbh * 100).toFixed(2)}%;width:${(p.w / G.vbw * 100).toFixed(2)}%;height:${(p.h / G.vbh * 100).toFixed(2)}%" aria-label="${where}: ${v || "empty"}${ok ? ", correct" : ""}"${ok ? " aria-disabled=\"true\"" : ""}>${v || ""}</button>`; }).join("");
      $("staves").innerHTML = `<figure><div class="slotwrap">${svg}${boxes}</div><figcaption>As written</figcaption></figure>`;
      return;
    }
    let h = `<figure>${staffSVG(C.notes, C.clef, { hl: st.hl || [], labels, aria: `A ${C.notes.length}-note chord in ${C.clef} clef${C.read >= 0 ? ": notes read so far, from the bottom: " + C.notes.slice(0, C.read + 1).map(nm).join(", ") : ""}` })}<figcaption>As written</figcaption></figure>`;
    if (C.showStack) {
      const r = C.notes[C.rootIdx], stack = [{ ...C.tones[0], o: r.o }]; for (let i = 1; i < C.tones.length; i++) { let n = { ...C.tones[i], o: stack[i - 1].o }; while (pos(n) <= pos(stack[i - 1])) n.o++; stack.push(n); }
      const hl = st.stackHl || []; h += `<figure>${staffSVG(stack, C.clef, { hl, labels: stack.map((n, i) => `${memOf(i)}: ${nm(n)}`), aria: `${isSus() ? "From the root" : "Stacked in 3rds"}: ${stack.map((n, i) => memOf(i) + " " + nm(n)).join(", ")}` })}<figcaption>${isSus() ? "From the root" : "Stacked in 3rds"}</figcaption></figure>`;
      C.stack = stack;
    }
    $("staves").innerHTML = h;
  }
  // a keyboard with the half steps counted from one note to another
  function kbSVG(a, b) {
    const m0 = midi(a), m1 = midi(b), lo = m0 - (m0 % 12 === 0 ? 0 : (m0 % 12)), hi = Math.max(m1 + 2, lo + 13), isB = m => [1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12);
    let wx = 0, s = ""; const X = {};
    for (let m = lo; m <= hi; m++) if (!isB(m)) { X[m] = wx * 30; s += `<rect x="${wx * 30}" y="0" width="29" height="100" rx="3" fill="${m === m0 || m === m1 ? "#ffd27a" : "#fff"}" stroke="#555"/>`; wx++; }
    for (let m = lo; m <= hi; m++) if (isB(m)) { X[m] = X[m - 1] + 20; s += `<rect x="${X[m]}" y="0" width="19" height="62" rx="2" fill="${m === m0 || m === m1 ? "#c98a00" : "#222"}"/>`; }
    for (let m = m0 + 1, k = 1; m <= m1; m++, k++) { const cx = X[m] + (isB(m) ? 9.5 : 14.5), cy = isB(m) ? 50 : 86; s += `<circle cx="${cx}" cy="${cy}" r="9" fill="#2e6db4"/><text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="11" font-family="sans-serif" fill="#fff">${k}</text>`; }
    return `<svg class="kb" viewBox="-2 -2 ${wx * 30 + 4} 106" role="img" aria-label="Keyboard: ${m1 - m0} half steps from ${nm(a)} up to ${nm(b)}">${s}</svg>`;
  }

  // ---------- the steps ----------
  // each step: { title, q (html), kind: "note" | "opts", ans, opts, why, hl, after() }
  function build() {
    const S = [], N = C.notes, T = C.tones, n = N.length;
    C.read = -1; C.showStack = false;
    // step 1: name every note by dragging names (all the usual ones) onto the boxes beside the staff
    const real = N.map(nm), legal = t => Math.abs(t.a) <= 1 && !((t.a === -1 && (t.l === 3 || t.l === 0)) || (t.a === 1 && (t.l === 2 || t.l === 6)));
    const mn = C.clef === "treble" ? "Treble clef: lines E G B D F, spaces F A C E." : "Bass clef: lines G B D F A, spaces A C E G.";
    S.push({ title: "Step 1: name the notes", kind: "drag", mode: "names", ans: real, bank: USUAL, rowsOf: 3, reuse: true,
      q: `Name all ${n} notes. Drag a name onto the box beside each note, or choose a name and then a box. Read each note from its line or space, and check for a sharp or flat in front of it.`,
      hint: `${mn} Ledger lines continue the pattern: count up or down by step from the nearest line you know.`,
      judge: (i, v) => { const want = N[i], got = real.indexOf(v) >= 0 ? N[real.indexOf(v)] : null, gl = "CDEFGAB".indexOf(v[0]);
        if (gl === want.l) return `Note ${i + 1} from the bottom: the letter is right; look again at the accidental in front of it.`;
        const d = want.l - gl, d7 = ((d % 7) + 7) % 7, steps = d7 > 3 ? d7 - 7 : d7;
        return `Note ${i + 1} from the bottom is ${Math.abs(steps)} step${Math.abs(steps) > 1 ? "s" : ""} ${steps > 0 ? "higher" : "lower"} than ${v[0]}. ${mn}`; void got; },
      why: `From the bottom: ${real.join(", ")}.`, after: () => { C.read = n - 1; } });
    // step 2: the interval between each pair of neighbors, dragged into the boxes between the names
    const ivA = N.slice(1).map((x, i) => pos(x) - pos(N[i]) + 1), spell = i => LET.repeat(3).slice(N[i].l, N[i].l + ivA[i]).split("").join(" – ");
    S.push({ title: "Step 2: how far apart?", kind: "drag", mode: "ivs", ans: ivA.map(v => ORD[v]), bank: ["2nd", "3rd", "4th", "5th"], reuse: true,
      q: `Now measure the distance between each pair of neighbors. Drag a number into each box between the names: count the letter names from the lower note up to the upper one, counting both notes.`,
      hint: "Line to line or space to space is a 3rd. Line to the next space (or space to the next line) is a 2nd. Line to space two apart is a 4th.",
      judge: (i, v, tries) => tries >= 2 ? `From ${nm(N[i])} up to ${nm(N[i + 1])}: ${spell(i)}, ${ivA[i]} letters.` : `Recount from ${nm(N[i])} up to ${nm(N[i + 1])}, counting both notes. Ignore sharps and flats: only the letters count.`,
      why: N.slice(1).map((x, i) => `${nm(N[i])} to ${nm(x)}: a ${ORD[ivA[i]]}`).join("; ") + "." });
    const ivs = N.slice(1).map((x, i) => pos(x) - pos(N[i]) + 1), all3 = ivs.every(v => v === 3);
    // the interval step already showed whether every neighbor is a 3rd, so this step starts from that
    const odd = ivs.find(v => v !== 3);
    if (isSus()) S.push({ title: "Find the root", q: `A ${ORD[ivs[0]]}, then a ${ORD[ivs[1]]}: these notes can't be stacked in 3rds. That's the sign of a <b>suspended (sus4) chord</b>: a root with a perfect 4th and a perfect 5th above it, here in root position. Which note is the root?`,
      kind: "opts", opts: N.map(nm), ans: nm(N[C.rootIdx]), hl: [], why: `${nm(N[C.rootIdx])} is the root: ${nm(T[1])} is a 4th above it and ${nm(T[2])} a 5th.`, after: () => { C.showStack = true; } });
    else S.push({ title: "Find the root", q: all3 ? "Every neighbor is a 3rd, so the chord is already stacked in 3rds and the root is the bottom note. Which note is the root?" : `There's a ${ORD[odd]} between neighbors, so the chord isn't stacked in 3rds: it's inverted. In close position, the root is the <b>upper note of the ${C.sev ? "2nd" : "4th"}</b>. Which note is the root?`,
      kind: "opts", opts: N.map(nm), ans: nm(N[C.rootIdx]), hl: [], why: `${nm(N[C.rootIdx])} is the root: stacked in 3rds the chord is ${C.tones.map(nm).join(" – ")}.`, after: () => { C.showStack = true; } });
    const R = { ...T[0], o: 4 }, up = (t, st) => { let x = { ...t, o: 4 }; while (pos(x) <= pos(R)) x.o++; return x; };
    const third = up(T[1]), fifth = up(T[2]), h3 = midi(third) - midi(R), h5 = midi(fifth) - midi(R);
    // half steps and the interval's name in one answer ("4 half steps – major 3rd")
    const HS = ([h, n]) => `${h} half steps – ${n}`;
    if (isSus()) S.push({ title: "Root to 4th", q: `Count the <b>half steps</b> from the root (${nm(T[0])}) up to the 4th (${nm(T[1])}), and name the interval.`, kind: "opts", opts: [[4, "diminished 4th"], [5, "perfect 4th"], [6, "augmented 4th"]].map(HS), ans: HS([h3, h3 === 5 ? "perfect 4th" : h3 === 6 ? "augmented 4th" : "diminished 4th"]), stackHl: [0, 1], kb: [R, third],
      why: `${h3} half steps: a perfect 4th. In a sus4 chord the perfect 4th takes the place of the 3rd.` });
    else S.push({ title: "Root to 3rd", q: `Count the <b>half steps</b> from the root (${nm(T[0])}) up to the 3rd (${nm(T[1])}), and name the interval.`, kind: "opts", opts: [[3, "minor 3rd"], [4, "major 3rd"]].map(HS), ans: HS([h3, h3 === 4 ? "major 3rd" : "minor 3rd"]), stackHl: [0, 1], kb: [R, third],
      why: `${h3} half steps: a ${h3 === 4 ? "major" : "minor"} 3rd. A major 3rd is 4 half steps; a minor 3rd is 3.` });
    S.push({ title: "Root to 5th", q: `Count the half steps from the root (${nm(T[0])}) up to the 5th (${nm(T[2])}), and name the interval.`, kind: "opts", opts: [[6, "diminished 5th"], [7, "perfect 5th"], [8, "augmented 5th"]].map(HS), ans: HS([h5, h5 === 7 ? "perfect 5th" : h5 === 6 ? "diminished 5th" : "augmented 5th"]), stackHl: [0, 2], kb: [R, fifth],
      why: `${h5} half steps: ${h5 === 7 ? "a perfect" : h5 === 6 ? "a diminished" : "an augmented"} 5th. Perfect 5th: 7 half steps; diminished: 6; augmented: 8.` });
    let qn;
    if (C.sev) {
      const sev = up(T[3]), h7 = midi(sev) - midi(R);
      S.push({ title: "Root to 7th", q: `Count the half steps from the root (${nm(T[0])}) up to the 7th (${nm(T[3])}), and name the interval. (Tip: an octave is 12, so you can count down from the root's octave instead.)`, kind: "opts", opts: [[9, "diminished 7th"], [10, "minor 7th"], [11, "major 7th"]].map(HS), ans: HS([h7, h7 === 11 ? "major 7th" : h7 === 10 ? "minor 7th" : "diminished 7th"]), stackHl: [0, 3], kb: [R, sev],
        why: `${h7} half steps (${12 - h7} below the octave): a ${h7 === 11 ? "major" : h7 === 10 ? "minor" : "diminished"} 7th. Major 7th: 11; minor 7th: 10; diminished 7th: 9.` });
      qn = SEV[C.q][0];
      S.push({ title: "The chord's quality", q: `The triad on the bottom is <b>${TRI[SEV[C.q][2]][0]}</b> (${h3 === 4 ? "major" : "minor"} 3rd, ${h5 === 7 ? "perfect" : h5 === 6 ? "diminished" : "augmented"} 5th), and the 7th is <b>${h7 === 11 ? "major" : h7 === 10 ? "minor" : "diminished"}</b>. What kind of seventh chord is it?`, kind: "opts", opts: Object.values(SEV).map(v => v[0]), ans: qn, stackHl: [0, 1, 2, 3], table: true,
        why: `Major triad + major 7th = major seventh (△7). Major triad + minor 7th = dominant seventh (7). Minor triad + minor 7th = minor seventh (m7). Diminished triad + minor 7th = half-diminished (ø7). Diminished triad + diminished 7th = fully diminished (°7). Minor triad + major 7th = minor-major seventh (m(△7)). Augmented triad + minor 7th = augmented seventh (+7). Augmented triad + major 7th = augmented major seventh (+△7).` });
    } else {
      qn = TRI[C.q][0];
      S.push({ title: "The chord's quality", q: isSus() ? `A <b>perfect 4th</b> (and no 3rd) and a <b>perfect 5th</b> above the root. What kind of chord is it?` : `A <b>${h3 === 4 ? "major" : "minor"} 3rd</b> and a <b>${h5 === 7 ? "perfect" : h5 === 6 ? "diminished" : "augmented"} 5th</b> above the root. What kind of triad is it?`, kind: "opts", opts: ["major", "minor", "diminished", "augmented", "sus4"], ans: qn, stackHl: [0, 1, 2], table: true,
        why: "Major: major 3rd + perfect 5th. Minor: minor 3rd + perfect 5th. Diminished: minor 3rd + diminished 5th. Augmented: major 3rd + augmented 5th. Sus4: perfect 4th (instead of a 3rd) + perfect 5th." });
    }
    const BP = i => `${memOf(i)} in the bass – ${INV[i]}`;
    S.push({ title: "Bass note and position", q: `The bass (bottom) note is <b>${nm(N[0])}</b>. Which member of the chord is it, and what position does that put the chord in?`, kind: "opts", opts: MEM.slice(0, T.length).map((m, i) => BP(i)), ans: BP(C.inv), hl: [0],
      why: `${isSus() ? "From the root" : "Stacked in 3rds"} the chord is ${T.map((t, i) => memOf(i) + " " + nm(t)).join(", ")}, so ${nm(N[0])} is the ${memOf(C.inv)}. Root in the bass: root position. 3rd: first inversion. 5th: second inversion. 7th: third inversion.` });
    return S;
  }

  // ---------- running the steps ----------
  let picked = { l: null, a: 0 }, tries = 0;
  function render() {
    drawStaves();
    const st = C.steps[C.k];
    if (!st) { finish(); return; }
    let input;
    if (st.kind === "note") input = `<div class="opts" role="group" aria-label="Letter">${"CDEFGAB".split("").map((L, i) => `<button type="button" class="ans" data-l="${i}" aria-pressed="${picked.l === i}">${L}</button>`).join("")}</div>
      <div class="opts" role="group" aria-label="Accidental">${[[-1, "♭ flat"], [0, "no accidental"], [1, "♯ sharp"]].map(([a, l]) => `<button type="button" class="ans" data-a="${a}" aria-pressed="${picked.a === a}">${l}</button>`).join("")}</div>
      <div class="row"><button type="button" class="tbtn primary" id="chk">Check</button><button type="button" class="tbtn" id="show">Show me</button></div>`;
    else if (st.kind === "drag") {
      const used = C.fill.filter(Boolean), left = st.reuse ? st.bank : st.bank.filter(v => { const k = st.bank.filter(x => x === v).length - used.filter(x => x === v).length; return k > 0; });
      const chip = v => `<button type="button" class="chip" data-chip="${v}" aria-pressed="${C.sel === v}">${v}</button>`;
      input = st.rowsOf ? `<div class="bank rows" role="group" aria-label="Note names to drag">${[left.filter(v => v.length === 1), left.filter(v => v.includes("♯")), left.filter(v => v.includes("♭"))].map(r => `<div class="bankrow">${r.map(chip).join("")}</div>`).join("")}</div>`
        : `<div class="bank" role="group" aria-label="${st.mode === "names" ? "Note names" : "Intervals"} to drag">${left.map(chip).join("")}</div>`;
      input += `
      ${C.showHint ? `<p class="guide">${st.hint}</p>` : ""}<div class="row"><button type="button" class="tbtn primary" id="chkD">Check</button>${C.showHint ? "" : `<button type="button" class="tbtn" id="hintD">Hint</button>`}<button type="button" class="tbtn" id="show">Show me</button></div>`;
    }
    else input = `<div class="opts" role="group" aria-label="Answers">${st.opts.map(o => `<button type="button" class="ans" data-o="${o}">${o}</button>`).join("")}</div><div class="row"><button type="button" class="tbtn" id="show">Show me</button></div>`;
    const tbl = st.table ? (C.sev ? `<div class="tblw"><table class="tbl"><caption class="sr">Seventh chord qualities</caption><thead><tr><th scope="col">Triad</th><th scope="col">7th</th><th scope="col">Chord</th></tr></thead><tbody><tr><td>major</td><td>major</td><td>major seventh (△7)</td></tr><tr><td>major</td><td>minor</td><td>dominant seventh (7)</td></tr><tr><td>minor</td><td>minor</td><td>minor seventh (m7)</td></tr><tr><td>diminished</td><td>minor</td><td>half-diminished seventh (ø7)</td></tr><tr><td>diminished</td><td>diminished</td><td>fully diminished seventh (°7)</td></tr><tr><td>minor</td><td>major</td><td>minor-major seventh (m(△7))</td></tr><tr><td>augmented</td><td>minor</td><td>augmented seventh (+7)</td></tr><tr><td>augmented</td><td>major</td><td>augmented major seventh (+△7)</td></tr></tbody></table></div>`
      : `<div class="tblw"><table class="tbl"><caption class="sr">Triad qualities</caption><thead><tr><th scope="col">3rd</th><th scope="col">5th</th><th scope="col">Triad</th></tr></thead><tbody><tr><td>major</td><td>perfect</td><td>major</td></tr><tr><td>minor</td><td>perfect</td><td>minor</td></tr><tr><td>minor</td><td>diminished</td><td>diminished</td></tr><tr><td>major</td><td>augmented</td><td>augmented</td></tr><tr><td>perfect 4th (no 3rd)</td><td>perfect</td><td>sus4</td></tr></tbody></table></div>`) : "";
    $("step").innerHTML = `<h2>${st.title} · ${C.k + 1} of ${C.steps.length}</h2><p class="q">${st.q}</p>${st.kb && st.showKb ? kbSVG(st.kb[0], st.kb[1]) : ""}${st.kb && !st.showKb ? `<div class="row"><button type="button" class="tbtn" id="kbBtn">Show it on a keyboard</button></div>` : ""}${tbl}${input}<p class="fb" id="fb"></p>`;
    if ($("kbBtn")) $("kbBtn").onclick = () => { st.showKb = true; render(); const f = $("step").querySelector(".ans"); if (f) f.focus(); };
    if (st.hl && st.kind === "note") play([midi(C.notes[st.hl[0]])], .9);
  }
  function correct(st) {
    C.busy = false;
    $("done").insertAdjacentHTML("beforeend", `<li><b>${st.title}${/[?.]$/.test(st.title) ? "" : "."}</b> ${st.why}</li>`);
    if (st.after) st.after();
    C.k++; picked = { l: null, a: 0 }; tries = 0; C.fill = null; C.showHint = false; render();
    const f = $("step").querySelector(".ans"); if (f) f.focus();
  }
  function wrong(st, msg) { C.ok = false; tries++; const fb = $("fb"); fb.className = "fb bad"; fb.innerHTML = msg + (tries >= 2 ? " Use <b>Show me</b> if you're stuck." : ""); }
  $("step").addEventListener("click", e => {
    const st = C.steps[C.k]; if (!st) return;
    const L = e.target.closest("[data-l]"), A = e.target.closest("[data-a]"), O = e.target.closest("[data-o]");
    if (L) { picked.l = +L.dataset.l; document.querySelectorAll("[data-l]").forEach(b => b.setAttribute("aria-pressed", String(b === L))); return; }
    if (A) { picked.a = +A.dataset.a; document.querySelectorAll("[data-a]").forEach(b => b.setAttribute("aria-pressed", String(b === A))); return; }
    if (e.target.id === "show") { if (C.busy) return; C.busy = true; if (st.kind === "drag") { C.fill = st.ans.slice(); C.lock = st.ans.map(() => true); C.bad = []; drawStaves(); }
      $("fb").className = "fb"; $("fb").innerHTML = st.kind === "drag" ? st.why : `The answer: <b>${st.kind === "note" ? nm(st.ans) : st.ans}</b>. ${st.why}`; C.ok = false; setTimeout(() => correct(st), st.kind === "drag" ? 2200 : 1600); return; }
    if (st.kind === "drag") {
      if (e.target.id === "hintD") { C.showHint = true; render(); const h = $("step").querySelector(".guide"); if (h) { h.tabIndex = -1; h.focus(); } return; }
      if (e.target.id === "chkD") return checkDrag(st);
      const ch = e.target.closest("[data-chip]"); if (ch) { if (ch.dataset.dragged) { delete ch.dataset.dragged; return; } C.sel = C.sel === ch.dataset.chip ? null : ch.dataset.chip; renderBank(st); return; }
    }
    if (e.target.id === "chk" && st.kind === "note") {
      if (picked.l == null) { $("fb").className = "fb bad"; $("fb").textContent = "Choose a letter first."; return; }
      if (picked.l === st.ans.l && picked.a === st.ans.a) return correct(st);
      if (picked.l !== st.ans.l) { const d = st.ans.l - picked.l; return wrong(st, `Not quite: count the lines and spaces again. Your note is ${Math.abs(d)} step${Math.abs(d) > 1 ? "s" : ""} ${d > 0 ? "too low" : "too high"}. ${C.clef === "treble" ? "Treble clef lines: E G B D F; spaces: F A C E." : "Bass clef lines: G B D F A; spaces: A C E G."}`); }
      return wrong(st, `The letter is right; look at the accidental in front of the note.`);
    }
    if (O) { if (C.busy) return; if (O.dataset.o === st.ans) { C.busy = true; O.classList.add("right"); setTimeout(() => correct(st), 350); } else { O.classList.add("wrong"); wrong(st, hintFor(st, O.dataset.o)); } }
  });
  // ---------- drag and drop (pointer: mouse, pen or touch; or choose a chip, then a box) ----------
  function renderBank(st) { const keep = C.sel; render(); C.sel = keep; const b = $("step").querySelector(`[data-chip="${CSS.escape(keep || "")}"]`); if (b) b.focus(); }
  function place(i, v) { const st = C.steps[C.k]; if (!st || st.kind !== "drag" || C.lock[i]) return; C.fill[i] = v; C.bad = C.bad.filter(x => x !== i); C.sel = null; $("fb").className = "fb"; render(); const sl = $("staves").querySelector(`[data-slot="${i}"]`); if (sl) sl.focus(); }
  $("staves").addEventListener("click", e => { const sl = e.target.closest("[data-slot]"), st = C.steps[C.k]; if (!sl || !st || st.kind !== "drag" || Date.now() - (C.dropT || 0) < 400) return; const i = +sl.dataset.slot; if (C.lock[i]) return;
    if (C.sel) place(i, C.sel); else if (C.fill[i]) { C.fill[i] = null; render(); const f = $("staves").querySelector(`[data-slot="${i}"]`); if (f) f.focus(); }
    else { $("fb").className = "fb"; $("fb").textContent = "Choose a " + (st.mode === "names" ? "name" : "number") + " first, then this box (or drag one here)."; } });
  // dragging: the ghost moves with a GPU transform once per frame, and the boxes' positions are measured once when the drag starts
  let drag = null, raf = 0;
  $("step").addEventListener("pointerdown", e => { const ch = e.target.closest("[data-chip]"); if (!ch || e.button > 0) return;
    drag = { ch, v: ch.dataset.chip, x: e.clientX, y: e.clientY, cx: e.clientX, cy: e.clientY, ghost: null, over: null, boxes: null }; try { ch.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault(); });
  const frame = () => { raf = 0; if (!drag || !drag.ghost) return;
    drag.ghost.style.transform = `translate3d(${drag.cx}px,${drag.cy}px,0) translate(-50%,-50%) rotate(-3deg)`;
    const hit = drag.boxes.find(b => drag.cx >= b.r.left - 6 && drag.cx <= b.r.right + 6 && drag.cy >= b.r.top - 6 && drag.cy <= b.r.bottom + 6), sl = hit ? hit.el : null;
    if (drag.over !== sl) { if (drag.over) drag.over.classList.remove("over"); if (sl) sl.classList.add("over"); drag.over = sl; } };
  window.addEventListener("pointermove", e => { if (!drag) return; drag.cx = e.clientX; drag.cy = e.clientY;
    if (!drag.ghost) { if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 3) return;
      drag.ghost = drag.ch.cloneNode(true); drag.ghost.classList.add("ghost"); drag.ghost.removeAttribute("aria-pressed"); drag.ghost.setAttribute("aria-hidden", "true"); document.body.appendChild(drag.ghost);
      drag.boxes = [...$("staves").querySelectorAll("[data-slot]:not(.ok)")].map(el => ({ el, r: el.getBoundingClientRect() })); }
    if (!raf) raf = requestAnimationFrame(frame); });
  const endDrag = e => { if (!drag) return; const d = drag; drag = null; if (raf) { cancelAnimationFrame(raf); raf = 0; } if (!d.ghost) return; d.ghost.remove(); d.ch.dataset.dragged = "1"; setTimeout(() => delete d.ch.dataset.dragged, 50);
    C.dropT = Date.now();   // the browser may also send a click to the box under the pointer: ignore it
    if (d.over) { d.over.classList.remove("over"); place(+d.over.dataset.slot, d.v); } };
  // listen on the whole window, so a drop always lands even if the browser doesn't keep the pointer on the name being dragged
  window.addEventListener("pointerup", endDrag); window.addEventListener("pointercancel", () => { if (drag && drag.ghost) drag.ghost.remove(); if (drag && drag.over) drag.over.classList.remove("over"); drag = null; });
  function checkDrag(st) {
    if (C.fill.some(v => !v)) { $("fb").className = "fb bad"; $("fb").textContent = "Fill every box first."; return; }
    const bad = st.ans.map((a, i) => C.fill[i] === a ? -1 : i).filter(i => i >= 0);
    if (!bad.length) { C.lock = st.ans.map(() => true); drawStaves(); return correct(st); }
    tries++; C.ok = false; st.ans.forEach((a, i) => { if (C.fill[i] === a) C.lock[i] = true; });
    const msg = st.judge(bad[0], C.fill[bad[0]], tries); C.bad = bad; bad.forEach(i => C.fill[i] = null); render();
    $("fb").className = "fb bad"; $("fb").innerHTML = `${bad.length === 1 ? "One box isn't right" : bad.length + " boxes aren't right"} (the right ones are now locked in green). ${msg}${tries >= 2 ? " Use <b>Show me</b> if you're stuck." : ""}`;
  }
  function hintFor(st, v) {
    if (st.title === "How far apart?") return "Count the letter names from the lower note up to the higher one, counting both notes.";
    if (/^Root to/.test(st.title)) return "Count every key, white or black, from the root up to the other note, then find that number. Use the keyboard picture if it helps.";
    if (st.title === "Find the root" && isSus()) return "No arrangement stacks in 3rds, so look for the note with a perfect 4th and a perfect 5th above it.";
    if (st.title === "Find the root") return C.sev ? "Find the two notes a 2nd apart: the upper one of that pair is the root." : "Find the two notes a 4th apart: the upper one is the root.";
    return "Not quite. Look at the step above for the information you need.";
  }
  function finish() {
    if (MODE === "spell") C.known = C.tones.length, C.placed = true, drawSpell();
    const T = C.tones, sym = nm(T[0]) + SYM[C.q] + (C.inv ? "/" + nm(C.notes[0]) : ""), q = C.sev ? SEV[C.q][0] : isSus() ? "sus4 chord" : TRI[C.q][0] + " triad", fig = C.sev ? FIG7[C.inv] : FIG3[C.inv];
    $("step").innerHTML = `<h2>Done</h2><p class="summary">${nm(T[0])} ${q}, ${INV[C.inv]}.</p><p>Spelled from the root: <b>${T.map(nm).join(" – ")}</b>. Chord symbol: <b>${sym}</b>. Figure: <b>${fig}</b>.</p><p>${C.ok ? "All steps right on the first try." : "Finished. Try another chord, and see if you can do every step on the first try."}</p><div class="row"><button type="button" class="tbtn primary" id="again">Next chord</button></div>`;
    $("again").onclick = start; $("again").focus();
    if (window.SAprogress) SAprogress.record((MODE === "spell" ? "Spelling " : "") + (C.sev ? "seventh chords, step by step" : "triads, step by step").replace(/^./, c => MODE === "spell" ? c : c.toUpperCase()), C.ok);
    if (window.SFX) SFX.play(C.ok);
    play(C.notes.map(midi), 1.6);
  }


  // ================= SPELL A CHORD: root + quality + position → notes =================
  let MODE = "id";
  const qName = () => C.sev ? SEV[C.q][0] : isSus() ? "sus4 chord" : TRI[C.q][0] + " triad";
  function stackOf(n) { const o0 = C.clef === "treble" ? 4 : (C.tones[0].l >= 4 ? 2 : 3), out = [{ ...C.tones[0], o: o0 }]; for (let i = 1; i < n; i++) { let x = { ...C.tones[i], o: out[i - 1].o }; while (pos(x) <= pos(out[i - 1])) x.o++; out.push(x); } return out; }
  function drawSpell() {
    const st0 = C.steps[C.k] || {};
    if (st0.kind === "drag") {
      // a ladder from the root up: the root is given, a box for each other member (with the interval it needs, once letters are known)
      if (!C.fill) { C.fill = st0.ans.map(() => null); C.lock = st0.ans.map(() => false); C.bad = []; C.sel = null; }
      const rows = st0.rows.map((r, i) => { const v = C.fill[i], ok = C.lock[i];
        return `<li><span class="lad-l">${r.label}</span><button type="button" class="slot lad${v ? " full" : ""}${ok ? " ok" : ""}${C.bad.includes(i) ? " bad" : ""}" data-slot="${i}" aria-label="${r.aria}: ${v || "empty"}${ok ? ", correct" : ""}"${ok ? ' aria-disabled="true"' : ""}>${v || ""}</button></li>`; }).reverse().join("");
      $("staves").innerHTML = `<figure class="ladder"><ol class="lad" reversed>${rows}<li><span class="lad-l">root</span><span class="slot lad ok given">${nm(C.tones[0])}</span></li></ol><figcaption>Built from the root${isSus() ? "" : ", in 3rds"}</figcaption></figure>`;
      return;
    }
    const st = C.steps[C.k] || {}, n = Math.max(1, C.known || 1), stack = stackOf(n).map((x, i) => i < (C.known || 1) ? x : null).filter(Boolean);
    const shown = stack.map((x, i) => i < (C.known || 0) ? x : { ...x, l: x.l, a: C.letterOnly && i === C.known - 1 ? 0 : x.a });
    let h = `<figure>${staffSVG(C.known ? stack : [stack[0]], C.clef, { hl: st.stackHl || [], labels: (C.known ? stack : [stack[0]]).map((x, i) => `${memOf(i)}: ${nm(x)}`), aria: `Built so far, from the root: ${stack.map((x, i) => memOf(i) + " " + nm(x)).join(", ")}` })}<figcaption>Built from the root${isSus() ? "" : ", in 3rds"}</figcaption></figure>`;
    if (C.placed) h += `<figure>${staffSVG(C.notes, C.clef, { hl: [0], labels: C.notes.map(nm), aria: `In ${INV[C.inv]}, from the bottom: ${C.notes.map(nm).join(", ")}` })}<figcaption>In ${INV[C.inv]}, close position</figcaption></figure>`;
    void shown; $("staves").innerHTML = h;
  }
  function buildSpell() {
    const S = [], T = C.tones, n = T.length, R = T[0], up = t => { let x = { ...t, o: 4 }; while (pos(x) <= pos({ ...R, o: 4 })) x.o++; return x; };
    C.known = 1; C.placed = false; C.read = -1;
    const task = `Spell <b>${nm(R)} ${qName()}</b> in <b>${INV[C.inv]}</b>, close position.`; $("task").innerHTML = "Your task: " + task;
    const IVQ = C.sev ? SEV[C.q][1] : TRI[C.q][1], need = [isSus() ? ["4th", 5, "perfect 4th"] : ["3rd", IVQ[0], IVQ[0] === 4 ? "major 3rd" : "minor 3rd"], ["5th", IVQ[1], IVQ[1] === 7 ? "perfect 5th" : IVQ[1] === 6 ? "diminished 5th" : "augmented 5th"]];
    if (C.sev) need.push(["7th", IVQ[2], IVQ[2] === 11 ? "major 7th" : IVQ[2] === 10 ? "minor 7th" : "diminished 7th"]);
    const recipe = isSus() ? "A sus4 chord has a perfect 4th (in place of the 3rd) and a perfect 5th above the root." : C.sev ? `A ${SEV[C.q][0]} chord is a ${TRI[SEV[C.q][2]][0]} triad plus a ${need[2][2]}: a ${need[0][2]}, a ${need[1][2]} and a ${need[2][2]} above the root.` : `A ${TRI[C.q][0]} triad has a ${need[0][2]} and a ${need[1][2]} above the root.`;
    const ivWords = hs => hs.map((h, i) => [{ 3: "minor 3rd", 4: "major 3rd", 5: "perfect 4th" }, { 6: "diminished 5th", 7: "perfect 5th", 8: "augmented 5th" }, { 9: "diminished 7th", 10: "minor 7th", 11: "major 7th" }][i][h]).join(" + ");
    const mine = ivWords(IVQ), others = (C.sev ? Object.keys(SEV).map(k => SEV[k][1]) : Object.keys(TRI).map(k => TRI[k][1])).map(ivWords).filter(x => x !== mine);
    S.push({ title: "Step 1: the recipe", q: `${task}<br>First: which intervals above the root make a ${qName()}?`, kind: "opts", opts: shuffle([mine, ...shuffle(others).slice(0, 3)]), ans: mine, why: recipe });
    // step 2: spell each member: the letter (count up in 3rds) and its sharp, flat or natural (count half steps), in one drag step
    const mems = need.map(([mem, h, ivn], j) => { const t = T[j + 1], num = (isSus() ? [4, 5] : [3, 5, 7])[j], plain = up({ l: t.l, a: 0 }); return { mem, t, num, h, ivn, hPlain: midi(plain) - midi({ ...R, o: 4 }) }; });
    const seq = num => LET.repeat(3).slice(R.l, R.l + num).split("").join(" – ");
    S.push({ title: "Step 2: spell the chord", kind: "drag", reuse: true, bank: USUAL, rowsOf: 3, ans: mems.map(m => nm(m.t)),
      rows: mems.map(m => ({ label: `${m.mem}: ${m.ivn} (${m.h} half steps)`, aria: `The ${m.mem}, a ${m.ivn}, ${m.h} half steps above ${nm(R)}` })),
      q: `Spell each member above ${nm(R)}. First find its letter: ${isSus() ? "the 4th is 4 letters" : "the 3rd is 3 letters"} up from ${LET[R.l]}, the 5th is 5${C.sev ? ", the 7th is 7" : ""}, counting ${LET[R.l]} as 1. Then count half steps from ${nm(R)} up to that letter and add a sharp or flat if the box needs a different number.`,
      hint: `Letters: ${seq(C.sev ? 7 : 5)}${isSus() ? "" : ", skipping every other one"}. ${mems.map((m, k) => `${k ? "plain" : "Plain"} ${LET[m.t.l]} is ${m.hPlain} half steps above ${nm(R)}`).join("; ")}. A sharp adds a half step; a flat takes one away.`,
      judge: (i, v, tr) => { const m = mems[i], gl = "CDEFGAB".indexOf(v[0]);
        if (gl !== m.t.l) return tr >= 2 ? `The ${m.mem}: ${seq(m.num)}, ${m.num} letters, so some kind of ${LET[m.t.l]}.` : `Check the letter of the ${m.mem}: ${m.num} letters up from ${LET[R.l]}, counting ${LET[R.l]} as 1.`;
        return tr >= 2 ? `The ${m.mem}: plain ${LET[m.t.l]} is ${m.hPlain} half steps above ${nm(R)} and the box needs ${m.h}, so ${m.h === m.hPlain ? `plain ${LET[m.t.l]}` : `${m.h > m.hPlain ? "raise" : "lower"} it: ${nm(m.t)}`}.` : `The ${m.mem} has the right letter; count the half steps from ${nm(R)} up to ${v} and compare with the ${m.h} the box needs.`; },
      why: `Spelled from the root: ${T.map(nm).join(" – ")}.`, after: () => { C.known = T.length; } });
    // step 3: the inversion picks the bass note, and close position stacks the rest above it, in one question
    const order = C.notes.map(nm).join(" – "), rots = T.map((_, k) => T.slice(k).concat(T.slice(0, k)).map(nm).join(" – "));
    S.push({ title: "Step 3: put it in position", q: `Spelled from the root, the chord is <b>${T.map(nm).join(" – ")}</b>. ${INV[C.inv][0].toUpperCase() + INV[C.inv].slice(1)} puts the <b>${memOf(C.inv)}</b> in the bass; stack the other notes as close as possible above it. What's the order from the bottom up?`,
      kind: "opts", opts: shuffle([...new Set([order, ...rots, T.slice().reverse().map(nm).join(" – ")])]).slice(0, 4).concat([order]).filter((x, i, a) => a.indexOf(x) === i), ans: order,
      why: `The ${memOf(C.inv)}, ${nm(T[C.inv])}, goes on the bottom; then keep going around the chord (root, ${isSus() ? "4th" : "3rd"}, 5th${C.sev ? ", 7th" : ""}, root…): ${order}.`, after: () => { C.placed = true; } });
    return S;
  }
  // ---------- sound ----------
  let AC = null;
  // chords sound on brass: trumpets for treble clef, trombones for bass clef (synthesized until the recordings have loaded)
  const BRASS = () => C && C.clef === "bass" ? "trombone" : "trumpet";
  const ctx = () => { const Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return null; if (!AC) AC = new Ctx(); if (AC.state === "suspended") AC.resume(); return AC; };
  ["pointerdown", "keydown"].forEach(ev => document.addEventListener(ev, function warm() { ["pointerdown", "keydown"].forEach(x => document.removeEventListener(x, warm, true)); if (ctx() && window.SAMP) { SAMP.load(AC, "trumpet"); SAMP.load(AC, "trombone"); } }, true));
  function play(ms, dur = 1.4, gap = 0) {
    if (!ctx() || (window.SFX && SFX.muted && SFX.muted())) return;
    const t0 = AC.currentTime + .05, k = BRASS();
    if (window.SAMP && SAMP.ready(AC, k)) { const out = AC.createGain(); out.gain.value = gap ? .9 : 1.2 / Math.sqrt(ms.length); out.connect(AC.destination);
      ms.forEach((m, i) => SAMP.note(AC, k, m, t0 + i * gap + (gap ? 0 : i * .012), .85, out, dur)); return; }
    if (window.SAMP) SAMP.load(AC, k);
    ms.forEach((m, i) => { const t = t0 + i * gap, f = 440 * Math.pow(2, (m - 69) / 12), g = AC.createGain(); g.connect(AC.destination);
      [[1, 1], [2, .4], [3, .15]].forEach(([h, a]) => { const o = AC.createOscillator(), og = AC.createGain(); o.type = "triangle"; o.frequency.value = f * h; og.gain.value = a; o.connect(og); og.connect(g); o.start(t); o.stop(t + dur + .4); });
      const v = .18 / Math.sqrt(gap ? 1 : ms.length); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .01); g.gain.setTargetAtTime(v * .4, t + .02, .4); g.gain.setTargetAtTime(0, t + dur, .1); });
  }
  $("playC").onclick = () => play(C.notes.map(midi), 1.6);
  $("playA").onclick = () => play(C.notes.map(midi), .8, .7);

  function start() { make(); C.steps = MODE === "spell" ? buildSpell() : build(); C.k = 0; C.fill = null; C.showHint = false; picked = { l: null, a: 0 }; tries = 0; $("done").innerHTML = ""; render(); }
  document.querySelectorAll("[data-mode]").forEach(b => b.onclick = () => { MODE = b.dataset.mode; document.querySelectorAll("[data-mode]").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    $("modeNote").textContent = MODE === "spell" ? "Spell: you're given a root, a quality and a position, and you build the chord note by note." : "Identify: you see a chord on the staff and work out what it is."; $("playC").parentNode.style.display = MODE === "spell" ? "none" : ""; $("task").hidden = MODE !== "spell"; start(); });
  $("new").onclick = start; ["kind", "acc", "inv", "clef"].forEach(id => $(id).onchange = start);
  start();
  window.__fs = { get C() { return C; } };   // used by automated tests
})();
