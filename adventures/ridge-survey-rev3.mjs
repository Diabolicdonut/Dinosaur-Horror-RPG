// Immutable research revision 3, preserved exactly to honor existing saved bindings.
export const RIDGE_SURVEY_REV3={
 schemaVersion:1,id:'ridge-survey',revision:3,
 title:'The Long Count',premise:'A research team tracks migrating dinosaurs and must recover ecological survey data before worsening weather.',
 start:'field-camp',
 rooms:{
  'field-camp':{name:'Canvas Research Camp',description:'Quiet tents, solar batteries, and weather instruments overlook an upland basin.',
   exits:['rocky-ascent','river-crossing'],aliases:['camp','tents'],items:['field-notes']},
  'rocky-ascent':{name:'Rocky Ascent',description:'Loose scree offers a good vantage but makes every climb demanding.',
   exits:['field-camp','survey-ridge'],aliases:['ascent','scree'],items:[]},
  'survey-ridge':{name:'Survey Ridge',description:'An observation tripod looks over a far valley where animals browse.',
   exits:['rocky-ascent','forest-blind'],aliases:['ridge','tripod'],items:['lens-kit']},
  'river-crossing':{name:'River Crossing',description:'A low ford leads toward the shaded observation hide.',
   exits:['field-camp','forest-blind'],aliases:['ford','river'],items:['rope-coil']},
  'forest-blind':{name:'Forest Observation Blind',description:'An empty hide contains old study markers and windblown leaves.',
   exits:['survey-ridge','river-crossing'],aliases:['blind','hide'],items:['tag-reader']}
 },
 startItems:['field-radio'],
 itemNames:{'field-notes':'Survey notebooks','lens-kit':'Camera lens kit',
  'rope-coil':'Emergency rope','tag-reader':'Wildlife tag reader','field-radio':'Portable short-range radio'},
 flags:{dataRecovered:false,reportSent:false,teamWithdrawn:false},
 objectives:[
  {id:'recover-transect',description:'Recover the ecology observations from the blind.',
   room:'forest-blind',requires:[],interaction:{target:'survey records',skill:'observation'},
   effects:[{type:'flag',name:'dataRecovered',value:true}]},
  {id:'send-field-report',description:'Submit the observation report from the ridge.',
   room:'survey-ridge',requires:['recover-transect'],
   interaction:{target:'field transmitter',skill:'comtech'},
   effects:[{type:'flag',name:'reportSent',value:true}]},
  {id:'walk-out',description:'Return to camp before nightfall; no helicopter rescue is required.',
   room:'field-camp',requires:['send-field-report'],
   interaction:{target:'return to safety',skill:null},
   effects:[{type:'flag',name:'teamWithdrawn',value:true},{type:'end',outcome:'completed'}]}
 ],
 cinematic:{
  acts:[
   {number:1,title:'The Setup',objective:'Enter the basin, locate study observations, and establish the ordinary survey route.',unlocksAfter:[]},
   {number:2,title:'The Tilt',objective:'Reconcile the observations with the conditions in the field and relay an accurate report.',unlocksAfter:['recover-transect']},
   {number:3,title:'The Showdown',objective:'Determine what to preserve, then return to camp with whatever truths the party has established.',unlocksAfter:['recover-transect','send-field-report']}
  ],
  events:[
   {id:'living-valley',act:1,room:'survey-ridge',title:'The Valley Breathes',theme:'wonder',
    creatureId:'grazer-1',text:'A massive living silhouette shifts below the ridge; its breathing carries across the grass, unhurried and unthreatening.'},
   {id:'notes-among-leaves',act:1,room:'forest-blind',title:'The Empty Observation Hide',theme:'discovery',
    text:'Leaf litter has collected beneath the field markers. The place is empty; that alone establishes no cause for alarm.'},
   {id:'river-reckoning',act:2,room:'river-crossing',title:'The Rising Ford',theme:'dread',
    variant:{slot:'researchObstacle',choice:'flooded-ford'},
    text:'The river has risen across the submerged stones. Reaching the blind from here may require care, or a different route.'},
   {id:'cross-check',act:2,room:'survey-ridge',title:'Compare the Transect',theme:'human',
    requiresCompanion:true,
    text:'Two researchers compare their field observations, recognizing a discrepancy without assuming it points to a predator.'},
   {id:'farewell-valley',act:3,room:'survey-ridge',title:'A Last Look at the Herd',theme:'wonder',
    creatureId:'grazer-1',text:'Across the valley the animal keeps moving. For a moment the scientific mission gives way to awe.'},
   {id:'camp-decision',act:3,room:'field-camp',title:'What the Expedition Carries Home',theme:'human',
    text:'The camp is still here. The team can decide what matters most before choosing whether to conclude its expedition.'}
  ]
 },
 initialCreatures:[{id:'grazer-1',species:'parasaurolophus',
  location:'survey-ridge',disposition:'neutral'}],
 variants:{
  researchObstacle:[
   {id:'flooded-ford',fact:'flood',clueRoom:'river-crossing',
    description:'The river is visibly rising, making the forest ford treacherous.',
    mechanic:{kind:'passage_check',from:'river-crossing',to:'forest-blind',skill:'mobility',modifier:-2}},
   {id:'damaged-tripod',fact:'equipment',clueRoom:'survey-ridge',
    description:'The observation tripod is wind-damaged, compromising the field transmitter.',
    mechanic:{kind:'objective_check',objectiveId:'send-field-report',modifier:-2}},
   {id:'missing-records',fact:'human',clueRoom:'forest-blind',
    description:'The study markers have been disturbed and the records are out of sequence.',
    mechanic:{kind:'objective_check',objectiveId:'recover-transect',modifier:-2}}
  ],
  wildlifeBehavior:[
   {id:'grazing',fact:'peaceful',clueRoom:'survey-ridge',
    description:'The animals are grazing quietly in the valley.'},
   {id:'nervous',fact:'defensive',clueRoom:'forest-blind',
    description:'The tracks and alarm calls suggest an animal is wary of close approach.',
    mechanic:{kind:'animal_response',creatureId:'grazer-1',response:'flee_on_failed_approach',to:'forest-blind',skill:'survival',modifier:-1}}
  ]
 }
};
