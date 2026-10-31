window.FAM = (() => {
  // ===== Note Values and Rhythm Reading. Engine: build/harmony/engine.js =====
  const P = "B4";
  const VAL = [["w", 4, "whole note", "semibreve"], ["hd", 3, "dotted half note", ""], ["h", 2, "half note", "minim"], ["qd", 1.5, "dotted quarter note", ""], ["q", 1, "quarter note", "crotchet"], ["8d", .75, "dotted eighth note", ""], ["8", .5, "eighth note", "quaver"], ["16", .25, "sixteenth note", "semiquaver"], ["hdd", 3.5, "double-dotted half note", ""], ["qdd", 1.75, "double-dotted quarter note", ""]];
  const V = Object.fromEntries(VAL.map(v => [v[0], v]));
  const frac = x => { const w = Math.floor(x), f = x - w, F = { .25: "¼", .5: "½", .75: "¾" }[f] || ""; return (w || !F ? String(w) : "") + F; };
  // percussion-staff bars from tokens like "q", "8r", "8~", "8t1" (triplet group 1)
  const tokN = x => { const rest = /r/.test(x), tie = /~/.test(x), tu = (/t(\d)/.exec(x) || [])[1], d = x.replace(/[r~]|t\d/g, ""); return Object.assign({ k: rest ? [] : [P], d, tie }, tu ? { tu: "g" + tu } : {}); };
  const rh = (time, bars, o = {}) => ({ type: "score", clefs: ["percussion"], time, vf: "C", sig: {}, bpm: o.bpm || 90, final: o.final, bars: bars.map(b => ({ t: [b.split(" ").map(tokN)] })) });
  // every rhythm figure plays with a click on the beat; o.play === false for silent figures
  const fig = (U, sp, cap, o) => U.fig(sp, cap, Object.assign({ small: true, play: window.__harm ? window.__harm.H.withClick(sp) : null }, o || {}));
  const METERS = [["2/4", "simple duple", 2, "quarter"], ["3/4", "simple triple", 3, "quarter"], ["4/4", "simple quadruple", 4, "quarter"], ["2/2", "simple duple (cut time)", 2, "half"], ["6/8", "compound duple", 2, "dotted quarter"], ["9/8", "compound triple", 3, "dotted quarter"], ["12/8", "compound quadruple", 4, "dotted quarter"], ["3/8", "simple triple", 3, "eighth"]];

  // incomplete bars: fill all but one value
  const PIECES = ["h", "q", "q", "8", "8", "qd", "16"];
  function incomplete(H) {
    for (let g = 0; g < 200; g++) {
      const [ts, len, beam] = H.rnd([["4/4", 4], ["3/4", 3], ["2/4", 2], ["6/8", 3]]);
      const miss = H.rnd(ts === "6/8" ? ["qd", "q", "8", "h"] : ["h", "q", "qd", "8", "hd", "16", "8d"]);
      let left = len - V[miss][1]; if (left <= 0) continue;
      const seq = []; let t = 0;
      while (left > 1e-9) { const opts = PIECES.filter(p => V[p][1] <= left + 1e-9 && (ts !== "6/8" || V[p][1] !== 2 || t % 1.5 === 0)); if (!opts.length) break; const p = H.rnd(opts); seq.push(p); left -= V[p][1]; t += V[p][1]; }
      if (left > 1e-9) continue;
      // keep notation tidy: values must not cross the middle of the bar (4/4) or a dotted-quarter beat (6/8)
      let pos = 0, ok = true; const all = seq.concat([miss]);
      const order = H.shuffle(seq).concat([miss]); pos = 0;   // the missing value is always the last one, so the shown notes sit where they belong
      for (const p of order) { const d = V[p][1], end = pos + d; if (ts === "4/4" && pos < 2 && end > 2 && !(pos === 0 && d >= 2)) ok = false; if (ts === "6/8" && Math.floor(pos / 1.5 + 1e-9) !== Math.floor((end - 1e-9) / 1.5) && !(pos % 1.5 === 0 && d % 1.5 === 0)) ok = false; if (ts !== "6/8" && Math.floor(pos + 1e-9) !== Math.floor(end - 1e-9) && pos % 1 > 1e-9) ok = false; /* anything that crosses a beat must start on a beat */ if (d >= .5 && pos % .5 > 1e-9) ok = false; pos = end; }
      if (!ok) continue;
      const gap = order.length - 1;
      const shown = order.map((p, i) => i === gap ? null : p).filter(Boolean);
      return { ts, miss, order, gap, shown };
    }
    return null;
  }

  const FACTS = [
    ["Tempo is measured in…", "beats per minute (BPM)", ["bars per minute", "hertz", "notes per bar"], "At 60 BPM each beat lasts one second."],
    ["Ritardando means…", "gradually slowing down", ["gradually getting louder", "suddenly faster", "return to the original tempo"], "Accelerando speeds up; a tempo returns to the earlier speed."],
    ["The division of the beat is…", "the beat split into its first smaller level (two parts in simple meter, three in compound)", ["the beat itself", "a whole bar", "the tempo"], "Below the division comes the subdivision."],
    ["In 6/8, the subdivision is…", "six sixteenth notes per dotted-quarter beat", ["three eighth notes", "two eighth notes", "four sixteenth notes"], "Beat: dotted quarter. Division: three eighths. Subdivision: six sixteenths."],
    ["A dot after a note adds…", "half of the note's value", ["one beat", "a quarter of its value", "the value of the next note"], "A dotted half = half + quarter = 3 quarter-note beats."],
    ["A second dot adds…", "half the value of the first dot", ["another full half of the note", "one beat", "nothing; it's decoration"], "Double-dotted half = 2 + 1 + ½ = 3½ beats."],
    ["What's the difference between a tie and a slur?", "a tie joins two notes of the same pitch into one sound; a slur joins different pitches", ["there's none", "a slur joins the same pitch", "ties are only for rests"], "Ties add durations; slurs shape phrasing."],
    ["In 6/8, the beat is…", "a dotted quarter note (two beats per bar)", ["an eighth note (six beats per bar)", "a quarter note", "a half note"], "Compound meter: the eighth is the division, not the beat."],
    ["In 2/2 (cut time), the beat is…", "a half note", ["a quarter note", "a whole note", "a dotted quarter note"], "Two half-note beats per bar."],
    ["A triplet is…", "three notes in the time of two of the same value", ["three notes in one beat, always", "a dotted rhythm", "three tied notes"], "Eighth-note triplets: three in the time of two eighths (one quarter beat)."],
    ["In 4/4, a quarter-note triplet lasts…", "2 beats", ["1 beat", "3 beats", "1½ beats"], "Three triplet quarters take the time of two quarters."],
    ["A duplet in 6/8 is…", "two notes in the time of three eighths (one beat)", ["two beats", "a dotted rhythm", "two tied eighths"], "The compound-meter version of a tuplet."],
    ["The British name for a quarter note is…", "crotchet", ["quaver", "minim", "semibreve"], "Quaver = eighth, minim = half, semibreve = whole, semiquaver = sixteenth."],
    ["The British name for an eighth note is…", "quaver", ["crotchet", "semiquaver", "minim"], "A semiquaver is a sixteenth."],
    ["A whole rest by itself in a bar of 3/4 means…", "rest for the whole bar", ["rest for four beats", "an error", "rest for one beat"], "The whole rest (bar rest) fills any complete bar, centered in it."],
    ["Where does a whole-bar rest go?", "centered in the bar", ["on beat 1", "at the end of the bar", "above the staff"], "A bar rest is centered, whatever the meter."],
    ["Which bars end with a bar line?", "every bar, including the last bar of each line", ["only the last bar of the piece", "only bars with notes", "every other bar"], "The end of the piece gets a final (thin–thick) bar line."],
    ["Beams group notes…", "by beat, so the meter is visible", ["by pitch", "always in fours", "only in pairs"], "In 6/8, beam in threes; in 2/4 and 3/4, in twos (or by beat)."],
    ["Notes that occur at the same moment in different parts are…", "vertically aligned", ["written slightly apart", "aligned only if they're the same pitch", "joined with a tie"], "Line up beats across every staff of a system."],
    ["Stem direction: a note above the middle line has its stem…", "down (on the left)", ["up (on the right)", "either way, randomly", "no stem"], "Below the middle line, stems go up; on the middle line, usually down."],
  ];

  function make(mode, H) {
    if (mode === "value") {
      const v = H.rnd(VAL), rest = Math.random() < .3 && !/dd/.test(v[0]);
      const sp = rh("4/4", [v[0] + (rest ? "r" : "")], { final: false }); sp.time = null; sp.minBar = 110; sp.scale = 1.9;
      const all = ["4", "3½", "3", "2", "1¾", "1½", "1", "¾", "½", "¼"];
      return H.mc(`In 4/4, how many quarter-note beats does this ${rest ? "rest" : "note"} last?`, frac(v[1]), all, `A ${v[2].replace("note", rest ? "rest" : "note")} lasts ${frac(v[1])} beat${v[1] === 1 ? "" : "s"} when the quarter note gets the beat.${/d/.test(v[0]) ? " Each dot adds half of the value before it." : ""}`, { kicker: "Note values", staff: sp, topic: "values" });
    }
    if (mode === "math") {
      const pairs = [];
      VAL.forEach(a => VAL.forEach(b => { const r = a[1] / b[1]; if (a !== b && r > 1 && Number.isInteger(r) && r <= 16 && !/d/.test(b[0])) pairs.push([a, b, r]); }));
      const [a, b, r] = H.rnd(pairs);
      return H.mc(`How many ${b[2]}s equal one ${a[2]}?`, String(r), ["1", "2", "3", "4", "6", "7", "8", "12", "14", "16"].filter(x => x !== String(r)), `${a[2]} = ${frac(a[1])} quarter-note beats; ${b[2]} = ${frac(b[1])}. ${frac(a[1])} ÷ ${frac(b[1])} = ${r}.`, { kicker: "Value math", topic: "values" });
    }
    if (mode === "complete") {
      const x = incomplete(H);
      if (!x) return null;
      const sp = rh(x.ts, [x.shown.join(" ")], { final: false });
      const full = rh(x.ts, [x.order.join(" ")]); full.bars[0].t[0][x.gap].hl = true;
      return H.mc(`This bar of ${x.ts} is missing one value. Which single note completes it?`, V[x.miss][2], VAL.slice(0, 8).map(v => v[2]), `The bar holds ${x.ts === "6/8" ? "six eighths (two dotted-quarter beats)" : x.ts.split("/")[0] + " quarter-note beats"}; the notes shown add up to ${frac(x.shown.reduce((t, p) => t + V[p][1], 0) * (x.ts === "6/8" ? 2 : 1))} ${x.ts === "6/8" ? "eighths" : "beats"}, so a ${V[x.miss][2]} completes it (circled).`, { kicker: "Complete the bar", staff: sp, staffAns: full, playQ: H.withClick(full), playQLabel: "Play the full bar with the beat", topic: "meter" });
    }
    if (mode === "tuplet") {
      const kind = H.rnd(["8t", "qt", "16t", "dup"]);
      if (kind === "dup") {
        const sp = rh("6/8", ["8t1 8t1 8 8 8"]); sp.bars[0].t[0].forEach((n, i) => { if (i < 2) { n.tun = 2; n.tuo = 3; } });
        return H.mc("In 6/8, how much time does the bracketed group of two take?", "one beat (three eighths)", ["two beats", "two eighths", "half a beat"], "A duplet: two notes in the time of three eighths, which is one dotted-quarter beat in 6/8.", { kicker: "Tuplets", staff: sp, playQ: H.scorePlay(sp), playQLabel: "Play", topic: "tuplets" });
      }
      const spec = { "8t": ["8t1 8t1 8t1 q h", "1 beat (a quarter note)", "three triplet eighths take the time of two regular eighths: one quarter-note beat."], "qt": ["qt1 qt1 qt1 h", "2 beats (a half note)", "three triplet quarters take the time of two quarters: two beats."], "16t": ["16t1 16t1 16t1 8 q h", "½ beat (an eighth note)", "three triplet sixteenths take the time of two sixteenths: one eighth note, half a beat."] }[kind];
      const sp = rh("4/4", [spec[0]]);
      return H.mc("In 4/4, how much time does the bracketed triplet take?", spec[1], ["½ beat (an eighth note)", "1 beat (a quarter note)", "1½ beats (a dotted quarter)", "2 beats (a half note)", "3 beats (a dotted half)"], `A triplet is three in the time of two: ${spec[2]}`, { kicker: "Tuplets", staff: sp, playQ: H.scorePlay(sp), playQLabel: "Play", topic: "tuplets" });
    }
    if (mode === "meter") {
      const [ts, kind, beats, unit] = H.rnd(METERS);
      if (Math.random() < .5) return H.mc(`What kind of meter is ${ts}?`, kind, [...new Set(METERS.map(m => m[1]))], `${ts}: ${beats} beats per bar, the beat a ${unit} note${unit.startsWith("dotted") ? " (each beat divides into three eighths: compound)" : " (each beat divides into two: simple)"}.`, { kicker: "Meter", topic: "meter" });
      return H.mc(`In ${ts}, what gets the beat?`, `the ${unit} note`, ["the quarter note", "the eighth note", "the half note", "the dotted quarter note"], `${ts} is ${kind}: ${beats} ${unit}-note beats per bar.`, { kicker: "Meter", topic: "meter" });
    }
    const [q, a, w, y] = H.rnd(FACTS);
    return H.mc(q, a, w, y, { kicker: "Terms and principles" });
  }

  function reference() {
    return `<div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Value</th><th scope="col">British name</th><th scope="col">Beats in 4/4</th></tr></thead><tbody>
      ${VAL.filter(v => !/dd/.test(v[0])).map(v => `<tr><td>${v[2]}</td><td>${v[3] || "—"}</td><td>${frac(v[1])}</td></tr>`).join("")}</tbody></table></div>
      <p class="legend">Dot = + half the value; second dot = + half of the first dot. Triplet = 3 in the time of 2; duplet (compound meter) = 2 in the time of 3.</p>`;
  }

  const lesson = { steps: [
    { title: "Note values", kick: "Halving and halving again", render: (H, k, U) => `<p>Each note value is half the one before it: one <b>whole note</b> = two <b>halves</b> = four <b>quarters</b> = eight <b>eighths</b> = sixteen <b>sixteenths</b>.</p>`
      + U.fig(rh("4/4", ["w", "h h", "q q q q", "8 8 8 8 8 8 8 8", "16 16 16 16 16 16 16 16 16 16 16 16 16 16 16 16"]), "Each bar of 4/4 holds the same amount of time, divided into smaller and smaller values.", { small: false, play: H.withClick(rh("4/4", ["w", "h h", "q q q q", "8 8 8 8 8 8 8 8", "16 16 16 16 16 16 16 16 16 16 16 16 16 16 16 16"])) })
      + `<div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">American</th><th scope="col">British</th><th scope="col">In 4/4</th></tr></thead><tbody><tr><td>whole note</td><td>semibreve</td><td>4 beats</td></tr><tr><td>half note</td><td>minim</td><td>2</td></tr><tr><td>quarter note</td><td>crotchet</td><td>1</td></tr><tr><td>eighth note</td><td>quaver</td><td>½</td></tr><tr><td>sixteenth note</td><td>semiquaver</td><td>¼</td></tr></tbody></table></div>` },
    { title: "Parts of a note", kick: "Heads, stems, flags, beams", render: () => `<ul><li><b>Notehead</b>: open (whole and half notes) or filled (quarter and shorter).</li><li><b>Stem</b>: every value shorter than a whole note has one. Notes above the middle line take stems <b>down</b> (on the left of the head); below it, <b>up</b> (on the right); on the middle line, usually down.</li><li><b>Flags</b>: one for an eighth, two for a sixteenth, and so on.</li><li><b>Beams</b> replace flags to group notes by beat, so the meter is easy to see.</li></ul>` },
    { title: "Rests", kick: "Measured silence", render: (H, k, U) => {
      const V = [["w", "whole"], ["h", "half"], ["q", "quarter"], ["8", "eighth"], ["16", "sixteenth"]];
      const sp = { type: "score", clefs: ["percussion", "percussion"], ids: ["t", "b"], time: null, vf: "C", sig: {}, final: false, minBar: 96, bars: V.map(([d, n]) => ({ t: [[{ k: [P], d, ly: n + " note" }]], b: [[{ k: [], d, ly: n + " rest" }]] })) };
      return U.fig(sp, "Each rest (below) lasts as long as the note value above it.", { small: false, play: false })
      + `<p>The half rest sits on the 3rd line (“a hat”); the whole rest hangs from the 4th line (“a hole”). The eighth and sixteenth rests have one and two flags, like their notes.</p>
      <p>The whole-rest symbol is also the <b>bar rest</b>: a whole bar of silence in any meter, centered in the bar (see the next step).</p>
      <p>Rests follow the same rule as notes: show the beats. In 4/4, two quarter rests (not a half rest) fill beats 2–3, so the middle of the bar stays visible.</p>`;
    } },
    { title: "Bar lines and bar rests", kick: "Every bar is complete", render: (H, k, U) => {
      const bars = rh("3/4", ["q q q", "wr", "h q"]); bars.bars[1].t[0][0].center = true;
      const bars2 = rh("6/8", ["qd qd", "wr", "q 8 qd"]); bars2.bars[1].t[0][0].center = true;
      return `<ul><li><b>Every bar ends with a bar line</b>, including the last bar on each line (system) of music. The very end of a piece gets a <b>final bar line</b> (thin–thick); a <b>double bar line</b> (two thin lines) marks the end of a section.</li>
        <li>A bar must contain exactly the number of beats the time signature says (except a pick-up and the bar that balances it).</li>
        <li>A <b>bar rest</b> (the whole-rest symbol) means “rest for the whole bar” in <b>any</b> meter, even 3/4 or 6/8, where a whole note wouldn't fit. It's <b>centered</b> in the bar, not placed on beat 1.</li>
        <li>Several silent bars in a part become a <b>multi-bar rest</b>: a thick bar with the number of bars above it.</li></ul>
        <div class="lfigs">${fig(U, bars, "3/4: a centered bar rest fills the middle bar")}${fig(U, bars2, "6/8: the same symbol, still a full bar")}</div>`;
    } },
    { title: "Dots and ties", kick: "Longer values", render: (H, k, U) => `<p>A <b>dot</b> adds half of the note's value: a dotted half = 2 + 1 = 3 beats; a dotted quarter = 1 + ½ = 1½. A <b>second dot</b> adds half of the first dot: a double-dotted half = 2 + 1 + ½ = 3½.</p>
      <div class="lfigs">${fig(U, rh("4/4", ["hd q"]), "Dotted half + quarter")}${fig(U, rh("4/4", ["h~ q q"]), "The same rhythm with a tie")}${fig(U, rh("4/4", ["qd 8 qd 8"]), "Dotted quarter + eighth, twice")}${fig(U, rh("4/4", ["hdd 8"]), "Double-dotted half + eighth")}</div>
      <p>A <b>tie</b> joins two notes of the same pitch into one sound. Ties can cross bar lines (dots can't), and they keep the beat visible inside a bar.</p>`
      + H.check("How many beats is a dotted quarter note in 4/4?", "1½", ["1", "2", "1¾"], "1 + ½.") },
    { title: "Meter and the beat", kick: "Simple and compound", render: (H, k, U) => `<p>The top number of a time signature says how many; the bottom number says what kind. In <b>simple meter</b> each beat divides into two; in <b>compound meter</b> each beat is dotted and divides into three.</p>
      <div class="ltable-wrap"><table class="ltable"><thead><tr><th scope="col">Meter</th><th scope="col">Kind</th><th scope="col">Beats × beat unit</th></tr></thead><tbody>${METERS.map(m => `<tr><td>${m[0]}</td><td>${m[1]}</td><td>${m[2]} × ${m[3]} note</td></tr>`).join("")}</tbody></table></div>
      <div class="lfigs">${fig(U, rh("3/4", ["8 8 8 8 8 8"]), "3/4: three beats, beamed in twos")}${fig(U, rh("6/8", ["8 8 8 8 8 8"]), "6/8: two beats, beamed in threes")}</div>
      <p>Three levels of pulse:</p>
      <ul><li><b>Beat</b>: the main pulse you tap your foot to (the quarter note in 2/4, 3/4, 4/4; the dotted quarter in 6/8, 9/8, 12/8).</li><li><b>Division</b>: the beat split into its first smaller level: two eighths in simple meter, three eighths in compound meter.</li><li><b>Subdivision</b>: the division split again: sixteenths in both (four per beat in simple meter, six in compound).</li></ul>
      <div class="lfigs">${fig(U, rh("2/4", ["q q", "8 8 8 8", "16 16 16 16 16 16 16 16"]), "2/4: beat, division, subdivision")}${fig(U, rh("6/8", ["qd qd", "8 8 8 8 8 8", "16 16 16 16 16 16 16 16 16 16 16 16"]), "6/8: beat, division, subdivision")}</div>`
      + H.check("In 6/8, how many beats are in a bar?", "2", ["6", "3", "8"], "Two dotted-quarter beats.")
      + H.check("In 3/4, the division of the beat is…", "two eighth notes", ["three eighth notes", "four sixteenth notes", "a half note"], "Simple meter: the beat divides in two; the subdivision is four sixteenths.") },
    { title: "Tempo", kick: "How fast the beat goes", render: (H) => `<p><b>Tempo</b> is the speed of the beat, measured in <b>beats per minute</b> (BPM). At 60 BPM each beat lasts one second; at 120 BPM, half a second. Tempo is separate from meter: a 3/4 waltz can be slow or fast, and the time signature doesn't say which.</p>
      <ul><li>A <b>metronome mark</b> such as ♩ = 96 gives the beat unit and its speed. In compound meters the beat is the dotted quarter: ♩. = 60 in 6/8 means one beat per second, with three eighth notes in each.</li>
      <li>The mechanical metronome was patented by Johann Maelzel in 1815; "M.M." in old scores stands for Maelzel's Metronome. The <a href="metronome.html">Metronome</a> app on this site keeps time for practice.</li>
      <li>DAWs, drum machines and sequencers set the tempo in BPM, and their bars-and-beats ruler follows it.</li></ul>
      <div class="ltable-wrap" tabindex="0" role="region" aria-label="Tempo terms"><table class="ltable"><caption>Common tempo terms (approximate; sources and styles differ)</caption><thead><tr><th scope="col">Term</th><th scope="col">Meaning</th><th scope="col">About</th></tr></thead><tbody>
      ${[["Grave, Largo", "very slow, broad", "40–60"], ["Adagio", "slow, at ease", "66–76"], ["Andante", "at a walking pace", "76–108"], ["Moderato", "moderate", "108–120"], ["Allegro", "fast, lively", "120–156"], ["Vivace", "lively and fast", "156–176"], ["Presto", "very fast", "168–200"], ["Prestissimo", "as fast as possible", "200+"]].map(r => `<tr><td><i>${r[0]}</i></td><td>${r[1]}</td><td>${r[2]} BPM</td></tr>`).join("")}</tbody></table></div>
      <p><b>Changing tempo:</b> <i>accelerando</i> (accel.) speeds up; <i>ritardando</i> (rit.) and <i>rallentando</i> (rall.) slow down; <i>a tempo</i> returns to the previous tempo; <i>rubato</i> means flexible, expressive timing; a <b>fermata</b> (𝄐) holds a note or rest longer than written.</p>`
      + H.check("At 120 BPM, how long does each beat last?", "half a second", ["one second", "two seconds", "a quarter of a second"], "60 seconds ÷ 120 beats = 0.5 seconds per beat.")
      + H.check("Which tempo term means 'at a walking pace'?", "Andante", ["Allegro", "Presto", "Largo"], "From the Italian andare, to walk.") },
    { title: "Triplets and tuplets", kick: "Three in the time of two", render: (H, k, U) => {
      const dup = rh("6/8", ["8t1 8t1 8 8 8"]); dup.bars[0].t[0].forEach((n, i) => { if (i < 2) { n.tun = 2; n.tuo = 3; } });
      const q5 = rh("4/4", ["16t1 16t1 16t1 16t1 16t1 q h"]); q5.bars[0].t[0].forEach((n, i) => { if (i < 5) { n.tun = 5; n.tuo = 4; } });
      return `<p>A <b>tuplet</b> fits a different number of notes into a beat (or group of beats) than the meter normally allows. The number over the bracket tells how many.</p>
      <ul><li><b>Triplet</b>: three in the time of two. Eighth-note triplets fill one quarter beat; quarter-note triplets fill two beats.</li><li><b>Duplet</b>: two in the time of three, in compound meter (two eighths in one dotted-quarter beat).</li><li>Other tuplets work the same way: a <b>quintuplet</b> puts five sixteenths in the time of four.</li></ul>
      <div class="lfigs">${fig(U, rh("4/4", ["8t1 8t1 8t1 8t2 8t2 8t2 q q"]), "Eighth-note triplets: three per beat")}${fig(U, rh("4/4", ["qt1 qt1 qt1 h"]), "Quarter-note triplet: three in two beats")}${fig(U, dup, "Duplet in 6/8: two in one beat")}${fig(U, q5, "Quintuplet: five sixteenths in one beat")}</div>`
        + H.check("In 4/4, a quarter-note triplet lasts…", "2 beats", ["1 beat", "3 beats", "1½ beats"], "Three triplet quarters in the time of two quarters.");
    } },
    { title: "Counting", kick: "Saying the rhythm", render: (H, k, U) => `<ul><li><b>Simple meter:</b> beats “1 2 3 4”; eighths “1 &amp; 2 &amp;”; sixteenths “1 e &amp; a”.</li><li><b>Compound meter:</b> beats “1 2” in 6/8, each dividing “1 &amp; a” (some teachers use “1 la li”).</li><li><b>Triplets:</b> “1 trip-let 2 trip-let”.</li></ul>`
      + `<div class="lfigs">${fig(U, rh("4/4", ["16 16 16 16 8 8 q q"]), "1 e &amp; a, 2 &amp;, 3, 4")}${fig(U, rh("6/8", ["8 8 8 qd"]), "1 &amp; a, 2")}</div>` },
    { title: "Lining up rhythm", kick: "Vertical alignment", render: (H, k, U) => {
      const sp = { type: "score", clefs: ["treble", "bass"], time: "4/4", vf: "C", sig: {}, bpm: 84, minBar: 320, bars: [{ t: [[{ k: ["E5"], d: "q" }, { k: ["D5"], d: "8" }, { k: ["C5"], d: "8" }, { k: ["B4"], d: "h" }]], b: [[{ k: ["C3"], d: "h" }, { k: ["G2"], d: "8" }, { k: ["A2"], d: "8" }, { k: ["B2"], d: "8" }, { k: ["G2"], d: "8" }]] }] };
      return `<ul><li>Notes and rests that happen at the same moment line up <b>vertically</b>, across every staff of a system.</li><li>Horizontal space follows time: longer values get more room (though not strictly in proportion), so the beat is easy to see.</li><li>Beam by beat, and don't hide the middle of a 4/4 bar (see the Rhythm Notation lesson for more).</li></ul>`
        + U.fig(sp, "Beat 3 lines up in both staves, even though the hands have different rhythms.");
    } },
    { title: "Quick check", kick: "Before the drills", render: (H) => H.check("How many sixteenth notes equal a dotted quarter?", "6", ["4", "3", "8"], "1½ beats = 6 sixteenths.") + H.check(FACTS[7][0], FACTS[7][1], FACTS[7][2], FACTS[7][3]) + H.check(FACTS[5][0], FACTS[5][1], FACTS[5][2], FACTS[5][3]) + H.check(FACTS[10][0], FACTS[10][1], FACTS[10][2], FACTS[10][3]) },
  ] };

  return {
    key: "silverapps-notevalues-v1", lesson, make, reference,
    modes: [{ id: "value", kicker: "Note values" }, { id: "math", kicker: "Value math" }, { id: "complete", kicker: "Complete the bar" }, { id: "tuplet", kicker: "Tuplets" }, { id: "meter", kicker: "Meter" }, { id: "terms", kicker: "Terms and principles" }],
    topics: [],
  };
})();
