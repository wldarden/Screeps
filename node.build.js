
const {runChildren, addNodeToParent, requestEnergyFromParent} = require('./utils.nodes')
const {log} = require('./utils.debug')
const {deserializePos} = require('./utils.memory')
const { deleteNodeReqs} = require('./utils.manifest')
const {findSiteAtPos, findStrAtPos} = require('./utils.build')
const {maintainRoleCreepsForNode} = require('./utils.creep')


/**
 *
 * @param node
 * - node.pri: pri Build Priority
 * - node.onDoneType : type to switch too when node has finished building itself
 * @param lineage
 * @param baseManifest
 */
module.exports.run = function (node, lineage = [], baseManifest) {
  try {

    switch (node.stage) {
      default:
      case 0: // Create construction site:
        if (node.pos) {
          let pos = deserializePos(node.pos)
          const strType = node.onDoneType
          const res = Game.rooms[pos.roomName].createConstructionSite(pos.x, pos.y, strType)
          switch (res) {
            case ERR_INVALID_TARGET: // -7 might already have built the thing.
              let siteId = findSiteAtPos(pos, strType)
              if (siteId) { // change self id to siteId, upgrade stage
                addNodeToParent(node, node.parent, siteId)
                node.stage = 2
              } else {
                siteId = findStrAtPos(pos, strType)
                if (siteId) {
                  addNodeToParent(node, node.parent, siteId)
                  node.stage = 2
                }
              }
              break
            case OK:
              node.stage = 1
              break
            default:
              console.log('Error: unhandled createConstructionSite error res: ', res, node.id, pos.x, pos.y, strType, pos.roomName)
          }
        }
        break
      case 1: // Register siteId with parent
        let siteId = findSiteAtPos(node.pos, node.onDoneType)
        if (siteId) { // change self id to siteId, upgrade stage
          addNodeToParent(node, node.parent, siteId)
          node.stage++
        }
        break
      case 2: // Request energy until built. Then register strId with parent and convert to final node type
        let site = Game.getObjectById(node.id)
        requestEnergyFromParent(node, baseManifest) // requests energy as site, and deletes req as str
        if (!site) { // no site found, maybe the str has been built:
          let strId = findStrAtPos(node.pos, node.onDoneType)
          if (strId) {
            deleteNodeReqs(baseManifest, node.id, 'spawn') // delete any build spawn reqs
            node.stage = 1 // set new structure's stage to 1
            const newType = node.onDoneType
            if (node.nodeParams) { // add the extra params that were created when build requested
              let obj = JSON.parse(node.nodeParams)
              node = {...node, ...obj}
            }
            delete node.nodeParams
            delete node.onDoneType
            delete node.pos
            addNodeToParent(node, node.parent, strId, newType)
          }
        }
        break
      case 3:
        console.log('Error: build node reached stage 3 and is still a build node: ', node.id, node.type, node.onDoneType, node.stage, node.parent)
        break
    }

    if (node.stage >= 2 && baseManifest.baseSrcEnergy && Game.time % 10 === 0) {
      if (!node.spawnReqCount) {
        let globalBuilders = Object.keys(Memory.creeps).filter(cId => cId.includes('builders'))?.length
        const siteBuildersWanted = Math.round(baseManifest.baseSrcEnergy / 1000) - globalBuilders
        maintainRoleCreepsForNode(baseManifest, node, 'builder', siteBuildersWanted)
      }
    }


    runChildren(node, lineage, baseManifest)
  } catch(e) {
    log(Memory.nodes[node.id], ['ERROR', 'CONTAINER_NODE'])
    console.log('Error: failed to run Build Node', e.stack, node.id)
  }
}

