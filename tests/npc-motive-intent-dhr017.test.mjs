import test from 'node:test';
import assert from 'node:assert/strict';
import {compileNpcMotiveIntent} from '../src/npc-motive-intent.mjs';
import {npcPerceivedOptions} from '../src/npc-perception-policy.mjs';
import {compileSelectedAdventure} from '../src/adventure-catalog.mjs';
import {compileAdventure,adventureBinding} from '../src/adventure-definition.mjs';
import {RIDGE_SURVEY_REV10} from '../adventures/ridge-survey-rev10.mjs';
import {makeParty} from '../src/characters.mjs';
import {newPartyIncident,isPartySave} from '../src/party-engine.mjs';
import {initialSupportingCast} from '../src/adventure-supporting-cast.mjs';
import {setControlMode} from '../src/party-director.mjs';

const danger={id:'nearby-predator',kind:'danger',source:'observed',local:true};
const distress={id:'injured-guide',kind:'distress',source:'observed',local:true};
const clue={id:'fresh-track',kind:'clue',source:'observed',local:true};
const needs={
 withdraw:{id:'safety',kind:'withdraw',when:'observed_local_danger'},
 consider_help:{id:'care',kind:'consider_help',when:'observed_local_distress'},
 consider_inspection:{id:'investigate',kind:'consider_inspection',when:'observed_local_clue'}
};
const allTraits={selfPreservation:true,aidOthers:true,curiosity:true};
const compiled=seed=>compileSelectedAdventure('tidal-nursery',seed);
function author(source,npcId='mara-venn',traits=allTraits,intentions=Object.values(needs)){
 const npc=source.definition.supportingCast.find(n=>n.id===npcId);
 return {
  source:{
   adventureId:source.adventureId,revision:source.revision,
   fingerprint:source.fingerprint,seed:source.seed,
   npcId,location:npc.location,motive:npc.motive,stance:npc.stance
  },
  traits:{...traits},intentions:intentions.map(i=>({...i}))
 };
}
const reject=(source,edit)=>{
 const declaration=author(source);
 edit(declaration);
 assert.throws(()=>compileNpcMotiveIntent(source,declaration),RangeError);
};

test('DHR-017: genuine source cast binds the authored NPC, source seed and finite traits',()=>{
 const source=compiled(42);
 const contract=compileNpcMotiveIntent(source,author(source));
 assert.equal(contract.schemaVersion,1);
 assert.equal(contract.source.npcId,'mara-venn');
 assert.equal(contract.source.motive,source.definition.supportingCast[0].motive);
 assert.equal(contract.source.location,'supply-shelter');
 assert.equal(contract.source.fingerprint,source.fingerprint);
 assert.deepEqual(contract.motiveFlags,allTraits);
 assert.deepEqual(contract.intentions,Object.values(needs));
 assert.match(contract.identity,/^npc-motive-v1:tidal-nursery:2:/);
});

test('DHR-017: motive without an authored intention never compels flight, violence or an encounter',()=>{
 const source=compiled(11);
 const declaration=author(source,'mara-venn',allTraits,[]);
 const contract=compileNpcMotiveIntent(source,declaration);
 assert.deepEqual(contract.motiveFlags,{selfPreservation:false,aidOthers:false,curiosity:false});
 assert.deepEqual(npcPerceivedOptions({knownFacts:[danger,distress,clue],
  motiveFlags:contract.motiveFlags,legalExits:['reed-walk']}),[{kind:'hold'}]);
 assert.equal(contract.intentions.length,0);
});

test('DHR-017: explicitly permitted intent candidates remain nonexecuting and cannot force attacks',()=>{
 const source=compiled(11);
 const contract=compileNpcMotiveIntent(source,author(source));
 const options=npcPerceivedOptions({knownFacts:[danger,distress,clue],
  motiveFlags:contract.motiveFlags,legalExits:['reed-walk']});
 assert.deepEqual(options,[
  {kind:'hold'},{kind:'withdraw',to:'reed-walk'},
  {kind:'consider_help',factId:'injured-guide'},
  {kind:'consider_inspection',factId:'fresh-track'}
 ]);
 assert.equal(options.some(x=>['attack','combat','heal','spawn'].includes(x.kind)),false);
});

test('DHR-017: reported or remote knowledge cannot trigger local danger, aid, or investigation',()=>{
 const source=compiled(12);
 const contract=compileNpcMotiveIntent(source,author(source));
 for(const facts of [
  [{...danger,source:'reported'},{...distress,source:'reported'},
   {...clue,source:'reported'}],
  [{...danger,local:false},{...distress,local:false},{...clue,local:false}]
 ]){
  assert.deepEqual(npcPerceivedOptions({knownFacts:facts,
   motiveFlags:contract.motiveFlags,legalExits:['reed-walk']}),[{kind:'hold'}]);
 }
});

test('DHR-017: forged provenance and duplicate knowledge fail closed in perception adapter',()=>{
 const contract=compileNpcMotiveIntent(compiled(12),author(compiled(12)));
 for(const knownFacts of [
  [{...danger,source:'omniscient'}],
  [{...danger,forceAttack:true}],
  [danger,{...danger,kind:'clue'}],
  [{...danger,local:'true'}]
 ])assert.throws(()=>npcPerceivedOptions({
  knownFacts,motiveFlags:contract.motiveFlags,legalExits:['reed-walk']}),RangeError);
});

test('DHR-017: replay identity is input-order-independent and does not consume RNG',()=>{
 const source=compiled(4);
 const declaration=author(source);
 const before=structuredClone(declaration);
 const original=compileNpcMotiveIntent(source,declaration);
 const shuffled=structuredClone(declaration);
 shuffled.intentions.reverse();
 shuffled.traits={curiosity:true,aidOthers:true,selfPreservation:true};
 const again=compileNpcMotiveIntent(source,shuffled);
 assert.deepEqual(original,again);
 assert.deepEqual(declaration,before);
 assert.deepEqual(original,compileNpcMotiveIntent(compiled(4),author(compiled(4))));
});

test('DHR-017: identity changes with seed, authored traits or intended candidate set',()=>{
 const source=compiled(4);
 const a=compileNpcMotiveIntent(source,author(source));
 const differentSeed=compiled(5);
 const b=compileNpcMotiveIntent(differentSeed,author(differentSeed));
 const c=compileNpcMotiveIntent(source,author(source,'mara-venn',
  {selfPreservation:true,aidOthers:true,curiosity:false},
  [needs.withdraw,needs.consider_help]));
 assert.notEqual(a.identity,b.identity);
 assert.notEqual(a.identity,c.identity);
});

test('DHR-017: compiler freezes nested contract and cannot mutate a source manifest',()=>{
 const source=compiled(12),before=structuredClone(source);
 const contract=compileNpcMotiveIntent(source,author(source));
 for(const value of [contract,contract.source,contract.traits,contract.motiveFlags,
  contract.intentions,contract.intentions[0]])assert.equal(Object.isFrozen(value),true);
 assert.deepEqual(source,before);
 assert.throws(()=>{contract.traits.curiosity=false;},TypeError);
});

test('DHR-017: invented actors and mismatched authored motives fail even with plausible flags',()=>{
 const source=compiled(2);
 reject(source,d=>{d.source.npcId='phantom-guide';});
 reject(source,d=>{d.source.motive='Secretly plans to attack the survivors';});
 reject(source,d=>{d.source.stance='hostile';});
});

test('DHR-017: wrong room, adventure, seed, revision and fingerprint reject stale profiles',()=>{
 const source=compiled(12);
 reject(source,d=>{d.source.location='nesting-pool';});
 reject(source,d=>{d.source.location='fabricated-room';});
 reject(source,d=>{d.source.adventureId='ridge-survey';});
 reject(source,d=>{d.source.seed+=1;});
 reject(source,d=>{d.source.revision+=1;});
 reject(source,d=>{d.source.fingerprint='00000000';});
});

test('DHR-017: an otherwise genuine source bound to another seed cannot replay here',()=>{
 const one=compiled(1),two=compiled(2);
 assert.throws(()=>compileNpcMotiveIntent(two,author(one)),RangeError);
});

test('DHR-017: wrong, extra, missing, or coerced trait fields are rejected',()=>{
 const source=compiled(5);
 for(const edit of [
  d=>{d.traits.selfPreservation=1;},
  d=>{d.traits.aidOthers='true';},
  d=>{delete d.traits.curiosity;},
  d=>{d.traits.controlDinosaurs=true;},
  d=>{d.traits={__proto__:null};}
 ])reject(source,edit);
});

test('DHR-017: each intention is unique, sourced to an explicitly true trait and finite',()=>{
 const source=compiled(8);
 for(const edit of [
  d=>{d.intentions.push({...needs.withdraw,id:'safety-again'});},
  d=>{d.intentions.push({...needs.withdraw});},
  d=>{d.intentions.push({id:'fight',kind:'attack',when:'observed_local_danger'});},
  d=>{d.intentions[0].when='rumored_remote_danger';},
  d=>{d.intentions[0].when='always';},
  d=>{d.intentions[0].forceFight=true;},
  d=>{d.traits.selfPreservation=false;},
  d=>{d.intentions=null;}
 ])reject(source,edit);
});

test('DHR-017: unknown authority fields, callbacks and polluted prototypes fail closed',()=>{
 const source=compiled(8);
 for(const edit of [
  d=>{d.forceAttack=true;},
  d=>{d.source.hiddenKnowledge='predator';},
  d=>{d.intentions[0].target='raptor';},
  d=>{d.traits.curiosity=()=>true;},
  d=>{d.intentions[0]=Object.assign(Object.create({stealth:true}),d.intentions[0]);}
 ])reject(source,edit);
 for(const bad of [null,{},[],undefined,()=>author(source)])
  assert.throws(()=>compileNpcMotiveIntent(source,bad),RangeError);
});

test('DHR-017: source validation rejects modified compiled world truth rather than trusting its label',()=>{
 const source=compiled(22);
 const declaration=author(source);
 const forged=structuredClone(source);
 forged.definition.supportingCast[0].motive='A fabricated alternate motive';
 assert.throws(()=>compileNpcMotiveIntent(forged,declaration),RangeError);
});

test('DHR-017: seeded variant-absent NPC cannot receive a declared motive contract',()=>{
 const source=compiled(9);
 const modified=structuredClone(source.definition);
 modified.supportingCast[0].variant={slot:'estuaryConditions',choice:'spring-tide'};
 const a=compileAdventure(modified,{seed:0}),b=compileAdventure(modified,{seed:1});
 const absent=[a,b,...Array.from({length:12},(_,seed)=>compileAdventure(modified,{seed}))].find(
  c=>c.hiddenFacts.estuaryConditions.id!=='spring-tide');
 assert.ok(absent);
 assert.throws(()=>compileNpcMotiveIntent(absent,author(absent)),RangeError);
});

test('DHR-017: frozen Long Count rev10 historical save survives a pure profile query',()=>{
 const roster=makeParty({seed:61,size:1,careers:['scientist']});
 const old=compileAdventure(RIDGE_SURVEY_REV10,{seed:0});
 const save=newPartyIncident({seed:0,roster,adventureId:'ridge-survey'});
 save.adventureBinding=adventureBinding(old);
 save.supportingCast=initialSupportingCast(old);
 delete save.npcAutonomyRecords;
 delete save.npcDangerRecords;
 assert.equal(isPartySave(save),true);
 const before=structuredClone(save);
 const source=compiled(0);
 compileNpcMotiveIntent(source,author(source));
 assert.deepEqual(save,before);
 assert.equal(isPartySave(save),true);
 assert.equal(save.npcDangerRecords,undefined);
});

test('DHR-017: all three control modes are unchanged by independent authoring contract',()=>{
 const roster=makeParty({seed:19,size:1,careers:['scientist']});
 const source=compiled(8);
 const base=newPartyIncident({seed:8,roster,adventureId:'tidal-nursery'});
 assert.equal(isPartySave(base),true);
 const original=structuredClone(base);
 compileNpcMotiveIntent(source,author(source));
 for(const mode of ['party','focus','spectator']){
  const options=mode==='focus'?{mode,focusedActorId:base.actors[0].id}:{mode};
  const changed=setControlMode(base,options);
  assert.equal(changed.accepted,true,changed.reason);
  assert.equal(isPartySave(changed.state),true);
  assert.equal(changed.state.beat,original.beat);
  assert.equal(changed.state.rng,original.rng);
 }
 assert.deepEqual(base,original);
});
