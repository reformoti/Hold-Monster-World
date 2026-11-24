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
 const {world,scene}=env.HoMoWBetaRuntime;assert.equal(world.monsters.filter(m=>m.encounterSlot===undefined).length,141);assert.equal(world.nodes.length,190);
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

 const L=env.HoMoWLayout;assert.equal(L.report.nodes,190);assert.equal(L.report.spawns,141);
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
 for(const n of Object.values(betaR.TRADERS)){assert(!betaR.blocked(n.x,n.y,18),'NPC access '+n.name);const path=betaR.findPath(betaR.SPAWN.x,betaR.SPAWN.y,n.x,n.y);assert(path.length&&Math.hypot(path.at(-1).x-n.x,path.at(-1).y-n.y)<65,'route to '+n.name);}
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

test('beta minimap draws markers without text while the atlas keeps region names',()=>{let labels=[];const noop=()=>{},ctx=new Proxy({fillText:(text)=>labels.push(text)},{get:(o,k)=>k in o?o[k]:noop}),env={window:{BrukRealms:R}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'atlas.js'),'utf8'),env);const w=new World();env.window.HoMoWAtlas.mini(ctx,{width:175,height:120},w,{});assert.equal(labels.length,0);env.window.HoMoWAtlas.full(ctx,{width:1000,height:688},w);assert(labels.length>0);});
test('Space no longer attacks and the attack HUD control is hidden',()=>{const js=fs.readFileSync(path.join(__dirname,'client.js'),'utf8'),css=fs.readFileSync(path.join(__dirname,'world.css'),'utf8');assert(js.includes('attack:false'));assert(!js.includes("attack:keys.has('Space')"));assert(!js.includes("'Space',"));assert(css.includes('#attackAction{display:none!important}'));});

test('all canonical enemy and resource types have explicit, distinct visual identities',()=>{const S=require('./world-style.js');for(const id of Object.keys(R.TYPES))assert(S.mob(id).family);for(const id of Object.keys(R.NODE_TYPES))assert(S.resource(id).family);const ores=Object.keys(R.NODE_TYPES).filter(id=>id.startsWith('ore_t'));assert.equal(new Set(ores.map(id=>S.resource(id).color)).size,8);});

test('walking stops its gait against a wall and steps follow travelled distance',()=>{const w=new World({x:130,y:220});w.monsters=[];for(let i=0;i<50;i++)w.update(.05,{x:1});const phase=w.footstep,x=w.state.x;for(let i=0;i<20;i++)w.update(.05,{x:1});assert.equal(w.state.x,x);assert.equal(w.walking,false);assert.equal(w.footstep,phase);const a=new World(),b=new World();a.monsters=b.monsters=[];for(let i=0;i<10;i++){a.update(.05,{x:1});b.update(.05,{x:1,y:1});}assert(Math.abs(a.footstep-b.footstep)<1e-8);});
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

test('desktop inventory and shops filter without changing slots and trade exact quantities',async()=>{
 const {parseHTML}=await import('linkedom'),{window}=parseHTML(fs.readFileSync(path.join(__dirname,'index.html'),'utf8')),document=window.document;
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return this.querySelector('option[selected]')?.getAttribute('value')||'';},set(value){for(const o of this.querySelectorAll('option'))o.toggleAttribute('selected',o.getAttribute('value')===String(value));}});
 window.HTMLElement.prototype.showModal=function(){this.setAttribute('open','');};window.HTMLElement.prototype.close=function(){this.removeAttribute('open');};Object.defineProperty(window.HTMLElement.prototype,'open',{configurable:true,get(){return this.hasAttribute('open');}});
 const env={document,BrukRealms:require('./core.js'),BrukRealmsArt:{icon:()=>'<svg></svg>'},HoMoWPortrait(){},setTimeout:fn=>{fn();return 1;},clearTimeout(){}};env.window=env;vm.createContext(env);
 for(const file of ['inventory','panels','market'])vm.runInContext(fs.readFileSync(path.join(__dirname,file+'.js'),'utf8'),env);
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
 const exchange=document.createElement('div'),marketApi={refresh(){exchange.replaceChildren();env.HoMoWMarket.render(exchange,w,marketApi);},result(fn){const result=fn();if(result.ok)marketApi.refresh();return result;}};marketApi.refresh();
 const preset=n=>[...exchange.querySelectorAll('.exchange-presets button')].find(b=>b.textContent===n).click();preset('5');const price=w.quote('copper');exchange.querySelector('[data-sell="copper:bag"]').click();assert.equal(w.state.resources.copper,15);assert.equal(w.state.silver,500+5*price);
 preset('MAX');assert.equal(Number(exchange.querySelector('input[type=number]').value),50);assert(exchange.querySelector('[data-sell="copper:bag"]').disabled);assert(!exchange.querySelector('[data-sell="copper:bank"]').disabled);
 for(const n of ['-1','0','1.5','1001']){const amount=exchange.querySelector('input[type=number]');amount.value=n;amount.oninput();assert([...exchange.querySelectorAll('.exchange-controls button')].every(b=>b.disabled));}
 [...exchange.querySelectorAll('.exchange-toolbar button')].find(b=>b.textContent==='Купити').click();preset('5');const buyPrice=Math.ceil(w.quote('copper')*1.3),silver=w.state.silver;exchange.querySelector('.exchange-controls button').click();assert.equal(w.state.bank.copper,55);assert.equal(w.state.resources.copper,15);assert.equal(w.state.silver,silver-5*buyPrice);
 preset('MAX');assert.equal(Number(exchange.querySelector('input[type=number]').value),Math.min(1000,Math.floor(w.state.silver/buyPrice)));
 const search=exchange.querySelector('input[type=search]');search.value='немає такого ресурсу';search.oninput();assert.equal(exchange.querySelector('.exchange-controls'),null);
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
