// Live campaign calendar. All dates are America/Los_Angeles; no demo save migration.
(function(root){
const EPOCH='2026-11-09', ZONE='America/Los_Angeles';
const today=()=>{ const p=new Intl.DateTimeFormat('en-US',{timeZone:ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()),v=k=>p.find(x=>x.type===k).value; return v('year')+'-'+v('month')+'-'+v('day'); };
const ordinal=s=>Math.floor(Date.parse(s+'T12:00:00Z')/86400000);
const dow=s=>(new Date(s+'T12:00:00Z').getUTCDay()+6)%7;
const prelaunch=()=>today()<EPOCH;
function sync(){ if(!root.LIVE||!st.c||!st.demo) return; const d=st.demo,c=st.c,t=today();
 if(d.liveDate!==t){ const prev=d.liveDate; if(prev&&t>prev){ const n=Math.min(60,ordinal(t)-ordinal(prev)); let missed=0; for(let j=0;j<n;j++){ const dt=new Date((ordinal(prev)+j)*86400000).toISOString().slice(0,10); if(dt>=EPOCH&&dow(dt)<5&&d.medDate!==dt) missed++; } if(missed){ d.ruinM=Math.min(100,d.ruinM+6*missed); const elig=(c.level-1)<5, before=d.charges||0; if(elig) d.charges=Math.min(3,before+missed); d.news.push(`${missed} missed weekday${missed===1?'':'s'}: Ruin’s influence grew.`+(elig&&d.charges>before?` 🏮 +${d.charges-before} catch-up charge${d.charges-before===1?'':'s'} (bank ${d.charges}/3).`:'')); } }
 d.liveDate=t; c.xpToday=0;c.htlWaves=0;c.medToday=false; if(st.qi) st.qi.wins=0; d.trainDay=-1; d.nasR0=st.nas2?st.nas2.round:1; d.playing=null; if(st.world) st.world.pk=[1,1]; }
 d.week=c.realmIdx||0; d.d=prelaunch()?0:Math.min(5,dow(t)); globalThis.DEMO_K=1;
 d.story=d.story||[]; const id='live-'+t;
 if(!prelaunch()&&!d.story.some(s=>s.id===id)){ const week=d.d===5; d.story.push({id,title:`☁️ ${t} · The World Maker`,body:week?'“The market is open, but today we invest together. Gather your companions for the weekend battle.”':'“A new day, a new investment. Fight on your current realm’s battlefield, then meditate. One honest day’s growth beats any Five-Year Plan.”',w:t+' PT'}); }
 save(); }
// p28 catch-up bank: after today's Meditation (or on weekends) a charge buys one extra Meditation for half a day's XP, from any mode.
function catchup(){ const d=st.demo,c=st.c,t=today(); if(!root.LIVE||prelaunch()||!d||!(d.charges>0)) return false; const elig=(c.level-1)<5; return elig&&(dow(t)>=5||d.medDate===t); }
function xpGoal(){ return catchup()?50:100; }
function canXP(mode){ if(!root.LIVE) return true; sync(); if(prelaunch()) return false; if(catchup()) return true; return dow(today())<5&&st.demo.medDate!==today()&&mode===['world','htl','sect','nas'][st.c.realmIdx||0]&&(st.c.level-1)<5; }
function canMeditate(){ if(catchup()) return st.c.xpToday>=50; return canXP(['world','htl','sect','nas'][st.c.realmIdx||0]); }
function canBoss(){ sync(); return !prelaunch()&&dow(today())>=5&&st.c.level>=6&&(st.c.realmIdx||0)<3; }
function dateLabel(){ return prelaunch()?'Preseason · first XP day Mon Nov 9':today()+' PT · '+(dow(today())>=5?'Weekend (co-op)':'Weekday (solo)'); }
function hold(){ const d=st.demo,c=st.c;
 const grind=()=>`<button class=dgo onclick="Demo.go()">Play current battlefield · loot &amp; gold only</button>${['world','htl','sect'].slice(0,c.realmIdx||0).map(m=>`<button class=dgo onclick="Demo.go('${m}')">Replay ${m} · loot &amp; gold only</button>`).join('')}`;
 if(prelaunch()) return '<div class=tip><b>The campaign begins Monday, November 9, 2026 at midnight Pacific time.</b><br>Create your cultivator, browse Character and Shop, and read the prologue tonight. No Sunday boss and no XP before Monday.</div>';
 if(catchup()){ const ok=c.xpToday>=50; return `<div class=tip>🏮 <b>Catch-up lantern</b> · ${d.charges}/3 charges. Earn <b>50 XP in any mode</b>, then Meditate to spend one charge (+1 level and a discovery attempt).<br>XP toward this charge: ${Math.min(50,c.xpToday)}/50</div>`+grind()+`<button class=dgo style="background:${ok?'#86c':'#444'}" ${ok?'':'disabled'} onclick="Demo.train()">🧘 Meditate (spend 1 charge)</button>`; }
 if(dow(today())>=5&&(c.realmIdx||0)<3&&c.level<6) return `<div class=tip>Weekend rest and preparation. The advancement boss needs +5 levels in this realm (you have +${c.level-1}).${d.charges?'':' Missed weekdays earn catch-up charges (🏮) you can spend after your daily Meditation or on weekends.'}</div>`+grind();
 if(dow(today())<5&&(d.medDate===today()||((c.realmIdx||0)<3&&c.level>=6))) return `<div class=tip>${d.medDate===today()?'You have meditated today. Your next XP day begins at midnight Pacific time.':'You have +5 levels in this realm. The advancement boss opens on the real weekend.'}<br>Keep playing for loot and gold — no additional level today.</div>`+grind();
 return ''; }
function refreshDate(){ try{ if(root.LIVE&&st.c&&st.demo&&st.demo.liveDate!==today()&&!document.hidden&&!document.querySelector('#wk,.wend,#wv,#cv,#fs,#nasv')) day(); }catch(e){} }
setInterval(refreshDate,30000);document.addEventListener('visibilitychange',refreshDate);root.addEventListener('focus',refreshDate);
root.Live={EPOCH,ZONE,today,dow,sync,canXP,canMeditate,canBoss,prelaunch,hold,dateLabel,catchup,xpGoal};
})(window);
