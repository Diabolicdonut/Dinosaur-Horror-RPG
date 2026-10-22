# Evolved Edition → Dinosaur Horror character-creation implementation matrix

**Source:** User-private *Alien RPG — Evolved Edition.pdf*, **Core Concepts pp. 25–27**, careers pp. 31–39, using the printed rulebook page numbers. Only source-supported, mechanically descriptive findings are included. The PDF remains private. **Implemented feature:** independent `src/characters.mjs` and `characters.html`; **NOT** yet part of the running incident.

| Evolved reference | Baseline mechanical contract | Current Character Lab 007 implementation | Remaining parity work |
| --- | --- | --- | --- |
| Core Concepts p. 25 | Four attributes; 14 starting points; normal 2–4 bounds, career key attribute up to 5 | Exact starting total and bounds validated for every career | Career- and age-specific exceptions must be audited |
| Core Concepts p. 26 | Twelve skills with level 0–5; initial 10 skill points | All 12 categories and starting budget validated | Full advancement and runtime trained skill effects |
| Core Concepts p. 26 | Career skills can start up to 3, other skills up to 1; zero-rank checks allowed | Exactly validated; career key skills encoded | Skill action execution in live incident |
| Core Concepts p. 26 | Choose one starting talent from three career options | One of three *original park-themed* career talent choices recorded, enforced valid | Evolved-equivalent talent mechanics, trigger restrictions and exceptions **NOT IMPLEMENTED** |
| Core Concepts p. 26 | Resolve from Wits/Empathy average, rounded up | Exact derived value stored and validated | Actual stress-response / panic mechanic **NOT IMPLEMENTED** in Lab |
| Core Concepts p. 26 | Max starting Health from Strength/Agility average rounded up | Exact derived value stored and validated | Talent adjustments, injury and recovery mechanics |
| Careers pp. 31–39 | Nine careers, each with key attribute and three emphasized skills | Nine original park-role counterparts with matching key attribute + skill triplet | Themed gear effects, full career advancement, talent source equivalence |
| Careers pp. 31–39 | Character selects/receives starting equipment | Two distinct items from six original thematic career equipment choices | Book's exact gear quantity/money rules, supply ratings, equipment mechanics and exceptions |
| Core Concepts pp. 25–27 | Identity, backstory, personal agenda, allies/rivals | Original seeded names and per-career agendas; free-form editing | Relationship editor, appearance, signature items, age, career histories |
| Life-path optional method pp. 282+ | Alternate randomized background and term progression | **Not implemented**; current random generation uses a deterministic *custom constrained point allocator* legal under the normal starting budgets | If adopted, implement optional lifepath **as its own audited procedure**, not a mislabeled shortcut |
| General skill rules pp. 42–44 | Base and stress d6, pushes, attribute switching, outcomes | No current incident gameplay integration; existing 006.2 remains simplified legacy prototype | Full Evolved mechanical port, hidden seeded rolls, time/initiative/stress/Resolve |

## Implementation-specific choices

- **Direct numerical fidelity:** Attribute/skill budgets, caps, legal career triplets and basic derived traits follow the private book reference.
- **Original story content:** Park careers, starting equipment names, personal objectives and talent *names* are newly written. Their effects are not implemented or represented as Evolved RAW; they are placeholders for future mechanical adaptations.
- **Generator algorithm:** Uniform seeded pseudorandom character identity/career selection with weighted legal attribute and skill allocation favoring career specialties. This **does not claim to implement Evolved's optional dice-rolled attribute generation** or its optional life-path tables. It generates a rules-valid standard-allocation character.
- **Manual/hybrid:** Custom edits may temporarily be invalid until corrected. Regeneration preserves explicitly locked field choices and refuses to exceed budgets. It may refuse impossible combinations rather than silently rewriting them.
- **Equipment quantity:** Exactly two distinct items is the current Character Lab's *original park equipment setup rule*, not a claim about every source career exception.
- **Generation isolation:** Character generator seed and revision are stored per actor and do not consume the live incident PRNG. The lab uses a separate localStorage key and exports standalone JSON roster drafts.
- **No cross-mode actions yet:** The character roster is not connected to character focus, AI companion autonomy, spectator mode, live injury/status or the current session save format. These are subsequent planned milestones.

## Audit checklist / next gate

1. Finish exact Evolved mechanics inventory for talents, gears, supplies and character creation exceptions before declaring full parity.
2. Define Evolved talent mechanics in original code; add activation and exception tests for all nine candidate park careers.
3. Implement actor-ID-based skill checks with distinct seeded stress dice, pushes, Resolve and linked mechanical consequences.
4. Migrate legacy one-character saves safely to roster-capable scenarios.
5. Connect selected validated roster and party controls only after action scheduling exists. Do not pass draft characters into existing `state.player` silently.

**Code release note:** Character Lab 007 is an independently usable creation/test/export preview, not a playable multiplayer/party campaign and not a completed Evolved rules port.
