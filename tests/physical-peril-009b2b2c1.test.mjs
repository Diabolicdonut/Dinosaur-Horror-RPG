import test from 'node:test';
import assert from 'node:assert/strict';
import {makeParty} from '../src/characters.mjs';
import {compileSelectedAdventure} from '../src/adventure-catalog.mjs';
import {validateAdventureDefinition,compileAdventure,adventureBinding} from '../src/adventure-definition.mjs';
import {RIDGE_SURVEY_REV1} from '../adventures/ridge-survey-rev1.mjs';
import {RIDGE_SURVEY_REV2} from '../adventures/ridge-survey-rev2.mjs';
import {RIDGE_SURVEY_REV3} from '../adventures/ridge-survey-rev3.mjs';
import {availablePhysicalPerils,resolvePhysicalPeril,validPerilRecords} from '../src/adventure-perils.mjs';
import {newPartyIncident,isPartySave,partyStep,partyView} from '../src/party-engine.mjs';
const person=makeParty({seed:91,size:1,careers:['scientist']});
const seeds=Array.from({length:256},(_,i)=>i);
const nervous=seeds.find(i=>compileSelectedAdventure('ridge-survey',i).hiddenFacts.wildlifeBehavior.id==='nervous');
const grazing=seeds.find(i=>compileSelectedAdventure('ridge-survey',i).hiddenFacts.wildlifeBehavior.id==='grazing');
const fresh=(seed=nervous,roster=person)=>newPartyIncident({seed,roster,adventureId:'ridge-survey'});
function move(s,dest){const x=partyStep(s,'move '+dest);assert.equal(x.accepted,true,x.reason);return x.state;}
const ridge=s=>move(move(s,'rocky-ascent'),'survey-ridge');
test('009-B2b2c1: current research adventure is revision 5; immutable rev1/2/3 remain valid',()=>{
 const s=fresh();
 assert.equal(s.adventureBinding.revision,11);
 assert.equal(isPartySave(s),true);
 for(const [def,rev] of [[RIDGE_SURVEY_REV1,1],[RIDGE_SURVEY_REV2,2],[RIDGE_SURVEY_REV3,3]]){
  const old=structuredClone(s);
  old.adventureBinding=adventureBinding(compileAdventure(def,{seed:old.initialSeed}));
  delete old.supportingCast;delete old.conversationRecords;
  delete old.perilRecords;
  assert.equal(old.adventureBinding.revision,rev);
  assert.equal(isPartySave(old),true);
  assert.equal(partyView(ridge(old)).availableDangerEvents.length,0);
 }
});
test('009-B2b2c1: validated peril contract rejects fake creature/room/skill and unbounded attacks',()=>{
 const base=compileSelectedAdventure('ridge-survey',nervous).definition;
 for(const mutate of [
  d=>d.perils[0].room='river-crossing',
  d=>d.perils[0].creatureId='raptor-from-nowhere',
  d=>d.perils[0].skill='automatic_hit',
  d=>d.perils[0].modifier=-99,
  d=>d.perils[0].attackerDice=50,
  d=>d.perils[0].baseDamage=12,
  d=>d.perils[0].variant.choice='unknown',
  d=>d.perils[0].script='attack_everyone'
 ]){
  const modified=structuredClone(base);mutate(modified);
  assert.throws(()=>validateAdventureDefinition(modified),RangeError);
 }
});
test('009-B2b2c1: physical peril is absent outside the ridge and absent for calm herd seeds',()=>{
 const wary=fresh(nervous),calm=ridge(fresh(grazing));
 assert.equal(partyView(wary).availableDangerEvents.length,0);
 assert.deepEqual(partyView(calm).availableDangerEvents,[]);
 assert.equal(partyStep(calm,'danger herd-close-pass').accepted,false);
 assert.equal(partyStep(wary,'danger herd-close-pass').accepted,false);
});
test('009-B2b2c1: source danger opportunity exists only beside physical defensive animal',()=>{
 let s=ridge(fresh());
 const view=partyView(s);
 assert.equal(view.availableDangerEvents.length,1);
 assert.equal(view.availableDangerEvents[0].id,'herd-close-pass');
 assert.equal(view.availableDangerEvents[0].skill,'mobility');
 const before=structuredClone(s);
 const watch=partyStep(s,'wildlife watch');
 assert.equal(watch.accepted,true);
 assert.equal(watch.state.actors[0].health,before.actors[0].health);
 assert.equal(watch.state.perilRecords.length,0);
 assert.equal(isPartySave(watch.state),true);
});
test('009-B2b2c1: crossing an alarmed herd is opt-in, source Evolved, finite and non-repeatable',()=>{
 let s=ridge(fresh());
 const prior=structuredClone(s);
 const r=partyStep(s,'danger herd-close-pass');
 assert.equal(r.accepted,true,r.reason);
 assert.equal(r.state.beat,prior.beat+1);
 assert.equal(r.state.clock.explorationActions,prior.clock.explorationActions+1);
 assert.equal(r.state.actors[0].location,'survey-ridge');
 assert.equal(r.state.actions.at(-1).kind,'danger');
 assert.equal(r.state.actions.at(-1).skill,'mobility');
 assert.equal(r.state.perilRecords.length,1);
 assert.equal(r.state.perilRecords[0].id,'herd-close-pass');
 assert.equal(isPartySave(r.state),true);
 assert.equal(partyStep(r.state,'danger herd-close-pass').accepted,false);
 assert.deepEqual(s,prior);
});
test('009-B2b2c1: across deterministic seeds, failed Evolved evasion can cause real health loss',()=>{
 let injured=null,evaded=null,missed=null;
 for(let seed=1;seed<2200&&(!injured||!evaded||!missed);seed++){
  if(compileSelectedAdventure('ridge-survey',seed).hiddenFacts.wildlifeBehavior.id!=='nervous')continue;
  const s=ridge(fresh(seed));
  const r=partyStep(s,'danger herd-close-pass');
  assert.equal(r.accepted,true,r.reason);
  if(r.result.success)evaded??=r;
  else if(r.result.damage)injured??=r;
  else missed??=r;
 }
 assert.ok(injured,'at least one source Evolved strike can actually injure an exposed actor');
 assert.ok(evaded,'at least one source Evolved Mobility check avoids contact');
 assert.ok(missed,'even failed evasions need not magically guarantee a creature hit');
 assert.ok(injured.state.actors[0].health<injured.state.actors[0].healthMax);
 assert.equal(injured.state.perilRecords[0].damage,injured.result.damage);
 assert.equal(evaded.state.perilRecords[0].damage,0);
 assert.equal(isPartySave(injured.state),true);
 assert.equal(isPartySave(evaded.state),true);
});
test('009-B2b2c1: absent or relocated dinosaur cannot perform a hidden attack',()=>{
 const s=ridge(fresh());
 const instance=compileSelectedAdventure('ridge-survey',s.initialSeed);
 s.dinosaurs[0].location='forest-blind';
 assert.deepEqual(availablePhysicalPerils(instance,s,s.actors[0].id),[]);
 const rejected=resolvePhysicalPeril(instance,s,{actorId:s.actors[0].id,
  perilId:'herd-close-pass',skillSeed:1,attackSeed:2});
 assert.equal(rejected.accepted,false);
 assert.strictEqual(rejected.state,s);
});
test('009-B2b2c1: peril cannot be forged through an unsupported command or remote actor',()=>{
 const s=fresh();
 for(const command of ['danger herd-close-pass','attack dinosaur','summon raptor']){
  const r=partyStep(s,command);
  assert.equal(r.accepted,false);
  assert.strictEqual(r.state,s);
 }
});
test('009-B2b2c1: forged peril logs or modified damage fail causal save validation',()=>{
 const s=partyStep(ridge(fresh()),'danger herd-close-pass').state;
 const compiled=compileSelectedAdventure('ridge-survey',s.initialSeed);
 for(const change of [
  x=>x.perilRecords[0].room='field-camp',
  x=>x.perilRecords[0].actorId='pc-89',
  x=>x.perilRecords[0].damage=99,
  x=>x.perilRecords[0].beat=x.beat+1,
  x=>x.perilRecords.push({...x.perilRecords[0]}),
  x=>x.actions[x.actions.length-1].target='other-peril'
 ]){
  const forged=structuredClone(s);change(forged);
  assert.equal(validPerilRecords(compiled,forged),false);
  assert.equal(isPartySave(forged),false);
 }
});
test('009-B2b2c1: creature risk does not damage the unrelated Nublar rescue runtime',()=>{
 const nublar=newPartyIncident({seed:1993,roster:person});
 const before=structuredClone(nublar);
 assert.equal(isPartySave(nublar),true);
 assert.equal(partyStep(nublar,'danger herd-close-pass').accepted,false);
 assert.deepEqual(nublar,before);
});
test('009-B2b2c1: noncombat scenic wonder and risky animal encounter remain independent',()=>{
 let s=ridge(fresh());
 const first=partyStep(s,'scene living-valley');
 assert.equal(first.accepted,true,first.reason);
 assert.equal(first.state.beat,s.beat);
 assert.equal(first.state.perilRecords.length,0);
 const second=partyStep(first.state,'danger herd-close-pass');
 assert.equal(second.accepted,true,second.reason);
 assert.equal(second.state.cinematicRecords.length,1);
 assert.equal(isPartySave(second.state),true);
});

test('009-B2b2c1: Evolved medical aid treats only a real colocated injured teammate',()=>{
 const party=makeParty({seed:51,size:2,careers:['medic','scientist']});
 let s=fresh(nervous,party);
 s.actors[1].health=0;s.actors[1].broken=true;
 const before=structuredClone(s);
 const treated=partyStep(s,'aid '+party[1].id);
 assert.equal(treated.accepted,true,treated.reason);
 assert.equal(treated.state.beat,before.beat+1);
 assert.equal(treated.state.actions.at(-1).skill,'medical_aid');
 assert.equal(treated.state.actors[1].health>=0,true);
 assert.equal(isPartySave(treated.state),true);
 assert.deepEqual(s,before);
});
test('009-B2b2c1: Evolved Command rally never heals a distant person by narrative fiat',()=>{
 const party=makeParty({seed:58,size:2,careers:['supervisor','scientist']});
 let s=fresh(nervous,party);
 s.actors[1].health=0;s.actors[1].broken=true;
 s.actors[1].location='river-crossing';
 const denied=partyStep(s,'rally '+party[1].id);
 assert.equal(denied.accepted,false);
 assert.strictEqual(denied.state,s);
 s.actors[1].location='field-camp';
 const attempted=partyStep(s,'rally '+party[1].id);
 assert.equal(attempted.accepted,true,attempted.reason);
 assert.equal(attempted.state.actions.at(-1).skill,'command');
 assert.equal(isPartySave(attempted.state),true);
});
test('009-B2b2c1: uninjured teammates cannot be healed or rallied for free skill rolls',()=>{
 const party=makeParty({seed:41,size:2});
 const s=fresh(nervous,party);
 assert.equal(partyStep(s,'aid '+party[1].id).accepted,false);
 assert.equal(partyStep(s,'rally '+party[1].id).accepted,false);
 assert.equal(isPartySave(s),true);
});
