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
  d.threat?.protocol==='evolved_contact'&&
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
  if(!d||seen.has(key)||!state.actors?.some(a=>a.id===r.actorId)||
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
 {actorId,observationSeed,initiativeSeed,attackSeed,dodgeSeed,time=0}={}){
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
