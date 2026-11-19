/* Keep IDs, tiers, yield and cluster membership; move ore out of settlements and blocked sites. */
(()=>{'use strict';const D=window.BrukRealmsData,ores=D.NODES.filter(n=>D.NODE_TYPES[n.type].tool==='pickaxe'),oreIDs=new Set(ores.map(n=>n.id)),occupied=D.NODES.filter(n=>!oreIDs.has(n.id)),moved=[];
const hash=s=>[...s].reduce((a,c)=>(Math.imul(a,33)+c.charCodeAt(0))>>>0,19);
const free=(x,y,r=38)=>x>70&&x<D.WIDTH-70&&y>70&&y<D.HEIGHT-70&&!D.OBSTACLES.some(o=>Math.hypot(x-Math.max(o.x,Math.min(o.x+o.w,x)),y-Math.max(o.y,Math.min(o.y+o.h,y)))<r);
const safe=(p,cluster)=>D.clusterOf(p)===cluster&&free(p.x,p.y)&&!D.inVillage(p.x,p.y)&&!D.inCity(p.x,p.y)&&D.PORTALS.every(q=>Math.hypot(q.x-p.x,q.y-p.y)>160)&&Object.values(D.TRADERS).every(q=>Math.hypot(q.x-p.x,q.y-p.y)>130)&&D.SPAWNS.every(q=>Math.hypot(q[1]-p.x,q[2]-p.y)>70)&&occupied.every(q=>Math.hypot(q.x-p.x,q.y-p.y)>62);
for(const n of ores){const original={x:n.x,y:n.y},cluster=D.clusterOf(n),area=D.DUNGEONS.find(d=>'dungeon:'+d.id===cluster)?.arena||D.clusterAt(n.x,n.y),seed=hash(String(n.id)+n.type),rocks=D.OBSTACLES.filter(o=>['rock','mountain'].includes(o.type)&&!o.betaKind&&D.clusterOf({x:o.x,y:o.y})===cluster);let point=null;
 // A deposit beside a natural rock face is preferred over a random point on a path.
 for(let i=0;i<rocks.length*8;i++){const rock=rocks[(i+seed)%rocks.length],a=(i%8)*Math.PI/4,p={x:rock.x+rock.w/2+Math.cos(a)*(rock.w/2+58),y:rock.y+rock.h/2+Math.sin(a)*(rock.h/2+58)};if(safe(p,cluster)){point=p;break;}}
 for(let i=0;!point&&i<600;i++){const u=(seed*13+i*389)%997/997,v=(seed*17+i*577)%991/991,p={x:area.x+95+u*(area.w-190),y:area.y+95+v*(area.h-190)};if(safe(p,cluster))point=p;}
 if(point){Object.assign(n,point);if(Math.hypot(n.x-original.x,n.y-original.y)>1)moved.push(n.id);}occupied.push(n);
}
window.HoMoWOreLayout={moved,oreIDs:[...oreIDs]};
})();
