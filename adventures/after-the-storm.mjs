// Transitional adapter: the accepted After the Storm content is preserved
// unchanged while its configuration becomes a validated adventure definition.
// The legacy party engine still contains named scenario behavior until Phase B.
import {SCENARIO} from '../src/scenario.mjs';
export const AFTER_THE_STORM={
 schemaVersion:1,id:'nublar-after-the-storm',revision:1,
 title:SCENARIO.title,premise:'A storm knocks out communications during a park emergency.',
 start:SCENARIO.start,
 rooms:Object.fromEntries(Object.entries(SCENARIO.rooms).map(([id,room])=>[id,{
   name:room.name,description:room.description,exits:[...room.exits],
   aliases:[...(room.aliases||[])],items:[...room.items]}])),
 startItems:[...SCENARIO.startItems],itemNames:{...SCENARIO.itemNames},
 flags:{power:false,distress:false,beacon:false},
 objectives:[
  {id:'restore-power',description:'Restart auxiliary power with a real machinery check.',
   room:'shed',requires:[],effects:[{type:'flag',name:'power',value:true}]},
  {id:'call-for-help',description:'Transmit a distress call after restoring power.',
   room:'control',requires:['restore-power'],effects:[{type:'flag',name:'distress',value:true}]},
  {id:'light-beacon',description:'Activate the rescue beacon after sending the call.',
   room:'helipad',requires:['call-for-help'],
   effects:[{type:'flag',name:'beacon',value:true},{type:'end',outcome:'completed'}]}
 ],
 initialCreatures:[{id:'raptor-1',species:'velociraptor',location:'paddock',disposition:'predatory'}],
 variants:{
  emergencyCause:[
   {id:'storm-damage',fact:'accident',description:'Wind damage caused the emergency.',clueRoom:'shed'},
   {id:'bad-communications',fact:'maintenance',description:'Neglected communications compounded the outage.',clueRoom:'control'}
  ]
 }
};
