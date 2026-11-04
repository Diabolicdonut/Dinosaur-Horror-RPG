// DHR-017: source-backed, finite NPC motives and intentions.
// Authoring-only contract. No live scheduler, rolls, save changes or authority
// to invent knowledge. An eventual chooser must check a validated evidence ledger.
import {adventureFingerprint,validateCompiledAdventure} from './adventure-definition.mjs';

const IDENT=/^[a-z][a-z0-9_-]{0,63}$/;
const SOURCE_KEYS=['adventureId','revision','fingerprint','seed','npcId','location','motive','stance'];
const TRAIT_KEYS=['selfPreservation','aidOthers','curiosity'];
const TRIGGERS=Object.freeze({
 withdraw:Object.freeze({trait:'selfPreservation',when:'observed_local_danger'}),
 consider_help:Object.freeze({trait:'aidOthers',when:'observed_local_distress'}),
 consider_inspection:Object.freeze({trait:'curiosity',when:'observed_local_clue'})
});
const TYPES=Object.keys(TRIGGERS);

function fail(reason){throw new RangeError('Invalid NPC motive/intent contract: '+reason);}
function plain(value){
 if(value===null||typeof value!=='object'||Array.isArray(value))return false;
 const prototype=Object.getPrototypeOf(value);
 return prototype===Object.prototype||prototype===null;
}
function exact(value,keys){
 return plain(value)&&Object.keys(value).length===keys.length&&
  keys.every(key=>Object.hasOwn(value,key));
}
function id(value){return typeof value==='string'&&IDENT.test(value);}
function sameSource(actual,expected){
 return SOURCE_KEYS.every(key=>actual[key]===expected[key]);
}
function sourceFrom(compiled,npc){
 return {
  adventureId:compiled.adventureId,revision:compiled.revision,
  fingerprint:compiled.fingerprint,seed:compiled.seed,
  npcId:npc.id,location:npc.location,motive:npc.motive,stance:npc.stance
 };
}
function presentForSeed(compiled,npc){
 return !npc.variant||compiled.hiddenFacts?.[npc.variant.slot]?.id===npc.variant.choice;
}

/**
 * Compile a trusted author's finite profile against a fully verified,
 * versioned/seeded AdventureDefinition. This does NOT grant runtime authority.
 *
 * declaration = {
 *   source: {adventureId,revision,fingerprint,seed,npcId,location,motive,stance},
 *   traits: {selfPreservation:boolean,aidOthers:boolean,curiosity:boolean},
 *   intentions: [{id,kind,when}, ...]
 * }
 *
 * 'when' must match the fixed observed_local_* prerequisite for 'kind'.
 * No actor may acquire new knowledge or take an action merely because an
 * intention appears in the returned contract.
 */
export function compileNpcMotiveIntent(compiled,declaration){
 if(!validateCompiledAdventure(compiled))fail('invalid compiled source');
 if(!exact(declaration,['source','traits','intentions']))fail('declaration fields');
 const {source,traits,intentions}=declaration;
 if(!exact(source,SOURCE_KEYS)||!id(source.npcId))fail('source binding');
 const npc=compiled.definition.supportingCast?.find(person=>person.id===source.npcId);
 if(!npc||!presentForSeed(compiled,npc))fail('missing or inactive source NPC');
 if(!sameSource(source,sourceFrom(compiled,npc)))fail('forged or stale source identity');
 if(!exact(traits,TRAIT_KEYS)||TRAIT_KEYS.some(key=>typeof traits[key]!=='boolean'))
  fail('three explicit boolean traits required');
 if(!Array.isArray(intentions)||intentions.length>TYPES.length)
  fail('finite intention collection');
 const seenIds=new Set(),seenKinds=new Set();
 for(const intent of intentions){
  if(!exact(intent,['id','kind','when'])||!id(intent.id)||
     !Object.hasOwn(TRIGGERS,intent.kind)||typeof intent.when!=='string'||
     intent.when!==TRIGGERS[intent.kind].when||
     !traits[TRIGGERS[intent.kind].trait]||
     seenIds.has(intent.id)||seenKinds.has(intent.kind))
   fail('unsupported, duplicate or unjustified intention');
  seenIds.add(intent.id);seenKinds.add(intent.kind);
 }
 // Canonical ordering makes an author's input order irrelevant to replay IDs.
 const ordered=[...intentions].sort((a,b)=>TYPES.indexOf(a.kind)-TYPES.indexOf(b.kind));
 const boundSource=Object.freeze({...source});
 const boundTraits=Object.freeze(Object.fromEntries(TRAIT_KEYS.map(key=>[key,traits[key]])));
 const boundIntentions=Object.freeze(ordered.map(intent=>Object.freeze({...intent})));
 // Flags are only permissions for DHR-008 to enumerate *possible* options.
 // A trait without an authored intention does not enable any option.
 const motiveFlags=Object.freeze(Object.fromEntries(TRAIT_KEYS.map(trait=>[
  trait,ordered.some(intent=>TRIGGERS[intent.kind].trait===trait)
 ])));
 const canonical={schemaVersion:1,source:boundSource,traits:boundTraits,
  intentions:boundIntentions};
 // FNV fingerprint is for reproducible identity, NOT a secret or signature.
 const identity='npc-motive-v1:'+source.adventureId+':'+source.revision+':'+
  source.fingerprint+':'+source.seed+':'+source.npcId+':'+
  adventureFingerprint(canonical);
 return Object.freeze({...canonical,identity,motiveFlags});
}
