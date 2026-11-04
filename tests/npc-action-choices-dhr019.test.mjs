import test from 'node:test';
import assert from 'node:assert/strict';
import {planNpcAction} from '../src/npc-action-choices.mjs';
import {compileNpcMotiveIntent} from '../src/npc-motive-intent.mjs';
import {compileNpcKnowledgeLedger} from '../src/npc-knowledge-provenance.mjs';
import {compileSelectedAdventure} from '../src/adventure-catalog.mjs';
import {compileAdventure,adventureBinding} from '../src/adventure-definition.mjs';
import {RIDGE_SURVEY_REV10} from '../adventures/ridge-survey-rev10.mjs';
import {makeParty} from '../src/characters.mjs';
import {newPartyIncident,isPartySave} from '../src/party-engine.mjs';
import {initialSupportingCast} from '../src/adventure-supporting-cast.mjs';
import {setControlMode} from '../src/party-director.mjs';

const needs={
 withdraw:{id:'safety',kind:'withdraw',when:'observed_local_danger'},
 consider_help:{id:'care',kind:'consider_help',when:'observed_local_distress'},
 consider_inspection:{id:'inspect',kind:'consider_inspection',when:'observed_local_clue'}
};
const select=(scenario,slot,choice)=>{
 for(let seed=0;seed<128;seed++){
  const c=compileSelectedAdventure(scenario,seed);
  if(c.hiddenFacts[slot].id===choice)return c;
 }
 throw Error('seed fixture not found');
};
const spring=()=>select('tidal-nursery','estuaryConditions','spring-tide');
const quiet=()=>select('ridge-survey','predatorPresence','quiet-range');
const danger=()=>select('ridge-survey','predatorPresence','raptor-territory');
function frame(source,beat,npc={},creature={},distressedNpcIds=[]){
 return {beat,
  npcRooms:Object.fromEntries((source.definition.supportingCast||[])
   .filter(n=>!n.variant||source.hiddenFacts[n.variant.slot].id===n.variant.choice)
   .map(n=>[n.id,npc[n.id]??n.location])),
  creatureRooms:Object.fromEntries(source.definition.initialCreatures
   .filter(c=>!c.when||source.hiddenFacts[c.when.slot].id===c.when.choice)
   .map(c=>[c.id,creature[c.id]??c.location])),
  distressedNpcIds};
}
function motive(source,id,enabled=['withdraw','consider_help','consider_inspection']){
 const n=source.definition.supportingCast.find(n=>n.id===id);
 return compileNpcMotiveIntent(source,{
  source:{adventureId:source.adventureId,revision:source.revision,
   fingerprint:source.fingerprint,seed:source.seed,npcId:id,
   location:n.location,motive:n.motive,stance:n.stance},
  traits:{selfPreservation:true,aidOthers:true,curiosity:true},
  intentions:enabled.map(kind=>({...needs[kind]}))
 });
}
const ledger=(source,frames,events=[])=>compileNpcKnowledgeLedger(source,{frames,events});
const query=(npcId,beat=0,traversableExits=[])=>({npcId,beat,traversableExits});
const seeClue={id:'clue-1',type:'observe',npcId:'ivo-pell',
 factId:'rising_tide',kind:'clue',beat:1,location:'reed-walk'};
const tideFrames=s=>[frame(s,0),frame(s,1,{'ivo-pell':'reed-walk'}),
 frame(s,2,{'ivo-pell':'supply-shelter'})];
const predatorFrames=s=>[frame(s,0),frame(s,1,{}, {'hunter-1':'river-crossing'}),
 frame(s,2,{'jules-marsh':'field-camp'},{'hunter-1':'forest-blind'})];
const predatorSeen={id:'predator-seen',type:'observe',npcId:'jules-marsh',
 factId:'hunter-1',kind:'danger',beat:1,location:'river-crossing'};

// Synthetic replay-attested inputs are fixtures, not proof of live Evolved dice.
test('DHR-019: quiet scenario has only hold; no dinosaur encounter is forced',()=>{
 const s=quiet(),p=motive(s,'jules-marsh'),l=ledger(s,[frame(s,0)]);
 const plan=planNpcAction(s,p,l,query('jules-marsh',0,['field-camp','forest-blind']));
 assert.deepEqual(plan.candidates,[{kind:'hold'}]);
 assert.deepEqual(plan.chosen,{kind:'hold'});
 assert.equal(plan.room,'river-crossing');
 assert.equal('state' in plan,false);
 assert.equal('creatureId' in plan,false);
});
test('DHR-019: source witnessed danger proposes only the named one-edge withdrawal',()=>{
 const s=danger(),p=motive(s,'jules-marsh'),l=ledger(s,predatorFrames(s),[predatorSeen]);
 const plan=planNpcAction(s,p,l,query('jules-marsh',1,['forest-blind','field-camp']));
 assert.deepEqual(plan.candidates,[{kind:'hold'},{kind:'withdraw',to:'field-camp'}]);
 assert.deepEqual(plan.chosen,{kind:'withdraw',to:'field-camp'});
 assert.ok(plan.candidates.every(c=>!['attack','heal','move','teleport'].includes(c.kind)));
});
test('DHR-019: missing passable source exit cannot become a retreat or teleport',()=>{
 const s=danger(),p=motive(s,'jules-marsh'),l=ledger(s,predatorFrames(s),[predatorSeen]);
 for(const exits of [[],['forest-blind']])
  assert.deepEqual(planNpcAction(s,p,l,query('jules-marsh',1,exits)).candidates,[{kind:'hold'}]);
 assert.throws(()=>planNpcAction(s,p,l,query('jules-marsh',1,['survey-ridge'])),RangeError);
 assert.throws(()=>planNpcAction(s,p,l,query('jules-marsh',1,['river-crossing'])),RangeError);
});
test('DHR-019: hearing a witnessed warning does not give listener eyewitness retreat',()=>{
 const s=danger(),l=ledger(s,predatorFrames(s),[predatorSeen,
  {id:'warn-leena',type:'report',fromNpcId:'jules-marsh',toNpcId:'leena-harrow',
   factId:'hunter-1',kind:'danger',beat:2,location:'field-camp'}]);
 const listener=planNpcAction(s,motive(s,'leena-harrow'),l,query('leena-harrow',2,['river-crossing']));
 assert.deepEqual(listener.candidates,[{kind:'hold'}]);
 const witness=planNpcAction(s,motive(s,'jules-marsh'),l,query('jules-marsh',2,['river-crossing']));
 assert.deepEqual(witness.candidates,[{kind:'hold'}]); // old sighting, now at camp
});
test('DHR-019: local seeded clue permits consideration, not automatic discovery',()=>{
 const s=spring(),l=ledger(s,tideFrames(s),[seeClue]);
 const plan=planNpcAction(s,motive(s,'ivo-pell'),l,query('ivo-pell',1,['nesting-pool','supply-shelter']));
 assert.deepEqual(plan.candidates,[{kind:'hold'},{kind:'consider_inspection',factId:'rising_tide'}]);
 assert.deepEqual(plan.chosen,{kind:'consider_inspection',factId:'rising_tide'});
 assert.equal(plan.candidates.some(c=>Object.hasOwn(c,'result')),false);
 assert.deepEqual(planNpcAction(s,motive(s,'ivo-pell'),l,query('ivo-pell',2,['reed-walk'])).candidates,[{kind:'hold'}]);
});
test('DHR-019: observed distress permits considering help, never free healing',()=>{
 const s=spring(),frames=tideFrames(s);
 frames[2].distressedNpcIds=['ivo-pell'];
 const l=ledger(s,frames,[{id:'distress-seen',type:'observe',npcId:'mara-venn',
  factId:'distress-ivo-pell',kind:'distress',beat:2,location:'supply-shelter'}]);
 const before=structuredClone({s,frames});
 const plan=planNpcAction(s,motive(s,'mara-venn'),l,query('mara-venn',2,['reed-walk']));
 assert.deepEqual(plan.candidates,[{kind:'hold'},{kind:'consider_help',factId:'distress-ivo-pell'}]);
 assert.deepEqual(plan.chosen,{kind:'consider_help',factId:'distress-ivo-pell'});
 assert.equal('injury' in plan,false);
 assert.deepEqual({s,frames},before);
});
test('DHR-019: a true trait without authored intention grants nothing',()=>{
 const s=spring(),l=ledger(s,tideFrames(s),[seeClue]);
 assert.deepEqual(planNpcAction(s,motive(s,'ivo-pell',[]),l,
  query('ivo-pell',1,['nesting-pool'])).candidates,[{kind:'hold'}]);
});
test('DHR-019: return route does not grant unscheduled retreat',()=>{
 const s=spring(),l=ledger(s,tideFrames(s),[seeClue]);
 const plan=planNpcAction(s,motive(s,'ivo-pell'),l,query('ivo-pell',1,['nesting-pool','supply-shelter']));
 assert.equal(plan.candidates.some(c=>c.kind==='withdraw'),false);
});
test('DHR-019: false reported danger remains hearsay in a quiet world',()=>{
 const s=spring();
 const rumor={id:'imaginary-hunter',type:'report',fromNpcId:'ivo-pell',
  toNpcId:'mara-venn',factId:'phantom-raptor',kind:'danger',
  beat:2,location:'supply-shelter'};
 const plan=planNpcAction(s,motive(s,'mara-venn'),ledger(s,tideFrames(s),[rumor]),
  query('mara-venn',2,['reed-walk']));
 assert.deepEqual(plan.candidates,[{kind:'hold'}]);
});
test('DHR-019: reordered replay inputs and exits retain exact identity',()=>{
 const s=danger(),frames=predatorFrames(s),p=motive(s,'jules-marsh');
 const a=planNpcAction(s,p,ledger(s,frames,[predatorSeen]),
  query('jules-marsh',1,['field-camp','forest-blind']));
 const b=planNpcAction(danger(),motive(danger(),'jules-marsh'),
  ledger(danger(),structuredClone(frames),[predatorSeen]),
  query('jules-marsh',1,['forest-blind','field-camp']));
 assert.deepEqual(a,b);
 assert.match(a.identity,/^npc-action-choice-v1:/);
 for(const value of [a,a.source,a.candidates,a.candidates[0],a.chosen])
  assert.equal(Object.isFrozen(value),true);
 assert.throws(()=>{a.chosen.kind='attack';},TypeError);
});
test('DHR-019: bad actor, source seed, revision and motive identity fail closed',()=>{
 const s=danger(),p=motive(s,'jules-marsh'),l=ledger(s,predatorFrames(s),[predatorSeen]);
 const q=query('jules-marsh',1,['field-camp']);
 assert.throws(()=>planNpcAction(s,p,l,{...q,npcId:'leena-harrow'}),RangeError);
 assert.throws(()=>planNpcAction(s,motive(s,'tomas-wren'),l,q),RangeError);
 const forged=structuredClone(s);forged.fingerprint='00000000';
 assert.throws(()=>planNpcAction(forged,p,l,q),RangeError);
 assert.throws(()=>planNpcAction(compileSelectedAdventure('ridge-survey',s.seed+1),p,l,q),RangeError);
 const flags=structuredClone(p);flags.motiveFlags.selfPreservation=false;
 assert.throws(()=>planNpcAction(s,flags,l,q),RangeError);
 const version=structuredClone(p);version.source.revision++;
 assert.throws(()=>planNpcAction(s,version,l,q),RangeError);
});
test('DHR-019: forged ledger observations, frames and identity fail closed',()=>{
 const s=danger(),p=motive(s,'jules-marsh'),l=ledger(s,predatorFrames(s),[predatorSeen]);
 for(const edit of [
  x=>{x.identity='npc-knowledge-v1:fake';},
  x=>{x.source.seed++;},
  x=>{x.frames[1].npcRooms['jules-marsh']='forest-blind';},
  x=>{x.entries[0].source='reported';},
  x=>{x.entries[0].kind='clue';},
  x=>{x.entries[0].factId='imaginary-hunter';},
  x=>{x.entries[0].forceCombat=true;},
  x=>{x.npcIds.push('fake-human');}
 ]){
  const changed=structuredClone(l);edit(changed);
  assert.throws(()=>planNpcAction(s,p,changed,query('jules-marsh',1,['field-camp'])),RangeError);
 }
});
test('DHR-019: invalid exit, query shape, and injection fail closed',()=>{
 const s=danger(),p=motive(s,'jules-marsh'),l=ledger(s,predatorFrames(s),[predatorSeen]);
 for(const q of [null,{},query('fake',1),query('jules-marsh',99),
  query('jules-marsh',-1),query('jules-marsh',0.5),
  query('jules-marsh',1,['field-camp','field-camp']),
  query('jules-marsh',1,['../private']),query('jules-marsh',1,['survey-ridge']),
  {...query('jules-marsh',1),attack:true},
  {...query('jules-marsh',1),heal:'free'},
  {...query('jules-marsh',1),traversableExits:[{to:'field-camp'}]}])
  assert.throws(()=>planNpcAction(s,p,l,q),RangeError);
 const polluted=Object.assign(Object.create({force:true}),query('jules-marsh',1,['field-camp']));
 assert.throws(()=>planNpcAction(s,p,l,polluted),RangeError);
});
test('DHR-019: historical save and all control modes remain unchanged',()=>{
 const roster=makeParty({seed:61,size:1,careers:['scientist']});
 const old=compileAdventure(RIDGE_SURVEY_REV10,{seed:0});
 const save=newPartyIncident({seed:0,roster,adventureId:'ridge-survey'});
 save.adventureBinding=adventureBinding(old);
 save.supportingCast=initialSupportingCast(old);
 delete save.npcAutonomyRecords;delete save.npcDangerRecords;
 assert.equal(isPartySave(save),true);
 const before=structuredClone(save),s=spring();
 planNpcAction(s,motive(s,'mara-venn'),ledger(s,[frame(s,0)]),
  query('mara-venn',0,['reed-walk']));
 for(const mode of ['party','focus','spectator']){
  const opts=mode==='focus'?{mode,focusedActorId:save.actors[0].id}:{mode};
  const result=setControlMode(save,opts);
  assert.equal(result.accepted,true,result.reason);
  assert.equal(isPartySave(result.state),true);
  assert.equal(result.state.beat,save.beat);
  assert.equal(result.state.rng,save.rng);
 }
 assert.deepEqual(save,before);
 assert.equal(isPartySave(save),true);
});
