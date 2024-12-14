const {createBase, createSpawn} = require('./utils.memory')
const {creepRunners} = require('./runners')
const {sortEnergyRequests} = require('./utils.request')
const {JOB_TYPES, submitJob} = require('./operation.job')

const baseRunners = [
  {runner: require('base.spawn'), name: 'General Spawn', ticks: 1, offset: 0},
  {runner: require('base.controller'), name: 'Controller General', ticks: 1, offset: 0},
  {runner: require('base.source'), name: 'Source General', ticks: 1, offset: 0},
]

function initMemory () {
  Memory.bases = {}
  Memory.init = true
}

module.exports.loop = function () {
  try {
    if (!Memory.init) {
      initMemory()
    }

    gatherGlobal()
    let manifest = {
      requests: {spawn: [], build: []},
      deliveries: {creeps: []}
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
      if (creep) {

        creepRunners[creep.memory.role].run(creep, manifest)
      } else {
        // dead creep. destroy
      }
    }
  } catch (e) {
    console.log('Global Uncaught Error: ', e.stack)
  }


  // for(var name in Game.creeps)
  //   runCreep(Game.creeps[name]);


}

function gatherGlobal () {
  try {
    try {
      for (let name in Game.spawns) {
        let spawn = Game.spawns[name]
        if (!Memory.bases[spawn.room.name]) {
          let base = createBase(spawn.room)
          Memory.bases[spawn.room.name] = base
          base.sources.forEach(s => {
            for (let i = 0; i < s.slots; i++) {
              submitJob({
                type: 'harvest',
                parentId: s.id,
                base: base.name,
                threat: 0,
                roles: ['harvester', 'peon']
              })
            }
            return s
          })
        } else {}
        if (!Memory.spawns[name]) {
          Memory.spawns[name] = createSpawn(spawn)
        }
      }

      // destroy creep test...
      // for (let baseName in Memory.bases) {
      //   let base = Memory.bases[baseName]
      //   base.creeps = base.creeps.filter.(cId => {
      //     if (!Game.creeps[cId]) {
      //
      //     }
      //   })
      // }
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
        console.log('Error: Running General ', general.name, e.stack)
      }
    })
    Memory.bases[base.name].targets[RESOURCE_ENERGY] = sortEnergyRequests(Memory.bases[base.name].targets[RESOURCE_ENERGY])
  } catch (e) {
    console.log('Error: runBase( ' + (base?.name ?? 'Undefined Base Name!') + ' ): ', e.stack)
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
