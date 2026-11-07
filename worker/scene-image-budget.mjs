/** Strict, persistent single-player image request quota.
 * One named SQLite-backed Cloudflare Durable Object is shared across all edge locations.
 * Reservations are charged BEFORE upstream contact and are never refunded: timeouts can bill.
 */
export const SCENE_IMAGE_LIMITS = Object.freeze({
  perDay: 3,
  perMonth: 20,
  cooldownSeconds: 60
});
const STORAGE_KEY = 'scene-image-budget-v1';

function untilNextDay(ms) {
  const d = new Date(ms);
  return Math.max(1, Math.ceil((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1) - ms) / 1000));
}
function untilNextMonth(ms) {
  const d = new Date(ms);
  return Math.max(1, Math.ceil((Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1) - ms) / 1000));
}

export async function reserveSceneImageBudget(storage, nowMs = Date.now()) {
  if (!Number.isSafeInteger(nowMs) || nowMs < 0 || !storage || typeof storage.transaction !== 'function')
    throw new Error('invalid_scene_image_budget_storage');
  const utc = new Date(nowMs).toISOString();
  const today = utc.slice(0, 10);
  const month = utc.slice(0, 7);
  return storage.transaction(async txn => {
    const previous = await txn.get(STORAGE_KEY) || {};
    const dayUsed = previous.day === today && Number.isSafeInteger(previous.dayUsed) ? previous.dayUsed : 0;
    const monthUsed = previous.month === month && Number.isSafeInteger(previous.monthUsed) ? previous.monthUsed : 0;
    const last = Number.isSafeInteger(previous.last) ? previous.last : null;
    if (monthUsed >= SCENE_IMAGE_LIMITS.perMonth)
      return { allowed: false, error: 'image_monthly_quota', retryAfter: untilNextMonth(nowMs) };
    if (dayUsed >= SCENE_IMAGE_LIMITS.perDay)
      return { allowed: false, error: 'image_daily_quota', retryAfter: untilNextDay(nowMs) };
    if (last !== null && nowMs < last + SCENE_IMAGE_LIMITS.cooldownSeconds * 1000)
      return { allowed: false, error: 'image_cooldown',
        retryAfter: Math.max(1, Math.ceil((last + SCENE_IMAGE_LIMITS.cooldownSeconds * 1000 - nowMs) / 1000)) };
    // Commit a reservation before an upstream API call; no refund for uncertain billed outcomes.
    await txn.put(STORAGE_KEY, {
      day: today, dayUsed: dayUsed + 1,
      month, monthUsed: monthUsed + 1, last: nowMs
    });
    return {
      allowed: true,
      dayRemaining: SCENE_IMAGE_LIMITS.perDay - dayUsed - 1,
      monthRemaining: SCENE_IMAGE_LIMITS.perMonth - monthUsed - 1
    };
  });
}

/** Exported as a Cloudflare Durable Object class (legacy constructor/fetch contract).
 * A plain class keeps the deterministic quota engine runnable under Node tests.
 */
export class SceneImageBudget {
  constructor(ctx) { this.ctx = ctx; }
  async fetch(request) {
    if (request.method !== 'POST' || new URL(request.url).pathname !== '/reserve')
      return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });
    try {
      const decision = await reserveSceneImageBudget(this.ctx.storage);
      return new Response(JSON.stringify(decision), {
        status: decision.allowed ? 200 : 429,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store',
          ...(decision.allowed ? {} : { 'Retry-After': String(decision.retryAfter) }) }
      });
    } catch {
      return new Response(JSON.stringify({ error: 'image_budget_unavailable' }), {
        status: 503, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
      });
    }
  }
}
