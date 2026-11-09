window.FAM = (() => {
  // ===== Keys, Scale Degrees and Tendency Tones. Engine: build/harmony/engine.js =====
  const DN = ["tonic", "supertonic", "mediant", "subdominant", "dominant", "submediant", "leading tone"];
  const SOL = { major: ["do", "re", "mi", "fa", "sol", "la", "ti"], minor: ["do", "re", "me", "fa", "sol", "le", "te"] };
  const ALLMAJ = ["C", "G", "D", "A", "E", "B", "G♭", "D♭", "A♭", "E♭", "B♭", "F"];
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
      // every pitch (or degree name) of the key is a choice, in scale order
      if (mode === "pitch") return Object.assign(H.mc(`What pitch is the ${nm} in ${k.label}?`, n, [], why, { kicker: "Name the pitch" }), { choices: all.map(i => H.nm(noteOf(H, k, i))) });
      return Object.assign(H.mc(`In ${k.label}, ${n} is the…`, nm, [], why, { kicker: "Name the degree" }), { choices: all.map(i => nameOf(k, i)) });
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
      const minor = Math.random() < .5, kMaj = H.key(H.rnd(ALLMAJ), "major");
      const rel = H.key(H.nm(kMaj.scale[5]), "minor"), k = minor ? rel : kMaj;
      const toks = H.rnd(minor ? [["1", "4", "5", "1"], ["1", "26", "57", "1"], ["1", "6", "4", "5", "1"], ["1", "4", "164", "57", "1"]] : [["1", "4", "5", "1"], ["1", "26", "57", "1"], ["1", "6", "2", "5", "1"], ["1", "4", "164", "57", "1"]]);
      const x = H.voiceToks(k, toks, { sop: 0 });
      if (!x) return null;
      const spec = Object.assign(H.satbSpec(x, { labels: false }), { vf: kMaj.vf, sig: kMaj.sig });
      const lt = H.nm(H.up(rel.scale[6], 0, 1));
      const why = minor ? `It begins and ends on ${rel.scale[0] && H.nm(rel.scale[0])} minor chords, with a V–i cadence, and the raised leading tone ${lt} appears as an accidental: ${rel.label}.` : `It begins and ends on ${H.nm(kMaj.scale[0])} major chords with a V–I cadence, and there's no ${lt} (the raised 7th of ${rel.label}): ${kMaj.label}.`;
      const other = H.key(H.nm(kMaj.scale[4]), "major");
      void other;
      // every major and minor key is a choice: majors around the circle of fifths, then their relative minors
      const allKeys = ALLMAJ.map(n => n + " major").concat(ALLMAJ.map(n => H.nm(H.key(n, "major").scale[5]) + " minor"));
      return Object.assign(H.mc(`Same key signature, two possible keys. What key is this in?`, k.label, [], why, { kicker: "Which key?", staff: spec, staffAns: Object.assign(H.satbSpec(x), { vf: kMaj.vf, sig: kMaj.sig }), playQ: H.satbPlay(x.vs, .85), playQLabel: "Play" }), { choices: allKeys });
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

  // clickable scale on a staff
  let HH = null;
  const stepOf = n => n.o * 7 + n.l - 30;   // treble staff: 0 = bottom line (E4)
  // key signature of k for miniStaff, and the accidental a note needs against it (null = none)
  const ksOf = k => ({ n: k.scale.filter(n => n.a).length, sh: k.scale.some(n => n.a > 0) });
  const accVs = (k, n) => { const sa = (k.scale.find(x => x.l === n.l) || {}).a || 0; return n.a !== sa ? n.a : null; };
  // the scale on a staff with each degree's number, syllable and name underneath; in minor, 7̂ appears twice
  // (subtonic and leading tone) inside one box, as alternatives
  function sdStaff(H, k) {
    HH = H; const minor = k.mode === "minor", idx = minor ? [0, 1, 2, 3, 4, 5, 6, 7] : [0, 1, 2, 3, 4, 5, 6];
    const notes = idx.map(i => ({ n: noteOf(H, k, i), i }));
    notes.push({ n: H.N(notes[0].n.l, notes[0].n.a, notes[0].n.o + 1), i: 0, top: true });
    const dx = 84, esc2 = t => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const spec = notes.map(({ n, i, top }) => ({ s: stepOf(n), acc: accVs(k, n), attrs: `role="button" tabindex="0" data-sdg="${i}" data-sdn="${H.nmO(n)}" data-sdk="${k.mode}" aria-label="${H.nmO(n).replace("♯", " sharp").replace("♭", " flat")}: ${top ? "tonic, an octave up" : (i === 7 ? "raised 7, leading tone" : (i + 1) + ", " + nameOf(k, i))}. Play it"` }));
    const extra = (xs, stepY, y0) => {
      const yb = Math.max(y0 + 40, ...xs.map(([, y]) => y + 8)) + 22, T = (x, y, t, at) => `<text x="${x}" y="${y}" text-anchor="middle" fill="currentColor" ${at || ""}>${esc2(t)}</text>`;
      let g = "";
      notes.forEach(({ i, top }, j) => { const x = xs[j][0];
        // the scale-degree caret is drawn as a small line (the lesson text formatter would turn "1̂" into HTML)
        g += T(x, yb, top ? "1" : i === 7 ? "7" : String(i + 1), 'font-size="16" font-weight="700"') + `<path d="M${x - 4} ${yb - 14} L${x} ${yb - 18} L${x + 4} ${yb - 14}" fill="none" stroke="currentColor" stroke-width="1.5"/>` + T(x, yb + 18, top ? SOL[k.mode][0] : i === 7 ? "ti" : SOL[k.mode][i], 'font-size="13" font-style="italic"')
          + T(x, yb + 35, top ? "tonic" : nameOf(k, i), 'font-size="12"'); });
      if (minor) { const xa = xs[6][0] - dx / 2 + 3, xb = xs[7][0] + dx / 2 - 3;
        g += `<rect x="${xa}" y="${y0 - 30}" width="${xb - xa}" height="${yb + 44 - (y0 - 30)}" rx="12" fill="#FFE07A" fill-opacity=".25" stroke="#B07A12" stroke-width="1.6" stroke-dasharray="6 4" pointer-events="none"/>`
          + T((xa + xb) / 2, y0 - 36, "7th degree: one or the other", 'font-size="12" font-weight="700"') + T((xs[6][0] + xs[7][0]) / 2, yb + 18, "or", 'font-size="12" opacity=".75"'); }
      return g; };
    return H.miniStaff({ notes: spec, ks: ksOf(k), dx, extra, bottom: 34, role: "group", label: `${k.label} scale with each degree's number and name: select a note to hear it` })
      + `<p class="msinfo" id="sdInfo" aria-live="polite">${minor ? "In minor, the 7th degree comes in two versions: as in the key signature it's the subtonic (te); raised a half step it's the leading tone (ti). A melody uses one or the other. " : ""}Select a note to hear it.</p>`;
  }
  if (!window.__sdWired) { window.__sdWired = true;
    const go = el => { const i = +el.dataset.sdg, mode = el.dataset.sdk, info = document.getElementById("sdInfo"); document.querySelectorAll("[data-sdg]").forEach(x => x.setAttribute("aria-pressed", String(x === el)));
      const deg = i === 7 ? "raised 7̂" : `${i + 1}̂`, sol = i === 7 ? "ti" : SOL[mode][i], name = i === 7 ? "leading tone" : (mode === "minor" && i === 6 ? "subtonic" : DN[i]);
      if (info) info.textContent = `${el.dataset.sdn}: ${deg} (${sol}), the ${name}`; if (HH) HH.play({ chords: [[HH.midi(HH.parse(el.dataset.sdn))]], gap: 1.05 }); };
    document.addEventListener("click", e => { const g = e.target.closest("[data-sdg]"); if (g) go(g); });
    document.addEventListener("keydown", e => { const g = e.target.closest && e.target.closest("[data-sdg]"); if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); go(g); } });
  }
  // tendency tones and their resolutions, with arrows
  function tendStaff(H, k) {
    const deg = i => { const n = k.scale[((i % 7) + 7) % 7]; return H.N(n.l, n.a, n.o + Math.floor(i / 7)); };
    const pairs = [[6, 7, "ti → do"], [3, 2, "fa → mi"], [5, 4, "la → sol"], [1, 0, "re → do"]];
    const notes = [], arrows = [];
    pairs.forEach(([a, b, t]) => { const i = notes.length; [a, b].forEach(d => notes.push({ s: stepOf(deg(d)), acc: accVs(k, deg(d)) })); arrows.push([i, i + 1, ""]); });
    // the solfège under each pair is the play button for that resolution
    const extra = (xs, stepY, y0) => pairs.map(([a, b, t], j) => { const x = (xs[2 * j][0] + xs[2 * j + 1][0]) / 2, y = y0 + 40 + 40;
      return `<g class="gsn tdbtn" role="button" tabindex="0" aria-label="Play ${t.replace("→", "to")}" data-tdp="${H.midi(deg(a))},${H.midi(deg(b))}"><rect x="${x - 42}" y="${y - 17}" width="84" height="26" rx="13" class="tdr"/><text x="${x}" y="${y + 1}" text-anchor="middle" font-size="15" font-weight="600" fill="currentColor"><tspan font-size="10" aria-hidden="true">▶ </tspan>${t}</text></g>`; }).join("");
    return H.miniStaff({ notes, arrows, dx: 46, ks: ksOf(k), extra, bottom: -6, role: "group", label: `Tendency tones in ${k.label} with arrows to their resolutions. Each solfège label below plays its resolution.` })
      + `<p class="lcap">Click a solfège pair under the staff to hear the resolution.</p>`;
  }
  if (!window.__tdWired) { window.__tdWired = true; const tdGo = b => { if (b && HH) HH.play({ chords: b.dataset.tdp.split(",").map(m => [+m]), gap: 1.05 }); };
    document.addEventListener("click", e => tdGo(e.target.closest("[data-tdp]")));
    document.addEventListener("keydown", e => { const b = e.target.closest && e.target.closest("[data-tdp]"); if (b && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); tdGo(b); } }); }
  const lesson = { defMode: "major", steps: [
    { title: "Keys and scale degrees", kick: "Prerequisites", render: () => `<p>This lesson assumes you know how major and minor keys organize the diatonic notes, how key signatures show them, and how <b>parallel</b> keys (same tonic) and <b>relative</b> keys (same signature) relate. If not, review them first in the <a href="major-and-minor-scales-lesson.html">Major and Minor Scales</a> lesson, especially its key-signature steps (“Why key signatures?” and “Reading key signatures”).</p>
      <p>Scale degrees are named by number or by name. A caret over the number marks a scale degree: 1̂, 2̂, 3̂… Some websites can't show the caret, so you may also see ^1, ^2. Altered degrees take a ♯ or ♭ (♯4̂, ♭7̂) whatever accidental the actual note uses: in E major, the lowered supertonic is ♭2̂ even though it's F♮.</p>` },
    { title: "Scale-degree names", kick: "Tonic to leading tone", keyed: "both", render: (H, k) => `${sdStaff(H, k)}
      ${k.mode === "minor" ? "<p>In minor, the 7th degree has two names: as in the key signature it's the <b>subtonic</b>; raised a half step (as in harmonic minor) it's the <b>leading tone</b>. The 6th degree also has two usual versions (lowered as in the signature, or raised in ascending melodic minor), but its name doesn't change.</p>" : "<p>Choose a minor key to see the subtonic and leading tone.</p>"}`
      + H.check(`What pitch is the subdominant in ${k.label}?`, H.nm(k.scale[3]), [H.nm(k.scale[4]), H.nm(k.scale[2]), H.nm(k.scale[5])], "The subdominant is 4̂.") },
    { title: "Stable and tendency tones", kick: "Anchors and pulls", keyed: "major", render: (H, k) => `<p><b>Stable tones</b> (“anchor tones”) give a sense of rest: <b>1̂, 3̂ and 5̂</b>, in major or minor. They end phrases that have harmonic closure. All other degrees are unstable and tend to move in a particular direction; satisfying that tendency is <b>resolution</b>.</p>
      ${(HH = H, tendStaff(H, k))}
      <div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Tendency tone</th><th scope="col">Resolves</th><th scope="col">In ${k.label}</th></tr></thead><tbody>
      <tr><td>Leading tone (ti)</td><td>up to do: strong, especially in V → I</td><td>${H.nm(k.scale[6])} → ${H.nm(k.scale[0])}</td></tr>
      <tr><td>Subdominant (fa)</td><td>down to mi (plagal motion; the 7th of V⁷)</td><td>${H.nm(k.scale[3])} → ${H.nm(k.scale[2])}</td></tr>
      <tr><td>Chordal 7th</td><td>down by step</td><td>${H.nm(k.scale[3])} (7th of ${H.chord(H.deg(k, 5), "7").sym}) → ${H.nm(k.scale[2])}</td></tr>
      <tr><td>Submediant (la)</td><td>down to sol, or up in la–ti–do (in minor: down)</td><td>${H.nm(k.scale[5])} → ${H.nm(k.scale[4])}</td></tr>
      <tr><td>Supertonic (re)</td><td>down to do or up to mi</td><td>${H.nm(k.scale[1])} → ${H.nm(k.scale[0])} / ${H.nm(k.scale[2])}</td></tr></tbody></table></div>
      <p>Non-chord tones (passing, neighbor, suspensions, appoggiaturas) also create tension that resolves to a chord tone.</p>
      <h3>Hear it: “Smells Like Teen Spirit”</h3>
      <figure class="lfig"><img src="assets/img/keys/teen-spirit.png" alt="Melody in F minor (four flats), common time, with chord symbols Fm, B-flat, A-flat, D-flat repeating. Arrows mark four resolutions, one at the end of each short phrase: G to F (2 to 1), B-flat to A-flat (4 to 3), D-flat to C (6 to 5), B-flat to A-flat (4 to 3)." loading="lazy" style="width:100%;height:auto;background:#fff;border-radius:8px">
      <audio controls preload="none" src="assets/audio/keys/teen-spirit.mp3" style="width:100%;margin-top:8px"></audio>
      <figcaption>Nirvana, “Smells Like Teen Spirit” (Kurt Cobain, Krist Novoselic and Dave Grohl), verse. In F minor, every short phrase ends with a tendency tone falling by step to a stable tone: 2̂→1̂, 4̂→3̂, 6̂→5̂, 4̂→3̂. The arrival notes, 1̂, 3̂ and 5̂, are the stable tones.</figcaption></figure>` },
    { title: "Tendencies in melody", kick: "Structure and chromatics", render: () => `<p>These resolutions are tied to <i>harmony</i>: in a melody, any note can move either way. But tendency tones still shape melodies, especially near cadences, and they don't have to resolve immediately: often non-consecutive notes of the melody's structure carry the resolution, so a 7̂ early in a phrase may find its 1̂ only at the cadence.</p>
      <p>In jazz, tendency tones are used more flexibly. The 3rd and 7th of a dominant chord are <b>guide tones</b>, leading to the next chord's important tones.</p>
      <p><b>Chromatic notes</b> are often tendency tones: a D♯ in C major creates tension and resolves up to E. In general, chromatic tones move in the direction of their inflection: raised notes up, lowered notes down. That usually matches how chromatic chords are spelled.</p>` },
    { title: "Which key?", kick: "Relative major or minor", keyed: "minor", render: (H, k, U) => {
      const maj = H.key(H.nm(k.scale[2]), "major");
      const xm = H.voiceToks(k, ["1", "4", "57", "1"], { sop: 0 }), xM = H.voiceToks(maj, ["1", "4", "57", "1"], { sop: 0 });
      const sig = s => Object.assign(s, { vf: maj.vf, sig: maj.sig });
      return `<p>A key signature narrows things to two keys: a major key and its relative minor (to read a signature, see “Reading key signatures” in the <a href="major-and-minor-scales-lesson.html">Major and Minor Scales</a> lesson). To decide:</p>
      <ul><li><b>Closure:</b> look at how the passage ends (cadence and final melody note), and how it begins: listeners tend to hear the first chord as the tonic unless a stronger progression changes their mind. Ending on a root-position triad suggests the tonic; ending on a dominant 7th suggests the dominant.</li>
      <li><b>V–I:</b> find dominant–tonic resolutions and follow the leading tone to the tonic.</li>
      <li><b>The raised leading tone</b> (an accidental) points to the minor key.</li></ul>
      <div class="lfigs">${xm ? U.fig(sig(H.satbSpec(xm)), `${k.label}: note the raised leading tone, ${H.nm(H.up(k.scale[6], 0, 1))}`, { small: true, play: H.satbPlay(xm.vs, .85) }) : ""}${xM ? U.fig(sig(H.satbSpec(xM)), `${maj.label}: same key signature`, { small: true, play: H.satbPlay(xM.vs, .85) }) : ""}</div>`;
    } },
    { title: "Reading the evidence", kick: "Key determination", render: () => `<p>Key signatures can mislead. Music changes key; and some Baroque music uses a “modal” key signature (three flats for music in F minor, with every D made D♭ by accidental, where today we'd put D♭ in the signature).</p>
      <p>The conventional approach: gather the pitches, filter out non-chord tones, and see whether the rest form a diatonic collection. It often works. A folk melody might use only five white notes and center on the A minor triad, while the other two notes of A natural minor (F and G) appear only in the accompanying Dm and Em chords.</p>
      <p>Determining a key is interpretive, not mechanical: weigh harmonic function, melodic emphasis, voice leading, cadences, and sometimes text or form. The best interpretation makes the most musical sense of all the evidence.</p>` },
    { title: "Quick check", kick: "Before the drills", render: (H) => [FACTS[0], FACTS[1], FACTS[5]].map(([q, a, w, y]) => H.check(q, a, w, y)).join("") + H.check("What pitch is the leading tone in E minor?", "D♯", ["D", "C♯", "F♯"], "Raised 7̂ of E minor: D♯.") + H.check("What pitch is the subtonic in F minor?", "E♭", ["E", "D♭", "C"], "7̂ as in the key signature.") },
  ] };

  return {
    key: "silverapps-keys-v1", lesson, make, reference,
    modes: [{ id: "pitch", kicker: "Name the pitch" }, { id: "name", kicker: "Name the degree" }, { id: "tend", kicker: "Tendency tones" }, { id: "key", kicker: "Which key?" }, { id: "concepts", kicker: "Concepts" }],
    topics: [],
  };
})();
