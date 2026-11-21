/* Orthographic ray hit on the actual rendered facets, including raised boss faces. */
(()=>{'use strict';
const primitives=new Map();
function triangles(view,body){
 const result=[];
 for(const [kind,x,y,z,sx,sy,sz,turn] of body.parts){
   if(!primitives.has(kind))primitives.set(kind,window.HoMoWBeta3D.meshData(kind));
   const data=primitives.get(kind),a=Math.cos(turn),b=Math.sin(turn);
   for(let i=0;i<data.length;i+=18){
     const tri=[];
     for(let j=i;j<i+18;j+=6){
       const xx=data[j]*sx,zz=data[j+2]*sz,height=y+data[j+1]*sy;
       const px=x+xx*a+zz*b,pz=z-xx*b+zz*a,screen=view.project(px,pz,height);
       tri.push([screen.x,screen.y,height]);
     }
     result.push(tri);
   }
 }
 return result;
}
function pick(view,x,y){
 const ground=view.pick(x,y),cam=view.camera;let height=0;
 for(const body of view.aimBodies||[]){
   if(x<body.left||x>body.right||y<body.top||y>body.bottom)continue;
   body.triangles??=triangles(view,body);
   for(const [a,b,c] of body.triangles){
     const dx=b[0]-a[0],dy=b[1]-a[1],ex=c[0]-a[0],ey=c[1]-a[1],det=dx*ey-dy*ex;
     if(Math.abs(det)<.0001)continue;
     const u=((x-a[0])*ey-(y-a[1])*ex)/det,v=(dx*(y-a[1])-dy*(x-a[0]))/det;
     if(u>=0&&v>=0&&u+v<=1)height=Math.max(height,a[2]+u*(b[2]-a[2])+v*(c[2]-a[2]));
   }
 }
 if(!height)return ground;
 const along=height*(cam.elevationCos??.8)/(cam.elevationSin??.6);
 return {x:ground.x+cam.s*along,y:ground.y+cam.c*along};
}
window.HoMoWBodyPick={pick};
})();
