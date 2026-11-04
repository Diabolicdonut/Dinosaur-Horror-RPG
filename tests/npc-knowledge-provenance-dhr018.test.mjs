import test from 'node:test';
import assert from 'node:assert/strict';
import {compileNpcKnowledgeLedger,npcKnownFactsAt,npcFactProvenanceAt}
 from '../src/npc-knowledge-provenance.mjs';
import {npcPerceivedOptions} from '../src/npc-perception-policy.mjs';
import {compileSelectedAdventure} from '../src/adventure-catalog.mjs';
import {compileAdventure,adventureBinding} from '../src/adventure-definition.mjs';
import {RIDGE_SURVEY_REV10} from '../adventures/ridge-survey-rev10.mjs';
import {makeParty} from '../src/characters.mjs';
import {initialSupportingCast} from '../src/adventure-supporting-cast.mjs';
import {newPartyIncident,isPartySave} from '../src/party-engine.mjs';
import {setControlMode} from '../src/party-director.mjs';

const selectSeed=(adventure,slot,choice)=>{
 for(let seed=0;seed<200;seed++){
  const c=compileSelectedAdventure(adventure,seed);
  if(c.hiddenFacts[slot].id===choice)return c;
 }
 throw Error('Expected deterministic seed fixture unavailable');
};
const wet=()=>selectSeed('tidal-nursery','estuaryConditions','spring-tide');
const raptor=()=>selectSeed('ridge-survey','predatorPresence','raptor-territory');
const quiet=()=>selectSeed('ridge-survey','predatorPresence','quiet-range');
const frame=(source,beat,npc={},creature={},distressedNpcIds=[])=>({
 beat,
 npcRooms:Object.fromEntries((source.definition.supportingCast||[])
  .filter(n=>!n.variant||source.hiddenFacts[n.variant.slot].id===n.variant.choice)
  .map(n=>[n.id,npc[n.id]??n.location])),
 creatureRooms:Object.fromEntries(source.definition.initialCreatures
  .filter(c=>!c.when||source.hiddenFacts[c.when.slot].id===c.when.choice)
  .map(c=>[c.id,creature[c.id]??c.location])),
 distressedNpcIds
});
const wetFrames=source=>[
 frame(source,0),
 frame(source,1,{'ivo-pell':'reed-walk'}),
 frame(source,2,{'ivo-pell':'supply-shelter'})
];
const look={id:'look-tide',type:'observe',npcId:'ivo-pell',factId:'rising_tide',
 kind:'clue',beat:1,location:'reed-walk'};
const tell={id:'tell-tide',type:'report',fromNpcId:'ivo-pell',toNpcId:'mara-venn',
 factId:'rising_tide',kind:'clue',beat:2,location:'supply-shelter'};
const build=(source=wet(),frames=wetFrames(source),events=[look,tell])=>
 compileNpcKnowledgeLedger(source,{frames,events});
const reject=(source,frames,events)=>assert.throws(
 ()=>compileNpcKnowledgeLedger(source,{frames,events}),RangeError);

test('DHR-018: real source-seeded clue is witnessed only by locally present actor',()=>{
 const source=wet(),ledger=build(source);
 assert.equal(ledger.schemaVersion,1);
 assert.deepEqual(npcKnownFactsAt(ledger,'ivo-pell',0),[]);
 assert.deepEqual(npcKnownFactsAt(ledger,'ivo-pell',1),[
  {id:'rising_tide',kind:'clue',source:'observed',local:true}
 ]);
 assert.deepEqual(npcKnownFactsAt(ledger,'ivo-pell',2),[
  {id:'rising_tide',kind:'clue',source:'observed',local:false}
 ]);
 assert.match(ledger.identity,/^npc-knowledge-v1:/);
});

test('DHR-018: identified same-room speaker grants reported, never observed knowledge',()=>{
 const ledger=build();
 assert.deepEqual(npcKnownFactsAt(ledger,'mara-venn',0),[]);
 assert.deepEqual(npcKnownFactsAt(ledger,'mara-venn',2),[
  {id:'rising_tide',kind:'clue',source:'reported',local:false}
 ]);
 assert.deepEqual(npcFactProvenanceAt(ledger,'mara-venn','rising_tide',2),
  {status:'reported',witnessed:false,reports:['ivo-pell']});
 assert.deepEqual(npcFactProvenanceAt(ledger,'mara-venn','rising_tide',0),
  {status:'unknown',witnessed:false,reports:[]});
});

test('DHR-018: rumors cannot trigger witnessed-only NPC reactions, even at destination',()=>{
 const ledger=build();
 const flags={selfPreservation:true,aidOthers:true,curiosity:true};
 const npc= npcKnownFactsAt(ledger,'mara-venn',2);
 assert.deepEqual(npcPerceivedOptions({knownFacts:npc,motiveFlags:flags,
  legalExits:['reed-walk']}),[{kind:'hold'}]);
});

test('DHR-018: firsthand claim never promotes another NPC rumor to an eyewitness fact',()=>{
 const source=wet(),events=[tell];
 const ledger=build(source,wetFrames(source),events);
 assert.equal(npcFactProvenanceAt(ledger,'mara-venn','rising_tide',2).status,'reported');
 assert.equal(npcFactProvenanceAt(ledger,'ivo-pell','rising_tide',2).status,'unknown');
});

test('DHR-018: independent genuine observation may upgrade knowledge without deleting report sources',()=>{
 const source=raptor();
 const frames=[frame(source,0),frame(source,1,{}, {'hunter-1':'river-crossing'}),
  frame(source,2,{'jules-marsh':'field-camp'}, {'hunter-1':'forest-blind'})];
 const events=[
  {id:'mara-rumor',type:'report',fromNpcId:'leena-harrow',toNpcId:'jules-marsh',
   factId:'hunter-1',kind:'danger',beat:0,location:'river-crossing'}
 ];
 // An offsite speaker is rejected rather than treated as a known report.
 reject(source,frames,events);
 const genuine=[
  {id:'jules-eyes',type:'observe',npcId:'jules-marsh',factId:'hunter-1',
   kind:'danger',beat:1,location:'river-crossing'},
  {id:'jules-speaks',type:'report',fromNpcId:'jules-marsh',toNpcId:'leena-harrow',
   factId:'hunter-1',kind:'danger',beat:2,location:'field-camp'}
 ];
 const ledger=compileNpcKnowledgeLedger(source,{frames,events:genuine});
 assert.deepEqual(npcKnownFactsAt(ledger,'jules-marsh',1),[
  {id:'hunter-1',kind:'danger',source:'observed',local:true}]);
 assert.deepEqual(npcKnownFactsAt(ledger,'jules-marsh',2),[
  {id:'hunter-1',kind:'danger',source:'observed',local:false}]);
 assert.deepEqual(npcKnownFactsAt(ledger,'leena-harrow',2),[
  {id:'hunter-1',kind:'danger',source:'reported',local:false}]);
 assert.deepEqual(npcPerceivedOptions({knownFacts:npcKnownFactsAt(ledger,'jules-marsh',2),
  motiveFlags:{selfPreservation:true},legalExits:['river-crossing']}),[{kind:'hold'}]);
});

test('DHR-018: later genuine sighting upgrades an earlier attributed report only for that actor',()=>{
 const source=raptor();
 // Jules hears a claim from Leena in camp at beat zero only if locally present.
 // Begin instead with Jules seeing a real predator, then notifying local Leena;
 // Leena cannot become an eyewitness by repeating the same report.
 const frames=[frame(source,0),frame(source,1,{}, {'hunter-1':'river-crossing'}),
  frame(source,2,{'jules-marsh':'field-camp'}, {'hunter-1':'forest-blind'})];
 const a={id:'eyes',type:'observe',npcId:'jules-marsh',factId:'hunter-1',
  kind:'danger',beat:1,location:'river-crossing'};
 const b={id:'tells',type:'report',fromNpcId:'jules-marsh',toNpcId:'leena-harrow',
  factId:'hunter-1',kind:'danger',beat:2,location:'field-camp'};
 const ledger=compileNpcKnowledgeLedger(source,{frames,events:[a,b]});
 assert.deepEqual(npcFactProvenanceAt(ledger,'jules-marsh','hunter-1',2),
  {status:'observed',witnessed:true,reports:[]});
 assert.deepEqual(npcFactProvenanceAt(ledger,'leena-harrow','hunter-1',2),
  {status:'reported',witnessed:false,reports:['jules-marsh']});
});

test('DHR-018: seeded quiet range excludes absent predator even when forged frame claims it',()=>{
 const source=quiet(),frames=[frame(source,0)];
 reject(source,[{...frames[0],
  creatureRooms:{...frames[0].creatureRooms,'hunter-1':'forest-blind'}}],[]);
 reject(source,frames,[{id:'fake',type:'observe',npcId:'jules-marsh',
  factId:'hunter-1',kind:'danger',beat:0,location:'river-crossing'}]);
 assert.deepEqual(npcKnownFactsAt(build(source,frames,[]),'jules-marsh',0),[]);
});

test('DHR-018: no predator is created by rumor or pure ledger compilation',()=>{
 const source=wet();
 const frames=wetFrames(source);
 const ledger=build(source,frames,[{
  id:'caution',type:'report',fromNpcId:'ivo-pell',toNpcId:'mara-venn',
  factId:'imagined-hunter',kind:'danger',beat:2,location:'supply-shelter'
 }]);
 assert.deepEqual(npcKnownFactsAt(ledger,'mara-venn',2),[
  {id:'imagined-hunter',kind:'danger',source:'reported',local:false}]);
 assert.deepEqual(npcPerceivedOptions({knownFacts:npcKnownFactsAt(ledger,'mara-venn',2),
  motiveFlags:{selfPreservation:true},legalExits:['reed-walk']}),[{kind:'hold'}]);
 assert.equal(ledger.frames[2].creatureRooms['nursery-grazer'],'nesting-pool');
});

test('DHR-018: wrong location, remote recipient, unknown actor, future and absent frames fail',()=>{
 const source=wet(),frames=wetFrames(source);
 for(const event of [
  {...look,location:'supply-shelter'},
  {...look,npcId:'mara-venn'},
  {...look,npcId:'phantom'},
  {...look,beat:3},
  {...look,beat:-1},
  {...look,kind:'danger'},
  {...look,factId:'weak_antenna'},
  {...tell,beat:1},
  {...tell,fromNpcId:'ghost'},
  {...tell,toNpcId:'ivo-pell'},
  {...tell,location:'reed-walk'}
 ])reject(source,frames,[event]);
});

test('DHR-018: unsupported movement, invented initial positions and fabricated animals fail',()=>{
 const source=wet(),frames=wetFrames(source);
 for(const change of [
  f=>{f[0].npcRooms['ivo-pell']='supply-shelter';},
  f=>{f[1].npcRooms['ivo-pell']='signal-knoll';},
  f=>{f[1].npcRooms['mara-venn']='reed-walk';},
  f=>{f[1].creatureRooms['nursery-grazer']='reed-walk';},
  f=>{f[0].creatureRooms['nursery-grazer']='river-crossing';},
  f=>{f[1].creatureRooms['forged-hunter']='reed-walk';}
 ]){
  const copy=structuredClone(frames);change(copy);reject(source,copy,[]);
 }
});

test('DHR-018: local witnessed distress needs a real person, time and engine frame condition',()=>{
 const source=wet(),frames=wetFrames(source);
 const seen={id:'injury',type:'observe',npcId:'mara-venn',
  factId:'distress-ivo-pell',kind:'distress',beat:2,location:'supply-shelter'};
 reject(source,frames,[seen]);
 const injured=structuredClone(frames);
 injured[2].distressedNpcIds=['ivo-pell'];
 const ledger=build(source,injured,[seen]);
 assert.deepEqual(npcKnownFactsAt(ledger,'mara-venn',2),[
  {id:'distress-ivo-pell',kind:'distress',source:'observed',local:true}]);
 assert.deepEqual(npcPerceivedOptions({knownFacts:npcKnownFactsAt(ledger,'mara-venn',2),
  motiveFlags:{aidOthers:true},legalExits:[]}),[
  {kind:'hold'},{kind:'consider_help',factId:'distress-ivo-pell'}
 ]);
 assert.deepEqual(npcKnownFactsAt(ledger,'mara-venn',0),[]);
});

test('DHR-018: duplicate facts, report replays, contradictory identities fail closed',()=>{
 const source=wet(),frames=wetFrames(source);
 for(const events of [
  [look,look],
  [look,{...look,id:'second-look'}],
  [tell,{...tell,id:'second-tell'}],
  [look,{...tell,id:'look-tide'}],
  [look,{...tell,kind:'danger'}],
  [tell,{...tell,id:'other',factId:'rising_tide',fromNpcId:'ghost'}]
 ])reject(source,frames,events);
});

test('DHR-018: strict bounded input rejects unknown keys, prototypes and injection',()=>{
 const source=wet(),frames=wetFrames(source);
 for(const bad of [
  {},{frames,events:[],combat:true},
  {frames:[],events:[]},
  {frames:[...frames,frames[2]],events:[]},
  {frames:[{...frames[0],attack:true}],events:[]},
  {frames,events:[{...look,forceEncounter:true}]},
  {frames,events:[{...look,kind:'attack'}]},
  {frames,events:[{...look,id:'../../etc'}]},
  {frames,events:[{...tell,fromNpcId:()=>true}]},
  {frames,events:[look, ...Array.from({length:256},(_,i)=>({
   ...tell,id:'message-'+i,factId:'rumor-'+i}))]}
 ])assert.throws(()=>compileNpcKnowledgeLedger(source,bad),RangeError);
 const polluted=Object.assign(Object.create({secret:'yes'}),{...look});
 reject(source,frames,[polluted]);
});

test('DHR-018: independent seed replay, input ordering and immutable snapshots',()=>{
 const source=wet(),frames=wetFrames(source),events=[look,tell];
 const before=structuredClone({frames,events});
 const a=build(source,frames,events);
 const b=build(wet(),structuredClone(frames),[tell,look]);
 assert.deepEqual(a,b);
 assert.deepEqual({frames,events},before);
 for(const v of [a,a.source,a.frames,a.frames[0],a.frames[0].npcRooms,
  a.frames[0].creatureRooms,a.frames[0].distressedNpcIds,a.entries,a.entries[0],
  a.npcIds])assert.equal(Object.isFrozen(v),true);
 assert.throws(()=>{a.entries[0].kind='attack';},TypeError);
 assert.equal(npcKnownFactsAt(a,'mara-venn',2)[0].source,'reported');
 assert.throws(()=>npcKnownFactsAt(a,'mara-venn',3),RangeError);
 assert.throws(()=>npcKnownFactsAt(a,'phantom',2),RangeError);
 assert.throws(()=>npcFactProvenanceAt(a,'mara-venn','../secret',2),RangeError);
});

test('DHR-018: source seed and historical revision binding cannot be replayed against another compiled source',()=>{
 const a=wet();
 const b=compileSelectedAdventure('tidal-nursery',a.seed+1);
 assert.notEqual(a.seed,b.seed);
 assert.notEqual(build(a,wetFrames(a),[]).source.seed,b.seed);
 const other=compileSelectedAdventure('ridge-survey',a.seed);
 reject(other,wetFrames(a),[look]);
 const corrupt=structuredClone(a);corrupt.fingerprint='00000000';
 reject(corrupt,wetFrames(a),[look]);
});

test('DHR-018: old revision-10 save and three control modes remain exactly unchanged',()=>{
 const roster=makeParty({seed:61,size:1,careers:['scientist']});
 const compiled=compileAdventure(RIDGE_SURVEY_REV10,{seed:0});
 const save=newPartyIncident({seed:0,roster,adventureId:'ridge-survey'});
 save.adventureBinding=adventureBinding(compiled);
 save.supportingCast=initialSupportingCast(compiled);
 delete save.npcAutonomyRecords;
 delete save.npcDangerRecords;
 assert.equal(isPartySave(save),true);
 const before=structuredClone(save);
 compileNpcKnowledgeLedger(wet(),{frames:[frame(wet(),0)],events:[]});
 for(const mode of ['party','focus','spectator']){
  const options=mode==='focus'?{mode,focusedActorId:save.actors[0].id}:{mode};
  const result=setControlMode(save,options);
  assert.equal(result.accepted,true,result.reason);
  assert.equal(isPartySave(result.state),true);
  assert.equal(result.state.rng,save.rng);
  assert.equal(result.state.beat,save.beat);
 }
 assert.equal(isPartySave(save),true);
 assert.equal(save.npcDangerRecords,undefined);
 assert.deepEqual(save,before);
});
