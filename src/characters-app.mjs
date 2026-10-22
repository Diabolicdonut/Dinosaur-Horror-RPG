import {
  ATTRIBUTES, SKILLS, CAREERS, CAREER_IDS, RULE_VERSION, generateCharacter,
  editCharacter, makeParty, validateCharacter, validateParty
} from './characters.mjs?v=007';

const $ = id => document.getElementById(id);
const STORE = 'dinosaur-character-lab-007';
const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let party = [];
let chosen = 0;
let seed = 1993;
const getLocks = c => new Set(c.generation?.locks || []);
const seedNumber = () => {
  const n=Number($('party-seed').value);
  return Number.isSafeInteger(n) && n>=0 && n<=4294967295?n:1993;
};
function notify(message) { $('status').textContent=message; }
function persist() {
  try { localStorage.setItem(STORE, JSON.stringify({seed,chosen,party,version:RULE_VERSION})); }
  catch { notify('Browser storage unavailable. Export your roster before closing.'); }
}
function ensure() {
  if (party.length) return;
  seed=seedNumber();
  party=makeParty({seed,size:3});
}
function option(value,label,selected) {
  return '<option value="'+esc(value)+'"'+(value===selected?' selected':'')+'>'+esc(label)+'</option>';
}
function lockButton(id,active) {
  return '<button type="button" class="lock'+(active?' active':'')+'" data-lock="'+esc(id)+'" aria-pressed="'+String(active)+'" title="'+(active?'Unlock':'Lock')+' '+esc(id)+'" aria-label="'+(active?'Unlock':'Lock')+' '+esc(id)+'">'+(active?'🔒':'🔓')+'</button>';
}
function editorField(id,label,value,locked,{min,max}={}) {
  const field = id==='name'||id==='agenda'?'text':'number';
  return '<div class="stack"><div class="field"><label>'+esc(label)+
   '<input type="'+field+'" data-edit="'+esc(id)+'" value="'+esc(value)+'"'+
   (field==='number'?' min="'+min+'" max="'+max+'" step="1"':' maxlength="'+(id==='name'?80:200)+'"')+
   '/></label></div>'+lockButton(id,locked)+'</div>';
}
function draw() {
  ensure();
  $('party-seed').value=String(seed);
  $('party-size').value=String(party.length);
  $('roster-count').textContent=party.length+' / 8';
  $('roster-list').innerHTML=party.map((c,i)=>{
    const issues=validateCharacter(c);
    return '<button type="button" data-select="'+i+'" class="roster-item'+(i===chosen?' selected':'')+'"><span><strong>'+esc(c.name||'Unnamed survivor')+'</strong><small>'+esc(CAREERS[c.career]?.label||'Unknown career')+'</small></span><span class="chip">'+(issues.length?issues.length+' ISSUE'+(issues.length>1?'S':''):'VALID')+'</span></button>';
  }).join('');
  const c=party[chosen];
  if (!c) { $('editor-root').innerHTML='<p class="empty">Select a survivor</p>';return; }
  const role=CAREERS[c.career];
  const locks=getLocks(c);
  const issues=validateCharacter(c);
  $('validation-pill').textContent=issues.length?issues.length+' ISSUES':'VALID';
  $('validation-pill').style.color=issues.length?'#e59a84':'#92ceb2';
  $('export-party').disabled=validateParty(party).length>0;
  const aPoints=Object.values(c.attributes).reduce((sum,v)=>sum+(Number(v)||0),0);
  const skPoints=Object.values(c.skills).reduce((sum,v)=>sum+(Number(v)||0),0);
  let body='<div class="editor-head"><div class="field" style="flex:1;min-width:210px"><label>Park career<select data-edit="career">'+CAREER_IDS.map(k=>option(k,CAREERS[k].label,c.career)).join('')+'</select></label></div><button type="button" id="reroll-character" class="secondary">Regenerate unlocked</button></div>';
  body+='<div class="section"><div class="fields">'+editorField('name','Character name',c.name,locks.has('name'))+
   editorField('agenda','Personal objective',c.agenda,locks.has('agenda'))+'</div></div>';
  body+='<div class="section"><div class="section-headline"><h3>Attributes</h3><span class="point-count">'+aPoints+' / 14 points · Resolve '+c.resolve+' · Health '+c.healthMax+'</span></div><div class="fields">';
  for(const a of ATTRIBUTES) body+=editorField('attributes.'+a,a[0].toUpperCase()+a.slice(1)+(a===role.keyAttribute?' ★':''),c.attributes[a],locks.has('attributes.'+a),{min:2,max:a===role.keyAttribute?5:4});
  body+='</div></div><div class="section"><div class="section-headline"><h3>Trained skills</h3><span class="point-count">'+skPoints+' / 10 points</span></div><div class="skills-grid">';
  for(const [k,label] of Object.entries(SKILLS)) body+=editorField('skills.'+k,label+(role.keySkills.includes(k)?' ★':''),c.skills[k],locks.has('skills.'+k),{min:0,max:role.keySkills.includes(k)?3:1});
  body+='</div><p class="note">★ Career specialty. Other skills remain available at level 0 or 1 during starting creation.</p></div>';
  body+='<div class="section"><div class="section-headline"><h3>Career talent</h3>'+lockButton('talent',locks.has('talent'))+'</div><select data-edit="talent">'+role.talents.map(t=>option(t,t,c.talent)).join('')+'</select><p class="note">Thematic starting talent is recorded but has no effect in the current live encounter engine.</p></div>';
  body+='<div class="section"><div class="section-headline"><h3>Starting equipment</h3>'+lockButton('gear',locks.has('gear'))+'</div><div class="gear-list">'+role.gear.map(item=>'<label><input type="checkbox" data-gear="'+esc(item)+'"'+(c.gear.includes(item)?' checked':'')+'/>'+esc(item)+'</label>').join('')+'</div><p class="note">Choose exactly two distinct pieces of starting equipment.</p></div>';
  body+='<div class="section"><h3>Rules check</h3><div class="'+(issues.length?'validation':'valid')+'">'+
    (issues.length?issues.map(e=>'<p>• '+esc(e)+'</p>').join(''):'All required Evolved-style starting budgets, career limits and derived attributes are valid.')+'</div></div>';
  body+='<div class="action-bar"><button id="reroll-character-bottom" type="button">Regenerate unlocked</button><button id="lock-all" type="button" class="secondary">Lock all fields</button><button id="unlock-all" type="button" class="secondary">Unlock all</button></div>';
  $('editor-root').innerHTML=body;
}
function markChanged(c, field) {
  const locks=getLocks(c);locks.add(field);
  c.generation={...c.generation,locks:[...locks]};
}
function editField(field, value) {
  const previous=party[chosen];
  if (!previous) return;
  if (field==='career') {
    if (!CAREERS[value]) return notify('Unknown career.');
    try {
      const next=generateCharacter({seed,index:chosen,revision:(previous.generation?.revision||0)+1,career:value,
        existing:previous,locks:getLocks(previous).has('name')?['name']:[]});
      markChanged(next,'career'); next.creationMethod='hybrid';
      party[chosen]=next; notify('Career changed. Attribute and skill budgets regenerated for its specialties.');
    } catch(error){notify(error.message);}
  } else {
    const patch={};
    if(field.startsWith('attributes.')||field.startsWith('skills.')) {
      const [part,key]=field.split('.');
      patch[part]={[key]: value===''?null:Number(value)};
    } else patch[field]=value;
    party[chosen]=editCharacter(previous,patch);
    markChanged(party[chosen],field);
  }
  persist();draw();
}
function regenOne(i) {
  const current=party[i], locks=[...getLocks(current)];
  const revision=(current.generation?.revision||0)+1;
  const next=generateCharacter({seed,index:i,revision,existing:current,locks,
    career:locks.includes('career')?current.career:null});
  next.creationMethod='hybrid';
  return next;
}
function regenerateSelected() {
  try {party[chosen]=regenOne(chosen);persist();draw();notify('Regenerated survivor '+(chosen+1)+'; locked values preserved.');}
  catch(err){notify('Cannot regenerate: '+err.message);}
}
function saveRoster() {
  const errors=validateParty(party);
  if(errors.length) {notify(errors.join(' '));return;}
  const payload={format:'dinosaur-party-draft',version:1,createdBy:'character-lab-007',rules:RULE_VERSION,seed,characters:party};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='dinosaur-party-seed-'+seed+'.json';
  document.body.append(a);a.click();a.remove();
  URL.revokeObjectURL(url);
  notify('Validated party exported. This is a roster draft, not an incident save.');
}
function fullLocks() {
  return ['career','name','agenda','talent','gear',...ATTRIBUTES.map(a=>'attributes.'+a),...Object.keys(SKILLS).map(k=>'skills.'+k)];
}
$('editor-root').addEventListener('change',event=>{
  const edit=event.target.closest('[data-edit]');
  if(edit){editField(edit.dataset.edit,edit.value);return;}
  const gear=event.target.closest('[data-gear]');
  if(gear) {
    const items=party[chosen].gear.filter(v=>v!==gear.dataset.gear);
    if(gear.checked)items.push(gear.dataset.gear);
    party[chosen]=editCharacter(party[chosen],{gear:items});
    markChanged(party[chosen],'gear');
    persist();draw();
  }
});
$('editor-root').addEventListener('click',event=>{
  const lock=event.target.closest('[data-lock]');
  if(lock) {
    const c=party[chosen], locked=getLocks(c), field=lock.dataset.lock;
    if(locked.has(field))locked.delete(field);else locked.add(field);
    c.generation={...c.generation,locks:[...locked]};
    persist();draw();return;
  }
  if(event.target.closest('#reroll-character')||event.target.closest('#reroll-character-bottom'))regenerateSelected();
  if(event.target.closest('#lock-all')) {
    party[chosen].generation.locks=fullLocks();persist();draw();
  }
  if(event.target.closest('#unlock-all')) {
    party[chosen].generation.locks=[];persist();draw();
  }
});
$('roster-list').addEventListener('click',event=>{
  const item=event.target.closest('[data-select]');
  if(!item)return;
  chosen=Number(item.dataset.select);persist();draw();
});
$('make-party').addEventListener('click',()=>{
  const size=Number($('party-size').value);const newSeed=seedNumber();
  try {const next=makeParty({seed:newSeed,size});party=next;seed=newSeed;chosen=0;persist();draw();notify('New '+size+'-member party generated.');}
  catch(error){notify(error.message);}
});
$('reroll-party').addEventListener('click',()=>{
  try {const next=party.map((_,i)=>regenOne(i));party=next;persist();draw();notify('Regenerated all unlocked values.');}
  catch(error){notify('Could not regenerate entire party: '+error.message);}
});
$('export-party').addEventListener('click',saveRoster);
try {
  const raw=localStorage.getItem(STORE);
  if(raw){
    const draft=JSON.parse(raw);
    if(draft?.version===RULE_VERSION && Number.isInteger(draft.seed) && Array.isArray(draft.party) &&
      draft.party.length>=1 && draft.party.length<=8){
      party=draft.party;seed=draft.seed;chosen=Math.max(0,Math.min(draft.party.length-1,draft.chosen||0));
      notify('Previous character lab draft restored.');
    }
  }
} catch {notify('Could not load prior draft; a new roster was created.');}
ensure();persist();draw();
