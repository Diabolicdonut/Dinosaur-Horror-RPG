# Checkpoint 007-L1 — Authored Visibility, Physical Cover and Velociraptor Senses

**Release scope:** first bounded playable subcheckpoint of 007-L. **Primary rulebook authority:** the user-private *Alien RPG — Evolved Edition* (stealth, hiding and exploration printed pp. 54–58; combat and action economy pp. 59–67). All spatial links, predator sensory ranges, animal labels and cover affordances below are original Jurassic survival-horror adaptations, not published Evolved creature statistics or copied rules.

## Engine and original authored spatial contract

- `src/dinosaur-visibility.mjs` describes **directional one-exit sightlines** for the seven existing park zones. Sight and physical travel are separate: dense canopy blocks an otherwise traversable jungle/paddock sightline, and the reinforced utility/shed door blocks both creature passage and vision until the existing explicit `shedBarrierBreached` world flag is set. A shed/jungle doorway remains visible at short range to preserve accepted 007-K behavior. Invalid or remote zones cannot become visible by simply possessing a flashlight.
- Individual personal lamps still use checkpoint 007-K's independent on/off and ten-minute battery consumption. `visibleLampZone` consults authored visual geometry, not all passable creature exits, and refuses sight through blocked or remote routes. Sound still uses physically connected paths and attenuation, so hearing is not falsely equivalent to seeing.
- Existing authored physical affordances with `cover` uses now resolve `hide behind rolling cabinet`, `hide behind fallen log`, etc. against the survivor's **actual local zone**; missing or invalid objects reject before consuming RNG or time. The survivor's actual seeded Mobility roll determines concealment and writes an optional `coverId`. Leaving the zone clears fixed cover; successful sneaking can acquire *new* physical cover in the destination instead of teleporting a cabinet. A carried light can still broadcast its user's position. Legacy v3 saves without cover data remain valid.
- A survivor with their **own switched-on flashlight** may glimpse a non-colocated creature across a legal authored sightline. The personal projection exposes only its kind, not its precise distant zone, last clue, search coordinates or dice. The local dinosaur attack target list remains unchanged; a distant sighting does not invent ranged melee access.
- Offline companion proposals use the same bounded per-actor projection. They may seek known local cover when they themselves see a distant predator; separated AI companions receive no private dinosaur state or other survivor's observations.

## Sensory and behavior framework

An extensible, keyed `CREATURE_SENSORY_PROFILES` registry begins with the **Velociraptor** only: Observation 5, hearing bonus 0, one-zone visual limits and a one-ten-minute-stretch active search. Profiles identify deterministic `patrol`, `investigate`, `stalk`, `search`, and `engage` states, which persist on the creature. Hearing, searching, clue decay and park movement use these profile values while keeping the checkpoint 007-K sound graph, legal room-by-room routes, search history and full seeded checks.

**Important limit:** `stalk` is currently a persisted awareness state, not a separate stalking-speed/action or attack-tree implementation. Species-specific signature attacks, scent/wind, facing cones, cover destruction, medical-critical interactions caused by new hazards and new creature species are **not** claimed complete. These remain 007-L2 work. Existing combat initiative, defense choice, injury procedures and attacks are intentionally unchanged.

## Validation, authority and isolation

- All **290** previously accepted tests retained, including the parallel Wonder and Dread expansion and its personally owned discoveries; **17 new deterministic spatial tests** added (**307 total expected**).
- New tests: true and false sightlines, door breach, ecology occlusion, physical cover validity and RNG rejection, seeded successful/failed hiding, mobility clearing fixed cover, legacy saves and forbidden forged cover, own-light nearby sighting, camera and AI information boundaries, species refusal of unimplemented creatures, explicit behavior stages, legal sound routes, spectator/control preservation and JSON replay.
- Party save kind remains `dinosaur-party-incident`, **version 3**, with optional `coverId` and `behavior` only. Source honors existing older v3 and v2→v3 migration. Checkpoint 006.2 solo engine and Cloudflare Worker v006 remain untouched. No secrets, proprietary Alien PDFs or copyrighted rules tables have been committed.
- Full Node, syntax, GitHub Actions and Pages results must be checked at the **final accepted main head**. Actual graphical desktop/mobile browser smoke is **outstanding**, not passed.

## Next independently validated steps

**007-L2:** introduce true stalking decisions, one-zone sight cones/occluding dynamic barriers, weather and grounded chase/pounce tradeoffs, using seeded Evolved checks and nonleaking character views. Complete 007-L before proceeding to separately tested **007-M**, including finite physical batteries and tool-mediated park hazards. Natural-language **007-N** remains gated on deterministic survival mechanics and a validated effect schema.
