window.FAM = (() => {
  // ===== Improvisation: foundations, playing over harmony, traditions and practice. =====
  const tbl = (cap, head, rows) => `<div class="ltable-wrap" tabindex="0" role="region" aria-label="${cap}"><table class="ltable"><caption>${cap}</caption><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  const F = {
    found: [
      ["Most improvisers build their vocabulary by…", "listening, imitating and learning phrases by ear", ["avoiding recordings", "only reading exercises", "improvising without any listening"], "Transcribing (learning solos by ear) is a traditional way to absorb a style."],
      ["Call and response in improvisation means…", "answering a phrase with a related phrase", ["playing the same note repeatedly", "stopping when someone else plays", "reading a written solo"], "It works alone (question and answer) or between players."],
      ["Leaving space (rests) in an improvised solo…", "lets phrases breathe and gives listeners time to absorb ideas", ["is always a mistake", "makes the solo shorter only", "isn't allowed in jazz"], "Phrasing like speech: phrases and pauses."],
      ["A useful way to develop an improvised idea is to…", "repeat it and vary it (rhythm, pitch, register)", ["never play it again", "switch keys at random", "play it louder only"], "Motivic development makes a solo coherent."],
      ["Restricting yourself to a few notes or one rhythm while practicing improvisation…", "sharpens creativity and control", ["is pointless", "is only for beginners", "makes it impossible to improvise"], "Limits help you find variety in rhythm, dynamics and articulation."],
      ["Playing a 'wrong' note while improvising is best handled by…", "resolving it by step or repeating it with conviction", ["stopping", "apologizing", "playing louder"], "Any note can sound intentional depending on what happens next."],
    ],
    harm: [
      ["Guide tones of a 7th chord are its…", "3rd and 7th", ["root and 5th", "5th and 9th", "root and 3rd"], "They define the chord's quality and move smoothly to the next chord's guide tones."],
      ["Target notes are…", "chord tones you aim for on strong beats", ["notes to avoid", "always the root", "only the highest notes"], "Approach them from a step above or below (chromatic or diatonic)."],
      ["In a ii–V–I in a major key, the 7th of the ii chord usually moves to…", "the 3rd of V", ["the root of V", "the 5th of I", "a note a tritone away"], "Dm7 → G7: C moves down to B; G7's F then moves to E in C△7."],
      ["The minor pentatonic scale on A is…", "A C D E G", ["A B C D E", "A C E G B", "A B D E F♯"], "Five notes with no half steps: a common starting point for blues, rock and many folk styles."],
      ["The blues scale adds which note to the minor pentatonic?", "the ♭5 (e.g. E♭ in A)", ["the major 7th", "the 2nd", "the ♭2"], "A C D E♭ E G."],
      ["Chord–scale thinking means…", "matching each chord with a scale that contains its chord tones", ["using one scale for a whole piece", "avoiding chord tones", "playing only arpeggios"], "In major keys, the diatonic modes line up with the chords built on each degree."],
      ["Over a dominant 7th chord in a major key (V7), the matching mode is…", "Mixolydian", ["Lydian", "Phrygian", "Locrian"], "G7 in C major: G Mixolydian (G A B C D E F)."],
    ],
    trad: [
      ["In jazz, a 'chorus' in a solo usually means…", "one time through the tune's chord progression", ["a vocal refrain", "a group of singers", "the last bar"], "Soloists often take several choruses."],
      ["The 12-bar blues uses mainly which chords?", "I, IV and V (often as dominant 7ths)", ["ii, iii and vi", "only I", "♭II and ♭VI"], "A standard frame for improvising in blues, jazz and rock."],
      ["In Hindustani and Karnatak classical music, improvisation is based on…", "a raga (a melodic framework) and a tala (a rhythmic cycle)", ["chord progressions", "twelve-tone rows", "written cadenzas only"], "Performers develop the raga's characteristic phrases in long improvised sections."],
      ["In Baroque music, basso continuo players…", "improvised chords from a bass line and figures", ["played only what was fully written", "never played chords", "sang the bass"], "Ornamenting melodies was also expected of soloists."],
      ["A cadenza in a concerto was traditionally…", "an improvised (or improvised-sounding) solo passage near the end of a movement", ["the first theme", "a written orchestral tutti", "a key signature change"], "Later composers often wrote cadenzas out."],
      ["Free improvisation…", "doesn't depend on a set tune, key or form", ["always follows the 12-bar blues", "is fully written out", "is only for solo piano"], "Players respond to each other's sounds and gestures."],
      ["Trading fours in jazz means…", "soloists (often with the drummer) alternate four-bar solos", ["playing four notes", "playing in 4/4 only", "four players solo at once"], "A conversational way to end a round of solos."],
    ],
    prac: [
      ["Practicing improvisation over a drone or backing track helps you…", "hear how each note relates to the harmony", ["avoid listening", "play faster only", "memorize notation"], "The Drone app on this site gives a steady reference pitch."],
      ["Learning a tune's melody before improvising on it helps because…", "solos often refer to the melody and its phrasing", ["the melody is forbidden in solos", "it makes improvising unnecessary", "it shortens the tune"], "Many players embellish the melody first, then move away from it."],
      ["Recording your improvisations and listening back…", "shows habits and good ideas you didn't notice while playing", ["is discouraged", "is only for professionals", "makes you forget ideas"], "Keep the good ideas; work on the habits."],
      ["Singing what you want to play…", "connects your inner hearing to your instrument", ["ruins your tone", "is only for singers", "slows learning"], "If you can sing it, you can aim to play it."],
      ["A practical goal for a beginning improviser is to…", "play short, clear phrases that fit the beat and the chord", ["play as many notes as possible", "avoid the beat", "use every scale at once"], "Rhythm and phrasing matter more than the number of notes."],
    ],
  };
  const KEYS = ["C", "G", "D", "F", "B♭", "E♭", "A"], LET = "CDEFGAB";
  const scale = k => { const sharps = { C: 0, G: 1, D: 2, A: 3, F: -1, "B♭": -2, "E♭": -3 }[k], n = sharps, l0 = LET.indexOf(k[0]); const S = "FCGDAEB", Fl = "BEADGCF";
    return [0, 1, 2, 3, 4, 5, 6].map(i => { const L = LET[(l0 + i) % 7]; const acc = n > 0 && S.slice(0, n).includes(L) ? "♯" : n < 0 && Fl.slice(0, -n).includes(L) ? "♭" : ""; return L + acc; }); };
  const MODES = ["Ionian", "Dorian", "Phrygian", "Lydian", "Mixolydian", "Aeolian", "Locrian"], RN = ["I△7", "ii7", "iii7", "IV△7", "V7", "vi7", "viiø7"], Q = ["△7", "m7", "m7", "△7", "7", "m7", "ø7"];
  const GT = { "C7": "E and B♭", "F7": "A and E♭", "G7": "B and F", "D7": "F♯ and C", "A7": "C♯ and G", "B♭7": "D and A♭", "Dm7": "F and C", "Am7": "C and G", "Gm7": "B♭ and F", "Em7": "G and D", "C△7": "E and B", "F△7": "A and E", "G△7": "B and F♯", "B♭△7": "D and A" };
  const GEN = {
    harm: H => {
      if (Math.random() < .6) { const k = H.rnd(KEYS), s = scale(k), d = Math.floor(Math.random() * 7), ch = s[d] + Q[d];
        return H.mc(`In ${k} major, which mode fits the ${RN[d]} chord (${ch})?`, `${s[d]} ${MODES[d]}`, MODES.filter((_, i) => i !== d).map(m => `${s[d]} ${m}`), `The ${["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"][d]} mode of ${k} major is ${MODES[d]}: ${s.slice(d).concat(s.slice(0, d)).join(" ")}.`); }
      const c = H.rnd(Object.keys(GT)); return H.mc(`What are the guide tones (3rd and 7th) of ${c}?`, GT[c], Object.values(GT).filter(x => x !== GT[c]), `${c}: 3rd and 7th = ${GT[c]}.`);
    },
  };
  const blues = { type: "score", clefs: ["treble"], time: "4/4", vf: "C", sig: {}, bpm: 90, minBar: 260, bars: [
    { t: [[{ k: ["A4"], d: "8", ly: "A" }, { k: ["C5"], d: "8", ly: "C" }, { k: ["D5"], d: "8", ly: "D" }, { k: ["E♭5"], d: "8", ly: "E♭" }, { k: ["E5"], d: "8", ly: "E" }, { k: ["G5"], d: "8", ly: "G" }, { k: ["A5"], d: "q", ly: "A" }]] }] };
  const lesson = { steps: [
    { title: "What improvisation is", kick: "Composing in real time", render: () => `<p><b>Improvisation</b> is making music up as you perform it. It's found in nearly every musical tradition: jazz and blues solos, raga performances in South Asian classical music, ornamentation and continuo playing in Baroque music, organ improvisation in church services, rock and folk solos, freestyle rap, and free improvisation with no set form at all.</p>
      <p>Improvisers aren't starting from nothing. They draw on a <b>vocabulary</b> (phrases, rhythms, sounds) learned by listening and imitation, and a <b>framework</b> (a tune, a chord progression, a raga and tala, a groove) that they and other players share.</p>` },
    { title: "Starting simply", kick: "Rhythm, space and repetition", render: () => `<ul><li><b>Limit the notes</b>: improvise with three notes, or one, and find variety in rhythm, articulation, dynamics and register.</li>
      <li><b>Phrase like speech</b>: short phrases with rests between them.</li>
      <li><b>Call and response</b>: play a short phrase, then answer it with a related one.</li>
      <li><b>Repeat and vary</b>: develop one idea instead of always playing a new one.</li>
      <li><b>Feel the beat</b>: a simple phrase placed firmly in time sounds better than a busy one that drifts.</li></ul>` },
    { title: "Scales for improvising", kick: "Pentatonic and blues", render: (H, k, U) => `<p>The <b>minor pentatonic</b> scale (A C D E G) has no half steps, so it's hard to land on a clashing note: a common first scale in blues, rock and many folk styles. The <b>major pentatonic</b> (C D E G A) uses the same notes from a different tonic. The <b>blues scale</b> adds the ♭5 to the minor pentatonic:</p>
      ${U.fig(blues, "The A blues scale: A C D E♭ E G A.")}
      <p>The <b>12-bar blues</b> (I7 for 4 bars, IV7 for 2, I7 for 2, V7, IV7, I7, V7 or I7) is a classic frame to practice on.</p>` },
    { title: "Playing the changes", kick: "Chord tones, guide tones, modes", render: () => `<p>In jazz and many other styles, soloists follow the chord progression (the <b>changes</b>).</p>
      <ul><li><b>Target notes</b>: land chord tones on strong beats, approached by step from above or below.</li>
      <li><b>Guide tones</b>: a 7th chord's 3rd and 7th define its quality and connect smoothly from chord to chord: in Dm7 → G7 → C△7, C → B and F → F → E.</li>
      <li><b>Chord–scale thinking</b>: each chord in a major key goes with the mode starting on its root.</li></ul>
      ${tbl("Chords and modes in a major key (C major)", ["Chord", "Mode", "Notes"], RN.map((r, i) => [`${r} (${scale("C")[i]}${Q[i]})`, MODES[i], scale("C").slice(i).concat(scale("C").slice(0, i)).join(" ")]))}` },
    { title: "Traditions of improvisation", kick: "Many frameworks", render: () => `<ul><li><b>Jazz</b>: solos over a tune's chorus structure; comping (improvised accompaniment); trading fours; collective improvisation in early jazz.</li>
      <li><b>Blues and rock</b>: pentatonic and blues-scale vocabulary, bends and riffs over the 12-bar blues and other progressions.</li>
      <li><b>South Asian classical music</b>: improvised exploration of a <b>raga</b> (characteristic notes, phrases and mood) over a <b>tala</b> (rhythmic cycle), often starting with an unmetered introduction.</li>
      <li><b>Baroque practice</b>: realizing figured bass, ornamenting repeats, and improvised cadenzas.</li>
      <li><b>Middle Eastern maqam</b> traditions: the improvised taqsim exploring a maqam's characteristic phrases.</li>
      <li><b>Free improvisation</b>: no preset form, key or meter; players listen and react.</li>
      <li><b>Freestyle</b> in hip-hop: improvised rhyming over a beat.</li></ul>` },
    { title: "How to practice", kick: "Building the skill", render: () => `<ul><li><b>Listen and transcribe</b>: learn favorite phrases by ear, then use them in new keys and contexts.</li>
      <li><b>Learn the melody</b> of a tune before soloing on it.</li>
      <li><b>Sing</b> your ideas; it connects hearing and playing.</li>
      <li><b>Practice with a drone or backing track</b> so every note is heard against the harmony (try the Drone app).</li>
      <li><b>Record yourself</b> and listen back for habits and good ideas.</li>
      <li><b>Play with others</b>: improvising is listening as much as playing.</li></ul>` },
    { title: "Quick check", kick: "Before the drills", render: H => Object.keys(F).map(m => { const [q, a, w, y] = F[m][0]; return H.check(q, a, w, y); }).join("") },
  ] };
  const ALL = Object.values(F).flat();
  function make(mode, H) { if (GEN[mode] && Math.random() < .5) return GEN[mode](H); const [q, a, w, y] = H.rnd(F[mode] || ALL); return H.mc(q, a, w, y); }
  const reference = () => `<ul><li><b>Basics</b>: limit the notes, leave space, call and response, repeat and vary, lock to the beat.</li><li><b>Scales</b>: minor pentatonic (1 ♭3 4 5 ♭7), major pentatonic (1 2 3 5 6), blues (1 ♭3 4 ♭5 5 ♭7).</li><li><b>Changes</b>: target chord tones on strong beats; guide tones = 3rd and 7th.</li><li><b>Modes in major</b>: I Ionian, ii Dorian, iii Phrygian, IV Lydian, V Mixolydian, vi Aeolian, vii Locrian.</li><li><b>Traditions</b>: jazz, blues, raga and tala, Baroque continuo and cadenzas, maqam taqsim, free improvisation, freestyle.</li></ul>`;
  return { key: "silverapps-improv-v1", lesson, make, reference, modes: [{ id: "found", kicker: "Foundations" }, { id: "harm", kicker: "Playing over harmony" }, { id: "trad", kicker: "Traditions" }, { id: "prac", kicker: "Practice" }], topics: [] };
})();
