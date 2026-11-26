const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const R=require('../realms-core.js'),{World}=require('./world.js');
test('beta shares all canonical world content and save schema',()=>{const a=new World({}, Math.random, () => 120000),b=new R.World();const {betaProgression,reserveXp,homeTown,...shared}=a.state;assert.deepEqual(shared,b.state);assert.equal(homeTown,'village');assert.equal(a.monsters.length,141);assert.equal(a.nodes.length,190);assert.equal(R.CLUSTERS.length,12);assert.equal(R.DUNGEONS.length,3);a.creditSilver(12345);a.state.kills.slime=5;a.gainXp(300);const save=a.save();assert.deepEqual(new World(save).state,a.state);assert.equal(new R.World(save).state.silver,12345);});
test('beta manual attacks miss behind the aim and preserve exact damage and cooldown',()=>{const w=new World(),m=w.monsters[0];w.state.x=m.x-35;w.state.y=m.y;w.aimTarget={x:w.state.x-500,y:w.state.y};const hp=m.hp;assert(w.attack());assert.equal(m.hp,hp);assert(!w.attack());w.attackCooldown=0;w.aimTarget={x:w.state.x+500,y:w.state.y};assert(w.attack());assert(m.hp<hp);assert.deepEqual(w.facing,{x:1,y:0});});
test('beta ranged attacks use cursor direction with canonical mana and damage',()=>{const w=new World();w.state.weaponKind='staff';w.state.mana=100;w.aimTarget={x:w.state.x,y:w.state.y-300};w.attack();assert.equal(w.state.mana,94);assert.equal(w.projectiles.length,1);assert(Math.abs(w.projectiles[0].vx)<1e-8);assert(w.projectiles[0].vy<0);});
test('walking ignores cursor and canonical house collisions remain effective',()=>{const w=new World({x:130,y:220});w.aimTarget={x:-500,y:-500};for(let i=0;i<120;i++)w.update(.05,{x:1});assert(w.state.x<136);assert(w.facing.x>0);assert.equal(w.facing.y,0);});
test('beta page uses canonical UI and isolated saves without online or cloud writes',()=>{const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8'),js=fs.readFileSync(path.join(__dirname,'client.js'),'utf8');assert(html.includes('Локальна перевірка'));assert(!html.includes('src="../homow-online.js'));assert(!html.includes('src="../homow-cloud.js'));assert(!html.includes('achievement-events.js'));assert(js.includes("KEY='homow_beta_full_v1'"));assert(!js.includes('setItem(\'brukivka_realms'));for(const id of ['inventoryDialog','masteryDialog','merchantDialog','mapDialog'])assert(html.includes('id="'+id+'"'));for(const m of html.matchAll(/(?:src|href)="([^"?#]+)(?:\?[^"#]*)?"/g))if(!m[1].startsWith('http'))assert(fs.existsSync(path.resolve(__dirname,m[1])),m[1]);});

test('canonical full UI boots and renders all clusters with software 3D without runtime errors',async()=>{
 const {parseHTML}=await import('linkedom'),{window}=parseHTML(fs.readFileSync(path.join(__dirname,'index.html'),'utf8')),document=window.document;Object.defineProperty(document,'baseURI',{value:'http://localhost/beta/'});
 const noop=()=>{},gradient={addColorStop:noop},ctx=new Proxy({measureText:t=>({width:String(t).length*7}),createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:noop});
 window.HTMLElement.prototype.getBoundingClientRect=()=>({x:0,y:0,left:0,top:0,width:1000,height:660});
 window.HTMLCanvasElement.prototype.getContext=function(type){return type==='webgl'?null:ctx;};
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return this.querySelector('option[selected]')?.getAttribute('value')||'';},set(value){for(const o of this.querySelectorAll('option'))o.toggleAttribute('selected',o.getAttribute('value')===value);}});
 window.HTMLElement.prototype.showModal=function(){this.setAttribute('open','');};window.HTMLElement.prototype.close=function(){this.removeAttribute('open');};Object.defineProperty(window.HTMLElement.prototype,'open',{configurable:true,get(){return this.hasAttribute('open');}});
 const storage=new Map(),pending=[];
 const env={document,console,performance,Intl,URL,URLSearchParams,location:{href:'http://localhost/beta/full/',search:'',origin:'http://localhost',pathname:'/beta/full/'},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},sessionStorage:{getItem:()=>null,removeItem:noop},devicePixelRatio:1,innerWidth:1000,innerHeight:660,matchMedia:()=>({matches:false,addEventListener:noop}),Blob,requestAnimationFrame:fn=>{pending.push(fn);return pending.length;},cancelAnimationFrame:noop,setTimeout:()=>1,clearTimeout:noop,setInterval:()=>1,clearInterval:noop,addEventListener:noop,dispatchEvent:noop,CustomEvent:window.CustomEvent,ResizeObserver:class{observe(){}},Audio:class{addEventListener(){}pause(){}load(){}play(){return Promise.resolve();}},getComputedStyle:()=>({getPropertyValue:()=>'',display:'block'})};env.NodeFilter={SHOW_ELEMENT:1,SHOW_TEXT:4};env.Node=window.Node;env.Element=window.Element;env.HTMLElement=window.HTMLElement;env.MutationObserver=window.MutationObserver;env.window=env;env.navigator={userAgent:'test desktop',hardwareConcurrency:4};const context=vm.createContext(env);
 let oreSnapshot;for(const match of document.querySelectorAll('script[src]')){const src=match.getAttribute('src').split('?')[0],file=path.resolve(__dirname,src);if(src==='resource-layout.js')oreSnapshot=env.BrukRealmsData.NODES.map(n=>({id:n.id,type:n.type,cluster:env.BrukRealmsData.clusterOf(n)}));vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});}
 assert(env.HoMoWBetaRuntime);
 for(const kind of Object.keys(R.FAMILIES)){for(const skill of R.SKILL_CHOICES[kind]){const sample=new env.HoMoWFull.World();sample.state.weaponKind=kind;sample.state.weaponSkills[kind]=skill.id;sample.state.mana=100;sample.aimTarget={x:sample.state.x+90,y:sample.state.y};const enemy=sample.monsters[0];enemy.x=sample.state.x+65;enemy.y=sample.state.y;enemy.alive=true;assert(sample.skill().ok,kind+':'+skill.id);}}
 const {world,scene}=env.HoMoWBetaRuntime;assert.equal(world.monsters.filter(m=>m.encounterSlot===undefined).length,141+env.HoMoWMaze.plainSpawns.length);assert.equal(world.nodes.length,190);
 const betaR=env.BrukRealms;
 assert.equal(oreSnapshot.length,world.nodes.length);for(const original of oreSnapshot){const n=world.nodes.find(n=>n.id===original.id);assert.equal(n.type,original.type);assert.equal(betaR.clusterOf(n),betaR.inVillage(n.x,n.y)?'village':original.cluster,'resource keeps region '+n.id);}
 {
   const pass=betaR.PASS,entrance=betaR.PORTALS.find(p=>p.x===pass.x&&p.y>pass.y&&p.y<pass.y+pass.h);
   const fight=new env.HoMoWFull.World({},()=>.5,()=>300000);
   const boss=fight.monsters.find(m=>m.type==='pass_guardian'),radius=betaR.TYPES[boss.type].radius;
   assert(boss.x-radius>pass.x&&boss.x+radius<pass.barrierX);
   assert(boss.y-radius>pass.y&&boss.y+radius<pass.y+pass.h);
   Object.assign(fight.state,{x:entrance.x-70,y:entrance.y});
   fight.moveEntity(fight.state,boss.x-68-fight.state.x,boss.y-fight.state.y);
   assert.equal(betaR.clusterOf(fight.state),betaR.clusterOf(boss));
   const from={x:fight.state.x,y:fight.state.y};
   fight.moveEntity(fight.state,500,0);assert(fight.state.x<pass.barrierX);
   Object.assign(fight.state,from);scene.render(fight);
   const chest=scene.project(boss.x,boss.y,65),aim=env.HoMoWBodyPick.pick(scene,chest.x,chest.y);
   assert(Math.hypot(aim.x-boss.x,aim.y-boss.y)<radius,'cursor hits the raised chest');
   fight.aimTarget=aim;const previous=boss.hp;assert(fight.attack());assert(boss.hp<previous);
   for(let i=0;i<70;i++)fight.moveEntity(boss,6,0,radius);
   assert(boss.x+radius<pass.barrierX,'boss stays on the accessible side');
   const old=fight.save();old.mobState[boss.id]={hp:1,readyAt:0};old.passUnlocked=false;
   const restored=new env.HoMoWFull.World(old,()=>.5,()=>300000),target=restored.monsters[boss.id];
   assert.equal(target.hp,1);assert.equal(target.homeX,boss.homeX);
   restored.aimTarget={x:target.x,y:target.y};assert(restored.attack());assert(!target.alive);
   assert(restored.state.passUnlocked);restored.moveEntity(restored.state,440,0);assert(restored.state.x>pass.barrierX);
   const again=new env.HoMoWFull.World(restored.save());assert(again.state.passUnlocked);assert(!again.monsters[boss.id].alive);
 }
 const ores=world.nodes.filter(n=>betaR.NODE_TYPES[n.type].tool==='pickaxe');for(const n of ores){assert(!betaR.inVillage(n.x,n.y)&&!betaR.inCity(n.x,n.y),'ore outside towns '+n.id);assert(!betaR.blocked(n.x,n.y,30),'ore clear '+n.id);assert(betaR.PORTALS.every(p=>Math.hypot(p.x-n.x,p.y-n.y)>150),'portal access '+n.id);}

 const L=env.HoMoWLayout;assert.equal(L.report.nodes,190);assert.equal(L.report.spawns,141+env.HoMoWMaze.plainSpawns.length);
 assert(!betaR.blocked(betaR.BILLBOARD.x,betaR.BILLBOARD.y,85),'open billboard square');assert(betaR.findPath(betaR.CAMP.x,betaR.CAMP.y,betaR.BILLBOARD.x,betaR.BILLBOARD.y).length,'path to board');
 for(const n of world.nodes){assert(L.free(n,50),'clear resource '+n.id);if(!betaR.clusterOf(n).startsWith('dungeon:'))assert(L.roadFree(n,64),'resource off road '+n.id);assert(L.gateFree(n,180),'resource off gate '+n.id);}
 for(const m of world.monsters.filter(m=>!betaR.clusterOf(m).startsWith('dungeon:'))){const r=betaR.TYPES[m.type].radius;assert(L.free(m,r+20),'clear mob camp '+m.id);assert(!betaR.inVillage(m.x,m.y)&&!betaR.inCity(m.x,m.y));if(m.type!=='pass_guardian')assert(L.gateFree(m,235),'camp off gate '+m.id);assert(world.nodes.every(n=>Math.hypot(n.x-m.x,n.y-m.y)>r+85),'camp off resource '+m.id);}
 for(const region of env.HoMoWEncounterSites){
   const locals=new Set(betaR.SPAWNS.filter(([type,x,y])=>betaR.clusterOf({x,y})===region.cluster&&!betaR.TYPES[type].boss&&!betaR.TYPES[type].elite).map(s=>s[0]));
   assert(region.types.every(t=>locals.has(t)));
   const radius=Math.max(...region.types.map(t=>betaR.TYPES[t].radius));
   for(const site of region.sites){
     assert.equal(site.length,3);
     for(const p of site){
       assert.equal(betaR.clusterOf(p),region.cluster);
       assert(!betaR.inVillage(p.x,p.y)&&!betaR.inCity(p.x,p.y)&&!region.cluster.startsWith('dungeon:'));
       assert(L.free(p,radius+24)&&L.gateFree(p,235)&&L.roadFree(p,85));
       assert(world.nodes.every(n=>Math.hypot(n.x-p.x,n.y-p.y)>=radius+90));
       assert(site.every(q=>q===p||Math.hypot(p.x-q.x,p.y-q.y)>2*radius+25));
     }
   }
 }
 const probe=world.monsters.find(m=>!betaR.clusterOf(m).startsWith('dungeon:')),home={x:probe.x,y:probe.y};const deposit=world.nodes.find(n=>betaR.clusterOf(n)===betaR.clusterOf(probe)&&L.free({x:n.x-85,y:n.y},30));assert(deposit);probe.x=deposit.x-85;probe.y=deposit.y;for(let i=0;i<80;i++){const dx=deposit.x-probe.x,dy=deposit.y-probe.y,len=Math.hypot(dx,dy)||1;world.moveEntity(probe,dx/len*5,dy/len*5,1);assert(Math.hypot(probe.x-deposit.x,probe.y-deposit.y)>betaR.TYPES[probe.type].radius+31,'mob never enters resource');}Object.assign(probe,home);
 for(const h of betaR.HOUSES)assert(betaR.blocked(h.x+h.w/2,h.y+h.h/2),'house collider '+h.owner);
 for(const n of Object.values(betaR.TRADERS)){assert(betaR.PORTALS.every(p=>Math.hypot(p.x-n.x,p.y-n.y)>=195),'merchant interaction stays outside crossing range '+n.name);assert(!betaR.blocked(n.x,n.y,18),'NPC access '+n.name);const path=betaR.findPath(betaR.SPAWN.x,betaR.SPAWN.y,n.x,n.y);assert(path.length&&Math.hypot(path.at(-1).x-n.x,path.at(-1).y-n.y)<65,'route to '+n.name);}
 for(const n of world.nodes.filter(n=>betaR.inVillage(n.x,n.y)))assert(!betaR.blocked(n.x,n.y,15),'resource access '+n.id);
 scene.render(world);const cached=scene.cachedFaces;scene.render(world);assert.equal(scene.cachedFaces,cached,'software geometry cache reused');world.nodes[0].charges--;scene.render(world);assert.notEqual(scene.cachedFaces,cached,'resource change invalidates software cache');const rawDraw=scene.draw.bind(scene);scene.draw=(kind,x,y,z,sx,sy,sz,...args)=>{assert([x,y,z,sx,sy,sz].every(Number.isFinite),'finite '+kind);return rawDraw(kind,x,y,z,sx,sy,sz,...args);};
 const modelSignatures=new Set();let geometry=[];const validatedDraw=scene.draw;scene.draw=(...args)=>{geometry.push(args);return validatedDraw(...args);};for(const type of Object.keys(betaR.TYPES)){geometry=[];scene.faces=[];scene.creature({type,x:500,y:500,facing:{x:0,y:1},walking:true,footstep:1,alive:true},1);assert(scene.faces.length>0,type);modelSignatures.add(JSON.stringify(geometry));}assert.equal(modelSignatures.size,Object.keys(betaR.TYPES).length,'distinct rendered mob models');
 for(const type of Object.keys(betaR.NODE_TYPES)){scene.faces=[];scene.resource({id:1,type,x:500,y:500,charges:3},1);assert(scene.faces.length>0,type);}

 const silhouettes=new Set();
 for(const [id,variant] of Object.entries(betaR.VARIANTS)){
   const appearances=new Set();
   for(let tier=0;tier<=betaR.MAX_TIER;tier++){
     for(let enchant=0;enchant<=8;enchant++){
       const state={...world.state,weaponKind:variant.family,weaponVariant:id,variantArsenal:{[id]:tier},enchantments:{['variant:'+id]:enchant}};
       geometry=[];
       scene.faces=[];
       scene.hero({...world,state});
       const signature=JSON.stringify(geometry);
       appearances.add(signature);
       if(!tier&&!enchant)silhouettes.add(signature);
     }
   }
   assert.equal(appearances.size,(betaR.MAX_TIER+1)*(betaR.MAX_ENCHANT+1),id+' tier and enchant appearances');
 }
 assert.equal(silhouettes.size,18,'unique weapon models');
 for(const area of R.CLUSTERS){world.state.x=area.x+area.w/2;world.state.y=area.y+area.h/2;scene.render(world);assert(scene.visible>=0);assert(Number.isFinite(scene.camera.cx));}for(const id of Object.keys(R.VARIANTS)){world.state.weaponVariant=id;world.state.weaponKind=R.VARIANTS[id].family;scene.render(world);}for(const id of Object.keys(R.MOUNTS)){world.state.mounted=true;world.state.selectedMount=id;scene.render(world);}world.state.mounted=false;
 assert(env.HoMoWGeography.borders.length>50);for(const b of env.HoMoWGeography.borders)assert(betaR.PORTALS.every(p=>Math.hypot(p.x-b.x,p.y-b.y)>=195),'clear crossing');const trees=new Set();for(let i=0;i<12;i++){geometry=[];scene.treeModel(500,500,2,1,true,'forest',i);trees.add(JSON.stringify(geometry));}assert(trees.size>=6,'tree silhouettes and sizes');assert.equal(betaR.CLUSTERS.length,13);assert.equal(betaR.clusterOf(betaR.SPAWN),'village');assert.equal(betaR.PORTALS.filter(p=>p.village).length,4);
 for(const p of betaR.PORTALS.filter(p=>p.village)){for(const entering of [false,true]){world.lastCombat=-100;world.time=100;world.duelActive=false;const sign=p.axis==='x'?(p.x===betaR.VILLAGE.x?1:-1):(p.y===betaR.VILLAGE.y?1:-1);world.state.x=p.x+(p.axis==='x'?sign*(entering?-25:25):0);world.state.y=p.y+(p.axis==='y'?sign*(entering?-25:25):0);const result=world.crossCluster(p.id);assert(result.ok,p.id+':'+result.message);assert.equal(betaR.clusterOf(world.state),entering?'village':'c00');}}
 Object.assign(world.state,betaR.SPAWN);document.getElementById('inventoryAction').click();assert(document.getElementById('inventoryDialog').open);assert(document.querySelector('.pack-preview'));document.querySelector('[data-pack-tab=mounts]').click();assert.equal(document.querySelectorAll('.mount-preview').length,4);const mounts=new Set();for(const id of Object.keys(betaR.MOUNTS)){geometry=[];scene.mountModel({state:{x:500,y:500,selectedMount:id},facing:{x:0,y:1},walking:true,footstep:.5});mounts.add(JSON.stringify(geometry));}assert.equal(mounts.size,4);const oldCoins=world.state.silver;world.state.silver=20000;world.state.x=betaR.TRADERS.quartermaster.x;world.state.y=betaR.TRADERS.quartermaster.y;const bought=world.buyMount('donkey');assert(bought.ok,JSON.stringify({bought,xy:[world.state.x,world.state.y],v:betaR.VILLAGE,owned:world.state.mounts,near:world.nearCamp()}));assert.equal(world.state.silver,19650);assert(world.state.mounts.donkey);assert(new env.HoMoWFull.World(world.save()).state.mounts.donkey);world.state.silver=oldCoins;document.querySelector('[data-pack-tab=appearance]').click();assert.equal(document.querySelectorAll('.appearance-controls select').length,6);document.getElementById('closeInventory').click();document.getElementById('masteryAction').click();assert(document.getElementById('masteryDialog').open);assert(document.querySelector('.destiny-viewport'));
 const board=document.getElementById('masteryContent'),points=betaR.talentPoints(world.state),gold=world.state.silver;
 const press=(parent,label)=>[...parent.querySelectorAll('button')].find(b=>b.textContent===label).click();
 assert.equal(board.dataset.view,'overview');assert(board.querySelector('[data-node=hero]'));
 assert.equal(board.querySelectorAll('[data-node^="branch-"]').length,8);assert.equal(board.querySelectorAll('[data-node^="talents-"]').length,3);
 board.querySelector('[data-node=talents-0]').click();
 assert.equal(board.dataset.view,'branch');assert(board.querySelector('[data-node=talent-vitality]'));
 assert(board.querySelector('[data-node=talent-guard]').textContent.includes('Стійка захисника'));
 assert.equal(betaR.talentPoints(world.state),points);assert.equal(world.state.silver,gold);
 world.state.level=8;const available=betaR.talentPoints(world.state);assert(available>0,'level 8 grants talent points');board.querySelector('[data-node=talent-vitality]').click();
 assert(board.querySelector('.destiny-detail').textContent.includes('Міцність'));
 board.querySelector('[data-talent=vitality]').click();
 assert.equal(world.state.talents.vitality,1);assert.equal(betaR.talentPoints(world.state),available-1);
 assert.equal(world.state.silver,gold);document.getElementById('closeMastery').click();
 const city=betaR.townTraders(betaR.CITY_LANDMARKS.inn),entry={x:7067,y:2590};
 for(const place of [...Object.values(city),betaR.CITY_LANDMARKS.inn,betaR.CITY_LANDMARKS.hall]){
   assert(!betaR.blocked(place.x,place.y,17));const walk=betaR.findPath(entry.x,entry.y,place.x,place.y);
   assert(walk.length&&Math.hypot(walk.at(-1).x-place.x,walk.at(-1).y-place.y)<20);
 }
 for(const [slot,items] of Object.entries({variant:betaR.VARIANTS,armor:betaR.ARMOR_KINDS,outfit:betaR.OUTFITS,support:betaR.SUPPORTS,extra:betaR.EXTRAS})){
   for(const kind of Object.keys(items)){
     const sellers=Object.keys(city).filter(id=>betaR.traderStock(id,slot,kind));assert.equal(sellers.length,1,kind);
     const owner=city[sellers[0]];assert(betaR.serviceAllowed({state:{...owner}},'buyGear',[slot,kind,false]),kind);
   }
 }
 world.state.passUnlocked=true;Object.assign(world.state,{x:city.enchanter.x,y:city.enchanter.y});
 document.getElementById('merchantAction').click();assert.equal(document.getElementById('merchantStock').dataset.trader,'enchanter');
 world.state.silver=5000;world.state.bank.crystal=15;world.state.bank.mithril_ingot=10;
 document.getElementById('closeMerchant').click();document.getElementById('merchantAction').click();
 const enchant=document.querySelector('[data-enchant="variant:sword_broadsword"]');assert(enchant&&!enchant.disabled);enchant.click();
 assert.equal(betaR.enchantLevel(world.state,'variant','sword_broadsword'),1);document.getElementById('closeMerchant').click();
 Object.assign(world.state,betaR.CITY_LANDMARKS.inn);document.getElementById('merchantAction').click();
 press(document.getElementById('expeditionDialog'),'Прив’язати відродження тут');assert.equal(world.state.homeTown,'city');
 document.getElementById('expeditionDialog').close();

 for(const point of [{x:15,y:15},{x:betaR.WIDTH-15,y:15},{x:15,y:betaR.HEIGHT-15},{x:betaR.WIDTH-15,y:betaR.HEIGHT-15}]){Object.assign(world.state,point);scene.render(world);assert(scene.cx>=100&&scene.cx<=betaR.WIDTH-100);assert(scene.cz>=100&&scene.cz<=betaR.HEIGHT-100);}
 assert(!storage.has('brukivka_realms_v1'));const before=world.state.x;pending.shift()(1000);pending.shift()(4500);assert(storage.has('homow_beta_full_v1'));assert(!storage.has('brukivka_realms_v1'));
 const originalFlush=scene.flush;
 let previews=0;
 scene.flush=function(transparent){
   if(transparent){
     previews++;
     for(const face of this.faces)for(const point of face.pts){
       assert(point.x>=0&&point.x<=this.width&&point.y>=0&&point.y<=this.height,'equipment stays inside portrait');
     }
   }
   return originalFlush.call(this,transparent);
 };
 world.state.weaponVariant='sword_claymore';world.state.weaponKind='sword';
 world.state.variantArsenal.sword_claymore=12;world.state.enchantments['variant:sword_claymore']=7;
 const holder=document.createElement('div');env.HoMoWPortrait(holder,world,world.state.appearance);
 for(let i=0;i<8;i++){
   const key=new window.Event('keydown');key.key='ArrowRight';holder.querySelector('canvas').dispatchEvent(key);
 }
 assert.equal(previews,9);scene.flush=originalFlush;

 let clock=600_100;world.wallClock=()=>clock;world.syncEncounter();
 document.getElementById('mapAction').click();
 const status=document.getElementById('encounterStatus');
 assert.equal(status.dataset.active,'true');assert(status.textContent.includes('2:00'));
 const pausedAt=world.time;
 clock=720_000;pending.shift()(5500);
 assert.equal(world.time,pausedAt);assert.equal(world.encounter,null);
 document.getElementById('closeMap').click();document.getElementById('mapAction').click();
 assert.equal(status.dataset.active,'false');assert(status.textContent.includes('8:00'));
 document.getElementById('closeMap').click();

 const transferred=world.save();transferred.silver=7788;
 const json=JSON.stringify({state:transferred});let reloads=0;
 env.location.reload=()=>reloads++;
 await document.getElementById('betaImport').onchange({target:{files:[{size:json.length,text:async()=>json}]}});
 assert.equal(reloads,1);env.HoMoWBetaRuntime.save();
 assert.equal(JSON.parse(storage.get('homow_beta_full_v1')).silver,7788,'incoming save survives pagehide autosave');
});

test('beta uses Ukrainian even with an old foreign locale, without changing stable preferences',()=>{const O=require('./options.js');assert.equal(O.KEY,'homow_beta_options_v1');for(const locale of ['uk','en','de','pt'])assert.equal(O.normalize({locale}).locale,'uk');const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');const version=fs.readFileSync(path.join(__dirname,'release.js'),'utf8').match(/version:'([^']+)'/)[1];assert(html.includes('src="options.js?v='+version+'"'));assert(!html.includes('src="../homow-options.js'));});

test('a swing keeps its aim during movement and pointer changes',()=>{const w=new World();w.monsters=[];w.aimTarget={x:w.state.x,y:w.state.y-100};w.attack();const facing={...w.facing};w.aimTarget={x:w.state.x+100,y:w.state.y};w.update(.05,{x:1});assert.deepEqual(w.facing,facing);for(let i=0;i<8;i++)w.update(.05,{x:1});assert(w.facing.x>0);});

test('beta minimap draws markers without text while the atlas keeps region names',()=>{let labels=[];const noop=()=>{},gradient={addColorStop:noop},ctx=new Proxy({fillText:(text)=>labels.push(text),createRadialGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:noop}),env={window:{BrukRealms:R}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'atlas.js'),'utf8'),env);const w=new World();env.window.HoMoWAtlas.mini(ctx,{width:175,height:120},w,{});assert.equal(labels.length,0);env.window.HoMoWAtlas.full(ctx,{width:1000,height:688},w);assert(labels.length>0);});
test('shaded atlas caches terrain, draws landmarks and keeps every map coordinate finite',()=>{
 let builds=0;
 class Surface{constructor(width,height){this.width=width;this.height=height;}getContext(){return{createImageData(width,height){builds++;return{data:new Uint8ClampedArray(width*height*4)};},putImageData(){}};}}
 const calls=[],gradient={addColorStop(...args){calls.push(['gradient',...args]);}},target={fillText(...args){calls.push(['fillText',...args]);},createRadialGradient(...args){calls.push(['createRadialGradient',...args]);return gradient;}};
 const ctx=new Proxy(target,{get:(object,key)=>key in object?object[key]:(...args)=>calls.push([key,...args]),set:(object,key,value)=>{object[key]=value;calls.push(['set:'+key,value]);return true;}});
 const road=[{x:500,y:470},{x:1500,y:700}],data={...R,OBSTACLES:[...R.OBSTACLES,{type:'tree',betaKind:'oak',x:800,y:800,w:40,h:40},{type:'water',x:1200,y:700,w:200,h:120}]},env={BrukRealms:data,HoMoWGeography:{landscape:{road:'b3a68a',roadEdge:'928870',water:'759b94',shore:'586d5b',shallow:'698780'},borders:[{x:2000,y:800,vertical:true,kind:'ridge'}],roads:new Map([['test',[road]]])},OffscreenCanvas:Surface};env.window=env;vm.createContext(env);vm.runInContext(fs.readFileSync(path.join(__dirname,'atlas.js'),'utf8'),env);
 const w=new World();w.encounter={members:[{alive:true,x:900,y:700}],endsAt:120000};w.wallClock=()=>0;
 const mini={width:175,height:120};env.HoMoWAtlas.mini(ctx,mini,w,{});assert.equal(builds,1);assert.equal(calls.filter(a=>a[0]==='fillText').length,0);assert(calls.some(a=>a[0]==='set:fillStyle'&&a[1]==='#759b94'));assert(calls.some(a=>a[0]==='set:fillStyle'&&a[1]==='#4d684d'));
 env.HoMoWAtlas.mini(ctx,mini,w,{});assert.equal(builds,1,'stationary minimap reuses its terrain tile');w.state.x+=1800;env.HoMoWAtlas.mini(ctx,mini,w,{});assert.equal(builds,2,'crossing terrain tiles refreshes the cache');
 const full={width:400,height:275};env.HoMoWAtlas.full(ctx,full,w,{resources:false,enemies:false});assert.equal(builds,3);env.HoMoWAtlas.full(ctx,full,w,{resources:false,enemies:false});assert.equal(builds,3,'full world map reuses its terrain tile');
 const labels=calls.filter(a=>a[0]==='fillText').map(a=>a[1]);assert(labels.some(text=>String(text).includes('Мідні вершини')));assert(labels.some(text=>String(text)==='II'||String(text)==='VIII'));
 const finite=value=>typeof value!=='number'||Number.isFinite(value);assert(calls.every(call=>call.slice(1).every(value=>Array.isArray(value)?value.every(finite):finite(value))),'canvas never receives NaN or infinity');
});

test('atlas banners avoid dense markers without moving resources or covering their own title badges',()=>{
 const banners=[],markers=[],labels=[],noop=()=>{},target={createRadialGradient:()=>({addColorStop:noop}),roundRect(x,y,width,height){if(['#e4d6af','#c4c4a7'].includes(this.fillStyle))banners.push({left:x,top:y,right:x+width,bottom:y+height});},rect(x,y,width,height){if(this.fillStyle==='#ff00ff')markers.push({left:x,top:y,right:x+width,bottom:y+height});},fillText(text,x,y,width){labels.push({text,x,y,width});}},ctx=new Proxy(target,{get:(object,key)=>key in object?object[key]:noop});
 const type=Object.keys(R.NODE_TYPES)[0],resource=R.NODE_TYPES[type].resource,data={...R,RESOURCES:{...R.RESOURCES,[resource]:{...R.RESOURCES[resource],color:'#ff00ff'}}},env={BrukRealms:data};env.window=env;vm.runInNewContext(fs.readFileSync(path.join(__dirname,'atlas.js'),'utf8'),env);
 const w=new World(),cluster=R.CLUSTERS.find(c=>!c.safe);w.nodes=Array.from({length:8},(_,i)=>({x:cluster.x+cluster.w*.5+(i%4-1.5)*130,y:cluster.y+cluster.h*.56+(Math.floor(i/4)-.5)*120,type,charges:1}));w.monsters=[];
 const canvas={width:1000,height:688};env.HoMoWAtlas.full(ctx,canvas,w,{resources:true,enemies:true});assert.equal(markers.length,w.nodes.length);
 const title=labels.find(label=>label.text===cluster.name),banner=banners.find(box=>title.x>=box.left&&title.x<box.right&&title.y>=box.top&&title.y<box.bottom);assert(banner);assert.equal(title.x,banner.left+40);assert(title.x+title.width<banner.right,'title has a separate lane from the biome and Roman tier badges');
 for(const [i,marker] of markers.entries()){assert.equal(marker.left,w.nodes[i].x/R.WIDTH*canvas.width-2.5);assert.equal(marker.top,w.nodes[i].y/R.HEIGHT*canvas.height-2.5);assert(marker.right<=banner.left||marker.left>=banner.right||marker.bottom<=banner.top||marker.top>=banner.bottom,'banner finds space away from the crowded original center');}
 markers.length=0;env.HoMoWAtlas.full(ctx,canvas,w,{resources:false,enemies:false});assert.equal(markers.length,0,'disabled resource layer contributes no dots');
});

test('Space no longer attacks and the attack HUD control is hidden',()=>{const js=fs.readFileSync(path.join(__dirname,'client.js'),'utf8'),css=fs.readFileSync(path.join(__dirname,'world.css'),'utf8');assert(js.includes('attack:false'));assert(!js.includes("attack:keys.has('Space')"));assert(!js.includes("'Space',"));assert(css.includes('#attackAction{display:none!important}'));});

test('all canonical enemy and resource types have explicit, distinct visual identities',()=>{const S=require('./world-style.js');for(const id of Object.keys(R.TYPES))assert(S.mob(id).family);for(const id of Object.keys(R.NODE_TYPES))assert(S.resource(id).family);const ores=Object.keys(R.NODE_TYPES).filter(id=>id.startsWith('ore_t'));assert.equal(new Set(ores.map(id=>S.resource(id).color)).size,8);});

test('walking stops its gait against a wall and steps follow travelled distance',()=>{const w=new World({x:130,y:220});w.monsters=[];for(let i=0;i<50;i++)w.update(.05,{x:1});const phase=w.footstep,x=w.state.x;for(let i=0;i<20;i++)w.update(.05,{x:1});assert.equal(w.state.x,x);assert.equal(w.walking,false);assert.equal(w.footstep,phase);const a=new World(),b=new World();a.monsters=b.monsters=[];for(let i=0;i<10;i++){a.update(.05,{x:1});b.update(.05,{x:1,y:1});}assert(Math.abs(a.footstep-b.footstep)<1e-8);});
test('articulated walking plants stance feet, lifts the swing and preserves mounted poses',()=>{
 const env={BrukRealms:R,HoMoWArmory:{get:()=>({parts:[],colors:{}})}};env.window=env;vm.createContext(env);
 for(const file of ['faceted-meshes','world-scale','avatar'])vm.runInContext(fs.readFileSync(path.join(__dirname,file+'.js'),'utf8'),env);
 const state=new World().state,calls=[],view={opt:{shadows:false},draw(...a){assert(a.slice(1,7).every(Number.isFinite),a[0]);calls.push(a);}};
 const draw=(phase,travel=0,mounted=false)=>{calls.length=0;env.HoMoWAvatar.draw(view,{state:{...state,x:0,y:travel,mounted},appearanceOnly:true,facing:{x:0,y:1},gait:1,walking:true,footstep:phase,time:1});return calls.slice();};
 const right=geometry=>geometry.find(a=>a[0].includes('/foot/')&&a[1]>0);
 const perStep=R.moveSpeed(state)/13,first=right(draw(Math.PI*.2)),next=right(draw(Math.PI*.3,Math.PI*.1*perStep));
 const body=Math.PI*.1*perStep;
 assert(Math.abs(first[3]-next[3])<body*.55,'planted stride grips the ground');
 assert(Math.abs(first[2])<1e-8&&Math.abs(next[2])<1e-8,'body bounce does not lift the planted foot');
 assert(right(draw(Math.PI*1.05))[2]>3,'swing foot clears the ground');
 for(let i=0;i<64;i++)for(const a of draw(i*Math.PI/32).filter(a=>a[0].includes('/thigh/')))assert(Math.abs(a[5]-13.9*env.HoMoWScale.human)<1e-5,'constant upper-leg length');
 for(let i=0;i<64;i++)for(const a of draw(i*Math.PI/32).filter(a=>a[0].includes('/shin/')))assert(Math.abs(a[5]-13.6*env.HoMoWScale.human)<1e-5,'constant lower-leg length');
 const a=draw(0,0,true).filter(a=>a[0].includes('/foot/')),b=draw(2,0,true).filter(a=>a[0].includes('/foot/'));
 assert.deepEqual(a.map(p=>[p[1],p[3]]),b.map(p=>[p[1],p[3]]));
});

test('mounted riders follow saddle posting and mounts freeze when animations are disabled',()=>{
 const env={BrukRealms:R,HoMoWArmory:{get:()=>({parts:[],colors:{}})}};env.window=env;vm.createContext(env);
 for(const file of ['faceted-meshes','world-scale','mount-art','avatar'])vm.runInContext(fs.readFileSync(path.join(__dirname,file+'.js'),'utf8'),env);
 const state=new World().state,calls=[],view={opt:{animations:true,shadows:false},heroLift:0,lifting:false,draw(...args){assert(args.slice(1,7).every(Number.isFinite),args[0]);if(this.lifting)args[2]+=this.heroLift;calls.push(args);}};
 const render=(mount,phase,time,animated=true)=>{
   calls.length=0;view.opt.animations=animated;view.lifting=false;view.heroLift=0;
   const w={state:{...state,x:100,y:200,mounted:true,selectedMount:mount},facing:{x:0,y:1},gait:1,walking:true,footstep:phase,time};
   const lift=env.HoMoWMountArt.mountModel.call(view,w),saddle=calls.find(a=>a[7]==='765239'),mountCalls=calls.slice();
   calls.length=0;view.heroLift=lift;view.lifting=true;env.HoMoWAvatar.draw(view,{...w,appearanceOnly:true});
   const rider=calls.find(a=>a[0].includes('/torso/'));
   view.lifting=false;return {lift,saddleY:saddle[2],riderY:rider[2],mountCalls};
 };
 for(const mount of Object.keys(R.MOUNTS)){
   const a=render(mount,.4,1),b=render(mount,1.3,1);
   assert(Math.abs((a.riderY-a.saddleY)-(b.riderY-b.saddleY))<1e-8,mount+' rider has no double-counted out-of-phase bob');
   const still=render(mount,.4,99,false),later=render(mount,2.7,199,false);assert.deepEqual(later.mountCalls,still.mountCalls,mount+' disabled gait is identical');
 }
});

test('body picking uses cached custom facets with yaw, pitch and lean and rejects hidden targets',()=>{
 const {env}=creatureAnatomyHarness(),F=env.HoMoWForms;
 vm.runInContext(fs.readFileSync(path.join(__dirname,'body-pick.js'),'utf8'),env);
 env.HoMoWBeta3D={meshData(){throw Error('custom facets must not use primitive geometry');}};
 const [{mesh}]=F.model('pick-test',b=>b.triangle('shell',[-1,1,0],[1,1,0],[0,-1,0]));
 const matrix=F.basis(.65,.4,.3),center=F.point(matrix,0,4,0),expected={x:100+center[0],y:200+center[2]},height=60+center[1];
 const view={camera:{s:0,c:1,elevationCos:.8,elevationSin:.6},project:(x,z,h)=>({x,y:z*.6-h*.8}),pick:(x,y)=>({x,y:y/.6}),aimBodies:[{left:-Infinity,right:Infinity,top:-Infinity,bottom:Infinity,parts:[[mesh,100,60,200,15,12,8,.65,.4,.3]]}]};
 const screen=view.project(expected.x,expected.y,height),picked=env.HoMoWBodyPick.pick(view,screen.x,screen.y);
 assert(Math.hypot(picked.x-expected.x,picked.y-expected.y)<1e-8);
 view.visibility={x:10,y:20};view.canSee=()=>false;
 const hidden=env.HoMoWBodyPick.pick(view,screen.x,screen.y);assert.equal(hidden.x,10);assert.equal(hidden.y,20);
});

function betaMazeWorld(){
 const env={console};env.window=env;vm.createContext(env);
 for(const file of ['../realms-data','../realms-loadout','../realms-skills','../realms-bosses','../realms-expeditions','../realms-evolution','village-data','maze-data','resource-layout','geography','progression','core','layout','encounter-sites','world'])vm.runInContext(fs.readFileSync(path.join(__dirname,file+'.js'),'utf8'),env,{filename:file+'.js'});
 return env;
}

test('beta maze migration retains blocked dungeon saves, purchased items and wave state',()=>{
 const env=betaMazeWorld(),R=env.BrukRealms,d=R.DUNGEONS.find(d=>d.id==='cavern'),wall=R.OBSTACLES.find(o=>o.type==='dungeonwall'&&o.x>d.arena.x+40&&o.x+o.w<d.arena.x+d.arena.w-40&&o.y>d.arena.y+40&&o.y+o.h<d.arena.y+d.arena.h-40);
 assert(wall);const initial=new env.HoMoWFull.World(),save=initial.save();
 Object.assign(save,{x:wall.x+wall.w/2,y:wall.y+wall.h/2,silver:7788,level:10});
 save.expeditions.run={id:d.id,stage:1,startedAt:Date.now()-1000,completed:false,bossCredit:false,claimed:false};save.expeditions.records.cavern.clears=3;save.mounts.horse=true;
 const restored=new env.HoMoWFull.World(save),s=restored.state;
 assert.equal(R.clusterOf(s),'dungeon:cavern');assert.equal(s.expeditions.run.id,d.id);assert.equal(s.expeditions.run.stage,1);assert.equal(s.expeditions.records.cavern.clears,3);assert.equal(s.silver,7788);assert(s.mounts.horse);assert(!restored.blocked(s.x,s.y));
 assert(d.waves[1].every(id=>restored.monsters[id].alive));assert(d.waves[0].every(id=>!restored.monsters[id].alive));
 assert.equal(new env.HoMoWFull.World(restored.save()).state.expeditions.run.stage,1);
});

test('cavern maze passage requires claiming once and continues into the adjacent cluster',()=>{
 const env=betaMazeWorld(),R=env.BrukRealms,w=new env.HoMoWFull.World(),d=R.DUNGEONS.find(d=>d.id==='cavern'),exit=R.PORTALS.find(p=>p.betaDungeon);
 w.state.level=10;Object.assign(w.state,d.entry);assert(w.enterDungeon(d.id).ok);
 Object.assign(w.state,{x:exit.x-60,y:exit.y});assert(!w.crossCluster(exit.id).ok);
 for(let stage=0;stage<3;stage++){for(const id of d.waves[stage])w.hitMonster(w.monsters[id],1e9);w.update(.01);}
 assert(w.state.expeditions.run.completed);w.lastCombat=-100;Object.assign(w.state,d.chest);assert(w.claimDungeon().ok);
 const silver=w.state.silver,clears=w.state.expeditions.records.cavern.clears;assert(!w.claimDungeon().ok);assert.equal(w.state.silver,silver);
 Object.assign(w.state,{x:exit.x-60,y:exit.y});assert(w.crossCluster(exit.id).ok);w.update(.01);assert.equal(w.state.expeditions.run,null);assert.equal(w.state.expeditions.records.cavern.clears,clears);
 const p=R.PORTALS.find(p=>p.id==='c10-c11');Object.assign(w.state,{x:p.x-60,y:p.y});w.lastCombat=-100;assert(w.crossCluster(p.id).ok);assert.equal(R.clusterOf(w.state),'c11');
 w.keyboardOnly=true;Object.assign(w.state,{x:p.x-40,y:p.y});for(let i=0;i<10;i++)w.moveEntity(w.state,8,0);assert.equal(R.clusterOf(w.state),'c11');
 Object.assign(w.state,{x:exit.x+60,y:exit.y});for(let i=0;i<15;i++)w.moveEntity(w.state,-8,0);assert.equal(R.clusterOf(w.state),'c10','walking back must not bypass paid/progression entry');
});

test('plain camps append stable beta IDs and their defeated state survives saves',()=>{
 const env=betaMazeWorld(),R=env.BrukRealms,w=new env.HoMoWFull.World({},()=>.5,()=>120000),ids=env.HoMoWMaze.plainSpawns.map(m=>m.id);
 assert.equal(ids.length,6);assert.equal(R.SPAWNS.length,147);
 const m=w.monsters[ids[0]];Object.assign(w.state,{x:m.x-40,y:m.y});w.hitMonster(m,1e9);assert(!m.alive);
 const saved=w.save(),restored=new env.HoMoWFull.World(saved,()=>.5,()=>120000);assert(!restored.monsters[m.id].alive);
 for(const id of ids){assert.equal(restored.monsters[id].id,id);assert.equal(R.clusterOf(restored.monsters[id]),'c20');assert(env.HoMoWMaze.inPlain(restored.monsters[id]));}
});

test('pointer resource selection filters invisible candidates even when their hitbox overlaps visible ground',()=>{
 const line=fs.readFileSync(path.join(__dirname,'client.js'),'utf8').split('\n').find(s=>s.includes("canvas.addEventListener('pointerdown',event=>")),selected=[],closed={open:()=>false};let handler;
 const node={id:17,type:'ore_t1',x:1405,y:1725},world={state:{x:1000,y:1725},nodes:[node],monsters:[],nearCamp:()=>false,selectNode:id=>{selected.push(id);return {message:''};},attack(){}};
 const env={canvas:{addEventListener:(_,fn)=>handler=fn,focus(){}},world,scene:{canSee:n=>Math.hypot(n.x-world.state.x,n.y-world.state.y)<=390},screenToWorld:()=>({x:1385,y:1710}),network:null,profile:closed,panels:closed,journey:closed,hudUI:closed,community:closed,partyUI:closed,expeditions:{...closed,targetAt:()=>false},R:{BILLBOARD:{x:5000,y:5000},TYPES:{}},notice(){}};
 vm.runInNewContext(line,env);handler({button:0});assert.equal(selected.length,0);
 node.x=1380;handler({button:0});assert.deepEqual(selected,[17]);
});

test('maze fog raster clips distant geometry and blends the viewing edge',()=>{
 const env={HoMoWMaterials:{}};env.window=env;vm.createContext(env);vm.runInContext(fs.readFileSync(path.join(__dirname,'raster.js'),'utf8'),env);
 const size=128,ctx={createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(image){this.output=image.data;}},visibility={x:0,y:0,radius:80,start:50};
 const pts=[[0,0],[size,0],[size,size],[0,size]].map(([x,y])=>({x,y,depth:1,wx:x,wz:0}));
 const view={ctx,canvas:{width:size,height:size},width:size,height:size,visibility,faces:[{pts,rgb:[200,150,100],visibility}]};env.HoMoWRaster.flush(view);
 const pixel=x=>Array.from(ctx.output.slice((64*size+x)*4,(64*size+x)*4+4));
 assert.deepEqual(pixel(25),[200,150,100,255]);assert.deepEqual(pixel(100),[89,99,88,255]);assert(pixel(65)[0]<200&&pixel(65)[0]>89);
});

test('render motion eases turns without changing game state and snaps between clusters',()=>{const {View}=require('./motion.js'),v=new View(),w=new World();const saved=JSON.stringify(w.state),first=v.sample(w,0,'c00');w.facing={x:0,y:1};w.walking=true;const turn=v.sample(w,.05,'c00');assert(turn.turn<first.turn&&turn.turn>0);assert.equal(JSON.stringify(w.state),saved);w.state.x+=500;const snap=v.sample(w,.1,'c01');assert.equal(snap.state.x,w.state.x);w.swing=.2;w.facing={x:-1,y:0};const aimed=v.sample(w,.15,'c01');assert(Math.abs(aimed.facing.x+1)<1e-8);});

test('wandering packs follow real ten-minute windows and expire in and out of combat', () => {
  let now = 599_999;
  const world = new World({}, Math.random, () => now);
  const camps = world.monsters.slice();
  assert.equal(world.encounter, null);
  now++;
  world.update(.01);
  const first = world.encounter;
  assert.equal(first.endsAt, 720_000);
  assert.equal(first.members.length, 3);
  assert.equal(world.monsters.length, camps.length + 3);
  const target = first.members[0];
  assert(world.hitMonster(target, 1));
  now = first.endsAt - 1;
  world.syncEncounter();
  assert.equal(world.encounter, first);
  world.selected = target.id;
  now++;
  assert.equal(world.hitMonster(target, 1e9), false);
  const silver = world.state.silver;
  world.syncEncounter();
  assert.equal(world.encounter, null);
  assert.equal(world.selected, null);
  assert.equal(world.state.silver, silver);
  assert.deepEqual(world.monsters, camps);
  assert.equal(world.nextEncounterAt, 1_200_000);
  now = 1_200_000;
  world.syncEncounter();
  assert(world.encounter.members.every(m => m.alive));
  // Returning from a long background pause jumps straight to the current pack.
  now += 3 * 600_000;
  world.syncEncounter();
  assert.equal(world.encounter.slot, 5);
  assert.equal(world.monsters.length, camps.length + 3);
});

test('pack kills pay once and survive beta save, export and reload within the same window', () => {
  let now = 600_100;
  const world = new World({}, Math.random, () => now);
  const [slain, injured] = world.encounter.members;
  const species = R.TYPES[slain.type];
  const coins = world.state.silver, kills = world.state.kills[slain.type];
  assert(world.hitMonster(slain, 1e9));
  assert(!world.hitMonster(slain, 1e9));
  world.updateMonster(slain, 120);
  assert(!slain.alive);
  assert.equal(world.state.silver, coins + species.silver);
  assert.equal(world.state.kills[slain.type], kills + 1);
  assert(world.hitMonster(injured, 3));
  const saved = world.save();
  assert.equal(saved.betaEncounter.hp[0], 0);
  assert.equal(saved.betaEncounter.hp[1], injured.hp);
  assert(!Object.hasOwn(saved.mobState, slain.id));
  assert(!Object.hasOwn(world.state.mobState, slain.id));
  assert(!Object.hasOwn(world.save({shared:true}), 'betaEncounter'));
  const loaded = new World(JSON.parse(JSON.stringify(saved)), Math.random, () => now);
  assert.deepEqual(loaded.encounter.members.map(m => [m.type,m.homeX,m.homeY,m.hp]), world.encounter.members.map(m => [m.type,m.homeX,m.homeY,m.hp]));
  assert(!loaded.hitMonster(loaded.encounter.members[0], 1e9));
  assert.equal(loaded.state.silver, world.state.silver);
  now += 600_000;
  const next = new World(saved, Math.random, () => now);
  assert(next.encounter.members.every(m => m.alive && m.hp === R.TYPES[m.type].hp));
});

test('every weapon and forge tier has different vertex geometry before enchantment',()=>{
 const crypto=require('node:crypto'),env={};env.window=env;vm.createContext(env);
 for(const file of ['faceted-meshes.js','armory.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,file),'utf8'),env);
 const all=new Set();
 for(const id of Object.keys(R.VARIANTS)){
   for(let tier=0;tier<=R.MAX_TIER;tier++){
     const model=env.HoMoWArmory.get(id,tier),hash=crypto.createHash('sha256');
     for(const {mesh,slot} of model.parts){
       assert.match(model.colors[slot],/^[0-9a-f]{6}$/);
       const data=env.HoMoWForms.meshes.get(mesh);assert(data.length>=18&&data.length%18===0);
       for(let i=0;i<data.length;i+=6){
         assert(Number.isFinite(data[i]+data[i+1]+data[i+2]));
         assert(Math.abs(Math.hypot(data[i+3],data[i+4],data[i+5])-1)<1e-5);
       }
       hash.update(Buffer.from(data.buffer,data.byteOffset,data.byteLength));
     }
     const signature=hash.digest('hex');assert(!all.has(signature),id+' T'+tier);all.add(signature);
     assert.deepEqual(env.HoMoWArmory.get(id,tier),model);
   }
 }
 assert.equal(all.size,Object.keys(R.VARIANTS).length*(R.MAX_TIER+1));
});

test('overlapping armor facets resolve per pixel in either draw order',()=>{
 const env={HoMoWMaterials:{}};env.window=env;vm.createContext(env);
 vm.runInContext(fs.readFileSync(path.join(__dirname,'raster.js'),'utf8'),env);
 const ctx={createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(image){this.output=image.data;}};
 const face=(rgb,depths)=>({rgb,pts:[[0,0],[8,0],[0,8]].map(([x,y],i)=>({x,y,depth:depths[i]}))});
 const red=face([240,20,15],[1,9,1]),gold=face([210,185,80],[4,4,4]);
 const view={ctx,canvas:{width:8,height:8},width:8,height:8,faces:[red,gold]};
 const pixel=(x,y)=>Array.from(ctx.output.slice((y*8+x)*4,(y*8+x)*4+4));
 env.HoMoWRaster.flush(view,true);assert.deepEqual(pixel(1,1),[210,185,80,255]);assert.deepEqual(pixel(5,1),[240,20,15,255]);
 view.faces.reverse();env.HoMoWRaster.flush(view,true);assert.deepEqual(pixel(1,1),[210,185,80,255]);assert.deepEqual(pixel(5,1),[240,20,15,255]);
});

test('obstacle reveal follows the actual hero silhouette and preserves nearby and rear geometry',()=>{
 const env={HoMoWMaterials:{}};env.window=env;vm.createContext(env);vm.runInContext(fs.readFileSync(path.join(__dirname,'raster.js'),'utf8'),env);
 const ctx={createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(image){this.output=image.data;}},size=256;
 const rectangle=(left,top,right,bottom,depth,rgb=[200,200,200])=>({rgb,pts:[[left,top],[right,top],[right,bottom],[left,bottom]].map(([x,y])=>({x,y,depth}))});
 const hero=[rectangle(122,85,136,132,0),rectangle(110,100,116,125,0),rectangle(118,132,123,165,0),rectangle(134,132,139,165,0)],background=rectangle(0,0,size,size,-20,[20,90,30]),obstacle={...rectangle(0,0,size,size,10,[160,110,70]),covered:true},view={ctx,canvas:{width:size,height:size},width:size,height:size,faces:[background,obstacle]};
 view.heroMask=env.HoMoWRaster.heroMask(view,hero,0);assert(view.heroMask.width<40&&view.heroMask.height<90,'only the projected body area allocates a mask');
 const pixel=(x,y)=>Array.from(ctx.output.slice((y*size+x)*4,(y*size+x)*4+4));env.HoMoWRaster.flush(view,true);
 assert.deepEqual(pixel(128,110),[20,90,30,255],'an occluder in front of the torso is removed');assert.deepEqual(pixel(112,110),[20,90,30,255],'the actual arm also stays visible');assert.deepEqual(pixel(188,128),[160,110,70,255],'nearby objects inside the old radius stay whole');assert.deepEqual(pixel(128,155),[160,110,70,255],'empty space between the legs is not a reveal radius');
 for(const p of obstacle.pts)p.depth=-5;env.HoMoWRaster.flush(view,true);assert.deepEqual(pixel(128,110),[160,110,70,255],'geometry behind the body is untouched');
 for(const p of obstacle.pts)p.depth=10;view.cachedFaces=view.faces;env.HoMoWRaster.flush(view,false);assert.deepEqual(pixel(128,110),[20,90,30,255]);
 const shifted=hero.map(face=>({...face,pts:face.pts.map(p=>({...p,x:p.x-60}))}));view.heroMask=env.HoMoWRaster.heroMask(view,shifted,0);env.HoMoWRaster.flush(view,false);assert.deepEqual(pixel(128,110),[160,110,70,255],'a cached obstacle reappears when the hero moves');assert.deepEqual(pixel(68,110),[20,90,30,255],'the mask moves without rebuilding cached scenery');
 const mask=view.heroMask;for(let i=0;i<mask.depth.length;i++){if(mask.data[i*4+3]===0)continue;const decoded=(mask.data[i*4]*256+mask.data[i*4+1])/65535*512-256;assert(Math.abs(decoded-mask.depth[i])<.01,'GPU depth encoding matches the CPU silhouette');}
 view.heroMask=null;env.HoMoWRaster.flush(view,false);assert.deepEqual(pixel(68,110),[160,110,70,255]);
});

test('WebGL reveal uploads the same cropped silhouette and excludes the hero ground shadow',()=>{
 const calls=[],gl=new Proxy({createTexture:()=>({}),createBuffer:()=>({})},{get:(object,key)=>key in object?object[key]:(...args)=>calls.push([key,...args])}),env={HoMoWMaterials:{units:8},HoMoWCamera3D:require('./camera3d.js')};env.window=env;vm.createContext(env);for(const name of ['faceted-meshes','raster','scene3d'])vm.runInContext(fs.readFileSync(path.join(__dirname,name+'.js'),'utf8'),env);
 const scene=Object.create(env.HoMoWBeta3D.Scene.prototype);Object.assign(scene,env.HoMoWCamera3D.create(256,256,0,0,0,1),{camera:env.HoMoWCamera3D.create(256,256,0,0,0,1),cpu:false,gl,attributes:[0,1],canvas:{width:256,height:256},meshes:{cube:{data:env.HoMoWBeta3D.meshData('cube'),buffer:{},count:36},orb:{data:env.HoMoWBeta3D.meshData('orb'),buffer:{},count:60}},colorCache:new Map(),u:{rotation:'rotation',covered:'covered',heroRect:'heroRect',focus:'focus'},opt:{}});
 scene.hero=function(){this.draw('cube',0,30,0,20,40,15,'ffcc99');this.draw('orb',0,.2,0,150,1,100,'5a614e');};scene.prepareHero({state:{x:0,y:0}});
 assert(scene.heroMask&&scene.heroMask.width<20,'a wide ground shadow does not enlarge the silhouette');assert.equal(calls.filter(call=>call[0]==='drawArrays').length,0,'the silhouette pass never draws into the visible GPU framebuffer');
 const upload=calls.find(call=>call[0]==='texImage2D');assert.equal(upload[4],scene.heroMask.width);assert.equal(upload[5],scene.heroMask.height);assert.equal(upload[9],scene.heroMask.data);assert(calls.some(call=>call[0]==='uniform4f'&&call[1]==='heroRect'&&call[3]===256-scene.heroMask.top));
 scene.cover=true;scene.draw('cube',0,30,30,50,50,10,'887766');assert.equal(calls.filter(call=>call[0]==='drawArrays').length,1);assert(calls.some(call=>call[0]==='uniformMatrix3fv'),'the real draw restores its GPU rotation after the mask pass');assert(calls.some(call=>call[0]==='uniform1i'&&call[1]==='covered'&&call[2]===1));
 const source=fs.readFileSync(path.join(__dirname,'scene3d.js'),'utf8');assert(source.includes('hero.a>.5&&sightDepth>depth+.75'));assert(!source.includes('dot(sight.xy,sight.xy)'));
});

test('WebGL reveal includes back-facing planar hero meshes while CPU culling is retained',()=>{
 const calls=[],gl=new Proxy({createTexture:()=>({})},{get:(object,key)=>key in object?object[key]:(...args)=>calls.push([key,...args])}),env={HoMoWMaterials:{units:8},HoMoWCamera3D:require('./camera3d.js')};env.window=env;vm.createContext(env);for(const name of ['faceted-meshes','raster','scene3d'])vm.runInContext(fs.readFileSync(path.join(__dirname,name+'.js'),'utf8'),env);
 const data=new Float32Array([[-.5,-.5,0],[-.5,.5,0],[.5,.5,0],[-.5,-.5,0],[.5,.5,0],[.5,-.5,0]].flatMap(p=>[...p,0,0,-1])),camera=env.HoMoWCamera3D.create(256,256,0,0,0,1),scene=Object.create(env.HoMoWBeta3D.Scene.prototype);
 Object.assign(scene,camera,{camera,cpu:false,gl,attributes:[0,1],canvas:{width:256,height:256},meshes:{shield:{data,buffer:{},count:6}},colorCache:new Map(),u:{rotation:'rotation',covered:'covered',heroRect:'heroRect',focus:'focus'},opt:{},faces:[]});
 const w={state:{x:0,y:0}};scene.hero=function(){this.draw('shield',0,30,0,20,40,1,'ffcc99');};scene.prepareHero(w);
 assert(scene.heroMask,'the visible back-facing shield must contribute to the GPU mask');assert(scene.heroMask.data.some((value,index)=>index%4===3&&value===255),'the planar shield produces opaque silhouette pixels');
 assert.equal(calls.find(call=>call[0]==='texImage2D')[9],scene.heroMask.data);assert.equal(calls.filter(call=>call[0]==='drawArrays').length,0,'the mask pass never draws into the visible GPU framebuffer');
 scene.hero(w);assert.equal(calls.filter(call=>call[0]==='drawArrays').length,1,'the visible GPU renderer draws the same back-facing shield');
 scene.cpu=true;scene.faces=[];scene.hero(w);assert.equal(scene.faces.length,0,'the CPU visible pass still culls the back-facing shield');scene.prepareHero(w);assert.equal(scene.heroMask,null,'the CPU mask pass retains the same back-face culling');
 scene.hero=function(){this.draw('shield',0,30,0,20,40,1,'ffcc99',Math.PI);};scene.hero(w);assert.equal(scene.faces.length,2,'the CPU visible pass still draws a front-facing planar shield');scene.prepareHero(w);assert(scene.heroMask,'the CPU mask includes the front-facing shield');
});

test('tree models retain their species, scale, and a matching harvested stump',()=>{
 const env={};env.window=env;vm.createContext(env);
 for(const file of ['faceted-meshes','world-style','world-scale','tree-art'])vm.runInContext(fs.readFileSync(path.join(__dirname,file+'.js'),'utf8'),env);
 const bounds=(tree,alive)=>{
   let top=0,minX=Infinity,maxX=-Infinity;
   env.HoMoWTrees.draw.call({draw(mesh,x,y,z,sx,sy,sz){
     const data=env.HoMoWForms.meshes.get(mesh);
     for(let i=0;i<data.length;i+=6){const px=x+sx*data[i];top=Math.max(top,y+sy*data[i+1]);minX=Math.min(minX,px);maxX=Math.max(maxX,px);}
   }},0,0,2,tree,alive,'forest',619);
   return {top,width:maxX-minX};
 };
 const trees=Array.from({length:6},(_,i)=>bounds(i,true));
 assert(trees.every(b=>b.top>5*32&&b.top<22*32));assert(trees[1].width/trees[1].top>trees[2].width/trees[2].top*1.3);
 for(let i=0;i<trees.length;i++)assert(bounds(i,false).top<trees[i].top*.04);
 const calls=[],view={opt:{animations:false},draw(...args){calls.push(args);}};
 const capture=(shape,time)=>{calls.length=0;env.HoMoWTrees.draw.call(view,0,0,2,shape,true,'forest',619,time);return calls.slice();};
 for(let shape=0;shape<6;shape++){const still=capture(shape,1);assert.deepEqual(capture(shape,80),still,'disabled wind leaves no static phase tilt');assert(still.every(a=>a[10]===0&&a[11]===0));}
 view.opt.animations=true;assert.notDeepEqual(capture(1,1),capture(1,80),'enabled wind changes the canopy');
});

test('hero experience migrates once, carries levels and releases the level-100 reserve once',()=>{
 const beta=require('./core.js'),base=new R.World({level:42});
 base.state.xp=Math.floor(R.xpGoal(base.state)*.4);base.state.talents.vitality=4;
 const w=new World(base.save());assert.equal(w.state.level,42);
 assert(Math.abs(w.state.xp/beta.xpGoal(w.state)-.4)<.002);assert.equal(w.state.talents.vitality,4);
 assert.equal(beta.talentPoints(w.state),37);assert.equal(new World(w.save()).state.xp,w.state.xp);
 const m=new World({level:99,passUnlocked:true}),left=beta.xpGoal(m.state)+321;
 assert.equal(m.gainXp(left),left);assert.equal(m.state.level,100);assert.equal(m.state.reserveXp,321);
 const restored=new World(m.save());const next=beta.xpGoal(restored.state);restored.gainXp(next);
 Object.assign(restored.state,R.MONOLITH);assert(restored.interact().ok);assert.equal(restored.state.level,101);
 assert.equal(restored.state.xp,321);assert.equal(restored.state.reserveXp,0);restored.interact();assert.equal(restored.state.xp,321);
 const boss=beta.monsterXp({level:80},'pass_guardian');assert(boss>beta.monsterXp({level:80},'slime'));
 const capped=new World({level:650,passUnlocked:true,monolithAwakened:true});assert.equal(capped.gainXp(1200),0);
 const kill=new World();const foe=kill.monsters[0],before=kill.state.xp;kill.hitMonster(foe,1e8);
 const event=kill.drainEvents().find(e=>e.type==='kill');assert(event.xp>0);assert.equal(kill.state.xp-before,event.xp);
});
test('houses use cached tiled roofs, framed doors and textured structural materials',()=>{
 const env={HoMoWGeography:{landscape:{}},HoMoWTrees:{draw(){}}};env.window=env;vm.createContext(env);
 for(const file of ['faceted-meshes','world-style','world-art'])vm.runInContext(fs.readFileSync(path.join(__dirname,file+'.js'),'utf8'),env);
 const calls=[],scene={opt:{animations:false},draw(...args){calls.push(args);}};
 const sizes={blacksmith:[170,125],mage:[110,125],enchanter:[120,105],armorer:[130,110],alchemist:[115,100],artificer:[130,90],quartermaster:[120,100],market:[110,80],hall:[130,96],inn:[144,100]};
 for(const [owner,[w,h]] of Object.entries(sizes)){
   calls.length=0;const house={owner,x:200,y:300,w,h},before=JSON.stringify(house);
   env.HoMoWEnvironment.building.call(scene,house,1);
   assert.equal(JSON.stringify(house),before);assert(calls.some(a=>a[9]==='wood'));assert(calls.some(a=>a[9]==='stone'));
   if(owner!=='market'){
     assert(calls.some(a=>a[9]==='plaster'));assert(calls.some(a=>a[9]==='slate'));
     const tiles=calls.find(a=>a[0].endsWith('/roof'));assert(tiles);
     const data=env.HoMoWForms.meshes.get(tiles[0]);assert(data.length>180);
     if(owner!=='mage')for(let i=0;i<data.length;i+=6)assert(data[i+4]>0,'roof faces point upwards');
   }
   assert(calls.length<60,'bounded house draw calls');
   const cached=env.HoMoWForms.meshes.size;
   const geometry=JSON.stringify(calls);calls.length=0;env.HoMoWEnvironment.building.call(scene,house,20);
   assert.equal(env.HoMoWForms.meshes.size,cached);assert.equal(JSON.stringify(calls),geometry,'animations-off house is stationary');
 }
 for(const data of env.HoMoWForms.meshes.values())for(let i=0;i<data.length;i+=6){
   assert(Number.isFinite(data[i]+data[i+1]+data[i+2]));assert(Math.abs(Math.hypot(data[i+3],data[i+4],data[i+5])-1)<1e-5);
 }
});

test('ore tiers have irregular seeded host rock, surface veins and depleted remnants',()=>{
 const env={HoMoWGeography:{landscape:{}},HoMoWTrees:{draw(){}}};env.window=env;vm.createContext(env);
 for(const file of ['faceted-meshes','world-style','world-art'])vm.runInContext(fs.readFileSync(path.join(__dirname,file+'.js'),'utf8'),env);
 const calls=[],scene={...env.HoMoWEnvironment,draw(...args){calls.push(args);}},signatures=new Set();
 for(const type of ['copper','iron','mithril','crystal','stone',...Array.from({length:8},(_,i)=>'ore_t'+(i+1))]){
   const n={id:71,type,x:500,y:500,charges:3},before=JSON.stringify(n),v=env.HoMoWWorldStyle.resource(type);
   calls.length=0;env.HoMoWEnvironment.resource.call(scene,n,1);
   assert.equal(JSON.stringify(n),before);assert(calls.every(a=>a[0].startsWith('geology/')));
   if(v.family!=='stone')assert(calls.some(a=>a[0].endsWith('/vein')));
   const active=JSON.stringify(calls),rock=calls.filter(a=>a[9]==='rock').map(a=>a[0]);signatures.add(active);
   const count=env.HoMoWForms.meshes.size;calls.length=0;env.HoMoWEnvironment.resource.call(scene,n,20);
   assert.equal(JSON.stringify(calls),active);assert.equal(env.HoMoWForms.meshes.size,count);
   calls.length=0;env.HoMoWEnvironment.resource.call(scene,{...n,charges:0},20);
   assert.deepEqual(calls.map(a=>a[0]),rock);assert(calls.every(a=>a[5]===.36));
   for(const name of rock){const data=env.HoMoWForms.meshes.get(name);for(let i=0;i<data.length;i+=6){
     assert(Number.isFinite(data[i]+data[i+1]+data[i+2]));assert(Math.hypot(data[i],data[i+2])<34,'deposit stays inside collection clearance');
     assert(Math.abs(Math.hypot(data[i+3],data[i+4],data[i+5])-1)<1e-5);
   }}
 }
 assert.equal(signatures.size,13);
 const variants=new Set();
 for(let id=0;id<36;id++){calls.length=0;env.HoMoWEnvironment.resource.call(scene,{id,type:'ore_t1',x:500,y:500,charges:3},0);variants.add(calls[0][0]);}
 assert.equal(variants.size,6,'bounded reproducible deposit variations');
});

test('architecture and geology textures are deterministic, opaque and distinct',()=>{
 const env={};env.window=env;vm.createContext(env);vm.runInContext(fs.readFileSync(path.join(__dirname,'materials.js'),'utf8'),env);
 const signatures=new Set();
 for(const id of ['wood','steel','plaster','stone','slate','rock','grass','soil','cobble']){
   const pixels=env.HoMoWMaterials.pixels(id);assert.equal(pixels.length,64*64*4);assert.equal(env.HoMoWMaterials.pixels(id),pixels);
   for(let i=0;i<pixels.length;i+=4){assert.equal(pixels[i],pixels[i+1]);assert.equal(pixels[i],pixels[i+2]);assert.equal(pixels[i+3],255);}
   signatures.add(Buffer.from(pixels).toString('base64'));
 }
 assert.equal(signatures.size,9);
});

async function betaPanelHarness(){
 const {parseHTML}=await import('linkedom'),{window}=parseHTML(fs.readFileSync(path.join(__dirname,'index.html'),'utf8')),document=window.document;
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return this.querySelector('option[selected]')?.getAttribute('value')||'';},set(value){for(const o of this.querySelectorAll('option'))o.toggleAttribute('selected',o.getAttribute('value')===String(value));}});
 window.HTMLElement.prototype.showModal=function(){this.setAttribute('open','');};window.HTMLElement.prototype.close=function(){this.removeAttribute('open');};Object.defineProperty(window.HTMLElement.prototype,'open',{configurable:true,get(){return this.hasAttribute('open');}});
 const env={document,BrukRealms:require('./core.js'),BrukRealmsArt:{icon:()=>'<svg></svg>'},HoMoWPortrait(){},setTimeout:fn=>{fn();return 1;},clearTimeout(){}};env.window=env;vm.createContext(env);
 for(const file of ['inventory','panels','market','community'])vm.runInContext(fs.readFileSync(path.join(__dirname,file+'.js'),'utf8'),env);
 return {env,window,document};
}

test('desktop inventory and shops filter without changing slots and trade exact quantities',async()=>{
 const {env,document}=await betaPanelHarness();
 const w=new World();w.state.resources.copper=12;w.state.resources.iron=5;
 const root=document.getElementById('inventoryItems'),ui=env.BrukInventory.mount(root,w,{result:fn=>{const result=fn();if(result.ok)ui.render();return result;},notice(){}});ui.render();
 const original=JSON.stringify(w.state),slots=env.BrukRealms.inventoryLayout(w.state).slice(),visible=()=>[...root.querySelectorAll('.pack-grid .pack-cell')].filter(n=>!n.hidden);
 root.querySelector('input[type=search]').value='мід';root.querySelector('input[type=search]').oninput();assert.equal(visible().length,1);assert.equal(visible()[0].dataset.itemKey,'resource:copper');
 visible()[0].click();assert(root.querySelector('.pack-item-meta').textContent.includes('18.0'));assert.equal(root.querySelector('input[type=search]').value,'мід');
 root.querySelector('input[type=search]').value='немає такого предмета';root.querySelector('input[type=search]').oninput();assert.equal(visible().length,0);
 root.querySelector('.pack-toolbar button').click();assert.equal(visible().length,slots.length);
 root.querySelector('.pack-toolbar select').value='tool';root.querySelector('.pack-toolbar select').onchange();assert.equal(visible().length,Object.keys(env.BrukRealms.TOOLS).length);assert(visible().every(n=>n.dataset.kind==='tool'));
 assert.equal(JSON.stringify(w.state),original);assert.deepEqual(env.BrukRealms.inventoryLayout(w.state),slots);
 root.querySelector('.pack-toolbar button').click();const empty=slots.findIndex(key=>!key);root.querySelector('.pack-grid [data-slot-index="'+empty+'"]').click();assert.equal(env.BrukRealms.inventoryLayout(w.state)[empty],'resource:copper');
 Object.assign(w.state,env.BrukRealms.TRADERS.blacksmith);w.state.silver=0;
 const api={save(){},notice(){},hud(){},clearKeys(){},focus(){}},panels=env.BrukRealmsPanels.create(w,api);panels.town('blacksmith');
 const stock=document.getElementById('merchantStock'),cards=()=>[...stock.querySelectorAll('[data-stock-category]')].filter(n=>!n.hidden),beforeShop=JSON.stringify(w.state);
 assert(stock.querySelector('.locked-reason'));stock.querySelector('.shop-toolbar select').value='tools';stock.querySelector('.shop-toolbar select').onchange();assert.equal(cards().length,Object.keys(env.BrukRealms.TOOLS).length);assert(cards().every(c=>c.dataset.stockCategory==='tools'));
 stock.querySelector('input[type=checkbox]').checked=true;stock.querySelector('input[type=checkbox]').onchange();assert.equal(cards().length,0);assert.equal(JSON.stringify(w.state),beforeShop);
 w.state.silver=200;panels.refresh();assert(cards().length>0);assert(cards().every(c=>c.querySelector('[data-tool]:not(:disabled)')));document.getElementById('merchantDialog').close();
 Object.assign(w.state,env.BrukRealms.TRADERS.market);w.state.silver=500;w.state.resources.copper=20;w.state.bank.copper=50;
 const exchange=document.createElement('div'),marketApi={refresh(){exchange.replaceChildren();env.HoMoWMarket.render(exchange,w,marketApi);},result(fn){const result=fn();if(result.ok)marketApi.refresh();return result;}};marketApi.refresh();assert.equal(exchange.querySelector('.exchange-controls'),null);exchange.querySelector('[data-market-item="copper"]').click();
 const preset=n=>[...exchange.querySelectorAll('.exchange-presets button')].find(b=>b.textContent===n).click();preset('5');const price=w.quote('copper');exchange.querySelector('[data-sell="copper:bag"]').click();assert.equal(w.state.resources.copper,15);assert.equal(w.state.silver,500+5*price);
 preset('MAX');assert.equal(Number(exchange.querySelector('input[type=number]').value),50);assert(exchange.querySelector('[data-sell="copper:bag"]').disabled);assert(!exchange.querySelector('[data-sell="copper:bank"]').disabled);
 for(const n of ['-1','0','1.5','1001']){const amount=exchange.querySelector('input[type=number]');amount.value=n;amount.oninput();assert([...exchange.querySelectorAll('.exchange-controls button')].every(b=>b.disabled));}
 [...exchange.querySelectorAll('.exchange-toolbar button')].find(b=>b.textContent==='Купити').click();preset('5');const buyPrice=Math.ceil(w.quote('copper')*1.3),silver=w.state.silver;exchange.querySelector('.exchange-controls button').click();assert.equal(w.state.bank.copper,55);assert.equal(w.state.resources.copper,15);assert.equal(w.state.silver,silver-5*buyPrice);
 preset('MAX');assert.equal(Number(exchange.querySelector('input[type=number]').value),Math.min(1000,Math.floor(w.state.silver/buyPrice)));
 const search=exchange.querySelector('input[type=search]');search.value='немає такого ресурсу';search.oninput();assert.equal(exchange.querySelector('.exchange-controls'),null);
});

test('merchant types expand into variants and tier previews without changing sequential trade',async()=>{
 const {env,window,document}=await betaPanelHarness(),B=env.BrukRealms,w=new World({silver:10000}),panels=env.BrukRealmsPanels.create(w,{save(){},notice(){},hud(){},clearKeys(){},focus(){}}),stock=document.getElementById('merchantStock');
 Object.assign(w.state,B.TRADERS.blacksmith);panels.town('blacksmith');
 const key='blacksmith:shop:variant:sword',group=()=>stock.querySelector('[data-stock-group="'+key+'"]');
 assert.equal(stock.querySelectorAll('[data-stock-category=variant]').length,5);assert([...stock.querySelectorAll('.stock-group')].every(n=>!n.open));assert.equal(group().querySelector('.stock-summary strong').textContent,'Меч');assert.equal(group().querySelectorAll('.gear-card').length,1);
 group().querySelector('summary').click();group().setAttribute('open','');
 const before=JSON.stringify(w.state),choose=(selector,value)=>{const select=stock.querySelector(selector);select.value=value;select.onchange();};
 choose('[data-stock-variant="'+key+'"]','sword_claymore');assert(group().open);assert.equal(group().querySelector('h3').textContent,B.VARIANTS.sword_claymore.name);
 choose('[data-stock-tier="variant:sword_claymore"]','3');assert(group().open);assert(group().textContent.includes('Характеристики · T3'));assert(group().querySelector('[data-buy-gear]').disabled);assert.equal(JSON.stringify(w.state),before);
 choose('[data-stock-tier="variant:sword_claymore"]','0');const offer=B.gearOffer(w.state,'variant','sword_claymore'),silver=w.state.silver;group().querySelector('[data-buy-gear]').click();assert.equal(w.state.variantArsenal.sword_claymore,0);assert.equal(w.state.silver,silver-offer.cost);assert(group().open);assert.equal(group().querySelector('[data-stock-tier]').value,'1');
 stock.querySelector('[data-category=craft]').click();choose('[data-stock-variant="blacksmith:craft:variant:sword"]','sword_claymore');
 const craft=B.gearOffer(w.state,'variant','sword_claymore');for(const [id,n]of Object.entries(craft.input))w.state.bank[id]=n;panels.refresh();const craftSilver=w.state.silver;stock.querySelector('[data-forge-gear="variant:sword_claymore"]').click();assert.equal(w.state.variantArsenal.sword_claymore,1);assert.equal(w.state.silver,craftSilver-craft.fee);for(const id of Object.keys(craft.input))assert.equal(w.state.bank[id],0);
 document.getElementById('merchantDialog').close();Object.assign(w.state,B.TRADERS.enchanter);w.state.bank.crystal=50;w.state.bank.mithril_ingot=50;panels.town('enchanter');
 const enchantChoice=stock.querySelector('[data-stock-variant="enchanter:craft:variant:sword"]');enchantChoice.value='sword_claymore';enchantChoice.onchange();const enchant=B.enchantOffer(w.state,'variant','sword_claymore'),enchantSilver=w.state.silver;stock.querySelector('[data-enchant="variant:sword_claymore"]').click();assert.equal(B.enchantLevel(w.state,'variant','sword_claymore'),1);assert.equal(w.state.silver,enchantSilver-enchant.cost);
});

test('all merchant catalogs group potion and resource tiers while keeping exact item IDs',async()=>{
 const {env,document}=await betaPanelHarness(),B=env.BrukRealms,w=new World({silver:10000}),panels=env.BrukRealmsPanels.create(w,{save(){},notice(){},hud(){},clearKeys(){},focus(){}}),stock=document.getElementById('merchantStock');
 for(const id of ['mage','armorer','artificer','quartermaster']){Object.assign(w.state,B.TRADERS[id]);panels.town(id);assert(stock.querySelector('.stock-group'),id);assert([...stock.querySelectorAll('.stock-group')].every(n=>!n.open),id);document.getElementById('merchantDialog').close();}
 Object.assign(w.state,B.TRADERS.alchemist);panels.town('alchemist');assert.equal(stock.querySelectorAll('[data-stock-category=potions]').length,8);assert.equal(stock.querySelectorAll('.potion-card').length,8);
 const potion=stock.querySelector('[data-stock-variant="alchemist:potions:health"]'),before=JSON.stringify(w.state);potion.value='health_3';potion.onchange();assert.equal(JSON.stringify(w.state),before);const card=stock.querySelector('[data-stock-group="alchemist:potions:health"] .potion-card');assert(card.textContent.includes('Відновлення: +'+B.POTIONS.health_3.power));const silver=w.state.silver;card.querySelector('button').click();assert.equal(w.state.consumables.health_3,1);assert.equal(w.state.silver,silver-B.POTIONS.health_3.price);
 document.getElementById('merchantDialog').close();Object.assign(w.state,B.TRADERS.market);panels.town('market');assert.equal(stock.querySelectorAll('[data-market-group=ore]').length,1);assert.equal(stock.querySelector('.exchange-controls'),null);
 stock.querySelector('[data-market-group=ore]').click();const tiers=stock.querySelector('[aria-label="Тир ресурсу"]');assert.equal(tiers.querySelectorAll('option').length,8);tiers.value='ore_t4';tiers.onchange();assert(stock.querySelector('.exchange-detail').textContent.includes(B.RESOURCES.ore_t4.name));
 [...stock.querySelectorAll('.exchange-toolbar button')].find(b=>b.textContent==='Купити').click();const resourceSilver=w.state.silver,cost=Math.ceil(w.quote('ore_t4')*1.3);stock.querySelector('.exchange-controls button').click();assert.equal(w.state.bank.ore_t4,1);assert.equal(w.state.silver,resourceSilver-cost);
 const search=stock.querySelector('[aria-label="Пошук на ринку"]');search.value='немає такого';search.oninput();assert.equal(stock.querySelector('.exchange-controls'),null);
});

test('billboard formats session seconds as Ukrainian days hours and minutes only',async()=>{
 const {env,document}=await betaPanelHarness(),w=new World(),cases=[[0,'менше хвилини'],[59,'менше хвилини'],[60,'1 хвилина'],[120,'2 хвилини'],[300,'5 хвилин'],[1260,'21 хвилина'],[3600,'1 година'],[3660,'1 година 1 хвилина'],[86400,'1 день'],[172800,'2 дні'],[586439,'6 днів 18 годин 53 хвилини'],[31536000,'365 днів']],boards={session:cases.map(([value],i)=>({name:'Player '+i,value})),money:[{name:'Rich',value:123456}]},network={leaderboard:async()=>({boards}),command(){}};
 const ui=env.HoMoWCommunity.mount(w,network,{clearKeys(){},focus(){},notice(){}});Object.assign(w.state,env.BrukRealms.BILLBOARD);ui.openBoard();await new Promise(resolve=>setImmediate(resolve));document.querySelector('[data-ranking=session]').click();
 assert.equal(document.querySelector('[data-ranking=session]').textContent,'Нон-стоп · час');assert.deepEqual([...document.querySelectorAll('.ranking-row>b')].map(n=>n.textContent),cases.map(([,text])=>text));document.querySelector('[data-ranking=money]').click();assert.equal(document.querySelector('.ranking-row>b').textContent,(123456).toLocaleString('uk-UA'));
});

test('inventory detail stays in normal flow below nonshrinking equipment and bag columns',()=>{
 const css=fs.readFileSync(path.join(__dirname,'inventory.css'),'utf8'),rules=[...css.matchAll(/#inventoryDialog \.pack-detail\{([^}]+)\}/g)].map(m=>m[1]);
 assert(rules.at(-1).includes('position:static'));assert(!rules.at(-1).includes('bottom:0'));
 assert(css.includes('#inventoryDialog .pack-columns{grid-template-columns:340px minmax(0,1fr);gap:20px;flex:0 0 auto}'));
});

test('a lawful town bind survives saves, death, recall and switching back to the village',()=>{
 const w=new World({passUnlocked:true},()=>.99);Object.assign(w.state,R.CITY_LANDMARKS.inn);
 assert(w.bindHome().ok);const h=new World(w.save(),()=>.99);assert.equal(h.state.homeTown,'city');
 Object.assign(h.state,{x:3700,y:1700});h.damage(1e9);assert.equal(h.state.x,R.CITY_LANDMARKS.inn.x);
 Object.assign(h.state,{x:3600,y:1600});h.lastCombat=-100;assert(h.beginRecall().ok);
 for(let i=0;i<125;i++)h.update(.05,{});assert.equal(h.state.y,R.CITY_LANDMARKS.inn.y);
 Object.assign(h.state,R.TRADERS.quartermaster);assert(h.bindHome().ok);assert.equal(h.state.homeTown,'village');
 assert.equal(new World({homeTown:'city',passUnlocked:false}).state.homeTown,'village');
});

function cottonCivilianHarness(){
 const env={BrukRealms:R,HoMoWGeography:{landscape:{}},HoMoWTrees:{draw(){}},HoMoWBeta3D:{Scene:class{}},HoMoWFull:{},HoMoWCreatureArt:{},HoMoWMountArt:{},Math:Object.create(Math)};
 env.Math.random=()=>assert.fail('cotton/civilian rendering must not use frame randomness');env.window=env;vm.createContext(env);
 for(const file of ['faceted-meshes','world-style','world-scale','world-art','world-scene'])vm.runInContext(fs.readFileSync(path.join(__dirname,file+'.js'),'utf8'),env,{filename:file+'.js'});
 const calls=[],scene={...env.HoMoWEnvironment,opt:{animations:false,shadows:true,lowTextures:false},draw(...args){calls.push(args);}};
 const capture=fn=>{calls.length=0;fn();return calls.slice();};
 const signature=draws=>draws.map(a=>Buffer.from(env.HoMoWForms.meshes.get(a[0]).buffer).toString('base64')).join('|');
 const validate=()=>{for(const [mesh,data] of env.HoMoWForms.meshes){
   assert(data.length>=18&&data.length%18===0,mesh+' triangles');
   for(let i=0;i<data.length;i+=6){assert(Array.from(data.slice(i,i+6)).every(Number.isFinite),mesh+' finite vertices/normals');assert(Math.abs(Math.hypot(data[i+3],data[i+4],data[i+5])-1)<1e-5,mesh+' unit normals');}
 }};
 return {env,scene,capture,signature,validate};
}

test('cotton fiber types use six deterministic cached leafy boll models and small dry stalks',()=>{
 const {env,scene,capture,signature,validate}=cottonCivilianHarness(),F=env.HoMoWForms,types=['fiber',...Array.from({length:8},(_,i)=>'fiber_t'+(i+1))],tierModels=new Set();
 for(const type of types){
   const variants=new Set(),shapes=new Set();
   for(let id=0;id<36;id++){
     const n=Object.freeze({id,type,x:501,y:613,charges:3,tool:R.NODE_TYPES[type].tool,loot:R.NODE_TYPES[type].loot}),before=JSON.stringify(n);
     const active=capture(()=>scene.resource(n,1));assert.equal(JSON.stringify(n),before);
     assert(active.length<16&&active.length>5);assert(active.every(a=>a[0].startsWith('cotton/'+type+'/')&&a[1]===n.x&&a[3]===n.y));
     for(const slot of ['stem','leaf','leafShade','boll','bollShade','cotton','cream','fiberTint'])assert(active.some(a=>a[0].endsWith('/'+slot)),type+' '+slot);
     assert(active.some(a=>a[9]==='wood')&&active.some(a=>a[9]==='plaster')&&active.some(a=>a[9]==='leather'));
     const key=active[0][0].slice(0,active[0][0].lastIndexOf('/')),parts=F.model(key,()=>assert.fail('cached cotton model rebuilt'));
     variants.add(key);shapes.add(signature(active));if(id===0)tierModels.add(signature(active));
     const size=F.meshes.size,again=capture(()=>scene.resource(n,99));assert.deepEqual(again,active);assert.equal(F.meshes.size,size);assert.equal(F.model(key,()=>assert.fail('cache miss')),parts);
     const dryNode=Object.freeze({...n,charges:0}),dry=capture(()=>scene.resource(dryNode,12));assert.equal(dry.length,1);assert(dry[0][0].endsWith('/dry/dry'));assert.equal(dry[0][9],'wood');assert.equal(dryNode.charges,0);
     const data=F.meshes.get(dry[0][0]);for(let j=0;j<data.length;j+=6){assert(data[j+1]>=-1&&data[j+1]<11);assert(Math.hypot(data[j],data[j+2])<6);}
     assert.deepEqual(capture(()=>scene.resource(dryNode,999)),dry);
     if(id===0){let triangles=0;for(const a of active){const data=F.meshes.get(a[0]);triangles+=data.length/18;for(let j=0;j<data.length;j+=6)assert(Math.hypot(data[j],data[j+2])<28,'cotton stays inside clearance');}assert(triangles<2200,'bounded cotton triangles');}
   }
   assert.equal(variants.size,6,type+' bounded seed variants');assert.equal(shapes.size,6,type+' actual shape variations');
 }
 assert.equal(tierModels.size,9,'fiber base and all tiers have distinct geometry');assert(F.meshes.size<=9*6*10,'bounded cotton mesh cache');validate();
 const second=cottonCivilianHarness(),n={id:'cotton-string-seed',type:'fiber_t8',x:35,y:72,charges:2};
 const a=capture(()=>scene.resource(n,2)),b=second.capture(()=>second.scene.resource(n,2));assert.deepEqual(a,b);assert.equal(signature(a),second.signature(b),'independent builds reproduce cotton geometry');
});

test('cotton animations and texture options preserve cached models and leave herbs unchanged',()=>{
 const {env,scene,capture}=cottonCivilianHarness(),n=Object.freeze({id:8,type:'fiber_t4',x:200,y:300,charges:4});
 const still=capture(()=>scene.resource(n,0)),size=env.HoMoWForms.meshes.size;
 scene.opt.animations=true;const moving=capture(()=>scene.resource(n,2));assert(moving.some(a=>Math.abs(a[11])>0));assert.deepEqual(moving.map(a=>a[0]),still.map(a=>a[0]));assert.deepEqual(capture(()=>scene.resource(n,2)),moving);assert.equal(env.HoMoWForms.meshes.size,size);
 scene.opt.lowTextures=true;const plain=capture(()=>scene.resource(n,2));assert(plain.every(a=>a[9]===null));assert.deepEqual(plain.map(a=>a[0]),still.map(a=>a[0]));
 assert(capture(()=>scene.resource({...n,charges:0},2)).every(a=>a[10]===0&&a[11]===0),'depleted stalk never sways');
 for(const charges of [3,0]){
   const herb=Object.freeze({id:18,type:'herb',x:200,y:300,charges}),expected=[];
   if(!charges)expected.push(['cube',200,2,300,14,4,14,'967d51',0]);
   else for(let i=0;i<5;i++){const a=i*2.4,dx=Math.cos(a)*12,dz=Math.sin(a)*9;
     expected.push(['cube',200+dx,13,300+dz,3,24,3,'748266',0],['sphere',200+dx+4,15,300+dz,10,6,7,'7e9479',a],['sphere',200+dx-3,20,300+dz,8,7,7,'90a386',0],['sphere',200+dx,25,300+dz,3,4,3,'c99e80',0]);
   }
   assert.deepEqual(capture(()=>scene.resource(herb,88)),expected,'original herb draw calls');
 }
});

test('civilian traders have cached sculpted faces, limbs and eight distinct profession silhouettes',()=>{
 const {env,scene,capture,signature,validate}=cottonCivilianHarness(),trader=env.HoMoWFull.Scene.prototype.trader,shapes=new Set();
 scene.opt.shadows=false;
 for(const id of ['blacksmith','mage','enchanter','armorer','alchemist','artificer','quartermaster','market']){
   const n=Object.freeze({...R.TRADERS[id],x:510,y:620}),before=JSON.stringify(n),active=capture(()=>trader.call(scene,n,id,1));
   assert.equal(JSON.stringify(n),before);assert(active.length<60);assert(active.every(a=>a[0].startsWith('civilian/'+id+'/')&&a[1]===n.x&&a[3]===n.y));
   for(const slot of ['cloth','trousersL','trousersR','bootsL','bootsR','skin','skinShade','eyes','eyeWhite','hair','mouth','trim'])assert(active.some(a=>a[0].endsWith('/'+slot)),id+' '+slot);
   assert(active.every(a=>a.slice(4,7).every(s=>s===env.HoMoWScale.human)));assert(active.every(a=>a[10]===0&&a[11]===0));
   if(['blacksmith','armorer','artificer'].includes(id))assert(active.some(a=>a[0].endsWith('/apron')));
   assert(active.some(a=>a[9]==='leather'));shapes.add(signature(active));
   const key='civilian/'+id,parts=env.HoMoWForms.model(key,()=>assert.fail('civilian cache miss')),size=env.HoMoWForms.meshes.size;
   assert.deepEqual(capture(()=>trader.call(scene,n,id,123)),active);assert.equal(env.HoMoWForms.meshes.size,size);assert.equal(env.HoMoWForms.model(key,()=>assert.fail('civilian rebuilt')),parts);
   const translated=capture(()=>trader.call(scene,{...n,x:700,y:900},id,1));assert.deepEqual(translated.map(a=>a[0]),active.map(a=>a[0]));assert(translated.every(a=>a[1]===700&&a[3]===900));
   let triangles=0;for(const a of active)triangles+=env.HoMoWForms.meshes.get(a[0]).length/18;assert(triangles<2200,'bounded civilian triangles');
 }
 assert.equal(shapes.size,8,'professions differ in geometry, not just colors');assert(env.HoMoWForms.meshes.size<8*24);validate();
 const second=cottonCivilianHarness();second.scene.opt.shadows=false;const n={x:510,y:620,name:'unchanged',role:'unchanged'};
 const a=capture(()=>trader.call(scene,n,'artificer',3)),b=second.capture(()=>second.env.HoMoWFull.Scene.prototype.trader.call(second.scene,n,'artificer',3));assert.deepEqual(a,b);assert.equal(signature(a),second.signature(b));
});

test('civilian trader idle, shadow, steps and low-texture options preserve identity and cache size',()=>{
 const {env,scene,capture}=cottonCivilianHarness(),trader=env.HoMoWFull.Scene.prototype.trader,n=Object.freeze({id:'true-market',x:123,y:456,name:'seller',role:'market'}),before=JSON.stringify(n);
 const still=capture(()=>trader.call(scene,n,'market',1));assert.equal(still.filter(a=>a[0]==='sphere').length,1);
 const size=env.HoMoWForms.meshes.size;scene.opt.shadows=false;const unshadowed=capture(()=>trader.call(scene,n,'market',22));assert.deepEqual(unshadowed,still.filter(a=>a[0]!=='sphere'));
 scene.opt.animations=true;const moving=capture(()=>trader.call(scene,n,'market',3));assert(moving.some(a=>Math.abs(a[10])+Math.abs(a[11])>0));assert(moving.every(a=>a.slice(1,7).every(Number.isFinite)));assert.deepEqual(moving.map(a=>a[0]),unshadowed.map(a=>a[0]));assert.deepEqual(capture(()=>trader.call(scene,n,'market',3)),moving);
 const motion={walking:true,gait:.34,footstep:.18,facing:{x:1,y:-.5}},stepping=capture(()=>trader.call(scene,n,'market',3,motion)),nextStep=capture(()=>trader.call(scene,n,'market',3,{...motion,footstep:.41}));
 assert.notDeepEqual(stepping,nextStep);assert(stepping.some(a=>/\/boots[LR]$/.test(a[0])&&a[2]>0));assert(stepping.every(a=>a.slice(1,7).every(Number.isFinite)));assert.deepEqual(stepping.map(a=>a[0]),unshadowed.map(a=>a[0]));
 scene.opt.lowTextures=true;assert(capture(()=>trader.call(scene,n,'market',3)).every(a=>a[9]===null));
 scene.opt.animations=false;const market=capture(()=>trader.call(scene,n,'market',3)),fallback=capture(()=>trader.call(scene,n,'unknown-profession',100));assert.deepEqual(fallback,market);assert.deepEqual(capture(()=>trader.call(scene,n,'market',90,{...motion,footstep:2.7})),market,'disabled animations freeze walking traders');
 assert.equal(env.HoMoWForms.meshes.size,size);assert.equal(JSON.stringify(n),before);
});

test('drifting villagers face their travel and use subtle steps only while animated',()=>{
 const {env,scene}=cottonCivilianHarness(),renders=[];env.HoMoWVillage={spread:p=>p};scene.visibleAt=()=>true;scene.trader=(...args)=>renders.push(args);scene.opt.animations=true;
 const v=R.VILLAGE,w={state:{x:v.x+v.w/2,y:v.y+v.h/2},time:12};
 scene.villageLife(w);assert(renders.length>0&&renders.length<=3);
 for(const [,id,time,motion] of renders){assert(time===12);assert(motion.walking&&motion.gait===.34&&motion.footstep===10.8);assert(Math.hypot(motion.facing.x,motion.facing.y)>0);assert(['market','alchemist','quartermaster'].includes(id));}
 scene.opt.animations=false;renders.length=0;scene.villageLife({...w,time:99});assert(renders.length>0&&renders.length<=3);assert(renders.every(a=>!a[3].walking&&a[2]===0));
});

function creatureAnatomyHarness(){
 const env={BrukRealms:R,Math:Object.create(Math)};env.Math.random=()=>assert.fail('creature geometry must be deterministic');env.window=env;vm.createContext(env);
 for(const file of ['faceted-meshes','world-style','world-scale','creature-art'])vm.runInContext(fs.readFileSync(path.join(__dirname,file+'.js'),'utf8'),env,{filename:file+'.js'});
 const calls=[],warnings=[],scene={...env.HoMoWCreatureArt,opt:{animations:false,shadows:false,lowTextures:false},draw(...args){calls.push(args);},warning(...args){warnings.push(args);}};
 const capture=(m,time=1)=>{calls.length=0;warnings.length=0;const top=scene.creature(m,time);return {calls:calls.slice(),warnings:warnings.slice(),top};};
 return {env,scene,capture};
}

test('creature anatomy covers every canonical monster with bounded cached faceted unit solids',()=>{
 const {env,capture}=creatureAnatomyHarness(),signatures=new Map(),typesBefore=JSON.stringify(R.TYPES),forms=env.HoMoWForms;
 for(const type of Object.keys(R.TYPES)){
   const m=Object.freeze({id:'immutable-'+type,type,x:501,y:613,facing:Object.freeze({x:.6,y:.8}),walking:true,footstep:1,alive:true}),before=JSON.stringify(m),active=capture(m);
   assert.equal(JSON.stringify(m),before);assert(active.top>0&&Number.isFinite(active.top),type+' top');
   assert(active.calls.some(a=>a[0].startsWith('creature/')),type+' sculpted shells');assert(active.calls.length<90,type+' bounded draws');
   assert(active.calls.every(a=>a.slice(1,7).every(Number.isFinite)&&a.slice(4,7).every(v=>v>0)),type+' positive dimensions');
   assert(active.calls.every(a=>a.slice(10,12).every(Number.isFinite)),type+' rotations');const signature=JSON.stringify(active.calls);assert(!signatures.has(signature),type+' distinct from '+signatures.get(signature));signatures.set(signature,type);
   let triangles=0;for(const a of active.calls){const data=forms.meshes.get(a[0]);if(data)triangles+=data.length/18;}
   assert(triangles<2400,type+' bounded triangles');
   const size=forms.meshes.size;assert.deepEqual(capture(m,80),active,type+' animations-off pose');assert.equal(forms.meshes.size,size);
 }
 assert.equal(signatures.size,Object.keys(R.TYPES).length,'all canonical model signatures remain distinct');assert.equal(JSON.stringify(R.TYPES),typesBefore,'combat definitions unchanged');
 assert(forms.meshes.size<120,'cache bounded by shared anatomy, not canonical type or actor');
 for(const [mesh,data] of forms.meshes){
   assert(mesh.startsWith('creature/'));assert(data.length>=18&&data.length%18===0,mesh+' triangles');
   for(let i=0;i<data.length;i+=6){assert(Array.from(data.slice(i,i+6)).every(Number.isFinite),mesh+' finite geometry');assert(Array.from(data.slice(i,i+3)).every(v=>Math.abs(v)<=1.00001),mesh+' unit bounds');assert(Math.abs(Math.hypot(data[i+3],data[i+4],data[i+5])-1)<1e-5,mesh+' unit normals');}
 }
 const size=forms.meshes.size;
 for(let i=0;i<120;i++)for(const type of Object.keys(R.TYPES))capture({id:i,type,x:i*7,y:i*11,facing:{x:Math.sin(i),y:Math.cos(i)},walking:!!(i%2),footstep:i},i);
 assert.equal(forms.meshes.size,size,'positions, IDs and times never grow the anatomy cache');
});

test('monster creature limbs, skull ribs, drapery and family accents preserve anatomical distinctions',()=>{
 const {env,capture}=creatureAnatomyHarness(),render=type=>capture({type,x:0,y:0,facing:{x:0,y:1},walking:false}).calls;
 const has=(calls,name)=>calls.some(a=>a[0].startsWith('creature/'+name+'/'));
 for(const [type,shell] of [['wolf','wolf-body'],['rat','rat-body'],['boar','boar-body'],['bear','bear-body'],['spider','spider-abdomen'],['golem','golem-body'],['bandit','human-body'],['mage','robe'],['skeleton','skull'],['treant','wood-trunk'],['wraith','drapery'],['ancient','giant-head']])assert(has(render(type),shell),type+' '+shell);
 for(const type of ['wolf','rat','boar','bear']){
   const calls=render(type),limbs=calls.filter(a=>a[0]==='creature/limb/shell');assert.equal(limbs.length,12,type+' thigh, shin and hock segments');assert(limbs.some(a=>Math.abs(a[10])>.1),type+' bent leg segments');
   assert(has(calls,type==='boar'?'hoof':'paw'));assert(has(calls,type==='boar'?'boar-tail':type==='rat'?'rat-tail':type==='wolf'?'wolf-tail':'bear-head'));
   assert(has(calls,type==='rat'||type==='bear'?'round-ear':'ear'));assert(has(calls,type+'-muzzle'));
 }
 const spider=render('spider'),upper=spider.filter(a=>a[0]==='creature/bone/shell');assert.equal(upper.length,10,'eight radial upper legs and two fang roots');assert(spider.filter(a=>a[0]==='creature/limb/shell').length===8);assert.equal(spider.filter(a=>a[0]==='creature/point/shell').length,2,'hooked fang tips');
 const ribs=env.HoMoWForms.meshes.get(render('skeleton').find(a=>a[0]==='creature/ribs/shell')[0]);assert(ribs.length/18>200,'open segmented rib cage');assert(has(render('skeleton'),'bone'));assert(has(render('treant'),'fork'));
 for(const type of Object.keys(R.TYPES)){
   const calls=render(type),v=env.HoMoWWorldStyle.mob(type),expected=v.elite||R.TYPES[type].boss?3:0;
   assert.equal(calls.filter(a=>a[7]==='edce83'&&a[0]==='cone').length,expected,type+' crown distinction');
   assert(calls.some(a=>a[7]===v.accent),type+' variant crest/accent');
 }
});

test('creature transforms, conservative monster tops, options and warning picking remain valid',()=>{
 const {env,scene,capture}=creatureAnatomyHarness(),forms=env.HoMoWForms;
 for(const animations of [false,true])for(const type of Object.keys(R.TYPES))for(const facing of [{x:0,y:1},{x:1,y:0},{x:-.6,y:-.8}]){
   scene.opt.animations=animations;const m={type,x:120,y:330,facing,walking:true,footstep:1.2},active=capture(m,2.3);
   for(const a of active.calls){const data=forms.meshes.get(a[0]);if(!data)continue;const basis=forms.basis(a[8],a[10],a[11]);
     for(let i=0;i<data.length;i+=6){const local=forms.point(basis,data[i]*a[4],data[i+1]*a[5],data[i+2]*a[6]);assert(a[2]+local[1]<=active.top+1e-4,type+' top contains tilted geometry');}
   }
 }
 scene.opt.animations=false;const m=Object.freeze({id:52,type:'elite_wolf',x:120,y:330,facing:Object.freeze({x:1,y:0}),walking:true,footstep:1,telegraph:Object.freeze({kind:'cone'}),hazards:Object.freeze([Object.freeze({kind:'circle'}),Object.freeze({kind:'line'})])}),before=JSON.stringify(m);
 scene.pickParts=[{stale:true}];const still=capture(m,2);assert.equal(scene.pickParts,null);assert.deepEqual(still.warnings,[[m.telegraph,m],[m.hazards[0],m],[m.hazards[1],m]]);
 scene.opt.shadows=true;const shadowed=capture(m,80);assert.deepEqual(shadowed.calls.filter(a=>a[0]!=='sphere'),still.calls);assert.equal(shadowed.calls.filter(a=>a[0]==='sphere').length,still.calls.filter(a=>a[0]==='sphere').length+1);
 scene.opt.shadows=false;scene.opt.animations=true;const moving=capture(m,2);assert.notDeepEqual(moving.calls,still.calls);assert.deepEqual(moving.calls.map(a=>a[0]),still.calls.map(a=>a[0]));assert.deepEqual(capture(m,2),moving);
 const size=forms.meshes.size;scene.opt.lowTextures=true;const plain=capture(m,2);assert(plain.calls.every(a=>a[9]===null));assert(still.calls.some(a=>a[9]==='leather'));assert.deepEqual(plain.calls.map(a=>a[0]),moving.calls.map(a=>a[0]));assert.equal(forms.meshes.size,size);assert.equal(JSON.stringify(m),before);
 scene.opt.animations=false;const a=capture({...m,type:'wolf',x:100,y:200,facing:{x:0,y:1}}),b=capture({...m,type:'wolf',x:300,y:400,facing:{x:1,y:0}});
 assert.deepEqual(a.calls.map(v=>v[0]),b.calls.map(v=>v[0]));for(let i=0;i<a.calls.length;i++){const p=a.calls[i],q=b.calls[i];assert(Math.abs((q[1]-300)-(p[3]-200))<1e-8);assert(Math.abs((q[3]-400)+(p[1]-100))<1e-8);assert.equal(q[2],p[2]);assert.deepEqual(q.slice(4,8),p.slice(4,8));}
});

test('creature animal eye sockets sit in front of their faceted head shells rather than inside them',()=>{
 const {env,capture}=creatureAnatomyHarness();
 for(const type of ['wolf','rat','boar','bear']){
   const {calls}=capture({type,x:0,y:0,facing:{x:0,y:1}}),heads=calls.filter(a=>a[0].startsWith('creature/'+type+'-head/')),eyes=calls.filter(a=>a[0]==='cube'&&a[7]==='233947');assert.equal(eyes.length,2,type+' eyes');
   for(const eye of eyes){
     let front=-Infinity;
     for(const head of heads){const data=env.HoMoWForms.meshes.get(head[0]);
       for(let i=0;i<data.length;i+=18){
         const vertices=[0,6,12].map(j=>[head[1]+data[i+j]*head[4],head[2]+data[i+j+1]*head[5],head[3]+data[i+j+2]*head[6]]),[a,b,c]=vertices;
         const dx=b[0]-a[0],dy=b[1]-a[1],ex=c[0]-a[0],ey=c[1]-a[1],det=dx*ey-ex*dy;if(Math.abs(det)<1e-10)continue;
         const x=eye[1]-a[0],y=eye[2]-a[1],u=(x*ey-ex*y)/det,v=(dx*y-x*dy)/det;
         if(u>=-1e-6&&v>=-1e-6&&u+v<=1+1e-6)front=Math.max(front,a[2]+u*(b[2]-a[2])+v*(c[2]-a[2]));
       }
     }
     assert(Number.isFinite(front),type+' socket overlaps the head');assert(eye[3]+eye[6]*.5>front,type+' dark socket is visible outside the skull');
   }
 }
});

function mazeLayoutHarness(planned=false){
 const env={console};env.window=env;vm.createContext(env);
 const run=file=>vm.runInContext(fs.readFileSync(path.resolve(__dirname,file),'utf8'),env,{filename:file});
 for(const file of ['../realms-data.js','../realms-loadout.js','../realms-skills.js','../realms-bosses.js','../realms-expeditions.js','../realms-evolution.js','village-data.js'])run(file);
 const D=env.BrukRealmsData,original={nodes:D.NODES.map(n=>({id:n.id,type:n.type,cluster:D.clusterOf(n)})),spawns:D.SPAWNS.map(([type,x,y])=>({type,x,y,cluster:D.clusterOf({x,y})})),dungeons:JSON.stringify(D.DUNGEONS),obstacles:JSON.stringify(D.OBSTACLES.filter(o=>['house','mountain','citywall'].includes(o.type)))};
 run('maze-data.js');const early=JSON.stringify(D.OBSTACLES);
 for(const file of ['resource-layout.js','geography.js','../realms-core.js',planned?'layout.js':'layout-source.js'])run(file);
 return {env,R:env.BrukRealms,M:env.HoMoWMaze,L:env.HoMoWLayout,original,early};
}
let mazeLayoutFixture;
const mazeLayout=()=>mazeLayoutFixture||(mazeLayoutFixture=mazeLayoutHarness());
function assertMazeRoute(R,from,to,label){
 const points=R.findPath(from.x,from.y,to.x,to.y);assert(points.length,label+' has a route');assert(Math.hypot(points.at(-1).x-to.x,points.at(-1).y-to.y)<1,label+' reaches its actual endpoint');
 let previous=from;for(const p of points){const steps=Math.max(1,Math.ceil(Math.hypot(p.x-previous.x,p.y-previous.y)/8));for(let i=1;i<=steps;i++)assert(!R.blocked(previous.x+(p.x-previous.x)*i/steps,previous.y+(p.y-previous.y)*i/steps,17),label+' walkable');previous=p;}
 return points;
}

test('beta labyrinth early overlay and generated runtime have identical ordered geometry and content',()=>{
 const source=mazeLayout(),runtime=mazeLayoutHarness(true),again=mazeLayoutHarness(true),{R,M,original}=source;
 assert.equal(source.early,runtime.early);assert.equal(source.early,again.early);
 for(const field of ['OBSTACLES','NODES','SPAWNS','DECOR'])assert.equal(JSON.stringify(R[field]),JSON.stringify(runtime.R[field]),field+' matches planner/browser');
 assert.equal(JSON.stringify(R.DUNGEONS),original.dungeons);assert.equal(JSON.stringify(R.OBSTACLES.filter(o=>['house','mountain','citywall'].includes(o.type))),original.obstacles);
 assert.equal(M.plainSpawns.length,6);assert.equal(R.SPAWNS.length,147);assert.equal(R.NODES.length,190);
 for(const [i,n]of R.NODES.entries()){assert.equal(n.id,original.nodes[i].id);assert.equal(n.type,original.nodes[i].type);assert.equal(R.clusterOf(n),R.inVillage(n.x,n.y)?'village':original.nodes[i].cluster);}
 for(const [i,[type,x,y]]of R.SPAWNS.slice(0,141).entries()){assert.equal(type,original.spawns[i].type);assert.equal(R.clusterOf({x,y}),original.spawns[i].cluster);}
 for(const [i,m]of M.plainSpawns.entries()){assert.equal(m.id,141+i);assert.equal(R.SPAWNS[m.id][0],m.type);const p={x:R.SPAWNS[m.id][1],y:R.SPAWNS[m.id][2]};assert.equal(R.clusterOf(p),'c20');assert(M.inPlain(p));}
 assert.equal(M.cells.length,55);assert(M.edges.length>54);assert.equal(M.thickness,24);
 for(const region of M.regions)assert(M.contains({x:region.x+region.w/2,y:region.y+region.h/2}));
 for(const d of R.DUNGEONS)assert(M.contains(d.spawn));assert(!M.contains({x:1500,y:3000}));assert(M.inPlain({x:1500,y:3000}));
 const build=fs.readFileSync(path.join(__dirname,'build.py'),'utf8'),planner=fs.readFileSync(path.join(__dirname,'plan-layout.cjs'),'utf8');
 assert(build.includes('village-data.js?v=\'+VERSION+\'\"></script><script src=\"maze-data.js?v=\'+VERSION+\'\"></script><script src=\"resource-layout.js'));
 assert(planner.includes("'beta/village-data.js','beta/maze-data.js','beta/resource-layout.js'"));
});

test('beta labyrinth branching corridors connect every cell, both clusters and the cavern exit',()=>{
 const {R,M,env}=mazeLayout(),byID=new Map(M.cells.map(p=>[p.id,p])),seen=new Set([M.cells[0].id]),queue=[M.cells[0].id];
 for(const id of ['c10','c11']){const routes=env.HoMoWGeography.roads.get(id),hub=routes[0].at(-1);for(const route of routes){assert.equal(route.at(-1).x,hub.x,id+' route reaches hub');assert.equal(route.at(-1).y,hub.y,id+' route reaches hub');for(const p of route)assert(!R.blocked(p.x,p.y,17),id+' retained walkable road');}}
 for(const id of queue)for(const [a,b]of M.edges){const next=a===id?b:b===id?a:null;if(next&&!seen.has(next)){seen.add(next);queue.push(next);}}
 assert.equal(seen.size,55,'one physically connected branching maze');
 for(const [a,b]of M.edges){const p=byID.get(a),q=byID.get(b);assert(!R.lineBlocked(p.x,p.y,q.x,q.y),a+' to '+b);assertMazeRoute(R,p,q,a+' to '+b);}
 const gate=R.PORTALS.find(p=>p.id==='c10-c11');assert.equal(gate.x,2000);assert.equal(gate.y,2400);
 for(let x=gate.x-140;x<=gate.x+140;x+=10)assert(!R.blocked(x,gate.y,50),'normal portal approach');
 assertMazeRoute(R,byID.get('maze-west:0'),byID.get('maze-west:19'),'west branching route');assertMazeRoute(R,byID.get('maze-west:19'),gate,'west to authored portal');assertMazeRoute(R,gate,byID.get('maze-east:18'),'authored portal to east');assertMazeRoute(R,byID.get('maze-east:18'),byID.get('maze-east:29'),'east branching route');
 for(const opening of M.openings){const nearest=M.cells.filter(p=>p.region===opening.region).sort((a,b)=>Math.hypot(a.x-opening.x,a.y-opening.y)-Math.hypot(b.x-opening.x,b.y-opening.y))[0];assertMazeRoute(R,opening,nearest,opening.region+' '+opening.side);}
 for(const [id,target]of [['c00-c10','maze-west:0'],['c10-c20','maze-west:20'],['c01-c11','maze-east:4'],['c11-c21','maze-east:28']])assertMazeRoute(R,R.PORTALS.find(p=>p.id===id),byID.get(target),id+' joins maze');
 const d=R.DUNGEONS.find(d=>d.id==='cavern');assertMazeRoute(R,d.chest,M.exteriorConnections.at(-1),'cavern chest to west entrance');
 for(let y=1645+18;y<=1805-18;y+=10)assert(!R.blocked(849,y,17),'160-wide final-room opening');
 for(const id of ['crypt','vault']){const a=R.DUNGEONS.find(d=>d.id===id).arena;assert(R.blocked(a.x+a.w-11,a.y+125,17),id+' remains enclosed');}
});

test('beta labyrinth dungeon baffles preserve every authored wave and stage approach',()=>{
 const {R,M,original}=mazeLayout();
 for(const d of R.DUNGEONS){const points=[d.spawn,d.chest,d.exit,...d.waves.flat().map(id=>({x:R.SPAWNS[id][1],y:R.SPAWNS[id][2]}))];
 assert(M.dungeonWalls.filter(o=>o.dungeon===d.id).length>=9,d.id+' has branches in all stages');
 for(const o of M.dungeonWalls.filter(o=>o.dungeon===d.id))for(const p of points)assert(Math.hypot(p.x-Math.max(o.x,Math.min(o.x+o.w,p.x)),p.y-Math.max(o.y,Math.min(o.y+o.h,p.y)))>=105,d.id+' protected authored point');
 for(const [stage,wave]of d.waves.entries()){const start=stage===0?d.spawn:{x:d.gates[stage-1].x+70,y:d.gates[stage-1].y-35};for(const id of wave){const s=R.SPAWNS[id],p={x:s[1],y:s[2]};assert.deepEqual(JSON.parse(JSON.stringify(s)),[original.spawns[id].type,original.spawns[id].x,original.spawns[id].y]);assert(!R.blocked(p.x,p.y,40));assertMazeRoute(R,start,p,d.id+' wave '+id);}}
 for(const g of d.gates)assertMazeRoute(R,{x:g.x+70,y:g.y+75},{x:g.x+70,y:g.y-55},d.id+' stage '+g.stage);
 assertMazeRoute(R,d.spawn,d.exit,d.id+' exit');assertMazeRoute(R,{x:d.arena.x+d.arena.w/2,y:d.arena.y+125},d.chest,d.id+' chest');
 }
});

test('beta labyrinth placement keeps wood outside inhabited open plains without weakening spacing',()=>{
 const {R,M,L,original}=mazeLayout();
 for(const n of R.NODES){assert(L.free(n,50),'clear node '+n.id);assert(L.gateFree(n,180),'node gate clearance '+n.id);if(!R.clusterOf(n).startsWith('dungeon:'))assert(L.roadFree(n,64),'node road clearance '+n.id);if(R.NODE_TYPES[n.type].tool==='axe')assert(!M.inPlain(n),'wood remains visible outside plain '+n.id);}
 for(const [id,[type,x,y]]of R.SPAWNS.entries()){const p={x,y},radius=R.TYPES[type].radius;assert(!R.blocked(x,y,radius+20),'clear authored mob '+id);if(R.clusterOf(p).startsWith('dungeon:'))continue;assert(L.free(p,radius+20),'mob/border clearance '+id);if(type!=='pass_guardian'){assert(L.gateFree(p,235));assert(L.roadFree(p,85));}assert(R.NODES.every(n=>Math.hypot(x-n.x,y-n.y)>radius+85),'mob/node separation '+id);}
 for(const [i,n]of R.NODES.entries())for(const other of R.NODES.slice(i+1))assert(Math.hypot(n.x-other.x,n.y-other.y)>100,'separate nodes');
 for(const a of M.plainRegions){assert(R.NODES.some(n=>M.within(n,a)&&R.NODE_TYPES[n.type].tool!=='axe'),a.id+' has nonwood resources');assert(R.SPAWNS.some(s=>M.within({x:s[1],y:s[2]},a)),a.id+' has mobs');}
 assert(R.SPAWNS.filter(s=>M.inPlain({x:s[1],y:s[2]})).length>=2);
 for(const a of M.regions)assert(R.SPAWNS.filter(s=>M.within({x:s[1],y:s[2]},a)).length>=3,a.id+' remains an inhabited mob labyrinth');
 for(const o of R.OBSTACLES.filter(o=>!o.betaMaze))assert(!M.plainRegions.some(a=>o.x<a.x+a.w&&o.x+o.w>a.x&&o.y<a.y+a.h&&o.y+o.h>a.y),'treeless plain');
 for(const p of R.DECOR.filter(p=>M.contains(p)||M.inPlain(p)))assert(['grass','flowers'].includes(p.kind));
 assert(R.DECOR.some(p=>M.contains(p)&&p.kind==='flowers'),'retain low flowering ground cover');
 assert(R.PORTALS.some(p=>p.betaDungeon));assert(!L.segments.some(([a,b])=>a.x===860&&a.y===1725||b.x===860&&b.y===1725),'dungeon portal excluded from ordinary hub roads');
});
