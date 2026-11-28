// build 18: the live synth's tracker on Karplus-Strong strummed open chords with known notes. node sim/synth-bench.js $PWD/index.html
// offline benchmark for the live synth tracker: Karplus-Strong strummed chords with known notes

const fs=require('fs'), path=require('path'); const src=fs.readFileSync(process.argv[2],'utf8');
const m=src.match(/<script>([\s\S]*?)<\/script>/); const G=new Function(m[1]+';return GDSP();')();
const SR=48000, mtof=n=>440*Math.pow(2,(n-69)/12);
let seed=7; const rnd=()=>{ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff*2-1; };
let TONE=1; function pluck(y,t0,mn,v){ const f=mtof(mn), L=SR/f, N=Math.ceil(L)+2, d=new Float32Array(N); for(let i=0;i<N;i++) d[i]=rnd()*v;
  // pick position: comb the noise
  let w=0, prev=0; const i0=Math.round(t0*SR), len=Math.round(3*SR), S=0.996+0.0035*Math.min(1,(f-80)/600)*0; 
  const dec=Math.pow(0.001,1/(f*2.2)); // about -60 dB over 2.2 s
  let r=0; const buf=new Float32Array(len+N); for(let i=0;i<N;i++) buf[i]=d[i];
  for(let i=N;i<len+N;i++){ const p=i-L+0.5, a=Math.floor(p), fr=p-a; const s=(buf[a]*(1-fr)+buf[a+1]*fr); const s1=(buf[a-1]*(1-fr)+buf[a]*fr); buf[i]=dec*0.5*(s+s1); }
  for(let i=0;i<len;i++){ const j=i0+i; if(j<y.length) y[j]+=(TONE===2?(buf[i+N]-buf[i+N-1])*4:buf[i+N])*Math.min(1,i/24); } }
const CH={E:[40,47,52,56,59,64],Am:[45,52,57,60,64],C:[48,52,55,60,64],G:[43,47,50,55,59,67],D:[50,57,62,66],Em:[40,47,52,55,59,64],F:[41,48,53,57,60,65],Dm:[50,57,62,65],A:[45,52,57,61,64],B7:[47,51,57,59,66]};
function song(o){ o=o||{}; TONE=o.tone==null?1:o.tone; const seq=o.seq||['E','Am','C','G','D','Em','F','Dm','A','B7'], dur=o.dur||1.6, y=new Float32Array(Math.round((seq.length*dur+1)*SR)), truth=[];
  seq.forEach((c,k)=>{ const t=0.3+k*dur, ns=CH[c]||[+c]; ns.forEach((n,j)=>{ const tt=t+j*(o.strum==null?0.012:o.strum); pluck(y,tt,n,0.35*(0.8+0.2*Math.abs(rnd()))); truth.push({m:n,t0:tt,t1:t+dur}); }); });
  let pk=0; for(const v of y) pk=Math.max(pk,Math.abs(v)); const g=(o.peak||0.25)/pk; for(let i=0;i<y.length;i++){ let v=y[i]*g; if(o.clip&&Math.abs(v)>1) v=Math.sign(v); y[i]=v; }
  return {y,truth,seq,dur}; }
function run(Live,s,o){ o=o||{}; const L=new Live(SR,Object.assign({preset:'pad',bleed:0},o.live||{})); const out=new Float32Array(128); let t=0; const starts=[], frames=[];
  const ov=L.voice.bind(L); L.voice=(nt,f,lv)=>{ starts.push({m:nt.m,t}); return ov(nt,f,lv); };
  const x=s.y, echo=o.echo; for(let i=0;i+128<=x.length;i+=128){ const blk=x.subarray(i,i+128); let b=blk; if(echo){ b=new Float32Array(128); for(let j=0;j<128;j++) b[j]=blk[j]+echo[i+j]; } if(o.ref) L.refIn&&L.refIn(o.ref.subarray(i,i+128),128); L.feed(b,128,out); t=(i+128)/SR;
    if((i/128)%4===0) frames.push({t,on:new Set(Object.values(L.map).filter(v=>v.st===1).map(v=>v.mn))}); }
  // frame accuracy 0.25 s after each chord until its end
  let tp=0,fp=0,fn=0; for(const fr of frames){ const k=Math.floor((fr.t-0.3)/s.dur); if(k<0||k>=s.seq.length) continue; const ct=fr.t-0.3-k*s.dur; if(ct<0.15||ct>0.8) continue;
    const tr=new Set((CH[s.seq[k]]||[+s.seq[k]])); for(const n of fr.on){ if(tr.has(n)) tp++; else fp++; } for(const n of tr) if(!fr.on.has(n)) fn++; }
  let pt=0,pf=0,pn=0; for(const fr of frames){ const k=Math.floor((fr.t-0.3)/s.dur); if(k<0||k>=s.seq.length) continue; const ct=fr.t-0.3-k*s.dur; if(ct<0.15||ct>0.8) continue;
    const tr=new Set((CH[s.seq[k]]||[s.seq[k]]).map(n=>n%12)), on=new Set([...fr.on].map(n=>n%12)); for(const n of on){ if(tr.has(n)) pt++; else pf++; } for(const n of tr) if(!on.has(n)) pn++; }
  // latency: first voice start of each truth note within 200 ms of its pluck
  const lat=[]; let miss=0; for(const n of s.truth){ const st=starts.find(q=>q.m===n.m&&q.t>=n.t0-0.002&&q.t<n.t0+0.2); if(st) lat.push((st.t-n.t0)*1000); else miss++; }
  lat.sort((a,b)=>a-b); const q=p=>lat.length?lat[Math.min(lat.length-1,Math.floor(p*lat.length))].toFixed(0):'-';
  const wrongStarts=starts.filter(q=>!s.truth.some(n=>n.m===q.m&&q.t>=n.t0-0.002&&q.t<=n.t1+0.1)).length;
  return {pcF:(2*pt/(2*pt+pf+pn)).toFixed(2),pcP:(pt/(pt+pf)).toFixed(2),P:(tp/(tp+fp)).toFixed(2),R:(tp/(tp+fn)).toFixed(2),F:(2*tp/(2*tp+fp+fn)).toFixed(2),lat50:q(0.5),lat90:q(0.9),voiced:`${lat.length}/${s.truth.length}`,ghostStarts:wrongStarts}; }
module.exports={G,song,run,SR,pluck,CH};
if(require.main===module){ const L=process.argv[3]?require(process.argv[3]):G.Live; const R=(n,s,o)=>{ const r=run(L,s,o); console.log(n.padEnd(20),Object.entries(r).map(([k,v])=>k+' '+v).join('  ')); return r; };
  for(const tone of [0,1,2]){ const s1=song({tone}); R('tone '+tone+' clean',s1); if(tone===1){ R('tone 1 clipped',song({tone,peak:2.5,clip:true})); R('tone 1 quiet',song({tone,peak:0.05}));
    const loop=song({tone,seq:['G','C','D','Em','G','C','D','Em','G','C']}); const echo=new Float32Array(s1.y.length); for(let i=0;i<echo.length;i++) echo[i]=(loop.y[i+3000]||0)*0.126;
    R('tone 1 loop bleed',s1,{echo}); R('bleed + reference',s1,{echo,ref:loop.y.subarray(3000),live:{bleed:0.126}}); } }
  console.log('singles',JSON.stringify(run(L,song({seq:['40','45','50','55','59','64','52','57','62','67','71','76']}))));
}
