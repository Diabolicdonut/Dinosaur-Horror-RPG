// DHR-026: source-validated Cinematic Story Point spending (GM-only pure sidecar).
// Private Evolved Edition references: Using Skills/Story Points p. 44; GM Story Points p. 158.
// The authoritative Evolved dice module, game saves and gameplay runtime are untouched.
import {validateCompiledAdventure,adventureBinding} from './adventure-definition.mjs';
import {isPartySave} from './party-engine.mjs';
import {resolveSkillCheck} from './evolved-checks.mjs';
import {replayStoryPointAwards} from './story-point-earning.mjs';

const copy=value=>JSON.parse(JSON.stringify(value));
const plain=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&
 (Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null);
const exact=(value,keys)=>plain(value)&&Object.keys(value).length===keys.length&&
 keys.every(key=>Object.hasOwn(value,key));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const natural=value=>Number.isSafeInteger(value)&&value>=0;
const nonempty=value=>typeof value==='string'&&value.trim().length>0;
const fail=reason=>({accepted:false,reason});
const SOURCE_KEYS=['adventureId','revision','fingerprint','seed'];
const JOURNAL_KEYS=['schemaVersion','source','entries'];
const CHECK_KEYS=['id','actorId','ownerId','source','beat','status','character','options','roll','appliedSpend'];
const SPEND_KEYS=['checkId','actorId','ownerId','beat','timing','dieIndex','awardIndex','balanceAfter','preview'];
const REQUEST_KEYS=['checkId','actorId','ownerId','timing','dieIndex'];
const CHECK_OPTIONS=new Set(['skill','seed','context','attribute','modifier','help',
 'passive','push','omitStressDice','voluntaryStress','stress','vehicleModel','attributeOnly']);
const sourceOf=compiled=>({adventureId:compiled.adventureId,revision:compiled.revision,
 fingerprint:compiled.fingerprint,seed:compiled.seed});
const matchesSource=(source,compiled)=>exact(source,SOURCE_KEYS)&&same(source,sourceOf(compiled));
const emptyJournal=compiled=>({schemaVersion:1,source:sourceOf(compiled),entries:[]});
function validWorld(compiled,state){
 try{
  return validateCompiledAdventure(compiled)&&isPartySave(state)&&
   state.scenario===compiled.adventureId&&state.initialSeed===compiled.seed&&
   same(state.adventureBinding,adventureBinding(compiled))&&
   Boolean(compiled.definition.cinematic&&compiled.definition.scenarioMaterial);
 }catch{return false;}
}
// The earning source computes real, risk-backed credits; opening balances in
// historic characters are NOT spendable merely because a client supplied them.
function earnedTokens(compiled,state,awardJournal){
 const audit=replayStoryPointAwards(compiled,state,awardJournal);
 if(!audit.valid)return null;
 const awards=awardJournal?.entries;
 if(!Array.isArray(awards))return [];
 const acts=compiled.definition.cinematic.acts;
 const tokens=[];
 for(let index=0;index<awards.length;index++){
  const entry=awards[index];
  if(entry.credited!==1)continue;
  let availableAt;
  if(entry.act===acts.length){
   // A final-act award cannot fund an earlier check, nor an unfinished ending.
   if(state.outcome==='playing')return null;
   availableAt=state.beat;
  }else{
   const next=acts[entry.act];
   if(!next||!Array.isArray(next.unlocksAfter)||next.unlocksAfter.length===0)return null;
   const beats=next.unlocksAfter.map(id=>state.objectiveRecords?.find(r=>r.id===id)?.beat);
   if(!beats.every(natural))return null;
   availableAt=Math.max(...beats)+1;
  }
  tokens.push({index,actorId:entry.actorId,availableAt});
 }
 return tokens;
}
// A check registry is an ENGINE-OWNED record of checks, not a client-supplied
// authorization flag. Original actor snapshots are needed for later replay.
function validateChecks(compiled,state,checkJournal){
 if(!exact(checkJournal,JOURNAL_KEYS)||checkJournal.schemaVersion!==1||
    !matchesSource(checkJournal.source,compiled)||!Array.isArray(checkJournal.entries)||
    checkJournal.entries.length>10000)return null;
 const checks=new Map();
 for(const c of checkJournal.entries){
  if(!exact(c,CHECK_KEYS)||!nonempty(c.id)||!nonempty(c.actorId)||
     !nonempty(c.ownerId)||!natural(c.beat)||c.beat>state.beat||
     !matchesSource(c.source,compiled)||!['open','committed'].includes(c.status)||
     checks.has(c.id)||!plain(c.character)||c.character.id!==c.actorId||
     !state.actors.some(a=>a.id===c.actorId)||!plain(c.options)||
     !Object.keys(c.options).every(k=>CHECK_OPTIONS.has(k))||
     !nonempty(c.options.skill)||!natural(c.options.seed)||
     c.options.seed>4294967295||c.options.passive===true||
     c.options.attributeOnly===true||c.options.stress!==undefined&&
       c.options.stress!==c.character.stress||
     c.status==='open'&&c.appliedSpend!==null||
     c.status==='open'&&(state.outcome!=='playing'||c.beat!==state.beat||
       !same(c.character,state.actors.find(a=>a.id===c.actorId))))
   return null;
  let original;
  try{original=resolveSkillCheck(c.character,c.options);}
  catch{return null;}
  if(original.storyPointSpent||!same(c.roll,original))return null;
  checks.set(c.id,c);
 }
 return checks;
}
function facesAtLastRoll(roll){
 const last=roll.pushes.at(-1);
 return {base:[...(last?last.base:roll.initial.base)],
  stress:[...(last?last.stress:roll.initial.stress)]};
}
const sixes=faces=>faces.filter(face=>face===6).length;
// Before pushing, use the EXISTING Evolved resolver's before-spend path:
// it records the automatic six and correctly skips its later rerolls/RNG draws.
// That engine supports the first base die only. We fail closed for other
// before-push die indices instead of approximating a different random stream.
function previewSpend(check,timing,dieIndex){
 if(!['before','after'].includes(timing)||!natural(dieIndex))return null;
 const original=check.roll;
 let result=original,faceBefore;
 if(timing==='before'){
  if(dieIndex!==0||original.initial.base[0]===6)return null;
  faceBefore=original.initial.base[0];
  try{
   result=resolveSkillCheck({...check.character,storyPoints:1},
    {...check.options,spendStoryPoint:true,storyPointTiming:'before'});
  }catch{return null;}
  if(!result.storyPointSpent)return null;
 }else{
  const last=facesAtLastRoll(original);
  if(dieIndex>=last.base.length||last.base[dieIndex]===6)return null;
  faceBefore=last.base[dieIndex];
 }
 const final=facesAtLastRoll(result);
 if(timing==='after')final.base[dieIndex]=6;
 if(final.base[dieIndex]!==6)return null;
 const successes=sixes(final.base)+sixes(final.stress);
 // The highest stress response still defeats a check despite base-die sixes.
 const blocked=result.responseEvents.some(e=>e.kind==='mess_up');
 return {dieBefore:faceBefore,dieAfter:6,base:final.base,stress:final.stress,
  successes,extraSuccesses:Math.max(0,successes-1),success:successes>0&&!blocked,
  pushesApplied:result.pushes.length,stressTriggered:result.stressTriggered,
  responseEvents:copy(result.responseEvents),draws:result.draws};
}
function validSpendRequest(request){
 return exact(request,REQUEST_KEYS)&&nonempty(request.checkId)&&
  nonempty(request.actorId)&&nonempty(request.ownerId)&&
  ['before','after'].includes(request.timing)&&natural(request.dieIndex);
}
function pickToken(tokens,spent,check){
 return tokens.find(token=>token.actorId===check.actorId&&
   token.availableAt<=check.beat&&!spent.has(token.index));
}
function makeEntry(check,request,token,tokens,spent){
 const preview=previewSpend(check,request.timing,request.dieIndex);
 if(!preview)return null;
 const available=tokens.filter(t=>t.actorId===check.actorId&&t.availableAt<=check.beat).length;
 const alreadySpent=tokens.filter(t=>t.actorId===check.actorId&&spent.has(t.index)).length;
 const balanceAfter=available-alreadySpent-1;
 if(balanceAfter<0)return null;
 return {checkId:check.id,actorId:check.actorId,ownerId:check.ownerId,
  beat:check.beat,timing:request.timing,dieIndex:request.dieIndex,
  awardIndex:token.index,balanceAfter,preview};
}
function auditSpends(compiled,state,awardJournal,checkJournal,spendJournal){
 if(!validWorld(compiled,state))return null;
 const tokens=earnedTokens(compiled,state,awardJournal);
 const checks=validateChecks(compiled,state,checkJournal??emptyJournal(compiled));
 if(!tokens||!checks||!exact(spendJournal,JOURNAL_KEYS)||
    spendJournal.schemaVersion!==1||!matchesSource(spendJournal.source,compiled)||
    !Array.isArray(spendJournal.entries)||spendJournal.entries.length>tokens.length||
    spendJournal.entries.length>checks.size)return null;
 const spent=new Set(),usedChecks=new Set();
 let lastBeat=-1;
 for(const entry of spendJournal.entries){
  if(!exact(entry,SPEND_KEYS)||!natural(entry.beat)||entry.beat<lastBeat||
     !validSpendRequest({checkId:entry.checkId,actorId:entry.actorId,
       ownerId:entry.ownerId,timing:entry.timing,dieIndex:entry.dieIndex})||
     !natural(entry.awardIndex)||!natural(entry.balanceAfter))return null;
  const check=checks.get(entry.checkId);
  if(!check||usedChecks.has(check.id)||entry.beat!==check.beat||
     entry.actorId!==check.actorId||entry.ownerId!==check.ownerId)return null;
  const token=pickToken(tokens,spent,check);
  if(!token)return null;
  const expected=makeEntry(check,entry,token,tokens,spent);
  if(!expected||!same(entry,expected)||
     check.status==='committed'&&!same(check.appliedSpend,entry))return null;
  spent.add(token.index);usedChecks.add(check.id);lastBeat=entry.beat;
 }
 for(const check of checks.values()){
  if(check.status==='committed'){
   const actual=spendJournal.entries.find(entry=>entry.checkId===check.id)||null;
   if(!same(check.appliedSpend,actual))return null;
  }
 }
 const balances=Object.fromEntries(state.actors.map(a=>[a.id,0]));
 for(const token of tokens)balances[token.actorId]++;
 for(const token of tokens)if(spent.has(token.index))balances[token.actorId]--;
 return {balances,tokens,checks,spent,usedChecks,lastBeat};
}
/**
 * A sidecar proposal only. checkJournal must come from trusted Game Mother
 * execution, not a web request. Human owner identity must be authenticated
 * by that caller; this pure function enforces its recorded actor/owner binding.
 * This does NOT authorize a client to mint checks or redeem legacy opening
 * balances, and it never commits/reopens a skill check.
 */
export function resolveStoryPointSpend(compiled,state,awardJournal,checkJournal,
 request,spendJournal=null){
 const existing=spendJournal??emptyJournal(compiled);
 const audit=auditSpends(compiled,state,awardJournal,checkJournal,existing);
 if(!audit)return fail('Source, earned receipts or check/spend replay failed.');
 if(!validSpendRequest(request))return fail('Invalid spending request.');
 const check=audit.checks.get(request.checkId);
 if(!check||check.status!=='open'||check.beat!==state.beat||
    check.actorId!==request.actorId||check.ownerId!==request.ownerId||
    audit.usedChecks.has(check.id)||check.beat<audit.lastBeat)
  return fail('Unknown, unauthorized, previously spent or committed check.');
 // Focus is player-controlled for only its focused seat; spectator has no
 // player-controlled character. Historical entries replay independently.
 if(state.control.mode==='spectator'||state.control.mode==='focus'&&
    state.control.focusedActorId!==request.actorId)
  return fail('This actor is not currently player-controlled.');
 const actor=state.actors.find(a=>a.id===check.actorId);
 if(!actor||actor.dead)return fail('No living actor owns this open check.');
 const token=pickToken(audit.tokens,audit.spent,check);
 if(!token)return fail('No previously earned, unspent point belongs to this actor.');
 const entry=makeEntry(check,request,token,audit.tokens,audit.spent);
 if(!entry)return fail('No lawful base-die modification at this check stage.');
 const journal={schemaVersion:1,source:sourceOf(compiled),
  entries:[...existing.entries.map(copy),copy(entry)]};
 return {accepted:true,entry:copy(entry),preview:copy(entry.preview),
  balanceAfter:entry.balanceAfter,journal};
}
/** Replay credits, check dice, ownership, check lifecycle, order and conservation. */
export function replayStoryPointSpends(compiled,state,awardJournal,checkJournal,
 spendJournal=null){
 const result=auditSpends(compiled,state,awardJournal,checkJournal,
  spendJournal??emptyJournal(compiled));
 return result?{valid:true,balances:copy(result.balances),
  spentCount:result.usedChecks.size}:{valid:false,reason:'Invalid source-grounded Story Point spending journal.'};
}
