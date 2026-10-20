/**
 * Scenario data only: a 1993 Isla Nublar what-if for private prototyping.
 * All engine operations use stable IDs, not narrative descriptions.
 */
export const SCENARIO = Object.freeze({
  id: 'nublar-incident-1993',
  title: 'Isla Nublar — After the Storm',
  objective: 'Recover the access card, restart auxiliary power, send the distress call, and activate the helipad beacon.',
  start: 'control',
  rooms: {
    control: {
      name: 'Visitor Center Control Room',
      description: 'Emergency lamps blink across abandoned consoles. The park network is offline. Rain beats against the reinforced windows.',
      exits: ['lobby', 'utility'],
      aliases: ['control room', 'control', 'operations'],
      items: [],
      features: ['terminal', 'radio']
    },
    lobby: {
      name: 'Visitor Center Lobby',
      description: 'Water runs beneath the dinosaur skeleton displays. A staff access card lies behind the reception desk.',
      exits: ['control'],
      aliases: ['lobby', 'reception', 'visitor center'],
      items: ['keycard'],
      features: []
    },
    utility: {
      name: 'Service Corridor',
      description: 'Fluorescent strips buzz above a narrow corridor. A reinforced door leads to the maintenance shed.',
      exits: ['control', 'shed'],
      aliases: ['corridor', 'service corridor', 'utility', 'hall'],
      items: [],
      features: []
    },
    shed: {
      name: 'Maintenance Shed',
      description: 'Tools hang above the emergency generator. The shed opens onto the drenched jungle service path.',
      exits: ['utility', 'jungle'],
      aliases: ['shed', 'maintenance', 'generator room'],
      items: ['medkit', 'flare'],
      features: ['generator']
    },
    jungle: {
      name: 'Jungle Service Path',
      description: 'Ferns crowd the muddy path. The fence line disappears into the dark. Something has bent the warning signs.',
      exits: ['shed', 'paddock', 'helipad'],
      aliases: ['jungle', 'path', 'service path'],
      items: [],
      features: []
    },
    paddock: {
      name: 'Raptor Paddock Gate',
      description: 'The electric fence stands silent. Claw marks score the service gate. Fresh tracks vanish between the trees.',
      exits: ['jungle'],
      aliases: ['paddock', 'gate', 'raptor gate'],
      items: [],
      features: []
    },
    helipad: {
      name: 'Emergency Helipad',
      description: 'A circle of cracked concrete stands above the canopy. Its emergency locator beacon is unlit.',
      exits: ['jungle'],
      aliases: ['helipad', 'landing pad', 'landing zone'],
      items: [],
      features: ['beacon']
    }
  },
  initialDinosaur: {
    id: 'raptor-1',
    kind: 'Velociraptor',
    location: 'paddock',
    goal: null,
    alert: 0
  },
  startItems: ['flashlight'],
  itemNames: {
    keycard: 'Staff access card',
    medkit: 'Field medical kit',
    flare: 'Emergency flare',
    flashlight: 'Flashlight'
  }
});
