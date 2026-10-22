// Party Incident 007-C — independent multi-character deterministic prototype.
// Legacy src/engine.mjs is intentionally not imported or changed.
// Party members are Evolved-valid actors. This bounded game prototype does not
// yet implement combat, autonomous companions, or complete Evolved time scales.
import { SCENARIO } from './scenario.mjs';
import { validateParty, makeParty } from './characters.mjs';
import { resolveSkillCheck } from './evolved-checks.mjs';
import {DINO_SPECIES,STRETCH_MINUTES,ROUND_SECONDS,detectCreature,rollDicePool,applyCreatureAttack,applyMedicalAid,panicOnContact} from './evolved-encounters.mjs';
import {activeCombatSlot,activeTurnId,beginCombat,checkCombatAction,finishCombatAction,finishDinosaurAction,validCombatState} from './combat-turns.mjs';
import {TRAUMA,worldSeconds,woundModifiers,enrichInjuries,clinicallyEligible,
 resolveClinicalAid,resolveRally,resolveSurgery,tickMedicalClock,pendingLethal} from './evolved-injuries.mjs';

export const PARTY_ENGINE_VERSION = 3;
export const PARTY_SAVE_KIND = 'dinosaur-party-incident';
const own = (o,k) => Object.prototype.hasOwnProperty.call(o,k);
const deep = v => JSON.parse(JSON.stringify(v));
const normalizeSeed = seed => {
  const n=Number(seed);
  if (!Number.isSafeInteger(n)||n<0||n>4294967295)throw new RangeError('Seed must be 0–4294967295.');
  return n>>>0;
};
function nextSeed(s){
 let x=s.rng>>>0;
 x^=(x<<13)>>>0;x^=x>>>17;x^=(x<<5)>>>0;
 s.rng=x>>>0;
 return s.rng;
}
function dist(a,b) {
 if(a===b)return 0;
 const seen=new Set([a]),q=[[a,0]];
 while(q.length){const [p,d]=q.shift();for(const n of SCENARIO.rooms[p].exits){
  if(n===b)return d+1;
  if(!seen.has(n)){seen.add(n);q.push([n,d+1]);}
 }}
 return Infinity;
}
function stepToward(from,target){
 if(!SCENARIO.rooms[from]||!SCENARIO.rooms[target]||from===target)return from;
 return SCENARIO.rooms[from].exits.reduce((best,exit)=>
  dist(exit,target)<dist(best,target)?exit:best,SCENARIO.rooms[from].exits[0]);
}
function itemLabel(id) { return SCENARIO.itemNames[id]||id; }
function gameEvent(s,message,actorId=null,category='action'){
 s.events.push({beat:s.beat,actorId,category,message});
 s.events=s.events.slice(-160);
}
function medicalTick(s,from,{safeRestFor=null,nurseFor=null}={}){
 const to=worldSeconds(s);
 if(to<from)throw new Error('Simulation time must not move backward.');
 if(to===from)return;
 for(let i=0;i<s.actors.length;i++){
  const person=s.actors[i];
  if(person.dead)continue;
  const seed=nextSeed(s);
  const change=tickMedicalClock(person,{from,to,seed,
   safeRest:person.id===safeRestFor,nurse:person.id===nurseFor});
  s.actors[i]=change.after;
  for(const event of change.events){
   const detail=event.kind==='injury_healed'?'recovers from injury':
     event.kind==='death_save_pass'?'survives a medical death check':
     'fails a medical death check';
   gameEvent(s,person.name+' '+detail+' ('+event.code+').',person.id,
    event.kind==='death_save_fail'?'danger':'milestone');
  }
 }
 if(s.actors.every(a=>a.dead))s.outcome='lost';
}
function equippedMedicalGear(a){
 return [...(a.gear||[]),...(a.inventory||[])].some(x=>
  ['medical bag','medkit','first aid pouch','sterile gloves','sedative kit'].includes(x));
}
function safeTreatmentZone(s,actor){
 return ['control','shed'].includes(actor.location)&&
  (s.dinosaurs[0].defeated||dist(s.dinosaurs[0].location,actor.location)>1);
}
function nextTurn(s){
 s.cursor=(s.cursor+1)%s.actors.length;
 s.beat++;
 if(s.cursor===0)s.round++;
}
function dinoTick(s,noise,at) {
 const d=s.dinosaurs[0],species=DINO_SPECIES.velociraptor;
 if(d.defeated||s.combat?.active)return;
 if(noise>0&&dist(d.location,at)<=noise){
  d.lastHeard=at;d.alert=Math.min(4,d.alert+noise);
 }
 // Secret patrol during exploration stretches; no creature combat attacks
 // occur here. Once contact is established, drawn initiative governs attacks.
 if((s.beat+1)%2===0){
  if(d.alert>0&&d.lastHeard&&d.location!==d.lastHeard){
   d.location=stepToward(d.location,d.lastHeard);d.alert--;
  }else if(d.alert>0)d.alert--;
  else if(nextSeed(s)%3===0){
   const exits=SCENARIO.rooms[d.location].exits;
   d.location=exits[nextSeed(s)%exits.length];
  }
 }
 let exposed=false;
 for(const person of s.actors){
  if(person.dead||person.broken||person.health<=0||person.location!==d.location)continue;
  person.seenThreats??=[];
  if(person.hidden){
   if(d.alert>0&&s.beat%Math.max(2,s.actors.length)===0){
    const search=rollDicePool(species.observation,nextSeed(s));
    if(search.successes>=2){
     person.hidden=false;
     gameEvent(s,'The velociraptor uncovers '+person.name+'.',person.id,'danger');
    }
   }
   if(person.hidden)continue;
  }
  if(!person.seenThreats.includes(d.id)){
   const observation=detectCreature(person,{seed:nextSeed(s),observationDice:species.observation,
    guarding:Boolean(person.guarding),
    cluttered:(SCENARIO.rooms[person.location].affordances||[]).length>0});
   person.seenThreats.push(d.id);
   gameEvent(s,person.name+(observation.margin>0?' spots a hunting velociraptor first.':
    ' discovers a velociraptor at close range.'),person.id,'danger');
   const panic=panicOnContact(person,{seed:nextSeed(s),
    canFlee:SCENARIO.rooms[person.location].exits.length>0,
    cluttered:(SCENARIO.rooms[person.location].affordances||[]).length>0});
   person.stress=panic.after.stress;
   person.panicResponses=panic.after.panicResponses;
   person.panicState=panic.after.panicState;
   person.pendingSkip=panic.after.pendingSkip;
   if(panic.event.dropItem&&panic.event.dropped){
    person.inventory=panic.after.inventory;
    s.rooms[person.location].items.push(panic.event.dropped);
    gameEvent(s,person.name+' drops '+itemLabel(panic.event.dropped)+' in panic.',person.id,'danger');
   }
   if(panic.event.flee){
    const exits=SCENARIO.rooms[person.location].exits.filter(dest=>
     !(person.location==='utility'&&dest==='shed'&&!person.inventory.includes('keycard')));
    if(exits.length){
     person.location=exits[nextSeed(s)%exits.length];
     if(!person.visitedRooms.includes(person.location))person.visitedRooms.push(person.location);
     gameEvent(s,person.name+' flees to '+SCENARIO.rooms[person.location].name+'.',person.id,'danger');
    }
    continue;
   }
   if(panic.event.demandCover){person.hidden=true;continue;}
  }
  exposed=true;
 }
 if(exposed){
  const seed=nextSeed(s);
  if(beginCombat(s,seed)){
   gameEvent(s,'A velociraptor encounter begins. Initiative is drawn for the exposed survivors.',null,'danger');
   const slot=activeCombatSlot(s);
   if(slot?.kind==='human')s.cursor=s.actors.findIndex(a=>a.id===slot.actorId);
  }
 }
}
/** Only the active dinosaur slot may resolve a creature turn. */
function predatorStep(previous,{actorId,source}){
 const slot=activeCombatSlot(previous),d=previous.dinosaurs[0];
 if(slot?.kind!=='dinosaur'||source!=='ai'||actorId!==d.id)
  return rejected(previous,'The predator does not currently have initiative.');
 const s=deep(previous),beast=s.dinosaurs[0],species=DINO_SPECIES.velociraptor;
 const medicalFrom=worldSeconds(s);
 if(!s.clock)s.clock={explorationActions:s.beat,explorationStretches:Math.floor(s.beat/s.actors.length),combatRounds:0,combatSeconds:0};
 const targets=s.actors.filter(a=>a.location===beast.location&&!a.hidden&&!a.dead&&!a.broken);
 let detail={kind:'predator_wait',target:''};
 if(targets.length){
  // Deterministic target selection; the creature does not perceive characters
  // hidden in another room or behind unsearched cover.
  const victim=targets[nextSeed(s)%targets.length];
  const budget=s.combat.budgets[victim.id];
  const canDodge=Boolean(victim.guarding&&budget&&budget.quickSpent<2&&
   !(budget.fullSpent&&budget.quickSpent>=1));
  if(canDodge){
   const paid=checkDodgeInterrupt(s,victim.id);
   if(paid)gameEvent(s,victim.name+' uses a reserved quick action to dodge.',victim.id,'danger');
  }
  const strike=applyCreatureAttack(victim,{seed:nextSeed(s),
   attackerDice:species.attack,baseDamage:species.baseDamage,dodge:canDodge});
  victim.guarding=false;
  victim.health=strike.after.health;victim.broken=strike.after.broken;
  victim.dead=strike.after.dead;
  if(strike.critical){
   victim.criticalInjuries=(strike.after.criticalInjuries||[]).map(w=>({...w}));
   const updated=enrichInjuries(victim,medicalFrom,nextSeed(s));
   Object.assign(victim,updated);
  }
  if(strike.evade){
   victim.stress=strike.evade.after.stress;
   victim.stressResponses=strike.evade.after.stressResponses;
  }
  gameEvent(s,strike.damage?
   'Velociraptor strikes '+victim.name+' for '+strike.damage+' damage'+
     (strike.broken?' — incapacitated.':'')+(strike.dead?' Fatal.':''):
   victim.name+' survives the velociraptor’s strike without injury.',victim.id,'danger');
  detail={kind:'predator_attack',target:victim.id,damage:strike.damage,evaded:canDodge,
   critical:strike.critical?.code||null};
 }else gameEvent(s,'The velociraptor searches for exposed prey.',null,'danger');
 s.actions.push({beat:s.beat,actorId:beast.id,...detail,combatRound:s.combat.round,card:slot.card});
 s.actions=s.actions.slice(-200);
 s.beat++;
 finishDinosaurAction(s,nextSeed);
 medicalTick(s,medicalFrom);
 return {accepted:true,state:s,result:detail};
}
function checkDodgeInterrupt(s,actorId){
 const b=s.combat?.budgets?.[actorId];
 if(!b||b.quickSpent>=2||(b.fullSpent&&b.quickSpent>=1))return false;
 b.quickSpent++;b.quick=2-b.quickSpent;
 if(b.quickSpent===2)b.full=0;
 return true;
}
function matchRoom(target,room) {
 const raw=String(target||'').toLowerCase().replace(/^(to |the |into |toward |towards )+/,'').trim();
 return SCENARIO.rooms[room].exits.find(id=>id===raw||
  SCENARIO.rooms[id].name.toLowerCase()===raw||
  SCENARIO.rooms[id].aliases.some(name=>name.toLowerCase()===raw))||null;
}
function matchItem(target,items){
 const q=String(target||'').trim().toLowerCase().replace(/^the /,'');
 return items.find(id=>id===q||itemLabel(id).toLowerCase()===q)||null;
}
function matchFeature(target,location) {
 const q=String(target||'').trim().toLowerCase();
 return (SCENARIO.rooms[location].features||[]).find(id=>id===q)||null;
}
function matchObservation(target,location) {
 const q=String(target||'').trim().toLowerCase();
 return SCENARIO.rooms[location].observations?.find(o=>
   o.id===q||o.aliases?.includes(q))||null;
}
function accepted(s,actor,kind,target,extra={},noise=0,additionalStretches=0,{safeRestFor=null,nurseFor=null}={}) {
 if(!s.clock)s.clock={explorationActions:s.beat,explorationStretches:Math.floor(s.beat/s.actors.length),combatRounds:0,combatSeconds:0};
 const medicalFrom=worldSeconds(s);
 const wasCombat=Boolean(s.combat?.active),slot=activeCombatSlot(s);
 s.actions.push({beat:s.beat,actorId:actor.id,kind,target,...extra,
  ...(wasCombat?{combatRound:s.combat.round,card:slot?.card??null}: {})});
 s.actions=s.actions.slice(-200);
 if(wasCombat){
  s.beat++;
  const costKind=kind==='escape_fail'?'move':
   ['incapacitated','panic_freeze'].includes(kind)?'wait':kind;
  finishCombatAction(s,actor.id,costKind,nextSeed);
 }else{
  dinoTick(s,noise,actor.location);
  s.clock.explorationActions++;
  s.clock.explorationStretches=Math.floor(s.clock.explorationActions/s.actors.length);
  if(s.combat?.active)s.beat++;
  else nextTurn(s);
 }
 if(additionalStretches){
  s.clock.explorationActions+=additionalStretches*s.actors.length;
  s.clock.explorationStretches+=additionalStretches;
 }
 medicalTick(s,medicalFrom,{safeRestFor,nurseFor});
 return {accepted:true,state:s,result:extra};
}
function rejected(before,why){
 return {accepted:false,state:before,reason:why};
}
export function newPartyIncident({seed=1993,roster=null}={}) {
 const n=normalizeSeed(seed),party=roster??makeParty({seed:n,size:3});
 const issues=validateParty(party);
 if(issues.length)throw new RangeError(issues.join(' '));
 const actors=deep(party).map(c=>({
  ...c,location:SCENARIO.start,health:c.healthMax,
  inventory:[],hidden:false,observed:[],visitedRooms:[SCENARIO.start],attemptedObservations:[],stress:c.stress??0,
  armorLevel:c.gear?.includes('protective vest')?2:0,broken:false,dead:false,criticalInjuries:[],seenThreats:[],guarding:false,pendingSkip:false,
  stressResponses:c.stressResponses||[],panicResponses:[],
  medicalRest:false,lastAction:null
 }));
 actors[0].inventory.push(...SCENARIO.startItems);
 return {
  kind:PARTY_SAVE_KIND,version:PARTY_ENGINE_VERSION,scenario:SCENARIO.id,
  initialSeed:n,rng:n||0x9e3779b9,beat:0,round:1,cursor:0,outcome:'playing',
  clock:{explorationActions:0,explorationStretches:0,combatRounds:0,combatSeconds:0},
  startingRoster:deep(party),actors,flags:{power:false,distress:false,beacon:false},
  control:{mode:'party',focusedActorId:actors[0].id,cameraMode:'follow',
    cameraActorId:actors[0].id,paused:true,speedMs:1200,epoch:0},
  controlHistory:[],aiDecisions:[],combat:null,
  rooms:Object.fromEntries(Object.entries(SCENARIO.rooms).map(([k,r])=>[k,{items:[...r.items]}])),
  dinosaurs:[{...SCENARIO.initialDinosaur,lastHeard:null,health:DINO_SPECIES.velociraptor.health,defeated:false,lastStrikes:{}}],
  events:[{beat:0,actorId:null,category:'system',message:'Emergency lighting holds. The surviving personnel gather in the control room.'}],
  actions:[]
 };
}
export function isPartySave(s) {
 if(!s||s.kind!==PARTY_SAVE_KIND||s.version!==PARTY_ENGINE_VERSION||
    !Array.isArray(s.actors)||!s.control||!['party','focus','spectator'].includes(s.control.mode)||
    !['follow','actor'].includes(s.control.cameraMode)||
    !s.actors?.some(a=>a.id===s.control.focusedActorId)||
    !s.actors?.some(a=>a.id===s.control.cameraActorId)||
    typeof s.control.paused!=='boolean'||
    !Number.isInteger(s.control.epoch)||s.control.epoch<0||
    ![400,800,1200,2000].includes(s.control.speedMs)||
    !Array.isArray(s.controlHistory)||!Array.isArray(s.aiDecisions)||
    !validCombatState(s)||
    (s.clock!==undefined&&(!s.clock||!['explorationActions','explorationStretches','combatRounds','combatSeconds'].every(k=>
      Number.isSafeInteger(s.clock[k])&&s.clock[k]>=0)))||
    !['playing','rescued','lost'].includes(s.outcome)||
    s.scenario!==SCENARIO.id||!Number.isInteger(s.beat)||s.beat<0||
    !Number.isInteger(s.cursor)||!Array.isArray(s.actors)||s.actors.length<1||
    s.actors.length>8||s.cursor>=s.actors.length||
    !Number.isInteger(s.rng)||!s.rooms||!s.flags||!Array.isArray(s.actions)||
    !Array.isArray(s.events)||!Array.isArray(s.dinosaurs)||
    !Array.isArray(s.startingRoster)||validateParty(s.startingRoster).length!==0||
    !SCENARIO.rooms[s.dinosaurs[0]?.location])return false;
 if(validateParty(s.actors).length)return false;
 return s.actors.every(a=>SCENARIO.rooms[a.location]&&Array.isArray(a.inventory)&&
   Array.isArray(a.observed)&&Array.isArray(a.visitedRooms)&&
   a.visitedRooms.every(r=>Boolean(SCENARIO.rooms[r]))&&
   Array.isArray(a.attemptedObservations)&&
   typeof a.health==='number'&&a.health>=0&&
   Number.isInteger(a.stress)&&a.stress>=0&&a.stress<=30)&&
   Object.keys(SCENARIO.rooms).every(id=>
     Array.isArray(s.rooms[id]?.items));
}
/**
 * Explicit opt-in migration from the accepted checkpoint 007-C save schema.
 * Never touch the older, unrelated checkpoint 006.2 singleton game.
 */
export function upgradePartySave(candidate) {
 if(isPartySave(candidate))return deep(candidate);
 if(!candidate||candidate.kind!==PARTY_SAVE_KIND||candidate.version!==2)
   throw new RangeError('Unrecognized party save version.');
 const s=deep(candidate);
 if(!Array.isArray(s.actors)||!s.actors.length||!Array.isArray(s.actions)||
    !Array.isArray(s.events)||!Array.isArray(s.startingRoster)||
    validateParty(s.startingRoster).length)
   throw new RangeError('Legacy party save is incomplete.');
 s.version=PARTY_ENGINE_VERSION;
 for(const actor of s.actors){
  if(!SCENARIO.rooms[actor.location])throw new RangeError('Unknown actor location.');
  const visits=[SCENARIO.start,...s.actions.filter(a=>a.actorId===actor.id&&a.kind==='move')
     .map(a=>a.target).filter(x=>SCENARIO.rooms[x])];
  actor.visitedRooms=[...new Set([...visits,actor.location])];
  actor.attemptedObservations=[...new Set(s.actions.filter(a=>a.actorId===actor.id&&a.kind==='investigate')
     .map(a=>a.target).filter(x=>typeof x==='string'))];
 }
 const id=s.actors[s.cursor]?.id||s.actors[0].id;
 s.clock={explorationActions:s.beat,explorationStretches:Math.floor(s.beat/s.actors.length),combatRounds:0,combatSeconds:0};
 s.control={mode:'party',focusedActorId:id,cameraMode:'follow',cameraActorId:id,
   paused:true,speedMs:1200,epoch:0};
 s.controlHistory=[];s.aiDecisions=[];
 if(!isPartySave(s))throw new RangeError('Legacy party save did not pass migration checks.');
 return s;
}
export function partyView(s,{actorId=null}={}) {
 if(!isPartySave(s))throw new RangeError('Invalid party incident save.');
 const actor=s.actors.find(x=>x.id===actorId)||s.actors[s.cursor];
 const place=SCENARIO.rooms[actor.location];
 return {
  beat:s.beat,round:s.round,outcome:s.outcome,actorId:actor.id,actorName:actor.name,
  time:{explorationStretches:s.clock?.explorationStretches??Math.floor(s.beat/s.actors.length),
   minutes:STRETCH_MINUTES*(s.clock?.explorationStretches??Math.floor(s.beat/s.actors.length)),
   combatRounds:s.clock?.combatRounds??0,combatSeconds:s.clock?.combatSeconds??0,
   combatRoundSeconds:ROUND_SECONDS},
  controlMode:s.control.mode,focusedActorId:s.control.focusedActorId,
  cameraMode:s.control.cameraMode,paused:s.control.paused,
  activeActorId:activeTurnId(s),
  combat:s.combat?.active?{round:s.combat.round,card:activeCombatSlot(s)?.card,
   owner:activeCombatSlot(s)?.kind,order:s.combat.order.map(t=>({...t})),
   remaining:s.combat.budgets[activeTurnId(s)]||null}:null,
  location:actor.location,roomName:place.name,description:place.description,
  exits:place.exits.map(id=>({id,name:SCENARIO.rooms[id].name})),
  items:s.rooms[actor.location].items.map(id=>({id,name:itemLabel(id)})),
  features:[...place.features],observations:(place.observations||[]).map(o=>({id:o.id})),
  visibleDinosaurs:s.dinosaurs.filter(d=>d.location===actor.location&&!d.defeated)
   .map(d=>d.kind),
  inventory:actor.inventory.map(id=>({id,name:itemLabel(id)})),
  health:actor.health,healthMax:actor.healthMax,stress:actor.stress,
  injuries:actor.criticalInjuries||[],medicalUrgency:pendingLethal(actor).map(w=>({code:w.code,deadline:w.deadline,nextDeathAt:w.nextDeathAt})),
  broken:Boolean(actor.broken),dead:Boolean(actor.dead),panicState:actor.panicState||null,
  hidden:actor.hidden,flags:{...s.flags},
  actors:s.actors.map(a=>({id:a.id,name:a.name,career:a.career,location:a.location,
   roomName:SCENARIO.rooms[a.location].name,stress:a.stress,health:a.health,
   active:a.id===s.actors[s.cursor].id})),
  events:s.events.filter(e=>e.actorId===null||e.actorId===actor.id).slice(-40)
 };
}
export function parsePartyAction(input) {
 if(typeof input==='object'&&input!==null)
   return {kind:String(input.kind||'').toLowerCase(),target:String(input.target||''),
     recipientId:input.recipientId||null,push:input.push===1||input.push===true?1:0};
 let line=String(input||'').toLowerCase().trim().replace(/[.!?]+$/,'');
 line=line.replace(/^(?:i(?:\s+want\s+to|\s+try\s+to)?\s+|my\s+character\s+|we\s+)/,'');
 const push=/^push(?:\s|:)/.test(line)?1:0;
 if(push)line=line.replace(/^push(?:\s|:)+/,'');
 if(['look','status','inventory'].includes(line))return {kind:'look',target:'',push:0};
 if(['wait','hold','stay'].includes(line))return {kind:'wait',target:'',push:0};
 if(['end','end turn','pass turn','done'].includes(line))return {kind:'end',target:'',push:0};
 if(['guard','watch','keep guard','stand watch'].includes(line))return {kind:'guard',target:'',push:0};
 if(['rest','rest safely','recover','take a rest'].includes(line))return {kind:'rest',target:'',push:0};
 const rally=line.match(/^(?:rally|encourage|revive)\s+(pc-[1-8])$/);
 if(rally)return {kind:'rally',target:rally[1],push:0};
 const surg=line.match(/^(?:surgery|operate on)\s+(pc-[1-8])$/);
 if(surg)return {kind:'surgery',target:surg[1],push:0};
 if(/^(?:attack|strike|fight|hit)(?:\s+.*)?$/.test(line))return {kind:'attack',target:'dinosaur',push};
 const aid=line.match(/^(?:aid|treat|first aid|stabilize)\s+(pc-[1-8])$/);
 if(aid)return {kind:'aid',target:aid[1],push:0};
 if(/^(?:hide|conceal|crouch|take cover)(?:\s+.*)?$/.test(line))return {kind:'hide',target:'',push};
 const regex=[
  [/^(?:go|move|walk|head|run|sneak|creep)\s+(?:to\s+)?(.+)$/,'move'],
  [/^(?:take|pick up|grab)\s+(.+)$/,'take'],
  [/^(?:use|activate|repair|restart|fix|turn on)\s+(.+)$/,'use'],
  [/^(?:investigate|study|inspect|examine|search|observe)\s+(.+)$/,'investigate']
 ];
 for(const [re,kind] of regex){const m=line.match(re);if(m)
  return {kind,target:m[1].replace(/^(the |a )/,'').trim(),push};}
 const give=line.match(/^(?:give|hand)\s+(.+?)\s+to\s+(pc-[1-8])$/);
 if(give)return {kind:'give',target:give[1],recipientId:give[2],push:0};
 return {kind:'',target:line,push:0};
}
export function partyStep(previous,raw,{actorId=null,source='human'}={}) {
 if(!isPartySave(previous))throw new RangeError('Invalid party incident.');
 const action=parsePartyAction(raw),slot=activeCombatSlot(previous);
 const activeId=activeTurnId(previous);
 if(slot?.kind==='dinosaur')return predatorStep(previous,{actorId,source});
 const actor=previous.actors.find(a=>a.id===activeId);
 if(!actor)throw new RangeError('Scheduled survivor missing.');
 if(actorId!==null&&actor.id!==actorId)
  return rejected(previous,'It is '+actor.name+"'s turn.");
 const human=previous.control.mode==='party'||
   (previous.control.mode==='focus'&&previous.control.focusedActorId===actor.id);
 if(!['human','ai'].includes(source)||source!==(human?'human':'ai'))
  return rejected(previous,'This character is currently controlled by '+(human?'the player.':'the computer.'));
 if(previous.outcome!=='playing')return rejected(previous,'This incident has concluded.');
 if(action.kind==='look')return rejected(previous,'Inspect the current scene without spending time.');
 if(!['wait','end','move','take','give','hide','use','investigate','guard','aid','attack','rally','surgery','rest'].includes(action.kind))
  return rejected(previous,'Describe a supported action or use the scene controls.');
 if(slot){
  const budget=checkCombatAction(previous,actor.id,action.kind);
  if(!budget.accepted)return rejected(previous,budget.reason);
 }else if(action.kind==='end')return rejected(previous,'End Turn is only available in combat.');
 if(slot&&['rest','surgery'].includes(action.kind))
  return rejected(previous,'A long medical procedure cannot be performed during an active combat round.');
 const s=deep(previous),a=s.actors[s.cursor];
 if(a.dead){
  gameEvent(s,a.name+' cannot act.',a.id,'danger');
  return accepted(s,a,'incapacitated','',{},0);
 }
 if(a.pendingSkip){
  a.pendingSkip=false;
  gameEvent(s,a.name+' loses a turn to panic.',a.id,'danger');
  return accepted(s,a,'panic_freeze','',{},0);
 }
 if(a.broken&&action.kind!=='move'&&action.kind!=='wait'&&action.kind!=='rest'){
  gameEvent(s,a.name+' is too injured to act.',a.id,'danger');
  return accepted(s,a,'incapacitated','',{},0);
 }
 const result=(skill,context='')=>{
   const seed=nextSeed(s);
   const injury=woundModifiers(a,skill,{
    twoHands:['comtech','medical_aid','ranged_combat','piloting'].includes(skill),
    twoArms:['close_combat','heavy_machinery'].includes(skill)});
   const rolled=resolveSkillCheck(a,{skill,context,seed,push:action.push,
    modifier:injury.modifier});
   const next=rolled.after;
   // Changes to the actor's psychological sheet are authoritative and persistent.
   a.stress=next.stress;a.stressResponses=next.stressResponses;
   a.storyPoints=next.storyPoints;
   if(injury.bleeds){a.health=Math.max(0,a.health-1);if(a.health===0)a.broken=true;}
   return {seed,success:rolled.success,successes:rolled.successes,
     base:rolled.initial.base,stressDice:rolled.initial.stress,
     pushes:rolled.pushes,responseEvents:rolled.responseEvents,notes:rolled.notes,
     pushRefused:rolled.pushRefused};
 };
 if(action.kind==='end'){
  gameEvent(s,a.name+' ends their combat turn.',a.id);
  return accepted(s,a,'end','',{},0);
 }
 if(action.kind==='wait'){
   gameEvent(s,a.name+' waits and listens.',a.id);
   return accepted(s,a,'wait','',{},0);
 }
 if(action.kind==='guard'){
  a.guarding=true;
  gameEvent(s,a.name+' keeps watch for movement.',a.id);
  return accepted(s,a,'guard','',{},0);
 }
 if(action.kind==='aid'){
  const patient=s.actors.find(x=>x.id===action.target);
  if(!patient||patient.location!==a.location||!clinicallyEligible(patient))
   return rejected(previous,'First aid needs a living broken or unstabilized patient in this room.');
  const self=patient.id===a.id;
  if(self&&a.broken)return rejected(previous,'A broken survivor cannot give themselves first aid.');
  const help=resolveClinicalAid(a,patient,{seed:nextSeed(s),self,
   medicalGear:equippedMedicalGear(a)});
  if(!help.accepted)return rejected(previous,help.reason);
  a.stress=help.medicAfter.stress;
  a.stressResponses=help.medicAfter.stressResponses;
  Object.assign(patient,help.patient);
  gameEvent(s,a.name+(help.success?' stabilizes ':' fails to stabilize ')+patient.name+
   (help.events.includes('lethal_interval_worsened')?' — lethal interval worsens.':'')+
   (help.events.includes('death_from_failed_treatment')?' The patient dies.':''),a.id,
   help.success?'milestone':'danger');
  return accepted(s,a,'aid',patient.id,{success:help.success,events:help.events,
   base:help.roll.initial.base,stressDice:help.roll.initial.stress},0);
 }
 if(action.kind==='rally'){
  const patient=s.actors.find(x=>x.id===action.target);
  if(!patient||patient.id===a.id||patient.location!==a.location||!patient.broken||patient.dead)
   return rejected(previous,'Rally requires a living broken companion in the same room.');
  const rally=resolveRally(a,patient,{seed:nextSeed(s)});
  if(!rally.accepted)return rejected(previous,rally.reason);
  a.stress=rally.commanderAfter.stress;
  a.stressResponses=rally.commanderAfter.stressResponses;
  Object.assign(patient,rally.patient);
  gameEvent(s,a.name+(rally.success?' rallies ':' fails to rally ')+patient.name+
   '. Any untreated lethal wound remains dangerous.',a.id,rally.success?'milestone':'risk');
  return accepted(s,a,'rally',patient.id,{success:rally.success,
   base:rally.roll.initial.base},0);
 }
 if(action.kind==='surgery'){
  const patient=s.actors.find(x=>x.id===action.target);
  if(!patient||patient.location!==a.location||patient.id===a.id||patient.dead)
   return rejected(previous,'Surgery requires a living companion present in the same room.');
  if(!safeTreatmentZone(s,a))return rejected(previous,'Surgery requires a secure medical location, away from the raptor.');
  const operation=resolveSurgery(a,patient,{seed:nextSeed(s),
   medicalGear:equippedMedicalGear(a)});
  if(!operation.accepted)return rejected(previous,operation.reason);
  Object.assign(patient,operation.patient);
  a.stress=operation.medicAfter.stress;
  a.stressResponses=operation.medicAfter.stressResponses;
  gameEvent(s,a.name+(operation.success?' completes ':' cannot complete ')+
    'surgery for '+patient.name+'.',a.id,operation.success?'milestone':'danger');
  return accepted(s,a,'surgery',patient.id,{success:operation.success},0,36);
 }
 if(action.kind==='rest'){
  if(!safeTreatmentZone(s,a))return rejected(previous,'Rest requires a safe staffed room without nearby dinosaur activity.');
  gameEvent(s,a.name+' takes an uninterrupted recovery stretch.',a.id,'milestone');
  return accepted(s,a,'rest','',{safe:true},0,1,{safeRestFor:a.id,
   nurseFor:s.actors.find(p=>p.id!==a.id&&p.location===a.location&&
    p.talent==='Recovery Care')?a.id:null});
 }
 if(action.kind==='attack'){
  const d=s.dinosaurs[0];
  if(d.defeated||d.location!==a.location)return rejected(previous,'No dinosaur is within attacking range.');
  const gear=[...(a.gear||[]),...a.inventory];
  const ranged=gear.includes('service carbine')||gear.includes('tranquilizer launcher');
  const skill=ranged?'ranged_combat':'close_combat';
  const check=result(skill);
  const damage=check.success?Math.max(0,(ranged?2:1)+check.successes-1-DINO_SPECIES.velociraptor.armor):0;
  d.health=Math.max(0,(d.health??DINO_SPECIES.velociraptor.health)-damage);
  if(d.health===0)d.defeated=true;
  a.hidden=false;
  gameEvent(s,a.name+' attacks the velociraptor'+(damage?' for '+damage+' damage.':' but cannot injure it.')+
    (d.defeated?' It collapses.':''),a.id,'danger');
  return accepted(s,a,'attack',d.id,{...check,damage,defeated:d.defeated},ranged?3:2);
 }
 if(action.kind==='move'){
   const limitations=woundModifiers(a,'mobility');
   if(limitations.immobile)return rejected(previous,'This injury prevents movement until treated.');
   const room=matchRoom(action.target,a.location);
   if(!room)return rejected(previous,'That destination is not connected to this room.');
   if(a.location==='utility'&&room==='shed'&&!a.inventory.includes('keycard'))
     return rejected(previous,a.name+' needs the staff access card to enter the shed.');
   if(s.dinosaurs[0].location===a.location&&!a.hidden&&!s.dinosaurs[0].defeated&&!a.broken){
    const escape=result('mobility');
    if(!escape.success){
     gameEvent(s,a.name+' fails to break away from the velociraptor.',a.id,'risk');
     return accepted(s,a,'escape_fail',room,escape,2);
    }
   }
   a.location=room;a.hidden=false;
   if(!a.visitedRooms.includes(room))a.visitedRooms.push(room);
   gameEvent(s,a.name+' enters '+SCENARIO.rooms[room].name+'.',a.id);
   return accepted(s,a,'move',room,{},1);
 }
 if(action.kind==='take'){
   const item=matchItem(action.target,s.rooms[a.location].items);
   if(!item)return rejected(previous,'That object is not available here.');
   s.rooms[a.location].items.splice(s.rooms[a.location].items.indexOf(item),1);
   a.inventory.push(item);a.hidden=false;
   gameEvent(s,a.name+' picks up '+itemLabel(item)+'.',a.id);
   return accepted(s,a,'take',item,{},1);
 }
 if(action.kind==='give'){
   const target=s.actors.find(x=>x.id===action.recipientId);
   if(!target||target.id===a.id||target.location!==a.location)
     return rejected(previous,'Recipient must be a different survivor in the same room.');
   const item=matchItem(action.target,a.inventory);
   if(!item)return rejected(previous,'This survivor does not possess that item.');
   a.inventory.splice(a.inventory.indexOf(item),1);target.inventory.push(item);
   gameEvent(s,a.name+' gives '+itemLabel(item)+' to '+target.name+'.',a.id);
   return accepted(s,a,'give',item,{recipientId:target.id},0);
 }
 if(action.kind==='hide'){
   if(!(SCENARIO.rooms[a.location].affordances||[]).length)
    return rejected(previous,'This open zone has no usable concealment.');
   const rolled=result('mobility');
   a.hidden=rolled.success;
   gameEvent(s,a.name+(rolled.success?' finds concealment.':' fails to conceal themselves.'),a.id,rolled.success?'action':'risk');
   return accepted(s,a,'hide','',rolled,0);
 }
 if(action.kind==='investigate'){
   const observation=matchObservation(action.target,a.location);
   if(!observation)return rejected(previous,'Nothing matching that detail is present here.');
   const rolled=result('observation','active_search');
   const known=a.location+':'+observation.id;
   if(!a.attemptedObservations.includes(known))a.attemptedObservations.push(known);
   if(rolled.success){
     if(!a.observed.includes(a.location+':'+observation.id))a.observed.push(a.location+':'+observation.id);
     gameEvent(s,a.name+' examines '+observation.id+': '+(observation.investigation||observation.description),a.id);
   }else gameEvent(s,a.name+' finds no reliable new detail about '+observation.id+'.',a.id);
   return accepted(s,a,'investigate',observation.id,rolled,0);
 }
 if(action.kind==='use'){
   const feature=matchFeature(action.target,a.location);
   if(!feature)return rejected(previous,'That mechanism is not here.');
   if(!['generator','radio','beacon'].includes(feature))
     return rejected(previous,'This feature cannot yet be operated through the party simulation.');
   if(feature==='generator'&&s.flags.power)return rejected(previous,'Auxiliary power is already active.');
   if(feature==='radio'&&!s.flags.power)return rejected(previous,'The radio requires auxiliary power.');
   if(feature==='radio'&&s.flags.distress)return rejected(previous,'The distress call has already been transmitted.');
   if(feature==='beacon'&&(!s.flags.power||!s.flags.distress))
     return rejected(previous,'The beacon needs restored power and a transmitted distress call.');
   if(feature==='beacon'&&s.flags.beacon)return rejected(previous,'The beacon is already broadcasting.');
   const skill=feature==='generator'?'heavy_machinery':'comtech';
   const rolled=result(skill);
   a.hidden=false;
   if(rolled.success){
    if(feature==='generator')s.flags.power=true;
    if(feature==='radio')s.flags.distress=true;
    if(feature==='beacon'){s.flags.beacon=true;s.outcome='rescued';}
    gameEvent(s,a.name+' successfully operates the '+feature+'.',a.id,'milestone');
   }else gameEvent(s,a.name+' cannot get the '+feature+' working yet.',a.id,'risk');
   return accepted(s,a,'use',feature,rolled,feature==='generator'?3:1);
 }
 return rejected(previous,'Unrecognized action.');
}
