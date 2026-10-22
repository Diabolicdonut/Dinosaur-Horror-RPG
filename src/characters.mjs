// Dinosaur Horror RPG — original Jurassic Park-themed character data and Evolved-style starting rules.
// Reference: privately provided Alien RPG Evolved Edition, Core Concepts pp. 25–27;
// career specializations pp. 31–39. No copyrighted narrative/table contents included.
export const ATTRIBUTES = Object.freeze(['strength', 'agility', 'wits', 'empathy']);
export const SKILLS = Object.freeze({
  heavy_machinery: 'Heavy Machinery', stamina: 'Stamina', close_combat: 'Close Combat',
  mobility: 'Mobility', ranged_combat: 'Ranged Combat', piloting: 'Piloting',
  observation: 'Observation', comtech: 'Comtech', survival: 'Survival',
  command: 'Command', manipulation: 'Manipulation', medical_aid: 'Medical Aid'
});
const career = (label, keyAttribute, keySkills, talents, gear, agendas) =>
  Object.freeze({ label, keyAttribute, keySkills, talents, gear, agendas });
export const CAREERS = Object.freeze({
  tactical: career('Tactical Response Specialist', 'strength', ['close_combat','stamina','ranged_combat'],
    ['Combat Focus', 'Steady Under Fire', 'Careful Aim'],
    ['service carbine','protective vest','field radio','signal flare','binoculars','flashlight'],
    ['Keep the response team alive','Secure the evacuation route','Recover missing security personnel']),
  ranger: career('Park Ranger / Security Officer', 'wits', ['observation','ranged_combat','command'],
    ['Park Authority', 'Experienced Tracker', 'Safe Restraint'],
    ['tranquilizer launcher','park radio','flashlight','field binoculars','first aid pouch','park gate key'],
    ['Find the missing patrol','Keep the visitors away from danger','Learn what breached the perimeter']),
  corporate: career('InGen Corporate Representative', 'wits', ['comtech','observation','manipulation'],
    ['Corporate Access', 'Negotiator', 'Personal Contingency'],
    ['executive keycard','satellite phone','briefcase','field notebook','company identification','pocket flashlight'],
    ['Protect a confidential research file','Ensure key personnel evacuate','Learn who authorized the shutdown']),
  visitor: career('Young Park Visitor', 'agility', ['mobility','survival','observation'],
    ['Hard to Catch', 'Unlikely Fortune', 'Quick Reflexes'],
    ['park map','small flashlight','souvenir raincoat','visitor wristband','snack pouch','toy binoculars'],
    ['Find a family member','Stay with a trusted survivor','Reach a safe visitor shelter']),
  medic: career('Field Medic / Veterinary Technician', 'empathy', ['mobility','observation','medical_aid'],
    ['Emergency Treatment', 'Recovery Care', 'Trauma Specialist'],
    ['medical bag','bandages','field radio','sterile gloves','portable splint','sedative kit'],
    ['Find the wounded staff','Keep the team alive','Determine whether the animals were injured']),
  supervisor: career('Park Operations Supervisor', 'empathy', ['ranged_combat','command','manipulation'],
    ['Rapid Orders', 'Keep It Together', 'Chain of Command'],
    ['operations keycard','staff radio','maintenance schedule','flashlight','incident clipboard','emergency map'],
    ['Restore communications','Account for every employee','Coordinate the evacuation']),
  pilot: career('Helicopter / Vehicle Pilot', 'agility', ['piloting','ranged_combat','comtech'],
    ['Emergency Maneuver', 'Familiar Controls', 'Risk Taker'],
    ['aviator headset','handheld radio','flare','flight chart','multi-tool','vehicle keys'],
    ['Locate a usable aircraft','Find a safe landing route','Get the stranded group off the island']),
  maintenance: career('Park Maintenance Technician', 'strength', ['heavy_machinery','stamina','close_combat'],
    ['Resilient Worker', 'Steady Hands', 'Last Push'],
    ['tool kit','flashlight','insulated gloves','wire cutters','utility radio','spare fuse'],
    ['Restore auxiliary power','Diagnose the fence outage','Keep the generators operational']),
  scientist: career('Paleontologist / Geneticist', 'wits', ['observation','survival','comtech'],
    ['Field Analysis', 'Persistent Inquiry', 'Species Insight'],
    ['field journal','specimen kit','binoculars','sample vials','research tablet','flashlight'],
    ['Identify the animal tracks','Protect the research notes','Understand the dinosaurs changing behavior'])
});
export const CAREER_IDS = Object.freeze(Object.keys(CAREERS));
export const RULE_VERSION = 'evolved-character-start-001';
const FIRST = ['Avery','Jordan','Morgan','Riley','Casey','Sam','Alex','Taylor','Jamie','Drew','Quinn','Harper','Robin','Cameron'];
const LAST = ['Morales','Reyes','Bennett','Chen','Patel','Walker','Navarro','Santos','Kim','Morgan','Ortiz','Foster','Carter','Lopez'];
const OWN = Object.prototype.hasOwnProperty;
const has = (o,k) => Boolean(o && OWN.call(o,k));
const normalizedSeed = v => Number.isSafeInteger(Number(v)) ? (Number(v) >>> 0) || 0x9e3779b9 : 1993;
function rng(seed) {
  let x = normalizedSeed(seed);
  return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) / 4294967296; };
}
const pick = (random, values) => values[Math.floor(random() * values.length)];
const nval = v => Number.isInteger(Number(v)) && v !== '' && v != null ? Number(v) : NaN;
const clone = v => JSON.parse(JSON.stringify(v));
export const derived = attributes => ({
  resolve: Math.ceil((attributes.wits + attributes.empathy) / 2),
  healthMax: Math.ceil((attributes.strength + attributes.agility) / 2)
});
export function validateCharacter(c) {
  const errors = [];
  if (!c || typeof c !== 'object') return ['Missing character'];
  const role = CAREERS[c.career];
  if (!role) errors.push('Choose a recognized career.');
  if (typeof c.name !== 'string' || !c.name.trim() || c.name.length > 80) errors.push('Enter a valid name (1–80 characters).');
  if (!c.attributes || typeof c.attributes !== 'object') errors.push('Attributes are required.');
  else {
    const vals = ATTRIBUTES.map(a => nval(c.attributes[a]));
    if (vals.some(v => !Number.isInteger(v))) errors.push('Every attribute must be a whole number.');
    else {
      if (vals.reduce((a,b)=>a+b,0) !== 14) errors.push('Attributes must total exactly 14 points.');
      for (const a of ATTRIBUTES) {
        const v = nval(c.attributes[a]);
        const max = role?.keyAttribute === a ? 5 : 4;
        if (v < 2 || v > max) errors.push(a + ' must be between 2 and ' + max + '.');
      }
    }
  }
  if (!c.skills || typeof c.skills !== 'object') errors.push('Skill allocations are required.');
  else {
    const vals = Object.keys(SKILLS).map(k => nval(c.skills[k]));
    if (vals.some(v => !Number.isInteger(v))) errors.push('Every skill must be a whole number.');
    else {
      if (vals.reduce((a,b)=>a+b,0) !== 10) errors.push('Starting skills must total exactly 10 points.');
      for (const k of Object.keys(SKILLS)) {
        const max = role?.keySkills.includes(k) ? 3 : 1;
        if (c.skills[k] < 0 || c.skills[k] > max) errors.push(SKILLS[k] + ' must be between 0 and ' + max + '.');
      }
    }
  }
  if (!role?.talents.includes(c.talent)) errors.push('Select one valid career talent.');
  if (!Array.isArray(c.gear) || c.gear.length !== 2 ||
      new Set(c.gear).size !== 2 || c.gear.some(item => !role?.gear.includes(item)))
    errors.push('Choose two distinct eligible starting items.');
  if (typeof c.agenda !== 'string' || !c.agenda.trim() || c.agenda.length > 200) errors.push('Enter a personal agenda (1–200 characters).');
  if (typeof c.id !== 'string' || !/^pc-[1-9]\d*$/.test(c.id)) errors.push('Character ID must be a stable roster ID.');
  if (c.attributes && ATTRIBUTES.every(a => Number.isInteger(nval(c.attributes[a])))) {
    const expected = derived(c.attributes);
    if (c.resolve !== expected.resolve || c.healthMax !== expected.healthMax)
      errors.push('Health and Resolve must be recalculated from attributes.');
  }
  return errors;
}
function distribute(keys, caps, fixed, total, rand, weight = {}) {
  const out = {};
  let remaining = total;
  for (const k of keys) {
    const min = caps[k][0], max = caps[k][1];
    const forced = has(fixed,k) ? nval(fixed[k]) : null;
    if (forced !== null && (!Number.isInteger(forced) || forced < min || forced > max))
      throw new RangeError('Locked '+k+' outside valid career range.');
    out[k] = forced === null ? min : forced;
    remaining -= out[k];
  }
  const available = keys.filter(k => !has(fixed,k));
  if (remaining < 0 || available.reduce((acc,k) => acc + caps[k][1]-out[k],0) < remaining)
    throw new RangeError('Locked values cannot fit within the point budget.');
  while (remaining > 0) {
    const candidates = available.flatMap(k =>
      Array.from({length: Math.max(0, caps[k][1]-out[k]) ? (weight[k] || 1) : 0},()=>k));
    if (!candidates.length) throw new RangeError('Cannot distribute remaining points.');
    out[pick(rand,candidates)]++;
    remaining--;
  }
  return out;
}
function seededRandom(seed, index, revision) {
  // Separate from gameplay PRNG; stable for the same party seed, slot and revision.
  return rng((normalizedSeed(seed) ^ Math.imul(index + 1, 0x9e3779b1) ^ Math.imul(revision + 1, 0x85ebca6b)) >>> 0);
}
export function generateCharacter({seed = 1993, index = 0, revision = 0, career: choice = null, existing = null, locks = []} = {}) {
  if (!Number.isInteger(index) || index < 0 || index > 99) throw new RangeError('Roster index must be 0–99.');
  const rand = seededRandom(seed, index, revision);
  const held = new Set(locks);
  const roleId = held.has('career') && existing ? existing.career :
    (choice && CAREERS[choice] ? choice : pick(rand, CAREER_IDS));
  const role = CAREERS[roleId];
  if (!role) throw new RangeError('Unknown career');
  const attributeCaps = Object.fromEntries(ATTRIBUTES.map(a=>[a,[2,a===role.keyAttribute?5:4]]));
  const fixedAttributes = Object.fromEntries(ATTRIBUTES.filter(a=>held.has('attributes.'+a) && existing)
    .map(a=>[a,existing.attributes[a]]));
  const attributes = distribute(ATTRIBUTES,attributeCaps,fixedAttributes,14,rand,
    Object.fromEntries(ATTRIBUTES.map(a=>[a,a===role.keyAttribute?3:1])));
  const skillKeys = Object.keys(SKILLS);
  const skillCaps = Object.fromEntries(skillKeys.map(k=>[k,[0,role.keySkills.includes(k)?3:1]]));
  const fixedSkills = Object.fromEntries(skillKeys.filter(k=>held.has('skills.'+k) && existing)
    .map(k=>[k,existing.skills[k]]));
  const skills = distribute(skillKeys,skillCaps,fixedSkills,10,rand,
    Object.fromEntries(skillKeys.map(k=>[k,role.keySkills.includes(k)?6:1])));
  const name = held.has('name') && existing ? existing.name : pick(rand,FIRST)+' '+pick(rand,LAST);
  const talent = held.has('talent') && existing ? existing.talent : pick(rand,role.talents);
  const agenda = held.has('agenda') && existing ? existing.agenda : pick(rand,role.agendas);
  const gear = held.has('gear') && existing ? [...existing.gear] :
    (() => {const pool=[...role.gear];const one=pick(rand,pool);pool.splice(pool.indexOf(one),1);return [one,pick(rand,pool)];})();
  const candidate = {
    id:'pc-'+(index+1),name,career:roleId,attributes,skills,talent,gear,agenda,
    ...derived(attributes),stress:0,injuries:[],creationMethod:existing ? 'hybrid' : 'automatic',
    generation:{seed:normalizedSeed(seed),index,revision,locks:[...held],rules:RULE_VERSION}
  };
  const errors = validateCharacter(candidate);
  if (errors.length) throw new RangeError('Cannot generate rules-valid character: '+errors.join(' '));
  return candidate;
}
export function editCharacter(character, patch) {
  const c = clone(character);
  for (const [key, value] of Object.entries(patch)) {
    if (key === 'attributes' || key === 'skills') c[key] = {...c[key],...value};
    else if (['name','career','talent','gear','agenda'].includes(key)) c[key] = value;
  }
  Object.assign(c,derived(c.attributes));
  c.creationMethod = 'manual';
  return c; // May be invalid while a human is editing; validator governs confirmation.
}
export function makeParty({seed=1993,size=3,careers=[]}={}) {
  if (!Number.isInteger(size) || size<1 || size>8) throw new RangeError('Party size must be between 1 and 8.');
  return Array.from({length:size},(_,i)=>generateCharacter({seed,index:i,career:careers[i]||null}));
}
export function validateParty(roster) {
  if (!Array.isArray(roster) || roster.length<1 || roster.length>8)
    return ['Party size must be between 1 and 8.'];
  const ids = new Set();
  const errors = [];
  roster.forEach((c,i)=>{
    if (ids.has(c?.id)) errors.push('Duplicate character ID in party.'); else ids.add(c?.id);
    for(const message of validateCharacter(c)) errors.push('Character '+(i+1)+': '+message);
  });
  return errors;
}
export function characterToSave(c){const errors=validateCharacter(c);if(errors.length)throw new RangeError(errors.join(' '));return clone(c);}
