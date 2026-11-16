(() => {
  'use strict';
  window.BrukJourney={create(world,ground,api){
    const $=id=>document.getElementById(id),R=window.BrukRealms,map=$('worldMap'),ctx=map.getContext('2d');
    function openMap(){api.clearKeys();drawMap();$('mapDialog').showModal();}
    function drawMap(){window.HoMoWAtlas.full(ctx,map,world,{resources:$('mapResources').checked,enemies:$('mapEnemies').checked});}
    function openEnding(){api.clearKeys();for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();$('victoryDialog').showModal();}
    function refresh(){$('recallAction').disabled=world.nearCamp()||world.inCombat();$('recallAction').textContent=world.recalling===null?'Повернутись · T':`Повернення · ${Math.max(0,6-world.recalling).toFixed(1)} с`;if($('mapDialog').open&&Date.now()-(refresh.at||0)>1000){refresh.at=Date.now();drawMap();}}
    $('mapAction').addEventListener('click',openMap);$('recallAction').addEventListener('click',()=>api.notice(world.beginRecall().message));
    for(const [button,dialog] of [['closeMap','mapDialog'],['closeVictory','victoryDialog']])$(button).addEventListener('click',()=>{$(dialog).close();api.focus();});
    for(const id of ['mapResources','mapEnemies'])$(id).addEventListener('change',drawMap);
    map.addEventListener('pointerdown',()=>api.notice('Карта показує орієнтири. Рух — WASD або стрілки.'));
    return {refresh,openMap,openEnding,open:()=>$('mapDialog').open||$('victoryDialog').open};
  }};
})();
