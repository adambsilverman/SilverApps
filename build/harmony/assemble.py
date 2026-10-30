"""Assemble the harmony / voice-leading apps into build/src/*.html (then build_trainers.py adds the site look + class game).
Each page = the Modes Trainer's CSS + transposition/extra.css + EXTRA below + a body with a Lesson view and a Drills view
+ VexFlow + <app>.js (content: lesson steps, question makers, reference) + engine.js (shared logic)."""
import pathlib, html
B = pathlib.Path(__file__).resolve().parent; SRC = B.parent / "src"
src = (SRC / "Modes Trainer.html").read_text(encoding="utf-8").split("\n")
HEAD = "\n".join(src[:229]); VEX = "\n".join(src[351:360])
assert HEAD.rstrip().endswith("</style>") and VEX.startswith("<script>")
HEAD = HEAD.replace(".modes button:first-child { grid-column: 1 / -1; }\n", "")
EXTRA = (B.parent / "transposition" / "extra.css").read_text(encoding="utf-8") + (B / "extra.css").read_text(encoding="utf-8")

APPS = [
  dict(src="Reading Pitch.html", drills="reading-pitch.html", lesson="reading-pitch-lesson.html", lesson_title="Understanding Clefs and Pitch Reading", lesson_desc="A step-by-step lesson: the staff, treble and bass clefs, the grand staff, alto and tenor clefs, the history of C clefs and how every clef is a window onto one great staff, memory devices and reading strategies, and how notes and accidentals line up.", data="clefs.js", title="Reading Pitch",
       desc="Name notes in treble, bass, alto and tenor clefs and on the grand staff, find lines and spaces, move a pitch between clefs, and review memory devices and alignment principles.",
       modes=[("name", "Name the note", "letter name", "name a note on the staff"),
              ("octave", "Note + octave", "C4, G2…", "name a note with its octave number"),
              ("where", "Line or space?", "find it", "find where a pitch is written"),
              ("same", "New clef", "same pitch", "find the same pitch in another clef"),
              ("devices", "Devices", "patterns · alignment", "memory devices, clef facts and alignment principles")],
       how=["<b>Treble</b> lines E G B D F, spaces F A C E. <b>Bass</b> lines G B D F A, spaces A C E G.",
            "<b>Alto</b> lines F A C E G (middle C on the middle line). <b>Tenor</b> lines D F A C E (middle C on the 4th line).",
            "<b>Landmarks:</b> G4 (treble clef's curl), F3 (bass clef's dots), middle C (C clef's center).",
            "<b>Alignment:</b> simultaneous notes line up vertically; seconds put the higher note to the right; accidentals sit just before the notehead, highest closest to the chord."]),
  dict(src="Note Values.html", drills="note-values.html", lesson="note-values-lesson.html", lesson_title="Understanding Note Values and Rhythm", lesson_desc="A step-by-step lesson: note values and rests, the parts of a note, dots and ties, simple and compound meter, triplets and other tuplets, counting, and lining rhythms up across staves.", data="notevalues.js", title="Note Values and Rhythm",
       desc="Note and rest values, dots and double dots, value math, completing bars, triplets and duplets, and meter.",
       modes=[("value", "Note values", "how many beats?", "how many beats a note or rest lasts"),
              ("math", "Value math", "equivalents", "how many of one value equal another"),
              ("complete", "Complete the bar", "missing value", "find the value that completes a bar"),
              ("tuplet", "Tuplets", "triplets · duplets", "how long tuplets last"),
              ("meter", "Meter", "simple · compound", "time signatures and beat units"),
              ("terms", "Terms", "names · principles", "note-value terms, British names and principles")],
       how=["Each value is <b>half</b> the one before: whole, half, quarter, eighth, sixteenth.",
            "A <b>dot</b> adds half the value; a second dot adds half of that. Ties join same-pitch notes.",
            "<b>Simple</b> meters divide the beat in two; <b>compound</b> meters (6/8, 9/8, 12/8) in three, with a dotted beat.",
            "<b>Triplet</b>: 3 in the time of 2. <b>Duplet</b>: 2 in the time of 3."]),
  dict(src="Meter.html", drills="meter.html", lesson="meter-lesson.html", lesson_title="Understanding Meter and Beaming", lesson_desc="A step-by-step lesson: beat and meter, simple, compound, asymmetrical and mixed meter, beaming that shows the beat, historical vocal beaming, pick-ups, syncopation and hemiola.", data="meter.js", title="Meter and Beaming",
       desc="Classify meters, find the meter of a rhythm, group asymmetrical meters, choose the clearest beaming, and name pick-ups, syncopation and hemiola.",
       modes=[("classify", "Kinds of meter", "simple · compound", "classify a time signature"),
              ("which", "Find the meter", "from the beaming", "find the meter of a notated rhythm"),
              ("group", "Asymmetrical", "2 + 3 · 3 + 2", "group the beats of asymmetrical meters"),
              ("beam", "Beaming", "show the beat", "choose the clearest beaming"),
              ("device", "Rhythmic devices", "pick-ups · hemiola", "pick-ups, syncopation and hemiola"),
              ("terms", "Terms", "concepts", "meter and beaming terms")],
       how=["<b>Simple</b> meter: the beat divides in two. <b>Compound</b>: the beat is dotted and divides in three (6/8 = 2 beats).",
            "<b>Asymmetrical</b> meters (5/8, 7/8) have unequal beats of 2 and 3. <b>Mixed</b> meter changes time signature.",
            "<b>Beam by beat</b> so the beat is always visible; older vocal music flags each syllable and beams only melismas.",
            "<b>Pick-up</b>: notes before the first downbeat. <b>Syncopation</b>: accents against the beat. <b>Hemiola</b>: three against two."]),
  dict(src="Extended and Altered Chords Lesson.html", lesson_only=True, drills="chord-extension-practicer.html", drills_name="Chord Extensions drills", lesson="extended-and-altered-chords-lesson.html", lesson_title="Understanding Extended and Altered Chords", lesson_desc="A step-by-step lesson: seventh chords, added-tone and sus chords, 9ths, 11ths and 13ths, altered tones, how to write a chord symbol, omissions and N.C., with notated chords to hear.", data="extlesson.js", title="Extended and Altered Chords", desc="", modes=[], how=[]),
  dict(src="Modulation Lesson.html", lesson_only=True, drills="modulation-trainer.html", drills_name="Key Modulation drills", lesson="modulation-lesson.html", lesson_title="Understanding Modulation", lesson_desc="A step-by-step lesson: modulation vs. tonicization, closely related keys, finding and labeling modulations, pivot chords (diatonic, chromatic, enharmonic), common-tone, sequential and chord-quality-shift modulations, direct modulation and turnarounds.", data="modlesson.js", title="Modulation", desc="", modes=[], how=[]),
  dict(src="Rhythm Notation Lesson.html", lesson_only=True, drills="rhythm-notation-trainer.html", drills_name="Rhythm Notation drills", lesson="rhythm-notation-lesson.html", lesson_title="Understanding Rhythm Notation", lesson_desc="A step-by-step lesson: showing the beat, common notation errors, beaming in simple and compound meter, ties and slurs, time signatures and bar lines, rhythm terms from syncopation to metric modulation, and notating lyrics.", data="rhythmlesson.js", title="Rhythm Notation", desc="", modes=[], how=[]),
  dict(src="Forms.html", drills="forms.html", lesson="forms-lesson.html", lesson_title="Understanding Musical Forms", lesson_desc="A step-by-step lesson: binary, rounded binary, ternary, strophic and 32-bar song forms; minuet and trio, rondo, through-composed, theme and variations and contrapuntal forms; sonata form; and the sections of popular songs, with listening examples.", data="forms.js", title="Musical Forms",
       desc="Name forms from their plans and by ear, review sonata form and other large forms, and identify the sections of popular songs.",
       modes=[("scheme", "Name the form", "AB · ABA · AABA…", "name a form from its plan"),
              ("hear", "Hear the form", "listen", "name a form by ear"),
              ("sonata", "Sonata & more", "exposition · development…", "sonata form and other larger forms"),
              ("pop", "Song sections", "verse · chorus · bridge", "sections of popular songs")],
       how=["<b>Binary</b> ||: A :||: B :||; <b>rounded binary</b> ||: A :||: B A′ :||; <b>ternary</b> ABA; <b>strophic</b> AAA; <b>32-bar</b> AABA.",
            "<b>Rondo</b> ABACA(BA); <b>theme and variations</b> A A¹ A²…; <b>through-composed</b> ABCD…",
            "<b>Sonata:</b> (intro) – exposition – development – recapitulation – (coda).",
            "<b>Songs:</b> intro, verse, pre-chorus, chorus, post-chorus, link, bridge, outro."]),
  dict(src="Phrases.html", drills="phrases.html", lesson="phrases-lesson.html", lesson_title="Understanding Phrases and Phrase Combinations", lesson_desc="A step-by-step lesson: what a phrase is, divided and indivisible phrases, the sentence, periods (parallel, contrasting, progressive), phrase groups, three-phrase and double periods, with notated examples.", data="phrases.js", title="Phrases and Phrase Combinations",
       desc="Hear and see two-phrase passages and name how they combine, read phrase diagrams, and review phrase structure terms.",
       modes=[("staff", "On the staff", "periods · phrase groups", "name how two notated phrases combine"),
              ("diagram", "Diagrams", "open · weak · closed", "name a combination from its phrase diagram"),
              ("terms", "Terms", "sentence · period", "phrase structure terms")],
       how=["<b>Phrase:</b> a complete musical thought ending with a cadence; label a, a′, b.",
            "<b>Period:</b> antecedent (open or weak) + consequent (closed); parallel or contrasting, balanced or asymmetrical, possibly progressive.",
            "<b>Phrase group:</b> phrases that belong together without antecedent/consequent (for example, both closed).",
            "<b>Sentence:</b> presentation (idea + repetition) and continuation to a cadence."]),
  dict(src="Motive and Sequence.html", drills="motive-and-sequence.html", lesson="motive-and-sequence-lesson.html", lesson_title="Understanding Motive and Sequence", lesson_desc="A step-by-step lesson: what a motive is and how it's labeled, how motives change (transposition, inversion, retrograde, augmentation, diminution, fragmentation), and tonal, real, modified and modulating sequences, with notated examples in any key.", data="motive.js", title="Motive and Sequence",
       desc="Name how a motive is changed (transposed, inverted, reversed, augmented, fragmented…) and tell tonal, real and modified sequences apart.",
       modes=[("perm", "Motive changes", "permutations", "name how a motive is changed"),
              ("seq", "Sequences", "tonal · real · modified", "name the kind of sequence"),
              ("terms", "Terms", "concepts", "terms for motive and sequence")],
       how=["<b>Motive:</b> a short, distinctive idea, labeled x, y, z.",
            "<b>Transposition:</b> real (exact intervals) or tonal (in the key). <b>Inversion:</b> upside down. <b>Retrograde:</b> backwards.",
            "<b>Augmentation / diminution:</b> longer / shorter values. <b>Fragmentation:</b> part of the motive, developed on its own.",
            "<b>Sequence:</b> a pattern repeated higher or lower; tonal, real, mixed or modified; melodic and/or harmonic."]),
  dict(src="Scales.html", drills="major-and-minor-scales.html", lesson="major-and-minor-scales-lesson.html", lesson_title="Understanding Major and Minor Scales", lesson_desc="A step-by-step lesson: half and whole steps, the major scale, why we use key signatures and how to read them, the circle of fifths, and natural, harmonic and melodic minor and why they differ.", data="scales.js", title="Major and Minor Scales",
       desc="Spell and identify major and minor scales, read key signatures, find relative and parallel keys, and know why each scale and key signature works the way it does.",
       modes=[("spell", "Spell the scale", "major · minor", "spell a major or minor scale"),
              ("type", "Name the scale", "on the staff", "name the kind of scale"),
              ("keysig", "Key signatures", "sharps · flats", "read and recall key signatures"),
              ("relpar", "Relative and parallel", "keys", "relative and parallel keys"),
              ("steps", "Steps", "W · H", "whole and half steps in scales"),
              ("why", "Why it works", "reasons", "why key signatures and minor scales work as they do")],
       how=["<b>Major:</b> W W H W W W H. <b>Natural minor:</b> W H W W H W W.",
            "<b>Harmonic minor</b> raises 7̂ (a leading tone); <b>melodic minor</b> raises 6̂ and 7̂ going up.",
            "<b>Key signatures</b> write a key's sharps or flats once, for every octave: sharps F C G D A E B, flats B E A D G C F.",
            "<b>Relative</b> keys share a key signature (C major, A minor); <b>parallel</b> keys share a tonic (C major, C minor)."]),
  dict(src="Keys and Scale Degrees.html", drills="keys-and-scale-degrees.html", lesson="keys-and-scale-degrees-lesson.html", lesson_title="Understanding Keys, Scale Degrees and Tendency Tones", lesson_desc="A step-by-step lesson: scale-degree names and numbers, the subtonic and leading tone, stable and tendency tones and how they resolve, chromatic tendencies, and how to tell a key from its relative major or minor.", data="keys.js", title="Keys, Scale Degrees and Tendency Tones",
       desc="Name scale degrees and their pitches in any key, resolve tendency tones, and decide whether a passage is in a major key or its relative minor.",
       modes=[("pitch", "Name the pitch", "degree → note", "name the pitch of a scale degree"),
              ("name", "Name the degree", "note → degree", "name the scale degree of a pitch"),
              ("tend", "Tendency tones", "where do they go?", "stable tones and how tendency tones resolve"),
              ("key", "Which key?", "major or relative minor", "decide the key of a passage"),
              ("concepts", "Concepts", "terms", "concepts of keys and tendency tones")],
       how=["<b>Degrees:</b> tonic, supertonic, mediant, subdominant, dominant, submediant, leading tone (raised 7̂) / subtonic (♭7̂ in minor).",
            "<b>Stable tones:</b> 1̂, 3̂, 5̂. <b>Tendencies:</b> 7̂ → 1̂, 4̂ → 3̂, chordal 7ths down, minor 6̂ → 5̂.",
            "<b>Chromatic tones</b> move in the direction of their inflection: raised up, lowered down.",
            "<b>Which key?</b> Check the ending (cadence), the beginning, V–I motion and a raised leading tone."]),
  dict(src="Part-Writing.html", drills="part-writing.html", lesson="part-writing-lesson.html", lesson_title="Understanding Part-Writing", lesson_desc="A step-by-step lesson: melodic principles, spacing and doubling, tendency tones, parallel and direct 5ths and octaves, connecting root-position triads, the five ways to resolve V⁷, V⁷ in inversion and vii°⁷, with four-voice examples in any key.", data="partwriting.js", title="Part-Writing",
       desc="Find the error in four-voice writing, choose doublings, resolve tendency tones, recognize the ways to resolve V⁷, and review the principles.",
       modes=[("error", "Find the error", "parallels · doubling · resolution", "find the part-writing error"),
              ("double", "Doubling", "which note?", "choose which note to double"),
              ("tend", "Tendency tones", "7̂ · 4̂ · 7ths", "resolve tendency tones"),
              ("v7", "Resolving V⁷", "five ways", "recognize how a V7 to I resolution is written"),
              ("princ", "Principles", "rules", "part-writing principles and techniques")],
       how=["<b>Move each voice to the nearest chord tone</b>, favoring contrary motion.",
            "<b>Double</b> the root in root position; not the bass in first inversion; the bass in second inversion. Never double 7̂.",
            "<b>Resolve</b> 7̂ up to 8̂, 4̂ down to 3̂, and chordal 7ths down by step.",
            "<b>Avoid</b> parallel and consecutive P5s and P8s, direct 5ths/8ves in the outer voices, crossing, and gaps over an octave between upper voices."]),
  dict(src="Harmonic Succession.html", drills="harmonic-succession.html", lesson="harmonic-succession-lesson.html", lesson_title="Understanding Harmonic Succession", lesson_desc="A step-by-step lesson: tonic, pre-dominant and dominant functions, the progression chart, the phrase model, circle progressions, retrogressions and chord streams, and how to tell structural chords from embellishing ones, with four-voice examples in any key.", data="harmsucc.js", title="Harmonic Succession",
       desc="Chord functions, progression vs. retrogression, the phrase model, embellishing chords, and circle progressions, retrogressions and chord streams.",
       modes=[("func", "Function", "T · PD · D", "name a chord's function"),
              ("prog", "Progression?", "or retrogression", "decide whether two chords progress or retrogress"),
              ("area", "Phrase model", "which area?", "find the phrase-model area of a highlighted chord"),
              ("embel", "Embellishing", "passing · neighbor · pedal", "name the embellishing chord"),
              ("pattern", "Patterns", "circle · stream · retro", "name the kind of harmonic succession"),
              ("concepts", "Concepts", "terms", "concepts of harmonic succession")],
       how=["<b>Functions:</b> tonic (I), pre-dominant (IV, ii), dominant (V, vii°). T → PD → D → T.",
            "<b>Chart:</b> iii → vi → IV/ii → V/vii° → I; I goes anywhere. Exceptions: IV–I, vi–V.",
            "<b>Retrogression</b> moves backwards (V–IV, ii–vi, ♭VII–IV–I); a <b>chord stream</b> follows a stepwise bass.",
            "<b>Embellishing chords</b> are harmonized non-chord tones: passing, neighbor, arpeggiating, pedal (incl. the cadential ⁶₄)."]),
  dict(src="Cadences.html", drills="cadences.html", lesson="cadences-lesson.html", lesson_title="Understanding Cadences", lesson_desc="A step-by-step lesson: perfect and imperfect authentic, half, plagal, plagal half, deceptive and secondary half cadences, degrees of closure, where cadences fall in the phrase, open cadences ending on other chords (IV, ♭VII, ♭VI, II, iv, Vsus4), elision and turnarounds, with examples to play in any key.", data="cadences.js", title="Cadences",
       desc="Name cadences on the staff and by ear, read them from chord symbols, name open cadences that end on IV, ♭VII, ♭VI and other chords, tell where cadences happen, and judge how open or closed each one sounds.",
       modes=[("staff", "Name it", "PAC · IAC · HC · PC · DC", "name the cadence in a four-voice phrase"),
              ("hear", "Hear it", "listen", "name the cadence by ear"),
              ("symbols", "Lead sheet", "chord symbols", "name the cadence from chord symbols"),
              ("pop", "Open cadences", "IV · ♭VII · ♭VI…", "open cadences ending on chords other than I or V"),
              ("where", "Where cadences happen", "phrase endings", "cadences only at phrase endings, and where they fall in the bar"),
              ("terms", "Closure", "open · weak · closed", "degrees of closure and cadence terms")],
       how=["<b>Authentic:</b> V(⁷)–I. <b>Perfect</b> (PAC) = both root position, tonic in the soprano; otherwise <b>imperfect</b> (IAC).",
            "<b>Half (HC):</b> ends on V. <b>Plagal half (PHC):</b> ends on IV.",
            "<b>Plagal (PC):</b> IV–I. <b>Deceptive (DC):</b> V–vi (a tonic substitute).",
            "<b>Closure:</b> open = half cadences; weak = DC, IAC; closed = PAC, PC.",
            "<b>Only at phrase endings:</b> a V–I inside a phrase isn't a cadence. Besides V, an open cadence can end on IV, ♭VII, ♭VI, II, iv or Vsus4."]),
  dict(src="Non-Chord Tones.html", drills="non-chord-tones.html", lesson="non-chord-tones-lesson.html", lesson_title="Understanding Non-Chord Tones", lesson_desc="A step-by-step lesson: find the chords, compare the melody, and name each non-chord tone by how it is approached and left: passing and neighbor tones, appoggiaturas, escape tones, suspensions (4-3, 9-8, 7-6, 2-3), retardations, anticipations, double neighbors and pedal tones.", data="nct.js", title="Non-Chord Tones",
       desc="Name the circled non-chord tone, find the dissonance in a melody, label suspension figures, and review how each type is approached and left.",
       modes=[("name", "Name it", "PT · NT · APP · SUS…", "name the circled non-chord tone"),
              ("find", "Find it", "which note?", "find the non-chord tone in a melody"),
              ("sus", "Suspensions", "4-3 · 7-6 · 9-8 · 2-3", "label suspension figures"),
              ("def", "Definitions", "approach · resolution", "how each non-chord tone is approached and left")],
       how=["<b>Spell each chord</b> and compare the melody notes to it; notes outside the chord are non-chord tones (dissonances).",
            "<b>Step–step:</b> same direction = passing tone (PT); back again = neighbor tone (NT).",
            "<b>Leap–step</b> = appoggiatura (APP); <b>step–leap</b> = escape tone (ET).",
            "<b>Held over</b> then down a step = suspension (SUS); up a step = retardation (RET). <b>Early</b> = anticipation (ANT)."]),
  dict(src="Secondary Function Chords.html", drills="secondary-function-chords.html", lesson="secondary-function-chords-lesson.html", lesson_title="Understanding Secondary Function Chords", lesson_desc="A step-by-step lesson: name the chord, read its quality, find its target, and write the Roman numeral for secondary dominants, secondary leading-tone chords and secondary pre-dominants, with examples to play in any key.", data="secondary.js", title="Secondary Function Chords",
       desc="Tell secondary dominants, secondary leading-tone chords and secondary pre-dominants apart: name the chord, read its quality, find its target and write the Roman numeral.",
       modes=[("func", "Function", "dominant · leading-tone · pre-dominant", "what kind of secondary chord is it?"),
              ("label", "Label it", "chord symbol → Roman numeral", "write the full Roman numeral for a chord symbol"),
              ("staff", "On the staff", "find the target", "label the highlighted chord in a progression"),
              ("spell", "Spell it", "Roman numeral → chord", "choose the chord a Roman numeral stands for")],
       how=["<b>Name the chord</b> (stack the notes in thirds; slash = bass note).",
            "<b>Read its quality:</b> major or 7 (dom7) → secondary dominant; °7 → secondary leading-tone; minor or ø7 → secondary pre-dominant.",
            "<b>Find its target:</b> dominant → a P4 above the root; leading-tone → a m2 above; pre-dominant → a M2 below.",
            "<b>Add the figures</b> for inversions: 6, 6/4 for triads; 7, 6/5, 4/3, 4/2 for seventh chords."]),
  dict(src="Chromatic Chords.html", drills="chromatic-chords.html", lesson="chromatic-chords-lesson.html", lesson_title="Understanding Chromatic Chords", lesson_desc="A step-by-step lesson in four parts: mode mixture (borrowed chords and the Picardy third), the Neapolitan (♭II), the Italian, French and German augmented sixth chords, and chromatic mediants, with examples to play in any key.", data=["mixture.js", "neapolitan.js", "aug6.js", "mediant.js", "chromatic.js"], title="Chromatic Chords",
       desc="Mode mixture (borrowed chords and the Picardy third), the Neapolitan (♭II), the Italian, French and German augmented sixth chords, and chromatic mediants: build them in any key, label them, hear them resolve.",
       modes=[("label", "Label it", "chord → Roman numeral", "label borrowed, Neapolitan and augmented sixth chords"),
              ("spell", "Spell it", "Roman numeral → chord", "spell a chromatic chord in a key"),
              ("staff", "On the staff", "progressions", "label the highlighted chord in a progression"),
              ("type", "Which +6?", "It · Fr · Ger", "tell the Italian, French and German sixths apart"),
              ("kind", "Borrowed or secondary?", "sort chromatic chords", "decide whether a chromatic chord is borrowed, secondary or diatonic"),
              ("use", "How they work", "voice leading · Ger+6 vs V⁷", "doubling, resolution, and the German sixth's dominant-seventh twin"),
              ("med", "Mediants", "chromatic 3rd relations", "chromatic mediant chords")],
       how=["<b>Borrowed chords</b> come from the parallel minor: i, ii°, iiø⁷, iv, v, ♭III, ♭VI, ♭VII (and vii°⁷) in a major key. A major chord made minor → mixture; a minor chord made major → secondary dominant. <b>Picardy third:</b> I at the end of a minor-key passage.",
            "<b>Neapolitan:</b> a major triad on ♭2̂, usually ♭II⁶ (its 3rd, 4̂, in the bass; root and 5th above, one doubled). It moves to V, often through i⁶₄ or vii°⁷/V.",
            "<b>Augmented sixths:</b> le (♭6̂) in the bass, fi (♯4̂) above, both resolving out to sol. Italian adds do; French adds do and re; German adds do and me.",
            "<b>German sixth vs. V⁷:</b> same sound; fi (raised 4̂) goes up to V, sol♭ (a 7th) goes down to ♭II.",
            "<b>Chromatic mediants:</b> same quality, roots a M3 or m3 apart, not in one key, sharing a common tone."]),
  dict(src="Voice Motion and Polyphony.html", drills="voice-motion-and-polyphony.html", lesson="voice-motion-and-polyphony-lesson.html", lesson_title="Understanding Voice Motion and Polyphony", lesson_desc="A step-by-step lesson: voice ranges, the four kinds of motion, smooth voice leading and forbidden parallels, spacing and crossing, and the textures of polyphony from drone and organum to canon, hocket and heterophony, with sound examples.", data="voicemotion.js", title="Voice Motion and Polyphony",
       desc="Contrary, oblique, similar and parallel motion; parallel 5ths and octaves; voice ranges, crossing and spacing; and the textures of polyphony, from drone and organum to canon and heterophony.",
       modes=[("motion", "Motion types", "contrary · oblique · similar · parallel", "name the motion between two voices"),
              ("parallels", "Parallels", "5ths and 8ves", "find forbidden parallel fifths and octaves"),
              ("satb", "Ranges & spacing", "SATB check", "voice ranges, crossing and spacing in four parts"),
              ("texture", "Textures", "hear it · name it", "monophony, homophony, polyphony, heterophony, organum, canon and more")],
       how=["<b>Contrary:</b> opposite directions. <b>Oblique:</b> one voice holds or repeats. <b>Similar:</b> same direction, different intervals. <b>Parallel:</b> same direction, same interval.",
            "<b>Avoid</b> parallel perfect unisons, fifths and octaves, even at the expense of normal doubling or spacing.",
            "<b>Ranges</b> (SATB): soprano C4–G5, alto G3–D5, tenor C3–G4, bass E2–C4. No more than an octave between adjacent upper voices; don't cross voices.",
            "<b>Textures:</b> monophony (one line), homophony (melody + chords), polyphony (independent lines), heterophony (one melody, varied at once)."]),
]

def body(f, view):
    n = len(f["modes"])
    nav = "\n".join(f'    <button data-mode="{m}" aria-pressed="{"true" if i == 0 else "false"}"><b>{b}</b><small><span aria-hidden="true">{s}</span><span class="sr">: {html.escape(sr)}</span></small></button>' for i, (m, b, s, sr) in enumerate(f["modes"]))
    how = "".join(f"<li>{h}</li>" for h in f["how"])
    lesson = view == "lesson"
    other = (f'<a href="{f["drills"]}">Practice: {html.escape(f.get("drills_name", f["title"] + " drills"))} →</a>' if lesson else f'<a href="{f["lesson"]}">New to this? Read the lesson: {html.escape(f["lesson_title"])} →</a>')
    lhide, dhide = ("", " hidden") if lesson else (" hidden", "")
    return f'''<body>
<a class="skip" href="{"#lessonView" if lesson else "#practice"}">Skip to the {"lesson" if lesson else "practice question"}</a>
<div class="wrap">
  <header class="top">
    <div class="brand">
      <h1>{html.escape(f["lesson_title"] if lesson else f["title"])}</h1>
      <p>{f["lesson_desc"] if lesson else f["desc"]}</p>
    </div>
    <div class="score"{' style="display:none"' if lesson else ''}>
      <div aria-hidden="true"><b><span id="scRight">0</span><span style="opacity:.45">/</span><span id="scTotal">0</span></b><small>correct / answered</small></div>
      <div aria-hidden="true"><b id="scStreak">0</b><small>streak</small></div>
      <p class="sr" id="scoreText" aria-live="polite"></p>
      <button class="score-reset" id="scoreReset">Reset<span class="sr"> score</span></button>
    </div>
  </header>
  <p class="other-page" id="views">{other}</p>
  <section class="lesson-view" id="lessonView" aria-label="Lesson"{lhide}></section>
  <div id="drillView"{dhide}>
  <nav class="modes m{n}" aria-label="Practice mode">
{nav}
  </nav>
  <main class="card" id="practice" tabindex="-1">
    <div class="prompt" id="prompt"></div>
    <div id="work"></div>
    <div class="actions">
      <button class="btn" id="refBtn" aria-haspopup="dialog">Reference</button>
      <button class="btn ghost" id="nextBtn">Skip</button>
    </div>
    <div class="feedback" id="feedback" aria-live="polite" aria-atomic="true"></div>
    <div id="answerBox"></div>
  </main>
  <aside class="wrap-aside" aria-label="Settings and reference">
  <details class="panel" id="settingsPanel">
    <summary>Practice settings</summary>
    <div class="panel-body">
      <div class="set-row" role="group" aria-labelledby="grp1"><span id="grp1">Include</span>
        <div class="toggles" id="topicToggles"></div>
      </div>
      <div class="set-row" role="group" aria-labelledby="grp3"><span id="grp3">Sound</span>
        <div class="toggles" id="autoToggles">
          <button class="tog" data-auto="1">Play the music after each answer</button>
          <button class="tog" data-auto="0">Only when I tap Play</button>
        </div>
      </div>
      <button class="reset" id="resetBtn">Clear the review list</button>
    </div>
  </details>
  <details class="panel" id="refPanel">
    <summary>Quick reference</summary>
    <div class="panel-body"><div class="ref-slot"></div></div>
  </details>
  <details class="panel">
    <summary>Key ideas</summary>
    <div class="panel-body"><ol class="rules">{how}</ol></div>
  </details>
  </aside>
  </div>
  <footer class="credit">App by Adam Silverman</footer>
</div>
<dialog class="ref-dialog" id="refDialog" aria-labelledby="refTitle">
  <div class="dlg-head">
    <h2 id="refTitle">Quick reference</h2>
    <button class="btn" id="refClose">Close<span class="sr"> reference</span></button>
  </div>
  <div class="ref-slot"></div>
  <p class="legend">Your answer stays as you left it. Press Escape or Close to return.</p>
</dialog>
'''

MODES_CSS = """
@media (min-width: 640px) { .modes.m6 { grid-template-columns: repeat(3, 1fr); } .modes.m4 { grid-template-columns: repeat(4, 1fr); } .modes.m3 { grid-template-columns: repeat(3, 1fr); } .modes.m7 { grid-template-columns: repeat(4, 1fr); } .modes.m5 { grid-template-columns: repeat(3, 1fr); } .modes button { padding: 9px 4px; } .modes button b { font-size: 1.1rem; } .modes button small { font-size: .72rem; } }
"""
ENGINE = (B / "engine.js").read_text(encoding="utf-8")
for f, view in [(f, v) for f in APPS for v in (("lesson",) if f.get("lesson_only") else ("drills", "lesson"))]:
    head = HEAD.replace("<title>Modes Trainer</title>", f"<title>{html.escape(f['lesson_title'] if view == 'lesson' else f['title'])}</title>")
    head = head.replace("@media (min-width: 640px) { .modes { grid-template-columns: repeat(5, 1fr); } .modes button:first-child { grid-column: auto; } .modes button { padding: 9px 4px; } .modes button b { font-size: 1.1rem; } .modes button small { font-size: .72rem; white-space: nowrap; } }", "")
    head = head[:head.rstrip().rindex("</style>")] + EXTRA + MODES_CSS + "\n</style>"
    data = "\n".join((B / d).read_text(encoding="utf-8") for d in ([f["data"]] if isinstance(f["data"], str) else f["data"]))
    page = f'<script>window.SA_PAGE = {{ view: "{view}", other: "{f["drills"] if view == "lesson" else f["lesson"]}" }};</script>\n'
    out = head + "\n</head>\n" + body(f, view) + VEX + "\n" + page + "<script>\n" + data + "</script>\n<script>\n" + ENGINE + "</script>\n\n</body>\n</html>\n"
    src = f["src"] if view == "drills" else (f["src"] if f.get("lesson_only") else f["src"].replace(".html", " Lesson.html"))
    (SRC / src).write_text(out, encoding="utf-8"); print("assembled", src, len(out))
