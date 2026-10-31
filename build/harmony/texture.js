window.FAM = (() => {
  // ===== Texture: monophony, heterophony, homophony, polyphony and more. Engine: build/harmony/engine.js =====
  const tbl = (cap, head, rows) => `<div class="ltable-wrap" tabindex="0" role="region" aria-label="${cap}"><table class="ltable"><caption>${cap}</caption><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  // ---------- audio kit ----------
  let AC = null, bus = null;
  function ac() { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; if (!AC) AC = new C(); if (AC.state === "suspended") AC.resume(); return AC; }
  function fresh() { if (bus) { const o = bus; o.gain.setTargetAtTime(0, AC.currentTime, .03); setTimeout(() => o.disconnect(), 400); } bus = AC.createGain(); bus.gain.value = .9; bus.connect(AC.destination); return bus; }
  const mf = m => 440 * Math.pow(2, (m - 69) / 12);
  const PW = {};
  const pw = (k, amps) => { if (!PW[k] || PW[k].ctx !== AC) { const re = new Float32Array(amps.length + 1), im = new Float32Array(amps.length + 1); amps.forEach((a, i) => im[i + 1] = a); PW[k] = { w: AC.createPeriodicWave(re, im), ctx: AC }; } return PW[k].w; };
  const TIMB = { flute: [[1, .25, .08, .03], [.06, .9, .1], 8], clar: [[1, .02, .7, .02, .45, .02, .3, .01, .18], [.04, .9, .08], 0], oboe: [[.45, .85, 1, .8, .55, .4, .3, .2], [.03, .85, .08], 5], str: [[1, .5, .33, .25, .2, .16, .14, .12, .1, .09], [.08, .9, .12], 10], horn: [[1, .7, .45, .3, .18, .1, .06], [.05, .9, .1], 0], piano: [[1, .5, .3, .2, .12, .08, .05], [.005, 0, .25], 0], bass: [[1, .6, .3, .15, .08], [.01, .6, .08], 0], voice: [[1, .7, .5, .45, .3, .15, .1, .06], [.07, .9, .12], 9] };
  function note(tim, m, t, d, v = 1) {
    const [amps, [A, Sus, R], vib] = TIMB[tim], o = AC.createOscillator(), g = AC.createGain(); o.setPeriodicWave(pw(tim, amps)); o.frequency.value = mf(m); o.connect(g); g.connect(bus);
    if (vib) { const l = AC.createOscillator(), lg = AC.createGain(); l.frequency.value = 5.3; lg.gain.value = vib; l.connect(lg); lg.connect(o.detune); l.start(t + .15); l.stop(t + d + .6); }
    const pk = .16 * v; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(pk, t + A);
    if (tim === "piano") g.gain.setTargetAtTime(0, t + A, .5); else { g.gain.setTargetAtTime(pk * Sus, t + A, .1); g.gain.setValueAtTime(pk * Sus, t + Math.max(A, d - .02)); }
    g.gain.setTargetAtTime(0, t + Math.max(A, d), R / 3); o.start(t); o.stop(t + d + R * 3 + (tim === "piano" ? 2 : .1));
  }
  // ---------- generating short examples (4 bars of 4/4 in a major key) ----------
  const SC = [0, 2, 4, 5, 7, 9, 11];
  const dm = (tonic, d) => tonic + 12 * Math.floor(d / 7) + SC[((d % 7) + 7) % 7];   // scale degree (0-based, any octave) → MIDI
  const PROGS = [[0, 3, 4, 0], [0, 5, 3, 4], [0, 3, 1, 4], [0, 4, 5, 3]];
  const RHY = [[1, 1, 1, 1], [1, .5, .5, 1, 1], [2, 1, 1], [1.5, .5, 1, 1], [1, 1, 2], [.5, .5, 1, 1, 1]];
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  function gen(tonic = 60 + rnd([0, 2, -3, 5, -5])) {
    const prog = rnd(PROGS); let d = rnd([2, 4, 7]); const mel = [];
    prog.forEach((ch, bar) => {
      const r = bar === 3 ? [2, 2] : rnd(RHY); let t = bar * 4;
      r.forEach((len, i) => { const strong = t % 1 === 0 && (t % 2 === 0 || len >= 1); const tones = [ch, ch + 2, ch + 4].map(x => ((x % 7) + 7) % 7);
        if (bar === 3 && i === r.length - 1) d = Math.abs(d - 7) < Math.abs(d) ? 7 : 0;
        else if (strong || bar === 3) { let best = d, bd = 99; for (let c = -3; c <= 10; c++) if (tones.includes(((c % 7) + 7) % 7) && Math.abs(c - d) < bd && Math.abs(c - d) > 0) { best = c; bd = Math.abs(c - d); } d = Math.random() < .3 ? best + (Math.random() < .5 ? 2 : -2) : best; if (!tones.includes(((d % 7) + 7) % 7)) d = best; }
        else d += Math.random() < .5 ? 1 : -1;
        d = Math.max(-1, Math.min(9, d)); mel.push({ t, d: len, deg: d, ch }); t += len; });
    });
    return { tonic, prog, mel };
  }
  const chordTones = (tonic, ch, oct) => [ch, ch + 2, ch + 4].map(x => dm(tonic, x) + 12 * oct);
  // schedule one texture; returns its length in seconds
  function render(kind, g, t0, bpm = 92) {
    const b = 60 / bpm, T = x => t0 + x * b, M = n => dm(g.tonic, n.deg);
    const melT = kind === "hetero" ? "voice" : kind === "chordal" ? "voice" : "flute";
    if (kind !== "chordal") g.mel.forEach(n => note(melT, M(n), T(n.t), n.d * b * .95));
    if (kind === "hetero") g.mel.forEach((n, i) => {   // a second performer: same tune, ornamented, slightly late
      const m = M(n) - 12 + 12, lag = .03 + Math.random() * .03, nx = g.mel[i + 1];
      if (n.d >= 1 && nx) { note("oboe", m, T(n.t) + lag, n.d * b * .45, .8); const step = nx.deg > n.deg ? -1 : 1; note("oboe", dm(g.tonic, n.deg + step), T(n.t + n.d / 2) + lag, n.d * b * .2, .7); note("oboe", m, T(n.t + n.d * .75) + lag, n.d * b * .23, .7); }
      else note("oboe", m, T(n.t) + lag, n.d * b * .95, .8); });
    if (kind === "chordal") g.mel.forEach(n => { const m = M(n), ch = n.ch, tones = [ch, ch + 2, ch + 4].map(x => ((x % 7) + 7) % 7), onChord = tones.includes(((n.deg % 7) + 7) % 7), c = onChord ? ch : n.ch;
      note("voice", m, T(n.t), n.d * b * .95, 1.1); const others = chordTones(g.tonic, c, 0).map(x => { let y = x; while (y >= m) y -= 12; while (y < m - 12) y += 12; return y; }).sort((a, z) => z - a);
      note("voice", others[0], T(n.t), n.d * b * .95, .7); note("voice", others[1] - (others[1] > m - 5 ? 12 : 0), T(n.t), n.d * b * .95, .7); note("voice", dm(g.tonic, c) - 24, T(n.t), n.d * b * .95, .9); });
    if (kind === "melacc") g.prog.forEach((ch, bar) => { const c = chordTones(g.tonic, ch, -1); note("bass", dm(g.tonic, ch) - 24, T(bar * 4), 4 * b * .9, 1.1); [0, 2, 1, 2, 0, 2, 1, 2].forEach((k, i) => note("piano", c[k], T(bar * 4 + i * .5), b * .5, .6)); });
    if (kind === "canon") g.mel.forEach(n => { if (n.t < 12) note("clar", M(n) - 12, T(n.t + 4), n.d * b * .95, .9); });
    if (kind === "free") g.prog.forEach((ch, bar) => {   // a countermelody in long notes, moving against the tune
      const fast = g.mel.filter(n => n.t >= bar * 4 && n.t < bar * 4 + 4).length >= 4, pts = fast ? [0, 2] : [0, 1, 1.5, 2, 3], lens = fast ? [2, 2] : [1, .5, .5, 1, 1];
      let prevD = null; pts.forEach((p, i) => { const tones = [ch, ch + 2, ch + 4].map(x => x - 7); let d = tones[(bar + i) % 3]; if (prevD != null && Math.abs(d - prevD) > 3) d = prevD + (d > prevD ? 1 : -1); prevD = d; note("clar", dm(g.tonic, d), T(bar * 4 + p), lens[i] * b * .95, .85); });
      note("bass", dm(g.tonic, ch) - 24, T(bar * 4), 4 * b * .9, .5); });
    return 16 * b + (kind === "canon" ? 4 * b : 0);
  }
  const KIND = { mono: "Monophony", hetero: "Heterophony", chordal: "Homophony: chordal (homorhythmic)", melacc: "Homophony: melody and accompaniment", canon: "Polyphony: imitative", free: "Polyphony: free (non-imitative)" };
  const WHY = { mono: "one unaccompanied melody", hetero: "two performers play the same tune at once, one with ornaments and slightly different timing", chordal: "all voices move together in the same rhythm, in block chords", melacc: "a clear melody over a supporting accompaniment (broken chords and bass)", canon: "a second voice enters later with the same melody", free: "two independent melodies with different rhythms and contours" };
  let SEED = {};
  function playKind(kind, key) { if (!ac()) return; fresh(); if (!SEED[key]) SEED[key] = gen(); render(kind, SEED[key], AC.currentTime + .1); }
  // texture builder: layers over one tune
  const LAY = { melody: "Melody (flute)", double: "Melody doubled an octave lower (clarinet)", counter: "Countermelody (clarinet)", canon: "Canon: the melody a bar later", block: "Block chords (strings)", broken: "Broken chords (piano)", bass: "Bass line", drone: "Drone on the tonic" };
  const LS = { on: { melody: true }, g: null };
  function builderName() {
    const o = LS.on, poly = o.counter || o.canon, acc = o.block || o.broken || o.bass || o.drone;
    if (!o.melody && !Object.values(o).some(Boolean)) return "Silence";
    if (!o.melody) return "Accompaniment only (no melody)";
    if (poly) return o.canon && !o.counter ? "Polyphony (imitative)" + (acc ? " with accompaniment" : "") : "Polyphony" + (acc ? " with accompaniment" : "");
    if (acc) return o.drone && !o.block && !o.broken && !o.bass ? "Melody over a drone (often grouped with homophony)" : "Homophony (melody and accompaniment)";
    return o.double ? "Monophony (doubled in octaves: still one line)" : "Monophony";
  }
  function playBuilder() {
    if (!ac()) return; fresh(); if (!LS.g) LS.g = gen(); const g = LS.g, b = 60 / 92, t0 = AC.currentTime + .1, T = x => t0 + x * b, o = LS.on;
    if (o.melody) g.mel.forEach(n => note("flute", dm(g.tonic, n.deg), T(n.t), n.d * b * .95));
    if (o.double) g.mel.forEach(n => note("clar", dm(g.tonic, n.deg) - 12, T(n.t), n.d * b * .95, .8));
    if (o.canon) g.mel.forEach(n => { if (n.t < 12) note("horn", dm(g.tonic, n.deg) - 12, T(n.t + 4), n.d * b * .95, .8); });
    g.prog.forEach((ch, bar) => { const c = chordTones(g.tonic, ch, -1);
      if (o.block) c.forEach(m => note("str", m, T(bar * 4), 4 * b * .95, .5));
      if (o.broken) [0, 1, 2, 1, 0, 1, 2, 1].forEach((k, i) => note("piano", c[k] + (k === 0 ? 0 : 0), T(bar * 4 + i * .5), b * .5, .55));
      if (o.bass) [0, 2].forEach(bt => note("bass", dm(g.tonic, ch) - 24 + (bt === 2 && bar % 2 ? 7 - 12 : 0), T(bar * 4 + bt), 2 * b * .9, 1));
    });
    if (o.drone) { note("str", g.tonic - 24, T(0), 16 * b, .8); note("str", g.tonic - 17, T(0), 16 * b, .6); }
    if (o.counter) g.prog.forEach((ch, bar) => { const fast = g.mel.filter(n => n.t >= bar * 4 && n.t < bar * 4 + 4).length >= 4, pts = fast ? [0, 2] : [0, 1, 1.5, 2, 3], lens = fast ? [2, 2] : [1, .5, .5, 1, 1]; pts.forEach((p, i) => { const tones = [ch, ch + 2, ch + 4].map(x => x - 7); note("clar", dm(g.tonic, tones[(bar + i) % 3]), T(bar * 4 + p), lens[i] * b * .95, .8); }); });
  }
  if (!window.__txWired) { window.__txWired = true;
    document.addEventListener("click", e => {
      const b = e.target.closest("[data-tx]"); if (!b) return; const k = b.dataset.tx;
      if (k === "kind") playKind(b.dataset.k, b.dataset.s || b.dataset.k);
      if (k === "new") { SEED = {}; LS.g = null; }
      if (k === "build") playBuilder();
      if (k === "stop") { if (ac()) fresh(); }
    });
    document.addEventListener("change", e => { const c = e.target.closest("[data-lay]"); if (!c) return; LS.on[c.dataset.lay] = c.checked; const o = document.getElementById("txName"); if (o) o.textContent = builderName(); });
  }
  const btn = (label, attrs) => `<button class="play" ${Object.entries(attrs).map(([k, v]) => `data-${k}="${v}"`).join(" ")}><span aria-hidden="true">▶ </span>${label}</button>`;
  const row = (...b) => `<div class="lbtns">${b.join("")}</div>`;
  const stop = `<button class="play" data-tx="stop"><span aria-hidden="true">■ </span>Stop</button>`;
  const newTune = `<button class="play" data-tx="new">New tune</button>`;
  const builder = () => `<div class="toy"><fieldset class="txlay"><legend>Layers</legend>${Object.entries(LAY).map(([k, l]) => `<label><input type="checkbox" data-lay="${k}" ${LS.on[k] ? "checked" : ""}> ${l}</label>`).join("")}</fieldset>
    <p class="lnote">Texture: <b id="txName" aria-live="polite">${builderName()}</b></p>${row(btn("Play", { tx: "build" }), stop, newTune)}</div>`;

  const FACTS = [
    ["Musical texture describes…", "how the layers of sound combine: how many, and how they relate", ["how loud the music is", "the tone color of one instrument", "the speed of the beat"], "Texture is often compared to the weave of a fabric."],
    ["Monophony is…", "a single melodic line with no accompaniment", ["two melodies at once", "a melody with chords", "music without melody"], "Plainchant, a solo unaccompanied song, or a group singing in unison."],
    ["A choir singing one melody in octaves (men and women) is…", "still monophony", ["polyphony", "homophony", "heterophony"], "Octave doubling doesn't create a new line."],
    ["Heterophony is…", "simultaneous variations of the same melody", ["a melody with chordal accompaniment", "two different melodies", "a drone with melody"], "Found in many traditions, from Middle Eastern ensembles and Javanese gamelan to folk fiddling with a singer."],
    ["Homophony is…", "one main melody supported by accompaniment, or voices moving together in chords", ["two equally important melodies", "a single unaccompanied line", "the same melody in canon"], "Chordal (homorhythmic) homophony and melody-and-accompaniment are its two main types."],
    ["A hymn sung in four parts with all voices in the same rhythm is…", "chordal homophony (homorhythm)", ["imitative polyphony", "monophony", "heterophony"], "Block chords moving together."],
    ["Polyphony is…", "two or more independent melodic lines at once", ["one melody with chords", "one melody in octaves", "silence between phrases"], "Also called counterpoint."],
    ["A round or a canon is an example of…", "imitative polyphony", ["monophony", "chordal homophony", "heterophony"], "Each voice enters with the same melody at a delay."],
    ["An Alberti bass (low–high–middle–high broken chords) is typical of…", "melody-and-accompaniment homophony", ["monophony", "imitative polyphony", "heterophony"], "It's a classic Classical-era keyboard accompaniment."],
    ["A fugue is built mainly on…", "imitative polyphony", ["chordal homophony", "monophony", "heterophony"], "A subject enters in each voice in turn."],
    ["Describing texture as 'thin' or 'thick' refers to…", "how many layers or notes sound at once (density)", ["the tempo", "the key", "the dynamics only"], "A solo flute is thin; full orchestra with doublings is thick."],
    ["A sustained or repeated note under changing harmony or melody is…", "a drone or pedal point", ["an ostinato", "a canon", "a cadence"], "Drones are central to many traditions, such as bagpipe music and Indian classical music."],
    ["Micropolyphony, associated with György Ligeti, is…", "many dense lines blurring into a shimmering mass", ["one melody played very quietly", "a fast monophonic line", "two-part counterpoint"], "Individual lines are hard to hear; the overall texture is what you perceive."],
    ["In a typical pop arrangement, adding layers through a verse and chorus and stripping them out for a breakdown changes the…", "texture and density", ["key", "meter", "tempo"], "Builds and drops are texture changes."],
  ];
  function make(mode, H) {
    if (mode === "listen") {
      const kind = H.rnd(Object.keys(KIND)), s = "q" + Math.random().toString(36).slice(2, 8);
      return H.mc("Listen. Which texture is this?", KIND[kind], Object.values(KIND), `It's ${KIND[kind].toLowerCase()}: ${WHY[kind]}.`, { kicker: "Listen: texture", fig: row(btn("Play", { tx: "kind", k: kind, s }), stop) });
    }
    if (mode === "describe") {
      const D = [["A single voice sings an unaccompanied chant.", "Monophony"], ["A singer and a fiddler perform the same tune together, each decorating it differently.", "Heterophony"], ["A four-part choir sings a hymn, all voices in the same rhythm.", "Homophony"], ["A singer is accompanied by strummed guitar chords.", "Homophony"], ["Three voices sing a round, each entering a few beats after the last.", "Polyphony"], ["A violin and a cello play two different, equally important melodies at once.", "Polyphony"], ["An orchestra plays one melody in unison and octaves, with nothing else.", "Monophony"], ["A pianist plays a tune in the right hand over Alberti-bass broken chords.", "Homophony"], ["The subject of a fugue enters in one voice, then another, while the first continues.", "Polyphony"], ["Two flutes play the same melody at the same time, one adding trills and runs.", "Heterophony"]];
      const [q, a] = H.rnd(D); return H.mc(`${q} Which texture is this?`, a, ["Monophony", "Heterophony", "Homophony", "Polyphony"], { Monophony: "One line, even if doubled in unison or octaves.", Heterophony: "Simultaneous variants of one melody.", Homophony: "One main melody with accompaniment, or block chords moving together.", Polyphony: "Independent lines: imitative (rounds, canons, fugues) or free." }[a], { kicker: "Describe the texture" });
    }
    const [q, a, w, y] = H.rnd(FACTS); return H.mc(q, a, w, y, { kicker: "Concepts" });
  }
  function reference() {
    return tbl("The four basic textures", ["Texture", "What you hear", "Examples"], [["Monophony", "one line (even in unison or octaves)", "chant, solo song, unison singing"], ["Heterophony", "variants of one melody at once", "folk ensembles, gamelan, Middle Eastern ensembles"], ["Homophony", "melody + accompaniment, or block chords", "hymns, songs with guitar or piano"], ["Polyphony", "independent lines", "rounds, canons, fugues, Renaissance motets"]]);
  }
  const ex = (k, label) => row(btn(label || "Play an example", { tx: "kind", k }), stop, newTune);
  const lesson = { steps: [
    { title: "What is texture?", kick: "The weave of the music", render: H => `<p><b>Texture</b> is how the layers of a piece fit together: how many there are, what each one does, and how they relate. Like the weave of a fabric, a texture can be thin or thick, transparent or dense, and it can change from moment to moment.</p>
      <p>Musicians usually describe four basic textures: <b>monophony</b>, <b>heterophony</b>, <b>homophony</b> and <b>polyphony</b>. Build one yourself: switch layers on and off over the same tune and see what the result is called.</p>${builder()}` + H.check("Texture describes…", "how layers of sound combine", ["how loud the music is", "one instrument's tone color", "the tempo"], "How many layers and how they relate.") },
    { title: "Monophony", kick: "One line", render: H => `<p><b>Monophony</b> ("one sound") is a single melodic line without accompaniment: plainchant, a lullaby sung alone, a solo flute, a crowd singing in unison. Doubling the line in unison or octaves doesn't change the texture: there's still only one line.</p>${ex("mono")}
      <p>Monophony is the oldest and most widespread texture. The earliest notated Western music, such as Gregorian chant and the songs of Hildegard of Bingen (12th century), is monophonic.</p>` + H.check("Men and women sing the same melody an octave apart. The texture is…", "monophony", ["polyphony", "homophony", "heterophony"], "Octave doubling is still one line.") },
    { title: "Heterophony", kick: "Variations at once", render: H => `<p><b>Heterophony</b> ("different sounds") happens when several performers play or sing the <i>same</i> melody at the same time, each in their own way: one adds ornaments, another simplifies, timing differs slightly. It's central to many traditions: Middle Eastern and Turkish ensembles, Javanese and Balinese gamelan, Japanese gagaku, Gaelic psalm singing, Irish and old-time fiddle and vocal music, and countless folk groups.</p>${ex("hetero")}
      <p>Listen for one tune that seems to be "smeared" or decorated in one part: not two different tunes, and not chords.</p>` + H.check("A fiddler and a singer perform the same tune, the fiddler adding runs and ornaments. The texture is…", "heterophony", ["homophony", "monophony", "imitative polyphony"], "Simultaneous variants of one melody.") },
    { title: "Homophony", kick: "Melody with support", render: H => `<p><b>Homophony</b> has one main melody supported by other parts. It comes in two main kinds:</p>
      <ul><li><b>Chordal homophony</b> (homorhythm): all voices move together in the same rhythm, in block chords, as in a hymn or a barbershop tag.</li></ul>${ex("chordal", "Play chordal homophony")}
      <ul><li><b>Melody and accompaniment</b>: a melody over chords that have their own rhythm: strummed guitar, block or broken piano chords, an Alberti bass, a pop band's groove.</li></ul>${ex("melacc", "Play melody and accompaniment")}
      <p>Homophony dominates most popular music and much music since about 1600: a singer with a band, an aria with orchestra, a piano piece with melody in the right hand.</p>` + H.check("A singer with strummed guitar chords is…", "homophony (melody and accompaniment)", ["polyphony", "heterophony", "monophony"], "One main melody, with the guitar supporting it.") },
    { title: "Polyphony", kick: "Independent lines", render: H => `<p><b>Polyphony</b> ("many sounds"), also called <b>counterpoint</b>, combines two or more independent melodies. Each has its own rhythm and shape, yet together they make harmony.</p>
      <ul><li><b>Imitative polyphony</b>: voices enter one after another with the same melody: rounds, canons, fugues, and the points of imitation in Renaissance motets.</li></ul>${ex("canon", "Play imitative polyphony (a canon)")}
      <ul><li><b>Free (non-imitative) polyphony</b>: different melodies at once, like a countermelody against a tune, or the independent lines of a jazz ensemble or a medieval motet.</li></ul>${ex("free", "Play free polyphony")}
      <p>Polyphony flourished in Renaissance choral music and in the works of J. S. Bach; it's also found in Dixieland jazz, in many African and Central African vocal traditions, and whenever a pop arrangement adds a real countermelody.</p>` + H.check("In a round, each voice sings the same tune but starts later. That's…", "imitative polyphony", ["chordal homophony", "heterophony", "monophony"], "Imitation at a time delay.") },
    { title: "Beyond the four types", kick: "Density, layers and change", render: H => `<p>Real music often mixes textures, and the four labels are a starting point. Other things to listen for:</p>
      ${tbl("Texture vocabulary", ["Term", "Meaning"], [["Density", "how many notes or layers sound at once: thin ↔ thick, sparse ↔ dense"], ["Spacing and register", "close or wide spacing; high, middle and low layers"], ["Doubling", "the same line in unison or octaves (more weight, not more lines)"], ["Drone / pedal point", "a held or repeated note under changing music"], ["Ostinato, riff, loop", "a repeating figure that forms a layer"], ["Call and response", "alternating leader and group (or two groups)"], ["Stratification", "contrasting layers that seem to run independently"], ["Sound mass, micropolyphony", "so many lines that they blur into one shimmering whole (Ligeti, Penderecki)"], ["Build-up and breakdown", "layers added and removed to shape form, as in pop and dance music"]])}
      <p>In popular music, each layer has a role: lead vocal (melody), hooks and countermelodies, pads or rhythm guitar (harmony), bass, and drums. Arrangers change the texture section by section: sparse verses, fuller choruses, a stripped-down bridge, a big final chorus.</p>` + H.check("Adding instruments for a chorus and dropping most of them for a breakdown changes the…", "texture and density", ["key", "meter", "tempo"], "That's a texture change.") },
    { title: "Quick check", kick: "Before the drills", render: H => [1, 3, 4, 6, 7, 2].map(i => { const [q, a, w, y] = FACTS[i]; return H.check(q, a, w, y); }).join("") },
  ] };
  return {
    key: "silverapps-texture-v1", lesson, make, reference,
    modes: [{ id: "listen", kicker: "Listen: texture" }, { id: "describe", kicker: "Describe the texture" }, { id: "concepts", kicker: "Concepts" }],
    topics: [],
  };
})();
