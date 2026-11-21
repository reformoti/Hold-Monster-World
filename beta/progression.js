/* The beta uses the same progression rules in its simulation, HUD and talent board. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.HoMoWProgression=factory();
})(typeof window==='undefined'?globalThis:window,function(){
  'use strict';
  const goal=s=>Math.round(96+22*(s.level-1)+3*Math.pow(s.level-1,1.55));
  const legacyGoal=s=>Math.max(45,Math.round(80*Math.pow(s.level,1.22)));
  function reward(s,t){
    const relative=Math.max(.20,Math.min(1.55,1+(t.level-s.level)/Math.max(10,s.level)*.65));
    const share=t.boss ? .68 : t.elite ? .28 : .105;
    return Math.max(1,Math.round(goal({level:t.level})*share*relative));
  }
  function restore(s,raw){
    const old=raw.betaProgression!==1;
    const prior=Math.min(s.xp,legacyGoal(s)-1);
    s.xp=old?Math.floor(prior/legacyGoal(s)*goal(s)):Math.min(s.xp,goal(s)-1);
    s.betaProgression=1;
    s.reserveXp=Number.isSafeInteger(raw.reserveXp)&&!old?Math.max(0,Math.min(100000000,raw.reserveXp)):0;
    if(s.level===100&&!s.monolithAwakened){s.reserveXp=Math.min(100000000,s.reserveXp+s.xp);s.xp=0;}
    if(s.level===650){s.xp=0;s.reserveXp=0;}
    s.homeTown=raw.homeTown==='city'&&s.passUnlocked?'city':'village';
  }
  function apply(world,amount,maxHp,release=false){
    const s=world.state,cap=s.monolithAwakened?650:100;
    if(!Number.isSafeInteger(amount)||amount<0||s.level===650)return 0;
    const earned=release?0:Math.round(amount*(1+s.extras.cape*.03));
    let pool=s.xp+earned;
    if(s.monolithAwakened){pool+=s.reserveXp;s.reserveXp=0;}
    while(s.level<cap&&pool>=goal(s)){
      pool-=goal(s);s.level++;world.emit('level',{level:s.level});
      s.hp=maxHp(s);
    }
    if(s.level===100&&!s.monolithAwakened){
      const room=100000000-s.reserveXp;s.reserveXp+=Math.min(room,pool);s.xp=0;
      return Math.max(0,earned-Math.max(0,pool-room));
    }
    s.xp=s.level===650?0:pool;
    return s.level===650?Math.max(0,earned-pool):earned;
  }
  return {goal,reward,restore,apply};
});
