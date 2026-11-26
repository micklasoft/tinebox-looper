const {chromium}=require('playwright'); const path=require('path');
(async()=>{ const b=await chromium.launch({args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']});
  const pg=await b.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
  await pg.addInitScript({path:path.join(__dirname,'fake.js')});
  await pg.goto('file://'+process.argv[2]); await pg.waitForTimeout(1500); await pg.mouse.click(5,5);
  const ev=(f)=>pg.evaluate(f);
  await ev(()=>midiConnect()); await pg.waitForTimeout(300);
  const t0=Date.now(); await ev(()=>prepSession(100)); const prepMs=Date.now()-t0;
  await ev(()=>new Promise(r=>{ const w=()=>E.st==='ready'?r():setTimeout(w,50); w(); }));
  const st=()=>ev(()=>E.st);
  console.log('prepSession', prepMs,'ms, state', await st(), 'perf', await ev(()=>TP.perf));
  // play-through 1: first loop then stop
  await ev(()=>act('rec')); await pg.waitForTimeout(2000); await ev(()=>act('rec')); await pg.waitForTimeout(2500);
  await ev(()=>act('play')); console.log('after stop 1:', await st());
  for(let i=2;i<=4;i++){ await pg.waitForTimeout(i===4?0:600); await ev(()=>act('play')); await pg.waitForTimeout(2000); await ev(()=>act('play')); }
  await pg.waitForTimeout(800);
  const r=await ev(()=>({files:__tp.files.map(f=>[f.path,Math.round(f.frames/96)]),caps:(S.ses.caps||[]).map(c=>c.file),viol:__tp.viol,perf:TP.perf,armed:__tp.armed,
    log:LOG.filter(x=>/^(t\d+|err|tp|st)$/.test(x[1])).slice(-80).map(x=>x[1]+' '+x[2])}));
  console.log(JSON.stringify({files:r.files,caps:r.caps,viol:r.viol,perf:r.perf,armed:r.armed},null,1));
  console.log(r.log.join('\n')); console.log('page errors:',errs); await b.close(); })();
