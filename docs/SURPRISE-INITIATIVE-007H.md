# Checkpoint 007-H — Surprise, Ambush, Holding Off, and Turn-Specific Death Checks

**Date:** October 22, 2026  
**Authority:** The privately supplied *Alien RPG — Evolved Edition*, printed pp. 59–61 (initiative/surprise/ambush/holding off) and p. 68 (lethal death rolls). This is original code and Jurassic survival prose; no source book is published.

## Playable rules

**Surprise and ambush.** A qualifying surprising combatant receives the earliest remaining numbered initiative card, before the normal seeded draw. Multiple surprising combatants can claim cards #1, #2, etc. An ambush additionally grants **+2 dice on the initial attack** and prevents the unaware target from dodging or defending against that attack. This advantage applies only to the relevant initial strike, not every animal Speed turn, and is recorded in the combat action log. The initial initiative draw and resulting dice remain deterministic.

In the island incident:
- A velociraptor that spots exposed survivors before they spot it can launch a surprise ambush, receiving the first card (unless someone else observed it first). Its first attack gets the special modifier and bypasses a prepared quick-action dodge.
- A concealed survivor who attacks an unaware, physically colocated velociraptor can begin a human ambush. This assigns the human attacker card #1 and adds two dice to that first attack. The attacker stops being concealed.
- These conditions are validated from existing actor location, concealment, observation and dinosaur alert state; the AI does not receive arbitrary predator coordinates.

**Holding off.** A survivor on their own initiative card may choose **Hold for Card #N**, where N belongs to a *later* combatant. The survivor exchanges initiative positions with that combatant, who is now due to act immediately; the holding survivor acts when the later card comes around. No action budget is spent, no world or medical time passes, no skill roll or RNG draw is triggered, and any quick actions already spent (including defensive reactions) remain spent. Only unplayed cards may be selected. The change is recorded in the combat initiative hold journal and the game action journal without rewriting the original card draw.

This applies across Party, Character and Spectator modes. In the browser, the active human survivor sees dynamically generated **Hold for [Survivor or Velociraptor] (#Card)** buttons. Natural-language requests such as `hold off to card 7` are supported. A plain `hold` still means waiting, preserving older short-command behavior.

**Lethal-round medical timing.** For critical wounds with the **round** lethal interval, the game now performs one unpushable, stress-free STAMINA death check **immediately when that survivor's own initiative turn finishes** (including an end-turn or a forced lost action). Holding initiative delays the check until the survivor's actual later turn, matching the rulebook's timing. A record tracks the affected actor, wound code, round and seeded roll; the shared completed-round medical clock excludes these wounds to prevent duplicate checks. Broken-but-living survivors retain a scheduled turn, so incapacitation does not silently eliminate their death-check opportunity. Stretch and shift medical checks, surgical procedures, permanent injury penalties and recovery continue through the prior 007-G system.

## Determinism, ownership and saves

- All changes apply inside the existing **party v3 save**; optional `combat.surprise`, `combat.holds`, `medicalChecks` and wound metadata do not require resetting older 007-C/007-D/007-F/007-G party saves.
- The ordinary solo 006.2 game, save, Cloudflare Worker and AI configuration remain untouched.
- Mode changes never reorder previous actions or dice. Holding swaps only identities attached to future numbered cards, not the numbers themselves.
- The browser revision is **007h** to prevent a cached older UI from hiding the controls.
- Tests cover card uniqueness and priorities, source-eligible predator/human ambushes, +2 first attack, dodge suppression, valid/invalid holds, zero-time swaps, action-budget preservation, late-turn medical checks, no duplicate combat-clock checks, spectator stepping and parser compatibility.

## Remaining source parity gaps

This checkpoint does **not** implement player-confirmed defensive reactions immediately before an attack (the existing Stand Watch policy authorizes a prepared automatic dodge), the full stealth-mode ambush rules for multiple human attackers, precise line-of-sight/adjacent distances, group initiative negotiation, every possible surprise special-case, or detailed injury/mental-trauma/infection complications. A combatant's initiative hold is currently expressed as an explicit action-order swap for the active character rather than a fully narrated GM negotiation. These remain tracked for follow-on implementation.

**Next work:** deliberate defense interrupts, full group ambush and stealth positioning, infection and remaining critical injury effects, and a manual graphical browser smoke test across all three control modes.

**Validation gate:** GitHub's latest main-branch Node CI and Pages deployment must both pass. No graphical browser smoke is claimed solely from automated test results.
