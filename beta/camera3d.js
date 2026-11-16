/* Shared projection/picking math for GPU and software 3D. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.HoMoWCamera3D=factory();})(typeof window==='undefined'?globalThis:window,function(){
'use strict';
function create(width,height,cx,cz,yaw=0,zoom=1){const spanY=(width<700?300:Math.max(290,560*height/width))/zoom;return {width,height,cx,cz,c:Math.cos(yaw),s:Math.sin(yaw),spanY,spanX:spanY*width/height};}
function project(camera,x,z,y=0){const dx=x-camera.cx,dz=z-camera.cz,rx=dx*camera.c-dz*camera.s,rz=dx*camera.s+dz*camera.c;return {x:camera.width/2+rx*camera.width/(2*camera.spanX),y:camera.height/2+(rz*.6-y*.8)*camera.height/(2*camera.spanY)};}
function pick(camera,x,y){const rx=(x-camera.width/2)*camera.spanX*2/camera.width,rz=(y-camera.height/2)*camera.spanY*2/(camera.height*.6);return {x:camera.cx+rx*camera.c+rz*camera.s,y:camera.cz-rx*camera.s+rz*camera.c};}
function movement(x,y,yaw){return {x:x*Math.cos(yaw)+y*Math.sin(yaw),y:-x*Math.sin(yaw)+y*Math.cos(yaw)};}
return {create,project,pick,movement};
});
