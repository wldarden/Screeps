const {createBaseNode, createSrcNode, createSpawnNode,
  createControllerNode, serializePos
} = require('./utils.memory')
const {getSlotsAround} = require('./utils.cartographer')
const {DONE, ACTIONS} = require('./actions')
const {addNodeToParent, getNodePos, getNodeBase} = require('./utils.nodes')
const {runBase} = require('./node.base')
const {destroyCreep} = require('./utils.creep')


const actionRunners = {
  miner: {runner: require('job.harvest')},
  courier: {runner: require('job.courier')},
  harvest: {runner: require('job.harvest')},
  recycle: {runner: require('job.recycle')},
  upgrader: {runner: require('job.upgrade')},
  upgrade: {runner: require('job.upgrade')},
  supplier: {runner: require('job.supplier')},
  builder: {runner: require('job.builder')},
  maint: {runner: require('job.maint')},
  explorer: {runner: require('job.explorer')}
}
function initMemory () {
  Memory.bases = []
  Memory.nodes = {}
  Memory.manifests = {}
  Memory.workers = {}


}
module.exports.loop = function () {
  try {
    if (!Memory.nodes) {
      initMemory()
    }

    gatherGlobal()
    for (let baseIndex = 0; baseIndex < Memory.bases.length; baseIndex++) {
      let baseId = Memory.bases[baseIndex]
      let base = Memory.nodes[baseId]
      if (base) {
        runBase(base, [])
      } else {
        // dead base. destroy
      }
    }
    for (let name in Memory.creeps) {
      let creep = Game.creeps[name]
      //creep.runTask()
      if (creep) {
        runCreep(creep)
      } else {
        destroyCreep(name)
      }
    }
    // Memory.manifest = manifest
  } catch (e) {
    console.log('Global Uncaught Error: ', e.stack)
  }
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
    finance: {income: {}, cost: {}, total: {income: 0, cost: 0, balance: 0, reserved: 0}},
    spawn: [],
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

function runCreep (creep) {
  try {
    if (creep.spawning) {
      return
    } else {
      let base = Memory.nodes[creep.memory.base]//getNodeBase(creep.memory.nodeId)
      if (!base) {
        base = getNodeBase(creep.memory.nodeId)
        creep.memory.base = base.id
      }
      let manifest = Memory.manifests[creep.memory.base]
      if (creep.hits < creep.hitsMax) { // creep was attacked!
        let src = creep.memory.nodeId
        let currThreat = Memory.nodes[src].threat
        if (src && creep.memory.actions.length && creep.memory.actions[0] !== 'recycle') {
          Memory.nodes[src].threat = currThreat ? currThreat + 1 : 1
          ACTIONS.recycle.start(creep)
        }
      }

      let runRole = true
      if (creep.memory.actions && creep.memory.actions.length) { // if the creep has an action in their tmp action array, do it.
        let action = creep.memory.actions[0]
        if (ACTIONS[action]) {
          switch(ACTIONS[action].do(creep, manifest)) {
            case DONE:
              ACTIONS.global.finish(creep, manifest, action) // once this tmp action is done, finish it.
              runRole = true
              break
            default:
              runRole = false
              break
          }
        } else {
          console.log('secondary action runner...? shouldnt be here?')
          actionRunners[action].runner.run(creep, manifest)
        }
      }

      if (creep.memory.role && runRole) { // creeps that have completed all temporary actions return to their role
        actionRunners[creep.memory.role].runner.run(creep, manifest)
      }


      // end creep attacked code




    }
  } catch (e) {
    if (creep.name.includes('builder')) {
      creep.memory.role = 'builder'

    }
    console.log('Error: Unknown error for creep named', creep.name, creep.memory.role, creep.memory.nodeId, creep.pos.x, creep.pos.y, e.stack)
  }

}
