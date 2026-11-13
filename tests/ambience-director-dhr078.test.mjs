import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  createAmbienceRegistry, proposeAmbienceCue, playbackDirective,
  mockPlayback, AMBIENCE_SCHEMA_VERSION
} from '../src/ambience-director.mjs';

const raw = readFileSync(new URL('../media/ambience-approved.v1.json',import.meta.url),'utf8');
const manifest = JSON.parse(raw);
const registry = createAmbienceRegistry(manifest);
function scene(overrides={}) {
  return {
    committed:true, biome:'jungle',weather:'clear',timeOfDay:'day',
    context:'open',mood:'normal',audibleCreatureCue:false,...overrides
  };
}
const selection = (overrides={}) => proposeAmbienceCue(registry,{scene:scene(),...overrides});

test('DHR-078: exact user Yes set: 94 approved, 306 excluded from 400 across 8 albums',()=>{
  assert.equal(AMBIENCE_SCHEMA_VERSION,1);
  assert.equal(manifest.reviewedCount,400);
  assert.equal(manifest.approvedCount,94);
  assert.equal(manifest.excludedCount,306);
  assert.equal(registry.tracks.length,94);
  assert.equal(new Set(registry.tracks.map(t=>t.id)).size,94);
  assert.equal(new Set(registry.tracks.map(t=>t.filename)).size,94);
  assert.deepEqual([...new Set(registry.tracks.map(t=>t.album))].sort(),
    Array.from({length:8},(_,i)=>'RPG Ambiences Vol. '+(i+1)));
  assert(registry.tracks.every(t=>t.approved === true && t.kind === 'ambience'));
  assert(!raw.includes('dropbox.com/'));
  assert(!raw.includes('https://'));
  assert(!raw.includes('GAME_TOKEN'));
  assert(!raw.includes('OPENAI_API_KEY'));
  assert.equal(registry.byId['amb-v3-04'].title,'Jungle');
  assert.equal(registry.byId['amb-v4-14'].title,'Dinosaurs Jungle');
  assert.equal(registry.byId['amb-v8-43'].title,'Tropical Swamp During Night');
  assert.equal(registry.byId['amb-v6-49'].title,'Dinosaur Caravan');
});

test('DHR-078: no unselected, vol 9 or rejected wind tracks can be requested',()=>{
  for(const id of ['amb-v1-01','amb-v5-01','amb-v9-01','abandoned-shack',
    'Michael Ghelfi - RPG Ambiences Vol. 1 - 01 Alchemy Laboratory.ogg']) {
    assert.equal(selection({requestedId:id}).type,'silence');
  }
  assert(!registry.tracks.some(t=>/abandoned shack/i.test(t.title)));
  assert(!registry.tracks.some(t=>/back alley tavern|alchemy laboratory/i.test(t.title)));
  assert.equal(manifest.policy.unknownTrack,'deny');
  assert.equal(manifest.policy.rejectedAbandonedShackWind,'deny');
});

test('DHR-078: strict identifier, duplicate, URL, malformed tag and count rejection',()=>{
  const mutate = fn => {const value=structuredClone(manifest);fn(value);return value;};
  const invalids=[
    mutate(m=>m.tracks[0].url='https://private.example/a.ogg'),
    mutate(m=>m.tracks[0].filename='../escape.ogg'),
    mutate(m=>m.tracks[0].tags.push('bad tag')),
    mutate(m=>m.tracks[1].id=m.tracks[0].id),
    mutate(m=>m.tracks[0].approved=false),
    mutate(m=>m.excludedCount=0),
    mutate(m=>m.storage.playbackUrlsStored=true),
    mutate(m=>m.policy.rejectedAbandonedShackWind='allow'),
    mutate(m=>m.tracks[0].gainDb=99),
    mutate(m=>m.tracks.push({...m.tracks[0]}))
  ];
  for (const m of invalids) assert.throws(()=>createAmbienceRegistry(m),TypeError);
  assert(Object.isFrozen(registry.tracks));
  assert(Object.isFrozen(registry.tracks[0].tags));
});

test('DHR-078: normal jungle selects ordinary wildlife, not dinosaur or horror beds',()=>{
  const plan=selection();
  assert.equal(plan.type,'ambience');
  assert.equal(plan.trackId,'amb-v3-04');
  assert.equal(plan.reason,'public-scene-match');
  assert.equal(plan.loopVerified,false);
  assert.equal(plan.assetKey,'Michael Ghelfi - RPG Ambiences Vol. 3 - 04 Jungle.ogg');
  assert(!JSON.stringify(plan).includes('dropbox'));
});

test('DHR-078: rain, night, camp and quiet beats drive restrained scene changes',()=>{
  assert.equal(selection({scene:scene({weather:'rain'})}).trackId,'amb-v3-06');
  assert.equal(selection({scene:scene({timeOfDay:'night'})}).trackId,'amb-v4-22');
  assert.equal(selection({scene:scene({context:'camp'})}).trackId,'amb-v3-05');
  assert.equal(selection({scene:scene({silence:true})}).type,'silence');
  assert.equal(selection({scene:scene({committed:false})}).type,'silence');
  assert.equal(selection({scene:scene({biome:'none'})}).type,'silence');
});

test('DHR-078: rainy indoor shelter favors interior perspective, not exposed jungle',()=>{
  const result=selection({scene:scene({context:'interior',weather:'rain'})});
  assert.equal(result.trackId,'amb-v7-36');
});

test('DHR-078: GM may only request a curated physically relevant sound',()=>{
  assert.equal(selection({requestedId:'amb-v3-04'}).trackId,'amb-v3-04');
  assert.equal(selection({requestedId:'amb-v3-06'}).type,'silence');
  assert.equal(selection({requestedId:'amb-v8-45'}).type,'silence');
  assert.equal(selection({requestedId:'amb-v1-05'}).type,'silence');
  assert.equal(selection({requestedId:'https://example.com/bad.ogg'}).type,'silence');
});

test('DHR-078: offscreen predator knowledge cannot bleed through soundscape',()=>{
  const hidden=scene({hiddenDinosaur:{id:'raptor',position:'shack'},
    privateGMPlan:'attack-now'});
  assert.equal(selection({scene:hidden}).trackId,'amb-v3-04');
  assert.equal(selection({scene:hidden,requestedId:'amb-v4-14'}).type,'silence');
  assert.equal(selection({scene:scene({mood:'tense'}),requestedId:'amb-v4-14'}).type,'silence');
  assert.equal(selection({scene:scene({audibleCreatureCue:true,mood:'tense'}),
    requestedId:'amb-v4-14'}).trackId,'amb-v4-14');
  assert.equal(selection({scene:scene({audibleCreatureCue:true,mood:'normal'}),
    requestedId:'amb-v4-14'}).type,'silence');
});

test('DHR-078: three control modes do not change public-scene audio',()=>{
  const chosen=['party','focus','spectator'].map(controlMode=>selection({
    scene:scene({controlMode})}).trackId);
  assert.deepEqual(chosen,['amb-v3-04','amb-v3-04','amb-v3-04']);
});

test('DHR-078: repeated narration does not restart the continuous audio bed',()=>{
  assert.deepEqual(selection({previousTrackId:'amb-v3-04'}),
    {type:'hold',trackId:'amb-v3-04',reason:'continuous-scene-bed'});
  assert.equal(selection({scene:scene({weather:'rain'}),previousTrackId:'amb-v3-04'}).type,'ambience');
});

test('DHR-078: mute, disable and explicit volume 0 honor the player',()=>{
  for(const settings of [{muted:true},{enabled:false},{volume:0}])
    assert.equal(selection({settings}).type,'silence');
  assert.equal(selection({scene:scene({silence:true}),requestedId:'amb-v3-04'}).type,'silence');
});

test('DHR-078: playback directives duck underneath GM speech without changing track',()=>{
  const cue=selection(),normal=playbackDirective(cue,{volume:0.5});
  const voice=playbackDirective(cue,{volume:0.5,narrating:true});
  assert.equal(normal.type,'play');
  assert.equal(normal.trackId,voice.trackId);
  assert.equal(voice.gainDb,normal.gainDb-8);
  assert.equal(normal.fadeMs,3500);
  assert.equal(normal.loopVerified,false);
  assert.equal(playbackDirective(cue,{muted:true}).type,'silence');
  assert.equal(playbackDirective(selection({previousTrackId:'amb-v3-04'})).type,'hold');
});

test('DHR-078: forged mixer asset URLs and gain values fail closed',()=>{
  const good=selection();
  for (const forged of [
    {...good,assetKey:'https://unapproved.example/evil.ogg'},
    {...good,assetKey:'Michael Ghelfi - RPG Ambiences Vol. 3 - 06 Jungle Rain.ogg'},
    {...good,gainDb:80},
    {...good,fadeMs:999999},
    {...good,duckDuringNarrationDb:100},
    {...good,loopRequested:false}
  ]) assert.equal(playbackDirective(forged).type,'silence');
});

test('DHR-078: missing Dropbox binding is quiet, never an invented audio URL',()=>{
  const plan=playbackDirective(selection());
  const transitions=[];
  assert.deepEqual(mockPlayback(plan,{transitions}),
    {status:'silent',reason:'missing-asset-binding'});
  assert.deepEqual(transitions,[{type:'silence'}]);
  const playing=mockPlayback(plan,{
    availableAssetKeys:new Set([plan.assetKey]),transitions
  });
  assert.equal(playing.status,'mock-playing');
  assert.equal(transitions[1].type,'crossfade');
  assert.equal(transitions[1].trackId,'amb-v3-04');
  assert.equal(transitions[1].fadeMs,3500);
});

test('DHR-078: catalog and pure audio planning do not require engine saves/Worker',()=>{
  assert(!raw.includes('dinosaur-party-incident-007c'));
  const output=selection({scene:scene({mood:'awe'})});
  assert(['ambience','silence'].includes(output.type));
  assert(!('gameState' in output));
  assert(!('seed' in output));
  assert(!('secret' in output));
});
