const {createBaseNode, createSrcNode, createSpawnNode, addNodeToParent,
  createControllerNode, serializePos
} = require('./utils.memory')
const {getSlotsAround} = require('./utils.cartographer')
const {DONE, ACTIONS} = require('./actions')
const {getNodeRunner, getNodePos, getNodeBase} = require('./utils.nodes')
const {runBase} = require('./node.base')
const {log} = require('./utils.debug')

// const baseRunners = [
//   {runner: require('base.creep'), name: 'Creeps', ticks: 1, offset: 0}, // do first so spawns have a chance
//   {runner: require('base.source'), name: 'General of Resources', ticks: 1, offset: 0},
//   // {runner: require('base.extension'), name: 'Extension Commander', ticks: 1, offset: 0},
//   // {runner: require('base.container'), name: 'General of Storage Logistics', ticks: 1, offset: 0},
//   {runner: require('base.controller'), name: 'HQ Manager', ticks: 1, offset: 0},
//   {runner: require('base.spawn'), name: 'General Spawn', ticks: 1, offset: 0},
//   {runner: require('base.builder'), name: 'Construction Foreman', ticks: 1, offset: 0}, // do first so spawns have a chance
//   {runner: require('base.accountant'), name: 'Finance Captain', ticks: 1, offset: 0}, // do first so spawns have a chance
//   // {runner: require('base.jobs'), name: 'Job Controller', ticks: 1, offset: 0}, // do first so spawns have a chance
// ]

// const nodeRunner = {
//   src: {runner: require('base.source')},
//   [STRUCTURE_CONTROLLER]: {runner: require('base.controller')},
//   [STRUCTURE_SPAWN]: {runner: require('base.spawn')},
//   fort: {runner: (...args) => {console.log('No nodeRunner for this type')}}
// }


const actionRunners = {
  miner: {runner: require('job.harvest')},
  courier: {runner: require('job.courier')},
  harvest: {runner: require('job.harvest')},
  recycle: {runner: require('job.recycle')},
  // transfer: {runner: require('job.transfer')},
  upgrader: {runner: require('job.upgrade')},
  upgrade: {runner: require('job.upgrade')},
  supplier: {runner: require('job.supplier')},
  builder: {runner: require('job.builder')},
  maint: {runner: require('job.maint')},
  // withdraw: {runner: require('job.withdraw')},
  // idle: {runner: require('job.idle')},
  // pickup: {runner: require('job.pickup')},
  // drop: {runner: require('job.drop')}
}
function initMemory () {
  Memory.bases = []
  Memory.nodes = {}
  Memory.manifests = {}
}
// const PAUSE = true
module.exports.loop = function () {
  try {
    // if (PAUSE) {
    //   return
    // }
    if (!Memory.nodes) {
      initMemory()
    }

    gatherGlobal()
    // let manifest = Memory.manifest

    for (let baseIndex = 0; baseIndex < Memory.bases?.length; baseIndex++) {
      let baseId = Memory.bases[baseIndex]
      let base = Memory.nodes[baseId]
      if (base) {
        runBase(base, [])
      } else {
        // dead base. destroy
      }
    }
    // log({energyManifest})


    for (let name in Game.creeps) {
      let creep = Game.creeps[name]
      if (creep) {
        runCreep(creep)
      } else {
        console.log('dead creeps', name, creep)
        //delete Memory.creeps[name]
      }
    }
    // Memory.manifest = manifest
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

function initBaseFromSpawn (spawn) {
  const base = createBaseNode(spawn.room.name)
  base.pos = serializePos(spawn.pos)
  Memory.nodes[base.id] = base
  // add building nodes in room
  let structs = spawn.room.find(FIND_MY_STRUCTURES)
  structs.forEach(s => {
    switch (s.structureType) {
      case STRUCTURE_SPAWN:
        let spawnNode = createSpawnNode(s.id)
        spawnNode.dist = spawn.pos.findPathTo(getNodePos(spawnNode), {ignoreCreeps: true}).length
        addNodeToParent(spawnNode, base.id)
        break
      case STRUCTURE_CONTROLLER:
        let controllerNode = createControllerNode(s.id)
        controllerNode.dist = spawn.pos.findPathTo(getNodePos(controllerNode), {ignoreCreeps: true}).length
        addNodeToParent(controllerNode, base.id)
    }
  })

  // add src nodes in room
  let sources = spawn.room.find(FIND_SOURCES)
  sources.forEach(s => {
    let src = createSrcNode(s.id)
    let slots = getSlotsAround(s.pos)
    slots.forEach(pos => src.slots[pos] = false)
    src.dist = spawn.pos.findPathTo(getNodePos(src), {ignoreCreeps: true}).length
    addNodeToParent(src, base.id)
  })

  Memory.manifests[base.id] = {
    requests: {},
    new: {spawn: []}, pending: {spawn: []}, done: {spawn: []},
    finance: {income: {}, cost: {}, total: {income: 0, cost: 0, balance: 0, reserved: 0}},
    energy: {dest: [], src: []},
    free: {creeps: []}
  }
  Memory.bases.push(base.id)
}
function gatherGlobal () {
  try {
    try {
      for (let name in Game.spawns) {
        let spawn = Game.spawns[name]
        if (!Memory.nodes[spawn.room.name]) { // make new base
          initBaseFromSpawn(spawn)
        }
      }
    } catch (e) {
      console.log('Error: Gathering nodes in gatherGlobal: ', e.stack)
    }
  } catch (e) {
   console.log('Error: GatherGlobal(): ', e.stack)
  }
}

// function runBase(base, manifest) {
//   try {
//     // baseRunners.forEach(general => {
//     //   try {
//     //     general.runner.run(base, manifest)
//     //   } catch (e) {
//     //     console.log('Error: Running General', general.name, e.stack)
//     //   }
//     // })
//
//     // do base things
//
//
//     // run children
//     const parents = [base.name]
//     for (let nodeType in base.children) {
//       let nodeRunnerDef = getNodeRunner(nodeType)
//       base.children[nodeType].forEach(nodeId => {
//         nodeRunnerDef.runner.run(nodeId, parents)
//       })
//     }
//
//     // Memory.nodes[base.name].targets[RESOURCE_ENERGY] = sortEnergyRequests(Memory.nodes[base.name].targets[RESOURCE_ENERGY])
//   } catch (e) {
//     console.log('Error: runBase( ' + (base?.name ?? 'Undefined Base Name!') + ' ): ', e.stack)
//   }
//
// }

function runCreep (creep) {
  try {
    if (creep.spawning) {
      return
    } else {
      let base = Memory.nodes[creep.memory.base]//getNodeBase(creep.memory.nodeId)
      if (!base) {
        base = getNodeBase(creep.memory.nodeId)
        creep.memory.base = base?.id
      }
      let manifest = Memory.manifests[creep.memory.base]
      if (creep.hits < creep.hitsMax) { // creep was attacked!
        let src = creep.memory.Hsrc
        let currThreat = Memory.nodes[src].threat
        if (src && creep.memory?.actions?.length && creep.memory?.actions[0] !== 'recycle') {
          Memory.nodes[src].threat = currThreat ? currThreat + 1 : 1
          ACTIONS.recycle.start(creep)
        }
      }
      //const actionToDelete = 'fill'
      //if (creep.memory?.actions?.length && creep.memory?.actions[0] === actionToDelete) {
      //ACTIONS[creep.memory?.actions[0]].finish(creep)
      //}

      if (creep.memory?.actions?.length) { // if the creep has an action in their tmp action array, do it.
        let action = creep.memory?.actions[0]
        if (ACTIONS[action]) {
          switch(ACTIONS[action].do(creep, manifest)) {
            case DONE:
              ACTIONS[action].finish(creep, manifest) // once this tmp action is done, finish it.
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
    if (creep.name.includes('builder')) {
      creep.memory.role = 'builder'

    }
    console.log('Error: Unknown error for creep named', creep.name, creep?.memory?.role, creep?.memory?.nodeId, creep?.pos?.x, creep?.pos?.y, e.stack)
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
