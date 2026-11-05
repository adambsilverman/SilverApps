#!/bin/sh
# Regenerates assets/count-voice/*.wav (the spoken counting syllables used by the engine's withCount / "Play with counting").
# Voice: Piper TTS, en-us "Ryan" high (voice data: RyanSpeech, CC BY-NC-SA 4.0, from github.com/rhasspy/piper releases v0.0.2).
#   pip install piper-tts ; curl -LO https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-en-us-ryan-high.tar.gz ; tar xzf voice-en-us-ryan-high.tar.gz
# Needs ffmpeg and python3 + numpy. Run from the folder holding the .onnx model; writes into OUT.
# Any other voice works too (e.g. on a Mac: say -v Samantha -o x.aiff "one"), as long as files keep these names
# and start right at the sound (leading silence trimmed), mono, about 0.15-0.4 s long.
OUT=${1:-../../assets/count-voice}
mkdir -p raw "$OUT"
for pair in 1:one 2:two 3:three 4:four 5:five 6:six 7:seven 8:eight 9:nine 10:ten 11:eleven 12:twelve e:ee and:and a:uh trip:trip let:let la:la li:lee; do
  k=${pair%%:*}; t=${pair#*:}
  echo "$t" | piper -m en-us-ryan-high.onnx -f raw/$k.wav --length-scale 0.75
  ffmpeg -loglevel error -y -i raw/$k.wav -af "silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.004,areverse,silenceremove=start_periods=1:start_threshold=-45dB,afade=t=in:d=0.03,areverse,afade=t=in:d=0.003,aresample=22050" -ac 1 -c:a pcm_s16le "$OUT/$k.wav"
done
# even loudness: RMS to 0.16 of full scale, peaks capped at 0.9
python3 - "$OUT" <<'PY'
import sys, glob, wave, numpy as np
for f in glob.glob(sys.argv[1] + "/*.wav"):
    w = wave.open(f); sr = w.getframerate(); a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float); w.close()
    g = min(0.16 * 32767 / np.sqrt((a ** 2).mean()), 0.9 * 32767 / abs(a).max()); a = (a * g).clip(-32767, 32767).astype(np.int16)
    w = wave.open(f, "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(a.tobytes()); w.close()
PY
