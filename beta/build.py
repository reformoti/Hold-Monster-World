"""Generate beta-only client/HTML from canonical sources without editing them."""
from pathlib import Path
import re
import subprocess
HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
VERSION = '0.17.0'

def replace_once(text, old, new):
    if text.count(old) != 1:
        raise ValueError('Canonical source changed: ' + old[:90])
    return text.replace(old, new, 1)

def build():
    subprocess.run(['node', str(HERE / 'plan-layout.cjs')], check=True, cwd=ROOT)
    html = (ROOT / 'realms.html').read_text()
    core = (ROOT / 'realms-core.js').read_text()
    skill = core[core.index('    skill(){'):core.index('    dash(', core.index('    skill(){'))]
    skill = skill.replace('skill(){', 'skill(){this.faceAim();', 1)
    skill = re.sub(r'angle=target\?Math.atan2\(target.y-s.y,target.x-s.x\):Math.atan2\(this.facing.y,this.facing.x\)', 'angle=Math.atan2(this.facing.y,this.facing.x)', skill)
    skill = skill.replace('const x=target?.x||s.x+Math.cos(angle)*160,y=target?.y||s.y+Math.sin(angle)*160', 'const x=this.aimPoint(f.range+60).x,y=this.aimPoint(f.range+60).y')
    skill = skill.replace('S.info(', 'R.skillInfo(').replace('FAMILIES[', 'R.FAMILIES[').replace('attack(s)', 'R.attack(s)').replace('maxHp(s)', 'R.maxHp(s)').replace('!lineBlocked(', '!R.lineBlocked(')
    (HERE / 'skills.js').write_text("/* Generated canonical skills with beta manual aim. */\n(function(root){const R=root.BrukRealms;root.HoMoWFull.World.prototype.skill="+skill.strip().replace('skill(){','function(){',1)+";const originalSkill=root.HoMoWFull.World.prototype.skill;root.HoMoWFull.World.prototype.skill=function(){const k=R.skillInfo(this.state);this.manualArea=k.id==='quake'||k.id==='nova'||k.id==='standard'&&['sword','axe'].includes(this.state.weaponKind);try{return originalSkill.call(this);}finally{this.manualArea=false;}};root.HoMoWFull.World.prototype.extraSkill=function(){this.faceAim();return root.BrukSkills.create(R).perform(this,{attack:R.attack,maxHp:R.maxHp},{targets:r=>this.closest(r),position:()=>this.aimPoint(450),hit:(m,n)=>this.hitMonster(m,n,'ability'),slow:(m,n)=>m.slow=n,dot:(m,n)=>{m.burn=3;m.burnTick=0;m.burnPower=n;}});};})(window);\n")
    # Every canonical asset stays in its original directory, including CSS URLs.
    html = re.sub(r'(src|href)="(?!https?:|#)([^"\s]+)"', lambda m: m[1]+'="../'+m[2]+'"', html)
    html = re.sub(r'<script src="../(?:cloud-guard|achievement-events|homow-cloud|homow-online)\.js[^>]*></script>', '', html)
    html = re.sub(r'(<script src="../realms-evolution\.js[^"]*"></script>)', r'\1<script src="village-data.js?v='+VERSION+'"></script><script src="resource-layout.js?v='+VERSION+'"></script><script src="geography.js?v='+VERSION+'"></script>', html)
    beta_core = core.replace("require('./realms-", "require('../realms-")
    beta_core = replace_once(beta_core, "  const RADIUS=", "  const P=typeof module==='object'&&module.exports?require('./progression.js'):window.HoMoWProgression;\n  const RADIUS=")
    beta_core = replace_once(beta_core, "rankCost=rank=>1+Math.floor(rank/2)", "rankCost=()=>1")
    beta_core = replace_once(beta_core, "xpGoal=s=>Math.max(45,Math.round(80*Math.pow(s.level,1.22)))", "xpGoal=P.goal")
    start = beta_core.index('  function monsterXp(')
    end = beta_core.index('  const monsterDamage', start)
    beta_core = beta_core[:start] + "  const monsterXp=(s,type)=>P.reward(s,TYPES[type]);\n" + beta_core[end:]
    beta_core = replace_once(beta_core, "s.xp=Math.min(s.xp,xpGoal(s)-1);s.hp=Number.isFinite", "P.restore(s,raw);s.hp=Number.isFinite")
    start = beta_core.index('    gainXp(amount)')
    end = beta_core.index('    gainMastery', start)
    beta_core = beta_core[:start] + "    gainXp(amount){return P.apply(this,amount,maxHp); }\n" + beta_core[end:]
    beta_core = replace_once(beta_core, "this.state.monolithAwakened=true;", "this.state.monolithAwakened=true;P.apply(this,0,maxHp,true);")
    beta_core = replace_once(beta_core, "const xp=this.gainXp(xpOverride??Math.round(monsterXp(this.state,m.type)*xpFraction));", "const base=xpOverride??Math.round(monsterXp(this.state,m.type)*xpFraction),xp=this.gainXp(base);")
    beta_core = replace_once(beta_core, "Math.round(xp*.8)", "Math.round(base*.8)")
    beta_core = replace_once(beta_core, "this.gainXp(8);", "this.gainXp(12+offer.tier*8);")
    beta_core = replace_once(beta_core, "this.gainXp(3*batch)", "this.gainXp(Math.max(3,Math.round(r.xp/2))*batch)")
    # All paid ranks and points use a single one-point price.
    beta_core = replace_once(beta_core, "remaining=t.max-current,points=", "remaining=Math.max(0,t.max-E.talent(s,id)),points=")
    beta_core = replace_once(beta_core, "!t.parent||s.talents[t.parent]>0", "!t.parent||E.talent(s,t.parent)>0")
    beta_core = replace_once(beta_core, "if(t.parent&&!s.talents[t.parent])", "if(t.parent&&!s.talents[t.parent]&&!integer(raw.fame?.[t.parent]?.rank))")
    beta_core = beta_core.replace('this.state.talents.leech', "E.talent(this.state,'leech')").replace('this.state.talents.recovery', "E.talent(this.state,'recovery')")
    (HERE / 'core.js').write_text("// Generated by beta/build.py from realms-core.js.\n"+beta_core.rstrip()+'\n')
    html = re.sub(r'<script src="../realms-core\.js[^"]*"></script>', '<script src="progression.js?v='+VERSION+'"></script><script src="core.js?v='+VERSION+'"></script>', html)
    html = re.sub(r'src="../realms-destiny\.js[^"]*"', 'src="destiny.js?v='+VERSION+'"', html)
    (HERE / 'destiny.js').write_text((HERE / 'destiny-source.js').read_text())
    html = re.sub(r'src="../realms-ui\.js[^"]*"', 'src="client.js?v='+VERSION+'"', html)
    html = re.sub(r'src="../homow-options\.js[^"]*"', 'src="options.js?v='+VERSION+'"', html)
    options = (ROOT / 'homow-options.js').read_text().replace("KEY='homow_options_v1'", "KEY='homow_beta_options_v1'").replace("['uk','en','de','pt'].includes(r.locale)", "r.locale==='uk'")
    (HERE / 'options.js').write_text(options)
    atlas = (HERE / 'atlas-source.js').read_text()
    footer = "c.restore();c.fillStyle='#152324dc';c.fillRect(0,bh-16,bw,16);c.fillStyle='#f1dfb0';c.font='9px system-ui';c.textAlign='center';c.fillText(dungeon?dungeon.name:cluster.name+' · T'+cluster.tier,bw/2,bh-5);"
    atlas = atlas.replace(footer, 'c.restore();')
    (HERE / 'atlas.js').write_text(atlas)
    html = re.sub(r'src="../homow-atlas\.js[^"]*"', 'src="atlas.js?v='+VERSION+'"', html)
    panels = (ROOT / 'realms-panels.js').read_text()
    panels = replace_once(panels, "if(townTab==='quartermaster'){", "if(townTab==='quartermaster'){root.append(el('h3','market-section-title','Місце відродження'),el('p','','Прив’язано: '+world.homeName()),button('Прив’язати до цього поселення',()=>result(()=>world.bindHome()),s.homeTown===(R.inCity(s.x,s.y)?'city':'village')));")
    panels = replace_once(panels, "if(o&&!o.complete){card.append(description(Object.entries(o.input)", "if(o&&!o.complete){if(!o.available)card.append(description('Для цього рангу потрібна міська рунна майстерня.'));else if(world.state.silver<o.cost)card.append(description('Бракує срібла: '+(o.cost-world.state.silver)));card.append(description(Object.entries(o.input)")
    panels = replace_once(panels, "R.RESOURCES[key].name+' ×'+n).join(' · ')));const b=button('Зачарувати", "R.RESOURCES[key].name+' '+(world.state.resources[key]+world.state.bank[key])+'/'+n).join(' · ')));const b=button('Зачарувати")
    (HERE / 'panels.js').write_text(panels.rstrip()+'\n')
    html = re.sub(r'src="../realms-panels\.js[^"]*"', 'src="panels.js?v='+VERSION+'"', html)
    inns = (ROOT / 'homow-expeditions.js').read_text()
    inns = replace_once(inns, "if(inn){const fee", "if(inn){dialog.append(el('p','Місце відродження: '+world.homeName()),button('Прив’язати відродження тут',()=>action('bindHome'),s.homeTown==='city'));const fee")
    (HERE / 'expeditions.js').write_text(inns)
    html = re.sub(r'src="../homow-expeditions\.js[^"]*"', 'src="expeditions.js?v='+VERSION+'"', html)
    html = replace_once(html, '<canvas id="worldMap"', '<p class="panel-caption">◆ Фіолетовий ромб — зачарування. Підійди до майстра рун і натисни E.</p><canvas id="worldMap"')
    html = replace_once(html, '<span id="heroXpFill"></span>', '<span id="heroXpFill"></span><small id="betaXpReadout"></small>')
    html = html.replace('<head>', '<head><script src="asset-paths.js?v='+VERSION+'"></script>')
    music = (ROOT / 'homow-music.js').read_text().replace(':track.src;', ':window.HoMoWBetaAsset(track.src);').replace("O.set({score:5,volume:.05,music:true});", "").replace('audio.volume=.05','audio.volume=O.get().volume').replace('if(audio)audio.volume=.05','if(audio)audio.volume=O.get().volume')
    (HERE / 'music.js').write_text(music)
    html = re.sub(r'src="../homow-music\.js[^"]*"', 'src="music.js?v='+VERSION+'"', html)
    html = re.sub(r'src="../release\.js[^"]*"', 'src="release.js?v='+VERSION+'"', html)
    (HERE / 'release.js').write_text("window.BrukRelease=Object.freeze({version:'"+VERSION+"',date:'2026-11-21',name:'3D-бета'});document.querySelectorAll('[data-game-version]').forEach(el=>el.textContent='v"+VERSION+" · БЕТА');document.title='HoMoW · 3D-бета "+VERSION+"';\n")
    inventory = (ROOT / 'homow-inventory.js').read_text()
    start = inventory.index('function preview(')
    end = inventory.index('function change(', start)
    inventory = inventory[:start] + "function preview(parent,appearance=world.state.appearance,body=false){window.HoMoWPortrait(parent,world,appearance,null,body); }\n" + inventory[end:]
    inventory = inventory.replace("!world.nearCamp()||world.state.silver<m.cost", "!R.serviceAllowed(world,'buyMount')||world.state.silver<m.cost")
    inventory = inventory.replace('art.innerHTML=mountIcon(id);', 'window.HoMoWPortrait(art,world,world.state.appearance,id);')
    inventory = inventory.replace("const owned=world.state.mounts[id],card=", "const owned=world.state.mounts[id],card=")
    inventory = inventory.replace("card.dataset.mountId=id;", "if(!owned)card.append(el('small','mount-status',!R.serviceAllowed(world,'buyMount')?'Підійди до інтенданта · скакуни та припаси':world.state.silver<m.cost?'Бракує срібла: '+(m.cost-world.state.silver).toLocaleString('uk-UA'):'Доступний для придбання'));card.dataset.mountId=id;")
    inventory = replace_once(inventory, "preview(figure,draft);const controls", "let equipped=false;const paint=()=>{figure.replaceChildren();preview(figure,draft,!equipped);};paint();const controls")
    inventory = replace_once(inventory, "figure.replaceChildren();preview(figure,draft);", "paint();")
    inventory = replace_once(inventory, "controls.append(btn('Зберегти вигляд'", "const gear=btn('Показати спорядження',()=>{equipped=!equipped;gear.setAttribute('aria-pressed',String(equipped));paint();});gear.setAttribute('aria-pressed','false');controls.append(gear,btn('Зберегти вигляд'")
    (HERE / 'inventory.js').write_text(inventory)
    html = re.sub(r'src="../homow-inventory\.js[^"]*"', 'src="inventory.js?v='+VERSION+'"', html)
    html = html.replace('</head>', '<link rel="stylesheet" href="inventory.css?v='+VERSION+'"></head>')
    html = html.replace('</head>', '<link rel="stylesheet" href="destiny.css?v='+VERSION+'"></head>')
    html = html.replace('</head>', '<link rel="stylesheet" href="world.css?v='+VERSION+'"></head>')
    html = replace_once(html, '<canvas id="worldMap"', '<p id="encounterStatus" class="encounter-status" role="timer"></p><canvas id="worldMap"')
    html = html.replace('<body>', '<body><aside class="beta-banner">3D-бета '+VERSION+' · Повний світ · Локальна перевірка <a href="../">Основна гра</a></aside>')
    html = re.sub(r'(<script src="core\.js[^"]*"></script>)', r'\1<script src="layout.js?v='+VERSION+'"></script>', html)
    html = html.replace('<script src="client.js', '<script src="camera3d.js?v='+VERSION+'"></script><script src="materials.js?v='+VERSION+'"></script><script src="raster.js?v='+VERSION+'"></script><script src="faceted-meshes.js?v='+VERSION+'"></script><script src="world-scale.js?v='+VERSION+'"></script><script src="tree-art.js?v='+VERSION+'"></script><script src="body-pick.js?v='+VERSION+'"></script><script src="armory.js?v='+VERSION+'"></script><script src="armory-icons.js?v='+VERSION+'"></script><script src="avatar.js?v='+VERSION+'"></script><script src="scene3d.js?v='+VERSION+'"></script><script src="encounter-sites.js?v='+VERSION+'"></script><script src="world.js?v='+VERSION+'"></script><script src="skills.js?v='+VERSION+'"></script><script src="world-style.js?v='+VERSION+'"></script><script src="world-art.js?v='+VERSION+'"></script><script src="creature-art.js?v='+VERSION+'"></script><script src="motion.js?v='+VERSION+'"></script><script src="mount-art.js?v='+VERSION+'"></script><script src="world-scene.js?v='+VERSION+'"></script><script src="portrait.js?v='+VERSION+'"></script><script src="tools.js?v='+VERSION+'"></script><script src="client.js')
    html = html.replace('Hold Monsters World · HoMoW', 'HoMoW · Повний світ · 3D-бета '+VERSION)
    html = html.replace('пробіл — атака', 'ЛКМ — атака')
    (HERE / 'index.html').write_text(html.rstrip()+'\n')
    ui = (ROOT / 'realms-ui.js').read_text()
    ui = replace_once(ui, "$('heroLevel').textContent=", "$('betaXpReadout').textContent=s.level===650?'XP · максимум':s.level===100&&!s.monolithAwakened?'Резерв: '+s.reserveXp+' XP':s.xp+' / '+R.xpGoal(s)+' XP';$('heroLevel').textContent=")
    ui = replace_once(ui, "s.xp+' / '+R.xpGoal(s)+' XP';$('heroSilver')", "$('betaXpReadout').textContent+(s.level===100&&!s.monolithAwakened?' · пробуди моноліт за перевалом':'');$('heroSilver')")
    ui = ui.replace("notice('Ти повернувся до табору. Ресурси збережено.');", "notice('Повернення: '+world.homeName()+'. Ресурси збережено.');").replace("announce('Повернення до табору')", "announce('Відродження · '+world.homeName())")
    ui = replace_once(ui, "if(expeditions.interact())return;", "const local=Object.entries(R.townTraders(world.state)).filter(([id])=>R.nearby(world.state,id)).sort((a,b)=>Math.hypot(a[1].x-world.state.x,a[1].y-world.state.y)-Math.hypot(b[1].x-world.state.x,b[1].y-world.state.y))[0];if(local&&Math.hypot(local[1].x-world.state.x,local[1].y-world.state.y)<60){panels.town(local[0]);return;}if(expeditions.interact())return;")
    ui = replace_once(ui, "if(expeditions.targetAt(p))return;", "if(world.nearCamp()&&scene.camera){const rect=canvas.getBoundingClientRect(),px=event.clientX-rect.left,py=event.clientY-rect.top;const hit=Object.entries(R.townTraders(world.state)).find(([,n])=>{const foot=scene.project(n.x,n.y,0),head=scene.project(n.x,n.y,65),width=Math.max(10,(foot.y-head.y)*.32);return Math.abs(px-foot.x)<=width&&py>=head.y&&py<=foot.y+4;});if(hit){panels.town(hit[0]);return;}}if(expeditions.targetAt(p))return;")
    ui = replace_once(ui, "+${event.xp} досвіду", "+${event.xp} ${world.state.level===100&&!world.state.monolithAwakened?'XP у резерв':'XP'}")
    ui = replace_once(ui, "hint.textContent=closest?", "const landmark=['inn','hall'].map(id=>R.CITY_LANDMARKS[id]).find(n=>Math.hypot(s.x-n.x,s.y-n.y)<105);hint.textContent=landmark&&(!closest||Math.hypot(closest[1].x-s.x,closest[1].y-s.y)>=60)?'E · '+landmark.name:closest?")
    ui = replace_once(ui, 'M.decorate(A,R);', 'M.decorate(A,R);window.HoMoWArmoryIcons.install(A,R);')
    ui = replace_once(ui, "KEY='brukivka_realms_v1'", "KEY='homow_beta_full_v1'")
    ui = ui.replace("const raw=localStorage.getItem(KEY);", "const raw=localStorage.getItem(KEY)||localStorage.getItem('brukivka_realms_v1');")
    ui = ui.replace("if(raw&&saved.schema!==2&&!localStorage.getItem('brukivka_realms_backup_v1'))localStorage.setItem('brukivka_realms_backup_v1',raw);", '')
    ui = replace_once(ui, 'const world=new R.World(saved);', 'const world=new window.HoMoWFull.World(saved);')
    ui = replace_once(ui, "  function screenToWorld(event){"+ui.split('  function screenToWorld(event){')[1].split('\n')[0], '  function screenToWorld(event){const r=canvas.getBoundingClientRect();return window.HoMoWBodyPick.pick(scene,event.clientX-r.left,event.clientY-r.top);}')
    start = ui.index('  function draw(dt){')
    end = ui.index('  function minimap()', start)
    ui = ui[:start] + '''  const scene=new window.HoMoWFull.Scene(canvas);
  window.HoMoWBetaRuntime={world,scene,save:()=>save()};
  let loadingImportedSave=false;
  window.HoMoWBetaTools.mount(world,scene,()=>keys.clear(),raw=>{
    const normalized=new window.HoMoWFull.World(raw).save();
    localStorage.setItem(KEY,JSON.stringify(normalized));
    loadingImportedSave=true;
    window.location.reload();
  });
  let pointer=null,drag=null;
  canvas.addEventListener('pointermove',e=>{pointer=e;if(drag){scene.rotate((e.clientX-drag)*.008);drag=e.clientX;}if(scene.camera)world.aimTarget=screenToWorld(e);});
  canvas.addEventListener('pointerleave',()=>{pointer=null;world.aimTarget=null;drag=null;});
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  canvas.addEventListener('pointerdown',e=>{if(e.button===2){drag=e.clientX;canvas.setPointerCapture(e.pointerId);}});
  canvas.addEventListener('pointerup',()=>drag=null);
  canvas.addEventListener('wheel',e=>{e.preventDefault();scene.magnify(e.deltaY>0?.94:1.06);},{passive:false});
  function draw(dt){
    scene.render(world,effects);camera.x=scene.cx-viewWidth/2;camera.y=scene.cz-viewHeight/2;
    if(pointer)world.aimTarget=screenToWorld(pointer);
    window.BrukRealmsMetrics.visible=scene.visible;
    for(let i=effects.length-1;i>=0;i--){effects[i].life-=dt;if(effects[i].life<=0)effects.splice(i,1);}
  }
''' + ui[end:]
    ui = replace_once(ui, "if(target)world.selectMonster(target.id);", "if(target){world.aimTarget=p;world.attack();}")
    ui = ui.replace("else notice('Рух — WASD або стрілки. E — взаємодія поруч.');", "else{world.aimTarget=p;world.attack();}")
    # Aim on every left click, after non-combat interaction checks.
    ui = ui.replace("const target=world.monsters.filter", "world.aimTarget=p;const target=world.monsters.filter")
    # Apply camera-relative axes to the existing simulation (all collisions unchanged).
    ui = replace_once(ui, 'world.update(step,{x,y,attack:', 'world.update(step,{...window.HoMoWCamera3D.movement(x,y,scene.yaw),attack:')
    ui = replace_once(ui, "attack:keys.has('Space')", 'attack:false')
    ui = replace_once(ui, "'Space',", '')
    ui = ui.replace("const running=!(profile.open()", "const running=!(document.querySelector('dialog[open]')||profile.open()")
    ui = replace_once(ui, 'function save(){', 'function save(){if(loadingImportedSave)return true;')
    ui = replace_once(ui, 'if(running){const x=', 'if(!running||!dt)world.syncEncounter();if(running){const x=')
    ui = ui.replace("window.BrukRelease.version", "(window.BrukRelease.version+' · бета')")
    ui = ui.replace("})();", "document.querySelectorAll('#gameLocale option:not([value=uk])').forEach(el=>el.remove());document.documentElement.lang='uk';document.querySelector('.homow-download')?.setAttribute('href','../homow.html');})();")
    (HERE / 'client.js').write_text('// Generated by beta/build.py; edit canonical UI or this generator.\n'+ui.rstrip()+'\n')

if __name__ == '__main__': build()
