// 009-B2b2c2b — opening-contact encounter for seeded, physically located predators.
// Does not represent a full ongoing 10-second combat round yet. The Evolved
// passive detection, numbered initiative, dodge and creature attack rolls are
// borrowed from the already accepted source-authoritative mechanics.
import {validateCompiledAdventure} from './adventure-definition.mjs';
import {detectCreature,rollInitiative,applyCreatureAttack,DINO_SPECIES}
 from './evolved-encounters.mjs';
import {enrichInjuries} from './evolved-injuries.mjs';

const copy=x=>JSON.parse(JSON.stringify(x));
const uint=x=>Number.isSafeInteger(x)&&x>=0&&x<=0xffffffff;
function existing(compiled){
 if(!validateCompiledAdventure(compiled))throw new RangeError('Validated adventure required.');
 return compiled.definition.initialCreatures.filter(d=>
  ['evolved_contact','evolved_reaction'].includes(d.threat?.protocol)&&
  (!d.when||compiled.hiddenFacts[d.when.slot]?.id===d.when.choice));
}
export function localPredator(compiled,state,actorId){
 const defs=existing(compiled);
 const actor=state.actors?.find(a=>a.id===actorId);
 if(!actor||actor.dead||actor.broken||state.outcome!=='playing')return null;
 const predator=state.dinosaurs.find(d=>d.location===actor.location&&
  d.disposition==='predatory'&&!d.defeated&&defs.some(t=>t.id===d.id));
 return predator||null;
}
export function validPredatorContacts(compiled,state){
 const defs=existing(compiled),records=state?.predatorContacts;
 if(records===undefined)return defs.length===0; // No untracked rev6 predator strikes.
 if(!Array.isArray(records)||records.length>2000)return false;
 const seen=new Set();let prev=-1;
 return records.every(r=>{
  const d=defs.find(x=>x.id===r?.creatureId);
  const key=r?.actorId+':'+r?.beat;
  const witnessed=state.creatureRecords?.filter(e=>
   e.id===r.creatureId&&e.beat<=r.beat).at(-1);
  const physicalRoom=witnessed?.to??d?.location;
  const actor=state.actors?.find(a=>a.id===r?.actorId);
  if(!d||seen.has(key)||!actor||
   r.room!==physicalRoom||
   (r.beat===state.beat&&actor.location!==r.room)||
   (!state.actions?.some(a=>a.actorId===r.actorId&&a.beat===r.beat-1)&&
    r.beat-1>=(state.actions?.[0]?.beat??0))||
   !Number.isSafeInteger(r.beat)||r.beat<1||r.beat>state.beat||r.beat<prev||
   !compiled.definition.rooms[r.room]||
   !['human_spots_first','creature_sees_first','simultaneous','human_sees_first'].includes(r.awareness)||
   typeof r.predatorFirst!=='boolean'||typeof r.attack!=='boolean'||
   !Number.isInteger(r.damage)||r.damage<0||r.damage>11||
   (r.attack===false&&r.damage!==0)||
   r.surprised!==(r.awareness==='creature_sees_first')||
   r.attack!==((r.surprised||r.awareness==='simultaneous')&&r.predatorFirst))
   return false;
  seen.add(key);prev=r.beat;return true;
 });
}
export function resolvePredatorContact(compiled,previous,
 {actorId,observationSeed,initiativeSeed,attackSeed,dodgeSeed,time=0,deferDefense=false}={}){
 const beast=localPredator(compiled,previous,actorId);
 const reject=reason=>({accepted:false,state:previous,reason});
 if(!beast)return reject('No physically colocated living predator has been encountered.');
 if(![observationSeed,initiativeSeed,attackSeed,dodgeSeed].every(uint))
  return reject('Evolved detection and reaction require seeded mechanical rolls.');
 const actor=previous.actors.find(a=>a.id===actorId);
 const stats=DINO_SPECIES[beast.kind];
 if(!stats)return reject('This predator has no source-supported Evolved profile.');
 // Consequences happen after the survivor's committed exploration action.
 const beat=previous.beat;
 if((previous.predatorContacts||[]).some(r=>r.beat===beat&&r.actorId===actorId))
  return reject('Contact already resolved for this actor and action.');
 const detection=detectCreature(actor,{seed:observationSeed,
  observationDice:stats.observation,cluttered:true});
 const localActors=previous.actors.filter(a=>
  a.location===actor.location&&!a.dead&&!a.broken).map(a=>a.id);
 const order=rollInitiative({actorIds:localActors,
  dinosaurTurns:stats.speed,seed:initiativeSeed});
 const first=order.find(x=>x.kind==='dinosaur'||x.actorId===actorId);
 const predatorFirst=first?.kind==='dinosaur';
 const surprised=detection.outcome==='creature_sees_first';
 // If people see the threat first, they are never automatically attacked as
 // a cinematic beat. Even after discovery, an actual initiative advantage
 // and a source Evolved attack roll are required for a strike.
 const attack=(surprised||detection.outcome==='simultaneous')&&predatorFirst;
 if(attack&&deferDefense){
  return {accepted:true,actorAfter:copy(actor),strike:null,
   pending:{victimId:actorId,creatureId:beast.id,room:actor.location,
    beat,awareness:detection.outcome,predatorFirst,surprised,attack:true,
    attackSeed,dodgeSeed},record:null,detection,initiative:order,
   result:{kind:'predator_contact',creatureId:beast.id,
    awareness:detection.outcome,attackPending:true,damage:0}};
 }
 let strike=null,after=copy(actor);
 if(attack){
  strike=applyCreatureAttack(actor,{seed:attackSeed,
   attackerDice:stats.attack,baseDamage:stats.baseDamage,
   dodge:true,defenderSeed:dodgeSeed});
  after=enrichInjuries(strike.after,time,attackSeed);
  if(strike.evade){
   after.stress=strike.evade.after.stress;
   after.stressResponses=strike.evade.after.stressResponses;
  }
 }
 const record={creatureId:beast.id,actorId,room:actor.location,
  beat,awareness:detection.outcome,predatorFirst,surprised,
  attack,damage:strike?.damage??0,
  ...(strike?.critical?{critical: strike.critical.code}:{})};
 return {accepted:true,actorAfter:after,record,strike,detection,initiative:order,
  result:{kind:'predator_contact',creatureId:beast.id,
   awareness:detection.outcome,attack,damage:record.damage,
   critical:record.critical??null}};
}

// Resolve a saved voluntary reaction without rolling a second surprise or
// substituting a new creature. No action can be taken while it is pending.
export function resolveDeferredPredatorContact(compiled,state,choice,{time=0}={}){
 const reject=reason=>({accepted:false,state,reason});
 const p=state?.pendingPredatorResponse;
 if(!p||!['defend','decline'].includes(choice)||
    !Number.isSafeInteger(p.beat)||p.beat!==state.beat||
    !existing(compiled).some(d=>d.id===p.creatureId&&
      d.threat?.protocol==='evolved_reaction')||
    !localPredator(compiled,state,p.victimId)||
    !state.dinosaurs.some(d=>d.id===p.creatureId&&d.location===p.room)||
    ![p.attackSeed,p.dodgeSeed].every(uint))
  return reject('No eligible, physically grounded predator defense is pending.');
 const victim=state.actors.find(a=>a.id===p.victimId);
 const beast=state.dinosaurs.find(d=>d.id===p.creatureId);
 const stats=DINO_SPECIES[beast.kind];
 if(!stats)return reject('No supported Evolved creature attack profile.');
 const strike=applyCreatureAttack(victim,{seed:p.attackSeed,
  attackerDice:stats.attack,baseDamage:stats.baseDamage,
  defend:choice==='defend',defenderSeed:p.dodgeSeed});
 const after=enrichInjuries(strike.after,time,p.attackSeed);
 if(strike.evade){
  after.stress=strike.evade.after.stress;
  after.stressResponses=strike.evade.after.stressResponses;
 }
 const record={creatureId:p.creatureId,actorId:p.victimId,room:p.room,
  beat:p.beat,awareness:p.awareness,predatorFirst:p.predatorFirst,
  surprised:p.surprised,attack:true,damage:strike.damage,reaction:choice,
  ...(strike.critical?{critical:strike.critical.code}:{})};
 return {accepted:true,actorAfter:after,strike,record,
  result:{kind:'predator_contact',creatureId:p.creatureId,attack:true,
   reaction:choice,damage:strike.damage,critical:record.critical??null}};
}
export function validPendingPredatorResponse(compiled,state){
 const p=state?.pendingPredatorResponse;
 if(p===undefined||p===null)return true;
 if(!existing(compiled).some(d=>d.id===p.creatureId&&
    d.threat?.protocol==='evolved_reaction'))return false;
 const victim=state.actors?.find(a=>a.id===p.victimId);
 if(!victim||victim.dead||victim.broken||victim.location!==p.room||
    !state.dinosaurs?.some(d=>d.id===p.creatureId&&!d.defeated&&d.location===p.room)||
    p.beat!==state.beat||!Number.isSafeInteger(p.beat)||
    p.awareness!=='creature_sees_first'&&p.awareness!=='simultaneous'||
    p.predatorFirst!==true||p.attack!==true||
    p.surprised!==(p.awareness==='creature_sees_first')||
    ![p.attackSeed,p.dodgeSeed].every(uint)||
    state.predatorContacts?.some(r=>r.actorId===p.victimId&&r.beat===p.beat))
  return false;
 return true;
}
