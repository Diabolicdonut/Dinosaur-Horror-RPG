# DHR-014 / Issue #110 — Injured dinosaur source/retreat primitive

**Scope:** isolated pure helper `src/dinosaur-injury.mjs` and targeted `tests/dinosaur-injury-dhr014.test.mjs`. This is a proposed, **unaccepted** partial dependency of roadmap gates 8 and 16, *not* a released offensive-combat action. Preserve the original 009-D2 / v0.7.39 checkpoint, all historical scenario fingerprints/save formats, and the accepted 38/100 score.

## Authority

- Private *Alien RPG — Evolved Edition*, combat/injury/creature-action sections pp. 59–71, plus existing project source authority `docs/EVOLVED-RULES-AUTHORITY.md`. The original alien-specific critical tables and signature attacks are **not** dinosaur physiology.
- Adopted original species profile: `DINO_SPECIES.velociraptor` in `src/evolved-encounters.mjs`, health **6**, armor **1**, speed **2**. No new animal stat values.
- Existing original source gear `SOURCE_MELEE_PROFILES` in `src/melee-attack.mjs`, actual carried-item identity from DHR-007, Evolved `resolveSkillCheck`, and numbered combat cards from the accepted adventure scheduler.
- Newly defined **Jurassic animal behavior policy**, *not a rulebook animal critical table*: only positive unabsorbed damage triggers a deterministic source-disposition reaction. An injured neutral animal seeks an exit; a wary, defensive or predatory animal may withdraw depending on an independent seeded d6. A blocked or occupied exit cannot become an escape. No forced chase or obligatory second attack. Injury at zero Health results in incapacitation, **not automatic narrated death**, and does not roll a human D66 injury.

## Trust boundary and API

`resolveDinosaurInjury({compiled,state,attack,sourceWeaponTypes,contact,blockedEdges})` takes a fully validated source compiled adventure, the **engine-owned candidate pre-hit world**, a minimal attack declaration (`actorId,creatureId,weaponId,seed`, optional `push`), an **independently trusted** item-to-source-melee-category mapping, authenticated Adjacent contact certificate, and complete physical blocked-edge roster derived from the room/barrier engine. No action/model/save field may invent attack damage, critical wound, health, bonus, weak point, disposition or special species rules. The map's directed room exits, occupied destinations and actual creature presence are rechecked. These source-owned inputs **must not** be taken directly from AI or player assertions; a compiled fingerprint or syntactically valid contact certificate alone is not a cryptographic proof that the caller used the trusted catalog.

Only a human who holds the current Evolved initiative card with a remaining full action, a valid character sheet, and the physical item can strike a colocated animal. Real seeded Close Combat checks determine success, real source weapon damage is armor-adjusted, and no arbitrary damage number is accepted. Unsupported grazer physiology, already-injured/defeated or forged state, missing contacts, wrong cards, remote targets, unearned ammunition, out-of-source tools, and unsupported attacking conditions fail closed.

The return includes copied `creatureAfter` / `attackerAfter`, full Evolved dice journal and `combatAfter` attack budget, and `reaction`. In the attacker's turn, `withdrawal` is **only** a proposal, never a teleport or already spent creature move. `resolveDinosaurWithdrawal(input,turnCombat)` replays the seeded proof and requires a **later valid creature initiative card in the same round**, the original attack history prefix, plus the still-open mapped exit. It returns a separately proposed physical one-turn location transition. The caller must commit it atomically and guard against reused turns. Neither API mutates inputs, calls a model, consumes inventory, advances the clock or writes the save.

## Intentional limits and integration dependencies

This issue is **not** DHR-016 live offensive combat. The accepted v3 save and creature continuity checks intentionally do not support persisted accumulated animal Health: a first contact may generate `creatureAfter`, but the live runtime cannot currently save/continue that value. Multi-hit injury ledgers, exact round rollover and depleted-card replay, real firearm damage/LOS/cover/finite ammo, AI Game Mother narration after commit, and consistent engine-owned blocked-door truth require the DHR-015/016 atomic action and save-validation integration. We reject unsupported states instead of guessing.

Creature movement only authorizes an already available later card in the **same combat round**; if the animal has no remaining card, its intention must be saved and re-authorized by the future combat coordinator, never moved for free. This isolated module cannot authenticate a maliciously substituted source compiled manifest, barrier roster, or combat state: the future runtime must bind them from the trusted catalog, physics and scheduler.

There is no additional animal species profile, population simulator, mandatory encounter, encounter spawning, injury table reproduction, UI control, scenario revision, save migration, Cloudflare deployment, or status acceptance in this issue.

## Validation

`node --check src/dinosaur-injury.mjs`, `node --test tests/dinosaur-injury-dhr014.test.mjs`, `npm test`, and PR-head GitHub CI. Cases include accepted/absorbed hits, nonlethal retreat, incapacitation, unavailable turn, sealed/occupied exit, forgery, stress/seed replay, immutable snapshots, historical v3 and all control modes. Manual browser, mobile, Pages and Cloudflare gameplay smoke remain **pending** because nothing is wired into UI or runtime yet.
