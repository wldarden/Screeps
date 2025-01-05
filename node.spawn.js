const {runChildren, addCreepToNode, getChildren, addNodeToParent, requestEnergyFromParent} = require('./utils.nodes')
const {log} = require('./utils.debug')
const {serializePos} = require('./utils.memory')
const {spawnForNode} = require('./utils.spawner')
const {completeSpawnReq} = require('./utils.manifest')


function buildNear (position, structure = STRUCTURE_EXTENSION) {
    const room = Game.rooms[position.roomName]
    var searching = true
    const btmLeftX = position.x - 2
    const btmLeftY = position.y - 2
    var i = 0
    let resX
    let resY
    let siteId
    while (searching && i < 20) {
        // [7, 8, 9]
        // [3, 4, 5]
        // [1, 2, 3]
        const x = btmLeftX + ((i % 3) * 2)
        const y = btmLeftY + (Math.floor(i / 3) * 2)
        var res = room.createConstructionSite(x, y, structure);

        // OK	                  0 The operation has been scheduled successfully.
        // ERR_NOT_OWNER	     -1 The room is claimed or reserved by a hostile player.
        // ERR_INVALID_TARGET	 -7 The structure cannot be placed at the specified location.
        // ERR_FULL	           -8 You have too many construction sites. The maximum number of construction sites per player is 100.
        // ERR_INVALID_ARGS	  -10 The location is incorrect.
        // ERR_RCL_NOT_ENOUGH	-14 Room Controller Level insufficient. Learn more
        // console.log(res, x,y,'res loggg', JSON.stringify(room.getPositionAt(x,y).lookFor(LOOK_CONSTRUCTION_SITES)[0]))
        console.log(res, 'build near res')
        if (res === 0) {
            searching = false
            // siteId = room.getPositionAt(x,y).lookFor(LOOK_CONSTRUCTION_SITES)[0].id
            resX = x
            resY = y
        } else {
            i++
        }
    }
    return searching ? false : {x: resX, y: resY, roomName: position.roomName} // (false if couldnt, pos if building)
}

module.exports.run = function (node, lineage = [], baseManifest) {
  try {
    if (node.threat) { return } // threat nodes are skipped

    //let gameSp = Game.getObjectById(node.id)
    //gameSp.pos.getDirectionTo()
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
          //buildNode( // BUILD EXT CLUSTER
          //  node.id,
          //  'ec',
          //  {x: gameSpawn.pos.x + 3, y: gameSpawn.pos.y, roomName: gameSpawn.pos.roomName }
          //)
        }
        break
      case 2: // TODO - maybe check if max extensions has changed or something here
        break

    }

    //const spawnEnergySrcPri = baseManifest.energy.src.length < 1 ? 1 : 0
    /**
     * Register Energy Src
     */
    requestEnergyFromParent(node, baseManifest)
    /**
     * Register Energy Src
     */

    /**
     * SPAWN LOGIC
     */
    let gameNode = Game.getObjectById(node.id)
    baseManifest.spawnCapacity = Object.keys(Memory.creeps)?.length < 5 ? 300 : gameNode.room.energyCapacityAvailable
    //baseManifest.spawnCapacity=300
    //console.log('spawn cap info1:', Game.time, 'final spawncap: ', node.waited ? gameNode.room.energyAvailable : baseManifest.spawnCapacity,'node.waited', node.waited, 'node.waitUntilTime', node.waitUntilTime,'node.waitUntilCost',node.waitUntilCost)
    //console.log('spawn cap info2:', Game.time, 'room.energyAvailable', gameNode.room.energyAvailable, 'baseManifest.spawnCapacity',baseManifest.spawnCapacity, 'room.energyCapacityAvailable', gameNode.room.energyCapacityAvailable)
    if (node.waitUntilCost > baseManifest.spawnCapacity) {
      delete node.waitUntilCost
      delete node.waitUntilTime
    }
    if (
      (!node.waitUntilCost || gameNode.room.energyAvailable >= node.waitUntilCost || node.waitUntilTime) &&
      (!node.waitUntilTime || node.waitUntilTime <= Game.time)
    ) {

      if (baseManifest?.spawn?.length) {
        const spawnReqNodeId = baseManifest.spawn[0]
        if (!Memory.nodes[spawnReqNodeId]) {
          completeSpawnReq(baseManifest, spawnReqNodeId)
          delete node.waitUntilCost
          delete node.waitUntilTime
          return
        }
        //console.log('attempted spawn', node.serializedReq, 'cost', node.waitUntilCost, gameNode.room.energyAvailable >= node.waitUntilCost, 'time', node.waitUntilTime, node.waitUntilTime <= Game.time)
        const spawnReq = node.serializedReq ? JSON.parse(node.serializedReq) : spawnForNode(spawnReqNodeId, node.waited ? gameNode.room.energyAvailable : baseManifest.spawnCapacity)
        if (spawnReq) {
          let res = gameNode.spawnCreep(spawnReq.body, spawnReq.name, {memory: spawnReq.memory})
          switch (res) {
            case OK:
              addCreepToNode(spawnReq.memory.nodeId, spawnReq.memory.role, spawnReq.name)
              completeSpawnReq(baseManifest, spawnReqNodeId)
              delete node.waited
              delete node.waitUntilCost
              delete node.waitUntilTime
              delete node.serializedReq
              break
            case ERR_BUSY:
              node.waitUntilTime = Game.time + 2
              delete node.waitUntilCost
              node.serializedReq = JSON.stringify(spawnReq)
              break
            case ERR_INVALID_ARGS:
              log({spawnReq})
              console.log('Error: invalid spawn req', spawnReq.name)
              completeSpawnReq(spawnReqNodeId)
              delete node.waitUntilCost
              delete node.waitUntilTime
              delete node.serializedReq
              break
            case ERR_NOT_ENOUGH_RESOURCES:
              node.serializedReq = JSON.stringify(spawnReq)
              node.waitUntilCost = spawnReq.cost
              node.waited = true
              node.waitUntilTime = Game.time + 15
              break
            default:
              console.log('Error: unhandled spawn res:', res)
              break
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


