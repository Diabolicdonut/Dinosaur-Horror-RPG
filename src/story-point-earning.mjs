// DHR-025: Cinematic Story Point earning, a GM-side pure proposal/replay contract.
// Private ALIEN RPG Evolved Edition: Personal Agenda p. 27, Story Points pp. 44, 158.
// Campaign agenda risk/sacrifice earns XP, not a Cinematic Story Point (p. 27).
// No scenario fingerprint, historical save, Evolved roll or runtime is mutated.
import {validateCompiledAdventure,adventureBinding} from './adventure-definition.mjs';
import {isPartySave} from './party-engine.mjs';
import {cinematicAct} from './adventure-cinematic.mjs';

const MAX_POINTS=3;
const isInt=(n,min=0)=>Number.isSafeInteger(n)&&n>=min;
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&
 (Object.getPrototypeOf(x)===Object.prototype||Object.getPrototypeOf(x)===null);
const exact=(x,keys)=>plain(x)&&Object.keys(x).length===keys.length&&
 keys.every(k=>Object.hasOwn(x,k));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const copy=x=>JSON.parse(JSON.stringify(x));
const fail=reason=>({accepted:false,reason});
function sourceOf(compiled){
 return {adventureId:compiled.adventureId,revision:compiled.revision,
  fingerprint:compiled.fingerprint,seed:compiled.seed};
}
function sourceMatches(source,compiled){
 const expected=sourceOf(compiled);
 return exact(source,Object.keys(expected))&&same(source,expected);
}
function validContext(compiled,state){
 try{
  if(!validateCompiledAdventure(compiled)||!isPartySave(state)||
     state.scenario!==compiled.adventureId||
     state.initialSeed!==compiled.seed||!state.adventureBinding||
     !same(state.adventureBinding,adventureBinding(compiled))||
     !compiled.definition.cinematic||!compiled.definition.scenarioMaterial)
    return false;
  return state.actors.every(actor=>isInt(actor.storyPoints??0)&&
    (actor.storyPoints??0)<=MAX_POINTS);
 }catch{return false;}
}
function agendaFor(compiled,state,actorId,agendaId,cardId){
 const seat=state.actors.findIndex(actor=>actor.id===actorId);
 if(seat<0)return null;
 const m=compiled.definition.scenarioMaterial;
 const agenda=m.agendas.find(a=>a.id===agendaId&&a.seat===seat&&
   (!a.variant||compiled.hiddenFacts?.[a.variant.slot]?.id===a.variant.choice));
 const card=m.storyCards.find(c=>c.id===cardId&&c.seat===seat&&
   (!c.variant||compiled.hiddenFacts?.[c.variant.slot]?.id===c.variant.choice));
 return agenda&&card?{agenda,card}:null;
}
function actWindow(compiled,state,number){
 const acts=compiled.definition.cinematic.acts;
 if(!isInt(number,1)||number>acts.length)return null;
 const fulfilled=act=>{
  const beats=act.unlocksAfter.map(id=>state.objectiveRecords?.find(x=>x.id===id)?.beat);
  return beats.every(beat=>isInt(beat))?Math.max(...beats)+1:null;
 };
 const opens=number===1?0:fulfilled(acts[number-1]);
 if(opens===null)return null;
 const ends=number===acts.length?state.beat:fulfilled(acts[number]);
 if(ends===null)return null;
 // Ending objective is on the beat just BEFORE the next act becomes active.
 return {start:opens,end:number===acts.length?ends:ends-1};
}
function closed(compiled,state,act){
 const current=cinematicAct(compiled,state);
 if(!current)return false;
 const final=act===compiled.definition.cinematic.acts.length;
 return final?state.outcome!=='playing':current.number>act;
}
function achievement(compiled,state,agenda,card){
 const trigger=card.trigger;
 if(trigger.kind==='scene'){
  const authored=compiled.definition.cinematic.events.find(x=>x.id===trigger.id);
  const record=state.cinematicRecords?.find(r=>r.id===trigger.id);
  if(!authored||authored.act!==agenda.act||!record||
     record.actorId!==state.actors[agenda.seat]?.id||
     record.act!==agenda.act||record.room!==authored.room)return null;
  return {kind:'scene',id:record.id,beat:record.beat,room:record.room};
 }
 if(trigger.kind==='objective'){
  const authored=compiled.definition.objectives.find(x=>x.id===trigger.id);
  const record=state.objectiveRecords?.find(r=>r.id===trigger.id);
  if(!authored||!record||record.actorId!==state.actors[agenda.seat]?.id||
     record.room!==authored.room)return null;
  return {kind:'objective',id:record.id,beat:record.beat,room:record.room};
 }
 return null;
}
function riskEvidence(compiled,state,actorId,risk,window,achieved){
 if(!exact(risk,['kind','id'])||!['peril','predator_contact'].includes(risk.kind)||
    typeof risk.id!=='string')return null;
 let records=[];
 if(risk.kind==='peril'){
  const definition=compiled.definition.perils?.find(x=>x.id===risk.id);
  if(!definition||definition.room!==achieved.room||
     (definition.variant&&compiled.hiddenFacts?.[definition.variant.slot]?.id!==definition.variant.choice))
   return null;
  records=(state.perilRecords||[]).filter(r=>r.id===risk.id&&r.actorId===actorId);
 }else{
  const definition=compiled.definition.initialCreatures.find(x=>x.id===risk.id);
  if(!definition||definition.disposition!=='predatory'||
     (definition.when&&compiled.hiddenFacts?.[definition.when.slot]?.id!==definition.when.choice))
   return null;
  records=(state.predatorContacts||[]).filter(r=>
   r.creatureId===risk.id&&r.actorId===actorId&&r.attack===true);
 }
 const chosen=records.filter(r=>isInt(r.beat)&&r.beat>=window.start&&
   r.beat<achieved.beat&&r.room===achieved.room)
  .sort((a,b)=>a.beat-b.beat)[0];
 return chosen?{kind:risk.kind,id:risk.id,beat:chosen.beat,room:chosen.room}:null;
}
function earnable(compiled,state,request){
 if(!exact(request,['actorId','agendaId','cardId','risk'])||
    !['actorId','agendaId','cardId'].every(k=>typeof request[k]==='string'))
  return null;
 const bound=agendaFor(compiled,state,request.actorId,request.agendaId,request.cardId);
 if(!bound||!closed(compiled,state,bound.agenda.act))return null;
 const window=actWindow(compiled,state,bound.agenda.act);
 const evidence=achievement(compiled,state,bound.agenda,bound.card);
 if(!window||window.end<window.start||!evidence||
    evidence.beat<window.start||evidence.beat>window.end)return null;
 const risk=riskEvidence(compiled,state,request.actorId,request.risk,window,evidence);
 if(!risk)return null;
 return {actorId:request.actorId,agendaId:bound.agenda.id,
  cardId:bound.card.id,act:bound.agenda.act,evidence,risk};
}
function initialBalances(state){
 return Object.fromEntries(state.actors.map(actor=>[actor.id,actor.storyPoints??0]));
}
function evaluate(compiled,state,journal){
 if(!exact(journal,['schemaVersion','source','entries'])||
    journal.schemaVersion!==1||!sourceMatches(journal.source,compiled)||
    !Array.isArray(journal.entries)||
    journal.entries.length>state.actors.length*compiled.definition.cinematic.acts.length)
  return null;
 const balances=initialBalances(state),seen=new Set();
 let lastAct=0;
 for(const entry of journal.entries){
  if(!exact(entry,['actorId','agendaId','cardId','act','evidence','risk',
     'credited','balanceAfter'])||!isInt(entry.act,1)||entry.act<lastAct||
     !isInt(entry.credited)||entry.credited>1||!isInt(entry.balanceAfter)||
     entry.balanceAfter>MAX_POINTS||
     !exact(entry.evidence,['kind','id','beat','room'])||
     !exact(entry.risk,['kind','id','beat','room']))
   return null;
  const key=entry.actorId+':'+entry.act;
  if(seen.has(key))return null;seen.add(key);lastAct=entry.act;
  const expected=earnable(compiled,state,{
   actorId:entry.actorId,agendaId:entry.agendaId,cardId:entry.cardId,
   risk:{kind:entry.risk.kind,id:entry.risk.id}
  });
  if(!expected||!same(entry.evidence,expected.evidence)||
     !same(entry.risk,expected.risk)||entry.act!==expected.act)return null;
  const balance=balances[entry.actorId];
  if(!isInt(balance)||balance>MAX_POINTS)return null;
  const credited=balance<MAX_POINTS?1:0;
  if(entry.credited!==credited||entry.balanceAfter!==balance+credited)return null;
  balances[entry.actorId]=balance+credited;
 }
 return {balances,seen,lastAct};
}

/**
 * A proposal must be made ONLY by trusted GM/engine code against a validated,
 * complete Party save. It is not a player command or a signed attestation.
 * Requiring a source-owned seat-specific Story Card prevents an arbitrary
 * scene or routine objective from being declared agenda progress. The same
 * actor must have completed its physical trigger AND undertaken an actual,
 * local peril or predator attack on an earlier recorded beat in that act. Generic GM judgments
 * about narrative sacrifice require separately verified evidence in the future.
 *
 * Old saves have no award journal: pass undefined/null; the result is an
 * external proposal only. Never attach it to historic saves automatically.
 */
export function resolveStoryPointAward(compiled,state,request,journal=null){
 if(!validContext(compiled,state))return fail('Validated Cinematic source and saved world required.');
 const existing=journal??{schemaVersion:1,source:sourceOf(compiled),entries:[]};
 const audit=evaluate(compiled,state,existing);
 if(!audit)return fail('Story Point journal fails deterministic replay.');
 const earned=earnable(compiled,state,request);
 if(!earned)return fail('No source-owned, risk-backed completed agenda at an act boundary.');
 if(earned.act<audit.lastAct||audit.seen.has(earned.actorId+':'+earned.act))
  return fail('Already awarded or earlier than the committed journal.');
 const held=audit.balances[earned.actorId],credited=held<MAX_POINTS?1:0;
 const entry={...earned,credited,balanceAfter:held+credited};
 const next={schemaVersion:1,source:sourceOf(compiled),
  entries:[...existing.entries.map(copy),entry]};
 return {accepted:true,credited,balanceAfter:entry.balanceAfter,
  entry:copy(entry),journal:next};
}

/** Validate every entry by reconstructing source triggers, risk and cap. */
export function replayStoryPointAwards(compiled,state,journal=null){
 if(!validContext(compiled,state))return {valid:false,reason:'Invalid Cinematic state.'};
 const existing=journal??{schemaVersion:1,source:sourceOf(compiled),entries:[]};
 const evaluated=evaluate(compiled,state,existing);
 return evaluated?{valid:true,balances:copy(evaluated.balances),
  earnedCount:existing.entries.length}:{valid:false,reason:'Invalid Story Point journal.'};
}
