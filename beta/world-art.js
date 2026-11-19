/* Beta environment: buildings, collectible plants, geology and village life. */
(()=>{'use strict';const S=window.HoMoWWorldStyle;
window.HoMoWEnvironment={
 building(o,time){const id=o.owner||'home',x=o.x+o.w/2,z=o.y+o.h/2,w=o.w,d=o.h;
 const palette={blacksmith:['d9b28a','b95638'],mage:['bcb4df','5c69bf'],enchanter:['b6d5c6','398a89'],armorer:['c4c9ba','486c8d'],alchemist:['d9d8a2','498e64'],artificer:['deb67a','b87e3e'],quartermaster:['b5c2bc','6b7792'],market:['e9ce9b','bc6345']},[wall,roof]=palette[id]||palette.market;
 const p=(dx,y,dz,sx,sy,sz,c,k='cube',turn=0)=>this.draw(k,x+dx,y,z+dz,sx,sy,sz,c,turn);
 const high=id==='mage'?118:id==='quartermaster'?80:62;
 p(0,5,0,w+6,10,d+6,'9ba99a');
 if(id==='market'){for(const dx of [-w*.43,w*.43])for(const dz of [-d*.4,d*.4])p(dx,34,dz,6,68,6,'8c633d');p(0,68,0,w+18,28,d+16,'eac976','roof');for(let i=0;i<5;i++)p((i-2)*w/5,70,0,w/10,3,d+16,i%2?'eac976':'c16b4b');p(0,26,d*.25,w*.85,10,22,'b27a44');for(let i=0;i<6;i++)p((i-2.5)*13,36,d*.25,6,6,6,['d99248','7cc05b','d36c55'][i%3],'sphere');return;}
 p(0,high/2+10,0,w,high,d,wall);for(const dx of [-w/2+4,w/2-4])p(dx,high/2+10,0,7,high+4,d+2,'825c42');p(0,high*.6,0,w+2,5,d+2,'956d4c');
 if(id==='mage'){p(0,high+10,0,w*.74,95,d*.74,roof,'cone');p(0,high+103,0,8,15,8,'f0d081','sphere');}else{p(0,high+10,0,w+18,id==='armorer'?35:48,d+18,roof,'roof');p(0,high+59,0,7,4,d+20,'d79865');}
 p(0,29,d/2+1,22,42,4,'69523a');p(7,28,d/2+4,3,3,2,'ebd18c','sphere');p(0,5,d/2+11,36,8,20,'b6b49d');
 for(const side of [-1,1]){p(side*w*.3,high*.53,d/2+2,21,24,3,'647b79');p(side*w*.3,high*.53,d/2+4,15,17,2,'f3d993');p(side*w*.3,high*.53,d/2+5,2,18,1,'96724b');p(side*w*.3,high*.53,d/2+5,16,2,1,'96724b');p(side*w*.3,high*.53-15,d/2+7,26,4,9,'9a704b');}
 if(id==='blacksmith'){p(w*.3,high+22,-d*.2,23,72,25,'9a8272');p(w*.3,high+59,-d*.2,31,8,31,'c5b8a5');for(let i=0;i<3;i++)p(w*.3+Math.sin(time+i)*8,high+80+i*16,-d*.2+i*5,10+i*5,9+i*3,10+i*5,'c2cbd2','sphere');}
 if(id==='enchanter'){p(-w*.3,high+58,0,11,27,11,'6bd6d2','cone');p(w*.3,high+40,0,9,20,9,'b0a1ef','cone');p(0,52,d/2+6,13,18,2,'5dbaaa');}
 if(id==='alchemist'){p(w*.5+16,30,0,24,46,d*.65,'a0d9c6');for(let i=0;i<3;i++)p(w*.5+29,30,(i-1)*d*.2,3,50,3,'e0ce95');p(w*.5+15,55,0,30,12,d*.7,'94d8bf','roof');}
 if(id==='artificer'){const a=time*.15;for(let i=0;i<4;i++){const b=a+i*Math.PI/2;p(Math.sin(b)*32,high+32+Math.cos(b)*32,d/2+11,10,42,4,'d4c49a','cube',-b);}p(0,high+32,d/2+15,12,12,8,'796044','sphere');}
 if(id==='quartermaster'){p(-w*.28,high+15,d*.25,28,35,28,wall);p(-w*.28,high+32,d*.25,35,18,35,roof,'roof');p(0,29,d/2+4,45,40,5,'8b6848');for(const dx of [-9,9])p(dx,29,d/2+7,2,40,1,'d3ac72');}
 },
 resource(n,time){const v=S.resource(n.type),x=n.x,z=n.y,alive=n.charges>0,t=v.tier,c=alive?v.color:'8e9383',p=(dx,y,dz,sx,sy,sz,col=c,k='cube',a=0)=>this.draw(k,x+dx,y,z+dz,sx,sy,sz,col,a);
 if(v.family==='wood'){this.treeModel(x,z,t,v.shape,alive,RBiome(n),n.id);return;}
 if(v.family==='fiber'||v.family==='herb'){if(!alive){p(0,2,0,14,4,14,'967d51');return;}for(let i=0;i<5;i++){const a=i*2.4,dx=Math.cos(a)*12,dz=Math.sin(a)*9;p(dx,13,dz,3,24,3,'588747');p(dx+4,15,dz,10,6,7,v.family==='herb'?'49b278':'86bb52','sphere',a);p(dx-3,20,dz,8,7,7,c,'sphere');if(v.family==='herb'||t>3)p(dx,25,dz,3,4,3,v.family==='herb'?'e39555':c,'sphere');}return;}
 if(v.family==='hide'){for(const side of [-1,1])p(side*18,24,0,4,48,4,'9e784c');p(0,46,0,42,5,5,'b38b57');p(0,27,0,27,30,3,alive?['b78256','ccb58b','9c745a','decc9b'][v.shape]:'8b8068');return;}
 p(0,11,0,27,18,23,v.family==='stone'?'a4b6ad':'788f97','sphere');if(!alive)return;
 const count=v.family==='stone'?3:3+v.shape;for(let i=0;i<count;i++){const a=i*2.399,dx=Math.cos(a)*13,dz=Math.sin(a)*10;if(v.family==='stone')p(dx,10+i*4,dz,13,15,11,['b1c0b0','899b9f','ced0ba'][i%3],'sphere');else if(v.family==='crystal'||v.shape===2||v.shape===3)p(dx,14,dz,5+i%3,20+t*2+i*3,5+i%3,c,'cone');else p(dx,17+i%2*5,dz,9+t,7+v.shape*4,7+t,c,'cube',a);}
 },
 treeModel(x,z,t,shape,alive,biome,seed=0){const p=(dx,y,dz,sx,sy,sz,c,k='cube')=>this.draw(k,x+dx,y,z+dz,sx,sy,sz,c);if(!alive){p(0,7,0,14,14,14,'986943');p(0,15,0,15,2,15,'dbc48e');return;}const snow=biome==='winter',height=43+t*3,leaf=snow?'c7ead7':['53af53','79c64e','3b9a70','69b395'][shape],bark=shape===2?'e5dcbe':'996942';p(0,height/2,0,10+t,height,10+t,bark);if(shape===2)for(let i=0;i<4;i++)p(1,8+i*10,6,11,2,1,'715d4b');if(shape===0){p(0,height*.65,0,28+t*2,55+t*3,28+t*2,leaf,'cone');p(0,height+12,0,21+t,42,21+t,snow?'e7f4e6':'69bf65','cone');}else{for(let i=0;i<3;i++){const a=i*2.1+seed;p(Math.cos(a)*16,height+5+i*5,Math.sin(a)*13,25+t*1.5,21+t,24+t*1.5,leaf,'sphere');}if(shape===3)for(const side of [-1,1])p(side*25,height-4,0,8,28,10,leaf,'sphere');}p(0,height+26,0,24+t,23+t,23+t,leaf,shape===1?'sphere':'cone');},
 prop(o,time){const x=o.x+o.w/2,z=o.y+o.h/2,w=o.w,d=o.h,p=(dx,y,dz,sx,sy,sz,c,k='cube',a=0)=>this.draw(k,x+dx,y,z+dz,sx,sy,sz,c,a),kind=o.betaKind;
 if(['pine','oak','birch'].includes(kind)){this.treeModel(x,z,2,{pine:0,oak:1,birch:2}[kind],true,RBiome(o),o.seed);return;}
 if(kind==='ruin'){for(let i=0;i<3;i++){p((i-1)*13,15+i%2*13,0,11,30+i%2*26,15,'a7b6aa');p((i-1)*13,32+i%2*26,0,15,5,18,'c3cbb7');}return;}
 if(kind==='deadwood'||kind==='woodpile'){for(let i=0;i<4;i++){p((i%2-.5)*12,6+Math.floor(i/2)*9,0,10,10,kind==='woodpile'?50:34,'9d7145');p((i%2-.5)*12,6+Math.floor(i/2)*9,kind==='woodpile'?26:18,8,8,2,'d0b77c');}return;}
 if(kind==='well'){for(let i=0;i<12;i++){const a=i*Math.PI/6;p(Math.cos(a)*16,10,Math.sin(a)*16,10,20,9,'d5c4a0','cube',a);}for(const dx of [-24,24])p(dx,35,0,5,70,5,'997044');p(0,68,0,62,24,50,'c76c45','roof');p(0,41,0,37,3,3,'89643e');p(0,29,0,1,23,1,'e0cd9d');p(0,18,0,10,12,10,'9b8061');return;}
 if(kind==='cart'){p(0,17,0,w,7,d,'ab7d43');for(const dx of [-w*.4,w*.4])p(dx,25,0,4,18,d,'bd9557');for(const dx of [-w*.32,w*.32])for(const dz of [-d*.55,d*.55])p(dx,11,dz,12,20,4,'6f5338','sphere');p(w*.65,14,0,35,4,5,'9f7842');p(0,26,0,20,17,18,'d9b66c');return;}
 if(kind==='forge'){p(0,16,0,w,32,d,'8b9494');p(0,34,0,w+7,7,d+4,'bac3b7');p(0,39,0,w*.7,4,d*.65,'f7b35f');for(let i=0;i<3;i++)p((i-1)*10,41,0,5,11+Math.sin(time*5+i)*3,5,'ffc868','cone');return;}
 if(kind==='bench'){for(const dx of [-w*.35,w*.35])p(dx,10,0,6,20,14,'775c3c');p(0,21,0,w,5,d,'cba168');p(0,32,-d*.4,w,12,4,'ac804c');return;}
 if(kind==='lantern'){p(0,42,0,5,84,5,'6b6452');p(0,84,0,16,18,16,'ead58c');p(0,96,0,21,10,21,'5f7783','roof');return;}
 for(let i=0;i<(kind==='barrels'?2:3);i++){const dx=(i-1)*15;p(dx,13,0,14,25,17,kind==='barrels'?'b7894c':'c19a5c',kind==='barrels'?'sphere':'cube');for(const y of [7,20])p(dx,y,0,16,3,18,'6d786d');}
 },
 villageGround(w){const R=window.BrukRealms;if(!R.inVillage(w.state.x,w.state.y))return;this.villagePaths??=Object.values(R.TRADERS).map(n=>[{x:n.x,y:n.y},...R.findPath(n.x,n.y,R.CAMP.x,R.CAMP.y)]);
 for(const points of this.villagePaths)for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b.x-a.x,dz=b.y-a.y,l=Math.hypot(dx,dz);this.draw('cube',(a.x+b.x)/2,0,(a.y+b.y)/2,l+4,1,27,'c5b27a',-Math.atan2(dz,dx));}
 this.draw('sphere',R.CAMP.x,1,R.CAMP.y,62,1,56,'d1c28e');for(let i=0;i<12;i++){const a=i*Math.PI/6;this.draw('cube',R.CAMP.x+Math.cos(a)*52,2,R.CAMP.y+Math.sin(a)*48,9,3,9,'e3d2a8',a);}
 for(let i=0;i<8;i++){const a=i*Math.PI/4;this.draw('sphere',R.CAMP.x+Math.cos(a)*16,4,R.CAMP.y+Math.sin(a)*16,6,5,5,'a1a897');}for(const a of [-.6,.6])this.draw('cube',R.CAMP.x,5,R.CAMP.y,8,7,33,'96633d',a);for(let i=0;i<3;i++)this.draw('cone',R.CAMP.x+(i-1)*5,7,R.CAMP.y,6,19+(this.opt?.animations===false?0:Math.sin(w.time*5+i)*4),6,i%2?'ffe29a':'ffad56');

 },
 guard(n,time,index){const sway=this.opt?.animations===false?0:Math.sin(time*.9+index)*.02;this.hero({state:{x:n.x,y:n.y,weaponKind:'spear',armorKind:'plate',supportKind:'shield',appearance:{beard:'none'},outfits:{head:'soldier_helm'}},facing:{x:.9,y:.25+sway},walking:false,footstep:0,time,swing:0,hurt:0});this.draw('cube',n.x,87,n.y,8,17,22,index?'daa844':'3f9dbc');this.draw('cube',n.x-15,48,n.y+15,3,17,14,'4c82a6');this.tag(index?'Вартовий брами':'Капітан варти',n.x,n.y,118,null);},
 villageLife(w){const R=window.BrukRealms;if(!R.inVillage(w.state.x,w.state.y))return;const time=this.opt?.animations===false?0:w.time;
 for(const [i,a]of [[0,{x:535,y:640}],[1,{x:750,y:730}],[2,{x:340,y:340}]]){const p={x:a.x+Math.sin(time*.18+i)*15,y:a.y+Math.cos(time*.18+i)*12};if(!R.blocked(p.x,p.y,20)&&this.visibleAt(p))this.trader(p,['market','alchemist','quartermaster'][i],time);}
 // Gate towers, hanging banners and an open arch; the existing exit remains free.
 for(const y of [395,610]){const x=950;if(!this.visibleAt({x,y}))continue;this.draw('cube',x,35,y,38,70,38,'b8bdab');this.draw('roof',x,70,y,55,25,55,'478aa8');this.draw('cube',x-23,49,y,3,28,17,'e3bd61');}
 this.draw('cube',950,106,502,25,14,210,'b49662');
 }
};
function RBiome(p){return window.BrukRealms.clusterAt(p.x,p.y).biome;}
})();
