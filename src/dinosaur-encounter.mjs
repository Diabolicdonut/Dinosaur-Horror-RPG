// 007-L2b1 — original Jurassic Velociraptor attack options.
// Faithful Evolved initiative, defensive reactions, dice and injury
// procedures still resolve the strike; this module merely validates whether
// there is an exposed target and whether one physically earned opening exists.
import {SCENARIO} from './scenario.mjs';
import {actorHasLight} from './dinosaur-pursuit.mjs';

export const VELOCIRAPTOR_TACTICS=Object.freeze({
 bite:Object.freeze({id:'bite',label:'Close bite',attackDiceBonus:0,baseDamageBonus:0}),
 pounce:Object.freeze({id:'pounce',label:'Approach pounce',attackDiceBonus:1,baseDamageBonus:0})
});

// Concealment in the same zone fails against a visible powered lamp. Dark
// concealment and real named cover still provide protection until discovered
// by an authorized Observation/search. This does not reveal remote actors.
export function creatureCanTargetActor(creature,actor){
 return Boolean(creature&&!creature.defeated&&actor&&!actor.dead&&!actor.broken&&
  actor.health>0&&actor.location===creature.location&&
  (!actor.hidden||actorHasLight(actor)));
}
export function validApproachPounce(state,creature,actor){
 if(!creatureCanTargetActor(creature,actor)||!state?.combat?.active||
   state.combat.round!==1)return false;
 const hunt=creature.lastHunt;
 if(!hunt||hunt.blocked!==false||hunt.from===hunt.to||
  !SCENARIO.rooms[hunt.from]?.exits.includes(hunt.to)||
  hunt.to!==creature.location||!['stalk','investigate'].includes(hunt.behavior)||
  !Number.isSafeInteger(hunt.beat)||hunt.beat>state.beat)return false;
 // A physical arrival is a one-off opening, not a permanent dice bonus.
 return !(state.actions||[]).some(a=>a.actorId===creature.id&&
  a.kind==='predator_attack'&&a.beat>=hunt.beat);
}
export function raptorAttackPlan(state,actor){
 const creature=state?.dinosaurs?.[0];
 if(!creatureCanTargetActor(creature,actor))return null;
 return validApproachPounce(state,creature,actor)?
  VELOCIRAPTOR_TACTICS.pounce:VELOCIRAPTOR_TACTICS.bite;
}
