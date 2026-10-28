// 009-D2: original estuary scenario supports source-driven supporting characters.
// Quiet ecological wonder and uncertain weather; no mandatory predator.
export const TIDAL_NURSERY={
 schemaVersion:1,id:'tidal-nursery',revision:2,
 title:'The Tidal Nursery',
 premise:'At an estuary nursery, a field team must retrieve migration readings and secure a safe return before the incoming tide.',
 start:'supply-shelter',
 rooms:{
  'supply-shelter':{name:'Estuary Supply Shelter',
   description:'An open timber hut overlooks the marsh. The tide charts are incomplete, and a herd calls somewhere beyond the reeds.',
   exits:['reed-walk','signal-knoll'],aliases:['shelter','hut','base'],items:['tide-chart']},
  'reed-walk':{name:'Reed Boardwalk',
   description:'A narrow raised path leads over shallow water where enormous, gentle animals feed among the grasses.',
   exits:['supply-shelter','nesting-pool'],aliases:['walk','boardwalk'],items:[]},
  'nesting-pool':{name:'Nesting Pool',
   description:'Long-necked shapes move peacefully through the water. A waterproof instrument case rests by a low measurement post.',
   exits:['reed-walk','signal-knoll'],aliases:['pool','nest'],items:['sample-case']},
  'signal-knoll':{name:'Signal Knoll',
   description:'A short ridge above the estuary carries the old field antenna and a clear path back to the shelter.',
   exits:['nesting-pool','supply-shelter'],aliases:['knoll','ridge','antenna'],items:[]}
 },
 startItems:['field-radio'],
 itemNames:{'tide-chart':'Tide chart','sample-case':'Waterproof sample case',
  'field-radio':'Field radio'},
 flags:{samplesSecured:false,signalSent:false,returned:false},
 objectives:[
  {id:'recover-samples',description:'Retrieve the estuary migration readings without disturbing the nursery.',
   room:'nesting-pool',requires:[],interaction:{target:'migration readings',skill:'observation'},
   effects:[{type:'flag',name:'samplesSecured',value:true}]},
  {id:'signal-field-team',description:'Relay the verified nursery readings from the signal knoll.',
   room:'signal-knoll',requires:['recover-samples'],
   interaction:{target:'field antenna',skill:'comtech'},
   effects:[{type:'flag',name:'signalSent',value:true}]},
  {id:'return-to-shelter',description:'Return to the shelter with the completed observations.',
   room:'supply-shelter',requires:['signal-field-team'],
   interaction:{target:'secure the expedition',skill:null},
   effects:[{type:'flag',name:'returned',value:true},{type:'end',outcome:'completed'}]}
 ],
 supportingCast:[
  {id:'mara-venn',name:'Mara Venn',role:'Estuary logistics coordinator',
   description:'Mara checks tide charts beneath the shelter awning. She does not leave the base.',
   motive:'Keep the expedition safe and the evidence reliable without promising dramatic sightings.',
   location:'supply-shelter',stance:'cooperative',
   topics:[
    {id:'routes',prompt:'Ask Mara about the field routes',
     reply:'The boardwalk reaches the nursery. The knoll offers another connected way in. Take the route that is safe under the conditions you can actually see.'},
    {id:'safe-return',prompt:'Tell Mara the field signal was sent',
     requires:{kind:'objective',id:'signal-field-team'},
     reply:'We have a confirmed transmission. Bring everyone back by the connected trail and we can close the expedition.'}
   ]},
  {id:'ivo-pell',name:'Ivo Pell',role:'Nursery ecologist',
   description:'Ivo watches the animals from the low instrument post and will carry his notes back after the samples are recovered.',
   motive:'Protect the nesting site, and avoid reading predator behavior into ordinary animal caution.',
   location:'nesting-pool',stance:'cautious',
   autonomy:{kind:'return_route',trigger:{kind:'objective',id:'recover-samples'},
    path:['nesting-pool','reed-walk','supply-shelter'],cadence:1},
   topics:[
    {id:'herd',prompt:'Ask Ivo about the nursery herd',
     reply:'The grazers are feeding here on their own terms. Keep your distance and observe how they use the water.'},
    {id:'observations',prompt:'Compare the recovered migration readings',
     requires:{kind:'objective',id:'recover-samples'},
     reply:'Those measurements are useful because we actually collected them. The report should say no more than the evidence supports.'}
   ]}
 ],
 initialCreatures:[
  {id:'nursery-grazer',species:'parasaurolophus',
   location:'nesting-pool',disposition:'neutral'}
 ],
 variants:{
  estuaryConditions:[
   {id:'spring-tide',fact:'rising_tide',clueRoom:'reed-walk',
    description:'The boardwalk is partially awash; the route to the nursery needs careful footing.',
    mechanic:{kind:'passage_check',from:'reed-walk',to:'nesting-pool',skill:'mobility',modifier:-2}},
   {id:'radio-interference',fact:'weak_antenna',clueRoom:'signal-knoll',
    description:'Salt spray has corroded the antenna contacts and makes a reliable transmission difficult.',
    mechanic:{kind:'objective_check',objectiveId:'signal-field-team',modifier:-2}}
  ]
 }
};
