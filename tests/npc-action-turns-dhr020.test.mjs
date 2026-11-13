import test from 'node:test';
import assert from 'node:assert/strict';
import {beginNpcActionTurn,spendNpcScheduledAction} from '../src/npc-action-turns.mjs';
import {planNpcAction} from '../src/npc-action-choices.mjs';
import {compileNpcKnowledgeLedger} from '../src/npc-knowledge-provenance.mjs';
import {compileNpcMotiveIntent} from '../src/npc-motive-intent.mjs';
import {compileSelectedAdventure} from '../src/adventure-catalog.mjs';
import {rollInitiative,createActionBudget} from '../src/evolved-encounters.mjs';
import {compileAdventure,adventureBinding} from '../src/adventure-definition.mjs';
import {RIDGE_SURVEY_REV10} from '../adventures/ridge-survey-rev10.mjs';
import {initialSupportingCast} from '../src/adventure-supporting-cast.mjs';
import {makeParty} from '../src/characters.mjs';
import {newPartyIncident,isPartySave} from '../src/party-engine.mjs';
import {setControlMode} from '../src/party-director.mjs';

function select(scenario,slot,choice){
 for(let seed=0;seed<128;seed++){
  const s=compileSelectedAdventure(scenario,seed);
  if(s.hiddenFacts[slot].id===choice)return s;
 }
 throw Error('no matching deterministic source seed');
}
const quiet=()=>select('ridge-survey','predatorPresence','quiet-range');
const danger=()=>select('ridge-survey','predatorPresence','raptor-territory');
const spring=()=>select('tidal-nursery','estuaryConditions','spring-tide');
function frame(s,beat,npcs={},creatures={},distress=[]){
 return {beat,
  npcRooms:Object.fromEntries(s.definition.supportingCast
   .filter(n=>!n.variant||s.hiddenFacts[n.variant.slot].id===n.variant.choice)
   .map(n=>[n.id,npcs[n.id]??n.location])),
  creatureRooms:Object.fromEntries(s.definition.initialCreatures
   .filter(c=>!c.when||s.hiddenFacts[c.when.slot].id===c.when.choice)
   .map(c=>[c.id,creatures[c.id]??c.location])),
  distressedNpcIds:distress};
}
const intentions={
 withdraw:{id:'safety',kind:'withdraw',when:'observed_local_danger'},
 consider_help:{id:'care',kind:'consider_help',when:'observed_local_distress'},
 consider_inspection:{id:'inspect',kind:'consider_inspection',when:'observed_local_clue'}
};
function motive(s,id){
 const n=s.definition.supportingCast.find(x=>x.id===id);
 return compileNpcMotiveIntent(s,{
  source:{adventureId:s.adventureId,revision:s.revision,
   fingerprint:s.fingerprint,seed:s.seed,npcId:id,
   location:n.location,motive:n.motive,stance:n.stance},
  traits:{selfPreservation:true,aidOthers:true,curiosity:true},
  intentions:Object.values(intentions)
 });
}
const ledger=(s,frames,events=[])=>compileNpcKnowledgeLedger(s,{frames,events});
const conditions=l=>Object.fromEntries(l.npcIds.map(id=>[id,'ready']));
const query=(npcId,beat,exits=[])=>({npcId,beat,traversableExits:exits});
const seen={id:'predator-seen',type:'observe',npcId:'jules-marsh',
 factId:'hunter-1',kind:'danger',beat:1,location:'river-crossing'};
function dangerWorld(){
 const s=danger(),l=ledger(s,[frame(s,0),
  frame(s,1,{}, {'hunter-1':'river-crossing'})],[seen]);
 const id='jules-marsh',m=motive(s,id),q=query(id,1,['field-camp','forest-blind']);
 return {s,l,id,m,q,p:planNpcAction(s,m,l,q)};
}
function inspectionWorld(){
 const s=spring(),id='ivo-pell',m=motive(s,id);
 const l=ledger(s,[frame(s,0),frame(s,1,{'ivo-pell':'reed-walk'})],
  [{id:'tide-seen',type:'observe',npcId:id,
   factId:'rising_tide',kind:'clue',beat:1,location:'reed-walk'}]);
 const q=query(id,1,['nesting-pool','supply-shelter']);
 return {s,l,m,id,q,p:planNpcAction(s,m,l,q)};
}
function explore(w,extra={}){
 const b={phase:'exploration',beat:w.q.beat,
  slot:w.l.npcIds.indexOf(w.id),conditions:conditions(w.l),...extra};
 return beginNpcActionTurn(w.s,w.l,b);
}
function combat(w,seed=27){
 const room=w.l.frames.at(-1).npcRooms[w.id];
 const participants=w.l.npcIds.filter(id=>w.l.frames.at(-1).npcRooms[id]===room);
 const order=rollInitiative({actorIds:participants,dinosaurTurns:0,seed});
 const slot=order.findIndex(x=>x.actorId===w.id);
 const b={phase:'combat',beat:w.q.beat,round:2,slot,seed,
  participants,room,conditions:conditions(w.l)};
 return beginNpcActionTurn(w.s,w.l,b);
}
const act=(w,t,choice=w.p.chosen,proposal=w.p,q=w.q)=>
 spendNpcScheduledAction(w.s,w.m,w.l,q,proposal,choice,t);
const altered=(x,edit)=>{const changed=structuredClone(x);edit(changed);return changed;};

test('DHR-020: quiet exploration still owns a finite stretch and ends without encounter',()=>{
 const s=quiet(),id='jules-marsh',m=motive(s,id),l=ledger(s,[frame(s,0)]);
 const q=query(id,0,['field-camp','forest-blind']),p=planNpcAction(s,m,l,q);
 const w={s,l,id,m,q,p},turn=explore(w);
 assert.deepEqual(p.chosen,{kind:'hold'});
 assert.equal(turn.card,null);
 const result=act(w,turn);
 assert.equal(result.cost,'end');
 assert.equal(result.next.ended,true);
 assert.equal(result.next.history.length,1);
 assert.equal(result.next.boundary.beat,0);
 assert.deepEqual(result.next.budget,createActionBudget());
 assert.throws(()=>act(w,result.next),RangeError);
 assert.equal('spawn' in result,false);
 assert.equal('world' in result,false);
});
test('DHR-020: real local witnessed danger spends one finite exploration action',()=>{
 const w=dangerWorld(),turn=explore(w),a=act(w,turn);
 assert.deepEqual(w.p.chosen,{kind:'withdraw',to:'field-camp'});
 assert.equal(a.cost,'stretch');
 assert.equal(a.next.ended,true);
 assert.equal(a.next.ownerId,w.id);
 assert.match(a.receipt,/^npc-action-reservation-v1:/);
 assert.throws(()=>act(w,a.next),RangeError);
 assert.equal('nextRoom' in a,false); // reservation is NOT movement
});
test('DHR-020: source-bound movement is never a free step or a teleport',()=>{
 const w=dangerWorld(),t=explore(w);
 for(const choice of [
  {kind:'withdraw',to:'survey-ridge'},
  {kind:'withdraw',to:'forest-blind'},
  {kind:'move',to:'field-camp'},
  {kind:'attack',damage:99}
 ])assert.throws(()=>act(w,t,choice),RangeError);
 assert.throws(()=>act(w,t,w.p.chosen,w.p,
  query(w.id,1,['survey-ridge'])),RangeError);
 const result=act(w,t);
 assert.equal(result.next.history[0].choice.to,'field-camp');
 assert.equal(result.next.history[0].cost,'stretch');
});
test('DHR-020: reject fabricated plan fields, NPC identity and replay fingerprints',()=>{
 const w=dangerWorld(),t=explore(w);
 for(const bogus of [
  altered(w.p,p=>p.identity='npc-action-choice-v1:forged'),
  altered(w.p,p=>p.beat=2),
  altered(w.p,p=>p.room='field-camp'),
  altered(w.p,p=>p.chosen={kind:'attack'}),
  altered(w.p,p=>p.candidates.push({kind:'teleport',to:'field-camp'})),
  {...w.p,attack:{free:true}}
 ])assert.throws(()=>act(w,t,w.p.chosen,bogus),RangeError);
 assert.throws(()=>act(w,t,w.p.chosen,w.p,query('leena-harrow',1)),RangeError);
 assert.throws(()=>act(w,t,w.p.chosen,w.p,query(w.id,0)),RangeError);
});
test('DHR-020: beat must be the LAST real frame, not old or invented future evidence',()=>{
 const w=dangerWorld();
 assert.throws(()=>beginNpcActionTurn(w.s,w.l,{
  phase:'exploration',beat:2,slot:0,conditions:conditions(w.l)}),RangeError);
 assert.throws(()=>beginNpcActionTurn(w.s,w.l,{
  phase:'exploration',beat:0,slot:0,conditions:conditions(w.l)}),RangeError);
 const forged=altered(w.l,x=>{x.frames[1].npcRooms['jules-marsh']='unknown-room';});
 assert.throws(()=>beginNpcActionTurn(w.s,forged,{
  phase:'exploration',beat:1,slot:0,conditions:conditions(w.l)}),RangeError);
});
test('DHR-020: reject unknown, remotely scheduled, dead or incapacitated NPCs',()=>{
 const w=dangerWorld(),idx=w.l.npcIds.indexOf(w.id);
 for(const b of [
  {phase:'exploration',beat:1,slot:999,conditions:conditions(w.l)},
  {phase:'exploration',beat:1,slot:-1,conditions:conditions(w.l)},
  {phase:'exploration',beat:1,slot:idx,
   conditions:{...conditions(w.l),[w.id]:'incapacitated'}},
  {phase:'exploration',beat:1,slot:idx,
   conditions:{...conditions(w.l),[w.id]:'dead'}},
  {phase:'exploration',beat:1,slot:idx,
   conditions:{...conditions(w.l),fake:'ready'}},
  {phase:'exploration',beat:1,slot:idx,
   conditions:{...conditions(w.l),[w.id]:'invulnerable'}},
  {phase:'exploration',beat:1,slot:idx,conditions:conditions(w.l),freeMove:true}
 ])assert.throws(()=>beginNpcActionTurn(w.s,w.l,b),RangeError);
 const t=beginNpcActionTurn(w.s,w.l,{
  phase:'exploration',beat:1,slot:0,conditions:conditions(w.l)});
 if(t.ownerId!==w.id)assert.throws(()=>act(w,t),RangeError);
});
test('DHR-020: replayed seed chooses real combat initiative, not an NPC-selected card',()=>{
 const w=dangerWorld(),t=combat(w,77);
 const expected=rollInitiative({actorIds:t.boundary.participants,dinosaurTurns:0,seed:77});
 assert.equal(t.ownerId,w.id);
 assert.equal(t.card,expected[t.boundary.slot].card);
 for(const edit of [
  x=>{x.card=1+x.card;},
  x=>{x.ownerId='leena-harrow';},
  x=>{x.boundary.seed=78;},
  x=>{x.boundary.slot=50;},
  x=>{x.boundary.round=0;}
 ])assert.throws(()=>act(w,altered(t,edit)),RangeError);
});
test('DHR-020: invalid initiative rosters, actor identity and rounds fail closed',()=>{
 const w=dangerWorld(),t=combat(w);
 for(const edit of [
  x=>{x.participants.push(x.participants[0]);},
  x=>{x.participants.push('bad/identity');},
  x=>{x.participants=[];},
  x=>{x.seed=-1;},
  x=>{x.round=Infinity;},
  x=>{x.round=1.5;},
  x=>{x.slot=50;},
  x=>{x.room='unknown-room';},
  x=>{x.participants.push('leena-harrow');}, // source-remote at river crossing
  x=>{x.phase='flight';}
 ])assert.throws(()=>beginNpcActionTurn(w.s,w.l,altered(t.boundary,edit)),RangeError);
});
test('DHR-020: no remote NPC or creature can enter the local combat card roster',()=>{
 const w=dangerWorld(),t=combat(w),frame=w.l.frames.at(-1);
 assert.equal(frame.npcRooms[t.ownerId],t.boundary.room);
 const far=w.l.npcIds.find(id=>frame.npcRooms[id]!==t.boundary.room);
 if(far){
  assert.throws(()=>beginNpcActionTurn(w.s,w.l,altered(t.boundary,
   b=>b.participants.push(far))),RangeError);
 }
 const absent=altered(t.boundary,b=>b.room='field-camp');
 assert.throws(()=>beginNpcActionTurn(w.s,w.l,absent),RangeError);
});
test('DHR-020: combat withdrawal costs quick and cannot be repeated for free',()=>{
 const w=dangerWorld(),t=combat(w),first=act(w,t);
 assert.equal(first.cost,'quick');
 assert.deepEqual(first.next.budget,{full:1,quick:1,quickSpent:1,fullSpent:0});
 assert.equal(first.next.ended,false);
 assert.throws(()=>act(w,first.next),RangeError);
 const held=act(w,first.next,{kind:'hold'});
 assert.equal(held.cost,'end');
 assert.equal(held.next.ended,true);
 assert.equal(held.next.history.length,2);
 assert.throws(()=>act(w,held.next,{kind:'hold'}),RangeError);
});
test('DHR-020: inspection in combat consumes full action with no discovery grant',()=>{
 const w=inspectionWorld(),t=combat(w),spent=act(w,t);
 assert.deepEqual(w.p.chosen,{kind:'consider_inspection',factId:'rising_tide'});
 assert.equal(spent.cost,'full');
 assert.deepEqual(spent.next.budget,{full:0,quick:2,quickSpent:0,fullSpent:1});
 assert.equal(spent.next.ended,false);
 assert.throws(()=>act(w,spent.next),RangeError);
 const held=act(w,spent.next,{kind:'hold'});
 assert.equal(held.next.ended,true);
 assert.equal('discovered' in spent,false);
});
test('DHR-020: forged budget, consumed action history, receipt and source are rejected',()=>{
 const w=dangerWorld(),t=combat(w),a=act(w,t);
 for(const edit of [
  x=>{x.budget.quickSpent=0;},
  x=>{x.ended=true;},
  x=>{x.history[0].receipt='fake';},
  x=>{x.history[0].cost='free';},
  x=>{x.history[0].choice.to='survey-ridge';},
  x=>{x.history[0].proposal.identity='forged';},
  x=>{x.identity='fake';},
  x=>{x.ledgerIdentity='other';},
  x=>{x.source.seed++;},
  x=>{x.history.push(x.history[0]);}
 ])assert.throws(()=>act(w,altered(a.next,edit),{kind:'hold'}),RangeError);
});
test('DHR-020: repeat replay is deterministic, preserving one idempotency receipt',()=>{
 const w=dangerWorld();
 const a=act(w,combat(w,42)),b=act(dangerWorld(),combat(dangerWorld(),42));
 assert.deepEqual(a,b);
 assert.equal(a.receipt,b.receipt);
 assert.equal(Object.isFrozen(a.next),true);
 assert.equal(Object.isFrozen(a.next.history[0]),true);
 assert.throws(()=>{a.next.history[0].choice.kind='attack';},TypeError);
 assert.notEqual(combat(w,42).card,undefined);
});
test('DHR-020: synthetic world evidence and control modes are not altered',()=>{
 const w=inspectionWorld(),before=structuredClone({s:w.s,l:w.l,m:w.m});
 const e=act(w,explore(w));
 assert.equal(e.cost,'stretch');
 assert.deepEqual({s:w.s,l:w.l,m:w.m},before);
 const roster=makeParty({seed:61,size:1,careers:['scientist']});
 const save=newPartyIncident({seed:0,roster,adventureId:'ridge-survey'});
 const original=compileAdventure(RIDGE_SURVEY_REV10,{seed:0});
 save.adventureBinding=adventureBinding(original);
 save.supportingCast=initialSupportingCast(original);
 delete save.npcAutonomyRecords;delete save.npcDangerRecords;
 const copy=structuredClone(save);
 assert.equal(isPartySave(save),true);
 for(const mode of ['party','focus','spectator']){
  const result=setControlMode(save,mode==='focus'?
   {mode,focusedActorId:save.actors[0].id}:{mode});
  assert.equal(result.accepted,true,result.reason);
  assert.equal(isPartySave(result.state),true);
  assert.equal(result.state.rng,save.rng);
  assert.equal(result.state.beat,save.beat);
 }
 assert.deepEqual(save,copy);
});
