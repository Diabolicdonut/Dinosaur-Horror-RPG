import {createAmbienceRegistry, proposeAmbienceCue} from './ambience-director.mjs';
import {
  parseDropboxAudioLinks, publicAudioScene, chooseMusicCue,
  chooseSpeciesSound, publicAudioSignature
} from './party-audio-planner.mjs';

const DB_NAME='dhr-local-audio-links-v1',DB_STORE='catalogs',DB_KEY='current';
const SETTINGS_KEY='dhr-party-audio-controls-v1';
const DEFAULTS={muted:false,ambience:0.46,music:0.29,effects:0.48,autoMusic:true,autoEffects:true};
const $=id=>document.getElementById(id);

function dbOpen(){
  return new Promise((resolve,reject)=>{
    if(!('indexedDB' in window)){reject(new Error('IndexedDB unavailable'));return;}
    const req=indexedDB.open(DB_NAME,1);
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(DB_STORE))
      req.result.createObjectStore(DB_STORE);};
    req.onerror=()=>reject(req.error);
    req.onsuccess=()=>resolve(req.result);
  });
}
async function dbRead(){
  const db=await dbOpen();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(DB_STORE,'readonly'),rq=tx.objectStore(DB_STORE).get(DB_KEY);
    rq.onsuccess=()=>resolve(rq.result??null);
    rq.onerror=()=>reject(rq.error);
    tx.oncomplete=()=>db.close();
    tx.onerror=()=>db.close();
  });
}
async function dbWrite(value){
  const db=await dbOpen();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(DB_STORE,'readwrite');
    tx.objectStore(DB_STORE).put(value,DB_KEY);
    tx.oncomplete=()=>{db.close();resolve();};
    tx.onerror=()=>{db.close();reject(tx.error);};
    tx.onabort=()=>{db.close();reject(tx.error);};
  });
}
async function dbClear(){
  const db=await dbOpen();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(DB_STORE,'readwrite');
    tx.objectStore(DB_STORE).delete(DB_KEY);
    tx.oncomplete=()=>{db.close();resolve();};
    tx.onerror=()=>{db.close();reject(tx.error);};
  });
}
function settings(){
  try {
    const s=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'null');
    const valid={...DEFAULTS};
    if(s&&typeof s==='object'){
      for(const key of ['ambience','music','effects'])
        if(Number.isFinite(s[key]))valid[key]=Math.max(0,Math.min(1,s[key]));
      for(const key of ['muted','autoMusic','autoEffects'])
        if(typeof s[key]==='boolean')valid[key]=s[key];
    }
    return valid;
  }catch{return {...DEFAULTS};}
}
function linearGain(db){return Math.pow(10,db/20);}
function clamp(v){return Math.min(1,Math.max(0,v));}
function selectText(path){
  const name=path.split('/').at(-1)||path;
  return name.replace(/\.(mp3|ogg|wav)$/i,'').replace(/_/g,' ');
}
class MotherAudioUI {
  constructor(){
    this.settings=settings();
    this.armed=false;
    this.catalog=null;
    this.registry=null;
    this.lookup=new Map();
    this.desiredId=null;
    this.previousId=null;
    this.latestView=null;
    this.lastEventSignature=null;
    this.musicAlready=null;
    this.active=0;
    this.fadeHandle=null;
    this.beds=[new Audio(),new Audio()];
    this.beds.forEach(a=>{a.loop=true;a.preload='none';a.volume=0;});
    this.music=new Audio();this.music.preload='none';this.music.loop=false;
    this.fx=[new Audio(),new Audio()];this.fx.forEach(a=>a.preload='none');
    this.fxNext=0;
    this.bind();
    void this.initialize();
  }
  label(message){$('mother-audio-status').textContent=message;}
  saveSettings(){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(this.settings));}catch{}}
  bind(){
    for(const [id,key] of [['mother-ambience-volume','ambience'],
      ['mother-music-volume','music'],['mother-effects-volume','effects']]){
      $(id).value=String(Math.round(this.settings[key]*100));
      $(id).addEventListener('input',e=>{
        this.settings[key]=Number(e.currentTarget.value)/100;
        this.saveSettings();this.applyVolumes();
      });
    }
    for(const [id,key] of [['mother-auto-music','autoMusic'],['mother-auto-effects','autoEffects']]){
      $(id).checked=this.settings[key];
      $(id).addEventListener('change',e=>{this.settings[key]=e.currentTarget.checked;this.saveSettings();});
    }
    $('mother-mute').textContent=this.settings.muted?'Unmute':'Mute';
    $('mother-mute').addEventListener('click',async()=>{
      this.settings.muted=!this.settings.muted;
      $('mother-mute').textContent=this.settings.muted?'Unmute':'Mute';
      this.saveSettings();
      if(this.settings.muted)this.pauseAll();
      else if(this.armed) await this.startBed();
    });
    $('mother-audio-enable').addEventListener('click',async()=>{
      if(!this.registry){this.label('Audio metadata has not loaded.');return;}
      if(!this.catalog){this.label('Import your existing link catalog first.');$('mother-audio-file').click();return;}
      this.armed=true;
      this.label('Audio enabled. Mother is choosing from approved sounds.');
      await this.update(this.latestView,{force:true});
    });
    $('mother-audio-file').addEventListener('change',async e=>{
      const file=e.currentTarget.files?.[0];
      if(!file)return;
      if(file.size>12_000_000){this.label('Audio catalog exceeds the 12 MB import limit.');return;}
      try{
        if(!this.registry)await this.loadManifest();
        const parsed=parseDropboxAudioLinks(await file.text(),
          new Set(this.registry.tracks.map(t=>t.filename)));
        if(!parsed.counts.ambience||!parsed.counts.music||!parsed.counts.sfx)
          throw new TypeError('Catalog is missing one or more audio categories');
        this.assignCatalog(parsed);
        try {
          await dbWrite({schemaVersion:1,pairs:parsed.pairs});
          this.label('Links saved privately in this browser: '+this.countDescription()+'. Tap Enable audio.');
        }catch{
          this.label('Links loaded for this tab only (browser storage blocked). Tap Enable audio.');
        }
        if(this.armed)await this.update(this.latestView,{force:true});
      }catch(error){this.label('Cannot import links: '+error.message);}
      finally{e.currentTarget.value='';}
    });
    $('mother-audio-forget').addEventListener('click',async()=>{
      if(!confirm('Forget all locally stored audio links on this device? Nothing is deleted from Dropbox.'))return;
      this.pauseAll();this.armed=false;this.catalog=null;this.lookup.clear();
      this.desiredId=null;this.previousId=null;this.lastEventSignature=null;
      $('mother-music-select').replaceChildren(new Option('Auto / no manual song',''));
      $('mother-effects-select').replaceChildren(new Option('Select dinosaur',''));
      try{await dbClear();this.label('Local Dropbox links forgotten.');}
      catch{this.label('Links cleared from this tab; browser storage may need manual cleanup.');}
    });
    $('mother-music-play').addEventListener('click',async()=>{
      if(!this.armed || this.settings.muted){this.label('Enable and unmute audio first.');return;}
      const selected=$('mother-music-select').value;
      if(!selected){this.music.pause();this.musicAlready=null;this.label('Music stopped; automatic scene selection remains available.');return;}
      await this.playMusic(selected,true);
    });
    $('mother-effects-play').addEventListener('click',async()=>{
      if(!this.armed || this.settings.muted){this.label('Enable and unmute audio first.');return;}
      const species=$('mother-effects-select').value;
      const sounds=this.catalog?.species[species];
      if(!sounds?.length){this.label('No effects found for that species.');return;}
      await this.playEffect(sounds[Math.floor(Math.random()*sounds.length)]);
    });
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden)this.pauseAll();
      else if(this.armed&&!this.settings.muted)void this.startBed();
    });
    window.addEventListener('pagehide',()=>this.pauseAll());
  }
  async loadManifest(){
    const response=await fetch(new URL('../media/ambience-approved.v1.json',import.meta.url),
      {cache:'no-store',credentials:'omit'});
    if(!response.ok)throw new Error('Approved ambience manifest unavailable ('+response.status+')');
    this.registry=createAmbienceRegistry(await response.json());
  }
  async initialize(){
    try{
      await this.loadManifest();
      const stored=await dbRead().catch(()=>null);
      if(stored?.schemaVersion===1&&Array.isArray(stored.pairs)){
        const parsed=parseDropboxAudioLinks(JSON.stringify(stored.pairs),
          new Set(this.registry.tracks.map(t=>t.filename)));
        this.assignCatalog(parsed);
        this.label('Saved local audio links loaded: '+this.countDescription()+'. Tap Enable audio.');
      }else this.label('Import your original 15,255-link HTML, JSON or CSV once to use Dropbox audio.');
    }catch(error){
      this.label('Audio unavailable: '+error.message+'. The game remains playable without sound.');
    }
  }
  countDescription(){
    if(!this.catalog)return '0';
    const {ambience,music,sfx}=this.catalog.counts;
    return ambience+' ambience, '+music+' music, '+sfx+' effects';
  }
  assignCatalog(catalog){
    this.catalog=catalog;
    this.lookup=new Map(catalog.pairs);
    const music=$('mother-music-select'),effects=$('mother-effects-select');
    music.replaceChildren(new Option('Auto / no manual song',''));
    for(const path of catalog.music)music.add(new Option(selectText(path),path));
    effects.replaceChildren(new Option('Select dinosaur',''));
    for(const folder of Object.keys(catalog.species).sort())
      effects.add(new Option(folder.replace(/_/g,' ')+' ('+catalog.species[folder].length+')',folder));
  }
  applyVolumes(){
    if(this.settings.muted){this.pauseAll();return;}
    const bed=this.beds[this.active];
    if(this.currentCue&&this.previousId)
      bed.volume=clamp(this.settings.ambience*linearGain(this.currentCue.gainDb));
    this.music.volume=clamp(this.settings.music);
    this.fx.forEach(a=>a.volume=clamp(this.settings.effects));
  }
  pauseAll(){this.beds.forEach(a=>a.pause());this.music.pause();this.fx.forEach(a=>a.pause());}
  async startBed(){
    if(!this.armed||this.settings.muted)return;
    const bed=this.beds[this.active];
    if(this.previousId && bed.src && bed.paused)
      try{await bed.play();}catch{this.label('Audio blocked. Tap Enable audio to retry.');}
    else if(this.latestView)await this.update(this.latestView,{force:true});
  }
  async crossfade(cue,url){
    if(this.fadeHandle!==null){cancelAnimationFrame(this.fadeHandle);this.fadeHandle=null;}
    const old=this.beds[this.active], next=this.beds[1-this.active];
    if(next.src!==url){next.pause();next.src=url;next.load();}
    next.volume=0;
    next.loop=true;
    try{await next.play();}
    catch{
      this.label('Dropbox audio could not play. Check the link and browser media support, then tap Enable audio.');
      this.desiredId=null;return;
    }
    this.active=1-this.active;
    this.previousId=cue.trackId;
    this.currentCue=cue;
    const target=clamp(this.settings.ambience*linearGain(cue.gainDb));
    const oldVolume=old.volume;
    const duration=Math.max(0,cue.fadeMs??3500);
    const started=performance.now();
    const tick=now=>{
      const progress=duration?Math.min(1,(now-started)/duration):1;
      next.volume=clamp(target*progress);
      old.volume=clamp(oldVolume*(1-progress));
      if(progress<1)this.fadeHandle=requestAnimationFrame(tick);
      else {old.pause();old.removeAttribute('src');old.load();this.fadeHandle=null;}
    };
    this.fadeHandle=requestAnimationFrame(tick);
    const title=this.registry?.byId[cue.trackId]?.title||cue.trackId;
    this.label('Now playing: '+title+' · '+this.countDescription());
  }
  async playMusic(path,manual=false){
    const url=this.lookup.get(path);
    if(!url||!this.armed||this.settings.muted)return;
    if(!manual&&this.musicAlready===path&&!this.music.ended)return;
    this.musicAlready=path;
    this.music.pause();this.music.src=url;this.music.volume=clamp(this.settings.music);
    try{await this.music.play();if(manual)this.label('Playing music: '+selectText(path));}
    catch{this.label('Music could not play from Dropbox; no game action was affected.');}
  }
  async playEffect(path){
    const url=this.lookup.get(path);
    if(!url||!this.armed||this.settings.muted)return;
    const a=this.fx[this.fxNext++%this.fx.length];
    a.pause();a.src=url;a.volume=clamp(this.settings.effects);
    try{await a.play();}
    catch{this.label('Sound effect could not play. You can update its link catalog later.');}
  }
  async update(view,{force=false}={}){
    if(!view||!this.registry){this.latestView=view||null;return;}
    this.latestView=view;
    if(!this.catalog||!this.armed||this.settings.muted)return;
    const scene=publicAudioScene(view);
    const cue=proposeAmbienceCue(this.registry,{
      scene,previousTrackId:force?null:this.desiredId,settings:{enabled:true,muted:false}
    });
    if(cue.type==='ambience' && (this.desiredId!==cue.trackId||force)){
      const url=this.lookup.get('Ambience/'+cue.assetKey);
      if(url){this.desiredId=cue.trackId;await this.crossfade(cue,url);}
    }else if(cue.type==='silence'&&this.previousId){
      this.desiredId=null;this.previousId=null;this.beds.forEach(a=>a.pause());
    }
    const signature=publicAudioSignature(view);
    if(signature!==this.lastEventSignature){
      this.lastEventSignature=signature;
      if(this.settings.autoMusic){
        const music=chooseMusicCue(view,this.catalog.music);
        if(music)void this.playMusic(music);
      }
      if(this.settings.autoEffects){
        const effect=chooseSpeciesSound(view,this.catalog);
        if(effect)void this.playEffect(effect);
      }
    }
  }
}

export function installPartyAudio(){
  return new MotherAudioUI();
}
