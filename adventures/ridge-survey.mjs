// A deliberately different authoring fixture. It is a VALIDATED definition,
// played by the revision-gated selected-adventure Party engine.
export const RIDGE_SURVEY={
 schemaVersion:1,id:'ridge-survey',revision:10,
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

 supportingCast:[
  {id:'leena-harrow',name:'Leena Harrow',role:'Field operations coordinator',
   description:'The expedition coordinator checks battery cases beneath the camp awning. She does not leave the camp or accompany the team on patrol.',
   motive:'Keep the crew and the study equipment intact; financial pressure from the sponsors remains her private concern.',
   location:'field-camp',stance:'cooperative',
   topics:[
    {id:'route',prompt:'Ask about the survey route',
     reply:'The trail branches at the rocky ascent and the river crossing. Both reach the hide, but that does not mean either is safe in every condition.'},
    {id:'report',prompt:'Discuss the recovered transect data',requires:{kind:'objective',id:'recover-transect'},
     reply:'Good. Record what you measured, and leave anything you could not verify clearly marked as uncertain.'}
   ]},
  {id:'tomas-wren',name:'Tomas Wren',role:'Visiting field naturalist',
   description:'A patient observer remains by the ridge telescope, studying the distant valley. He has no means of controlling the animals.',
   motive:'Protect the scientific integrity of the expedition, even if the sponsor prefers a dramatic story.',
   location:'survey-ridge',stance:'cautious',
   topics:[
    {id:'herd',prompt:'Ask about the animals in the valley',
     reply:'The big browsers make their own choices. There is a kind of calm here worth remembering, but keeping our distance matters.'},
    {id:'quiet-sign',prompt:'Ask whether the valley is quiet',
     variant:{slot:'predatorPresence',choice:'quiet-range'},
     reply:'I have no fresh evidence of a hunting animal along this route. It is still wise to watch where you step.'},
    {id:'recent-sign',prompt:'Ask about the fresh tracks',
     variant:{slot:'predatorPresence',choice:'raptor-territory'},
     reply:'There are newer tracks beyond the ridge. I cannot name the animal from this vantage. Please do not mistake uncertainty for safety.'},
    {id:'compare',prompt:'Compare recovered notes with ridge sightings',
     requires:{kind:'objective',id:'recover-transect'},
     reply:'Now we can put the measured record beside what we watched. A discrepancy is a question, not proof of a particular cause.'}
   ]}
 ],
 scenarioMaterial:{
  briefing:{
   title:'The Count Begins',
   text:'An upland ecological survey should be routine: recover the transect readings, submit a reliable report, and return to camp. The weather is turning. The animals are here for their own reasons, not yours.'
  },
  gmOnly:{
   situation:'This is a field expedition rather than a programmed creature hunt. Objective checks, animal presence, and the research obstacle are established by the compiled seed.',
   secrets:[
    'Fresh claw marks indicate an active predator only in the seeded raptor-territory variant; quiet-range play must remain genuinely predator-free.',
    'The obstacle is whichever seed-locked research circumstance the compiler chose, not a retroactive explanation invented to heighten tension.'
   ],
   possibilities:[
    'A patient party can complete the field work without confronting a carnivore.',
    'A frightened team may return with incomplete observations; the game should record rather than silently rewrite what they learned.'
   ]
  },
  agendas:[
   {id:'observe-first',seat:0,act:1,text:'Record the wildlife accurately, even when a more exciting interpretation would impress the sponsors.'},
   {id:'compare-evidence',seat:0,act:2,text:'Test the team’s assumptions against what the survey actually shows before sending the report.'},
   {id:'bring-home-truth',seat:0,act:3,text:'Get the research home without claiming more than the evidence can establish.'},
   {id:'team-safety',seat:1,act:1,text:'Help establish a workable route before the weather makes a return difficult.'},
   {id:'protect-records',seat:1,act:2,text:'Keep the fragile observations from being lost or distorted in the field.'},
   {id:'safe-return',seat:1,act:3,text:'Bring your companions back together, even if the survey must end early.'}
  ],
  handouts:[
   {id:'field-orders',title:'Expedition field orders',
    text:'Retrieve the forest transect records, compare them with the ridge observations, and relay a defensible report. Return through a connected route before conditions worsen.',
    trigger:{kind:'start'}},
   {id:'transect-copy',title:'Recovered transect inventory',
    text:'The field observations are accounted for. Their interpretation still depends on the conditions and instruments at the observation sites.',
    trigger:{kind:'objective',id:'recover-transect'}},
   {id:'fresh-track-note',title:'Observation-hide track note',
    text:'Narrow, sharply defined prints cut across softer older sign. They are evidence of local animal passage, not proof of an attack.',
    trigger:{kind:'scene',id:'notes-among-leaves'},variant:{slot:'predatorPresence',choice:'raptor-territory'}},
   {id:'weathered-track-note',title:'Observation-hide track note',
    text:'The marks in the mud have lost their crisp edges. No fresh carnivore tracks can be established from this patch of ground.',
    trigger:{kind:'scene',id:'notes-among-leaves'},variant:{slot:'predatorPresence',choice:'quiet-range'}}
  ],
  storyCards:[
   {id:'the-living-valley',seat:0,
    text:'The enormous animal below is alive, unhurried, and not a problem to solve. Preserve this observation in the report.',
    trigger:{kind:'scene',id:'living-valley'}},
   {id:'unsettling-footprints',seat:0,
    text:'The fresh tracks unsettle you. You cannot tell your companions what made them until someone examines the evidence closely.',
    trigger:{kind:'scene',id:'notes-among-leaves'},variant:{slot:'predatorPresence',choice:'raptor-territory'}},
   {id:'expedition-report',seat:1,
    text:'The completed report is useful, but the team’s safety matters more than any particular interpretation of the data.',
    trigger:{kind:'objective',id:'send-field-report'}}
  ]
 },
 perils:[
  {id:'herd-close-pass',title:'A Narrow Passage Beside the Herd',
   description:'Try to thread past an alarmed animal at close range. Retreating and taking another route remain possible.',
   room:'survey-ridge',creatureId:'grazer-1',skill:'mobility',modifier:-1,
   attackerDice:4,baseDamage:1,
   variant:{slot:'wildlifeBehavior',choice:'nervous'}}
 ],
 initialCreatures:[
  {id:'grazer-1',species:'parasaurolophus',location:'survey-ridge',disposition:'neutral'},
  {id:'hunter-1',species:'velociraptor',location:'forest-blind',
   disposition:'predatory',threat:{protocol:'evolved_reaction'},
   when:{slot:'predatorPresence',choice:'raptor-territory'},
   patrol:{path:['forest-blind','river-crossing'],cadence:2}}
 ],
 variants:{
  predatorPresence:[
   {id:'quiet-range',fact:'no_predator',clueRoom:'forest-blind',
    description:'The soft earth shows older harmless tracks, with no fresh predator sign.'},
   {id:'raptor-territory',fact:'raptor_patrol',clueRoom:'forest-blind',
    description:'Fresh narrow claw tracks cross the forest approach; a hunter may be active in the basin.'}
  ],
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
