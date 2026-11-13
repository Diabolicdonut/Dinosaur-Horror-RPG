# DHR-002 — Graphical QA Evidence Record (COPY, do not overwrite)

**This is a blank template. No graphical test is recorded as passed.** Copy once for each distinct commit/build + browser + device. Keep private/full incident saves and hidden-world diagnostic payloads out of public repositories.

## Run identity

| Field | Record actual value |
| --- | --- |
| QA run ID | _DHR002-YYYYMMDD-BUILD-BROWSER-DEVICE_ |
| Tested commit SHA (full), branch/PR | _NOT_RECORDED_ |
| Pages deployment/run ID or localhost URL + server | _NOT_RECORDED_ |
| Date UTC; tester | _NOT_RECORDED_ |
| Browser name/version + engine | _NOT_RECORDED_ |
| Operating system/device (physical or emulated) | _NOT_RECORDED_ |
| CSS viewport width × height; DPR; zoom | _NOT_RECORDED_ |
| Input device (mouse/keyboard/physical touch) | _NOT_RECORDED_ |
| Screen reader / accessibility settings | _NOT_RECORDED_ |
| AI/Worker; media enabled or disabled | _NOT_RECORDED; never paste credentials_ |
| Saved data backup location (private) | _NOT_RECORDED_ |
| Console/network capture (redacted) | _NOT_RECORDED_ |

**Status vocabulary:** `PASS` observed correct in an actual browser; `FAIL` observed defect, linked to issue; `BLOCKED` explicit unavailable dependency; `NOT_RUN` not executed; `NOT_APPLICABLE` with reason. A node test or Pages deploy **cannot** set a browser row to PASS.

## Core adventure × control mode × viewport record

Copy these rows for **all four viewports** per scenario/mode. Matrix suffix: D=1440×900, T=820×1180, M=390×844, XS=320×568.

| Case ID | Adventure | Mode | Viewport | Real browser status | Scenario seed / roster reference | Screenshot/video evidence | Defect or blocker |
| --- | --- | --- | --- | --- | --- | --- | --- |
| N-P-D (example; expand) | Nublar / After the Storm | Party | 1440×900 | NOT_RUN | — | — | — |
| N-F-D | Nublar / After the Storm | Focus | 1440×900 | NOT_RUN | — | — | — |
| N-S-D | Nublar / After the Storm | Spectator | 1440×900 | NOT_RUN | — | — | — |
| L-P-D | Long Count | Party | 1440×900 | NOT_RUN | — | — | — |
| L-F-D | Long Count | Focus | 1440×900 | NOT_RUN | — | — | — |
| L-S-D | Long Count | Spectator | 1440×900 | NOT_RUN | — | — | — |
| T-P-D | Tidal Nursery | Party | 1440×900 | NOT_RUN | — | — | — |
| T-F-D | Tidal Nursery | Focus | 1440×900 | NOT_RUN | — | — | — |
| T-S-D | Tidal Nursery | Spectator | 1440×900 | NOT_RUN | — | — | — |

Duplicate the nine rows with suffix **-T, -M and -XS**; attach the completed 36 rows to graphical acceptance. Do not count the example-only table as execution.

### Flow-level observations — duplicate for each core case

| Flow ID | Step / expected proof | Status | Observable actual result, exact step number and screenshot | Bug/blocked reason |
| --- | --- | --- | --- | --- |
| G01 | Scenario selection, launch and stable initial world | NOT_RUN | — | — |
| G02 | Valid roster, viewing/switching survivors | NOT_RUN | — | — |
| G03 | Party/Focus/Spectator controls vs independent camera; pause/step | NOT_RUN | — | — |
| G04 | Narrative command, real skill checks, invalid action | NOT_RUN | — | — |
| G05 | Inventory gain/consumption and denied foreign item | NOT_RUN | — | — |
| G06 | Local dinosaur & NPC, quiet/wonder, hidden-info restrictions | NOT_RUN | — | — |
| G07 | Encounter/combat/defense on an actual eligible seed | NOT_RUN | — | — |
| G08 | Save/reload/historical/recovery and abort overwrite | NOT_RUN | — | — |
| G09 | Responsive, keyboard, touch, focus and a11y | NOT_RUN | — | — |
| G10 | Production Hub, Map, portraits and scene-image toggles *if integrated* | NOT_RUN | — | — |
| G11 | Optional audio/video/image and Worker offline/failure/gesture | NOT_RUN | — | — |

## Separate one-time / cross-browser evidence

| Exercise | Browser/device | Status | Evidence / defects |
| --- | --- | --- | --- |
| Legacy Nublar solo: `index.html`, autosave/debug redaction | — | NOT_RUN | — |
| Character Lab (1,3,4,8 actors; invalid budgets/gear; export/launch) | — | NOT_RUN | — |
| Seven historic fixture categories — runtime and browser-restoration route | — | NOT_RUN | — |
| Firefox / Gecko: all 9 adventure-mode pairs | — | NOT_RUN | — |
| Safari iOS / WebKit: all 9 pairs, real touch/orientation | — | NOT_RUN | — |
| Chrome Android: all 9 pairs, real touch/orientation | — | NOT_RUN | — |
| Safari macOS: keyboard, save, representative scenarios | — | NOT_RUN | — |
| NVDA/Firefox or VoiceOver/Safari, labelled controls/announcements | — | NOT_RUN | — |
| Zoom 200% / 400%, 320px reflow, reduced motion, high contrast | — | NOT_RUN | — |
| Offline, expired Worker token, revoked media permission (authorized) | — | NOT_RUN | — |

**Historic fixtures:** `nublar-bound-v3`, `nublar-legacy-unbound-v3`, `ridge-current-rev13`, `ridge-frozen-rev12`, `ridge-frozen-rev1`, `tidal-current-rev2`, `tidal-frozen-rev1`. If current UI cannot import historical JSON, explicitly record `BLOCKED—no UI import`; an engine fixture success does not override that status.

## Evidence files & change controls

- Saved screenshot(s): _NONE_
- Browser console copy (after stripping secrets): _NONE_
- Video or accessibility recording: _NONE_
- Redacted action trace (scenario ID, **actual** seed, actor, action, beat, expected/actual): _NONE_
- GitHub issues opened/linked for failures: _NONE_
- Re-test evidence on fixed merged-main commit (if applicable): _NONE_

**Defect issue copy/paste:**

> [DHR-002 visual QA] Short defect title  
> Build SHA / deployed URL and checked date:  
> Scenario, mode, actor, actual seed, roster, revision:  
> Device/OS/browser/version, viewport/DPR/zoom, input type:  
> Starting state (sanitized), preconditions and exact commands/clicks:  
> Expected visual/behavioral result:  
> Observed result and console evidence (sanitized):  
> Severity and regression impact; screenshot/video:  
> Related PR/owner; repeat count; PASS/FAIL/BLOCKED evidence row:

## Automated evidence — strictly independent of graphical results

| Check | Exact commit SHA | Command/Actions link | Status with full output | Notes |
| --- | --- | --- | --- | --- |
| Complete Node test suite | — | `npm test` | NOT_RUN | No graphical conclusions |
| Focused QA tests | — | `node --test tests/dhr-002-graphical-qa.test.mjs` | NOT_RUN | Matrix/source/deterministic only |
| Syntax | — | `node --check tests/dhr-002-graphical-qa.test.mjs` | NOT_RUN | Parser only |
| GitHub Pages deployment | — | — | NOT_RUN | Delivery only, not browser check |

**Integration Director sign-off:** _PENDING_  
**Outstanding FAIL/BLOCKED rows and issue links:** _NONE ASSESSED_  
**Decision on roadmap gate 17 (separate whole-gate acceptance):** _NOT ASSESSED_; this document itself does **not** change accepted progress.
