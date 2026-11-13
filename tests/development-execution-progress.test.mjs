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
const rows=queue.split('\n').filter(l=>/^\| DHR-\d{3} \|/.test(l))
  .map(l=>l.split('|').slice(1,-1).map(v=>v.trim()));
const countBy=status=>rows.filter(r=>r[1]===status).length;
const done=countBy('**Done**'),ready=countBy('**Ready**');
const blocked=countBy('Blocked'),total=rows.length;
const accepted=manifest.roadmap.gates
  .filter(g=>g.status==='accepted').reduce((s,g)=>s+g.weight,0);
const percent=n=>Math.round(1000*n/total)/10;
const gateStats=id=>{
  const linked=rows.filter(r=>r[2].split(',').map(Number).includes(id));
  return {total:linked.length,
    done:linked.filter(r=>r[1]==='**Done**').length,
    ready:linked.filter(r=>r[1]==='**Ready**').length,
    blocked:linked.filter(r=>r[1]==='Blocked').length};
};

function node(tagName){
  return {tagName,children:[],attributes:{},className:'',textContent:'',
    append(...items){this.children.push(...items)},
    setAttribute(k,v){this.attributes[k]=v}};
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
const gateSummaries=ui=>ui.all.filter(n=>n.tagName==='summary')
  .filter(n=>n.attributes['aria-label']?.includes('view acceptance requirements'));
const gateDetail=(ui,id)=>{
  const gate=manifest.roadmap.gates[id-1];
  return gateSummaries(ui).find(n=>n.children[0]?.textContent===gate.label);
};

test('completed work is derived from the actual queue, never the accepted whole-game score',async()=>{
  assert.equal(manifest.execution.total,total);
  assert.equal(done+ready+blocked,total);
  assert(total>0&&done>0,'queue has actual completed work');
  const ui=await render();
  assert(spans(ui).includes('Roadmap '+accepted+'%'));
  assert(spans(ui).includes('Work '+done+'/'+total));
  assert(texts(ui).includes(accepted+' of 100 weighted delivery points accepted'));
  assert(texts(ui).includes(done+' of '+total+' assignments complete ('+percent(done)+'%)'));
  assert(texts(ui).includes(ready+' ready · '+blocked+' dependency-blocked'));
  assert(texts(ui).some(s=>s.includes('task counts are not weighted points')));
  assert(bars(ui).some(b=>b.value===done&&b.max===total&&
    b.attributes['aria-label']==='Completed developer assignments'));
  assert.equal(ui.frame.attributes['aria-label'],'Project revision and roadmap completion');
});

test('every roadmap gate shows correct linked work status independent of gate acceptance',async()=>{
  const ui=await render();
  assert.equal(gateSummaries(ui).length,manifest.roadmap.gates.length);
  for(let id=1;id<=manifest.roadmap.gates.length;id++){
    const gate=manifest.roadmap.gates[id-1],stats=gateStats(id);
    const summary=gateDetail(ui,id);
    assert(summary,'missing '+gate.id);
    const text=summary.children.map(x=>x.textContent).join(' / ');
    assert(text.includes(gate.status+' · '+gate.weight+'pt'+
      (stats.total?' · '+stats.done+'/'+stats.total+' tasks':'')),gate.id);
    if(stats.total){
      assert(bars(ui).some(b=>b.value===stats.done&&b.max===stats.total&&
        b.attributes['aria-label']===gate.label+' linked development tasks completed'),gate.id);
      assert(texts(ui).includes(stats.done+' completed · '+stats.ready+
        ' ready · '+stats.blocked+' blocked ('+
        Math.round(100*stats.done/stats.total)+'% of linked tasks)'),gate.id);
    }
  }
});

test('newly accepted assignment changes linked gate counts but not whole-game acceptance',async()=>{
  const task=rows.find(r=>r[1]==='**Ready**');
  if(!task){assert.equal(done,total);return;}
  const token='| '+task[0]+' | **Ready** |';
  const changed=queue.replace(token,'| '+task[0]+' | **Done** |');
  assert.notEqual(changed,queue);
  const ui=await render({q:changed});
  assert(spans(ui).includes('Work '+(done+1)+'/'+total));
  assert(spans(ui).includes('Roadmap '+accepted+'%'));
  assert(texts(ui).includes((done+1)+' of '+total+
    ' assignments complete ('+percent(done+1)+'%)'));
  assert(texts(ui).includes((ready-1)+' ready · '+blocked+' dependency-blocked'));
  for(const gateId of task[2].split(',').map(Number)){
    const stats=gateStats(gateId),gate=manifest.roadmap.gates[gateId-1];
    const label=gateDetail(ui,gateId).children.map(x=>x.textContent).join(' / ');
    assert(label.includes(gate.status+' · '+gate.weight+'pt · '+
      (stats.done+1)+'/'+stats.total+' tasks'));
  }
  assert(texts(ui).includes(accepted+' of 100 weighted delivery points accepted'));
});

test('invalid or truncated live queue fails closed without changing weighted score',async()=>{
  const task=rows.find(r=>r[0]==='DHR-012')??rows[0],id=task[0],status=task[1],
    mapped=task[2];
  const row='| '+id+' | '+status+' | '+mapped+' |';
  const mutations=[
    q=>q.replace('| '+id+' |','| DHR-999 |'),
    q=>q.replace('| '+id+' |','| '+rows.find(r=>r[0]!==id)[0]+' |'),
    q=>q.replace(row,'| '+id+' | Completed | '+mapped+' |'),
    q=>q.replace(row,'| '+id+' | '+status+' | 22 |'),
    q=>q.split('\n').filter(l=>!l.startsWith('| '+id+' |')).join('\n'),
    q=>q.replace(row,'| '+id+' | '+status+' | '+mapped+','+mapped.split(',')[0]+' |')
  ];
  for(const mutate of mutations){
    const next=mutate(queue);
    assert.notEqual(next,queue);
    const ui=await render({q:next});
    assert(spans(ui).includes('Roadmap '+accepted+'%'));
    assert(spans(ui).includes('Work —'));
    assert(texts(ui).some(t=>t.includes('Assignment status unavailable or invalid')));
  }
  const missing=await render({unavailable:true});
  assert(spans(missing).includes('Roadmap '+accepted+'%'));
  assert(spans(missing).includes('Work —'));
});

test('invalid overall roadmap cannot be masked by apparently valid task counts',async()=>{
  const broken=structuredClone(manifest);
  broken.roadmap.gates[6].weight++;
  const ui=await render({m:broken});
  assert(spans(ui).includes('Roadmap —'));
  assert(spans(ui).includes('Work —'));
  assert(!spans(ui).includes('Roadmap '+accepted+'%'));
  assert(!spans(ui).includes('Work '+done+'/'+total));
});

test('execution source is authoritative checked-in Markdown, never a second static earned score',()=>{
  assert.match(widget,/getText\(config\.execution\.source\)/);
  assert.equal(Object.hasOwn(manifest.execution,'completed'),false);
  assert.equal(manifest.execution.source,'docs/parallel-development/DEVELOPMENT-QUEUE.md');
  assert.equal(manifest.roadmap.gates.reduce((sum,g)=>sum+g.weight,0),100);
  assert.equal(manifest.progress.completed,5);
});
