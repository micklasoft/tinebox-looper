// build 18: the printed synth layer's transcription on the same chords. node sim/synth-offline.js $PWD/index.html
const {G,song,SR}=require('./synth-bench.js'); const cat=JSON.parse(process.env.CAT||'{}'), ex=JSON.parse(process.env.EX||'{}');
for(const tone of [0,1,2]){ const s=song({tone}); const tr=G.transcribe(s.y,SR,Object.assign({clean:true,cat,cat2:cat.nu?{nu:cat.nu}:undefined},ex)); const ns=tr.notes; let tp=0; const err=[], used=new Set();
  for(const n of s.truth){ const c=ns.find((q,i)=>!used.has(i)&&q.m===n.m&&Math.abs(q.t0-n.t0)<0.06); if(c){ used.add(ns.indexOf(c)); tp++; err.push((c.t0-n.t0)*1000); } }
  // pitch-class per chord: notes starting within the chord
  let pt=0,pf=0,pn=0; s.seq.forEach((c,k)=>{ const t=0.3+k*s.dur; const truth=new Set(s.truth.filter(n=>n.t0>=t-0.01&&n.t0<t+0.2).map(n=>n.m%12)); const got=new Set(ns.filter(q=>q.t0>=t-0.05&&q.t0<t+s.dur-0.1).map(q=>q.m%12)); for(const p of got) truth.has(p)?pt++:pf++; for(const p of truth) if(!got.has(p)) pn++; });
  err.sort((a,b)=>a-b); const md=err.length?err[err.length>>1].toFixed(0):'-', ab=err.map(Math.abs).sort((a,b)=>a-b);
  console.log(`tone ${tone}: notes ${ns.length} (truth ${s.truth.length}) P ${(tp/ns.length).toFixed(2)} R ${(tp/s.truth.length).toFixed(2)} pcF ${(2*pt/(2*pt+pf+pn)).toFixed(2)} onset err median ${md} ms, 90% within ${ab.length?ab[Math.floor(ab.length*0.9)].toFixed(0):'-'} ms`); }
