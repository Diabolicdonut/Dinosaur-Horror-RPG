// 009-B2b2c2c2b: revision-gated live Evolved turns for a physically present
// predator. Reusable mechanics; no authored room, objective or species names.
import {beginAdventureCombat,activeAdventureCombatSlot,validAdventureCombat,
 spendAdventureCombatAction,advanceAdventureCombatSlot} from './adventure-combat-scheduler.mjs';
import {DINO_SPECIES,applyCreatureAttack} from './evolved-encounters.mjs';
import {enrichInjuries,tickMedicalClock,pendingLethal,resolveClinicalAid,
 woundModifiers,worldSeconds} from './evolved-injuries.mjs';
import {resolveSkillCheck} from './evolved-checks.mjs';
const copy=x=>JSON.parse(JSON.stringify(x));
const reject=(s,reason)=>({accepted:false,state:s,reason});
const active=s=>s.combat?activeAdventureCombatSlot(s.combat):null;
const inRange=(s,id)=>s.actors.find(a=>a.id===id&&!a.dead&&!a.broken&&
 a.location===s.dinosaurs.find(d=>d.id===s.combat?.predatorId)?.location);
function threat(s){return s.dinosaurs.find(d=>d.id===s.combat?.predatorId&&!d.defeated);}
export function selectedCombatSlot(s){return s?.scenario==='ridge-survey'&&s.combat?
 active(s):null;}
export function validSelectedCombat(s){
 if(s.adventureBinding?.revision<8)return s.combat===null&&
  (s.combatReaction===undefined||s.combatReaction===null)&&
  (s.combatRoundRecords===undefined||Array.isArray(s.combatRoundRecords)&&!s.combatRoundRecords.length)&&
  (s.combatDamageRecords===undefined||Array.isArray(s.combatDamageRecords)&&!s.combatDamageRecords.length);
 if(!Array.isArray(s.combatRoundRecords)||s.combatRoundRecords.length>200||
    !Array.isArray(s.combatDamageRecords)||s.combatDamageRecords.length>400||
    !(s.combatReaction===null||typeof s.combatReaction==='object'))return false;
 if(!s.combat)return s.combatReaction===null;
 if(!validAdventureCombat(s.combat)||!threat(s)||
    !DINO_SPECIES[threat(s).kind]||
    s.combat.predatorSpeed!==DINO_SPECIES[threat(s).kind].speed||
    s.combat.actorIds.some(id=>!s.actors.some(a=>a.id===id))||
    s.pendingPredatorResponse)return false;
 if(s.combatReaction){
  const p=s.combatReaction,slot=active(s);
  if(!slot||slot.kind!=='dinosaur'||slot.actorId!==p.creatureId||
   p.creatureId!==s.combat.predatorId||p.card!==slot.card||
   p.round!==s.combat.round||p.victimId===undefined||
   !inRange(s,p.victimId)||![p.attackSeed,p.defenderSeed].every(n=>
    Number.isSafeInteger(n)&&n>=0&&n<=0xffffffff))return false;
 }
 return s.combatDamageRecords.every(x=>x&&Number.isSafeInteger(x.round)&&
   x.round>=1&&x.round<=s.combat.round&&
   ['defend','decline'].includes(x.reaction)&&
   s.combat.actorIds.includes(x.victimId)&&
   Number.isInteger(x.damage)&&x.damage>=0&&x.damage<=12)&&
 s.combatRoundRecords.every((x,i)=>x?.round===i+1&&
   Number.isSafeInteger(x.seed)&&x.seed>=0&&x.seed<=0xffffffff);
}
export function beginSelectedCombat(s,nextSeed){
 if(s.combat||s.adventureBinding.revision<8||s.pendingPredatorResponse)return false;
 const d=s.dinosaurs.find(d=>d.disposition==='predatory'&&!d.defeated&&
  DINO_SPECIES[d.kind]&&s.actors.some(a=>a.location===d.location&&!a.dead&&!a.broken));
 if(!d)return false;
 const actorIds=s.actors.filter(a=>a.location===d.location&&!a.dead&&!a.broken)
  .map(a=>a.id);
 s.combat=beginAdventureCombat({actorIds,predatorId:d.id,
  predatorSpeed:DINO_SPECIES[d.kind].speed,seed:nextSeed(s)});
 s.combatReaction=null;
 alignCursor(s);
 return true;
}
function alignCursor(s){
 const slot=active(s);
 if(slot?.kind==='human'){
  const i=s.actors.findIndex(a=>a.id===slot.actorId);
  if(i>=0)s.cursor=i;
 }
}
function closeIfDisengaged(s){
 if(!s.combat)return true;
 if(!threat(s)||!s.combat.actorIds.some(id=>inRange(s,id))){
  s.combat=null;s.combatReaction=null;
  return true;
 }
 return false;
}
function advance(s,nextSeed){
 if(closeIfDisengaged(s))return;
 const end=s.combat.index===s.combat.order.length-1;
 const from=worldSeconds(s);
 const transitioned=advanceAdventureCombatSlot(s.combat,end?{nextSeed:nextSeed(s)}:{});
 if(!transitioned.accepted)throw new Error(transitioned.reason);
 s.combat=transitioned.combat;
 if(end){
  s.clock.combatRounds++;s.clock.combatSeconds+=10;
  s.combatRoundRecords.push({round:s.combatRoundRecords.length+1,seed:s.combat.cardSeed});
  for(let i=0;i<s.actors.length;i++){
   const actor=s.actors[i];
   if(actor.dead)continue;
   const tick=tickMedicalClock(actor,{from,to:from+10,seed:nextSeed(s)});
   s.actors[i]=tick.after??tick.actor??tick.next??actor;
   for(const event of tick.events||[])s.events.push({beat:s.beat,actorId:actor.id,
    category:'danger',message:actor.name+' faces a '+event.kind.replaceAll('_',' ')+'.'});
  }
  if(s.actors.every(a=>a.dead))s.outcome='lost';
 }
 alignCursor(s);
}
function event(s,actorId,message,category='danger'){
 s.events.push({beat:s.beat,actorId,category,message});
 s.events=s.events.slice(-160);
}
export function selectedCombatStep(previous,action,opts,nextSeed,world){
 if(!previous.combat)return reject(previous,'No live combat is in progress.');
 const p=previous.combatReaction,slot=active(previous);
 if(p){
  if(action.kind!=='react'||!['defend','decline'].includes(action.target))
   return reject(previous,'Choose defend or decline against the declared strike.');
  const victim=previous.actors.find(a=>a.id===p.victimId);
  const human=previous.control.mode==='party'||
   (previous.control.mode==='focus'&&previous.control.focusedActorId===p.victimId);
  if((opts.source??'human')!==(human?'human':'ai')||
   (opts.actorId!=null&&opts.actorId!==p.victimId))
   return reject(previous,'Only the threatened defender may resolve this strike.');
  const s=copy(previous),d=threat(s),spec=DINO_SPECIES[d.kind];
  const result=applyCreatureAttack(victim,{seed:p.attackSeed,
   attackerDice:spec.attack,baseDamage:spec.baseDamage,
   defend:action.target==='defend',defenderSeed:p.defenderSeed});
  s.actors[s.actors.findIndex(a=>a.id===victim.id)]=
   enrichInjuries(result.after,worldSeconds(s),p.attackSeed);
  s.combatDamageRecords.push({round:p.round,card:p.card,creatureId:d.id,
   victimId:victim.id,reaction:action.target,damage:result.damage});
  s.combatReaction=null;
  s.actions.push({beat:s.beat,actorId:victim.id,kind:'react',
   target:action.target,damage:result.damage,combatRound:p.round,card:p.card});
  event(s,victim.id,result.damage?
   victim.name+' suffers '+result.damage+' damage after choosing '+action.target+'.':
   victim.name+' survives the predator strike without injury.');
  if(s.actors.every(a=>a.dead))s.outcome='lost';
  if(s.outcome==='playing')advance(s,nextSeed);
  return {accepted:true,state:s,result:{kind:'combat_reaction',damage:result.damage,
   critical:result.critical?.code??null}};
 }
 if(slot?.kind==='dinosaur'){
  if((opts.source??'human')!=='ai'||action.kind!=='predator'||
   (opts.actorId!=null&&opts.actorId!==slot.actorId))
   return reject(previous,'Only the creature controller acts on this initiative card.');
  const s=copy(previous),victim=s.combat.actorIds.map(id=>inRange(s,id)).find(Boolean);
  if(!victim){
   advance(s,nextSeed);
   return {accepted:true,state:s,result:{kind:'predator_no_target'}};
  }
  s.combatReaction={creatureId:slot.actorId,victimId:victim.id,
   card:slot.card,round:s.combat.round,
   attackSeed:nextSeed(s),defenderSeed:nextSeed(s)};
  event(s,victim.id,'A physically nearby predator attacks. Choose defend or decline.');
  return {accepted:true,state:s,awaitingReaction:true,result:{kind:'combat_attack_declared'}};
 }
 if(slot?.kind!=='human')return reject(previous,'No valid active combatant.');
 const actor=previous.actors.find(a=>a.id===slot.actorId);
 const human=previous.control.mode==='party'||
  (previous.control.mode==='focus'&&previous.control.focusedActorId===actor.id);
 if((opts.source??'human')!==(human?'human':'ai')||
  (opts.actorId!=null&&opts.actorId!==actor.id))
  return reject(previous,'The current survivor belongs to another controller.');
 if(actor.dead||actor.broken||!inRange(previous,actor.id)){
  if(!['end','wait'].includes(action.kind))
   return reject(previous,'This survivor cannot perform that action in contact.');
 }
 const kind=action.kind==='wait'?'end':action.kind;
 if(!['move','rush','sneak','take','give','aid','end'].includes(kind))
  return reject(previous,'During combat, move, retreat, sneak, take, give, first aid or end turn.');
 if(['move','rush','sneak'].includes(kind)&&
  (!world.resolveExit(actor.location,action.target)||
   woundModifiers(actor,'mobility').immobile||
   (kind!=='sneak'&&woundModifiers(actor,'mobility').moveFull)))
  return reject(previous,'This move is not physically possible with the available action cost.');
 if(kind==='take'&&!previous.rooms[actor.location].items.includes(action.target))
  return reject(previous,'That object is not physically reachable.');
 if(kind==='give'&&(!actor.inventory.includes(action.target)||
  !previous.actors.some(a=>a.id===action.recipientId&&a.location===actor.location&&a.id!==actor.id)))
  return reject(previous,'Only a real carried item may be passed to a colocated survivor.');
 const patient=previous.actors.find(a=>a.id===action.target);
 if(kind==='aid'&&(!patient||patient.id===actor.id||patient.dead||
  patient.location!==actor.location||(!patient.broken&&!pendingLethal(patient).length)))
  return reject(previous,'First aid needs a real colocated injured survivor.');
 const spent=spendAdventureCombatAction(previous.combat,{actorId:actor.id,kind});
 if(!spent.accepted)return reject(previous,spent.reason);
 const s=copy(previous);s.combat=spent.combat;
 let description=actor.name+' ends their initiative turn.',result={kind};
 const acting=s.actors.find(a=>a.id===actor.id);
 if(['move','rush','sneak'].includes(kind)){
  const dest=world.resolveExit(acting.location,action.target);
  let success=true;
  if(kind==='sneak'){
   const check=resolveSkillCheck(acting,{skill:'mobility',
    context:'stealth_travel',seed:nextSeed(s),push:action.push||0});
   acting.stress=check.after.stress;acting.stressResponses=check.after.stressResponses;
   acting.storyPoints=check.after.storyPoints;success=check.success;
  }
  if(success){acting.location=dest;acting.visitedRooms=[...new Set([...acting.visitedRooms,dest])];}
  description=actor.name+(success?' retreats to '+world.roomName(dest)+'.':
   ' attempts a silent retreat but remains exposed.');
  result={kind,success};
 }else if(kind==='take'){
  s.rooms[acting.location].items.splice(s.rooms[acting.location].items.indexOf(action.target),1);
  acting.inventory.push(action.target);description=actor.name+' retrieves '+world.itemLabel(action.target)+'.';
 }else if(kind==='give'){
  acting.inventory.splice(acting.inventory.indexOf(action.target),1);
  s.actors.find(a=>a.id===action.recipientId).inventory.push(action.target);
  description=actor.name+' transfers a real carried item.';
 }else if(kind==='aid'){
  const target=s.actors.find(a=>a.id===action.target);
  const cure=resolveClinicalAid(acting,target,{seed:nextSeed(s),time:worldSeconds(s),
   medicalGear:acting.gear?.some(i=>['medical bag','first aid pouch','first aid kit'].includes(i))});
  if(!cure.accepted)return reject(previous,cure.reason);
  s.actors[s.actors.findIndex(a=>a.id===acting.id)]=cure.medicAfter;
  s.actors[s.actors.findIndex(a=>a.id===target.id)]=cure.patient;
  description=actor.name+(cure.success?' stabilizes ':' fails to stabilize ')+target.name+'.';
  result={kind,success:cure.success};
 }
 s.actions.push({beat:s.beat,actorId:actor.id,kind,target:action.target,
  combatRound:s.combat.round,card:slot.card,...('success'in result?{success:result.success}:{})});
 s.actions=s.actions.slice(-200);
 event(s,actor.id,description,'action');
 const b=s.combat.budgets[actor.id];
 if(kind==='end'||b.quickSpent===2||(b.fullSpent===1&&b.quickSpent===1)||
   closeIfDisengaged(s))advance(s,nextSeed);
 return {accepted:true,state:s,result};
}
