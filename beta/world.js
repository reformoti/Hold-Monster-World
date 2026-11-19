/* Beta-only adapters. Canonical rules, collision geometry and saves remain shared. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('../realms-core.js'));else root.HoMoWFull=factory(root.BrukRealms);})(typeof window==='undefined'?globalThis:window,function(R){
'use strict';
class World extends R.World {
  crossCluster(id){const p=R.PORTALS.find(p=>p.id===id);if(!p?.village)return super.crossCluster(id);const s=this.state,from=R.clusterOf(s);if(![p.a,p.b].includes(from)||Math.hypot(p.x-s.x,p.y-s.y)>135||this.inCombat()||this.duelActive)return {ok:false,message:'Підійди до брами поза боєм.'};const entering=from!=='village',v=R.VILLAGE,sign=p.axis==='x'?(p.x===v.x?1:-1):(p.y===v.y?1:-1),delta=sign*(entering?1:-1)*45,x=p.x+(p.axis==='x'?delta:0),y=p.y+(p.axis==='y'?delta:0);if(R.blocked(x,y,18))return {ok:false,message:'Прохід зайнятий.'};s.x=x;s.y=y;this.selected=null;this.selectedNode=null;this.gathering=null;this.recalling=null;this.projectiles=[];const to=R.clusterAt(x,y);this.emit('cluster',{id:to.id,name:to.name});return {ok:true,message:'Кластер: '+to.name};}
  aimPoint(range){const s=this.state,p=this.aimTarget||{x:s.x+this.facing.x*170,y:s.y+this.facing.y*170},dx=p.x-s.x,dy=p.y-s.y,len=Math.hypot(dx,dy)||1,f=Math.min(1,range/len);return {x:s.x+dx*f,y:s.y+dy*f};}
  update(dt,input={}){const facing=this.facing,locked=this.swing>0,s=this.state,x=s.x,y=s.y,phase=this.footstep;super.update(dt,input);if(locked&&this.swing>0)this.facing=facing;const distance=Math.hypot(s.x-x,s.y-y),teleport=distance>80;this.walking=!teleport&&distance>.005;this.footstep=teleport?0:phase+distance*(s.mounted?.055:.075);this.lastTravel=teleport?0:distance;}
  faceAim(){const s=this.state;if(this.aimTarget){const dx=this.aimTarget.x-s.x,dy=this.aimTarget.y-s.y,len=Math.hypot(dx,dy);if(len>1)this.facing={x:dx/len,y:dy/len};}}
  closest(range){const list=super.closest(range);return this.manualArea?list:list.filter(m=>{const dx=m.x-this.state.x,dy=m.y-this.state.y,len=Math.hypot(dx,dy)||1;return (dx*this.facing.x+dy*this.facing.y)/len>=Math.cos(Math.PI/3);});}
  attack(){
    if(this.attackCooldown>0)return false;
    const s=this.state,f=R.FAMILIES[s.weaponKind];
    if(s.weaponKind==='staff'&&s.mana<6)return false;
    if(this.aimTarget){const dx=this.aimTarget.x-s.x,dy=this.aimTarget.y-s.y,len=Math.hypot(dx,dy);if(len>1)this.facing={x:dx/len,y:dy/len};}
    this.dismount();this.recalling=null;this.attackCooldown=R.attackInterval(s);this.swing=.25;
    this.emit('sound',{kind:s.weaponKind});this.selectedNode=null;this.gathering=null;
    if(f.ranged){if(s.weaponKind==='staff')s.mana-=6;this.shoot('player',s.x,s.y,Math.atan2(this.facing.y,this.facing.x),R.attack(s),{magic:s.weaponKind==='staff'});this.lastCombat=this.time;}
    else {const targets=this.closest(R.weaponRange(s)).filter(m=>{const dx=m.x-s.x,dy=m.y-s.y,len=Math.hypot(dx,dy)||1;return (dx*this.facing.x+dy*this.facing.y)/len>=Math.cos(Math.PI/3);});
      for(const m of targets.slice(0,s.weaponKind==='axe'?3:s.weaponKind==='spear'?2:1))this.hitMonster(m,R.attack(s));}
    return true;
  }
}
return {World};
});
