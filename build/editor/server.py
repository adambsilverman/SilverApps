#!/usr/bin/env python3
"""SilverApps edit mode: a private, local-only editor for the site's text.

Run it with "Edit Mode.command" (double-click) or:  python3 build/editor/server.py
  - serves the built site at http://localhost:8000 (8001... if busy), on this Mac only
  - adds an Edit switch to every page: click a passage, change it, Save
  - writes the change into the matching source file under build/, keeps a backup,
    and rebuilds (it also rebuilds when you save a file in your own editor)

Only this Mac can reach it (it listens on 127.0.0.1), and every change needs the
random key this server prints into the pages it serves, so no other web page or
computer can write to your files. Standard library only.
"""
import hashlib, html, json, os, re, secrets, shutil, socket, subprocess, sys, threading, time, webbrowser
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, unquote

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BUILD = os.path.join(ROOT, "build")
HERE = os.path.dirname(os.path.abspath(__file__))
BACKUPS = os.path.join(HERE, "backups")
TOKEN = secrets.token_hex(16)
SKIP_DIRS = {"gen", "__pycache__", "backups", "editor", "node_modules"}
SRC_EXT = (".js", ".html", ".json", ".py")


# ---------------------------------------------------------------- source scanning
# Each source file is split into "segments": the text inside string literals and template
# literals of its JavaScript, and the markup of its HTML. Rendered page text is matched
# against a plain-text projection of those segments (tags removed, {rn:..}/{sym:..} unwrapped).

def _regex_ok(last):
    return last == "" or last in "(,=:[!&|?{};+-*%<>~^" or re.search(r"\b(return|typeof|case|in|of)$", last or "")

def scan_js(s, i0=0, i1=None):
    """Literal segments of JavaScript s[i0:i1]: (kind, a, b, lit_a, lit_b); kind dq | sq | tpl."""
    segs, n = [], (len(s) if i1 is None else i1)

    def code(i, nested):
        depth, last = 0, ""
        while i < n:
            c = s[i]
            if c in "\"'":
                q, j = c, i + 1
                while j < n and s[j] != q and s[j] != "\n":
                    j += 2 if s[j] == "\\" else 1
                segs.append(("dq" if q == '"' else "sq", i + 1, min(j, n), i, min(j + 1, n)))
                i, last = j + 1, "a"; continue
            if c == "`":
                i = tpl(i + 1); last = "a"; continue
            if c == "/" and i + 1 < n and s[i + 1] == "/":
                j = s.find("\n", i); i = n if j < 0 else j; continue
            if c == "/" and i + 1 < n and s[i + 1] == "*":
                j = s.find("*/", i + 2); i = n if j < 0 else j + 2; continue
            if c == "/" and _regex_ok(last):
                j, cls = i + 1, False
                while j < n and s[j] != "\n":
                    if s[j] == "\\": j += 2; continue
                    if s[j] == "[": cls = True
                    elif s[j] == "]": cls = False
                    elif s[j] == "/" and not cls: break
                    j += 1
                j += 1
                while j < n and s[j].isalpha(): j += 1
                i, last = j, "a"; continue
            if c == "{": depth += 1
            elif c == "}":
                if nested and depth == 0: return i + 1
                depth -= 1
            if not c.isspace():
                if c.isalnum() or c in "_$":
                    m = re.match(r"[\w$]+", s[i:i + 40]); w = m.group(0); i += len(w); last = w; continue
                last = c
            i += 1
        return i

    def tpl(i):
        lit_a, a = i - 1, i
        parts = []
        while i < n:
            c = s[i]
            if c == "\\": i += 2; continue
            if c == "`":
                parts.append((a, i)); break
            if c == "$" and i + 1 < n and s[i + 1] == "{":
                parts.append((a, i)); i = code(i + 2, True); a = i; continue
            i += 1
        lit_b = min(i + 1, n)
        for (pa, pb) in parts:
            segs.append(("tpl", pa, pb, lit_a, lit_b))
        return i + 1

    code(i0, False)
    return segs

def scan_py(s):
    """String segments of Python source: triple-quoted strings become "py3" (split at f-string {...} parts), others dq/sq."""
    segs, i, n = [], 0, len(s)
    while i < n:
        c = s[i]
        if c == "#":
            j = s.find("\n", i); i = n if j < 0 else j; continue
        m = re.match(r"([rRbBfFuU]{0,2})('''|\"\"\"|'|\")", s[i:i + 6]) if (c in "'\"" or (c.isalpha() and (i == 0 or not (s[i - 1].isalnum() or s[i - 1] == "_")))) else None
        if not m:
            i += 1; continue
        pre, q = m.group(1).lower(), m.group(2)
        a = i + len(m.group(0)); j = a
        while j < n and not s.startswith(q, j):
            if s[j] == "\\" and "r" not in pre: j += 2; continue
            if len(q) == 1 and s[j] == "\n": break
            j += 1
        if len(q) == 3:
            parts, pa, k = [], a, a
            while "f" in pre and k < j:
                if s.startswith("{{", k) or s.startswith("}}", k): k += 2; continue
                if s[k] == "{":
                    e = s.find("}", k); e = j if e < 0 or e > j else e
                    parts.append((pa, k)); pa = k = e + 1; continue
                k += 1
            parts.append((pa, j))
            segs += [("py3", x, y, i, j + 3) for x, y in parts]
        else:
            segs.append(("dq" if q == '"' else "sq", a, j, i, j + 1))
        i = j + len(q)
    return segs

def scan_file(path, s):
    if path.endswith(".py"):
        return scan_py(s)
    if path.endswith(".html"):
        segs, pos = [], 0
        for m in re.finditer(r"(?is)<(script|style)\b[^>]*>(.*?)</\1\s*>", s):
            segs.append(("html", pos, m.start(), pos, m.start()))
            if m.group(1).lower() == "script":
                segs += scan_js(s, m.start(2), m.end(2))
            pos = m.end()
        segs.append(("html", pos, len(s), pos, len(s)))
        return segs
    return scan_js(s)

INLINE = {"b", "i", "em", "strong", "span", "sup", "sub", "a", "small", "code", "u", "abbr", "mark", "q"}
ENT = {"amp": "&", "lt": "<", "gt": ">", "quot": '"', "apos": "'", "nbsp": " ", "rsquo": "’", "lsquo": "‘", "ldquo": "“", "rdquo": "”", "mdash": "—", "ndash": "–", "hellip": "…", "#39": "'"}

def project(s, a, b, kind):
    """Plain text of s[a:b] as a reader would see it, plus a map from each output char to its source index."""
    out, idx, i = [], [], a
    def emit(ch, at):
        if ch.isspace():
            if out and out[-1] == " ": return
            ch = " "
        out.append(ch.lower()); idx.append(at)
    while i < b:
        c = s[i]
        if c == "<" and i + 1 < b and (s[i + 1].isalpha() or s[i + 1] in "/!"):
            j = s.find(">", i)
            if j < 0 or j >= b: j = b - 1
            name = re.match(r"</?([a-zA-Z0-9]+)", s[i:j + 1])
            if not (name and name.group(1).lower() in INLINE): emit(" ", i)
            i = j + 1; continue
        if c == "{" and s.startswith(("{rn:", "{sym:"), i):
            i = s.find(":", i) + 1; continue
        if c == "}" and kind not in ("html", "py3"):
            i += 1; continue
        if c == "&":
            m = re.match(r"&(#?\w+);", s[i:i + 10])
            if m and m.group(1) in ENT:
                emit(ENT[m.group(1)], i); i += len(m.group(0)); continue
        if c == "\\" and kind not in ("html",) and i + 1 < b:
            nx = s[i + 1]; emit(" " if nx == "n" else nx, i); i += 2; continue
        emit(c, i); i += 1
    return "".join(out), idx

_cache = {}
def sources():
    """[(relpath, text, segments, projection, map)] for every source file under build/ (cached by mtime)."""
    res = []
    for dp, dns, fns in os.walk(BUILD):
        dns[:] = [d for d in dns if d not in SKIP_DIRS and not d.startswith(".")]
        for fn in fns:
            if not fn.endswith(SRC_EXT): continue
            p = os.path.join(dp, fn)
            try: mt = os.path.getmtime(p)
            except OSError: continue
            hit = _cache.get(p)
            if not hit or hit[0] != mt:
                try: s = open(p, encoding="utf-8").read()
                except (OSError, UnicodeDecodeError): continue
                segs = scan_file(p, s)
                proj, idx = [], []
                for k, sa, sb, la, lb in segs:
                    t, m = project(s, sa, sb, k)
                    proj.append(t); idx += m; proj.append("￿"); idx.append(sb)
                hit = _cache[p] = (mt, s, segs, "".join(proj), idx)
            res.append((os.path.relpath(p, ROOT), hit[1], hit[2], hit[3], hit[4]))
    return res

def norm(t):
    return re.sub(r"\s+", " ", (t or "").replace(" ", " ")).strip().lower()

def seg_at(segs, p):
    for sg in segs:
        if sg[1] <= p < sg[2] or (sg[1] == p == sg[2]): return sg
    return None

def unit(s, segs, p, tag):
    """The editable slice around source index p: the clicked element's inner markup if the source
    has it, otherwise the string (or template text) the passage lives in."""
    sg = seg_at(segs, p)
    if not sg: return None
    kind, a, b, la, lb = sg
    if tag and kind in ("tpl", "html", "py3") and re.fullmatch(r"[a-z][a-z0-9]*", tag):
        lo, hi = (la, lb)
        opens = [m for m in re.finditer(r"<%s[\s>]" % tag, s[lo:p], re.I)]
        for m in reversed(opens):
            o = lo + m.start()
            between = s[o:p]
            if re.search(r"</%s\s*>" % tag, between, re.I): break
            gt = s.find(">", o)
            close = re.compile(r"</%s\s*>" % tag, re.I).search(s, p, hi)
            if gt < 0 or not close: break
            if close.start() - gt < 4000:
                return (kind, gt + 1, close.start())
            break
    if kind == "html":   # plain text between tags
        a2 = s.rfind(">", a, p) + 1 or a
        b2 = s.find("<", p, b); b2 = b if b2 < 0 else b2
        return (kind, max(a, a2), b2)
    return (kind, a, b)

_pages = {}
def page_text(page):
    """Plain text of a built page plus the local scripts it loads, to tell which source a passage on that page came from."""
    rel = unquote(urlparse(page or "").path).lstrip("/") or "index.html"
    fs = os.path.realpath(os.path.join(ROOT, rel))
    if os.path.isdir(fs): fs = os.path.join(fs, "index.html")
    if not fs.startswith(ROOT) or not os.path.isfile(fs): return ""
    key = (fs, os.path.getmtime(fs))
    if key in _pages: return _pages[key]
    h = open(fs, encoding="utf-8", errors="replace").read(); parts = [h]
    for src in re.findall(r'<script[^>]+src="([^"#?]+\.js)', h):
        p = os.path.realpath(os.path.join(os.path.dirname(fs), src))
        if p.startswith(ROOT) and os.path.isfile(p): parts.append(open(p, encoding="utf-8", errors="replace").read())
    t = "\n".join(parts); t = project(t, 0, len(t), "tpl")[0]
    _pages.clear(); _pages[key] = t
    return t

def locate(text, tag, page=""):
    t = norm(text)
    if not t: return []
    words = t.split(" ")
    found = {}   # (file, a, b) -> score
    srcs = sources()
    if len(words) < 3:
        for rel, s, segs, proj, idx in srcs:
            start = 0
            while True:
                j = proj.find(t, start)
                if j < 0: break
                start = j + 1
                u = unit(s, segs, idx[j], tag)
                if not u: continue
                up, _ = project(s, u[1], u[2], u[0])
                if norm(up) == t: found[(rel, u)] = found.get((rel, u), 0) + 10
    else:
        for w in (12, 8, 5, 3):
            if len(words) < w and w != 3: continue
            wins = [" ".join(words[i:i + w]) for i in range(0, max(1, len(words) - w + 1))]
            for rel, s, segs, proj, idx in srcs:
                for win in wins:
                    if len(win) < 8: continue
                    start = 0
                    while True:
                        j = proj.find(win, start)
                        if j < 0: break
                        start = j + 1
                        u = unit(s, segs, idx[j], tag)
                        if u and u[2] - u[1] < 20000: found[(rel, u)] = found.get((rel, u), 0) + w
            if found: break
    pt = page_text(page)
    if pt and found:   # prefer the sources whose text actually ends up on this page
        onpage = {}
        for (rel, u), sc in found.items():
            s = next(x[1] for x in srcs if x[0] == rel)
            words = [w for w in re.findall(r"[a-z’'\-]+", project(s, u[1], u[2], u[0])[0]) if len(w) > 1]
            chunk = " ".join(words[:8])
            if len(chunk) > 12 and chunk in re.sub(r"[^a-z’'\- ]+", " ", pt).replace("  ", " "):
                onpage[(rel, u)] = sc + 1000
        if onpage: found = onpage
    out = []
    for (rel, (kind, a, b)), score in sorted(found.items(), key=lambda kv: -kv[1])[:8]:
        s = next(x[1] for x in srcs if x[0] == rel)
        raw = s[a:b]
        out.append({"file": rel, "start": a, "end": b, "kind": kind, "line": s.count("\n", 0, a) + 1,
                    "raw": raw, "text": unesc(raw, kind), "score": score, "sha": hashlib.sha1(raw.encode()).hexdigest()})
    return out

def unesc(raw, kind):
    if kind not in ("dq", "sq"): return raw
    return re.sub(r"\\(.)", lambda m: {"n": "\n", "t": "\t"}.get(m.group(1), m.group(1)), raw)

def esc(text, kind):
    if kind == "py3":
        return text
    if kind in ("dq", "sq"):
        q = '"' if kind == "dq" else "'"
        return text.replace("\\", "\\\\").replace(q, "\\" + q).replace("\n", "\\n")
    if kind == "tpl":
        return re.sub(r"(?<!\\)`", r"\\`", text)
    return text


# ---------------------------------------------------------------- checks, saving, undo
def js_check(path, real=None):
    """'' if the file parses, otherwise the error. JavaScript: node if installed, else macOS's own engine. Python and JSON too."""
    real = real or path
    if real.endswith(".py"):
        r = subprocess.run([sys.executable, "-c", "import ast,sys; ast.parse(open(sys.argv[1], encoding='utf-8').read())", path], capture_output=True, text=True)
        return "" if r.returncode == 0 else (r.stderr.strip().splitlines() or ["syntax error"])[-1]
    if real.endswith(".json"):
        try: json.load(open(path, encoding="utf-8")); return ""
        except ValueError as e: return str(e)
    if not real.endswith(".js"): return ""
    if not path.endswith(".js"):
        shutil.copy(path, path + ".js"); path = path + ".js"; cleanup = True
    else: cleanup = False
    try: return _js_check(path)
    finally:
        if cleanup: os.remove(path)

def _js_check(path):
    if shutil.which("node"):
        r = subprocess.run(["node", "--check", path], capture_output=True, text=True)
        if r.returncode == 0: return ""
        lines = [l for l in r.stderr.splitlines() if l.strip()]
        return next((l for l in lines if "Error" in l), lines[-1] if lines else "syntax error")
    if shutil.which("osascript"):
        jxa = ('function run(argv){ObjC.import("Foundation");const s=$.NSString.stringWithContentsOfFileEncodingError(argv[0],4,null).js;'
               'try{new Function(s);return ""}catch(e){if(/regular expression/i.test(e.message))return "";return e.message+(e.line?" (near line "+e.line+")":"")}}')
        r = subprocess.run(["osascript", "-l", "JavaScript", "-e", jxa, path], capture_output=True, text=True)
        return r.stdout.strip()
    return ""

LOCK = threading.Lock()
UNDO = []   # (path, backup_path)

def save(d):
    rel, a, b = d["file"], int(d["start"]), int(d["end"])
    path = os.path.realpath(os.path.join(ROOT, rel))
    if not path.startswith(BUILD + os.sep) or not path.endswith(SRC_EXT) or "/gen/" in path:
        return {"ok": False, "error": "That file can't be edited here."}
    with LOCK:
        s = open(path, encoding="utf-8").read()
        if hashlib.sha1(s[a:b].encode()).hexdigest() != d["sha"]:
            return {"ok": False, "error": "This passage changed since you opened it (another edit or a build). Close the panel and click it again."}
        new = esc(d["text"], d["kind"])
        if d["kind"] == "tpl" and new.count("${") != s[a:b].count("${"):
            return {"ok": False, "error": "Please don't add or remove ${...} parts: they're code that fills in the example."}
        s2 = s[:a] + new + s[b:]
        os.makedirs(BACKUPS, exist_ok=True)
        bk = os.path.join(BACKUPS, time.strftime("%Y%m%d-%H%M%S-") + rel.replace(os.sep, "__"))
        shutil.copy2(path, bk)
        tmp = path + ".sa-edit.tmp"
        open(tmp, "w", encoding="utf-8").write(s2)
        err = js_check(tmp, path)
        if err:
            os.remove(tmp)
            return {"ok": False, "error": "Not saved: that change would break the page's code. " + err}
        os.replace(tmp, path)
        UNDO.append((path, bk))
        BUILDER.snap = BUILDER.scan()   # the watcher shouldn't queue a second build for this save
        BUILDER.kick()
        return {"ok": True, "file": rel, "gen": BUILDER.gen}

def undo():
    with LOCK:
        if not UNDO: return {"ok": False, "error": "Nothing to undo in this session."}
        path, bk = UNDO.pop()
        shutil.copy2(bk, path)
        os.utime(path)
        BUILDER.snap = BUILDER.scan()
        BUILDER.kick()
        return {"ok": True, "file": os.path.relpath(path, ROOT), "gen": BUILDER.gen}


# ---------------------------------------------------------------- watch + build
class Builder:
    def __init__(self):
        self.gen, self.state, self.msg, self.dirty = 0, "idle", "", False
        self.cv = threading.Condition()
        self.snap = self.scan()
    def scan(self):
        m = {}
        for dp, dns, fns in os.walk(BUILD):
            dns[:] = [d for d in dns if d not in SKIP_DIRS and not d.startswith(".")]
            for fn in fns:
                if fn.startswith(".") or fn.endswith(("~", ".swp", ".tmp", ".pyc")): continue
                p = os.path.join(dp, fn)
                try: m[p] = os.path.getmtime(p)
                except OSError: pass
        return m
    def kick(self):
        with self.cv: self.dirty = True; self.cv.notify()
    def watch(self):
        while True:
            time.sleep(1)
            snap = self.scan()
            if snap != self.snap:
                changed = [os.path.relpath(p, ROOT) for p in set(snap) | set(self.snap) if snap.get(p) != self.snap.get(p)]
                self.snap = snap
                print(time.strftime("%H:%M:%S"), "saved:", ", ".join(sorted(changed))[:200], flush=True)
                time.sleep(1); self.snap = self.scan(); self.kick()
    def run(self):
        while True:
            with self.cv:
                while not self.dirty: self.cv.wait()
                self.dirty = False
            self.state = "building"
            out, ok = "", True
            for _ in range(3):
                r = subprocess.run(["bash", "build/build_all.sh"], cwd=ROOT, capture_output=True, text=True)
                out = r.stdout + r.stderr
                ok = not re.search(r"Traceback|Error", out)
                if ok or "PermissionError" not in out: break
                time.sleep(3)
            self.snap = self.scan()
            self.msg = "" if ok else "\n".join(out.splitlines()[-12:])
            self.state = "idle" if ok else "failed"
            self.gen += 1
            print(time.strftime("%H:%M:%S"), "build", "done" if ok else "FAILED:\n" + self.msg, flush=True)
            notify("Rebuilt" if ok else "Build failed", "Reload the page." if ok else "See the Edit Mode window.")

def notify(title, text):
    if shutil.which("osascript"):
        subprocess.run(["osascript", "-e", 'display notification "%s" with title "SilverApps" subtitle "%s"' % (text, title)], capture_output=True)

BUILDER = Builder()


# ---------------------------------------------------------------- HTTP
INJECT = ('<link rel="stylesheet" href="/__edit/editor.css"><script>window.__SAE={token:"%s"}</script>'
          '<script src="/__edit/editor.js" defer></script>')

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def log_message(self, *a): pass
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()
    def host_ok(self):
        h = (self.headers.get("Host") or "").split(":")[0]
        return h in ("localhost", "127.0.0.1")
    def send_json(self, obj, code=200):
        b = json.dumps(obj).encode()
        self.send_response(code); self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        if not self.host_ok(): return self.send_error(403)
        path = unquote(urlparse(self.path).path)
        if path.startswith("/__edit/"):
            name = path[len("/__edit/"):]
            if name == "status":
                return self.send_json({"gen": BUILDER.gen, "state": BUILDER.state, "dirty": BUILDER.dirty, "msg": BUILDER.msg, "undo": len(UNDO)})
            if name in ("editor.js", "editor.css"):
                b = open(os.path.join(HERE, name), "rb").read()
                self.send_response(200); self.send_header("Content-Type", "text/javascript" if name.endswith(".js") else "text/css"); self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b); return
            return self.send_error(404)
        fs = os.path.join(ROOT, path.lstrip("/"))
        if os.path.isdir(fs): fs = os.path.join(fs, "index.html")
        if fs.endswith(".html") and os.path.isfile(fs):
            t = open(fs, encoding="utf-8", errors="replace").read()
            inj = INJECT % TOKEN
            t = re.sub(r"(?i)</body>", inj + "</body>", t, count=1) if re.search(r"(?i)</body>", t) else t + inj
            b = t.encode()
            self.send_response(200); self.send_header("Content-Type", "text/html; charset=utf-8"); self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b); return
        return super().do_GET()
    def do_POST(self):
        if not self.host_ok() or self.headers.get("X-Edit-Token") != TOKEN: return self.send_error(403)
        try: d = json.loads(self.rfile.read(int(self.headers.get("Content-Length") or 0)) or b"{}")
        except ValueError: return self.send_error(400)
        path = urlparse(self.path).path
        try:
            if path == "/__edit/locate": return self.send_json({"hits": locate(d.get("text", ""), (d.get("tag") or "").lower(), d.get("page", ""))})
            if path == "/__edit/save": return self.send_json(save(d))
            if path == "/__edit/undo": return self.send_json(undo())
        except Exception as e:
            return self.send_json({"ok": False, "error": "Edit mode error: %s" % e})
        return self.send_error(404)

def main():
    nums = [a for a in sys.argv[1:] if a.isdigit()]
    port = int(nums[0]) if nums else 8000
    while True:
        with socket.socket() as so:
            if so.connect_ex(("127.0.0.1", port)) != 0: break
        port += 1
    srv = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    threading.Thread(target=BUILDER.watch, daemon=True).start()
    threading.Thread(target=BUILDER.run, daemon=True).start()
    url = "http://localhost:%d/" % port
    print("SilverApps edit mode: %s  (this Mac only)\nTurn on Edit in the page's corner, click any text, change it, Save.\nClose this window or press Ctrl+C to stop." % url, flush=True)
    if "--no-open" not in sys.argv: threading.Timer(1, lambda: webbrowser.open(url)).start()
    try: srv.serve_forever()
    except KeyboardInterrupt: print("\nStopped.")

if __name__ == "__main__":
    main()
