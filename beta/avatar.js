/* Articulated figure in character space. The armory and the hands use the same grip transform. */
(()=>{'use strict';
const F=window.HoMoWForms;
const cached=new Map();
function solid(name,make){
 if(!cached.has(name))cached.set(name,F.model('figure/'+name,make));
 return cached.get(name);
}
// Embossed plate over an irregular outline, seen from the front of the figure (+Z).
function panel(b,slot,outline,peak){
 const area=outline.reduce((n,p,i)=>{const q=outline[(i+1)%outline.length];return n+p[0]*q[1]-q[0]*p[1];},0);
 for(let i=0;i<outline.length;i++){
   const a=outline[i],c=outline[(i+1)%outline.length];
   b.triangle(slot,area>0?a:c,area>0?c:a,peak);
 }
}
const trim=(b,slot,points,r)=>{for(let i=1;i<points.length;i++)b.beam(slot,points[i-1],points[i],r,r,4);};
function torso(b,kind){
 const plate=kind==='plate',leather=kind==='leather',bare=kind==='body';
 b.rings(bare?'skin':'under',[[30,8.1,5.9],[36,8.8,6.3],[41,9.8,6.5],[48,13.1,7.5],[53.5,14,7.1],[57,10.6,6],[59,5.1,4.8]],8);
 b.rings('trouser',[[27,8.3,6],[30,10.2,6.7],[34.8,9.6,7],[36,8.4,6]],8);
 if(bare){
   for(const d of [-1,1]){
     const chest=[[d*.6,48,7.1],[d*6.6,47.6,7.2],[d*12.1,51.5,4.9],[d*11,54.4,5.6],[d*3,55.4,6.3],[d*.5,53.6,6.8]];
     panel(b,'skin',chest,[d*5.9,51.6,8.35]);
     panel(b,'skin',[[d*.65,47.1,7.0],[d*6,46.5,6.1],[d*4.4,40.3,6.2],[d*.8,40,6.35]],[d*2.8,44,7.4]);
   }
   b.rings('accent',[[33,9.8,6.9],[35.3,9.65,6.75]],8);return;
 }
 if(plate){
   b.rings('darkMetal',[[35,9.8,6.9],[38,10.8,7.6],[43,11.3,7.8],[49,14.2,8.5],[54,14.6,7.8],[57.8,10.8,6.6]],8);
   for(const d of [-1,1]){
     panel(b,'ivory',[[d*.45,54.3,8.2],[d*10.6,55.7,6.2],[d*14,52.6,4.5],[d*11,47.2,6.9],[d*5.7,43,8.4],[d*.4,46.6,8.8]],[d*6.5,51.1,10.1]);
     trim(b,'gold',[[d*12.6,51.8,5.8],[d*10.2,47,7.75],[d*5.6,43.3,9],[d*.6,46.7,9.4]],.78);
     b.beam('gold',[d*10,53,6],[d*9.2,57,5.8],1.7,1.35,5);
   }
   b.rings('gold',[[37,10.45,7.5],[38.2,11.15,7.94]],8);
   // A cloth mantle crosses the raised collar diagonally and gathers at one brooch.
   b.rings('ivory',[[54,11.5,7.65],[56.2,13.5,8.15],[59.3,9.4,6.7],[60.3,6.1,5.3]],8);
   panel(b,'linen',[[-16,57.9,5.5],[-12.1,60.1,4.4],[5,57.7,6.7],[15.4,55.8,5.3],[12,52.3,7.55],[-1,54.3,9.9]],[-3,56.6,10.2]);
   b.beam('gold',[-12,57.4,5.2],[-12,57.4,8.5],3.9,3.9,8);
   b.beam('ivory',[-12,57.4,8.45],[-12,57.4,9.3],2.6,2.3,6);
   panel(b,'gold',[[-1.7,52.8,10.1],[.6,53.6,10.3],[1.2,51.2,10.75],[.2,50.1,10.5],[2.1,48.5,10.3],[-.8,47.9,10.1],[-.7,50.5,10.65]],[-.1,51,10.85]);
 }else if(leather){
   b.rings('leather',[[35,9.9,7.1],[40,10,7.1],[50,13.6,8.15],[54,13.9,7.6],[57.3,9.4,6.2]],8);
   trim(b,'binding',[[-10.2,54.6,6],[-4,48.5,8.1],[4.5,41.7,7.6],[8.1,37.7,6.0]],1.9);
   for(const d of [-1,1])panel(b,'accent',[[d*2,52,7.9],[d*9.3,55,6.15],[d*12,50,5.4],[d*6,48.7,7.8]],[d*6.5,51.4,8.55]);
 }else{
   b.rings('robe',[[31,12,8.1],[37,9.6,6.9],[50,13.5,8],[55.2,13.3,7.5],[57.8,8.4,5.9]],8);
   for(const d of [-1,1])trim(b,'linen',[[d*6.4,57.5,6],[d*4,52,8.1],[d*1.5,47,8]],1.1);
 }
 const length=plate?20:leather?12:25;
 for(const d of [-1,1]){
   const skirt=[[d*.45,35.4,7.65],[d*9.1,34.7,5.95],[d*13.4,35-length*.72,6.85],[d*8.2,35-length,9.1],[d*1.9,35-length*.57,9.6]];
   panel(b,plate?'ivory':leather?'leather':'robe',skirt,[d*6.9,31-length*.31,10.2]);
   trim(b,plate?'gold':'binding',[skirt[2],skirt[3],skirt[4]],plate?.9:.7);
 }
 b.rings('binding',[[33.3,10.6,7.8],[36.6,10.25,7.5]],8);
 panel(b,'gold',[[-2.9,33.3,8],[2.9,33.3,8],[2.9,36.7,8],[-2.9,36.7,8]],[0,35,9.3]);
}
function head(b,look,headgear){
 const helm=headgear==='soldier_helm',hood=['hunter_hood','scholar_cowl'].includes(headgear);
 b.rings('skin',[[58.2,3.7,3.6],[62.5,4.5,4.1],[65,3.9,4]],7);
 // A jaw, tapered temples, cheekbones and crown with a flat brow plane.
 b.rings('skin',[[62.1,2.7,3.1,0,1.65],[63.6,5.05,5.4,0,.72],[66.6,6.2,6.2,0,.4],[70.1,7.1,6.8],[74.5,7.4,6.65],[77.5,6.1,5.95],[79.3,3.2,3.5]],8);
 if(helm){
   b.rings('darkMetal',[[63.7,6.7,6.6],[66,8.05,7.55],[73.4,8.3,7.65],[77.8,6.9,6.65],[81.3,3.4,4.4],[82.3,1.2,2]],8);
   b.rings('ivory',[[72.2,8.52,7.96],[74.5,8.6,8.25],[78.15,7.35,7.1],[80.5,5.45,5.85],[82.55,2.3,2.95],[83.05,.32,.52]],8);
   for(const d of [-1,1]){
     panel(b,'visor',[[d*.4,72.8,8.45],[d*6.8,72,5.12],[d*7.4,69.6,4.1],[d*.55,70,8.5]],[d*3.4,71.3,7.9]);
     panel(b,'ivory',[[d*.6,69.7,8.3],[d*7.2,69.6,4.65],[d*6,64.6,5.15],[d*1.2,62.3,6.6]],[d*2.8,66.8,8.3]);
     for(let j=0;j<3;j++)b.beam('visor',[d*(2+j*1.25),66.1,8-j*.53],[d*(2+j*1.25),68.2,8.15-j*.53],.35,.33,4);
   }
   trim(b,'gold',[[0,62.6,7.1],[0,70.3,9],[0,74.2,8.85],[0,80.3,4.8],[0,82.3,1.2]],.8);return;
 }
 for(const d of [-1,1]){
   b.rings('skin',[[66,1.1,1.25,d*6.58],[69.2,1.65,1.85,d*6.9],[71.1,1.05,1.36,d*6.83]],5);
   const z=6.69;
   panel(b,'sclera',[[d*1.14,69.7,z+.12],[d*4.82,69.7,z-.94],[d*4.5,71.2,z-.91],[d*1.36,71.22,z+.15]],[d*2.9,70.45,z+.32]);
   b.beam('eye',[d*2.63,70.4,z-.04],[d*2.63,70.4,z+.48],.87,.83,6);
   b.beam('hair',[d*1.15,72.05,z+.2],[d*4.75,72.75,z-1.06],.77,.55,5);
 }
 panel(b,'skin',[[-1.15,70.5,6.55],[1.15,70.5,6.55],[1.65,67.4,6.9],[0,66.9,7.38],[-1.55,67.4,6.9]],[0,67.95,8.55]);
 b.beam('lip',[-1.95,65.48,6.14],[1.95,65.48,6.14],.32,.28,4);
 if(look.beard==='short'||look.beard==='full'){
   const y=look.beard==='full'?59.9:62.6;
   panel(b,'hair',[[-5.7,67.6,4.2],[-3.3,65.55,5.9],[-1.4,65.1,6.7],[1.5,65.1,6.7],[3.55,65.5,5.9],[5.7,67.6,4.2],[4.6,63,5.2],[.8,y,6.0],[-3.7,62.1,5.5]],[0,63.9,7.4]);
 }
 if(hood){
   const cloth=headgear==='hunter_hood'?'accent':'robe';
   b.rings(cloth,[[73.8,8.25,7.65,0,-.5],[76.8,8,7.9,0,-.2],[80,5.6,5.95,0,-.8],[83,1.3,1.8,0,-2.4]],8);
   for(const d of [-1,1])b.rings(cloth,[[61.4,2.3,4,d*6.6,-2.4],[69.3,2.55,5,d*6.9,-1.75],[74.5,2.1,4.5,d*6.35,-1.05]],6);
   return;
 }
 if(look.style==='shaved')return;
 const sweep=[[73.1,7.45,7.4],[75.8,7.9,7.6],[78.5,6.8,6.6],[80.1,3.1,3.8],[80.45,.45,.72]];
 b.loft('hair',sweep.map(([y,rx,rz],j)=>Array.from({length:10},(_,i)=>{
   const a=Math.PI*.1+i*Math.PI*.2,side=Math.cos(a),front=Math.sin(a);
   const fringe=j===0?(front<0?front*4:front*(.65-side*1.1)):0;
   return [side*rx-j*.23,y+fringe,front*rz-.16];
 })));
 const lock=(x,y,z,w,h,flip=1)=>panel(b,'hair',[[x-w,y+1,z],[x+w*.55,y+1.65,z-.25],[x+w,y-.25,z+.25],[x-w*.34*flip,y-h,z+.85]],[x,y+.22,z+1.0]);
 lock(-4.5,74.8,5.65,2.5,2.7);lock(-1.85,74.7,6.98,2.45,2.15);lock(2.65,75.1,6.6,2.48,1.45,-1);
 for(const d of [-1,1]){
   lock(d*6.1,73.2,3.1,1.65,3.1);
   if(look.style==='long')b.rings('hair',[[58.8,2.4,2.5,d*6.9,-4.5],[64,3.7,4.4,d*7.3,-4.1],[75,3.5,4.5,d*5.6,-3.8]],6);
   if(look.style==='braids')for(let j=0;j<4;j++){const x=d*(7.25+j*.27),y=60+j*3.4;b.rings('hair',[[y-2.7,1.2,1.15,x,-2],[y,2.3,2.15,x,-2],[y+2.2,1.45,1.6,x,-2]],5);}
 }
}
function leg(b,kind,part,feet){
 const bare=kind==='body',plate=kind==='plate'&&(!feet||feet==='soldier_boots')||feet==='soldier_boots';
 if(part==='thigh'){
   b.rings('trouser',[[0,3.45,3.9],[.22,4.6,4.45],[.62,5.45,5.4],[.9,5.05,5.05],[1,4.15,4.1]],7);return;
 }
 if(part==='shin'){
   b.rings(bare?'skin':'boot',[[0,2.7,3.1],[.21,3.15,3.8],[.61,4.5,4.45],[.89,3.65,3.9],[1,3.6,3.6]],7);
   if(plate){
     b.rings('darkMetal',[[.15,3.25,3.85],[.56,4.58,4.6],[.84,4.08,4.25]],7);
     panel(b,'ivory',[[-3.37,.81,3.3],[0,1.12,3.6],[3.37,.81,3.3],[2.41,.39,3.7],[0,.1,3.65],[-2.4,.4,3.7]],[0,.7,5.2]);
     for(const d of [-1,1])panel(b,'gold',[[d*3.55,.81,3.1],[d*3.1,.83,3.55],[0,.14,3.95],[0,.08,3.63]],[d*1.9,.54,4.35]);
   }else if(!bare)b.rings('binding',[[.70,4.52,4.6],[.83,4.3,4.48]],7);
   return;
 }
 b.rings(bare?'skin':'boot',[[1,3.3,5.4,0,1.7],[2,4.15,7.15,0,2.85],[4.35,3.85,7.25,0,2.65],[6.4,2.85,4.1,0,.15]],7,Math.PI/2);
 if(bare||feet==='scholar_sandals'){
   for(let i=0;i<4;i++)b.rings('skin',[[1.3,.72,1.8,(i-1.5)*1.75,8.15],[2.6,.85,2.3,(i-1.5)*1.75,8.2],[3.25,.54,1.5,(i-1.5)*1.75,8.1]],5);
   if(!bare)b.rings('binding',[[3.5,3.65,2.3,0,5],[4.74,3.65,2.2,0,5]],6);
 }else if(plate){
   b.rings('darkMetal',[[1.1,4.1,7.3,0,3],[3.7,4.45,7.6,0,2.9],[5.1,3.7,6.45,0,2.3]],7);
   for(const z of [4.2,7.1])b.rings('gold',[[3.75,3.9,1.12,0,z],[5.17,3.1,.92,0,z]],6);
 }
}
function arm(b,kind,part,side){
 const plate=kind==='plate',bare=kind==='body',coat=kind==='cloth'?'robe':'leather';
 if(part==='upper'){
   b.rings(bare||kind==='leather'?'skin':plate?'under':coat,[[0,3.0,3.25],[.3,3.8,4.0],[.62,4.45,4.32],[.86,4.25,4.2],[1,3.75,3.7]],7);return;
 }
 if(part==='lower'){
   b.rings(bare||kind==='leather'?'skin':plate?'under':coat,[[0,2.3,2.55],[.2,2.9,2.75],[.68,3.72,3.62],[1,3.15,3.15]],7);
   if(!bare){
     b.rings(plate?'darkMetal':'binding',[[.08,2.9,2.95],[.33,3.72,3.7],[.78,4.15,4.0],[.89,3.75,3.8]],7);
     if(plate){
       panel(b,'ivory',[[-3,.77,2.4],[0,.98,3.2],[3,.77,2.4],[2.6,.33,3.1],[0,.13,3.1],[-2.6,.33,3.1]],[0,.63,4.9]);
       b.rings('gold',[[.10,2.95,3.14],[.19,3.35,3.5]],7);
     }
   }return;
 }
 if(part==='shoulder'){
   if(bare){b.rings('skin',[[-3.1,3.5,3.5],[0,5.1,4.7],[3.1,4.65,4.2],[4.85,2.6,2.7]],7);return;}
   const w=plate?(side<0?9.15:6.5):5.8;
   b.rings(plate?'darkMetal':coat,[[-4.9,w*.78,w*.77],[-3.6,w,w*.9],[-1,w*.96,w*.94],[1,w*.8,w*.77]],8);
   b.rings(plate?'gold':'binding',[[-2.5,w*1.03,w*.97],[-1.3,w*1.08,w]],8);
   b.rings(plate?'ivory':coat,[[-1.24,w*1.085,w],[1.8,w,w*.96],[4.05,w*.71,w*.72],[5.25,2.4,2.65]],8);
   if(plate&&side<0){
     b.rings('gold',[[-5.85,w*.95,w*.88],[-4.7,w*1.03,w*.95]],8);
     b.rings('darkMetal',[[-7.5,w*.81,w*.78],[-5.7,w*.94,w*.88]],8);
   }
   if(plate&&side<0)b.beam('gold',[-3,2.9,5.6],[-3,3.3,6.6],1.35,1.15,6);
   return;
 }
 const hand=bare||kind==='cloth'?'skin':plate?'under':'binding';
 b.rings(hand,[[-2.3,2.8,2.65],[.45,3.2,3],[2.45,2.65,2.6]],7);
 for(let i=0;i<4;i++){
   const z=(i-1.5)*1.44;const length=i===0?2.8:i===3?2.6:3.3;
   b.beam(hand,[side*1.7,.3,z],[side*2.45,-length*.6,z+.2],.94,.78,5);
   b.beam(hand,[side*2.45,-length*.6,z+.2],[side*1.15,-length,z+.42],.81,.62,5);
 }
 b.beam(hand,[-side*1.65,1.55,1.15],[-side*2.6,-.4,2.78],1.11,.8,6);
 if(plate)panel(b,'gold',[[side*2.95,.7,-1.75],[side*2.95,.7,1.75],[side*2.8,2.05,1.6]],[side*3.18,1.35,0]);
}
function shield(b){
 const rim=[[0,-16,0],[-8,-7,0],[-10,7,0],[-6,12,0],[3,13,0],[9,9,0],[8,-5,0]];
 panel(b,'gold',rim,[0,0,3.6]);panel(b,'darkMetal',rim.map(([x,y])=>[x*.89,y*.9,.7]),[0,0,4]);
 panel(b,'ivory',[[0,-12.2,1.5],[-4,-3,2.8],[-5.8,7.8,2.05],[0,9.6,2.75],[5.6,7.6,2.05],[3.9,-3,2.8]],[0,-.4,4.65]);
 trim(b,'gold',[[-3.1,1.9,4],[0,-1.7,5.1],[3.1,1.9,4]],.8);
 // Convex back with a raised hand strap.
 panel(b,'binding',rim.map(([x,y])=>[-x,y,-.35]),[0,0,-1.8]);
}
function draw(view,w){
 const s=w.state,R=window.BrukRealms,look=s.appearance||{},out=s.outfits||{};
 const bare=!!w.appearanceOnly,kind=bare?'body':s.armorKind||'plate';
 const yaw=Math.atan2(w.facing.x,w.facing.y),cs=Math.cos(yaw),sn=Math.sin(yaw);
 const gait=w.gait??(w.walking?1:0),time=w.time||0,idle=1-gait;
 const breath=Math.sin(time*1.5),glance=Math.sin(time*.47)*idle;
 const width=look.body==='slim'?.89:look.body==='broad'?1.13:1,unit=window.HoMoWScale.human;
 // The simulation cadence is fixed, so the legs beat a little faster than footstep counts to keep the stride inside the reach of the hip.
 const cadence=s.mounted?1:1.5,phase=(w.footstep||0)*cadence;
 const step=Math.cos(phase)*gait,lateral=Math.sin(phase)*gait,sway=lateral*.75+idle*Math.sin(time*.61)*.55,
   bank=Math.max(-1.5,Math.min(1.5,w.turnRate||0))*.13*gait;
 // Stance keeps the foot planted, so the pelvis rides at the height that striding leg can actually reach.
 const hipY=32,thigh=13.9,shin=13.6,slack=.35,bone=thigh+shin-slack,stance=.58;
 const pace=(w.dashTime>0?570:(s.extras&&R.moveSpeed?R.moveSpeed(s):178))*(w.slowTime>0?.6:1);
 const stride=s.mounted?0:Math.min(pace*stance*Math.PI/(13*cadence*unit),16)*gait;
 const cycle=[-1,1].map(d=>{const t=((phase+(d<0?Math.PI:0))%(Math.PI*2)+Math.PI*2)%(Math.PI*2)/(Math.PI*2),
   swing=t>=stance,progress=swing?(t-stance)/(1-stance):t/stance;
   return {d,swing,progress,fore:(swing?-Math.cos(progress*Math.PI):1-2*progress)*stride,
     lift:swing?Math.pow(Math.sin(progress*Math.PI),1.5)*7*gait:0,
     tilt:s.mounted?0:gait*(swing?-.20*Math.sin(progress*Math.PI):progress<.15?-.12*(1-progress/.15):progress>.82?.18*(progress-.82)/.18:0)};});
 const plant=n=>{const heel=5.2*Math.cos(n.tilt)+.65*Math.sin(n.tilt),toe=5.2*Math.sin(n.tilt)-.65*Math.cos(n.tilt),
   dx=n.d*1.15*width+sway*.18,dz=n.d*1.8+.55+n.fore+toe;
   return n.lift+heel-hipY+Math.sqrt(Math.max(16,bone*bone-dx*dx-dz*dz));};
 const support=cycle.filter(n=>!n.swing).map(plant);
 const bob=s.mounted?idle*breath*.3:(support.reduce((a,b)=>a+b,0)/(support.length||1))+idle*breath*.34;
 const pick=(type,key,fallback)=>(R.APPEARANCE[type][key]||fallback).slice(1);
 const palette={skin:({light:'e5b8a2',warm:'d6a18a',bronze:'ab7960',dark:'77503e'})[look.skin]||'dcb197',hair:pick('hair',look.hair,'#513b32'),accent:pick('accent',look.accent,'#77826e'),
   ivory:w.hurt>0?'d99f92':'f0e5cf',linen:'fff1d9',gold:'d7ae6b',darkMetal:'494855',visor:'272633',under:'383941',trouser:'4d4853',boot:'58473e',
   robe:'796d87',binding:'745641',leather:'a77b55',sclera:'f8e8ce',eye:'34342f',lip:'875f50',flame:'f4bc73',page:'eadcc3'};
 const at=([x,y,z])=>[s.x+(x*cs+z*sn)*unit,(y+bob)*unit,s.y+(-x*sn+z*cs)*unit];
 const place=(parts,offset,scale=[1,1,1],turn=0,pitch=0,lean=0,colors=palette)=>{
   const [x,y,z]=at(offset);
   for(const {mesh,slot} of parts)view.draw(mesh,x,y,z,scale[0]*unit,scale[1]*unit,scale[2]*unit,colors[slot],yaw+turn,null,pitch,lean);
 };
 const figure=(name,make,p,scale,turn,pitch,lean)=>place(solid(name,make),p,scale,turn,pitch,lean);
 const limb=(name,make,low,high)=>{
   const dx=high[0]-low[0],dy=high[1]-low[1],dz=high[2]-low[2],l=Math.hypot(dx,dy,dz);
   figure(name,make,low,[1,l,1],0,Math.atan2(dz,dy),Math.asin(dx/l));
 };
 if(!s.mounted&&view.opt?.shadows!==false)view.draw('orb',s.x,.2,s.y,21*unit,1,13.5*unit,'5a614e');
 const torsoKey='torso/'+kind;
 figure(torsoKey,b=>torso(b,kind),[sway*.22,0,0],[width,1+idle*breath*.016,1],step*.065,gait*.065,bank);
 const headgear=bare?'':out.head||'',headKey=['head',headgear,look.style||'short',look.beard||'none'].join('/');
 figure(headKey,b=>head(b,look,headgear),[sway*.3,breath*idle*.18,0],[1,1,1],-step*.04+glance*.17,Math.sin(time*.8)*idle*.05,bank*.5);
 if(!bare&&out.cloak){
   const cape=out.cloak;
   figure(cape,b=>{
     const color=cape==='guardian_cape'?'ivory':cape==='sage_cape'?'robe':'accent';
     b.rings(color,[[20,13.1,1.6,0,-11.1],[30,14,1.8,0,-10.4],[47,12.8,2.0,0,-8.4],[56.5,8,2.5,0,-5.7]],6);
     b.rings('gold',[[20,13.2,1.72,0,-11.1],[21.6,13.35,1.8,0,-11]],6);
   },[sway*.42,0,-Math.abs(step)*1.4-lateral*1.1+idle*Math.sin(time*1.7)*.55],[1,1,1],-step*.05,0,bank*1.4);
 }
 const feet=bare?'':out.feet||'';
 for(const n of cycle){
   const d=n.d,hip=[d*6.8*width,30.6,-.55];
   const foot=s.mounted?[d*19,4.5,-3]:[d*7.95*width+sway*.18,n.lift-bob,d*1.8+n.fore];
   const ankle=[foot[0],foot[1]+5.2*Math.cos(n.tilt)+.65*Math.sin(n.tilt),foot[2]+5.2*Math.sin(n.tilt)-.65*Math.cos(n.tilt)];
   const delta=ankle.map((v,i)=>v-hip[i]),wanted=Math.hypot(...delta)||1e-4,axis=delta.map(v=>v/wanted);
   const short=Math.min(wanted,bone),along=(thigh*thigh-shin*shin+short*short)/(2*short);
   const bend=Math.sqrt(Math.max(0,thigh*thigh-along*along));
   const forward=[-axis[0]*axis[2],-axis[1]*axis[2],1-axis[2]*axis[2]],flen=Math.hypot(...forward)||1e-4;
   const knee=s.mounted?[d*20,20,9]:hip.map((v,i)=>v+axis[i]*along+forward[i]/flen*bend);
   const joint=s.mounted?ankle:hip.map((v,i)=>v+axis[i]*short),sole=foot.map((v,i)=>v+joint[i]-ankle[i]);
   const key='leg/'+kind+'/'+feet+'/';
   limb(key+'thigh',b=>leg(b,kind,'thigh',feet),knee,hip);
   limb(key+'shin',b=>leg(b,kind,'shin',feet),joint,knee);
   figure(key+'foot',b=>leg(b,kind,'foot',feet),sole,[1,1,1],d*.13,n.tilt);
 }
 const family=s.weaponKind||'sword',id=R.VARIANTS[s.weaponVariant]?s.weaponVariant:R.DEFAULT_VARIANTS[family]||'sword_broadsword';
 const paired=['sword_dual','daggers_pair','daggers_claws'].includes(id);
 const two=!bare&&!!w.twoHanded,progress=w.swing>0?Math.min(1,Math.max(0,1-w.swing/.25)):0,strike=Math.sin(progress*Math.PI);
 const model=window.HoMoWArmory.get(id,s.variantArsenal?.[id]??s.arsenal?.[family]??0);
 const weaponScale=window.HoMoWScale.weapon[id]||1,heldUnit=weaponScale*unit;
 let pitch=(family==='spear'?.46:family==='sword'?.25:family==='daggers'?.40:.15)+strike*(family==='staff'?.35:.96);
 let lean=(family==='spear'?.33:family==='staff'?.25:.49)+(two?.12:0);
 let turn=(family==='bow'?0:.10)+Math.sin(progress*2*Math.PI)*(family==='axe'?.98:.51);
 let right=[(two&&!paired?6.5:18.2)*width,33.2+strike*4+breath*idle*.22,10.2+strike*7+glance*.5];
 let left=[-18.1*width+sway*.5,32.8+breath*idle*.3,7];
 const transformed=(p,axis,local,mirror=1)=>{
   const v=F.point(axis,mirror*local[0]*weaponScale,local[1]*weaponScale,local[2]*weaponScale);
   return p.map((n,i)=>n+v[i]);
 };
 if(family==='spear'){right[2]+=strike*10;lean*=1-strike*.66;pitch+=strike*.35;}
 if(family==='axe'){right[1]+=Math.sin(progress*2*Math.PI)*4;lean+=.24*strike;}
 if(family==='daggers'){right[2]+=strike*5;turn+=strike*.22;}
 if(bare){right=[18.4*width,31.4,3];left=[-18.2*width,31.2,3.5];}
 else if(family==='bow'){
   pitch=id==='bow_crossbow'?-.20:-.08;lean=id==='bow_crossbow'?.05:-.35;turn=id==='bow_crossbow'?-.44*(1-strike):-1.12*(1-strike);
   if(id==='bow_crossbow'){
     right=[8,36,9];left=transformed(right,F.basis(turn,pitch,lean),[0,1,12]);
   }else{
     left=[-7,38.5,21+strike*2];right=transformed(left,F.basis(turn,pitch,lean),[0,0,id==='bow_warbow'?-18:-13]);
   }
 }else if(two&&!paired){left=transformed(right,F.basis(turn,pitch,lean),[0,family==='sword'?-8:10,0]);}
 else if(paired)left=[-18*width,33,10.4+strike*4];
 // Arms hang from the shoulder instead of sliding: the hand trails the opposite leg and the elbow only bends forward.
 const pivot=([x,y,z],[ox,oy,oz],a,b)=>{const ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b),
   dy=y-oy,dz=z-oz,rx=x-ox,ry=dy*ca-dz*sa,rz=dy*sa+dz*ca;
   return[ox+rx*cb+rz*sb,oy+ry,oz-rx*sb+rz*cb];};
 const armPhase=two&&!paired?1:0,ease=1-strike*.8,reachScale=two||family==='bow'||paired?.3:1;
 for(const side of [-1,1]){
   const phase=armPhase?step:side*step,shoulder=[side*14.0*width,53.6,-side*step*.85],
     turnZ=side*phase*.30*gait*ease*reachScale*(s.mounted?.35:1),
     flex=-(.05+.34*Math.max(0,-phase))*(1-idle*.6)*gait*reachScale;
   let hand=side>0?right:left;
   let elbow=[side*(17.8*width+Math.min(3,Math.abs(hand[0])*.11)),42.4+strike*1.6,hand[2]*.32-2.3];
   elbow=pivot(elbow,shoulder,0,turnZ);
   hand=pivot(pivot(hand,shoulder,0,turnZ*.85),elbow,flex,0);
   if(side>0)right=hand;else left=hand;
   const key='arm/'+kind+'/';
   limb(key+'upper',b=>arm(b,kind,'upper',side),elbow,shoulder);
   limb(key+'lower',b=>arm(b,kind,'lower',side),hand,elbow);
   figure(key+'cap'+side,b=>arm(b,kind,'shoulder',side),shoulder);
   figure(key+'hand'+side,b=>arm(b,kind,'hand',side),hand,[1,1,1],side*.2);
 }
 if(bare)return;
 if(!two&&!paired){
   if((s.supportKind||'shield')==='shield')figure('kite shield',shield,[left[0]-3,left[1]+4,left[2]+2.8],[1,1,1],-.94);
   if(s.supportKind==='focus')figure('folio',b=>{
     b.rings('binding',[[-6,5.5,3],[7,5.5,3]],4,Math.PI/4);b.rings('page',[[-5.1,5.4,3.4],[6,5.4,3.4]],4,Math.PI/4);
     panel(b,'robe',[[-4.3,-5.7,2.6],[4.3,-5.7,2.6],[4.3,6.7,2.6],[-4.3,6.7,2.6]],[0,.5,3]);trim(b,'gold',[[-2,1,3.2],[0,-1.8,3.3],[2,1,3.2],[0,3.9,3.3],[-2,1,3.2]],.55);
   },left,[1,1,1],-.3,.2,-.24);
   if(s.supportKind==='torch')figure('torch',b=>{
     b.beam('binding',[0,-5,0],[0,12,0],1.65,2.05);b.rings('gold',[[10,2.45,2.45],[15,3.45,3.45]],6);b.rings('flame',[[14,2.9,2.9],[18,3.65,3.2],[25,.1,.1,1.2,0]],6);
   },left,[1,1,1],0,.1,-.13);
 }
 const enchant=s.enchantments?.['variant:'+id]||0;
 function held(hand,mirror){
   const axis=F.basis(turn*mirror,pitch,lean*mirror),[x,y,z]=at(hand);
   for(const {mesh,slot} of model.parts){
     const material=slot==='wood'?'wood':slot==='grip'?'leather':slot==='gem'?'rune':null;
     view.draw(mesh,x,y,z,mirror*heldUnit,heldUnit,heldUnit,model.colors[slot],yaw+turn*mirror,material,pitch,lean*mirror);
   }
   if(enchant&&!view.maskPass){
     const socket=model.tip;
     window.HoMoWBeta3D.enchantEffect(enchant,time,(dx,dy,dz,sx,sy,sz,ink,shape,twist)=>{
       const pos=at(transformed(hand,axis,[socket[0]+dx*.74,socket[1]+(dz-9)*.77,socket[2]+dy*.68],mirror));
       if(shape==='cube'){
         const d=F.point(axis,Math.sin(twist)*.74*mirror,Math.cos(twist)*.77,0),length=Math.hypot(...d);
         view.draw(shape,...pos,sx*.77*heldUnit,sy*.77*heldUnit,sz*length*heldUnit,ink,yaw+Math.atan2(d[0],d[2]),null,-Math.asin(d[1]/length),0);
       }else view.draw(shape,...pos,sx*.82*heldUnit,sy*.82*heldUnit,sz*.82*heldUnit,ink,yaw+turn*mirror,null,pitch,lean*mirror);
     });
   }
 }
 if(paired)held(left,-1);
 held(family==='bow'&&id!=='bow_crossbow'?left:right,1);
}
window.HoMoWAvatar={draw};
})();
