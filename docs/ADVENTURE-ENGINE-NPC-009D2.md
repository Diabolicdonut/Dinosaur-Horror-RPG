# 009-D2 — Source-defined NPC behavior across independent adventures

**Status:** candidate implementation, pending pull-request Actions, independent merged-main Actions/Pages, and manual desktop/mobile graphical testing. **Version:** v0.7.39. **Target:** 665/665 Node tests. Overall roadmap remains **38/100 accepted weighted gates** and first playable 5/8. Neither the NPC-agency nor scenario-independence gate is fully accepted by this narrow milestone.

## Recovered baseline and purpose

Recovered source main at `4437315c7ec1801c89f2352c9bca2d1ea00f6d82`, accepted 009-D1 / v0.7.38 with 657 automated tests. The previous standalone `Tidal Nursery` had no supporting cast; `Long Count` supported cast only at historical revision 10+, which accidentally treated a scenario revision number as a universal feature gate.

The cross-adventure extension uses the scenario manifest's own `supportingCast`, `autonomy`, and `dangerResponse` fields to advertise whether it needs NPC save/history records. Historical Long Count revision thresholds remain intact. No new generic AI planner, human NPC Evolved combat, hidden secret service, or aggressive animal behavior is implied.

## Authored demonstration

`adventures/tidal-nursery.mjs` revision 2 adds two original NPCs. Mara Venn remains at the supply shelter and provides grounded route information; a transmission follow-up requires the actual signal objective first. Ivo Pell remains by the nesting pool until the actual sample-recovery objective, then follows an authored, physically connected `nesting-pool → reed-walk → supply-shelter` return route, one step per complete exploration roster round. His local dialogue is available only to colocated survivors, and his scientific comparison topic requires a real recovered-samples objective.

The source-driven route can be replayed from seed, objective records and time; stored NPC positions, movement records, and conversations are checked against source-bound chronology. The player is not granted remote conversations or unseen NPC movement notifications. The seed-varying tide/radio situation still works independently; no forced predator attack is introduced.

## Historical compatibility

The exact previously published revision 1 source is frozen in `adventures/tidal-nursery-rev1.mjs`, preserving its compiled fingerprint. The selected-adventure router compiles rev1 for saves bound to rev1 and compiles the new rev2 from the current catalog for fresh games. Rev1 saves do not acquire rev2 NPC fields. Long Count rev1–13 and the separate Nublar path remain unchanged. Browser import cache keys advance to 009-D2.

Eight new regression cases cover source identity, local dialogue, remote rejection, objective-gated disclosures, connected NPC movement, forged saves/records, frozen rev1 saves and all three control modes. The existing D1 current-catalog expectations now check current rev2 rather than asserting the historical rev1 remains the latest revision.

## Remaining work

Test the exact PR head, independent main Actions and Pages before marking accepted. Manually smoke-test native desktop and mobile browsers, all control modes and both estuary revisions. The same unfinished full-scope gates remain: offensive Evolved combat, independent NPC tactical choices and medical outcomes, universal engine extraction, AI Game Mother, procedural Cinematic/Campaign and secure private GM state.
