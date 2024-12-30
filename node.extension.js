const {runChildren, registerEnergyState} = require('./utils.nodes')
const {log} = require('./utils.debug')
const {registerEnergy, deregisterEnergy} = require('./utils.manifest')
const {deserializePos, addNodeToParent} = require('./utils.memory')
const {findSiteAtPos, findStrAtPos} = require('./utils.build')
const {PRIORITY} = require('./config')

const strType = STRUCTURE_EXTENSION
module.exports.run = function (node, lineage = [], baseManifest) {
  try {
    switch (node.stage) {
      default:
      case 0: // finding pos and building
        if (node.pos) {
          let pos = deserializePos(node.pos)
          const res = Game.rooms[pos.roomName].createConstructionSite(pos.x, pos.y, strType)
          if (res === 0) {
            console.log('Extension now at stage 1 from 0')
            node.stage = 1
          }
        }
        return
      case 1: // adding site id to start registering build reqs
        let siteId = findSiteAtPos(node.pos, strType)
        if (siteId) { // change self id to siteId, upgrade stage
          addNodeToParent(node, node.parent, siteId)
          console.log('Extension now at stage 2 from 1')
          node.stage = 2
        }
        return
      case 2:
        let site = Game.getObjectById(node.id)
        if (site){
          const frac = site.progress / site.progressTotal
          const energyReq = {
            id: node.id,
            amount: site.progressTotal - site.progress,
            pri: PRIORITY.BUILD + ((frac * 2) - 1), // modifier is +/-1 based on progress
            action: 'build'
          }
          registerEnergy(baseManifest, energyReq, 'dest')
        } else {
          let strId = findStrAtPos(node.pos, strType)
          if (strId) {
            addNodeToParent(node, node.parent, strId)
            console.log('Extension now at stage 3 from 2')
            node.stage = 3
          }
        }
        return
      case 3:
        registerEnergyState(baseManifest, node.id, 0, 7)
        return
    }
    runChildren(node, lineage, baseManifest)
  } catch(e) {
    log(Memory.nodes[node.id], ['ERROR', 'STORAGE_NODE'])
    console.log('Error: failed to run Extension Node', e.stack, node.id)
  }
}

