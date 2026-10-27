import test from 'node:test';
import assert from 'node:assert/strict';
import {makeParty} from '../src/characters.mjs';
import {compileSelectedAdventure} from '../src/adventure-catalog.mjs';
import {RIDGE_SURVEY_REV7} from '../adventures/ridge-survey-rev7.mjs';
import {compileAdventure,adventureBinding} from '../src/adventure-definition.mjs';
import {newPartyIncident,partyStep,partyView,isPartySave} from '../src/party-engine.mjs';
import {currentOwner,runAutonomousTurn,setControlMode} from '../src/party-director.mjs';
import {selectedCombatSlot} from '../src/adventure-combat-live.mjs';
const roster=makeParty({seed:42,size:1,careers:['scientist']});
const fresh=seed=>newPartyIncident({adventureId:'ridge-survey',seed,roster});
function enter(seed){
 let s=fresh(seed);
 for(const room of ['rocky-ascent','survey-ridge','forest-blind']){
  const r=partyStep(s,'move '+room);
  assert.equal(r.accepted,true,r.reason);
  s=r.state;
  if(s.pendingPredatorResponse)break;
 }
 return s;
}
const populated=Array.from({length:350},(_,i)=>i).filter(seed=>
 compileSelectedAdventure('ridge-survey',seed).hiddenFacts.predatorPresence.id==='raptor-territory');
const threatened=populated.filter(seed=>Boolean(enter(seed).pendingPredatorResponse));
const engaged=seed=>{
 const r=partyStep(enter(seed),'react defend');
 assert.equal(r.accepted,true,r.reason);
 return r.state;
};
const safeSeed=threatened.find(seed=>Boolean(engaged(seed).combat));
const playerFirstSeed=threatened.find(seed=>selectedCombatSlot(engaged(seed))?.kind==='human');
test('009-B2b2c2c2b: revision 8 actually engages Evolved source combat only after committed opening defense',()=>{
 assert.ok(threatened.length>0);
 assert.ok(Number.isInteger(safeSeed));
 const pending=enter(safeSeed);
 assert.equal(pending.adventureBinding.revision,12);
 assert.equal(pending.combat,null);
 assert.equal(pending.clock.combatSeconds,0);
 const s=engaged(safeSeed);
 assert.ok(s.combat);
 assert.equal(s.combat.predatorId,'hunter-1');
 assert.equal(s.combat.predatorSpeed,2);
 assert.equal(s.combat.order.filter(slot=>slot.kind==='dinosaur').length,2);
 assert.equal(s.clock.combatSeconds,10);
 assert.equal(isPartySave(s),true);
 assert.equal(partyView(s).combat.round,1);
});
test('009-B2b2c2c2b: quiet seeds remain unthreatened; no fabricated combat or AI prompt',()=>{
 const seed=Array.from({length:160},(_,i)=>i).find(i=>
  compileSelectedAdventure('ridge-survey',i).hiddenFacts.predatorPresence.id==='quiet-range');
 const s=enter(seed);
 assert.equal(s.pendingPredatorResponse,null);
 assert.equal(s.combat,null);
 assert.equal(s.clock.combatSeconds,0);
 assert.equal(isPartySave(s),true);
});
test('009-B2b2c2c2b: physically impossible and unsupported attacks cannot mutate source combat',()=>{
 const s=engaged(safeSeed),before=structuredClone(s),slot=selectedCombatSlot(s);
 const wrong=partyStep(s,'move nowhere',{actorId:slot.actorId,source:slot.kind==='dinosaur'?'ai':'human'});
 assert.equal(wrong.accepted,false);
 assert.deepEqual(s,before);
 const attack=partyStep(s,'attack dinosaur',{actorId:slot.actorId,source:slot.kind==='dinosaur'?'ai':'human'});
 assert.equal(attack.accepted,false,'unimplemented research weapon rules must not pretend combat damage');
 assert.deepEqual(s,before);
});
test('009-B2b2c2c2b: quick action retrieves real property and retreat leaves a physically colocated predator',()=>{
 assert.ok(Number.isInteger(playerFirstSeed),'at least one seeded encounter grants immediate survivor initiative');
 let s=engaged(playerFirstSeed);
 assert.equal(s.actors[0].location,'forest-blind');
 const got=partyStep(s,'take tag-reader');
 assert.equal(got.accepted,true,got.reason);
 s=got.state;
 assert.equal(s.actors[0].inventory.includes('tag-reader'),true);
 assert.equal(s.rooms['forest-blind'].items.includes('tag-reader'),false);
 assert.equal(s.combat.budgets[s.actors[0].id].quickSpent,1);
 const r=partyStep(s,'move survey-ridge');
 assert.equal(r.accepted,true,r.reason);
 assert.equal(r.state.actors[0].location,'survey-ridge');
 assert.equal(r.state.combat,null,'last exposed survivor left predator room by connected path');
 assert.equal(r.state.dinosaurs.find(d=>d.id==='hunter-1').location,'forest-blind');
 assert.equal(isPartySave(r.state),true);
});
test('009-B2b2c2c2b: dinosaur initiative creates explicit sourced defense; no predeclared hit',()=>{
 let s=engaged(safeSeed),snapshot=structuredClone(s),found=false;
 for(let i=0;i<5&&s.combat;i++){
  const slot=selectedCombatSlot(s);
  if(slot.kind==='dinosaur'){
   const declared=partyStep(s,{kind:'predator',target:''},{actorId:slot.actorId,source:'ai'});
   assert.equal(declared.accepted,true,declared.reason);
   assert.equal(declared.awaitingReaction,true);
   assert.ok(declared.state.combatReaction);
   assert.equal(declared.state.combatDamageRecords.length,0);
   assert.equal(partyStep(declared.state,'move survey-ridge').accepted,false);
   const defended=partyStep(declared.state,'react defend');
   assert.equal(defended.accepted,true,defended.reason);
   assert.equal(defended.state.combatReaction,null);
   assert.equal(defended.state.combatDamageRecords.length,1);
   assert.equal(isPartySave(defended.state),true);
   found=true;break;
  }
  const passed=partyStep(s,'end');
  assert.equal(passed.accepted,true,passed.reason);
  s=passed.state;
 }
 assert.equal(found,true);
 assert.deepEqual(engaged(safeSeed),snapshot);
});
test('009-B2b2c2c2b: Focus ownership and Spectator predator actions respect real initiative',()=>{
 let s=engaged(playerFirstSeed);
 const playerId=s.actors[0].id;
 s=setControlMode(s,{mode:'focus',focusedActorId:playerId}).state;
 assert.equal(currentOwner(s),'human');
 assert.equal(partyStep(s,'end',{source:'ai',actorId:playerId}).accepted,false);
 s=setControlMode(s,{mode:'spectator'}).state;
 assert.equal(currentOwner(s),'ai');
 assert.equal(partyStep(s,'end',{source:'human',actorId:playerId}).accepted,false);
 const auto=runAutonomousTurn(s,{singleStep:true});
 assert.equal(auto.accepted,true,auto.reason);
 assert.equal(isPartySave(auto.state),true);
});
test('009-B2b2c2c2b: immutable rev7 save can replay existing opening reaction without live rounds',()=>{
 const seed=safeSeed;let old=fresh(seed);
 old.adventureBinding=adventureBinding(compileAdventure(RIDGE_SURVEY_REV7,{seed}));
 old.supportingCast=undefined;old.conversationRecords=undefined; old.npcAutonomyRecords=undefined;old.npcDangerRecords=undefined;
 assert.equal(isPartySave(old),true);
 for(const room of ['rocky-ascent','survey-ridge','forest-blind']){
  old=partyStep(old,'move '+room).state;
  if(old.pendingPredatorResponse)break;
 }
 assert.ok(old.pendingPredatorResponse);
 const r=partyStep(old,'react defend');
 assert.equal(r.accepted,true,r.reason);
 assert.equal(r.state.combat,null);
 assert.equal(r.state.clock.combatSeconds,10);
 assert.equal(isPartySave(r.state),true);
});
test('009-B2b2c2c2b: saved combat is not reconstructed as a fictional target or forged action budget',()=>{
 const s=engaged(safeSeed);
 for(const mutate of [
  t=>t.combat.predatorId='fictional',
  t=>t.combat.order[0].card=99,
  t=>t.combat.budgets[t.combat.actorIds[0]].quickSpent=7,
  t=>t.combat.predatorSpeed=3,
  t=>t.clock.combatSeconds=999
 ]){
  const tampered=structuredClone(s);mutate(tampered);
  assert.equal(isPartySave(tampered),false);
 }
});

function cycleLiveFight(s){
 const reaction=s.combatReaction,slot=selectedCombatSlot(s);
 return reaction?partyStep(s,'react defend',{actorId:reaction.victimId,source:'human'}):
  slot?.kind==='dinosaur'?partyStep(s,{kind:'predator',target:''},
   {actorId:slot.actorId,source:'ai'}):
   partyStep(s,'end',{actorId:slot.actorId,source:'human'});
}
function replayToSecondRound(seed){
 let s=engaged(seed);
 for(let n=0;n<40&&s.combat&&s.combat.round===1;n++){
  const result=cycleLiveFight(s);
  if(!result.accepted)return null;
  s=result.state;
 }
 return s.combat?.round===2?s:null;
}
test('009-B2b2c2c2b: actual completed ten-second round advances injury time and re-deals initiative',()=>{
 const seed=threatened.find(i=>Boolean(replayToSecondRound(i)));
 assert.ok(Number.isInteger(seed),'an actual physical encounter must survive the first full round');
 const initial=engaged(seed),next=replayToSecondRound(seed);
 assert.ok(next.combat,'continuing predator contact has a real second round');
 assert.equal(next.combat.round,2);
 assert.equal(next.combatRoundRecords.length,1);
 assert.equal(next.clock.combatRounds,2,'opening defense plus one completed combat round');
 assert.equal(next.clock.combatSeconds,20);
 assert.notEqual(next.combat.cardSeed,initial.combat.cardSeed);
 assert.deepEqual(next,replayToSecondRound(seed),'full combat round is deterministic');
 assert.equal(isPartySave(next),true);
});
