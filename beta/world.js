/* Beta-only adapters. Canonical rules, collision geometry and saves remain shared. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('../realms-core.js'));else root.HoMoWFull=factory(root.BrukRealms);})(typeof window==='undefined'?globalThis:window,function(R){
'use strict';
class World extends R.World {
  constructor(saved){super(saved);if(R.blocked(this.state.x,this.state.y,18)){const origin={x:this.state.x,y:this.state.y};outer:for(let r=30;r<=360;r+=25)for(let i=0;i<16;i++){const x=origin.x+Math.cos(i*Math.PI/8)*r,y=origin.y+Math.sin(i*Math.PI/8)*r;if(!R.blocked(x,y,22)&&R.clusterOf({x,y})===R.clusterOf(origin)){this.state.x=x;this.state.y=y;break outer;}}}}
  moveEntity(entity,dx,dy,r){const L=typeof window!=='undefined'?window.HoMoWLayout:null;if(entity===this.state||!entity.type||!L)return super.moveEntity(entity,dx,dy,r);const radius=R.TYPES[entity.type].radius,cluster=R.clusterOf({x:entity.homeX,y:entity.homeY}),valid=p=>R.clusterOf(p)===cluster&&!R.inVillage(p.x,p.y)&&!R.inCity(p.x,p.y)&&L.free(p,radius+3)&&L.gateFree(p,125)&&this.nodes.every(n=>Math.hypot(n.x-p.x,n.y-p.y)>radius+32);
 const len=Math.hypot(dx,dy);if(!len)return;const clear=(vx,vy)=>{const count=Math.max(1,Math.ceil(Math.hypot(vx,vy)/10));for(let i=1;i<=count;i++)if(!valid({x:entity.x+vx*i/count,y:entity.y+vy*i/count}))return false;return true;};
 for(const turn of [0,.45,-.45,.9,-.9,1.35,-1.35]){const x=dx*Math.cos(turn)-dy*Math.sin(turn),y=dx*Math.sin(turn)+dy*Math.cos(turn);if(clear(x,y)){super.moveEntity(entity,x,y,radius);return;}}entity.walking=false;
 }
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
