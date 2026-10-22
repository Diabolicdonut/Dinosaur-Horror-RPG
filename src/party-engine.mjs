// Party Incident 007-C — independent multi-character deterministic prototype.
// Legacy src/engine.mjs is intentionally not imported or changed.
// Party members are Evolved-valid actors. This bounded game prototype does not
// yet implement combat, autonomous companions, or complete Evolved time scales.
import { SCENARIO } from './scenario.mjs';
import { validateParty, makeParty } from './characters.mjs';
import { resolveSkillCheck } from './evolved-checks.mjs';

export const PARTY_ENGINE_VERSION = 2;
export const PARTY_SAVE_KIND = 'dinosaur-party-incident';
const own = (o,k) => Object.prototype.hasOwnProperty.call(o,k);
const deep = v => JSON.parse(JSON.stringify(v));
const normalizeSeed = seed => {
  const n=Number(seed);
  if (!Number.isSafeInteger(n)||n<0||n>4294967295)throw new RangeError('Seed must be 0–4294967295.');
  return n>>>0;
};
function nextSeed(s){
 let x=s.rng>>>0;
 x^=(x<<13)>>>0;x^=x>>>17;x^=(x<<5)>>>0;
 s.rng=x>>>0;
 return s.rng;
}
function dist(a,b) {
 if(a===b)return 0;
 const seen=new Set([a]),q=[[a,0]];
 while(q.length){const [p,d]=q.shift();for(const n of SCENARIO.rooms[p].exits){
  if(n===b)return d+1;
  if(!seen.has(n)){seen.add(n);q.push([n,d+1]);}
 }}
 return Infinity;
}
function stepToward(from,target){
 if(!SCENARIO.rooms[from]||!SCENARIO.rooms[target]||from===target)return from;
 return SCENARIO.rooms[from].exits.reduce((best,exit)=>
  dist(exit,target)<dist(best,target)?exit:best,SCENARIO.rooms[from].exits[0]);
}
function itemLabel(id) { return SCENARIO.itemNames[id]||id; }
function gameEvent(s,message,actorId=null,category='action'){
 s.events.push({beat:s.beat,actorId,category,message});
 s.events=s.events.slice(-160);
}
function nextTurn(s){
 s.cursor=(s.cursor+1)%s.actors.length;
 s.beat++;
 if(s.cursor===0)s.round++;
}
function dinoTick(s,noise,at) {
 const d=s.dinosaurs[0];
 // A dinosaur hears noise only within plausible map reach, never a remote action.
 if(noise>0&&dist(d.location,at)<=noise){
   d.lastHeard=at;
   d.alert=Math.min(4,d.alert+noise);
 }
 // Moving every second actor beat is an intentionally limited prototype behavior.
 if((s.beat+1)%2===0) {
   if(d.alert>0&&d.lastHeard&&d.location!==d.lastHeard) {
     d.location=stepToward(d.location,d.lastHeard);d.alert--;
   } else if(d.alert>0) d.alert--;
   else if(nextSeed(s)%3===0){
     const exits=SCENARIO.rooms[d.location].exits;
     d.location=exits[nextSeed(s)%exits.length];
   }
 }
 for(const person of s.actors) {
  if(person.location===d.location&&!person.hidden&&person.health>0){
   // Pending combat milestone: creature proximity produces stress, not invented lethal attacks.
   person.stress=Math.min(30,person.stress+1);
   if(person.location===at||person.id===s.actors[s.cursor].id)
     gameEvent(s,person.name+' sees a '+d.kind+' dangerously close. Stress increases.',person.id,'danger');
  }
 }
}
function matchRoom(target,room) {
 const raw=String(target||'').toLowerCase().replace(/^(to |the |into |toward |towards )+/,'').trim();
 return SCENARIO.rooms[room].exits.find(id=>id===raw||
  SCENARIO.rooms[id].name.toLowerCase()===raw||
  SCENARIO.rooms[id].aliases.some(name=>name.toLowerCase()===raw))||null;
}
function matchItem(target,items){
 const q=String(target||'').trim().toLowerCase().replace(/^the /,'');
 return items.find(id=>id===q||itemLabel(id).toLowerCase()===q)||null;
}
function matchFeature(target,location) {
 const q=String(target||'').trim().toLowerCase();
 return (SCENARIO.rooms[location].features||[]).find(id=>id===q)||null;
}
function matchObservation(target,location) {
 const q=String(target||'').trim().toLowerCase();
 return SCENARIO.rooms[location].observations?.find(o=>
   o.id===q||o.aliases?.includes(q))||null;
}
function accepted(s,actor,kind,target,extra={},noise=0) {
 const beat=s.beat;
 s.actions.push({beat,actorId:actor.id,kind,target,...extra});
 s.actions=s.actions.slice(-200);
 dinoTick(s,noise,actor.location);
 nextTurn(s);
 return {accepted:true,state:s,result:extra};
}
function rejected(before,why){
 return {accepted:false,state:before,reason:why};
}
export function newPartyIncident({seed=1993,roster=null}={}) {
 const n=normalizeSeed(seed),party=roster??makeParty({seed:n,size:3});
 const issues=validateParty(party);
 if(issues.length)throw new RangeError(issues.join(' '));
 const actors=deep(party).map(c=>({
  ...c,location:SCENARIO.start,health:c.healthMax,
  inventory:[],hidden:false,observed:[],stress:c.stress??0,
  stressResponses:c.stressResponses||[],panicResponses:[],
  lastAction:null
 }));
 actors[0].inventory.push(...SCENARIO.startItems);
 return {
  kind:PARTY_SAVE_KIND,version:PARTY_ENGINE_VERSION,scenario:SCENARIO.id,
  initialSeed:n,rng:n||0x9e3779b9,beat:0,round:1,cursor:0,outcome:'playing',
  actors,flags:{power:false,distress:false,beacon:false},
  rooms:Object.fromEntries(Object.entries(SCENARIO.rooms).map(([k,r])=>[k,{items:[...r.items]}])),
  dinosaurs:[{...SCENARIO.initialDinosaur,lastHeard:null}],
  events:[{beat:0,actorId:null,category:'system',message:'Emergency lighting holds. The surviving personnel gather in the control room.'}],
  actions:[]
 };
}
export function isPartySave(s) {
 if(!s||s.kind!==PARTY_SAVE_KIND||s.version!==PARTY_ENGINE_VERSION||
    s.scenario!==SCENARIO.id||!Number.isInteger(s.beat)||s.beat<0||
    !Number.isInteger(s.cursor)||!Array.isArray(s.actors)||s.actors.length<1||
    s.actors.length>8||s.cursor>=s.actors.length||
    !Number.isInteger(s.rng)||!s.rooms||!s.flags||!Array.isArray(s.actions)||
    !Array.isArray(s.events)||!Array.isArray(s.dinosaurs)||
    !SCENARIO.rooms[s.dinosaurs[0]?.location])return false;
 if(validateParty(s.actors).length)return false;
 return s.actors.every(a=>SCENARIO.rooms[a.location]&&Array.isArray(a.inventory)&&
   Array.isArray(a.observed)&&typeof a.health==='number'&&a.health>=0&&
   Number.isInteger(a.stress)&&a.stress>=0&&a.stress<=30)&&
   Object.keys(SCENARIO.rooms).every(id=>
     Array.isArray(s.rooms[id]?.items));
}
export function partyView(s,{actorId=null}={}) {
 if(!isPartySave(s))throw new RangeError('Invalid party incident save.');
 const actor=s.actors.find(x=>x.id===actorId)||s.actors[s.cursor];
 const place=SCENARIO.rooms[actor.location];
 return {
  beat:s.beat,round:s.round,outcome:s.outcome,actorId:actor.id,actorName:actor.name,
  activeActorId:s.actors[s.cursor].id,
  location:actor.location,roomName:place.name,description:place.description,
  exits:place.exits.map(id=>({id,name:SCENARIO.rooms[id].name})),
  items:s.rooms[actor.location].items.map(id=>({id,name:itemLabel(id)})),
  features:[...place.features],observations:(place.observations||[]).map(o=>({id:o.id})),
  visibleDinosaurs:s.dinosaurs.filter(d=>d.location===actor.location)
   .map(d=>d.kind),
  inventory:actor.inventory.map(id=>({id,name:itemLabel(id)})),
  health:actor.health,healthMax:actor.healthMax,stress:actor.stress,
  hidden:actor.hidden,flags:{...s.flags},
  actors:s.actors.map(a=>({id:a.id,name:a.name,career:a.career,location:a.location,
   roomName:SCENARIO.rooms[a.location].name,stress:a.stress,health:a.health,
   active:a.id===s.actors[s.cursor].id})),
  events:s.events.filter(e=>e.actorId===null||e.actorId===actor.id).slice(-40)
 };
}
export function parsePartyAction(input) {
 if(typeof input==='object'&&input!==null)
   return {kind:String(input.kind||'').toLowerCase(),target:String(input.target||''),
     recipientId:input.recipientId||null,push:input.push===1||input.push===true?1:0};
 let line=String(input||'').toLowerCase().trim();
 const push=/^push(?:\s|:)/.test(line)?1:0;
 if(push)line=line.replace(/^push(?:\s|:)+/,'');
 if(['look','status','inventory'].includes(line))return {kind:'look',target:'',push:0};
 if(['wait','hold','stay'].includes(line))return {kind:'wait',target:'',push:0};
 if(['hide','conceal','take cover'].includes(line))return {kind:'hide',target:'',push};
 const regex=[
  [/^(?:go|move|walk|head|run|sneak|creep)\s+(?:to\s+)?(.+)$/,'move'],
  [/^(?:take|pick up|grab)\s+(.+)$/,'take'],
  [/^(?:use|activate|repair|restart|fix|turn on)\s+(.+)$/,'use'],
  [/^(?:investigate|study|inspect|examine|search|observe)\s+(.+)$/,'investigate']
 ];
 for(const [re,kind] of regex){const m=line.match(re);if(m)
  return {kind,target:m[1].replace(/^(the |a )/,'').trim(),push};}
 const give=line.match(/^(?:give|hand)\s+(.+?)\s+to\s+(pc-[1-8])$/);
 if(give)return {kind:'give',target:give[1],recipientId:give[2],push:0};
 return {kind:'',target:line,push:0};
}
export function partyStep(previous,raw,{actorId=null}={}) {
 if(!isPartySave(previous))throw new RangeError('Invalid party incident.');
 const action=parsePartyAction(raw);
 const actor=previous.actors[previous.cursor];
 if(actorId!==null&&actor.id!==actorId)return rejected(previous,'It is '+actor.name+"'s turn.");
 if(previous.outcome!=='playing')return rejected(previous,'This incident has concluded.');
 if(action.kind==='look')return rejected(previous,'Inspect the current scene without spending time.');
 if(!['wait','move','take','give','hide','use','investigate'].includes(action.kind))
   return rejected(previous,'Describe a supported action or use the scene controls.');
 const s=deep(previous),a=s.actors[s.cursor];
 const result=(skill,context='')=>{
   const seed=nextSeed(s);
   const rolled=resolveSkillCheck(a,{skill,context,seed,push:action.push});
   const next=rolled.after;
   // Changes to the actor's psychological sheet are authoritative and persistent.
   a.stress=next.stress;a.stressResponses=next.stressResponses;
   a.storyPoints=next.storyPoints;
   return {seed,success:rolled.success,successes:rolled.successes,
     base:rolled.initial.base,stressDice:rolled.initial.stress,
     pushes:rolled.pushes,responseEvents:rolled.responseEvents,notes:rolled.notes,
     pushRefused:rolled.pushRefused};
 };
 if(action.kind==='wait'){
   gameEvent(s,a.name+' waits and listens.',a.id);
   return accepted(s,a,'wait','',{},0);
 }
 if(action.kind==='move'){
   const room=matchRoom(action.target,a.location);
   if(!room)return rejected(previous,'That destination is not connected to this room.');
   if(a.location==='utility'&&room==='shed'&&!a.inventory.includes('keycard'))
     return rejected(previous,a.name+' needs the staff access card to enter the shed.');
   a.location=room;a.hidden=false;
   gameEvent(s,a.name+' enters '+SCENARIO.rooms[room].name+'.',a.id);
   return accepted(s,a,'move',room,{},1);
 }
 if(action.kind==='take'){
   const item=matchItem(action.target,s.rooms[a.location].items);
   if(!item)return rejected(previous,'That object is not available here.');
   s.rooms[a.location].items.splice(s.rooms[a.location].items.indexOf(item),1);
   a.inventory.push(item);a.hidden=false;
   gameEvent(s,a.name+' picks up '+itemLabel(item)+'.',a.id);
   return accepted(s,a,'take',item,{},1);
 }
 if(action.kind==='give'){
   const target=s.actors.find(x=>x.id===action.recipientId);
   if(!target||target.id===a.id||target.location!==a.location)
     return rejected(previous,'Recipient must be a different survivor in the same room.');
   const item=matchItem(action.target,a.inventory);
   if(!item)return rejected(previous,'This survivor does not possess that item.');
   a.inventory.splice(a.inventory.indexOf(item),1);target.inventory.push(item);
   gameEvent(s,a.name+' gives '+itemLabel(item)+' to '+target.name+'.',a.id);
   return accepted(s,a,'give',item,{recipientId:target.id},0);
 }
 if(action.kind==='hide'){
   const rolled=result('mobility');
   a.hidden=rolled.success;
   gameEvent(s,a.name+(rolled.success?' finds concealment.':' fails to conceal themselves.'),a.id,rolled.success?'action':'risk');
   return accepted(s,a,'hide','',rolled,0);
 }
 if(action.kind==='investigate'){
   const observation=matchObservation(action.target,a.location);
   if(!observation)return rejected(previous,'Nothing matching that detail is present here.');
   const rolled=result('observation','active_search');
   if(rolled.success){
     if(!a.observed.includes(a.location+':'+observation.id))a.observed.push(a.location+':'+observation.id);
     gameEvent(s,a.name+' examines '+observation.id+': '+(observation.investigation||observation.description),a.id);
   }else gameEvent(s,a.name+' finds no reliable new detail about '+observation.id+'.',a.id);
   return accepted(s,a,'investigate',observation.id,rolled,0);
 }
 if(action.kind==='use'){
   const feature=matchFeature(action.target,a.location);
   if(!feature)return rejected(previous,'That mechanism is not here.');
   if(feature==='generator'&&s.flags.power)return rejected(previous,'Auxiliary power is already active.');
   if(feature==='radio'&&!s.flags.power)return rejected(previous,'The radio requires auxiliary power.');
   if(feature==='radio'&&s.flags.distress)return rejected(previous,'The distress call has already been transmitted.');
   if(feature==='beacon'&&(!s.flags.power||!s.flags.distress))
     return rejected(previous,'The beacon needs restored power and a transmitted distress call.');
   if(feature==='beacon'&&s.flags.beacon)return rejected(previous,'The beacon is already broadcasting.');
   const skill=feature==='generator'?'heavy_machinery':'comtech';
   const rolled=result(skill);
   a.hidden=false;
   if(rolled.success){
    if(feature==='generator')s.flags.power=true;
    if(feature==='radio')s.flags.distress=true;
    if(feature==='beacon'){s.flags.beacon=true;s.outcome='rescued';}
    gameEvent(s,a.name+' successfully operates the '+feature+'.',a.id,'milestone');
   }else gameEvent(s,a.name+' cannot get the '+feature+' working yet.',a.id,'risk');
   return accepted(s,a,'use',feature,rolled,feature==='generator'?3:1);
 }
 return rejected(previous,'Unrecognized action.');
}
