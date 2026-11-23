/* Beta environment: buildings, collectible plants, geology and village life. */
(()=>{'use strict';const S=window.HoMoWWorldStyle,G=window.HoMoWGeography,L=G.landscape,F=window.HoMoWForms;
window.HoMoWEnvironment={
 cityGround(){
   const R=window.BrukRealms,c=R.CITY;
   if(!this.tallVisible({x:c.x+c.w/2,y:c.y+c.h/2},160,Math.max(c.w,c.h)))return;
   const slab=(x,z,w,d,color,h=.5)=>this.draw('cube',x,h,z,w,.7,d,color);
   slab(7470,2600,850,950,'959a87');
   for(const x of [7323,7548])slab(x,2598,47,928,'c3b698',1.1);
   for(const z of [2330,2544,2745,2960])slab(7460,z,755,44,'bdaf91',1.2);
   slab(7085,2571,50,108,'bdaf91',1.3); slab(7057,2600,108,45,'bdaf91',1.3);
   slab(7440,2528,255,110,'b6ad96',1.5);
   for(const x of [7372,7408,7444,7480,7516])for(const z of [2505,2534,2563])
     slab(x,z,34,26,'c6bca2',2);
   for(const [x,z] of [[7050,2500],[7050,2700],[7888,2500],[7888,2700]]){
     this.cover=true;
     this.draw('cube',x,62,z,42,124,42,'858e82');this.draw('roof',x,124,z,56,35,56,'536762');
     this.draw('cube',x,107,z+22,15,28,2,'49695e');this.cover=false;
   }
 },
 cityLandmark(o){
   const x=o.x+o.w/2,z=o.y+o.h/2;
   if(o.type==='fountain'){
     this.draw('orb',x,9,z,65,10,44,'a6a79a');this.draw('orb',x,16,z,56,5,36,'719f9b');
     this.draw('cube',x,34,z,12,38,12,'b7b59e');this.draw('orb',x,53,z,24,6,17,'9da79b');
     this.draw('cone',x,54,z,6,19,6,'b5d6ca');return;
   }
   this.building({...o,owner:o.type},0);
   if(o.type==='hall'){
     this.draw('cube',x,128,z,38,68,36,'b4b09a');this.draw('roof',x,162,z,49,32,45,'566e66');
     for(const dx of [-42,42]){this.draw('cube',x+dx,53,z+o.h/2+4,13,57,3,'537569');}
   }else{
     this.draw('cube',x+47,74,z+o.h/2+9,33,4,12,'705849');
     this.draw('cube',x+58,59,z+o.h/2+10,16,24,5,'c19b61');
   }
 },
 meadow(area,biome){
   const tile=126,reach=this.spanX+this.spanY*1.68;
   const x0=Math.max(area.x,Math.floor((this.cx-reach)/tile)*tile),z0=Math.max(area.y,Math.floor((this.cz-reach)/tile)*tile);
   const shades={plains:['929979','979d7d'],forest:['899273','8e9779'],swamp:['7b8774','828d79'],winter:['c2c8bb','cbd0c3']}[biome];
   const patch=F.model('land/meadow',b=>{
     const ring=Array.from({length:9},(_,i)=>{const a=i*2*Math.PI/9,r=[.89,.94,.77,1,.84,.92,1,.77,.82][i];return [Math.cos(a)*r,0,Math.sin(a)*r];});
     for(let i=0;i<ring.length;i++)b.triangle('turf',[0,0,0],ring[(i+1)%ring.length],ring[i]);
   })[0].mesh;
   for(let x=x0;x<Math.min(area.x+area.w,this.cx+reach);x+=tile)for(let z=z0;z<Math.min(area.y+area.h,this.cz+reach);z+=tile){
     const seed=(Math.imul(x,1987)^Math.imul(z,2903))>>>0,px=x+30+seed%54,pz=z+38+(seed>>>8)%39;
     if(px+54>area.x+area.w||pz+32>area.y+area.h||!this.visibleAt({x:px,y:pz},70)||seed%4===1)continue;
     this.draw(patch,px,-1.75,pz,34+seed%21,1,16+(seed>>>13)%13,shades[seed%2],(seed%17)*.2);
   }
 },
 pond(o,time=0){
   const x=o.x+o.w/2,z=o.y+o.h/2;
   const parts=F.model('land/pond',b=>{
     const ring=[[-.41,-.5],[.38,-.5],[.47,-.46],[.5,-.34],[.5,.35],[.46,.46],[.37,.5],[-.37,.5],[-.47,.45],[-.5,.34],[-.5,-.34],[-.47,-.45]];
     const loop=(k,h)=>ring.map(([x,z])=>[x*k,h,z*k]);
     for(const [slot,a,c,h] of [['shore',1,.944,-.44],['shallow',.944,.86,-.38]]){
       const outside=loop(a,h),inside=loop(c,h+.02);
       for(let i=0;i<ring.length;i++){const j=(i+1)%ring.length;b.triangle(slot,outside[j],outside[i],inside[i]);b.triangle(slot,outside[j],inside[i],inside[j]);}
     }
     const water=loop(.863,-.30);
     for(let i=0;i<ring.length;i++)b.triangle('water',[0,-.30,0],water[(i+1)%ring.length],water[i]);
   });
   for(const {mesh,slot} of parts)this.draw(mesh,x,0,z,o.w,1,o.h,L[slot]);
   const flow=this.opt?.animations===false?0:time;
   for(let i=0;i<4;i++){const ph=flow*(.5+i*.14)+i*1.7,drift=Math.sin(ph);
     this.draw('cube',x+Math.sin(i*3.25+o.x)*o.w*.15+drift*o.w*.05,.36+Math.sin(ph*1.6)*.05,z+(i-1.5)*o.h*.15+Math.cos(ph)*o.h*.05,(.1+i%2*.11)*o.w*(1+drift*.13),.44,1.35,L.ripple,.025*Math.sin(i)+ph*.06);}
 },
 horizon(w){const R=window.BrukRealms,s=w.state,cluster=R.clusterOf(s),dungeon=R.DUNGEONS.find(d=>'dungeon:'+d.id===cluster);
 this.draw('cube',this.cx,-76,this.cz,6500,10,6500,dungeon?'596777':L.water);
 if(dungeon){const a=dungeon.arena;for(let x=a.x-80;x<a.x+a.w+80;x+=100)for(const y of [a.y-60,a.y+a.h+60])if(this.visibleAt({x,y},200))this.draw('sphere',x,-18,y,70,42,65,'78848b');for(let y=a.y;y<a.y+a.h;y+=100)for(const x of [a.x-60,a.x+a.w+60])if(this.visibleAt({x,y},200))this.draw('sphere',x,-18,y,65,42,70,'78848b');return;}
 // Neighbouring terrain stays visible across cluster borders, including at wide zoom.
 for(const a of R.CLUSTERS)if(a.id!==cluster&&this.visibleAt({x:a.x+a.w/2,y:a.y+a.h/2},Math.max(a.w,a.h)))this.draw('cube',a.x+a.w/2,-8,a.y+a.h/2,a.w,10,a.h,G.palette[a.biome].slice(1));
 for(const vertical of [false,true]){const length=vertical?R.HEIGHT:R.WIDTH;for(let d=70;d<length;d+=140)for(const far of [false,true]){const x=vertical?(far?R.WIDTH:0):d,y=vertical?d:(far?R.HEIGHT:0);if(!this.visibleAt({x,y},280))continue;this.draw('cube',x,-28,y,vertical?32:144,56,vertical?144:32,'929786');const direction=far?1:-1,ox=x+(vertical?direction*85:0),oy=y+(vertical?0:direction*85);this.draw('sphere',ox,-39,oy,vertical?80:65,24+(d%4)*3,vertical?65:80,'7d8b84');this.draw('cube',x+(vertical?-direction*16:0),-1,y+(vertical?0:-direction*16),vertical?30:144,1,vertical?144:30,'b6ab8c');if(Math.floor(d/140)%3===0)this.draw('cone',x+(vertical?direction*380:0),-60,y+(vertical?0:direction*380),115,70+d%130,110,'91a29a');}}
 },

 frontiers(w){const R=window.BrukRealms,G=window.HoMoWGeography;if(!G||R.clusterOf(w.state).startsWith('dungeon:'))return;
 for(const b of G.borders){if(b.kind==='forest'?!this.tallVisible(b,700,150):!this.visibleAt(b,210))continue;const {x,y,seed}=b;if(b.kind==='ridge'){this.draw('sphere',x,-2,y,64,55+seed%45,60,'849ba3');this.draw('cone',x+12,33,y,40,68+seed%50,36,'c6e1e4');this.draw('cone',x+12,72,y,22,29,20,'f0f6e8');}else if(b.kind==='water'){this.draw('cube',x,-.5,y,b.vertical?64:96,1,b.vertical?96:64,L.water);for(const side of [-1,1])this.draw('sphere',x+(b.vertical?side*38:0),0,y+(b.vertical?0:side*38),b.vertical?13:48,7,b.vertical?48:13,'859178');}else{this.treeModel(x,y,3,seed%5===0?2:0,true,'forest',seed,w.time);}}
 },
 roads(w){const R=window.BrukRealms,G=window.HoMoWGeography,cluster=R.clusterOf(w.state);if(!G||cluster==='village'||cluster.startsWith('dungeon:'))return;let routes=G.roads.get(cluster);if(!routes){const a=R.CLUSTERS.find(c=>c.id===cluster),exits=R.PORTALS.filter(p=>[p.a,p.b].includes(cluster));let hub={x:a.x+a.w/2,y:a.y+a.h/2};for(let i=0;R.blocked(hub.x,hub.y,28)&&i<100;i++)hub={x:a.x+150+(i*191)%(a.w-300),y:a.y+150+(i*277)%(a.h-300)};routes=exits.map(p=>{const path=[p,...R.findPath(p.x,p.y,hub.x,hub.y)],fine=[p];for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/70));for(let j=1;j<=steps;j++)fine.push({x:a.x+(b.x-a.x)*j/steps,y:a.y+(b.y-a.y)*j/steps});}return fine;});G.roads.set(cluster,routes);}for(const points of routes)for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],x=(a.x+b.x)/2,y=(a.y+b.y)/2;if(!this.visibleAt({x,y},70))continue;const length=Math.hypot(b.x-a.x,b.y-a.y);this.draw('cube',x,0,y,length+3,1,53,L.road,-Math.atan2(b.y-a.y,b.x-a.x));}
 },
 building(o,time){const id=o.owner||'home',x=o.x+o.w/2,z=o.y+o.h/2,w=o.w,d=o.h;
 const palette={blacksmith:['c0ad91','7e6a55'],mage:['bab6ac','626c74'],enchanter:['acb7a6','5f766b'],armorer:['b4b7a6','52635f'],alchemist:['c5c29e','67785f'],artificer:['c0ac86','87765c'],quartermaster:['a7b0a2','65706b'],market:['c8b898','816d57']},[wall,roof]=palette[id]||palette.market;
 const p=(dx,y,dz,sx,sy,sz,c,k='cube',turn=0)=>this.draw(k,x+dx,y,z+dz,sx,sy,sz,c,turn);
 const high=id==='mage'?146:id==='quartermaster'?105:88;
 const doorHeight=66,doorWidth=31;
 p(0,5,0,w+6,10,d+6,'9ba99a');
 if(id==='market'){for(const dx of [-w*.43,w*.43])for(const dz of [-d*.4,d*.4])p(dx,39,dz,5,78,5,'8c633d');p(0,78,0,w+18,28,d+16,'b7aa85','roof');for(let i=0;i<5;i++)p((i-2)*w/5,80,0,w/10,3,d+16,i%2?'b7aa85':'857761');p(0,26,d*.25,w*.85,10,22,'b27a44');for(let i=0;i<6;i++)p((i-2.5)*13,33,d*.25,2.8,3.1,2.8,['baa075','8b997c','b18574'][i%3],'sphere');return;}
 p(0,high/2+10,0,w,high,d,wall);for(const dx of [-w/2+4,w/2-4])p(dx,high/2+10,0,7,high+4,d+2,'825c42');p(0,high*.6,0,w+2,5,d+2,'956d4c');
 if(id==='mage'){p(0,high+10,0,w*.74,95,d*.74,roof,'cone');p(0,high+103,0,8,15,8,'f0d081','sphere');}else{p(0,high+10,0,w+18,id==='armorer'?35:48,d+18,roof,'roof');p(0,high+10+(id==='armorer'?35:48),0,7,4,d+20,'d79865');}
 p(0,10+doorHeight/2,d/2+1,doorWidth,doorHeight,4,'69523a');p(doorWidth*.34,41,d/2+4,2.5,2.5,2,'ebd18c','sphere');p(0,5,d/2+11,36,8,20,'b6b49d');
 for(const side of [-1,1]){p(side*w*.3,high*.53,d/2+2,21,24,3,'647b79');p(side*w*.3,high*.53,d/2+4,15,17,2,'f3d993');p(side*w*.3,high*.53,d/2+5,2,18,1,'96724b');p(side*w*.3,high*.53,d/2+5,16,2,1,'96724b');p(side*w*.3,high*.53-15,d/2+7,26,4,9,'9a704b');}
 if(id==='blacksmith'){p(w*.3,high+22,-d*.2,23,72,25,'9a8272');p(w*.3,high+59,-d*.2,31,8,31,'c5b8a5');for(let i=0;i<3;i++){const puff=this.opt?.animations===false?(i+1)/3:(time*.3+i/3)%1;p(w*.3+Math.sin(puff*5.5+i)*9,high+64+puff*74,-d*.2+puff*15,8+puff*17,7+puff*13,8+puff*17,puff>.6?'cbd2d6':'b6c1c8','sphere');}}
 if(id==='enchanter'){p(-w*.3,high+58,0,11,27,11,'6bd6d2','cone');p(w*.3,high+40,0,9,20,9,'b0a1ef','cone');p(0,52,d/2+6,13,18,2,'5dbaaa');}
 if(id==='alchemist'){p(w*.5+16,30,0,24,46,d*.65,'8aa697');for(let i=0;i<3;i++)p(w*.5+29,30,(i-1)*d*.2,3,50,3,'e0ce95');p(w*.5+15,55,0,30,12,d*.7,'91a991','roof');}
 if(id==='artificer'){const a=time*.15;for(let i=0;i<4;i++){const b=a+i*Math.PI/2;p(Math.sin(b)*32,high+32+Math.cos(b)*32,d/2+11,10,42,4,'d4c49a','cube',-b);}p(0,high+32,d/2+15,12,12,8,'796044','sphere');}
 if(id==='quartermaster'){p(-w*.28,high+15,d*.25,28,35,28,wall);p(-w*.28,high+32,d*.25,35,18,35,roof,'roof');p(0,10+doorHeight/2,d/2+4,44,doorHeight,5,'8b6848');for(const dx of [-9,9])p(dx,10+doorHeight/2,d/2+7,2,doorHeight,1,'d3ac72');}
 },
 resource(n,time){const v=S.resource(n.type),x=n.x,z=n.y,alive=n.charges>0,t=v.tier,c=alive?v.color:'8e9383',p=(dx,y,dz,sx,sy,sz,col=c,k='cube',a=0)=>this.draw(k,x+dx,y,z+dz,sx,sy,sz,col,a);
 if(v.family==='wood'){this.treeModel(x,z,t,v.shape,alive,RBiome(n),n.id,time);return;}
 if(v.family==='fiber'||v.family==='herb'){if(!alive){p(0,2,0,14,4,14,'967d51');return;}for(let i=0;i<5;i++){const a=i*2.4,dx=Math.cos(a)*12,dz=Math.sin(a)*9;p(dx,13,dz,3,24,3,'748266');p(dx+4,15,dz,10,6,7,v.family==='herb'?'7e9479':'97a77b','sphere',a);p(dx-3,20,dz,8,7,7,c,'sphere');if(v.family==='herb'||t>3)p(dx,25,dz,3,4,3,v.family==='herb'?'c99e80':c,'sphere');}return;}
 if(v.family==='hide'){for(const side of [-1,1])p(side*18,27,0,3,54,3,'9e784c');p(0,53,0,42,4,4,'b38b57');p(0,27,0,27,30,3,alive?['b78256','ccb58b','9c745a','decc9b'][v.shape]:'8b8068');return;}
 p(0,11,0,27,18,23,v.family==='stone'?'929c8e':'727f78','sphere');if(!alive)return;
 const count=v.family==='stone'?3:3+v.shape;for(let i=0;i<count;i++){const a=i*2.399,dx=Math.cos(a)*13,dz=Math.sin(a)*10;if(v.family==='stone')p(dx,10+i*4,dz,13,15,11,['b0b5a0','85948c','ced0ba'][i%3],'sphere');else if(v.family==='crystal'||v.shape===2||v.shape===3)p(dx,14,dz,5+i%3,20+t*2+i*3,5+i%3,c,'cone');else p(dx,17+i%2*5,dz,9+t,7+v.shape*4,7+t,c,'cube',a);}
 },
 treeModel:window.HoMoWTrees.draw,
 prop(o,time){const x=o.x+o.w/2,z=o.y+o.h/2,w=o.w,d=o.h,p=(dx,y,dz,sx,sy,sz,c,k='cube',a=0)=>this.draw(k,x+dx,y,z+dz,sx,sy,sz,c,a),kind=o.betaKind;
 if(['pine','oak','birch'].includes(kind)){this.treeModel(x,z,2,{pine:0,oak:1,birch:2}[kind],true,RBiome(o),o.seed,time);return;}
 if(kind==='ruin'){for(let i=0;i<3;i++){p((i-1)*13,15+i%2*13,0,11,30+i%2*26,15,'a7b6aa');p((i-1)*13,32+i%2*26,0,15,5,18,'c3cbb7');}return;}
 if(kind==='deadwood'||kind==='woodpile'){for(let i=0;i<4;i++){p((i%2-.5)*12,6+Math.floor(i/2)*9,0,10,10,kind==='woodpile'?50:34,'9d7145');p((i%2-.5)*12,6+Math.floor(i/2)*9,kind==='woodpile'?26:18,8,8,2,'d0b77c');}return;}
 if(kind==='well'){for(let i=0;i<12;i++){const a=i*Math.PI/6;p(Math.cos(a)*16,10,Math.sin(a)*16,10,20,9,'d5c4a0','cube',a);}for(const dx of [-24,24])p(dx,35,0,5,70,5,'997044');p(0,68,0,62,24,50,'8a765d','roof');p(0,41,0,37,3,3,'89643e');p(0,29,0,1,23,1,'e0cd9d');p(0,18,0,10,12,10,'9b8061');return;}
 if(kind==='cart'){p(0,26,0,w,5,d,'ab7d43');for(const dx of [-w*.4,w*.4])p(dx,35,0,3,18,d,'bd9557');for(const dx of [-w*.32,w*.32])for(const dz of [-d*.55,d*.55])p(dx,14,dz,14,14,3,'6f5338','orb');p(w*.65,23,0,35,3,4,'9f7842');p(0,37,0,20,17,18,'d9b66c');return;}
 if(kind==='forge'){p(0,13,0,w,26,d,'8b9494');p(0,28,0,w+7,5,d+4,'bac3b7');p(0,32,0,w*.7,4,d*.65,'f7b35f');for(let i=0;i<3;i++)p((i-1)*10,34,0,5,11+Math.sin(time*5+i)*3,5,'ffc868','cone');return;}
 if(kind==='bench'){for(const dx of [-w*.35,w*.35])p(dx,6.5,0,5,13,13,'775c3c');p(0,14,0,w,3,d,'cba168');p(0,26,-d*.4,w,11,3,'ac804c');return;}
 if(kind==='lantern'){const flick=this.opt?.animations===false?0:Math.sin(time*7.1+o.x)*.5+Math.sin(time*11.3+o.y)*.5;
   p(0,42,0,5,84,5,'6b6452');p(0,84,0,16,18,16,flick>.25?'f8e7b0':'ead58c');p(0,85,0,9+flick*1.4,11+flick*2.6,9+flick*1.4,'ffd08a','sphere');p(0,96,0,21,10,21,'5f7783','roof');return;}
 if(kind==='barrels'){
   const parts=F.model('village/cask',b=>{
     b.rings('wood',[[0,8,8],[4,9.2,9.2],[14,10.5,10.5],[24,9.2,9.2],[28,8,8]],9);
     for(const [y,r] of [[4,9.5],[13,10.8],[23,9.65]])b.rings('hoop',[[y,r,r],[y+1.4,r,r]],9);
   });
   for(const side of [-1,1])for(const {mesh,slot} of parts)this.draw(mesh,x+side*9.5,0,z+side*4,1,1,1,slot==='wood'?'a2865b':'64695f');
 }else for(let i=0;i<3;i++){const dx=(i-1)*15;p(dx,9,0,15,18,17,'c19a5c');for(const y of [3,15])p(dx,y,0,16,2,18,'6d786d');}
 },
 villageGround(w){const R=window.BrukRealms;if(!R.inVillage(w.state.x,w.state.y))return;this.villagePaths??=window.HoMoWGeography.roads.get('village');
 for(const points of this.villagePaths)for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b.x-a.x,dz=b.y-a.y,l=Math.hypot(dx,dz);this.draw('cube',(a.x+b.x)/2,0,(a.y+b.y)/2,l+4,1,66,L.road,-Math.atan2(dz,dx));}
 this.draw('sphere',R.CAMP.x,1,R.CAMP.y,62,1,56,'b7aa8e');for(let i=0;i<12;i++){const a=i*Math.PI/6;this.draw('cube',R.CAMP.x+Math.cos(a)*52,2,R.CAMP.y+Math.sin(a)*48,9,3,9,'c9bda1',a);}
 for(let i=0;i<8;i++){const a=i*Math.PI/4;this.draw('sphere',R.CAMP.x+Math.cos(a)*16,4,R.CAMP.y+Math.sin(a)*16,6,5,5,'a1a897');}for(const a of [-.6,.6])this.draw('cube',R.CAMP.x,5,R.CAMP.y,8,7,33,'96633d',a);for(let i=0;i<3;i++)this.draw('cone',R.CAMP.x+(i-1)*5,7,R.CAMP.y,6,19+(this.opt?.animations===false?0:Math.sin(w.time*5+i)*4),6,i%2?'ffe29a':'ffad56');

 },
 guard(n,time,index){const sway=this.opt?.animations===false?0:Math.sin(time*.9+index)*.02;this.hero({state:{x:n.x,y:n.y,weaponKind:'spear',armorKind:'plate',supportKind:'shield',appearance:{beard:'none'},outfits:{head:'soldier_helm'}},facing:{x:.9,y:.25+sway},walking:false,footstep:0,time,swing:0,hurt:0});this.draw('cube',n.x,62,n.y,5,12,15,index?'daa844':'3f9dbc');this.draw('cube',n.x-11,34,n.y+10,2,12,10,'4c82a6');this.tag(index?'Вартовий брами':'Капітан варти',n.x,n.y,74,null);},
 villageLife(w){const R=window.BrukRealms;if(!R.inVillage(w.state.x,w.state.y))return;const time=this.opt?.animations===false?0:w.time;
 for(let [i,a]of [[0,{x:535,y:640}],[1,{x:750,y:730}],[2,{x:340,y:340}]]){a=window.HoMoWVillage.spread({...a});const p={x:a.x+Math.sin(time*.18+i)*15,y:a.y+Math.cos(time*.18+i)*12};if(!R.blocked(p.x,p.y,20)&&this.visibleAt(p))this.trader(p,['market','alchemist','quartermaster'][i],time);}
 // Gate towers, hanging banners and an open arch; the existing exit remains free.
 for(const rawY of [395,610]){const p=window.HoMoWVillage.spread({x:950,y:rawY}),x=p.x,y=p.y;if(!this.visibleAt({x,y:p.y}))continue;this.draw('cube',x,35,y,38,70,38,'b8bdab');this.draw('roof',x,70,y,55,25,55,'536864');this.draw('cube',x-23,49,y,3,28,17,'e3bd61');}
 const gate=R.VILLAGE.gate;this.draw('cube',gate.x,106,gate.y,25,14,252,'b49662');
 }
};
function RBiome(p){return window.BrukRealms.clusterAt(p.x,p.y).biome;}
})();
