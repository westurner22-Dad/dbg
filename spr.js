// p20 shared layered character sprite: base per path (img/*.png) + hair colour + gear layers + tint (foe/unit). Used by every mode.
(function(root){ const imgs={}, cache={};
const load=p=>imgs[p]||(imgs[p]=Object.assign(new Image(),{src:'img/'+p+'.png'}));
['body','force','light','mass','ape'].forEach(load);
const RC={Common:'#cfd3da',Rare:'#4af',Epic:'#c6f',Legendary:'#fa3'};
const TINT={foe:[200,70,70],gray:[140,140,150],Spear:[120,170,255],Archer:[120,220,120],Healer:[255,255,255],General:[255,210,60]};
function make(o){ o=o||{}; const p=(o.path||'body').toLowerCase(), key=JSON.stringify(o); if(cache[key]) return cache[key]; const im=load(p); if(!im.complete||!im.naturalWidth) return null;
 const W=im.naturalWidth, H=im.naturalHeight, c=document.createElement('canvas'); c.width=W+16; c.height=H; const x=c.getContext('2d'); x.drawImage(im,8,0);
 const tn=TINT[o.tint]; if(tn){ const d=x.getImageData(0,0,c.width,H), a=d.data; for(let i=0;i<a.length;i+=4){ if(!a[i+3]) continue; const l=(a[i]*.3+a[i+1]*.59+a[i+2]*.11)/255; a[i]=a[i]*.35+tn[0]*l*.9; a[i+1]=a[i+1]*.35+tn[1]*l*.9; a[i+2]=a[i+2]*.35+tn[2]*l*.9; } x.putImageData(d,0,0); }
 if(o.hair){ x.save(); x.globalCompositeOperation='source-atop'; x.globalAlpha=.55; x.fillStyle=o.hair; x.fillRect(0,0,c.width,H*.11); x.restore(); }
 const g=o.gear||{}; x.lineWidth=3;
 if(g.head){ x.fillStyle=RC[g.head]; x.globalAlpha=.9; x.fillRect(W*.3+8,H*.1,W*.4,4); x.globalAlpha=1; }
 if(g.armor){ x.save(); x.globalCompositeOperation='source-atop'; x.globalAlpha=.22; x.fillStyle=RC[g.armor]; x.fillRect(0,H*.3,c.width,H*.3); x.restore(); }
 if(g.main){ x.strokeStyle=RC[g.main]; x.beginPath(); x.moveTo(c.width-6,H*.25); x.lineTo(c.width-14,H*.75); x.stroke(); }
 if(g.off){ x.fillStyle=RC[g.off]; x.beginPath(); x.ellipse(8,H*.5,6,10,0,0,7); x.fill(); }
 cache[key]=c; return c; }
const url=o=>{ const c=make(o); if(!c) return 'img/'+((o&&o.path)||'body').toLowerCase()+'.png'; return c._u||(c._u=c.toDataURL()); };
root.Spr={make,url,load,RC};
})(window);
