// Qi realm: Pokémon Red-style 1v1 battles — your cultivator alone vs a wild spirit beast. Engine is pure (sim-able); UI below.
(function(root){
const FF=root.FF||(typeof require!=='undefined'?require('./ff.js').FF:null);
const sc=L=>1+0.2*(L-1);
// Type chart: Light > Mass > Force > Light (2x), reverse 0.5x; Body (beast/physical) is neutral to and from everything.
const BEATS={Light:'Mass',Mass:'Force',Force:'Light'};
function eff(atk,def){ if(BEATS[atk]===def) return 2; if(BEATS[def]===atk) return .5; return 1; }
const BEASTS=[
 {n:'Ember Fox',em:'🦊',ty:'Light',hp:.9,atk:1.05,spd:12,mv:'Fox Fire'},{n:'Moon Rabbit',em:'🐇',ty:'Light',hp:.8,atk:.95,spd:13,mv:'Moonbeam'},
 {n:'Stone Tortoise',em:'🐢',ty:'Mass',hp:1.4,atk:.8,spd:6,mv:'Rock Shell'},{n:'Jade Serpent',em:'🐍',ty:'Mass',hp:1.0,atk:1.0,spd:10,mv:'Jade Coil'},
 {n:'Gale Hawk',em:'🦅',ty:'Force',hp:.85,atk:1.1,spd:14,mv:'Gale Dive'},{n:'Thunder Boar',em:'🐗',ty:'Force',hp:1.2,atk:1.05,spd:8,mv:'Thunder Charge'},
 {n:'Iron Ape',em:'🦍',ty:'Body',hp:1.15,atk:1.0,spd:9,mv:'Iron Fist'}];
const TRAINER_BEAST={n:'Red Banner Wolf',em:'🐺',ty:'Force',hp:1.08,atk:1.13,spd:11,mv:'Banner Howl'};
const MOVE_TYPE=t=>FF.KIT.Light.includes(t)?'Light':FF.KIT.Force.includes(t)?'Force':FF.KIT.Mass.includes(t)?'Mass':'Body';
const PB={Body:{hp:.83,dm:.83},Force:{hp:.9,dm:.9},Light:{hp:1.2,dm:1.2},Mass:{hp:1.3,dm:1.3}};
function moves(path,L){ return ['Attack'].concat(FF.KIT[path].filter(t=>t!=='Focus Breathing'&&FF.TECH[t].lv<=L).slice(0,3)); }
function newBattle(o){ const p=FF.PATHS[o.path], L=o.L, rng=o.rng||Math.random;
  const me={name:o.name||'You',path:o.path,em:p.em,L,mx:Math.round(PB[o.path].hp*300*Math.max(1.05,p.hp)*1.45*sc(L)*(1+(o.gear||0))),mmp:Math.round(100*p.mp*sc(L)),atk:Math.round(80*p.atk*sc(L)*(1+(o.gear||0))),mat:Math.round(80*p.mat*sc(L)*(1+(o.gear||0))),spd:p.spd+1,shield:0,dr:0,crit:0,dodge:0};
  me.hp=Math.max(1,Math.round((o.hpFrac??1)*me.mx)); me.mp=Math.round((o.mpFrac??1)*me.mmp); me.moves=moves(o.path,L);
  const B=o.trainer?TRAINER_BEAST:BEASTS[Math.floor(rng()*BEASTS.length)], bl=Math.max(1,L+(o.trainer?1:Math.floor(rng()*3)-1));
  const foe={name:B.n,em:B.em,ty:B.ty,L:bl,mx:Math.round(420*B.hp*sc(bl)*(.98+.008*(L-1))),atk:Math.round(54*B.atk*sc(bl)*(.98+.008*(L-1))),spd:B.spd,mv:B.mv,slow:0}; foe.hp=foe.mx;
  return {me,foe,rng,turn:0,over:false,result:null,runs:0,bag:Object.assign({},o.bag||{}),trainer:!!o.trainer}; }
const cost=(b,t)=>t==='Attack'?0:Math.round(FF.TECH[t].tier*.1*b.me.mmp);
function dmgTo(b,base,pw,ty,defTy,lines,target){ const e=eff(ty,defTy); let d=base*pw*e*(0.85+b.rng()*.3); const crit=b.rng()<.0625; if(crit) d*=1.5; d=Math.max(1,Math.round(d)); return {d,e,crit}; }
// player action: {k:'move',t} | {k:'item',t} | {k:'meditate'} | {k:'run'}; returns lines [{t, fx}] where fx mutates display state
function turn(b,act){ const L=[], me=b.me, f=b.foe; b.turn++;
  const say=(t,fx)=>L.push({t,fx});
  const meFirst=act.k!=='move'||f.slow?true:(me.spd+(b.rng()-.5)*2>=f.spd); f.slow=Math.max(0,f.slow-1);
  const mine=()=>{ if(act.k==='run'){ b.runs++; const ch=Math.min(1,me.spd/f.spd*.55+.25*b.runs); if(b.trainer){ say("No! There's no running from a trainer battle!"); return; } if(b.rng()<ch){ say('Got away safely!'); b.over=true; b.result='run'; } else say("Can't escape!"); return; }
    if(act.k==='meditate'){ const g=Math.round(.15*me.mmp); me.mp=Math.min(me.mmp,me.mp+g); say(`${me.name} used Focus Breathing! Regained ${g} MP.`); return; }
    if(act.k==='item'){ if(!(b.bag[act.t]>0)){ say(`No ${act.t} left!`); return; } b.bag[act.t]--; if(act.t==='Healing Potion'){ const h=Math.round(.5*me.mx); me.hp=Math.min(me.mx,me.hp+h); say(`${me.name} used a Healing Potion! Recovered ${h} HP.`); } else { const m=Math.round(.3*me.mmp); me.mp=Math.min(me.mmp,me.mp+m); say(`${me.name} used a Focus Crystal! Regained ${m} MP.`); } return; }
    const t=act.t, T=FF.TECH[t]||{pw:1,phys:1}, c=cost(b,t); if(me.mp<c){ say(`Not enough mana for ${t}!`); return; } me.mp-=c; say(`${me.name} used ${t}!`);
    if(T.fx==='heal'){ const h=Math.min(Math.round(.35*me.mx),Math.round(me.mat*T.pw)); me.hp=Math.min(me.mx,me.hp+h); say(`${me.name} recovered ${h} HP!`); return; }
    if(T.fx==='shield'){ me.shield=Math.min(Math.round(.35*me.mx),Math.round(me.mat*T.pw)); say(`A radiant shield absorbs ${me.shield} damage!`); return; }
    if(T.fx==='dr'){ me.dr=3; say(`${me.name}'s skin turned to stone!`); return; } if(T.fx==='regen'){ me.regen=3; me.regenAmt=Math.round(me.mat*T.pw); say(`${me.name} draws strength from the earth!`); return; }
    if(T.fx==='crit'){ me.crit=1; say(`${me.name} is focusing on a weak point!`); return; } if(T.fx==='dodge'||T.fx==='dodge25'){ me.dodge=1; say(`${me.name}'s form flows like water!`); return; }
    const ty=MOVE_TYPE(t), r=dmgTo(b,T.phys||t==='Attack'?me.atk:me.mat,T.pw||1,ty,f.ty); let d=Math.round(r.d*PB[me.path].dm); if(me.crit&&(T.phys||t==='Attack')){ d*=2; me.crit=0; r.crit=1; }
    f.hp=Math.max(0,f.hp-d); say(null,{hit:'foe',d});
    if(r.crit) say('A critical hit!'); if(r.e>1) say("It's super effective!"); if(r.e<1) say("It's not very effective...");
    if((T.slow||t==='Kick')&&f.hp>0){ f.slow=1; say(`${f.name} was slowed!`); } };
  const theirs=()=>{ if(b.over||f.hp<=0) return; const special=b.rng()<.35, pw=special?1.3:1, ty=special?f.ty:'Body';
    say(`${b.trainer?'':'Wild '}${f.name} used ${special?f.mv:'Tackle'}!`); if(me.dodge){ me.dodge=0; say(`${me.name} dodged!`); return; }
    const r=dmgTo(b,f.atk,pw,ty,me.path==='Body'?'Body':me.path); let d=r.d; if(me.dr>0) d=Math.round(d*.8); if(me.shield){ const s=Math.min(me.shield,d); me.shield-=s; d-=s; }
    me.hp=Math.max(0,me.hp-d); say(null,{hit:'me',d}); if(r.crit) say('A critical hit!'); if(r.e>1) say("It's super effective!"); if(r.e<1) say("It's not very effective..."); };
  if(meFirst){ mine(); check(b,say); theirs(); } else { theirs(); check(b,say); mine(); } check(b,say);
  if(!b.over){ if(me.regen>0){ me.regen--; me.hp=Math.min(me.mx,me.hp+me.regenAmt); say(`${me.name} regained health from the earth.`); } if(me.dr>0) me.dr--; }
  return L; }
function check(b,say){ if(b.over) return; if(b.foe.hp<=0){ b.over=true; b.result='win'; say(`${b.trainer?'':'Wild '}${b.foe.name} fainted!`); } else if(b.me.hp<=0){ b.over=true; b.result='loss'; say(`${b.me.name} fainted!`); say(`${b.me.name} blacked out!`); } }
function ai(b){ const me=b.me, f=b.foe; if(me.hp/me.mx<.3&&(b.bag['Healing Potion']||0)>0) return {k:'item',t:'Healing Potion'};
  if(me.hp/me.mx<.45&&me.moves.includes('Healing Light')&&me.mp>=cost(b,'Healing Light')) return {k:'move',t:'Healing Light'};
  let best='Attack', bv=0; for(const t of me.moves){ const T=FF.TECH[t]||{pw:1,phys:1}; if(!T.pw||T.tg==='ally'||me.mp<cost(b,t)) continue; const v=(T.phys||t==='Attack'?me.atk:me.mat)*T.pw*eff(MOVE_TYPE(t),f.ty); if(v>bv){ bv=v; best=t; } }
  if(best==='Attack'&&me.mp<.2*me.mmp) return {k:'meditate'}; return {k:'move',t:best}; }
const api={PB,BEASTS,TRAINER_BEAST,BEATS,eff,MOVE_TYPE,newBattle,turn,ai,cost};
// ---------------- UI ----------------
if(typeof document!=='undefined'){
 let b,ui,cb,q=[],menu='main',cur=0,disp={me:0,foe:0},anim=0;
 const $=s=>ui.querySelector(s);
 function bar(n,m){ const f=n/m; return `<div class=pkhp><span>HP</span><i><b style="width:${100*f}%;background:${f>.5?'#3c3':f>.2?'#ec3':'#e33'}"></b></i></div>`; }
 function render(){ const me=b.me,f=b.foe;
  $('#pkfb').innerHTML=`<div class=pkn>${f.name.toUpperCase()}</div><div class=pkl>:L${f.L} <small>${f.ty}</small></div>${bar(disp.foe,f.mx)}`;
  $('#pkmb').innerHTML=`<div class=pkn>${me.name.toUpperCase()}</div><div class=pkl>:L${me.L} <small>${me.path}</small></div>${bar(disp.me,me.mx)}<div class=pkhn>${Math.round(disp.me)}/ ${me.mx}<br><small>MP ${me.mp}/${me.mmp}</small></div>`; }
 function drain(){ let go=false; for(const k of ['me','foe']){ const tgt=b[k].hp; if(Math.abs(disp[k]-tgt)>.5){ disp[k]+=(tgt-disp[k])*.18+(tgt>disp[k]?1:-1)*Math.max(1,b[k].mx/120); if((tgt-disp[k])*(tgt>disp[k]?1:-1)<0) disp[k]=tgt; go=true; } else disp[k]=tgt; }
  render(); if(go) anim=requestAnimationFrame(drain); else anim=0; }
 function blink(id){ const s=$(id); let n=0; const t=setInterval(()=>{ s.style.visibility=n%2?'visible':'hidden'; if(++n>5){ clearInterval(t); s.style.visibility='visible'; } },90); }
 function text(t){ $('#pkt').innerHTML=`<div class=pktx>${t}${q.length||b.over?' ▼':''}</div>`; menu='text'; }
 function next(){ if(menu!=='text') return; while(q.length){ const l=q.shift(); if(l.fx&&l.fx.hit){ blink(l.fx.hit==='foe'?'#pkfs':'#pkms'); cancelAnimationFrame(anim); drain(); if(!l.t) continue; } if(l.t){ return text(l.t); } }
  if(b.over) return finish(); showMain(); }
 function push(lines){ q.push(...lines); next(); }
 const MAIN=['FIGHT','ITEM','MEDITATE','RUN'];
 function grid(items,sel){ return `<div class=pkm>${items.map((it,i)=>`<div class="pki ${i===cur?'on':''}" onclick="PK._tap(${i})">${i===cur?'▶':'&nbsp;'}${it}</div>`).join('')}</div>`; }
 function showMain(){ menu='main'; cur=Math.min(cur,3); $('#pkt').innerHTML=`<div class=pktx2>What will<br>${b.me.name} do?</div>`+grid(MAIN); }
 function showMoves(){ menu='moves'; const ms=b.me.moves; cur=Math.min(cur,ms.length-1); const t=ms[cur];
  $('#pkt').innerHTML=grid(ms.map(m=>m.replace('Combat Insight','Insight').replace('Afterimage Stance','Afterimage')))+`<div class=pkinfo>TYPE/ ${api.MOVE_TYPE(t)}<br>MP ${api.cost(b,t)}/${b.me.mp}</div>`; }
 function showItems(){ menu='items'; const ks=['Healing Potion','Focus Crystal']; cur=Math.min(cur,1); $('#pkt').innerHTML=grid(ks.map(k=>k+' ×'+(b.bag[k]||0))); }
 function choose(i){ if(menu==='main'){ cur=i; if(i===0){ cur=0; return showMoves(); } if(i===1){ cur=0; return showItems(); } if(i===2) return act({k:'meditate'}); return act({k:'run'}); }
  if(menu==='moves'){ const t=b.me.moves[i]; if(!t) return; if(b.me.mp<api.cost(b,t)){ cur=i; return showMoves(); } return act({k:'move',t}); }
  if(menu==='items'){ const k=['Healing Potion','Focus Crystal'][i]; if(!(b.bag[k]>0)) return; return act({k:'item',t:k}); } }
 function act(a){ cur=0; menu='text'; push(api.turn(b,a)); }
 function A(){ if(menu==='text') return next(); choose(cur); }
 function Bk(){ if(menu==='moves'||menu==='items'){ cur=0; showMain(); } else if(menu==='text') next(); }
 function pad(d){ if(menu==='text') return; const n=menu==='main'?4:menu==='moves'?b.me.moves.length:2; const m={left:-1,right:1,up:-2,down:2}[d]; const c=cur+m; if(c>=0&&c<n) cur=c; menu==='main'?showMain():menu==='moves'?showMoves():showItems(); }
 function finish(){ if(b.rewarded){ menu='done'; return api.onExit&&api.onExit(b); } b.rewarded=1; const extra=cb(b)||[]; q.push(...extra.map(t=>({t}))); menu='text'; next(); }
 function keyd(e){ if(!ui||!document.body.contains(ui)) return; const k={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'}[e.key]; if(k){ e.preventDefault(); pad(k); } if(e.key==='z'||e.key==='Z') A(); if(e.key==='x'||e.key==='X') Bk(); }
 document.addEventListener('keydown',keyd);
 api.start=function(container,opts,done,exit){ api.onExit=exit; ui=container; cb=done; b=newBattle(opts); disp={me:b.me.hp,foe:b.foe.hp}; q=[]; cur=0;
  ui.innerHTML=`<div class=pk><div class=pkwipe></div><div id=pkfb class="pkbox pkfb"></div><div id=pkfs class="pks pkfs">${b.foe.em}</div>
   <div id=pkms class="pks pkms">${b.me.em}</div><div id=pkmb class="pkbox pkmb"></div><div id=pkt class=pkt></div></div>
   <div class=wpad><div class=dpad>${['up','left','right','down'].map(d=>`<button class="dp dp-${d}" data-d=${d}>${{up:'▲',down:'▼',left:'◀',right:'▶'}[d]}</button>`).join('')}</div><div class=ab><button class=wb id=pkB>B</button><button class=wb id=wA>A</button></div></div>`;
  ui.querySelectorAll('.dp').forEach(x=>x.addEventListener('pointerdown',e=>{ e.preventDefault(); pad(x.dataset.d); }));
  $('#wA').addEventListener('pointerdown',e=>{ e.preventDefault(); A(); }); $('#pkB').addEventListener('pointerdown',e=>{ e.preventDefault(); Bk(); });
  render(); menu='text'; $('#pkt').innerHTML='';
  setTimeout(()=>{ q=[{t:b.trainer?`Commissar Scout Ren sent out ${b.foe.name.toUpperCase()}!`:`A wild ${b.foe.name.toUpperCase()} appeared!`},{t:`Go! ${b.me.name.toUpperCase()}!`}]; next(); },650); return b; };
 api._tap=i=>{ cur=i; choose(i); }; api.A=()=>A(); api.B=()=>Bk(); api.pad=pad; Object.defineProperty(api,'state',{get:()=>b}); Object.defineProperty(api,'menu',{get:()=>menu});
}
root.PK=api; if(typeof module!=='undefined') module.exports.PK=api;
})(typeof window!=='undefined'?window:global);
