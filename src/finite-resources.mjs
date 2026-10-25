// 007-M1: finite, transferable replacement cells for existing park lamps.
// Original scenario equipment, not an added biological or meteorological sim.
export const BATTERY_CELL='battery_cell';
export const BATTERY_STOCK=2;
export function batteryCount(actor){
 return (actor?.inventory||[]).filter(id=>id===BATTERY_CELL).length;
}
export function batteryReady(actor){
 return Boolean(actor?.light&&Number.isSafeInteger(actor.light.charge)&&
  actor.light.charge>=0&&batteryCount(actor)>0);
}
// Count all authored physical stock, actors' carried cells and committed
// consumption. No accepted turn ever produces a spare cell.
export function validBatteryStock(state){
 if(state.batterySpent===undefined)return true; // older accepted party v3 saves
 if(!Number.isSafeInteger(state.batterySpent)||state.batterySpent<0||
    state.batterySpent>BATTERY_STOCK)return false;
 const floor=Object.values(state.rooms||{}).reduce((n,r)=>
   n+(Array.isArray(r?.items)?r.items.filter(id=>id===BATTERY_CELL).length:0),0);
 const held=(state.actors||[]).reduce((n,a)=>n+batteryCount(a),0);
 return floor+held+state.batterySpent<=BATTERY_STOCK;
}
export function localBatteryOptions(state,actor,ownsLight,capacity){
 if(!state||!actor||!ownsLight)return [];
 const charge=actor.light?.charge??capacity;
 return charge<capacity&&batteryReady(actor)&&state.outcome==='playing'&&
  !state.combat?.active&&!actor.broken&&!actor.dead&&!actor.pendingSkip?
  [{id:'replace',label:'Replace lamp battery (consumes 1 spare cell)'}]:[];
}
