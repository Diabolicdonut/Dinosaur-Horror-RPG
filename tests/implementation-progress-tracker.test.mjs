import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {executionFor,implementationFor} from '../src/implementation-progress.mjs';

const site=JSON.parse(readFileSync(new URL('../site-progress.json',import.meta.url),'utf8'));
const queue=readFileSync(new URL('../docs/parallel-development/DEVELOPMENT-QUEUE.md',import.meta.url),'utf8');
const roadmap={
  ...site.roadmap, total:100, done:site.roadmap.gates
    .filter(g=>g.status==='accepted').reduce((sum,g)=>sum+g.weight,0)
};
const real=executionFor(site,queue,roadmap);
const built=implementationFor(site,real,roadmap);
const clone=()=>structuredClone(site);

test('Progress: 21 roadmap gates total 100 points and preserve exactly 38 accepted',()=>{
  assert.equal(roadmap.gates.length,21);
  assert.equal(roadmap.gates.reduce((sum,g)=>sum+g.weight,0),100);
  assert.equal(roadmap.done,38);
  assert.equal(site.implementation.method,'verified-queue-weighted-v1');
  assert.equal(site.revisionSource.file,'project-state.json');
});

test('Progress: complete authoritative queue is required and all assignments have unique IDs',()=>{
  assert(real);
  assert.equal(real.counts.total,79);
  assert.equal(real.counts.done,16);
  assert.equal(Object.keys(real.tasks).length,79);
  assert.equal(real.counts.ready+real.counts.blocked+real.counts.done,79);
  assert.equal(executionFor(site,queue.replace('| DHR-079 |','| DHR-099 |'),roadmap),null);
  assert.equal(executionFor(site,null,roadmap),null);
  assert.equal(executionFor(site,queue.replace('| DHR-078 |','| DHR-073 |'),roadmap),null);
});

test('Progress: shows actual merged groundwork instead of frozen 38 percent',()=>{
  assert(built);
  assert(built.points>49 && built.points<51,
    'Conservative verified engineering estimate should be near 50%; got '+built.points);
  assert.equal(built.acceptedPoints,38);
  assert.equal(built.completeAssignments,16);
  assert.equal(built.totalAssignments,79);
  assert.equal(built.partialAssignments.length,3);
  assert(built.percent>roadmap.done);
  assert(built.percent<100);
});

test('Progress: credits only verified merged work and never an open PR',()=>{
  assert.deepEqual(built.partialAssignments.map(p=>p.taskId).sort(),
    ['DHR-073','DHR-078','DHR-079']);
  assert(built.partialAssignments.every(p=>/^[0-9a-f]{40}$/.test(p.mainCommit)));
  assert(!JSON.stringify(site.implementation).includes('pull/137'));
  assert(!JSON.stringify(site.implementation).includes('pull/139'));
  assert(!JSON.stringify(site.implementation).includes('DROPBOX_REFRESH_TOKEN'));
  assert(!JSON.stringify(site.implementation).includes('GAME_TOKEN'));
});

test('Progress: a task mapped into multiple gates is normalized per gate',()=>{
  const index=20; // gate 21 / audio and cinematic
  assert.equal(roadmap.gates[index].id,'audio-cinematics');
  assert.equal(real.perGate[index].total,2);
  const gate=built.perGate[index];
  assert.equal(gate.completedTasks,0);
  assert(gate.fraction>0 && gate.fraction<0.95);
  assert.equal(gate.partial,0.6); // .45 DHR-078 + .15 DHR-079
  assert.equal(built.perGate[0].fraction,1);
  assert.equal(built.perGate[1].fraction,1);
});

test('Progress: once an audited partial task becomes Done, it is not counted twice',()=>{
  const advanced=structuredClone(real);
  advanced.tasks['DHR-078'].status='done';
  advanced.counts.done++;
  advanced.counts.ready--;
  for(const gate of advanced.tasks['DHR-078'].gates){
    advanced.perGate[gate-1].done++;
    advanced.perGate[gate-1].ready--;
  }
  const upgraded=implementationFor(site,advanced,roadmap);
  assert(upgraded.points>built.points);
  assert.equal(upgraded.partialAssignments.some(p=>p.taskId==='DHR-078'),false);
  assert.equal(upgraded.perGate[20].partial,0.15);
});

test('Progress: incomplete gates cannot obtain full accepted weight just by queue completion',()=>{
  const completed=structuredClone(real);
  completed.perGate[6].done=completed.perGate[6].total;
  const calculated=implementationFor(site,completed,roadmap);
  assert.equal(calculated.perGate[6].fraction,0.95);
  assert.equal(calculated.perGate[6].earnedPoints,5*0.95);
  assert.equal(calculated.acceptedPoints,38);
});

test('Progress: malformed, unknown, duplicate or unaudited partial credit fails closed',()=>{
  const cases=[
    m=>{m.implementation.partialAssignments[0].fraction=3;},
    m=>{m.implementation.partialAssignments[0].fraction=0;},
    m=>{m.implementation.partialAssignments[0].mainCommit='pending-review';},
    m=>{m.implementation.partialAssignments[1].taskId='DHR-999';},
    m=>{m.implementation.partialAssignments[1].taskId='DHR-073';},
    m=>{m.implementation.partialAssignments[0].reason='guess';},
    m=>{m.implementation.method='all-prs-are-done';}
  ];
  for(const mutate of cases){
    const m=clone();mutate(m);
    assert.equal(implementationFor(m,real,roadmap),null);
  }
  assert.equal(implementationFor(site,null,roadmap),null);
  assert.equal(implementationFor(site,real,null),null);
});

test('Progress: no queue / no reliable denominator withholds estimate without altering acceptance',()=>{
  const broken=clone();broken.execution.total=1000;
  assert.equal(executionFor(broken,queue,roadmap),null);
  assert.equal(implementationFor(broken,null,roadmap),null);
  assert.equal(roadmap.done,38);
});

test('Progress: main page widget distinguishes implemented from accepted and pending review',()=>{
  const widget=readFileSync(new URL('../site-progress.js',import.meta.url),'utf8');
  assert(widget.includes('Built ~'));
  assert(widget.includes('Accepted '));
  assert(widget.includes('Estimated from completed queue assignments'));
  assert(widget.includes('See pending pull requests (not counted)'));
  assert(widget.includes("import(new URL('src/implementation-progress.mjs', root).href)"));
  assert(widget.includes('estimate withheld'));
  assert(widget.includes('return {execution:null, implementation:null}'));
  assert(!widget.includes('Promise.allSettled(['));
});
