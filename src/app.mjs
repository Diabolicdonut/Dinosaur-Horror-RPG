import { SCENARIO } from './scenario.mjs';
import { newGame, step, view, isValidSave, parseAction } from './engine.mjs';

const $ = id => document.getElementById(id);
const SAVE_KEY = 'dinosaur-horror-rpg-isla-nublar-v1';
const WORKER_BASE = 'https://dinosaur-rpg.diabolicdonut.workers.dev';
let state = newGame();
let busy = false;

function addLog(text, type = 'scene', turn = state.turn, source = 'ENGINE') {
  const node = document.createElement('div');
  node.className = 'logentry ' + (['roll', 'danger', 'success', 'info', 'end'].includes(type) ? type : 'scene');
  const header = document.createElement('span');
  header.className = 'turn-label';
  header.textContent = `T+${String(turn).padStart(3, '0')} / ${source}`;
  node.append(header, document.createTextNode(text));
  $('events').append(node);
  $('events').scrollTop = $('events').scrollHeight;
}
function displayEvents(events) {
  for (const e of events) addLog(e.text, e.type);
}
function actionButton(container, label, command, cls = '') {
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = cls; btn.textContent = label;
  btn.addEventListener('click', () => execute(command));
  container.append(btn);
}
const POS = {
  lobby: [66, 64], control: [195, 64], utility: [195, 138],
  shed: [195, 214], jungle: [132, 276],
  paddock: [43, 337], helipad: [265, 337]
};
function svgNode(tag, attributes = {}, content = null) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attributes)) el.setAttribute(key, String(value));
  if (content !== null) el.textContent = content;
  return el;
}
function drawMap() {
  const svg = $('map'); svg.replaceChildren();
  const drawn = new Set();
  for (const [id, room] of Object.entries(SCENARIO.rooms)) {
    for (const dest of room.exits) {
      const key = [id, dest].sort().join('|');
      if (drawn.has(key)) continue;
      drawn.add(key);
      svg.append(svgNode('line', { x1: POS[id][0], y1: POS[id][1], x2: POS[dest][0], y2: POS[dest][1], class: 'map-edge' }));
    }
  }
  for (const [id, room] of Object.entries(SCENARIO.rooms)) {
    const [x, y] = POS[id];
    svg.append(svgNode('circle', { cx: x, cy: y, r: id === state.player.location ? 10 : 7, class: 'map-node ' + (id === state.player.location ? 'current' : '') }));
    if (id === state.player.location) svg.append(svgNode('circle', { cx: x, cy: y, r: 3.5, class: 'map-indicator' }));
    const name = { lobby: 'LOBBY', control: 'CONTROL', utility: 'CORRIDOR', shed: 'SHED', jungle: 'JUNGLE', paddock: 'PADDOCK', helipad: 'HELIPAD' }[id];
    let tx = x + 11, ty = y - 12;
    if (id === 'control' || id === 'helipad') tx = x - (id === 'control' ? 53 : 36);
    if (id === 'paddock') tx = x + 12;
    svg.append(svgNode('text', { x: tx, y: ty, class: 'map-text' }, name));
  }
}
function render() {
  const v = view(state);
  $('health').textContent = `${v.health} / 4`;
  $('stress').textContent = `${v.stress} / 10`;
  $('healthbar').style.width = `${v.health * 25}%`;
  $('stressbar').style.width = `${v.stress * 10}%`;
  $('turn').textContent = 'TURN ' + String(v.turn).padStart(3, '0');
  $('roomname').textContent = v.roomName;
  $('roomdescription').textContent = v.description;
  $('zoneid').textContent = v.location.toUpperCase();
  $('visible').textContent = v.visibleDinos.length ? 'WARNING: VISIBLE PREDATOR — ' + v.visibleDinos.join(', ') : 'No large animals currently in direct view.';
  $('visible').classList.toggle('warning', v.visibleDinos.length > 0);
  const objectives = [
    ['Retrieve a staff access card', v.inventory.some(i => i.id === 'keycard')],
    ['Restore emergency generator', v.flags.power],
    ['Transmit the extraction request', v.flags.distress],
    ['Activate helipad beacon', v.flags.beacon]
  ];
  $('objectives').replaceChildren();
  for (const [label, done] of objectives) {
    const div = document.createElement('div'); div.className = 'objective' + (done ? ' done' : '');
    div.textContent = label; $('objectives').append(div);
  }
  $('inventory').replaceChildren();
  for (const item of v.inventory) {
    const line = document.createElement('span'); line.textContent = item.name;
    $('inventory').append(line);
  }
  if (!v.inventory.length) {
    const line = document.createElement('span'); line.textContent = 'No equipment'; $('inventory').append(line);
  }
  $('exits').replaceChildren(); $('actions').replaceChildren();
  for (const exit of v.exits) actionButton($('exits'), '→ ' + exit.name, 'move ' + exit.id, 'move');
  for (const item of v.items) actionButton($('actions'), 'TAKE ' + item.name, 'take ' + item.id, 'action');
  for (const feature of v.features) actionButton($('actions'), 'USE ' + feature.toUpperCase(), 'use ' + feature, 'action');
  actionButton($('actions'), 'HIDE', 'hide');
  actionButton($('actions'), 'WAIT', 'wait');
  drawMap();
  const done = v.outcome !== 'playing';
  $('outcome').classList.toggle('win', v.outcome === 'escaped');
  $('outcome').textContent = v.outcome === 'escaped' ? 'SURVIVOR / EXTRACTED' : v.outcome === 'dead' ? 'INCIDENT / FATAL' : 'CONTAINMENT BREACH / ACTIVE';
  $('command').disabled = done || busy;
  $('submit').disabled = done || busy;
  for (const button of document.querySelectorAll('.quick-actions button')) button.disabled = done || busy;
}
async function aiRequest(mode, payload) {
  // The token is entered at runtime and never written to game saves, URLs or logs.
  const token = $('game-token').value.trim();
  if (!token) throw new Error('Enter your GAME_TOKEN in the engine controls.');
  const endpoint = mode === 'interpret' ? 'turn' : mode === 'narrate' ? 'narrate' : null;
  if (!endpoint) throw new Error('Unsupported AI operation.');
  const response = await fetch(WORKER_BASE + '/v1/gm/' + endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ payload }),
    signal: AbortSignal.timeout(28000),
    cache: 'no-store'
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('GAME_TOKEN was rejected. Check the secret in Cloudflare and your entry here.');
    if (response.status === 429) throw new Error('AI request rate limit reached. Try again shortly.');
    if (response.status === 503) throw new Error('Cloudflare Worker is not configured or deployed yet.');
    if (response.status === 404) throw new Error('Worker endpoints not deployed yet.');
    throw new Error('AI gateway returned HTTP ' + response.status);
  }
  return response.json();
}
async function execute(command) {
  if (busy || state.outcome !== 'playing') return;
  busy = true; render();
  try {
    let input = command;
    // Fast path: known commands are parsed locally; novel prose uses the AI interpreter.
    if ($('ai').checked && !parseAction(command).kind) {
      try {
        const response = await aiRequest('interpret', {
          input: command, location: view(state).roomName,
          exits: view(state).exits.map(x => x.id),
          features: view(state).features,
          items: view(state).items.map(x => x.id),
          inventory: state.player.inventory
        });
        if (response?.action === 'clarify') {
          addLog(response.clarification || 'That action is not yet covered by the deterministic rules.', 'info', state.turn, 'AI GM');
          return;
        }
        if (response?.action && typeof response.action === 'string') {
          input = { action: response.action, target: response.target || '', push: Boolean(response.push) };
        }
      } catch (error) {
        addLog('AI parsing unavailable; local engine will attempt the command. ' + error.message, 'info', state.turn, 'SYSTEM');
      }
    }
    const result = step(state, input);
    state = result.state;
    displayEvents(result.events);
    if (result.accepted) {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
      catch { /* Storage disabled or quota reached; manual export remains available. */ }
    }
    if ($('ai').checked && result.accepted && $('game-token').value.trim()) {
      try {
        const response = await aiRequest('narrate', {
          location: view(state).roomName,
          objective: SCENARIO.objective,
          events: result.events.map(e => e.text),
          outcome: state.outcome, health: state.player.health,
          stress: state.player.stress
        });
        if (typeof response?.text === 'string' && response.text.trim()) {
          addLog(response.text.slice(0, 1600), 'scene', state.turn, 'AI ATMOSPHERE (NOT RULES)');
        }
      } catch (error) { addLog('Atmospheric narration unavailable: ' + error.message, 'info', state.turn, 'SYSTEM'); }
    }
  } catch (error) {
    addLog('Action rejected: ' + error.message, 'danger', state.turn, 'SYSTEM');
  } finally { busy = false; render(); $('command').focus(); }
}
$('commandform').addEventListener('submit', event => {
  event.preventDefault();
  const input = $('command').value.trim();
  if (!input) return;
  $('command').value = '';
  execute(input);
});
$('newgame').addEventListener('click', () => {
  if (busy) return;
  const seed = Number($('seed').value);
  state = newGame(seed);
  $('events').replaceChildren();
  addLog('1993. The storm has knocked out the park network. Auxiliary power and radio communications are down. Find the access card and restore contact with the outside world.', 'scene');
  addLog(view(state).description, 'scene');
  render();
});
$('save').addEventListener('click', () => {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); addLog('Deterministic save stored in this browser.', 'success'); }
  catch (e) { addLog('Browser storage unavailable. Use EXPORT JSON instead.', 'danger'); }
});
$('load').addEventListener('click', () => {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) throw new Error('no saved game');
    const restored = JSON.parse(raw);
    if (!isValidSave(restored)) throw new Error('save incompatible with this version');
    state = restored;
    $('seed').value = String(state.initialSeed);
    $('events').replaceChildren();
    addLog('Save restored. Recent authoritative events:', 'info');
    for (const history of state.history.slice(-8)) {
      for (const e of history.events) addLog(e.text, e.type, history.turn);
    }
    render();
  } catch (error) { addLog('Load failed: ' + error.message, 'danger'); }
});
$('export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'nublar-save-turn-' + state.turn + '.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$('clearlog').addEventListener('click', () => {
  $('events').replaceChildren();
  addLog('Display cleared; the deterministic game history remains in the save.', 'info');
});
$('ai').addEventListener('change', () => {
  $('aihint').textContent = $('ai').checked
    ? 'OpenAI GM uses the Cloudflare Worker. Enter your GAME_TOKEN below; neither secret is stored in the game save. AI can interpret and narrate, but cannot override dice or world state.'
    : 'Local deterministic mode: no Worker or API key required. Enable AI and enter your token for natural-language interpretation and narration.';
});
addLog('1993. The storm has knocked out the park network. Auxiliary power and radio communications are down. Find the access card and restore contact with the outside world.', 'scene');
addLog(view(state).description, 'scene');
render();
