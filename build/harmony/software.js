window.FAM = (() => {
  // ===== About Music Software: digital audio, DAWs, synthesizers and virtual instruments, notation and production software. =====
  const tbl = (cap, head, rows) => `<div class="ltable-wrap" tabindex="0" role="region" aria-label="${cap}"><table class="ltable"><caption>${cap}</caption><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  const F = {
    audio: [
      ["The sample rate of digital audio is…", "how many times per second the sound wave is measured", ["how loud the audio is", "how many bits each sample has", "how many tracks there are"], "CD audio uses 44,100 samples per second (44.1 kHz); video and most production work use 48 kHz."],
      ["The highest frequency a digital system can record is…", "half the sample rate (the Nyquist frequency)", ["the sample rate", "twice the sample rate", "20 Hz"], "At 44.1 kHz that's 22,050 Hz, just above the limit of human hearing."],
      ["Bit depth sets…", "how precisely each sample's level is stored, and so the dynamic range", ["the highest pitch", "the tempo", "the number of channels"], "Each bit adds about 6 dB: 16-bit ≈ 96 dB, 24-bit ≈ 144 dB in theory."],
      ["WAV and AIFF files are usually…", "uncompressed", ["lossy, like MP3", "MIDI files", "video files"], "FLAC and ALAC are lossless compressed; MP3, AAC and Ogg Vorbis are lossy."],
      ["A lossy format such as MP3 or AAC makes files smaller by…", "discarding detail that listeners are less likely to notice", ["lowering the pitch", "removing the drums", "storing only MIDI"], "Good for streaming and portable listening; keep lossless masters for production."],
      ["Latency in a recording setup is…", "the delay between a sound going in and coming back out", ["the length of a song", "a kind of distortion", "the tempo of the click"], "Smaller audio buffers lower the latency but work the computer harder."],
      ["Clipping happens when…", "a digital signal goes above 0 dBFS, the loudest level the system can store", ["the volume is too low", "the sample rate is too high", "a MIDI note is too long"], "The waveform's peaks are flattened and it distorts. Leave headroom when recording."],
      ["An audio interface…", "converts between analog sound (mics, speakers) and digital audio for the computer", ["is a kind of synthesizer", "prints sheet music", "is a streaming service"], "It contains the analog-to-digital and digital-to-analog converters, mic preamps and headphone outputs."],
      ["MIDI carries…", "performance instructions (which note, how hard, when), not sound", ["recorded audio", "MP3 files", "sheet music images"], "A synthesizer or sampler turns MIDI into sound."],
      ["MIDI note velocity runs from…", "0 to 127", ["0 to 100", "1 to 16", "0 to 255"], "Velocity usually controls loudness and brightness. MIDI 1.0 has 16 channels."],
    ],
    daw: [
      ["DAW stands for…", "digital audio workstation", ["digital audio waveform", "direct audio wiring", "dynamic audio window"], "Software for recording, editing, arranging and mixing audio and MIDI."],
      ["Editing in a DAW is usually non-destructive, meaning…", "the original recordings aren't changed; edits can be undone or adjusted", ["edits permanently overwrite the files", "you can't cut audio", "only MIDI can be edited"], "Clips point to the audio files; trimming, fades and moves can be revised later."],
      ["An insert effect on a track…", "processes that track's whole signal (e.g. EQ, compression)", ["is shared by many tracks", "records new audio", "changes the tempo"], "Insert effects are in the signal chain; effects like reverb are often put on a shared bus and fed with sends."],
      ["A send…", "routes a copy of a track's signal to a bus, often with a shared reverb or delay", ["deletes the track", "exports the song", "quantizes MIDI"], "Several tracks can share one reverb, which saves processing and glues the mix together."],
      ["Automation in a DAW…", "records changes to settings (volume, pan, effect levels) over time", ["writes the melody", "adds a click track", "converts audio to MIDI"], "Drawn as lines or curves on a track's lane."],
      ["Quantizing MIDI notes…", "moves them toward the nearest grid position", ["changes their pitch", "makes them louder", "turns them into audio"], "Partial quantize or swing settings keep some human feel."],
      ["The piano roll shows…", "MIDI notes as bars on a grid of pitch against time", ["audio waveforms", "the mixer", "a printed score"], "Bar length = duration; vertical position = pitch."],
      ["Common plug-in formats are…", "VST3, AU and AAX", ["MP3, WAV and AIFF", "PDF, PNG and SVG", "MIDI, OSC and DMX"], "AU is Apple's; AAX is for Pro Tools; VST3 works in most DAWs."],
      ["'Bouncing' a mix means…", "rendering the tracks and effects into a single audio file", ["deleting the project", "speeding it up", "printing the score"], "Also called exporting or mixdown."],
      ["Which DAW layout is built around launching loops and clips in real time?", "a clip (session) view, as in Ableton Live or Bitwig", ["a notation view", "a cue sheet", "a tape machine"], "Most DAWs also have a linear timeline (arrangement) view."],
    ],
    synth: [
      ["In subtractive synthesis, the filter…", "removes some overtones from a bright oscillator wave", ["adds new notes", "changes the tempo", "records audio"], "A low-pass filter's cutoff sets how bright the sound is; resonance boosts the area near the cutoff."],
      ["ADSR stands for…", "attack, decay, sustain, release", ["audio, delay, sample, rate", "amplitude, distortion, sine, reverb", "attack, delay, sweep, reverse"], "An envelope shapes a sound over time from key-down to after key-up."],
      ["An LFO (low-frequency oscillator) is used to…", "move another setting slowly and repeatedly, e.g. vibrato or a filter wobble", ["make the bass notes", "record vocals", "set the sample rate"], "It runs below the audible range, typically under 20 Hz."],
      ["A sawtooth wave is…", "bright, containing all the harmonics", ["pure, with no harmonics", "only odd harmonics", "silent"], "Square waves have odd harmonics; sine waves have none."],
      ["FM synthesis makes tones by…", "using one oscillator to vary another's frequency very fast", ["filtering noise", "playing back recordings", "layering drum loops"], "Known for bells, metallic tones and electric pianos."],
      ["A sampler or sample library…", "plays recordings of real sounds, mapped across the keyboard", ["synthesizes sine waves only", "prints parts", "measures loudness"], "Orchestral libraries record each instrument at several dynamics and articulations."],
      ["Polyphony on a synthesizer means…", "how many notes it can play at once", ["how loud it is", "how many presets it has", "its tuning system"], "A monophonic synth plays one note at a time."],
      ["Wavetable synthesis…", "moves through a series of stored single-cycle waveforms", ["only uses sine waves", "needs a microphone", "is the same as sampling a whole song"], "Sweeping the wavetable position changes the timbre over time."],
      ["A virtual instrument is…", "software that makes sound inside the DAW from MIDI", ["a hardware keyboard", "an audio interface", "a microphone model"], "Also called a soft synth or instrument plug-in."],
    ],
    nota: [
      ["MusicXML is used to…", "exchange notated music between notation programs", ["compress audio", "control lights", "stream music"], "Most notation software can import and export it."],
      ["A free, open-source notation program is…", "MuseScore", ["Pro Tools", "Logic Pro", "Auto-Tune"], "Dorico and Sibelius are commercial; LilyPond is a free text-based engraver."],
      ["Step-time entry in notation software means…", "choosing a duration, then entering pitches one at a time", ["recording while a click plays", "singing into a microphone", "scanning paper music"], "Real-time entry records from a MIDI keyboard and needs cleanup."],
      ["Why do notation programs generate parts automatically?", "each player's part comes from the same score data, so changes stay consistent", ["parts are printed in the DAW", "parts are always handwritten", "to save audio space"], "Part layouts still need checking for page turns, cues and multi-bar rests."],
      ["Playback from notation software is…", "a useful check, but no substitute for real players' judgment", ["exactly how an orchestra will sound", "required for printing", "always in perfect balance"], "Libraries can make impossible or badly balanced writing sound fine."],
      ["Pitch-correction software such as Auto-Tune or Melodyne…", "adjusts the pitch of recorded audio, subtly or as an obvious effect", ["writes notation", "adds reverb", "converts MP3 to WAV"], "Fast retune settings give the well-known robotic effect."],
      ["A DAW known as a standard in professional recording studios is…", "Pro Tools", ["MuseScore", "Dorico", "Finale"], "Logic Pro, Ableton Live, Cubase, FL Studio, Studio One and Reaper are also widely used."],
      ["FL Studio became especially popular with…", "beat makers, for its pattern-based step sequencer", ["orchestral engravers", "church organists", "radio announcers"], "Many hip-hop and electronic producers started on it."],
    ],
  };
  const pick = (H, a) => H.rnd(a);
  const GEN = {
    audio: H => {
      const r = Math.random();
      if (r < .4) { const sr = pick(H, [22050, 32000, 44100, 48000, 88200, 96000]), ny = sr / 2; return H.mc(`At a sample rate of ${sr.toLocaleString("en-US")} Hz, what is the highest frequency that can be recorded?`, `${ny.toLocaleString("en-US")} Hz`, [sr, sr * 2, sr / 4, 20000].map(x => `${x.toLocaleString("en-US")} Hz`), `The Nyquist frequency is half the sample rate.`); }
      if (r < .7) { const buf = pick(H, [64, 128, 256, 512, 1024]), sr = pick(H, [44100, 48000]), ms = (buf / sr * 1000).toFixed(1); return H.mc(`A buffer of ${buf} samples at ${sr / 1000} kHz adds about how much delay?`, `${ms} ms`, [(buf / sr * 2000).toFixed(1), (buf / sr * 500).toFixed(1), (buf / 1000).toFixed(1), (buf / 10).toFixed(1)].map(x => `${x} ms`), `${buf} ÷ ${sr} = ${ms} thousandths of a second (each direction adds its own buffer).`); }
      const bits = pick(H, [8, 16, 20, 24]), db = bits * 6; return H.mc(`About how much dynamic range does ${bits}-bit audio have?`, `${db} dB`, [bits * 3, bits * 12, bits * 6 + 20, 120].filter(x => x !== db).map(x => `${x} dB`), `Each bit adds about 6 dB: ${bits} × 6 ≈ ${db} dB.`);
    },
    synth: H => {
      const names = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"], n = 36 + Math.floor(Math.random() * 48), nm = names[n % 12] + (Math.floor(n / 12) - 1);
      return H.mc(`Middle C (C4) is MIDI note 60. What MIDI note number is ${nm}?`, String(n), [n + 1, n - 1, n + 12, n - 12].map(String), `One number per semitone: ${nm} is ${n - 60 >= 0 ? n - 60 + " above" : 60 - n + " below"} C4, so ${n}.`);
    },
  };
  const lesson = { steps: [
    { title: "Sound becomes numbers", kick: "Sampling", render: () => `<p>A microphone turns air-pressure waves into a changing voltage. An <b>analog-to-digital converter</b> (in an audio interface) measures that voltage thousands of times per second and stores each measurement as a number. Playing back reverses the process.</p>
      <ul><li><b>Sample rate</b>: measurements per second. 44.1 kHz (CD), 48 kHz (video and most production), 96 kHz (some high-resolution work). A system can capture frequencies up to half its sample rate, the <b>Nyquist frequency</b>; higher frequencies must be filtered out first or they fold back as false tones (<b>aliasing</b>).</li>
      <li><b>Bit depth</b>: how finely each measurement is stored. Each bit adds about 6 dB of dynamic range: 16-bit (CD) ≈ 96 dB, 24-bit (recording) ≈ 144 dB in theory.</li>
      <li><b>dBFS</b> (decibels relative to full scale): 0 dBFS is the loudest possible level. Anything above <b>clips</b>, so leave headroom when recording.</li></ul>
      ${tbl("Common audio formats", ["Kind", "Formats", "Use"], [["Uncompressed", "WAV, AIFF", "recording, editing, masters"], ["Lossless compressed", "FLAC, ALAC", "archiving, hi-fi listening"], ["Lossy compressed", "MP3, AAC, Ogg Vorbis, Opus", "streaming, portable files"]])}` },
    { title: "MIDI", kick: "Instructions, not sound", render: () => `<p><b>MIDI</b> (Musical Instrument Digital Interface, 1983) sends performance data: <i>note on</i> (which key, how hard), <i>note off</i>, and controller messages. It contains no sound; a synthesizer or sampler turns it into sound, so the same MIDI part can be played by a piano, strings or a synth.</p>
      <ul><li>Note numbers 0–127, one per semitone: 60 = middle C (C4), 69 = A4.</li><li>Velocity 0–127; 16 channels per connection.</li><li>Continuous controllers (CC): 1 = mod wheel, 7 = volume, 11 = expression, 64 = sustain pedal.</li><li>MIDI 2.0 (2020) adds higher resolution and two-way communication between devices.</li></ul>
      <p>Because MIDI is just data, it's easy to edit: fix wrong notes, change the tempo or the instrument, quantize the timing, or print it as notation.</p>` },
    { title: "The digital audio workstation", kick: "Tracks, clips and the mixer", render: () => `<p>A <b>DAW</b> combines a multitrack recorder, an editor, a MIDI sequencer and a mixing desk.</p>
      <ul><li><b>Tracks:</b> audio tracks hold recordings; instrument (MIDI) tracks play virtual instruments; <b>buses</b> (aux tracks) combine or process groups of tracks.</li>
      <li><b>Clips (regions):</b> pieces of audio or MIDI on the timeline. Editing is <b>non-destructive</b>: trimming, moving and fading don't change the original files.</li>
      <li><b>Mixer:</b> each channel has level, pan, <b>inserts</b> (effects in the channel's path, such as EQ and compression) and <b>sends</b> (copies of the signal to a shared bus, often with reverb or delay).</li>
      <li><b>Automation:</b> recorded or drawn changes over time to any setting.</li>
      <li><b>Views:</b> a linear arrangement timeline; a piano roll for MIDI; in some DAWs a clip or session grid for launching loops live.</li>
      <li><b>Plug-ins</b> add instruments and effects: VST3 (most DAWs), AU (Apple), AAX (Pro Tools).</li></ul>
      ${tbl("Some widely used DAWs", ["DAW", "Known for"], [["Pro Tools", "professional studio recording and editing; film and TV post-production"], ["Logic Pro", "Mac songwriting and production with many built-in instruments"], ["Ableton Live", "clip-based composing and live performance"], ["FL Studio", "pattern-based beat making"], ["Cubase, Studio One, Reaper, Bitwig, GarageBand", "general production; Reaper is inexpensive and very customizable; GarageBand is free on Apple devices"]])}` },
    { title: "Synthesizers and virtual instruments", kick: "Making sound from scratch", render: () => `<p>A synthesizer generates sound electronically. The classic <b>subtractive</b> design chains a few modules:</p>
      <ul><li><b>Oscillators</b> make the raw tone (sine, triangle, square, sawtooth, noise) at a pitch set by the keyboard.</li>
      <li>A <b>filter</b> removes some overtones. Low-pass <b>cutoff</b> = brightness; <b>resonance</b> emphasizes the cutoff region.</li>
      <li>An <b>amplifier</b> shaped by an <b>envelope</b>: <b>ADSR</b> (attack, decay, sustain level, release).</li>
      <li><b>LFOs</b> (slow oscillators) move other settings repeatedly: vibrato, tremolo, filter wobble.</li></ul>
      <p>Other methods: <b>FM</b> (one oscillator modulates another's frequency: bells, electric pianos), <b>wavetable</b> (sweeping through stored waveforms), <b>granular</b> (clouds of tiny sound grains), <b>physical modeling</b> (simulating a vibrating string or tube), and <b>sampling</b> (playing back recordings). Modular synthesizers let the user patch modules together freely.</p>
      <p>A <b>virtual instrument</b> (soft synth) runs inside the DAW. Orchestral <b>sample libraries</b> record each instrument at many pitches, dynamics and articulations (legato, staccato, pizzicato…), switched with <b>keyswitches</b> or controllers.</p>` },
    { title: "Notation software", kick: "Scores and parts", render: () => `<p>Notation programs produce printed or digital scores and parts. Widely used ones include <b>Dorico</b>, <b>Sibelius</b> and <b>MuseScore</b> (free and open source), the text-based engraver <b>LilyPond</b>, and browser-based editors such as Noteflight and Flat. Finale, long an industry standard, was discontinued by its publisher in 2024.</p>
      <ul><li><b>Input:</b> step-time (choose a duration, enter pitches from the computer or a MIDI keyboard), real-time (play along to a click, then clean up), or importing MIDI or MusicXML.</li>
      <li><b>Parts</b> are generated from the score, so edits stay consistent; check page turns, cues and multi-bar rests.</li>
      <li><b>Playback</b> with sample libraries is a good proof-listening tool, but balance and playability still need a musician's judgment.</li>
      <li><b>MusicXML</b> moves notation between programs; <b>MIDI</b> moves performance data between notation software and DAWs.</li></ul>` },
    { title: "Production tools", kick: "From recording to release", render: () => `<p>Production software covers everything between an idea and a finished master:</p>
      <ul><li><b>Recording</b>: interface, microphones, monitoring with low latency.</li>
      <li><b>Editing</b>: comping the best takes, timing correction, pitch correction (Auto-Tune, Melodyne), noise reduction.</li>
      <li><b>Mixing</b>: EQ (tone), compression (controlling dynamics), reverb and delay (space), panning, automation.</li>
      <li><b>Mastering</b>: final EQ, compression and limiting for a consistent, competitive level, and preparing files for release.</li></ul>
      <p>The Pop Production and Film and Game Scoring apps on this site go further into how these tools are used.</p>` },
    { title: "Quick check", kick: "Before the drills", render: H => Object.keys(F).map(m => { const [q, a, w, y] = F[m][0]; return H.check(q, a, w, y); }).join("") },
  ] };
  const ALL = Object.values(F).flat();
  function make(mode, H) { if (GEN[mode] && Math.random() < .4) return GEN[mode](H); const [q, a, w, y] = H.rnd(F[mode] || ALL); return H.mc(q, a, w, y); }
  const reference = () => `<ul><li><b>Sample rate</b> ÷ 2 = highest recordable frequency. 44.1 kHz (CD), 48 kHz (video).</li><li><b>Bit depth</b>: ≈ 6 dB per bit (16-bit ≈ 96 dB). 0 dBFS = maximum; above it clips.</li><li><b>Formats</b>: WAV/AIFF uncompressed; FLAC/ALAC lossless; MP3/AAC lossy.</li><li><b>MIDI</b>: data, not sound. Notes and velocity 0–127, 60 = C4, 16 channels, CC1 mod, CC7 volume, CC64 sustain.</li><li><b>DAW</b>: tracks, clips, buses, inserts vs sends, automation, piano roll, plug-ins (VST3, AU, AAX).</li><li><b>Synth</b>: oscillator → filter → amplifier, ADSR envelope, LFO. Also FM, wavetable, granular, sampling.</li><li><b>Notation</b>: Dorico, Sibelius, MuseScore, LilyPond; MusicXML for exchange.</li></ul>`;
  return { key: "silverapps-software-v1", lesson, make, reference, modes: [{ id: "audio", kicker: "Digital audio" }, { id: "daw", kicker: "The DAW" }, { id: "synth", kicker: "Synths and MIDI" }, { id: "nota", kicker: "Notation and production software" }], topics: [] };
})();
