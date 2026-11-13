/**
 * DHR-077 / UI-05. Presentation-only portrait/monitor component.
 *
 * ONLY pass a trusted, observer-authorized projection, never raw world/save data.
 * Each member is a known public identity with observation: 'self', 'nearby', or
 * 'remote'. The projector must verify nearby visibility (including light/LOS)
 * before assigning 'nearby'. In particular, this module does not infer
 * visibility from Party/Focus/Spectator control ownership or camera selection.
 * A detailed sheet must already be filtered to information this observer knows.
 *
 * There are no actions or save mutations here. A waveform is an artistic Evolved
 * Stress cue, not a physiological BPM. Death is indicated only by dead === true.
 */
export const PORTRAIT_MIN = 1;
export const PORTRAIT_MAX = 8;
const ATTRS = Object.freeze(['strength', 'agility', 'wits', 'empathy']);
const SKILLS = Object.freeze([
 'heavy_machinery', 'stamina', 'close_combat', 'mobility', 'ranged_combat',
 'piloting', 'observation', 'survival', 'comtech', 'command', 'manipulation',
 'medical_aid'
]);
const PATHS = Object.freeze({
 calm:'M0 12 H12 L16 11 L19 13 L22 12 H38 L41 10 L44 14 L47 12 H63 L66 11 L69 13 L72 12 H88 L91 10 L94 14 L97 12 H120',
 elevated:'M0 12 H12 L18 10 L22 16 L26 4 L30 20 L34 12 H46 L52 10 L56 16 L60 4 L64 20 L68 12 H80 L86 10 L90 16 L94 4 L98 20 L102 12 H120',
 intense:'M0 12 H8 L12 9 L16 18 L20 1 L24 23 L28 12 H36 L40 9 L44 18 L48 1 L52 23 L56 12 H64 L68 9 L72 18 L76 1 L80 23 L84 12 H92 L96 9 L100 18 L104 1 L108 23 L112 12 H120',
 deceased:'M0 12 H120'
});
function escapeHtml(value){
 return String(value ?? '').replace(/[&<>"']/g, ch=>({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
 })[ch]);
}
function validNumber(x){return Number.isInteger(x) && x>=0;}
function safePortraitUrl(value){
 if(typeof value!=='string')return null;
 // Absolute HTTPS or same-origin root-relative paths, excluding protocol-relative.
 // Do not permit javascript:, data:, blob:, or untrusted scheme URLs.
 if(/^https:\/\/[^\s<>"']+$/i.test(value) || /^\/(?!\/)[^\s<>"']+$/.test(value))return value;
 return null;
}
function viewOnlySheet(sheet){
 if(!sheet || typeof sheet!=='object' || Array.isArray(sheet))return null;
 const numeric=(source, names)=>Object.fromEntries(names.filter(k=>
   source && typeof source==='object' && validNumber(source[k]) && source[k]<=30
 ).map(k=>[k,source[k]]));
 const words=(list)=>Array.isArray(list)?list.slice(0,32).map(item=>
   typeof item==='string'?item:(item && typeof item.name==='string'?item.name:null)
 ).filter(x=>typeof x==='string' && x.length<=120):[];
 return {
  career:typeof sheet.career==='string'?sheet.career.slice(0,120):'',
  attributes:numeric(sheet.attributes,ATTRS),
  skills:numeric(sheet.skills,SKILLS),
  talents:words(sheet.talents),equipment:words(sheet.equipment),
  inventory:words(sheet.inventory),injuries:words(sheet.injuries)
 };
}
/** Strictly public, clipped data; no hidden-field copies, even if input is raw. */
export function projectPortraitCards(characters,{observerId}={}){
 if(!Array.isArray(characters)||characters.length<PORTRAIT_MIN||characters.length>PORTRAIT_MAX)
  throw new RangeError('Portrait row must contain 1–8 survivors.');
 const seen=new Set();
 return characters.map((input,index)=>{
  if(!input || typeof input!=='object' || typeof input.id!=='string' ||
     !input.id || seen.has(input.id))throw new RangeError('Invalid or duplicate portrait ID.');
  seen.add(input.id);
  const allowed=(input.observation==='self' && input.id===observerId) ||
    input.observation==='nearby';
  const complete=allowed && validNumber(input.health) &&
    Number.isInteger(input.healthMax) && input.healthMax>0 &&
    input.health<=input.healthMax && validNumber(input.stress) && input.stress<=30;
  // Never infer death from zero Health, wounds, unconsciousness, or a lost signal.
  const deceased=complete && input.dead===true;
  const health=complete?input.health:null;
  const max=complete?input.healthMax:null;
  const stress=complete?input.stress:null;
  const healthTone=!complete?'unknown':deceased?'deceased':
    health/max>0.5?'healthy':health/max>0.25?'wounded':'critical';
  const stressCue=!complete?'unknown':deceased?'deceased':
    stress<=2?'calm':stress<=5?'elevated':'intense';
  return Object.freeze({
   id:input.id,
   name:typeof input.name==='string' && input.name.trim()?input.name.slice(0,120):'Survivor '+(index+1),
   image:safePortraitUrl(input.portraitUrl),
   nearby:allowed,known:complete,
   health,healthMax:max,stress,
   dead:deceased,broken:complete && input.broken===true,
   healthTone,stressCue,
   sheet:complete?viewOnlySheet(input.sheet):null
  });
 });
}
function monitor(card,reducedMotion){
 if(!card.known)return '<span class="dhr-pv-unavailable" aria-hidden="true">SIGNAL UNKNOWN</span>';
 return '<svg class="dhr-pv-wave dhr-pv-wave--'+card.stressCue+
  (reducedMotion?' dhr-pv-wave--still':'')+'" viewBox="0 0 120 24" aria-hidden="true" focusable="false">'+
  '<path d="'+PATHS[card.dead?'deceased':card.stressCue]+'"/></svg>';
}
function status(card){
 if(!card.known)return 'Status unknown from this viewpoint';
 if(card.dead)return 'Deceased (engine confirmed)';
 if(card.broken)return 'Incapacitated, not confirmed deceased';
 if(card.health===0)return 'Zero Health, not confirmed deceased';
 return 'Health '+card.health+' of '+card.healthMax+'; Stress '+card.stress;
}
function sheetHtml(card){
 if(!card.sheet)return '<p class="dhr-pv-private">No authorized character sheet or inventory available from this viewpoint.</p>';
 const s=card.sheet;
 const data=(title,items)=>{
  if(!items.length)return '';
  return '<div class="dhr-pv-sheet-group"><h4>'+escapeHtml(title)+'</h4><ul>'+items.map(value=>
   '<li>'+escapeHtml(value)+'</li>').join('')+'</ul></div>';
 };
 const skills=Object.entries(s.skills).map(([key,value])=>key.replaceAll('_',' ')+' '+value);
 const attrs=Object.entries(s.attributes).map(([key,value])=>key+' '+value);
 return '<div class="dhr-pv-sheet-content">'+
  (s.career?'<p>Career: '+escapeHtml(s.career)+'</p>':'')+
  data('Attributes',attrs)+data('Skills',skills)+data('Talents',s.talents)+
  data('Equipment',s.equipment)+data('Inventory (view only)',s.inventory)+
  data('Visible injuries',s.injuries)+
  '<p class="dhr-pv-sheet-note">View only. Describe equipment actions in natural language.</p></div>';
}
/** Pure markup; no timer, AI call, input action, save field or mutable engine state. */
export function renderPortraitVitals(characters,{
 observerId,openId=null,activeActorId=null,reducedMotion=false
}={}){
 const cards=projectPortraitCards(characters,{observerId});
 const selected=cards.some(x=>x.id===openId)?openId:null;
 const row=cards.map(card=>{
  const id=escapeHtml(card.id),name=escapeHtml(card.name);
  const label=escapeHtml(card.name+'. '+status(card)+
   (card.known && !card.dead?'; stylized Stress '+card.stressCue:'')+'. Open view-only details');
  const portrait=card.image?'<img src="'+escapeHtml(card.image)+'" alt="" loading="lazy" decoding="async">':
   '<span class="dhr-pv-silhouette" aria-hidden="true">◈</span>';
  return '<button class="dhr-pv-card dhr-pv-card--'+card.healthTone+
   (card.id===activeActorId?' dhr-pv-card--active':'')+'" type="button" data-portrait-open="'+id+
   '" aria-expanded="'+(selected===card.id)+'" aria-controls="dhr-pv-details" aria-label="'+label+'">'+
   '<span class="dhr-pv-photo">'+portrait+'</span><span class="dhr-pv-name">'+name+'</span>'+
   '<span class="dhr-pv-monitor">'+monitor(card,reducedMotion)+'</span>'+
   '<span class="dhr-pv-status">'+escapeHtml(status(card))+'</span></button>';
 }).join('');
 const open=cards.find(x=>x.id===selected);
 const panel=open?'<section id="dhr-pv-details" class="dhr-pv-details" role="region" aria-label="'+
  escapeHtml(open.name)+' view-only character details"><div class="dhr-pv-details-head"><h3>'+escapeHtml(open.name)+
  ' · Character Sheet</h3><button type="button" data-portrait-close aria-label="Close character details">Close</button></div>'+
  '<p>'+escapeHtml(status(open))+'</p>'+sheetHtml(open)+'</section>':
  '<section id="dhr-pv-details" hidden></section>';
 return '<div class="dhr-pv'+(reducedMotion?' dhr-pv--reduced-motion':'')+'" data-dhr-portrait-vitals="">'+
  '<div class="dhr-pv-grid" role="group" aria-label="Survivor portraits and Evolved Health and Stress">'+row+
  '</div>'+panel+'</div>';
}
/** DOM adapter. Selecting a portrait never changes character control or camera. */
export function mountPortraitVitals(root,options){
 if(!root || typeof root.addEventListener!=='function' || typeof root.removeEventListener!=='function')
  throw new TypeError('Portrait root must be a DOM element.');
 let config={...options},openId=null;
 const paint=()=>{root.innerHTML=renderPortraitVitals(config.characters,{...config,openId});};
 const onClick=event=>{
  const close=event.target?.closest?.('[data-portrait-close]');
  if(close && root.contains(close)){
   const was=openId;openId=null;paint();
   const buttons=root.querySelectorAll?.('[data-portrait-open]')||[];
   [...buttons].find(b=>b.getAttribute('data-portrait-open')===was)?.focus?.();
   return;
  }
  const trigger=event.target?.closest?.('[data-portrait-open]');
  if(!trigger || !root.contains(trigger))return;
  const id=trigger.getAttribute('data-portrait-open');
  if(!projectPortraitCards(config.characters,{observerId:config.observerId}).some(c=>c.id===id))return;
  openId=id;paint();
  root.querySelector?.('[data-portrait-close]')?.focus?.();
 };
 root.addEventListener('click',onClick);
 paint();
 return Object.freeze({
  update(next){config={...next};
   if(!projectPortraitCards(config.characters,{observerId:config.observerId}).some(c=>c.id===openId && c.known && c.sheet))openId=null;
   paint();},
  destroy(){root.removeEventListener('click',onClick);root.innerHTML='';}
 });
}
