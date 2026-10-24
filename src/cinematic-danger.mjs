// 008-B1: a bounded original Jurassic physical danger challenge and the
// non-scripted dramatic act of the current incident. No GM-only state exposed.
export const CINEMATIC_DANGERS=Object.freeze({
 'brace-paddock-gate':Object.freeze({
  id:'brace-paddock-gate',zone:'paddock',title:'Secure the damaged paddock gate',
  skill:'heavy_machinery',context:'gate_brace',
  success:'The survivor braces the loose gate against the support frame. The metal stops swinging in the wind.',
  failure:'The bent gate slips from their grip. Metal strikes metal with a loud clang along the perimeter.',
  successFlag:'paddockGateBraced',successNoise:0,failureNoise:3
 })
});
export function currentCinematicAct(s){
 if(s?.outcome==='rescued'||s?.flags?.beacon)
  return {number:3,title:'The Way Out',theme:'resolution',
   objective:'The emergency beacon is active. The rescue outcome follows committed game state.'};
 if(s?.flags?.distress)
  return {number:3,title:'The Last Signal',theme:'sci-fi-action',
   objective:'Reach the emergency helipad and activate the beacon.'};
 if(s?.flags?.power)
  return {number:2,title:'The Broken Perimeter',theme:'suspense',
   objective:'Send a distress call; investigate or avoid the island dangers along the way.'};
 return {number:1,title:'The Silent Park',theme:'investigation',
  objective:'Find staff access, restore auxiliary power, and decide how to proceed.'};
}
export function dangerAllowed(s,actor,id){
 const d=CINEMATIC_DANGERS[id];
 return Boolean(s&&actor&&d&&s.outcome==='playing'&&actor.location===d.zone&&
  !s.combat?.active&&!actor.dead&&!actor.broken&&!actor.pendingSkip&&
  s.flags?.[d.successFlag]!==true&&
  !(s.dangerRecords||[]).some(r=>r.actorId===actor.id&&r.id===id));
}
export function availableDangerEvents(s,actor){
 return Object.values(CINEMATIC_DANGERS).filter(d=>dangerAllowed(s,actor,d.id))
  .map(d=>({id:d.id,title:d.title,skill:d.skill}));
}
export function validDangerRecords(s){
 if(s.dangerRecords===undefined)return true;
 if(!Array.isArray(s.dangerRecords)||s.dangerRecords.length>s.actors.length*Object.keys(CINEMATIC_DANGERS).length)return false;
 const seen=new Set();
 return s.dangerRecords.every(r=>{
  const d=CINEMATIC_DANGERS[r?.id];
  const key=r?.actorId+':'+r?.id;
  if(!d||!s.actors.some(a=>a.id===r.actorId)||r.zone!==d.zone||
   typeof r.success!=='boolean'||!Number.isSafeInteger(r.beat)||r.beat<0||r.beat>s.beat||
   !Number.isSafeInteger(r.successes)||r.successes<0||r.successes>30||
   seen.has(key))return false;
  seen.add(key);return true;
 });
}
