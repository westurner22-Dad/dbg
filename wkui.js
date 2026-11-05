// p17 Weekend boss UI (DOM sprites over a CSS-tiled grid). Opened from day screen or #weekend.
(function(){
const $=s=>document.querySelector(s); let g,ui,opt,timerI;
const ZO=[.8,1,1.3]; const TITLE={dmg:'Worldbreaker',pro:'The Unyielding',sus:'Beacon of Heaven',con:'Master of Fate'};
const CSS=`#wk{position:fixed;inset:0;background:radial-gradient(ellipse at top,#1b2440,#07090f 70%);color:#eef;font:14px/1.25 system-ui,-apple-system,sans-serif;display:flex;flex-direction:column;user-select:none;-webkit-user-select:none;touch-action:manipulation;overflow:hidden;z-index:50}
#wk.p2{background:radial-gradient(ellipse at top,#3a1850,#0b0612 70%)} #wk.p2 .bd{box-shadow:0 0 24px #a4f8,inset 0 0 40px #60f4}
.wtop{padding:8px 10px 4px;display:flex;gap:8px;align-items:center}.wbi{width:44px;height:44px;border-radius:10px;background:#223 url(img/ape.png) center/120% no-repeat;border:2px solid #fc6;flex:none}
.wbn{font-weight:700;font-size:13px;letter-spacing:.3px;display:flex;justify-content:space-between}.wbar{height:12px;border-radius:6px;background:#300;overflow:hidden;border:1px solid #000;margin-top:3px;position:relative}
.wbar i{display:block;height:100%;background:linear-gradient(#ff7a5c,#c41f1f);transition:width .4s}.wbar b{position:absolute;left:50%;top:0;bottom:0;width:2px;background:#fff8}
.wsub{font-size:11px;color:#abc;margin-top:3px;display:flex;justify-content:space-between}.wx{margin-left:5px;background:#0006;border:1px solid #fff3;color:#fff;border-radius:8px;min-width:44px;height:40px;font-size:16px;flex:none;padding:0 6px}
.word{display:flex;gap:4px;padding:2px 10px 4px;overflow:hidden}.word span{width:26px;height:26px;border-radius:50%;background:#123 center/130% no-repeat;border:2px solid #456;flex:none;opacity:.55}.word span.on{border-color:#ff6;opacity:1;transform:scale(1.15)}.word span.dn{filter:grayscale(1);opacity:.3}
.bw{flex:1;overflow:auto;-webkit-overflow-scrolling:touch;display:flex;justify-content:center;align-items:flex-start;padding:2px 0;position:relative}
.bd{position:relative;border-radius:10px;overflow:visible;border:2px solid #0008;transition:box-shadow .6s}
.wt{position:absolute;box-sizing:border-box;border:1px solid #0002}
.wt.tg{background:radial-gradient(circle at 30% 30%,#6fbf4c 0 2px,transparent 3px),radial-gradient(circle at 70% 65%,#4f9a36 0 2px,transparent 3px),linear-gradient(135deg,#5aa83e,#3f8a2e)}
.wt.tm{background:radial-gradient(ellipse at 35% 40%,#5b3b20 0 25%,transparent 26%),radial-gradient(ellipse at 70% 70%,#4a2f19 0 18%,transparent 19%),linear-gradient(#7a5532,#634426)}
.wt.th{background:linear-gradient(135deg,#d9c48a,#a8915a);box-shadow:inset 3px 3px 0 #f3e3b0,inset -3px -3px 0 #7d6a3e}
.wt.th:after{content:'';position:absolute;right:3px;top:3px;border:5px solid transparent;border-bottom:7px solid #fff6;border-top:0}
.wt.tp{background:linear-gradient(135deg,#5aa83e,#3f8a2e)}.wt.tp:after{content:'';position:absolute;left:18%;right:18%;bottom:12%;top:-38%;border-radius:6px 6px 3px 3px;background:linear-gradient(90deg,#6c7080,#b8bccb 40%,#80869a 70%,#4b4f5c);box-shadow:0 4px 0 #2b2d35,0 6px 8px #0008;z-index:3}
.wt.tx{background:radial-gradient(circle at 50% 50%,#ff5bd0 0,#8a1d8f 45%,#3a0c45 100%);animation:hz 1.6s infinite alternate}@keyframes hz{to{filter:brightness(1.35) hue-rotate(-20deg)}}
.wt.r:before,.wt.ws:before,.wt.tl:before,.wt.al:before{content:'';position:absolute;inset:0;z-index:2}
.wt.r:before{background:#4af5;box-shadow:inset 0 0 0 2px #8df}.wt.ws:before{background:#ff04;box-shadow:inset 0 0 0 3px #ff6}.wt.al:before{box-shadow:inset 0 0 0 3px #6f8;background:#6f83}
.wt.tl:before{background:repeating-linear-gradient(45deg,#ff2a2acc 0 6px,#ff000055 6px 12px);box-shadow:inset 0 0 0 2px #ff5050,0 0 8px #f00;animation:tl .7s infinite alternate}@keyframes tl{to{opacity:.45}}
.un{position:absolute;z-index:5;transition:left .35s ease,top .35s ease;pointer-events:none}
.un img{position:absolute;left:50%;bottom:4%;transform:translateX(-50%);height:118%;image-rendering:pixelated;filter:drop-shadow(0 3px 2px #000a);animation:bob 1.4s ease-in-out infinite}
.un.bs img{height:112%;animation-duration:2s}.un.on:after{content:'';position:absolute;left:10%;right:10%;bottom:-2px;height:22%;border-radius:50%;border:3px solid #ff6;box-shadow:0 0 10px #ff6;z-index:-1}
.un .whb{position:absolute;left:8%;right:8%;top:-16%;height:5px;background:#300;border:1px solid #000;border-radius:3px;overflow:hidden;z-index:6}.un .whb i{display:block;height:100%;background:#4e4;transition:width .3s}
.un.dn img{filter:grayscale(1) brightness(.6);transform:translateX(-50%) rotate(-80deg);transform-origin:50% 85%;animation:none}.un.dn:before{content:'DOWN';position:absolute;top:30%;left:0;right:0;text-align:center;font:bold 9px sans-serif;color:#f88;z-index:7}
@keyframes bob{50%{transform:translateX(-50%) translateY(-6%)}}.un.lg img{animation:lg .35s}@keyframes lg{40%{transform:translateX(-50%) translate(var(--lx),var(--ly)) scale(1.1)}}
.un.ht img{animation:ht .4s}@keyframes ht{0%,50%{filter:brightness(3) sepia(1) hue-rotate(-50deg) saturate(5)}25%{transform:translateX(-46%)}75%{transform:translateX(-54%)}}
.un.tn:after{content:'';position:absolute;inset:-6%;border-radius:50%;box-shadow:0 0 14px 4px #f63;animation:tl .5s infinite alternate;z-index:-1}
.un.bl .whb{box-shadow:0 0 6px 2px #6cf}.un .ic{position:absolute;right:-4%;top:-4%;font-size:10px;z-index:7}
.fn{position:absolute;z-index:20;font:900 18px system-ui;color:#fff;-webkit-text-stroke:1px #000;text-shadow:0 2px 0 #000;animation:fn 1s forwards;pointer-events:none;transform:translateX(-50%)}.fn.h{color:#7f7}.fn.c{color:#ffd84a;font-size:23px}
@keyframes fn{0%{transform:translate(-50%,0) scale(.6)}20%{transform:translate(-50%,-14px) scale(1.2)}100%{transform:translate(-50%,-44px);opacity:0}}
.flash{position:absolute;inset:0;z-index:30;pointer-events:none;background:#fff;animation:fl .5s forwards}@keyframes fl{to{opacity:0}}
.bolt{position:absolute;z-index:25;pointer-events:none;background:radial-gradient(#fff,#8cf 40%,transparent 70%);animation:fl .6s forwards}
.wban{position:fixed;left:0;right:0;top:38%;text-align:center;z-index:60;font:900 24px system-ui;color:#ffe680;text-shadow:0 0 12px #f80,0 2px 0 #000;background:linear-gradient(90deg,transparent,#000b,transparent);padding:14px 0;animation:bn 1.6s forwards;pointer-events:none}@keyframes bn{0%{transform:scale(2);opacity:0}15%{transform:scale(1);opacity:1}80%{opacity:1}100%{opacity:0}}
.wpt{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:4px 8px}.wpc{background:#0008;border:1px solid #fff2;border-radius:8px;padding:3px 4px;display:flex;gap:4px;align-items:center;font-size:10px}.wpc.on{border-color:#ff6;box-shadow:0 0 6px #ff6a}.wpc.dn{opacity:.45}
.wpc .av{width:26px;height:26px;background:center top/150% no-repeat;border-radius:6px;flex:none}.wpc .wnm{font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.wpc .mb{height:4px;background:#222;border-radius:2px;margin-top:2px;overflow:hidden}.wpc .mb i{display:block;height:100%}
.cmd{margin:4px 8px calc(8px + env(safe-area-inset-bottom));height:200px;flex:none;border:3px solid #e8ecff;border-radius:10px;background:linear-gradient(#2b3f9e,#121c5c);box-shadow:0 0 0 2px #000,0 6px 16px #000a;padding:8px 10px;box-sizing:border-box}
.msg{font-size:13px;min-height:18px;color:#fff;text-shadow:0 1px 0 #000}.mn{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:4px}
.mn button,.tl button{background:linear-gradient(#ffffff1a,#0000);border:1px solid #fff5;color:#fff;border-radius:8px;min-height:44px;font:700 15px system-ui;text-align:left;padding:4px 10px;text-shadow:0 1px 0 #000}
#cX:before{content:none!important}.mn button:before{content:'▶ ';color:#fff0}.mn button:active:before{color:#fff}.mn button:disabled,.tl button:disabled{opacity:.4}
.tl{display:flex;flex-direction:column;gap:4px;margin-top:3px;max-height:142px;overflow:auto}.tl button{display:flex;justify-content:space-between;align-items:center;gap:6px;min-height:42px;padding:2px 10px;font-size:14px}.tl small{display:block;font:400 11px system-ui;color:#cde;opacity:.9}.tl .mp{font:700 12px system-ui;color:#9df;white-space:nowrap}
.ty{display:inline-block;font:700 9px system-ui;padding:1px 5px;border-radius:6px;margin-left:4px;vertical-align:middle}.ty.Body{background:#c84}.ty.Force{background:#c44}.ty.Light{background:#cb3;color:#000}.ty.Mass{background:#3a6}
.wend{position:fixed;inset:0;z-index:70;background:#05060cf0;overflow:auto;padding:16px 14px 30px;box-sizing:border-box;animation:fl2 .5s}@keyframes fl2{from{opacity:0}}
.ruin .wbi,.ruin img[src$='ape.png'],.ruin [style*='ape.png']{filter:grayscale(1) sepia(.6) hue-rotate(-40deg) saturate(3) brightness(.75) contrast(1.3)}.wend h1{margin:6px 0 2px;text-align:center;font:900 34px system-ui;color:#ffe27a;text-shadow:0 0 18px #f90,0 3px 0 #000}.wend h1.lose{color:#9ab;text-shadow:0 0 14px #48f}
.mvp{display:flex;gap:12px;align-items:center;background:linear-gradient(135deg,#4a3410,#1c1406);border:2px solid #fc6;border-radius:12px;padding:10px;margin:12px 0;box-shadow:0 0 18px #fc64}.mvp img{height:84px;image-rendering:pixelated;filter:drop-shadow(0 0 8px #fc6)}
.sct{width:100%;border-collapse:collapse;font-size:12px}.sct td{padding:4px 2px}.sct .b{height:7px;background:#223;border-radius:4px;overflow:hidden;min-width:44px}.sct .b i{display:block;height:100%}
.chest{width:92px;height:66px;margin:14px auto 6px;position:relative;cursor:pointer}.chest .lid,.chest .box{position:absolute;left:0;right:0;background:linear-gradient(#a0612a,#6b3a14);border:3px solid #ffd15a;border-radius:8px;box-shadow:inset 0 0 0 3px #0003}
.chest .box{bottom:0;height:42px}.chest .lid{top:0;height:28px;border-radius:30px 30px 6px 6px;transform-origin:50% 100%;transition:transform .5s}.chest.op .lid{transform:rotateX(70deg) translateY(-14px)}.chest.op:after{content:'';position:absolute;inset:-20px;background:radial-gradient(#fff8 0,#fd48 30%,transparent 65%);animation:fl .9s reverse;z-index:-1}
.wlt{display:flex;align-items:center;gap:6px;background:#ffffff0d;border:1px solid #fff2;border-radius:8px;padding:6px;margin:5px 0;font-size:12px}.wlt .q{font-weight:800}.wlt button{min-height:44px;min-width:50px;font-size:12px;border-radius:8px;border:1px solid #fff4;background:#234;color:#fff;font-weight:700}
.q.Rare{color:#6af}.q.Epic{color:#c7f}.q.Legendary{color:#fa4}.q.Manual{color:#7e9}.q.Treasure{color:#fd6}
.wbt{display:block;width:100%;min-height:50px;margin-top:10px;border-radius:12px;border:2px solid #fff6;background:linear-gradient(#3b56d0,#1b2a80);color:#fff;font:800 16px system-ui}`;
const sp=u=>u.id==='boss'?'img/ape.png':u.me&&opt&&opt.meImg?opt.meImg:'img/'+u.img+'.png';
function T(){ const bw=document.querySelector('#bw'); const aw=Math.min(innerWidth,520)-16, ah=bw?bw.clientHeight-6:440; return Math.floor(Math.min(aw/8,ah/10,64)*ZO[ui.z]); }
function open(o){ opt=o||{}; if(!$('#wkcss')){ const s=document.createElement('style'); s.id='wkcss'; s.textContent=CSS; document.head.appendChild(s); }
 g=WK.create({path:opt.path,slots:opt.slots,name:opt.name,allies:opt.allies,gear:opt.gear}); ui={z:1,mode:'wait',sel:null,auto:false,busy:false}; 
 const el=document.createElement('div'); el.id='wk'; if(opt&&opt.skin) el.className='ruin'; el.innerHTML=SK(`<div class=wtop><div class=wbi></div><div style="flex:1;min-width:0"><div class=wbn><span>Thunder Ape Monarch</span><span id=wbh></span></div><div class=wbar><i id=wbf></i><b></b></div><div class=wsub><span id=wrd></span><span id=wph></span></div></div>
 </div><div style="display:flex;align-items:center;padding:0 8px 4px 0"><div class=word id=word style="flex:1"></div><button class=wx id=zout>－</button><button class=wx id=zin>＋</button><button class=wx id=wauto style="font-size:11px">AUTO</button><button class=wx id=wq>✕</button></div>
 <div class=bw id=bw><div class=bd id=bd></div></div>
 <div class=wpt id=wpt></div><div class=cmd id=cmd><div class=msg id=wmsg></div><div id=wmn></div></div>`);
 document.body.appendChild(el);
 const tap=(id,f)=>$('#'+id).addEventListener('pointerdown',e=>{e.preventDefault();f();});
 tap('zin',()=>{ ui.z=Math.min(2,ui.z+1); build(); }); tap('zout',()=>{ ui.z=Math.max(0,ui.z-1); build(); });
 tap('wq',()=>{ if(g.over||confirm('Leave the boss fight?')) close(); }); tap('wauto',()=>{ ui.auto=!ui.auto; $('#wauto').style.background=ui.auto?'#2a6':''; if(ui.auto&&ui.mode!=='wait'&&!ui.busy){ const a=WK.cur(g); clearT(); ui.mode='wait'; WK.ai(g,a); play(step); } });
 el.addEventListener('gesturestart',e=>e.preventDefault()); el.addEventListener('dblclick',e=>e.preventDefault());
 addEventListener('resize',()=>{ if(g&&$('#bd')) build(); }); build(); banner('Weekend Advancement Boss'); say('The Thunder Ape Monarch descends! Party: '+g.units.map(u=>u.name+' ('+u.role+')').join(', ')+'.'); setTimeout(step,900); }
function close(){ clearT(); g=null; const e=$('#wk'); if(e) e.remove(); const n=$('.wend'); if(n) n.remove(); opt.back&&opt.back(); }
function build(){ const t=T(), bd=$('#bd'); bd.style.width=WK.W*t+'px'; bd.style.height=WK.H*t+'px'; let h='';
 for(let y=0;y<WK.H;y++) for(let x=0;x<WK.W;x++){ const c=WK.terr(x,y); h+=`<div class="wt t${c==='.'?'g':c}" data-x=${x} data-y=${y} style="left:${x*t}px;top:${y*t}px;width:${t}px;height:${t}px;z-index:${c==='p'?y+1:0}"></div>`; }
 h+=[g.boss].concat(g.units).map(u=>`<div class="un ${u===g.boss?'bs':''}" id=U${u.id}><img src="${sp(u)}" alt=""><div class=whb><i></i></div><span class=ic></span></div>`).join(''); bd.innerHTML=h;
 bd.onpointerdown=e=>{ const el=e.target.closest('.wt'); if(!el) return; e.preventDefault(); tapTile(+el.dataset.x,+el.dataset.y); }; render(); }
function render(){ if(!g) return; const t=T(), b=g.boss, a=WK.cur(g);
 $('#wbf').style.width=(100*b.hp/b.mx)+'%'; $('#wbh').textContent=b.hp+' / '+b.mx; $('#wrd').textContent='Round '+g.round+' / 20'+(g.round>=15?' · CAPS OFF':''); $('#wph').textContent=(g.phase===2?'⚡ PHASE 2':'Phase 1')+(g.slow>0?' · slowed':'')+(b.taunt?' · taunted':'');
 $('#wk').classList.toggle('p2',g.phase===2);
 $('#word').innerHTML=g.order.map((id,i)=>{ const u=id==='boss'?b:g.units.find(x=>x.id===id); return `<span class="${i===g.cur?'on':''} ${u.down?'dn':''}" style="background-image:url(${sp(u)})"></span>`; }).join('');
 const reach=ui.mode==='move'?WK.reach(g,a):[]; const tele=g.tele?g.tele.cells:[];
 document.querySelectorAll('#bd .wt').forEach(el=>{ const x=+el.dataset.x,y=+el.dataset.y; el.classList.toggle('r',reach.some(p=>p[0]===x&&p[1]===y)); el.classList.toggle('ws',!!ui.sel&&ui.sel[0]===x&&ui.sel[1]===y);
  el.classList.toggle('tl',tele.some(p=>p[0]===x&&p[1]===y)); el.classList.toggle('al',ui.mode==='ally'&&ui.allies.some(u=>u.x===x&&u.y===y)); });
 [b].concat(g.units).forEach(u=>{ const el=$('#U'+u.id); if(!el) return; const sz=u===b?2:1; let x=u.x,y=u.y; if(u===a&&ui.sel&&ui.mode==='move'){ } 
  Object.assign(el.style,{left:x*t+'px',top:y*t+'px',width:sz*t+'px',height:sz*t+'px',zIndex:10+y+(sz-1)}); el.classList.toggle('on',u===a&&!g.over); el.classList.toggle('dn',!!u.down);
  el.classList.toggle('tn',u===b?false:b.taunt===u.id); el.classList.toggle('bl',!!(u.buf&&u.buf.block)); el.querySelector('.whb i').style.width=(100*u.hp/u.mx)+'%'; if(u===b) el.querySelector('.whb').style.display='none';
  el.querySelector('.ic').textContent=u===b?'':((u.buf.shield>0?'🛡':'')+(u.buf.dr>0?'🪨':'')+(u.buf.regen>0?'✚':'')+(u.buf.crit?'✦':'')); });
 $('#wpt').innerHTML=g.units.map(u=>`<div class="wpc ${u===a?'on':''} ${u.down?'dn':''}"><div class=av style="background-image:url(${sp(u)})"></div><div style="flex:1;min-width:0"><div class=wnm>${u.me?'★ ':''}${u.name}</div><div class=mb><i style="width:${100*u.hp/u.mx}%;background:${u.hp/u.mx<.3?'#f44':'#4d4'}"></i></div><div class=mb><i style="width:${100*u.mp/u.mmp}%;background:#4af"></i></div><div style="color:#bcd">${u.hp}/${u.mx}</div></div></div>`).join('');
 menuUI(); }
const SK=s=>opt&&opt.skin?opt.skin.reduce((a,[f,t])=>a.split(f).join(t),String(s)):s;
function say(s){ const m=$('#wmsg'); if(m) m.innerHTML=SK(s); }
function banner(s){ const b=document.createElement('div'); b.className='wban'; b.textContent=SK(s); document.body.appendChild(b); setTimeout(()=>b.remove(),1700); }
function pos(id){ const u=id==='boss'?g.boss:g.units.find(x=>x.id===id), t=T(), sz=id==='boss'?2:1; return [u.x*t+sz*t/2,u.y*t]; }
function float(id,v,cls){ const [x,y]=pos(id), f=document.createElement('div'); f.className='fn '+cls; f.textContent=v; f.style.left=x+'px'; f.style.top=y+'px'; $('#bd').appendChild(f); setTimeout(()=>f.remove(),1000); }
function cls(id,c,ms){ const el=$('#U'+id); if(!el) return; el.classList.remove(c); void el.offsetWidth; el.classList.add(c); setTimeout(()=>el.classList.remove(c),ms||400); }
function play(done){ ui.busy=true; render(); const ev=g.ev.splice(0); let i=0; const nx=()=>{ if(!g) return; if(i>=ev.length){ ui.busy=false; render(); return done&&done(); } const e=ev[i++]; let d=120;
  if(e.t==='msg'){ say(e.s); d=430; } else if(e.t==='dmg'){ float(e.id,e.v+(e.crit?'!':''),e.crit?'c':''); cls(e.id,'ht'); render(); d=380; }
  else if(e.t==='heal'){ float(e.id,'+'+e.v,'h'); render(); d=300; } else if(e.t==='lunge'){ const [ax,ay]=pos(e.id),[bx,by]=pos(e.to); const el=$('#U'+e.id); if(el){ const k=.35; el.style.setProperty('--lx',((bx-ax)*k)+'px'); el.style.setProperty('--ly',((by-ay)*k)+'px'); } cls(e.id,'lg',350); d=200; }
  else if(e.t==='move'){ render(); d=380; } else if(e.t==='aoe'){ e.cells.forEach(([x,y])=>{ const t=T(),b=document.createElement('div'); b.className='bolt'; Object.assign(b.style,{left:(x*t-t/2)+'px',top:(y*t-t/2)+'px',width:2*t+'px',height:2*t+'px'}); $('#bd').appendChild(b); setTimeout(()=>b.remove(),650); });
   const f=document.createElement('div'); f.className='flash'; $('#bd').appendChild(f); setTimeout(()=>f.remove(),500); render(); d=450; }
  else if(e.t==='leap'){ d=150; } else if(e.t==='phase2'){ render(); const f=document.createElement('div'); f.className='flash'; f.style.background='#c6f'; $('#wk').appendChild(f); setTimeout(()=>f.remove(),500); }
  else if(e.t==='banner'){ banner(e.s); d=900; } else if(e.t==='tele'){ render(); d=300; } else if(e.t==='fx'){ if(e.k==='taunt'||e.k==='roar') cls(e.id,'lg',350); render(); }
  else if(e.t==='down'){ render(); d=300; } else if(e.t==='round'){ render(); }
  setTimeout(nx,ui.fast?d/3:d); }; nx(); }
function clearT(){ clearInterval(timerI); timerI=null; }
function step(){ if(!g) return; if(g.over) return end(); const a=WK.advance(g); if(!a||g.over){ play(()=>end()); return; }
 if(a===g.boss){ play(()=>{ say('The Monarch acts…'); render(); setTimeout(()=>{ WK.bossAction(g,0); play(()=>{ WK.bossAction(g,1); play(()=>{ WK.bossEnd(g); play(step); }); }); },350); }); return; }
 if(a.me&&ui.pauseIf&&ui.pauseIf(g)){ ui.auto=false; ui.pauseIf=null; }
 if(!a.me||ui.auto){ play(()=>{ say(a.name+' ('+a.role+') moves…'); setTimeout(()=>{ WK.ai(g,a); play(step); },250); }); return; }
 play(()=>{ ui.mode='move'; ui.sel=null; ui.left=90; render(); clearT(); timerI=setInterval(()=>{ if(ui.busy) return; ui.left--; if(ui.left<=0){ clearT(); ui.mode='wait'; WK.block(g,a); play(step); } else { const t=$('#wtm'); if(t) t.textContent=ui.left+'s'; } },1000); }); }
function tapTile(x,y){ if(ui.busy||!g||g.over) return; const a=WK.cur(g);
 if(ui.mode==='move'){ if(x===a.x&&y===a.y){ ui.sel=null; WK.moveTo(g,a,x,y); ui.mode='menu'; render(); return; } if(WK.reach(g,a).some(p=>p[0]===x&&p[1]===y)){ ui.sel=[x,y]; render(); } return; }
 if(ui.mode==='ally'){ const t=ui.allies.find(u=>u.x===x&&u.y===y); if(t) doAct(ui.tech,t); else cancel(); } }
function techList(a){ return WK.menu(g,a).map((m,k)=>Object.assign({k},m)).filter(m=>m.t!=='Attack'); }
function cancel(){ if(ui.busy||!g||g.over) return; if(ui.mode==='ally'){ ui.mode='tech'; render(); } else if(ui.mode==='tech'||ui.mode==='item'){ ui.mode='menu'; render(); } }
document.addEventListener('keydown',e=>{ if(!g||!document.getElementById('wk')) return; if(e.key==='b'||e.key==='B'||e.key==='Escape'||e.key==='Backspace'){ e.preventDefault(); cancel(); } });
function doAct(t,tgt){ const a=WK.cur(g); clearT(); ui.mode='wait'; WK.act(g,a,t,tgt); play(step); }
function menuUI(){ const box=$('#wmn'); if(!box) return; const a=g&&WK.cur(g); if(!a||!a.me||ui.mode==='wait'||ui.busy||g.over){ box.innerHTML=''; return; }
 const hd=`<div style="display:flex;justify-content:space-between;font-size:11px;color:#bcf;margin-top:-2px"><span>${a.name} · ${a.role} <span class="ty ${a.path}">${a.path}</span>${WK.inTele(g,a.x,a.y)?' <b style="color:#f66">⚠ in the red zone!</b>':''}</span><span>⏱ <span id=wtm>${ui.left}s</span> → Block</span></div>`;
 let h='';
 if(ui.mode==='move'){ say(ui.sel?'Move here? Path previewed in yellow.':'<b>Move:</b> tap a blue tile, or tap yourself to stay.'+(g.tele?' Get out of the red zone!':''));
  h=`<div class=mn><button id=mOk ${ui.sel?'':'disabled'}>Move here</button><button id=mSt>Stay</button></div>`; }
 else if(ui.mode==='menu'){ say('<b>'+a.name+'</b>, choose an action.'); const atk=WK.menu(g,a)[0];
  h=`<div class=mn><button id=cF ${atk.ok?'':'disabled'}>Fight${atk.ok?'':' <small style="font-size:10px">('+atk.why+')</small>'}</button><button id=cT>Techniques</button><button id=cI>Item</button><button id=cB>Block</button></div>`; }
 else if(ui.mode==='tech'){ say(ui.note||'Techniques — your 3 slotted techniques. Attack is Fight on the main menu.'); ui.note=null; h=`<div class=mn style="grid-template-columns:1fr"><button id=cX style="justify-content:center">◀ Back</button></div><div class=tl>`+techList(a).map(m=>`<button data-i=${m.k} class="${m.ok?'':'off'}" style="${m.ok?'':'opacity:.4'}"><span>${m.t}<small>${m.ok?(m.i.d||''):m.why}${m.i.rng?' · range '+m.i.rng:''}</small></span><span class=mp>${m.c?m.c+' MP':m.t==='Challenge'?'role':'free'}</span></button>`).join('')+`</div>`; }
 else if(ui.mode==='item'){ say('Items'); h=`<div class=mn style="grid-template-columns:1fr"><button id=cX style="justify-content:center">◀ Back</button></div><div class=tl>`+WK.items(g,a).map((m,i)=>`<button data-i=${i} ${m.ok?'':'disabled'}><span>${m.lab}</span></button>`).join('')+`</div>`; }
 else if(ui.mode==='ally'){ say('Tap a green-ringed ally for <b>'+ui.tech+'</b>. Tap empty ground, ◀ Back, or press B to cancel.'); h=`<div class=mn><button id=cX>◀ Back</button></div>`; }
 box.innerHTML=hd+h; const tap=(sel,f)=>box.querySelectorAll(sel).forEach(b=>b.addEventListener('pointerdown',e=>{ e.preventDefault(); if(!b.disabled) f(b); }));
 tap('#mOk',()=>{ WK.moveTo(g,a,ui.sel[0],ui.sel[1]); ui.sel=null; ui.mode='menu'; play(()=>render()); }); tap('#mSt',()=>{ ui.sel=null; WK.moveTo(g,a,a.x,a.y); ui.mode='menu'; render(); });
 tap('#cF',()=>doAct('Attack')); tap('#cT',()=>{ ui.mode='tech'; render(); }); tap('#cI',()=>{ ui.mode='item'; render(); }); tap('#cB',()=>{ clearT(); ui.mode='wait'; WK.block(g,a); play(step); }); tap('#cX',()=>{ ui.mode='menu'; render(); });
 if(ui.mode==='tech') tap('.tl button[data-i]',b=>{ const m=WK.menu(g,a)[+b.dataset.i]; if(!m.ok){ ui.note='<b>'+m.t+'</b>: '+m.why+(m.why==='Out of range'?' — move closer next turn, or pick another action.':'.'); ui.mode='menu'; render(); say(ui.note); ui.note=null; return; }
  if(m.i.tg==='ally'){ const al=WK.allyTargets(g,a,m.i.rng); if(!al.length){ ui.mode='menu'; render(); say('<b>'+m.t+'</b>: no ally in range.'); return; } ui.tech=m.t; ui.allies=al; ui.mode='ally'; render(); } else doAct(m.t); });
 if(ui.mode==='item') tap('.tl button[data-i]',b=>{ const m=WK.items(g,a)[+b.dataset.i]; clearT(); ui.mode='wait'; WK.item(g,a,m.k,m.tgt); play(step); }); }
function end(){ clearT(); render(); const S=WK.scores(g), win=g.over==='win', ch=['dmg','pro','sus','con'], nm={dmg:'Damage',pro:'Protection',sus:'Sustain',con:'Control'}, col={dmg:'#f64',pro:'#6af',sus:'#5e8',con:'#c8f'};
 const m=S.mvp, top=ch.slice().sort((a,c)=>m.share[ch.indexOf(c)]-m.share[ch.indexOf(a)])[0]; const L=win?WK.loot(g):[]; opt.onEnd&&opt.onEnd({result:g.over,rounds:g.round,scores:S,mvp:m.u.name,meMvp:!!m.u.me});
 const e=document.createElement('div'); e.className='wend'; e.innerHTML=SK(`<h1 class="${win?'':'lose'}">${win?'VICTORY':g.over==='escape'?'IT ESCAPED':'DEFEATED'}</h1><div style="text-align:center;color:#bcd">${win?'Thunder Ape Monarch defeated in '+g.round+' rounds · party advances · +175 gold':'The Monarch survives — Sunday’s attempt continues the fight.'}</div>
 <div class=mvp><img src="${sp(m.u)}"><div><div style="font:700 11px system-ui;color:#fc6;letter-spacing:2px">MVP</div><div style="font:900 20px system-ui">${m.u.name}</div><div style="color:#fd9">“${TITLE[top]}” · ${m.u.role}</div><div style="font-size:12px;color:#cba">${Math.round(m.total*100)}% of the party’s contribution</div></div></div>
 <table class=sct><tr style="color:#9ab;font-size:11px"><td></td>${ch.map(k=>`<td>${nm[k]}</td>`).join('')}</tr>${S.rows.map(r=>`<tr><td style="white-space:nowrap"><img src="${sp(r.u)}" style="height:22px;vertical-align:middle"> ${r.u.me?'★':''}${r.u.name}</td>${r.share.map((s,i)=>`<td><div class=b><i style="width:${Math.round(s*100)}%;background:${col[ch[i]]}"></i></div><span style="font-size:10px;color:#9ab">${r.u.sc[ch[i]]}</span></td>`).join('')}</tr>`).join('')}</table>
 ${win?`<div class=chest id=chest><div class=box></div><div class=lid></div></div><div style="text-align:center;font-size:12px;color:#bcd" id=chh>Tap the chest</div><div id=lootl></div>`:''}
 <button class=wbt id=again>Fight again</button><button class=wbt id=back style="background:#333">Back to day</button>`); document.body.appendChild(e);
 const tap=(s,f)=>{ const b=e.querySelector(s); b&&b.addEventListener('pointerdown',ev=>{ev.preventDefault();f(b);}); };
 tap('#again',()=>{ e.remove(); $('#wk').remove(); open(opt); }); tap('#back',()=>close());
 tap('#chest',c=>{ if(c.classList.contains('op')) return; c.classList.add('op'); $('#chh').textContent='Need / Greed — Need beats Greed, d100';
  $('#lootl').innerHTML=L.map((it,i)=>it?`<div class=wlt id=L${i}><div style="flex:1"><span class="q ${it.q}">${it.n}</span><br><small style="color:#9ab">${it.q} · sells for ${it.v}g</small></div><button data-c=need>Need</button><button data-c=greed>Greed</button><button data-c=pass>Pass</button></div>`:`<div class=wlt style="opacity:.5">— empty slot —</div>`).join('');
  e.querySelectorAll('.wlt button').forEach(b=>b.addEventListener('pointerdown',ev=>{ ev.preventDefault(); const row=b.closest('.wlt'), i=+row.id.slice(1), mine=b.dataset.c;
   const rolls=g.units.map(u=>{ const c=u.me?mine:(Math.random()<.35?'need':Math.random()<.8?'greed':'pass'); return {u,c,r:c==='pass'?0:1+Math.floor(Math.random()*100)}; }).filter(x=>x.c!=='pass');
   const best=rolls.sort((a,c)=>(c.c==='need')-(a.c==='need')||c.r-a.r)[0]; row.innerHTML=`<div style="flex:1"><span class="q ${L[i].q}">${L[i].n}</span><br><small>${rolls.map(x=>x.u.name+' '+x.c+' '+x.r).join(' · ')||'everyone passed'}</small></div>${best&&best.u.me&&opt.onLoot?(opt.onLoot(L[i]),''):''}<b style="color:${best&&best.u.me?'#7f7':'#ccc'}">${best?(best.u.me?'You win!':best.u.name):'—'}</b>`; })); }); }
window.WKUI={open,get g(){return g;},get ui(){return ui;}};
})();
