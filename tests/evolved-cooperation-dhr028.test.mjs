import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {compileSelectedAdventure} from '../src/adventure-catalog.mjs';
import {makeParty} from '../src/characters.mjs';
import {newPartyIncident,isPartySave,partyStep} from '../src/party-engine.mjs';
import {setControlMode} from '../src/party-director.mjs';
import {resolveSkillCheck} from '../src/evolved-checks.mjs';
import {resolveCooperativeCheck,replayCooperativeCheck}
 from '../src/evolved-cooperation.mjs';

const cloned=x=>structuredClone(x);
const source=seed=>compileSelectedAdventure('tidal-nursery',seed);
const step=(s,command)=>{
 const r=partyStep(s,command);
 assert.equal(r.accepted,true,command+': '+r.reason);
 assert.equal(isPartySave(r.state),true);
 return r.state;
};
function fixture({seed=48,size=2}={}){
 const roster=makeParty({seed,size,careers:['scientist','maintenance','medic']});
 let state=newPartyIncident({seed,roster,adventureId:'tidal-nursery'});
 // Every survivor physically traverses both edges, on their own real turn.
 for(const exit of ['reed-walk','nesting-pool']){
  for(let i=0;i<size;i++)state=step(state,'move '+exit);
 }
 assert(state.actors.every(a=>a.location==='nesting-pool'));
 return {compiled:source(seed),state};
}
const request=(state,overrides={})=>({
 actorId:state.actors[state.cursor].id,objectiveId:'recover-samples',
 helpers:[{actorId:state.actors[(state.cursor+1)%state.actors.length].id,
  method:'cross_check',toolId:null}],
 expectedBeat:state.beat,expectedRng:state.rng,
 expectedActionCount:state.actions.length,push:0,...overrides
});
const resolve=(f,r=request(f.state),journal=null)=>
 resolveCooperativeCheck(f.compiled,f.state,r,journal);
function comtechFixture(){
 const f=fixture();
 let s=f.state;
 for(let attempt=0;attempt<60&&!s.flags.samplesSecured;attempt++)
  s=step(s,'use migration readings');
 assert.equal(s.flags.samplesSecured,true);
 for(let i=0;i<s.actors.length;i++)s=step(s,'move signal-knoll');
 assert(s.actors.every(a=>a.location==='signal-knoll'));
 // Source initial radio belongs to the first actor. An inventory transfer
 // preserves the actual stock and validates as a full Party save.
 const v=cloned(s);
 const id=v.actors.findIndex(a=>a.inventory.includes('field-radio'));
 v.actors[id].inventory.splice(v.actors[id].inventory.indexOf('field-radio'),1);
 const recipient=(v.cursor+1)%v.actors.length;
 v.actors[recipient].inventory.push('field-radio');
 assert.equal(isPartySave(v),true);
 return {...f,state:v};
}

test('DHR-028: syntax validation for isolated cooperation source and test modules',()=>{
 for(const file of ['src/evolved-cooperation.mjs','tests/evolved-cooperation-dhr028.test.mjs']){
  const r=spawnSync(process.execPath,['--check',new URL('../'+file,import.meta.url).pathname],
   {encoding:'utf8'});
  assert.equal(r.status,0,file+': '+r.stderr);
 }
});

test('DHR-028: real same-room helper adds exactly one BASE die to the published dice engine',()=>{
 const f=fixture(),original=cloned(f.state),compiled=cloned(f.compiled);
 const r=resolve(f);
 assert.equal(r.accepted,true,r.reason);
 assert.equal(r.authorization.skill,'observation');
 assert.equal(r.authorization.help,1);
 assert.equal(r.check.help,1);
 assert.equal(r.authorization.modifier,r.authorization.difficulty+r.authorization.injury);
 const actor=f.state.actors[f.state.cursor];
 const solo=resolveSkillCheck(actor,{skill:'observation',seed:r.authorization.seed,
  modifier:r.authorization.modifier});
 assert.equal(r.check.baseCount,solo.baseCount+1);
 assert.equal(r.check.initial.stress.length,solo.initial.stress.length);
 assert.deepEqual(r.check,resolveSkillCheck(actor,{skill:r.authorization.skill,
  modifier:r.authorization.modifier,help:1,seed:r.authorization.seed,push:0}));
 assert.equal(r.authorization.nextRng,r.authorization.seed);
 assert.equal(replayCooperativeCheck(f.compiled,f.state,r.journal).valid,true);
 assert.deepEqual(f.state,original,'No Party state or random cursor changes');
 assert.deepEqual(f.compiled,compiled,'The authored source is not mutated');
});

test('DHR-028: two or three distinct eligible helpers increase BASE dice but never stress dice',()=>{
 for(const size of [3,4]){
  const f=fixture({size}),s=f.state,lead=s.actors[s.cursor];
  const helpers=s.actors.filter(a=>a.id!==lead.id).map(a=>({
   actorId:a.id,method:'cross_check',toolId:null
  }));
  const result=resolve(f,request(s,{helpers}));
  assert.equal(result.accepted,true,result.reason);
  assert.equal(result.authorization.help,size-1);
  const solo=resolveSkillCheck(lead,{skill:'observation',
   modifier:result.authorization.modifier,seed:result.authorization.seed});
  assert.equal(result.check.baseCount,solo.baseCount+helpers.length);
  assert.equal(result.check.initial.stress.length,solo.initial.stress.length);
 }
});

test('DHR-028: no invented fourth helper, duplicate, self-assistance or fake helper',()=>{
 const f=fixture({size:4}),s=f.state;
 const lead=s.actors[s.cursor].id,others=s.actors.filter(a=>a.id!==lead);
 const helpers=others.map(a=>({actorId:a.id,method:'cross_check',toolId:null}));
 for(const bad of [
  [...helpers,helpers[0]],
  [helpers[0],helpers[0]],
  [{...helpers[0],actorId:lead}],
  [{...helpers[0],actorId:'npc-not-in-party'}],
  [{...helpers[0],method:'brainstorm'}],
  [{...helpers[0],toolId:'field-radio'}],
  [{...helpers[0],skillRank:8}]
 ])assert.equal(resolve(f,request(s,{helpers:bad})).accepted,false,JSON.stringify(bad));
});

test('DHR-028: remote, dead, broken or stunned helpers never confer a bonus',()=>{
 const f=fixture();
 for(const mutate of [
  s=>{s.actors[1].location='reed-walk';},
  s=>{s.actors[1].dead=true;s.actors[1].health=0;},
  s=>{s.actors[1].broken=true;s.actors[1].health=0;},
  s=>{s.actors[1].pendingSkip=true;}
 ]){
  const state=cloned(f.state);mutate(state);
  assert.equal(resolve({...f,state},request(state)).accepted,false);
 }
});

test('DHR-028: source objective, correct skill, actor and action ownership are mandatory',()=>{
 const f=fixture(),s=f.state;
 for(const r of [
  {objectiveId:'phantom-task'},
  {objectiveId:'return-to-shelter'},
  {objectiveId:'signal-field-team'},
  {actorId:'pc-9'},
  {actorId:s.actors[(s.cursor+1)%s.actors.length].id},
  {skill:'comtech'},
  {help:3},
  {modifier:10},
  {seed:13},
  {success:true},
  {push:3},
  {helpers:[]},
  {helpers:null}
 ])assert.equal(resolve(f,request(s,r)).accepted,false,JSON.stringify(r));
});

test('DHR-028: stale beat, RNG, action index and later world state reject retroactive aid',()=>{
 const f=fixture(),s=f.state,req=request(s),r=resolve(f,req);
 assert.equal(r.accepted,true,r.reason);
 for(const change of [
  {expectedBeat:s.beat-1},{expectedBeat:s.beat+1},
  {expectedRng:s.rng^1},{expectedActionCount:s.actions.length+1}
 ])assert.equal(resolve(f,{...req,...change}).accepted,false);
 const later=step(s,'wait');
 assert.equal(resolve({...f,state:later},req).accepted,false);
 assert.equal(replayCooperativeCheck(f.compiled,later,r.journal).valid,false);
});

test('DHR-028: same action cannot spend help twice and replay detects any tampering',()=>{
 const f=fixture(),r=resolve(f);
 assert.equal(r.accepted,true,r.reason);
 assert.equal(resolve(f,request(f.state),r.journal).accepted,false);
 const edits=[
  j=>{j.entry.authorization.help=3;},
  j=>{j.entry.authorization.modifier=12;},
  j=>{j.entry.authorization.helpers[0].skillRank=5;},
  j=>{j.entry.authorization.seed+=1;},
  j=>{j.entry.check.initial.base[0]=6;},
  j=>{j.entry.check.successes+=1;},
  j=>{j.entry.request.expectedBeat+=1;},
  j=>{j.checkpoint.actionCount+=1;},
  j=>{j.source.fingerprint='12345678';},
  j=>{j.entry.request.helpers.push(j.entry.request.helpers[0]);},
  j=>{j.entry.extraSpend=true;},
  j=>{j.schemaVersion=2;}
 ];
 for(const edit of edits){
  const forged=cloned(r.journal);edit(forged);
  assert.equal(replayCooperativeCheck(f.compiled,f.state,forged).valid,false,
   JSON.stringify(forged.entry?.request));
  assert.equal(resolve(f,request(f.state),forged).accepted,false);
 }
});

test('DHR-028: a forged skill sheet or source fingerprint cannot authorize aid',()=>{
 const f=fixture(),r=resolve(f);
 const forged=cloned(f.state);
 forged.actors[1].skills.observation=9;
 assert.equal(resolve({...f,state:forged},request(forged)).accepted,false);
 const binding=cloned(f.state);
 binding.adventureBinding.fingerprint='bad00000';
 assert.equal(resolve({...f,state:binding},request(binding)).accepted,false);
 const compiled=source(f.state.initialSeed+1);
 assert.equal(resolveCooperativeCheck(compiled,f.state,request(f.state)).accepted,false);
 assert.equal(replayCooperativeCheck(compiled,f.state,r.journal).valid,false);
});

test('DHR-028: equipment must genuinely exist, be authored and belong to the supporting actor',()=>{
 const f=comtechFixture(),s=f.state;
 const lead=s.actors[s.cursor].id;
 const helper=s.actors.find(a=>a.id!==lead);
 const req=request(s,{objectiveId:'signal-field-team',
  helpers:[{actorId:helper.id,method:'radio_relay',toolId:'field-radio'}]});
 const r=resolve(f,req);
 assert.equal(r.accepted,true,r.reason);
 assert.equal(r.authorization.skill,'comtech');
 assert.equal(r.authorization.help,1);
 assert.equal(replayCooperativeCheck(f.compiled,f.state,r.journal).valid,true);
 for(const bad of [
  {...req,helpers:[{actorId:helper.id,method:'radio_relay',toolId:null}]},
  {...req,helpers:[{actorId:helper.id,method:'radio_relay',toolId:'fictional-radio'}]},
  {...req,helpers:[{actorId:helper.id,method:'hands_on',toolId:'field-radio'}]},
  {...req,helpers:[{actorId:helper.id,method:'cross_check',toolId:'field-radio'}]}
 ])assert.equal(resolve(f,bad).accepted,false);
 const transferred=cloned(s);
 const h=transferred.actors.find(a=>a.id===helper.id);
 const radio=h.inventory.indexOf('field-radio');h.inventory.splice(radio,1);
 transferred.actors.find(a=>a.id===lead).inventory.push('field-radio');
 assert.equal(isPartySave(transferred),true);
 assert.equal(resolve({...f,state:transferred},req).accepted,false);
});

test('DHR-028: local physical method never substitutes for a task it cannot perform',()=>{
 const f=fixture(),s=f.state;
 for(const method of ['hands_on','radio_relay']){
  const req=request(s,{helpers:[{actorId:s.actors[1].id,method,toolId:null}]});
  assert.equal(resolve(f,req).accepted,false);
 }
});

test('DHR-028: reproducible seeded check has no free extra rolls, including JSON roundtrip',()=>{
 const f=fixture(),a=resolve(f),b=resolve(f);
 assert.deepEqual(a,b);
 const roundtrip=JSON.parse(JSON.stringify(a.journal));
 assert.deepEqual(replayCooperativeCheck(f.compiled,cloned(f.state),roundtrip).check,a.check);
 assert.equal(f.state.actions.length,a.journal.checkpoint.actionCount);
 assert.equal(f.state.rng,a.journal.checkpoint.rng);
});

test('DHR-028: Party, Focus and Spectator ownership never gifts or removes cooperation',()=>{
 const f=fixture(),ordinary=resolve(f);
 assert.equal(ordinary.accepted,true);
 for(const mode of ['party','focus','spectator']){
  const change=setControlMode(f.state,mode==='focus'?
   {mode,focusedActorId:f.state.actors[0].id}:{mode});
  assert.equal(change.accepted,true,change.reason);
  assert.equal(isPartySave(change.state),true);
  const r=resolve({...f,state:change.state},request(change.state));
  assert.equal(r.accepted,true,r.reason);
  assert.deepEqual(r.authorization,ordinary.authorization);
  assert.deepEqual(r.check,ordinary.check);
 }
});

test('DHR-028: Nublar historical, alternate adventure, passive and unsupported combat are not silently patched',()=>{
 const old=newPartyIncident({seed:81,roster:makeParty({seed:81,size:2})});
 const copyBefore=cloned(old),compiled=source(81);
 assert.equal(isPartySave(old),true);
 assert.equal(resolveCooperativeCheck(compiled,old,request(old)).accepted,false);
 assert.deepEqual(old,copyBefore);
 const f=fixture(),s=cloned(f.state),before=cloned(s);
 s.combat={active:true,round:1,index:0,order:[],budgets:{}};
 assert.equal(resolve({...f,state:s},request(s)).accepted,false);
 assert.deepEqual(f.state,before);
 assert.equal(Object.hasOwn(f.state,'cooperation'),false);
 assert.equal(Object.hasOwn(old,'cooperation'),false);
});
