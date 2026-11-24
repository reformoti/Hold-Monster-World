/* Beta world layout: roads first, scenery second, resources and monster camps last. */
(()=>{'use strict';const R=window.BrukRealms,G=window.HoMoWGeography,D=window.BrukRealmsData,M=window.HoMoWMaze;
const hash=s=>[...String(s)].reduce((n,c)=>(Math.imul(n,33)+c.charCodeAt(0))>>>0,17);
const distance=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t);};
const areaOf=p=>R.DUNGEONS.find(d=>R.clusterOf(p)==='dungeon:'+d.id)?.arena||R.clusterAt(p.x,p.y);
const inside=(p,a,r=0)=>p.x>a.x+r&&p.x<a.x+a.w-r&&p.y>a.y+r&&p.y<a.y+a.h-r;
const gateFree=(p,r)=>R.PORTALS.every(g=>Math.hypot(g.x-p.x,g.y-p.y)>r);
const borderFree=(p,r)=>G.borders.every(b=>Math.hypot(b.x-p.x,b.y-p.y)>(b.kind==='ridge'?78:65)+r);
const reserved=p=>!gateFree(p,190)||Math.hypot(p.x-R.BILLBOARD.x,p.y-R.BILLBOARD.y)<130;
const free=(p,r)=>!R.blocked(p.x,p.y,r)&&borderFree(p,r);
function search(origin,seed,valid,margin=100){const a=areaOf(origin);if(valid(origin))return {...origin};for(let i=0;i<2400;i++){const p={x:a.x+margin+((hash(seed)+i*389)%997)/997*(a.w-2*margin),y:a.y+margin+((hash(seed)*7+i*577)%991)/991*(a.h-2*margin)};if(R.clusterOf(p)===R.clusterOf(origin)&&valid(p))return p;}throw Error('No safe beta position: '+seed);}
// A broad open square north-west of the camp, with a clear approach from the south.
Object.assign(R.BILLBOARD,{x:510,y:340});
// Decorative and wilderness obstacles must never occupy a gateway or the board square.
const scenery=R.OBSTACLES.filter(o=>!o.owner&&!['wall','citywall','dungeonwall','mountain','house'].includes(o.type)&&!R.DUNGEONS.some(d=>inside({x:o.x,y:o.y},d.arena)));
for(const [i,o]of scenery.entries()){const center={x:o.x+o.w/2,y:o.y+o.h/2};if(!reserved(center))continue;const radius=Math.hypot(o.w,o.h)/2+24,old={x:o.x,y:o.y};o.x=-10000;o.y=-10000;const p=search(center,'scenery'+i,p=>!reserved(p)&&!M.contains(p)&&!M.inPlain(p)&&free(p,radius)&&(!R.inVillage(p.x,p.y)||R.inVillage(center.x,center.y))&&(!R.inCity(p.x,p.y)||R.inCity(center.x,center.y)));o.x=p.x-o.w/2;o.y=p.y-o.h/2;}
// Build and retain actual walkable paths, with a straight approach normal to every gate.
const segments=[];G.roads.clear();
for(const a of R.CLUSTERS.filter(a=>!a.safe)){const gates=R.PORTALS.filter(p=>!p.betaDungeon&&[p.a,p.b].includes(a.id)),hub=search({x:a.x+a.w*.80,y:a.y+a.h*.80},a.id,p=>free(p,50)&&gateFree(p,220)&&!R.inVillage(p.x,p.y)&&!R.inCity(p.x,p.y));const routes=[];
for(const gate of gates){const to=R.CLUSTERS.find(c=>c.id===a.id),sign=gate.village?(gate.axis==='x'?(gate.x===R.VILLAGE.x?-1:1):(gate.y===R.VILLAGE.y?-1:1)):(gate.axis==='x'?(to.x<gate.x?-1:1):(to.y<gate.y?-1:1)),approach={x:gate.x+(gate.axis==='x'?sign*155:0),y:gate.y+(gate.axis==='y'?sign*155:0)},path=[{x:gate.x,y:gate.y},approach,...R.findPath(approach.x,approach.y,hub.x,hub.y)],fine=[path[0]];for(let i=1;i<path.length;i++){const p=path[i-1],q=path[i],steps=Math.max(1,Math.ceil(Math.hypot(q.x-p.x,q.y-p.y)/50));for(let j=1;j<=steps;j++)fine.push({x:p.x+(q.x-p.x)*j/steps,y:p.y+(q.y-p.y)*j/steps});}routes.push(fine);for(let i=1;i<fine.length;i++)segments.push([fine[i-1],fine[i]]);}
G.roads.set(a.id,routes);}
G.roads.set('village',[...Object.values(R.TRADERS),R.BILLBOARD,...R.VILLAGE.exits].map(n=>[{x:n.x,y:n.y},...R.findPath(n.x,n.y,R.CAMP.x,R.CAMP.y)]));for(const points of G.roads.get('village'))for(let i=1;i<points.length;i++)segments.push([points[i-1],points[i]]);
const roadFree=(p,r=55)=>segments.every(([a,b])=>distance(p,a,b)>r);
// Reserve a bounded subset of existing same-cluster IDs for the open plain, not new content.
function plainSite(origin,seed,valid){const a=M.plainRegions.find(a=>a.cluster===R.clusterOf(origin));if(!a)return null;const candidates=[];for(let y=a.y+65;y<=a.y+a.h-65;y+=40)for(let x=a.x+65;x<=a.x+a.w-65;x+=40)candidates.push({x,y});const start=hash(seed)%candidates.length;for(let i=0;i<candidates.length;i++){const p=candidates[(start+i)%candidates.length];if(R.clusterOf(p)===a.cluster&&valid(p))return p;}return null;}
// Disperse deposits off roads and rock faces; preserve every node's ID, type and tier.
const placed=[],plainNodeIDs=[],plainNodes=new Map();let nodesMoved=0;for(const n of D.NODES){const origin={x:n.x,y:n.y},cluster=R.clusterOf(n),dungeon=cluster.startsWith('dungeon:'),wood=R.NODE_TYPES[n.type].tool==='axe',radius=wood?38:32;
const valid=p=>free(p,radius+24)&&(!wood||!M.inPlain(p))&&gateFree(p,185)&&(!dungeon?roadFree(p,65):true)&&Math.hypot(p.x-R.BILLBOARD.x,p.y-R.BILLBOARD.y)>145&&Object.values(R.TRADERS).every(t=>Math.hypot(p.x-t.x,p.y-t.y)>105)&&placed.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>100)&&(!R.inVillage(p.x,p.y)||cluster==='village')&&(!R.inCity(p.x,p.y)||R.inCity(origin.x,origin.y));
const preferred=!wood&&(plainNodes.get(cluster)||0)<2?plainSite(origin,'plain-node'+n.id,valid):null,p=preferred||search(origin,'node'+n.id,valid,90);Object.assign(n,p);placed.push(n);if(M.inPlain(p)){plainNodes.set(cluster,(plainNodes.get(cluster)||0)+1);plainNodeIDs.push(n.id);}if(Math.hypot(origin.x-n.x,origin.y-n.y)>1)nodesMoved++;}
// Each monster gets an unobstructed camp in its own original cluster, apart from deposits.
const camps=[],plainMobIDs=[],plainMobs=new Map();let mobsMoved=0;for(const [id,s]of D.SPAWNS.entries()){const origin={x:s[1],y:s[2]},cluster=R.clusterOf(origin),dungeon=cluster.startsWith('dungeon:'),r=R.TYPES[s[0]].radius;
if(dungeon)continue;
if(s[0]==='pass_guardian'){
  // This encounter unlocks the barrier. Its authored camp belongs on the approach road.
  if(!free(origin,r+20)||R.personalBlocked({passUnlocked:false},origin.x,origin.y,r))throw Error('Blocked pass guardian camp');
  camps.push(origin);continue;
}
const valid=p=>(!M.plainSpawns.some(m=>m.id===id)||M.inPlain(p))&&free(p,r+35)&&inside(p,areaOf(p),115)&&gateFree(p,240)&&roadFree(p,85)&&!R.inVillage(p.x,p.y)&&!R.inCity(p.x,p.y)&&D.NODES.every(n=>Math.hypot(n.x-p.x,n.y-p.y)>r+90)&&camps.every(q=>Math.hypot(q.x-p.x,q.y-p.y)>110);
const preferred=(plainMobs.get(cluster)||0)<2?plainSite(origin,'plain-mob'+id,valid):null,p=preferred||search(origin,'mob'+id,valid,110);s[1]=p.x;s[2]=p.y;camps.push(p);if(M.inPlain(p)){plainMobs.set(cluster,(plainMobs.get(cluster)||0)+1);plainMobIDs.push(id);}if(Math.hypot(origin.x-p.x,origin.y-p.y)>1)mobsMoved++;}
// Remove visual clutter from the protected approaches as well.
for(let i=R.DECOR.length-1;i>=0;i--){const p=R.DECOR[i],protectedGround=(M.contains(p)||M.inPlain(p))&&['grass','flowers'].includes(p.kind);if(!protectedGround&&(reserved(p)||!roadFree(p,45)||(M.contains(p)||M.inPlain(p))&&!['grass','flowers'].includes(p.kind)))R.DECOR.splice(i,1);}
for(const a of M.plainRegions)if(!(plainNodes.get(a.cluster)>0)||!(plainMobs.get(a.cluster)>0))throw Error('Empty beta plain: '+a.cluster);
window.HoMoWLayout={free,roadFree,gateFree,borderFree,distance,segments,report:{obstacles:R.OBSTACLES.length,nodes:D.NODES.length,spawns:D.SPAWNS.length,nodesMoved,mobsMoved,plainNodeIDs,plainMobIDs}};
})();
