import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {makeParty} from '../src/characters.mjs';
import {compileSelectedAdventure} from '../src/adventure-catalog.mjs';
import {compileAdventure,adventureBinding} from '../src/adventure-definition.mjs';
import {newPartyIncident,isPartySave,partyStep,partyView} from '../src/party-engine.mjs';
import {setControlMode} from '../src/party-director.mjs';
import {RIDGE_SURVEY_REV1} from '../adventures/ridge-survey-rev1.mjs';
import {RIDGE_SURVEY_REV12} from '../adventures/ridge-survey-rev12.mjs';
import {TIDAL_NURSERY as TIDAL_NURSERY_REV1} from '../adventures/tidal-nursery-rev1.mjs';
import {SEED_INCIDENT_FIXTURES,FROZEN_SOURCE_BLOBS} from './fixtures/dhr-006-seed-incident-fixtures.mjs';

const roster=makeParty({seed:710,size:1,careers:['scientist']});
const historical={
  'ridge-survey-rev1':RIDGE_SURVEY_REV1,
  'ridge-survey-rev12':RIDGE_SURVEY_REV12,
  'tidal-nursery-rev1':TIDAL_NURSERY_REV1
};
const roundTrip=value=>JSON.parse(JSON.stringify(value));

function compiledFor(fixture){
  if(fixture.historicalSource)
    return compileAdventure(historical[fixture.historicalSource],{seed:fixture.seed});
  // Nublar's accepted rev1 binding predates the independent generation seed.
  return compileSelectedAdventure(fixture.adventureId,
    fixture.adventureId==='nublar-after-the-storm'?0:fixture.seed);
}
function incidentFor(fixture){
  const save=newPartyIncident({adventureId:fixture.adventureId,
    seed:fixture.seed,roster});
  if(fixture.historicalSource){
    save.adventureBinding=adventureBinding(compiledFor(fixture));
    for(const field of fixture.removeModernFields||[])delete save[field];
  }
  if(fixture.legacyUnbound)delete save.adventureBinding;
  return save;
}
function replay(fixture,initial){
  let save=roundTrip(initial);
  const trace=[roundTrip(save)];
  for(const command of fixture.commands){
    const previous=roundTrip(save);
    const result=partyStep(save,command,{actorId:save.actors[save.cursor].id});
    assert.equal(result.accepted,true,fixture.id+': '+command+' -> '+result.reason);
    assert.deepEqual(save,previous,fixture.id+' must not mutate an input save');
    assert.equal(isPartySave(result.state),true,fixture.id+': post-action validation');
    save=roundTrip(result.state);
    assert.equal(isPartySave(save),true,fixture.id+': serialized action save');
    trace.push(save);
  }
  return trace;
}

test('DHR-006: frozen authored revision bytes match accepted main Git blob IDs',async()=>{
  for(const [path,expected] of Object.entries(FROZEN_SOURCE_BLOBS)){
    const bytes=await readFile(new URL('../'+path,import.meta.url));
    const header=Buffer.from('blob '+bytes.length+'\\0');
    const actual=createHash('sha1').update(header).update(bytes).digest('hex');
    assert.equal(actual,expected,path+' was edited rather than versioned');
  }
});

for(const fixture of SEED_INCIDENT_FIXTURES){
  test('DHR-006: '+fixture.id+' starts as a stable serializable, source-bound incident',()=>{
    const save=incidentFor(fixture);
    assert.equal(save.kind,'dinosaur-party-incident');
    assert.equal(save.version,3);
    assert.equal(save.scenario,fixture.scenario);
    assert.equal(save.initialSeed,fixture.seed);
    assert.equal(save.rng,fixture.seed);
    assert.equal(save.beat,0);
    assert.equal(save.round,1);
    assert.equal(save.control.mode,'party');
    assert.equal(save.actors.length,1);
    assert.equal(save.actors[0].location,fixture.start);
    assert.deepEqual(Object.keys(save.flags).sort(),fixture.flags);
    assert.equal(save.outcome,'playing');
    assert.equal(save.events.length,1);
    assert.equal(save.actions.length,0);
    if(fixture.legacyUnbound)assert.equal(save.adventureBinding,undefined);
    else assert.deepEqual(save.adventureBinding,adventureBinding(compiledFor(fixture)));
    assert.equal(isPartySave(save),true,fixture.id);
    assert.equal(partyView(save).location,fixture.start);
    assert.deepEqual(roundTrip(save),save,'fixture is valid JSON without runtime-only objects');
    assert.deepEqual(incidentFor(fixture),save,'seed and manifest create identical saves');
  });

  test('DHR-006: '+fixture.id+' deterministic action-tape replay survives JSON saves',()=>{
    const initial=incidentFor(fixture);
    assert.equal(isPartySave(initial),true);
    const first=replay(fixture,initial);
    const second=replay(fixture,roundTrip(initial));
    const third=replay(fixture,incidentFor(fixture));
    assert.deepEqual(second,first);
    assert.deepEqual(third,first);
    assert.ok(first.at(-1).beat>=initial.beat);
    assert.equal(first.at(-1).adventureBinding?.revision,
      fixture.legacyUnbound?undefined:fixture.revision);
    const after=first.at(-1);
    const before=roundTrip(after);
    const impossible=partyStep(after,'move nonexistent-room');
    assert.equal(impossible.accepted,false);
    assert.strictEqual(impossible.state,after,'rejected move must preserve the exact prior save');
    assert.deepEqual(after,before,'rejected move cannot mutate the fixture state');
    assert.equal(isPartySave(after),true);
  });

  test('DHR-006: '+fixture.id+' rejects forged identity, state and control',()=>{
    const original=incidentFor(fixture);
    const changes=[
      ['scenario identity',s=>{s.scenario='not-an-adventure';}],
      ['unreachable actor position',s=>{s.actors[0].location='nonexistent-room';}],
      ['unauthorized control mode',s=>{s.control.mode='gm';}],
      ['forged character attributes',s=>{s.startingRoster[0].attributes.wits=99;}]
    ];
    if(!fixture.legacyUnbound)changes.push(
      ['content fingerprint',s=>{s.adventureBinding.fingerprint='bad0feed';}],
      ['unpublished revision',s=>{s.adventureBinding.revision=999;}]
    );
    if(fixture.adventureId!=='nublar-after-the-storm')changes.push(
      ['fabricated physical stock',s=>{s.rooms[fixture.start].items.push('forged-item');}]
    );
    for(const [why,mutate] of changes){
      const save=roundTrip(original);
      mutate(save);
      assert.equal(isPartySave(save),false,fixture.id+' accepted '+why);
      assert.throws(()=>partyView(save),RangeError,fixture.id+': '+why);
      assert.equal(isPartySave(original),true,'tampering must not contaminate baseline');
    }
  });
}

test('DHR-006: seeded secrets reproduce exactly and vary without rewriting authored sources',()=>{
  for(const adventureId of ['nublar-after-the-storm','ridge-survey','tidal-nursery']){
    const choices=new Set();
    const fingerprints=new Set();
    for(let seed=0;seed<40;seed++){
      const first=compileSelectedAdventure(adventureId,seed);
      const second=compileSelectedAdventure(adventureId,seed);
      assert.deepEqual(second,first);
      choices.add(JSON.stringify(first.hiddenFacts));
      fingerprints.add(first.fingerprint);
    }
    assert.ok(choices.size>1,adventureId+' must support real seed-defined facts');
    assert.equal(fingerprints.size,1,adventureId+' seed cannot rewrite source');
  }
});

test('DHR-006: frozen saves cannot be rebound to current revisions by changing a field',()=>{
  for(const fixture of SEED_INCIDENT_FIXTURES.filter(x=>x.historicalSource)){
    const historicalSave=incidentFor(fixture);
    const current=compileSelectedAdventure(fixture.adventureId,fixture.seed);
    assert.equal(isPartySave(historicalSave),true);
    assert.notEqual(historicalSave.adventureBinding.revision,current.revision);
    assert.notEqual(historicalSave.adventureBinding.fingerprint,current.fingerprint);
    const forgedFingerprint=roundTrip(historicalSave);
    forgedFingerprint.adventureBinding.fingerprint=current.fingerprint;
    assert.equal(isPartySave(forgedFingerprint),false,fixture.id+': swapped fingerprint');
    const forgedRevision=roundTrip(historicalSave);
    forgedRevision.adventureBinding.revision=current.revision;
    assert.equal(isPartySave(forgedRevision),false,fixture.id+': swapped revision');
    assert.equal(isPartySave(historicalSave),true);
  }
});

test('DHR-006: genuine estuary dialogue is replayable; invented NPC knowledge is not',()=>{
  const fixture=SEED_INCIDENT_FIXTURES.find(x=>x.id==='tidal-current-rev2');
  const initial=incidentFor(fixture);
  const a=partyStep(initial,'talk to mara-venn about routes');
  const b=partyStep(roundTrip(initial),'talk to mara-venn about routes');
  assert.equal(a.accepted,true,a.reason);
  assert.deepEqual(a.state,b.state);
  assert.equal(a.state.beat,0,'talk cannot invent a timed roll');
  assert.equal(a.state.conversationRecords.length,1);
  assert.equal(isPartySave(roundTrip(a.state)),true);
  for(const mutate of [
    s=>{s.conversationRecords[0].topicId='safe-return';},
    s=>{s.conversationRecords[0].location='nesting-pool';},
    s=>{s.conversationRecords[0].beat=1000;}
  ]){
    const forged=roundTrip(a.state);
    mutate(forged);
    assert.equal(isPartySave(forged),false,'forged NPC testimony must not load');
  }
});

test('DHR-006: source-forbidden objective records and unearned endings cannot load',()=>{
  for(const id of ['ridge-current-rev13','tidal-current-rev2']){
    const fixture=SEED_INCIDENT_FIXTURES.find(x=>x.id===id);
    const original=incidentFor(fixture);
    const forged=roundTrip(original);
    forged.objectiveRecords.push({id:id.startsWith('ridge')?'walk-out':'return-safely',
      actorId:forged.actors[0].id,beat:0,room:fixture.start});
    assert.equal(isPartySave(forged),false,id+' accepted a forged completion');
    const unearned=roundTrip(original);
    unearned.outcome='rescued';
    assert.equal(isPartySave(unearned),false,id+' accepted a forged outcome');
  }
});

test('DHR-006: source-defined peaceful estuary remains peaceful across old and current saves',()=>{
  for(const fixture of SEED_INCIDENT_FIXTURES.filter(x=>x.adventureId==='tidal-nursery')){
    const trace=replay(fixture,incidentFor(fixture));
    for(const save of trace){
      assert.equal(save.combat,null);
      assert.equal(save.pendingPredatorResponse,null);
      assert.deepEqual(save.predatorContacts,[]);
      assert.ok(save.dinosaurs.every(d=>d.kind==='parasaurolophus'));
      assert.equal(isPartySave(save),true);
    }
  }
});

test('DHR-006: switching all three control modes preserves saved world and replay identity',()=>{
  for(const id of ['nublar-bound-v3','ridge-current-rev13','tidal-current-rev2']){
    const fixture=SEED_INCIDENT_FIXTURES.find(x=>x.id===id);
    const initial=incidentFor(fixture);
    const focus=setControlMode(initial,{mode:'focus',focusedActorId:initial.actors[0].id});
    assert.equal(focus.accepted,true,id);
    assert.equal(isPartySave(roundTrip(focus.state)),true);
    const spectator=setControlMode(focus.state,{mode:'spectator'});
    assert.equal(spectator.accepted,true,id);
    assert.equal(isPartySave(roundTrip(spectator.state)),true);
    assert.equal(spectator.state.rng,initial.rng,'mode switch cannot roll dice');
    assert.equal(spectator.state.beat,initial.beat,'mode switch cannot advance time');
    assert.deepEqual(spectator.state.rooms,initial.rooms,'mode switch cannot move stock');
    assert.deepEqual(spectator.state.dinosaurs,initial.dinosaurs,'mode switch cannot teleport animals');
    assert.equal(isPartySave(initial),true);
  }
});
