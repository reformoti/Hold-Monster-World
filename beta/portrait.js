/* An on-demand 3D portrait uses the same hero geometry as the world. No animation loop. */
(()=>{'use strict';window.HoMoWPortrait=(parent,world,appearance,mountID=null,appearanceOnly=false)=>{const R=window.BrukRealms,base=window.HoMoWBetaRuntime.scene,canvas=document.createElement('canvas');canvas.className=mountID?'mount-preview':'pack-preview';canvas.width=mountID?900:600;canvas.height=mountID?480:700;canvas.setAttribute('aria-label',mountID?'3D · '+R.MOUNTS[mountID].name:'3D-перегляд екіпірування персонажа');const c=canvas.getContext('2d'),view=Object.create(base);view.meshes=Object.fromEntries(['cube','cone','sphere','orb','blade','roof'].map(k=>[k,{data:window.HoMoWBeta3D.meshData(k)}]));view.cpu=true;view.ctx=c;view.canvas=canvas;view.width=mountID?450:300;view.height=mountID?240:350;view.faces=[];view.opt={animations:false,shadows:!!mountID};view.camera={width:view.width,height:view.height,cx:0,cz:0,c:Math.cos(-.40),s:Math.sin(-.40),spanX:mountID?125:50,spanY:mountID?70:58,elevationSin:mountID?.6:.24,elevationCos:mountID?.8:Math.sqrt(1-.24*.24)};let yaw=mountID?-.95:-.29;
const paint=()=>{view.faces=[];view.camera.c=Math.cos(yaw);view.camera.s=Math.sin(yaw);if(mountID)view.mountModel({state:{x:0,y:0,selectedMount:mountID},facing:{x:0,y:1},walking:false,footstep:0,gait:0});else view.hero({...world,appearanceOnly,state:{...world.state,x:0,y:0,mounted:false,appearance:{...appearance}},facing:{x:.12,y:1},time:0,footstep:0,gait:0,walking:false,swing:0,hurt:0});
if(mountID){
  for(const face of view.faces)for(const point of face.pts)point.y+=52;
}else{
  let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
  for(const face of view.faces)for(const point of face.pts){
    left=Math.min(left,point.x);right=Math.max(right,point.x);
    top=Math.min(top,point.y);bottom=Math.max(bottom,point.y);
  }
  const scale=Math.min(1.2,(view.width-24)/(right-left||1),(view.height-24)/(bottom-top||1));
  for(const face of view.faces)for(const point of face.pts){
    point.x=(point.x-(left+right)/2)*scale+view.width/2;
    point.y=(point.y-(top+bottom)/2)*scale+view.height/2;
  }
}
view.flush(true);};
canvas.style.touchAction='pan-y';let start;canvas.addEventListener('pointerdown',e=>{start=e.clientX;canvas.setPointerCapture?.(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(start===undefined)return;yaw+=(e.clientX-start)*.015;start=e.clientX;paint();});canvas.addEventListener('pointerup',()=>start=undefined);canvas.addEventListener('pointercancel',()=>start=undefined);canvas.tabIndex=0;canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();yaw+=e.key==='ArrowLeft'?-.18:.18;paint();}});parent.append(canvas);paint();const hint=document.createElement('small');hint.className='portrait-hint';hint.textContent='3D · Потягни, щоб повернути';parent.append(hint);};})();
