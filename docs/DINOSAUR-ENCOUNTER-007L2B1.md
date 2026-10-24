# Checkpoint 007-L2b1 — Velociraptor Encounter Tactics and Concealment

**Date:** 2026-10-24. **Authority:** privately supplied *Alien RPG Evolved Edition* stealth, action/initiative, opposed defense and injuries (printed pp. 54–73). **Original Jurassic adaptation:** the animal's approach-pounce condition and +1 attack die are original game parameters; they are not represented as licensed Alien creature attack tables.

## Scope and goal

The goal is **credible encounters in an Alien Evolved cinematic adventure**, not simulated predator hunting ecology. This checkpoint integrates one distinct animal-specific attack option and repairs a lighting/concealment inconsistency. The existing physical Velociraptor, Evolved attack dice, separate human Quick/Full action budgets, declared target/pre-roll Close Combat defense, surprise, armor, critical injuries and seeded saves remain authoritative.

## Mechanics implemented

**Bite (existing)** is the normal same-zone Velociraptor attack using its established 6 attack dice and 2 base damage; it consumes one existing dinosaur initiative slot with no free extra strike.

**Approach pounce (new Jurassic house rule)** uses 7 attack dice and the same 2 base damage. It is eligible only when the Velociraptor has an accepted, adjacent, non-blocked actual approach from the 007-L2a stalk/investigate state into the eventual victim's current zone, and this is its *first attack* in combat round one after that approach. The authored map and current reinforced-door breach state must permit the relevant traversal. It never carries into subsequent strikes or a later combat round, never permits a ranged attack, and never makes an unseen creature automatically attack. Standard Evolved surprise remains an *independent* +2 attack dice on the first applicable surprise strike, and eligible defenders still get their ordinary pre-roll defensive options.

**Concealment and active light:** An actor taking cover with a powered flashlight on in the same zone as an active predator cannot claim to be invisible; a valid hidden/light-on legacy v3 combatant can still be attacked. Turning a lamp on beside the raptor exposes the named local cover. Attempting a new hide under these circumstances rejects *before* spending Mobility dice/time. If the light is switched off, an actually hidden actor remains concealed until legitimate discovery/search. The predator never learns remote positions from these rules.

**Replay and knowledge:** Both attack plans are computed from accepted current game state and lastHunt records, without new PRNG draws; actual target selection and hit/defend resolution use the existing seeded engine. A committed `predator_attack` event now includes `tactic: 'bite'|'pounce'` and the actual attack dice. The Attack Declaration informs the named defender of pounce/lunge before deciding DEFEND or ALLOW; the camera and other characters do not receive hidden hunting records. No game/save schema version bump, network request, global population simulator, weather model or additional dinosaur is introduced.

**Limitations:** The broader 007-L2b environmental-obstruction and changing-conditions slice remains unfinished. This is a **007-L2b1** subcheckpoint, not final completion of 007-L. Species diversification, environment/scene event director, 007-M finite gear and 007-N conversational GM also remain separate planned work. The current animal has ordinary bite and one attack-opening pounce; it does not simulate pack tactics, scent-tracking or a full bestiary.

## Acceptance tests

Retain the existing **333** tests and add **13** focused tests under `tests/dinosaur-encounter-007l2b1.test.mjs`, aiming for **346**. Coverage includes valid/blocked/nonadjacent approaches, door breach, already-used openings, no damage inflation, first-round attack order, surprise and defender decisions, lit vs unlit concealment, invalid hide with no time/RNG, old v3 hidden saves, camera/control privacy, and browser import revisions.

Report candidate and final-main CI, GitHub Pages deployment, and hands-on graphical browser smoke **separately**. Real desktop/mobile manual gameplay smoke is outstanding until physically performed. No changes to private books, original standalone solo 006.2, Cloudflare Worker v006 or accepted scenic Wonder journals.
