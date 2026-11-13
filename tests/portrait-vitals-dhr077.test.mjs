import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
 PORTRAIT_MIN,PORTRAIT_MAX,projectPortraitCards,renderPortraitVitals,mountPortraitVitals
} from '../src/portrait-vitals.mjs';

const crew=(n=4)=>Array.from({length:n},(_,i)=>({
 id:'pc-'+(i+1),name:'Survivor '+(i+1),observation:i===0?'self':'nearby',
 health:4,healthMax:4,stress:0,broken:false,dead:false,
 sheet:{career:'ranger',attributes:{strength:3,agility:3,wits:4,empathy:4},
  skills:{observation:2},inventory:['flashlight'],equipment:['radio'],talents:['steady hand']}
}));

test('DHR-077: 1–8 roster sizes render with four default grid slots, no fabricated empty survivors',async()=>{
 assert.equal(PORTRAIT_MIN,1);assert.equal(PORTRAIT_MAX,8);
 for(let n=1;n<=8;n++){
  const entries=crew(n);const cards=projectPortraitCards(entries,{observerId:'pc-1'});
  assert.equal(cards.length,n);
  const html=renderPortraitVitals(entries,{observerId:'pc-1'});
  assert.equal((html.match(/data-portrait-open=/g)||[]).length,n);
  assert.equal((html.match(/dhr-pv-monitor/g)||[]).length,n);
 }
 assert.throws(()=>projectPortraitCards([],{observerId:'pc-1'}),RangeError);
 assert.throws(()=>projectPortraitCards(crew(9),{observerId:'pc-1'}),RangeError);
 const css=await readFile(new URL('../src/portrait-vitals.css',import.meta.url),'utf8');
 assert.match(css,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
 assert.match(css,/max-width:640px/);
});

test('DHR-077: Health color reflects health points, while stress changes waveform only',()=>{
 const cards=crew(3);cards[1].health=2;cards[1].stress=4;
 cards[2].health=1;cards[2].stress=9;
 const projection=projectPortraitCards(cards,{observerId:'pc-1'});
 assert.deepEqual(projection.map(x=>x.healthTone),['healthy','wounded','critical']);
 assert.deepEqual(projection.map(x=>x.stressCue),['calm','elevated','intense']);
 assert.equal(projection[0].health,4);
 assert.equal(projection[1].healthMax,4);
 assert(!renderPortraitVitals(cards,{observerId:'pc-1'}).includes('BPM'));
});

test('DHR-077: zero Health and incapacitation never create a flatline or a death claim',()=>{
 const cards=crew(1);cards[0].health=0;cards[0].broken=true;cards[0].stress=8;
 const projection=projectPortraitCards(cards,{observerId:'pc-1'})[0];
 assert.equal(projection.dead,false);
 assert.equal(projection.stressCue,'intense');
 assert.equal(projection.healthTone,'critical');
 const html=renderPortraitVitals(cards,{observerId:'pc-1'});
 assert.match(html,/Incapacitated, not confirmed deceased/);
 assert.match(html,/dhr-pv-wave--intense/);
 assert.doesNotMatch(html,/dhr-pv-wave--deceased/);
 cards[0].broken=false;
 assert.match(renderPortraitVitals(cards,{observerId:'pc-1'}),/Zero Health, not confirmed deceased/);
});

test('DHR-077: only explicit, observable engine-confirmed death flatlines',()=>{
 const cards=crew(2);cards[0].health=0;cards[0].dead=true;
 cards[1].health=0;cards[1].dead=false;
 const normalized=projectPortraitCards(cards,{observerId:'pc-1'});
 assert.deepEqual(normalized.map(x=>x.dead),[true,false]);
 assert.deepEqual(normalized.map(x=>x.stressCue),['deceased','calm']);
 const html=renderPortraitVitals(cards,{observerId:'pc-1'});
 assert.equal((html.match(/dhr-pv-wave--deceased/g)||[]).length,1);
 assert.match(html,/Deceased \(engine confirmed\)/);
});

test('DHR-077: spectator/focus camera is not omniscient; remote and mismatched self are fully redacted',()=>{
 for(const controlMode of ['party','focus','spectator']){
  const cards=crew(3);cards[1].observation='remote';
  cards[1].health=0;cards[1].stress=30;cards[1].dead=true;
  cards[1].sheet.inventory=['unrevealed isotope'];
  cards[2].observation='self'; // Cannot claim another actor is the observer.
  const before=structuredClone(cards);
  const p=projectPortraitCards(cards,{observerId:'pc-1',controlMode});
  for(const idx of [1,2]){
   assert.equal(p[idx].known,false);
   assert.equal(p[idx].health,null);
   assert.equal(p[idx].stress,null);
   assert.equal(p[idx].dead,false);
   assert.equal(p[idx].sheet,null);
  }
  const html=renderPortraitVitals(cards,{observerId:'pc-1',controlMode,openId:'pc-2'});
  assert.match(html,/Status unknown from this viewpoint/);
  assert.doesNotMatch(html,/unrevealed isotope|Deceased \(engine confirmed\)|Stress 30/);
  assert.deepEqual(cards,before,'rendering never mutates engine or projection');
 }
});

test('DHR-077: absent, malformed or partially transmitted readings never become precise telemetry',()=>{
 const cards=crew(2);cards[1].stress=undefined;cards[1].dead=true;
 const proj=projectPortraitCards(cards,{observerId:'pc-1'});
 assert.equal(proj[1].known,false);
 assert.equal(proj[1].dead,false);
 assert.equal(proj[1].stressCue,'unknown');
 assert.doesNotMatch(renderPortraitVitals(cards,{observerId:'pc-1'}),/dhr-pv-wave--deceased/);
 cards[1].stress=31;
 assert.equal(projectPortraitCards(cards,{observerId:'pc-1'})[1].known,false);
 cards[1].stress=2;cards[1].health=5;
 assert.equal(projectPortraitCards(cards,{observerId:'pc-1'})[1].known,false);
});

test('DHR-077: view-only sheet never includes arbitrary raw GM/private fields or editing actions',()=>{
 const cards=crew(1);cards[0].name='<img src=x onerror=alert(1)>';
 cards[0].portraitUrl='javascript:alert(2)';
 cards[0].sheet={...cards[0].sheet,secretPlan:'unrevealed plan',
  attributes:{strength:4,secretMap:99},
  inventory:['medkit','<script>alert(3)</script>'],
  skills:{observation:2,secretMechanic:500}};
 const html=renderPortraitVitals(cards,{observerId:'pc-1',openId:'pc-1'});
 assert.match(html,/&lt;img src=x onerror=alert\(1\)&gt;/);
 assert.match(html,/&lt;script&gt;alert\(3\)&lt;\/script&gt;/);
 assert.doesNotMatch(html,/<script>|<img src=x|javascript:alert|unrevealed plan|secretMap|secretMechanic/);
 assert.match(html,/Inventory \(view only\)/);
 assert.doesNotMatch(html,/data-transfer|data-pickup|contenteditable|<input/);
 assert.match(html,/data-portrait-close/);
});

test('DHR-077: reduced-motion user preference and explicit still mode disable animation',async()=>{
 const html=renderPortraitVitals(crew(1),{observerId:'pc-1',reducedMotion:true});
 assert.match(html,/dhr-pv--reduced-motion/);
 assert.match(html,/dhr-pv-wave--still/);
 const css=await readFile(new URL('../src/portrait-vitals.css',import.meta.url),'utf8');
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/animation:none!important/);
});

test('DHR-077: duplicate or invalid IDs fail; views do not alter control ownership',()=>{
 const items=crew(2);items[1].id='pc-1';
 assert.throws(()=>projectPortraitCards(items,{observerId:'pc-1'}),RangeError);
 const cards=crew(2),snapshot=JSON.stringify(cards);
 renderPortraitVitals(cards,{observerId:'pc-1',openId:'pc-2',activeActorId:'pc-1'});
 assert.equal(JSON.stringify(cards),snapshot);
 assert.match(renderPortraitVitals(cards,{observerId:'pc-1',activeActorId:'pc-1'}),/dhr-pv-card--active/);
});

test('DHR-077: DOM mount can open, re-project, redact and tear down without game mutation',()=>{
 let handler=null;const focused=[];
 const root={innerHTML:'',addEventListener:(t,h)=>{assert.equal(t,'click');handler=h;},
  removeEventListener:(t,h)=>{assert.equal(t,'click');assert.equal(h,handler);handler=null;},
  contains:()=>true,querySelector:()=>({focus:()=>focused.push('close')}),
  querySelectorAll:()=>[]};
 const cards=crew(2);const frozen=JSON.stringify(cards);
 const controller=mountPortraitVitals(root,{characters:cards,observerId:'pc-1'});
 assert.match(root.innerHTML,/Survivor 2/);
 handler({target:{closest:selector=>selector==='[data-portrait-open]'?
  {getAttribute:()=> 'pc-2'}:null}});
 assert.match(root.innerHTML,/Character Sheet/);
 assert.deepEqual(focused,['close']);
 const detached=structuredClone(cards);detached[1].observation='remote';
 controller.update({characters:detached,observerId:'pc-1'});
 assert.doesNotMatch(root.innerHTML,/Character Sheet/);
 assert.equal(JSON.stringify(cards),frozen);
 controller.destroy();assert.equal(root.innerHTML,'');assert.equal(handler,null);
});
