// DHR-006: deliberately small, declarative seed/incident replay fixtures.
// These are *not* serialized copies of private GM notes or licensed scenarios.
// A fixed roster seed, incident seed, source revision and legal command tape
// reconstruct each complete JSON save with the real engine under test.
export const SEED_INCIDENT_FIXTURES = Object.freeze([
  {
    id:'nublar-bound-v3', adventureId:'nublar-after-the-storm',
    seed:9000, revision:1, scenario:'nublar-incident-1993',
    start:'control', flags:['beacon','distress','paddockGateBraced','power','serviceShutterClosed'],
    commands:['wait','wait']
  },
  {
    id:'nublar-legacy-unbound-v3', adventureId:'nublar-after-the-storm',
    seed:9000, revision:1, scenario:'nublar-incident-1993',
    start:'control', flags:['beacon','distress','paddockGateBraced','power','serviceShutterClosed'],
    legacyUnbound:true, commands:['wait']
  },
  {
    id:'ridge-current-rev13', adventureId:'ridge-survey',
    seed:23, revision:13, scenario:'ridge-survey',
    start:'field-camp', flags:['dataRecovered','reportSent','teamWithdrawn'],
    commands:['move rocky-ascent','move field-camp']
  },
  {
    id:'ridge-frozen-rev12', adventureId:'ridge-survey',
    seed:19, revision:12, scenario:'ridge-survey',
    start:'field-camp', flags:['dataRecovered','reportSent','teamWithdrawn'],
    historicalSource:'ridge-survey-rev12', commands:['move rocky-ascent']
  },
  {
    id:'ridge-frozen-rev1', adventureId:'ridge-survey',
    seed:7, revision:1, scenario:'ridge-survey',
    start:'field-camp', flags:['dataRecovered','reportSent','teamWithdrawn'],
    historicalSource:'ridge-survey-rev1',
    removeModernFields:['supportingCast','conversationRecords','npcAutonomyRecords','npcDangerRecords'],
    commands:['move river-crossing','move forest-blind']
  },
  {
    id:'tidal-current-rev2', adventureId:'tidal-nursery',
    seed:23, revision:2, scenario:'tidal-nursery',
    start:'supply-shelter', flags:['returned','samplesSecured','signalSent'],
    commands:['move signal-knoll','move supply-shelter']
  },
  {
    id:'tidal-frozen-rev1', adventureId:'tidal-nursery',
    seed:23, revision:1, scenario:'tidal-nursery',
    start:'supply-shelter', flags:['returned','samplesSecured','signalSent'],
    historicalSource:'tidal-nursery-rev1',
    removeModernFields:['supportingCast','conversationRecords','npcAutonomyRecords','npcDangerRecords'],
    commands:['move signal-knoll']
  }
]);

// SHA-1 values are Git *blob* IDs from accepted main, not security signatures.
// Pin the unmodified original source bytes for historical revisions. This
// catches accidental mutation even if two implementation paths agree on a new
// fingerprint, and avoids duplicating entire adventure files as fixtures.
export const FROZEN_SOURCE_BLOBS = Object.freeze({
  'adventures/after-the-storm.mjs':'be3929e2992335a62ed21294738df35b895e6fe4',
  'src/scenario.mjs':'07f8fd1fe09754c9ef0b469642f5cc581d7796af',
  'adventures/ridge-survey-rev1.mjs':'c6a69d18613fc94b00a111226539e72f8aeeae48',
  'adventures/ridge-survey-rev12.mjs':'753b667fd46241934d9d7f9412298c113f8b504d',
  'adventures/tidal-nursery-rev1.mjs':'3fd128b274d02ac82341c999336b324930cdb092'
});
