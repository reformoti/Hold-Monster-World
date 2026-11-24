/* Full canonical world presented in 3D. No game rules live in this renderer. */
(()=>{'use strict';
const R=window.BrukRealms,C=window.HoMoWCamera3D,G=window.HoMoWGeography;
class Scene extends window.HoMoWBeta3D.Scene{
 constructor(canvas){super(canvas);this.labels.forEach(el=>el.remove());this.damageLabels.forEach(el=>el.remove());this.labels=[];this.damageLabels=[];this.visible=0;this.motion=new window.HoMoWMotion.View();}
 setup(w){this.opt=window.HoMoWOptions.get();const r=this.input.getBoundingClientRect();this.width=r.width;this.height=r.height;this.visual=this.motion.sample(w,performance.now()/1000,R.clusterOf(w.state));const bounds=R.DUNGEONS.find(d=>'dungeon:'+d.id===R.clusterOf(w.state))?.arena||{x:0,y:0,w:R.WIDTH,h:R.HEIGHT},cx=Math.max(bounds.x+100,Math.min(bounds.x+bounds.w-100,this.visual.state.x)),cy=Math.max(bounds.y+100,Math.min(bounds.y+bounds.h-100,this.visual.state.y));this.camera=C.create(this.width,this.height,cx,cy,this.yaw,this.zoom);Object.assign(this,this.camera);const opt=window.HoMoWOptions.get(),dims=window.HoMoWOptions.dimensions(this.width,this.height,opt,devicePixelRatio||1);if(this.canvas.width!==dims.width)this.canvas.width=dims.width;if(this.canvas.height!==dims.height)this.canvas.height=dims.height;if(!this.cpu){const g=this.gl;g.viewport(0,0,this.canvas.width,this.canvas.height);g.uniform4f(this.u.camera,this.spanX,this.spanY,0,0);g.uniform2f(this.u.center,this.cx,this.cz);g.uniform2f(this.u.orbit,this.camera.c,this.camera.s);}}
 draw(kind,x,y,z,...args){if(kind==='sphere'&&args[1]===1&&this.opt?.shadows===false)return;if(kind==='sphere'&&this.opt?.lowTextures)kind='orb';
 if(this.pickParts&&!(kind==='sphere'&&args[1]===1))this.pickParts.push([kind,x,y,z,args[0],args[1],args[2],args[4]||0,args[6]||0,args[7]||0]);
 return super.draw(kind,x,y+(this.heroLift||0),z,...args);}
 hero(w){const s=w.state;this.heroLift=0;if(s.mounted){this.heroLift=this.mountModel(w);}super.hero({...w,time:this.opt?.animations===false?0:w.time,walking:this.opt?.animations===false?false:w.walking,footstep:this.opt?.animations===false?0:w.footstep,gait:this.opt?.animations===false?0:w.gait,turnRate:this.opt?.animations===false?0:w.turnRate,twoHanded:s.weaponVariant?!R.offhandActive(s):false});const labelHeight=this.heroLift+68;this.heroLift=0;return labelHeight;}
 trader(n,id,time){
  const F=window.HoMoWForms,palette={blacksmith:['665040','a58a63'],mage:['615a8e','b5a2cc'],enchanter:['3e7774','9bcfc2'],armorer:['5b6e7b','9cabb0'],alchemist:['526f49','b8c583'],artificer:['876e49','cfb887'],quartermaster:['525e66','c3b698'],market:['945e4b','dec185']};
  const profession=Object.hasOwn(palette,id)?id:'market',[cloth,trim]=palette[profession],human=window.HoMoWScale.human;
  const parts=F.model('civilian/'+profession,b=>{
    const round=(slot,x,y,z,rx,ry,rz,sides=8)=>b.rings(slot,[[y-ry,rx*.36,rz*.36,x,z],[y-ry*.35,rx,rz,x,z],[y+ry*.45,rx*.90,rz*.90,x,z],[y+ry,rx*.28,rz*.28,x,z]],sides);
    const panel=(slot,rows,x=0)=>b.loft(slot,rows.map(([y,rx,z,d])=>[[x-rx,y,z-d],[x+rx,y,z-d],[x+rx,y,z+d],[x-rx,y,z+d]]));
    const robe=['mage','enchanter'].includes(profession);
    for(const side of [-1,1]){
      const x=side*7;
      b.rings('trousers',[[8,4,4,x,0],[17,4.5,4.7,x,1],[21,5.2,5,x,-.7],[32,6.4,6,x,0]],7);
      b.rings('boots',[[1,5.4,8,x,3],[4,6,9,x,4],[8,5.3,7,x,2],[12,4.2,4.7,x,0]],8);
      b.rings('leather',[[10,4.5,5,x,0],[12,4.5,5,x,0]],7);
    }
    if(robe){
      b.rings(['cloth','cloth','trim','cloth'],[[8,17,12],[13,16.7,11.5],[28,13,9.7],[34,11.3,9]],10);
      for(const x of [-10,0,10])b.beam('trim',[x,10,10.5],[x*.58,30,8.8],.45,.3,4);
    }
    b.rings('cloth',[[28,12.5,9],[34,11,8],[44,13.8,9.8],[53,16,9],[57,11,7],[60,6,5]],10);
    b.rings('leather',[[28,13,9.5],[31,12.3,9.3]],10);
    panel('metal',[[28.3,2.2,9.9,.6],[31,2.2,9.9,.6]]);
    for(const side of [-1,1]){
      round('cloth',side*14.5,53,0,5.5,5.1,6);
      b.beam('cloth',[side*16,51,0],[side*19.5,41,3],4.6,3.8,7);
      round('trim',side*19.5,40.5,3.5,3.8,2.5,3.8,7);
      b.beam('cloth',[side*19.5,40,4],[side*17,32,8.8],3.6,2.8,7);
      b.beam('trim',[side*17.5,33.6,8],[side*17,31.5,9],3.1,3,7);
      round('skin',side*17,29.5,9.4,3.2,3.8,2.6,7);
      b.beam('skinShade',[side*14.5,31,9.3],[side*14.2,28.2,11],.9,.7,5);
      for(let f=0;f<3;f++)b.beam('skinShade',[side*(15.5+f),29,11.5],[side*(15.5+f),26.5,10.8],.45,.35,5);
    }
    b.rings('skinShade',[[57,4.3,4],[64,4.7,4.4]],8);
    b.rings('skin',[[64,4.7,4.1,0,1.2],[66,6.5,5.3,0,.7],[71,9,7.7],[77,8.8,7.5],[82,7,6],[84,3.5,3.5]],10);
    for(const side of [-1,1]){
      round('skinShade',side*8.7,72,0,1.7,3,2.2,6);
      round('skin',side*5.8,71,6,3,2.4,2.1,6);
      round('eyeWhite',side*4.1,75,7.9,2,1.05,.65,6);
      round('eyes',side*4,75,8.5,.8,.85,.3,6);
      b.beam('hair',[side*2.3,77,8.2],[side*6.1,77.4,7.6],.6,.45,5);
    }
    b.blade('skinShade',[[70,-1.6,1.6,3.5,8],[73,-1.3,1.3,2.8,8.2],[77,-.65,.65,.6,8.1]]);
    b.beam('mouth',[-2.5,67.8,6.8],[2.5,67.8,6.8],.38,.38,5);
    b.rings('hair',[[79,8.8,7.7,0,-.9],[83,8.4,7.2,0,-1],[86,4.8,4.5,1,-1.4]],9);
    for(const side of [-1,1]){
      b.beam('hair',[side*7.6,82,1],[side*8.2,75,-1],1.8,1.3,6);
      b.beam('hair',[side*6,83,5.2],[side*3,79.5,7.2],1.7,.7,6);
      b.triangle('trim',[side*2,58,5.6],[side*9,56,7.8],[side*4,51,9.7]);
    }
    const apron=slot=>panel(slot,[[25,11,11,.6],[35,10,10.6,.7],[49,8.5,9.6,.7],[54,6,8.4,.5]]);
    const bag=(x,y,z)=>{round('leather',x,y,z,5,7.5,4);panel('trim',[[y+1,4,z+3.6,.5],[y+6,4,z+3,.5]],x);b.beam('leather',[x<0?-9:9,55,7],[x,y+6,z],.8,.8,5);};
    const book=(x,y,z)=>{
      b.rings('leather',[[y-10,3.5,7,x,z],[y+10,3.5,7,x,z]],4,Math.PI/4);
      panel('pages',[[y-8,2,z+6,.45],[y+8,2,z+6,.45]],x);
      b.beam('trim',[x-2,y,z+6.6],[x+2,y,z+6.6],.6,.6,4);
    };
    if(['blacksmith','armorer','artificer'].includes(profession)){
      apron('apron');b.beam('leather',[-6,53,8.5],[-4,60,4.4],.7,.7,5);b.beam('leather',[6,53,8.5],[4,60,4.4],.7,.7,5);
      panel('leather',[[32,6,12,.5],[38,6,12,.5]]);
      b.beam('wood',[17,24,10],[17,47,10],1.5,1.3,6);
      if(profession==='blacksmith'){
        b.beam('metal',[9,46,10],[23,46,10],3.5,3,6);
        b.rings('hair',[[61,5,4,0,6],[65,7,4.6,0,5]],7);
        b.rings('leather',[[83,9.5,8.5],[87,7.5,7]],8);
      }else if(profession==='armorer'){
        b.blade('metal',[[43,11,23,3,9],[47,10,24,3.7,9],[50,13,21,2.5,9]]);
        for(const side of [-1,1])round('metal',side*14.5,54,-.5,5.6,3.4,6.2,7);
        b.rings('metal',[[81,10,8.7],[85,9.8,8.3],[90,6,6],[92,1,1]],8);
        b.beam('trim',[-7,84,8],[7,84,8],.6,.6,5);
      }else{
        b.beam('metal',[12,44,10],[15,49,10],1.4,1.2,5);b.beam('metal',[22,44,10],[19,49,10],1.4,1.2,5);
        bag(-16,28,-3);
        for(const x of [-4.5,4.5])round('metal',x,84,7.2,3.4,2.8,1.4,8);
        b.beam('leather',[-8,84,3],[8,84,3],.8,.8,5);
        for(const x of [-5,0,5])b.beam('wood',[x,34,13],[x+1,42,13],.7,.7,5);
      }
    }else if(profession==='mage'){
      b.rings('trim',[[85,14,12],[87,14,12]],10);
      b.rings('cloth',[[87,9,8],[96,6,5.5,1,0],[106,3,2.8,3,0],[113,.3,.3,5,0]],9);
      b.rings('beard',[[59,1.4,1.7,0,8],[64,5.8,3,0,7],[67,6.4,2.3,0,7]],7);book(-19,38,9);
      b.beam('wood',[18,8,10],[18,57,10],1,1.2,7);round('gem',18,59,10,3.1,4.5,3.1,6);
    }else if(profession==='enchanter'){
      b.rings('trim',[[84,9.7,8.3],[86,9.7,8.3]],10);
      round('gem',0,51,10,2.2,3.4,1.4,6);round('gem',17,35,10,4.3,5,4.1,6);book(-19,35,9);
      for(const x of [-7,7])b.beam('trim',[x,33,10],[x*.5,49,9.9],.65,.65,5);
    }else if(profession==='alchemist'){
      apron('pages');b.rings('pages',[[82,11,9.5],[86,11.5,10],[91,8,7]],9);
      for(const side of [-1,1]){
        const x=side*17;b.rings(side<0?'bottleGreen':'bottleBlue',[[27,2,2,x,10],[29,3.5,3.5,x,10],[35,3.1,3.1,x,10],[38,1.4,1.4,x,10],[41,1.4,1.4,x,10]],7);
        b.rings('wood',[[41,1.6,1.6,x,10],[43,1.6,1.6,x,10]],6);
      }
      bag(15,27,-5);
    }else if(profession==='quartermaster'){
      b.rings('cloth',[[83,10.5,9],[88,10,8.5],[90,8,6.8]],8);
      panel('trim',[[84,12,6,4],[86,12,6,4]]);book(-19,36,9);bag(14,25,-5);
      b.beam('pages',[17,24,11],[18,41,11],.7,.7,6);
      b.beam('trim',[-10,53,8],[10,38,11],1.2,1.2,5);
    }else{
      b.rings('trim',[[85,14,12],[87,14,12]],10);b.rings('cloth',[[87,10,9],[94,8.5,7.5],[96,4,4]],9);
      bag(-17,28,10);b.rings('trim',[[31,4.5,3.3,17,10],[33,4.5,3.3,17,10]],8);
      for(let i=0;i<3;i++)round('metal',14+i*3,34,10,1.8,.7,1.8,6);
      b.beam('trim',[-9,52,8],[8,34,11],1,1,5);
    }
  });
  const colors={cloth,trim,trousers:'535346',boots:'463f35',leather:'785c40',apron:profession==='armorer'?'7c8a89':'9d7953',skin:'d5b28e',skinShade:'ba9273',eyeWhite:'e3d9bb',eyes:'293934',mouth:'8e6953',hair:profession==='enchanter'?'453d39':'6b513b',beard:'bcbcb0',wood:'735b40',metal:profession==='market'?'dcc67d':'aab3ac',pages:'d7cba3',gem:'8cdbcf',bottleGreen:'adc37c',bottleBlue:'9bb7d5'};
  const materials={cloth:'leather',trim:'leather',trousers:'leather',boots:'leather',leather:'leather',apron:'leather',wood:'wood',metal:'steel',pages:'plaster',beard:'plaster',gem:'plaster',bottleGreen:'plaster',bottleBlue:'plaster'};
  const phase=this.opt?.animations===false?0:Math.sin((time||0)*1.8+n.x),bob=phase*.22;
  if(this.opt?.shadows!==false)this.draw('sphere',n.x,1,n.y,23*human,1,15*human,'59614e',0,null,0,0);
  for(const {mesh,slot} of parts)this.draw(mesh,n.x,bob*human,n.y,human,human,human,colors[slot],0,this.opt?.lowTextures?null:materials[slot]||null,phase*.002,phase*.003);
 }

 canSee(o,padding=0,occlusion=false){const v=this.visibility;return !v||Math.hypot(o.x-v.x,o.y-v.y)<=v.radius-padding&&(!occlusion||!R.lineBlocked(v.x,v.y,o.x,o.y));}
 visibleAt(o,padding=150){const p=this.project(o.x,o.y);return p.x>-padding&&p.y>-padding&&p.x<this.width+padding&&p.y<this.height+padding;}
 tallVisible(p,height,radius){
   const base=this.project(p.x,p.y),top=this.project(p.x,p.y,height);
   const margin=radius*this.width/(2*this.spanX);
   return base.x>=-margin&&base.x<=this.width+margin&&base.y>=-margin&&top.y<=this.height+margin;
 }
 tag(text,x,z,height,hp=1,enemy=false){const i=this.labelCount++;if(!this.labels[i]){const el=document.createElement('div');el.className='scene-label';el.innerHTML='<span></span><i><b></b></i>';this.input.parentElement.append(el);this.labels[i]=el;}const el=this.labels[i],p=this.project(x,z,height);el.hidden=false;el.dataset.side=enemy?'enemy':'player';el.querySelector('span').textContent=text;el.querySelector('i').hidden=hp===null;el.querySelector('b').style.width=Math.max(0,Math.min(1,hp))*100+'%';el.style.left=p.x+'px';el.style.top=p.y+'px';}
 render(w,effects=[]){if(this.lost)return;this.setup(w);this.labelCount=0;this.visible=0;
 this.visibility=window.HoMoWMaze?.contains(w.state)?{x:this.visual.state.x,y:this.visual.state.y,radius:390,start:275}:null;
 if(this.cpu)this.faces=[];else{const v=this.visibility;this.gl.uniform4f(this.u.viewLimit,v?.x||0,v?.y||0,v?.radius||0,v?.start||0);this.gl.clearColor(...(v?[89/255,99/255,88/255,1]:[.39,.46,.34,1]));this.gl.clear(this.gl.COLOR_BUFFER_BIT|this.gl.DEPTH_BUFFER_BIT);}
 const cluster=R.clusterOf(w.state),area=R.DUNGEONS.find(d=>'dungeon:'+d.id===cluster)?.arena||R.clusterAt(w.state.x,w.state.y);
 const player=this.visual.state,focusY=player.mounted?54:30,focus=this.project(player.x,player.y,focusY);
 const sightScale=2.4;
 this.cutaway={x:player.x,y:focusY,z:player.y,scale:sightScale,screenX:focus.x,screenY:focus.y,
   rx:34*sightScale*this.width/(2*this.spanX),ry:43*sightScale*this.height/(2*this.spanY),
   depth:(player.x*this.camera.s+player.y*this.camera.c)*.8+focusY*.6};
 this.gpuCover=null;
 const show=o=>R.clusterOf(o)===cluster&&this.visibleAt(o)&&this.canSee(o,0,true);
 const staticKey=this.cpu?[this.width,this.height,this.cx,this.cz,this.yaw,this.zoom,this.opt.shadows,this.opt.lowTextures,player.x,player.y,focusY,cluster,w.nodes.map(n=>n.charges).join(',')].join(':'):null;
 if(this.cpu&&staticKey===this.staticKey){this.faces=this.cachedFaces.slice();this.visible=this.cachedVisible;}else{
 this.horizon(w);this.clusterTransition(w);
 const biome=R.clusterAt(w.state.x,w.state.y).biome;this.draw('cube',area.x+area.w/2,-7,area.y+area.h/2,area.w,10,area.h,G.palette[biome].slice(1),0,biome==='winter'?'plaster':'grass');if(!cluster.startsWith('dungeon:'))this.meadow(area,biome);this.villageGround(w);this.roads(w);this.cityGround();this.frontiers(w);
 for(const o of R.OBSTACLES){const center={x:o.x+o.w/2,y:o.y+o.h/2};const tree=['pine','oak','birch'].includes(o.betaKind);
  if(!this.canSee(center,-Math.hypot(o.w,o.h)/2-(tree?190:80)))continue;
  if(tree?!this.tallVisible(center,685,190):!this.tallVisible(center,o.type==='house'?280:135,Math.max(o.w,o.h)))continue;
  this.cover=['hall','inn'].includes(o.type)||o.type==='house'||o.type==='wall'||o.type==='citywall'||o.type==='mountain'||o.type==='dungeonwall';
  if(o.betaKind)this.prop(o,w.time);
  else if(['hall','inn','fountain'].includes(o.type))this.cityLandmark(o);
  else if(o.type==='house')this.building(o,w.time);
  else if(o.type==='water')this.pond(o,w.time);
  else if(['wall','citywall','dungeonwall'].includes(o.type)){
    this.barrier(o);
  }else if(o.type==='mountain'){
    this.draw('cube',center.x,11,center.y,o.w,22,o.h,'818c80',0,'rock');
    this.boundaryRock(center.x,11,center.y,o.w,92,o.h,window.HoMoWWorldStyle.hash(o.x+':'+o.y),false);
  }
  else this.draw('sphere',center.x,22,center.y,o.w/2,38,o.h/2,G.landscape.rock);this.cover=false;this.visible++;
 }
 for(const n of w.nodes){if(this.cpu&&window.HoMoWWorldStyle.resource(n.type).family==='fiber')continue;const wood=R.NODE_TYPES[n.type].tool==='axe'&&n.charges>0;if(wood?R.clusterOf(n)!==cluster||!this.canSee(n,0,true)||!this.tallVisible(n,710,190):!show(n))continue;this.visible++;this.resource(n,w.time);}
 for(const o of R.DECOR){if(!show(o)||['grass','flower','flowers'].includes(o.kind))continue;if(o.kind==='stump')this.treeModel(o.x,o.y,1,1,false,R.clusterAt(o.x,o.y).biome,0);else if(o.kind==='ruin')this.prop({...o,w:30,h:20,betaKind:'ruin'},w.time);else this.draw('sphere',o.x,5,o.y,10,8,9,'929c88');}
 if(this.cpu){this.staticKey=staticKey;this.cachedFaces=this.faces.slice();this.cachedVisible=this.visible;}}
 if(this.cpu)for(const n of w.nodes)if(window.HoMoWWorldStyle.resource(n.type).family==='fiber'&&show(n)){this.resource(n,w.time);this.visible++;}
 for(const [id,n]of Object.entries(R.townTraders(w.state))){if(!show(n))continue;this.trader(n,id,w.time);this.visible++;}
 for(const n of w.nodes)if(show(n)&&Math.hypot(n.x-w.state.x,n.y-w.state.y)<230)this.tag(R.NODE_TYPES[n.type].name,n.x,n.y,n.type.startsWith('wood')?(n.charges?65:19):42,n.charges/R.NODE_TYPES[n.type].charges);
 for(const n of Object.values(R.townTraders(w.state)))if(show(n))this.tag(n.name+'\n'+(n.role||''),n.x,n.y,81,null);
 for(const [id,p] of Object.entries(R.CITY_LANDMARKS))if(show(p)&&id!=='fountain')this.tag(id==='inn'?'Заїзд · відродження':'Ратуша · контракти',p.x,p.y,94,null);
 for(const [i,n]of R.GUARDS.entries())if(show(n))this.guard(n,w.time,i);
 this.villageLife(w);

 if(!w.state.passUnlocked&&this.visibleAt({x:R.PASS.barrierX,y:R.PASS.y+R.PASS.h/2})){this.cover=true;this.barrier({x:R.PASS.barrierX-10,y:R.PASS.y,w:20,h:R.PASS.h,type:'dungeonwall'});this.cover=false;}
 const run=w.state.expeditions.run,dungeon=R.DUNGEONS.find(d=>d.id===run?.id);
 if(dungeon){for(const gate of dungeon.gates)if(run.stage<gate.stage){this.cover=true;this.barrier({...gate,type:'dungeongate'});this.cover=false;}for(const [p,name]of [[dungeon.chest,'E · Скриня'],[dungeon.exit,'E · Вихід']]){if(!this.canSee(p,0,true))continue;this.draw('cube',p.x,15,p.y,32,30,25,'bba36c');this.tag(name,p.x,p.y,65);}}
 for(const p of R.PORTALS){if(![p.a,p.b].includes(cluster)||!this.visibleAt(p,200)||!this.canSee(p,0,true))continue;const vertical=p.axis==='x';this.cover=true;this.gateway(p);this.cover=false;this.trail({x:p.x-(vertical?140:0),y:p.y-(vertical?0:140)},{x:p.x+(vertical?140:0),y:p.y+(vertical?0:140)},90,!!p.village);const destination=p.a===cluster?p.b:p.a,to=R.CLUSTERS.find(c=>c.id===destination),name=to?.name||R.DUNGEONS.find(d=>'dungeon:'+d.id===destination)?.name||'Перехід';if(Math.hypot(p.x-player.x,p.y-player.y)<270)this.tag(p.betaDungeon&&cluster==='c10'?'До печери — через вхідний обеліск':name+(p.betaDungeon?'\nПісля скрині · WASD / E':'\nWASD · пройти / E'),p.x,p.y,p.village?154:173,null);}
 for(const d of R.DUNGEONS){const p=d.entry;if(p&&show(p)){this.draw('cone',p.x,1,p.y,65,90,60,'566873');this.tag(d.name,p.x,p.y,110);}}
 if(show(R.MONOLITH)){const p=R.MONOLITH;this.draw('cube',p.x,62,p.y,35,124,35,w.state.monolithAwakened?'7fc6ba':'74877b');this.tag('E · Моноліт',p.x,p.y,145);}
 if(show(R.BILLBOARD)){const p=R.BILLBOARD;this.draw('sphere',p.x,0,p.y,110,1,95,'d5c394');for(const dx of [-40,40])this.draw('cube',p.x+dx,37,p.y,7,74,7,'755a3d');this.draw('cube',p.x,56,p.y,90,43,8,'ad8a56');this.draw('roof',p.x,80,p.y,108,14,30,'4e797b');this.tag('E · Дошка пошани',p.x,p.y,85);}
 this.aimBodies=[];
 for(const m of w.monsters){if(!m.alive||!show(m))continue;const t=R.TYPES[m.type];
   const parts=t.boss&&!R.lineBlocked(w.state.x,w.state.y,m.x,m.y)?[]:null;this.pickParts=parts;
   const top=this.creature(m,this.opt?.animations===false?0:w.time);this.pickParts=null;
   if(parts){
     const base=this.project(m.x,m.y),head=this.project(m.x,m.y,top),rim=(t.radius+20)*this.width/(2*this.spanX);
     this.aimBodies.push({parts,left:base.x-rim,right:base.x+rim,top:head.y-rim,bottom:base.y+rim});
   }
   this.tag((m.encounterSlot!==undefined?'◆ ':'')+t.name+' · '+(t.level||1),m.x,m.y,top+10,m.hp/t.hp,true);this.visible++;}
 for(const d of w.state.drops){if(show(d))this.draw('cube',d.x,7,d.y,15,14,15,'d2b36f');}
 for(const p of w.projectiles){if(show(p))this.draw('sphere',p.x,28,p.y,p.magic?7:3,p.magic?7:3,9,p.magic?'c8a6e5':'e8d9af');}
 const playerLabel=this.hero({...w,state:this.visual.state,facing:this.visual.facing,gait:this.visual.gait,turnRate:this.visual.rate});this.combat({...w,effects:[]});for(const e of effects){if(!this.visibleAt(e)||!this.canSee(e,0,true))continue;if(e.type==='burst')this.ring(e.x,e.y,e.radius||80,'e0c78e');else if(['hit','damage','heal','gather'].includes(e.type))this.tag(e.type==='gather'?'+'+e.amount:(e.type==='heal'?'+':'')+(e.value||''),e.x,e.y,70+(1-e.life)*45,1,e.type==='damage');}this.tag((w.onlineName||'Мандрівник')+' · '+w.state.level,this.visual.state.x,this.visual.state.y,playerLabel,w.state.hp/R.maxHp(w.state));
 for(let i=this.labelCount;i<this.labels.length;i++)this.labels[i].hidden=true;
 if(this.cpu)this.flush();
 }
 clusterTransition(w){const id=R.clusterOf(w.state);if(this.lastCluster&&id!==this.lastCluster){const name=R.CLUSTERS.find(c=>c.id===id)?.name||'Підземелля';if(!this.transitionLabel){this.transitionLabel=document.createElement('div');this.transitionLabel.className='cluster-transition';this.input.parentElement.append(this.transitionLabel);}this.transitionLabel.textContent=name;this.transitionLabel.classList.remove('show');void this.transitionLabel.offsetWidth;this.transitionLabel.classList.add('show');}this.lastCluster=id;}
 ring(x,y,r,color,inner=0){const count=32;for(let i=0;i<count;i++){const a=i*Math.PI*2/count;this.draw('cube',x+Math.cos(a)*r,2,y+Math.sin(a)*r,6,2,6,color);if(inner)this.draw('cube',x+Math.cos(a)*inner,2,y+Math.sin(a)*inner,5,2,5,color);}}
 warning(t,m){const color=t.life?'958062':'df9478',r=t.radius||60,x=t.x??m.x,y=t.y??m.y,a=t.angle||0;if(['circle','multi','ring'].includes(t.shape)||!t.shape){for(const p of t.points||[{x,y}])this.ring(p.x,p.y,r,color,t.inner||0);}else if(t.shape==='cone'){for(let i=0;i<=24;i++){const q=a-t.arc/2+i*t.arc/24;this.draw('cube',m.x+Math.cos(q)*r,2,m.y+Math.sin(q)*r,7,2,7,color);}}else if(t.shape==='line'){this.draw('cube',m.x+Math.cos(a)*t.range/2,2,m.y+Math.sin(a)*t.range/2,t.range,2,r*2,color,Math.PI/2-a);}else if(t.shape==='cross'){this.draw('cube',x,2,y,t.range*2,2,r*2,color);this.draw('cube',x,2,y,r*2,2,t.range*2,color);}}
}
Object.assign(Scene.prototype,window.HoMoWEnvironment,window.HoMoWCreatureArt,window.HoMoWMountArt);
window.HoMoWFull.Scene=Scene;
})();
