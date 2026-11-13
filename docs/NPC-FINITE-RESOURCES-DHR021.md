# DHR-021 — Source-bound, finite NPC resource decisions

**Scope:** GitHub Issue #113, roadmap gate 9, dependent on accepted DHR-019 / PR #108 and finite-ammunition DHR-009. This is a **nonexecuting, pure decision adapter**, not another accepted weighted roadmap gate.

## API

`src/npc-resource-decisions.mjs` exports:

```js
planNpcResourceDecision(compiled, motive, ledger, query, catalog, world)
```

- `compiled`: fully validated source-bound AdventureDefinition with chosen seed/fingerprint.
- `motive`, `ledger`, `query`: unchanged DHR-017/018/019 contracts. The DHR-019 planner revalidates the complete normalized ledger and motive, including local witnessed facts, source NPC and decision beat.
- `catalog`: **trusted, author-attested metadata** `{source:{adventureId,revision,fingerprint,seed},items:[{itemId,role,usesPerItem}]}`. Accepted roles are `medical`, `supply`, `tool`, `weapon`. Every item must actually exist in the compiled source's `startItems` or room stock. A mere caller-created label is not proof that equipment is medically capable.
- `world`: **engine-attested, complete** physical snapshot `{actors:[{id,location,inventory,gear}], rooms:{roomId:{items}}, usage:{itemId:{used,destroyed}}}`. All active NPC locations must match the exact source-validated replay frame; both floor and held stock, across all actors, must conserve the manifest total plus destroyed units.

This module deliberately does **not** modify the existing manifest schema or accept mutable client-supplied source stock as authority. Callers must load the catalog from trusted authored data and attest that the world snapshot was produced by actual inventory/transfer/usage transactions.

## Resource accounting

A unique authored item may have multiple finite charges. For items that use an identical source item ID more than once, only **one use per physical unit** is supported until the adventure uses distinct item/serial IDs. `usage.used` is a cumulative committed use count; `usage.destroyed` counts exhausted items permanently removed from the world. One-use items are destroyed on use. Multi-use items may remain as physically present but exhausted equipment, or be removed after their last charge. An impossible total, missing stock, duplicated item, negative/fractional spend or fabricated location rejects instead of minting resources.

## Decisions and costs

An observed, still-local distress event may yield `assist`, `use_equipment` (only possessed, nonexhausted medical/supply items) or `offer_equipment` (only possessed, nonexhausted items to a colocated, actually distressed recipient). A local witnessed clue can yield tool-use consideration. Otherwise `hold` remains legitimate. The DHR-019 higher-priority witnessed withdrawal is respected: this adapter does not manufacture weapon combat in its place. A weapon may be proposed for a handoff but **never** grants an attack or ammunition.

Each positive option carries `cost:{minimumActions:1,executorMustCharge:true}` and specifies `consumesUses` for resource use versus offered transfer. This is an **advisory nonzero budget requirement**, **not** an assertion of precise Evolved quick/full-action costs. The DHR-020/DHR-022 combat/exploration scheduler must map the eventual committed action to sourced timing, verify room and target again, debit costs, enforce Evolved rolls, and make the only authorized world mutations. No supplies, healing, time, RNG, observations, injuries or inventory transfers are committed here.

## Security, determinism and compatibility

Source seed, adventure revision and compiled fingerprint are checked. Provenance and motives are revalidated by DHR-019, not accepted as opaque hints. Decisions and identity hashes are deterministic under source-equivalent input ordering, and the returned proposals are frozen. Hashes are reproducibility handles, **not authentication**. A real engine replay (not an AI, client save or stale snapshot) must attest the world, item classifications and upstream observation provenance. No new persistent save fields or historical adventure files, Party modes, runtime handler or accepted roadmap progress are modified.

**Deferred:** An actual NPC gear allocation and event-ledger integration, combat-aware action costs, medical checks/effects, physical transfer execution, weapon/ammunition interactions and engine/GM narration wiring. These belong to DHR-020/022/023 and later dedicated integration work. Browser, mobile and production Cloudflare verification are not represented by pure regression tests.
