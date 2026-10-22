import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {
 ATTRIBUTES, SKILLS, CAREERS, CAREER_IDS, RULE_VERSION, derived, validateCharacter,
 validateParty, generateCharacter, makeParty, editCharacter
} from '../src/characters.mjs';

test('all nine themed careers preserve documented Evolved reference attribute/skill pairings', () => {
 assert.equal(CAREER_IDS.length,9);
 assert.equal(ATTRIBUTES.length,4);
 assert.equal(Object.keys(SKILLS).length,12);
 for(const c of Object.values(CAREERS)){
   assert(ATTRIBUTES.includes(c.keyAttribute));
   assert.equal(new Set(c.keySkills).size,3);
   assert.equal(c.keySkills.length,3);
   assert.equal(c.talents.length,3);
   assert(c.gear.length>=2);
 }
 assert.equal(CAREERS.maintenance.keyAttribute,'strength');
 assert.deepEqual(CAREERS.ranger.keySkills,['observation','ranged_combat','command']);
 assert.deepEqual(CAREERS.medic.keySkills,['mobility','observation','medical_aid']);
});
test('generated characters are legal at all nine careers across 120 seeds',()=>{
 for(let n=1;n<=120;n++)for(const role of CAREER_IDS){
   const c=generateCharacter({seed:n,index:0,career:role});
   assert.deepEqual(validateCharacter(c),[],role+' seed '+n);
   assert.equal(Object.values(c.attributes).reduce((a,b)=>a+b,0),14);
   assert.equal(Object.values(c.skills).reduce((a,b)=>a+b,0),10);
   assert.equal(c.resolve,Math.ceil((c.attributes.wits+c.attributes.empathy)/2));
   assert.equal(c.healthMax,Math.ceil((c.attributes.strength+c.attributes.agility)/2));
   assert.equal(c.gear.length,2);
 }
});
test('no generated untrained or non-career skill becomes illegally high',()=>{
 for(let n=1;n<=90;n++){
  const c=generateCharacter({seed:n,index:n%8});
  const role=CAREERS[c.career];
  for(const k of Object.keys(SKILLS))
   assert(c.skills[k]>=0&&c.skills[k]<=(role.keySkills.includes(k)?3:1));
  for(const k of ATTRIBUTES)
   assert(c.attributes[k]>=2&&c.attributes[k]<=(k===role.keyAttribute?5:4));
 }
});
test('party roster is deterministic, has unique actor IDs, and supports full custom career choices',()=>{
 const cfg={seed:8475,size:8,careers:CAREER_IDS.slice(0,8)};
 const a=makeParty(cfg),b=makeParty(cfg);
 assert.deepEqual(a,b);
 assert.equal(new Set(a.map(c=>c.id)).size,8);
 assert.deepEqual(validateParty(a),[]);
 assert.equal(a[3].career,CAREER_IDS[3]);
 assert.throws(()=>makeParty({size:0}),RangeError);
 assert.throws(()=>makeParty({size:9}),RangeError);
 assert( validateParty([a[0],a[0]]).some(e=>e.includes('Duplicate')) );
});
test('the independent character creation seed does not modify an incident or shared state',()=>{
 const seed=30001;
 const first=generateCharacter({seed,index:1});
 const other=generateCharacter({seed,index:4});
 const second=generateCharacter({seed,index:1});
 assert.deepEqual(first,second);
 assert.equal(other.id,'pc-5');
 assert.equal(first.generation.rules,RULE_VERSION);
});
test('hybrid generation preserves individually locked attributes, skills, talent, identity, and equipment',()=>{
 const c=generateCharacter({seed:333,index:1,career:'scientist'});
 const locked=['career','name','attributes.wits','skills.observation','talent','gear','agenda'];
 const next=generateCharacter({seed:333,index:1,revision:1,existing:c,locks:locked,career:'scientist'});
 assert.deepEqual(validateCharacter(next),[]);
 assert.equal(next.name,c.name);
 assert.equal(next.attributes.wits,c.attributes.wits);
 assert.equal(next.skills.observation,c.skills.observation);
 assert.equal(next.talent,c.talent);
 assert.deepEqual(next.gear,c.gear);
 assert.equal(next.agenda,c.agenda);
 assert.equal(next.career,c.career);
});
test('hybrid lock conflicts produce errors instead of silently breaking Evolved budgets',()=>{
 const start=generateCharacter({seed:7,index:0,career:'medic'});
 const bad=structuredClone(start);
 bad.attributes={strength:5,agility:5,wits:5,empathy:5};
 assert.throws(()=>generateCharacter({seed:7,index:0,revision:1,existing:bad,
 locks:['career',...ATTRIBUTES.map(a=>'attributes.'+a)]}),RangeError);
 const mismatch=structuredClone(start);
 mismatch.skills.heavy_machinery=3;
 assert.throws(()=>generateCharacter({seed:7,index:0,revision:1,existing:mismatch,
 career:'medic',locks:['skills.heavy_machinery']}),RangeError);
});
test('manual invalid edits are visible to the user until corrected, never silently accepted',()=>{
 const c=generateCharacter({seed:9,index:0,career:'ranger'});
 const invalid=editCharacter(c,{attributes:{strength:10}});
 assert(validateCharacter(invalid).some(e=>e.includes('Attributes')));
 const badGear=editCharacter(c,{gear:['flashlight','flashlight']});
 assert(validateCharacter(badGear).some(e=>e.includes('distinct')));
 const repaired=editCharacter(invalid,{attributes:{strength:c.attributes.strength}});
 assert.deepEqual(validateCharacter(repaired),[]);
 assert.equal(repaired.creationMethod,'manual');
});
test('actor data is independent across generated party members',()=>{
 const roster=makeParty({seed:11,size:3});
 const after=structuredClone(roster);
 after[0].skills.survival=0;after[0].stress=6;after[0].gear.push('extra');
 assert.deepEqual(roster,makeParty({seed:11,size:3}));
 assert.notDeepEqual(after[0],after[1]);
});
test('invalid IDs, unknown career, extra talents and incorrect derived values are rejected',()=>{
 const c=generateCharacter({seed:17,index:2,career:'pilot'});
 assert(validateCharacter({...c,id:'bad'}).length);
 assert(validateCharacter({...c,career:'other'}).length);
 assert(validateCharacter({...c,talent:'Imaginary Talent'}).length);
 assert(validateCharacter({...c,healthMax:99}).length);
});
test('personnel lab has independent save key, creator controls and versioned module',async()=>{
 const page=await readFile(new URL('../characters.html',import.meta.url),'utf8');
 const app=await readFile(new URL('../src/characters-app.mjs',import.meta.url),'utf8');
 assert(page.includes('PERSONNEL REGISTRY') || page.includes('PERSONNEL <span>REGISTRY'));
 for (const id of ['party-size','party-seed','make-party','reroll-party','export-party','roster-list','editor-root'])
  assert(page.includes('id="'+id+'"'));
 assert(page.includes('./src/characters-app.mjs?v=007b'));
 assert(app.includes("dinosaur-character-lab-007"));
 assert(app.includes('data-edit="talent"'));
 assert(app.includes("generateCharacter("));
 assert(!app.includes('dinosaur-rpg-save'), 'must not overwrite live incident saves');
 assert(page.includes('id="dice-lab"'));
 for(const id of ['roll-skill','roll-context','roll-stress','roll-modifier','roll-push','roll-seed','roll-show-dice','run-check','rerun-check','roll-result']) assert(page.includes('id="'+id+'"'));
 assert(app.includes("import {resolveSkillCheck} from './evolved-checks.mjs?v=007b'"));
 assert(app.includes("resolveSkillCheck(c,"));
});

test('new browser creator module and deterministic career model both parse as JavaScript',()=>{
 for(const path of ['../src/characters.mjs','../src/characters-app.mjs']){
  const file=new URL(path,import.meta.url);
  const result=spawnSync(process.execPath,['--check',file.pathname],{encoding:'utf8'});
  assert.equal(result.status,0, path+': '+result.stderr);
 }
});
