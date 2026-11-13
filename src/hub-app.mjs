// UI-01: presentation-only Adventure Hub. No save writes, scenario generation,
// hidden manifest state or direct launch mutations occur here.
// Gameplay and Evolved character validation remain owned by the Party engine.
import {listHubScenarios,resolveHubLaunchScenario} from './adventure-hub-catalog.mjs';

const ART_KEYS = Object.freeze(['storm','count','tidal','research','breach','convoy','custom']);
const NAV_KEYS = Object.freeze(['home','adventures','campaigns','saves','characters','settings']);
const PARTY_SAVE_KEY = 'dinosaur-party-incident-007c';
const hubCards = listHubScenarios();

export function hubArtPath(key) {
  return './assets/hub/' + (ART_KEYS.includes(key) ? key : 'custom') + '.jpg';
}

export function hubSelection(id) {
  const card=hubCards.find(item=>item.id===id);
  if(!card)return null;
  // The adapter resolves authentic compiled IDs/revisions, not demo IDs.
  const target=card.launchable?resolveHubLaunchScenario(card.id):null;
  return Object.freeze({...card,target,art:hubArtPath(card.artKey)});
}

export function hubCardsForView(view) {
  if(view==='home'||view==='adventures')return hubCards;
  // Future Campaigns are never synthesized from authored adventures.
  return [];
}

function byId(id){return document.getElementById(id);}
function element(tag,cls,content){
  const node=document.createElement(tag);
  if(cls)node.className=cls;
  if(content!==undefined)node.textContent=String(content);
  return node;
}
function selectedCardId(){
  const requested=new URLSearchParams(window.location.search).get('scenario');
  return hubSelection(requested)?.id||hubCards.find(x=>x.launchable)?.id||hubCards[0]?.id||null;
}
function initHub(){
  const scroller=byId('hub-carousel');
  const image=byId('featured-art');
  const launchLink=byId('enter-engine');
  let selected=selectedCardId();

  function renderSelected(){
    const card=hubSelection(selected);
    if(!card)return;
    byId('feature-status').textContent=card.launchable?'VALIDATED PLAYABLE ADVENTURE':'CONCEPT PREVIEW / NOT PLAYABLE';
    byId('feature-title').textContent=card.title;
    byId('feature-subtitle').textContent=card.subtitle;
    byId('feature-kind').textContent=card.launchable?'AUTHOR-DEFINED CINEMATIC':'UNIMPLEMENTED CONCEPT';
    byId('feature-tone').textContent=card.tone;
    byId('feature-teaser').textContent=card.teaser;
    byId('hero-slug').textContent=card.launchable?
      'AUTHORED DOSSIER / REVISION '+card.revision:'VISUAL CONCEPT / NO RUNTIME';
    image.src=card.art;
    image.alt='Cinematic scene illustration for '+card.title;
    const avail=byId('feature-availability');
    avail.classList.toggle('preview',!card.launchable);
    avail.textContent=card.launchable?
      'AVAILABLE IN PARTY ENGINE · SELECT AND START THERE':'PREVIEW ONLY · NO VALIDATED GAMEPLAY PACKAGE';
    if(card.launchable){
      launchLink.href='./party.html';
      launchLink.removeAttribute('aria-disabled');
      launchLink.removeAttribute('tabindex');
      launchLink.textContent='OPEN PARTY ENGINE';
      launchLink.title='The Party Engine requires an explicit Start; the Hub does not overwrite saves.';
    }else{
      launchLink.removeAttribute('href');
      launchLink.setAttribute('aria-disabled','true');
      launchLink.tabIndex=-1;
      launchLink.textContent='NOT AVAILABLE TO PLAY';
      launchLink.title='This concept has no validated scenario manifest.';
    }
    for(const button of scroller.querySelectorAll('button[data-scenario]')){
      button.setAttribute('aria-pressed',String(button.dataset.scenario===selected));
    }
  }

  for(const card of hubCardsForView('home')){
    const button=element('button','scenario-card');
    button.type='button';
    button.dataset.scenario=card.id;
    button.setAttribute('aria-pressed','false');
    button.setAttribute('aria-label',card.title+
      (card.launchable?' — playable adventure':' — concept preview, not playable'));
    const thumb=element('span','thumb');
    const img=element('img');
    img.src=hubArtPath(card.artKey);
    img.alt='';
    img.loading='lazy';
    img.decoding='async';
    const flag=element('span','thumb-flag'+(card.launchable?'':' preview'),
      card.launchable?'PLAYABLE':'PREVIEW ONLY');
    const slug=element('span','thumb-id',card.launchable?'R'+card.revision:'CONCEPT');
    thumb.append(img,flag,slug);
    const copy=element('span','cardcopy');
    copy.append(element('strong','',card.title),element('small','',card.subtitle),
      element('span','chip',card.tone));
    button.append(thumb,copy);
    button.addEventListener('click',()=>{selected=card.id;renderSelected();});
    scroller.append(button);
  }
  byId('catalog-status').textContent=hubCards.filter(x=>x.launchable).length+
    ' playable / '+hubCards.filter(x=>!x.launchable).length+' previews';
  renderSelected();

  function navigate(view){
    if(!NAV_KEYS.includes(view))view='home';
    for(const tab of document.querySelectorAll('[data-nav]')){
      if(tab.dataset.nav===view)tab.setAttribute('aria-current','page');
      else tab.removeAttribute('aria-current');
    }
    for(const section of document.querySelectorAll('section[data-view]')){
      section.hidden = section.dataset.view!==(view==='adventures'?'home':view);
    }
    if(view==='saves')inspectPresenceOfPartySave();
    if(view==='home'||view==='adventures'){
      byId('hub-home').querySelector('.shell-title .eyebrow').textContent=
        view==='home'?'FIELD OPERATIONS / ORIGINAL DINOSAUR HORROR':'ADVENTURE ARCHIVE / VALIDATED SCENARIOS';
    }
  }

  function inspectPresenceOfPartySave(){
    const display=byId('save-detection');
    try{
      // Intentionally check presence only; Party Engine performs all parsing,
      // validation, version upgrades and migration of legacy formats.
      const exists=window.localStorage.getItem(PARTY_SAVE_KEY)!==null;
      display.textContent=exists?
        'A Party save is present in this browser. Open Party Engine and choose Load to validate and continue.':
        'No Party save is detected in this browser. You can start a new incident from the Party Engine.';
    }catch{
      display.textContent='Browser storage is unavailable. Open the Party Engine to import or start an incident.';
    }
  }
  for(const tab of document.querySelectorAll('[data-nav]')){
    tab.addEventListener('click',()=>{window.location.hash=tab.dataset.nav;navigate(tab.dataset.nav);});
  }
  window.addEventListener('hashchange',()=>navigate(window.location.hash.slice(1)));
  navigate(window.location.hash.slice(1)||'home');
  byId('carousel-prev').addEventListener('click',()=>scroller.scrollBy({left:-270,behavior:'smooth'}));
  byId('carousel-next').addEventListener('click',()=>scroller.scrollBy({left:270,behavior:'smooth'}));
  byId('hub-settings-form').addEventListener('submit',event=>event.preventDefault());
  byId('reduce-motion').addEventListener('change',event=>
    document.documentElement.classList.toggle('no-motion',event.target.checked));
}

if(typeof document!=='undefined'&&typeof window!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initHub,{once:true});
  else initHub();
}
