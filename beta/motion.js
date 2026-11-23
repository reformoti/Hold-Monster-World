/* Render-only smoothing. Saved positions and combat remain simulation-owned. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.HoMoWMotion=factory();})(typeof window==='undefined'?globalThis:window,function(){
'use strict';const blend=(a,b,rate,dt)=>a+(b-a)*(1-Math.exp(-rate*Math.max(0,Math.min(.2,dt))));
const angle=(a,b,rate,dt)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*(1-Math.exp(-rate*Math.max(0,Math.min(.2,dt))));
class View {
 sample(w,now,cluster){const s=w.state,target=Math.atan2(w.facing.x,w.facing.y),previous=this.last,dt=previous===undefined?0:Math.max(0,Math.min(.2,now-previous));this.last=now;
  if(!this.pose||(this.cluster!==cluster&&Math.hypot(s.x-this.pose.x,s.y-this.pose.y)>160)||Math.hypot(s.x-this.pose.x,s.y-this.pose.y)>240){this.pose={x:s.x,y:s.y,turn:target,gait:w.walking?1:0,rate:0};}else{const p=this.pose,before=p.turn;p.x=blend(p.x,s.x,38,dt);p.y=blend(p.y,s.y,38,dt);p.turn=w.swing>0?target:angle(p.turn,target,19,dt);p.gait=blend(p.gait,w.walking?1:0,18,dt);p.rate=dt>0?blend(p.rate||0,Math.atan2(Math.sin(p.turn-before),Math.cos(p.turn-before))/dt,16,dt):0;if(Math.abs(p.x-s.x)<.02)p.x=s.x;if(Math.abs(p.y-s.y)<.02)p.y=s.y;}
  this.cluster=cluster;return {...this.pose,state:{...s,x:this.pose.x,y:this.pose.y},facing:{x:Math.sin(this.pose.turn),y:Math.cos(this.pose.turn)}};
 }
 reset(){this.pose=null;this.last=undefined;this.cluster=null;}
}
return {View,blend,angle};
});
