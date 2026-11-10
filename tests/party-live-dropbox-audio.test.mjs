import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
  parseDropboxAudioLinks, validLinkedAudioUrl, classifyAudioPath,
  publicAudioScene, chooseMusicCue, chooseSpeciesSound,
  publicAudioSignature
} from '../src/party-audio-planner.mjs';
import {createAmbienceRegistry,proposeAmbienceCue} from '../src/ambience-director.mjs';
const approved=JSON.parse(await readFile(new URL('../media/ambience-approved.v1.json',import.meta.url),'utf8'));
const registry=createAmbienceRegistry(approved);
const yes=new Set(registry.tracks.map(t=>t.filename));
const base='https://www.dropbox.com/scl/fi/synthetic-file-id/test-audio.ogg?rlkey=synthetic-key&raw=1';
const raw=[
 ['Ambience/Michael Ghelfi - RPG Ambiences Vol. 3 - 04 Jungle.ogg',base],
 ['Ambience/Michael Ghelfi - RPG Ambiences Vol. 1 - 01 Alchemy Laboratory.ogg',base.replace('test-audio','another-audio')],
 ['Music/brief_wonder.mp3',base.replace('test-audio.ogg','sample-music.mp3')],
 ['Music/final_rescue.mp3',base.replace('test-audio.ogg','sample-rescue.mp3')],
 ['Music/brief_impact.mp3',base.replace('test-audio.ogg','sample-impact.mp3')],
 ['Sound Effects/Velociraptor/001_0000000001.wav',base.replace('test-audio.ogg','sample-fx.wav')],
 ['Sound Effects/Parasaurolophus/002_0000000002.wav',base.replace('test-audio.ogg','other-fx.wav')]
];
function buildHtml(pairs){return '<!doctype html><script type="application/json" id="seed-data">'+JSON.stringify(pairs)+'</script>';}
const cat=parseDropboxAudioLinks(buildHtml(raw),yes);

test('DHR live audio: recognizes the previously exported 15,255-link HTML seed-data envelope',()=>{
 assert.equal(cat.counts.ambience,1);
 assert.equal(cat.counts.music,3);
 assert.equal(cat.counts.sfx,2);
 assert.equal(cat.counts.excludedAmbience,1);
 assert.equal(cat.acceptedCount,6);
 assert(!cat.pairs.some(([path])=>path.includes('Alchemy Laboratory')));
 assert.deepEqual(Object.keys(cat.species).sort(),['Parasaurolophus','Velociraptor']);
 assert.equal(cat.music.length,3);
});

test('DHR live audio: imports equivalent CSV and JSON without publishing Dropbox links',()=>{
 const csv='path,dropbox_link,audio_url\n'+
   '"Music/brief_wonder.mp3","ignore","'+raw[2][1]+'"\n'+
   '"Sound Effects/Velociraptor/001_0000000001.wav","ignore","'+raw[5][1]+'"\n';
 const fromCsv=parseDropboxAudioLinks(csv,yes);
 assert.equal(fromCsv.counts.music,1);
 assert.equal(fromCsv.counts.sfx,1);
 assert.equal(parseDropboxAudioLinks(JSON.stringify(raw),yes).acceptedCount,6);
 assert.equal(parseDropboxAudioLinks(JSON.stringify({pairs:raw}),yes).acceptedCount,6);
});

test('DHR live audio: exact Dropbox HTTPS raw link policy, refuse hostile URLs',()=>{
 assert(validLinkedAudioUrl(base));
 for(const url of [
  'https://evil.example/scl/fi/something/test.ogg?raw=1',
  'http://www.dropbox.com/scl/fi/something/test.ogg?raw=1',
  'https://www.dropbox.com/scl/fi/something/test.ogg?dl=0',
  'https://someone:password@www.dropbox.com/scl/fi/something/test.ogg?raw=1',
  'javascript:alert(1)','https://www.dropbox.com/home/private'
 ])assert.equal(validLinkedAudioUrl(url),false,url);
 assert.equal(classifyAudioPath('Sound Effects/../secrets.wav'),null);
 assert.equal(classifyAudioPath('Ambience/unapproved.mp3'),null);
 assert.equal(classifyAudioPath('Music/brief_wonder.mp3')?.kind,'music');
});

test('DHR live audio: invalid inputs safely drop, duplicate paths only count once',()=>{
 const fake=[
   raw[0],raw[0],
   ['Music/evil.mp3','https://example.com/no.mp3'],
   ['Sound Effects/../bad.wav',base],
   ['Music/another.mp3','javascript:alert(1)']
 ];
 const a=parseDropboxAudioLinks(JSON.stringify(fake),yes);
 assert.equal(a.acceptedCount,1);
 assert.equal(a.counts.invalid,4);
 assert.throws(()=>parseDropboxAudioLinks('no header and no JSON',yes),TypeError);
 assert.throws(()=>parseDropboxAudioLinks('[',yes),SyntaxError);
 assert.throws(()=>parseDropboxAudioLinks(JSON.stringify(raw),null),TypeError);
});

function view(overrides={}) {
 return {roomName:'Rainforest Clearing',location:'jungle',weather:null,
   adventureId:'ridge-survey',actorId:'pc-1',beat:2,outcome:'playing',
   visibleDinosaurs:[],events:[],combat:null,wildlifeEncounter:null,...overrides};
}

test('DHR live audio: Mother selects ordinary jungle from public partyView projection',()=>{
 const scene=publicAudioScene(view());
 assert.deepEqual(scene,{
  committed:true,biome:'jungle',weather:'clear',timeOfDay:'day',context:'open',
  mood:'normal',audibleCreatureCue:false
 });
 const cue=proposeAmbienceCue(registry,{scene});
 assert.equal(cue.trackId,'amb-v3-04');
 assert(!JSON.stringify(scene).includes('secret'));
});

test('DHR live audio: storm, coast, cavern, interior are classified from visible rooms only',()=>{
 assert.equal(publicAudioScene(view({roomName:'South Coast',location:'beach',weather:'squall'})).weather,'storm');
 assert.equal(publicAudioScene(view({roomName:'Rocky cave',location:'tunnel'})).biome,'cave');
 assert.equal(publicAudioScene(view({roomName:'Abandoned Fire Station',location:'control'})).context,'interior');
 assert.equal(publicAudioScene(view({roomName:'Marsh Edge',location:'estuary'})).biome,'swamp');
 assert.equal(publicAudioScene(view({roomName:'River Crossing',location:'river'})).biome,'river');
});

test('DHR live audio: private danger, distant unseen predator or stress cannot invent creature audio',()=>{
 const hidden=view({privateGM:{hiddenRaptor:true},distantSightings:[{kind:'Velociraptor'}],
   events:[{beat:2,category:'info',message:'Nothing heard'}]});
 assert.equal(publicAudioScene(hidden).audibleCreatureCue,false);
 assert.equal(chooseSpeciesSound(hidden,cat),null);
 assert.equal(chooseMusicCue(hidden,cat.music),null);
 assert.equal(chooseSpeciesSound(view({beat:7,visibleDinosaurs:['Velociraptor'],
   events:[{beat:6,category:'danger',message:'Old encounter'}]}),cat),null);
});

test('DHR live audio: dinosaur effects are reserved for matching current visible danger',()=>{
 const v=view({beat:6,visibleDinosaurs:['Velociraptor'],
    events:[{beat:6,category:'danger',message:'The velociraptor lunges toward cover.'}]});
 assert.equal(chooseSpeciesSound(v,cat),'Sound Effects/Velociraptor/001_0000000001.wav');
 assert.equal(chooseSpeciesSound({...v,visibleDinosaurs:[]},cat),null);
 assert.equal(chooseSpeciesSound({...v,events:[{beat:6,category:'wonder',message:'Wonderful bird'}]},cat),null);
 assert.equal(chooseSpeciesSound({...v,visibleDinosaurs:[{kind:'Velociraptor'}]},cat),
   'Sound Effects/Velociraptor/001_0000000001.wav');
});

test('DHR live audio: sparse music follows committed observer-visible events',()=>{
 assert.equal(chooseMusicCue(view(),cat.music),null);
 assert.equal(chooseMusicCue(view({events:[{beat:2,category:'wonder'}]}),cat.music),
   'Music/brief_wonder.mp3');
 assert.equal(chooseMusicCue(view({beat:3,events:[{beat:2,category:'wonder'}]}),cat.music),null);
 assert.equal(chooseMusicCue(view({outcome:'rescued'}),cat.music),'Music/final_rescue.mp3');
 assert.equal(chooseMusicCue(view({combat:{active:true},events:[{beat:2,category:'danger'}]}),cat.music),
   'Music/brief_impact.mp3');
 assert.equal(chooseMusicCue(view({outcome:'lost'}),cat.music),null);
});

test('DHR live audio: same event signature under replay, changing beat alters music/effect budget',()=>{
 const original=view({events:[{beat:2,category:'danger',message:'Raptor contact'}]});
 assert.equal(publicAudioSignature(original),publicAudioSignature(structuredClone(original)));
 assert.notEqual(publicAudioSignature(original),publicAudioSignature({...original,beat:3}));
});

test('DHR live audio: production Party page mounts all controls and only public projection',async()=>{
 const html=await readFile(new URL('../party.html',import.meta.url),'utf8');
 const browser=await readFile(new URL('../src/party-audio-browser.mjs',import.meta.url),'utf8');
 const app=await readFile(new URL('../src/party-app.mjs',import.meta.url),'utf8');
 const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
 const requested=[...browser.matchAll(/\$\('([^']+)'\)/g)].map(m=>m[1]);
 assert.deepEqual([...new Set(requested.filter(id=>!ids.has(id)))],[]);
 assert(app.includes("import {installPartyAudio} from './party-audio-browser.mjs'"));
 assert(app.includes('motherAudio.update(v)'),'only partyView projection is passed to sound');
 assert(!app.includes('motherAudio.update(state)'));
 assert(!html.includes('type="file"'), 'single player no longer imports Dropbox links per device');
 assert(html.includes('id="mother-audio-token"'));
 assert(browser.includes("'/v1/media/sign'"));
 assert(browser.includes("'/v1/media/effect'"));
 assert(browser.includes("'/v1/media/library'"));
 assert(!browser.includes('indexedDB.open'));
 assert(!html.includes('rlkey='));
 assert(!browser.includes('rlkey='));
 assert(!app.includes('rlkey='));
 assert(!browser.includes('OPENAI_API_KEY'));
 assert(!browser.includes('DROPBOX_REFRESH_TOKEN'));
 assert(!browser.includes('DROPBOX_APP_SECRET'));
});
