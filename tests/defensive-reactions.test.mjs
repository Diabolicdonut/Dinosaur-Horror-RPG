import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {makeParty} from '../src/characters.mjs';
import {newPartyIncident,partyStep,isPartySave,partyView} from '../src/party-engine.mjs';
import {beginCombat,activeCombatSlot} from '../src/combat-turns.mjs';
import {currentOwner,setControlMode,runAutonomousTurn,cameraActorId} from '../src/party-director.mjs';

const roster=makeParty({seed:2050,size:3,careers:['ranger','tactical','medic']});
function dinoFirst({ambush=false,spendQuick=false}={}){
 for(let i=1;i<200;i++){
  const s=newPartyIncident({seed:911,roster});
  s.dinosaurs[0].location='control';
  if(!beginCombat(s,i,ambush?{surpriseActorId:'dinosaur-1',ambush:true}:{}))
   throw Error('Combat did not begin.');
  if(activeCombatSlot(s).kind!=='dinosaur')continue;
  for(const actor of s.actors)actor.armorLevel=9;
  if(spendQuick)for(const budget of Object.values(s.combat.budgets)){
   budget.quickSpent=2;budget.quick=0;budget.full=0;
  }
  return s;
 }
 throw Error('Cannot produce dinosaur-leading initiative');
}
function declare(s){
 return partyStep(s,{kind:'predator'},{actorId:s.dinosaurs[0].id,source:'ai',reactionPrompt:true});
}
test('attacker announces target before dice, damage, action clock or combat turn advance',()=>{
 const s=dinoFirst(),before=JSON.stringify(s),result=declare(s);
 assert(result.accepted,result.reason);
 assert.equal(result.awaitingReaction,true);
 assert.equal(result.state.beat,s.beat);
 assert.equal(result.state.actions.length,s.actions.length);
 assert.deepEqual(result.state.actors.map(a=>a.health),s.actors.map(a=>a.health));
 assert.equal(result.state.combat.index,s.combat.index);
 assert.equal(result.state.combat.pendingReaction.card,activeCombatSlot(s).card);
 assert.equal(result.state.combat.pendingReaction.declaredAtBeat,s.beat);
 assert.notEqual(result.state.rng,s.rng,'target selection consumes seeded random state before declaration');
 assert.equal(JSON.stringify(s),before,'rejected stale world must not be mutated');
 assert(isPartySave(JSON.parse(JSON.stringify(result.state))));
});
test('the named survivor chooses a Close Combat defense before the strike is rolled',()=>{
 let s=declare(dinoFirst()).state;
 const id=s.combat.pendingReaction.victimId,initial=s.combat.budgets[id].quickSpent;
 const result=partyStep(s,{kind:'react',target:'defend'},{actorId:id,source:'human'});
 assert(result.accepted,result.reason);s=result.state;
 assert.equal(s.actions.length,1);
 const action=s.actions.at(-1);
 assert.equal(action.kind,'predator_attack');
 assert.equal(action.target,id);
 assert.equal(action.evaded,true);
 assert.equal(action.defense,'close_combat');
 assert.equal(action.declared,true);
 assert.equal(s.combat.budgets[id].quickSpent,initial+1);
 assert.equal(s.beat,1);
 assert(!s.combat.pendingReaction);
});
test('decline resolves attack but saves the entire quick-action budget',()=>{
 let s=declare(dinoFirst()).state;
 const target=s.combat.pendingReaction.victimId,previous=s.combat.budgets[target].quickSpent;
 const result=partyStep(s,{kind:'react',target:'decline'},{actorId:target,source:'human'});
 assert(result.accepted,result.reason);s=result.state;
 assert.equal(s.actions.at(-1).defense,'none');
 assert.equal(s.actions.at(-1).evaded,false);
 assert.equal(s.combat.budgets[target].quickSpent,previous);
 assert.equal(s.beat,1);
});
test('no unrelated actor, dinosaur, or AI can impersonate a player defense',()=>{
 const s=declare(dinoFirst()).state,target=s.combat.pendingReaction.victimId;
 const other=s.actors.find(a=>a.id!==target).id,original=JSON.stringify(s);
 for(const [id,source,choice] of [
  [other,'human','defend'],[s.dinosaurs[0].id,'ai','decline'],
  [target,'ai','defend'],[target,'human','attack']
 ]){
  const r=partyStep(s,{kind:'react',target:choice},{actorId:id,source});
  assert.equal(r.accepted,false);
  assert.equal(JSON.stringify(s),original);
 }
});
test('a surprise ambush offers no interrupt and retains its protected first attack',()=>{
 const s=dinoFirst({ambush:true}),r=declare(s);
 assert(r.accepted,r.reason);
 assert.equal(r.awaitingReaction,undefined);
 assert.equal(r.state.combat.pendingReaction,undefined);
 assert.equal(r.state.actions.at(-1).ambush,true);
 assert.equal(r.state.actions.at(-1).attackDice,8);
 assert.equal(r.state.actions.at(-1).defense,'none');
});
test('no quick budget means attack resolves without an unavailable reaction prompt',()=>{
 const s=dinoFirst({spendQuick:true}),r=declare(s);
 assert(r.accepted,r.reason);
 assert.equal(r.awaitingReaction,undefined);
 assert.equal(r.state.actions.length,1);
 assert.equal(r.state.combat.pendingReaction,undefined);
});
test('a pending human reaction is owned by the victim rather than the AI predator',()=>{
 const s=declare(dinoFirst()).state;
 assert.equal(currentOwner(s),'human');
 assert.equal(cameraActorId(s),s.combat.pendingReaction.victimId);
 assert.equal(runAutonomousTurn(s,{singleStep:true}).accepted,false);
 const v=partyView(s,{actorId:s.combat.pendingReaction.victimId});
 assert.equal(v.combat.pendingReaction.victimId,s.combat.pendingReaction.victimId);
});
test('switching from Party to Spectator reassigns pending response without replaying target selection',()=>{
 const initial=declare(dinoFirst()).state,target=initial.combat.pendingReaction.victimId;
 const before={rng:initial.rng,beat:initial.beat,index:initial.combat.index};
 let s=setControlMode(initial,{mode:'spectator'}).state;
 assert.equal(currentOwner(s),'ai');
 assert.equal(s.combat.pendingReaction.victimId,target);
 assert.equal(s.rng,before.rng);assert.equal(s.beat,before.beat);
 assert.equal(s.combat.index,before.index);
 const r=runAutonomousTurn(s,{singleStep:true});
 assert(r.accepted,r.reason);
 assert.equal(r.state.actions.length,1);
 assert.equal(r.state.actions.at(-1).target,target);
 assert.equal(r.state.actions.at(-1).defense,'close_combat');
 assert.equal(r.state.combat.pendingReaction,undefined);
});
test('Computer-controlled companions defend on their own behalf in Focus Mode',()=>{
 let s=dinoFirst();
 s=setControlMode(s,{mode:'focus',focusedActorId:'pc-2'}).state;
 const r=runAutonomousTurn(s,{singleStep:true});
 assert(r.accepted,r.reason);
 if(r.awaitingReaction){
  assert.equal(r.state.combat.pendingReaction.victimId,'pc-2');
  assert.equal(currentOwner(r.state),'human');
 }else{
  assert.equal(r.state.actions.length,1);
  assert.equal(r.state.actions.at(-1).defense,'close_combat');
 }
});
test('an AI-only spectator predator strike never pauses to request human permission',()=>{
 const base=setControlMode(dinoFirst(),{mode:'spectator'}).state;
 const out=runAutonomousTurn(base,{singleStep:true});
 assert(out.accepted,out.reason);
 assert.equal(out.awaitingReaction,undefined);
 assert.equal(out.state.actions.length,1);
 assert(!out.state.combat.pendingReaction);
});
test('a saved mid-attack reaction survives serialization and remains deterministic across reload',()=>{
 const original=declare(dinoFirst()).state;
 const loaded=JSON.parse(JSON.stringify(original));
 assert(isPartySave(loaded));
 assert.deepEqual(loaded,original);
 const doReaction=state=>partyStep(state,{kind:'react',target:'defend'},
  {actorId:state.combat.pendingReaction.victimId,source:'human'});
 const a=doReaction(original),b=doReaction(loaded);
 assert.equal(a.accepted,true);assert.deepEqual(a,b);
});
test('tampered reaction save cannot attach pending defense to an invalid actor or old card',()=>{
 const original=declare(dinoFirst()).state;
 const bad=structuredClone(original);bad.combat.pendingReaction.victimId='pc-99';
 const card=structuredClone(original);card.combat.pendingReaction.card=10+original.combat.pendingReaction.card;
 assert.equal(isPartySave(bad),false);assert.equal(isPartySave(card),false);
});
test('browser has distinct pre-roll defend/decline options and cache revision 007-I',async()=>{
 const html=await readFile(new URL('../party.html',import.meta.url),'utf8');
 const app=await readFile(new URL('../src/party-app.mjs',import.meta.url),'utf8');
 for(const id of ['reaction-panel','react-defend','react-decline','reaction-target'])
  assert(html.includes('id="'+id+'"'),id);
 assert(html.includes('party-app.mjs?v=009d2'));
 assert(app.includes('reactToAttack'));
 assert(app.includes('pendingReaction'));
 assert(app.includes("source:'human'"));
});
