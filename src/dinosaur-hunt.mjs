// Checkpoint 007-L2a — original Jurassic predator stalking and orientation.
// The world engine owns these decisions. This is not a licensed creature table.
import {SCENARIO} from './scenario.mjs';
import {creatureRoute} from './dinosaur-pursuit.mjs';
import {speciesSensoryProfile,visualLine} from './dinosaur-visibility.mjs';

export function validCreatureFacing(location,facing){
 return facing===undefined||facing===null||
  Boolean(SCENARIO.rooms[location]&&
   (location===facing||SCENARIO.rooms[location].exits.includes(facing)));
}
// Facing limits a creature's observation through authored one-zone sightlines.
// Legacy saves with no facing retain the 007-L1 unrestricted short-range model.
export function creatureFacesZone(creature,zone,options={}){
 if(!creature||!SCENARIO.rooms[creature.location]||
    !validCreatureFacing(creature.location,creature.facing))return false;
 if(!visualLine(creature.location,zone,options))return false;
 return zone===creature.location||creature.facing==null||creature.facing===zone;
}
// Sound conveys a location cue, not a person's position. The facing direction
// is the first traversable leg toward a heard location, never a remote guess.
export function faceClue(creature,{shedDoorBreached=false}={}){
 if(!creature?.lastHeard)return creature?.facing??null;
 const route=creatureRoute(creature.location,creature.lastHeard,{shedDoorBreached});
 return route?.[1]||creature.facing||creature.location;
}
/**
 * Deterministic animal approach; one physically legal map exit maximum.
 * Strong recent evidence prompts investigation every second exploration
 * action. Weaker evidence yields careful stalking every fourth action.
 * Already-accounted alert decay makes stale cues expire instead of chasing
 * indefinitely. Planning does not roll, teleport, attack or reveal secrets.
 */
export function huntDecision(creature,{beat,shedDoorBreached=false}={}){
 const profile=speciesSensoryProfile(creature);
 if(!profile||!SCENARIO.rooms[creature?.location])throw new RangeError('Unknown predator profile or position.');
 if(!Number.isSafeInteger(beat)||beat<0)throw new RangeError('Invalid exploration beat.');
 const at=creature.location;
 if(creature.defeated||creature.alert<=0||!creature.lastHeard)
  return {behavior:'patrol',location:at,facing:creature.facing??null,moved:false,blocked:false};
 const route=creatureRoute(at,creature.lastHeard,{shedDoorBreached});
 const behavior=creature.alert>=4?'investigate':'stalk';
 if(!route)return {behavior,location:at,facing:creature.facing??null,moved:false,blocked:true};
 if(route.length===1)return {behavior:'search',location:at,facing:creature.facing??at,moved:false,blocked:false};
 const step=route[1],facing=step;
 const interval=behavior==='stalk'?4:2;
 if((beat+1)%interval!==0)
  return {behavior,location:at,facing,moved:false,blocked:false};
 // After movement, face the next authored route leg (or the prior doorway).
 const after=route[2]||at;
 return {behavior,location:step,facing:after,moved:true,blocked:false};
}
