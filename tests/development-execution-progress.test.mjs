import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const root=new URL('../',import.meta.url);
const read=name=>readFile(new URL(name,root),'utf8');
const [widget,manifestText,queue]=await Promise.all([
  read('site-progress.js'),
  read('site-progress.json'),
  read('docs/parallel-development/DEVELOPMENT-QUEUE.md')
]);
const manifest=JSON.parse(manifestText);
const state=JSON.parse(await read('project-state.json'));

function node(tagName){
  return {tagName,children:[],attributes:{},className:'',textContent:'',
    append(...items){this.children.push(...items)},
    setAttribute(k,v){this.attributes[k]=v}
  };
}
const walk=n=>[n,...(n.children||[]).flatMap(walk)];
async function render({m=manifest,q=queue,unavailable=false}={}){
  const ui={};
  const document={
    currentScript:{src:'https://diabolicdonut.github.io/Dinosaur-Horror-RPG/site-progress.js'},
    readyState:'complete',getElementById:()=>null,createElement:node,
    head:{appendChild(v){ui.style=v}},body:{appendChild(v){ui.frame=v}}
  };
  const fetch=async url=>{
    const name=new URL(url).pathname.split('/').pop();
    if(name==='site-progress.json')return {ok:true,text:async()=>JSON.stringify(m)};
    if(name==='project-state.json')return {ok:true,text:async()=>JSON.stringify(state)};
    if(name==='DEVELOPMENT-QUEUE.md'&&!unavailable)
      return {ok:true,text:async()=>q};
    return {ok:false,text:async()=>''};
  };
  runInNewContext(widget,{document,fetch,URL});
  for(let n=0;n<24&&!ui.frame;n++)await new Promise(resolve=>setImmediate(resolve));
  assert.ok(ui.frame,'browser progress tracker should mount');
  return {frame:ui.frame,all:walk(ui.frame)};
}
const spans=ui=>ui.all.filter(n=>n.tagName==='span').map(n=>n.textContent);
const texts=ui=>ui.all.map(n=>n.textContent).filter(Boolean);
const bars=ui=>ui.all.filter(n=>n.tagName==='progress');

test('small completions appear separately from accepted whole-game progress',async()=>{
  const ui=await render();
  assert.equal(manifest.execution.total,72);
  assert.deepEqual(spans(ui).filter(v=>v==='Roadmap 38%'||v==='Work 12/72'),
    ['Roadmap 38%','Work 12/72']);
  assert(texts(ui).includes('38 of 100 weighted delivery points accepted'));
  assert(texts(ui).includes('12 of 72 assignments complete (16.7%)'));
  assert(texts(ui).includes('10 ready · 50 dependency-blocked'));
  assert(texts(ui).some(s=>s.includes('task counts are not weighted points')));
  assert(bars(ui).some(b=>b.value===12&&b.max===72&&
    b.attributes['aria-label']==='Completed developer assignments'));
  assert.equal(ui.frame.attributes['aria-label'],'Project revision and roadmap completion');
});

test('each incomplete gate shows its own independently linked progress',async()=>{
  const ui=await render();
  const gateSummaries=ui.all.filter(n=>n.tagName==='summary')
    .filter(n=>n.attributes['aria-label']?.includes('view acceptance requirements'));
  assert.equal(gateSummaries.length,18);
  const labels=gateSummaries.map(n=>n.children.map(c=>c.textContent).join(' / '));
  assert(labels.some(s=>s.includes('offensive survivor combat')&&
    s.includes('partial · 7pt · 4/9 tasks')));
  assert(labels.some(s=>s.includes('independent human NPC')&&
    s.includes('partial · 7pt · 3/10 tasks')));
  assert(ui.all.some(n=>n.tagName==='progress'&&n.value===4&&n.max===9&&
    n.attributes['aria-label']?.includes('offensive survivor combat')));
  assert(texts(ui).includes('4 completed · 2 ready · 3 blocked (44% of linked tasks)'));
  assert(texts(ui).includes('3 completed · 1 ready · 6 blocked (30% of linked tasks)'));
});

test('newly merged subtask moves both task-level and relevant gate-level indicators, not 38%',async()=>{
  const changed=queue.replace('| DHR-012 | **Ready** |','| DHR-012 | **Done** |');
  assert.notEqual(changed,queue);
  const ui=await render({q:changed});
  assert(spans(ui).includes('Work 13/72'));
  assert(spans(ui).includes('Roadmap 38%'));
  assert(texts(ui).includes('13 of 72 assignments complete (18.1%)'));
  assert(texts(ui).includes('9 ready · 50 dependency-blocked'));
  assert(texts(ui).includes('5 completed · 1 ready · 3 blocked (56% of linked tasks)'));
  assert(texts(ui).includes('38 of 100 weighted delivery points accepted'));
});

test('malformed or incomplete queue fails closed rather than displaying invented progress',async()=>{
  const mutations=[
    q=>q.replace('| DHR-012 |','| DHR-999 |'),
    q=>q.replace('| DHR-012 |','| DHR-011 |'),
    q=>q.replace('| DHR-012 | **Ready** |','| DHR-012 | Done |'),
    q=>q.replace('| DHR-012 | **Ready** | 8 |','| DHR-012 | **Ready** | 19 |'),
    q=>q.split('\n').filter(l=>!l.startsWith('| DHR-012 |')).join('\n'),
    q=>q.replace('| DHR-012 | **Ready** | 8 |','| DHR-012 | **Ready** | 8,8 |'),
  ];
  for(const mutate of mutations){
    const ui=await render({q:mutate(queue)});
    assert(spans(ui).includes('Roadmap 38%'));
    assert(spans(ui).includes('Work —'));
    assert(texts(ui).some(t=>t.includes('Assignment status unavailable or invalid')));
    assert(!texts(ui).some(t=>t.includes('assignments complete (16.7%)')));
  }
  const ui=await render({unavailable:true});
  assert(spans(ui).includes('Roadmap 38%'));
  assert(spans(ui).includes('Work —'));
});

test('partial work never repairs or overrides invalid weighted roadmap accounting',async()=>{
  const broken=structuredClone(manifest);
  broken.roadmap.gates[6].weight=9;
  const ui=await render({m:broken});
  assert(spans(ui).includes('Roadmap —'));
  assert(spans(ui).includes('Work —'));
  assert(!spans(ui).includes('Roadmap 38%'));
  assert(!spans(ui).includes('Work 12/72'));
});

test('work status derives from committed Markdown; no static second completion counter',()=>{
  assert.match(widget,/getText\(config\.execution\.source\)/);
  assert.equal(Object.hasOwn(manifest.execution,'completed'),false);
  assert.equal(manifest.execution.source,'docs/parallel-development/DEVELOPMENT-QUEUE.md');
  assert.equal(manifest.roadmap.gates.filter(g=>g.status==='accepted')
    .reduce((a,g)=>a+g.weight,0),38);
});
