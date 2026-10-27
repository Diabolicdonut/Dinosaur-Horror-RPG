// 009-C2: reusable, data-driven physically present supporting cast.
// NPC notes are not executable scripts; source checks and committed actions own consequences.
import {detectCreature,DINO_SPECIES} from './evolved-encounters.mjs';
const key=x=>typeof x==='string'&&/^[a-z][a-z0-9_-]{1,63}$/.test(x);
const prose=x=>typeof x==='string'&&x.trim().length>0&&x.length<=700;
const keys=(x,allowed)=>x&&typeof x==='object'&&!Array.isArray(x)&&
 Object.keys(x).every(k=>allowed.includes(k));
const copy=x=>JSON.parse(JSON.stringify(x));
function bad(s){throw new RangeError('Invalid supporting cast: '+s);}
function variantValid(def,v){return keys(v,['slot','choice'])&&
 Object.keys(v).length===2&&def.variants?.[v.slot]?.some(o=>o.id===v.choice);}
function triggerValid(def,v){
 if(!keys(v,['kind','id'])||!['objective','scene'].includes(v.kind)||!key(v.id))
  return false;
 return v.kind==='objective'?def.objectives.some(o=>o.id===v.id):
  Boolean(def.cinematic?.events.some(e=>e.id===v.id));
}
export function validateSupportingCastDefinition(def){
 if(def.supportingCast===undefined)return true;
 if(!Array.isArray(def.supportingCast)||def.supportingCast.length>12)
  bad('cast collection');
 const ids=new Set();
 for(const npc of def.supportingCast){
  if(!keys(npc,['id','name','role','description','location','motive','stance',
      'variant','topics','autonomy','dangerResponse'])||!key(npc.id)||ids.has(npc.id)||!prose(npc.name)||
      !prose(npc.role)||!prose(npc.description)||!prose(npc.motive)||
      !def.rooms[npc.location]||!['cooperative','cautious','reserved'].includes(npc.stance)||
      (npc.variant!==undefined&&!variantValid(def,npc.variant))||
      !Array.isArray(npc.topics)||npc.topics.length<1||npc.topics.length>12)
   bad('NPC identity, location and motive');
  ids.add(npc.id);
  if(npc.autonomy!==undefined){
   const a=npc.autonomy;
   if(!keys(a,['kind','trigger','path','cadence'])||
    a.kind!=='return_route'||!triggerValid(def,a.trigger)||a.trigger.kind!=='objective'||
    !Array.isArray(a.path)||a.path.length<2||a.path.length>12||
    a.path[0]!==npc.location||!Number.isInteger(a.cadence)||
    a.cadence<1||a.cadence>4||new Set(a.path).size!==a.path.length||
    a.path.some(room=>!def.rooms[room])||
    a.path.slice(1).some((room,i)=>!def.rooms[a.path[i]].exits.includes(room)))
    bad('autonomous NPC route must be source-authorized, contiguous and event-triggered');
  }
  if(npc.dangerResponse!==undefined){
   const a=npc.dangerResponse;
   if(!keys(a,['kind','exit','wits','observation'])||
    a.kind!=='withdraw_on_sighting'||!def.rooms[npc.location].exits.includes(a.exit)||
    !Number.isInteger(a.wits)||a.wits<2||a.wits>5||
    !Number.isInteger(a.observation)||a.observation<0||a.observation>3||
    npc.autonomy!==undefined)
    bad('NPC observed danger response must be a bounded one-edge Evolved reaction');
  }
  const topics=new Set();
  for(const topic of npc.topics){
   if(!keys(topic,['id','prompt','reply','requires','variant'])||
     !key(topic.id)||topics.has(topic.id)||!prose(topic.prompt)||
     !prose(topic.reply)||topic.reply.length>500||
     (topic.requires!==undefined&&!triggerValid(def,topic.requires))||
     (topic.variant!==undefined&&!variantValid(def,topic.variant)))
    bad('NPC topic or unsupported disclosure condition');
   topics.add(topic.id);
  }
 }
 return true;
}
function selected(compiled,item){
 return !item.variant||
  compiled.hiddenFacts?.[item.variant.slot]?.id===item.variant.choice;
}
function eventOccurred(s,trigger){
 if(!trigger)return true;
 return trigger.kind==='objective'?
  s.objectiveRecords?.some(x=>x.id===trigger.id):
  s.cinematicRecords?.some(x=>x.id===trigger.id);
}
export function initialSupportingCast(compiled){
 return (compiled.definition.supportingCast||[]).filter(npc=>selected(compiled,npc))
  .map(npc=>({id:npc.id,location:npc.location,status:'present'}));
}
// One roster round is a shared exploration interval. Every NPC reaction is
// reconstructed from the immutable authored adventure, seed and Evolved check:
// no model-generated dice, arbitrary NPC movement, free injury or remote lore.
const mix=x=>{x=(x^(x>>>16))>>>0;x=Math.imul(x,0x7feb352d)>>>0;
 x=(x^(x>>>15))>>>0;x=Math.imul(x,0x846ca68b)>>>0;
 return (x^(x>>>16))>>>0;};
function sightSeed(s,id,tick){
 let h=2166136261;
 for(const char of id){h^=char.charCodeAt(0);h=Math.imul(h,16777619);}
 return mix(((s.initialSeed>>>0)^(h>>>0)^Math.imul(tick,0x9e3779b9))>>>0);
}
function localSourcePredator(compiled,location,round){
 for(const d of compiled.definition.initialCreatures){
  if(d.disposition!=='predatory'||
     (d.when&&compiled.hiddenFacts?.[d.when.slot]?.id!==d.when.choice)||
     !DINO_SPECIES[d.species])continue;
  // Patrol reconstruction cannot be driven by an unverified saved field.
  const hops=d.patrol?Math.floor((round-1)/d.patrol.cadence)+1:0;
  const room=d.patrol?d.patrol.path[hops%d.patrol.path.length]:d.location;
  if(room===location)return d;
 }
 return null;
}
function expectedAutonomy(compiled,s){
 const live=initialSupportingCast(compiled),positions=Object.fromEntries(
  live.map(n=>[n.id,n.location])),records=[],dangerRecords=[];
 const members=s.actors?.length??0;
 if(members<1||!Number.isSafeInteger(s.beat)||s.beat<0)return null;
 for(let tick=members;tick<=s.beat;tick+=members){
  if(s.outcome!=='playing'&&tick===s.beat)continue;
  const round=tick/members;
  for(const n of live){
   const source=compiled.definition.supportingCast.find(x=>x.id===n.id);
   const danger=compiled.revision>=12?source.dangerResponse:null;
   const from=positions[n.id];
   if(danger){
    const predator=localSourcePredator(compiled,from,round);
    if(predator){
     const seed=sightSeed(s,n.id,tick);
     const npcActor={id:n.id,attributes:{wits:danger.wits,strength:2,agility:2,empathy:2},
      skills:{observation:danger.observation},stress:0,resolve:2};
     const roll=detectCreature(npcActor,{seed,
      observationDice:DINO_SPECIES[predator.species].observation,cluttered:true});
     const seesFirst=roll.outcome==='human_sees_first';
     const to=seesFirst?danger.exit:from;
     dangerRecords.push({id:n.id,beat:tick,creatureId:predator.id,
      from,to,seed,awareness:roll.outcome,action:seesFirst?'withdraw':'hold'});
     positions[n.id]=to;
     continue; // no second, route movement during one NPC response.
    }
   }
   const a=source.autonomy;
   if(!a||(round-1)%a.cadence!==0||
    !s.objectiveRecords?.some(r=>a.trigger.kind==='objective'?
      r.id===a.trigger.id&&r.beat<tick:false))continue;
   const index=a.path.indexOf(from);
   if(index<0)return null;
   if(index===a.path.length-1)continue;
   const to=a.path[index+1];
   records.push({id:n.id,from,to,beat:tick});
   positions[n.id]=to;
  }
 }
 return {positions,records,dangerRecords};
}
function locationAt(compiled,s,id,beat){
 let location=initialSupportingCast(compiled).find(n=>n.id===id)?.location;
 const records=[...(s.npcAutonomyRecords||[]),...(s.npcDangerRecords||[])];
 for(const r of records.filter(r=>r.id===id&&r.beat<=beat)
   .sort((a,b)=>a.beat-b.beat))location=r.to;
 return location;
}
export function advanceSupportingCast(compiled,previous){
 if(!compiled.definition.supportingCast?.some(n=>n.autonomy||
  (compiled.revision>=12&&n.dangerResponse)))return previous;
 if(previous.outcome!=='playing'||!previous.beat||
  previous.beat%previous.actors.length!==0)return previous;
 const projected=expectedAutonomy(compiled,previous);
 if(!projected||!Array.isArray(previous.npcAutonomyRecords)||
  previous.npcAutonomyRecords.length>projected.records.length||
  JSON.stringify(previous.npcAutonomyRecords)!==
   JSON.stringify(projected.records.slice(0,previous.npcAutonomyRecords.length)))
  throw new RangeError('NPC movement history is inconsistent before the completed round.');
 if(compiled.revision>=12&&(!Array.isArray(previous.npcDangerRecords)||
   previous.npcDangerRecords.length>projected.dangerRecords.length||
   JSON.stringify(previous.npcDangerRecords)!==
    JSON.stringify(projected.dangerRecords.slice(0,previous.npcDangerRecords.length))))
  throw new RangeError('NPC observation history is inconsistent before the completed round.');
 const s=copy(previous);
 const pending=projected.records.slice(s.npcAutonomyRecords.length);
 for(const record of pending){
  const npc=s.supportingCast.find(n=>n.id===record.id);
  npc.location=record.to;
  s.npcAutonomyRecords.push(record);
  const author=compiled.definition.supportingCast.find(n=>n.id===npc.id);
  // Never reveal remote NPC movement through the player's scene log.
  const observers=s.actors.filter(actor=>!actor.dead&&
   (actor.location===record.from||actor.location===record.to));
  for(const observer of observers)
   s.events.push({beat:s.beat,actorId:observer.id,category:'scene',
    message:author.name+(observer.location===record.to?
     ' arrives from the adjoining trail.':' heads along the adjoining trail.')});
 }
 if(compiled.revision>=12){
  for(const record of projected.dangerRecords.slice(s.npcDangerRecords.length)){
   const npc=s.supportingCast.find(n=>n.id===record.id);
   const source=compiled.definition.supportingCast.find(n=>n.id===record.id);
   npc.location=record.to;
   s.npcDangerRecords.push(record);
   // Seen danger is not remotely broadcast and cannot move a survivor.
   if(record.action==='withdraw')
    for(const observer of s.actors.filter(a=>!a.dead&&a.location===record.from))
     s.events.push({beat:record.beat,actorId:observer.id,category:'danger',
      message:source.name+' spots a predator and retreats along the adjoining trail.'});
   if(record.action==='withdraw')
    for(const observer of s.actors.filter(a=>!a.dead&&a.location===record.to))
     s.events.push({beat:record.beat,actorId:observer.id,category:'scene',
      message:source.name+' arrives from the adjoining trail.'});
  }
 }
 s.events=s.events.slice(-160);
 return s;
}
export function validSupportingCastState(compiled,s){
 const introduced=compiled.definition.supportingCast;
 if(introduced===undefined)return s.supportingCast===undefined&&s.conversationRecords===undefined;
 const initial=initialSupportingCast(compiled);
 const modern=compiled.revision>=11;
 const dangerEnabled=compiled.revision>=12;
 const movement=modern?expectedAutonomy(compiled,s):null;
 if(!Array.isArray(s.supportingCast)||
    !Array.isArray(s.conversationRecords)||s.conversationRecords.length>160||
    (modern?(!movement||!Array.isArray(s.npcAutonomyRecords)||
       s.npcAutonomyRecords.length>2000||
       JSON.stringify(s.npcAutonomyRecords)!==JSON.stringify(movement.records)||
       (dangerEnabled?(!Array.isArray(s.npcDangerRecords)||
         s.npcDangerRecords.length>2000||
         JSON.stringify(s.npcDangerRecords)!==JSON.stringify(movement.dangerRecords)):
         s.npcDangerRecords!==undefined)||
       JSON.stringify(s.supportingCast)!==JSON.stringify(initial.map(n=>({
        ...n,location:movement.positions[n.id]
       })))) :
       (s.npcAutonomyRecords!==undefined||s.npcDangerRecords!==undefined||
        JSON.stringify(s.supportingCast)!==JSON.stringify(initial))))
  return false;
 const seen=new Set();
 let last=-1;
 return s.conversationRecords.every(r=>{
  const npc=s.supportingCast.find(n=>n.id===r?.npcId);
  const source=compiled.definition.supportingCast.find(n=>n.id===r?.npcId);
  const topic=source?.topics.find(t=>t.id===r?.topicId);
  if(!npc||!topic||!selected(compiled,topic)||!eventOccurred(s,topic.requires)||
     !s.actors.some(a=>a.id===r.actorId)||!Number.isSafeInteger(r.beat)||
     r.beat<0||r.beat> s.beat||r.beat<last||
     r.location!==(modern?locationAt(compiled,s,r.npcId,r.beat):npc.location)||
     Object.keys(r).some(k=>!['actorId','npcId','topicId','location','beat'].includes(k))||
     seen.has(r.actorId+':'+r.npcId+':'+r.topicId))return false;
  // History can exceed 200 actions; archived records older than the first retained
  // action are permitted, but newer records need an exact committed counterpart.
  const oldest=s.actions?.[0]?.beat??s.beat;
  if(r.beat>=oldest&&!s.actions.some(a=>a.kind==='npc'&&
    a.actorId===r.actorId&&a.target===r.npcId+':'+r.topicId&&
    a.beat===r.beat))return false;
  seen.add(r.actorId+':'+r.npcId+':'+r.topicId);
  last=r.beat;return true;
 });
}
export function localSupportingCast(compiled,s,actorId){
 const actor=s.actors.find(a=>a.id===actorId);
 if(!actor)return [];
 return (s.supportingCast||[]).filter(n=>n.status==='present'&&n.location===actor.location)
 .map(n=>{
  const source=compiled.definition.supportingCast.find(x=>x.id===n.id);
  const topics=source.topics.filter(t=>selected(compiled,t)&&eventOccurred(s,t.requires)&&
   !s.conversationRecords.some(r=>r.actorId===actor.id&&r.npcId===n.id&&r.topicId===t.id))
   .map(t=>({id:t.id,prompt:t.prompt}));
  return {id:n.id,name:source.name,role:source.role,
   description:source.description,stance:source.stance,topics};
 });
}
export function commitSupportingConversation(compiled,previous,{actorId,npcId,topicId}={}){
 const reject=reason=>({accepted:false,state:previous,reason});
 if(!validSupportingCastState(compiled,previous))
  return reject('Invalid supporting cast history.');
 const actor=previous.actors.find(a=>a.id===actorId);
 if(!actor||actor.dead||actor.broken||previous.outcome!=='playing'||previous.combat||
  previous.pendingPredatorResponse||previous.combatReaction)
  return reject('Conversation requires an available survivor outside combat.');
 const npc=localSupportingCast(compiled,previous,actorId).find(n=>n.id===npcId);
 const topic=npc?.topics.find(t=>t.id===topicId);
 if(!topic)return reject('No physically present person offers that conversation now.');
 const source=compiled.definition.supportingCast.find(n=>n.id===npcId);
 const words=source.topics.find(t=>t.id===topicId).reply;
 const next=copy(previous);
 next.conversationRecords.push({npcId,topicId,actorId,location:actor.location,beat:next.beat});
 next.actions.push({beat:next.beat,actorId,kind:'npc',target:npcId+':'+topicId});
 next.actions=next.actions.slice(-200);
 next.events.push({beat:next.beat,actorId,category:'scene',
  message:source.name+' speaks with '+actor.name+': '+words});
 next.events=next.events.slice(-160);
 return {accepted:true,state:next,result:{kind:'npc',npcId,topicId}};
}
