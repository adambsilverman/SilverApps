// SilverApps edit mode (served only by build/editor/server.py on this Mac; never part of the published site)
(() => {
  const TOKEN = (window.__SAE || {}).token;
  if (!TOKEN) return;
  const PICK = "h1,h2,h3,h4,h5,p,li,figcaption,caption,td,th,dt,dd,label,legend,summary,blockquote,button,a,.callout,.note,.lkick,.legend,[class*='q-text'],[class*='prompt']";
  let on = false, busy = false, cur = null, hov = null;
  try { on = sessionStorage.getItem("sae-on") === "1"; } catch (e) {}

  const api = (path, body) => fetch("/__edit/" + path, { method: body ? "POST" : "GET", headers: body ? { "Content-Type": "application/json", "X-Edit-Token": TOKEN } : {}, body: body ? JSON.stringify(body) : undefined }).then(r => r.json());
  const el = (tag, attrs = {}, html = "") => { const e = document.createElement(tag); Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v)); e.innerHTML = html; return e; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  // ---- toolbar
  const bar = el("div", { id: "sae-bar", role: "group", "aria-label": "Edit mode" },
    `<button type="button" id="sae-toggle" aria-pressed="false">Edit</button><button type="button" id="sae-undo" hidden>Undo last save</button><span id="sae-msg" role="status" aria-live="polite"></span>`);
  document.body.appendChild(bar);
  const msg = (t, cls) => { const m = bar.querySelector("#sae-msg"); m.textContent = t || ""; m.className = cls || ""; };
  const setOn = v => { on = v; document.documentElement.classList.toggle("sae-on", on); bar.querySelector("#sae-toggle").setAttribute("aria-pressed", on); bar.querySelector("#sae-toggle").textContent = on ? "Editing: click any text" : "Edit"; try { sessionStorage.setItem("sae-on", on ? "1" : "0"); } catch (e) {} if (!on) { closePanel(); outline(null); } };
  bar.querySelector("#sae-toggle").addEventListener("click", () => setOn(!on));
  bar.querySelector("#sae-undo").addEventListener("click", async () => { if (busy) return; if (!confirm("Undo your last saved change?")) return; const r = await api("undo", {}); if (!r.ok) return msg(r.error, "bad"); waitBuild(r.gen, "Undone. Rebuilding…"); });

  // ---- hover + click to pick a passage
  const target = t => { if (!(t instanceof Element) || t.closest("#sae-bar,#sae-panel,svg")) return null; const e = t.closest(PICK) || t; return e.innerText && e.innerText.trim() ? e : null; };
  const outline = e => { if (hov) hov.classList.remove("sae-hover"); hov = e; if (hov) hov.classList.add("sae-hover"); };
  document.addEventListener("mouseover", e => { if (on && !panel.contains(e.target)) outline(target(e.target)); }, true);
  ["click", "mousedown", "pointerdown", "keydown"].forEach(ev => document.addEventListener(ev, e => {
    if (!on || e.target.closest("#sae-bar,#sae-panel")) return;
    if (ev === "keydown" && !(e.key === "Enter" && e.altKey)) return;   // Option+Enter edits the focused element
    const t = target(e.target); if (!t) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    if (ev === "click" || ev === "keydown") pick(t);
  }, true));

  // ---- panel
  const panel = el("div", { id: "sae-panel", role: "dialog", "aria-labelledby": "sae-h", hidden: "" }, `
    <div class="sae-head"><h2 id="sae-h">Edit text</h2><button type="button" class="sae-x" aria-label="Close">×</button></div>
    <p class="sae-where"></p>
    <label class="sae-pickl" hidden>Found in more than one place<select class="sae-pick"></select></label>
    <label for="sae-ta" class="sae-l">Text <span class="sae-hint"></span></label>
    <textarea id="sae-ta" spellcheck="true"></textarea>
    <p class="sae-l">Preview</p><div class="sae-prev"></div>
    <div class="sae-actions"><button type="button" class="sae-save">Save</button><button type="button" class="sae-cancel">Cancel</button><span class="sae-st" role="status" aria-live="polite"></span></div>
    <p class="sae-help">Keep anything in <code>&lt; &gt;</code> (formatting), <code>{rn:…}</code> and <code>{sym:…}</code> (Roman numerals and chord symbols) and <code>\${…}</code> (filled in by the lesson). Cmd+Enter saves, Esc closes.</p>`);
  document.body.appendChild(panel);
  const $ = s => panel.querySelector(s);
  const ta = $("#sae-ta");
  let hits = [];
  const closePanel = () => { panel.hidden = true; if (cur) cur.classList.remove("sae-cur"); const back = cur; cur = null; if (back && back.focus) try { back.focus(); } catch (e) {} };
  $(".sae-x").addEventListener("click", closePanel); $(".sae-cancel").addEventListener("click", closePanel);
  panel.addEventListener("keydown", e => { if (e.key === "Escape") { e.preventDefault(); closePanel(); } if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); doSave(); } });
  const preview = () => { $(".sae-prev").innerHTML = ta.value.replace(/\$\{[^}]*\}/g, "<span class='sae-auto'>[filled in]</span>").replace(/\{(?:rn|sym):([^}]+)\}/g, "<b>$1</b>").replace(/\\n/g, "<br>"); };
  ta.addEventListener("input", preview);
  const show = i => { const h = hits[i]; ta.value = h.text; ta.dataset.i = i; preview();
    $(".sae-where").textContent = `${h.file}, line ${h.line}`;
    $(".sae-hint").textContent = h.kind === "dq" || h.kind === "sq" ? "(plain text: quotes and apostrophes are fine)" : "";
    $(".sae-save").disabled = false; $(".sae-st").textContent = ""; };
  $(".sae-pick").addEventListener("change", e => show(+e.target.value));

  async function pick(t) {
    if (busy) return;
    if (cur) cur.classList.remove("sae-cur");
    cur = t; t.classList.add("sae-cur");
    panel.hidden = false; ta.value = ""; $(".sae-prev").innerHTML = ""; $(".sae-where").textContent = "Finding this text in the source files…"; $(".sae-pickl").hidden = true; $(".sae-save").disabled = true; $(".sae-st").textContent = "";
    const r = await api("locate", { text: t.innerText, tag: t.tagName, page: location.pathname });
    hits = r.hits || [];
    if (!hits.length) { $(".sae-where").textContent = "This text isn't stored as written: the lesson builds it as the page runs (for example, note names that change with the key). It can't be edited here."; return; }
    $(".sae-pickl").hidden = hits.length < 2;
    $(".sae-pick").innerHTML = hits.map((h, i) => `<option value="${i}">${esc(h.file)}, line ${h.line}: ${esc(h.text.replace(/\s+/g, " ").slice(0, 60))}…</option>`).join("");
    show(0); ta.focus();
  }

  async function doSave() {
    const h = hits[+ta.dataset.i]; if (!h || busy) return;
    if (ta.value === h.text) { closePanel(); return; }
    busy = true; $(".sae-save").disabled = true; $(".sae-st").textContent = "Saving…";
    const r = await api("save", { file: h.file, start: h.start, end: h.end, sha: h.sha, kind: h.kind, text: ta.value });
    if (!r.ok) { busy = false; $(".sae-save").disabled = false; $(".sae-st").textContent = r.error; $(".sae-st").className = "sae-st bad"; return; }
    closePanel(); waitBuild(r.gen, "Saved. Rebuilding…");
  }
  $(".sae-save").addEventListener("click", doSave);

  // ---- wait for the rebuild, then reload in place
  async function waitBuild(gen, text) {
    busy = true; msg(text);
    for (let i = 0; i < 240; i++) {
      await new Promise(r => setTimeout(r, 1000));
      let s; try { s = await api("status"); } catch (e) { continue; }
      if (s.gen > gen && s.state !== "building" && !s.dirty) {
        if (s.state === "failed") { busy = false; msg("The build failed: see the Edit Mode window. Your change is saved; Undo reverts it.", "bad"); refreshUndo(); return; }
        try { sessionStorage.setItem("sae-scroll", String(scrollY)); } catch (e) {}
        location.reload(); return;
      }
    }
    busy = false; msg("Still building… reload the page in a moment.");
  }
  const refreshUndo = () => api("status").then(s => { bar.querySelector("#sae-undo").hidden = !s.undo; if (s.state === "building" || s.dirty) msg("Rebuilding…"); }).catch(() => {});

  setOn(on); refreshUndo();
  try { const y = sessionStorage.getItem("sae-scroll"); if (y) { sessionStorage.removeItem("sae-scroll"); setTimeout(() => scrollTo(0, +y), 300); msg("Updated."); setTimeout(() => msg(""), 4000); } } catch (e) {}
})();
