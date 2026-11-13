# DHR-077 / UI-05 — isolated portrait and Evolved vitals component

**Status:** PR handoff only, not integrated or accepted. **Owner:** UI-05 worker. No changes to party.html, src/party-app.mjs, src/party.css, persisted save schemas, dice/health rules or roadmap completion.

## Integration contract for the Party UI owner

Import mountPortraitVitals from src/portrait-vitals.mjs and load src/portrait-vitals.css once. Insert a dedicated container in the gameplay presentation region. On every committed turn, observer/camera change or projection update, call update({characters,observerId,activeActorId,reducedMotion}); call destroy() when leaving gameplay. The function does not mutate game state or select a camera/control actor.

characters is an array of **1–8 sanitized, observer-authorized presentation cards**, one for each known playable survivor, e.g.:

~~~js
[
  { id:'pc-1', name:'Mara', observation:'self', health:3, healthMax:4,
    stress:6, dead:false, broken:false, portraitUrl:'/assets/mara.webp',
    sheet:{career:'ranger', attributes:{strength:3,agility:4,wits:4,empathy:3},
      skills:{observation:2},talents:['Alert'], equipment:['Radio'], inventory:['Flare']} },
  { id:'pc-2', name:'Nolan', observation:'remote' }
]
~~~

observerId **must** match the actual observed actor from the engine's public projection, not necessarily the player-controlled actor. observation:'self' is accepted only for that exact actor. Assign observation:'nearby' **only** if the authoritative projector establishes the survivor is presently observable (including physical location, lighting/LOS and recognized source knowledge); do not infer this from control mode, inventory ownership, Party membership or a mere camera change. All others should use observation:'remote' and **omit** live health, stress, death, private inventory and sheet. Even if erroneous data is passed for a remote actor, this component discards it. **The UI component is not a security boundary for raw client-held GM secrets**—the trusted upstream projection must do the redaction first.

For self and authorized nearby, pass **current Evolved health points**, healthMax, actual Evolved stress points (not 0–100 percentages), and engine-confirmed booleans dead and broken. Unknown, stale, disconnected or partial vitals should not be passed as live numbers; the component renders them as unknown. dead:true is the **only** path to flatline, and requires known complete authorized readings; health:0 and broken:true alone remain animated/stylized. All available sheet fields must be individually sanitized to the observer. The details view allowlists career, four attributes, twelve skills, talents, equipment, inventory, and visible injury labels. No inventory or game actions are offered; pickup/transfer/trade are still natural-language player intent.

The component uses native focusable buttons and aria-label descriptions for each survivor, view-only detail section with a Close button, four cards per row on desktop and two on narrow screens. Its ECG animation visually communicates low/moderate/high *stylized* Stress without asserting a medical BPM or deriving rules from the waveform. Health color is independent of waveform cadence. It uses CSS prefers-reduced-motion: reduce plus an optional explicit reducedMotion:true flag. portraitUrl is optional: HTTPS and site-root-relative URLs are permitted, other schemes are ignored. The presentation-only panel does not persist expansion state.

## Validation / open integration items

- Focused tests: node --test tests/portrait-vitals-dhr077.test.mjs.
- Full repository checks: npm test on the PR head, node --check src/portrait-vitals.mjs, node --check tests/portrait-vitals-dhr077.test.mjs.
- Integration Director must add a trusted source-visible projector to the shell under the single-Party-UI-file ownership policy, add stylesheet/module and portrait asset URLs, and verify observer transitions in Party/Focus/Spectator, death vs broken/zero Health, view-only detail correctness, 1–8 survivors, keyboard and touch, reduced motion and responsive layouts in real browsers. No manual graphical QA claimed here.
- Do not include private game plans, health/stress for separated survivors, or raw saved incident objects in presentation props. Existing partyView() may contain broad actors metadata; do not blindly pass its actors array as cards without first applying observer-visibility authorization and fetching approved local vitals/known sheets.
