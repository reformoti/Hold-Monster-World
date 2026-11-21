/* One mount model per species, shared by shop previews and the world. */
(()=>{'use strict';window.HoMoWMountArt={mountModel(w){const id=w.state.selectedMount||'horse',wolf=id==='direwolf',donkey=id==='donkey',armored=id==='warhorse',x=w.state.x,z=w.state.y,a=Math.atan2(w.facing.x,w.facing.y),gait=w.gait??(w.walking?1:0),stride=Math.sin(w.footstep||0)*gait,bob=Math.abs(stride)*1.5,body=wolf?'9caeb9':donkey?'a29a84':armored?'627e87':'ad7850',dark=wolf?'526578':donkey?'655f51':'593f31',h=wolf?32:donkey?38:46;
const scale=window.HoMoWScale.mount[id]||window.HoMoWScale.mount.horse;
const p=(dx,y,dz,sx,sy,sz,c,k='cube',tilt=0)=>this.draw(k,x+(dx*Math.cos(a)+dz*Math.sin(a))*scale,(y+bob)*scale,z+(-dx*Math.sin(a)+dz*Math.cos(a))*scale,sx*scale,sy*scale,sz*scale,c,a+tilt);
// Barrel, chest, haunches and four independently articulated legs.
p(0,h,0,22,19,40,body,'sphere');p(0,h+1,27,19,21,19,body,'sphere');p(0,h-1,-27,22,20,20,body,'sphere');
for(const side of [-1,1])for(const front of [-1,1]){const step=stride*side*front*9,lift=Math.max(0,stride*side*front)*8,dx=side*14,dz=front*26;p(dx,h*.55+lift,dz+step*.55,8,h*.55,10,body);p(dx,10+lift,dz+step,6,20,7,dark);p(dx,3+lift,dz+step+2,wolf?10:9,7,wolf?14:11,wolf?'d5dce0':'343b3b');}
// The wolf has a low chest, long muzzle and fur collar; equines have a rising neck.
if(wolf){p(0,h+12,26,23,23,19,'c5d0d4','sphere');p(0,h+21,42,15,15,19,body,'sphere');p(0,h+17,59,10,8,17,'d0d9d8');p(0,h+19,69,9,6,5,'273944');for(const side of [-1,1])p(side*10,h+31,40,6,15,6,dark,'cone');p(0,h-2,-46,10,12,28,dark);p(0,h-8,-62,8,8,14,'e1e5dc');}
else{p(0,h+16,28,14,37,17,body,'sphere');p(0,h+38,37,14,17,20,body,'sphere');p(0,h+27,53,12,18,17,donkey?'c4bfaa':'c89e77');p(0,h+25,62,12,9,5,dark);for(const side of [-1,1]){p(side*8,h+53,33,4,donkey?27:14,5,body,'cone');p(side*8,h+54,34,2,donkey?17:8,2,'d4b3a1');}for(let i=0;i<5;i++)p(0,h+17+i*5,19+i*2,8,9,6,dark);p(0,h-3,-46,5,24,7,dark);p(0,h-17,-48,8,15,9,dark);}
for(const side of [-1,1]){p(side*(wolf?12:11),h+(wolf?23:39),wolf?49:44,3,3,4,'172e37');p(side*(wolf?13:12),h+(wolf?24:40),wolf?50:45,1,1,2,'efdfab');}
// Saddle, blanket, stirrups and reins.
p(0,h+18,-3,25,4,35,armored?'344d65':'476c6c');p(0,h+22,-4,20,6,24,'765239');for(const dz of [-15,9])p(0,h+26,dz,22,7,5,'a38052');for(const side of [-1,1]){p(side*18,h+6,-2,2,28,3,'c6ad78');p(side*18,h-8,-2,8,3,7,'c6ad78');p(side*9,h+30,25,2,2,37,'695139');}
if(donkey)for(const side of [-1,1]){p(side*27,h+8,-13,16,24,25,'8c6b43');p(side*27,h+21,-13,18,5,27,'c8ac76');p(side*36,h+10,-13,2,18,3,'ddc58e');}
if(armored){p(0,h+4,27,33,28,9,'aabcc2');for(const side of [-1,1])for(let i=0;i<3;i++)p(side*23,h+3,-22+i*19,5,25,23,i%2?'7899a5':'9bb0b6');p(0,h+42,38,27,5,26,'b5c8c8');p(0,h+31,55,17,17,5,'9db5bd');p(0,h+51,33,6,16,18,'c5aa63');}
return (h+25+bob)*scale-28*window.HoMoWScale.human;
}};})();
