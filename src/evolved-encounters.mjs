// Evolved Edition mechanical adaptation for a dinosaur horror scenario.
// Source reference: user-private Evolved core rulebook, Space & Time pp 54-55,
// Stealth pp 55-58, Combat pp 59-67, Injury pp 68-71, Panic pp 72-73.
// The animal stats, injuries' descriptive labels, and scenario are original.
// Not a transcription of source narrative, artwork, or published creatures.
import {createDiceStream,resolveSkillCheck,resolvePanic} from './evolved-checks.mjs';
import {actorHasLight} from './dinosaur-pursuit.mjs';
export const SURVIVAL_RULES_VERSION='007-E';
export const STRETCH_MINUTES=10;
export const ROUND_SECONDS=10;
export const DINO_SPECIES=Object.freeze({
 velociraptor:Object.freeze({kind:'Velociraptor',speed:2,observation:5,attack:6,
   baseDamage:2,armor:1,health:6}),
});
const copy=v=>JSON.parse(JSON.stringify(v));
function d6(seed){return createDiceStream(seed);}
const throws=(what)=>{throw new RangeError(what);};
export function rollInitiative({actorIds=[],dinosaurTurns=2,seed=1993,surpriseActorIds=[]}={}) {
 if(!Array.isArray(actorIds)||new Set(actorIds).size!==actorIds.length ||
  actorIds.some(id=>typeof id!=='string'||!id))
  throw new RangeError('Combatants require distinct named actor IDs.');
 if(!Number.isInteger(dinosaurTurns)||dinosaurTurns<0||
    actorIds.length+dinosaurTurns<1||actorIds.length+dinosaurTurns>10)
   throw new RangeError('Initiative requires 1–10 card assignments.');
 const participants=[...actorIds,...Array.from({length:dinosaurTurns},(_,i)=>'dinosaur-'+(i+1))];
 if(!Array.isArray(surpriseActorIds)||new Set(surpriseActorIds).size!==surpriseActorIds.length||
    surpriseActorIds.some(id=>!participants.includes(id)))
   throw new RangeError('Surprise attackers must be actual distinct combatants.');
 const deck=Array.from({length:10},(_,i)=>i+1),roll=d6(seed),cards=[];
 for(const id of surpriseActorIds)
  cards.push({actorId:id,card:deck.shift(),kind:id.startsWith('dinosaur-')?'dinosaur':'human'});
 const unbiasedIndex=size=>{let x,limit=36-36%size;do{x=(roll.rollD6()-1)*6+(roll.rollD6()-1);}while(x>=limit);return x%size;};
 for(const id of participants.filter(id=>!surpriseActorIds.includes(id))){
  const n=unbiasedIndex(deck.length);
  cards.push({actorId:id,card:deck.splice(n,1)[0],kind:id.startsWith('dinosaur-')?'dinosaur':'human'});
 }
 return cards.sort((a,b)=>a.card-b.card);
}
export function createActionBudget(){return {full:1,quick:2,quickSpent:0,fullSpent:0};}
export function spendActionBudget(budget,cost){
 if(!budget||!['full','quick'].includes(cost))throw new RangeError('Invalid action cost.');
 const b={...budget};
 if(cost==='full'){
  if(b.fullSpent||b.quickSpent>=2)return {accepted:false,budget,reason:'Full action already consumed.'};
  b.fullSpent=1;b.full=0;
 }else {
  if(b.quickSpent>=2||b.fullSpent&&b.quickSpent>=1)return {accepted:false,budget,reason:'No quick action remains.'};
  b.quickSpent++;b.quick=2-b.quickSpent;
  if(b.quickSpent===2)b.full=0;
 }
 return {accepted:true,budget:b};
}
export function rollDicePool(number,seed){
 if(!Number.isInteger(number)||number<0||number>30)throw new RangeError('Pool must contain 0–30 dice.');
 const rng=d6(seed);
 const faces=Array.from({length:number},()=>rng.rollD6());
 return {faces,successes:faces.filter(n=>n===6).length};
}
export function detectCreature(actor,{seed=1993,observationDice=5,cluttered=true,guarding=false}={}){
 if(!Number.isInteger(observationDice)||observationDice<0||observationDice>30)
  throw new RangeError('Invalid creature observation rating.');
 const own=resolveSkillCheck(actor,{skill:'observation',passive:true,modifier:guarding?2:0,seed});
 const threat=rollDicePool(observationDice,(seed^0xa5b3579d)>>>0);
 const margin=own.successes-threat.successes;
 return {human:own,creature:threat,margin,
   outcome:margin>0?(cluttered?'human_sees_first':'human_spots_first'):margin<0?'creature_sees_first':'simultaneous',
   canHide:cluttered};
}
/**
 * Group stealth detection: only the strongest passive OBSERVATION result on
 * each side counts, not the sum of allied dice. Every actor is rolled with
 * their own Wits/Observation and a deterministic per-actor derived seed.
 */
export function detectGroupCreature(actors,{seed=1993,observationDice=5,darkness=false}={}){
 if(!Array.isArray(actors)||actors.length<1||actors.length>8||
    actors.some(a=>!a||typeof a.id!=='string')||
    new Set(actors.map(a=>a.id)).size!==actors.length)
  throw new RangeError('A stealth group needs 1–8 distinct survivors.');
 const humans=actors.map((actor,i)=>({
  actorId:actor.id,...resolveSkillCheck(actor,{skill:'observation',
   passive:true,modifier:(actor.guarding?2:0)-
     (darkness&&!actorHasLight(actor)?2:0),
   seed:(seed^(0x9e3779b9*(i+1)))>>>0})
 }));
 const best=Math.max(...humans.map(a=>a.successes));
 const creature=rollDicePool(observationDice,(seed^0xa5b3579d)>>>0);
 const margin=best-creature.successes;
 return {humans,creature,best,margin,
  outcome:margin>0?'humans_spot_first':margin<0?'creature_spots_first':'simultaneous'};
}
/** One active search roll reveals at most one hidden character per success.
 * No passive check is made simply for entering an occupied hiding zone. */
export function searchHiddenGroup(hiddenActorIds,{seed=1993,observationDice=5}={}){
 if(!Array.isArray(hiddenActorIds)||hiddenActorIds.length>8||
    hiddenActorIds.some(id=>typeof id!=='string'||!id)||
    new Set(hiddenActorIds).size!==hiddenActorIds.length)
  throw new RangeError('Hidden targets must be unique named survivors.');
 const search=rollDicePool(observationDice,seed);
 return {search,revealed:hiddenActorIds.slice(0,search.successes),
  stillHidden:hiddenActorIds.slice(search.successes)};
}
const injuryLevel=d66=>{
 if(d66<=13)return {severity:'shock',lethal:false,deadline:null,impairment:0};
 if(d66<=36)return {severity:'wound',lethal:false,deadline:null,impairment:d66>=31?2:1};
 if(d66<=43)return {severity:'serious',lethal:false,deadline:null,impairment:2};
 if(d66<=52)return {severity:'critical',lethal:true,deadline:'shift',impairment:2};
 if(d66<=56)return {severity:'critical',lethal:true,deadline:'stretch',impairment:3};
 if(d66<=63)return {severity:'critical',lethal:true,deadline:'round',impairment:3};
 return {severity:'fatal',lethal:true,deadline:'instant',impairment:3};
};
export function rollCriticalInjury(seed=1993,previous=[]){
 const roll=d6(seed);
 for(let tries=0;tries<20;tries++){
  const tens=roll.rollD6(),ones=roll.rollD6(),d66=tens*10+ones;
  if(d66>=14&&previous.some(e=>e.code===d66))continue;
  return {code:d66,...injuryLevel(d66)};
 }
 throw new RangeError('Could not roll nonduplicate critical injury.');
}
/**
 * Damage retains actual hit dice and a source-like armor subtraction.
 * Derived creature attack damage uses an original Jurassic Park threat rating.
 * Attack outcome is never narrated as a full signature-attack table.
 */
export function applyCreatureAttack(actor,{seed=1993,attackerDice=6,baseDamage=2,
   armor=null,dodge=false,defend=false,defenderSeed=null}={}){
 if(!actor||!Number.isInteger(actor.health)||!Number.isInteger(actor.healthMax))
  throw new RangeError('Target requires valid health state.');
 if(!Number.isInteger(baseDamage)||baseDamage<0||baseDamage>12)
  throw new RangeError('Invalid attack damage.');
 const strike=rollDicePool(attackerDice,seed);
 if(dodge&&defend)throw new RangeError('Choose only one defense method.');
 const evade=(dodge||defend)?resolveSkillCheck(actor,{skill:defend?'close_combat':'mobility',
   seed:defenderSeed??((seed^0x920aca3a)>>>0)}):null;
 const remaining=Math.max(0,strike.successes-(evade?.successes||0));
 const armorValue=armor===null?(actor.armorLevel||0):armor;
 if(!Number.isInteger(armorValue)||armorValue<0||armorValue>10)throw new RangeError('Invalid armor.');
 const raw=remaining===0?0:baseDamage+remaining-1;
 const damage=Math.max(0,raw-armorValue);
 const after=copy(actor);
 after.health=Math.max(0,actor.health-damage);
 const broken=damage>0&&actor.health>0&&after.health===0;
 const outright=damage>=2*actor.healthMax;
 let critical=null;
 if(broken){
  critical=rollCriticalInjury((seed^0xf1771ae1)>>>0,after.criticalInjuries||[]);
  after.criticalInjuries=[...(after.criticalInjuries||[]),critical];
 }
 after.broken=Boolean(after.broken||broken);
 after.dead=Boolean(after.dead||outright||critical?.deadline==='instant');
 if(after.dead)after.health=0;
 return {strike,evade,remaining,raw,armor:armorValue,damage,broken,critical,dead:after.dead,after};
}
export function applyMedicalAid(actor,patient,{seed=1993}={}){
 if(!actor||!patient||actor.id===patient.id||!patient.broken||patient.dead)
   return {accepted:false,reason:'Medical aid requires a living, broken patient and a different medic.'};
 const check=resolveSkillCheck(actor,{skill:'medical_aid',context:'first_aid',seed});
 const next=copy(patient);
 if(check.success){
  next.health=Math.min(next.healthMax,Math.max(1,check.successes));
  next.broken=false;
  next.stabilized=true;
 }
 return {accepted:true,check,patient:next,success:check.success};
}
export function panicOnContact(actor,{seed=1993,canFlee=true,cluttered=true}={}){
 const roll=resolvePanic(actor,{seed});
 const state=copy(roll.after);
 const kind=roll.kind;
 const event={kind,code:roll.value,stress:state.stress||0,
  skipNextTurn:['freeze','cover','scream'].includes(kind),
  flee:kind==='flee'&&canFlee,
  demandCover:kind==='cover'&&cluttered,
  alerted:['noise','scream','frenzy'].includes(kind),
  dropItem:kind==='drop_item',
  fatal:false
 };
 if(kind==='cover'&&!cluttered){event.kind='scream';event.alerted=true;event.skipNextTurn=true;}
 if(kind==='flee'&&!canFlee){event.kind='catatonic';event.flee=false;}
 if(['cover','scream','flee'].includes(event.kind))state.stress=Math.max(0,(state.stress||0)-1);
 if(event.dropItem&&Array.isArray(state.inventory)&&state.inventory.length)
   event.dropped=state.inventory.shift();
 state.panicState=event.kind==='composed'?null:event.kind;
 state.pendingSkip=Boolean(event.skipNextTurn);
 return {roll,event,after:state};
}
