// DBG prototype logic (Phase 1). Numbers from cultivation_02/03/06/11/13/14/21/22 + DBG_balancing.xlsx (locked).
(function(root){
const R = (rng)=>rng||Math.random;
const d20 = (rng)=>1+Math.floor(R(rng)()*20);
// ---------- character (cultivation_02, LOCKED) ----------
const ROLES = {Striker:{focus:'Spd',aff:'Light'},Vanguard:{focus:'Tough',aff:'Mass'},Controller:{focus:'Aff',aff:'Mass'},
               Support:{focus:'Aff',aff:'Light'},Bruiser:{focus:'Str',aff:'Force'}};
const ATTR=['Str','Spd','Tough','Aff'];
function createCharacter(name, role, alloc){ // alloc: {Str,Spd,Tough,Aff} summing to 10 (no focus bonus)
  const sum = ATTR.reduce((s,a)=>s+(alloc[a]|0),0);
  if(sum!==10) throw Error('Spend exactly 10 creation points (spent '+sum+')');
  const a={}; for(const k of ATTR){ a[k]=5+(alloc[k]|0); if(a[k]>15) throw Error(k+' above 15 at creation'); if((alloc[k]|0)<0) throw Error('negative'); }
  // level 1 gets its +5: +1 focus, +1 Aff, +3 flex (auto: to focus) -> 35 total
  const f=ROLES[role].focus; a[f]+=1; a.Aff+=1; a[f]+=3;
  return {name, role, attr:a, level:1, realm:'Foundation', day:1, xpToday:0, medToday:false, charges:0, insp:0, inspSpentToday:false,
          recipes:[{name:'Searing Mark',need:5,prog:0},{name:'Dawn Breath',need:5,prog:0},{name:'Lightforged Fist',need:7,prog:0}],
          log:[], portraitPrefs:'', achievements:0, stats:{wavesCleared:0,wavesFailed:0}};
}
function levelUp(c){ const f=ROLES[c.role].focus; c.level++; c.attr[f]+=1; c.attr.Aff+=1; c.attr[f]+=3; }
const movement = (c)=>Math.min(6, 3+Math.floor(c.attr.Spd/15));      // cultivation_03
const initiative = (c)=>c.attr.Spd*2;
// ---------- day loop (cultivation_06 / 13 / 21) ----------
const XP_GOAL=100;
function meditate(c, recipeIdx, rng, extra=false){
  const out=[];
  if(!extra && c.xpToday<XP_GOAL) return ['Reach the daily XP goal ('+XP_GOAL+') first.'];
  if(!extra && c.medToday) return ['Already meditated today. Spend a catch-up charge for an extra Meditation.'];
  if(c.level<10){ levelUp(c); out.push('Level up -> '+c.realm+' '+c.level); }
  else out.push('Level 10: no level (advancement boss is the gate).');
  const r=c.recipes[recipeIdx];
  if(r && r.prog<r.need){ const roll=d20(rng); if(roll>=11){r.prog++; out.push('d20 '+roll+': "The pattern resonates." '+r.name+' '+r.prog+'/'+r.need);} else out.push('d20 '+roll+': no progress on '+r.name); }
  if(!extra) c.medToday=true;
  return out;
}
function spendInspiration(c, recipeIdx){
  if(c.insp<1) return ['No Inspiration banked.'];
  if(c.inspSpentToday) return ['Max 1 Inspiration per day.'];
  const r=c.recipes[recipeIdx]; if(!r||r.prog>=r.need) return ['Pick a recipe that still needs progress.'];
  c.insp--; c.inspSpentToday=true; r.prog++; return ['Inspiration: '+r.name+' '+r.prog+'/'+r.need+' (automatic +1)'];
}
function spendCharge(c, recipeIdx, rng){
  if(c.charges<1) return ['No catch-up charges.'];
  if(!c.medToday) return ['Meditate first.'];
  if(c.xpToday < XP_GOAL + XP_GOAL/2*(c.chargesUsedToday+1||1)) return ['Each extra Meditation needs +50 XP beyond the goal.'];
  c.charges--; c.chargesUsedToday=(c.chargesUsedToday||0)+1; return ['Catch-up charge spent.'].concat(meditate(c,recipeIdx,rng,true));
}
function endDay(c, played, weekend, rng){
  const out=[];
  if(!weekend && !played && c.level<10){ c.charges=Math.min(3,c.charges+1); out.push('Missed weekday: +1 catch-up charge ('+c.charges+'/3)'); }
  if(R(rng)()<0.025 && !c.rareBeastThisRealm){ c.rareBeastThisRealm=true; c.insp=Math.min(3,c.insp+1); out.push('Rare beast! +1 Inspiration ('+c.insp+'/3)'); }
  c.day++; c.xpToday=0; c.medToday=false; c.inspSpentToday=false; c.chargesUsedToday=0;
  return out;
}
// ---------- Hold the Line (cultivation_14 §13 + final deltas, LOCKED) ----------
// role field stats: Combat sheet "1 hr/day" profile, Foundation L1 -> L10 (HP, dmg/turn), from sim_td.py PL
const PL={Striker:[2000,1249,2450,1503],Vanguard:[5150,351,6230,426],Controller:[2000,727,2450,865],Support:[2100,615,2545,737],Bruiser:[2100,1260,2545,1511]};
const KIT={Striker:1.0,Bruiser:1.0,Vanguard:0.8,Controller:1.15,Support:1.25};
const EN={Conscript:{hp:1,spd:2.6,dr:0,leak:1,lv:1},Brigadier:{hp:.6,spd:5.2,dr:0,leak:1,lv:1},Clerk:{hp:.8,spd:2.6,dr:0,leak:1,lv:4},
  Requisition:{hp:.7,spd:3.9,dr:0,leak:0,lv:4},Planner:{hp:1,spd:2.6,dr:0,leak:1,lv:6},Tractor:{hp:3,spd:1.3,dr:.4,leak:3,lv:6},Loudspeaker:{hp:1.5,spd:2.6,dr:0,leak:2,lv:8}};
const MB={Hammerov:{hp:6,spd:2.6,dr:0,leak:5},Auditor:{hp:5,spd:2.6,dr:0,leak:5},TractorInev:{hp:8,spd:1.3,dr:.4,leak:5}};
const TW={Sunspire:{base:60,rng:3,aff:'Light'},Lantern:{base:15,rng:3,aff:'Light'},Gale:{base:30,rng:2,aff:'Force'},Repulsor:{base:20,rng:3,aff:'Force'},
  Snare:{base:20,rng:3,aff:'Mass'},Bastion:{base:0,rng:0,aff:'Mass'},Well:{base:0,rng:0,aff:'Any'}};
const COST={build:4,up2:6,up3:9};
const lanesFor=(L)=>L>=5?[1,4,6]:[2,5];
const padsFor=(L)=>L<5?[[3,3],[3,6],[4,8],[6,4],[6,7]]:[[2,3],[2,7],[3,5],[5,3],[5,7],[7,5],[4,8]];
// TERRAIN (cultivation_08, LOCKED unsimmed Nov 3): difficult = 2 move/square, high = +1 range, hazard = 5% max HP/round, obstacle blocks LOS+move
function makeTerrain(L, rng){ const t={}; const r=R(rng); const ln=lanesFor(L);
  const free=[]; for(let x=0;x<8;x++) for(let y=2;y<9;y++) if(!ln.includes(x)&&!padsFor(L).some(p=>p[0]==x&&p[1]==y)) free.push([x,y]);
  const pick=()=>free.splice(Math.floor(r()*free.length),1)[0];
  for(let i=0;i<3;i++){const p=pick(); t[p]='difficult';} for(let i=0;i<2;i++){const p=pick(); t[p]='high';}
  {const p=pick(); t[p]='hazard';} for(let i=0;i<2;i++){const p=pick(); t[p]='obstacle';} return t; }
function los(terr,a,b){ let [x0,y0]=a,[x1,y1]=b; const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0)); for(let i=1;i<n;i++){const x=Math.round(x0+(x1-x0)*i/n),y=Math.round(y0+(y1-y0)*i/n); if(terr[[x,y]]==='obstacle') return false;} return true; }
function newWatch(c, rng){ const L=c.level; return {L, role:c.role, wave:0, gate:20, stones:12+(L>=5?2:0), towers:{}, terr:makeTerrain(L,rng),
  php:0, pmax:0, pdmg:0, ppos:[lanesFor(L)[0],7], ko:0, fails:0, roundLog:[], done:false, rng, c}; }
function pstat(role,L){const [a,b,cc,d]=PL[role]; const t=(L-1)/9; return [a+(cc-a)*t, b+(d-b)*t];}
function startWave(w, assist){
  const r=R(w.rng), L=w.L, G=1000+60*(L-1); let B=(18000+1500*(L-1))*(assist?0.75:1);
  const pool=Object.keys(EN).filter(k=>EN[k].lv<=L); const comp=[];
  if(r()<2/15){ const k=Object.keys(MB)[Math.floor(r()*3)]; comp.push({k,mb:true,...MB[k]}); B-=4*G; }
  let ls=0; while(B>0.3*G){ const k=pool[Math.floor(r()*pool.length)]; if(k==='Loudspeaker'&&L<10&&ls>=1) continue; if(k==='Loudspeaker') ls++; comp.push({k,mb:false,...EN[k]}); B-=EN[k].hp*G; }
  const ln=lanesFor(L);
  w.queue=comp.map(e=>({...e, mx:e.hp*G, hp:e.hp*G, lane:ln[Math.floor(r()*ln.length)], row:-1, slow:0, alive:true}));
  w.active=[]; w.round=0; w.wave++; [w.pmax,w.pdmg]=pstat(w.role,L); if(w.wave===1||w.php<=0) w.php=w.pmax; w.stall={}; w.stamped={};
  for(const p in w.towers) if(w.towers[p].t==='Bastion') w.towers[p].hp=6*(120+10*L);
  w.ehit=120+10*L; w.waveOver=false; w.msgs=['Wave '+w.wave+' ('+comp.length+' enemies'+(comp.some(e=>e.mb)?', MINI-BOSS':'')+')'];
  spawn(w); w.roundStart=Date.now();
}
function spawn(w){ for(let i=0;i<lanesFor(w.L).length*2;i++){ if(w.queue.length){ const e=w.queue.pop(); e.row=0; w.active.push(e);} } }
const towerCost=(w,t,kind)=>COST[kind]*(TW[t].aff===ROLES[w.role].aff?0.75:1);
function build(w,pad,t){ const key=String(pad); if(w.towers[key]) return 'Pad taken';
  if(t==='Bastion'){ if(!lanesFor(w.L).includes(pad[0])||pad[1]!==8) return 'Bastion goes on a lane at row 8'; }
  else if(!padsFor(w.L).some(p=>p[0]==pad[0]&&p[1]==pad[1])) return 'Not a tower pad';
  const c=towerCost(w,t,'build'); if(w.stones<c) return 'Need '+c+' stones';
  w.stones-=c; w.towers[key]={t,tier:1,pad,hp:t==='Bastion'?6*(120+10*w.L):0}; return 'Built '+t; }
function upgrade(w,key){ const tw=w.towers[key]; if(!tw||tw.tier>=3||tw.t==='Bastion'||tw.t==='Well') return 'Cannot upgrade';
  const c=towerCost(w,tw.t,tw.tier===1?'up2':'up3'); if(w.stones<c) return 'Need '+c; w.stones-=c; tw.tier++; return tw.t+' -> tier '+tw.tier; }
function distMap(w){ // Dijkstra on 80 cells, cached per position+turn (faster pathfinder)
  const key=w.ppos+'|'+w.round+'|'+w.wave; if(w._dm&&w._dmk===key) return w._dm;
  const dist={}; dist[w.ppos]=0; const q=[[w.ppos[0],w.ppos[1],0]]; let h=0;
  while(h<q.length){ let bi=h; for(let i=h+1;i<q.length;i++) if(q[i][2]<q[bi][2]) bi=i; [q[h],q[bi]]=[q[bi],q[h]]; const [x,y,d]=q[h++]; if(d>dist[[x,y]]) continue; if(d>=6) continue;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+dx,ny=y+dy; if(nx<0||nx>7||ny<0||ny>9) continue; const tt=w.terr[[nx,ny]]; if(tt==='obstacle') continue;
      const nd=d+(tt==='difficult'?2:1); if(dist[[nx,ny]]===undefined||nd<dist[[nx,ny]]){dist[[nx,ny]]=nd; q.push([nx,ny,nd]);} } }
  w._dm=dist; w._dmk=key; return dist; }
function moveCost(w,to){ return distMap(w)[to]; }
function movePlayer(w,to){ if(w.ko) return 'Knocked out'; if(w.moved) return 'Already moved'; const d=moveCost(w,to); const m=movement(w.c);
  if(d===undefined||d>m) return 'Too far (cost '+d+', movement '+m+')'; w.ppos=to; w.moved=true; return 'Moved'; }
const playerRange=(w)=>3+(w.terr[w.ppos]==='high'?1:0);
function targetsInRange(w){ const rg=playerRange(w); return w.active.filter(e=>e.alive&&e.row>=0&&Math.abs(e.lane-w.ppos[0])+Math.abs(Math.round(e.row)-w.ppos[1])<=rg&&los(w.terr,w.ppos,[e.lane,Math.min(9,Math.round(e.row))])); }
function hit(w,e,h){ if(!e.alive) return 0; const d=h*(1-e.dr); e.hp-=d; if(e.hp<=0){e.alive=false; w.stones+=1;} return d; }
function playerAttack(w, target){ if(w.ko||w.acted) return 'Cannot act';
  const tg=targetsInRange(w); if(!tg.length) return 'No target in range/LOS'; const dmg=w.pdmg*KIT[w.role];
  if(w.role==='Controller'){ const t3=tg.sort((a,b)=>b.row-a.row).slice(0,3); t3.forEach(e=>{hit(w,e,dmg/t3.length); e.slow=1;}); }
  else hit(w, target&&tg.includes(target)?target:tg.sort((a,b)=>b.row-a.row)[0], dmg);
  w.acted=true; return 'Attacked'; }
function supportBuffed(w,tw){ if(w.role!=='Support'||w.ko) return false; if(Math.abs(tw.pad[0]-w.ppos[0])<=3) return true;
  const near=Object.values(w.towers).filter(x=>x.t!=='Bastion'&&x.t!=='Well').sort((a,b)=>(Math.abs(a.pad[0]-w.ppos[0])+Math.abs(a.pad[1]-w.ppos[1]))-(Math.abs(b.pad[0]-w.ppos[0])+Math.abs(b.pad[1]-w.ppos[1]))).slice(0,2);
  return near.includes(tw); }
function endRound(w){ // towers fire -> specials -> enemies advance (cultivation_14 §2 order)
  const L=w.L, now=Date.now(); w.roundLog.push({wave:w.wave,round:w.round+1,sec:Math.round((now-w.roundStart)/100)/10});
  w.round++;
  for(const key in w.towers){ const tw=w.towers[key], d=TW[tw.t];
    if(tw.t==='Well'){ w.stones+=2*tw.tier; continue; } if(tw.t==='Bastion') continue; if(w.stall[key]>0||w.stamped[key]) continue;
    const rg=d.rng+(tw.tier===3?1:0); const inr=w.active.filter(e=>e.alive&&e.row>=0&&Math.abs(tw.pad[0]-e.lane)<=rg&&Math.abs(tw.pad[1]-e.row)<=rg);
    if(tw.t==='Lantern'){ if(!w.ko) w.php=Math.min(w.pmax,w.php+0.08*w.pmax); if(w.round%3===0&&w.gate<20) w.gate++; inr.forEach(e=>{if(e.k==='Loudspeaker') e.silenced=true;}); }
    if(!inr.length) continue; let h=(d.base+5*L)*5*[1,1.5,2][tw.tier-1]; if(supportBuffed(w,tw)) h*=1.3;
    if(tw.t==='Gale'){ const cnt={}; inr.forEach(e=>cnt[e.lane]=(cnt[e.lane]||0)+1); const ln=+Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0]; inr.filter(e=>e.lane===ln).forEach(e=>hit(w,e,h)); }
    else if(tw.t==='Snare'){ const c=inr.reduce((a,b)=>b.row>a.row?b:a); inr.filter(e=>e.lane===c.lane&&Math.abs(e.row-c.row)<=1).forEach(e=>{hit(w,e,h); e.slow=1;}); }
    else if(tw.t==='Repulsor'){ const c=inr.reduce((a,b)=>b.row>a.row?b:a); hit(w,c,h); if(!c.mb) c.row=Math.max(0,c.row-(tw.tier===3?2:1)); }
    else { const c=inr.reduce((a,b)=>((b.mb-a.mb)||(b.row-a.row))>0?b:a); hit(w,c,h); }
  }
  for(const k in w.stall) w.stall[k]--; w.stamped={};
  w.active=w.active.filter(e=>e.alive);
  let aura=0, pct=0; w.active.forEach(e=>{ if(e.k==='Loudspeaker'&&!e.silenced) aura=0.35; if(e.k==='Hammerov') pct=0.2; });
  w.active.forEach(e=>{ e.cd=(e.cd||0)+1;
    if(e.k==='Clerk'&&e.cd%2===0){ const tg=Object.keys(w.towers).filter(k=>w.towers[k].t!=='Bastion'&&Math.abs(w.towers[k].pad[0]-e.lane)<=3&&Math.abs(w.towers[k].pad[1]-e.row)<=3); if(tg.length) w.stamped[tg.sort((a,b)=>w.towers[b].tier-w.towers[a].tier)[0]]=1; }
    if(e.k==='Planner'){ const hurt=w.active.filter(x=>x!==e&&x.hp<x.mx); if(hurt.length){const x=hurt.reduce((a,b)=>b.hp/b.mx<a.hp/a.mx?b:a); x.hp=Math.min(x.mx,x.hp+0.1*x.mx);} }
    if(e.k==='Auditor'&&e.cd%3===1){ const ks=Object.keys(w.towers); if(ks.length){ w.stall[ks.sort((a,b)=>w.towers[b].tier-w.towers[a].tier)[0]]=2; } } });
  // player DR: Vanguard half damage (kit) ; all DR additive capped 60% (cultivation_03)
  const pDR=Math.min(0.6,(w.role==='Vanguard'?0.5:0)+0.10);
  for(const e of w.active){ let sp=e.spd*(1+pct)+(e.k==='Loudspeaker'?0:aura); if(e.slow){sp*=0.5; e.slow=0;} e.silenced=false;
    let blk=null; for(const key in w.towers){ const tw=w.towers[key]; if(tw.t==='Bastion'&&tw.hp>0&&tw.pad[0]===e.lane&&e.row<=tw.pad[1]&&tw.pad[1]<=e.row+sp+0.01) blk=tw; }
    const prow=w.ppos[1]; const pblocks=!blk&&!w.ko&&(w.role==='Vanguard'||w.role==='Bruiser')&&e.lane===w.ppos[0]&&e.row<=prow&&prow<=e.row+sp+0.01&&(w.role==='Vanguard'||w.active.filter(x=>x.lane===e.lane&&Math.abs(x.row-prow)<=1.5).length<=2);
    if(blk||pblocks){ e.row=(blk?blk.pad[1]:prow)-0.01; const dmg=w.ehit*(e.mb?3:1);
      if(blk) blk.hp-=dmg*((e.k==='Tractor'||e.k==='TractorInev')?2:1); else { w.php-=dmg*(1-pDR); if(w.php<=0){w.php=0; w.ko=2; w.msgs.push('You are knocked out (2 rounds).');} } }
    else e.row+=sp;
    if(e.row>=10){ e.alive=false; w.gate-=e.leak;
      if(e.k==='Requisition'){ w.stones=Math.max(0,w.stones-5); const ks=Object.keys(w.towers).filter(k=>w.towers[k].t!=='Bastion'); if(ks.length) w.stall[ks.sort((a,b)=>(Math.abs(w.towers[a].pad[0]-e.lane)+9-w.towers[a].pad[1])-(Math.abs(w.towers[b].pad[0]-e.lane)+9-w.towers[b].pad[1]))[0]]=1; }
      if(e.k==='TractorInev'){ const ks=Object.keys(w.towers); if(ks.length) delete w.towers[ks[Math.floor(R(w.rng)()*ks.length)]]; } } }
  w.active=w.active.filter(e=>e.alive);
  if(w.terr[w.ppos]==='hazard'&&!w.ko){ w.php-=0.05*w.pmax; if(w.php<=0){w.php=0; w.ko=2;} }
  if(w.ko){ w.ko--; if(w.ko===0) w.php=0.3*w.pmax; }
  w.stones+=3; w.moved=false; w.acted=false;
  if(w.gate<=0){ w.waveOver=true; w.result='fail'; w.fails++; return 'Gate fell'; }
  spawn(w);
  if(!w.queue.length&&!w.active.length){ w.waveOver=true; w.result='clear'; return 'Wave cleared'; }
  if(w.round>=30){ w.waveOver=true; w.result='fail'; return 'Round cap'; }
  w.roundStart=Date.now(); return '';
}
// wave rewards: waves 1-2 = 100 XP = daily goal (50 each); wave 3 bonus gold
function waveReward(c,w){ if(w.result==='clear'){ if(w.wave<=2) c.xpToday+=50; c.stats.wavesCleared++; } else c.stats.wavesFailed++; }
// ---------- score (cultivation_11 / 22, LOCKED): weights 35/20/15/5/15/5/5 + achievements +3 ----------
const WEIGHTS={'Cultivation Pace':35,'Attributes':20,'Technique Mastery':15,'Equipment':5,'Weekend Contribution':15,'Economy':5,'Monster':5};
function score(cats, achPoints){ // cats: 0-100 per category; achPoints 0-86 -> +3 max
  let s=0; for(const k in WEIGHTS) s+=WEIGHTS[k]*Math.max(0,Math.min(100,cats[k]||0))/100;
  return {base:Math.round(s*100)/100, bonus:Math.round(3*Math.min(86,achPoints||0)/86*100)/100, total:Math.round((s+3*Math.min(86,achPoints||0)/86)*100)/100}; }
const sqrtCurve=(v,best)=>best>0?100*Math.sqrt(v/best):0; // Economy & Monster (LOCKED)
// ---------- auto-player (avg AI like sim_td) for headless tests ----------
function autoBuild(w){ for(let guard=0;guard<20;guard++){ const have=Object.values(w.towers).map(t=>t.t); let want=[];
    if(!have.length) want.push('Well'); for(const t of ['Sunspire','Gale','Snare']) if(!have.includes(t)) want.push(t);
    if(w.L>=3&&!have.includes('Repulsor')) want.push('Repulsor'); if(w.L>=4&&!have.includes('Lantern')) want.push('Lantern');
    const bfree=lanesFor(w.L).filter(l=>!w.towers[[l,8]]); if(bfree.length) want.push('Bastion'); want.push('Sunspire','Gale');
    const free=padsFor(w.L).filter(p=>!w.towers[p]); let did=false; const t=want[0];
    if(t==='Bastion'&&bfree.length){ did=build(w,[bfree[0],8],'Bastion').startsWith('Built'); }
    else if(free.length&&t!=='Bastion'){ const p=t==='Well'?free.reduce((a,b)=>b[1]<a[1]?b:a):free.reduce((a,b)=>Math.abs(b[1]-5.5)<Math.abs(a[1]-5.5)?b:a); did=build(w,p,t).startsWith('Built'); }
    if(!did){ const ups=Object.keys(w.towers).filter(k=>w.towers[k].tier<3&&!['Well','Bastion'].includes(w.towers[k].t)).sort((a,b)=>w.towers[a].tier-w.towers[b].tier);
      if(ups.length&&(!free.length||w.stones>=towerCost(w,w.towers[ups[0]].t,'up2')+4)) did=upgrade(w,ups[0]).startsWith(w.towers[ups[0]].t); }
    if(!did) return; } }
function autoTurn(w){ autoBuild(w); if(w.ko) return;
  const ln=lanesFor(w.L); const threat=ln.reduce((a,b)=>{const s=l=>w.active.filter(e=>e.lane===l).reduce((t,e)=>t+e.row+e.leak,0); return s(b)>s(a)?b:a;});
  let best=null,bd=99; for(let y=5;y<=8;y++) for(const x of [threat,threat-1,threat+1]){ if(x<0||x>7) continue; const d=moveCost(w,[x,y]); if(d!==undefined&&d<=movement(w.c)&&w.terr[[x,y]]!=='hazard'){ const sc=Math.abs(x-threat)*2+Math.abs(y-7)-(w.terr[[x,y]]==='high'?1:0); if(sc<bd){bd=sc;best=[x,y];} } }
  if(best) movePlayer(w,best); playerAttack(w); }
function towerCover(w){ const cov={}; for(const k in w.towers){ const tw=w.towers[k], d=TW[tw.t]; if(!d.rng) continue; const rg=d.rng+(tw.tier===3?1:0);
  for(let x=0;x<8;x++) for(let y=0;y<10;y++) if(Math.abs(x-tw.pad[0])<=rg&&Math.abs(y-tw.pad[1])<=rg) cov[[x,y]]=(cov[[x,y]]||0)+1; } return cov; }
function reachable(w){ const d=distMap(w), m=movement(w.c), out={}; for(const k in d) if(d[k]<=m) out[k]=1; return out; }
root.DBG={towerCover,reachable,ROLES,ATTR,createCharacter,levelUp,movement,initiative,meditate,spendInspiration,spendCharge,endDay,XP_GOAL,
  newWatch,startWave,build,upgrade,movePlayer,moveCost,playerAttack,targetsInRange,endRound,waveReward,lanesFor,padsFor,TW,towerCost,
  WEIGHTS,score,sqrtCurve,autoTurn,autoBuild,playerRange};
if(typeof module!=='undefined') module.exports=root.DBG;
})(typeof window!=='undefined'?window:globalThis);
