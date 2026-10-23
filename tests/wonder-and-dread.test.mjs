import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SCENARIO} from '../src/scenario.mjs';
import {makeParty} from '../src/characters.mjs';
import {newPartyIncident,partyView,partyStep,isPartySave,parsePartyAction} from '../src/party-engine.mjs';

const party=makeParty({seed:2040,size:3,careers:['scientist','ranger','medic']});
const game=()=>newPartyIncident({seed:1993,roster:party});
test('authored wonder sites include ecology, history and distant living animals',()=>{
 const locations=['control','lobby','jungle','helipad'];
 assert(locations.every(id=>SCENARIO.rooms[id].wonder?.description?.length>80));
 assert.equal(SCENARIO.rooms.helipad.wonder.kind,'distant-wildlife');
 assert.equal(SCENARIO.rooms.helipad.wonder.ambientOnly,true);
 assert.equal(SCENARIO.initialDinosaur.kind,'Velociraptor');
});
test('free reflective observation leaves clock, seeded RNG, predator and mission unchanged',()=>{
 const s=game(),before=JSON.stringify(s),v=partyView(s,{actorId:'pc-1'});
 assert.equal(v.wonder.discovered,false);
 assert(!JSON.stringify(v).includes(SCENARIO.rooms.control.wonder.description));
 const r=partyStep(s,'take in the view',{actorId:'pc-1',source:'human'});
 assert(r.accepted,r.reason);const n=r.state;
 assert.equal(n.beat,s.beat);assert.deepEqual(n.clock,s.clock);
 assert.equal(n.rng,s.rng);
 assert.deepEqual(n.dinosaurs,s.dinosaurs);
 assert.deepEqual(n.flags,s.flags);
 assert.deepEqual(n.rooms,s.rooms);
 assert.equal(n.actions.at(-1).kind,'wonder');
 assert.equal(n.events.at(-1).category,'wonder');
 assert.equal(JSON.stringify(s),before);
});
test('wonder discovery is unique, durable and personal to the acting survivor',()=>{
 let s=game(),r=partyStep(s,{kind:'wonder',target:'rainforest-horizon'},{actorId:'pc-1'});
 assert(r.accepted,r.reason);s=r.state;
 assert.equal(s.actors[0].wonderJournal.length,1);
 assert.equal(s.actors[1].wonderJournal.length,0);
 assert.equal(partyView(s,{actorId:'pc-1'}).wonder.discovered,true);
 assert.equal(partyView(s,{actorId:'pc-2'}).wonder.discovered,false);
 assert(!partyView(s,{actorId:'pc-2'}).events.some(e=>e.category==='wonder'));
 const prior=JSON.stringify(s);
 assert.equal(partyStep(s,'wonder',{actorId:'pc-1'}).accepted,false);
 assert.equal(JSON.stringify(s),prior);
 assert(isPartySave(JSON.parse(JSON.stringify(s))));
});
test('wonders are tied to physical locations, not arbitrary narrated animal positions',()=>{
 const s=game(),before=JSON.stringify(s);
 const result=partyStep(s,{kind:'wonder',target:'herbivores-at-distance'},{actorId:'pc-1'});
 assert.equal(result.accepted,false);
 assert.equal(JSON.stringify(s),before);
 assert(!s.dinosaurs.some(x=>x.kind==='Brachiosaurus'));
});
test('wonder is unavailable during actual combat and cannot be used to avoid a turn',()=>{
 const s=game();
 s.combat={active:true,round:1,index:0,room:'control',cardDrawSeed:1,
  order:[{actorId:'pc-1',card:1,kind:'human'},{actorId:'dinosaur-1',card:2,kind:'dinosaur'}],
  budgets:{'pc-1':{full:1,quick:2,quickSpent:0,fullSpent:0}},
  roundHistory:[{round:1,seed:1,order:[{actorId:'pc-1',card:1,kind:'human'},{actorId:'dinosaur-1',card:2,kind:'dinosaur'}]}]};
 s.dinosaurs[0].location='control';
 assert(isPartySave(s));
 const r=partyStep(s,'wonder',{actorId:'pc-1'});
 assert.equal(r.accepted,false);
});
test('a broken, dead or panicking actor cannot use a free scenery action to bypass conditions',()=>{
 for(const mutation of [{broken:true},{dead:true},{pendingSkip:true}]){
  const s=game();Object.assign(s.actors[0],mutation);
  const prior=JSON.stringify(s);
  assert.equal(partyStep(s,'wonder',{actorId:'pc-1'}).accepted,false);
  assert.equal(JSON.stringify(s),prior);
 }
});
test('earlier party version-three saves without wonderJournal remain valid',()=>{
 const s=game();
 for(const a of s.actors)delete a.wonderJournal;
 assert(isPartySave(s));
 const r=partyStep(s,'wonder',{actorId:'pc-1'});
 assert(r.accepted,r.reason);assert.equal(r.state.actors[0].wonderJournal.length,1);
});
test('natural commands explicitly support awe, separate from investigative risk checks',()=>{
 for(const command of ['wonder','take in the view','admire the rainforest-horizon','contemplate the rainforest-horizon']){
  assert.equal(parsePartyAction(command).kind,'wonder');
 }
 assert.equal(parsePartyAction('investigate the consoles').kind,'investigate');
});
test('wonder can be discovered at the helipad without creating a simulated encounter',()=>{
 const s=game();s.actors[0].location='helipad';s.actors[0].visitedRooms.push('helipad');
 const r=partyStep(s,{kind:'wonder',target:'herbivores-at-distance'},{actorId:'pc-1'});
 assert(r.accepted,r.reason);
 assert(r.state.actors[0].wonderJournal[0].description.includes('long-necked herbivores'));
 assert.deepEqual(r.state.dinosaurs,s.dinosaurs);
 assert.equal(r.state.combat,null);
});
test('browser scene offers voluntary wonder action and no forced reward or stress adjustment',async()=>{
 const page=await readFile(new URL('../src/party-app.mjs',import.meta.url),'utf8');
 assert(page.includes('Take in the view'));
 assert(page.includes('v.wonderJournal.length'));
 const engine=await readFile(new URL('../src/party-engine.mjs',import.meta.url),'utf8');
 assert(engine.includes("kind:'wonder'"));
 assert(!engine.includes('wonderJournal.length*100'));
});
