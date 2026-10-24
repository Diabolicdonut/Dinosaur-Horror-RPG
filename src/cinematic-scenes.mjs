// Cinematic scene framing for the existing 1993 Isla Nublar incident.
//
// This is a read-only, character-local dramaturgical projection, not a creature
// spawner, random encounter system, new clock, or hidden-state oracle.
// The underlying Evolved-derived engine alone commits rolls and world changes.
import {SCENARIO} from './scenario.mjs';
import {hasObserved,GENERATOR_DIAGNOSIS,JUNGLE_TRACK_DISCOVERY} from './cinematic-continuity.mjs';

const SCENES=Object.freeze({
 control:Object.freeze({
  id:'blackout',title:'Dead Air',theme:'sci-fi-action',
  focus:'Find out why the park is silent. A working radio requires auxiliary power.',
  choices:'Investigate the consoles, reach the staff access route, or regroup before proceeding.'
 }),
 lobby:Object.freeze({
  id:'visitor-center',title:'The Great Hall',theme:'wonder',
  focus:'The exhibits testify to the animals that made this place extraordinary. A staff access card lies near reception.',
  choices:'Take in the hall, inspect the reception desk, or retrieve the card.'
 }),
 utility:Object.freeze({
  id:'service-door',title:'Behind the Staff Door',theme:'investigation',
  focus:'A reinforced maintenance entrance separates the visitor center from the generator shed.',
  choices:'Inspect the reader and determine how to open the authorized service route.'
 }),
 shed:Object.freeze({
  id:'generator',title:'A Way to Restore Power',theme:'sci-fi-action',
  focus:'The auxiliary generator is accessible here; using it will make noise.',
  choices:'Assess the machinery, prepare supplies, or attempt to restore power.'
 }),
 jungle:Object.freeze({
  id:'service-path',title:'Beyond the Fence',theme:'suspense',
  focus:'Rain, bent warning signs and muddy tracks mark the jungle service road.',
  choices:'Inspect the signs, move carefully, hide, or head toward an objective.'
 }),
 paddock:Object.freeze({
  id:'paddock',title:'Silent Perimeter',theme:'suspense',
  focus:'The paddock gate and its unpowered perimeter bear physical damage.',
  choices:'Inspect the gate or withdraw; approaching does not guarantee an encounter.'
 }),
 helipad:Object.freeze({
  id:'helipad',title:'The Last Signal',theme:'sci-fi-action',
  focus:'A functioning beacon and confirmed distress call are needed for evacuation.',
  choices:'Inspect the beacon, appreciate the valley vista, or prepare the landing area.'
 })
});
export const SCENE_THEMES=Object.freeze(['dinosaur-horror','sci-fi-action','wonder','investigation','suspense','recovery']);

// Only committed public mission flags may select variations; never inspect
// the dinosaur's hidden position, RNG, other actors' private logs or agendas.
export function sceneForActor(state,actor){
 if(!state||!actor||!SCENARIO.rooms[actor.location])return null;
 const base=SCENES[actor.location];
 const flags=state.flags||{};
 let focus=base.focus;
 let choices=base.choices;
 let title=base.title;
 if(actor.location==='control'&&flags.power){
  title='A Voice Beyond the Island';
  focus=flags.distress?
   'The distress call has been sent. Reaching and activating the helipad beacon remains the next task.':
   'Auxiliary power is running; the radio can now be used to request help.';
  choices='Use the powered radio, compare notes, or prepare for evacuation.';
 }
 if(actor.location==='lobby'&&(!state.rooms?.lobby?.items?.includes('keycard'))){
  focus='The reception access card is no longer on the desk. The museum remains an extraordinary place to stop and observe.';
  choices='Appreciate the exhibits, search the area, or return to the task.';
 }
 if(actor.location==='shed'&&!flags.power&&hasObserved(actor,GENERATOR_DIAGNOSIS)){
  title='The Familiar Controls';
  focus='The generator is accessible here. You remember the auxiliary start sequence found on the control-room consoles; it improves your preparation but starting the unit still makes noise.';
  choices='Attempt the real Heavy Machinery startup check with a +1 situational die, or return to other plans.';
 }
 if(actor.location==='jungle'&&hasObserved(actor,JUNGLE_TRACK_DISCOVERY)){
  focus='Your earlier investigation identified rain-softened dinosaur tracks. The footprints are evidence of past movement, not a guarantee about the animal’s present location.';
  choices='Revisit the tracks, move carefully or choose another path without a forced encounter.';
 }
 if(actor.location==='paddock'&&flags.paddockGateBraced===true){
  title='The Braced Perimeter';
  focus='The damaged gate has been physically secured. Its previous metal clang is no longer a threat here, though the rest of the paddock remains uncontrolled.';
  choices='Observe the repair, investigate the other damage or withdraw.';
 }
 if(actor.location==='paddock'&&flags.paddockGateBraced!==true&&
    (state.dangerRecords||[]).some(r=>r.actorId===actor.id&&r.id==='brace-paddock-gate'&&!r.success)){
  focus='The gate still hangs loose. Your previous attempt ended in a loud metal clang; you may withdraw or another survivor can attempt the repair.';
  choices='Avoid further noise, study the fence or ask another capable survivor to help.';
 }
 if(actor.location==='shed'&&flags.power){
  title='After the Generator Starts';
  focus='Auxiliary power has been restored; the maintenance route and jungle beyond still matter.';
  choices='Collect supplies, return to communications, or investigate the jungle route.';
 }
 if(actor.location==='helipad'&&flags.power&&flags.distress){
  title='An Answer in the Sky';
  focus=flags.beacon?
   'The emergency beacon is transmitting. The rescue outcome has already been determined by committed game state.':
   'Power and communications are restored. The landing beacon can now be activated.';
  choices=flags.beacon?'Review the aftermath.':'Activate the beacon or check the landing area.';
 }
 // Never announce an animal, new person, impending attack or other event.
 return {id:base.id,theme:base.theme,title,focus,choices};
}
