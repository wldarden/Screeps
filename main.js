const {createBase, createSourceOwner} = require('./utils.memory')
const {getSlotsAround} = require('./utils.cartographer')
const {DONE, ACTIONS} = require('./actions')

const baseRunners = [
  {runner: require('base.creep'), name: 'Creeps', ticks: 1, offset: 0}, // do first so spawns have a chance
  {runner: require('base.source'), name: 'General of Resources', ticks: 1, offset: 0},
  // {runner: require('base.extension'), name: 'Extension Commander', ticks: 1, offset: 0},
  // {runner: require('base.container'), name: 'General of Storage Logistics', ticks: 1, offset: 0},
  {runner: require('base.controller'), name: 'HQ Manager', ticks: 1, offset: 0},
  {runner: require('base.spawn'), name: 'General Spawn', ticks: 1, offset: 0},
  {runner: require('base.builder'), name: 'Construction Foreman', ticks: 1, offset: 0}, // do first so spawns have a chance
  {runner: require('base.accountant'), name: 'Finance Captain', ticks: 1, offset: 0}, // do first so spawns have a chance
  // {runner: require('base.jobs'), name: 'Job Controller', ticks: 1, offset: 0}, // do first so spawns have a chance
]

const actionRunners = {
  miner: {runner: require('job.harvest')},
  courier: {runner: require('job.courier')},
  build: {runner: require('job.build')},
  harvest: {runner: require('job.harvest')},
  recycle: {runner: require('job.recycle')},
  // transfer: {runner: require('job.transfer')},
  upgrade: {runner: require('job.upgrade')},
  // withdraw: {runner: require('job.withdraw')},
  // idle: {runner: require('job.idle')},
  // pickup: {runner: require('job.pickup')},
  // drop: {runner: require('job.drop')}
}
function initMemory () {
  Memory.bases = {}
  Memory.sources = {}
  Memory.init = true
  Memory.nodes = {}
}
// const PAUSE = true
module.exports.loop = function () {
  try {
    // if (PAUSE) {
    //   return
    // }
    if (!Memory.init) {
      initMemory()
    }

    gatherGlobal()
    let manifest = Memory.manifest || {
      req: {
        spawn: [],
        build: []
      },
      res: {
        creeps: [],
        build: []
      }
    }
    for (let name in Memory.bases) {
      let base = Memory.bases[name]
      if (base) {
        runBase(base, manifest)
      } else {
        // dead base. destroy
      }
    }
    for (let name in Game.creeps) {
      let creep = Game.creeps[name]
      runCreep(creep, manifest)
    }
    Memory.manifest = manifest
  } catch (e) {
    console.log('Global Uncaught Error: ', e.stack)
  }


  // for(var name in Game.creeps)
  //   runCreep(Game.creeps[name]);


}

function getSpawnPath (base, pos) {
  let spawn = Game.getObjectById(base.structures[STRUCTURE_SPAWN][0])
  let path = pos.findPathTo(spawn, {ignoreCreeps: true})
  return path
}
function gatherGlobal () {
  try {
    try {
      for (let name in Game.spawns) {
        let spawn = Game.spawns[name]
        if (!Memory.bases[spawn.room.name]) { // make new base
          let base = createBase(spawn.room)
          let sources = spawn.room.find(FIND_SOURCES)
          base.sources = sources.map(s => {
            let src = createSourceOwner(s)
            src.base = base.name
            src.dist = getSpawnPath(base, s.pos)?.length
            let slots = getSlotsAround(s.pos)
            slots.forEach(pos => src.slots[pos] = false)
            // Memory.sources[s.id] = src
            Memory.nodes[s.id] = src
            return s.id
          })
          Memory.bases[spawn.room.name] = base
        }
      }
    } catch (e) {
      console.log('Error: creating untracked objects in gatherGlobal: ', e.stack)
    }
  } catch (e) {
   console.log('Error: GatherGlobal(): ', e.stack)
  }

}

function getDestinations (room) {
  return room.find(FIND_STRUCTURES, {
    filter: (s) => {
      return (s.structureType == STRUCTURE_EXTENSION || s.structureType == STRUCTURE_SPAWN) &&
        s.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
    }
  });
}
function getSites (room) {
  return room.find(FIND_CONSTRUCTION_SITES)
}



function runBase(base, manifest) {
  try {
    baseRunners.forEach(general => {
      try {
        general.runner.run(base, manifest)
      } catch (e) {
        console.log('Error: Running General', general.name, e.stack)
      }
    })

    // Memory.bases[base.name].targets[RESOURCE_ENERGY] = sortEnergyRequests(Memory.bases[base.name].targets[RESOURCE_ENERGY])
  } catch (e) {
    console.log('Error: runBase( ' + (base?.name ?? 'Undefined Base Name!') + ' ): ', e.stack)
  }

}

function runCreep (creep, manifest) {
  try {
    if (creep.spawning) {
      return
    } else {
      let base = Memory.bases[creep.memory.base]
      if (creep.hits < creep.hitsMax) { // creep was attacked!
        let src = creep.memory.Hsrc
        let currThreat = Memory.nodes[src].threat
        if (src && creep.memory?.actions?.length && creep.memory?.actions[0] !== 'recycle') {
          Memory.nodes[src].threat = currThreat ? currThreat + 1 : 1
          ACTIONS.recycle.start(creep, base.structures[STRUCTURE_SPAWN][0])
        }
      }
      if (creep.memory?.actions?.length) { // if the creep has an action in their tmp action array, do it.
        let action = creep.memory?.actions[0]
        if (ACTIONS[action]) {
          switch(ACTIONS[action].do(creep, manifest)) {
            case DONE:
              ACTIONS[action].finish(creep) // once this tmp action is done, finish it.
              return
            default:
              return
          }
        } else {
          actionRunners[action].runner.run(creep, manifest)
        }
      } else if (creep.memory.role) { // creeps that have completed all temporary actions return to their role
        actionRunners[creep.memory.role].runner.run(creep, manifest)
      }


      // end creep attacked code




    }
  } catch (e) {
    console.log('Error: Unknown error for creep named', creep.name, e.stack)
  }

}

// Atlas:
//   STRUCTURE_SPAWN: "spawn",
//   STRUCTURE_EXTENSION: "extension",
//   STRUCTURE_ROAD: "road",
//   STRUCTURE_WALL: "constructedWall",
//   STRUCTURE_RAMPART: "rampart",
//   STRUCTURE_KEEPER_LAIR: "keeperLair",
//   STRUCTURE_PORTAL: "portal",
//   STRUCTURE_CONTROLLER: "controller",
//   STRUCTURE_LINK: "link",
//   STRUCTURE_STORAGE: "storage",
//   STRUCTURE_TOWER: "tower",
//   STRUCTURE_OBSERVER: "observer",
//   STRUCTURE_POWER_BANK: "powerBank",
//   STRUCTURE_POWER_SPAWN: "powerSpawn",
//   STRUCTURE_EXTRACTOR: "extractor",
//   STRUCTURE_LAB: "lab",
//   STRUCTURE_TERMINAL: "terminal",
//   STRUCTURE_CONTAINER: "container",
//   STRUCTURE_NUKER: "nuker",
//   STRUCTURE_FACTORY: "factory",
//   STRUCTURE_INVADER_CORE: "invaderCore",
//
//   CONSTRUCTION_COST: {
//   "spawn": 15000,
//     "extension": 3000,
//     "road": 300,
//     "constructedWall": 1,
//     "rampart": 1,
//     "link": 5000,
//     "storage": 30000,
//     "tower": 5000,
//     "observer": 8000,
//     "powerSpawn": 100000,
//     "extractor": 5000,
//     "lab": 50000,
//     "terminal": 100000,
//     "container": 5000,
//     "nuker": 100000,
//     "factory": 100000
// },
