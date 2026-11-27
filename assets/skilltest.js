/* SilverApps Skill Tests (built from build/shared/skilltest.js into assets/skilltest.js).
   A Skill Test is a drills page opened with ?skill=<id>: a fixed set of fresh drill questions (20 by default), first tries count,
   and 80% or better means the skill is MASTERED. Retakes are unlimited; every try draws a new set.
   The drill engines run the questions (build/harmony/engine.js for the harmony drills, build/chordlab/src.html for chord spelling);
   this file holds the list of skills, the attempt log, the result screen, the professor report and the message to an LMS wrapper:
   {type: "silverapps-quiz-result", skill, pass, mastered, right, n, pct, questions} (see build/shared/scorm.js, mastery packages).
   Parts: each part is a drill mode with its own topics (practice-settings toggles) and options (H.test in the drill's make()),
   asked n times; the parts are shuffled together. Change a test here, then rebuild (sh build/build_all.sh). */
window.SAskill = (() => {
  const PASS = 80;
  const SIMPLE = [["2/4", 2], ["3/4", 3], ["4/4", 4]], COMPOUND = [["6/8", 3], ["9/8", 4.5], ["12/8", 6]];
  const SKILLS = [
    { id: "staff-notes", n: 1, title: "Notes on the Staff", page: "reading-pitch", lesson: "reading-pitch-lesson",
      desc: "Name notes in treble and bass clef, on the staff and on ledger lines.",
      parts: [{ mode: "name", n: 10, topics: ["treble", "staff", "ledger"] }, { mode: "name", n: 10, topics: ["bass", "staff", "ledger"] }] },
    { id: "rhythm-units", n: 2, title: "Units of Rhythm", page: "note-values", lesson: "note-values-lesson",
      desc: "How long each note and rest lasts, and which values add up to which.",
      parts: [{ mode: "value", n: 10 }, { mode: "math", n: 10 }] },
    { id: "bar-completion", n: 3, title: "Bar Completion", page: "note-values", lesson: "note-values-lesson",
      desc: "Find the one note that completes a bar in simple meter (2/4, 3/4, 4/4) and in compound meter (6/8, 9/8, 12/8).",
      parts: [{ mode: "complete", n: 10, opts: { meters: SIMPLE } }, { mode: "complete", n: 10, opts: { meters: COMPOUND } }] },
    { id: "intervals", n: 4, title: "Intervals", page: "intervals", lesson: "intervals-what-why-how",
      desc: "Name intervals on the staff (quality and number), and name the note a given interval above or below.",
      parts: [{ mode: "name", n: 10, topics: ["pmm", "ad"] }, { mode: "note", n: 10, topics: ["pmm", "ad"] }] },
    { id: "scales", n: 5, title: "Major and Minor Scales", page: "major-and-minor-scales", lesson: "major-and-minor-scales-lesson",
      desc: "Spell major scales and natural, harmonic and melodic minor scales, up to five sharps or flats.",
      parts: ["major", "natural", "harmonic", "melodic"].map(t => ({ mode: "spell", n: 5, topics: ["major", "minor"], opts: { types: [t], maxAcc: 5 } })) },
    { id: "key-signatures", n: 6, title: "Key Signatures", page: "major-and-minor-scales", lesson: "major-and-minor-scales-lesson",
      desc: "Name the major or minor key of a key signature, and the signature of a key, up to five sharps or flats.",
      parts: [{ mode: "keysig", n: 10, topics: ["major", "minor"], opts: { maxAcc: 5, minorP: 0 } }, { mode: "keysig", n: 10, topics: ["major", "minor"], opts: { maxAcc: 5, minorP: 1 } }] },
    { id: "chord-spelling", n: 7, title: "Chord Spelling", page: "chord-figures-and-symbols", lesson: "chord-first-steps",
      desc: "Spell triads (major, minor, augmented, diminished, sus4) and all eight kinds of seventh chord from chord symbols.",
      parts: [{ mode: "triads", n: 8 }, { mode: "sevenths", n: 12 }] },
    { id: "roman-numerals", n: 8, title: "Roman Numerals", page: "roman-numerals", lesson: "roman-numeral-analysis-lesson",
      desc: "Give the diatonic Roman numeral for a chord symbol in a major or minor key.",
      parts: [{ mode: "name", n: 20, opts: { toks: { major: ["1", "2", "3", "4", "5", "6", "7", "57", "27"], minor: ["1", "2", "3", "4", "5", "6", "7", "57"] } } }] },
  ];
  SKILLS.forEach(s => { s.pass = s.pass || PASS; s.count = s.parts.reduce((t, p) => t + p.n, 0); s.url = s.page + ".html?skill=" + s.id; });

  const byId = id => SKILLS.find(s => s.id === id) || null;
  const here = () => (location.pathname.split("/").pop() || "").replace(/\.html?$/, "");
  // the Skill Test this page was opened for (?skill=<id>), or null
  function current() { let id = null; try { id = new URLSearchParams(location.search).get("skill"); } catch (e) {} const s = id && byId(id); return s && s.page === here() ? s : null; }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  // one part per question, mixed so the same part rarely comes up three times in a row
  function plan(s) {
    for (let g = 0; g < 50; g++) {
      const out = shuffle(s.parts.flatMap(p => Array(p.n).fill(p)));
      if (s.parts.length < 2 || !out.some((p, i) => i > 1 && p === out[i - 1] && p === out[i - 2])) return out;
    }
    return shuffle(s.parts.flatMap(p => Array(p.n).fill(p)));
  }

  /* ---- attempts, kept in this browser (silverapps-skill-<id>): { attempts: [{ t, right, n, missed: [text] }] } ---- */
  const KEY = id => "silverapps-skill-" + id;
  function log(id) { try { return JSON.parse(localStorage.getItem(KEY(id)) || "null") || { attempts: [] }; } catch (e) { return { attempts: [] }; } }
  const pc = (r, n) => n ? Math.floor(r / n * 100) : 0;   // never rounds up to a pass
  function best(L) { return L.attempts.reduce((b, a) => !b || a.right / a.n > b.right / b.n ? a : b, null); }
  function status(id) { const s = byId(id), L = log(id), b = best(L); return { tries: L.attempts.length, best: b ? pc(b.right, b.n) : null, mastered: !!(b && pc(b.right, b.n) >= (s ? s.pass : PASS)) }; }
  const plain = h => { const d = document.createElement("div"); d.innerHTML = String(h); return (d.textContent || "").replace(/\s+/g, " ").trim(); };

  // a finished attempt: qs = [{ text, correct }]
  function finish(s, qs) {
    const right = qs.filter(q => q.correct).length, n = qs.length, pct = pc(right, n), L = log(s.id);
    L.attempts.push({ t: Date.now(), right, n, missed: qs.filter(q => !q.correct).map(q => plain(q.text).slice(0, 200)) });
    if (L.attempts.length > 50) L.attempts = L.attempts.slice(-50);
    try { localStorage.setItem(KEY(s.id), JSON.stringify(L)); } catch (e) {}
    const st = status(s.id), mastered = pct >= s.pass;
    if (window.parent !== window) try {
      window.parent.postMessage({ type: "silverapps-quiz-result", v: 1, page: here(), lesson: "Skill Test: " + s.title, skill: s.id, pass: s.pass, mastered,
        right, n, pct, questions: qs.map((q, i) => ({ id: s.id + "-" + (i + 1), text: plain(q.text).slice(0, 250), correct: !!q.correct })) }, "*");
    } catch (e) {}
    return { right, n, pct, mastered, best: st.best, everMastered: st.mastered, tries: st.tries };
  }

  const esc = t => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const need = s => Math.ceil(s.pass / 100 * s.count);
  function introHTML(s) {
    const st = status(s.id);
    return `<p class="sk-intro"><b>Skill Test ${s.n} of ${SKILLS.length}.</b> ${esc(s.desc)} ${s.count} questions, a fresh set every time. Get ${need(s)} or more right on the first try (${s.pass}%) and the skill is <b>mastered</b>. You see whether you were right after each answer, and you can take the test as often as you like.${st.tries ? ` Your best so far: ${st.best}%${st.mastered ? " (mastered)" : ""}.` : ""}</p>`;
  }
  function progressHTML(s, i, right) {
    return `<div class="sk-prog"><span>Question <b>${Math.min(i + 1, s.count)}</b> of ${s.count}</span><span>${right} right so far · ${need(s)} needed</span><span class="sk-bar" aria-hidden="true"><i style="width:${i / s.count * 100}%"></i></span></div>`;
  }
  function resultHTML(s, r) {
    const head = r.mastered ? "Skill mastered" : r.everMastered ? "Not this time, but you've already mastered it" : "Not yet";
    const msg = r.mastered ? `You got ${r.right} of ${r.n} (${r.pct}%): ${s.title} is mastered.${window.parent !== window ? " Your point goes to your course gradebook." : ""}`
      : `You got ${r.right} of ${r.n} (${r.pct}%). Mastery takes ${need(s)} of ${s.count} (${s.pass}%).${r.everMastered ? ` Your best, ${r.best}%, still counts.` : " Look over the explanations, practice a little, and take it again: every try draws new questions."}`;
    const lesson = s.lesson ? `<a class="btn" href="${esc(s.lesson)}.html">Review the lesson</a>` : "";
    return `<div class="sk-result ${r.mastered ? "ok" : "no"}" role="status"><h2 tabindex="-1" id="skHead">${head}</h2><p class="sk-big">${r.right}<small> / ${r.n}</small></p><p>${msg}</p>
      <div class="sk-btns"><button class="btn primary" type="button" data-sk-again>${r.mastered ? "Take it again" : "Try again"}</button><button class="btn" type="button" data-sk-report>Report for my professor</button>${lesson}</div></div>`;
  }
  function reportBody(s, st) {
    const L = log(s.id), last = L.attempts[L.attempts.length - 1], b = best(L), when = t => new Date(t).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    return [
      "SilverApps Interactive Music Training — Quiz report",
      "Lesson: Skill Test: " + s.title,
      "Quiz: Skill Test (" + s.count + " questions, first tries count; mastery at " + s.pass + "%)",
      "Student: " + st.name, st.sid ? "Student ID or username: " + st.sid : null, st.course ? "Course or section: " + st.course : null,
      "Report created: " + when(Date.now()),
      "Attempts finished: " + L.attempts.length,
      "Latest attempt: " + when(last.t) + " — " + last.right + " of " + last.n + " (" + pc(last.right, last.n) + "%)",
      "Best attempt: " + when(b.t) + " — " + b.right + " of " + b.n + " (" + pc(b.right, b.n) + "%)",
      "Mastered: " + (pc(b.right, b.n) >= s.pass ? "yes" : "not yet"),
      "Score: " + b.right + " of " + b.n + " (" + pc(b.right, b.n) + "%)",
    ].filter(l => l !== null).join("\n");
  }
  function report(s) {
    const go = () => SAreport.open({ app: "Skill Test: " + s.title, kind: "quiz report", title: "Skill Test report for your professor",
      intro: "Your report shows this skill, your name, the date, how many tries you've finished, your best and latest scores and whether the skill is mastered, with a verification code your professor can check.",
      build: st => reportBody(s, st) });
    if (window.SAreport) return go();
    const me = document.querySelector('script[src*="assets/skilltest.js"]'), sc = document.createElement("script");
    sc.src = me ? me.src.replace(/skilltest\.js(\?.*)?$/, "progress.js") : "assets/progress.js"; sc.onload = go; document.head.appendChild(sc);
  }
  function wire(root, s, again) {
    const a = root.querySelector("[data-sk-again]"), r = root.querySelector("[data-sk-report]");
    if (a) a.onclick = again;
    if (r) r.onclick = () => report(s);
    const h = root.querySelector("#skHead"); if (h) h.focus();
  }
  // styles shared by both engines (each page has the SilverApps tokens)
  const CSS = `.sa-skilltest .modes,.sa-skilltest .wrap-aside,.sa-skilltest #views,.sa-skilltest .top .score,.sa-skilltest #refBtn,.sa-skilltest #lc,.sa-skilltest section.pr{display:none!important}
.sk-intro{font-size:1rem;line-height:1.5;margin:0 0 12px}
.sk-prog{display:flex;flex-wrap:wrap;gap:4px 18px;align-items:center;font:600 .95rem/1.3 var(--fi-body,system-ui);margin:0 0 12px}
.sk-bar{flex:1 1 100%;height:8px;border-radius:4px;background:rgba(0,0,0,.1);overflow:hidden}.sk-bar i{display:block;height:100%;background:var(--fi-red-dk,#9b2a14)}
.sk-result{text-align:center;padding:8px 4px}.sk-result h2{display:block;border:0!important;background:none!important;padding:0!important;box-shadow:none!important;font-size:2rem;margin:.2em 0;text-transform:none;letter-spacing:0}.sk-result.ok h2{color:#1d6b2f}.sk-result.no h2{color:#8a2a14}
.sk-big{font-size:3.4rem;font-weight:700;margin:.1em 0;line-height:1}.sk-big small{font-size:1.4rem;opacity:.75}
.sk-btns{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:16px}`;
  function css() { if (document.getElementById("skCss")) return; const st = document.createElement("style"); st.id = "skCss"; st.textContent = CSS; document.head.appendChild(st); }
  return { SKILLS, PASS, byId, current, plan, finish, status, introHTML, progressHTML, resultHTML, wire, report, css, need };
})();
