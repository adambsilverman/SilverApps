// ===== "Brother, Can You Spare a Dime?" (Jay Gorney / E. Y. Harburg, 1932), bars 1–8: Adam's lead sheet and six piano settings (images in assets/img/dime/),
// the melody and chords as data, and a figure that hides an arrangement's chord symbols until "Show the chords" reveals them with their regions shaded.
// Shared by the Lead Sheets lesson (leadsheets.js) and the Piano Accompaniment lesson (accomp.js). Time in quarter-note beats; bar 1 starts at 0.
window.DIME = (() => {
  const NM = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];
  const name = m => NM[((m % 12) + 12) % 12];
  // melody: [start, length, midi, syllable]
  const MEL = [[0, .75, 60, "Once"], [.75, .25, 62, "I"], [1, .75, 63, "built"], [1.75, .25, 65, "a"], [2, .5, 67, "rail-"], [2.5, 1.5, 72, "-road"],
    [4, 1, 71, "made"], [5, .5, 67, "it"], [5.5, 2.5, 70, "run"], [8, 1, 69, "Made"], [9, .5, 65, "it"], [9.5, 1, 68, "race"], [10.5, .5, 70, "a-"], [11, 1, 68, "-gainst"], [12, 4, 67, "time"],
    [16, .75, 65, "Once"], [16.75, .25, 63, "I"], [17, .75, 62, "built"], [17.75, .25, 63, "a"], [18, .5, 65, "rail-"], [18.5, 1.5, 67, "-road"],
    [20, 1, 63, "now"], [21, .5, 60, "it's"], [21.5, 2.5, 63, "done"], [24, .75, 62, "Bro-"], [24.75, .25, 60, "-ther"], [25, .75, 59, "can"], [25.75, .25, 60, "you"], [26, .5, 62, "spare"], [26.5, 1, 63, "a"], [27.5, 3.5, 60, "dime"]];
  const CHORD = { "Cm": [[0, 3, 7], 0, "C–E♭–G"], "G7/D": [[7, 11, 2, 5], 2, "G–B–D–F, D in the bass"], "C7/E": [[0, 4, 7, 10], 4, "C–E–G–B♭, E in the bass"], "F": [[5, 9, 0], 5, "F–A–C"],
    "B♭/D": [[10, 2, 5], 2, "B♭–D–F, D in the bass"], "E♭": [[3, 7, 10], 3, "E♭–G–B♭"], "G7": [[7, 11, 2, 5], 7, "G–B–D–F"], "Dm7(♭5)": [[2, 5, 8, 0], 2, "D–F–A♭–C"],
    "A♭7": [[8, 0, 3, 6], 8, "A♭–C–E♭–G♭"], "Fm6": [[5, 8, 0, 2], 5, "F–A♭–C–D"] };
  const CH = [[0, "Cm"], [4, "G7/D"], [6, "C7/E"], [8, "F"], [10, "B♭/D"], [12, "E♭"], [14, "G7"], [16, "Dm7(♭5)"], [18, "G7"], [20, "Cm"], [22, "A♭7"], [24, "Fm6"], [26, "G7"], [28, "Cm"], [30, "G7"]];
  const END = 32;
  const inChord = (sym, m) => CHORD[sym][0].includes(((m % 12) + 12) % 12);
  // non-chord tones: by start beat ("h" + region start for a note held over into a region)
  const NCT = { .75: "a passing tone (C–D–E♭)", 1.75: "a passing tone (E♭–F–G)", 5.5: "an anticipation: B♭ arrives before C7/E, where it's the 7th",
    9.5: "a chromatic step down from A (the 3rd of F), held over into the next chord", h10: "held over: A♭ against B♭ adds a 7th (it sounds like B♭7), pulling toward E♭",
    11: "the 7th of B♭ again (B♭7), resolving down to G over E♭", 16.75: "a passing tone (F–E♭–D)", 17.75: "a passing tone (D–E♭–F)", 25: "a neighbor tone (C–B–C)",
    26.5: "an escape tone: a step up from D, then a leap down to C", h30: "held over from C minor: the singer is still on C when the G7 arrives", 27.5: "an anticipation: C arrives just before the C minor chord" };
  // images: chord-symbol boxes [system, x0, x1, y0, y1] and system bands [y0, y1], in pixels of the original scans
  const IMG = {"leadsheet":{"w":2248,"h":777,"sys":[[50,370],[405,770]],"ch":[[0,251,356,81,142],[0,852,1001,72,149],[0,1126,1268,72,173],[0,1348,1410,80,141],[0,1623,1759,72,149],[0,1941,2020,81,139],[0,2071,2169,75,141],[1,197,394,429,500],[1,490,588,435,501],[1,745,849,441,502],[1,976,1089,435,500],[1,1170,1297,434,501],[1,1540,1637,435,501],[1,1840,1969,415,502],[1,1991,2089,435,501]]},"alberti":{"w":2240,"h":960,"sys":[[0,430],[465,935]],"ch":[[0,298,403,11,72],[0,791,940,2,79],[0,1014,1156,2,103],[0,1264,1326,10,71],[0,1493,1630,2,79],[0,1742,1821,11,69],[0,1960,2058,5,71],[1,244,441,485,556],[1,491,640,488,565],[1,733,838,497,558],[1,939,1053,491,556],[1,1181,1307,490,557],[1,1442,1540,491,557],[1,1713,1818,471,558],[1,1918,2016,491,557]]},"block":{"w":2232,"h":973,"sys":[[0,435],[470,945]],"ch":[[0,290,395,14,75],[0,844,993,5,82],[0,1092,1235,5,106],[0,1301,1363,13,74],[0,1550,1687,5,82],[0,1827,1906,14,72],[0,2000,2097,8,74],[1,236,433,493,564],[1,513,662,496,573],[1,748,853,505,566],[1,987,1101,499,564],[1,1188,1314,498,565],[1,1479,1576,499,565],[1,1756,1861,478,566],[1,1923,2020,499,565]]},"stride":{"w":2200,"h":981,"sys":[[0,445],[475,965]],"ch":[[0,267,372,14,75],[0,785,934,5,82],[0,1024,1166,5,105],[0,1251,1313,13,74],[0,1490,1627,5,82],[0,1758,1837,14,72],[0,1953,2051,8,74],[1,213,410,498,569],[1,479,576,504,570],[1,714,819,510,571],[1,944,1058,504,569],[1,1166,1293,503,570],[1,1448,1546,504,570],[1,1710,1824,483,571],[1,1907,2005,504,570]]},"singer":{"w":2248,"h":1622,"sys":[[0,795],[820,1600]],"ch":[[0,303,408,28,89],[0,851,1000,19,96],[0,1079,1221,19,119],[0,1297,1359,27,88],[0,1526,1663,19,96],[0,1812,1891,28,86],[0,1998,2095,22,88],[1,249,446,843,914],[1,528,625,849,915],[1,765,870,855,916],[1,963,1077,849,914],[1,1149,1275,848,915],[1,1519,1616,849,915],[1,1801,1930,829,916],[1,1978,2075,849,915]]},"pulse":{"w":2216,"h":973,"sys":[[0,440],[478,950]],"ch":[[0,277,382,22,83],[0,814,963,13,90],[0,1048,1191,13,114],[0,1276,1338,21,82],[0,1512,1649,13,90],[0,1775,1854,22,80],[0,1967,2064,16,82],[1,223,420,500,571],[1,489,638,503,580],[1,725,829,512,573],[1,954,1068,506,571],[1,1177,1303,505,572],[1,1459,1556,506,572],[1,1717,1834,486,573],[1,1918,2015,506,572]]},"bassline":{"w":2224,"h":1149,"sys":[[0,505],[535,1140]],"ch":[[0,283,388,17,78],[0,769,918,8,108],[0,1012,1155,8,108],[0,1226,1288,16,77],[0,1460,1597,8,85],[0,1712,1791,17,75],[0,1976,2073,11,77],[1,229,426,559,630],[1,510,659,562,639],[1,716,820,571,632],[1,928,1042,565,630],[1,1195,1321,564,631],[1,1470,1568,565,631],[1,1710,1822,544,632],[1,1950,2047,565,631]]},"rhythm":{"w":2264,"h":1622,"sys":[[0,790],[820,1600]],"ch":[[0,270,370,18,77],[0,817,959,10,84],[0,1048,1185,10,88],[0,1282,1342,18,76],[0,1486,1618,10,84],[0,1758,1835,18,74],[0,1962,2056,13,76],[1,218,406,835,903],[1,476,570,841,904],[1,723,824,846,905],[1,920,1030,841,903],[1,1148,1269,840,904],[1,1504,1598,841,904],[1,1807,1908,846,905],[1,1989,2084,841,904]]}};
  const ALT = { leadsheet: "Lead sheet of the first eight bars of Brother, Can You Spare a Dime? in C minor, 4/4, Medium Slow: melody with lyrics and chord symbols, ending with a first ending and a repeat sign.",
    alberti: "Piano setting: the melody in the right hand, an Alberti bass in left-hand eighth notes.", block: "Piano setting: the melody in the right hand, block chords held in the left hand (half and whole notes).",
    stride: "Piano setting: the melody in the right hand; the left hand leaps between low bass notes on beats 1 and 3 and chords on beats 2 and 4 (stride).",
    singer: "Voice and piano: the vocal line with lyrics on top; the piano's right hand plays chords on beats 2 and 4 and the left hand bass notes on beats 1 and 3.",
    pulse: "Piano setting: the melody in the right hand, left-hand chords repeated on every beat.", rhythm: "Voice and piano: the vocal line in the bass clef with lyrics; the piano's right hand plays chord tones in a steady eighth-note pattern, the left hand half-note bass notes, with the pedal changing for each chord.", bassline: "Piano setting: the melody on top of the right hand with chord tones under it; an active bass line in the left hand." };
  const AUDL = { leadsheet: "the lead sheet played: melody and chords", melody: "the melody alone", alberti: "Alberti bass setting", block: "block chords setting", stride: "stride (boom-chuck all in the piano) setting",
    singer: "voice and piano (boom-chuck) setting", pulse: "pulsing chords setting", rhythm: "voice and piano with rhythmicized chords", bassline: "melody with chords and an active bass line" };
  const aud = id => `<audio class="dm-aud" controls preload="none" src="assets/audio/dime/${id}.mp3" aria-label="Brother, Can You Spare a Dime?: ${AUDL[id]}"></audio>`;
  const pc = (v, t) => (v / t * 100).toFixed(2) + "%";
  // a setting with its chord symbols covered; the toggle shows them and shades each chord's region
  function fig(id, cap, o = {}) {
    const d = IMG[id], syms = CH.map(c => c[1]), lab = o.g7d ? syms.map((s, i) => i === 8 ? "G7/D" : s) : syms;
    const regs = d.ch.map(([s, x0], i) => { const nx = d.ch[i + 1] && d.ch[i + 1][0] === s ? d.ch[i + 1][1] : d.w - 12, [y0, y1] = d.sys[s];
      return `<span class="dm-reg${i % 2 ? " alt" : ""}" style="left:${pc(x0 - 12, d.w)};width:${pc(nx - x0, d.w)};top:${pc(y0, d.h)};height:${pc(y1 - y0, d.h)}"></span>`; }).join("");
    const covs = d.ch.map(([s, x0, x1, y0, y1]) => `<span class="dm-cov" style="left:${pc(x0 - 8, d.w)};width:${pc(x1 - x0 + 16, d.w)};top:${pc(y0 - 6, d.h)};height:${pc(y1 - y0 + 12, d.h)}"></span>`).join("");
    return `<figure class="lfig dm-fig"><div class="dm-wrap" tabindex="0" role="region" aria-label="${ALT[id].split(":")[0]}"><div class="dm-score">${regs}<img src="assets/img/dime/${id}.png" alt="${ALT[id]} Chord symbols are hidden until you show them." width="1600" height="${Math.round(d.h * 1600 / d.w)}">${covs}</div></div>
      <figcaption><p>${cap}</p>${aud(id)}<button type="button" class="btn dm-show" data-dmshow aria-pressed="false">Show the chords</button><span class="sr dm-list"> Chords: ${lab.join(", ")}.</span><p class="note lcite fair-use" data-fair-use></p></figcaption></figure>`;
  }
  if (typeof document !== "undefined") document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-dmshow]"); if (!b) return;
    const f = b.closest(".dm-fig"), on = !f.classList.contains("on"); f.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); b.textContent = on ? "Hide the chords" : "Show the chords"; });
  // region playback: block chord (close position around middle C) + bass + melody notes that start in the region
  function regionPlay(i) {
    const [s, sym] = CH[i], e = i + 1 < CH.length ? CH[i + 1][0] : END, [pcs, bass] = CHORD[sym], spb = 60 / 72, ev = [];
    let b = 55; while (!pcs.includes(b % 12)) b++; const v = [b]; pcs.filter(p => p !== b % 12).forEach(p => { let m = b + 1; while (m % 12 !== p) m++; v.push(m); });
    let bm = 36; while (bm % 12 !== bass) bm++;
    v.forEach(m => ev.push([m, 0, (e - s) * spb, .4])); ev.push([bm, 0, (e - s) * spb, .55]);
    MEL.filter(n => n[0] < e - 1e-6 && n[0] + n[1] > s + 1e-6).forEach(n => { const st = Math.max(n[0], s); ev.push([n[2] + 12, (st - s) * spb, (Math.min(n[0] + n[1], e) - st) * spb * .95, .9]); });
    return { ev };
  }
  return { MEL, CH, CHORD, END, IMG, NCT, inChord, name, fig, aud, regionPlay };
})();
