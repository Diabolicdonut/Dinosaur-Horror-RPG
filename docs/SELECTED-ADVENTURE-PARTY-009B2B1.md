# Checkpoint 009-B2b1 — Selected Adventure Party Vertical Slice

Authority: `project-state.json`, newest `audit.md`, Evolved Edition, the adventure-engine separation contract, and procedural replayability contract.

- Data schema: optional objective interaction with physical target, source Evolved skill or explicit routine null.
- Party launch: `newPartyIncident({adventureId:'ridge-survey',seed,roster})` (or default Nublar with no adventureId). The same public Party API dispatches based on validated save identity.
- Research storyline: five connected rooms, survey records Observation, field transmitter Comtech, and a normal no-roll walk-out at camp after both objectives. Every failed but legal roll spends one actual exploration action, changes actor stress where appropriate and cannot set success flags. It never directly forges completion from a prompt.
- Persistent physical objects: room floors, item pickup, same-room transfers and stock conservation.
- Local creature: a calm animal at its authored location may be observed. This is not simulated ecology or full-danger physical creature action.
- Actor modes: existing Party/Focus/Spectator public control and camera APIs; autonomous choice uses current adventure objective and navigation graph.
- Save: bound revision/fingerprint, known zones and item stock, flags, causal objective records, no remote inventory or hidden-fact display.
- Compatibility: original Nublar code, combat and scenes, previous valid saves, separate solo engine and Worker unchanged.
- Gates: 494 historical regressions plus 14 new, **508/508 candidate source checks**. PR, merged-main Actions/Pages and separate physical desktop/mobile browser smoke must be verified.
- Deferred: unify all scenario-specific directors; genuine herbivore physical behavior, survival combat/medical systems in both adventures, meaningful seeded story variations, open-ended Cinematic/Campaign creation, and a bounded full AI Game Mother.

Do not describe this milestone as full scenario independence or open-ended procedural adventures.
