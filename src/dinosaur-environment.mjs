// 007-L2b2: one authored mechanical shutter and one scripted storm squall.
// Derived entirely from accepted scenario flags/exploration time. No RNG,
// no island-wide weather engine, no creature spawner and no hidden GM fiat.
const OUTSIDE=Object.freeze(['jungle','paddock','helipad']);
export const SHUTTER_ZONES=Object.freeze(['shed','jungle']);
export const serviceShutterClosed=state=>state?.flags?.serviceShutterClosed===true;
export function weatherAt(state){
 const stretch=state?.clock?.explorationStretches??0;
 // A single storm-band event in the existing After the Storm incident,
 // framed in exploration stretches; combat rounds do not advance it.
 return Number.isSafeInteger(stretch)&&stretch>=2&&stretch<4?'squall':'rain';
}
export function sightContext(state){
 return {
  shedDoorBreached:Boolean(state?.flags?.shedBarrierBreached),
  serviceShutterClosed:serviceShutterClosed(state),
  squall:weatherAt(state)==='squall'
 };
}
export const shutterEdge=(from,to)=>SHUTTER_ZONES.includes(from)&&
 SHUTTER_ZONES.includes(to)&&from!==to;
export const shutterBlocks=(state,from,to)=>serviceShutterClosed(state)&&shutterEdge(from,to);
export const outdoorWeather=(state,zone)=>OUTSIDE.includes(zone)?weatherAt(state):null;
