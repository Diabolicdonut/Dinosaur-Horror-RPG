import test from 'node:test';
import assert from 'node:assert/strict';
import {makeParty} from '../src/characters.mjs';
import {compileSelectedAdventure} from '../src/adventure-catalog.mjs';
import {validateAdventureDefinition} from '../src/adventure-definition.mjs';
import {passageCircumstance,objectiveCircumstance,
 animalApproachCircumstance,localSituationCues} from '../src/adventure-situations.mjs';
import {newPartyIncident,partyView,partyStep,isPartySave} from '../src/party-engine.mjs';
const roster=makeParty({seed:7,size:1,careers:['scientist']});
const fresh=seed=>newPartyIncident({adventureId:'ridge-survey',seed,roster});
function play(s,action){
 const result=partyStep(s,action);
 assert.equal(result.accepted,true,result.reason||String(action));
 return result;
}
const all=Array.from({length:200},(_,seed)=>({seed,compiled:compileSelectedAdventure('ridge-survey',seed)}));
const findFact=(slot,fact)=>all.find(x=>x.compiled.hiddenFacts[slot].fact===fact).seed;
const flood=findFact('researchObstacle','flood'),equipment=findFact('researchObstacle','equipment');
const human=findFact('researchObstacle','human'),wary=findFact('wildlifeBehavior','defensive');
const calm=findFact('wildlifeBehavior','peaceful');
test('009-B2b2a: seeds deterministically choose different physical problems, not new Evolved rules',()=>{
 assert.equal(new Set([flood,equipment,human]).size,3);
 const a=compileSelectedAdventure('ridge-survey',flood),b=compileSelectedAdventure('ridge-survey',flood);
 assert.deepEqual(a,b);
 assert.equal(passageCircumstance(a,'river-crossing','forest-blind').skill,'mobility');
 assert.equal(passageCircumstance(a,'field-camp','river-crossing'),null);
 assert.equal(objectiveCircumstance(compileSelectedAdventure('ridge-survey',equipment),'send-field-report').modifier,-2);
 assert.equal(objectiveCircumstance(compileSelectedAdventure('ridge-survey',human),'recover-transect').modifier,-2);
 assert.equal(objectiveCircumstance(compileSelectedAdventure('ridge-survey',flood),'send-field-report'),null);
});
test('009-B2b2a: authored consequences require validated adjacent rooms, known objectives and source skills',()=>{
 const base=compileSelectedAdventure('ridge-survey',0).definition;
 for(const modify of [
  d=>d.variants.researchObstacle[0].mechanic.to='field-camp',
  d=>d.variants.researchObstacle[0].mechanic.skill='universal_success',
  d=>d.variants.researchObstacle[1].mechanic.objectiveId='invented',
  d=>d.variants.wildlifeBehavior[1].mechanic.to='field-camp',
  d=>d.variants.wildlifeBehavior[1].mechanic.response='teleport',
  d=>d.variants.researchObstacle[2].mechanic.modifier=100
 ]){
  const copied=structuredClone(base);modify(copied);
  assert.throws(()=>validateAdventureDefinition(copied),RangeError);
 }
});
test('009-B2b2a: observable physical clues reveal no remote hidden facts or seed',()=>{
 let s=fresh(flood);
 let v=partyView(s);
 assert.equal(v.sceneConsequences.length,0);
 const direct=localSituationCues(compileSelectedAdventure('ridge-survey',flood),'field-camp');
 assert.deepEqual(direct,[]);
 s=play(s,'move river-crossing').state;
 v=partyView(s);
 assert.match(v.sceneConsequences.map(x=>x.text).join(' '),/river.*rising/i);
 assert.equal(JSON.stringify(v).includes('researchObstacle'),false);
 assert.equal(JSON.stringify(v).includes('flooded-ford'),false);
 assert.equal(JSON.stringify(v).includes('hiddenFacts'),false);
});
test('009-B2b2a: flooded ford requires a physical Evolved roll with turn cost and no free teleport',()=>{
 let failed=null,won=null;
 for(let seed=flood;seed<12000&&(!failed||!won);seed++){
  const a=compileSelectedAdventure('ridge-survey',seed);
  if(a.hiddenFacts.researchObstacle.fact!=='flood')continue;
  const s1=play(fresh(seed),'move river-crossing').state;
  const r=play(s1,'move forest-blind');
  if(r.result.success===false)failed=r;else won=r;
 }
 assert.ok(failed);assert.ok(won);
 assert.equal(failed.state.actors[0].location,'river-crossing');
 assert.equal(failed.state.beat,2);
 assert.equal(failed.state.actions.at(-1).skill,'mobility');
 assert.equal(failed.state.objectiveRecords.length,0);
 assert.equal(won.state.actors[0].location,'forest-blind');
 assert.equal(isPartySave(failed.state),true);
 assert.equal(isPartySave(won.state),true);
});
test('009-B2b2a: dangerous ford always has a legal alternate ridge approach',()=>{
 let s=fresh(flood);
 s=play(s,'move rocky-ascent').state;
 s=play(s,'move survey-ridge').state;
 s=play(s,'move forest-blind').state;
 assert.equal(s.actors[0].location,'forest-blind');
 assert.equal(s.beat,3);
 assert.equal(isPartySave(s),true);
});
test('009-B2b2a: altered radio and record difficulty are resolved by the same Evolved source check',()=>{
 const samples=[];
 for(const [seed,objective,target,location] of [
  [equipment,'send-field-report','field transmitter','survey-ridge'],
  [human,'recover-transect','survey records','forest-blind']
 ]){
  const s=fresh(seed);
  // Source prerequisites are not bypassed: the report is still rejected early.
  if(objective==='send-field-report'){
   assert.equal(partyStep(s,'use field transmitter').accepted,false);
  }else{
   s.actors[0].location=location;
   const attempted=play(s,'use '+target);
   samples.push(attempted);
  }
 }
 assert.ok(samples.length>0);
 assert.equal(samples[0].state.actions.at(-1).skill,'observation');
 assert.equal(isPartySave(samples[0].state),true);
});
test('009-B2b2a: watching a wary animal remains genuinely peaceful and cannot force pursuit',()=>{
 let s=fresh(wary);
 s=play(s,'move rocky-ascent').state;
 s=play(s,'move survey-ridge').state;
 const before=structuredClone(s);
 assert.equal(partyView(s).wildlifeEncounter.choices.some(x=>x.id==='approach'),true);
 s=play(s,'wildlife watch').state;
 assert.equal(s.rng,before.rng);
 assert.equal(s.dinosaurs[0].location,'survey-ridge');
 assert.equal(s.actors[0].health,before.actors[0].health);
 assert.equal(isPartySave(s),true);
});
test('009-B2b2a: failed wary approach moves a dinosaur on a real exit, not directly onto a survivor',()=>{
 let failure=null,success=null;
 for(let seed=0;seed<1000&&(!failure||!success);seed++){
  const compiled=compileSelectedAdventure('ridge-survey',seed);
  if(compiled.hiddenFacts.wildlifeBehavior.fact!=='defensive')continue;
  let s=fresh(seed);
  s=play(s,'move rocky-ascent').state;
  s=play(s,'move survey-ridge').state;
  const outcome=play(s,'wildlife approach');
  if(outcome.result.success===false)failure=outcome;else success=outcome;
 }
 assert.ok(failure);assert.ok(success);
 assert.equal(failure.state.dinosaurs[0].location,'forest-blind');
 assert.equal(failure.state.actors[0].location,'survey-ridge');
 assert.equal(failure.state.actors[0].health,failure.state.actors[0].healthMax);
 assert.equal(failure.state.combat,null);
 assert.equal(failure.state.actions.at(-1).skill,'survival');
 assert.equal(success.state.dinosaurs[0].location,'survey-ridge');
 assert.equal(isPartySave(failure.state),true);
 const tampered=structuredClone(success.state);
 tampered.dinosaurs[0].location='forest-blind';
 assert.equal(isPartySave(tampered),false,'future encounter must have caused the animal to move');
});
test('009-B2b2a: a grazing animal allows calm approach without a secret roll',()=>{
 let s=fresh(calm);
 s=play(s,'move rocky-ascent').state;
 s=play(s,'move survey-ridge').state;
 const before=s.rng,health=s.actors[0].health;
 s=play(s,'wildlife approach').state;
 assert.equal(s.rng,before);
 assert.equal(s.dinosaurs[0].location,'survey-ridge');
 assert.equal(s.actors[0].health,health);
 assert.equal(isPartySave(s),true);
});
test('009-B2b2a: legacy save envelope, rescue scenario and gameplay controls remain intact',()=>{
 const old=fresh(wary);
 delete old.scenePressure;
 assert.equal(isPartySave(old),true);
 const rescue=newPartyIncident({seed:1993,roster});
 assert.equal(rescue.scenario,'nublar-incident-1993');
 assert.equal(partyView(rescue).adventureId,undefined);
 assert.equal(isPartySave(rescue),true);
});
