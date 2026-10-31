window.FAM = (() => {
  // ===== Plucked hand-held instruments: guitar, mandolin, banjo, bouzouki, tenor guitar, ukulele. =====
  const F = (q, a, w, why) => ({ q, a, w, why });
  const SH = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
  const FL = ["C", "D♭", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
  const pn = m => SH[m % 12] + (Math.floor(m / 12) - 1);           // MIDI → name with octave (C4 = 60)
  const MID = s => { const m = /^([A-G])(♯|♭)?(-?\d)$/.exec(s); return 12 * (+m[3] + 1) + [0, 2, 4, 5, 7, 9, 11]["CDEFGAB".indexOf(m[1])] + (m[2] === "♯" ? 1 : m[2] === "♭" ? -1 : 0); };
  // Tunings, lowest string (or course) first.
  const TUNE = {
    "guitar": { n: "guitar", s: ["E2", "A2", "D3", "G3", "B3", "E4"], note: "six strings in 4ths, with a major 3rd between G and B" },
    "mandolin": { n: "mandolin", s: ["G3", "D4", "A4", "E5"], note: "four pairs of strings in 5ths, like the violin" },
    "banjo": { n: "5-string banjo (open G)", s: ["G4", "D3", "G3", "B3", "D4"], note: "the short 5th string is a high G drone, tuned above the others (re-entrant)" },
    "bouzouki": { n: "Irish bouzouki", s: ["G2", "D3", "A3", "D4"], note: "four pairs of strings, G D A D (or G D A E)" },
    "greek": { n: "Greek bouzouki (four-course)", s: ["C3", "F3", "A3", "D4"], note: "four pairs; the two lowest pairs include an octave string" },
    "tenor": { n: "tenor guitar", s: ["C3", "G3", "D4", "A4"], note: "four strings in 5ths, like a viola (Chicago tuning uses the guitar's top four strings instead)" },
    "uke": { n: "ukulele (soprano, concert or tenor)", s: ["G4", "C4", "E4", "A4"], note: "re-entrant: the G string is higher than the C next to it" },
    "bari": { n: "baritone ukulele", s: ["D3", "G3", "B3", "E4"], note: "the same as the guitar's four highest strings" },
  };
  const tl = k => TUNE[k].s.map(x => x.replace(/-?\d$/, "")).join(" ");
  // Chord shapes: frets low → high string, -1 = not played.
  const GCH = { C: [-1, 3, 2, 0, 1, 0], G: [3, 2, 0, 0, 0, 3], D: [-1, -1, 0, 2, 3, 2], A: [-1, 0, 2, 2, 2, 0], E: [0, 2, 2, 1, 0, 0], Am: [-1, 0, 2, 2, 1, 0], Em: [0, 2, 2, 0, 0, 0], Dm: [-1, -1, 0, 2, 3, 1] };
  const UCH = { C: [0, 0, 0, 3], F: [2, 0, 1, 0], G: [0, 2, 3, 2], Am: [2, 0, 0, 0], D: [2, 2, 2, 0], Em: [0, 4, 3, 2] };
  function chordDiag(frets, cap, strings) {
    const n = frets.length, gap = 26, x0 = 22, y0 = 34, fh = 28, W = x0 * 2 + gap * (n - 1), Hh = y0 + fh * 5 + 10;
    let s = "";
    for (let i = 0; i < n; i++) s += `<line x1="${x0 + i * gap}" y1="${y0}" x2="${x0 + i * gap}" y2="${y0 + fh * 5}" stroke="currentColor" stroke-width="1.5"/>`;
    for (let f = 0; f <= 5; f++) s += `<line x1="${x0}" y1="${y0 + f * fh}" x2="${x0 + gap * (n - 1)}" y2="${y0 + f * fh}" stroke="currentColor" stroke-width="${f ? 1.5 : 5}"/>`;
    frets.forEach((f, i) => { const x = x0 + i * gap;
      if (f < 0) s += `<path d="M${x - 6},${y0 - 22} l12,12 M${x + 6},${y0 - 22} l-12,12" stroke="currentColor" stroke-width="2"/>`;
      else if (f === 0) s += `<circle cx="${x}" cy="${y0 - 16}" r="6" fill="none" stroke="currentColor" stroke-width="2"/>`;
      else s += `<circle cx="${x}" cy="${y0 + (f - .5) * fh}" r="9" fill="currentColor"/>`; });
    const label = `Chord diagram, ${strings} strings low to high: ` + frets.map(f => f < 0 ? "not played" : f === 0 ? "open" : "fret " + f).join(", ");
    return `<figure class="pedal"><svg viewBox="0 0 ${W} ${Hh}" style="width:min(${W * 1.3}px,100%)" role="img" aria-label="${label}" focusable="false">${s}</svg>${cap ? `<figcaption>${cap}</figcaption>` : ""}</figure>`;
  }
  // Guitar tab: one note on one string. str 0 = low E (bottom line).
  function tab(str, fret) {
    const W = 240, y = i => 16 + (5 - i) * 14; let s = `<text x="6" y="44" font-size="13" font-weight="700" fill="currentColor">T</text><text x="6" y="58" font-size="13" font-weight="700" fill="currentColor">A</text><text x="6" y="72" font-size="13" font-weight="700" fill="currentColor">B</text>`;
    for (let i = 0; i < 6; i++) s += `<line x1="22" y1="${y(i)}" x2="${W - 6}" y2="${y(i)}" stroke="currentColor" stroke-width="1.2"/>`;
    s += `<rect x="112" y="${y(str) - 9}" width="${String(fret).length * 10 + 6}" height="18" fill="var(--card, #fff)"/><text x="115" y="${y(str) + 5}" font-size="15" font-weight="700" fill="currentColor">${fret}</text>`;
    const nm = ["6th (low E)", "5th (A)", "4th (D)", "3rd (G)", "2nd (B)", "1st (high E)"][str];
    return `<figure class="pedal"><svg viewBox="0 0 ${W} 100" role="img" aria-label="Guitar tablature: fret ${fret} on the ${nm} string" focusable="false">${s}</svg><figcaption>Tablature: lines are strings (top line = highest string), numbers are frets.</figcaption></figure>`;
  }
  const INST = [
    F("How is guitar music usually written?", "in treble clef, sounding an octave lower than written", ["in bass clef at pitch", "in treble clef at pitch", "in alto clef"], "Writing it an octave up keeps the notes on the staff; the guitar's real range is E2 to about B5."),
    F("The guitar's open strings, low to high, are…", "E A D G B E", ["G D A E", "E A D G", "D G B E"], "All 4ths except the major 3rd between G and B."),
    F("Classical (Spanish) guitars usually have…", "nylon strings, played with the fingers", ["steel strings, played with a pick", "paired strings", "a resonator"], "Steel-string acoustic guitars are louder and brighter and are often strummed with a pick."),
    F("The mandolin is tuned like…", "the violin: G D A E", ["the guitar", "the cello", "the ukulele"], "So violin fingering and parts translate easily, though mandolin parts need tremolo for long notes."),
    F("Each mandolin 'string' is really…", "a pair of strings (a course) tuned in unison", ["one thick string", "three strings", "a string with a drone"], "Picking the pair together gives the bright, shimmering sound."),
    F("How does a mandolin sustain a long note?", "tremolo: rapid repeated picking", ["with a bow", "with a pedal", "it can't sound longer than a quarter note"], "Plucked notes decay quickly, so long notes are played as a fast tremolo."),
    F("The 5-string banjo's short 5th string…", "is a high drone, usually tuned to G4", ["is the lowest string", "is never played", "is a bass string tuned to G2"], "It starts at the 5th fret and is played by the thumb."),
    F("Open G tuning on the 5-string banjo is…", "g D G B D (the g is the high short string)", ["E A D G B E", "G D A E", "C G D A"], "Strumming or picking the open strings sounds a G major chord."),
    F("Tenor banjos and tenor guitars are most often tuned…", "C G D A, in 5ths like a viola", ["E A D G", "G C E A", "D G B E"], "Irish players often tune the tenor banjo G D A E, an octave below the mandolin."),
    F("A common Irish bouzouki tuning is…", "G D A D", ["E A D G B E", "G C E A", "C G D A"], "Four paired courses; G D A E is also used."),
    F("The Greek bouzouki is closest to which family?", "the long-necked lutes", ["the zithers", "the harps", "the bowed strings"], "A long neck, a rounded back and metal strings in pairs, played with a pick."),
    F("The ukulele's standard tuning (G C E A) is called re-entrant because…", "the G string is higher than the C next to it", ["it has a drone string", "it has paired strings", "it's tuned in 5ths"], "Low-G tuning replaces the high G with one an octave lower."),
    F("The baritone ukulele is tuned…", "D G B E, like the top four strings of a guitar", ["G C E A", "C G D A", "G D A E"], "So guitar chord shapes on the top four strings work on it."),
    F("Ukulele music is usually written…", "in treble clef at pitch", ["an octave higher than it sounds", "in bass clef", "only as chord symbols"], "Chord diagrams and symbols are very common too."),
    F("Which of these instruments has the lowest open string?", "the guitar (E2)", ["the mandolin (G3)", "the ukulele (C4)", "the 5-string banjo (D3)"], "Irish bouzouki's G2 comes close."),
    F("Plucked instruments compared with bowed strings:", "the sound decays quickly after each note", ["they sustain as long as wanted", "they can't play chords", "they all sound an octave lower"], "Write tremolo, repeated notes or let-ring chords for sustain."),
    F("When guitar, mandolin or banjo plays with an orchestra or loud band…", "they usually need amplification or a light texture around them", ["they always cover the brass", "they double the timpani", "they must play only in the bass"], "Keep the accompaniment thin when they play solo lines."),
    F("A capo…", "clamps across the strings, raising every open string by the same amount", ["mutes the strings", "tunes a single string", "is a type of pick"], "Chord shapes keep their fingering but sound higher."),
  ];
  const TECH = [
    F("In guitar tablature (tab), the lines stand for…", "strings, with numbers showing the frets", ["frets, with numbers showing strings", "beats", "fingers"], "The top line is the highest string. Tab shows where to play, but often not rhythm."),
    F("In a chord diagram, an x above a string means…", "don't play that string", ["play it open", "play it with the thumb", "play a harmonic"], "An o means play the string open."),
    F("p i m a in classical guitar music stands for…", "the right-hand thumb, index, middle and ring fingers", ["the left-hand fingers", "four dynamics", "four strings"], "Left-hand fingers are numbered 1–4 (index to little finger)."),
    F("A circled number such as ③ in guitar music means…", "play on that string (here, the 3rd string)", ["use the 3rd finger", "play at fret 3", "play three times"], "Roman numerals usually show the position (fret) instead."),
    F("A hammer-on is…", "sounding a higher note by fretting it firmly without picking again", ["a muted strum", "a bend", "a struck harmonic"], "A pull-off is the reverse: a lower note sounded by pulling a finger off. Both are usually shown with a slur and H or P."),
    F("Palm muting is…", "resting the side of the picking hand on the strings near the bridge", ["pressing every string at fret 12", "playing behind the nut", "using a capo"], "Marked P.M. It gives short, chunky notes."),
    F("The natural harmonic at the 12th fret sounds…", "an octave above the open string", ["a 5th above the open string", "two octaves above", "the open string"], "At the 7th fret: an octave and a 5th; at the 5th fret: two octaves."),
    F("Rasgueado is…", "a flamenco strum flicking the fingers out one after another", ["a pick tremolo", "a tapping technique", "a slide"], "It gives a rattling, rolled strum."),
    F("A banjo 'roll' is…", "a repeating right-hand picking pattern, often in eighth notes", ["a drum roll on the head", "a tremolo with a pick", "a strum"], "Three-finger (Scruggs-style) rolls and clawhammer (strumming down with the back of a nail) are the two main styles."),
    F("A string bend raises the pitch by…", "pushing the string sideways along the fret", ["using a capo", "pressing harder on the fret", "tuning the string"], "Marked with an arrow and the amount (½ = a semitone, full = a whole tone)."),
    F("Slash notation with chord symbols in a guitar part means…", "strum or comp in the style, following the chords", ["rest", "play the melody", "play only roots"], "Rhythm slashes with stems show a specific strumming rhythm."),
    F("Strumming arrows ↑ and ↓ in guitar parts usually show…", "upstroke and downstroke (often written as V and ⊓, like bowings)", ["louder and softer", "higher and lower strings only", "bends"], "Downstrokes are heavier; strummed eighths are usually down-up."),
    F("Why are open-string chords popular on guitar, mandolin and ukulele?", "open strings ring longer and are easier to play", ["they're louder in the bass", "they need no tuning", "they're the only chords possible"], "Keys like E, A, D and G suit the guitar; flat keys often lead players to use a capo."),
    F("For guitar, a 'let ring' marking means…", "let the notes sustain into each other", ["mute after each note", "play harmonics", "repeat the bar"], "Like l.v. for harp and percussion."),
  ];
  const fromList = (H, list, kicker, topic) => { const f = H.rnd(list); return H.mc(f.q, f.a, f.w, f.why, { kicker, topic }); };
  function tuneQ(H) {
    const r = Math.random(), keys = Object.keys(TUNE);
    if (r < .45) { const k = H.rnd(keys); return H.mc(`What are the open strings of the ${TUNE[k].n}, ${k === "banjo" ? "from the short 5th string to the 1st" : "from low to high"}?`, tl(k), keys.filter(x => x !== k && tl(x) !== tl(k)).map(tl), `${TUNE[k].s.join(" ")}: ${TUNE[k].note}.`, { kicker: "Tunings", topic: "tune", play: { seq: TUNE[k].s.map(MID), gap: .45, dur: .9 } }); }
    if (r < .8) { const pool = ["guitar", "mandolin", "banjo", "bouzouki", "uke", "bari"], k = H.rnd(pool); return H.mc(`Which instrument is tuned ${tl(k)}?`, TUNE[k].n, pool.filter(x => x !== k).map(x => TUNE[x].n), `${TUNE[k].s.join(" ")}: ${TUNE[k].note}.`, { kicker: "Tunings", topic: "tune", play: { seq: TUNE[k].s.map(MID), gap: .45, dur: .9 } }); }
    // which instrument's tuning matches another instrument
    const pairs = [["mandolin", "the violin"], ["tenor", "the viola"], ["bari", "the guitar's top four strings"]], [k, a] = H.rnd(pairs);
    return H.mc(`The ${TUNE[k].n} (${tl(k)}) is tuned like…`, a, ["the violin", "the viola", "the guitar's top four strings", "the cello", "the double bass"].filter(x => x !== a), `${TUNE[k].s.join(" ")}.`, { kicker: "Tunings", topic: "tune" });
  }
  function fretQ(H) {
    const r = Math.random();
    if (r < .3) {   // tab → note
      const str = Math.floor(Math.random() * 6), fret = 1 + Math.floor(Math.random() * 9), m = MID(TUNE.guitar.s[str]) + fret;
      const w = [m - 1, m + 1, m + 2, m - 2, m + 12].map(pn);
      return H.mc("Which pitch does this tab note sound on a guitar in standard tuning?", pn(m), w, `The ${["low E", "A", "D", "G", "B", "high E"][str]} string (${TUNE.guitar.s[str]}) raised ${fret} semitone${fret > 1 ? "s" : ""} sounds ${pn(m)}. Written in a guitar part, it would appear an octave higher, as ${pn(m + 12)}.`, { kicker: "Tab", topic: "fret", fig: tab(str, fret), play: { m, pure: true } });
    }
    if (r < .55) {   // capo
      const shape = H.rnd(Object.keys(GCH)), cap = 1 + Math.floor(Math.random() * 7), root = shape.replace("m", ""), q = shape.endsWith("m") ? "m" : "";
      const sounds = FL[(FL.indexOf(root) + cap) % 12] + q, wrong = [-1, 1, 2, cap === 2 ? 3 : -2].map(d => FL[(FL.indexOf(root) + cap + d + 12) % 12] + q).concat([shape]);
      return H.mc(`With a capo at fret ${cap}, a guitarist plays the ${shape} chord shape. Which chord sounds?`, sounds, wrong, `The capo raises everything ${cap} semitone${cap > 1 ? "s" : ""}: ${shape} → ${sounds}. Parts with a capo usually show the shapes, with "capo ${cap}" at the top; the sounding chords go in the score.`, { kicker: "Capo", topic: "fret" });
    }
    if (r < .85) {   // chord diagram
      const uke = Math.random() < .35, lib = uke ? UCH : GCH, ch = H.rnd(Object.keys(lib)), strings = uke ? "G C E A" : "E A D G B E";
      return H.mc(`Which chord does this ${uke ? "ukulele" : "guitar"} chord diagram show?`, ch, Object.keys(lib).filter(x => x !== ch), `Strings ${strings}, low to high: ${lib[ch].map((f, i) => f < 0 ? "x" : f).join(" ")}. Dots are frets to hold down, o = open, x = not played.`, { kicker: "Chord diagrams", topic: "fret", fig: chordDiag(lib[ch], `${uke ? "Ukulele" : "Guitar"}: strings ${strings}`, uke ? "4" : "6") });
    }
    // written vs sounding guitar pitch, on the staff
    const step = 28 + Math.floor(Math.random() * 10), n = H.mk(step, 0), s = H.up(n, -7, -12);
    return H.mc("A guitar part shows this note. What does it sound?", H.nm(s), [H.nm(n), H.nm(H.up(n, -14, -24)), H.nm(H.up(n, 7, 12))], `Guitar parts are written an octave higher than they sound: written ${H.nm(n)} sounds ${H.nm(s)}.`, { kicker: "Written and sounding", topic: "fret", staff: { clef: "treble", groups: [[{ n }]], label: `treble clef: ${H.nmSpoken(n)}` }, play: { m: H.midi(s) } });
  }
  return {
    key: "orch-plucked",
    modes: [{ id: "inst", kicker: "The instruments" }, { id: "tune", kicker: "Tunings" }, { id: "fret", kicker: "Fretboard and notation" }, { id: "tech", kicker: "Techniques" }],
    make(mode, H) {
      if (mode === "inst") return fromList(H, INST, "The instruments", "inst");
      if (mode === "tune") return Math.random() < .8 ? tuneQ(H) : fromList(H, INST.filter(f => /tuned|tuning|open strings/i.test(f.q + f.a)), "Tunings", "tune");
      if (mode === "fret") return fretQ(H);
      return fromList(H, TECH, "Techniques", "tech");
    },
    reference(H, esc) {
      const row = k => `<tr><th scope="row">${esc(TUNE[k].n)}</th><td>${TUNE[k].s.join(" ")}</td><td>${esc(TUNE[k].note)}</td></tr>`;
      return `<div class="table-wrap"><table class="ref"><caption>Open strings (low to high; banjo from the short 5th string)</caption><thead><tr><th scope="col">Instrument</th><th scope="col">Tuning</th><th scope="col">Notes</th></tr></thead><tbody>${Object.keys(TUNE).map(row).join("")}</tbody></table></div>
      <div class="pedal-row">${chordDiag(GCH.G, "Guitar G", "6")}${chordDiag(GCH.Am, "Guitar Am", "6")}${chordDiag(UCH.C, "Ukulele C", "4")}</div>
      <ul class="ref-list"><li><b>Guitar:</b> written in treble clef an octave higher than it sounds (range E2 to about B5). Mandolin and ukulele are written at pitch.</li>
      <li><b>Sustain:</b> plucked notes fade fast; use tremolo picking, repeated notes, rolls or let-ring chords.</li>
      <li><b>Notation:</b> tab (lines = strings, numbers = frets), chord diagrams (o open, x not played), slashes with chord symbols, ①–⑥ for strings, p i m a for right-hand fingers.</li>
      <li><b>Capo:</b> raises every open string; parts show the shapes and "capo N".</li>
      <li><b>Family relations:</b> mandolin = violin tuning; tenor guitar and tenor banjo = viola tuning; baritone ukulele = guitar's top four strings.</li></ul>`;
    },
  };
})();
