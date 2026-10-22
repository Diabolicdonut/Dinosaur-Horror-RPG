# Dinosaur Horror RPG — Evolved Edition authority and natural-language action doctrine

**Accepted decision:** 2026-10-22. **Scope:** Dinosaur Horror RPG only.

## Updated implementation doctrine — faithful Evolved mechanical adaptation (latest decision, supersedes earlier probability redesign)

**Use the Evolved Edition's actual rules and dice procedures as the default mechanical specification.** Implement attributes, career-based character creation, twelve skills, career skill advancement caps, selectable talents, base/stress dice, multiple successes, pushes, Resolve and stress responses, panic, timed exploration, action economy, gear, injuries, healing, NPC behavior, stealth and combat as faithfully as applicable. When an Alien-specific mechanic has no literal Jurassic Park analogue, retain its *mechanical role and interactions* and adapt the fictional content, such as specific careers, gear, and dinosaur threats. Any deliberate numerical/procedural deviation is a separately reviewed, documented, tested house rule; do not silently normalize or simplify rules.

The computer **rolls the actual seeded dice internally**, recording original individual results and their effects for testing, playback and transparent optional debugging. Players are not asked to select actions/skills or roll manually. This deliberately supersedes the prior proposal to replace Evolved dice pools with a custom numeric probability function before parity has been established. Probability analytics can still derive the exact odds from the original dice mechanics, but it must not change the rules or random outcome distribution.

**Source-sensitive implementation:** The privately uploaded Evolved PDF stays in the user's Library. Reimplement numerical rules, game logic and thematic mappings in original code and original prose; do not transcribe or redistribute the copyrighted rulebook text, tables, artwork, or scenario material wholesale in the public repository. Keep exact mechanical interactions where possible and create original Jurassic Park-inspired careers, talents, dinosaur attacks, items and atmospheric prose.

**Character creation clarification:** Careers are not exclusive skill classes. Evolved Core Concepts p. 26 says there are 12 skills (0–5) and a character may attempt an untrained skill using the associated attribute; characters allocate 10 initial skill points, career skills can start up to 3 and noncareer skills up to 1, and their initial talent comes from career-specific options. Preserve these distinctions when adapting careers to the park setting. All checks remain fully internal and selected from player intent and described method.

**Roll resolution:** Preserve success-on-6, separate base and stress dice, extra successes/stunts, allowed skill-to-attribute switching, gear/help/difficulty modifiers, push timing and restrictions, persistent stress responses, Resolve, passive checks, opposed checks, action restrictions and the book's distinct panic response procedure. Do not substitute the current legacy checkpoint 006.2 panic formula or simply roll once for success/failure.

**Adoption order:** First achieve Evolved mechanical parity (with Jurassic Park-themed content) and regression tests; then expand natural-language GM translation onto the rules. The GM proposes skill/attribute, modifiers, goals and sequence; authoritative code performs checks and state changes. Invisible dice are an *interface* decision, not a replacement resolution system.

**Current release status:** Documentation and design authority only. The current browser/Worker remains a limited legacy prototype and is not yet a faithful Evolved adaptation.


## Authority precedence (new default)

1. Explicit, newer Dinosaur Horror project decisions and deliberately documented dinosaur-specific adaptations.
2. **Alien RPG — Evolved Edition (Free League; user-supplied private PDF)** as the **primary reference for unmodified tabletop mechanics**, terms, intended stress/panic/Resolve interactions, timing, skill checks, skill/attribute pairing, stealth, injury, and combat procedure.
3. The original 2019 *Alien RPG — Core Rulebook* solely for edition comparisons, historical notes, or mechanics explicitly retained by a Dinosaur Horror decision.
4. *Year Zero Mini* solely for supplementary context where no higher authority covers the question.
5. The present prototype's source code is authoritative **only for what the released browser build actually does**, not a claim of Evolved RAW accuracy.

No copyrighted PDFs, long rulebook passages, or scanned images are to be committed or redistributed. The source is privately available in the user's Library as `Alien RPG - Evolved Edition.pdf`. Book section/page references below use printed page numbers.

**Migration is not implementation:** The currently deployed `src/engine.mjs` implements a simplified Year Zero-inspired prototype and does not yet implement Evolved Edition rules accurately. Record every deliberate departure and test it against the reference before changing the simulation. Do not represent this policy change as a validated rules migration.

## What Evolved actually supports (source-grounded)

- **Core Concepts, pp. 25–26:** Four attributes: Strength, Agility, Wits, Empathy. Twelve trained skills (three normally tied to each attribute). Skills and attributes together model character capability. Resolve = round up (Wits + Empathy)/2. Starting Health = round up (Strength + Agility)/2.
- **Using Skills, p. 42:** Roleplaying begins with a conversation; the player describes what happens and the GM calls for checks only when dramatically warranted. Excessive checks are discouraged.
- **Using Skills, pp. 42–43:** Ordinary skills are rated separately from attributes, even when skill is zero; gear, assistance, modifiers, extra successes, failure and pushing modify the outcome.
- **Using Skills, p. 43, 'Switching Attributes':** A GM may use a different attribute with the same skill when the fictional method calls for it (e.g., Strength + Manipulation for an overt physical threat). Attribute/skill coupling is a default, not a hard-coded command list.
- **Using Skills, p. 44:** Some passive checks are secret and cannot be pushed or trigger stress responses. These should be carried out by the simulation rather than surfaced as unsolicited player choices.
- **Combat and stealth sections:** Specific procedures, action economy, positional/temporal restrictions and sensory boundaries still apply regardless of the text interface.

## Adopted interface doctrine: intention, not verbs or visible skill buttons

**Player declares a natural-language objective and method.** They never need to type a skill name, select `use`, `barricade`, `inspect`, or anticipate an engine command vocabulary. Example: "I slip under the desk, kill the lights, and hold the door shut."

The AI Game Master:
1. Parses actor, goal, physical method, targets, context, proposed sequence, and meaningful stakes.
2. Uses only the player-visible scene for narrative inference, but supplies a typed, constrained adjudication proposal containing selected attribute, relevant specialty/skill (if applicable), contextual difficulty and time cost.
3. Identifies whether the attempt is trivially achievable (automatic), physically impossible (explain constraints), uncertain with stakes (resolve probability), or compound (separate phases/timing transparently).
4. Requests clarification only when genuinely needed for meaningful alternatives, not because a phrase does not match a predefined command.
5. Never provides the result of RNG, invents hidden creatures, forges items or writes arbitrary world state.

The deterministic engine:
1. Checks the physical world, actor capabilities, known inventory, injuries, cover, available time and legal targets using authoritative hidden state.
2. Selects/validates the attribute and skill or expertise as a **rules adjudication**, not an authorization to award a high probability arbitrarily. Rejects impossible and contradictory proposals.
3. Applies the approved Evolved reference rules or explicitly documented Dinosaur Horror alternative to calculate outcome distributions, including stress/Resolve interactions and compound outcome probabilities.
4. Samples from seeded RNG, applies exact persistent effects, handles action economy and hidden dinosaur behavior, records plans/results, then exposes only player-perceivable consequences.
5. Allows natural-language narration **after** state has been committed, without rewriting the mechanics.

## Do we keep named actions, skills and attributes?

- **No predefined player-facing action catalog.** Fixed verbs are an optional accessibility/debug shortcut only; arbitrary plausible attempts must not depend on individual pre-written commands.
- **Yes to a small internal set of effect primitives** (time, movement, noise, damage, fatigue, resource transfer, object relocation, obstacle placement, position/cover, knowledge, NPC attitude, detection, etc.). Arbitrary objects cannot simply be declared into existence. Primitives describe mechanical consequences, not a finite menu of player actions.
- **Keep the four attributes** as foundational capability dimensions for this iteration.
- **Keep specialized training internally by default**, preferably the Evolved skill categories as reference, because attributing everything only to four broad scores removes the meaningful distinction between, for example, an engineer and a medic with identical Wits. The interface should not require a player to mention skills. Later Dinosaur Horror skills and character backgrounds can be tailored, provided differences from Evolved are explicitly recorded.
- **Attribute and skill are chosen from the method**, not just the verb. Physically threatening a person might emphasize Strength + Manipulation; calmly persuading them might emphasize Empathy + Manipulation. Different backgrounds/equipment/conditions can change feasibility and odds.
- **Don't check every sentence**: ordinary observation, conversation, plausible routine motion and already-determined outcomes need no dice-equivalent check, following Evolved's 'When To Roll' principle.
- **Do not eliminate timing or action economy**: the player can speak freely, but combat quick/full actions, exploration time, attention and consequences must still be enforced.
- **Actual internal dice resolution retained:** roll seeded base and stress dice, storing per-die results and applying Evolved procedures in order. The player need not see or operate them. Computational probability summaries are optional diagnostics, not a replacement rules engine.

## Example referee conversion (illustrative architecture; NOT implemented yet)

User: "I wedge the heavy rolling cabinet against the service door, turn off the lights, then hide behind it."

The GM should identify a compound plan of environmental manipulation, lighting and concealment. It should not silently reduce the sentence to the old single `barricade` command. The engine must verify the cabinet, available time, door/lighting controls, and predator proximity; adjudicate the stages with valid action costs; retain a failed barricade's physical cabinet; and only narrate credible dinosaur reactions. Different outcomes can change available follow-up actions.

**Important**: At checkpoint 006.2 the runtime still contains built-in actions and only four bounded AI-referee action kinds. This document is a *new accepted design/authority contract*, **not a declaration that full free-form execution is already implemented**.

## Migration order / gates

1. Keep checkpoint 006.2 game/save/Cloudflare stability intact and retain reproducible seeded **per-die** outcome logs.
2. Inventory Evolved mechanisms against `src/engine.mjs` and explicitly note differences, especially pushing, stress response/Resolve, passive rolls, skill categories, success margins, action costs, injuries and hidden detection.
3. Create an internal flexible action proposal representation (intent, method, targets, attribute, trained specialty, stakes, time cost and allowable **typed** effects); validate and resolve it without static player-facing verbs.
4. Implement and test Evolved-compatible career/skill/talent development, dice/stress/Resolve/panic, stunts, pushing, timed action economy and injuries, then validate different natural-language approaches, resource persistence, compound actions and hidden-world boundaries.
5. Only then replace the existing Worker/browser adjudication contract with an updated, backward-compatible typed protocol. Worker updates will require explicit manual Cloudflare deployment and a live smoke test.

**Boundary:** This document changes project authority and design direction. It does not implement a new game engine, endorse arbitrary AI world mutations, or supersede the need for formal tests.
