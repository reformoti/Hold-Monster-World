/* Talent paths show prerequisites in reading order. Mastery advances by playing. */
((root)=>{
'use strict';
const R=root.BrukRealms;
const branches=['Вартовий','Дослідник','Ремісник'];
const scope=['Бій і захист','Рух і збір','Ремесло та спорядження'];
const practice={combat:['power','vitality','guard','precision','leech','weaponFlow'],gather:['agility','prospector','packmaster','quickstep','windrunner'],craft:['smith','alchemist','focusMastery'],travel:['endurance','evasion'],trade:['trader','balanced']};
const sources={combat:'перемоги в бою',gather:'збір ресурсів',craft:'ремесло',travel:'відвідування нових регіонів',trade:'торгівля'};
const sigils=['shield','boots','axe'];
function tiers(branch){
  const rows=[];
  for(const [id,t] of Object.entries(R.TALENTS)){
    if(t.branch!==branch)continue;
    let depth=0,parent=t.parent;
    while(parent){depth++;parent=R.TALENTS[parent].parent;}
    (rows[depth]??=[]).push(id);
  }
  return rows;
}
function mount(root,world,api){
  const el=(tag,cls,text)=>{
    const item=document.createElement(tag);
    if(cls)item.className=cls;
    if(text!==undefined)item.textContent=text;
    return item;
  };
  function button(label,run,cls){
    const b=el('button',cls,label);b.type='button';b.onclick=run;return b;
  }
  function icon(kind){
    const a=el('span','path-icon');a.setAttribute('aria-hidden','true');
    a.innerHTML=window.BrukRealmsArt.icon(kind);return a;
  }
  let tab='talents',branch=0,master=world.state.weaponKind;
  function progress(box,value,goal,max){
    const bar=el('progress');bar.max=goal;bar.value=max?goal:value;
    bar.setAttribute('aria-label','Досвід майстерності');box.append(bar,el('small','',max?'Максимальний ранг':value+' / '+goal+' XP'));
  }
  function option(container,label,active,run,kind){
    const b=button(label,run,'path-choice');b.setAttribute('aria-pressed',String(active));
    if(kind)b.prepend(icon(kind));container.append(b);return b;
  }
  function talentCard(id){
    const s=world.state,t=R.TALENTS[id],offer=R.trainingOffer(s,id),rank=R.talent(s,id),card=el('article','path-card');
    card.dataset.node=id;card.dataset.state=rank>=t.max?'max':offer.available?'ready':'waiting';
    const title=el('h4','',t.name),value=el('b','path-rank',rank+' / '+t.max);
    title.append(value);card.append(title,el('p','',t.description));
    if(t.parent)card.append(el('small','path-parent',(R.talent(s,t.parent)>0?'✓ ':'↳ ')+'Потрібно: '+R.TALENTS[t.parent].name+' · ранг 1'));
    const passive=s.fame[id].rank;
    const action=Object.keys(practice).find(key=>practice[key].includes(id));
    if(action){const info=el('details','path-practice');
      info.append(el('summary','','За очки: '+s.talents[id]+' · за дії: '+passive),
        el('small','','Практика: '+sources[action]+'. '+(passive===t.max?'Максимум.':s.fame[id].xp+' / '+R.fameGoal(passive)+' до рангу за дії.')));
      card.append(info);}

    const buy=button(rank>=t.max?'Вивчено':offer.available?'Вивчити +1 · 1 очко':!s.talents[id]&&t.parent&&!R.talent(s,t.parent)?'Гілка закрита':'Потрібне 1 очко',()=>api.train(id,1),'path-learn');
    buy.dataset.talent=id;buy.disabled=!offer.available;card.append(buy);return card;
  }
  function renderTalents(body,nav){
    branches.forEach((b,i)=>option(nav,b,i===branch,()=>{branch=i;refresh();},sigils[i]));
    body.append(el('h3','',branches[branch]+' · '+scope[branch]));
    for(const [i,ids] of tiers(branches[branch]).entries()){
      const group=el('section','path-tier'),row=el('div','path-row');
      group.append(el('h4','tier-title',['Основи','Розвиток','Спеціалізація'][i]||'Поглиблення'),row);
      for(const id of ids)row.append(talentCard(id));
      body.append(group);
    }
    const reset=button('Повернути витрачені очки · 250 срібла',api.respec,'path-reset');
    reset.id='respecTalents';reset.disabled=!world.nearCamp()||world.state.silver<250||!R.talentSpent(world.state.talents);
    reset.title='Доступно у поселенні. Ранги за дії зберігаються.';body.append(reset);
  }
  function renderMastery(body,nav){
    const s=world.state,names={gathering:'Збір ресурсів',crafting:'Ремесло'};
    for(const key of Object.keys(s.mastery))option(nav,R.FAMILIES[key]?.name||names[key],master===key,()=>{master=key;refresh();});
    const family=R.FAMILIES[master],m=s.mastery[master],group=el('section','path-card');
    group.append(el('h3','',(family?.name||names[master])+' · '+m.level+'/'+R.MAX_MASTERY),
      el('p','',family?'Перемагай із цією родиною зброї. Ранг відкриває вищі тири.':master==='gathering'?'Завершуй збір ресурсів.':'Створюй предмети та переробляй матеріали.'));
    progress(group,m.xp,R.masteryGoal(m.level),m.level===R.MAX_MASTERY);body.append(group);
    if(!family)return;
    const cards=el('div','path-row');body.append(el('h3','','Спеціалізації'),cards);
    for(const v of Object.values(R.VARIANTS).filter(v=>v.family===master)){
      const vm=s.variantMastery[v.id],card=el('article','path-card');card.dataset.variant=v.id;
      card.append(icon(v.id),el('h4','',v.name),el('b','',vm.level+' / '+R.MAX_SPECIALIZATION),
        el('p','',s.variantArsenal[v.id]<0?'Придбай цей варіант у майстра.':'Перемагай саме цією зброєю.'),
        el('small','','За ранг: +0,6% шкоди варіанту, +0,3% родині.'));
      progress(card,vm.xp,R.variantGoal(vm.level),vm.level===R.MAX_SPECIALIZATION);cards.append(card);
    }
  }
  function refresh(){
    const y=root.scrollTop,s=world.state,points=R.talentPoints(s);
    root.replaceChildren();root.className='paths-book';root.dataset.view=tab;
    const header=el('div','paths-header'),tabs=el('div','paths-tabs');
    option(tabs,'Таланти',tab==='talents',()=>{tab='talents';refresh();});
    option(tabs,'Майстерство',tab==='mastery',()=>{tab='mastery';refresh();});
    const xp=s.level===650?'Найвищий рівень':s.level===100&&!s.monolithAwakened?'У резерві '+s.reserveXp+' XP · пробуди моноліт за перевалом':s.xp+' / '+R.xpGoal(s)+' XP';
    header.append(el('strong','','Рівень '+s.level),el('span','',xp),el('b','',points+' оч. талантів'));root.append(header,tabs);
    root.append(el('p','paths-intro',tab==='talents'?'Кожен рівень дає 1 очко. Обери гілку і вклади очко в ранг. Деякі ранги також дають за дії. Обидва способи відкривають наступні таланти.':'Майстерство зростає від дій. Обери зброю або професію, щоб побачити наступний ранг.'));
    const nav=el('div','paths-nav'),body=el('div','paths-body');root.append(nav,body);
    if(tab==='talents')renderTalents(body,nav);else renderMastery(body,nav);
    root.scrollTop=y;
  }
  refresh();return {refresh};
}
root.BrukDestiny={mount};
})(window);
