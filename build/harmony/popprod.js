window.FAM = (() => {
  // ===== How popular music is produced: roles, stages, tools and workflows. =====
  const tbl = (cap, head, rows) => `<div class="ltable-wrap" tabindex="0" role="region" aria-label="${cap}"><table class="ltable"><caption>${cap}</caption><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  const F = {
    roles: [
      ["A record producer is mainly responsible for…", "guiding the recording creatively (and often practically) from song to finished track", ["printing the album covers", "only setting microphone levels", "booking concert tours"], "Producers shape arrangement, sound and performances, and often manage budget and schedule."],
      ["A recording engineer…", "captures the sound: microphones, levels, signal flow and the session", ["writes the lyrics", "promotes the record", "owns the label"], "Many producers also engineer, especially in home studios."],
      ["A mix engineer…", "balances and processes all the tracks into a finished stereo (or immersive) mix", ["records the drums only", "writes the chord progression", "masters vinyl only"], "EQ, compression, effects, panning and automation."],
      ["A mastering engineer…", "prepares the final mix for release: overall tone, level and consistency across tracks", ["records vocals", "writes the hook", "chooses the band name"], "Mastering is a fresh, final set of ears."],
      ["An artist-producer is someone who…", "writes, performs and produces their own music", ["only produces other artists", "only performs live", "only masters records"], "Affordable home studios made this very common."],
      ["Session musicians are…", "players hired to record parts, often quickly and in many styles", ["the band's managers", "mastering engineers", "lyricists"], "They usually receive a fee rather than royalties."],
      ["A&R (artists and repertoire) staff at a label…", "find artists and help choose songs, producers and collaborators", ["mix the records", "build microphones", "print sheet music"], "They connect artists with the people and songs a project needs."],
    ],
    stages: [
      ["Pre-production is when…", "the song, arrangement, tempo and key are settled, often with a demo, before recording", ["the record is mastered", "the album is released", "concerts are booked"], "Decisions made here save expensive studio time."],
      ["Tracking means…", "recording the parts", ["mixing", "mastering", "publishing"], "Often rhythm section first, then overdubs and vocals; or programmed parts first in electronic production."],
      ["Comping a vocal means…", "combining the best parts of several takes into one performance", ["compressing it heavily", "deleting all takes", "recording one take only"], "Short for compiling."],
      ["Which order is standard?", "write → pre-produce → track → edit → mix → master → release", ["master → mix → track", "release → mix → write", "mix → write → master"], "Many home productions blur the stages, but each job still happens."],
      ["Streaming services commonly normalize loudness, so…", "extreme loudness gains little; dynamics and clarity still matter", ["louder masters always win", "mastering is unnecessary", "quiet masters are rejected"], "Spotify's reference level is around −14 LUFS; other services are similar."],
      ["An overdub is…", "a new part recorded while listening to existing tracks", ["a mistake in the master", "a type of microphone", "a live concert"], "Most pop records are built from layered overdubs."],
    ],
    tools: [
      ["An EQ (equalizer)…", "boosts or cuts ranges of frequencies", ["changes the tempo", "adds reverb", "records MIDI"], "Used to make room for each instrument and shape tone."],
      ["A compressor…", "reduces the level of signals above a threshold, evening out dynamics", ["raises the pitch", "adds echoes", "removes the drums"], "Ratio, threshold, attack and release set how strongly and quickly it acts."],
      ["Sidechain compression on a bass or synth pad triggered by the kick drum…", "ducks the pad each time the kick hits, creating a pumping effect", ["makes the kick quieter", "tunes the bass", "adds reverb to the kick"], "A hallmark of much electronic dance music, and a way to make the kick and bass fit."],
      ["Reverb simulates…", "the reflections of a room or hall", ["pitch correction", "a drum machine", "stereo panning"], "Delay produces distinct echoes; both give space and depth."],
      ["The '808' sound in hip-hop and pop refers to…", "the deep, tuned bass drum of a classic drum machine", ["a guitar effect", "a vocal technique", "a type of microphone"], "Often tuned to the song's key and used as the bass line."],
      ["Double-tracking a vocal…", "records the same part twice and layers it for a thicker sound", ["deletes the vocal", "speeds it up", "plays it backwards"], "Producers also stack harmonies and ad-libs."],
      ["Pitch-correction plug-ins are used…", "subtly to fix notes, or obviously as a stylistic vocal effect", ["only on drums", "only in classical music", "to add reverb"], "Fast retune settings give the well-known robotic sound."],
    ],
    flows: [
      ["In a 'track and topline' workflow…", "a producer makes an instrumental track and a topliner writes the melody and lyrics", ["the band records live with no overdubs", "an orchestra plays from a full score", "the artist writes everything alone"], "Common in pop, K-pop, hip-hop and electronic music."],
      ["A songwriting camp is…", "a gathering where many writers and producers co-write in small groups for an artist or label", ["a summer music school", "a mixing seminar", "a recording studio's lounge"], "Teams rotate and write many songs in a few days."],
      ["Sample-based production (common in hip-hop) builds tracks from…", "pieces of existing recordings, chopped, looped and layered", ["only live orchestras", "notation software", "silence"], "Samples must be cleared with the rights owners before release."],
      ["Recording a band 'live in the room' means…", "the musicians play together at the same time, with few overdubs", ["recording at a concert only", "using only MIDI", "recording each instrument on a separate day"], "Captures interaction and feel, but mistakes are harder to fix."],
      ["Many current hits are produced largely in…", "a DAW, often in home or project studios", ["only large analog studios", "notation software", "radio stations"], "Professional studios remain important for tracking, mixing and mastering."],
      ["The arrangement in pop production includes…", "which parts play when: builds, drops, breakdowns and where sounds enter and leave", ["only the key signature", "only the lyrics", "only the album cover"], "Arrangement keeps energy changing across the song."],
    ],
  };
  const GEN = {
    tools: H => {
      if (Math.random() < .5) { const th = H.rnd([-24, -20, -18, -12]), ratio = H.rnd([2, 3, 4, 6]), over = H.rnd([6, 12, 18]), inp = th + over, out = th + over / ratio;
        return H.mc(`A compressor's threshold is ${th} dB and its ratio is ${ratio}:1. A signal peaks at ${inp} dB. Where does it come out (before makeup gain)?`, `${+out.toFixed(1)} dB`, [inp, th, th + over / 2, inp - ratio].filter(x => x !== out).map(x => `${+x.toFixed(1)} dB`), `It's ${over} dB over the threshold; at ${ratio}:1 that becomes ${+(over / ratio).toFixed(1)} dB over: ${th} + ${+(over / ratio).toFixed(1)} = ${+out.toFixed(1)} dB.`); }
      const bpm = H.rnd([80, 90, 100, 120, 125, 128, 140]), q = 60000 / bpm, kinds = [["a quarter note", 1], ["an eighth note", .5], ["a dotted eighth", .75], ["a half note", 2]], [nm, f] = H.rnd(kinds), ms = Math.round(q * f);
      return H.mc(`At ${bpm} BPM, how long is a delay timed to ${nm}?`, `${ms} ms`, kinds.filter(k => k[1] !== f).map(k => `${Math.round(q * k[1])} ms`).concat([`${bpm * 2} ms`]), `A quarter note lasts 60,000 ÷ ${bpm} = ${Math.round(q)} ms; ${nm} is ${f} of that.`);
    },
  };
  const lesson = { steps: [
    { title: "From song to record", kick: "The big picture", render: () => `<p>A pop recording is built in stages. In a big-budget project each stage may have its own specialists; in a bedroom studio one person may do them all. Either way, every job still happens.</p>
      ${tbl("Stages of production", ["Stage", "What happens"], [["Songwriting", "melody, lyrics, chords, form"], ["Pre-production", "arrangement, tempo, key, demo, planning the sessions"], ["Tracking", "recording or programming the parts; overdubs; vocals"], ["Editing", "comping takes, timing and pitch correction, cleanup"], ["Mixing", "balance, EQ, compression, effects, panning, automation"], ["Mastering", "final tone and level, consistency, delivery files"], ["Release", "distribution, metadata, promotion"]])}` },
    { title: "Who does what", kick: "Roles", render: () => `<ul><li><b>Artist</b>: the performer whose name is on the record; often a writer too.</li>
      <li><b>Producer</b>: the creative guide of the recording (arrangement, sound, performances), often also managing schedule and budget. Some producers are mainly musicians and arrangers; others are mainly engineers or track makers.</li>
      <li><b>Songwriters and topliners</b>: topliners write melody and lyrics over a producer's track.</li>
      <li><b>Engineers</b>: recording, mixing and mastering engineers.</li>
      <li><b>Session musicians and vocalists</b>: hired specialists.</li>
      <li><b>A&R</b>: label staff who connect artists with songs, producers and collaborators.</li></ul>` },
    { title: "Ways of working", kick: "Individuals and teams", render: () => `<ul><li><b>The artist-producer</b>: one person writes, performs, records and produces at home in a DAW, sometimes handing off only the mix or master.</li>
      <li><b>The band in the studio</b>: a producer and engineer record a band, live in the room or part by part with overdubs.</li>
      <li><b>Track and topline</b>: a producer builds an instrumental; topliners write the vocal melody and lyrics; the artist records the vocal. Common in pop, K-pop, hip-hop and electronic music, and at <b>songwriting camps</b>.</li>
      <li><b>Sample-based</b>: tracks built from chopped and looped recordings (hip-hop, electronic). Samples need clearance.</li>
      <li><b>Remote collaboration</b>: files and stems passed between studios around the world.</li></ul>` },
    { title: "Arrangement and sound", kick: "Keeping the energy moving", render: () => `<ul><li><b>Builds and drops</b>: adding layers, rising sounds and drum fills toward a chorus or drop, then a sudden change.</li>
      <li><b>Breakdowns</b>: stripping back to a few elements to reset the energy.</li>
      <li><b>Frequency space</b>: each part gets its own range; kick and bass are made to fit together (often with EQ and sidechain compression).</li>
      <li><b>Vocal production</b>: comped lead, doubles, harmonies, ad-libs, and effects; the vocal is usually the center of the mix.</li>
      <li><b>Signature sounds</b>: tuned 808 bass drums, distinctive synths, drum samples and vocal effects often define a genre or era.</li></ul>` },
    { title: "Mixing and mastering tools", kick: "Shaping the sound", render: () => `${tbl("Key tools", ["Tool", "What it does"], [["EQ", "boosts or cuts frequency ranges"], ["Compressor", "reduces level above a threshold by a ratio; attack and release set the speed"], ["Sidechain", "one track's level controls processing on another (e.g. the kick ducks the bass)"], ["Reverb / delay", "space and echoes, often timed to the tempo"], ["Saturation", "gentle distortion for warmth and presence"], ["Pitch correction", "subtle tuning or an obvious effect"], ["Limiter", "a very fast compressor that sets the final peak level in mastering"]])}
      <p>Streaming services normalize loudness (Spotify's reference is around −14 LUFS), so a master pushed very loud mainly loses dynamics. Many engineers aim for clarity and punch rather than maximum level.</p>` },
    { title: "Quick check", kick: "Before the drills", render: H => Object.keys(F).map(m => { const [q, a, w, y] = F[m][0]; return H.check(q, a, w, y); }).join("") },
  ] };
  const ALL = Object.values(F).flat();
  function make(mode, H) { if (GEN[mode] && Math.random() < .4) return GEN[mode](H); const [q, a, w, y] = H.rnd(F[mode] || ALL); return H.mc(q, a, w, y); }
  const reference = () => `<ul><li><b>Stages</b>: write → pre-produce → track → edit → mix → master → release.</li><li><b>Roles</b>: artist, producer, songwriters and topliners, recording/mix/mastering engineers, session musicians, A&R.</li><li><b>Workflows</b>: artist-producer, band in the studio, track and topline, songwriting camps, sample-based, remote.</li><li><b>Tools</b>: EQ, compression (threshold, ratio, attack, release), sidechain, reverb and delay, saturation, pitch correction, limiting.</li><li><b>Delay times</b>: quarter note = 60,000 ÷ BPM ms.</li></ul>`;
  return { key: "silverapps-popprod-v1", lesson, make, reference, modes: [{ id: "roles", kicker: "Roles" }, { id: "stages", kicker: "Stages" }, { id: "tools", kicker: "Tools" }, { id: "flows", kicker: "Ways of working" }], topics: [] };
})();
