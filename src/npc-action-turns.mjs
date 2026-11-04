// DHR-020: bounded, nonexecuting NPC initiative / exploration action reservations.
// Only an engine-replayed clock, conditions, positions, exits and world ledger
// may cross this trust boundary. Fingerprints are replay checks, NOT signatures.
import {adventureFingerprint,validateCompiledAdventure} from './adventure-definition.mjs';
import {compileNpcKnowledgeLedger} from './npc-knowledge-provenance.mjs';
import {planNpcAction} from './npc-action-choices.mjs';
import {rollInitiative,createActionBudget,spendActionBudget} from './evolved-encounters.mjs';

const ID=/^[a-z][a-z0-9_-]{0,63}$/;
const KINDS=new Set(['hold','withdraw','consider_help','consider_inspection']);
const CONDITIONS=new Set(['ready','incapacitated','dead']);
const SOURCE_KEYS=['adventureId','revision','fingerprint','seed'];
const EXPLORE_KEYS=['phase','beat','slot','conditions'];
const COMBAT_KEYS=['phase','beat','slot','round','seed','participants','room','conditions'];
const WINDOW_KEYS=['schemaVersion','source','ledgerIdentity','boundary','ownerId',
 'card','history','budget','ended','identity'];
const ENTRY_KEYS=['query','proposal','choice','cost','receipt'];
const QUERY_KEYS=['npcId','beat','traversableExits'];
const CHOICE_KEYS={hold:['kind'],withdraw:['kind','to'],
 consider_help:['kind','factId'],consider_inspection:['kind','factId']};
const uint=x=>Number.isSafeInteger(x)&&x>=0&&x<=0xffffffff;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const invalid=why=>{throw new RangeError('Invalid NPC scheduled action: '+why);};
function plain(x){
 if(!x||typeof x!=='object'||Array.isArray(x))return false;
 const p=Object.getPrototypeOf(x);
 return p===Object.prototype||p===null;
}
function exact(x,keys){
 return plain(x)&&Object.keys(x).length===keys.length&&
  keys.every(k=>Object.hasOwn(x,k));
}
function data(x,stack=new WeakSet()){
 if(x===null||typeof x==='string'||typeof x==='boolean')return true;
 if(typeof x==='number')return Number.isFinite(x);
 if(typeof x!=='object'||stack.has(x))return false;
 if(!Array.isArray(x)&&!plain(x))return false;
 if(Array.isArray(x)&&Object.getPrototypeOf(x)!==Array.prototype)return false;
 stack.add(x);
 const ok=Object.values(x).every(y=>data(y,stack));
 stack.delete(x);
 return ok;
}
function freeze(x){
 if(x&&typeof x==='object'){
  Object.values(x).forEach(freeze);
  Object.freeze(x);
 }
 return x;
}
function canonicalSource(compiled){
 return {adventureId:compiled.adventureId,revision:compiled.revision,
  fingerprint:compiled.fingerprint,seed:compiled.seed};
}
// Recompile rather than trusting mutable frame/observation records or their
// caller-supplied hash. This cannot prove that the real engine replay generated
// those records: the engine MUST independently attest committed world history.
function checkedLedger(compiled,ledger){
 if(!exact(ledger,['schemaVersion','source','frames','entries','identity','npcIds'])||
    !data(ledger)||!exact(ledger.source,SOURCE_KEYS)||
    !same(ledger.source,canonicalSource(compiled)))
  invalid('ledger source or shape');
 const events=ledger.entries.map(e=>e?.source==='observed'?{
  id:e.id,type:'observe',npcId:e.npcId,factId:e.factId,
  kind:e.kind,beat:e.beat,location:e.location
 }:{
  id:e?.id,type:'report',fromNpcId:e?.fromNpcId,toNpcId:e?.npcId,
  factId:e?.factId,kind:e?.kind,beat:e?.beat,location:e?.location
 });
 let reconstructed;
 try{reconstructed=compileNpcKnowledgeLedger(compiled,{frames:ledger.frames,events});}
 catch{invalid('unverified world frame or observation');}
 if(!same(reconstructed,ledger))invalid('forged knowledge replay or identity');
 return reconstructed;
}
function checkedBoundary(history,boundary){
 if(!plain(boundary)||!data(boundary)||
    !exact(boundary,boundary.phase==='combat'?COMBAT_KEYS:EXPLORE_KEYS)||
    !Number.isSafeInteger(boundary.beat)||boundary.beat<0||
    history.frames.at(-1).beat!==boundary.beat||
    !Number.isSafeInteger(boundary.slot)||boundary.slot<0||
    !exact(boundary.conditions,history.npcIds)||
    Object.values(boundary.conditions).some(c=>!CONDITIONS.has(c)))
  invalid('not a current, engine-owned time boundary');
 let order;
 if(boundary.phase==='exploration'){
  // Each NPC gets at most one finite ten-minute stretch at this verified beat;
  // the engine must attest when this beat is actually due.
  order=history.npcIds.map(actorId=>({actorId,card:null}));
 }else if(boundary.phase==='combat'){
  if(!Number.isSafeInteger(boundary.round)||boundary.round<1||
     boundary.round>1000000||!uint(boundary.seed)||
     !Array.isArray(boundary.participants)||!boundary.participants.length||
     boundary.participants.length>10||
     boundary.participants.some(id=>typeof id!=='string'||!ID.test(id))||
     new Set(boundary.participants).size!==boundary.participants.length)
   invalid('combat participants, seed or round');
  // Other combatants can be represented, but their participation and the
  // seed must be certified by the real engine (not a narration model).
  try{order=rollInitiative({actorIds:boundary.participants,dinosaurTurns:0,
   seed:boundary.seed}).map(s=>({actorId:s.actorId,card:s.card}));}
  catch{invalid('impossible initiative');}
 }else invalid('unsupported phase');
 const slot=order[boundary.slot];
 if(!slot||!history.npcIds.includes(slot.actorId))
  invalid('unknown, remote or non-NPC initiative owner');
 if(boundary.phase==='combat'){
  const frame=history.frames.at(-1);
  if(typeof boundary.room!=='string'||frame.npcRooms[slot.actorId]!==boundary.room)
   invalid('combat initiative owner is not physically at encounter');
  // The actual engine must independently attest external survivor positions.
  // Source-known NPCs and creatures can be rejected for false locality here.
  for(const id of boundary.participants){
   if((Object.hasOwn(frame.npcRooms,id)&&frame.npcRooms[id]!==boundary.room)||
      (Object.hasOwn(frame.creatureRooms,id)&&frame.creatureRooms[id]!==boundary.room))
    invalid('remote source combat participant');
  }
 }
 if(boundary.conditions[slot.actorId]!=='ready')
  invalid('dead, incapacitated or unable-to-act NPC');
 return slot;
}
function makeWindow(compiled,history,boundary,actions,budget,ended){
 const owner=checkedBoundary(history,boundary),source=canonicalSource(compiled);
 const body={schemaVersion:1,source,ledgerIdentity:history.identity,
  boundary,ownerId:owner.actorId,card:owner.card,
  history:actions,budget,ended};
 return freeze({...body,identity:'npc-action-turn-v1:'+adventureFingerprint(body)});
}
function costOf(phase,kind){
 if(kind==='hold')return 'end';
 if(phase==='exploration')return 'stretch';
 return kind==='withdraw'?'quick':'full';
}
function checkedChoice(plan,choice){
 if(!plain(choice)||!KINDS.has(choice.kind)||
    !exact(choice,CHOICE_KEYS[choice.kind])||
    !plan.candidates.some(candidate=>same(candidate,choice)))
  invalid('choice not present in verified source proposal');
}
function checkedProposal(compiled,motive,ledger,window,query,proposal,choice){
 if(!exact(query,QUERY_KEYS)||!data(query)||!data(proposal)||
    query.npcId!==window.ownerId||query.beat!==window.boundary.beat)
  invalid('remote actor, changed decision beat or malformed query');
 let authentic;
 try{authentic=planNpcAction(compiled,motive,ledger,query);}
 catch{invalid('invalid source-bound NPC action proposal');}
 if(!same(authentic,proposal))
  invalid('forged, altered or stale action proposal');
 if(authentic.room!==ledger.frames.at(-1).npcRooms[window.ownerId])
  invalid('proposal is not at the current physical room');
 checkedChoice(authentic,choice);
 return authentic;
}
function apply(history,window,choice,budget,ended){
 if(ended)invalid('turn already consumed or ended');
 // Repeating movement or a substantive intent on the same unresolved
 // world frame is not a second lawful action or a free physical effect.
 if(history.some(entry=>entry.choice.kind===choice.kind))
  invalid('duplicate action within the same initiative window');
 const cost=costOf(window.boundary.phase,choice.kind);
 if(window.boundary.phase==='exploration')
  return {budget:createActionBudget(),ended:true,cost};
 if(cost==='end')return {budget,ended:true,cost};
 const spent=spendActionBudget(budget,cost);
 if(!spent.accepted)invalid('finite Evolved action budget exhausted');
 const b=spent.budget;
 return {budget:b,ended:b.quickSpent===2||
  (b.fullSpent===1&&b.quickSpent===1),cost};
}
function receipt(window,sequence,query,proposal,choice,cost){
 return 'npc-action-reservation-v1:'+adventureFingerprint({
  turn:window.identity,sequence,query,proposal:proposal.identity,choice,cost
 });
}
function rebuild(compiled,motive,ledger,window){
 if(!exact(window,WINDOW_KEYS)||!data(window)||
    !Array.isArray(window.history)||window.history.length>2||
    !validateCompiledAdventure(compiled))
  invalid('turn state or compiled adventure');
 const history=checkedLedger(compiled,ledger);
 const initial=makeWindow(compiled,history,window.boundary,[],
  createActionBudget(),false);
 if(!same(window.source,initial.source)||
    window.ledgerIdentity!==history.identity||
    window.ownerId!==initial.ownerId||window.card!==initial.card)
  invalid('inconsistent source or initiative turn');
 let current=initial;
 for(const entry of window.history){
  if(!exact(entry,ENTRY_KEYS)||!data(entry))invalid('malformed action history');
  checkedProposal(compiled,motive,history,current,entry.query,
   entry.proposal,entry.choice);
  const moved=apply(current.history,current,entry.choice,current.budget,current.ended);
  const expected=receipt(current,current.history.length,entry.query,
   entry.proposal,entry.choice,moved.cost);
  if(entry.cost!==moved.cost||entry.receipt!==expected)
   invalid('forged or duplicated turn consumption');
  current=makeWindow(compiled,history,current.boundary,
   [...current.history,entry],moved.budget,moved.ended);
 }
 if(!same(current,window))invalid('tampered action budget, owner or replay hash');
 return {history,current};
}

/**
 * Engine-only. A boundary is a committed, CURRENT replay-attested beat and
 * ordered source NPC slot (exploration), or a combat round/seed/participant
 * index (combat). A caller-supplied boundary is NOT independently authentic.
 * Conditions must be derived from actual Evolved injuries and incapacity.
 */
export function beginNpcActionTurn(compiled,ledger,boundary){
 if(!validateCompiledAdventure(compiled))invalid('compiled adventure');
 const history=checkedLedger(compiled,ledger);
 checkedBoundary(history,boundary); // validate original prototype before clone
 const safe=structuredClone(boundary);
 return makeWindow(compiled,history,safe,createActionBudget(),false);
}

/**
 * Reserve a finite action from an actual initiative/ten-minute turn. Never
 * moves an NPC, treats 'consider' as an effect, grants items, rolls or changes
 * any persistent save. The trusted executor must atomically persist the
 * returned receipt and new window before enacting any separately legal effect.
 */
export function spendNpcScheduledAction(compiled,motive,ledger,query,proposal,choice,window){
 const {history,current}=rebuild(compiled,motive,ledger,window);
 checkedProposal(compiled,motive,history,current,query,proposal,choice);
 const spent=apply(current.history,current,choice,current.budget,current.ended);
 const nextReceipt=receipt(current,current.history.length,query,proposal,choice,spent.cost);
 const entry={query:structuredClone(query),proposal:structuredClone(proposal),
  choice:structuredClone(choice),cost:spent.cost,receipt:nextReceipt};
 const next=makeWindow(compiled,history,current.boundary,
  [...current.history,entry],spent.budget,spent.ended);
 return freeze({accepted:true,cost:spent.cost,receipt:nextReceipt,
  ownerId:current.ownerId,beat:current.boundary.beat,
  phase:current.boundary.phase,choice:structuredClone(choice),next});
}
