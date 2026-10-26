import {validateParty,makeParty,CAREERS} from './characters.mjs?v=007l2a';
import {newPartyIncident,isPartySave,upgradePartySave,partyView,partyStep} from './party-engine.mjs?v=009c3';
import {currentOwner,cameraActorId,setControlMode,setFocusActor,setCamera,
  setPlayback,runAutonomousTurn} from './party-director.mjs?v=009c3';
import {activeCombatSlot,activeTurnId,combatCost} from './combat-turns.mjs?v=007l2b1';
import {selectedCombatSlot} from './adventure-combat-live.mjs';
import {TRAUMA,woundModifiers,pendingLethal} from './evolved-injuries.mjs?v=007l2a';

const $=id=>document.getElementById(id);
const STORE='dinosaur-party-incident-007c'; // Upgrade in place; never touch legacy solo saves.
const LAUNCH='dinosaur-party-launch-007c';
const LAB='dinosaur-character-lab-007';
const esc=v=>String(v??'').replace(/[&<>"']/g,x=>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
let state=null,setup=null,timer=null;
function announce(t){$('party-status').textContent=t;}
function cancelAuto(){if(timer!==null){clearTimeout(timer);timer=null;}}
function loadSetup(){
 try{
  const draft=JSON.parse(localStorage.getItem(LAB)||'null');
  if(draft&&validateParty(draft.party||[]).length===0)
   return {seed:draft.seed??1993,roster:draft.party};
 }catch{}
 return {seed:1993,roster:makeParty({seed:1993,size:3})};
}
function save(){
 try{localStorage.setItem(STORE,JSON.stringify(state));return true;}
 catch {announce('Browser storage unavailable; export the incident to keep progress.');return false;}
}
function restore(){
 cancelAuto();
 try{
  const loaded=JSON.parse(localStorage.getItem(STORE)||'null');
  if(loaded){
   const migrated=upgradePartySave(loaded);
   state=migrated;setup={seed:migrated.initialSeed,roster:migrated.startingRoster};
   // A reload is always paused: an unseen tab must not simulate events.
   if(!state.control.paused)state=setPlayback(state,{paused:true}).state;
   save();
   announce(loaded.version===2?
     'Existing 007-C party save migrated safely to 007-D, with all events retained.' :
     'Saved multi-character incident restored. AI playback is paused.');
   return true;
  }
 }catch(error){announce('Saved party is unavailable: '+error.message);}
 return false;
}
function create({roster=null,seed=null}={}){
 cancelAuto();
 if(roster)setup={seed:seed??1993,roster};
 else setup=state?.startingRoster&&validateParty(state.startingRoster).length===0?
   {seed:state.initialSeed,roster:state.startingRoster}:(setup??loadSetup());
 state=newPartyIncident({...setup,adventureId:$('adventure-select').value});
 save();announce('New '+(state.scenario==='ridge-survey'?'research':'rescue')+
  ' incident started. Choose a control mode at any time.');
}
function selectedOption(id,label,selected){
 return '<option value="'+esc(id)+'"'+(id===selected?' selected':'')+'>'+esc(label)+'</option>';
}
function show(){
 if(!state||!isPartySave(state))return;
 const watching=cameraActorId(state),v=partyView(state,{actorId:watching});
 $('adventure-select').value=v.adventureId||'nublar-after-the-storm';
 const turn=selectedCombatSlot(state)||activeCombatSlot(state),predatorTurn=turn?.kind==='dinosaur';
 const active=predatorTurn?{name:'Predator',id:turn.actorId}:
   state.actors.find(a=>a.id===(state.combatReaction?.victimId||
     state.pendingPredatorResponse?.victimId||(turn?.actorId||activeTurnId(state))));
 const owner=currentOwner(state);
 const pending=state.combat?.pendingReaction||state.pendingPredatorResponse||state.combatReaction;
 const ownHuman=owner==='human'&&state.outcome==='playing';
 $('beat').textContent=String(v.beat).padStart(3,'0');
 $('round').textContent=String(v.round).padStart(2,'0');
 $('active').textContent=active.name;
 $('owner').textContent=pending?(owner==='human'?'DEFEND / DECLINE':'AI DEFENSE'):predatorTurn?'DINOSAUR':owner==='human'?'PLAYER':'COMPUTER';
 $('reaction-panel').hidden=!(pending&&ownHuman);
 if(pending){
  const target=state.actors.find(a=>a.id===pending.victimId);
  $('reaction-target').textContent=target.name+' — velociraptor attack declared';
 }
 $('party-count').textContent=state.actors.length+' SURVIVORS';
 $('control-mode').value=state.control.mode;
 $('control-summary').textContent=state.control.mode.toUpperCase()+' · '+owner.toUpperCase()+' TO ACT';
 $('focus-actor').innerHTML=state.actors.map(a=>selectedOption(a.id,a.name,state.control.focusedActorId)).join('');
 $('focus-actor').disabled=state.control.mode!=='focus';
 $('camera-mode').value=state.control.cameraMode;
 $('camera-actor').innerHTML=state.actors.map(a=>selectedOption(a.id,a.name,state.control.cameraActorId)).join('');
 $('camera-actor').disabled=state.control.cameraMode!=='actor';
 $('playback-speed').value=String(state.control.speedMs);
 const running=state.control.mode!=='party'&&!state.control.paused&&state.outcome==='playing';
 $('playback-status').textContent=state.control.mode==='party'?'ALL SURVIVORS PLAYER-CONTROLLED':
   (running?'AI PLAYBACK ACTIVE':'AI PLAYBACK PAUSED');
 $('sim-resume').disabled=state.control.mode==='party'||running||state.outcome!=='playing';
 $('sim-pause').disabled=state.control.mode==='party'||!running||state.outcome!=='playing';
 $('sim-step').disabled=owner!=='ai'||state.outcome!=='playing';
 $('party-roster').innerHTML=state.actors.map(a=>{
  const selected=a.id===watching,acting=a.id===active.id;
  const human=state.control.mode==='party'||
    (state.control.mode==='focus'&&state.control.focusedActorId===a.id);
  // A focus or spectator camera cannot automatically know separated survivors' stats/positions.
  const nearby=state.control.mode==='party'||a.id===watching||
    a.location===state.actors.find(x=>x.id===watching).location;
  const details=nearby?(esc(a.location)+' · HP '+a.health+'/'+a.healthMax+' · Stress '+a.stress+
    (a.dead?' · DECEASED':a.broken?' · INCAPACITATED':'')+
    ((a.criticalInjuries||[]).length?' · INJURED':'')):
    'Status unknown from this viewpoint';
  return '<button type="button" data-view="'+esc(a.id)+'" class="roster-item'+
    (selected?' selected camera-actor':'')+(acting?' active':'')+'">'+
    '<span><strong>'+esc(a.name)+'</strong><small>'+esc(CAREERS[a.career]?.label||a.career)+
    '<br>'+details+'</small></span><span class="chip '+(human?'player-owned':'ai-owned')+'">'+
    (acting?(human?'TO ACT':'AI TURN'):(human?'PLAYER':'AI'))+'</span></button>';
 }).join('');
 $('location-title').textContent=v.roomName;
 $('sector').textContent=v.location.toUpperCase();
 $('room-description').textContent=v.description+'  ['+v.lighting+']'+
    (v.weather?' · Weather: '+(v.weather==='squall'?'heavy squall':'rain'):'');
 $('viewed-character').textContent='Watching '+v.actorName+
   (v.actorId===v.activeActorId?' · CURRENT TURN':' · NOT CURRENT TURN')+
   ' · Health '+v.health+'/'+v.healthMax+' · Stress '+v.stress+(v.hidden?' · Concealed':'')+
   (v.dead?' · DECEASED':v.broken?' · INCAPACITATED':'')+
   (v.panicState?' · Panic: '+v.panicState:'')+
   (v.injuries?.length?' · Injuries: '+v.injuries.map(i=>
     '#'+i.code+' '+(i.label||TRAUMA[i.code]?.label||'Wound')+
     (i.healed?' [healed]':i.stabilized?' [stable]':i.deadline?' [urgent '+i.deadline+']':'')
     ).join('; '):'')+
   ' · Exploration '+v.time.minutes+' min'+
   (v.time.combatSeconds?' · Combat '+v.time.combatSeconds+' s':'');
 const flags=v.flags;
 $('objectives').innerHTML=(v.objectives?
  v.objectives.map(o=>[o.description,o.done]):[
   ['Recover the staff access card',state.actors.some(a=>a.inventory.includes('keycard'))],
   ['Restore auxiliary power',flags.power],
   ['Send distress call',flags.distress],
   ['Activate helipad beacon',flags.beacon]
  ]).map(([title,done])=>'<div class="objective '+(done?'done':'not-done')+
   '"><span class="indicator">'+(done?'✓':'○')+'</span>'+esc(title)+'</div>').join('');
 const scene=[];
  if(v.scenarioMaterial?.briefing)
   scene.push('MISSION BRIEF · '+v.scenarioMaterial.briefing.title+' — '+v.scenarioMaterial.briefing.text);
  for(const h of v.scenarioMaterial?.handouts||[])
   scene.push('FIELD DOCUMENT · '+h.title+' — '+h.text);
  for(const a of v.scenarioMaterial?.privateAgendas||[])
   scene.push('PRIVATE ACT '+a.act+' AGENDA · '+a.text);
  for(const c of v.scenarioMaterial?.privateStoryCards||[])
   scene.push('PRIVATE STORY CARD · '+c.text);
 if(v.cinematicAct)scene.push('CINEMATIC ACT '+v.cinematicAct.number+' · '+v.cinematicAct.title+' — '+v.cinematicAct.objective);
 if(v.cinematicScene){
  scene.push('SCENE · '+v.cinematicScene.title+' ['+v.cinematicScene.theme+']');
  scene.push('Situation: '+v.cinematicScene.focus);
  scene.push('Possible approaches: '+v.cinematicScene.choices);
 }
 if(v.serviceShutterClosed)scene.push('PHYSICAL BARRIER — the shed storm shutter is CLOSED. It blocks the doorway and sightlines.');
 if(v.localPaddockGateBraced)scene.push('PERIMETER — the damaged service gate has been braced; loose metal no longer swings in the wind.');
 if(v.sceneConsequences?.length)scene.push(...v.sceneConsequences.map(c=>'CONTINUITY · '+c.text));
 if(v.wildlifeEncounter?.title)scene.push('LIVING DINOSAUR · '+v.wildlifeEncounter.title+' — '+v.wildlifeEncounter.description);
 else if(v.wildlifeEncounter?.description)scene.push('WILDLIFE · '+v.wildlifeEncounter.description);
 if(v.dialogueOpportunities?.length)scene.push('COMPANIONS · A teammate is here to talk or plan with.');
  for(const npc of v.supportingCast||[])scene.push('PERSON · '+npc.name+' ('+npc.role+') — '+npc.description);
 if(v.parkGuide)scene.push('PARK EMPLOYEE · '+v.parkGuide.name+' ['+v.parkGuide.status+'] — '+v.parkGuide.description);
 if(v.personalLight.carried)scene.push('LIGHT SUPPLIES · '+v.batterySupplies.carried+' spare cell(s) carried; lamp charge '+v.personalLight.charge+'.');
 if(v.rescueEnding)scene.push('RESCUE CONSEQUENCE · '+v.rescueEnding.text);
  if(v.availableSceneEvents?.length)scene.push('Cinematic opportunities: '+v.availableSceneEvents.map(e=>e.title).join(', '));
  if(v.availableDangerEvents?.length)scene.push('Optional physical challenges: '+v.availableDangerEvents.map(e=>e.title+' ['+e.skill+']').join(', '));
  if(['jungle','paddock','helipad'].includes(v.location))scene.push('Exploration pressure: '+v.encounterPressure.label+' · '+v.encounterPressure.checks+' checks');
  if(v.items.length)scene.push('Objects: '+v.items.map(x=>x.name).join(', '));
 if(v.features.length)scene.push('Equipment: '+v.features.join(', '));
 if(v.observations.length)scene.push('Inspectable: '+v.observations.map(x=>x.id).join(', '));
 if(v.wonder)scene.push('A moment of wonder: '+v.wonder.title+
   (v.wonder.discovered?' (remembered)':' (available to appreciate)'));
 if(v.wonderJournal.length)scene.push('Personal discoveries remembered: '+v.wonderJournal.length);
 if(v.inventory.length)scene.push('Carried: '+v.inventory.map(x=>x.name).join(', '));
  if(v.personalLight.carried)scene.push('Personal light: '+(v.personalLight.on?'ON':'OFF')+
    ' · '+v.personalLight.charge+' exploration stretches remaining');
  if(v.groupTravel)scene.push('Group plan: '+v.groupTravel.approach+' travel toward '+
    v.groupTravel.to+' (each survivor moves on their own turn)');
 if(v.visibleDinosaurs.length)scene.push('DANGER — '+v.visibleDinosaurs.join(', ')+' in this room');
  if(v.distantSightings?.length)scene.push('DANGER — '+v.distantSightings.map(d=>d.kind).join(', ')+
    ' glimpsed down an unobstructed sightline; not within attack range');
  if(v.cover)scene.push('Current cover: '+v.cover.label);
  if(v.availableCover?.length)scene.push('Physical concealment: '+
    v.availableCover.map(x=>x.label).join(', '));
 if(v.medicalUrgency?.length)
  scene.push('MEDICAL EMERGENCY — '+v.medicalUrgency.map(x=>'Wound #'+x.code+
    ': '+x.deadline+' interval to next survival check').join('; '));
 if(!scene.length)scene.push('No listed equipment or loose supplies in reach.');
 $('local-scene').innerHTML=scene.map(x=>'<div class="scene-thing'+
   (x.startsWith('DANGER')?' scene-danger':'')+'">'+esc(x)+'</div>').join('');
 const canScene=ownHuman&&v.actorId===v.activeActorId;
 const impairment=woundModifiers(state.actors.find(a=>a.id===v.actorId),'mobility');
 const travelCost=impairment.moveFull?'full':'quick';
 const moveBudget=v.combat?.remaining;
 const exhaustedMove=Boolean(moveBudget&&(
   impairment.immobile||(travelCost==='full'?(moveBudget.fullSpent||moveBudget.quickSpent>=2):
   (moveBudget.quickSpent>=2||(moveBudget.fullSpent&&moveBudget.quickSpent>=1)))));
 $('travel-buttons').innerHTML=v.exits.map(x=>
   '<button type="button" data-order="move '+esc(x.id)+'"'+(!canScene||exhaustedMove||x.blocked?' disabled':'')+'>'+esc(x.name)+(x.blocked?' (shutter closed)':'')+'</button>'+ 
   '<button type="button" data-order="sneak '+esc(x.id)+'"'+(!canScene||
     Boolean(x.blocked||v.combat?.remaining&&(v.combat.remaining.fullSpent||v.combat.remaining.quickSpent>=2))?' disabled':'')+
     '>Sneak to '+esc(x.name)+'</button>'+
    '<button type="button" data-order="rush '+esc(x.id)+'"'+(!canScene||exhaustedMove||x.blocked?' disabled':'')+
      '>Rush to '+esc(x.name)+'</button>'+
    (state.actors.some(a=>a.id!==v.actorId&&a.location===v.location&&!a.dead&&!a.broken)?
      '<button type="button" data-order="group quietly to '+esc(x.id)+'"'+(!canScene||x.blocked?' disabled':'')+
      '>Lead group quietly to '+esc(x.name)+'</button>':'')).join('');
 const actions=[
  ...(v.availableSceneEvents||[]).map(e=>['scene '+e.id,'Experience scene · '+e.title]),
  ...(v.availableDangerEvents||[]).map(e=>['danger '+e.id,'Attempt challenge · '+e.title+' ('+e.skill+')']),
  ...(v.wildlifeEncounter?.choices||[]).map(o=>['wildlife '+o.id,o.label+(o.skill?' ('+o.skill+')':'')]),
  ...(v.dialogueOpportunities||[]).map(o=>['talk '+o.recipientId+' '+o.topic,o.label+' · '+o.recipientName]),
   ...(v.supportingCast||[]).flatMap(n=>n.topics.map(t=>[
    'npc '+n.id+' '+t.id,'Ask '+n.name+' · '+t.prompt])),
  ...(v.parkGuide?.options||[]).map(o=>['guide '+o.id,o.label+(o.skill?' ('+o.skill+')':'')]),
  ...(v.batteryActions||[]).map(o=>['battery '+o.id,o.label]),
  ...v.items.map(i=>['take '+i.id,'Take '+i.name]),
  ...v.features.map(f=>['use '+f,f==='shutter'?(v.serviceShutterClosed?'Open storm shutter':'Close storm shutter'):'Operate '+f]),
  ...v.observations.map(o=>['investigate '+o.id,'Investigate '+o.id]),
  ...(v.wonder&&!v.wonder.discovered&&!v.combat?[
    ['wonder '+v.wonder.id,'Take in the view · '+v.wonder.title]]:[]),
  ...(v.visibleDinosaurs.length&&v.adventureId!=='ridge-survey'?[['attack dinosaur','Fight the dinosaur']]:[]),
  ...state.actors.filter(a=>a.location===v.location&&!a.dead&&
      (a.broken||pendingLethal(a).length))
    .map(a=>['aid '+a.id,'First aid: '+a.name]),
  ...state.actors.filter(a=>a.location===v.location&&a.broken&&!a.dead&&a.id!==v.actorId)
    .map(a=>['rally '+a.id,'Rally '+a.name]),
  ...state.actors.filter(a=>a.location===v.location&&!a.dead&&a.id!==v.actorId&&
       a.criticalInjuries?.some(w=>!w.healed&&!w.surgeryDone&&TRAUMA[w.code]?.surgery))
    .map(a=>['surgery '+a.id,'Surgery: '+a.name]),
  ...(['control','shed'].includes(v.location)&&!v.combat?[['rest','Rest safely (one stretch)']]:[]),
  ...(v.personalLight.carried?[[v.personalLight.on?'light off':'light on',
    v.personalLight.on?'Switch light OFF':'Switch light ON']]:[]),
   ...(v.groupTravel?[[
    (v.groupTravel.approach==='quiet'?'sneak ':v.groupTravel.approach==='noisy'?'rush ':'move ')+v.groupTravel.to,
    'Follow group to '+v.groupTravel.to]]:[]),
   ...v.availableCover.map(x=>['hide behind '+x.id,'Hide behind '+x.label]),
   ['guard','Stand watch / brace'],['hide','Find cover'],['wait','Wait / Listen'],
  ...(v.combat&&canScene&&v.adventureId!=='ridge-survey'?v.combat.order.slice(v.combat.index+1).map(slot=>
   ['hold '+slot.card,'Hold for '+(slot.kind==='dinosaur'?'Velociraptor':
      state.actors.find(a=>a.id===slot.actorId)?.name||'survivor')+' (#'+slot.card+')']):[]),
  ...(v.combat?[['end','End combat turn']]:[])
 ];
 const displayed=v.combat&&v.adventureId==='ridge-survey'?
  actions.filter(([order])=>['end','wait'].includes(order)||
   /^(take|give|aid) /.test(order)):actions;
 $('world-buttons').innerHTML=displayed.map(([order,label])=>{
  const budget=v.combat?.remaining;
  let cost=combatCost(order.split(' ')[0]);
  if(order.startsWith('move ')&&woundModifiers(state.actors.find(a=>a.id===v.actorId),'mobility').moveFull)
   cost='full';
  const exhausted=Boolean(budget&&(
   (cost==='full'&&(budget.fullSpent||budget.quickSpent>=2))||
   (cost==='quick'&&(budget.quickSpent>=2||(budget.fullSpent&&budget.quickSpent>=1)))
  ));
  return '<button type="button" data-order="'+esc(order)+'"'+
    (!canScene||exhausted?' disabled':'')+'>'+esc(label)+'</button>';
 }).join('');
 $('party-events').innerHTML=v.events.length?v.events.map(e=>
  '<p class="event-entry '+esc(e.category)+'"><small>BEAT '+e.beat+'</small>'+esc(e.message)+'</p>').join(''):
  '<p class="note">No observations from this camera yet.</p>';
 $('party-events').scrollTop=$('party-events').scrollHeight;
 $('party-command').disabled=!ownHuman||Boolean(pending);
 $('party-submit').disabled=!ownHuman||Boolean(pending);
 $('party-command').placeholder=ownHuman?
   'Order for '+active.name+' (e.g. go lobby, inspect consoles)':
   'The computer currently controls '+active.name;
 const actionBudget=v.combat?.remaining;
 $('combat-status').textContent=v.combat?
   'COMBAT ROUND '+v.combat.round+' · INITIATIVE CARD #'+v.combat.card+
   ' · '+(pending?'ATTACK DECLARED · awaiting defense choice':predatorTurn?'Dinosaur turn (automatic)':(actionBudget?
      'Full '+(actionBudget.fullSpent?'spent':'ready')+
      ' · Quick '+Math.max(0,2-actionBudget.quickSpent)+' remaining':'No human action budget'))+
   (v.combat.surprise?.ambush&&!v.combat.surprise.consumed&&v.combat.round===1?
     ' · AMBUSH: first strike cannot be dodged':'')+
   ' · 5–10 seconds per combat round':
   state.pendingPredatorResponse?'PREDATOR STRIKE · DEFEND or DECLINE · 10-second reaction':
    'EXPLORATION · 5–10 minute stretches · no combat';
 if(state.outcome!=='playing')announce(state.outcome==='lost'?
  'ALL SURVIVORS LOST — this incident has ended.':
  (v.adventureId==='ridge-survey'?'The field survey is complete; the team has returned safely.':
   'Rescue objectives complete; this incident has ended.'));
 queueAutoplay();
}
function commit(result,label){
 if(!result.accepted){announce(result.reason||'Decision was not accepted.');return false;}
 state=result.state;
 save();show();
 if(label)announce(label);
 return true;
}
function issue(command){
 if(!state||state.outcome!=='playing')return;
 if(state.combat?.pendingReaction||state.pendingPredatorResponse||state.combatReaction){announce('Resolve the incoming attack first: defend or decline.');return;}
 if(currentOwner(state)!=='human'){announce('This actor is computer-controlled. Pause and take over a character to intervene.');return;}
 const input=String(command||'').trim();
 if(!input){announce('Describe an action.');return;}
 cancelAuto();
 const parsed=input.startsWith('push ')?input:$('party-push').checked?'push '+input:input;
 const acting=state.actors.find(a=>a.id===((selectedCombatSlot(state)?.actorId)||
  state.pendingPredatorResponse?.victimId||state.actors[state.cursor].id));
 const r=partyStep(state,parsed,{actorId:acting.id,source:'human'});
 if(!r.accepted){announce(r.reason);queueAutoplay();return;}
 const roll=r.result;
 const rolled=roll&&Array.isArray(roll.base);
 const message=rolled?(roll.success?'Skill success':'Skill failure')+' · '+roll.successes+
   ' successes'+(roll.pushRefused?' · Push unavailable: '+roll.pushRefused:'')+
   ($('party-show-roll').checked?' · Base ['+roll.base.join(', ')+'] Stress ['+
     roll.stressDice.join(', ')+'] · Seed '+roll.seed:''):'Action committed';
 $('party-command').value='';$('party-push').checked=false;
 commit(r,message+' · Next: '+r.state.actors[r.state.cursor].name);
}
function reactToAttack(choice){
 const pending=state?.combat?.pendingReaction||state?.pendingPredatorResponse||state?.combatReaction;
 if(!pending||state.outcome!=='playing'||currentOwner(state)!=='human'){
  announce('No human-controlled defensive reaction is pending.');return;
 }
 cancelAuto();
 const r=partyStep(state,{kind:'react',target:choice},
  {actorId:pending.victimId,source:'human'});
 if(!r.accepted){announce(r.reason);return;}
 commit(r,(choice==='defend'?'Defensive Close Combat roll resolved.':
   'The defender declined the reaction.')+' · Predator initiative completed.');
}
$('react-defend').addEventListener('click',()=>reactToAttack('defend'));
$('react-decline').addEventListener('click',()=>reactToAttack('decline'));
function autoOnce({singleStep=false}={}){
 if(!state||currentOwner(state)!=='ai'||state.outcome!=='playing')return false;
 cancelAuto();
 const expectedBeat=state.beat,expectedEpoch=state.control.epoch;
 const result=runAutonomousTurn(state,{singleStep,expectedBeat,expectedEpoch});
 if(!result.accepted){
  if(result.reason!=='The current survivor awaits player input.'){
   state=setPlayback(state,{paused:true}).state;save();show();
   announce('Simulation paused: '+result.reason);
  }
  return false;
 }
 const who=(selectedCombatSlot(state)||activeCombatSlot(state))?.kind==='dinosaur'?
  'Predator':state.actors[state.cursor].name;
 const statement=who+' (AI): '+result.decision.acceptedAction+
   (result.decision.proposed.target?' '+result.decision.proposed.target:'');
 commit(result,statement);
 return true;
}
function queueAutoplay(){
 cancelAuto();
 const predator=(selectedCombatSlot(state)||activeCombatSlot(state))?.kind==='dinosaur';
 if(!state||(state.control.paused&&!(predator&&state.control.mode==='party'))||(!predator&&state.control.mode==='party')||
   state.outcome!=='playing'||currentOwner(state)!=='ai'||document.hidden)return;
 const expectedBeat=state.beat,expectedEpoch=state.control.epoch;
 timer=setTimeout(()=>{
   timer=null;
   if(!state||state.beat!==expectedBeat||state.control.epoch!==expectedEpoch||
      (state.control.paused&&!(predator&&state.control.mode==='party'))||document.hidden||currentOwner(state)!=='ai')return;
   autoOnce({singleStep:predator&&state.control.mode==='party'});
 },predator&&state.control.mode==='party'?450:state.control.speedMs);
}
function applyControl(result,message){
 cancelAuto();
 if(result.accepted){
  state=result.state;save();show();
  announce(message);
 }else announce(result.reason);
}
$('party-roster').addEventListener('click',e=>{
 const button=e.target.closest('[data-view]');if(!button)return;
 applyControl(setCamera(state,{mode:'actor',actorId:button.dataset.view}),
   'Camera switched to '+state.actors.find(a=>a.id===button.dataset.view)?.name+
   '. This did not change character control or world time.');
});
for(const id of ['travel-buttons','world-buttons'])
 $(id).addEventListener('click',e=>{
  const button=e.target.closest('[data-order]');if(button)issue(button.dataset.order);
 });
$('party-command-form').addEventListener('submit',e=>{
 e.preventDefault();issue($('party-command').value);
});
$('control-mode').addEventListener('change',e=>{
 applyControl(setControlMode(state,{mode:e.target.value}),
   'Control switched to '+e.target.value+'. AI is paused; resume when ready.');
});
$('focus-actor').addEventListener('change',e=>{
 applyControl(setFocusActor(state,e.target.value),
   'Player focus changed. All prior actions and dice are preserved.');
});
$('camera-mode').addEventListener('change',e=>{
 applyControl(setCamera(state,{mode:e.target.value}),
   'Camera changed without changing control or game time.');
});
$('camera-actor').addEventListener('change',e=>{
 applyControl(setCamera(state,{mode:'actor',actorId:e.target.value}),
   'Watching another survivor. Character knowledge is unchanged.');
});
$('playback-speed').addEventListener('change',e=>{
 applyControl(setPlayback(state,{speedMs:Number(e.target.value)}),
   'AI display pace updated; action costs and dice remain identical.');
});
$('sim-resume').addEventListener('click',()=>{
 applyControl(setPlayback(state,{paused:false}),
   'AI simulation resumed. You can pause or take control at any time.');
});
$('sim-pause').addEventListener('click',()=>{
 applyControl(setPlayback(state,{paused:true}),
   'AI paused at an action boundary. World and RNG are unchanged.');
});
$('sim-step').addEventListener('click',()=>{
 if(currentOwner(state)!=='ai'){announce('A human-controlled survivor is due to act.');return;}
 if(!state.control.paused) {
  state=setPlayback(state,{paused:true}).state;save();
 }
 autoOnce({singleStep:true});
});
$('save-incident').addEventListener('click',()=>{
 announce(save()?'Party incident saved with control mode and spectator state.':'Save failed.');
});
$('load-incident').addEventListener('click',()=>{
 if(restore())show();else announce('No valid saved party incident found.');
});
$('restart-incident').addEventListener('click',()=>{
 if(!confirm('Start the selected adventure with this party? Current progress will be replaced; legacy solo saves stay untouched.'))return;
 create();show();
});
$('export-incident').addEventListener('click',()=>{
 if(!isPartySave(state)){announce('Invalid party state; export unavailable.');return;}
 const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='party-incident-007d-beat-'+state.beat+'.json';
 document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
 announce('Party incident and complete control/AI journal exported.');
});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden&&state?.control.mode!=='party'&&!state.control.paused){
  cancelAuto();state=setPlayback(state,{paused:true}).state;save();
 }else if(!document.hidden)show();
});
window.addEventListener('pagehide',cancelAuto);
let incoming=null;
try{
 const raw=sessionStorage.getItem(LAUNCH);
 if(raw){incoming=JSON.parse(raw);sessionStorage.removeItem(LAUNCH);}
}catch{incoming=null;}
if(incoming&&validateParty(incoming.characters||[]).length===0){
 try {create({seed:incoming.seed??1993,roster:incoming.characters});}
 catch(error){announce('Cannot launch party: '+error.message);if(!restore())create();}
}else if(!restore())create();
show();
