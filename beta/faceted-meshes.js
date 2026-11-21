/* Small flat-shaded solids shared by the armory, the animated figure and its previews. */
(()=>{'use strict';
const meshes=new Map(),models=new Map();
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>{const d=Math.hypot(...a)||1;return a.map(v=>v/d);};
class Builder{
 constructor(){this.groups=new Map();}
 triangle(slot,a,b,c){
   const n=cross(sub(b,a),sub(c,a)),length=Math.hypot(...n);
   if(length<.000001)return;
   if(!this.groups.has(slot))this.groups.set(slot,[]);
   const out=this.groups.get(slot);
   for(const p of [a,b,c])out.push(...p,n[0]/length,n[1]/length,n[2]/length);
 }
 // Rings rise along their common axis, counterclockwise in the XZ plane.
 loft(slots,rings){
   const count=rings[0].length,slot=i=>Array.isArray(slots)?slots[i%slots.length]:slots;
   for(let k=1;k<rings.length;k++){
     const low=rings[k-1],high=rings[k];
     for(let i=0;i<count;i++){const j=(i+1)%count;
       this.triangle(slot(i),low[i],high[i],high[j]);this.triangle(slot(i),low[i],high[j],low[j]);}
   }
   for(const [ring,top] of [[rings[0],false],[rings[rings.length-1],true]]){
     for(let i=1;i<count-1;i++)this.triangle(slot(0),ring[0],ring[top?i+1:i],ring[top?i:i+1]);
   }
 }
 // Each row is [height, radiusX, radiusZ, offsetX, offsetZ].
 rings(slot,rows,sides=8,angle=Math.PI/8){
   this.loft(slot,rows.map(([y,rx,rz,x=0,z=0])=>Array.from({length:sides},(_,i)=>{
     const a=angle+i*Math.PI*2/sides;return [x+Math.cos(a)*rx,y,z+Math.sin(a)*rz];})));
 }
 // A forged section has thin cutting edges, two bevels and a raised longitudinal ridge.
 // Rows are [height, left edge, right edge, ridge depth, face offset, ridge position].
 blade(slot,rows,edge=slot){
   this.loft([edge,slot,slot,edge,slot,slot],rows.map(([y,l,r,d,z=0,ridge=(l+r)/2])=>{
     const bevel=(r-l)*.16;
     return [[r,y,z],[r-bevel,y,z+d*.64],[ridge,y,z+d],[l+bevel,y,z+d*.64],[l,y,z],[ridge,y,z-d]];
   }));
 }
 beam(slot,a,b,r0,r1=r0,sides=6){
   const axis=unit(sub(b,a));
   const right=unit(cross(Math.abs(axis[2])<.9?[0,0,1]:[0,1,0],axis)),front=cross(right,axis);
   this.loft(slot,[[a,r0],[b,r1]].map(([p,r])=>Array.from({length:sides},(_,i)=>{
     const angle=i*Math.PI*2/sides;
     return p.map((v,j)=>v+r*(right[j]*Math.cos(angle)+front[j]*Math.sin(angle)));
   })));
 }
}
function model(key,make){
 if(!models.has(key)){
   const builder=new Builder();make(builder);const parts=[];
   for(const [slot,data] of builder.groups){
     const mesh=key+'/'+slot;meshes.set(mesh,new Float32Array(data));parts.push({mesh,slot});
   }
   models.set(key,parts);
 }
 return models.get(key);
}
// Roll around the local forward axis, pitch towards the front, then turn with the actor.
function basis(yaw=0,pitch=0,lean=0){
 const c=Math.cos(yaw),s=Math.sin(yaw),p=Math.cos(pitch),q=Math.sin(pitch),a=Math.cos(lean),b=Math.sin(lean);
 return [c*a-s*q*b,-p*b,-s*a-c*q*b, c*b+s*q*a,p*a,-s*b+c*q*a, s*p,-q,c*p];
}
function point(m,x,y,z){return [m[0]*x+m[3]*y+m[6]*z,m[1]*x+m[4]*y+m[7]*z,m[2]*x+m[5]*y+m[8]*z];}
window.HoMoWForms={model,meshes,basis,point};
})();
