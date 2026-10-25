// 009-A — data-only, replaceable adventure manifests.
// A manifest describes physical starts, routes, objectives and latent variants;
// never arbitrary JS effect handlers or modifications of Evolved mechanics.
export const ADVENTURE_SCHEMA_VERSION=1;
export const ADVENTURE_COMPILER_VERSION=1;
const clone=x=>JSON.parse(JSON.stringify(x));
const key=x=>typeof x==='string'&&/^[a-z][a-z0-9-]{1,63}$/.test(x);
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
 const allowed=['schemaVersion','id','revision','title','premise','start','rooms','startItems','itemNames','objectives','flags','initialCreatures','variants'];
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
 if(!def.variants||typeof def.variants!=='object'||Array.isArray(def.variants))reject('variants');
 for(const [slot,options] of Object.entries(def.variants)){
  if(!key(slot)||!Array.isArray(options)||options.length<2||options.length>12)reject('variant slot');
  if(new Set(options.map(o=>o.id)).size!==options.length)reject('duplicate variant');
  for(const option of options){
   if(!option||!key(option.id)||!text(option.description)||
      !rooms[option.clueRoom]||!key(option.fact))reject('variant choice');
  }
 }
 // A fully serializable manifest may not contain executable callbacks, NaN or
 // undefined; recursive JSON roundtrip also prevents prototype-bearing values.
 const normalized=clone(def);
 if(sortedJSON(def)!==sortedJSON(normalized))reject('nonserializable data');
 return normalized;
}
function next(x){x^=(x<<13)>>>0;x^=x>>>17;x^=(x<<5)>>>0;return x>>>0;}
export function compileAdventure(def,{seed=1993}={}){
 const clean=validateAdventureDefinition(def);
 if(!safeSeed(seed))reject('seed must be an unsigned 32-bit integer');
 const fingerprint=adventureFingerprint(clean);
 let state=(seed>>>0)||0x9e3779b9;
 const hiddenFacts={};
 for(const slot of Object.keys(clean.variants).sort()){
  state=next(state);
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
