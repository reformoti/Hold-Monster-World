/* Beta environment: buildings, collectible plants, geology and village life. */
(()=>{'use strict';const S=window.HoMoWWorldStyle,G=window.HoMoWGeography,L=G.landscape,F=window.HoMoWForms;
window.HoMoWEnvironment={
 cityGround(){
   const R=window.BrukRealms,c=R.CITY;
   if(!this.tallVisible({x:c.x+c.w/2,y:c.y+c.h/2},160,Math.max(c.w,c.h)))return;
   const slab=(x,z,w,d,color,h=.5,material='cobble')=>this.draw('cube',x,h,z,w,.7,d,color,0,material);
   slab(7470,2600,850,950,'959a87',.5,'soil');
   for(const x of [7323,7548]){slab(x,2598,55,928,'818673',.9,'stone');slab(x,2598,47,928,'c3b698',1.1);}
   for(const z of [2330,2544,2745,2960]){slab(7460,z,755,52,'818673',1,'stone');slab(7460,z,755,44,'bdaf91',1.2);}
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
     this.draw(patch,px,-1.75,pz,34+seed%21,1,16+(seed>>>13)%13,shades[seed%2],(seed%17)*.2,biome==='winter'?'plaster':'grass');
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
 if(dungeon){const a=dungeon.arena;for(let x=a.x-80;x<a.x+a.w+80;x+=100)for(const y of [a.y-60,a.y+a.h+60])if(this.visibleAt({x,y},200))this.boundaryRock(x,-32,y,140,55,130,Math.floor(x/100));for(let y=a.y;y<a.y+a.h;y+=100)for(const x of [a.x-60,a.x+a.w+60])if(this.visibleAt({x,y},200))this.boundaryRock(x,-32,y,130,55,140,Math.floor(y/100));return;}
 // Neighbouring terrain stays visible across cluster borders, including at wide zoom.
 for(const a of R.CLUSTERS)if(a.id!==cluster&&this.visibleAt({x:a.x+a.w/2,y:a.y+a.h/2},Math.max(a.w,a.h)))this.draw('cube',a.x+a.w/2,-8,a.y+a.h/2,a.w,10,a.h,G.palette[a.biome].slice(1));
 for(const vertical of [false,true]){const length=vertical?R.HEIGHT:R.WIDTH;for(let d=70;d<length;d+=140)for(const far of [false,true]){
   const x=vertical?(far?R.WIDTH:0):d,y=vertical?d:(far?R.HEIGHT:0);if(!this.visibleAt({x,y},280))continue;
   const direction=far?1:-1,seed=Math.floor(d/140)+Number(far)*3;
   this.boundaryRock(x,-65,y,vertical?68:154,66,vertical?154:68,seed);
   this.boundaryRock(x+(vertical?direction*76:0),-67,y+(vertical?0:direction*76),vertical?77:98,34+seed%4*4,vertical?98:77,seed+2);
   if(seed%3===0)this.boundaryRock(x+(vertical?direction*380:0),-70,y+(vertical?0:direction*380),185,96+seed%5*13,170,seed+4);
 }}
 },

 frontiers(w){
   const R=window.BrukRealms;if(R.clusterOf(w.state).startsWith('dungeon:'))return;
   for(const b of G.borders){
     if(b.kind==='forest'?!this.tallVisible(b,700,150):!this.tallVisible(b,170,130))continue;
     const {x,y,seed}=b;
     if(b.kind==='ridge'){
       this.boundaryRock(x,0,y,112,95+seed%45,104,seed,true);
       this.boundaryRock(x+26,0,y-18,47,58+seed%19,42,seed+3,true);
     }else if(b.kind==='water'){
       this.draw('cube',x,-.5,y,b.vertical?64:96,1,b.vertical?96:64,L.water);
       for(const side of [-1,1])this.boundaryRock(x+(b.vertical?side*38:0),-4,y+(b.vertical?0:side*38),b.vertical?26:96,15,b.vertical?96:26,seed+side);
       const flow=this.opt?.animations===false?0:w.time;
       for(let i=0;i<3;i++)this.draw('cube',x+(b.vertical?(i-1)*14:Math.sin(flow*.4+i)*25),.3,y+(b.vertical?Math.sin(flow*.4+i)*25:(i-1)*14),b.vertical?1.4:22,1,b.vertical?22:1.4,L.ripple);
     }else this.treeModel(x,y,3,seed%5===0?2:0,true,'forest',seed,w.time);
   }
 },
 barrier(o){
   const vertical=o.h>o.w,length=vertical?o.h:o.w,depth=vertical?o.w:o.h,wood=o.type==='wall',high=wood?68:o.type==='citywall'?105:82;
   const variant=S.hash(o.x+':'+o.y)%4;
   const parts=F.model('barrier/'+o.type+'/'+length+'/'+depth+'/'+variant,b=>{
     const box=(slot,x,y,z,w,h,d)=>b.loft(slot,[-1,1].map(side=>[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([px,pz])=>[x+px,y+side*h/2,z+pz])));
     box('stone',0,6,0,length,12,depth);
     if(wood){
       const count=Math.ceil(length/10),step=length/count;
       for(let i=0;i<count;i++){
         const x=-length/2+(i+.5)*step,h=high-3+(i*7+variant)%6;
         b.loft(i%3?'wood':'woodLight',[[10,step*.46,depth*.24],[h-7,step*.46,depth*.24],[h,step*.12,depth*.12]].map(([y,rx,rz])=>[[-rx,-rz],[rx,-rz],[rx,rz],[-rx,rz]].map(([px,pz])=>[x+px,y,pz])));
       }
       const posts=Math.max(1,Math.ceil(length/58));
       for(let i=0;i<=posts;i++){
         const x=-length/2+4+i*(length-8)/posts;
         box('wood',x,38,0,8,64,depth);box('iron',x,58,0,8.5,3,depth);
         for(const y of [27,49])for(const side of [-1,1])box('iron',x,y,side*(depth/2-.5),2,2,1);
       }
       for(const y of [27,49])for(const side of [-1,1])box('wood',0,y,side*(depth/2-1.5),length,4,3);
     }else if(o.type==='dungeongate'){
       for(const y of [7,38,74])box('iron',0,y,0,length,5,depth);
       const count=Math.ceil(length/12),step=length/count;
       for(let i=0;i<count;i++)box('iron',-length/2+(i+.5)*step,41,0,3,76,depth*.45);
     }else{
       box('stone',0,(high-14)/2,0,length,high-14,depth);
       for(const y of [16,high-19])box('cap',0,y,0,length,4,depth);
       const count=Math.ceil(length/32),step=length/count;
       for(let i=0;i<count;i++)box('cap',-length/2+(i+.5)*step,high-7,0,step*.57,14,depth);
     }
   });
   const colors={stone:wood?'989d89':'969b8a',cap:'b6b6a1',wood:'857052',woodLight:'a08a63',iron:'565e56'};
   for(const {mesh,slot} of parts)this.draw(mesh,o.x+o.w/2,0,o.y+o.h/2,1,1,1,colors[slot],vertical?Math.PI/2:0,slot.startsWith('wood')?'wood':slot==='iron'?'steel':'stone');
 },
 gateway(p){
   const wood=!!p.village;
   const parts=F.model('gateway/'+(wood?'village':'stone'),b=>{
     const box=(slot,x,y,z,w,h,d)=>b.loft(slot,[-1,1].map(side=>[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([px,pz])=>[x+px,y+side*h/2,z+pz])));
     for(const side of [-1,1]){
       box('stone',side*62,15,0,18,30,22);
       box(wood?'wood':'stone',side*62,70,0,18,80,22);
       for(const y of [30,97])box(wood?'iron':'cap',side*62,y,0,18,4,22);
       if(wood)b.beam('wood',[side*53,100,0],[side*37,114,0],3,3,4);
       box('wood',side*69,92,15,3,27,3);box('banner',side*69,82,17,12,26,2);
       box('iron',side*62,51,12,5,15,3);
     }
     if(wood){
       box('wood',0,117,0,150,14,22);
       for(const x of [-57,57])box('iron',x,117,0,6,14,23);
     }else{
       for(let i=0;i<13;i++){
         const a=i*Math.PI/13,c=(i+1)*Math.PI/13;
         b.beam(i%3?'stone':'cap',[Math.cos(a)*54,74+Math.sin(a)*54,0],[Math.cos(c)*54,74+Math.sin(c)*54,0],7,7,4);
       }
       box('cap',0,136,0,150,9,24);
     }
     const eave=wood?124:141;
     b.loft('roof',[[[-80,eave,-17],[80,eave,-17],[80,eave,17],[-80,eave,17]],[[-80,eave+19,-1],[80,eave+19,-1],[80,eave+19,1],[-80,eave+19,1]]]);
     box('ridge',0,eave+20,0,164,3,3);
   });
   const colors={stone:'999d8e',cap:'b9b8a3',wood:'8e7757',iron:'53605a',banner:wood?'bca36e':'597c70',roof:'61776d',ridge:'9a9985'};
   for(const {mesh,slot} of parts)this.draw(mesh,p.x,0,p.y,1,1,1,colors[slot],p.axis==='x'?Math.PI/2:0,slot==='wood'?'wood':slot==='iron'?'steel':slot==='banner'?'leather':slot==='roof'?'slate':'stone');
 },
 boundaryRock(x,y,z,w,h,d,seed,snow=false){
   const variant=((seed%8)+8)%8;
   const parts=F.model('boundary/rock/'+variant+'/'+Number(snow),b=>{
     const outline=[[-.5,-.36],[-.35,-.5],[.12,-.5],[.41,-.46],[.5,-.25],[.5,.23],[.37,.5],[-.06,.5],[-.42,.45],[-.5,.21]];
     const rings=[0,1,2].map(k=>outline.map(([px,pz],i)=>{
       const q=k===0?1:k===1?.97:.66+(i+variant)%3*.09;
       return [px*q,k===0?0:k===1?.30+(i*3+variant)%5*.025:.76+(i*7+variant)%5*.05,pz*q];
     }));
     b.loft(['rock','rock','edge','rock','shade'],rings);
     if(snow){
       const top=rings[2],center=[0,.91,0];
       for(let i=0;i<top.length;i++){const j=(i+1)%top.length;b.triangle('snow',center,[top[j][0],top[j][1]+.008,top[j][2]],[top[i][0],top[i][1]+.008,top[i][2]]);}
     }
   });
   const colors={rock:'828d81',edge:'a0a595',shade:'6e7b72',snow:'e2e4d7'};
   for(const {mesh,slot} of parts)this.draw(mesh,x,y,z,w,h,d,colors[slot],0,slot==='snow'?'plaster':'rock');
 },
 trail(a,b,width=53,paved=false){
   const x=(a.x+b.x)/2,z=(a.y+b.y)/2,length=Math.hypot(b.x-a.x,b.y-a.y);
   if(length<.1||!this.visibleAt({x,y:z},width+20))return;
   const turn=-Math.atan2(b.y-a.y,b.x-a.x),seed=S.hash(a.x+':'+a.y+':'+b.x+':'+b.y),height=.02+(seed%5)*.012;
   const parts=F.model('land/trail',builder=>{
     const ring=[[-.5,-.40],[-.30,-.48],[0,-.46],[.28,-.5],[.5,-.39],[.5,.40],[.30,.48],[0,.44],[-.29,.5],[-.5,.39]];
     for(let i=0;i<ring.length;i++){const j=(i+1)%ring.length;builder.triangle('surface',[0,0,0],[ring[j][0],0,ring[j][1]],[ring[i][0],0,ring[i][1]]);}
   });
   this.draw(parts[0].mesh,x,-.6,z,length+5,1,width+15,L.roadEdge,turn,'soil');
   this.draw(parts[0].mesh,x,height,z,length+5,1,width,L.road,turn,paved?'cobble':'soil');
   if(!paved&&!this.opt?.lowTextures)for(const side of [-1,1]){
     const offset=side*width*.21;
     this.draw('cube',x+Math.sin(turn)*offset,height+.06,z+Math.cos(turn)*offset,length+2,.12,1.5,'9d9177',turn,'soil');
   }
 },
 roads(w){const R=window.BrukRealms,G=window.HoMoWGeography,cluster=R.clusterOf(w.state);if(!G||cluster==='village'||cluster.startsWith('dungeon:'))return;let routes=G.roads.get(cluster);if(!routes){const a=R.CLUSTERS.find(c=>c.id===cluster),exits=R.PORTALS.filter(p=>[p.a,p.b].includes(cluster));let hub={x:a.x+a.w/2,y:a.y+a.h/2};for(let i=0;R.blocked(hub.x,hub.y,28)&&i<100;i++)hub={x:a.x+150+(i*191)%(a.w-300),y:a.y+150+(i*277)%(a.h-300)};routes=exits.map(p=>{const path=[p,...R.findPath(p.x,p.y,hub.x,hub.y)],fine=[p];for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/70));for(let j=1;j<=steps;j++)fine.push({x:a.x+(b.x-a.x)*j/steps,y:a.y+(b.y-a.y)*j/steps});}return fine;});G.roads.set(cluster,routes);}for(const points of routes)for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],x=(a.x+b.x)/2,y=(a.y+b.y)/2;if(!this.visibleAt({x,y},70))continue;this.trail(a,b,53);}
 },
 building(o,time=0){
   const id=o.owner||'home',x=o.x+o.w/2,z=o.y+o.h/2,w=o.w,d=o.h;
   const palette={blacksmith:['c7b79e','826d5b'],mage:['c4c0b7','65747b'],enchanter:['bdc5b1','637c71'],armorer:['c0c1b0','566c66'],alchemist:['d0c9aa','6b7e64'],artificer:['cab994','89755d'],quartermaster:['bbc1b1','69766f'],market:['c8b898','816d57']};
   const [wall,roof]=palette[id]||palette.market;
   const p=(dx,y,dz,sx,sy,sz,c,k='cube',turn=0,material=null)=>this.draw(k,x+dx,y,z+dz,sx,sy,sz,c,turn,material);
   const high=id==='mage'?146:id==='quartermaster'?105:88,doorHeight=66,doorWidth=id==='quartermaster'?42:31;
   p(0,5,0,w+6,10,d+6,'a4a595','cube',0,'stone');
   if(Object.hasOwn(palette,id)){
     const sign=F.model('shop/sign/'+id,b=>{
       b.beam('wood',[-18,91,2],[18,91,2],2,2,4);
       for(const side of [-1,1])b.beam('iron',[side*11,91,2],[side*11,81,2],.7,.7,4);
       b.loft('wood',[[[-17,60,0],[17,60,0],[17,60,4],[-17,60,4]],[[-17,82,0],[17,82,0],[17,82,4],[-17,82,4]]]);
       if(['blacksmith','armorer','artificer'].includes(id)){
         b.beam('mark',[-8,64,5],[8,78,5],1.8,1.8,4);
         b.beam('mark',[1,79,5],[12,70,5],3,3,4);
         if(id==='armorer')b.loft('mark',[[[-8,65,5],[7,65,5],[7,65,7],[-8,65,7]],[[-6,77,5],[5,77,5],[5,77,7],[-6,77,7]]]);
       }else if(id==='alchemist'){
         b.rings('mark',[[63,7,1.7],[69,7,1.7],[75,3,1.7],[80,3,1.7]],6);
       }else if(['mage','enchanter'].includes(id)){
         b.loft('mark',[[[0,62,5],[1,62,5],[1,62,6],[0,62,6]],[[-7,71,5],[0,71,8],[7,71,5],[0,71,4]],[[0,80,5],[1,80,5],[1,80,6],[0,80,6]]]);
       }else{
         b.rings('mark',[[66,8,1.4],[76,8,1.4]],8);
         b.beam('iron',[-5,71,3],[5,71,3],1,1,4);
       }
     });
     for(const {mesh,slot}of sign)this.draw(mesh,x+w*.31,0,z+d/2+12,1,1,1,slot==='wood'?'735d43':slot==='iron'?'59665b':'dcc08a',0,slot==='wood'?'wood':'steel');
   }
   if(id==='market'){
     for(const dx of [-w*.43,w*.43])for(const dz of [-d*.4,d*.4]){p(dx,39,dz,5,78,5,'896b4e','cube',0,'wood');p(dx,5,dz,9,10,9,'92978a','cube',0,'stone');}
     p(0,78,0,w+18,28,d+16,'b7aa85','roof',0,'leather');
     p(0,76,d/2+8,w+18,9,3,'a29373','cube',0,'leather');
     p(0,26,d*.25,w*.85,10,22,'ad8254','cube',0,'wood');
     for(let i=0;i<6;i++){p((i-2.5)*13,33,d*.25,5,4,6,'806449','cube',0,'wood');p((i-2.5)*13,36,d*.25,2.8,3.1,2.8,['baa075','8b997c','b18574'][i%3],'sphere');}
     return;
   }
   p(0,high/2+10,0,w,high,d,wall,'cube',0,'plaster');
   const rise=id==='armorer'?35:48,eave=high+10;
   const parts=F.model('building/'+id+'/'+w+'/'+d,b=>{
     const box=(slot,cx,cy,cz,sx,sy,sz)=>b.loft(slot,[-1,1].map(side=>[[-sx/2,-sz/2],[sx/2,-sz/2],[sx/2,sz/2],[-sx/2,sz/2]].map(([px,pz])=>[cx+px,cy+side*sy/2,cz+pz])));
     for(const dx of [-w/2+3,w/2-3])for(const dz of [-d/2,d/2])box('timber',dx,high/2+10,dz,6,high+3,5);
     for(const y of [18,high*.62,eave-2]){
       for(const dz of [-d/2,d/2])box('timber',0,y,dz,w+2,4,5);
       for(const dx of [-w/2,w/2])box('timber',dx,y,0,5,4,d+2);
     }
     for(const side of [-1,1]){
       box('timber',side*w/2,high/2+10,0,5,high,5);
       b.beam('timber',[side*w/2,22,-d*.42],[side*w/2,high*.62,-d*.06],2.3,2.3,4);
       b.beam('timber',[side*w/2,22,d*.42],[side*w/2,high*.62,d*.06],2.3,2.3,4);
     }
     if(id==='mage'){
       b.rings(['roof','roofLight'],[[eave,w*.58,d*.58],[eave+32,w*.39,d*.39],[eave+63,w*.20,d*.20],[eave+95,.8,.8]],10);
       for(const y of [eave,eave+32,eave+63]){const q=1-(y-eave)/95;b.rings('ridge',[[y,w*.58*q+1,d*.58*q+1],[y+2,w*.58*q,d*.58*q]],10);}
     }else{
       for(const dz of [-d/2,d/2]){
         const gable=[[-w/2,eave,dz],[w/2,eave,dz],[0,eave+rise,dz]];
         if(dz<0)gable.reverse();
         b.triangle('gable',...gable);
         b.beam('timber',[-w/2,eave,dz],[0,eave+rise,dz],2.5,2.5,4);
         b.beam('timber',[0,eave+rise,dz],[w/2,eave,dz],2.5,2.5,4);
         box('timber',0,eave+rise*.45,dz,4,rise*.9,5);
       }
       const rx=w/2+9,rz=d/2+9,columns=Math.ceil((d+18)/15),step=(d+18)/columns;
       for(const side of [-1,1]){
         const a=[side*rx,eave,-rz],c=[side*rx,eave,rz],tip=[0,eave+rise,rz],back=[0,eave+rise,-rz];
         const corners=side===1?[back,tip,c,a]:[a,c,tip,back];
         b.triangle('roofBase',corners[0],corners[1],corners[2]);b.triangle('roofBase',corners[0],corners[2],corners[3]);
         box('timber',side*rx,eave-1,0,4,5,d+20);
         for(const dz of [-rz,rz])b.beam('timber',[side*rx,eave,dz],[0,eave+rise,dz],2,2,4);
       }
       for(const side of [-1,1])for(let row=0;row<6;row++){
         const q0=row/6,q1=(row+1)/6;
         for(let col=-1;col<columns;col++){
           const z0=Math.max(-rz,-rz+(col+(row%2)*.5)*step)+.45,z1=Math.min(rz,-rz+(col+1+(row%2)*.5)*step)-.45;
           if(z1<=z0)continue;
           const a=[side*rx*(1-q0),eave+rise*q0+.55,z0],c=[side*rx*(1-q1),eave+rise*q1+.95,z1];
           const corners=[a,[a[0],a[1],z1],c,[c[0],c[1],z0]],slot=(row*3+col+columns)%4===0?'roofLight':'roof';
           if(side===1)corners.reverse();
           b.triangle(slot,corners[0],corners[1],corners[2]);b.triangle(slot,corners[0],corners[2],corners[3]);
         }
       }
       box('ridge',0,eave+rise+1,0,6,4,d+21);
     }
     for(const dx of [-doorWidth/2-2,doorWidth/2+2])box('frame',dx,43,d/2+3,4,68,5);
     box('frame',0,78,d/2+3,doorWidth+10,5,6);
     for(let i=0;i<6;i++)box('door',((i+.5)/6-.5)*doorWidth,43,d/2+3,doorWidth/6-.6,doorHeight,3);
     for(const y of [25,62])box('iron',-doorWidth*.30,y,d/2+5,doorWidth*.33,2,1.2);
     for(const side of [-1,1]){
       const wx=side*w*.30,wy=high*.53;
       for(const dx of [-10,10])box('frame',wx+dx,wy,d/2+4,3,26,4);
       for(const y of [-12,12])box('frame',wx,wy+y,d/2+4,23,3,4);
       for(const dx of [-15,15]){box('shutter',wx+dx,wy,d/2+4,6,23,3);for(const y of [-8,8])box('frame',wx+dx,wy+y,d/2+6,7,1.5,1);}
       box('frame',wx,wy,d/2+6,1.5,22,1.5);box('frame',wx,wy,d/2+6,20,1.5,1.5);
       box('stone',wx,wy-15,d/2+5,28,4,10);
       const sy=high*.54;
       box('glass',side*(w/2+1),sy,-d*.20,2,21,20);
       for(const dz of [-11,11])box('frame',side*(w/2+3),sy,-d*.20+dz,4,26,3);
       for(const dy of [-12,0,12])box('frame',side*(w/2+3),sy+dy,-d*.20,4,2,24);
     }
   });
   const colors={timber:'786047',frame:'987b56',door:'92714d',shutter:'6e7c66',iron:'535852',stone:'b5b29e',glass:'839b97',gable:wall,roof,roofLight:roof,roofBase:'4e574f',ridge:'89918a'};
   const materials={timber:'wood',frame:'wood',door:'wood',shutter:'wood',iron:'steel',stone:'stone',gable:'plaster',roof:'slate',roofLight:'rock',roofBase:'slate',ridge:'stone'};
   for(const {mesh,slot} of parts)this.draw(mesh,x,0,z,1,1,1,colors[slot],0,materials[slot]||null);
   for(const side of [-1,1])p(side*w*.30,high*.53,d/2+2,17,21,3,'dfc596');
   p(doorWidth*.34,41,d/2+6,2,2,2,'b5a477','sphere');p(0,4,d/2+11,doorWidth+8,8,20,'b6b49d','cube',0,'stone');
   if(id==='mage')p(0,eave+103,0,4,8,4,'d9c28c','sphere');
   if(id==='blacksmith'){
     p(w*.3,high+22,-d*.2,23,72,25,'9f8e7a','cube',0,'stone');p(w*.3,high+59,-d*.2,29,8,31,'bdb6a5','cube',0,'stone');p(w*.3,high+64,-d*.2,17,1,19,'454b46');
     for(let i=0;i<3;i++){const puff=this.opt?.animations===false?(i+1)/3:(time*.3+i/3)%1;p(w*.3+Math.sin(puff*5.5+i)*9,high+64+puff*74,-d*.2+puff*15,8+puff*17,7+puff*13,8+puff*17,puff>.6?'cbd2d6':'b6c1c8','sphere');}
   }
   if(id==='enchanter'){p(-w*.3,high+58,0,11,27,11,'6bd6d2','cone');p(w*.3,high+40,0,9,20,9,'b0a1ef','cone');p(0,52,d/2+7,13,18,2,'5dbaaa','cube',0,'rune');}
   if(id==='alchemist'){p(w*.5+16,30,0,24,46,d*.65,'8aa697');for(let i=0;i<3;i++)p(w*.5+29,30,(i-1)*d*.2,3,50,3,'c5b898','cube',0,'wood');p(w*.5+15,55,0,30,12,d*.7,'91a991','roof');}
   if(id==='artificer'){const a=this.opt?.animations===false?0:time*.15;for(let i=0;i<4;i++){const b=a+i*Math.PI/2;p(Math.sin(b)*32,eave+22+Math.cos(b)*32,d/2+11,8,40,3,'c4b38e','cube',-b,'wood');}p(0,eave+22,d/2+15,10,10,8,'796044','sphere');}
   if(id==='quartermaster'){p(-w*.28,high+15,d*.25,28,35,28,wall,'cube',0,'plaster');p(-w*.28,high+32,d*.25,35,18,35,roof,'roof',0,'slate');}
 },
 resource(n,time){const v=S.resource(n.type),x=n.x,z=n.y,alive=n.charges>0,t=v.tier,c=alive?v.color:'8e9383',p=(dx,y,dz,sx,sy,sz,col=c,k='cube',a=0)=>this.draw(k,x+dx,y,z+dz,sx,sy,sz,col,a);
 if(v.family==='wood'){this.treeModel(x,z,t,v.shape,alive,RBiome(n),n.id,time);return;}
 if(v.family==='fiber'){this.cotton(n,v,time);return;}
 if(v.family==='herb'){if(!alive){p(0,2,0,14,4,14,'967d51');return;}for(let i=0;i<5;i++){const a=i*2.4,dx=Math.cos(a)*12,dz=Math.sin(a)*9;p(dx,13,dz,3,24,3,'748266');p(dx+4,15,dz,10,6,7,'7e9479','sphere',a);p(dx-3,20,dz,8,7,7,c,'sphere');p(dx,25,dz,3,4,3,'c99e80','sphere');}return;}
 if(v.family==='hide'){for(const side of [-1,1])p(side*18,27,0,3,54,3,'9e784c');p(0,53,0,42,4,4,'b38b57');p(0,27,0,27,30,3,alive?['b78256','ccb58b','9c745a','decc9b'][v.shape]:'8b8068');return;}
 this.deposit(n,v);
 },
 cotton(n,v,time=0){
      const variant=S.hash(String(n.id))%6,alive=n.charges>0;
   const parts=F.model('cotton/'+v.id+'/'+variant+'/'+(alive?'active':'dry'),b=>{
     let seed=(v.seed^Math.imul(variant+1,2654435761))>>>0;
     const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
     const angle=variant*.61,tip=[Math.cos(angle)*1.5,alive?28+v.tier*.7:8,Math.sin(angle)*1.5];
     b.beam(alive?'stem':'dry',[0,0,0],tip,alive?1.2:.8,alive?.55:.35,6);
     if(!alive){
       for(const side of [-1,1])b.beam('dry',[tip[0]*.6,4.5,tip[2]*.6],[side*3.5,7+random()*2,side*1.8],.4,.16,5);
       return;
     }
     const leaf=(root,a,length)=>{
       const c=Math.cos(a),s=Math.sin(a),width=length*.43;
       const point=(u,w,lift=0)=>[root[0]+c*u*length-s*w*width,root[1]+u*2.8+lift,root[2]+s*u*length+c*w*width];
       const outline=[[0,0],[.23,-.22],[.22,-.78],[.48,-.46],[.58,-1],[.78,-.38],[1,0],[.78,.38],[.58,1],[.48,.46],[.22,.78],[.23,.22]].map(([u,w])=>point(u,w));
       const ridge=point(.48,0,1.3);
       for(let j=0;j<outline.length;j++){
         const k=(j+1)%outline.length;b.triangle('leaf',ridge,outline[k],outline[j]);b.triangle('leafShade',ridge,outline[j],outline[k]);
       }
       b.beam('vein',root,point(.91,0,.25),.18,.08,4);
     };
     const count=5+Math.floor((v.tier-1)/3);
     for(let i=0;i<count;i++){
       const a=angle+i*2.399+random()*.23,r=10+random()*5,top=20+(i%3)*4+v.tier*.6+random()*2;
       const root=[tip[0]*.4,8+i*2.4,tip[2]*.4],boll=[Math.cos(a)*r,top,Math.sin(a)*r];
       b.beam('stem',root,[boll[0],top-3,boll[2]],.65,.32,6);
       const petiole=[boll[0]*.53,root[1]+3,boll[2]*.53],end=[petiole[0]+Math.cos(a+.8)*2,petiole[1]+1,petiole[2]+Math.sin(a+.8)*2];
       b.beam('stem',petiole,end,.3,.2,5);leaf(end,a+.8,8+random()*3);
       // Open, pointed brown carpel halves surround the exposed cotton, not a white ball.
       for(let j=0;j<5;j++){
         const q=a+j*Math.PI*2/5,c=Math.cos(q),s=Math.sin(q);
         const base=[boll[0],top-5,boll[2]],left=[boll[0]+c*4-s*2,top-2,boll[2]+s*4+c*2],right=[boll[0]+c*4+s*2,top-2,boll[2]+s*4-c*2],tip=[boll[0]+c*6,top+1.5,boll[2]+s*6];
         b.triangle('boll',base,left,right);b.triangle('boll',left,tip,right);
         b.triangle('bollShade',base,right,left);b.triangle('bollShade',left,right,tip);
       }
       for(let tuft=0;tuft<4;tuft++){
         const q=a+tuft*Math.PI/2,px=boll[0]+Math.cos(q)*2.5,pz=boll[2]+Math.sin(q)*2.5,py=top+random()*2,rx=3.3+random(),rz=3+random();
         const radii=Array.from({length:7},()=>.8+random()*.35);
         const rings=[[-3,.35],[0,1],[2.8,.85],[4.1,.24]].map(([dy,size],row)=>radii.map((r,j)=>{
           const u=q+j*Math.PI*2/7;return [px+Math.cos(u)*rx*r*size+(row===2?.4:0),py+dy+(row===1?random()*.9:0),pz+Math.sin(u)*rz*r*size];
         }));
         b.loft(['cotton','cream','cotton','fiberTint','cream','cotton','cream'],rings);
       }
     }
     leaf([0,9,0],angle+1.8,10);leaf([0,15,0],angle+4.1,9);
   });
   const wash=(base,tint,mix)=>base.match(/../g).map((h,i)=>Math.round(parseInt(h,16)*(1-mix)+parseInt(tint.slice(i*2,i*2+2),16)*mix).toString(16).padStart(2,'0')).join('');
   const colors={stem:'795638',dry:'937654',boll:'8d613c',bollShade:'67472f',leaf:wash('55764c',v.color,.10),leafShade:'3f5c3b',vein:'8b9561',cotton:'f2eddd',cream:'fff9e9',fiberTint:wash('e9e2ce',v.color,.12)};
   const phase=alive&&this.opt?.animations!==false?Math.sin(time*1.3+variant)*.012:0;
   for(const {mesh,slot} of parts)this.draw(mesh,n.x,0,n.y,1,1,1,colors[slot],0,this.opt?.lowTextures?null:['stem','dry','boll','bollShade','vein'].includes(slot)?'wood':['cotton','cream','fiberTint'].includes(slot)?'plaster':'leather',phase*.3,phase);
 },
 deposit(n,v){
   const variant=S.hash(String(n.id))%6,alive=n.charges>0;
   const parts=F.model('geology/'+v.id+'/'+variant,b=>{
     let seed=(v.seed^Math.imul(variant+1,2654435761))>>>0;
     const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
     const count=9,radii=Array.from({length:count},()=>.80+random()*.26),angle=variant*.31;
     const rows=[[0,18,15,0,0],[10,21,16,1,-1],[24+variant,13,11,-2,1],[30+variant,5,4,-3,1]];
     const rings=rows.map(([y,rx,rz,cx,cz],k)=>radii.map((r,i)=>{
       const a=angle+i*Math.PI*2/count;
       return [cx+Math.cos(a)*rx*r,y+(k?random()*3:0),cz+Math.sin(a)*rz*r];
     }));
     b.loft(['rock','rock','edge','rock','shade','rock','edge','rock','shade'],rings);
     for(let i=0;i<4;i++){
       const a=i*2.399+angle,dx=Math.cos(a)*21,dz=Math.sin(a)*18,r=3+random()*3;
       b.rings(i%2?'edge':'rock',[[0,r,r*.8,dx,dz],[3,r*1.1,r*.8,dx,dz],[6+random()*4,r*.36,r*.32,dx+1,dz]],5);
     }
     const mix=(a,c,t)=>a.map((v,i)=>v+(c[i]-v)*t);
     if(v.family==='ore'){
       for(let i=0;i<count;i++){
         if((i+variant)%3===0)continue;
         const j=(i+1)%count,spread=.055+v.tier*.007;
         for(let k=1;k<rings.length;k++){
           const q=.34+.15*Math.sin(i*2.8+k+variant),r=.34+.15*Math.sin(i*2.8+k+1+variant);
           const offset=p=>[p[0]*1.012,p[1]+.20,p[2]*1.012];
           const a=offset(mix(rings[k-1][i],rings[k-1][j],q-spread)),c=offset(mix(rings[k][i],rings[k][j],r-spread));
           const d=offset(mix(rings[k][i],rings[k][j],r+spread)),e=offset(mix(rings[k-1][i],rings[k-1][j],q+spread));
           b.triangle('vein',a,c,d);b.triangle('vein',a,d,e);
           const center=offset(mix(c,d,.5)),tip=offset(mix(a,e,.5));
           b.beam('mineral',tip,center,.6,.35,4);
         }
       }
       for(let i=0;i<3;i++){
         const a=angle+i*2.399,dx=Math.cos(a)*9,dz=Math.sin(a)*7;
         b.rings('mineral',[[24,3,2,dx,dz],[28+v.tier*.4,2.5,1.8,dx+1,dz],[30+v.tier*.4,.4,.3,dx+1,dz]],5);
       }
     }else if(v.family==='crystal'){
       for(let i=0;i<5;i++){
         const a=i*2.399+angle,dx=Math.cos(a)*10,dz=Math.sin(a)*8,h=26+(i%3)*8;
         b.rings(['vein','mineral','vein'],[[12,3,3,dx,dz],[h,4,3,dx+i-2,dz+2],[h+8,.15,.15,dx+i-2,dz+2]],6);
       }
     }
   });
   const colors={rock:v.family==='stone'?'92998b':'747c74',edge:v.family==='stone'?'acaf9c':'92978a',shade:'626b64',vein:v.color,mineral:v.color};
   for(const {mesh,slot} of parts){
     const mineral=slot==='vein'||slot==='mineral';
     if(mineral&&!alive)continue;
     this.draw(mesh,n.x,0,n.y,1,alive?1:.36,1,alive?colors[slot]:'8a8d80',0,mineral?'steel':'rock');
   }
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
 for(const points of this.villagePaths)for(let i=1;i<points.length;i++)this.trail(points[i-1],points[i],66,true);
 this.draw('sphere',R.CAMP.x,1,R.CAMP.y,62,1,56,'b7aa8e');for(let i=0;i<12;i++){const a=i*Math.PI/6;this.draw('cube',R.CAMP.x+Math.cos(a)*52,2,R.CAMP.y+Math.sin(a)*48,9,3,9,'c9bda1',a);}
 for(let i=0;i<8;i++){const a=i*Math.PI/4;this.draw('sphere',R.CAMP.x+Math.cos(a)*16,4,R.CAMP.y+Math.sin(a)*16,6,5,5,'a1a897');}for(const a of [-.6,.6])this.draw('cube',R.CAMP.x,5,R.CAMP.y,8,7,33,'96633d',a);for(let i=0;i<3;i++)this.draw('cone',R.CAMP.x+(i-1)*5,7,R.CAMP.y,6,19+(this.opt?.animations===false?0:Math.sin(w.time*5+i)*4),6,i%2?'ffe29a':'ffad56');

 },
 guard(n,time,index){const sway=this.opt?.animations===false?0:Math.sin(time*.9+index)*.02;this.hero({state:{x:n.x,y:n.y,weaponKind:'spear',armorKind:'plate',supportKind:'shield',appearance:{beard:'none'},outfits:{head:'soldier_helm'}},facing:{x:.9,y:.25+sway},walking:false,footstep:0,time,swing:0,hurt:0});this.draw('cube',n.x,62,n.y,5,12,15,index?'daa844':'3f9dbc');this.draw('cube',n.x-11,34,n.y+10,2,12,10,'4c82a6');this.tag(index?'Вартовий брами':'Капітан варти',n.x,n.y,74,null);},
 villageLife(w){const R=window.BrukRealms;if(!R.inVillage(w.state.x,w.state.y))return;const time=this.opt?.animations===false?0:w.time;
 for(let [i,a]of [[0,{x:535,y:640}],[1,{x:750,y:730}],[2,{x:340,y:340}]]){a=window.HoMoWVillage.spread({...a});const q=time*.18+i,p={x:a.x+Math.sin(q)*15,y:a.y+Math.cos(q)*12};if(!R.blocked(p.x,p.y,20)&&this.visibleAt(p))this.trader(p,['market','alchemist','quartermaster'][i],time,{walking:time>0,gait:.34,footstep:time*.9,facing:{x:Math.cos(q)*15,y:-Math.sin(q)*12}});}
 }
};
function RBiome(p){return window.BrukRealms.clusterAt(p.x,p.y).biome;}
})();
