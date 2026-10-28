"""Assemble build/src/Instrument Transpositions.html from body.html + app.js (+ the Modes Trainer's CSS and VexFlow).
Run this after editing body.html or app.js, then build_trainers.py."""
import pathlib
B = pathlib.Path(__file__).resolve().parent; SRC = B.parent / "src"
src = (SRC / "Modes Trainer.html").read_text(encoding="utf-8").split("\n")
head = "\n".join(src[:229]); vex = "\n".join(src[351:360])
assert head.rstrip().endswith("</style>") and vex.startswith("<script>")
head = head.replace("<title>Modes Trainer</title>", "<title>Instrument Transpositions</title>")
head = head.replace(".modes button:first-child { grid-column: 1 / -1; }\n", "")
head = head.replace("@media (min-width: 640px) { .modes { grid-template-columns: repeat(5, 1fr); } .modes button:first-child { grid-column: auto; }", "@media (min-width: 640px) { .modes { grid-template-columns: repeat(4, 1fr); }")
head = head[:head.rstrip().rindex("</style>")] + (B / "extra.css").read_text(encoding="utf-8") + "\n</style>"
out = head + "\n</head>\n" + (B / "body.html").read_text(encoding="utf-8") + "\n" + vex + "\n<script>\n" + (B / "app.js").read_text(encoding="utf-8") + "</script>\n\n</body>\n</html>\n"
(SRC / "Instrument Transpositions.html").write_text(out, encoding="utf-8"); print("assembled", len(out))
