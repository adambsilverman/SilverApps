"""Build verify.html — professors paste a student's completion report to check its verification code.
Run: python3 build/build_verify.py"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from common import *

page = f'''<!doctype html>
<html lang="en" data-theme="light">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Check a completion report · {SITE}</title>
{HEAD_ASSETS}
<style>
main{{max-width:760px;margin:0 auto;padding:26px 16px}}
h1{{font-family:var(--fi-display);font-weight:400;font-size:clamp(44px,8vw,72px);line-height:.92;margin:0;border-top:2px solid var(--fi-red);padding-top:12px}}
textarea{{width:100%;min-height:300px;font:16px/1.55 var(--fi-serif);padding:14px;border:1.5px solid var(--fi-line);border-radius:var(--fi-r);background:var(--fi-card);color:var(--fi-ink)}}
label{{display:block;font:900 12px var(--fi-body);letter-spacing:.1em;text-transform:uppercase;margin:18px 0 6px}}
.res{{margin-top:14px;padding:14px 16px;border-radius:var(--fi-r);border-left:8px solid var(--fi-line);background:var(--fi-card)}}
.res.ok{{border-left-color:var(--fi-green);background:#eef6e4}} .res.bad{{border-left-color:var(--fi-red);background:#fff1ec}}
.res b{{font-family:var(--fi-display);font-weight:400;font-size:30px;display:block;line-height:1}}
</style></head>
<body>
{strip_html(full_screen=False)}
<main>
<h1>Check a completion report</h1>
<p>Paste the whole report a student sent you — from the first line to the verification code. This checks that the numbers weren't changed after the report was made. It's a deterrent, not cryptographic proof.</p>
<label for="rep">Report text</label>
<textarea id="rep" spellcheck="false" placeholder="SilverApps for Music Training — Completion report&#10;App: …"></textarea>
<p><button type="button" class="pr-btn primary" id="go">Check report</button></p>
<div id="out" role="status" aria-live="polite"></div>
</main>
{CREDIT}
<script src="assets/progress.js"></script>
<script>
document.getElementById("go").onclick = () => {{
  const t = document.getElementById("rep").value, out = document.getElementById("out");
  const m = t.match(/Verification code:\\s*([0-9A-Z]{{5}}-[0-9A-Z]{{5}})/i);
  if (!m) {{ out.innerHTML = '<div class="res bad"><b>No code found</b>Paste the full report, including the "Verification code" line.</div>'; return; }}
  const body = t.slice(0, t.search(/Verification code:/i));
  const ok = SAverify.codeFor(body) === m[1].toUpperCase();
  const g = k => (t.match(new RegExp("^\\\\s*" + k + ":\\\\s*(.+)$", "mi")) || [])[1] || "—";
  out.innerHTML = ok
    ? `<div class="res ok"><b>Report checks out</b>${{g("Student")}} · ${{g("App")}} · ${{g("Questions answered")}} answered · ${{g("Correct")}} correct · made ${{g("Report created")}}</div>`
    : '<div class="res bad"><b>Doesn\\'t match</b>The text was changed after the report was made (or only part of it was pasted).</div>';
}};
</script>
</body></html>
'''
(SITE_DIR / "verify.html").write_text(page, encoding="utf-8")
print("built verify.html")
