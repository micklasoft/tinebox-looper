// build 16: 2-bar first repeat, level check, synth A/B and playback on the fake TP-7. node sim/run5.js $PWD/index.html
const {chromium}=require('playwright'); const path=require('path');
(async()=>{ const b=await chromium.launch({args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']});
  const pg=await b.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.addInitScript({path:path.join(__dirname,'fake.js')});
  await pg.goto('file://'+process.argv[2]); await pg.waitForTimeout(1500); await pg.mouse.click(5,5);
  const ev=(f,a)=>pg.evaluate(f,a), until=async(f,ms)=>{ const t=Date.now(); while(Date.now()-t<ms){ if(await ev(f)) return true; await pg.waitForTimeout(100); } return false; };
  const answer=async(n,v)=>{ for(let i=0;i<n;i++){ if(!(await until(()=>!!DG.ans,30000))) return; await ev(v=>DG.ans(v),v); await pg.waitForTimeout(200); } };
  await ev(()=>midiConnect()); await pg.waitForTimeout(300);
  console.log('visible:', await ev(()=>TESTS.filter(t=>!t.hidden).map(t=>t.name)));
  await ev(()=>prepSession(100)); await until(()=>E.st==='ready',15000);
  const sk=[]; for(let i=0;i<3;i++){ await ev(()=>{ E.t1skip=null; S.len=2; E.forceArr=true; }); await ev(()=>act('rec')); await until(()=>E.st==='loop'&&E.t1skip!=null,10000); sk.push(await ev(()=>E.t1skip)); await ev(()=>dgReset(100)); await pg.waitForTimeout(500); }
  console.log('2-bar first repeat cut (ms):', sk.map(v=>v.toFixed(1))); await ev(()=>{ S.len=0; E.forceArr=false; });
  ev(()=>{ runTest('t14'); }); await answer(1,0); await until(()=>!DG.run,40000); console.log((await ev(()=>DG.res.t14)).join('\n'));
  ev(()=>{ runTest('t15'); }); await answer(2,0); await until(()=>!DG.run,40000); console.log((await ev(()=>DG.res.t15)).join('\n'));
  await ev(()=>act('rec')); await pg.waitForTimeout(2000); await ev(()=>act('rec')); await pg.waitForTimeout(1500); await ev(()=>act('play')); await pg.waitForTimeout(500);
  ev(()=>{ runTest('t6p'); }); await answer(2,0); await until(()=>!DG.run,30000); console.log((await ev(()=>DG.res.t6p)).join('\n'));
  console.log('armed after', await ev(()=>__tp.armed), 'viol', await ev(()=>__tp.viol), 'errors', errs); await b.close(); })();
