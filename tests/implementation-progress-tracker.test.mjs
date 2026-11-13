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
  assert.equal(real.counts.done,28);
  assert.equal(real.counts.ready,4);
  assert.equal(real.counts.blocked,47);
  for(const id of ['DHR-026','DHR-027','DHR-028','DHR-077','DHR-002','DHR-005','DHR-029','DHR-033']) assert.equal(real.tasks[id].status,'done');
  assert.equal(Object.keys(real.tasks).length,79);
  assert.equal(real.counts.ready+real.counts.blocked+real.counts.done,79);
  assert.equal(executionFor(site,queue.replace('| DHR-079 |','| DHR-099 |'),roadmap),null);
  assert.equal(executionFor(site,null,roadmap),null);
  assert.equal(executionFor(site,queue.replace('| DHR-078 |','| DHR-073 |'),roadmap),null);
});

test('Progress: shows actual merged groundwork instead of frozen 38 percent',()=>{
  assert(built);
  assert.equal(built.points,58.4,
    'Wave 2 accepted 28/79 main execution ledger should yield 58.4 modeled points');
  assert.equal(built.percent,58);
  assert.equal(built.acceptedPoints,38);
  assert.equal(built.completeAssignments,28);
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
  assert(!JSON.stringify(site.implementation).includes('pull/135'));
  assert(!JSON.stringify(site.implementation).includes('pull/140'));
  assert(!JSON.stringify(site.implementation).includes('pull/141'));
  assert(!JSON.stringify(site.implementation).includes('pull/142'));
  assert(!JSON.stringify(site.implementation).includes('pull/144'));
  assert(!JSON.stringify(site.implementation).includes('pull/143'));
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
  assert(widget.includes('Overall ~'));
  assert(widget.includes('One user-facing completion number'));
  assert(widget.includes('Formal milestone acceptance · technical detail'));
  assert(widget.includes("if (config.implementation) {"));
  assert(widget.includes("'Roadmap ' + roadmap.percent"));
  assert(widget.includes('Estimated from completed queue assignments'));
  assert(widget.includes('See pending pull requests (not counted)'));
  assert(widget.includes("import(new URL('src/implementation-progress.mjs', root).href)"));
  assert(widget.includes('estimate withheld'));
  assert(widget.includes('return {execution, implementation:null}'));
  assert(!widget.includes('Promise.allSettled(['));
});

test('Progress: duplicated audited evidence is rejected even once a task is Done',()=>{
  const advanced=structuredClone(real);
  advanced.tasks['DHR-078'].status='done';
  advanced.counts.done++;
  advanced.counts.ready--;
  for(const gate of advanced.tasks['DHR-078'].gates){
    advanced.perGate[gate-1].done++;
    advanced.perGate[gate-1].ready--;
  }
  const broken=clone();
  broken.implementation.partialAssignments.push(
    structuredClone(broken.implementation.partialAssignments.find(p=>p.taskId==='DHR-078')));
  assert.equal(implementationFor(broken,advanced,roadmap),null);
});

test('Progress: production widget renders the live queue, modeled percentage and accepted score distinctly',async()=>{
  const documentBefore=globalThis.document,fetchBefore=globalThis.fetch;
  class MockElement {
    constructor(tag){this.tag=tag;this.children=[];this.attributes={};this.textContent='';this.id='';this.className='';}
    append(...elements){this.children.push(...elements);}
    appendChild(el){this.append(el);}
    setAttribute(name,value){this.attributes[name]=String(value);}
  }
  const body=new MockElement('body');
  globalThis.document={
    currentScript:{src:new URL('../site-progress.js',import.meta.url).href},
    readyState:'complete',body,head:new MockElement('head'),
    getElementById:(id)=>body.children.find(x=>x.id===id)||null,
    createElement:tag=>new MockElement(tag)
  };
  globalThis.fetch=async input=>{
    const url=new URL(input);
    if(url.protocol!=='file:')throw new Error('Test refuses external network sources');
    return {ok:true,text:async()=>readFileSync(url,'utf8')};
  };
  try{
    await import(new URL('../site-progress.js?pr143-current-main-smoke',import.meta.url).href);
    let frame;
    for(let i=0;i<80;i++){
      frame=body.children.find(x=>x.id==='project-progress-status');
      if(frame)break;
      await new Promise(resolve=>setTimeout(resolve,10));
    }
    assert(frame,'progress widget should mount with a readable local queue');
    const summary=frame.children[0]?.children[0];
    const labels=(summary?.children||[]).map(el=>el.textContent);
    assert(labels.includes('Overall ~58%'),'project-wide implementation estimate should be the visible badge');
    assert(!labels.some(s=>s.startsWith('Roadmap ')),'formal acceptance must not appear in the collapsed badge');
    const all=[];
    function walk(el){all.push(el);for(const child of el.children||[])walk(child);}
    walk(frame);
    assert(all.some(el=>el.textContent==='38 of 100 weighted delivery points accepted'),
      'formal acceptance is preserved in expanded technical details');
    assert(labels.includes('Work 28/79'),'completed assignments must follow current merged queue');
    assert(labels.includes('Rev v0.7.39'),'do not promote historical gameplay checkpoint');
  }finally{
    if(documentBefore===undefined)delete globalThis.document;
    else globalThis.document=documentBefore;
    if(fetchBefore===undefined)delete globalThis.fetch;
    else globalThis.fetch=fetchBefore;
  }
});
