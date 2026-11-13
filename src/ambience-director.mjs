/**
 * DHR-078 / MEDIA-01: Pure, nonplaying Mother/GM ambience director.
 * The allowlist comes from media/ambience-approved.v1.json; never import
 * Dropbox credentials, hosted media URLs or raw GM world state here.
 */
export const AMBIENCE_SCHEMA_VERSION = 1;
const BIOMES = new Set(['jungle','forest','swamp','cave','coast','sea','desert','volcanic','meadow','interior','river','taiga']);
const WEATHER = new Set(['clear','rain','storm','wind','snow']);
const TIMES = new Set(['day','night','dusk']);
const CONTEXTS = new Set(['open','camp','interior','ruins','ship','shelter','cave']);
const MOODS = new Set(['normal','eerie','tense','awe']);
const INTENSITIES = new Set(['low','medium','high']);
const TRACK_FIELDS = ['id','title','album','trackNumber','filename','kind','tags',
  'intensity','loop','gainDb','fadeMs','requiresAudibleCreatureCue','approved'];
const SAFE_TAG = /^[a-z][a-z0-9-]{0,49}$/;

function plainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
function boundNumber(value, min, max, fallback) {
  return Number.isFinite(value) && value >= min && value <= max ? value : fallback;
}
function silence(reason = 'intentional-silence', fadeMs = 3500) {
  return Object.freeze({type:'silence', reason, fadeMs});
}

/**
 * Throw closed for malformed metadata. A missing track is never an invitation
 * for Mother/GM to supply an unregistered URL or filename.
 */
export function createAmbienceRegistry(manifest) {
  if (!plainObject(manifest) || manifest.schemaVersion !== AMBIENCE_SCHEMA_VERSION ||
      !Array.isArray(manifest.tracks) || manifest.tracks.length !== manifest.approvedCount ||
      manifest.approvedCount + manifest.excludedCount !== manifest.reviewedCount ||
      manifest.policy?.allowlistOnly !== true ||
      manifest.storage?.provider !== 'dropbox' ||
      manifest.storage?.playbackUrlsStored !== false) {
    throw new TypeError('Invalid curated ambience manifest');
  }
  const ids = new Set();
  const filenames = new Set();
  const tracks = manifest.tracks.map(raw => {
    if (!plainObject(raw) || Object.keys(raw).some(field => !TRACK_FIELDS.includes(field)) ||
        TRACK_FIELDS.some(field => !(field in raw)) ||
        typeof raw.id !== 'string' || !/^amb-v[1-8]-\d{2}$/.test(raw.id) ||
        typeof raw.title !== 'string' || !raw.title.trim() ||
        typeof raw.album !== 'string' || !/^RPG Ambiences Vol\. [1-8]$/.test(raw.album) ||
        !Number.isInteger(raw.trackNumber) || raw.trackNumber < 1 || raw.trackNumber > 50 ||
        raw.kind !== 'ambience' || raw.approved !== true ||
        typeof raw.filename !== 'string' || !/^Michael Ghelfi - RPG Ambiences Vol\. [1-8] - \d{2} .+\.ogg$/.test(raw.filename) ||
        raw.filename.includes('/') || raw.filename.includes('\\') ||
        !Array.isArray(raw.tags) || raw.tags.some(tag => typeof tag !== 'string' || !SAFE_TAG.test(tag)) ||
        !INTENSITIES.has(raw.intensity) || raw.loop !== 'unchecked' ||
        !Number.isFinite(raw.gainDb) || raw.gainDb < -36 || raw.gainDb > 0 ||
        !Number.isInteger(raw.fadeMs) || raw.fadeMs < 0 || raw.fadeMs > 20000 ||
        typeof raw.requiresAudibleCreatureCue !== 'boolean') {
      throw new TypeError('Unsafe or malformed ambience track');
    }
    const albumNumber = Number(raw.album.slice(-1));
    const id = 'amb-v' + albumNumber + '-' + String(raw.trackNumber).padStart(2,'0');
    const filename = 'Michael Ghelfi - ' + raw.album + ' - ' +
      String(raw.trackNumber).padStart(2,'0') + ' ' + raw.title + '.ogg';
    if (raw.id !== id || raw.filename !== filename || ids.has(id) || filenames.has(filename)) {
      throw new TypeError('Ambience identity mismatch or duplicate');
    }
    ids.add(id);
    filenames.add(filename);
    return Object.freeze({...raw, tags:Object.freeze([...new Set(raw.tags)])});
  });
  if (!ids.has(manifest.policy.defaultJungleId) ||
      tracks.find(t => t.id === manifest.policy.defaultJungleId)?.title !== 'Jungle' ||
      manifest.policy.creatureVocalizationRequiresCommittedAudibleCue !== true ||
      manifest.policy.unknownTrack !== 'deny' ||
      manifest.policy.rejectedAbandonedShackWind !== 'deny') {
    throw new TypeError('Mandatory conservative audio policy missing');
  }
  const byId = Object.create(null);
  tracks.forEach(t => { byId[t.id] = t; });
  return Object.freeze({catalogId:manifest.catalogId, tracks:Object.freeze(tracks),
    byId:Object.freeze(byId), rights:Object.freeze({...manifest.rights})});
}

function sceneInput(scene) {
  if (!plainObject(scene) || scene.committed !== true || scene.silence === true)
    return null;
  if (!BIOMES.has(scene.biome) || !WEATHER.has(scene.weather) ||
      !TIMES.has(scene.timeOfDay) || !CONTEXTS.has(scene.context) ||
      !MOODS.has(scene.mood)) return null;
  return {
    biome:scene.biome, weather:scene.weather, timeOfDay:scene.timeOfDay,
    context:scene.context, mood:scene.mood,
    // Only a trusted committed public observation may set this true.
    audibleCreatureCue:scene.audibleCreatureCue === true
  };
}
function eligible(track, scene) {
  const ts = new Set(track.tags);
  if (track.requiresAudibleCreatureCue && !scene.audibleCreatureCue) return false;
  if (ts.has('snow') && scene.weather !== 'snow') return false;
  if (ts.has('storm') && !['storm','snow'].includes(scene.weather)) return false;
  if (ts.has('rain') && !['rain','storm'].includes(scene.weather)) return false;
  if (ts.has('wind') && !['wind','storm','snow'].includes(scene.weather)) return false;
  if (ts.has('night') && scene.timeOfDay === 'day') return false;
  if (/daytime/i.test(track.title) && scene.timeOfDay === 'night') return false;
  if (ts.has('camp') && scene.context !== 'camp') return false;
  if (ts.has('ruins') && scene.context !== 'ruins') return false;
  if (ts.has('fire') && scene.context !== 'camp' && scene.mood !== 'tense' &&
      !['volcanic'].includes(scene.biome)) return false;
  if (track.intensity === 'high' && scene.mood === 'normal' &&
      !['storm','snow'].includes(scene.weather)) return false;
  // Refuse unrelated landscapes. Generic weather beds may overlay any biome.
  const sameBiome = ts.has(scene.biome) ||
    (scene.biome === 'taiga' && ts.has('forest')) ||
    (scene.biome === 'river' && (ts.has('forest') || ts.has('coast'))) ||
    (scene.biome === 'interior' && ts.has('interior')) ||
    (scene.biome === 'sea' && ts.has('coast')) ||
    (scene.biome === 'coast' && ts.has('sea')) ||
    (scene.biome === 'cave' && ts.has('interior'));
  const genericWeather = ts.has('rain') && !['jungle','forest','swamp','cave','coast',
    'sea','desert','volcanic','meadow','river'].some(b => ts.has(b));
  if (!sameBiome && !genericWeather) return false;
  if (scene.context === 'interior' || scene.context === 'shelter') {
    if (ts.has('rain') && !ts.has('interior')) return false;
  }
  if (scene.context === 'ship' && !ts.has('sea') && !ts.has('coast')) return false;
  if (track.requiresAudibleCreatureCue && scene.mood === 'normal') return false;
  return true;
}
function scoreTrack(track, scene) {
  const tags = new Set(track.tags);
  let score = tags.has(scene.biome) ? 20 : 6;
  if (tags.has('night')) score += scene.timeOfDay === 'night' ? 9 : 3;
  if (tags.has('rain')) score += scene.weather === 'storm' || scene.weather === 'rain' ? 10 : 0;
  if (tags.has('wind')) score += 4;
  if (tags.has('storm')) score += 4;
  if (tags.has('camp')) score += 11;
  if (tags.has('interior') && ['interior','shelter'].includes(scene.context)) score += 10;
  if (tags.has('ruins') && scene.context === 'ruins') score += 10;
  if (track.intensity === 'low') score += scene.mood === 'normal' ? 8 : 1;
  if (track.intensity === 'medium') score += scene.mood === 'eerie' ? 10 : 0;
  if (track.intensity === 'high') score += scene.mood === 'tense' ? 6 : -8;
  if (scene.mood === 'normal' && /mysterious|dark|haunted|gloom/i.test(track.title)) score -= 6;
  if (scene.mood === 'eerie' && /mysterious|dark|haunted|gloom/i.test(track.title)) score += 8;
  return score;
}

/**
 * The entire scene argument MUST originate from a validated player-visible,
 * committed projection (never from a private GM plan). Unknown fields are
 * intentionally ignored; only typed public descriptors affect selection.
 */
export function proposeAmbienceCue(registry, {scene, requestedId = null,
  previousTrackId = null, settings = {}} = {}) {
  if (!registry || !registry.byId || !registry.tracks) throw new TypeError('Missing registry');
  if (settings?.enabled === false || settings?.muted === true ||
      settings?.volume === 0) return silence('player-audio-disabled');
  const publicScene = sceneInput(scene);
  if (!publicScene) return silence('no-committed-public-scene');
  let chosen;
  if (requestedId !== null) {
    if (typeof requestedId !== 'string' || !Object.hasOwn(registry.byId,requestedId))
      return silence('unapproved-cue');
    chosen = registry.byId[requestedId];
    if (!eligible(chosen,publicScene)) return silence('unearned-or-mismatched-cue');
  } else {
    const candidates = registry.tracks.filter(t => eligible(t,publicScene))
      .sort((a,b) => scoreTrack(b,publicScene) - scoreTrack(a,publicScene) ||
        a.id.localeCompare(b.id));
    chosen = candidates[0];
  }
  if (!chosen) return silence('no-suitable-approved-bed');
  if (previousTrackId === chosen.id)
    return Object.freeze({type:'hold',trackId:chosen.id,reason:'continuous-scene-bed'});
  return Object.freeze({
    type:'ambience', trackId:chosen.id, assetKey:chosen.filename,
    fadeMs:chosen.fadeMs, gainDb:chosen.gainDb, duckDuringNarrationDb:-8,
    loopRequested:true, loopVerified:false, reason:requestedId?'approved-gm-proposal':'public-scene-match'
  });
}

/** Returns a bounded, URL-free directive. Audio handles stay in a trusted resolver. */
export function playbackDirective(cue, {volume=0.35, muted=false, narrating=false} = {}) {
  if (!cue || cue.type === 'silence' || muted || volume === 0)
    return silence('muted-or-silent');
  if (cue.type === 'hold') return SAFE_CUE_ID.test(cue.trackId)
    ? Object.freeze({type:'hold',trackId:cue.trackId}) : silence('invalid-hold');
  if (cue.type !== 'ambience' || !SAFE_CUE_ID.test(cue.trackId) ||
      !safeTrackAssetBinding(cue.trackId,cue.assetKey) ||
      !Number.isFinite(cue.gainDb) || cue.gainDb < -36 || cue.gainDb > 0 ||
      !Number.isFinite(cue.duckDuringNarrationDb) ||
      cue.duckDuringNarrationDb > 0 || cue.duckDuringNarrationDb < -24 ||
      !Number.isInteger(cue.fadeMs) || cue.fadeMs < 0 || cue.fadeMs > 20000 ||
      cue.loopRequested !== true) return silence('invalid-cue');
  const safeVolume = boundNumber(volume,0,1,0.35);
  const adjusted = cue.gainDb + 20*Math.log10(safeVolume) +
    (narrating ? cue.duckDuringNarrationDb : 0);
  return Object.freeze({type:'play',trackId:cue.trackId,assetKey:cue.assetKey,
    gainDb:Math.max(-60,Number(adjusted.toFixed(1))),
    fadeMs:cue.fadeMs,loopRequested:cue.loopRequested,loopVerified:false});
}
const SAFE_CUE_ID = /^amb-v[1-8]-\d{2}$/;
function safeTrackAssetBinding(trackId, assetKey) {
  if (typeof assetKey !== 'string') return false;
  const match = /^Michael Ghelfi - RPG Ambiences Vol\. ([1-8]) - (\d{2}) ([^/\\]+)\.ogg$/.exec(assetKey);
  return Boolean(match && trackId === 'amb-v' + match[1] + '-' + match[2]);
}

/** Test/dry-run transport: missing media is silence, never invented playback. */
export function mockPlayback(directive, {availableAssetKeys=new Set(), transitions=[]} = {}) {
  if (directive?.type === 'hold') return Object.freeze({status:'holding',trackId:directive.trackId});
  if (directive?.type !== 'play') {
    transitions.push({type:'silence'});
    return Object.freeze({status:'silent'});
  }
  if (!availableAssetKeys.has(directive.assetKey)) {
    transitions.push({type:'silence'});
    return Object.freeze({status:'silent',reason:'missing-asset-binding'});
  }
  transitions.push({type:'crossfade',trackId:directive.trackId,gainDb:directive.gainDb,
    fadeMs:directive.fadeMs});
  return Object.freeze({status:'mock-playing',trackId:directive.trackId});
}
