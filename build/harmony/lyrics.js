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
  const bcc = (b, ch, sym) => ({ b: [[{ k: [b], d: "q" }, { k: ch, d: "q" }, { k: ch, d: "q" }]] });
  const pros = { type: "score", clefs: ["treble", "bass"], time: "3/4", vf: "C", sig: {}, bpm: 100, minBar: 170, bars: [
    { t: [[{ k: [], d: "q" }, { k: [], d: "q" }, { k: ["E4"], d: "q", ly: "to-" }]], b: [[{ k: [], d: "hd" }]] },
    Object.assign({ t: [[{ k: ["G4"], d: "h", ly: "MOR-", sym: "C" }, { k: ["F4"], d: "q", ly: "row" }]] }, bcc("C3", ["E3", "G3", "C4"])),
    Object.assign({ t: [[{ k: ["G4"], d: "h", ly: "TO-", sym: "Am7" }, { k: ["E4"], d: "q", ly: "mor-" }]] }, bcc("A2", ["G3", "C4", "E4"])),
    Object.assign({ t: [[{ k: ["F4"], d: "h", ly: "row ✗", sym: "Dm7" }, { k: [], d: "q" }]] }, bcc("D3", ["F3", "A3", "C4"])),
    Object.assign({ t: [[{ k: [], d: "hd", sym: "G7" }]] }, bcc("G2", ["F3", "B3", "D4"]))] };

  // ---------- rhyme generator (CMU Pronouncing Dictionary, 22,000 common words: assets/rhymes.txt) ----------
  const RG = { data: null, loading: null, kind: "perfect", q: "" };
  const isV = p => /\d$/.test(p), base = p => { const b = p.replace(/\d/, ""); return b === "AO" ? "AA" : b; };   // AO and AA merged (most American speakers rhyme "caught" and "cot")
  function rgLoad() { if (RG.data) return Promise.resolve(RG.data); if (!RG.loading) RG.loading = fetch("assets/rhymes.txt").then(r => r.text()).then(t => { const W = [], P = new Map(); t.split("\n").forEach(l => { const [w, ph] = l.split("|"); if (w && ph) { W.push([w, ph.split(" ")]); if (!P.has(w)) P.set(w, ph.split(" ")); } }); RG.data = { W, P }; return RG.data; }); return RG.loading; }
  function rpart(ph) { let i = -1; for (let j = ph.length - 1; j >= 0; j--) if (/1$/.test(ph[j])) { i = j; break; } if (i < 0) for (let j = ph.length - 1; j >= 0; j--) if (/2$/.test(ph[j])) { i = j; break; } if (i < 0) for (let j = ph.length - 1; j >= 0; j--) if (isV(ph[j])) { i = j; break; } return i < 0 ? 0 : i; }
  const PAIR = [["P", "B"], ["T", "D"], ["K", "G"], ["F", "V"], ["TH", "DH"], ["S", "Z"], ["SH", "ZH"], ["CH", "JH"], ["M", "N"], ["N", "NG"], ["M", "NG"], ["L", "R"]];
  const VNEAR = [["IH", "IY"], ["EH", "AE"], ["AH", "AA"], ["AA", "AO"], ["AH", "AO"], ["UH", "UW"], ["OW", "AO"], ["EY", "EH"], ["AY", "OY"], ["AW", "OW"], ["ER", "AH"], ["IH", "EH"]];
  const near = (a, b, L) => a === b || L.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  function classify(q, w) {   // q, w: phone arrays → set of rhyme kinds
    const qi = rpart(q), wi = rpart(w), qr = q.slice(qi).map(base), wr = w.slice(wi).map(base), out = new Set();
    const same = qr.join(" ") === wr.join(" ");
    if (same) { const qo = qi ? base(q[qi - 1]) : "", wo = wi ? base(w[wi - 1]) : ""; if (qo !== wo) { out.add("perfect"); if (qr.filter(p => isV(p + "0") && /^[AEIOU]/.test(p)).length >= 2) out.add("multi"); } else out.add("identical"); return out; }
    const qv = qr.filter(p => /^[AEIOU]/.test(p)), wv = wr.filter(p => /^[AEIOU]/.test(p)), qc = qr.filter(p => !/^[AEIOU]/.test(p)), wc = wr.filter(p => !/^[AEIOU]/.test(p));
    // slant: same shape with one small difference (a near vowel, a near consonant, or one extra/missing final consonant)
    if (qr.length === wr.length) { let diff = 0, ok = true; qr.forEach((p, i) => { if (p !== wr[i]) { diff++; if (!(near(p, wr[i], VNEAR) || near(p, wr[i], PAIR))) ok = false; } }); if (ok && diff === 1) out.add("slant"); }
    else if (Math.abs(qr.length - wr.length) === 1) { const [a, b] = qr.length > wr.length ? [qr, wr] : [wr, qr]; if (a.slice(0, -1).join(" ") === b.join(" ") && !/^[AEIOU]/.test(a[a.length - 1])) out.add("slant2"); }
    if (qv.join() === wv.join() && qc.join() !== wc.join()) out.add("assonance");
    const tail = a => { const r = []; for (let j = a.length - 1; j >= 0 && !/^[AEIOU]/.test(a[j]); j--) r.unshift(a[j]); return r.join(" "); };
    if (tail(qr) && tail(qr) === tail(wr) && qv[0] !== wv[0]) out.add("consonance");
    return out;
  }
  const RKIND = { perfect: ["Perfect", "same sounds from the last stressed vowel to the end, with a different consonant before it"], multi: ["Two-syllable or more", "perfect rhymes that match across two or more syllables (feminine rhymes)"], slant: ["Slant (near)", "almost the same: one vowel or consonant is close but not identical"], assonance: ["Assonance", "same vowel sounds, different consonants"], consonance: ["Consonance", "same final consonant sound, different vowel"], identical: ["Identical", "same sounds including the consonant before the vowel (leave / believe)"], eye: ["Eye rhyme", "spelled alike but sounding different"] };
  async function rgRun() {
    const box = document.getElementById("rgOut"); if (!box) return; const q = (document.getElementById("rgQ").value || "").trim().toLowerCase(); RG.q = q;
    if (!q) { box.innerHTML = ""; return; } box.innerHTML = "<p class=\"lnote\">Looking…</p>";
    let D; try { D = await rgLoad(); } catch (e) { box.innerHTML = "<p class=\"lnote\">The word list couldn't be loaded.</p>"; return; }
    const qp = D.P.get(q); if (!qp) { box.innerHTML = `<p class="lnote">“${esc(q)}” isn't in this dictionary of common words. Try another spelling or a related word.</p>`; return; }
    const res = [], res2 = []; const end = q.length >= 4 ? q.slice(-3) : q.slice(-2);
    for (const [w, ph] of D.W) { if (w === q || w.includes("'") || !/[aeiouy]/.test(w)) continue;
      if (RG.kind === "eye") { if (w.length > 2 && end.length >= 2 && w.endsWith(end) && !classify(qp, ph).has("perfect") && rpart(ph) >= 0 && base(ph[rpart(ph)]) !== base(qp[rpart(qp)])) res.push(w); }
      else { const c = classify(qp, ph); if (c.has(RG.kind)) res.push(w); else if (RG.kind === "slant" && c.has("slant2") && res2.length < 40) res2.push(w); }
      if (res.length >= 80) break; }
    if (RG.kind === "slant") res.push(...res2.slice(0, Math.max(0, 80 - res.length)));
    const syl = w => D.P.get(w).filter(isV).length, groups = {};
    res.forEach(w => { const n = syl(w); (groups[n] = groups[n] || []).push(w); });
    box.innerHTML = res.length ? `<p class="lnote">${RKIND[RG.kind][0]}${/rhyme$/.test(RKIND[RG.kind][0]) ? "s" : /^(Assonance|Consonance)$/.test(RKIND[RG.kind][0]) ? " matches" : " rhymes"} for <b>${esc(q)}</b> (${qp.join(" ").replace(/\d/g, "")}), most common words first:</p>` + Object.keys(groups).sort((a, b) => a - b).map(n => `<p class="rgrow"><span class="rgn">${n} syllable${n > 1 ? "s" : ""}</span> ${groups[n].map(w => `<button class="rgw" data-rgw="${esc(w)}">${esc(w)}</button>`).join(" ")}</p>`).join("")
      : `<p class="lnote">No ${RKIND[RG.kind][0].toLowerCase()} rhymes found for “${esc(q)}” among common words.${RG.kind === "multi" ? " Two-syllable rhymes need a word stressed before its last syllable, like “tomorrow” or “table”." : ""}</p>`;
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const rgToy = () => `<div class="toy"><div class="toy-row"><label for="rgQ">Word <input type="text" id="rgQ" value="${esc(RG.q || "night")}" autocomplete="off" spellcheck="false"></label><button class="play" data-rg="go">Find rhymes</button></div>
    <div class="toy-row" role="group" aria-label="Kind of rhyme">${Object.entries(RKIND).map(([k, [l, d]]) => `<button class="play" data-rgk="${k}" aria-pressed="${RG.kind === k}" title="${d}">${l}</button>`).join("")}</div>
    <p class="lnote" id="rgDesc">${RKIND[RG.kind][0]}: ${RKIND[RG.kind][1]}.</p><div id="rgOut" aria-live="polite"></div>
    <p class="lnote">Pronunciations from the <a href="http://www.speech.cs.cmu.edu/cgi-bin/cmudict" target="_blank" rel="noopener">CMU Pronouncing Dictionary</a> (American English), limited to about 22,000 common words. Select a result to look up its rhymes.</p></div>`;
  if (!window.__rgWired) { window.__rgWired = true;
    document.addEventListener("click", e => { const k = e.target.closest("[data-rgk]"); if (k) { RG.kind = k.dataset.rgk; document.querySelectorAll("[data-rgk]").forEach(b => b.setAttribute("aria-pressed", String(b === k))); const d = document.getElementById("rgDesc"); if (d) d.textContent = `${RKIND[RG.kind][0]}: ${RKIND[RG.kind][1]}.`; rgRun(); return; }
      if (e.target.closest("[data-rg]")) { rgRun(); return; } const w = e.target.closest("[data-rgw]"); if (w) { document.getElementById("rgQ").value = w.dataset.rgw; rgRun(); document.getElementById("rgQ").focus(); } });
    document.addEventListener("keydown", e => { if (e.target.id === "rgQ" && e.key === "Enter") { e.preventDefault(); rgRun(); } });
  }

  // ---------- the "tomorrow" example: a synthetic singer, click track and boom-chuck-chuck piano ----------
  let PAC = null, pbus = null;
  function playPros() {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return; if (!PAC) PAC = new C(); if (PAC.state === "suspended") PAC.resume();
    if (pbus) { const o = pbus; o.gain.setTargetAtTime(0, PAC.currentTime, .03); setTimeout(() => o.disconnect(), 300); } pbus = PAC.createGain(); pbus.connect(PAC.destination);
    const b = 60 / 100, t0 = PAC.currentTime + .1, mf = m => 440 * Math.pow(2, (m - 69) / 12);
    const VF = { u: [320, 870, 2250], o: [500, 860, 2450], ah: [700, 1150, 2600] };
    const nzb = PAC.createBuffer(1, PAC.sampleRate, PAC.sampleRate), nd = nzb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const sing = (m, t, d, v, cons) => {   // sawtooth "voice" through vowel formants, with a consonant at the start
      const o = PAC.createOscillator(), g = PAC.createGain(), mix = PAC.createGain(), l = PAC.createOscillator(), lg = PAC.createGain(); o.type = "sawtooth"; o.frequency.value = mf(m); l.frequency.value = 5.5; lg.gain.value = 12; l.connect(lg); lg.connect(o.detune);
      VF[v].forEach((f, i) => { const bp = PAC.createBiquadFilter(), ga = PAC.createGain(); bp.type = "bandpass"; bp.frequency.value = f; bp.Q.value = f / (70 + 40 * i); ga.gain.value = [2.6, 1.6, .7][i]; o.connect(bp); bp.connect(ga); ga.connect(mix); });
      mix.connect(g); g.connect(pbus); const tv = t + (cons === "t" ? .05 : .03);
      g.gain.setValueAtTime(0, t); if (cons === "m" || cons === "r") g.gain.linearRampToValueAtTime(.12, t + .05); g.gain.linearRampToValueAtTime(.3, tv + .04); g.gain.setValueAtTime(.3, t + d - .1); g.gain.linearRampToValueAtTime(0, t + d - .02);
      o.start(t); o.stop(t + d); l.start(t + .2); l.stop(t + d);
      if (cons === "t") { const n = PAC.createBufferSource(), hp = PAC.createBiquadFilter(), ng = PAC.createGain(); n.buffer = nzb; hp.type = "highpass"; hp.frequency.value = 3500; ng.gain.setValueAtTime(.25, t); ng.gain.exponentialRampToValueAtTime(.001, t + .05); n.connect(hp); hp.connect(ng); ng.connect(pbus); n.start(t); n.stop(t + .06); }
    };
    const clickAt = (t, hi) => { const o = PAC.createOscillator(), g = PAC.createGain(); o.frequency.value = hi ? 1600 : 1000; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(hi ? .28 : .17, t + .001); g.gain.exponentialRampToValueAtTime(.001, t + .05); o.connect(g); g.connect(pbus); o.start(t); o.stop(t + .06); };
    const piano = (m, t, d, v) => { const f = mf(m), g = PAC.createGain(), lp = PAC.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = Math.min(6000, f * 6); lp.connect(g); g.connect(pbus); [[1, 1], [2, .4], [3, .15]].forEach(([h, a]) => { const o = PAC.createOscillator(), og = PAC.createGain(); o.type = "triangle"; o.frequency.value = f * h; og.gain.value = a; o.connect(og); og.connect(lp); o.start(t); o.stop(t + d + .5); }); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.2 * v, t + .005); g.gain.setTargetAtTime(.06 * v, t + .01, .3); g.gain.setTargetAtTime(0, t + d, .08); };
    for (let i = 0; i < 15; i++) clickAt(t0 + i * b, i % 3 === 0);
    [[64, 2, 1, "u", "t"], [67, 3, 2, "o", "m"], [65, 5, 1, "o", "r"], [67, 6, 2, "u", "t"], [64, 8, 1, "o", "m"], [65, 9, 2, "o", "r"]].forEach(([m, bt, len, v, c]) => sing(m, t0 + bt * b, len * b * .97, v, c));
    [[48, [52, 55, 60]], [45, [55, 60, 64]], [50, [53, 57, 60]], [43, [53, 59, 62]]].forEach(([bass, ch], i) => { const bar = t0 + (3 + i * 3) * b; piano(bass, bar, b * .9, 1.1); [1, 2].forEach(k => ch.forEach(m => piano(m, bar + k * b, b * .5, .55))); });
  }
  if (!window.__prWired) { window.__prWired = true; document.addEventListener("click", e => { if (e.target.closest("[data-pros]")) playPros(); }); }
  const lesson = { steps: [
    { title: "Lyrics are sound", kick: "Syllables, stress and vowels", render: () => `<p>A lyric isn't only a poem: it's sung, so its <b>sounds</b> matter as much as its meaning. A songwriter or analyst listens for:</p>
      <ul><li><b>Syllables</b>: how many fit in a phrase, and whether the line feels crowded or spacious.</li>
      <li><b>Stress</b>: which syllables are naturally strong (to-<b>MOR</b>-row).</li>
      <li><b>Vowels</b>: open vowels (ah, oh) carry long and high notes well; closed vowels (ee, oo) are harder up high.</li>
      <li><b>Consonants</b>: crisp consonants add rhythm and attack; clusters ("strengths") are hard to sing quickly.</li></ul>` },
    { title: "Rhyme", kick: "Patterns of sound", render: () => `${tbl("Kinds of rhyme", ["Kind", "Example", "Effect"], [["Perfect", "night / light", "strong closure"], ["Two-syllable (feminine)", "falling / calling", "softer, flowing"], ["Slant (near)", "home / alone, time / mine", "natural, conversational"], ["Internal", "rhymes inside a line", "momentum, density (common in rap)"], ["Eye rhyme", "love / move", "a rhyme for the eye only"]])}
      <h3>Rhyme generator</h3>${rgToy()}
      <p><b>Rhyme schemes</b> label line endings with letters: AABB (couplets), ABAB (alternating), ABCB (only lines 2 and 4 rhyme). More rhyme sounds more tightly closed; less rhyme sounds looser and more conversational. Many songs rhyme strictly in the chorus and more loosely in the verses.</p>` },
    { title: "Prosody", kick: "Words and music agree", render: (H, k, U) => `<p><b>Prosody</b> is the fit between a lyric's natural rhythm, stress and meaning and the music it's set to. Stressed syllables usually go on <b>strong beats, longer notes or higher notes</b>.</p>
      ${U.fig(pros, "Good prosody (bars 1–2): the stressed syllable falls on a strong beat and a long note. Poor prosody (bars 3–4): the stress lands on the wrong syllable. The piano plays a boom-chuck-chuck accompaniment: bass note on beat 1, chord on beats 2 and 3.", { play: false })}
      <div class="lbtns"><button class="play" data-pros="1"><span aria-hidden="true">▶ </span>Play: sung, with click and piano</button></div>
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
