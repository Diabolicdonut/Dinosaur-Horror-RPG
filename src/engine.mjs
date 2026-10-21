import { SCENARIO } from './scenario.mjs';

// Prototype adaptation, NOT a complete Alien RPG rules implementation.
// All state changes and randomness occur here. No AI output can mutate state.
export const ENGINE_VERSION = 1;
export const RULESET = Object.freeze({
  baseSuccess: 6, stressSuccess: 6, stressPanic: 1,
  healthMax: 4, stressMax: 10,
  notes: 'Attributes + skill d6 pool; 6 succeeds; stress dice also succeed on 6 but 1 triggers a panic check. Optional pushed failure rerolls non-success dice and adds stress.'
});

const ATTRIBUTES = { strength: 3, agility: 4, wits: 4, empathy: 2 };
const SKILLS = { mobility: 2, comtech: 2, observation: 1, survival: 1 };
const MAX_HISTORY = 250;

function event(events, type, text) { events.push({ type, text }); }
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function clean(text) { return String(text || '').toLowerCase().trim().replace(/^(to |the |at |into |toward |towards )+/g, '').replace(/[.!?]+$/g, '').trim(); }

/** Stable 32-bit xorshift. Explicitly stored; zero is remapped to a nonzero seed. */
function d6(s) {
  let x = s.rng >>> 0;
  x ^= (x << 13) >>> 0;
  x ^= x >>> 17;
  x ^= (x << 5) >>> 0;
  s.rng = x >>> 0;
  return (s.rng % 6) + 1;
}

function distance(from, to) {
  if (from === to) return 0;
  const seen = new Set([from]);
  let frontier = [from];
  for (let dist = 1; frontier.length; dist++) {
    const next = [];
    for (const room of frontier) for (const adjacent of SCENARIO.rooms[room].exits) {
      if (adjacent === to) return dist;
      if (!seen.has(adjacent)) { seen.add(adjacent); next.push(adjacent); }
    }
    frontier = next;
  }
  return Infinity;
}
function nextToward(from, to) {
  if (from === to || !SCENARIO.rooms[to]) return from;
  const exits = SCENARIO.rooms[from].exits;
  return exits.reduce((best, room) => distance(room, to) < distance(best, to) ? room : best, exits[0]);
}
function roomMatch(text, exits) {
  const query = clean(text);
  if (!query) return null;
  return exits.find(id => id === query ||
    SCENARIO.rooms[id].aliases.some(alias => alias === query || alias.includes(query) && query.length >= 3) ||
    SCENARIO.rooms[id].name.toLowerCase() === query) || null;
}
function itemMatch(text, items) {
  const query = clean(text);
  if (!query) return null;
  return items.find(id => id === query ||
    SCENARIO.itemNames[id].toLowerCase().includes(query) && query.length >= 3) || null;
}
function featureMatch(text, features) {
  const query = clean(text);
  if (!query) return null;
  return features.find(id => id === query || id.includes(query) && query.length >= 3) || null;
}

/** Targeted inspections reveal only authored, player-perceivable room details. */
function inspectionMatch(text, observations = []) {
  const query = clean(text).replace(/^(?:look\s+|peer\s+)?(?:out(?:side)?|through|from|beyond|past|over)\s+(?:of\s+)?(?:the\s+)?/, '')
    .replace(/^(?:the|a|an)\s+/, '').trim();
  if (!query) return null;
  return observations.find(o => [o.id, ...(o.aliases || [])].some(alias => clean(alias) === query)) || null;
}

export function newGame(seed = 1993) {
  const n = Number(seed);
  const saneSeed = Number.isSafeInteger(n) && n >= 0 && n <= 4294967295 ? n >>> 0 : 1993;
  return {
    version: ENGINE_VERSION, scenario: SCENARIO.id, initialSeed: saneSeed,
    rng: saneSeed || 0x9e3779b9, turn: 0, outcome: 'playing',
    player: {
      name: 'InGen Field Technician', location: SCENARIO.start,
      attributes: { ...ATTRIBUTES }, skills: { ...SKILLS },
      health: 4, stress: 0, inventory: [...SCENARIO.startItems],
      hidden: false, flashlightOn: false
    },
    rooms: Object.fromEntries(Object.entries(SCENARIO.rooms).map(([id, room]) => [id, { items: [...room.items] }])),
    flags: { power: false, distress: false, beacon: false },
    improvisation: { usedProps: [], barricades: {}, placedProps: {} },
    dinosaurs: [{ ...SCENARIO.initialDinosaur }],
    history: []
  };
}

export function parseAction(input) {
  if (typeof input === 'object' && input !== null) {
    return { kind: String(input.action || input.kind || '').toLowerCase(), target: String(input.target || ''), push: Boolean(input.push) };
  }
  let phrase = String(input || '').trim().toLowerCase();
  const push = /^push\s+/.test(phrase);
  if (push) phrase = phrase.replace(/^push\s+/, '');
  const simple = { l: 'look', look: 'look', inspect: 'look', status: 'status',
    i: 'inventory', inventory: 'inventory', bag: 'inventory', map: 'map',
    help: 'help', '?': 'help', hide: 'hide', wait: 'wait', listen: 'look' };
  if (simple[phrase]) return { kind: simple[phrase], target: '', push };
  const inspect = phrase.match(/^(?:look|inspect|examine|observe|peer|check)\s+(.+)$/);
  if (inspect) return { kind: 'look', target: inspect[1], push: false };
  const match = phrase.match(/^(go|move|walk|head|run|sprint|sneak|creep|take|grab|pick up|use|activate|repair|switch on|turn on|heal)\s+(.+)$/);
  if (!match) return { kind: '', target: '', push };
  const aliases = { go:'move', move:'move', walk:'move', head:'move', run:'run',
    sprint:'run', sneak:'sneak', creep:'sneak', take:'take', grab:'take',
    'pick up':'take', use:'use', activate:'use', repair:'use', 'switch on':'use',
    'turn on':'use', heal:'use', throw:'use' };
  return { kind: aliases[match[1]], target: match[2].replace(/^(to|the|at|into|up|toward)\s+/g, ''), push };
}


/** Source-of-truth props accessible in a room, including a cabinet already placed as cover.
 * A moved barricade is unavailable for another throw/barrier while still usable as cover.
 */
function propVisibility(s, roomId) {
  const all = SCENARIO.rooms[roomId].affordances || [];
  const used = s.improvisation?.usedProps || [];
  const free = all.filter(p => !used.includes(roomId + ':' + p.id));
  const installed = Object.entries(s.improvisation?.placedProps || {})
    .filter(([edge]) => (s.improvisation?.barricades?.[edge] || 0) > 0
      && edge.split('|').includes(roomId))
    .map(([edge, id]) => {
      const p = all.find(item => item.id === id);
      return p && { ...p, label: p.label + ' (barricading passage)', uses: ['cover'], installedOn: edge };
    }).filter(Boolean);
  return { free, visible: [...free, ...installed] };
}

/** Does not consume world time; returns only player-visible, ground-truth state. */
export function view(s) {
  const room = SCENARIO.rooms[s.player.location];
  const visibleDinos = s.dinosaurs.filter(d => d.location === s.player.location).map(d => d.kind);
  return {
    location: s.player.location, roomName: room.name, description: room.description,
    exits: room.exits.map(id => ({ id, name: SCENARIO.rooms[id].name })),
    items: s.rooms[s.player.location].items.map(id => ({ id, name: SCENARIO.itemNames[id] })),
    features: room.features.slice(), inspectables: (room.observations || []).map(o => o.id),
    affordances: propVisibility(s, s.player.location).visible
      .map(o => ({ id: o.id, label: o.label, uses: [...o.uses] })),
    barricades: room.exits.filter(id => (s.improvisation?.barricades || {})[[s.player.location, id].sort().join('|')] > 0)
      .map(id => ({ exit: id, durability: s.improvisation.barricades[[s.player.location, id].sort().join('|')] })),
    visibleDinos,
    inventory: s.player.inventory.map(id => ({ id, name: SCENARIO.itemNames[id] })),
    health: s.player.health, stress: s.player.stress,
    hidden: s.player.hidden, flashlightOn: s.player.flashlightOn,
    flags: { ...s.flags }, turn: s.turn, outcome: s.outcome
  };
}

/** A failed push is an immediate optional reroll, not a later alteration of state. */
function check(s, attr, skill, push, events, label) {
  const baseCount = clamp(s.player.attributes[attr] + (s.player.skills[skill] || 0), 1, 12);
  const stressCount = s.player.stress;
  const base = Array.from({ length: baseCount }, () => d6(s));
  const stress = Array.from({ length: stressCount }, () => d6(s));
  let successes = [...base, ...stress].filter(v => v === 6).length;
  let panic = stress.includes(1);
  let pushed = false;
  let bonus = null;
  if (push && successes === 0) {
    pushed = true;
    s.player.stress = clamp(s.player.stress + 1, 0, RULESET.stressMax);
    const moreBase = base.filter(x => x !== 6).map(() => d6(s));
    const moreStress = Array.from({ length: s.player.stress }, () => d6(s));
    successes += [...moreBase, ...moreStress].filter(v => v === 6).length;
    panic ||= moreStress.includes(1);
    bonus = { base: moreBase, stress: moreStress };
  }
  event(events, 'roll', `${label}: ${baseCount} base dice [${base.join(', ')}], ${stressCount} stress dice [${stress.join(', ')}]${bonus ? `; pushed [${bonus.base.join(', ')}] + stress [${bonus.stress.join(', ')}]` : ''}. ${successes} success(es).`);
  let panicSeverity = 0;
  if (panic) {
    panicSeverity = d6(s) + s.player.stress;
    event(events, 'danger', `Panic check ${panicSeverity}: ${panicSeverity >= 9 ? 'you freeze as terror overwhelms your action' : panicSeverity >= 6 ? 'you gasp and make involuntary noise' : 'you control the fear for now'}.`);
    if (panicSeverity >= 6) s.player.stress = clamp(s.player.stress + 1, 0, RULESET.stressMax);
  }
  return { ok: successes > 0 && panicSeverity < 9, successes, panicSeverity, pushed, noise: panicSeverity >= 6 ? 2 : 0 };
}

function predatorTurn(s, actionNoise, events, noiseOrigin = s.player.location) {
  const dino = s.dinosaurs[0];
  const proximity = distance(dino.location, noiseOrigin);
  const hearing = actionNoise >= 3 ? 2 : actionNoise >= 2 ? 1 : 0;
  if (proximity <= hearing && actionNoise > 0) {
    dino.goal = noiseOrigin;
    dino.alert = 3;
  }
  if (dino.alert > 0 && dino.goal) {
    const next = nextToward(dino.location, dino.goal);
    const barricadeKey = [dino.location, next].sort().join('|');
    if ((s.improvisation?.barricades?.[barricadeKey] || 0) > 0) {
      s.improvisation.barricades[barricadeKey]--;
      dino.alert = Math.max(dino.alert, 1);
      event(events, 'danger', 'Something powerful slams into a makeshift barrier nearby.');
      if (s.improvisation.barricades[barricadeKey] === 0) {
        delete s.improvisation.placedProps?.[barricadeKey];
        event(events, 'danger', 'Wood and metal tear free as the barricade gives way.');
      }
    } else dino.location = next;
    dino.alert--;
    if (dino.location === dino.goal) { dino.goal = null; dino.alert = 0; }
  } else if (d6(s) === 6) {
    const exits = SCENARIO.rooms[dino.location].exits;
    const next = exits[d6(s) % exits.length];
    const barrierKey = [dino.location, next].sort().join('|');
    if ((s.improvisation?.barricades?.[barrierKey] || 0) > 0) {
      s.improvisation.barricades[barrierKey]--;
      event(events, 'danger', 'An animal crashes against an improvised obstacle somewhere nearby.');
      if (s.improvisation.barricades[barrierKey] === 0) {
        delete s.improvisation.placedProps?.[barrierKey];
        event(events, 'danger', 'The improvised barrier splinters under the impact.');
      }
    } else dino.location = next;
  }
  if (dino.location !== s.player.location) {
    if (distance(dino.location, s.player.location) === 1) event(events, 'danger', 'Heavy claws scrape somewhere nearby. The sound has direction, but you cannot see its source.');
    return;
  }
  // Hiding is not magical invisibility. Even a quiet character may be found.
  if (s.player.hidden && actionNoise <= 1 && d6(s) <= 4) {
    event(events, 'scene', 'A raptor passes close enough to hear breathing, but fails to locate you.');
    return;
  }
  s.player.hidden = false;
  s.player.stress = clamp(s.player.stress + 1, 0, RULESET.stressMax);
  event(events, 'danger', 'A Velociraptor is here! You have an instant to evade its attack.');
  const defense = check(s, 'agility', 'mobility', false, events, 'Evasion');
  if (defense.ok) event(events, 'scene', 'You dodge the snapping jaws. The animal is still dangerously close.');
  else {
    s.player.health = Math.max(0, s.player.health - 2);
    event(events, 'danger', 'The attack connects: 2 health lost.');
    if (s.player.health === 0) {
      s.outcome = 'dead';
      event(events, 'end', 'You collapse in the ruined park. The island claims another victim.');
    }
  }
}

/** Canonical, extensible but tightly validated AI referee capabilities.
 * All world changes occur here. The model may choose among known targets only.
 * Return accepted=false without touching state when invalid or stale.
 */
export const REFEREE_KINDS = Object.freeze(['investigate', 'distract', 'barricade', 'conceal', 'clarify']);
const REFEREE_RULES = Object.freeze({
  investigate: { rule: 'observation', attribute: 'wits', skill: 'observation' },
  distract: { rule: 'mobility', attribute: 'agility', skill: 'mobility' },
  barricade: { rule: 'mobility', attribute: 'strength', skill: 'mobility' },
  conceal: { rule: 'stealth', attribute: 'agility', skill: 'mobility' }
});
function rejectProposal(previous, message) {
  return { state: structuredClone(previous), accepted: false, narratable: false,
    events: [{ type: 'info', text: message }], rejected: true };
}
export function applyRefereeProposal(previous, proposal, playerInput = '') {
  if (!isValidSave(previous)) throw new Error('Invalid or incompatible save state.');
  if (previous.outcome !== 'playing') return rejectProposal(previous, 'This expedition has ended.');
  if (!proposal || typeof proposal !== 'object' || Array.isArray(proposal))
    return rejectProposal(previous, 'The Game Master did not return a valid ruling.');
  const proposalKeys = new Set(['kind', 'target_id', 'resource_id', 'rule_id',
    'expected_turn', 'expected_location', 'rationale', 'clarification']);
  if (Object.keys(proposal).some(key => !proposalKeys.has(key)) || Object.keys(proposal).length !== proposalKeys.size)
    return rejectProposal(previous, 'The referee proposal attempted an unsupported state operation.');
  const { kind, target_id: target, resource_id: resource, rule_id: rule,
    expected_turn: expectedTurn, expected_location: expectedLocation,
    rationale, clarification } = proposal;
  if (!REFEREE_KINDS.includes(kind) || typeof target !== 'string' || typeof resource !== 'string'
    || target.length > 80 || resource.length > 80 || typeof rule !== 'string'
    || typeof rationale !== 'string' || rationale.length > 300
    || typeof clarification !== 'string' || clarification.length > 500)
    return rejectProposal(previous, 'The Game Master ruling was malformed.');
  if (expectedTurn !== previous.turn || expectedLocation !== previous.player.location)
    return rejectProposal(previous, 'The situation changed before the ruling could be applied. Please try again.');
  if (kind === 'clarify') {
    return rejectProposal(previous, clarification || 'That improvised action needs further clarification.');
  }
  if (rule !== REFEREE_RULES[kind].rule)
    return rejectProposal(previous, 'The proposed ruling used an incompatible rule.');
  const roomId = previous.player.location;
  const room = SCENARIO.rooms[roomId];
  const used = previous.improvisation?.usedProps || [];
  const props = propVisibility(previous, roomId);
  const prop = props.free.find(p => p.id === resource);
  const targetProp = props.visible.find(p => p.id === target);
  const knownObservation = (room.observations || []).find(o => o.id === target);
  if (kind === 'investigate' &&
    !(knownObservation || targetProp || room.features.includes(target)
      || previous.rooms[roomId].items.includes(target)) )
    return rejectProposal(previous, 'That detail is not currently observable in this location.');
  if (kind === 'investigate' && resource !== '')
    return rejectProposal(previous, 'An investigation cannot expend an unrelated resource.');
  if (kind === 'distract' &&
    (!room.exits.includes(target) ||
      !(prop?.uses.includes('distract') || (previous.player.inventory.includes(resource) && resource !== 'keycard'))))
    return rejectProposal(previous, 'The proposed distraction needs a real nearby exit and a throwable resource.');
  if (kind === 'barricade' &&
    (!room.exits.includes(target) || !prop?.uses.includes('barricade') ||
      (previous.improvisation?.barricades?.[[roomId, target].sort().join('|')] || 0) > 0))
    return rejectProposal(previous, 'A barricade needs usable local cover and an unobstructed adjacent exit.');
  if (kind === 'conceal' && (!targetProp?.uses.includes('cover') || resource !== ''))
    return rejectProposal(previous, 'That is not an available place to take cover.');

  const s = structuredClone(previous);
  if (!s.improvisation) s.improvisation = { usedProps: [], barricades: {}, placedProps: {} };
  if (!s.improvisation.placedProps) s.improvisation.placedProps = {};
  const events = [];
  const chosen = REFEREE_RULES[kind];
  event(events, 'info', `GM ruling: ${kind} (${chosen.attribute} + ${chosen.skill}; ${rule}).`);
  const result = check(s, chosen.attribute, chosen.skill, false, events, 'Improvised ' + kind);
  let noise = result.noise;
  let noiseOrigin = roomId;
  if (kind === 'investigate') {
    noise = Math.max(noise, 1);
    if (result.ok) {
      const description = knownObservation?.investigation || knownObservation?.description ||
        (targetProp ? `You examine ${targetProp.label} for signs of recent disturbance.` :
          `You study the ${target} carefully, but uncover no additional confirmed details.`);
      event(events, 'success', description);
    } else event(events, 'info', 'The details remain unclear; the search takes precious time.');
  } else if (kind === 'conceal') {
    s.player.hidden = result.ok;
    noise = Math.max(noise, result.ok ? 0 : 2);
    event(events, result.ok ? 'success' : 'danger', result.ok
      ? `You settle behind ${targetProp.label}, using it for cover.`
      : `You cannot find effective concealment behind ${targetProp.label}.`);
  } else if (kind === 'distract') {
    if (prop) s.improvisation.usedProps.push(roomId + ':' + resource);
    else s.player.inventory = s.player.inventory.filter(id => id !== resource);
    noise = Math.max(noise, result.ok ? 3 : 2);
    if (result.ok) noiseOrigin = target;
    event(events, result.ok ? 'success' : 'danger', result.ok
      ? `The thrown ${prop?.label || SCENARIO.itemNames[resource] || resource} clatters toward ${SCENARIO.rooms[target].name}. The sound travels away from your position; you cannot yet tell whether an animal heard it.`
      : `The thrown ${prop?.label || SCENARIO.itemNames[resource] || resource} strikes nearby; the sound gives away your own position.`);
  } else if (kind === 'barricade') {
    noise = Math.max(noise, 2);
    if (result.ok) {
      s.improvisation.usedProps.push(roomId + ':' + resource);
      const key = [roomId, target].sort().join('|');
      s.improvisation.barricades[key] = Math.min(2, Math.max(1, result.successes));
      s.improvisation.placedProps[key] = resource;
      event(events, 'success', `You wedge ${prop.label} across the passage to ${SCENARIO.rooms[target].name}. The obstacle may delay a pursuer, and the cabinet remains available as cover.`);
    } else event(events, 'danger', `You cannot secure ${prop.label} across the passage, but the object remains here and can still be used for cover or another attempt.`);
  }
  s.turn++;
  if (s.outcome === 'playing') predatorTurn(s, noise, events, noiseOrigin);
  if (s.player.stress >= RULESET.stressMax && s.outcome === 'playing') {
    s.outcome = 'dead';
    event(events, 'end', 'Overwhelmed by terror, you can no longer continue the evacuation.');
  }
  s.history.push({
    turn: s.turn,
    command: String(playerInput || 'improvised ' + kind).slice(0, 400),
    adjudication: { kind, target_id: target, resource_id: resource,
      rule_id: rule, expected_turn: expectedTurn, expected_location: expectedLocation,
      rationale: rationale.slice(0, 300) },
    events: structuredClone(events), rng: s.rng,
    position: s.player.location, dinosaurPosition: s.dinosaurs[0].location,
    health: s.player.health, stress: s.player.stress
  });
  if (s.history.length > MAX_HISTORY) s.history.shift();
  return { state: s, events, accepted: true, narratable: true, adjudicated: true };
}

export function step(previous, command) {
  if (!isValidSave(previous)) throw new Error('Invalid or incompatible save state.');
  const s = structuredClone(previous);
  const action = parseAction(command);
  const events = [];
  let advance = false;
  let observationResolved = false;
  let noise = 0;
  if (s.outcome !== 'playing') {
    event(events, 'info', 'This expedition has ended. Start a new incident to play again.');
    return { state: s, events, accepted: false };
  }
  const room = SCENARIO.rooms[s.player.location];
  const target = clean(action.target);
  switch (action.kind) {
    case 'look': {
      if (target) {
        const observation = inspectionMatch(target, room.observations);
        if (observation) {
          observationResolved = true;
          event(events, 'scene', observation.description);
          if (observation.id === 'reception' && s.rooms.lobby.items.includes('keycard'))
            event(events, 'info', 'A staff access card is still lying behind the reception desk.');
          if (s.dinosaurs.some(d => d.location === s.player.location))
            event(events, 'danger', 'A Velociraptor is in this area!');
        } else {
          const item = itemMatch(target, s.rooms[s.player.location].items);
          const feature = featureMatch(target, room.features);
          const looseProp = (room.affordances || []).find(p =>
            !(s.improvisation?.usedProps || []).includes(s.player.location + ':' + p.id) &&
            (p.id === target || clean(p.label) === target));
          if (item || feature || looseProp) {
            observationResolved = true;
            event(events, 'info', item
              ? `You examine ${SCENARIO.itemNames[item]}. It is visible and within reach.`
              : looseProp ? `You inspect ${looseProp.label}. It might provide cover, an obstacle, or a distraction depending on its size and construction.`
              : `You examine the ${feature}. ${room.description}`);
          } else {
            const available = (room.observations || []).map(o => o.id).join(', ');
            event(events, 'info', `You cannot get a clear look at "${target}" from here.${available ? ' Nearby details you can examine: ' + available + '.' : ''}`);
          }
        }
      } else {
        event(events, 'scene', room.description);
        if (s.dinosaurs.some(d => d.location === s.player.location))
          event(events, 'danger', 'A Velociraptor is in the area!');
        if (s.rooms[s.player.location].items.length)
          event(events, 'info', `Visible items: ${s.rooms[s.player.location].items.map(id => SCENARIO.itemNames[id]).join(', ')}.`);
      }
      break;
    }
    case 'inventory':
      event(events, 'info', `Inventory: ${s.player.inventory.map(id => SCENARIO.itemNames[id]).join(', ') || 'empty'}.`);
      break;
    case 'status':
      event(events, 'info', `Health ${s.player.health}/4, stress ${s.player.stress}/10. Power ${s.flags.power ? 'on' : 'off'}; distress call ${s.flags.distress ? 'sent' : 'not sent'}.`);
      break;
    case 'map':
      event(events, 'info', `Exits: ${room.exits.map(id => SCENARIO.rooms[id].name).join('; ')}.`);
      break;
    case 'help':
      event(events, 'info', 'Commands: look, map, inventory, status, move <exit>, sneak <exit>, run <exit>, take <item>, use <feature or item>, hide, wait. Prefix a challenge with "push" to reroll failure at the cost of stress.');
      break;
    case 'move':
    case 'sneak':
    case 'run': {
      const destination = roomMatch(target, room.exits);
      if (!destination) { event(events, 'info', 'That is not an available exit. Try "map".'); break; }
      if (destination === 'shed' && s.player.location === 'utility' && !s.player.inventory.includes('keycard')) {
        event(events, 'info', 'The maintenance door is locked. You need a staff access card.');
        break;
      }
      advance = true;
      noise = action.kind === 'run' ? 3 : action.kind === 'sneak' ? 0 : 2;
      if (action.kind === 'sneak') {
        const r = check(s, 'agility', 'mobility', action.push, events, 'Quiet movement');
        noise = Math.max(noise, r.noise);
        if (!r.ok) { noise = Math.max(2, noise); event(events, 'danger', 'Your quiet approach fails. You remain where you are and disturb the surroundings.'); break; }
      }
      const passageKey = [s.player.location, destination].sort().join('|');
      if ((s.improvisation?.barricades?.[passageKey] || 0) > 0) {
        const material = s.improvisation.placedProps?.[passageKey];
        if (material) {
          const source = s.improvisation.usedProps.find(key =>
            key.endsWith(':' + material) && passageKey.split('|').includes(key.split(':')[0]));
          if (source) s.improvisation.usedProps = s.improvisation.usedProps.filter(key => key !== source);
          delete s.improvisation.placedProps[passageKey];
        }
        s.improvisation.barricades[passageKey] = 0;
        noise = Math.max(noise, 2);
        event(events, 'scene', 'You shift aside the barricade to squeeze through the passage, opening it again.');
      }
      s.player.location = destination;
      s.player.hidden = false;
      event(events, 'scene', `You ${action.kind === 'run' ? 'sprint' : action.kind === 'sneak' ? 'slip quietly' : 'move'} into ${SCENARIO.rooms[destination].name}. ${SCENARIO.rooms[destination].description}`);
      break;
    }
    case 'take': {
      const item = itemMatch(target, s.rooms[s.player.location].items);
      if (!item) { event(events, 'info', 'There is no such loose item here.'); break; }
      s.rooms[s.player.location].items = s.rooms[s.player.location].items.filter(id => id !== item);
      s.player.inventory.push(item);
      event(events, 'scene', `You recover ${SCENARIO.itemNames[item]}.`);
      advance = true; noise = 1; break;
    }
    case 'use': {
      const feature = featureMatch(target, room.features);
      const item = itemMatch(target, s.player.inventory);
      if (feature === 'generator') {
        if (s.flags.power) { event(events, 'info', 'Auxiliary power is already running.'); break; }
        const r = check(s, 'wits', 'comtech', action.push, events, 'Generator restart');
        advance = true; noise = Math.max(3, r.noise);
        if (r.ok) { s.flags.power = true; event(events, 'success', 'The generator catches. Emergency power returns to the facility.'); }
        else event(events, 'danger', 'The generator fails to catch. You can try again, but the noise carries.');
      } else if (feature === 'terminal' || feature === 'radio') {
        if (!s.flags.power) { event(events, 'info', 'The communications console has no power.'); break; }
        if (s.flags.distress) { event(events, 'info', 'An extraction request has already been transmitted.'); break; }
        const r = check(s, 'wits', 'comtech', action.push, events, 'Distress transmission');
        advance = true; noise = Math.max(1, r.noise);
        if (r.ok) { s.flags.distress = true; event(events, 'success', 'Your distress call reaches the rescue helicopter. It needs a beacon to identify the landing zone.'); }
        else event(events, 'danger', 'Static overwhelms the frequency. The call does not get through.');
      } else if (feature === 'beacon') {
        if (!s.flags.distress) { event(events, 'info', 'You have not established radio contact; the extraction beacon lacks the rescue frequency.'); break; }
        if (!s.flags.power) { event(events, 'info', 'The auxiliary power system is offline.'); break; }
        const r = check(s, 'wits', 'comtech', action.push, events, 'Beacon alignment');
        advance = true; noise = Math.max(2, r.noise);
        if (r.ok) {
          s.flags.beacon = true; s.outcome = 'escaped';
          event(events, 'end', 'The beacon flashes to life. Rotor blades sound through the rain. You are extracted from Isla Nublar.');
        } else event(events, 'danger', 'The locator beacon misaligns. You must reconfigure it before the helicopter can land.');
      } else if (item === 'medkit') {
        if (s.player.health >= RULESET.healthMax) { event(events, 'info', 'You have no injury requiring the medical kit.'); break; }
        s.player.health = clamp(s.player.health + 2, 0, RULESET.healthMax);
        s.player.inventory = s.player.inventory.filter(id => id !== 'medkit');
        advance = true; noise = 0;
        event(events, 'success', 'You dress your injuries and recover up to 2 health.');
      } else if (item === 'flashlight') {
        s.player.flashlightOn = !s.player.flashlightOn;
        advance = true; noise = 0;
        event(events, 'scene', `You switch your flashlight ${s.player.flashlightOn ? 'on' : 'off'}.`);
      } else if (item === 'flare') {
        s.player.inventory = s.player.inventory.filter(id => id !== 'flare');
        advance = true; noise = 3;
        event(events, 'scene', 'You ignite and throw a flare. Its brilliant glow reveals the surrounding forest—and announces your presence.');
      } else event(events, 'info', 'There is nothing usable here with that name.');
      break;
    }
    case 'hide': {
      const r = check(s, 'agility', 'mobility', action.push, events, 'Find cover');
      advance = true; noise = r.ok ? 0 : 2;
      noise = Math.max(noise, r.noise);
      s.player.hidden = r.ok;
      event(events, r.ok ? 'success' : 'danger', r.ok ? 'You crouch behind cover, slowing your breathing.' : 'You fail to find adequate cover.');
      break;
    }
    case 'wait':
      advance = true; noise = 0;
      event(events, 'scene', 'You remain still. The island continues moving around you.');
      break;
    default:
      event(events, 'info', 'Action not understood. Use "help" or try a more explicit command.');
  }
  if (advance) {
    s.turn++;
    if (s.outcome === 'playing') predatorTurn(s, noise, events);
    if (s.player.stress >= RULESET.stressMax && s.outcome === 'playing') {
      s.outcome = 'dead';
      event(events, 'end', 'Overwhelmed by terror, you can no longer continue the evacuation.');
    }
    s.history.push({
      turn: s.turn, command: typeof command === 'string' ? command : JSON.stringify(action),
      events: structuredClone(events), rng: s.rng,
      position: s.player.location, dinosaurPosition: s.dinosaurs[0].location,
      health: s.player.health, stress: s.player.stress
    });
    if (s.history.length > MAX_HISTORY) s.history.shift();
  }
  return { state: s, events, accepted: advance, narratable: observationResolved };
}


/** Repair the confirmed v006 bug without resetting turn, dice, inventory or chronology.
 * A failed barricade was marked "consumed"; successful barricades were not tagged
 * as still-visible cover. Reconcile only evidence preserved by the action journal.
 * Do not infer actions from truncated (>249) histories.
 */
export function repairLegacyBarricadeSave(previous) {
  if (!isValidSave(previous)) throw new Error('Invalid or incompatible save state.');
  const state = structuredClone(previous);
  const repaired = [];
  if (!state.improvisation || !Array.isArray(state.history) || state.history.length >= MAX_HISTORY)
    return { state, repaired };
  const i = state.improvisation;
  if (!i.placedProps) i.placedProps = {};
  const approved = state.history.filter(h => h.adjudication && ['barricade', 'distract'].includes(h.adjudication.kind));
  const succeeded = h => h.events?.some(e =>
    e.type === 'success' && h.adjudication.kind === 'barricade' && e.text.startsWith('You wedge'));
  for (const h of approved.filter(h => h.adjudication.kind === 'barricade')) {
    const a = h.adjudication;
    const resourceKey = a.expected_location + ':' + a.resource_id;
    if (!i.usedProps.includes(resourceKey)) continue;
    if (succeeded(h)) {
      const edge = [a.expected_location, a.target_id].sort().join('|');
      if ((i.barricades[edge] || 0) > 0 && !i.placedProps[edge]) {
        i.placedProps[edge] = a.resource_id;
        repaired.push('Restored cover metadata for ' + a.resource_id);
      }
    } else if (h.events?.some(e => e.type === 'danger' && (e.text.includes('will not hold') || e.text.includes('cannot secure')))) {
      const legitimatelyConsumed = approved.some(other => other.adjudication.resource_id === a.resource_id &&
        other.adjudication.expected_location === a.expected_location &&
        (other.adjudication.kind === 'distract' || succeeded(other)));
      if (!legitimatelyConsumed) {
        i.usedProps = i.usedProps.filter(key => key !== resourceKey);
        repaired.push('Restored ' + a.resource_id + ' after failed barricade');
      }
    }
  }
  return { state, repaired };
}

export function isValidSave(s) {
  const i = s?.improvisation;
  const improvOk = i === undefined || (
    i && typeof i === 'object' && !Array.isArray(i) &&
    Array.isArray(i.usedProps) && i.usedProps.length <= 100 &&
    i.usedProps.every(x => typeof x === 'string' && x.length <= 100) &&
    i.barricades && typeof i.barricades === 'object' && !Array.isArray(i.barricades) &&
    (i.placedProps === undefined || (i.placedProps && typeof i.placedProps === 'object' &&
      !Array.isArray(i.placedProps) && Object.entries(i.placedProps).length <= 50 &&
      Object.entries(i.placedProps).every(([k,v]) =>
        k.length <= 100 && typeof v === 'string' && v.length <= 80))) &&
    Object.entries(i.barricades).length <= 50 &&
    Object.entries(i.barricades).every(([k,v]) =>
      k.length <= 100 && Number.isInteger(v) && v >= 0 && v <= 2));
  return !!(improvOk && s && s.version === ENGINE_VERSION && s.scenario === SCENARIO.id &&
    s.player && SCENARIO.rooms[s.player.location] && Array.isArray(s.player.inventory) &&
    Number.isInteger(s.rng) && s.rng >= 0 && s.rng <= 4294967295 &&
    Number.isInteger(s.turn) && s.turn >= 0 && s.turn <= 1000000 &&
    Number.isInteger(s.player.health) && s.player.health >= 0 && s.player.health <= 4 &&
    Number.isInteger(s.player.stress) && s.player.stress >= 0 && s.player.stress <= 10 &&
    s.rooms && s.flags && Array.isArray(s.dinosaurs) &&
    s.dinosaurs.length === 1 && SCENARIO.rooms[s.dinosaurs[0].location] &&
    ['playing', 'escaped', 'dead'].includes(s.outcome));
}
