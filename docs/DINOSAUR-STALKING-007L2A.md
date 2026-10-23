# Dinosaur Horror RPG — Checkpoint 007-L2a

## Physical stalking, directional awareness and stale clues

**Status:** playable bounded subcheckpoint of 007-L2; final acceptance requires CI on the accepted GitHub `main` and separately successful Pages deployment. **Primary rules reference:** privately supplied *Alien RPG — Evolved Edition*, exploration and stealth printed pp. 54–58, combat action economy, surprise and defenses pp. 59–67. Exact park-animal movement cadence, facing, sensory heuristics, cover and map constraints described below are **original Jurassic-specific adaptations**, not reproduced rules or copyrighted creature statistics.

### Implemented mechanics

The single existing Velociraptor now has a persisted **facing** (a physically adjacent authored park zone, its present room or null for unsimulated/legacy cases). Facing is established lazily from the creature's **actual present location on its first exploration tick**, not a fixed location which would invalidate earlier legitimate encounters and save files. An audible event can turn it along the **first traversable leg** of the route to the heard zone, not toward an impossible remote character position. An actively illuminated character is visible to this predator in its **same zone**, or across a *physically authored* one-zone line only when the creature faces that zone. Thick foliage and the secured utility/shed door still block sight, with the existing explicit breach flag respected. Sound propagation remains independent.

**Actual stalking decision:** `src/dinosaur-hunt.mjs` supplies a pure, replayable decision based on a creature's durable alertness and *last perceived clue*, never on an unobserved survivor location. Recent/strong interest (alert 4–6) produces **investigation**, a maximum one-exit move every two exploration actions. Weaker remaining interest (alert 1–3) produces **stalking**, a maximum one-exit move every four exploration actions. A paused stalk does not move, roll hidden dice or grant any action. Its orientation follows the next legitimate route step. Alertness decays through both active investigation and paused stalking; a lost, obstructed or stale trail is eventually abandoned. The existing ten-minute search is initiated at the **physical arrival zone** and consumes its previously accepted seeded check and time. New clues can still redirect the animal using existing 007-K interruption rules.

**Recorded outcomes:** Optional per-creature `lastHunt` stores the beat, origin, destination, phase and blocked status. Its saved move must be stationary or traverse exactly one authored exit, cannot claim movement while blocked, and cannot originate in the future. `isPartySave` rejects forged history and invalid facing; older version-3 saves with no `facing` or `lastHunt` remain valid. No save schema bump; the existing version-2 migration remains. A remembered flash of light is **not** treated as a currently visible target after a lamp has been switched off. Predator facing, memory and route decisions stay absent from survivor views and bounded AI proposals. Control-mode/camera changes do not turn the animal, spend dice, or change time.

### Mechanical scope and limitations

No new hit bonuses, attack tables, forced ambushes, free attacks or fabricated environmental damage were added. Actual attack/defense/interruption rolls, critical wounds, medical deadlines, action budgets, party control and spectator ownership retain their accepted Evolved-style resolutions. This pass changes *when and where the creature can investigate, approach, orient and sense visible lights*, not its existing combat damage.

The seven-zone model still has coarse directional **zone-facing**, not degree-based cones, ray tracing, moving crates/visibility barriers, weather/scent/wind, true cover destruction, or species-specific new pounce/territorial attack choices. These belong to **007-L2b**, to be validated before declaring all 007-L accepted. The visual and auditory heuristics are authored original house rules; do not describe them as Evolved RAW. No additional animal species were created; tranquil background herbivores remain ambient Wonder and Dread scenery, not simulated attacking enemies.

### Validation and compatibility

- Previously validated **307** deterministic tests remain.
- **17 new** 007-L2a tests exercise slow/fast hunt cadence, physically adjacent routes, closed-door blocking, hearing-directed facing versus light visibility, active engine stalking, finite loss of interest, tampered orientation/route saves, spectator mode, RNG preservation, legacy compatibility, per-character privacy, stale illumination, and JSON replay; **324 total** expected.
- Browser module revisions now use `007l2a`; the 007-L2a title and description are updated. Node + syntax GitHub Actions validation and Pages must be checked **at the final merged head**.
- No changes to original solo **006.2** or Cloudflare Worker **v006**. No published private reference PDF, artwork or secret material.
- Actual graphical desktop/mobile smoke across Party/Character/Spectator, saves in pursuit, lighting changes, medical reactions and Wonder and Dread is **outstanding** and must not be reported as performed.

**Next:** complete remaining 007-L2b (physically bounded environmental perception, approach/attack eligibility and tested creature consequences), then determine whether 007-L as a whole is acceptable before beginning 007-M batteries, resources and park repairs. Bounded natural-language 007-N remains later.
