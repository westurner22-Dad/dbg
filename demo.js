// p18-p20 Demo Run: one continuous campaign (Qi -> Foundation -> Core -> Nascent finale -> World Breaker) with 3 AI cultivators.
(function(root){
const GR=root.GEAR||(typeof require!=='undefined'?require('./gear.js'):null);
const K=0.7, REALMS=['Qi Gathering','Foundation','Core','Nascent'];
const WEEKS=[{realm:'Qi Gathering',mode:'world',label:'Explore the overworld',hint:'Win wild-beast battles (40 XP each) or beat Scout Ren.'},
 {realm:'Foundation',mode:'htl',label:'Hold the Line',hint:'Clear waves 1–2 (50 XP each).'},
 {realm:'Core',mode:'sect',label:'Sect Conquest',hint:'Win 2 squad battles (50 XP each).'}];
const DAYS=['Mon','Tue','Wed','Sat'], LV_PER_DAY=3, NAS_ROUNDS=20;
const AIS={Body:'Tiezhu',Force:'Shanmei',Light:'Lumen',Mass:'Zhong'};
const GEARQ={Rare:1,Epic:1,Legendary:1};
function init(){ return {v:2,week:0,d:0,ai:null,boss:[],bossTries:0,done:false,t0:Date.now(),news:[],eq:{},trs:[],prog:{},hints:[],cookies:{},look:{hair:'#2a1a10'},trainDay:-1}; }
function makeAI(me,rng){ return ['Body','Force','Light','Mass'].filter(p=>p!==me).map(p=>({name:AIS[p],path:p,level:1,realmIdx:0,gold:0,wins:0,loot:[],eq:GR.aiKit(0,rng,2),bossMvp:0,nas:0})); }
const aiGX=a=>GR.engine(GR.totals(a.eq||{},a.trs||[]));
const eqVal=eq=>GR.SLOTS.reduce((s,k)=>s+((eq&&eq[k]&&eq[k].val)||0),0);
function aiTechs(a){ const T=root.FF.TECH; return root.FF.KIT[a.path].filter(t=>T[t]&&T[t].lv<=a.level&&t!=='Focus Breathing').slice(-3); }
const aiP=(a,k)=>Math.max(.4,Math.min(.97,.8+.015*a.level-.6*((k||K)-.7)));
function aiDay(D,rng,n,k){ rng=rng||Math.random; n=Math.max(2,Math.min(8,n||3)); return D.ai.map(a=>{ let w=0; for(let i=0;i<n;i++) if(rng()<aiP(a,k)) w++; const g=a.level<10?(rng()<.8?LV_PER_DAY:LV_PER_DAY-1):0; a.level=Math.min(10,a.level+g);
 const gold=(14*w+Math.floor(rng()*15))*(1+a.realmIdx); a.wins+=w; a.gold+=gold; let got='';
 if(rng()<.45){ const it=GR.rand(GR.rollQ(rng,.05*a.realmIdx),a.realmIdx,rng), cur=a.eq[it.slot]; if(!cur||cur.val<it.val){ const inv=[]; GR.equip(a.eq,inv,it); got=`, found ${it.n}`; a.loot.push(it.n); } else a.gold+=it.val; }
 return `${a.name}: ${w} wins, +${gold}g`+(g?`, Lv ${a.level}`:'')+got; }); }
// apply a won weekend chest item: Rare+ gear -> slotted item; manual -> learn / material; anything else -> stat treasure
function applyLoot(c,q,D,it,path,rng){ if(!it) return ''; const lvl=c.realmIdx||0;
 if(GEARQ[it.q]){ const g=GR.rand(it.q,lvl,rng); g.n=it.n.replace(/^(Rare|Epic|Legendary) /,'')===it.n?g.n:g.n; const cur=D.eq[g.slot]; if(!cur||cur.val<g.val){ GR.equip(D.eq,q.inv,g); return `Equipped ${g.n} (${GR.fmt(g.st)}).`; } q.inv.push(g); return `${g.n} added to your bag.`; }
 if(it.q==='Manual'){ const t=it.n.replace('Manual: ',''); if(root.FF.KIT[path].includes(t)&&!q.techs[t]){ root.FF.learn(q,path,t); return `Learned ${t}!`; } q.inv.push({k:'material',n:it.n,val:it.v}); return `${it.n} (other path) added to Materials; sell it for ${it.v}g.`; }
 const f=root.DBG?root.DBG.ROLES[c.role].focus:'Str'; c.attr[f]+=2; c.attr.Aff+=1; const t=GR.treasure(it.n,f); D.trs.push(t); D.popT=t; return `Refined ${it.n}: ${t.gave}.`; }
function breakthrough(c,D,rng){ c.realmIdx=(c.realmIdx||0)+1; c.realm=REALMS[c.realmIdx]; c.level=1; D.ai.forEach(a=>{ a.realmIdx++; a.level=1; for(let i=0;i<2;i++){ const it=GR.rand(GR.rollQ(rng,.1*a.realmIdx),a.realmIdx,rng), cur=a.eq[it.slot]; if(!cur||cur.val<it.val) GR.equip(a.eq,[],it); } }); D.week++; D.d=0; D.bossTries=0; }
function scores(D,me){ // 4-channel score: Pace, Combat, Wealth, Conquest -> 0-100 each relative to best
 const rows=[me].concat(D.ai.map(a=>({name:a.name,path:a.path,pace:a.realmIdx*10+a.level,combat:a.wins+a.bossMvp*3,wealth:a.gold+eqVal(a.eq),conquest:a.nas})));
 const ch=['pace','combat','wealth','conquest'], mx={}; ch.forEach(k=>mx[k]=Math.max(1,...rows.map(r=>r[k])));
 rows.forEach(r=>{ r.ch=ch.map(k=>Math.round(100*r[k]/mx[k])); r.total=Math.round(r.ch.reduce((a,b)=>a+b,0)/4); }); rows.sort((a,b)=>b.total-a.total);
 const CAT=[['wealth','Golden Sovereign'],['combat',"Monster's Lament"],['pace','The Perfect Cultivator']], used={};
 rows.forEach((r,i)=>{ if(i<3){ r.title=["Sovereign of This Age","Heaven's Chosen","First Among Immortals"][i]; return; } const best=CAT.filter(([k])=>r[k]===mx[k]&&!used[k])[0]; if(best){ used[best[0]]=1; r.title=best[1]; } else r.title='Steadfast Companion'; });
 return rows; }
const core={aiP,K,REALMS,WEEKS,DAYS,LV_PER_DAY,NAS_ROUNDS,AIS,init,makeAI,aiGX,aiTechs,aiDay,applyLoot,breakthrough,scores,eqVal};
if(typeof module!=='undefined'){ module.exports=core; return; }

// ---------------- browser UI ----------------
let msg='', tab='hub', mode='hub', btab='gear', selI=-1, selSlot=null, tsel=[];
const TUT={hub:['🏯 <b>The Hub</b>','Each realm is one week: 3 solo weekdays, then a co-op weekend boss.','Play today’s activity to reach 100 XP, then Meditate: pick what to train (a discovery roll), gain levels and end the day.','Earlier realms’ modes stay open for loot and gold — only the current realm’s mode gives XP.','Character tab: your paperdoll, bag and techniques. Shop: potions and manuals.'],
 world:['🌿 <b>Overworld</b>','Walk with the D-pad (hold). Tall grass hides wild beasts: each win is 40 XP.','A: talk / pray at the ⛩️ shrine to heal. B: technique loadout.','The 🧙 Technique Master by the shrine sells combo hints. Some townsfolk have stories… and there may be cookies hidden around town.'],
 htl:['🛡️ <b>Hold the Line</b>','The Collective marches from the right toward your Gate.','Spend Credit on units; hold ◀ ▶ to move your hero, Burst and Rally are your techniques. Healers heal you first.','Clear waves 1–2 for 50 XP each. Your gear boosts your hero.'],
 sect:['⚔️ <b>Sect Conquest</b>','Pick a territory; 3 wins conquers it. Each of the first 2 wins today is 50 XP.','Choose a command for each squad member, then the round plays out. Auto repeats your last orders.','Wins drop gold, slotted gear and treasures.'],
 boss:['⚡ <b>Weekend Boss</b>','Co-op: you and your 3 rivals vs the boss on a grid.','Move, then act. Watch the boss’s telegraphed attacks and step out of them.','Win to break through to the next realm. Need/Greed on the chest — what you win is yours.'],
 nas:['🗺️ <b>Nascent Finale</b>','Each hex shows its troops. Tap your hex, then an adjacent enemy to attack.','End Attacks to move troops between your connected hexes, then End Turn.','The board ends when the last gray Ruin hex is taken (or the Ruin collapses after round 20). Then all four of you face the World Breaker.']};
function tut(k,force){ const d=D(); if(!d) return; d.tut=d.tut||{}; if(!force&&d.tut[k]) return; const T=TUT[k]; if(!T) return; pop(`<div style="font-size:19px;margin-bottom:6px">${T[0]}</div><ul>${T.slice(1).map(x=>`<li>${x}</li>`).join('')}</ul>`,()=>{ d.tut[k]=1; save(); }); }
function pop(html,done){ const o=document.createElement('div'); o.id='dtut'; o.innerHTML=`<div class=dtc>${html}<button class=dgo id=dtok>Got it</button></div>`; const old=$('#dtut'); if(old) old.remove(); document.body.appendChild(o); o.querySelector('#dtok').addEventListener('click',()=>{ o.remove(); done&&done(); }); }
function toast(t){ const o=document.createElement('div'); o.className='dtoast'; o.textContent=t; document.body.appendChild(o); setTimeout(()=>o.remove(),1800); }
function chrome(){ if(!st.demo){ document.body.classList.remove('demo'); return; } document.body.classList.add('demo');
 if(!$('#dq')){ const b=document.createElement('button'); b.id='dq'; b.textContent='?'; b.addEventListener('click',()=>tut(mode,1)); document.body.appendChild(b); }
 const a=$('#app'); if(a&&['world','htl','sect'].includes(mode)){ const d=D(), W=WEEKS[d.week]||{}, live=d.playing===W.mode, txt=`${DAYS[d.d]} · Week ${d.week+1}/4 · ${st.c.realm} ${st.c.level} · `+(live?`XP ${Math.min(st.c.xpToday,DBG.XP_GOAL)}/${DBG.XP_GOAL}`:'loot & gold only'), b=$('#dbar');
  if(!b) a.insertAdjacentHTML('afterbegin',`<div id=dbar><b>${{world:'Overworld',htl:'Hold the Line',sect:'Sect Conquest'}[mode]}</b><span id=dbxp>${txt}</span></div>`); else if($('#dbxp')&&$('#dbxp').textContent!==txt) $('#dbxp').textContent=txt; }
 document.querySelectorAll('button').forEach(b=>{ if(/^\s*Back to day\s*$/.test(b.textContent)) b.textContent='Back to hub'; }); }
let mo=null; if(typeof MutationObserver!=='undefined'){ mo=new MutationObserver(()=>{ try{ if(st&&st.demo) chrome(); }catch(e){} }); mo.observe(document.documentElement,{childList:true,subtree:true}); }
setInterval(()=>{ try{ if(st&&st.demo&&$('#dbar')) chrome(); }catch(e){} },700); // live header XP
let lastIn=Date.now(); ['pointerdown','keydown'].forEach(e=>addEventListener(e,()=>lastIn=Date.now(),true));
setInterval(()=>{ try{ if(st&&st.demo&&!st.demo.done&&!document.hidden&&Date.now()-lastIn<120000){ st.demo.active=(st.demo.active||0)+5000; } }catch(e){} },5000);
const P=()=>FF.ROLE2PATH[st.c.role]||'Body', D=()=>st.demo;
const myFights=()=>((st.qi&&st.qi.log)||[]).length+(st.waves||[]).length, myWins=()=>((st.qi&&st.qi.log)||[]).filter(r=>r.result==='win').length+(st.waves||[]).filter(r=>r.result==='clear').length;
function fixGear(){ const d=D(), q=st.qi; if(!d||!q) return; d.eq=d.eq||{}; d.trs=d.trs||[]; const lvl=st.c.realmIdx||0;
 if(q.gear){ const g=GR.norm(q.gear,lvl); q.gear=null; if(!d.eq[g.slot]) GR.equip(d.eq,q.inv,g); else q.inv.push(g); }
 q.inv=q.inv.map(it=>{ if(it.k==='gear'&&!it.slot){ const g=GR.norm(it,lvl); if(!d.eq[g.slot]){ GR.equip(d.eq,[],g); d.news.push('Auto-equipped '+g.n+'.'); return null; } return g; }
  if(it.k==='treasure'&&!it.st&&!/^Manual/.test(it.n)){ const f=DBG.ROLES[st.c.role].focus; st.c.attr[f]+=2; st.c.attr.Aff+=1; const t=GR.treasure(it.n,f); d.trs.push(t); d.popT=t; return null; }
  if(it.k==='treasure'&&/^Manual/.test(it.n)) return Object.assign(it,{k:'material'}); return it; }).filter(Boolean); }
const totals=()=>GR.totals(D().eq,D().trs);
const gx=()=>{ fixGear(); return GR.engine(totals()); };
const gearLook=()=>{ const e=(st.demo&&st.demo.eq)||{}, o={}; GR.SLOTS.forEach(s=>{ if(e[s]) o[s]=e[s].q; }); return o; };
const meImg=()=>Spr.url({path:P(),hair:D().look.hair,gear:gearLook()});
function enter(){ SKEY='dbg_demo2'; st=JSON.parse(localStorage.getItem(SKEY)||'null')||{c:null,rounds:[]}; if(!st.demo) st.demo=init(); globalThis.DEMO_K=K; save(); history.replaceState(null,'','#demo'); st.c?day():create(); }
function exit(){ globalThis.DEMO_K=1; history.replaceState(null,'',location.pathname); location.reload(); }
function createHead(){ return `<div class=tip style="border:2px solid #fc6"><b>Demo Run</b> — create your cultivator. Three AI cultivators (${Object.values(AIS).join(', ')}) will take the other paths and travel with you. Enemies are tuned easier (×${K}). <button class=s onclick="Demo.exit()">Leave demo</button></div>`; }
const bar=(v,m,c)=>`<span style="display:inline-block;width:110px;height:9px;background:#333;border-radius:5px;vertical-align:middle"><i style="display:block;height:9px;width:${Math.min(100,100*v/m)}%;background:${c};border-radius:5px"></i></span>`;
function css(){ if($('#dmcss')) return; const s=document.createElement('style'); s.id='dmcss'; s.textContent=`.dh{background:linear-gradient(135deg,#1d2433,#2a1f33);border-radius:12px;padding:12px;margin:6px 0;color:#eee}.dh h2{margin:0 0 4px}.dcal{display:flex;gap:4px;margin:8px 0}.dcal span{flex:1;text-align:center;padding:6px 0;border-radius:6px;background:#2b3142;font-size:12px}.dcal .on{background:#fc6;color:#222;font-weight:700}.dcal .dn{background:#3c5;color:#122}
.dtabs{display:flex;gap:4px}.dtabs button{flex:1}.dtabs .on{background:#fc6!important;color:#222!important}.dgo{width:100%;font-size:18px;padding:14px;background:#2a7;color:#fff;border-radius:10px;margin:6px 0}.dai{display:flex;gap:6px}.dai div{flex:1;background:#222838;border-radius:8px;padding:6px;font-size:12px;color:#ddd}.dai img{height:40px;float:right}
body.demo{font-family:system-ui,-apple-system,sans-serif;max-width:430px;overflow-x:hidden;overflow-y:auto;-webkit-overflow-scrolling:touch}body.demo button{min-height:44px;border-radius:10px;font-weight:600;touch-action:manipulation}body.demo .dp,body.demo .dp *{touch-action:none}body.demo button:not(.s):not(.dp):not(.fc):not(.wbt):not(.npill){background:#2a7;color:#fff}body.demo .tip{background:#1d2433;border-radius:10px;padding:8px 10px;color:#dde}body.demo .big{font-size:19px}body.demo canvas{max-width:100%}body.demo *{max-width:100%;box-sizing:border-box}
body.demo #nnew,body.demo button[onclick="ageUp()"],body.demo button[onclick^="exportWaves"],body.demo button[onclick^="qiExport"],body.demo details{display:none!important}
#dbar{padding-right:56px!important;display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px;background:linear-gradient(135deg,#1d2433,#2a1f33);border-radius:10px;padding:8px 10px;margin:0 0 6px;font-size:13px;color:#eee}#dbar b{color:#fc6;font-size:15px}
#dq{position:fixed;top:8px;right:8px;z-index:100000;width:44px;height:44px;border-radius:22px!important;background:#fc6!important;color:#222!important;font-size:22px;padding:0;margin:0;box-shadow:0 2px 8px #0008}
#dtut{position:fixed;inset:0;background:#000b;z-index:100001;display:flex;align-items:center;justify-content:center;padding:16px}.dtc{background:linear-gradient(135deg,#1d2433,#2a1f33);border:2px solid #fc6;border-radius:14px;padding:16px;color:#eee;max-width:380px;font-size:15px;line-height:1.4;max-height:90vh;overflow:auto}.dtc ul{padding-left:18px;margin:6px 0 10px}.dtc li{margin:5px 0}
.dsl{display:flex;justify-content:space-between;align-items:center;gap:6px;background:#222838;border-radius:8px;padding:6px 8px;margin:3px 0;color:#eee}.dbuy{background:#2a7!important;color:#fff!important;min-width:96px;font-size:15px}.dbuy:disabled{background:#444!important;color:#999!important}
.dtoast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#2a7;color:#fff;padding:10px 16px;border-radius:20px;z-index:100002;font-weight:700;box-shadow:0 3px 10px #000a}
.pd{position:relative;height:330px;background:radial-gradient(circle at 50% 45%,#2c3550,#141826);border-radius:14px;margin:6px 0;border:1px solid #445}.pd .sil{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);height:210px;opacity:.95}
.ps{position:absolute;width:31%;min-height:58px;background:#1a1f2ecc;border:2px solid #556;border-radius:10px;padding:4px 5px;font-size:11px;color:#ddd;text-align:center;line-height:1.2;min-width:0}.ps b{display:block;font-size:10px;color:#9ab;letter-spacing:1px;text-transform:uppercase}.ps.sel{box-shadow:0 0 0 3px #fc6}
.bg{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}.bg div{background:#222838;border:2px solid #445;border-radius:8px;min-height:60px;padding:4px;font-size:10.5px;color:#ddd;text-align:center;line-height:1.15;word-break:break-word}.bg .sel{box-shadow:0 0 0 3px #fc6}
.cmp{background:#1d2433;border:1px solid #fc6;border-radius:10px;padding:8px;margin:6px 0;color:#eee;font-size:13px}.up{color:#6f6}.dn2{color:#f77}.tch{display:inline-block;margin:3px;padding:8px 10px;border-radius:16px;background:#2b3142;color:#eee;border:2px solid #445}.tch.on{background:#fc6;color:#222;border-color:#fc6}`; document.head.appendChild(s); }
const curMode=()=>WEEKS[Math.min(2,D().week)].mode;
function settle(){ const d=D(), c=st.c; if(!d.playing) return; if(d.playing!==curMode()){ c.xpToday=d.xpSnap||0; const g=st.qi.gold-(d.goldSnap||0), idx=WEEKS.findIndex(w=>w.mode===d.playing), extra=g>0?Math.round(g*.5*(d.week-idx)):0; if(extra>0){ st.qi.gold+=extra; msg=`Older-realm run: +${extra} bonus gold (loot scales to your realm). No XP — only ${WEEKS[d.week].label} gives XP now.`; } } d.playing=null; save(); }
function hub(){ css(); const c=st.c, d=D(); if(!d.ai){ d.ai=makeAI(P()); c.realmIdx=0; c.realm=REALMS[0]; c.level=1; save(); } qiState(); globalThis.DEMO_K=K; settle(); fixGear();
 if(d.popT){ const t=d.popT; d.popT=null; save(); setTimeout(()=>pop(`<div style="font-size:19px">💎 <b>Treasure refined</b></div><p><b>${t.n}</b><br>${t.gave}</p><p style="font-size:13px;color:#bcd">Kept in Character → Bag → Treasures. Its bonus counts in every mode.</p>`),200); }
 if(!d.snap&&d.week<3){ d.snap={attr:Object.assign({},c.attr),techs:Object.keys(st.qi.techs),inv:st.qi.inv.length,gold:st.qi.gold,news:d.news.length,realm:c.realm,level:c.level}; save(); }
 if(d.done) return endScreen(); if(d.week>=3) return finaleHub();
 const W=WEEKS[d.week], wk=d.d===3, goal=c.xpToday>=DBG.XP_GOAL;
 const head=`<div class=dh><div class=row style="justify-content:space-between"><h2>${c.name} · ${c.realm} ${c.level}</h2><button class=s onclick="Demo.exit()">Exit demo</button></div>
 <div>Week ${d.week+1}/4 · <b>${W.realm}</b> · ${wk?'Weekend (co-op)':'Weekday (solo)'} · <span id=dgold>${st.qi.gold}</span> gold</div>
 <div class=dcal>${DAYS.map((x,i)=>`<span class="${i===d.d?'on':i<d.d?'dn':''}">${x}${i===3?' ⚡':''}</span>`).join('')}<span>${d.week<2?'→ '+WEEKS[d.week+1].realm:'→ Nascent'}</span></div>
 ${wk?'':`XP today ${bar(c.xpToday,DBG.XP_GOAL,'#5c8')} ${c.xpToday}/${DBG.XP_GOAL} · Level ${bar(c.level,10,'#fc6')} ${c.level}/10 (cap)`}</div>
 <div class=dtabs>${['hub','sheet','shop'].map(t=>`<button class="s ${tab===t?'on':''}" onclick="Demo.tab('${t}')">${{hub:'Today',sheet:'Character',shop:'Shop'}[t]}</button>`).join('')}</div>`;
 let body='';
 if(tab==='sheet') body=sheet(); else if(tab==='shop') body=shop(); else {
  if(wk) body=`<div class=tip>⚡ <b>Weekend boss: Thunder Ape Monarch.</b> ${d.ai.map(a=>a.name).join(', ')} fight beside you at their real levels, techniques and gear. Win to break through to <b>${d.week<2?WEEKS[d.week+1].realm:'Nascent'}</b>.${d.bossTries?` Attempts: ${d.bossTries}.`:''}</div>
   <button class=dgo onclick="Demo.boss()">⚡ Fight the Weekend Boss</button>${d.bossTries>=2?`<button class=s onclick="Demo.assist()">Break through anyway (assist)</button>`:''}`;
  else { body=`<div class=tip><b>${DAYS[d.d]}: ${W.label}.</b> ${W.hint} Reach ${DBG.XP_GOAL} XP, then Meditate: train one discovery, gain ${LV_PER_DAY} levels and end the day.</div>
   ${WEEKS.slice(0,d.week+1).map((w,i)=>i===d.week?`<button class=dgo onclick="Demo.go('${w.mode}')">▶ ${goal?'Keep playing: ':''}${w.label} <small>(daily XP)</small></button>`:`<button class=dgo style="background:#3a5a8a" onclick="Demo.go('${w.mode}')">↺ ${w.label} <small>(loot &amp; gold, scaled to you)</small></button>`).join('')}
   <button class=dgo style="background:${goal?'#86c':'#444'}" ${goal?'':'disabled'} onclick="Demo.train()">🧘 Meditate &amp; end day</button>`; }
  body+=`<h3>Rival cultivators</h3><div class=dai>${d.ai.map(a=>`<div><img src="${Spr.url({path:a.path,gear:Object.fromEntries(Object.entries(a.eq||{}).filter(([k,v])=>v).map(([k,v])=>[k,v.q]))})}"><b>${a.name}</b> (${a.path})<br>${REALMS[a.realmIdx]} ${a.level}<br>${a.wins} wins · ${a.gold}g<br>gear ${GR.SLOTS.filter(s=>a.eq&&a.eq[s]).length}/6</div>`).join('')}</div>
   <div class=log>${[msg].concat(d.news.slice(-8).reverse()).filter(Boolean).join('\n')}</div>`; }
 view(head+body); mode='hub'; chrome(); tut('hub'); }
const RC=GR.RCOL;
function statLine(T){ const o=[]; if(T.hp) o.push(`HP +${Math.round(T.hp*100)}%`); if(T.def) o.push(`Def +${Math.round(T.def*100)}%`); if(T.atk) o.push(`Atk +${Math.round(T.atk*100)}%`); if(T.mat) o.push(`Qi +${Math.round(T.mat*100)}%`); if(T.mp) o.push(`Mana +${Math.round(T.mp*100)}%`); if(T.spd) o.push(`Spd +${T.spd}`); if(T.crit) o.push(`Crit +${Math.round(T.crit*100)}%`); if(T.dodge) o.push(`Dodge +${Math.round(T.dodge*100)}%`); if(T.blk) o.push(`Block +${Math.round(T.blk*100)}%`); if(T.foc) o.push(`Focus +${T.foc}`); if(T.mv) o.push(`Move +${T.mv}`); return o.join(' · ')||'—'; }
function cmp(it){ const d=D(), cur=[d.eq[it.slot]].concat(it.two&&d.eq.off?[d.eq.off]:[]).concat(it.slot==='off'&&d.eq.main&&d.eq.main.two?[d.eq.main]:[]).filter(Boolean), keys=Object.keys(GR.STN), a={}, b={};
 keys.forEach(k=>{ a[k]=(it.st[k]||0); b[k]=cur.reduce((s,g)=>s+(g.st[k]||0),0); });
 const rows=keys.filter(k=>a[k]||b[k]).map(k=>{ const v=a[k]-b[k], f=x=>['spd','foc','mv'].includes(k)?(x>0?'+':'')+x:(x>0?'+':'')+Math.round(x*100)+'%'; return `<div class=dsl style="margin:1px 0"><span>${GR.STN[k]}</span><span>${f(b[k])} → ${f(a[k])} <b class="${v>0?'up':v<0?'dn2':''}">${v?f(v):'='}</b></span></div>`; }).join('');
 return `<div class=cmp><b style="color:${RC[it.q]||'#ccc'}">${it.n}</b> <small>${it.q||''} · ${GR.SLN[it.slot]}${it.two?' · two-handed (uses off-hand)':''} · ${it.val}g</small><br><small>vs equipped: ${cur.length?cur.map(g=>g.n).join(' + '):'nothing'}</small>${rows}</div>`; }
function sheet(){ const c=st.c, q=st.qi, d=D(), me=P(), ts=Object.keys(q.techs), T=totals(), E=d.eq;
 const pos={head:'left:34.5%;top:6px',armor:'left:6px;top:96px',arms:'right:6px;top:96px',main:'left:6px;top:196px',off:'right:6px;top:196px',legs:'left:34.5%;bottom:6px'};
 const slotHtml=s=>{ const g=E[s], blocked=s==='off'&&E.main&&E.main.two; return `<div class="ps ${selSlot===s?'sel':''}" style="${pos[s]};border-color:${g?RC[g.q]:'#556'}" onclick="Demo.pick('${s}')"><b>${GR.SLN[s]}</b>${g?`<span style="color:${RC[g.q]}">${g.n}</span>`:blocked?'<i>(two-handed)</i>':'<i style="color:#778">empty</i>'}</div>`; };
 let det=''; if(selSlot&&E[selSlot]){ const g=E[selSlot]; det=`<div class=cmp><b style="color:${RC[g.q]}">${g.n}</b> <small>${g.q} · ${GR.SLN[g.slot]}${g.two?' · two-handed':''}</small><br>${GR.fmt(g.st)}<br><button class=s onclick="Demo.unequip('${selSlot}')">Unequip</button></div>`; }
 const bag=q.inv.map((it,i)=>({it,i})).filter(({it})=>btab==='gear'?it.k==='gear':btab==='mat'?it.k!=='gear':false);
 let bagHtml=btab==='trs'?(d.trs.length?d.trs.map(t=>`<div class=dsl><span>💎 <b>${t.n}</b><br><small>${t.gave}</small></span></div>`).join(''):'<div class=tip>No treasures yet. Win them from weekend chests and Sect Conquest.</div>')
  :`<div class=bg>${bag.map(({it,i})=>`<div class="${selI===i?'sel':''}" style="border-color:${RC[it.q]||'#445'}" onclick="Demo.sel(${i})"><span style="color:${RC[it.q]||'#ddd'}">${it.n}</span><br><small>${it.k==='gear'?GR.SLN[it.slot]:it.val+'g'}</small></div>`).join('')}${Array(Math.max(0,8-bag.length)).fill('<div style="opacity:.4"></div>').join('')}</div>`+(btab==='mat'?`<div class=tip>Supplies: ${Object.keys(FF.ITEMS).map(k=>k+' ×'+(q.bag[k]||0)).join(' · ')}</div>`:'');
 const it=q.inv[selI]; if(btab!=='trs'&&it&&(btab==='gear')===(it.k==='gear')) bagHtml+=(it.k==='gear'?cmp(it):`<div class=cmp><b>${it.n}</b> · ${it.val}g</div>`)+`<div class=row>${it.k==='gear'?`<button class=dbuy onclick="Demo.equip(${selI})">Equip</button>`:''}<button class=dbuy style="background:#a63!important" onclick="Demo.sell(${selI})">Sell ${it.val}g</button></div>`;
 const hairs=['#2a1a10','#111','#b5651d','#e8c36a','#c33','#ddd','#57c'];
 return `<div class=dh><b>${c.name}</b> · ${c.role} (${me} path) · ${c.realm} ${c.level}<br>Str ${c.attr.Str} · Spd ${c.attr.Spd} · Tough ${c.attr.Tough} · Aff ${c.attr.Aff} · Move ${DBG.movement(c)} · Init ${DBG.initiative(c)}</div>
 <div class=pd><img class=sil src="${meImg()}">${GR.SLOTS.map(slotHtml).join('')}</div>${det}
 <div class=cmp><b>Gear + treasure totals (every mode)</b><br>${statLine(T)}</div>
 <div class=row style="gap:4px;align-items:center">Hair ${hairs.map(h=>`<button class=s style="min-width:30px;min-height:30px;padding:0;background:${h}!important;border:2px solid ${d.look.hair===h?'#fc6':'#333'}" onclick="Demo.hair('${h}')"></button>`).join('')}</div>
 <h3>Bag</h3><div class=dtabs>${[['gear','Equipment'],['trs','Treasures'],['mat','Materials']].map(([k,n])=>`<button class="s ${btab===k?'on':''}" onclick="Demo.btab('${k}')">${n}</button>`).join('')}</div>${bagHtml}
 <h3>Techniques — slot any ${q.slots.length}/3 + Attack</h3><small style="color:#9ab">One permanent list: starters, bought and discovered techniques are never lost.</small>${ts.map(t=>{ const on=q.slots.includes(t), TT=FF.TECH[t]||{}; return `<div class=dsl><span>${on?'🟨':'⬜'} <b>${t}</b> <small>${TT.d||''}${TT.promo?' · ✨ discovered':q.techs[t].starter?' · starter':''}</small></span><button class=s onclick="Demo.slot('${t}')">${on?'Unslot':'Slot'}</button></div>`; }).join('')}
 ${d.hints.length?`<h3>Combo hints</h3>${d.hints.map(h=>`<div class=dsl><span>📜 ${h}</span></div>`).join('')}`:''}<div class=tip>${msg}</div>`; }
function shop(){ const q=st.qi, me=P(), c=st.c;
 return `<div class=dh><span id=dgold>${q.gold}</span> gold</div><h3>Supplies</h3>${Object.keys(FF.ITEMS).map(k=>`<div class=dsl><span>${k} <small>× ${q.bag[k]||0} owned</small></span><button class=dbuy ${q.gold<FF.ITEMS[k].cost?'disabled':''} onclick="Demo.buy('${k}')">Buy · ${FF.ITEMS[k].cost}g</button></div>`).join('')}
 <h3>Technique manuals (${me})</h3>${FF.shopTechs(me).map(t=>`<div class=dsl><span>${t} <small>Qi ${FF.TECH[t].lv}+</small></span>${q.techs[t]?'✓ known':`<button class=dbuy ${(c.level<FF.TECH[t].lv&&!c.realmIdx)||q.gold<FF.MANUAL_COST?'disabled':''} onclick="Demo.manual('${t}')">Buy · ${FF.MANUAL_COST}g</button>`}</div>`).join('')}<div class=tip>${msg||'Tap Buy. Discovered techniques come from Meditation training, not the shop.'}</div><div style="height:90px"></div>`; }
const re=m=>{ msg=m||''; save(); const y=scrollY; hub(); scrollTo(0,y); };
// ---- training (discovery) ----
function train(){ const c=st.c, d=D(), q=st.qi; if(c.xpToday<DBG.XP_GOAL) return; mode='hub';
 const done=d.trainDay===c.day, opts=Object.keys(q.techs).filter(t=>t!=='Focus Breathing').concat(['Focus Breathing','Attack','Block']);
 view(`<div class=dh><h2>🧘 Meditate — what to train?</h2>Pick 1 or 2 techniques to meditate on. <b>Technique + Meditation</b> or <b>Technique + Technique + Meditation</b>. One discovery attempt per day; a real pattern rolls a d20 (+3 demo focus), 11+ is progress. Promotions need 2 (Standard) or 3 (Advanced) successes.</div>
 ${done?'<div class=tip>You already trained today.</div>':`<div>${opts.map(t=>`<span class="tch ${tsel.includes(t)?'on':''}" onclick="Demo.tpick('${t}')">${t}</span>`).join('')}<span class="tch on" style="opacity:.8">+ Meditation</span></div>`}
 <div class=tip>${Object.keys(d.prog).filter(n=>!q.techs[n]&&d.prog[n]).map(n=>{ const r=GR.RECIPES.find(x=>x.n===n); return `🔸 ${n}: ${d.prog[n]}/${r.need}`; }).join('<br>')||'No patterns in progress yet.'}</div>
 ${done?'':`<button class=dgo ${tsel.length?'':'disabled'} onclick="Demo.attempt()">Train ${tsel.length?tsel.join(' + ')+' + Meditation':'(pick 1–2)'}</button>`}
 <button class=dgo style="background:#555" onclick="Demo.meditate()">Just meditate &amp; end day</button><button class=s onclick="Demo.tab('hub')">Back</button>`); }
function attempt(){ const c=st.c, d=D(), q=st.qi; if(d.trainDay===c.day||!tsel.length) return; const inp=tsel.length===1?[tsel[0],'Meditation']:tsel.slice(); d.trainDay=c.day;
 const r=GR.attempt(Object.keys(q.techs),inp,c.realmIdx||0,Math.random,d.prog); let extra='';
 if(r.learned){ q.techs[r.r.n]={lv:1,promo:1}; if(q.slots.length<3) q.slots.push(r.r.n); extra=`<p style="font-size:18px;color:#fc6">✨ New technique: <b>${r.r.n}</b> (${r.r.tier})<br><small>${r.r.T.d}. Added to your permanent list${q.slots.includes(r.r.n)?' and slotted':' — slot it on the Character tab'}.</small></p>`; d.news.push('Discovered '+r.r.n+'!'); }
 d.lastTrain=r.msg; tsel=[]; save(); pop(`<div style="font-size:19px">🧘 ${inp.join(' + ')}</div><p>${r.msg}</p>${extra}`,()=>api.meditate()); }
// ---- overworld NPCs, Technique Master, cookies ----
const NPCX=[{id:'master',x:14,y:6,em:'🧙',dir:'down',line:'Master Yun: Patterns, child. Techniques braid into stronger ones.'},
 {id:'mags',x:20,y:8,em:'👩‍🦰',dir:'left',line:''},{id:'gulpwell',x:3,y:9,em:'🧔',dir:'right',line:''},{id:'cumbeard',x:8,y:12,em:'🧙‍♂️',dir:'down',line:''},{id:'splurt',x:21,y:18,em:'👺',dir:'left',line:''}];
function addNPCs(){ if(!root.World) return; NPCX.forEach(n=>{ if(!World.NPCS.find(m=>m.id===n.id)) World.NPCS.push(n); }); }
const TALK={mags:['Mags: Thimbleby Tankard Recovery, LLC. We find lost tankards. Have you seen one that… blinks?','Mags: Tip from a professional: if the tavern bites, it was never a tavern.'],
 gulpwell:['Gulpwell: I sold that tavern fair and square! …Mostly square.','Gulpwell: Did I know? Knew what? I know nothing. Lovely weather.'],
 cumbeard:['Cumbeard: A beard this grand stores many things. Snacks. Wisdom. A spare spoon.','Cumbeard: The World Breaker took our homeworld’s spoons too. Unforgivable.'],
 splurt:['Splurt: Splurt wipes bar. Splurt wipes beasts too, if they bother cultivator.','Splurt: Somebody hid cookies in town. Splurt not tell. (Look by flowers… and doors… and water.)']};
function stock(){ const q=st.qi, d=D(), ri=st.c.realmIdx||0; return GR.RECIPES.filter(r=>(r.path===P()||(ri>=2&&r.path==='Body'))&&(r.tier==='Standard'||ri>=1)&&!q.techs[r.n]&&!d.hints.some(h=>h.startsWith(r.n))); }
function talk(id){ const d=D(), q=st.qi; d.talks=d.talks||{}; if(id==='master'){ const s=stock(), price=30*(1+(st.c.realmIdx||0));
  if(!s.length) return 'Master Yun: You have learned all I can sell at this realm. Break through and return.';
  if(d.mOffer!==s[0].n){ d.mOffer=s[0].n; save(); return `Master Yun: ${s.length} pattern${s.length>1?'s':''} for a ${st.c.realm} cultivator. A hint costs ${price} gold — talk to me again to buy one. (You have ${q.gold}g.)`; }
  if(q.gold<price) return `Master Yun: ${price} gold, no less. Come back richer.`;
  q.gold-=price; const r=s[0], h=`${r.n} (${r.tier}): meditate on ${r.in.filter(x=>x!=='Meditation').join(' + ')}${r.in.includes('Meditation')?' alone':''}.`; d.hints.push(h); d.mOffer=null; save(); return `Master Yun: Listen… ${h} (Saved on your Character tab.)`; }
 const L=TALK[id]; if(L){ const n=d.talks[id]=(d.talks[id]||0)+1; save(); return L[(n-1)%L.length]; } return null; }
function poke(x,y,t){ const d=D(); d.cookies=d.cookies||{}; const key=t==='D'?'door'+x:t==='w'?'well':t==='f'?'flowers':null; if(!key) return null; if(t==='D'&&x>10) return 'A note on the door: “Gulpwell knew.” Hmm.';
 if(d.cookies[key]) return 'Just crumbs left here.'; d.cookies[key]=1; st.qi.gold+=15; save(); const n=Object.keys(d.cookies).length; return `🍪 You found a hidden cookie! +15 gold. (${n}/3 cookies)`+(n>=3?' The World Maker smiles somewhere.':''); }
const api={K,init,createHead,enter,exit,hub,gx,gearLook,talk,poke,train,attempt,
 allyGX:()=>{ const o={}; D().ai.forEach(a=>o[a.path]=aiGX(a)); return o; },
 tab:t=>{ tab=t; msg=''; selI=-1; selSlot=null; hub(); }, btab:t=>{ btab=t; selI=-1; re(); }, sel:i=>{ selI=selI===i?-1:i; selSlot=null; re(); }, pick:s=>{ selSlot=selSlot===s?null:s; selI=-1; re(); },
 hair:h=>{ D().look.hair=h; re(); }, tpick:t=>{ const i=tsel.indexOf(t); if(i>=0) tsel.splice(i,1); else if(tsel.length<2) tsel.push(t); train(); },
 slot:t=>{ const q=st.qi, i=q.slots.indexOf(t); if(i>=0) q.slots.splice(i,1); else if(q.slots.length>=3) return re('Loadout full (3). Unslot one first.'); else q.slots.push(t); re(); },
 equip:i=>{ const q=st.qi, it=q.inv.splice(i,1)[0]; const out=GR.equip(D().eq,q.inv,it); selI=-1; re('Equipped '+it.n+(out.length?' (moved '+out.map(g=>g.n).join(', ')+' to bag)':'')+'.'); },
 unequip:s=>{ const d=D(), g=d.eq[s]; if(g){ st.qi.inv.push(g); d.eq[s]=null; } selSlot=null; re(g?'Unequipped '+g.n+'.':''); },
 sell:i=>{ const q=st.qi, it=q.inv.splice(i,1)[0]; q.gold+=it.val; selI=-1; toast('Sold '+it.n+' +'+it.val+'g'); re('Sold '+it.n+' for '+it.val+'g.'); },
 buy:k=>{ const q=st.qi, c=FF.ITEMS[k].cost; if(q.gold<c){ toast('Need '+c+' gold'); return re('Need '+c+' gold.'); } q.gold-=c; q.bag[k]=(q.bag[k]||0)+1; toast('Bought '+k+' ✓'); re('Bought '+k+' (now ×'+q.bag[k]+').'); },
 manual:t=>{ const q=st.qi; if(st.c.realmIdx===0&&st.c.level<FF.TECH[t].lv) return re(t+' needs Qi '+FF.TECH[t].lv+'.'); if(q.gold<FF.MANUAL_COST){ toast('Need '+FF.MANUAL_COST+' gold'); return re('Need '+FF.MANUAL_COST+' gold.'); } q.gold-=FF.MANUAL_COST; FF.learn(q,P(),t); toast('Learned '+t+' ✓'); re('Learned '+t+(q.slots.includes(t)?' (slotted).':'. Slot it on the Character tab.')); },
 go:m=>{ msg=''; const d=D(); m=m||curMode(); d.playing=m; d.xpSnap=st.c.xpToday; d.goldSnap=st.qi.gold; save(); mode=m; if(m==='world'){ addNPCs(); worldOpen(); } else if(m==='htl') htl(); else qiHome(); chrome(); tut(m); },
 htlGear:hg=>{ const T=gx(); hg.hero.hp*=1+T.hp; hg.hero.mx*=1+T.hp; hg.hero.dpt*=1+Math.max(T.atk,T.mat); },
 meditate:()=>{ const c=st.c, d=D(); if(c.xpToday<DBG.XP_GOAL) return; const from=c.level; for(let i=0;i<LV_PER_DAY&&c.level<10;i++) DBG.levelUp(c); c.day++; c.xpToday=0; c.medToday=false;
  const tf=myFights(), n=tf-(d.fLast||0); d.fLast=tf; const ai=aiDay(d,null,n); d.news.push(`${DAYS[d.d]}: you meditated, Lv ${from} → ${c.level}.`+(d.lastTrain?' Training: '+d.lastTrain.replace(/<[^>]+>/g,''):''), ...ai); d.lastTrain=''; d.d++; if(st.world) st.world.pk=[1,1]; tab='hub'; re(c.level>=10?'Level 10 reached — the weekend boss decides your breakthrough.':''); },
 boss:()=>{ const d=D(), al={}; mode='boss'; const snap=d.snap; d.ai.forEach(a=>al[a.path]={name:a.name,techs:aiTechs(a),gear:aiGX(a)}); d.bossTries++; save(); let res=null;
  wkStart({allies:al,gear:gx(),meImg:meImg(),onEnd:r=>{ res=r; }, onLoot:it=>{ const t=applyLoot(st.c,st.qi,d,it,P()); d.news.push('Boss loot: '+t); save(); }});
  const back=()=>{ if(res&&res.result==='win'){ d.boss.push({week:d.week,rounds:res.rounds,mvp:res.mvp}); d.ai.forEach(a=>{ if(Math.random()<.6){ const it=GR.rand(GR.rollQ(null,.15),a.realmIdx); if(!a.eq[it.slot]||a.eq[it.slot].val<it.val) GR.equip(a.eq,[],it); a.loot.push(it.n); } if(a.name===res.mvp) a.bossMvp++; }); if(res.meMvp) d.meMvp=(d.meMvp||0)+1; st.qi.gold+=175; const from=st.c.realm; breakthrough(st.c,d); d.news.push(`Weekend: Monarch defeated in ${res.rounds} rounds. MVP ${res.mvp}. Breakthrough ${from} → ${st.c.realm}!`); d.snap=null; save(); summary(snap,res); } else re(res?'The Monarch survived. Try again (Sunday attempt).':''); };
  waitBack(back); setTimeout(()=>tut('boss'),600); },
 assist:()=>{ const d=D(), from=st.c.realm; breakthrough(st.c,d); d.news.push(`Assist breakthrough ${from} → ${st.c.realm}.`); re(); },
 nas:()=>{ const d=D(), me=P(), others=['Body','Force','Light','Mass'].filter(p=>p!==me); globalThis.DEMO_K=K;
  mode='nas'; nasStart({names:['You'].concat(others.map(p=>AIS[p])).concat(['Ruin']),maxRound:NAS_ROUNDS,bonus:2,ruinEnd:1}); const nv=$('#nasv'); if(nv&&!$('#dauto')){ nv.insertAdjacentHTML('afterend','<button class=dgo id=dauto style="background:#86c">🤖 Auto turn</button>'); $('#dauto').addEventListener('click',()=>{ if(!NAS2.autoTurn()) msg='Wait for your turn.'; }); } chrome(); setTimeout(()=>tut('nas'),300); },
 ruinBoss:()=>{ const d=D(), al={}; mode='boss'; d.ai.forEach(a=>al[a.path]={name:a.name,techs:aiTechs(a),gear:aiGX(a)}); d.ruinTries=(d.ruinTries||0)+1; save(); let res=null;
  const SKIN=[['Weekend Advancement Boss','The World Breaker'],['The Thunder Ape Monarch descends!','Comrade Ruin, the World Breaker, descends! “Everything you own belongs to everyone. Which is to say, to me.”'],['Thunder Ape Monarch','Comrade Ruin'],['Heavy Slam on','“From Each According to His Ability!” —'],['Heavy Slam','From Each According to His Ability'],['The Monarch LEAPS onto','Comrade Ruin sends to the Gulag:'],['Leap','Gulag'],['The Monarch ROARS!','“Five-Year Plan!” Comrade Ruin decrees.'],['Roar','Five-Year Plan'],['Storm Burst crashes down!','“Seize the Means!” The red zone collapses!'],['Storm Burst','Seize the Means'],['Lightning gathers… move out of the red zone!','Comrade Ruin prepares to Seize the Means… get out of the red zone!'],['The Monarch beats its chest.','Comrade Ruin reads a very long pamphlet.'],['The Monarch prowls.','Comrade Ruin redistributes himself.'],['The Monarch','Comrade Ruin'],['Monarch','Comrade Ruin'],['party advances · +175 gold','the world is free'],['IT ESCAPED','HE ESCAPED']];
  wkStart({allies:al,gear:gx(),meImg:meImg(),skin:SKIN,bossMul:1.6,bossDmg:1.15,onEnd:r=>{ res=r; },onLoot:it=>{ const t=applyLoot(st.c,st.qi,d,it,P()); d.news.push('World Breaker loot: '+t); save(); }});
  waitBack(()=>{ if(res&&res.result==='win'){ d.ruin={rounds:res.rounds,mvp:res.mvp}; d.ai.forEach(a=>{ if(a.name===res.mvp) a.bossMvp++; }); if(res.meMvp) d.meMvp=(d.meMvp||0)+1; st.qi.gold+=300; d.done=true; d.t1=Date.now(); d.news.push(`Comrade Ruin falls in ${res.rounds} rounds! MVP ${res.mvp}.`); save(); hub(); } else re(res?'Comrade Ruin still stands. Regroup and try again.':''); });
  setTimeout(()=>tut('boss'),600); },
 finish:()=>{ const d=D(), G=st.nas2; const me=P(), others=['Body','Force','Light','Mass'].filter(p=>p!==me); others.forEach((p,i)=>{ const a=d.ai.find(a=>a.path===p); a.nas=G.hex.filter(h=>h.o===i+1).length; }); d.myNas=G.hex.filter(h=>h.o===0).length; d.nasDone=G.ruinFell||'rounds'; d.news.push(`Nascent board: the Ruin ${G.ruinFell==='collapsed'?'collapsed after round 20':'was cleared in round '+Math.min(G.round,NAS_ROUNDS)}. You hold ${d.myNas} territories.`); re(); },
 summaryCont:()=>{ msg='Breakthrough! Welcome to '+st.c.realm+'.'; tab='hub'; hub(); }
};
function waitBack(fn){ api._pending=fn; }
const _hub=hub; api.hub=function(){ if(api._pending){ const f=api._pending; api._pending=null; return f(); } return _hub(); };
function summary(s,res){ const c=st.c, q=st.qi, d=D(); s=s||{attr:c.attr,techs:[],news:d.news.length,realm:'',level:0}; const gain=Object.keys(c.attr).map(k=>[k,c.attr[k]-s.attr[k]]).filter(x=>x[1]>0), newT=Object.keys(q.techs).filter(t=>!s.techs.includes(t)), loot=d.news.slice(s.news).filter(x=>x.startsWith('Boss loot')).map(x=>x.slice(11));
 const nx=d.week<3?WEEKS[d.week]:null, avail=FF.shopTechs(P()).filter(t=>!q.techs[t]);
 view(`<div class=dh style="text-align:center"><div style="letter-spacing:3px;color:#fc6">BREAKTHROUGH</div><h2>${s.realm} → ${c.realm}</h2>Monarch defeated in ${res.rounds} rounds · MVP ${res.mvp}</div>
 <div class=tip><b>Stats gained this week</b><br>${gain.length?gain.map(([k,v])=>`${k} +${v}`).join(' · '):'—'} (now Str ${c.attr.Str} · Spd ${c.attr.Spd} · Tough ${c.attr.Tough} · Aff ${c.attr.Aff})<br>Gear totals: ${statLine(totals())}</div>
 <div class=tip><b>Loot</b><br>+175 gold (now ${q.gold}g)${loot.length?'<br>'+loot.join('<br>'):'<br>No chest items won this time.'}</div>
 <div class=tip><b>Techniques</b><br>${newT.length?'New: '+newT.join(', '):'No new techniques this week.'}${avail.length?`<br>In the Shop: ${avail.join(', ')}`:''}<br>Master Yun in the overworld town has new hints for ${c.realm}.</div>
 <div class=tip><b>What’s next</b><br>${nx?`Week ${d.week+1}: <b>${nx.realm}</b> — ${nx.label} (new daily mode). ${nx.hint} Earlier modes stay open for loot.`:'The <b>Nascent Finale</b>: the board game against your 3 rivals, then the World Breaker.'}</div>
 <button class=dgo onclick="Demo.summaryCont()">Continue</button>`); mode='hub'; chrome(); }
function finaleHub(){ const d=D(), G=st.nas2, over=G&&G.over;
 mode='nas'; view(`<div class=dh><div class=row style="justify-content:space-between"><h2>Nascent Finale</h2><button class=s onclick="Demo.exit()">Exit demo</button></div>${st.c.name} · ${st.c.realm} ${st.c.level} · Week 4/4</div>
 ${d.nasDone?`<div class=tip>⚠️ <b>The World Breaker comes.</b> With the Ruin gone, its master steps through: <b>Comrade Ruin</b>. You, ${d.ai.map(a=>a.name).join(', ')} must stand together on the grid.${d.ruinTries?` Attempts: ${d.ruinTries}.`:''}</div><button class=dgo style="background:#a33" onclick="Demo.ruinBoss()">☭ Fight Comrade Ruin, the World Breaker</button>${(d.ruinTries||0)>=3?'<button class=s onclick="Demo.assistEnd()">Skip to the ending (assist)</button>':''}`
 :`<div class=tip>The final board: you, ${d.ai.map(a=>a.name).join(', ')} and the gray Ruin in the middle. The board ends when the last Ruin hex is taken (it collapses after round ${NAS_ROUNDS} if not). Your homelands start with +2 troops (demo).</div>
 ${over?`<button class=dgo onclick="Demo.finish()">🏁 The Ruin falls — continue</button>`:`<button class=dgo onclick="Demo.nas()">▶ ${G?'Continue':'Start'} the Nascent board</button>`}`}
 <div class=log>${[msg].concat(d.news.slice(-6).reverse()).filter(Boolean).join('\n')}</div>`); }
api.assistEnd=()=>{ const d=D(); d.done=true; d.t1=Date.now(); d.news.push('Assist: Comrade Ruin was driven off.'); re(); };
function endScreen(){ const d=D(), c=st.c, q=st.qi, wins=myWins();
 const me={name:c.name+' (you)',path:P(),me:1,pace:(c.realmIdx||0)*10+c.level,combat:wins+(d.meMvp||0)*3,wealth:q.gold+q.inv.reduce((a,i)=>a+(i.val||0),0)+eqVal(d.eq),conquest:d.myNas||0};
 const rows=scores(d,me), mins=Math.round((d.active||0)/60000), col=['#fc6','#f64','#5e8','#c8f'], mine=rows.find(r=>r.me);
 view(`<div class=dh style="text-align:center"><div style="letter-spacing:3px;color:#fc6">DEMO COMPLETE</div><h2>${rows[0].me?'You are the Sovereign of This Age!':rows[0].name+' is Sovereign of This Age'}</h2>${d.ruin?`Comrade Ruin defeated in ${d.ruin.rounds} rounds · MVP ${d.ruin.mvp}<br>`:''}${mins} min active play · ${d.boss.length} weekend bosses</div>
 <div class=dh style="border:1px solid #fc6"><b>✨ The World Maker</b><p style="margin:6px 0">Light gathers where the Breaker fell, and a warm voice speaks: <i>“Each of you chose your own way — and the world grew because you did. Comrade Ruin is broken; the provinces are yours to rebuild as you see fit. Thank you, cultivators. When you are ready, the road home to your old world is open… and I suspect a certain tavern owes you a drink.”</i></p>Your title: <b style="color:#fc6">${mine.title}</b></div>
 <h3>Final ranking</h3><table style="width:100%;color:#eee;font-size:12px"><tr style="color:#9ab"><td>#</td><td>Cultivator</td><td>Pace</td><td>Combat</td><td>Wealth</td><td>Conq.</td><td>Score</td></tr>
 ${rows.map((r,i)=>`<tr style="${r.me?'background:#3a3320':''}"><td>${i+1}</td><td>${FF.PATHS[r.path].em} ${r.name}${i===0?' 👑':''}<br><small style="color:#fc6">${r.title}</small></td>${r.ch.map((v,k)=>`<td>${bar(v,100,col[k]).replace('110px','34px')} ${v}</td>`).join('')}<td><b>${r.total}</b></td></tr>`).join('')}</table>
 <div class=tip>Pace = realm and level; Combat = battles won + boss MVPs; Wealth = gold + gear and loot value; Conquest = Nascent territories. Titles: 1st–3rd by rank, then best category.${Object.keys(d.cookies||{}).length?` Cookies found: ${Object.keys(d.cookies).length}/3 🍪`:''}</div>
 <button class=dgo onclick="if(confirm('Start a new Demo Run? This clears the demo save only.')){localStorage.removeItem('dbg_demo2');Demo.enter()}">New Demo Run</button><button class=s onclick="Demo.exit()">Exit demo</button>`); }
root.Demo=api;
})(typeof window!=='undefined'?window:globalThis);
