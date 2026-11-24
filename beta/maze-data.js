/* Beta-only geometry overlay. Run before resources/geography/core in browser and planner. */
(()=>{'use strict';const D=window.BrukRealmsData;
const regions=[{id:'maze-west',cluster:'c10',x:960,y:1665,w:1040,h:1050,cols:5,rows:5},{id:'maze-east',cluster:'c11',x:2000,y:1665,w:1248,h:1050,cols:6,rows:5}];
const plainRegions=[{id:'plain-north',cluster:'c10',x:940,y:2830,w:1020,h:290},{id:'plain-south',cluster:'c20',x:940,y:3320,w:1020,h:1750}];
const plainSpawns=[['wolf',1100,3500],['boar',1750,3600],['bear',1220,3970],['wolf',1720,4280],['boar',1140,4630],['bear',1780,4900]].map(([type,x,y])=>{const id=D.SPAWNS.length;D.SPAWNS.push([type,x,y]);return {id,type,x,y};});
const within=(p,a,r=0)=>p.x>=a.x-r&&p.x<=a.x+a.w+r&&p.y>=a.y-r&&p.y<=a.y+a.h+r;
const overlaps=(o,a)=>o.x<a.x+a.w&&o.x+o.w>a.x&&o.y<a.y+a.h&&o.y+o.h>a.y;
const contains=p=>regions.some(a=>within(p,a))||D.DUNGEONS.some(d=>within(p,d.arena));
const inPlain=p=>plainRegions.some(a=>within(p,a));
const exteriorConnections=[{x:860,y:1725},{x:912,y:1725},{x:912,y:1770},{x:1064,y:1770}];
const connector={x:865,y:1640,w:99,h:235};
// Never remove buildings, pass terrain or the other authored stone arenas.
const natural=o=>!o.owner&&['rock','water','tree','pine','oak','birch','deadwood','ruin','stump','stones'].includes(o.type)&&!D.DUNGEONS.some(d=>overlaps(o,d.arena));
for(let i=D.OBSTACLES.length-1;i>=0;i--){const o=D.OBSTACLES[i];if(natural(o)&&(regions.some(a=>overlaps(o,a))||overlaps(o,connector)||plainRegions.some(a=>overlaps(o,a)&&(o.betaKind&&!['grass','flowers'].includes(o.betaKind)||['tree','pine','oak','birch','deadwood','ruin','stump','stones'].includes(o.type)))))D.OBSTACLES.splice(i,1);}
for(let i=D.DECOR.length-1;i>=0;i--){const p=D.DECOR[i];if((contains(p)||inPlain(p))&&!['grass','flowers'].includes(p.kind))D.DECOR.splice(i,1);}
const wall=(x,y,w,h,extra={})=>{if(w>0&&h>0)D.OBSTACLES.push({x,y,w,h,type:'dungeonwall',betaMaze:true,...extra});};
const cells=[],edges=[],openings=[],thickness=24;
function maze(a,seed){
 const cw=a.w/a.cols,ch=a.h/a.rows,local=[],links=new Set(),key=(i,j)=>i<j?i+':'+j:j+':'+i;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let row=0;row<a.rows;row++)for(let col=0;col<a.cols;col++)local.push({id:a.id+':'+(row*a.cols+col),region:a.id,col,row,x:a.x+(col+.5)*cw,y:a.y+(row+.5)*ch});
 const neighbors=i=>{const p=local[i],out=[];if(p.col)out.push(i-1);if(p.col<a.cols-1)out.push(i+1);if(p.row)out.push(i-a.cols);if(p.row<a.rows-1)out.push(i+a.cols);return out;};
 const seen=new Set([0]),stack=[0];
 while(stack.length){const i=stack.at(-1),choices=neighbors(i).filter(j=>!seen.has(j));if(!choices.length){stack.pop();continue;}const j=choices[Math.floor(random()*choices.length)];links.add(key(i,j));seen.add(j);stack.push(j);}
 // A few loops provide flanking routes without reducing the maze to straight alternating bars.
 for(let i=0;i<local.length;i++)for(const j of neighbors(i))if(j>i&&!links.has(key(i,j))&&random()<.14)links.add(key(i,j));
 for(let row=0;row<a.rows;row++)for(let col=0;col<a.cols;col++){const i=row*a.cols+col;if(col<a.cols-1&&!links.has(key(i,i+1)))wall(a.x+(col+1)*cw-thickness/2,a.y+row*ch,thickness,ch,{mazeRegion:a.id});if(row<a.rows-1&&!links.has(key(i,i+a.cols)))wall(a.x+col*cw,a.y+(row+1)*ch-thickness/2,cw,thickness,{mazeRegion:a.id});}
 const west=a.id==='maze-west',northCol=west?0:4,southCol=west?0:4;
 for(let row=0;row<a.rows;row++){
   if(!(west&&row===0)&&!(!west&&row===3))wall(a.x,a.y+row*ch,thickness,ch,{mazeRegion:a.id});
   if(row!==3)wall(a.x+a.w-thickness,a.y+row*ch,thickness,ch,{mazeRegion:a.id});
 }
 for(let col=0;col<a.cols;col++){if(col!==northCol)wall(a.x+col*cw,a.y,cw,thickness,{mazeRegion:a.id});if(col!==southCol)wall(a.x+col*cw,a.y+a.h-thickness,cw,thickness,{mazeRegion:a.id});}
 openings.push({region:a.id,side:'north',x:local[northCol].x,y:a.y,width:cw-thickness},{region:a.id,side:'south',x:local[(a.rows-1)*a.cols+southCol].x,y:a.y+a.h,width:cw-thickness},{region:a.id,side:'east',x:a.x+a.w,y:2400,width:ch-thickness});
 if(west)openings.push({region:a.id,side:'west',x:a.x,y:1770,width:ch-thickness});else openings.push({region:a.id,side:'west',x:a.x,y:2400,width:ch-thickness});
 cells.push(...local);for(const link of links){const [i,j]=link.split(':').map(Number);edges.push([local[i].id,local[j].id]);}
}
maze(regions[0],716243);maze(regions[1],941803);
edges.push(['maze-west:19','maze-east:18']);
// Baffles keep a 105-unit clearance from authored stage points.
const dungeonWalls=[];
for(const d of D.DUNGEONS){const a=d.arena,protectedPoints=[d.spawn,d.chest,d.exit,...d.waves.flat().map(i=>({x:D.SPAWNS[i][1],y:D.SPAWNS[i][2]})),...d.gates.flatMap(g=>[{x:g.x+g.w/2,y:g.y-95},{x:g.x+g.w/2,y:g.y+g.h+95}])];
 const candidates=[[142,48,24,108],[22,156,144,24],[634,48,24,108],[658,156,100,24],[142,282,24,118],[22,400,144,24],[634,282,24,118],[658,450,100,24],[142,575,24,150],[22,735,144,24],[634,575,24,150],[658,815,100,24]];
 // The cavern's new side door needs a clear approach, not an L-shaped sealed pocket.
 for(const [x,y,w,height]of candidates){if(d.id==='cavern'&&x===658&&y===156)continue;const h=d.id==='cavern'&&x===634&&y===48?36:height,o={x:a.x+x,y:a.y+y,w,h};if(protectedPoints.some(p=>Math.hypot(p.x-Math.max(o.x,Math.min(o.x+o.w,p.x)),p.y-Math.max(o.y,Math.min(o.y+o.h,p.y)))<105))continue;wall(o.x,o.y,w,h,{betaDungeonInterior:d.id});dungeonWalls.push({...o,dungeon:d.id});}
}
const cavern=D.DUNGEONS.find(d=>d.id==='cavern'),a=cavern.arena,east=D.OBSTACLES.find(o=>o.type==='dungeonwall'&&o.x===a.x+a.w-22&&o.y===a.y&&o.w===22&&o.h===a.h);
if(!east)throw Error('Missing authored cavern east wall');
const cavernExit={id:'cavern-maze',a:'dungeon:cavern',b:'c10',x:860,y:1725,axis:'x',betaDungeon:true};
// A 160-unit opening, only in the cavern's final room. The adapter owns reward/entry locks.
east.h=45;wall(east.x,1805,22,a.y+a.h-1805,{betaDungeonInterior:'cavern'});
D.PORTALS.push(cavernExit);
window.HoMoWMaze={regions,plainRegions,plainSpawns,contains,inPlain,within,cells,edges,openings,thickness,dungeonWalls,cavernExit,exteriorConnections};
})();
