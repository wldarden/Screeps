const {runChildren, addCreepToNode, getChildren, addNodeToParent, registerDestToParent, registerSrcToParent,
  deregisterEnergySrc
} = require('./utils.nodes')
const {log} = require('./utils.debug')
const {serializePos} = require('./utils.memory')
const {spawnForNode} = require('./utils.spawner')
const {completeSpawnReq} = require('./utils.manifest')

function doSpawn (node, gameNode, spawnReq, baseManifest) {
  //console.log('do spawn loggg', node, gameNode, spawnReq, baseManifest)
  if (!Memory.nodes[spawnReq.memory.nodeId]) {
    return deleteSpawnReq(baseManifest, node, spawnReq.memory.nodeId)
  }
  node.currReqId = spawnReq.memory.nodeId
  let res = gameNode.spawnCreep(spawnReq.body, spawnReq.name, {memory: spawnReq.memory})
  //console.log('spawn res logggg', res)
  switch (res) {
    case OK:
      addCreepToNode(spawnReq.memory.nodeId, spawnReq.memory.role, spawnReq.name)
      return true
    case ERR_NAME_EXISTS: // -3 - serializedReq has name that already exists. we should redo the req:
      if (spawnReq) {
        const maxEnergy = node.waited ? gameNode.room.energyAvailable : baseManifest.spawnCapacity
        const newReq = spawnForNode(spawnReq.memory.nodeId, maxEnergy)
        return doSpawn(node, gameNode, newReq, baseManifest)
      } else {
        //deleteSpawnReq(baseManifest, node, spawnReq.memory.nodeId) // i dont think this is necessary...
        return false
      }
    case ERR_BUSY:
      node.waitUntilTime = Game.time + gameNode.spawning.remainingTime
      delete node.waitUntilCost
      node.serializedReq = JSON.stringify(spawnReq)
      break
    case ERR_INVALID_ARGS:
      log({spawnReq})
      console.log('Error: invalid spawn req', spawnReq.name)
      deleteSpawnReq(baseManifest, node, spawnReq.memory.nodeId)
      if (baseManifest.spawn.length) {
        const maxEnergy = node.waited ? gameNode.room.energyAvailable : baseManifest.spawnCapacity
        const newReq = spawnForNode(baseManifest.spawn[0], maxEnergy)
        return doSpawn(node, gameNode, newReq, baseManifest)
      }
      break
    case ERR_NOT_ENOUGH_RESOURCES:
      if (node.waited && gameNode.room.energyAvailable >= 300) {
        const maxEnergy = gameNode.room.energyAvailable
        const newReq = spawnForNode(spawnReq.memory.nodeId, maxEnergy)
        return doSpawn(node, gameNode, newReq, baseManifest)
      } else {
        node.serializedReq = JSON.stringify(spawnReq)
        node.waitUntilCost = spawnReq.cost
        if (!node.lastTry) {
          node.lastTry = Game.time
        }
      }

      break
    default:
      console.log('Error: unhandled spawn res:', res)
      break
  }
  node.waited = true
  return false
}
function deleteSpawnReq (baseManifest, node, id) {
  completeSpawnReq(baseManifest, id)
  delete node.waitUntilCost
  delete node.waitUntilTime
  delete node.serializedReq
  delete node.waited
  delete node.lastTry
  delete node.currReqId
}
const MAX_SPAWN_WAIT_TICKS = 2
module.exports.run = function (node, lineage = [], baseManifest) {
  try {
    switch (node.stage) {
      default:
      case 0: // wait for room controller to be upgraded enough that we can build extensions
        let gameNode = Game.getObjectById(node.id)
        if (gameNode.room.controller.level >= 2) {
          node.stage = 1
        }
        break
      case 1: // Build extensions until max reached
        let clusters = getChildren(node, ['ec'], undefined, false, 1)
        if (!clusters?.length) {
          let gameSpawn = Game.getObjectById(node.id)
          let extCluster = {
            id: `spawn-ec`,
            parent: null,
            type: 'ec',
            children: {},
            creeps: {},
            stage: 0,
            pos: serializePos({x: gameSpawn.pos.x, y: gameSpawn.pos.y, roomName: gameSpawn.pos.roomName })
          }
          addNodeToParent(extCluster, node.id)
          node.stage = 2
        }
        break
      case 2: // TODO - maybe check if max extensions has changed or something here
        break

    }
    /**
     * Register Energy Src
     */
    let gameNode = Game.getObjectById(node.id)
    registerDestToParent(node, baseManifest)
    if (baseManifest?.spawn?.length === 0) {
      registerSrcToParent(node, node.parent, gameNode.store.getUsedCapacity())
    } else {
      deregisterEnergySrc(node.id, node.parent)
    }
    /**
     * Register Energy Src
     */

    /**
     * SPAWN LOGIC
     */


    baseManifest.spawnCapacity = Object.keys(Memory.creeps)?.length < 5 ? 300 : gameNode.room.energyCapacityAvailable
    if (gameNode.room.energyAvailable >= 300) {
      //console.log('1111', gameNode.room.energyAvailable >= node.waitUntilCost || node.waitUntilCost > baseManifest.spawnCapacity)
      if (gameNode.room.energyAvailable >= node.waitUntilCost || node.waitUntilCost > baseManifest.spawnCapacity) {
        delete node.waitUntilCost
        delete node.waitUntilTime
      }
      //console.log('2222', node.currReqId && (!baseManifest.spawn?.length || !baseManifest.spawn.includes(!node.currReqId)))

      if (node.currReqId && (!baseManifest.spawn?.length || !baseManifest.spawn.includes(node.currReqId))) { // if saved req no longer exists in queue
        //console.log('node.waited might be deleted', node.waited, node.currReqId, baseManifest.spawn?.length, )
        deleteSpawnReq(baseManifest, node, node.currReqId)
      }
      //console.log('3333', baseManifest?.spawn?.length || node.serializedReq)

      if (baseManifest?.spawn?.length || node.serializedReq) { // if there is a saved req or waiting spawn req
        //console.log('4444', !node.waitUntilTime || node.waitUntilTime <= Game.time)

        if (!node.waitUntilTime || node.waitUntilTime <= Game.time) { // if we arent waiting or we waited the desired time
          //console.log('5555', !node.waitUntilCost || gameNode.room.energyAvailable >= node.waitUntilCost ||  // if (the energy we want is available) ||
          //  (node.lastTry && (node.lastTry + MAX_SPAWN_WAIT_TICKS >= Game.time)) )

          if (
            !node.waitUntilCost || gameNode.room.energyAvailable >= node.waitUntilCost ||  // if (the energy we want is available) ||
            (node.lastTry && (node.lastTry + MAX_SPAWN_WAIT_TICKS >= Game.time)) || // (we've been waiting for more than MAX_SPAWN_WAIT_TICKS)
            node.waited
          ) {
            //console.log('node.waited', node.waited, node.waited ? gameNode.room.energyAvailable : baseManifest.spawnCapacity)
            const maxEnergy = node.waited ? gameNode.room.energyAvailable : baseManifest.spawnCapacity
            const spawnReq = node.serializedReq ? JSON.parse(node.serializedReq) : spawnForNode(baseManifest.spawn[0], maxEnergy)
            //console.log('6666', spawnReq)

            if (spawnReq && doSpawn(node, gameNode, spawnReq, baseManifest)) {
              //console.log('deleting spawnReq: ', node.waited, spawnReq.memory.nodeId)
              deleteSpawnReq(baseManifest, node, spawnReq.memory.nodeId)
            } else {
              //console.log('setting node.waited true: ', node.waited)
              node.waited = true
            }
          }
        }
      }
    }

    /**
     * SPAWN LOGIC END
     */
    runChildren(node, lineage, baseManifest)
  } catch(e) {
    console.log('Error: failed to run Spawn Node', e.stack, node.id)
  }
}


