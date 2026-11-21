/* Original equipment silhouettes. Coordinates are in the wielder's hand space, Y up. */
(()=>{'use strict';
const F=window.HoMoWForms,catalog=new Map();
const finish=['bbb6c4','c0b6d6','cac0df','c9b8ed','c6b5ed','d2bef1','d2c0eb','d9c5e8','dfcbd9','e5ccae','e9d5b9','efe1ce','f4e9d9'];
function authored(id,t){
 const key=id+'/'+t;
 if(catalog.has(key))return catalog.get(key);
 const stage=Math.floor(t/3),growth=1+t*.011,trim=stage>=2?'gold':'fitting';
 let tip=[0,40,0];
 const parts=F.model('armory/'+key,b=>{
   // Apply tier growth along the blade, keeping the grip and both hand sockets stationary.
   const blade=(rows,slot='steel',edge='edge')=>b.blade(slot,rows.map(([y,...rest])=>[y>9?9+(y-9)*growth:y,...rest]),edge);
   const band=(y,h,r,slot='fitting',x=0,z=0)=>b.rings(slot,[[y-h/2,r*.84,r*.84,x,z],[y-h*.26,r,r,x,z],[y+h*.28,r,r,x,z],[y+h/2,r*.85,r*.85,x,z]],6);
   const rod=(from,to,r,slot='wood')=>b.beam(slot,[0,from,0],[0,to,0],r*.83,r,8);
   const jewel=(x,y,z,h,r,slot='gem')=>b.rings(slot,[[y-h*.53,0,0,x,z],[y-h*.12,r,r*.84,x,z],[y+h*.19,r*.79,r*.68,x,z],[y+h*.55,0,0,x+r*.13,z]],6);
   const grip=(from,to,r=2.55)=>{
     rod(from,to,r,'grip');
     for(let i=1;i<5;i++){const y=from+(to-from)*i/5;band(y,.58+t*.018,r*1.01,'binding');}
     band(from,1.6,r*1.16,trim);band(to,1.7,r*1.24,trim);
   };
   const pommel=(y,r)=>{band(y+1.5,2,r*.71,trim);jewel(0,y-1,0,r*2.2,r,t>=3?'edge':'fitting');};
   const quillon=(y,span,rise,hook=0)=>{
     for(const side of [-1,1]){
       const x=side*span;
       b.beam(trim,[0,y,0],[x*.66,y+rise*.45,0],2.5,1.85,5);
       b.beam(trim,[x*.63,y+rise*.43,0],[x,y+rise,0],2,1.25,5);
       if(hook||t>=6)b.beam('edge',[x,y+rise,0],[x-side*(1+stage*.52),y+rise+hook+stage*.58,0],1.6,.12,4);
     }
   };
   const spine=(from,to,width,z)=>{
     blade([[from,-width*.15,width*.15,.38,z],[from+3,-width,width,.44,z],[to,0,0,.2,z]],'gold','gold');
   };
   const socket=(y,r)=>{band(y-2.4,3.2,r*.86,trim);band(y,2.3,r,'edge');};
   const shaft=(from,to,r)=>{
     rod(from,to,r);grip(-6,6,r*1.14);pommel(from,r*1.36);band(to-3,2.6,r*1.38,trim);
     for(let i=1;i<=stage;i++)band(to-i*3.5,1.1,r*(1.42-i*.05),'gold');
   };
   const langet=(y,size)=>blade([[y-size,0,0,.25,2.1],[y-2,-2.2,2.2,1.1,1.9],[y,-2,2,1.1,1.9]],trim,trim);
   const crown=(x,y,z,span,h)=>{
     for(const side of [-1,1]){
       b.beam(trim,[x,y,z],[x+side*span,y+h*.52,z],2.1,1.65,5);
       b.beam('edge',[x+side*span,y+h*.52,z],[x+side*span*.67,y+h,z],1.75,.24,5);
     }
   };
   switch(id){
   case 'sword_broadsword':{
     grip(-7,6);pommel(-8,3.3);quillon(7,8.2+stage,.4+stage*.48);
     const w=4.15+t*.105;
     blade([[8,-w,w,1.65],[13,-w,w,1.75],[16,-w*.86,w*.86,1.45],[44,-w*.70,w*.70,1.25],[51,0,0,0]]);
     if(t>=3){spine(10,23+stage*3,1.12,1.7);jewel(0,8,2,4.5,2.1);}
     tip=[0,41*growth,0];break;
   }
   case 'sword_claymore':{
     grip(-11,8,2.65);pommel(-12,3.8);quillon(10,10.4+stage*1.1,3.4+stage*.8,2);
     const w=5+t*.13;
     // Twin ricasso rails surround a real opening, with a solid diamond-section blade above.
     for(const d of [-1,1]){
       const x=d*w*.64;
       blade([[10,x-1.8,x+1.8,1.65],[16,x-1.8,x+1.8,1.4],[21+stage,x-1.35,x+1.35,1.2]]);
     }
     blade([[19+stage,-w*.81,w*.81,1.9],[24+stage,-w,w,2.1],[47,-w*.79,w*.79,1.72],[56,-w*.49,w*.49,1.15],[62,0,0,0]]);
     if(t>=3)spine(22+stage,42+stage*2,1.35,1.94);
     jewel(0,10,2,5.8,2.55,stage>=3?'gem':'fitting');tip=[0,51*growth,0];break;
   }
   case 'sword_dual':{
     grip(-6,5,2.15);pommel(-7,2.7);
     blade([[6,-3,3,1.45],[12,-3.7,3.4,1.5],[27,-2.8,5.3,1.34],[37,.5,7,1.1],[46,8.4,8.4,0]]);
     b.beam(trim,[-6.6,9,0],[2,6,0],1.12,2.3,5);b.beam(trim,[2,6,0],[6.2,4,0],2.3,1.32,5);
     b.beam(trim,[6.2,4,0],[5,-3.8,0],1.35,.8,5);b.beam(trim,[5,-3.8,0],[1,-7,0],.84,1.3,5);
     if(t>=3)blade([[10,-1,1.8,.4,1.4],[26,1.9,3.2,.45,1.3],[39,6.2,6.2,.1,1]],'gold','gold');
     tip=[4,36*growth,0];break;
   }
   case 'axe_battleaxe':{
     shaft(-13,32,2.45);socket(32,3.7);
     blade([[19,13,13,0],[23,8.8,15.4,1.52],[29,1,17.3+stage,2.65],[34,-3.8,16.4+stage,2.85],[38,-3,10.9,2],[41,9,9,0]]);
     if(t>=3){langet(33,6+stage);blade([[27,13,14,.45,1.8],[32,3,13,.55,2.65],[34,2,4,.35,2.6]],'gold','gold');}
     tip=[11,30*growth,0];break;
   }
   case 'axe_greataxe':{
     shaft(-18,36,2.85);socket(37,4);
     const w=16+stage*.9;
     for(const side of [-1,1]){
       const rows=[[22,w*.94,w*.94,0],[27,w*.52,w*1.08,2.1],[32,4,w*1.14,2.7],[38,1,w,3.25],[42,6,w*.89,2.55],[46,w*.76,w*.76,0]];
       blade(rows.map(([y,l,r,d])=>[y,side>0?l:-r,side>0?r:-l,d]));
       if(stage>=2)b.beam('gold',[side*2,36*growth,3],[side*w*.8,32*growth,2.5],1.35,.3,4);
     }
     jewel(0,39*growth,0,7+stage,3.7,'gem');tip=[0,36*growth,0];break;
   }
   case 'axe_halberd':{
     shaft(-22,43,2.4);socket(42,3.5);
     blade([[27,12.6,12.6,0],[31,8.3,15,1.6],[39,1,15.8+stage,2.6],[43,1,10.6,2.3],[48,7,7,0]]);
     blade([[39,-3.2,1.2,2.8],[42,-9,1.2,2.7],[46,-14-stage,-10,.8],[47,-14.5-stage,-14.5-stage,0]],'fitting','edge');
     blade([[42,-3,3,1.7],[48,-2.7,2.7,1.65],[62,0,0,0]]);
     langet(42,7+stage);if(t>=5)jewel(0,43*growth,2.2,5.4,2.1);tip=[2,45*growth,0];break;
   }
   case 'spear_spear':{
     shaft(-27,36,2.15);socket(36,3.15);
     blade([[36,-1.8,1.8,1.1],[41,-5.2-stage*.33,5.2+stage*.33,2],[47,-4.45,4.45,1.76],[59,0,0,0]]);
     if(t>=3){langet(37,5+stage);spine(39,48+stage,1,1.84);}
     tip=[0,48*growth,0];break;
   }
   case 'spear_pike':{
     shaft(-33,52,1.97);socket(50,2.95);
     blade([[50,-3.3,3.3,1.8],[56,-2.65,2.65,1.5],[73,0,0,0]]);
     for(const side of [-1,1])b.beam(trim,[0,50*growth,0],[side*(5+stage*.7),(45-stage)*growth,0],1.65,.22,4);
     if(t>=4)spine(52,63+stage,.85,1.64);tip=[0,61*growth,0];break;
   }
   case 'spear_glaive':{
     shaft(-24,33,2.3);socket(33,3.35);
     blade([[32,-1.9,2.4,1.65],[38,-3.5,4.4,1.8],[47,-2.5,8.5+stage*.55,2.1],[55,2,10+stage*.55,1.7],[65,11.4+stage*.55,11.4+stage*.55,0]]);
     blade([[31,-8,-8,0],[34,-8,-2,1.2],[37,-4.4,1,1.65],[39,-1,1,1]]);
     if(t>=3)blade([[37,-.6,1,.3,1.74],[48,2.3,4.5,.4,2.0],[59,8,8,.2,1.2]],'gold','gold');
     tip=[6,52*growth,0];break;
   }
   case 'daggers_dagger':{
     grip(-6,4,2.25);pommel(-7,2.65);quillon(4.8,6.3+stage*.5,1.7);
     blade([[5,-2.9,3.3,1.62],[9,-3.8,4.6,1.8],[14,-2.1,3.4,1.4],[22,-1.2,2.5,1.2],[32,1.8,1.8,0]]);
     if(t>=3)spine(7,19+stage,.88,1.6);tip=[1,24*growth,0];break;
   }
   case 'daggers_pair':{
     grip(-5.7,4,2.15);pommel(-6.5,2.65);
     blade([[4,-2,3.5,1.55],[10,-3.8,4.3,1.65],[17,-3.2,6.6,1.56],[23,0,9.5+stage*.4,1.33],[26,7,11+stage*.5,1],[28,15+stage*.5,15+stage*.5,0]]);
     b.beam(trim,[-6,8,0],[3,4,0],.42,2.05,5);b.beam(trim,[2,4,0],[6,1,0],2,.6,5);
     if(t>=3)jewel(0,5.5,1.8,4,1.65);tip=[6,21*growth,0];break;
   }
   case 'daggers_claws':{
     // Three separately forged talons grow from a knuckle plate, leaving daylight between the tines.
     b.rings('binding',[[-5,4.4,3.4],[0,5.25,3.65],[4,6.3,3]],7);
     blade([[2,-7,6.9,2.4],[5,-8.9,8.9,2.6],[7,-8.1,8.2,1.65]],'fitting');
     for(const finger of [-1,0,1]){
       const x=finger*6.25,h=24+(finger===0?4:0)+stage*.55;
       blade([[5,x-1.65,x+1.65,1.5],[12,x-1.4+finger,x+1.6+finger,1.3],[h-4,x+finger-.8,x+finger+1,1.1,3],[h,x+finger+.8,x+finger+.8,0,5.9]]);
     }
     if(t>=3)jewel(0,4.8,2.8,4.4,2);tip=[0,21*growth,2];break;
   }
   case 'bow_longbow':
   case 'bow_warbow':{
     const war=id==='bow_warbow',h=(war?37:34)*growth,back=war?-17:-12;
     grip(-4,4,2.25);
     for(const d of [-1,1]){
       const joints=war?[[0,3*d,0],[0,h*.32*d,2],[0,h*.6*d,-2],[0,h*.81*d,-12],[0,h*d,back],[0,(h+2)*d,back+4]]:
         [[0,3*d,0],[0,h*.37*d,1.6],[0,h*.7*d,-3],[0,h*d,back]];
       const radii=war?[2.9,3.8,3.2,2.1,1.6,.9]:[2.25,2.55,1.8,.95];
       for(let i=1;i<joints.length;i++)b.beam(war&&i===2?'steel':'wood',joints[i-1],joints[i],radii[i-1],radii[i],6);
       b.beam('cord',[0,h*d,back],[0,0,back-1],.46,.5,5);
       if(war){
         b.beam(trim,[0,h*.27*d,0],[0,h*.57*d,6+stage],1.75,1.2,5);
         b.beam('edge',[0,h*.57*d,6+stage],[0,h*.76*d,-7],1.25,.5,5);
       }
       if(t>=3)jewel(0,h*(war?.6:.72)*d,war?-2:-3,3.6+stage,2.1,'gold');
     }
     b.beam('binding',[0,0,back-2],[0,0,23],.62,.66,5);
     b.beam('edge',[0,0,21],[0,0,27],2.55,0,4);tip=[0,0,21];break;
   }
   case 'bow_crossbow':{
     // A stepped stock, transverse prod, two strings and a bolt on its own rail.
     b.beam('wood',[0,-2,-18],[0,1,16],3.8,2.9,6);b.beam('grip',[0,-7,-2],[0,1,2],2.1,2.5,5);
     b.beam('fitting',[0,3,-13],[0,3.2,19],1.55,1.45,5);
     for(const d of [-1,1]){
       b.beam('steel',[0,1,14],[d*14*growth,1.6,11],3.15,2.2,5);
       b.beam('edge',[d*14*growth,1.6,11],[d*23*growth,1.8,1],2.2,1.05,5);
       b.beam('cord',[d*23*growth,1.8,1],[0,3.5,-8],.5,.5,5);
       if(stage>=2)b.beam('gold',[d*3,1.6,14],[d*14*growth,1.8,15],1.2,.35,5);
     }
     b.beam('wood',[0,4.3,-10],[0,4.3,23],.71,.7);b.beam('edge',[0,4.3,20],[0,4.3,28],2.8,0,4);
     b.beam(trim,[0,-2,16],[0,-2,21],2.9,2.3,4);tip=[0,4.3,21];break;
   }
   case 'staff_fire':{
     shaft(-26,30,2.25);socket(30,3.4);
     b.rings(trim,[[29,2.9,2.9],[33,4.1,3.7],[36,3,2.9]],6);
     const y=39*growth;jewel(0,y,0,18+stage*1.2,6+stage*.44);crown(0,30,0,6.5+stage*.55,12+stage*.8);
     if(t>=3)jewel(0,y,4.2,8,2.6,'core');tip=[0,y,0];break;
   }
   case 'staff_greatfire':{
     shaft(-28,29,2.72);socket(29,4.1);const y=42*growth,rad=8+stage*.68;
     jewel(0,y,0,23+stage*1.45,rad,'core');
     for(let i=0;i<5;i++){
       const a=i*Math.PI*2/5,x=Math.sin(a),z=Math.cos(a);
       b.beam(trim,[x*2.6,31,z*2.6],[x*(rad+1),y-1.5,z*(rad+1)],2.05,1.8,5);
       b.beam('edge',[x*(rad+1),y-1.5,z*(rad+1)],[x*3.4,y+9.2+stage*.5,z*3.4],1.8,.55,4);
     }
     jewel(0,y+10.7,0,6+stage,2.9,'gem');tip=[0,y,0];break;
   }
   case 'staff_frost':{
     shaft(-27,30,2.32);socket(30,3.7);
     const y=42*growth;
     jewel(0,y,0,24+stage*1.3,5+stage*.26,'gem');
     for(const d of [-1,1]){
       const x=d*(7+stage*.53);
       blade([[31,-1,1,1.4],[36,Math.min(x,0)-2,Math.max(x,0)+2,2],[42,x-3,x+3,2.85],[49+stage,x+d*2,x+d*2,0]],'core','edge');
     }
     if(stage>=2)crown(0,30,2,9.7+stage,11);tip=[0,y,0];break;
   }
   default:throw Error('Unknown armory model '+id);
   }
   // Higher forge tiers build outward from each original profile.
   if(stage>=2){
     const reach=stage-1;
     if(id==='sword_broadsword'||id==='sword_claymore'){
       const y=id==='sword_claymore'?10:7,span=id==='sword_claymore'?10.4:8.2;
       for(const side of [-1,1]){
         const wing=[[y-1,2.1,3.8,1.05],[y+2,4,span+1.8,1.5],[y+5,span-.4,span+3.1+reach,.86],[y+7+reach,span+3.35+reach,span+3.35+reach,0]];
         blade(wing.map(([h,l,r,d])=>[h,side>0?l:-r,side>0?r:-l,d]),'gold','edge');
       }
       if(stage>=3){
         const y0=id==='sword_claymore'?22+stage:11,w=id==='sword_claymore'?6:4.7;
         for(const d of [-1,1]){
           b.beam('gold',[0,y0*growth,2.05],[d*w*.8,(y0+4)*growth,1.74],1.1,.85,4);
           b.beam('gold',[d*w*.8,(y0+4)*growth,1.74],[d*w*.46,(y0+11+stage)*growth,1.6],.85,.13,4);
         }
         jewel(0,y0*growth,2.7,5.2,2.25,stage===4?'core':'gem');
       }
     }else if(id==='sword_dual'||id==='daggers_dagger'||id==='daggers_pair'){
       const side=id==='daggers_pair'?-1:1,h=id==='sword_dual'?11:7.5;
       b.beam('gold',[side*1.2,-6.2,0],[side*(6+reach),-2.4,0],1.1,1.45,5);
       b.beam('edge',[side*(6+reach),-2.4,0],[side*(7.2+reach),h,0],1.5,.32,4);
       if(stage>=3){blade([[4,-3.5,3.6,1.95],[8,-4.4,3.4,2.05],[13,-2,1.2,1.75]],'gold','edge');jewel(-.25,7,2.5,4.2,1.85);}
     }else if(id.startsWith('axe_')){
       const h=id==='axe_halberd'?41:id==='axe_greataxe'?36:31;
       if(id==='axe_greataxe'){
         for(const side of [-1,1]){
           b.beam('gold',[0,(h+1)*growth,3],[side*11,(h+3)*growth,2.9],1.5,1,5);
           b.beam('gold',[side*11,(h+3)*growth,2.9],[side*17,(h+9)*growth,1.5],1,.30,5);
         }
         if(stage>=3)blade([[h,-3.5,3.5,1.9],[h+7,-4.2,4.2,2.5],[h+13+stage,0,0,0]],'gold','edge');
       }else{
         blade([[h-4,-3.7,1,2.0],[h-1,-8-reach,-1,2.7],[h+1,-9-reach,1.8,2.45],[h+4,-7-reach,-3,1.65]],'fitting','edge');
         if(stage>=3){
           blade([[h+1,-5.6,1.4,2.4],[h+4,-8,-2,1.6],[h+9+reach,-10-reach,-10-reach,0]],'gold','edge');
           jewel(1,(h+1)*growth,3.3,5.1,2.35);
         }
       }
     }else if(id.startsWith('spear_')){
       const h=id==='spear_spear'?37:id==='spear_pike'?51:34;
       for(const side of (id==='spear_glaive'?[-1]:[-1,1])){
         const wing=[[h-4,1.5,2.4,1.2],[h,2.2,5.3+reach,1.7],[h+4,5.5,7.4+reach,1],[h+8+reach,7.8+reach,7.8+reach,0]];
         blade(wing.map(([y,l,r,d])=>[y,side>0?l:-r,side>0?r:-l,d]),stage>=3?'gold':'fitting','edge');
       }
       if(stage>=3){jewel(0,h*growth,2.8,5.2,2.2);langet(h-1,10+reach);}
     }else if(id==='daggers_claws'){
       blade([[-8,-1,1,1.7],[-4,-5.3,5.3,3.7],[0,-6.1,6.1,4.2],[4,-4.6,4.6,3.1]],'steel','edge');
       for(let finger=-1;finger<=1;finger++)b.beam('gold',[finger*3.6,-2,3.05],[finger*6.2,7,2.05],.9,.55,5);
       if(stage>=3)jewel(0,1,4.5,5.8,2.15);
     }else if(id==='bow_crossbow'){
       for(const d of [-1,1]){
         b.beam('gold',[d*2.2,-2,18],[d*(4.5+reach),-2,23],1.05,1.05,5);
         b.beam('gold',[d*(4.5+reach),-2,23],[0,-2,26],1.05,.95,5);
         if(stage>=3)b.beam('edge',[d*11*growth,2.4,13],[d*17*growth,2.5,16+reach],1.7,.25,4);
       }
     }else if(id.startsWith('bow_')){
       const war=id==='bow_warbow',h=(war?37:34)*growth;
       for(const d of [-1,1]){
         b.beam('edge',[0,h*.7*d,war?-6:-3],[0,h*.86*d,war?-13.5:-7.5],2.45,1.64,6);
         if(stage>=3){
           b.beam('gold',[0,h*.4*d,1],[0,h*.63*d,6+reach],1.45,1.2,5);
           b.beam('edge',[0,h*.63*d,6+reach],[0,h*.82*d,-6],1.28,.28,5);
         }
       }
     }else if(id.startsWith('staff_')){
       const y=tip[1],wide=id==='staff_greatfire'?12:id==='staff_frost'?10:8.6;
       for(const d of [-1,1]){
         b.beam('gold',[0,29.5,0],[d*wide,y-2,0],2.25,1.75,5);
         if(stage>=3)jewel(d*wide,y+1,0,9+reach,2.75,'edge');
       }
       if(stage===4){jewel(0,21,2.7,6.5,2.3,'core');band(22.8,2.3,3.75,'gold');}
     }
   }
 });
 const colors={
   steel:finish[t],edge:stage>=3?'fff3de':'efe8ff',fitting:stage>=2?'a98769':'958388',
   gold:stage>=3?'eac185':'c6a383',wood:stage>=2?'64424a':'815843',grip:t>=3?'592f40':'6b4444',
   binding:stage>=2?'9b745d':'936c59',cord:'e2d7b7',gem:id==='staff_frost'?'b6d9ee':id==='staff_greatfire'?'efc7ac':'b9a6ee',
   core:id==='staff_frost'?'d1c4fa':id==='staff_greatfire'?'f9deba':'edcaf7'
 };
 const result={id,tier:t,parts,colors,tip};catalog.set(key,result);return result;
}
function get(id,tier=0){return authored(id,Math.max(0,Math.min(12,Math.floor(tier)||0)));}
window.HoMoWArmory={get};
})();
