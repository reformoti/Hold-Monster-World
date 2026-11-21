/* The smith and the backpack photograph the very same bevels used in the scene. */
(()=>{'use strict';
const F=window.HoMoWForms,A=window.HoMoWArmory,icons=new Map();
function paint(canvas,model){
 const ctx=canvas.getContext('2d'),faces=[],size=canvas.width,id=model.id;
 const crossbow=id==='bow_crossbow',bow=id.startsWith('bow_')&&!crossbow;
 const pair=['sword_dual','daggers_pair','daggers_claws'].includes(id);
 const eye=crossbow?.82:.20,co=Math.cos(eye),si=Math.sin(eye);
 let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;
 for(const hand of pair?[-1,1]:[1]){
   const m=F.basis(crossbow?-.54:bow?-.94:-.23,crossbow?.09:.10,crossbow?-.12:pair?hand*.16:.31);
   const offset=pair?hand*(id==='sword_dual'?7.3:8.5):0;
   for(const {slot,mesh} of model.parts){
     const data=F.meshes.get(mesh),rgb=model.colors[slot].match(/../g).map(s=>parseInt(s,16));
     for(let i=0;i<data.length;i+=18){
       const n=F.point(m,hand*data[i+3],data[i+4],data[i+5]);
       if(n[2]*co+n[1]*si<=0)continue;
       const light=.66+.34*Math.max(0,(-n[0]*.55+n[1]*.83+n[2]*.82)/1.29);
       const pts=[];let depth=0;
       for(let j=i;j<i+18;j+=6){
         const [x,y,z]=F.point(m,hand*data[j],data[j+1],data[j+2]),px=x+offset,py=-y*co+z*si;
         pts.push([px,py]);depth+=z*co+y*si;
         x0=Math.min(x0,px);x1=Math.max(x1,px);y0=Math.min(y0,py);y1=Math.max(y1,py);
       }
       faces.push({pts,depth,color:'rgb('+rgb.map(v=>Math.round(v*light)).join(',')+')'});
     }
   }
 }
 const scale=(size*.88)/Math.max(1,x1-x0,y1-y0);
 ctx.clearRect(0,0,size,size);ctx.lineWidth=.52;ctx.lineJoin='round';
 for(const face of faces.sort((a,b)=>a.depth-b.depth)){
   ctx.fillStyle=ctx.strokeStyle=face.color;ctx.beginPath();
   face.pts.forEach(([x,y],i)=>ctx[i?'lineTo':'moveTo'](size/2+(x-(x0+x1)/2)*scale,size/2+(y-(y0+y1)/2)*scale));
   ctx.closePath();ctx.fill();ctx.stroke();
 }
}
function install(art,R){
 const original=art.icon;
 art.icon=function(id,tier=0){
   if(!R.VARIANTS[id])return original.call(this,id,tier);
   const model=A.get(id,tier),key=id+'/'+model.tier;
   if(!icons.has(key)){
     const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
     if(typeof canvas.toDataURL!=='function')return original.call(this,id,tier);
     paint(canvas,model);const url=canvas.toDataURL('image/png');
     if(!url||!url.startsWith('data:image/png'))return original.call(this,id,tier);
     icons.set(key,'<img alt="" aria-hidden="true" draggable="false" width="64" height="64" class="item-icon armory-icon" src="'+url+'">');
   }
   return icons.get(key);
 };
}
window.HoMoWArmoryIcons={paint,install};
})();
