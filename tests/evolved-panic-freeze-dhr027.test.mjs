import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {generateCharacter} from '../src/characters.mjs';
import {resolvePanic} from '../src/evolved-checks.mjs';
import {
  FREEZE_CONSEQUENCE_VERSION,createFreezeLedger,validateFreezeLedger,
  applyFreezeConsequence,authorizeFreezeAction,consumeFreezeTurn
} from '../src/evolved-panic-freeze.mjs';

const copy = x => JSON.parse(JSON.stringify(x));
const survivor = () => ({...generateCharacter({career:'scientist',seed:27092}),stress:7});
function seedFor(character,kind='freeze') {
  for (let seed=1;seed<=1000;seed++)
    if (resolvePanic(character,{seed}).kind===kind) return seed;
  throw new Error('No reproducible '+kind+' seed');
}
function scene(character) {
  return {
    phase:'combat', turn:{sequence:12,actorId:'pc-2'},
    actors:[
      {id:character.id,zone:'lab',health:character.healthMax,broken:false,dead:false},
      {id:'pc-2',zone:'lab',health:0,broken:true,dead:false}
    ],
    events:[{
      id:'broken-12',type:'pc_broken',actorId:'pc-2',zone:'lab',
      previousHealth:2,currentHealth:0,turnSequence:12,witnessedBy:[character.id]
    }]
  };
}
function apply(character=survivor(),encounter=scene(character),ledger=createFreezeLedger()) {
  return applyFreezeConsequence({
    character,encounter,eventId:'broken-12',seed:seedFor(character),ledger
  });
}
function nextTurn(encounter,character,sequence=14) {
  const out=copy(encounter);
  out.turn={sequence,actorId:character.id};
  out.turnHistory=sequence===14?
    [{sequence:13,actorId:'pc-2'},{sequence:14,actorId:character.id}]:[];
  return out;
}

test('DHR-027 Freeze adapter source boundary, node syntax and opt-in ledger version',()=>{
  for (const filename of ['../src/evolved-panic-freeze.mjs','./evolved-panic-freeze-dhr027.test.mjs']) {
    const url=new URL(filename,import.meta.url);
    const res=spawnSync(process.execPath,['--check',url.pathname],{encoding:'utf8'});
    assert.equal(res.status,0,res.stderr);
  }
  assert.equal(FREEZE_CONSEQUENCE_VERSION,'dhr-027-freeze-1');
  assert.deepEqual(createFreezeLedger(),{version:FREEZE_CONSEQUENCE_VERSION,entries:[]});
  assert(validateFreezeLedger(createFreezeLedger()));
});

test('verified combat witness and original seeded panic seven install a single Freeze without a new die',()=>{
  const character=survivor(),encounter=scene(character),ledger=createFreezeLedger();
  const before=[copy(character),copy(encounter),copy(ledger)];
  const result=apply(character,encounter,ledger);
  assert.equal(result.accepted,true);
  assert.equal(result.kind,'freeze');
  assert.equal(result.panic.kind,'freeze');
  assert.equal(result.panic.value,7);
  assert.equal(result.draws,1);
  assert.equal(result.entry.value,result.entry.d6+character.stress-character.resolve);
  assert.equal(result.afterCharacter.panicResponses.at(-1),'freeze');
  assert.deepEqual([character,encounter,ledger],before,'pure adapter never mutates source');
  assert(validateFreezeLedger(result.ledger));
});

test('Freeze uses the real Evolved outcome; a claimed panic result cannot manufacture it',()=>{
  const c=survivor(),e=scene(c);
  const other=seedFor(c,'spooked');
  const out=applyFreezeConsequence({
    character:c,encounter:e,eventId:'broken-12',seed:other,
    panicOutcome:{kind:'freeze',value:7},ledger:createFreezeLedger()
  });
  assert.equal(out.accepted,false);
  assert.equal(out.reason,'not_a_freeze_result');
  assert.equal(out.ledger.entries.length,0);
  assert.deepEqual(apply(c,e),apply(c,e),'same seed and world always replay identically');
});

test('unwitnessed, remote, invented, already-dead or retroactive break events cannot trigger Freeze',()=>{
  const c=survivor(),s=seedFor(c);
  const fail=(change)=>{
    const e=scene(c);
    change(e);
    const r=applyFreezeConsequence({
      character:c,encounter:e,eventId:'broken-12',seed:s,ledger:createFreezeLedger()
    });
    assert.equal(r.accepted,false,JSON.stringify(e));
    assert.equal(r.reason,'unverified_witness_event');
  };
  fail(e=>{e.events[0].witnessedBy=[];});
  fail(e=>{e.actors[0].zone='remote';});
  fail(e=>{e.actors[0].health=0;e.actors[0].broken=true;});
  fail(e=>{e.actors[0].dead=true;});
  fail(e=>{e.actors[1].dead=true;});
  fail(e=>{e.actors[1].broken=false;});
  fail(e=>{e.actors[1].health=1;});
  fail(e=>{e.events[0].previousHealth=0;});
  fail(e=>{e.events[0].currentHealth=1;});
  fail(e=>{e.events[0].type='horror_declared_by_ai';});
  fail(e=>{e.events[0].turnSequence=11;});
  fail(e=>{e.turn.sequence=13;});
  fail(e=>{e.events.push({...e.events[0],id:'newer-event'});});
  fail(e=>{e.events[0].actorId=c.id;});
  fail(e=>{e.events[0].zone='elsewhere';});
  fail(e=>{e.actors.push({...e.actors[0]});});
  fail(e=>{e.phase='exploration';});
});

test('invalid seed, malformed character and phantom response status fail closed',()=>{
  const c=survivor(),e=scene(c);
  assert.equal(applyFreezeConsequence({character:c,encounter:e,eventId:'broken-12',seed:-1}).reason,'invalid_seed');
  assert.equal(applyFreezeConsequence({character:c,encounter:e,eventId:'broken-12',seed:1.4}).reason,'invalid_seed');
  assert.equal(apply({...c,resolve:999},e).reason,'invalid_character');
  assert.equal(apply({...c,panicResponses:'freeze'},e).reason,'invalid_panic_state');
  assert.equal(apply({...c,panicResponses:['freeze']},e).reason,'panic_overlap_requires_escalation');
});

test('repeated event IDs and concurrent Freeze attempts cannot change an already-applied result',()=>{
  const c=survivor(),e=scene(c);
  const first=apply(c,e);
  assert(first.accepted);
  const same=apply(c,e,first.ledger);
  assert.equal(same.reason,'event_already_applied');
  assert.deepEqual(same.ledger,first.ledger);
  const secondScene=scene(c);
  secondScene.turn.sequence=13;
  secondScene.events[0]={...secondScene.events[0],id:'second-break',turnSequence:13};
  const overlap=applyFreezeConsequence({
    character:c,encounter:secondScene,eventId:'second-break',
    seed:seedFor(c),ledger:first.ledger
  });
  assert.equal(overlap.reason,'panic_overlap_requires_escalation');
  assert.equal(overlap.ledger.entries.length,1);
});

test('pending Freeze forbids interrupts and skips the next full or quick action turn, not past actions',()=>{
  const c=survivor(),result=apply(c);
  const auth=(kind,turnSequence)=>authorizeFreezeAction({
    ledger:result.ledger,actorId:c.id,kind,turnSequence
  });
  assert.deepEqual(auth('quick',12),{allowed:true,reason:null});
  assert.equal(auth('interrupt',12).reason,'freeze_blocks_interrupt');
  assert.equal(auth('interrupt',13).reason,'freeze_blocks_interrupt');
  assert.equal(auth('full',14).reason,'freeze_requires_skipped_turn');
  assert.equal(auth('quick',14).reason,'freeze_requires_skipped_turn');
  assert.equal(auth('full',11).reason,'retroactive_action');
  assert.deepEqual(authorizeFreezeAction({
    ledger:result.ledger,actorId:'pc-2',kind:'quick',turnSequence:14
  }),{allowed:true,reason:null});
  assert.equal(auth('invented_action',14).reason,'invalid_action');
});

test('the first verified subsequent actor turn is entirely lost exactly once, then Freeze ends',()=>{
  const c=survivor(),e=scene(c),first=apply(c,e);
  const next=nextTurn(e,c);
  const skipped=consumeFreezeTurn({
    character:first.afterCharacter,encounter:next,ledger:first.ledger
  });
  assert.equal(skipped.accepted,true);
  assert.equal(skipped.actionCost,'entire_turn');
  assert.equal(skipped.turnSequence,14);
  assert.equal(skipped.ledger.entries[0].skippedAt,14);
  assert.equal(skipped.afterCharacter.panicResponses.includes('freeze'),false);
  assert.equal(skipped.afterCharacter.stress,c.stress,'Freeze does not invent stress shifts');
  assert.deepEqual(authorizeFreezeAction({
    ledger:skipped.ledger,actorId:c.id,kind:'interrupt',turnSequence:15
  }),{allowed:true,reason:null});
  assert.equal(consumeFreezeTurn({
    character:skipped.afterCharacter,encounter:next,ledger:skipped.ledger
  }).reason,'no_pending_freeze');
  assert.equal(first.ledger.entries[0].skippedAt,null);
  assert.equal(first.afterCharacter.panicResponses.includes('freeze'),true);
});

test('no retroactive, delayed, off-turn or fabricated skip can consume the consequence',()=>{
  const c=survivor(),e=scene(c),first=apply(c,e);
  const consume=(world,actor=first.afterCharacter)=>consumeFreezeTurn({
    character:actor,encounter:world,ledger:first.ledger
  });
  assert.equal(consume(e).reason,'invalid_freeze_turn');
  const tooSoon=nextTurn(e,c,13);
  tooSoon.turnHistory=[{sequence:13,actorId:'pc-2'}];
  assert.equal(consume(tooSoon).reason,'unverified_next_turn');
  const wrongActor=nextTurn(e,c);
  wrongActor.turn.actorId='pc-2';
  assert.equal(consume(wrongActor).reason,'invalid_freeze_turn');
  const missing=nextTurn(e,c);
  missing.turnHistory=[{sequence:14,actorId:c.id}];
  assert.equal(consume(missing).reason,'unverified_next_turn');
  const late=nextTurn(e,c);
  late.turnHistory[0].actorId=c.id;
  assert.equal(consume(late).reason,'unverified_next_turn');
  const dead=nextTurn(e,c);
  dead.actors[0].dead=true;
  assert.equal(consume(dead).reason,'invalid_freeze_turn');
  assert.equal(consume(nextTurn(e,c),c).reason,'invalid_freeze_turn');
});

test('replay tampering or double-pending ledger is rejected before state can be changed',()=>{
  const c=survivor(),first=apply(c);
  for (const change of [
    l=>{l.entries[0].value=8;},
    l=>{l.entries[0].d6=1;},
    l=>{l.entries[0].seed=0xffffffff;},
    l=>{l.entries[0].resolve=999;},
    l=>{l.entries[0].skippedAt=12;},
    l=>{l.entries.push({...l.entries[0]});},
    l=>{l.entries.push({...l.entries[0],eventId:'forged',skippedAt:null});},
    l=>{l.version='fake';}
  ]) {
    const tampered=copy(first.ledger);change(tampered);
    assert.throws(()=>validateFreezeLedger(tampered),RangeError);
    assert.throws(()=>authorizeFreezeAction({
      ledger:tampered,actorId:c.id,kind:'interrupt',turnSequence:14
    }),RangeError);
  }
});

test('JSON serialization and Party / Focus / Spectator ownership leave consequences identical',()=>{
  const c=survivor();
  const baseline=apply(c);
  for (const mode of ['party','focus','spectator']) {
    const world=scene(c);world.control={mode};
    const result=apply(c,world);
    assert.deepEqual(result.ledger,baseline.ledger);
    const restored=JSON.parse(JSON.stringify(result.ledger));
    const actor=JSON.parse(JSON.stringify(result.afterCharacter));
    const skipped=consumeFreezeTurn({
      character:actor,encounter:nextTurn(world,c),ledger:restored
    });
    assert.equal(skipped.accepted,true);
  }
  assert.equal(c.panicResponses,undefined,'legacy actor is never rewritten');
  assert.equal(createFreezeLedger().entries.length,0,'old saves have no new mandatory field');
});
