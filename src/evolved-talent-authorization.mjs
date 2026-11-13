// DHR-029: GM-owned, source-bound runtime talent authorization sidecar.
// Primary rules: private ALIEN RPG Evolved Edition, Career Talents pp. 48, 50;
// combat actions pp. 60-65; Medical Aid/critical injuries pp. 68-71.
// This module neither commits a roll nor changes historical saves or dice rules.
import {validateCompiledAdventure,adventureBinding} from './adventure-definition.mjs';
import {isPartySave} from './party-engine.mjs';
import {validateCharacter} from './characters.mjs';
import {resolveSkillCheck} from './evolved-checks.mjs';
import {spendActionBudget} from './evolved-encounters.mjs';
import {TRAUMA} from './evolved-injuries.mjs';
import {SCENARIO} from './scenario.mjs';

const clone=x=>JSON.parse(JSON.stringify(x));
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&
 (Object.getPrototypeOf(x)===Object.prototype||Object.getPrototypeOf(x)===null);
const exact=(x,keys)=>plain(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const nonempty=x=>typeof x==='string'&&x.trim().length>0&&x.length<=128;
const natural=x=>Number.isSafeInteger(x)&&x>=0;
const uint=x=>natural(x)&&x<=0xffffffff;
const reject=reason=>({accepted:false,reason});
const SOURCE=['adventureId','revision','fingerprint','seed'];
const REGISTRY=['schemaVersion','source','entries'];
const CHECK=['id','actorId','ownerId','beat','actionIndex','controlEpoch','skill',
 'context','targetId','cost','seed','status'];
const REQUEST=['actorId','talent','checkId','ownerId','expectedBeat',
 'expectedActionCount','expectedControlEpoch'];
const ENTRY=['checkId','actorId','ownerId','talent','beat','actionIndex',
 'controlEpoch','seed','cost','bonus','roll'];
const PRINCIPAL=['kind','id'];

// Original park adaptations of four mechanically source-confirmed career talents.
// Only +2 BASE dice, in a strict circumstance. No inferred other talent effects.
export const AUTHORIZED_TALENT_TRIGGERS=Object.freeze({
 'Hard to Catch':Object.freeze({skill:'mobility',context:'dodge',cost:'quick',bonus:2}),
 'Emergency Treatment':Object.freeze({skill:'medical_aid',context:'first_aid',cost:'full',bonus:2}),
 'Trauma Specialist':Object.freeze({skill:'medical_aid',context:'surgery',cost:'full',bonus:2}),
 'Keep It Together':Object.freeze({skill:'command',context:'rally',cost:'quick',bonus:2})
});
const sourceOf=c=>({adventureId:c.adventureId,revision:c.revision,
 fingerprint:c.fingerprint,seed:c.seed});
const bound=(source,c)=>exact(source,SOURCE)&&same(source,sourceOf(c));
const empty=c=>({schemaVersion:1,source:sourceOf(c),entries:[]});
function live(compiled,state){
 try{return validateCompiledAdventure(compiled)&&isPartySave(state)&&
  // Legacy Nublar save identity is SCENARIO.id; its accepted, fixed
  // adventure binding is compiled at seed 0, independently of game RNG seed.
  ((state.scenario===compiled.adventureId&&state.initialSeed===compiled.seed)||
   (state.scenario===SCENARIO.id&&compiled.adventureId==='nublar-after-the-storm'&&
    compiled.seed===0&&uint(state.initialSeed)))&&
  same(state.adventureBinding,adventureBinding(compiled))&&
  state.outcome==='playing'&&Array.isArray(state.actions)&&
  natural(state.beat)&&uint(state.rng)&&natural(state.control?.epoch)&&
  state.actors.length===state.startingRoster.length;}
 catch{return false;}
}
function sheet(actor,original){
 // No trust in mutable character talent/gear/stats as proof of advancement.
 // Future campaign XP must replace this conservative initial-sheet gate.
 return actor&&original&&actor.id===original.id&&
  validateCharacter(actor).length===0&&validateCharacter(original).length===0&&
  ['career','talent','attributes','skills','gear'].every(k=>same(actor[k],original[k]));
}
function capable(a){
 return a&&!a.dead&&!a.broken&&!a.pendingSkip&&!a.stunned&&!a.restrained&&
  !a.unaware&&!a.panicState&&Number.isSafeInteger(a.health)&&a.health>0;
}
function actorAt(state,id){
 return state.actors.find(a=>a.id===id);
}
function physical(state,c,actor){
 const target=actorAt(state,c.targetId);
 const adjacent=target&&target.location===actor.location&&!target.dead;
 switch(c.context){
  case 'dodge':{
   if(!state.combat?.active||c.targetId!==actor.id)return false;
   const pending=state.combat.pendingReaction||state.pendingPredatorResponse||state.combatReaction;
   return pending?.victimId===actor.id;
  }
  case 'first_aid':
   return Boolean(adjacent&&(target.broken||target.health===0)&&!target.dead);
  case 'surgery':{
   if(!adjacent||!Array.isArray(target.criticalInjuries))return false;
   // Conservative original equipment gate, not a new published numeric modifier.
   const carried=[...(actor.gear||[]),...(actor.inventory||[])];
   const kit=carried.includes('medical bag')||carried.includes('medkit');
   return kit&&target.criticalInjuries.some(w=>
    !w.healed&&!w.surgeryDone&&TRAUMA[w.code]?.surgery);
  }
  case 'rally':
   return Boolean(adjacent&&(target.broken||target.health===0)&&!target.dead&&
     c.targetId!==actor.id);
  default:return false;
 }
}
function authority(state,principal,actorId,ownerId){
 if(!exact(principal,PRINCIPAL)||!nonempty(principal.id)||
   !['human','gm'].includes(principal.kind)||principal.id!==ownerId)return false;
 if(principal.kind==='gm')return true; // Verified GM principal, never client asserted.
 return state.control.mode==='party'||state.control.mode==='focus'&&
   state.control.focusedActorId===actorId;
}
function actionBudget(state,c,actorId){
 const combat=state.combat;
 if(combat?.active){
  const reaction=c.context==='dodge';
  const slot=combat.order?.[combat.index];
  if(!reaction&&(slot?.kind!=='human'||slot.actorId!==actorId))return null;
  if(reaction&&!(combat.pendingReaction||state.pendingPredatorResponse||
    state.combatReaction))return null;
  const b=combat.budgets?.[actorId];
  if(!b)return null;
  const spent=spendActionBudget(b,c.cost);
  return spent.accepted?spent.budget:null;
 }
 if(c.context==='dodge'||state.actors[state.cursor]?.id!==actorId||
   state.pendingPredatorResponse||state.combatReaction)return null;
 return {explorationActionReserved:true};
}
function validCheck(compiled,state,c){
 if(!exact(c,CHECK)||![c.id,c.actorId,c.ownerId,c.targetId].every(nonempty)||
  !natural(c.beat)||!natural(c.actionIndex)||!natural(c.controlEpoch)||
  !uint(c.seed)||c.status!=='open'||!['full','quick'].includes(c.cost)||
  !nonempty(c.skill)||!nonempty(c.context))return false;
 const actor=actorAt(state,c.actorId);
 if(!actor||!sheet(actor,state.startingRoster.find(a=>a.id===c.actorId))||
  !capable(actor)||!AUTHORIZED_TALENT_TRIGGERS[actor.talent])return false;
 const rule=AUTHORIZED_TALENT_TRIGGERS[actor.talent];
 if(c.skill!==rule.skill||c.context!==rule.context||c.cost!==rule.cost||
  c.beat!==state.beat||c.actionIndex!==state.actions.length||
  c.controlEpoch!==state.control.epoch||c.seed!==state.rng)return false;
 return physical(state,c,actor)&&actionBudget(state,c,actor.id)!==null;
}
function checksFor(compiled,state,registry){
 if(!exact(registry,REGISTRY)||registry.schemaVersion!==1||
  !bound(registry.source,compiled)||!Array.isArray(registry.entries)||
  registry.entries.length>128)return null;
 const checks=new Map();
 for(const c of registry.entries){
  if(!exact(c,CHECK)||!nonempty(c.id)||checks.has(c.id))return null;
  checks.set(c.id,c);
 }
 return checks;
}
function prepare(state,c){
 const actor=actorAt(state,c.actorId);
 try{
  // Exact source context from an ENGINE-owned pre-roll check; no user-supplied
  // skill, modifier, helper count, arbitrary talent or success flag.
  const roll=resolveSkillCheck(actor,{skill:c.skill,context:c.context,seed:c.seed});
  const baseline=resolveSkillCheck(actor,{skill:c.skill,context:'',seed:c.seed});
  if(roll.baseCount-baseline.baseCount!==2||
    roll.initial.stress.length!==baseline.initial.stress.length)return null;
  return {checkId:c.id,actorId:c.actorId,ownerId:c.ownerId,talent:actor.talent,
   beat:c.beat,actionIndex:c.actionIndex,controlEpoch:c.controlEpoch,
   seed:c.seed,cost:c.cost,bonus:2,roll};
 }catch{return null;}
}
function audit(compiled,state,registry,journal){
 if(!live(compiled,state))return null;
 const checks=checksFor(compiled,state,registry);
 if(!checks||!exact(journal,REGISTRY)||journal.schemaVersion!==1||
   !bound(journal.source,compiled)||!Array.isArray(journal.entries)||
   journal.entries.length>1)return null;
 const used=new Set();
 for(const entry of journal.entries){
  if(!exact(entry,ENTRY)||!nonempty(entry.checkId)||used.has(entry.checkId))
   return null;
  const check=checks.get(entry.checkId);
  if(!check||!validCheck(compiled,state,check))return null;
  const expected=prepare(state,check);
  if(!expected||!same(entry,expected))return null;
  used.add(entry.checkId);
 }
 return {checks,used};
}
/**
 * Pre-roll only, sidecar (no mutation). The engine must supply a trusted,
 * authenticated principal and an ENGINE-OWNED registry of genuinely pending
 * source-grounded checks. Never expose either input as user-editable JSON.
 * Reservation is local to this same world snapshot, not a committed action.
 */
export function authorizeTalentActivation(compiled,state,registry,principal,request,journal=null){
 const history=journal??empty(compiled);
 const verified=audit(compiled,state,registry,history);
 if(!verified)return reject('Invalid source, state, pending checks or prior talent replay.');
 if(!exact(request,REQUEST)||![request.actorId,request.talent,
  request.checkId,request.ownerId].every(nonempty)||
  !natural(request.expectedBeat)||!natural(request.expectedActionCount)||
  !natural(request.expectedControlEpoch))return reject('Invalid activation request.');
 if(request.expectedBeat!==state.beat||
   request.expectedActionCount!==state.actions.length||
   request.expectedControlEpoch!==state.control.epoch||
   verified.used.size>0)return reject('Already activated or stale event frame.');
 const c=verified.checks.get(request.checkId);
 if(!c||!validCheck(compiled,state,c)||c.actorId!==request.actorId||
  c.ownerId!==request.ownerId||!authority(state,principal,c.actorId,c.ownerId))
   return reject('Invalid actor, controller, turn, target or unverified event.');
 const actor=actorAt(state,c.actorId);
 if(actor.talent!==request.talent||!Object.hasOwn(AUTHORIZED_TALENT_TRIGGERS,request.talent))
  return reject('Talent is not on the verified original character sheet.');
 const entry=prepare(state,c);
 if(!entry)return reject('No source-verified talent effect for this check.');
 return {accepted:true,entry:clone(entry),preview:clone(entry.roll),
  journal:{schemaVersion:1,source:sourceOf(compiled),entries:[clone(entry)]}};
}
/** Re-derive the same activation from the same validated world/check snapshot. */
export function replayTalentActivations(compiled,state,registry,journal=null){
 const a=audit(compiled,state,registry,journal??empty(compiled));
 return a?{valid:true,activations:a.used.size}:
  {valid:false,reason:'Unverifiable or retroactively modified talent activation journal.'};
}
