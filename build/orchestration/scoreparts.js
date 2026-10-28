window.FAM = (() => {
  const F = (q, a, w, why) => ({ q, a, w, why });
  const SCORE = [
    F("What belongs on a score's cover page?", "title, composer's name and year of composition", ["the instrument list and program note", "the first page of music", "the publisher's price list"], "The inside page has the instrument list, duration and program note."),
    F("What belongs on the inside page of a score?", "the list of instruments, duration and a program note", ["the title only", "the composer's biography only", "a table of contents of the parts"], "The cover has title, composer and year."),
    F("How should instrument names appear on the first page of a score?", "full names, to the left of each staff", ["abbreviated names", "no names at all", "names above each staff"], "Later pages use abbreviated names."),
    F("On later pages of a score, instrument names should be…", "abbreviated (omitted for solos and small ensembles)", ["written out in full again", "left out for every ensemble", "printed in bold capitals"], "Abbreviate for ensembles larger than quartets."),
    F("Where do bar numbers go in a score?", "at the start of each system, above the top staff (and above the strings in orchestral music)", ["every five bars on every staff", "below the bottom staff only", "only at rehearsal letters"], "Rehearsal letters needn't be used alongside bar numbers, except in multi-movement works."),
    F("In a multi-movement work, which restart in each movement?", "bar numbers (rehearsal letters keep going)", ["rehearsal letters (bar numbers keep going)", "both", "neither"], "Rehearsal letters continue through the whole composition."),
    F("What paper size suits orchestral or band scores?", "legal (8.5″ × 14″) or tabloid (11″ × 17″)", ["letter only", "A5", "index cards"], "Small-ensemble scores can be letter size."),
    F("Who should proofread a score?", "a qualified person other than the composer", ["the composer alone", "the notation software", "nobody: software is reliable"], "They should check the music, balance, ranges, transpositions and appearance. Parts too."),
    F("How should a score be printed?", "double-sided and bound", ["single-sided on loose pages", "on one long scroll", "only as a PDF"], "Application scores must always be bound."),
    F("Music submitted to a competition or graduate school must…", "always be bound (spiral, comb, etc.)", ["be on loose pages", "be handwritten", "include only the first page"], "Binding is essential for applications."),
    F("Where do tempo markings, rehearsal letters and bar numbers go in a score?", "over the top staff (and over Violin I in an orchestra)", ["over every staff", "under the bottom staff", "only in the parts"], "They should never appear over each staff; they do appear in each part."),
    F("If the final system has only one bar, you should…", "fit it onto the previous system or narrow the bar", ["leave it stretched across the page", "delete the bar", "add an empty system"], "Systems should be full of music from side to side."),
    F("For an ensemble with 5–10 staves, the score should usually be…", "landscape, with staves sized to fill the page", ["portrait with one system per page", "on index cards", "on legal paper in portrait, half empty"], "Five or fewer staves: multiple systems in portrait. More than ten: consider legal paper."),
    F("Two trumpets on separate staves should be named…", "“Trumpet 1 in B♭” and “Trumpet 2 in B♭”", ["“Trumpet in B♭” on both", "“Trumpet” and “Another trumpet”", "nothing"], "Instrument names should never be identical on two staves."),
    F("Scores are usually sent to ensembles as…", "PDFs, which are also used in rehearsal", ["handwritten originals", "audio files", "notation-software files only"], "Performers may still need printed parts."),
  ];
  const PARTS = [
    F("Where does the instrument name go on a part?", "top left of the first page; top center on later pages", ["bottom right of every page", "only on the last page", "in the title"], "Parts also need the title and composer's name."),
    F("What must parts have at every page turn?", "enough rest to turn the page", ["a fermata", "a key change", "a cue"], "Even with tablets, assume printed parts."),
    F("How many staves per page should a part have?", "eight to twelve, depending on density", ["three or four", "twenty or more", "exactly sixteen"], "Legibility comes first."),
    F("In parts, bar numbers should appear…", "at the start of each staff system", ["every five bars", "only at rehearsal letters", "never"], "They and rehearsal letters must match the score."),
    F("Multi-bar rests in parts are shown with…", "an H-bar with the number of bars", ["a separate whole rest in each bar", "an empty page", "a fermata"], "A bar-number range for the rest is also helpful."),
    F("Cues must appear when an instrument rests for more than…", "eight bars", ["one bar", "two bars", "thirty-two bars"], "They go in the parts, never in the score."),
    F("Cues belong…", "in the parts only, never in the score", ["in the score only", "in both score and parts", "on a separate cue sheet"], "In the score those bars are simply rests."),
    F("A good cue is…", "musically relevant, audible to the player, and in the key of their part", ["any loud passage", "in concert pitch regardless of the part", "the conductor's beat pattern"], "Cues appear in small notes above the rest, with the cued instrument's name."),
    F("Cue notes in a part are written…", "in small notes above whole-bar rests, labeled with the instrument", ["full size in place of the rests", "below the staff in parentheses", "as text only"], "Many notation programs have a paste-as-cue command."),
    F("What staff size is most readable for all instruments?", "about 8.5 mm from bottom line to top", ["about 3 mm", "about 20 mm", "whatever fills the page"], "Parts must be legible from the player's distance to the stand."),
    F("Parts should never be…", "on loose pages", ["double-sided", "letter size", "in portrait format"], "Tape-bind them or fold an 11″ × 17″ booklet."),
    F("A two-page part is best printed…", "side by side on one tabloid sheet, so no page turn is needed", ["on two loose letter sheets", "double-sided on one letter sheet", "in landscape, one page per sheet"], "Fold it with the music facing out so it's easy to find in a folder."),
    F("How many copies of parts are needed?", "as many as the instrumental forces require", ["one per section", "one for the conductor only", "two per piece"], "Duplicate parts for every player (or string stand)."),
    F("Ideally, professional orchestra and band parts are printed on…", "10″ × 13″ paper", ["letter paper", "A5 paper", "11″ × 17″ unfolded"], "Exceptions are made in most situations."),
  ];
  const TYPE = [
    F("Where must a dynamic marking be placed at minimum?", "under each instrument's first note, and the first note after a rest of more than a bar", ["only at the start of the piece in the top staff", "under every note", "under rests before entrances"], "Dynamics never go under rests or empty bars."),
    F("Dynamics on vocal staves go…", "above the staff, to avoid the lyrics", ["below the staff, as usual", "inside the staff", "only in the piano part"], "Instrumental dynamics go below."),
    F("Dynamics should reflect…", "the character wanted for that instrument", ["only which line is foreground", "the loudest instrument in the bar", "the conductor's preference"], "Using dynamics to separate foreground from accompaniment is rarely right."),
    F("How are main tempo indications typeset?", "bold, with sentence capitalization (Allegro ma non troppo)", ["italic lowercase (allegro)", "all capitals (ALLEGRO)", "small plain text"], "E.g. Adagio, Moderato, Tempo I, Fast."),
    F("How are tempo changes typeset?", "not capitalized: accel., a tempo, rit., più mosso", ["bold capitals: Accel.", "in boxes", "the same as the main tempo"], "Only principal tempos get sentence capitals in bold."),
    F("Dynamic markings are printed in…", "bold italics (mp)", ["plain capitals (MP)", "regular roman type", "underlined text"], "Use the program's dynamic or expression text, not plain text."),
    F("Which spelling is correct for a crescendo marking?", "cresc.", ["Cresc.", "cres.", "CRESC."], "crescendo or cresc. — lowercase."),
    F("Instrumental effects like mute on, st. mute, open, sul pont. should be…", "lowercase, not capitalized", ["capitalized", "in bold capitals", "boxed"], "Don't capitalize instrumental effects."),
    F("Ties and slurs are…", "different: a tie joins the same pitch, a slur shapes articulation", ["the same thing", "both only for strings", "interchangeable in parts"], "Notation programs enter them differently."),
    F("A pick-up bar needs…", "rests of the right duration for instruments that don't play", ["whole rests for everyone", "no rests at all", "a fermata"], "Whole rests must not be used in a pick-up bar."),
    F("Which of these terms is normally NOT italicized?", "pizz.", ["dolce", "espr.", "semplice"], "arco, pizz., div., unis. are usually roman; dolce, espr., semplice, cresc., sim. are commonly italic."),
    F("Which of these is commonly italicized?", "dolce", ["arco", "div.", "unis."], "Less common terms are generally italicized; check published scores when in doubt."),
    F("Scores must be legible with…", "no overlapping or unclear elements, and type large enough for a conductor", ["the smallest possible staff size", "as many systems per page as possible", "colored notes for each section"], "Professional standards."),
    F("Staves on the page should be…", "centered, with sensible margins and not spread out", ["crowded at the top", "spread out to fill extra pages", "aligned to the left edge"], "Systems shouldn't just fill the top half of a page."),
  ];
  const fromList = (H, list, kicker, topic) => { const f = H.rnd(list); return H.mc(f.q, f.a, f.w, f.why, { kicker, topic }); };
  return {
    key: "score-parts",
    modes: [{ id: "score", kicker: "The score" }, { id: "parts", kicker: "The parts" }, { id: "type", kicker: "Typesetting" }],
    make(mode, H) { return fromList(H, mode === "score" ? SCORE : mode === "parts" ? PARTS : TYPE, { score: "The score", parts: "The parts", type: "Typesetting" }[mode], mode); },
    reference() {
      return `<ul class="rules"><li><b>Score:</b> cover (title, composer, year); inside page (instruments, duration, program note); full names first page, abbreviated after; bar numbers at each system; double-sided and bound.</li>
      <li><b>Parts:</b> name top left (then top center); rests at page turns; 8–12 staves per page; bar numbers each system; H-bars; cues after 8+ bars of rest (parts only); about 8.5 mm staves; never loose pages.</li>
      <li><b>Typesetting:</b> tempo, rehearsal letters and bar numbers over the top staff (and Violin I); dynamics under first notes, never under rests, bold italic; main tempos bold with sentence capitals; tempo changes and effects lowercase; ties ≠ slurs; pick-up bars get real rests.</li></ul>`;
    },
  };
})();
