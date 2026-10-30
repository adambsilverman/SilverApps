"""Make assets/solfege-voice.js from recordings of the instructor singing solfège (Ear Training "Sing it back").
Input: voice_1-G2.wav, voice_1-B2.wav, voice_1-Eb3.wav, voice_1-G3.wav, voice_1-B3.wav, voice_1-Eb4.wav (mono 44.1 kHz; convert the .m4a recordings with
  ffmpeg -i "voice_1-G2.m4a" -ac 1 -ar 44100 voice_1-G2.wav), each made by singing along with the recording-kit guide tracks:
  17 syllables in the order do re mi fa sol la ti di ri fi si li ra me se le te, one syllable every 2 seconds in the current recordings (the period is fitted, so any steady tempo works).
Steps: 1) find the 17 sung segments by loudness; 2) measure each clip's tuning and vowel onset; 3) level, fade and pack them into
one MP3 sprite per pitch; 4) write the JS file. Run from the folder holding the WAVs: python3 make_voice.py"""

# ---- 1. segment ----
import numpy as np, wave, sys, json
SR=44100
def load(f):
    w=wave.open(f); d=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(float)/32768; return d
def f0(x):
    # autocorrelation pitch 70-500 Hz
    x=x-x.mean(); n=len(x); c=np.correlate(x,x,'full')[n-1:]; lo,hi=int(SR/500),int(SR/70)
    c=c/ (c[0]+1e-9); i=lo+np.argmax(c[lo:hi]); return SR/i, c[i]
def midi(f): return 69+12*np.log2(f/440)
out={}
for name,exp in [("G2",43),("B2",47),("Eb3",51),("G3",55),("B3",59),("Eb4",63)]:
    d=load(f"voice_1-{name}.wav"); hop=441; fr=len(d)//hop
    e=np.array([np.sqrt(np.mean(d[i*hop:(i+1)*hop]**2)) for i in range(fr)])
    edb=20*np.log10(e+1e-9); thr=np.max(edb)-28
    on=edb>thr; segs=[]; i=0
    while i<fr:
        if on[i]:
            j=i
            while j<fr and (on[j] or (j+8<fr and on[j:j+8].any())): j+=1
            if (j-i)*hop/SR>.35: segs.append((i*hop/SR,j*hop/SR))
            i=j
        else: i+=1
    res=[]
    for a,b in segs:
        mid=d[int((a+.15)*SR):int((a+.15)*SR)+4096]
        f,cl=f0(mid); res.append((round(a,2),round(b-a,2),round(float(midi(f))-exp,2),round(float(cl),2)))
    out[name]=res
    print(name,len(segs)); print(res)
json.dump(out,open('segs.json','w'))

# ---- 2-3. clips and sprites (each clip is cut 0.25 s before the beat the singer placed on the guide's click grid) ----
EXP={"G2":43,"B2":47,"Eb3":51,"G3":55,"B3":59,"Eb4":63}
segs=json.load(open('segs.json'))
def load(f):
    w=wave.open(f); return np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(float)/32768
def clar(x):
    x=x-x.mean(); n=len(x); c=np.correlate(x,x,'full')[n-1:]; c=c/(c[0]+1e-12); lo,hi=int(SR/500),int(SR/70); i=lo+np.argmax(c[lo:hi]); return SR/i,c[i]
def midi(f): return 69+12*np.log2(f/440)
SLOT=1.8; PRE=.5; PREROLL=.25; meta={}
for n,ss in segs.items():
    d=load(f"voice_1-{n}.wav"); spr=np.zeros(int(SR*(PRE+SLOT*len(ss)+.5))); clips=[]
    on=np.array([q[0] for q in ss]); kk=np.arange(len(on)); P,T0=np.polyfit(kk,on,1)
    for k,(a,L,_,_) in enumerate(ss):
        beat=T0+P*k-.001                      # where the singer placed the beat (click grid), not the loudness onset
        st=beat-PREROLL; en=min(a+L+.08, beat+1.3)
        x=d[int(st*SR):int(en*SR)].copy()
        # voicing onset
        vo=None
        for t in np.arange(0,len(x)/SR-.05,.01):
            f,c=clar(x[int(t*SR):int(t*SR)+1500])
            if c>.55 and 70<f<500: vo=t; break
        if vo is None: vo=.15
        tune_from=vo
        # tuning (median over vowel; fold octave errors)
        ps=[]
        for t in np.arange(max(vo,PREROLL)+.1,len(x)/SR-.15,.04):
            f,c=clar(x[int(t*SR):int(t*SR)+3000])
            if c>.6:
                m=midi(f)-EXP[n]; m=(m+6)%12-6; ps.append(m)
        tune=float(np.median(ps)) if ps else 0.0
        # loudness: RMS over the vowel
        v=x[int((max(vo,PREROLL)+.05)*SR):int((max(vo,PREROLL)+.5)*SR)]; x=x*(.12/ (np.sqrt(np.mean(v**2))+1e-9))
        fi=int(.06*SR); fo=int(.08*SR); x[:fi]*=np.linspace(0,1,fi); x[-fo:]*=np.linspace(1,0,fo)
        x=np.clip(x,-.98,.98)
        off=PRE+k*SLOT; spr[int(off*SR):int(off*SR)+len(x)]+=x
        clips.append({"s":SY[k],"off":round(off,3),"dur":round(len(x)/SR,3),"lead":PREROLL,"vo":round(vo,3),"tune":round(tune,2)})
    pcm=(spr*32767).astype(np.int16); w=wave.open(f"spr-{n}.wav","wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
    subprocess.run(["ffmpeg","-y","-loglevel","error","-i",f"spr-{n}.wav","-ar","22050","-ac","1","-b:a","40k",f"spr-{n}.mp3"])
    meta[n]={"m":EXP[n],"clips":clips}
    print(n, [(c["s"],c["lead"],c["tune"]) for c in clips])
json.dump(meta,open('meta.json','w'))
import os; print({f:os.path.getsize(f) for f in os.listdir('.') if f.endswith('.mp3')})

# ---- 4. package ----
import base64
out = []
for n, a in meta.items():
    clips = {c["s"]: [c["off"], c["dur"], c["lead"], c["tune"]] for c in a["clips"]}
    out.append({"name": n, "m": a["m"], "clips": clips, "mp3": base64.b64encode(open(f"spr-{n}.mp3", "rb").read()).decode()})
open("solfege-voice.js", "w").write("window.SOLFEGE_VOICE = " + json.dumps(out, separators=(",", ":")) + ";\n")
