# DHR-015 — Reusable multi-round combat timing adapter (Issue #111)

**Scope:** A pure, adventure-independent candidate dependency for the offensive-combat integration wave. No existing Party/Focus/Spectator runtime handler, historical scenario manifest, v2/v3 save, Worker, accepted checkpoint or roadmap score changes.

## Source and boundary

Mechanics were checked against the user's **private** *Alien RPG — Evolved Edition*, printed Combat & Initiative pp. 59–61, creature Speed/combat p. 208, and Broken/Critical Injuries pp. 68–71. The private publication must not be committed to GitHub. The Evolved source grants one full plus one quick action **or** two quick actions per human per round, allows qualifying quick interrupts, redraws numbered initiative each round and assigns creatures separate complete turns for their Speed. Round-lethal Stamina death checks occur immediately **after the wounded character's turn**, without push or stress dice. The original code here does not reproduce copyrighted text or creature signature-attack tables.

`src/combat-round-adapter.mjs` exports `replayCombatRounds(world)`, `validCombatRounds(world)`, `COMBAT_ACTION_COSTS`, `COMBAT_ROUND_SECONDS` and a module-version constant. The adapter is deliberately **not** a new attack resolver: it does not supply attack target selection, melee/ranged/armor dice, movement legality, equipment, wounds, stealth, discovery, predator motives, NPC autonomy, or any scenario-specific creature script.

A trusted runtime supplies a **committed encounter record**, physical actor snapshots, authorized resolver proposals, a monotone sequence of **actually committed** action/turn/death-roll records, and separate committed initiative draw receipts with fixed seeds. Each projection is built from the *start* by replaying that authoritative ledger; repeated UI reads cannot expend resources, roll dice, reroll initiative or advance time. An absent encounter returns null and never infers one from a map overlap. The adapter does not mutate input world objects or generate attacks.

The trusted encounter supplies `id`, `location`, `status`, `initialDrawId`, `roster` (source-defined human / animal Speed) and `actors` (the opening physical snapshot). World state includes matching current `actors`, `proposals`, `commits`, and `draws`. Commit IDs and contiguous ordinals are unique within the encounter. An action receipt is accepted **only** when it names the current drawn initiative owner, legal source action cost, and an already authorized matching proposal; the event must contain the authoritative post-resolution actor snapshot. The final replayed snapshot must exactly match the world's actual committed actors. Passing `authorized: true` in client input or invented action receipts is not proof of authorization.

**Important trust limit:** This is a pure in-process adapter, not a cryptographic server boundary. A hostile client can forge an entire `world` object; the integration layer must supply the encounter, proposal authorization, spatial eligibility and committed action ledger exclusively from the trusted game state/resolver, not from model prose or public user JSON. The adapter cannot independently certify the signed-in user's rights or revalidate the melee/ranged resolvers' entire physical/roll proof chain.

## Supported event timing

| Committed event | Behavior |
| --- | --- |
| `action` | Human full/quick cost or exactly one animal move/strike per Speed card; owner, location, authorizer, budget, result and injury limits checked |
| `declare` | A source-authorized active attack against a real local target is declared **before** any defense or outcome; no attack inferred |
| `reaction` | An eligible living defender may decline or spend exactly one quick action for the declared melee defense/ranged dodge **before** the attack resolves; ambush cannot be reacted to; out-of-turn spending carries into that defender's later card |
| `end` | Active human voluntarily forfeits the rest of their turn; does not confer a free action |
| `hold` | Active human swaps ownership with an unused later numbered card without changing a die, spent budget, or combat time |
| `death_roll` | Only an actual committed no-stress, unpushed Stamina result may clear the queued *round*-lethal check after the human's completed turn; it never appears as a player action or rolls on every UI read |
| `round_draw` | Only after all eligible cards resolve, using a separate authentic committed seeded draw receipt; reset full/quick budgets and add one adopted ten-second combat round |
| `close` | Explicitly close a physically concluded and source-closed encounter; departure, death or retreat may end combat without another hostile turn |

Incapacitated humans retain the opportunity to end their scheduled turn and receive due death checks, and may perform at most one legal move; injuries that forbid movement or upgrade movement to a full action are enforced. Dead or departed combatants cannot act and their skipped future cards do not grant new actions. End-of-turn round-lethal checks do not get duplicated at the end-of-round clock tick. Longer stretch/shift death intervals, safe recovery, surgery and exact seeded clinical roll outcomes remain the authority of `src/evolved-injuries.mjs` and its actual runtime commit; this adapter must not fabricate or replace them. The local ten-second combat clock is a fixed project convention within the source's approximate range, not a universal RAW duration.

The stable event ledger, not a separately editable budget field, is the replay/save source of truth; the adapter's JSON-safe projection exposes current owner, action budgets, medical/reaction phase, round and draw history. UI control modes can read the projection without creating or spending a turn. Historical save files **without this optional future ledger** remain on the existing unchanged runtime path. This module does not migrate or rewrite historical saves.

## Tests and integration status

`tests/combat-round-adapter-dhr015.test.mjs` covers source-card determinism, live owner, Speed, validated physical start, correct full/quick and animal action ceilings, proposal and target forgery, reactions/declarations/ambush denial, initiative hold, seeded redraw, quiet noncombat, round-lethal checks, injured/broken action limitations, natural encounter ending, event replay and mode invariance. Additional preexisting tests cover all accepted runtime paths.

**Still required for DHR-016/Integration Director:** bind this ledger to the trusted runtime's real action and medical receipts, live scenario-specific encounter admission, movement/visibility and defender consent; reconcile existing `src/combat-turns.mjs` and `src/adventure-combat-scheduler.mjs` without changing frozen saves; prove physical combat across distinct adventures; and perform desktop/mobile/Cloudflare smoke. No UI or live Worker deployment is claimed here. No accepted 38/100 score or 009-D2 checkpoint is changed.
