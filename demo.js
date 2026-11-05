// p18 Demo Run: one continuous campaign (Qi -> Foundation -> Core -> Nascent finale) with 3 AI cultivators.
(function(root){
const K=0.7, REALMS=['Qi Gathering','Foundation','Core','Nascent'];
const WEEKS=[{realm:'Qi Gathering',mode:'world',label:'Explore the overworld',hint:'Win wild-beast battles (40 XP each) or beat Scout Ren.'},
 {realm:'Foundation',mode:'htl',label:'Hold the Line',hint:'Clear waves 1–2 (50 XP each).'},
 {realm:'Core',mode:'sect',label:'Sect Conquest',hint:'Win 2 squad battles (50 XP each).'}];
const DAYS=['Mon','Tue','Wed','Sat'], LV_PER_DAY=3, NAS_ROUNDS=8;
const AIS={Body:'Tiezhu',Force:'Shanmei',Light:'Lumen',Mass:'Zhong'};
const GEARQ={Rare:.06,Epic:.1,Legendary:.15};
function init(){ return {week:0,d:0,ai:null,boss:[],bossTries:0,done:false,t0:Date.now(),news:[]}; }
function makeAI(me){ return ['Body','Force','Light','Mass'].filter(p=>p!==me).map(p=>({name:AIS[p],path:p,level:1,realmIdx:0,gold:0,wins:0,loot:[],gear:0,bossMvp:0,nas:0})); }
function aiTechs(a){ const T=root.FF.TECH; return root.FF.KIT[a.path].filter(t=>T[t]&&T[t].lv<=a.level&&t!=='Focus Breathing').slice(-3); }
// AI fights the same number of fights as the player did that day (min 2, max 8); win chance from level vs demo enemy strength
const aiP=(a,k)=>Math.max(.4,Math.min(.97,.8+.015*a.level-.6*((k||K)-.7)));
function aiDay(D,rng,n,k){ rng=rng||Math.random; n=Math.max(2,Math.min(8,n||3)); return D.ai.map(a=>{ let w=0; for(let i=0;i<n;i++) if(rng()<aiP(a,k)) w++; const g=a.level<10?(rng()<.8?LV_PER_DAY:LV_PER_DAY-1):0; a.level=Math.min(10,a.level+g); const gold=8*w+Math.floor(rng()*10); a.wins+=w; a.gold+=gold; return `${a.name}: ${w} wins, +${gold}g`+(g?`, Lv ${a.level}`:''); }); }
// apply a won weekend chest item to the player
function applyLoot(c,q,it,path){ if(!it) return ''; if(GEARQ[it.q]){ const g={k:'gear',n:it.n,bonus:GEARQ[it.q],val:it.v}; if(!q.gear||q.gear.bonus<g.bonus){ if(q.gear) q.inv.push(q.gear); q.gear=g; return `Equipped ${it.n} (+${Math.round(g.bonus*100)}% HP/attack).`; } q.inv.push(g); return `${it.n} added to your bag.`; }
 if(it.q==='Manual'){ const t=it.n.replace('Manual: ',''); if(root.FF.KIT[path].includes(t)&&!q.techs[t]){ root.FF.learn(q,path,t); return `Learned ${t}!`; } q.inv.push({k:'treasure',n:it.n,val:it.v}); return `${it.n} (other path) added to bag; sell it for ${it.v}g.`; }
 const f=root.DBG.ROLES[c.role].focus; c.attr[f]+=2; c.attr.Aff+=1; q.gearT=(q.gearT||0)+.02; return `Refined ${it.n}: +2 ${f}, +1 Aff.`; }
function breakthrough(c,D){ c.realmIdx=(c.realmIdx||0)+1; c.realm=REALMS[c.realmIdx]; c.level=1; D.ai.forEach(a=>{ a.realmIdx++; a.level=1; }); D.week++; D.d=0; D.bossTries=0; }
function scores(D,me){ // 4-channel score: Pace, Combat, Wealth, Conquest -> 0-100 each relative to best
 const rows=[me].concat(D.ai.map(a=>({name:a.name,path:a.path,pace:a.realmIdx*10+a.level,combat:a.wins+a.bossMvp*3,wealth:a.gold+a.loot.length*40,conquest:a.nas})));
 const ch=['pace','combat','wealth','conquest'], mx={}; ch.forEach(k=>mx[k]=Math.max(1,...rows.map(r=>r[k])));
 rows.forEach(r=>{ r.ch=ch.map(k=>Math.round(100*r[k]/mx[k])); r.total=Math.round(r.ch.reduce((a,b)=>a+b,0)/4); }); return rows.sort((a,b)=>b.total-a.total); }
const core={aiP,K,REALMS,WEEKS,DAYS,LV_PER_DAY,NAS_ROUNDS,AIS,init,makeAI,aiTechs,aiDay,applyLoot,breakthrough,scores};
if(typeof module!=='undefined'){ module.exports=core; return; }

// ---------------- browser UI ----------------
let msg='', tab='hub', mode='hub';
const TUT={hub:['🏯 <b>The Hub</b>','Each realm is one week: 3 solo weekdays, then a co-op weekend boss.','Tap the green button to play today’s activity. Reach 100 XP, then Meditate to gain levels.','Character tab: slot 3 techniques (Attack is always 4th) and equip loot. Shop: potions and manuals.','Your 3 rivals progress too — watch their cards.'],
 world:['🌿 <b>Overworld</b>','Walk with the D-pad (hold). Tall grass hides wild beasts: each win is 40 XP.','A: talk / pray at the ⛩️ shrine to heal. B: technique loadout.','Scout Ren is a tougher rival trainer with a better drop.'],
 htl:['🛡️ <b>Hold the Line</b>','The Collective marches from the right toward your Gate.','Spend Credit on units; hold ◀ ▶ to move your hero, Burst and Rally are your techniques.','Clear waves 1–2 for 50 XP each. Your gear boosts your hero.'],
 sect:['⚔️ <b>Sect Conquest</b>','Pick a territory; 3 wins conquers it. Each of the first 2 wins today is 50 XP.','Choose a command for each squad member, then the round plays out. Auto repeats your last orders.','Wins drop gold, gear and treasures.'],
 boss:['⚡ <b>Weekend Boss</b>','Co-op: you and your 3 rivals vs the Thunder Ape Monarch on a grid.','Move, then act. Watch the boss’s telegraphed attacks and step out of them.','Win to break through to the next realm. Need/Greed on the chest — what you win is yours.'],
 nas:['🗺️ <b>Nascent Finale</b>','Each hex shows its troops. Tap your hex, then an adjacent enemy to attack.','End Attacks to move troops freely between your connected hexes, then End Turn.','Most territories after '+NAS_ROUNDS+' rounds wins Conquest. “Auto turn” plays a turn for you.']};
function tut(k,force){ const d=D(); if(!d) return; d.tut=d.tut||{}; if(!force&&d.tut[k]) return; const T=TUT[k]; if(!T) return; const o=document.createElement('div'); o.id='dtut'; o.innerHTML=`<div class=dtc><div style="font-size:19px;margin-bottom:6px">${T[0]}</div><ul>${T.slice(1).map(x=>`<li>${x}</li>`).join('')}</ul><button class=dgo id=dtok>Got it</button></div>`; const old=$('#dtut'); if(old) old.remove(); document.body.appendChild(o); o.querySelector('#dtok').addEventListener('click',()=>{ o.remove(); d.tut[k]=1; save(); }); }
function chrome(){ if(!st.demo){ document.body.classList.remove('demo'); return; } document.body.classList.add('demo');
 if(!$('#dq')){ const b=document.createElement('button'); b.id='dq'; b.textContent='?'; b.addEventListener('click',()=>tut(mode,1)); document.body.appendChild(b); }
 const a=$('#app'); if(a&&['world','htl','sect'].includes(mode)&&!$('#dbar')){ const d=D(), W=WEEKS[d.week]||{}; a.insertAdjacentHTML('afterbegin',`<div id=dbar><b>${W.label||''}</b><span>${DAYS[d.d]} · Week ${d.week+1}/4 · ${st.c.realm} ${st.c.level} · XP ${Math.min(st.c.xpToday,DBG.XP_GOAL)}/${DBG.XP_GOAL}</span></div>`); }
 document.querySelectorAll('button').forEach(b=>{ if(/^\s*Back to day\s*$/.test(b.textContent)) b.textContent='Back to hub'; }); }
if(typeof MutationObserver!=='undefined') new MutationObserver(()=>{ try{ if(st&&st.demo) chrome(); }catch(e){} }).observe(document.documentElement,{childList:true,subtree:true});
// active play time: counts only while visible and with input in the last 2 min
let lastIn=Date.now(); ['pointerdown','keydown'].forEach(e=>addEventListener(e,()=>lastIn=Date.now(),true));
setInterval(()=>{ try{ if(st&&st.demo&&!st.demo.done&&!document.hidden&&Date.now()-lastIn<120000){ st.demo.active=(st.demo.active||0)+5000; } }catch(e){} },5000);
const gearB=()=>(st.qi&&st.qi.gear?st.qi.gear.bonus:0)+((st.qi&&st.qi.gearT)||0);
const myFights=()=>((st.qi&&st.qi.log)||[]).length+(st.waves||[]).length, myWins=()=>((st.qi&&st.qi.log)||[]).filter(r=>r.result==='win').length+(st.waves||[]).filter(r=>r.result==='clear').length;
const P=()=>FF.ROLE2PATH[st.c.role]||'Body', D=()=>st.demo;
function enter(){ SKEY='dbg_demo1'; st=JSON.parse(localStorage.getItem(SKEY)||'null')||{c:null,rounds:[]}; if(!st.demo) st.demo=init(); globalThis.DEMO_K=K; save(); history.replaceState(null,'','#demo'); st.c?day():create(); }
function exit(){ globalThis.DEMO_K=1; history.replaceState(null,'',location.pathname); location.reload(); }
function createHead(){ return `<div class=tip style="border:2px solid #fc6"><b>Demo Run</b> — create your cultivator. Three AI cultivators (${Object.values(AIS).join(', ')}) will take the other paths and travel with you. Enemies are tuned easier (×${K}). <button class=s onclick="Demo.exit()">Leave demo</button></div>`; }
const bar=(v,m,c)=>`<span style="display:inline-block;width:110px;height:9px;background:#333;border-radius:5px;vertical-align:middle"><i style="display:block;height:9px;width:${Math.min(100,100*v/m)}%;background:${c};border-radius:5px"></i></span>`;
function css(){ if($('#dmcss')) return; const s=document.createElement('style'); s.id='dmcss'; s.textContent=`.dh{background:linear-gradient(135deg,#1d2433,#2a1f33);border-radius:12px;padding:12px;margin:6px 0;color:#eee}.dh h2{margin:0 0 4px}.dcal{display:flex;gap:4px;margin:8px 0}.dcal span{flex:1;text-align:center;padding:6px 0;border-radius:6px;background:#2b3142;font-size:12px}.dcal .on{background:#fc6;color:#222;font-weight:700}.dcal .dn{background:#3c5;color:#122}
.dtabs{display:flex;gap:4px}.dtabs button{flex:1}.dtabs .on{background:#fc6;color:#222}.dgo{width:100%;font-size:18px;padding:14px;background:#2a7;color:#fff;border-radius:10px;margin:6px 0}.dai{display:flex;gap:6px}.dai div{flex:1;background:#222838;border-radius:8px;padding:6px;font-size:12px;color:#ddd}body.demo{font-family:system-ui,-apple-system,sans-serif;max-width:430px;overflow-x:hidden}body.demo button{min-height:44px;border-radius:10px;font-weight:600}body.demo button:not(.s):not(.dp):not(.fc):not(.wbt):not(.npill){background:#2a7;color:#fff}body.demo .tip{background:#1d2433;border-radius:10px;padding:8px 10px;color:#dde}body.demo .big{font-size:19px}body.demo canvas{max-width:100%}body.demo *{max-width:100%;box-sizing:border-box}
body.demo #nnew,body.demo button[onclick="ageUp()"],body.demo button[onclick^="exportWaves"],body.demo button[onclick^="qiExport"],body.demo details{display:none!important}
#dbar{padding-right:56px!important;display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px;background:linear-gradient(135deg,#1d2433,#2a1f33);border-radius:10px;padding:8px 10px;margin:0 0 6px;font-size:13px;color:#eee}#dbar b{color:#fc6;font-size:15px}
#dq{position:fixed;top:8px;right:8px;z-index:100000;width:44px;height:44px;border-radius:22px!important;background:#fc6!important;color:#222!important;font-size:22px;padding:0;margin:0;box-shadow:0 2px 8px #0008}
#dtut{position:fixed;inset:0;background:#000b;z-index:100001;display:flex;align-items:center;justify-content:center;padding:16px}.dtc{background:linear-gradient(135deg,#1d2433,#2a1f33);border:2px solid #fc6;border-radius:14px;padding:16px;color:#eee;max-width:380px;font-size:15px;line-height:1.4}.dtc ul{padding-left:18px;margin:6px 0 10px}.dtc li{margin:5px 0}
.dsl{display:flex;justify-content:space-between;align-items:center;background:#222838;border-radius:8px;padding:6px 8px;margin:3px 0;color:#eee}`; document.head.appendChild(s); }
function hub(){ css(); const c=st.c, d=D(); if(!d.ai){ d.ai=makeAI(P()); c.realmIdx=0; c.realm=REALMS[0]; c.level=1; save(); } qiState(); globalThis.DEMO_K=K;
 if(!d.snap&&d.week<3){ d.snap={attr:Object.assign({},c.attr),techs:Object.keys(st.qi.techs),gear:st.qi.gear&&st.qi.gear.n,inv:st.qi.inv.length,gold:st.qi.gold,news:d.news.length,realm:c.realm,level:c.level}; save(); }
 if(d.done) return endScreen(); if(d.week>=3) return finaleHub();
 const W=WEEKS[d.week], wk=d.d===3, goal=c.xpToday>=DBG.XP_GOAL;
 const head=`<div class=dh><div class=row style="justify-content:space-between"><h2>${c.name} · ${c.realm} ${c.level}</h2><button class=s onclick="Demo.exit()">Exit demo</button></div>
 <div>Week ${d.week+1}/4 · <b>${W.realm}</b> · ${wk?'Weekend (co-op)':'Weekday (solo)'} · ${st.qi.gold} gold</div>
 <div class=dcal>${DAYS.map((x,i)=>`<span class="${i===d.d?'on':i<d.d?'dn':''}">${x}${i===3?' ⚡':''}</span>`).join('')}<span>${d.week<2?'→ '+WEEKS[d.week+1].realm:'→ Nascent'}</span></div>
 ${wk?'':`XP today ${bar(c.xpToday,DBG.XP_GOAL,'#5c8')} ${c.xpToday}/${DBG.XP_GOAL} · Level ${bar(c.level,10,'#fc6')} ${c.level}/10 (cap)`}</div>
 <div class=dtabs>${['hub','sheet','shop'].map(t=>`<button class="s ${tab===t?'on':''}" onclick="Demo.tab('${t}')">${{hub:'Today',sheet:'Character',shop:'Shop'}[t]}</button>`).join('')}</div>`;
 let body='';
 if(tab==='sheet') body=sheet(); else if(tab==='shop') body=shop(); else {
  if(wk) body=`<div class=tip>⚡ <b>Weekend boss: Thunder Ape Monarch.</b> ${d.ai.map(a=>a.name).join(', ')} fight beside you at their real levels and techniques. Win to break through to <b>${d.week<2?WEEKS[d.week+1].realm:'Nascent'}</b>. Chest loot you win is saved to your character.${d.bossTries?` Attempts: ${d.bossTries}.`:''}</div>
   <button class=dgo onclick="Demo.boss()">⚡ Fight the Weekend Boss</button>${d.bossTries>=2?`<button class=s onclick="Demo.assist()">Break through anyway (assist)</button>`:''}`;
  else body=`<div class=tip><b>${DAYS[d.d]}: ${W.label}.</b> ${W.hint} Reach ${DBG.XP_GOAL} XP, then Meditate to gain ${LV_PER_DAY} levels (demo pace) and end the day.</div>
   <button class=dgo onclick="Demo.go()">▶ ${goal?'Keep playing: ':''}${W.label}</button>
   <button class=dgo style="background:${goal?'#86c':'#444'}" ${goal?'':'disabled'} onclick="Demo.meditate()">🧘 Meditate &amp; end day</button>`;
  body+=`<h3>Rival cultivators</h3><div class=dai>${d.ai.map(a=>`<div>${FF.PATHS[a.path].em} <b>${a.name}</b> (${a.path})<br>${REALMS[a.realmIdx]} ${a.level}<br>${a.wins} wins · ${a.gold}g${a.gear?` · gear +${Math.round(a.gear*100)}%`:''}</div>`).join('')}</div>
   <div class=log>${[msg].concat(d.news.slice(-8).reverse()).filter(Boolean).join('\n')}</div>`; }
 view(head+body); mode='hub'; chrome(); tut('hub'); }
function sheet(){ const c=st.c, q=st.qi, me=P(), ts=Object.keys(q.techs);
 return `<div class=dh><b>${c.name}</b> · ${c.role} (${me} path) · ${c.realm} ${c.level}<br>Str ${c.attr.Str} · Spd ${c.attr.Spd} · Tough ${c.attr.Tough} · Aff ${c.attr.Aff} · Move ${DBG.movement(c)} · Init ${DBG.initiative(c)}<br>Gear: ${q.gear?`${q.gear.n} (+${Math.round(q.gear.bonus*100)}% HP/attack)`:'none'}</div>
 <h3>Techniques — loadout ${q.slots.length}/3 + Attack</h3>${ts.map(t=>{ const on=q.slots.includes(t), T=FF.TECH[t]; return `<div class=dsl><span>${on?'🟨':'⬜'} <b>${t}</b> <small>${T.d||''} · Qi ${T.lv}+${q.techs[t].starter?' · permanent':''}</small></span><button class=s onclick="Demo.slot('${t}')">${on?'Unslot':'Slot'}</button></div>`; }).join('')}
 <h3>Bag</h3>${Object.keys(FF.ITEMS).map(k=>k+' ×'+(q.bag[k]||0)).join(' · ')}
 <h3>Loot &amp; inventory</h3>${q.inv.length?q.inv.map((it,i)=>`<div class=dsl><span>${it.n} <small>${it.bonus?'+'+Math.round(it.bonus*100)+'% · ':''}${it.val}g</small></span><span>${it.k==='gear'?`<button class=s onclick="Demo.equip(${i})">Equip</button>`:''}<button class=s onclick="Demo.sell(${i})">Sell</button></span></div>`).join(''):'<div>Empty</div>'}<div class=tip>${msg}</div>`; }
function shop(){ const q=st.qi, me=P(), c=st.c;
 return `<div class=dh>${q.gold} gold</div><h3>Supplies</h3>${Object.keys(FF.ITEMS).map(k=>`<div class=dsl><span>${k} <small>×${q.bag[k]||0}</small></span><button class=s onclick="Demo.buy('${k}')">${FF.ITEMS[k].cost}g</button></div>`).join('')}
 <h3>Technique manuals (${me})</h3>${FF.shopTechs(me).map(t=>`<div class=dsl><span>${t} <small>Qi ${FF.TECH[t].lv}+</small></span>${q.techs[t]?'✓ known':`<button class=s ${c.level<FF.TECH[t].lv&&!c.realmIdx?'disabled':''} onclick="Demo.manual('${t}')">${FF.MANUAL_COST}g</button>`}</div>`).join('')}<div class=tip>${msg}</div>`; }
const re=m=>{ msg=m||''; save(); hub(); };
const api={K,init,createHead,enter,exit,hub,
 tab:t=>{ tab=t; msg=''; hub(); },
 slot:t=>{ const q=st.qi, i=q.slots.indexOf(t); if(i>=0) q.slots.splice(i,1); else if(q.slots.length>=3) return re('Loadout full (3). Unslot one first.'); else q.slots.push(t); re(); },
 equip:i=>{ const q=st.qi, it=q.inv.splice(i,1)[0]; if(q.gear) q.inv.push(q.gear); q.gear=it; re('Equipped '+it.n+'.'); },
 sell:i=>{ const q=st.qi, it=q.inv.splice(i,1)[0]; q.gold+=it.val; re('Sold '+it.n+' for '+it.val+'g.'); },
 buy:k=>{ const q=st.qi, c=FF.ITEMS[k].cost; if(q.gold<c) return re('Need '+c+' gold.'); q.gold-=c; q.bag[k]=(q.bag[k]||0)+1; re('Bought '+k+'.'); },
 manual:t=>{ const q=st.qi; if(st.c.realmIdx===0&&st.c.level<FF.TECH[t].lv) return re(t+' needs Qi '+FF.TECH[t].lv+'.'); if(q.gold<FF.MANUAL_COST) return re('Need '+FF.MANUAL_COST+' gold.'); q.gold-=FF.MANUAL_COST; FF.learn(q,P(),t); re('Learned '+t+(q.slots.includes(t)?' (slotted).':'. Slot it on the Character tab.')); },
 go:()=>{ msg=''; const m=WEEKS[D().week].mode; mode=m; if(m==='world') worldOpen(); else if(m==='htl') htl(); else qiHome(); chrome(); tut(m); },
 htlGear:hg=>{ const m=1+gearB(); if(m!==1){ hg.hero.hp*=m; hg.hero.mx*=m; hg.hero.dpt*=m; } },
 meditate:()=>{ const c=st.c, d=D(); if(c.xpToday<DBG.XP_GOAL) return; const from=c.level; for(let i=0;i<LV_PER_DAY&&c.level<10;i++) DBG.levelUp(c); c.day++; c.xpToday=0; c.medToday=false;
  const tf=myFights(), n=tf-(d.fLast||0); d.fLast=tf; const ai=aiDay(d,null,n); d.news.push(`${DAYS[d.d]}: you meditated, Lv ${from} → ${c.level}.`, ...ai); d.d++; if(st.world) st.world.pk=[1,1]; re(c.level>=10?'Level 10 reached — the weekend boss decides your breakthrough.':''); },
 boss:()=>{ const d=D(), al={}; mode='boss'; const snap=d.snap||{attr:Object.assign({},st.c.attr),techs:Object.keys(st.qi.techs),gear:st.qi.gear&&st.qi.gear.n,inv:st.qi.inv.length,gold:st.qi.gold,news:d.news.length,realm:st.c.realm,level:st.c.level}; d.ai.forEach(a=>al[a.path]={name:a.name,techs:aiTechs(a),gear:a.gear}); d.bossTries++; save(); let res=null;
  wkStart({allies:al,gear:(st.qi.gear?st.qi.gear.bonus:0)+(st.qi.gearT||0),onEnd:r=>{ res=r; }, onLoot:it=>{ const t=applyLoot(st.c,st.qi,it,P()); d.news.push('Boss loot: '+t); save(); }});
  WKUI._demoEnd=()=>res; const back=()=>{ if(res&&res.result==='win'){ d.boss.push({week:d.week,rounds:res.rounds,mvp:res.mvp}); d.ai.forEach(a=>{ if(Math.random()<.6){ a.gear=Math.min(.3,a.gear+.06); a.loot.push('boss gear'); } if(a.name===res.mvp) a.bossMvp++; }); if(res.meMvp) d.meMvp=(d.meMvp||0)+1; st.qi.gold+=175; const from=st.c.realm; breakthrough(st.c,d); d.news.push(`Weekend: Monarch defeated in ${res.rounds} rounds. MVP ${res.mvp}. Breakthrough ${from} → ${st.c.realm}!`); d.snap=null; save(); summary(snap,res); } else re(res?'The Monarch survived. Try again (Sunday attempt).':''); };
  waitBack(back); setTimeout(()=>tut('boss'),600); },
 assist:()=>{ const d=D(), from=st.c.realm; breakthrough(st.c,d); d.news.push(`Assist breakthrough ${from} → ${st.c.realm}.`); re(); },
 nas:()=>{ const d=D(), me=P(), others=['Body','Force','Light','Mass'].filter(p=>p!==me); globalThis.DEMO_K=K;
  mode='nas'; nasStart({names:['You'].concat(others.map(p=>AIS[p])).concat(['Ruin']),maxRound:NAS_ROUNDS,bonus:2}); const nv=$('#nasv'); if(nv&&!$('#dauto')){ nv.insertAdjacentHTML('afterend','<button class=dgo id=dauto style="background:#86c">🤖 Auto turn</button>'); $('#dauto').addEventListener('click',()=>{ if(!NAS2.autoTurn()) msg='Wait for your turn.'; }); } chrome(); setTimeout(()=>tut('nas'),300); },
 finish:()=>{ const d=D(), G=st.nas2; const me=P(), others=['Body','Force','Light','Mass'].filter(p=>p!==me); others.forEach((p,i)=>{ const a=d.ai.find(a=>a.path===p); a.nas=G.hex.filter(h=>h.o===i+1).length; }); d.myNas=G.hex.filter(h=>h.o===0).length; d.done=true; d.t1=Date.now(); re(); },
 summaryCont:()=>{ msg='Breakthrough! Welcome to '+st.c.realm+'.'; tab='hub'; hub(); }
};
// weekend UI calls opt.back via close(); demo hooks back through wkStart's back -> day() -> hub. Run the result handler first.
function waitBack(fn){ api._pending=fn; }
const _hub=hub; api.hub=function(){ if(api._pending){ const f=api._pending; api._pending=null; return f(); } return _hub(); };
function summary(s,res){ const c=st.c, q=st.qi, d=D(); const gain=Object.keys(c.attr).map(k=>[k,c.attr[k]-s.attr[k]]).filter(x=>x[1]>0), newT=Object.keys(q.techs).filter(t=>!s.techs.includes(t)), loot=d.news.slice(s.news).filter(x=>x.startsWith('Boss loot')).slice(-4).length?d.news.slice(s.news).filter(x=>x.startsWith('Boss loot')).map(x=>x.slice(11)):[];
 const nx=d.week<3?WEEKS[d.week]:null, avail=FF.shopTechs(P()).filter(t=>!q.techs[t]);
 view(`<div class=dh style="text-align:center"><div style="letter-spacing:3px;color:#fc6">BREAKTHROUGH</div><h2>${s.realm} → ${c.realm}</h2>Monarch defeated in ${res.rounds} rounds · MVP ${res.mvp}</div>
 <div class=tip><b>Stats gained this week</b><br>${gain.length?gain.map(([k,v])=>`${k} +${v}`).join(' · '):'—'} (now Str ${c.attr.Str} · Spd ${c.attr.Spd} · Tough ${c.attr.Tough} · Aff ${c.attr.Aff})</div>
 <div class=tip><b>Loot</b><br>+175 gold (now ${q.gold}g)${loot.length?'<br>'+loot.join('<br>'):'<br>No chest items won this time.'}</div>
 <div class=tip><b>Techniques</b><br>${newT.length?'New: '+newT.join(', '):'No new techniques from the chest.'}${avail.length?`<br>In the Shop: ${avail.join(', ')}`:''}</div>
 <div class=tip><b>What’s next</b><br>${nx?`Week ${d.week+1}: <b>${nx.realm}</b> — ${nx.label}. ${nx.hint}`:'The <b>Nascent Finale</b>: the board game against your 3 rivals.'}</div>
 <button class=dgo onclick="Demo.summaryCont()">Continue</button>`); mode='hub'; chrome(); }
function finaleHub(){ const d=D(), G=st.nas2, over=G&&G.over;
 mode='nas'; view(`<div class=dh><div class=row style="justify-content:space-between"><h2>Nascent Finale</h2><button class=s onclick="Demo.exit()">Exit demo</button></div>${st.c.name} · ${st.c.realm} ${st.c.level} · Week 4/4</div>
 <div class=tip>The final board: you, ${d.ai.map(a=>a.name).join(', ')} and the Ruin in the middle. ${NAS_ROUNDS} rounds; most territories at the end wins the Conquest channel. Your homelands start with +2 troops (demo).</div>
 ${over?`<button class=dgo onclick="Demo.finish()">🏁 See final results</button>`:`<button class=dgo onclick="Demo.nas()">▶ ${G?'Continue':'Start'} the Nascent board</button>`}
 <div class=log>${d.news.slice(-6).reverse().join('\n')}</div>`); }
function endScreen(){ const d=D(), c=st.c, q=st.qi, wins=myWins();
 const me={name:c.name+' (you)',path:P(),me:1,pace:(c.realmIdx||0)*10+c.level,combat:wins+(d.meMvp||0)*3,wealth:q.gold+q.inv.reduce((a,i)=>a+(i.val||0),0)+(q.gear?q.gear.val||0:0),conquest:d.myNas||0};
 const rows=scores(d,me), mins=Math.round((d.active||0)/60000), col=['#fc6','#f64','#5e8','#c8f'];
 view(`<div class=dh style="text-align:center"><div style="letter-spacing:3px;color:#fc6">DEMO COMPLETE</div><h2>${rows[0].me?'You are the Ascendant!':rows[0].name+' ascends first'}</h2>${c.realm} reached · ${mins} min active play · ${d.boss.length} weekend bosses defeated</div>
 <h3>Final ranking — Cultivation Pace score</h3><table style="width:100%;color:#eee;font-size:13px"><tr style="color:#9ab"><td>#</td><td>Cultivator</td><td>Pace</td><td>Combat</td><td>Wealth</td><td>Conquest</td><td>Score</td></tr>
 ${rows.map((r,i)=>`<tr style="${r.me?'background:#3a3320':''}"><td>${i+1}</td><td>${FF.PATHS[r.path].em} ${r.name}${i===0?' 👑':''}</td>${r.ch.map((v,k)=>`<td>${bar(v,100,col[k]).replace('110px','50px')} ${v}</td>`).join('')}<td><b>${r.total}</b></td></tr>`).join('')}</table>
 <div class=tip>MVP: <b>${rows[0].name}</b>. Pace = realm and level reached; Combat = battles won + boss MVPs; Wealth = gold + loot value; Conquest = Nascent territories at the end.</div>
 <button class=dgo onclick="if(confirm('Start a new Demo Run? This clears the demo save only.')){localStorage.removeItem('dbg_demo1');Demo.enter()}">New Demo Run</button><button class=s onclick="Demo.exit()">Exit demo</button>`); }
root.Demo=api;
})(typeof window!=='undefined'?window:globalThis);
