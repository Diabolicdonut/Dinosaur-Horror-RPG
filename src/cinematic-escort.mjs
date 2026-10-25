// 008-C1 — One authored, noncombat park employee and an optional grounded
// escort/rescue branch. All movement is committed by the same Party engine.
import {SCENARIO} from './scenario.mjs';
export const PARK_GUIDE=Object.freeze({
 id:'guide-mara',
 name:'Mara Velez',
 role:'Park visitor-services guide',
 initialLocation:'lobby',
 intro:'Mara Velez, a visitor-services guide, crouches behind the reception counter. She has a park map but is frightened by the failed fence alarms.',
 warning:'The park roads are unsafe. Mara asks whether the team has restored the radio and knows a route toward the helipad.'
});
export const defaultGuide=()=>({status:'waiting',location:PARK_GUIDE.initialLocation,
 escortId:null,attemptedBy:[],spokenBy:[]});
export const guideState=s=>s?.parkGuide??defaultGuide();
export function validParkGuide(s){
 const g=s?.parkGuide;
 if(g===undefined)return true; // valid older party v3 saves
 if(!g||!['waiting','following','sheltered','mustered'].includes(g.status)||
  !SCENARIO.rooms[g.location]||!Array.isArray(g.attemptedBy)||!Array.isArray(g.spokenBy)||
  g.attemptedBy.length>s.actors.length||g.spokenBy.length>s.actors.length||
  new Set(g.attemptedBy).size!==g.attemptedBy.length||
  new Set(g.spokenBy).size!==g.spokenBy.length||
  g.attemptedBy.some(id=>!s.actors.some(a=>a.id===id))||
  g.spokenBy.some(id=>!s.actors.some(a=>a.id===id))||
  (g.status==='following'?!s.actors.some(a=>a.id===g.escortId&&a.location===g.location):g.escortId!==null)||
  (g.status==='sheltered'&&g.location!=='control')||
  (g.status==='mustered'&&g.location!=='helipad'))return false;
 return true;
}
export function guideOptions(s,actor){
 const g=guideState(s);
 if(!s||!actor||s.outcome!=='playing'||s.combat?.active||actor.dead||
  actor.broken||actor.pendingSkip||actor.location!==g.location||
  g.status==='mustered')return [];
 const options=[];
 if(!g.spokenBy.includes(actor.id))
  options.push({id:'talk',label:'Speak with Mara Velez',skill:null});
 if(g.status==='waiting'&&!g.attemptedBy.includes(actor.id))
  options.push({id:'persuade',label:'Persuade Mara to travel with you',skill:'manipulation'});
 if(g.status==='sheltered')
  options.push({id:'escort',label:'Invite Mara to leave the secure room with you',skill:null});
 if(g.status==='following'&&g.escortId!==actor.id)
  options.push({id:'handoff',label:'Take over escorting Mara',skill:null});
 if(g.status==='following'&&g.escortId===actor.id&&actor.location==='control')
  options.push({id:'shelter',label:'Let Mara shelter in the reinforced control room',skill:null});
 if(g.status==='following'&&g.escortId===actor.id&&actor.location==='helipad')
  options.push({id:'muster',label:'Help Mara wait at the emergency helipad',skill:null});
 return options;
}
export function guideSpeech(s){
 return s.flags?.distress?
  'Mara hears that the distress call went through and asks to reach the emergency beacon before the storm closes in.':
  s.flags?.power?
  'Mara is relieved the generator is running, but knows the distress radio still needs to be used.':
  'Mara explains that the Visitor Center has emergency radios, but the auxiliary generator must first be restored.';
}
export function guideLocalView(s,actor){
 const g=guideState(s);
 return actor.location!==g.location?null:{
  name:PARK_GUIDE.name,role:PARK_GUIDE.role,status:g.status,
  description:g.status==='waiting'?PARK_GUIDE.intro:
    g.status==='following'?'Mara follows her designated escort on the same park route, keeping close to the group.':
    g.status==='sheltered'?'Mara waits under reinforced cover in the control room, out of the direct weather.':
    'Mara is waiting on the helipad for the emergency pickup.',
  options:guideOptions(s,actor)
 };
}
export function endingForGuide(s){
 const g=guideState(s);
 if(g.status==='mustered')
  return {id:'guide-aboard',text:'Mara Velez reached the emergency helipad and was accounted for at rescue.'};
 if(g.location==='helipad')
  return {id:'guide-at-pad',text:'Mara Velez reached the helipad, but the team had not formally gathered her when the beacon activated.'};
 if(g.status==='sheltered')
  return {id:'guide-sheltered',text:'Mara Velez remains sheltered at the Visitor Center; her later extraction is not confirmed.'};
 return {id:'guide-unaccounted',text:'Mara Velez was not at the rescue helipad. Her subsequent evacuation is unknown.'};
}
