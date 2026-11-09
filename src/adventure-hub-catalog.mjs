// UI-01 foundation: the Adventure Hub must never treat illustrative prototype cards
// as compiled, runnable scenario packages. No GM/private manifest state is exposed.
import {listAdventureDefinitions} from './adventure-catalog.mjs';

export const PROTOTYPE_TO_RUNTIME = Object.freeze({
  storm: 'nublar-after-the-storm',
  count: 'ridge-survey',
  tidal: 'tidal-nursery'
});
const PLAYABLE_META = Object.freeze({
  'nublar-after-the-storm': Object.freeze({
    artKey: 'storm', subtitle: 'The evacuation is over. You remain.',
    tone: 'Survival · Suspense', teaser: 'A recovery team must navigate a damaged island after the evacuation.'
  }),
  'ridge-survey': Object.freeze({
    artKey: 'count', subtitle: 'The interior holds more than field notes.',
    tone: 'Exploration · Mystery', teaser: 'An expedition sets out to recover field research in the island interior.'
  }),
  'tidal-nursery': Object.freeze({
    artKey: 'tidal', subtitle: 'A sanctuary between the tides.',
    tone: 'Wonder · Exploration', teaser: 'A survey explores an estuary where careful observation may matter most.'
  })
});
const PREVIEW_ONLY = Object.freeze([
  Object.freeze({id:'preview:research',title:'Research B',artKey:'research',
    subtitle:'An abandoned research complex',tone:'Mystery · Suspense'}),
  Object.freeze({id:'preview:breach',title:'Paddock Breach',artKey:'breach',
    subtitle:'Containment warning',tone:'Action · Survival Horror'}),
  Object.freeze({id:'preview:convoy',title:'The Lost Convoy',artKey:'convoy',
    subtitle:'The last signal came from the jungle',tone:'Suspense · Survival'}),
  Object.freeze({id:'preview:custom',title:'Custom Adventure',artKey:'custom',
    subtitle:'Prototype-only scenario generator',tone:'Procedural · Flexible'})
]);
/**
 * Player-facing catalog projection only. Compiled adventure identity and revision
 * come from the repository's true catalog; artwork and teaser are deliberately
 * original/public preview copy rather than material copied from secret manifests.
 *
 * A "campaign" choice is not advertised as runnable until a real campaign runtime
 * exists, even when the uploaded HTML demo labels Long Count as a campaign.
 */
export function listHubScenarios({includePreviews=true}={}){
  const live=listAdventureDefinitions().map(({id,title,revision})=>{
    const meta=PLAYABLE_META[id]||{artKey:'custom',subtitle:'Original adventure',tone:'Survival · Exploration',
      teaser:'An authored incident from the validated scenario catalog.'};
    return Object.freeze({id,title,revision,kind:'adventure',artKey:meta.artKey,
      subtitle:meta.subtitle,tone:meta.tone,teaser:meta.teaser,launchable:true,status:'playable'});
  });
  const previews=includePreviews?PREVIEW_ONLY.map(x=>Object.freeze({
    ...x,revision:null,kind:'preview',teaser:'Concept preview only; this is not a playable adventure.',
    launchable:false,status:'preview-only'
  })):[];
  return Object.freeze([...live,...previews]);
}
/** Never accept a demo/procedural preview ID as a real scenario launch. */
export function resolveHubLaunchScenario(id){
  if(typeof id!=='string')throw new RangeError('Unknown or unimplemented adventure.');
  const option=listHubScenarios({includePreviews:false}).find(x=>x.id===id);
  if(!option)throw new RangeError('Unknown or unimplemented adventure.');
  return Object.freeze({adventureId:option.id,revision:option.revision});
}
