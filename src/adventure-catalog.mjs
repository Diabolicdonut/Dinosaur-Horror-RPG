// 009-A prototype catalog. Catalog imports authored packages; the generic
// schema/compiler does not import individual settings or scenario content.
import {AFTER_THE_STORM} from '../adventures/after-the-storm.mjs';
import {RIDGE_SURVEY} from '../adventures/ridge-survey.mjs?v=009b2b2a1';
import {compileAdventure,validateAdventureDefinition} from './adventure-definition.mjs?v=009b2b2a1';
const copies=Object.freeze({
 'nublar-after-the-storm':AFTER_THE_STORM,
 'ridge-survey':RIDGE_SURVEY
});
const deep=x=>JSON.parse(JSON.stringify(x));
export function listAdventureDefinitions(){
 return Object.keys(copies).map(id=>({id,title:copies[id].title,revision:copies[id].revision}));
}
export function getAdventureDefinition(id){
 if(!Object.hasOwn(copies,id))throw new RangeError('Unknown adventure definition.');
 return validateAdventureDefinition(deep(copies[id]));
}
export function compileSelectedAdventure(id,seed=1993){
 return compileAdventure(getAdventureDefinition(id),{seed});
}
