// 008-B2 — connections between actual discoveries and subsequent scenes.
// Original Jurassic authoring using the existing Evolved skill/observation
// system; no new rules for dice, creature positions or simulation clocks.
export const GENERATOR_DIAGNOSIS='control:consoles';
export const JUNGLE_TRACK_DISCOVERY='jungle:tracks';

export function hasObserved(actor,id){
 return Boolean(actor&&Array.isArray(actor.observed)&&actor.observed.includes(id));
}
// A successful, paid Observation investigation can meaningfully inform a
// later Heavy Machinery action. The benefit is one ordinary situational
// Evolved-style modifier (+1 die) and does not guarantee success.
export function generatorPreparation(state,actor){
 const ready=Boolean(state&&actor&&actor.location==='shed'&&
   !state.flags?.power&&hasObserved(actor,GENERATOR_DIAGNOSIS));
 return {ready,skill:'heavy_machinery',modifier:ready?1:0,
   source:ready?GENERATOR_DIAGNOSIS:null};
}
// Project only committed and genuinely observable consequences to the
// current character; no disclosure of another actor's private research.
export function localSceneConsequences(state,actor){
 if(!state||!actor)return [];
 const out=[];
 if(actor.location==='shed'&&!state.flags?.power&&hasObserved(actor,GENERATOR_DIAGNOSIS))
  out.push({id:'prepared-generator',text:'The control-room diagnostic you studied identifies the auxiliary start sequence (+1 Heavy Machinery die).'});
 if(actor.location==='jungle'&&hasObserved(actor,JUNGLE_TRACK_DISCOVERY))
  out.push({id:'studied-tracks',text:'You remember the rain-softened track evidence; it does not establish where an animal is now.'});
 if(actor.location==='paddock'&&state.flags?.paddockGateBraced===true)
  out.push({id:'braced-gate',text:'The previously damaged service gate is now braced. This visible repair persists for anyone who visits.'});
 if(actor.location==='paddock'&&state.flags?.paddockGateBraced!==true&&
   (state.dangerRecords||[]).some(r=>r.actorId===actor.id&&r.id==='brace-paddock-gate'&&!r.success))
  out.push({id:'gate-failure',text:'You remember the clang from your unsuccessful attempt. The gate remains unsecured.'});
 if(actor.location==='control'&&state.flags?.distress===true)
  out.push({id:'call-sent',text:'The transmitted distress call is a genuine completed mission milestone. The helipad beacon is still needed.'});
 return out;
}
