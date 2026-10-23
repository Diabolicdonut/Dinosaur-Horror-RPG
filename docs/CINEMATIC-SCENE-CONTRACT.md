# Cinematic and Campaign Scenes — Alien Evolved to Jurassic Park

**Accepted direction:** October 23, 2026. **Authority:** [Living Game Vision and Roadmap](DINOSAUR-EVOLVED-IMPLEMENTATION-PLAN.md), [Evolved Rules Authority](EVOLVED-RULES-AUTHORITY.md), [Wonder and Dread](WONDER-AND-DREAD-DESIGN.md). This document describes a scene-oriented adventure contract; it does not claim a fully autonomous Game Mother has shipped.

## Objective

**Convert the Alien RPG experience into Jurassic Park, not into a wildlife-management simulator.** The existing three thematic categories map to **Dinosaur Horror, Sci-Fi Action and Sense of Wonder**. They share the same mechanical engine, and the director may use them at different intensities across an adventure. Scares require contrast, but no fixed ratio or forced alternation.

**Cinematic adventures:** Focused crises with a setup, complications and a resolution, drawing on Alien-style acts, events, hidden threats, stress, stealth and combat. Events may be mandatory when genuinely inherent in the scenario, but most are conditional or optional. The player is not required to reenact movie outcomes.

**Continuing campaigns:** Persistent characters, injuries, inventory, relationships, objectives and consequences across a succession of location-bound, dramatically distinct scenes. A campaign can have several quiet recovery/wonder/social chapters between intense sequences; danger need not climb monotonically.

## Scene model and director rules

Each authored scene supplies a stable ID, visible location, situation, dramatic theme, objective/opportunity and *possible* conditional developments. Scenes describe open situations, not scripted results or mandatory combat.

The Game Mother may choose timing and context using the Alien-style GM/cinematic/stealth approach, including event triggers and encounter/danger pressure where subsequently implemented. It can present a believable Triceratops, a peaceful long-necked animal, a damaged power system or a stalking predator as appropriate to the situation. It **must not** grant an invisible monster teleport, invent an attack, override character actions or imply that a calm herbivore is safe simply because it eats plants. A Triceratops could remain calm, retreat, threaten or defend itself if surprised or approached by a predator. These are situational encounter rulings, **not** mandatory daily needs or a birth-to-death ecosystem.

**Three state boundaries:**

1. **Game Mother presentation:** Free descriptive content and suggested opportunities consistent with what an actor can observe. New mechanically consequential facts are not committed by narration.
2. **Scene/event proposal:** Typed, validated intent with actor and scene IDs, preconditions, causal trigger and optional results; rejects stale or physically impossible requests. A director may stage an authorized scenario event, but does not assume it happened.
3. **Committed Evolved gameplay:** The existing deterministic engine alone mutates time, stress, dice, inventory, position, creatures, wounds, relationships and flags; it records each accepted decision for replay.

Only simulate individual creature position/health/awareness where needed for fair active encounters or saved continuity. Other dinosaurs can be cinematic distance cues or authored background, labeled accordingly. Whole-island population inventories, migrations, feeding schedules, family trees and survival ecology are **explicitly optional**, not acceptance gates.

## First connected adventure — Isla Nublar: After the Storm

The current seven-zone scenario already has a valid mission: recover the keycard, restore generator power, send a distress call, activate the helipad beacon. Its first playable **scene framing** overlays:

| Location | Scene tone | Core opportunity |
| --- | --- | --- |
| Visitor Center Control Room | Investigation / sci-fi action | Diagnose radio blackout, later transmit rescue call |
| Visitor Center Lobby | Wonder / exploration | Observe the great hall and find staff access card |
| Service Corridor | Problem-solving | Discover the physically locked service route |
| Maintenance Shed | Sci-fi action | Start noisy generator, obtain supplies |
| Jungle Service Path | Suspense / exploration | Investigate track evidence; navigate without guaranteed predator attack |
| Raptor Paddock Gate | Dinosaur horror / caution | Inspect a damaged perimeter; active threat remains governed by physical creature state |
| Emergency Helipad | Wonder / resolution | Observe distant herbivores, activate beacon if prerequisites are real |

**Implemented initial scene-framing slice:** `src/cinematic-scenes.mjs` is a pure, read-only actor-local location/mission projection. `partyView` supplies one scene cue to the browser as the character moves and objective flags change. It does not consume time/RNG, modify saves, summon animals, force fights, grant information about hidden creatures or promise the next event. No new encounter timer, scene selection AI, NPC dialogue or additional dinosaur has been implemented by this slice.

## Expansion and acceptance gates

**Scene 1 (this slice):** Distinct location-linked dramatic framing in live Party/Focus/Spectator views, with conditional objective text based only on committed public state; no RNG/time/hidden knowledge. Existing scenes, actor-owned Wonder discoveries, all 324 accepted tests and party v3 saves retained.

**Scene 2:** A typed scene and event registry supporting opt-in or trigger-bound events; potential encounter and danger timers should adapt the privately held Evolved solo/cinematic mechanics faithfully and must not fabricate impossible world facts. Test ordinary, delayed and abandoned events and the choice to avoid a fight.

**Scene 3:** A first playable multi-scene incident with at least one genuinely peaceful dinosaur encounter, one physical dinosaur threat, one meaningful skill/equipment task, a quiet social/recovery scene and a consequential evacuation. Test player choices that skip or resolve scenes unexpectedly; ensure each Evolved check, turn cost and injury persists.

**AI GM:** Only after typed event/effect contracts exist, allow natural-language scene interpretation, NPC dialogue and event selection. The model cannot commit world state itself and should not leak other characters' unseen events.

**Explicit exclusion:** Do not make virtual Zoo Tycoon simulation or the existence of continuously simulated herds a prerequisite for Cinematic or Campaign play. Species-appropriate encounter reactions plus Alien-style pacing are sufficient until more complexity is independently justified.

**Testing truth:** Node/CI and Pages green are separate from interactive browser smoke (desktop/mobile), which remains outstanding until actually performed. Keep the solo 006.2/Worker v006 separate unless a later accepted milestone deliberately integrates them.
