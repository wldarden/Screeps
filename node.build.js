
const {runChildren} = require('./utils.nodes')
const {log} = require('./utils.debug')
const {deserializePos, addNodeToParent} = require('./utils.memory')
const {registerEnergy, deregisterEnergy, deleteNodeReqs} = require('./utils.manifest')
const {findSiteAtPos, findStrAtPos} = require('./utils.build')
const {PRIORITY} = require('./config')
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
        break
      case 1: // Register siteId with parent
        let siteId = findSiteAtPos(node.pos, strType)
        if (siteId) { // change self id to siteId, upgrade stage
          addNodeToParent(node, node.parent, siteId)
          node.stage++
          node.isSiteAt = Game.time + 1
        }
        break
      case 2: // Request energy until built. Then register strId with parent and convert to final node type
        let site = Game.getObjectById(node.id)
        if (site){
          //const frac = site.progress / site.progressTotal // progressTotal is constant.
          //const energyReq = {
          //  id: node.id,
          //  amount: site.progressTotal - site.progress,
          //  pri: (node.buildPri || PRIORITY.BUILD) + ((frac * 2) - 1), // modifier is +/-1 based on progress
          //  action: 'build'
          //}
          //registerEnergy(baseManifest, energyReq, 'dest')
        } else {
          let strId = findStrAtPos(node.pos, strType)
          if (strId) {
            deregisterEnergy(baseManifest, node.id, 'dest')

            node.stage = 1
            const newType = node.onDoneType
            if (newType === STRUCTURE_EXTENSION && baseManifest.new?.spawn?.length) {
              deleteNodeReqs(baseManifest, node.id, 'spawn')
            }
            delete node.onDoneType
            delete node.buildPri
            addNodeToParent(node, node.parent, strId, newType)
          }
        }
        break
      case 3:
        console.log('Error: build node reached stage 3 and is still a build node: ', node.id, node.type, node.onDoneType, node.stage, node.parent)
        break
    }


    if (node.stage >= 2 && baseManifest.roomEnergyFrac > .5 && node.isSiteAt < Game.time && Game.time % 10 === 0) {
      let builders = 0
      while (Memory.creeps[`builders-${builders}`]) {
        builders++
      }
      if (builders < 3 && !node.spawnReqCount) {
        maintainRoleCreepsForNode(baseManifest, node, 'builder', 3, 1, 7)
      }
    } else if (baseManifest.roomEnergyFrac < .1) {
      deleteNodeReqs(baseManifest, node.id, 'spawn')
    }


    runChildren(node, lineage, baseManifest)
  } catch(e) {
    log(Memory.nodes[node.id], ['ERROR', 'CONTAINER_NODE'])
    console.log('Error: failed to run Build Node', e.stack, node.id)
  }
}

