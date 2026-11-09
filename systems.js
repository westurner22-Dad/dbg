// p28 locked systems: stats/derived combat, physiques, inspiration, catch-up bank, titles, achievements, score,
// challenge bosses, bounties, elites/rare beasts, tomes, requests. Pure helpers + small HTML builders; hooks live in demo/family/index.
(function(root){
const REALMS=['Qi Gathering','Foundation','Core','Nascent'];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// ---- Stats (cultivation_22 locks). Soft caps on Spd/Tough/Aff; Str uncapped.
function soft(v){ let o=0,left=Math.max(0,v||0); for(const [w,k] of [[50,1],[50,.9],[50,.8],[1e9,.7]]){ const x=Math.min(left,w); o+=x*k; left-=x; if(left<=0) break; } return o; }
const PHYS_MULT=[1,5,25,125], AFF_MULT=[1,10,75,500], MANA_MOD=[.5,2,5,12];
const DEF_ALLOC={Str:2,Spd:2,Tough:2,Aff:4};
function gained(c){ return (c.realmIdx||0)*5+Math.max(0,(c.level||1)-1); }
// what a default-built cultivator of this role has at this point (tuning anchor: default builds stay exactly as tuned)
function expected(c){ const f=(root.DBG&&DBG.ROLES[c.role]||{focus:'Str'}).focus, a={Str:5+DEF_ALLOC.Str,Spd:5+DEF_ALLOC.Spd,Tough:5+DEF_ALLOC.Tough,Aff:5+DEF_ALLOC.Aff}, n=1+gained(c); a[f]+=4*n; a.Aff+=1*n; return a; }
const MAJOR={spd:{nm:'Speed',stat:'Spd',ic:'💨',t:[['Wind-Step Physique',15],['Phantom Body',25],['Impossible Speed Body',40]],fx:'Each dodge restores 3% Mana'},
 tough:{nm:'Toughness',stat:'Tough',ic:'⛰️',t:[['Iron Bone Physique',20],['Mountain Body',35],['Eternal Sovereign Body',50]],fx:'Tier 3: boss single hits −10%'},
 aff:{nm:'Affinity',stat:'Aff',ic:'🌌',t:[['Heavenly Meridian Physique',20],['Spirit-Sea Body',35],['Celestial Conduit Body',50]],fx:'+5% affinity technique damage'},
 str:{nm:'Strength (Body Cultivation)',stat:'Str',ic:'💪',t:[['Tempered Sinew Body',0],['Diamond Body',15],['Titan Muscle Body',30],['World-Breaking Body',50]],fx:'Physical damage +6% (Tempered) / +8% higher tiers; World-Breaking +8% more'}};
const MAJOR_IN={spd:['Attack','Meditation'],tough:['Block','Meditation'],aff:['Block','Focus Breathing','Meditation'],str:['Attack','Block','Meditation']};
const MINOR={quick:{n:'Quick Meditation',how:'Win 25 beast fights',fx:'Beast wins restore 15% HP and Mana (instead of 5%)'},
 recovery:{n:'Enhanced Recovery',how:'Win 5 fights below 10% HP',fx:'Healing Potions heal 50% more'},
 aware:{n:'Spiritual Awareness',how:'Discover your first technique',fx:'+2 on Meditation d20 rolls'},
 merchant:{n:'Merchant’s Instinct',how:'Spend 2,000 gold in total',fx:'+5% gold from battles and bounties'},
 senses:{n:'Beast Senses',how:'Defeat your first elite beast',fx:'+25% elite encounter chance'},
 night:{n:'Night Vision',how:'Defeat 10 beasts in the Gray Province Marches',fx:'You see whether a beast is elite or rare before the fight and may slip away from elites'},
 ox:{n:'Ox Sinews',how:'Deal the most damage in a weekend fight',fx:'+Str (5/10/20/40 by realm)'},
 swift:{n:'Swift Tendons',how:'Act before the boss 10 times',fx:'+Spd (5/10/20/40 by realm)'},
 stone:{n:'Stone Skinned',how:'Take the most damage in a weekend fight and survive',fx:'+Tough (5/10/20/40 by realm)'},
 vein:{n:'Spirit Vein',how:'Cast 100 techniques',fx:'+Aff (5/10/20/40 by realm)'},
 steady:{n:'Steady Hands',how:'Land 25 critical hits',fx:'+5% critical chance'},
 iron:{n:'Iron Will',how:'Outlast 10 boss debuffs',fx:'Boss roots and hexes cannot slow you'}};
const MINOR_TEST={quick:c=>c.beastWins>=25,recovery:c=>c.lowHp>=5,aware:c=>c.promos>=1,merchant:c=>c.spent>=2000,senses:c=>c.elites>=1,night:c=>c.province>=10,ox:c=>c.topDmg>=1,swift:c=>c.firsts>=10,stone:c=>c.tanked>=1,vein:c=>c.casts>=100,steady:c=>c.crits>=25,iron:c=>c.debuffs>=10};
const RSCALE=[5,10,20,40];
function ensure(st){ const d=st.demo, c=st.c; if(!d||!c) return;
 d.ct=Object.assign({beastWins:0,lowHp:0,promos:0,spent:0,elites:0,rares:0,province:0,topDmg:0,firsts:0,tanked:0,casts:0,crits:0,debuffs:0,potions:0,sold:0,bounties:0,chal:{},chalWins:0,bossWins:0,mvps:0,joins:0,fights:0,meds:0},d.ct||{});
 d.phys=Object.assign({maj:{},min:[],aM:null,am:null},d.phys||{}); d.insp=d.insp||0; d.charges=d.charges||0; d.wc=d.wc||0; d.ach=d.ach||{}; d.titles=d.titles||[]; d.badLuck=d.badLuck||0;
 if(!d.title){ const T=TITLES.start; const h=[...String(c.name||'x')].reduce((a,ch)=>a+ch.charCodeAt(0),0); d.title=T[h%T.length]; if(!d.titles.includes(d.title)) d.titles.push(d.title); }
 if(c.bio==null) c.bio=''; st.qi&&(st.qi.bag=st.qi.bag||{}); }
// effective attributes = base + physique flats + enchants, soft caps applied
function attrs(st){ const c=st.c, d=st.demo||{}, a=Object.assign({},c.attr), ri=c.realmIdx||0, P=d.phys||{maj:{},min:[]};
 const m=P.aM&&P.maj[P.aM]!=null?MAJOR[P.aM]:null; if(m){ const t=m.t[P.maj[P.aM]]; a[m.stat]+=t[1]; if(P.aM==='str'&&P.maj.str>=1) a.Tough+=P.maj.str===1?15:0; }
 const mn=P.am; if(mn==='ox') a.Str+=RSCALE[ri]; if(mn==='swift') a.Spd+=RSCALE[ri]; if(mn==='stone') a.Tough+=RSCALE[ri]; if(mn==='vein') a.Aff+=RSCALE[ri];
 for(const s in (d.eq||{})){ const g=d.eq[s]; if(g&&g.ench&&g.ench.attr) for(const k in g.ench.attr) a[k]=(a[k]||0)+g.ench.attr[k]; }
 return {raw:a,eff:{Str:a.Str,Spd:soft(a.Spd),Tough:soft(a.Tough),Aff:soft(a.Aff)}}; }
function derived(st){ const c=st.c, ri=c.realmIdx||0, A=attrs(st).eff, L=c.level||1, T=root.GEAR?GEAR.totals((st.demo||{}).eq||{},(st.demo||{}).trs||[]):{};
 const hp=Math.round(A.Tough*10*PHYS_MULT[ri]), mana=Math.round((A.Aff*10+L*25)*MANA_MOD[ri]), phys=Math.round((10+A.Str)*PHYS_MULT[ri]), aff=Math.round((10+A.Aff)*AFF_MULT[ri]);
 const steady=(st.demo&&st.demo.phys&&st.demo.phys.am==='steady')?.05:0, base=A.Spd/(A.Spd+100);
 return {hp,mana,phys,aff,hybrid:Math.round((phys+aff)/2),crit:Math.min(.75,base+(T.crit||0)+steady),dodge:Math.min(.5,base+(T.dodge||0)),block:Math.min(.5,T.blk||0),dr:Math.min(.6,(T.dr||0)),A}; }
// fold attributes into the engine gear object: ratios vs the default build keep tuning; crit/dodge/block become real chances
function fold(G,st){ G=Object.assign({},G); const c=st.c, d=st.demo||{}; if(!c||!c.attr) return G; const E=expected(c), A=attrs(st).eff, D=derived(st);
 const r=k=>clamp(A[k]/Math.max(1,soft(E[k])),.5,2.5), mul=(x,k)=>(1+(G[x]||0))*clamp(1+.5*(r(k)-1),.75,1.8)-1;
 G.hp=mul('hp','Tough'); G.atk=mul('atk','Str'); G.mat=mul('mat','Aff'); G.mp=(1+(G.mp||0))*clamp((A.Aff*10+(c.level||1)*25)/Math.max(1,soft(E.Aff)*10+(c.level||1)*25),.75,1.8)-1;
 G.spd=(G.spd||0)+Math.max(0,Math.floor(((A.Spd||5)-5)/4));
 const P=d.phys||{}; if(P.aM==='str'&&P.maj.str!=null){ G.atk=(1+G.atk)*(P.maj.str===0?1.06:P.maj.str===3?1.16:1.08)-1; } if(P.aM==='aff'&&P.maj.aff!=null) G.mat=(1+G.mat)*1.05-1;
 G.critC=D.crit; G.dodgeC=D.dodge; G.blkC=D.block; G.drG=D.dr; G.tdmg=(GEARTOT(d).tdmg||0); G.shieldK=1+(GEARTOT(d).shield||0); G.heal=(G.heal||0)+(GEARTOT(d).heal||0);
 if(P.aM==='tough'&&P.maj.tough===2) G.bossHitK=.9; if(P.aM==='spd'&&P.maj.spd!=null) G.dodgeMana=.03; if(P.am==='iron') G.ironWill=1; if(P.am==='recovery') G.potK=1.5;
 G.uniq=[]; G.arts=[]; for(const s in (d.eq||{})){ const g=d.eq[s]; if(!g) continue; if(g.ench&&g.ench.u) G.uniq.push(g.ench.u); if(g.art&&g.q!=='Junk') G.arts.push(g.art); }
 return G; }
const GEARTOT=d=>root.GEAR?GEAR.totals(d.eq||{},d.trs||[]):{};
// ---- Physique discovery (Meditation pool). Counts stay demo-tuned (2/3/3).
function physCombos(st){ const d=st.demo, ri=st.c.realmIdx||0, P=d.phys, out=[];
 for(const k in MAJOR){ const have=P.maj[k], next=have==null?(k==='str'?null:0):have+1, L=MAJOR[k].t; if(next==null||next>=L.length) continue;
  const gate=k==='str'?next:next+1; if(ri<gate) continue; const nm=L[next][0], ins=next===0||(k==='str'&&next===1)?MAJOR_IN[k]:[L[next-1][0],'Meditation'];
  out.push({n:nm,in:ins,need:next===0?2:3,tier:'Physique',phys:k,idx:next}); } return out; }
function learnPhys(st,r){ const P=st.demo.phys; P.maj[r.phys]=r.idx; if(!P.aM) P.aM=r.phys; }
function autoStr(st){ const c=st.c, P=st.demo.phys; if(P.maj.str!=null||(c.realmIdx||0)>0||c.level<5) return null; const a=c.attr; if(a.Str>=Math.max(a.Spd,a.Tough,a.Aff)){ P.maj.str=0; if(!P.aM) P.aM='str'; return 'Tempered Sinew Body awakened (Strength was your highest attribute at Qi level 5).'; } return null; }
function checkMinors(st){ const d=st.demo, out=[]; for(const k in MINOR) if(!d.phys.min.includes(k)&&MINOR_TEST[k](Object.assign({},d.ct))){ d.phys.min.push(k); if(!d.phys.am) d.phys.am=k; out.push(MINOR[k].n); } return out; }
// ---- Inspiration (V5)
function addInsp(st,n,why){ const d=st.demo; const before=d.insp||0; d.insp=Math.min(3,before+n); if(d.insp>before) (d.news||[]).push('✨ Inspiration +'+(d.insp-before)+' ('+why+'). Bank '+d.insp+'/3.'); return d.insp-before; }
function rareInsp(st,kind){ const d=st.demo, ri=st.c.realmIdx||0; d.inspRealm=d.inspRealm||{}; if(d.inspRealm[ri]) return 0; const p=kind==='elite'?.001:1; if(Math.random()<p){ d.inspRealm[ri]=1; return addInsp(st,1,kind==='elite'?'elite beast':'rare beast'); } return 0; }
// ---- Encounters: elites (~1/15 off the starter town), rare beasts (2.5%/day, first beast of the day)
const RARE={town:{n:'Golden Moon Hare',em:'🐇',ty:'Light',hp:1.6,atk:1.0,spd:14,mv:'Moonlit Blink'},bamboo:{n:'Jade Qilin Calf',em:'🦌',ty:'Force',hp:1.8,atk:1.05,spd:12,mv:'Qilin Spark'},ash:{n:'Archive Phoenix Chick',em:'🐦‍🔥',ty:'Light',hp:1.7,atk:1.15,spd:13,mv:'Ash Flare'},province:{n:'Last Free Tiger',em:'🐅',ty:'Body',hp:2.0,atk:1.15,spd:12,mv:'Unbowed Roar'}};
function encounter(st,mapId,today){ const d=st.demo; ensure(st); const out={elite:false,rare:null};
 if(d.rareDay!==today){ d.rareDay=today; if(Math.random()<.025) out.rare=RARE[mapId]||RARE.town; }
 if(!out.rare&&mapId!=='town'){ const p=(1/15)*(d.phys.am==='senses'?1.25:1); out.elite=Math.random()<p; } return out; }
function goldK(st){ const d=st.demo||{}; let k=1; if(d.phys&&d.phys.am==='merchant') k*=1.05; return k; }
// ---- Bounty board: 3 quests/day, 10–15 gold
const BTYPES=[['beasts','Defeat 3 wild beasts',3],['Light','Defeat a Light-type beast',1],['Mass','Defeat a Mass-type beast',1],['Force','Defeat a Force-type beast',1],['Body','Defeat a Body-type beast',1],['mat','Bring back a beast material',1],['tech','Win a fight using a technique',1]];
function bounties(st,today){ const d=st.demo; if(!d.bounty||d.bounty.date!==today){ const pool=BTYPES.slice(), list=[]; for(let i=0;i<3;i++){ const b=pool.splice(Math.floor(Math.random()*pool.length),1)[0]; list.push({k:b[0],t:b[1],need:b[2],have:0,gold:10+Math.floor(Math.random()*6),done:false}); } d.bounty={date:today,list}; } return d.bounty.list; }
function bountyProgress(st,today,ev){ const L=bounties(st,today), msgs=[]; L.forEach(b=>{ if(b.done) return; if(b.k==='beasts'||b.k===ev.ty||(b.k==='mat'&&ev.mat)||(b.k==='tech'&&ev.tech)) b.have++; if(b.have>=b.need){ b.done=true; const g=Math.round(b.gold*goldK(st)); st.qi.gold+=g; st.demo.ct.bounties++; msgs.push(`📜 Bounty complete: ${b.t} · +${g} gold`); } }); return msgs; }
// ---- Tomes (once per realm), Repel Incense, shrine
const TOMES=[['Primer','📗',[50,150,450,1350],'Confirms that Meditation is an input to every pattern (always true) and points to your easiest open pattern.'],['Treatise','📘',[200,600,1800,5400],'Reveals the theme and role of one hidden pattern you can reach.'],['Codex','📕',[600,1800,5400,16200],'Names one hidden pattern outright and its inputs.']];
const INCENSE=ri=>15*(1+ri), SHRINE=ri=>10*(1+ri);
// ---- Titles & achievements
const TITLES={start:['The Overconfident','Twice-Reborn Idiot','Survivor of Bad Decisions','The Lucky Corpse','Comrade Who Tried'],
 milestone:['Seeker of the Way','Iron Root','Heart of Ash','Nascent Soul','Bearer of Legends','Mythwright','Lord of the Land'],
 weekend:['Worldbreaker','The Unyielding','Beacon of Heaven','Master of Fate','Party Favorite','Boss Bane'],
 end:['Sovereign of This Age','Heaven’s Chosen','First Among Immortals','Golden Sovereign','Monster’s Lament','The Perfect Cultivator','Steadfast Companion']};
const ACH=[['first','First Breath',1,'Meditate for the first time'],['pocket','Pocket Change',1,'Hold 100 gold'],['bounty','Bounty Hunter',1,'Complete a bounty'],['suggest','Suggestion Box',1,'Submit a request or suggestion'],['hint','Hint Taken',1,'Buy a Master Yun hint or a tome'],
 ['dressed','Dressed for Success',1,'Fill all 6 equipment slots'],['wind','Second Wind',1,'Drink a Healing Potion in battle'],['hello','Hello Comrades',1,'Join a family weekend fight'],['price','Name Your Price',1,'Sell 10 items'],['eliteE','Elite Encounter',1,'Defeat an elite beast'],
 ['enl','Enlightened',3,'Discover a technique'],['bodysoul','Body and Soul',3,'Gain a physique'],['jack','Jack of All Trades',3,'Know 8 techniques'],['qiasc','Qi Ascendant',3,'Reach +5 levels in Qi Gathering'],['fnd','Foundation Laid',3,'Reach Foundation'],['core','Core Awakened',3,'Reach Core'],
 ['htl','Hold the Line',3,'Clear both daily tower-defense waves'],['arch','Archivist',3,'Free a sect in Sect Conquest'],['coll','Collector',3,'Own 3 treasures'],['rare','Rare Sighting',3,'Defeat a rare beast'],['ench','Enchanter',3,'Enchant an Epic or Legendary item'],['land','Landholder',3,'Hold 10 territories on the Nascent map'],
 ['legend','Legend Born',5,'Equip a Legendary item'],['gm','Grandmaster',5,'Discover a Master-tier technique'],['myth','Mythic Insight',5,'Discover an Ascendant-tier technique'],['full','Full Spectrum',5,'Have a Major and a Minor physique'],['chal','Challenger',5,'Defeat 5 different challenge bosses'],
 ['unbroken','Unbroken Party',5,'Win a weekend fight with nobody downed'],['last','Last Stand',5,'Win a weekend fight below 10% HP'],['wbe','World Breaker’s End',5,'Defeat Comrade Ruin']];
const ACH_PTS=ACH.reduce((a,x)=>a+x[2],0); // 86
function checkAch(st,extra){ ensure(st); const c=st.c, q=st.qi||{techs:{},inv:[]}, d=st.demo, ct=d.ct, eq=d.eq||{}, promos=Object.keys(q.techs||{}).map(t=>root.FF&&FF.TECH[t]).filter(T=>T&&T.promo), ri=c.realmIdx||0, got=[];
 const ok={first:ct.meds>0,pocket:(q.gold||0)>=100,bounty:ct.bounties>0,suggest:!!d.suggested,hint:(d.hints||[]).length>0||!!d.tomes,dressed:['head','armor','arms','legs','main'].every(s=>eq[s])&&(eq.off||(eq.main&&eq.main.two)),wind:ct.potions>0,hello:ct.joins>0,price:ct.sold>=10,eliteE:ct.elites>0,
  enl:promos.length>0,bodysoul:Object.keys(d.phys.maj).length+d.phys.min.length>0,jack:Object.keys(q.techs||{}).length>=8,qiasc:ri>0||c.level>=6,fnd:ri>=1,core:ri>=2,htl:!!ct.htl2,arch:Object.keys(d.freed||{}).length>0,coll:(d.trs||[]).filter(t=>t.k==='treasure').length>=3,rare:ct.rares>0,ench:!!ct.ench,land:!!ct.land,
  legend:Object.values(eq).some(g=>g&&g.q==='Legendary'),gm:promos.some(T=>T.ptier==='Master'),myth:promos.some(T=>T.ptier==='Ascendant'),full:Object.keys(d.phys.maj).length>0&&d.phys.min.length>0,chal:Object.keys(ct.chal).length>=5,unbroken:!!ct.unbroken,last:!!ct.last,wbe:!!(d.ruin)};
 ACH.forEach(([k,n,p])=>{ if(ok[k]&&!d.ach[k]){ d.ach[k]=root.Live?Live.today():1; got.push(n+' (+'+p+')'); } });
 // milestone titles
 const MT=[[promos.length>0,'Seeker of the Way'],[ri>=1,'Iron Root'],[ri>=2,'Heart of Ash'],[ri>=3,'Nascent Soul'],[ok.legend,'Bearer of Legends'],[ok.myth,'Mythwright'],[ok.land,'Lord of the Land'],[ct.bossWins>=5,'Boss Bane']];
 MT.forEach(([b,t])=>{ if(b&&!d.titles.includes(t)){ d.titles.push(t); got.push('Title: '+t); } });
 if(got.length&&d.news) d.news.push('🏅 '+got.join(' · ')); return got; }
const achPts=d=>ACH.reduce((a,[k,,p])=>a+((d.ach||{})[k]?p:0),0);
// ---- Weekend contribution: 4 channels, 25 × share each, share capped 45%, MVP +5, advancement fights doubled
function contribution(g,seat,adv){ const ch=['dmg','pro','sus','con'], tot={}; ch.forEach(k=>tot[k]=g.units.reduce((a,u)=>a+(u.sc[k]||0),0)||1);
 const u=g.units.find(x=>+x.seat===+seat); if(!u) return {pts:0,mvp:false}; const sh=ch.map(k=>Math.min(.45,(u.sc[k]||0)/tot[k])); let pts=sh.reduce((a,s)=>a+25*s,0);
 const tt=x=>ch.reduce((a,k)=>a+(x.sc[k]||0)/tot[k],0); const mvpU=g.units.slice().sort((a,b)=>tt(b)-tt(a))[0], mvp=mvpU===u; if(mvp) pts+=5; if(adv) pts*=2;
 const top=k=>g.units.slice().sort((a,b)=>(b.sc[k]||0)-(a.sc[k]||0))[0]===u&&(u.sc[k]||0)>0; return {pts:Math.round(pts*10)/10,mvp,top:{dmg:top('dmg'),pro:top('pro'),sus:top('sus'),con:top('con')},u}; }
// ---- Score: 7 categories + achievements, seated humans only
function metrics(s){ const c=s.c||{}, q=s.qi||{techs:{},inv:[]}, d=s.demo||{}, ct=d.ct||{}, eqv=Object.values(d.eq||{}).filter(Boolean).reduce((a,g)=>a+(g.val||0),0), at=c.attr||{};
 const promos=Object.keys(q.techs||{}).filter(t=>root.FF&&FF.TECH[t]&&FF.TECH[t].promo).length, ph=d.phys?Object.values(d.phys.maj).reduce((a,v)=>a+v+1,0)+d.phys.min.length:0;
 return {pace:(c.realmIdx||0)*5+Math.max(0,(c.level||1)-1),attr:(at.Str||0)+(at.Spd||0)+(at.Tough||0)+(at.Aff||0),tech:Object.keys(q.techs||{}).length+2*promos+3*ph,equip:eqv,week:d.wc||0,econ:(q.gold||0)+(q.inv||[]).reduce((a,i)=>a+(i.val||0),0)+eqv,mon:(ct.beastWins||0)+5*(ct.elites||0)+10*(ct.rares||0)+10*(ct.chalWins||0),ach:achPts(d)}; }
const CATS=[['pace','Pace',35],['attr','Attributes',20],['tech','Technique',15],['equip','Equipment',5],['week','Weekend',15],['econ','Economy',5],['mon','Monster',5]];
function rank(rows){ const mx={}; CATS.forEach(([k])=>mx[k]=Math.max(1,...rows.map(r=>r.m[k])));
 rows.forEach(r=>{ r.cat={}; CATS.forEach(([k])=>{ const x=r.m[k]/mx[k]; r.cat[k]=Math.round(100*((k==='econ'||k==='mon')?Math.sqrt(x):x)); }); r.total=Math.round((CATS.reduce((a,[k,,w])=>a+w*r.cat[k]/100,0)+3*r.m.ach/ACH_PTS)*10)/10; });
 rows.sort((a,b)=>b.total-a.total); const used={}, best=k=>rows.slice().sort((a,b)=>b.m[k]-a.m[k])[0];
 rows.forEach((r,i)=>{ if(i<3) r.endTitle=TITLES.end[i]; }); [['econ','Golden Sovereign'],['mon','Monster’s Lament'],['pace','The Perfect Cultivator']].forEach(([k,t])=>{ const b=best(k); if(b&&!b.endTitle&&!used[t]){ b.endTitle=t; used[t]=1; } }); rows.forEach(r=>{ if(!r.endTitle) r.endTitle='Steadfast Companion'; }); return rows; }
function standingsHTML(players){ const rows=rank(Object.entries(players||{}).filter(([n,p])=>p&&p.campaign&&p.campaign.c).map(([n,p])=>({seat:+n,name:p.campaign.c.name,m:metrics(p.campaign)}))); if(!rows.length) return '';
 return `<div class=dh><b>🏆 Standings</b> <small>(seated humans only · 35 Pace · 20 Attributes · 15 Technique · 5 Equipment · 15 Weekend · 5 Economy · 5 Monster + achievements)</small><table style="width:100%;font-size:11px;color:#eee"><tr style="color:#9ab"><td>#</td><td>Cultivator</td>${CATS.map(c=>`<td>${c[1].slice(0,4)}</td>`).join('')}<td>Ach</td><td>Score</td></tr>${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.name)}</td>${CATS.map(([k])=>`<td>${r.cat[k]}</td>`).join('')}<td>${r.m.ach}</td><td><b>${r.total}</b></td></tr>`).join('')}</table></div>`; }
// ---- Challenge bosses (20). Reuse the realm's four boss move-sets, distinct names/tints.
const CHAL=[[['Thunder Hare Matron','ape',0,'“Thump. Thump. Thump.” (She is counting your remaining seconds.)'],['Stoneback Alpha','iron',30,'A boulder with opinions.'],['Sunfeather Elder','banner',60,'Preens. Judges. Ignites.'],['Spirit Serpent','banner',150,'It has been waiting in the reeds since before the sect was founded.'],['Corrupted Treant','iron',100,'The forest’s grudge, given legs.']],
 [['Foreman Brick of the Five-Year Pit','iron',20,'“Dig faster. The plan says this hole was finished last year.”'],['The Tractor Saint','ape',200,'Blessed are the harvest numbers, for they shall be revised upward.'],['Commissar of Grain Requisition','banner',330,'“Your rice? You mean OUR rice.”'],['The Loudspeaker Matriarch','banner',280,'Morning announcements, at volume, forever.'],['Hero-of-Labour Golem','iron',90,'Built to exceed quota. It exceeds you.']],
 [['The Red Pen Chief Editor','banner',0,'Every page of history passes her desk. Most do not come back.'],['Commissar of Memory Holes','ruin',40,'“What fight? There was never a fight. Next.”'],['Inspector of Mandatory Smiles','ape',310,'Smile. Wider. That is an order.'],['Minister of Approved Weather','banner',190,'Today is sunny by decree. Lightning is a counter-revolutionary rumor.'],['The Queue','iron',240,'You are number 4,812. Please hold. Please hold. Please hold.']],
 [['Governor-General Vask','ruin',300,'Ruin’s right hand, and his left hand, and several spare hands.'],['Marshal of Endless Parades','ape',20,'The parade has been going for six years. You are in it now.'],['The Politburo Hydra','banner',120,'Cut off one head and the committee votes on two more.'],['Grand Planner of the Gosplan Engine','iron',170,'Every gear in its body has a quota. So do you.'],['The Iron Curtain','iron',210,'It does not move. It does not let you move either.']]];
function chalDef(ri,i,avgL,n){ const C=CHAL[ri][i], base=root.WK?WK.BOSSES[C[1]]:{hp:2070}; const Ld=1+(Math.max(1,avgL)-1)*1.8, hp=Math.round(base.hp*(750+150*Ld)/2250);
 return {bk:C[1],def:{name:C[0],q:C[3],hp,hue:C[2],challenge:true},dmg:n>=4?1:n===3?.85:.7,rew:n>=4?1:n===3?.75:.5}; }
// ---- Requests / suggestions (weekly review)
const TAGS=['technique','combo','physique','game improvement'];
root.SYS={REALMS,soft,expected,attrs,derived,fold,MAJOR,MINOR,RSCALE,physCombos,learnPhys,autoStr,checkMinors,ensure,addInsp,rareInsp,encounter,goldK,RARE,bounties,bountyProgress,TOMES,INCENSE,SHRINE,TITLES,ACH,ACH_PTS,checkAch,achPts,contribution,metrics,rank,CATS,standingsHTML,CHAL,chalDef,TAGS,esc,PHYS_MULT,AFF_MULT,MANA_MOD};
})(typeof window!=='undefined'?window:globalThis);
