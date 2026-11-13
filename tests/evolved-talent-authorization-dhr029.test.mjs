import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {makeParty} from '../src/characters.mjs';
import {compileSelectedAdventure} from '../src/adventure-catalog.mjs';
import {newPartyIncident,isPartySave,partyStep} from '../src/party-engine.mjs';
import {beginCombat,activeCombatSlot} from '../src/combat-turns.mjs';
import {setControlMode} from '../src/party-director.mjs';
import {resolveSkillCheck} from '../src/evolved-checks.mjs';
import {authorizeTalentActivation,replayTalentActivations,AUTHORIZED_TALENT_TRIGGERS}
 from '../src/evolved-talent-authorization.mjs';

const copy=x=>structuredClone(x);
const src=(state)=>compileSelectedAdventure(state.scenario,state.scenario==='nublar-after-the-storm'?0:state.initialSeed);
const source=c=>({adventureId:c.adventureId,revision:c.revision,
 fingerprint:c.fingerprint,seed:c.seed});
const principal=(id='seat-1',kind='human')=>({kind,id});
function fixture(career='medic',{adventureId='nublar-after-the-storm'}={}){
 const roster=makeParty({seed:102,size:2,careers:[career,'ranger']});
 if(career==='medic')roster[0].gear=['medical bag','bandages'];
 const state=newPartyIncident({seed:102,roster,adventureId});
 assert(isPartySave(state));
 return {state,compiled:src(state)};
}
function injured(f,{surgery=false}={}){
 const state=copy(f.state);
 if(surgery)state.actors[1].criticalInjuries=[{code:33,healed:false,surgeryDone:false}];
 else {state.actors[1].broken=true;state.actors[1].health=0;}
 assert(isPartySave(state),'The simulated injury must preserve a valid historical Party save.');
 return {...f,state};
}
function check(f,context,targetId=f.state.actors[1].id,ownerId='seat-1'){
 const talent=f.state.actors[0].talent;
 const rule=AUTHORIZED_TALENT_TRIGGERS[talent];
 assert(rule,'Test fixture must own a supported talent.');
 return {id:'roll-1',actorId:f.state.actors[0].id,ownerId,
  beat:f.state.beat,actionIndex:f.state.actions.length,
  controlEpoch:f.state.control.epoch,skill:rule.skill,context,
  targetId,cost:rule.cost,seed:f.state.rng,status:'open'};
}
function register(f,c){return {schemaVersion:1,source:source(f.compiled),entries:[c]};}
function request(f,c,overrides={}){return {actorId:c.actorId,talent:f.state.actors[0].talent,
 checkId:c.id,ownerId:c.ownerId,expectedBeat:f.state.beat,
 expectedActionCount:f.state.actions.length,
 expectedControlEpoch:f.state.control.epoch,...overrides};}
function run(f,c,overrides={},journal=null,identity=principal()){
 return authorizeTalentActivation(f.compiled,f.state,register(f,c),identity,
  request(f,c,overrides),journal);
}
test('DHR-029: source/test modules parse and only four mechanically verified triggers are exposed',()=>{
 assert.deepEqual(Object.keys(AUTHORIZED_TALENT_TRIGGERS).sort(),
  ['Emergency Treatment','Hard to Catch','Keep It Together','Trauma Specialist'].sort());
 for(const file of ['src/evolved-talent-authorization.mjs',
  'tests/evolved-talent-authorization-dhr029.test.mjs']){
  const r=spawnSync(process.execPath,['--check',new URL('../'+file,import.meta.url).pathname],
   {encoding:'utf8'});
  assert.equal(r.status,0,file+': '+r.stderr);
 }
});
test('first aid on an actually broken local survivor grants exactly two base dice, no extra stress dice or random draws',()=>{
 const f=injured(fixture('medic'));
 // The generated medic's first talent is not guaranteed: use a legal talent from their own career.
 f.state.actors[0].talent='Emergency Treatment';
 f.state.startingRoster[0].talent='Emergency Treatment';
 assert(isPartySave(f.state));
 const c=check(f,'first_aid'),world=copy(f.state),compiled=copy(f.compiled);
 const a=run(f,c),b=run(f,c);
 assert.equal(a.accepted,true,a.reason);
 assert.deepEqual(a,b);
 const baseline=resolveSkillCheck(f.state.actors[0],{skill:c.skill,seed:c.seed});
 assert.equal(a.preview.baseCount,baseline.baseCount+2);
 assert.equal(a.preview.initial.stress.length,baseline.initial.stress.length);
 assert.equal(a.preview.draws-baseline.draws,2,'Only the two additional base dice are drawn.');
 assert.equal(replayTalentActivations(f.compiled,f.state,register(f,c),a.journal).valid,true);
 assert.deepEqual(f.state,world);assert.deepEqual(f.compiled,compiled);
});
test('actual starting talent, not an ad-hoc forged modifier or swapped character, is mandatory',()=>{
 const f=injured(fixture('medic'));
 f.state.actors[0].talent=f.state.startingRoster[0].talent='Emergency Treatment';
 const c=check(f,'first_aid');
 for(const bad of [
  {talent:'Trauma Specialist'}, {talent:'Made Up'}, {skill:'command'},
  {modifier:30},{bonus:999},{success:true},{ownerId:'another'},
  {expectedBeat:f.state.beat+1},{expectedActionCount:99},
  {expectedControlEpoch:99},{actorId:'pc-999'}
 ])assert.equal(run(f,c,bad).accepted,false,JSON.stringify(bad));
 const swapped=copy(f);swapped.state.actors[0].talent='Trauma Specialist';
 assert.equal(run(swapped,c).accepted,false,'Runtime talent tampering cannot forge ownership.');
 const forged=copy(f);forged.state.startingRoster[0].talent='Trauma Specialist';
 assert.equal(run(forged,c).accepted,false,'Changing only the character starting record is not enough.');
});
test('wrong trigger, target position, condition, equipment and actor ability all fail closed',()=>{
 const f=injured(fixture('medic'));
 f.state.actors[0].talent=f.state.startingRoster[0].talent='Emergency Treatment';
 const c=check(f,'first_aid');
 for(const mutation of [
  s=>{s.actors[1].broken=false;s.actors[1].health=2;},
  s=>{s.actors[1].location='shed';},
  s=>{s.actors[0].health=0;s.actors[0].broken=true;},
  s=>{s.actors[0].pendingSkip=true;},
  s=>{s.actors[0].dead=true;},
  s=>{s.cursor=1;}
 ]){
  const altered=copy(f);mutation(altered.state);
  assert.equal(run(altered,c).accepted,false);
 }
 for(const change of [{context:'rally'},{skill:'command'},
  {cost:'quick'},{status:'committed'},{seed:c.seed^2},
  {targetId:'pc-99'},{beat:c.beat+1},{unexpected:true}]){
  const altered={...c,...change};
  assert.equal(run(f,altered).accepted,false,JSON.stringify(change));
 }
});
test('surgery requires a real unresolved surgery injury, a nearby patient and actual carried kit',()=>{
 const f=injured(fixture('medic'),{surgery:true});
 f.state.actors[0].talent=f.state.startingRoster[0].talent='Trauma Specialist';
 const c=check(f,'surgery');
 const r=run(f,c);assert.equal(r.accepted,true,r.reason);
 assert.equal(r.preview.baseCount-resolveSkillCheck(f.state.actors[0],
  {skill:'medical_aid',seed:c.seed}).baseCount,2);
 for(const alter of [
  s=>{s.actors[1].criticalInjuries[0].surgeryDone=true;},
  s=>{s.actors[1].criticalInjuries[0].code=12;},
  s=>{s.actors[0].gear=['bandages','sterile gloves'];},
  s=>{s.actors[1].location='shed';}
 ]){
  const changed=copy(f);alter(changed.state);
  assert.equal(run(changed,c).accepted,false);
 }
});
test('a physically local broken ally is required for a source-grounded Command rally',()=>{
 const f=injured(fixture('supervisor'));
 f.state.actors[0].talent=f.state.startingRoster[0].talent='Keep It Together';
 const c=check(f,'rally');const r=run(f,c);
 assert.equal(r.accepted,true,r.reason);
 assert.equal(r.preview.skill,'command');
 assert.equal(r.preview.baseCount-resolveSkillCheck(f.state.actors[0],
  {skill:'command',seed:c.seed}).baseCount,2);
 assert.equal(run(f,{...c,targetId:c.actorId}).accepted,false);
});
test('replay rejects duplicate event, altered rolls and journal minting; a later beat cannot retroactivate',()=>{
 const f=injured(fixture('supervisor'));
 f.state.actors[0].talent=f.state.startingRoster[0].talent='Keep It Together';
 const c=check(f,'rally'),r=run(f,c);
 assert.equal(r.accepted,true,r.reason);
 assert.equal(run(f,c,{},r.journal).accepted,false);
 const double=copy(r.journal);double.entries.push(copy(double.entries[0]));
 assert.equal(replayTalentActivations(f.compiled,f.state,register(f,c),double).valid,false);
 const forged=copy(r.journal);forged.entries[0].bonus=999;
 assert.equal(replayTalentActivations(f.compiled,f.state,register(f,c),forged).valid,false);
 const rolls=copy(r.journal);rolls.entries[0].roll.initial.base[0]=6;
 assert.equal(replayTalentActivations(f.compiled,f.state,register(f,c),rolls).valid,false);
 const future=copy(f);future.state.beat++;future.state.actions.push({kind:'wait'});
 assert.equal(run(future,c).accepted,false);
 assert.equal(replayTalentActivations(future.compiled,future.state,register(future,c),r.journal).valid,false);
 const another=copy(f);another.compiled.seed++;
 assert.equal(run(another,c).accepted,false);
});
test('Party, Focus and Spectator respect human versus GM owner, independent of camera',()=>{
 const f=injured(fixture('supervisor'));
 f.state.actors[0].talent=f.state.startingRoster[0].talent='Keep It Together';
 let c=check(f,'rally');assert.equal(run(f,c).accepted,true);
 for(const mode of ['focus','spectator']){
  const next=copy(f);next.state=setControlMode(next.state,
   {mode,focusedActorId:'pc-2'}).state;
  c=check(next,'rally');
  assert.equal(run(next,c).accepted,false,'Human cannot direct a non-focused or AI seat.');
  assert.equal(run(next,c,{},null,principal('seat-1','gm')).accepted,true);
 }
 const focused=copy(f);focused.state=setControlMode(focused.state,
  {mode:'focus',focusedActorId:'pc-1'}).state;
 c=check(focused,'rally');assert.equal(run(focused,c).accepted,true);
 focused.state.control.cameraActorId='pc-2';
 assert.equal(run(focused,c).accepted,true,'Camera cannot reassign control.');
 const bogus=copy(f);c=check(bogus,'rally');
 assert.equal(run(bogus,c,{},null,{kind:'observer',id:'seat-1'}).accepted,false);
});
test('real announced incoming attack permits a visitor dodge, but not an invented reaction',()=>{
 const roster=makeParty({seed:2050,size:3,careers:['visitor','ranger','tactical']});
 roster[0].talent='Hard to Catch';
 let f=null;
 for(let seed=1;seed<250;seed++){
  const state=newPartyIncident({seed:911,roster});
  state.dinosaurs[0].location='control';
  if(!beginCombat(state,seed)||activeCombatSlot(state).kind!=='dinosaur')continue;
  const announced=partyStep(state,{kind:'predator'},
   {actorId:state.dinosaurs[0].id,source:'ai',reactionPrompt:true});
  if(announced.accepted&&announced.state.combat?.pendingReaction?.victimId==='pc-1'){
   f={state:announced.state,compiled:src(announced.state)};break;
  }
 }
 assert(f,'Need an actual source-replayed visitor-targeted defensive reaction.');
 const c=check(f,'dodge','pc-1');
 const out=run(f,c);assert.equal(out.accepted,true,out.reason);
 assert.equal(out.preview.baseCount-resolveSkillCheck(f.state.actors[0],
  {skill:'mobility',seed:c.seed}).baseCount,2);
 const no=copy(f);delete no.state.combat.pendingReaction;
 assert.equal(run(no,c).accepted,false);
 const spent=copy(f);Object.assign(spent.state.combat.budgets['pc-1'],
  {quick:0,quickSpent:2,full:0,fullSpent:0});
 assert.equal(run(spent,c).accepted,false);
});
test('new and serialized historical saves remain byte-independent of the optional sidecar',()=>{
 for(const adventureId of ['nublar-after-the-storm','ridge-survey','tidal-nursery']){
  const f=fixture('medic',{adventureId});
  const serialized=JSON.stringify(f.state),loaded=JSON.parse(serialized);
  assert.equal(isPartySave(loaded),true);
  assert.equal(Object.hasOwn(loaded,'talentActivations'),false);
  assert.equal(replayTalentActivations(f.compiled,loaded,
   {schemaVersion:1,source:source(f.compiled),entries:[]}).valid,true);
  assert.equal(JSON.stringify(f.state),serialized);
 }
});
