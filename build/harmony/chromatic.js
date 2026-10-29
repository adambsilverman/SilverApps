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
    return c;
  }
  const part = (k, name, defMode) => F[k].lesson.steps.map(s => Object.assign({}, s, { part: name, defMode: s.keyed === "both" ? defMode : undefined }));
  const lesson = { steps: [...part("mix", "Mode mixture", "major"), ...part("nea", "Neapolitan", "minor"), ...part("aug", "Augmented sixths", "minor"), ...part("med", "Chromatic mediants", "major")] };
  const reference = H => `<h3>Mode mixture</h3>${F.mix.reference(H)}<h3>Neapolitan</h3>${F.nea.reference(H)}<h3>Augmented sixths</h3>${F.aug.reference(H)}<h3>Chromatic mediants</h3>${F.med.reference(H)}`;
  return {
    key: "silverapps-chromatic-v1", lesson, make, reference,
    modes: [{ id: "label", kicker: "Label it" }, { id: "spell", kicker: "Spell it" }, { id: "staff", kicker: "On the staff" },
      { id: "type", kicker: "Which augmented sixth?" }, { id: "kind", kicker: "Borrowed or secondary?" }, { id: "use", kicker: "How they work" }, { id: "med", kicker: "Chromatic mediants" }],
    topics: Object.entries(FAMILY).map(([id, name]) => ({ id, name, group: "fam" })),
  };
})();
