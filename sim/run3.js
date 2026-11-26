// build 14: drives diagnostics 10, 7, 9 and 12 on the fake TP-7. node sim/run3.js $PWD/index.html
const {chromium}=require('playwright'); const path=require('path');
(async()=>{ const b=await chromium.launch({args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']});
  const pg=await b.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.addInitScript({path:path.join(__dirname,'fake.js')});
  await pg.goto('file://'+process.argv[2]); await pg.waitForTimeout(1500); await pg.mouse.click(5,5);
  const ev=f=>pg.evaluate(f), key=async(k,w)=>{ await pg.keyboard.press(k); await pg.waitForTimeout(w||0); };
  const until=async(f,ms,a)=>{ const t=Date.now(); while(Date.now()-t<(ms||20000)){ if(await pg.evaluate(f,a)) return true; await pg.waitForTimeout(100); } return false; };
  await ev(()=>midiConnect()); await pg.waitForTimeout(300);
  // test 10: session by four taps, then 2 takes
  ev(()=>{ runTest('t10'); }); await pg.waitForTimeout(1500);
  for(let i=0;i<4;i++) await key(' ',500);
  console.log('ready', await until(()=>E.st==='ready'&&S.ses&&S.ses.capture,15000));
  for(let i=0;i<2;i++){ await pg.waitForTimeout(800); await key('ArrowUp',2500); await key('ArrowDown',100); await until(i=>(E.takes||[]).length>i,5000,i); await pg.waitForTimeout(600); }
  await ev(()=>{ DG.stop=true; if(DG.ans) DG.ans(-1); }); await until(()=>!DG.run,8000);
  // test 7: 2 free loops
  ev(()=>{ runTest('t7'); }); await until(()=>DG.res.t7&&DG.res.t7.some(l=>/session ready|audio input/.test(l)),8000); await pg.waitForTimeout(1500);
  for(let i=0;i<2;i++){ await key('ArrowUp',1800); await key('ArrowUp',100); await until(i=>DG.res.t7.filter(l=>/free \d/.test(l)).length>i,8000,i); await pg.waitForTimeout(1600); }
  await ev(()=>{ DG.stop=true; }); await until(()=>!DG.run,8000);
  // test 9
  ev(()=>{ runTest('t9'); }); await pg.waitForTimeout(500); for(let i=0;i<10;i++) await key('ArrowRight',230); await until(()=>!DG.run,8000);
  // test 12: 3 single taps of switch 6, then stop
  ev(()=>{ runTest('t12'); }); await pg.waitForTimeout(500); for(let i=0;i<3;i++){ await key(' ',1300); } await ev(()=>{ DG.stop=true; }); await until(()=>!DG.run,8000);
  const r=await ev(()=>({res:DG.res,viol:__tp.viol,files:__tp.files.length,chip:document.body.innerText.includes('TP-7 armed'),st:E.st}));
  for(const k of ['t10','t7','t9','t12']) console.log('== '+k+'\n'+(r.res[k]||[]).join('\n'));
  console.log('viol',r.viol,'files',r.files,'armed chip',r.chip,'state',r.st); console.log('errors',errs); await b.close(); })();
