// Generic Evolved numbered initiative/action-budget scheduler.
// No scenario location, dinosaur species, physical damage or narration here.
// The caller provides only combatant IDs and an already permitted encounter.
import {rollInitiative,createActionBudget,spendActionBudget}
 from './evolved-encounters.mjs';

const copy=x=>JSON.parse(JSON.stringify(x));
const uint=x=>Number.isSafeInteger(x)&&x>=0&&x<=0xffffffff;
const validId=x=>typeof x==='string'&&x.length>0&&x.length<=96;
const COST=Object.freeze({
 move:'quick',rush:'quick',guard:'quick',take:'quick',give:'quick',
 attack:'full',sneak:'full',hide:'full',aid:'full',use:'full'
});
function participants(actorIds,predatorId,predatorSpeed){
 return Array.isArray(actorIds)&&actorIds.length>=1&&actorIds.length<=8&&
  actorIds.every(validId)&&new Set(actorIds).size===actorIds.length&&
  validId(predatorId)&&!actorIds.includes(predatorId)&&
  Number.isInteger(predatorSpeed)&&predatorSpeed>=1&&predatorSpeed<=2&&
  actorIds.length+predatorSpeed<=10;
}
function initiative(actorIds,predatorId,predatorSpeed,seed){
 const source=rollInitiative({actorIds,dinosaurTurns:predatorSpeed,seed});
 return source.map(slot=>slot.kind==='dinosaur'?
  {...slot,actorId:predatorId,turnIndex:Number(slot.actorId.split('-').at(-1))}:
  {...slot,turnIndex:1});
}
export function beginAdventureCombat({actorIds,predatorId,predatorSpeed=2,seed}={}){
 if(!participants(actorIds,predatorId,predatorSpeed)||!uint(seed))
  throw new RangeError('Physical Evolved combatants and seeded initiative required.');
 const order=initiative(actorIds,predatorId,predatorSpeed,seed);
 return {round:1,order,index:0,predatorId,predatorSpeed,
  actorIds:[...actorIds],cardSeed:seed,
  budgets:Object.fromEntries(actorIds.map(id=>[id,createActionBudget()])),
  history:[]};
}
export function activeAdventureCombatSlot(combat){
 return combat?.order?.[combat.index]??null;
}
export function validAdventureCombat(combat){
 try{
  if(!combat||!participants(combat.actorIds,combat.predatorId,combat.predatorSpeed)||
   !uint(combat.cardSeed)||!Number.isInteger(combat.round)||combat.round<1||
   !Number.isInteger(combat.index)||combat.index<0||
   combat.index>=combat.order.length||!Array.isArray(combat.history)||combat.history.length>400)
   return false;
  const expected=initiative(combat.actorIds,combat.predatorId,combat.predatorSpeed,combat.cardSeed);
  if(JSON.stringify(combat.order)!==JSON.stringify(expected))return false;
  if(Object.keys(combat.budgets).sort().join('|')!==combat.actorIds.slice().sort().join('|'))
   return false;
  return combat.actorIds.every(id=>{
   const b=combat.budgets[id];
   return b&&[b.full,b.quick,b.quickSpent,b.fullSpent].every(Number.isInteger)&&
    b.quickSpent>=0&&b.quickSpent<=2&&b.fullSpent>=0&&b.fullSpent<=1&&
    b.full===(b.fullSpent?0:b.quickSpent===2?0:1)&&
    b.quick===2-b.quickSpent&&!(b.fullSpent&&b.quickSpent>1);
  })&&combat.history.every(h=>h&&Number.isInteger(h.round)&&h.round>=1&&
   h.round<=combat.round&&Number.isInteger(h.card)&&h.card>=1&&h.card<=10&&
   (h.cost==='quick'||h.cost==='full'||h.cost==='end')&&
   validId(h.actorId));
 }catch{return false;}
}
export function spendAdventureCombatAction(combat,{actorId,kind}={}){
 const reject=reason=>({accepted:false,combat,reason});
 if(!validAdventureCombat(combat))return reject('Invalid combat state.');
 const slot=activeAdventureCombatSlot(combat);
 if(slot.kind!=='human'||slot.actorId!==actorId)
  return reject('The named human combatant does not hold this initiative card.');
 const cost=kind==='end'||kind==='wait'?'end':COST[kind];
 if(!cost)return reject('Unknown Evolved combat action.');
 const result=cost==='end'?{accepted:true,budget:combat.budgets[actorId]}:
  spendActionBudget(combat.budgets[actorId],cost);
 if(!result.accepted)return reject(result.reason);
 const next=copy(combat);
 next.budgets[actorId]=result.budget;
 next.history.push({round:next.round,card:slot.card,actorId,kind,cost});
 if(next.history.length>400)next.history=next.history.slice(-400);
 // Caller must commit the deterministic world/skill consequence separately.
 // This module owns only the source quick/full action cost contract.
 return {accepted:true,combat:next,cost};
}
export function advanceAdventureCombatSlot(combat,{nextSeed}={}){
 const reject=reason=>({accepted:false,combat,reason});
 if(!validAdventureCombat(combat))return reject('Invalid combat state.');
 const next=copy(combat);
 next.index++;
 if(next.index>=next.order.length){
  if(!uint(nextSeed))return reject('Next combat round requires a real seeded card draw.');
  next.round++;next.cardSeed=nextSeed;
  next.order=initiative(next.actorIds,next.predatorId,next.predatorSpeed,nextSeed);
  next.index=0;
  next.budgets=Object.fromEntries(next.actorIds.map(id=>[id,createActionBudget()]));
 }
 return {accepted:true,combat:next,slot:activeAdventureCombatSlot(next)};
}
