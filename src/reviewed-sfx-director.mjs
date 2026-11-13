/**
 * DHR-080 / MEDIA-03: Pure, deterministic reviewed dinosaur SFX selection.
 *
 * Feed only a private, compiled, user-approved metadata catalog and a trusted
 * committed, player-audible projection from the game engine. A browser flag
 * claiming "committed" is NOT security proof; integration must authenticate
 * that projection on the server. This module never fetches Dropbox or plays
 * sounds, reads saves, or accepts private Dropbox share URLs.
 */
export const REVIEWED_SFX_SCHEMA_VERSION='dhr.audio-cue-catalog.v1';

const ID=/^sfx\.[a-z0-9_.-]{3,100}$/;
const FOLDER=/^[A-Za-z0-9_]{1,90}$/;
const FILE=/^[A-Za-z0-9_-]{1,120}\.(?:wav|ogg|mp3)$/;
const PATH=/^Sound Effects\/([A-Za-z0-9_]+)\/([A-Za-z0-9_-]+\.(?:wav|ogg|mp3))$/;
const INTENT_WORDS=Object.freeze({
  warning:/\b(?:warn\w*|alarm\w*|challeng\w*|threat\w*|defens\w*|display\w*|alert\w*)\b/i,
  investigating:/\b(?:investigat\w*|inspect\w*|search\w*|orient\w*|curio\w*|approach\w*|listen\w*|explor\w*|question\w*)\b/i,
  aggression:/\b(?:attack\w*|aggress\w*|charg\w*|lung\w*|strik\w*|snap\w*|snarl\w*|bit\w*|roar\w*)\b/i,
  injury:/\b(?:pain\w*|injur\w*|wound\w*|hurt\w*|distress\w*|scream\w*|cries|crying|whimper\w*)\b/i,
  contact:/\b(?:call\w*|contact\w*|answer\w*|respond\w*|communicat\w*|vocaliz\w*|bellow\w*)\b/i,
  presence:/\b(?:breath\w*|snort\w*|rumbl\w*|growl\w*|grunt\w*|exhal\w*|pant\w*)\b/i,
  movement:/\b(?:footstep\w*|step\w*|stomp\w*|walk\w*|run\w*|shuffl\w*|rustl\w*|mov\w*)\b/i
});
const VALID_INTENTS=new Set(Object.keys(INTENT_WORDS));
const ENTRY_FIELDS=new Set(['id','kind','species','shared','trackNumber',
  'ageLabel','ageVerifiedFromAudio','repeatPattern','description',
  'descriptionType','fileName','dropboxRelativePath','durationSeconds',
  'source','intentTags','approved']);
const DISTANCE_DB=Object.freeze({near:0,medium:-6,far:-13});
const EMPTY=Object.freeze([]);
function object(value){return value!==null && typeof value==='object' && !Array.isArray(value);}
function silent(reason){return Object.freeze({type:'silence',reason});}
function plainString(value,max=1000){
  return typeof value==='string' && value.length>0 && value.length<=max &&
    !/[\u0000-\u001f\u007f]/.test(value);
}
function sourceValid(source){
  return object(source) && plainString(source.workbook,180) &&
    plainString(source.sheet,100) && Number.isInteger(source.row) &&
    source.row>=2 && source.row<=100000;
}
function safeMetadataText(value){
  return value===null || value===undefined ||
    (plainString(value,1600) && !/(?:https?:\/\/|rlkey=|DROPBOX_REFRESH_TOKEN|GAME_TOKEN)/i.test(value));
}
/**
 * The allowlist must come from a trusted Worker-side inventory, not from
 * the worksheet itself. This is authorization to SELECT, not authorization
 * to stream; the media gateway must still re-check its own asset allowlist.
 */
export function createReviewedSfxRegistry(manifest,{authorizedPaths}={}){
  if(!object(manifest) ||
    manifest.schemaVersion!==REVIEWED_SFX_SCHEMA_VERSION ||
    manifest.policy?.defaultDeny!==true ||
    manifest.policy?.includeOnlyUseYes!==true ||
    !Array.isArray(manifest.entries) || manifest.entries.length>20000 ||
    !Number.isInteger(manifest.counts?.approvedEntries) ||
    manifest.counts.approvedEntries!==manifest.entries.length ||
    !(authorizedPaths instanceof Set) || !authorizedPaths.size)
    throw new TypeError('Missing reviewed manifest or trusted allowlist');

  const ids=new Set(),paths=new Set(),tracks=[];
  for(const raw of manifest.entries){
    if(!object(raw) || !['sfx','ambience','music'].includes(raw.kind))
      throw new TypeError('Unknown reviewed audio row kind');
    if(raw.kind!=='sfx') continue; // Other kinds have their own controllers.
    const m=PATH.exec(raw.dropboxRelativePath||'');
    if(Object.keys(raw).some(field=>!ENTRY_FIELDS.has(field)) ||
      !ID.test(raw.id||'') || !m || !FOLDER.test(m[1]) ||
      !FILE.test(m[2]) || raw.fileName!==m[2] ||
      raw.species!==m[1] || !FOLDER.test(raw.species||'') ||
      typeof raw.shared!=='boolean' || typeof raw.repeatPattern!=='boolean' ||
      (raw.approved!==undefined && raw.approved!==true) ||
      !safeMetadataText(raw.description) || !sourceValid(raw.source) ||
      !(raw.durationSeconds===undefined || raw.durationSeconds===null ||
        (Number.isFinite(raw.durationSeconds) &&
         raw.durationSeconds>0 && raw.durationSeconds<=600)) ||
      (raw.ageVerifiedFromAudio!==undefined &&
       typeof raw.ageVerifiedFromAudio!=='boolean') ||
      (raw.ageLabel!==undefined && raw.ageLabel!==null &&
       !plainString(raw.ageLabel,48)) ||
      !authorizedPaths.has(raw.dropboxRelativePath) ||
      ids.has(raw.id) || paths.has(raw.dropboxRelativePath)){
      throw new TypeError('Unapproved, duplicate or malformed reviewed SFX');
    }
    const intentTags=raw.intentTags??EMPTY;
    if(!Array.isArray(intentTags) || intentTags.some(i=>!VALID_INTENTS.has(i)) ||
       new Set(intentTags).size!==intentTags.length)
      throw new TypeError('Invalid reviewed cue intent tags');
    ids.add(raw.id);paths.add(raw.dropboxRelativePath);
    const track=Object.freeze({
      id:raw.id,assetKey:raw.dropboxRelativePath,species:raw.species,
      shared:raw.shared,description:raw.description||'',
      intentTags:Object.freeze([...intentTags]),
      durationSeconds:raw.durationSeconds??null,repeatPattern:raw.repeatPattern,
      ageLabel:raw.ageLabel??null,ageVerifiedFromAudio:raw.ageVerifiedFromAudio===true,
      source:Object.freeze({workbook:raw.source.workbook,sheet:raw.source.sheet,row:raw.source.row})
    });
    tracks.push(track);
  }
  const byId=Object.create(null);
  for(const track of tracks) byId[track.id]=track;
  return Object.freeze({tracks:Object.freeze(tracks),byId:Object.freeze(byId)});
}
/**
 * This projection is a *trust boundary contract*, not client authentication.
 * The caller MUST create it server-side from a committed player-observable
 * sound event; private GM plans and user-entered text must never be adapted.
 */
function publicAudibleEvent(event){
  if(!object(event) || event.committed!==true ||
     event.playerAudible!==true || event.eventType!=='creature-sound' ||
     !plainString(event.eventId,120) || !FOLDER.test(event.species||'') ||
     !VALID_INTENTS.has(event.intent) ||
     !Object.hasOwn(DISTANCE_DB,event.distance)) return null;
  if(event.sharedGroup!==undefined && event.sharedGroup!==null &&
     !FOLDER.test(event.sharedGroup)) return null;
  return {
    eventId:event.eventId,species:event.species,sharedGroup:event.sharedGroup??null,
    intent:event.intent,distance:event.distance
  };
}
function matchesIntent(track,intent){
  if(track.intentTags.includes(intent)) return {match:true,reviewed:true};
  if(track.description && INTENT_WORDS[intent].test(track.description))
    return {match:true,reviewed:false};
  return {match:false,reviewed:false};
}
function hash32(text){
  let h=2166136261;
  for(let i=0;i<text.length;i++){
    h^=text.charCodeAt(i);
    h=Math.imul(h,16777619);
  }
  return h>>>0;
}
/**
 * A deterministic recommendation, NEVER a random Dropbox folder pick.
 * A cue can only be selected for a matching committed audible creature
 * event, matching exact species (or explicitly permitted shared group).
 */
export function proposeReviewedSfxCue(registry,{
  event,requestedId=null,recentCueIds=[],lastEventId=null,settings={}
}={}){
  if(!registry || !Array.isArray(registry.tracks) || !registry.byId)
    throw new TypeError('Missing reviewed SFX registry');
  if(settings?.muted===true || settings?.enabled===false ||
     settings?.volume===0 || event?.silence===true)
    return silent('audio-disabled-or-silence');
  const heard=publicAudibleEvent(event);
  if(!heard) return silent('no-committed-player-audible-creature-event');
  if(lastEventId===heard.eventId)
    return Object.freeze({type:'hold',eventId:heard.eventId,reason:'already-presented-event'});
  if(!Array.isArray(recentCueIds) || recentCueIds.length>32 ||
     recentCueIds.some(id=>typeof id!=='string'))
    return silent('invalid-recent-cue-history');
  if(requestedId!==null &&
     (typeof requestedId!=='string' || !Object.hasOwn(registry.byId,requestedId)))
    return silent('unapproved-requested-cue');

  const candidates=(requestedId===null?registry.tracks:[registry.byId[requestedId]])
    .filter(t=>(t.species===heard.species && !t.shared) ||
      (t.shared && t.species===heard.sharedGroup))
    .map(t=>({track:t,match:matchesIntent(t,heard.intent)}))
    .filter(x=>x.match.match && !recentCueIds.includes(x.track.id))
    .map(x=>({
      ...x,
      score:(x.track.species===heard.species?100:20)+
        (x.match.reviewed?40:10)+
        (x.track.repeatPattern?-4:0)
    }))
    .sort((a,b)=>b.score-a.score ||
      hash32(heard.eventId+'|'+a.track.id)-hash32(heard.eventId+'|'+b.track.id) ||
      a.track.id.localeCompare(b.track.id));
  const chosen=candidates[0]?.track;
  if(!chosen)return silent('no-matching-approved-cue');
  const durationMs=chosen.durationSeconds===null?8000:
    Math.round(chosen.durationSeconds*1000);
  // Repeated files need later auditioned segment boundaries. Never loop a whole
  // repetitive vocalization automatically; cap first presentation to 4.5s.
  const stopAfterMs=Math.min(durationMs,chosen.repeatPattern?4500:12000);
  return Object.freeze({
    type:'sfx',cueId:chosen.id,assetKey:chosen.assetKey,
    eventId:heard.eventId,stopAfterMs,gainDb:DISTANCE_DB[heard.distance],
    repeat:false,reason:'reviewed-visible-audio-event'
  });
}
