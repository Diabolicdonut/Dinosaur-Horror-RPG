import test from 'node:test';
import assert from 'node:assert/strict';
import {ADVENTURE_SCHEMA_VERSION,ADVENTURE_COMPILER_VERSION,
 adventureFingerprint,validateAdventureDefinition,compileAdventure,
 validateCompiledAdventure,adventureBinding,validAdventureBinding} from '../src/adventure-definition.mjs';
import {listAdventureDefinitions,getAdventureDefinition,compileSelectedAdventure} from '../src/adventure-catalog.mjs';
import {newPartyIncident,isPartySave,upgradePartySave,partyStep} from '../src/party-engine.mjs';
import {SCENARIO} from '../src/scenario.mjs';
const copy=x=>structuredClone(x);
const storm=()=>getAdventureDefinition('nublar-after-the-storm');
const ridge=()=>getAdventureDefinition('ridge-survey');
const fails=(obj)=>assert.throws(()=>validateAdventureDefinition(obj),RangeError);

test('two versioned independent packages are registered, not the same fixed evacuation plot',()=>{
 const list=listAdventureDefinitions();
 assert.deepEqual(list.map(x=>x.id),['nublar-after-the-storm','ridge-survey']);
 assert.equal(storm().schemaVersion,1);
 assert.equal(ridge().schemaVersion,1);
 assert.equal(storm().start,'control');
 assert.equal(ridge().start,'field-camp');
 assert.notDeepEqual(Object.keys(storm().rooms),Object.keys(ridge().rooms));
 assert.equal(ridge().objectives.some(o=>o.id==='walk-out'),true);
 assert.equal(ridge().objectives.some(o=>o.id==='light-beacon'),false);
});
test('accepted After the Storm map, items and objective route match existing scenario',()=>{
 const s=storm();
 assert.equal(s.title,SCENARIO.title);
 for(const [id,room]of Object.entries(SCENARIO.rooms)){
  assert.equal(s.rooms[id].name,room.name);
  assert.deepEqual(s.rooms[id].exits,room.exits);
  assert.deepEqual(s.rooms[id].items,room.items);
 }
 assert.deepEqual(s.startItems,SCENARIO.startItems);
 assert.equal(s.objectives.at(-1).room,'helipad');
});
test('both packages compile to separately immutable-by-value serialized adventure instances',()=>{
 for(const id of ['nublar-after-the-storm','ridge-survey']){
  const compiled=compileSelectedAdventure(id,1993);
  assert(validateCompiledAdventure(compiled));
  assert.equal(compiled.schemaVersion,ADVENTURE_SCHEMA_VERSION);
  assert.equal(compiled.compilerVersion,ADVENTURE_COMPILER_VERSION);
  assert.equal(compiled.adventureId,id);
  assert.equal(compiled.definition.id,id);
  assert.match(compiled.fingerprint,/^[0-9a-f]{8}$/);
  assert.deepEqual(JSON.parse(JSON.stringify(compiled)),compiled);
 }
});
test('independent generation seed deterministically locks genuine hidden world facts',()=>{
 const a=compileSelectedAdventure('ridge-survey',51);
 const b=compileSelectedAdventure('ridge-survey',51);
 assert.deepEqual(a,b);
 const possibilities=new Set();
 for(let seed=1;seed<=40;seed++){
  const c=compileSelectedAdventure('ridge-survey',seed);
  possibilities.add(c.hiddenFacts.researchObstacle.id+'|'+c.hiddenFacts.wildlifeBehavior.id);
  assert(validateCompiledAdventure(c));
 }
 assert(possibilities.size>=3,'multiple distinct causal/disposition combinations must exist');
});
test('generation does not change Evolved gameplay seed or retrofit a new rescue route',()=>{
 const a=compileSelectedAdventure('ridge-survey',1993);
 const b=compileSelectedAdventure('ridge-survey',11);
 assert.notDeepEqual(a.hiddenFacts,b.hiddenFacts);
 assert.deepEqual(a.definition.rooms,b.definition.rooms);
 assert(!Object.hasOwn(a.definition.flags,'beacon'));
 assert.equal(a.definition.objectives.at(-1).id,'walk-out');
});
test('catalog callers cannot mutate canonical adventure definitions',()=>{
 const a=storm();
 a.rooms.control.items.push('fictional-item');
 a.flags.power=true;
 const b=storm();
 assert(!b.rooms.control.items.includes('fictional-item'));
 assert.equal(b.flags.power,false);
});
test('fingerprints ignore JSON property insertion order but detect edited authored facts',()=>{
 const a=storm();
 const reordered=Object.fromEntries(Object.entries(a).reverse());
 assert.equal(adventureFingerprint(a),adventureFingerprint(reordered));
 const changed=copy(a);changed.rooms.lobby.description+=' Altered.';
 assert.notEqual(adventureFingerprint(a),adventureFingerprint(changed));
});
test('reject invalid physical exits and disconnected map',()=>{
 const s=ridge();
 s.rooms['field-camp'].exits.push('void');fails(s);
 const oneWay=ridge();oneWay.rooms['rocky-ascent'].exits=['survey-ridge'];fails(oneWay);
 const disconnected=ridge();
 disconnected.rooms['river-crossing'].exits=['forest-blind'];
 disconnected.rooms['field-camp'].exits=['rocky-ascent'];
 disconnected.rooms['forest-blind'].exits=['river-crossing'];
 disconnected.rooms['survey-ridge'].exits=['rocky-ascent'];
 fails(disconnected);
});
test('reject invalid inventory sources and serializable script-effect smuggling',()=>{
 const a=ridge();a.rooms['field-camp'].items.push('made-up');fails(a);
 const b=ridge();b.objectives[0].effects=[{type:'script',code:'setFlag=true'}];fails(b);
 const c=ridge();c.objectives[1].effects=[{type:'flag',name:'rescueBeacon',value:true}];fails(c);
 const d=ridge();d.customCode=()=>true;fails(d);
});
test('reject invalid objective dependencies, illegal ending and cycles',()=>{
 const a=ridge();a.objectives[1].requires=['nonexistent'];fails(a);
 const b=ridge();b.objectives[0].requires=['walk-out'];fails(b);
 const c=ridge();c.objectives.at(-1).effects=[{type:'end',outcome:'winning-unfairly'}];fails(c);
 const d=ridge();d.objectives.at(-1).effects=[{type:'flag',name:'teamWithdrawn',value:true}];fails(d);
});
test('reject unknown/duplicate creatures and impossible secret clue placement',()=>{
 const a=ridge();a.initialCreatures.push({...a.initialCreatures[0]});fails(a);
 const b=ridge();b.initialCreatures[0].location='teleported';fails(b);
 const c=ridge();c.variants.researchObstacle[0].clueRoom='outside-the-map';fails(c);
});
test('compiler rejects invalid seeds and edited compiler outputs',()=>{
 assert.throws(()=>compileAdventure(ridge(),{seed:-1}),RangeError);
 assert.throws(()=>compileAdventure(ridge(),{seed:4294967296}),RangeError);
 const c=compileSelectedAdventure('ridge-survey',43);
 c.hiddenFacts.researchObstacle.description='A different secret that was not generated.';
 assert.equal(validateCompiledAdventure(c),false);
});
test('Party incident new saves carry current adventure identity and content fingerprint',()=>{
 const game=newPartyIncident({seed:9000});
 assert.equal(game.scenario,SCENARIO.id);
 assert.deepEqual(game.adventureBinding,
   adventureBinding(compileSelectedAdventure('nublar-after-the-storm',0)));
 assert(isPartySave(game));
 assert.equal(game.actors[0].location,'control');
 assert.equal(game.dinosaurs[0].location,'paddock');
});
test('legacy Party v3 saves lacking an adventure binding still load and can act',()=>{
 const old=newPartyIncident({seed:9000});
 delete old.adventureBinding;
 assert(isPartySave(old));
 const restored=upgradePartySave(old);
 assert(isPartySave(restored));
 const actor=restored.actors[restored.cursor].id;
 const step=partyStep(restored,'wait',{actorId:actor});
 assert(step.accepted);
 assert(isPartySave(step.state));
});
test('Party save detects forged or incompatible binding without changing Evolved rolls',()=>{
 const before=newPartyIncident({seed:9000});
 const a=copy(before);a.adventureBinding.id='ridge-survey';assert(!isPartySave(a));
 const b=copy(before);b.adventureBinding.fingerprint='bad0feed';assert(!isPartySave(b));
 const c=copy(before);c.adventureBinding.revision=999;assert(!isPartySave(c));
 const unbound=copy(before);delete unbound.adventureBinding;
 const player=x=>partyStep(x,'wait',{actorId:x.actors[0].id}).state;
 const withBinding=player(before),withoutBinding=player(unbound);
 assert.equal(withBinding.rng,withoutBinding.rng);
 assert.deepEqual(withBinding.actors,withoutBinding.actors);
 assert.deepEqual(withBinding.dinosaurs,withoutBinding.dinosaurs);
});
test('this is only the definition/identity boundary; second package is not falsely claimed playable',()=>{
 assert.equal(typeof compileSelectedAdventure('ridge-survey',2).definition,'object');
 assert.equal(newPartyIncident({seed:7}).scenario,SCENARIO.id);
 assert.throws(()=>getAdventureDefinition('bad-package'),RangeError);
});
