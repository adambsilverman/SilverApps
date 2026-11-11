window.FAM = (() => {
  // ===== Understanding Lead Sheets: lesson only (practice: the Chord Figures and Symbols drills). Example: Brother, Can You Spare a Dime? (build/harmony/dime.js). Engine: build/harmony/engine.js =====
  const tbl = (cap, head, rows) => `<div class="ltable-wrap" tabindex="0" role="region" aria-label="${cap}"><table class="ltable"><caption>${cap}</caption><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  const YT = (id, title, start) => `<div class="lvideo"><iframe src="https://www.youtube-nocookie.com/embed/${id}${start ? `?start=${start}` : ""}" title="${title} (YouTube)" loading="lazy" allow="encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`;
  const C = s => `{sym:${s}}`;
  const D = DIME.IMG.leadsheet;
  const IMG = `<img src="assets/img/dime/leadsheet.png" alt="${"Lead sheet of the first eight bars of Brother, Can You Spare a Dime? in C minor, 4/4, Medium Slow: melody with lyrics, and chord symbols above (Cm, G7/D, C7/E, F, B-flat/D, E-flat, G7, Dm7 flat 5, G7, Cm, A-flat 7, Fm6, G7, Cm, G7), ending with a first ending and a repeat sign."}" width="1600" height="553">`;
  const beatName = b => ({ bar: Math.floor(b / 4) + 1, bt: b - Math.floor(b / 4) * 4 + 1 });
  function regionInfo(i, H) {
    const [s, sym] = DIME.CH[i], e = i + 1 < DIME.CH.length ? DIME.CH[i + 1][0] : DIME.END, a = beatName(s), z = beatName(e - 1);
    const span = a.bar === z.bar ? `bar ${a.bar}, beats ${a.bt}–${z.bt}` : `bars ${a.bar}–${z.bar}`;
    const notes = DIME.MEL.filter(n => n[0] < e - 1e-6 && n[0] + n[1] > s + 1e-6);
    const list = notes.length ? `<ul>${notes.map(n => { const held = n[0] < s - 1e-6, ok = DIME.inChord(sym, n[2]), why = DIME.NCT[held ? "h" + s : n[0]] || "a non-chord tone";
      return `<li>${ok ? "✓" : "✗"} <b>${DIME.name(n[2])}</b> (“${n[3].replace(/^-|-$/g, "")}”${held ? ", held over" : ""}): ${ok ? "a chord tone" : `not in the chord: ${why}`}</li>`; }).join("")}</ul>`
      : `<p>The melody rests here, but the chord still sounds: the accompaniment plays it.</p>`;
    return `<p><b>${H.esc(sym)}</b> (${DIME.CHORD[sym][2]}) · ${span}</p>${list}<button type="button" class="play" data-lsplay="${i}"><span aria-hidden="true">▶ </span>Hear this region</button>`;
  }
  const pc = (v, t) => (v / t * 100).toFixed(2) + "%";
  const regions = () => `<div class="ls-wrap"><div class="ls-score">${IMG}${D.ch.map(([s, x0], i) => { const nx = D.ch[i + 1] && D.ch[i + 1][0] === s ? D.ch[i + 1][1] : D.w - 12, [y0, y1] = D.sys[s], b = beatName(DIME.CH[i][0]);
    return `<button type="button" class="ls-r" data-lsr="${i}" style="left:${pc(x0 - 14, D.w)};width:${pc(nx - x0, D.w)};top:${pc(y0, D.h)};height:${pc(y1 - y0, D.h)}" aria-pressed="false" aria-label="${DIME.CH[i][1]}, bar ${b.bar}, beat ${b.bt}"></button>`; }).join("")}</div></div>
    <div class="ls-info" aria-live="polite"><p>Click a chord symbol (or anywhere under it) to see its region.</p></div>`;

  const lesson = { steps: [
    { title: "What is a lead sheet?", kick: "The song on one staff", render: () => `<p>A <b>lead sheet</b> writes down a song in its most compact form: the <b>melody</b> on a single staff, the <b>lyrics</b> under it, and <b>chord symbols</b> above it. It's how songs are passed around in jazz, pop, folk, musical theater, church music and wedding bands: a <i>fake book</i> is a whole library of them. Everything else about the performance is left to the musicians.</p>
      <figure class="lfig lsfig">${IMG}<figcaption><p class="small lcite">Jay Gorney and E. Y. Harburg, <i>Brother, Can You Spare a Dime?</i> (1932), the first eight bars as a lead sheet.</p></figcaption></figure>
      <p>Here's how Bing Crosby's 1932 recording turned a page like this into a performance, with its own introduction, orchestra and accompaniment:</p>
      ${YT("--QXJJE-60c", "Brother, Can You Spare a Dime?, sung by Bing Crosby")}
      <p class="small lcite">Bing Crosby, <i>Brother, Can You Spare a Dime?</i> (Brunswick, 1932).</p>` },
    { title: "What's on the page, and what isn't", kick: "The players fill in the rest", render: H => `<p>A lead sheet tells you what makes the song <i>that</i> song. It leaves out the things that change from one performance to the next.</p>
      ${tbl("What a lead sheet includes and leaves out", ["Usually included", "Usually left out"], [
        ["the <b>melody</b>: its pitches and rhythm", "the <b>accompaniment</b>: which notes of each chord, in what rhythm and register"],
        ["the <b>lyrics</b>, under the notes", "the <b>bass line</b> (only the bass notes that slash chords ask for)"],
        ["<b>chord symbols</b>, above the staff", "<b>dynamics</b>, accents and most articulations"],
        ["the <b>key</b> and <b>time signature</b>", "<b>instrumentation</b> and who plays what"],
        ["a <b>tempo or style</b> word (“Medium Slow”, “Swing”, “Bossa nova”)", "introductions, fills, solos and endings"],
        ["the <b>form</b>: repeats, first and second endings, section letters, coda signs", "how many times through, and the exact tempo"]])}
      <p>This page says <b>Medium Slow</b>, gives the melody, words and chords, and marks the form: a <b>first ending</b> and a <b>repeat sign</b> send the players back to the top. Nothing says how loud to sing, what the piano plays, or how to begin and end: those are the performers' choices, and they're why two performances of the same lead sheet can sound so different.</p>`
      + H.check("Which of these would you expect to find on a lead sheet?", "chord symbols above the melody", ["the pianist's left-hand part", "dynamics for every phrase", "a written-out drum part"], "Melody, lyrics and chord symbols; the accompaniment is made up from the symbols.") },
    { title: "A chord is a region of harmony", kick: "From one symbol to the next", render: () => `<p>A chord symbol doesn't name a single moment. It marks where a <b>region of harmony</b> begins, and the region lasts until the next symbol. For that whole stretch, the accompaniment plays that chord, in whatever rhythm, register and texture the players choose.</p>
      <ul><li><b>The symbol starts the region</b> on the beat where it's written: ${C("Cm")} fills all of bar 1; after that, almost every bar splits into two regions of two beats.</li>
      <li><b>A held note carries across regions.</b> The B♭ on “run” starts under ${C("G7/D")} and is held into ${C("C7/E")}, where it becomes the chord's 7th.</li>
      <li><b>Melody notes inside a region don't all belong to the chord.</b> Most do, but some are passing tones, neighbors and other <a href="non-chord-tones-lesson.html">non-chord tones</a>: the D and F in “Once I built a” pass between C, E♭ and G.</li>
      <li><b>The accompaniment can move on before the melody does.</b> In bar 8 the singer is still holding C when ${C("G7")} arrives on beat 3; then the singer rests and the G7 leads back to the top.</li></ul>
      <p>Try it: click a chord symbol to light up its region and check its melody notes against the chord.</p>
      ${regions()}`,
      after: (root, H, k, tools) => {
        const info = root.querySelector(".ls-info"), sc = root.querySelector(".ls-score");
        sc.addEventListener("click", e => { const b = e.target.closest("[data-lsr]"); if (!b) return;
          sc.querySelectorAll("[data-lsr]").forEach(x => x.setAttribute("aria-pressed", String(x === b))); info.innerHTML = regionInfo(+b.dataset.lsr, H); });
        info.addEventListener("click", e => { const p = e.target.closest("[data-lsplay]"); if (p) tools.play(DIME.regionPlay(+p.dataset.lsplay)); });
      } },
    { title: "Reading the chords", kick: "What the symbols tell the players", render: H => `<ul>
      <li><b>Harmonic rhythm:</b> after the first bar, the chords change every two beats. That steady motion under a long-note melody (“run,” “time,” “done”) keeps the song moving.</li>
      <li><b>Slash chords</b> name a bass note: ${C("G7/D")} is a G7 chord over D, ${C("C7/E")} a C7 over E, ${C("B♭/D")} a B♭ chord over D. Read the bass notes in bars 1–3 and you get a rising line, C–D–E–F, written into the symbols.</li>
      <li><b>Chord qualities</b> are in the symbol: ${C("Cm")} minor, ${C("G7")} dominant 7th, ${C("Dm7(♭5)")} half-diminished, ${C("Fm6")} minor with an added 6th.</li>
      <li><b>Borrowed and chromatic chords</b> stand out: ${C("C7/E")} and ${C("F")} (with A♮) brighten the minor key for a moment, and ${C("A♭7")} darkens it again.</li>
      <li><b>Chords under held notes and rests:</b> ${C("G7")} in bar 8 arrives under the singer's held C and carries on through the rest that follows. The accompaniment supplies it.</li></ul>`
      + H.check("On a lead sheet, how long does a chord last?", "until the next chord symbol", ["one beat", "until the melody changes note", "until the end of the bar, always"], "A symbol starts a region of harmony that lasts until the next symbol, even through rests and bar lines.")
      + H.check("What does C7/E ask for?", "a C7 chord with E in the bass", ["a C7 chord, then an E chord", "a C7 chord with an added E", "C7 in the melody over an E chord"], "The letter after the slash is the bass note.") },
    { title: "From lead sheet to performance", kick: "Same symbols, different accompaniments", render: () => `<p>Here the melody is sung (top staff) and a pianist accompanies from the chord symbols: right-hand chords on beats 2 and 4, left-hand bass notes on 1 and 3. The chord symbols are hidden; work out which chord each beat of the piano part spells, then show them to check, with each chord's region shaded.</p>
      ${DIME.fig("singer", "Voice and piano: the accompaniment is built entirely from the lead sheet's chord symbols.")}
      <p>The <a href="piano-accompaniment-lesson.html"><b>Piano Accompaniment</b></a> lesson shows other ways to turn the same symbols into a piano part: block chords, stride, Alberti bass and an active bass line.</p>` },
    { title: "Practice", kick: "Reading the symbols fast", render: () => `<p>The <a href="chord-figures-and-symbols.html"><b>Chord Figures and Symbols</b></a> drills practice reading chord symbols: spelling them, naming them, and hearing them. To try accompaniments yourself, put a progression into the <a href="chord-progression-lab.html"><b>Groove Player</b></a>.</p>` },
  ] };
  return { key: "silverapps-leadsheets-v1", lesson, make: () => null, reference: () => "", modes: [], topics: [] };
})();
