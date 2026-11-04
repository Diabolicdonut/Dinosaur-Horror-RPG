import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {compileAdventure,adventureBinding} from '../src/adventure-definition.mjs';
import {initialAdventureCreatures,validateCreatureContinuity} from '../src/adventure-creatures.mjs';
import {validateAmmunitionConservation} from '../src/weapon-ammunition.mjs';
import {assessRangedGeometry} from '../src/ranged-geometry.mjs';

const STOCK=Object.freeze({cartridge:4});
const r=(name,exits,items=[])=>({name,description:'An authored physical area.',exits,items});
const DEFINITION={
  schemaVersion:1,id:'ranged_geometry_site',revision:1,title:'Ranged geometry test',
  premise:'A versioned physical map with an optional animal.',
  start:'camp',startItems:[],itemNames:{
    crate_01:'Source-anchored crate',cartridge:'Cartridge',rifle_item:'Field rifle'},
  rooms:{
    camp:r('Camp',['gate'],['crate_01']),
    gate:r('Gate',['camp','ridge']),
    ridge:r('Ridge',['gate','grove']),
    grove:r('Grove',['ridge','far']),
    far:r('Far field',['grove']),
  },flags:{},
  objectives:[{id:'leave',description:'Return to camp.',room:'camp',requires:[],
    effects:[{type:'end',outcome:'completed'}]}],
  initialCreatures:[{id:'raptor_01',species:'velociraptor',
    location:'gate',disposition:'predatory',
    when:{slot:'sighting',choice:'active'}}],
  variants:{sighting:[
    {id:'active',description:'The animal is present.',clueRoom:'gate',fact:'patrol'},
    {id:'quiet',description:'The animal is absent.',clueRoom:'gate',fact:'quiet'},
  ]},
};
const seedWith=want=>{
  for(let seed=1;seed<256;seed++){
    const c=compileAdventure(DEFINITION,{seed});
    if(c.hiddenFacts.sighting.id===want)return seed;
  }
  throw new Error('No seed for '+want);
};
const PRESENT=seedWith('active'),ABSENT=seedWith('quiet');
const declaration=(extra={})=>({actorId:'pc-1',weaponId:'rifle_01',
  targetId:'raptor_01',seed:1993,...extra});
function source(){
  return {
    sightlines:[['camp','gate'],['gate','ridge'],['ridge','grove'],
      ['grove','far'],['camp','ridge'],['camp','grove']],
    sameZoneRanges:[{a:'pc-1',b:'pc-2',range:'short'}],
    doorPositions:[],
    covers:[{id:'crate_cover',room:'camp',level:'partial',itemId:'crate_01'},
      {id:'full_cover',room:'camp',level:'full',occludes:true}],
    weaponRanges:[{itemId:'rifle_item',minimum:'short',maximum:'long'}],
  };
}
function fixture(seed=PRESENT) {
  const compiled=compileAdventure(DEFINITION,{seed});
  const state={
    saveVersion:3,beat:11,rng:5050,adventureBinding:adventureBinding(compiled),
    actors:[{id:'pc-1',location:'camp',inventory:['rifle_item'],health:4,dead:false},
      {id:'pc-2',location:'camp',inventory:[],health:4,dead:false}],
    dinosaurs:initialAdventureCreatures(compiled),
    rooms:Object.fromEntries(Object.entries(compiled.definition.rooms).map(
      ([id,room])=>[id,{items:id==='camp'?['crate_01','cartridge','cartridge']:[]}])),
    weapons:[{id:'rifle_01',itemId:'rifle_item',ownerId:'pc-1',
      class:'ranged',ammo:{itemId:'cartridge',capacity:4,loaded:2}}],
    ammoSpent:{cartridge:0},
    combat:{active:true,index:0,round:1,budgets:{'pc-1':{full:1,quick:2,fullSpent:0,quickSpent:0}}},
    actions:[],history:[],
  };
  return {compiled,state,scene:source()};
}
const roster=()=>[{id:'raptor_01',defeated:false},{id:'pc-2',dead:false}];
const assess=(f=fixture(),a=declaration(),t=roster(),s=STOCK)=>
  assessRangedGeometry(f.compiled,f.state,s,a,t,f.scene);
function deny(f,a=declaration(),t=roster(),stock=STOCK){
  const before=JSON.stringify(f),out=assess(f,a,t,stock);
  assert.equal(out.eligible,false);
  assert.equal(JSON.stringify(f),before);
  return out.reason;
}
function invalid(f,a=declaration(),t=roster(),stock=STOCK){
  const before=JSON.stringify(f);
  assert.throws(()=>assess(f,a,t,stock),RangeError);
  assert.equal(JSON.stringify(f),before);
}
function deepFreeze(value) {
  if(value&&typeof value==='object'&&!Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);Object.freeze(value);
  }
  return value;
}

test('DHR-012 syntax, authored world seed and independent stock are valid',()=>{
  const check=spawnSync(process.execPath,['--check',
    new URL('../src/ranged-geometry.mjs',import.meta.url).pathname],{encoding:'utf8'});
  assert.equal(check.status,0,check.stderr);
  const f=fixture();
  assert(validateCreatureContinuity(f.compiled,f.state));
  assert(validateAmmunitionConservation(f.state,STOCK));
});
test('verified adjacent-zone raptor uses Medium range without spending time, ammunition or dice',()=>{
  const f=fixture(),prior=JSON.stringify(f.state),out=assess(f);
  assert.equal(out.eligible,true);
  assert.equal(out.rangeBand,'medium');
  assert.equal(out.zoneHops,1);
  assert.equal(out.rangeModifier,0);
  assert.equal(out.coverModifier,0);
  assert.equal(out.modifier,0);
  assert.equal(out.draws,0);
  assert.equal(out.ammoSpent,0);
  assert.equal(out.hasCommittedAction,false);
  assert.equal(JSON.stringify(f.state),prior);
});
test('same room needs certified Short separation; Adjacent belongs to CLOSE COMBAT',()=>{
  const f=fixture(),a=declaration({targetId:'pc-2'});
  assert.equal(assess(f,a).rangeBand,'short');
  f.scene.sameZoneRanges=[];
  assert.match(deny(f,a),/separation/);
  f.scene.sameZoneRanges=[{a:'pc-1',b:'pc-2',range:'adjacent'}];
  assert.match(deny(f,a),/close-combat/);
});
test('shorter than a weapon minimum applies Evolved minus two dice per band',()=>{
  const f=fixture();
  f.scene.weaponRanges[0].minimum='long';
  assert.deepEqual(
    [assess(f).rangeBand,assess(f).rangeModifier],['medium',-2]);
  const a=declaration({targetId:'pc-2'});
  assert.deepEqual([assess(f,a).rangeBand,assess(f,a).rangeModifier],['short',-4]);
});
test('maximum range is absolute except source-certified Short-to-doorway shot',()=>{
  const f=fixture();
  f.scene.weaponRanges[0].maximum='short';
  assert.match(deny(f),/maximum/);
  f.scene.doorPositions=[{actorId:'pc-1',toward:'gate'}];
  const result=assess(f);
  assert.equal(result.eligible,true);
  assert.equal(result.doorwayException,true);
  assert.equal(result.rangeBand,'medium');
  f.scene.doorPositions=[{actorId:'pc-1',toward:'ridge'}];
  invalid(f); // nonadjacent doorway cannot be invented
  const distant=fixture();distant.state.actors[1].location='far';
  assert.match(deny(distant,declaration({targetId:'pc-2'})),/maximum/);
});
test('a distant four-zone target needs a source-authorized Extreme weapon',()=>{
  const f=fixture();
  f.state.actors[1].location='far';
  f.scene.weaponRanges[0].maximum='extreme';
  f.scene.sightlines.push(['camp','far']);
  assert.equal(assess(f,declaration({targetId:'pc-2'})).rangeBand,'extreme');
  f.scene.weaponRanges[0].maximum='long';
  assert.match(deny(f,declaration({targetId:'pc-2'})),/maximum/);
});
test('a wall or an undocumented long straight sightline always denies fire',()=>{
  const f=fixture();
  f.scene.sightlines=[];
  assert.match(deny(f),/line of sight/);
  const other=fixture();
  other.state.actors[1].location='ridge';
  other.scene.sightlines=other.scene.sightlines.filter(
    p=>!(p.includes('camp')&&p.includes('ridge')));
  assert.match(deny(other,declaration({targetId:'pc-2'})),/line of sight/);
  const corridor=fixture();
  corridor.state.actors[1].location='ridge';
  corridor.scene.sightlines=corridor.scene.sightlines.filter(
    p=>!(p.includes('gate')&&p.includes('ridge')));
  assert.match(deny(corridor,declaration({targetId:'pc-2'})),/line of sight/);
});
test('partial cover is a real occupied world object; missing, remote or invented cover denied',()=>{
  const f=fixture(),a=declaration({targetId:'pc-2'});
  f.state.actors[1].coverId='crate_cover';
  assert.equal(assess(f,a).coverModifier,-2);
  assert.equal(assess(f,a).modifier,-2);
  f.state.rooms.camp.items=f.state.rooms.camp.items.filter(x=>x!=='crate_01');
  assert.match(deny(f,a),/no longer physically present/);
  f.state.rooms.camp.items.push('crate_01');
  f.state.actors[1].coverId='fake_barrier';
  assert.match(deny(f,a),/not a physically present/);
  f.state.actors[1].coverId='crate_cover';
  f.scene.covers[0].room='ridge';
  assert.match(deny(f,a),/not a physically present/);
});
test('full cover that blocks view denies; visible full cover carries minus three',()=>{
  const f=fixture(),a=declaration({targetId:'pc-2'});
  f.state.actors[1].coverId='full_cover';
  assert.match(deny(f,a),/blocks line of sight/);
  f.scene.covers[1].occludes=false;
  const out=assess(f,a);
  assert.equal(out.eligible,true);
  assert.equal(out.coverModifier,-3);
});
test('a hidden target is not automatically revealed by room co-location',()=>{
  const f=fixture();
  f.state.actors[1].hidden=true;
  assert.match(deny(f,declaration({targetId:'pc-2'})),/Concealed/);
});
test('source-backed creature location and conditional seed prevent phantom encounters',()=>{
  const quiet=fixture(ABSENT);
  assert.equal(quiet.state.dinosaurs.length,0);
  assert.match(deny(quiet),/absent from actual world/);
  const f=fixture(PRESENT);
  f.state.dinosaurs[0].location='far'; // no saved movement to justify this
  assert.match(deny(f),/cannot be certified/);
  const r=fixture();
  assert.match(deny(r,declaration({targetId:'unseen_raptor'})),/roster/);
});
test('faked target rosters, equipment and ammo stock never produce shots',()=>{
  const f=fixture();
  assert.match(deny(f,declaration({targetId:'pc-2'}),[]),/roster/);
  assert.match(deny(f,declaration({weaponId:'nonexistent'})),/weapon/);
  const wrongOwner=fixture();
  wrongOwner.state.weapons[0].ownerId='pc-2';
  invalid(wrongOwner);
  const fakeRounds=fixture();
  fakeRounds.state.weapons[0].ammo.loaded=3;
  invalid(fakeRounds);
  invalid(f,declaration(),roster(),{cartridge:300});
});
test('player/AI cannot declare range, cover, aim or fabricated attack modifiers',()=>{
  for(const extension of [
    {rangeBand:'short'},{coverId:'full_cover'},{distance:0},
    {modifier:999},{lineOfSight:true},{aimed:true},{targetLocation:'gate'},
    {seed:-1},{seed:'1993'},{skill:'ranged_combat'},
  ])invalid(fixture(),declaration(extension));
  for(const bad of [
    {...source(),sightlines:[['camp','fake_room']]},
    {...source(),sameZoneRanges:[{a:'pc-1',b:'raptor_01',range:'short'}]},
    {...source(),weaponRanges:[{itemId:'rifle_item',minimum:'extreme',maximum:'short'}]},
    {...source(),covers:[{id:'fabricated',room:'camp',level:'partial',itemId:'unknown'}]},
    {...source(),doorPositions:[{actorId:'pc-1',toward:'far'}]},
  ]){const f=fixture();f.scene=bad;invalid(f);}
});
test('replay frozen snapshots yield identical modifiers, zero draws and unchanged budgets',()=>{
  const f=fixture(),a=declaration({targetId:'pc-2',seed:123456}),t=roster();
  const before=JSON.stringify(f.state);
  deepFreeze(f);deepFreeze(a);deepFreeze(t);
  const first=assess(f,a,t),second=assess(f,a,t);
  assert.deepEqual(first,second);
  assert(Object.isFrozen(first));
  assert.equal(first.draws,0);
  assert.equal(JSON.stringify(f.state),before);
  assert.equal(f.state.rng,5050);
  assert.equal(f.state.beat,11);
  assert.equal(f.state.combat.budgets['pc-1'].fullSpent,0);
  assert.equal(f.state.ammoSpent.cartridge,0);
});
test('older pre-weapon save fingerprint and absence of new fields are preserved',()=>{
  const f=fixture(),state={
    saveVersion:3,beat:0,rng:7,actors:[
      {id:'pc-1',location:'camp',inventory:[]},
      {id:'pc-2',location:'camp',inventory:[]}],
    rooms:Object.fromEntries(Object.keys(f.state.rooms).map(id=>[id,{items:[]}])),
    history:[{kind:'look',seed:11}],
  };
  f.state=state;
  const before=JSON.stringify(state);
  assert.match(deny(f,declaration({targetId:'pc-2'}),roster(),{}),/weapon/);
  assert.equal(JSON.stringify(state),before);
  assert(!('weapons' in state));
  assert(!('ammoSpent' in state));
  assert(!('combat' in state));
  assert(!('dinosaurs' in state));
});
