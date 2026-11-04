// Explore (Overworld) demo — Pokémon Red-style grid walking. Hooks: talk(npc) for future BoG cameos / side stories.
(function(root){
const MAP=[ // 24x24. T tree, g grass, G tall grass, p path, w water, H building, D door, R rest shrine, L ledge (hop down only), f flowers
'TTTTTTTTTTTTTTTTTTTTTTTT',
'TggggggggggpgggggggggggT',
'TgHHHHHggggpggggHHHHHggT',
'TgHHHHHggggpggggHHHHHggT',
'TgHHDHHggggpggggHHDHHggT',
'TggpppppppppppppppppgggT',
'TgfgggggggpRpggggggfgggT',
'TggggwwwggpppgggggggggggT'.slice(0,24),
'TggggwwwggggpggggggggggT',
'TggggggggggggpgggggggggT',
'TLLLLLLLLLLggpLLLLLLLLLT',
'TggGGGGgggggppggGGGGGggT',
'TggGGGGgggggpgggGGGGGggT',
'TggGGGGggggpggggGGGGGggT',
'TggggggggggpgggggggggggT',
'TggggGGGGGGpGGGGGGggggT'.padEnd(23,'g')+'T',
'TggggGGGGGGpGGGGGGgggggT',
'TggggGGGGGGpGGGGGGgggggT',
'TgggggggggggpggggggggggT',
'TTTTggggggggpgggggggTTTT',
'TTGGGGGgggggpgggGGGGGTTT',
'TTGGGGGgggggpgggGGGGGTTT',
'TTTTTTTTTTTTpTTTTTTTTTTT',
'TTTTTTTTTTTTTTTTTTTTTTTT'];
const W=24,H=24, COL={T:'#1f5a2a',g:'#8bd06a',G:'#3f9a3a',p:'#d9c48a',w:'#3a7ad9',H:'#b55',D:'#5a3320',R:'#e8d070',L:'#7a6a3a',f:'#8bd06a'};
const NPCS=[ // hook: id lets polish add BoG cameos / side-story dialogue via World.talk
 {id:'elder',x:6,y:6,em:'👴',dir:'down',line:'Elder Fang: The Collective sends scouts through the tall grass south of town. Train there.'},
 {id:'merchant',x:16,y:6,em:'👩‍🌾',dir:'down',line:'Auntie Mei: Rest at the golden shrine by the path and your squad is good as new.'},
 {id:'kid',x:9,y:9,em:'🧒',dir:'left',line:'Little Bo: Hop down the ledge, but you can\'t climb back up it!'},
 {id:'trainer',x:15,y:14,em:'🎖️',dir:'left',range:5,trainer:1,line:'Commissar Scout Ren: A sect cultivator! Your territory belongs to the Collective now!',after:'Ren: Hmph. Next time, cultivator.'}];
const DIRS={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
const tile=(x,y)=>(x<0||y<0||x>=W||y>=H)?'T':MAP[y][x];
function npcAt(w,x,y){ return NPCS.find(n=>{ const p=w.npc[n.id]; return p.x===x&&p.y===y; }); }
function passable(w,x,y,dy){ const t=tile(x,y); if('THDw'.includes(t)) return false; if(t==='L'&&dy!==1) return false; if(npcAt(w,x,y)) return false; if(w.x===x&&w.y===y) return false; return true; }
function newState(s){ s=s||{}; const w={x:s.x??11,y:s.y??7,dir:s.dir||'down',beaten:s.beaten||{},hp:s.hp||null,pk:s.pk||null,steps:s.steps||0,npc:{}};
  NPCS.forEach(n=>w.npc[n.id]={x:n.x,y:n.y,dir:n.dir}); return w; }
let w=null, cv, cx, hooks, held=null, mv=null, txt=null, busy=false, raf=0, rng=Math.random, el;
function save(){ hooks.save({x:w.x,y:w.y,dir:w.dir,beaten:w.beaten,hp:w.hp,pk:w.pk,steps:w.steps}); }
function say(t,then){ txt={t,then}; el.querySelector('#wtx').style.display='block'; el.querySelector('#wtx').textContent=t+'  ▼'; }
function closeTxt(){ const th=txt&&txt.then; txt=null; el.querySelector('#wtx').style.display='none'; if(th) th(); }
function face(){ const [dx,dy]=DIRS[w.dir]; return [w.x+dx,w.y+dy]; }
function A(){ if(txt) return closeTxt(); if(busy||mv) return; const [fx,fy]=face(), n=npcAt(w,fx,fy);
  if(n){ const back={up:'down',down:'up',left:'right',right:'left'}[w.dir]; w.npc[n.id].dir=back; const custom=hooks.talk&&hooks.talk(n.id);
    if(n.trainer&&!w.beaten[n.id]) return trainerFight(n); return say(custom||(n.trainer?n.after:n.line)); }
  if(tile(fx,fy)==='R'||tile(w.x,w.y)==='R') { w.hp=null; w.pk=null; save(); return say('You pray at the shrine. Your cultivator is fully restored!'); }
  if(tile(fx,fy)==='D') return say('The door is locked. (Interiors come later.)'); }
function B(){ if(txt) return closeTxt(); if(busy||mv) return; say('Menu: A to keep exploring.  Progress saves automatically. (Leave with the ✕ button.)'); }
function step(){ if(mv||txt||busy||!held) return; const d=held; const [dx,dy]=DIRS[d];
  if(w.dir!==d){ w.dir=d; if(!mv){ mv={fx:w.x,fy:w.y,t:0,dur:.06,turn:1}; } return; }
  let nx=w.x+dx, ny=w.y+dy; if(!passable(w,nx,ny,dy)) return;
  if(tile(nx,ny)==='L') ny+=1; // hop over ledge
  mv={fx:w.x,fy:w.y,t:0,dur:tile(w.x+dx,w.y+dy)==='L'?.32:.18}; w.x=nx; w.y=ny; }
function arrive(){ w.steps++; save(); if(checkTrainers()) return; if(tile(w.x,w.y)==='G'&&rng()<1/12) encounter('wild'); }
function checkTrainers(){ for(const n of NPCS){ if(!n.trainer||w.beaten[n.id]) continue; const p=w.npc[n.id], [dx,dy]=DIRS[p.dir];
    for(let i=1;i<=n.range;i++){ const x=p.x+dx*i,y=p.y+dy*i; if('THw'.includes(tile(x,y))) break; if(x===w.x&&y===w.y){ spot(n,i); return true; } } } return false; }
function spot(n,dist){ busy=true; const p=w.npc[n.id], [dx,dy]=DIRS[p.dir]; p.alert=1; let k=dist-1;
  w.dir={up:'down',down:'up',left:'right',right:'left'}[p.dir];
  const walk=()=>{ if(k<=0){ p.alert=0; busy=false; return trainerFight(n); } p.x+=dx; p.y+=dy; p.mv={t:0,dx,dy}; k--; setTimeout(walk,220); }; setTimeout(walk,600); }
function trainerFight(n){ say(n.line,()=>encounter('trainer',n)); }
function encounter(kind,n){ busy=true; held=null; const f=el.querySelector('#wfl'); let i=0; const fl=()=>{ f.style.opacity=i%2?0:1; if(++i<7) setTimeout(fl,110); else { f.style.opacity=1; setTimeout(()=>{ busy=false; stop(); hooks.battle(kind,n&&n.id); },150);} }; fl(); }
function draw(){ const T=32, VW=cv.width/T, VH=cv.height/T; let px=w.x, py=w.y;
  if(mv&&!mv.turn){ const k=Math.min(1,mv.t/mv.dur); px=mv.fx+(w.x-mv.fx)*k; py=mv.fy+(w.y-mv.fy)*k; }
  const ox=px-(VW-1)/2, oy=py-(VH-1)/2; cx.fillStyle='#1f5a2a'; cx.fillRect(0,0,cv.width,cv.height);
  for(let y=Math.floor(oy)-1;y<oy+VH+1;y++) for(let x=Math.floor(ox)-1;x<ox+VW+1;x++){ const t=tile(x,y), sx=(x-ox)*T, sy=(y-oy)*T; cx.fillStyle=COL[t]; cx.fillRect(sx,sy,T+1,T+1);
    if(t==='T'){ cx.fillStyle='#2f7a3a'; cx.beginPath(); cx.arc(sx+16,sy+14,13,0,7); cx.fill(); cx.fillStyle='#5a3a20'; cx.fillRect(sx+13,sy+24,6,8); }
    else if(t==='G'){ cx.fillStyle='#2a7a2a'; for(let i=0;i<3;i++){ cx.beginPath(); cx.moveTo(sx+4+i*10,sy+30); cx.lineTo(sx+9+i*10,sy+8); cx.lineTo(sx+14+i*10,sy+30); cx.fill(); } }
    else if(t==='H'){ cx.fillStyle=y%2?'#a44':'#c66'; cx.fillRect(sx,sy,T,T/2); } else if(t==='L'){ cx.fillStyle='#5a4a2a'; cx.fillRect(sx,sy+20,T,8); }
    else if(t==='w'){ cx.fillStyle='#6aa0f0'; cx.fillRect(sx+4,sy+10,10,2); cx.fillRect(sx+16,sy+20,10,2); } else if(t==='f'){ cx.fillStyle='#f6a'; cx.fillRect(sx+8,sy+8,5,5); cx.fillRect(sx+20,sy+18,5,5); }
    else if(t==='R'){ cx.font='22px serif'; cx.fillText('⛩️',sx+4,sy+25); } }
  cx.textAlign='center'; cx.font='26px serif';
  for(const n of NPCS){ const p=w.npc[n.id]; let nx=p.x,ny=p.y; if(p.mv){ p.mv.t+=1/60; const k=Math.min(1,p.mv.t/.2); nx=p.x-p.mv.dx*(1-k); ny=p.y-p.mv.dy*(1-k); if(k>=1) p.mv=null; }
    const sx=(nx-ox)*T+16, sy=(ny-oy)*T+26; cx.fillText(n.em,sx,sy); if(p.alert){ cx.fillStyle='#fff'; cx.fillRect(sx-7,sy-50,14,18); cx.fillStyle='#d00'; cx.font='bold 16px sans-serif'; cx.fillText('!',sx,sy-36); cx.font='26px serif'; } }
  const bob=mv&&!mv.turn?Math.sin(mv.t/mv.dur*Math.PI)*(mv.dur>.3?10:2):0; cx.fillText('🧑‍🎤',(px-ox)*T+16,(py-oy)*T+26-bob);
  cx.fillStyle='#fff'; cx.font='bold 12px sans-serif'; const arrow={up:'▲',down:'▼',left:'◀',right:'▶'}[w.dir]; cx.fillText(arrow,(px-ox)*T+16,(py-oy)*T+38); cx.textAlign='left'; }
function frame(dt){ if(mv){ mv.t+=dt; if(mv.t>=mv.dur){ const turned=mv.turn; mv=null; if(!turned) arrive(); } } step(); draw(); }
let last=0; function loop(now){ frame(Math.min(.05,(now-last)/1000)); last=now; raf=requestAnimationFrame(loop); }
function stop(){ cancelAnimationFrame(raf); held=null; }
function keyd(e){ if(!el||!document.body.contains(el)) return; const k={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'}[e.key]; if(k){ held=k; e.preventDefault(); } if(e.key==='z'||e.key==='Z') A(); if(e.key==='x'||e.key==='X') B(); }
function keyu(e){ const k={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'}[e.key]; if(k&&held===k) held=null; }
if(typeof document!=='undefined'){ document.addEventListener('keydown',keyd); document.addEventListener('keyup',keyu); }
function open(container,s,h){ hooks=h; el=container; w=newState(s); busy=false; mv=null; txt=null;
  el.innerHTML=`<div style="position:relative"><canvas id=wcv width=320 height=288 style="width:100%;image-rendering:pixelated;border-radius:6px;background:#000;touch-action:none"></canvas>
  <div id=wfl style="position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;transition:opacity .08s"></div>
  <div id=wtx style="display:none;position:absolute;left:4px;right:4px;bottom:4px;background:#fff;color:#000;border:3px double #333;border-radius:6px;padding:8px;font:16px monospace"></div></div>
  <div class=wpad><div class=dpad>${['up','left','right','down'].map(d=>`<button class="dp dp-${d}" data-d=${d}>${{up:'▲',down:'▼',left:'◀',right:'▶'}[d]}</button>`).join('')}</div>
  <div class=ab><button class=wb id=wB>B</button><button class=wb id=wA>A</button></div></div>`;
  cv=el.querySelector('#wcv'); cx=cv.getContext('2d');
  el.querySelectorAll('.dp').forEach(b=>{ const d=b.dataset.d; b.addEventListener('pointerdown',e=>{ e.preventDefault(); held=d; try{b.setPointerCapture(e.pointerId)}catch(_){} });
    ['pointerup','pointercancel','lostpointercapture'].forEach(t=>b.addEventListener(t,e=>{ e.preventDefault(); if(held===d) held=null; })); });
  el.querySelector('#wA').addEventListener('pointerdown',e=>{ e.preventDefault(); A(); }); el.querySelector('#wB').addEventListener('pointerdown',e=>{ e.preventDefault(); B(); });
  last=performance.now(); cancelAnimationFrame(raf); raf=requestAnimationFrame(loop); if(h.msg) say(h.msg); }
root.World={open,stop,MAP,NPCS,tile,get state(){return w;},press:d=>{held=d;},release:()=>{held=null;},A,B,setRng:r=>rng=r,tick:frame};
})(window);
