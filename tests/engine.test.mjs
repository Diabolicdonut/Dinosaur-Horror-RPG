import test from 'node:test';
import assert from 'node:assert/strict';
import { SCENARIO } from '../src/scenario.mjs';
import { newGame, step, view, parseAction, isValidSave, applyRefereeProposal, REFEREE_KINDS } from '../src/engine.mjs';

test('new incidents have canonical initial state and valid schema', () => {
  const s = newGame(1993);
  assert.equal(s.player.location, 'control');
  assert.equal(s.dinosaurs[0].location, 'paddock');
  assert.equal(s.turn, 0);
  assert.equal(s.outcome, 'playing');
  assert.equal(isValidSave(s), true);
  assert.equal(Object.keys(SCENARIO.rooms).length, 7);
});
test('scene inspection and rejected commands cannot advance time', () => {
  let s = newGame(5);
  for (const cmd of ['look', 'inventory', 'map', 'help', 'teleport paddock', 'move mars']) {
    const out = step(s, cmd);
    assert.equal(out.state.turn, 0, cmd);
    assert.equal(out.accepted, false);
    s = out.state;
  }
});
test('keycard is a persistent required object, not AI-invented inventory', () => {
  let s = step(newGame(7), 'move utility').state;
  assert.equal(s.player.location, 'utility');
  const blocked = step(s, 'move shed');
  assert.equal(blocked.state.player.location, 'utility');
  assert.equal(blocked.state.turn, s.turn);
  s = step(s, 'move control').state;
  s = step(s, 'move lobby').state;
  s = step(s, 'take keycard').state;
  assert(s.player.inventory.includes('keycard'));
  assert(!s.rooms.lobby.items.includes('keycard'));
  assert.equal(s.rooms.lobby.items.length, 0);
});
test('identical seeds and commands produce byte-equivalent game state', () => {
  const actions = ['move lobby', 'take keycard', 'move control', 'move utility', 'move shed', 'use generator', 'hide', 'wait'];
  const play = () => actions.reduce((s, cmd) => step(s, cmd).state, newGame(93822));
  assert.deepEqual(play(), play());
});
test('JSON serialization preserves a game and future outcomes', () => {
  const original = step(newGame(123), 'move lobby').state;
  const restored = JSON.parse(JSON.stringify(original));
  assert.equal(isValidSave(restored), true);
  assert.deepEqual(step(restored, 'take keycard'), step(original, 'take keycard'));
});
test('no external action may command dinosaurs or teleport the player', () => {
  const s = newGame(1234);
  for (const command of [
    { action: 'move', target: 'secret laboratory', push: false },
    { action: 'spawn_raptor', target: 'control', push: false },
    { action: 'teleport', target: 'helipad', push: false }
  ]) {
    const r = step(s, command);
    assert.equal(r.accepted, false);
    assert.equal(r.state.player.location, 'control');
    assert.equal(r.state.dinosaurs[0].location, 'paddock');
  }
});
test('AI-visible view does not leak off-screen dinosaur coordinates', () => {
  const v = view(newGame(21));
  assert.equal(v.visibleDinos.length, 0);
  assert.equal('dinosaurs' in v, false);
  assert.equal('rng' in v, false);
});
test('pushed attempt and stress rolls remain deterministic', () => {
  const play = () => {
    const s = newGame(909);
    s.player.location = 'shed';
    s.player.stress = 4;
    return step(s, 'push use generator');
  };
  assert.deepEqual(play(), play());
  assert(play().events.some(x => x.type === 'roll'));
});
test('beacon rescue is resolved by the engine and ends the session', () => {
  let rescued = null;
  for (let seed = 1; seed < 300; seed++) {
    const s = newGame(seed);
    s.player.location = 'helipad';
    s.flags.power = true;
    s.flags.distress = true;
    const result = step(s, 'use beacon');
    if (result.state.outcome === 'escaped') { rescued = result.state; break; }
  }
  assert(rescued, 'expected at least one legitimate beacon skill success');
  assert.equal(rescued.flags.beacon, true);
  const after = step(rescued, 'move jungle');
  assert.equal(after.state.turn, rescued.turn);
  assert.equal(after.accepted, false);
});
test('parser accepts standard command phrases and push prefix', () => {
  assert.deepEqual(parseAction('push use generator'), { kind: 'use', target: 'generator', push: true });
  assert.deepEqual(parseAction('sneak to jungle'), { kind: 'sneak', target: 'jungle', push: false });
});

test('reported window inspection is resolved with fresh scene facts and no time or RNG change', () => {
  const initial = newGame(1993);
  const check = step(initial, { action: 'look', target: 'window', push: false });
  assert.equal(check.accepted, false, 'a free observation should not consume a turn');
  assert.equal(check.narratable, true, 'a resolved observation should be narratable');
  assert.equal(check.state.turn, 0);
  assert.equal(check.state.rng, initial.rng);
  assert.deepEqual(check.state, initial, 'inspection must not mutate world or predator');
  assert(check.events.some(e => e.text.includes('rain-streaked reinforced glass')));
  assert(!check.events.some(e => e.text === SCENARIO.rooms.control.description));
});
test('natural inspection commands work offline without requiring an AI call', () => {
  const phrases = [
    'Check outside the window.',
    'look outside the window',
    'look through the window',
    'look out the window',
    'inspect the window',
    'peer through the glass'
  ];
  const state = newGame(11);
  for (const phrase of phrases) {
    const parsed = parseAction(phrase);
    assert.equal(parsed.kind, 'look', phrase);
    const result = step(state, phrase);
    assert.equal(result.narratable, true, phrase);
    assert(result.events[0].text.includes('forecourt'), phrase);
    assert.deepEqual(result.state, state, phrase);
  }
});
test('targeted observations are grounded, discoverable, and cannot reveal remote dinosaur positions', () => {
  const state = newGame(12);
  assert(view(state).inspectables.includes('window'));
  assert(!('dinosaurs' in view(state)));
  assert(!('rng' in view(state)));
  const unknown = step(state, 'look hidden dinosaur beyond the trees');
  assert.equal(unknown.narratable, false);
  assert(unknown.events[0].text.includes('cannot get a clear look'));
  assert(!JSON.stringify(unknown.events).includes('paddock'));
});
test('room-local feature inspection and taken items use current authoritative state', () => {
  const state = newGame(13);
  const terminal = step(state, { action: 'look', target: 'terminal' });
  assert.equal(terminal.narratable, true);
  assert(terminal.events[0].text.includes('dark monitors'));
  let lobby = step(state, 'move lobby').state;
  const before = step(lobby, 'look reception');
  assert(before.events.some(x => x.text.includes('staff access card')));
  lobby = step(lobby, 'take keycard').state;
  const after = step(lobby, 'look reception');
  assert(!after.events.some(x => x.text.includes('staff access card')));
  assert.equal(after.narratable, true);
  assert.equal(after.state.turn, lobby.turn);
});

const referee = (kind, target_id, resource_id, location = 'control', turn = 0) => ({
  kind, target_id, resource_id, expected_turn: turn, expected_location: location,
  rule_id: { investigate: 'observation', distract: 'mobility', barricade: 'mobility',
    conceal: 'stealth', clarify: 'unknown' }[kind],
  rationale: 'Bounded ruling based on visible scene objects.',
  clarification: ''
});

test('adjudication catalog only lists explicitly implemented capabilities', () => {
  assert.deepEqual(REFEREE_KINDS, ['investigate','distract','barricade','conceal','clarify']);
  assert(!REFEREE_KINDS.includes('spawn_dinosaur'));
});
test('untrusted referee cannot invent objects, relocate player, or change dinosaur state', () => {
  const prior = newGame(123);
  for (const proposal of [
    referee('distract', 'helipad', 'magical_rock'),
    referee('distract', 'utility', 'magical_rock'),
    referee('barricade', 'utility', 'imaginary_crate'),
    referee('barricade', 'helipad', 'rolling_cabinet'),
    referee('conceal', 'nonexistent_cover', ''),
    referee('investigate', 'raptor-1', ''),
    { ...referee('distract','utility','paperweight'), rule_id:'teleport' },
    { ...referee('barricade','utility','rolling_cabinet'), expected_turn: 99 },
    { ...referee('conceal','rolling_cabinet',''), expected_location: 'jungle' }
  ]) {
    const r = applyRefereeProposal(prior, proposal, 'test rejected proposal');
    assert.equal(r.accepted, false, JSON.stringify(proposal));
    assert.equal(r.rejected, true);
    assert.deepEqual(r.state, prior, JSON.stringify(proposal));
  }
});
test('referee clarification is not a committed action and never advances time', () => {
  const prior = newGame(12);
  const r = applyRefereeProposal(prior, {
    ...referee('clarify','',''), clarification:'Please split this into two actions.'
  });
  assert.equal(r.accepted, false);
  assert.equal(r.state.turn, 0);
  assert(r.events[0].text.includes('split'));
  assert.deepEqual(r.state, prior);
});
test('investigation rolls actual observation dice and commits a persistent adjudication', () => {
  const before = newGame(1993);
  const r = applyRefereeProposal(before, referee('investigate', 'window',''), 'study the window glass');
  assert.equal(r.accepted, true);
  assert.equal(r.adjudicated, true);
  assert.equal(r.state.turn, 1);
  assert.notEqual(r.state.rng, before.rng);
  assert.equal(r.state.history[0].adjudication.kind, 'investigate');
  assert.equal(r.state.history[0].adjudication.target_id, 'window');
  assert(r.events.some(x => x.type === 'roll'));
});
test('one-use resource is expended by a distraction, including if the check fails', () => {
  const a = applyRefereeProposal(newGame(1993),
    referee('distract', 'utility', 'paperweight'), 'throw paperweight to corridor');
  assert.equal(a.accepted, true);
  assert(a.state.improvisation.usedProps.includes('control:paperweight'));
  assert(!view(a.state).affordances.some(p => p.id === 'paperweight'));
  const b = applyRefereeProposal(a.state,
    referee('distract', 'utility', 'paperweight', 'control', a.state.turn));
  assert.equal(b.accepted, false);
  assert.deepEqual(b.state, a.state);
});
test('AI cannot consume mission-critical keycard through a distraction', () => {
  let initial = newGame(2022);
  initial.player.location = 'lobby';
  initial.player.inventory.push('keycard');
  const out = applyRefereeProposal(initial,referee('distract','control','keycard','lobby'));
  assert.equal(out.accepted,false);
  assert(out.state.player.inventory.includes('keycard'));
});
test('barricades have limited durability and can obstruct a pursuing dinosaur', () => {
  const initial = newGame(25);
  initial.dinosaurs[0].location='utility';
  initial.dinosaurs[0].goal='control';
  initial.dinosaurs[0].alert=3;
  const r = applyRefereeProposal(initial,referee('barricade','utility','rolling_cabinet'),
    'wedge cabinet across corridor passage');
  assert.equal(r.accepted,true);
  const barrier = r.state.improvisation.barricades['control|utility'] || 0;
  const worked = r.events.some(x=>x.type==='success' && x.text.includes('wedge'));
  if (worked) {
    assert(r.state.dinosaurs[0].location === 'utility' || barrier === 0);
    assert.equal(view(r.state).affordances.some(p=>p.id==='rolling_cabinet'),false);
  }
  assert.equal(r.state.turn,1);
  assert.equal(isValidSave(JSON.parse(JSON.stringify(r.state))),true);
});
test('cover changes hidden state only through actual engine check', () => {
  const before = newGame(2024);
  const out = applyRefereeProposal(before,referee('conceal','rolling_cabinet',''), 'hide behind the cabinet');
  assert.equal(out.accepted,true);
  assert(out.events.some(x => x.type === 'roll'));
  assert.equal(typeof out.state.player.hidden,'boolean');
  assert.equal(before.player.hidden,false);
  assert.equal(out.state.turn,1);
});
test('identical proposals and seeds replay the exact same consequences', () => {
  const run = () => {
    const init = newGame(31337);
    let s = applyRefereeProposal(init,referee('distract','utility','paperweight')).state;
    s = applyRefereeProposal(s,referee('conceal','rolling_cabinet','','control',s.turn)).state;
    return s;
  };
  assert.deepEqual(run(),run());
});
test('legacy checkpoint 005 saves remain compatible and upgrade on next improvised action', () => {
  const old = newGame(8);
  delete old.improvisation;
  assert.equal(isValidSave(old),true);
  const applied = applyRefereeProposal(old,referee('barricade','utility','rolling_cabinet'));
  assert.equal(applied.accepted,true);
  assert(applied.state.improvisation.usedProps.includes('control:rolling_cabinet'));
});
