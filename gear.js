// p20 unified gear (Common/Rare/Epic/Legendary, 6 slots, real stats) + technique discovery recipes (cultivation_13, demo-shortened)
(function(root){
const RAR={Common:1,Rare:1.6,Epic:2.4,Legendary:3.5}, RCOL={Common:'#ccc',Rare:'#4af',Epic:'#c6f',Legendary:'#fa3'};
const SLOTS=['head','armor','arms','legs','main','off'], SLN={head:'Head',armor:'Armor',arms:'Arms',legs:'Legs',main:'Main hand',off:'Off-hand'};
const STN={hp:'HP',def:'Defense',atk:'Attack',mat:'Qi power',spd:'Speed',crit:'Crit',mp:'Mana',foc:'Focus',dodge:'Dodge',mv:'Move',blk:'Block',heal:'Healing',guard:'Guard',ctl:'Control'};
const BASE={armor:{hp:.05,def:.03},main:{atk:.05,mat:.05},main2:{atk:.09,mat:.09},arms:{spd:1,crit:.03},head:{mp:.06,foc:1},legs:{dodge:.03,mv:.5},offS:{blk:.05,def:.03},offT:{mp:.05,mat:.03}};
const NAMES={head:['Jade Circlet','Iron Helm','Sage Hood'],armor:['Iron Vest','Cloud Robe','Scale Coat'],arms:['Jade Bracer','Spirit Band','Tiger Gloves'],legs:['Cloud Boots','Ox Greaves','Wind Leggings'],main:['Jade Sword','Iron Mace','Spirit Fan'],main2:['Willow Bow','Iron Staff','Crescent Glaive'],offS:['Tower Shield','Bronze Buckler'],offT:['Spirit Talisman','Ash Charm']};
const KINDS=Object.keys(BASE), INT={spd:1,foc:1,mv:1};
function make(kind,q,lvl,rng){ rng=rng||Math.random; q=RAR[q]?q:'Common'; const m=RAR[q]*(1+.25*(lvl||0)), st={};
 for(const [k,v] of Object.entries(BASE[kind])){ const x=v*m; st[k]=INT[k]?Math.floor(x+(k==='mv'?0:.5)):+x.toFixed(3); if(!st[k]) delete st[k]; }
 const slot=kind==='main2'?'main':kind.startsWith('off')?'off':kind, nm=NAMES[kind][Math.floor(rng()*NAMES[kind].length)];
 return {k:'gear',slot,two:kind==='main2',n:(q==='Common'?'':q+' ')+nm+(lvl?' +'+lvl:''),q,st,val:Math.round(12*RAR[q]*(1+.5*(lvl||0)))}; }
const rand=(q,lvl,rng)=>{ rng=rng||Math.random; return make(KINDS[Math.floor(rng()*KINDS.length)],q,lvl,rng); };
const rollQ=(rng,boost)=>{ const r=(rng||Math.random)()+(boost||0); return r>1.05?'Legendary':r>.9?'Epic':r>.65?'Rare':'Common'; };
// legacy {bonus} items (Sect Conquest drops, p19 saves) -> slotted
function norm(it,lvl){ if(!it||it.k!=='gear'||it.slot) return it; const n=it.n||'', b=it.bonus||.03;
 const kind=/Bracer|Band|Glove/.test(n)?'arms':/Vest|Robe|Coat/.test(n)?'armor':/Boot|Greave/.test(n)?'legs':/Helm|Hood|Circlet/.test(n)?'head':/Bow|Staff|Glaive/.test(n)?'main2':/Shield/.test(n)?'offS':'main';
 const q=it.q&&RAR[it.q]?it.q:b>=.14?'Legendary':b>=.09?'Epic':b>=.06?'Rare':'Common'; const g=make(kind,q,lvl||0,()=>.4); g.n=n.replace(/ \+\d+$/,'')+(lvl?' +'+lvl:''); if(q!=='Common'&&!g.n.startsWith(q)) g.n=q+' '+g.n; return g; }
function equip(eq,inv,it){ const out=[]; const put=s=>{ if(eq[s]){ out.push(eq[s]); eq[s]=null; } };
 put(it.slot); if(it.two) put('off'); if(it.slot==='off'&&eq.main&&eq.main.two) put('main'); eq[it.slot]=it; out.forEach(x=>inv.push(x)); return out; }
function totals(eq,trs){ const T={}; Object.keys(STN).forEach(k=>T[k]=0); SLOTS.forEach(s=>{ const g=eq&&eq[s]; if(g) for(const k in g.st) T[k]+=g.st[k]; });
 (trs||[]).forEach(t=>{ for(const k in (t.st||{})) T[k]+=t.st[k]; }); Object.keys(T).forEach(k=>T[k]=+T[k].toFixed(3)); return T; }
// what the battle engines read: hp (HP+Defense+Block as effective HP), atk, mat, mp, spd
const engine=(T,eq)=>{ const o={hp:T.hp+T.def+T.blk*.5+T.dodge*.5,atk:T.atk+T.crit*.5,mat:T.mat+T.crit*.5,mp:T.mp,spd:T.spd+(T.foc>=3?1:0),heal:T.heal||0,guard:T.guard||0,ctl:T.ctl||0}; const r=kitRole(eq); if(r){ o.role=r.role; o.kitN=r.n; } return o; };
// p22 role kits: any path can tank / heal / control by wearing 2+ pieces of one kit (3 = full set bonus)
const KITS={tank:{nm:'Bastion',ic:'🛡️',lab:'Tank',d:'HP, Defense, Guard (damage reduction). Grants Challenge: the boss must hit you.',pc:[['head','Helm',{hp:.05,def:.04,guard:.03}],['armor','Plate',{hp:.08,def:.05,guard:.04}],['off','Wall Shield',{blk:.06,def:.05,guard:.05}]]},
 healer:{nm:'Mercy',ic:'✚',lab:'Healer',d:'Healing power and Mana. Grants Mending Rite: a strong heal any path can cast.',pc:[['head','Hood',{mp:.06,heal:.10}],['main','Censer Staff',{mat:.05,heal:.12}],['off','Lotus Charm',{mp:.06,heal:.10}]]},
 ctrl:{nm:'Fate',ic:'⌛',lab:'Controller',d:'Speed and Control. Grants Binding Seal: slows the boss and pushes back its turn gauge.',pc:[['arms','Binding Cuffs',{spd:1,ctl:.10}],['legs','Wind Boots',{spd:1,dodge:.03,ctl:.08}],['main','Fan',{mat:.04,spd:1,ctl:.10}]]}};
const KITART={tank:'Challenge',healer:'Mending Rite',ctrl:'Binding Seal'};
function kitRole(eq){ if(!eq) return null; const n={}; SLOTS.forEach(s=>{ const g=eq[s]; if(g&&g.role) n[g.role]=(n[g.role]||0)+1; }); let best=null; for(const k in n) if(n[k]>=2&&(!best||n[k]>best.n)) best={role:k,n:n[k]}; return best; }
const KQ=['Rare','Epic','Legendary'], KPRICE={Rare:150,Epic:330,Legendary:640};
function kitPiece(role,i,q,ri){ const K=KITS[role], [slot,nm,b]=K.pc[i], m=RAR[q]*(1+.25*ri), st={}; for(const [k,v] of Object.entries(b)){ const x=v*m; st[k]=INT[k]?Math.max(1,Math.floor(x/RAR[q]+(q==='Legendary'?1:q==='Epic'?.5:0))):+x.toFixed(3); }
 return {k:'gear',slot,two:false,role,n:`${q} ${K.nm} ${nm}${ri?' +'+ri:''}`,q,st,val:Math.round(12*RAR[q]*(1+.5*ri))}; }
// p22 treasure sets: one 4-piece set per realm, tiered prices; every earlier realm's set stays on sale
const TSET=[['Qi Gathering',['Spirit Pearl','Jade Marrow','Cloud Lotus','Pearl of the First Breath']],['Foundation',['Ancestral Jade Seal','Iron Root','Thunder Bone','Seal of the Founding Mountain']],['Core',['Phoenix Ash Relic','Golden Core Pill','Star Iron Heart','Phoenix’s Last Feather']],['Nascent',['Heaven-Root Elixir','Soul Lantern','Void Pearl','Crown of the Nascent Soul']]];
const TBASE=[120,220,360,540], TST=[{hp:.03,def:.02},{atk:.03,mat:.03},{heal:.04,spd:1,ctl:.03},{hp:.03,atk:.02,mat:.02,guard:.02}];
const tmult=ri=>1+.6*ri;
function tsetItem(ri,i){ return {k:'shoptr',set:ri,idx:i,n:TSET[ri][1][i],q:'Treasure',tier:i+1,price:Math.round(TBASE[i]*tmult(ri)/10)*10}; }
function tsetStats(ri,i){ const st={}, b=TST[i], k=1+.5*ri; for(const x in b) st[x]=INT[x]?b[x]:+(b[x]*k).toFixed(3); return st; };
const fmt=st=>Object.keys(st||{}).filter(k=>st[k]).map(k=>INT[k]?`+${st[k]} ${STN[k]}`:`+${Math.round(st[k]*100)}% ${STN[k]}`).join(', ');
// stat treasures: each +2 focus-attribute +1 Aff, shown as real % stats
const treasure=(n,focus,tier,extra)=>{ const t=tier||1, p=2*t, st={hp:.01*p,atk:.01*p,mat:.01*p}; if(extra) for(const k in extra) st[k]=+((st[k]||0)+extra[k]).toFixed(3); return {k:'treasure',n,focus,st,gave:`+${2*t} ${focus}, +${t} Aff · ${fmt(st)}`}; };
const aiKit=(lvl,rng,n)=>{ const eq={}; const inv=[]; for(let i=0;i<n;i++) equip(eq,inv,rand(rollQ(rng,.05*lvl),lvl,rng)); return eq; };

// ---- discovery recipes (cultivation_13, reachable with demo kits). need = successes; adv opens Foundation+
const TIER_RI={Standard:0,Advanced:1,Master:2,Ascendant:3}, TIER_COST={Standard:1.2,Advanced:1.4,Master:1.6,Ascendant:1.8};
const R=(n,a,b,path,tier,T)=>({n,in:[a,b].sort(),path,tier,need:tier==='Standard'?2:3,T:Object.assign({tier:TIER_COST[tier],lv:1,ty:path,promo:1,ptier:tier},T)});
const RECIPES=[
 R('Solar Lance','Light Bolt','Purifying Flash','Light','Standard',{tg:'foe',pw:2.4,d:'Piercing light spear (55)'}),
 R('Sanctuary Field','Healing Light','Radiant Guard','Light','Standard',{tg:'ally',fx:'heal',pw:1.6,d:'Heal the whole party'}),
 R('Radiant Hammer','Light Bolt','Attack','Light','Standard',{tg:'foe',pw:2.3,phys:1,d:'Holy weapon blow (55)'}),
 R('Dawn Breath','Healing Light','Focus Breathing','Light','Standard',{tg:'ally',fx:'regen',pw:1.2,d:'Heal + regen'}),
 R('Prism Volley','Solar Lance','Light Bolt','Light','Advanced',{tg:'foe',pw:2.9,d:'Three prism bolts (70)'}),
 R('Mercy of Dawn','Healing Light','Meditation','Light','Advanced',{tg:'ally',fx:'heal',pw:2.2,d:'Great party heal'}),
 R('Momentum Breaker','Force Punch','Momentum Strike','Force','Standard',{tg:'foe',pw:2.4,phys:1,d:'Crushing combo (55)'}),
 R('Phantom Assault','Shock Dash','Afterimage Stance','Force','Standard',{tg:'foe',pw:2.2,phys:1,d:'Blink strike (50)'}),
 R('Unmoving Stance','Afterimage Stance','Block','Force','Advanced',{tg:'ally',fx:'dr',pw:0,d:'Halve damage taken'}),
 R('Storm Fist','Momentum Breaker','Force Punch','Force','Advanced',{tg:'foe',pw:2.9,phys:1,d:'Multi-hit storm (70)'}),
 R('Collapsed Star','Gravity Crush','Gravity Well','Mass','Standard',{tg:'foe',pw:2.4,slow:1,d:'Gravity implosion (55)'}),
 R('Granite Guard','Stone Skin','Block','Mass','Standard',{tg:'ally',fx:'shield',pw:1.4,d:'Big stone shield'}),
 R('Life From Stone','Earthen Renewal','Meditation','Mass','Standard',{tg:'ally',fx:'heal',pw:1.8,d:'Strong heal'}),
 R('Crushing Fist','Gravity Crush','Attack','Mass','Standard',{tg:'foe',pw:2.3,phys:1,d:'Heavy fist (55)'}),
 R('Meteor Hammer','Crushing Fist','Gravity Crush','Mass','Advanced',{tg:'foe',pw:2.9,phys:1,d:'Meteor blow (70)'}),
 R('Eternal Mountain','Granite Guard','Earthen Renewal','Mass','Advanced',{tg:'ally',fx:'shield',pw:1.6,d:'Party stone shield'}),
 R('Feint','Combat Insight','Kick','Body','Standard',{tg:'foe',pw:0,fx:'crit',d:'Fake-out: next hit crits'}),
 R('Iron Rush','Kick','Attack','Body','Standard',{tg:'foe',pw:2.4,phys:1,d:'Charging blow (55)'}),
 R('Hundred Fists','Iron Rush','Kick','Body','Advanced',{tg:'foe',pw:2.9,phys:1,d:'Multi-hit flurry (70)'}),
 R('Breaking Palm','Force Punch','Attack','Force','Standard',{tg:'foe',pw:2.3,phys:1,d:'Bone-rattling palm (55)'}),
 R('Rebound Guard','Shock Dash','Block','Force','Standard',{tg:'ally',fx:'dr',pw:0,d:'Ally takes less damage'}),
 R('Titan Palm','Breaking Palm','Force Punch','Force','Advanced',{tg:'foe',pw:2.9,phys:1,d:'Mountain-splitting palm (70)'}),
 R('Bulwark Charge','Rebound Guard','Shock Dash','Force','Advanced',{tg:'ally',fx:'shield',pw:1.6,d:'Charge in and shield an ally'}),
 R('Radiant Judgment','Radiant Hammer','Light Bolt','Light','Advanced',{tg:'foe',pw:2.9,phys:1,d:'Judgment of light (70)'}),
 R('Thousand Feints','Feint','Iron Rush','Body','Advanced',{tg:'foe',pw:2.8,phys:1,d:'Feint-into-flurry (70)'}),
 // p22 Core (Master) and Nascent (Ascendant) patterns — reachable from each path's own starters + earlier discoveries
 R('Dragon Kick','Hundred Fists','Kick','Body','Master',{tg:'foe',pw:3.2,phys:1,d:'Spinning dragon kick (80)'}),
 R('Iron Body','Iron Rush','Block','Body','Master',{tg:'ally',fx:'dr',pw:0,d:'Ally takes far less damage'}),
 R('Still Water Mind','Clear Mind','Combat Insight','Body','Master',{tg:'self',fx:'crit',d:'Calm focus: next hit crits'}),
 R('Heaven-Splitting Fist','Dragon Kick','Thousand Feints','Body','Ascendant',{tg:'foe',pw:3.7,phys:1,d:'The fist that splits the sky (95)'}),
 R('Void Step','Feint','Meditation','Body','Ascendant',{tg:'self',fx:'dodge',d:'Step out of the next blow'}),
 R('Quake Palm','Titan Palm','Shock Dash','Force','Master',{tg:'all',pw:1.5,phys:1,d:'Palm shockwave hits every foe'}),
 R('Immovable Wall','Bulwark Charge','Block','Force','Master',{tg:'ally',fx:'shield',pw:2.0,d:'Huge shield on an ally'}),
 R('Comet Dash','Breaking Palm','Shock Dash','Force','Master',{tg:'foe',pw:2.7,phys:1,first:1,d:'Acts first, hits hard (65)'}),
 R('Heavenfall Palm','Quake Palm','Titan Palm','Force','Ascendant',{tg:'foe',pw:3.7,phys:1,d:'Palm like a falling sky (95)'}),
 R('Aegis of Momentum','Immovable Wall','Rebound Guard','Force','Ascendant',{tg:'ally',fx:'shield',pw:2.4,d:'Unbreakable momentum shield'}),
 R('Sunburst','Dawn Breath','Radiant Judgment','Light','Master',{tg:'all',pw:1.5,d:'Burst of sunlight hits every foe'}),
 R('Halo of Mercy','Dawn Breath','Mercy of Dawn','Light','Master',{tg:'ally',fx:'heal',pw:2.6,d:'Great heal'}),
 R('Blinding Dawn','Clear Mind','Light Bolt','Light','Master',{tg:'foe',pw:1.9,slow:1,d:'Blinding bolt: target acts last'}),
 R('Heaven’s Verdict','Radiant Judgment','Sunburst','Light','Ascendant',{tg:'foe',pw:3.7,d:'Verdict of heaven (95)'}),
 R('Eternal Dawn','Halo of Mercy','Healing Light','Light','Ascendant',{tg:'ally',fx:'regen',pw:1.6,d:'Long, strong regeneration'}),
 R('Mountain Crush','Crushing Fist','Meteor Hammer','Mass','Master',{tg:'all',pw:1.4,phys:1,slow:1,d:'Crush every foe and slow them'}),
 R('Bedrock Ward','Granite Guard','Stone Skin','Mass','Master',{tg:'ally',fx:'shield',pw:2.0,d:'Bedrock shield'}),
 R('Gravity Lock','Clear Mind','Gravity Crush','Mass','Master',{tg:'foe',pw:1.9,slow:1,d:'Pin the target: acts last'}),
 R('Collapse of Heaven','Meteor Hammer','Mountain Crush','Mass','Ascendant',{tg:'foe',pw:3.7,phys:1,d:'Bring the sky down (95)'}),
 R('World Pillar','Bedrock Ward','Granite Guard','Mass','Ascendant',{tg:'ally',fx:'dr',pw:0,d:'Become the pillar: ally takes far less damage'}),
 R('Gravity Mantle','Granite Guard','Gravity Crush','Mass','Advanced',{tg:'ally',fx:'shield',pw:1.7,d:'Gravity bends blows away from an ally'}),
 R('Gathering Fist','Force Punch','Focus Breathing','Force','Standard',{tg:'self',fx:'crit',d:'Gather force: next hit crits'}),
 R('Lantern Breath','Light Bolt','Focus Breathing','Light','Standard',{tg:'self',fx:'mana',d:'Breathe light: restore Mana'}),
 R('Gravity Guard','Gravity Crush','Block','Mass','Standard',{tg:'ally',fx:'shield',pw:1.3,d:'Bent gravity shields an ally'}),
 R('Clear Mind','Focus Breathing','Meditation','Body','Standard',{tg:'self',fx:'mana',pw:0,d:'Restore lots of mana'})];
const VIRTUAL=['Attack','Block','Meditation'], BONUS=5; // p21: demo focus +5 (75% per attempt)
// p21: only combos that can actually become a technique for this cultivator right now
function valid(known,path,realmIdx){ const have=new Set(known.concat(['Attack','Block','Meditation','Focus Breathing']));
 return RECIPES.filter(r=>(r.path===path||(realmIdx>=2&&r.path==='Body'&&path!=='Body'))&&!known.includes(r.n)&&realmIdx>=TIER_RI[r.tier]&&r.in.every(i=>have.has(i))); }
// p21 shop stock: realm-scaled equipment + purchasable stat treasures (the only treasures besides weekend-boss chests that raise attributes)
const TRN=[['Spirit Pearl','Qi Gathering'],['Ancestral Jade Seal','Foundation'],['Phoenix Ash Relic','Core'],['Heaven-Root Elixir','Nascent']];
const PRICE={Rare:220,Epic:480,Legendary:950};
// p22 shop-only arts (any realm gate) + kit arts granted by role gear
const ARTS={
 'Wind Step':{path:'Body',ri:1,tier:1.2,lv:1,tg:'self',fx:'dodge',d:'Dodge the next attack'},'Crane Strike':{path:'Body',ri:2,tier:1.4,lv:1,tg:'foe',pw:2.7,phys:1,d:'Precise crane strike (65)'},
 'Shockwave':{path:'Force',ri:1,tier:1.4,lv:1,tg:'all',pw:1.0,phys:1,d:'Hit every foe 1.0x'},'Bulwark Oath':{path:'Force',ri:2,tier:1.2,lv:1,tg:'ally',fx:'dr',pw:0,d:'Ally takes less damage'},
 'Lantern Ward':{path:'Light',ri:1,tier:1.2,lv:1,tg:'ally',fx:'shield',pw:1.8,d:'Lantern shield on an ally'},'Starfall':{path:'Light',ri:2,tier:1.5,lv:1,tg:'all',pw:1.3,d:'Stars hit every foe 1.3x'},
 'Tremor':{path:'Mass',ri:1,tier:1.3,lv:1,tg:'all',pw:.9,slow:1,d:'Hit all 0.9x and slow'},'Mountain Heart':{path:'Mass',ri:2,tier:1.3,lv:1,tg:'ally',fx:'regen',pw:1.0,d:'Ally regenerates strongly'}};
const KITT={'Mending Rite':{tier:1.2,lv:1,tg:'ally',fx:'heal',pw:2.0,kit:'healer',d:'Kit art (Mercy gear): strong heal, scales with Healing'},
 'Binding Seal':{tier:1.2,lv:1,tg:'foe',pw:.6,slow:1,bind:1,kit:'ctrl',d:'Kit art (Fate gear): slow the boss and push back its turn gauge'}};
const ARTPRICE=a=>Math.round((a.ri===1?260:420)*(1+.35*a.ri)/10)*10;
// p22 technique ranks: some trees are short (2), some deep (4). Rank n+1 opens at realm n-1 (rank 3 Foundation, rank 4 Core).
function rankMax(t,FF){ const r=RECIPES.find(x=>x.n===t); if(r) return {Standard:3,Advanced:4,Master:3,Ascendant:2}[r.tier]; if(ARTS[t]) return 2; if(KITT[t]) return 1; for(const p in FF.STARTERS) if(FF.STARTERS[p].includes(t)) return 4; return 3; }
const rankMul=r=>1+.15*((r||1)-1);
function rankCost(t,r,ri,FF){ const mx=rankMax(t,FF), base=mx>=4?110:mx===3?150:220; return Math.round(base*r*(1+.35*(ri||0))/10)*10; }
const rankGate=r=>Math.max(0,r-1); // realm needed to buy rank r+1
function kitStock(ri,refresh){ const qs=[['Rare'],['Rare','Epic'],['Epic','Legendary'],['Epic','Legendary']][Math.min(3,ri)], m=1+.35*ri+(refresh?.25:0), out=[];
 Object.keys(KITS).forEach(role=>qs.forEach(q=>KITS[role].pc.forEach((_,i)=>{ const g=kitPiece(role,i,q,ri+(refresh?1:0)); g.price=Math.round(KPRICE[q]*m/10)*10; out.push(g); }))); return out; }
function stock(realmIdx,rng,refresh){ rng=rng||Math.random; const m=1+.35*realmIdx+(refresh?.25:0), out=[]; const qs=refresh?['Epic','Epic','Legendary','Legendary']:realmIdx>=2?['Rare','Epic','Epic','Legendary']:['Rare','Rare','Epic','Epic'];
 qs.forEach(q=>{ const g=rand(q,realmIdx+(refresh?1:0),rng); g.price=Math.round(PRICE[q]*m/10)*10; out.push(g); });
 return out.concat(kitStock(realmIdx,refresh)); }
const THEME=r=>r.T.fx==='heal'||r.T.fx==='regen'?'something that mends':r.T.fx==='shield'||r.T.fx==='dr'?'something that endures':r.T.fx==='mana'?'a quiet mind':'a partner that strikes harder';
function attempt(known,inputs,realmIdx,rng,prog){ rng=rng||Math.random; const key=inputs.slice().sort(); prog=prog||{};
 const r=RECIPES.find(x=>x.in.length===key.length&&x.in.every((v,i)=>v===key[i])&&!known.includes(x.n));
 if(!r){ const done=RECIPES.find(x=>x.in.join()===key.join()); if(done) return {ok:0,msg:`You already mastered ${done.n}. The pattern is quiet.`};
  const nearly=RECIPES.filter(x=>!known.includes(x.n)&&x.in.some(i=>key.includes(i)));
  if(nearly.length){ const x=nearly[Math.floor(rng()*nearly.length)], i=x.in.find(i=>key.includes(i)); return {ok:0,msg:`The pattern scatters. Your ${i} dreams of ${THEME(x)}…`}; }
  return {ok:0,msg:'The pattern scatters like mist. Nothing answers.'}; }
 if(realmIdx<TIER_RI[r.tier]) return {ok:0,msg:`The pattern exists, but your realm cannot hold it yet (opens in ${['Qi Gathering','Foundation','Core','Nascent'][TIER_RI[r.tier]]}).`};
 const roll=1+Math.floor(rng()*20), bonus=BONUS, ok=roll+bonus>=11; let p=prog[r.n]||0; if(ok) p++; prog[r.n]=p;
 return {ok:1,r,roll,bonus,hit:ok,prog:p,learned:p>=r.need,msg:`The pattern resonates! d20 ${roll}+${bonus} = ${roll+bonus} ${ok?'≥ 11: progress':'< 11: not yet'} (${Math.min(p,r.need)}/${r.need}).`}; }
function register(FF){ RECIPES.forEach(r=>{ if(!FF.TECH[r.n]) FF.TECH[r.n]=r.T; }); for(const k in ARTS) if(!FF.TECH[k]) FF.TECH[k]=ARTS[k]; for(const k in KITT) if(!FF.TECH[k]) FF.TECH[k]=KITT[k]; }
const api={KITS,KITART,KITT,kitRole,kitPiece,kitStock,TSET,tsetItem,tsetStats,TIER_RI,ARTS,ARTPRICE,rankMax,rankMul,rankCost,rankGate,valid,stock,PRICE,BONUS,RAR,RCOL,SLOTS,SLN,STN,make,rand,rollQ,norm,equip,totals,engine,fmt,treasure,aiKit,RECIPES,VIRTUAL,attempt,register};
if(typeof module!=='undefined') module.exports=api; root.GEAR=api; if(root.FF) register(root.FF);
})(typeof window!=='undefined'?window:globalThis);
