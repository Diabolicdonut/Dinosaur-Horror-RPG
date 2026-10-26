// 009-C2: reusable, data-driven physically present supporting cast.
// NPC notes are not executable scripts; source checks and committed actions own consequences.
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
      'variant','topics'])||!key(npc.id)||ids.has(npc.id)||!prose(npc.name)||
      !prose(npc.role)||!prose(npc.description)||!prose(npc.motive)||
      !def.rooms[npc.location]||!['cooperative','cautious','reserved'].includes(npc.stance)||
      (npc.variant!==undefined&&!variantValid(def,npc.variant))||
      !Array.isArray(npc.topics)||npc.topics.length<1||npc.topics.length>12)
   bad('NPC identity, location and motive');
  ids.add(npc.id);
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
export function validSupportingCastState(compiled,s){
 const introduced=compiled.definition.supportingCast;
 if(introduced===undefined)return s.supportingCast===undefined&&s.conversationRecords===undefined;
 const initial=initialSupportingCast(compiled);
 if(!Array.isArray(s.supportingCast)||JSON.stringify(s.supportingCast)!==JSON.stringify(initial)||
    !Array.isArray(s.conversationRecords)||s.conversationRecords.length>160)
  return false;
 const seen=new Set();
 let last=-1;
 return s.conversationRecords.every(r=>{
  const npc=s.supportingCast.find(n=>n.id===r?.npcId);
  const source=compiled.definition.supportingCast.find(n=>n.id===r?.npcId);
  const topic=source?.topics.find(t=>t.id===r?.topicId);
  if(!npc||!topic||!selected(compiled,topic)||
     !s.actors.some(a=>a.id===r.actorId)||!Number.isSafeInteger(r.beat)||
     r.beat<0||r.beat> s.beat||r.beat<last||
     r.location!==npc.location||
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
