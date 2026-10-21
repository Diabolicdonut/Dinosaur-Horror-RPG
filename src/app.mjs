import { SCENARIO } from './scenario.mjs';
import { newGame, step, view, isValidSave, parseAction, RULESET, ENGINE_VERSION } from './engine.mjs';
import { createDiagnostics, makeDebugReport, redactSensitive } from './diagnostics.mjs';

const $ = id => document.getElementById(id);
const SAVE_KEY = 'dinosaur-horror-rpg-isla-nublar-v1';
const WORKER_BASE = 'https://dinosaur-rpg.diabolicdonut.workers.dev';
const TOKEN_KEY = 'dinosaur-horror-rpg-remembered-token-v1';
const AI_PREF_KEY = 'dinosaur-horror-rpg-ai-enabled-v1';
const CLIENT_BUILD = '004';
const trace = createDiagnostics(500);
const transcript = [];
let state = newGame();
let busy = false;
let connection = { status: 'offline', label: 'AI DISABLED',
  detail: 'Engine operates without OpenAI.', version: null,
  modelVerified: false, lastHttpStatus: null, checkedAt: null, lastFailure: null };
let lastSaveError = null;

function secret() { return $('game-token')?.value?.trim() || ''; }
function sanitize(value) { return redactSensitive(value, secret()); }
function record(kind, detail = {}) { trace.add({ kind, ...detail }, secret()); }
function setConnection(status, label, detail, extra = {}) {
  connection = { ...connection, status, label, detail,
    checkedAt: new Date().toISOString(), ...extra };
  const node = $('ai-status');
  node.className = 'ai-connection ' + status;
  $('ai-status-label').textContent = label;
  $('ai-status-detail').textContent = detail;
  $('ai-status-top').textContent = 'AI: ' + label;
  record('connection', { status, label, detail,
    version: connection.version, lastHttpStatus: connection.lastHttpStatus });
}
function storageWrite(key, value) {
  try { localStorage.setItem(key, value); lastSaveError = null; return true; }
  catch (error) {
    lastSaveError = String(error?.message || error);
    record('storage_error', { operation: 'write', key, message: lastSaveError });
    return false;
  }
}
function storageRead(key) {
  try { return localStorage.getItem(key); }
  catch (error) { record('storage_error', { operation: 'read', key, message: String(error) }); return null; }
}
function storageRemove(key) {
  try { localStorage.removeItem(key); return true; }
  catch (error) { record('storage_error', { operation: 'remove', key, message: String(error) }); return false; }
}
async function checkConnection() {
  if (!secret()) {
    setConnection('error', 'TOKEN REQUIRED', 'Enter GAME_TOKEN, then press Test AI Connection.',
      { modelVerified: false, lastHttpStatus: null });
    return false;
  }
  setConnection('checking', 'CONNECTING', 'Checking Cloudflare authorization…',
    { modelVerified: false });
  const started = performance.now();
  try {
    const result = await fetch(WORKER_BASE + '/v1/gm/status', {
      method: 'GET', headers: { Authorization: 'Bearer ' + secret() },
      cache: 'no-store', signal: AbortSignal.timeout(15000)
    });
    record('gateway_status', { endpoint: '/v1/gm/status', httpStatus: result.status,
      elapsedMs: Math.round(performance.now() - started) });
    if (result.status === 401) throw new Error('GAME_TOKEN rejected by Cloudflare (HTTP 401).');
    if (result.status === 404) throw new Error('Older Worker code is deployed (HTTP 404). Paste the latest worker/index.mjs and redeploy.');
    if (!result.ok) throw new Error('Cloudflare status check failed (HTTP ' + result.status + ').');
    const response = await result.json();
    if (response.authenticated !== true || response.openai_configured !== true)
      throw new Error('Gateway is reachable but its credentials are not fully configured.');
    setConnection('ready', 'GATEWAY READY',
      'Worker v' + String(response.version || '?') + ': token accepted; OpenAI model call not yet verified.', {
      version: response.version || null, modelVerified: false,
      lastHttpStatus: result.status, lastFailure: null
    });
    record('gateway_models', { models: response.models || {}, version: response.version });
    return true;
  } catch (error) {
    const message = sanitize(String(error?.message || error));
    const label = /401/.test(message) ? 'AUTHENTICATION FAILED'
      : /404/.test(message) ? 'UPDATE WORKER' : 'AI STATUS UNKNOWN';
    setConnection('error', label, message, {
      modelVerified: false, lastFailure: message
    });
    return false;
  }
}


function addLog(text, type = 'scene', turn = state.turn, source = 'ENGINE') {
  const node = document.createElement('div');
  node.className = 'logentry ' + (['roll', 'danger', 'success', 'info', 'end'].includes(type) ? type : 'scene');
  const header = document.createElement('span');
  header.className = 'turn-label';
  header.textContent = `T+${String(turn).padStart(3, '0')} / ${source}`;
  node.append(header, document.createTextNode(text));
  $('events').append(node);
  $('events').scrollTop = $('events').scrollHeight;
  const entry = sanitize({ turn, type, source, text, at: new Date().toISOString() });
  transcript.push(entry);
  if (transcript.length > 500) transcript.shift();
  record('event_log', entry);
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
  for (const point of v.inspectables) actionButton($('actions'), 'INSPECT ' + point.toUpperCase(), 'look ' + point, 'action');
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
  const token = secret();
  if (!token) throw new Error('Enter GAME_TOKEN in the engine controls.');
  const endpoint = mode === 'interpret' ? 'turn' : mode === 'narrate' ? 'narrate' : null;
  if (!endpoint) throw new Error('Unsupported AI operation.');
  const start = performance.now();
  record('ai_request', { route: endpoint, payload: sanitize(payload) });
  let httpStatus = null;
  try {
    const response = await fetch(WORKER_BASE + '/v1/gm/' + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ payload }), signal: AbortSignal.timeout(28000), cache: 'no-store'
    });
    httpStatus = response.status;
    if (!response.ok) {
      if (response.status === 401) throw new Error('GAME_TOKEN rejected (HTTP 401).');
      if (response.status === 429) throw new Error('Rate limit reached (HTTP 429).');
      if (response.status === 503) throw new Error('Worker configuration unavailable (HTTP 503).');
      if (response.status === 404) throw new Error('Worker API route missing (HTTP 404).');
      // Preserve a sanitized error code, but not provider text or secrets.
      let errorCode = '';
      try { errorCode = String((await response.json()).error || '').slice(0, 80); }
      catch { /* An HTML error response is possible. */ }
      throw new Error('AI gateway HTTP ' + response.status + (errorCode ? ' (' + errorCode + ')' : ''));
    }
    const data = await response.json();
    record('ai_response', { route: endpoint, httpStatus,
      elapsedMs: Math.round(performance.now() - start), response: sanitize(data) });
    setConnection('active', 'OPENAI RESPONDING',
      'Authenticated gateway and a successful model response.', {
      modelVerified: true, lastHttpStatus: httpStatus, lastFailure: null
    });
    return data;
  } catch (error) {
    const message = sanitize(String(error?.message || error));
    record('ai_error', { route: endpoint, httpStatus,
      elapsedMs: Math.round(performance.now() - start), message });
    setConnection('error', 'AI REQUEST FAILED', message, {
      modelVerified: false, lastHttpStatus: httpStatus, lastFailure: message
    });
    throw error;
  }
}
async function execute(command) {
  if (busy || state.outcome !== 'playing') return;
  busy = true; render();
  addLog('> ' + sanitize(command), 'info', state.turn, 'PLAYER');
  record('player_command', { command: sanitize(command), location: state.player.location,
    turn: state.turn, aiEnabled: $('ai').checked });
  try {
    let input = command;
    // Fast path: known commands are parsed locally; novel prose uses the AI interpreter.
    if ($('ai').checked && !parseAction(command).kind) {
      try {
        const response = await aiRequest('interpret', {
          input: command, location: view(state).roomName,
          exits: view(state).exits.map(x => x.id),
          features: view(state).features,
          inspectables: view(state).inspectables,
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
    record('engine_step', { submittedCommand: sanitize(command), parsedAction: sanitize(input),
      accepted: result.accepted, narratable: Boolean(result.narratable),
      turn: state.turn, location: state.player.location,
      outcome: state.outcome, events: sanitize(result.events) });
    displayEvents(result.events);
    if (result.accepted) {
      storageWrite(SAVE_KEY, JSON.stringify(state));
    }
    // Successful time-free observations are narratable even though they do not advance the simulation.
    if ($('ai').checked && (result.accepted || result.narratable) && secret()) {
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
    record('client_error', { operation: 'execute', message: sanitize(String(error?.message || error)), stack: sanitize(error?.stack || '') });
    addLog('Action rejected: ' + sanitize(String(error?.message || error)), 'danger', state.turn, 'SYSTEM');
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
  storageWrite(SAVE_KEY, JSON.stringify(state));
  record('new_game', { seed: state.initialSeed });
  $('events').replaceChildren();
  addLog('1993. The storm has knocked out the park network. Auxiliary power and radio communications are down. Find the access card and restore contact with the outside world.', 'scene');
  addLog(view(state).description, 'scene');
  render();
});
$('save').addEventListener('click', () => {
  if (storageWrite(SAVE_KEY, JSON.stringify(state))) addLog('Deterministic save stored in this browser.', 'success');
  else addLog('Browser storage unavailable. Use EXPORT SAVE instead.', 'danger');
});
$('load').addEventListener('click', () => {
  try {
    const raw = storageRead(SAVE_KEY);
    if (!raw) throw new Error('no saved game');
    const restored = JSON.parse(raw);
    if (!isValidSave(restored)) throw new Error('save incompatible with this version');
    state = restored;
    record('load_game', { turn: state.turn, rng: state.rng });
    $('seed').value = String(state.initialSeed);
    $('events').replaceChildren();
    addLog('Save restored. Recent authoritative events:', 'info');
    for (const history of state.history.slice(-8)) {
      for (const e of history.events) addLog(e.text, e.type, history.turn);
    }
    render();
  } catch (error) { addLog('Load failed: ' + sanitize(String(error?.message || error)), 'danger'); }
});
function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$('export').addEventListener('click', () => {
  // Save JSON stays import-compatible and does not include the GAME_TOKEN.
  downloadJson('nublar-save-turn-' + state.turn + '.json', state);
});
$('export-debug').addEventListener('click', () => {
  record('debug_export', { turn: state.turn, connectionStatus: connection.status });
  const report = makeDebugReport({
    state: structuredClone(state), scenario: SCENARIO,
    rules: { version: ENGINE_VERSION, config: RULESET }, transcript: structuredClone(transcript),
    diagnostic: trace.snapshot(secret()), aiStatus: structuredClone(connection),
    token: secret(), tokenRemembered: $('remember-token').checked,
    aiEnabled: $('ai').checked, savedGameAvailable: Boolean(storageRead(SAVE_KEY)),
    client: { build: CLIENT_BUILD, origin: location.origin, path: location.pathname,
      userAgent: navigator.userAgent, worker: WORKER_BASE }
  });
  downloadJson('dinosaur-rpg-debug-turn-' + state.turn + '-' + Date.now() + '.json', report);
  addLog('Diagnostic report exported. Contains hidden world state but no GAME_TOKEN.', 'success', state.turn, 'SYSTEM');
});
$('clearlog').addEventListener('click', () => {
  $('events').replaceChildren();
  addLog('Display cleared; the deterministic game history remains in the save.', 'info');
});
$('ai').addEventListener('change', () => {
  storageWrite(AI_PREF_KEY, $('ai').checked ? 'on' : 'off');
  if ($('ai').checked) void checkConnection();
  else setConnection('offline', 'AI DISABLED', 'Engine operates locally without OpenAI.', { modelVerified: false });
});
$('game-token').addEventListener('input', () => {
  if ($('remember-token').checked) {
    if (!storageWrite(TOKEN_KEY, secret())) $('remember-token').checked = false;
  }
  setConnection('offline', secret() ? 'TOKEN CHANGED' : 'TOKEN REQUIRED',
    'Press TEST AI CONNECTION to verify authentication.', { modelVerified: false });
});
$('remember-token').addEventListener('change', () => {
  if ($('remember-token').checked) {
    if (!storageWrite(TOKEN_KEY, secret())) {
      $('remember-token').checked = false;
      addLog('Could not save token in this browser. It remains session-only.', 'danger', state.turn, 'SYSTEM');
    }
  } else storageRemove(TOKEN_KEY);
  record('remember_token_preference', { enabled: $('remember-token').checked });
});
$('forget-token').addEventListener('click', () => {
  storageRemove(TOKEN_KEY);
  $('remember-token').checked = false;
  $('game-token').value = '';
  setConnection('offline', 'TOKEN FORGOTTEN',
    'Saved GAME_TOKEN cleared from this device.', { modelVerified: false });
  addLog('Stored GAME_TOKEN has been cleared from this browser.', 'info', state.turn, 'SYSTEM');
});
$('test-ai').addEventListener('click', () => { void checkConnection(); });
window.addEventListener('error', e => {
  record('browser_exception', { message: sanitize(e.message), filename: e.filename,
    line: e.lineno, column: e.colno, stack: sanitize(e.error?.stack || '') });
});
window.addEventListener('unhandledrejection', e => {
  record('unhandled_rejection', { message: sanitize(String(e.reason?.message || e.reason)),
    stack: sanitize(e.reason?.stack || '') });
});

function initialize() {
  const savedToken = storageRead(TOKEN_KEY);
  if (savedToken) {
    $('game-token').value = savedToken;
    $('remember-token').checked = true;
  }
  $('ai').checked = storageRead(AI_PREF_KEY) === 'on';
  const raw = storageRead(SAVE_KEY);
  let restored = false;
  if (raw) {
    try {
      const candidate = JSON.parse(raw);
      if (isValidSave(candidate)) {
        state = candidate;
        $('seed').value = String(state.initialSeed);
        restored = true;
        record('automatic_resume', { turn: state.turn, position: state.player.location });
      } else record('invalid_saved_state', { message: 'Save schema invalid or incompatible.' });
    } catch (error) { record('invalid_saved_state', { message: sanitize(String(error)) }); }
  }
  if (restored) {
    addLog('Session resumed automatically from local save: turn ' + state.turn +
      ', ' + view(state).roomName + '.', 'success', state.turn, 'SYSTEM');
    for (const h of state.history.slice(-12)) for (const e of h.events)
      addLog(e.text, e.type, h.turn, 'ENGINE HISTORY');
  } else {
    addLog('1993. The storm has knocked out the park network. Auxiliary power and radio communications are down. Find the access card and restore contact with the outside world.', 'scene');
    addLog(view(state).description, 'scene');
  }
  render();
  if ($('ai').checked) void checkConnection();
  else setConnection('offline', 'AI DISABLED', 'Engine operates locally without OpenAI.');
}
initialize();
