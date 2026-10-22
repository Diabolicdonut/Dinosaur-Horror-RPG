# Mixed manual, automatic and hybrid character generation — design contract

**Accepted:** 2026-10-22. **Project:** Dinosaur Horror RPG only.
**Status:** Approved architecture; character creator, NPC generator and roster UI are NOT implemented in released browser checkpoint 006.2.

## Player requirements

A player must be able to **auto-generate, manually create or partially customize any subset of playable characters**, without requiring the same method for the whole party. The same roster can contain hand-crafted, auto-generated and hybrid-edited characters. Creation method is **independent** of control mode (Party / Focus / Spectator), which can be changed during the adventure.

Offer per character:
- **Create Manually**: choose a proposed park career, identity, attributes, every skill allocation, career talent, eligible equipment, relevant history, agenda and relationships; validate all mechanics.
- **Generate Random**: choose a career randomly or fix it first; generate a complete **rules-legal** character, including talent, starting gear, identity, personality and plausible park background.
- **Generate with Preferences / Hybrid**: choose or lock some values; let computer complete remaining attributes, skill budget, talent, appearance, background and interpersonal traits. Allow selectively re-rolling only unlocked pieces.
- **Character Preview**: show complete stats, profession, skill specialties, starting talent and equipment, brief biography, connections, and validation feedback before finalizing.
- **Edit / Duplicate / Reroll** during setup, with explicit discard/confirmation for overwriting custom edits; support "generate the rest" and "generate entire party" without silently rewriting locked/accepted characters.

Examples:
- One entirely custom Paleontologist plus automatically generated Park Ranger, Medic and Maintenance Technician.
- An entirely computer-created group viewed in Spectator Mode.
- Five hand-crafted characters controlled by AI except the one the human currently selects in Focus Mode.
- Generate a named character's attributes and skills but manually choose their starting talent, equipment and backstory.

## Mechanics are governed by Alien RPG Evolved Edition

The uploaded private *Alien RPG — Evolved Edition*, not an invented probability algorithm, is primary mechanical authority. Current reference: **Core Concepts pp. 25–27; Skills & Talents pp. 42–51**.

Starting validation baseline from Evolved (verify exceptions by career during implementation):
- Four attributes: **Strength, Agility, Wits, Empathy**, total **14 points** under standard creation, generally minimum 2 and maximum 4, with the career's key attribute eligible for 5.
- **Twelve core skills** rated 0–5 and **10 initial skill points** to distribute. At creation, career skills can start at 3 and noncareer skills at 1 (unless an explicitly documented exception applies). Characters can attempt skills with zero ranks.
- **Starting talent:** pick one valid option associated with that character's career, obeying its mechanical prerequisites and activation restrictions.
- **Resolve:** round up (Wits + Empathy) / 2; **starting maximum Health:** round up (Strength + Agility) / 2, with applicable talent modifiers.
- Starting careers can also define gear and suitable backgrounds/character relations. Customize **narrative content** to Jurassic Park; preserve mathematical interaction of skill/talent/gear and other mechanics unless a documented Dinosaur Horror adaptation approves a change.
- Distinguish **standard allocation** from the Evolved book's optional randomized character creation/lifepath methods. A computer-generated legal character may use seeded constrained allocation by default, but **never claim it followed an optional book procedure unless implemented faithfully**.

Manual, random and hybrid creation must all flow through **the same validator**. A generated character is never allowed to violate skill caps, duplicate unique equipment without permission, gain extra talents, exceed attribute budgets or acquire impossible biography-based bonuses. Career restrictions affect training, not permission to attempt actions.

## Original Jurassic Park content

Data-driven themed careers may include Park Ranger / Security Officer, Tactical Response Specialist, Maintenance Technician, Operations Supervisor, Field Medic / Veterinary Technician, Paleontologist / Geneticist, Pilot, InGen Corporate Representative, and Young Visitor. These are candidate thematic counterparts—not confirmation that career balance or exact talents are already complete.

Keep professions distinguishable through legal skill allocation, talent selection, starting equipment, training and *soft* behavioral traits. The GM may invent original names, goals, interpersonal tensions and personal histories that fit the established park setting, but cannot invent mechanically powerful talents or bypass eligibility. Avoid verbatim reproduction of copyright-protected prose, career tables, talents, character entries or art from the private PDF.

## Relationship to the three control modes

| Creation source | PARTY | FOCUS | SPECTATOR |
| --- | --- | --- | --- |
| Manually created character | Controlled by human | Human if currently selected, AI otherwise | AI-controlled |
| Automatically generated character | Controlled by human | Human if currently selected, AI otherwise | AI-controlled |
| Hybrid-generated character | Controlled by human | Human if currently selected, AI otherwise | AI-controlled |

Control switching NEVER regenerates identity, skills, talents, inventory, injuries, stress, memory, agenda, or prior action choices. Creation provenance may be recorded (manual/random/hybrid) for reproducibility, but never governs competence or AI knowledge after creation.

In focused/spectator mode the character's personality and goals inform **AI decisions**, but never alter authoritative mechanical chances without actual rules effects. The AI cannot infer hidden dinosaur locations from player-facing narration or act on another character's undisclosed knowledge.

## Scope, timelines and regeneration boundaries

- **Before incident start:** Full customization and regeneration of any chosen character, including individual attributes, with validation.
- **During incident:** Player may freely change control/viewpoint, not retcon character creation. Skill improvements, injuries, added talents, gear changes and personal development must occur through validated story/advancement mechanics.
- **New party member encountered or recruited:** Create them through an appropriate engine-controlled or player-approved process using their observed role and world constraints. Their prior knowledge and possessions are grounded in the scenario, not retroactively invented by a model.
- **Ordinary NPCs:** Computer may instantiate them from scenario-grounded templates / rules-valid character generation when needed; playable recruiting and subsequent manual control require explicit eligibility.
- **Existing PC death/incapacitation:** Remain in persistent world/history; no silent regeneration or substitution. User may switch to another eligible survivor.
- **Party size:** Should be scenario-configurable and bounded by performance/action scheduling rather than assumed infinite.
- **Distinct RNG:** Use an explicit reproducible **character-generation seed or stream**. Re-rolling a background/skill allocation before play must not advance the active incident simulation RNG. Persist generation configuration, character record, seed, locks and rule-version for debugging.
- **AI generation:** LLMs can suggest original personality/biography/relationships; the deterministic engine chooses/validates rules-specific stats and talents. Invalid or unavailable AI generation should fall back to a tested local legal generator.
- **Privacy and secrets:** Character data remains in the save, not server logs by default. Generation should not leak hidden future encounters or scenario secrets.

## Character creation user experience

1. Choose party size and optionally a broad **group concept** (e.g., research team, security detail, stranded visitors, mixed personnel).
2. For each slot choose `Manual`, `Auto`, or `Hybrid`; independently choose or lock a career and any desired fields.
3. Click `Generate All Unfilled` to complete only unfilled/unlocked characters; inspect each sheet and validation.
4. Optionally reroll a single actor or part without affecting the rest, choose which character to focus on initially, and choose starting control mode.
5. Confirm roster and start incident. All chosen actors, personal goals and relationships persist across all three control modes.

## Tests / acceptance criteria

1. Standard Evolved career/attribute/skill/talent/Health/Resolve limits hold for **manual, generated and hybrid** characters, including exceptions.
2. Generate all, selected, remainder-only, seed-replay and per-field locking never modify accepted locked characters or consume gameplay RNG.
3. Separate characters have separate stats, inventory, stress, injury, goals, knowledge and careers; no shared singleton player.
4. A party of mixed generation provenance plays identically across Party/Focus/Spectator modes when the same accepted actions and dice seed occur.
5. Manual character edits during setup must be validated; after incident start there is no unearned stat reroll/retcon.
6. Control mode/actor viewpoint changes do not alter sheets or generate skills, gear, secrets or memories.
7. AI biography generation cannot grant extra skill points, talents, equipment or world knowledge; fallback generation works without network.
8. Character creator retains saves, source version and tested migration from checkpoint 006.2 once implemented.

## Integration sequencing

Add character creation after the Evolved career/skill/talent data model and validator are in place, *before* AI companion/spectator autonomy. Initial user-visible deliverable is **manual + seeded automatic + hybrid character creation with a party roster**. Then implement generation for introduced/recruited NPCs using the same validated underlying character schema.

**No deployed functionality is implied.** This is an accepted design contract, not the playable creator or a revision to Cloudflare code.
