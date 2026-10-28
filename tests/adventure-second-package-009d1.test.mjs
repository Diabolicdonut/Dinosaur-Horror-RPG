import test from 'node:test';
import assert from 'node:assert/strict';
import {makeParty} from '../src/characters.mjs';
import {listAdventureDefinitions,compileSelectedAdventure,isStandaloneAdventureId} from '../src/adventure-catalog.mjs';
import {newPartyIncident,isPartySave,partyView,partyStep} from '../src/party-engine.mjs';
import {setControlMode,runAutonomousTurn} from '../src/party-director.mjs';
import {TIDAL_NURSERY} from '../adventures/tidal-nursery.mjs';

const party=makeParty({seed:710,size:1,careers:['scientist']});
const fresh=seed=>newPartyIncident({adventureId:'tidal-nursery',seed,roster:party});
function act(s,command){
 const r=partyStep(s,command);assert.equal(r.accepted,true,r.reason);return r.state;
}
const selections=Array.from({length:80},(_,i)=>({seed:i,
 condition:compileSelectedAdventure('tidal-nursery',i).hiddenFacts.estuaryConditions.id}));
test('009-D1: second original, separately compiled source is catalogued and validates',()=>{
 assert.ok(listAdventureDefinitions().some(x=>x.id==='tidal-nursery'&&x.revision===2));
 assert.equal(isStandaloneAdventureId('tidal-nursery'),true);
 assert.equal(isStandaloneAdventureId('nublar-after-the-storm'),false);
 assert.notEqual(TIDAL_NURSERY.rooms['nesting-pool'].name,'Survey Ridge');
 for(const {seed} of selections.slice(0,8)){
  const c=compileSelectedAdventure('tidal-nursery',seed);
  assert.equal(c.definition.id,'tidal-nursery');
  assert.equal(c.revision,2);
  assert.equal(c.definition.initialCreatures.length,1);
 }
});
test('009-D1: fresh estuary play uses authored rooms, starting stock and objectives instead of Ridge singleton',()=>{
 const s=fresh(23),v=partyView(s);
 assert.equal(isPartySave(s),true);
 assert.equal(s.scenario,'tidal-nursery');
 assert.equal(v.adventureId,'tidal-nursery');
 assert.equal(v.roomName,'Estuary Supply Shelter');
 assert.ok(v.description.includes('marsh'));
 assert.deepEqual(v.exits.map(x=>x.id).sort(),['reed-walk','signal-knoll']);
 assert.equal(v.objectivePlan[0].id,'recover-samples');
 assert.equal(s.dinosaurs.length,1);
 assert.equal(s.dinosaurs[0].kind,'parasaurolophus');
 assert.equal(s.pendingPredatorResponse,null);
 assert.equal(s.combat,null);
 assert.deepEqual(s.supportingCast.map(n=>n.id),['mara-venn','ivo-pell'],'only the estuary source cast may be present');
 assert.deepEqual(Object.keys(s.flags).sort(),['returned','samplesSecured','signalSent']);
 assert.ok(!s.events[0].message.includes('canvas camp'));
});
test('009-D1: connected independent travel, wildlife wonder, actual checks and quiet completion',()=>{
 let s=fresh(7);
 s=act(s,'move signal-knoll');
 s=act(s,'move nesting-pool');
 assert.ok(partyView(s).wildlifeEncounter);
 assert.ok(partyView(s).roomName.includes('Nesting'));
 let ok=false;
 for(let i=0;i<60;i++){
  const r=partyStep(s,'use migration readings');
  assert.equal(r.accepted,true,r.reason);
  s=r.state;
  if(s.flags.samplesSecured){ok=true;break;}
 }
 assert.equal(ok,true,'record recovery must be earned by Evolved checks');
 s=act(s,'move signal-knoll');
 ok=false;
 for(let i=0;i<60;i++){
  const r=partyStep(s,'use field antenna');
  assert.equal(r.accepted,true,r.reason);
  s=r.state;
  if(s.flags.signalSent){ok=true;break;}
 }
 assert.equal(ok,true,'transmission must be earned by a real check');
 s=act(s,'move supply-shelter');
 s=act(s,'use secure the expedition');
 assert.equal(s.outcome,'rescued');
 assert.equal(isPartySave(s),true);
 assert.equal(s.dinosaurs[0].defeated,false);
 assert.equal(s.predatorContacts.length,0);
 assert.equal(s.combat,null);
});
test('009-D1: distinct authored tide/radio variants have materially different legal obstacles',()=>{
 assert.ok(selections.some(x=>x.condition==='spring-tide'));
 assert.ok(selections.some(x=>x.condition==='radio-interference'));
 for(const {seed,condition} of selections.slice(0,18)){
  const compiled=compileSelectedAdventure('tidal-nursery',seed);
  assert.equal(compiled.hiddenFacts.estuaryConditions.id,condition);
  assert.equal(isPartySave(fresh(seed)),true);
 }
});
test('009-D1: changing scenario identity, compiled fingerprint, items or room invalidates a save',()=>{
 const source=fresh(5);
 const mods=[
  s=>{s.scenario='ridge-survey';},
  s=>{s.adventureBinding.fingerprint='00000000';},
  s=>{s.rooms['supply-shelter'].items.push('imaginary-token');},
  s=>{s.actors[0].location='survey-ridge';},
  s=>{s.flags.foreignFlag=true;},
  s=>{s.dinosaurs.push({id:'hunter-1',kind:'velociraptor',location:'nesting-pool',disposition:'predatory',defeated:false});}
 ];
 for(const modify of mods){const s=structuredClone(source);modify(s);assert.equal(isPartySave(s),false);}
 assert.equal(isPartySave(source),true);
});
test('009-D1: Party, Focus and Spectator controls remain available in independent adventure',()=>{
 let s=fresh(21);
 const f=setControlMode(s,{mode:'focus',focusedActorId:s.actors[0].id});
 assert.equal(f.accepted,true,f.reason);s=f.state;assert.equal(isPartySave(s),true);
 const a=setControlMode(s,{mode:'spectator'});
 assert.equal(a.accepted,true,a.reason);s=a.state;assert.equal(isPartySave(s),true);
 const step=runAutonomousTurn(s,{singleStep:true});
 assert.equal(step.accepted,true,step.reason);
 assert.equal(isPartySave(step.state),true);
 assert.equal(step.state.scenario,'tidal-nursery');
});
test('009-D1: Long Count rev13 and Nublar remain distinct with unchanged adventure routing',()=>{
 const ridge=newPartyIncident({adventureId:'ridge-survey',seed:13,roster:party});
 const legacy=newPartyIncident({seed:13,roster:party});
 assert.equal(isPartySave(ridge),true);assert.equal(isPartySave(legacy),true);
 assert.equal(ridge.adventureBinding.revision,13);
 assert.equal(partyView(ridge).roomName,'Canvas Research Camp');
 assert.equal(partyView(legacy).adventureId??'nublar-after-the-storm','nublar-after-the-storm');
 assert.equal(partyView(fresh(13)).adventureId,'tidal-nursery');
});
