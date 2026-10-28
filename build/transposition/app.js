(() => {
  // ---------- Pitch engine ----------
  // A note is { l: letter 0–6 (C–B), a: accidental −1..1, step: octave*7 + letter } — C4 (middle C) is step 28.
  const LET = "CDEFGAB";
  const NAT = [0, 2, 4, 5, 7, 9, 11];
  const ACC = { "-2": "𝄫", "-1": "♭", "0": "", "1": "♯", "2": "𝄪" };
  const SPOKEN_ACC = { "-2": " double flat", "-1": " flat", "0": "", "1": " sharp", "2": " double sharp" };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const accHTML = s => esc(s).replace(/([♭♯♮𝄫𝄪])/g, '<span class="acc">$1</span>');
  const speak = s => String(s).replace(/𝄫/g, " double flat").replace(/𝄪/g, " double sharp").replace(/♭/g, " flat").replace(/♯/g, " sharp").replace(/♮/g, " natural");
  const oct = n => Math.floor(n.step / 7);
  const midi = n => 12 * (oct(n) + 1) + NAT[n.step % 7] + n.a;
  const mk = (step, a) => ({ l: ((step % 7) + 7) % 7, a, step });
  function transpose(n, st, se) {
    const step = n.step + st, l = ((step % 7) + 7) % 7;
    const base = 12 * (Math.floor(step / 7) + 1) + NAT[l];
    return { l, a: midi(n) + se - base, step };
  }
  const nm = n => LET[n.l] + ACC[n.a] + oct(n);
  const nmSpoken = n => LET[n.l] + SPOKEN_ACC[n.a] + " " + oct(n);
  const pcName = n => LET[n.l] + ACC[n.a];
  // Avoid double accidentals and the rarer spellings E♯, B♯, F♭, C♭ in single notes.
  const okNote = n => Math.abs(n.a) <= 1 && !(n.a === 1 && (n.l === 2 || n.l === 6)) && !(n.a === -1 && (n.l === 3 || n.l === 0));

  // ---------- Instruments (from the transposition tables) ----------
  const IV_SPOKEN = { M2: "major 2nd", m3: "minor 3rd", P4: "perfect 4th", P5: "perfect 5th", M6: "major 6th", m7: "minor 7th", M9: "major 9th", M13: "major 13th", M16: "major 16th", P8: "octave", P15: "two octaves" };
  const I = (id, name, key, grp, iv, st, se, extra = {}) => Object.assign({ id, name, key, grp, iv, st, se }, extra);
  const INS = [
    I("afl", "Alto flute", "G", "ww", "P4", -3, -5),
    I("eh", "English horn", "F", "ww", "P5", -4, -7),
    I("cleb", "Clarinet in E♭", "E♭", "cl", "m3", 2, 3),
    I("clbb", "Clarinet in B♭", "B♭", "cl", "M2", -1, -2),
    I("cla", "Clarinet in A", "A", "cl", "m3", -2, -3),
    I("bcl", "Bass clarinet", "B♭", "cl", "M9", -8, -14),
    I("cbcl", "Contrabass clarinet", "B♭", "cl", "M16", -15, -26, { lo: 29, hi: 38 }),
    I("ssx", "Soprano saxophone", "B♭", "sx", "M2", -1, -2),
    I("asx", "Alto saxophone", "E♭", "sx", "M6", -5, -9),
    I("tsx", "Tenor saxophone", "B♭", "sx", "M9", -8, -14),
    I("bsx", "Baritone saxophone", "E♭", "sx", "M13", -12, -21),
    I("ptA", "Piccolo trumpet in A", "A", "br", "M6", 5, 9, { hi: 35 }),
    I("ptB", "Piccolo trumpet in B♭", "B♭", "br", "m7", 6, 10, { hi: 35 }),
    I("tpt", "Trumpet in B♭", "B♭", "br", "M2", -1, -2),
    I("flg", "Flugelhorn", "B♭", "br", "M2", -1, -2),
    I("hn", "Horn in F", "F", "br", "P5", -4, -7),
    I("euph", "Euphonium (treble clef)", "B♭", "br", "M9", -8, -14),
    I("glk", "Glockenspiel", "", "oct", "P15", 14, 24, { lo: 25, hi: 32 }),
    I("picc", "Piccolo", "", "oct", "P8", 7, 12),
    I("cel", "Celesta", "", "oct", "P8", 7, 12),
    I("xyl", "Xylophone", "", "oct", "P8", 7, 12),
    I("chm", "Chimes", "", "oct", "P8", 7, 12, { hi: 36 }),
    I("bfl", "Bass flute", "", "oct", "P8", -7, -12),
    I("cbn", "Contrabassoon", "", "oct", "P8", -7, -12, { clef: "bass", lo: 16, hi: 27 }),
    I("ten", "Tenor voice", "", "oct", "P8", -7, -12),
    I("gtr", "Guitar", "", "oct", "P8", -7, -12),
    I("cb", "Contrabass", "", "oct", "P8", -7, -12, { clef: "bass", lo: 16, hi: 27 }),
  ];
  const BY = Object.fromEntries(INS.map(x => [x.id, x]));
  const GRPS = { cl: "Clarinets", sx: "Saxophones", ww: "Other woodwinds", br: "Brass", oct: "Octave transposers" };
  const dirWord = x => x.st > 0 ? "higher" : "lower";
  const ivText = x => `${x.iv} ${dirWord(x)}`;
  const ivSpoken = x => `${IV_SPOKEN[x.iv]} ${dirWord(x)}`;
  const ivHTML = x => `<span aria-hidden="true">${esc(ivText(x))}</span><span class="sr">${esc(ivSpoken(x))}</span>`;
  const sounds = x => x.grp === "oct" ? `sounds ${x.iv === "P15" ? "two octaves" : "an octave"} ${dirWord(x)} than written` : `sounds a ${x.iv} ${dirWord(x)} than written`;

  // ---------- Key signatures ----------
  const LETFIFTHS = [0, 2, 4, -1, 1, 3, 5];
  const fifthsOf = t => LETFIFTHS[t.l] + 7 * t.a;
  const TON = ["C♭", "G♭", "D♭", "A♭", "E♭", "B♭", "F", "C", "G", "D", "A", "E", "B", "F♯", "C♯"];
  const VFKEY = ["Cb", "Gb", "Db", "Ab", "Eb", "Bb", "F", "C", "G", "D", "A", "E", "B", "F#", "C#"];
  const tonicOf = f => { const s = TON[f + 7]; return mk(28 + LET.indexOf(s[0]), s[1] === "♯" ? 1 : s[1] === "♭" ? -1 : 0); };
  const sigText = n => n === 0 ? "no sharps or flats" : `${Math.abs(n)} ${n > 0 ? "sharp" : "flat"}${Math.abs(n) > 1 ? "s" : ""}`;
  const sigShort = n => n === 0 ? "no ♯/♭" : `${Math.abs(n)}${n > 0 ? "♯" : "♭"}`;
  const keyLabel = f => `${TON[f + 7]} major · ${sigShort(f)}`;
  const keyHTML = f => `<span class="nw">${accHTML(keyLabel(f))}</span>`;
  const keySpoken = f => `${speak(TON[f + 7])} major, ${sigText(f)}`;
  function trKey(f, st, se) {
    const t = transpose(tonicOf(f), st, se);
    if (Math.abs(t.a) > 1) return null;
    const g = fifthsOf(t);
    return Math.abs(g) <= 7 ? g : null;
  }

  // ---------- Staff (VexFlow) ----------
  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  const GLYPH = { "-2": "bb", "-1": "b", "0": "n", "1": "#", "2": "##" };
  // Clef for a pitch shown at concert pitch.
  // Plain treble or bass clef only (no 8va/8vb clefs); written ranges are chosen so ledger lines stay reasonable.
  function clefFor(n) { return { clef: n.step >= 27 ? "treble" : "bass" }; }
  function drawStaff(el, o) {
    el._args = o;
    el.innerHTML = "";
    if (!window.Vex || !Vex.Flow) { el.innerHTML = '<p class="staff-msg">The notation engine didn\'t load. Reload the page.</p>'; return; }
    const VF = Vex.Flow, ink = cssVar("--ink");
    const r = new VF.Renderer(el, VF.Renderer.Backends.SVG);
    const stave = new VF.Stave(4, 20, 400);
    o.ann ? stave.addClef(o.clef, "default", o.ann) : stave.addClef(o.clef);
    if (o.ks != null) stave.addKeySignature(VFKEY[o.ks + 7]);
    const sx = stave.getNoteStartX();
    const W = Math.round(sx + (o.note ? 90 : 30)), H = 150;
    stave.setWidth(W - 8);
    r.resize(W, H);
    const ctx = r.getContext();
    ctx.setFillStyle(ink); ctx.setStrokeStyle(ink);
    stave.setStyle({ fillStyle: ink, strokeStyle: ink });
    stave.setContext(ctx).draw();
    if (o.note) {
      const n = o.note, shift = o.ann === "8va" ? 7 : o.ann === "8vb" ? -7 : 0, ds = n.step - shift;
      const sn = new VF.StaveNote({ clef: o.clef, keys: [LET[n.l].toLowerCase() + "/" + Math.floor(ds / 7)], duration: "w" });
      sn.setStyle({ fillStyle: ink, strokeStyle: ink });
      if (sn.setLedgerLineStyle) sn.setLedgerLineStyle({ strokeStyle: ink, fillStyle: ink });
      if (n.a !== 0) sn.addModifier(new VF.Accidental(GLYPH[n.a]), 0);
      const voice = new VF.Voice({ num_beats: 4, beat_value: 4 }).addTickables([sn]);
      new VF.Formatter().joinVoices([voice]).format([voice], stave.getNoteEndX() - stave.getNoteStartX() - 16);
      voice.draw(ctx, stave);
    }
    const svg = el.querySelector("svg");
    if (svg) {
      let vb = `0 0 ${W} ${H}`;
      try { const bb = svg.getBBox(); if (bb.width) vb = `${bb.x - 4} ${bb.y - 8} ${bb.width + 8} ${bb.height + 16}`; } catch (e) {}
      svg.setAttribute("viewBox", vb);
      svg.removeAttribute("width"); svg.removeAttribute("height");
      svg.style.width = "100%"; svg.style.height = "auto";
      svg.setAttribute("role", "img"); svg.setAttribute("focusable", "false");
      svg.setAttribute("aria-label", o.label || "Staff");
    }
  }
  const clefWords = o => `${o.clef === "bass" ? "Bass" : "Treble"} clef${o.ann === "8va" ? " with 8va (sounds an octave higher than shown)" : o.ann === "8vb" ? " with 8vb (sounds an octave lower than shown)" : ""}`;
  function noteStaff(el, n, o) { drawStaff(el, Object.assign({ note: n, label: `${clefWords(o)}, whole note ${nmSpoken(n)}.` }, o)); }
  function redrawStaves() { document.querySelectorAll(".staff").forEach(el => el._args && drawStaff(el, el._args)); }
  try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", redrawStaves); } catch (e) {}

  // ---------- Piano (Web Audio) ----------
  let AC = null, bus = null, verb = null;
  function audio() {
    if (AC) { if (AC.state === "suspended") AC.resume(); return AC; }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    AC = new Ctx();
    const comp = AC.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3; comp.connect(AC.destination);
    verb = AC.createConvolver();
    const len = Math.floor(AC.sampleRate * 1.6), ir = AC.createBuffer(2, len, AC.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    verb.buffer = ir;
    const wet = AC.createGain(); wet.gain.value = 0.16; verb.connect(wet); wet.connect(comp);
    AC._out = comp;
    return AC;
  }
  function newBus() {
    if (bus) { const old = bus; old.gain.setTargetAtTime(0, AC.currentTime, 0.04); setTimeout(() => old.disconnect(), 400); }
    bus = AC.createGain(); bus.connect(AC._out); bus.connect(verb);
    return bus;
  }
  function pianoNote(out, m, t0, dur, vel) {
    const f = 440 * Math.pow(2, (m - 69) / 12);
    const B = 0.00035, decayBase = 3.2 * Math.pow(261.6 / f, 0.55);
    const filt = AC.createBiquadFilter(); filt.type = "lowpass"; filt.Q.value = 0.4;
    filt.frequency.setValueAtTime(Math.min(f * 9, 9000), t0);
    filt.frequency.exponentialRampToValueAtTime(Math.max(f * 2.2, 300), t0 + 1.2);
    const ng = AC.createGain(); ng.gain.value = vel * (f < 80 ? 1.6 : 1); filt.connect(ng); ng.connect(out);
    const end = t0 + dur;
    for (let n = 1; n <= 9; n++) {
      const fn = n * f * Math.sqrt(1 + B * n * n); if (fn > 12000) break;
      const o = AC.createOscillator(), g = AC.createGain(); o.frequency.value = fn;
      const amp = (n === 1 ? 1 : 0.55 / Math.pow(n, 1.25)) * (n === 2 ? 1.25 : 1);
      const tau = Math.max(0.15, decayBase / Math.pow(n, 0.7));
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(amp, t0 + 0.004);
      g.gain.setTargetAtTime(amp * 0.35, t0 + 0.004, 0.08 + tau * 0.05);
      g.gain.setTargetAtTime(0, t0 + 0.2, tau); g.gain.setTargetAtTime(0, end, 0.12);
      o.connect(g); g.connect(filt); o.start(t0); o.stop(end + 1);
    }
  }
  function playMidis(list, gap = 0.45) {
    if (!list.length || !audio()) return;
    const out = newBus(), t = AC.currentTime + 0.05;
    list.forEach((m, i) => pianoNote(out, m, t + i * gap, i === list.length - 1 ? 1.6 : 0.8, 0.32));
  }
  function playQ(q) {
    if (!q) return;
    if (q.sound) playMidis([midi(q.sound)]);
    else if (q.keyConcert != null) { const t = tonicOf(q.keyConcert), r = midi(t); playMidis([r, r + 4, r + 7, r + 12], 0.3); }
  }
  function autoPlay(q) { if (S.settings.auto !== false) playQ(q); }
  document.addEventListener("click", e => { if (e.target.closest("[data-play]")) playQ(Q[S.mode]); });
  const PLAY_BTN = label => `<div class="play-row"><button class="play" data-play="1"><svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M2 1l9 5-9 5z"/></svg>${label}</button></div>`;

  // ---------- State ----------
  const DEFAULTS = { grp: { cl: true, sx: true, ww: true, br: true, oct: true }, acc: "nat", auto: true };
  let S = { mode: "facts", settings: JSON.parse(JSON.stringify(DEFAULTS)), right: 0, total: 0, streak: 0, misses: [] };
  try { const saved = JSON.parse(localStorage.getItem("transposition-trainer") || "null"); if (saved) S = Object.assign(S, saved, { settings: Object.assign({}, S.settings, saved.settings, { grp: Object.assign({}, DEFAULTS.grp, (saved.settings || {}).grp) }) }); } catch (e) {}
  if (!["facts", "read", "write", "keysig"].includes(S.mode)) S.mode = "facts";
  const save = () => { try { localStorage.setItem("transposition-trainer", JSON.stringify({ mode: S.mode, settings: S.settings, right: S.right, total: S.total, streak: S.streak, misses: S.misses.slice(-40) })); } catch (e) {} };
  const Q = { facts: null, read: null, write: null, keysig: null };

  const rnd = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pool = () => { const p = INS.filter(x => S.settings.grp[x.grp]); return p.length ? p : INS; };
  const transposers = () => { const p = pool().filter(x => x.grp !== "oct"); return p.length ? p : INS.filter(x => x.grp !== "oct"); };
  const specOf = q => q.spec;
  const sameSpec = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  // Distinct transpositions other than x's own, used to build believable wrong answers.
  const otherMoves = x => { const seen = new Set([x.st + ":" + x.se]), out = []; INS.forEach(y => { const k = y.st + ":" + y.se; if (!seen.has(k)) { seen.add(k); out.push(y); } }); return out; };

  // ---------- Read it / Write it ----------
  function randomWritten(x) {
    const lo = x.lo ?? (x.clef === "bass" ? 16 : 26), hi = x.hi ?? (x.clef === "bass" ? 27 : 38);
    for (let i = 0; i < 200; i++) {
      const step = lo + Math.floor(Math.random() * (hi - lo + 1));
      const a = S.settings.acc === "nat" && Math.random() < .75 ? 0 : rnd([-1, 0, 1]);
      const w = mk(step, a), s = transpose(w, x.st, x.se);
      if (okNote(w) && okNote(s)) return w;
    }
    return mk(29, 0);
  }
  function noteChoices(correct, given, x, toward) {
    // toward = +1 when the answer is the sounding pitch (read), −1 when it is the written pitch (write)
    const t = (n, y, sign) => transpose(n, sign * y.st, sign * y.se);
    const wrongDir = t(given, x, -toward);
    const octErr = Math.abs(x.se) > 12 ? transpose(correct, x.st > 0 ? -7 : 7, x.st > 0 ? -12 : 12) : transpose(correct, x.st > 0 ? 7 : -7, x.st > 0 ? 12 : -12);
    const prio = x.grp === "oct" ? [wrongDir, octErr, given] : [wrongDir, octErr, given];
    const others = shuffle(otherMoves(x)).map(y => t(given, y, toward));
    const seen = new Set([midi(correct)]), picks = [];
    const tryAdd = n => { if (picks.length < 3 && okNote(n) && !seen.has(midi(n)) && n.step > 7 && n.step < 50) { seen.add(midi(n)); picks.push(n); } };
    shuffle(prio).slice(0, 2).forEach(tryAdd);
    others.forEach(tryAdd); prio.forEach(tryAdd);
    return [correct, ...picks].sort((a, b) => midi(a) - midi(b));
  }
  function makeNoteQ(mode, x, w) {
    const s = transpose(w, x.st, x.se);
    const q = { mode, ins: x, written: w, sound: s, tries: 0, done: false, spec: { mode, x: x.id, w: [w.step, w.a] } };
    q.given = mode === "read" ? w : s;
    q.answer = mode === "read" ? s : w;
    q.choices = noteChoices(q.answer, q.given, x, mode === "read" ? 1 : -1);
    q.correctValue = nm(q.answer);
    return q;
  }

  // ---------- Key sigs ----------
  function makeKeyQ(x, ty, given) {
    // ty "part": given the concert key, find the part's key. ty "concert": the reverse.
    const sign = ty === "part" ? -1 : 1;
    const ans = trKey(given, sign * x.st, sign * x.se);
    if (ans == null) return null;
    const concert = ty === "part" ? given : ans, part = ty === "part" ? ans : given;
    if (Math.abs(concert) > 6 || Math.abs(part) > 6) return null;
    const vals = new Set([ans]), cand = [trKey(given, -sign * x.st, -sign * x.se), given, ...shuffle(otherMoves(x)).map(y => trKey(given, sign * y.st, sign * y.se))];
    const wrongs = [];
    cand.forEach(v => { if (v != null && Math.abs(v) <= 7 && !vals.has(v) && wrongs.length < 3) { vals.add(v); wrongs.push(v); } });
    return { mode: "keysig", ins: x, ty, given, ans, keyConcert: concert, keyPart: part, choices: shuffle([ans, ...wrongs]), correctValue: String(ans), tries: 0, done: false, spec: { mode: "keysig", x: x.id, ty, g: given } };
  }

  // ---------- Facts ----------
  const mc = (text, answer, wrong, explain, extra) => {
    const w = shuffle([...new Set(wrong)].filter(v => v !== answer)).slice(0, 3);
    return Object.assign({ text, choices: shuffle([answer, ...w]), answer, explain }, extra || {});
  };
  const FACTS = [
    { text: "Which term means the pitch an instrument actually produces?", ans: "sounding pitch", wrong: ["written pitch", "the key of the instrument", "open key"], why: "Sounding pitch is what you hear; written pitch is what's on the page." },
    { text: "Which term means the pitch as it appears in the part?", ans: "written pitch", wrong: ["sounding pitch", "concert pitch", "the key of the instrument"], why: "For transposing instruments, the written pitch and the sounding pitch differ." },
    { text: "“Concert pitch” means…", ans: "the note name matches the standard pitch (C sounds as C)", wrong: ["the pitch as written in a transposing part", "one octave above the written pitch", "the pitch of the instrument's lowest note"], why: "In practice, concert pitch is almost always the same as sounding pitch." },
    { text: "In practice, concert pitch is almost always interchangeable with…", ans: "sounding pitch", wrong: ["written pitch", "the key of the instrument", "the transposition interval"], why: "Both mean the pitch you actually hear, named normally." },
    { text: "Before valves, how did horn and trumpet players play in different keys?", ans: "by changing lengths of tubing (crooks)", wrong: ["by changing mouthpieces", "by reading a different clef", "by retuning the bell"], why: "Each crook changed the instrument's fundamental. The music was written as if in C, so the fingerings didn't change." },
    { text: "Why were horn and trumpet parts written as if the instrument were in C?", ans: "so players could read the same notes whatever crook they used", wrong: ["because C was the only key available", "to make the parts sound higher", "to avoid using key signatures for strings"], why: "Swap the tubing, read the same notes." },
    { text: "Transposing notation lets a player switching between sizes of clarinet or saxophone…", ans: "keep the same fingering for each written note", wrong: ["read everything at concert pitch", "learn a new fingering for each size", "read a different clef for each size"], why: "A written G uses the same fingering on every saxophone, whatever pitch it sounds." },
    { text: "Writing the tenor saxophone at concert pitch would…", ans: "need many ledger lines", wrong: ["put the notes an octave too high", "make the key signature disappear", "change the fingerings"], why: "It sounds an octave and a major 2nd below written, so transposed notation keeps it on the staff." },
    { text: "How are tubas notated in practice?", ans: "at concert pitch, whatever size the tuba", wrong: ["a M2 above concert pitch", "a M9 above concert pitch", "in treble clef, transposed like a bass clarinet"], why: "Tubas aren't treated as transposing instruments; the player handles the size of the instrument." },
    { text: "A euphonium part in bass clef is written…", ans: "at concert pitch", wrong: ["a M9 above concert pitch", "a M2 above concert pitch", "an octave above concert pitch"], why: "In treble clef the euphonium transposes like a bass clarinet (sounds a M9 lower); in bass clef it's at concert pitch." },
    { text: "A euphonium part in treble clef sounds…", ans: "a M9 lower than written", wrong: ["at written pitch", "a M2 lower than written", "an octave lower than written"], why: "Treble-clef euphonium transposes like a bass clarinet or tenor sax." },
    { text: "What does a piccolo trumpet make easier?", ans: "playing in the upper register (it doesn't add higher notes)", wrong: ["playing lower notes", "playing notes no other trumpet can reach", "playing without transposing"], why: "Its range isn't really higher; the upper register is just easier." },
    { text: "What instrument do horn players usually mean by “horn in F”?", ans: "a double horn that combines B♭ and F horns", wrong: ["a single horn with an F crook", "a natural horn without valves", "a horn in E♭"], why: "Most music is played on the double horn, though it's called horn in F." },
    { text: "In older scores, which instruments were often written with no key signature at all?", ans: "horns, trumpets and timpani", wrong: ["clarinets and saxophones", "flutes, oboes and bassoons", "violins and violas"], why: "Modern scores give horns transposed key signatures like other transposing instruments." },
    { text: "Key signatures of transposing instruments…", ans: "transpose along with the notes", wrong: ["always match the concert key", "are always left out", "change only for brass instruments"], why: "Concert G major becomes A major for B♭ instruments." },
    { text: "Compared with concert pitch, a part for clarinet in B♭ is written…", ans: "a whole step higher than concert pitch", wrong: ["a whole step lower than concert pitch", "at concert pitch", "a minor 3rd higher than concert pitch"], why: "Write it up so the instrument brings it back down." },
    { text: "Music with no key signatures may mark its score as…", ans: "a “transposed score”", wrong: ["a “concert score”", "an “open score”", "a “tacet score”"], why: "Without key signatures, the label tells players the transpositions have already been applied." },
    { text: "In notation software, which setting lets transposing parts appear without key signatures?", ans: "“open key”", wrong: ["“concert pitch”", "“no transposition”", "“atonal”"], why: "Open key stops the software from adding a different key signature to each transposing part." },
    { text: "The tenor saxophone sounds one octave lower than which saxophone?", ans: "soprano saxophone", wrong: ["alto saxophone", "baritone saxophone", "sopranino saxophone"], why: "Both are in B♭: soprano sounds a M2 lower, tenor a M9 lower." },
    { text: "The baritone saxophone sounds one octave lower than which saxophone?", ans: "alto saxophone", wrong: ["tenor saxophone", "soprano saxophone", "bass saxophone"], why: "Both are in E♭: alto sounds a M6 lower, baritone a M13 lower." },
    { text: "The bass clarinet sounds one octave lower than which instrument?", ans: "clarinet in B♭", wrong: ["clarinet in A", "clarinet in E♭", "alto saxophone"], why: "Clarinet in B♭ sounds a M2 lower; bass clarinet a M9 lower." },
    { text: "Which clarinet sounds higher than written?", ans: "clarinet in E♭", wrong: ["clarinet in B♭", "clarinet in A", "bass clarinet"], why: "The little E♭ clarinet sounds a minor 3rd higher." },
    { text: "Which two trumpets are both common today?", ans: "trumpets in B♭ and C", wrong: ["trumpets in F and E♭", "trumpets in A and D", "trumpets in G and B"], why: "The trumpet in C is written at concert pitch." },
    { text: "The piccolo trumpet can be set up in which keys?", ans: "A or B♭", wrong: ["F or E♭", "C or D", "G or A"], why: "In A it sounds a M6 higher; in B♭ a m7 higher." },
  ];
  const IVTEXTS = [...new Set(INS.map(ivText))].concat(["M2 higher", "P5 higher", "m3 higher", "P4 higher"]);
  const KEYS = ["B♭", "A", "E♭", "F", "G", "C", "D"];
  function makeFact() {
    const P = pool(), T = transposers(), gens = [];
    const add = (w, f) => { for (let i = 0; i < w; i++) gens.push(f); };
    add(4, () => { const x = rnd(T); return mc(`How does the ${x.name} sound compared with what is written?`, ivText(x), [`${x.iv} ${x.st > 0 ? "lower" : "higher"}`, ...IVTEXTS], `The ${x.name} ${sounds(x)}.`, { show: x.id }); });
    add(3, () => { const x = rnd(T); const rivals = INS.filter(y => y.grp !== "oct" && (y.st !== x.st || y.se !== x.se)).map(y => y.name); return mc(`Which instrument sounds a ${x.iv} ${dirWord(x)} than written?`, x.name, rivals, `The ${x.name} ${sounds(x)}.`, { show: x.id }); });
    // Key questions only use instruments whose name doesn't already state the key ("Horn in F" would give the answer away).
    // The horn is almost always in F, so it can appear here as plain "French horn".
    const PLAIN = { hn: "French horn" }, nm = y => PLAIN[y.id] || y.name;
    const unnamed = y => y.grp !== "oct" && (PLAIN[y.id] || !/ in [A-G]/.test(y.name)), TU = T.filter(unnamed);
    if (TU.length) add(3, () => { const x = rnd(TU); return mc(`What key is the ${nm(x)} in?`, x.key, KEYS, `A written C on the ${nm(x)} sounds as ${x.key}.`, { show: x.id }); });
    if (TU.length) add(2, () => { const k = rnd([...new Set(TU.map(y => y.key))]); const right = INS.filter(y => unnamed(y) && y.key === k); const x = rnd(right); return mc(`Which of these instruments is in ${k}?`, nm(x), INS.filter(y => unnamed(y) && y.key !== k).map(nm), `In ${k}: ${right.map(nm).join(", ")}.`); });
    if (P.some(y => y.grp === "oct")) add(3, () => { const x = rnd(P.filter(y => y.grp === "oct")); const opts = ["an octave higher than written", "two octaves higher than written", "an octave lower than written", "at written pitch"]; return mc(`The ${x.name} sounds…`, sounds(x).replace("sounds ", ""), opts, `The ${x.name} is an octave transposer: it ${sounds(x)} and keeps the same note names.`, { show: x.id }); });
    add(4, () => { const f = rnd(FACTS); return mc(f.text, f.ans, f.wrong, f.why); });
    for (let i = 0; i < 20; i++) { const c = rnd(gens)(); if (c && c.choices.length >= 2) return c; }
    const f = FACTS[0]; return mc(f.text, f.ans, f.wrong, f.why);
  }

  // ---------- Questions ----------
  function fromSpec(sp) {
    if (sp.mode === "facts") return { mode: "facts", c: sp.c, tries: 0, done: false, spec: sp, correctValue: sp.c.answer };
    const x = BY[sp.x]; if (!x || !S.settings.grp[x.grp]) return null;
    if (sp.mode === "keysig") return makeKeyQ(x, sp.ty, sp.g);
    return makeNoteQ(sp.mode, x, mk(sp.w[0], sp.w[1]));
  }
  function newQuestion(mode) {
    const prev = Q[mode];
    const review = S.misses.filter(m => m.mode === mode && (!prev || !sameSpec(m, prev.spec)));
    if (review.length && Math.random() < .3) { const q = fromSpec(rnd(review)); if (q) { q.review = true; return q; } }
    if (mode === "facts") {
      for (let i = 0; i < 40; i++) { const c = makeFact(); if (!prev || prev.c.text !== c.text) return { mode, c, tries: 0, done: false, spec: { mode, c }, correctValue: c.answer }; }
      const c = makeFact(); return { mode, c, tries: 0, done: false, spec: { mode, c }, correctValue: c.answer };
    }
    if (mode === "keysig") {
      for (let i = 0; i < 200; i++) {
        const P = pool(), useOct = P.some(y => y.grp === "oct") && Math.random() < .12;
        const x = useOct ? rnd(P.filter(y => y.grp === "oct")) : rnd(transposers());
        const g = rnd([-4, -3, -2, -1, 0, 1, 2, 3, 4, -5, 5]);
        const q = makeKeyQ(x, Math.random() < .6 ? "part" : "concert", g);
        if (q && (!prev || !sameSpec(q.spec, prev.spec))) return q;
      }
      return makeKeyQ(BY.clbb, "part", 1);
    }
    for (let i = 0; i < 50; i++) {
      const x = rnd(pool()), q = makeNoteQ(mode, x, randomWritten(x));
      if (q.choices.length >= 3 && (!prev || !sameSpec(q.spec, prev.spec))) return q;
    }
    return makeNoteQ(mode, BY.clbb, mk(30, 0));
  }

  // ---------- DOM ----------
  const $ = id => document.getElementById(id);
  const promptEl = $("prompt"), hintBox = $("hintBox"), fb = $("feedback"), ansBox = $("answerBox"), work = $("work");
  const hintBtn = $("hintBtn"), nextBtn = $("nextBtn");
  function renderScore() { $("scRight").textContent = S.right; $("scTotal").textContent = S.total; $("scStreak").textContent = S.streak; $("scoreText").textContent = `Score: ${S.right} correct out of ${S.total} answered. Streak: ${S.streak}.`; }
  function msg(cls, label, text) { return `<div class="verdict"><span class="pill ${cls}">${label}</span><span>${text}</span></div>`; }
  const insTag = x => `<span class="ins">${esc(x.name)}</span>`;

  function renderPrompt() {
    const q = Q[S.mode];
    const tag = q.review ? ' <span class="pill warn">review</span>' : "";
    let h = "";
    if (S.mode === "facts") {
      h = `<h2 class="kicker" id="qHead" tabindex="-1">Transposing instruments${tag}</h2><p class="q-text" id="qText">${accHTML(q.c.text)}</p>`;
    } else if (S.mode === "read") {
      h = `<h2 class="kicker" id="qHead" tabindex="-1">Written for ${esc(q.ins.name)}. What pitch sounds?${tag}</h2>${insTag(q.ins)}<div class="staff solo" id="promptStaff"></div><p class="sub">Written pitch</p>`;
    } else if (S.mode === "write") {
      h = `<h2 class="kicker" id="qHead" tabindex="-1">This is concert pitch. Which note do you write for ${esc(q.ins.name)}?${tag}</h2>${insTag(q.ins)}<div class="staff solo" id="promptStaff"></div><p class="sub">Sounding (concert) pitch</p>${PLAY_BTN("Play this pitch")}`;
    } else {
      const lead = q.ty === "part" ? `The concert key is ${keySpoken(q.given)}. Which key signature does the ${esc(q.ins.name)} part use?` : `The ${esc(q.ins.name)} part is written in ${keySpoken(q.given)}. What is the concert key?`;
      h = `<h2 class="kicker" id="qHead" tabindex="-1">${q.ty === "part" ? "Concert key → part" : "Part → concert key"}${tag}<span class="sr">. ${lead}</span></h2>${insTag(q.ins)}<p class="q-text" aria-hidden="true">${q.ty === "part" ? `Concert key: <b>${keyHTML(q.given)}</b>. Key of the part?` : `Part written in <b>${keyHTML(q.given)}</b>. Concert key?`}</p><div class="staff solo" id="promptStaff"></div>`;
    }
    promptEl.innerHTML = h;
    if (S.mode === "read") noteStaff($("promptStaff"), q.written, { clef: q.ins.clef || "treble" });
    if (S.mode === "write") noteStaff($("promptStaff"), q.sound, clefFor(q.sound));
    if (S.mode === "keysig") { const o = { clef: q.ins.clef || "treble", ks: q.given }; drawStaff($("promptStaff"), Object.assign(o, { label: `${clefWords(o)} with a key signature of ${sigText(q.given)}.` })); }
    renderWork();
  }

  function choiceBtn(value, inner, q) {
    let cls = "choice", mark = "";
    if (q.done) {
      if (value === q.correctValue) { cls += " right"; mark = `<span class="mark"><span aria-hidden="true">✓</span><span class="sr">correct answer</span></span>`; }
      else if (value === q.chosen) { cls += " wrong"; mark = `<span class="mark"><span aria-hidden="true">✗</span><span class="sr">your answer, incorrect</span></span>`; }
    }
    return `<button class="${cls}" data-v="${esc(value)}"${q.done ? " disabled" : ""}><span>${inner}</span>${mark}</button>`;
  }
  function renderWork() {
    const q = Q[S.mode];
    let h = "";
    if (S.mode === "facts") h = `<div class="choice-row wide" role="group" aria-labelledby="qText">${q.c.choices.map(c => choiceBtn(c, accHTML(c), q)).join("")}</div>`;
    else if (S.mode === "keysig") h = `<div class="choice-row" role="group" aria-labelledby="qHead">${q.choices.map(v => choiceBtn(String(v), `<span aria-hidden="true">${accHTML(keyLabel(v))}</span><span class="sr">${esc(keySpoken(v))}</span>`, q)).join("")}</div>`;
    else h = `<div class="choice-row notes" role="group" aria-labelledby="qHead">${q.choices.map(n => choiceBtn(nm(n), `<span aria-hidden="true">${accHTML(nm(n))}</span><span class="sr">${esc(nmSpoken(n))}</span>`, q)).join("")}</div><p class="legend">Octave numbers: middle C is C4.</p>`;
    work.innerHTML = h;
  }
  function renderControls() {
    const q = Q[S.mode];
    document.querySelectorAll(".modes [data-mode]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mode === S.mode)));
    const finished = q.done || q.revealed;
    hintBox.hidden = !q.hinted;
    if (q.hinted) hintBox.innerHTML = hintHTML(q);
    hintBtn.hidden = S.mode === "facts" || finished || q.hinted;
    nextBtn.textContent = finished ? "Next question" : "Skip";
    nextBtn.classList.toggle("primary", !!finished);
  }
  function hintHTML(q) {
    const x = q.ins;
    if (S.mode === "read") return `The ${esc(x.name)} ${esc(sounds(x))}. Move the written note that way.`;
    if (S.mode === "write") return `The ${esc(x.name)} ${esc(sounds(x))}, so write the note the other way: ${x.grp === "oct" ? (x.iv === "P15" ? "two octaves" : "an octave") : "a " + esc(x.iv)} ${x.st > 0 ? "lower" : "higher"} than concert pitch.`;
    const dir = q.ty === "part" ? (x.st > 0 ? "down" : "up") : (x.st > 0 ? "up" : "down");
    return x.grp === "oct" ? `The ${esc(x.name)} transposes only by octaves.` : `The ${esc(x.name)} ${esc(sounds(x))}. Move the key's tonic ${dir} a ${esc(x.iv.replace(/^M9$/, "M2").replace(/^M13$/, "M6").replace(/^M16$/, "M2"))}.`;
  }

  function pairHTML() {
    return `<div class="pair"><figure><div class="staff" id="ansW"></div><figcaption>Written</figcaption></figure><span class="arrow" aria-hidden="true">→</span><figure><div class="staff" id="ansS"></div><figcaption>Sounds</figcaption></figure></div>`;
  }
  function answerHTML(q, extra = "") {
    if (S.mode === "facts") return `<div class="answer"><p class="explain">${accHTML(q.c.explain)}</p>${extra}</div>`;
    const x = q.ins;
    if (S.mode === "keysig") {
      return `<div class="answer"><div class="answer-head"><h3>${esc(x.name)}</h3><span class="legend">${esc(sounds(x))}</span></div>
        <div class="pair"><figure><div class="staff" id="ansW"></div><figcaption>Part: ${accHTML(keyLabel(q.keyPart))}</figcaption></figure><span class="arrow" aria-hidden="true">→</span><figure><div class="staff" id="ansS"></div><figcaption>Concert: ${accHTML(keyLabel(q.keyConcert))}</figcaption></figure></div>
        ${PLAY_BTN("Play concert tonic chord")}${extra}</div>`;
    }
    return `<div class="answer"><div class="answer-head"><h3>${accHTML(nm(q.written))} <span aria-hidden="true">→</span><span class="sr">written, sounds</span> ${accHTML(nm(q.sound))}</h3><span class="legend">${esc(x.name)} ${esc(sounds(x))}</span></div>${pairHTML()}${PLAY_BTN("Play sounding pitch")}${extra}</div>`;
  }
  function drawAnswer(q) {
    if (S.mode === "read" || S.mode === "write") {
      noteStaff($("ansW"), q.written, { clef: q.ins.clef || "treble" });
      noteStaff($("ansS"), q.sound, clefFor(q.sound));
    } else if (S.mode === "keysig") {
      const c = { clef: q.ins.clef || "treble" };
      drawStaff($("ansW"), Object.assign({ ks: q.keyPart, label: `${clefWords(c)}: the part's key signature, ${sigText(q.keyPart)}.` }, c));
      drawStaff($("ansS"), Object.assign({ ks: q.keyConcert, label: `${clefWords(c)}: concert key signature, ${sigText(q.keyConcert)}.` }, c));
    }
  }

  function score(q, correct) {
    if (q.tries > 0) return;
    S.total++;
    const sp = specOf(q);
    if (correct) { S.right++; S.streak++; S.misses = S.misses.filter(m => !sameSpec(m, sp)); }
    else { S.streak = 0; if (!S.misses.some(m => sameSpec(m, sp))) S.misses.push(sp); }
    save(); renderScore();
  }

  function choose(value) {
    const q = Q[S.mode];
    if (q.done) return;
    const correct = value === q.correctValue;
    score(q, correct);
    q.tries++; q.done = true; q.chosen = value;
    renderWork();
    if (S.mode === "facts") {
      fb.innerHTML = msg(correct ? "good" : "bad", correct ? "Correct" : "Not quite", correct ? accHTML(q.c.answer) + "." : `The answer is ${accHTML(q.c.answer)}.`);
      ansBox.innerHTML = answerHTML(q);
    } else if (S.mode === "keysig") {
      const x = q.ins;
      const line = q.ty === "part" ? `Concert ${accHTML(keyLabel(q.keyConcert))} → ${esc(x.name)} part in ${accHTML(keyLabel(q.keyPart))}.` : `${esc(x.name)} part in ${accHTML(keyLabel(q.keyPart))} → concert ${accHTML(keyLabel(q.keyConcert))}.`;
      fb.innerHTML = msg(correct ? "good" : "bad", correct ? "Correct" : "Not quite", correct ? line : `You chose ${accHTML(keyLabel(+value))}. ${line}`);
      const horn = x.id === "hn" ? `<p class="legend">Older scores often write horns (and trumpets) with no key signature; modern scores transpose it like this.</p>` : "";
      ansBox.innerHTML = answerHTML(q, horn); drawAnswer(q); autoPlay(q);
    } else {
      const x = q.ins, verb = S.mode === "read" ? `Written ${accHTML(nm(q.written))} sounds ${accHTML(nm(q.sound))}` : `To sound ${accHTML(nm(q.sound))}, write ${accHTML(nm(q.written))}`;
      fb.innerHTML = msg(correct ? "good" : "bad", correct ? "Correct" : "Not quite", correct ? `${verb}.` : `You chose ${accHTML(value)}. ${verb}.`);
      const why = `<p class="legend">The ${esc(x.name)} ${esc(sounds(x))}${S.mode === "write" ? ", so the written note is that far the other way" : ""}.</p>`;
      ansBox.innerHTML = answerHTML(q, why); drawAnswer(q); autoPlay(q);
    }
    renderControls();
    nextBtn.focus();
  }
  // Reveal without scoring (used by the class game when time is up)
  function reveal() { const q = Q[S.mode]; if (q.done) return; q.tries = 1; choose(q.correctValue); }
  work.addEventListener("click", e => { const b = e.target.closest("[data-v]"); if (b && !b.disabled) choose(b.dataset.v); });

  function clearAnswer() { fb.innerHTML = ""; ansBox.innerHTML = ""; }
  function next(focus = true) {
    Q[S.mode] = newQuestion(S.mode);
    clearAnswer(); renderPrompt(); renderControls();
    if (focus) { const h = $("qHead"); if (h) h.focus(); }
  }
  function setMode(m) {
    if (S.mode === m) return;
    S.mode = m; save(); clearAnswer();
    if (!Q[m] || Q[m].done) Q[m] = newQuestion(m);
    renderPrompt(); renderControls();
  }

  // ---------- Events ----------
  document.querySelectorAll(".modes [data-mode]").forEach(b => b.onclick = () => setMode(b.dataset.mode));
  hintBtn.onclick = () => { Q[S.mode].hinted = true; renderControls(); hintBox.setAttribute("tabindex", "-1"); hintBox.focus(); };
  nextBtn.onclick = () => next(true);

  function renderSettings() {
    document.querySelectorAll("[data-grp]").forEach(b => b.setAttribute("aria-pressed", String(!!S.settings.grp[b.dataset.grp])));
    document.querySelectorAll("[data-acc]").forEach(b => b.setAttribute("aria-pressed", String(S.settings.acc === b.dataset.acc)));
    document.querySelectorAll("[data-auto]").forEach(b => b.setAttribute("aria-pressed", String((S.settings.auto !== false) === (b.dataset.auto === "1"))));
  }
  function settingsChanged() { save(); renderSettings(); Object.keys(Q).forEach(m => Q[m] = newQuestion(m)); clearAnswer(); renderPrompt(); renderControls(); }
  $("grpToggles").onclick = e => {
    const b = e.target.closest("[data-grp]"); if (!b) return;
    const g = b.dataset.grp, on = !S.settings.grp[g];
    if (!on && Object.entries(S.settings.grp).filter(([k, v]) => v && k !== "oct").length === 1 && g !== "oct") return; // keep at least one group of transposing instruments
    S.settings.grp[g] = on; settingsChanged();
  };
  $("accToggles").onclick = e => { const b = e.target.closest("[data-acc]"); if (b) { S.settings.acc = b.dataset.acc; settingsChanged(); } };
  $("autoToggles").onclick = e => { const b = e.target.closest("[data-auto]"); if (b) { S.settings.auto = b.dataset.auto === "1"; save(); renderSettings(); } };
  $("resetBtn").onclick = () => { S.misses = []; save(); $("resetBtn").textContent = "Review list cleared"; };
  let armTimer = null;
  $("scoreReset").onclick = () => {
    const b = $("scoreReset");
    if (!b.classList.contains("armed")) { b.classList.add("armed"); b.innerHTML = 'Tap again to reset<span class="sr"> the score</span>'; armTimer = setTimeout(() => { b.classList.remove("armed"); b.innerHTML = 'Reset<span class="sr"> score</span>'; }, 3000); return; }
    clearTimeout(armTimer); S.right = 0; S.total = 0; S.streak = 0; save(); renderScore();
    b.classList.remove("armed"); b.innerHTML = 'Reset<span class="sr"> score</span>';
  };

  // Chart: the three tables, in the fold-away panel and the pop-up.
  const row = x => `<tr><th scope="row">${esc(x.name)}</th><td data-label="Key">${accHTML(x.key || "—")}</td><td data-label="Sounds">${ivHTML(x)}</td></tr>`;
  const t1 = INS.filter(x => x.grp !== "oct").map(row).join("");
  const keyRows = ["B♭", "A", "E♭", "F", "G"].map(k => { const xs = INS.filter(x => x.key === k && x.grp !== "oct"); return `<tr><th scope="row">${accHTML(k)}</th><td data-label="Instruments">${esc(xs.map(x => x.name).join(", "))}</td><td data-label="Sounds">${esc([...new Set(xs.map(ivText))].join(" or "))}</td></tr>`; }).join("");
  const octRows = [["P15 higher", ["glk"]], ["P8 higher", ["picc", "cel", "xyl", "chm"]], ["P8 lower", ["bfl", "cbn", "ten", "gtr", "cb"]]].map(([t, ids]) => `<tr><th scope="row">${t}</th><td data-label="Instruments">${esc(ids.map(i => BY[i].name).join(", "))}</td><td data-label="Sounds">${esc(t)}</td></tr>`).join("");
  const table = (cap, h1, h2, h3, rows) => `<table class="ref"><caption>${cap}</caption><thead><tr><th scope="col">${h1}</th><th scope="col">${h2}</th><th scope="col">${h3}</th></tr></thead><tbody>${rows}</tbody></table>`;
  document.querySelectorAll(".chart-slot").forEach(el => el.innerHTML =
    `<div class="table-wrap">${table("By instrument", "Instrument", "Key", "Written pitch sounds", t1)}</div>
     <div class="table-wrap">${table("By key of the instrument", "Key", "Instruments", "Sounds", keyRows)}</div>
     <div class="table-wrap">${table("Octave transposers", "Interval", "Instruments", "Sounds", octRows)}</div>
     <p class="legend">Not transposing: trumpet in C, tuba (always written at concert pitch), euphonium in bass clef.</p>`);
  const dlg = $("chartDialog"); let dlgReturn = null;
  $("chartBtn").onclick = () => { dlgReturn = document.activeElement; if (dlg.showModal) dlg.showModal(); else { $("chartPanel").open = true; $("chartPanel").scrollIntoView(); return; } $("chartClose").focus(); };
  $("chartClose").onclick = () => dlg.close();
  dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", () => { if (dlgReturn && dlgReturn.focus) dlgReturn.focus(); });

  Object.keys(Q).forEach(m => Q[m] = newQuestion(m));
  renderSettings(); renderScore(); renderPrompt(); renderControls();
})();
