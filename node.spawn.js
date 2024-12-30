const {runChildren, addCreepToNode, getNodeBase, getChildren, registerEnergyState} = require('./utils.nodes')
const {log} = require('./utils.debug')
const {deserializeBody, deserializePos, createContainerNode, addNodeToParent, serializePos, createExtensionNode} = require('./utils.memory')
const {assignReq, getMyAssingedRequests, completeReq, getReqCost, deleteReq, registerEnergy, deregisterEnergy,
    getReqById
} = require('./utils.manifest')
const {getUniqueName} = require('./utils.spawner')
const {ACTIONS} = require('./actions')
const {createSiteFromRequest, moveNodeSites} = require('./utils.build')


function getNewSpawnJob (node, baseManifest) {

}
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
function requestExtensionSite (node, baseManifest) {
    // let pos = deserializePos(node.id)
    let gameNode = Game.getObjectById(node.id)
    let pos = buildNear(gameNode.pos, STRUCTURE_EXTENSION)
    if (pos) {
        const newReq = {
            pri: 5, requestor: node.id, assignee: [], type: 'new', at: Game.time,
            opts: { structureType: STRUCTURE_EXTENSION, pos: serializePos(pos) }
        }
        return createSiteFromRequest(baseManifest, newReq, pos)
    }
}


module.exports.run = function (node, lineage = [], baseManifest) {
  try {
    log(node, ['SPAWN_NODE', 'NODE'])
    if (node.threat) {
      return // threat spawns are skipped
    }
    const maxExtensions = 4
    switch (node.stage) {
      default:
      case 0:
        let gameNode = Game.getObjectById(node.id)
        if (gameNode.room.controller.level >= 2) {
          node.stage = 1
        }
        break
      case 1:
        let extensions = getChildren(node, [STRUCTURE_EXTENSION])
        const newExtensionId = `${node.id}-new-extension`
        if (extensions.length < maxExtensions && extensions.every(e => e.stage >= 3)) {
          if (!extensions.some(id => id === newExtensionId)) { // if we are still building max extensions...
            let gameNode = Game.getObjectById(node.id)
            let pos = buildNear(gameNode.pos, STRUCTURE_EXTENSION)
            if (pos) {
              let newNode = createExtensionNode(newExtensionId, serializePos(pos))
              addNodeToParent(newNode, newNode.id)
            }
          } else {
            break
          }
        } else {
          node.stage++
        }
        break
      case 2:
        break

    }

    /**
     * Register Energy Src
     */
    registerEnergyState(baseManifest, node.id, 3, 8)
    /**
     * Register Energy Src
     */

    /**
     * Spawn
     */
    let gameNode = Game.getObjectById(node.id)
    if (gameNode.room.energyAvailable > 100) {
      if (!node.jobId && baseManifest?.new?.spawn?.length) {
        let newReqId = baseManifest?.new?.spawn.find(spawnReqId =>
          getReqCost(baseManifest.requests[spawnReqId]) <= gameNode.room.energyCapacityAvailable)
        if (newReqId) {
          let assigned = assignReq(baseManifest, newReqId, node.id)
          if (assigned) {
            node.jobId = assigned
          }
        }
      }
      if (node.jobId && baseManifest.requests[node.jobId]) {
        let priorityReq = baseManifest.requests[node.jobId]
        if (priorityReq.status === 'complete') {
          delete node.jobId
        } else {
          const nodeId = priorityReq.opts.node || priorityReq.requestor
          const role = priorityReq.opts.role
          const name = getUniqueName(priorityReq.opts.role)
          const mem = {
            memory: {
              base: getNodeBase(nodeId)?.id,
              actions: [],
              role: role ,
              nodeId: nodeId,
              ...priorityReq.opts.mem
            }
          }
          let res = gameNode.spawnCreep(deserializeBody(priorityReq.opts.plan), name, mem)
          if (res === OK) {
            completeReq(baseManifest, priorityReq.id) // add creep to node owner:
            addCreepToNode(nodeId, role, name)
            deleteReq(baseManifest, priorityReq.id)
            delete node.jobId
            return true
          }
        }

      }
    }
    /**
     * Spawn
     */
    runChildren(node, lineage)
  } catch(e) {
    console.log('Error: failed to run Spawn Node', e.stack, node.id)
  }
}


