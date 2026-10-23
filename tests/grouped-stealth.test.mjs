import test from 'node:test';
import assert from 'node:assert/strict';
import {makeParty} from '../src/characters.mjs';
import {detectGroupCreature,searchHiddenGroup} from '../src/evolved-encounters.mjs';
import {newPartyIncident,partyStep,isPartySave} from '../src/party-engine.mjs';
const party=makeParty({seed:1027,size:3,careers:['ranger','scientist','tactical']});
test('group detection keeps only the strongest individual passive Observation success',()=>{
 const r=detectGroupCreature(party,{seed:43,observationDice:5});
 assert.equal(r.humans.length,3);
 assert.equal(r.best,Math.max(...r.humans.map(a=>a.successes)));
 assert.equal(r.margin,r.best-r.creature.successes);
 assert.deepEqual(r,detectGroupCreature(party,{seed:43,observationDice:5}));
});
test('grouped survivors never pool successes and do not trigger stress responses',()=>{
 const r=detectGroupCreature(party,{seed:8});
 const sum=r.humans.reduce((total,x)=>total+x.successes,0);
 assert.equal(r.best,Math.max(...r.humans.map(x=>x.successes)));
 assert(r.best<=sum);
 for(const x of r.humans){
  assert.deepEqual(x.responseEvents,[]);
  assert.deepEqual(x.pushes,[]);
 }
});
test('keeping watch helps only that survivor, not the creature or unrelated allies',()=>{
 const a=detectGroupCreature(party,{seed:77});
 const watched=structuredClone(party);watched[0].guarding=true;
 const b=detectGroupCreature(watched,{seed:77});
 assert.equal(b.humans[0].baseCount,a.humans[0].baseCount+2);
 assert.deepEqual(b.creature,a.creature);
 assert.deepEqual(b.humans.slice(1),a.humans.slice(1));
});
test('invalid duplicate actor ID or missing group is refused before any RNG',()=>{
 assert.throws(()=>detectGroupCreature([]),RangeError);
 assert.throws(()=>detectGroupCreature([party[0],party[0]]),RangeError);
 assert.throws(()=>searchHiddenGroup(['pc-1','pc-1']),RangeError);
});
test('active search reveals at most one hidden survivor per success',()=>{
 for(let seed=1;seed<60;seed++){
  const r=searchHiddenGroup(['pc-1','pc-2','pc-3'],{seed,observationDice:6});
  assert.equal(r.revealed.length,Math.min(3,r.search.successes));
  assert.equal(r.revealed.length+r.stillHidden.length,3);
  assert.deepEqual(r,searchHiddenGroup(['pc-1','pc-2','pc-3'],{seed,observationDice:6}));
 }
});
test('an unsuccessful active search does not reveal hidden characters',()=>{
 let found=false;
 for(let seed=1;seed<100;seed++){
  const r=searchHiddenGroup(['pc-1','pc-2'],{seed,observationDice:4});
  if(r.search.successes===0){
   found=true;assert.deepEqual(r.revealed,[]);
   assert.deepEqual(r.stillHidden,['pc-1','pc-2']);break;
  }
 }
 assert(found);
});
test('live multi-survivor contact is deterministic and still uses one physical animal',()=>{
 const run=()=>{
  const s=newPartyIncident({seed:93,roster:party});
  s.dinosaurs[0].location='control';
  const r=partyStep(s,'wait',{actorId:'pc-1',source:'human'});
  assert(r.accepted,r.reason);
  assert(isPartySave(r.state));
  assert.equal(r.state.dinosaurs.length,1);
  assert(r.state.actors.some(a=>(a.seenThreats||[]).length>0));
  return r.state;
 };
 assert.deepEqual(run(),run());
});
