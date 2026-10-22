// Dinosaur Horror RPG — seeded Evolved Edition check core (mechanics implemented as original code).
// Reference: private Evolved Edition Core Rulebook, Skills pp. 42–44, Talents pp. 48–51,
// Stress Response p. 44 and Panic pp. 72–73. No source prose/tables reproduced.
import { ATTRIBUTES, SKILLS, CAREERS, derived, validateCharacter } from './characters.mjs';

export const CHECK_ENGINE_VERSION = '007-B';
export const SKILL_ATTRIBUTE = Object.freeze({
  heavy_machinery:'strength', stamina:'strength', close_combat:'strength',
  mobility:'agility', ranged_combat:'agility', piloting:'agility',
  observation:'wits', comtech:'wits', survival:'wits',
  command:'empathy', manipulation:'empathy', medical_aid:'empathy'
});
export const STRESS_EFFECTS = Object.freeze({
  1:'jumpy', 2:'tunnel_vision', 3:'aggravated', 4:'shakes', 5:'frantic', 6:'deflated', 7:'mess_up'
});
const RESPONSE_MOD = Object.freeze({
  wits:'tunnel_vision', empathy:'aggravated', agility:'shakes', strength:'frantic'
});
const BONUS_TALENTS = Object.freeze({
  'Experienced Tracker': {skill:'observation',context:'active_search',bonus:2,notPassive:true},
  'Safe Restraint': {skill:'close_combat',context:'grapple',bonus:2},
  'Hard to Catch': {skill:'mobility',context:'dodge',bonus:2},
  'Emergency Treatment': {skill:'medical_aid',context:'first_aid',bonus:2},
  'Trauma Specialist': {skill:'medical_aid',context:'surgery',bonus:2},
  'Keep It Together': {skill:'command',context:'rally',bonus:2},
  'Emergency Maneuver': {skill:'piloting',context:'acceleration',bonus:2}
});
const SPECIAL_TALENTS = Object.freeze({
 'Combat Focus':'panic_overkill',
 'Steady Under Fire':'group_stress_recovery',
 'Careful Aim':'conserve_ammo',
 'Park Authority':'command_for_manipulation',
 'Corporate Access':'limited_corporate_item',
 'Negotiator':'wits_manipulation',
 'Personal Contingency':'redirect_attack',
 'Unlikely Fortune':'second_chance',
 'Quick Reflexes':'second_agility_push',
 'Recovery Care':'nursing_recovery',
 'Rapid Orders':'quick_order',
 'Chain of Command':'rank_order',
 'Familiar Controls':'specialty_vehicle',
 'Risk Taker':'voluntary_stress',
 'Resilient Worker':'strength_damage_reduction',
 'Steady Hands':'omit_stress_dice',
 'Last Push':'second_strength_push',
 'Field Analysis':'specimen_research',
 'Persistent Inquiry':'second_wits_push',
 'Species Insight':'creature_weakness'
});
export const ALL_TALENT_NAMES = Object.freeze(Object.values(CAREERS).flatMap(role=>role.talents));
export const TALENT_MECHANICS = Object.freeze(Object.fromEntries(
 ALL_TALENT_NAMES.map(name=>[name, BONUS_TALENTS[name] || SPECIAL_TALENTS[name]])
));
function seedValue(seed){
 if (!Number.isSafeInteger(Number(seed)) || Number(seed)<0 || Number(seed)>4294967295)
   throw new RangeError('Dice seed must be an unsigned 32-bit integer.');
 return Number(seed)>>>0 || 0x9e3779b9;
}
export function createDiceStream(seed=1993) {
 let x=seedValue(seed), draws=0;
 return {
  rollD6() {x^=x<<13;x^=x>>>17;x^=x<<5;draws++;return (x>>>0)%6+1;},
  snapshot() {return {seed:x>>>0,draws};}
 };
}
const copy=v=>JSON.parse(JSON.stringify(v));
const isInt=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
function requiredCharacter(c) {
 const errors=validateCharacter(c);
 if(errors.length)throw new RangeError(errors.join(' '));
}
function stateFor(c,stress) {
 return {stress, stressResponses:[...(c.stressResponses||[])], panicResponses:[...(c.panicResponses||[])]};
}
function resolveStressEvent(state,rollD6){
 const d6=rollD6(),value=d6+state.stress-state.resolve;
 const severity=value<=0?0:Math.min(7,value);
 const kind=STRESS_EFFECTS[severity]||null;
 let repeated=false;
 if(kind==='deflated')state.stressResponses=state.stressResponses.filter(e=>e!=='jumpy');
 if(kind && kind!=='mess_up' && state.stressResponses.includes(kind)){
   repeated=true;state.stress+=1;
 }else if(kind==='mess_up'){
   state.stress+=1;
 }else if(kind)state.stressResponses.push(kind);
 return {d6,value,kind,repeated};
}
function talentBonus(character, skill,context,passive,vehicleModel){
 const talent=character.talent;
 const special=BONUS_TALENTS[talent];
 if(special && skill===special.skill && context===special.context && !(special.notPassive&&passive))
   return special.bonus;
 if(talent==='Familiar Controls' && skill==='piloting' && typeof vehicleModel==='string' &&
   vehicleModel.length>0 && character.talentFocus?.vehicleModel===vehicleModel)
   return 2;
 if(talent==='Park Authority' && context==='authority' && skill==='command')return 2;
 return 0;
}
function pickSkill(character,requested,context){
 return character.talent==='Park Authority'&&context==='authority'&&requested==='manipulation'
   ?'command':requested;
}
const countSix=faces=>faces.filter(v=>v===6).length;
function rollPool(rollD6,size){return Array.from({length:size},()=>rollD6());}
function hasOne(faces){return faces.includes(1);}
function rollOutcome(base,stress,forceFail){return {successes:countSix(base)+countSix(stress),success:!forceFail&&(countSix(base)+countSix(stress)>0)};}
/**
 * Resolve a single actor's skill check with individual seeded d6 results.
 * A caller MUST validate fictional circumstances (gear, allies, threat, target, available
 * time and actor authority) before supplying modifiers and context to this rules layer.
 * Options.push: number of requested pushes (0 or 1, or 2 for an eligible talent).
 * Returns a copied character, journal and rolls; does not mutate the original.
 */
export function resolveSkillCheck(character,options={}) {
 requiredCharacter(character);
 const {skill:requested,context='',attribute:override=null,modifier=0,help=0,
   passive=false,push=0,omitStressDice=0,voluntaryStress=false,
   seed=1993,vehicleModel='',attributeOnly=false} = options;
 if(!isInt(modifier,-15,15)||!isInt(help,0,3)||!isInt(push,0,2)||!isInt(omitStressDice,0,2))
   throw new RangeError('Invalid check modifier, helper count, push count or stress omission.');
 if(typeof passive!=='boolean')throw new TypeError('Passive must be Boolean.');
 if(!SKILLS[requested]&&!attributeOnly)throw new RangeError('Unknown skill.');
 const skill=attributeOnly?null:pickSkill(character,requested,context);
 let attribute=override??(skill?SKILL_ATTRIBUTE[skill]:null);
 if(character.talent==='Negotiator'&&skill==='manipulation'&&context==='cunning'&&override===null)
   attribute='wits';
 if(!ATTRIBUTES.includes(attribute))throw new RangeError('Unknown check attribute.');
 const state=stateFor(character,options.stress??character.stress??0);
 if(!isInt(state.stress,0,30))throw new RangeError('Invalid actor stress.');
 state.resolve=character.resolve;
 const notes=[];
 if (voluntaryStress) {
   if(character.talent!=='Risk Taker'||passive)throw new RangeError('Cannot voluntarily gain stress here.');
   state.stress+=1;notes.push('voluntary_stress');
 }
 if(omitStressDice>0&&character.talent!=='Steady Hands')
   throw new RangeError('Only Steady Hands can omit stress dice.');
 const specialBonus=talentBonus(character,skill,context,passive,vehicleModel);
 if(specialBonus)notes.push('talent_bonus_'+specialBonus);
 const penalties=state.stressResponses.includes(RESPONSE_MOD[attribute])?-2:0;
 const baseCount=Math.max(1,character.attributes[attribute]+(skill?character.skills[skill]:0)+
   modifier+help+specialBonus+penalties);
 if(baseCount>70)throw new RangeError('Dice pool too large.');
 const rollD6=createDiceStream(seed);
 let base=rollPool(()=>rollD6.rollD6(),baseCount);
 let stress=rollPool(()=>rollD6.rollD6(),Math.max(0,state.stress-omitStressDice));
 const first={base:[...base],stress:[...stress],stressLevel:state.stress};
 const responseEvents=[];
 let blocked=false;
 let stressTriggered=false;
 const response=()=>{
   if(passive||!hasOne(stress))return;
   stressTriggered=true;
   const outcome=resolveStressEvent(state,()=>rollD6.rollD6());
   responseEvents.push(outcome);
   if(outcome.kind==='mess_up')blocked=true;
 };
 response();
 const initialPanicFace=hasOne(stress);
 const maxPush=character.talent==='Quick Reflexes'&&attribute==='agility' ?2:
   character.talent==='Last Push'&&attribute==='strength'?2:
   character.talent==='Persistent Inquiry'&&attribute==='wits'?2:1;
 const allowed=!(passive||initialPanicFace||state.stressResponses.includes('deflated'));
 const pushes=[];
 const refused=push>maxPush?'talent_limit':push>0&&!allowed?
   passive?'passive_check':initialPanicFace?'stress_die_one':'deflated':null;
 let remaining=refused?0:push;
 while(remaining>0) {
   if(hasOne(stress)||state.stressResponses.includes('deflated')){notes.push('push_stopped');break;}
   const gain=state.stressResponses.includes('jumpy')?2:1;
   state.stress+=gain;
   base=base.map(v=>v===6?v:rollD6.rollD6());
   stress=stress.map(v=>v===6?v:rollD6.rollD6());
   stress.push(...rollPool(()=>rollD6.rollD6(),gain));
   const p={gain,base:[...base],stress:[...stress],stressLevel:state.stress};
   pushes.push(p);
   response();
   remaining--;
 }
 const outcome=rollOutcome(base,stress,blocked);
 const next=copy(character);
 next.stress=state.stress;
 next.stressResponses=state.stressResponses;
 if(character.talent==='Chain of Command'&&context==='rank_order'&&skill==='command'&&!passive){
   next.stress+=1;
   notes.push('rank_order_stress');
 }
 return {
   actorId:character.id,skill,attribute,context,baseCount,stressDiceInitially:first.stress.length,
   modifier,help,talent:character.talent,notes,initial:first,pushes,responseEvents,
   pushRequested:push,pushRefused:refused,stressTriggered,
   ...outcome,extraSuccesses:Math.max(0,outcome.successes-1),
   after:next,draws:rollD6.snapshot().draws
 };
}
export function resolvePanic(character,{seed=1993,combatFocus=false}={}) {
 requiredCharacter(character);
 const die=createDiceStream(seed),d6=die.rollD6();
 const value=d6+(character.stress||0)-character.resolve;
 const severity=value<=0?0:Math.min(12,value);
 const next=copy(character);next.panicResponses=[...(character.panicResponses||[])];
 const ruleOutcome=severity===0?'composed':severity===1?'spooked':severity===2?'noise':
   severity===3?'resource_loss':severity===4?'drop_item':severity===5?'distrust':
   severity===6?'slow_reaction':severity===7?'freeze':severity===8?'cover':
   severity===9?'scream':severity===10?'flee':severity===11?'frenzy':'catatonic';
 let kind=ruleOutcome;
 if(combatFocus&&character.talent==='Combat Focus'&&value>=9)
   kind='combat_focus'; // Active assault behavior needs combat scheduler integration.
 if(kind==='spooked')next.stress=(next.stress||0)+1;
 if(value>=1&&kind!=='composed'&&kind!=='spooked')next.panicResponses.push(kind);
 return {actorId:character.id,d6,value,kind,after:next,draws:die.snapshot().draws};
}
export function reduceDamage(character,{seed=1993,damage}={}){
 requiredCharacter(character);
 if(!isInt(damage,0,99))throw new RangeError('Invalid damage.');
 if(character.talent!=='Resilient Worker')return {damage,prevented:0,roll:null};
 const roll=resolveSkillCheck(character,{attributeOnly:true,attribute:'strength',seed,push:0});
 const prevented=Math.min(damage,roll.successes);
 return {damage:damage-prevented,prevented,roll};
}
export function restStress(character,{safe=true,stretch=true}={}) {
 requiredCharacter(character);
 if(!safe||!stretch)throw new RangeError('Stress recovery requires a safe, uninterrupted stretch.');
 const next=copy(character);
 const amount=character.talent==='Steady Under Fire'?2:1;
 next.stress=Math.max(0,(next.stress||0)-amount);
 next.stressResponses=(next.stressResponses||[]).slice(amount);
 return {after:next,amount};
}
export function talentRule(character,{context='',skill='',vehicleModel=''}={}) {
 requiredCharacter(character);
 const talent=character.talent;
 const bonus=talentBonus(character,skill,context,false,vehicleModel);
 const actionCost=talent==='Rapid Orders'&&context==='combat_order'?'quick':null;
 const nursing=talent==='Recovery Care'&&context==='critical_injury_recovery'?2:1;
 const ammoDiceReduction=talent==='Careful Aim'&&context==='ammo_supply'?2:0;
 return {talent,bonus,actionCost,nursingDayMultiplier:nursing,ammoDiceReduction,
   procedure:SPECIAL_TALENTS[talent]||null};
}

/**
 * An opposed test uses two actor sheets and two independent seeded streams.
 * The active actor must exceed the defender's number of successes. Ties do
 * not grant success to the aggressor; caller may specify a narrative stalemate.
 * No dice or actor state is skipped merely because the actor is AI-controlled.
 */
export function resolveOpposedCheck(active,opponent,{
 seed=1993,activeSkill,opponentSkill=activeSkill,activeContext='',
 opponentContext='',activePush=0,opponentPush=0,
 activeModifier=0,opponentModifier=0
}={}) {
 const n=seedValue(seed);
 const a=resolveSkillCheck(active,{
  skill:activeSkill,context:activeContext,modifier:activeModifier,
  push:activePush,seed:n
 });
 const b=resolveSkillCheck(opponent,{
  skill:opponentSkill,context:opponentContext,modifier:opponentModifier,
  push:opponentPush,seed:(n ^ 0xa5a5a5a5)>>>0
 });
 return {active:a,opponent:b,
   winner:a.successes>b.successes?'active':a.successes<b.successes?'opponent':'tie',
   activeSucceeds:a.success&&a.successes>b.successes,
   margin:a.successes-b.successes
 };
}
