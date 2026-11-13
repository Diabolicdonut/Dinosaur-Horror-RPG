import test from 'node:test';
import assert from 'node:assert/strict';
import {replayCombatRounds,validCombatRounds,COMBAT_ROUND_SECONDS,
  COMBAT_ACTION_COSTS} from '../src/combat-round-adapter.mjs';

const clone=structuredClone;
const survivor=(id,wounds=[])=>({id,kind:'human',location:'forest',health:4,healthMax:4,
  dead:false,broken:false,criticalInjuries:clone(wounds)});
const animal=(id='hunter')=>({id,kind:'animal',location:'forest',health:6,healthMax:6,
  dead:false,broken:false,criticalInjuries:[]});
function world(seed=1993,{speed=2,wounds=[],humans=2}={}){
  const actors=[...Array.from({length:humans},(_,i)=>survivor('human-'+(i+1),
    i===0?wounds:[])),animal()];
  const roster=actors.map(a=>({id:a.id,kind:a.kind,speed:a.kind==='animal'?speed:1}));
  return {encounter:{id:'contact-1',location:'forest',status:'active',initialDrawId:'draw-1',
     roster,actors:clone(actors)},
    actors:clone(actors),proposals:[],commits:[],
    draws:[{id:'draw-1',encounterId:'contact-1',round:1,seed,status:'committed'}]};
}
const state=w=>replayCombatRounds(w);
function withOwner(kind,options={}){
  for(let seed=1;seed<100;seed++){
    const w=world(seed,options);
    if(state(w).owner?.kind===kind)return w;
  }
  throw new Error('No matching deterministic first initiative card');
}
function propose(w,actorId,action,cost,targetId){
  const id='proposal-'+(w.proposals.length+1);
  w.proposals.push({id,encounterId:w.encounter.id,actorId,action,cost,
    ...(targetId===undefined?{}:{targetId}),status:'authorized'});
  return id;
}
function commit(w,fields){
  const c={id:'commit-'+(w.commits.length+1),ordinal:w.commits.length+1,
    encounterId:w.encounter.id,...fields};
  w.commits.push(c);
  if(c.afterActors)w.actors=clone(c.afterActors);
  return state(w);
}
function current(w){return state(w).owner;}
function act(w,action='move',afterActors=w.actors){
  const slot=current(w);const cost=slot.kind==='animal'?'turn':COMBAT_ACTION_COSTS[action];
  const proposalId=propose(w,slot.actorId,action,cost);
  return commit(w,{type:'action',round:state(w).round,card:slot.card,
    actorId:slot.actorId,action,proposalId,afterActors:clone(afterActors)});
}
function end(w){
  const slot=current(w);
  return commit(w,{type:'end',round:state(w).round,card:slot.card,
    actorId:slot.actorId});
}
function advanceToDraw(w){
  for(let n=0;n<20;n++){
    const s=state(w);
    if(s.phase!=='turn')return s;
    if(s.owner.kind==='human')end(w);
    else act(w,'move');
  }
  throw Error('No round boundary');
}

test('DHR-015: no encounter is a genuinely quiet no-draw path',()=>{
  const w=world();w.encounter=null;w.draws=[];
  const before=clone(w);
  assert.equal(state(w),null);
  assert.deepEqual(w,before);
  assert.equal(validCombatRounds(w),false);
});
test('DHR-015: source-numbered cards, actor ownership and Speed 2 are seed-replayable',()=>{
  const w=world(2391),before=clone(w),s=state(w);
  assert.deepEqual(s,state(clone(w)));
  assert.deepEqual(w,before);
  assert.equal(s.round,1);assert.equal(s.elapsedSeconds,0);
  assert.equal(s.order.length,4);
  assert.equal(new Set(s.order.map(x=>x.card)).size,4);
  assert.equal(s.order.filter(x=>x.kind==='animal').length,2);
  assert.deepEqual(s.order.filter(x=>x.kind==='animal').map(x=>x.turnIndex).sort(),[1,2]);
  assert.deepEqual(s.owner,s.order[0]);
  assert.equal(validCombatRounds(w),true);
});
test('DHR-015: initial physical room, live actors, rules Speed and draw receipt are mandatory',()=>{
  for(const mutation of [
    w=>w.encounter=null,
    w=>w.encounter.actors[0].location='river',
    w=>w.encounter.actors[1].dead=true,
    w=>w.encounter.roster[2].speed=9,
    w=>w.encounter.roster[1].id=w.encounter.roster[0].id,
    w=>w.encounter.roster[0].kind='animal',
    w=>w.draws[0].status='pending',
    w=>w.draws[0].seed=-1,
    w=>w.encounter.initialDrawId='ghost',
    w=>w.encounter.actors[0].criticalInjuries=[{code:99}]
  ]){
    const w=world();mutation(w);
    if(w.encounter!==null)assert.equal(validCombatRounds(w),false);
    else assert.equal(state(w),null);
  }
});
test('DHR-015: human full plus quick and two quick exhaust exactly the source budgets',()=>{
  const w=withOwner('human'),who=current(w).actorId,firstCard=current(w).card;
  act(w,'use');
  assert.equal(state(w).owner.actorId,who);
  assert.equal(state(w).budgets[who].fullSpent,1);
  assert.equal(state(w).owner.card,firstCard);
  const before=clone(w);
  assert.throws(()=>act(w,'use'),RangeError);
  // An invalid commit/proposal must not alter the accepted original ledger.
  Object.assign(w,before);
  act(w,'move');
  assert.equal(state(w).budgets[who].quickSpent,1);
  assert.notEqual(state(w).owner?.card,firstCard);
  const two=withOwner('human'),h=current(two).actorId;
  act(two,'move');act(two,'guard');
  assert.equal(state(two).budgets[h].quickSpent,2);
  assert.equal(state(two).budgets[h].full,0);
});

test('DHR-015: invented proposals, off-turn actions and impossible actors are rejected',()=>{
  const w=withOwner('human'),owner=current(w);
  const phantom=clone(w);
  phantom.commits.push({id:'fake',ordinal:1,encounterId:w.encounter.id,
    type:'action',round:1,card:owner.card,actorId:owner.actorId,
    action:'use',proposalId:'model-says-so',afterActors:clone(w.actors),authorized:true});
  assert.equal(validCombatRounds(phantom),false);
  const wrong=clone(w),p=propose(wrong,'human-2','move','quick');
  assert.throws(()=>commit(wrong,{type:'action',round:1,card:owner.card,
    actorId:'human-2',action:'move',proposalId:p,afterActors:clone(wrong.actors)}),
    RangeError);
  const remote=clone(w),a=remote.encounter.actors.find(x=>x.id===owner.actorId);
  a.location='river';
  assert.equal(validCombatRounds(remote),false);
});
test('DHR-015: animal receives one source move/strike, not human full plus quick',()=>{
  const w=withOwner('animal'),owner=current(w);
  act(w,'move');
  assert.notEqual(state(w).owner.card,owner.card);
  const bad=withOwner('animal'),slot=current(bad);
  const proposalId=propose(bad,slot.actorId,'aid','turn');
  assert.throws(()=>commit(bad,{type:'action',round:1,card:slot.card,actorId:slot.actorId,
    action:'aid',proposalId,afterActors:clone(bad.actors)}),RangeError);
});
test('DHR-015: attack declaration gates reaction before strike, spends one quick, no second free defense',()=>{
  const w=withOwner('animal'),slot=current(w);
  const attackProposal=propose(w,slot.actorId,'attack','turn','human-1');
  const declared=commit(w,{type:'declare',actorId:slot.actorId,round:1,card:slot.card,
    targetId:'human-1',action:'attack',proposalId:attackProposal,
    method:'melee',ambush:false});
  assert.equal(declared.phase,'reaction');
  const wrong=clone(w),badProposal=propose(wrong,'human-1','dodge','quick');
  assert.throws(()=>commit(wrong,{type:'reaction',actorId:'human-1',
    round:1,card:slot.card,attackId:'commit-1',action:'dodge',
    proposalId:badProposal,afterActors:clone(wrong.actors)}),RangeError);
  const defending=clone(w),defenseProposal=propose(defending,'human-1','defend','quick');
  const reacted=commit(defending,{type:'reaction',actorId:'human-1',round:1,card:slot.card,
    attackId:'commit-1',action:'defend',proposalId:defenseProposal,
    afterActors:clone(defending.actors)});
  assert.equal(reacted.phase,'turn');
  assert.equal(reacted.budgets['human-1'].quickSpent,1);
  const again=clone(defending),other=propose(again,'human-1','defend','quick');
  assert.throws(()=>commit(again,{type:'reaction',actorId:'human-1',round:1,
    card:slot.card,attackId:'commit-1',action:'defend',proposalId:other,
    afterActors:clone(again.actors)}),RangeError);
  const struck=commit(defending,{type:'action',actorId:slot.actorId,round:1,
    card:slot.card,action:'attack',targetId:'human-1',attackId:'commit-1',
    proposalId:attackProposal,afterActors:clone(defending.actors)});
  assert.equal(struck.phase,'turn');
  assert.notEqual(struck.owner.card,slot.card);
  assert.equal(struck.usedProposalIds,undefined,'internal authorization sets are private');
});
test('DHR-015: undeclared attacks, preemptive defense, ambush dodge and forged target fail',()=>{
  const w=withOwner('animal'),slot=current(w);
  const p=propose(w,slot.actorId,'attack','turn','human-1');
  assert.throws(()=>commit(w,{type:'action',actorId:slot.actorId,round:1,
    card:slot.card,action:'attack',targetId:'human-1',
    proposalId:p,afterActors:clone(w.actors)}),RangeError);
  const fresh=withOwner('animal'),s=current(fresh);
  const q=propose(fresh,s.actorId,'attack','turn','human-1');
  commit(fresh,{type:'declare',actorId:s.actorId,round:1,card:s.card,
    action:'attack',proposalId:q,targetId:'human-1',method:'melee',ambush:true});
  assert.equal(state(fresh).phase,'turn');
  const def=propose(fresh,'human-1','defend','quick');
  assert.throws(()=>commit(fresh,{type:'reaction',actorId:'human-1',round:1,
    card:s.card,attackId:'commit-1',action:'defend',proposalId:def,
    afterActors:clone(fresh.actors)}),RangeError);
});
test('DHR-015: every card resolves before a single committed next-round seeded draw',()=>{
  const w=world(118),before=clone(w);
  assert.equal(advanceToDraw(w).phase,'draw');
  const noSource=clone(w);
  assert.throws(()=>commit(noSource,{type:'round_draw',drawId:'draw-2',round:2}),RangeError);
  w.draws.push({id:'draw-2',encounterId:w.encounter.id,round:2,seed:44,status:'committed'});
  const next=commit(w,{type:'round_draw',drawId:'draw-2',round:2});
  assert.equal(next.round,2);
  assert.equal(next.elapsedSeconds,COMBAT_ROUND_SECONDS);
  assert.equal(next.elapsedRounds,1);
  assert.equal(next.drawHistory.length,2);
  for(const b of Object.values(next.budgets))assert.deepEqual(b,
    {full:1,quick:2,quickSpent:0,fullSpent:0});
  assert.deepEqual(next,state(clone(w)));
  assert.deepEqual(before.commits,[]);
  const duplicated=clone(w);
  assert.throws(()=>commit(duplicated,{type:'round_draw',drawId:'draw-2',round:3}),
    RangeError);
});
test('DHR-015: human initiative hold swaps later cards without new RNG or budget',()=>{
  const w=withOwner('human');const s=state(w);
  const nextCard=s.order.at(-1).card;
  const shifted=commit(w,{type:'hold',round:1,card:s.owner.card,actorId:s.owner.actorId,
    targetCard:nextCard});
  assert.equal(shifted.order[0].card,s.order[0].card);
  assert.equal(shifted.owner.actorId,s.order.at(-1).actorId);
  assert.equal(shifted.drawHistory.length,1);
  assert.deepEqual(shifted.budgets,s.budgets);
  const invalid=clone(w);
  assert.throws(()=>commit(invalid,{type:'hold',round:1,card:shifted.owner.card,
    actorId:shifted.owner.actorId,targetCard:s.order[0].card}),RangeError);
});
test('DHR-015: round-lethal Stamina due AFTER human turn, not at round boundary',()=>{
  const wound={code:61,deadline:'round',stabilized:false,healed:false,
    deathSuccesses:0,lastTurnDeathRound:0};
  const w=withOwner('human',{wounds:[wound]}),slot=current(w);
  // If the first turn belongs to the second human, reach the injured one.
  if(slot.actorId==='human-2')end(w);
  for(let i=0;current(w)?.actorId!=='human-1';i++){
    assert(i<5);
    if(current(w).kind==='animal')act(w,'move');else end(w);
  }
  const woundedCard=current(w).card;
  const pending=end(w);
  assert.equal(pending.phase,'medical');
  assert.equal(pending.owner,null);
  assert.deepEqual(pending.medical.codes,[61]);
  assert.equal(pending.elapsedSeconds,0);
  const missing=clone(w);
  assert.throws(()=>commit(missing,{type:'death_roll',actorId:'human-1',
    round:1,card:woundedCard,woundCode:61,roll:{skill:'stamina',stressDice:1,
      push:0,seed:3,success:true},afterActors:clone(missing.actors)}),RangeError);
  const after=clone(w.actors);
  const hit=after.find(a=>a.id==='human-1').criticalInjuries[0];
  hit.deathSuccesses=1;hit.lastTurnDeathRound=1;
  const resolved=commit(w,{type:'death_roll',actorId:'human-1',round:1,
    card:woundedCard,woundCode:61,roll:{skill:'stamina',stressDice:0,
      push:0,seed:3,success:true},afterActors:after});
  assert.notEqual(resolved.phase,'medical');
  assert.equal(resolved.actors.find(a=>a.id==='human-1')
    .criticalInjuries[0].lastTurnDeathRound,1);
  assert.deepEqual(resolved,state(clone(w)));
  const repeated=clone(w);
  assert.throws(()=>commit(repeated,{type:'death_roll',actorId:'human-1',
    round:1,card:woundedCard,woundCode:61,roll:{skill:'stamina',
      stressDice:0,push:0,seed:3,success:true},afterActors:clone(repeated.actors)}),
    RangeError);
});
test('DHR-015: broken survivor cannot get attacks or two free movements',()=>{
  const w=withOwner('human'),actor=current(w).actorId;
  for(const a of w.actors)if(a.id===actor)a.broken=true;
  for(const a of w.encounter.actors)if(a.id===actor)a.broken=true;
  const bad=clone(w),p=propose(bad,actor,'use','full');
  assert.throws(()=>commit(bad,{type:'action',actorId:actor,round:1,
    card:current(w).card,action:'use',proposalId:p,
    afterActors:clone(bad.actors)}),RangeError);
  act(w,'move');
  assert.notEqual(state(w).owner?.actorId,actor);
});
test('DHR-015: critical leg wounds change movement to a full action',()=>{
  const wound={code:14,deadline:null,stabilized:false,healed:false};
  const w=withOwner('human',{wounds:[wound]});
  if(current(w).actorId!=='human-1')end(w);
  for(let i=0;current(w)?.actorId!=='human-1';i++){
    assert(i<5);
    if(current(w).kind==='animal')act(w,'move');else end(w);
  }
  const p=propose(w,'human-1','move','full');
  const slot=current(w);
  const result=commit(w,{type:'action',round:1,card:slot.card,actorId:'human-1',
    action:'move',proposalId:p,afterActors:clone(w.actors)});
  assert.equal(result.budgets['human-1'].fullSpent,1);
});
test('DHR-015: resolved enemy death can end encounter without mandatory extra attack',()=>{
  const w=withOwner('animal'),slot=current(w),after=clone(w.actors);
  const humans=after.filter(a=>a.kind==='human');
  for(const a of humans){a.dead=true;a.health=0;a.broken=true;}
  const next=act(w,'move',after);
  assert.equal(next.phase,'conclude');
  w.encounter.status='ended';
  const closed=commit(w,{type:'close',round:next.round});
  assert.equal(closed.phase,'ended');
  assert.equal(closed.owner,null);
  assert.deepEqual(closed,state(clone(w)));
  assert.ok(slot.card>0);
});
test('DHR-015: control mode labels cannot inject moves or change deterministic replay',()=>{
  const w=world(77),baseline=state(w);
  for(const mode of ['party','focus','spectator']){
    const decorated=clone(w);
    decorated.controlMode=mode;
    assert.deepEqual(state(decorated),baseline);
  }
  const ghost=clone(w);
  ghost.commits=[{id:'fake',ordinal:4,type:'action',encounterId:w.encounter.id,
    round:1,card:baseline.owner.card,actorId:baseline.owner.actorId,
    proposalId:'none',action:'move',afterActors:clone(w.actors)}];
  assert.equal(validCombatRounds(ghost),false);
});

test('DHR-015: a wound inflicted during this turn waits until the following turn to cause a death check',()=>{
  const w=withOwner('human'),id=current(w).actorId;
  const after=clone(w.actors);
  after.find(a=>a.id===id).criticalInjuries.push({
    code:61,deadline:'round',stabilized:false,healed:false,deathSuccesses:0
  });
  act(w,'use',after);
  const completed=act(w,'move');
  assert.notEqual(completed.phase,'medical','wound newly appearing this turn cannot check immediately');
  assert.equal(completed.woundBirthRounds[id+':61'],1);
  assert.equal(advanceToDraw(w).phase,'draw');
  w.draws.push({id:'draw-2',encounterId:w.encounter.id,
    round:2,seed:123,status:'committed'});
  commit(w,{type:'round_draw',drawId:'draw-2',round:2});
  for(let i=0;current(w)?.actorId!==id;i++){
    assert(i<6);
    if(current(w).kind==='animal')act(w,'move');else end(w);
  }
  assert.equal(end(w).phase,'medical');
});
test('DHR-015: failed committed round-lethal roll kills once, without speculative rerolls',()=>{
  const wound={code:62,deadline:'round',stabilized:false,healed:false,
    deathSuccesses:0,lastTurnDeathRound:0};
  const w=withOwner('human',{wounds:[wound]});
  for(let i=0;current(w)?.actorId!=='human-1';i++){
    assert(i<6);
    if(current(w).kind==='animal')act(w,'move');else end(w);
  }
  const card=current(w).card;
  assert.equal(end(w).phase,'medical');
  const after=clone(w.actors);
  after.find(a=>a.id==='human-1').dead=true;
  after.find(a=>a.id==='human-1').health=0;
  after.find(a=>a.id==='human-1').broken=true;
  after.find(a=>a.id==='human-1').criticalInjuries[0].lastTurnDeathRound=1;
  const resolved=commit(w,{type:'death_roll',actorId:'human-1',round:1,
    card,woundCode:62,roll:{skill:'stamina',stressDice:0,push:0,seed:18,success:false},
    afterActors:after});
  assert.notEqual(resolved.phase,'medical');
  assert.equal(resolved.actors.find(a=>a.id==='human-1').dead,true);
  assert.deepEqual(resolved,state(clone(w)));
});
