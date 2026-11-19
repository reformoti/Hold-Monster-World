/* Applied only inside the beta document, before the canonical simulation is built. */
(()=>{'use strict';const D=window.BrukRealmsData;
const layout={blacksmith:[130,155,170,125,265,330],mage:[535,120,110,125,585,290],enchanter:[740,240,120,105,800,390],armorer:[100,425,130,110,260,500],alchemist:[615,545,115,100,660,705],artificer:[200,690,130,90,360,735],quartermaster:[440,730,120,100,590,790],market:[330,390,110,80,415,530]};
for(const h of D.HOUSES){const [x,y,w,hgt,nx,ny]=layout[h.owner];Object.assign(h,{x,y,w,h:hgt});Object.assign(D.TRADERS[h.owner],{x:nx,y:ny});}
const props=[['well',450,380,38,38],['cart',260,580,65,36],['forge',165,292,42,32],['barrels',100,310,30,35],['crates',740,690,45,35],['bench',725,445,60,18],['woodpile',145,645,60,24],['lantern',895,406,12,12],['lantern',895,582,12,12]];
for(const [betaKind,x,y,w,h]of props)D.OBSTACLES.push({x,y,w,h,type:'rock',betaKind});
// Sparse, reproducible scenery. Trunks and ruins have matching collision footprints.
let seed=716243;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
for(let i=0;i<700;i++){const x=100+random()*(D.WIDTH-200),y=100+random()*(D.HEIGHT-200);if(D.inVillage(x,y)||D.inCity(x,y)||D.DUNGEONS.some(d=>x>d.arena.x-100&&x<d.arena.x+d.arena.w+100&&y>d.arena.y-100&&y<d.arena.y+d.arena.h+100)||D.OBSTACLES.some(o=>x>o.x-80&&x<o.x+o.w+80&&y>o.y-80&&y<o.y+o.h+80)||D.SPAWNS.some(s=>Math.hypot(s[1]-x,s[2]-y)<110)||D.NODES.some(n=>Math.hypot(n.x-x,n.y-y)<80))continue;D.OBSTACLES.push({x,y,w:20,h:20,type:'rock',betaKind:['pine','oak','birch','ruin','deadwood'][i%5],seed:i});}
const clear=(x,y,r=22)=>!D.OBSTACLES.some(o=>x>o.x-r&&x<o.x+o.w+r&&y>o.y-r&&y<o.y+o.h+r);
// Relocate only resource points covered by a moved building, retaining stable node IDs.
for(const n of D.NODES)if(D.inVillage(n.x,n.y)&&!clear(n.x,n.y))for(let i=0;i<80;i++){const x=105+(n.id*97+i*53)%790,y=120+(n.id*67+i*41)%700;if(clear(x,y)&&Object.values(D.TRADERS).every(t=>Math.hypot(t.x-x,t.y-y)>48)){Object.assign(n,{x,y});break;}}
D.GUARDS[0].x=923;D.GUARDS[0].y=430;D.GUARDS[1].x=923;D.GUARDS[1].y=575;
window.HoMoWVillage={layout,props:props.length};
})();
