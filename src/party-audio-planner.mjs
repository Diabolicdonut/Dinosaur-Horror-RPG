/**
 * DHR MEDIA-01 playback handoff. Pure and source-agnostic.
 * The user's 15,255 existing Dropbox links are imported into *local browser storage*;
 * this public repository must never contain private /scl/fi/ URLs or rlkey values.
 */
export const AUDIO_IMPORT_SCHEMA = 1;
export const AUDIO_CATALOG_LIMIT = 20000;
const MAX_INPUT_CHARS = 12_000_000;
const AUDIO_FILE = /\.(?:ogg|mp3|wav)$/i;
const DROPBOX_HOSTS = new Set(['www.dropbox.com','dropbox.com']);

export function validLinkedAudioUrl(value) {
  if (typeof value !== 'string' || value.length > 2000) return false;
  let url;
  try { url = new URL(value); } catch { return false; }
  if (url.protocol !== 'https:' || !DROPBOX_HOSTS.has(url.hostname) ||
      url.username || url.password || url.port ||
      !/^\/(?:scl\/fi|s)\/[A-Za-z0-9_-]+\/[^/]+$/.test(url.pathname) ||
      url.searchParams.get('raw') !== '1') return false;
  return true;
}

export function classifyAudioPath(path) {
  if (typeof path !== 'string' || path.length > 400 ||
      path.includes('\\') || path.includes('..') || /[?#<>"'\u0000-\u001f]/.test(path) ||
      !AUDIO_FILE.test(path)) return null;
  if (/^Ambience\/[^/]+\.ogg$/i.test(path)) return {kind:'ambience',species:null};
  if (/^Music\/[A-Za-z0-9_-]+\.mp3$/i.test(path)) return {kind:'music',species:null};
  const sfx = /^Sound Effects\/([A-Za-z0-9_]+)\/([A-Za-z0-9_-]+\.(?:wav|ogg|mp3))$/i.exec(path);
  return sfx ? {kind:'sfx',species:sfx[1]} : null;
}

function parseCsv(data) {
  const rows=[];
  let row=[],v='',quoted=false;
  for(let i=0;i<data.length;i++){
    const ch=data[i];
    if(ch==='"'){
      if(quoted && data[i+1]==='"'){v+='"';i++;}
      else quoted=!quoted;
    }else if(ch===','&&!quoted){row.push(v);v='';}
    else if((ch==='\n'||ch==='\r')&&!quoted){
      if(ch==='\r'&&data[i+1]==='\n')i++;
      row.push(v);rows.push(row);row=[];v='';
    }else v+=ch;
  }
  if(quoted)throw new TypeError('CSV contains unclosed quotes');
  if(v||row.length){row.push(v);rows.push(row);}
  const header=rows.shift()?.map(v=>v.trim().toLowerCase())||[];
  const pathIx=header.findIndex(v=>['path','relative_path','file_path','filename'].includes(v));
  const urlIx=['audio_url','raw_url','url','dropbox_link','download_url'].map(v=>header.indexOf(v)).find(i=>i>=0)??-1;
  if(pathIx<0||urlIx<0)throw new TypeError('CSV requires path and audio_url columns');
  return rows.map(r=>[r[pathIx],r[urlIx]]);
}

/**
 * Supports the user's previous Dinosaur_Horror_Audio_Demo_Complete_15255(1).html,
 * an equivalent [path,url] JSON, or their original audio links CSV.
 */
export function parseDropboxAudioLinks(text, approvedFilenames) {
  if(typeof text!=='string' || text.length>MAX_INPUT_CHARS) throw new TypeError('Invalid audio link file');
  if(!(approvedFilenames instanceof Set)) throw new TypeError('Approved ambience filename allowlist required');
  let source=text.trim();
  if(source.startsWith('<')){
    const match=/<script\b[^>]*\bid=["']seed-data["'][^>]*>([\s\S]*?)<\/script\s*>/i.exec(source);
    if(!match)throw new TypeError('Missing seed-data audio catalog');
    source=match[1];
  }
  let records;
  if(source.startsWith('[')||source.startsWith('{')){
    const parsed=JSON.parse(source);
    records=Array.isArray(parsed)?parsed:parsed.pairs;
    if(!Array.isArray(records))throw new TypeError('Missing [path, audio_url] records');
  }else records=parseCsv(source);
  if(records.length > AUDIO_CATALOG_LIMIT) throw new TypeError('Oversized audio catalog');
  const byPath = new Map(),counts={ambience:0,music:0,sfx:0,excludedAmbience:0,invalid:0};
  for(const entry of records){
    if(!Array.isArray(entry)||entry.length<2){counts.invalid++;continue;}
    const path=entry[0],link=entry[1],classification=classifyAudioPath(path);
    if(!classification || !validLinkedAudioUrl(link)){counts.invalid++;continue;}
    if(classification.kind==='ambience' && !approvedFilenames.has(path.slice('Ambience/'.length))){
      counts.excludedAmbience++;continue;
    }
    if(byPath.has(path)) {counts.invalid++;continue;}
    byPath.set(path,link);
    counts[classification.kind]++;
  }
  const species={};
  for(const path of byPath.keys()){
    const c=classifyAudioPath(path);
    if(c?.kind==='sfx') (species[c.species]??=[]).push(path);
  }
  for(const values of Object.values(species))values.sort();
  const pairs=[...byPath.entries()];
  return {
    schemaVersion:AUDIO_IMPORT_SCHEMA,pairs,counts,species,
    music:pairs.filter(([p])=>p.startsWith('Music/')).map(([p])=>p).sort(),
    acceptedCount:pairs.length
  };
}

const ROOM_INDOOR=/\b(?:building|visitor|center|control|station|lab|laboratory|facility|office|terminal|shed|shack|bunker|shelter|tunnel|generator|interior|outpost|maintenance|storeroom|storage|garage)\b/i;
const ROOM_CAVE=/\b(?:cave|cavern|grotto|underground)\b/i;
const ROOM_SWAMP=/\b(?:swamp|marsh|mangrove|wetland)\b/i;
const ROOM_COAST=/\b(?:coast|shore|beach|estuary|dock|harbor|cove|sea|islet)\b/i;
const ROOM_RIVER=/\b(?:river|stream|creek|falls|waterfall)\b/i;
const ROOM_FOREST=/\b(?:forest|woods|woodland|ridge|upland|highland)\b/i;
const ROOM_MEADOW=/\b(?:meadow|grassland|plain|savannah|field)\b/i;

export function publicAudioScene(view) {
  if(!view||typeof view!=='object'||typeof view.roomName!=='string'||typeof view.location!=='string')
    return null;
  const room=view.roomName+' '+view.location;
  const weather=view.weather==='squall'?'storm':
    ['rain','storm','wind','snow'].includes(view.weather)?view.weather:'clear';
  const names=(view.visibleDinosaurs||[]).map(d=>typeof d==='string'?d:d?.kind).filter(Boolean);
  const biome=ROOM_CAVE.test(room)?'cave':ROOM_SWAMP.test(room)?'swamp':
    ROOM_COAST.test(room)?'coast':ROOM_RIVER.test(room)?'river':
    ROOM_INDOOR.test(room)?'interior':ROOM_MEADOW.test(room)?'meadow':
    ROOM_FOREST.test(room)?'forest':'jungle';
  const context=ROOM_INDOOR.test(room)?'interior':ROOM_CAVE.test(room)?'cave':'open';
  return {
    committed:true,biome,weather,timeOfDay:'day',context,
    mood:view.combat&&names.length?'tense':view.wildlifeEncounter?'awe':'normal',
    // Visible dinosaurs are NOT enough to assert a sound. No offscreen clues.
    audibleCreatureCue:false
  };
}
export function speciesFromVisibleView(view) {
  const names=(view?.visibleDinosaurs||[]).map(d=>typeof d==='string'?d:d?.kind).filter(Boolean);
  const wildlife=view?.wildlifeEncounter?.title;
  if(typeof wildlife==='string')names.push(wildlife);
  return [...new Set(names.map(n=>n.replace(/[^a-z]/gi,'').toLowerCase()).filter(Boolean))];
}
export function chooseSpeciesSound(view, library) {
  if(!view||!library?.species || !Array.isArray(view.events))return null;
  const last=view.events.at(-1);
  if(last?.category!=='danger' || !Number.isInteger(view.beat) || last.beat!==view.beat)
    return null;
  const visible=speciesFromVisibleView(view);
  const folders=Object.keys(library.species).sort();
  const aliases={raptor:'Velociraptor',trex:'TRex',tiranosaurus:'TRex',
    compsognathus:'Compsognathus',parasaurolophus:'Parasaurolophus'};
  for(const name of visible){
    const folder=aliases[name]||folders.find(f=>f.replace(/[^a-z]/gi,'').toLowerCase()===name);
    const sounds=library.species[folder];
    if(sounds?.length){
      const index=((view.beat*7 + String(last.message||'').length)>>>0)%sounds.length;
      return sounds[index];
    }
  }
  return null;
}
export function chooseMusicCue(view, musicList) {
  if(!view||!Array.isArray(musicList))return null;
  const available=new Set(musicList);
  const event=view.events?.at(-1);
  let name=null;
  if(view.outcome==='rescued') name='final_rescue';
  else if(view.outcome==='lost') name='personal_loss';
  else if(event?.beat===view.beat && event?.category==='wonder') name='brief_wonder';
  else if(event?.beat===view.beat && event?.category==='danger' && view.combat) name='brief_impact';
  return name && available.has('Music/'+name+'.mp3')?'Music/'+name+'.mp3':null;
}
export function publicAudioSignature(view) {
  const e=view?.events?.at(-1);
  return [
    view?.adventureId||'legacy',view?.actorId||'',view?.beat??'',
    e?.beat??'',e?.actorId??'',e?.category??'',e?.message??'',view?.outcome??''
  ].join('|').slice(0,1500);
}
