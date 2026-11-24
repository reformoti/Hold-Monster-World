/* Orthographic depth buffer for the canvas fallback and the rotatable equipment portrait. */
(()=>{'use strict';
const S=window.HoMoWMaterials;
function triangle(frame,face,ia,ib,ic){
 const {width,height,scaleX,scaleY,depth,pixels}=frame,a=face.pts[ia],b=face.pts[ib],c=face.pts[ic];
 const x=a.x*scaleX,y=a.y*scaleY,bx=b.x*scaleX,by=b.y*scaleY,cx=c.x*scaleX,cy=c.y*scaleY;
 const dx1=bx-x,dy1=by-y,dx2=cx-x,dy2=cy-y,det=dx1*dy2-dy1*dx2;
 if(Math.abs(det)<.00001)return;
 const start=Math.max(0,Math.ceil(Math.min(x,bx,cx)-.5)),end=Math.min(width-1,Math.floor(Math.max(x,bx,cx)-.5));
 const first=Math.max(0,Math.ceil(Math.min(y,by,cy)-.5)),last=Math.min(height-1,Math.floor(Math.max(y,by,cy)-.5));
 if(start>end||first>last)return;
 const cut=face.cutaway,cx0=cut?cut.screenX*scaleX:0,cy0=cut?cut.screenY*scaleY:0;
 const cutX=cut?1/(cut.rx*scaleX):0,cutY=cut?1/(cut.ry*scaleY):0;
 const ux=dy2/det,uy=-dx2/det,vx=-dy1/det,vy=dx1/det;
 const db=b.depth-a.depth,dc=c.depth-a.depth;
 const texture=face.material&&S.pixels(face.material),mask=S.tileSize-1,uv=face.uv;
 const ua=texture?uv[ia]:null,ub=texture?uv[ib]:null,uc=texture?uv[ic]:null;
 const rgb=face.rgb,color=0xff000000|(rgb[2]<<16)|(rgb[1]<<8)|rgb[0],fog=face.visibility;
 for(let row=first;row<=last;row++){
   const dy=row+.5-y,dx=start+.5-x,vertical=(row+.5-cy0)*cutY;
   let u=ux*dx+uy*dy,v=vx*dx+vy*dy,idx=row*width+start;
   for(let col=start;col<=end;col++,idx++,u+=ux,v+=vx){
     if(u<-.000001||v<-.000001||u+v>1.000001)continue;
     const z=a.depth+u*db+v*dc;
     if(z<depth[idx])continue;
     if(cut&&z>cut.depth+5&&vertical*vertical+((col+.5-cx0)*cutX)**2<1)continue;
     let fade=0;
     if(fog){
       const wx=a.wx+u*(b.wx-a.wx)+v*(c.wx-a.wx),wz=a.wz+u*(b.wz-a.wz)+v*(c.wz-a.wz),distance=Math.hypot(wx-fog.x,wz-fog.y);
       if(distance>fog.radius)continue;
       const t=Math.max(0,Math.min(1,(distance-fog.start)/(fog.radius-fog.start)));fade=t*t*(3-2*t);
     }
     depth[idx]=z;
     if(!texture&&!fade){pixels[idx]=color;continue;}
     let light=1;
     if(texture){
       const tx=Math.floor(ua.x+u*(ub.x-ua.x)+v*(uc.x-ua.x))&mask,ty=Math.floor(ua.y+u*(ub.y-ua.y)+v*(uc.y-ua.y))&mask;
       light=texture[(ty*S.tileSize+tx)*4]/255;
     }
     const red=Math.round(rgb[0]*light*(1-fade)+89*fade),green=Math.round(rgb[1]*light*(1-fade)+99*fade),blue=Math.round(rgb[2]*light*(1-fade)+88*fade);
     pixels[idx]=0xff000000|(blue<<16)|(green<<8)|red;
   }
 }
}
function paint(frame,faces,from,to){
 for(let i=from;i<to;i++){
   const f=faces[i];triangle(frame,f,0,1,2);
   if(f.pts.length===4)triangle(frame,f,0,2,3);
 }
}
function flush(view,transparent){
 const width=view.canvas.width,height=view.canvas.height;
 let frame=view.rasterFrame;
 if(!frame||frame.width!==width||frame.height!==height||frame.ctx!==view.ctx){
   const image=view.ctx.createImageData(width,height);
   // A minimal recording context can still consume the projected paths.
   if(!image?.data)return false;
   frame=view.rasterFrame={width,height,ctx:view.ctx,image,pixels:new Uint32Array(image.data.buffer,image.data.byteOffset,width*height),depth:new Float32Array(width*height)};
 }
 frame.scaleX=width/view.width;frame.scaleY=height/view.height;
 const fixed=transparent?null:view.cachedFaces;
 if(fixed&&fixed===frame.fixed){
   frame.pixels.set(frame.staticPixels);frame.depth.set(frame.staticDepth);
 }else{
   frame.pixels.fill(transparent?0:view.visibility?0xff586359:0xff688076);frame.depth.fill(-Infinity);
   if(fixed){
     paint(frame,fixed,0,fixed.length);
     frame.staticPixels??=new Uint32Array(width*height);frame.staticDepth??=new Float32Array(width*height);
     frame.staticPixels.set(frame.pixels);frame.staticDepth.set(frame.depth);frame.fixed=fixed;
   }
 }
 paint(frame,view.faces,fixed?fixed.length:0,view.faces.length);
 view.ctx.putImageData(frame.image,0,0);return true;
}
window.HoMoWRaster={flush};
})();
