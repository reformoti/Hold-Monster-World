/* Minimal native WebGL scene. No engine download, full-world data, or network API. */
(()=>{'use strict';
const surfaces=window.HoMoWMaterials;
const vertex=`attribute vec3 p,n;uniform vec3 pos,size;uniform float turn;uniform vec4 camera;uniform vec2 center,orbit;varying float light;
varying vec2 surfaceUV;
void main(){float a=cos(turn),b=sin(turn);vec3 q=p*size;
vec3 face=abs(n);
if(face.y>=max(face.x,face.z)) surfaceUV=size.x>size.z?q.zx:q.xz;
else if(face.x>=face.z) surfaceUV=size.y>size.z?q.zy:q.yz;
else surfaceUV=size.x>size.y?q.yx:q.xy;
surfaceUV/=${surfaces.units.toFixed(1)};
vec3 v=vec3(q.x*a+q.z*b,q.y,-q.x*b+q.z*a)+pos;vec3 normal=normalize(vec3(n.x*a+n.z*b,n.y,-n.x*b+n.z*a));light=.67+.33*max(0.,dot(normal,normalize(vec3(-.5,1.,.6))));float dx=v.x-center.x,dz=v.z-center.y;float x=dx*orbit.x-dz*orbit.y,z=dx*orbit.y+dz*orbit.x;gl_Position=vec4(x/camera.x,(-z*.6+v.y*.8)/camera.y,-(z*.8+v.y*.6)/1800.,1.);}`;
const fragment=`precision mediump float;uniform vec3 color;varying float light;
varying vec2 surfaceUV;
uniform sampler2D surface;
uniform bool textured;
void main(){float detail=textured?texture2D(surface,surfaceUV).r:1.;gl_FragColor=vec4(color*light*detail,1.);}`;
const runeColors=['','86df99','76cddd','76a5ff','ae91ff','eb8ad7','ff9973','ffce68','fff2b8'];
// Effect coordinates are local to the weapon socket, including during a swing.
function enchantEffect(level,time,emit){
  const color=runeColors[level], t=time*2;
  const spark=(x,y,z,r=1.6)=>emit(x,y,z,r,r,r,color,'orb',0);
  const line=(x1,z1,x2,z2,y,width,ink=color)=>{
    const dx=x2-x1,dz=z2-z1;
    emit((x1+x2)/2,y,(z1+z2)/2,width,1.6,Math.hypot(dx,dz)+.4,ink,'cube',Math.atan2(dx,dz));
  };
  switch(level){
    case 1:
      spark(0,4,5,1.7+.5*Math.cos(t));
      break;
    case 2:
      for(let i=0;i<2;i++)spark(Math.cos(t+i*Math.PI)*5,4+Math.sin(t+i*Math.PI)*3,8+i*7);
      break;
    case 3:
      for(let i=0;i<3;i++)emit((i-1)*4,3+Math.sin(t+i),5+i*4,1.8,5+i,2,color,'cone',0);
      break;
    case 4:
      for(let i=0;i<7;i++)spark(Math.cos(t+i)*5,3+Math.sin(t+i)*3,i*3,1.4);
      break;
    case 5:
      for(let i=0;i<5;i++){
        const rise=(time*.8+i/5)%1;
        spark(Math.sin(t+i*2)*4,2+rise*13,3+i*3,2.2-rise);
      }
      break;
    case 6:
      for(let i=0;i<4;i++)emit((i%2?1:-1)*3,2,2+i*4,2.6,7+3*Math.sin(t+i),2.6,i%2?color:'ffe49c','cone',0);
      break;
    case 7: {
      const bend=3.6+1.2*Math.sin(time*12);
      line(0,0,bend,7,4,2);line(bend,7,-bend,12,4,2);
      line(-bend,12,bend/2,18,4,2);line(bend/2,18,0,25,4,2);
      line(-bend,12,-bend-4,16,4,1,'fff5cd');
      break;
    }
    case 8:
      for(let i=0;i<8;i++){
        const a=t+i*Math.PI/4,b=a+Math.PI/4;
        line(Math.cos(a)*7,9+Math.sin(a)*7,Math.cos(b)*7,9+Math.sin(b)*7,5,1.8);
        if(i%2===0)spark(Math.cos(a)*7,7,9+Math.sin(a)*7);
      }
      emit(0,4,9,2.6,8,2.6,'fff9e4','cone',0);
      break;
  }
}
// All grips are in character space. Weapon parts and the hands share these pivots.
const restGrip={
  sword:{x:0,y:32,z:0},axe:{x:20,y:34,z:8},spear:{x:18,y:32,z:8},
  daggers:{x:20,y:32,z:17},bow:{x:0,y:37,z:20},staff:{x:19,y:38,z:6}
};
function weaponPose(w,stride){
  const kind=w.state.weaponKind||'sword',id=w.state.weaponVariant;
  const paired=['sword_dual','daggers_pair','daggers_claws'].includes(id);
  const both=w.twoHanded&&!paired,origin=restGrip[kind]||restGrip.sword;
  const progress=w.swing>0?Math.max(0,Math.min(1,1-w.swing/.25)):0;
  const strike=Math.sin(progress*Math.PI),step=stride*(1-strike);
  const right={x:both?8:18,y:32+strike*3,z:10-step*3+strike*(kind==='spear'?14:7)};
  let left={x:-18,y:32,z:8+(paired?step*3+strike*4:0)};
  let yaw=.12;
  if(kind==='spear')yaw=.05;
  else if(kind==='bow')yaw=0;
  else if(w.swing>0)yaw=.12+Math.sin(progress*Math.PI*2)*(kind==='axe'?.95:.65);
  if(kind==='bow'){
    left={x:-7,y:39,z:23+strike*2};
    Object.assign(right,{x:3+strike*7,y:39+strike*3,z:10-strike*9});
  }else if(both){
    const offset=kind==='sword'?-8:kind==='staff'?0:16;
    left={x:right.x+offset*Math.sin(yaw),y:right.y+(kind==='staff'?11:0),z:right.z+offset*Math.cos(yaw)};
  }
  return {right,left,yaw,origin,paired};
}
function meshData(kind){const out=[];function tri(a,b,c){const u=b.map((v,i)=>v-a[i]),v=c.map((q,i)=>q-a[i]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]].map(q=>(kind==='sphere'||kind==='orb'||kind==='blade')?-q:q),l=Math.hypot(...n)||1;for(const p of [a,b,c])out.push(...p,...n.map(x=>x/l));}
if(kind==='cube'){const v=[[-.5,-.5,-.5],[.5,-.5,-.5],[.5,.5,-.5],[-.5,.5,-.5],[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]];for(const [a,b,c,d]of [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]]){tri(v[a],v[b],v[c]);tri(v[a],v[c],v[d]);}}
else if(kind==='roof'){const a=[-.5,0,-.5],b=[.5,0,-.5],c=[-.5,0,.5],d=[.5,0,.5],e=[0,1,-.5],f=[0,1,.5];tri(a,e,b);tri(c,d,f);tri(a,c,f);tri(a,f,e);tri(b,e,f);tri(b,f,d);tri(a,b,d);tri(a,d,c);}
else if(kind==='blade'){
 const rings=[[-.5,0,0],[0,.18,0],[.5,0,0],[0,-.18,0],[-.36,0,.74],[0,.13,.74],[.36,0,.74],[0,-.13,.74]];
 for(let i=0;i<4;i++){const j=(i+1)%4;tri(rings[i],rings[j],rings[j+4]);tri(rings[i],rings[j+4],rings[i+4]);tri(rings[i+4],rings[j+4],[0,0,1]);}
 tri(rings[3],rings[2],rings[1]);tri(rings[3],rings[1],rings[0]);
}
else if(kind==='cone'){for(let i=0;i<10;i++){const a=i*Math.PI/5,b=(i+1)*Math.PI/5;tri([Math.cos(a),0,Math.sin(a)],[0,1,0],[Math.cos(b),0,Math.sin(b)]);tri([0,0,0],[Math.cos(a),0,Math.sin(a)],[Math.cos(b),0,Math.sin(b)]);}}
else{const rows=kind==='orb'?3:7,cols=kind==='orb'?6:12,point=(a,b)=>[Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b)];for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*Math.PI/rows,b=(j+1)*Math.PI/rows,x=i*Math.PI*2/cols,y=(i+1)*Math.PI*2/cols;tri(point(a,x),point(b,x),point(b,y));tri(point(a,x),point(b,y),point(a,y));}}return new Float32Array(out);}
const triangleVertices=[0,6,12],quadVertices=[0,6,12,30];
class Scene{
 constructor(input){this.yaw=-.48;this.zoom=1.08;this.colorCache=new Map();this.input=input;this.canvas=document.createElement('canvas');this.canvas.id='scene3d';this.canvas.setAttribute('aria-hidden','true');input.after(this.canvas);const g=this.gl=this.canvas.getContext('webgl',{antialias:true,alpha:false});this.cpu=!g;if(this.cpu)this.ctx=this.canvas.getContext('2d');
 if(g){
 const shader=(type,src)=>{const s=g.createShader(type);g.shaderSource(s,src);g.compileShader(s);if(!g.getShaderParameter(s,g.COMPILE_STATUS))throw Error(g.getShaderInfoLog(s));return s;};const program=this.program=g.createProgram();g.attachShader(program,shader(g.VERTEX_SHADER,vertex));g.attachShader(program,shader(g.FRAGMENT_SHADER,fragment));g.linkProgram(program);if(!g.getProgramParameter(program,g.LINK_STATUS))throw Error('WebGL link failed');g.useProgram(program);this.u={};for(const key of ['pos','size','turn','camera','center','orbit','color','surface','textured'])this.u[key]=g.getUniformLocation(program,key);this.attributes=[g.getAttribLocation(program,'p'),g.getAttribLocation(program,'n')];this.meshes={};for(const key of ['cube','cone','sphere','orb','blade','roof']){const data=meshData(key),buffer=g.createBuffer();g.bindBuffer(g.ARRAY_BUFFER,buffer);g.bufferData(g.ARRAY_BUFFER,data,g.STATIC_DRAW);this.meshes[key]={buffer,count:data.length/6};}this.surfaceTextures=new Map([['steel',surfaces.texture(g,'steel')]]);
 g.uniform1i(this.u.surface,0);this.activeMaterial=null;g.enable(g.DEPTH_TEST);g.clearColor(.39,.46,.34,1);}else{this.meshes={};for(const key of ['cube','cone','sphere','orb','blade','roof'])this.meshes[key]={data:meshData(key)};}this.labels=[];for(const text of ['Мандрівник · 1','Лісовий слиз','Дикий вовк']){const el=document.createElement('div');el.className='scene-label';el.innerHTML='<span></span><i><b></b></i>';el.dataset.side=this.labels.length?'enemy':'player';el.querySelector('span').textContent=text;input.parentElement.append(el);this.labels.push(el);}this.damageLabels=[];for(let i=0;i<12;i++){const el=document.createElement('div');el.className='damage-number';input.parentElement.append(el);this.damageLabels.push(el);}input.style.opacity='0';this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.lost=true;(document.getElementById('worldNotice')||document.getElementById('notice')||{}).textContent='3D-контекст втрачено. Онови сторінку.';});
 }
 rotate(delta){this.yaw=(this.yaw+delta)%(Math.PI*2);}
 magnify(factor){this.zoom=Math.max(.65,Math.min(1.85,this.zoom*factor));}
 resetCamera(){this.yaw=-.48;this.zoom=1.08;}
 setup(w){const r=this.input.getBoundingClientRect(),dpr=Math.min(1.5,devicePixelRatio||1);if(this.canvas.width!==Math.round(r.width*dpr)||this.canvas.height!==Math.round(r.height*dpr)){this.canvas.width=Math.round(r.width*dpr);this.canvas.height=Math.round(r.height*dpr);}this.width=r.width;this.height=r.height;const follow=r.width<700?1:Math.max(0,Math.min(1,(this.zoom-1)*1.6));this.camera=window.HoMoWCamera3D.create(r.width,r.height,480+(w.state.x-480)*follow,310+(w.state.y-310)*follow,this.yaw,this.zoom);Object.assign(this,this.camera);if(this.cpu)return;const g=this.gl;g.viewport(0,0,this.canvas.width,this.canvas.height);g.uniform4f(this.u.camera,this.spanX,this.spanY,0,0);g.uniform2f(this.u.center,this.cx,this.cz);g.uniform2f(this.u.orbit,this.camera.c,this.camera.s);}
 pick(x,y){return window.HoMoWCamera3D.pick(this.camera,x,y);}
 project(x,z,y=0){return window.HoMoWCamera3D.project(this.camera,x,z,y);}
 draw(kind,x,y,z,sx,sy,sz,color,turn=0,material=null){
   if(this.opt?.lowTextures)material=null;
   const mesh=this.meshes[kind];
   if(this.cpu){
     const data=mesh.data,a=Math.cos(turn),b=Math.sin(turn),rgb=this.rgb(color);
     const vertices=kind==='cube'?quadVertices:triangleVertices;
     const stride=kind==='cube'?36:18;
     for(let i=0;i<data.length;i+=stride){
       const faceX=data[i+3],faceY=data[i+4],faceZ=data[i+5];
       const nx=faceX*a+faceZ*b,nz=-faceX*b+faceZ*a;
       if(faceY*.6+(nx*this.camera.s+nz*this.camera.c)*.8<=0)continue;
       const pts=[],uv=material?[]:null;
       let depth=0;
       for(const j of vertices){
         const xx=data[i+j]*sx,yy=data[i+j+1]*sy,zz=data[i+j+2]*sz;
         const vx=x+xx*a+zz*b,vy=y+yy,vz=z-xx*b+zz*a;
         pts.push(this.project(vx,vz,vy));
         depth+=(vz*this.camera.c+vx*this.camera.s)*.8+vy*.6;
         if(material)uv.push(surfaces.uv(xx,yy,zz,faceX,faceY,faceZ,sx,sy,sz));
       }
       const light=.67+.33*Math.max(0,(-nx*.5+faceY+nz*.6)/1.269);
       const face={pts,layer:sx>2000?-3:sx>800?-2:sy<=2&&y<=2?-1:0,depth:depth/pts.length,color:'rgb('+rgb.map(v=>Math.round(v*light)).join(',')+')'};
       if(material){face.material=material;face.uv=uv;}
       this.faces.push(face);
     }
     return;
   }
   const g=this.gl;
   if(this.activeMaterial!==material){
     if(material){
       if(!this.surfaceTextures.has(material))this.surfaceTextures.set(material,surfaces.texture(g,material));
       g.bindTexture(g.TEXTURE_2D,this.surfaceTextures.get(material));
     }
     g.uniform1i(this.u.textured,material?1:0);
     this.activeMaterial=material;
   }
   g.bindBuffer(g.ARRAY_BUFFER,mesh.buffer);
   this.attributes.forEach((a,i)=>{g.enableVertexAttribArray(a);g.vertexAttribPointer(a,3,g.FLOAT,false,24,i*12);});
   g.uniform3f(this.u.pos,x,y,z);g.uniform3f(this.u.size,sx,sy,sz);g.uniform1f(this.u.turn,turn);
   g.uniform3fv(this.u.color,this.rgb(color).map(v=>v/255));g.drawArrays(g.TRIANGLES,0,mesh.count);
 }
 rgb(color){if(!this.colorCache.has(color))this.colorCache.set(color,color.match(/\w\w/g).map(v=>parseInt(v,16)));return this.colorCache.get(color);}
 render(w,floaters=[]){if(this.lost)return;this.setup(w);const g=this.gl;if(this.cpu){this.faces=[];}else g.clear(g.COLOR_BUFFER_BIT|g.DEPTH_BUFFER_BIT);const staticKey=[this.width,this.height,this.cx,this.cz,this.zoom,this.yaw].join(':');if(this.cpu&&this.staticKey===staticKey){this.faces=this.staticFaces.slice();}else{this.draw('cube',480,-6,310,2800,10,2500,'6e8665');this.draw('cube',480,0,310,908,1,510,'8da077');this.decor(w);for(let i=0;i<24;i++){const x=95+i*33,z=458+Math.sin(i*.18)*20;this.draw('cube',x,1,z,35,2,44,i%3?'b5ae8d':'aaa482',-.1*Math.cos(i*.18));}for(let i=0;i<15;i++)for(const z of [65,610])this.tree(10+i*68+Math.sin(i*4)*13,z+Math.cos(i*3)*16,i);for(let i=0;i<5;i++)for(const x of [10,950])this.tree(x,180+i*85,i+1);
 for(const [x,z]of [[65,150],[900,210],[90,560],[870,550]])this.draw('sphere',x,9,z,19,14,18,'929c89');if(this.cpu){this.staticKey=staticKey;this.staticFaces=this.faces.slice();}}for(let i=0;i<10;i++){const a=i*Math.PI/5;this.draw('cube',225+Math.cos(a)*24,6,475+Math.sin(a)*24,12,8,10,'a3a28a',a);}this.draw('cone',225,4,475,13,35+Math.sin(w.time*8)*3,13,'e5ad5e');this.draw('cone',225,4,475,7,27,7,'ffe0a0');
 this.hero(w);
 const s=w.state;
 this.label(0,s.x,s.y,100,true,s.hp/s.maxHp);w.monsters.forEach((m,i)=>{this.label(i+1,m.x,m.y,m.type==='wolf'?90:70,m.alive,m.hp/m.maxHp);if(!m.alive)return;this.draw('sphere',m.x,1,m.y,31,1,23,'59674d');if(m.windup>0){for(let j=0;j<20;j++){const a=j*Math.PI/10;this.draw('cube',m.x+Math.cos(a)*55,2,m.y+Math.sin(a)*55,6,2,6,'dc8569');}}if(m.type==='slime'){const bob=Math.sin(w.time*3)*2;this.draw('sphere',m.x,22+bob,m.y,30+Math.sin(w.time*3)*2,24-bob,28,'92b366');this.draw('sphere',m.x-8,32+bob,m.y+19,8,4,5,'bdce8b');for(const x of [-9,9]){this.draw('cube',m.x+x,29+bob,m.y+25,5,6,3,'263b31');this.draw('cube',m.x+x,30+bob,m.y+27,2,2,1,'e2e8bb');}this.draw('cone',m.x,45+bob,m.y,7,12,7,'c5d28c');}else{const a=Math.atan2(m.facing.x,m.facing.y),part=(x,y,z,sx,sy,sz,col)=>this.draw('cube',m.x+x*Math.cos(a)+z*Math.sin(a),y,m.y-x*Math.sin(a)+z*Math.cos(a),sx,sy,sz,col,a),stride=m.walking?Math.sin(m.footstep)*4:0;for(const x of [-12,12])for(const z of [-18,18])part(x,13+(x*z>0?stride:-stride),z,8,25,8,'626e6c');this.draw('sphere',m.x,34,m.y,18,17,30,'9aa49b',a);part(0,38,5,26,18,35,'aeb8a7');part(0,49,26,24,23,23,'b1b8a8');part(0,40,36,18,9,20,'d1d2bc');part(0,43,42,16,11,15,'c3c8b5');part(0,44,50,12,7,3,'344844');for(const x of [-8,8]){part(x,64,22,7,16,8,'717e77');part(x,53,38,3,3,3,'eedb90');}part(0,36,-37,9,10,28,'7d8c83');}});this.combat(w);if(this.cpu)this.flush();this.damageLabels.forEach((el,i)=>{const f=floaters[i];el.style.display=f?'block':'none';if(f){const p=this.project(f.x,f.y+65,80+(1-f.life)*40);el.textContent=f.text;el.style.left=p.x+'px';el.style.top=p.y+'px';el.style.opacity=Math.min(1,f.life*3);el.style.color=f.type==='potion'?'#d2efa2':f.type==='hurt'?'#ffb695':'#fff0b4';}});
 }
 flush(transparent=false){const c=this.ctx,dpr=this.canvas.width/this.width;c.setTransform(dpr,0,0,dpr,0,0);if(transparent)c.clearRect(0,0,this.width,this.height);else{c.fillStyle='#657657';c.fillRect(0,0,this.width,this.height);}for(const face of this.faces.sort((a,b)=>a.layer-b.layer||a.depth-b.depth)){c.fillStyle=face.color;c.beginPath();face.pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();if(face.material)surfaces.paint(c,face);}}
 decor(w){
 for(const x of [570,690]){this.draw('cube',x,48,85,24,96,26,'a4aa91');this.draw('cube',x,99,85,32,9,32,'bec0a2');this.draw('cube',x,8,85,35,16,35,'7c8a78');}this.draw('cube',630,110,85,145,22,32,'a9b39a');this.draw('cube',630,111,103,15,14,4,'d1bf85');
 for(let i=0;i<3;i++)this.draw('cube',175+i*12,9,495,10,16,52,'816b49',.35);
 }
 hero(w){
 const s=w.state,look=s.appearance||{},R=window.BrukRealms,skin=(R?.APPEARANCE.skin[look.skin]||'#d4b28d').slice(1),hair=(R?.APPEARANCE.hair[look.hair]||'#62452e').slice(1),accent=(R?.APPEARANCE.accent[look.accent]||'#315c60').slice(1),a=Math.atan2(w.facing.x,w.facing.y),gait=w.gait??(w.walking?1:0),stride=Math.sin(w.footstep)*gait,bob=Math.abs(stride)*1.4+(1-gait)*Math.sin(w.time*2)*.25;
 const pose=weaponPose(w,stride);
 const part=(x,y,z,sx,sy,sz,col,turn=a,kind='cube')=>this.draw(kind,s.x+x*Math.cos(a)+z*Math.sin(a),y+bob,s.y-x*Math.sin(a)+z*Math.cos(a),sx*(look.body==='broad'?1.12:look.body==='slim'?.9:1),sy,sz,({'d4b28d':skin,'b78f70':skin,'c19a79':skin,'bb9272':skin,'62452e':hair,'705035':hair,'795638':hair,'654a35':hair,'315c60':accent,'3a6b6b':accent})[col]||col,turn);
 this.draw('sphere',s.x,1,s.y,26,1,19,'53644d');
 // Layered cloak, fitted cuirass and leather under-armour.
 part(0,43,-12,28,36,4,'315c60');part(0,25,-15-Math.sin(w.footstep)*1.5*gait,30,12,4,'3a6b6b');part(0,20,-16,31,3,4,'b59c67');
 for(const side of [-1,1]){const lift=Math.max(0,stride*side)*6,z=stride*side*7,x=side*8;
 part(x,23+lift,z,10,19,12,'36454b');part(x,13+lift,z+1,11,14,13,'637b80');part(x,20+lift,z+7,8,7,3,'b6c6c0');part(x,5+lift,z+4,12,8,21,'293c42');part(x,7+lift,z+10,12,4,9,'70878a');}
 part(0,43,0,28,29,19,w.hurt>0?'b17866':s.armorKind==='cloth'?'70608c':s.armorKind==='leather'?'806345':'506b74');part(0,46,9,25,23,4,s.armorKind==='cloth'?'9985b0':s.armorKind==='leather'?'b39265':'91a9aa');part(0,50,12,18,11,2,'bacac3');part(0,39,12,20,4,2,'6b878f');part(0,56,0,26,5,22,'c0cbc1');part(0,30,0,31,5,22,'574936');part(0,30,12,7,7,3,'d5b879');part(9,27,-1,6,10,7,'755e42');
 for(const side of [-1,1]){
   const x=side*18,hand=side>0?pose.right:pose.left,elbow={x:side*18,y:43,z:hand.z*.42};
   part(x,54,0,10,7,10,'9bafaf',a,'sphere');part(x,53,2,12,4,14,'b6c4bb');
   part(x,47,elbow.z/2,8,13,10,'415b63');
   for(const t of [0,.42,.8]){
     part(elbow.x+(hand.x-elbow.x)*t,elbow.y+(hand.y-elbow.y)*t,elbow.z+(hand.z-elbow.z)*t,
       5,6,5,t===0?'637b80':'829ba0',a,'orb');
   }
   part(hand.x,hand.y,hand.z,8,7,9,'554c3e');
 }
 // Shield rim, inset face, central boss and four rivets.
 if(!w.twoHanded&&(s.supportKind||'shield')==='shield'){part(-25,40,9,5,30,25,'c2a66b');part(-28,40,9,2,25,20,'345d68');part(-30,40,9,3,7,7,'c7b77d',a,'sphere');
 for(const y of [30,50])for(const z of [2,16])part(-30,y,z,2,2,2,'e0ce99',a,'sphere');
 }
 // Neck, ears, two eyes, brows, nose and layered swept hair.
 part(0,60,0,10,7,11,'b78f70');part(0,70,0,19,20,18,'d4b28d');for(const x of [-10,10])part(x,69,0,3,6,5,'c19a79');
 // Keep coplanar features in front of the head in the software painter, even at a three-quarter angle.
 const frontDot=this.camera.c*Math.cos(a)+this.camera.s*Math.sin(a);
 if(!this.cpu||frontDot>.01){
   const centerDepth=(s.x*this.camera.s+s.y*this.camera.c)*.8+(70+bob+(this.heroLift||0))*.6;
   const planeDepth=centerDepth+Math.max(frontDot*9*.8,Math.abs(Math.sin(a)*this.camera.c-Math.cos(a)*this.camera.s)*9.5*.8,6)+1;
   const detail=(x,y,z,sx,sy,sz,color,layer)=>{
     const from=this.cpu?this.faces.length:0;
     part(x,y,z,sx,sy,sz,color);
     if(this.cpu)for(let i=from;i<this.faces.length;i++)this.faces[i].depth=planeDepth+layer*.3+(this.faces[i].depth-centerDepth)*.008;
   };
   for(const side of [-1,1]){
     detail(side*4.8,71,9.5,4.2,2.8,1,'eee0c4',0);
     detail(side*4.8,71,10.1,2.3,2.6,.8,'334446',1);
     detail(side*4.8-.45,71.6,10.6,.7,.65,.4,'ffedc8',2);
     detail(side*4.8,74,9.8,4.8,1.35,1,hair,1);
   }
   detail(0,68,10,3,4,3,'bb9272',1);
   detail(0,64,9.6,5,1.1,1,'906d57',1);
 }
 if(look.style!=='shaved'){part(0,80,-1,22,6,21,'62452e');part(0,73,-9,21,13,4,'62452e');part(-9,75,1,4,9,13,'705035');part(3,83,0,15,3,16,'795638');part(-5,78,6,9,5,8,'705035');if(['long','braids'].includes(look.style))for(const side of [-1,1])part(side*10,62,-7,look.style==='braids'?5:8,25,7,hair);}
 // Every sword component shares the hand pivot, including the guard and pommel.
 if((s.weaponKind||'sword')==='sword'){
 const turn=a+pose.yaw;
 const variant=s.weaponVariant||'sword_broadsword';
 const tier=s.variantArsenal?.[variant]??0;
 const enchant=s.enchantments?.['variant:'+variant]||0;
 const dual=variant==='sword_dual', heavy=variant==='sword_claymore';
 const trim=tier>=9?'ebc875':tier>=5?'c3b28c':'a89979';
 for(const side of dual?[-1,1]:[1]){
   const hand=side>0?pose.right:pose.left;
   const handX=s.x+hand.x*Math.cos(a)+hand.z*Math.sin(a);
   const handZ=s.y-hand.x*Math.sin(a)+hand.z*Math.cos(a);
   const angle=turn+(dual?side*.28:0);
   const sword=(z,x,sx,sy,sz,col,kind='cube',lift=0,material='steel',twist=0)=>this.draw(kind,
     handX+x*Math.cos(angle)+z*Math.sin(angle),hand.y+bob+lift,
     handZ-x*Math.sin(angle)+z*Math.cos(angle),sx,sy,sz,col,angle+twist,material);
   const length=(heavy?60:dual?35:48)+tier*.6;
   const width=(heavy?12:dual?6:8)+tier*.15;
   sword(0,0,4,4,heavy?21:13,'826044','cube',0,'leather');
   sword(heavy?-12:-8,0,5,5,5,trim,'sphere');
   sword(8,0,heavy?25:dual?13:19,4,4,trim);
   sword(10,0,width,7,length,'d7e6e5','blade');
   for(let i=0;i<Math.floor(tier/3);i++){
     for(const edge of [-1,1])sword(11+i*3,edge*(width/2+1),3,4,5,trim);
   }
   if(enchant){
     const color=runeColors[enchant];
     sword(19,0,2,2,13+enchant,color,'cube',3,'rune');
     enchantEffect(enchant,w.time,(x,y,z,sx,sy,sz,ink,kind,twist)=>
       sword(13+z,x,sx,sy,sz,ink,kind,y,null,twist));
   }
 }
 }else this.weapon?.(w,a,bob,pose);
 if(s.appearance?.beard&&s.appearance.beard!=='none')part(0,look.beard==='full'?59:63,8,14,look.beard==='full'?13:4,5,hair);
 if(s.outfits?.head)part(0,81,0,24,7,23,s.outfits.head==='soldier_helm'?'a5b8b6':'526d58');
 if(s.supportKind==='focus'&&!w.twoHanded)part(-25,39,10,6,23,17,'9479a6');
 if(s.supportKind==='torch'&&!w.twoHanded){part(-25,40,10,4,30,4,'81684b');part(-25,57,10,6,13,6,'edb774',a,'cone');}
 }
 combat(w){if(w.aimTarget&&!w.swing){const dx=w.aimTarget.x-w.state.x,dz=w.aimTarget.y-w.state.y,l=Math.hypot(dx,dz)||1;for(let i=1;i<=5;i++)this.draw('cube',w.state.x+dx/l*i*17,2,w.state.y+dz/l*i*17,2,1,2,'dece96');}for(const effect of w.effects){const t=1-effect.life/effect.max;for(let i=0;i<6;i++){const a=i*Math.PI/3;this.draw('cube',effect.x+Math.cos(a)*t*30,32+t*24,effect.y+20+Math.sin(a)*t*20,3,6,3,'f0cf81',a+t);}}
 if(w.swing>0){const t=1-w.swing/.3,a=Math.atan2(w.facing.y,w.facing.x);for(let i=0;i<6;i++){const f=a-1+i*.3+t*.6;this.draw('cube',w.state.x+Math.cos(f)*57,30,w.state.y+Math.sin(f)*57,4,3,4,'e8d39c',f);}}
 }
 tree(x,z,i){this.draw('cone',x+15,1,z+10,26,1,19,'59744f');this.draw('cube',x,25,z,12,50,12,'76644a');this.draw('cone',x,35,z,30,75+(i%3)*12,30,i%2?'3b6050':'526c48');this.draw('cone',x,63,z,23,62,23,i%2?'456e57':'607b52');}
 label(index,x,z,y,visible,health=1){const el=this.labels[index],p=this.project(x,z,y);el.style.display=visible?'block':'none';el.style.left=p.x+'px';el.style.top=p.y+'px';el.querySelector('b').style.width=Math.max(0,health)*100+'%';}
}
 window.HoMoWBeta3D={Scene,meshData,runeColors,enchantEffect};})();
