import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const root=new URL('../',import.meta.url);
const load=async name=>readFile(new URL(name,root),'utf8');
const manifest=JSON.parse(await load('site-progress.json'));
const state=JSON.parse(await load('project-state.json'));
const script=await load('site-progress.js');
const roadmap=manifest.roadmap;
const points=gates=>gates.reduce((sum,g)=>sum+g.weight,0);
const accepted=gates=>points(gates.filter(g=>g.status==='accepted'));

test('009-R1: complete 18-gate roadmap is conservative, fixed to 100 and distinct from foundation',()=>{
 assert.equal(manifest.schemaVersion,1);
 assert.equal(roadmap.gates.length,18);
 assert.equal(points(roadmap.gates),100);
 assert.equal(accepted(roadmap.gates),38);
 assert.equal(roadmap.gates.filter(g=>g.status==='accepted').length,6);
 assert.equal(manifest.progress.completed,5);
 assert.equal(manifest.progress.total,8);
 assert.equal(Math.round(manifest.progress.completed/manfiTotal()*100),63);
 function manfiTotal(){return manifest.progress.total;}
 assert.equal(manifest.revisionSource.path,'version');
 assert.equal(manifest.revisionSource.file,'project-state.json');
 assert.equal('v'+state.version,manifest.revision);
 assert.equal(state.checkpoint,'009-D1');
 assert.equal(state.automated_tests,657);
 assert.equal(state.roadmap_coverage.accepted_weight,38);
 assert.equal(state.roadmap_coverage.gates,18);
 assert.equal(state.roadmap_coverage.total_weight,100);
});
test('009-R1: all published gates have unique IDs, source evidence and explicit acceptance boundaries',async()=>{
 const seen=new Set();
 for(const gate of roadmap.gates){
  assert.match(gate.id,/^[a-z0-9-]{2,64}$/);
  assert(!seen.has(gate.id),gate.id);
  seen.add(gate.id);
  assert.match(gate.label,/\S/);
  assert.ok(Number.isInteger(gate.weight)&&gate.weight>0);
  assert.ok(['accepted','partial','planned'].includes(gate.status));
  assert.ok(gate.acceptance.length>50,gate.id+' requires a substantial acceptance condition');
  assert.ok(gate.evidence.length>10);
  for(const p of gate.evidence.split(';').map(x=>x.trim())){
   assert.ok(!p.startsWith('/'),p);
   assert.ok(!p.includes('..'),p);
   await access(new URL(p,root));
  }
 }
});
test('009-R1: major user-approved project goals have independently tracked remaining gates',()=>{
 const pending=new Set(roadmap.gates.filter(g=>g.status!=='accepted').map(g=>g.id));
 for(const id of ['evolved-full-parity','offensive-combat','human-npc-agency',
  'scenario-independence','character-creation','ai-gamemother','authored-replayability',
  'cinematic-generator','campaign-generator','wonder-dread','graphical-qa',
  'trusted-gm-secrets'])assert.ok(pending.has(id),id);
});
test('009-R1: documentation and all three browser entry points publish consistent scope',async()=>{
 const doc=await load('docs/ROADMAP-COVERAGE.md');
 const plan=await load('docs/DINOSAUR-EVOLVED-IMPLEMENTATION-PLAN.md');
 const readme=await load('README.md');
 for(const gate of roadmap.gates)assert.ok(doc.includes(gate.label),gate.id);
 assert.ok(doc.includes('38 / 100 = 38%'));
 assert.match(doc,/5 \/ 8 = 62\.5%/);
 assert.ok(plan.includes('18 explicitly accepted/partial/planned gates'));
 assert.ok(readme.includes('18 approved delivery gates'));
 for(const page of ['index.html','party.html','characters.html']){
  const html=await load(page);
  assert.ok(html.includes('<script defer src="./site-progress.js" data-site-progress></script>'),page);
 }
});
function node(tagName){
 return {tagName,children:[],attributes:{},className:'',textContent:'',
  append(...items){this.children.push(...items)},
  setAttribute(key,value){this.attributes[key]=value}};
}
function walk(n){return [n,...(n.children||[]).flatMap(walk)];}
async function render(config){
 const ui={};
 const document={
  currentScript:{src:'https://diabolicdonut.github.io/Dinosaur-Horror-RPG/site-progress.js'},
  readyState:'complete',
  getElementById:()=>null,
  createElement:node,
  head:{appendChild(element){ui.style=element}},
  body:{appendChild(element){ui.frame=element}}
 };
 const fetch=async url=>{
  const file=new URL(url).pathname.split('/').pop();
  const data=file==='site-progress.json'?config:
   file==='project-state.json'?state:null;
  if(!data)return {ok:false,text:async()=>''};
  return {ok:true,text:async()=>JSON.stringify(data)};
 };
 runInNewContext(script,{document,fetch,URL});
 // The script mounts asynchronously after two JSON source reads.
 for(let i=0;i<12&&!ui.frame;i++)await new Promise(resolve=>setImmediate(resolve));
 assert.ok(ui.frame,'status widget should mount');
 return {frame:ui.frame,all:walk(ui.frame)};
}
test('009-R1: real browser widget renders 38% roadmap, 63% foundation, expandable criteria',async()=>{
 const ui=await render(manifest);
 const labels=ui.all.filter(x=>x.tagName==='span').map(x=>x.textContent);
 assert.ok(labels.includes('Rev '+manifest.revision));
 assert.ok(labels.includes('Roadmap 38%'));
 assert.ok(ui.all.some(x=>x.textContent==='38 of 100 weighted delivery points accepted'));
 assert.ok(ui.all.some(x=>x.textContent==='5 of 8 tracked units complete'));
 const criteria=ui.all.filter(x=>x.className==='p-criteria');
 assert.equal(criteria.length,18);
 assert.ok(criteria.some(x=>x.textContent.includes('advancement')));
 const statusList=ui.all.filter(x=>x.tagName==='li');
 assert.equal(statusList.length,18);
 assert.equal(ui.frame.attributes['aria-label'],'Project revision and roadmap completion');
});
test('009-R1: invalid or incomplete accounting withholds overall completion, not a guessed percentage',async()=>{
 for(const mutate of [
  x=>x.roadmap.gates[0].weight++,
  x=>x.roadmap.gates[1].id=x.roadmap.gates[0].id,
  x=>{delete x.roadmap.gates[0].acceptance;},
  x=>{x.roadmap.gates[2].status='unverified';}
 ]){
  const broken=structuredClone(manifest);mutate(broken);
  const ui=await render(broken);
  const spans=ui.all.filter(x=>x.tagName==='span').map(x=>x.textContent);
  assert.ok(spans.includes('Roadmap —'));
  assert.ok(ui.all.some(x=>x.textContent==='Roadmap accounting is invalid; overall percentage withheld.'));
  assert.ok(!spans.includes('Roadmap 38%'));
 }
});
test('009-R1: accepted roadmap weight remains conserved across D1 multi-package development',()=>{
 assert.equal(state.version,'0.7.38');
 assert.equal(state.checkpoint,'009-D1');
 assert.equal(state.automated_tests,657);
 assert.equal(state.adventure_multi_package_009d1.sourceAdventure,'adventures/tidal-nursery.mjs');
 assert.equal(state.npc_eyewitness_009c5.status,'accepted','keep prior eyewitness milestone evidence');
 assert.equal(state.roadmap_coverage.manual_graphical_qa,'not yet completed');
 assert.match(state.roadmap_coverage.source_update,/009-C5/);
 assert.equal(state.roadmap_coverage.accepted_weight,38);
});
