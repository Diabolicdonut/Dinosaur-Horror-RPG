// DHR-002 — programmatic *contracts*, not screenshots or browser-test results.
// The actual graphical acceptance grid is recorded separately, by humans or
// browser-automation runs, in docs/qa/DHR-002-EVIDENCE-TEMPLATE.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {makeParty} from '../src/characters.mjs';
import {listAdventureDefinitions} from '../src/adventure-catalog.mjs';
import {listHubScenarios,resolveHubLaunchScenario} from '../src/adventure-hub-catalog.mjs';
import {newPartyIncident,isPartySave,partyStep,partyView} from '../src/party-engine.mjs';
import {CONTROL_MODES,setControlMode,setCamera,runAutonomousTurn} from '../src/party-director.mjs';
import {SEED_INCIDENT_FIXTURES} from './fixtures/dhr-006-seed-incident-fixtures.mjs';

const at=path=>new URL(path,import.meta.url);
const matrix=JSON.parse(await readFile(at('../qa/dhr-002-matrix.json'),'utf8'));
const html=Object.fromEntries(await Promise.all(
 ['index.html','party.html','characters.html'].map(async path=>
  [path,await readFile(at('../'+path),'utf8')])
));
const partyApp=await readFile(at('../src/party-app.mjs'),'utf8');
const soloApp=await readFile(at('../src/app.mjs'),'utf8');
const characterApp=await readFile(at('../src/characters-app.mjs'),'utf8');
const stripControl=save=>{
 const {control,controlHistory,...physical}=structuredClone(save);
 return physical;
};
const roster=makeParty({seed:710,size:3,careers:['ranger','medic','scientist']});
const runIds=()=>matrix.scenarios.flatMap(s=>matrix.modes.flatMap(m=>
 matrix.viewports.map(v=>[s.id,m.id,v.id].join('/'))));

test('DHR-002: manifest has a 36-case full scenario × mode × responsive cross-product',()=>{
 assert.equal(matrix.schemaVersion,1);
 assert.equal(matrix.issue,'DHR-002');
 assert.deepEqual(matrix.scenarios.map(x=>x.id),listAdventureDefinitions().map(x=>x.id),
  'actual validated adventure catalog must match the graphical test scenarios');
 assert.deepEqual(matrix.modes.map(x=>x.id),CONTROL_MODES);
 assert.deepEqual(matrix.viewports.map(x=>[x.width,x.height]),
  [[1440,900],[820,1180],[390,844],[320,568]]);
 const cases=runIds();
 assert.equal(cases.length,36);
 assert.equal(new Set(cases).size,36);
 for(const scenario of matrix.scenarios){
  assert.equal(scenario.entry,'party.html');
  assert(Number.isInteger(scenario.seed));
  assert(typeof scenario.historicalFixture==='string');
 }
});

test('DHR-002: required graphical flow categories, cross-browser targets and reporting statuses are explicit',()=>{
 assert.deepEqual(matrix.flows.map(x=>x.id),Array.from({length:11},(_,i)=>
  'G'+String(i+1).padStart(2,'0')));
 assert(matrix.flows.every(x=>x.name&&x.expect));
 assert.deepEqual(new Set(matrix.browserTargets.map(x=>x.engine)),
  new Set(['Chromium','Gecko','WebKit']));
 for(const id of ['safari-ios','chrome-android','firefox-desktop','chromium-desktop'])
  assert(matrix.browserTargets.some(x=>x.id===id));
 assert.deepEqual(matrix.statusPolicy.allowed,
  ['PASS','FAIL','BLOCKED','NOT_RUN','NOT_APPLICABLE']);
 assert.equal(matrix.statusPolicy.default,'NOT_RUN');
 assert(!matrix.scenarios.some(x=>x.status==='PASS'));
});

test('DHR-002: canonical historical fixture IDs are inventoried without altering their save source',()=>{
 const fixtureIds=SEED_INCIDENT_FIXTURES.map(x=>x.id);
 assert.deepEqual(matrix.historicalFixtures,fixtureIds);
 assert.deepEqual(new Set(matrix.scenarios.map(x=>x.historicalFixture)),
  new Set(['nublar-legacy-unbound-v3','ridge-frozen-rev12','tidal-frozen-rev1']));
 for(const f of SEED_INCIDENT_FIXTURES){
  assert(matrix.scenarios.some(x=>x.id===f.adventureId),f.id);
  assert(Array.isArray(f.commands)&&f.commands.length>0,f.id);
 }
});

test('DHR-002: browser pages expose distinct correct entrypoints and expected control surfaces',()=>{
 const ids=(name)=>new Set([...html[name].matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]));
 const p=ids('party.html'),c=ids('characters.html'),s=ids('index.html');
 for(const id of ['adventure-select','control-mode','focus-actor','camera-mode','camera-actor',
  'playback-speed','sim-resume','sim-pause','sim-step','party-command','party-command-form',
  'party-roster','party-events','save-incident','load-incident','export-incident',
  'restart-incident'])assert(p.has(id),'Party '+id);
 for(const id of ['party-size','party-seed','make-party','start-party','roster-list',
  'editor-root','export-party'])assert(c.has(id),'Character Lab '+id);
 for(const id of ['command','commandform','save','load','export','export-debug',
  'map','inventory','newgame'])assert(s.has(id),'Solo '+id);
 assert(html['party.html'].includes('./src/party-app.mjs'));
 assert(html['characters.html'].includes('./src/characters-app.mjs'));
 assert(html['index.html'].includes('./src/app.mjs'));
});

test('DHR-002: Party and legacy solo save namespaces remain distinct; Hub demo saves are not Party saves',()=>{
 assert(partyApp.includes("const STORE='dinosaur-party-incident-007c'"));
 assert(soloApp.includes("const SAVE_KEY = 'dinosaur-horror-rpg-isla-nublar-v1'"));
 assert(characterApp.includes("const STORE = 'dinosaur-character-lab-007'"));
 assert(partyApp.includes("const LAUNCH='dinosaur-party-launch-007c'"));
 assert(!partyApp.includes('dhrpg_hub_demo_v1_'));
 assert(!partyApp.includes('localStorage.clear('));
 const playable=listHubScenarios().filter(x=>x.launchable);
 assert.equal(playable.length,3);
 for(const x of playable)assert.equal(resolveHubLaunchScenario(x.id).adventureId,x.id);
 for(const id of ['research','breach','convoy','custom','storm','count','tidal'])
  assert.throws(()=>resolveHubLaunchScenario(id),RangeError);
});

test('DHR-002: browser event wiring includes action, observer, simulation and recovery controls',()=>{
 for(const token of ["$('control-mode').addEventListener('change'",
  "$('camera-mode').addEventListener('change'",
  "$('sim-step').addEventListener('click'",
  "$('sim-pause').addEventListener('click'",
  "$('sim-resume').addEventListener('click'",
  "$('save-incident').addEventListener('click'",
  "$('load-incident').addEventListener('click'",
  "$('restart-incident').addEventListener('click'"])
  assert(partyApp.includes(token),'missing browser event handler '+token);
 assert(partyApp.includes('upgradePartySave(loaded)'));
 assert(partyApp.includes('document.hidden'));
 assert(soloApp.includes('repairLegacyBarricadeSave'));
});

for(const scenario of matrix.scenarios){
 for(const mode of matrix.modes){
  test('DHR-002: deterministic browser-journey prerequisite for '+scenario.id+' / '+mode.id,()=>{
   const initial=newPartyIncident({adventureId:scenario.id,seed:scenario.seed,roster});
   assert.equal(isPartySave(initial),true);
   assert.equal(initial.actors.length,3);
   assert.equal(partyView(initial).adventureId??'nublar-after-the-storm',scenario.id);
   const before=stripControl(initial);
   const switched=setControlMode(initial,{
    mode:mode.id,focusedActorId:initial.actors[initial.cursor].id
   });
   assert.equal(switched.accepted,true,switched.reason);
   const state=switched.state;
   assert.equal(state.control.mode,mode.id);
   assert.equal(state.control.paused,true);
   assert.deepEqual(stripControl(state),before,
    'control switches must never mutate dice/world/actions/inventory');
   const camera=setCamera(state,{mode:'actor',actorId:state.actors[1].id});
   assert.equal(camera.accepted,true,camera.reason);
   assert.deepEqual(stripControl(camera.state),before,
    'camera switches must not spend turns or alter hidden world');
   assert.equal(isPartySave(JSON.parse(JSON.stringify(camera.state))),true);
   let step;
   if(mode.id==='spectator')
    step=runAutonomousTurn(camera.state,{singleStep:true});
   else step=partyStep(camera.state,'wait',{
    actorId:camera.state.actors[camera.state.cursor].id,source:'human'
   });
   assert.equal(step.accepted,true,step.reason);
   assert.equal(isPartySave(step.state),true);
   assert.equal(step.state.scenario,initial.scenario);
   assert.deepEqual(JSON.parse(JSON.stringify(step.state)),step.state);
   assert.equal(initial.actions.length,0,'first game instance must remain unmutated');
  });
 }
}

test('DHR-002: denied out-of-world move cannot damage a source-bound save',()=>{
 for(const scenario of matrix.scenarios){
  const s=newPartyIncident({adventureId:scenario.id,seed:scenario.seed,roster});
  const before=structuredClone(s);
  const r=partyStep(s,'move nonexistent-place',{actorId:s.actors[s.cursor].id,source:'human'});
  assert.equal(r.accepted,false,scenario.id);
  assert.strictEqual(r.state,s);
  assert.deepEqual(s,before);
  assert.equal(isPartySave(s),true);
 }
});

test('DHR-002: a QA evidence template documents NOT_RUN rather than inventing browser results',async()=>{
 const docs=await readFile(at('../docs/qa/DHR-002-GRAPHICAL-QA.md'),'utf8');
 const evidence=await readFile(at('../docs/qa/DHR-002-EVIDENCE-TEMPLATE.md'),'utf8');
 assert(docs.includes('36 core graphical runs'));
 assert(docs.includes('browser runs NOT PERFORMED'));
 assert(docs.includes('legacy solo'));
 assert(docs.includes('BLOCKED'));
 assert(evidence.includes('NOT_RUN'));
 assert(evidence.includes('No graphical test is recorded as passed'));
 assert(evidence.includes('Integration Director sign-off'));
});

test('DHR-002: this new test module passes a separate Node syntax check',()=>{
 const path=fileURLToPath(import.meta.url);
 const run=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});
 assert.equal(run.status,0,run.stderr||run.stdout);
});
