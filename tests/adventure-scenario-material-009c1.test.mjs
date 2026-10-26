import test from 'node:test';
import assert from 'node:assert/strict';
import {makeParty} from '../src/characters.mjs';
import {compileSelectedAdventure} from '../src/adventure-catalog.mjs';
import {compileAdventure,adventureBinding,adventureFingerprint} from '../src/adventure-definition.mjs';
import {RIDGE_SURVEY_REV8} from '../adventures/ridge-survey-rev8.mjs';
import {playerScenarioMaterial} from '../src/adventure-scenario-material.mjs';
import {newPartyIncident,partyView,partyStep,isPartySave} from '../src/party-engine.mjs';
import {setControlMode,setCamera} from '../src/party-director.mjs';

const party=makeParty({seed:91,size:2,careers:['scientist','ranger']});
const create=seed=>newPartyIncident({adventureId:'ridge-survey',seed,roster:party});
const quietSeed=Array.from({length:200},(_,i)=>i).find(i=>
 compileSelectedAdventure('ridge-survey',i).hiddenFacts.predatorPresence.id==='quiet-range');
const predatorSeed=Array.from({length:200},(_,i)=>i).find(i=>
 compileSelectedAdventure('ridge-survey',i).hiddenFacts.predatorPresence.id==='raptor-territory');
const advance=(s,command)=>{const r=partyStep(s,command);assert.equal(r.accepted,true,r.reason);return r.state;};

test('009-C1: third-party style narrative dossier is data-only and revision-bound',()=>{
 const compiled=compileSelectedAdventure('ridge-survey',quietSeed);
 assert.equal(compiled.revision,10);
 assert.equal(isPartySave(create(quietSeed)),true);
 assert.ok(compiled.definition.scenarioMaterial.briefing.text);
 assert.ok(compiled.definition.scenarioMaterial.gmOnly.secrets.length);
 assert.notEqual(compiled.fingerprint,adventureFingerprint(RIDGE_SURVEY_REV8));
 const legacy=compileAdventure(RIDGE_SURVEY_REV8,{seed:quietSeed});
 const old=create(quietSeed);old.adventureBinding=adventureBinding(legacy);
 assert.equal(isPartySave(old),true);
 assert.equal(partyView(old).scenarioMaterial,null);
});
test('009-C1: invalid source references and arbitrary execution are rejected at compile time',()=>{
 const base=compileSelectedAdventure('ridge-survey',1).definition;
 const modify=[
  m=>m.scenarioMaterial.untypedEffect={handler:'eval'},
  m=>m.scenarioMaterial.storyCards[0].trigger.id='fictional-scene',
  m=>m.scenarioMaterial.handouts[0].trigger={kind:'start',id:'forged'},
  m=>m.scenarioMaterial.agendas[0].seat=99,
  m=>m.scenarioMaterial.storyCards[1].id=m.scenarioMaterial.handouts[0].id,
  m=>m.scenarioMaterial.handouts[0].variant={slot:'unknown',choice:'invented'},
  m=>m.scenarioMaterial.gmOnly.secrets.push(()=>true)
 ];
 for(const mutation of modify){
  const changed=structuredClone(base);mutation(changed);
  assert.throws(()=>compileAdventure(changed,{seed:99}),RangeError);
 }
});
test('009-C1: public briefing is safe and no GM-only secrets leak into player view',()=>{
 const state=create(quietSeed),v=partyView(state);
 assert.match(v.scenarioMaterial.briefing.text,/ecological survey|transect/i);
 assert.equal(v.scenarioMaterial.handouts.length,1);
 assert.equal(v.scenarioMaterial.handouts[0].id,'field-orders');
 assert.equal(JSON.stringify(v).includes('gmOnly'),false);
 assert.equal(JSON.stringify(v).includes('retroactive explanation'),false);
 assert.equal(v.scenarioMaterial.privateStoryCards.length,0);
 assert.equal(v.scenarioMaterial.privateAgendas[0].id,'observe-first');
});
test('009-C1: camera selection never licenses personal agendas in Focus or Spectator',()=>{
 let s=create(quietSeed);const first=s.actors[0].id,second=s.actors[1].id;
 assert.equal(partyView(s,{actorId:second}).scenarioMaterial.privateAgendas[0].id,'team-safety');
 s=setControlMode(s,{mode:'focus',focusedActorId:first}).state;
 assert.equal(partyView(s,{actorId:first}).scenarioMaterial.privateAgendas.length,1);
 assert.deepEqual(partyView(s,{actorId:second}).scenarioMaterial.privateAgendas,[]);
 s=setCamera(s,{mode:'actor',actorId:second}).state;
 assert.deepEqual(partyView(s,{actorId:second}).scenarioMaterial.privateAgendas,[]);
 s=setControlMode(s,{mode:'spectator'}).state;
 assert.deepEqual(partyView(s,{actorId:first}).scenarioMaterial.privateAgendas,[]);
 assert.deepEqual(partyView(s,{actorId:second}).scenarioMaterial.privateStoryCards,[]);
 assert.equal(isPartySave(s),true);
});
test('009-C1: handouts and story cards unlock only through actual committed scene or objective',()=>{
 let s=create(quietSeed);
 assert.equal(partyView(s).scenarioMaterial.handouts.length,1);
 s=advance(s,'move rocky-ascent'); // seat 0
 s=advance(s,'move rocky-ascent'); // seat 1
 s=advance(s,'move survey-ridge'); // seat 0
 s=advance(s,'move survey-ridge'); // seat 1
 const before=structuredClone(s);
 assert.equal(partyView(s).scenarioMaterial.privateStoryCards.length,0);
 s=advance(s,'scene living-valley');
 assert.equal(s.beat,before.beat,'optional scene is not a hidden exploration move');
 assert.deepEqual(s.actors.map(a=>a.storyPoints),before.actors.map(a=>a.storyPoints));
 assert.equal(partyView(s,{actorId:s.actors[0].id}).scenarioMaterial.privateStoryCards[0].id,'the-living-valley');
 assert.deepEqual(partyView(s,{actorId:s.actors[1].id}).scenarioMaterial.privateStoryCards,[]);
 assert.equal(isPartySave(s),true);
});
test('009-C1: conditional documents reveal only after a real scene and the seeded truth',()=>{
 for(const seed of [quietSeed,predatorSeed]){
  const compiled=compileSelectedAdventure('ridge-survey',seed);
  let s=create(seed);
  const before=partyView(s).scenarioMaterial.handouts.map(x=>x.id);
  assert.deepEqual(before,['field-orders']);
  const fake=structuredClone(s);
  fake.cinematicRecords.push({id:'notes-among-leaves',beat:0,room:'forest-blind',act:1,actorId:fake.actors[0].id});
  // The pure projection reads a committed dossier record; world/save validator remains the trust boundary.
  const projected=playerScenarioMaterial(compiled,fake,fake.actors[0].id,{number:1});
  const expected=compiled.hiddenFacts.predatorPresence.id==='quiet-range'?'weathered-track-note':'fresh-track-note';
  assert.ok(projected.handouts.some(h=>h.id===expected));
  assert.equal(projected.handouts.some(h=>h.id===(expected==='fresh-track-note'?'weathered-track-note':'fresh-track-note')),false);
  assert.equal(isPartySave(fake),false,'fabricated remote cinematic history is not accepted as a save');
  assert.equal(isPartySave(s),true);
 }
});
test('009-C1: scenario dossier does not alter legacy Nublar or raw Evolved combat rolls',()=>{
 const n=newPartyIncident({seed:1993,roster:party});
 assert.equal(partyView(n).scenarioMaterial,undefined);
 const current=create(quietSeed),original=structuredClone(current);
 const projected=partyView(current);
 assert.ok(projected.scenarioMaterial);
 assert.deepEqual(current,original);
 const bad=structuredClone(current);bad.adventureBinding.fingerprint='00000000';
 assert.equal(isPartySave(bad),false);
});

test('009-C1: the generic engine accepts one-act and four-act authoring without a forced three-act scenario arc',()=>{
 const base=compileSelectedAdventure('ridge-survey',quietSeed).definition;
 const one=structuredClone(base);
 one.cinematic.acts=one.cinematic.acts.slice(0,1);
 one.cinematic.events=one.cinematic.events.filter(e=>e.act===1);
 one.scenarioMaterial.agendas=one.scenarioMaterial.agendas.filter(a=>a.act===1);
 assert.equal(compileAdventure(one,{seed:quietSeed}).definition.cinematic.acts.length,1);
 const four=structuredClone(base);
 four.cinematic.acts.push({number:4,title:'After the Report',
  objective:'Reconcile the field notes after returning to safety.',
  unlocksAfter:['recover-transect','send-field-report']});
 four.cinematic.events.push({id:'camp-reckoning',act:4,room:'field-camp',
  title:'Comparing Memories',text:'The team compares records without imposing a single conclusion.',
  theme:'human'});
 four.scenarioMaterial.agendas.push({id:'reflect',seat:0,act:4,
  text:'Decide which uncertainties deserve a second expedition.'});
 assert.equal(compileAdventure(four,{seed:quietSeed}).definition.cinematic.acts.length,4);
});
test('009-C1: malicious or incoherent act counts and cross-references remain prohibited',()=>{
 const base=compileSelectedAdventure('ridge-survey',quietSeed).definition;
 for(const change of [
  m=>m.cinematic.acts=[],
  m=>m.cinematic.acts=Array.from({length:6},(_,i)=>({...m.cinematic.acts[0],number:i+1})),
  m=>m.cinematic.events[0].act=9,
  m=>m.scenarioMaterial.agendas[0].act=7
 ]){
  const bad=structuredClone(base);change(bad);
  assert.throws(()=>compileAdventure(bad,{seed:quietSeed}),RangeError);
 }
});
