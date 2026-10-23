# Dinosaur Horror RPG — Wonder and Dread

**Accepted creative direction:** October 23, 2026  
**Status:** Permanent narrative design requirement. First optional scenic discoveries have been implemented in the 007-K browser party incident. Other ecological and story systems described below are future requirements, not claims of implemented game mechanics.

## Creative premise

The park and the island are extraordinary **before** they are dangerous. Dinosaurs are animals with their own beauty, behaviors, ecological roles and needs—not just moving combat encounters. The game should preserve a sense of childhood-scale astonishment at impossible life, and let awe coexist with the responsibility, ethical complications, tension and genuine hazards that accompany such an environment.

**Four complementary emotions:**
1. **Wonder:** an encounter with something vast, beautiful, unexpected, ancient, or alive
2. **Curiosity:** the impulse to study, follow, remember, understand and protect it
3. **Unease:** realizing that humans cannot fully predict or control these animals and their environment
4. **Dread:** the eventual danger, loss, violence or hard moral choice if circumstances turn against the party

These are not four mandatory phases in every scene. Peaceful moments should be allowed to remain peaceful. A tranquil herbivore does not need to become an attacking monster to justify its existence.

## Design constraints

**The animals are animals.** Herbivores may graze, socialize, migrate, guard young, bask, drink, or ignore the visitors. Carnivores should not be depicted as malicious; hunting, curiosity, territorial behavior, stress and opportunism are more appropriate than arbitrary evil. Animals should remain grounded in a persistent, observable world, with a species-specific ecology rather than arbitrary scripted scares.

**Beauty has agency.** Let players voluntarily linger, observe, sketch, record field notes, identify calls, compare tracks, help an animal, or simply sit in a clearing. In a future nonviolent encounters system, the player can choose whether to approach, remain distant, retreat, or avoid interfering. Respect knowledge and viewing perspective; characters cannot know what they have not seen or been told.

**Do not attach a cheap reward to every moment.** A view can be meaningful without awarding experience, healing stress, or activating a secret achievement. If later mechanics recognize curiosity or field observation, those rewards must be deliberately specified and tested. Evolved Edition character rules remain the mechanical authority; beauty is not permission to invent new unapproved mechanical bonuses.

**Contrast, not constant panic.** Do not saturate every room and line of dialogue with imminent death. Make room for quiet, warm natural light, rain on leaves, far-off animals, clear water, fog lifting from valleys, giant browsing silhouettes and gentle interactions. Return to suspense as a consequence of credible changes to the environment, not a compulsory jump scare.

**No false omniscience.** Distant animal vistas and background sounds can be clearly labeled as authored ambient scenery, not actual combatants in the simulation. Named animals who can move, be injured, be approached or attacked must have durable identities, real positions, behaviors and visible causal histories. The narrator cannot conjure an animal, change its species or invent its actions without an authorized simulation event.

**Emotional range across the three modes.** Party, Focus and Spectator should all allow wonder. The player can discover and remember personal moments; computer companions should eventually have curiosity and species-specific interests, restrained by what they can perceive and by their mission. The spectator should be able to watch quiet discoveries and ecology, not merely a chain of danger checks.

## Rhythm and creative examples

- **First sight:** a distant browsing long-necked animal seen between swaying treetops; immense scale, no guaranteed encounter
- **Natural history:** displays and specimens that make the animal's life and evolutionary history feel comprehensible
- **Living ecology:** fern nurseries, mud tracks, insects and birdcalls, nesting sites, rain-soaked canopies and ecosystems continuing despite human disaster
- **Behavioral wonder:** peaceful herd communication, parental care, curiosity toward another species, a predator silently observing rather than instantly charging
- **Change in perspective:** a frightened survivor can still remember that an animal is magnificent; a child may notice something an exhausted adult overlooks
- **Horror from responsibility:** failures of fencing, medicine, logistics, conservation, and greed affect a living environment that deserves better than spectacle

Narrative voice: sensory and grounded, not relentlessly purple. Specify light, scale, sound, distance and animal action. Allow silence. Make tension earned. Prefer human vulnerability and respect over cartoon villain dinosaurs.

## Implemented exploratory slice — 007-K Wonder Pass

- Four optional, location-anchored discoveries in the existing seven-zone scenario: layered rainforest from the control room, fossils' extraordinary scale in the lobby, the living fern-and-orchid ecology of the jungle path, and a distant view of slow-moving long-necked herbivores from the helipad
- A clearly marked **Take in the view** choice during non-combat exploration. This is a *non-risk, zero-dice, zero-time narrative observation*; it does not modify the scenario's RNG, dinosaur position, resources, stress, mission objective, or combat clock
- Discoveries are personally recorded for the acting survivor in the existing party v3 save, and projected only to that survivor's own camera/journal. There is no implicit cross-character information sharing
- Distant herbivores are **ambient-only** (not simulated, moveable or attackable animals); that fact is preserved in scenario metadata. The only physical persistent dinosaur in this prototype remains the existing velociraptor
- Older party saves without the optional journal property remain valid; the separate solo 006.2 game and Cloudflare Worker remain unchanged

## Explicit future implementation gates

1. **Peaceful fauna simulation:** add a small variety of durable herbivores, with species-defined needs, family/herd behavior, habitat, rest, feeding and reactions to humans. Test that they can remain safe and nonhostile for a full session.
2. **Persistent field journal:** support sketches/photos, known species, observations and shared stories with optional character-to-character communication. Do not leak remote knowledge.
3. **Ecological cadence:** mix scenic vistas, tracks, songs, quiet encounters and dangerous sightings in an authored/director-driven pacing model, without forcing a fixed ratio or a terror beat after each peaceful scene.
4. **AI Game Master narrative contract:** explicitly require moments of beauty, respect for animal ecology, optional curiosity, and factual narration bound to established world events. Keep the deterministic rules engine authoritative. Worker deployment is separate from this documentation.
5. **Scenario authoring and coverage:** ensure a content audit checks that an adventure has a living ecosystem, nonthreatening moments and meaningful discoveries, as well as clear suspense/horror stakes.

## Acceptance criteria for future milestones

- A full playthrough can include a memorable peaceful dinosaur sighting that *stays peaceful*
- There are grounded, quiet player choices in exploration
- Character-specific wonder discoveries and known animal facts survive save/load
- Spectator AI can discover ecology without always escalating to combat
- No ambient-only species is mistaken for an interactable, persistent dinosaur
- Danger remains consequential and not visually, emotionally or narratively neutered
- The model narrator does not claim unseen creatures, change map state or invent mechanics

**Guiding question:** *Would someone still want to visit this island if they knew there were no combat encounters?* If the answer is no, the adaptation has lost essential Jurassic wonder.
