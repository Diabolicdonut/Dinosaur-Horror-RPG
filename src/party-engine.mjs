// Party Incident 007-C — independent multi-character deterministic prototype.
// Legacy src/engine.mjs is intentionally not imported or changed.
// Party members are Evolved-valid actors. This bounded game prototype does not
// yet implement combat, autonomous companions, or complete Evolved time scales.
import { SCENARIO } from './scenario.mjs?v=007l1';
import {compileSelectedAdventure} from './adventure-catalog.mjs';
import {createAdventureWorld} from './adventure-world.mjs';
import {newSelectedAdventureIncident,isSelectedAdventureSave,
 selectedAdventureView,selectedAdventureStep} from './adventure-party-runtime.mjs?v=009b2b2a';
import {commitAuthorizedObjective,validObjectiveRecords} from './adventure-objectives.mjs';
import {adventureBinding,validAdventureBinding} from './adventure-definition.mjs';
import {sceneForActor} from './cinematic-scenes.mjs';
import {CINEMATIC_EVENTS,eventAllowed,availableSceneEvents,validSceneRecords,validScenePressure,pressureForActor,checkScenePressure} from './cinematic-director.mjs';
import {CINEMATIC_DANGERS,currentCinematicAct,dangerAllowed,availableDangerEvents,validDangerRecords} from './cinematic-danger.mjs';
import {generatorPreparation,localSceneConsequences} from './cinematic-continuity.mjs';
import {WILDLIFE_ENCOUNTER,wildlifeState,wildlifeAvailable,validWildlifeState,dialogueAvailable,dialogueText,validDialogueRecords,localWildlifeView} from './cinematic-encounters.mjs';
import {PARK_GUIDE,defaultGuide,guideState,guideOptions,guideSpeech,guideLocalView,validParkGuide,endingForGuide} from './cinematic-escort.mjs';
import {BATTERY_CELL,BATTERY_STOCK,batteryCount,batteryReady,validBatteryStock,localBatteryOptions} from './finite-resources.mjs';
import {creatureCanTargetActor,raptorAttackPlan} from './dinosaur-encounter.mjs';
import {sightContext,shutterBlocks,serviceShutterClosed,outdoorWeather} from './dinosaur-environment.mjs';
import {visualLine,physicalCover,localCover,speciesSensoryProfile,sensoryBehavior} from './dinosaur-visibility.mjs?v=007l2b2';
import {huntDecision,faceClue,validCreatureFacing} from './dinosaur-hunt.mjs?v=007l2b2';
import {hearNoise,pursuitStep,exitsForCreature,roomIsDark,actorHasLight,actorOwnsLight,visibleLampZone,LIGHT_CAPACITY_STRETCHES} from './dinosaur-pursuit.mjs?v=007l2b2';
import { validateParty, makeParty } from './characters.mjs';
import { resolveSkillCheck } from './evolved-checks.mjs';
import {DINO_SPECIES,STRETCH_MINUTES,ROUND_SECONDS,detectCreature,detectGroupCreature,searchHiddenGroup,rollDicePool,applyCreatureAttack,applyMedicalAid,panicOnContact,rollCriticalInjury} from './evolved-encounters.mjs?v=007l2a';
import {activeCombatSlot,activeTurnId,beginCombat,holdOff,checkCombatAction,finishCombatAction,finishDinosaurAction,validCombatState} from './combat-turns.mjs?v=007l2b1';
import {TRAUMA,worldSeconds,woundModifiers,enrichInjuries,clinicallyEligible,
 resolveClinicalAid,resolveRally,resolveSurgery,tickMedicalClock,pendingLethal} from './evolved-injuries.mjs?v=007i';

export const PARTY_ENGINE_VERSION = 3;
// The legacy singleton runs until extraction is complete. Bind new saves to
// the validated content revision, without changing the Evolved dice stream.
const ACCEPTED_ADVENTURE=compileSelectedAdventure('nublar-after-the-storm',0);
const ACCEPTED_BINDING=adventureBinding(ACCEPTED_ADVENTURE);
// 009-B1: reusable topology and physical item data from a validated manifest.
// Director, cinematic rules, and rescue mechanics remain scenario-bound.
const PARTY_WORLD=createAdventureWorld(ACCEPTED_ADVENTURE);
// Transitional Evolved-gated authored interactions, not universal game rules.
const STORM_OBJECTIVE_BY_FEATURE=Object.freeze({
 generator:'restore-power',radio:'call-for-help',beacon:'light-beacon'
});
export const PARTY_SAVE_KIND = 'dinosaur-party-incident';
const own = (o,k) => Object.prototype.hasOwnProperty.call(o,k);
const deep = v => JSON.parse(JSON.stringify(v));
const normalizeSeed = seed => {
  const n=Number(seed);
  if (!Number.isSafeInteger(n)||n<0||n>4294967295)throw new RangeError('Seed must be 0–4294967295.');
  return n>>>0;
};
function nextSeed(s){
 let x=s.rng>>>0;
 x^=(x<<13)>>>0;x^=x>>>17;x^=(x<<5)>>>0;
 s.rng=x>>>0;
 return s.rng;
}
// This shared pathfinding and item-labeling boundary is scenario-independent.
function dist(a,b){return PARTY_WORLD.distance(a,b);}
function stepToward(from,target){return PARTY_WORLD.stepToward(from,target);}
function itemLabel(id){return PARTY_WORLD.itemLabel(id);}
function gameEvent(s,message,actorId=null,category='action'){
 s.events.push({beat:s.beat,actorId,category,message});
 s.events=s.events.slice(-160);
}
function medicalTick(s,from,{safeRestFor=null,nurseFor=null,deferRoundDeath=false}={}){
 const to=worldSeconds(s);
 if(to<from)throw new Error('Simulation time must not move backward.');
 if(to===from)return;
 for(let i=0;i<s.actors.length;i++){
  const person=s.actors[i];
  if(person.dead)continue;
  const seed=nextSeed(s);
  const change=tickMedicalClock(person,{from,to,seed,
   safeRest:person.id===safeRestFor,nurse:person.id===nurseFor,deferRoundDeath});
  s.actors[i]=change.after;
  for(const event of change.events){
   const detail=event.kind==='injury_healed'?'recovers from injury':
     event.kind==='death_save_pass'?'survives a medical death check':
     'fails a medical death check';
   gameEvent(s,person.name+' '+detail+' ('+event.code+').',person.id,
    event.kind==='death_save_fail'?'danger':'milestone');
  }
 }
 if(s.actors.every(a=>a.dead))s.outcome='lost';
}
function equippedMedicalGear(a){
 return [...(a.gear||[]),...(a.inventory||[])].some(x=>
  ['medical bag','medkit','first aid pouch','sterile gloves','sedative kit'].includes(x));
}
function safeTreatmentZone(s,actor){
 return ['control','shed'].includes(actor.location)&&
  (s.dinosaurs[0].defeated||dist(s.dinosaurs[0].location,actor.location)>1);
}
function nextTurn(s){
 s.cursor=(s.cursor+1)%s.actors.length;
 s.beat++;
 if(s.cursor===0)s.round++;
}
function advanceLightClock(s,fromStretch){
 const elapsed=(s.clock?.explorationStretches||0)-fromStretch;
 if(elapsed<=0)return;
 for(const a of s.actors){
  if(!a.light?.on)continue;
  a.light.charge=Math.max(0,a.light.charge-elapsed);
  if(a.light.charge===0){
   a.light.on=false;
   gameEvent(s,a.name+"'s carried light dies as its battery is exhausted.",a.id,'risk');
  }
 }
}
// One full exploration stretch per active zone search, including empty zones.
// Only seeded checks alter concealment; no location leak to distant survivors.
function advancePredatorSearch(s){
 const d=s.dinosaurs[0],search=d.search,profile=speciesSensoryProfile(d);
 if(!search||d.defeated||s.combat?.active||
    s.clock.explorationStretches<search.dueStretch)return;
 if(d.location!==search.zone){d.search=null;return;}
 const hidden=s.actors.filter(a=>a.location===search.zone&&a.hidden&&!a.dead&&!a.broken);
 const seed=nextSeed(s);
 const found=searchHiddenGroup(hidden.map(a=>a.id),{
  seed,observationDice:profile.observation});
 d.searchHistory??=[];
 d.searchHistory.push({zone:search.zone,startedAtStretch:search.startedAtStretch,
  resolvedAtStretch:s.clock.explorationStretches,seed,
  successes:found.search.successes,revealed:[...found.revealed]});
 d.searchHistory=d.searchHistory.slice(-40);
 for(const id of found.revealed){
  const person=s.actors.find(a=>a.id===id);
  person.hidden=false;person.coverId=null;
  gameEvent(s,'The velociraptor uncovers '+person.name+'.',id,'danger');
 }
 d.search=null;d.lastHeard=null;d.alert=Math.max(0,d.alert-profile.alertDecay*2);
 d.behavior=d.alert?'stalk':'patrol';
}
function dinoTick(s,noise,at) {
 const d=s.dinosaurs[0],species=DINO_SPECIES.velociraptor,profile=speciesSensoryProfile(d);
 if(!profile)throw new RangeError('Creature sensory profile is missing.');
 if(d.defeated||s.combat?.active)return;
 const conditions=sightContext(s);
  const breach=conditions.shedDoorBreached;
 // Establish direction from the actual current zone on first world tick.
 // Old v3 saves and independently created combat scenes need no fixed bearing.
 if(d.facing==null)d.facing=exitsForCreature(d.location,conditions)[0]||d.location;
 const signal=hearNoise(d.location,at,noise,{...conditions,species:profile.key});
if(signal.heard){
   d.lastHeard=at;
   d.lastHeardBeat=s.beat;d.lastClue='sound';
   d.facing=faceClue(d,conditions);
   d.alert=Math.min(6,Math.max(d.alert,noise+2));
   if(d.search&&d.search.zone!==at)d.search=null;
  }else{
   const lamp=visibleLampZone(d.location,s.actors,{...conditions,facing:d.facing});
   if(lamp){
    d.lastHeard=lamp;d.lastClue='light';
    d.facing=lamp;
    d.alert=Math.min(6,Math.max(d.alert,4));
    if(d.search&&d.search.zone!==lamp)d.search=null;
   }
  }
 // Only map-connected movement occurs on exploration patrol ticks. A secured
 // reinforced staff door blocks the animal even if it can faintly hear noise.
 const predatorPreviousZone=d.location;
if((s.beat+1)%2===0){
   if(d.search){
    // Committed zone search prevents patrol movement until completion.
   }else if(d.alert>0&&d.lastHeard){
   const hunt=huntDecision(d,{beat:s.beat,...conditions});
   if(!hunt.blocked){
    d.location=hunt.location;
    if(validCreatureFacing(d.location,hunt.facing))d.facing=hunt.facing;
   }
   d.lastHunt={beat:s.beat,from:predatorPreviousZone,to:d.location,
    behavior:hunt.behavior,blocked:hunt.blocked};
   // Predator interest decays while tracking, including when a quiet
   // approach holds position or a physical barrier blocks a route.
   d.alert=Math.max(0,d.alert-profile.alertDecay);
  }else if(d.alert>0){
   // An unrefreshed clue fades even when no further route is available.
   d.alert=Math.max(0,d.alert-profile.alertDecay);
  }else if(nextSeed(s)%3===0){
   const exits=exitsForCreature(d.location,conditions);
   if(exits.length){
    d.location=exits[nextSeed(s)%exits.length];
    if(d.location!==predatorPreviousZone)d.facing=predatorPreviousZone;
   }
  }
if(d.alert===0&&!d.search)d.lastHeard=null;
  }
  if(!d.search&&d.alert>0&&d.lastHeard===d.location){
   const start=s.clock?.explorationStretches||0;
   d.search={zone:d.location,startedAtStretch:start,dueStretch:start+profile.searchStretches};
  }
  // Only present illuminated sources count as vision; a historical clue
  // cannot create omniscient engagement when the source has gone dark.
  const freshLamp=visibleLampZone(d.location,s.actors,{
   ...conditions,facing:d.facing});
  d.behavior=sensoryBehavior(d,{sourceVisible:Boolean(freshLamp),
   sourceAudible:signal.heard})||'patrol';
 if(d.location!==predatorPreviousZone){
  for(const listener of s.actors){
   if(listener.dead||listener.location===d.location)continue;
   if(hearNoise(listener.location,d.location,1,conditions).heard)
    gameEvent(s,'Heavy footfalls sound somewhere nearby.',listener.id,'danger');
  }
 }
// A lit lamp in the animal's own zone defeats concealment without
 // implying any remote perception of other actors.
 for(const person of s.actors){
  if(person.hidden&&person.location===d.location&&!person.dead&&actorHasLight(person)){
   person.hidden=false;person.coverId=null;
   gameEvent(s,person.name+' is exposed by their own lamp near the velociraptor.',person.id,'danger');
  }
 }
 // Allies in one visible zone compare their strongest passive Observation
 // against the same creature result. They do not sum their successes.
 const newcomers=s.actors.filter(a=>!a.dead&&!a.broken&&a.health>0&&
  a.location===d.location&&!a.hidden&&!(a.seenThreats||[]).includes(d.id));
 const sight=newcomers.length?detectGroupCreature(newcomers,{
  seed:nextSeed(s),observationDice:species.observation,
  darkness:roomIsDark(d.location)}):null;
 let exposed=false,predatorAmbush=false,humanAlerted=false;
 for(const person of s.actors){
  if(person.dead||person.broken||person.health<=0||person.location!==d.location)continue;
  person.seenThreats??=[];
  if(person.hidden)continue;
  if(!person.seenThreats.includes(d.id)){
   const observation=sight;
   person.seenThreats.push(d.id);
   if(observation.margin<0)predatorAmbush=true;
   if(observation.margin>0)humanAlerted=true;
   gameEvent(s,person.name+(observation.margin>0?' spots a hunting velociraptor first.':
    ' discovers a velociraptor at close range.'),person.id,'danger');
   const panic=panicOnContact(person,{seed:nextSeed(s),
    canFlee:SCENARIO.rooms[person.location].exits.length>0,
    cluttered:(SCENARIO.rooms[person.location].affordances||[]).length>0});
   person.stress=panic.after.stress;
   person.panicResponses=panic.after.panicResponses;
   person.panicState=panic.after.panicState;
   person.pendingSkip=panic.after.pendingSkip;
   if(panic.event.dropItem&&panic.event.dropped){
    person.inventory=panic.after.inventory;
    s.rooms[person.location].items.push(panic.event.dropped);
    gameEvent(s,person.name+' drops '+itemLabel(panic.event.dropped)+' in panic.',person.id,'danger');
   }
   if(panic.event.flee){
    const exits=SCENARIO.rooms[person.location].exits.filter(dest=>
     !(person.location==='utility'&&dest==='shed'&&!person.inventory.includes('keycard')));
    if(exits.length){
     person.location=exits[nextSeed(s)%exits.length];
     if(!person.visitedRooms.includes(person.location))person.visitedRooms.push(person.location);
     gameEvent(s,person.name+' flees to '+SCENARIO.rooms[person.location].name+'.',person.id,'danger');
    }
    continue;
   }
   if(panic.event.demandCover){person.hidden=true;continue;}
  }
  exposed=true;
 }
 if(exposed){
   d.behavior='engage';
  const seed=nextSeed(s);
  const ambush=predatorAmbush&&!humanAlerted;
  if(beginCombat(s,seed,ambush?{surpriseActorId:'dinosaur-1',ambush:true}:{})){
   gameEvent(s,ambush?
    'Velociraptor ambush! The animal acts first; its initial strike cannot be dodged.':
    'A velociraptor encounter begins. Initiative is drawn for the exposed survivors.',
    null,'danger');
   const slot=activeCombatSlot(s);
   if(slot?.kind==='human')s.cursor=s.actors.findIndex(a=>a.id===slot.actorId);
  }
 }
}
/** Only the active dinosaur slot may resolve a creature turn. */
/** Declare the creature's target before dice are rolled; human players
 * receive an atomic, persistent chance to choose a Close Combat defense. */
function predatorStep(previous,{actorId,source,reactionPrompt=false,action=null}){
 const slot=activeCombatSlot(previous),d=previous.dinosaurs[0];
 if(slot?.kind!=='dinosaur')
  return rejected(previous,'There is no active creature initiative.');
 const pending=previous.combat?.pendingReaction;
 if(pending){
  const victim=previous.actors.find(a=>a.id===pending.victimId);
  if(!victim||actorId!==victim.id||!['defend','decline'].includes(action?.target)||
     action.kind!=='react')
   return rejected(previous,'Resolve the declared attack as its named defender.');
  const owned=previous.control.mode==='party'||
    (previous.control.mode==='focus'&&previous.control.focusedActorId===victim.id);
  if(source!==(owned?'human':'ai'))
   return rejected(previous,'The declared defender is controlled by '+(owned?'the player.':'the computer.'));
  const s=deep(previous),target=s.actors.find(a=>a.id===pending.victimId);
  const defend=action.target==='defend';
  if(defend&&!reactionEligible(s,target,slot))
   return rejected(previous,'No eligible quick action remains to defend.');
  delete s.combat.pendingReaction;
  return resolvePredatorStrike(s,target,slot,{defend,declared:true});
 }
 if(source!=='ai'||actorId!==d.id)
  return rejected(previous,'The predator does not currently have initiative.');
 const s=deep(previous),beast=s.dinosaurs[0];
 const targets=s.actors.filter(a=>creatureCanTargetActor(beast,a));
 if(!targets.length)return resolvePredatorStrike(s,null,slot,{defend:false});
 const victim=targets[nextSeed(s)%targets.length];
 const surprising=predatorSurprise(s,slot);
 const human=s.control.mode==='party'||
   (s.control.mode==='focus'&&s.control.focusedActorId===victim.id);
 if(reactionPrompt&&human&&!surprising&&reactionEligible(s,victim,slot)){
  s.combat.pendingReaction={victimId:victim.id,round:s.combat.round,
   card:slot.card,declaredAtBeat:s.beat,attackKind:'close_combat'};
  gameEvent(s,'The velociraptor '+(raptorAttackPlan(s,victim)?.id==='pounce'?'pounces toward ':'lunges at ')+victim.name+
    '. Choose DEFEND (quick action) or ALLOW the attack before the strike is rolled.',
    victim.id,'danger');
  return {accepted:true,state:s,awaitingReaction:true,
    result:{kind:'attack_declared',target:victim.id}};
 }
 // Legacy direct engine callers keep the previously accepted prepared-dodge
 // contract. Runtime AI uses an actual opposed Close Combat defend, even if
 // its actor was not previously ordered to stand watch.
 const legacy=!reactionPrompt;
 const reactive=(!surprising&&reactionEligible(s,victim,slot)&&
   (legacy?Boolean(victim.guarding):true));
 return resolvePredatorStrike(s,victim,slot,{
   defend:reactive&&!legacy,dodge:reactive&&legacy,declared:false});
}
function predatorSurprise(s,slot){
 return Boolean(s.combat.surprise?.ambush&&!s.combat.surprise.consumed&&
   s.combat.surprise.actorId===slot.actorId&&s.combat.round===1);
}
function reactionEligible(s,victim,slot){
 const b=s.combat?.budgets?.[victim.id];
 return Boolean(slot?.kind==='dinosaur'&&victim.health>0&&!victim.dead&&!victim.broken&&
   creatureCanTargetActor(s.dinosaurs[0],victim)&&b&&
   b.quickSpent<2&&!(b.fullSpent&&b.quickSpent>=1)&&!predatorSurprise(s,slot));
}
function resolvePredatorStrike(s,victim,slot,{defend=false,dodge=false,declared=false}={}){
 const beast=s.dinosaurs[0],species=DINO_SPECIES.velociraptor;
 const medicalFrom=worldSeconds(s);
 if(!s.clock)s.clock={explorationActions:s.beat,
   explorationStretches:Math.floor(s.beat/s.actors.length),combatRounds:0,combatSeconds:0};
 let detail={kind:'predator_wait',target:''};
 if(victim&&creatureCanTargetActor(beast,victim)){
  const plan=raptorAttackPlan(s,victim);
  const surprising=predatorSurprise(s,slot);
  if(victim.hidden&&actorHasLight(victim)){
   victim.hidden=false;victim.coverId=null;
   gameEvent(s,victim.name+' is illuminated and cannot remain concealed from the velociraptor.',victim.id,'danger');
  }
  if(defend||dodge){
   if(!reactionEligible(s,victim,slot)||!checkDodgeInterrupt(s,victim.id))
    throw new Error('Reaction eligibility changed before a validated strike.');
   gameEvent(s,victim.name+' spends a quick action to '+
     (defend?'defend with Close Combat.':'dodge with Mobility.'),victim.id,'danger');
  }
  const strike=applyCreatureAttack(victim,{seed:nextSeed(s),
    attackerDice:species.attack+plan.attackDiceBonus+(surprising?2:0),
    baseDamage:species.baseDamage+plan.baseDamageBonus,defend,dodge});
  if(surprising)s.combat.surprise.consumed=true;
  victim.guarding=false;victim.health=strike.after.health;
  victim.broken=strike.after.broken;victim.dead=strike.after.dead;
  if(strike.critical){
   victim.criticalInjuries=(strike.after.criticalInjuries||[]).map(w=>({...w}));
   const updated=enrichInjuries(victim,medicalFrom,nextSeed(s));
   Object.assign(victim,updated);
   if(TRAUMA[strike.critical.code]?.stressRelief)victim.stress=0;
   if(TRAUMA[strike.critical.code]?.stressGain)victim.stress=Math.min(30,victim.stress+1);
  }
  if(strike.evade){
   victim.stress=strike.evade.after.stress;
   victim.stressResponses=strike.evade.after.stressResponses;
  }
  gameEvent(s,strike.damage?
    'Velociraptor '+(plan.id==='pounce'?'pounces on ':'bites ')+victim.name+' for '+strike.damage+' damage'+
      (strike.broken?' — incapacitated.':'')+(strike.dead?' Fatal.':''):
    victim.name+' survives the velociraptor’s '+plan.label.toLowerCase()+' without injury.',victim.id,'danger');
  detail={kind:'predator_attack',target:victim.id,tactic:plan.id,damage:strike.damage,
    evaded:defend||dodge,defense:defend?'close_combat':dodge?'mobility':'none',
    declared,ambush:surprising,attackDice:species.attack+plan.attackDiceBonus+(surprising?2:0),
    critical:strike.critical?.code||null};
 }else gameEvent(s,'The velociraptor searches for exposed prey.',null,'danger');
 s.actions.push({beat:s.beat,actorId:beast.id,...detail,
   combatRound:s.combat.round,card:slot.card});
 s.actions=s.actions.slice(-200);
 s.beat++;
 finishDinosaurAction(s,nextSeed);
 medicalTick(s,medicalFrom,{deferRoundDeath:true});
 return {accepted:true,state:s,result:detail};
}
function checkDodgeInterrupt(s,actorId){
 const b=s.combat?.budgets?.[actorId];
 if(!b||b.quickSpent>=2||(b.fullSpent&&b.quickSpent>=1))return false;
 b.quickSpent++;b.quick=2-b.quickSpent;
 if(b.quickSpent===2)b.full=0;
 return true;
}
function matchRoom(target,room){return PARTY_WORLD.resolveExit(room,target);}
function matchItem(target,items){
 const q=String(target||'').trim().toLowerCase().replace(/^the /,'');
 return items.find(id=>id===q||itemLabel(id).toLowerCase()===q)||null;
}
function matchFeature(target,location) {
 const q=String(target||'').trim().toLowerCase();
 return (SCENARIO.rooms[location].features||[]).find(id=>id===q)||null;
}
function matchObservation(target,location) {
 const q=String(target||'').trim().toLowerCase();
 return SCENARIO.rooms[location].observations?.find(o=>
   o.id===q||o.aliases?.includes(q))||null;
}
function accepted(s,actor,kind,target,extra={},noise=0,additionalStretches=0,{safeRestFor=null,nurseFor=null}={}) {
 if(!s.clock)s.clock={explorationActions:s.beat,explorationStretches:Math.floor(s.beat/s.actors.length),combatRounds:0,combatSeconds:0};
const medicalFrom=worldSeconds(s);
  const fromStretch=s.clock.explorationStretches;
  const wasCombat=Boolean(s.combat?.active),slot=activeCombatSlot(s);
 s.actions.push({beat:s.beat,actorId:actor.id,kind,target,...extra,
  ...(wasCombat?{combatRound:s.combat.round,card:slot?.card??null}: {})});
 s.actions=s.actions.slice(-200);
 if(wasCombat){
  s.beat++;
  const costKind=kind==='escape_fail'?'move':
   ['incapacitated','panic_freeze'].includes(kind)?'wait':kind;
  finishCombatAction(s,actor.id,costKind,nextSeed);
 }else{
  const predatorWasAtStream=s.dinosaurs.some(d=>!d.defeated&&d.location==='jungle');
  dinoTick(s,noise,actor.location);
  if((predatorWasAtStream||s.dinosaurs.some(d=>!d.defeated&&d.location==='jungle'))&&wildlifeState(s).status==='present')
   s.wildlifeEncounter={...wildlifeState(s),status:'withdrawn',reason:'predator'};
  s.clock.explorationActions++;
  s.clock.explorationStretches=Math.floor(s.clock.explorationActions/s.actors.length);
  if(s.combat?.active)s.beat++;
  else nextTurn(s);
 }
 if(additionalStretches){
  s.clock.explorationActions+=additionalStretches*s.actors.length;
  s.clock.explorationStretches+=additionalStretches;
 }
 if(!wasCombat){
   advanceLightClock(s,fromStretch);
   advancePredatorSearch(s);
  }
  medicalTick(s,medicalFrom,{safeRestFor,nurseFor,deferRoundDeath:wasCombat});
  // Explore at genuine risk without creating or teleporting an animal.
  if(!wasCombat&&s.outcome==='playing'){
   const probe=checkScenePressure(s,actor,kind);
   if(probe){
    s.scenePressure??=[];
    const old=s.scenePressure.findIndex(p=>p.actorId===actor.id);
    const rec={actorId:actor.id,level:probe.level,
     checks:(old>=0?s.scenePressure[old].checks:0)+1,lastBeat:s.beat};
    if(old>=0)s.scenePressure[old]=rec;else s.scenePressure.push(rec);
    const actionRecord=s.actions.at(-1);
    if(actionRecord?.actorId===actor.id)actionRecord.scenePressure={
     before:probe.before,after:probe.level,faces:probe.faces};
    if(probe.audibleCue)gameEvent(s,'Heavy movement can be heard nearby. Its source is not visible.',actor.id,'risk');
   }
  }
 return {accepted:true,state:s,result:extra};
}
function rejected(before,why){
 return {accepted:false,state:before,reason:why};
}
export function newPartyIncident({seed=1993,roster=null,adventureId='nublar-after-the-storm'}={}) {
 if(adventureId==='ridge-survey')return newSelectedAdventureIncident({seed,roster});
 if(adventureId!=='nublar-after-the-storm')throw new RangeError('Unknown or unsupported adventure.');
 const n=normalizeSeed(seed),party=roster??makeParty({seed:n,size:3});
 const issues=validateParty(party);
 if(issues.length)throw new RangeError(issues.join(' '));
 const actors=deep(party).map(c=>({
  ...c,location:PARTY_WORLD.start,health:c.healthMax,
  inventory:[],wonderJournal:[],light:{on:false,charge:actorOwnsLight(c)?LIGHT_CAPACITY_STRETCHES:0},
   hidden:false,coverId:null,observed:[],visitedRooms:[PARTY_WORLD.start],attemptedObservations:[],stress:c.stress??0,
  armorLevel:c.gear?.includes('protective vest')?2:0,broken:false,dead:false,criticalInjuries:[],seenThreats:[],guarding:false,pendingSkip:false,
  stressResponses:c.stressResponses||[],panicResponses:[],
  medicalRest:false,lastAction:null
 }));
 actors[0].inventory.push(...PARTY_WORLD.startItems);
 for(const survivor of actors)if(actorOwnsLight(survivor))survivor.light.charge=LIGHT_CAPACITY_STRETCHES;
 return {
  kind:PARTY_SAVE_KIND,version:PARTY_ENGINE_VERSION,scenario:SCENARIO.id,
  adventureBinding:deep(ACCEPTED_BINDING),
  initialSeed:n,rng:n||0x9e3779b9,beat:0,round:1,cursor:0,outcome:'playing',
  clock:{explorationActions:0,explorationStretches:0,combatRounds:0,combatSeconds:0},
  startingRoster:deep(party),actors,flags:{power:false,distress:false,beacon:false,serviceShutterClosed:false,paddockGateBraced:false},
  control:{mode:'party',focusedActorId:actors[0].id,cameraMode:'follow',
    cameraActorId:actors[0].id,paused:true,speedMs:1200,epoch:0},
  controlHistory:[],aiDecisions:[],combat:null,sceneRecords:[],scenePressure:[],dangerRecords:[],objectiveRecords:[],
  dialogueRecords:[],wildlifeEncounter:{status:'present',seenBy:[],approachedBy:[],reason:null},
  parkGuide:defaultGuide(),batterySpent:0,
  rooms:PARTY_WORLD.initialRoomItems(),
  dinosaurs:[{...SCENARIO.initialDinosaur,behavior:'patrol',facing:null,lastHeard:null,health:DINO_SPECIES.velociraptor.health,defeated:false,lastStrikes:{}}],
  events:[{beat:0,actorId:null,category:'system',message:'Emergency lighting holds. The surviving personnel gather in the control room.'}],
  actions:[]
 };
}
export function isPartySave(s) {
 if(s?.scenario==='ridge-survey')return isSelectedAdventureSave(s);
 if(!s||s.kind!==PARTY_SAVE_KIND||s.version!==PARTY_ENGINE_VERSION||
    !Array.isArray(s.actors)||!s.control||!['party','focus','spectator'].includes(s.control.mode)||
    !['follow','actor'].includes(s.control.cameraMode)||
    !s.actors?.some(a=>a.id===s.control.focusedActorId)||
    !s.actors?.some(a=>a.id===s.control.cameraActorId)||
    typeof s.control.paused!=='boolean'||
    !Number.isInteger(s.control.epoch)||s.control.epoch<0||
    ![400,800,1200,2000].includes(s.control.speedMs)||
    !Array.isArray(s.controlHistory)||!Array.isArray(s.aiDecisions)||
    !validCombatState(s)||!validSceneRecords(s)||!validScenePressure(s)||!validDangerRecords(s)||
    !validWildlifeState(s)||!validDialogueRecords(s)||!validParkGuide(s)||!validBatteryStock(s)||
     !validObjectiveRecords(ACCEPTED_ADVENTURE,s)||
     (s.adventureOutcome!==undefined&&s.adventureOutcome!==null&&
       !['completed','abandoned'].includes(s.adventureOutcome))||
    (s.clock!==undefined&&(!s.clock||!['explorationActions','explorationStretches','combatRounds','combatSeconds'].every(k=>
      Number.isSafeInteger(s.clock[k])&&s.clock[k]>=0)))||
    !['playing','rescued','lost'].includes(s.outcome)||
    s.scenario!==SCENARIO.id||!validAdventureBinding(s.adventureBinding,ACCEPTED_ADVENTURE)||
    !Number.isInteger(s.beat)||s.beat<0||
    !Number.isInteger(s.cursor)||!Array.isArray(s.actors)||s.actors.length<1||
    s.actors.length>8||s.cursor>=s.actors.length||
    !Number.isInteger(s.rng)||!s.rooms||!s.flags||!Array.isArray(s.actions)||
    !Array.isArray(s.events)||!Array.isArray(s.dinosaurs)||
     (s.flags.serviceShutterClosed!==undefined&&typeof s.flags.serviceShutterClosed!=='boolean')||
     (s.flags.paddockGateBraced!==undefined&&typeof s.flags.paddockGateBraced!=='boolean')||
     (s.groupTravel!==undefined&&s.groupTravel!==null&&
      (!SCENARIO.rooms[s.groupTravel.from]||!SCENARIO.rooms[s.groupTravel.to]||
       !['quiet','normal','noisy'].includes(s.groupTravel.approach)||
       !Array.isArray(s.groupTravel.awaiting)||
       s.groupTravel.awaiting.some(id=>!s.actors.some(a=>a.id===id))))||
     (s.dinosaurs[0]?.search!==undefined&&s.dinosaurs[0]?.search!==null&&
       (!SCENARIO.rooms[s.dinosaurs[0].search.zone]||
       !Number.isSafeInteger(s.dinosaurs[0].search.dueStretch)))||
    !Array.isArray(s.startingRoster)||validateParty(s.startingRoster).length!==0||
    !SCENARIO.rooms[s.dinosaurs[0]?.location]||
     !validCreatureFacing(s.dinosaurs[0]?.location,s.dinosaurs[0]?.facing)||
     (s.dinosaurs[0]?.lastHunt!==undefined&&
      (!s.dinosaurs[0]?.lastHunt||
       !Number.isSafeInteger(s.dinosaurs[0].lastHunt.beat)||
       !SCENARIO.rooms[s.dinosaurs[0].lastHunt.from]||
       !SCENARIO.rooms[s.dinosaurs[0].lastHunt.to]||
       s.dinosaurs[0].lastHunt.beat>s.beat||
       (s.dinosaurs[0].lastHunt.from!==s.dinosaurs[0].lastHunt.to&&
        !SCENARIO.rooms[s.dinosaurs[0].lastHunt.from].exits.includes(s.dinosaurs[0].lastHunt.to))||
       (s.dinosaurs[0].lastHunt.blocked&&
        s.dinosaurs[0].lastHunt.from!==s.dinosaurs[0].lastHunt.to)||
       typeof s.dinosaurs[0].lastHunt.blocked!=='boolean'||
       !['patrol','stalk','investigate','search'].includes(s.dinosaurs[0].lastHunt.behavior)))||
    (s.dinosaurs[0].behavior!==undefined&&!['patrol','investigate','stalk','search','engage','inactive'].includes(s.dinosaurs[0].behavior)))return false;
 if(validateParty(s.actors).length)return false;
 return s.actors.every(a=>SCENARIO.rooms[a.location]&&Array.isArray(a.inventory)&&
   Array.isArray(a.observed)&&Array.isArray(a.visitedRooms)&&
   a.visitedRooms.every(r=>Boolean(SCENARIO.rooms[r]))&&
   Array.isArray(a.attemptedObservations)&&
   (a.wonderJournal===undefined||(Array.isArray(a.wonderJournal)&&
     a.wonderJournal.every(w=>w&&typeof w.id==='string'&&
       SCENARIO.rooms[w.room]?.wonder?.id===w.id)))&&
   typeof a.health==='number'&&a.health>=0&&
   Number.isInteger(a.stress)&&a.stress>=0&&a.stress<=30&&
    (a.coverId===undefined||a.coverId===null||Boolean(physicalCover(a.location,a.coverId)))&&
    (a.light===undefined||(typeof a.light?.on==='boolean'&&
      Number.isSafeInteger(a.light.charge)&&a.light.charge>=0&&
      a.light.charge<=LIGHT_CAPACITY_STRETCHES)))&&
   Object.keys(SCENARIO.rooms).every(id=>
     Array.isArray(s.rooms[id]?.items));
}
/**
 * Explicit opt-in migration from the accepted checkpoint 007-C save schema.
 * Never touch the older, unrelated checkpoint 006.2 singleton game.
 */
export function upgradePartySave(candidate) {
 if(isPartySave(candidate))return deep(candidate);
 if(!candidate||candidate.kind!==PARTY_SAVE_KIND||candidate.version!==2)
   throw new RangeError('Unrecognized party save version.');
 const s=deep(candidate);
 if(!Array.isArray(s.actors)||!s.actors.length||!Array.isArray(s.actions)||
    !Array.isArray(s.events)||!Array.isArray(s.startingRoster)||
    validateParty(s.startingRoster).length)
   throw new RangeError('Legacy party save is incomplete.');
 s.version=PARTY_ENGINE_VERSION;
 for(const actor of s.actors){
  if(!SCENARIO.rooms[actor.location])throw new RangeError('Unknown actor location.');
  const visits=[SCENARIO.start,...s.actions.filter(a=>a.actorId===actor.id&&a.kind==='move')
     .map(a=>a.target).filter(x=>SCENARIO.rooms[x])];
  actor.visitedRooms=[...new Set([...visits,actor.location])];
  actor.attemptedObservations=[...new Set(s.actions.filter(a=>a.actorId===actor.id&&a.kind==='investigate')
     .map(a=>a.target).filter(x=>typeof x==='string'))];
 }
 const id=s.actors[s.cursor]?.id||s.actors[0].id;
 s.clock={explorationActions:s.beat,explorationStretches:Math.floor(s.beat/s.actors.length),combatRounds:0,combatSeconds:0};
 s.control={mode:'party',focusedActorId:id,cameraMode:'follow',cameraActorId:id,
   paused:true,speedMs:1200,epoch:0};
 s.controlHistory=[];s.aiDecisions=[];
 if(!isPartySave(s))throw new RangeError('Legacy party save did not pass migration checks.');
 return s;
}
export function partyView(s,{actorId=null}={}) {
 if(s?.scenario==='ridge-survey')return selectedAdventureView(s,{actorId});
 if(!isPartySave(s))throw new RangeError('Invalid party incident save.');
 const actor=s.actors.find(x=>x.id===actorId)||s.actors[s.cursor];
 const place=SCENARIO.rooms[actor.location];
  const mapRoom=PARTY_WORLD.room(actor.location);
 return {
  beat:s.beat,round:s.round,outcome:s.outcome,actorId:actor.id,actorName:actor.name,
  time:{explorationStretches:s.clock?.explorationStretches??Math.floor(s.beat/s.actors.length),
   minutes:STRETCH_MINUTES*(s.clock?.explorationStretches??Math.floor(s.beat/s.actors.length)),
   combatRounds:s.clock?.combatRounds??0,combatSeconds:s.clock?.combatSeconds??0,
   combatRoundSeconds:ROUND_SECONDS},
  controlMode:s.control.mode,focusedActorId:s.control.focusedActorId,
  cameraMode:s.control.cameraMode,paused:s.control.paused,
  activeActorId:activeTurnId(s),
  combat:s.combat?.active?{round:s.combat.round,card:activeCombatSlot(s)?.card,
   index:s.combat.index,owner:activeCombatSlot(s)?.kind,order:s.combat.order.map(t=>({...t})),
   surprise:s.combat.surprise?{...s.combat.surprise}:null,
   pendingReaction:s.combat.pendingReaction?{...s.combat.pendingReaction}:null,
   remaining:s.combat.budgets[activeTurnId(s)]||null}:null,
  location:actor.location,roomName:mapRoom.name,description:mapRoom.description,
   weather:outdoorWeather(s,actor.location),
   serviceShutterClosed:serviceShutterClosed(s)&&['shed','jungle'].includes(actor.location),
   cinematicScene:sceneForActor(s,actor),
   cinematicAct:currentCinematicAct(s),
   availableDangerEvents:availableDangerEvents(s,actor),
   sceneConsequences:localSceneConsequences(s,actor),
   preparedGenerator:generatorPreparation(s,actor).ready,
   wildlifeEncounter:wildlifeAvailable(s,actor).length?{title:WILDLIFE_ENCOUNTER.title,
    description:WILDLIFE_ENCOUNTER.description,choices:wildlifeAvailable(s,actor)}:localWildlifeView(s,actor),
   dialogueOpportunities:dialogueAvailable(s,actor),
   parkGuide:guideLocalView(s,actor),
   rescueEnding:s.outcome==='rescued'?endingForGuide(s):null,
   localPaddockGateBraced:actor.location==='paddock'&&s.flags.paddockGateBraced===true,
   availableSceneEvents:availableSceneEvents(s,actor),
   encounterPressure:pressureForActor(s,actor.id),
  lighting:roomIsDark(actor.location)?(actorHasLight(actor)?'dark — personal lamp ON':'dark — low visibility'):'partially lit',
   batterySupplies:{carried:batteryCount(actor)},
   batteryActions:localBatteryOptions(s,actor,actorOwnsLight(actor),LIGHT_CAPACITY_STRETCHES),
   personalLight:{carried:actorOwnsLight(actor),on:actorHasLight(actor),
    charge:actor.light?.charge??(actorOwnsLight(actor)?LIGHT_CAPACITY_STRETCHES:0)},
   cover:actor.coverId&&physicalCover(actor.location,actor.coverId)?
    {id:actor.coverId,label:physicalCover(actor.location,actor.coverId).label}:null,
   availableCover:localCover(actor.location).map(c=>({id:c.id,label:c.label})),
   distantSightings:s.dinosaurs.filter(d=>!d.defeated&&d.location!==actor.location&&
     visualLine(actor.location,d.location,sightContext(s))&&
     actorHasLight(actor)).map(d=>({kind:d.kind})),
   groupTravel:s.groupTravel?.awaiting?.includes(actor.id)&&
    actor.location===s.groupTravel.from?
      {to:s.groupTravel.to,approach:s.groupTravel.approach}:null,
  exits:mapRoom.exits.map(id=>({id,name:PARTY_WORLD.roomName(id),
    blocked:shutterBlocks(s,actor.location,id)})),
  items:s.rooms[actor.location].items.map(id=>({id,name:itemLabel(id)})),
  features:[...place.features],observations:(place.observations||[]).map(o=>({id:o.id})),
  wonder:place.wonder?{id:place.wonder.id,title:place.wonder.title,
    discovered:Boolean((actor.wonderJournal||[]).some(w=>w.id===place.wonder.id))}:null,
  wonderJournal:(actor.wonderJournal||[]).map(w=>({...w})),
  visibleDinosaurs:s.dinosaurs.filter(d=>d.location===actor.location&&!d.defeated&&
     (!roomIsDark(actor.location)||actorHasLight(actor)))
   .map(d=>d.kind),
  inventory:actor.inventory.map(id=>({id,name:itemLabel(id)})),
  health:actor.health,healthMax:actor.healthMax,stress:actor.stress,
  injuries:actor.criticalInjuries||[],medicalUrgency:pendingLethal(actor).map(w=>({code:w.code,deadline:w.deadline,nextDeathAt:w.nextDeathAt})),
  broken:Boolean(actor.broken),dead:Boolean(actor.dead),panicState:actor.panicState||null,
  hidden:actor.hidden,flags:Object.fromEntries(Object.entries(s.flags).filter(([key])=>!['serviceShutterClosed','paddockGateBraced'].includes(key))),
  actors:s.actors.map(a=>({id:a.id,name:a.name,career:a.career,location:a.location,
   roomName:PARTY_WORLD.roomName(a.location),stress:a.stress,health:a.health,
   active:a.id===s.actors[s.cursor].id})),
  events:s.events.filter(e=>e.actorId===null||e.actorId===actor.id).slice(-40)
 };
}
export function parsePartyAction(input) {
 if(typeof input==='object'&&input!==null)
   return {kind:String(input.kind||'').toLowerCase(),target:String(input.target||''),
     recipientId:input.recipientId||null,push:input.push===1||input.push===true?1:0};
 let line=String(input||'').toLowerCase().trim().replace(/[.!?]+$/,'');
 line=line.replace(/^(?:i(?:\s+want\s+to|\s+try\s+to)?\s+|my\s+character\s+|we\s+)/,'');
 const push=/^push(?:\s|:)/.test(line)?1:0;
 if(push)line=line.replace(/^push(?:\s|:)+/,'');
 if(['look','status','inventory'].includes(line))return {kind:'look',target:'',push:0};
 if(/^(?:battery\s+replace|replace\s+(?:the\s+)?(?:flashlight\s+)?battery|swap\s+(?:the\s+)?battery|reload\s+(?:the\s+)?(?:flashlight|headlamp))$/.test(line))
  return {kind:'battery',target:'replace',push:0};
 const guide=line.match(/^guide\s+(talk|persuade|escort|handoff|shelter|muster)$/);
 if(guide)return {kind:'guide',target:guide[1],push};
 const wildlife=line.match(/^wildlife\s+(watch|approach)$/);
 if(wildlife)return {kind:'wildlife',target:wildlife[1],push};
 const talk=line.match(/^(?:talk|speak)\s+(pc-[1-8])\s+(check-in|plan)$/);
 if(talk)return {kind:'dialogue',target:talk[2],recipientId:talk[1],push:0};
 const danger=line.match(/^(?:danger|attempt danger|resolve danger)\s+([a-z0-9-]+)$/);
 if(danger)return {kind:'danger',target:danger[1],push};
 const scene=line.match(/^(?:scene|experience scene|play scene)\s+([a-z0-9-]+)$/);
 if(scene)return {kind:'scene',target:scene[1],push:0};
 if(line==='wonder'||line==='take in the view'||line==='pause and observe')
  return {kind:'wonder',target:'',push:0};
 const wonder=line.match(/^(?:wonder|admire|appreciate|contemplate|marvel at|take in|enjoy|pause to observe)\s+(?:the\s+)?(.+)$/);
 if(wonder)return {kind:'wonder',target:wonder[1].trim(),push:0};
 if(['wait','stay'].includes(line))return {kind:'wait',target:'',push:0};
  const lamp=line.match(/^(?:(?:turn|switch)\s+(?:my |the )?(?:flashlight|headlamp|light)\s+(on|off)|(?:turn|switch)\s+(on|off)\s+(?:my |the )?(?:flashlight|headlamp|light)|light\s+(on|off))$/);
  if(lamp)return {kind:'light',target:lamp[1]||lamp[2]||lamp[3],push:0};
  const group=line.match(/^(?:lead (?:the )?group|group|everyone)\s+(?:(quietly|silently|sneak|normal|together|noisily|run|rush)\s+)?(?:to\s+)?(.+)$/);
  if(group){
   const style=['quietly','silently','sneak'].includes(group[1])?'quiet':
    ['noisily','run','rush'].includes(group[1])?'noisy':'normal';
   return {kind:'group',target:style+'|'+group[2].trim(),push:0};
  }
  const rush=line.match(/^(?:rush|run|sprint)\s+(?:to\s+)?(.+)$/);
  if(rush)return {kind:'rush',target:rush[1].trim(),push:0};
 const quiet=line.match(/^(?:sneak|creep|move quietly|move silently)\s+(?:to\s+)?(.+)$/);
 if(quiet)return {kind:'sneak',target:quiet[1].replace(/^the /,'').trim(),push};
 const hold=line.match(/^(?:hold|hold off|defer)\s+(?:to\s+)?(?:card\s+)?(\d{1,2})$/);
 if(hold)return {kind:'hold',target:hold[1],push:0};
 if(line==='hold')return {kind:'wait',target:'',push:0};
 if(['end','end turn','pass turn','done'].includes(line))return {kind:'end',target:'',push:0};
 if(['guard','watch','keep guard','stand watch'].includes(line))return {kind:'guard',target:'',push:0};
 if(['rest','rest safely','recover','take a rest'].includes(line))return {kind:'rest',target:'',push:0};
 const rally=line.match(/^(?:rally|encourage|revive)\s+(pc-[1-8])$/);
 if(rally)return {kind:'rally',target:rally[1],push:0};
 const surg=line.match(/^(?:surgery|operate on)\s+(pc-[1-8])$/);
 if(surg)return {kind:'surgery',target:surg[1],push:0};
 if(/^(?:attack|strike|fight|hit)(?:\s+.*)?$/.test(line))return {kind:'attack',target:'dinosaur',push};
 const aid=line.match(/^(?:aid|treat|first aid|stabilize)\s+(pc-[1-8])$/);
 if(aid)return {kind:'aid',target:aid[1],push:0};
 const cover=line.match(/^(?:hide|conceal|crouch|take cover)\s+(?:behind|under|in)\s+(.+)$/);
 if(cover)return {kind:'hide',target:cover[1].trim(),push};
 if(/^(?:hide|conceal|crouch|take cover)(?:\s+.*)?$/.test(line))return {kind:'hide',target:'',push};
 const regex=[
  [/^(?:go|move|walk|head|run|sneak|creep)\s+(?:to\s+)?(.+)$/,'move'],
  [/^(?:take|pick up|grab)\s+(.+)$/,'take'],
  [/^(?:use|activate|repair|restart|fix|turn on)\s+(.+)$/,'use'],
  [/^(?:investigate|study|inspect|examine|search|observe)\s+(.+)$/,'investigate']
 ];
 for(const [re,kind] of regex){const m=line.match(re);if(m)
  return {kind,target:m[1].replace(/^(the |a )/,'').trim(),push};}
 const give=line.match(/^(?:give|hand)\s+(.+?)\s+to\s+(pc-[1-8])$/);
 if(give)return {kind:'give',target:give[1],recipientId:give[2],push:0};
 return {kind:'',target:line,push:0};
}
export function partyStep(previous,raw,{actorId=null,source='human',reactionPrompt=false}={}) {
 if(previous?.scenario==='ridge-survey')
  return selectedAdventureStep(previous,raw,{actorId,source,reactionPrompt},parsePartyAction);
 if(!isPartySave(previous))throw new RangeError('Invalid party incident.');
 let action=parsePartyAction(raw);
  if(action.kind==='group'){
   const [approach,...parts]=action.target.split('|');
   if(!['quiet','normal','noisy'].includes(approach)||!parts.join('|'))
    return rejected(previous,'Choose a valid group destination and pace.');
   action={...action,kind:approach==='quiet'?'sneak':approach==='noisy'?'rush':'move',
    target:parts.join('|'),groupApproach:approach};
  }
  const slot=activeCombatSlot(previous);
 const activeId=activeTurnId(previous);
 if(slot?.kind==='dinosaur')return predatorStep(previous,{actorId,source,reactionPrompt,action});
 const actor=previous.actors.find(a=>a.id===activeId);
 if(!actor)throw new RangeError('Scheduled survivor missing.');
 if(actorId!==null&&actor.id!==actorId)
  return rejected(previous,'It is '+actor.name+"'s turn.");
 const human=previous.control.mode==='party'||
   (previous.control.mode==='focus'&&previous.control.focusedActorId===actor.id);
 if(!['human','ai'].includes(source)||source!==(human?'human':'ai'))
  return rejected(previous,'This character is currently controlled by '+(human?'the player.':'the computer.'));
 if(previous.outcome!=='playing')return rejected(previous,'This incident has concluded.');
 if(action.kind==='look')return rejected(previous,'Inspect the current scene without spending time.');
 if(action.kind==='guide'&&action.target==='talk'){
  if(!guideOptions(previous,actor).some(o=>o.id==='talk'))
   return rejected(previous,'The guide is not available for that conversation here.');
  const changed=deep(previous),g=guideState(changed);
  changed.parkGuide={...g,spokenBy:[...g.spokenBy,actor.id]};
  gameEvent(changed,PARK_GUIDE.name+' speaks with '+actor.name+': '+guideSpeech(changed),actor.id,'scene');
  changed.actions.push({beat:changed.beat,actorId:actor.id,kind:'guide',target:'talk'});
  changed.actions=changed.actions.slice(-200);
  return {accepted:true,state:changed,result:{kind:'guide',target:'talk'}};
 }
 if(action.kind==='dialogue'){
  const option=dialogueAvailable(previous,actor).find(o=>o.recipientId===action.recipientId&&o.topic===action.target);
  if(!option)return rejected(previous,'That teammate or conversation is not available here.');
  const changed=deep(previous),other=changed.actors.find(a=>a.id===action.recipientId);
  const words=dialogueText(changed,actor,other,action.target);
  changed.dialogueRecords??=[];
  changed.dialogueRecords.push({actorId:actor.id,recipientId:other.id,zone:actor.location,
   topic:action.target,beat:changed.beat});
  gameEvent(changed,actor.name+' speaks with '+other.name+': '+words,actor.id,'scene');
  changed.actions.push({beat:changed.beat,actorId:actor.id,kind:'dialogue',target:action.target,recipientId:other.id});
  changed.actions=changed.actions.slice(-200);
  return {accepted:true,state:changed,result:{kind:'dialogue',recipientId:other.id,topic:action.target}};
 }
 if(action.kind==='scene'){
  if(!eventAllowed(previous,actor,action.target))
   return rejected(previous,'That conditional scene event is not currently available to this survivor.');
  const changed=deep(previous),event=CINEMATIC_EVENTS[action.target];
  changed.sceneRecords??=[];
  changed.sceneRecords.push({id:action.target,zone:actor.location,
   actorId:actor.id,beat:changed.beat});
  gameEvent(changed,event.title+': '+event.text,actor.id,event.theme==='wonder'?'wonder':'scene');
  changed.actions.push({beat:changed.beat,actorId:actor.id,kind:'scene',target:action.target});
  changed.actions=changed.actions.slice(-200);
  return {accepted:true,state:changed,result:{kind:'scene',id:action.target,title:event.title}};
 }
 if(action.kind==='wonder'){
  if(slot)return rejected(previous,'This moment requires leaving combat behind.');
  if(actor.dead||actor.broken||actor.pendingSkip)
   return rejected(previous,'This survivor cannot pause to appreciate the surroundings right now.');
  const moment=SCENARIO.rooms[actor.location].wonder;
  if(!moment)return rejected(previous,'No authored quiet discovery is available here.');
  const target=String(action.target||'').trim().toLowerCase();
  if(target&&!([moment.id,moment.title.toLowerCase(),'view','surroundings'].includes(target)))
   return rejected(previous,'That moment is not visible from this location.');
  if((actor.wonderJournal||[]).some(w=>w.id===moment.id))
   return rejected(previous,'This survivor has already recorded this discovery.');
  const changed=deep(previous);
  const observer=changed.actors.find(a=>a.id===actor.id);
  observer.wonderJournal??=[];
  observer.wonderJournal.push({id:moment.id,room:actor.location,
   title:moment.title,description:moment.description,beat:changed.beat,kind:moment.kind});
  gameEvent(changed,observer.name+' takes a moment to appreciate '+moment.title+
    ': '+moment.description,observer.id,'wonder');
  changed.actions.push({beat:changed.beat,actorId:observer.id,
    kind:'wonder',target:moment.id});
  changed.actions=changed.actions.slice(-200);
  // Reflective observation is a voluntary no-roll, no-time narrative event;
  // it does not secretly alter stress, combat, supplies or predator position.
  return {accepted:true,state:changed,result:{kind:'wonder',id:moment.id,title:moment.title}};
 }
 if(action.kind==='guide'&&!guideOptions(previous,actor).some(o=>o.id===action.target))
  return rejected(previous,'That action requires Mara to be here, able to travel, and not already accounted for.');
 if(action.kind==='wildlife'&&!wildlifeAvailable(previous,actor).some(x=>x.id===action.target))
  return rejected(previous,'No safe, physically present wildlife encounter offers that choice now.');
 if(action.kind==='danger'&&!dangerAllowed(previous,actor,action.target))
  return rejected(previous,'This physical danger challenge is not available here or was already resolved or attempted.');
 if(!['wait','hold','end','move','sneak','rush','light','take','give','hide','use','investigate','guard','aid','attack','rally','surgery','rest','danger','wildlife','guide','battery'].includes(action.kind))
  return rejected(previous,'Describe a supported action or use the scene controls.');
 if(action.kind==='hold'){
  if(!slot)return rejected(previous,'Holding initiative is only allowed in combat.');
  if(!/^\d{1,2}$/.test(action.target))return rejected(previous,'Select a valid later initiative card.');
  const changed=deep(previous);
  const held=holdOff(changed,actor.id,Number(action.target));
  if(!held.accepted)return rejected(previous,held.reason);
  gameEvent(changed,actor.name+' holds off, trading initiative card #'+held.fromCard+
    ' for #'+held.toCard+'.',actor.id,'action');
  changed.actions.push({beat:changed.beat,actorId:actor.id,kind:'hold',
   target:String(held.toCard),card:held.fromCard,combatRound:changed.combat.round,
   recipientId:held.recipientId});
  changed.actions=changed.actions.slice(-200);
  return {accepted:true,state:changed,result:held};
 }
 if(slot){
  const budget=checkCombatAction(previous,actor.id,action.kind);
  if(!budget.accepted)return rejected(previous,budget.reason);
 }else if(action.kind==='end')return rejected(previous,'End Turn is only available in combat.');
 if(slot&&['rest','surgery'].includes(action.kind))
  return rejected(previous,'A long medical procedure cannot be performed during an active combat round.');
 const s=deep(previous),a=s.actors[s.cursor];
 if(a.dead){
  gameEvent(s,a.name+' cannot act.',a.id,'danger');
  return accepted(s,a,'incapacitated','',{},0);
 }
 if(a.pendingSkip){
  a.pendingSkip=false;
  gameEvent(s,a.name+' loses a turn to panic.',a.id,'danger');
  return accepted(s,a,'panic_freeze','',{},0);
 }
 if(a.broken&&action.kind!=='move'&&action.kind!=='wait'&&action.kind!=='rest'){
  gameEvent(s,a.name+' is too injured to act.',a.id,'danger');
  return accepted(s,a,'incapacitated','',{},0);
 }
 const result=(skill,context='',bonus=0)=>{
   const seed=nextSeed(s);
   const injury=woundModifiers(a,skill,{
    twoHands:['comtech','medical_aid','ranged_combat','piloting'].includes(skill),
    twoArms:['close_combat','heavy_machinery'].includes(skill)});
   const rolled=resolveSkillCheck(a,{skill,context,seed,push:action.push,
    modifier:injury.modifier+bonus});
   const next=rolled.after;
   // Changes to the actor's psychological sheet are authoritative and persistent.
   a.stress=next.stress;a.stressResponses=next.stressResponses;
   a.storyPoints=next.storyPoints;
   if(injury.bleeds){
    const prior=a.health;
    a.health=Math.max(0,a.health-1);
    if(prior>0&&a.health===0){
     a.broken=true;
     const critical=rollCriticalInjury(nextSeed(s),a.criticalInjuries||[]);
     const trauma=enrichInjuries({...a,criticalInjuries:[...(a.criticalInjuries||[]),critical]},
       worldSeconds(s),nextSeed(s));
     Object.assign(a,trauma);
     if(TRAUMA[critical.code]?.lethal==='instant')a.dead=true;
     gameEvent(s,a.name+' is incapacitated by an existing bleeding injury and suffers another critical wound.',a.id,'danger');
    }
   }
   return {seed,success:rolled.success,successes:rolled.successes,
     base:rolled.initial.base,stressDice:rolled.initial.stress,
     pushes:rolled.pushes,responseEvents:rolled.responseEvents,notes:rolled.notes,
     pushRefused:rolled.pushRefused};
 };
 if(action.kind==='guide'){
  const g=guideState(s);
  if(action.target==='persuade'){
   const check=result('manipulation','guide_escort');
   s.parkGuide={...g,attemptedBy:[...g.attemptedBy,a.id],
    status:check.success?'following':'waiting',escortId:check.success?a.id:null};
   gameEvent(s,check.success?PARK_GUIDE.name+' agrees to follow '+a.name+' toward safety.':
    PARK_GUIDE.name+' is not yet willing to leave the lobby without more reassurance.',a.id,
    check.success?'milestone':'scene');
   return accepted(s,a,'guide','persuade',{...check,agreed:check.success},0);
  }
  const updates={escort:{status:'following',escortId:a.id},
   handoff:{status:'following',escortId:a.id},
   shelter:{status:'sheltered',escortId:null},
   muster:{status:'mustered',escortId:null}};
  s.parkGuide={...g,...updates[action.target]};
  const phrase=action.target==='escort'?'leaves the secure room with ':
   action.target==='handoff'?'accepts a new escort from ':
   action.target==='shelter'?'waits under cover after speaking with ':
   'is accounted for at the helipad by ';
  gameEvent(s,PARK_GUIDE.name+' '+phrase+a.name+'.',a.id,'milestone');
  return accepted(s,a,'guide',action.target,{guideStatus:s.parkGuide.status},0);
 }
 if(action.kind==='wildlife'){
  const w=wildlifeState(s);
  s.wildlifeEncounter={...w,seenBy:[...new Set([...w.seenBy,a.id])],
   approachedBy:action.target==='approach'?[...new Set([...w.approachedBy,a.id])]:[...w.approachedBy]};
  if(action.target==='watch'){
   gameEvent(s,a.name+' watches a peaceful Parasaurolophus drinking across the stream. It remains free to move away.',a.id,'wonder');
   return accepted(s,a,'wildlife','watch',{outcome:'observed',species:'Parasaurolophus'},0);
  }
  const check=result('mobility','careful_approach');
  if(check.success){
   gameEvent(s,a.name+' approaches slowly; the Parasaurolophus looks up, then continues feeding across the stream.',a.id,'wonder');
  }else{
   s.wildlifeEncounter.status='withdrawn';s.wildlifeEncounter.reason='disturbed';
   gameEvent(s,"The Parasaurolophus startles at "+a.name+"'s movement and withdraws through the ferns.",a.id,'risk');
  }
  return accepted(s,a,'wildlife','approach',{...check,outcome:check.success?'calm':'withdrawn',species:'Parasaurolophus',noise:check.success?0:2},check.success?0:2);
 }
 if(action.kind==='danger'){
  const hazard=CINEMATIC_DANGERS[action.target];
  const rolled=result(hazard.skill,hazard.context);
  const success=rolled.success;
  if(success)s.flags[hazard.successFlag]=true;
  a.hidden=false;a.coverId=null;
  s.dangerRecords??=[];
  s.dangerRecords.push({id:hazard.id,zone:a.location,actorId:a.id,beat:s.beat,
   success,successes:rolled.successes});
  gameEvent(s,a.name+': '+(success?hazard.success:hazard.failure),a.id,
   success?'milestone':'risk');
  return accepted(s,a,'danger',hazard.id,{...rolled,success,
   consequence:success?'secured':'loud_failure',noise:success?hazard.successNoise:hazard.failureNoise},
   success?hazard.successNoise:hazard.failureNoise);
 }
 if(action.kind==='end'){
  gameEvent(s,a.name+' ends their combat turn.',a.id);
  return accepted(s,a,'end','',{},0);
 }
 if(action.kind==='wait'){
   gameEvent(s,a.name+' waits and listens.',a.id);
   return accepted(s,a,'wait','',{},0);
 }
 if(action.kind==='battery'){
  if(action.target!=='replace'||s.combat?.active||!actorOwnsLight(a)||
     !batteryReady(a)||a.light.charge>=LIGHT_CAPACITY_STRETCHES)
   return rejected(previous,'Replacing the lamp cell requires a carried lamp, a physical spare cell and room for additional charge outside combat.');
  a.inventory.splice(a.inventory.indexOf(BATTERY_CELL),1);
  const chargeBefore=a.light.charge;
  // A changed lamp cell begins dark and OFF. Switching it on costs a separate
  // legal action, so resource use never gifts free light or stealth.
  a.light={...a.light,on:false,charge:LIGHT_CAPACITY_STRETCHES};
  s.batterySpent=(s.batterySpent||0)+1;
  gameEvent(s,a.name+' installs a sealed replacement lamp cell; the used cell is spent and the lamp remains off.',a.id,'action');
  return accepted(s,a,'battery','replace',{consumed:BATTERY_CELL,
   chargeBefore,chargeAfter:LIGHT_CAPACITY_STRETCHES,remaining:batteryCount(a),
   batterySpent:s.batterySpent},0);
 }
 if(action.kind==='light'){
   if(!actorOwnsLight(a))return rejected(previous,'This survivor has no working flashlight or headlamp.');
   const current=a.light??{on:true,charge:LIGHT_CAPACITY_STRETCHES};
   const on=action.target==='on';
   if(!['on','off'].includes(action.target))return rejected(previous,'Choose light on or off.');
   if(current.on===on)return rejected(previous,'The carried light is already '+action.target+'.');
   if(on&&current.charge<=0)return rejected(previous,'The carried light has no remaining charge.');
   a.light={...current,on};
   if(on&&a.hidden&&s.dinosaurs[0].location===a.location&&!s.dinosaurs[0].defeated){
    a.hidden=false;a.coverId=null;
    gameEvent(s,a.name+' gives away their concealed position by switching on a lamp.',a.id,'danger');
   }
   gameEvent(s,a.name+' switches their carried light '+action.target+'.',a.id,'action');
   return accepted(s,a,'light',action.target,{on,charge:a.light.charge},0);
  }
  if(action.kind==='guard'){
  a.guarding=true;
  gameEvent(s,a.name+' keeps watch for movement.',a.id);
  return accepted(s,a,'guard','',{},0);
 }
 if(action.kind==='aid'){
  const patient=s.actors.find(x=>x.id===action.target);
  if(!patient||patient.location!==a.location||!clinicallyEligible(patient))
   return rejected(previous,'First aid needs a living broken or unstabilized patient in this room.');
  const self=patient.id===a.id;
  if(self&&a.broken)return rejected(previous,'A broken survivor cannot give themselves first aid.');
  const help=resolveClinicalAid(a,patient,{seed:nextSeed(s),self,
   medicalGear:equippedMedicalGear(a),time:worldSeconds(s)});
  if(!help.accepted)return rejected(previous,help.reason);
  a.stress=help.medicAfter.stress;
  a.stressResponses=help.medicAfter.stressResponses;
  Object.assign(patient,help.patient);
  gameEvent(s,a.name+(help.success?' stabilizes ':' fails to stabilize ')+patient.name+
   (help.events.includes('lethal_interval_worsened')?' — lethal interval worsens.':'')+
   (help.events.includes('death_from_failed_treatment')?' The patient dies.':''),a.id,
   help.success?'milestone':'danger');
  return accepted(s,a,'aid',patient.id,{success:help.success,events:help.events,
   base:help.roll.initial.base,stressDice:help.roll.initial.stress},0);
 }
 if(action.kind==='rally'){
  const patient=s.actors.find(x=>x.id===action.target);
  if(!patient||patient.id===a.id||patient.location!==a.location||!patient.broken||patient.dead)
   return rejected(previous,'Rally requires a living broken companion in the same room.');
  const rally=resolveRally(a,patient,{seed:nextSeed(s)});
  if(!rally.accepted)return rejected(previous,rally.reason);
  a.stress=rally.commanderAfter.stress;
  a.stressResponses=rally.commanderAfter.stressResponses;
  Object.assign(patient,rally.patient);
  gameEvent(s,a.name+(rally.success?' rallies ':' fails to rally ')+patient.name+
   '. Any untreated lethal wound remains dangerous.',a.id,rally.success?'milestone':'risk');
  return accepted(s,a,'rally',patient.id,{success:rally.success,
   base:rally.roll.initial.base},0);
 }
 if(action.kind==='surgery'){
  const patient=s.actors.find(x=>x.id===action.target);
  if(!patient||patient.location!==a.location||patient.id===a.id||patient.dead)
   return rejected(previous,'Surgery requires a living companion present in the same room.');
  if(!safeTreatmentZone(s,a))return rejected(previous,'Surgery requires a secure medical location, away from the raptor.');
  const operation=resolveSurgery(a,patient,{seed:nextSeed(s),
   medicalGear:equippedMedicalGear(a)});
  if(!operation.accepted)return rejected(previous,operation.reason);
  Object.assign(patient,operation.patient);
  a.stress=operation.medicAfter.stress;
  a.stressResponses=operation.medicAfter.stressResponses;
  gameEvent(s,a.name+(operation.success?' completes ':' cannot complete ')+
    'surgery for '+patient.name+'.',a.id,operation.success?'milestone':'danger');
  return accepted(s,a,'surgery',patient.id,{success:operation.success},0,36);
 }
 if(action.kind==='rest'){
  if(!safeTreatmentZone(s,a))return rejected(previous,'Rest requires a safe staffed room without nearby dinosaur activity.');
  gameEvent(s,a.name+' takes an uninterrupted recovery stretch.',a.id,'milestone');
  return accepted(s,a,'rest','',{safe:true},0,1,{safeRestFor:a.id,
   nurseFor:s.actors.find(p=>p.id!==a.id&&p.location===a.location&&
    p.talent==='Recovery Care')?a.id:null});
 }
 if(action.kind==='attack'){
  const d=s.dinosaurs[0];
  if(d.defeated||d.location!==a.location)return rejected(previous,'No dinosaur is within attacking range.');
  const covertStrike=!s.combat?.active&&a.hidden&&d.alert===0;
  if(covertStrike){
   a.hidden=false;
   const seed=nextSeed(s);
   if(!beginCombat(s,seed,{surpriseActorId:a.id,ambush:true}))
    return rejected(previous,'Could not establish an eligible ambush.');
   gameEvent(s,a.name+' launches a concealed ambush and claims initiative card #1.',a.id,'danger');
  }
  const gear=[...(a.gear||[]),...a.inventory];
  const ranged=gear.includes('service carbine')||gear.includes('tranquilizer launcher');
  const skill=ranged?'ranged_combat':'close_combat';
  const check=result(skill,covertStrike?'ambush':'',covertStrike?2:0);
  if(covertStrike)s.combat.surprise.consumed=true;
  const damage=check.success?Math.max(0,(ranged?2:1)+check.successes-1-DINO_SPECIES.velociraptor.armor):0;
  d.health=Math.max(0,(d.health??DINO_SPECIES.velociraptor.health)-damage);
  if(d.health===0)d.defeated=true;
  a.hidden=false;
  gameEvent(s,a.name+' attacks the velociraptor'+(damage?' for '+damage+' damage.':' but cannot injure it.')+
    (d.defeated?' It collapses.':''),a.id,'danger');
  return accepted(s,a,'attack',d.id,{...check,damage,defeated:d.defeated,ambush:covertStrike},ranged?3:2);
 }
if(['move','sneak','rush'].includes(action.kind)){
    const quiet=action.kind==='sneak';
   const limitations=woundModifiers(a,'mobility');
   if(limitations.immobile)return rejected(previous,'This injury prevents movement until treated.');
   const room=matchRoom(action.target,a.location);
   if(!room)return rejected(previous,'That destination is not connected to this room.');
   if(a.location==='utility'&&room==='shed'&&!a.inventory.includes('keycard'))
     return rejected(previous,a.name+' needs the staff access card to enter the shed.');
   if(shutterBlocks(s,a.location,room))
     return rejected(previous,'The service shutter blocks this doorway. Open it from either side before passing.');
    if(s.dinosaurs[0].location===a.location&&!a.hidden&&!s.dinosaurs[0].defeated&&!a.broken){
    const escape=result('mobility');
    if(!escape.success){
     gameEvent(s,a.name+' fails to break away from the velociraptor.',a.id,'risk');
     return accepted(s,a,'escape_fail',room,escape,2);
    }
   }
const origin=a.location;
    const companions=action.groupApproach?s.actors.filter(p=>
     p.id!==a.id&&p.location===origin&&!p.dead&&!p.broken):[];
    if(action.groupApproach&&!companions.length)
     return rejected(previous,'No mobile teammates are colocated for a group order.');
    const hadCover=a.hidden;
    const stealth=quiet?result('mobility','stealth_travel'):null;
    const sound=quiet?(stealth.success?0:2):action.kind==='rush'?3:1;
    a.location=room;
   if(guideState(s).status==='following'&&guideState(s).escortId===a.id&&
      guideState(s).location===origin)s.parkGuide={...guideState(s),location:room};
   a.hidden=Boolean(quiet&&hadCover&&stealth.success&&localCover(room).length);
   a.coverId=a.hidden?localCover(room)[0].id:null;
   if(!a.visitedRooms.includes(room))a.visitedRooms.push(room);
if(action.groupApproach){
     s.groupTravel={leaderId:a.id,from:origin,to:room,approach:action.groupApproach,
      awaiting:companions.map(p=>p.id)};
    }else if(s.groupTravel?.awaiting?.includes(a.id)){
     s.groupTravel.awaiting=s.groupTravel.awaiting.filter(id=>id!==a.id);
     if(!s.groupTravel.awaiting.length)s.groupTravel=null;
    }
    gameEvent(s,a.name+(quiet?(stealth.success?' slips quietly into ':' makes a noise entering '):
      action.kind==='rush'?' rushes noisily into ':' enters ')+PARTY_WORLD.roomName(room)+'.',
      a.id,quiet&&!stealth.success?'risk':'action');
    return accepted(s,a,action.kind,room,
      {...(quiet?stealth:{}),noise:sound,...(action.groupApproach?{groupApproach:action.groupApproach,
       groupedWith:companions.map(p=>p.id)}:{})},sound);
 }
 if(action.kind==='take'){
   const item=matchItem(action.target,s.rooms[a.location].items);
   if(!item)return rejected(previous,'That object is not available here.');
   s.rooms[a.location].items.splice(s.rooms[a.location].items.indexOf(item),1);
   a.inventory.push(item);a.hidden=false;a.coverId=null;
   gameEvent(s,a.name+' picks up '+itemLabel(item)+'.',a.id);
   return accepted(s,a,'take',item,{},1);
 }
 if(action.kind==='give'){
   const target=s.actors.find(x=>x.id===action.recipientId);
   if(!target||target.id===a.id||target.location!==a.location)
     return rejected(previous,'Recipient must be a different survivor in the same room.');
   const item=matchItem(action.target,a.inventory);
   if(!item)return rejected(previous,'This survivor does not possess that item.');
   a.inventory.splice(a.inventory.indexOf(item),1);target.inventory.push(item);
   gameEvent(s,a.name+' gives '+itemLabel(item)+' to '+target.name+'.',a.id);
   return accepted(s,a,'give',item,{recipientId:target.id},0);
 }
 if(action.kind==='hide'){
   if(s.dinosaurs[0].location===a.location&&!s.dinosaurs[0].defeated&&actorHasLight(a))
    return rejected(previous,'Switch off your exposed light before hiding from the nearby dinosaur.');
   const cover=action.target?
    localCover(a.location).find(x=>x.id===action.target||
     x.label.toLowerCase()===action.target.replace(/^the /,'').toLowerCase()||
     x.id.replaceAll('_',' ')===action.target.replace(/^the /,'').toLowerCase()):
    localCover(a.location)[0];
   if(!cover)return rejected(previous,'This zone has no matching physical cover.');
   const rolled=result('mobility');
   a.hidden=rolled.success;a.coverId=rolled.success?cover.id:null;
   gameEvent(s,a.name+(rolled.success?' takes cover behind '+cover.label+'.':
     ' cannot conceal themselves behind '+cover.label+'.'),a.id,rolled.success?'action':'risk');
   return accepted(s,a,'hide',cover.id,{...rolled,coverId:a.coverId},0);
 }
 if(action.kind==='investigate'){
   const observation=matchObservation(action.target,a.location);
   if(!observation)return rejected(previous,'Nothing matching that detail is present here.');
   const rolled=result('observation','active_search');
   const known=a.location+':'+observation.id;
   if(!a.attemptedObservations.includes(known))a.attemptedObservations.push(known);
   if(rolled.success){
     if(!a.observed.includes(a.location+':'+observation.id))a.observed.push(a.location+':'+observation.id);
     gameEvent(s,a.name+' examines '+observation.id+': '+(observation.investigation||observation.description),a.id);
   }else gameEvent(s,a.name+' finds no reliable new detail about '+observation.id+'.',a.id);
   return accepted(s,a,'investigate',observation.id,rolled,0);
 }
 if(action.kind==='use'){
   const feature=matchFeature(action.target,a.location);
   if(!feature)return rejected(previous,'That mechanism is not here.');
   if(!['generator','radio','beacon','shutter'].includes(feature))
     return rejected(previous,'This feature cannot yet be operated through the party simulation.');
   if(feature==='shutter'){
     s.flags.serviceShutterClosed=!serviceShutterClosed(s);
     a.hidden=false;a.coverId=null;
     gameEvent(s,a.name+(s.flags.serviceShutterClosed?' closes ':' opens ')+
       'the shed service shutter.',a.id,'action');
     return accepted(s,a,'use','shutter',{closed:s.flags.serviceShutterClosed},1);
    }
    if(feature==='generator'&&s.flags.power)return rejected(previous,'Auxiliary power is already active.');
   if(feature==='radio'&&!s.flags.power)return rejected(previous,'The radio requires auxiliary power.');
   if(feature==='radio'&&s.flags.distress)return rejected(previous,'The distress call has already been transmitted.');
   if(feature==='beacon'&&(!s.flags.power||!s.flags.distress))
     return rejected(previous,'The beacon needs restored power and a transmitted distress call.');
   if(feature==='beacon'&&s.flags.beacon)return rejected(previous,'The beacon is already broadcasting.');
   const skill=feature==='generator'?'heavy_machinery':'comtech';
   const preparation=feature==='generator'?generatorPreparation(s,a):null;
   const rolled=result(skill,'',preparation?.modifier||0);
   if(preparation?.ready)gameEvent(s,a.name+' follows the auxiliary generator sequence learned from the control-room diagnostic.',a.id,'action');
   a.hidden=false;
   if(rolled.success){
    // Rule-authorized success has already been resolved using Evolved dice.
    // The generic objective service may commit only authored typed effects.
    const committed=commitAuthorizedObjective(ACCEPTED_ADVENTURE,s,{
     objectiveId:STORM_OBJECTIVE_BY_FEATURE[feature],
     actorId:a.id,authorization:{kind:'engine-committed-rule',success:true}
    });
    if(!committed.accepted)
     throw new Error('Validated adventure objective disagreement: '+committed.reason);
    s.flags=committed.state.flags;
    s.objectiveRecords=committed.state.objectiveRecords;
    if(committed.state.adventureOutcome){
     s.adventureOutcome=committed.state.adventureOutcome;
     // Party-v3 rescue reporting remains unchanged; other adventures can
     // translate authored endings differently when fully extracted.
     s.outcome=s.adventureOutcome==='completed'?'rescued':'lost';
     gameEvent(s,endingForGuide(s).text,a.id,'milestone');
    }
    gameEvent(s,a.name+' successfully operates the '+feature+'.',a.id,'milestone');
   }else gameEvent(s,a.name+' cannot get the '+feature+' working yet.',a.id,'risk');
   return accepted(s,a,'use',feature,{...rolled,
    ...(feature==='beacon'?{guideEnding:endingForGuide(s)}:{}),
    ...(feature==='generator'?{preparationUsed:Boolean(preparation?.ready),
      preparationBonus:preparation?.modifier||0,
      preparationSource:preparation?.source||null}:{})},feature==='generator'?3:1);
 }
 return rejected(previous,'Unrecognized action.');
}
