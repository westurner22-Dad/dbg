// Ash Archives (cultivation_16, LOCKED) — port of sim_dungeon.py final values.
(function(root){
const PL={Minimum:{Striker:[12500,12157,14525,14012],Vanguard:[30750,3656,35850,4161],Controller:[12500,3979,14525,5462],Support:[12950,5876,14975,6714],Bruiser:[12950,11704,14975,13623]},
 '1 hr/day':{Striker:[15200,14673,17225,16435],Vanguard:[39175,3903,43900,4413],Controller:[15200,8562,17225,9635],Support:[15650,6946,17675,7735],Bruiser:[15650,14651,17675,16417]},
 '3 hr/day':{Striker:[22400,17187,24350,18923],Vanguard:[45650,5030,50375,5572],Controller:[22400,10362,24350,11351],Support:[22850,8293,24750,9137],Bruiser:[22850,18341,24750,20219]}};
const DODGE={Striker:.15,Vanguard:.10,Controller:.12,Support:.10,Bruiser:.18};
const P={rooms:3,U0:9000,Us:400,room_budget:3,hit0:1200,hits:20,keeper_hp:6.5,potions:3,potion:.5,between:.1,assist:.25,elite_p:.2,maxhit:.25,nontank_ref:15200,scale:.7};
const KIT={Striker:{dmg:1,taken:.8,heal:.03,aoe:1},Bruiser:{dmg:1,taken:.99,heal:.01,aoe:2},Controller:{dmg:1.45,taken:1.04,heal:.02,aoe:3,stun:.18},Support:{dmg:1.75,taken:.86,heal:.055,aoe:1},Vanguard:{dmg:2,taken:1.13,heal:0,aoe:2}};
const EN={'Ash Clerk':{hp:1,hit:1,lv:1},'Redaction Moth':{hp:.5,hit:.8,lv:1,dodge:.3},'Footnote Swarm':{hp:.25,hit:.4,lv:1,n:3},'Microfilm Spy':{hp:.7,hit:1,lv:1,crit:.25},
 'Furnace Stoker':{hp:1.2,hit:.7,lv:3,burn:.02},'Censor Officer':{hp:1,hit:.8,lv:4,silence:.25},'Committee of Three':{hp:2.4,hit:1.4,lv:6},'Revision Scribe':{hp:.9,hit:.6,lv:7,heal:.1}};
const KEEP={'Head Librarian of Revisions':{hit:3,heal_once:.15},'Comrade Censor-General':{hit:2.6,silence:.35},'The Furnace of Approved Thought':{hit:2.2,burn:.03,slam:.25}};
const AFFIX={Hardbound:{hp:1.5},Zealous:{hit:1.3},'Ink-Shielded':{dr:.3},'Self-Revising':{heal:.05}};
const pick=(r,a)=>a[Math.floor(r()*a.length)];
function pstat(prof,role,L){const [a,b,c,d]=PL[prof][role]; const t=(L-1)/9; return [a+(c-a)*t,b+(d-b)*t];}
function newRun(role,L,opt={}){ const r=opt.rng||Math.random, prof=opt.prof||'1 hr/day'; const [hp,dpt]=pstat(prof,role,L); const [rh,rd]=pstat('1 hr/day',role,L);
  const run={role,L,prof,rng:r,assist:!!opt.assist,su:(dpt/rd)**P.scale,sh:(hp/rh)**P.scale,hp,mx:hp,dpt,pots:P.potions,sil:0,room:0,rounds:0,roomRounds:0,log:[],over:false,result:null,roundStart:Date.now(),roundLog:[]};
  run.ens=makeRoom(run); return run; }
function makeRoom(run){ const r=run.rng, L=run.L, U=(P.U0+P.Us*(L-1))*run.su; run.healed=false; run.roomRounds=0;
  if(run.room>=P.rooms){ const name=pick(r,Object.keys(KEEP)), d=KEEP[name]; const hp=P.keeper_hp*U*(run.assist?1-P.assist:1); run.log.push('Keeper: '+name); return [{k:name,d,hp,mx:hp,hit:d.hit,dr:0,heal:0,keeper:true}]; }
  let B=P.room_budget*U*(run.assist?1-P.assist:1); const pool=Object.keys(EN).filter(k=>EN[k].lv<=L), out=[];
  while(B>0.2*U){ const k=pick(r,pool), d=EN[k]; for(let i=0;i<(d.n||1);i++) out.push({k,d,hp:d.hp*U,mx:d.hp*U,hit:d.hit,dr:0,heal:d.heal||0}); B-=d.hp*U*(d.n||1); }
  if(r()<P.elite_p){ const e=pick(r,out), an=pick(r,Object.keys(AFFIX)), a=AFFIX[an]; e.mx=e.hp=e.hp*(a.hp||1)*2; e.hit*=(a.hit||1)*1.3; e.dr=a.dr||0; e.heal=Math.max(e.heal,a.heal||0); e.k+=' ('+an+')'; e.elite=true; }
  run.log.push('Room '+(run.room+1)+': '+out.length+' enemies'); return out; }
// one round: player action (attack with optional focus target, or tonic) then enemies act
function act(run, action, focus, ai){ if(run.over) return; const r=run.rng, k=KIT[run.role], L=run.L, ens=run.ens;
  run.roundLog.push({room:run.room+1,round:run.roomRounds+1,sec:Math.round((Date.now()-run.roundStart)/100)/10}); run.rounds++; run.roomRounds++;
  const sil=run.sil>0; run.sil=Math.max(0,run.sil-1); let stunned=new Set();
  { const dmg=run.dpt*k.dmg*({poor:.85,avg:.95}[ai]||1)*(sil?.35:1);
    let tg=ens.slice().sort((a,b)=>ai==='poor'?r()-.5:a.hp/a.mx-b.hp/b.mx); if(focus!=null&&ens[focus]) tg=[ens[focus]].concat(tg.filter(e=>e!==ens[focus])); tg=tg.slice(0,k.aoe);
    const share=dmg*(tg.length===1?1:.6); for(const e of tg){ if(e.d.dodge&&r()<e.d.dodge){ run.log.push(e.k+' dodged'); continue;} e.hp-=share*(1-e.dr); }
    if(k.stun) tg.forEach(e=>{ if(r()<k.stun) stunned.add(e); }); }
  run.ens=ens.filter(e=>e.hp>0);
  for(const e of run.ens){ if(e.heal){ const t=run.ens.reduce((a,b)=>b.hp/b.mx<a.hp/a.mx?b:a); t.hp=Math.min(t.mx,t.hp+e.heal*t.mx);} if(e.d.heal_once&&!run.healed&&e.hp<.5*e.mx){ e.hp+=e.d.heal_once*e.mx; run.healed=true; } }
  const base=(P.hit0+P.hits*(L-1))*run.sh, cap=P.maxhit*P.nontank_ref*(1+.015*(L-1))*run.sh;
  for(const e of run.ens){ if(stunned.has(e)) continue; let h=base*e.hit; if(e.d.crit&&r()<e.d.crit) h*=1.8;
    if(e.d.slam&&run.roomRounds%4===0) h=run.role!=='Vanguard'?cap/k.taken:cap*1.2; if(run.role!=='Vanguard') h=Math.min(h,cap);
    if(r()<Math.min(.5,DODGE[run.role])) h=0; run.hp-=h*k.taken; if(e.d.burn) run.hp-=e.d.burn*run.mx; if(e.d.silence&&r()<e.d.silence) run.sil=1; }
  run.hp=Math.min(run.mx,run.hp+k.heal*run.mx);
  if(ai){ const thr={poor:.2,avg:.35,good:.4}[ai]; if(run.hp<thr*run.mx&&run.pots>0&&!(ai==='poor'&&r()<.3)){ run.pots--; run.hp=Math.min(run.mx,run.hp+P.potion*run.mx);} }
  if(run.hp<=0){ run.over=true; run.result='fail'; run.log.push('Defeated in room '+(run.room+1)); return; }
  if(!run.ens.length||run.roomRounds>=30){ if(run.roomRounds>=30&&run.ens.length){ run.over=true; run.result='fail'; return; }
    run.room++; if(run.room>P.rooms){ run.over=true; run.result='clear'; run.log.push('Run cleared! +50 XP'); return; }
    run.hp=Math.min(run.mx,run.hp+P.between*run.mx); run.log.push('Reading Desk: +10% max HP'); run.ens=makeRoom(run); }
  run.roundStart=Date.now(); }
function tonic(run){ if(run.pots>0&&!run.over){ run.pots--; run.hp=Math.min(run.mx,run.hp+P.potion*run.mx); run.log.push('Ash Tonic: +50% HP (free)'); } }
function autoRun(role,L,ai,opt){ const run=newRun(role,L,opt); while(!run.over) act(run,'attack',null,ai); return run; }
root.AA={newRun,act,tonic,autoRun,KIT,P};
if(typeof module!=='undefined') module.exports=root.AA;
})(typeof window!=='undefined'?window:globalThis);
