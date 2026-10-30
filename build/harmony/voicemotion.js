window.FAM = (() => {
  // ===== Voice Motion and Polyphony: content (lesson + drills). Engine: build/harmony/engine.js =====
  const KEYS = ["C", "G", "F", "D", "B♭", "A", "E♭"];
  const RANGE = { S: [60, 79], A: [55, 74], T: [48, 67], B: [40, 60] };
  const RANGE_TXT = { S: "C4–G5", A: "G3–D5", T: "C3–G4", B: "E2–C4" };
  const VNAME = { S: "soprano", A: "alto", T: "tenor", B: "bass" };
  const IVN = ["unison", "2nd", "3rd", "4th", "5th", "6th", "7th", "octave"];
  const ivName = st => st === 0 ? "unison" : st % 7 === 0 ? (st === 7 ? "octave" : "two octaves") : (st > 7 ? "compound " : "") + IVN[st % 7];
  const dirName = n => n > 0 ? "up" : n < 0 ? "down" : "stays";

  // diatonic note i steps above the tonic (octave 4 for i = 0…6)
  const dn = (H, k, i) => { const m = H.mod(i, 7), s = k.scale[m]; return H.N(s.l, s.a, s.o + Math.floor(i / 7)); };
  const step = (H, n) => n.o * 7 + n.l;   // diatonic position (letters only)
  const voicesSpec = (k, cols, extra = {}) => Object.assign({ type: "voices", vf: k.vf, sig: k.sig, cols }, extra);

  // ---------- motion ----------
  function classify(H, s1, s2, b1, b2) {
    const ds = H.midi(s2) - H.midi(s1), db = H.midi(b2) - H.midi(b1);
    if (!ds && !db) return "none";
    if (!ds || !db) return "oblique";
    if (Math.sign(ds) !== Math.sign(db)) return "contrary";
    return step(H, s1) - step(H, b1) === step(H, s2) - step(H, b2) ? "parallel" : "similar";
  }
  const MOT = { contrary: "Contrary", oblique: "Oblique", similar: "Similar", parallel: "Parallel" };
  const MOTWHY = { contrary: "the voices move in opposite directions", oblique: "one voice holds (or repeats) its note while the other moves", similar: "both voices move in the same direction, but by different intervals", parallel: "both voices move in the same direction by the same interval" };
  function motionPair(H, want) {
    const k = H.key(H.rnd(KEYS), "major");
    for (let g = 0; g < 400; g++) {
      const si = 7 + Math.floor(Math.random() * 9), bi = -9 + Math.floor(Math.random() * 8);
      const s1 = dn(H, k, si), b1 = dn(H, k, bi);
      const ds = H.rnd([-3, -2, -1, 0, 1, 2, 3, 4]), db = H.rnd([-4, -3, -2, -1, 0, 1, 2, 3]);
      const s2 = dn(H, k, si + ds), b2 = dn(H, k, bi + db);
      if (H.midi(s1) < RANGE.S[0] || H.midi(s2) > RANGE.S[1] || H.midi(b1) < RANGE.B[0] || H.midi(b2) > RANGE.B[1] || H.midi(s2) < RANGE.S[0] || H.midi(b2) < RANGE.B[0]) continue;
      const c = classify(H, s1, s2, b1, b2);
      if (c === want) return { k, s1, s2, b1, b2, ds, db };
    }
    return null;
  }
  const descMove = (H, a, b) => { const d = step(H, b) - step(H, a); return d ? `${dirName(d)} a ${ivName(Math.abs(d))}` : "stays on " + H.nm(a); };

  // ---------- parallels ----------
  function isPerfect(H, lo, hi) { const st = step(H, hi) - step(H, lo), se = H.midi(hi) - H.midi(lo); if (st % 7 === 4 && se % 12 === 7) return "5"; if (st % 7 === 0 && se % 12 === 0) return st === 0 ? "1" : "8"; return null; }
  function passage(H, want) {
    const k = H.key(H.rnd(KEYS), "major"), OK = [2, 4, 5, 7, 9, 11];
    for (let g = 0; g < 600; g++) {
      let bi = -7 + Math.floor(Math.random() * 6), si = bi + H.rnd(OK);
      const S = [dn(H, k, si)], B = [dn(H, k, bi)];
      for (let i = 1; i < 4; i++) {
        const nb = bi + H.rnd([-3, -2, -1, 1, 2, 3, 4, -4]), cand = OK.map(x => nb + x).filter(x => Math.abs(x - si) <= 3 && x !== si || Math.random() < .05);
        if (!cand.length) break; bi = nb; si = H.rnd(cand); S.push(dn(H, k, si)); B.push(dn(H, k, bi));
      }
      if (S.length < 4) continue;
      if (S.some(n => H.midi(n) < 57 || H.midi(n) > 79) || B.some(n => H.midi(n) < 40 || H.midi(n) > 60)) continue;
      if (S.some((n, i) => isPerfect(H, B[i], n) === null && ![2, 5].includes((step(H, n) - step(H, B[i])) % 7))) continue;   // consonances only (3rds, 6ths, perfect)
      const hits = [];
      for (let i = 1; i < 4; i++) {
        const p0 = isPerfect(H, B[i - 1], S[i - 1]), p1 = isPerfect(H, B[i], S[i]);
        const ms = H.midi(S[i]) - H.midi(S[i - 1]), mb = H.midi(B[i]) - H.midi(B[i - 1]);
        if (p0 && p0 === p1 && ms && mb && Math.sign(ms) === Math.sign(mb)) hits.push({ at: i, kind: p0 });
      }
      const kinds = hits.map(h => h.kind);
      if (want === "none" ? hits.length === 0 : hits.length === 1 && kinds[0] === want) return { k, S, B, hit: hits[0] };
    }
    return null;
  }

  // ---------- SATB ----------
  function satb(H, want) {
    const k = H.key(H.rnd(KEYS), "major"), d = H.rnd([1, 2, 4, 5, 6]), c = H.diat(k, d);
    const cand = (pcs, lo, hi) => { const out = []; for (let o = 1; o <= 6; o++) pcs.forEach((p, ti) => { const n = H.N(p.l, p.a, o), m = H.midi(n); if (m >= lo && m <= hi) out.push({ n, m, ti }); }); return out; };
    const ext = 3, Bs = cand([c.tones[0]], RANGE.B[0] - ext, RANGE.B[1] + ext);
    const pools = { S: cand(c.tones, RANGE.S[0] - ext, RANGE.S[1] + ext), A: cand(c.tones, RANGE.A[0] - ext, RANGE.A[1] + ext), T: cand(c.tones, RANGE.T[0] - ext, RANGE.T[1] + ext) };
    const found = [];
    for (const b of Bs) for (const t of pools.T) for (const a of pools.A) for (const s of pools.S) {
      const v = { S: s, A: a, T: t, B: b }, ms = [s.m, a.m, t.m, b.m];
      if (new Set([s.ti, a.ti, t.ti, 0]).size < 3) continue;                       // complete triad
      if (ms[0] === ms[1] || ms[1] === ms[2] || ms[2] === ms[3]) continue;         // no unisons (clearer on the staff)
      const cross = s.m < a.m || a.m < t.m || t.m < b.m;
      const space = Math.abs(s.m - a.m) > 12 || Math.abs(a.m - t.m) > 12;
      const out = ["S", "A", "T", "B"].filter(x => v[x].m < RANGE[x][0] || v[x].m > RANGE[x][1]);
      const kind = (cross ? 1 : 0) + (space ? 1 : 0) + (out.length ? 1 : 0) > 1 ? "multi" : cross ? "cross" : space ? "space" : out.length ? "range" : "ok";
      if (kind === want && (want !== "range" || out.length === 1) && Math.abs(t.m - b.m) <= 19) found.push({ v, out });
    }
    if (!found.length) return null;
    const f = H.rnd(found);
    return { k, c, d, v: f.v, out: f.out };
  }
  const SATBA = { cross: "Voice crossing", space: "Spacing: more than an octave between upper voices", range: "A voice is out of its range", ok: "Nothing: it's well written" };

  // ---------- textures (generated audio) ----------
  const MEL_KEYS = [60, 62, 65, 67];   // C, D, F, G
  const MAJ = [0, 2, 4, 5, 7, 9, 11];
  const sc = (t, i) => t + 12 * Math.floor(i / 7) + MAJ[((i % 7) + 7) % 7];
  function melody(H, n = 8) {
    const t = H.rnd(MEL_KEYS); let i = H.rnd([0, 2, 4]); const deg = [i];
    for (let j = 1; j < n - 1; j++) { i += H.rnd([-2, -1, -1, 1, 1, 2, 0]); i = Math.max(-1, Math.min(8, i)); deg.push(i); }
    deg.push(H.rnd([0, 7].filter(x => Math.abs(x - i) <= 4)) ?? 0);
    return { t, deg, m: deg.map(d => sc(t, d)) };
  }
  const B = .5;   // beat length (s)
  function texture(H, kind) {
    const mel = melody(H), ev = [], t = mel.t;
    const line = (ms, start = 0, oct = 0, vel = .85, durs) => ms.forEach((m, i) => ev.push([m + oct, start + (durs ? durs.slice(0, i).reduce((a, b) => a + b, 0) : i * B), (durs ? durs[i] : B) * .95, vel]));
    const len = mel.m.length * B;
    if (kind === "mono") line(mel.m);
    if (kind === "drone") { line(mel.m); ev.push([t - 24, 0, len + .4, .55]); ev.push([t - 17, 0, len + .4, .45]); }
    if (kind === "organum") { line(mel.m); line(mel.m.map(m => m - H.rnd([5, 7])), 0, 0, .7); }
    if (kind === "homo") {
      line(mel.m);
      mel.deg.forEach((d, i) => { if (i % 2) return; const r = [0, 3, 4].find(x => [x, x + 2, x + 4].some(y => (((d - y) % 7) + 7) % 7 === 0)) ?? 0; const root = sc(t, r) - 12; ev.push([root - 12, i * B, B * 1.9, .55], [root, i * B, B * 1.9, .4], [sc(t, r + 2) - 12, i * B, B * 1.9, .4], [sc(t, r + 4) - 12, i * B, B * 1.9, .4]); });
    }
    if (kind === "canon") { const n = mel.m.length; line(mel.m); line(mel.m, 2 * B, -12, .75); ev.push(...[]); void n; }
    if (kind === "free") {   // non-imitative: a slower, independent second line
      line(mel.m);
      let i = H.rnd([-7, -5, -3]); const ms = [], durs = [];
      for (let tt = 0; tt < mel.m.length; tt += 2) { ms.push(sc(t, i)); durs.push(2 * B); i += H.rnd([-2, -1, 1, 2]); }
      line(ms, B * .5, 0, .75, durs.map((d, j) => j === durs.length - 1 ? d - B * .5 : d));
    }
    if (kind === "hetero") {
      line(mel.m);
      mel.m.forEach((m, i) => { const st = i * B + .03; if (i < mel.m.length - 1 && Math.random() < .55) { const mid = mel.m[i + 1] > m ? sc(t, mel.deg[i] + 1) : mel.m[i + 1] < m ? sc(t, mel.deg[i] - 1) : sc(t, mel.deg[i] + 1); ev.push([m - 12, st, B * .48, .6], [mid - 12, st + B * .5, B * .45, .6]); } else ev.push([m - 12, st, B * .93, .6]); });
    }
    if (kind === "hocket") mel.m.forEach((m, i) => ev.push([m + (i % 2 ? -12 : 0), i * B, B * .9, .85]));
    if (kind === "anti") { line(mel.m.slice(0, 4)); line(mel.m.slice(0, 4), 4 * B + .3, -12, .8); }
    return { ev, timbre: "voice" };
  }
  const TEX = { mono: "Monophony", homo: "Homophony (melody + chords)", canon: "Imitative polyphony (canon)", free: "Non-imitative polyphony", hetero: "Heterophony", drone: "Melody over a drone", organum: "Parallel organum" };
  const TEXWHY = {
    mono: "a single melodic line with nothing else.", homo: "one melody supported by chords that move with it.", canon: "the second voice enters later with the same melody: imitation (a canon).",
    free: "two independent lines with different melodic material: non-imitative polyphony.", hetero: "two performers play the same tune at once, one adding ornaments: heterophony.",
    drone: "a melody over a steady, held bass note (and its fifth).", organum: "a second voice doubles the melody a perfect 4th or 5th below throughout: parallel organum.",
  };
  const FACTS = [
    ["Which kind of organum moves the added voice in parallel 4ths or 5ths with the chant?", "parallel organum", ["free organum", "melismatic organum", "hocket"], "Parallel organum (9th–10th centuries); the 9th-century treatise Musica enchiriadis describes it."],
    ["In which kind of organum does the added voice sing long melismas over held notes of the chant?", "melismatic organum", ["parallel organum", "free organum", "canon"], "Melismatic organum (11th–12th centuries), as in Pérotin's music."],
    ["In free organum, the added voice…", "moves note-against-note using a variety of intervals", ["only moves in parallel 5ths", "holds one note throughout", "imitates the chant later"], "Free organum (10th–11th centuries) mixes contrary, oblique and parallel motion."],
    ["Polyphony in Western music history begins with…", "organum", ["the fugue", "the canon", "the madrigal"], "Organum added a voice to plainchant during the Medieval period."],
    ["A texture where each voice echoes a musical idea from another is…", "imitative polyphony", ["non-imitative polyphony", "homophony", "heterophony"], "Canons and fugues are imitative."],
    ["In a canon, the voices…", "perform the same melody, starting at different times", ["play different melodies", "play the same melody in parallel 5ths", "alternate single notes"], "A round is a simple canon."],
    ["Hocket is…", "a melody split between voices, a few notes at a time", ["a held bass note", "two groups answering each other", "a fast ornament"], "The voices take turns with single notes or small groups."],
    ["Antiphony is…", "two groups singing or playing alternately, like call and response", ["one melody varied by two performers at once", "a melody over a drone", "a canon at the octave"], "The groups may also be separated in the performance space."],
    ["Heterophony occurs when…", "performers vary the same melody at the same time", ["a melody is accompanied by chords", "independent melodies are combined", "one melody is sung alone"], "Each performer adds ornaments, rhythm changes or pitch variations to one tune."],
    ["Which traditions are known for heterophony?", "Middle Eastern music, Southeast Asian gamelan, Celtic fiddle tunes", ["Renaissance motets only", "Classical string quartets", "Baroque fugues"], "Heterophony is relatively rare in Western classical music."],
    ["Which traditions feature a melody over a drone?", "Indian classical music, bagpipes, Central Asian throat singing", ["fugues", "barbershop quartets", "the Classical symphony"], "Drones are found around the world."],
    ["Linear independence in polyphony means…", "each line has melodic interest and rhythmic integrity of its own", ["all voices move in parallel", "every voice has the same rhythm", "the voices never form chords"], "Balanced with harmonic coherence and contrapuntal interaction."],
    ["Harmonic coherence in polyphony means…", "the combined lines still form intended harmonies or dissonances", ["every chord is a major triad", "the voices sing in unison", "there is no bass line"], "Independent lines must still work together vertically."],
    ["A fugue is an example of…", "imitative polyphony", ["heterophony", "monophony", "non-imitative polyphony"], "Fugue subjects enter in successive voices."],
    ["Melody plus chords that move with it is…", "homophony", ["polyphony", "heterophony", "monophony"], "Most hymns and pop songs are homophonic."],
    ["When is a note “oblique” motion?", "when one voice holds or repeats while the other moves", ["when both voices move up", "when both voices leap", "when voices cross"], "Oblique: one voice stays."],
    ["Which motion gives voices the most independence?", "contrary motion", ["parallel motion", "similar motion", "unison doubling"], "Opposite directions keep the lines distinct."],
    ["Which parallels should be avoided in part-writing?", "parallel perfect unisons, fifths and octaves", ["parallel thirds and sixths", "parallel fourths in the bass", "all parallel motion"], "Parallel 3rds and 6ths are fine."],
    ["Which melodic interval should be avoided in part-writing (common in harmonic minor)?", "the augmented 2nd", ["the major 2nd", "the perfect 4th", "the minor 3rd"], "Between le (♭6̂) and ti (raised 7̂)."],
    ["In a root-position triad in four voices, which tone is usually doubled?", "the root", ["the third", "the leading tone", "the seventh"], "The fifth may be doubled; the third only rarely."],
    ["Stems in SATB on two staves: which voices have stems up?", "soprano and tenor", ["alto and bass", "soprano and alto", "tenor and bass"], "Soprano and tenor up; alto and bass down."],
    ["What is the largest usual distance between adjacent upper voices?", "an octave", ["a fifth", "a tenth", "two octaves"], "Bass and tenor may be farther apart."],
  ];

  function make(mode, H) {
    if (mode === "motion") {
      const want = H.rnd(Object.keys(MOT)), p = motionPair(H, want);
      if (!p) return null;
      const spec = voicesSpec(p.k, [{ t: [H.nmO(p.s1)], b: [H.nmO(p.b1)] }, { t: [H.nmO(p.s2)], b: [H.nmO(p.b2)] }]);
      const iv1 = step(H, p.s1) - step(H, p.b1), iv2 = step(H, p.s2) - step(H, p.b2);
      return H.mc("What kind of motion is this between the two voices?", MOT[want], Object.values(MOT), `Upper voice: ${descMove(H, p.s1, p.s2)}. Lower voice: ${descMove(H, p.b1, p.b2)}. The interval between them goes from a ${ivName(iv1)} to a ${ivName(iv2)}. That's ${want} motion: ${MOTWHY[want]}.`, { kicker: "Motion types", staff: spec, playQ: { chords: [[H.midi(p.s1), H.midi(p.b1)], [H.midi(p.s2), H.midi(p.b2)]], timbre: "voice" }, playQLabel: "Play", topic: "motion" });
    }
    if (mode === "parallels") {
      const want = H.rnd(["5", "8", "none", "none"]), p = passage(H, want);
      if (!p) return null;
      const cols = p.S.map((s, i) => ({ t: [H.nmO(s)], b: [H.nmO(p.B[i])] }));
      const ans = { "5": "Parallel 5ths", "8": "Parallel octaves", none: "No forbidden parallels" }[want];
      const ivs = p.S.map((s, i) => ivName(step(H, s) - step(H, p.B[i]))).join(", ");
      const done = voicesSpec(p.k, cols.map((c, i) => Object.assign({}, c, { hl: p.hit && (i === p.hit.at || i === p.hit.at - 1), lab: String(i + 1) })));
      return H.mc("Does this two-voice passage have forbidden parallels?", ans, ["Parallel 5ths", "Parallel octaves", "No forbidden parallels", "Parallel 3rds (forbidden)"], `Intervals between the voices: ${ivs}. ${p.hit ? `From note ${p.hit.at} to note ${p.hit.at + 1} both voices move the same way from a perfect ${p.hit.kind === "5" ? "5th" : "octave"} to another perfect ${p.hit.kind === "5" ? "5th" : "octave"}: parallel ${p.hit.kind === "5" ? "5ths" : "octaves"}, which part-writing avoids.` : "No perfect 5th or octave moves in parallel to another one. (Parallel 3rds and 6ths are fine.)"}`, { kicker: "Parallels", staff: voicesSpec(p.k, cols), staffAns: done, playQ: { chords: p.S.map((s, i) => [H.midi(s), H.midi(p.B[i])]), timbre: "voice", gap: .8 }, playQLabel: "Play", topic: "voice" });
    }
    if (mode === "satb") {
      const want = H.rnd(["cross", "space", "range", "ok"]), x = satb(H, want);
      if (!x) return null;
      const v = x.v, spec = voicesSpec(x.k, [{ t: [H.nmO(v.S.n)], a: [H.nmO(v.A.n)], tn: [H.nmO(v.T.n)], b: [H.nmO(v.B.n)] }]);
      const names = ["S", "A", "T", "B"].map(y => `${VNAME[y]} ${H.nmO(v[y].n)}`).join(", ");
      const why = want === "cross" ? `${v.S.m < v.A.m ? "The alto is above the soprano" : v.A.m < v.T.m ? "The tenor is above the alto" : "The bass is above the tenor"}: voice crossing hides the independence of the parts.`
        : want === "space" ? `${Math.abs(v.S.m - v.A.m) > 12 ? "Soprano and alto" : "Alto and tenor"} are more than an octave apart. Keep adjacent upper voices within an octave (the bass and tenor may be farther apart).`
        : want === "range" ? `The ${VNAME[x.out[0]]} (${H.nmO(v[x.out[0]].n)}) is outside its range, ${RANGE_TXT[x.out[0]]}.` : "Every voice is in range, no voices cross, and the upper voices are within an octave of each other.";
      return H.mc(`This ${x.c.sym} chord is written for SATB choir (stems: soprano and tenor up, alto and bass down). What's wrong with it?`, SATBA[want], Object.values(SATBA), `${names}. ${why}`, { kicker: "Ranges & spacing", staff: spec, playQ: { chords: [[v.S.m, v.A.m, v.T.m, v.B.m]], timbre: "voice", dur: 1.6 }, playQLabel: "Play", topic: "voice" });
    }
    // texture
    if (Math.random() < .55) {
      const kinds = Object.keys(TEX), kind = H.rnd(kinds), snd = texture(H, kind);
      return H.mc("Listen. Which texture is this?", TEX[kind], kinds.filter(x => x !== kind).map(x => TEX[x]), `It's ${TEX[kind].toLowerCase().replace(/ \(.*\)/, "")}: ${TEXWHY[kind]}`, { kicker: "Hear the texture", playQ: snd, playQLabel: "Play the example", play: snd, playLabel: "Play again", auto: true, topic: "texture" });
    }
    const [q, a, w, why] = H.rnd(FACTS);
    return H.mc(q, a, w, why, { kicker: "Polyphony & texture", topic: "texture" });
  }

  function reference(H) {
    return `<div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Motion</th><th scope="col">What the voices do</th></tr></thead><tbody>
      <tr><td>Contrary</td><td>move in opposite directions</td></tr><tr><td>Oblique</td><td>one holds or repeats, the other moves</td></tr>
      <tr><td>Similar</td><td>same direction, different intervals</td></tr><tr><td>Parallel</td><td>same direction, same interval (avoid with perfect unisons, 5ths, 8ves)</td></tr></tbody></table></div>
      <div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Voice</th><th scope="col">Range</th><th scope="col">Stems</th></tr></thead><tbody>${["S", "A", "T", "B"].map(v => `<tr><td>${VNAME[v]}</td><td>${RANGE_TXT[v]}</td><td>${v === "S" || v === "T" ? "up" : "down"}</td></tr>`).join("")}</tbody></table></div>
      <p class="legend">Textures: monophony (one line) · homophony (melody + chords) · polyphony (independent lines: imitative or non-imitative) · heterophony (one melody, varied at once).</p>`;
  }

  const ex2 = (H, k, s1, s2, b1, b2) => ({ spec: voicesSpec(k, [{ t: [s1], b: [b1] }, { t: [s2], b: [b2] }]), play: { chords: [[H.midi(H.parse(s1)), H.midi(H.parse(b1))], [H.midi(H.parse(s2)), H.midi(H.parse(b2))]], timbre: "voice" } });
  const lesson = { steps: [
    { title: "Four voices", kick: "Ranges and stems", render: (H, k, U) => {
      const C = H.key("G", "major");
      const sp = voicesSpec(C, [{ t: ["B4"], a: ["G4"], tn: ["D4"], b: ["G2"] }, { t: ["C5"], a: ["G4"], tn: ["E4"], b: ["C3"] }], {});
      return `<p>In <b>part-writing</b>, each line (“part” or “voice”) is imagined as a section of a choir: <b>soprano, alto, tenor, bass</b>. The bass is always the lowest voice; the others are the <i>upper voices</i>.</p>
      <div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Voice</th><th scope="col">Practical range</th><th scope="col">Staff</th><th scope="col">Stems</th></tr></thead><tbody>${["S", "A", "T", "B"].map(v => `<tr><td>${VNAME[v]}</td><td>${RANGE_TXT[v]}</td><td>${v === "S" || v === "A" ? "treble" : "bass"}</td><td>${v === "S" || v === "T" ? "up" : "down"}</td></tr>`).join("")}</tbody></table></div>`
      + U.fig(sp, "Soprano and alto share the treble staff, tenor and bass the bass staff. Never write three voices on one staff.", { play: { chords: [[71, 67, 62, 43], [72, 67, 64, 48]], timbre: "voice", dur: 1.5 } });
    } },
    { title: "Four kinds of motion", kick: "Two voices at a time", render: (H, k, U) => {
      const C = H.key("C", "major");
      const ex = [["Contrary", ex2(H, C, "E5", "F5", "C3", "A2"), "opposite directions"], ["Oblique", ex2(H, C, "G4", "A4", "C3", "C3"), "one voice holds, the other moves"], ["Similar", ex2(H, C, "E4", "G4", "C3", "D3"), "same direction, different intervals"], ["Parallel", ex2(H, C, "E4", "F4", "C3", "D3"), "same direction, same interval (3rds here)"]];
      return `<p>Between any two voices, motion from one pair of notes to the next is one of four kinds. (A single pair of notes can't “have” motion: it's always from one pair to the next.)</p>
      <div class="lfigs">${ex.map(([n, e, w]) => U.fig(e.spec, `<b>${n}</b>: ${w}`, { small: true, play: e.play })).join("")}</div>`
      + H.check("The soprano moves up a step while the bass holds its note. What motion is that?", "Oblique", ["Contrary", "Similar", "Parallel"], "One voice stays: oblique.");
    } },
    { title: "Smooth voice leading", kick: "Nearest notes", render: (H, k, U) => {
      const G = H.key("G", "major");
      const sp = voicesSpec(G, [{ t: ["B4"], a: ["G4"], tn: ["D4"], b: ["G2"] }, { t: ["C5"], a: ["G4"], tn: ["E4"], b: ["C3"] }, { t: ["B4"], a: ["F♯4"], tn: ["D4"], b: ["D3"] }, { t: ["B4"], a: ["G4"], tn: ["D4"], b: ["G2"] }]);
      return `<ul><li>Move each voice to its <b>nearest</b> possible chord tone.</li><li>Keep <b>common tones</b> in the same voice.</li><li>Look hard at any leap in an upper voice; keep necessary leaps small (a 3rd or 4th). Leaps are more common in the bass.</li><li>Avoid the melodic <b>augmented 2nd</b> (le to ti in harmonic minor) and the augmented 4th.</li></ul>`
      + U.fig(sp, "I – IV – V – I in G major: the upper voices move by step or hold common tones.", { play: { chords: [[71, 67, 62, 43], [72, 67, 64, 48], [71, 66, 62, 50], [71, 67, 62, 43]], timbre: "voice", gap: 1 } });
    } },
    { title: "Forbidden parallels", kick: "5ths and octaves", render: (H, k, U) => {
      const C = H.key("C", "major");
      const p5 = ex2(H, C, "G4", "A4", "C3", "D3"), p8 = ex2(H, C, "C4", "D4", "C3", "D3"), fix = ex2(H, C, "E4", "D4", "C3", "G2");
      return `<p>The strongest rule in part-writing: avoid <b>parallel perfect unisons, fifths and octaves</b>, even at the expense of normal doubling, spacing or voice leading. Perfect intervals moving in parallel make two voices sound like one, and the independence of the parts is lost. Parallel 3rds and 6ths are fine.</p>
      <div class="lfigs">${U.fig(p5.spec, "Parallel 5ths (avoid)", { small: true, play: p5.play })}${U.fig(p8.spec, "Parallel octaves (avoid)", { small: true, play: p8.play })}${U.fig(fix.spec, "Contrary motion: no problem", { small: true, play: fix.play })}</div>
      <p class="note">It is often useful to check the motion between important points too (successive strong beats or bars), not just between neighboring notes.</p>`
      + H.check("Bass C3 → D3, soprano G4 → A4. What's the problem?", "Parallel 5ths", ["Parallel octaves", "Voice crossing", "Nothing"], "C–G to D–A: perfect 5th to perfect 5th, both voices up.");
    } },
    { title: "Crossing, spacing, doubling", kick: "Four-part chords", render: (H, k, U) => {
      const G = H.key("G", "major");
      const good = voicesSpec(G, [{ t: ["D5"], a: ["B4"], tn: ["G4"], b: ["G2"] }]), cross = voicesSpec(G, [{ t: ["B4"], a: ["D5"], tn: ["G4"], b: ["G2"] }]), space = voicesSpec(G, [{ t: ["D5"], a: ["G4"], tn: ["B3"], b: ["G2"] }].map(c => c)), wide = voicesSpec(G, [{ t: ["G5"], a: ["B4"], tn: ["D3"], b: ["G2"] }]);
      return `<ul><li><b>Doubling:</b> a triad in four voices doubles one note. In root position, double the <b>root</b> (or the 5th); double the 3rd only rarely.</li>
      <li><b>Voicing (spacing):</b> a wide gap between bass and tenor is normal, but keep adjacent <i>upper</i> voices within an octave. Close voicing: soprano, alto and tenor as close as possible. Open voicing: a chord tone is skipped between them.</li>
      <li><b>Voice crossing:</b> when a voice goes below the next lower voice (soprano under alto). Avoid it: it hides the independence of the parts.</li></ul>
      <div class="lfigs">${U.fig(good, "Close voicing, root doubled", { small: true, play: { chords: [[74, 71, 67, 43]], timbre: "voice", dur: 1.5 } })}${U.fig(space, "Open voicing", { small: true, play: { chords: [[74, 67, 59, 43]], timbre: "voice", dur: 1.5 } })}${U.fig(cross, "Voice crossing: alto above soprano", { small: true, play: { chords: [[71, 74, 67, 43]], timbre: "voice", dur: 1.5 } })}${U.fig(wide, "Too wide: more than an octave between alto and tenor", { small: true, play: { chords: [[79, 71, 50, 43]], timbre: "voice", dur: 1.5 } })}</div>`;
    } },
    { title: "Beyond SATB", kick: "Melody and bass in pop", render: (H, k, U) => {
      const mel = ["G4", "G4", "A4", "B4", "C5", "C5", "B4", "B4", "C5"], bas = ["C3", "B2", "A2", "G2", "F2", "E2", "D2", "G2", "C3"], sy = ["C", "G/B", "Am", "Em/G", "F", "C/E", "Dm", "G", "C"];
      const bar = (i0, n, d) => ({ t: [mel.slice(i0, i0 + n).map((x, i) => ({ k: [x], d, sym: sy[i0 + i] }))], b: [bas.slice(i0, i0 + n).map(x => ({ k: [x], d }))] });
      const sp = { type: "score", clefs: ["treble", "bass"], time: "4/4", vf: "C", sig: {}, bpm: 92, minBar: 70, bars: [bar(0, 4, "q"), bar(4, 4, "q"), bar(8, 1, "w")] };
      return `<p>The same principles work far beyond four-part chorale writing. In almost any style, the two lines listeners hear most clearly are the <b>melody</b> and the <b>bass</b>, so they form a two-voice counterpoint, whatever the chords in between are doing.</p>
      <ul><li>In a pop song, the <b>vocal melody</b> and the <b>bass line</b> (bass guitar, synth bass or the pianist's left hand) are the outer voices. Contrary and oblique motion between them sounds strong and independent; long stretches of parallel motion make them sound like one line.</li>
      <li>A <b>stepwise bass</b> under a held or rising melody (often using inverted chords, like C – G/B – Am) is one of the most common pop and rock textures: the slash chords exist to make the bass move by step.</li>
      <li>The <b>inner parts</b> (guitar chords, keyboard pads, horn backgrounds) often move in parallel chord shapes; that's a texture choice, not an error. Common tones and nearest-note moves still make pads and backing vocals sound smooth.</li>
      <li>In jazz, the 3rds and 7ths of the chords (the <b>guide tones</b>) form smooth inner lines that move by step from chord to chord.</li></ul>`
      + U.fig(sp, "A descending bass under a melody that holds and then rises: mostly contrary and oblique motion between the outer voices.")
      + H.check("In a pop song, which two lines form the main counterpoint?", "the vocal melody and the bass line", ["the guitar and the drums", "the two middle voices of the keyboard part", "the backing vocals and the snare"], "They're the outer voices, the ones listeners hear most clearly.");
    } },
    { title: "Textures", kick: "Listen", render: (H, k, U) => {
      const row = (kind, name, what) => `<tr><td><b>${name}</b></td><td>${what}</td><td>${U.sound(texture(H, kind), "Play")}</td></tr>`;
      return `<p>How many lines are sounding, and how do they relate? That's a piece's <b>texture</b>. Each example is newly made every time you open this step.</p>
      <div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Texture</th><th scope="col">What you hear</th><th scope="col">Example</th></tr></thead><tbody>
      ${row("mono", "Monophony", "one melodic line")}${row("homo", "Homophony", "one melody with chords that move with it")}${row("free", "Polyphony", "multiple independent melodic lines at once")}${row("hetero", "Heterophony", "two or more performers varying the same melody at the same time, with ornaments, rhythm changes or pitch variations")}</tbody></table></div>
      <p>Heterophony is common in Middle Eastern music, Southeast Asian gamelan, and Appalachian, Celtic and other fiddle traditions; it's relatively rare in Western classical music.</p>`;
    } },
    { title: "Early polyphony", kick: "Drone and organum", render: (H, k, U) => {
      const row = (kind, name, what) => `<tr><td><b>${name}</b></td><td>${what}</td><td>${kind ? U.sound(texture(H, kind), "Play") : "—"}</td></tr>`;
      return `<p>Around the world, harmony often begins with a melody sung or played over a steady <b>drone</b>: in Indian classical music, bagpipe playing (British Isles, Eastern Europe, North Africa) and Central Asian throat singing, among others.</p>
      <p>In Western music, polyphony begins with <b>organum</b> in the Medieval period (roughly the 9th to 13th centuries), when a second voice was added to monophonic plainchant (“Gregorian chant”):</p>
      <div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Kind</th><th scope="col">How the added voice moves</th><th scope="col">Hear</th></tr></thead><tbody>
      ${row("drone", "Melody over a drone", "the lower voice holds one note (often with its 5th)")}${row("organum", "Parallel organum (9th–10th c.)", "in parallel 4ths or 5ths above or below the chant; described in the treatise <i>Musica enchiriadis</i>")}${row("", "Free organum (10th–11th c.)", "note-against-note, using a variety of intervals")}${row("", "Melismatic organum (11th–12th c.)", "long melismas over held notes of the chant in the lower voice (as in Pérotin's music)")}</tbody></table></div>`;
    } },
    { title: "Imitation and beyond", kick: "Canon, hocket, antiphony", render: (H, k, U) => {
      return `<p><b>Imitative polyphony:</b> each voice echoes an idea presented by another. A <b>canon</b> is the strictest kind: every voice performs the same melody, starting at different times (a round is a simple canon). A <b>fugue</b> uses imitation in a freer, more developed way. ${U.sound(texture(H, "canon"), "Hear a canon")}</p>
      <p><b>Non-imitative polyphony:</b> each voice moves independently with different melodic material. ${U.sound(texture(H, "free"), "Hear two independent lines")}</p>
      <p>Good polyphony balances <b>linear independence</b> (each line has its own melodic and rhythmic interest), <b>harmonic coherence</b> (the lines still form intended harmonies) and <b>contrapuntal interaction</b> (imitation and dialogue between the lines).</p>
      <p><b>Hocket:</b> a melody shared out between voices a note or a few notes at a time. ${U.sound(texture(H, "hocket"), "Hear hocket")} <b>Antiphony:</b> two groups alternate, like call and response, sometimes placed apart in the space. ${U.sound(texture(H, "anti"), "Hear antiphony")}</p>
      <p>Canon became a favorite tool of 20th- and 21st-century composers, especially minimalists, who sometimes set canonic lines just one beat (or less) apart.</p>`;
    } },
    { title: "Quick check", kick: "Before the drills", render: (H) => {
      return H.check("Both voices move up, the top by a step and the bottom by a 4th. What motion?", "Similar", ["Parallel", "Contrary", "Oblique"], "Same direction, different intervals: similar.")
        + H.check(FACTS[17][0], FACTS[17][1], FACTS[17][2], FACTS[17][3]) + H.check(FACTS[0][0], FACTS[0][1], FACTS[0][2], FACTS[0][3]) + H.check(FACTS[8][0], FACTS[8][1], FACTS[8][2], FACTS[8][3]) + H.check(FACTS[5][0], FACTS[5][1], FACTS[5][2], FACTS[5][3]);
    } },
  ] };

  return {
    key: "silverapps-voicemotion-v1", lesson, make, reference,
    modes: [{ id: "motion", kicker: "Motion types" }, { id: "parallels", kicker: "Parallels" }, { id: "satb", kicker: "Ranges & spacing" }, { id: "texture", kicker: "Textures" }],
    topics: [],
  };
})();
