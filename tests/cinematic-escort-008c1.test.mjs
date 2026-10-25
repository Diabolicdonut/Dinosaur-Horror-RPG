import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {newPartyIncident,partyStep,partyView,isPartySave,upgradePartySave,parsePartyAction} from '../src/party-engine.mjs';
import {PARK_GUIDE,guideState,guideOptions,validParkGuide,endingForGuide} from '../src/cinematic-escort.mjs';
import {setControlMode,setCamera} from '../src/party-director.mjs';
const game=(seed=1993)=>newPartyIncident({seed});
const atLobby=(seed=1993)=>{const s=game(seed);s.actors[0].location='lobby';s.dinosaurs[0].defeated=true;return s;};
const act=(s,command)=>partyStep(s,command,{actorId:s.actors[s.cursor].id,source:'human'});
function findPersuasion(success){
 for(let seed=1;seed<300;seed++){const s=atLobby(seed),r=act(s,'guide persuade');if(r.accepted&&r.result.success===success)return {before:s,after:r.state,result:r.result};}
 throw Error('No seeded Manipulation '+success+' example');
}
function relabel(s,id='pc-1'){s.cursor=s.actors.findIndex(a=>a.id===id);return s;}
test('the NPC is one authored guide in the lobby, not a simulated population or playable character',()=>{
 const s=game();
 assert.equal(PARK_GUIDE.name,'Mara Velez');
 assert.equal(s.parkGuide.location,'lobby');
 assert.equal(s.parkGuide.status,'waiting');
 assert.equal(s.actors.length,3);
 assert.equal(s.dinosaurs.length,1);
 assert.equal(partyView(s).parkGuide,null);
 assert(isPartySave(s));
});
test('a local original guide conversation is free, actor-owned and cannot be farmed',()=>{
 const s=atLobby(),before=JSON.stringify(s),r=act(s,'guide talk');
 assert(r.accepted,r.reason);
 assert.equal(JSON.stringify(s),before);
 assert.equal(r.state.rng,s.rng);assert.equal(r.state.beat,s.beat);
 assert(r.state.parkGuide.spokenBy.includes('pc-1'));
 assert(r.state.events.at(-1).message.includes('Mara Velez'));
 assert.equal(r.state.actions.at(-1).kind,'guide');
 assert(!guideOptions(r.state,r.state.actors[0]).some(o=>o.id==='talk'));
 assert.equal(act(r.state,'guide talk').accepted,false);
});
test('persuading Mara uses the real Evolved Manipulation check and spends an action',()=>{
 const {before,after,result}=findPersuasion(true);
 assert.equal(result.success,true);
 assert.equal(after.parkGuide.status,'following');
 assert.equal(after.parkGuide.escortId,'pc-1');
 assert.equal(after.parkGuide.location,'lobby');
 assert(after.parkGuide.attemptedBy.includes('pc-1'));
 assert.equal(after.actions.at(-1).seed,result.seed);
 assert(Array.isArray(result.base));
 assert.equal(after.beat,before.beat+1);
 assert(isPartySave(after));
});
test('failed persuasion cannot immediately be rerolled, while a second survivor can try',()=>{
 const {before,after,result}=findPersuasion(false);
 assert.equal(result.success,false);
 assert.equal(after.parkGuide.status,'waiting');
 assert.equal(after.parkGuide.location,'lobby');
 relabel(after);
 const beforeAgain=JSON.stringify(after);
 assert.equal(act(after,'guide persuade').accepted,false);
 assert.equal(JSON.stringify(after),beforeAgain);
 after.actors[1].location='lobby';relabel(after,'pc-2');
 const other=act(after,'guide persuade');
 assert(other.accepted,other.reason);assert.equal(other.state.parkGuide.attemptedBy.length,2);
 assert(isPartySave(other.state));
});
test('remote or impossible guide commands reject with no rolls, no movement and no time',()=>{
 const s=game(),snapshot=JSON.stringify(s);
 for(const command of ['guide talk','guide persuade','guide muster','guide shelter','guide handoff','guide escort']){
  const r=act(s,command);
  assert.equal(r.accepted,false,command);assert.strictEqual(r.state,s);
 }
 assert.equal(JSON.stringify(s),snapshot);
});
test('the guide moves only alongside her actual escort on a legal party-engine route',()=>{
 const {after}=findPersuasion(true);
 let s=after;relabel(s);
 let r=act(s,'move control');assert(r.accepted,r.reason);s=r.state;
 assert.equal(s.actors[0].location,'control');assert.equal(s.parkGuide.location,'control');
 assert.equal(s.parkGuide.escortId,'pc-1');
 s.actors[1].location='control';relabel(s,'pc-2');
 r=act(s,'move utility');assert(r.accepted,r.reason);s=r.state;
 assert.equal(s.actors[1].location,'utility');
 assert.equal(s.parkGuide.location,'control'); // Different survivor cannot teleport her
 assert(isPartySave(s));
});
test('a successful escort still obeys the original locked shed door without creating access',()=>{
 const {after}=findPersuasion(true);
 const s=after;relabel(s);const control=act(s,'move control').state;relabel(control);
 const utility=act(control,'move utility').state;relabel(utility);
 const before=JSON.stringify(utility),r=act(utility,'move shed');
 assert.equal(r.accepted,false);
 assert.equal(JSON.stringify(utility),before);
 assert.equal(utility.parkGuide.location,'utility');
});
test('a handoff changes the real escort, and only that survivor subsequently moves Mara',()=>{
 const {after}=findPersuasion(true);
 const s=after;s.actors[1].location='lobby';relabel(s,'pc-2');
 const switched=act(s,'guide handoff');
 assert(switched.accepted,switched.reason);
 assert.equal(switched.state.parkGuide.escortId,'pc-2');
 let t=switched.state;relabel(t,'pc-1');
 t=act(t,'move control').state;assert.equal(t.parkGuide.location,'lobby');
 relabel(t,'pc-2');t=act(t,'move control').state;
 assert.equal(t.parkGuide.location,'control');
 assert(isPartySave(t));
});
test('guide may be sheltered, left in place and later escorted again from the control room',()=>{
 const {after}=findPersuasion(true);
 let s=after;relabel(s);s=act(s,'move control').state;relabel(s);
 s=act(s,'guide shelter').state;
 assert.equal(s.parkGuide.status,'sheltered');
 assert.equal(s.parkGuide.location,'control');assert.equal(s.parkGuide.escortId,null);
 assert.equal(endingForGuide(s).id,'guide-sheltered');
 relabel(s);
 s=act(s,'move utility').state;assert.equal(s.parkGuide.location,'control');
 relabel(s);
 s=act(s,'move control').state;relabel(s);
 s=act(s,'guide escort').state;
 assert.equal(s.parkGuide.status,'following');
 assert.equal(s.parkGuide.escortId,'pc-1');
 assert(isPartySave(s));
});
test('the guide can only be mustered at the actual helipad by her current escort',()=>{
 const {after}=findPersuasion(true);
 let s=after;relabel(s);
 for(const destination of ['control','utility','shed','jungle','helipad']){
  // Staff-card remains a real access requirement for the shed.
  if(destination==='shed'){s.rooms.lobby.items=[];s.actors[0].inventory.push('keycard');}
  relabel(s);
  const r=act(s,'move '+destination);assert(r.accepted,r.reason);s=r.state;
  assert.equal(s.parkGuide.location,destination);
 }
 assert(guideOptions(s,s.actors[0]).some(o=>o.id==='muster'));
 relabel(s);s=act(s,'guide muster').state;
 assert.equal(s.parkGuide.status,'mustered');
 assert.equal(s.parkGuide.location,'helipad');
 assert.equal(s.parkGuide.escortId,null);
 assert.equal(endingForGuide(s).id,'guide-aboard');
 assert(isPartySave(s));
});
test('successful beacon outcome records the factual NPC rescue branch, not a forced side mission',()=>{
 let rescued=null;
 for(let seed=1;seed<300;seed++){
  const s=game(seed);s.actors[0].location='helipad';s.flags.power=true;s.flags.distress=true;
  const r=act(s,'use beacon');
  if(r.accepted&&r.result.success){rescued=r;break;}
 }
 assert(rescued,'find Evolved Comtech beacon success');
 assert.equal(rescued.state.outcome,'rescued');
 assert.equal(rescued.result.guideEnding.id,'guide-unaccounted');
 assert(rescued.state.events.some(e=>e.message.includes('Mara Velez was not at')));
 assert.equal(partyView(rescued.state).rescueEnding.id,'guide-unaccounted');
 assert.equal(rescued.state.actors.length,3);
 assert(isPartySave(rescued.state));
});
test('the guide remains a physical person: wrong location, invalid actor or forged status fails validation',()=>{
 const s=game();
 s.parkGuide.status='following';s.parkGuide.escortId='pc-1';
 assert(!validParkGuide(s)); // PC-1 is in control, guide is in lobby
 s.actors[0].location='lobby';
 assert(validParkGuide(s));assert(isPartySave(s));
 s.parkGuide.escortId='ghost';assert(!isPartySave(s));
 s.parkGuide.escortId='pc-1';s.parkGuide.location='imaginary';
 assert(!isPartySave(s));
 s.parkGuide.location='lobby';s.parkGuide.status='mustered';s.parkGuide.escortId=null;
 assert(!isPartySave(s));
});
test('duplicate, nonexistent or forged guide conversation identities reject',()=>{
 const s=game();
 s.parkGuide.spokenBy=['pc-1'];assert(isPartySave(s));
 s.parkGuide.spokenBy.push('pc-1');assert(!isPartySave(s));
 s.parkGuide.spokenBy.pop();
 s.parkGuide.attemptedBy.push('ghost');assert(!isPartySave(s));
});
test('old party v3 files without NPC fields are accepted without a migration rollback',()=>{
 const s=game();delete s.parkGuide;
 assert(isPartySave(s));assert(isPartySave(upgradePartySave(s)));
 assert.deepEqual(guideState(s),{status:'waiting',location:'lobby',escortId:null,attemptedBy:[],spokenBy:[]});
});
test('focus/spectator camera switching preserves real NPC state with no remote observation',()=>{
 let s=atLobby(),rng=s.rng;
 s=setControlMode(s,{mode:'spectator'}).state;
 s=setCamera(s,{mode:'actor',actorId:'pc-2'}).state;
 assert.equal(s.rng,rng);
 assert.equal(s.parkGuide.location,'lobby');
 assert.equal(partyView(s,{actorId:'pc-2'}).parkGuide,null);
 assert.equal(partyView(s,{actorId:'pc-1'}).parkGuide?.name,'Mara Velez');
 assert(isPartySave(s));
});
test('the browser offers local rescue and epilogue actions without bypassing Evolved rules',async()=>{
 const [html,app,engine]=await Promise.all([
  readFile(new URL('../party.html',import.meta.url),'utf8'),
  readFile(new URL('../src/party-app.mjs',import.meta.url),'utf8'),
  readFile(new URL('../src/party-engine.mjs',import.meta.url),'utf8')
 ]);
 assert(html.includes('party-app.mjs?v=009a'));
 assert(app.includes('party-engine.mjs?v=009a'));
 assert(app.includes('v.parkGuide?.options'));
 assert(app.includes('v.rescueEnding'));
 assert.equal(parsePartyAction('guide persuade').kind,'guide');
 assert.equal(parsePartyAction('push guide persuade').push,1);
 assert(engine.includes("result('manipulation','guide_escort')"));
 assert(engine.includes('validParkGuide(s)'));
});
