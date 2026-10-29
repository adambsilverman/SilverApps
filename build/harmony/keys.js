window.FAM = (() => {
  // ===== Keys, Scale Degrees and Tendency Tones. Engine: build/harmony/engine.js =====
  const DN = ["tonic", "supertonic", "mediant", "subdominant", "dominant", "submediant", "leading tone"];
  const SOL = { major: ["do", "re", "mi", "fa", "sol", "la", "ti"], minor: ["do", "re", "me", "fa", "sol", "le", "te"] };
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const art = s => (/^[aeiou]/i.test(s) ? "an " : "a ") + s;
  // degree index 0–6 (and 7 = raised 7th in minor) → note
  const noteOf = (H, k, i) => i === 7 ? H.up(k.scale[6], 0, 1) : k.scale[i];
  const nameOf = (k, i) => i === 7 ? "leading tone" : (k.mode === "minor" && i === 6 ? "subtonic" : DN[i]);
  const TEND = [
    ["leading tone (ti)", "up to the tonic (do)", "7̂ → 1̂, strongest of all, especially at cadences and in V → I"],
    ["subdominant (fa)", "down to the mediant (mi)", "4̂ → 3̂, in plagal motion and in V⁷ → I (as the chord's 7th)"],
    ["chordal 7th (e.g., the 7th of V⁷)", "down by step", "a dissonance resolving to a more stable note"],
    ["submediant (la) in major", "down to sol, or up through ti to do", "either way, depending on the line"],
    ["submediant (le) in minor", "down to sol", "minor's 6̂ tends downward"],
    ["supertonic (re)", "down to do or up to mi", "either direction"],
    ["a raised chromatic note", "up", "chromatic tones usually move in the direction of their inflection"],
    ["a lowered chromatic note", "down", "chromatic tones usually move in the direction of their inflection"],
  ];

  function make(mode, H) {
    if (mode === "pitch" || mode === "name") {
      const k = H.randKey(["major", "minor"]), idx = k.mode === "minor" ? H.rnd([0, 1, 2, 3, 4, 5, 6, 7]) : H.rnd([0, 1, 2, 3, 4, 5, 6]);
      const n = H.nm(noteOf(H, k, idx)), nm = nameOf(k, idx);
      const all = (k.mode === "minor" ? [0, 1, 2, 3, 4, 5, 6, 7] : [0, 1, 2, 3, 4, 5, 6]);
      const why = `${cap(nm)} = ${idx === 7 ? "raised 7̂" : (idx + 1) + "̂"} in ${k.label}: ${n}.${idx === 6 && k.mode === "minor" ? " The 7th degree as in the key signature is the subtonic." : idx === 7 ? " Raised a half step (as in harmonic minor), the 7th degree is the leading tone." : ""}`;
      if (mode === "pitch") return H.mc(`What pitch is the ${nm} in ${k.label}?`, n, all.map(i => H.nm(noteOf(H, k, i))), why, { kicker: "Name the pitch" });
      return H.mc(`In ${k.label}, ${n} is the…`, nm, all.map(i => nameOf(k, i)), why, { kicker: "Name the degree" });
    }
    if (mode === "tend") {
      const r = Math.random();
      if (r < .35) {
        const k = H.key(H.rnd(H.KEYS.major), "major"), i = H.rnd([0, 1, 2, 3, 4, 5, 6]), stable = [0, 2, 4].includes(i);
        return H.mc(`In ${k.label}, is ${H.nm(k.scale[i])} (${i + 1}̂, ${SOL.major[i]}) a stable tone or a tendency tone?`, stable ? "Stable" : "Tendency tone", ["Stable", "Tendency tone"], `Stable (“anchor”) tones are 1̂, 3̂ and 5̂, in major or minor. All others tend to move.`, { kicker: "Stable or tendency?" });
      }
      if (r < .75) {
        const k = H.randKey(["major", "minor"]), ask = H.rnd(k.mode === "major" ? ["lt", "fa", "sev"] : ["lt", "fa", "sev", "le"]);
        const lt = H.up(k.scale[6], 0, k.mode === "minor" ? 1 : 0), v7 = H.chord(H.deg(k, 5), "7");
        const Q = {
          lt: [`In ${k.label}, where does the leading tone ${H.nm(lt)} tend to resolve?`, H.nm(k.scale[0]), "7̂ → 1̂ (ti → do)."],
          fa: [`In ${k.label}, where does the subdominant ${H.nm(k.scale[3])} tend to resolve?`, H.nm(k.scale[2]), `4̂ → 3̂ (fa → ${SOL[k.mode][2]}).`],
          sev: [`In ${k.label}, the 7th of ${v7.sym} is ${H.nm(v7.tones[3])}. Where does it resolve?`, H.nm(k.scale[2]), "Chordal 7ths resolve down by step."],
          le: [`In ${k.label}, where does the submediant ${H.nm(k.scale[5])} (le) tend to go?`, H.nm(k.scale[4]), "In minor, 6̂ tends down to 5̂."],
        }[ask];
        return H.mc(Q[0], Q[1], k.scale.concat([lt]).map(H.nm), Q[2], { kicker: "Resolve it" });
      }
      const [t, a, w] = H.rnd(TEND);
      return H.mc(`Where does ${art(t)} tend to resolve?`, a, TEND.map(x => x[1]), cap(w) + ".", { kicker: "Tendency tones" });
    }
    if (mode === "key") {
      const minor = Math.random() < .5, kMaj = H.key(H.rnd(["C", "G", "D", "F", "B♭", "E♭", "A"]), "major");
      const rel = H.key(H.nm(kMaj.scale[5]), "minor"), k = minor ? rel : kMaj;
      const toks = H.rnd(minor ? [["1", "4", "5", "1"], ["1", "26", "57", "1"], ["1", "6", "4", "5", "1"], ["1", "4", "164", "57", "1"]] : [["1", "4", "5", "1"], ["1", "26", "57", "1"], ["1", "6", "2", "5", "1"], ["1", "4", "164", "57", "1"]]);
      const x = H.voiceToks(k, toks, { sop: 0 });
      if (!x) return null;
      const spec = Object.assign(H.satbSpec(x, { labels: false }), { vf: kMaj.vf, sig: kMaj.sig });
      const lt = H.nm(H.up(rel.scale[6], 0, 1));
      const why = minor ? `It begins and ends on ${rel.scale[0] && H.nm(rel.scale[0])} minor chords, with a V–i cadence, and the raised leading tone ${lt} appears as an accidental: ${rel.label}.` : `It begins and ends on ${H.nm(kMaj.scale[0])} major chords with a V–I cadence, and there's no ${lt} (the raised 7th of ${rel.label}): ${kMaj.label}.`;
      const other = H.key(H.nm(kMaj.scale[4]), "major");
      return H.mc(`Same key signature, two possible keys. What key is this in?`, k.label, [minor ? kMaj.label : rel.label, H.rnd([other.label, H.key(H.nm(other.scale[5]), "minor").label])], why, { kicker: "Which key?", staff: spec, staffAns: Object.assign(H.satbSpec(x), { vf: kMaj.vf, sig: kMaj.sig }), playQ: H.satbPlay(x.vs, .85), playQLabel: "Play", nWrong: 2 });
    }
    const [q, a, w, y] = H.rnd(FACTS);
    return H.mc(q, a, w, y, { kicker: "Concepts" });
  }
  const FACTS = [
    ["In a minor key, the 7th degree as found in the key signature is called…", "the subtonic", ["the leading tone", "the submediant", "the supertonic"], "Raised a half step, it's the leading tone."],
    ["Which scale degrees are the stable (“anchor”) tones?", "1̂, 3̂ and 5̂", ["1̂, 4̂ and 5̂", "2̂, 4̂ and 6̂", "1̂ and 7̂"], "They provide rest at the ends of closed phrases."],
    ["In jazz, the 3rd and 7th of a dominant chord are called…", "guide tones", ["anchor tones", "pedal tones", "blue notes"], "They lead to the next chord's important tones."],
    ["Chromatic notes usually resolve…", "in the direction of their inflection (raised up, lowered down)", ["by leap", "to the nearest stable tone below", "back to where they came from"], "This matches how chromatic chords are spelled."],
    ["What's the most reliable first clue to a passage's key?", "harmonic and melodic closure at the end (the cadence)", ["the first note", "the highest note", "the tempo"], "Check the opening too; then look for V–I and the leading tone."],
    ["How can you tell a minor key from its relative major?", "look for its raised leading tone (an accidental) and how it begins and ends", ["count the sharps", "minor keys have no key signature", "look at the time signature"], "The raised 7th distinguishes minor from its relative major."],
    ["Listeners tend to hear the first chord as…", "the tonic, unless a stronger progression changes their mind", ["the dominant", "unimportant", "a pivot chord"], "First impressions matter."],
    ["A passage ending on a dominant 7th (Mm7) chord most likely ends on…", "the dominant of its key", ["the tonic", "the subdominant", "the leading-tone chord"], "Ending on a root-position triad suggests the tonic."],
    ["Some Baroque music in F minor uses a three-flat key signature. Why?", "an older practice: a “modal” key signature, with D♭ written as an accidental", ["it's really in E♭ major", "it's a mistake", "it's in C minor"], "Today we'd add D♭ to the signature."],
    ["“Tendency tones don't necessarily resolve immediately” means…", "a tendency can be resolved later in the melody's structure", ["they never resolve", "they always leap", "they only resolve in the bass"], "Non-consecutive notes can carry the resolution."],
  ];

  function reference(H) {
    return `<div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Degree</th><th scope="col">Name</th><th scope="col">Solfège (major / minor)</th></tr></thead><tbody>
      ${DN.map((d, i) => `<tr><td>${i + 1}̂</td><td>${i === 6 ? "leading tone (raised 7̂) / subtonic (♭7̂ in minor)" : d}</td><td>${SOL.major[i]} / ${SOL.minor[i]}${i === 6 ? " (ti when raised)" : ""}</td></tr>`).join("")}</tbody></table></div>
      <p class="legend">Stable tones: 1̂, 3̂, 5̂. Tendencies: 7̂ → 1̂, 4̂ → 3̂, chordal 7ths down, minor 6̂ → 5̂, 2̂ either way.</p>`;
  }

  const lesson = { defMode: "major", steps: [
    { title: "Keys and scale degrees", kick: "Prerequisites", render: () => `<p>This lesson assumes you know how major and minor keys organize the diatonic notes, how key signatures show them, and how <b>parallel</b> keys (same tonic) and <b>relative</b> keys (same signature) relate. If not, review major and minor scales and key signatures first (for example, in <i>Music Theory for the 21st-Century Classroom</i>).</p>
      <p>Scale degrees are named by number or by name. A caret over the number marks a scale degree: 1̂, 2̂, 3̂… Some websites can't show the caret, so you may also see ^1, ^2. Altered degrees take a ♯ or ♭ (♯4̂, ♭7̂) whatever accidental the actual note uses: in E major, the lowered supertonic is ♭2̂ even though it's F♮.</p>` },
    { title: "Scale-degree names", kick: "Tonic to leading tone", keyed: "both", render: (H, k) => `<div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Degree</th><th scope="col">Name</th><th scope="col">In ${k.label}</th></tr></thead><tbody>
      ${[0, 1, 2, 3, 4, 5, 6].map(i => `<tr><td>${i + 1}̂ (${SOL[k.mode][i]})</td><td>${nameOf(k, i)}</td><td>${H.nm(k.scale[i])}</td></tr>`).join("")}${k.mode === "minor" ? `<tr><td>raised 7̂ (ti)</td><td>leading tone</td><td>${H.nm(noteOf(H, k, 7))}</td></tr>` : ""}</tbody></table></div>
      ${k.mode === "minor" ? "<p>In minor, the 7th degree has two names: as in the key signature it's the <b>subtonic</b>; raised a half step (as in harmonic minor) it's the <b>leading tone</b>. The 6th degree also has two usual versions (lowered as in the signature, or raised in ascending melodic minor), but its name doesn't change.</p>" : "<p>Choose a minor key to see the subtonic and leading tone.</p>"}`
      + H.check(`What pitch is the subdominant in ${k.label}?`, H.nm(k.scale[3]), [H.nm(k.scale[4]), H.nm(k.scale[2]), H.nm(k.scale[5])], "The subdominant is 4̂.") },
    { title: "Stable and tendency tones", kick: "Anchors and pulls", keyed: "major", render: (H, k) => `<p><b>Stable tones</b> (“anchor tones”) give a sense of rest: <b>1̂, 3̂ and 5̂</b>, in major or minor. They end phrases that have harmonic closure. All other degrees are unstable and tend to move in a particular direction; satisfying that tendency is <b>resolution</b>.</p>
      <div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Tendency tone</th><th scope="col">Resolves</th><th scope="col">In ${k.label}</th></tr></thead><tbody>
      <tr><td>Leading tone (ti)</td><td>up to do: strong, especially in V → I</td><td>${H.nm(k.scale[6])} → ${H.nm(k.scale[0])}</td></tr>
      <tr><td>Subdominant (fa)</td><td>down to mi (plagal motion; the 7th of V⁷)</td><td>${H.nm(k.scale[3])} → ${H.nm(k.scale[2])}</td></tr>
      <tr><td>Chordal 7th</td><td>down by step</td><td>${H.nm(k.scale[3])} (7th of ${H.chord(H.deg(k, 5), "7").sym}) → ${H.nm(k.scale[2])}</td></tr>
      <tr><td>Submediant (la)</td><td>down to sol, or up in la–ti–do (in minor: down)</td><td>${H.nm(k.scale[5])} → ${H.nm(k.scale[4])}</td></tr>
      <tr><td>Supertonic (re)</td><td>down to do or up to mi</td><td>${H.nm(k.scale[1])} → ${H.nm(k.scale[0])} / ${H.nm(k.scale[2])}</td></tr></tbody></table></div>
      <p>Non-chord tones (passing, neighbor, suspensions, appoggiaturas) also create tension that resolves to a chord tone.</p>` },
    { title: "Tendencies in melody", kick: "Structure and chromatics", render: () => `<p>These resolutions are tied to <i>harmony</i>: in a melody, any note can move either way. But tendency tones still shape melodies, especially near cadences, and they don't have to resolve immediately: often non-consecutive notes of the melody's structure carry the resolution (as in “If I Only Had a Brain” from <i>The Wizard of Oz</i>, or the tendency-tone web of Nirvana's “Smells Like Teen Spirit”).</p>
      <p>In jazz, tendency tones are used more flexibly. The 3rd and 7th of a dominant chord are <b>guide tones</b>, leading to the next chord's important tones.</p>
      <p><b>Chromatic notes</b> are often tendency tones: a D♯ in C major creates tension and resolves up to E. In general, chromatic tones move in the direction of their inflection: raised notes up, lowered notes down. That usually matches how chromatic chords are spelled.</p>` },
    { title: "Which key?", kick: "Relative major or minor", keyed: "minor", render: (H, k, U) => {
      const maj = H.key(H.nm(k.scale[2]), "major");
      const xm = H.voiceToks(k, ["1", "4", "57", "1"], { sop: 0 }), xM = H.voiceToks(maj, ["1", "4", "57", "1"], { sop: 0 });
      const sig = s => Object.assign(s, { vf: maj.vf, sig: maj.sig });
      return `<p>A key signature narrows things to two keys: a major key and its relative minor. To decide:</p>
      <ul><li><b>Closure:</b> look at how the passage ends (cadence and final melody note), and how it begins: listeners tend to hear the first chord as the tonic unless a stronger progression changes their mind. Ending on a root-position triad suggests the tonic; ending on a dominant 7th suggests the dominant.</li>
      <li><b>V–I:</b> find dominant–tonic resolutions and follow the leading tone to the tonic.</li>
      <li><b>The raised leading tone</b> (an accidental) points to the minor key.</li></ul>
      <div class="lfigs">${xm ? U.fig(sig(H.satbSpec(xm)), `${k.label}: note the raised leading tone, ${H.nm(H.up(k.scale[6], 0, 1))}`, { small: true, play: H.satbPlay(xm.vs, .85) }) : ""}${xM ? U.fig(sig(H.satbSpec(xM)), `${maj.label}: same key signature`, { small: true, play: H.satbPlay(xM.vs, .85) }) : ""}</div>`;
    } },
    { title: "Reading the evidence", kick: "Key determination", render: () => `<p>Key signatures can mislead. Music changes key; and some Baroque music uses a “modal” key signature (three flats for music in F minor, with every D made D♭ by accidental, where today we'd put D♭ in the signature).</p>
      <p>The conventional approach: gather the pitches, filter out non-chord tones, and see whether the rest form a diatonic collection. It often works. In the folk song <i>Wayfaring Stranger</i>, the melody uses five white notes and centers on the A minor triad; the other two notes of A natural minor (F and G) appear in the Dm and Em chords.</p>
      <p>Determining a key is interpretive, not mechanical: weigh harmonic function, melodic emphasis, voice leading, cadences, and sometimes text or form. The best interpretation makes the most musical sense of all the evidence.</p>` },
    { title: "Quick check", kick: "Before the drills", render: (H) => [FACTS[0], FACTS[1], FACTS[5]].map(([q, a, w, y]) => H.check(q, a, w, y)).join("") + H.check("What pitch is the leading tone in E minor?", "D♯", ["D", "C♯", "F♯"], "Raised 7̂ of E minor: D♯.") + H.check("What pitch is the subtonic in F minor?", "E♭", ["E", "D♭", "C"], "7̂ as in the key signature.") },
  ] };

  return {
    key: "silverapps-keys-v1", lesson, make, reference,
    modes: [{ id: "pitch", kicker: "Name the pitch" }, { id: "name", kicker: "Name the degree" }, { id: "tend", kicker: "Tendency tones" }, { id: "key", kicker: "Which key?" }, { id: "concepts", kicker: "Concepts" }],
    topics: [],
  };
})();
