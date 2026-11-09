// p29 portraits (cultivation_02, Wes Nov 3 + Nov 8): the game paints each cultivator from written preferences + equipped gear + seat.
// No backend/keys: a deterministic keyless image URL (Pollinations) seeded by the cache-key hash, so every client that sees the
// same synced prefs+gear+seat shows the same picture. Debounce 5 s; cache by key in localStorage; keep the last portrait until the
// new one loads; fall back to the layered path sprite if the image fails. Seats 2-4: the main-hand is the cosmetic blue item,
// overlaid locally from img/dildo.png (never sent to the image API). Seat 1 shows the real main-hand weapon.
(function(root){
const LS='dbg_portraits', API='https://image.pollinations.ai/prompt/', DEBOUNCE=5000;
let store={}; try{ store=JSON.parse(localStorage.getItem(LS)||'{}')||{}; }catch(e){ store={}; }
const persist=()=>{ try{ const k=Object.keys(store); if(k.length>60) k.sort((a,b)=>(store[a].at||'')<(store[b].at||'')?-1:1).slice(0,k.length-60).forEach(x=>delete store[x]); localStorage.setItem(LS,JSON.stringify(store)); }catch(e){} };
const hash=s=>{ let h=2166136261; for(const ch of String(s)){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619); } return h>>>0; };
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const SLOTS=['head','armor','arms','legs','main','off'];
const PATHD={Body:'martial-body cultivator',Force:'qi-force cultivator',Light:'radiant light-path cultivator',Mass:'heavy earth-path cultivator'};
const STYLE='colorful cartoon game-art character portrait of a xianxia cultivator, full body standing, facing viewer, bold clean outlines, vibrant cel shading, simple soft gradient background, not photorealistic';
const CLEAN=/\b(dildo\w*|sex\w*|nud\w*|naked|porn\w*|penis\w*|genital\w*|nsfw|erotic\w*|lewd)\b/gi;
const live=()=>!!root.LIVE;
const seatOf=c=>live()?(+((c&&c.slot)||0)||1):1;          // demo = seat 1 look (matches spr.js: blue item is a live-room rule)
const dildoFor=seat=>live()&&seat>=2;
const pathOf=c=>(root.FF&&FF.ROLE2PATH&&FF.ROLE2PATH[c&&c.role])||'Body';
const myEq=()=>(typeof st!=='undefined'&&st&&st.demo&&st.demo.eq)||{};
function spec(c,eq,seat){ c=c||{}; eq=eq||{}; seat=seat||seatOf(c); const path=pathOf(c), dz=dildoFor(seat);
 const prefs=String(c.portraitPrefs||'').replace(CLEAN,'').replace(/\s+/g,' ').trim().slice(0,400);
 const items=SLOTS.filter(s=>eq[s]&&eq[s].n&&!(dz&&s==='main')).map(s=>[s,eq[s]]);
 const ids=items.map(([s,it])=>s+':'+(it.id||it.n)+':'+(it.q||'')).join(',');
 const weapon=seat===1?((eq.main&&eq.main.n)||c.weapon||''):'';
 const wear=items.filter(([s])=>s!=='main').map(([s,it])=>String(it.n).replace(CLEAN,'')).join(', ');
 const prompt=[STYLE, PATHD[path]||'cultivator', prefs?'appearance: '+prefs:'adult cultivator', wear?'wearing '+wear:'', dz?'right hand empty and relaxed at the side':(weapon?'holding a '+String(weapon).replace(CLEAN,'')+' in the right hand':'')].filter(Boolean).join(', ').slice(0,900);
 const sig=[prefs,path,ids,weapon,seat].join('|'), h=hash(sig), key='pt'+h.toString(36), seed=h%1000000007;
 const url=API+encodeURIComponent(prompt)+'?width=288&height=512&seed='+seed+'&nologo=true';
 return {key,seed,prompt,url,seat,dildo:dz,path}; }
const P={timer:null,target:null,pending:false,err:'',note:'',tries:0,store,spec,hash,DEBOUNCE};
P.current=c=>c&&c.portrait&&c.portrait.url||null;
P.request=function(c){ c=c||(typeof st!=='undefined'&&st.c); if(!c) return; const s=spec(c,myEq()); clearTimeout(P.timer); P.target=s.key; P.err=''; P.note=''; P.tries=0;
 if(c.portrait&&c.portrait.key===s.key){ P.pending=false; return P.refresh(); }
 P.pending=true; P.refresh(); P.timer=setTimeout(()=>P.generate(c),DEBOUNCE); };
P.debug=()=>({pending:P.pending,target:P.target,err:P.err,note:P.note,tries:P.tries,cur:typeof st!=='undefined'&&st.c&&st.c.portrait});
P.watch=function(c){ if(!c||!c.name) return; const k=spec(c,myEq()).key; if(c.portrait&&c.portrait.key===k){ if(P.pending&&P.target!==k){ clearTimeout(P.timer); P.pending=false; P.target=null; } return; } if(P.pending&&P.target===k) return; P.request(c); };
P.generate=function(c){ if(typeof st!=='undefined'&&st.c) c=st.c; const s=spec(c,myEq()); if(s.key!==P.target) return; const hit=store[s.key];
 const done=ok=>{ if(P.target!==s.key) return; if(!ok&&P.tries<3){ P.tries++; P.note='The painter is busy (the free image service paints about one new picture per 45 seconds). Retrying shortly; your last look stays up.'; clearTimeout(P.timer); P.timer=setTimeout(()=>P.generate(c),46000); return P.refresh(); } P.pending=false; P.note=''; if(ok){ const e={key:s.key,url:s.url,seed:s.seed,at:new Date().toISOString()}; store[s.key]=e; persist(); c.portrait=e; P.err=''; if(typeof save==='function') save(); } else P.err='The portrait painter is busy; showing your last look. It will retry on your next change.'; P.refresh(); };
 const im=new Image(); im.crossOrigin='anonymous'; let fin=false; const t=setTimeout(()=>{ if(!fin){ fin=true; done(false); } },150000);
 im.onload=()=>{ if(fin) return; fin=true; clearTimeout(t); done(!!im.naturalWidth); }; im.onerror=()=>{ if(fin) return; fin=true; clearTimeout(t); done(false); };
 im.src=hit?hit.url:s.url; };
const fallbackSrc=(c,eq,seat)=>root.Spr?Spr.url({path:pathOf(c),dildo:false,gear:Object.fromEntries(Object.entries(eq||{}).filter(([k,v])=>v).map(([k,v])=>[k,v.q]))}):'img/'+pathOf(c).toLowerCase()+'.png';
P.fallbackSrc=fallbackSrc;
// card: generated image (or layered sprite) + local blue overlay for seats 2-4
P.card=function(c,eq,seat,opt){ opt=opt||{}; c=c||{}; eq=eq||{}; seat=seat||seatOf(c); const own=!!opt.own, s=spec(c,eq,seat), u=P.current(c), h=opt.h||168, w=Math.round(h*288/512), fb=fallbackSrc(c,eq,seat);
 const ov=dildoFor(seat)?`<img class=pdz src="img/dildo.png" alt="" style="position:absolute;right:${-Math.round(w*.12)}px;bottom:${Math.round(h*.16)}px;height:${Math.round(h*.42)}px;transform:rotate(16deg);pointer-events:none">`:'';
 const img=`<img class=pimgx data-key="${esc(u?c.portrait.key:'fallback')}" src="${esc(u||fb)}" alt="portrait" style="width:${w}px;height:${h}px;object-fit:cover;border-radius:8px;border:1px solid #556;background:#223" onerror="this.onerror=null;this.dataset.key='fallback';this.style.objectFit='contain';this.src='${esc(fb)}'">`;
 const status=own?`<br><small style="color:#9ab">${P.pending?(P.note?'🎨 '+esc(P.note):'🎨 regenerating… (your last portrait stays until the new one is ready)'):P.err?esc(P.err):u?'Painted from your preferences and gear'+(dildoFor(seat)?' · main hand: the big blue item':''):'No portrait yet: write preferences below.'}</small>`:'';
 return `<div class=pport ${own?'id=pcard-me':''} style="display:flex;gap:8px;align-items:flex-start;margin:6px 0"><div style="position:relative;width:${w}px;height:${h}px;flex:none">${img}${ov}</div>${opt.text===false?'':`<div><b>${esc(c.name||'')}</b>${seat?' · Seat '+seat:''}${status}</div>`}</div>`; };
P.thumb=(c,eq,seat)=>P.card(c,eq,seat,{h:72,text:false});
P.mine=()=>(typeof st!=='undefined'&&st.c)?P.card(st.c,myEq(),seatOf(st.c),{own:true}):'';
P.refresh=function(){ if(typeof document==='undefined'||typeof st==='undefined'||!st.c) return; const el=document.getElementById('pcard-me'); if(el) el.outerHTML=P.mine();
 document.querySelectorAll('img.sil').forEach(i=>{ try{ i.src=Spr.url({path:pathOf(st.c),hair:(st.demo&&st.demo.look||{}).hair,gear:root.Demo&&Demo.gearLook?Demo.gearLook():{},portrait:P.current(st.c)}); }catch(e){} }); };
P.seatOf=seatOf; P.dildoFor=dildoFor;
root.PORT=P;
})(window);
