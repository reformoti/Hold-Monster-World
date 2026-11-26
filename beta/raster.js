/* Orthographic depth buffer for the canvas fallback and the rotatable equipment portrait. */
(()=>{'use strict';
const S=window.HoMoWMaterials;
function triangle(frame,face,ia,ib,ic){
 const {width,height,scaleX,scaleY,depth,pixels}=frame,a=face.pts[ia],b=face.pts[ib],c=face.pts[ic];
 const ox=frame.offsetX||0,oy=frame.offsetY||0,x=a.x*scaleX-ox,y=a.y*scaleY-oy,bx=b.x*scaleX-ox,by=b.y*scaleY-oy,cx=c.x*scaleX-ox,cy=c.y*scaleY-oy;
 const dx1=bx-x,dy1=by-y,dx2=cx-x,dy2=cy-y,det=dx1*dy2-dy1*dx2;
 if(Math.abs(det)<.00001)return;
 const start=Math.max(0,Math.ceil(Math.min(x,bx,cx)-.5)),end=Math.min(width-1,Math.floor(Math.max(x,bx,cx)-.5));
 const first=Math.max(0,Math.ceil(Math.min(y,by,cy)-.5)),last=Math.min(height-1,Math.floor(Math.max(y,by,cy)-.5));
 if(start>end||first>last)return;
 const hero=face.covered&&frame.heroMask;
 const ux=dy2/det,uy=-dx2/det,vx=-dy1/det,vy=dx1/det;
 const db=b.depth-a.depth,dc=c.depth-a.depth;
 const texture=!frame.maskOnly&&face.material&&S.pixels(face.material),mask=S.tileSize-1,uv=face.uv;
 const ua=texture?uv[ia]:null,ub=texture?uv[ib]:null,uc=texture?uv[ic]:null;
 const rgb=face.rgb,color=0xff000000|(rgb[2]<<16)|(rgb[1]<<8)|rgb[0],fog=face.visibility;
 for(let row=first;row<=last;row++){
   const dy=row+.5-y,dx=start+.5-x;
   let u=ux*dx+uy*dy,v=vx*dx+vy*dy,idx=row*width+start;
   for(let col=start;col<=end;col++,idx++,u+=ux,v+=vx){
     if(u<-.000001||v<-.000001||u+v>1.000001)continue;
     const z=a.depth+u*db+v*dc;
     if(z<depth[idx])continue;
     if(frame.maskOnly){depth[idx]=z;continue;}
     if(hero&&col>=hero.left&&col<hero.left+hero.width&&row>=hero.top&&row<hero.top+hero.height){const hd=hero.depth[(row-hero.top)*hero.width+col-hero.left];if(hd!==-Infinity&&z>hd+.75)continue;}
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
function paint(frame,faces,from,to,covered=null){
 for(let i=from;i<to;i++){
   const f=faces[i];if(covered!==null&&!!f.covered!==covered)continue;triangle(frame,f,0,1,2);
   if(f.pts.length===4)triangle(frame,f,0,2,3);
 }
}
function heroMask(view,faces,reference){
 const scaleX=view.canvas.width/view.width,scaleY=view.canvas.height/view.height,padding=2;
 let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
 for(const face of faces)for(const p of face.pts){left=Math.min(left,p.x*scaleX);top=Math.min(top,p.y*scaleY);right=Math.max(right,p.x*scaleX);bottom=Math.max(bottom,p.y*scaleY);}
 left=Math.max(0,Math.floor(left)-padding);top=Math.max(0,Math.floor(top)-padding);right=Math.min(view.canvas.width,Math.ceil(right)+padding);bottom=Math.min(view.canvas.height,Math.ceil(bottom)+padding);
 const width=right-left,height=bottom-top;if(width<1||height<1)return null;
 let mask=view.heroMaskFrame;if(!mask||mask.width!==width||mask.height!==height)mask=view.heroMaskFrame={width,height,depth:new Float32Array(width*height),expanded:new Float32Array(width*height),data:new Uint8Array(width*height*4),maskOnly:true};
 Object.assign(mask,{left,top,offsetX:left,offsetY:top,scaleX,scaleY,reference});mask.depth.fill(-Infinity);paint(mask,faces,0,faces.length);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){let depth=-Infinity;for(let yy=Math.max(0,y-padding);yy<=Math.min(height-1,y+padding);yy++)for(let xx=Math.max(0,x-padding);xx<=Math.min(width-1,x+padding);xx++)depth=Math.max(depth,mask.depth[yy*width+xx]);mask.expanded[y*width+x]=depth;}
 mask.depth.set(mask.expanded);mask.data.fill(0);
 for(let i=0;i<mask.depth.length;i++){if(mask.depth[i]===-Infinity)continue;const depth=Math.round(Math.max(0,Math.min(1,(mask.depth[i]-reference+256)/512))*65535);mask.data[i*4]=depth>>>8;mask.data[i*4+1]=depth&255;mask.data[i*4+3]=255;}
 return mask;
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
 frame.scaleX=width/view.width;frame.scaleY=height/view.height;frame.heroMask=view.heroMask;
 const fixed=transparent?null:view.cachedFaces;
 if(fixed&&fixed===frame.fixed){
   frame.pixels.set(frame.staticPixels);frame.depth.set(frame.staticDepth);
 }else{
   frame.pixels.fill(transparent?0:view.visibility?0xff586359:0xff688076);frame.depth.fill(-Infinity);
   if(fixed){
     paint(frame,fixed,0,fixed.length,false);frame.coveredFaces=fixed.filter(face=>face.covered);
     frame.staticPixels??=new Uint32Array(width*height);frame.staticDepth??=new Float32Array(width*height);
     frame.staticPixels.set(frame.pixels);frame.staticDepth.set(frame.depth);frame.fixed=fixed;
   }
 }
 if(fixed)paint(frame,frame.coveredFaces,0,frame.coveredFaces.length);
 paint(frame,view.faces,fixed?fixed.length:0,view.faces.length);
 view.ctx.putImageData(frame.image,0,0);return true;
}
window.HoMoWRaster={flush,heroMask};
})();
