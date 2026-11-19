/* Full canonical world presented in 3D. No game rules live in this renderer. */
(()=>{'use strict';
const R=window.BrukRealms,C=window.HoMoWCamera3D;
class Scene extends window.HoMoWBeta3D.Scene{
 constructor(canvas){super(canvas);this.labels.forEach(el=>el.remove());this.damageLabels.forEach(el=>el.remove());this.labels=[];this.damageLabels=[];this.visible=0;}
 setup(w){this.opt=window.HoMoWOptions.get();const r=this.input.getBoundingClientRect();this.width=r.width;this.height=r.height;this.camera=C.create(this.width,this.height,w.state.x,w.state.y,this.yaw,this.zoom);Object.assign(this,this.camera);const opt=window.HoMoWOptions.get(),dims=window.HoMoWOptions.dimensions(this.width,this.height,opt,devicePixelRatio||1);if(this.canvas.width!==dims.width)this.canvas.width=dims.width;if(this.canvas.height!==dims.height)this.canvas.height=dims.height;if(!this.cpu){const g=this.gl;g.viewport(0,0,this.canvas.width,this.canvas.height);g.uniform4f(this.u.camera,this.spanX,this.spanY,0,0);g.uniform2f(this.u.center,this.cx,this.cz);g.uniform2f(this.u.orbit,this.camera.c,this.camera.s);}}
 draw(kind,x,y,z,...args){if(kind==='sphere'&&args[1]===1&&this.opt?.shadows===false)return;if(kind==='sphere'&&this.opt?.lowTextures)kind='cube';return super.draw(kind,x,y+(this.heroLift||0),z,...args);}
 hero(w){const s=w.state;this.heroLift=0;if(s.mounted){const color=R.MOUNTS[s.selectedMount]?.color?.slice(1)||'a18363',a=Math.atan2(w.facing.x,w.facing.y);this.draw('sphere',s.x,26,s.y,21,23,42,color,a);for(const x of [-15,15])for(const z of [-25,25])this.draw('cube',s.x+x,12,s.y+z,7,24,7,'5b5f50');this.draw('sphere',s.x+w.facing.x*37,52,s.y+w.facing.y*37,13,23,15,color,a);this.heroLift=37;}super.hero({...w,time:this.opt?.animations===false?0:w.time,walking:this.opt?.animations===false?false:w.walking,footstep:this.opt?.animations===false?0:w.footstep,twoHanded:s.weaponVariant?!R.offhandActive(s):false});this.heroLift=0;}
 weapon(w,a,bob){const s=w.state,f=s.weaponKind,v=R.VARIANTS[s.weaponVariant],length=v?.reach||1,arc=w.swing>0?Math.sin((1-w.swing/.3)*Math.PI)*1.2:0,turn=a+arc;
 const part=(x,y,z,sx,sy,sz,color,kind='cube')=>this.draw(kind,s.x+x*Math.cos(turn)+z*Math.sin(turn),y+bob,s.y-x*Math.sin(turn)+z*Math.cos(turn),sx,sy,sz,color,turn);
 const metal=s.enchantments?.['variant:'+s.weaponVariant]?'d6c094':'b8cbcb';
 if(f==='axe'){part(20,34,22,5,5,60*length,'705c40');part(20,34,47*length,32,8,17,metal);}
 if(f==='spear'){part(18,32,30,4,4,95*length,'7b6646');part(18,32,80*length,10,7,22,metal,'blade');}
 if(f==='daggers'){for(const side of v?.hands===2?[-1,1]:[1]){part(side*20,32,18,4,5,15,'6b5844');part(side*20,32,25,7,5,23,metal,'blade');}}
 if(f==='bow'){part(0,37,20,36,4,5,'826842');for(const side of [-1,1]){part(side*20,37,14,6,5,20,'a88a57');part(side*10,37,4,23,1,1,'dbd5ad');}if(s.weaponVariant==='bow_crossbow')part(0,36,6,6,5,40,'796346');else part(0,38,23,2,2,42,'dacdb0');}
 if(f==='staff'){part(19,38,6,5,68*length,5,'7a6853');part(19,75*length,6,10,15,10,s.weaponVariant?.includes('frost')?'9ed7e6':'e7af72','sphere');}
 }

 trader(n,id,time){
  // Civilian silhouettes and profession tools, independent of player equipment.
  const palette={blacksmith:['665040','a58a63'],mage:['615a8e','b5a2cc'],enchanter:['3e7774','9bcfc2'],armorer:['5b6e7b','9cabb0'],alchemist:['526f49','b8c583'],artificer:['876e49','cfb887'],quartermaster:['525e66','c3b698'],market:['945e4b','dec185']};
  const [cloth,trim]=palette[id]||palette.market,bob=this.opt?.animations===false?0:Math.sin(time*1.8+n.x)*.35;
  const part=(x,y,z,sx,sy,sz,color,kind='cube')=>this.draw(kind,n.x+x,y+bob,n.y+z,sx,sy,sz,color);
  if(this.opt?.shadows!==false)part(0,1,0,23,1,15,'53644d','sphere');
  for(const x of [-7,7]){part(x,17,0,10,25,11,'535346');part(x,5,4,12,9,18,'463f35');}
  part(0,43,0,29,31,20,cloth);part(0,28,0,31,5,21,'584735');part(0,28,12,6,5,3,trim);
  for(const x of [-18,18]){part(x,44,0,8,25,10,cloth);part(x,29,3,8,8,9,'c6a17e');}
  part(0,61,0,10,7,10,'ba9273');part(0,72,0,19,21,18,'d5b28e');
  for(const x of [-10,10])part(x,71,0,3,6,5,'c6a17e');
  for(const x of [-5,5]){part(x,74,9.5,3,3,1,'293934');part(x,77,9.5,5,1.4,1,'604b38');}
  part(0,70,10,3,4,3,'ba9170');part(0,66,9.5,5,1,1,'8e6953');part(0,83,-1,21,5,20,'6b513b');part(0,76,-9,20,13,4,'6b513b');
  if(['blacksmith','armorer','artificer'].includes(id)){part(0,40,11,22,25,3,'9d7953');part(0,28,12,23,5,3,'805d3e');part(17,34,8,4,23,4,'735b40');part(17,48,8,18,8,9,id==='armorer'?'b9c6c5':'888f89');if(id==='blacksmith')part(0,63,9,15,7,4,'715640');}
  if(id==='mage'){part(0,21,0,31,22,23,cloth);part(0,86,0,29,3,27,trim);part(0,87,0,13,30,13,cloth,'cone');part(0,62,9,14,11,5,'bcbcb0');part(-22,41,9,5,22,18,'ae8b58');part(-25,41,9,2,18,16,'d7cba3');}
  if(id==='enchanter'){part(0,52,11,4,12,3,trim);part(18,36,9,10,10,10,'8cdbcf','sphere');part(-19,34,9,5,18,14,'607b84');part(0,86,0,22,4,21,trim);}
  if(id==='alchemist'){part(0,39,11,21,25,3,'c3b994');part(0,83,0,24,6,23,'d6c7a6');for(const x of [-17,17]){part(x,34,10,7,10,7,x<0?'adc37c':'9bb7d5','sphere');part(x,42,10,3,5,3,'c8b288');}}
  if(id==='quartermaster'){part(0,84,0,25,6,23,cloth);part(0,87,4,26,2,27,trim);part(-20,37,7,5,21,17,'8e684b');part(-23,37,7,2,17,14,'cbbb98');part(18,35,9,3,16,3,'dfd2ae');}
  if(id==='market'){part(0,86,0,29,5,26,trim);part(0,91,0,21,8,20,cloth);part(-20,29,10,14,17,12,'ae8e58','sphere');part(-20,39,10,6,4,6,'68583c');for(const x of [13,18,23])part(x,35,8,5,2,5,'dcc67d','sphere');}
 }

 visibleAt(o,padding=150){const p=this.project(o.x,o.y);return p.x>-padding&&p.y>-padding&&p.x<this.width+padding&&p.y<this.height+padding;}
 tag(text,x,z,height,hp=1,enemy=false){const i=this.labelCount++;if(!this.labels[i]){const el=document.createElement('div');el.className='scene-label';el.innerHTML='<span></span><i><b></b></i>';this.input.parentElement.append(el);this.labels[i]=el;}const el=this.labels[i],p=this.project(x,z,height);el.hidden=false;el.dataset.side=enemy?'enemy':'player';el.querySelector('span').textContent=text;el.querySelector('i').hidden=hp===null;el.querySelector('b').style.width=Math.max(0,Math.min(1,hp))*100+'%';el.style.left=p.x+'px';el.style.top=p.y+'px';}
 render(w,effects=[]){if(this.lost)return;this.setup(w);this.labelCount=0;this.visible=0;if(this.cpu)this.faces=[];else this.gl.clear(this.gl.COLOR_BUFFER_BIT|this.gl.DEPTH_BUFFER_BIT);
 const cluster=R.clusterOf(w.state),area=R.DUNGEONS.find(d=>'dungeon:'+d.id===cluster)?.arena||R.clusterAt(w.state.x,w.state.y);
 this.draw('cube',area.x+area.w/2,-7,area.y+area.h/2,area.w,10,area.h,'6e8063');
 const show=o=>R.clusterOf(o)===cluster&&this.visibleAt(o);
 for(const o of R.OBSTACLES){const center={x:o.x+o.w/2,y:o.y+o.h/2};if(R.clusterOf(center)!==cluster||!this.visibleAt(center,Math.max(o.w,o.h)))continue;
  if(o.type==='house'){this.draw('cube',center.x,40,center.y,o.w,80,o.h,'9b9c7d');this.draw('cone',center.x,80,center.y,o.w*.75,70,o.h*.75,'795d49');this.draw('cube',center.x,24,o.y+o.h+1,24,48,3,'453c30');}
  else if(o.type==='water')this.draw('cube',center.x,-1,center.y,o.w,1,o.h,'558d92');
  else if(o.type==='wall')this.draw('cube',center.x,30,center.y,o.w,60,o.h,'929887');
  else this.draw('sphere',center.x,22,center.y,o.w/2,38,o.h/2,'858f81');this.visible++;
 }
 for(const n of w.nodes){if(!show(n))continue;this.visible++;if(n.type==='wood'){if(n.charges)this.tree(n.x,n.y,n.id%3);else this.draw('cube',n.x,8,n.y,15,16,15,'786348');}else if(n.type==='herb'){this.draw('cone',n.x,1,n.y,12,22,12,n.charges?'8eb58a':'6b7056');}else this.draw('sphere',n.x,12,n.y,23,22,19,n.charges?'a3aa93':'646e63');this.tag(R.NODE_TYPES[n.type].name,n.x,n.y,52,n.charges/R.NODE_TYPES[n.type].charges);}
 for(const [id,n]of Object.entries(R.townTraders(w.state))){if(!show(n))continue;this.trader(n,id,w.time);this.tag(n.name,n.x,n.y,120,null);this.visible++;}
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
 this.hero(w);this.combat({...w,effects:[]});for(const e of effects){if(!this.visibleAt(e))continue;if(e.type==='burst')this.ring(e.x,e.y,e.radius||80,'e0c78e');else if(['hit','damage','heal','gather'].includes(e.type))this.tag(e.type==='gather'?'+'+e.amount:(e.type==='heal'?'+':'')+(e.value||''),e.x,e.y,70+(1-e.life)*45,1,e.type==='damage');}this.tag((w.onlineName||'Мандрівник')+' · '+w.state.level,w.state.x,w.state.y,105,w.state.hp/R.maxHp(w.state));
 for(let i=this.labelCount;i<this.labels.length;i++)this.labels[i].hidden=true;
 if(this.cpu)this.flush();
 }
 ring(x,y,r,color,inner=0){const count=32;for(let i=0;i<count;i++){const a=i*Math.PI*2/count;this.draw('cube',x+Math.cos(a)*r,2,y+Math.sin(a)*r,6,2,6,color);if(inner)this.draw('cube',x+Math.cos(a)*inner,2,y+Math.sin(a)*inner,5,2,5,color);}}
 warning(t,m){const color=t.life?'958062':'df9478',r=t.radius||60,x=t.x??m.x,y=t.y??m.y,a=t.angle||0;if(['circle','multi','ring'].includes(t.shape)||!t.shape){for(const p of t.points||[{x,y}])this.ring(p.x,p.y,r,color,t.inner||0);}else if(t.shape==='cone'){for(let i=0;i<=24;i++){const q=a-t.arc/2+i*t.arc/24;this.draw('cube',m.x+Math.cos(q)*r,2,m.y+Math.sin(q)*r,7,2,7,color);}}else if(t.shape==='line'){this.draw('cube',m.x+Math.cos(a)*t.range/2,2,m.y+Math.sin(a)*t.range/2,t.range,2,r*2,color,Math.PI/2-a);}else if(t.shape==='cross'){this.draw('cube',x,2,y,t.range*2,2,r*2,color);this.draw('cube',x,2,y,r*2,2,t.range*2,color);}}
 monster(m,time){const t=R.TYPES[m.type],type=t.model||m.type,color=(t.color||'#a3ab8c').replace('#',''),scale=t.boss?1.8:1,r=t.radius;
 if(type==='slime'){this.draw('sphere',m.x,15,m.y,r,18+Math.sin(time*3),r,color);for(const x of [-7,7])this.draw('cube',m.x+x,23,m.y+17,4,4,3,'24382e');}
 else if(['wolf','boar','bear','rat','salamander'].includes(type)){const a=Math.atan2((m.facing?.x||0),(m.facing?.y||1));this.draw('sphere',m.x,25,m.y,r*.8,20,r*1.3,color,a);this.draw('sphere',m.x+(m.facing?.x||0)*25,37,m.y+(m.facing?.y||1)*25,13,14,17,color,a);for(const x of [-12,12])for(const z of [-15,15])this.draw('cube',m.x+x,10+Math.sin((m.footstep||0)+x*z)*2,m.y+z,7,20,7,'5c6659');}
 else if(type==='spider'){this.draw('sphere',m.x,17,m.y,r,16,r,color);for(const side of [-1,1])for(let i=0;i<4;i++)this.draw('cube',m.x+side*(r+7),9,m.y+(i-1.5)*12,25,5,5,color,side*(i-1.5)*.3);}
 else if(['bandit','skeleton','mage'].includes(type)){this.hero({state:{x:m.x,y:m.y},facing:m.facing||{x:0,y:1},walking:m.walking,footstep:m.footstep||0,time,swing:0,hurt:m.hit});}
 else {this.draw('sphere',m.x,35*scale,m.y,r,35*scale,r,color);this.draw('cube',m.x,72*scale,m.y,r,25*scale,r,color);for(const x of [-1,1]){this.draw('cube',m.x+x*r,35*scale,m.y,15,45*scale,18,color);this.draw('cube',m.x+x*12,10,m.y,16,20,20,'626e66');}}
 if(m.telegraph)this.warning(m.telegraph,m);for(const h of m.hazards||[])this.warning(h,m);
 }
}
window.HoMoWFull.Scene=Scene;
})();
