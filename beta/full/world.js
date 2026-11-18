/* Beta-only adapters. Canonical rules, collision geometry and saves remain shared. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('../../realms-core.js'));else root.HoMoWFull=factory(root.BrukRealms);})(typeof window==='undefined'?globalThis:window,function(R){
'use strict';
class World extends R.World {
  attack(){
    if(this.attackCooldown>0)return false;
    const s=this.state,f=R.FAMILIES[s.weaponKind];
    if(s.weaponKind==='staff'&&s.mana<6)return false;
    if(this.aimTarget){const dx=this.aimTarget.x-s.x,dy=this.aimTarget.y-s.y,len=Math.hypot(dx,dy);if(len>1)this.facing={x:dx/len,y:dy/len};}
    this.dismount();this.recalling=null;this.attackCooldown=R.attackInterval(s);this.swing=.25;
    this.emit('sound',{kind:s.weaponKind});this.selectedNode=null;this.gathering=null;
    if(f.ranged){if(s.weaponKind==='staff')s.mana-=6;this.shoot('player',s.x,s.y,Math.atan2(this.facing.y,this.facing.x),R.attack(s),{magic:s.weaponKind==='staff'});this.lastCombat=this.time;}
    else {const targets=super.closest(R.weaponRange(s)).filter(m=>{const dx=m.x-s.x,dy=m.y-s.y,len=Math.hypot(dx,dy)||1;return (dx*this.facing.x+dy*this.facing.y)/len>=Math.cos(Math.PI/3);});
      for(const m of targets.slice(0,s.weaponKind==='axe'?3:s.weaponKind==='spear'?2:1))this.hitMonster(m,R.attack(s));}
    return true;
  }
}
return {World};
});
