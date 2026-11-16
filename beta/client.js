/* Beta-only presentation and input. The main game is neither loaded nor connected. */
(()=>{'use strict';
  const {Arena,TYPES,WIDTH,HEIGHT,distance}=window.HoMoWArena,M=window.BrukRealmModels;
  const $=id=>document.getElementById(id),canvas=$('arena'),c=canvas.getContext('2d'),terrain=document.createElement('canvas');terrain.width=WIDTH;terrain.height=HEIGHT;
  let world=new Arena(),lastTime=null,paused=document.hidden,aimPoint=null,lastHud=0,noticeUntil=0,sound=false,audio=null,lastStep=0;
  const keys=new Set(),touches=new Map(),floaters=[],buttons={attack:$('attack'),dodge:$('dodge'),potion:$('potion')};
  function makeTerrain(){
    const g=terrain.getContext('2d');let seed=47;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    g.fillStyle='#344631';g.fillRect(0,0,WIDTH,HEIGHT);const light=g.createRadialGradient(450,285,30,480,320,570);light.addColorStop(0,'#70805a');light.addColorStop(.72,'#536a48');light.addColorStop(1,'#263f30');g.fillStyle=light;g.fillRect(0,0,WIDTH,HEIGHT);
    for(let i=0;i<1100;i++){const x=random()*WIDTH,y=random()*HEIGHT;g.fillStyle=['#b2b98a20','#a0b17c30','#263d2b33'][i%3];g.fillRect(x,y,1+random()*3,1+random()*2);}
    g.strokeStyle='#b6a47528';g.lineWidth=53;g.lineCap='round';g.beginPath();g.moveTo(155,530);g.bezierCurveTo(330,500,300,350,490,345);g.bezierCurveTo(640,345,690,480,832,518);g.stroke();
    g.strokeStyle='#d0c39440';g.lineWidth=2;g.strokeRect(43,98,WIDTH-86,HEIGHT-133);
    for(const [x,y] of [[43,98],[WIDTH-43,98],[43,HEIGHT-35],[WIDTH-43,HEIGHT-35]]){g.fillStyle='#d0c394';g.beginPath();g.moveTo(x,y-6);g.lineTo(x+6,y);g.lineTo(x,y+6);g.lineTo(x-6,y);g.fill();}
    for(let i=0;i<13;i++){const x=25+i*77;M.tree(g,{x,y:105+(i%2)*15,size:.7+(i%3)*.1,tone:i%3});}
    for(const x of [14,WIDTH-10])for(let y=225;y<HEIGHT;y+=121)M.tree(g,{x,y,size:.85,tone:y%3});
    for(const [x,y] of [[105,553],[870,555],[74,160],[880,174]])M.rock(g,{x:x-13,y:y-8,w:27,h:21});
    for(let i=0;i<24;i++){const x=70+random()*(WIDTH-140),y=145+random()*(HEIGHT-190);if(Math.abs(y-350)<70)continue;g.fillStyle=i%3?'#c7c78c77':'#d1c3a166';g.beginPath();g.arc(x,y,2,0,Math.PI*2);g.fill();}
    g.textAlign='center';g.font='11px system-ui';g.fillStyle='#e5d8aa70';g.fillText('ВЕРБОВА ГАЛЯВИНА',WIDTH/2,HEIGHT-48);
  }
  makeTerrain();
  function resize(){const rect=canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.width*HEIGHT/WIDTH*dpr);}
  new ResizeObserver(resize).observe(canvas);resize();
  function input(){let x=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0),y=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0);for(const move of touches.values()){x+=move.x;y+=move.y;}return {x:Math.max(-1,Math.min(1,x)),y:Math.max(-1,Math.min(1,y))};}
  function say(text){$('notice').textContent=text;noticeUntil=performance.now()+3500;}
  function unlock(){if(!sound)return;try{audio||=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{});}catch{sound=false;$('soundToggle').textContent='Звук недоступний';}}
  function tone(kind){if(!sound||!audio||audio.state!=='running')return;const now=audio.currentTime,o=audio.createOscillator(),gain=audio.createGain(),healing=kind==='potion'||kind==='won';o.type=kind==='sword'?'sawtooth':'triangle';o.frequency.setValueAtTime(healing?350:kind==='step'?145:180,now);o.frequency.exponentialRampToValueAtTime(healing?880:45,now+.14);gain.gain.setValueAtTime(kind==='step'?.025:.075,now);gain.gain.exponentialRampToValueAtTime(.001,now+.17);o.connect(gain);gain.connect(audio.destination);o.start();o.stop(now+.18);o.onended=()=>{o.disconnect();gain.disconnect();};}
  $('soundToggle').onclick=()=>{sound=!sound;$('soundToggle').setAttribute('aria-pressed',String(sound));$('soundToggle').textContent=sound?'Звук: увімк.':'Звук: вимк.';unlock();};
  function clearInput(){keys.clear();touches.clear();for(const b of document.querySelectorAll('[data-move]'))b.classList.remove('pressed');}
  function attack(){unlock();if(aimPoint)world.aim(aimPoint.x,aimPoint.y);else{const target=world.monsters.filter(m=>m.alive&&distance(m,world.state)<110).sort((a,b)=>distance(a,world.state)-distance(b,world.state))[0];if(target)world.aim(target.x,target.y);}world.attack();}
  function dodge(){unlock();if(!world.dodge(input()))say(world.state.energy<25?'Для ривка потрібно 25 енергії.':'Ривок ще відновлюється.');}
  function potion(){unlock();if(!world.potion())say(world.potions===0?'Зілля закінчилося.':world.state.hp===world.state.maxHp?'Здоров’я вже повне.':'Зілля ще відновлюється.');}
  function restart(){world=new Arena();floaters.length=0;aimPoint=null;lastTime=null;lastStep=0;clearInput();$('result').classList.add('hidden');say('Нова спроба. На галявині знову двоє супротивників.');hud();canvas.focus({preventScroll:true});}
  $('restart').onclick=restart;$('playAgain').onclick=restart;buttons.attack.onclick=attack;buttons.dodge.onclick=dodge;buttons.potion.onclick=potion;
  document.addEventListener('keydown',e=>{
    if(world.result&&e.code==='Tab'){e.preventDefault();$('playAgain').focus();return;}
    if(e.ctrlKey||e.metaKey||e.altKey||e.target.closest('a,summary'))return;
    if(e.target.closest('button')&&['Space','Enter'].includes(e.code))return;
    if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight','Space','ShiftLeft','ShiftRight','KeyQ'].includes(e.code))e.preventDefault();else return;
    if(!e.repeat){if(e.code==='Space')attack();if(e.code.startsWith('Shift'))dodge();if(e.code==='KeyQ')potion();}keys.add(e.code);
  });
  document.addEventListener('keyup',e=>keys.delete(e.code));
  for(const b of document.querySelectorAll('[data-move]')){
    b.addEventListener('pointerdown',e=>{e.preventDefault();unlock();aimPoint=null;const [x,y]=b.dataset.move.split(',').map(Number);touches.set(e.pointerId,{x,y,button:b});b.classList.add('pressed');b.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});});
    b.addEventListener('lostpointercapture',e=>{touches.delete(e.pointerId);b.classList.remove('pressed');});
  }
  for(const event of ['pointerup','pointercancel'])window.addEventListener(event,e=>{touches.get(e.pointerId)?.button.classList.remove('pressed');touches.delete(e.pointerId);});
  function point(e){const rect=canvas.getBoundingClientRect();return {x:(e.clientX-rect.left)*WIDTH/rect.width,y:(e.clientY-rect.top)*HEIGHT/rect.height};}
  canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse')aimPoint=point(e);});canvas.addEventListener('pointerleave',()=>{aimPoint=null;});
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();canvas.focus({preventScroll:true});aimPoint=point(e);attack();});canvas.addEventListener('contextmenu',e=>e.preventDefault());
  window.addEventListener('blur',()=>{clearInput();paused=true;lastTime=null;});window.addEventListener('focus',()=>{paused=document.hidden;lastTime=null;});document.addEventListener('visibilitychange',()=>{paused=document.hidden;lastTime=null;if(paused)clearInput();});
  window.addEventListener('pagehide',()=>{audio?.close().catch(()=>{});});
  function processEvents(){for(const event of world.drainEvents()){
    if(['sword','hurt','potion','won'].includes(event.type))tone(event.type);
    if(event.text&&['damage','hurt','potion'].includes(event.type))floaters.push({...event,life:1});
    if(event.type==='kill')say(event.text+' переможений.');
    if(event.type==='won'||event.type==='lost'){
      clearInput();const won=event.type==='won';$('resultTitle').textContent=won?'Галявина вільна.':'Ще одна спроба?';$('resultDescription').textContent=won?'Ти здолав обох монстрів. Можна повторити випробування.':'Спробуй уникнути червоного кола ривком і вчасно випити зілля.';$('resultLabel').textContent=won?'2 / 2 · ПЕРЕМОГА':'БОЄЦЬ ПОЛІГ';$('result').classList.remove('hidden');$('playAgain').focus({preventScroll:true});
    }
  }}
  function hud(){const s=world.state;$('hpFill').style.transform='scaleX('+s.hp/s.maxHp+')';$('hpText').textContent=Math.ceil(s.hp)+' / '+s.maxHp;$('energyFill').style.transform='scaleX('+s.energy/100+')';$('energyText').textContent=Math.floor(s.energy)+' енергії';$('killCount').textContent=world.kills+' / 2';$('killFill').style.width=world.kills*50+'%';$('potionCount').textContent=world.potions;$('dodgeHint').textContent=world.dodgeCooldown>0?world.dodgeCooldown.toFixed(1)+' с':'SHIFT';$('potionHint').textContent=world.potionCooldown>0?world.potionCooldown.toFixed(1)+' с':'Q · +65 HP';buttons.attack.disabled=!!world.result;buttons.dodge.disabled=!!world.result;buttons.potion.disabled=!!world.result||world.potions===0;
    for(const m of world.monsters){const row=$('enemy-'+m.id);row.classList.toggle('defeated',!m.alive);row.querySelector('.enemy-status').textContent=m.alive?'Живий':'Здолано';}
  }
  function render(dt){
    c.setTransform(canvas.width/WIDTH,0,0,canvas.height/HEIGHT,0,0);c.drawImage(terrain,0,0);
    for(const m of world.monsters){if(!m.alive){c.strokeStyle='#293c2e55';c.lineWidth=2;c.beginPath();c.ellipse(m.x,m.y,22,8,0,0,Math.PI*2);c.stroke();continue;}if(m.windup>0){const info=TYPES[m.type],ratio=1-m.windup/info.windup;c.fillStyle='#b8593f22';c.strokeStyle='#e89a6a';c.lineWidth=2;c.beginPath();c.arc(m.x,m.y,info.range+15,0,Math.PI*2);c.fill();c.stroke();c.beginPath();c.arc(m.x,m.y,info.range+15,-Math.PI/2,-Math.PI/2+Math.PI*2*ratio);c.lineWidth=5;c.stroke();}}
    for(const entity of [...world.monsters.filter(m=>m.alive),{player:true,y:world.state.y}].sort((a,b)=>a.y-b.y)){
      if(entity.player){if(world.invulnerable>0){c.strokeStyle='#cfe4dc88';c.lineWidth=2;c.beginPath();c.ellipse(world.state.x,world.state.y,28,12,0,0,Math.PI*2);c.stroke();}M.player(c,world,world.walking,M.weapon);}
      else{M.monster(c,entity,world);const yy=entity.y-(entity.type==='wolf'?79:65);c.fillStyle='#1d2b22';c.fillRect(entity.x-35,yy,70,5);c.fillStyle=entity.hp<entity.maxHp?'#ba885c':'#afbd81';c.fillRect(entity.x-35,yy,70*entity.hp/entity.maxHp,5);c.font='10px system-ui';c.textAlign='center';c.fillStyle='#ecedd1';c.strokeStyle='#243a2d';c.lineWidth=3;c.strokeText(TYPES[entity.type].name,entity.x,yy-7);c.fillText(TYPES[entity.type].name,entity.x,yy-7);}
    }
    for(const effect of world.effects){c.globalAlpha=effect.life/effect.max;c.strokeStyle='#f6d992';c.lineWidth=3;const r=16*(1-effect.life/effect.max);c.beginPath();c.moveTo(effect.x-r,effect.y-r);c.lineTo(effect.x+r,effect.y+r);c.moveTo(effect.x-r,effect.y+r);c.lineTo(effect.x+r,effect.y-r);c.stroke();}c.globalAlpha=1;
    for(let i=floaters.length-1;i>=0;i--){const f=floaters[i];if(!paused)f.life-=dt;if(f.life<=0){floaters.splice(i,1);continue;}c.globalAlpha=Math.min(1,f.life*3);c.font='bold 16px system-ui';c.textAlign='center';c.fillStyle=f.type==='potion'?'#d1ed9c':f.type==='hurt'?'#ffd2b2':'#fff0bf';c.fillText(f.text,f.x,f.y-(1-f.life)*35);}c.globalAlpha=1;
    if(paused&&!world.result){c.fillStyle='#10201b66';c.fillRect(0,0,WIDTH,HEIGHT);c.fillStyle='#f2e5bd';c.font='24px Georgia';c.textAlign='center';c.fillText('Пауза',WIDTH/2,HEIGHT/2);}
  }
  function frame(now){const dt=lastTime===null?0:Math.min(.05,(now-lastTime)/1000);lastTime=now;if(!paused)world.step(dt,input());processEvents();if(world.walking&&sound&&world.time-lastStep>.36){lastStep=world.time;tone('step');}render(dt);if(now-lastHud>80){hud();lastHud=now;}if(noticeUntil&&now>noticeUntil){$('notice').textContent='WASD — рух · SPACE / клік — удар · SHIFT — ривок · Q — зілля';noticeUntil=0;}requestAnimationFrame(frame);}
  hud();requestAnimationFrame(frame);
})();
