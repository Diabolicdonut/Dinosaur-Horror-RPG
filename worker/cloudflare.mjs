/** Cloudflare-only entrypoint: keep platform module out of Node's deterministic test harness. */
import { DurableObject } from 'cloudflare:workers';
import gateway from './index.mjs';
import { SceneImageBudget as QuotaHandler } from './scene-image-budget.mjs';

export class SceneImageBudget extends DurableObject {
  async fetch(request) {
    return new QuotaHandler(this.ctx).fetch(request);
  }
}
export default gateway;
