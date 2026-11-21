// Writes the Test Yourself pages for the Orchestration apps (build/pages/<drills>-quiz.html) from the apps' own question pools.
// Run: node build/tools/make_orch_quizzes.js   (then build as usual). Questions naming a specific piece are left out.
const fs = require("fs"), path = require("path"), B = path.join(__dirname, "..");
const rd = f => fs.readFileSync(path.join(B, f), "utf8");
const jsonStr = /"(?:[^"\\]|\\.)*"/;
function Fcalls(src) {   // F("q", "a", ["w"...], "why") grouped by the const array they sit in
  const out = []; let arr = null, s = 0;
  const re = /const ([A-Z_0-9]+) = \[|F\(("(?:[^"\\]|\\.)*"),\s*("(?:[^"\\]|\\.)*"),\s*(\[[^\]]*\]),\s*("(?:[^"\\]|\\.)*")\)/g; let m;
  while ((m = re.exec(src))) { if (m[1]) { arr = m[1]; continue; } out.push({ g: arr, q: JSON.parse(m[2]), a: JSON.parse(m[3]), w: JSON.parse(m[4]), why: JSON.parse(m[5]) }); }
  return out;
}
function objs(src, start, keys) {   // { k: "...", ... } object literals inside the array that begins at `start`
  const i = src.indexOf(start); let d = 0, j = i + start.length - 1; for (; j < src.length; j++) { if (src[j] === "[") d++; else if (src[j] === "]" && !--d) break; }
  const body = src.slice(i + start.length - 1, j + 1);
  return Function('"use strict"; return ' + body)();
}
const SPEC = [
  { page: "orchestration-strings", title: "Strings", load: () => objs(rd("orchestration/strings.js"), "const FACTS = [", 0).map(f => ({ g: f.t, q: f.q, a: f.a, w: f.w, why: f.why })), names: { inst: "The instruments", nums: "Numbers and ranges" } },
  { page: "orchestration-winds-brass", title: "Winds and Brass", load: () => Fcalls(rd("orchestration/winds.js")), names: { INST: "The instruments", COLOR: "Color and blend", ORDF: "Score order", BF: "How brass works" } },
  { page: "orchestration-percussion", title: "Percussion", load: () => Fcalls(rd("orchestration/percussion.js")), names: { FACTS: "The instruments", PLAYING: "Playing and logistics", NOTATION: "Notation" } },
  { page: "orchestration-harp", title: "Harp", load: () => Fcalls(rd("orchestration/harp.js")), names: { INST: "The instrument", PEDAL: "Pedals", TECH: "Techniques and notation" } },
  { page: "orchestration-piano", title: "Keyboard Instruments", load: () => Fcalls(rd("orchestration/piano.js")), names: { INST: "The piano", PEDALS: "Pedals", NOTA: "Notation", ENS: "In the ensemble", ACCOMP: "Accompaniment", ORGAN: "Organ", PREP: "Prepared piano" } },
  { page: "orchestration-plucked", title: "Plucked Hand-held Instruments", load: () => Fcalls(rd("orchestration/plucked.js")), names: { INST: "The instruments", TECH: "Techniques" } },
  { page: "score-and-parts", title: "Score and Parts Preparation", load: () => Fcalls(rd("orchestration/scoreparts.js")), names: { SCORE: "The score", PARTS: "The parts", TYPE: "Typesetting" } },
  { page: "instrument-transpositions", title: "Instrument Transpositions", load: () => objs(rd("transposition/app.js"), "const FACTS = [", 0).map(f => ({ g: "T", q: f.text, a: f.ans, w: f.wrong, why: f.why })).concat(require("./transp_extra.json")), names: { T: "Transposing instruments", X: "Reading transposed parts" } },
  { page: "orchestration-foreign-terms", title: "Orchestration Foreign Terms", load: foreign, names: { Strings: "Strings", Woodwinds: "Woodwinds", Brass: "Brass", Keyboards: "Keyboards", Percussion: "Percussion", General: "General terms" } },
];
function foreign() {
  const src = rd("src/Orchestration Foreign Terms.html"), D = objs(src, "const D = [", 0), L = ["French", "German", "Italian"], out = [];
  let seed = 7; const rnd = n => (seed = (seed * 9301 + 49297) % 233280, Math.floor(seed / 233280 * n));
  D.forEach((r, i) => { if (!r[2]) return; const en = r[2][0];
    const langs = [0, 1, 2].filter(l => r[3 + l] && r[3 + l][0].toLowerCase() !== en.toLowerCase()); if (!langs.length) return;
    const l = langs[rnd(langs.length)], term = r[3 + l][0];
    const pool = D.filter((x, j) => j !== i && x[2] && x[0] === r[0] && x[2][0] !== en).map(x => x[2][0]);
    const alt = D.filter((x, j) => j !== i && x[2] && x[2][0] !== en).map(x => x[2][0]);
    const w = []; while (w.length < 3) { const src2 = pool.length >= 3 ? pool : alt; const c = src2[rnd(src2.length)]; if (!w.includes(c)) w.push(c); }
    out.push({ g: FAMS(r[0]), q: `In a score, the ${L[l]} term “${term}” means…`, a: en, w, why: `${L[l]} “${term}” = ${en}. ` + [0, 1, 2].filter(k => k !== l && r[3 + k]).map(k => `${L[k]}: ${r[3 + k].join(" / ")}`).join("; ") + "." }); });
  return out;
  function FAMS(f) { return ["Strings", "Woodwinds", "Brass", "Keyboards", "Percussion"].includes(f) ? f : "General"; }
}
const PIECE = /[“”]|\b[A-Z][a-z]+'s [A-Z]|Symphony|Concerto|Bolero|Boléro|Rite of|Firebird|Pictures at/;
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
for (const sp of SPEC) {
  let qs = sp.load().filter(q => q.w && q.w.length >= 3 && !(PIECE.test(q.q) && !/^In a score, the/.test(q.q)) && !q.w.includes(q.a));
  const groups = [...new Set(qs.map(q => q.g))], STEPS = groups.map(g => sp.names[g] || g);
  const QZ = qs.map(q => ({ s: groups.indexOf(q.g) + 1, q: q.q, a: q.a, w: q.w.slice(0, 3), why: q.why || "" }));
  const drills = sp.page + ".html", name = sp.title;
  const html = `<!-- title: Test Yourself: ${name} | desc: An open-note quiz on ${name}, with a report for your professor. -->
<!-- Generated by build/tools/make_orch_quizzes.js from the app's question pools: edit those, then run it again. -->
<style>
.qz{max-width:820px;margin:0 auto;padding:22px 16px 48px}
.qz h1{font:400 clamp(44px,8vw,78px)/.92 var(--fi-display);margin:0;border-top:2px solid var(--fi-red);padding-top:12px}
.qz h1 span{color:var(--fi-red-dk)}
.qz .lead{max-width:66ch} .qz a{color:var(--fi-red-dk)}
.qz .other{font:700 15px var(--fi-ui);margin:4px 0 18px}
</style>
<main id="main" class="qz" data-sa-quiz="${esc(name)}">
<h1><span>Test</span> Yourself</h1>
<p class="lead">An open-note quiz on <a href="${drills}">${esc(name)}</a>. Each try draws a fresh set of questions from every topic in the app.</p>
<p class="other"><a href="${drills}">← Practice: ${esc(name)} drills</a></p>
<div id="saqBox"></div>
</main>
<script>
(() => {
  // s = the topic in the drills app (STEPS); "Look back" opens the drills app.
  const QZ = ${JSON.stringify(QZ)};
  const STEPS = ${JSON.stringify(STEPS)};
  const mount = () => { if (!window.SAquiz) return; const box = document.getElementById("saqBox"); box.innerHTML = SAquiz.html("page");
    SAquiz.wire(box, "page", QZ, { href: n => "${drills}", stepName: n => STEPS[n - 1] || "the drills", links: [{"href": "${drills}", "label": "Practice: ${esc(name)} drills →", "primary": true}] }); };
  if (window.SAquiz) mount(); else window.addEventListener("DOMContentLoaded", mount);
})();
</script>
`;
  fs.writeFileSync(path.join(B, "pages", sp.page + "-quiz.html"), html);
  console.log(sp.page, QZ.length, STEPS.join(" / "));
}
