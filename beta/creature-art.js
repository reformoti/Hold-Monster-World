/* Distinct low-poly silhouettes, anatomy and accents; canonical combat stays unchanged. */
(()=>{'use strict';const S=window.HoMoWWorldStyle,F=window.HoMoWForms;
const sections={
 'wolf-body':[[-1,.35,.56,0,-.12],[-.5,.72,.87],[.15,1,1],[.72,.79,.86,0,.08],[1,.3,.53,0,.1]],
 'wolf-head':[[-1,.35,.5,0,.2],[-.5,.75,.8,0,.12],[.12,1,1],[.7,.7,.8,0,-.1],[1,.34,.45,0,-.12]],
 'wolf-muzzle':[[-1,.9,.82],[-.55,1,1],[.5,.65,.65],[1,.48,.55]],
 'rat-body':[[-1,.42,.63],[-.45,.89,.95],[.25,1,1],[.8,.61,.82],[1,.25,.49]],
 'rat-head':[[-1,.36,.55,0,.2],[-.3,.81,.9],[.35,1,.85,0,-.1],[.8,.64,.55,0,-.1],[1,.3,.35]],
 'rat-muzzle':[[-1,1,1],[-.3,.73,.7],[.65,.35,.4],[1,.15,.22]],
 'boar-body':[[-1,.54,.6],[-.5,.93,.87],[.2,1,1],[.75,.81,.92],[1,.4,.7]],
 'boar-head':[[-1,.38,.6,0,.15],[-.35,.84,.94],[.3,1,1],[.78,.7,.72,0,-.16],[1,.38,.45,0,-.2]],
 'boar-muzzle':[[-1,.7,.82],[-.6,.95,1],[.72,1,.83],[1,.93,.75]],
 'bear-body':[[-1,.57,.63],[-.6,.9,.9],[.2,1,1],[.72,.85,.84],[1,.47,.61]],
 'bear-head':[[-1,.5,.68],[-.45,.93,.96],[.35,1,1],[.8,.76,.72],[1,.35,.48]],
 'bear-muzzle':[[-1,.88,.9],[-.4,1,1],[.65,.74,.8],[1,.65,.67]],
 'spider-abdomen':[[-1,.34,.48],[-.65,.74,.8],[.15,1,1],[.7,.75,.83],[1,.29,.4]],
 'spider-head':[[-1,.45,.6],[-.4,.91,.92],[.35,1,1],[.85,.53,.75],[1,.32,.45]],
 'lizard-body':[[-1,.5,.65],[-.4,1,1],[.4,.9,.97],[1,.34,.55]],
 'lizard-head':[[-1,.48,.7],[-.4,1,1],[.45,.9,.92],[1,.33,.65]],
 'bevel':[[-1,.66,.66],[-.72,1,1],[.68,1,1],[1,.72,.72]],
 'golem-body':[[-1,.57,.63],[-.6,.82,.84],[.45,1,1],[.82,.86,.9],[1,.59,.7]],
 'golem-head':[[-1,.63,.69],[-.64,.94,.98],[.62,1,1],[1,.68,.7]],
 'human-body':[[-1,.61,.69],[-.65,.63,.74],[.28,.97,1],[.7,1,.93],[1,.68,.65]],
 'human-head':[[-1,.35,.46,0,.15],[-.67,.58,.72,0,.12],[-.1,.87,.91],[.5,.92,.87],[.86,.64,.65],[1,.29,.35]],
 'robe':[[-1,1,1],[-.72,.93,.95],[-.1,.67,.72],[.6,.5,.55],[1,.46,.51]],
 'hood':[[-1,.64,.58,0,-.06],[-.35,1,1,0,-.06],[.5,.93,.94,0,-.05],[1,.45,.56]],
 'giant-body':[[-1,.62,.66],[-.55,.77,.83],[.35,1,1],[.8,.9,.87],[1,.66,.64]],
 'giant-head':[[-1,.5,.63,0,.14],[-.55,.84,.84,0,.08],[.12,1,1],[.74,.8,.84],[1,.45,.55]],
 'wood-trunk':[[-1,.83,.91,0,.08],[-.55,.67,.8,0,-.08],[0,.87,.9,0,.03],[.55,1,.86,0,-.07],[1,.71,.73]],
 'wood-head':[[-1,.62,.74],[-.45,1,1],[.45,.86,.92],[1,.51,.61]],
 'foliage':[[-1,.39,.52],[-.5,.89,.86],[0,1,1],[.6,.75,.78],[1,.23,.34]],
 'slime':[[-1,.73,.79],[-.6,1,1],[.15,.93,.94],[.75,.57,.66],[1,.22,.31]]
};
const shade=(color,factor=.72)=>{const n=parseInt(color,16);return [n>>16,(n>>8)&255,n&255].map(v=>Math.min(255,Math.round(v*factor)).toString(16).padStart(2,'0')).join('');};
function form(name){return F.model('creature/'+name,b=>{
 if(sections[name]){b.rings(['shell','shell','shade','shell','shell','shade','shell','shell'],sections[name],8);return;}
 if(['limb','bone','branch','point'].includes(name)){b.beam('shell',[0,-1,0],[0,1,0],1,name==='point'?.025:name==='branch'?.55:.72,6);return;}
 if(name==='ear'){
   b.rings('shell',[[-1,.85,.75],[-.4,1,.65],[1,.025,.025,0,-.35]],4,Math.PI/4);
   b.loft('inner',[[[-.55,-.6,.6],[0,.68,-.06],[.55,-.6,.6]], [[-.4,-.6,.65],[0,.68,-.01],[.4,-.6,.65]]]);return;
 }
 if(name==='round-ear'){
   b.rings('shell',[[-1,.34,.35],[-.55,.85,.8],[0,1,1],[.6,.82,.75],[1,.32,.3]],8);
   b.rings('inner',[[-.62,.32,.1,0,.77],[0,.65,.1,0,.89],[.65,.25,.1,0,.68]],8);return;
 }
 if(name==='paw'||name==='hand'){
   b.rings('shell',[[-.8,.63,.8],[-.4,1,1],[.25,.86,.86,0,-.1],[.85,.49,.48,0,-.25]],8);
   for(const x of [-.55,0,.55])b.beam(name==='paw'?'claw':'shell',[x,-.37,.68],[x,-.52,.98],.12,.04,5);return;
 }
 if(name==='hoof'){
   for(const x of [-.47,.47])b.rings('shell',[[-1,.42,.88,x,.06],[-.6,.43,.9,x,.04],[.6,.35,.63,x,-.18],[1,.24,.47,x,-.22]],6);return;
 }
 if(name==='rat-tail'){
   const points=[[0,.55,.85],[.38,.25,.48],[.55,0,.1],[.12,-.1,-.28],[-.55,.06,-.65],[-.75,.32,-.96]];
   for(let i=1;i<points.length;i++)b.beam('shell',points[i-1],points[i],.13-i*.016,.13-(i+1)*.016,6);return;
 }
 if(name==='wolf-tail'){
   b.beam('shell',[0,.6,.8],[.3,0,0],.19,.34,7);b.beam('shell',[.3,0,0],[.52,-.55,-.72],.34,.23,7);b.beam('shade',[.52,-.55,-.72],[.48,-.74,-.94],.23,.04,7);return;
 }
 if(name==='boar-tail'){
   const pts=[[0,0,.8],[.4,.5,.35],[.65,.7,-.2],[.22,.45,-.65],[-.25,.14,-.4],[0,.12,-.05]];
   for(let i=1;i<pts.length;i++)b.beam('shell',pts[i-1],pts[i],.15,.1,5);return;
 }
 if(name==='whiskers'){
   for(const side of [-1,1])for(let i=0;i<3;i++)b.beam('shell',[side*.24,(i-1)*.12,0],[side*.97,(i-1)*.8,(i-1)*.3],.025,.012,4);return;
 }
 if(name==='ruff'){
   for(const side of [-1,1])for(let i=0;i<3;i++)b.beam(i%2?'shade':'shell',[side*.38,.7-i*.37,.1],[side*(.9-i*.12),.25-i*.4,-.5],.22,.025,5);return;
 }
 if(name==='ribs'){
   b.beam('shell',[0,-.94,-.35],[0,.92,-.35],.13,.12,6);
   b.beam('shell',[0,-.6,.83],[0,.86,.86],.1,.11,5);
   for(let i=0;i<4;i++)for(const side of [-1,1]){
     const y=-.57+i*.42,w=.72+i*.05;
     const pts=[[0,y,-.34],[side*w,y+.13,-.15],[side*w,y+.06,.45],[side*.45,y-.07,.83],[0,y-.1,.83]];
     for(let j=1;j<pts.length;j++)b.beam('shell',pts[j-1],pts[j],.065,.065,5);
   }return;
 }
 if(name==='skull'){
   b.rings(['shell','shell','shade','shell','shell','shade','shell','shell'],[[-.4,.58,.56],[-.05,.95,.87],[.55,1,.9],[.9,.67,.62],[1,.32,.35]],8);
   for(const side of [-1,1]){
     b.beam('shell',[side*.76,-.1,.57],[side*.66,-.63,.65],.14,.13,5);
     b.beam('shell',[side*.66,-.63,.65],[side*.18,-.78,.86],.13,.13,5);
     b.beam('shell',[side*.82,.15,.61],[side*.22,.19,.88],.14,.12,5);
   }
   for(const x of [-.42,-.14,.14,.42])b.beam('tooth',[x,-.32,.82],[x,-.55,.84],.07,.06,4);return;
 }
 if(name==='fork'){
   b.beam('shell',[0,-.9,0],[0,.1,0],.31,.22,6);
   for(const side of [-1,1]){b.beam('shell',[0,-.15,0],[side*.55,.45,.1],.2,.12,6);b.beam('shade',[side*.55,.45,.1],[side*.84,.91,.22],.12,.025,5);}
   b.beam('shell',[0,.1,0],[.12,.97,-.18],.15,.04,5);return;
 }
 if(name==='drapery'){
   const rows=[[-1,1,1],[-.4,.8,.87],[.32,.51,.59],[.72,.56,.57],[1,.31,.36]];
   const rings=rows.map(([y,rx,rz],row)=>Array.from({length:12},(_,i)=>{
     const a=Math.PI/12+i*Math.PI/6,r=i%2?.81:1;
     return [Math.cos(a)*rx*r,y+(row===0?(i%3)*.13:0),Math.sin(a)*rz*r];
   }));b.loft(['shell','shade'],rings);return;
 }
 throw Error('Unknown creature anatomy: '+name);
});}
window.HoMoWCreatureArt={
 creature(m,time){const R=window.BrukRealms,t=R.TYPES[m.type],v=S.mob(m.type),f=v.family,c=v.color,accent=v.accent;
 const scale=window.HoMoWScale.creature(v,t),angle=Math.atan2(m.facing?.x||0,m.facing?.y??1),anim=this.opt?.animations===false?0:1,scan=anim*(m.walking||m.windup>0?0:Math.sin(time*.62+v.seed*1.3)*.085),ca=Math.cos(angle+scan),sa=Math.sin(angle+scan),breath=1+anim*Math.sin(time*1.9+v.seed%9)*.017,walk=anim?m.walking?Math.sin((m.footstep||time*10)):0:0,bob=anim*Math.sin(time*2+v.seed%9)*.85;
 let top=0;
 const p=(x,y,z,sx,sy,sz,col=c,kind='cube',turn=0,material=null,pitch=0,lean=0)=>{
   // Rotated unit-box bounds also contain tilted beams, snouts and crown tips.
   const reach=(Math.abs(Math.cos(pitch)*Math.sin(lean))*sx+Math.abs(Math.cos(pitch)*Math.cos(lean))*sy+Math.abs(Math.sin(pitch))*sz)*(kind==='cube'?.5:1)*breath;
   top=Math.max(top,(y+bob+reach)*scale);
   this.draw(kind,m.x+(x*ca+z*sa)*scale,(y+bob)*scale,m.y+(-x*sa+z*ca)*scale,sx*scale*breath,sy*scale*breath,sz*scale*breath,col,angle+scan+turn,this.opt?.lowTextures?null:material,pitch,lean);
 };
 const solid=(name,x,y,z,sx,sy,sz,color=c,material='leather',turn=0,pitch=0,lean=0)=>{
   const palette=typeof color==='string'?{shell:color,shade:shade(color),inner:'be9d9a',claw:'ded7bc',tooth:'eee4c9'}:color;
   for(const {mesh,slot} of form(name))p(x,y,z,sx,sy,sz,palette[slot]||palette.shell,mesh,turn,['claw','tooth'].includes(slot)?'plaster':material,pitch,lean);
 };
 const beam=(a,b,r,color=c,name='limb',material='leather')=>{
   const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],length=Math.hypot(dx,dy,dz);
   solid(name,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,r,length/2,r,color,material,0,Math.atan2(dz,dy),Math.asin(Math.max(-1,Math.min(1,dx/length))));
 };
 const muzzle=(name,x,y,z,width,height,length,color)=>solid(name,x,y,z,width,length,height,color,'leather',0,Math.PI/2);
 const eye=(x,y,z,color='f5d76e',size=3)=>{p(x,y,z,size,size,2,'233947');p(x,y,z+1,size*.5,size*.5,1,color);};
 const legs=(wide,length,height,color,anatomy='wolf')=>{
   const heavy=anatomy==='bear',hoof=anatomy==='boar',small=anatomy==='rat'||anatomy==='lizard',r=heavy?6.5:hoof?5:small?2.6:4;
   for(const x of [-wide,wide])for(const z of [-length,length]){
     const stride=walk*(x*z>0?1:-1)*3,lift=Math.max(0,stride),front=z>0;
     const hip=[x,height+3,z],knee=[x+(small?Math.sign(x)*3:0),height*.62+lift*.5,z+(front?2:5)+stride*.45],hock=[x,6+lift,z+(front?-2:-4)+stride],foot=[x,3+lift,z+3+stride];
     beam(knee,hip,r,color);beam(hock,knee,r*.65,color);beam(foot,hock,r*.5,color);
     solid(hoof?'hoof':'paw',x,3+lift,z+3+stride,heavy?7:small?4:5,3,heavy?8:small?5:7,color,hoof?'rock':'leather');
   }
 };
 const biped=(wide,height,r,color,footColor=color,material='leather')=>{
   for(const side of [-1,1]){
     const stride=walk*side*4,lift=Math.max(0,walk*side)*3,hip=[side*wide,height,0],knee=[side*wide,height*.53+lift,2+stride*.5],ankle=[side*wide,6+lift,stride];
     beam(knee,hip,r,color,'limb',material);beam(ankle,knee,r*.8,color,'limb',material);
     solid('bevel',...knee,r*.92,r*.82,r*.95,shade(color),material);
     solid('paw',side*wide,4+lift,3+stride,r*1.18,3,r*1.7,{shell:footColor,claw:shade(footColor)},material);
   }
 };
 const arms=(wide,shoulder,height,r,color,material='leather')=>{
   for(const side of [-1,1]){
     const a=[side*wide,shoulder,0],elbow=[side*(wide+3),height+12,-3],hand=[side*(wide+1),height,4];
     beam(elbow,a,r,color,'limb',material);beam(hand,elbow,r*.8,color,'limb',material);solid('hand',...hand,r*.9,r,r*.85,color,material);
   }
 };
 const humanoid=(robe=false)=>{
   if(robe){solid('robe',0,19,0,19,18,16);for(const side of [-1,1])p(side*7,3,5,9,5,12,'46515d');}
   else biped(7,29,4.5,'536373','46515d');
   solid('human-body',0,43,0,15,14,9);p(0,32,1,23,4,18,'705240','cube',0,'leather');
   arms(17,53,27,4.1,c);for(const side of [-1,1])solid('hand',side*18,27,4,3.4,4,3.4,'d8b392');
   solid('human-head',0,68,0,10,11,9,'d5b392',null);solid('bevel',0,58,0,4,4,4,'b48e70',null);
   for(const side of [-1,1])solid('round-ear',side*9,68,0,2,3,2,'c69b79',null);
   for(const x of [-4,4]){p(x,73,7.8,6,2,3,'9c785e');eye(x,71,8.5,'e6eed8',3);}
   solid('bevel',0,67.5,9,1.6,2.8,2.5,'b78c6c',null);p(0,63,8,5,1,1,'805c4d');
 };
 if(this.opt?.shadows!==false)p(0,1,0,23,1,20,'447a52','sphere');
 if(f==='slime'){
   solid('slime',0,16,0,25+anim*Math.sin(time*2)*1.5,19,23);solid('slime',0,27,1,18,9,15,'aab58e');
   for(const x of [-8,8])eye(x,20,20,'ffffff',5);p(0,14,22,7,2,1,'3c6d42');p(0,36,0,4,13,3,'717e5c');p(5,42,0,9,4,5,'a6ae80','sphere');
 }
 else if(['wolf','snowwolf','icewolf','bogwolf'].includes(f)){
   legs(11,18,24,c);solid('wolf-body',0,31,0,17,17,32);solid('wolf-body',0,36,17,16,18,16);solid('ruff',0,38,19,20,17,15);
   solid('wolf-head',0,43,23,13,15,15);muzzle('wolf-muzzle',0,35,36,8,6,12,f==='bogwolf'?'a0c38b':'dce4d6');
   solid('bevel',0,36,47,4,2.7,2,'354c55');p(0,31,41,10,1.2,13,'526369');
   for(const x of [-9,9]){solid('ear',x,56,18,5,9,5);eye(x*.72,46,34,'ffd574');p(x*.72,49,33,6,2,3,shade(c));}
   solid('wolf-tail',0,27,-42,9,10,20);
   if(f!=='wolf')for(const x of [-14,0,14])p(x,40,-5,7,f==='icewolf'?29:18,7,f==='bogwolf'?'7baf5e':'c5f0f5','cone');
 }
 else if(f==='rat'||f==='caverat'){
   legs(10,12,13,'a87970','rat');solid('rat-body',0,20,0,17,13,27);solid('rat-body',0,22,-11,18,15,18);
   solid('rat-head',0,26,23,12,12,15);muzzle('rat-muzzle',0,23,36,8,5,10,c);solid('bevel',0,23,45,2.8,2,2,'ebaaa0',null);
   for(const x of [-11,11]){solid('round-ear',x,39,18,8,9,3.5,{shell:c,inner:'c9a0ad'});eye(x*.64,30,33,'e6a4ad');}
   solid('whiskers',0,24,38,17,3,8,'e0ccc1',null);solid('rat-tail',0,5,-47,6,4,28,'c29d9d');
   if(f==='caverat'){solid('bevel',0,35,-1,6,6,12,accent);p(0,44,-1,6,13,6,'b994da','cone');}
 }
 else if(f==='boar'){
   legs(12,15,17,'745239','boar');solid('boar-body',0,27,0,24,20,31);solid('boar-body',0,34,12,21,17,21);
   solid('boar-head',0,29,28,16,16,20);muzzle('boar-muzzle',0,24,41,10,6,10,'cb9d73');solid('bevel',0,24,51,9,5,2,'b88565');
   for(const side of [-1,1]){
     p(side*4,25,53,2.5,2,1,'61483d');beam([side*11,21,39],[side*14,25,45],2.6,'eee1bb','bone','plaster');beam([side*14,25,45],[side*13,34,44],2,'eee1bb','point','plaster');
     solid('ear',side*12,44,21,6,7,5);eye(side*9,34,44);p(side*9,37,41,6,2,4,shade(c));
   }
   for(let i=0;i<5;i++)p(0,47,-20+i*8,4,10,5,'62443a','cone');solid('boar-tail',0,24,-34,6,7,8,'745239');
 }
 else if(f==='bear'||f==='armoredbear'){
   legs(16,18,25,'77512e','bear');solid('bear-body',0,39,0,28,25,36);solid('bear-body',0,47,14,25,21,24);
   solid('bear-head',0,48,31,20,20,18);muzzle('bear-muzzle',0,41,46,11,7,9,'d4ad7c');
   for(const x of [-14,14]){solid('round-ear',x,65,25,6,7,4,{shell:c,inner:'b28a67'});eye(x*.5,52,48);p(x*.5,55,47,7,3,4,shade(c));}
   solid('bevel',0,44,55,4,2.5,2,'3f4d4d');p(0,37,52,10,1,3,'624b3d');solid('bear-head',0,28,-35,5,5,6);
   if(f==='armoredbear'){solid('bevel',0,59,0,21,5,24,'99b7c7','steel');for(const x of [-18,18]){solid('bevel',x,48,15,7,9,10,'6c8b9d','steel');p(x,59,0,7,16,8,'d7e8e5','cone');}}
 }
 else if(f==='spider'){
   solid('spider-abdomen',0,19,-10,21,17,25);solid('spider-head',0,17,17,14,12,15);
   for(const side of [-1,1])for(let i=0;i<4;i++){
     const z=(i-1.5)*12,root=[side*10,18,z],knee=[side*(29+Math.abs(i-1.5)*3),25,z+(i-1.5)*10],toe=[side*(39+Math.abs(i-1.5)*2),2,z+(i-1.5)*16];
     beam(root,knee,2.7,c,'bone');beam(toe,knee,2.1,'68508c','limb');solid('bevel',...knee,3,3,3,shade(c));
   }
   for(const x of [-7,0,7])eye(x,22,30,'f2a3b9',4);
   for(const side of [-1,1]){beam([side*5,13,29],[side*7,7,35],2.1,'dcd4c0','bone','plaster');beam([side*7,7,35],[side*3,5,37],1.6,'dcd4c0','point','plaster');}
   if(t.boss)p(0,37,-10,16,21,16,'c4e86b','cone');
 }
 else if(f==='salamander'||f==='bluelizard'){
   legs(16,16,10,c,'lizard');solid('lizard-body',0,18,0,18,12,37);solid('lizard-head',0,23,31,17,13,23);
   for(let i=0;i<4;i++)solid('lizard-body',0,20-i*2,-31-i*11,14-i*3,10-i*2,17);
   for(let i=0;i<5;i++)p(0,30,-20+i*10,4,11,6,f==='bluelizard'?'79e1ef':'ffd37a','cone');for(const x of [-8,8])eye(x,29,43,'ffe29b');p(0,19,51,17,1,2,shade(c));
 }
 else if(['golem','crystalgolem','goldgolem','icegolem'].includes(f)){
   biped(12,29,7.5,c,shade(c),'rock');solid('golem-body',0,43,0,20,21,15,c,'rock');
   for(const side of [-1,1]){
     const shoulder=[side*23,59,0],elbow=[side*28,41,-3],hand=[side*26,25,4];
     beam(elbow,shoulder,8,c,'limb','rock');beam(hand,elbow,7,c,'limb','rock');solid('bevel',...elbow,6,6,6,shade(c),'rock');solid('bevel',...hand,8,7,9,c,'rock');solid('bevel',...shoulder,9,9,10,c,'rock');
   }
   solid('golem-head',0,72,0,13,12,13,c,'rock');for(const x of [-7,7])eye(x,75,13,'8bf3f4',4);
   p(0,67,13,11,2,2,shade(c));solid('bevel',0,43,15,4,8,2,accent,'rune');
   if(f!=='golem')for(let i=0;i<3;i++)p((i-1)*12,79,0,6,24+i*4,7,f==='goldgolem'?'f8dd78':'acdef6','cone');
 }
 else if(f==='treant'){
   for(const side of [-1,1]){
     beam([side*12,5,3],[side*10,28,0],6,'89643b','branch','wood');solid('fork',side*12,5,6,12,5,14,'89643b','wood',0,Math.PI/2);
     beam([side*19,55,0],[side*30,46,0],5,'9e7945','branch','wood');beam([side*30,46,0],[side*36,70,0],4.5,'9e7945','branch','wood');
     solid('fork',side*36,76,0,13,19,9,'9e7945','wood');solid('foliage',side*35,85,0,20,16,21);
   }
   solid('wood-trunk',0,43,0,15,25,12,'9a7140','wood');for(const side of [-1,1])beam([side*5,22,11],[side*8,65,10],1.7,'705333','branch','wood');
   solid('wood-head',0,76,0,13,12,11,'967042','wood');for(const x of [-6,6])eye(x,78,11,'d9ed7a',4);p(0,69,11,9,3,2,'503f2e');
   solid('fork',0,95,0,20,23,17,'89643b','wood');solid('foliage',0,101,0,31,25,29);
 }
 else if(['wraith','iceghost','ghostking','shadow'].includes(f)){
   const float=this.opt?.animations===false?0:Math.sin(time*2)*4;
   solid('drapery',0,32+float,0,24,27,22);solid('hood',0,63+float,-2,20,13,18);solid('human-head',0,62+float,10,8,9,7,'6c939d',null);
   for(const x of [-6,6])eye(x,65+float,17,'d3ffff',4);
   for(const side of [-1,1]){beam([side*14,53+float,0],[side*27,46+float,2],5,c);beam([side*27,46+float,2],[side*37,49+float,8],3.7,c);solid('hand',side*37,49+float,8,4,5,4,accent);}
   for(let i=0;i<3;i++)solid('drapery',(i-1)*15,12+float,0,5,10,5);
   if(f==='shadow')solid('hood',0,60+float,-8,31,18,27,'343d69');
 }
 else if(['ancient','titan','goldtitan','frostgiant','firegiant'].includes(f)){
   biped(13,36,9,c,shade(c),'rock');solid('giant-body',0,53,0,24,24,17,c,'rock');arms(29,68,27,8.5,c,'rock');
   solid('giant-head',0,87,0,16,14,14,c,'rock');solid('bevel',0,74,1,7,5,7,shade(c),'rock');
   for(const x of [-7,7]){eye(x,89,12,'e8ffff',5);p(x,93,10,10,3,4,shade(c));}
   solid('bevel',0,85,15,3,5,3,shade(c),'rock');p(0,79,13,12,2,2,shade(c));
   solid('bevel',0,53,15,19,16,4,shade(c,1.15),'steel');solid('bevel',0,52,20,6,11,2,f==='firegiant'?'ffc36b':'b4f3ed','rune');
   for(const side of [-1,1]){solid('bevel',side*25,69,0,11,9,13,accent,'steel');solid('bevel',side*13,22,4,8,8,7,accent,'steel');p(side*20,102,0,8,23,9,accent,'cone');}
   if(f==='frostgiant'||f==='titan')for(let i=0;i<3;i++)p((i-1)*14,75,-15,8,34+i*8,9,'c9edfa','cone');
   if(f==='firegiant')for(let i=0;i<3;i++)p((i-1)*18,78,-2,9,25,10,'ffcf71','cone');
 }
 else if(['skeleton','skeletonking','ironbone','copperbone'].includes(f)){
   for(const side of [-1,1]){
     const hip=[side*8,29,0],knee=[side*8,16,3],ankle=[side*8,4,0],elbow=[side*21,41,-3];
     beam(knee,hip,2.5,'e6dcc0','bone','plaster');beam(ankle,knee,2,'e6dcc0','bone','plaster');solid('bevel',...knee,3,3,3,'e6dcc0','plaster');solid('paw',side*8,3,4,3,2,6,'e6dcc0','plaster');
     beam(elbow,[side*16,55,0],2.4,'e6dcc0','bone','plaster');beam([side*20,28,4],elbow,2,'e6dcc0','bone','plaster');solid('hand',side*20,28,4,2.8,4,2.5,'e6dcc0','plaster');
     beam([0,28,0],[side*10,29,0],3,'eadfc4','bone','plaster');
   }
   solid('ribs',0,43,0,13,16,9,c,'plaster');beam([0,57,0],[0,62,0],2.5,'eadfc4','bone','plaster');solid('skull',0,68,0,11,12,10,'eee5cc','plaster');
   for(const x of [-5,5])eye(x,70,9,'b2dbcf',6);p(0,66,9,3,4,2,'514c43');p(0,61,9,9,2,1,'514c43');
   if(f==='ironbone'||f==='copperbone')solid('bevel',0,43,8,14,12,3,c,'steel');p(22,44,4,4,48,4,'a9b7b7','cube',0,'steel');
   if(f==='skeletonking')solid('bevel',0,83,0,12,4.5,11,'d6b96a','steel');
 }
 else {
   const robe=['mage','stormmage','firemage','necromancer'].includes(f);humanoid(robe);
   if(robe){solid('hood',0,70,-3,12,12,11);p(0,82,0,24,3,23,accent);p(0,83,0,12,30,12,c,'cone');p(23,41,4,4,73,4,'886745','cube',0,'wood');p(23,82,4,8,12,8,f==='firemage'?'ffd277':accent,'sphere');p(0,43,9.5,4,23,2,accent,'cube',0,'leather');}
   else if(f==='knight'){
     solid('human-body',0,46,3,15,13,9,'a8c4ce','steel');for(const side of [-1,1])solid('bevel',side*17,54,0,7,5,7,'829eaf','steel');
     solid('hood',0,72,-2,12,12,11,'bacbd0','steel');p(0,72,11,17,2,2,'374956');p(0,87,0,5,17,18,accent);solid('bevel',-26,43,9,3,17,14,'4e7c9b','steel');p(23,44,10,5,55,5,'d5e7e6','cube',0,'steel');
   }else{
     solid('hood',0,74,-3,12,10,11,f==='rogue'?'343b5b':'7d5233');p(0,82,0,24,6,22,f==='rogue'?'343b5b':'7d5233');p(0,69,11,20,7,2,f==='rogue'?'56689b':'8c4a36');
     solid('bevel',0,43,8,12,9,2,f==='rogue'?'56689b':'8c4a36');p(22,36,12,4,26,4,'cbd2ce','cube',0,'steel');if(f==='rogue')p(-22,36,12,4,26,4,'cbd2ce','cube',0,'steel');
   }
 }
 // Each variant has its own accent placement, not just a shared recolour.
 if(v.crest===0)p(0,t.boss?104:48,-12,7,12,5,accent,'cone');else if(v.crest===1)p(-18,39,-2,6,13,9,accent);else if(v.crest===2)p(0,30,-18,11,5,8,accent);else p(17,26,-4,5,7,5,accent,'sphere');
 const crownBase=top/scale;
 if(v.elite||t.boss){for(const i of [-1,0,1])p(i*5,crownBase-1,0,2.4,i?5:7,2.4,'edce83','cone');}
 this.pickParts=null;
 if(m.telegraph)this.warning(m.telegraph,m);for(const h of m.hazards||[])this.warning(h,m);
 return top;
 }
};
})();
