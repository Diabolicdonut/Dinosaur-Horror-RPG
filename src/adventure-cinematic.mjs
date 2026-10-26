// 009-B2b2b — adventure-independent Cinematic opportunities.
// Acts organize optional scenes; they do not advance time, roll Evolved dice,
// move creatures, award resources, force combat or modify objective truth.
import {validateCompiledAdventure} from './adventure-definition.mjs';
import {objectiveStatus} from './adventure-objectives.mjs';
const copy=x=>JSON.parse(JSON.stringify(x));
function plan(compiled){
 if(!validateCompiledAdventure(compiled))throw new RangeError('Validated AdventureInstance required.');
 return compiled.definition.cinematic||null;
}
function actForCompleted(ci,completed){
 if(!ci)return null;
 return [...ci.acts].reverse().find(a=>a.unlocksAfter.every(id=>completed.has(id)))||ci.acts[0];
}
export function cinematicAct(compiled,state){
 const ci=plan(compiled);if(!ci)return null;
 const completed=new Set(objectiveStatus(compiled,state).completedIds);
 const act=actForCompleted(ci,completed);
 return {number:act.number,title:act.title,objective:act.objective};
}
function applicable(compiled,state,actor,scene){
 const ci=plan(compiled);if(!ci||!actor||actor.dead||actor.broken||
  state.outcome!=='playing'||actor.location!==scene.room)return false;
 if(scene.act!==cinematicAct(compiled,state).number)return false;
 if((state.cinematicRecords||[]).some(r=>r.id===scene.id))return false;
 if(scene.creatureId&&!state.dinosaurs?.some(d=>d.id===scene.creatureId&&
   d.location===actor.location&&!d.defeated))return false;
 if(scene.requiresCompanion&&!state.actors.some(other=>
   other.id!==actor.id&&!other.dead&&!other.broken&&other.location===actor.location))return false;
 if(scene.variant&&compiled.hiddenFacts?.[scene.variant.slot]?.id!==scene.variant.choice)
  return false;
 return true;
}
export function availableCinematicEvents(compiled,state,actorId){
 const ci=plan(compiled);if(!ci)return [];
 const actor=state.actors?.find(a=>a.id===actorId);
 if(!actor)return [];
 return ci.events.filter(e=>applicable(compiled,state,actor,e)).map(e=>({
  id:e.id,title:e.title,theme:e.theme,act:e.act
 }));
}
export function validCinematicRecords(compiled,state){
 const ci=plan(compiled);
 const records=state?.cinematicRecords;
 if(records===undefined)return true; // Earlier Party saves do not have scenes.
 if(!Array.isArray(records)||records.length>32)return false;
 if(!ci)return records.length===0;
 const seen=new Set();
 let last=-1;
 return records.every(record=>{
  const event=ci.events.find(e=>e.id===record?.id);
  if(!event||seen.has(event.id)||event.room!==record.room||
   record.act!==event.act||!Number.isSafeInteger(record.beat)||
   record.beat<last||record.beat>state.beat||
   typeof record.actorId!=='string'||
   !state.actors?.some(a=>a.id===record.actorId)||
   (event.variant&&compiled.hiddenFacts?.[event.variant.slot]?.id!==event.variant.choice)||
   (event.creatureId&&!state.dinosaurs.some(d=>d.id===event.creatureId))||
   !ci.acts[event.act-1].unlocksAfter.every(id=>
     state.objectiveRecords?.some(o=>o.id===id&&o.beat<=record.beat))||
   (event.requiresCompanion&&(!record.companionId||
     record.companionId===record.actorId||
     !state.actors.some(a=>a.id===record.companionId))))return false;
  seen.add(event.id);last=record.beat;return true;
 });
}
export function commitCinematicEvent(compiled,previous,{actorId,eventId}={}){
 const ci=plan(compiled);
 const reject=reason=>({accepted:false,state:previous,reason});
 if(!ci)return reject('This adventure revision has no authored Cinematic scenes.');
 if(!validCinematicRecords(compiled,previous))return reject('Invalid scene history.');
 const actor=previous.actors?.find(a=>a.id===actorId);
 const event=ci.events.find(e=>e.id===eventId);
 if(!event||!applicable(compiled,previous,actor,event))
  return reject('This optional scene is not physically available now.');
 const next=copy(previous);
 const companion=event.requiresCompanion?next.actors.find(a=>a.id!==actorId&&
   a.location===actor.location&&!a.dead&&!a.broken):null;
 next.cinematicRecords??=[];
 next.cinematicRecords.push({id:event.id,actorId,room:actor.location,act:event.act,
  beat:previous.beat,...(companion?{companionId:companion.id}:{})});
 next.events.push({beat:previous.beat,actorId,category:event.theme==='wonder'?'wonder':'scene',
  message:event.title+': '+event.text});
 next.events=next.events.slice(-160);
 next.actions.push({beat:previous.beat,actorId,kind:'scene',target:event.id});
 next.actions=next.actions.slice(-200);
 // A reflective scene is voluntary, free, repeat-protected, and causally inert.
 return {accepted:true,state:next,result:{kind:'scene',id:event.id,act:event.act,
  title:event.title,theme:event.theme}};
}
