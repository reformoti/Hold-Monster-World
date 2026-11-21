/* Art measurements. Simulation positions, collision radii and saved IDs stay in world units. */
(()=>{'use strict';
const metre=32,human=1.78*metre/80;
const weapon={sword_broadsword:.83,sword_dual:.83,axe_battleaxe:.82,daggers_dagger:.61,daggers_pair:.68,daggers_claws:.71,
 spear_spear:1.12,spear_pike:1.28,bow_longbow:1.08,bow_crossbow:.88};
const mount={horse:.78,warhorse:.83,donkey:.65,direwolf:.77};
// Scale is specified by a meaningful landmark on the mesh, such as withers or scalp.
const sizes={
 rat:[.27,34],caverat:[.40,34],wolf:[.81,45],snowwolf:[.87,45],icewolf:[.91,45],bogwolf:[.82,45],
 boar:[.94,47],bear:[1.27,65],armoredbear:[1.75,65],slime:[.7,36],spider:[.60,36],
 salamander:[.61,36],bluelizard:[.82,36],treant:[3.8,126],ancient:[4.0,125],titan:[4.9,125],
 goldtitan:[5.0,125],frostgiant:[4.1,125],firegiant:[4.6,125],golem:[2.65,84],
 crystalgolem:[2.9,103],icegolem:[2.8,103],goldgolem:[2.9,103]
};
function creature(v,t){const [height,landmark]=sizes[v.family]||[1.78,79];
 return metre*height/landmark*(v.elite?1.15:t.boss&&!['titan','ancient','goldtitan','frostgiant','firegiant'].includes(v.family)?1.22:1);}
window.HoMoWScale={metre,human,weapon,mount,creature};
})();
