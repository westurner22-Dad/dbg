// Sect Conquest v2: Final Fantasy II-style turn-based squad battles. Commands for all 4, then speed-ordered action phase.
(function(root){
const sc=L=>1+0.2*(L-1);
const PATHS={Body:{hp:1.15,atk:1.3,mat:.6,spd:11,mp:.7,em:'🥋',col:'#e94'},Force:{hp:1.45,atk:1.05,mat:.9,spd:9,mp:.9,em:'🛡️',col:'#c66'},
  Light:{hp:.85,atk:.55,mat:1.2,spd:10,mp:1.2,em:'🧙',col:'#ffd'},Mass:{hp:1.0,atk:.65,mat:1.0,spd:8,mp:1.0,em:'🧘',col:'#a7f'}};
const ROLE2PATH={Striker:'Body',Bruiser:'Force',Vanguard:'Force',Support:'Light',Controller:'Mass'};
// tier: 1 starter (10% max mana), 1.5 purchased (15%), 0 = free. pw = power x magic attack (or attack if phys). lv = Qi level unlock.
const TECH={
 'Focus Breathing':{tier:0,lv:1,tg:'self',fx:'mana',d:'Restore 15% max mana'},
 'Kick':{tier:0,lv:1,tg:'foe',pw:.7,phys:1,d:'Physical 0.7x, target acts last next round'},
 'Combat Insight':{tier:1,lv:1,tg:'self',fx:'crit',d:'Next Fight is a guaranteed crit (2x)'},
 'Flow Like Water':{tier:1.5,lv:4,tg:'self',fx:'dodge',d:'Dodge the next attack'},
 'Light Bolt':{tier:1,lv:1,tg:'foe',pw:1.4,d:'Light damage 1.4x'},
 'Radiant Guard':{tier:1,lv:1,tg:'ally',fx:'shield',pw:1.5,d:'Shield an ally (cap 35% max HP)'},
 'Healing Light':{tier:1.5,lv:3,tg:'ally',fx:'heal',pw:2.2,d:'Heal ally (cap 35% max HP); they regain mana = 25% of the heal'},
 'Purifying Flash':{tier:1.5,lv:6,tg:'all',pw:.9,cd:2,d:'Hit all enemies 0.9x; cooldown 2'},
 'Force Punch':{tier:1,lv:1,tg:'foe',pw:1.45,phys:1,d:'Force damage 1.45x'},
 'Shock Dash':{tier:1,lv:1,tg:'foe',pw:1.0,phys:1,first:1,d:'1.0x, always acts first'},
 'Momentum Strike':{tier:1.5,lv:4,tg:'foe',pw:2.3,phys:1,cd:2,d:'Big hit 2.3x; cooldown 2'},
 'Afterimage Stance':{tier:1.5,lv:7,tg:'self',fx:'dodge25',d:'+25% dodge for 2 rounds'},
 'Gravity Crush':{tier:1,lv:1,tg:'foe',pw:1.3,slow:1,d:'1.3x and slow (acts last next round)'},
 'Stone Skin':{tier:1,lv:1,tg:'ally',fx:'dr',d:'Ally takes 20% less damage for 3 rounds'},
 'Earthen Renewal':{tier:1.5,lv:3,tg:'ally',fx:'regen',pw:.7,d:'Ally regenerates for 3 rounds'},
 'Gravity Well':{tier:1.5,lv:6,tg:'all',pw:.5,slow:1,d:'Hit all enemies 0.5x and slow them'}};
const KIT={Body:['Kick','Combat Insight','Flow Like Water','Focus Breathing'],Light:['Light Bolt','Radiant Guard','Healing Light','Purifying Flash','Focus Breathing'],
 Force:['Force Punch','Shock Dash','Momentum Strike','Afterimage Stance','Focus Breathing'],Mass:['Gravity Crush','Stone Skin','Earthen Renewal','Gravity Well','Focus Breathing']};
// Technique library (character sheet). 2 permanent starters per path; others bought as manuals (affinity manual 150g, cultivation_07) or developed later (stub).
const STARTERS={Body:['Kick','Combat Insight'],Force:['Force Punch','Shock Dash'],Light:['Light Bolt','Healing Light'],Mass:['Gravity Crush','Stone Skin']};
const MANUAL_COST=60;
function sheet(q,path){ q.techs=q.techs||{}; STARTERS[path].forEach(t=>{ if(!q.techs[t]) q.techs[t]={lv:1,starter:1}; });
  if(!Array.isArray(q.slots)) q.slots=STARTERS[path].slice(); q.slots=q.slots.filter(t=>q.techs[t]).slice(0,3); return q; }
function learn(q,path,t){ sheet(q,path); if(q.techs[t]) return false; q.techs[t]={lv:1}; if(q.slots.length<3) q.slots.push(t); return true; }
function shopTechs(path){ return KIT[path].filter(t=>t!=='Focus Breathing'&&!STARTERS[path].includes(t)); }
const ITEMS={'Healing Potion':{cost:25,d:'Restore 50% max HP'},'Focus Crystal':{cost:25,d:'Restore 30% max mana'}};
const ENEMY=[['Red Guard','Body','💂'],['Iron Commissar','Force','👺'],['Propaganda Monk','Light','📢'],['Hex Clerk','Mass','🧾'],['Tractor Brute','Force','🚜']];
const TERR=[{n:'Ironleaf Valley',lv:1},{n:'Rustwater Ford',lv:3},{n:'Red Banner Hills',lv:5},{n:'Commissar Peaks',lv:7},{n:'Black Bell Capital',lv:9}];
let uid=0;
function unit(name,path,L,side,o={}){ const p=PATHS[path], g=o.gear||0, f=side==='E'?.8+.06*(o.t||0):1, hp=Math.round(300*p.hp*sc(L)*(1+g)*(o.boss?1.6:f)*(side==='E'?1:1.25)), mp=Math.round(100*p.mp*sc(L));
  return {id:++uid,name,path,side,L,em:o.em||p.em,leader:!!o.boss,hp,mx:hp,mp,mmp:mp,atk:Math.round(80*p.atk*sc(L)*(1+g)*(L>=5&&path==='Body'?1.06:1)),mat:Math.round(80*p.mat*sc(L)*(1+g)),
   spd:p.spd+(side==='E'?0:1),techs:side==='P'?KIT[path].filter(t=>TECH[t].lv<=L):[],cd:{},shield:0,dr:0,regen:0,dodge:0,dodge25:0,crit:0,slow:0}; }
const cost=(u,t)=>Math.round(TECH[t].tier*.1*u.mmp);
function squad(role,L,gear,slots){ const me=ROLE2PATH[role]||'Body', rest=['Body','Force','Light','Mass'].filter(x=>x!==me);
  const nm={Body:'Tiezhu',Force:'Shanmei',Light:'Lumen',Mass:'Zhong'}; return [Object.assign(unit('You',me,L,'P',{gear}),slots?{techs:slots.concat('Focus Breathing')}:{})].concat(rest.map(p=>unit(nm[p],p,L,'P'))); }
function enemies(t,b,rng){ const T=TERR[t], L=T.lv+Math.floor(b/2), n=3+Math.min(2,Math.floor((t+b)/2)), out=[];
  out.push(unit('Commissar '+['Wu','Lei','Kang','Mao','Zhen'][t],'Force',L+1,'E',{boss:1,em:'🎖️',t}));
  for(let i=1;i<n;i++){ const [nm,p,em]=ENEMY[Math.floor(rng()*ENEMY.length)]; out.push(unit(nm,p,L,'E',{em,t})); } return out; }
function newBattle(o){ const rng=o.rng||Math.random; return {t:o.terr,bi:o.battle,L:o.L,P:squad(o.role,o.L,o.gear,o.slots),E:enemies(o.terr,o.battle,rng),rng,round:0,phase:'cmd',q:[],over:false,result:null,used:[],items:Object.assign({},o.items||{}),last:null}; }
const alive=a=>a.filter(u=>u.hp>0);
function all(b){ return b.P.concat(b.E); }
const byId=(b,id)=>all(b).find(u=>u.id===id);
function avgSpd(a){ a=alive(a); return a.reduce((s,u)=>s+u.spd,0)/Math.max(1,a.length); }
// cmds: [{k:'fight'|'tech'|'item'|'run', t:techOrItem, tgt:id}] per party index (alive members)
function enemyCmd(b,u){ const P=alive(b.P), E=alive(b.E); const low=P.slice().sort((x,y)=>x.hp/x.mx-y.hp/y.mx)[0], r=P[Math.floor(b.rng()*P.length)];
  if(u.path==='Light'){ const w=E.slice().sort((x,y)=>x.hp/x.mx-y.hp/y.mx)[0]; if(w.hp/w.mx<.5&&b.rng()<.7) return {k:'eheal',tgt:w.id}; return {k:'emag',tgt:r.id}; }
  if(u.path==='Mass'&&b.rng()<.5) return {k:'emag',tgt:r.id,slow:1};
  return {k:'fight',tgt:(b.rng()<.4?low:r).id}; }
function startRound(b,cmds){ b.round++; b.phase='act'; b.last=cmds; const q=[];
  alive(b.P).forEach((u,i)=>{ const c=cmds[u.id]||{k:'fight',tgt:alive(b.E)[0].id}; q.push({u,c}); });
  alive(b.E).forEach(u=>q.push({u,c:enemyCmd(b,u)}));
  const pri=x=>(x.c.k==='tech'&&TECH[x.c.t].first?100:0)+(x.c.k==='run'?50:0)-(x.u.slow?100:0)+x.u.spd+b.rng()*4;
  q.forEach(x=>x.p=pri(x)); q.sort((a,b2)=>b2.p-a.p); all(b).forEach(u=>u.slow=0); b.q=q; b.log=[]; }
function hit(b,src,t,mult,phys,ev){ if(t.hp<=0) return; if(t.dodge){ t.dodge=0; ev.push({id:t.id,txt:'Miss'}); return 'dodged'; }
  if(t.dodge25>0&&b.rng()<.25){ ev.push({id:t.id,txt:'Miss'}); return 'dodged'; }
  let d=(phys?src.atk:src.mat)*mult*(0.9+b.rng()*.2); if(src.crit&&phys){ d*=2; src.crit=0; } if(t.dr>0) d*=.8; if(t.guard) d*=.5; d=Math.round(d);
  if(t.shield){ const s=Math.min(t.shield,d); t.shield-=s; d-=s; } t.hp=Math.max(0,t.hp-d); ev.push({id:t.id,txt:String(d),c:'#fff'}); return d; }
function retarget(b,src,id,foe){ let t=byId(b,id); const pool=alive(foe?(src.side==='P'?b.E:b.P):(src.side==='P'?b.P:b.E)); if(!t||t.hp<=0) t=pool[0]; return t; }
function act(b){ // executes next queued action; returns {actor, line, ev:[{id,txt,c}]}
  while(b.q.length){ const {u,c}=b.q.shift(); if(u.hp<=0) continue; const ev=[]; let line='';
    const foes=u.side==='P'?b.E:b.P;
    if(!alive(foes).length) break;
    if(c.k==='fight'){ const t=retarget(b,u,c.tgt,1); const crit=u.crit; const d=hit(b,u,t,1,1,ev); line=`${u.name} attacks ${t.name}${crit&&d!=='dodged'?' — critical!':''}: ${d==='dodged'?'miss':'1 hit! '+d+' DMG'}`; }
    else if(c.k==='emag'){ const t=retarget(b,u,c.tgt,1); const d=hit(b,u,t,1.1,0,ev); if(c.slow&&d!=='dodged') t.slow=1; line=`${u.name} casts ${c.slow?'Hex':'Red Bolt'} on ${t.name}: ${d==='dodged'?'miss':d+' DMG'}`; }
    else if(c.k==='eheal'){ const t=retarget(b,u,c.tgt,0); const h=Math.min(Math.round(u.mat*1.8),Math.round(.35*t.mx)); t.hp=Math.min(t.mx,t.hp+h); ev.push({id:t.id,txt:'+'+h,c:'#6f6'}); line=`${u.name} heals ${t.name} +${h}`; }
    else if(c.k==='item'){ const t=retarget(b,u,c.tgt,0); if(!(b.items[c.t]>0)){ line=`${u.name}: no ${c.t} left`; } else { b.items[c.t]--; b.used.push(c.t);
        if(c.t==='Healing Potion'){ const h=Math.round(.5*t.mx); t.hp=Math.min(t.mx,t.hp+h); ev.push({id:t.id,txt:'+'+h,c:'#6f6'}); } else { const m=Math.round(.3*t.mmp); t.mp=Math.min(t.mmp,t.mp+m); ev.push({id:t.id,txt:'+'+m+' MP',c:'#6cf'}); }
        line=`${u.name} uses ${c.t} on ${t.name}`; } }
    else if(c.k==='run'){ const ch=Math.max(.2,Math.min(.9,.5+.08*(avgSpd(b.P)-avgSpd(b.E)))); if(b.rng()<ch){ b.over=true; b.result='retreat'; return {actor:u,line:'The squad escaped!',ev}; } line='Could not escape!'; }
    else if(c.k==='tech'){ const T=TECH[c.t], m=cost(u,c.t); if(u.mp<m||(u.cd[c.t]||0)>=b.round){ const t=retarget(b,u,c.tgt,1); const d=hit(b,u,t,1,1,ev); line=`${u.name} lacks mana — attacks: ${d} DMG`; }
      else { u.mp-=m; b.used.push(c.t); if(T.cd) u.cd[c.t]=b.round+T.cd-1; line=`${u.name}: ${c.t}`;
        if(T.fx==='mana'){ const g=Math.round(.15*u.mmp); u.mp=Math.min(u.mmp,u.mp+g); ev.push({id:u.id,txt:'+'+g+' MP',c:'#6cf'}); }
        else if(T.fx==='crit'){ u.crit=1; line+=' (next Fight crits)'; } else if(T.fx==='dodge'){ u.dodge=1; } else if(T.fx==='dodge25'){ u.dodge25=2; }
        else if(T.tg==='ally'){ const t=retarget(b,u,c.tgt,0);
          if(T.fx==='shield'){ t.shield=Math.min(Math.round(.35*t.mx),Math.round(u.mat*T.pw)); ev.push({id:t.id,txt:'Shield '+t.shield,c:'#ff6'}); }
          if(T.fx==='heal'){ const h=Math.min(Math.round(.35*t.mx),Math.round(u.mat*T.pw)); t.hp=Math.min(t.mx,t.hp+h); const mm=Math.round(h*.25); t.mp=Math.min(t.mmp,t.mp+mm); ev.push({id:t.id,txt:'+'+h,c:'#6f6'}); }
          if(T.fx==='dr'){ t.dr=3; ev.push({id:t.id,txt:'Stone Skin',c:'#ccc'}); } if(T.fx==='regen'){ t.regen=3; t.regenAmt=Math.round(u.mat*T.pw); ev.push({id:t.id,txt:'Regen',c:'#6f6'}); } line+=' → '+t.name; }
        else if(T.tg==='all'){ alive(foes).forEach(t=>{ const d=hit(b,u,t,T.pw,T.phys,ev); if(T.slow&&d!=='dodged') t.slow=1; }); }
        else { const t=retarget(b,u,c.tgt,1); const d=hit(b,u,t,T.pw,T.phys,ev); if((T.slow||c.t==='Kick')&&d!=='dodged') t.slow=1; line+=` → ${t.name}: ${d==='dodged'?'miss':d+' DMG'}`; } } }
    check(b); return {actor:u,line,ev}; }
  endRound(b); return null; }
function endRound(b){ if(b.over) return; all(b).forEach(u=>{ if(u.hp<=0) return; if(u.regen>0){ u.regen--; u.hp=Math.min(u.mx,u.hp+u.regenAmt); } if(u.dr>0) u.dr--; if(u.dodge25>0) u.dodge25--; u.guard=0; });
  check(b); if(!b.over) b.phase='cmd'; }
function check(b){ if(b.over) return; if(!alive(b.E).length){ b.over=true; b.result='win'; } else if(!alive(b.P).length){ b.over=true; b.result='loss'; } }
function loot(b,rng){ rng=rng||Math.random; if(b.result!=='win') return {gold:0,items:[]}; const T=b.t, items=[]; const gold=20+12*T+4*b.bi;
  if(rng()<.45) items.push({k:'gear',n:['Jade Bracer','Iron Vest','Cloud Boots','Spirit Band'][Math.floor(rng()*4)]+' +'+(T+1),bonus:.03*(T+1),val:15+10*T});
  if(rng()<.35) items.push({k:'treasure',n:['Bronze Seal','Ancient Scroll','Spirit Pearl','Ash Relic'][Math.floor(rng()*4)],val:25+15*T}); return {gold,items}; }
function ai(b){ // sensible player AI: heal <45% (Light) or potion <30%, Focus Breathing when low, else best damage on weakest
  const cmds={}, E=alive(b.E), P=alive(b.P); const weak=E.slice().sort((x,y)=>x.hp-y.hp)[0]; const low=P.slice().sort((x,y)=>x.hp/x.mx-y.hp/y.mx)[0];
  for(const u of P){ const can=t=>u.techs.includes(t)&&u.mp>=cost(u,t)&&!((u.cd[t]||0)>=b.round+1);
    if(u.path==='Light'&&low.hp/low.mx<.45&&can('Healing Light')){ cmds[u.id]={k:'tech',t:'Healing Light',tgt:low.id}; continue; }
    if(low.hp/low.mx<.3&&(b.items['Healing Potion']||0)>0&&u.path!=='Light'){ cmds[u.id]={k:'item',t:'Healing Potion',tgt:low.id}; b.items['Healing Potion']-=0; continue; }
    if(u.path==='Light'&&low.hp/low.mx<.6&&can('Radiant Guard')&&!low.shield){ cmds[u.id]={k:'tech',t:'Radiant Guard',tgt:low.id}; continue; }
    const dmgT=u.techs.filter(t=>TECH[t].pw&&TECH[t].tg!=='ally'&&can(t)).sort((x,y)=>(TECH[y].pw*(TECH[y].tg==='all'?E.length:1))-(TECH[x].pw*(TECH[x].tg==='all'?E.length:1)))[0];
    if(dmgT&&u.mp>=cost(u,dmgT)+(u.path==='Light'?cost(u,'Healing Light')||0:0)) cmds[u.id]={k:'tech',t:dmgT,tgt:weak.id};
    else if(u.mp<.25*u.mmp&&u.path!=='Body') cmds[u.id]={k:'tech',t:'Focus Breathing',tgt:u.id};
    else if(u.path==='Body'&&!u.crit&&can('Combat Insight')&&b.round%2===1) cmds[u.id]={k:'tech',t:'Combat Insight',tgt:u.id};
    else cmds[u.id]={k:'fight',tgt:weak.id}; }
  return cmds; }
root.FF={STARTERS,MANUAL_COST,sheet,learn,shopTechs,PATHS,ROLE2PATH,TECH,KIT,ITEMS,TERR,newBattle,startRound,act,loot,ai,alive,cost,byId};
})(typeof window!=='undefined'?window:module.exports);
