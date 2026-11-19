"""Generate beta-only client/HTML from canonical sources without editing them."""
from pathlib import Path
import re
HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
VERSION = '0.10.0'

def replace_once(text, old, new):
    if text.count(old) != 1:
        raise ValueError('Canonical source changed: ' + old[:90])
    return text.replace(old, new, 1)

def build():
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
    html = re.sub(r'src="../realms-ui\.js[^"]*"', 'src="client.js?v='+VERSION+'"', html)
    html = re.sub(r'src="../homow-options\.js[^"]*"', 'src="options.js?v='+VERSION+'"', html)
    options = (ROOT / 'homow-options.js').read_text().replace("KEY='homow_options_v1'", "KEY='homow_beta_options_v1'").replace("['uk','en','de','pt'].includes(r.locale)", "r.locale==='uk'")
    (HERE / 'options.js').write_text(options)
    atlas = (HERE / 'atlas-source.js').read_text()
    footer = "c.restore();c.fillStyle='#152324dc';c.fillRect(0,bh-16,bw,16);c.fillStyle='#f1dfb0';c.font='9px system-ui';c.textAlign='center';c.fillText(dungeon?dungeon.name:cluster.name+' · T'+cluster.tier,bw/2,bh-5);"
    atlas = atlas.replace(footer, 'c.restore();')
    (HERE / 'atlas.js').write_text(atlas)
    html = re.sub(r'src="../homow-atlas\.js[^"]*"', 'src="atlas.js?v='+VERSION+'"', html)
    html = html.replace('<head>', '<head><script src="asset-paths.js?v='+VERSION+'"></script>')
    music = (ROOT / 'homow-music.js').read_text().replace(':track.src;', ':window.HoMoWBetaAsset(track.src);').replace("O.set({score:5,volume:.05,music:true});", "").replace('audio.volume=.05','audio.volume=O.get().volume').replace('if(audio)audio.volume=.05','if(audio)audio.volume=O.get().volume')
    (HERE / 'music.js').write_text(music)
    html = re.sub(r'src="../homow-music\.js[^"]*"', 'src="music.js?v='+VERSION+'"', html)
    html = re.sub(r'src="../release\.js[^"]*"', 'src="release.js?v='+VERSION+'"', html)
    (HERE / 'release.js').write_text("window.BrukRelease=Object.freeze({version:'"+VERSION+"',date:'2026-11-19',name:'3D-бета'});document.querySelectorAll('[data-game-version]').forEach(el=>el.textContent='v"+VERSION+" · БЕТА');document.title='HoMoW · 3D-бета "+VERSION+"';\n")
    inventory = (ROOT / 'homow-inventory.js').read_text()
    start = inventory.index('function preview(')
    end = inventory.index('function change(', start)
    inventory = inventory[:start] + "function preview(parent,appearance=world.state.appearance){window.HoMoWPortrait(parent,world,appearance); }\n" + inventory[end:]
    inventory = inventory.replace("!world.nearCamp()||world.state.silver<m.cost", "!R.serviceAllowed(world,'buyMount')||world.state.silver<m.cost")
    inventory = inventory.replace('art.innerHTML=mountIcon(id);', 'window.HoMoWPortrait(art,world,world.state.appearance,id);')
    inventory = inventory.replace("const owned=world.state.mounts[id],card=", "const owned=world.state.mounts[id],card=")
    inventory = inventory.replace("card.dataset.mountId=id;", "if(!owned)card.append(el('small','mount-status',!R.serviceAllowed(world,'buyMount')?'Підійди до інтенданта · скакуни та припаси':world.state.silver<m.cost?'Бракує срібла: '+(m.cost-world.state.silver).toLocaleString('uk-UA'):'Доступний для придбання'));card.dataset.mountId=id;")
    (HERE / 'inventory.js').write_text(inventory)
    html = re.sub(r'src="../homow-inventory\.js[^"]*"', 'src="inventory.js?v='+VERSION+'"', html)
    html = html.replace('</head>', '<link rel="stylesheet" href="inventory.css?v='+VERSION+'"></head>')
    html = html.replace('</head>', '<link rel="stylesheet" href="world.css?v='+VERSION+'"></head>')
    html = html.replace('<body>', '<body><aside class="beta-banner">3D-бета '+VERSION+' · Повний світ · Локальна перевірка <a href="../">Основна гра</a></aside>')
    html = html.replace('<script src="client.js', '<script src="camera3d.js?v='+VERSION+'"></script><script src="scene3d.js?v='+VERSION+'"></script><script src="world.js?v='+VERSION+'"></script><script src="skills.js?v='+VERSION+'"></script><script src="world-style.js?v='+VERSION+'"></script><script src="world-art.js?v='+VERSION+'"></script><script src="creature-art.js?v='+VERSION+'"></script><script src="motion.js?v='+VERSION+'"></script><script src="mount-art.js?v='+VERSION+'"></script><script src="world-scene.js?v='+VERSION+'"></script><script src="portrait.js?v='+VERSION+'"></script><script src="tools.js?v='+VERSION+'"></script><script src="client.js')
    html = html.replace('Hold Monsters World · HoMoW', 'HoMoW · Повний світ · 3D-бета '+VERSION)
    html = html.replace('пробіл — атака', 'ЛКМ — атака')
    (HERE / 'index.html').write_text(html.rstrip()+'\n')
    ui = (ROOT / 'realms-ui.js').read_text()
    ui = replace_once(ui, "KEY='brukivka_realms_v1'", "KEY='homow_beta_full_v1'")
    ui = ui.replace("const raw=localStorage.getItem(KEY);", "const raw=localStorage.getItem(KEY)||localStorage.getItem('brukivka_realms_v1');")
    ui = ui.replace("if(raw&&saved.schema!==2&&!localStorage.getItem('brukivka_realms_backup_v1'))localStorage.setItem('brukivka_realms_backup_v1',raw);", '')
    ui = replace_once(ui, 'const world=new R.World(saved);', 'const world=new window.HoMoWFull.World(saved);')
    ui = replace_once(ui, "  function screenToWorld(event){"+ui.split('  function screenToWorld(event){')[1].split('\n')[0], '  function screenToWorld(event){const r=canvas.getBoundingClientRect();return scene.pick(event.clientX-r.left,event.clientY-r.top);}')
    start = ui.index('  function draw(dt){')
    end = ui.index('  function minimap()', start)
    ui = ui[:start] + '''  const scene=new window.HoMoWFull.Scene(canvas);
  window.HoMoWBetaRuntime={world,scene,save:()=>save()};
  window.HoMoWBetaTools.mount(world,scene,()=>keys.clear());
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
    ui = ui.replace("window.BrukRelease.version", "'0.10.0 · бета'")
    ui = ui.replace("})();", "document.querySelectorAll('#gameLocale option:not([value=uk])').forEach(el=>el.remove());document.documentElement.lang='uk';document.querySelector('.homow-download')?.setAttribute('href','../homow.html');})();")
    (HERE / 'client.js').write_text('// Generated by beta/build.py; edit canonical UI or this generator.\n'+ui.rstrip()+'\n')

if __name__ == '__main__': build()
