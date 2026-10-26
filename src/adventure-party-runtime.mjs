// 009-B2b1: selected-adventure exploration runtime behind the existing Party API.
// Purely manifest-driven room graph, stock and objective rules. The existing
// Evolved Nublar director/combat remains on its original compatibility path.
import {compileSelectedAdventure} from './adventure-catalog.mjs?v=009b2b2c2b';
import {createAdventureWorld} from './adventure-world.mjs';
import {adventureBinding,validAdventureBinding,compileAdventure} from './adventure-definition.mjs?v=009b2b2c2b';
import {RIDGE_SURVEY_REV1} from '../adventures/ridge-survey-rev1.mjs';
import {RIDGE_SURVEY_REV2} from '../adventures/ridge-survey-rev2.mjs';
import {RIDGE_SURVEY_REV3} from '../adventures/ridge-survey-rev3.mjs';
import {RIDGE_SURVEY_REV4} from '../adventures/ridge-survey-rev4.mjs';
import {RIDGE_SURVEY_REV5} from '../adventures/ridge-survey-rev5.mjs';
import {RIDGE_SURVEY_REV6} from '../adventures/ridge-survey-rev6.mjs';
import {localPredator,validPredatorContacts,resolvePredatorContact,
 resolveDeferredPredatorContact,validPendingPredatorResponse}
 from './adventure-predator-contact.mjs';
import {initialAdventureCreatures,validateCreatureContinuity,
 advanceAutonomousCreatures} from './adventure-creatures.mjs';
import {availablePhysicalPerils,validPerilRecords,
 resolvePhysicalPeril} from './adventure-perils.mjs';
import {cinematicAct,availableCinematicEvents,validCinematicRecords,
 commitCinematicEvent} from './adventure-cinematic.mjs';
import {commitAuthorizedObjective,validObjectiveRecords,objectiveStatus} from './adventure-objectives.mjs';
import {makeParty,validateParty} from './characters.mjs';
import {resolveSkillCheck} from './evolved-checks.mjs';
import {resolveClinicalAid,resolveRally,pendingLethal} from './evolved-injuries.mjs';
import {passageCircumstance,objectiveCircumstance,
 animalApproachCircumstance,localSituationCues} from './adventure-situations.mjs';

const copy=x=>JSON.parse(JSON.stringify(x));
const compiled=compileSelectedAdventure('ridge-survey',0);
const world=createAdventureWorld(compiled);
const template=compiled.definition;
// Legacy saves remain valid: the earlier prototype used a fixed compiled
// scenario, while its previously-unused latent variants were never revealed.
// The incident's original seed now determines its stable private situation.
const situated=s=>s.adventureBinding?.revision===1?
 compileAdventure(RIDGE_SURVEY_REV1,{seed:s.initialSeed}):
 s.adventureBinding?.revision===2?
 compileAdventure(RIDGE_SURVEY_REV2,{seed:s.initialSeed}):
 s.adventureBinding?.revision===3?
 compileAdventure(RIDGE_SURVEY_REV3,{seed:s.initialSeed}):
 s.adventureBinding?.revision===4?
 compileAdventure(RIDGE_SURVEY_REV4,{seed:s.initialSeed}):
 s.adventureBinding?.revision===5?
 compileAdventure(RIDGE_SURVEY_REV5,{seed:s.initialSeed}):
 s.adventureBinding?.revision===6?
 compileAdventure(RIDGE_SURVEY_REV6,{seed:s.initialSeed}):
 compileSelectedAdventure(template.id,s.initialSeed);
const integers=x=>Number.isSafeInteger(x)&&x>=0;
function nextSeed(s){
 let x=s.rng>>>0;
 x^=(x<<13)>>>0;x^=x>>>17;x^=(x<<5)>>>0;
 s.rng=x>>>0;return s.rng;
}
function reject(s,reason){return {accepted:false,state:s,reason};}
function countInventory(s){
 const counts={};
 for(const item of [
  ...Object.values(s.rooms).flatMap(r=>r.items),
  ...s.actors.flatMap(a=>a.inventory)])counts[item]=(counts[item]||0)+1;
 return counts;
}
function originalStock(){
 const counts={};
 for(const item of [...template.startItems,...Object.values(template.rooms).flatMap(r=>r.items)])
  counts[item]=(counts[item]||0)+1;
 return counts;
}
const stock=originalStock();
export function isSelectedAdventureSave(s){
 try{
  if(!s||s.kind!=='dinosaur-party-incident'||s.version!==3||
     s.scenario!==template.id||!s.adventureBinding||
     !validAdventureBinding(s.adventureBinding,situated(s))||
     !integers(s.beat)||!integers(s.initialSeed)||
     !Number.isInteger(s.rng)||!integers(s.cursor)||!integers(s.round)||
     !Array.isArray(s.actors)||!s.actors.length||s.actors.length>8||
     s.cursor>=s.actors.length||!Array.isArray(s.startingRoster)||
     validateParty(s.actors).length||validateParty(s.startingRoster).length||
     s.startingRoster.length!==s.actors.length||
     !['playing','rescued','lost'].includes(s.outcome)||
     !s.control||!['party','focus','spectator'].includes(s.control.mode)||
     !['follow','actor'].includes(s.control.cameraMode)||
     typeof s.control.paused!=='boolean'||!integers(s.control.epoch)||
     ![400,800,1200,2000].includes(s.control.speedMs)||
     !s.actors.some(a=>a.id===s.control.focusedActorId)||
     !s.actors.some(a=>a.id===s.control.cameraActorId)||
     !Array.isArray(s.controlHistory)||!Array.isArray(s.aiDecisions)||
     s.combat!==null||!Array.isArray(s.actions)||!Array.isArray(s.events)||
     !Array.isArray(s.dinosaurs)||
     !validateCreatureContinuity(situated(s),s)||
     !validPredatorContacts(situated(s),s)||
     !validPendingPredatorResponse(situated(s),s)||
     !s.clock||!integers(s.clock.explorationActions)||!integers(s.clock.explorationStretches)||
     !integers(s.clock.combatRounds)||!integers(s.clock.combatSeconds)||
     (s.adventureBinding.revision<7?
      (s.clock.combatRounds!==0||s.clock.combatSeconds!==0):
      (s.clock.combatSeconds!==s.clock.combatRounds*10||
       s.clock.combatRounds!==s.predatorContacts.filter(r=>r.reaction).length))||
     !s.rooms||Object.keys(s.rooms).sort().join('|')!==Object.keys(template.rooms).sort().join('|')||
     !s.flags||Object.keys(s.flags).sort().join('|')!==Object.keys(template.flags).sort().join('|')||
     Object.values(s.flags).some(v=>typeof v!=='boolean')||
     s.actors.some(a=>!world.hasRoom(a.location)||
       !Array.isArray(a.visitedRooms)||a.visitedRooms.some(r=>!world.hasRoom(r))||
       !Array.isArray(a.inventory)||!Array.isArray(a.observed)||
       !integers(a.stress)||a.stress>30||!integers(a.health)||a.health>a.healthMax||
       typeof a.dead!=='boolean'||typeof a.broken!=='boolean')||
     Object.values(s.rooms).some(r=>!Array.isArray(r?.items))||
     Object.keys(countInventory(s)).some(id=>!Object.hasOwn(stock,id))||
     JSON.stringify(countInventory(s),Object.keys(stock).sort())!==
       JSON.stringify(stock,Object.keys(stock).sort())||
     !validObjectiveRecords(situated(s),s)||
     !validCinematicRecords(situated(s),s)||
     !validPerilRecords(situated(s),s)||
     (s.outcome==='rescued')!==(s.adventureOutcome==='completed')||
     s.dinosaurs.some((d,i)=>{
       const original=situated(s).definition.initialCreatures.find(x=>x.id===d.id);
       if(!original)return true;
       const response=animalApproachCircumstance(situated(s),d.id,original.location);
       const fled=response&&response.to===d.location&&s.actions.some(a=>
         a.kind==='wildlife'&&a.target==='approach'&&a.success===false);
       return d.id!==original.id||d.kind!==original.species||
         d.disposition!==original.disposition||d.defeated!==false||
         !world.hasRoom(d.location)||(d.location!==original.location&&!fled&&!original.patrol);
     }))return false;
  return true;
 }catch{return false;}
}
export function newSelectedAdventureIncident({seed=1993,roster=null}={}){
 if(!integers(seed)||seed>0xffffffff)throw new RangeError('Seed must be a uint32.');
 const party=roster??makeParty({seed,size:3});
 const errors=validateParty(party);
 if(errors.length||party.length<1||party.length>8)
  throw new RangeError(errors.join(' ')||'Party must have 1–8 survivors.');
 const actors=copy(party).map(a=>({...a,health:a.healthMax,location:world.start,
  inventory:[],visitedRooms:[world.start],observed:[],attemptedObservations:[],
  stress:a.stress??0,stressResponses:a.stressResponses||[],broken:false,dead:false,
  criticalInjuries:[],hidden:false,coverId:null,pendingSkip:false,
  light:{on:false,charge:0}}));
 actors[0].inventory.push(...world.startItems);
 return {kind:'dinosaur-party-incident',version:3,scenario:template.id,
  adventureBinding:adventureBinding(compiled),initialSeed:seed,
  rng:seed||0x9e3779b9,beat:0,round:1,cursor:0,outcome:'playing',
  clock:{explorationActions:0,explorationStretches:0,combatRounds:0,combatSeconds:0},
  startingRoster:copy(party),actors,flags:copy(template.flags),
  control:{mode:'party',focusedActorId:actors[0].id,cameraMode:'follow',
   cameraActorId:actors[0].id,paused:true,speedMs:1200,epoch:0},
  controlHistory:[],aiDecisions:[],combat:null,objectiveRecords:[],cinematicRecords:[],perilRecords:[],creatureRecords:[],predatorContacts:[],pendingPredatorResponse:null,
  rooms:world.initialRoomItems(),
  dinosaurs:initialAdventureCreatures(compileSelectedAdventure(template.id,seed)),
  events:[{beat:0,actorId:null,category:'system',message:
   'The research party gathers at the canvas camp to begin its ecological survey.'}],
  actions:[]};
}
function nextObjective(s){
 return template.objectives.find(o=>!objectiveStatus(situated(s),s).completedIds.includes(o.id));
}
export function selectedAdventureView(s,{actorId=null}={}){
 if(!isSelectedAdventureSave(s))throw new RangeError('Invalid selected adventure save.');
 const actor=s.actors.find(a=>a.id===actorId)||s.actors[s.cursor];
 const room=world.room(actor.location);
 const progress=objectiveStatus(situated(s),s);
 const goal=nextObjective(s);
 const creatures=s.dinosaurs.filter(d=>d.location===actor.location&&!d.defeated);
 const grazers=creatures.filter(d=>d.disposition!=='predatory');
 return {
  adventureId:template.id,adventureTitle:template.title,
  objectivePlan:goal?[{id:goal.id,room:goal.room,
   target:goal.interaction?.target||null,description:goal.description}]:[],
  objectives:template.objectives.map(o=>({id:o.id,description:o.description,
   done:progress.completedIds.includes(o.id)})),
  beat:s.beat,round:s.round,outcome:s.outcome,actorId:actor.id,actorName:actor.name,
  time:{explorationStretches:s.clock.explorationStretches,
   minutes:s.clock.explorationStretches*10,combatRounds:0,combatSeconds:0,combatRoundSeconds:10},
  controlMode:s.control.mode,focusedActorId:s.control.focusedActorId,
  cameraMode:s.control.cameraMode,paused:s.control.paused,
  activeActorId:s.actors[s.cursor].id,combat:null,
  location:actor.location,roomName:room.name,description:room.description,
  weather:null,serviceShutterClosed:false,cinematicScene:null,
  cinematicAct:cinematicAct(situated(s),s),
  availableDangerEvents:availablePhysicalPerils(situated(s),s,actor.id),
  sceneConsequences:s.adventureBinding.revision===1?[]:
   localSituationCues(situated(s),actor.location),
  preparedGenerator:false,
  wildlifeEncounter:grazers.length?{title:grazers.map(d=>d.kind).join(', '),
   description:'A physically present animal can be watched without provoking it.',
   choices:[{id:'watch',label:'Observe from a respectful distance'},
    ...(s.adventureBinding.revision===1?[]:[
     {id:'approach',label:'Approach slowly and read the animal’s behavior (Survival if wary)'}])]}:null,
  dialogueOpportunities:[],parkGuide:null,rescueEnding:null,
  localPaddockGateBraced:false,
  availableSceneEvents:availableCinematicEvents(situated(s),s,actor.id),
  encounterPressure:null,
  lighting:'natural ambient light',batterySupplies:{carried:0},batteryActions:[],
  personalLight:{carried:false,on:false,charge:0},cover:null,availableCover:[],
  distantSightings:[],groupTravel:null,
  exits:room.exits.map(id=>({id,name:world.roomName(id),blocked:false})),
  items:s.rooms[actor.location].items.map(id=>({id,name:world.itemLabel(id)})),
  features:template.objectives.filter(o=>o.room===actor.location&&o.interaction&&
   !progress.completedIds.includes(o.id)).map(o=>o.interaction.target),
  observations:[],wonder:null,wonderJournal:[],
  visibleDinosaurs:creatures.filter(d=>d.disposition==='predatory')
   .map(d=>({id:d.id,kind:d.kind,location:actor.location})),
  inventory:actor.inventory.map(id=>({id,name:world.itemLabel(id)})),
  health:actor.health,healthMax:actor.healthMax,stress:actor.stress,
  injuries:actor.criticalInjuries||[],
  medicalUrgency:pendingLethal(actor).map(w=>({code:w.code,deadline:w.deadline,nextDeathAt:w.nextDeathAt})),
  broken:actor.broken,dead:actor.dead,panicState:null,hidden:false,
  flags:copy(s.flags),
  actors:s.actors.map(a=>({id:a.id,name:a.name,career:a.career,
    location:a.location,roomName:world.roomName(a.location),
    stress:a.stress,health:a.health,active:a.id===s.actors[s.cursor].id})),
  events:s.events.filter(e=>e.actorId===null||e.actorId===actor.id).slice(-40)
 };
}
function normalize(raw,parser){
 let a=parser(raw);
 if(a.kind==='group'){
  const [style,...parts]=a.target.split('|');
  if(!['quiet','normal','noisy'].includes(style)||!parts.length)return {kind:'invalid'};
  a={...a,kind:style==='quiet'?'sneak':style==='noisy'?'rush':'move',
   target:parts.join('|'),groupApproach:style};
 }
 return a;
}
export function selectedAdventureStep(previous,raw,opts={},parser){
 if(!isSelectedAdventureSave(previous))throw new RangeError('Invalid selected adventure save.');
 if(previous.pendingPredatorResponse){
  const pending=previous.pendingPredatorResponse;
  const victim=previous.actors.find(a=>a.id===pending.victimId);
  const human=previous.control.mode==='party'||
   (previous.control.mode==='focus'&&previous.control.focusedActorId===victim.id);
  if(opts.actorId!=null&&opts.actorId!==victim.id)
   return reject(previous,'Only the threatened survivor may defend.');
  if((opts.source??'human')!==(human?'human':'ai'))
   return reject(previous,'The defender is owned by another controller.');
  const defensiveAction=normalize(raw,parser);
  if(defensiveAction.kind!=='react'||!['defend','decline'].includes(defensiveAction.target))
   return reject(previous,'Resolve the incoming strike first: defend or decline.');
  const resolved=resolveDeferredPredatorContact(situated(previous),previous,defensiveAction.target,
   {time:previous.clock.explorationStretches*600+previous.clock.combatSeconds});
  if(!resolved.accepted)return reject(previous,resolved.reason);
  const s=copy(previous);
  s.actors[s.actors.findIndex(a=>a.id===victim.id)]=resolved.actorAfter;
  s.pendingPredatorResponse=null;
  s.predatorContacts.push(resolved.record);
  s.clock.combatRounds++;s.clock.combatSeconds+=10;
  s.actions.push({beat:s.beat,actorId:victim.id,kind:'react',
   target:defensiveAction.target,damage:resolved.record.damage});
  s.actions=s.actions.slice(-200);
  s.events.push({beat:s.beat,actorId:victim.id,category:'danger',
   message:resolved.strike.damage?
    victim.name+' attempts '+defensiveAction.target+' and suffers '+resolved.strike.damage+' damage.':
    victim.name+' '+(defensiveAction.target==='defend'?'defends against':'declines to defend against')+
     ' the Velociraptor and escapes injury.'});
  s.events=s.events.slice(-160);
  if(s.actors.every(a=>a.dead))s.outcome='lost';
  if(!isSelectedAdventureSave(s))throw new Error('Defensive reaction failed state validation.');
  return {accepted:true,state:s,result:resolved.result};
 }
 const active=previous.actors[previous.cursor];
 const human=previous.control.mode==='party'||
  (previous.control.mode==='focus'&&previous.control.focusedActorId===active.id);
 if(opts.actorId!=null&&opts.actorId!==active.id)return reject(previous,'It is '+active.name+"'s turn.");
 if((opts.source??'human')!==(human?'human':'ai'))return reject(previous,'Control owner mismatch.');
 if(previous.outcome!=='playing')return reject(previous,'The adventure has concluded.');
 const action=normalize(raw,parser);
 if(action.kind==='scene'){
  const result=commitCinematicEvent(situated(previous),previous,
   {actorId:active.id,eventId:action.target});
  if(!result.accepted)return result;
  if(!isSelectedAdventureSave(result.state))throw new Error('Invalid scene commit.');
  return result;
 }
 if(action.kind==='look')return reject(previous,'Inspection is free; no turn was spent.');
 if(!['move','sneak','rush','wait','take','give','use','wildlife','danger','aid','rally'].includes(action.kind))
  return reject(previous,'This adventure currently supports travel, survey interactions, observation, items and waiting.');
 if(active.dead||active.broken)return reject(previous,'This survivor cannot act.');
 let s=copy(previous),actor=s.actors[s.cursor],rolled=null;
 let result={},description='',noise=0;
 const at=actor.location,instance=situated(s);
 let perilDamage=null;
 if(action.kind==='danger'){
  const resolved=resolvePhysicalPeril(instance,s,{actorId:actor.id,
   perilId:action.target,skillSeed:nextSeed(s),attackSeed:nextSeed(s),
   push:action.push||0,time:s.clock.explorationStretches*600});
  if(!resolved.accepted)return reject(previous,resolved.reason);
  // All authoritative modifications come from the existing Evolved resolver.
  rolled=resolved.check;
  const index=s.actors.findIndex(a=>a.id===actor.id);
  s.actors[index]=resolved.actorAfter;actor=s.actors[index];
  s.perilRecords??=[];s.perilRecords.push(resolved.record);
  perilDamage=resolved.record.damage;result=resolved.result;
  description=actor.name+' risks crossing close to the animal. '+
   (resolved.check.success?'They keep their distance.':
    resolved.strike.damage?
     'The startled dinosaur strikes for '+resolved.strike.damage+' damage.':
     'The animal lashes out but does not injure them.');
 }else if(action.kind==='aid'||action.kind==='rally'){
  const patient=s.actors.find(a=>a.id===action.target);
  if(!patient||patient.dead||patient.location!==actor.location||
     patient.id===actor.id||(!patient.broken&&!pendingLethal(patient).length))
   return reject(previous,'A living, injured, colocated teammate is required.');
  const seed=nextSeed(s);
  const cure=action.kind==='aid'?
   resolveClinicalAid(actor,patient,{seed,time:s.clock.explorationStretches*600,
    medicalGear:actor.gear?.some(i=>['medical bag','first aid pouch','first aid kit'].includes(i))}):
   resolveRally(actor,patient,{seed});
  if(!cure.accepted)return reject(previous,cure.reason);
  rolled=cure.roll;
  const actorIndex=s.actors.findIndex(a=>a.id===actor.id);
  const patientIndex=s.actors.findIndex(a=>a.id===patient.id);
  s.actors[actorIndex]=cure.medicAfter||cure.commanderAfter;
  s.actors[patientIndex]=cure.patient;
  actor=s.actors[actorIndex];
  result={kind:action.kind,success:cure.success,patientId:patient.id};
  description=actor.name+' attempts '+(action.kind==='aid'?'first aid':'a Command rally')+
   ' for '+patient.name+(cure.success?', and the attempt succeeds.':', without immediate recovery.');
 }else if(['move','sneak','rush'].includes(action.kind)){
  const dest=world.resolveExit(at,action.target);
  if(!dest)return reject(previous,'Destination is not physically adjacent.');
  const passage=passageCircumstance(instance,at,dest);
  if(passage||action.kind==='sneak'){
   rolled=resolveSkillCheck(actor,{skill:passage?.skill||'mobility',
    context:action.kind==='sneak'?'stealth_travel':'terrain_crossing',
    modifier:passage?.modifier??0,
    seed:nextSeed(s),push:action.push||0});
   actor.stress=rolled.after.stress;actor.stressResponses=rolled.after.stressResponses;
   actor.storyPoints=rolled.after.storyPoints;
  }
  if(passage&& !rolled.success){
   description=actor.name+' tries to cross the hazardous ford, but must withdraw to '+
    world.roomName(at)+'. No distance is gained.';
   result={challenge:'passage',success:false};
  }else{
   actor.location=dest;actor.visitedRooms=[...new Set([...actor.visitedRooms,dest])];
   description=actor.name+' travels to '+world.roomName(dest)+'.';
   if(action.groupApproach)description+=' The others must move on their own turns.';
   if(passage)result={challenge:'passage',success:true};
  }
 }else if(action.kind==='wait')description=actor.name+' waits and observes the research camp.';
 else if(action.kind==='take'){
  const item=s.rooms[at].items.find(id=>id===action.target||
   world.itemLabel(id).toLowerCase()===String(action.target).toLowerCase());
  if(!item)return reject(previous,'That item is not physically here.');
  s.rooms[at].items.splice(s.rooms[at].items.indexOf(item),1);actor.inventory.push(item);
  description=actor.name+' takes '+world.itemLabel(item)+'.';
 }else if(action.kind==='give'){
  const other=s.actors.find(a=>a.id===action.recipientId&&a.location===at&&a.id!==actor.id);
  const item=actor.inventory.find(id=>id===action.target||
   world.itemLabel(id).toLowerCase()===String(action.target).toLowerCase());
  if(!other||!item)return reject(previous,'A carried item and colocated recipient are required.');
  actor.inventory.splice(actor.inventory.indexOf(item),1);other.inventory.push(item);
  description=actor.name+' hands '+world.itemLabel(item)+' to '+other.name+'.';
 }else if(action.kind==='wildlife'){
  const animal=s.dinosaurs.find(d=>d.location===at&&!d.defeated&&d.disposition!=='predatory');
  if(!['watch',...(s.adventureBinding.revision===1?[]:['approach'])].includes(action.target)||!animal)
   return reject(previous,'There is no physically present animal offering that encounter.');
  if(action.target==='watch'){
   description=actor.name+' quietly observes the animal without forcing a confrontation.';
  }else{
   const response=animalApproachCircumstance(instance,animal.id,at);
   if(response){
    rolled=resolveSkillCheck(actor,{skill:response.skill,context:'wildlife_approach',
     modifier:response.modifier,seed:nextSeed(s),push:action.push||0});
    actor.stress=rolled.after.stress;actor.stressResponses=rolled.after.stressResponses;
    actor.storyPoints=rolled.after.storyPoints;
    if(!rolled.success){
     // The animal uses a real authored adjacent exit. No attack is implied.
     animal.location=response.to;
     description=actor.name+' approaches too closely; the alarmed dinosaur retreats toward '+
      world.roomName(response.to)+'. No attack occurs.';
    }else description=actor.name+' reads the animal’s warning signs and maintains a safe distance.';
    result={challenge:'animal_approach',success:rolled.success};
   }else{
    description=actor.name+' approaches slowly; the grazing dinosaur remains undisturbed.';
    result={challenge:'animal_approach',success:true};
   }
  }
 }else if(action.kind==='use'){
  const objective=template.objectives.find(o=>o.interaction&&o.room===at&&
   o.interaction.target.toLowerCase()===String(action.target).toLowerCase());
  if(!objective)return reject(previous,'No authored interaction by that name exists here.');
  const progress=objectiveStatus(situated(s),s);
  if(progress.completedIds.includes(objective.id))return reject(previous,'Already completed.');
  if(objective.requires.some(id=>!progress.completedIds.includes(id)))
   return reject(previous,'Complete the preceding objective first.');
  if(objective.interaction.skill!==null){
   const complication=objectiveCircumstance(instance,objective.id);
   rolled=resolveSkillCheck(actor,{skill:objective.interaction.skill,
    modifier:complication?.modifier??0,
    seed:nextSeed(s),push:action.push||0});
   actor.stress=rolled.after.stress;actor.stressResponses=rolled.after.stressResponses;
   actor.storyPoints=rolled.after.storyPoints;
  }
  if(rolled===null||rolled.success){
   const outcome=commitAuthorizedObjective(instance,s,{objectiveId:objective.id,
    actorId:actor.id,authorization:{kind:'engine-committed-rule',success:true}});
   if(!outcome.accepted)throw new Error('Approved interaction did not match objective contract: '+outcome.reason);
   s.flags=outcome.state.flags;s.objectiveRecords=outcome.state.objectiveRecords;
   if(outcome.state.adventureOutcome){
    s.adventureOutcome=outcome.state.adventureOutcome;
    s.outcome=s.adventureOutcome==='completed'?'rescued':'lost';
   }
   description=actor.name+' completes '+objective.description;
  }else description=actor.name+' attempts '+objective.description+' but does not succeed.';
  result={objectiveId:objective.id,success:rolled?.success??true};
 }
 s.actions.push({beat:s.beat,actorId:actor.id,kind:action.kind,target:action.target,
  ...(rolled?{success:rolled.success,skill:rolled.skill}: {}),
  ...(perilDamage!==null?{damage:perilDamage}: {})});
 s.actions=s.actions.slice(-200);
 s.events.push({beat:s.beat,actorId:actor.id,category:action.kind==='wildlife'?'wonder':
  s.outcome!=='playing'?'milestone':'action',message:description});
 s.events=s.events.slice(-160);
 s.beat++;s.cursor=(s.cursor+1)%s.actors.length;
 if(s.cursor===0)s.round++;
 s.clock.explorationActions++;s.clock.explorationStretches=
  Math.floor(s.clock.explorationActions/s.actors.length);
 if(situated(s).definition.initialCreatures.some(d=>d.patrol))
  s=advanceAutonomousCreatures(situated(s),s);
 // An opening source Evolved contact is possible only after a committed action.
 // The immutable Rev1–5 manifests cannot trigger this new hostile procedure.
 const predator=localPredator(situated(s),s,actor.id);
 if(predator&&s.outcome==='playing'){
  const contact=resolvePredatorContact(situated(s),s,{actorId:actor.id,
   observationSeed:nextSeed(s),initiativeSeed:nextSeed(s),
   attackSeed:nextSeed(s),dodgeSeed:nextSeed(s),
   time:s.clock.explorationStretches*600,
   deferDefense:s.adventureBinding.revision>=7});
  if(!contact.accepted)throw new Error('Predator contact failed: '+contact.reason);
  s.actors[s.actors.findIndex(a=>a.id===actor.id)]=contact.actorAfter;
  s.predatorContacts??=[];
  if(contact.pending)s.pendingPredatorResponse=contact.pending;
  else s.predatorContacts.push(contact.record);
  s.events.push({beat:s.beat,actorId:actor.id,category:'danger',
   message:contact.pending?
    'The Velociraptor strikes first. '+actor.name+' must choose a defense.':
    contact.strike?
    (contact.strike.damage?
     'A colocated Velociraptor strikes for '+contact.strike.damage+' damage.':
     'A Velociraptor tries to strike, but a defensive reaction prevents injury.'):
    'A physically nearby Velociraptor is detected, but no strike occurs.'});
  s.events=s.events.slice(-160);
  if(s.actors.every(a=>a.dead))s.outcome='lost';
  result={...result,predatorContact:contact.result};
 }
 if(!isSelectedAdventureSave(s))throw new Error('Selected adventure state failed post-action validation.');
 return {accepted:true,state:s,result:rolled?{...result,base:rolled.initial.base,
  stressDice:rolled.initial.stress,successes:rolled.successes,
  success:rolled.success,seed:rolled.initialSeed??null,pushRefused:rolled.pushRefused}:result};
}
