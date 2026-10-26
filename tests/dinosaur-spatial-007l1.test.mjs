import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {makeParty} from '../src/characters.mjs';
import {newPartyIncident,partyStep,partyView,isPartySave,parsePartyAction,upgradePartySave} from '../src/party-engine.mjs';
import {visualLine,visualZones,localCover,physicalCover,speciesSensoryProfile,sensoryBehavior} from '../src/dinosaur-visibility.mjs';
import {visibleLampZone,hearNoise,creatureRoute} from '../src/dinosaur-pursuit.mjs';
import {actorObservation,chooseCompanionAction,setControlMode,setCamera,runAutonomousTurn} from '../src/party-director.mjs';
const roster=makeParty({seed:840,size:3,careers:['ranger','maintenance','medic']});
const game=(seed=1993)=>newPartyIncident({seed,roster});
const act=(s,command)=>partyStep(s,command,{actorId:s.actors[s.cursor].id,source:'human'});

test('007-L1 sightlines are authored, directional and cannot cross unbreached reinforced maintenance door',()=>{
 assert(visualLine('control','lobby'));assert(visualLine('lobby','control'));
 assert(visualLine('shed','jungle'));assert(visualLine('jungle','shed'));
 assert(!visualLine('utility','shed'));assert(!visualLine('shed','utility'));
 assert(visualLine('utility','shed',{shedDoorBreached:true}));
 assert(!visualLine('jungle','paddock'));
 assert(!visualLine('paddock','jungle'));
 assert.equal(visualLine('control','helipad'),false);
 assert.equal(visualLine('bogus','control'),false);
 assert.deepEqual(visualZones('paddock'),['paddock']);
});
test('007-L1 physical cover is a validated named feature, not a fabricated hiding spot',()=>{
 const covers=localCover('control');
 assert(covers.some(c=>c.id==='rolling_cabinet'));
 assert.equal(physicalCover('control','rolling_cabinet').id,'rolling_cabinet');
 assert.equal(physicalCover('control','paperweight'),null);
 assert.equal(physicalCover('paddock','rolling_cabinet'),null);
 assert.equal(physicalCover('unknown','rolling_cabinet'),null);
});
test('species framework explicitly rejects unmodeled species and derives actual original raptor stats',()=>{
 const profile=speciesSensoryProfile({kind:'Velociraptor'});
 assert.equal(profile.key,'velociraptor');
 assert.equal(profile.observation,5);
 assert.equal(profile.hearingBonus,0);
 assert.equal(profile.searchStretches,1);
 assert.equal(speciesSensoryProfile({kind:'Tyrannosaurus'}),null);
});
test('behavior policy distinguishes patrol, stalking, investigation, search and engagement',()=>{
 const d={kind:'Velociraptor',location:'jungle',alert:0,lastHeard:null};
 assert.equal(sensoryBehavior(d),'patrol');
 d.alert=2;d.lastHeard='shed';
 assert.equal(sensoryBehavior(d),'stalk');
 assert.equal(sensoryBehavior(d,{sourceAudible:true}),'investigate');
 d.search={zone:'jungle'};assert.equal(sensoryBehavior(d),'search');
 d.search=null;d.lastHeard='jungle';
 assert.equal(sensoryBehavior(d,{sourceVisible:true}),'engage');
 d.defeated=true;assert.equal(sensoryBehavior(d),'inactive');
});
test('sound can travel around a visual obstruction without magically granting vision',()=>{
 assert.equal(hearNoise('jungle','paddock',1).heard,true);
 assert.equal(visualLine('jungle','paddock'),false);
 assert.deepEqual(creatureRoute('paddock','jungle'),['paddock','jungle']);
});
test('007-K light detection remains valid at clear short-range doorways only',()=>{
 const actor={location:'shed',inventory:['flashlight'],light:{on:true,charge:2}};
 assert.equal(visibleLampZone('jungle',[actor]),'shed');
 assert.equal(visibleLampZone('utility',[actor]),null);
 assert.equal(visibleLampZone('paddock',[actor]),null);
 assert.equal(visibleLampZone('utility',[actor],{shedDoorBreached:true}),'shed');
});
test('hide-behind parser retains explicit authored cover name',()=>{
 assert.deepEqual(parsePartyAction('hide behind rolling cabinet'),{kind:'hide',target:'rolling cabinet',push:0});
 assert.deepEqual(parsePartyAction('take cover behind the heavy rolling cabinet'),{kind:'hide',target:'the heavy rolling cabinet',push:0});
 assert.equal(parsePartyAction('hide').target,'');
});
test('invalid physical cover action is rejected without RNG or time cost',()=>{
 const s=game(),r=act(s,'hide behind invisible bunker');
 assert(!r.accepted);assert.strictEqual(r.state,s);
 assert.equal(s.beat,0);assert.equal(s.actions.length,0);
});
test('successful and failed cover checks both use the actual seeded survivor Mobility roll',()=>{
 let win=false,lose=false;
 for(let seed=1;seed<150;seed++){
  const s=game(seed),r=act(s,'hide behind rolling cabinet');
  assert(r.accepted,r.reason);
  const a=r.state.actors[0],last=r.state.actions.at(-1);
  assert.equal(last.target,'rolling_cabinet');
  if(last.success){
   win=true;assert(a.hidden);assert.equal(a.coverId,'rolling_cabinet');
  }else{
   lose=true;assert(!a.hidden);assert.equal(a.coverId,null);
  }
  if(win&&lose)break;
 }
 assert(win&&lose);
});
test('moving to another room cannot carry a fixed physical cabinet across the map',()=>{
 const s=game(6);s.actors[0].coverId='rolling_cabinet';s.actors[0].hidden=true;
 const r=act(s,'move utility');
 assert(r.accepted,r.reason);
 assert.equal(r.state.actors[0].coverId,null);
 assert.equal(r.state.actors[0].hidden,false);
 assert(isPartySave(r.state));
});
test('invalid forged cover in a save is rejected; legacy missing cover remains valid',()=>{
 const s=game();
 s.actors[0].coverId='nonexistent';
 assert.equal(isPartySave(s),false);
 s.actors[0].coverId=null;assert(isPartySave(s));
 delete s.actors[0].coverId;delete s.dinosaurs[0].behavior;
 assert(isPartySave(s));
 assert(isPartySave(upgradePartySave(s)));
});
test('visibility from a lit actor is actor-specific, adjacent only and never a remote coordinate leak',()=>{
 const s=game(77);s.actors[0].location='shed';s.dinosaurs[0].location='jungle';
 s.actors[0].light.on=true;
 assert.deepEqual(partyView(s,{actorId:'pc-1'}).distantSightings,[{kind:'Velociraptor'}]);
 const remote=partyView(s,{actorId:'pc-2'});
 assert.deepEqual(remote.distantSightings,[]);
 assert(!('location' in partyView(s,{actorId:'pc-1'}).distantSightings[0]));
 assert(!('lastHeard' in remote));
 s.actors[0].light.on=false;
 assert.deepEqual(partyView(s,{actorId:'pc-1'}).distantSightings,[]);
});
test('blocked visual routes cannot disclose animal even if both zones are topological neighbors',()=>{
 const s=game();s.actors[0].location='jungle';
 s.actors[0].light.on=true;s.dinosaurs[0].location='paddock';
 assert.deepEqual(partyView(s,{actorId:'pc-1'}).distantSightings,[]);
});
test('companion sees nearby light-assisted threat but not its private hidden world position',()=>{
 const s=game();s.actors[0].location='shed';s.actors[0].light.on=true;
 s.dinosaurs[0].location='jungle';
 const observed=actorObservation(s,'pc-1');
 assert.deepEqual(observed.distantThreats,['Velociraptor']);
 assert(!('lastHeard' in observed));
 assert(!('search' in observed));
 assert.equal(chooseCompanionAction(observed).kind,'hide');
 const other=actorObservation(s,'pc-2');
 assert.deepEqual(other.distantThreats,[]);
});
test('mode and camera switches do not advance RNG, alter the cover or create actions',()=>{
 let s=game();s.actors[0].coverId='rolling_cabinet';s.actors[0].hidden=true;
 const before=s.rng;
 s=setControlMode(s,{mode:'spectator'}).state;
 s=setCamera(s,{mode:'actor',actorId:'pc-2'}).state;
 assert.equal(s.rng,before);assert.equal(s.beat,0);
 assert.equal(s.actors[0].coverId,'rolling_cabinet');
 assert.equal(s.actions.length,0);
});
test('stalking and search decisions replay exactly through JSON save/load',()=>{
 let s=game(90);s.dinosaurs[0].lastHeard='jungle';s.dinosaurs[0].alert=4;
 const other=JSON.parse(JSON.stringify(s));
 for(let i=0;i<6;i++){
  const left=act(s,'wait'),right=act(other,'wait');
  assert.deepEqual(left,right);
  s=left.state;Object.assign(other,right.state);
 }
 assert(isPartySave(s));
 assert(['stalk','investigate','search','engage','patrol'].includes(s.dinosaurs[0].behavior));
});
test('007-L1 UI has specific hiding choices and matching browser cache revision',async()=>{
 const html=await readFile(new URL('../party.html',import.meta.url),'utf8');
 const app=await readFile(new URL('../src/party-app.mjs',import.meta.url),'utf8');
 assert(html.includes('party-app.mjs?v=009b2b2c2c2b'));
 assert(app.includes('Hide behind '));
 assert(app.includes('distantSightings'));
});
