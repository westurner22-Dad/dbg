// QI squad battles (Ogre Battle-style): 4v4ish formations, auto-resolved rounds, Tactic/Treasure/Retreat.
(function(root){
const PATHS={Body:{hp:1.15,atk:1.25,row:'F',act:{F:2,B:1},col:'#e94',ic:'B'},Force:{hp:1.6,atk:.9,row:'F',act:{F:2,B:1},col:'#c66',ic:'F'},
  Light:{hp:.8,atk:.55,row:'B',act:{F:1,B:2},heal:1,col:'#ffd',ic:'L'},Mass:{hp:.9,atk:.6,row:'B',act:{F:1,B:2},stun:.3,col:'#a7f',ic:'M'}};
const ROLE2PATH={Striker:'Body',Bruiser:'Force',Vanguard:'Force',Support:'Light',Controller:'Mass'};
const TACTICS=['Best','Strongest','Weakest','Leader'];
const CARDS={'Party Heal':'Heal whole squad 40%','Heaven Strike':'Hit every enemy hard','Binding Seal':'Stun every enemy (skip next action)'};
const ENEMY=[['Red Guard','Body'],['Iron Commissar','Force'],['Propaganda Monk','Light'],['Hex Clerk','Mass'],['Tractor Brute','Force']];
const TERR=[{n:'Ironleaf Valley',lv:1},{n:'Rustwater Ford',lv:3},{n:'Red Banner Hills',lv:5},{n:'Commissar Peaks',lv:7},{n:'Black Bell Capital',lv:9}];
const BATTLES=3, ROUNDS=3, ACT=1.15; // s per action -> ~45-60 s
const sc=L=>1+0.18*(L-1);
function unit(name,path,L,side,row,leader,gear){ const p=PATHS[path], g=gear||0, hp=Math.round(1000*p.hp*sc(L)*(1+g));
  return {name,path,side,row:row||p.row,leader:!!leader,hp,mx:hp,atk:Math.round(220*p.atk*sc(L)*(1+g)),stun:0}; }
function squad(role,L,rows,gear){ const me=ROLE2PATH[role]||'Body', rest=['Body','Force','Light','Mass'].filter(x=>x!==me);
  const names={Body:'Brother Tiezhu',Force:'Sister Shanmei',Light:'Elder Lumen',Mass:'Junior Zhong'};
  return [unit('You',me,L,'P',rows&&rows[0],1,gear)].concat(rest.map((p,i)=>unit(names[p],p,L,'P',rows&&rows[i+1]))); }
function enemies(t,b,rng){ const T=TERR[t], L=T.lv+Math.floor(b/2), n=3+Math.min(2,Math.floor((t+b)/2)); const out=[];
  for(let i=0;i<n;i++){ const [nm,p]=i===0?['Commissar '+['Wu','Lei','Kang','Mao','Zhen'][t],'Force']:ENEMY[Math.floor(rng()*ENEMY.length)]; out.push(unit(nm,p,L+(i===0?1:0),'E',null,i===0)); }
  return out; }
function newBattle(o){ const rng=o.rng||Math.random, b={t:o.terr,bi:o.battle,L:o.L,P:squad(o.role,o.L,o.rows,o.gear),E:enemies(o.terr,o.battle,rng),
  tactic:'Best',cards:{'Party Heal':1,'Heaven Strike':1,'Binding Seal':1},used:[],round:0,q:[],clock:0,time:0,over:false,paused:false,log:[],rng,fx:[]};
  nextRound(b); return b; }
const alive=a=>a.filter(u=>u.hp>0);
function nextRound(b){ b.round++; const all=alive(b.P).concat(alive(b.E)); const q=[];
  const maxA=Math.max(...all.map(u=>PATHS[u.path].act[u.row]));
  for(let k=0;k<maxA;k++) all.filter(u=>PATHS[u.path].act[u.row]>k).sort((x,y)=>y.atk-x.atk+(b.rng()-.5)*40).forEach(u=>q.push(u));
  b.q=q; b.log.push('Round '+b.round); }
function pick(b,u,foes){ const tac=u.side==='P'?b.tactic:'Best', f=alive(foes); if(!f.length) return null;
  let pool=f; if(u.row==='F'||!PATHS[u.path].stun){ const fr=f.filter(x=>x.row==='F'); if(PATHS[u.path].row==='F'&&fr.length) pool=fr; }
  if(tac==='Strongest') return pool.reduce((a,x)=>x.atk>a.atk?x:a); if(tac==='Weakest') return pool.reduce((a,x)=>x.hp<a.hp?x:a);
  if(tac==='Leader'){ const l=f.find(x=>x.leader); if(l) return l; }
  const kill=pool.filter(x=>x.hp<=u.atk); return kill.length?kill[0]:pool.reduce((a,x)=>x.hp/x.mx<a.hp/a.mx?x:a); }
function act(b,u){ if(u.hp<=0) return; if(u.stun>0){ u.stun--; b.log.push(u.name+' is stunned'); return; }
  const mine=u.side==='P'?b.P:b.E, foes=u.side==='P'?b.E:b.P, p=PATHS[u.path];
  if(p.heal&&u.row==='B'){ const w=alive(mine).filter(x=>x.hp<x.mx).sort((x,y)=>x.hp/x.mx-y.hp/y.mx)[0];
    if(w&&w.hp/w.mx<.8){ const h=Math.round(u.atk*2.2); w.hp=Math.min(w.mx,w.hp+h); b.fx.push({u:w,t:.5,c:'#4f4',txt:'+'+h}); b.log.push(u.name+' heals '+w.name+' +'+h); return; } }
  const t=pick(b,u,foes); if(!t) return; const backHit=u.row==='B'&&p.row==='F'?.6:1, frontPen=t.row==='B'&&p.row==='F'?.8:1;
  const d=Math.round(u.atk*backHit*frontPen*(0.9+b.rng()*.2)); t.hp=Math.max(0,t.hp-d); b.fx.push({u:t,t:.5,c:'#f44',txt:'-'+d});
  if(p.stun&&b.rng()<p.stun&&t.hp>0){ t.stun=1; b.log.push(u.name+' binds '+t.name); }
  b.log.push(u.name+' hits '+t.name+' '+d+(t.hp<=0?' — down!':'')); }
function card(b,k){ if(b.over) return 'Battle over'; if(!b.cards[k]) return 'No '+k+' left'; b.cards[k]--; b.used.push(k);
  if(k==='Party Heal') alive(b.P).forEach(u=>u.hp=Math.min(u.mx,u.hp+Math.round(.4*u.mx)));
  if(k==='Heaven Strike'){ const avg=alive(b.P).reduce((s,u)=>s+u.atk,0)/Math.max(1,alive(b.P).length); alive(b.E).forEach(u=>u.hp=Math.max(0,u.hp-Math.round(avg*1.6))); }
  if(k==='Binding Seal') alive(b.E).forEach(u=>u.stun=1);
  b.log.push('Treasure: '+k); check(b); return k+'!'; }
function hpPct(a){ return a.reduce((s,u)=>s+u.hp,0)/a.reduce((s,u)=>s+u.mx,0); }
function check(b){ if(b.over) return; if(!alive(b.E).length) end(b,'win'); else if(!alive(b.P).length) end(b,'loss'); }
function end(b,r){ b.over=true; b.result=r; b.log.push(r==='win'?'WINNERS: your squad':r==='retreat'?'You retreated':'WINNERS: the enemy'); }
function retreat(b){ if(!b.over) end(b,'retreat'); }
function step(b,dt){ if(b.over||b.paused) return; b.time+=dt; b.clock+=dt; b.fx=b.fx.filter(f=>(f.t-=dt)>0);
  while(b.clock>=ACT&&!b.over){ b.clock-=ACT; const u=b.q.shift(); if(u) act(b,u); check(b);
    if(!b.over&&!b.q.length){ if(b.round>=ROUNDS){ end(b,hpPct(b.P)>=hpPct(b.E)?'win':'loss'); } else nextRound(b); } } }
function loot(b,rng){ rng=rng||Math.random; if(b.result!=='win') return {gold:0,items:[]}; const T=b.t, items=[];
  const gold=10+8*T+3*b.bi; if(rng()<.45) items.push({k:'gear',n:['Jade Bracer','Iron Vest','Cloud Boots','Spirit Band'][Math.floor(rng()*4)]+' +'+(T+1),bonus:.03*(T+1),val:15+10*T});
  if(rng()<.35) items.push({k:'treasure',n:['Bronze Seal','Ancient Scroll','Spirit Pearl','Ash Relic'][Math.floor(rng()*4)],val:25+15*T}); return {gold,items}; }
function ai(b){ // sim player: Best tactic; Party Heal under 45%, Heaven Strike round 2, Seal when enemy > squad
  if(b.cards['Party Heal']&&hpPct(b.P)<.45) card(b,'Party Heal'); if(b.cards['Heaven Strike']&&b.round>=2) card(b,'Heaven Strike');
  if(b.cards['Binding Seal']&&hpPct(b.E)>hpPct(b.P)+.15) card(b,'Binding Seal'); }
root.SQUAD={PATHS,ROLE2PATH,TACTICS,CARDS,TERR,BATTLES,ACT,newBattle,step,card,retreat,loot,ai,hpPct,alive};
})(typeof window!=='undefined'?window:module.exports);
