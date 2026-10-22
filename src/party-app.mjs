import {validateParty,makeParty,CAREERS} from './characters.mjs?v=007c';
import {newPartyIncident,isPartySave,partyView,partyStep,PARTY_SAVE_KIND} from './party-engine.mjs?v=007c';

const $=id=>document.getElementById(id);
const STORE='dinosaur-party-incident-007c';
const LAUNCH='dinosaur-party-launch-007c';
const LAB='dinosaur-character-lab-007';
const esc=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
let state=null,viewed=null,setup=null,lastRoll=null;
function announce(t){$('party-status').textContent=t;}
function loadSetup(){
 let source=null;
 try{
  const launch=JSON.parse(sessionStorage.getItem(LAUNCH)||'null');
  if(launch&&validateParty(launch.characters||[]).length===0)
   source={seed:launch.seed??1993,roster:launch.characters};
 }catch{}
 if(source)return source;
 try{
  const lab=JSON.parse(localStorage.getItem(LAB)||'null');
  if(lab&&validateParty(lab.party||[]).length===0)
   return {seed:lab.seed??1993,roster:lab.party};
 }catch{}
 return {seed:1993,roster:makeParty({seed:1993,size:3})};
}
function restore(){
 try{
  const loaded=JSON.parse(localStorage.getItem(STORE)||'null');
  if(isPartySave(loaded)){
   state=loaded;viewed=state.actors[state.cursor].id;
   announce('Saved party incident restored. Legacy solo saves were not changed.');
   return true;
  }
 }catch{}
 return false;
}
function save(){
 try{localStorage.setItem(STORE,JSON.stringify(state));return true;}
 catch{announce('Browser storage unavailable. Export the party incident to retain progress.');return false;}
}
function create(){
 setup=loadSetup();
 state=newPartyIncident(setup);
 viewed=state.actors[0].id;
 save();
 announce('Party incident ready. Each survivor will act in sequence, one action beat at a time.');
}
function show(){
 if(!state||!isPartySave(state))return;
 if(!state.actors.some(a=>a.id===viewed))viewed=state.actors[state.cursor].id;
 const v=partyView(state,{actorId:viewed});
 const active=state.actors[state.cursor];
 $('beat').textContent=String(v.beat).padStart(3,'0');
 $('round').textContent=String(v.round).padStart(2,'0');
 $('active').textContent=active.name;
 $('party-count').textContent=state.actors.length+' SURVIVORS';
 $('party-roster').innerHTML=state.actors.map(a=>{
  const selected=a.id===viewed,turn=a.id===active.id;
  return '<button type="button" data-view="'+esc(a.id)+'" class="roster-item'+(selected?' selected':'')+(turn?' active':'')+'">'+
   '<span><strong>'+esc(a.name)+'</strong><small>'+esc(CAREERS[a.career]?.label||a.career)+
   ' · '+esc(a.location)+'<br>HP '+a.health+'/'+a.healthMax+' · Stress '+a.stress+'</small></span>'+
   '<span class="chip">'+(turn?'TO ACT':selected?'VIEW':'WATCH')+'</span></button>';
 }).join('');
 $('location-title').textContent=v.roomName;
 $('sector').textContent=v.location.toUpperCase();
 $('room-description').textContent=v.description;
 $('viewed-character').textContent='Viewing '+v.actorName+' · '+(v.actorId===v.activeActorId?'ACTING NOW':'not acting')+
  ' · Health '+v.health+'/'+v.healthMax+' · Stress '+v.stress+
  (v.hidden?' · Concealed':'');
 const flags=v.flags;
 $('objectives').innerHTML=[
  ['keycard','Recover the staff access card',state.actors.some(a=>a.inventory.includes('keycard'))],
  ['power','Restore auxiliary power',flags.power],
  ['distress','Send distress call',flags.distress],
  ['beacon','Activate helipad beacon',flags.beacon]
 ].map(([key,title,done])=>'<div class="objective '+(done?'done':'not-done')+'"><span class="indicator">'+(done?'✓':'○')+'</span>'+esc(title)+'</div>').join('');
 const scene=[];
 if(v.items.length)scene.push('Objects: '+v.items.map(x=>x.name).join(', '));
 if(v.features.length)scene.push('Equipment: '+v.features.join(', '));
 if(v.observations.length)scene.push('Inspectable: '+v.observations.map(x=>x.id).join(', '));
 if(v.inventory.length)scene.push('Carried: '+v.inventory.map(x=>x.name).join(', '));
 if(v.visibleDinosaurs.length)scene.push('DANGER — '+v.visibleDinosaurs.join(', ')+' in this room');
 if(!scene.length)scene.push('No listed equipment or loose supplies in reach.');
 $('local-scene').innerHTML=scene.map(x=>'<div class="scene-thing'+(x.startsWith('DANGER')?' scene-danger':'')+'">'+esc(x)+'</div>').join('');
 $('travel-buttons').innerHTML=v.exits.map(x=>'<button type="button" data-order="move '+esc(x.id)+'"'+(v.actorId!==v.activeActorId?' disabled':'')+'>'+esc(x.name)+'</button>').join('');
 const buttons=[
  ...v.items.map(i=>['take '+i.id,'Take '+i.name]),
  ...v.features.map(f=>['use '+f,'Operate '+f]),
  ...v.observations.map(o=>['investigate '+o.id,'Investigate '+o.id]),
  ['hide','Find cover'],['wait','Wait / Listen']
 ];
 $('world-buttons').innerHTML=buttons.map(([order,label])=>
  '<button type="button" data-order="'+esc(order)+'"'+(v.actorId!==v.activeActorId?' disabled':'')+'>'+esc(label)+'</button>').join('');
 $('party-events').innerHTML=v.events.length?v.events.map(e=>'<p class="event-entry '+esc(e.category)+
  '"><small>BEAT '+e.beat+'</small>'+esc(e.message)+'</p>').join(''):'<p class="note">No events observed by this survivor yet.</p>';
 $('party-events').scrollTop=$('party-events').scrollHeight;
 $('party-command').disabled=v.actorId!==v.activeActorId||state.outcome!=='playing';
 $('party-submit').disabled=$('party-command').disabled;
 if(state.outcome!=='playing')announce('RESCUE SIGNAL ACTIVE — the party incident objectives are complete.');
}
function issue(command){
 if(!state||state.outcome!=='playing')return;
 if(viewed!==state.actors[state.cursor].id){
  announce('Select the highlighted acting survivor to give an order.');
  return;
 }
 const input=String(command||'').trim();
 if(!input){announce('Describe an action.');return;}
 const parsed=input.startsWith('push ')?input:$('party-push').checked?'push '+input:input;
 const response=partyStep(state,parsed,{actorId:viewed});
 if(!response.accepted){announce(response.reason||'Action unavailable.');return;}
 state=response.state;
 const roll=response.result;
 lastRoll=roll&&Array.isArray(roll.base)?roll:null;
 const resultMessage=lastRoll ? (roll.success?'Skill check succeeded':'Skill check failed')+
  ' · '+roll.successes+' successes'+(roll.pushRefused?' · Push not permitted: '+roll.pushRefused:'') : 'Action recorded';
 const diceInfo=lastRoll&&$('party-show-roll').checked?
  ' · Base ['+roll.base.join(', ')+'] Stress ['+roll.stressDice.join(', ')+'] · Seed '+roll.seed:'';
 announce(resultMessage+diceInfo+' · Shared action beat '+state.beat);
 viewed=state.actors[state.cursor].id;
 $('party-command').value='';
 $('party-push').checked=false;
 save();show();
 // Keep the latest action outcome readable when the camera follows the next actor.
 if(state.outcome==='playing')announce(resultMessage+diceInfo+' · Next: '+state.actors[state.cursor].name);
}
$('party-roster').addEventListener('click',e=>{
 const button=e.target.closest('[data-view]');
 if(!button)return;
 viewed=button.dataset.view;
 show();announce(viewed===state.actors[state.cursor].id?
  'Now viewing the acting survivor.':'Viewing another survivor; switching views does not advance time.');
});
for(const id of ['travel-buttons','world-buttons'])
 $(id).addEventListener('click',e=>{
  const button=e.target.closest('[data-order]');if(button)issue(button.dataset.order);
 });
$('party-command-form').addEventListener('submit',e=>{
 e.preventDefault();issue($('party-command').value);
});
$('save-incident').addEventListener('click',()=>{
 announce(save()?'Party incident saved in separate local browser storage.':'Save failed.');
});
$('load-incident').addEventListener('click',()=>{
 if(restore())show();else announce('No valid saved party incident found.');
});
$('restart-incident').addEventListener('click',()=>{
 if(!confirm('Restart this party incident? Current party incident progress will be replaced. Your legacy game save is untouched.'))return;
 create();show();
});
$('export-incident').addEventListener('click',()=>{
 if(!isPartySave(state)){announce('Invalid party state; cannot export.');return;}
 const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='party-incident-007c-beat-'+state.beat+'.json';
 document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
 announce('Party incident exported.');
});
setup=loadSetup();
if(!restore())create();
show();
