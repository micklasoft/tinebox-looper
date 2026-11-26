const {chromium}=require('playwright'); const path=require('path');
(async()=>{ const b=await chromium.launch({args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']});
  const pg=await b.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.addInitScript({path:path.join(__dirname,'fake.js')});
  await pg.goto('file://'+process.argv[2]); await pg.waitForTimeout(1500); await pg.mouse.click(5,5);
  const ev=f=>pg.evaluate(f);
  await ev(()=>midiConnect()); await pg.waitForTimeout(300);
  await ev(()=>{ S.mode='arrange'; }); const t0=Date.now(); await ev(()=>prepSession(100)); console.log('arrange prep',Date.now()-t0,'ms', await ev(()=>E.st), await ev(()=>S.ses&&S.ses.file&&S.ses.file.path));
  // footswitch timing: 16 presses of switch 1 on the beat
  await ev(()=>padCalStart(true));
  for(let i=0;i<16;i++){ await ev(()=>{ const b=beatS(), n=Math.ceil((ctx.currentTime-CLK.z0)/b); return new Promise(r=>setTimeout(r,((CLK.z0+n*b)-ctx.currentTime)*1000)); }); await pg.keyboard.press('ArrowUp'); await pg.waitForTimeout(60); }
  await pg.waitForTimeout(300);
  // load test: 10 presses of switch 4
  await ev(()=>loadStart()); for(let i=0;i<10;i++){ await pg.waitForTimeout(230); await pg.keyboard.press('ArrowRight'); } await pg.waitForTimeout(800);
  // tap tempo log, switch 6 gaps
  await ev(()=>stopAll(true)); await ev(()=>{ E.st='idle'; });
  for(let i=0;i<4;i++){ await pg.keyboard.press(' '); await pg.waitForTimeout(600); }
  await ev(()=>new Promise(r=>{ const w=()=>E.st!=='prep'?r():setTimeout(w,50); w(); }));
  const txt=await ev(()=>diagReport().length+logText().length);
  const r=await ev(()=>LOG.filter(x=>/^(t\d+|err)$/.test(x[1])).map(x=>x[1]+' '+x[2]));
  console.log(r.join('\n')); console.log('viol',await ev(()=>__tp.viol),'report chars',txt); console.log('errors',errs); await b.close(); })();
