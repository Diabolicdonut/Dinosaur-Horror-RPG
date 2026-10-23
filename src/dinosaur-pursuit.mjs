// Dinosaur Horror 007-J: physical hearing, pursuit and route constraints.
// Original park-zone model; it adapts Evolved stealth principles without
// copying a licensed creature's sensory or movement profile.
import {SCENARIO} from './scenario.mjs';
const room=id=>SCENARIO.rooms[id];
const soundGate=(from,to)=>new Set([from,to]).has('utility')&&new Set([from,to]).has('shed');
export const ZONE_LIGHTING=Object.freeze({
 control:'dim',lobby:'dim',utility:'lit',shed:'dim',
 jungle:'dark',paddock:'dark',helipad:'dark'
});
export function exitsForCreature(location,{shedDoorBreached=false}={}){
 if(!room(location))return [];
 return room(location).exits.filter(other=>room(other) &&
   (!soundGate(location,other)||shedDoorBreached));
}
export function creatureRoute(from,to,{shedDoorBreached=false}={}){
 if(!room(from)||!room(to))return null;
 if(from===to)return [from];
 const pending=[[from]],seen=new Set([from]);
 while(pending.length){
  const path=pending.shift();
  for(const next of exitsForCreature(path.at(-1),{shedDoorBreached})){
   if(seen.has(next))continue;
   const nextPath=[...path,next];
   if(next===to)return nextPath;
   seen.add(next);pending.push(nextPath);
  }
 }
 return null;
}
// Reinforced secured maintenance door attenuates sound; it cannot be crossed
// by an unassisted animal before the barrier is mechanically breached.
export function effectiveNoiseDistance(from,to,{shedDoorBreached=false}={}){
 if(!room(from)||!room(to))return Infinity;
 if(from===to)return 0;
 const pending=[[from,0]],cost=new Map([[from,0]]);
 while(pending.length){
  pending.sort((a,b)=>a[1]-b[1]);
  const [node,d]=pending.shift();
  if(node===to)return d;
  if(d!==cost.get(node))continue;
  for(const next of room(node).exits){
   const barrier=soundGate(node,next)&&!shedDoorBreached?2:0;
   const nd=d+1+barrier;
   if(nd<(cost.get(next)??Infinity)){cost.set(next,nd);pending.push([next,nd]);}
  }
 }
 return Infinity;
}
export function hearNoise(creatureLocation,sourceLocation,loudness,{shedDoorBreached=false}={}){
 if(!Number.isInteger(loudness)||loudness<0||loudness>8)throw new RangeError('Invalid sound intensity.');
 const distance=effectiveNoiseDistance(creatureLocation,sourceLocation,{shedDoorBreached});
 return {heard:loudness>0&&distance<=loudness,distance,
   intensity:Math.max(0,loudness-distance)};
}
export function pursuitStep(dinosaur,{shedDoorBreached=false}={}){
 if(!room(dinosaur?.location))throw new RangeError('Unknown dinosaur zone.');
 if(!dinosaur.lastHeard||!room(dinosaur.lastHeard)||dinosaur.alert<=0)
  return {location:dinosaur.location,arrived:false,blocked:false,tracking:false};
 const route=creatureRoute(dinosaur.location,dinosaur.lastHeard,{shedDoorBreached});
 if(!route)return {location:dinosaur.location,arrived:false,blocked:true,tracking:true};
 return {location:route[1]||route[0],arrived:route.length<=2,
   blocked:false,tracking:true};
}
export function roomIsDark(id){return ZONE_LIGHTING[id]==='dark';}
export const LIGHT_CAPACITY_STRETCHES=12;
export function actorOwnsLight(actor){
 return [...(actor?.inventory||[]),...(actor?.gear||[])].some(x=>
  x==='flashlight'||x==='working flashlight'||x==='headlamp');
}
// Old v3 saves had automatically lit carried lamps. Preserve that until toggled.
export function actorHasLight(actor){
 return actorOwnsLight(actor)&&(!actor.light||(actor.light.on===true&&actor.light.charge>0));
}
// A luminous device is detectable only in the predator's dark zone or across
// one legal, unobstructed map exit. No remote or through-door vision.
export function visibleLampZone(dinosaurZone,actors,options={}){
 const zones=new Set([dinosaurZone,...exitsForCreature(dinosaurZone,options)]);
 return actors.find(a=>!a.dead&&roomIsDark(a.location)&&zones.has(a.location)&&actorHasLight(a))?.location||null;
}
