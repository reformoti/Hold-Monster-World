/* Beta geography shares the canonical cluster arrays, so movement and combat agree. */
(()=>{'use strict';const D=window.BrukRealmsData,V=D.VILLAGE;
const town={id:'village',name:'Містечко Вербове',biome:'plains',tier:0,level:1,x:V.x,y:V.y,w:V.w,h:V.h,safe:true};D.CLUSTERS.unshift(town);
D.CLUSTERS.find(c=>c.id==='c00').name='Вербові луки';
for(const [i,p]of V.exits.entries())D.PORTALS.push({id:'village-'+i,a:'village',b:'c00',x:p.x,y:p.y,axis:[0,3].includes(i)?'x':'y',village:true});
const borders=[];for(const a of D.CLUSTERS.filter(c=>!c.safe))for(const b of D.CLUSTERS.filter(c=>!c.safe)){if(a.id>=b.id)continue;let vertical,start,end,fixed;if(a.x+a.w===b.x||b.x+b.w===a.x){vertical=true;fixed=Math.max(a.x,b.x);start=Math.max(a.y,b.y);end=Math.min(a.y+a.h,b.y+b.h);}else if(a.y+a.h===b.y||b.y+b.h===a.y){vertical=false;fixed=Math.max(a.y,b.y);start=Math.max(a.x,b.x);end=Math.min(a.x+a.w,b.x+b.w);}else continue;if(end<=start)continue;
for(let d=start+45;d<end;d+=90){const x=vertical?fixed:d,y=vertical?d:fixed;if(D.PORTALS.some(p=>Math.hypot(p.x-x,p.y-y)<195))continue;const kind=a.biome==='winter'||b.biome==='winter'?'ridge':a.biome==='swamp'||b.biome==='swamp'?'water':'forest';borders.push({x,y,kind,seed:Math.floor(d),vertical});}}
// Map and world consume the same palette and border positions.
const palette={plains:'#91bd60',forest:'#327b59',swamp:'#4c9290',winter:'#c0dfe9'};for(const [id,color]of Object.entries(palette))D.BIOMES[id].color=color;
window.HoMoWGeography={town,borders,palette,roads:new Map()};
})();
