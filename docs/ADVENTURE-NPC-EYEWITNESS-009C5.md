# 009-C5 — NPC Eyewitness Evidence and Local Warnings

**Source candidate:** October 27, 2026. Based on accepted **009-C4**, version **0.7.36**, 642 regression tests; latest accepted source main `72955ab3bae3c3a140ccbadc4c253a2331cd6a24`.

## Source-backed knowledge, not omniscient story dialogue

`src/adventure-supporting-cast.mjs` supports a new optional *revision 13 or later* topic condition:

```json
"requires": {"kind":"npc_sighting", "id":"jules-marsh"}
```

The author must reference the **same named NPC** who has a validated source-authored `dangerResponse`, not another person or an invented actor. Validating the compiled scenario rejects unsupported triggers, fake properties, contradictory identities and premature use on old revisions.

A topic gated this way is offered **only** if the authoritative, independently replay-validated NPC danger journal contains the exact person's genuinely passed `human_sees_first` passive Evolved observation and resulting `withdraw` action **at or before the conversation beat**. Mere proximity to a predator, a scenario seed that might produce a predator, a speculative NPC motive or an unrelated survivor's observation does not unlock the words. The NPC also has to be in the **same physically real room** as the speaking survivor, outside combat; prior one-time conversations cannot be duplicated. Historical dialogue's prerequisites are checked against their own recorded beat rather than against future knowledge.

## Original demonstration, revision 13

In *The Long Count* Jules Marsh at River Crossing already has a real bounded passive observation versus the existing seed-conditional patrolling predator. If Jules genuinely sees the predator first, the NPC withdraws along the legal edge to Canvas Research Camp and can now explain the specific **observed** event in conversation. Jules does **not** claim to know the animal's current location after leaving, initiate a mandatory pursuit, trigger surprise damage, spend unearned Evolved dice, or relay knowledge remotely through the player UI. A failed or simultaneous detection never unlocks the eyewitness topic. A genuinely quiet seeded playthrough remains unthreatened.

**Compatibility:** `adventures/ridge-survey-rev12.mjs` freezes the previously accepted scenario exactly. Historical research rev1–12 and Nublar saves preserve original rule and content fingerprints, NPC positions, dialogue options and no new fields. Rev13 alone opts into an extra bounded original dialogue prerequisite; game engine architecture stays replaceable and scenario-independent.

## Explicit limitations and next gate

This is **earned NPC information transfer**, not full AI human NPC decision-making, cinematic NPC social rolls, automatic combat defense, injuries, personal inventory, progression, target memory, or threat tactics. The supporting cast's browser source content remains inspectable; game-master confidentiality requires a trusted server. Manual graphical desktop/mobile smoke is still outstanding. The approved full 18-gate roadmap remains **38/100 earned**: `human-npc-agency` remains `partial`.

**Candidate verification:** Eight new tests extend 642 accepted baseline to 650 targeted, including physical locality, genuinely earned eyewitness warning, honest quiet and unnoticed outcomes, authored trigger rejection, replay validation and immutable rev12 history. Verify exact PR head and independent merged-main Actions and Pages before accepting.
