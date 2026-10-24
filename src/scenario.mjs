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
      wonder: {id:'rainforest-horizon',title:'The rainforest endures',kind:'landscape',
        description:'Beyond the reinforced glass, layered green ridgelines run toward the clouded horizon. Waterfalls thread through the trees; the island is much larger and more alive than the failing control screens suggest.'},
      description: 'Emergency lamps blink across abandoned consoles. The park network is offline. Rain beats against the reinforced windows.',
      exits: ['lobby', 'utility'],
      aliases: ['control room', 'control', 'operations'],
      items: [],
      affordances: [{"id":"rolling_cabinet","label":"Heavy rolling cabinet","uses":["barricade","cover"]},{"id":"paperweight","label":"Metal paperweight","uses":["distract"]}],
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
          description: 'Rows of dark monitors reflect the emergency lights. Red status lamps mark dead network links and a powerless communication console; the shutdown is real, not just a blank display.',
          investigation: 'A closer examination finds no obvious freshly pried panels or severed wires on the accessible consoles. The network and radio equipment have lost power; that alone cannot tell you whether the storm caused the outage or someone shut the system down intentionally.'
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
      wonder: {id:'scale-of-life',title:'An impossible scale of life',kind:'natural-history',
        description:'Rainwater gleams along the ribs of the towering skeletons. Their size is almost impossible to grasp from floor level; for a moment the exhibits convey the extraordinary history of living things, not the park\'s failed machinery.'},
      description: 'Water runs beneath the dinosaur skeleton displays. A staff access card lies behind the reception desk.',
      exits: ['control'],
      aliases: ['lobby', 'reception', 'visitor center'],
      items: ['keycard'],
      affordances: [{"id":"display_stanchion","label":"Heavy display stanchion","uses":["barricade","cover"]},{"id":"brochure","label":"Loose souvenir brochure","uses":["distract"]}],
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
      affordances: [{"id":"equipment_cart","label":"Maintenance equipment cart","uses":["barricade","cover"]},{"id":"loose_bolt","label":"Loose steel bolt","uses":["distract"]}],
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
      description: 'Tools hang above the emergency generator. A hand-operated storm shutter hangs over the shed doorway to the drenched jungle service path.',
      exits: ['utility', 'jungle'],
      aliases: ['shed', 'maintenance', 'generator room'],
      items: ['medkit', 'flare'],
      affordances: [{"id":"tool_cabinet","label":"Workshop tool cabinet","uses":["barricade","cover"]},{"id":"wrench","label":"Loose steel wrench","uses":["distract"]}],
      features: ['generator','shutter'],
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
      wonder: {id:'living-canopy',title:'Life beneath the canopy',kind:'ecosystem',
        description:'Rain beads on the immense fern fronds. Orchid roots, moss, and new shoots crowd every patch of fallen wood; countless small living things continue their work, indifferent to the park\'s alarms.'},
      description: 'Ferns crowd the muddy path. A hand-operated storm shutter covers the maintenance shed doorway. The fence line disappears into the dark. Something has bent the warning signs.',
      exits: ['shed', 'paddock', 'helipad'],
      aliases: ['jungle', 'path', 'service path'],
      items: [],
      affordances: [{"id":"fallen_log","label":"Fallen log","uses":["barricade","cover"]},{"id":"loose_stones","label":"Handful of loose stones","uses":["distract"]}],
      features: ['shutter'],
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
      affordances: [{"id":"broken_panel","label":"Broken service panel","uses":["barricade","cover"]},{"id":"scrap_metal","label":"Loose scrap metal","uses":["distract"]}],
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
      wonder: {id:'herbivores-at-distance',title:'Giants beyond the valley',kind:'distant-wildlife',ambientOnly:true,
        description:'Through a brief opening in the rain, immense long-necked herbivores move slowly along a far valley beyond the park roads. One pauses to feed from the treetops. Their easy, deliberate movements make it almost impossible to look away. They are distant scenery, not creatures in this encounter zone.'},
      description: 'A circle of cracked concrete stands above the canopy. Its emergency locator beacon is unlit.',
      exits: ['jungle'],
      aliases: ['helipad', 'landing pad', 'landing zone'],
      items: [],
      affordances: [{"id":"supply_crate","label":"Emergency supply crate","uses":["barricade","cover"]},{"id":"marker_stone","label":"Loose marker stone","uses":["distract"]}],
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
