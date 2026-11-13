# DHR-028 — Evolved help and modifier authorization (isolated contract)

**Issue:** #93 · **Gate:** 7 (partial; accepted whole-product score remains **38/100**).
**Source:** Privately supplied ALIEN RPG — Evolved Edition, Using Skills pp. 42–44 and combat action economy pp. 59–61. This file contains original implementation guidance, not reproduced rulebook passages.

## Rule and trust boundaries

- At most **three distinct other characters** may support one actor on an Evolved check. An eligible helper contributes **exactly +1 base die**, regardless of their own skill rank; untrained Evolved skills remain available. Help never adjusts stress dice. A real full combat action is reserved for **each helper** and the lead when a supported combat checkpoint exists.
- The GM's proposed help is **not** authority for skill ranks, probabilities, equipment bonuses, distance, time, dice or item ownership. Source-bound task, valid actor sheets, physical room, condition, actual inventory and unspent action budgets are authoritative. Stress, talents, wound penalties, seeded d6, pushes and result are delegated to the unchanged src/evolved-checks.mjs.
- As a deliberately limited **implementation proof**, this resolver authorizes only genuinely active, source-authored **objective skill interactions** in validated, version/seed-bound Party saves. Source-defined objective_check circumstances supply difficulty; live trauma supplies any injury penalty. There is no caller-supplied signed modifier, arbitrary skill selection, foreign or extra die, or fabricated equipment bonus.
- Typed proof methods (original conservative policies, **not Evolved numerical rules**): cross_check for Observation/Survival/Comtech/Medical Aid, hands_on for Heavy Machinery/Comtech/Medical Aid, radio_relay for Comtech with a physical, source-defined field-radio item owned by that helper. These are a narrow set of concrete support methods. Each helper must be co-located with the lead in the authored objective's room, be able to act, and have an unchanged rules-valid actor sheet. Unrelated tools never confer a die. hands_on rejects immobility.
- Same-room position is the accepted adventure engine's current physical granularity; it cannot prove reach, line of sight or fine-grained interference within a large room. A future spatial integration must provide tighter authority before allowing such cases. There is no standing authorization for help on attacks, creature evasion, passive spotting, opposed checks, medical procedures, arbitrary prose, routine skill:null objectives or new GM-created tasks.

## Standalone API

resolveCooperativeCheck(compiled, state, request, journal?) and replayCooperativeCheck(compiled, state, journal) are pure exports from src/evolved-cooperation.mjs.

A pre-roll request contains **exactly**:
- actorId, objectiveId
- helpers: 1–3 objects with actorId, method, toolId; use toolId:null for methods not requiring an item
- expectedBeat, expectedRng, expectedActionCount, push

A successful resolution returns check from the original deterministic Evolved dice engine, and authorization with source-derived skill, difficulty/injury modifier, help, helper evidence, pre-committed full-action budgets when combat is supported, actual check seed and the proposed next RNG state. The return value is **not automatically committed** to any Party save. It also returns a one-shot source/beat/RNG/action-bound **external journal receipt**, which can be replayed only against the **same original pre-roll state**. A second expenditure using that receipt on the same checkpoint is refused, as are altered rolls, helpers, point-in-time expectations, modifiers or source fingerprints.

The resolver does **not** mutate compiled, state, characters, inventories, combat budgets, RNG, action history, UI, Worker or saves. Legacy saves remain byte-for-byte untouched. Rejections are pure and never roll. It works regardless of Party/Focus/Spectator ownership; the mode's human/AI dispatch must happen elsewhere. It does not invent an input action or take over the Game Mother's discretion.

## Integration requirements and limitations

1. **Integrate only in a future reviewed action-adjudication PR.** An engine-owned transaction must authorize a current scene action and any helper consent, invoke this before dice, **atomically commit** the seeded roll, updated actor stress, the exact nextRng, full-action expenditures if applicable, physical objective consequences and a replay receipt. A failed action still consumes its legitimate time and cost. Resolve all helps **before** rolling; no late helper amendments.
2. Extend authoring (with new versioned manifests, never altering frozen historical adventure fingerprints) for task-specific help methods/required equipment and finer reach/line-of-sight/communication. Current methods are intentionally an original minimum allowlist, not general natural-language cooperation.
3. The external receipt is **one pre-action check**, not a historic multi-check ledger. Real world replay must preserve the trusted pre-action snapshot and replay/validate receipts along with action history; do not append invented help fields to old v2/v3 saves. An untrusted client that replaces the entire save and starting roster may still forge a self-consistent local world: **server-authoritative origin and authenticated histories are a separate security gate**.
4. Combat applies full-action reservations only for states exposing the existing Evolved round/order/budget contract, with correct current initiative. Incomplete or unverified combat state fails closed. Source-valid combat help timing and richer supporting cast/NPC action budgets require subsequent integrated development; **no combat module was edited**.
5. Gameplay, manual graphical QA, Cloudflare deployment and merged-main acceptance remain Integration Director responsibilities. This isolated component is not proof of Evolved-wide parity or a weighted roadmap gate completion.

## Regression evidence

tests/evolved-cooperation-dhr028.test.mjs exercises physical multi-actor movement to a real estuary task, 1–3 helpers and base/stress pool separation, valid authored tool transfer, no invented abilities/gear, incorrect actor/room/method/source, actor incapacity, timing and duplicate/retroactive requests, source/receipt/dice tampering, RNG replay and JSON save roundtrips, all three control modes, and historical Nublar isolation.

Run node --check src/evolved-cooperation.mjs, node --check tests/evolved-cooperation-dhr028.test.mjs, npm test and exact PR-head GitHub Actions node-test before integrator review. No roadmap/status file, preserved adventure definition, shared Party UI, shared gameplay core or Cloudflare Worker was changed.
