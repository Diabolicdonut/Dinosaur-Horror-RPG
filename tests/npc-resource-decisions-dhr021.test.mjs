import test from 'node:test';
import assert from 'node:assert/strict';
import {planNpcResourceDecision} from '../src/npc-resource-decisions.mjs';
import {compileAdventure,adventureBinding} from '../src/adventure-definition.mjs';
import {TIDAL_NURSERY} from '../adventures/tidal-nursery.mjs';
import {RIDGE_SURVEY_REV10} from '../adventures/ridge-survey-rev10.mjs';
import {compileNpcMotiveIntent} from '../src/npc-motive-intent.mjs';
import {compileNpcKnowledgeLedger} from '../src/npc-knowledge-provenance.mjs';
import {makeParty} from '../src/characters.mjs';
import {newPartyIncident,isPartySave} from '../src/party-engine.mjs';
import {initialSupportingCast} from '../src/adventure-supporting-cast.mjs';
import {setControlMode} from '../src/party-director.mjs';

const equipment=[
 {itemId:'medical-pack',role:'medical',usesPerItem:3},
 {itemId:'emergency-rations',role:'supply',usesPerItem:1},
 {itemId:'survey-tool',role:'tool',usesPerItem:2},
 {itemId:'signal-flare',role:'weapon',usesPerItem:1}
];
function source(){
 const definition=structuredClone(TIDAL_NURSERY);
 definition.rooms['supply-shelter'].items.push(
  'medical-pack','emergency-rations','signal-flare');
 definition.rooms['reed-walk'].items.push('survey-tool');
 Object.assign(definition.itemNames,{
  'medical-pack':'Sealed first aid pack','emergency-rations':'Emergency ration',
  'survey-tool':'Tide gauge kit','signal-flare':'Signal flare'
 });
 for(let seed=0;seed<128;seed++){
  const compiled=compileAdventure(definition,{seed});
  if(compiled.hiddenFacts.estuaryConditions.id==='spring-tide')return compiled;
 }
 throw Error('no spring tide seed');
}
function frame(s,beat,ivoLocation='nesting-pool',distressed=[]){
 return {beat,npcRooms:{'mara-venn':'supply-shelter','ivo-pell':ivoLocation},
  creatureRooms:{'nursery-grazer':'nesting-pool'},distressedNpcIds:distressed};
}
function replay(s,kind='distress'){
 const frames=[frame(s,0),frame(s,1,'reed-walk'),
  frame(s,2,'supply-shelter',['ivo-pell'])];
 const distress={id:'seen-distress',type:'observe',npcId:'mara-venn',
  factId:'distress-ivo-pell',kind:'distress',beat:2,location:'supply-shelter'};
 const clue={id:'seen-tide',type:'observe',npcId:'ivo-pell',
  factId:'rising_tide',kind:'clue',beat:1,location:'reed-walk'};
 return compileNpcKnowledgeLedger(s,{frames,
  events:kind==='distress'?[distress]:kind==='clue'?[clue]:[]});
}
function motive(s,id='mara-venn',enabled=['help','inspect']){
 const npc=s.definition.supportingCast.find(n=>n.id===id);
 return compileNpcMotiveIntent(s,{
  source:{adventureId:s.adventureId,revision:s.revision,
   fingerprint:s.fingerprint,seed:s.seed,npcId:id,
   location:npc.location,motive:npc.motive,stance:npc.stance},
  traits:{selfPreservation:true,aidOthers:true,curiosity:true},
  intentions:enabled.map(kind=>kind==='help'?
   {id:'care',kind:'consider_help',when:'observed_local_distress'}:
   {id:'look',kind:'consider_inspection',when:'observed_local_clue'})
 });
}
function catalog(s,items=equipment){
 return {source:{adventureId:s.adventureId,revision:s.revision,
  fingerprint:s.fingerprint,seed:s.seed},items:structuredClone(items)};
}
function world(s,beat=2){
 const rooms=Object.fromEntries(Object.entries(s.definition.rooms)
  .map(([id,room])=>[id,{items:[...room.items]}]));
 for(const item of ['medical-pack','emergency-rations','signal-flare']){
  const at=rooms['supply-shelter'].items.indexOf(item);
  rooms['supply-shelter'].items.splice(at,1);
 }
 return {actors:[
  {id:'mara-venn',location:'supply-shelter',
   inventory:['medical-pack','emergency-rations','signal-flare'],gear:[]},
  {id:'ivo-pell',location:beat===0?'nesting-pool':
   beat===1?'reed-walk':'supply-shelter',inventory:[],gear:[]},
  {id:'pc-1',location:'supply-shelter',inventory:[...s.definition.startItems],gear:[]}
 ],rooms,usage:Object.fromEntries(equipment.map(item=>
  [item.itemId,{used:0,destroyed:0}]))};
}
const q=(npcId='mara-venn',beat=2)=>({npcId,beat,traversableExits:[]});
function run(s=source(),w=world(s),c=catalog(s),l=replay(s),p=motive(s),query=q()){
 return planNpcResourceDecision(s,p,l,query,c,w);
}
function rejects(change,description){
 const s=source(),w=world(s),c=catalog(s),l=replay(s),p=motive(s),query=q();
 change({s,w,c,l,p,query});
 const before=JSON.stringify({s,w,c,l,p,query});
 assert.throws(()=>run(s,w,c,l,p,query),RangeError,description);
 assert.equal(JSON.stringify({s,w,c,l,p,query}),before,
  'rejection never mutates even malformed input');
}
test('DHR-021: witnessed, motivated local distress permits only finite, proposed care',()=>{
 const s=source(),w=world(s),before=structuredClone(w),plan=run(s,w);
 assert.equal(plan.schemaVersion,1);
 assert.equal(plan.room,'supply-shelter');
 assert.deepEqual(plan.chosen,{
  kind:'use_equipment',itemId:'medical-pack',targetNpcId:'ivo-pell',
  factId:'distress-ivo-pell',consumesUses:1,
  cost:{minimumActions:1,executorMustCharge:true}
 });
 assert.ok(plan.candidates.some(x=>x.kind==='assist'));
 assert.ok(plan.candidates.some(x=>x.kind==='offer_equipment'&&x.itemId==='signal-flare'));
 assert.ok(plan.candidates.every(x=>!['attack','heal','create','commit'].includes(x.kind)));
 for(const option of plan.candidates.filter(x=>x.kind!=='hold'))
  assert.deepEqual(option.cost,{minimumActions:1,executorMustCharge:true});
 assert.equal('state' in plan,false);
 assert.equal('receipt' in plan,false);
 assert.deepEqual(w,before);
});
test('source items on the floor or held by someone else are not NPC-owned treatment',()=>{
 const s=source(),w=world(s);
 w.actors[0].inventory.splice(w.actors[0].inventory.indexOf('medical-pack'),1);
 w.rooms['supply-shelter'].items.push('medical-pack');
 const floor=run(s,w);
 assert.equal(floor.candidates.some(x=>x.itemId==='medical-pack'),false);
 assert.equal(floor.chosen.kind,'assist');
 w.rooms['supply-shelter'].items.splice(
  w.rooms['supply-shelter'].items.indexOf('medical-pack'),1);
 w.actors[2].inventory.push('medical-pack');
 const other=run(s,w);
 assert.equal(other.candidates.some(x=>x.itemId==='medical-pack'),false);
 assert.equal(other.chosen.kind,'assist');
});
test('no witnessed distress, quiet noncombat beat and ordinary supplies permit holding',()=>{
 const s=source(),w=world(s,0),l=compileNpcKnowledgeLedger(s,{
  frames:[frame(s,0)],events:[]});
 const plan=run(s,w,catalog(s),l,motive(s),q('mara-venn',0));
 assert.deepEqual(plan.candidates,[{kind:'hold'}]);
 assert.deepEqual(plan.chosen,{kind:'hold'});
 assert.equal('attack' in plan.chosen,false);
});
test('observed local clue permits using an actually carried tool, without revealing or resolving facts',()=>{
 const s=source(),w=world(s,1);
 w.rooms['reed-walk'].items.splice(w.rooms['reed-walk'].items.indexOf('survey-tool'),1);
 w.actors[1].inventory.push('survey-tool');
 const plan=run(s,w,catalog(s),replay(s,'clue'),motive(s,'ivo-pell'),q('ivo-pell',1));
 assert.deepEqual(plan.chosen,{
  kind:'use_equipment',itemId:'survey-tool',factId:'rising_tide',
  consumesUses:1,cost:{minimumActions:1,executorMustCharge:true}
 });
 assert.equal('discovered' in plan.chosen,false);
});
test('reported threats and unearned claims never give resource activity',()=>{
 const s=source(),w=world(s),p=motive(s);
 const l=replay(s,'none');
 assert.deepEqual(run(s,w,catalog(s),l,p).candidates,[{kind:'hold'}]);
});
test('exhausted multi-use medical pack cannot be reused or offered',()=>{
 const s=source(),w=world(s);
 w.usage['medical-pack'].used=3;
 const plan=run(s,w);
 assert.equal(plan.candidates.some(x=>x.itemId==='medical-pack'),false);
 assert.equal(plan.chosen.kind,'assist');
});
test('spent one-use rations are physically absent and cannot be offered again',()=>{
 const s=source(),w=world(s);
 w.actors[0].inventory.splice(w.actors[0].inventory.indexOf('emergency-rations'),1);
 w.usage['emergency-rations']={used:1,destroyed:1};
 const plan=run(s,w);
 assert.equal(plan.candidates.some(x=>x.itemId==='emergency-rations'),false);
 assert.equal(plan.chosen.kind,'use_equipment');
});
test('a distant NPC or actor not in the source-attested room cannot receive supplies',()=>{
 const s=source(),w=world(s);
 w.actors[1].location='nesting-pool';
 assert.throws(()=>run(s,w),RangeError);
 const same=world(s);
 same.actors[0].location='nesting-pool';
 assert.throws(()=>run(s,same),RangeError);
});
test('no phantom medical aid or weapons from unlisted stock or labels',()=>{
 const s=source(),w=world(s),c=catalog(s);
 c.items.push({itemId:'imaginary-medkit',role:'medical',usesPerItem:3});
 w.usage['imaginary-medkit']={used:0,destroyed:0};
 assert.throws(()=>run(s,w,c),RangeError);
 const w2=world(s),c2=catalog(s);
 w2.actors[0].inventory.push('phantom-gun');
 const plan=run(s,w2,c2);
 assert.equal(plan.candidates.some(x=>x.itemId==='phantom-gun'),false);
 assert.equal(plan.candidates.some(x=>x.kind==='attack'),false);
});
test('source binding rejects forged seed, revision, fingerprint or item identity',()=>{
 rejects(({c})=>{c.source.seed+=1;},'seed');
 rejects(({c})=>{c.source.revision+=1;},'revision');
 rejects(({c})=>{c.source.fingerprint='fake';},'fingerprint');
 rejects(({c})=>{c.items[0].itemId='missing-weapon';},'item');
});
test('duplicate and missing carried/floor equipment are rejected without side effects',()=>{
 rejects(({w})=>{w.actors[0].inventory.push('medical-pack');},'dup carried');
 rejects(({w})=>{w.rooms['supply-shelter'].items.push('medical-pack');},'dup floor');
 rejects(({w})=>{w.actors[0].inventory.pop();},'missing item');
 rejects(({w})=>{w.rooms['reed-walk'].items=[];},'missing remote floor tool');
 rejects(({w})=>{w.actors[0].gear.push('medical-pack');},'inventory/gear alias');
});
test('finite usage and disposal ledgers fail closed under inconsistent saves',()=>{
 rejects(({w})=>{w.usage['medical-pack'].used=4;},'overuse');
 rejects(({w})=>{w.usage['medical-pack'].used=-1;},'negative');
 rejects(({w})=>{w.usage['medical-pack'].destroyed=1;},'unaccounted removal');
 rejects(({w})=>{w.usage['emergency-rations'].used=1;},'use without destruction');
 rejects(({w})=>{w.usage['emergency-rations'].destroyed=1;},'destroy without use');
 rejects(({w})=>{delete w.usage['signal-flare'];},'missing usage');
 rejects(({w})=>{w.usage['created-supply']={used:0,destroyed:0};},'phantom usage');
 rejects(({c})=>{c.items.push({...c.items[0]});},'duplicate item');
 rejects(({c})=>{c.items[0].usesPerItem=0;},'free item');
});
test('untrusted world shape, unknown room, forged placement and unknown NPC fail closed',()=>{
 rejects(({w})=>{w.actors[0].location='unknown-room';},'fake room');
 rejects(({w})=>{w.actors.push({...w.actors[0]});},'duplicate actor');
 rejects(({w})=>{w.rooms.fake={items:[]};},'fake floor');
 rejects(({w})=>{delete w.rooms['signal-knoll'];},'missing floor');
 rejects(({w})=>{w.actors[0].gear='medical-pack';},'invalid gear');
 rejects(({w})=>{w.actors[0].outcome='healed';},'world injection');
 rejects(({query})=>{query.heal=true;},'query injection');
});
test('false motive traits, forged observations, absent intentions and mismatched source reject or hold',()=>{
 const s=source(),w=world(s),c=catalog(s),l=replay(s);
 const disabled=motive(s,'mara-venn',[]);
 assert.deepEqual(run(s,w,c,l,disabled).chosen,{kind:'hold'});
 const bad=structuredClone(motive(s));bad.motiveFlags.aidOthers=false;
 assert.throws(()=>run(s,w,c,l,bad),RangeError);
 const fake=structuredClone(l);fake.entries[0].location='nesting-pool';
 assert.throws(()=>run(s,w,c,fake),RangeError);
});
test('JSON seeded replay and reordered inventories preserve identical proposal identities',()=>{
 const s=source(),w=world(s),c=catalog(s),l=replay(s),p=motive(s);
 const a=run(s,w,c,l,p),b=run(source(),world(source()),
  catalog(source()),replay(source()),motive(source()));
 assert.deepEqual(a,b);
 const reversed=structuredClone(w);
 reversed.actors.reverse();
 reversed.actors[2].inventory.reverse();
 reversed.actors[2].gear.reverse();
 for(const room of Object.values(reversed.rooms))room.items.reverse();
 const c2=catalog(s,[...equipment].reverse());
 assert.deepEqual(run(s,reversed,c2,l,p),a);
 assert.match(a.identity,/^npc-resource-decision-v1:/);
 for(const item of [a,a.source,a.chosen,a.candidates,a.candidates[0]])
  assert.equal(Object.isFrozen(item),true);
 assert.throws(()=>{a.chosen.kind='free-heal';},TypeError);
});
test('cannot fabricate infinite multi-charge stock from two identical authored items',()=>{
 const s=source(),c=catalog(s),w=world(s);
 c.items.find(x=>x.itemId==='medical-pack').usesPerItem=4;
 w.rooms['supply-shelter'].items.push('medical-pack');
 assert.throws(()=>run(s,w,c),RangeError);
});
test('pure planner leaves historical Party save versions and all three control modes intact',()=>{
 const roster=makeParty({seed:61,size:1,careers:['scientist']});
 const old=compileAdventure(RIDGE_SURVEY_REV10,{seed:0});
 const save=newPartyIncident({seed:0,roster,adventureId:'ridge-survey'});
 save.adventureBinding=adventureBinding(old);
 save.supportingCast=initialSupportingCast(old);
 delete save.npcAutonomyRecords;delete save.npcDangerRecords;
 assert.equal(isPartySave(save),true);
 const before=structuredClone(save);
 const s=source();
 run(s,world(s),catalog(s),replay(s),motive(s));
 for(const mode of ['party','focus','spectator']){
  const opts=mode==='focus'?{mode,focusedActorId:save.actors[0].id}:{mode};
  const result=setControlMode(save,opts);
  assert.equal(result.accepted,true,result.reason);
  assert.equal(isPartySave(result.state),true);
  assert.equal(result.state.beat,save.beat);
  assert.equal(result.state.rng,save.rng);
 }
 assert.deepEqual(save,before);
});
