const {runChildren, addCreepToNode, getNodeBase, getChildren, registerEnergyState} = require('./utils.nodes')
const {log} = require('./utils.debug')
const {deserializeBody, deserializePos, createContainerNode, addNodeToParent, serializePos, createExtensionNode,
  buildNode
} = require('./utils.memory')
const {assignReq, getMyAssingedRequests, completeReq, getReqCost, deleteReq, registerEnergy, deregisterEnergy,
    getReqById
} = require('./utils.manifest')
const {getUniqueName} = require('./utils.spawner')
const {ACTIONS} = require('./actions')
const {createSiteFromRequest, moveNodeSites} = require('./utils.build')


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



module.exports.run = function (node, lineage = [], baseManifest) {
  try {
    if (node.threat) { return } // threat nodes are skipped
    const maxExtensions = 4 // here
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
        if (extensions.length < maxExtensions) { // if no container nodes...
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

    /**
     * Register Energy Src
     */
    registerEnergyState(baseManifest, node.id, 0, 9)
    /**
     * Register Energy Src
     */

    /**
     * Spawn
     */
    let gameNode = Game.getObjectById(node.id)
    baseManifest.spawnCapacity = gameNode.room.energyCapacityAvailable
    if (!node.waitUntil || gameNode.room.energyAvailable >= node.waitUntil) {
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
          if (Memory.nodes[nodeId]) {
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
            switch (res) {
              case OK:
                completeReq(baseManifest, priorityReq.id) // add creep to node owner:
                addCreepToNode(nodeId, role, name)
                deleteReq(baseManifest, priorityReq.id)
                delete node.jobId
                delete node.waitUntil
                return true
              case ERR_BUSY:
                return false
              case ERR_INVALID_ARGS:
                completeReq(baseManifest, priorityReq.id) // add creep to node owner:
                deleteReq(baseManifest, priorityReq.id)
                node.waitUntil = priorityReq.cost
                return false
              case ERR_NOT_ENOUGH_RESOURCES:
                node.waitUntil = priorityReq.cost
                return false
              default:
                console.log('Error: unhandled spawn res:', res)
                return false
            }

          } else {
            completeReq(baseManifest, priorityReq.id) // add creep to node owner:
            //addCreepToNode(nodeId, role, name)
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
    runChildren(node, lineage, baseManifest)
  } catch(e) {
    console.log('Error: failed to run Spawn Node', e.stack, node.id)
  }
}


