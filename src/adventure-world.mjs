// 009-B1. Reusable physical-world interface for versioned adventure packages.
// No import of the Nublar scenario, named quests or species-specific directors.
import {validateCompiledAdventure} from './adventure-definition.mjs';
const copy=x=>JSON.parse(JSON.stringify(x));
export function createAdventureWorld(compiled){
 if(!validateCompiledAdventure(compiled))throw new RangeError('Adventure world requires a validated compiled manifest.');
 // Keep the validated blueprint private. Exposed rooms/inventories are copies.
 const data=copy(compiled.definition),rooms=data.rooms;
 const hasRoom=id=>Object.hasOwn(rooms,id);
 function distance(from,to){
  if(!hasRoom(from)||!hasRoom(to))return Infinity;
  if(from===to)return 0;
  const queue=[[from,0]],seen=new Set([from]);
  for(let i=0;i<queue.length;i++){
   const [at,steps]=queue[i];
   for(const next of rooms[at].exits){
    if(next===to)return steps+1;
    if(!seen.has(next)){seen.add(next);queue.push([next,steps+1]);}
   }
  }
  return Infinity;
 }
 function stepToward(from,to){
  if(!hasRoom(from)||!hasRoom(to)||from===to)return from;
  const exits=rooms[from].exits;
  return exits.reduce((best,next)=>
   distance(next,to)<distance(best,to)?next:best,exits[0]);
 }
 function resolveExit(from,target){
  if(!hasRoom(from))return null;
  const name=String(target??'').toLowerCase()
   .replace(/^(to |the |into |toward |towards )+/,'').trim();
  return rooms[from].exits.find(id=>id.toLowerCase()===name||
   rooms[id].name.toLowerCase()===name||
   (rooms[id].aliases||[]).some(alias=>alias.toLowerCase()===name))||null;
 }
 return Object.freeze({
  adventureId:data.id,revision:data.revision,start:data.start,
  startItems:Object.freeze([...data.startItems]),
  hasRoom,room:id=>hasRoom(id)?copy(rooms[id]):null,
  roomName:id=>hasRoom(id)?rooms[id].name:id,
  itemLabel:id=>data.itemNames[id]||id,
  initialRoomItems:()=>Object.fromEntries(Object.entries(rooms).map(
    ([id,room])=>[id,{items:[...room.items]}])),
  distance,stepToward,resolveExit
 });
}
