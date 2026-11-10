import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {handleRequest} from '../worker/index.mjs';
import {authorizedAudioPath,mediaCatalog,MEDIA_ROUTES} from '../worker/media-audio.mjs';
const origin='https://diabolicdonut.github.io';
const worker='https://dinosaur-rpg.diabolicdonut.workers.dev';
const env={
  GAME_TOKEN:'test-single-player-game-token',
  DROPBOX_APP_KEY:'test-dropbox-app-key',
  DROPBOX_APP_SECRET:'test-dropbox-app-secret-private',
  DROPBOX_REFRESH_TOKEN:'test-dropbox-refresh-token-private',
  GM_REQUIRE_LIMITER:'false'
};
const BASE_PATH='Ambience/Michael Ghelfi - RPG Ambiences Vol. 3 - 04 Jungle.ogg';
const makeRequest=(path,{method='GET',token=env.GAME_TOKEN,body=null,
  requestOrigin=origin,headers={}}={})=>
  new Request(worker+path,{method,headers:{
    ...(requestOrigin===null?{}:{Origin:requestOrigin}),
    ...(token===null?{}:{Authorization:'Bearer '+token}),
    ...(body?{'Content-Type':'application/json'}:{}),...headers
  },...(body?{body:JSON.stringify(body)}:{})});
const mint=(path,body,opts={})=>handleRequest(makeRequest(path,{
  method:'POST',body, ...opts}),env,async()=>{throw Error('should not call Dropbox to mint');});
function stubDropbox(calls=[]){
  return async (url,opts={})=>{
    calls.push({url,headers:opts.headers,body:opts.body,method:opts.method});
    if(url.includes('/oauth2/token')){
      return new Response(JSON.stringify({access_token:'short-lived-dropbox-test-token',
        expires_in:3600}),{status:200});
    }
    if(url.endsWith('/2/files/list_folder')){
      return new Response(JSON.stringify({
        entries:[
          {'.tag':'file',name:'002_00002.wav'},
          {'.tag':'file',name:'001_00001.wav'},
          {'.tag':'file',name:'../bad.wav'},
          {'.tag':'folder',name:'12345.wav'}
        ],has_more:false
      }),{status:200});
    }
    if(url.endsWith('/2/files/download')){
      const isRange=opts.headers?.Range;
      return new Response(new Uint8Array([79,103,103,83]),{
        status:isRange?206:200,
        headers:{
          'Content-Type':'application/octet-stream',
          'Content-Length':'4', 'Accept-Ranges':'bytes',
          ...(isRange?{'Content-Range':'bytes 0-3/20'}:{})
        }
      });
    }
    throw Error('Unexpected upstream '+url);
  };
}

test('media: public list includes exactly 94 approved ambience, 38 music, 119 species',()=>{
  const catalog=mediaCatalog();
  const userApproved=JSON.parse(readFileSync(new URL('../media/ambience-approved.v1.json',import.meta.url),'utf8'));
  assert.equal(catalog.ambience.length,94);
  assert.equal(catalog.music.length,38);
  assert.equal(catalog.effectSpecies.length,119);
  assert.equal(catalog.counts.sfxSourceCount,14767);
  assert.deepEqual(new Set(catalog.ambience),
    new Set(userApproved.tracks.map(t=>'Ambience/'+t.filename)));
  assert(!catalog.ambience.some(t=>/Abandoned Shack/i.test(t)));
  assert(!catalog.music.some(t=>t.includes('https://')));
  assert(!JSON.stringify(catalog).includes('rlkey'));
});

test('media: exact paths allowed and unselected tracks/path traversal refused',()=>{
  assert(authorizedAudioPath(BASE_PATH));
  assert(authorizedAudioPath('Music/brief_wonder.mp3'));
  assert(authorizedAudioPath('Sound Effects/Velociraptor/001_00001.wav'));
  for (const path of [
    'Ambience/Michael Ghelfi - RPG Ambiences Vol. 1 - 01 Alchemy Laboratory.ogg',
    'Ambience/Michael Ghelfi - RPG Ambiences Vol. 9 - 10 Hidden Track.ogg',
    'Music/../private-file.mp3','Music/nonexistent.mp3',
    'Sound Effects/Velociraptor/../other.wav','Sound Effects/FakeSpecies/1.wav',
    'Sound Effects/Velociraptor/private.pdf',
    'Sound Effects/Velociraptor/evil.wav?token=abc',
    'https://www.dropbox.com/anything','',
  ])assert.equal(authorizedAudioPath(path),false,path);
  assert(MEDIA_ROUTES.includes('/v1/media/stream'));
});

test('media: browser preflight and origin restrictions do not alter ordinary Worker routes',async()=>{
  const response=await handleRequest(makeRequest('/v1/media/sign',{
    method:'OPTIONS',token:null,headers:{'Access-Control-Request-Headers':'authorization,content-type'}
  }),env,stubDropbox());
  assert.equal(response.status,204);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'),origin);
  assert.match(response.headers.get('Access-Control-Allow-Headers'),/Authorization/);
  const forbidden=await handleRequest(makeRequest('/v1/media/library',{requestOrigin:'https://evil.example'}),
    env,stubDropbox());
  assert.equal(forbidden.status,403);
  assert.equal((await forbidden.json()).error,'origin_forbidden');
  const gm=await handleRequest(makeRequest('/v1/gm/status'),{...env,OPENAI_API_KEY:'mock-openai'},
    stubDropbox());
  assert.equal(gm.status,200);
  assert((await gm.json()).authenticated);
});

test('media: no Dropbox secrets and no media catalog without game authentication',async()=>{
  for (const token of [null,'invalid']){
    const response=await handleRequest(makeRequest('/v1/media/library',{token}),env,stubDropbox());
    assert.equal(response.status,401);
    assert.equal((await response.json()).error,'unauthorized');
  }
  const response=await handleRequest(makeRequest('/v1/media/library'),env,stubDropbox());
  assert.equal(response.status,200);
  const data=await response.json();
  assert.equal(data.music.length,38);
  assert.equal(data.ambience.length,94);
  assert(!JSON.stringify(data).includes(env.DROPBOX_REFRESH_TOKEN));
});

test('media: signing returns short-lived WORKER URL without Dropbox contents or secrets',async()=>{
  const response=await mint('/v1/media/sign',{path:BASE_PATH});
  assert.equal(response.status,200);
  const obj=await response.json();
  const url=new URL(obj.url);
  assert.equal(url.hostname,'dinosaur-rpg.diabolicdonut.workers.dev');
  assert.equal(url.pathname,'/v1/media/stream');
  assert.equal(obj.path,BASE_PATH);
  assert(obj.expires_in<=1200&&obj.expires_in>0);
  assert(!JSON.stringify(obj).includes('dropbox.com'));
  for (const secret of [env.DROPBOX_REFRESH_TOKEN,env.DROPBOX_APP_SECRET,env.GAME_TOKEN])
    assert(!JSON.stringify(obj).includes(secret));
});

test('media: download verifies signed grant and forwards an immutable Dropbox path',async()=>{
  const minted=await (await mint('/v1/media/sign',{path:BASE_PATH})).json();
  const calls=[];
  const r=await handleRequest(makeRequest(new URL(minted.url).pathname+
    new URL(minted.url).search,{token:null}),env,stubDropbox(calls));
  assert.equal(r.status,200);
  assert.equal(r.headers.get('Content-Type'),'audio/ogg');
  assert.equal(r.headers.get('Content-Disposition'),'inline');
  assert.equal(r.headers.get('Cache-Control'),'private, no-store');
  assert.equal(r.headers.get('Content-Length'),'4');
  assert.equal((await r.arrayBuffer()).byteLength,4);
  assert(calls.some(c=>c.url.endsWith('/2/files/download') &&
    JSON.parse(c.headers['Dropbox-API-Arg']).path===
    '/Projects/Dinosaur Horror RPG/Audio/'+BASE_PATH));
  assert(calls.every(c=>!c.url.includes('openai.com')));
});

test('media: byte-range from browser reaches Dropbox and returns 206 without buffering',async()=>{
  const minted=await(await mint('/v1/media/sign',{path:'Music/brief_wonder.mp3'})).json();
  const calls=[],u=new URL(minted.url);
  const response=await handleRequest(makeRequest(u.pathname+u.search,{
    token:null,headers:{Range:'bytes=0-3'}}),env,stubDropbox(calls));
  assert.equal(response.status,206);
  assert.equal(response.headers.get('Content-Range'),'bytes 0-3/20');
  assert.equal(response.headers.get('Content-Type'),'audio/mpeg');
  assert(calls.some(c=>c.url.endsWith('/2/files/download')&&c.headers.Range==='bytes=0-3'));
  const invalid=await handleRequest(makeRequest(u.pathname+u.search,{
    token:null,headers:{Range:'bytes=0-2,8-9'}}),env,stubDropbox());
  assert.equal(invalid.status,416);
});

test('media: a tampered/expired/forged grant cannot access Dropbox',async()=>{
  const minted=await(await mint('/v1/media/sign',{path:BASE_PATH})).json();
  const url=new URL(minted.url);
  const attempts=[
    new URL(url),
    new URL(url),
    new URL(url)
  ];
  attempts[0].searchParams.set('path','Music/brief_wonder.mp3');
  attempts[1].searchParams.set('exp',String(Math.floor(Date.now()/1000)-10));
  attempts[2].searchParams.set('sig','0'.repeat(64));
  for(const forged of attempts){
    const calls=[];
    const r=await handleRequest(makeRequest(forged.pathname+forged.search,{token:null}),
      env,stubDropbox(calls));
    assert.equal(r.status,403);
    assert.equal(calls.length,0);
  }
  const exposed=await handleRequest(makeRequest('/v1/media/stream?path='+encodeURIComponent(BASE_PATH)+
    '&exp=1&sig=aaaa',{token:null}),env,stubDropbox());
  assert.equal(exposed.status,403);
});

test('media: SFX list is strictly selected from the requested allowed species folder',async()=>{
  const calls=[];
  const response=await handleRequest(makeRequest('/v1/media/effect',{
    method:'POST',body:{species:'Velociraptor',seed:1}
  }),env,stubDropbox(calls));
  assert.equal(response.status,200);
  const data=await response.json();
  assert.equal(data.path,'Sound Effects/Velociraptor/002_00002.wav');
  assert(data.url.startsWith(worker+'/v1/media/stream?'));
  const folder=calls.find(c=>c.url.includes('/files/list_folder'));
  assert.equal(JSON.parse(folder.body).path,
    '/Projects/Dinosaur Horror RPG/Audio/Sound Effects/Velociraptor');
  assert(!JSON.stringify(data).includes(env.DROPBOX_APP_SECRET));
});

test('media: rejected species and rejected ambience never invoke Dropbox upstream',async()=>{
  for(const [path,body] of [
    ['/v1/media/sign',{path:'Ambience/Michael Ghelfi - RPG Ambiences Vol. 1 - 01 Alchemy Laboratory.ogg'}],
    ['/v1/media/sign',{path:'Music/../../.env'}],
    ['/v1/media/effect',{species:'../private',seed:1}],
    ['/v1/media/effect',{species:'Velociraptor',seed:-3}]
  ]){
    const calls=[];
    const resp=await handleRequest(makeRequest(path,{method:'POST',body}),env,stubDropbox(calls));
    assert.equal(resp.status,400,path);
    assert.equal(calls.length,0);
  }
});

test('media: no Dropbox OAuth secrets means a transparent 503 (not accidental public stream)',async()=>{
  const broken={...env,DROPBOX_REFRESH_TOKEN:null};
  const resp=await handleRequest(makeRequest('/v1/media/status'),broken,stubDropbox());
  assert.equal(resp.status,503);
  assert(!JSON.stringify(await resp.json()).includes(env.DROPBOX_APP_SECRET));
});

test('media: configured rate limiter fails closed, rejects over-limit mint without Dropbox requests',async()=>{
  const limited={...env,GM_REQUIRE_LIMITER:'true'};
  let r=await handleRequest(makeRequest('/v1/media/sign',{method:'POST',body:{path:BASE_PATH}}),
    limited,stubDropbox());
  assert.equal(r.status,503);
  r=await handleRequest(makeRequest('/v1/media/sign',{method:'POST',body:{path:BASE_PATH}}),
    {...limited,GM_LIMITER:{limit:async()=>({success:false})}},stubDropbox());
  assert.equal(r.status,429);
  assert.equal(r.headers.get('Retry-After'),'60');
});

test('media: public browser has no private link catalog, Worker signs as authorized game only',async()=>{
  const html=readFileSync(new URL('../party.html',import.meta.url),'utf8');
  const client=readFileSync(new URL('../src/party-audio-browser.mjs',import.meta.url),'utf8');
  assert(html.includes('id="mother-audio-token"'));
  assert(!html.includes('id="mother-audio-file"'));
  assert(client.includes('/v1/media/sign'));
  assert(client.includes('/v1/media/effect'));
  assert(client.includes('/v1/media/library'));
  assert(!client.includes('indexedDB.open'));
  assert(!client.includes('rlkey='));
  assert(!client.includes('DROPBOX_REFRESH_TOKEN'));
  assert(!client.includes('DROPBOX_APP_SECRET'));
});
