// Checkpoint 007-F: live Evolved-style initiative/action economy.
// This module only manages turn scheduling; party-engine is authoritative for
// actor health, world position, inventory, Evolved rolls and consequences.
import {rollInitiative,createActionBudget,spendActionBudget} from './evolved-encounters.mjs';
import {actorHasLight} from './dinosaur-pursuit.mjs';
import {woundModifiers,pendingLethal,deathRoll,worldSeconds} from './evolved-injuries.mjs';
export const COMBAT_SCHEDULER_VERSION='007-H';
export const COMBAT_COST=Object.freeze({
 move:'quick',sneak:'full',rush:'quick',light:'quick',take:'quick',give:'quick',guard:'quick',rally:'quick',
 attack:'full',hide:'full',aid:'full',use:'full',investigate:'full'
});
const cloning=x=>JSON.parse(JSON.stringify(x));
const inScene=s=>s.actors.filter(a=>a.location===s.dinosaurs[0].location&&!a.dead&&
 (!a.hidden||actorHasLight(a)));
export function activeCombatSlot(s){
 return s.combat?.active?s.combat.order[s.combat.index]||null:null;
}
export function activeTurnId(s){
 const turn=activeCombatSlot(s);
 return turn?(turn.kind==='dinosaur'?s.dinosaurs[0].id:turn.actorId):s.actors[s.cursor].id;
}
export function drawCombatRound(s,{surpriseActorIds=[]}={}){
 const actors=inScene(s);
 if(s.dinosaurs[0].defeated||!actors.length)return null;
 const cards=rollInitiative({
  actorIds:actors.map(a=>a.id),dinosaurTurns:2,seed:s.rng,surpriseActorIds
 });
 // Random draw advances the durable world RNG at the caller's boundary.
 return {order:cards,index:0,budgets:Object.fromEntries(actors.map(a=>[a.id,createActionBudget()])),
  cardDrawSeed:s.rng};
}
export function beginCombat(s,seed,{surpriseActorId=null,ambush=false}={}){
 if(s.combat?.active)return false;
 if(s.dinosaurs[0].defeated||!inScene(s).length)return false;
 const priority=surpriseActorId?[surpriseActorId]:[];
 const initial=drawCombatRound({...s,rng:seed},{surpriseActorIds:priority});
 if(!initial)return false;
 s.combat={active:true,round:1,room:s.dinosaurs[0].location,
  ...initial,roundHistory:[{round:1,seed,order:cloning(initial.order)}],
  ...(surpriseActorId?{surprise:{actorId:surpriseActorId,ambush:Boolean(ambush),consumed:false,round:1}}:{}) ,
  holds:[]};
 return true;
}
/** Holding off swaps this turn's card with any later card. It uses no action
 * budget or random draw. The other combatant acts immediately. */
export function holdOff(s,actorId,targetCard){
 const c=s.combat,slot=activeCombatSlot(s);
 if(!c?.active||slot?.kind!=='human'||slot.actorId!==actorId)
  return {accepted:false,reason:'Only the active survivor may hold initiative.'};
 if(!Number.isInteger(targetCard))
  return {accepted:false,reason:'Choose a numbered card from a later turn.'};
 const index=c.order.findIndex((v,i)=>i>c.index&&v.card===targetCard);
 if(index<0)return {accepted:false,reason:'Only a combatant who has not acted may receive your current card.'};
 const later=c.order[index];
 if(later.kind==='human'){
  const a=s.actors.find(a=>a.id===later.actorId);
  if(!a||a.dead||a.location!==s.dinosaurs[0].location)
   return {accepted:false,reason:'The chosen survivor has no eligible upcoming turn.'};
 }
 const earlier={...slot},after={...later};
 // Swap combatant identities, never the numbered cards or saved action budgets.
 c.order[c.index]={...slot,actorId:after.actorId,kind:after.kind};
 c.order[index]={...later,actorId:earlier.actorId,kind:earlier.kind};
 c.holds??=[];
 c.holds.push({round:c.round,fromCard:earlier.card,toCard:after.card,
   actorId,recipientId:after.actorId,beat:s.beat});
 c.holds=c.holds.slice(-120);
 if(after.kind==='human')
  s.cursor=s.actors.findIndex(a=>a.id===after.actorId);
 return {accepted:true,fromCard:earlier.card,toCard:after.card,
  recipientId:after.actorId,actorId};
}
export function combatCost(kind) {return COMBAT_COST[kind]||null;}
export function checkCombatAction(s,actorId,kind){
 const slot=activeCombatSlot(s);
 if(!slot)return {accepted:false,reason:'No active combat turn.'};
 if(slot.kind==='dinosaur')return {accepted:false,reason:'The velociraptor acts next.'};
 if(slot.actorId!==actorId)return {accepted:false,reason:'Another combatant has initiative.'};
 if(kind==='wait'||kind==='end')return {accepted:true,cost:'end'};
 let cost=combatCost(kind);
 if(kind==='move'){
  const actor=s.actors.find(a=>a.id===actorId);
  const injury=woundModifiers(actor,'mobility');
  if(injury.immobile)return {accepted:false,reason:'A spinal injury prevents movement.'};
  if(injury.moveFull)cost='full';
 }
 if(!cost)return {accepted:false,reason:'Action is not supported in combat.'};
 const b=s.combat.budgets[actorId];
 if(!b)return {accepted:false,reason:'Combat actor has no action budget.'};
 const result=spendActionBudget(b,cost);
 return {...result,cost};
}
function combatantsRemain(s){
 return !s.dinosaurs[0].defeated&&inScene(s).length>0;
}
export function advanceCombatSlot(s,nextSeed=null){
 if(!s.combat?.active)return false;
 s.combat.index++;
 let guard=0;
 while(s.combat?.active && guard++<40){
  if(!combatantsRemain(s)){
   s.combat.active=false;s.combat.endedAt=s.beat;
   // Resume the ordinary roster on the next survivor after the last human actor.
   s.cursor=(s.cursor+1)%s.actors.length;
   return false;
  }
  if(s.combat.index>=s.combat.order.length){
   if(typeof nextSeed!=='function')
     throw new RangeError('A seeded initiative draw callback is required at round boundary.');
   const seed=nextSeed(s),next=drawCombatRound({...s,rng:seed});
   if(!next){
    s.combat.active=false;s.combat.endedAt=s.beat;
    s.cursor=(s.cursor+1)%s.actors.length;return false;
   }
   s.combat.round++;
   if(s.clock){s.clock.combatRounds++;s.clock.combatSeconds+=10;}
   Object.assign(s.combat,next);
   s.combat.roundHistory.push({round:s.combat.round,seed,order:cloning(next.order)});
   s.combat.roundHistory=s.combat.roundHistory.slice(-24);
  }
  const slot=activeCombatSlot(s);
  if(!slot)throw new Error('Initiative schedule became invalid.');
  if(slot.kind==='dinosaur'&&!s.dinosaurs[0].defeated)return true;
  const actor=s.actors.find(a=>a.id===slot.actorId);
  if(actor&&actor.location===s.dinosaurs[0].location&&!actor.dead&&
   (!actor.hidden||actorHasLight(actor))){
   s.cursor=s.actors.indexOf(actor);
   return true;
  }
  s.combat.index++;
 }
 throw new Error('Combat initiative exceeded safety bound.');
}
function completeActorMedicalTurn(s,actorId,nextSeed){
 const index=s.actors.findIndex(a=>a.id===actorId);
 if(index<0||s.actors[index].dead)return;
 let actor=s.actors[index];
 const due=pendingLethal(actor).filter(w=>w.deadline==='round'&&
   w.lastTurnDeathRound!==s.combat.round);
 for(const wound of due){
  if(actor.dead)break;
  const seed=nextSeed(s),result=deathRoll(actor,{seed,injuryCode:wound.code});
  if(!result.accepted)continue;
  actor=result.next;
  const current=actor.criticalInjuries.find(w=>w.code===wound.code);
  if(current){
   current.lastTurnDeathRound=s.combat.round;
   current.nextDeathAt=current.stabilized?null:worldSeconds(s)+10;
  }
  s.actors[index]=actor;
  s.events.push({beat:s.beat,actorId,category:result.success?'milestone':'danger',
    message:actor.name+(result.success?' survives':' fails')+
     ' a round-critical death check ('+wound.code+').' });
  s.events=s.events.slice(-160);
  s.medicalChecks??=[];
  s.medicalChecks.push({round:s.combat.round,actorId,code:wound.code,seed,
    success:result.success,beat:s.beat});
  s.medicalChecks=s.medicalChecks.slice(-160);
 }
 if(s.actors.every(a=>a.dead))s.outcome='lost';
}
export function finishCombatAction(s,actorId,kind,nextSeed){
 if(!s.combat?.active)return;
 // A threat that has been defeated, or has lost all exposed opponents,
 // ends this encounter immediately; no dead creature receives a later turn.
 if(!combatantsRemain(s)){
  completeActorMedicalTurn(s,actorId,nextSeed);
  s.combat.active=false;s.combat.endedAt=s.beat;
  s.cursor=(s.cursor+1)%s.actors.length;
  return;
 }
 const check=checkCombatAction(s,actorId,kind);
 if(!check.accepted)throw new Error(check.reason);
 if(check.cost==='end'){
  completeActorMedicalTurn(s,actorId,nextSeed);
  advanceCombatSlot(s,nextSeed);return;
 }
 s.combat.budgets[actorId]=check.budget;
 if(check.budget.quickSpent===2||(check.budget.fullSpent===1&&check.budget.quickSpent===1)){
  completeActorMedicalTurn(s,actorId,nextSeed);
  advanceCombatSlot(s,nextSeed);
 }
}
export function finishDinosaurAction(s,nextSeed){
 if(!s.combat?.active||activeCombatSlot(s)?.kind!=='dinosaur')
  throw new RangeError('Not a dinosaur initiative turn.');
 advanceCombatSlot(s,nextSeed);
}
export function validCombatState(s){
 const c=s.combat;
 if(c===undefined||c===null)return true; // 007-D and 007-E v3 saves
 if(!c||typeof c!=='object'||typeof c.active!=='boolean')return false;
 if(!c.active)return true;
 if(!Number.isInteger(c.round)||c.round<1||!Number.isInteger(c.index)||
    !Array.isArray(c.order)||c.order.length<1||c.order.length>10||
    c.index<0||c.index>=c.order.length||typeof c.budgets!=='object'||
    !Array.isArray(c.roundHistory)||
    (c.holds!==undefined&&!Array.isArray(c.holds))||
    (c.surprise!==undefined&&(!c.surprise||typeof c.surprise.actorId!=='string'||
       typeof c.surprise.ambush!=='boolean'||typeof c.surprise.consumed!=='boolean'||
       c.surprise.round!==1)))return false;
 if(c.pendingReaction!==undefined){
  const p=c.pendingReaction,slot=c.order[c.index];
  if(!p||!slot||slot.kind!=='dinosaur'||slot.card!==p.card||
     !s.actors.some(a=>a.id===p.victimId&&!a.dead&&!a.broken&&a.location===s.dinosaurs[0].location)||
     p.round!==c.round||p.declaredAtBeat!==s.beat||
     p.attackKind!=='close_combat')return false;
 }
 const cards=new Set();
 for(const slot of c.order){
  if(!slot||!Number.isInteger(slot.card)||slot.card<1||slot.card>10||
     cards.has(slot.card)||!['human','dinosaur'].includes(slot.kind))return false;
  cards.add(slot.card);
  if(slot.kind==='human'&&!s.actors.some(a=>a.id===slot.actorId))return false;
  if(slot.kind==='human'){
   const b=c.budgets[slot.actorId];
   if(!b||![0,1,2].includes(b.quickSpent)||![0,1].includes(b.fullSpent)||
      (b.quickSpent===2&&b.fullSpent!==0))return false;
  }
 }
 return true;
}
