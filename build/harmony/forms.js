window.FAM = (() => {
  // ===== Forms: simple, larger, sonata and popular forms. Engine: build/harmony/engine.js =====
  const SCHEMES = [
    ["||: A :||: B :||", "Binary"], ["||: A :||: B A′ :||", "Rounded binary"], ["A B A", "Ternary"], ["A B C (three sections)", "Ternary"],
    ["Minuet – Trio – Minuet (da capo)", "Compound ternary"], ["A A A… (same music, new verses)", "Strophic"], ["A A B A, eight bars each", "32-bar song form"],
    ["A B A C A", "Rondo"], ["A B A C A B A", "Rondo"], ["A B C D… (no sections repeat)", "Through-composed"], ["A A¹ A² A³…", "Theme and variations"],
    ["Exposition – Development – Recapitulation", "Sonata form"], ["Subject stated alone, then entries in other voices, episodes, stretto", "Fugue (contrapuntal form)"],
  ];
  const FORMS = [...new Set(SCHEMES.map(x => x[1]))];
  const FORMW = {
    "Binary": "two contrasting sections, usually each repeated, common in Baroque dance movements and folk music.",
    "Rounded binary": "binary form whose second part ends with a return of the opening (a) material.",
    "Ternary": "three parts, usually A, B and a return of A (though ABC also counts).",
    "Compound ternary": "a three-part form with larger sections, each with its own form, such as minuet and trio.",
    "Strophic": "one section repeated for each verse of the text.",
    "32-bar song form": "AABA with eight-bar sections; the B (bridge or middle eight) ends with a half cadence.",
    "Rondo": "a main theme alternating with contrasting episodes.",
    "Through-composed": "new material from start to finish, with no repeated sections.",
    "Theme and variations": "a theme followed by variations that keep it recognizable.",
    "Sonata form": "exposition (themes, usually in two keys), development, recapitulation (both themes in the home key).",
    "Fugue (contrapuntal form)": "a subject in imitation among independent voices, with episodes and devices like stretto.",
  };
  const SONATA = [
    ["Where are the two main themes (or thematic groups) first presented, usually in different keys?", "the exposition"],
    ["Where are the themes explored, varied and taken through different keys?", "the development"],
    ["Where do both themes return, now in the home key?", "the recapitulation"],
    ["What optional section may precede the exposition without affecting the sonata framework?", "the introduction"],
    ["What may follow the recapitulation to give a strong conclusion?", "the coda"],
    ["What connects the first and second themes in the exposition, changing key?", "the transition"],
    ["What leads from the development back to the home key for the recapitulation?", "the retransition"],
  ];
  const SONW = ["the exposition", "the development", "the recapitulation", "the introduction", "the coda", "the transition", "the retransition"];
  const SONF = [
    ["Why talk about “thematic groups” instead of “themes”?", "each area can contain several distinct ideas", ["there's only ever one theme", "themes are always in groups of three", "the term means a fugue"], "A first or second area may hold several melodies."],
    ["Can a sonata form use the same theme for its first and second areas?", "yes (a monothematic exposition)", ["no, never", "only in a minor key", "only in the development"], "Classical composers sometimes did this; the key change still defines the second area."],
    ["In a major-key sonata, the second theme of the exposition is usually in…", "the dominant key", ["the tonic", "the subdominant", "the parallel minor"], "In a minor-key sonata, usually the relative major."],
    ["What's the most common harmonic quality of a coda?", "a long stay on the tonic", ["constant modulation", "a half cadence", "a chord stream"], "It confirms the home key."],
    ["A minuet and trio is usually which movement of a Classical symphony?", "the third", ["the first", "the second", "the last"], "Later replaced by the scherzo."],
    ["Sectional variations differ from continuous variations because…", "each variation ends with a closed cadence", ["they have no theme", "they're always in minor", "they never repeat"], "Continuous (Baroque) variations flow over a ground bass, often ending open."],
    ["Stretto is…", "a new voice entering with the subject before the previous one finishes it", ["a fast coda", "the second theme", "a cadence in the dominant"], "Overlapping entries."],
  ];
  const POP = [
    ["Repeated music with different lyrics each time", "Verse"], ["A short repeated line at the end of each verse (not a separate section)", "Refrain"],
    ["A recurring section with fixed lyrics and melody, usually the main hook", "Chorus"], ["A contrasting section, usually heard once, before returning to familiar material", "Bridge"],
    ["A transitional passage connecting the verse to the chorus, often building tension", "Pre-chorus"], ["A section after the chorus that extends it, often repeating a hook", "Post-chorus"],
    ["The opening, establishing key, tempo and material", "Intro"], ["The ending: reiterating material, fading out or new closing material", "Outro"], ["A brief connecting passage, often instrumental, between larger sections", "Link"],
  ];

  // ---------- listening: short generated sections ----------
  const SC = [0, 2, 4, 5, 7, 9, 11];
  const sc = (t, i) => t + 12 * Math.floor(i / 7) + SC[((i % 7) + 7) % 7];
  const PLANS = { A: [1, 4, 5, 1], B: [6, 2, 5, 5], C: [4, 1, 2, 5], D: [6, 3, 4, 1] };
  function section(H, plan, used) {
    for (let g = 0; g < 200; g++) {
      const deg = []; let p = H.rnd([2, 4, 7]);
      plan.forEach((d, b) => { for (let j = 0; j < (b === 3 ? 1 : 4); j++) { const c = [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(i => (j % 2 === 0 ? [0, 2, 4].includes(((i - (d - 1)) % 7 + 7) % 7) : true) && Math.abs(i - p) <= 2 && (j || b === 0 || i !== p)); if (!c.length) return; p = H.rnd(c); deg.push(p); } });
      if (deg.length !== 13) continue;
      const sig = deg.join();
      if (used.some(u => u === sig)) continue;
      return { deg, plan };
    }
    return null;
  }
  function formSound(H, letters) {
    const t = H.rnd([60, 62, 65, 67]), spb = .3, ev = [], secs = {}, used = [];
    let time = 0;
    for (const L of letters) {
      const base = L.replace(/[′¹²³]/g, "");
      if (!secs[base]) { const s = section(H, PLANS[base] || PLANS.D, used); if (!s) return null; secs[base] = s; used.push(s.deg.join()); }
      const s = secs[base], varied = L !== base;
      s.deg.forEach((d, i) => { const b = i < 12 ? Math.floor(i / 4) : 3, j = i < 12 ? i % 4 : 0; const len = i === 12 ? 4 : 1; ev.push([sc(t, d), time + (b * 4 + j) * spb, len * spb * .92, .85]); if (varied && i < 12 && i % 4 === 1) ev.push([sc(t, d + 1), time + (b * 4 + j + .5) * spb, spb * .45, .6]); });
      s.plan.forEach((d, b) => [sc(t, d - 1) - 24, sc(t, d + 1) - 12, sc(t, d + 3) - 12].forEach((m, i) => ev.push([m, time + b * 4 * spb, 4 * spb * .95, i ? .35 : .5])));
      time += 16 * spb + .25;
    }
    return { ev, timbre: "voice" };
  }
  const HEAR = [["A A B B", "Binary", "||: A :||: B :||"], ["A B A", "Ternary", "A B A"], ["A B A C A", "Rondo", "A B A C A"], ["A A A", "Strophic", "A A A (the same music each time)"], ["A A B A", "32-bar song form", "A A B A"], ["A B C D", "Through-composed", "A B C D"], ["A A′ A′ A′", "Theme and variations", "A, then varied versions of A"]];

  function make(mode, H) {
    if (mode === "scheme") {
      const [s, a] = H.rnd(SCHEMES);
      return H.mc(`Which form is this? ${s}`, a, FORMS, `${a}: ${FORMW[a]}`, { kicker: "Name the form" });
    }
    if (mode === "hear") {
      const [letters, a, shown] = H.rnd(HEAR), snd = formSound(H, letters.split(" "));
      if (!snd) return null;
      return H.mc("Listen to the whole example. Which form is it?", a, HEAR.map(x => x[1]), `${shown}. ${a}: ${FORMW[a]}`, { kicker: "Hear the form", playQ: snd, playQLabel: "Play the piece", play: snd, playLabel: "Play again" });
    }
    if (mode === "sonata") {
      if (Math.random() < .6) { const [q, a] = H.rnd(SONATA); return H.mc(q, a, SONW, `Sonata form: (introduction) – exposition (first theme, transition, second theme) – development – retransition – recapitulation – (coda).`, { kicker: "Sonata form" }); }
      const [q, a, w, y] = H.rnd(SONF); return H.mc(q, a, w, y, { kicker: "Larger forms" });
    }
    const [d, a] = H.rnd(POP);
    return H.mc(`Which section of a popular song is this? ${d}.`, a, POP.map(x => x[1]), `${a}: ${d.charAt(0).toLowerCase() + d.slice(1)}.`, { kicker: "Song sections" });
  }

  function reference() {
    return `<div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Form</th><th scope="col">Plan</th></tr></thead><tbody>
      ${[["Binary", "||: A :||: B :||"], ["Rounded binary", "||: A :||: B A′ :||"], ["Ternary", "A B A"], ["Compound ternary", "minuet – trio – minuet"], ["Strophic", "A A A"], ["32-bar song form", "A A B A (8 bars each)"], ["Rondo", "A B A C A (B A)"], ["Through-composed", "A B C D…"], ["Theme and variations", "A A¹ A² A³…"], ["Sonata form", "exposition – development – recapitulation"]].map(([f, p]) => `<tr><td><b>${f}</b></td><td>${p}</td></tr>`).join("")}</tbody></table></div>
      <p class="legend">Song sections: intro, verse (refrain), pre-chorus, chorus, post-chorus, link, bridge, outro.</p>`;
  }

  const lesson = { steps: [
    { title: "Binary and rounded binary", kick: "Two parts", render: () => `<p><b>Binary form</b> has two contrasting sections, A and B. A introduces an idea; B contrasts and usually ends more decisively. Each section is usually repeated: <b>||: A :||: B :||</b>. It's common in Baroque dances (minuet, allemande) and in European and American folk music, which may repeat differently (for instance, looping the whole tune with only the second part repeated, varying ornaments and octaves each time).</p>
      <p><b>Rounded binary</b> returns to the A material at the end of B: <b>||: A :||: B A′ :||</b>, with B usually shorter. It bridges binary and ternary forms and is common in Classical music. Its essential features:</p>
      <ul><li>a first part that is repeated, then a second part (the contrasting “digression” plus the return), also repeated;</li><li>an <b>open cadence</b> at the end of the digression;</li><li>the <b>a</b> melody both starting and ending the piece.</li></ul>` },
    { title: "Ternary and strophic", kick: "Three parts, many verses", render: () => `<p><b>Ternary form</b> has three parts, typically A, B and a return to A (||: A :||: B :||: A :||); ABC also counts. <b>Simple ternary</b> divides a piece or section with one phrase or phrase pair per part. <b>Compound ternary</b> has larger sections, as in a <b>minuet and trio</b> (da capo form): often both minuet and trio are rounded binaries, and “M.D.C.” (menuetto da capo) brings back the whole minuet as the third part.</p>
      <p><b>Strophic form</b> (AAA) uses the same music for every verse: folk songs, hymns, ballads. Each verse of a hymn is often a period or double period.</p>
      <p><b>32-bar song form</b> (AABA) is a variant of rounded binary with one 8-bar phrase per section: A (main theme), A (repeated), B (the <b>bridge</b> or <b>middle eight</b>, contrasting and ending with a half cadence), A. It's common in early 20th-century American popular song and in jazz standards.</p>` },
    { title: "Larger forms", kick: "Rondo, variations and more", render: () => `<ul><li><b>Minuet and trio</b> (or <b>scherzo and trio</b>): a ternary form, often the third movement of a Classical symphony, sonata or quartet. Minuet (binary), trio (binary, contrasting in texture, key or instrumentation), minuet again.</li>
      <li><b>Rondo</b>: a main theme (A) alternating with contrasting <b>episodes</b>: ABACA or ABACABA. The episodes usually contrast in key and character, and the returns of A may be shortened.</li>
      <li><b>Through-composed</b> (ABCD…): continuous, non-repeating music, effective when the text or mood evolves, as in many art songs that follow a story. It doesn't lack form; its sections just don't repeat.</li>
      <li><b>Theme and variations</b>: a theme (A) and variations (A¹, A²…) changing rhythm, harmony or instrumentation while keeping it recognizable. When the theme and every variation are complete (often rounded binary) and each ends closed, they are <b>sectional variations</b>, unlike Baroque <b>continuous variations</b> over a repeating bass line (a ground bass).</li>
      <li><b>Contrapuntal forms</b> (fugue, invention, organ prelude) present a <b>subject</b>, often alone at first, then add independent lines and <b>episodes</b>, with devices like <b>stretto</b> (overlapping entries), modulation, and layering (canon, countersubject, pedal point, sequence).</li></ul>` },
    { title: "Sonata form", kick: "Exposition, development, recapitulation", render: () => `<p>Sonata form is central to Classical and Romantic music, especially first movements of sonatas, symphonies and concertos:</p>
      <div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Section</th><th scope="col">What happens</th></tr></thead><tbody>
      <tr><td><i>Introduction</i> (optional)</td><td>precedes the exposition without affecting the sonata framework</td></tr>
      <tr><td><b>Exposition</b></td><td>first theme (tonic), <b>transition</b> (modulating), second theme (dominant, or relative major in minor)</td></tr>
      <tr><td><b>Development</b></td><td>themes explored, varied and taken through different keys; a <b>retransition</b> leads back to the tonic</td></tr>
      <tr><td><b>Recapitulation</b></td><td>both themes return, now in the home key</td></tr>
      <tr><td><i>Coda</i> (optional)</td><td>a strong conclusion, usually staying on the tonic</td></tr></tbody></table></div>
      <p>We speak of <b>thematic groups</b> because each area can hold several ideas; a sonata can even use one theme for both areas. First themes are often bold, second themes more lyrical.</p>` },
    { title: "Popular song sections", kick: "Verse, chorus, bridge…", render: () => `<div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Section</th><th scope="col">Role</th></tr></thead><tbody>${POP.map(([d, a]) => `<tr><td><b>${a}</b></td><td>${d}</td></tr>`).join("")}</tbody></table></div>
      <p>A song may have a refrain or a chorus, and some have both. The intro and link often use the same music.</p>` },
    { title: "Larger units in songs", kick: "Repeating groups of sections", render: () => `<p>Pop songs usually group sections into larger repeating units. A typical plan: intro; verse – pre-chorus – chorus; verse – pre-chorus – chorus; link – bridge; chorus – outro. Some songs open with the chorus before the first verse.</p>
      <p>Very few songs have every section type; a song that does might add a post-chorus (often a vamp on the chorus's first chords), an instrumental link and a bridge on dominant harmony. Some songs are <b>through-composed</b>, developing continuously without repeating sections.</p>` },
    { title: "Hear the forms", kick: "Listen", render: (H, k, U) => `<p>Each example is newly made every time you open this step: short sections, with A always the same music.</p>
      <div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Form</th><th scope="col">Plan</th><th scope="col">Hear</th></tr></thead><tbody>${HEAR.map(([l, f, p]) => `<tr><td><b>${f}</b></td><td>${p}</td><td>${U.sound(formSound(H, l.split(" ")), "Play")}</td></tr>`).join("")}</tbody></table></div>` },
    { title: "Quick check", kick: "Before the drills", render: (H) => H.check("Which form is this? ||: A :||: B A′ :||", "Rounded binary", ["Binary", "Ternary", "Rondo"], "The A material returns at the end of the second part.") + H.check("A B A C A:", "Rondo", ["Ternary", "Theme and variations", "Strophic"], "A main theme alternating with episodes.") + H.check(SONATA[6][0], SONATA[6][1], SONW.filter(x => x !== SONATA[6][1]).slice(0, 3), "The retransition prepares the recapitulation.") + H.check("A transitional passage connecting the verse to the chorus:", "Pre-chorus", ["Bridge", "Post-chorus", "Link"], "It often builds tension toward the chorus.") },
  ] };

  return {
    key: "silverapps-forms-v1", lesson, make, reference,
    modes: [{ id: "scheme", kicker: "Name the form" }, { id: "hear", kicker: "Hear the form" }, { id: "sonata", kicker: "Sonata & larger forms" }, { id: "pop", kicker: "Song sections" }],
    topics: [],
  };
})();
