/* Camera geometry for the isolated beta. CSS pixels in, world coordinates out. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.HoMoWBetaView=factory();})(typeof window==='undefined'?globalThis:window,function(){
  'use strict';
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  function camera(width,height,worldWidth,worldHeight,focus){
    const scale=Math.max(width/worldWidth,height/worldHeight),visibleWidth=width/scale,visibleHeight=height/scale;
    return {scale,x:clamp(focus.x-visibleWidth/2,0,Math.max(0,worldWidth-visibleWidth)),y:clamp(focus.y-visibleHeight/2,0,Math.max(0,worldHeight-visibleHeight)),width:visibleWidth,height:visibleHeight};
  }
  function toWorld(x,y,view){return {x:x/view.scale+view.x,y:y/view.scale+view.y};}
  function toScreen(x,y,view){return {x:(x-view.x)*view.scale,y:(y-view.y)*view.scale};}
  function onMinimap(x,y,worldWidth,worldHeight){return {x:100+90*(x/worldWidth-y/worldHeight),y:10+90*(x/worldWidth+y/worldHeight)};}
  return {camera,toWorld,toScreen,onMinimap};
});
