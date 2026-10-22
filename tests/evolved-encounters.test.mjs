import test from 'node:test';
import assert from 'node:assert/strict';
import {makeParty} from '../src/characters.mjs';
import {STRETCH_MINUTES,ROUND_SECONDS,DINO_SPECIES,rollInitiative,
 createActionBudget,spendActionBudget,rollDicePool,detectCreature,rollCriticalInjury,
 applyCreatureAttack,applyMedicalAid,panicOnContact} from '../src/evolved-encounters.mjs';
const roster=makeParty({seed:91,size:3,careers:['ranger','medic','maintenance']});
test('Evolved time scales represented separately',()=>{
 assert.equal(STRETCH_MINUTES,10);assert.equal(ROUND_SECONDS,10);
 assert.equal(DINO_SPECIES.velociraptor.speed,2);
});
test('initiative draws unique 1–10 cards, including two animal turns, seed-repeatable',()=>{
 const a=rollInitiative({actorIds:roster.map(x=>x.id),dinosaurTurns:2,seed:12});
 const b=rollInitiative({actorIds:roster.map(x=>x.id),dinosaurTurns:2,seed:12});
 assert.deepEqual(a,b);assert.equal(a.length,5);
 assert.equal(new Set(a.map(x=>x.card)).size,5);
 assert.equal(a.filter(x=>x.kind==='dinosaur').length,2);
 assert(a.every(x=>x.card>=1&&x.card<=10));
 assert.throws(()=>rollInitiative({actorIds:Array(9).fill(0).map((_,i)=>'pc-'+i),dinosaurTurns:2}),RangeError);
});
test('combat budget permits full+quick or two quick but never third quick or second full',()=>{
 let b=createActionBudget();
 b=spendActionBudget(b,'quick').budget;
 b=spendActionBudget(b,'full').budget;
 assert.equal(spendActionBudget(b,'quick').accepted,false);
 assert.equal(spendActionBudget(b,'full').accepted,false);
 let c=createActionBudget();
 c=spendActionBudget(c,'quick').budget;
 c=spendActionBudget(c,'quick').budget;
 assert.equal(spendActionBudget(c,'full').accepted,false);
 assert.equal(spendActionBudget(c,'quick').accepted,false);
});
test('passive opposed observation is reproducible and guard bonus only applies to human pool',()=>{
 const a=detectCreature(roster[0],{seed:18});
 assert.deepEqual(a,detectCreature(roster[0],{seed:18}));
 const b=detectCreature(roster[0],{seed:18,guarding:true});
 assert.equal(b.human.baseCount,a.human.baseCount+2);
 assert.deepEqual(b.creature,a.creature);
 assert(a.human.responseEvents.length===0);
});
test('open zone cannot be used for hiding, even if person spots dinosaur first',()=>{
 const a=detectCreature(roster[0],{seed:10,cluttered:false});
 assert.equal(a.canHide,false);
 assert.notEqual(a.outcome,'human_sees_first');
});
test('attack dice pools preserve original faces and all successes are sixes',()=>{
 const r=rollDicePool(15,25);
 assert(r.faces.every(x=>x>=1&&x<=6));
 assert.equal(r.successes,r.faces.filter(x=>x===6).length);
 assert.deepEqual(r,rollDicePool(15,25));
});
test('armor reduces actual damage, misses deal none and input character is not mutated',()=>{
 const original={...roster[0],health:roster[0].healthMax};
 const before=structuredClone(original);
 for(let seed=1;seed<75;seed++){
  const r=applyCreatureAttack(original,{seed,armor:2});
  assert.equal(r.damage,Math.max(0,r.raw-2));
  assert.equal(r.after.health,Math.max(0,original.health-r.damage));
  if(r.remaining===0)assert.equal(r.damage,0);
 }
 assert.deepEqual(original,before);
});
test('dodge uses actual trained skill dice, can negate otherwise successful hits',()=>{
 const actor={...roster[0],health:roster[0].healthMax};
 let found=false;
 for(let seed=1;seed<400;seed++){
  const plain=applyCreatureAttack(actor,{seed});
  const dodged=applyCreatureAttack(actor,{seed,dodge:true});
  if(dodged.evade.successes>0&&dodged.damage<plain.damage){found=true;break;}
 }
 assert(found);
});
test('critical D66 roll when broken and instant death at double health in one hit',()=>{
 const c={...roster[0],health:1,healthMax:roster[0].healthMax};
 let broken=null;
 for(let seed=1;seed<200;seed++){
  const r=applyCreatureAttack(c,{seed});
  if(r.broken){broken=r;break;}
 }
 assert(broken?.critical);assert.equal(broken.after.health,0);
 assert(broken.after.broken);
 const lethal=applyCreatureAttack(c,{seed:15,attackerDice:18,baseDamage:12});
 assert.equal(lethal.dead,true);
 assert.equal(lethal.after.health,0);
});
test('injury die reproducible with valid D66 faces; prevents duplicate serious injury',()=>{
 const first=rollCriticalInjury(9);
 assert.deepEqual(first,rollCriticalInjury(9));
 assert([1,2,3,4,5,6].includes(Math.floor(first.code/10)));
 assert([1,2,3,4,5,6].includes(first.code%10));
 if(first.code>=14)assert.notEqual(rollCriticalInjury(9,[first]).code,first.code);
});
test('first aid requires eligible broken patient and actual skill success',()=>{
 const medic=roster[1];
 const patient={...roster[0],health:0,broken:true,dead:false};
 const r=applyMedicalAid(medic,patient,{seed:3});
 assert.equal(r.accepted,true);
 assert.deepEqual(r,applyMedicalAid(medic,patient,{seed:3}));
 assert.equal(patient.health,0);
 if(r.success)assert(r.patient.health>=1);
 assert.equal(applyMedicalAid(medic,{...patient,broken:false}).accepted,false);
 assert.equal(applyMedicalAid(medic,{...patient,dead:true}).accepted,false);
});
test('contact panic rolls depend on Resolve and apply dropped items/skip turns',()=>{
 const actor={...roster[0],stress:8,inventory:['flashlight','keycard']};
 const r=panicOnContact(actor,{seed:7});
 assert.equal(r.roll.value,r.roll.d6+8-actor.resolve);
 assert.deepEqual(r,panicOnContact(actor,{seed:7}));
 assert.equal(actor.inventory.length,2);
 let dropped=false;
 for(let seed=1;seed<120;seed++){
  const e=panicOnContact({...actor,stress:actor.resolve+2},{seed});
  if(e.event.dropItem){assert(e.event.dropped);assert.equal(e.after.inventory.length,1);dropped=true;break;}
 }
 assert(dropped);
});
