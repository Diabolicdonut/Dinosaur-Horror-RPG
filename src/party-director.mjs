// Checkpoint 007-D: player agency vs. camera, knowledge-bounded AI companions,
// and safe one-actor-at-a-time spectator simulation.
// These are original Dinosaur Horror game controls, not Evolved Edition procedures.
import { SCENARIO } from './scenario.mjs?v=007l2a';
import {compileSelectedAdventure} from './adventure-catalog.mjs?v=009b2b2c1';
import {createAdventureWorld} from './adventure-world.mjs';
const SURVEY_WORLD=createAdventureWorld(compileSelectedAdventure('ridge-survey',0));
import { isPartySave, partyView, partyStep } from './party-engine.mjs?v=009b2b2c1';
import {TRAUMA,pendingLethal} from './evolved-injuries.mjs';
import {activeTurnId,activeCombatSlot} from './combat-turns.mjs?v=007l2b1';

export const CONTROL_MODES=Object.freeze(['party','focus','spectator']);
export const SPEED_OPTIONS=Object.freeze([400,800,1200,2000]);
const copy=x=>JSON.parse(JSON.stringify(x));
const validId=(s,id)=>s.actors.some(a=>a.id===id);
function insist(s){if(!isPartySave(s))throw new RangeError('Invalid party incident.');}
function noChange(s,reason){return {accepted:false,state:s,reason};}
export function currentOwner(s){
 insist(s);
 const id=s.combat?.pendingReaction?.victimId||activeTurnId(s);
 if(activeCombatSlot(s)?.kind==='dinosaur'&&!s.combat?.pendingReaction)return 'ai';
 return s.control.mode==='party'||
   (s.control.mode==='focus'&&s.control.focusedActorId===id)?'human':'ai';
}
export function cameraActorId(s){
 insist(s);
 return s.control.cameraMode==='follow' ?
   (s.combat?.pendingReaction?.victimId||
    (activeCombatSlot(s)?.kind==='dinosaur'?s.control.cameraActorId:activeTurnId(s))) : s.control.cameraActorId;
}
/** Mode switches apply only between completed actions, no simulation time or RNG. */
export function setControlMode(previous,{mode,focusedActorId=null}={}){
 insist(previous);
 if(!CONTROL_MODES.includes(mode))return noChange(previous,'Unknown control mode.');
 const focus=focusedActorId??previous.control.focusedActorId;
 if(!validId(previous,focus))return noChange(previous,'Cannot select an unknown survivor.');
 if(previous.control.mode===mode&&previous.control.focusedActorId===focus)
   return {accepted:true,state:previous,changed:false};
 const s=copy(previous),before=s.control.mode;
 s.control={...s.control,mode,focusedActorId:focus,paused:true,
   epoch:s.control.epoch+1};
 s.controlHistory.push({
   beat:s.beat,actionIndex:s.actions.length,type:'mode',from:before,to:mode,
   focusedActorId:focus,epoch:s.control.epoch
 });
 s.controlHistory=s.controlHistory.slice(-120);
 return {accepted:true,state:s,changed:true};
}
export function setFocusActor(previous,id){
 insist(previous);
 if(!validId(previous,id))return noChange(previous,'Unknown character.');
 // Selecting an acting human does not rewrite prior events or change mode.
 return setControlMode(previous,{mode:previous.control.mode,focusedActorId:id});
}
export function setCamera(previous,{mode,actorId=null}={}){
 insist(previous);
 if(!['follow','actor'].includes(mode))return noChange(previous,'Unknown camera mode.');
 const target=actorId??previous.control.cameraActorId;
 if(!validId(previous,target))return noChange(previous,'Unknown camera actor.');
 if(previous.control.cameraMode===mode&&previous.control.cameraActorId===target)
   return {accepted:true,state:previous,changed:false};
 const s=copy(previous);
 s.control.cameraMode=mode;
 s.control.cameraActorId=target;
 s.control.epoch++;
 // Camera selection is presentation only, not a character's new knowledge.
 return {accepted:true,state:s,changed:true};
}
export function setPlayback(previous,{paused=null,speedMs=null}={}){
 insist(previous);
 if(paused!==null&&typeof paused!=='boolean')
   return noChange(previous,'Paused must be true or false.');
 if(speedMs!==null&&!SPEED_OPTIONS.includes(speedMs))
   return noChange(previous,'Unsupported playback speed.');
 const s=copy(previous);
 if(paused!==null)s.control.paused=paused;
 if(speedMs!==null)s.control.speedMs=speedMs;
 s.control.epoch++;
 return {accepted:true,state:s,changed:true};
}
function shortestNext(from,destination,adventureId='nublar-after-the-storm'){
 if(from===destination)return null;
 const rooms=adventureId==='ridge-survey'?SURVEY_WORLD:null;
 if(rooms?(!rooms.hasRoom(from)||!rooms.hasRoom(destination)):
   (!SCENARIO.rooms[from]||!SCENARIO.rooms[destination]))return null;
 const q=[[from,[]]],seen=new Set([from]);
 while(q.length){
  const [node,path]=q.shift();
  for(const neighbor of (rooms?rooms.room(node).exits:SCENARIO.rooms[node].exits)){
   if(seen.has(neighbor))continue;
   if(neighbor===destination)return (path[0]||neighbor);
   seen.add(neighbor);q.push([neighbor,[...path,neighbor]]);
  }
 }
 return null;
}
/**
 * Observable input for autonomous character proposals.
 * Deliberately excludes hidden dinosaur coordinates, all other rooms' items,
 * other actors' private histories, and other actors' possessions.
 * Structural park map is publicly known; mission flags are shared party milestones.
 */
export function actorObservation(s,actorId){
 insist(s);
 const actor=s.actors.find(a=>a.id===actorId);
 if(!actor)throw new RangeError('Unknown observer.');
 const view=partyView(s,{actorId});
 return {
  actorId,career:actor.career,agenda:actor.agenda,location:actor.location,
  hidden:actor.hidden,stress:actor.stress,health:actor.health,broken:Boolean(actor.broken),dead:Boolean(actor.dead),
  panicState:actor.panicState||null,
  inventory:[...actor.inventory],
  equipment:[...(actor.gear||[])],
  visitedRooms:[...actor.visitedRooms],
  attemptedObservations:[...actor.attemptedObservations],
  roomName:view.roomName,exits:view.exits.filter(x=>!x.blocked).map(x=>x.id),
  items:view.items.map(x=>x.id),features:[...view.features],
  observations:view.observations.map(x=>x.id),
  distantThreats:view.distantSightings?.map(x=>x.kind)||[],
  availableCover:view.availableCover?.map(x=>x.id)||[],
  personalLight:{...view.personalLight},
  groupTravel:view.groupTravel?{...view.groupTravel}:null,
  dinosaurs:[...view.visibleDinosaurs],
  nearbyAllies:s.actors.filter(a=>a.id!==actorId&&a.location===actor.location)
    .map(a=>({id:a.id,name:a.name,career:a.career,broken:Boolean(a.broken),dead:Boolean(a.dead),
      lethalUnstable:pendingLethal(a).length>0,
      surgeryNeeded:(a.criticalInjuries||[]).some(w=>!w.healed&&!w.surgeryDone&&TRAUMA[w.code]?.surgery)})),
  mission:{...view.flags},
  adventureId:view.adventureId||'nublar-after-the-storm',
  objectivePlan:Array.isArray(view.objectivePlan)?view.objectivePlan.map(x=>({...x})):null
 };
}
function proposal(kind,target,goal,reason){
 return {kind,target,goal,reason};
}
function to(observation,destination,goal){
 const step=shortestNext(observation.location,destination,observation.adventureId);
 const exposed=['jungle','paddock','helipad'].includes(observation.location);
 return step&&observation.exits.includes(step)?
   proposal(exposed?'sneak':'move',step,goal,
    exposed?'Move carefully along an exposed outdoor route.':'Navigate the known park corridors.') :
   proposal('wait','',goal,'There is no safe modeled route forward.');
}
/**
 * Fully offline bounded companion AI. Same permitted action vocabulary and
 * same Evolved resolution as human. Does not inspect world secret state.
 */
export function chooseCompanionAction(observation){
 const o=observation;
 if(o.dead||o.broken)return proposal('wait','','incapacitated','This survivor cannot act.');
 const patient=o.nearbyAllies.find(a=>!a.dead&&(a.broken||a.lethalUnstable));
 if(patient&&o.career==='medic')
   return proposal('aid',patient.id,'stabilize_ally','Treat a nearby wounded survivor.');
 if(patient?.broken&&['supervisor','ranger','tactical'].includes(o.career))
   return proposal('rally',patient.id,'rally_survivor','Help a nearby incapacitated survivor return to action.');
 if(o.career==='medic'&&['control','shed'].includes(o.location)&&
   o.nearbyAllies.some(a=>a.surgeryNeeded)&&
   (o.equipment?.includes('medical bag')||o.inventory.includes('medkit'))){
   const op=o.nearbyAllies.find(a=>a.surgeryNeeded);
   return proposal('surgery',op.id,'surgical_repair','Operate on a nearby survivor whose injury requires surgery.');
 }
 if(o.dinosaurs.length){
   if(o.hidden)return proposal('wait','','avoid_dinosaur','Remain concealed from the dinosaur.');
   if(o.equipment?.includes('service carbine')||o.equipment?.includes('tranquilizer launcher')||
      o.inventory.includes('service carbine')||o.inventory.includes('tranquilizer launcher'))
     return proposal('attack','dinosaur','protect_survivors','Use a carried weapon against an immediately visible predator.');
   return proposal('hide','','avoid_dinosaur','Try to find concealment from a nearby dinosaur.');
 }
 if(o.distantThreats?.length&&!o.hidden&&o.availableCover?.length)
    return proposal('hide',o.availableCover[0],'avoid_seen_predator',
      'Take real local cover from a predator seen along an unobstructed sightline.');
  if(o.groupTravel&&o.exits.includes(o.groupTravel.to))
   return proposal(o.groupTravel.approach==='quiet'?'sneak':
     o.groupTravel.approach==='noisy'?'rush':'move',o.groupTravel.to,
    'follow_formation','Follow the locally agreed route on this survivor’s own turn.');
 if(o.personalLight.carried&&!o.personalLight.on&&o.personalLight.charge>0&&
    ['jungle','paddock','helipad'].includes(o.location)&&!o.hidden)
   return proposal('light','on','light_the_way','Illuminate this dark zone with a carried lamp.');
 if(o.items.includes('keycard')&&!o.inventory.includes('keycard'))
   return proposal('take','keycard','recover_access','Recover the visible staff access card.');
 if(o.location==='shed'){
  if(o.items.includes('medkit')&&o.career==='medic')
   return proposal('take','medkit','prepare_treatment','Secure available medical supplies.');
  if(o.items.includes('flare')&&['ranger','tactical'].includes(o.career))
   return proposal('take','flare','prepare_escape','Take a visible emergency flare.');
 }
 const researched=o.observations.find(id=>
   !o.attemptedObservations.includes(o.location+':'+id));
 if(researched && ['scientist','ranger'].includes(o.career) &&
    (o.location==='paddock'||o.location==='jungle'))
    return proposal('investigate',researched,'research_tracks','Examine a nearby environmental clue.');
 // An adventure with manifest-defined objective prompts must not run the
 // hardcoded Nublar generator-radio-beacon AI plan.
 if(Array.isArray(o.objectivePlan)){
  const goal=o.objectivePlan[0];
  if(!goal)return proposal('wait','','mission_finished','No outstanding objectives.');
  if(o.location===goal.room)return goal.target?
   proposal('use',goal.target,goal.id,'Perform the local, authored objective interaction.') :
   proposal('wait','',goal.id,'No source-valid interaction is defined yet.');
  return to(o,goal.room,goal.id);
 }
 if(!o.mission.power){
   if(o.inventory.includes('keycard')){
     if(o.location==='shed')return proposal('use','generator','restore_power','Restore auxiliary power.');
     return to(o,'shed','restore_power');
   }
   if(!o.visitedRooms.includes('lobby')&&o.location!=='lobby')
     return to(o,'lobby','find_access_card');
   if(o.location==='lobby'){
     if(o.observations.includes('reception')&&!o.attemptedObservations.includes('lobby:reception'))
       return proposal('investigate','reception','locate_access','Search the reception counter.');
     return to(o,'control','rally_team');
   }
   if(o.location!=='control')return to(o,'control','rally_team');
   if(o.career==='scientist'&&o.observations.includes('consoles')&&
     !o.attemptedObservations.includes('control:consoles'))
       return proposal('investigate','consoles','inspect_system','Study the failed park systems.');
   return proposal('wait','','rally_team','Wait for a colleague to restore power.');
 }
 if(!o.mission.distress){
   if(o.location==='control')return proposal('use','radio','send_distress','Transmit a rescue signal.');
   return to(o,'control','send_distress');
 }
 if(!o.mission.beacon){
   if(o.location==='helipad')return proposal('use','beacon','light_beacon','Activate the rescue beacon.');
   // Reaching the jungle requires passing the card-locked shed door.
   if(o.location==='utility'&&!o.inventory.includes('keycard'))
     return to(o,'control','await_access');
   if(o.location==='control'&&!o.inventory.includes('keycard')&&
      o.visitedRooms.includes('utility'))
     return proposal('wait','','await_access','Await access through the secured maintenance door.');
   return to(o,'helipad','light_beacon');
 }
 return proposal('wait','','survive','Continue to safety.');
}
/**
 * One atomic autonomous decision. Pause prohibits background advance, but a
 * deliberate manual Step may resolve exactly one AI turn while paused.
 */
export function runAutonomousTurn(previous,{singleStep=false,expectedBeat=null,expectedEpoch=null}={}){
 insist(previous);
 if(previous.outcome!=='playing')return noChange(previous,'The incident has ended.');
 if(currentOwner(previous)!=='ai')return noChange(previous,'The current survivor awaits player input.');
 if(previous.control.paused&&!singleStep)return noChange(previous,'Simulation is paused.');
 if(expectedBeat!==null&&expectedBeat!==previous.beat)
   return noChange(previous,'Outdated AI decision rejected.');
 if(expectedEpoch!==null&&expectedEpoch!==previous.control.epoch)
   return noChange(previous,'AI control changed before this decision.');
 const pending=previous.combat?.pendingReaction;
 const predator=activeCombatSlot(previous)?.kind==='dinosaur';
 const actor=predator?null:previous.actors.find(a=>a.id===activeTurnId(previous));
 const choice=pending?
  {kind:'react',target:'defend',goal:'survive',reason:'Use an available quick action to defend before the attack.'}:
  predator?
   {kind:'predator',target:'',goal:'hunt',reason:'Creature initiative turn.'}:
   chooseCompanionAction(actorObservation(previous,actor.id));
 let resolved=partyStep(previous,{kind:choice.kind,target:choice.target},
  {actorId:pending?.victimId||(predator?previous.dinosaurs[0].id:actor.id),
   source:'ai',reactionPrompt:true});
 if(!resolved.accepted){
   // A safe, deterministic fallback never forges a success or spends an invalid check.
   if(predator)return resolved;
   resolved=partyStep(previous,{kind:'wait',target:''},{actorId:actor.id,source:'ai'});
 }
 if(!resolved.accepted)return resolved;
 if(resolved.awaitingReaction)return {
  accepted:true,state:resolved.state,awaitingReaction:true,
  decision:{acceptedAction:'predator_declare',
    proposed:{kind:'predator_declare',target:resolved.result?.target||''}},
  result:resolved.result
 };
 const s=resolved.state;
 const record={beat:previous.beat,actorId:predator?previous.dinosaurs[0].id:actor.id,
   proposed:{...choice},acceptedAction:s.actions.at(-1)?.kind||'wait',
   actionIndex:s.actions.length-1,controlEpoch:previous.control.epoch};
 s.aiDecisions.push(record);
 s.aiDecisions=s.aiDecisions.slice(-200);
 if(actor){const target=s.actors.find(a=>a.id===actor.id);target.aiGoal=choice.goal;}
 return {accepted:true,state:s,decision:record,result:resolved.result};
}
