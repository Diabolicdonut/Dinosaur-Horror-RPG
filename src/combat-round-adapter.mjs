// DHR-015 / #111: adventure-independent, event-sourced Evolved combat turns.
// Trusted runtime input only. A proposed action is never an outcome: only a
// committed resolver receipt in world.commits advances this projection.
// Historical adventure saves and their combat schedulers are not modified.
import {rollInitiative,createActionBudget,spendActionBudget} from './evolved-encounters.mjs';
import {woundModifiers} from './evolved-injuries.mjs';

export const MULTI_ROUND_COMBAT_VERSION = 1;
export const COMBAT_ROUND_SECONDS = 10; // Adopted deterministic 5–10s pacing.
export const COMBAT_ACTION_COSTS = Object.freeze({
  move:'quick',rush:'quick',guard:'quick',aim:'quick',reload:'quick',
  take:'quick',give:'quick',rally:'quick',partial_cover:'quick',
  attack:'full',aid:'full',use:'full',hide:'full',sneak:'full',
  climb:'full',full_cover:'full',command:'full',interact:'full'
});
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const id=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{0,95}$/.test(x);
const uint=x=>Number.isSafeInteger(x)&&x>=0&&x<=0xffffffff;
const integer=x=>Number.isSafeInteger(x)&&x>=0;
const copy=x=>structuredClone(x);
const reject=why=>{throw new RangeError('DHR-015 combat: '+why);};
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const uniq=xs=>new Set(xs).size===xs.length;

function checkActors(actors,roster){
  if(!Array.isArray(actors)||actors.length!==roster.length||
     !uniq(actors.map(a=>a?.id)))reject('actor roster is not conserved');
  for(const entry of roster){
    const a=actors.find(x=>x.id===entry.id);
    if(!obj(a)||a.kind!==entry.kind||!id(a.location)||
       typeof a.dead!=='boolean'||typeof a.broken!=='boolean'||
       !integer(a.health)||!integer(a.healthMax)||a.health>a.healthMax||
       a.healthMax<1||!Array.isArray(a.criticalInjuries))
      reject('invalid committed actor snapshot');
    for(const w of a.criticalInjuries){
      if(!obj(w)||!Number.isSafeInteger(w.code)||w.code<11||w.code>66||
         ![0,1,2,3,4,5,6].includes(Math.floor(w.code/10))||
         w.code%10<1||w.code%10>6||
         (w.deadline!==undefined&&!['round','stretch','shift','instant',null].includes(w.deadline))||
         (w.lastTurnDeathRound!==undefined&&!integer(w.lastTurnDeathRound)))
        reject('invalid critical injury record');
    }
  }
}
function eligible(actor,location){
  return !!actor&&!actor.dead&&actor.location===location;
}
function draw(roster,actors,seed,surpriseIds=[]){
  const humans=roster.filter(p=>p.kind==='human'&&eligible(actors.find(a=>a.id===p.id),roster.location));
  const animals=roster.filter(p=>p.kind==='animal'&&eligible(actors.find(a=>a.id===p.id),roster.location));
  const animalSlots=animals.flatMap(a=>Array.from({length:a.speed},(_,i)=>({actorId:a.id,turnIndex:i+1})));
  const animalKeys=animalSlots.map((_,i)=>'dinosaur-'+(i+1));
  const priority=surpriseIds.map(actorId=>{
    if(humans.some(h=>h.id===actorId))return actorId;
    const i=animalSlots.findIndex(s=>s.actorId===actorId&&s.turnIndex===1);
    if(i<0)reject('unearned surprise');
    return animalKeys[i];
  });
  if(!uniq(priority)||humans.length+animalSlots.length>10||
     humans.length+animalSlots.length===0)reject('invalid initiative participants');
  return rollInitiative({actorIds:humans.map(h=>h.id),dinosaurTurns:animalSlots.length,
    surpriseActorIds:priority,seed}).map(slot=>{
    if(slot.kind==='human')return {card:slot.card,kind:'human',actorId:slot.actorId,turnIndex:1};
    const n=Number(slot.actorId.slice('dinosaur-'.length))-1;
    return {card:slot.card,kind:'animal',...animalSlots[n]};
  });
}
function woundCodes(actor,round){
  if(!actor||actor.dead)return [];
  return actor.criticalInjuries.filter(w=>w.deadline==='round'&&!w.stabilized&&!w.healed&&
    w.lastTurnDeathRound!==round&&w.inflictedRound!==round)
    .map(w=>w.code).sort((a,b)=>a-b);
}
function setPhase(s){
  if(s.phase==='ended'||s.phase==='medical'||s.phase==='reaction')return;
  const present=s.roster.filter(p=>eligible(s.actors.find(a=>a.id===p.id),s.location));
  if(!present.some(p=>p.kind==='human')||!present.some(p=>p.kind==='animal')){
    s.phase='conclude';return;
  }
  while(s.index<s.order.length){
    const slot=s.order[s.index];
    if(eligible(s.actors.find(a=>a.id===slot.actorId),s.location)){
      s.phase='turn';return;
    }
    s.index++;
  }
  s.phase='draw';
}
function finishSlot(s){
  const slot=s.order[s.index];
  if(slot.kind==='human'){
    const actor=s.actors.find(a=>a.id===slot.actorId);
    const due=woundCodes(actor,s.round);
    if(due.length){
      s.phase='medical';s.medical={actorId:slot.actorId,codes:due};
      return;
    }
  }
  s.index++;s.phase='turn';setPhase(s);
}
function committedProposal(world,commit,action,cost){
  const p=world.proposals.find(x=>x?.id===commit.proposalId);
  if(!p||p.status!=='authorized'||p.encounterId!==world.encounter.id||
     p.actorId!==commit.actorId||p.action!==action||p.cost!==cost||
     !id(p.id)||commit.targetId!==p.targetId&&
       !(commit.targetId===undefined&&p.targetId===undefined))
    reject('missing or mismatched authorized resolver proposal');
  return p;
}
function applyAfter(s,c){
  if(!Array.isArray(c.afterActors))reject('missing committed actor outcome');
  checkActors(c.afterActors,s.roster);
  s.actors=copy(c.afterActors);
}
function checkSlot(s,c){
  const slot=s.order[s.index];
  if(!slot||c.round!==s.round||c.card!==slot.card||
     c.actorId!==slot.actorId)reject('wrong initiative owner or card');
  return slot;
}
function checkCommit(s,world,c){
  if(!obj(c)||c.encounterId!==s.encounterId||!id(c.id)||
     s.usedCommitIds.has(c.id)||!Number.isSafeInteger(c.ordinal)||
     c.ordinal!==s.lastOrdinal+1)reject('missing, duplicate or out-of-order committed event');
  s.usedCommitIds.add(c.id);s.lastOrdinal=c.ordinal;
  if(s.phase==='ended')reject('action after encounter ended');
}
function consume(s,world,c){
  checkCommit(s,world,c);
  if(c.type==='round_draw'){
    if(s.phase!=='draw'||c.round!==s.round+1||!id(c.drawId)||
       s.usedDrawIds.has(c.drawId))reject('unscheduled initiative draw');
    const d=world.draws.find(x=>x?.id===c.drawId);
    if(!d||d.status!=='committed'||d.encounterId!==s.encounterId||
       d.round!==c.round||!uint(d.seed))reject('uncommitted initiative seed');
    s.usedDrawIds.add(d.id);s.round++;s.elapsedRounds++;
    s.elapsedSeconds+=COMBAT_ROUND_SECONDS;
    s.order=draw({...s.roster,location:s.location},s.actors,d.seed);
    s.index=0;s.budgets=Object.fromEntries(
      s.roster.filter(p=>p.kind==='human').map(p=>[p.id,createActionBudget()]));
    s.drawHistory.push({round:s.round,drawId:d.id,seed:d.seed,order:copy(s.order)});
    s.phase='turn';setPhase(s);
  }else if(c.type==='close'){
    if(s.phase!=='conclude'||world.encounter.status!=='ended')
      reject('encounter cannot close while opponents remain');
    s.phase='ended';
  }else if(c.type==='death_roll'){
    if(s.phase!=='medical'||!s.medical||
       c.actorId!==s.medical.actorId||c.round!==s.round||
       c.card!==s.order[s.index].card||
       c.woundCode!==s.medical.codes[0]||
       !obj(c.roll)||c.roll.skill!=='stamina'||c.roll.stressDice!==0||
       c.roll.push!==0||!uint(c.roll.seed)||typeof c.roll.success!=='boolean')
      reject('death roll is not due or is not source-legal');
    const before=s.actors.find(a=>a.id===c.actorId);
    const wound=before.criticalInjuries.find(w=>w.code===c.woundCode);
    if(!wound||wound.stabilized||wound.healed)reject('no open lethal wound');
    applyAfter(s,c);
    const after=s.actors.find(a=>a.id===c.actorId);
    const updated=after.criticalInjuries.find(w=>w.code===c.woundCode);
    if(!updated||updated.lastTurnDeathRound!==s.round||
       (c.roll.success&&((updated.deathSuccesses??0)!==(wound.deathSuccesses??0)+1))||
       (!c.roll.success&&!after.dead))
      reject('medical outcome does not match a committed death check');
    s.medical.codes.shift();
    if(!s.medical.codes.length||after.dead){
      s.medical=null;s.index++;s.phase='turn';setPhase(s);
    }
  }else if(c.type==='hold'){
    const slot=checkSlot(s,c);
    if(s.phase!=='turn'||slot.kind!=='human'||!Number.isInteger(c.targetCard))
      reject('initiative hold requires the active human');
    const j=s.order.findIndex((x,i)=>i>s.index&&x.card===c.targetCard);
    if(j<0)reject('cannot hold to an elapsed initiative card');
    const later=s.order[j];
    s.order[s.index]={...later,card:slot.card};
    s.order[j]={...slot,card:later.card};
    setPhase(s);
  }else if(c.type==='declare'){
    const slot=checkSlot(s,c);
    if(s.phase!=='turn'||!id(c.targetId)||c.targetId===c.actorId||
       !['melee','ranged'].includes(c.method)||
       !eligible(s.actors.find(a=>a.id===c.targetId),s.location)||
       !eligible(s.actors.find(a=>a.id===c.actorId),s.location)||
       c.action!=='attack'||typeof c.ambush!=='boolean')
      reject('uncommitted or impossible attack declaration');
    if(slot.kind==='human'){
      const b=s.budgets[c.actorId];
      if(b.fullSpent||b.quickSpent>=2||
         s.actors.find(a=>a.id===c.actorId).broken)
        reject('attacker cannot spend a full action');
    }
    committedProposal(world,c,'attack',slot.kind==='human'?'full':'turn');
    if(s.usedProposalIds.has(c.proposalId))reject('attack proposal already resolved');
    const target=s.actors.find(a=>a.id===c.targetId);
    const b=s.budgets[target.id];
    const canReact=target.kind==='human'&&!target.broken&&!c.ambush&&b&&
      b.quickSpent<2&&!(b.fullSpent&&b.quickSpent>=1);
    s.pending={attackId:c.id,actorId:c.actorId,targetId:c.targetId,
      method:c.method,proposalId:c.proposalId,decision:canReact?null:'none'};
    s.phase=canReact?'reaction':'turn';
  }else if(c.type==='reaction'){
    if(s.phase!=='reaction'||!s.pending||c.round!==s.round||
       c.card!==s.order[s.index].card||c.actorId!==s.pending.targetId||
       c.attackId!==s.pending.attackId||
       !['defend','dodge','decline'].includes(c.action))
      reject('reaction lacks a live declared incoming attack');
    if(c.action!=='decline'){
      if(c.action!==(s.pending.method==='melee'?'defend':'dodge'))
        reject('reaction does not match incoming attack type');
      committedProposal(world,c,c.action,'quick');
      if(s.usedProposalIds.has(c.proposalId))reject('reaction proposal already used');
      const paid=spendActionBudget(s.budgets[c.actorId],'quick');
      if(!paid.accepted)reject('no defensive quick action remains');
      s.budgets[c.actorId]=paid.budget;
      s.usedProposalIds.add(c.proposalId);
      applyAfter(s,c);
    }
    s.pending.decision=c.action;s.phase='turn';
  }else if(c.type==='action'){
    const slot=checkSlot(s,c);
    if(s.phase!=='turn'||!eligible(s.actors.find(a=>a.id===c.actorId),s.location)||
       !id(c.action))reject('invalid committed action ownership or location');
    if(slot.kind==='animal'){
      if(!['attack','move'].includes(c.action))reject('animal receives one move or strike per Speed slot');
      committedProposal(world,c,c.action,'turn');
    }else{
      const actor=s.actors.find(a=>a.id===c.actorId);
      if(actor.broken&&c.action!=='move')reject('broken human may only move once');
      let cost=COMBAT_ACTION_COSTS[c.action];
      if(!cost)reject('unsupported action cost');
      if(c.action==='move'){
        const wounds=woundModifiers(actor,'mobility');
        if(wounds.immobile)reject('injury prohibits movement');
        if(wounds.moveFull)cost='full';
      }
      committedProposal(world,c,c.action,cost);
      const paid=spendActionBudget(s.budgets[c.actorId],cost);
      if(!paid.accepted)reject('human quick/full budget exhausted');
      s.budgets[c.actorId]=paid.budget;
    }
    if(s.usedProposalIds.has(c.proposalId))reject('duplicate resolver proposal');
    if(c.action==='attack'){
      if(!s.pending||s.pending.actorId!==c.actorId||
         s.pending.proposalId!==c.proposalId||
         s.pending.attackId!==c.attackId||s.pending.decision===null||
         c.targetId!==s.pending.targetId)
        reject('attack has no resolved pre-strike declaration');
      s.pending=null;
    }else if(s.pending)reject('declared attack must be resolved before another action');
    s.usedProposalIds.add(c.proposalId);
    applyAfter(s,c);
    const b=s.budgets[c.actorId];
    if(slot.kind==='animal'||s.actors.find(a=>a.id===c.actorId).broken||
       (b.quickSpent===2||(b.fullSpent===1&&b.quickSpent===1)))
      finishSlot(s);
  }else if(c.type==='end'){
    const slot=checkSlot(s,c);
    if(s.phase!=='turn'||s.pending||slot.kind!=='human')
      reject('end turn requires the active human, without pending strike');
    finishSlot(s);
  }else reject('unsupported committed event type');
  s.history.push({id:c.id,ordinal:c.ordinal,type:c.type,round:c.round??s.round});
}
/**
 * Replay the trusted encounter ledger into a fresh projection. The host must
 * store the encounter, source proposals, actual resolver outcomes and draws
 * in its authoritative world; never pass client/model-generated stand-ins.
 * An absent encounter is a quiet noncombat path, with zero RNG draws.
 */
export function replayCombatRounds(world){
  if(!obj(world))reject('authoritative world required');
  if(world.encounter===null||world.encounter===undefined)return null;
  const e=world.encounter;
  if(!obj(e)||!id(e.id)||!id(e.location)||
     !['active','ended'].includes(e.status)||!id(e.initialDrawId)||
     !Array.isArray(e.roster)||!e.roster.length||e.roster.length>10||
     !Array.isArray(e.actors)||!Array.isArray(world.actors)||
     !Array.isArray(world.commits)||!Array.isArray(world.draws)||
     !Array.isArray(world.proposals))
    reject('incomplete committed encounter');
  const roster=e.roster;
  if(!uniq(roster.map(p=>p?.id))||roster.some(p=>!id(p.id)||
       !['human','animal'].includes(p.kind)||
       (p.kind==='human'&&p.speed!==1)||
       (p.kind==='animal'&&(!Number.isInteger(p.speed)||p.speed<1||p.speed>5)))||
     !roster.some(p=>p.kind==='human')||!roster.some(p=>p.kind==='animal')||
     roster.filter(p=>p.kind==='human').some(p=>p.id.startsWith('dinosaur-')))
    reject('invalid source-defined human/animal lineup');
  checkActors(e.actors,roster);checkActors(world.actors,roster);
  if(e.actors.some(a=>!eligible(a,e.location))||
     roster.reduce((n,p)=>n+p.speed,0)>10)
    reject('encounter requires physically present living actors and <=10 initiative cards');
  const first=world.draws.find(d=>d?.id===e.initialDrawId);
  if(!first||first.status!=='committed'||first.encounterId!==e.id||
     first.round!==1||!uint(first.seed))
    reject('missing committed opening initiative draw');
  const surprise=e.surpriseIds??[];
  if(!Array.isArray(surprise)||!uniq(surprise)||surprise.some(x=>!id(x)))
    reject('invalid source surprise roster');
  const order=draw({...roster,location:e.location},e.actors,first.seed,surprise);
  const s={version:MULTI_ROUND_COMBAT_VERSION,encounterId:e.id,location:e.location,
    roster:copy(roster),actors:copy(e.actors),round:1,index:0,order,
    budgets:Object.fromEntries(roster.filter(p=>p.kind==='human')
      .map(p=>[p.id,createActionBudget()])),phase:'turn',pending:null,medical:null,
    elapsedRounds:0,elapsedSeconds:0,history:[],drawHistory:[
      {round:1,drawId:first.id,seed:first.seed,order:copy(order)}],
    usedDrawIds:new Set([first.id]),usedCommitIds:new Set(),
    usedProposalIds:new Set(),lastOrdinal:0};
  setPhase(s);
  for(const c of world.commits)consume(s,world,c);
  if(!equal(s.actors,world.actors))reject('combat receipts diverge from committed world actors');
  if(e.status==='ended'&&s.phase!=='ended')
    reject('ended encounter lacks committed closure');
  // Public projections are JSON-safe, for deterministic save/replay and UI.
  const {usedDrawIds,usedCommitIds,usedProposalIds,...projection}=s;
  return copy({...projection,owner:s.phase==='turn'?
    copy(s.order[s.index]):null});
}
export function validCombatRounds(world){
  try{return replayCombatRounds(world)!==null;}catch{return false;}
}
