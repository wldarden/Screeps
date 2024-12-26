const {createBase, createSourceOwner} = require('./utils.memory')
const {getSlotsAround} = require('./utils.cartographer')
const {hireCreep, getCreepStep, addJobToBase, fireCreep, getCreepStepAction} = require('./operation.job')

const baseRunners = [
  {runner: require('base.creep'), name: 'Controller Creeps', ticks: 1, offset: 0}, // do first so spawns have a chance
  {runner: require('base.source'), name: 'General of Resources', ticks: 1, offset: 0},
  {runner: require('base.extension'), name: 'Extension Commander', ticks: 1, offset: 0},
  {runner: require('base.container'), name: 'General of Storage Logistics', ticks: 1, offset: 0},
  {runner: require('base.controller'), name: 'HQ Manager', ticks: 1, offset: 0},
  {runner: require('base.spawn'), name: 'General Spawn', ticks: 1, offset: 0},
  {runner: require('base.builder'), name: 'Construction Foreman', ticks: 1, offset: 0}, // do first so spawns have a chance
  {runner: require('base.jobs'), name: 'Job Controller', ticks: 1, offset: 0}, // do first so spawns have a chance
]

const actionRunners = {
  build: {runner: require('job.build')},
  harvest: {runner: require('job.harvest')},
  recycle: {runner: require('job.recycle')},
  transfer: {runner: require('job.transfer')},
  upgrade: {runner: require('job.upgrade')},
  withdraw: {runner: require('job.withdraw')},
  idle: {runner: require('job.idle')},
  pickup: {runner: require('job.pickup')},
  drop: {runner: require('job.drop')}
}
function initMemory () {
  Memory.bases = {}
  Memory.init = true
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
      runCreep(creep)
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
        if (!Memory.bases[spawn.room.name]) { // make new base
          let base = createBase(spawn.room)
          let sources = spawn.room.find(FIND_SOURCES)
          base.sources = sources.map(s => {
            let src = createSourceOwner(s)
            src.slots = getSlotsAround(s.pos)
            src.activePos = {}
            src.slots.forEach(pos => src.activePos[pos] = false)
            return src
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

function runCreep (creep) {
  try {
    if (creep.spawning) {
      return
    } else {
      let base = Memory.bases[creep.memory.base]
      if (creep.hits < creep.hitsMax) { // creep was attacked!
        if (base.jobs[creep.memory.jobId]) {
          if (creep.memory.step === null || !creep.memory.step) {
            creep.memory.step = 0
          }
          const job = base.jobs[creep.memory.jobId]
          base.jobs[creep.memory.jobId].threat = job.threat ? job.threat + 1 : 1 // raise job threat
          fireCreep(base, creep.name, creep.memory.jobId) // Abandon Job
        }
        if (!base.jobs[creep.memory.jobId] || base.jobs[creep.memory.jobId].cat !== 'flee') {
          const spawnId = base.structures[STRUCTURE_SPAWN][0]
          const fleeJob = {
            cat: 'flee',
            id: creep.name,
            steps: [
              // {id: spawnId, type: 'obj', action: ['move']},
              {id: spawnId, type: 'obj', action: ['recycle']}
            ],
            max: 1,
            value: 0,
            creeps: [creep.name],
            reqs: { parts: [MOVE] }
          }
          addJobToBase(base, fleeJob, false)
          creep.memory.jobId = creep.name
          creep.memory.init = true
          creep.memory.step = 0
        }
      } // end creep attacked code

      if (base.jobs[creep.memory.jobId]) { // if creep employed
        if (!creep.memory.init) {
          hireCreep(base, creep.name, creep.memory.jobId)
          creep.memory.init = true
          creep.memory.step = 0
        }
        let step = getCreepStep(creep, base.jobs[creep.memory.jobId]) // get job from base
        let action = step ? getCreepStepAction(creep, step) : 'idle'
        let runner = actionRunners[action]
        if (!runner) {
          console.log('Error: no runner defined for ', action, creep.name, JSON.stringify(step))
        } else {
          actionRunners[action].runner.run(creep)
        }
      } else {
        actionRunners['idle'].runner.run(creep)
      }
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