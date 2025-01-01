const {runChildren, addCreepToNode, getChildren, registerEnergyState} = require('./utils.nodes')
const {log} = require('./utils.debug')
const {buildNode
} = require('./utils.memory')
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
    const maxExtensions = 5 // here
    switch (node.stage) {
      default:
      case 0: // wait for room controller to be upgraded enough that we can build extensions
        let gameNode = Game.getObjectById(node.id)
        if (gameNode.room.controller.level >= 2) {
          node.stage = 1
        }
        break
      case 1: // Build extensions until max reached

        let extensions = getChildren(node, [STRUCTURE_EXTENSION], undefined, false, 1)
        if (extensions.length <= maxExtensions) { // if no container nodes...
          let buildNodes = getChildren(
            node,
            ['build'],
            (child) => child.onDoneType === STRUCTURE_EXTENSION,
            false,
            1)
          if (buildNodes.length === 0) { // and no container nodes being built...
            let gameNode = Game.getObjectById(node.id)
            let pos = buildNear(gameNode.pos, STRUCTURE_EXTENSION)
            buildNode(node.id, STRUCTURE_EXTENSION, pos) // build one
          }
        } else { // if we do have max built extensions, move to next stage
          node.stage = 2
        }
        break
      case 2: // TODO - maybe check if max extensions has changed or something here

        break

    }

    const spawnEnergySrcPri = baseManifest.energy.src.length < 1 ? 1 : 0
    /**
     * Register Energy Src
     */
    //registerEnergyState(baseManifest, node.id, spawnEnergySrcPri, 9)
    /**
     * Register Energy Src
     */

    /**
     * Spawn
     */
    let gameNode = Game.getObjectById(node.id)
    baseManifest.spawnCapacity = Object.keys(Memory.creeps)?.length < 5 ? 300 : gameNode.room.energyCapacityAvailable
    if (node.waitUntilCost > baseManifest.spawnCapacity) {
      delete node.waitUntilCost
      delete node.waitUntilTime
    }
    if (
      (!node.waitUntilCost || gameNode.room.energyAvailable >= node.waitUntilCost) &&
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
        const spawnReq = spawnForNode(spawnReqNodeId, baseManifest.spawnCapacity)
        if (spawnReq) {
          let res = gameNode.spawnCreep(spawnReq.body, spawnReq.name, {memory: spawnReq.memory})
          switch (res) {
            case OK:
              addCreepToNode(spawnReq.memory.nodeId, spawnReq.memory.role, spawnReq.name)
              completeSpawnReq(baseManifest, spawnReqNodeId)
              delete node.waitUntilCost
              delete node.waitUntilTime
              break
            case ERR_BUSY:
              node.waitUntilTime = Game.time + 5
              delete node.waitUntilCost
              break
            case ERR_INVALID_ARGS:
              log({spawnReq})
              console.log('Error: invalid spawn req', spawnReq.name)
              completeSpawnReq(spawnReqNodeId)
              delete node.waitUntilCost
              delete node.waitUntilTime
              break
            case ERR_NOT_ENOUGH_RESOURCES:
              node.waitUntilCost = spawnReq.cost
              delete node.waitUntilTime
              break
            default:
              console.log('Error: unhandled spawn res:', res)
              break
          }
        }
      }
    }
    /**
     * Spawn
     */
    runChildren(node, lineage, baseManifest)
  } catch(e) {
    console.log('Error: failed to run Spawn Node', e.stack, node.id)
  }
}


