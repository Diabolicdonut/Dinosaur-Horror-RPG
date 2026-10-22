import test from 'node:test';
import assert from 'node:assert/strict';
import {makeParty} from '../src/characters.mjs';
import {rollInitiative} from '../src/evolved-encounters.mjs';
import {newPartyIncident,partyStep,isPartySave,partyView,parsePartyAction} from '../src/party-engine.mjs';
import {beginCombat,holdOff,activeCombatSlot,activeTurnId} from '../src/combat-turns.mjs';
import {setControlMode,runAutonomousTurn} from '../src/party-director.mjs';
import {enrichInjuries,deathRoll} from '../src/evolved-injuries.mjs';
const roster=makeParty({seed:530,size:3,careers:['ranger','medic','tactical']});
const setup=()=>newPartyIncident({seed:455,roster});
function combat(seed=3){
 const s=setup();s.dinosaurs[0].location='control';
 const okay=beginCombat(s,seed);assert(okay);
 if(activeCombatSlot(s)?.kind==='human')
  s.cursor=s.actors.findIndex(a=>a.id===activeTurnId(s));
 return s;
}
function humanLead(){
 for(let seed=1;seed<300;seed++){
  const s=combat(seed);
  if(activeCombatSlot(s)?.kind==='human'&&s.combat.order.length-s.combat.index>1)return s;
 }
 throw Error('No human-led encounter seed');
}
test('a surprising attacker takes lowest numbered card and remaining draws stay unique',()=>{
 const a=rollInitiative({actorIds:['pc-1','pc-2'],dinosaurTurns:2,surpriseActorIds:['dinosaur-1'],seed:22});
 assert.equal(a[0].actorId,'dinosaur-1');assert.equal(a[0].card,1);
 assert.equal(new Set(a.map(x=>x.card)).size,4);
 assert.deepEqual(a,rollInitiative({actorIds:['pc-1','pc-2'],dinosaurTurns:2,surpriseActorIds:['dinosaur-1'],seed:22}));
});
test('multiple surprising attackers receive lowest cards in declared order',()=>{
 const a=rollInitiative({actorIds:['pc-1','pc-2'],dinosaurTurns:2,
  surpriseActorIds:['pc-2','pc-1'],seed:5});
 assert.deepEqual(a.slice(0,2).map(x=>[x.actorId,x.card]),[['pc-2',1],['pc-1',2]]);
});
test('invalid surprise assignments are rejected before draw',()=>{
 assert.throws(()=>rollInitiative({actorIds:['pc-1'],surpriseActorIds:['pc-x']}),RangeError);
 assert.throws(()=>rollInitiative({actorIds:['pc-1'],surpriseActorIds:['pc-1','pc-1']}),RangeError);
});
test('a live predator ambush gets first card, stronger first strike and blocks prepared dodge',()=>{
 let found=false;
 for(let seed=1;seed<180&&!found;seed++){
  let s=newPartyIncident({seed,roster});s.dinosaurs[0].location='control';
  s=partyStep(s,'wait',{actorId:'pc-1',source:'human'}).state;
  if(!s.combat?.surprise?.ambush)continue;
  assert.equal(activeCombatSlot(s).actorId,'dinosaur-1');
  assert.equal(activeCombatSlot(s).card,1);
  for(const a of s.actors)a.armorLevel=10;
  s.actors.forEach(a=>a.guarding=true);
  const out=partyStep(s,{kind:'predator'},{actorId:s.dinosaurs[0].id,source:'ai'});
  assert(out.accepted,out.reason);
  const action=out.state.actions.at(-1);
  assert.equal(action.kind,'predator_attack');
  assert.equal(action.ambush,true);
  assert.equal(action.attackDice,8);
  assert.equal(action.evaded,false);
  assert.equal(out.state.combat.surprise.consumed,true);
  found=true;
 }
 assert(found,'a legitimate surprise should be reachable with seeded detection');
});
test('a concealed survivor can open combat with a +2-dice ambush attack',()=>{
 let s=setup();s.actors[0].hidden=true;s.dinosaurs[0].location='control';
 s.dinosaurs[0].alert=0;
 const r=partyStep(s,'attack dinosaur',{actorId:'pc-1',source:'human'});
 assert(r.accepted,r.reason);s=r.state;
 assert.equal(s.combat.order[0].actorId,'pc-1');
 assert.equal(s.combat.order[0].card,1);
 assert.equal(s.combat.surprise.consumed,true);
 assert.equal(s.actions.at(-1).ambush,true);
 assert.equal(s.actors[0].hidden,false);
 assert(isPartySave(s));
});
test('holding exchanges the current and a later card without consuming a die, clock or budget',()=>{
 let s=humanLead(),id=activeTurnId(s);
 const second=s.combat.order[1],firstCard=s.combat.order[0].card;
 const oldRng=s.rng,oldBeat=s.beat,oldBudget=structuredClone(s.combat.budgets[id]);
 const result=partyStep(s,'hold '+second.card,{actorId:id,source:'human'});
 assert(result.accepted,result.reason);s=result.state;
 assert.equal(s.beat,oldBeat);assert.equal(s.rng,oldRng);
 assert.deepEqual(s.combat.budgets[id],oldBudget);
 assert.equal(activeCombatSlot(s).actorId,second.actorId);
 assert.equal(activeCombatSlot(s).card,firstCard);
 assert.equal(s.combat.order[1].actorId,id);
 assert.equal(s.combat.order[1].card,second.card);
 assert.equal(s.actions.at(-1).kind,'hold');
 assert.equal(s.combat.holds[0].actorId,id);
 assert(isPartySave(s));
});
test('holding never trades with a past or current card and leaves rejected state byte-identical',()=>{
 const s=humanLead(),json=JSON.stringify(s);
 for(const x of [0,s.combat.order[0].card,11]){
  const r=partyStep(s,'hold '+x,{actorId:activeTurnId(s),source:'human'});
  assert.equal(r.accepted,false);
 }
 assert.equal(JSON.stringify(s),json);
});
test('holding off does not trigger a dying actor death roll until the actor actually takes their turn',()=>{
 let s=humanLead(),who=activeTurnId(s),person=s.actors.find(a=>a.id===who);
 person.criticalInjuries=[{code:61,lethal:true,deadline:'round'}];
 Object.assign(person,enrichInjuries(person,0,5));
 const later=s.combat.order[1].card;
 const r=partyStep(s,'hold '+later,{actorId:who,source:'human'});
 assert(r.accepted,r.reason);
 assert.equal((r.state.medicalChecks||[]).length,0);
 assert.equal(r.state.actors.find(a=>a.id===who).criticalInjuries[0].deathSuccesses,0);
});
test('an injured survivor rolls unpushable stamina once immediately after their own ended turn',()=>{
 let s=humanLead(),who=activeTurnId(s),actor=s.actors.find(a=>a.id===who);
 actor.criticalInjuries=[{code:61,lethal:true,deadline:'round'}];
 Object.assign(actor,enrichInjuries(actor,0,101));
 const r=partyStep(s,'end',{actorId:who,source:'human'});
 assert(r.accepted,r.reason);
 const checks=r.state.medicalChecks||[];
 assert.equal(checks.length,1);
 assert.equal(checks[0].actorId,who);
 assert.equal(checks[0].code,61);
 assert.equal(checks[0].round,1);
 assert.equal(r.state.beat,s.beat+1);
});
test('other combatants acting after a medical turn do not cause a duplicate round-death roll',()=>{
 let s=humanLead(),who=activeTurnId(s);
 let patient=s.actors.find(a=>a.id===who);
 patient.criticalInjuries=[{code:61,lethal:true,deadline:'round'}];
 Object.assign(patient,enrichInjuries(patient,0,16));
 s=partyStep(s,'end',{actorId:who,source:'human'}).state;
 const initial=s.medicalChecks.length;
 // Continue until the end of this round or until combat ends; the wounded
 // actor's next initiative turn is a subsequent round, not an extra clock tick.
 for(let i=0;i<10&&s.combat?.active&&s.combat.round===1;i++){
  const slot=activeCombatSlot(s);
  const result=slot.kind==='dinosaur'?
   partyStep(s,{kind:'predator'},{actorId:s.dinosaurs[0].id,source:'ai'}):
   partyStep(s,'end',{actorId:activeTurnId(s),source:'human'});
  assert(result.accepted,result.reason);
  s=result.state;
 }
 assert.equal(s.medicalChecks.length,initial);
});
test('spectator progression handles the swapped initiative and never grants a second human action',()=>{
 let s=humanLead(),first=activeTurnId(s),target=s.combat.order[1].card;
 s=partyStep(s,'hold '+target,{actorId:first,source:'human'}).state;
 s=setControlMode(s,{mode:'spectator'}).state;
 const out=runAutonomousTurn(s,{singleStep:true});
 assert(out.accepted,out.reason);
 assert.equal(out.state.actions.length,s.actions.length+1);
 assert(isPartySave(out.state));
});
test('the new action parser preserves plain waiting and accepts hold-off card commands',()=>{
 assert.equal(parsePartyAction('hold').kind,'wait');
 assert.deepEqual(parsePartyAction('hold off to card 7'),{kind:'hold',target:'7',push:0});
 assert.deepEqual(parsePartyAction('defer 10'),{kind:'hold',target:'10',push:0});
});
