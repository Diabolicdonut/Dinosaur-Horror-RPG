// DHR-004: evidence inventory checks; no gameplay or save-schema changes.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve, dirname} from 'node:path';
import {generateCharacter, makeParty} from '../src/characters.mjs';
import {resolveSkillCheck} from '../src/evolved-checks.mjs';
import {newPartyIncident, isPartySave} from '../src/party-engine.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const documentPath = resolve(root, 'docs/EVOLVED-MECHANICS-PARITY-DHR004.md');
const matrix = readFileSync(documentPath, 'utf8');
const ids = Array.from({length:26}, (_,i)=>'E'+String(i+1).padStart(2,'0'));

function parseRows(markdown) {
  return markdown.split(/\r?\n/)
    .filter(line=>/^\| E\d{2} \|/.test(line))
    .map(line=>{
      const cells = line.split('|').slice(1,-1).map(s=>s.trim());
      assert.equal(cells.length,7,'every evidence row requires exactly seven cells');
      return {id:cells[0], topic:cells[1], source:cells[2], status:cells[3],
        boundary:cells[4], evidence:cells[5], gap:cells[6]};
    });
}
const pathsIn = text => [...text.matchAll(/\b(?:src|tests|docs|adventures)\/[a-zA-Z0-9./_-]+\.(?:mjs|md)\b/g)]
  .map(match=>match[0]);
function validateRows(markdown) {
  const rows = parseRows(markdown);
  assert.deepEqual(rows.map(row=>row.id),ids,'audit must retain all 26 numbered contracts in order');
  for(const row of rows) {
    assert(['implemented','partial','missing'].includes(row.status),row.id+' invalid status');
    assert.match(row.source,/\bpp?\.\s*\d+/,row.id+' missing printed source page');
    for(const field of ['topic','boundary','evidence','gap'])
      assert(row[field].length>15,row.id+' missing '+field+' explanation');
    const paths=pathsIn(row.evidence);
    assert(paths.some(p=>p.startsWith('src/')),row.id+' needs executable code evidence');
    assert(paths.some(p=>p.startsWith('tests/')),row.id+' needs an explicit regression path');
    for(const path of paths) {
      assert(existsSync(resolve(root,path)),row.id+' cites nonexistent repository evidence '+path);
      if(path.startsWith('tests/'))assert.match(readFileSync(resolve(root,path),'utf8'),/\btest\s*\(/,
        row.id+' cites a non-executable test '+path);
    }
  }
  return rows;
}

test('DHR-004 matrix is complete, source-paged, honest about bounded status, and linked to executable evidence',()=>{
  const rows=validateRows(matrix);
  assert(rows.some(row=>row.status==='implemented'));
  assert(rows.some(row=>row.status==='partial'));
  assert(rows.some(row=>row.status==='missing'));
  assert.equal(rows.find(row=>row.id==='E03').status,'implemented');
  assert.equal(rows.find(row=>row.id==='E12').status,'missing');
  assert.equal(rows.find(row=>row.id==='E19').status,'missing');
  assert.equal(rows.find(row=>row.id==='E20').status,'missing');
  assert.equal(rows.find(row=>row.id==='E26').status,'partial');
});

test('DHR-004 rejects invented sources, unsupported readiness and malformed evidence in proposed matrix rows',()=>{
  assert.throws(()=>validateRows(matrix.replace('| E12 |','| E99 |')),
    /all 26 numbered contracts/);
  assert.throws(()=>validateRows(matrix.replace('| E19 | Survivor offensive close combat | Close Combat pp. 62–64 | missing |',
    '| E19 | Survivor offensive close combat | Close Combat pp. 62–64 | complete |')),
    /invalid status/);
  assert.throws(()=>validateRows(matrix.replace('src/evolved-checks.mjs; tests/evolved-checks.test.mjs |',
    'src/made-up-magic.mjs; tests/evolved-checks.test.mjs |')),
    /nonexistent repository evidence/);
  assert.throws(()=>validateRows(matrix.replace('Core Concepts pp. 25–26 | implemented |',
    'unverified source | implemented |')),
    /missing printed source page/);
});

test('DHR-004 cannot promote source-limited combat or Story Point hooks into globally accepted parity',()=>{
  assert.match(matrix,/gate 7, evolved-full-parity \(\*\*partial\*\*\)/);
  assert.match(matrix,/no gameplay, saves, checkpoints or accepted 38\/100 roadmap score/);
  assert.match(matrix,/No source-governed agenda achievement|No source-governed agenda/);
  const offense=readFileSync(resolve(root,'tests/live-research-combat-009b2b2c2c2b.test.mjs'),'utf8');
  assert.match(offense,/unimplemented research weapon rules must not pretend combat damage/);
  const state=JSON.parse(readFileSync(resolve(root,'site-progress.json'),'utf8'));
  const gate=state.roadmap.gates.find(g=>g.id==='evolved-full-parity');
  assert(gate,'whole-product scope must track full rules parity independently');
  assert(['partial','accepted'].includes(gate.status),'unexpected gate accounting');
  // The audit must not declare more acceptance than the authoritative ledger.
  if(gate.status==='partial')assert.equal(parseRows(matrix).find(r=>r.id==='E12').status,'missing');
});

test('DHR-004 seeded check proof survives serialization without changing original character',()=>{
  const actor=generateCharacter({career:'ranger',index:0,seed:7081});
  const before=structuredClone(actor);
  const options={skill:'observation',seed:43677,stress:2,push:0};
  const first=resolveSkillCheck(actor,options);
  const restored=JSON.parse(JSON.stringify(actor));
  const replay=resolveSkillCheck(restored,options);
  assert.deepEqual(replay,first,'replay must preserve per-die outcomes and stress response');
  assert.deepEqual(actor,before,'audit must not mutate actor input');
  assert(first.initial.base.every(n=>n>=1&&n<=6));
  assert(first.initial.stress.every(n=>n>=1&&n<=6));
  assert.throws(()=>resolveSkillCheck(actor,{...options,help:4}),RangeError,
    'a forged number of helpers must not be silently accepted');
});

test('DHR-004 prior party save stays valid, while a forged roster is still rejected',()=>{
  const roster=makeParty({seed:722,size:3,careers:['ranger','maintenance','scientist']});
  const incident=newPartyIncident({seed:9000,roster});
  const roundtrip=JSON.parse(JSON.stringify(incident));
  assert.equal(isPartySave(roundtrip),true);
  assert.deepEqual(roundtrip,incident,'historical format must survive roundtrip without migration');
  const tampered=structuredClone(roundtrip);
  tampered.startingRoster[0].attributes.wits=99;
  assert.equal(isPartySave(tampered),false);
  for(const filename of ['adventures/ridge-survey-rev1.mjs','adventures/ridge-survey-rev12.mjs',
    'adventures/tidal-nursery-rev1.mjs','tests/adventure-second-package-009d1.test.mjs',
    'tests/adventure-tidal-npc-009d2.test.mjs']) {
    assert(existsSync(resolve(root,filename)),'historical source or save-replay test missing: '+filename);
  }
});
