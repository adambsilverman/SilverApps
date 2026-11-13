
"use strict";
const LANGS = {en:"English", fr:"French", de:"German", it:"Italian"};
const FAMS = ["Strings","Woodwinds","Brass","Keyboards","Percussion"];
const FOREIGN = ["fr","de","it"];
const DIRS = {toEn:"Foreign → English", fromEn:"English → Foreign", mix:"Mixed directions"};
const D = [
["Strings",1,["strings"],["cordes"],["Streicher"],["archi"]],
["Strings",0,["violin"],["violon"],["Violine","Geige"],["violino"]],
["Strings",0,["viola"],["alto"],["Viola","Viole","Bratsche"],["viola"]],
["Strings",0,["violoncello"],["violoncelle"],["Violoncello","Cello"],["violoncello"]],
["Strings",0,["double bass","string bass"],["contrebasse"],["Kontrabass"],["contrabasso"]],
["Strings",0,["guitar"],["guitare"],["Gitarre"],["chitarra"]],
["Strings",0,["harp"],["harpe"],["Harfe"],["arpa"]],
["Strings",0,["mute on"],["avec sourdine"],["mit Dämpfer"],["con sordino"]],
["Strings",0,null,["sur la touche"],["am Griffbrett"],["sul tasto"]],
["Strings",0,null,["sur le chevalet"],["am Steg"],["sul ponticello"]],
["Woodwinds",1,["wind instruments"],["instruments à vent"],["Blasinstrumente"],["strumenti a fiato"]],
["Woodwinds",0,["woodwind instruments"],["les bois","instruments à vent en bois"],["Holzblasinstrumente"],["legno"]],
["Woodwinds",0,["flute"],["flûte"],["Flöte"],["flauto"]],
["Woodwinds",0,["oboe"],["hautbois"],["Oboe"],["oboe"]],
["Woodwinds",0,["clarinet"],["clarinette"],["Klarinette"],["clarinetto"]],
["Woodwinds",0,["bass clarinet"],["clarinette basse"],["Bassklarinette"],["clarinetto basso"]],
["Woodwinds",0,["bassoon"],["basson"],["Fagott"],["fagotto"]],
["Woodwinds",0,["English horn"],["cor anglais"],["Englischhorn"],["corno inglese"]],
["Woodwinds",0,["saxophone"],["saxophone"],["Saxophon"],["sassofono","saxofono"]],
["Woodwinds",0,["piccolo"],["piccolo","flûte piccolo","petite flûte"],["Pikkoloflöte","Piccolo","kleine Flöte"],["ottavino","flauto piccolo"]],
["Woodwinds",0,["fluttertongue"],null,["Flatterzunge (flz.)"],["frullato (frull.)"]],
["Brass",1,["brass instruments"],["instruments à vent de cuivre","cuivres"],["Blechblasinstrumente"],["ottone"]],
["Brass",0,["horn"],["cor"],["Horn"],["corno"]],
["Brass",0,["trumpet"],["trompette"],["Trompete"],["tromba","clarino"]],
["Brass",0,["trombone"],["trombone"],["Posaune"],["trombone"]],
["Brass",0,["bass trombone"],["basse-trombone","trombone basse"],["Bass Posaune"],["trombone basso"]],
["Brass",0,["tuba"],["tuba"],["Tuba"],["tuba"]],
["Brass",0,["euphonium"],["euphonium"],["Euphonium"],["eufonio"]],
["Keyboards",1,["keyboard instrument"],["instrument à clavier"],["Tasteninstrumente"],["strumenti a tastiera"]],
["Keyboards",0,["celesta"],["célesta"],["Celesta"],["celesta"]],
["Keyboards",0,["harpsichord"],["clavecin"],["Cembalo","Clavicembalo"],["clavicembalo"]],
["Keyboards",0,["organ"],["orgue"],["Orgel"],["organo"]],
["Keyboards",0,["piano"],["piano"],["Piano","Klavier"],["piano"]],
["Percussion",1,["percussion instruments"],["instruments à percussion"],["Schlaginstrumente","Perkussionsinstrumente"],["strumenti a percussione"]],
["Percussion",0,["bass drum"],["grosse caisse"],["Große Trommel"],["cassa","grancassa","gran cassa"]],
["Percussion",0,["cymbals"],["cymbales"],["Becken"],["piatti"]],
["Percussion",0,["drum"],["tambour"],["Trommel"],["tamburo"]],
["Percussion",0,["glockenspiel"],["glockenspiel","jeu de timbres"],["Glockenspiel"],["glockenspiel","campanelli"]],
["Percussion",0,["marimba"],["marimba"],["Marimbaphon"],["marimba"]],
["Percussion",0,["snare drum"],["caisse claire"],["Leinentrommel"],["tamburo rullante","tamburo militare","rullante"]],
["Percussion",0,["timpani"],["timbales"],["Pauken"],["timpano"]],
["Percussion",0,["tubular bells"],["cloches tubulaires"],["Röhrenglocken"],["campane tubolari"]],
["Percussion",0,["xylophone"],["xylophone"],["Xylophon"],["xilofono"]],
].map(r=>({fam:r[0],group:!!r[1],en:r[2],fr:r[3],de:r[4],it:r[5]}));

const ACCENTS = {fr:["à","â","é","è","ê","ë","î","ï","ô","û","ù","ç"],de:["ä","ö","ü","ß"],it:["à","è","é","ì","ò","ù"],en:[]};

const store = {get(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const CFG = Object.assign({dir:"toEn",langs:[...FOREIGN],mode:"choice",len:"10",fams:[...FAMS],secs:"30",goal:"70"}, store.get(" oft-settings".trim())||store.get("inq-settings2")||{});

const $ = s=>document.querySelector(s);
const app = $("#app");
const rand = n=>Math.floor(Math.random()*n);
const pick = a=>a[rand(a.length)];
const shuffle = a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=rand(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
const strip = s=>s.replace(/\s*\(.*?\)\s*/g," ").trim();
const fold = s=>strip(s).toLowerCase().replace(/ß/g,"ss").normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[-‐]/g," ").replace(/[^a-z0-9 ]/g,"").replace(/\s+/g," ").trim();
const exact = s=>strip(s).toLowerCase().replace(/[-‐]/g," ").replace(/\s+/g," ").trim();
const esc = s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const ALPH = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const randId = (n=10)=>Array.from(crypto.getRandomValues(new Uint8Array(n)),b=>ALPH[b%32]).join("");
const pctR = p=>Math.round(p||0);
const PRAISE = ["Correct.","Right.","Yes.","Exactly.","Nicely done."];
const setMeta = h=>{$("#topmeta").innerHTML=h};
const saveCfg = ()=>store.set("oft-settings",CFG);

/* ================= questions ================= */
/* Difficulty: how far the prompt is from its answer (0 = same word). Same-name and near-identical pairs
   (piano = piano, Oboe = oboe, Violine = violin) are left out; the least guessable pairs are weighted up. */
const MIN_DIST=0.3;
function lev(a,b){const n=b.length;let p=Array.from({length:n+1},(_,j)=>j);for(let i=1;i<=a.length;i++){const c=[i];for(let j=1;j<=n;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c}return p[n]}
const dist=(a,b)=>{a=fold(a).replace(/ /g,"");b=fold(b).replace(/ /g,"");return lev(a,b)/Math.max(a.length,b.length,1)};
const comboCache=new Map();
function combos(row,cfg){
  const key=D.indexOf(row)+"|"+cfg.dir+"|"+cfg.langs.slice().sort().join("");
  if(comboCache.has(key)) return comboCache.get(key);
  const out=[];
  if(row.en){
    const dirs=cfg.dir==="mix"?["toEn","fromEn"]:[cfg.dir];
    for(const l of cfg.langs){ if(!row[l]) continue;
      for(const d of dirs){ const [f,t]=d==="toEn"?[l,"en"]:["en",l];
        for(const p of row[f]){ const dd=Math.min(...row[t].map(a=>dist(p,a))); if(dd>=MIN_DIST) out.push({f,t,prompt:strip(p),w:dd*dd}); } } }
  }
  comboCache.set(key,out); return out;
}
const wpick=a=>{let r=Math.random()*a.reduce((x,c)=>x+c.w,0);for(const c of a){r-=c.w;if(r<=0)return c}return a[a.length-1]};
const rowWeight=(ri,cfg)=>Math.max(...combos(D[ri],cfg).map(c=>c.w));
/* weighted random order: harder rows tend to come first */
const weightedOrder=(ris,cfg)=>ris.map(ri=>[ri,Math.pow(Math.random(),1/rowWeight(ri,cfg))]).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
const eligible = cfg=>D.map((r,i)=>i).filter(i=>cfg.fams.includes(D[i].fam)&&combos(D[i],cfg).length);
function makeQ(ri,cfg){
  const row=D[ri]; const c=wpick(combos(row,cfg)); const {f,t}=c;
  const q={id:randId(6),ri,f,t,prompt:c.prompt,group:row.group,fam:row.fam,kind:cfg.mode};
  if(q.kind==="choice"){
    const correct=row[t][0]; const bad=new Set(row[t].map(fold)); const opts=[];
    const sameFam=shuffle(D.filter(r=>r!==row&&r[t]&&r.fam===row.fam)), others=shuffle(D.filter(r=>r!==row&&r[t]&&r.fam!==row.fam));
    for(const r of [...sameFam,...others]){const w=r[t][0];if(!bad.has(fold(w))&&!opts.some(o=>fold(o)===fold(w)))opts.push(w);if(opts.length===3)break}
    q.options=shuffle([correct,...opts]); q.correct=correct;
  }
  return q;
}
function deck(cfg){let pool=[];return ()=>{if(!pool.length)pool=weightedOrder(eligible(cfg),cfg).reverse();return pool.pop()}}
const revealOf = q=>({correct:q.correct||null, accepted:D[q.ri][q.t], row:{en:D[q.ri].en,fr:D[q.ri].fr,de:D[q.ri].de,it:D[q.ri].it}});
const publicQ = q=>({id:q.id,f:q.f,t:q.t,prompt:q.prompt,group:q.group,fam:q.fam,kind:q.kind,options:q.options});
/* other common names that count as correct when typed (keys are entries in D) */
const ALT = {
  "strings":["string instruments","string section","string"],
  "violin":["fiddle"],
  "violoncello":["cello","cellos"],
  "double bass":["bass","contrabass","upright bass","string bass"],
  "string bass":["bass","contrabass","upright bass","double bass"],
  "mute on":["with mute","with mutes","muted","mute","mutes on","con sordino"],
  "wind instruments":["winds","wind","wind instrument"],
  "woodwind instruments":["woodwinds","woodwind","woodwind instrument","winds","wind"],
  "piccolo":["piccolo flute"],
  "English horn":["cor anglais"],
  "saxophone":["sax"],
  "fluttertongue":["flutter tongue","flutter tonguing","fluttertonguing","flutter"],
  "brass instruments":["brass","brass instrument"],
  "horn":["French horn"],
  "keyboard instrument":["keyboard instruments","keyboards","keyboard"],
  "piano":["pianoforte"],
  "organ":["pipe organ"],
  "celesta":["celeste"],
  "percussion instruments":["percussion","percussion instrument"],
  "cymbals":["cymbal","crash cymbals","clash cymbals"],
  "drum":["drums"],
  "glockenspiel":["orchestra bells","bells"],
  "snare drum":["snare","side drum"],
  "timpani":["kettledrums","kettle drums","kettledrum","timpano"],
  "tubular bells":["chimes"],
  "bassoon":["bassoons"],
  "violoncelle":["cello"],
  "Violoncello":["Cello"],
};
function gradeTyped(list,v){
  v=(v||"").trim(); if(!v) return {ok:false};
  list=list.flatMap(a=>[a,...(ALT[a]||[])]);
  const variants=list.flatMap(a=>{const m=a.match(/\((.*?)\)/);return m?[a,m[1]]:[a]});
  const hx=variants.find(a=>exact(a)===exact(v)), hl=variants.find(a=>fold(a)===fold(v));
  return {ok:!!(hx||hl), spelling: !hx&&hl ? strip(hl) : null};
}
function grade(q,ans,rev){
  if(ans==null) return {ok:false,none:true};
  if(q.kind==="choice") return {ok:q.options[ans]===rev.correct};
  return gradeTyped(rev.accepted,ans);
}

/* ================= question UI ================= */
function promptHTML(q){
  return `<div class="ask">What is the <b>${LANGS[q.t]}</b> for this ${LANGS[q.f]} term?${q.group?' <span class="tag">FAMILY TERM</span>':""}</div>
  <div class="staffline"><div class="qlabel" lang="${q.f}">${esc(q.prompt)}<small>${LANGS[q.f]}</small></div><div class="staff" aria-hidden="true"></div></div>`;
}
/* o: {display, onSubmit, giveUp, submitLabel} */
function renderQ(box,q,o={}){
  const t=q.t; let ui;
  if(q.kind==="choice"){
    const tag=o.display?"div":"button";
    ui=`<div class="options">${q.options.map((x,k)=>`<${tag} class="opt" ${o.display?"":'type="button"'} data-k="${k}"><span class="fill"></span><kbd>${"ABCD"[k]}</kbd><span class="txt" lang="${t}">${esc(x)}</span><span class="pct"></span></${tag}>`).join("")}</div>`;
  }else if(o.display){
    ui=`<p class="center muted">Students type the ${LANGS[t]} term on their devices.</p><div data-typedrev></div>`;
  }else{
    ui=`<form class="typed" autocomplete="off"><input lang="${t}" placeholder="Type the ${LANGS[t]} term" aria-label="Your answer in ${LANGS[t]}" spellcheck="false" autocapitalize="off" autocorrect="off"><button class="btn" type="submit">${o.submitLabel||"Check"}</button></form>
    ${ACCENTS[t].length?`<div class="accents" aria-label="Insert accented letter">${ACCENTS[t].map(a=>`<button type="button" data-a="${a}">${a}</button>`).join("")}</div>`:""}
    ${o.giveUp?`<div class="actions"><button class="btn ghost" type="button" data-giveup>Show answer</button></div>`:""}`;
  }
  box.innerHTML=promptHTML(q)+ui+`<div data-res></div>`;
  let locked=false; const inp=box.querySelector(".typed input");
  const ctl={
    res:box.querySelector("[data-res]"),
    lock(){locked=true;box.querySelectorAll("button.opt,.typed button,.accents button,[data-giveup]").forEach(b=>b.disabled=true);if(inp)inp.disabled=true},
    get locked(){return locked},
    submit(ans){if(locked)return;ctl.lock();if(q.kind==="choice"){const b=box.querySelector(`.opt[data-k="${ans}"]`);b&&b.classList.add("sel")}o.onSubmit&&o.onSubmit(ans)},
    preset(ans){if(ans==null){ctl.lock();return} if(q.kind==="choice"){const b=box.querySelector(`.opt[data-k="${ans}"]`);b&&b.classList.add("sel")}else if(inp)inp.value=ans;ctl.lock()},
    mark(rev,mine){
      if(q.kind==="choice"){box.querySelectorAll(".opt").forEach((b,j)=>{b.classList.remove("sel");if(q.options[j]===rev.correct)b.classList.add("right");else if(j===mine)b.classList.add("wrong")})}
      else if(inp){inp.classList.add(grade(q,mine,rev).ok?"right":"wrong")}
    },
    dist(counts,n){box.querySelectorAll(".opt").forEach((b,j)=>{const p=n?counts[j]/n*100:0;b.querySelector(".fill").style.width=p+"%";b.querySelector(".pct").textContent=n?pctR(p)+"%":""})},
  };
  if(!o.display){
    box.querySelectorAll("button.opt").forEach(b=>b.onclick=()=>ctl.submit(+b.dataset.k));
    if(inp){
      box.querySelector(".typed").onsubmit=e=>{e.preventDefault();if(inp.value.trim())ctl.submit(inp.value.trim())};
      box.querySelectorAll(".accents button").forEach(b=>b.onclick=()=>{const s=inp.selectionStart??inp.value.length,e2=inp.selectionEnd??s;inp.value=inp.value.slice(0,s)+b.dataset.a+inp.value.slice(e2);inp.focus();inp.setSelectionRange(s+1,s+1)});
      const g=box.querySelector("[data-giveup]"); if(g) g.onclick=()=>{if(!locked){ctl.lock();o.onSubmit&&o.onSubmit(null)}};
      if(o.focus!==false) inp.focus({preventScroll:true});
    }
  }
  if(o.shaker&&window.Shaker){const el=box.firstElementChild;Shaker.watch(()=>!locked&&!!el&&el.isConnected)}
  return ctl;
}
function rowcardHTML(row,f,t){
  return `<div class="rowcard">${Object.keys(LANGS).map(l=>`<div class="${l===t||l===f?"hit":""}"><b>${LANGS[l].toUpperCase()}</b>${row[l]?`<span lang="${l}">${row[l].map(esc).join("<br>")}</span>`:`<span class="na">${l==="en"?"(use Italian)":"N/A"}</span>`}</div>`).join("")}</div>`;
}
function feedbackHTML(q,g,rev,mine,extra=""){
  const all=rev.accepted.map(strip).join(" / ");
  let head, cls;
  if(g.none){head=`<span class="verdict">The ${LANGS[q.t]} is <b lang="${q.t}">${esc(all)}</b>.</span>`;cls="";}
  else if(g.ok){head=`<span class="verdict">${pick(PRAISE)}</span> ${rev.accepted.length>1?`Accepted terms: <span lang="${q.t}">${esc(all)}</span>. `:""}${g.spelling?`Watch the spelling: <b lang="${q.t}">${esc(g.spelling)}</b>.`:""}`;cls="ok";}
  else{const you=q.kind==="choice"?q.options[mine]:mine;head=`<span class="verdict">Not quite.</span> The ${LANGS[q.t]} is <b lang="${q.t}">${esc(all)}</b>. You ${q.kind==="choice"?"chose":"typed"} “${esc(you)}”.`;cls="no";}
  return `<div class="feedback ${cls}"><div>${head}</div>${rowcardHTML(rev.row,q.f,q.t)}${extra}</div>`;
}

/* ================= settings panel ================= */
const OPTS={
  dir:Object.entries(DIRS),
  mode:[["choice","Multiple choice"],["type","Type the answer"]],
  len:[["10","10 questions"],["20","20 questions"],["all","Every term"]],
  secs:[["20","20 s"],["30","30 s"],["45","45 s"],["60","1 min"],["0","No timer"]],
  goal:[["60","60%"],["70","70%"],["80","80%"],["90","90%"]],
};
const ROWLBL={dir:"Direction",langs:"Languages",fams:"Families",mode:"Answer",len:"Round",secs:"Time per question",goal:"Class goal"};
function settingsHTML(keys){
  return `<div class="set-body">${keys.map(k=>`<div class="set-row"><span class="label-sm" id="l-${k}">${ROWLBL[k]}</span><div class="seg" data-k="${k}" role="group" aria-labelledby="l-${k}">${
    (k==="langs"?FOREIGN.map(l=>[l,LANGS[l]]):k==="fams"?FAMS.map(f=>[f,f]):OPTS[k]).map(([v,tx])=>`<button type="button" data-v="${v}">${tx}</button>`).join("")}</div></div>`).join("")}</div>`;
}
function bindSettings(root,onChange){
  const paint=()=>root.querySelectorAll(".seg").forEach(seg=>{const k=seg.dataset.k;seg.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",Array.isArray(CFG[k])?CFG[k].includes(b.dataset.v):CFG[k]===b.dataset.v))});
  root.querySelectorAll(".seg").forEach(seg=>{const k=seg.dataset.k;seg.querySelectorAll("button").forEach(b=>b.onclick=()=>{
    const v=b.dataset.v;
    if(Array.isArray(CFG[k])){const i=CFG[k].indexOf(v);if(i>=0){if(CFG[k].length>1)CFG[k].splice(i,1)}else CFG[k].push(v)} else CFG[k]=v;
    saveCfg();paint();onChange&&onChange();
  })});
  paint();
}
function cfgSummary(c){
  const langTxt=c.langs.length===3?"":` (${FOREIGN.filter(l=>c.langs.includes(l)).map(l=>LANGS[l]).join(", ")})`;
  return `${DIRS[c.dir]}${langTxt} · ${c.mode==="choice"?"Multiple choice":"Typing"} · ${c.fams.length===5?"All families":FAMS.filter(f=>c.fams.includes(f)).join(", ")}`;
}
const cfgCopy = ()=>JSON.parse(JSON.stringify(CFG));

/* ================= home ================= */
const FRAMED = window.top!==window.self;
function home(){
  setMode(""); setMeta("");
  app.innerHTML=`<div class="card" style="gap:18px">
    <div><h2>Instrument names and score terms in four languages.</h2>
    <p class="lede" style="margin-top:8px">Run it live with a whole class on student devices (answers are anonymous), or practice on your own.</p></div>
    <div class="modes">
      <button class="mode" type="button" data-go="host"><span class="who">Instructor</span><b>Host a class game</b><span>Everyone answers the same question on student devices. You run the clock and reveal the answer with the class’s percent correct.</span></button>
      <button class="mode" type="button" data-go="join"><span class="who">Students</span><b>Join a game</b><span>Enter the room code from the screen. No name needed; answers are anonymous.</span></button>
      <button class="mode" type="button" data-go="solo"><span class="who">Anyone</span><b>Practice solo</b><span>Work at your own pace with instant feedback and a review of what you missed.</span></button>
    </div>
    
    
  </div>`;
  app.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>({host:hostSetup,join:()=>joinScreen(),solo:soloScreen})[b.dataset.go]());
}
function setMode(m){
  document.body.classList.toggle("host",m==="host");
  document.body.classList.toggle("wide",m==="host");
  $("#homebtn").hidden=!m;
  const pe=$("#practice"); pe.hidden=true; pe.innerHTML="";
}

/* ================= solo ================= */
let G=null;
function soloScreen(){
  setMode("solo");
  app.innerHTML=`<details class="settings" id="settings"><summary><span>Game settings</span><span class="now" id="nowSettings"></span></summary>
    ${settingsHTML(["dir","langs","fams","mode","len"])}<div class="set-actions" style="padding:0 16px 16px"><button class="btn" type="button" id="startBtn">Start new round</button></div></details>
    <section class="card" id="stage" style="margin-top:18px"></section>`;
  const sync=()=>{$("#nowSettings").textContent=cfgSummary(CFG);showBest()};
  bindSettings($("#settings"),sync); sync();
  $("#startBtn").onclick=()=>{$("#settings").open=false;newRound()};
  newRound();
}
const bestKey=()=>[CFG.dir,FOREIGN.filter(l=>CFG.langs.includes(l)).join("+"),CFG.mode,CFG.len,FAMS.filter(f=>CFG.fams.includes(f)).join("+")].join("|");
function soloMeta(){
  const b=(store.get("oft-best")||{})[bestKey()];
  setMeta(`<div class="tally"><b>${G?G.score:0}</b><span>Correct</span></div><div class="tally streak"><b>${G?G.streak:0}</b><span>Streak</span></div><div class="tally"><b>${b!=null?b+"%":"–"}</b><span>Best</span></div>`);
}
const showBest=soloMeta;
function newRound(rows){
  const cfg=cfgCopy();
  const pool=rows||weightedOrder(eligible(cfg),cfg);
  const n=rows||cfg.len==="all"?pool.length:Math.min(+cfg.len,pool.length);
  G={cfg,qs:pool.slice(0,n).map(ri=>makeQ(ri,cfg)),i:0,score:0,streak:0,bestStreak:0,missed:[],retry:!!rows};
  soloMeta(); soloAsk();
}
function soloAsk(){
  const q=G.qs[G.i]; const st=$("#stage");
  st.innerHTML=`<div class="progress"><span><b class="qapp">Orchestration Foreign Terms</b> · Question ${G.i+1} of ${G.qs.length}</span><div class="bar"><i style="width:${G.i/G.qs.length*100}%"></i></div><span>${q.fam}</span></div><div data-q style="display:flex;flex-direction:column;gap:16px"></div>`;
  G.ctl=renderQ(st.querySelector("[data-q]"),q,{giveUp:true,shaker:true,onSubmit:ans=>{
    const rev=revealOf(q); const g=grade(q,ans,rev); window.SFX&&SFX.play(g.ok); window.SAprogress&&SAprogress.record(q.fam,g.ok);
    G.ctl.mark(rev,ans);
    if(g.ok){G.score++;G.streak++;G.bestStreak=Math.max(G.bestStreak,G.streak)}else{G.streak=0;G.missed.push(q.ri)}
    soloMeta();
    const last=G.i===G.qs.length-1;
    G.ctl.res.innerHTML=feedbackHTML(q,g,rev,ans,`<div class="actions"><button class="btn" type="button" data-next>${last?"See results":"Next"} <span aria-hidden="true">→</span></button></div>`);
    const nb=G.ctl.res.querySelector("[data-next]");nb.onclick=soloNext;nb.focus({preventScroll:true});
  }});
}
function soloNext(){G.i++;G.ctl=null;G.i<G.qs.length?soloAsk():soloResults()}
function soloResults(){
  const pct=Math.round(G.score/G.qs.length*100);
  let prev=null;
  if(!G.retry){const best=store.get("oft-best")||{};prev=best[bestKey()];if(prev==null||pct>prev){best[bestKey()]=pct;store.set("oft-best",best)}}
  soloMeta();
  const msg=pct===100?"A perfect score. Try another direction or typing mode.":pct>=80?"Strong work. Review the misses below and go again.":pct>=50?"Getting there. The terms you missed are listed below.":"Keep at it. Study the misses below, then try again.";
  const missed=[...new Set(G.missed)];
  $("#stage").innerHTML=`
    <div class="progress"><span>Round complete</span><div class="bar"><i style="width:100%"></i></div><span>${G.qs.length} questions</span></div>
    <div style="display:flex;align-items:flex-end;gap:18px;flex-wrap:wrap"><div class="big-pct">${pct}%</div><div><h2>${G.score} of ${G.qs.length} correct</h2><p class="muted" style="margin:0">Longest streak: ${G.bestStreak}${prev!=null&&pct>prev?" · New best for these settings":""}</p></div></div>
    <p class="muted" style="margin:0">${msg}</p>
    ${missed.length?`<div class="misslist"><table><thead><tr><th>ENGLISH</th><th>FRENCH</th><th>GERMAN</th><th>ITALIAN</th></tr></thead><tbody>${missed.map(ri=>`<tr>${Object.keys(LANGS).map(l=>`<td lang="${l}">${D[ri][l]?D[ri][l].map(esc).join("<br>"):"<i>—</i>"}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`:""}
    <div class="actions">${missed.length?'<button class="btn ghost" type="button" id="retry">Retry missed terms</button>':""}<button class="btn" type="button" id="again">New round</button></div>`;
  $("#again").onclick=()=>newRound();
  const r=$("#retry");if(r)r.onclick=()=>newRound(shuffle(missed));
}

/* ================= network (MQTT over secure WebSocket — no accounts, no server to set up) ================= */
const PARAMS=new URLSearchParams(location.search), HASH=new URLSearchParams(location.hash.slice(1));
const BROKER_OVERRIDE=PARAMS.get("broker")||HASH.get("broker");
const TOP_URL=(()=>{try{return window.top.location.href}catch(e){return ""}})();
const isTopicURL=u=>/\/d2l\/le\/content\/\d+\/viewContent\/\d+\/View/i.test(u||"");
const TOPIC_PAGE=(()=>{
  if(isTopicURL(TOP_URL)){const u=new URL(TOP_URL);u.search="";u.hash="";try{localStorage.setItem("oft_topic",u.href)}catch(e){}return u.href}
  const h=HASH.get("topic")||PARAMS.get("topic");
  if(h&&isTopicURL(h)&&new URL(h,location.href).origin===location.origin) return new URL(h,location.href).href;
  return "";
})();
const JOIN_CODE=(()=>{
  let c=HASH.get("join")||PARAMS.get("join")||PARAMS.get("room");
  if(!c){try{const t=new URL(TOP_URL);c=t.searchParams.get("room")||t.searchParams.get("join")}catch(e){}}
  return c?c.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,5):null;
})();
const BROKERS=BROKER_OVERRIDE?[BROKER_OVERRIDE]:["wss://broker.hivemq.com:8884/mqtt","wss://broker.emqx.io:8084/mqtt","wss://test.mosquitto.org:8081/mqtt"];
const TOPIC=code=>`oft-live/v1/${code}`;
const brokerFor=code=>BROKERS[ALPH.indexOf(code[0])%BROKERS.length];
function connectTo(url){
  return new Promise((res,rej)=>{
    if(typeof mqtt==="undefined"){rej(new Error("no mqtt"));return}
    let done=false; let c;
    try{c=mqtt.connect(url,{clientId:"oft_"+randId(12),keepalive:30,reconnectPeriod:2500,connectTimeout:8000,clean:true})}catch(e){rej(e);return}
    const t=setTimeout(()=>{if(!done){done=true;c.end(true);rej(new Error("timeout"))}},9000);
    c.once("connect",()=>{if(!done){done=true;clearTimeout(t);res(c)}});
    c.on("error",e=>{if(!done){done=true;clearTimeout(t);c.end(true);rej(e)}});
  });
}
const fmtT=ms=>{const t=Math.ceil(ms/1000);return Math.floor(t/60)+":"+String(t%60).padStart(2,"0")};
function classMsg(p,n){if(!n)return "No answers this time.";p=pctR(p);return p>=90?"Nearly everyone got it.":p>=70?"Most of the class has this one.":p>=40?"About half the class. Worth a second look.":"A tricky one. Let’s review it."}
function endMsg(p){p=pctR(p);return p>=90?"Outstanding round!":p>=75?"Great work, everyone.":p>=50?"Solid progress.":"Good practice. These terms will stick with repetition."}
function goalHTML(cs){
  if(!cs||cs.avg==null) return `<div class="goal"><b>Class goal: ${cs?cs.goal:70}%</b><span class="muted">Every answer counts toward the class average.</span></div>`;
  const a=pctR(cs.avg),met=a>=cs.goal;
  return `<div class="goal"><div class="actions" style="justify-content:space-between"><b>Class average: ${a}%</b><span class="muted">Goal ${cs.goal}%${met?" · on track":""}</span></div>
    <div class="tbar"><i style="width:${a}%"></i><span class="mark" style="left:${cs.goal}%"></span></div>
    <span class="muted small">${met?"The class is above the goal. Keep it going.":"Keep going together; every question is a fresh chance."} (${cs.done} question${cs.done===1?"":"s"} so far)</span></div>`;
}
function classBarHTML(p,n){if(!n)return "";const g=pctR(p);return `<div class="classbar">${g?`<div class="g" style="width:${Math.max(g,18)}%">${g}% correct</div>`:""}${g<100?`<div class="b">${100-g}% not yet</div>`:""}</div>`}
function howToHTML(secs,goal,student){
  const items=[
    ["Same question, same time","Each question appears on the big screen and on your phone at the same moment."],
    ["Answer on your phone","Tap an answer, or type the term and press Check. Your first answer is locked in."],
    ["Watch the clock",secs?`You have <b>${secs} seconds</b> per question. When time runs out, or your instructor stops the clock, answers lock.`:"Your instructor decides when to stop answering, so keep an eye on the screen."],
    ["See how the class did","The correct answer appears for everyone, with the percent of the class that got it right and the term in all four languages."],
    ["Anonymous","No names. Only you see your own score."],
    ["Finished early? Work ahead",`Once you’ve locked in, scroll down to <b>Work ahead on your own</b> for private practice. Your phone jumps back when the next class question starts.`],
    ["A class goal",`We’re working together toward a <b>${goal}% class average</b>.`],
  ];
  return `<div style="display:flex;flex-direction:column;gap:12px"><span class="label-sm">How it works</span><h2>${student?"Here’s how the game works":"How the game works"}</h2>
    <ol class="howlist">${items.map(([t,d],i)=>`<li><span class="hn">${i+1}</span><div><b>${t}</b><span class="hd">${d}</span></div></li>`).join("")}</ol></div>`;
}

/* ================= host ================= */
let H=null;
function hostSetup(){
  setMode("host"); setMeta('<span class="pill">Instructor</span>');
  app.innerHTML=`<div class="card"><h2>Host a class game</h2>
    ${settingsHTML(["dir","langs","fams","mode","secs","goal"])}
    <p class="small muted" style="margin:0">Everyone answers the same question at the same time. You can stop the clock early or add time, and the answer is revealed to the whole class at once. Play as many questions as you like, then finish for a recap.</p>
    <div class="actions"><button class="btn ghost" type="button" data-back>← Back</button><span class="spacer"></span><button class="btn big" type="button" data-start>Create room</button></div>
    <p class="small" data-msg style="margin:0"></p></div>`;
  bindSettings(app);
  app.querySelector("[data-back]").onclick=goHome;
  app.querySelector("[data-start]").onclick=async()=>{
    const msg=app.querySelector("[data-msg]"),btn=app.querySelector("[data-start]");
    btn.disabled=true; let client=null,bi=-1;
    for(let k=0;k<BROKERS.length&&!client;k++){msg.textContent=`Opening a room… (server ${k+1} of ${BROKERS.length})`;try{client=await connectTo(BROKERS[k]);bi=k}catch(e){}}
    if(!client){msg.innerHTML='<span class="notice err" style="display:block">Couldn’t reach a live server from this network. You can still use Practice solo, or try another network (for example, a phone hotspot).</span>';btn.disabled=false;return}
    let code;do{code=randId(5)}while(ALPH.indexOf(code[0])%BROKERS.length!==bi);
    startHost(client,code,cfgCopy());
  };
}
function startHost(client,code,cfg){
  H={client,code,cfg,next:deck(cfg),qs:[],idx:-1,phase:"lobby",seen:new Map(),answers:new Map(),results:[],deadline:null,limit:+cfg.secs*1000,secs:+cfg.secs,goal:+cfg.goal};
  const T=TOPIC(code);
  client.subscribe(T+"/up",{qos:1});
  client.on("message",(topic,buf)=>{
    if(!H||topic!==T+"/up") return;
    let m;try{m=JSON.parse(buf.toString())}catch(e){return}
    if(!m||typeof m.id!=="string") return;
    H.seen.set(m.id,Date.now());
    if(m.t==="ans"&&H.phase==="q"&&m.qid===H.qs[H.idx].id&&!H.answers.has(m.id)) H.answers.set(m.id,m.ans);
    if(m.t==="hi") publishState();
    hostCounts();
  });
  client.on("connect",()=>publishState());
  H.timers=[setInterval(hostCounts,3000),setInterval(hostTick,250),
    setInterval(()=>{if(H&&H.phase==="q")H.client.publish(T+"/tick",JSON.stringify(tickPayload()),{qos:0})},2000)];
  window.addEventListener("beforeunload",()=>{try{client.publish(T+"/down","",{retain:true,qos:0})}catch(e){}});
  publishState(); hostLobby();
}
function activeCount(){const now=Date.now();let n=0;H.seen.forEach(t=>{if(now-t<50000)n++});return n}
function tickPayload(){return {left:H.deadline?Math.max(0,H.deadline-Date.now()):null,limit:H.limit||null,answered:H.answers.size,joined:Math.max(activeCount(),H.answers.size)}}
function classStats(){const rs=H.results.filter(r=>r&&r.n);return {avg:rs.length?rs.reduce((a,r)=>a+r.pct,0)/rs.length:null,done:rs.length,goal:H.goal}}
function publishState(){
  if(!H) return;
  const st={phase:H.phase,n:H.idx+1,secs:H.secs,goal:H.goal,cfg:H.cfg,cls:classStats()};
  if(H.phase==="q"||H.phase==="reveal") st.q=publicQ(H.qs[H.idx]);
  if(H.phase==="q") Object.assign(st,tickPayload());
  if(H.phase==="reveal"){const r=H.results[H.idx];st.reveal={...revealOf(H.qs[H.idx]),pct:r.pct,n:r.n,timeUp:!!H.timeUp}}
  if(H.phase==="end") st.recap=H.results.map(r=>({pct:r?r.pct:0,n:r?r.n:0}));
  H.client.publish(TOPIC(H.code)+"/down",JSON.stringify(st),{retain:true,qos:1});
}
function hostTop(){setMeta(`<span class="pill">Room <b class="code">${H.code}</b></span><span class="pill"><b data-joined>${activeCount()}</b> joined</span>`)}
function hostCounts(){
  if(!H) return;
  document.querySelectorAll("[data-joined]").forEach(e=>e.textContent=activeCount());
  const a=$("[data-answered]");
  if(a){const n=H.answers.size,tot=Math.max(activeCount(),n);a.textContent=n;$("[data-of]").textContent=tot;
    const ring=$("[data-ring]");if(ring)ring.setAttribute("stroke-dasharray",`${(tot?n/tot:0)*301.6} 301.6`);
    const all=$("[data-allin]");if(all)all.style.visibility=tot&&n>=tot?"visible":"hidden"}
}
function hostTick(){
  if(!H||H.phase!=="q"||!H.deadline) return;
  const left=H.deadline-Date.now();
  const el=$("[data-timer]");if(el){el.textContent=left<=0?"Time’s up":fmtT(left);el.classList.toggle("low",left<=5000)}
  const b=$("[data-tbar]");if(b){b.style.width=Math.max(0,left/H.limit*100)+"%";b.parentNode.classList.toggle("low",left<=5000)}
  if(left<=0&&!H.timeUpQ){ // time's up: answering closes; the professor clicks to show the answer
    H.timeUpQ=true;const more=$("[data-more]");if(more)more.hidden=true;
    const rv=$("[data-reveal]");if(rv){rv.textContent="Show answer";rv.onclick=()=>hostReveal(true);rv.focus({preventScroll:true})}
  }
}
function joinURL(){
  if(!/^https?:/.test(location.protocol)) return null;
  const u=new URL(TOPIC_PAGE||location.href); u.hash=""; if(!TOPIC_PAGE)u.search="";
  u.searchParams.set("room",H.code); if(BROKER_OVERRIDE)u.searchParams.set("broker",BROKER_OVERRIDE);
  return u.toString();
}
function hostLobby(){
  setMode("host"); hostTop();
  const url=joinURL(); let qrSvg="";
  if(url&&typeof qrcode!=="undefined"){try{const qr=qrcode(0,"M");qr.addData(url);qr.make();qrSvg=qr.createSvgTag({cellSize:4,margin:2,scalable:true})}catch(e){}}
  app.innerHTML=`<div class="card"><div class="lobby"><div style="display:flex;flex-direction:column;gap:14px">
      <span class="label-sm">Join code</span><div class="joincode">${H.code}</div>
      <ol class="steps"><li>Open <b>Orchestration Foreign Terms</b> on your phone${qrSvg?", or scan the QR code":""}.</li>
        <li>Tap <b>Join a game</b> and enter <b style="font-family:var(--mono)">${H.code}</b>.</li><li>No names. Your answers are anonymous.</li></ol>
      <div class="counter"><div class="n" data-joined>${activeCount()}</div><div class="muted">students joined</div></div>
    </div><div class="center">${qrSvg?`<div class="qr" aria-label="QR code to join">${qrSvg}</div><p class="small muted">Scan to join.</p>`:`<p class="notice">A QR code appears when the game is opened from a web address.</p>`}</div></div>
    <div class="actions"><span class="muted small">${esc(cfgSummary(H.cfg))} · ${H.secs?H.secs+" s per question":"No timer"} · class goal ${H.goal}%</span><span class="spacer"></span><button class="btn big" type="button" data-begin>Start game →</button></div></div>`;
  app.querySelector("[data-begin]").onclick=hostIntro;
}
function hostIntro(){
  H.phase="intro"; publishState(); hostTop();
  app.innerHTML=`<div class="card">${howToHTML(H.secs,H.goal,false)}
    <div class="actions"><span class="muted small">Room <b style="font-family:var(--mono)">${H.code}</b> · <span data-joined>${activeCount()}</span> joined. Late arrivals can still join.</span><span class="spacer"></span>
    <button class="btn ghost" type="button" data-backlobby>← Join code</button><button class="btn big" type="button" data-first>Start first question →</button></div></div>`;
  app.querySelector("[data-first]").onclick=hostNext;
  app.querySelector("[data-backlobby]").onclick=()=>{H.phase="lobby";publishState();hostLobby()};
}
function hostNext(){
  H.idx++; H.qs[H.idx]=makeQ(H.next(),H.cfg);
  H.phase="q"; H.answers=new Map(); H.timeUp=false; H.timeUpQ=false; H.limit=H.secs*1000; H.deadline=H.limit?Date.now()+H.limit:null;
  publishState(); hostQuestion();
}
function hostQuestion(r){
  const q=H.qs[H.idx]; hostTop();
  app.innerHTML=`<div class="hostgrid"><div class="card"><div class="progress"><span><b class="qapp">Orchestration Foreign Terms</b> · Question ${H.idx+1}</span><span>${q.fam}</span></div><div data-q style="display:flex;flex-direction:column;gap:16px"></div></div><div class="card" data-side></div></div>`;
  const ctl=renderQ(app.querySelector("[data-q]"),q,{display:true,shaker:!r}); if(r) ctl.lock();
  const side=app.querySelector("[data-side]");
  if(!r){
    side.innerHTML=`${H.deadline?`<span class="label-sm">Time left</span><div class="timer" data-timer>${fmtT(H.deadline-Date.now())}</div><div class="tbar"><i data-tbar style="width:100%"></i></div>`:`<span class="label-sm">No time limit</span><p class="small muted" style="margin:0">Stop answering whenever the class is ready.</p>`}
      <span class="label-sm">Answers in</span>
      <div class="counter"><svg class="ring" viewBox="0 0 110 110" aria-hidden="true"><circle class="bg" cx="55" cy="55" r="48" fill="none" stroke-width="10"/><circle class="fg" data-ring cx="55" cy="55" r="48" fill="none" stroke-width="10" stroke-linecap="round" stroke-dasharray="0 301.6" transform="rotate(-90 55 55)"/></svg>
      <div><div class="n"><span data-answered>0</span><span class="muted" style="font-size:24px"> / <span data-of>0</span></span></div><div class="muted small">answered</div></div></div>
      <p class="small" data-allin style="visibility:hidden;color:var(--good);font-weight:700;margin:0">Everyone’s in.</p>
      <div class="actions">${H.deadline?'<button class="btn ghost" type="button" data-more>+15 s</button>':""}<button class="btn big" type="button" data-reveal>Stop &amp; show answer</button></div>
      ${goalHTML(classStats())}`;
    side.querySelector("[data-reveal]").onclick=()=>hostReveal(false);
    const more=side.querySelector("[data-more]");if(more)more.onclick=()=>{H.deadline=Math.max(H.deadline,Date.now())+15000;H.limit=Math.max(H.limit,H.deadline-Date.now());publishState();hostTick()};
    hostCounts();
  }else{
    const rev=revealOf(q);
    ctl.mark(rev,null);
    if(q.kind==="choice") ctl.dist(r.counts,r.n);
    else{const tr=app.querySelector("[data-typedrev]");tr.innerHTML=`<div class="feedback ok"><div><span class="verdict">Accepted:</span> <b lang="${q.t}">${esc(rev.accepted.map(strip).join(" / "))}</b></div>${r.misses.length?`<div><span class="label-sm">Common misses</span><div class="misses" style="margin-top:6px">${r.misses.map(([w,c])=>`<span lang="${q.t}">${esc(w)}${c>1?` ×${c}`:""}</span>`).join("")}</div></div>`:""}</div>`}
    app.querySelector("[data-q]").insertAdjacentHTML("beforeend",rowcardHTML(rev.row,q.f,q.t));
    side.innerHTML=`<span class="label-sm">${r.timeUp?"Time’s up · ":""}Class results</span>
      ${r.n?`<div class="counter"><div class="n" style="color:var(--good)">${pctR(r.pct)}%</div><div class="muted">got it right<br><span class="small">${r.n} answer${r.n===1?"":"s"}</span></div></div>${classBarHTML(r.pct,r.n)}`:""}
      <p style="margin:0"><b>${esc(classMsg(r.pct,r.n))}</b></p>
      ${goalHTML(classStats())}
      <div class="actions"><button class="btn ghost" type="button" data-finish>Finish &amp; recap</button><button class="btn big" type="button" data-next>Next question →</button></div>`;
    side.querySelector("[data-next]").onclick=hostNext;
    side.querySelector("[data-finish]").onclick=()=>{H.phase="end";publishState();hostEnd()};
  }
}
function hostReveal(timeUp){
  if(!H||H.phase!=="q") return;
  const q=H.qs[H.idx],rev=revealOf(q); H.deadline=null; H.timeUp=!!timeUp;
  let c=0; const n=H.answers.size, counts=[0,0,0,0], miss={};
  H.answers.forEach(a=>{const g=grade(q,a,rev);if(g.ok)c++;
    if(q.kind==="choice"&&counts[a]!=null)counts[a]++;
    else if(q.kind!=="choice"&&!g.ok&&typeof a==="string"){const k=a.trim().toLowerCase();if(k)miss[k]=(miss[k]||0)+1}});
  const misses=Object.entries(miss).sort((x,y)=>y[1]-x[1]).slice(0,5);
  H.results[H.idx]={pct:n?c/n*100:0,n,counts,misses};
  H.phase="reveal"; publishState();
  hostQuestion({...H.results[H.idx],timeUp:H.timeUp});
}
function hostEnd(){
  hostTop();
  const rs=H.results.filter(r=>r&&r.n), avg=rs.length?rs.reduce((a,r)=>a+r.pct,0)/rs.length:0;
  app.innerHTML=`<div class="card"><h2>${esc(endMsg(avg))}</h2>
    <div class="actions" style="justify-content:flex-start;gap:36px"><div><div class="big-pct">${pctR(avg)}%</div><div class="muted">class average</div></div><div><div class="big-pct" style="color:var(--gold)">${H.goal}%</div><div class="muted">class goal ${avg>=H.goal?"· reached":"· next time"}</div></div></div>
    <div class="recap">${H.qs.map((q,k)=>{const r=H.results[k]||{pct:0,n:0};const rv=revealOf(q);return `<div class="r"><b>${k+1}</b><span><span lang="${q.f}">${esc(q.prompt)}</span> <span class="muted">→</span> <span lang="${q.t}">${esc(strip(rv.accepted[0]))}</span></span><div class="mb"><i style="width:${r.pct}%"></i></div><span>${r.n?pctR(r.pct)+"%":"—"}</span></div>`}).join("")}</div>
    <div class="actions"><button class="btn ghost" type="button" data-home>End session</button><span class="spacer"></span><button class="btn big" type="button" data-again>Play another round (same room)</button></div></div>`;
  app.querySelector("[data-again]").onclick=()=>{H.qs=[];H.idx=-1;H.results=[];H.phase="lobby";H.deadline=null;publishState();hostLobby()};
  app.querySelector("[data-home]").onclick=()=>{endHost();home()};
}
function endHost(){
  if(!H) return;
  try{H.client.publish(TOPIC(H.code)+"/down",JSON.stringify({phase:"closed"}),{retain:true,qos:1});const c=H.client;setTimeout(()=>c.end(true),500)}catch(e){}
  (H.timers||[]).forEach(clearInterval); H=null;
}

/* ================= student ================= */
let S=null;
function joinScreen(prefill){
  setMode("join"); setMeta('<span class="pill">Student</span>');
  app.innerHTML=`<div class="card"><h2>Join a game</h2><p class="muted" style="margin:0">Enter the code on the projector screen. No name needed; your answers are anonymous.</p>
    
    <input class="codein" id="code" aria-label="Room code" maxlength="5" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="•••••" value="${esc(prefill||"")}">
    <div class="actions"><button class="btn ghost" type="button" data-back>← Back</button><span class="spacer"></span><button class="btn big" type="button" data-join>Join</button></div><p data-msg class="small" style="margin:0"></p></div>`;
  const inp=$("#code");
  inp.oninput=()=>{inp.value=inp.value.toUpperCase().replace(/[^A-Z0-9]/g,"").replace(/[IO01]/g,c=>({I:"1",O:"0"}[c]||c)).slice(0,5)};
  app.querySelector("[data-back]").onclick=goHome;
  const go=async()=>{
    const code=inp.value.toUpperCase(), msg=app.querySelector("[data-msg]"), btn=app.querySelector("[data-join]");
    if(code.length!==5||[...code].some(c=>!ALPH.includes(c))){msg.textContent="Codes are 5 characters. Check the screen.";return}
    btn.disabled=true; msg.textContent="Connecting…";
    try{const c=await connectTo(brokerFor(code));startStudent(c,code)}
    catch(e){msg.innerHTML='<span class="notice err" style="display:block">Couldn’t connect. Make sure you’re connected to the internet (try switching between Wi-Fi and cellular), then tap Join again.</span>';btn.disabled=false}
  };
  app.querySelector("[data-join]").onclick=go;
  inp.onkeydown=e=>{if(e.key==="Enter")go()};
  if(prefill&&prefill.length===5) go(); else inp.focus();
}
function startStudent(client,code){
  let id;try{id=sessionStorage.getItem("oft_id_"+code)}catch(e){}
  if(!id){id=randId(12);try{sessionStorage.setItem("oft_id_"+code,id)}catch(e){}}
  S={client,code,id,mine:{},myAns:{},curKey:null,gotState:false,ctl:null,cfg:null};
  const T=TOPIC(code);
  S.send=m=>client.publish(T+"/up",JSON.stringify({...m,id}),{qos:1});
  client.subscribe(T+"/down",{qos:1}); client.subscribe(T+"/tick",{qos:0});
  client.on("connect",()=>S&&S.send({t:"hi"}));
  client.on("message",(topic,buf)=>{
    if(!S||S.client!==client) return;
    if(topic===T+"/tick"){try{stuTick(JSON.parse(buf.toString()))}catch(e){}return}
    if(topic!==T+"/down") return;
    const s=buf.toString(); if(!s){stuWait("The host’s screen disconnected. Hang tight; it may reconnect.");return}
    let st;try{st=JSON.parse(s)}catch(e){return}
    S.gotState=true; stuState(st);
  });
  S.send({t:"hi"});
  S.timers=[setInterval(()=>S&&S.send({t:"hb"}),15000),setInterval(stuClock,250)];
  stuWait("You’re in! Watch the main screen. The first question is coming.");
  setTimeout(()=>{if(S&&!S.gotState)stuWait(`Waiting for room <b>${esc(code)}</b>… If nothing happens, double-check the code on the screen.`,true)},6000);
}
function endStudent(){if(!S)return;try{S.client.end(true)}catch(e){}(S.timers||[]).forEach(clearInterval);S=null}
function stuTop(){const done=Object.keys(S.mine).length,right=Object.values(S.mine).filter(Boolean).length;setMeta(`<span class="pill">Room <b class="code">${esc(S.code)}</b></span>${done?`<span class="pill">You: ${right}/${done}</span>`:""}`)}
function stuWait(msg,html){if(S)S.curKey="wait";app.innerHTML=`<div class="card"><div class="wait"><div class="pulse"></div><h2>${html?msg:esc(msg)}</h2><p class="muted small" style="margin:0">Your answers are anonymous.</p></div></div>`;practiceVis()}
function stuTick(t){
  if(!S||!S.curKey||!S.curKey.endsWith(":q")) return;
  S.deadline=t.left!=null?Date.now()+t.left:null; S.limit=t.limit;
  const c=$("[data-crowd]"); if(c&&t.joined) c.textContent=`${t.answered} of ${t.joined} classmates have answered`;
  stuClock();
}
function stuClock(){
  if(!S||!S.curKey||!S.curKey.endsWith(":q")) return;
  const el=$("[data-stimer]"); if(!el) return;
  if(!S.deadline){el.hidden=true;return}
  el.hidden=false;
  const left=Math.max(0,S.deadline-Date.now());
  el.querySelector("b").textContent=fmtT(left);
  el.querySelector("i").style.width=(S.limit?left/S.limit*100:0)+"%";
  el.querySelector(".tbar").classList.toggle("low",left<=5000);
  if(left<=0&&!S.timedOut){
    S.timedOut=true; const qid=S.curKey.split(":")[0];
    if(S.myAns[qid]==null&&S.ctl){S.ctl.lock();S.ctl.res.innerHTML=`<div class="feedback center"><p class="timesup">Time’s up!</p><p class="muted small" style="margin:0">Watch the screen; the answer is coming.</p></div>`}
    practiceVis();
  }
}
function stuState(st){
  const before=S.curKey;
  if(st.cfg) S.cfg=st.cfg;
  stuInner(st);
  if(S&&S.curKey!==before&&st.phase==="q"){const t=$("#toast");if(t)t.classList.remove("show");window.scrollTo({top:0,behavior:"smooth"})}
  practiceVis();
}
function stuInner(st){
  stuTop();
  if(st.phase==="closed"){S.curKey="closed";app.innerHTML=`<div class="card"><div class="wait"><h2>Session ended. Thanks for playing!</h2><button class="btn" type="button" data-donehome>Back to main screen</button></div></div>`;app.querySelector("[data-donehome]").onclick=()=>{endStudent();home()};return}
  if(st.phase==="lobby"||st.phase==="intro"){
    if(S.curKey===st.phase) return; S.curKey=st.phase;
    app.innerHTML=`<div class="card"><div class="actions" style="justify-content:flex-start"><span class="pulse"></span><b>You’re in!</b><span class="muted">${st.phase==="intro"?"The first question is coming up.":"The game will start soon."}</span></div>${howToHTML(st.secs,st.goal,true)}<p class="small muted center" style="margin:0">Want to warm up? Try the practice box below.</p></div>`;
    return;
  }
  if(st.phase==="end"){
    if(S.curKey==="end") return; S.curKey="end";
    const done=Object.keys(S.mine).length,right=Object.values(S.mine).filter(Boolean).length;
    const rs=(st.recap||[]).filter(r=>r.n),avg=rs.length?rs.reduce((a,r)=>a+r.pct,0)/rs.length:0;
    app.innerHTML=`<div class="card center"><h2>${esc(endMsg(done?right/done*100:0))}</h2>
      <div class="actions" style="justify-content:center;gap:36px"><div><div class="big-pct">${right}/${done}</div><div class="muted small">you got right</div></div><div><div class="big-pct" style="color:var(--gold)">${pctR(avg)}%</div><div class="muted small">class average</div></div></div>
      ${st.cls&&st.cls.avg!=null?`<p style="margin:0"><b>${st.cls.avg>=st.cls.goal?`The class reached its ${st.cls.goal}% goal together!`:`Class goal was ${st.cls.goal}%. We’ll get there next time.`}</b></p>`:""}
      <p class="muted" style="margin:0">Only you can see your own score.</p></div>`;
    return;
  }
  const q=st.q; if(!q) return;
  const key=q.id+":"+st.phase;
  if(st.phase==="q"){
    if(S.curKey===key) return; S.curKey=key;
    S.deadline=st.left!=null?Date.now()+st.left:null; S.limit=st.limit; S.timedOut=false;
    app.innerHTML=`<div class="card"><div class="stu-timer" data-stimer><span class="label-sm">Time</span><div class="tbar"><i style="width:100%"></i></div><b>0:00</b></div><div class="progress"><span><b class="qapp">Orchestration Foreign Terms</b> · Question ${st.n}</span><span>${q.fam}</span></div><div data-q style="display:flex;flex-direction:column;gap:16px"></div>
      <p class="small muted center" data-crowd style="margin:0">${st.joined?`${st.answered||0} of ${st.joined} classmates have answered`:""}</p></div>`;
    S.ctl=renderQ(app.querySelector("[data-q]"),q,{submitLabel:"Lock in",onSubmit:ans=>{
      S.myAns[q.id]=ans; S.send({t:"ans",qid:q.id,ans}); practiceVis();
      S.ctl.res.innerHTML=`<div class="feedback center"><h3>Answer locked in ✓</h3><p class="muted small" style="margin:0">Waiting for the rest of the class. The answer appears on everyone’s screen at the same time.</p></div>`;
    }});
    if(S.myAns[q.id]!=null){S.ctl.preset(S.myAns[q.id]);S.ctl.res.innerHTML=`<div class="feedback center"><h3>Answer locked in ✓</h3></div>`}
    stuClock(); return;
  }
  if(st.phase==="reveal"){
    if(S.curKey===key) return;
    const wasShowing=S.curKey===q.id+":q"; S.curKey=key;
    if(!wasShowing){
      app.innerHTML=`<div class="card"><div class="progress"><span><b class="qapp">Orchestration Foreign Terms</b> · Question ${st.n}</span><span>${q.fam}</span></div><div data-q style="display:flex;flex-direction:column;gap:16px"></div></div>`;
      S.ctl=renderQ(app.querySelector("[data-q]"),q,{focus:false}); S.ctl.preset(S.myAns[q.id]);
    }
    const tm=$("[data-stimer]");if(tm)tm.remove(); const cr=$("[data-crowd]");if(cr)cr.remove();
    const r=st.reveal, mine=S.myAns[q.id], g=grade(q,mine,r);
    if(mine!=null){ S.mine[q.id]=g.ok; window.SFX&&SFX.play(g.ok); window.SAprogress&&SAprogress.record('Class game · '+q.fam,g.ok); }
    S.ctl.lock(); S.ctl.mark(r,mine); stuTop();
    const lead=r.timeUp&&mine==null?'<p class="timesup" style="font-size:20px">Time ran out. Here’s the answer.</p>':"";
    S.ctl.res.innerHTML=lead+feedbackHTML(q,g,r,mine,`<div><span class="label-sm">Class</span>${r.n?`${classBarHTML(r.pct,r.n)}<div class="small muted">${pctR(r.pct)}% of the class got this one. ${esc(classMsg(r.pct,r.n))}</div>`:`<div class="small muted">${esc(classMsg(0,0))}</div>`}${goalHTML(st.cls)}</div>`);
    if(inPractice()) stuToast("Class answer is in. Tap to see it."); else S.ctl.res.scrollIntoView({behavior:"smooth",block:"start"});
  }
}

/* work-ahead practice on student phones (private) */
const P={open:false,q:null,ans:undefined,score:0,n:0,next:null,cfgKey:""};
function practiceVis(){
  const el=$("#practice"); if(!el) return;
  if(!S){el.hidden=true;return}
  let show=true; const k=S.curKey||"";
  if(k.endsWith(":q")){const qid=k.split(":")[0];if(S.myAns[qid]==null&&!S.timedOut)show=false}
  if(k==="closed") show=false;
  if(show&&!el.innerHTML) practiceRender();
  el.hidden=!show;
}
function practiceRender(){
  const el=$("#practice");
  el.innerHTML=`<div class="card"><div class="phead"><div><span class="label-sm">While you wait</span><h3>Work ahead on your own</h3><p class="small muted" style="margin:0">Private practice. Nothing here is sent to the class.</p></div><span class="pill" data-pscore ${P.n?"":"hidden"}>${P.score}/${P.n}</span></div>
    ${P.open?`<div data-pq style="display:flex;flex-direction:column;gap:16px"></div><button class="btn ghost" type="button" data-pclose>Hide practice</button>`:`<button class="btn big" type="button" data-popen>Start practicing →</button>`}</div>`;
  if(!P.open){el.querySelector("[data-popen]").onclick=()=>{P.open=true;practiceRender()};return}
  el.querySelector("[data-pclose]").onclick=()=>{P.open=false;practiceRender()};
  practiceQ();
}
function practiceQ(fresh){
  const box=$("#practice [data-pq]"); if(!box) return;
  const cfg=(S&&S.cfg)||cfgCopy(); const key=JSON.stringify(cfg);
  if(P.cfgKey!==key){P.cfgKey=key;P.next=deck(cfg);P.q=null}
  if(!P.q||fresh){P.q=makeQ(P.next(),cfg);P.ans=undefined}
  const q=P.q;
  const ctl=renderQ(box,q,{giveUp:true,focus:false,onSubmit:ans=>{P.ans=ans;P.n++;const g=grade(q,ans,revealOf(q));if(g.ok)P.score++; window.SFX&&SFX.play(g.ok); window.SAprogress&&SAprogress.record(q.fam,g.ok);show(ans,g)}});
  const show=(ans,g)=>{ctl.mark(revealOf(q),ans);ctl.res.innerHTML=feedbackHTML(q,g,revealOf(q),ans,`<button class="btn" type="button" data-pnext>Another practice question →</button>`);
    ctl.res.querySelector("[data-pnext]").onclick=()=>{practiceQ(true);box.scrollIntoView({behavior:"smooth",block:"start"})};
    const sc=$("[data-pscore]");if(sc){sc.hidden=false;sc.textContent=`${P.score}/${P.n}`}};
  if(P.ans!==undefined){ctl.preset(P.ans);show(P.ans,grade(q,P.ans,revealOf(q)))}
}
const inPractice=()=>{const el=$("#practice");return el&&!el.hidden&&el.getBoundingClientRect().top<window.innerHeight*.5};
function stuToast(text){
  let t=$("#toast");if(!t){t=document.createElement("button");t.id="toast";t.type="button";t.className="toast";document.body.appendChild(t)}
  t.textContent=text;t.classList.add("show");t.onclick=()=>{window.scrollTo({top:0,behavior:"smooth"});t.classList.remove("show")};
  clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove("show"),7000);
}

/* ================= navigation, full screen, keys ================= */
let armed=null;
function goHome(){
  if(H||S){
    const b=$("#homebtn");
    if(armed!==b){armed=b;b.classList.add("warn");b.querySelector("span").textContent=H?"Click again to end the game":"Click again to leave";
      setTimeout(()=>{if(armed===b){armed=null;b.classList.remove("warn");b.querySelector("span").textContent="Home"}},4000);return}
    armed=null;b.classList.remove("warn");b.querySelector("span").textContent="Home";
    endHost(); endStudent();
  }
  if(location.search.includes("room=")||location.hash){try{history.replaceState(null,"",location.pathname)}catch(e){}}
  G=null; home(); window.scrollTo(0,0);
}
$("#homebtn").onclick=goHome;
$("#brandbtn").onclick=goHome;
function isFs(){return !!(document.fullscreenElement||document.webkitFullscreenElement)||document.body.classList.contains("fauxfs")}
function syncFs(){$("#fsbtn span").textContent=isFs()?"Exit full screen":"Full screen"}
function toggleFs(){
  const d=document.documentElement;
  if(document.fullscreenElement||document.webkitFullscreenElement){(document.exitFullscreen||document.webkitExitFullscreen).call(document);return}
  if(document.body.classList.contains("fauxfs")){document.body.classList.remove("fauxfs");syncFs();return}
  const req=d.requestFullscreen||d.webkitRequestFullscreen, fb=()=>{document.body.classList.add("fauxfs");syncFs()};
  if(req&&(document.fullscreenEnabled||document.webkitFullscreenEnabled)){try{const p=req.call(d);if(p&&p.catch)p.catch(fb)}catch(e){fb()}}else fb();
}
$("#fsbtn").onclick=toggleFs;
document.addEventListener("fullscreenchange",syncFs);
document.addEventListener("webkitfullscreenchange",syncFs);
document.addEventListener("keydown",e=>{
  if(e.target.matches("input,textarea,select")) return;
  if(e.key==="f"||e.key==="F"){toggleFs();return}
  if(e.key==="Escape"&&document.body.classList.contains("fauxfs")){document.body.classList.remove("fauxfs");syncFs();return}
  if(G&&G.ctl&&!H&&!S){
    const m=/^[1-4]$/.test(e.key)?+e.key-1:/^[a-d]$/i.test(e.key)?"abcd".indexOf(e.key.toLowerCase()):-1;
    if(!G.ctl.locked&&m>=0&&G.qs[G.i].kind==="choice"){G.ctl.submit(m);return}
    if(G.ctl.locked&&e.key==="Enter"&&document.activeElement?.dataset?.next===undefined){const nb=$("[data-next]");if(nb){e.preventDefault();nb.click()}}
  }
});

/* ================= boot ================= */
if(JOIN_CODE) joinScreen(JOIN_CODE); else home();
