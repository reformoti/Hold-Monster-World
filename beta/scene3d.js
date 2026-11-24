/* Minimal native WebGL scene. No engine download, full-world data, or network API. */
(()=>{'use strict';
const surfaces=window.HoMoWMaterials;
const vertex=`attribute vec3 p,n;uniform vec3 pos,size;uniform mat3 rotation;uniform vec4 camera;uniform vec2 center,orbit;varying float light;
varying vec2 surfaceUV; varying vec3 sight; varying vec2 worldXZ;
uniform vec4 viewLimit;
uniform vec4 focus;
void main(){vec3 q=p*size;
vec3 face=abs(n);
if(face.y>=max(face.x,face.z)) surfaceUV=size.x>size.z?q.zx:q.xz;
else if(face.x>=face.z) surfaceUV=size.y>size.z?q.zy:q.yz;
else surfaceUV=size.x>size.y?q.yx:q.xy;
surfaceUV/=${surfaces.units.toFixed(1)};
vec3 v=rotation*q+pos;worldXZ=v.xz;vec3 normal=normalize(rotation*(n/size));light=.67+.33*max(0.,dot(normal,normalize(vec3(-.5,1.,.6))));float dx=v.x-center.x,dz=v.z-center.y;float x=dx*orbit.x-dz*orbit.y,z=dx*orbit.y+dz*orbit.x;vec3 delta=v-focus.xyz;float fz=dot(delta.xz,orbit.yx);sight=vec3((delta.x*orbit.x-delta.z*orbit.y)/(34.*focus.w),(delta.y*.8-fz*.6)/(43.*focus.w),fz*.8+delta.y*.6);gl_Position=vec4(x/camera.x,(-z*.6+v.y*.8)/camera.y,-(z*.8+v.y*.6)/1800.,1.);}`;
const fragment=`precision mediump float;uniform vec3 color;varying float light;
varying vec2 surfaceUV; varying vec3 sight; varying vec2 worldXZ;
uniform vec4 viewLimit;
uniform sampler2D surface;
uniform bool textured,covered;
void main(){float distance=length(worldXZ-viewLimit.xy);if(viewLimit.z>0.&&distance>viewLimit.z)discard;if(covered&&sight.z>5.&&dot(sight.xy,sight.xy)<1.)discard;float detail=textured?texture2D(surface,surfaceUV).r:1.;float fog=viewLimit.z>0.?smoothstep(viewLimit.w,viewLimit.z,distance):0.;gl_FragColor=vec4(mix(color*light*detail,vec3(.34902,.38824,.34510),fog),1.);}`;
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
 const shader=(type,src)=>{const s=g.createShader(type);g.shaderSource(s,src);g.compileShader(s);if(!g.getShaderParameter(s,g.COMPILE_STATUS))throw Error(g.getShaderInfoLog(s));return s;};const program=this.program=g.createProgram();g.attachShader(program,shader(g.VERTEX_SHADER,vertex));g.attachShader(program,shader(g.FRAGMENT_SHADER,fragment));g.linkProgram(program);if(!g.getProgramParameter(program,g.LINK_STATUS))throw Error('WebGL link failed');g.useProgram(program);this.u={};for(const key of ['pos','size','rotation','focus','covered','viewLimit','camera','center','orbit','color','surface','textured'])this.u[key]=g.getUniformLocation(program,key);this.attributes=[g.getAttribLocation(program,'p'),g.getAttribLocation(program,'n')];this.meshes={};for(const key of ['cube','cone','sphere','orb','blade','roof']){const data=meshData(key),buffer=g.createBuffer();g.bindBuffer(g.ARRAY_BUFFER,buffer);g.bufferData(g.ARRAY_BUFFER,data,g.STATIC_DRAW);this.meshes[key]={buffer,count:data.length/6};}this.surfaceTextures=new Map([['steel',surfaces.texture(g,'steel')]]);
 g.uniform1i(this.u.surface,0);this.activeMaterial=null;g.enable(g.DEPTH_TEST);g.clearColor(.39,.46,.34,1);}else{this.meshes={};for(const key of ['cube','cone','sphere','orb','blade','roof'])this.meshes[key]={data:meshData(key)};}this.labels=[];for(const text of ['Мандрівник · 1','Лісовий слиз','Дикий вовк']){const el=document.createElement('div');el.className='scene-label';el.innerHTML='<span></span><i><b></b></i>';el.dataset.side=this.labels.length?'enemy':'player';el.querySelector('span').textContent=text;input.parentElement.append(el);this.labels.push(el);}this.damageLabels=[];for(let i=0;i<12;i++){const el=document.createElement('div');el.className='damage-number';input.parentElement.append(el);this.damageLabels.push(el);}input.style.opacity='0';this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.lost=true;(document.getElementById('worldNotice')||document.getElementById('notice')||{}).textContent='3D-контекст втрачено. Онови сторінку.';});
 }
 rotate(delta){this.yaw=(this.yaw+delta)%(Math.PI*2);}
 magnify(factor){this.zoom=Math.max(.65,Math.min(1.85,this.zoom*factor));}
 resetCamera(){this.yaw=-.48;this.zoom=1.08;}
 setup(w){const r=this.input.getBoundingClientRect(),dpr=Math.min(1.5,devicePixelRatio||1);if(this.canvas.width!==Math.round(r.width*dpr)||this.canvas.height!==Math.round(r.height*dpr)){this.canvas.width=Math.round(r.width*dpr);this.canvas.height=Math.round(r.height*dpr);}this.width=r.width;this.height=r.height;const follow=r.width<700?1:Math.max(0,Math.min(1,(this.zoom-1)*1.6));this.camera=window.HoMoWCamera3D.create(r.width,r.height,480+(w.state.x-480)*follow,310+(w.state.y-310)*follow,this.yaw,this.zoom);Object.assign(this,this.camera);if(this.cpu)return;const g=this.gl;g.viewport(0,0,this.canvas.width,this.canvas.height);g.uniform4f(this.u.camera,this.spanX,this.spanY,0,0);g.uniform2f(this.u.center,this.cx,this.cz);g.uniform2f(this.u.orbit,this.camera.c,this.camera.s);}
 pick(x,y){return window.HoMoWCamera3D.pick(this.camera,x,y);}
 project(x,z,y=0){return window.HoMoWCamera3D.project(this.camera,x,z,y);}
 draw(kind,x,y,z,sx,sy,sz,color,turn=0,material=null,pitch=0,lean=0){
   if(this.opt?.lowTextures)material=null;
   let mesh=this.meshes[kind];
   if(!mesh){
     const data=window.HoMoWForms.meshes.get(kind);
     if(this.cpu)mesh={data};
     else{const g=this.gl,buffer=g.createBuffer();g.bindBuffer(g.ARRAY_BUFFER,buffer);
       g.bufferData(g.ARRAY_BUFFER,data,g.STATIC_DRAW);mesh={buffer,count:data.length/6};}
     this.meshes[kind]=mesh;
   }
   if(this.lastYaw!==turn||this.lastPitch!==pitch||this.lastLean!==lean||!this.rotation){
     this.rotation=window.HoMoWForms.basis(turn,pitch,lean);
     this.lastYaw=turn;this.lastPitch=pitch;this.lastLean=lean;
     if(!this.cpu)this.gl.uniformMatrix3fv(this.u.rotation,false,this.rotation);
   }
   const m=this.rotation,covered=!!(this.cutaway&&(this.cover||kind.startsWith('tree/')));
   if(!this.cpu&&this.gpuCover!==covered){
     this.gl.uniform1i(this.u.covered,covered?1:0);this.gpuCover=covered;
     if(covered){const f=this.cutaway;this.gl.uniform4f(this.u.focus,f.x,f.y,f.z,f.scale);}
   }
   if(this.cpu){
     const data=mesh.data,rgb=this.rgb(color);
     const vertices=kind==='cube'?quadVertices:triangleVertices;
     const up=this.camera.elevationSin??.6,forward=this.camera.elevationCos??.8;
     const stride=kind==='cube'?36:18;
     for(let i=0;i<data.length;i+=stride){
       const faceX=data[i+3],faceY=data[i+4],faceZ=data[i+5];
       const ax=faceX/sx,ay=faceY/sy,az=faceZ/sz;
       const inv=1/(Math.hypot(ax,ay,az)||1);
       const nx=(ax*m[0]+ay*m[3]+az*m[6])*inv,ny=(ax*m[1]+ay*m[4]+az*m[7])*inv,nz=(ax*m[2]+ay*m[5]+az*m[8])*inv;
       if(ny*up+(nx*this.camera.s+nz*this.camera.c)*forward<=0)continue;
       const pts=[],uv=material?[]:null;
       let depth=0;
       for(const j of vertices){
         const xx=data[i+j]*sx,yy=data[i+j+1]*sy,zz=data[i+j+2]*sz;
         const vx=x+xx*m[0]+yy*m[3]+zz*m[6],vy=y+xx*m[1]+yy*m[4]+zz*m[7],vz=z+xx*m[2]+yy*m[5]+zz*m[8];
         const projected=this.project(vx,vz,vy);
         projected.depth=(vz*this.camera.c+vx*this.camera.s)*forward+vy*up;
         if(this.visibility){projected.wx=vx;projected.wz=vz;}
         pts.push(projected);depth+=projected.depth;
         if(material)uv.push(surfaces.uv(xx,yy,zz,faceX,faceY,faceZ,sx,sy,sz));
       }
       const light=.67+.33*Math.max(0,(-nx*.5+ny+nz*.6)/1.269);
       const shaded=rgb.map(v=>Math.round(v*light));
       const face={pts,rgb:shaded,layer:kind.startsWith('land/meadow/')?-1.8:kind.startsWith('land/pond/')?-1.3:sx>2000?-3:sx>800?-2:sy<=2&&y<=2?-1:0,depth:depth/pts.length,color:'rgb('+shaded.join(',')+')'};
       if(covered)face.cutaway=this.cutaway;
       if(this.visibility)face.visibility=this.visibility;
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
   g.uniform3f(this.u.pos,x,y,z);g.uniform3f(this.u.size,sx,sy,sz);
   g.uniform3fv(this.u.color,this.rgb(color).map(v=>v/255));g.drawArrays(g.TRIANGLES,0,mesh.count);
 }
 rgb(color){if(!this.colorCache.has(color))this.colorCache.set(color,color.match(/\w\w/g).map(v=>parseInt(v,16)));return this.colorCache.get(color);}
 render(w,floaters=[]){if(this.lost)return;this.setup(w);const g=this.gl;if(this.cpu){this.faces=[];}else g.clear(g.COLOR_BUFFER_BIT|g.DEPTH_BUFFER_BIT);const staticKey=[this.width,this.height,this.cx,this.cz,this.zoom,this.yaw].join(':');if(this.cpu&&this.staticKey===staticKey){this.faces=this.staticFaces.slice();}else{this.draw('cube',480,-6,310,2800,10,2500,'6e8665');this.draw('cube',480,0,310,908,1,510,'8da077');this.decor(w);for(let i=0;i<24;i++){const x=95+i*33,z=458+Math.sin(i*.18)*20;this.draw('cube',x,1,z,35,2,44,i%3?'b5ae8d':'aaa482',-.1*Math.cos(i*.18));}for(let i=0;i<15;i++)for(const z of [65,610])this.tree(10+i*68+Math.sin(i*4)*13,z+Math.cos(i*3)*16,i);for(let i=0;i<5;i++)for(const x of [10,950])this.tree(x,180+i*85,i+1);
 for(const [x,z]of [[65,150],[900,210],[90,560],[870,550]])this.draw('sphere',x,9,z,19,14,18,'929c89');if(this.cpu){this.staticKey=staticKey;this.staticFaces=this.faces.slice();}}for(let i=0;i<10;i++){const a=i*Math.PI/5;this.draw('cube',225+Math.cos(a)*24,6,475+Math.sin(a)*24,12,8,10,'a3a28a',a);}this.draw('cone',225,4,475,13,35+Math.sin(w.time*8)*3,13,'e5ad5e');this.draw('cone',225,4,475,7,27,7,'ffe0a0');
 this.hero(w);
 const s=w.state;
 this.label(0,s.x,s.y,100,true,s.hp/s.maxHp);w.monsters.forEach((m,i)=>{this.label(i+1,m.x,m.y,m.type==='wolf'?90:70,m.alive,m.hp/m.maxHp);if(!m.alive)return;this.draw('sphere',m.x,1,m.y,31,1,23,'59674d');if(m.windup>0){for(let j=0;j<20;j++){const a=j*Math.PI/10;this.draw('cube',m.x+Math.cos(a)*55,2,m.y+Math.sin(a)*55,6,2,6,'dc8569');}}if(m.type==='slime'){const bob=Math.sin(w.time*3)*2;this.draw('sphere',m.x,22+bob,m.y,30+Math.sin(w.time*3)*2,24-bob,28,'92b366');this.draw('sphere',m.x-8,32+bob,m.y+19,8,4,5,'bdce8b');for(const x of [-9,9]){this.draw('cube',m.x+x,29+bob,m.y+25,5,6,3,'263b31');this.draw('cube',m.x+x,30+bob,m.y+27,2,2,1,'e2e8bb');}this.draw('cone',m.x,45+bob,m.y,7,12,7,'c5d28c');}else{const a=Math.atan2(m.facing.x,m.facing.y),part=(x,y,z,sx,sy,sz,col)=>this.draw('cube',m.x+x*Math.cos(a)+z*Math.sin(a),y,m.y-x*Math.sin(a)+z*Math.cos(a),sx,sy,sz,col,a),stride=m.walking?Math.sin(m.footstep)*4:0;for(const x of [-12,12])for(const z of [-18,18])part(x,13+(x*z>0?stride:-stride),z,8,25,8,'626e6c');this.draw('sphere',m.x,34,m.y,18,17,30,'9aa49b',a);part(0,38,5,26,18,35,'aeb8a7');part(0,49,26,24,23,23,'b1b8a8');part(0,40,36,18,9,20,'d1d2bc');part(0,43,42,16,11,15,'c3c8b5');part(0,44,50,12,7,3,'344844');for(const x of [-8,8]){part(x,64,22,7,16,8,'717e77');part(x,53,38,3,3,3,'eedb90');}part(0,36,-37,9,10,28,'7d8c83');}});this.combat(w);if(this.cpu)this.flush();this.damageLabels.forEach((el,i)=>{const f=floaters[i];el.style.display=f?'block':'none';if(f){const p=this.project(f.x,f.y+65,80+(1-f.life)*40);el.textContent=f.text;el.style.left=p.x+'px';el.style.top=p.y+'px';el.style.opacity=Math.min(1,f.life*3);el.style.color=f.type==='potion'?'#d2efa2':f.type==='hurt'?'#ffb695':'#fff0b4';}});
 }
 flush(transparent=false){if(window.HoMoWRaster.flush(this,transparent))return;const c=this.ctx,dpr=this.canvas.width/this.width;c.setTransform(dpr,0,0,dpr,0,0);if(transparent)c.clearRect(0,0,this.width,this.height);else{c.fillStyle='#768068';c.fillRect(0,0,this.width,this.height);}for(const face of this.faces.sort((a,b)=>a.layer-b.layer||a.depth-b.depth)){c.fillStyle=face.color;c.beginPath();face.pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();if(face.material)surfaces.paint(c,face);}}
 decor(w){
 for(const x of [570,690]){this.draw('cube',x,48,85,24,96,26,'a4aa91');this.draw('cube',x,99,85,32,9,32,'bec0a2');this.draw('cube',x,8,85,35,16,35,'7c8a78');}this.draw('cube',630,110,85,145,22,32,'a9b39a');this.draw('cube',630,111,103,15,14,4,'d1bf85');
 for(let i=0;i<3;i++)this.draw('cube',175+i*12,9,495,10,16,52,'816b49',.35);
 }
 hero(w){window.HoMoWAvatar.draw(this,w);}
 combat(w){if(w.aimTarget&&!w.swing){const dx=w.aimTarget.x-w.state.x,dz=w.aimTarget.y-w.state.y,l=Math.hypot(dx,dz)||1;for(let i=1;i<=5;i++)this.draw('cube',w.state.x+dx/l*i*17,2,w.state.y+dz/l*i*17,2,1,2,'dece96');}for(const effect of w.effects){const t=1-effect.life/effect.max;for(let i=0;i<6;i++){const a=i*Math.PI/3;this.draw('cube',effect.x+Math.cos(a)*t*30,32+t*24,effect.y+20+Math.sin(a)*t*20,3,6,3,'f0cf81',a+t);}}
 if(w.swing>0){const t=1-w.swing/.3,a=Math.atan2(w.facing.y,w.facing.x);for(let i=0;i<6;i++){const f=a-1+i*.3+t*.6;this.draw('cube',w.state.x+Math.cos(f)*57,30,w.state.y+Math.sin(f)*57,4,3,4,'e8d39c',f);}}
 }
 tree(x,z,i){this.draw('cone',x+15,1,z+10,26,1,19,'59744f');this.draw('cube',x,25,z,12,50,12,'76644a');this.draw('cone',x,35,z,30,75+(i%3)*12,30,i%2?'3b6050':'526c48');this.draw('cone',x,63,z,23,62,23,i%2?'456e57':'607b52');}
 label(index,x,z,y,visible,health=1){const el=this.labels[index],p=this.project(x,z,y);el.style.display=visible?'block':'none';el.style.left=p.x+'px';el.style.top=p.y+'px';el.querySelector('b').style.width=Math.max(0,health)*100+'%';}
}
 window.HoMoWBeta3D={Scene,meshData,runeColors,enchantEffect};})();
