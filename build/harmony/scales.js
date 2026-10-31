window.FAM = (() => {
  // ===== Major and Minor Scales, with key signatures. Engine: build/harmony/engine.js =====
  const MAJ = ["C", "G", "D", "A", "E", "B", "F♯", "C♯", "F", "B♭", "E♭", "A♭", "D♭", "G♭", "C♭"];
  const MIN = ["A", "E", "B", "F♯", "C♯", "G♯", "D♯", "A♯", "D", "G", "C", "F", "B♭", "E♭", "A♭"];
  const SHARPS = "F C G D A E B".split(" "), FLATS = "B E A D G C F".split(" ");
  const TYPES = { major: "Major", natural: "Natural minor", harmonic: "Harmonic minor", melodic: "Melodic minor (ascending)" };
  const PATTERN = { major: "W W H W W W H", natural: "W H W W H W W", harmonic: "W H W W H W+H H", melodic: "W H W W W W H" };
  // scale notes (8, tonic to tonic) of a key; type: major | natural | harmonic | melodic
  function scale(H, tonic, type) {
    const k = H.key(tonic, type === "major" ? "major" : "minor"), s = k.scale.slice();
    if (type === "harmonic" || type === "melodic") s[6] = H.up(s[6], 0, 1);
    if (type === "melodic") s[5] = H.up(s[5], 0, 1);
    const t = s[0], base = H.midi(t) >= 72 ? -1 : 0;
    const out = s.map(n => H.N(n.l, n.a, n.o + base)); out.push(H.N(t.l, t.a, t.o + base + 1));
    return { k, notes: out };
  }
  const sigCount = k => { const n = k.scale.filter(x => x.a).length, sh = k.scale.some(x => x.a > 0); return { n, sh, txt: n ? `${n} ${sh ? "sharp" : "flat"}${n > 1 ? "s" : ""}` : "no sharps or flats" }; };
  const sigNames = k => { const c = sigCount(k); return (c.sh ? SHARPS : FLATS).slice(0, c.n).map(l => l + (c.sh ? "♯" : "♭")); };
  const staffOf = (H, notes, o = {}) => ({ type: "score", clefs: ["treble"], time: null, vf: o.vf || "C", sig: o.sig || {}, bpm: 150, final: false, minBar: 70, bars: (o.split ? [notes.slice(0, o.split), notes.slice(o.split)] : [notes]).map((ns, j) => ({ t: [ns.map((n, i) => Object.assign({ k: [H.nmO(n)], d: "w" }, o.ly ? { ly: o.ly[i + (j ? o.split : 0)] } : {}))] })), rowW: o.split ? 560 : undefined });
  const sigStaff = (k, clef = "treble") => ({ type: "score", clefs: [clef], time: null, vf: k.vf, sig: k.sig, final: false, minBar: 30, scale: 1.15, bars: [{ [clef === "bass" ? "b" : "t"]: [[{ k: [], d: "w", ghost: true }]] }] });
  const steps = (H, ns) => ns.slice(1).map((n, i) => { const d = H.midi(n) - H.midi(ns[i]); return d === 1 ? "H" : d === 2 ? "W" : "W+H"; });
  const spell = (H, ns) => ns.map(H.nm).join(" ");

  const FACTS = [
    ["In movable-do solfège, raised notes change their vowel to…", "i (di, ri, fi, si, li)", ["e (me, le, te)", "a (ra)", "o"], "Lowered notes take e (me, se, le, te), except re, which becomes ra."],
    ["In la-based minor, the tonic is sung as…", "la", ["do", "mi", "ti"], "Minor uses the syllables of its relative major; the raised 7th is si."],
    ["In do-based minor, minor's 3rd, 6th and 7th are sung…", "me, le, te", ["mi, la, ti", "ma, la, ta", "re, sol, la"], "The tonic stays do; the raised 7th is ti."],
    ["In fixed-do solfège, do always means…", "C, in every key", ["the tonic", "the lowest note", "the dominant"], "In movable do, do is the tonic."],
    ["Why do we use key signatures?", "so the key's sharps or flats don't have to be written on every note, and the key is clear at a glance", ["to set the tempo", "to show which instrument plays", "because accidentals aren't allowed in music"], "A key signature applies to every octave, all the way through, until it changes."],
    ["A key signature's sharps or flats apply…", "to every note with that letter name, in every octave, until the key signature changes", ["only in the first bar", "only in the octave where they're written", "only to the first note"], "Accidentals in the music, by contrast, last only until the bar line."],
    ["Why isn't the raised 7th of a minor key in its key signature?", "the key signature shows the natural minor (the relative major's notes); raised 6th and 7th degrees are written as accidentals", ["it's a mistake in the tradition", "minor keys never use the raised 7th", "it would make the key major"], "Relative major and minor share one key signature."],
    ["The order of sharps is…", "F C G D A E B", ["B E A D G C F", "C G D A E B F", "F B E A D G C"], "Father Charles Goes Down And Ends Battle."],
    ["The order of flats is…", "B E A D G C F", ["F C G D A E B", "B E D A G C F", "A B C D E F G"], "Reverse of the sharps: Battle Ends And Down Goes Charles' Father."],
    ["How do you find a major key from its sharps?", "the last sharp is the leading tone: go up a half step", ["the last sharp is the tonic", "count the sharps and add two", "the first sharp is the tonic"], "Three sharps (F♯ C♯ G♯): G♯ up a half step is A major."],
    ["How do you find a major key from its flats?", "the next-to-last flat is the tonic (one flat = F major)", ["the last flat is the tonic", "the first flat is the tonic", "go up a half step from the last flat"], "Three flats (B♭ E♭ A♭): the next-to-last is E♭ major."],
    ["The relative minor of a major key is…", "built on its 6th degree (a minor 3rd below the tonic), with the same key signature", ["built on its 5th degree", "the minor key with the same tonic", "a half step lower"], "C major and A minor share no sharps or flats."],
    ["Parallel major and minor keys share…", "the same tonic (but not the key signature)", ["the same key signature", "nothing", "the same dominant only"], "C major and C minor are parallel; C minor has three flats."],
    ["Why does harmonic minor raise the 7th degree?", "to make a leading tone, so V is major and resolves strongly to i", ["to avoid the augmented 2nd", "to make the scale sound major", "for no particular reason"], "It creates an augmented 2nd between 6̂ and 7̂."],
    ["Why does melodic minor raise the 6th and 7th going up?", "to keep the leading tone while smoothing out the augmented 2nd", ["to make it a major scale", "to change the key", "because singers can't sing half steps"], "Descending, it usually returns to natural minor."],
    ["In a major scale, the half steps fall between…", "3̂–4̂ and 7̂–8̂", ["2̂–3̂ and 5̂–6̂", "4̂–5̂ and 7̂–8̂", "1̂–2̂ and 4̂–5̂"], "W W H W W W H."],
    ["In natural minor, the half steps fall between…", "2̂–3̂ and 5̂–6̂", ["3̂–4̂ and 7̂–8̂", "6̂–7̂ and 7̂–8̂", "1̂–2̂ and 5̂–6̂"], "W H W W H W W."],
    ["A major scale is made of two identical tetrachords (W W H) joined by…", "a whole step", ["a half step", "a minor 3rd", "nothing"], "C D E F + (W) + G A B C."],
    ["Which keys sound the same but are spelled differently?", "enharmonic keys, like F♯ major and G♭ major", ["relative keys", "parallel keys", "closely related keys"], "B/C♭, F♯/G♭ and C♯/D♭ major are the enharmonic pairs."],
  ];

  // ===== Sung solfège with Adam Silverman's recorded voice (assets/solfege-voice.js, shared with Ear Training) =====
  let SAC = null, SV = null, svP = null, sbus = null;
  function svLoad() {
    if (svP) return svP;
    svP = new Promise(res => {
      const go = async () => { try {
        const V = window.SOLFEGE_VOICE; if (!V) return res(null);
        SV = await Promise.all(V.map(async a => { const bin = atob(a.mp3), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
          return { m: a.m, clips: a.clips, buf: await new Promise((ok, no) => SAC.decodeAudioData(u.buffer, ok, no)) }; }));
        res(SV); } catch (e) { res(null); } };
      if (window.SOLFEGE_VOICE) return go();
      const sc = document.createElement("script"); sc.src = "assets/solfege-voice.js"; sc.onload = go; sc.onerror = () => res(null); document.head.appendChild(sc);
    });
    return svP;
  }
  async function singSyl(syls, ms, gap = .6) {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    if (!SAC) SAC = new C(); if (SAC.state === "suspended") SAC.resume();
    const V = await svLoad(); if (!V) return;
    if (sbus) { const o = sbus; o.gain.setTargetAtTime(0, SAC.currentTime, .03); setTimeout(() => o.disconnect(), 300); }
    sbus = SAC.createGain(); sbus.connect(SAC.destination);
    const lo = 41, hi = 65; let best = 0, score = 1e9;
    for (let k = -48; k <= 12; k += 12) { const sc = ms.reduce((a, m) => a + Math.max(0, lo - (m + k), (m + k) - hi), 0) * 10 + Math.abs(ms.reduce((a, m) => a + m + k, 0) / ms.length - 53); if (sc < score) { score = sc; best = k; } }
    const t0 = SAC.currentTime + .3;
    syls.forEach((s, i) => {
      const m = ms[i] + best; let pick = null;
      V.forEach(a => { const c = a.clips[s]; if (!c) return; const d = Math.abs(m - (a.m + c[3])); if (!pick || d < pick.d) pick = { a, c, d }; });
      if (!pick) return;
      const [off, len, vo, tune] = pick.c, rate = Math.pow(2, (m - (pick.a.m + tune)) / 12), t = t0 + i * gap;
      const src = SAC.createBufferSource(); src.buffer = pick.a.buf; src.playbackRate.value = rate;
      const g = SAC.createGain(), start = t - vo / rate, end = t + gap * .85 + .1;
      g.gain.setValueAtTime(.9, start); g.gain.setTargetAtTime(0, end - .05, .03);
      src.connect(g); g.connect(sbus); src.start(Math.max(SAC.currentTime, start), off, Math.min(len, (end - start + .1) * rate));
    });
  }
  if (!window.__solSingHooked) { window.__solSingHooked = true;
    document.addEventListener("click", e => { const b = e.target.closest("[data-sing]"); if (!b) return; singSyl(b.dataset.sing.split(" "), b.dataset.mid.split(" ").map(Number)); }); }
  const singBtn = (H, syls, notes, label) => `<button class="play" data-sing="${syls.join(" ")}" data-mid="${notes.map(n => H.midi(n)).join(" ")}"><span aria-hidden="true">▶ </span>${label}</button>`;
  const SOLMAJ = ["do", "re", "mi", "fa", "sol", "la", "ti", "do"];
  const FIXED = { 0: "do", 1: "re", 2: "mi", 3: "fa", 4: "sol", 5: "la", 6: "ti" };
  const solTable = (rows) => `<div class="ltable-wrap"><table class="ltable"><tbody>${rows.map(r => `<tr>${r.map((c, i) => i ? `<td>${c}</td>` : `<th scope="row">${c}</th>`).join("")}</tr>`).join("")}</tbody></table></div>`;

  function make(mode, H) {
    if (mode === "spell") {
      const type = H.rnd(["major", "major", "natural", "harmonic", "melodic"]), tonic = H.rnd(type === "major" ? MAJ.slice(0, 13) : MIN.slice(0, 13));
      const { k, notes } = scale(H, tonic, type), right = spell(H, notes);
      const wrongs = new Set();
      for (let g = 0; g < 60 && wrongs.size < 5; g++) {
        const ns = notes.slice(), i = 1 + Math.floor(Math.random() * 6), d = H.rnd([-1, 1]);
        if (Math.random() < .3) ns[i] = H.up(ns[i], H.rnd([-1, 1]), 0);   // enharmonic respelling
        else ns[i] = H.N(ns[i].l, ns[i].a + d, ns[i].o);
        if (ns.some(x => Math.abs(x.a) > 2)) continue;
        const w = spell(H, ns); if (w !== right) wrongs.add(w);
      }
      return H.mc(`Which is the ${H.esc(tonic)} ${TYPES[type].toLowerCase()} scale?`, right, [...wrongs], `${TYPES[type]}: ${PATTERN[type]}. Every letter appears once: ${right}.`, { kicker: "Spell the scale", staffAns: staffOf(H, notes), play: { chords: notes.map(n => [H.midi(n)]), gap: .35, dur: .9 }, playLabel: "Hear it", topic: type === "major" ? "major" : "minor" });
    }
    if (mode === "type") {
      const type = H.rnd(Object.keys(TYPES)), tonic = H.rnd(type === "major" ? MAJ.slice(0, 12) : MIN.slice(0, 12)), { notes } = scale(H, tonic, type);
      const sp = staffOf(H, notes);
      return H.mc("What kind of scale is this?", TYPES[type], Object.values(TYPES), `Its steps: ${steps(H, notes).join(" ")}: ${TYPES[type].toLowerCase()} on ${H.nm(notes[0])}.`, { kicker: "Name the scale", staff: sp, playQ: { chords: notes.map(n => [H.midi(n)]), gap: .35, dur: .9 }, playQLabel: "Play", topic: type === "major" ? "major" : "minor" });
    }
    if (mode === "keysig") {
      const minor = Math.random() < .4 && H.topicOn("minor"), list = minor ? MIN : MAJ, i = Math.floor(Math.random() * list.length), name = list[i], k = H.key(name, minor ? "minor" : "major");
      const c = sigCount(k);
      if (Math.random() < .5) {
        const sp = sigStaff(k, Math.random() < .3 ? "bass" : "treble");
        const same = list.filter(n => { const x = sigCount(H.key(n, minor ? "minor" : "major")); return Math.abs(x.n - c.n) <= 2; });
        const rel = minor ? H.nm(k.scale[2]) + " major" : "", last = sigNames(k).slice(-1)[0], nl = sigNames(k).slice(-2)[0];
        const tip = c.n === 0 ? "No sharps or flats." : c.sh ? `The last sharp is ${last}; a half step up is ${minor ? `the relative major, ${rel}, and the relative minor is a minor 3rd below that` : "the tonic"}.` : c.n === 1 ? (minor ? "One flat: F major, whose relative minor is D minor." : "One flat: F major.") : `The next-to-last flat is ${nl}: ${minor ? `the relative major is ${rel}, and the relative minor is a minor 3rd below that` : "that's the tonic"}.`;
        return H.mc(`Which ${minor ? "minor" : "major"} key has this key signature?`, `${name} ${minor ? "minor" : "major"}`, same.map(n => `${n} ${minor ? "minor" : "major"}`), `${c.txt.charAt(0).toUpperCase() + c.txt.slice(1)}: ${sigNames(k).join(" ") || "—"}. ${tip}`, { kicker: "Key signatures", staff: sp, topic: minor ? "minor" : "major" });
      }
      const all = ["no sharps or flats"].concat([1, 2, 3, 4, 5, 6, 7].flatMap(n => [`${n} sharp${n > 1 ? "s" : ""}`, `${n} flat${n > 1 ? "s" : ""}`]));
      return H.mc(`How many sharps or flats are in the key signature of ${name} ${minor ? "minor" : "major"}?`, c.txt, all.filter(x => x !== c.txt && (x.startsWith("no") ? c.n <= 2 : Math.abs(parseInt(x) - c.n) <= 2)), `${name} ${minor ? "minor" : "major"}: ${c.txt}${c.n ? ` (${sigNames(k).join(" ")})` : ""}.`, { kicker: "Key signatures", staffAns: sigStaff(k), topic: minor ? "minor" : "major" });
    }
    if (mode === "relpar") {
      const r = Math.random();
      if (r < .5) {
        const toMin = Math.random() < .5, i = Math.floor(Math.random() * 13), M = MAJ[i], m = MIN[i];
        return toMin ? H.mc(`What is the relative minor of ${M} major?`, `${m} minor`, MIN.slice(0, 13).map(x => `${x} minor`).filter(x => !x.startsWith(m + " ")).concat([`${M} minor`]), `Same key signature; its tonic is the 6th degree of ${M} major (a minor 3rd below ${M}): ${m} minor.`, { kicker: "Relative and parallel", topic: "minor" })
          : H.mc(`What is the relative major of ${m} minor?`, `${M} major`, MAJ.slice(0, 13).map(x => `${x} major`).concat([`${m} major`]), `Same key signature; its tonic is the 3rd degree of ${m} minor (a minor 3rd above ${m}): ${M} major.`, { kicker: "Relative and parallel", topic: "minor" });
      }
      const i = Math.floor(Math.random() * 8), M = MAJ[i], k1 = H.key(M, "major"), k2 = H.key(M, "minor"), c1 = sigCount(k1), c2 = sigCount(k2);
      return H.mc(`${M} major has ${c1.txt}. How many does its parallel minor, ${M} minor, have?`, c2.txt, ["no sharps or flats", "1 sharp", "2 sharps", "3 sharps", "4 sharps", "1 flat", "2 flats", "3 flats", "4 flats", "5 flats", "6 flats", "7 flats", "5 sharps"], `Parallel keys share a tonic. ${M} minor is the relative minor of ${H.nm(k2.scale[2])} major: ${c2.txt}. (A parallel minor always has three more flats, or three fewer sharps.)`, { kicker: "Relative and parallel", topic: "minor" });
    }
    if (mode === "steps") {
      const type = H.rnd(Object.keys(PATTERN)), q = Math.random() < .5;
      if (q) return H.mc(`What is the step pattern of the ${TYPES[type].toLowerCase()} scale?`, PATTERN[type], Object.values(PATTERN), `${TYPES[type]}: ${PATTERN[type]} (W = whole step, H = half step, W+H = augmented 2nd).`, { kicker: "Steps", topic: type === "major" ? "major" : "minor" });
      const tonic = H.rnd(type === "major" ? MAJ.slice(0, 8) : MIN.slice(0, 8)), { notes } = scale(H, tonic, type), st = steps(H, notes), i = Math.floor(Math.random() * 7);
      const W = { H: "a half step", W: "a whole step", "W+H": "an augmented 2nd (a whole step plus a half step)" };
      return H.mc(`In ${tonic} ${TYPES[type].toLowerCase()}, what is the distance from ${H.nm(notes[i])} to ${H.nm(notes[i + 1])} (${i + 1}̂ to ${i + 2 === 8 ? 1 : i + 2}̂)?`, W[st[i]], Object.values(W), `${PATTERN[type]}: step ${i + 1} is ${W[st[i]]}.`, { kicker: "Steps", play: { chords: [[H.midi(notes[i])], [H.midi(notes[i + 1])]], gap: .6 }, playLabel: "Hear it", topic: type === "major" ? "major" : "minor" });
    }
    const [q, a, w, y] = H.rnd(FACTS);
    return H.mc(q, a, w, y, { kicker: "Why it works" });
  }

  function reference(H) {
    return `<div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Scale</th><th scope="col">Steps</th></tr></thead><tbody>${Object.keys(TYPES).map(t => `<tr><td><b>${TYPES[t]}</b></td><td>${PATTERN[t]}</td></tr>`).join("")}</tbody></table></div>
      <div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Signature</th><th scope="col">Major</th><th scope="col">Minor</th></tr></thead><tbody>${MAJ.map((M, i) => `<tr><td>${sigCount(H.key(M, "major")).txt}</td><td>${M}</td><td>${MIN[i]}</td></tr>`).join("")}</tbody></table></div>
      <p class="legend">Sharps: F C G D A E B. Flats: B E A D G C F.</p>`;
  }

  const lesson = { defMode: "major", steps: [
    { title: "Half steps and whole steps", kick: "The building blocks", render: (H, k, U) => `<p>A <b>half step</b> (semitone) is the distance from one key on the piano to the very next one, black or white. A <b>whole step</b> (tone) is two half steps. Between the white keys, E–F and B–C are half steps; all the other neighbors are whole steps.</p>`
      + U.fig(staffOf(H, ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"].map(H.parse), { ly: ["C", "D", "E", "F", "G", "A", "B", "C"] }), "The white notes from C to C: W W H W W W H (half steps E–F and B–C).", { play: { chords: [60, 62, 64, 65, 67, 69, 71, 72].map(m => [m]), gap: .4 } }) },
    { title: "The major scale", kick: "W W H W W W H", keyed: "major", render: (H, k, U) => {
      const { notes } = scale(H, k.name, "major");
      return `<p>Every major scale has the same pattern: <b>W W H W W W H</b>, so the half steps fall between 3̂–4̂ and 7̂–8̂. Start on any note and follow the pattern, using each letter exactly once; that tells you which notes need sharps or flats.</p>`
        + U.fig(staffOf(H, notes, { ly: ["1", "2", "3", "4", "5", "6", "7", "8"] }), `${k.label}: ${spell(H, notes)}.`, { play: { chords: notes.map(n => [H.midi(n)]), gap: .4 } })
        + `<p>A major scale is two identical <b>tetrachords</b> (four-note groups, W W H) joined by a whole step.</p>`
        + H.check(`In ${k.label}, which notes are a half step apart?`, `${H.nm(notes[2])}–${H.nm(notes[3])} and ${H.nm(notes[6])}–${H.nm(notes[7])}`, [`${H.nm(notes[1])}–${H.nm(notes[2])} and ${H.nm(notes[5])}–${H.nm(notes[6])}`, `${H.nm(notes[3])}–${H.nm(notes[4])} and ${H.nm(notes[6])}–${H.nm(notes[7])}`], "3̂–4̂ and 7̂–8̂.");
    } },
    { title: "Why key signatures?", kick: "Write it once", render: (H, k, U) => {
      k = H.key("E", "major");
      const { notes } = scale(H, k.name, "major");
      return `<p>A key's sharps or flats show up again and again. Rather than writing them on every note, we write them once, at the start of every line: the <b>key signature</b>. It:</p>
        <ul><li><b>saves clutter</b>: accidentals in the music are then only for notes <i>outside</i> the key;</li><li><b>shows the key at a glance</b> (one of two keys: a major key or its relative minor);</li><li>applies to <b>every octave</b> and lasts until the key signature changes (an accidental lasts only to the bar line).</li></ul>
        ${U.fig(staffOf(H, notes), `${k.label} written with accidentals`, { play: false })}${U.fig(staffOf(H, notes, { vf: k.vf, sig: k.sig }), `${k.label} written with its key signature: the same notes, less clutter`, { play: false })}`;
    } },
    { title: "Reading key signatures", kick: "Order and tricks", render: (H, k, U) => {
      const sig = n => U.fig(sigStaff(H.key(n, "major")), `${n} major / ${MIN[MAJ.indexOf(n)]} minor`, { small: true, play: false });
      return `<p>Sharps and flats are always written in the same order, in the same positions:</p>
        <ul><li><b>Sharps: F C G D A E B</b> (“Father Charles Goes Down And Ends Battle”).</li><li><b>Flats: B E A D G C F</b> (the same, backwards: “Battle Ends And Down Goes Charles' Father”).</li></ul>
        <p><b>Finding the major key:</b> with sharps, the last sharp is the leading tone, so go up a half step (F♯ C♯ G♯ → A major). With flats, the next-to-last flat is the tonic (B♭ E♭ A♭ → E♭ major); one flat is F major. No sharps or flats: C major.</p>
        <div class="lfigs">${sig("A")}${sig("E♭")}${sig("B")}${sig("D♭")}</div>`
        + H.check("Which major key has four sharps?", "E major", ["A major", "B major", "D major"], "F♯ C♯ G♯ D♯: D♯ up a half step is E.");
    } },
    { title: "The circle of fifths", kick: "One more sharp or flat", render: (H) => `<p>Going up a perfect 5th adds a sharp (C, G, D, A, E, B, F♯, C♯); going down a 5th (up a 4th) adds a flat (C, F, B♭, E♭, A♭, D♭, G♭, C♭). Arranged in a circle, the sharp and flat sides meet at three <b>enharmonic</b> pairs that sound the same: B = C♭, F♯ = G♭, C♯ = D♭.</p>${reference(H)}` },
    { title: "Natural minor", kick: "Relative minor", keyed: "minor", render: (H, k, U) => {
      const { notes } = scale(H, k.name, "natural"), rel = H.key(H.nm(k.scale[2]), "major");
      return `<p>The <b>natural minor</b> scale's pattern is <b>W H W W H W W</b>: half steps between 2̂–3̂ and 5̂–6̂. It uses the same notes as its <b>relative major</b>, starting on that key's 6th degree, so the two share a key signature. ${k.label}'s relative major is ${rel.label}.</p>`
        + U.fig(staffOf(H, notes, { vf: k.vf, sig: k.sig }), `${k.label} (natural), with the key signature of ${rel.label}.`, { play: { chords: notes.map(n => [H.midi(n)]), gap: .4 } })
        + `<p><b>Parallel</b> keys share a tonic instead (C major and C minor): the parallel minor has three more flats (or three fewer sharps).</p>`;
    } },
    { title: "Harmonic and melodic minor", kick: "Why raise 6 and 7?", keyed: "minor", render: (H, k, U) => {
      const h = scale(H, k.name, "harmonic").notes, m = scale(H, k.name, "melodic").notes, nat = scale(H, k.name, "natural").notes;
      const desc = nat.slice().reverse();
      return `<p>Natural minor has no leading tone: its 7th degree is a whole step below the tonic, so the V chord is minor and the pull to the tonic is weak.</p>
        <ul><li><b>Harmonic minor</b> raises 7̂ to make a <b>leading tone</b>, so V is major and resolves strongly to i. The cost: an <b>augmented 2nd</b> (W+H) between 6̂ and 7̂, awkward in a melody.</li>
        <li><b>Melodic minor</b> raises 6̂ <i>and</i> 7̂ going up, keeping the leading tone but smoothing out the augmented 2nd; coming down, it usually returns to natural minor.</li></ul>
        ${U.fig(staffOf(H, h, { vf: k.vf, sig: k.sig }), `${k.label}, harmonic: ${steps(H, h).join(" ")}`, { play: { chords: h.map(n => [H.midi(n)]), gap: .4 } })}${U.fig(staffOf(H, m.concat(desc.slice(1)), { vf: k.vf, sig: k.sig, split: 8 }), `${k.label}, melodic: up with raised 6̂ and 7̂, down as natural minor`, { play: { chords: m.concat(desc.slice(1)).map(n => [H.midi(n)]), gap: .35 } })}
        <p>The key signature shows the <b>natural</b> minor. The raised 6th and 7th are written as accidentals in the music, which is why minor-key music so often has the same accidental (the leading tone) throughout.</p>`
        + H.check(`In ${k.label}, what is the leading tone?`, H.nm(h[6]), [H.nm(nat[6]), H.nm(nat[5]), H.nm(m[5])], "The raised 7th degree.");
    } },
    { title: "Solfège in major", kick: "Do re mi", keyed: "major", render: (H, k, U) => {
      const { notes } = scale(H, k.name, "major"), down = notes.slice().reverse();
      const up = SOLMAJ, CH = [["di", 0, 1], ["ri", 1, 1], ["fi", 3, 1], ["si", 4, 1], ["li", 5, 1]], CL = [["ra", 1, -1], ["me", 2, -1], ["se", 4, -1], ["le", 5, -1], ["te", 6, -1]];
      const alt = (i, a) => H.up(notes[i], 0, a);
      return `<p><b>Solfège</b> gives every scale degree a singable syllable. In major the syllables are <b>do re mi fa sol la ti do</b> for 1̂ 2̂ 3̂ 4̂ 5̂ 6̂ 7̂ 8̂. (Some traditions say <i>so</i> for sol and <i>si</i> for ti.) Every syllable ends in a vowel, so it can be sustained.</p>`
        + U.fig(staffOf(H, notes, { vf: k.vf, sig: k.sig, ly: up }), `${k.label} in solfège.`, { play: false })
        + `<p class="lbtns">${singBtn(H, up, notes, "Sing it up")} ${singBtn(H, up.slice().reverse(), down, "Sing it down")}</p>
        <p><b>Chromatic syllables</b> change the vowel: raised notes change their vowel to <b>i</b> (do → di, re → ri, fa → fi, sol → si, la → li); lowered notes change it to <b>e</b> (ti → te, la → le, sol → se, mi → me), except re, which becomes <b>ra</b>.</p>`
        + solTable([["Raised", ...CH.map(([s0]) => `<b>${s0}</b>`)], ["", ...CH.map(([, i, a]) => H.nm(alt(i, a)))], ["Lowered", ...CL.map(([s0]) => `<b>${s0}</b>`)], ["", ...CL.map(([, i, a]) => H.nm(alt(i, a)))]])
        + `<p class="lbtns">${singBtn(H, ["do", "di", "re", "ri", "mi", "fa", "fi", "sol", "si", "la", "li", "ti", "do"], [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6, 7].map((i, j) => [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0][j] ? alt(i, 1) : notes[i]), "Sing the chromatic scale up")} ${singBtn(H, ["do", "ti", "te", "la", "le", "sol", "se", "fa", "mi", "me", "re", "ra", "do"], [7, 6, 6, 5, 5, 4, 4, 3, 2, 2, 1, 1, 0].map((i, j) => [0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0][j] ? alt(i, -1) : notes[i]), "Sing it down")}</p>`
        + H.check("In major, which syllable is the leading tone?", "ti", ["te", "la", "do"], "7̂ in major is ti; lowered, it becomes te.");
    } },
    { title: "Solfège in minor", kick: "Do-based or la-based?", keyed: "minor", render: (H, k, U) => {
      const nat = scale(H, k.name, "natural").notes, har = scale(H, k.name, "harmonic").notes;
      const DOM = ["do", "re", "me", "fa", "sol", "le", "te", "do"], DOMh = ["do", "re", "me", "fa", "sol", "le", "ti", "do"];
      const LAM = ["la", "ti", "do", "re", "mi", "fa", "sol", "la"], LAMh = ["la", "ti", "do", "re", "mi", "fa", "si", "la"];
      return `<p>There are two common ways to sing a minor key with movable do. Both are widely taught; choose the one your class uses.</p>
        ${solTable([["Degree", "1̂", "2̂", "3̂", "4̂", "5̂", "6̂", "7̂", "raised 7̂"], ["Do-based minor", "do", "re", "<b>me</b>", "fa", "sol", "<b>le</b>", "<b>te</b>", "ti"], ["La-based minor", "<b>la</b>", "ti", "do", "re", "mi", "fa", "sol", "<b>si</b>"]])}
        <details class="ldet"><summary>Do-based minor</summary>
        <p>The tonic is always <b>do</b>, in major and minor. Minor's lowered 3rd, 6th and 7th get the lowered syllables <b>me, le, te</b>; the raised 7th of harmonic minor is <b>ti</b>, as in major.</p>
        <ul><li><b>Strength:</b> the syllables always tell you the scale degree and the tonic, and parallel major and minor (C major and C minor) share their tonic syllable.</li><li><b>Trade-off:</b> minor needs three altered syllables.</li></ul>
        <p class="lbtns">${singBtn(H, DOM, nat, "Sing natural minor")} ${singBtn(H, DOMh, har, "Sing harmonic minor")}</p></details>
        <details class="ldet"><summary>La-based minor</summary>
        <p>Minor is sung with the syllables of its <b>relative major</b>, so the tonic is <b>la</b>. Natural minor needs no altered syllables; the raised 7th becomes <b>si</b> (and a raised 6th, <b>fi</b>).</p>
        <ul><li><b>Strength:</b> relative major and minor (which share a key signature) share their syllables, and natural minor uses only the seven basic syllables.</li><li><b>Trade-off:</b> the tonic syllable changes between major and minor, so do no longer always means “tonic.”</li></ul>
        <p class="lbtns">${singBtn(H, LAM, nat, "Sing natural minor")} ${singBtn(H, LAMh, har, "Sing harmonic minor")}</p></details>`
        + U.fig(staffOf(H, har, { vf: k.vf, sig: k.sig, ly: DOMh }), `${k.label} (harmonic), do-based syllables.`, { play: false })
        + H.check("In la-based minor, what is the syllable of the raised 7th (the leading tone)?", "si", ["ti", "te", "sol"], "Raised sol: si.");
    } },
    { title: "Movable do and fixed do", kick: "Which do?", keyed: "major", render: (H, k, U) => {
      const { notes } = scale(H, k.name, "major"), fx = notes.map(n => FIXED[n.l]);
      return `<p>Solfège systems also differ in what <b>do</b> means.</p>
        <details class="ldet" open><summary>Movable do</summary>
        <p><b>Do</b> is the tonic of whatever key you're in, so the syllables name <b>scale degrees</b>. In any major key the scale is do re mi fa sol la ti do, and sol–do always sounds like 5̂–1̂. This trains hearing <b>relationships</b> in a key (relative pitch) and transfers to every key. Widely used in the US, the UK and many other countries, in schools and in the Kodály approach.</p>
        <p class="lbtns">${singBtn(H, SOLMAJ, notes, `${k.label} in movable do`)}</p></details>
        <details class="ldet"><summary>Fixed do</summary>
        <p><b>Do</b> is always C, re is always D, and so on, whatever the key: the syllables work as <b>note names</b>. In most fixed-do systems the accidental isn't sung (C, C♯ and C♭ are all do), and B is usually called <i>si</i>; this site uses <i>ti</i> for B. Fixed do is the standard way of naming notes in France, Italy, Spain, Latin America and many other countries, and it's taught in some conservatories everywhere. It trains <b>reading</b> and pitch names rather than scale-degree function.</p>
        <p class="lbtns">${singBtn(H, fx, notes, `${k.label} in fixed do`)}</p></details>`
        + solTable([["Note", ...notes.map(n => H.nm(n))], ["Movable do", ...SOLMAJ], ["Fixed do", ...fx]])
        + H.check(`In fixed do, what is the syllable for the note D, whatever the key?`, "re", ["do", "la", "it depends on the key"], "Fixed do: C = do, D = re, E = mi…");
    } },
    { title: "Quick check", kick: "Before the drills", render: (H) => [FACTS[0], FACTS[2], FACTS[5], FACTS[9]].map(([q, a, w, y]) => H.check(q, a, w, y)).join("") },
  ] };

  return {
    key: "silverapps-scales-v1", lesson, make, reference,
    modes: [{ id: "spell", kicker: "Spell the scale" }, { id: "type", kicker: "Name the scale" }, { id: "keysig", kicker: "Key signatures" }, { id: "relpar", kicker: "Relative and parallel" }, { id: "steps", kicker: "Steps" }, { id: "why", kicker: "Why it works" }],
    topics: [{ id: "major", name: "Major", group: "m" }, { id: "minor", name: "Minor", group: "m" }],
  };
})();
