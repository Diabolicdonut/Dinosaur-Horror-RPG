import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {newPartyIncident,partyStep,partyView,isPartySave,upgradePartySave,parsePartyAction} from '../src/party-engine.mjs';
import {BATTERY_CELL,BATTERY_STOCK,batteryCount,validBatteryStock,localBatteryOptions} from '../src/finite-resources.mjs';
import {LIGHT_CAPACITY_STRETCHES,actorHasLight} from '../src/dinosaur-pursuit.mjs';
import {setControlMode,setCamera} from '../src/party-director.mjs';

const game=(seed=1993)=>newPartyIncident({seed});
const act=(s,cmd)=>partyStep(s,cmd,{actorId:s.actors[s.cursor].id,source:'human'});
const withCell=(seed=1993)=>{
 const s=game(seed);s.actors[0].location='shed';s.dinosaurs[0].defeated=true;
 s.actors[0].light.charge=0;
 return s;
};
const claimCell=(s,place='shed')=>{
 s.actors[0].location=place;
 const out=act(s,'take battery_cell');assert(out.accepted,out.reason);
 return out.state;
};
test('two actual authored sealed lamp cells exist on the map, none conjured in starting gear',()=>{
 const s=game();
 assert.equal(BATTERY_STOCK,2);
 assert.deepEqual(s.rooms.shed.items.filter(x=>x===BATTERY_CELL),[BATTERY_CELL]);
 assert.deepEqual(s.rooms.helipad.items.filter(x=>x===BATTERY_CELL),[BATTERY_CELL]);
 assert.equal(s.actors.reduce((n,a)=>n+batteryCount(a),0),0);
 assert.equal(s.batterySpent,0);
 assert(validBatteryStock(s));assert(isPartySave(s));
});
test('physical pickup spends a legal turn, removes exactly one cell from the source',()=>{
 const before=withCell(),original=JSON.stringify(before);
 const r=act(before,'take battery_cell');assert(r.accepted,r.reason);
 assert.equal(JSON.stringify(before),original);
 assert.equal(r.state.rooms.shed.items.filter(x=>x===BATTERY_CELL).length,0);
 assert.equal(batteryCount(r.state.actors[0]),1);
 assert.equal(r.state.batterySpent,0);
 assert.equal(r.state.beat,before.beat+1);
 assert.equal(isPartySave(r.state),true);
});
test('a consumed cell restores exactly existing lamp maximum and records audited consumption',()=>{
 let s=claimCell(withCell());s.cursor=0;
 const before=structuredClone(s),r=act(s,'battery replace');assert(r.accepted,r.reason);
 const next=r.state;
 assert.equal(next.actors[0].light.charge,LIGHT_CAPACITY_STRETCHES);
 assert.equal(next.actors[0].light.on,false);
 assert.equal(next.actors[0].inventory.filter(x=>x===BATTERY_CELL).length,0);
 assert.equal(next.batterySpent,1);
 assert.equal(next.actions.at(-1).consumed,BATTERY_CELL);
 assert.equal(next.actions.at(-1).chargeBefore,0);
 assert.equal(next.actions.at(-1).chargeAfter,LIGHT_CAPACITY_STRETCHES);
 assert.equal(next.beat,s.beat+1);
 assert.equal(next.actions.at(-1).kind,'battery');
 assert.equal(isPartySave(next),true);
});
test('replacement never supplies free active light or hidden sight of a distant predator',()=>{
 let s=claimCell(withCell());s.cursor=0;s.dinosaurs[0].defeated=false;s.dinosaurs[0].location='paddock';
 const res=act(s,'battery replace');assert(res.accepted,res.reason);
 assert.equal(res.state.actors[0].light.on,false);
 assert.equal(actorHasLight(res.state.actors[0]),false);
 assert.equal(partyView(res.state,{actorId:'pc-1'}).personalLight.on,false);
 assert.equal(partyView(res.state,{actorId:'pc-1'}).visibleDinosaurs.length,0);
});
test('replacement cannot be repeated without a second physical spare',()=>{
 let s=claimCell(withCell());s.cursor=0;s=act(s,'battery replace').state;
 s.cursor=0;s.actors[0].light.charge=0;
 const saved=JSON.stringify(s),r=act(s,'battery replace');
 assert.equal(r.accepted,false);assert.strictEqual(r.state,s);
 assert.equal(JSON.stringify(s),saved);
});
test('replacement is disallowed for charged lamp with no need to expend a spare',()=>{
 let s=game();s.dinosaurs[0].defeated=true;
 s.actors[0].inventory.push(BATTERY_CELL);s.rooms.shed.items=s.rooms.shed.items.filter(x=>x!==BATTERY_CELL);
 const snapshot=JSON.stringify(s);
 const r=act(s,'battery replace');assert.equal(r.accepted,false);
 assert.equal(JSON.stringify(s),snapshot);
});
test('a survivor without a lamp cannot consume a cell or gain a lantern by fiat',()=>{
 const s=game();s.dinosaurs[0].defeated=true;
 s.actors[1].inventory.push(BATTERY_CELL);s.rooms.shed.items=s.rooms.shed.items.filter(x=>x!==BATTERY_CELL);
 s.cursor=1;const snapshot=JSON.stringify(s),r=act(s,'battery replace');
 assert.equal(r.accepted,false);assert.equal(JSON.stringify(s),snapshot);
});
test('physical battery transfer uses original co-location and ownership safeguards',()=>{
 const s=claimCell(withCell());s.actors[1].location='shed';s.cursor=0;
 const out=act(s,'give battery_cell to pc-2');
 assert(out.accepted,out.reason);
 assert.equal(batteryCount(out.state.actors[0]),0);
 assert.equal(batteryCount(out.state.actors[1]),1);
 assert.equal(out.state.batterySpent,0);
 assert(isPartySave(out.state));
});
test('cannot transfer a spare remotely, duplicate it or take same cell twice',()=>{
 const s=claimCell(withCell());s.cursor=0;s.actors[1].location='control';
 const snapshot=JSON.stringify(s);
 const remote=act(s,'give battery_cell to pc-2');
 assert.equal(remote.accepted,false);assert.equal(JSON.stringify(s),snapshot);
 const empty=act(s,'take battery_cell');assert.equal(empty.accepted,false);
});
test('two spent cells exhaust all authored spares and forbid extra creation',()=>{
 let s=game();s.dinosaurs[0].defeated=true;
 s.actors[0].location='shed';s.actors[0].light.charge=0;
 s=claimCell(s);s.cursor=0;s=act(s,'battery replace').state;
 s.actors[0].location='helipad';s.actors[0].light.charge=0;s.cursor=0;
 s=claimCell(s,'helipad');s.cursor=0;s=act(s,'battery replace').state;
 assert.equal(s.batterySpent,2);
 assert.equal(s.rooms.shed.items.filter(x=>x===BATTERY_CELL).length,0);
 assert.equal(s.rooms.helipad.items.filter(x=>x===BATTERY_CELL).length,0);
 assert.equal(s.actors.reduce((n,a)=>n+batteryCount(a),0),0);
 assert(isPartySave(s));
});
test('invalid save cannot introduce more cells than the total physical stock',()=>{
 const s=game();
 s.actors[0].inventory.push(BATTERY_CELL);
 assert.equal(validBatteryStock(s),false);assert.equal(isPartySave(s),false);
 s.actors[0].inventory.pop();
 s.batterySpent=-1;assert(!isPartySave(s));
 s.batterySpent=3;assert(!isPartySave(s));
});
test('old v3 saves without resource counter or old cell stock remain legal',()=>{
 const s=game();delete s.batterySpent;
 s.rooms.shed.items=s.rooms.shed.items.filter(x=>x!==BATTERY_CELL);
 s.rooms.helipad.items=s.rooms.helipad.items.filter(x=>x!==BATTERY_CELL);
 assert(isPartySave(s));
 assert(isPartySave(upgradePartySave(s)));
 assert.equal(localBatteryOptions(s,s.actors[0],true,LIGHT_CAPACITY_STRETCHES).length,0);
});
test('actor-private light resources remain unchanged by spectator/camera changes',()=>{
 let s=game();s.actors[0].inventory.push(BATTERY_CELL);
 s.rooms.shed.items=s.rooms.shed.items.filter(x=>x!==BATTERY_CELL);
 s.actors[0].light.charge=0;
 const saved=JSON.stringify(s.actors[0].inventory),rng=s.rng;
 s=setControlMode(s,{mode:'spectator'}).state;
 s=setCamera(s,{mode:'actor',actorId:'pc-2'}).state;
 assert.equal(s.rng,rng);assert.equal(JSON.stringify(s.actors[0].inventory),saved);
 assert.equal(partyView(s,{actorId:'pc-1'}).batterySupplies.carried,1);
 assert.equal(partyView(s,{actorId:'pc-2'}).batterySupplies.carried,0);
 assert(!('remaining' in partyView(s,{actorId:'pc-2'}).batterySupplies));
 assert(isPartySave(s));
});
test('natural text and live browser buttons use the same validated battery command',async()=>{
 for(const input of ['battery replace','replace battery','replace the flashlight battery','swap battery','reload headlamp']){
  const o=parsePartyAction(input);
  assert.equal(o.kind,'battery');assert.equal(o.target,'replace');
 }
 const [html,app,engine,scenario]=await Promise.all([
  readFile(new URL('../party.html',import.meta.url),'utf8'),
  readFile(new URL('../src/party-app.mjs',import.meta.url),'utf8'),
  readFile(new URL('../src/party-engine.mjs',import.meta.url),'utf8'),
  readFile(new URL('../src/scenario.mjs',import.meta.url),'utf8')
 ]);
 assert(html.includes('party-app.mjs?v=009c4'));
 assert(app.includes('party-engine.mjs?v=009c4'));
 assert(app.includes('v.batteryActions'));
 assert(engine.includes('batteryReady(a)'));
 assert(scenario.includes("battery_cell"));
});
