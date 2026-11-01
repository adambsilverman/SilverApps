"""Build assets/rhymes.txt for the Lyrics rhyme generator: the most common English words with CMU pronunciations.
Needs: pip install pronouncing wordfreq. Run: python3 build/tools/rhymes_build.py (output is committed; not part of build_all)."""
import pronouncing, wordfreq, re, pathlib
BLOCK = set("""fuck fucking fucked fucker shit shitty bitch bitches cunt dick dicks cock cocks pussy whore slut fag faggot nigger nigga niggas retard retarded twat wank wanker bastard asshole motherfucker tits titty boob boobs dildo cum jizz porn porno rape raped rapist spic chink kike tranny dyke homo""".split())
d = pronouncing.cmudict.dict() if hasattr(pronouncing.cmudict, "dict") else None
pronouncing.init_cmu(); pr = pronouncing.pronunciations
cmu = {}
for w, p in pr: cmu.setdefault(w, p)
out = []
for w in wordfreq.top_n_list("en", 60000):
    if not re.fullmatch(r"[a-z]+(?:'[a-z]+)?", w) or w in BLOCK or w not in cmu: continue
    if len(w) == 1 and w not in ("a", "i"): continue
    out.append(f"{w}|{cmu[w]}")
    if len(out) >= 22000: break
p = pathlib.Path(__file__).resolve().parents[2] / "assets" / "rhymes.txt"
p.write_text("\n".join(out) + "\n", encoding="utf-8"); print(len(out), p.stat().st_size)
