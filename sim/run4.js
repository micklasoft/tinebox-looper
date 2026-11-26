// build 15: the visible diagnostics, and test 6 playback on the fake TP-7. node sim/run4.js $PWD/index.html
const {chromium}=require('playwright'); const path=require('path');
(async()=>{ const b=await chromium.launch({args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']});
  const pg=await b.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.addInitScript({path:path.join(__dirname,'fake.js')});
  await pg.goto('file://'+process.argv[2]); await pg.waitForTimeout(1500); await pg.mouse.click(5,5);
  const ev=(f,a)=>pg.evaluate(f,a), until=async(f,ms)=>{ const t=Date.now(); while(Date.now()-t<ms){ if(await ev(f)) return true; await pg.waitForTimeout(100); } return false; };
  await ev(()=>midiConnect()); await pg.waitForTimeout(300);
  console.log('visible:', await ev(()=>TESTS.filter(t=>!t.hidden).map(t=>t.name)));
  await ev(()=>prepSession(100)); await until(()=>E.st==='ready',15000);
  await ev(()=>act('rec')); await pg.waitForTimeout(2000); await ev(()=>act('rec')); await pg.waitForTimeout(1500); await ev(()=>act('play')); await pg.waitForTimeout(500);
  ev(()=>{ runTest('t6p'); }); for(let i=0;i<2;i++){ await until(()=>!!DG.ans,8000); console.log('armed while asked:', await ev(()=>__tp.armed)); await ev(()=>DG.ans(0)); await pg.waitForTimeout(200); }
  await until(()=>!DG.run,8000); console.log((await ev(()=>DG.res.t6p)).join('\n')); console.log('armed after:', await ev(()=>__tp.armed), 'viol', await ev(()=>__tp.viol), 'errors', errs); await b.close(); })();
