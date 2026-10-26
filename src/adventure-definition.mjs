import {validateScenarioMaterialDefinition} from './adventure-scenario-material.mjs';
// 009-A — data-only, replaceable adventure manifests.
// A manifest describes physical starts, routes, objectives and latent variants;
// never arbitrary JS effect handlers or modifications of Evolved mechanics.
export const ADVENTURE_SCHEMA_VERSION=1;
export const ADVENTURE_COMPILER_VERSION=1;
const clone=x=>JSON.parse(JSON.stringify(x));
const key=x=>typeof x==='string'&&/^[a-z][A-Za-z0-9_-]{1,63}$/.test(x);
const text=x=>typeof x==='string'&&x.trim().length>0&&x.length<=700;
const safeSeed=x=>Number.isSafeInteger(x)&&x>=0&&x<=0xffffffff;
function reject(why){throw new RangeError('Invalid adventure: '+why);}
function sortedJSON(x){
 if(Array.isArray(x))return '['+x.map(sortedJSON).join(',')+']';
 if(x&&typeof x==='object')return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+sortedJSON(x[k])).join(',')+'}';
 return JSON.stringify(x);
}
// FNV-1a is a reproducibility fingerprint, NOT an adversarial security signature.
export function adventureFingerprint(def){
 const raw=sortedJSON(def);let h=2166136261;
 for(let i=0;i<raw.length;i++){h^=raw.charCodeAt(i);h=Math.imul(h,16777619);}
 return (h>>>0).toString(16).padStart(8,'0');
}
export function validateAdventureDefinition(def){
 if(!def||typeof def!=='object'||Array.isArray(def))reject('expected object');
 const allowed=['schemaVersion','id','revision','title','premise','start','rooms','startItems','itemNames','objectives','flags','initialCreatures','variants','cinematic','perils','scenarioMaterial'];
 if(Object.keys(def).some(k=>!allowed.includes(k)))reject('unknown top-level field');
 if(def.schemaVersion!==ADVENTURE_SCHEMA_VERSION||!key(def.id)||
    !Number.isSafeInteger(def.revision)||def.revision<1||
    !text(def.title)||!text(def.premise)||!key(def.start))reject('identity and version');
 const rooms=def.rooms;if(!rooms||typeof rooms!=='object'||Array.isArray(rooms)||
  Object.keys(rooms).length<2||Object.keys(rooms).length>48||!rooms[def.start])reject('rooms/start');
 for(const [id,room] of Object.entries(rooms)){
  if(!key(id)||!room||!text(room.name)||!text(room.description)||
     !Array.isArray(room.exits)||!room.exits.length||
     new Set(room.exits).size!==room.exits.length||
     room.exits.some(dest=>!rooms[dest]||dest===id)||
     !Array.isArray(room.items)||room.items.some(x=>!key(x))||
     (room.aliases!==undefined&&(!Array.isArray(room.aliases)||room.aliases.some(a=>!text(a)))))reject('room '+id);
 }
 // A two-way connected physical graph is a safe minimum for this first
 // package format; authored one-way passages require a later typed mechanic.
 for(const [id,room] of Object.entries(rooms))
  for(const exit of room.exits)if(!rooms[exit].exits.includes(id))reject('one-way exit '+id+' to '+exit);
 const reached=new Set([def.start]),queue=[def.start];
 while(queue.length){for(const id of rooms[queue.shift()].exits)if(!reached.has(id)){reached.add(id);queue.push(id);}}
 if(reached.size!==Object.keys(rooms).length)reject('unreachable room');
 if(!Array.isArray(def.startItems)||def.startItems.some(x=>!key(x))||
    !def.itemNames||typeof def.itemNames!=='object'||Array.isArray(def.itemNames))reject('item dictionary');
 for(const [id,name]of Object.entries(def.itemNames))if(!key(id)||!text(name))reject('item name '+id);
 if([...def.startItems,...Object.values(rooms).flatMap(room=>room.items)].some(x=>!def.itemNames[x]))
  reject('unregistered item');
 if(!def.flags||typeof def.flags!=='object'||Array.isArray(def.flags)||
    Object.values(def.flags).some(x=>typeof x!=='boolean'))reject('flags');
 if(!Array.isArray(def.objectives)||!def.objectives.length||def.objectives.length>24)reject('objectives');
 const ids=new Set();
 for(const o of def.objectives){
  if(!o||!key(o.id)||ids.has(o.id)||!text(o.description)||!rooms[o.room]||
      !Array.isArray(o.requires)||!Array.isArray(o.effects))reject('objective');
  // Optional data-only interaction declares the physical target and exact
  // Evolved skill eligibility. A null skill is a routine, no-roll interaction.
  if(o.interaction!==undefined){
   const i=o.interaction;
   const known=['heavy_machinery','stamina','close_combat','mobility','ranged_combat',
    'piloting','observation','comtech','survival','command','manipulation','medical_aid'];
   if(!i||typeof i!=='object'||Array.isArray(i)||
      Object.keys(i).some(k=>!['target','skill'].includes(k))||
      !text(i.target)||i.target.length>80||
      !(i.skill===null||known.includes(i.skill))||
      def.objectives.filter(other=>other.interaction?.target?.toLowerCase()===i.target.toLowerCase()).length>1)
     reject('invalid objective interaction');
  }
  ids.add(o.id);
 }
 if(!def.objectives.some(o=>o.effects.some(e=>e.type==='end')))reject('no ending');
 for(const o of def.objectives){
  if(o.requires.some(id=>!ids.has(id)||id===o.id)||new Set(o.requires).size!==o.requires.length)reject('objective prerequisites');
  for(const e of o.effects){
   if(!e||!['flag','end'].includes(e.type))reject('effect type');
   if(e.type==='flag'&&(!Object.hasOwn(def.flags,e.name)||typeof e.value!=='boolean'))reject('undeclared flag effect');
   if(e.type==='end'&&!['completed','abandoned'].includes(e.outcome))reject('ending');
  }
 }
 const byId=Object.fromEntries(def.objectives.map(o=>[o.id,o]));
 function hasCycle(id,stack=new Set(),done=new Set()){
  if(stack.has(id))return true;if(done.has(id))return false;
  stack.add(id);for(const prev of byId[id].requires)if(hasCycle(prev,stack,done))return true;
  stack.delete(id);done.add(id);return false;
 }
 for(const id of ids)if(hasCycle(id))reject('cyclic objectives');
 if(!Array.isArray(def.initialCreatures)||def.initialCreatures.length>12)reject('initial creatures');
 if(def.initialCreatures.some(c=>!c||!key(c.id)||!key(c.species)||!rooms[c.location]||
      !['neutral','wary','defensive','predatory'].includes(c.disposition)))reject('creature');
 if(new Set(def.initialCreatures.map(c=>c.id)).size!==def.initialCreatures.length)reject('duplicate creature');
 for(const creature of def.initialCreatures){
  if(Object.keys(creature).some(k=>!['id','species','location','disposition','when','patrol','threat'].includes(k)))
   reject('unknown creature property');
  if(creature.threat!==undefined){
   const t=creature.threat;
   if(!t||typeof t!=='object'||Array.isArray(t)||
    Object.keys(t).some(k=>k!=='protocol')||
    !['evolved_contact','evolved_reaction'].includes(t.protocol)||creature.disposition!=='predatory'||
    creature.species!=='velociraptor')
    reject('unrecognized source-bounded physical predator protocol');
  }
  if(creature.patrol!==undefined){
   const p=creature.patrol;
   if(!p||Object.keys(p).some(k=>!['path','cadence'].includes(k))||
      !Array.isArray(p.path)||p.path.length<2||p.path.length>12||
      p.path[0]!==creature.location||new Set(p.path).size!==p.path.length||
      p.path.some(r=>!rooms[r])||
      p.path.some((r,i)=>!rooms[r].exits.includes(p.path[(i+1)%p.path.length]))||
      ![1,2,3].includes(p.cadence))reject('invalid physical creature patrol');
  }
 }
 if(!def.variants||typeof def.variants!=='object'||Array.isArray(def.variants))reject('variants');
 for(const [slot,options] of Object.entries(def.variants)){
  if(!key(slot)||!Array.isArray(options)||options.length<2||options.length>12)reject('variant slot');
  if(new Set(options.map(o=>o.id)).size!==options.length)reject('duplicate variant');
  for(const option of options){
   if(!option||!key(option.id)||!text(option.description)||
      !rooms[option.clueRoom]||!key(option.fact))reject('variant choice');
   if(option.mechanic!==undefined){
    const m=option.mechanic;
    if(!m||typeof m!=='object'||Array.isArray(m)||
       !['passage_check','objective_check','animal_response'].includes(m.kind)||
       !Number.isInteger(m.modifier)||m.modifier < -5||m.modifier > 5)
      reject('variant mechanic');
    const allowed=m.kind==='passage_check'?['kind','from','to','skill','modifier']:
      m.kind==='objective_check'?['kind','objectiveId','modifier']:
      ['kind','creatureId','to','skill','modifier','response'];
    if(Object.keys(m).some(k=>!allowed.includes(k)))reject('variant mechanic fields');
    if(m.kind==='passage_check'&&
       (!rooms[m.from]||!rooms[m.to]||!rooms[m.from].exits.includes(m.to)||
        !['mobility','survival'].includes(m.skill)))reject('passage circumstance');
    if(m.kind==='objective_check'&&
       !def.objectives.some(o=>o.id===m.objectiveId&&o.interaction?.skill))
      reject('objective circumstance');
    if(m.kind==='animal_response'){
     const creature=def.initialCreatures.find(c=>c.id===m.creatureId);
     if(!creature||!rooms[creature.location].exits.includes(m.to)||
        m.response!=='flee_on_failed_approach'||m.skill!=='survival')
      reject('animal response');
    }
   }
  }
 }
 // A conditional creature must exist only in its actual seeded authored variant.
 for(const creature of def.initialCreatures){
  if(creature.when!==undefined){
   const w=creature.when;
   if(!w||typeof w!=='object'||Array.isArray(w)||
      Object.keys(w).some(k=>!['slot','choice'].includes(k))||
      !def.variants[w.slot]?.some(option=>option.id===w.choice))
    reject('conditional creature presence');
  }
 }
 // Optional Cinematic event packages describe *opportunities*, not compulsory
 // plot beats. Acts advance only from already-authored objective completion.
 if(def.cinematic!==undefined){
  const ci=def.cinematic;
  if(!ci||typeof ci!=='object'||Array.isArray(ci)||
     Object.keys(ci).some(k=>!['acts','events'].includes(k))||
     !Array.isArray(ci.acts)||ci.acts.length<1||ci.acts.length>5||
     !Array.isArray(ci.events)||ci.events.length>32)reject('cinematic structure');
  for(let i=0;i<ci.acts.length;i++){
   const act=ci.acts[i];
   if(!act||act.number!==i+1||!text(act.title)||!text(act.objective)||
      !Array.isArray(act.unlocksAfter)||
      act.unlocksAfter.some(id=>!ids.has(id))||
      new Set(act.unlocksAfter).size!==act.unlocksAfter.length||
      (i===0&&act.unlocksAfter.length)||
      (i>0&&!act.unlocksAfter.length)||
      (i>0&&ci.acts[i-1].unlocksAfter.some(id=>!act.unlocksAfter.includes(id))))
     reject('cinematic act progression');
  }
  const eventIds=new Set();
  for(const event of ci.events){
   if(!event||!key(event.id)||eventIds.has(event.id)||
      (!Number.isInteger(event.act)||event.act<1||event.act>ci.acts.length)||!rooms[event.room]||
      !text(event.title)||!text(event.text)||!['wonder','dread','human','discovery'].includes(event.theme)||
      Object.keys(event).some(k=>!['id','act','room','title','text','theme',
       'creatureId','requiresCompanion','variant'].includes(k)))reject('cinematic event');
   eventIds.add(event.id);
   if(event.creatureId!==undefined&&!def.initialCreatures.some(c=>c.id===event.creatureId))
      reject('cinematic creature');
   if(event.requiresCompanion!==undefined&&typeof event.requiresCompanion!=='boolean')
      reject('cinematic companion');
   if(event.variant!==undefined){
    const v=event.variant;
    if(!v||Object.keys(v).some(k=>!['slot','choice'].includes(k))||
       !def.variants[v.slot]?.some(choice=>choice.id===v.choice))
      reject('cinematic variant');
   }
  }
 }
 // Optional source-bounded peril contracts. A creature must be physically
 // present in a declared room; no synthetic predator or automatic strike.
 if(def.perils!==undefined){
  if(!Array.isArray(def.perils)||def.perils.length>16)reject('perils');
  const seen=new Set();
  for(const p of def.perils){
   if(!p||!key(p.id)||seen.has(p.id)||!text(p.title)||
     !text(p.description)||!rooms[p.room]||
     !['mobility','survival','stamina'].includes(p.skill)||
     !Number.isInteger(p.modifier)||p.modifier < -5||p.modifier>5||
     !Number.isInteger(p.attackerDice)||p.attackerDice<1||p.attackerDice>12||
     !Number.isInteger(p.baseDamage)||p.baseDamage<1||p.baseDamage>4||
     Object.keys(p).some(k=>!['id','title','description','room','creatureId',
       'skill','modifier','attackerDice','baseDamage','variant'].includes(k)))
    reject('peril');
   seen.add(p.id);
   if(!def.initialCreatures.some(c=>c.id===p.creatureId&&c.location===p.room))
    reject('peril creature location');
   if(p.variant!==undefined){
    const v=p.variant;
    if(!v||Object.keys(v).some(k=>!['slot','choice'].includes(k))||
      !def.variants[v.slot]?.some(choice=>choice.id===v.choice))
     reject('peril variant');
   }
  }
 }
 validateScenarioMaterialDefinition(def);
 // A fully serializable manifest may not contain executable callbacks, NaN or
 // undefined; recursive JSON roundtrip also prevents prototype-bearing values.
 const normalized=clone(def);
 if(sortedJSON(def)!==sortedJSON(normalized))reject('nonserializable data');
 return normalized;
}
function next(x){x^=(x<<13)>>>0;x^=x>>>17;x^=(x<<5)>>>0;return x>>>0;}
// Avalanche the seed before bounded selection: small consecutive seeds must
// not lock the first variant slot to one choice (low-entropy modulo bias).
function mix(x){x=(x^(x>>>16))>>>0;x=Math.imul(x,0x7feb352d)>>>0;
 x=(x^(x>>>15))>>>0;x=Math.imul(x,0x846ca68b)>>>0;return (x^(x>>>16))>>>0;}
export function compileAdventure(def,{seed=1993}={}){
 const clean=validateAdventureDefinition(def);
 if(!safeSeed(seed))reject('seed must be an unsigned 32-bit integer');
 const fingerprint=adventureFingerprint(clean);
 let state=(seed>>>0)||0x9e3779b9;
 const hiddenFacts={};
 for(const slot of Object.keys(clean.variants).sort()){
  state=mix(next(state));
  const chosen=clean.variants[slot][state%clean.variants[slot].length];
  hiddenFacts[slot]=clone(chosen);
 }
 return {schemaVersion:ADVENTURE_SCHEMA_VERSION,compilerVersion:ADVENTURE_COMPILER_VERSION,
  adventureId:clean.id,revision:clean.revision,seed,
  fingerprint,definition:clean,hiddenFacts};
}
export function validateCompiledAdventure(compiled){
 if(!compiled||compiled.schemaVersion!==ADVENTURE_SCHEMA_VERSION||
  compiled.compilerVersion!==ADVENTURE_COMPILER_VERSION)return false;
 try{
  const rebuilt=compileAdventure(compiled.definition,{seed:compiled.seed});
  return sortedJSON(rebuilt)===sortedJSON(compiled);
 }catch{return false;}
}
export function adventureBinding(compiled){
 if(!validateCompiledAdventure(compiled))reject('compiled instance');
 return {id:compiled.adventureId,revision:compiled.revision,
  schemaVersion:compiled.schemaVersion,fingerprint:compiled.fingerprint};
}
export function validAdventureBinding(value,compiled){
 if(value===undefined)return true; // legacy save compatibility
 try{return sortedJSON(value)===sortedJSON(adventureBinding(compiled));}catch{return false;}
}
