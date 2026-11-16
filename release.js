(function(root){
  'use strict';
  const release={version:'6.37.0',date:'2026-11-16',name:'HoMoW 3D Frontiers'};
  root.BrukRelease=Object.freeze(release);
  if(root.document){
    document.querySelectorAll('[data-game-version]').forEach(el=>el.textContent='v'+release.version);
    document.querySelectorAll('[data-release-date]').forEach(el=>el.textContent=new Date(release.date+'T00:00:00Z').toLocaleDateString('uk-UA',{timeZone:'UTC'}));
    document.title=(document.querySelector('.realms-shell, [data-homow-page]')?'HoMoW':'Бруківка')+' · v'+release.version;
  }
})(typeof window==='undefined'?globalThis:window);



