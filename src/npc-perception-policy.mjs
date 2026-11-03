// DHR-008: a pure, fail-closed candidate policy for independent NPC decisions.
// Callers must supply actor-local, source-validated knowledge and actual adjacent,
// traversable exits. This layer neither perceives the world nor commits actions.
const ID=/^[a-z][a-z0-9_-]{0,63}$/;
const FACT_KINDS=new Set(['danger','distress','clue']);
const FACT_SOURCES=new Set(['observed','reported']);
const MOTIVES=new Set(['selfPreservation','aidOthers','curiosity']);
const INPUT_KEYS=new Set(['knownFacts','motiveFlags','legalExits']);
const FACT_KEYS=new Set(['id','kind','source','local']);

function plain(value){
 if(value===null||typeof value!=='object'||Array.isArray(value))return false;
 const proto=Object.getPrototypeOf(value);
 return proto===Object.prototype||proto===null;
}
function fields(value,allowed){
 return plain(value)&&Object.keys(value).every(k=>allowed.has(k));
}
function invalid(reason){throw new RangeError('Invalid NPC perception policy input: '+reason);}

/**
 * Return possible, not selected, actions from source-validated local knowledge.
 *
 * - knownFacts: unique {id,kind:'danger'|'distress'|'clue',
 *   source:'observed'|'reported',local:boolean}. "observed" must already have
 *   been earned by the actor through the engine's perception/evidence rules;
 *   "local" is true only for a directly actionable fact at the actor's room.
 * - motiveFlags: optional true/false selfPreservation, aidOthers, curiosity.
 * - legalExits: unique destination room IDs confirmed adjacent and traversable
 *   by the authoritative world at the proposed decision beat.
 *
 * The returned candidates do NOT authorize movement, medical effects, rolls,
 * speech to unseen listeners, or a combat action. An executor must revalidate.
 * Unknown keys and malformed claims are rejected instead of silently trusted.
 */
export function npcPerceivedOptions(input){
 if(!fields(input,INPUT_KEYS)||!Object.hasOwn(input,'knownFacts')||
    !Object.hasOwn(input,'motiveFlags')||!Object.hasOwn(input,'legalExits'))
  invalid('missing or unsupported top-level fields');
 const {knownFacts,motiveFlags,legalExits}=input;
 if(!Array.isArray(knownFacts)||knownFacts.length>64)invalid('fact collection');
 if(!fields(motiveFlags,MOTIVES)||
    Object.values(motiveFlags).some(value=>typeof value!=='boolean'))
  invalid('motive flags');
 if(!Array.isArray(legalExits)||legalExits.length>32)
  invalid('physical exit collection');
 const seenFacts=new Set(),seenExits=new Set();
 for(const fact of knownFacts){
  if(!fields(fact,FACT_KEYS)||Object.keys(fact).length!==4||
     !ID.test(fact.id)||!FACT_KINDS.has(fact.kind)||
     !FACT_SOURCES.has(fact.source)||typeof fact.local!=='boolean'||
     seenFacts.has(fact.id))invalid('actor-known fact or duplicate fact ID');
  seenFacts.add(fact.id);
 }
 for(const exit of legalExits){
  if(typeof exit!=='string'||!ID.test(exit)||seenExits.has(exit))
   invalid('adjacent traversable exit or duplicate destination');
  seenExits.add(exit);
 }
 // Only directly earned, *local* evidence can authorize a situational option.
 // Reported or distant events do not become a magically witnessed threat.
 const here=knownFacts.filter(f=>f.source==='observed'&&f.local);
 const options=[{kind:'hold'}]; // Quiet/unchanged play is always an option.
 if(motiveFlags.selfPreservation&&here.some(f=>f.kind==='danger'))
  for(const to of [...legalExits].sort())options.push({kind:'withdraw',to});
 if(motiveFlags.aidOthers)
  for(const f of here.filter(f=>f.kind==='distress').sort((a,b)=>a.id.localeCompare(b.id)))
   options.push({kind:'consider_help',factId:f.id});
 if(motiveFlags.curiosity)
  for(const f of here.filter(f=>f.kind==='clue').sort((a,b)=>a.id.localeCompare(b.id)))
   options.push({kind:'consider_inspection',factId:f.id});
 return Object.freeze(options.map(option=>Object.freeze(option)));
}
