
window.FAM = (() => {
  // ===== Pitch sets for composers (from Adam Silverman's Composition II supplement "Pitch Sets"). Engine: build/harmony/engine.js =====
  const NAMES = ["C", "D♭", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
  const SHARP = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"], FLAT = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];
  const m12 = x => ((x % 12) + 12) % 12;
  const T = (s, n) => s.map(x => m12(x + n));
  const I = (s, n = 0) => s.map(x => m12(n - x));
  const fmt = s => "{" + s.join(", ") + "}";
  const names = s => s.map(x => NAMES[x]).join("–");
  // prime form (Rahn): most compact rotation of the set or its inversion, transposed to start on 0
  function prime(s) {
    const cands = [];
    [s, I(s)].forEach(v => { const u = [...new Set(v)].sort((a, b) => a - b); u.forEach((_, r) => { const rot = u.slice(r).concat(u.slice(0, r)); cands.push(rot.map(x => m12(x - rot[0]))); }); });
    const key = c => c.slice().reverse().map(x => String(x).padStart(2, "0")).join("");   // compare span first, then inner intervals from the right
    return cands.sort((a, b) => key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0)[0];
  }
  const TRI = { "012": "3-1", "013": "3-2", "014": "3-3", "015": "3-4", "016": "3-5", "024": "3-6", "025": "3-7", "026": "3-8", "027": "3-9", "036": "3-10", "037": "3-11", "048": "3-12" };
  const TRI_NOTE = { "3-1": "chromatic cluster", "3-2": "", "3-3": "major 3rd split by a half step", "3-4": "perfect 4th with a half step inside", "3-5": "tritone + half step", "3-6": "whole-tone fragment", "3-7": "", "3-8": "", "3-9": "stacked 4ths/5ths", "3-10": "diminished triad", "3-11": "major or minor triad", "3-12": "augmented triad" };
  const pf = s => prime(s).join("");
  // Dr. Silverman's notation images from his blog post "Composition II – Pitch Sets" (assets/img/pitchsets)
  const IMG = (f, w, h, alt, cap, max) => `<figure class="lfig"${max ? ` style="max-width:${max}px;margin-inline:auto"` : ""}><img src="assets/img/pitchsets/${f}" width="${w}" height="${h}" alt="${alt}" loading="lazy" style="width:100%;height:auto;background:#fff;padding:6px;box-sizing:border-box;border-radius:6px"><figcaption>${cap}</figcaption></figure>`;
  // staff figures: sets as chords (or melodic cells), each labeled under the staff
  const oct = (pcs, base = 60) => { let last = base - 1; return pcs.map(p => { let m = p + 60; while (m <= last) m += 12; last = m; return m; }); };
  const nk = (m, spell) => (spell || SHARP)[m % 12] + (Math.floor(m / 12) - 1);
  const chordFig = (sets, labels, spell) => ({ type: "score", clefs: ["treble"], time: null, vf: "C", sig: {}, bpm: 60, minBar: 90, bars: sets.map((s, i) => ({ t: [[{ k: oct(s).map(m => nk(m, spell && spell[i])), d: "w", ly: labels[i] }]] })) });
  const cellFig = (cells, labels, spell) => ({ type: "score", clefs: ["treble"], time: null, vf: "C", sig: {}, bpm: 92, minBar: 110, bars: cells.map((c, i) => ({ t: [oct(c).map((m, j) => Object.assign({ k: [nk(m, spell && spell[i])], d: "q" }, j === 0 ? { ly: labels[i] } : {}))], time: null })) });

  const F = {
    concept: [
      ["A pitch class is…", "every pitch with the same name in any octave (and its enharmonic spellings)", ["one specific note on the piano", "a scale", "a chord in root position"], "C4, C5 and B♯3 are all pitch class 0."],
      ["Why might a composer build music from pitch sets?", "to have a consistent sound vocabulary that doesn't rely on triads", ["to make every note random", "to avoid writing melodies", "to keep the music in one key"], "A set can be a melodic cell, a chord or a framework to embellish."],
      ["Compared with a twelve-tone row, the order of notes in a pitch set…", "matters less: the set is a collection, not a sequence", ["is fixed and can't change", "must always ascend", "must use all twelve notes"], "You can arrange a set's notes freely as melody or harmony."],
      ["Two sets are considered the same set class if…", "one can be transposed or inverted into the other", ["they start on the same note", "they're in the same octave", "they have the same rhythm"], "{0,1,4} and {2,3,6} are both 3-3; so is its inversion {0,3,4}."],
      ["A trichord has…", "three pitch classes", ["three octaves", "three chords", "three beats"], "Tetrachords have four, pentachords five."],
      ["In Bartók's String Quartet No. 2 (second movement), set 3-3 {0,1,4} often appears as…", "a major 3rd divided by a half step on one side", ["a perfect 5th", "a diminished 7th chord", "a whole-tone scale"], "Later 3-4 {0,1,5}, a perfect 4th with a half step inside, joins it."],
      ["The major and minor triads both belong to set class…", "3-11 {0,3,7}", ["3-3 {0,1,4}", "3-12 {0,4,8}", "3-10 {0,3,6}"], "A minor triad is the inversion of a major triad, so they're one set class."],
      ["The name “3-3” for {0,1,4} means…", "a trichord, number 3 on the standard (Forte) list", ["three notes, each a 3rd apart", "the third inversion", "a chord built on scale degree 3"], "The first number is the size; the second is its place on the list."],
    ],
  };
  const PC_NOTES = [["C", 0], ["C♯", 1], ["D♭", 1], ["D", 2], ["E♭", 3], ["D♯", 3], ["E", 4], ["F", 5], ["F♯", 6], ["G♭", 6], ["G", 7], ["A♭", 8], ["G♯", 8], ["A", 9], ["B♭", 10], ["A♯", 10], ["B", 11], ["B♯", 0], ["C♭", 11], ["E♯", 5]];
  const randSet = H => { const pc = H.rnd(Object.keys(TRI)); const s = pc.split("").map(Number); const n = Math.floor(Math.random() * 12); return (Math.random() < .5 ? T(s, n) : T(I(s), n)).sort((a, b) => a - b); };
  const GEN = {
    pc: H => {
      if (Math.random() < .6) { const [n, v] = H.rnd(PC_NOTES); return H.mc(`What is the pitch-class number of ${n}?`, v, [m12(v + 1), m12(v - 1), m12(v + 2), m12(v + 5)], `Count half steps up from C = 0: ${n} = ${v}.`); }
      const v = Math.floor(Math.random() * 12); return H.mc(`Which note is pitch class ${v}?`, NAMES[v], [NAMES[m12(v + 1)], NAMES[m12(v - 1)], NAMES[m12(v + 2)]], `${v} half steps above C is ${SHARP[v] === FLAT[v] ? SHARP[v] : SHARP[v] + " / " + FLAT[v]}.`);
    },
    tn: H => {
      const s = randSet(H), n = 1 + Math.floor(Math.random() * 11);
      if (Math.random() < .55) { const a = T(s, n); return H.mc(`Transpose ${fmt(s)} (${names(s)}) up ${n} half step${n > 1 ? "s" : ""} (T${n}). Which set do you get?`, fmt(a), [fmt(T(s, n + 1)), fmt(T(s, n - 1)), fmt(I(s, n).sort((x, y) => x - y)), fmt(T(s, 12 - n))], `Add ${n} to each number, mod 12: ${fmt(a)} = ${names(a)}.`); }
      const a = I(s); return H.mc(`Invert ${fmt(s)} (${names(s)}) around C (I0: each x becomes 12 − x). Which set do you get?`, fmt(a), [fmt(T(s, 6)), fmt(I(s, 1)), fmt(I(s, 11)), fmt(s.map(x => m12(x + 12 - 2 * x + 1)))], `12 − x for each number, mod 12: ${fmt(a)} = ${names(a)}.`);
    },
    name: H => {
      const s = randSet(H), p = pf(s), nm = TRI[p];
      const others = Object.entries(TRI).filter(([k]) => k !== p).sort(() => Math.random() - .5).slice(0, 3);
      return H.mc(`Which set class is ${names(s)} ${fmt(s)}?`, `${nm} (${p.split("").join("")})`, others.map(([k, v]) => `${v} (${k})`), `Its most compact form, starting on 0 (using the inversion if that's more compact), is (${p}): ${nm}${TRI_NOTE[nm] ? ", " + TRI_NOTE[nm] : ""}.`);
    },
  };
  const lesson = { steps: [
    { title: "Beyond the triad", kick: "Why composers use pitch sets", render: () => `<p>Triads give tonal music its basic unit of melody and harmony. Take them away and you need another vocabulary. <b>Pitch-class sets</b> are one: small collections of notes that a piece keeps returning to, in different positions, registers and orders.</p>
      <p>A set can be the cell a melody is made from, a chord when its notes are stacked, or a framework that other notes decorate. Unlike a twelve-tone row, the order of its notes doesn't matter much. What gives the music its consistent sound is the set's intervals.</p>
      <p>Set theory is a large subject, usually taught in courses on 20th-century analysis. A composer needs only a small part of it: how to name notes as numbers, how to tell when two collections are the same set, and how to move a set around.</p>` },
    { title: "Pitch classes as numbers", kick: "C = 0", render: () => `<p>A <b>pitch class</b> is every C, in every octave, along with its enharmonic spellings (B♯, D𝄫). Number them by half steps above C, and the arithmetic of transposing and inverting becomes simple: count on a clock with 12 hours, so 11 + 2 = 1.</p>`
      + tbl("Pitch-class numbers", ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"], [SHARP.map((n, i) => n === FLAT[i] ? n : n + " / " + FLAT[i])])
      + `<p class="note">Some books write 10 and 11 as <b>t</b> and <b>e</b> (or A and B) so every pitch class is a single character.</p>` },
    { title: "Sets, transposed and inverted", kick: "One sound, many positions", render: (H, k, U) => `<p>Group pitch classes by size: <b>trichords</b> (3), <b>tetrachords</b> (4), <b>pentachords</b> (5) and so on. A set keeps its identity when you <b>transpose</b> it (add the same number to every note) or <b>invert</b> it (turn its intervals upside down: 12 − x). All of these belong to one <b>set class</b>.</p>`
      + U.fig(chordFig([[0, 1, 4], [2, 3, 6], [7, 8, 11], [0, 3, 4], [5, 8, 9]], ["{0,1,4}", "T2 {2,3,6}", "T7 {7,8,11}", "I4 {0,3,4}", "I9 {5,8,9}"], [FLAT, FLAT, FLAT, SHARP, SHARP]), "Set 3-3: C–D♭–E, two transpositions, and two inversions. Same intervals each time: a half step and a major 3rd inside a 4th.")
      + IMG("set-3-3-forms.png", 671, 163, "Three forms of set 3-3 on a staff: C, C-sharp, E labeled 0 1 4; inverted and reversed: C, E-flat, E; then transposed up a major 2nd: D, F, F-sharp.", "{0,1,4}, inverted (and reversed), then transposed up a major 2nd.", 560)
      + `<p>Each set class has a standard name, its <b>Forte number</b>: the size, a hyphen, and its place on the list. {0,1,4} is <b>3-3</b>. Its <b>prime form</b>, written (014), is its most compact arrangement starting on 0.</p>` },
    { title: "The twelve trichords", kick: "A small vocabulary", render: () => `<p>Every three-note collection belongs to one of just twelve set classes. Some are familiar: 3-11 is the major and minor triad, 3-12 the augmented triad, 3-10 the diminished triad.</p>`
      + tbl("The twelve trichord set classes", ["Name", "Prime form", "Example on C", "Sound"], Object.entries(TRI).map(([p, n]) => [n, "(" + p + ")", names(p.split("").map(Number)), TRI_NOTE[n] || ""]))
      + `<p>To name a collection: write its pitch classes, find the most compact way to arrange them (try the inversion too), and transpose that to start on 0. C–E–F, for example, is {0,4,5}; inverted it becomes {0,1,5}, so it's <b>3-4</b>.</p>` },
    { title: "Bartók's String Quartet No. 2", kick: "A set at work", render: () => `<p>In the second movement of Bartók's String Quartet No. 2 (1917), <b>3-3</b> is everywhere. Its sound is easy to spot: a major 3rd divided by a half step on one side or the other.</p>
      <p><b>Rehearsal 1:</b> the motives are framed by 3-3. In bar 19 a G♯ stretches the set toward a scale, and in bar 23 a C♯ produces a second form of 3-3, a half step higher.</p>`
      + IMG("bartok-sq2-reh1.png", 1024, 240, "Bars 12 to 25 of the first violin in 2/4: repeated F, D, F eighth notes, then F-sharp, F and D with G-sharp added, ending with grace-note figures and a ritard.", "Rehearsal 1, bars 12–25.")
      + `<p><b>Rehearsal 4:</b> the notes of 3-3 are the main pitches of the melody.</p>`
      + IMG("bartok-sq2-reh4.png", 1024, 294, "Bars 52 to 70 in bass and alto clefs, with brackets labeled 3-3 over the opening figure in bar 52 and over bars 64 to 65.", "Rehearsal 4, bars 52–70, with forms of 3-3 bracketed.")
      + `<p><b>Rehearsal 7:</b> 3-3 shares the stage with <b>3-4</b> (015), a perfect 4th with a half step inside.</p>`
      + IMG("bartok-sq2-reh7.png", 1024, 256, "Bars 79 to 88 in alto clef: a bracket labeled 3-3 over bars 79 to 83 and one labeled 3-4 over bars 83 to 85.", "Rehearsal 7, bars 79–88: 3-3, then 3-4.")
      + `<p><b>Bar 116:</b> a strong chord combines 3-3 and 3-4 into one sonority.</p>`
      + IMG("bartok-sq2-bar116.png", 848, 307, "The chord at bar 116, then its pitches spelled out in a line, with overlapping boxes marking the 3-4 trichord and the 3-3 trichord they contain.", "Bar 116: the chord, and its 3-4 and 3-3 subsets.", 560)
      + `<p><b>Rehearsal 11:</b> the cello melody blends both sets.</p>`
      + IMG("bartok-sq2-reh11.png", 1024, 353, "Cello melody, bars 116 to 130, in bass and tenor clefs, with brackets labeling forms of 3-3 and 3-4, one marked 3-4 plus F-sharp, and a note that the trichord later adds D.", "Rehearsal 11, bars 116–130: the cello weaves 3-3 and 3-4 together.")
      + `<p class="note">Recordings of each passage are in Dr. Silverman's post <a href="https://adambsilverman.com/2019/01/composition-ii-pitch-sets/" target="_blank" rel="noopener">Composition II – Pitch Sets</a>.</p>` },
    { title: "Composing with a set", kick: "Melody, chords, embellishment", render: (H, k, U) => `<p>Pick one or two sets and let them supply both the line and the harmony.</p>
      <ul><li><b>Melodic cells:</b> spin a melody from transpositions and inversions of the set. The ear hears the repeated interval shape even when the notes change.</li>
      <li><b>Chords:</b> stack the same set (or a second one) as harmony, voiced in different registers.</li>
      <li><b>Embellishment:</b> add passing and neighbor notes around set tones, the way tonal melodies decorate a triad.</li>
      <li><b>Combinations:</b> pair two sets that share notes, as Bartók pairs 3-3 and 3-4, or join forms of one set into larger collections.</li></ul>`
      + U.fig(cellFig([[0, 1, 4], [5, 8, 9], [2, 3, 6], [7, 10, 11]], ["{0,1,4}", "{5,8,9}", "{2,3,6}", "{7,10,11}"], [FLAT, SHARP, FLAT, SHARP]), "A line built only from forms of 3-3: the original, a transposed inversion, a transposition and another transposed inversion.")
      + `<p class="note">Try it: choose a trichord from the table, write four forms of it, and connect them into an eight-bar melody. Then harmonize it with chords made from the same set.</p>` },
    { title: "Quick check", kick: "Before the drills", render: H => F.concept.slice(0, 3).map(([q, a, w, y]) => H.check(q, a, w, y)).join("") },
  ] };
  function tbl(cap, head, rows) { return `<div class="ltable-wrap" tabindex="0" role="region" aria-label="${cap}"><table class="ltable"><caption>${cap}</caption><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`; }
  function make(mode, H) { if (GEN[mode]) return GEN[mode](H); const [q, a, w, y] = H.rnd(F.concept); return H.mc(q, a, w, y); }
  const reference = () => `<ul><li><b>Pitch classes:</b> C = 0, C♯/D♭ = 1 … B = 11; count mod 12.</li><li><b>Transpose (Tn):</b> add n to every number. <b>Invert (I):</b> 12 − x, then transpose as needed.</li><li><b>Set class:</b> all transpositions and inversions of a set. <b>Prime form:</b> most compact arrangement starting on 0. <b>Forte number:</b> size–list number (3-3 = (014)).</li><li><b>Trichords:</b> ${Object.entries(TRI).map(([p, n]) => `${n} (${p})`).join(", ")}.</li></ul>`;
  return { key: "silverapps-pitchsets-v1", lesson, make, reference, modes: [{ id: "pc", kicker: "Pitch classes" }, { id: "tn", kicker: "Transpose and invert" }, { id: "name", kicker: "Name the set" }, { id: "concept", kicker: "Concepts" }], topics: [] };
})();
// ===== Test yourself quiz (engine adds it as the step before Practice; s = step to look back at) =====
window.FAM.quiz = [
  {"s": 1, "q": "Why might a composer build a piece from pitch sets?", "a": "to get a consistent vocabulary of melody and harmony without relying on triads", "w": ["to guarantee the piece stays in one key", "to avoid repeating any interval", "to make the rhythm simpler"], "hint": "What do triads do in tonal music?", "why": "A set's intervals give the music a recognizable sound, the way triads do in tonal music."},
  {"s": 2, "q": "What is the pitch-class number of F♯?", "a": "6", "w": ["5", "7", "8"], "hint": "Count half steps up from C = 0.", "why": "C 0, C♯ 1, D 2, E♭ 3, E 4, F 5, F♯ 6."},
  {"s": 2, "q": "What is 9 + 5 in pitch-class arithmetic?", "a": "2", "w": ["14", "4", "11"], "hint": "Count on a 12-hour clock.", "why": "14 − 12 = 2: a perfect 4th above A is D."},
  {"s": 3, "q": "Transpose {0, 1, 4} up 3 half steps. What do you get?", "a": "{3, 4, 7}", "w": ["{0, 3, 4}", "{3, 4, 6}", "{1, 2, 5}"], "hint": "Add 3 to each number.", "why": "0+3, 1+3, 4+3 = {3, 4, 7}: E♭–E–G."},
  {"s": 3, "q": "Which set is the inversion of {0, 1, 4} (12 − x)?", "a": "{0, 11, 8}, the same as {8, 11, 0}", "w": ["{0, 1, 4}", "{4, 5, 8}", "{1, 2, 5}"], "hint": "12 − 0, 12 − 1, 12 − 4.", "why": "0, 11, 8: C, B, A♭. Its intervals are those of {0, 1, 4} turned upside down."},
  {"s": 4, "q": "C–E–F belongs to which set class?", "a": "3-4 (015)", "w": ["3-3 (014)", "3-11 (037)", "3-5 (016)"], "hint": "Try its inversion.", "why": "{0, 4, 5} inverts to {0, 8, 7} = {7, 8, 0}, which starts on 0 as {0, 1, 5}."},
  {"s": 4, "q": "Which trichord set class contains both the major and the minor triad?", "a": "3-11 (037)", "w": ["3-12 (048)", "3-10 (036)", "3-9 (027)"], "hint": "A minor triad is an upside-down major triad.", "why": "Inversion turns C–E–G into C–A♭–F, an F minor triad: one set class."},
  {"s": 5, "q": "In the second movement of Bartók's String Quartet No. 2, which set is most prominent?", "a": "3-3 (014): a major 3rd divided by a half step", "w": ["3-11 (037): a major triad", "3-12 (048): an augmented triad", "3-9 (027): stacked 5ths"], "hint": "Listen for a half step next to a major 3rd.", "why": "It frames motives and melodies throughout; 3-4 (015) joins it later."},
  {"s": 6, "q": "Which is a way to compose with a pitch set?", "a": "spin melodic cells from its transpositions and inversions, and stack it as chords", "w": ["use each note only once in the whole piece", "always play the set in ascending order", "avoid repeating its intervals"], "hint": "A set can be melody or harmony.", "why": "The ear recognizes the set's interval shape in any position, as melody or chord."},
];
