window.FAM = (() => {
  // ===== Chromatic Chords: Mode Mixture + Neapolitan + Augmented Sixth in one app.
  // The three content files (mixture.js, neapolitan.js, aug6.js) register themselves in window.FAMS; this file combines them.
  const F = window.FAMS, FAMILY = { mix: "Mode mixture", nea: "Neapolitan", aug: "Augmented sixths", med: "Chromatic mediants" };
  // which sub-app modes feed each combined mode
  const MAP = {
    label: [["mix", "label"], ["nea", "label"], ["aug", "staff"]],
    spell: [["mix", "spell"], ["nea", "spell"], ["aug", "spell"]],
    staff: [["mix", "staff"], ["nea", "staff"], ["aug", "staff"]],
    type: [["aug", "type"]],
    kind: [["mix", "kind"]],
    use: [["nea", "use"], ["aug", "twin"]],
    med: [["med", "med"]],
  };
  const ALL_ON = ["maj", "min", "It", "Fr", "Ger"];
  function make(mode, H) {
    const on = H.topicsOn(), src = MAP[mode], pool = src.filter(([f]) => on.includes(f));
    const [fam, sub] = H.rnd(pool.length ? pool : src);
    const H2 = Object.assign({}, H, { topicsOn: () => ALL_ON });
    const c = F[fam].make(sub, H2);
    if (!c) return null;
    c.topic = src.length > 1 ? fam : undefined;   // single-family modes ignore the family toggles
    if (mode === "label") { c.widget = "rnpick"; c.text = c.text.replace(/\.?$/, "") + ": build the label from the parts below."; }
    return c;
  }
  const part = (k, name, defMode) => F[k].lesson.steps.map(s => Object.assign({}, s, { part: name, defMode: s.keyed === "both" ? defMode : undefined }));
  const lesson = { steps: [...part("mix", "Mode mixture", "major"), ...part("nea", "Neapolitan", "minor"), ...part("aug", "Augmented sixths", "minor"), ...part("med", "Chromatic mediants", "major")] };
  const reference = H => `<h3>Mode mixture</h3>${F.mix.reference(H)}<h3>Neapolitan</h3>${F.nea.reference(H)}<h3>Augmented sixths</h3>${F.aug.reference(H)}<h3>Chromatic mediants</h3>${F.med.reference(H)}`;
  // ---------- "Label it": build any Roman numeral from parts (accidental, numeral, quality, figure, applied-to), or pick an augmented sixth ----------
  const PARTS = {
    acc: [["", "none"], ["♭", "♭"], ["♯", "♯"]],
    num: ["I", "II", "III", "IV", "V", "VI", "VII", "i", "ii", "iii", "iv", "v", "vi", "vii"],
    qual: [["", "none"], ["°", "°"], ["ø", "ø"], ["+", "+"]],
    fig: [["", "none (root position triad)"], ["6", "6"], ["64", "6 4"], ["7", "7"], ["65", "6 5"], ["43", "4 3"], ["42", "4 2"]],
    app: [["", "none"], ["/ii", "/ii"], ["/iii", "/iii"], ["/IV", "/IV"], ["/iv", "/iv"], ["/V", "/V"], ["/vi", "/vi"], ["/♭II", "/♭II"]],
    six: ["It+6", "Fr+6", "Ger+6"],
  };
  const SPOKEN = { "": "none", "♭": "flat", "♯": "sharp", "°": "diminished", "ø": "half-diminished", "+": "augmented", "6": "six", "64": "six-four", "7": "seven", "65": "six-five", "43": "four-three", "42": "four-two" };
  const rnOf = q => q.six || (q.num ? (q.acc || "") + q.num + (q.qual || "") + (q.fig || "") + (q.app || "") : null);
  const widgets = { rnpick: {
    html(c, q, H) {
      const d = q.done ? " disabled" : "", P = (k, v) => q.six ? false : (q[k] || "") === v;
      const grp = (label, key, items, cls) => `<div class="pick-sec"><span class="pick-lab" aria-hidden="true">${label}</span><div class="pick-row" role="group" aria-label="${label}">${items.map(([v, t]) => `<button type="button" class="pk ${cls || ""}" data-rk="${key}" data-rv="${H.esc(v)}" aria-pressed="${P(key, v)}" aria-label="${H.esc(SPOKEN[v] || t)}"${d}><span aria-hidden="true">${!v ? "–" : v.length === 2 && /\d\d/.test(v) ? `<span class="pkfig"><span>${v[0]}</span><span>${v[1]}</span></span>` : v}</span></button>`).join("")}</div></div>`;
      const nums = (arr) => arr.map(v => [v, v]);
      return `<div class="pick rnpick">
        ${grp("Accidental", "acc", PARTS.acc)}
        <div class="pick-sec"><span class="pick-lab" aria-hidden="true">Numeral</span><div class="pick-row" role="group" aria-label="Numeral">${PARTS.num.map(v => `<button type="button" class="pk rn" data-rk="num" data-rv="${v}" aria-pressed="${!q.six && q.num === v}" aria-label="${v === v.toUpperCase() ? "uppercase " : "lowercase "}${v}"${d}>${v}</button>`).join("")}</div></div>
        ${grp("Quality sign", "qual", PARTS.qual)}
        ${grp("Figure (inversion)", "fig", PARTS.fig)}
        <div class="pick-sec"><span class="pick-lab" aria-hidden="true">Applied to</span><div class="pick-row" role="group" aria-label="Applied to (secondary chords)">${PARTS.app.map(([v, t]) => `<button type="button" class="pk" data-rk="app" data-rv="${v}" aria-pressed="${!q.six && (q.app || "") === v}" aria-label="${v ? "applied to " + v.slice(1) : "not applied"}"${d}>${v || "–"}</button>`).join("")}</div></div>
        <div class="pick-sec"><span class="pick-lab" aria-hidden="true">Augmented sixth</span><div class="pick-row" role="group" aria-label="Augmented sixth chords">${PARTS.six.map(v => `<button type="button" class="pk" data-rk="six" data-rv="${v}" aria-pressed="${q.six === v}"${d}>${H.rnHTML(v)}</button>`).join("")}</div></div>
        <p class="pick-prev" aria-live="polite">Your label: <b class="rnprev">${rnOf(q) ? H.rnHTML(rnOf(q)) : "–"}</b></p></div>`;
    },
    wire(root, c, q, H) {
      const box = root.querySelector(".rnpick"), btn = root.querySelector("[data-wcheck]");
      const sync = () => { box.querySelectorAll("[data-rk]").forEach(b => { const k = b.dataset.rk, v = b.dataset.rv; b.setAttribute("aria-pressed", String(k === "six" ? q.six === v : !q.six && (k === "num" ? q.num === v : (q[k] || "") === v))); });
        const r = rnOf(q); box.querySelector(".rnprev").innerHTML = r ? H.rnHTML(r) : "–"; btn.disabled = !r; };
      box.onclick = e => { const b = e.target.closest("[data-rk]"); if (!b || b.disabled) return; const k = b.dataset.rk, v = b.dataset.rv;
        if (k === "six") { q.six = q.six === v ? null : v; } else { q.six = null; q[k] = v; } sync(); };
      sync();
    },
    value(root) { const pr = root.querySelector(".rnprev"); const get = k => { const b = root.querySelector(`[data-rk="${k}"][aria-pressed=true]`); return b ? b.dataset.rv : ""; };
      const six = get("six"); if (six) return six; const num = get("num"); return num ? get("acc") + num + get("qual") + get("fig") + get("app") : null; },
  } };

  return {
    key: "silverapps-chromatic-v1", lesson, make, reference, widgets,
    modes: [{ id: "label", kicker: "Label it" }, { id: "spell", kicker: "Spell it" }, { id: "staff", kicker: "On the staff" },
      { id: "type", kicker: "Which augmented sixth?" }, { id: "kind", kicker: "Borrowed or secondary?" }, { id: "use", kicker: "How they work" }, { id: "med", kicker: "Chromatic mediants" }],
    topics: Object.entries(FAMILY).map(([id, name]) => ({ id, name, group: "fam" })),
  };
})();
