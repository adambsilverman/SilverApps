window.FAM = (() => {
  // ===== Modulation: lesson only (the drills are the Key Modulation app). Engine: build/harmony/engine.js =====
  const tbl = (head, rows) => `<div class="ltable-wrap"><table class="ltable"><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  const rel = (H, k) => {
    const dom = H.key(H.nm(k.scale[4]), k.mode === "minor" ? "minor" : "major"), sub = H.key(H.nm(k.scale[3]), k.mode);
    const relk = k.mode === "major" ? H.key(H.nm(k.scale[5]), "minor") : H.key(H.nm(k.scale[2]), "major");
    const r2 = x => x.mode === "major" ? H.key(H.nm(x.scale[5]), "minor") : H.key(H.nm(x.scale[2]), "major");
    return { dom, sub, relk, domRel: r2(dom), subRel: r2(sub) };
  };
  // a pivot-chord modulation from k to its dominant key, voiced in four parts
  function pivotEx(H, k) {
    const d = H.key(H.nm(k.scale[4]), "major");
    const chords = [H.tok(k, "1"), H.tok(k, "4"), Object.assign(H.tok(k, "6"), { deg: 0 }), Object.assign(H.tok(d, "57"), { deg: 5 }), Object.assign(H.tok(d, "1"), { deg: 1 })];
    for (let i = 0; i < 8; i++) { const vs = H.satb(d, chords, { sop: 0 }); if (vs) return { d, chords, vs }; }
    return null;
  }
  const CITE = `<p class="small lcite">Examples from Adam Silverman, “Modulation Techniques” (course notes, West Chester University).</p>`;
  // three ways a phrase can relate to a new key, as key "lanes" over time
  function keyLanes() {
    const red = "var(--fi-red-dk, #A8321F)", blu = "#1a5fb4", W = 640;
    const bar = (x, w, y, fill, t, op = 1) => `<rect x="${x}" y="${y}" width="${w}" height="26" rx="6" fill="${fill}" fill-opacity="${op}"/><text x="${x + w / 2}" y="${y + 18}" text-anchor="middle" font-size="14" font-weight="700" fill="#fff">${t}</text>`;
    const cad = (x, y, t) => `<path d="M${x} ${y - 4} v34" stroke="currentColor" stroke-width="2.5"/><text x="${x}" y="${y + 46}" text-anchor="middle" font-size="12.5" fill="currentColor">${t}</text>`;
    const lane = (y, title) => `<text x="0" y="${y + 18}" font-size="14" font-weight="700" fill="currentColor">${title}</text>`;
    let g = lane(20, "Tonicization") + bar(150, 160, 20, blu, "C major") + bar(310, 80, 20, red, "V/V → V", .85) + bar(390, 230, 20, blu, "C major") + cad(620, 20, "cadence in C");
    g += lane(110, "Pivot modulation") + bar(150, 200, 110, blu, "C major") + `<rect x="350" y="110" width="70" height="26" rx="6" fill="url(#pvStripe)"/><text x="385" y="152" text-anchor="middle" font-size="12.5" fill="currentColor">pivot: vi = ii</text>` + bar(420, 200, 110, red, "G major") + cad(620, 110, "cadence in G");
    g += lane(200, "Direct modulation") + bar(150, 220, 200, blu, "C major") + cad(370, 200, "cadence in C") + bar(380, 240, 200, red, "G major (new phrase)") + cad(620, 200, "cadence in G");
    return `<figure class="lfig"><svg viewBox="-4 0 ${W + 20} 262" role="img" aria-label="Three timelines. Tonicization: C major, a brief V of V to V in G, then back to C major and a cadence in C: no modulation. Pivot modulation: C major, a pivot chord that is vi in C and ii in G, then G major ending with a cadence in G. Direct modulation: a phrase in C major ends with a cadence in C, and a new phrase simply begins in G major and cadences there." style="width:100%;max-width:680px;display:block;margin:0 auto;color:var(--ink,#222)">
      <defs><pattern id="pvStripe" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="${blu}"/><rect width="5" height="10" fill="${red}"/></pattern></defs>${g}</svg>
      <figcaption>Only a <b>cadence in the new key</b> makes a modulation. A tonicization visits the new key's chords and comes back.</figcaption></figure>`;
  }
  // circle of fifths with the home key and its closely related keys marked
  function cofSVG(H, k) {
    const MAJ = ["C", "G", "D", "A", "E", "B", "F♯/G♭", "D♭", "A♭", "E♭", "B♭", "F"], MIN = ["a", "e", "b", "f♯", "c♯", "g♯", "e♭", "b♭", "f", "c", "g", "d"];
    const pcT = H.pc(k.tonic), home = ((k.mode === "minor" ? pcT + 3 : pcT) * 7) % 12, near = [11, 0, 1].map(d => (home + d) % 12);
    const cx = 170, cy = 170, R1 = 140, R0 = 100, R2 = 60, red = "#A8321F";
    const wedge = (i, r1, r2) => { const a1 = (i - .5) * 30 - 90, a2 = (i + .5) * 30 - 90, P = (r, a) => `${(cx + r * Math.cos(a * Math.PI / 180)).toFixed(1)} ${(cy + r * Math.sin(a * Math.PI / 180)).toFixed(1)}`;
      return `M${P(r1, a1)} A${r1} ${r1} 0 0 1 ${P(r1, a2)} L${P(r2, a2)} A${r2} ${r2} 0 0 0 ${P(r2, a1)} Z`; };
    let g = "";
    for (let i = 0; i < 12; i++) {
      const isHomeMaj = i === home && k.mode === "major", isHomeMin = i === home && k.mode === "minor", nr = near.includes(i);
      g += `<path d="${wedge(i, R1, R0)}" fill="${isHomeMaj ? red : nr ? "#F7E3A1" : "var(--card,#fff)"}" stroke="currentColor" stroke-width="1"/>`;
      g += `<path d="${wedge(i, R0, R2)}" fill="${isHomeMin ? red : nr ? "#FBEFC8" : "var(--card,#fff)"}" stroke="currentColor" stroke-width="1"/>`;
      const a = i * 30 - 90, t = (r, s, home, sz) => (home ? "" : "") + `<text x="${(cx + r * Math.cos(a * Math.PI / 180)).toFixed(1)}" y="${(cy + r * Math.sin(a * Math.PI / 180) + 5).toFixed(1)}" text-anchor="middle" font-size="${sz}" font-weight="${home ? 800 : 600}" fill="${home ? "#fff" : nr ? "#222" : "currentColor"}">${s}</text>`;
      g += t((R1 + R0) / 2, MAJ[i], isHomeMaj, MAJ[i].length > 3 ? 11 : 16) + t((R0 + R2) / 2, MIN[i], isHomeMin, 13);
    }
    g += `<text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="13" fill="currentColor">major outside</text><text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="13" fill="currentColor">minor inside</text>`;
    return `<figure class="lfig"><svg viewBox="0 0 340 340" role="img" aria-label="Circle of fifths, major keys outside and minor keys inside. ${k.label} is marked in red; the six keys in its neighboring wedges (its own wedge and one step either way, major and minor) are shaded: these are ${k.label} and its five closely related keys." style="width:100%;max-width:360px;display:block;margin:0 auto;color:var(--ink,#222)">${g}</svg>
      <figcaption>${k.label} (red) and its five closely related keys (shaded): one step either way around the circle, plus the relative key in each of those wedges.</figcaption></figure>`;
  }
  // one sound, four spellings: each fully diminished 7th resolves to a different minor tonic
  const dimFig = (H, U) => U.fig({ type: "grand", vf: "C", sig: {}, syms: true, cols: [
    { t: ["E4", "G4", "B♭4"], b: ["C♯3"], sym: "C♯°7", lab: "vii°7" }, { t: ["F4", "A4"], b: ["D3"], sym: "Dm", lab: "i" },
    { t: ["G4", "B♭4", "D♭5"], b: ["E3"], sym: "E°7", lab: "vii°7" }, { t: ["A♭4", "C5"], b: ["F3"], sym: "Fm", lab: "i" },
    { t: ["B♭4", "D♭5", "F♭5"], b: ["G3"], sym: "G°7", lab: "vii°7" }, { t: ["C♭5", "E♭5"], b: ["A♭3"], sym: "A♭m", lab: "i" },
    { t: ["C♯4", "E4", "G4"], b: ["A♯2"], sym: "A♯°7", lab: "vii°7" }, { t: ["D4", "F♯4"], b: ["B2"], sym: "Bm", lab: "i" }] },
    "One sound, four spellings. Each dim7 is “seven of” the note a half step above its root, so the same sound can lead to D, F, A♭ or B minor.");
  const gerFig = (H, U) => U.fig({ type: "grand", vf: "C", sig: {}, syms: true, cols: [
    { t: ["E4", "G4", "B♭4"], b: ["C3"], sym: "C7", lab: "V7/IV" }, { t: ["F4", "A4"], b: ["F3"], sym: "F", lab: "IV" },
    { t: ["E4", "G4", "A♯4"], b: ["C3"], sym: "Ger+6", lab: "Ger+6" }, { t: ["E4", "G4", "B4"], b: ["B2"], sym: "Em/B", lab: "i64" }] },
    "The same sound spelled two ways on C: as C7 (B♭ falls to A) it leads to F; as a German +6 in E minor (A♯ rises to B, C falls to B) it leads to the cadential ⁶₄ over B.");
  const lesson = { defMode: "major", steps: [
    { title: "Modulation and tonicization", kick: "Changing key", render: () => `<p><b>Modulation</b> is moving from one key (tonal center) to another. In classical music it's often a major dramatic feature and a structural pillar of forms like sonata and rounded binary.</p>
      <p><b>Tonicization</b> emphasizes a new tonal center briefly, without establishing it. The difference: a modulation must be <b>confirmed by a cadence</b> in the new key. A key or chord tonicized mid-phrase, with no confirming cadence, isn't a modulation.</p>
      <ul><li>A <b>pivot modulation</b> happens within a phrase: one chord (or pitch) works in both the old and the new key: the <b>pivot chord</b> (or pivot tone).</li><li>A <b>direct modulation</b> (phrase modulation) happens when a new phrase or section simply begins in a new key. One or more <b>turnaround chords</b> may soften it, but they aren't pivots: they don't function within the original phrase.</li></ul>
      ${keyLanes()}` },
    { title: "How far?", kick: "Closely related keys", keyed: "both", render: (H, k) => {
      const r = rel(H, k);
      return `<p>Modulations between <b>closely related keys</b> (key signatures differing by no more than one accidental) sound subtler than those to distantly related keys, because more tones are shared.</p>
        <p>Closely related to <b>${k.label}</b>: its dominant (<b>${r.dom.label}</b>), subdominant (<b>${r.sub.label}</b>) and relative (<b>${r.relk.label}</b>), plus the relatives of the dominant and subdominant (<b>${r.domRel.label}</b>, <b>${r.subRel.label}</b>).</p>
        <div class="cofbox"></div>
        <p>All five are closely related, but in common-practice music the most common destinations are the dominant, the subdominant and the relative key. Keys farther around the circle are <b>distantly related</b>: the farther, the more striking the change.</p>`
        + H.check(`Which key is closely related to ${k.label}?`, r.relk.label, [H.key(H.nm(H.up(k.tonic, 1, 1)), "major").label, H.key(H.nm(H.up(k.tonic, 0, 1)), k.mode).label, H.key(H.nm(H.up(k.tonic, 2, 4)), "major").label], "Relative keys share the key signature.");
    },
      after: (root, H, k) => { const b = root.querySelector(".cofbox"); if (b) b.innerHTML = cofSVG(H, k); } },   // drawn after the text formatter, which would restyle the ♯/♭ inside SVG text
    { title: "Finding and labeling", kick: "Start key vs. final cadence", keyed: "major", render: (H, k, U) => {
      const x = pivotEx(H, k);
      const L1 = ["I", "IV", "vi", null, null], L2 = [null, null, "ii", "V7", "I"];
      const fig = x ? U.fig({ type: "voices", vf: k.vf, sig: k.sig, pivot: 2, key1: `${H.nm(k.tonic)}:`, key2: `${H.nm(x.d.tonic)}:`, label: `Four-voice progression in ${k.label} modulating to ${x.d.label}. Under the staff: ${k.label}: I, IV, vi; the vi is bracketed with ii of ${x.d.label}; then in ${x.d.label}: V7, I.`, cols: H.satbCols(x.vs, L1).map((c, i) => Object.assign(c, { lab2: L2[i] }, i === 2 ? { hl: true } : {})) }, `${k.label}: I – IV – <b>vi</b>, which is also <b>ii</b> in ${x.d.label} – then V⁷ – I in ${x.d.label}. The bracket marks the pivot: old key above, new key below, and the analysis continues on the lower line.`, { play: H.satbPlay(x.vs, .95) }) : "";
      return `<p>The most reliable way to find a modulation: compare the starting key of a phrase or section with the key of its <b>final cadence</b>. A <b>half cadence</b> ends on V but doesn't mean a modulation to the dominant. It's often easiest to hear the key change first, then study the score for the exact point and method.</p>
        <ul><li><b>Direct modulation:</b> write the new key name (“G major: I”) under the beat where the new key's harmony begins; Roman numerals after that are in the new key.</li><li><b>Pivot modulation:</b> use a <b>pivot bracket</b>. Write the old key's numerals on one line. At the pivot chord, start a second line underneath with the new key's name; bracket the pivot's two numerals (old key on top, new key below), then continue on the lower line in the new key.</li></ul>` + fig;
    } },
    { title: "Pivot chords", kick: "Diatonic common chords", render: () => `<p>A pivot modulation by <b>diatonic common chord</b> happens within a phrase: it begins in one key and ends in another. To find the pivot:</p>
      <ol><li>Find the first harmony that doesn't belong to the old key (it will need an accidental).</li><li>Go back one chord. If it's diatonic to both keys, it's the pivot.</li></ol>
      <p>One major exception: if the first chromatic chord is the new key's dominant, preceded by its cadential ⁶₄, the ⁶₄ already belongs to the new key, and the pivot comes before it.</p>
      <p>From C major to G major, Am can pivot: vi in C, ii in G. (What some sources call “altered common chord” modulations are the chord-quality shifts below.)</p>` },
    { title: "Chromatic and enharmonic pivots", kick: "Remote keys", render: (H, k, U) => `<p>A <b>chromatic pivot chord</b> helps with remote keys that share no true common chord. For example, in the Beatles' <i>Lady Madonna</i>, the C chord is I in C major and ♭III (borrowed from A minor) in A major.</p>
      <p>An <b>enharmonic pivot chord</b> has a double identity based on respelling:</p>
      <ul><li>The <b>fully diminished seventh</b> is all minor 3rds, and its 7th up to the next root is an augmented 2nd (enharmonically a m3). Four sounding tones (A♯/B♭, C♯/D♭, E/F♭, G) make four different dim7 chords, each with a different root. A dim7 chord is “seven of” something, pulling toward the note a half step above its root, so respelling it can lead to a new tonic. In Beethoven's <i>Pathétique</i> Sonata, an F♯°7 first appears as vii°⁴₃ in G minor; when the music repeats, the same sound resolves to E minor instead.</li>
      <li>The <b>German +6</b> respelled is a dominant seventh, so it can link a key and its Neapolitan (the Ger+6 becomes V⁷/♭II). In Schubert's “Gefror'ne Thränen” (<i>Winterreise</i>), changing C♭ to B♮ turns a D♭7 into a Ger+6 in F minor, returning from the Neapolitan key to the tonic.</li></ul>`
      + dimFig(H, U) + gerFig(H, U) + CITE },
    { title: "Common tones, sequences, quality shifts", kick: "More pivots", render: () => `<ul><li><b>Common-tone pivot:</b> one shared tone binds chords with a chromatic 3rd relationship (roots a 3rd apart, not diatonic). With a respelled note, it's an <b>enharmonic common-tone modulation</b>: in the Four Tops' <i>Reach Out I'll Be There</i>, the A♯ of an F♯ major tonic chord becomes the root of a B♭ major tonic.</li>
      <li><b>Sequence:</b> a melodic gesture repeated higher or lower with a moving harmonic pattern may pass through chords that belong to neither key: a <b>sequential modulation</b> (though most modulating sequences can be labeled as common-chord modulations). In Billy Joel's <i>She's Always a Woman</i>, a circle progression carries the music from D♭ to E♭ major, with a tritone substitution (C♭ to F7, an augmented 4th instead of a perfect 4th). Baroque concertos are full of modulating sequences, as in Vivaldi's Violin Concerto in A minor.</li>
      <li><b>Chord-quality shift</b> (chromatic alteration): a diatonic chord changes a note, and its function, keeping the root as the common tone.
        <ul><li><b>Tonic to dominant 7th:</b> I becomes I⁷ (a V⁷ of IV), often to go from the dominant key back to the tonic, or to the subdominant.</li><li><b>Major chord to +6:</b> a major chord becomes an augmented sixth whose ♯4̂ and ♭6̂ point to 5̂ of the new key (in the second movement of Beethoven's Symphony No. 5, a Ger+6 on A♭, enharmonically A♭7, moves to I⁶₄ in C major).</li><li><b>Major to minor</b> (or the reverse).</li></ul></li></ul>` + CITE },
    { title: "Direct modulation and turnarounds", kick: "Between phrases", render: () => `<p>A <b>direct modulation</b> uses no common chord. It can happen mid-phrase, but more often between phrases: the new phrase just starts in the new key. Pop's <b>truck driver's gear change</b> is a sudden direct modulation up a half or whole step, often before the final chorus, as in Whitney Houston's recording of <i>I Will Always Love You</i>. A direct or pivot modulation may also return to the home key for a repeated verse.</p>
      <p><b>Turnaround</b> chords come <i>after</i> a cadence: they keep things moving in the same key (often ii–V), quickly tonicize the key of the next phrase, or simply turn the tonic into a dom7 to lead to the subdominant. Paul Simon's <i>Kodachrome</i> has both kinds:</p>
      ${tbl(["Section", "Chords"], [["Verse (E major)", "{sym:E} | {sym:E7} | {sym:A} | {sym:A} | {sym:F♯m} | {sym:B} | {sym:E} | {sym:F♯m} {sym:B} (a non-modulating turnaround after the cadence)"], ["Chorus (A major)", "{sym:A} {sym:C♯} | {sym:F♯} | {sym:Bm} | {sym:E} | {sym:A} | {sym:D} | {sym:B} | {sym:E} | {sym:A} {sym:C♯} | {sym:F♯} …"], ["End of chorus", "{sym:B} | {sym:E} | {sym:A} | {sym:C♯m} | {sym:F♯m} | {sym:B} — back to E major, with F♯m as the pivot"]])}
      <p><b>Tonicization</b> is a weaker reference to a new key within a phrase, with no cadence there. The dominant is often tonicized just before a half cadence: that's <i>not</i> a modulation, so label the chord as a secondary dominant, as in Schumann's “The Happy Farmer” (<i>Album for the Young</i>).</p>` + CITE },
    { title: "Modulation and form", kick: "Where it happens", render: () => `<p>Modulation usually shapes a piece's form and often comes at section boundaries.</p>
      <ul><li><b>Classical music:</b> sectional forms (binary, ternary) commonly use contrasting, closely related keys for their sections.</li><li><b>Pop music:</b> verses and choruses may be in different keys; truck driver's gear changes lift a final chorus; modulations may bring a repeated verse back home.</li></ul>`
      + "" },
    { title: "Quick check", kick: "Then practice", render: (H) => H.check("What confirms a modulation (rather than a tonicization)?", "a cadence in the new key", ["a secondary dominant", "an accidental", "a key signature change"], "No cadence in the new key: just a tonicization.") + H.check("To find a pivot chord, find the first chord that doesn't fit the old key, then…", "go back one chord and check that it fits both keys", ["go forward one chord", "look for the cadential ⁶₄ only", "count the sharps"], "The pivot is diatonic to both keys.") + H.check("A sudden key change up a half or whole step before a final chorus is called…", "a truck driver's gear change", ["a pivot modulation", "a chromatic mediant", "a turnaround"], "A direct modulation for energy.") + H.check("Which chord can be respelled to lead to four different keys?", "the fully diminished seventh", ["the dominant seventh", "the major triad", "the half-diminished seventh"], "Any of its tones can be heard as the root.") },
  ] };
  return { key: "silverapps-modlesson-v1", lesson, make: () => null, reference: () => "", modes: [], topics: [] };
})();
