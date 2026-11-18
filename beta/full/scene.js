/* Full canonical world presented in 3D. No game rules live in this renderer. */
(()=>{'use strict';
const R=window.BrukRealms,C=window.HoMoWCamera3D;
class Scene extends window.HoMoWBeta3D.Scene{
 constructor(canvas){super(canvas);this.labels.forEach(el=>el.remove());this.damageLabels.forEach(el=>el.remove());this.labels=[];this.damageLabels=[];this.visible=0;}
 setup(w){super.setup(w);this.camera=C.create(this.width,this.height,w.state.x,w.state.y,this.yaw,this.zoom);Object.assign(this,this.camera);const opt=window.HoMoWOptions.get(),dims=window.HoMoWOptions.dimensions(this.width,this.height,opt,devicePixelRatio||1);if(this.canvas.width!==dims.width)this.canvas.width=dims.width;if(this.canvas.height!==dims.height)this.canvas.height=dims.height;if(!this.cpu){const g=this.gl;g.viewport(0,0,this.canvas.width,this.canvas.height);g.uniform4f(this.u.camera,this.spanX,this.spanY,0,0);g.uniform2f(this.u.center,this.cx,this.cz);g.uniform2f(this.u.orbit,this.camera.c,this.camera.s);}}
 visibleAt(o,padding=150){const p=this.project(o.x,o.y);return p.x>-padding&&p.y>-padding&&p.x<this.width+padding&&p.y<this.height+padding;}
 tag(text,x,z,height,hp=1,enemy=false){const i=this.labelCount++;if(!this.labels[i]){const el=document.createElement('div');el.className='scene-label';el.innerHTML='<span></span><i><b></b></i>';this.input.parentElement.append(el);this.labels[i]=el;}const el=this.labels[i],p=this.project(x,z,height);el.hidden=false;el.dataset.side=enemy?'enemy':'player';el.querySelector('span').textContent=text;el.querySelector('b').style.width=Math.max(0,Math.min(1,hp))*100+'%';el.style.left=p.x+'px';el.style.top=p.y+'px';}
 render(w){if(this.lost)return;this.setup(w);this.labelCount=0;this.visible=0;if(this.cpu)this.faces=[];else this.gl.clear(this.gl.COLOR_BUFFER_BIT|this.gl.DEPTH_BUFFER_BIT);
 const cluster=R.clusterOf(w.state),area=R.DUNGEONS.find(d=>'dungeon:'+d.id===cluster)?.arena||R.clusterAt(w.state.x,w.state.y);
 this.draw('cube',area.x+area.w/2,-7,area.y+area.h/2,area.w,10,area.h,'6e8063');
 const show=o=>R.clusterOf(o)===cluster&&this.visibleAt(o);
 for(const o of R.OBSTACLES){const center={x:o.x+o.w/2,y:o.y+o.h/2};if(R.clusterOf(center)!==cluster||!this.visibleAt(center,Math.max(o.w,o.h)))continue;
  if(o.type==='house'){this.draw('cube',center.x,40,center.y,o.w,80,o.h,'9b9c7d');this.draw('cone',center.x,80,center.y,o.w*.75,70,o.h*.75,'795d49');this.draw('cube',center.x,24,o.y+o.h+1,24,48,3,'453c30');}
  else if(o.type==='water')this.draw('cube',center.x,-1,center.y,o.w,1,o.h,'558d92');
  else if(o.type==='wall')this.draw('cube',center.x,30,center.y,o.w,60,o.h,'929887');
  else this.draw('sphere',center.x,22,center.y,o.w/2,38,o.h/2,'858f81');this.visible++;
 }
 for(const n of w.nodes){if(!show(n))continue;this.visible++;if(n.type==='wood')this.tree(n.x,n.y,n.id%3);else if(n.type==='herb'){this.draw('cone',n.x,1,n.y,12,22,12,n.charges?'8eb58a':'6b7056');}else this.draw('sphere',n.x,12,n.y,23,22,19,n.charges?'a3aa93':'646e63');this.tag(R.NODE_TYPES[n.type].name,n.x,n.y,52,n.charges/R.NODE_TYPES[n.type].charges);}
 for(const [id,n]of Object.entries(R.townTraders(w.state))){if(!show(n))continue;this.hero({state:{...w.state,x:n.x,y:n.y},facing:{x:0,y:1},walking:false,footstep:0,time:w.time,swing:0,hurt:0});this.tag(n.name,n.x,n.y,100);this.visible++;}
 for(const n of R.GUARDS){if(show(n)){this.hero({state:{x:n.x,y:n.y},facing:{x:1,y:0},walking:false,footstep:0,time:w.time,swing:0,hurt:0});this.tag(n.name,n.x,n.y,100);}}
 for(const o of R.DECOR){if(!show(o)||['grass','flower','flowers'].includes(o.kind))continue;if(o.kind==='tree')this.tree(o.x,o.y,0);else this.draw('sphere',o.x,7,o.y,15,12,11,'8a9584');}
 if(!w.state.passUnlocked&&this.visibleAt({x:R.PASS.barrierX,y:R.PASS.y+R.PASS.h/2}))this.draw('cube',R.PASS.barrierX,45,R.PASS.y+R.PASS.h/2,20,90,R.PASS.h,'7a8475');
 const run=w.state.expeditions.run,dungeon=R.DUNGEONS.find(d=>d.id===run?.id);
 if(dungeon){for(const gate of dungeon.gates)if(run.stage<gate.stage)this.draw('cube',gate.x+gate.w/2,35,gate.y+gate.h/2,gate.w,70,gate.h,'899c9e');for(const [p,name]of [[dungeon.chest,'E · Скриня'],[dungeon.exit,'E · Вихід']]){this.draw('cube',p.x,15,p.y,32,30,25,'bba36c');this.tag(name,p.x,p.y,65);}}
 for(const p of R.PORTALS){if(!show(p))continue;for(const side of [-1,1])this.draw('cube',p.x+side*35,40,p.y,14,80,18,'a6b0a0');this.draw('cube',p.x,86,p.y,90,15,18,'cab981');this.tag('E · Перехід',p.x,p.y,115);}
 for(const d of R.DUNGEONS){const p=d.entry;if(p&&show(p)){this.draw('cone',p.x,1,p.y,65,90,60,'566873');this.tag(d.name,p.x,p.y,110);}}
 if(show(R.MONOLITH)){const p=R.MONOLITH;this.draw('cube',p.x,62,p.y,35,124,35,w.state.monolithAwakened?'7fc6ba':'74877b');this.tag('E · Моноліт',p.x,p.y,145);}
 if(show(R.BILLBOARD)){const p=R.BILLBOARD;this.draw('cube',p.x,40,p.y,65,50,10,'9e8b60');this.tag('E · Дошка пошани',p.x,p.y,85);}
 for(const m of w.monsters){if(!m.alive||!show(m))continue;this.monster(m,w.time);const t=R.TYPES[m.type];this.tag(t.name+' · '+(t.level||1),m.x,m.y,t.boss?155:85,m.hp/t.hp,true);this.visible++;}
 for(const d of w.state.drops){if(show(d))this.draw('cube',d.x,7,d.y,15,14,15,'d2b36f');}
 for(const p of w.projectiles){if(show(p))this.draw('sphere',p.x,28,p.y,p.magic?7:3,p.magic?7:3,9,p.magic?'c8a6e5':'e8d9af');}
 this.hero(w);this.combat({...w,effects:[]});this.tag((w.onlineName||'Мандрівник')+' · '+w.state.level,w.state.x,w.state.y,105,w.state.hp/R.maxHp(w.state));
 for(let i=this.labelCount;i<this.labels.length;i++)this.labels[i].hidden=true;
 if(this.cpu)this.flush();
 }
 monster(m,time){const t=R.TYPES[m.type],type=t.model||m.type,color=(t.color||'#a3ab8c').replace('#',''),scale=t.boss?1.8:1,r=t.radius;
 if(type==='slime'){this.draw('sphere',m.x,15,m.y,r,18+Math.sin(time*3),r,color);for(const x of [-7,7])this.draw('cube',m.x+x,23,m.y+17,4,4,3,'24382e');}
 else if(['wolf','boar','bear','rat','salamander'].includes(type)){const a=Math.atan2((m.facing?.x||0),(m.facing?.y||1));this.draw('sphere',m.x,25,m.y,r*.8,20,r*1.3,color,a);this.draw('sphere',m.x+(m.facing?.x||0)*25,37,m.y+(m.facing?.y||1)*25,13,14,17,color,a);for(const x of [-12,12])for(const z of [-15,15])this.draw('cube',m.x+x,10+Math.sin((m.footstep||0)+x*z)*2,m.y+z,7,20,7,'5c6659');}
 else if(['bandit','skeleton','mage'].includes(type)){this.hero({state:{x:m.x,y:m.y},facing:m.facing||{x:0,y:1},walking:m.walking,footstep:m.footstep||0,time,swing:0,hurt:m.hit});}
 else {this.draw('sphere',m.x,35*scale,m.y,r,35*scale,r,color);this.draw('cube',m.x,72*scale,m.y,r,25*scale,r,color);for(const x of [-1,1]){this.draw('cube',m.x+x*r,35*scale,m.y,15,45*scale,18,color);this.draw('cube',m.x+x*12,10,m.y,16,20,20,'626e66');}}
 if(m.telegraph){const radius=m.telegraph.radius||t.range||70;for(let i=0;i<24;i++){const a=i*Math.PI/12;this.draw('cube',m.x+Math.cos(a)*radius,2,m.y+Math.sin(a)*radius,6,2,6,'e4926a');}}
 }
}
window.HoMoWFull.Scene=Scene;
})();
