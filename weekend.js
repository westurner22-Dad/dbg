// p17 Weekend boss battle (Thunder Ape Monarch, Qi advancement). Engine is DOM-free (headless sim); UI at bottom.
(function(root){
const W=8,H=10;
const MAP=['..h..h..','.m....m.','........','p..xx..p','..m..m..','.h.p..h.','........','m..h...m','........','........'];
const P={Body:{role:'Striker',nm:'Tiezhu',hp:300,atk:70,mat:30,spd:11,mmp:80,mv:4,rng:1,img:'body'},
 Force:{role:'Vanguard',nm:'Shanmei',hp:400,atk:54,mat:35,spd:9,mmp:90,mv:3,rng:1,img:'force'},
 Light:{role:'Support',nm:'Lumen',hp:270,atk:30,mat:58,spd:10,mmp:120,mv:3,rng:3,img:'light'},
 Mass:{role:'Controller',nm:'Zhong',hp:290,atk:34,mat:56,spd:8,mmp:110,mv:3,rng:3,img:'mass'}};
const BOSS={name:'Thunder Ape Monarch',hp:2070,spd:10,mv:3};
// p22 four distinct weekend bosses (sprite + moveset + weakness)
const BOSSES={
 ape:{q:'“OOK.” (Translation: welcome to my storm.)',name:'Thunder Ape Monarch',img:'ape',hp:2070,spd:10,mv:3,tele:'Storm Burst',d:'Brawler: slams whoever is close, leaps onto stragglers, roars to root groups. Storm Burst hits a 3×3 zone.'},
 iron:{q:'“This collar? Standard issue. Yours is on back-order.”',name:'Iron-Collared Monarch',img:'iron',hp:2280,spd:8,mv:2,tele:'Molten Line',d:'Slow juggernaut. Iron hide shrugs off physical hits until the collar breaks at half HP. Mace Sweep hits everyone next to it; Chain Pull drags ranged fighters in. Molten Line burns whole rows.'},
 banner:{q:'“Fall in line, little cultivators. The banner is always right.”',name:'Red Banner Monarch',img:'banner',hp:1980,spd:13,mv:4,tele:'Nine-Tail Lash',d:'Fast fox-general: Fox Fire snipes the weakest from anywhere, Talisman Hex drains Mana, and she blinks away from melee. Banner Rally heals her unless she is slowed. Nine-Tail Lash hits a cross.'},
 ruin:{q:'“Everything you own belongs to everyone. Which is to say, to me.”',name:'Comrade Ruin',img:'ruin',hp:2070,spd:11,mv:3,tele:'Gray Quota',d:'The World Breaker. Hammer of Ruin hits hard; Requisition confiscates Mana and potions “for the collective”. Gray Quota zones leave permanent gray tiles that burn every round.'}};
const PCT={slam:.2,leap:.16,roar:.09,aoe:.22};
let DMGK=.78;
const terr=(x,y)=>MAP[y]&&MAP[y][x];
const inB=(x,y)=>x>=0&&y>=0&&x<W&&y<H;
const R=(g)=>{ g.seed=(g.seed*1103515245+12345)&0x7fffffff; return g.seed/0x7fffffff; };
function techsFor(path,slots){ const T=root.FF?FF.TECH:{}; let s=(slots&&slots.length?slots:(FF.KIT[path].filter(t=>t!=='Focus Breathing'))).filter(t=>T[t]).slice(0,3); return s; }
function create(o){ o=o||{}; const bk=BOSSES[o.boss]?o.boss:'ape', g={bk,def:BOSSES[bk],gray:{},seed:o.seed||((Math.random()*1e9)|0),round:0,order:[],cur:-1,ev:[],log:[],over:null,tele:null,nextTele:2,phase:1,slow:0,cover:true,auto:!!o.auto};
 const me=o.path||'Body'; const paths=[me].concat(['Body','Force','Light','Mass'].filter(p=>p!==me));
 const starts=[[2,8],[5,8],[1,9],[6,9]];
 g.units=paths.map((p,i)=>{ const d=P[p]; return {id:'u'+i,me:i===0,path:p,role:d.role,name:i===0?(o.name||'You'):d.nm,img:d.img,x:starts[i][0],y:starts[i][1],mx:d.hp,hp:d.hp,mmp:d.mmp,mp:d.mmp,atk:d.atk,mat:d.mat,spd:d.spd,mv:d.mv,rng:d.rng,
  techs:i===0?techsFor(p,o.slots):techsFor(p,o.allies&&o.allies[p]&&o.allies[p].techs),cd:{},buf:{},down:false,potions:1,sc:{dmg:0,pro:0,sus:0,con:0}}; });
 g.units.forEach(u=>{ const al=o.allies&&o.allies[u.path]; if(!u.me&&al&&al.name) u.name=al.name; const gv=(u.me?o.gear:al&&al.gear)||0, GO=typeof gv==='object'?gv:{hp:gv,atk:gv,mat:gv}; [['mx','hp'],['hp','hp'],['atk','atk'],['mat','mat'],['mmp','mp'],['mp','mp']].forEach(([k,s])=>{ if(GO[s]&&u[k]) u[k]=Math.round(u[k]*(1+GO[s])); }); if(GO.spd) u.spd+=GO.spd; u.kit=GO.role||null; u.guard=GO.guard||0; u.healK=1+.6*(GO.heal||0); u.ctl=GO.ctl||0; u.rk=(u.me?o.ranks:null)||{}; });
 const BD=BOSSES[bk], BH=Math.round(BD.hp*(globalThis.DEMO_K||1)*(o.bossMul||1)); g.bdm=o.bossDmg||1; g.boss={id:'boss',x:3,y:1,hp:BH,mx:BH,spd:BD.spd,mv:BD.mv,hitR:{},taunt:null};
 if(o.humans){
  g.units=o.humans.map((h,i)=>{ const d=P[h.path],G=h.gear||{},rk=h.ranks||{},mx=Math.round(d.hp*(1+(G.hp||0))),mp=Math.round(d.mmp*(1+(G.mp||0))); return {id:'seat'+h.seat,seat:h.seat,ownerUid:h.ownerUid,me:false,path:h.path,role:d.role,name:h.name,img:d.img,x:starts[i][0],y:starts[i][1],mx,hp:mx,mmp:mp,mp,atk:Math.round(d.atk*(1+(G.atk||0))),mat:Math.round(d.mat*(1+(G.mat||0))),spd:d.spd+(G.spd||0),mv:d.mv,rng:d.rng,techs:techsFor(h.path,h.slots),cd:{},buf:{},down:false,potions:1,kit:G.role||null,guard:G.guard||0,healK:1+.6*(G.heal||0),ctl:G.ctl||0,rk,sc:{dmg:0,pro:0,sus:0,con:0},sprite:h.sprite,look:h.look}; });
  g.boss.hp=g.boss.mx=Math.round(g.boss.mx*Math.max(1,g.units.length)/4);g.cover=g.units.length===4; }
 newRound(g); return g; }
const alive=g=>g.units.filter(u=>!u.down);
const bossCells=b=>[[b.x,b.y],[b.x+1,b.y],[b.x,b.y+1],[b.x+1,b.y+1]];
const cheb=(a,b,c,d)=>Math.max(Math.abs(a-c),Math.abs(b-d));
function distBoss(g,x,y){ return Math.min(...bossCells(g.boss).map(([a,b])=>cheb(x,y,a,b))); }
function occ(g,x,y,ex){ if(bossCells(g.boss).some(([a,b])=>a===x&&b===y)) return 'boss'; const u=g.units.find(u=>u!==ex&&u.x===x&&u.y===y); return u||null; }
function los(g,x0,y0,x1,y1){ let dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,e=dx+dy,x=x0,y=y0;
 while(!(x===x1&&y===y1)){ const e2=2*e; if(e2>=dy){e+=dy;x+=sx;} if(e2<=dx){e+=dx;y+=sy;} if(!(x===x1&&y===y1)&&terr(x,y)==='p') return false; } return true; }
function canHitBoss(g,u,x,y,rng){ x=x??u.x; y=y??u.y; const r=(rng||u.rng)+(terr(x,y)==='h'&&(rng||u.rng)>1?1:0);
 return bossCells(g.boss).some(([a,b])=>{ const d=cheb(x,y,a,b); return d<=r&&(d<=1||los(g,x,y,a,b)); }); }
function reach(g,u){ const mv=u.mv-(u.buf.rooted?1:0); const best={}; best[u.x+','+u.y]=0; const q=[[u.x,u.y,0]];
 while(q.length){ const [x,y,c]=q.shift(); for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+dx,ny=y+dy; if(!inB(nx,ny)) continue; const t=terr(nx,ny); if(t==='p') continue; const o=occ(g,nx,ny,u); if(o==='boss'||(o&&!o.down)) continue;
  const nc=c+(t==='m'?2:1); if(nc>mv) continue; const k=nx+','+ny; if(best[k]===undefined||nc<best[k]){ best[k]=nc; q.push([nx,ny,nc]); } } }
 return Object.keys(best).filter(k=>{ const [x,y]=k.split(',').map(Number); const o=occ(g,x,y,u); return !o; }).map(k=>k.split(',').map(Number)); }
// p21 speed tick (ATB): every actor fills a gauge at 10×Speed per round and acts each time it passes 100.
// Speed 10 = one turn a round; a modest lead banks extra turns over time; double speed ≈ twice the turns.
function newRound(g){ g.round++; const b=g.boss; b.hitR={}; g.atb=g.atb||{}; g.acts={}; const q=[];
 [...g.units,b].forEach(u=>{ if(u!==b&&u.down) return; let a=g.atb[u.id]; if(a==null) a=R(g)*40; const rate=10*Math.max(1,u.spd); let k=1;
  while(a+rate>=100*k){ q.push({id:u.id,t:(100*k-a)/rate+R(g)*1e-3}); k++; } g.atb[u.id]=a+rate-100*(k-1); });
 q.sort((x,y)=>x.t-y.t); g.order=q.map(x=>x.id); g.cur=-1;
 g.ev.push({t:'round',r:g.round}); if(g.round===15) g.ev.push({t:'banner',s:'Round 15 — '+g.def.name+'’s fury is unbound'}); }
function cur(g){ const id=g.order[g.cur]; return id==='boss'?g.boss:g.units.find(u=>u.id===id); }
function advance(g){ // returns current actor; skips downed
 for(;;){ g.cur++; if(g.cur>=g.order.length){ endRound(g); if(g.over) return null; newRound(g); continue; } const a=cur(g); if(a===g.boss||!a.down){ const n=g.acts[a.id]=(g.acts[a.id]||0)+1; if(n>1&&a!==g.boss) g.ev.push({t:'msg',s:'⚡ '+a.name+' is faster — extra turn!'},{t:'fx',id:a.id,k:'haste'}); if(a!==g.boss){ a.moved=false; a.acted=false; a.buf.block=0; if(g.boss.taunt===a.id) g.boss.taunt=null; } return a; } } }
function endRound(g){ for(const u of alive(g)){ if(terr(u.x,u.y)==='x'||g.gray[u.x+','+u.y]){ hurt(g,u,Math.round(u.mx*.05),g.gray[u.x+','+u.y]?'gray':'hazard',true); }
  if(u.buf.regen>0&&!u.down){ heal(g,u,u,u.buf.regenV,true); u.buf.regen--; } ['dr','dodge25','rooted'].forEach(k=>{ if(u.buf[k]>0) u.buf[k]--; }); u.mp=Math.min(u.mmp,u.mp+Math.round(u.mmp*.06)); }
 if(g.slow>0) g.slow--; if(g.boss.hp>0&&g.round>=20){ g.over='escape'; g.ev.push({t:'banner',s:g.def.name+' escapes!'}); }
 if(!alive(g).length) g.over='wipe'; }
function coverage(g){ return g.cover?1.10:1; } // all 4 roles: Striker +5% dmg, +5% all-four bonus
function hitBoss(g,u,pw,phys,tag){ const b=g.boss; let s=(phys?u.atk:u.mat)*pw*DMGK*coverage(g)*(.9+R(g)*.2); let crit=false;
 if(u.buf.crit){ s*=2; crit=true; u.buf.crit=0; } else if(R(g)<.1){ s*=1.5; crit=true; }
 if(g.bk==='iron') s*=g.phase===1?(phys?.7:1):1.2; s=Math.round(s); b.hp=Math.max(0,b.hp-s); u.sc.dmg+=s; g.ev.push({t:'lunge',id:u.id,to:'boss'},{t:'dmg',id:'boss',v:s,crit,tag});
 if(g.phase===1&&b.hp<=b.mx/2){ g.phase=2; g.ev.push({t:'phase2'},{t:'banner',s:{ape:'Phase 2 — the storm awakens!',iron:'The iron collar SNAPS — it’s exposed!',banner:'Phase 2 — all nine tails burn!',ruin:'Phase 2 — the Five-Year Plan begins!'}[g.bk]}); g.nextTele=Math.min(g.nextTele,g.round+1); }
 if(b.hp<=0){ g.over='win'; g.ev.push({t:'banner',s:'Victory!'}); } return s; }
function heal(g,src,u,v,silent){ v=Math.round(Math.min(v,u.mx-u.hp)); if(v<=0) return 0; u.hp+=v; src.sc.sus+=v; g.ev.push({t:'heal',id:u.id,v}); return v; }
function hurt(g,u,v,tag,raw){ if(u.down) return 0; let pre=v; if(!raw){ let dr=.05+(u.buf.dr>0?.2:0)+(u.buf.block?.5:0)+Math.min(.35,(u.guard||0)*.5); dr=Math.min(.7,dr); v=Math.round(v*(1-dr)); u.sc.pro+=pre-v; }
 if(u.buf.shield>0){ const a=Math.min(u.buf.shield,v); u.buf.shield-=a; v-=a; (g.units.find(x=>x.id===u.buf.shieldBy)||u).sc.pro+=a; }
 if(!raw&&g.boss.taunt===u.id) u.sc.pro+=v;
 u.hp=Math.max(0,u.hp-v); g.ev.push({t:'dmg',id:u.id,v,tag}); if(u.hp<=0){ u.down=true; g.ev.push({t:'down',id:u.id},{t:'msg',s:u.name+' is down!'}); if(!alive(g).length){ g.over='wipe'; } } return v; }
function tcost(u,t){ return t==='Attack'||t==='Challenge'?0:Math.round(FF.TECH[t].tier*.1*u.mmp); }
function techInfo(u,t){ if(t==='Attack') return {tg:'foe',pw:u.rng>1?.85:1,phys:u.rng===1,rng:u.rng,d:u.rng>1?'Ranged qi strike':'Basic strike'};
 if(t==='Challenge') return {tg:'self',fx:'taunt',rng:0,d:'Taunt: the Monarch must target you until your next turn (2-round cooldown)'};
 const T=FF.TECH[t], rk=(u.rk&&u.rk[t])||1; return Object.assign({},T,{rk,pw:(T.pw||0)*(1+.15*(rk-1)),rng:T.tg==='foe'||T.tg==='all'?(T.phys?1:4):T.tg==='ally'?4:0}); }
function menu(g,u){ const l=['Attack'].concat(u.techs); if(u.kit==='healer'&&!l.includes('Mending Rite')) l.push('Mending Rite'); if(u.kit==='ctrl'&&!l.includes('Binding Seal')) l.push('Binding Seal'); if(u.role==='Vanguard'||u.kit==='tank') l.push('Challenge'); return l.map(t=>{ const i=techInfo(u,t), c=tcost(u,t); let ok=true, why='';
 if(u.mp<c){ok=false;why='Not enough MP';} else if((u.cd[t]||0)>g.round){ok=false;why='Recharging';} else if((i.tg==='foe'||i.tg==='all')&&!canHitBoss(g,u,u.x,u.y,i.rng)){ok=false;why='Out of range';}
 return {t,i,c,ok,why}; }); }
function allyTargets(g,u,rng){ return g.units.filter(a=>!a.down&&cheb(u.x,u.y,a.x,a.y)<=rng); }
function act(g,u,t,tgt){ const i=techInfo(u,t), c=tcost(u,t); u.mp-=c; if(i.cd) u.cd[t]=g.round+i.cd+1; u.acted=true; g.ev.push({t:'msg',s:u.name+(t==='Attack'?' attacks!':' uses '+t+'!')});
 if(t==='Challenge'){ g.boss.taunt=u.id; u.cd[t]=g.round+3; g.ev.push({t:'fx',id:u.id,k:'taunt'}); return; }
 if(i.tg==='foe'||i.tg==='all'){ hitBoss(g,u,i.pw,i.phys,t); if(i.bind){ const push=Math.round(35*(1+(u.ctl||0))); g.atb.boss=(g.atb.boss||0)-push; u.sc.con+=Math.round(avgHit(g)*(1+(u.ctl||0))); g.ev.push({t:'msg',s:'Binding Seal! '+g.def.name+'’s turn gauge is pushed back.'}); }
  if(i.slow){ g.slow=2+(g.cover?1:0)+((u.ctl||0)>=.15?1:0); u.sc.con+=Math.round(.25*avgHit(g)*2); g.ev.push({t:'fx',id:'boss',k:'slow'},{t:'msg',s:'The Monarch is slowed!'}); } return; }
 const a=tgt||u; g.ev.push({t:'fx',id:a.id,k:i.fx});
 const HK=u.healK||1; if(i.fx==='heal'){ const v=heal(g,u,a,Math.min(i.pw*u.mat*1.1*HK,a.mx*(.35+.1*(HK-1))*(1+.15*((i.rk||1)-1)))); a.mp=Math.min(a.mmp,a.mp+Math.round(v*.25)); }
 else if(i.fx==='shield'){ a.buf.shield=Math.round(Math.min(i.pw*u.mat*1.1*HK,a.mx*.35*(1+.15*((i.rk||1)-1)))); a.buf.shieldBy=u.id; }
 else if(i.fx==='dr') a.buf.dr=3; else if(i.fx==='regen'){ a.buf.regen=3; a.buf.regenV=Math.round(i.pw*u.mat*HK); }
 else if(i.fx==='crit') u.buf.crit=1; else if(i.fx==='dodge') u.buf.dodge=1; else if(i.fx==='dodge25') u.buf.dodge25=2;
 else if(i.fx==='mana'){ const v=Math.min(u.mmp-u.mp,Math.round(u.mmp*.15)); u.mp+=v; u.sc.sus+=v; } }
function item(g,u,k,tgt){ u.acted=true; if(k==='Potion'){ u.potions--; heal(g,u,u,u.mx*.3); g.ev.push({t:'msg',s:u.name+' drinks a Healing Potion.'}); }
 if(k==='Revive'){ tgt.down=false; tgt.hp=Math.round(tgt.mx*.3); u.sc.sus+=Math.round(tgt.mx*.2); g.ev.push({t:'heal',id:tgt.id,v:tgt.hp},{t:'fx',id:tgt.id,k:'revive'},{t:'msg',s:u.name+' revives '+tgt.name+'!'}); } }
function block(g,u){ u.acted=true; u.buf.block=1; g.ev.push({t:'fx',id:u.id,k:'block'},{t:'msg',s:u.name+' braces (Block).'}); }
function items(g,u){ const l=[]; l.push({k:'Potion',ok:u.potions>0&&u.hp<u.mx,lab:'Healing Potion ×'+u.potions}); g.units.filter(a=>a.down&&cheb(a.x,a.y,u.x,u.y)<=1).forEach(a=>l.push({k:'Revive',tgt:a,ok:true,lab:'Revive '+a.name}));
 if(!l.some(x=>x.k==='Revive')) l.push({k:'Revive',ok:false,lab:'Revive (stand next to a downed ally)'}); return l; }
function moveTo(g,u,x,y){ if(x!==u.x||y!==u.y){ u.x=x; u.y=y; g.ev.push({t:'move',id:u.id}); } u.moved=true; }
// ---- Boss
function avgHit(g){ return 330*PCT.slam; }
function bossHit(g,u,pct,name){ const b=g.boss; let v=(globalThis.DEMO_K||1)*(g.bdm||1)*u.mx*pct*(g.phase===2?1.2:1)*(g.slow>0?.75:1); if(g.round>=15) v/=.6; else v=Math.min(v,u.mx*.25);
 if(g.slow>0){ const s=g.units.find(x=>x.kit==='ctrl')||g.units.find(x=>x.role==='Controller'); if(s) s.sc.con+=Math.round(v/3); }
 if(name!=='Storm Burst'&&(u.buf.dodge||(u.buf.dodge25>0&&R(g)<.25))){ u.buf.dodge=0; u.sc.pro+=Math.round(v); g.ev.push({t:'msg',s:u.name+' dodges '+name+'!'},{t:'fx',id:u.id,k:'dodge'}); b.hitR[u.id]=1; return; }
 b.hitR[u.id]=(b.hitR[u.id]||0)+1; hurt(g,u,Math.round(v),name); }
function bossTargets(g){ const b=g.boss, a=alive(g); if(b.taunt){ const t=a.find(u=>u.id===b.taunt); if(t) return [t]; }
 const fresh=a.filter(u=>!b.hitR[u.id]); const tk=fresh.find(u=>u.kit==='tank'); if(tk&&R(g)<.55) return [tk]; return fresh.length?fresh:(a.length===1?a:[]); }
function bossFoot(g,x,y){ return bossCells({x,y}).every(([a,c])=>inB(a,c)&&terr(a,c)!=='p'&&!g.units.some(u=>!u.down&&u.x===a&&u.y===c)); }
function bossAction(g,n){ if(g.over) return; if(g.bk!=='ape') return BACT[g.bk](g,n); return apeAction(g,n); }
function apeAction(g,n){ const b=g.boss;
 if(n===0&&g.tele&&g.tele.r<g.round){ const T=g.tele; g.tele=null; g.ev.push({t:'aoe',cells:T.cells},{t:'msg',s:'Storm Burst crashes down!'});
  alive(g).filter(u=>T.cells.some(([x,y])=>x===u.x&&y===u.y)).forEach(u=>{ if(!b.hitR[u.id]||b.taunt===u.id) bossHit(g,u,PCT.aoe,'Storm Burst'); }); return; }
 const ts=bossTargets(g); if(!ts.length){ g.ev.push({t:'msg',s:'The Monarch beats its chest.'}); return; }
 const near=ts.filter(u=>distBoss(g,u.x,u.y)<=1);
 if(near.length){ const t=near.sort((a,c)=>a.hp/a.mx-c.hp/c.mx)[0]; g.ev.push({t:'msg',s:'Heavy Slam on '+t.name+'!'},{t:'lunge',id:'boss',to:t.id}); bossHit(g,t,PCT.slam,'Heavy Slam'); return; }
 const inRoar=ts.filter(u=>distBoss(g,u.x,u.y)<=3); if(inRoar.length>=2&&g.round%3===0){ g.ev.push({t:'msg',s:'The Monarch ROARS!'},{t:'fx',id:'boss',k:'roar'}); inRoar.forEach(u=>{ bossHit(g,u,PCT.roar,'Roar'); u.buf.rooted=1; }); return; }
 // walk toward nearest target; if can't get adjacent, Leap to the farthest target
 const t=ts.sort((a,c)=>distBoss(g,a.x,a.y)-distBoss(g,c.x,c.y))[0]; let best=null;
 for(let x=0;x<W-1;x++) for(let y=0;y<H-1;y++){ if(!bossFoot(g,x,y)) continue; const d=Math.abs(x-b.x)+Math.abs(y-b.y); const dd=Math.min(...bossCells({x,y}).map(([a,c])=>cheb(a,c,t.x,t.y)));
  if(dd<=1&&(d<=b.mv)&&(!best||d<best.d)) best={x,y,d}; }
 if(best){ b.x=best.x; b.y=best.y; g.ev.push({t:'move',id:'boss'},{t:'msg',s:'Heavy Slam on '+t.name+'!'},{t:'lunge',id:'boss',to:t.id}); bossHit(g,t,PCT.slam,'Heavy Slam'); return; }
 const far=ts.sort((a,c)=>distBoss(g,c.x,c.y)-distBoss(g,a.x,a.y))[0]; let land=null;
 for(let x=0;x<W-1;x++) for(let y=0;y<H-1;y++){ if(!bossFoot(g,x,y)) continue; const dd=Math.min(...bossCells({x,y}).map(([a,c])=>cheb(a,c,far.x,far.y))); if(dd<=1&&(!land||Math.abs(y-far.y)<land.k)) land={x,y,k:Math.abs(y-far.y)}; }
 if(land){ b.x=land.x; b.y=land.y; g.ev.push({t:'leap'},{t:'move',id:'boss'},{t:'msg',s:'The Monarch LEAPS onto '+far.name+'!'}); bossHit(g,far,PCT.leap,'Leap'); } else g.ev.push({t:'msg',s:'The Monarch prowls.'}); }
function bossEnd(g){ if(g.over) return; if(g.bk!=='ape') return teleEnd(g); if(g.round>=g.nextTele&&!g.tele){ // telegraph 3x3 (phase 2: 4x3) on the densest player spot
  let best=null; const w=g.phase===2?4:3; for(let x=0;x<=W-w;x++) for(let y=0;y<=H-3;y++){ let n=0; alive(g).forEach(u=>{ if(u.x>=x&&u.x<x+w&&u.y>=y&&u.y<y+3) n++; }); n+=R(g)*.5; if(!best||n>best.n) best={x,y,n}; }
  const cells=[]; for(let i=0;i<w;i++) for(let j=0;j<3;j++) cells.push([best.x+i,best.y+j]); g.tele={cells,r:g.round}; g.nextTele=g.round+(g.phase===2?2:2+(R(g)<.5?1:0));
  g.ev.push({t:'tele'},{t:'msg',s:'Lightning gathers… move out of the red zone!'}); } }

// ---- p22 boss variants
const say=(g,s)=>g.ev.push({t:'msg',s});
function resolveTele(g,pct){ const T=g.tele, b=g.boss; g.tele=null; g.ev.push({t:'aoe',cells:T.cells},{t:'msg',s:g.def.tele+' crashes down!'});
 alive(g).filter(u=>T.cells.some(([x,y])=>x===u.x&&y===u.y)).forEach(u=>{ if(!b.hitR[u.id]||b.taunt===u.id) bossHit(g,u,pct,g.def.tele); });
 if(g.bk==='ruin'){ const cs=T.cells.filter(([x,y])=>terr(x,y)!=='p'&&!(x>=2&&x<=5&&y>=8)); for(let k=0;k<2&&cs.length;k++){ const c=cs.splice(Math.floor(R(g)*cs.length),1)[0]; g.gray[c[0]+','+c[1]]=1; } g.ev.push({t:'msg',s:'The zone turns gray. Gray tiles burn anyone standing on them.'}); } }
function walkTo(g,t,mv){ const b=g.boss; let best=null; for(let x=0;x<W-1;x++) for(let y=0;y<H-1;y++){ if(!bossFoot(g,x,y)) continue; const d=Math.abs(x-b.x)+Math.abs(y-b.y); const dd=Math.min(...bossCells({x,y}).map(([a,c])=>cheb(a,c,t.x,t.y)));
  if(dd<=1&&d<=mv&&(!best||d<best.d)) best={x,y,d}; } if(best){ b.x=best.x; b.y=best.y; g.ev.push({t:'move',id:'boss'}); return true; }
 // step closer even if not adjacent
 let st=null; for(let x=0;x<W-1;x++) for(let y=0;y<H-1;y++){ if(!bossFoot(g,x,y)) continue; const d=Math.abs(x-b.x)+Math.abs(y-b.y); if(d>mv) continue; const dd=Math.min(...bossCells({x,y}).map(([a,c])=>cheb(a,c,t.x,t.y))); if(!st||dd<st.dd) st={x,y,dd}; }
 if(st){ b.x=st.x; b.y=st.y; g.ev.push({t:'move',id:'boss'}); } return false; }
const BACT={
 iron(g,n){ const b=g.boss; if(n===0&&g.tele&&g.tele.r<g.round) return resolveTele(g,PCT.aoe);
  const ts=bossTargets(g); if(!ts.length){ say(g,'The Iron-Collared Monarch rattles its chain.'); return; }
  const near=ts.filter(u=>distBoss(g,u.x,u.y)<=1), adjAll=alive(g).filter(u=>distBoss(g,u.x,u.y)<=1&&(!b.hitR[u.id]||b.taunt===u.id));
  if(adjAll.length>=2&&!b.taunt){ say(g,'MACE SWEEP!'); g.ev.push({t:'fx',id:'boss',k:'roar'}); adjAll.forEach(u=>bossHit(g,u,PCT.slam*.75,'Mace Sweep')); return; }
  if(near.length){ const t=near[0]; say(g,'Iron Mace crushes '+t.name+'!'); g.ev.push({t:'lunge',id:'boss',to:t.id}); bossHit(g,t,PCT.slam*1.1,'Iron Mace'); return; }
  const far=ts.slice().sort((a,c)=>distBoss(g,c.x,c.y)-distBoss(g,a.x,a.y))[0];
  if(far&&distBoss(g,far.x,far.y)>=3&&g.round%2===0){ const cells=[]; bossCells(b).forEach(([a,c])=>{ for(const [dx,dy] of [[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[1,1],[-1,1],[1,-1]]){ const x=a+dx,y=c+dy; if(inB(x,y)&&terr(x,y)!=='p'&&!occ(g,x,y,far)) cells.push([x,y]); } });
   if(cells.length){ const [x,y]=cells.sort((p,q)=>cheb(p[0],p[1],far.x,far.y)-cheb(q[0],q[1],far.x,far.y))[0]; far.x=x; far.y=y; far.buf.rooted=1; g.ev.push({t:'move',id:far.id},{t:'msg',s:'CHAIN PULL! '+far.name+' is dragged in!'}); bossHit(g,far,PCT.leap*.8,'Chain Pull'); return; } }
  const t=ts.sort((a,c)=>distBoss(g,a.x,a.y)-distBoss(g,c.x,c.y))[0]; if(walkTo(g,t,b.mv)){ say(g,'Iron Mace crushes '+t.name+'!'); bossHit(g,t,PCT.slam,'Iron Mace'); } else say(g,'The Iron-Collared Monarch stomps forward.'); },
 banner(g,n){ const b=g.boss; if(n===0&&g.tele&&g.tele.r<g.round) return resolveTele(g,PCT.aoe*.9);
  if(n===1&&(g.round%4===0||(g.phase===2&&!g.rallied))){ g.rallied=1; if(g.slow>0){ say(g,'Banner Rally fails — the slowed banner tangles!'); const c=g.units.find(x=>x.kit==='ctrl')||g.units.find(x=>x.role==='Controller'); if(c) c.sc.con+=Math.round(b.mx*.04); return; } const v=Math.round(b.mx*.04); b.hp=Math.min(b.mx,b.hp+v); g.ev.push({t:'heal',id:'boss',v},{t:'msg',s:'BANNER RALLY! The Red Banner Monarch heals.'}); return; }
  const ts=bossTargets(g); if(!ts.length){ say(g,'The Red Banner Monarch twirls her banner.'); return; }
  const adj=alive(g).filter(u=>distBoss(g,u.x,u.y)<=1); if(adj.length>=2&&!b.taunt&&R(g)<.6){ let sp=null; for(let x=0;x<W-1;x++) for(let y=0;y<H-1;y++){ if(!bossFoot(g,x,y)) continue; const m=Math.min(...alive(g).map(u=>Math.min(...bossCells({x,y}).map(([a,c])=>cheb(a,c,u.x,u.y))))); if(m>=2&&(!sp||m<sp.m||(m===sp.m&&R(g)<.5))) sp={x,y,m}; }
   if(sp){ b.x=sp.x; b.y=sp.y; g.ev.push({t:'move',id:'boss'},{t:'fx',id:'boss',k:'roar'}); say(g,'The Red Banner Monarch BLINKS away from melee!'); } }
  if(g.round%3===0&&ts.length>=2){ const hx=ts.slice(0,2); say(g,'TALISMAN HEX on '+hx.map(u=>u.name).join(' and ')+'!'); hx.forEach(u=>{ bossHit(g,u,PCT.roar,'Talisman Hex'); u.mp=Math.max(0,u.mp-Math.round(u.mmp*.2)); u.buf.rooted=1; }); return; }
  const t=ts.sort((a,c)=>a.hp/a.mx-c.hp/c.mx)[0]; say(g,'Fox Fire scorches '+t.name+'!'); g.ev.push({t:'lunge',id:'boss',to:t.id}); bossHit(g,t,PCT.slam*.8,'Fox Fire'); },
 ruin(g,n){ const b=g.boss; if(n===0&&g.tele&&g.tele.r<g.round) return resolveTele(g,PCT.aoe);
  const ts=bossTargets(g); if(!ts.length){ say(g,'Comrade Ruin updates his clipboard.'); return; }
  const near=ts.filter(u=>distBoss(g,u.x,u.y)<=1);
  if(near.length){ const t=near.sort((a,c)=>a.hp/a.mx-c.hp/c.mx)[0]; say(g,'Hammer of Ruin on '+t.name+'!'); g.ev.push({t:'lunge',id:'boss',to:t.id}); bossHit(g,t,PCT.slam*1.1,'Hammer of Ruin'); return; }
  if(n===1&&g.round%3===1){ const vs=alive(g); vs.forEach(u=>{ u.mp=Math.max(0,u.mp-Math.round(u.mmp*.15)); }); const p=vs.find(u=>u.potions>0); if(p) p.potions--; g.ev.push({t:'fx',id:'boss',k:'roar'}); say(g,'REQUISITION! Everyone loses Mana'+(p?' and '+p.name+'’s potion is confiscated “for the collective.”':'.')); return; }
  const t=ts.sort((a,c)=>distBoss(g,a.x,a.y)-distBoss(g,c.x,c.y))[0]; if(walkTo(g,t,b.mv)){ say(g,'Hammer of Ruin on '+t.name+'!'); g.ev.push({t:'lunge',id:'boss',to:t.id}); bossHit(g,t,PCT.slam,'Hammer of Ruin'); } else say(g,'Comrade Ruin marches on, stamping forms.'); }};
function teleEnd(g){ if(g.round<g.nextTele||g.tele) return; const P=alive(g); let cells=[];
 if(g.bk==='iron'){ let best=null; for(let y=0;y<H-1;y++){ let n=P.filter(u=>u.y===y||u.y===y+1).length+R(g)*.5; if(!best||n>best.n) best={y,n}; } const rows=g.phase===2?3:2; for(let j=0;j<rows;j++) for(let x=0;x<W;x++) if(best.y+j<H) cells.push([x,best.y+j]); g.nextTele=g.round+3; }
 else if(g.bk==='banner'){ const c=P.slice().sort(()=>R(g)-.5)[0]; const r=g.phase===2?3:2; for(let k=-r;k<=r;k++){ if(inB(c.x+k,c.y)) cells.push([c.x+k,c.y]); if(k&&inB(c.x,c.y+k)) cells.push([c.x,c.y+k]); } g.nextTele=g.round+2; }
 else { let best=null; const w=g.phase===2?4:3; for(let x=0;x<=W-w;x++) for(let y=0;y<=H-3;y++){ let n=0; P.forEach(u=>{ if(u.x>=x&&u.x<x+w&&u.y>=y&&u.y<y+3) n++; }); n+=R(g)*.5; if(!best||n>best.n) best={x,y,n}; } for(let i=0;i<w;i++) for(let j=0;j<3;j++) cells.push([best.x+i,best.y+j]); g.nextTele=g.round+(g.phase===2?2:3); }
 g.tele={cells,r:g.round}; g.ev.push({t:'tele'},{t:'msg',s:{iron:'The furnace glows… rows will burn — get off the red lines!',banner:'Nine tails rise… dodge the red cross!',ruin:'A Gray Quota is stamped… leave the red zone!'}[g.bk]}); }
function bossTurn(g){ bossAction(g,0); bossAction(g,1); bossEnd(g); }
// ---- Party AI (teammates, and the player on Auto)
const inTele=(g,x,y)=>g.tele&&g.tele.cells.some(c=>c[0]===x&&c[1]===y);
function ai(g,u){ const opts=reach(g,u); const hurtA=alive(g).filter(a=>a.hp/a.mx<.55).sort((a,c)=>a.hp/a.mx-c.hp/c.mx)[0]; const downA=g.units.find(a=>a.down);
 const ml=menu(g,u); const has=t=>u.techs.includes(t)&&u.mp>=tcost(u,t)&&(u.cd[t]||0)<=g.round; const has2=t=>u.mp>=tcost(u,t)&&(u.cd[t]||0)<=g.round;
 const healT=['Mending Rite','Healing Light','Earthen Renewal','Radiant Guard'].concat(u.techs.filter(t=>FF.TECH[t]&&FF.TECH[t].fx==='heal')).find(t=>(t==='Mending Rite'?u.kit==='healer':u.techs.includes(t))&&has2(t));
 let goal='boss', ally=null; if(downA&&!((u.role==='Vanguard'||u.kit==='tank')&&g.boss.taunt)){ goal='revive'; ally=downA; } else if(hurtA&&healT){ goal='heal'; ally=hurtA; }
 const ranged=u.rng>1; const score=([x,y])=>{ let s=0; if(inTele(g,x,y)) s-=100; if(terr(x,y)==='x') s-=8;
  if(goal==='revive') s-=cheb(x,y,ally.x,ally.y)<=1?0:10+cheb(x,y,ally.x,ally.y);
  else if(goal==='heal') s-=cheb(x,y,ally.x,ally.y)<=4?0:10; 
  const d=distBoss(g,x,y); if(ranged){ s+=canHitBoss(g,u,x,y,4)?6:-d; if(d<=1) s-=4; if(terr(x,y)==='h') s+=1; } else s+=d<=1?6:-d;
  return s-(Math.abs(x-u.x)+Math.abs(y-u.y))*.01; };
 const pick=opts.map(p=>[p,score(p)]).sort((a,c)=>c[1]-a[1])[0][0]; moveTo(g,u,pick[0],pick[1]);
 if(goal==='revive'&&cheb(u.x,u.y,ally.x,ally.y)<=1){ item(g,u,'Revive',ally); return; }
 if(goal==='heal'&&cheb(u.x,u.y,ally.x,ally.y)<=4){ act(g,u,healT,ally); return; }
 if(u.hp/u.mx<.3&&u.potions>0){ item(g,u,'Potion'); return; }
 if((u.role==='Vanguard'||u.kit==='tank')&&(u.cd.Challenge||0)<=g.round&&distBoss(g,u.x,u.y)<=2){ act(g,u,'Challenge'); return; }
 if(u.techs.includes('Stone Skin')&&has('Stone Skin')){ const v=alive(g).find(a=>a.role==='Vanguard'&&!a.buf.dr); if(v&&cheb(u.x,u.y,v.x,v.y)<=4&&R(g)<.35){ act(g,u,'Stone Skin',v); return; } }
 if(u.kit==='ctrl'&&g.slow<=0&&has2('Binding Seal')&&canHitBoss(g,u,u.x,u.y,4)){ act(g,u,'Binding Seal'); return; }
 if(has('Combat Insight')&&!u.buf.crit&&R(g)<.3){ act(g,u,'Combat Insight'); return; }
 const off=ml.filter(m=>m.ok&&(m.i.tg==='foe'||m.i.tg==='all')).sort((a,c)=>(c.i.pw*(c.i.phys?u.atk:u.mat)+(c.i.slow&&g.slow<=0?40:0))-(a.i.pw*(a.i.phys?u.atk:u.mat)+(a.i.slow&&g.slow<=0?40:0)));
 if(off.length){ act(g,u,off[0].t); return; } if(u.mp<u.mmp*.3&&has('Focus Breathing')){ act(g,u,'Focus Breathing'); return; } block(g,u); }
function sim(n,o){ o=o||{}; const res={win:0,esc:0,wipe:0,rounds:[],hang:0}; for(let i=0;i<n;i++){ const g=create(Object.assign({},o,{seed:i+1+(o.s||0),path:o.path||['Body','Force','Light','Mass'][i%4]})); let guard=0;
  while(!g.over&&guard++<500){ const a=advance(g); if(!a) break; if(a===g.boss) bossTurn(g); else ai(g,a); g.ev.length=0; }
  if(guard>=500) res.hang++; res[g.over==='win'?'win':g.over==='escape'?'esc':'wipe']++; if(g.over==='win') res.rounds.push(g.round); }
 res.avg=(res.rounds.reduce((a,b)=>a+b,0)/Math.max(1,res.rounds.length)).toFixed(1); res.dist={}; res.rounds.forEach(r=>res.dist[r]=(res.dist[r]||0)+1); delete res.rounds; return res; }
function scores(g){ const ch=['dmg','pro','sus','con'], tot={}; ch.forEach(k=>tot[k]=g.units.reduce((a,u)=>a+u.sc[k],0)||1);
 const rows=g.units.map(u=>({u,share:ch.map(k=>u.sc[k]/tot[k]),total:ch.reduce((a,k)=>a+u.sc[k]/tot[k],0)/4})); const mvp=rows.slice().sort((a,c)=>c.total-a.total)[0]; return {rows,mvp}; }
const LOOTN={ape:['Storm-Silk Sash','Thunderhide Bracers','Monarch’s Crown Shard','Thunder Ape Marrow'],iron:['Rivet-Link Belt','Collar-Iron Gauntlets','Broken Collar Plate','Molten Iron Heart'],banner:['Fox-Silk Scarf','Talisman Vambraces','Ninth Tail Pennant','Fox-Fire Pearl'],ruin:['Gray Requisition Sash','Ruin-Hammer Grips','Breaker’s Cap Badge','Core of the World Breaker']};
function loot(g){ const N=LOOTN[g.bk]||LOOTN.ape, l=[]; for(let i=0;i<4;i++){ const r=R(g)*100; l.push(r<20?null:r<55?{n:'Rare '+N[0],q:'Rare',v:40}:r<70?{n:'Epic '+N[1],q:'Epic',v:90}:r<75?{n:'Legendary '+N[2],q:'Legendary',v:200}:r<90?{n:'Manual: '+['Momentum Strike','Purifying Flash','Gravity Well','Flow Like Water'][i],q:'Manual',v:30}:{n:N[3]+' (stat treasure)',q:'Treasure',v:60}); } return l; }
root.WK={BOSSES,create,advance,cur,reach,moveTo,menu,act,item,items,block,bossAction,bossEnd,bossTurn,ai,sim,scores,loot,allyTargets,canHitBoss,techInfo,distBoss,bossCells,terr,MAP,W,H,P,inTele,setK:k=>DMGK=k,PCT};
})(typeof window!=='undefined'?window:globalThis);
