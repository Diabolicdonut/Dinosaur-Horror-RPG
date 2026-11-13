/**
 * Mother/GM live game audio: authenticated Worker sign requests, then temporary
 * Worker-only streaming URLs in HTMLAudioElements. Dropbox OAuth and shared
 * links are NEVER shipped to this public browser app.
 */
import {publicAudioScene,chooseMusicCue,speciesFromVisibleView,publicAudioSignature}
  from './party-audio-planner.mjs';
import {createAmbienceRegistry,proposeAmbienceCue} from './ambience-director.mjs';

const WORKER_BASE='https://dinosaur-rpg.diabolicdonut.workers.dev';
const TOKEN_KEY='dinosaur-horror-rpg-remembered-token-v1';
const SETTINGS_KEY='dhr-party-audio-controls-v1';
const DEFAULTS={muted:false,ambience:0.46,music:0.29,effects:0.48,
  autoMusic:true,autoEffects:true};
const $=id=>document.getElementById(id);
const linearGain=db=>Math.pow(10,db/20);
const clamp=v=>Math.min(1,Math.max(0,v));
function settings(){
  try{
    const data=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'null');
    const s={...DEFAULTS};
    if(!data||typeof data!=='object')return s;
    for(const key of ['ambience','music','effects'])
      if(Number.isFinite(data[key]))s[key]=clamp(data[key]);
    for(const key of ['muted','autoMusic','autoEffects'])
      if(typeof data[key]==='boolean')s[key]=data[key];
    return s;
  }catch{return {...DEFAULTS};}
}
function savedToken(){
  try{return localStorage.getItem(TOKEN_KEY)||'';}catch{return '';}
}
function labelFor(path){
  return (path.split('/').at(-1)||path).replace(/\.(mp3|ogg|wav)$/i,'')
    .replace(/_/g,' ');
}
class MotherWorkerAudio {
  constructor(){
    this.settings=settings();
    this.token='';
    this.armed=false;
    this.registry=null;
    this.musicList=[];
    this.species=[];
    this.desiredId=null;
    this.currentCue=null;
    this.currentUrl=null;
    this.currentExpires=0;
    this.active=0;
    this.fadeHandle=null;
    this.requestId=0;
    this.lastEventSignature=null;
    this.latestView=null;
    this.musicAlready=null;
    this.beds=[new Audio(),new Audio()];
    for(const a of this.beds){a.loop=true;a.preload='none';a.volume=0;}
    this.music=new Audio();this.music.preload='none';
    this.fx=[new Audio(),new Audio()];this.fx.forEach(a=>a.preload='none');
    this.fxIndex=0;
    this.bind();
    void this.initialize();
    // Browser media URLs are intentionally short-lived; refresh only an
    // already playing bed (not a speculative new scene) before expiration.
    this.renewal=setInterval(()=>{
      if(this.armed&&!document.hidden&&!this.settings.muted&&this.currentExpires &&
        Math.floor(Date.now()/1000)>this.currentExpires-180)
          void this.update(this.latestView,{force:true});
    },60000);
  }
  label(value){$('mother-audio-status').textContent=value;}
  secret(){return $('mother-audio-token').value.trim();}
  saveSettings(){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(this.settings));}catch{}}
  persistToken(){
    this.token=this.secret();
    try{
      if($('mother-audio-remember').checked)
        localStorage.setItem(TOKEN_KEY,this.token);
      else localStorage.removeItem(TOKEN_KEY);
    }catch{}
  }
  clearSound(){
    if(this.fadeHandle!==null)cancelAnimationFrame(this.fadeHandle);
    this.fadeHandle=null;this.beds.forEach(a=>a.pause());
    this.music.pause();this.fx.forEach(a=>a.pause());
  }
  bind(){
    for(const [id,key] of [['mother-ambience-volume','ambience'],
      ['mother-music-volume','music'],['mother-effects-volume','effects']]){
      $(id).value=String(Math.round(this.settings[key]*100));
      $(id).addEventListener('input',event=>{
        this.settings[key]=clamp(Number(event.currentTarget.value)/100);
        this.saveSettings();this.applyVolumes();
      });
    }
    for(const [id,key] of [['mother-auto-music','autoMusic'],
      ['mother-auto-effects','autoEffects']]){
      $(id).checked=this.settings[key];
      $(id).addEventListener('change',event=>{
        this.settings[key]=event.currentTarget.checked;this.saveSettings();
      });
    }
    $('mother-mute').textContent=this.settings.muted?'Unmute':'Mute';
    $('mother-mute').addEventListener('click',()=>{
      this.settings.muted=!this.settings.muted;
      $('mother-mute').textContent=this.settings.muted?'Unmute':'Mute';
      this.saveSettings();
      if(this.settings.muted)this.clearSound();
      else if(this.armed)void this.startBed();
    });
    $('mother-audio-token').addEventListener('input',()=>{
      if(this.armed){this.armed=false;this.clearSound();this.label('Token changed. Enable audio again.');}
      this.persistToken();
    });
    $('mother-audio-remember').addEventListener('change',()=>this.persistToken());
    $('mother-audio-forget').addEventListener('click',()=>{
      this.armed=false;this.clearSound();this.token='';
      $('mother-audio-token').value='';
      $('mother-audio-remember').checked=false;
      try{localStorage.removeItem(TOKEN_KEY);}catch{}
      this.label('Game token forgotten on this device; no Dropbox files were changed.');
    });
    $('mother-audio-enable').addEventListener('click',async()=>{
      if(!this.secret()){this.label('Enter the existing Cloudflare GAME_TOKEN to enable audio.');return;}
      this.persistToken();
      if(this.armed&&this.currentUrl&&!this.settings.muted){
        // A real user gesture for browsers that block play after async sign.
        try{await this.beds[this.active].play();
          this.label('Protected audio streaming resumed.');}
        catch{this.label('Playback was blocked. Tap Enable audio again.');}
        return;
      }
      try{
        const status=await this.api('/v1/media/status',null,'GET');
        if(!status?.ready)throw new Error('Cloudflare audio is not configured');
        this.armed=true;this.settings.muted=false;
        $('mother-mute').textContent='Mute';this.saveSettings();
        await this.loadLibrary();
        this.label('Cloudflare audio connected; loading the current approved scene.');
        await this.update(this.latestView,{force:true});
      }catch(error){this.armed=false;
        this.label('Cloudflare audio unavailable: '+error.message+
          '. The game remains playable without sound.');}
    });
    $('mother-music-play').addEventListener('click',async()=>{
      if(!this.armed||this.settings.muted){this.label('Enable audio and unmute first.');return;}
      const path=$('mother-music-select').value;
      if(!path){this.music.pause();this.musicAlready=null;
        this.label('Manual music stopped; scene cues remain optional.');return;}
      await this.playMusic(path,true);
    });
    $('mother-effects-play').addEventListener('click',async()=>{
      const species=$('mother-effects-select').value;
      if(!this.armed||this.settings.muted){this.label('Enable audio and unmute first.');return;}
      if(!this.species.includes(species)){this.label('Select an available species.');return;}
      await this.playEffect(species,Math.floor(Math.random()*2147483647),true);
    });
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden)this.clearSound();
      else if(this.armed&&!this.settings.muted)void this.startBed();
    });
    window.addEventListener('pagehide',()=>{
      this.clearSound();clearInterval(this.renewal);
    });
  }
  async api(route,payload=null,method='POST'){
    const token=this.secret();
    if(!token)throw new Error('GAME_TOKEN required');
    const response=await fetch(WORKER_BASE+route,{
      method,
      headers:{Authorization:'Bearer '+token,
        ...(method==='POST'?{'Content-Type':'application/json'}:{})},
      ...(method==='POST'?{body:JSON.stringify(payload)}:{}),
      cache:'no-store'
    });
    if(!response.ok){
      if(response.status===401)throw new Error('GAME_TOKEN rejected (HTTP 401)');
      if(response.status===404)throw new Error('Audio Worker update is not deployed (HTTP 404)');
      if(response.status===503)throw new Error('Dropbox OAuth secrets or rate limiter not configured (HTTP 503)');
      if(response.status===429)throw new Error('Audio request limit reached; retry shortly');
      throw new Error('Audio gateway HTTP '+response.status);
    }
    const result=await response.json();
    if(!result||typeof result!=='object')throw new Error('Invalid Worker audio response');
    return result;
  }
  async initialize(){
    const previous=savedToken();
    if(previous){$('mother-audio-token').value=previous;
      $('mother-audio-remember').checked=true;}
    try{
      const response=await fetch(new URL('../media/ambience-approved.v1.json',import.meta.url),
        {credentials:'omit',cache:'no-store'});
      if(!response.ok)throw new Error('Approved audio catalog missing');
      this.registry=createAmbienceRegistry(await response.json());
      this.label('Approved ambience library ready. Enter GAME_TOKEN, then enable Cloudflare playback.');
    }catch(error){this.label('Unable to load approved ambience catalog: '+error.message);}
  }
  async loadLibrary(){
    const list=await this.api('/v1/media/library',null,'GET');
    if(!Array.isArray(list.music)||!Array.isArray(list.effectSpecies) ||
       !Array.isArray(list.ambience) || list.ambience.length!==94)
      throw new Error('Worker audio catalog mismatch');
    this.musicList=list.music.slice();this.species=list.effectSpecies.slice();
    $('mother-music-select').replaceChildren(new Option('Auto / no manual song',''));
    for(const path of this.musicList)
      $('mother-music-select').add(new Option(labelFor(path),path));
    $('mother-effects-select').replaceChildren(new Option('Select dinosaur',''));
    for(const species of this.species)
      $('mother-effects-select').add(new Option(species.replace(/_/g,' '),species));
  }
  applyVolumes(){
    if(this.settings.muted){this.clearSound();return;}
    if(this.currentCue)this.beds[this.active].volume=
      clamp(this.settings.ambience*linearGain(this.currentCue.gainDb));
    this.music.volume=this.settings.music;
    this.fx.forEach(a=>a.volume=this.settings.effects);
  }
  async startBed(){
    if(!this.armed||this.settings.muted)return;
    const current=this.beds[this.active];
    if(this.currentUrl && this.currentExpires > Math.floor(Date.now()/1000)+30){
      try{await current.play();}
      catch{this.label('Tap Enable audio to allow playback on this device.');}
    }else await this.update(this.latestView,{force:true});
  }
  async crossfade(cue,result){
    if(this.fadeHandle!==null)cancelAnimationFrame(this.fadeHandle);
    const old=this.beds[this.active],next=this.beds[1-this.active];
    next.pause();next.src=result.url;next.load();next.volume=0;next.loop=true;
    this.active=1-this.active;
    this.currentCue=cue;this.currentUrl=result.url;this.currentExpires=result.expires_at;
    this.desiredId=cue.trackId;
    try{await next.play();}
    catch{this.label('Audio loaded, but playback was blocked. Tap Enable audio again.');return;}
    const target=clamp(this.settings.ambience*linearGain(cue.gainDb));
    const oldVolume=old.volume,started=performance.now();
    const duration=Math.max(0,cue.fadeMs||3500);
    const tick=now=>{
      const fraction=duration?Math.min(1,(now-started)/duration):1;
      next.volume=clamp(target*fraction);
      old.volume=clamp(oldVolume*(1-fraction));
      if(fraction<1)this.fadeHandle=requestAnimationFrame(tick);
      else{old.pause();old.removeAttribute('src');old.load();this.fadeHandle=null;}
    };
    this.fadeHandle=requestAnimationFrame(tick);
    this.label('Mother: '+this.registry.byId[cue.trackId]?.title+' (Cloudflare private stream)');
  }
  async playMusic(path,manual=false){
    if(!this.musicList.includes(path)||!this.armed||this.settings.muted)return;
    if(!manual&&this.musicAlready===path&&!this.music.ended)return;
    try{
      const result=await this.api('/v1/media/sign',{path});
      this.musicAlready=path;
      this.music.pause();this.music.src=result.url;this.music.volume=this.settings.music;
      await this.music.play();
      if(manual)this.label('Music: '+labelFor(path)+' via Cloudflare');
    }catch{this.label('Music unavailable from private Dropbox stream; game continues.');}
  }
  async playEffect(species,seed,manual=false){
    if(!this.species.includes(species)||!this.armed||this.settings.muted)return;
    try{
      const result=await this.api('/v1/media/effect',{species,seed});
      const player=this.fx[this.fxIndex++%this.fx.length];
      player.pause();player.src=result.url;player.volume=this.settings.effects;
      await player.play();
      if(manual)this.label('Effect preview: '+species+' via Cloudflare');
    }catch{if(manual)this.label('That species effect is unavailable.');}
  }
  async update(view,{force=false}={}){
    this.latestView=view||null;
    if(!view||!this.registry||!this.armed||this.settings.muted)return;
    const cue=proposeAmbienceCue(this.registry,{
      scene:publicAudioScene(view),previousTrackId:force?null:this.desiredId,
      settings:{muted:false,enabled:true}
    });
    if(cue.type==='ambience'&&(force||cue.trackId!==this.desiredId)){
      const requested=++this.requestId;
      try{
        const result=await this.api('/v1/media/sign',{path:'Ambience/'+cue.assetKey});
        if(requested===this.requestId&&this.armed&&!this.settings.muted)
          await this.crossfade(cue,result);
      }catch{this.label('Ambience stream unavailable. Gameplay continues silently.');}
    }else if(cue.type==='silence'){
      this.requestId++;this.desiredId=null;this.clearSound();
    }
    const eventSignature=publicAudioSignature(view);
    if(eventSignature!==this.lastEventSignature){
      this.lastEventSignature=eventSignature;
      if(this.settings.autoMusic){
        const path=chooseMusicCue(view,this.musicList);
        if(path)void this.playMusic(path);
      }
      if(this.settings.autoEffects){
        const event=view.events?.at(-1);
        const creatures=speciesFromVisibleView(view);
        if(event?.category==='danger'&&event.beat===view.beat&&creatures.length){
          const aliases={raptor:'Velociraptor',trex:'TRex'};
          const matching=creatures.map(n=>aliases[n]||
            this.species.find(s=>s.replace(/[^a-z]/gi,'').toLowerCase()===n))
            .find(s=>this.species.includes(s));
          if(matching)void this.playEffect(matching,view.beat*17+event.message?.length%101||0);
        }
      }
    }
  }
}
export function installPartyAudio(){return new MotherWorkerAudio();}
