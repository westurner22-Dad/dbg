// Simplified Nascent territory turns (cultivation_19 + cultivation_01/10 locks). 1 human (seat 0) + 3 simple AI seats.
(function(root){
const STRAT={36:'Gold Mine',37:'Spirit Forest',38:'Ancient Ruins',39:'Cultivation Nexus'};
function mapAdj(){ const A={}; const add=(a,b)=>{(A[a]=A[a]||new Set()).add(b);(A[b]=A[b]||new Set()).add(a);};
  for(let i=0;i<4;i++){ const g=5*i; for(let j=1;j<=4;j++){ add(g,g+j); add(g+j,20+4*i+(j-1)); } if(true) for(let j=1;j<4;j++) add(g+j,g+j+1); }
  for(let t=20;t<36;t++) add(t, t===35?20:t+1);
  for(let i=0;i<4;i++){ add(36+i,21+4*i); add(36+i,22+4*i); add(36+i,36+(i+1)%4); }
  const out={}; for(const k in A) out[k]=[...A[k]]; return out; }
const ADJ=mapAdj();
const isHome=t=>t<20, gateOf=i=>5*i;
function newGame(rng){ const r=rng||Math.random; const own={}; for(let t=0;t<40;t++) own[t]=t<20?{o:Math.floor(t/5),g:0}:{o:-1,g:10};
  const players=[0,1,2,3].map(i=>({i,name:i?'Rival '+i:'You',army:20,at:gateOf(i),gens:['D','A'],armyGen:'A',gold:0,level:1,bld:{},mob:false}));
  const order=[0,1,2,3].sort(()=>r()-.5);
  return {rng:r,own,players,order,seat:0,round:1,day:1,log:['Nascent begins. Turn order '+order.map(i=>players[i].name).join(' > ')],phase:'march',steps:2,attacks:2,fortified:false,bld:{}}; }
const owned=(G,i)=>Object.keys(G.own).filter(t=>G.own[t].o===i).map(Number);
const terrCount=(G,i)=>owned(G,i).reduce((s,t)=>s+(t==39?2:1),0); // Nexus counts as 2 for levels
const active=G=>G.order[G.seat];
const cap=p=>p.mob?40:20;
function d20(G){return 1+Math.floor(G.rng()*20);}
// battle: d20 + floor(army/2) + General bonus(+1) + Ruins(+1 attacking from it) + Watchtower(+1 defending); casualty bands (cultivation_10 lock)
function battle(G,att,ag,def,dg,ba,bd){ const ra=d20(G), rd=d20(G); const ta=ra+Math.floor(att/2)+(ag?1:0)+ba, td=rd+Math.floor(def/2)+(dg?1:0)+bd;
  const diff=Math.abs(ta-td), aw=ta>td; let w,l; if(diff<=2){w=1;l=2;} else if(diff<=5){w=1;l=4;} else if(diff<=8){w=G.rng()<.5?0:1;l=6;} else {w=0;l=8;}
  if((aw?ag:dg)==='A') l++; let al=aw?w:l, dl=aw?l:w; if(dg==='D') dl=Math.max(0,dl-1); if(ag==='S') al=Math.floor(al/2);
  const big=diff>=10; return {al:Math.min(al,att),dl:Math.min(dl,def),aw,ra,rd,ta,td,aGain:ra===20&&aw&&big,aLose:ra===1&&!aw&&big}; }
function genEvents(p,b,G){ if(b.aGain&&p.gens.length<4){ p.gens.push('DAS'[Math.floor(G.rng()*3)]); G.log.push(p.name+' gains a General (nat 20, +10 gap)'); }
  if(b.aLose&&p.armyGen){ p.gens.splice(p.gens.indexOf(p.armyGen),1); G.log.push(p.name+' loses General '+p.armyGen+' (nat 1, -10 gap)'); p.armyGen=p.gens[0]||null; } }
function reachMarch(G,p){ const steps=G.steps+(G.bld[p.at]==='Road'&&G.own[p.at].o===p.i?1:0); const seen={[p.at]:0}, q=[p.at];
  while(q.length){ const t=q.shift(); if(seen[t]>=steps) continue; for(const n of ADJ[t]) if(G.own[n].o===p.i&&seen[n]===undefined){ seen[n]=seen[t]+1; q.push(n);} } return seen; }
function march(G,to){ const p=G.players[active(G)]; if(G.phase!=='march') return 'March phase is over'; const r=reachMarch(G,p); if(r[to]===undefined||to==p.at) return 'Not reachable through own territory (2 steps)';
  const from=p.at; if(!isHome(from)&&G.own[from].g===0){ G.own[from].g=1; p.army--; } p.at=to; G.phase='attack'; return 'Army marched to '+name(to); }
function attack(G,to){ const p=G.players[active(G)]; if(G.phase==='march') G.phase='attack'; if(G.phase!=='attack'||G.attacks<1) return 'No attacks left';
  if(!ADJ[p.at].includes(to)) return 'Not adjacent'; const d=G.own[to]; if(d.o===p.i) return 'Already yours'; if(isHome(to)) return 'Homelands cannot be attacked';
  if(p.army<2) return 'Army too small'; G.attacks--; let rolls=0, msg=[];
  while(d.g>0&&p.army>1&&rolls<20){ const b=battle(G,p.army,p.armyGen,d.g,null,(STRAT[p.at]==='Ancient Ruins'&&G.own[p.at].o===p.i)?1:0,G.bld[to]==='Watchtower'?1:0);
    p.army-=b.al; d.g-=b.dl; rolls++; genEvents(p,b,G); if(p.army<=Math.max(3,d.g/2)) break; }
  if(d.g<=0){ const prev=d.o; d.o=p.i; d.g=0; if(!isHome(p.at)&&G.own[p.at].o===p.i&&G.own[p.at].g===0&&p.army>1){ G.own[p.at].g=1; p.army--; } p.at=to; if(G.bld[to]) { G.log.push(G.bld[to]+' destroyed on capture'); delete G.bld[to]; } msg.push('Captured '+name(to)+(prev>=0?' from '+G.players[prev].name:'')+' after '+rolls+' rolls; army '+p.army); }
  else msg.push('Attack on '+name(to)+' stalled after '+rolls+' rolls (army '+p.army+', defenders '+d.g+')');
  G.log.push(p.name+': '+msg[0]); return msg[0]; }
function fortify(G,kind,t){ const p=G.players[active(G)]; if(G.fortified) return 'Already fortified this turn'; t=t==null?p.at:t; if(G.own[t].o!==p.i||isHome(t)) return 'Pick an owned non-homeland territory';
  if(kind==='garrison'){ if(p.army<3) return 'Army too small'; G.own[t].g+=2; p.army-=2; }
  else { if(G.bld[t]) return 'One building per territory'; const cost=Math.round(1300*Math.sqrt(owned(G,p.i).length)); if(p.gold<cost) return 'Need '+cost+' gold (1 day of territory gold)'; p.gold-=cost; G.bld[t]=kind; }
  G.fortified=true; return kind+' at '+name(t); }
function endTurn(G){ G.seat++; G.phase='march'; G.steps=2; G.attacks=2; G.fortified=false;
  if(G.seat>=4){ collective(G); G.seat=0; G.round++; G.order.push(G.order.shift()); }
  while(active(G)!==0){ aiTurn(G); G.seat++; G.phase='march'; G.attacks=2; G.fortified=false; if(G.seat>=4){ collective(G); G.seat=0; G.round++; G.order.push(G.order.shift()); } } }
function collective(G){ // Ruin strikes the strongest (N4)
  const counts=G.players.map(p=>owned(G,p.i).length); const lead=counts.indexOf(Math.max(...counts)); if(counts[lead]<9) return;
  const border=owned(G,lead).filter(t=>!isHome(t)&&ADJ[t].some(n=>G.own[n].o===-1&&G.own[n].g>=4)); if(!border.length) return;
  const t=border.reduce((a,b)=>G.own[b].g<G.own[a].g?b:a); const src=ADJ[t].filter(n=>G.own[n].o===-1&&G.own[n].g>=4)[0]; let au=Math.min(8,G.own[src].g-1); G.own[src].g-=au;
  const d=G.own[t]; while(au>0&&d.g>0){ const b=battle(G,au,null,d.g,null,0,G.bld[t]==='Watchtower'?1:0); au-=b.al; d.g-=b.dl; }
  if(d.g<=0){ d.o=-1; d.g=Math.max(1,au); delete G.bld[t]; G.log.push('Ruin strikes the leader: '+G.players[lead].name+' loses '+name(t)); } else G.log.push('Ruin strikes '+G.players[lead].name+' at '+name(t)+' and is repelled'); }
function aiTurn(G){ const p=G.players[active(G)]; for(let a=0;a<2;a++){ const tg=ADJ[p.at].filter(n=>G.own[n].o!==p.i&&!isHome(n)).sort((x,y)=>G.own[x].g-G.own[y].g)[0];
  if(tg==null||p.army<G.own[tg].g+4) { const r=reachMarch(G,p); const fr=Object.keys(r).map(Number).find(t=>ADJ[t].some(n=>G.own[n].o!==p.i&&!isHome(n)&&G.own[n].g+4<=p.army)); if(fr!=null&&fr!==p.at&&a===0){ p.at=fr; continue; } break; }
  G.attacks=2; attack(G,tg); } }
function midnight(G){ G.day++; const out=[];
  for(const p of G.players){ const homesOnly=owned(G,p.i).every(isHome); p.mob=homesOnly; const T=owned(G,p.i).length;
    const lv=Math.min(4,Math.floor(terrCount(G,p.i)/5)); p.level+=lv; p.gold+=Math.round(1300*Math.sqrt(T))+(G.own[36].o===p.i?1000:0);
    if(!owned(G,p.i).some(t=>t===p.at)) p.at=gateOf(p.i); p.army=Math.min(cap(p),p.army+(p.mob?20:5)+(G.own[37].o===p.i?1:0));
    if(p.i===0) out.push('Midnight: +'+lv+' levels (now '+p.level+'), gold '+p.gold+', army '+p.army+'/'+cap(p)+(p.mob?' (Sovereign Mobilization)':'')); }
  for(let t=20;t<40;t++) if(G.own[t].o===-1) G.own[t].g=Math.min(10,G.own[t].g+1);
  G.log.push(...out); }
function name(t){ t=+t; if(STRAT[t]) return STRAT[t]; if(t<20) return (t%5?'Home ':'Gate ')+Math.floor(t/5)+(t%5?'.'+t%5:''); return 'Ring '+(t-19); }
root.NAS={ADJ,STRAT,newGame,owned,march,attack,fortify,endTurn,midnight,name,reachMarch,active,isHome,terrCount};
if(typeof module!=='undefined') module.exports=root.NAS;
})(typeof window!=='undefined'?window:globalThis);
