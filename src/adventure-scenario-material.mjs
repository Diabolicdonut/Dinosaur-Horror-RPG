// 009-C1: data-only adventure handouts, private agendas and trigger cards.
// This service does not own dice, Story Point awards, GM decisions or world effects.
const key=x=>typeof x==='string'&&/^[a-z][A-Za-z0-9_-]{1,63}$/.test(x);
const prose=x=>typeof x==='string'&&x.trim().length>0&&x.length<=700;
const clone=x=>JSON.parse(JSON.stringify(x));
const sameKeys=(obj,allowed)=>obj&&typeof obj==='object'&&!Array.isArray(obj)&&
 Object.keys(obj).every(k=>allowed.includes(k));
function invalid(reason){throw new RangeError('Invalid adventure scenario material: '+reason);}
function condition(def,variant){
 return sameKeys(variant,['slot','choice'])&&
  def.variants?.[variant.slot]?.some(o=>o.id===variant.choice);
}
function trigger(def,value,allowStart){
 if(!sameKeys(value,['kind','id']))return false;
 if(value.kind==='start')return allowStart&&value.id===undefined;
 if(!key(value.id))return false;
 if(value.kind==='scene')return def.cinematic?.events.some(e=>e.id===value.id)??false;
 if(value.kind==='objective')return def.objectives.some(o=>o.id===value.id);
 return false;
}
export function validateScenarioMaterialDefinition(def){
 const m=def.scenarioMaterial;
 if(m===undefined)return true;
 if(!sameKeys(m,['briefing','gmOnly','agendas','storyCards','handouts']))
  invalid('unknown dossier property');
 if(!sameKeys(m.briefing,['title','text'])||
  !prose(m.briefing.title)||!prose(m.briefing.text))
  invalid('public opening briefing');
 if(!sameKeys(m.gmOnly,['situation','secrets','possibilities'])||
  !prose(m.gmOnly.situation)||!Array.isArray(m.gmOnly.secrets)||
  !Array.isArray(m.gmOnly.possibilities)||
  m.gmOnly.secrets.length>12||m.gmOnly.possibilities.length>12||
  [...m.gmOnly.secrets,...m.gmOnly.possibilities].some(x=>!prose(x)))
  invalid('GM-only situation and alternate truths');
 const groups=[['agendas',32],['storyCards',32],['handouts',32]];
 for(const [group,limit] of groups)
  if(!Array.isArray(m[group])||m[group].length>limit)invalid(group+' collection');
 const ids=new Set();
 for(const a of m.agendas){
  if(!sameKeys(a,['id','seat','act','text','variant'])||
    !key(a.id)||!Number.isInteger(a.seat)||a.seat<0||a.seat>7||
    (!Number.isInteger(a.act)||a.act<1||a.act>5)||!prose(a.text)||
    !def.cinematic?.acts?.some(act=>act.number===a.act)||
    (a.variant!==undefined&&!condition(def,a.variant)))
   invalid('agenda');
  const token=a.seat+':'+a.act+':'+(a.variant?.slot??'default')+':'+
   (a.variant?.choice??'default');
  if(ids.has('agenda:'+token))invalid('ambiguous agenda at one seat and act');
  ids.add('agenda:'+token);
 }
 for(const group of ['storyCards','handouts'])
  for(const item of m[group]){
   const expected=group==='storyCards'?
    ['id','seat','text','trigger','variant']:['id','title','text','trigger','variant'];
   if(!sameKeys(item,expected)||!key(item.id)||!prose(item.text)||
      (group==='storyCards'?
       (!Number.isInteger(item.seat)||item.seat<0||item.seat>7):
       !prose(item.title))||
      !trigger(def,item.trigger,group==='handouts')||
      (item.variant!==undefined&&!condition(def,item.variant)))
    invalid(group+' entry or fabricated trigger');
   if(ids.has('item:'+item.id))invalid('duplicate dossier item id');
   ids.add('item:'+item.id);
  }
 return true;
}
function liveVariant(compiled,item){
 return !item.variant||
  compiled.hiddenFacts?.[item.variant.slot]?.id===item.variant.choice;
}
function happened(state,trigger){
 if(trigger.kind==='start')return true;
 if(trigger.kind==='scene')return (state.cinematicRecords||[]).some(r=>r.id===trigger.id);
 return (state.objectiveRecords||[]).some(r=>r.id===trigger.id);
}
// Only public or the *controlled* actor's material is projected.
// Camera selection does not authorize another character's personal agenda.
export function playerScenarioMaterial(compiled,state,actorId,currentAct){
 const m=compiled.definition.scenarioMaterial;
 if(!m)return null;
 const seat=state.actors?.findIndex(a=>a.id===actorId)??-1;
 const owned=seat>=0&&(state.control?.mode==='party'||
   state.control?.mode==='focus'&&state.control.focusedActorId===actorId);
 const visible=m.handouts.filter(h=>liveVariant(compiled,h)&&happened(state,h.trigger))
  .map(h=>({id:h.id,title:h.title,text:h.text}));
 const act=Number.isInteger(currentAct?.number)?currentAct.number:1;
 const agendas=owned?m.agendas.filter(a=>a.seat===seat&&a.act===act&&
  liveVariant(compiled,a)).map(a=>({id:a.id,text:a.text,act:a.act})):[];
 const storyCards=owned?m.storyCards.filter(c=>c.seat===seat&&
  liveVariant(compiled,c)&&happened(state,c.trigger))
  .map(c=>({id:c.id,text:c.text})):[];
 return {briefing:clone(m.briefing),handouts:visible,
  privateAgendas:agendas,privateStoryCards:storyCards};
}
