import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {makeParty} from '../src/characters.mjs';
import {newGame,isValidSave} from '../src/engine.mjs';
import {PARTY_SAVE_KIND, PARTY_ENGINE_VERSION, newPartyIncident,partyStep,partyView,isPartySave,parsePartyAction} from '../src/party-engine.mjs';
const PARTY=makeParty({seed:722,size:3,careers:['ranger','maintenance','scientist']});
const setup=()=>newPartyIncident({seed:9000,roster:PARTY});
const act=(s,text)=>partyStep(s,text,{actorId:s.actors[s.cursor].id});
function doAction(s,command){
 const r=act(s,command);
 assert.equal(r.accepted,true,command+': '+r.reason);
 return r.state;
}
test('multi-actor launch uses exact validated identities and independent sheets',()=>{
 const s=setup();
 assert.equal(s.kind,PARTY_SAVE_KIND);
 assert.equal(s.version,PARTY_ENGINE_VERSION);
 assert.deepEqual(s.actors.map(a=>a.name),PARTY.map(a=>a.name));
 assert.deepEqual(s.actors.map(a=>a.location),['control','control','control']);
 assert.equal(s.actors[1].career,'maintenance');
 assert.equal(s.actors[1].health,s.actors[1].healthMax);
 assert.equal(isPartySave(s),true);
 assert.deepEqual(s.startingRoster,PARTY);
 assert.equal(isValidSave(s),false);
});
test('invalid starting-roster substitutions fail party save validation',()=>{
 const s=setup();
 s.startingRoster[0].attributes.wits=99;
 assert.equal(isPartySave(s),false);
});
test('party launch rejects invalid skill budgets and duplicate actor IDs',()=>{
 const invalid=structuredClone(PARTY);invalid[0].skills.mobility=9;
 assert.throws(()=>newPartyIncident({seed:1,roster:invalid}),RangeError);
 assert.throws(()=>newPartyIncident({seed:1,roster:[PARTY[0],PARTY[0]]}),RangeError);
});
test('one action per actor in fixed order, one shared beat, round increments only on wrap',()=>{
 let s=setup();
 assert.equal(s.round,1);
 for(let i=0;i<7;i++){
  const before=s.beat;
  s=doAction(s,'wait');
  assert.equal(s.beat,before+1);
  assert.equal(s.cursor,(i+1)%3);
  assert.equal(s.round,Math.floor((i+1)/3)+1);
  assert.equal(s.actions[i].actorId,PARTY[i%3].id);
 }
});
test('invalid and free-look actions cannot spend a turn, RNG or alter the world',()=>{
 const s=setup(),original=JSON.stringify(s);
 for(const command of ['teleport helipad','move nonexistent','take keycard','use radio','look']){
  const r=act(s,command);
  assert.equal(r.accepted,false);
  assert.strictEqual(r.state,s);
  assert.equal(JSON.stringify(s),original);
 }
});
test('one actor cannot impersonate another actor scheduled to act',()=>{
 const s=setup(),before=JSON.stringify(s);
 const denied=partyStep(s,'move lobby',{actorId:s.actors[1].id});
 assert.equal(denied.accepted,false);
 assert.equal(JSON.stringify(s),before);
});
test('only scheduled actor moves, all others stay at own locations',()=>{
 let s=setup();
 s=doAction(s,'move lobby');
 assert.equal(s.actors[0].location,'lobby');
 assert.equal(s.actors[1].location,'control');
 s=doAction(s,'move utility');
 assert.equal(s.actors[1].location,'utility');
 assert.equal(s.actors[0].location,'lobby');
 assert.equal(s.actors[2].location,'control');
});
test('keycard is unique world property; only actual carrier can unlock the shed',()=>{
 let s=setup();
 s=doAction(s,'move lobby');
 s=doAction(s,'move utility');
 s=doAction(s,'wait');
 s=doAction(s,'take keycard');
 assert.equal(s.actors[0].inventory.includes('keycard'),true);
 assert.equal(s.rooms.lobby.items.includes('keycard'),false);
 const before=JSON.stringify(s);
 const wrong=act(s,'move shed');
 assert.equal(wrong.accepted,false);
 assert.equal(JSON.stringify(s),before);
 s=doAction(s,'move control');
 s=doAction(s,'wait');
 assert.equal(s.actors[0].inventory.includes('keycard'),true);
});
test('room conditions prohibit premature activation and preserve flags',()=>{
 const s=setup();
 const fail=act(s,'use radio');
 assert.equal(fail.accepted,false);
 assert.equal(s.flags.distress,false);
 assert.equal(s.beat,0);
});
test('investigation uses acting character own observation and persists per-actor facts',()=>{
 let s=setup();
 s=doAction(s,'investigate consoles');
 assert.equal(s.actions.length,1);
 assert.equal(s.actions[0].actorId,'pc-1');
 assert(s.actions[0].seed!==undefined);
 assert(Array.isArray(s.actions[0].base));
 assert.equal(s.actors[1].observed.length,0);
});
test('seed plus initial roster and accepted commands replay exactly, even through dinosaur behavior',()=>{
 const script=['move lobby','move utility','wait','take keycard','wait','investigate consoles','wait','wait','hide','wait','wait','wait'];
 const play=()=>script.reduce((s,cmd)=>{
  const response=act(s,cmd);
  assert.equal(response.accepted,true,cmd+' '+response.reason);
  return response.state;
 },setup());
 assert.deepEqual(play(),play());
 assert.deepEqual(JSON.parse(JSON.stringify(play())),play());
});
test('only nearby predator can be seen, while underlying dinosaur location persists',()=>{
 const s=setup(),v=partyView(s);
 assert.deepEqual(v.visibleDinosaurs,[]);
 assert.equal(s.dinosaurs[0].location,'paddock');
});
test('separate legacy game and party game persist without save-schema collision',()=>{
 const old=newGame(1993);
 let party=setup();
 party=doAction(party,'wait');
 assert.equal(isValidSave(old),true);
 assert.equal(isValidSave(party),false);
 assert.equal(isPartySave(old),false);
 assert.equal(isPartySave(party),true);
 assert.equal(old.turn,0);
});
test('no manual action execution when scenario is completed',()=>{
 const s=setup();s.outcome='rescued';
 const out=act(s,'wait');
 assert.equal(out.accepted,false);
});
test('parse commands and supported verbs into deterministic typed intents',()=>{
 assert.deepEqual(parsePartyAction('push repair generator'),{kind:'use',target:'generator',push:1});
 assert.deepEqual(parsePartyAction('go to utility'),{kind:'move',target:'utility',push:0});
 assert.deepEqual(parsePartyAction('give keycard to pc-2'),{kind:'give',target:'keycard',recipientId:'pc-2',push:0});
 assert.deepEqual(parsePartyAction('take cover'),{kind:'hide',target:'',push:0});
});

test('two survivors can hand over the one physical keycard only when colocated',()=>{
 let s=setup();
 for(const command of ['move lobby','move lobby','wait','take keycard','wait','wait','give keycard to pc-2'])
  s=doAction(s,command);
 assert(!s.actors[0].inventory.includes('keycard'));
 assert(s.actors[1].inventory.includes('keycard'));
 assert(!s.rooms.lobby.items.includes('keycard'));
 assert.equal(s.actions.at(-1).recipientId,'pc-2');
});
test('personal viewpoint does not reveal another survivor investigation result',()=>{
 let s=doAction(setup(),'investigate consoles');
 const ranger=partyView(s,{actorId:'pc-1'});
 const maintenance=partyView(s,{actorId:'pc-2'});
 assert(ranger.events.some(e=>e.message.includes('consoles')));
 assert(!maintenance.events.some(e=>e.message.includes('consoles')));
});
test('refuse unsupported objective features instead of claiming a world change',()=>{
 const s=setup();
 const result=act(s,'use terminal');
 assert.equal(result.accepted,false);
 assert.equal(s.beat,0);
});
test('multi-character incident browser and validated roster transfer have isolated storage and syntax',async()=>{
 const page=await readFile(new URL('../party.html',import.meta.url),'utf8');
 const app=await readFile(new URL('../src/party-app.mjs',import.meta.url),'utf8');
 const lab=await readFile(new URL('../src/characters-app.mjs',import.meta.url),'utf8');
 for(const id of ['party-roster','beat','round','active','party-command','party-command-form',
   'party-events','world-buttons','travel-buttons','save-incident','load-incident','export-incident'])
  assert(page.includes('id="'+id+'"'),id);
 assert(page.includes('./src/party-app.mjs?v=007f'));
 assert(app.includes("dinosaur-party-incident-007c"));
 assert(app.includes('isPartySave'));
 assert(app.includes("partyStep("));
 assert(lab.includes('dinosaur-party-launch-007c'));
 assert(lab.includes('validateParty(party)'));
 assert(app.includes('sessionStorage.removeItem(LAUNCH)'));
 assert(app.includes('state.startingRoster'));
 assert(app.includes('newPartyIncident(setup)'));
 assert(page.includes('INITIATIVE & COMBAT TURNS'));
 const characters=await readFile(new URL('../characters.html',import.meta.url),'utf8');
 assert(characters.includes('id="start-party"'));

 assert(!app.includes('dinosaur-rpg-save'),'must not overwrite legacy saved games');
 for(const file of ['../src/party-engine.mjs','../src/party-app.mjs']){
  const result=spawnSync(process.execPath,['--check',new URL(file,import.meta.url).pathname],{encoding:'utf8'});
  assert.equal(result.status,0,file+' '+result.stderr);
 }
});
