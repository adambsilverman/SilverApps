window.FAM = (() => {
  // ===== Lyrics and lyric analysis from a musical perspective, including which comes first. =====
  const tbl = (cap, head, rows) => `<div class="ltable-wrap" tabindex="0" role="region" aria-label="${cap}"><table class="ltable"><caption>${cap}</caption><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  const F = {
    sound: [
      ["A perfect rhyme matches…", "the stressed vowel and every sound after it, with different consonants before", ["only the first letter", "only the spelling", "the number of syllables only"], "night / light; falling / calling."],
      ["A slant (near) rhyme…", "has similar but not identical sounds", ["is spelled alike but sounds different", "repeats the same word", "has no vowels"], "home / alone, time / mine: very common in songs because it sounds natural."],
      ["An eye rhyme…", "looks like a rhyme on the page but doesn't sound like one", ["is a rhyme in the middle of a line", "rhymes two stressed syllables", "is only for poetry"], "love / move."],
      ["An internal rhyme is…", "a rhyme within a line, not just at line ends", ["a rhyme scheme of AABB", "a rhyme in a different language", "a rhyme hidden in the music"], "Common in rap, where many syllables per line rhyme."],
      ["Which vowels are easiest to sustain on high notes?", "open vowels such as 'ah' and 'oh'", ["closed vowels such as 'ee'", "words ending in many consonants", "silent letters"], "Singers often modify closed vowels up high."],
      ["A rhyme scheme of ABCB means…", "only lines 2 and 4 rhyme", ["every line rhymes", "lines 1 and 3 rhyme", "no lines rhyme"], "Common in ballads and many songs; AABB and ABAB rhyme more."],
    ],
    prosody: [
      ["Prosody in songwriting means…", "matching the words' natural rhythm, stress and meaning to the music", ["the singer's tone", "the number of verses", "the key of the song"], "Good prosody makes lyrics sound natural and emotionally right."],
      ["Stressed syllables usually work best on…", "strong beats, longer notes or higher notes", ["weak offbeats only", "rests", "the shortest notes"], "Setting 'to-MOR-row' as 'TO-mor-row' sounds wrong."],
      ["A melisma is…", "one syllable sung over several notes", ["one note per syllable", "a spoken lyric", "a rhyme"], "Syllabic setting gives one note per syllable."],
      ["Word painting is…", "music that imitates the meaning of the words (rising on 'up', a held note on 'forever')", ["printing words on the score", "writing lyrics first", "a kind of rhyme"], "Renaissance madrigal composers made it famous; songwriters still use it."],
      ["Why might a long, important word be placed at the melody's highest point?", "the peak draws attention and gives the word emotional weight", ["high notes are quieter", "it shortens the song", "rhymes require it"], "Climaxes in melody and meaning reinforce each other."],
    ],
    form: [
      ["In a verse–chorus song, the verses usually…", "have new words each time and tell the story or give details", ["repeat exactly", "contain the title every line", "are instrumental"], "The chorus usually repeats its words and states the main idea."],
      ["The hook is…", "the most memorable, repeated part, often containing the title", ["the final chord", "the bass line only", "the album cover"], "Hooks can be lyrical, melodic, rhythmic or instrumental."],
      ["A pre-chorus…", "builds anticipation between verse and chorus", ["ends the song", "repeats the bridge", "is always spoken"], "Often rises in melody or harmonic tension."],
      ["A bridge in a pop song usually…", "brings a new angle, musically and lyrically, before a final chorus", ["repeats the first verse", "is the introduction", "removes the vocals"], "New chords, a new perspective, or a turn in the story."],
      ["In AABA song form (32-bar form), the B section is called…", "the bridge (or release)", ["the hook", "the coda", "the verse"], "The title is often in the first or last line of the A sections."],
      ["A refrain is…", "a line that returns at the end of each verse", ["a long instrumental solo", "a change of key", "a silence"], "Strophic songs often use a refrain instead of a separate chorus."],
    ],
    first: [
      ["When composers set an existing poem (as in most art song), what comes first?", "the words", ["the music", "the arrangement", "the recording"], "The composer responds to a finished text."],
      ["A topliner writing over a producer's instrumental track usually works…", "music first: melody (often sung with placeholder syllables), then lyrics", ["lyrics first, then the track", "with no melody", "only on the drums"], "Placeholder or 'mumble' lyrics help find a natural rhythm and vowel sounds."],
      ["An advantage of writing lyrics first is…", "the music can shape itself to the words' meaning and rhythm", ["the melody is always catchier", "rhymes are unnecessary", "it's the only professional method"], "Text-first setting often gives strong prosody."],
      ["An advantage of writing music first is…", "a strong melody and groove are in place, and words can be fitted to them", ["lyrics never need revising", "prosody takes care of itself", "it guarantees a hit"], "The risk is awkward stresses or vague words filling space."],
      ["Many songwriting teams and singer-songwriters…", "write words and music together, going back and forth", ["never revise", "always write lyrics last", "always write music last"], "Often a title or hook line arrives with its melody at the same time."],
      ["Starting from a strong title is common because…", "the title often becomes the hook and focuses the song", ["titles are required by law", "titles set the tempo", "it avoids rhymes"], "Many writers build the chorus around the title, then write verses that lead to it."],
    ],
  };
  const RH = [["night / light", "perfect rhyme"], ["stone / bone", "perfect rhyme"], ["away / today", "perfect rhyme"], ["falling / calling", "two-syllable (feminine) perfect rhyme"], ["mother / brother", "two-syllable (feminine) perfect rhyme"], ["dancing / romancing", "two-syllable (feminine) perfect rhyme"],
    ["home / alone", "slant (near) rhyme"], ["time / mine", "slant (near) rhyme"], ["love / enough", "slant (near) rhyme"], ["heart / hard", "slant (near) rhyme"], ["love / move", "eye rhyme"], ["cough / though", "eye rhyme"], ["great / meat", "eye rhyme"]];
  const ST = [["tomorrow", 2, 3], ["forever", 2, 3], ["yesterday", 1, 3], ["beautiful", 1, 3], ["believe", 2, 2], ["morning", 1, 2], ["together", 2, 3], ["alone", 2, 2], ["river", 1, 2], ["December", 2, 3], ["imagine", 2, 3], ["remember", 2, 3], ["wonderful", 1, 3], ["tonight", 2, 2], ["promise", 1, 2], ["guitar", 2, 2], ["today", 2, 2], ["happen", 1, 2], ["understand", 3, 3], ["electric", 2, 3]];
  const ORD = ["", "1st", "2nd", "3rd"];
  const GEN = {
    sound: H => { const [p, t] = H.rnd(RH); return H.mc(`What kind of rhyme is “${p}”?`, t, ["perfect rhyme", "two-syllable (feminine) perfect rhyme", "slant (near) rhyme", "eye rhyme"], { "perfect rhyme": "The stressed vowel and everything after it match.", "two-syllable (feminine) perfect rhyme": "Both syllables after the stress match, with the stress on the next-to-last syllable.", "slant (near) rhyme": "The sounds are close but not identical.", "eye rhyme": "They look alike but sound different." }[t]); },
    prosody: H => { const [w, s, n] = H.rnd(ST); return H.mc(`Which syllable of “${w}” is stressed, and so belongs on a strong beat or longer note?`, `the ${ORD[s]} syllable`, [1, 2, 3].slice(0, Math.max(n, 2)).filter(x => x !== s).map(x => `the ${ORD[x]} syllable`).concat(n === 2 ? ["no syllable"] : []), `Say it aloud: the ${ORD[s]} syllable of “${w}” is the stressed one.`); },
  };
  const pros = { type: "score", clefs: ["treble"], time: "3/4", vf: "C", sig: {}, bpm: 100, minBar: 170, bars: [
    { t: [[{ k: [], d: "h" }, { k: ["E4"], d: "q", ly: "to-" }]] }, { t: [[{ k: ["G4"], d: "h", ly: "MOR-" }, { k: ["F4"], d: "q", ly: "row" }]] },
    { t: [[{ k: ["G4"], d: "h", ly: "TO-" }, { k: ["E4"], d: "q", ly: "mor-" }]] }, { t: [[{ k: ["F4"], d: "h", ly: "row ✗" }, { k: [], d: "q" }]] }] };
  const lesson = { steps: [
    { title: "Lyrics are sound", kick: "Syllables, stress and vowels", render: () => `<p>A lyric isn't only a poem: it's sung, so its <b>sounds</b> matter as much as its meaning. A songwriter or analyst listens for:</p>
      <ul><li><b>Syllables</b>: how many fit in a phrase, and whether the line feels crowded or spacious.</li>
      <li><b>Stress</b>: which syllables are naturally strong (to-<b>MOR</b>-row).</li>
      <li><b>Vowels</b>: open vowels (ah, oh) carry long and high notes well; closed vowels (ee, oo) are harder up high.</li>
      <li><b>Consonants</b>: crisp consonants add rhythm and attack; clusters ("strengths") are hard to sing quickly.</li></ul>` },
    { title: "Rhyme", kick: "Patterns of sound", render: () => `${tbl("Kinds of rhyme", ["Kind", "Example", "Effect"], [["Perfect", "night / light", "strong closure"], ["Two-syllable (feminine)", "falling / calling", "softer, flowing"], ["Slant (near)", "home / alone, time / mine", "natural, conversational"], ["Internal", "rhymes inside a line", "momentum, density (common in rap)"], ["Eye rhyme", "love / move", "a rhyme for the eye only"]])}
      <p><b>Rhyme schemes</b> label line endings with letters: AABB (couplets), ABAB (alternating), ABCB (only lines 2 and 4 rhyme). More rhyme sounds more tightly closed; less rhyme sounds looser and more conversational. Many songs rhyme strictly in the chorus and more loosely in the verses.</p>` },
    { title: "Prosody", kick: "Words and music agree", render: (H, k, U) => `<p><b>Prosody</b> is the fit between a lyric's natural rhythm, stress and meaning and the music it's set to. Stressed syllables usually go on <b>strong beats, longer notes or higher notes</b>.</p>
      ${U.fig(pros, "Good prosody (bars 1–2): the stressed syllable falls on a strong beat and a long note. Poor prosody (bars 3–4): the stress lands on the wrong syllable.")}
      <ul><li><b>Syllabic</b> setting gives one note per syllable; a <b>melisma</b> stretches one syllable over several notes.</li>
      <li><b>Word painting</b> makes the music imitate the text: rising on "up", a long note on "forever", a sudden silence on "stop". Renaissance madrigal composers made it famous.</li>
      <li>Emotional prosody: the melody's peak, the harmony and the arrangement can reinforce the most important words.</li></ul>` },
    { title: "Song form and the hook", kick: "Where the words go", render: () => `${tbl("Common sections", ["Section", "Lyric job"], [["Verse", "new words each time; story, details, setting"], ["Pre-chorus", "builds toward the chorus"], ["Chorus", "repeated words; the main idea, usually with the title"], ["Bridge", "a new angle or turn before the last chorus"], ["Refrain", "a line returning at the end of each verse (strophic songs)"]])}
      <p>The <b>hook</b> is the most memorable part, often the title, placed where it's heard most: the first or last line of the chorus. In <b>AABA</b> (32-bar) form, the title usually sits in the first or last line of the A sections, and the B section (the bridge, or release) contrasts.</p>` },
    { title: "Meaning and point of view", kick: "What the words say", render: () => `<ul><li><b>Point of view</b>: first person (I), second person (you), third person (she, they). A change of point of view between sections can be a powerful turn.</li>
      <li><b>Tense and time</b>: verses often move the story forward in time; the chorus stays fixed.</li>
      <li><b>Concrete images</b>: specific details (objects, places, actions) let listeners feel emotions rather than being told about them.</li>
      <li><b>Figurative language</b>: metaphor, simile, personification, repetition with a changed meaning.</li>
      <li><b>Conversational tone</b>: sung lyrics usually work best close to natural speech.</li></ul>` },
    { title: "Analyzing a lyric musically", kick: "A checklist", render: () => `<ol><li>Map the <b>form</b>: label sections and note which words repeat.</li>
      <li>Mark the <b>rhyme scheme</b> and rhyme types in each section.</li>
      <li>Count <b>syllables and line lengths</b>; notice where lines get longer or shorter.</li>
      <li>Check <b>prosody</b>: are stressed syllables on strong beats? Where are melismas?</li>
      <li>Find the <b>hook</b> and where the title appears.</li>
      <li>Connect <b>meaning and music</b>: what happens in the melody, harmony and arrangement on the key words (a high note, a surprising chord, a sudden drop in texture)?</li></ol>` },
    { title: "Lyrics or music first?", kick: "Many ways in", render: () => `${tbl("Ways songs get written", ["Approach", "How it works", "Strengths and risks"], [["Words first", "a poem or finished lyric is set to music (most art song; some lyricist–composer teams)", "strong prosody and meaning; the melody may follow the words too closely"], ["Music first", "melody or track first, sung on placeholder syllables, then lyrics (common for topliners and producers)", "strong melody and groove; risk of awkward stresses or filler words"], ["Together", "lines arrive with their melodies, revised back and forth (many singer-songwriters and co-writing teams)", "natural fit; can stall without a plan"], ["Title first", "a strong title or hook line, then the chorus around it, then verses leading to it", "focused songs; can feel formulaic"]])}
      <p>There's no single right order. Most professionals use several, and revise words and music together until they fit.</p>` },
    { title: "Quick check", kick: "Before the drills", render: H => Object.keys(F).map(m => { const [q, a, w, y] = F[m][0]; return H.check(q, a, w, y); }).join("") },
  ] };
  const ALL = Object.values(F).flat();
  function make(mode, H) { if (GEN[mode] && Math.random() < .5) return GEN[mode](H); const [q, a, w, y] = H.rnd(F[mode] || ALL); return H.mc(q, a, w, y); }
  const reference = () => `<ul><li><b>Rhyme</b>: perfect, two-syllable (feminine), slant, internal, eye. Schemes: AABB, ABAB, ABCB.</li><li><b>Prosody</b>: stressed syllables on strong beats, long or high notes; syllabic vs melisma; word painting.</li><li><b>Form</b>: verse (details), pre-chorus (build), chorus (title, main idea), bridge (new angle), refrain; AABA.</li><li><b>Meaning</b>: point of view, tense, concrete images, figurative language.</li><li><b>Which first</b>: words first, music first, together, or title first.</li></ul>`;
  return { key: "silverapps-lyrics-v1", lesson, make, reference, modes: [{ id: "sound", kicker: "Sound and rhyme" }, { id: "prosody", kicker: "Prosody" }, { id: "form", kicker: "Song form" }, { id: "first", kicker: "Which comes first?" }], topics: [] };
})();
