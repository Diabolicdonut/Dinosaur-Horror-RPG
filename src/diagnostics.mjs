/** Browser-side support diagnostics. No credentials belong in exported files. */
export const DEBUG_SCHEMA = 1;
export function redactSensitive(value, secret = '') {
  if (typeof value === 'string') {
    let text = value;
    if (secret && secret.length > 0) text = text.split(secret).join('[REDACTED_GAME_TOKEN]');
    return text
      .replace(/\bBearer\s+[^\s"'<>]+/gi, 'Bearer [REDACTED]')
      .replace(/\bsk-(?:proj-)?[A-Za-z0-9_-]{10,}/gi, '[REDACTED_OPENAI_KEY]')
      .replace(/(GAME_TOKEN|OPENAI_API_KEY)\s*[:=]\s*["']?[^\s,"'}]+/gi, '$1=[REDACTED]');
  }
  if (Array.isArray(value)) return value.map(x => redactSensitive(x, secret));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      if (/^(authorization|game_token|openai_api_key|token|api_key|password)$/i.test(key))
        out[key] = '[REDACTED]';
      else out[key] = redactSensitive(val, secret);
    }
    return out;
  }
  return value;
}
export function createDiagnostics(maxEntries = 500) {
  const entries = [];
  return {
    add(entry, secret = '') {
      entries.push(redactSensitive({ at: new Date().toISOString(), ...entry }, secret));
      if (entries.length > maxEntries) entries.splice(0, entries.length - maxEntries);
    },
    snapshot(secret = '') { return redactSensitive(entries, secret); }
  };
}
export function makeDebugReport({ state, scenario, transcript, diagnostic, aiStatus, client,
  token = '', tokenRemembered = false, aiEnabled = false, savedGameAvailable = false }) {
  const raw = {
    report_format: 'dinosaur-horror-rpg-debug',
    schema_version: DEBUG_SCHEMA,
    generated_at: new Date().toISOString(),
    warning: 'Contains full hidden game state, command history and potentially personal text. Share deliberately. API keys and game token are excluded.',
    build: client.build,
    browser: { origin: client.origin, path: client.path, userAgent: client.userAgent },
    ai: {
      enabled: aiEnabled, worker: client.worker,
      status: aiStatus, tokenPresent: Boolean(token),
      tokenRemembered: Boolean(tokenRemembered),
      credentials: '[REDACTED]'
    },
    game: { state, scenario, savedGameAvailable },
    event_log: transcript,
    diagnostics: diagnostic
  };
  return redactSensitive(raw, token);
}
