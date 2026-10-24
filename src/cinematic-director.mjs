// Checkpoint 008-A — bounded Cinematic scene events and encounter pressure.
// An original Jurassic scene adapter using Alien Evolved exploration-style d6
// pressure; NOT a complete Last Survivor timer or an autonomous Game Mother.
// Only party-engine may commit a validated scene event or a pressure check.
import {SCENARIO} from './scenario.mjs';
import {weatherAt,sightContext} from './dinosaur-environment.mjs';
import {creatureRoute,hearNoise} from './dinosaur-pursuit.mjs';
import {rollDicePool} from './evolved-encounters.mjs';

export const CINEMATIC_EVENTS=Object.freeze({
 'control-dead-air':Object.freeze({zone:'control',title:'Dead Air',theme:'investigation',condition:'power_off',
  text:'Beyond the reinforced windows, rain has swallowed the jungle. The silent consoles offer no answers until someone restores power.'}),
 'lobby-exhibits':Object.freeze({zone:'lobby',title:'An Impossible History',theme:'wonder',condition:'always',
  text:'Water trickles between the towering fossil displays. For a moment, their scale inspires curiosity rather than fear.'}),
 'shed-power-hum':Object.freeze({zone:'shed',title:'The Power Returns',theme:'recovery',condition:'power_on',
  text:'The generator hum steadies. This small island of electric light offers a chance to confer before moving on.'}),
 'jungle-squall':Object.freeze({zone:'jungle',title:'Curtain of Rain',theme:'suspense',condition:'squall',
  text:'A sudden sheet of rain blurs the canopy beyond the path. The storm conceals the distance; it does not reveal what might be there.'}),
 'paddock-fence':Object.freeze({zone:'paddock',title:'The Failed Perimeter',theme:'investigation',condition:'always',
  text:'The torn mesh and empty warning signs show how much of the park depended on electricity. Nothing in the marks tells you where an animal is now.'}),
 'helipad-valley':Object.freeze({zone:'helipad',title:'Giants in the Valley',theme:'wonder',condition:'valley_visible',
  text:'Across the distant valley, long-necked herbivores browse above the treeline. They remain far beyond this encounter zone; the sight is worth remembering.'}),
 'helipad-readiness':Object.freeze({zone:'helipad',title:'Awaiting a Rescue',theme:'recovery',condition:'signal_sent',
  text:'The distress call has been sent. The beacon still needs to be activated; the open pad offers a moment to prepare.'})
});
const OUTDOOR=new Set(['jungle','paddock','helipad']);
export const PRESSURE_LABELS=Object.freeze(['All clear','Uncertain','Suspected','Confirmed signs','Closing','At the edge']);
export function eventAllowed(state,actor,id){
 const event=CINEMATIC_EVENTS[id];
 if(!state||!actor||!event||event.zone!==actor.location||state.outcome!=='playing'||
    state.combat?.active||actor.dead||actor.broken||actor.pendingSkip)return false;
 if((state.sceneRecords||[]).some(x=>x.actorId===actor.id&&x.id===id))return false;
 switch(event.condition){
  case 'always':return true;
  case 'power_off':return !state.flags?.power;
  case 'power_on':return state.flags?.power===true;
  case 'squall':return weatherAt(state)==='squall';
  case 'valley_visible':return weatherAt(state)!=='squall';
  case 'signal_sent':return state.flags?.distress===true&&!state.flags?.beacon;
  default:return false;
 }
}
export function availableSceneEvents(state,actor){
 if(!actor)return [];
 return Object.entries(CINEMATIC_EVENTS).filter(([id])=>eventAllowed(state,actor,id))
  .map(([id,e])=>({id,title:e.title,theme:e.theme}));
}
export function validSceneRecords(state){
 if(state.sceneRecords===undefined)return true;
 if(!Array.isArray(state.sceneRecords)||state.sceneRecords.length>Object.keys(CINEMATIC_EVENTS).length*8)return false;
 const seen=new Set();
 return state.sceneRecords.every(x=>{
  if(!x||typeof x.actorId!=='string'||!state.actors?.some(a=>a.id===x.actorId)||
    !CINEMATIC_EVENTS[x.id]||CINEMATIC_EVENTS[x.id].zone!==x.zone||
    !Number.isSafeInteger(x.beat)||x.beat<0||x.beat>state.beat)return false;
  const key=x.actorId+':'+x.id;if(seen.has(key))return false;
  seen.add(key);return true;
 });
}
export function validScenePressure(state){
 if(state.scenePressure===undefined)return true;
 if(!Array.isArray(state.scenePressure)||state.scenePressure.length>8)return false;
 const seen=new Set();
 return state.scenePressure.every(p=>{
  if(!p||typeof p.actorId!=='string'||!state.actors?.some(a=>a.id===p.actorId)||
    seen.has(p.actorId)||!Number.isSafeInteger(p.level)||p.level<0||p.level>5||
    !Number.isSafeInteger(p.checks)||p.checks<0||
    !Number.isSafeInteger(p.lastBeat)||p.lastBeat<0||p.lastBeat>state.beat)return false;
  seen.add(p.actorId);return true;
 });
}
export function pressureForActor(state,actorId){
 const saved=state.scenePressure?.find(x=>x.actorId===actorId);
 return {level:saved?.level||0,label:PRESSURE_LABELS[saved?.level||0],checks:saved?.checks||0};
}
// This is an original, opt-in-to-the-scenario pressure adaptation: d6 faces
// of 1 increment a bounded narrative clock. It NEVER spawns, teleports,
// forces attack or awards stress. No extra global RNG draws or off-map data.
export function checkScenePressure(state,actor,kind){
 if(!state||!actor||!OUTDOOR.has(actor.location)||
   !['move','sneak','rush','investigate','wait'].includes(kind)||
   state.combat?.active)return null;
 const p=pressureForActor(state,actor.id),before=p.level;
 const pool=Math.max(0,Math.min(6,1+before+(kind==='rush'?1:kind==='sneak'?-1:0)));
 const identity=Number(actor.id.replace(/[^0-9]/g,''))||1;
 const seed=(state.initialSeed^Math.imul(state.beat+1,0x9e3779b9)^Math.imul(identity,0x85ebca6b))>>>0;
 const faces=pool?rollDicePool(pool,seed).faces:[];
 const advances=faces.filter(n=>n===1).length;
 const level=Math.min(5,before+advances);
 // Only a real, active creature reachable through a legal one-edge passage
 // can support a nearby dinosaur noise cue. No hidden location is exposed.
 const d=state.dinosaurs?.[0],ctx=sightContext(state);
 const near=Boolean(d&&!d.defeated&&
  (()=>{
   const path=creatureRoute(actor.location,d.location,ctx);
   return path&&path.length<=2&&hearNoise(actor.location,d.location,1,ctx).heard;
  })());
 return {before,level,pool,faces,advances,actorId:actor.id,
  audibleCue:before<5&&level===5&&near};
}
