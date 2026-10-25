// 008-B3 — one authored, physically situated, non-combat dinosaur encounter
// and actor-to-actor conversation. These are original scenario events, not
// persistent wildlife populations or free mechanical stress cures.
import {weatherAt} from './dinosaur-environment.mjs';
import {SCENARIO} from './scenario.mjs';

const TOPICS=Object.freeze({
 'check-in':'Check on one another',
 'plan':'Agree on the next step'
});
export const WILDLIFE_ENCOUNTER=Object.freeze({
 id:'jungle-parasaurolophus',
 location:'jungle',
 kind:'Parasaurolophus',
 title:'At the jungle stream',
 description:'Across the shallow drainage stream, a lone Parasaurolophus lifts its head from the ferns. The muddy bank separates it from the service path. It is alert but not threatening; there is room to observe or leave it undisturbed.'
});
const oldWildlife=()=>({status:'present',seenBy:[],approachedBy:[],reason:null});
export const wildlifeState=s=>s?.wildlifeEncounter||oldWildlife();
export function validWildlifeState(s){
 const w=s?.wildlifeEncounter;
 if(w===undefined)return true;
 if(!w||!['present','withdrawn'].includes(w.status)||
  !Array.isArray(w.seenBy)||!Array.isArray(w.approachedBy)||
  ![null,'disturbed','predator'].includes(w.reason)||
  w.seenBy.length>8||w.approachedBy.length>8||
  new Set(w.seenBy).size!==w.seenBy.length||
  new Set(w.approachedBy).size!==w.approachedBy.length||
  w.seenBy.some(id=>!s.actors.some(a=>a.id===id))||
  w.approachedBy.some(id=>!s.actors.some(a=>a.id===id))||
  w.approachedBy.some(id=>!w.seenBy.includes(id))||
  (w.status==='present'&&w.reason!==null)||
  (w.status==='withdrawn'&&w.reason===null))return false;
 return true;
}
export function wildlifeAvailable(s,actor){
 const w=wildlifeState(s);
 if(!s||!actor||s.outcome!=='playing'||actor.location!=='jungle'||
  s.combat?.active||actor.dead||actor.broken||actor.pendingSkip||
  weatherAt(s)==='squall'||w.status!=='present'||
  (s.dinosaurs||[]).some(d=>!d.defeated&&d.location==='jungle'))return [];
 const out=[];
 if(!w.seenBy.includes(actor.id))
  out.push({id:'watch',label:'Observe the Parasaurolophus from the path',skill:null});
 if(!w.approachedBy.includes(actor.id))
  out.push({id:'approach',label:'Approach slowly without crossing the stream',skill:'mobility'});
 return out;
}
export function dialogueAvailable(s,actor){
 if(!s||!actor||s.outcome!=='playing'||s.combat?.active||
  actor.dead||actor.broken||actor.pendingSkip)return [];
 return s.actors.filter(other=>other.id!==actor.id&&
  other.location===actor.location&&!other.dead&&!other.broken)
 .flatMap(other=>Object.entries(TOPICS)
  .filter(([topic])=>!(s.dialogueRecords||[]).some(r=>
   r.actorId===actor.id&&r.recipientId===other.id&&r.topic===topic))
  .map(([topic,label])=>({recipientId:other.id,recipientName:other.name,topic,label})));
}
export function dialogueText(s,actor,other,topic){
 if(topic==='check-in')return other.health<other.healthMax||
  other.criticalInjuries?.length?'The two survivors assess injuries and agree not to leave anyone behind. No wound has been medically treated by this conversation.':
  other.stress>0?'The survivors admit the strain of the island and listen to one another. Their Stress scores remain governed by Evolved mechanics.':
  'The survivors exchange a quiet word and confirm they are ready to continue together.';
 if(topic==='plan')return s.flags?.distress?
  'They agree that reaching the helipad and activating its real beacon is the next objective.':
  s.flags?.power?
  'They agree to return to a powered radio and transmit the distress call.':
  'They agree that restoring auxiliary power is the most useful next step.';
 return null;
}
export function validDialogueRecords(s){
 if(s?.dialogueRecords===undefined)return true;
 const rows=s.dialogueRecords;
 if(!Array.isArray(rows)||rows.length>s.actors.length*(s.actors.length-1)*2)return false;
 const seen=new Set();
 return rows.every(r=>{
  if(!r||!TOPICS[r.topic]||!s.actors.some(a=>a.id===r.actorId)||
   !s.actors.some(a=>a.id===r.recipientId)||r.actorId===r.recipientId||
   !Number.isSafeInteger(r.beat)||r.beat<0||r.beat>s.beat||
   !SCENARIO.rooms[r.zone])return false;
  const key=r.actorId+':'+r.recipientId+':'+r.topic;
  if(seen.has(key))return false;
  seen.add(key);return true;
 });
}
export function localWildlifeView(s,actor){
 const w=wildlifeState(s);
 return actor.location==='jungle'&&w.status==='withdrawn'&&w.seenBy.includes(actor.id)?
  {status:'withdrawn',description:w.reason==='predator'?
   'The Parasaurolophus moved away after the predator approached the stream.':
   'The Parasaurolophus retreated through the ferns after being startled.'}:null;
}
