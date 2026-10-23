# Dinosaur Horror RPG — Wonder and Dread

**Accepted creative direction:** October 23, 2026  
**Status:** Permanent narrative design requirement. First optional scenic discoveries have been implemented in the 007-K browser party incident. Other ecological and story systems described below are future requirements, not claims of implemented game mechanics.

## Creative premise — Alien RPG's existing Sense of Wonder

Alien RPG already names **Space Horror, Sci-Fi Action and Sense of Wonder** as major themes. Dinosaur Horror RPG directly maps them to **Dinosaur Horror, Sci-Fi Action and Sense of Wonder**; this is not an invented fourth design pillar or a separate ecology game.

The park can be magnificent before, during and after danger. A gentle Brachiosaurus or distant Parasaurolophus can produce unforced awe; a Triceratops or Stegosaurus can be peaceful, wary or extremely dangerous when startled, cornered or confronted with a predator. Herbivores are not necessarily safe, predators are not necessarily always hunting people, and GM-created complications must have credible local circumstances.

**What wonder requires:** Believable scenes and choices, authentic animal reactions when interacted with, quiet character moments, contrast with terror, and meaningful discoveries. **What it does not require:** simulated island populations, feeding schedules, mating, herd migrations or ongoing animal-needs AI. Those are optional enhancements only if independently justified.

A campaign can remain about rescuing stranded people and leaving Nublar/Sorna, while individual scenes alternate calm, action, beauty, danger, injury and recovery without following a fixed fear escalation curve. The deterministic Evolved rules resolve outcomes; the Game Mother presents opportunities through scene/events and encounter procedure, not a compulsory 24/7 wildlife simulation. See [Cinematic and Campaign Scenes](CINEMATIC-SCENE-CONTRACT.md).

## Design constraints

**Animal encounters are credible, not zoologically exhaustive.** A herbivore may graze, guard young, ignore a visitor or charge when startled; a carnivore may hunt, investigate, flee or ignore the party. The GM can provide these behaviors through an encounter without running a permanent herd simulation. During an active physical encounter, preserve causal position, perception and Evolved effects; other cinematic vistas may remain ambient descriptions.

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

## Practical future development goals (scene-led)

1. **Peaceful and defensive animal encounters:** Add scenario-ready herbivores with original, tested Evolved-adapted reactions to distance, disturbance, threat or predator appearance. Their behavior should be coherent within the scene, but no global herd AI is required.
2. **Campaign framing:** Preserve optional scenic observations and character-specific records. Include quiet scenes, human conversation, science and awe between tension and action in connected scenarios.
3. **Encounter direction:** Give the Game Mother conditional events and source-grounded encounter/danger procedures. Scenes may begin quietly and escalate for understandable reasons—or remain quiet.
4. **Narrative restraint:** Do not force every dinosaur to attack, and do not treat every herbivore as cuddly. The director cannot narrate mechanically consequential facts that the deterministic engine has not committed.
5. **Scenario coverage:** A short cinematic adventure should demonstrably exercise Dinosaur Horror, Sci-Fi Action and Sense of Wonder, with meaningful player choices and compatible saves. See [Scene Contract](CINEMATIC-SCENE-CONTRACT.md).

## Acceptance criteria for future milestones

- A full playthrough can include a memorable peaceful dinosaur sighting that *stays peaceful*
- There are grounded, quiet player choices in exploration
- Character-specific wonder discoveries and known animal facts survive save/load
- Spectator AI can take part in quiet or wondrous scenes without constantly escalating to combat
- Ambient-only scene wildlife is never misrepresented as a physical interactable creature
- Danger remains consequential and not visually, emotionally or narratively neutered
- The model narrator does not claim unseen creatures, change map state or invent mechanics

**Guiding question:** *Does this feel like Alien Evolved transported into Jurassic Park, with a credible balance of danger, action, character drama and magnificent encounters?* If not, improve the scenes, not the complexity of the wildlife simulator.
