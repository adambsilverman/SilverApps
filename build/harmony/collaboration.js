window.FAM = (() => {
  // ===== Collaboration: roles, communication, process, and credit and agreements. =====
  const tbl = (cap, head, rows) => `<div class="ltable-wrap" tabindex="0" role="region" aria-label="${cap}"><table class="ltable"><caption>${cap}</caption><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  const F = {
    roles: [
      ["At the start of a collaboration, it helps most to agree on…", "who does what, who makes final decisions, and the deadlines", ["the font for the score", "nothing; roles emerge later", "only the title"], "Unclear roles cause most collaboration conflicts."],
      ["An arranger…", "adapts existing music for particular voices or instruments", ["writes only lyrics", "masters recordings", "books concerts"], "Arrangers make decisions about voicing, texture, form and instrumentation."],
      ["A music director in a theater production usually…", "teaches and rehearses the music and conducts or leads the band", ["designs the lighting", "writes the script", "sells tickets"], "They're the musical link between the composer's score, the performers and the director."],
      ["A composer working with a choreographer should expect to…", "adjust music to the dance's timing and structure, and vice versa", ["never change anything", "decide all the steps", "avoid counting"], "Shared counts (\"5, 6, 7, 8\") and rehearsal recordings help."],
      ["In a co-writing session for songs, a topliner usually writes…", "melody and lyrics over an existing track", ["the drum programming", "the mastering", "the album artwork"], "The track producer makes the instrumental; the topliner writes the vocal line."],
    ],
    comm: [
      ["Which feedback is most useful in rehearsal?", "\"Bar 32: the horns cover the melody; try mp\"", ["\"It doesn't work\"", "\"Make it better\"", "\"I don't like it\""], "Specific location, problem and suggestion."],
      ["Rehearsal letters or bar numbers in parts…", "let everyone find the same place quickly", ["are only for the conductor", "are decoration", "replace the key signature"], "Number every bar, or at least the first bar of each system, and use letters at section starts."],
      ["'Yes, and…' as a collaboration habit means…", "build on another person's idea before judging it", ["agree with everything", "always add more instruments", "ignore feedback"], "Try ideas before rejecting them; you can still choose later."],
      ["When two collaborators disagree about a musical choice, a good first step is to…", "try both versions and listen", ["argue until someone gives up", "drop the section", "let the loudest person decide"], "Hearing both often settles it. If not, the agreed decision-maker decides."],
      ["In film, theater and game work, the composer should remember that…", "the music serves a shared project and a director's vision", ["the music matters most", "no revisions will be requested", "dialogue should be drowned out"], "Expect notes (requested changes) and revisions."],
      ["Working across cultures or traditions, a collaborator should…", "learn the tradition's terms, roles and expectations and credit sources fairly", ["assume every tradition works like their own", "borrow sounds without asking", "avoid all discussion"], "Respect and clear communication prevent misunderstanding."],
    ],
    proc: [
      ["Good file naming for shared audio files includes…", "song, part, version and date (e.g. Song_Bass_v3_2026-10-31.wav)", ["\"final\" on every file", "random names", "only the date"], "\"final_FINAL2\" is how projects get lost."],
      ["Stems are…", "submixes of groups of tracks (drums, bass, vocals…) exported for others to use", ["the first draft", "MIDI files only", "lyrics sheets"], "Export stems from the same start point, at the same sample rate and length."],
      ["Before sending a DAW project to a collaborator, you should…", "agree on tempo, sample rate and file formats, and include any audio files", ["delete the audio files", "change the tempo", "send only a screenshot"], "Collected projects or stems avoid missing files."],
      ["An efficient rehearsal usually…", "has a plan: what to run, what to fix, and how long each takes", ["runs everything top to bottom every time", "starts whenever people arrive", "has no breaks"], "Run, fix, run again; save easy sections for the end if time is short."],
      ["Real-time playing over the internet is difficult because of…", "latency (delay) between players", ["copyright law", "sample libraries", "key signatures"], "Many remote projects instead record parts one after another to a shared click."],
    ],
    biz: [
      ["A split sheet records…", "each songwriter's share of a song's composition", ["the band's tour schedule", "a mixing template", "the number of takes"], "Agree and sign it soon after the song is written, while everyone remembers who did what."],
      ["In US copyright law, a work made for hire is usually owned by…", "the employer or commissioning party (if agreed in writing), not the creator", ["the creator always", "the public", "the performers"], "Read contracts carefully; this site isn't legal advice."],
      ["A producer's 'points' are…", "a percentage of the recording's royalties", ["a rating scale", "the number of songs", "bar numbers"], "Producer deals vary: fees, points or both."],
      ["Why should collaborators register songs with a performing rights organization (such as ASCAP, BMI, SESAC or GMR in the US)?", "so performance royalties are collected and split correctly", ["to get a copyright", "to make the song longer", "to print sheet music"], "Each writer registers their share; the shares should match the split sheet."],
      ["Accurate credits and metadata matter because…", "royalties and recognition depend on them", ["streaming services require no credits", "they change the sound", "they set the tempo"], "Include writers, producers, performers, ISRCs and PRO details."],
      ["Using a sample of someone else's recording in a collaboration generally needs…", "permission (clearance) from both the recording owner and the song's publisher", ["no permission if it's short", "only the drummer's permission", "a credit line only"], "There's no automatic 'few seconds' exemption."],
    ],
  };
  const lesson = { steps: [
    { title: "Why and how musicians collaborate", kick: "Working together", render: () => `<p>Most music is collaborative: ensembles, bands, choirs, songwriting teams, composer–performer partnerships, producers and artists, and music for dance, theater, film and games. Good collaborations combine different strengths, and they depend on clear roles, communication and trust.</p>
      ${tbl("Kinds of collaboration", ["Kind", "Typical partners"], [["Ensemble performance", "players, conductor or leader"], ["Co-writing", "songwriters, topliners, track producers"], ["Commissions and premieres", "composer, performers, presenter"], ["Production", "artist, producer, engineers, session musicians"], ["Interdisciplinary", "choreographers, directors, filmmakers, game designers, visual artists"]])}` },
    { title: "Roles and decisions", kick: "Who does what", render: () => `<p>Agree early on: who is doing what, who has the final say on which decisions, the schedule and deadlines, and how credit and money will be shared. Write it down, even informally. Roles that often need defining: leader or director, composer, lyricist, arranger, producer, performers, engineer, and (in theater, dance and media) the director whose vision the music serves.</p>` },
    { title: "Communication", kick: "Saying it clearly", render: () => `<ul><li><b>Shared reference points</b>: bar numbers, rehearsal letters, timecode, lyric lines.</li>
      <li><b>Specific feedback</b>: where, what, and a suggestion ("Bar 32: horns cover the melody; try mp").</li>
      <li><b>Build before judging</b>: "yes, and…"; try ideas before rejecting them.</li>
      <li><b>Disagreements</b>: separate the idea from the person, try both versions, then let the agreed decision-maker decide.</li>
      <li><b>Across traditions</b>: learn the terms, roles and expectations of the tradition you're working in, and credit sources.</li></ul>` },
    { title: "Rehearsals, sessions and files", kick: "Process", render: () => `<ul><li><b>Rehearsals</b>: share music in advance; plan what to run and fix; run, fix, run again; finish on time.</li>
      <li><b>Recording sessions</b>: confirm tempo, key, click, charts and the order of songs beforehand.</li>
      <li><b>Files</b>: agree on sample rate and formats; name files with song, part, version and date; export <b>stems</b> from the same start point; keep a shared folder with versions.</li>
      <li><b>Remote work</b>: latency makes real-time playing hard, so most remote projects pass parts along one at a time over a shared click and tempo map.</li></ul>` },
    { title: "Credit, splits and agreements", kick: "The business side", render: () => `<p>Talk about credit and money early, when it's easy. (This is general information, not legal advice.)</p>
      <ul><li><b>Songwriting splits</b>: who owns what share of the composition. Record it on a signed <b>split sheet</b>.</li>
      <li><b>Recording</b>: producers may receive a fee, <b>points</b> (a share of royalties) or both; session musicians are usually paid a fee.</li>
      <li><b>Work made for hire</b>: under US law, the commissioning party may own the work if agreed in writing; read contracts.</li>
      <li><b>Registration</b>: register songs and shares with a performing rights organization (in the US: ASCAP, BMI, SESAC or GMR), and keep credits and metadata accurate.</li>
      <li><b>Samples and borrowed material</b> need clearance.</li></ul>
      <p>The Distribution and Rights app on this site explains these rights in more detail.</p>` },
    { title: "Quick check", kick: "Before the drills", render: H => Object.keys(F).map(m => { const [q, a, w, y] = F[m][0]; return H.check(q, a, w, y); }).join("") },
  ] };
  const ALL = Object.values(F).flat();
  function make(mode, H) { const [q, a, w, y] = H.rnd(F[mode] || ALL); return H.mc(q, a, w, y); }
  const reference = () => `<ul><li><b>Agree early</b>: roles, final say, schedule, credit and money.</li><li><b>Feedback</b>: where + what + suggestion. Try both versions before arguing.</li><li><b>Files</b>: same sample rate, clear names with versions, stems from the same start.</li><li><b>Business</b>: split sheets, points, work for hire, PRO registration, accurate metadata, sample clearance. Not legal advice.</li></ul>`;
  return { key: "silverapps-collab-v1", lesson, make, reference, modes: [{ id: "roles", kicker: "Roles" }, { id: "comm", kicker: "Communication" }, { id: "proc", kicker: "Process" }, { id: "biz", kicker: "Credit and agreements" }], topics: [] };
})();
