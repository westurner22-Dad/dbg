// p20 unified gear (Common/Rare/Epic/Legendary, 6 slots, real stats) + technique discovery recipes (cultivation_13, demo-shortened)
(function(root){
const RAR={Common:1,Rare:1.6,Epic:2.4,Legendary:3.5}, RCOL={Common:'#ccc',Rare:'#4af',Epic:'#c6f',Legendary:'#fa3'};
const SLOTS=['head','armor','arms','legs','main','off'], SLN={head:'Head',armor:'Armor',arms:'Arms',legs:'Legs',main:'Main hand',off:'Off-hand'};
const STN={hp:'HP',def:'Defense',atk:'Attack',mat:'Qi power',spd:'Speed',crit:'Crit',mp:'Mana',foc:'Focus',dodge:'Dodge',mv:'Move',blk:'Block'};
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
const engine=T=>({hp:T.hp+T.def+T.blk*.5+T.dodge*.5,atk:T.atk+T.crit*.5,mat:T.mat+T.crit*.5,mp:T.mp,spd:T.spd+(T.foc>=3?1:0)});
const fmt=st=>Object.keys(st||{}).filter(k=>st[k]).map(k=>INT[k]?`+${st[k]} ${STN[k]}`:`+${Math.round(st[k]*100)}% ${STN[k]}`).join(', ');
// stat treasures: each +2 focus-attribute +1 Aff, shown as real % stats
const treasure=(n,focus,tier)=>{ const t=tier||1, p=2*t; return {k:'treasure',n,focus,st:{hp:.01*p,atk:.01*p,mat:.01*p},gave:`+${2*t} ${focus}, +${t} Aff (+${p}% HP, Attack, Qi power)`}; };
const aiKit=(lvl,rng,n)=>{ const eq={}; const inv=[]; for(let i=0;i<n;i++) equip(eq,inv,rand(rollQ(rng,.05*lvl),lvl,rng)); return eq; };

// ---- discovery recipes (cultivation_13, reachable with demo kits). need = successes; adv opens Foundation+
const R=(n,a,b,path,tier,T)=>({n,in:[a,b].sort(),path,tier,need:tier==='Advanced'?3:2,T:Object.assign({tier:tier==='Advanced'?1.4:1.2,lv:1,ty:path,promo:1},T)});
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
 R('Clear Mind','Focus Breathing','Meditation','Body','Standard',{tg:'self',fx:'mana',pw:0,d:'Restore lots of mana'})];
const VIRTUAL=['Attack','Block','Meditation'], BONUS=5; // p21: demo focus +5 (75% per attempt)
// p21: only combos that can actually become a technique for this cultivator right now
function valid(known,path,realmIdx){ const have=new Set(known.concat(['Attack','Block','Meditation','Focus Breathing']));
 return RECIPES.filter(r=>(r.path===path||(realmIdx>=2&&r.path==='Body'&&path!=='Body'))&&!known.includes(r.n)&&(r.tier==='Standard'||realmIdx>=1)&&r.in.every(i=>have.has(i))); }
// p21 shop stock: realm-scaled equipment + purchasable stat treasures (the only treasures besides weekend-boss chests that raise attributes)
const TRN=[['Spirit Pearl','Qi Gathering'],['Ancestral Jade Seal','Foundation'],['Phoenix Ash Relic','Core'],['Heaven-Root Elixir','Nascent']];
const PRICE={Rare:220,Epic:480,Legendary:950};
function stock(realmIdx,rng,refresh){ rng=rng||Math.random; const m=1+.35*realmIdx+(refresh?.25:0), out=[]; const qs=refresh?['Epic','Epic','Legendary','Legendary']:realmIdx>=2?['Rare','Epic','Epic','Legendary']:['Rare','Rare','Epic','Epic'];
 qs.forEach(q=>{ const g=rand(q,realmIdx+(refresh?1:0),rng); g.price=Math.round(PRICE[q]*m/10)*10; out.push(g); });
 const tn=TRN[Math.min(3,realmIdx)][0]; out.push({k:'shoptr',n:tn,q:'Treasure',tier:1,price:Math.round(380*m/10)*10}); out.push({k:'shoptr',n:'Greater '+tn,q:'Treasure',tier:2,price:Math.round(760*m/10)*10});
 return out; }
const THEME=r=>r.T.fx==='heal'||r.T.fx==='regen'?'something that mends':r.T.fx==='shield'||r.T.fx==='dr'?'something that endures':r.T.fx==='mana'?'a quiet mind':'a partner that strikes harder';
function attempt(known,inputs,realmIdx,rng,prog){ rng=rng||Math.random; const key=inputs.slice().sort(); prog=prog||{};
 const r=RECIPES.find(x=>x.in.length===key.length&&x.in.every((v,i)=>v===key[i])&&!known.includes(x.n));
 if(!r){ const done=RECIPES.find(x=>x.in.join()===key.join()); if(done) return {ok:0,msg:`You already mastered ${done.n}. The pattern is quiet.`};
  const nearly=RECIPES.filter(x=>!known.includes(x.n)&&x.in.some(i=>key.includes(i)));
  if(nearly.length){ const x=nearly[Math.floor(rng()*nearly.length)], i=x.in.find(i=>key.includes(i)); return {ok:0,msg:`The pattern scatters. Your ${i} dreams of ${THEME(x)}…`}; }
  return {ok:0,msg:'The pattern scatters like mist. Nothing answers.'}; }
 if(r.tier==='Advanced'&&realmIdx<1) return {ok:0,msg:'The pattern exists, but your foundation cannot hold it yet (opens in Foundation).'};
 const roll=1+Math.floor(rng()*20), bonus=BONUS, ok=roll+bonus>=11; let p=prog[r.n]||0; if(ok) p++; prog[r.n]=p;
 return {ok:1,r,roll,bonus,hit:ok,prog:p,learned:p>=r.need,msg:`The pattern resonates! d20 ${roll}+${bonus} = ${roll+bonus} ${ok?'≥ 11: progress':'< 11: not yet'} (${Math.min(p,r.need)}/${r.need}).`}; }
function register(FF){ RECIPES.forEach(r=>{ if(!FF.TECH[r.n]) FF.TECH[r.n]=r.T; }); }
const api={valid,stock,PRICE,BONUS,RAR,RCOL,SLOTS,SLN,STN,make,rand,rollQ,norm,equip,totals,engine,fmt,treasure,aiKit,RECIPES,VIRTUAL,attempt,register};
if(typeof module!=='undefined') module.exports=api; root.GEAR=api; if(root.FF) register(root.FF);
})(typeof window!=='undefined'?window:globalThis);
