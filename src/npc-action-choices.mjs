// DHR-019: deterministic, source-bound advisory NPC choices.
// No actions, dice, time, observation, recovery, save writes or attacks occur here.
// Only an engine-attested replay may supply the world frames and passable exits.
import {adventureFingerprint,validateCompiledAdventure} from './adventure-definition.mjs';
import {compileNpcMotiveIntent} from './npc-motive-intent.mjs';
import {compileNpcKnowledgeLedger,npcKnownFactsAt} from './npc-knowledge-provenance.mjs';
import {npcPerceivedOptions} from './npc-perception-policy.mjs';

const ID=/^[a-z][a-z0-9_-]{0,63}$/;
const QUERY_KEYS=['npcId','beat','traversableExits'];
const MOTIVE_KEYS=['schemaVersion','source','traits','intentions','identity','motiveFlags'];
const LEDGER_KEYS=['schemaVersion','source','frames','entries','identity','npcIds'];
const compare=(a,b)=>a.localeCompare(b);
function fail(reason){throw new RangeError('Invalid NPC action choice: '+reason);}
function plain(x){
 if(!x||typeof x!=='object'||Array.isArray(x))return false;
 const p=Object.getPrototypeOf(x);
 return p===Object.prototype||p===null;
}
function exact(x,keys){
 return plain(x)&&Object.keys(x).length===keys.length&&
  keys.every(k=>Object.hasOwn(x,k));
}
function pureData(x,seen=new WeakSet()){
 if(x===null||typeof x==='string'||typeof x==='boolean')return true;
 if(typeof x==='number')return Number.isFinite(x);
 if(typeof x!=='object'||seen.has(x))return false;
 if(!Array.isArray(x)&&!plain(x))return false;
 if(Array.isArray(x)&&Object.getPrototypeOf(x)!==Array.prototype)return false;
 seen.add(x);
 const valid=Object.values(x).every(value=>pureData(value,seen));
 seen.delete(x);
 return valid;
}
function sameCanonical(a,b){return JSON.stringify(a)===JSON.stringify(b);}

// Rebuild both upstream contracts rather than treating mutable, caller-supplied
// labels, motiveFlags, source IDs, hashes or evidence provenance as permissions.
// This verifies source consistency, NOT that a real engine replay or successful
// Evolved observation check produced the ledger. The executor must attest that.
function validatedMotive(compiled,motive){
 if(!exact(motive,MOTIVE_KEYS)||!pureData(motive))fail('motive shape');
 let rebuilt;
 try{
  rebuilt=compileNpcMotiveIntent(compiled,{
   source:motive.source,traits:motive.traits,intentions:motive.intentions
  });
 }catch{fail('unverified source motive');}
 if(!sameCanonical(motive,rebuilt))fail('altered motive flags or identity');
 return rebuilt;
}
function validatedLedger(compiled,ledger){
 if(!exact(ledger,LEDGER_KEYS)||!pureData(ledger)||!Array.isArray(ledger.entries)||
    !Array.isArray(ledger.frames))fail('ledger shape');
 // DHR-018 exposes frozen normalized entries, not the original events. Recover
 // the exact closed event vocabulary and recompile against the chosen source.
 const events=ledger.entries.map(entry=>entry?.source==='observed'?{
  id:entry.id,type:'observe',npcId:entry.npcId,factId:entry.factId,
  kind:entry.kind,beat:entry.beat,location:entry.location
 }:{
  id:entry?.id,type:'report',fromNpcId:entry?.fromNpcId,
  toNpcId:entry?.npcId,factId:entry?.factId,kind:entry?.kind,
  beat:entry?.beat,location:entry?.location
 });
 let rebuilt;
 try{rebuilt=compileNpcKnowledgeLedger(compiled,{frames:ledger.frames,events});}
 catch{fail('unverified actor-local ledger');}
 if(!sameCanonical(ledger,rebuilt))fail('altered ledger identity or evidence');
 return rebuilt;
}

/**
 * Choose a deterministic, NONEXECUTING advisory option for one source NPC.
 * Inputs must originate inside the trusted engine boundary:
 *   compiled: verified, versioned and seeded AdventureDefinition
 *   motive: result of compileNpcMotiveIntent for this actor/source
 *   ledger: result of compileNpcKnowledgeLedger from replay-attested frames
 *   query: {npcId,beat,traversableExits:[roomId,...]}
 * The passable-exit list is an engine-attested subset of actual exits at this
 * exact beat (door closure, flooding, obstacles etc. must already be resolved).
 * A mere syntactically valid caller claim is NOT proof of traversability.
 *
 * Only a source-defined dangerResponse.exit permits a DHR-019 withdraw
 * proposal, and only while at the authored departure room. Return-route
 * movement remains exclusively in the existing objective-triggered engine.
 * Help/inspection are 'consider' intentions, not a heal/discovery/action grant.
 * The result must be revalidated at commit by DHR-020+.
 */
export function planNpcAction(compiled,motive,ledger,query){
 if(!validateCompiledAdventure(compiled))fail('compiled adventure');
 if(!exact(query,QUERY_KEYS)||typeof query.npcId!=='string'||
    !ID.test(query.npcId)||!Number.isSafeInteger(query.beat)||query.beat<0||
    !Array.isArray(query.traversableExits)||query.traversableExits.length>32)
  fail('query fields or bounds');
 const exits=query.traversableExits;
 if(new Set(exits).size!==exits.length||
    exits.some(e=>typeof e!=='string'||!ID.test(e)))fail('bad/duplicate exit');
 const profile=validatedMotive(compiled,motive);
 const history=validatedLedger(compiled,ledger);
 const id=query.npcId;
 if(profile.source.npcId!==id||!history.npcIds.includes(id))fail('actor mismatch');
 const frame=history.frames.find(f=>f.beat===query.beat);
 if(!frame)fail('decision beat has no committed frame');
 const room=frame.npcRooms[id],worldRoom=compiled.definition.rooms[room];
 if(!worldRoom)fail('actor outside physical map');
 if(exits.some(to=>to===room||!worldRoom.exits.includes(to)))
  fail('claimed exit is not adjacent in selected source');
 const sourceNpc=compiled.definition.supportingCast.find(n=>n.id===id);
 // A source-defined withdrawal response is a single prescribed adjacent exit,
 // not arbitrary pathfinding, and cannot be reused once the NPC has moved.
 const retreat=sourceNpc.dangerResponse?.exit;
 const legalExits=retreat&&room===sourceNpc.location&&exits.includes(retreat)?
  [retreat]:[];
 const knownFacts=npcKnownFactsAt(history,id,query.beat);
 const candidates=npcPerceivedOptions({knownFacts,
  motiveFlags:profile.motiveFlags,legalExits});
 // Safety first, then urgent witnessed distress, then local evidence. Every
 // option is advisory: choosing a 'consider' does not resolve its effect.
 const chosen=candidates.find(c=>c.kind==='withdraw')||
  candidates.find(c=>c.kind==='consider_help')||
  candidates.find(c=>c.kind==='consider_inspection')||candidates[0];
 const canonicalExits=[...exits].sort(compare);
 const identity='npc-action-choice-v1:'+adventureFingerprint({
  source:history.source,motive:profile.identity,ledger:history.identity,
  npcId:id,beat:query.beat,room,traversableExits:canonicalExits,
  candidates,chosen
 });
 return Object.freeze({schemaVersion:1,source:Object.freeze({...history.source}),
  npcId:id,beat:query.beat,room,
  candidates,chosen,identity});
}
