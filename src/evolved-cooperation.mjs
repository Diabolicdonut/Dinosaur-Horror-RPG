// DHR-028: source-bound Evolved cooperation for authored, active skill interactions.
// Private ALIEN RPG Evolved Edition, Using Skills pp. 42-44 and combat action p. 60.
// This deliberately unwired resolver never alters Evolved dice, a Party save, or RNG.
import {validateCompiledAdventure,adventureBinding} from './adventure-definition.mjs';
import {objectiveCircumstance} from './adventure-situations.mjs';
import {objectiveStatus} from './adventure-objectives.mjs';
import {isPartySave} from './party-engine.mjs';
import {validateCharacter,SKILLS} from './characters.mjs';
import {resolveSkillCheck} from './evolved-checks.mjs';
import {woundModifiers} from './evolved-injuries.mjs';
import {spendActionBudget} from './evolved-encounters.mjs';

const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&
 (Object.getPrototypeOf(x)===Object.prototype||Object.getPrototypeOf(x)===null);
const exact=(x,keys)=>plain(x)&&Object.keys(x).length===keys.length&&keys.every(k=>own(x,k));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const copy=x=>JSON.parse(JSON.stringify(x));
const uint=x=>Number.isSafeInteger(x)&&x>=0&&x<=0xffffffff;
const fail=reason=>({accepted:false,reason});
const SOURCE_FIELDS=['adventureId','revision','fingerprint','seed'];
const REQUEST_FIELDS=['actorId','objectiveId','helpers','expectedBeat','expectedRng',
 'expectedActionCount','push'];
const HELPER_FIELDS=['actorId','method','toolId'];
// These are conservative, original proof categories, NOT new Evolved numerical rules.
// A rank-zero skill remains usable; the helper must actually be able to perform the method.
const METHODS=Object.freeze({
 cross_check:Object.freeze(['observation','survival','comtech','medical_aid']),
 hands_on:Object.freeze(['heavy_machinery','comtech','medical_aid']),
 radio_relay:Object.freeze(['comtech'])
});
const sourceOf=compiled=>({
 adventureId:compiled.adventureId,revision:compiled.revision,
 fingerprint:compiled.fingerprint,seed:compiled.seed
});
function sourceValid(compiled,state){
 try{
  return validateCompiledAdventure(compiled)&&isPartySave(state)&&
   state.scenario===compiled.adventureId&&state.initialSeed===compiled.seed&&
   same(state.adventureBinding,adventureBinding(compiled))&&
   state.outcome==='playing'&&Array.isArray(state.actions)&&
   state.actors.length===state.startingRoster.length;
 }catch{return false;}
}
function currentSheet(actor,original){
 // A locally edited but still character-valid sheet is not proof of earned
 // advancement. Compare game-owned starting stats until advancement is integrated.
 return actor&&original&&actor.id===original.id&&
  !validateCharacter(actor)&&!validateCharacter(original)&&
  ['career','attributes','skills','talent','gear'].every(k=>same(actor[k],original[k]));
}
function able(a){
 return a&&Number.isSafeInteger(a.health)&&a.health>0&&
  !a.dead&&!a.broken&&!a.pendingSkip&&!a.stunned&&!a.restrained&&
  !a.unaware&&!a.panicState;
}
function budgetValid(b){
 return exact(b,['full','quick','quickSpent','fullSpent'])&&
  [b.full,b.quick,b.quickSpent,b.fullSpent].every(Number.isSafeInteger)&&
  b.quickSpent>=0&&b.quickSpent<=2&&b.fullSpent>=0&&b.fullSpent<=1&&
  !(b.fullSpent&&b.quickSpent>1)&&b.quick===2-b.quickSpent&&
  b.full===(b.fullSpent||b.quickSpent===2?0:1);
}
function advanceSeed(seed){
 let x=seed>>>0;
 x^=(x<<13)>>>0;x^=x>>>17;x^=(x<<5)>>>0;
 return x>>>0;
}
function authorize(compiled,state,request){
 if(!sourceValid(compiled,state))return fail('Validated, source-bound live Party incident required.');
 if(!exact(request,REQUEST_FIELDS)||typeof request.actorId!=='string'||
    typeof request.objectiveId!=='string'||!uint(request.expectedRng)||
    !Number.isSafeInteger(request.expectedBeat)||request.expectedBeat<0||
    !Number.isSafeInteger(request.expectedActionCount)||request.expectedActionCount<0||
    !Number.isInteger(request.push)||request.push<0||request.push>2||
    !Array.isArray(request.helpers)||request.helpers.length<1||
    request.helpers.length>3)return fail('Unsupported or unverified cooperation request.');
 if(state.beat!==request.expectedBeat||state.rng!==request.expectedRng||
    state.actions.length!==request.expectedActionCount)
  return fail('Stale or retroactive cooperation request.');
 const objective=compiled.definition.objectives.find(x=>x.id===request.objectiveId);
 if(!objective||!objective.interaction||!SKILLS[objective.interaction.skill])
  return fail('No authored, roll-requiring skill interaction.');
 const completed=objectiveStatus(compiled,state).completedIds;
 if(completed.includes(objective.id)||objective.requires.some(id=>!completed.includes(id)))
  return fail('Objective already resolved or prerequisites unavailable.');
 const actor=state.actors.find(a=>a.id===request.actorId);
 const original=state.startingRoster.find(a=>a.id===request.actorId);
 if(!currentSheet(actor,original)||!able(actor)||actor.location!==objective.room)
  return fail('Lead actor is not capable or physically at the source interaction.');
 if(state.combat?.pendingReaction||state.pendingPredatorResponse||
    state.combatReaction)return fail('Cooperation cannot interrupt a pending reaction.');
 const combat=state.combat?.active===true;
 if(combat){
  const slot=state.combat.order?.[state.combat.index];
  if(slot?.kind!=='human'||slot.actorId!==actor.id)
   return fail('The lead does not own the active combat turn.');
 }else if(state.actors[state.cursor]?.id!==actor.id)
  return fail('The lead does not own this exploration action.');
 const skill=objective.interaction.skill,used=new Set([actor.id]),helpers=[];
 for(const requested of request.helpers){
  if(!exact(requested,HELPER_FIELDS)||typeof requested.actorId!=='string'||
     !own(METHODS,requested.method)||!METHODS[requested.method].includes(skill)||
     used.has(requested.actorId))return fail('Duplicate, unknown or unsupported helper method.');
  used.add(requested.actorId);
  const helper=state.actors.find(a=>a.id===requested.actorId);
  const starting=state.startingRoster.find(a=>a.id===requested.actorId);
  if(!currentSheet(helper,starting)||!able(helper)||helper.location!==actor.location)
   return fail('Helper cannot physically support this actor.');
  const injury=woundModifiers(helper,skill,{
   twoHands:requested.method==='hands_on',twoArms:requested.method==='hands_on'
  });
  if(injury.immobile&&requested.method==='hands_on')
   return fail('Injured helper cannot perform hands-on support.');
  if(requested.method==='radio_relay'){
   if(requested.toolId!=='field-radio'||!own(compiled.definition.itemNames,'field-radio')||
      !helper.inventory?.includes(requested.toolId))
    return fail('Helper lacks the actual source-owned radio.');
  }else if(requested.toolId!==null)
   return fail('Unverified equipment cannot add cooperation dice.');
  helpers.push({actorId:helper.id,method:requested.method,toolId:requested.toolId,
   skillRank:helper.skills[skill]});
 }
 let budgets=null;
 if(combat){
  if(!plain(state.combat.budgets)||!Array.isArray(state.combat.order))
   return fail('No authoritative Evolved combat action ledger.');
  budgets={};
  for(const id of [actor.id,...helpers.map(h=>h.actorId)]){
   const slot=state.combat.order.findIndex(x=>x.kind==='human'&&x.actorId===id);
   if(slot<state.combat.index||!budgetValid(state.combat.budgets[id]))
    return fail('Helper or lead has no eligible combat turn budget.');
   const spent=spendActionBudget(state.combat.budgets[id],'full');
   if(!spent.accepted)return fail('Full action already spent in this round.');
   budgets[id]=spent.budget;
  }
 }
 const circumstance=objectiveCircumstance(compiled,objective.id);
 const difficulty=circumstance?.modifier??0;
 const injury=woundModifiers(actor,skill).modifier;
 if(!Number.isInteger(difficulty)||difficulty < -15||difficulty>15||
    !Number.isInteger(injury)||injury < -15||injury>15||
    difficulty+injury < -15||difficulty+injury>15)
  return fail('Unverified contextual modifier.');
 const seed=advanceSeed(state.rng);
 return {accepted:true,authorization:{
  actorId:actor.id,objectiveId:objective.id,room:objective.room,
  target:objective.interaction.target,skill,context:'',
  difficulty,injury,modifier:difficulty+injury,help:helpers.length,
  helpers,combat,combatRound:combat?state.combat.round:null,
  budgets,seed,nextRng:seed
 }};
}
function checkpoint(state){
 return {beat:state.beat,rng:state.rng,actionCount:state.actions.length,
  round:state.round,combatRound:state.combat?.active?state.combat.round:null};
}
function expectedJournal(compiled,state,request){
 const a=authorize(compiled,state,request);
 if(!a.accepted)return a;
 const actor=state.actors.find(x=>x.id===request.actorId);
 const auth=a.authorization;
 const check=resolveSkillCheck(actor,{
  skill:auth.skill,context:auth.context,modifier:auth.modifier,
  help:auth.help,seed:auth.seed,push:request.push
 });
 return {accepted:true,check,authorization:auth,
  journal:{schemaVersion:1,source:sourceOf(compiled),checkpoint:checkpoint(state),
   entry:{request:copy(request),authorization:copy(auth),check:copy(check)}}};
}
/**
 * Preview one pre-roll cooperative check; no world/save mutation or RNG advance.
 * The external one-shot receipt must be committed atomically by the future
 * runtime alongside the consumed turn, action budgets, RNG and resolved roll.
 * A prior receipt blocks a second spend at the same pre-action checkpoint.
 */
export function resolveCooperativeCheck(compiled,state,request,journal=null){
 try{
  if(journal!==null&&journal!==undefined){
   if(!replayCooperativeCheck(compiled,state,journal).valid)
    return fail('Previous cooperation receipt fails deterministic replay.');
   return fail('This pre-action checkpoint has already consumed cooperation.');
  }
  return expectedJournal(compiled,state,request);
 }catch{return fail('Cooperation authorization rejected malformed source or input.');}
}
/** Rebuild all authority, helper bonus and individual dice against the SAME
 * pre-action snapshot; reject any changed source, help, RNG, timing or roll. */
export function replayCooperativeCheck(compiled,state,journal){
 try{
  if(!exact(journal,['schemaVersion','source','checkpoint','entry'])||
     journal.schemaVersion!==1||!exact(journal.source,SOURCE_FIELDS)||
     !same(journal.source,sourceOf(compiled))||
     !exact(journal.checkpoint,['beat','rng','actionCount','round','combatRound'])||
     !same(journal.checkpoint,checkpoint(state))||
     !exact(journal.entry,['request','authorization','check']))
   return {valid:false,reason:'Malformed or mismatched cooperation receipt.'};
  const expected=expectedJournal(compiled,state,journal.entry.request);
  return expected.accepted&&same(expected.journal,journal)?
   {valid:true,authorization:copy(expected.authorization),check:copy(expected.check)}:
   {valid:false,reason:'Cooperation source, timing or dice replay mismatch.'};
 }catch{return {valid:false,reason:'Invalid cooperation replay input.'};}
}
