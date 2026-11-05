// Hold the Line v2 — real-time side-view lane (Age of War style). DBG stats under the hood (cultivation_14 unit HP/hit, Combat-sheet hero stats).
(function(root){
const LANE=1000, GATE_X=40, SPAWN_X=LANE;
const PL={Striker:[2000,1249,2450,1503],Vanguard:[5150,351,6230,426],Controller:[2000,727,2450,865],Support:[2100,615,2545,737],Bruiser:[2100,1260,2545,1511]};
const KIT={Striker:1.0,Bruiser:1.0,Vanguard:0.9,Controller:1.15,Support:1.25};
const TURN=2; // 1 DBG combat turn = 2 s of real time
const REALMS=['Foundation','Core','Nascent'];
// Collective (cultivation_14 roster): hp x G(L), hit x e(L), speed px/s, credit on kill
const EN={Conscript:{hp:1,hit:1,spd:45,cr:4,rng:20,col:'#c33'},Brigadier:{hp:.6,hit:.8,spd:80,cr:4,rng:20,col:'#e63'},Clerk:{hp:.8,hit:.7,spd:45,cr:5,rng:140,col:'#c9c',lv:4},
  Tractor:{hp:3,hit:1.5,spd:25,cr:10,rng:25,col:'#777',dr:.4,lv:6},Loudspeaker:{hp:1.5,hit:.5,spd:45,cr:8,rng:20,col:'#fc3',lv:8,aura:1},
  Hammerov:{hp:6,hit:3,spd:35,cr:30,rng:30,col:'#900',boss:1}};
// support units (Sect Credit): hp x hero maxHP, dmg x hero dmg/turn
const UNITS={Disciple:{cost:15,hp:.35,dmg:.25,rng:22,spd:55,col:'#4c4'},Archer:{cost:25,hp:.2,dmg:.3,rng:170,spd:50,col:'#4cf',back:45},
  Healer:{cost:30,hp:.25,dmg:.05,rng:120,spd:45,heal:.06,col:'#fff',back:75},General:{cost:120,hp:1.2,dmg:.8,rng:28,spd:40,aura:.2,col:'#fd0',realm:1}};
const G=(L,R)=>(globalThis.DEMO_K||1)*(1000+60*(L-1))*Math.pow(10,R), E=(L,R)=>(globalThis.DEMO_K||1)*(120+10*L)*Math.pow(10,R);
function hero(role,L,R){ const [a,b,c,d]=PL[role], t=(L-1)/9; const bf=R<=1?1.25:1; return {hp:bf*(a+(c-a)*t)*Math.pow(10,R), dpt:bf*(b+(d-b)*t)*KIT[role]*Math.pow(10,R)}; }
// wave budget: locked B(L)=18,000+1,500(L-1) at wave 1, then +35% per wave and x1.08 per level so the Collective eventually overwhelms
const budget=(L,R,wave)=>Math.min(1,.55+.1*(L-1))*(18000+1500*(L-1))*Math.pow(1.10,L-1)*Math.pow(1.32,wave-1)*Math.pow(10,R);
function newGame(role,L,R,opt={}){ const h=hero(role,L,R);
  return {role,L,R:R||0,wave:0,t:0,gateMax:2000*Math.pow(10,R||0)*(1+.05*(L-1)),gate:0,credit:40,earned:0,spent:0,bought:{},
    hero:{x:120,hp:h.hp,mx:h.hp,dpt:h.dpt,cd:0,ko:0,move:0,t1:0,t2:0},foes:[],allies:[],fx:[],log:[],rng:opt.rng||Math.random,over:false}; }
function startWave(g){ g.wave++; g.t=0; g.kills=0; g.waveCredit0=g.earned; g.waveSpent0=g.spent; g.boughtW={}; g.gate=g.wave===1?g.gateMax:Math.min(g.gateMax,g.gate+.25*g.gateMax);
  const r=g.rng, pool=Object.keys(EN).filter(k=>!EN[k].boss&&(EN[k].lv||1)<=g.L); let B=budget(g.L,g.R,g.wave), q=[];
  if(g.wave%3===0||r()<2/15){ q.push('Hammerov'); B-=EN.Hammerov.hp*G(g.L,g.R); }
  while(B>0.3*G(g.L,g.R)){ const k=pool[Math.floor(r()*pool.length)]; q.push(k); B-=EN[k].hp*G(g.L,g.R); }
  const spread=Math.min(55,20+q.length*1.6); g.queue=q.map((k,i)=>({k,at:spread*i/q.length+r()*2})).sort((a,b)=>a.at-b.at); g.waveOver=false; g.result=null; }
function buy(g,k){ const u=UNITS[k]; if(u.realm&&g.R<u.realm) return 'General unlocks at Core (age up)'; if(g.credit<u.cost) return 'Need '+u.cost+' credit';
  g.credit-=u.cost; g.spent+=u.cost; g.boughtW[k]=(g.boughtW[k]||0)+1; g.bought[k]=(g.bought[k]||0)+1;
  g.allies.push({k,x:GATE_X+10,hp:1.25*u.hp*g.hero.mx,mx:1.25*u.hp*g.hero.mx,cd:0}); return k+' joins the line'; }
function tech(g,n){ const h=g.hero; if(h.ko) return 'Knocked out'; if(n===1){ if(h.t1>0) return 'Cooling down'; h.t1=10; // Burst: 3x dmg to all in range
    g.foes.filter(f=>Math.abs(f.x-h.x)<=200).forEach(f=>dmg(g,f,h.dpt*3/TURN*TURN)); g.fx.push({x:h.x,t:.4,c:'#ff0'}); return 'Burst!'; }
  if(h.t2>0) return 'Cooling down'; h.t2=20; h.hp=Math.min(h.mx,h.hp+.35*h.mx); g.allies.forEach(a=>a.hp=Math.min(a.mx,a.hp+.35*a.mx)); g.fx.push({x:h.x,t:.4,c:'#4f4'}); return 'Rally: +35% HP'; }
function dmg(g,f,d){ f.hp-=d*(1-(EN[f.k].dr||0)); if(f.hp<=0&&!f.dead){ f.dead=true; const c=EN[f.k].cr; g.credit+=c; g.earned+=c; g.kills++; } }
function step(g,dt){ if(g.waveOver) return; g.t+=dt; const h=g.hero, L=g.L, R=g.R;
  while(g.queue.length&&g.queue[0].at<=g.t){ const k=g.queue.shift().k, e=EN[k]; g.foes.push({k,x:SPAWN_X,hp:e.hp*G(L,R),mx:e.hp*G(L,R),cd:0,slow:0}); }
  const aura=g.foes.some(f=>EN[f.k].aura)?1.35:1;
  // hero
  h.t1=Math.max(0,h.t1-dt); h.t2=Math.max(0,h.t2-dt);
  if(h.ko>0){ h.ko-=dt; if(h.ko<=0){ h.hp=.3*h.mx; h.x=120; } }
  else { const front=g.foes.reduce((m,f)=>Math.min(m,f.x),1e9); const nx=h.x+h.move*90*dt; h.x=Math.max(GATE_X+20,Math.min(Math.min(LANE-60,front-15),nx));
    h.cd-=dt; const tg=g.foes.filter(f=>Math.abs(f.x-h.x)<=(g.role==='Controller'||g.role==='Support'?160:60)).sort((a,b)=>a.x-b.x);
    if(tg.length&&h.cd<=0){ h.cd=TURN/2; const per=h.dpt/2; if(g.role==='Controller'){ tg.slice(0,3).forEach(f=>{dmg(g,f,per/Math.min(3,tg.length)); f.slow=1;}); } else dmg(g,tg[0],per); } }
  // allies
  for(const a of g.allies){ const u=UNITS[a.k]; a.cd-=dt; const tg=g.foes.filter(f=>f.x>=a.x-5&&f.x-a.x<=u.rng).sort((x,y)=>x.x-y.x)[0];
    const gen=g.allies.some(b=>b.k==='General'&&Math.abs(b.x-a.x)<150)?1.2:1;
    if(u.heal&&a.cd<=0){ const w=[h,...g.allies].filter(b=>b.hp<b.mx&&Math.abs(b.x-a.x)<=u.rng&&!(b===h&&h.ko>0)).sort((x,y)=>x.hp/x.mx-y.hp/y.mx)[0]; if(w){ w.hp=Math.min(w.mx,w.hp+u.heal*h.mx); a.cd=TURN; } }
    if(tg){ if(a.cd<=0&&!u.heal){ dmg(g,tg,1.25*u.dmg*h.dpt*gen); a.cd=TURN; } else if(u.heal&&a.cd<=0){ dmg(g,tg,u.dmg*h.dpt); a.cd=TURN; } }
    if(u.back){ // back line: hold behind frontmost melee ally (or hero), never lead; pass freely through hero
      const mel=g.allies.filter(b=>!UNITS[b.k].back).map(b=>b.x); const anc=mel.length?Math.max(...mel):(h.ko>0?GATE_X+60:h.x);
      const want=Math.max(GATE_X+10,anc-u.back), d=want-a.x; if(Math.abs(d)>2) a.x+=Math.sign(d)*Math.min(Math.abs(d),u.spd*dt); }
    else if(!tg){ const blocker=g.foes.some(f=>f.x>a.x&&f.x-a.x<u.rng); if(!blocker) a.x=Math.min(LANE-40,a.x+u.spd*dt); } }
  // foes
  for(const f of g.foes){ if(f.dead) continue; const e=EN[f.k]; f.cd-=dt; f.slow=Math.max(0,f.slow-dt);
    const targets=[...g.allies.map(a=>({o:a,x:a.x})), ...(h.ko>0?[]:[{o:h,x:h.x}])].filter(o=>o.x<=f.x&&f.x-o.x<=e.rng+10).sort((a,b)=>b.x-a.x);
    const hit=e.hit*E(L,R)*aura;
    if(targets.length){ if(f.cd<=0){ const o=targets[0].o; o.hp-=hit*(o===h&&g.role==='Vanguard'?.5:1)*(o===h?1-Math.min(.6,.1):1); f.cd=TURN;
        if(o===h&&h.hp<=0){ h.hp=0; h.ko=6; g.log.push('Cultivator knocked out (6 s)'); } } }
    else if(f.x<=GATE_X){ if(f.cd<=0){ g.gate-=hit; f.cd=TURN; } }
    else f.x-=e.spd*(f.slow?.5:1)*aura*dt; }
  g.allies=g.allies.filter(a=>a.hp>0); g.foes=g.foes.filter(f=>!f.dead);
  g.fx=g.fx.filter(x=>(x.t-=dt)>0);
  if(g.gate<=0){ g.gate=0; g.waveOver=true; g.result='fail'; }
  else if(!g.queue.length&&!g.foes.length){ g.waveOver=true; g.result='clear'; g.credit+=10+5*g.wave; g.earned+=10+5*g.wave; }
  else if(g.t>240){ g.waveOver=true; g.result='fail'; }
  if(g.waveOver) g.log.push('Wave '+g.wave+' '+g.result+' in '+Math.round(g.t)+' s'); }
function waveRow(g,ua){ return {wave:g.wave,level:g.L,realm:REALMS[g.R],sec:Math.round(g.t),kills:g.kills,earned:Math.round(g.earned-g.waveCredit0),spent:g.spent-g.waveSpent0,
  units:Object.entries(g.boughtW).map(([k,v])=>k+'x'+v).join(' '),gate:Math.round(g.gate),gateMax:Math.round(g.gateMax),result:g.result,ua:ua||''}; }
// average AI for the headless sim
function ai(g){ const h=g.hero; h.move=h.x<150?1:h.x>220?-1:0;
  if(g.R>=1&&g.credit>=150&&!g.allies.some(a=>a.k==='General')) buy(g,'General');
  else if(g.credit>=40){ const n=g.allies.length; buy(g,n%4===3?'Healer':n%2?'Archer':'Disciple'); }
  if(h.t1<=0&&g.foes.some(f=>Math.abs(f.x-h.x)<200)) tech(g,1); if(h.t2<=0&&h.hp<.5*h.mx) tech(g,2); }
root.HTL2={LANE,GATE_X,EN,UNITS,REALMS,newGame,startWave,step,buy,tech,waveRow,ai,hero};
if(typeof module!=='undefined') module.exports=root.HTL2;
})(typeof window!=='undefined'?window:globalThis);
