// Nascent board demo (p14): Strategery-style hex Risk. Locked rules: cultivation_19 (40 hexes, 4 corner homelands of 5, Ruin's Collective holds 20,
// d20 + 1 per 2 armies, casualty bands, homeland +2/-1 loss & never captured, Generals D/A/S start 2 cap 4, regen 25% cap 20 / Mobilized 40 & 50%). No strategic tiles, no fortify.
(function(root){
const W=5,H=8,N=W*H, RUIN=4, CAP=20;
const BEATS={Light:'Mass',Mass:'Force',Force:'Light'}; const eff=(a,d)=>BEATS[a]===d?1:0;
const xy=i=>[i%W,Math.floor(i/W)], id=(x,y)=>x<0||y<0||x>=W||y>=H?-1:y*W+x;
function nb(i){ const [x,y]=xy(i), o=y%2; return [[-1,0],[1,0],[o-1,-1],[o,-1],[o-1,1],[o,1]].map(([dx,dy])=>id(x+dx,y+dy)).filter(j=>j>=0); }
const ADJ=[...Array(N).keys()].map(nb);
const HOMES=[[[0,0],[1,0],[0,1],[1,1],[0,2]],[[4,0],[3,0],[4,1],[3,1],[4,2]],[[0,7],[1,7],[0,6],[1,6],[0,5]],[[4,7],[3,7],[4,6],[3,6],[4,5]]].map(h=>h.map(([x,y])=>id(x,y)));
let NAMES=['You','Green','Blue','Gold','Ruin'], COLS=['#ff8fb8','#7fe08a','#7fb8ff','#ffd66b','#8a8f9c'];
const GT={D:'🛡️',A:'⚔️',S:'🧠'};
function newGame(o={}){ const r=o.rng||Math.random, me=o.path||'Body', paths=[me].concat(['Body','Force','Light','Mass'].filter(p=>p!==me)).concat(['Body']);
  const hex=[...Array(N)].map((_,i)=>({o:RUIN,a:3+Math.floor(r()*3),home:-1,g:null}));
  HOMES.forEach((h,p)=>h.forEach((i,k)=>{ hex[i]={o:p,a:k?4:6,home:p,g:k<2?['D','A','S'][Math.floor(r()*3)]:null}; }));
  return {rng:r,hex,paths,turn:0,round:1,maxRound:o.maxRound||15,cur:0,mob:[0,0,0,0,0],gens:[2,2,2,2,0],over:false,log:[],human:o.human??0}; }
const capOf=(G,i)=>{ const h=G.hex[i]; return h.home>=0&&G.mob[h.o]?40:CAP; };
function regen(G,p){ G.hex.forEach((h,i)=>{ if(h.o!==p) return; const m=h.home>=0&&G.mob[p]?.5:.25; h.a=Math.min(capOf(G,i),h.a+Math.max(1,Math.round(h.a*m))); }); }
function mobilize(G,p){ if(G.mob[p]) return 'Already mobilized.'; G.mob[p]=1; return NAMES[p]+': Sovereign Mobilization! Homeland cap 40, regen 50%.'; }
const d20=G=>1+Math.floor(G.rng()*20);
const BANDS=[[2,1,2],[5,1,4],[8,-1,6],[99,0,8]]; // gap<=x: winner loses w (-1 = 0-1), loser loses l
function attack(G,f,t){ const A=G.hex[f], D=G.hex[t]; if(A.o===D.o||!ADJ[f].includes(t)||A.a<2) return null;
  const ra=d20(G), rd=d20(G), ba=Math.floor(A.a/2)+eff(G.paths[A.o],G.paths[D.o]), bd=Math.floor(D.a/2)+eff(G.paths[D.o],G.paths[A.o])+(D.home>=0?2:0);
  const ta=ra+ba, td=rd+bd, aw=ta>td, gap=Math.abs(ta-td), band=BANDS.find(b=>gap<=b[0]);
  let wl=band[1]<0?Math.floor(G.rng()*2):band[1], ll=band[2]; const wG=aw?A.g:D.g, lG=aw?D.g:A.g;
  if(wG==='A') ll++; let la=aw?wl:ll, ld=aw?ll:wl;
  if(D.g==='D') ld=Math.max(0,ld-1); if(D.home>=0) ld=Math.max(0,ld-1); if(A.g==='S') la=Math.floor(la/2);
  la=Math.min(la,A.a-1); const res={f,t,ra,rd,ta,td,ba,bd,aw,la,ld:Math.min(ld,D.a),cap:false,gen:null,ap:A.o,dp:D.o};
  A.a-=la; D.a-=ld; if(D.home>=0) D.a=Math.max(1,D.a);
  if(D.a<=0){ res.cap=true; D.o=A.o; D.a=A.a-1; A.a=1; if(D.g&&res.dp!==A.o){ G.gens[res.dp]--; D.g=null; } }
  if(aw&&ra===20&&gap>=10&&G.gens[A.o]<4){ const spot=[f,t].concat(G.hex.map((_,i)=>i)).find(i=>G.hex[i].o===A.o&&!G.hex[i].g); if(spot!=null){ G.hex[spot].g=['D','A','S'][Math.floor(G.rng()*3)]; G.gens[A.o]++; res.gen='gain'; } }
  if(!aw&&ra===1&&gap>=10&&A.g){ A.g=null; G.gens[A.o]--; res.gen='lose'; }
  return res; }
function reach(G,p,f){ const seen=new Set([f]), q=[f]; while(q.length){ const i=q.shift(); for(const j of ADJ[i]) if(!seen.has(j)&&G.hex[j].o===p){ seen.add(j); q.push(j); } } seen.delete(f); return seen; }
function moveTroops(G,f,t,n){ const a=G.hex[f], b=G.hex[t], p=a.o; if(b.o!==p||!reach(G,p,f).has(t)) return 0; n=Math.max(0,Math.min(n,a.a-1,capOf(G,t)-b.a)); a.a-=n; b.a+=n; return n; }
const border=(G,i)=>ADJ[i].some(j=>G.hex[j].o!==G.hex[i].o);
function aiMove(G,p){ let moved=0; G.hex.forEach((h,i)=>{ if(h.o!==p||h.a<2||border(G,i)) return; const bs=[...reach(G,p,i)].filter(j=>border(G,j)&&G.hex[j].a<capOf(G,j)).sort((x,y)=>G.hex[x].a-G.hex[y].a);
  if(bs.length) moved+=moveTroops(G,i,bs[0],h.a-1); }); return moved; }
function moveGen(G,p,f,t){ const a=G.hex[f], b=G.hex[t]; if(a.o!==p||b.o!==p||!a.g||b.g) return false; b.g=a.g; a.g=null; return true; }
const count=(G,p)=>G.hex.filter(h=>h.o===p).length, armies=(G,p)=>G.hex.reduce((s,h)=>s+(h.o===p?h.a:0),0);
function aiMoves(G,p){ // greedy: best odds adjacent attack; Ruin mostly defends
  let best=null; G.hex.forEach((h,i)=>{ if(h.o!==p||h.a<3) return; ADJ[i].forEach(t=>{ const d=G.hex[t]; if(d.o===p) return; if(p===RUIN&&d.home>=0) return;
    const v=h.a-d.a-(d.home>=0?6:0)+(d.o===RUIN?1:0); if(!best||v>best.v) best={f:i,t,v}; }); });
  return best&&best.v>=(p===RUIN?4:1)?best:null; }
function aiTurn(G,p){ const out=[]; if(!G.mob[p]&&p!==RUIN&&count(G,p)<=6&&G.round>=3) out.push({mob:1});
  const lim=p===RUIN?(G.rng()<.35?1:0):6; return {lim,out}; }
function startTurn(G){ G.phase='attack'; G.moved=0; regen(G,G.cur); G.attacksLeft=G.cur===RUIN?(G.rng()<.35?1:0):99; }
function endTurn(G){ G.cur=(G.cur+1)%5; if(G.cur===0){ G.round++; if(G.round>G.maxRound) G.over=true; } if(!G.over) startTurn(G); }
function aiStep(G){ // one AI action; returns result or null when done
  const p=G.cur; if(p!==RUIN&&!G.mob[p]&&count(G,p)<=6&&G.round>=3){ return {msg:mobilize(G,p)}; }
  const m=G.attacksLeft>0&&aiMoves(G,p); if(!m){ if(p!==RUIN&&!G.moved){ G.moved=1; const n=aiMove(G,p); if(n) return {msg:NAMES[p]+' moved '+n+' troops to the front.'}; } return null; } G.attacksLeft--; return attack(G,m.f,m.t); }
const api={reach,moveTroops,aiMove,W,H,N,ADJ,HOMES,NAMES,COLS,GT,RUIN,newGame,attack,moveGen,mobilize,regen,count,armies,startTurn,endTurn,aiStep,capOf};
// ---------------- UI ----------------
if(typeof document!=='undefined'){
 let G,el,mv=null,sel=null,gsel=null,ff=false,tm=0,msg='',banner='',hooks;
 const R=30, HX=R*Math.sqrt(3);
 function cen(i){ const [x,y]=xy(i); return [HX*(x+.5*(y%2))+HX/2+4, R*1.5*y+R+4]; }
 function poly(i){ const [cx,cy]=cen(i); let s=i*9301+49297; const j=()=>{ s=(s*9301+49297)%233280; return s/233280-.5; }; const pts=[];
  for(let k=0;k<6;k++){ for(const f of [0,.5]){ const a=Math.PI/180*(60*(k+f)-30), rr=(f?R*.93:R)-1.5+j()*3.2; pts.push((cx+rr*Math.cos(a)).toFixed(1)+','+(cy+rr*Math.sin(a)).toFixed(1)); } } return pts.join(' '); }
 function svg(){ const w=HX*(W+.5)+8, h=R*1.5*(H-1)+2*R+8; let s=`<svg viewBox="0 0 ${w} ${h}" style="width:100%;display:block;touch-action:none">`;
  G.hex.forEach((hx,i)=>{ const [cx,cy]=cen(i), mvp=G.phase==='move'&&sel!=null, on=sel===i||(mv&&mv.t===i), tg=sel!=null&&(mvp?reach(G,G.human,sel).has(i):ADJ[sel].includes(i)&&hx.o!==G.hex[sel].o);
   s+=`<polygon data-i=${i} points="${poly(i)}" fill="${COLS[hx.o]}" stroke="${on?'#fff':tg?'#fff6':'#1a1a22'}" stroke-width="${on?4:tg?3:2.5}" ${hx.home>=0?'':'opacity=".92"'}/>`;
   if(hx.home>=0) s+=`<text x=${cx} y=${cy-14} text-anchor=middle font-size=9 fill="#0006" pointer-events=none>⌂</text>`;
   s+=`<text x=${cx} y=${cy+7} text-anchor=middle font-size=20 font-weight=900 fill="#16161e" pointer-events=none>${hx.a}</text>`;
   if(hx.g){ const glow=sel!=null&&(sel===i||(ADJ[sel].includes(i)&&hx.o!==G.hex[sel].o)); s+=`<g data-g=${i}><circle cx=${cx+15} cy=${cy+13} r=9 fill="${glow?'#fff':'#222'}" stroke="${gsel===i?'#ff0':'#000'}" stroke-width=2 ${glow?'style="filter:drop-shadow(0 0 4px #ff0)"':''}/><text x=${cx+15} y=${cy+17} text-anchor=middle font-size=10 pointer-events=none>${GT[hx.g]}</text></g>`; } });
  return s+'</svg>'; }
 function draw(){ const hum=G.cur===G.human&&!G.over;
  const hud=[0,1,2,3,4].map(p=>`<span style="display:inline-flex;align-items:center;gap:3px;margin-right:8px"><svg width=16 height=16 viewBox="0 0 16 16"><polygon points="8,1 15,4.5 15,11.5 8,15 1,11.5 1,4.5" fill="${COLS[p]}" stroke="${G.cur===p?'#fff':'#000'}" stroke-width=2/></svg><b>${armies(G,p)}</b></span>`).join('');
  const prompt=G.over?final():hum&&mv?`Move <b>${mv.n}</b> troops`:hum&&G.phase==='move'?(msg||(sel!=null?'Tap a connected hex you own':'Move troops: tap your hex, then a connected hex you own')):hum?(msg||(gsel!=null?'Tap an owned hex to move the General':sel!=null?'Tap an adjacent enemy':'Your turn! Tap your territory, then an adjacent enemy')):(msg||NAMES[G.cur]+"'s turn");
  el.innerHTML=`<div class=nsb><div class=nhud>${hud}<span style="float:right">R${Math.min(G.round,G.maxRound)}/${G.maxRound}</span></div>
   <div class=nmap>${svg()}${banner?`<div class=nban>${banner}</div>`:''}</div>
   <div class=nbar><div class=nmsg>${prompt}</div>${G.over?`<button class=npill id=nnew>New</button>`:hum&&mv?`<button class=npill id=nmin>−</button><button class=npill id=npl>+</button><button class=npill id=nok>Move</button><button class=npill id=nx>✕</button>`:hum&&G.phase==='move'?`<button class=npill id=nend>End Turn</button>`:hum?`${G.mob[0]?'':`<button class="npill nmob" id=nmob>Mobilize</button>`}<button class=npill id=nea>End Attacks</button>`:`<button class=npill id=nff>${ff?'▶▶ on':'▶▶'}</button>`}</div>
   <div class=nsum>${[0,1,2,3,4].map(p=>`<span style="color:${COLS[p]}">${NAMES[p]} ${count(G,p)}</span>`).join(' · ')} territories <button class=s id=nback style="float:right">Back</button></div></div>`;
  el.querySelectorAll('polygon[data-i]').forEach(x=>x.addEventListener('pointerdown',e=>{ e.preventDefault(); tap(+x.dataset.i); }));
  el.querySelectorAll('g[data-g]').forEach(x=>x.addEventListener('pointerdown',e=>{ e.preventDefault(); e.stopPropagation(); if(G.cur!==G.human) return; const i=+x.dataset.g; if(G.hex[i].o===G.human){ gsel=gsel===i?null:i; sel=null; msg=''; draw(); } }));
  const b=(s,f)=>{ const x=el.querySelector(s); if(x) x.addEventListener('pointerdown',e=>{ e.preventDefault(); f(); }); };
  b('#nend',()=>{ sel=gsel=null; mv=null; msg=''; endTurn(G); hooks.save(G); runAI(); }); b('#nea',()=>{ G.phase='move'; sel=gsel=null; msg=''; hooks.save(G); draw(); }); b('#nmin',()=>{ mv.n=Math.max(1,mv.n-1); draw(); }); b('#npl',()=>{ mv.n=Math.min(mv.max,mv.n+1); draw(); }); b('#nx',()=>{ mv=null; sel=null; draw(); }); b('#nok',()=>{ const n=moveTroops(G,mv.f,mv.t,mv.n); msg=`Moved ${n} troops.`; mv=null; sel=null; hooks.save(G); draw(); }); b('#nff',()=>{ ff=!ff; draw(); }); b('#nmob',()=>{ msg=mobilize(G,0); hooks.save(G); draw(); });
  b('#nnew',()=>{ G=newGame({path:G.paths[0]}); startTurn(G); hooks.save(G); draw(); }); b('#nback',()=>{ clearTimeout(tm); hooks.save(G); hooks.back(); }); }
 function final(){ const c=[0,1,2,3].map(p=>[p,count(G,p)]).sort((a,b)=>b[1]-a[1]); return `Game over! ${NAMES[c[0][0]]} leads with ${c[0][1]} territories.`; }
 function show(r){ if(!r) return; if(r.msg){ msg=r.msg; banner=''; return; } msg=`🎲 ${r.ra}+${r.ba}=${r.ta} vs ${r.td}`;
  const who=r.ap===G.human?'You':NAMES[r.ap]; banner=(r.ap===G.human?(r.aw?`You won! Lost ${r.la}`:`You lost ${r.la}`):`${who} ${r.aw?'won':'lost'} vs ${NAMES[r.dp]}`)+(r.cap?' · Captured!':'')+(r.gen==='gain'?' · ⭐ New General!':r.gen==='lose'?' · General lost!':'');
  clearTimeout(show.t); show.t=setTimeout(()=>{ banner=''; if(el&&document.body.contains(el)) draw(); },900); }
 function tap(i){ if(G.over||G.cur!==G.human) return; const h=G.hex[i];
  if(gsel!=null){ if(moveGen(G,G.human,gsel,i)) msg='General moved.'; gsel=null; hooks.save(G); return draw(); }
  if(G.phase==='move'){ if(mv||h.o!==G.human) return; if(sel!=null&&sel!==i&&reach(G,G.human,sel).has(i)){ const max=Math.min(G.hex[sel].a-1,capOf(G,i)-h.a); if(max<1){ msg='That hex is at its army cap.'; sel=null; return draw(); } mv={f:sel,t:i,n:max,max}; return draw(); } sel=sel===i?null:i; msg=''; if(sel!=null&&h.a<2){ msg='Need 2+ armies to move.'; sel=null; } return draw(); }
  if(h.o===G.human){ sel=sel===i?null:i; msg=h.a<2?'Need 2+ armies to attack.':''; return draw(); }
  if(sel!=null&&ADJ[sel].includes(i)){ const r=attack(G,sel,i); show(r); if(r&&r.cap) sel=G.hex[i].a>=2?i:null; else if(G.hex[sel].a<2) sel=null; hooks.save(G); return draw(); } }
 function runAI(){ clearTimeout(tm); if(G.over||G.cur===G.human) return draw(); const r=aiStep(G); if(!r){ endTurn(G); hooks.save(G); msg=''; draw(); tm=setTimeout(runAI,ff?20:350); return; } show(r); draw(); tm=setTimeout(runAI,ff?30:420); }
 api.open=function(container,saved,h){ hooks=h; NAMES=h.names||['You','Green','Blue','Gold','Ruin']; el=container; G=saved?Object.assign(newGame(),saved,{rng:Math.random}):(()=>{ const g=newGame({path:h.path,maxRound:h.maxRound}); if(h.bonus) g.hex.forEach(x=>{ if(x.o===0) x.a+=h.bonus; }); startTurn(g); return g; })(); sel=gsel=null; msg=''; banner=''; draw(); runAI(); };
 api.autoTurn=function(){ if(!G||G.over||G.cur!==G.human) return false; const h=G.human; G.human=-1; let n=0; while(n++<500&&aiStep(G)); G.human=h; sel=gsel=null; mv=null; endTurn(G); hooks.save(G); runAI(); return true; }; api.isMine=()=>G&&!G.over&&G.cur===G.human;
 api.save=g=>{ const {rng,...r}=g; return JSON.parse(JSON.stringify(r)); };
}
root.NAS2=api; if(typeof module!=='undefined') module.exports.NAS2=api;
})(typeof window!=='undefined'?window:global);
