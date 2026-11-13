/**
 * DHR private media gateway. Dropbox OAuth refresh token stays in Cloudflare secrets.
 * Browser sees only short-lived, source-bound Worker media URLs.
 * No Dropbox sharing link, OAuth credential, or bulk private catalog leaves this module.
 */
import { APPROVED_AMBIENCE_FILENAMES, MUSIC_FILENAMES,
  SFX_SPECIES_FOLDERS, MEDIA_FILE_COUNTS } from './audio-asset-allowlist.mjs';

export const MEDIA_ROUTES = Object.freeze([
  '/v1/media/status','/v1/media/library','/v1/media/sign',
  '/v1/media/effect','/v1/media/stream'
]);
const AUDIO_ROOT='/Projects/Dinosaur Horror RPG/Audio/';
const ALLOW_AMBIENCE=new Set(APPROVED_AMBIENCE_FILENAMES);
const ALLOW_MUSIC=new Set(MUSIC_FILENAMES);
const ALLOW_SPECIES=new Set(SFX_SPECIES_FOLDERS);
const MEDIA_TTL_SECONDS=1200;
const MAX_MEDIA_JSON_BYTES=1600;
const MIME_TYPES=Object.freeze({ogg:'audio/ogg',mp3:'audio/mpeg',wav:'audio/wav'});
const SFX_FILE=/^[A-Za-z0-9_-]{1,120}\.(?:wav|ogg|mp3)$/;
const SIGNED_PREFIX='dhr-audio-v1';
let dropboxAccessCache=null;

function mediaJson(data,status=200,base={}){
  return new Response(JSON.stringify(data),{status,headers:{
    ...base,'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
function errorResponse(error,status,headers) {return mediaJson({error},status,headers);}
function matchToken(received,expected){
  if(!received||typeof expected!=='string'||!expected)return false;
  let diff=received.length^expected.length;
  for(let i=0;i<Math.max(received.length,expected.length);i++)
    diff|=(received.charCodeAt(i)||0)^(expected.charCodeAt(i)||0);
  return diff===0;
}
function audioConfigured(env) {
  return Boolean(env?.GAME_TOKEN && env?.DROPBOX_APP_KEY &&
    env?.DROPBOX_APP_SECRET && env?.DROPBOX_REFRESH_TOKEN);
}
function asciiHeaderJson(value){
  return JSON.stringify(value).replace(/[\u007f-\uffff]/g,ch=>{
    return '\\u'+ch.charCodeAt(0).toString(16).padStart(4,'0');
  });
}
function mediaType(path){
  return MIME_TYPES[path.split('.').at(-1)?.toLowerCase()]||null;
}
/** Strict paths prevent traversal and protect rejected ambient recordings. */
export function authorizedAudioPath(path){
  if(typeof path!=='string'||path.length>330||path.includes('..')||
      path.includes('\\')||/[?#\u0000-\u001f]/.test(path))return false;
  if(path.startsWith('Ambience/'))
    return ALLOW_AMBIENCE.has(path.slice('Ambience/'.length));
  if(path.startsWith('Music/'))
    return ALLOW_MUSIC.has(path.slice('Music/'.length));
  const match=/^Sound Effects\/([A-Za-z0-9_]+)\/([^/]+)$/.exec(path);
  return Boolean(match && ALLOW_SPECIES.has(match[1]) && SFX_FILE.test(match[2]));
}
export function mediaCatalog(){
  return {
    version:1, counts:MEDIA_FILE_COUNTS,
    ambience:APPROVED_AMBIENCE_FILENAMES.map(filename=>'Ambience/'+filename),
    music:MUSIC_FILENAMES.map(filename=>'Music/'+filename),
    effectSpecies:SFX_SPECIES_FOLDERS.slice()
  };
}
async function dropboxToken(env,upstreamFetch){
  if(!audioConfigured(env)) throw new Error('media_unconfigured');
  const now=Date.now();
  if(dropboxAccessCache && dropboxAccessCache.expiresAt>now+60000 &&
    dropboxAccessCache.key===env.DROPBOX_APP_KEY &&
    dropboxAccessCache.refresh===env.DROPBOX_REFRESH_TOKEN)
      return dropboxAccessCache.token;
  const body=new URLSearchParams({
    grant_type:'refresh_token',refresh_token:env.DROPBOX_REFRESH_TOKEN,
    client_id:env.DROPBOX_APP_KEY,client_secret:env.DROPBOX_APP_SECRET
  });
  const response=await upstreamFetch('https://api.dropboxapi.com/oauth2/token',{
    method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:body.toString(),redirect:'error'
  });
  if(!response.ok)throw new Error('dropbox_auth_unavailable');
  const data=await response.json();
  if(!data||typeof data.access_token!=='string'||!data.access_token ||
      !Number.isFinite(data.expires_in)||data.expires_in<120)
    throw new Error('dropbox_auth_unavailable');
  dropboxAccessCache={token:data.access_token,key:env.DROPBOX_APP_KEY,
    refresh:env.DROPBOX_REFRESH_TOKEN,expiresAt:now+Math.min(data.expires_in,14400)*1000};
  return data.access_token;
}
async function dropboxListSpecies(env,species,upstreamFetch){
  const token=await dropboxToken(env,upstreamFetch);
  const response=await upstreamFetch('https://api.dropboxapi.com/2/files/list_folder',{
    method:'POST',headers:{
      Authorization:'Bearer '+token,'Content-Type':'application/json'},
    body:JSON.stringify({path:AUDIO_ROOT+'Sound Effects/'+species,recursive:false,limit:2000}),
    redirect:'error'
  });
  if(!response.ok)throw new Error('dropbox_list_unavailable');
  const json=await response.json();
  if(!Array.isArray(json?.entries)||json.has_more===true)
    throw new Error('dropbox_list_incomplete');
  const result=json.entries.filter(file=>file['.tag']==='file' &&
      SFX_FILE.test(file.name) &&
      authorizedAudioPath('Sound Effects/'+species+'/'+file.name))
    .map(file=>'Sound Effects/'+species+'/'+file.name).sort();
  if(!result.length)throw new Error('no_species_effects');
  return result;
}

function hex(buf) {
  return [...new Uint8Array(buf)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function hmacKey(env){
  const raw=new TextEncoder().encode('dinosaur-media-v1:'+env.GAME_TOKEN);
  return crypto.subtle.importKey('raw',raw,{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
}
function signaturePayload(path,exp){
  return new TextEncoder().encode(SIGNED_PREFIX+'\n'+exp+'\n'+path);
}
async function signPath(path,exp,env){
  const bytes=await crypto.subtle.sign('HMAC',await hmacKey(env),signaturePayload(path,exp));
  return hex(bytes);
}
async function verifyPath(path,exp,sig,env){
  if(typeof sig!=='string'||!/^[0-9a-f]{64}$/.test(sig))return false;
  if(!Number.isSafeInteger(exp)||exp<Math.floor(Date.now()/1000) ||
     exp>Math.floor(Date.now()/1000)+MEDIA_TTL_SECONDS+30)return false;
  const bytes=new Uint8Array(sig.match(/.{2}/g).map(x=>parseInt(x,16)));
  return crypto.subtle.verify('HMAC',await hmacKey(env),bytes,signaturePayload(path,exp));
}
async function mediaSignedUrl(path,request,env){
  const exp=Math.floor(Date.now()/1000)+MEDIA_TTL_SECONDS;
  const sig=await signPath(path,exp,env);
  const base=new URL(request.url);
  return {
    url:base.origin+'/v1/media/stream?'+new URLSearchParams({path,exp:String(exp),sig}),
    expires_at:exp,expires_in:MEDIA_TTL_SECONDS
  };
}
async function readSmallJson(request){
  const n=request.headers.get('Content-Length');
  if(n && (!/^\d+$/.test(n)||Number(n)>MAX_MEDIA_JSON_BYTES))return null;
  const chunks=[];let total=0;
  for await(const chunk of request.body||[]){
    total+=chunk.byteLength;
    if(total>MAX_MEDIA_JSON_BYTES)return null;
    chunks.push(chunk);
  }
  let combined='';
  try{
    const decoder=new TextDecoder('utf-8',{fatal:true});
    for(const chunk of chunks)combined+=decoder.decode(chunk,{stream:true});
    combined+=decoder.decode();
    const data=JSON.parse(combined);
    return data&&typeof data==='object'&&!Array.isArray(data)?data:null;
  }catch{return null;}
}
function mediaCorsFor(base) {
  return {...base,'Cache-Control':'private, no-store',Vary:'Origin'};
}
async function dropboxStream(request,path,env,upstreamFetch,headers){
  const range=request.headers.get('Range');
  if(range!==null && !/^bytes=(?:\d+-\d*|-\d+)$/.test(range))
    return errorResponse('invalid_range',416,headers);
  const token=await dropboxToken(env,upstreamFetch);
  const sourceHeaders={'Authorization':'Bearer '+token,
    'Dropbox-API-Arg':asciiHeaderJson({path:AUDIO_ROOT+path})};
  if(range)sourceHeaders.Range=range;
  const upstream=await upstreamFetch('https://content.dropboxapi.com/2/files/download',{
    method:'POST',headers:sourceHeaders,redirect:'error'
  });
  if(![200,206].includes(upstream.status))
    return errorResponse(upstream.status===409?'media_not_found':'media_unavailable',
      upstream.status===409?404:502,headers);
  const outputHeaders=new Headers();
  outputHeaders.set('Content-Type',mediaType(path));
  outputHeaders.set('Cache-Control','private, no-store');
  outputHeaders.set('Vary','Origin');
  outputHeaders.set('X-Content-Type-Options','nosniff');
  outputHeaders.set('Content-Disposition','inline');
  outputHeaders.set('Accept-Ranges','bytes');
  for(const field of ['Content-Length','Content-Range','ETag']){
    const value=upstream.headers.get(field);
    if(value)outputHeaders.set(field,value);
  }
  if(headers['Access-Control-Allow-Origin'])
    outputHeaders.set('Access-Control-Allow-Origin',headers['Access-Control-Allow-Origin']);
  return new Response(upstream.body,{status:upstream.status,headers:outputHeaders});
}
async function limitMediaSigning(env,headers){
  const required=env.GM_REQUIRE_LIMITER===true||env.GM_REQUIRE_LIMITER==='true';
  if(required&&!env.GM_LIMITER)return errorResponse('rate_limiter_unavailable',503,headers);
  if(!env.GM_LIMITER)return null;
  if(typeof env.GM_LIMITER.limit!=='function')
    return errorResponse('rate_limiter_misconfigured',503,headers);
  try{
    const result=await env.GM_LIMITER.limit({key:'single-player-media-authorization'});
    if(!result||typeof result.success!=='boolean')
      return errorResponse('rate_limiter_failed',503,headers);
    return result.success?null:errorResponse('rate_limited',429,
      {...headers,'Retry-After':'60'});
  }catch{return errorResponse('rate_limiter_failed',503,headers);}
}
export async function handleMediaRequest(request,env,upstreamFetch=fetch,baseHeaders={}){
  const route=new URL(request.url).pathname;
  if(!MEDIA_ROUTES.includes(route))return errorResponse('not_found',404,baseHeaders);
  if(request.method==='OPTIONS')
    return new Response(null,{status:204,headers:baseHeaders});
  if(route==='/v1/media/stream'){
    if(request.method!=='GET')return errorResponse('method_not_allowed',405,baseHeaders);
    if(!env?.GAME_TOKEN)return errorResponse('service_not_configured',503,baseHeaders);
    const url=new URL(request.url);
    const path=url.searchParams.get('path'),exp=Number(url.searchParams.get('exp'));
    const sig=url.searchParams.get('sig');
    if(!authorizedAudioPath(path)||!await verifyPath(path,exp,sig,env))
      return errorResponse('media_access_denied',403,baseHeaders);
    if(!audioConfigured(env))return errorResponse('media_unconfigured',503,baseHeaders);
    try{return await dropboxStream(request,path,env,upstreamFetch,mediaCorsFor(baseHeaders));}
    catch{return errorResponse('media_unavailable',502,baseHeaders);}
  }
  if(!['GET','POST'].includes(request.method))
    return errorResponse('method_not_allowed',405,baseHeaders);
  if(!audioConfigured(env))return errorResponse('media_unconfigured',503,baseHeaders);
  const authorization=request.headers.get('Authorization')||'';
  if(!authorization.startsWith('Bearer ')||
     !matchToken(authorization.slice(7),env.GAME_TOKEN))
    return errorResponse('unauthorized',401,baseHeaders);
  if(route==='/v1/media/status'&&request.method==='GET')
    return mediaJson({ready:true,dropbox_credentials_configured:true,
      audio_files_verified:false,stream_verified:false},200,baseHeaders);
  if(route==='/v1/media/library'&&request.method==='GET')
    return mediaJson(mediaCatalog(),200,baseHeaders);
  if(request.method!=='POST'||!['/v1/media/sign','/v1/media/effect'].includes(route))
    return errorResponse('method_not_allowed',405,baseHeaders);
  const limited=await limitMediaSigning(env,baseHeaders);
  if(limited)return limited;
  if(!/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type')||''))
    return errorResponse('expected_json',415,baseHeaders);
  const data=await readSmallJson(request);
  if(!data)return errorResponse('invalid_request_payload',400,baseHeaders);
  if(route==='/v1/media/sign'){
    if(typeof data.path!=='string'||!authorizedAudioPath(data.path))
      return errorResponse('invalid_media_path',400,baseHeaders);
    return mediaJson({path:data.path,...await mediaSignedUrl(data.path,request,env)},200,baseHeaders);
  }
  const species=data.species,seed=data.seed;
  if(typeof species!=='string'||!ALLOW_SPECIES.has(species) ||
     !Number.isSafeInteger(seed)||seed<0||seed>2**31)
    return errorResponse('invalid_species_request',400,baseHeaders);
  try{
    const paths=await dropboxListSpecies(env,species,upstreamFetch);
    const path=paths[seed%paths.length];
    return mediaJson({path,species,...await mediaSignedUrl(path,request,env)},200,baseHeaders);
  }catch{
    return errorResponse('media_unavailable',502,baseHeaders);
  }
}
