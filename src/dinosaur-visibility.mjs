// 007-L1: authored park sightlines and physical hiding geometry.
// Original dinosaur-horror house rules; no copyrighted rulebook text or creature tables.
import {SCENARIO} from './scenario.mjs';
export const VISUAL_LINKS=Object.freeze({
 control:Object.freeze(['lobby','utility']),
 lobby:Object.freeze(['control']),
 utility:Object.freeze(['control']), // the reinforced service door obstructs the shed
 shed:Object.freeze(['jungle']), // doorway faces the jungle service path
 jungle:Object.freeze(['shed','helipad']),
 paddock:Object.freeze([]), // fence vegetation blocks paddock-to-path vision
 helipad:Object.freeze(['jungle'])
});
export const CREATURE_SENSORY_PROFILES=Object.freeze({
 velociraptor:Object.freeze({
  key:'velociraptor',kind:'Velociraptor',sightZones:1,
  observation:5,hearingBonus:0,searchStretches:1,alertDecay:1,
  behaviors:Object.freeze(['patrol','investigate','stalk','search','engage'])
 })
});
export function speciesSensoryProfile(creature){
 const key=String(creature?.species||creature?.kind||'').toLowerCase();
 return CREATURE_SENSORY_PROFILES[key]||null;
}
export function visualLine(from,to,{shedDoorBreached=false,serviceShutterClosed=false,squall=false}={}){
 if(!SCENARIO.rooms[from]||!SCENARIO.rooms[to])return false;
 if(from===to)return true;
 // A physical shutter across the shed doorway blocks sight both ways.
 if(serviceShutterClosed&&new Set([from,to]).size===2&&
   ['shed','jungle'].includes(from)&&['shed','jungle'].includes(to))return false;
 // Outdoor visibility briefly fails during an authored tropical squall,
 // without affecting same-zone contact or indoor windows.
 if(squall&&(['jungle','helipad'].includes(from)&&
   ['jungle','helipad'].includes(to)))return false;
 if(squall&&(['shed','jungle'].includes(from)&&
   ['shed','jungle'].includes(to)))return false;
 // A breached utility/shed door creates an actual reciprocal sightline.
 if(shedDoorBreached&&((from==='utility'&&to==='shed')||
   (from==='shed'&&to==='utility')))return true;
 return VISUAL_LINKS[from]?.includes(to)===true;
}
export function visualZones(from,options={}){
 if(!SCENARIO.rooms[from])return [];
 return [from,...SCENARIO.rooms[from].exits.filter(to=>visualLine(from,to,options))];
}
export function physicalCover(roomId,coverId){
 if(!SCENARIO.rooms[roomId]||typeof coverId!=='string')return null;
 return (SCENARIO.rooms[roomId].affordances||[])
   .find(a=>a.id===coverId&&a.uses.includes('cover'))||null;
}
export function localCover(roomId){
 return (SCENARIO.rooms[roomId]?.affordances||[]).filter(a=>a.uses.includes('cover'));
}
export function canSeeIlluminatedActor(observerZone,actor,options={}){
 if(!actor||actor.dead||!visualLine(observerZone,actor.location,options))return false;
 // A concealed survivor with a live light broadcasts their position.
 return Boolean(options.lightOn);
}
export function sensoryBehavior(creature,{sourceVisible=false,sourceAudible=false}={}){
 const profile=speciesSensoryProfile(creature);
 if(!profile)return null;
 if(creature.defeated)return 'inactive';
 if(sourceVisible&&creature.location===creature.lastHeard)return 'engage';
 if(creature.search)return 'search';
 if(sourceVisible||sourceAudible)return 'investigate';
 if(creature.alert>0&&creature.lastHeard)
  return creature.alert>=4?'investigate':'stalk';
 return 'patrol';
}
