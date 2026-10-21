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
      features: ['terminal', 'radio'],
      observations: [
        {
          id: 'window',
          aliases: ['windows', 'outside', 'outside window', 'outside the window',
            'through window', 'through the window', 'glass', 'security glass',
            'view outside', 'rain outside'],
          description: 'Through the rain-streaked reinforced glass, flickering security floodlights pick out an empty concrete forecourt. Palm fronds lash the perimeter; beyond the light, the jungle disappears into black rain. You cannot make out what is moving farther into the trees.'
        },
        {
          id: 'consoles',
          aliases: ['console', 'monitors', 'monitor', 'screens', 'computers', 'terminal'],
          description: 'Rows of dark monitors reflect the emergency lights. Red status lamps mark dead network links and a powerless communication console; the shutdown is real, not just a blank display.'
        },
        {
          id: 'radio',
          aliases: ['communications', 'communications console', 'transceiver'],
          description: 'The emergency radio microphone hangs beside a silent transmitter. Its power indicator is dead; the room needs auxiliary electricity before a distress call can get out.'
        }
      ]
    },
    lobby: {
      name: 'Visitor Center Lobby',
      description: 'Water runs beneath the dinosaur skeleton displays. A staff access card lies behind the reception desk.',
      exits: ['control'],
      aliases: ['lobby', 'reception', 'visitor center'],
      items: ['keycard'],
      features: [],
      observations: [
        {
          id: 'reception',
          aliases: ['desk', 'reception desk', 'counter', 'access card', 'keycard'],
          description: 'Water drips from the reception counter. A damaged badge reader and damp documents lie beneath the desk lamp.'
        },
        {
          id: 'skeleton',
          aliases: ['skeletons', 'dinosaur skeleton', 'displays', 'exhibits'],
          description: 'Towering dinosaur skeletons cast skeletal shadows over the flooded floor. The display lights buzz, but nothing in the exhibits is moving.'
        }
      ]
    },
    utility: {
      name: 'Service Corridor',
      description: 'Fluorescent strips buzz above a narrow corridor. A reinforced door leads to the maintenance shed.',
      exits: ['control', 'shed'],
      aliases: ['corridor', 'service corridor', 'utility', 'hall'],
      items: [],
      features: [],
      observations: [
        {
          id: 'maintenance door',
          aliases: ['door', 'reinforced door', 'locked door', 'shed door'],
          description: 'The reinforced maintenance door uses an InGen staff-card lock. Its status lamp is dark, but the access reader is still mounted beside the latch.'
        }
      ]
    },
    shed: {
      name: 'Maintenance Shed',
      description: 'Tools hang above the emergency generator. The shed opens onto the drenched jungle service path.',
      exits: ['utility', 'jungle'],
      aliases: ['shed', 'maintenance', 'generator room'],
      items: ['medkit', 'flare'],
      features: ['generator'],
      observations: [
        {
          id: 'generator',
          aliases: ['emergency generator', 'power unit', 'engine'],
          description: 'The emergency generator is slick with condensation, its pull-start housing and control panel still intact. Starting it will make considerable noise.'
        },
        {
          id: 'jungle outside',
          aliases: ['outside', 'doorway', 'jungle path', 'path outside'],
          description: 'Beyond the shed doorway, wind bends the jungle canopy. The muddy service path is barely visible beneath the rain.'
        }
      ]
    },
    jungle: {
      name: 'Jungle Service Path',
      description: 'Ferns crowd the muddy path. The fence line disappears into the dark. Something has bent the warning signs.',
      exits: ['shed', 'paddock', 'helipad'],
      aliases: ['jungle', 'path', 'service path'],
      items: [],
      features: [],
      observations: [
        {
          id: 'fence',
          aliases: ['fence line', 'electric fence', 'warning signs'],
          description: 'The unpowered perimeter fence vanishes under ferns. Several warning signs have been twisted by a force stronger than the wind.'
        },
        {
          id: 'tracks',
          aliases: ['footprints', 'mud', 'trail', 'prints'],
          description: 'Deep impressions pockmark the muddy service track. Rain is already softening their edges; the direction is difficult to judge.'
        }
      ]
    },
    paddock: {
      name: 'Raptor Paddock Gate',
      description: 'The electric fence stands silent. Claw marks score the service gate. Fresh tracks vanish between the trees.',
      exits: ['jungle'],
      aliases: ['paddock', 'gate', 'raptor gate'],
      items: [],
      features: [],
      observations: [
        {
          id: 'gate',
          aliases: ['paddock gate', 'fence', 'service gate', 'claw marks'],
          description: 'Long claw gouges score the silent service gate. The torn mesh sways in the wet wind; the power indicators are unlit.'
        }
      ]
    },
    helipad: {
      name: 'Emergency Helipad',
      description: 'A circle of cracked concrete stands above the canopy. Its emergency locator beacon is unlit.',
      exits: ['jungle'],
      aliases: ['helipad', 'landing pad', 'landing zone'],
      items: [],
      features: ['beacon'],
      observations: [
        {
          id: 'beacon',
          aliases: ['emergency beacon', 'locator', 'locator beacon'],
          description: 'The emergency beacon stands dark beside the cracked landing circle. It needs the rescue frequency and restored power before it can guide a helicopter in.'
        },
        {
          id: 'sky',
          aliases: ['clouds', 'horizon', 'above'],
          description: 'Low storm clouds obscure the horizon. No helicopter can be seen through the rain.'
        }
      ]
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
