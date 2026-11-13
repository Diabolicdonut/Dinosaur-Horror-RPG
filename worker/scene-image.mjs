/**
 * Bounded, on-demand cinematic still generation.
 * No OpenAI key is sent to the browser. All clients use existing GAME_TOKEN authorization.
 */
export const SCENE_IMAGE_MODEL = 'gpt-image-2.5-flare';
export const SCENE_IMAGE_PATH = '/api/scene-image';

export function safeSceneImagePayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  if (typeof body.prompt !== 'string') return null;
  const prompt = body.prompt.trim();
  if (prompt.length < 20 || prompt.length > 5000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(prompt)) return null;
  // Compatibility with the standalone demo: validate requested options but never
  // forward these as user-selectable cost/quality controls.
  if (body.model !== undefined && body.model !== SCENE_IMAGE_MODEL) return null;
  if (body.size !== undefined && body.size !== '1536x1024') return null;
  if (body.quality !== undefined && body.quality !== 'medium') return null;
  if (body.output_format !== undefined && body.output_format !== 'jpeg') return null;
  if (body.scene !== undefined &&
      (!body.scene || typeof body.scene !== 'object' || Array.isArray(body.scene))) return null;
  return { prompt };
}

export async function requestSceneImage(payload, env, upstreamFetch = fetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 110000);
  try {
    const upstream = await upstreamFetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + env.OPENAI_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: SCENE_IMAGE_MODEL,
        prompt: [
          'Render one photorealistic cinematic still from an original dinosaur survival thriller.',
          'Respect the established scene state: location, visibility, number of people and dinosaurs, environment, time of day, and known actions.',
          'Do not invent new dinosaurs, characters, events, map positions, text, logos, or UI.',
          payload.prompt
        ].join('\n'),
        size: '1536x1024',
        quality: 'medium',
        output_format: 'jpeg',
        n: 1
      }),
      signal: controller.signal
    });
    if (!upstream.ok) throw new Error('upstream_http_' + upstream.status);
    const raw = await upstream.json();
    const b64 = raw?.data?.[0]?.b64_json;
    if (typeof b64 !== 'string' || !b64 || b64.length > 16000000 ||
        !/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) throw new Error('empty_image_response');
    return { b64_json: b64, mime_type: 'image/jpeg', model: SCENE_IMAGE_MODEL };
  } finally {
    clearTimeout(timer);
  }
}
