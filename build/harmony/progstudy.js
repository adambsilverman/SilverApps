window.FAM = (() => {
  // ===== Chord Progressions in Real Songs: an in-class study (lesson only). Adam's handout "Chord Progressions for in-class study":
  // Betty, Wild World, In Bloom, Fast Car (his recordings in assets/audio/progressions/) and Prelude to a Kiss (Ella Fitzgerald).
  // Each step: listen, look, discuss, then open the analysis. Lyrics are left out of the chord charts typed here. =====
  const FU = `<p class="note lcite fair-use" data-fair-use></p>`;
  const AUD = (f, label) => `<audio controls preload="none" src="assets/audio/progressions/${f}.mp3" aria-label="${label}">Your browser can't play this audio clip.</audio>`;
  const IMG = (f, w, h, alt) => `<img src="assets/img/progressions/${f}.png" width="${w}" height="${h}" alt="${alt}" loading="lazy">`;
  const FIG = (inner, cap) => `<figure class="lfig ps-fig">${inner}<figcaption><p>${cap}</p>${FU}</figcaption></figure>`;
  const QS = qs => `<div class="ps-q"><h3>Discuss</h3><ol>${qs.map(q => `<li>${q}</li>`).join("")}</ol></div>`;
  const ANS = html => `<details class="ps-ans"><summary>Analysis</summary>${html}</details>`;
  const ROW = (label, chords) => `<tr><th scope="row">${label}</th><td>${chords.map(c => `<span class="ps-ch">${c}</span>`).join("")}</td></tr>`;
  const CHART = (cap, rows) => `<div class="ltable-wrap" tabindex="0" role="region" aria-label="${cap}"><table class="ltable ps-chart"><caption>${cap}</caption><tbody>${rows.join("")}</tbody></table></div>`;

  const lesson = { steps: [
    { title: "How this works", kick: "Before you start", render: () => `<p>Five songs, one per step. Play the recording, look at the chords, and talk through the questions before anyone opens the <b>Analysis</b>. Most of these progressions do something the chart in <a href="harmonic-succession-lesson.html">Harmonic Succession</a> predicts. A couple don't, and those are the interesting ones.</p>
      <p>For each song, look for two things. Which chords carry the progression, and which ones only fill in or decorate? And where does the harmony move toward the tonic, where does it stall, and where does it go backward?</p>` },

    { title: "Taylor Swift, “Betty”", kick: "Expanding the tonic", render: () => FIG(AUD("betty", "Taylor Swift, Betty, excerpt") + IMG("betty", 1800, 1094, "Lead sheet excerpt of Betty with chord symbols D, A/C sharp, G/B, D/A, G, D/F sharp, E minor, A, repeated; then a chorus alternating D, A and G, ending D, D/F sharp, G."), "Taylor Swift, Joe Alwyn and Aaron Dessner, “Betty” (2020).")
      + QS(["Sing or play just the bass notes of the first four chords. What does the bass do?", "Which of the first four chords really move the harmony, and which only fill in between tonics?", "The chorus alternates D, A and G. Is A → G a progression or a retrogression?"])
      + ANS(`<p>In D major: <b>D – A/C♯ – G/B – D/A</b> is {rn:I} – {rn:V6} – {rn:IV6} – {rn:I64}, then <b>G – D/F♯ – Em – A</b> is {rn:IV} – {rn:I6} – {rn:ii} – {rn:V}.</p>
        <p>The bass walks straight down the scale: D, C♯, B, A, then G, F♯, E. The first four chords are one long tonic. {rn:V6} and {rn:IV6} are passing chords, there because the bass is moving by step, not because the harmony is going anywhere. The real motion starts with {rn:IV} – {rn:I6} – {rn:ii} – {rn:V}: pre-dominant, then dominant.</p>
        <p>The chorus, {rn:I} – {rn:V} – {rn:IV}, is a retrogression ({rn:V} moving back to {rn:IV}). It's everywhere in rock and pop, and nobody hears it as wrong. It just doesn't push toward the tonic the way {rn:IV} – {rn:V} would.</p>`) },

    { title: "Cat Stevens, “Wild World”", kick: "Around the circle in minor", render: () => FIG(AUD("wild-world", "Cat Stevens, Wild World, excerpt") + IMG("wild-world", 1800, 640, "Published sheet music excerpt of Wild World with guitar chord diagrams: A minor, D7, G, C major 7, F, D minor, E."), "Cat Stevens, “Wild World” (1970).")
      + QS(["Write down the root of each chord. How far does each root move to the next?", "Which boxes of the minor progression chart does this pass through, and in what order?", "How does the phrase end? What kind of cadence is it?"])
      + ANS(`<p>In A minor: <b>Am – D7 – G – Cmaj7 – F – Dm – E</b> is {rn:i} – {rn:IV7} – {rn:VII} – {rn:III} – {rn:VI} – {rn:iv} – {rn:V}.</p>
        <p>The first five roots fall by 5ths: A, D, G, C, F. That's a descending-fifths sequence, and from {rn:VII} on it follows the minor chart box by box: {rn:VII} → {rn:III} → {rn:VI} → {rn:iv} → {rn:V}. The phrase stops on {rn:V}, a half cadence, which is why the next line has to come.</p>
        <p>D7 is a major {rn:IV} with an F♯, the raised 6th degree. It makes the opening a little brighter than plain natural minor would.</p>`) },

    { title: "Nirvana, “In Bloom”", kick: "Chromatic power chords", render: () => FIG(AUD("in-bloom", "Nirvana, In Bloom, excerpt"), "Nirvana, “In Bloom” (1991), Kurt Cobain.")
      + CHART("“In Bloom,” verse (lyrics omitted)", [ROW("Line 1", ["B♭", "G♭", "E♭", "B", "A"]), ROW("Line 2", ["B♭", "G♭", "E♭", "B", "A"]), ROW("Line 3", ["B♭", "G♭", "E♭", "B", "A"]), ROW("Line 4", ["B♭", "G♭", "E♭", "B", "D"])])
      + QS(["Which of these chords belong to B♭ major? Which don't?", "How do the roots move? Look at the distance from each chord to the next.", "Nothing here works like a dominant. How does A lead back to B♭ anyway?"])
      + ANS(`<p>Only B♭ ({rn:I}) and E♭ ({rn:IV}) belong to B♭ major. G♭ is {rn:♭VI}, borrowed from B♭ minor. B is really C♭, a {rn:♭II}. A is a major chord on the leading tone.</p>
        <p>The roots fall by 3rds: B♭ down to G♭ (a major 3rd), G♭ down to E♭ (a minor 3rd), E♭ down to B (another major 3rd), then a step down to A. A goes back to B♭ by a half step in the bass, so it does the leading tone's job without being a dominant chord.</p>
        <p>These are power chords, the same hand shape slid up and down the neck. The progression comes from the guitar as much as from any theory of function. The fourth line swaps A for D, a chromatic mediant, to break the loop before the chorus.</p>`) },

    { title: "Tracy Chapman, “Fast Car”", kick: "Where's home?", render: () => FIG(AUD("fast-car", "Tracy Chapman, Fast Car, excerpt"), "Tracy Chapman, “Fast Car” (1988).")
      + CHART("“Fast Car,” verse (lyrics omitted)", [ROW("Lines 1–2", ["E", "D", "A"]), ROW("Line 3", ["F♯m", "E"]), ROW("Line 4", ["D", "F♯m", "E"]), ROW("Line 5", ["D", "F♯m", "E", "D", "E"])])
      + QS(["Which chord sounds like home? Vote before you argue.", "Give Roman numerals with A as the tonic. Now do it again with E as the tonic.", "What chord never shows up that would settle the question?"])
      + ANS(`<p>Two readings work. In A major: <b>E – D – A</b> is {rn:V} – {rn:IV} – {rn:I}, and the later lines are {rn:vi} – {rn:V} and {rn:IV} – {rn:vi} – {rn:V}. In E: {rn:I} – {rn:♭VII} – {rn:IV}, then {rn:ii} – {rn:I} and {rn:♭VII} – {rn:ii} – {rn:I}, which is E <b>Mixolydian</b> (E major with a lowered 7th, D♮).</p>
        <p>The lines keep ending on E, and E is where the music rests. But there's no B major chord (with D♯) to confirm E as a major-key tonic, and no E7 to A to confirm A. The song lives in that gap. Most listeners hear E as home, which makes this a Mixolydian progression: {rn:♭VII} – {rn:I} instead of {rn:V} – {rn:I}.</p>`) },

    { title: "Duke Ellington, “Prelude to a Kiss”", kick: "A chain of dominants", render: () => FIG(AUD("prelude-to-a-kiss", "Prelude to a Kiss, sung by Ella Fitzgerald, excerpt") + IMG("prelude-to-a-kiss", 1800, 668, "Lead sheet of Prelude to a Kiss in F major, eight bars with chord symbols: G7, C7 sharp 5, F major 7, B-flat major 7, E7 flat 9, A7, D7 flat 9, G minor 7, C7 sharp 5, D minor 7, G7 sharp 5, G minor 7, C7 sharp 5, F major 7, D7 sharp 5."), "Duke Ellington, Irving Gordon and Irving Mills, “Prelude to a Kiss” (1938). Sung by Ella Fitzgerald.")
      + QS(["Write the root of each chord in bars 3 and 4. How are they related?", "Which chords are diatonic in F major, and which are dominant 7ths that don't belong?", "Where does the phrase reach the tonic? How many chords does it take to get there from E7?"])
      + ANS(`<p>In F major the opening is {rn:V7/V} – {rn:V7} – {rn:I} – {rn:IV}: G7 is the dominant of C, and C7 the dominant of F.</p>
        <p>Then comes a chain: <b>E7 – A7 – D7 – Gm7 – C7 – F</b>. Every root falls a 5th, and every chord but Gm7 is a dominant 7th, each one acting as the {rn:V7} of the next. It's the circle of fifths from the progression chart, with each chord made into an applied dominant so it pulls even harder toward the next.</p>
        <p>The altered 5ths and 9ths (♯5, ♭9) add chromatic voice leading on top without changing where the roots go. The phrase ends on Fmaj7, then D7(♯5) turns it around toward Gm7 and the next phrase.</p>`) },

    { title: "Compare", kick: "Side by side", render: () => `<p>Put the five songs side by side. “Wild World” and “Prelude to a Kiss” are built almost entirely from roots falling by 5ths, one in minor and one with every chord turned into a dominant. “Betty” stretches its tonic with a stepwise bass before a textbook {rn:IV} – {rn:ii} – {rn:V}. “Fast Car” never decides between two tonics. “In Bloom” barely uses function at all.</p>
      <p>Which of them would you call common-practice progressions? Which ones does the chart explain, and which need some other explanation?</p>` },
  ] };
  return { key: "silverapps-progstudy-v1", lesson, make: () => null, reference: () => "", modes: [], topics: [] };
})();
