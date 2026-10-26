// 009-B2b2a — fully compiled, seeded, data-only local circumstances.
// This service never rolls dice or mutates people, supplies, or creatures.
// No specific dinosaur species, adventure name, or objective is referenced.
import {validateCompiledAdventure} from './adventure-definition.mjs';

function choices(compiled){
 if(!validateCompiledAdventure(compiled))
  throw new RangeError('A validated, seeded AdventureInstance is required.');
 return Object.values(compiled.hiddenFacts);
}
export function passageCircumstance(compiled,from,to){
 return choices(compiled).map(c=>c.mechanic).find(m=>
  m?.kind==='passage_check'&&m.from===from&&m.to===to)||null;
}
export function objectiveCircumstance(compiled,objectiveId){
 return choices(compiled).map(c=>c.mechanic).find(m=>
  m?.kind==='objective_check'&&m.objectiveId===objectiveId)||null;
}
export function animalApproachCircumstance(compiled,creatureId,room){
 const original=compiled.definition.initialCreatures.find(d=>d.id===creatureId);
 return choices(compiled).map(c=>c.mechanic).find(m=>
  m?.kind==='animal_response'&&m.creatureId===creatureId&&
  original?.location===room)||null;
}
// Only a visible clue in the actor's present physical room may be narrated.
// Do NOT return hidden IDs, facts, the source seed or remote clues.
export function localSituationCues(compiled,room){
 return choices(compiled).filter(c=>c.clueRoom===room)
  .map(c=>({text:c.description}));
}
