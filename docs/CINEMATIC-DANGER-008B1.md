# Checkpoint 008-B1 — Credible Physical Danger and Connected Cinematic Acts

**Date:** October 24, 2026. **Baseline:** accepted 008-A, 0.7.15, 377/377 tests, main `f8b4e42bdb2c7302f3dd2e6e1f9a03520b5f7d21`. **Source:** privately supplied *Alien RPG Evolved Edition* rules for abilities, Heavy Machinery, seeded base/stress pools, push and Evolved stress consequences. The gate scenario and bounded encounter options are original Jurassic material, **not** a transcription of Evolved's published danger tables.

## Experience and premise

The goal is an *Alien RPG Evolved Edition* Cinematic/Campaign structure recontextualized as *Jurassic Park*. Dramatic acts and conditional dangers should support credible environmental suspense alongside ordinary scenes, recovery and wonder. Threat exposure comes from player actions and physical circumstances, not a random forced attack or always-on wildlife ecology.

### Derived three-act adventure

The active `After the Storm` scenario now exposes a **read-only Cinematic act** in the party scene:
1. **The Silent Park:** Power and communications are out. Find staff access and restore power.
2. **The Broken Perimeter:** Auxiliary power is restored, but the distress call still needs to go out. Open choices include investigating/avoiding the damaged perimeter.
3. **The Last Signal:** Distress is sent and the emergency beacon still requires activation. Once activated (or rescue is committed), the act's objective becomes the aftermath.

These labels are computed from actual saved `flags.power`, `flags.distress` and `flags.beacon`; they add **no railroaded transitions, no autonomous cutscenes, no NPC inventions and no new state fields**. A player may remain in a quiet scene, investigate optional hazards, or go directly toward their goal.

### One real optional mechanical danger: the damaged paddock gate

`src/cinematic-danger.mjs` defines one typed, physically grounded Jurassic challenge: `danger brace-paddock-gate`, presented as **Attempt challenge · Secure the damaged paddock gate** only to an active, capable survivor actually located at the authored Raptor Paddock Gate when no combat is in progress. The existing gate and bent metal already exist in the scenario.

- **Preconditions:** Actual actor ownership/turn, local `paddock` zone, valid event ID, no ongoing combat, no incapacity and no successful earlier repair. A survivor may attempt this challenge at most once; after failure a different survivor can still try. Invalid requests reject **without spending dice or time**.
- **Roll:** The existing Evolved `resolveSkillCheck` for `heavy_machinery` runs through the established party-engine `result()` wrapper, including seeded stress dice, wound modifiers, legal pushes, stress response and medical consequences. This is an ordinary physical **exploration action** with one turn's elapsed time, not a free narrated scene.
- **Success:** The metal is secured and its dangerous swinging stops. `flags.paddockGateBraced` becomes true; the action records the genuine rolled successes and the change is permanent in save/replay. No extra equipment, mission flag, rescue authorization, animal location or rewards appear.
- **Failure:** The bent gate bangs loudly, generating **noise 3** via the *existing* physically bounded noise/hearing/Velociraptor movement code. The gate remains unsecured; no guaranteed damage, compulsory encounter or appearance of an off-screen dinosaur. Noise only matters if the actual animal can hear it.
- **Persistence and privacy:** `dangerRecords` is an **optional** v3 party save journal with unique actor/event rows, real zone, beat, success and success-count validation. Missing journals/flag from older saves remain legal. The gate's repaired status is displayed locally to a survivor standing at the paddock, **not** leaked as a shared radio-like mission flag in distant actors' views. Party, Focus and Spectator use the same turn and action ownership.

**Important:** This is deliberately a single tested, optional physical-danger exercise and a connected act indicator, **not a fully linked or generative multi-scene campaign, human NPC conversation system, full Evolved Last Survivor danger procedure, mandatory encounter escalation or global ecology simulator**. Additional authored hazards and scene outcomes require independent testing.

## Quality gate and next action

Retain all **377** previously accepted automated tests. **12** focused tests in `tests/cinematic-danger-008b1.test.mjs` target **389 total**: act derivation, room-conditioned hazard visibility, no-cost rejection, actual Evolved skill rolls, success/failure consequences, meaningful sound, per-actor attempts, schema validation and legacy saves, combat/injury constraints, camera perspective and deterministic replay. Report PR CI, final accepted main CI, Pages and true desktop/mobile graphical smoke **separately**. The manual graphical smoke remains outstanding until actually performed.

Next development should implement additional **source-verified, causally grounded, non-forced** scene events and a genuinely multi-scene rescue/escape adventure with sustained Evolved resources, optionally alongside 007-M tools/repairs and eventually the 007-N bounded conversational Game Mother. No mandatory full wildlife simulation.
