window.FAM = (() => {
  // ===== Scoring for film, TV and video games. =====
  const tbl = (cap, head, rows) => `<div class="ltable-wrap" tabindex="0" role="region" aria-label="${cap}"><table class="ltable"><caption>${cap}</caption><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  const F = {
    film: [
      ["A spotting session is when…", "the director and composer decide where music starts and stops and what it should do", ["the orchestra records", "the film is color-graded", "the music is mastered"], "The result is a list of cues with timings and notes."],
      ["Diegetic (source) music is…", "music the characters can hear, such as a radio or a band in the scene", ["the orchestral underscore", "music only in the trailer", "music played during the credits only"], "Non-diegetic music (underscore) is heard only by the audience."],
      ["A leitmotif is…", "a recurring musical idea associated with a character, place or idea", ["a sound effect", "a type of microphone", "the end credits song"], "Wagner developed the technique in opera; film composers use it widely."],
      ["Mickey-Mousing is…", "music that imitates every on-screen action closely", ["music with no rhythm", "silence under dialogue", "a type of credit roll"], "Named after early animated cartoons; used sparingly in live-action films."],
      ["A temp track is…", "existing music placed in an edit before the score is written", ["the final score", "a click track", "a timecode format"], "Directors can grow attached to it ('temp love'), which the composer then has to work with."],
      ["Underscore beneath dialogue usually…", "stays out of the voices' frequency range and avoids busy melody", ["is the loudest element", "uses only high trumpets", "doubles the actors' words"], "Low strings, pads and sparse textures leave room for speech."],
      ["Cues are often labeled like 3M2, meaning…", "reel 3, music cue 2", ["3 minutes 2 seconds", "the 3rd measure, 2nd beat", "3 musicians, 2 parts"], "The convention comes from film reels."],
    ],
    sync: [
      ["SMPTE timecode is written as…", "hours:minutes:seconds:frames", ["bars:beats:ticks", "minutes:seconds only", "reel:cue"], "It locks music to picture frame by frame."],
      ["The standard frame rate for film is…", "24 frames per second (often 23.976 in video work)", ["60", "12", "100"], "25 fps is used in PAL regions, 29.97 fps in NTSC television."],
      ["A hit point is…", "a moment in the picture the music should land on exactly", ["the loudest note", "the composer's fee", "the first bar"], "Cuts, impacts, entrances and reveals are common hit points."],
      ["Streamers and punches are…", "visual cues on screen that show a conductor when a hit is coming", ["types of percussion", "orchestral seating", "recording microphones"], "A streamer is a line moving across the screen; a punch is a flash at the moment."],
      ["Why do composers adjust tempo to fit a scene?", "so hit points fall on strong beats or bar lines", ["tempos must be multiples of 10", "picture can't be edited", "orchestras can't play at other tempos"], "Variable tempo maps or free-timed sections also help."],
      ["The final film mix balancing dialogue, effects and music is done by…", "the re-recording (dubbing) mixer", ["the orchestrator", "the music supervisor", "the copyist"], "Music may be turned down under dialogue, so compose with that in mind."],
    ],
    game: [
      ["Adaptive (interactive) game music…", "changes in response to what the player does", ["plays the same way every time", "is only used in menus", "has no loops"], "Combat, exploration, danger and success can each change the music."],
      ["Horizontal re-sequencing switches between…", "musical segments, at musically sensible points", ["instruments within one segment", "speakers in the room", "frame rates"], "E.g. moving from an exploration section to a combat section at the next bar line."],
      ["Vertical layering (remixing) changes the music by…", "adding or removing simultaneous layers (stems) as intensity changes", ["changing the key every bar", "playing it backwards", "removing all percussion"], "Layers are written to work in any combination."],
      ["A stinger in game music is…", "a short musical phrase triggered by an event", ["a long ambient loop", "a menu option", "a type of drum stick"], "Picking up an item, finding a secret, defeat or victory."],
      ["Game audio middleware such as FMOD and Wwise…", "lets composers and sound designers set how music and sound respond to the game", ["is a notation program", "is a microphone brand", "records orchestras"], "Designers connect game parameters (like danger level) to music behavior."],
      ["A loop in game music must…", "end so that it flows seamlessly back to its beginning", ["fade out", "end with a final cadence", "change key every time"], "Reverb tails and pickup notes need care at the loop point."],
    ],
    team: [
      ["A music supervisor…", "chooses and licenses existing songs for a film, show or game", ["conducts the orchestra", "writes the cue sheet only", "mixes dialogue"], "They work closely with the director and composer."],
      ["An orchestrator on a film score…", "turns the composer's sketches or MIDI mock-ups into full orchestral scores", ["chooses licensed songs", "edits picture", "writes the script"], "Often working under extreme time pressure."],
      ["A music editor…", "manages the music in the edit: syncing, temp tracks, conforming cues to picture changes", ["writes melodies", "plays in the orchestra", "designs costumes"], "They keep the score fitting as the edit keeps changing."],
      ["A cue sheet lists…", "every piece of music used, with timings, writers and publishers", ["the orchestra's seating", "the actors' lines", "the frame rate"], "It's how performance royalties are paid for media music."],
      ["MIDI mock-ups for directors are…", "realistic demos of the score made with sample libraries, before recording", ["final recordings in all cases", "sheet music", "storyboards"], "Many projects now release the mock-up itself or a hybrid with live players."],
    ],
  };
  const GEN = {
    sync: H => {
      const r = Math.random();
      if (r < .4) { const beats = H.rnd([8, 12, 16, 24, 32]), bpm = H.rnd([72, 80, 90, 96, 100, 120, 144]), sec = beats * 60 / bpm; if (Math.abs(sec - Math.round(sec * 10) / 10) > 1e-9) return GEN.sync(H);
        return H.mc(`A hit point comes ${sec} seconds after the cue starts. You want it exactly ${beats} beats in. What tempo do you need?`, `${bpm} BPM`, [bpm - 6, bpm + 6, bpm * 2, Math.round(bpm / 2), bpm + 12].map(x => `${x} BPM`), `${beats} beats in ${sec} s: ${beats} × 60 ÷ ${sec} = ${bpm} BPM.`); }
      if (r < .7) { const fps = H.rnd([24, 25, 30]), bpm = H.rnd([60, 72, 90, 100, 120, 150]), f = fps * 60 / bpm; if (f !== Math.round(f * 10) / 10) return GEN.sync(H);
        return H.mc(`At ${fps} frames per second and ${bpm} BPM, how many frames does one beat last?`, `${f} frames`, [f * 2, f / 2, fps, f + 2].map(x => `${+x.toFixed(1)} frames`), `One beat = 60 ÷ ${bpm} = ${+(60 / bpm).toFixed(3)} s; × ${fps} = ${f} frames.`); }
      const fps = H.rnd([24, 25]), s = H.rnd([1.5, 2, 2.5, 4, 6.5, 10]), fr = s * fps;
      return H.mc(`How many frames are in ${s} seconds at ${fps} fps?`, String(fr), [fr + fps, fr - fps, s * 30, s * 60].filter(x => x > 0).map(String), `${s} × ${fps} = ${fr} frames.`);
    },
  };
  const lesson = { steps: [
    { title: "What film music does", kick: "Functions", render: () => `<ul><li><b>Emotion</b>: telling the audience how to feel, or what a character feels but doesn't say.</li><li><b>Place and time</b>: instruments, styles and scales that suggest a setting.</li><li><b>Continuity</b>: smoothing cuts and montages, carrying us across scenes.</li><li><b>Pacing and tension</b>: building suspense, releasing it, marking climaxes.</li><li><b>Identity</b>: <b>leitmotifs</b>, recurring themes for characters, places or ideas, developed as the story changes. (Wagner developed the technique in opera.)</li><li><b>Irony</b>: music that contrasts with the image can comment on it.</li></ul>
      <p><b>Diegetic</b> (source) music exists in the story world (a car radio, a band on stage); <b>non-diegetic</b> music (underscore) is heard only by the audience. Moving music between the two is a classic storytelling device.</p>` },
    { title: "The film scoring process", kick: "From spotting to the final mix", render: () => `${tbl("Typical steps", ["Step", "What happens"], [["Temp track", "the editor places existing music to shape the edit"], ["Spotting", "director and composer decide where cues start and stop and what they do"], ["Writing and mock-ups", "the composer writes to picture and makes MIDI demos for approval"], ["Revisions", "notes from the director; the edit may keep changing"], ["Orchestration and copying", "scores and parts prepared from the composer's sketches"], ["Recording", "musicians record to picture with click, streamers and punches"], ["Mixing and dubbing", "music mixed into stems, then balanced with dialogue and effects"], ["Cue sheet", "every cue listed for royalties"]])}
      <p>Cues are named by reel and number: <b>3M2</b> is reel 3, music cue 2.</p>` },
    { title: "Syncing music to picture", kick: "Timecode, tempo and hits", render: () => `<ul><li><b>Timecode</b> (SMPTE): hours:minutes:seconds:frames. Film runs at 24 fps (23.976 in video), PAL TV 25, NTSC TV 29.97.</li>
      <li><b>Hit points</b>: cuts or actions the music should land on. Composers choose tempos (and meter changes) so hits fall on strong beats: tempo = beats × 60 ÷ seconds.</li>
      <li><b>Click tracks</b> keep players in sync; <b>streamers</b> (moving lines) and <b>punches</b> (flashes) show conductors when hits are coming; some cues are free-timed.</li>
      <li><b>Under dialogue</b>: keep textures sparse and out of the voice range; the mix will lower the music anyway.</li>
      <li><b>Mickey-Mousing</b> (catching every action) suits cartoons and comedy; in drama it's used sparingly.</li></ul>` },
    { title: "Music for games", kick: "Interactive and adaptive", render: () => `<p>A game has no fixed timeline: the player decides when things happen. Game music is therefore built to <b>adapt</b>.</p>
      ${tbl("Adaptive techniques", ["Technique", "How it works"], [["Loops", "sections that repeat seamlessly while the player explores"], ["Horizontal re-sequencing", "switching between segments (explore → combat) at the next bar line or phrase"], ["Vertical layering", "adding or removing stems (percussion, brass…) as intensity changes"], ["Stingers", "short phrases triggered by events: discovery, victory, defeat"], ["Transitions", "short bridges written to move between states smoothly"], ["Generative / procedural", "rules or randomness that recombine material so it never repeats exactly"]])}
      <p>Composers deliver stems and segments, and set their behavior in <b>middleware</b> such as FMOD or Wwise, or in the game engine itself.</p>` },
    { title: "The team", kick: "Who else works on the music", render: () => `<ul><li><b>Director / game designer / audio director</b>: whose vision the music serves.</li><li><b>Music supervisor</b>: chooses and licenses existing songs.</li><li><b>Music editor</b>: syncs, temps and conforms music as the edit changes.</li><li><b>Orchestrators and copyists</b>: turn sketches into scores and parts.</li><li><b>Score mixer</b> and <b>re-recording mixer</b>: mix the music, then balance it with dialogue and effects.</li><li><b>Audio implementers</b> (games): connect music to gameplay.</li></ul>` },
    { title: "Quick check", kick: "Before the drills", render: H => Object.keys(F).map(m => { const [q, a, w, y] = F[m][0]; return H.check(q, a, w, y); }).join("") },
  ] };
  const ALL = Object.values(F).flat();
  function make(mode, H) { if (GEN[mode] && Math.random() < .5) return GEN[mode](H); const [q, a, w, y] = H.rnd(F[mode] || ALL); return H.mc(q, a, w, y); }
  const reference = () => `<ul><li><b>Functions</b>: emotion, place, continuity, pacing, leitmotif, irony. Diegetic vs non-diegetic.</li><li><b>Process</b>: temp → spotting → writing and mock-ups → revisions → orchestration → recording → mixing → cue sheet.</li><li><b>Sync</b>: timecode HH:MM:SS:FF; 24 / 25 / 29.97 fps; tempo = beats × 60 ÷ seconds; frames per beat = fps × 60 ÷ BPM.</li><li><b>Games</b>: loops, horizontal re-sequencing, vertical layering, stingers, transitions, generative; FMOD, Wwise.</li></ul>`;
  return { key: "silverapps-scoring-v1", lesson, make, reference, modes: [{ id: "film", kicker: "Film music" }, { id: "sync", kicker: "Syncing to picture" }, { id: "game", kicker: "Game music" }, { id: "team", kicker: "The team" }], topics: [] };
})();
