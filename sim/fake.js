// A fake TP-7 over Web MIDI for build 13 checks. Behaviour from Test 5 (Mac, 26 Nov 2026) and HANDOFF section 7:
// notices only after Start Session; Start Session replies and reports the newest closed file (K);
// Stop while armed keeps the file open; the disarm closes it (O after ~25 ms, K ~16 ms after O); arming gives O after ~25 ms.
(()=>{ const T={sess:false,armed:0,playing:0,edit:false,track:0,inp:0,pos:0,open:null,newest:{path:'recordings/2026-10-01_120000_000.wav',frames:96000,sr:96000},
  files:[],viol:[],log:[],lastStop:-1e9,lastPlay:-1e9,t0:0,posT:null};
  window.__tp=T; let input=null;
  const now=()=>performance.now();
  const pk=v=>window.pack7(v);
  const emit=(bytes)=>{ const ev={data:new Uint8Array(bytes),timeStamp:now()}; T.log.push([Math.round(now()),'in',bytes.slice(0,12).join(' ')]); if(input&&input.onmidimessage) input.onmidimessage(ev); };
  const reply=(fl,id,cmd,st,v)=>emit([0xF0,0,0x20,0x76,0x19,0x40,0x20|((id>>7)&0x1F),id&0x7F,cmd,st,...pk(v),0xF7]);
  const note=(v)=>{ if(!T.sess) return; emit([0xF0,0,0x20,0x76,0x19,0x40,0x40,0,0x7F,...pk(v),0xF7]); };
  const u32=x=>[x&255,(x>>8)&255,(x>>16)&255,(x>>>24)&255];
  const kNote=f=>{ const p=[...f.path].map(c=>c.charCodeAt(0)); note([0x4B,...u32(f.sr),...u32(f.frames),3,26,11,26,20,0,0,...p]); };
  const tick=()=>{ if(!T.playing) return; T.pos=Math.floor((now()-T.t0)/31.25)*31.25|0; note([0x4D,...u32(T.pos)]); setTimeout(tick,195); };
  function onSysex(d){ const id=((d[6]&0x1F)<<7)|d[7], cmd=d[8], v=window.sx7(d.slice(9,-1));
    if(cmd===0x01){ reply(0,id,1,0,[...'product:TP-7;mode:normal;fw:1.1.11'].map(c=>c.charCodeAt(0))); return; }
    if(cmd!==0x7F) { reply(0,id,cmd,2,[]); return; }
    const op=v[0], t=now();
    if(op===0x40){ T.sess=true; reply(0,id,cmd,0,[]); setTimeout(()=>{ if(T.newest) kNote(T.newest); },8); return; }
    if(op===0x50){ if(t-T.lastStop<250) T.viol.push(`Play ${Math.round(t-T.lastStop)} ms after Stop`); T.lastPlay=t;
      setTimeout(()=>{ if(T.armed&&!T.edit&&!T.open){ T.open={path:`recordings/2026-11-26_2000${String(T.files.length).padStart(2,'0')}_000.wav`,sr:96000,frames:0,ms:0}; T.files.push(T.open); }
        T.playing=1; T.t0=now(); if(T.open) T.open.start=now(); tick(); },13);
      reply(0,id,cmd,T.sess?0:1,[0x4E,1]); return; }
    if(op===0x51){ T.lastStop=t; if(T.playing&&T.open&&T.open.start) T.open.ms+=now()-T.open.start; T.playing=0; reply(0,id,cmd,T.sess?0:1,[0x4E,0]); return; }
    if(op===0x04){ if(T.armed) T.viol.push('edit toggle while armed'); T.edit=!T.edit; return; }
    if(op===0x0b){ reply(0,id,cmd,0,[0x09,T.edit?T.track:0xff]); return; }
    if(op===0x0c){ reply(0,id,cmd,0,[0x0a,T.inp]); return; }
    if(op===0x09){ T.track=v[1]; reply(0,id,cmd,0,[0x09,v[1]]); return; }
    if(op===0x0a){ T.inp=v[1]; reply(0,id,cmd,0,[0x0a,v[1]]); return; }
    if(op===0x4a){ if(T.armed) T.viol.push('go to start while armed'); T.pos=0; reply(0,id,cmd,0,[]); setTimeout(()=>note([0x4D,0,0,0,0]),40); return; }
    reply(0,id,cmd,1,[]); }
  function onCC(n,val){ if(n!==14) return; const want=val>=64?1:0; if(want===T.armed) return;
    setTimeout(()=>{ T.armed=want; note([0x4F,want]);
      if(!want&&T.open){ const f=T.open; if(T.playing&&f.start){ f.ms+=now()-f.start; f.start=now(); } f.frames=Math.round((f.ms+11)/1000*96000); T.open=null; T.newest=f; setTimeout(()=>kNote(f),16); } },25); }
  const out={id:'tp7-out',name:'TP-7',state:'connected',send(b){ const d=[...b]; T.log.push([Math.round(now()),'out',d.slice(0,12).join(' ')]);
    setTimeout(()=>{ if(d[0]===0xF0) onSysex(d); else if((d[0]&0xF0)===0xB0) onCC(d[1],d[2]); },2); }};
  input={id:'tp7-in',name:'TP-7',state:'connected',onmidimessage:null};
  const acc={inputs:new Map([['tp7-in',input]]),outputs:new Map([['tp7-out',out]]),onstatechange:null,sysexEnabled:true};
  navigator.requestMIDIAccess=async()=>acc;
})();
