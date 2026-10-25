// A deliberately different authoring fixture. It is a VALIDATED definition,
// not yet runnable by the legacy After the Storm-specific Party engine.
export const RIDGE_SURVEY={
 schemaVersion:1,id:'ridge-survey',revision:1,
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
   room:'forest-blind',requires:[],effects:[{type:'flag',name:'dataRecovered',value:true}]},
  {id:'send-field-report',description:'Submit the observation report from the ridge.',
   room:'survey-ridge',requires:['recover-transect'],
   effects:[{type:'flag',name:'reportSent',value:true}]},
  {id:'walk-out',description:'Return to camp before nightfall; no helicopter rescue is required.',
   room:'field-camp',requires:['send-field-report'],
   effects:[{type:'flag',name:'teamWithdrawn',value:true},{type:'end',outcome:'completed'}]}
 ],
 initialCreatures:[{id:'grazer-1',species:'parasaurolophus',
  location:'survey-ridge',disposition:'neutral'}],
 variants:{
  researchObstacle:[
   {id:'flooded-ford',fact:'flood',clueRoom:'river-crossing',
    description:'The river crossing is threatened by rising water.'},
   {id:'damaged-tripod',fact:'equipment',clueRoom:'survey-ridge',
    description:'Wind damaged the survey tripod and scattered markers.'},
   {id:'missing-records',fact:'human',clueRoom:'forest-blind',
    description:'Someone relocated the field records before leaving.'}
  ],
  wildlifeBehavior:[
   {id:'grazing',fact:'peaceful',clueRoom:'survey-ridge',
    description:'The animals are grazing quietly in the valley.'},
   {id:'nervous',fact:'defensive',clueRoom:'forest-blind',
    description:'A nearby nesting animal is wary of any intrusion.'}
  ]
 }
};
