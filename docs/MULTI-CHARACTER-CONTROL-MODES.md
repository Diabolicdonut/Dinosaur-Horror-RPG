# Multi-character control and spectator simulation — design decision

**Accepted:** 2026-10-22. **Scope:** Dinosaur Horror RPG, single human player controlling a party of playable human characters. **Status:** architecture accepted only; not implemented in checkpoint 006.2.

## Product contract

Implement **three switchable modes** with one authoritative persistent simulation, not separate playthroughs:

1. **PARTY** — human player chooses actions for every playable party member, either individually or as a coordinated instruction. The engine resolves each character's action using their own Evolved character sheet, skills, talent triggers, stress and appropriate turn/action budget. Nonparty NPCs, dinosaurs and the world remain AI/simulation-controlled. The system does not silently spend a party member's meaningful action in the absence of a player instruction, except for validated automatic reflexes/forced consequences.
2. **FOCUS** — human directs exactly one selected playable character at a time; AI runs all *other playable characters* autonomously. Human can switch focus to any eligible playable party member. Their persistent motives, relationships, training, equipment, health, injury, stress, local observations and already committed plans do not reset. Nonparty NPCs and dinosaurs remain autonomous.
3. **SPECTATOR** — AI directs every playable character and ordinary NPC; deterministic simulation governs all dice, combat, survival, world state and dinosaurs. Human can watch, select a camera viewpoint, pause, step one committed event, resume, and switch to PARTY or FOCUS without reloading/resetting. This is an active simulation, not a scripted/re-rolled animation and does not imply offline background execution.

**Switching:** Allow changes in mode at any time from the UI, applying them **at the next safe adjudication boundary**. In-progress atomic dice/effects already committed must finish. A switch can revoke uncommitted AI proposals/queued decisions but never undo events, dice or world consequences. Mark switches in the authoritative journal with simulated time, control owner, focus ID, outstanding actions, and event index. Pause spectator auto-advance before changing mode; do not enqueue overlapping computer actions. Return prompt/control to human immediately after pending atomic resolution.

## Separate agency from observation

**Control mode** specifies whose future decisions the player may issue. **Viewpoint** specifies what the screen and prose display. These MUST NOT be confused.

- `controlMode: 'party' | 'focus' | 'spectator'`
- `focusedActorId: string | null` (only one at any moment in focus mode)
- `cameraMode: 'follow' | 'party' | 'director'`; `cameraActorId` if following.
- `isPlaybackPaused: boolean` and configurable spectator playback pacing are *UI controls*, not new outcomes or world time.
- Allow a player to change **camera** independently of mode, including while in spectator mode.
- **Horror default:** character-limited camera and narration, not privileged global knowledge. Follow only what the selected character can perceive or was truthfully told. Party view may aggregate observations known by active party members, with location/source labels to avoid telepathic sharing.
- Optional **omniscient director** spectator presentation, if desired later, must be opt-in and explicitly warn of spoilers. It does not grant extra in-world information to any actor when returning to manual play.

## Persistent characters

Each playable character must be a first-class actor with:
- stable ID, identity, dinosaur-park career, traits, inventory, attributes, twelve Evolved skills, starting/career talents, Health, Resolve, stress and long-term stress responses;
- location, position, attention, concealment, injuries, immediate goals, standing orders and action budget;
- per-character knowledge/observations, beliefs, memories, relationships, interpersonal tension and agenda;
- control eligibility flags (e.g., alive, present, capable of meaningful action); incapacitated/dead actors may be watched but cannot act;
- ownership of each die roll and mechanical effect, including assists, opposed actions, injuries and actions by party members other than the viewed character.

No global singleton `state.player` for full development; checkpoint 006.2 may retain it temporarily through an explicit save migration/compatibility adapter.

## How AI companions act

The AI Game Master/companion director proposes a **grounded objective and legal action** using only that actor's knowledge, resources, personality, agenda, instructions and recognized danger. It must not automatically know every dinosaur's true location, another character's undisclosed discovery, or future random rolls. The deterministic Evolved-based engine validates feasibility, available turn/quick/full actions, modifiers, talents and state before executing hidden seeded dice and effects.

Individual actors may disagree, hesitate, flee, assist, follow or refuse orders based on their own goals and the game rules. In focus/party mode the human may issue social orders; success must not universally override the target's personality, restraints, fear or knowledge. No unfair omniscience or unbounded LLM-written state changes.

For reproducible replay, accepted AI action proposals (including target, intention, affected objects and all validated mechanics) are persisted; seeded RNG is used only by engine. Replaying saved proposals reproduces exact mechanical outcomes without relying on nondeterministic model text. A queued model response must be checked against current world version/turn and current mode before it can commit. Network failures pause AI progression gracefully rather than fabricating events.

## Simulation scheduler and Evolved fidelity

Use **one** scheduler for every mode. Order of actions, Evolved time scales (exploration vs combat), initiative, quick/full actions, interrupt/reaction rules, and environmental/dinosaur events are governed by the *same* engine regardless of who decided the action.

- Party mode: prompt human when a human-owned actor is due; optionally let user plan group instructions to be decomposed into ordered legal actions with interruptions.
- Focus mode: prompt human only for focused actor; resolve AI turns of others with identical rules and sufficient character-specific input.
- Spectator: auto-schedule all playable actors at a user-selected display pacing; pause/resume/step without changing in-world action costs. Avoid high-frequency speculative AI calls or advancing the world with no bounded action.
- Mode changes during combat alter **future decision ownership**, not initiative or already consumed action budgets.
- The AI does not decide success/failure, stress/panic dice, creature teleportation, inventory creation, death or victory.

## UI proposal

A persistent **Control Mode** selector with `Party | Character | Spectator`, plus a **Character** switcher to select the currently controlled actor in focus mode. Every mode has an independent **View** selector. Spectator adds `Pause/Resume`, `Step` and playback pace. Show which character currently acts, who controls them, and the last action/event, while keeping hidden dice/secret facts off the normal screen.

Suggested mode examples:
- Party: "Have the ranger keep watch while the technician starts the generator" (individually scheduled actions).
- Focus: Control the technician; AI ranger decides when to cover, retreat or warn about sounds.
- Spectator: Two human researchers choose whether to investigate the paddock or reach the helipad without user directions.
- Switch during chase: If focused actor is injured, change to medic and take control at next safe action boundary; their skills and stress apply.
- Take over at any spectator moment by pausing and switching to Party or Character. No reset of death, supplies or dinosaur positions.

## Testing / acceptance

1. Build three distinct career-equipped playable actors and Evolved-compliant character sheets.
2. Confirm **identical encounter/dice/state resolution** given identical initial state and sequence of accepted intentions under any mode.
3. Verify mid-encounter PARTY → FOCUS → SPECTATOR → PARTY switching changes future decision ownership but not old event outcomes, initiative, time, actor memory, turn budgets or hidden creature state.
4. Verify AI cannot act for the human-owned character, submit stale proposals after mode switching, or provide secret information it has not perceived.
5. Verify spectator Pause/Step never advances RNG or time except for an expressly stepped event.
6. Verify injury, panic, death, actor separation, group assistance, individual movement and agendas remain per-character and survive autosave/reload.
7. Verify no lost/double turns or contradictory simultaneous actions; interruption and pending proposal cancellation are deterministic.
8. Preserve checkpoint 006.2 saves through explicit versioned migration; current game behavior is unchanged until validated integration.

## Development sequencing

This decision changes the implementation order: **multi-actor character and scheduler foundations should be designed alongside careers and dice resolution, before broad autonomous AI GM behavior.** Character creation, Evolved rolls and time scheduling must work for an actor identified by ID—not implicitly the singular `player`—before we add spectator/autopilot. Implement in increments: multi-character schema → modes/ownership/viewpoint → deterministic scheduler → AI companion decisions → fully autonomous spectator simulation → live model evaluations.

**Adaptation status:** Multiple controllable characters and spectator simulation are *original Dinosaur Horror game features*, not claims about built-in Evolved Edition rules. The underlying mechanical checks remain faithful to Evolved.

**Rights note:** No copyrighted Evolved source text/tables or private PDF is included in public GitHub. All narrative content, model contracts and implementation are original.
