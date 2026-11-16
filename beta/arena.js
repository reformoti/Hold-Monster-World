/* A deliberately small, independent combat sandbox. No accounts, storage or full-world data. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.HoMoWArena=factory();})(typeof window==='undefined'?globalThis:window,function(){
  'use strict';
  const WIDTH=960,HEIGHT=620;
  const TYPES=Object.freeze({slime:{name:'Лісовий слиз',hp:70,damage:9,speed:62,range:38,aggro:235,windup:.6,cooldown:1.6},wolf:{name:'Дикий вовк',hp:135,damage:15,speed:104,range:47,aggro:260,windup:.55,cooldown:1.45}});
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function unit(x,y){const length=Math.hypot(x,y);return length>0?{x:x/length,y:y/length}:{x:1,y:0};}
  class Arena{
    constructor(){
      this.time=0;this.walking=false;this.footstep=0;this.facing={x:1,y:0};this.swing=0;this.hurt=0;this.dashTime=0;this.attackCooldown=0;this.dodgeCooldown=0;this.potionCooldown=0;this.invulnerable=0;this.potions=2;this.kills=0;this.events=[];this.effects=[];this.result=null;
      this.state={x:210,y:375,hp:150,maxHp:150,energy:100,armor:2,armorKind:'plate',supportKind:'shield',weaponKind:'sword',appearance:{style:'short',beard:'none'},outfits:{}};
      this.monsters=[{id:'slime',type:'slime',x:495,y:245},{id:'wolf',type:'wolf',x:735,y:410}].map((m,i)=>({...m,home:{x:m.x,y:m.y},hp:TYPES[m.type].hp,maxHp:TYPES[m.type].hp,alive:true,phase:i*2,footstep:0,facing:{x:-1,y:0},state:'idle',cooldown:0,windup:0,walking:false}));
    }
    emit(type,x=this.state.x,y=this.state.y,text=''){this.events.push({type,x,y,text});}
    drainEvents(){return this.events.splice(0);}
    aim(x,y){if(Number.isFinite(x)&&Number.isFinite(y)&&distance(this.state,{x,y})>1)this.facing=unit(x-this.state.x,y-this.state.y);}
    attack(){
      if(this.result||this.attackCooldown>0||this.dashTime>0)return false;
      this.attackCooldown=.44;this.swing=.3;this.emit('sword');
      for(const m of this.monsters){
        if(!m.alive||distance(this.state,m)>95)continue;
        const direction=unit(m.x-this.state.x,m.y-this.state.y);
        if(direction.x*this.facing.x+direction.y*this.facing.y<.25)continue;
        m.hp=Math.max(0,m.hp-32);this.emit('damage',m.x,m.y-65,'−32');this.effects.push({x:m.x,y:m.y-20,life:.25,max:.25,type:'hit'});
        if(m.hp===0){m.alive=false;m.walking=false;m.windup=0;m.state='dead';this.kills++;this.emit('kill',m.x,m.y,TYPES[m.type].name);}
      }
      if(this.kills===this.monsters.length){this.result='won';this.emit('won');}
      return true;
    }
    dodge(direction){
      if(this.result||this.dodgeCooldown>0||this.state.energy<25)return false;
      this.dashDirection=direction&&Math.hypot(direction.x,direction.y)>0?unit(direction.x,direction.y):{...this.facing};
      this.facing={...this.dashDirection};this.dashTime=.19;this.invulnerable=.28;this.dodgeCooldown=2;this.state.energy-=25;this.emit('dodge');return true;
    }
    potion(){
      if(this.result||this.potions===0||this.potionCooldown>0||this.state.hp===this.state.maxHp)return false;
      this.state.hp=Math.min(this.state.maxHp,this.state.hp+65);this.potions--;this.potionCooldown=6;this.emit('potion',this.state.x,this.state.y-60,'+65');return true;
    }
    /** Advance a bounded simulation step. Input is a direction, never a position. */
    step(dt,input={}){
      if(!Number.isFinite(dt)||dt<=0||this.result)return;
      dt=Math.min(.05,dt);this.time+=dt;
      for(const key of ['swing','hurt','dashTime','invulnerable','attackCooldown','dodgeCooldown','potionCooldown'])this[key]=Math.max(0,this[key]-dt);
      this.state.energy=Math.min(100,this.state.energy+13*dt);
      const x=Number.isFinite(input.x)?clamp(input.x,-1,1):0,y=Number.isFinite(input.y)?clamp(input.y,-1,1):0,moving=Math.hypot(x,y)>0,direction=unit(x,y);
      this.walking=moving||this.dashTime>0;
      if(this.dashTime>0){this.state.x+=this.dashDirection.x*600*dt;this.state.y+=this.dashDirection.y*600*dt;}
      else if(moving){this.state.x+=direction.x*175*dt;this.state.y+=direction.y*175*dt;this.facing=direction;}
      this.state.x=clamp(this.state.x,58,WIDTH-58);this.state.y=clamp(this.state.y,110,HEIGHT-50);
      if(this.walking)this.footstep+=dt*(this.dashTime>0?22:11);
      for(const effect of this.effects)effect.life-=dt;this.effects=this.effects.filter(e=>e.life>0);
      for(const m of this.monsters){
        if(!m.alive)continue;
        const info=TYPES[m.type],dist=distance(this.state,m);m.cooldown=Math.max(0,m.cooldown-dt);m.walking=false;
        if(m.windup>0){
          m.windup=Math.max(0,m.windup-dt);
          if(m.windup===0){
            if(dist<info.range+15&&this.invulnerable===0){this.state.hp=Math.max(0,this.state.hp-info.damage);this.hurt=.2;this.emit('hurt',this.state.x,this.state.y-65,'−'+info.damage);}
            m.cooldown=info.cooldown;m.state='chase';
          }
        }else if(dist<info.range&&m.cooldown===0){m.windup=info.windup;m.state='attack';}
        else if(dist>info.range*.85&&(dist<info.aggro||m.state==='chase'||m.hp<m.maxHp)){
          m.state='chase';const d=unit(this.state.x-m.x,this.state.y-m.y);m.facing=d;
          m.x=clamp(m.x+d.x*info.speed*dt,58,WIDTH-58);m.y=clamp(m.y+d.y*info.speed*dt,110,HEIGHT-50);m.footstep+=dt*11;m.walking=true;
        }
        if(this.state.hp===0){this.result='lost';this.walking=false;this.emit('lost');break;}
      }
    }
  }
  return {Arena,TYPES,WIDTH,HEIGHT,distance};
});
