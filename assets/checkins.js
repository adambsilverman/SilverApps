/* Weekly Check-ins for MTC 110 (Spring 2027): one SCORM package, one grade item (built by SAscorm.checkins in scorm.js,
   downloaded from gradebook-sync.html#checkins). Each week's check-in opens on the first day of that week.
   Credit: a required check-in is worth 2 points, an optional one 1 bonus point; the grade is points / 10, capped at 100%,
   so optional check-ins can make up for a missed required one. Responses go to the LMS as SCORM interactions
   (id "W03-Q5", or "W03-Q5-p2" for the second part of a long answer); each week is a SCORM objective ("Week-03"). */
window.SAcheckins = (() => {
  const TIME = ["less than 1 hour", "1–2 hours", "3–4 hours", "5–6 hours", "more than 6 hours"];
  const DIFF = ["very easy", "not particularly challenging", "appropriately challenging", "slightly too challenging", "way too challenging"];
  const NEW = ["0–25%", "25–50%", "50–75%", "75–95%", "96–100%"];
  const ACC = ["mostly not accessible or helpful", "somewhat not accessible or helpful", "fairly accessible and helpful", "mostly accessible and helpful", "very accessible and helpful"];
  const L = (what) => [
    { id: "time", q: `How long did ${what} take you?`, opts: TIME },
    { id: "difficulty", q: `How would you rate the difficulty of ${what}?`, opts: DIFF },
    { id: "new", q: `How much of ${what} was new to you, gave you deeper context, or was a useful reminder?`, opts: NEW },
    { id: "access", q: `Was ${what} formatted in a way that was helpful and accessible to you?`, opts: ACC },
  ];
  const HELP = (what) => ({ id: "helpful", q: `What did you find most helpful about ${what}?` });
  const HARD = (what) => ({ id: "difficult", q: `What did you find most difficult about ${what}?` });
  const AT = { id: "assistive", q: "Did you use any assistive tools (a screen reader, captions, translation, the A−/A+ text-size buttons, etc.) to get to this week's materials? If so, how well did they work?", optional: true };
  const OPEN = { id: "open", q: "Open feedback: is there anything you'd like to tell me about this week or the course?", optional: true };
  const std = (extra = []) => ({ likert: L("this week's work"), text: [HELP("this week"), HARD("this week"), ...extra, AT, OPEN] });
  const W = [
    [1, "2027-01-19", "Sound, Timbre & Music Software", true, { ...std([{ id: "hopes", q: "What are you hoping to get out of this course? (Any musical background, goals or worries you'd like me to know about are welcome too.)", optional: true }]) }],
    [2, "2027-01-25", "Rhythm, Meter & Contemporary Grooves", false, std()],
    [3, "2027-02-01", "Rhythm Notation, Phrasing & Lyrics", true, std()],
    [4, "2027-02-08", "Reading Pitch & Finding Musical Ideas", false, std()],
    [5, "2027-02-15", "Intervals & Musical Expectation", false, std()],
    [6, "2027-02-22", "Major & Minor Scales and Pop Production", false, std()],
    [7, "2027-03-01", "Tendency Tones, Improvisation & Midterm Exam", true, { likert: L("this week's work (including the Midterm Exam)"), text: [HELP("this week"), { id: "midterm", q: "How did the Midterm Exam go? Was anything on it unexpected, or was something you studied missing?" }, HARD("this week"), AT, OPEN] }],
    [9, "2027-03-15", "Harmonization & Film/Game Scoring", false, std()],
    [10, "2027-03-22", "Triads, Piano Accompaniment & Harmonizing Melodies", false, std()],
    [11, "2027-03-29", "Seventh Chords, Lead Sheets & Musical Collaboration", true, std()],
    [12, "2027-04-05", "Texture, Minimalism & Ambient Loops", false, std()],
    [13, "2027-04-12", "Roman Numerals & Groove Maker", false, std()],
    [14, "2027-04-19", "Music Business, Rights & Music Analysis Project", false, { likert: L("this week's work (including the Music Analysis Project)"), text: [HELP("the Music Analysis Project"), HARD("the Music Analysis Project"), { id: "swap", q: "If you could swap out one of the songs in the Music Analysis Project packet, which song would you add, and why?", optional: true }, AT, OPEN] }],
    [15, "2027-04-26", "Cadences & Final Exam Prep", true, std()],
    [16, "2027-05-03", "Final Exam & Course Wrap-Up", false, { likert: L("the Final Exam and this last week"), text: [{ id: "learned", q: "What is the most valuable thing you learned in this course?" }, { id: "change", q: "What one thing should I change for the next group of students?" }, { id: "apps", q: "Which SilverApps lessons or tools helped you most, and which would you improve?", optional: true }, OPEN] }],
  ].map(([n, start, title, req, body]) => ({ n, start, title, required: req, ...body }));
  return { course: "MTC 110: Making Music", title: "Weekly Check-ins", end: "2027-05-09", reqPoints: 2, bonusPoints: 1, outOf: 10, weeks: W };
})();
