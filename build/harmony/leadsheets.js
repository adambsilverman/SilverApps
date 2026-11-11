window.FAM = (() => {
  // ===== Understanding Lead Sheets: lesson only (practice: the Chord Figures and Symbols drills). Example: Hard Times (build/harmony/hardtimes.js). Engine: build/harmony/engine.js =====
  const tbl = (cap, head, rows) => `<div class="ltable-wrap" tabindex="0" role="region" aria-label="${cap}"><table class="ltable"><caption>${cap}</caption><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  const YT = (id, title, start) => `<div class="lvideo"><iframe src="https://www.youtube-nocookie.com/embed/${id}${start ? `?start=${start}` : ""}" title="${title} (YouTube)" loading="lazy" allow="encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`;
  const C = s => `{sym:${s}}`;
  const IMG = `<img src="assets/img/leadsheet/hard-times.png" alt="Lead sheet of the first eight bars of Hard Times Come Again No More by Stephen Foster, in E-flat major, 4/4, marked Moderato: one staff of melody with the lyrics below and chord symbols above (E-flat, E-flat/G, A-flat, B-flat, E-flat/B-flat, B-flat 7)." width="1600" height="712">`;
  // chord regions on the image: [system, left x of the symbol] (pixels of the 2176-wide original), in the order of HT.CH
  const SYSY = [[60, 318], [365, 625], [680, 935]];
  const RX = [[0, 534], [0, 1093], [0, 1310], [0, 1530], [0, 1751], [0, 1904], [1, 218], [1, 728], [1, 937], [1, 1045], [1, 1153], [1, 1496], [1, 1963], [2, 218], [2, 410], [2, 603], [2, 736], [2, 898], [2, 1351], [2, 1568], [2, 1680], [2, 1793]];
  const W0 = 2176, H0 = 969;
  // what to say about each non-chord tone (by its start in beats)
  const NCT = { 1.5: "a neighbor tone (G–F–G)", 4: "a passing tone, on the beat (G–F–E♭)", 5: "held over from the A♭ chord, then up a step to F", 7.75: "an anticipation: B♭ arrives just before the E♭/B♭ chord",
    15.5: "a passing tone (E♭–F–G)", 17.5: "a neighbor tone (G–F–G)", 20: "a passing tone, on the beat (G–F–E♭)", 21: "held over from the A♭ chord, then up a step to F", 31.5: "a passing tone, leading on into the next phrase" };
  const beatName = b => { const bar = Math.floor(b / 4) + 1, bt = b - (bar - 1) * 4 + 1; return { bar, bt: Number.isInteger(bt) ? bt : bt }; };
  function regionInfo(i, H) {
    const [s, sym] = HT.CH[i], e = i + 1 < HT.CH.length ? HT.CH[i + 1][0] : HT.END, c = HT.CHORD[sym], a = beatName(s), z = beatName(e - 1);
    const notes = HT.MEL.filter(n => n[0] >= s - 1e-6 && n[0] < e - 1e-6);
    const span = e - s === 1 ? `bar ${a.bar}, beat ${a.bt}` : a.bar === z.bar ? `bar ${a.bar}, beats ${a.bt}–${z.bt}` : `bars ${a.bar}–${z.bar}`;
    const list = notes.length ? `<ul>${notes.map(n => { const ok = HT.inChord(c, n[2]), nm = HT.name(n[2]).replace(/\d/, ""), w = n[3] ? ` (“${n[3].replace(/^-|-$/g, "")}”)` : " (a held syllable)";
      return `<li>${ok ? "✓" : "✗"} <b>${nm}</b>${w}: ${ok ? "a chord tone" : `not in the chord: ${NCT[n[0]] || "a non-chord tone"}`}</li>`; }).join("")}</ul>`
      : `<p>The melody rests here, but the chord still sounds: the accompaniment plays it and fills the gap.</p>`;
    return `<p><b>${H.esc(sym)}</b> (${c.sp}) · ${span}, ${e - s} beat${e - s === 1 ? "" : "s"}</p>${list}<button type="button" class="play" data-lsplay="${i}"><span aria-hidden="true">▶ </span>Hear this region</button>`;
  }
  const regions = () => `<div class="ls-wrap"><div class="ls-score">${IMG}${RX.map(([sy, x], i) => { const nx = RX[i + 1] && RX[i + 1][0] === sy ? RX[i + 1][1] : 2150, [y0, y1] = SYSY[sy], b = beatName(HT.CH[i][0]);
    return `<button type="button" class="ls-r" data-lsr="${i}" style="left:${((x - 14) / W0 * 100).toFixed(2)}%;width:${((nx - x) / W0 * 100).toFixed(2)}%;top:${(y0 / H0 * 100).toFixed(2)}%;height:${((y1 - y0) / H0 * 100).toFixed(2)}%" aria-pressed="false" aria-label="${HT.CH[i][1]}, bar ${b.bar}, beat ${b.bt}"></button>`; }).join("")}</div></div>
    <div class="ls-info" aria-live="polite"><p>Click a chord symbol (or anywhere under it) to see its region.</p></div>`;

  const lesson = { steps: [
    { title: "What is a lead sheet?", kick: "The song on one staff", render: (H, k, U) => `<p>A <b>lead sheet</b> writes down a song in its most compact form: the <b>melody</b> on a single staff, the <b>lyrics</b> under it, and <b>chord symbols</b> above it. It's how songs are passed around in jazz, pop, folk, musical theater, church music and wedding bands: a <i>fake book</i> is a whole library of them. Everything else about the performance is left to the musicians.</p>
      <figure class="lfig lsfig">${IMG}<figcaption><p class="small lcite">Stephen Foster, <i>Hard Times Come Again No More</i> (1854), the first eight bars as a lead sheet.</p></figcaption></figure>
      <p>Here's how one group of musicians turned that page into a performance, in their own key, with their own introduction, instruments and accompaniment:</p>
      ${YT("uv2AcfmvIuw", "Hard Times Come Again No More, performed by Yo-Yo Ma, Edgar Meyer, Mark O'Connor and James Taylor")}
      <p class="small lcite">Yo-Yo Ma, Edgar Meyer, Mark O'Connor and James Taylor, from <i>Appalachian Journey</i> (2000).</p>` },
    { title: "What's on the page, and what isn't", kick: "The players fill in the rest", render: H => `<p>A lead sheet tells you what makes the song <i>that</i> song. It leaves out the things that change from one performance to the next.</p>
      ${tbl("What a lead sheet includes and leaves out", ["Usually included", "Usually left out"], [
        ["the <b>melody</b>: its pitches and rhythm", "the <b>accompaniment</b>: which notes of each chord, in what rhythm and register"],
        ["the <b>lyrics</b>, under the notes", "the <b>bass line</b> (only the bass notes that slash chords ask for)"],
        ["<b>chord symbols</b>, above the staff", "<b>dynamics</b>, accents and most articulations"],
        ["the <b>key</b> and <b>time signature</b>", "<b>instrumentation</b> and who plays what"],
        ["a <b>tempo or style</b> word (“Moderato”, “Swing”, “Bossa nova”)", "introductions, fills, solos and endings"],
        ["the <b>form</b>: repeats, first and second endings, section letters, coda signs", "how many times through, and the exact tempo"]])}
      <p>In <i>Hard Times</i> the page says <b>Moderato</b> and gives the melody, words and chords. Nothing says how loud to sing, what the piano plays, whether there's a guitar, or how to begin and end: those are the performers' choices, and they're why two performances of the same lead sheet can sound so different.</p>`
      + H.check("Which of these would you expect to find on a lead sheet?", "chord symbols above the melody", ["the pianist's left-hand part", "dynamics for every phrase", "a written-out drum part"], "Melody, lyrics and chord symbols; the accompaniment is made up from the symbols.") },
    { title: "A chord is a region of harmony", kick: "From one symbol to the next", render: H => `<p>A chord symbol doesn't name a single moment. It marks where a <b>region of harmony</b> begins, and the region lasts until the next symbol. For that whole stretch, the accompaniment plays that chord, in whatever rhythm, register and texture the players choose.</p>
      <ul><li><b>The symbol starts the region</b> on the beat where it's written: ${C("A♭")} and ${C("B♭")} in bar 2 each last one beat; ${C("E♭/B♭")} in bar 3 lasts three.</li>
      <li><b>The region keeps going through rests.</b> In bar 4 the melody stops on “poor,” but ${C("A♭")} still sounds on beat 3: the accompaniment fills the gap.</li>
      <li><b>Melody notes inside a region don't all belong to the chord.</b> Most do, but some are passing tones, neighbors and other <a href="non-chord-tones-lesson.html">non-chord tones</a>. The F on “life's” sits inside an ${C("E♭")} region, between two Gs.</li>
      <li><b>The melody can begin before any chord:</b> “Let us” is a pickup, with no symbol yet. The accompaniment waits, or plays an introduction.</li></ul>
      <p>Try it: click a chord symbol to light up its region and check its melody notes against the chord.</p>
      ${regions()}`,
      after: (root, H, k, tools) => {
        const info = root.querySelector(".ls-info"), sc = root.querySelector(".ls-score");
        sc.addEventListener("click", e => { const b = e.target.closest("[data-lsr]"); if (!b) return; const i = +b.dataset.lsr;
          sc.querySelectorAll("[data-lsr]").forEach(x => x.setAttribute("aria-pressed", String(x === b))); info.innerHTML = regionInfo(i, H); });
        info.addEventListener("click", e => { const p = e.target.closest("[data-lsplay]"); if (!p) return; const i = +p.dataset.lsplay, s = HT.CH[i][0], en = i + 1 < HT.CH.length ? HT.CH[i + 1][0] : HT.END; tools.play(HT.regionPlay(s, en, HT.CH[i][1])); });
      } },
    { title: "Reading Hard Times", kick: "What the symbols tell the players", render: H => `<ul>
      <li><b>Harmonic rhythm:</b> most bars have one or two chords, but bars 2 and 6 change on every beat (${C("A♭")} ${C("B♭")} ${C("E♭")} ${C("A♭")}). Faster chord changes push a phrase forward.</li>
      <li><b>Slash chords</b> name a bass note: ${C("E♭/G")} and ${C("E♭/B♭")} are E♭ major chords over G and B♭. Foster's bass climbs E♭–G–A♭–B♭ across bars 1–3, and the slash chords write that line into the symbols.</li>
      <li><b>${C("B♭7")}</b> adds A♭ to the B♭ chord: the dominant 7th that pulls home to ${C("E♭")} at the cadence on “poor” and “more.”</li>
      <li><b>Chords under rests:</b> ${C("A♭")} in bar 4 and ${C("B♭7")} in bar 8 fall where the singer rests. Only the accompaniment plays them.</li>
      <li><b>Repeated music:</b> bars 5–8 repeat bars 1–4 with new words, and the chords tell you the cadence is the same.</li></ul>`
      + H.check("On a lead sheet, how long does a chord last?", "until the next chord symbol", ["one beat", "until the melody changes note", "until the end of the bar, always"], "A symbol starts a region of harmony that lasts until the next symbol, even through rests and bar lines.")
      + H.check("What does E♭/G ask for?", "an E♭ major chord with G in the bass", ["an E♭ chord, then a G chord", "an E♭ chord with an added G", "E♭ in the melody over a G chord"], "The letter after the slash is the bass note.") },
    { title: "From lead sheet to performance", kick: "Same symbols, different accompaniments", render: (H, k, U) => `<p>Here the melody is sung (top staff) and a pianist accompanies from the chord symbols. Each version uses exactly the same chords in the same places; only the accompaniment's rhythm and texture change.</p>
      ${U.fig(HT.spec({ from: -1, to: 16, pattern: "block", melody: "staff" }), "Block chords held for each region, bass on each change.", { follow: true })}
      ${U.fig(HT.spec({ from: -1, to: 16, pattern: "boom", melody: "staff" }), "Boom-chuck: bass on beats 1 and 3, chords on 2 and 4.", { follow: true })}
      ${U.fig(HT.spec({ from: -1, to: 16, pattern: "broken", melody: "staff", opts: {} }), "Broken chords rolling up from the bass, with a few chord tones in the right hand.", { follow: true })}
      <p>The <a href="piano-accompaniment-lesson.html"><b>Piano Accompaniment</b></a> lesson shows how to build these patterns, and more, from any lead sheet.</p>` },
    { title: "Practice", kick: "Reading the symbols fast", render: () => `<p>The <a href="chord-figures-and-symbols.html"><b>Chord Figures and Symbols</b></a> drills practice reading chord symbols: spelling them, naming them, and hearing them. To try accompaniments yourself, put a progression into the <a href="chord-progression-lab.html"><b>Groove Player</b></a>.</p>` },
  ] };
  return { key: "silverapps-leadsheets-v1", lesson, make: () => null, reference: () => "", modes: [], topics: [] };
})();
