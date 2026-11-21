/* Unit-height profiles. Trunk girth, spread and height vary independently by species. */
(()=>{'use strict';
const F=window.HoMoWForms,M=window.HoMoWScale.metre;
const species=[
 {name:'pine',height:16,width:.30,girth:.026,bark:'615643',leaves:['344940','40574a','526653']},
 {name:'oak',height:12.2,width:.68,girth:.050,bark:'6e604b',leaves:['637457','748361','899470']},
 {name:'birch',height:13.5,width:.36,girth:.021,bark:'c5beaa',leaves:['79886b','91a17b','a1aa83']},
 {name:'poplar',height:14,width:.29,girth:.031,bark:'6a6956',leaves:['657961','74886c','889678']},
 {name:'orchard',height:7.8,width:.64,girth:.043,bark:'71604c',leaves:['777e5b','899064','9ba075']},
 {name:'willow',height:10.4,width:.69,girth:.046,bark:'685f50',leaves:['687e68','778c73','8c9a7e']}
];
function crown(b,slot,x,y,z,rx,ry,rz,phase){
 const rows=[[-.86,.32],[-.56,.79],[-.02,1],[.56,.84],[.89,.48],[1,0]];
 b.loft(slot,rows.map(([h,r],j)=>Array.from({length:8},(_,i)=>{
   const a=phase+i*Math.PI/4+(j%2)*.13,rag=1+.09*Math.sin(i*3+phase*4);
   return [x+rx*r*rag*Math.cos(a),y+ry*h,z+rz*r*rag*Math.sin(a)];})));
}
function make(b,index,form,stump){
 const sp=species[index],r=sp.girth/2,phase=form*.76,spread=sp.width/2;
 const rootHeight=.026;
 for(let i=0;i<5;i++){
   const a=phase+i*1.257;b.beam('bark',[Math.cos(a)*r*.52,rootHeight,Math.sin(a)*r*.52],[Math.cos(a)*r*2.45,.004,Math.sin(a)*r*2.45],r*.55,r*.17,5);
 }
 if(stump){
   b.rings('bark',[[0,r*1.35,r*1.42],[.014,r*1.09,r*1.13],[.025,r,r*1.02]],8);
   b.rings('cut',[[.0251,r*.92,r*.95],[.0256,r*.90,r*.93]],8);return;
 }
 const conifer=index===0,bend=conifer?.003:.014*Math.sin(phase+.7);
 b.rings('bark',[[0,r*1.35,r*1.42],[.04,r,r*1.03],[.35,r*.83,r*.91,bend],[.61,r*.64,r*.66,bend*.4],[.84,r*.28,r*.3,-bend],[.985,r*.04,r*.04,0]],8);
 if(conifer){
   for(let k=0;k<6;k++){
     const y=.19+.121*k,width=spread*(1-k*.133),height=k===5?1-y:.316-.015*k;
     const loops=[[0,.92],[.11,1],[.43,.64],[1,.015]].map(([v,rad],row)=>Array.from({length:12},(_,i)=>{
       const a=i*Math.PI/6+phase+k*.37,radius=rad*width*(i%2?.77:1);
       return [Math.cos(a)*radius,y+v*height+(row<2&&i%2?.035:0),Math.sin(a)*radius];
     }));
     b.loft('leaf'+Math.min(2,Math.floor(k/2)),loops);
   }
   return;
 }
 const tall=index===2||index===3,low=index===4?.28:tall?.44:.35;
 const count=tall?7:8;
 for(let i=0;i<count;i++){
   const level=i/(count-1),a=phase+i*2.399,extent=spread*(.65-.29*level),x=Math.cos(a)*extent,z=Math.sin(a)*extent;
   const fork=low+level*.32,cy=low+.19+level*(.83-low-.16);
   b.beam('bark',[bend,fork-.09,0],[x*.55,fork+.035,z*.55],r*(.53-.17*level),r*.29,6);
   b.beam('bark',[x*.55,fork+.035,z*.55],[x,cy,z],r*.32,r*.085,5);
   crown(b,'leaf'+(i%3),x,cy,z,spread*(.49-.09*level),tall?.135:.15,spread*.48,a);
   if(index===5&&i<5)crown(b,'leaf0',x*1.18,cy-.11,z*1.18,spread*.25,.20,spread*.28,a+.4);
 }
 crown(b,'leaf2',-bend,.882,0,spread*.49,.118,spread*.53,phase+.4);
 if(index===2){for(let i=0;i<8;i++){
   const y=.08+i*.045,a=i*2.4+phase,rr=r*(1.03-.38*y);
   b.beam('stripe',[bend*y*2+Math.cos(a)*rr,y,Math.sin(a)*rr],[bend*y*2+Math.cos(a+.7)*rr,y+.003,Math.sin(a+.7)*rr],r*.115,r*.08,4);
 }}
}
function size(t,shape,seed){
 const n=typeof seed==='number'?seed>>>0:window.HoMoWWorldStyle.hash(String(seed));
 const mix=Math.imul(n^0x45d9f3b,2654435761)>>>0,index=Math.abs(shape|0)%species.length,sp=species[index];
 const height=M*sp.height*(.80+(mix%101)/265+Math.min(8,Math.max(0,t))*.014);
 return {index,sp,height,width:height*sp.width,seed:mix};
}
function draw(x,z,t,shape,alive,biome,seed=0){
 const v=size(t,shape,seed),form=v.seed%4,parts=F.model('tree/'+v.sp.name+'/'+form+(alive?'':'/stump'),b=>make(b,v.index,form,!alive));
 const leaves=biome==='winter'?['92a298','b5c3b5','dbe2d3']:v.sp.leaves;
 const colors={bark:v.sp.bark,cut:'bb9e74',stripe:'5d5f57',leaf0:leaves[0],leaf1:leaves[1],leaf2:leaves[2]};
 for(const {mesh,slot} of parts)this.draw(mesh,x,0,z,v.height,v.height,v.height,colors[slot],(v.seed%628)*.01);
}
window.HoMoWTrees={draw,size};
})();
