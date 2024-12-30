
const {runChildren} = require('./utils.nodes')
const {log} = require('./utils.debug')
const {deserializePos, addNodeToParent, removeNodeFromParent} = require('./utils.memory')
const {registerEnergy, deregisterEnergy} = require('./utils.manifest')
const {findSiteAtPos, findStrAtPos} = require('./utils.build')
const {PRIORITY} = require('./config')


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
    const strType = node.onDoneType
    switch (node.stage) {
      default:
      case 0: // Create construction site:
        if (node.pos) {
          let pos = deserializePos(node.pos)
          const res = Game.rooms[pos.roomName].createConstructionSite(pos.x, pos.y, strType)
          switch (res) {
            case ERR_INVALID_TARGET: // might already have built the thing.
              let siteId = findSiteAtPos(pos, strType)
              if (siteId) { // change self id to siteId, upgrade stage
                addNodeToParent(node, node.parent, siteId)
                node.stage = 2
              }
              break
            case OK:
              node.stage = 1
              break
            default:
              console.log('Error: unhandled createConstructionSite error res: ', res, node.id, pos.x, pos.y, strType, pos.roomName)
          }
        }
        return
      case 1: // Register siteId with parent
        let siteId = findSiteAtPos(node.pos, strType)
        if (siteId) { // change self id to siteId, upgrade stage
          addNodeToParent(node, node.parent, siteId)
          node.stage++
        }
        return
      case 2: // Request energy until built. Then register strId with parent and convert to final node type
        let site = Game.getObjectById(node.id)
        if (site){
          const frac = site.progress / site.progressTotal // progressTotal is constant.
          const energyReq = {
            id: node.id,
            amount: site.progressTotal - site.progress,
            pri: (node.buildPri || PRIORITY.BUILD) + ((frac * 2) - 1), // modifier is +/-1 based on progress
            action: 'build'
          }
          registerEnergy(baseManifest, energyReq, 'dest')
        } else {
          let strId = findStrAtPos(node.pos, strType)
          if (strId) {
            deregisterEnergy(baseManifest, node.id, 'dest')
            //removeNodeFromParent(node, node.parent)
            node.stage = 1
            const newType = node.onDoneType
            delete node.onDoneType
            delete node.buildPri
            addNodeToParent(node, node.parent, strId, newType)
          }
        }
        return
      case 3:
        console.log('Error: build node reached stage 3 and is still a build node: ', node.id, node.type, node.onDoneType, node.stage, node.parent)
        break
    }
    runChildren(node, lineage, baseManifest)
  } catch(e) {
    log(Memory.nodes[node.id], ['ERROR', 'CONTAINER_NODE'])
    console.log('Error: failed to run Build Node', e.stack, node.id)
  }
}

