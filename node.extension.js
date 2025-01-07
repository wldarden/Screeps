const {runChildren, registerDestToParent} = require('./utils.nodes')
const {log} = require('./utils.debug')

module.exports.run = function (node, lineage = [], baseManifest) {
  try {
    switch (node.stage) {
      default:
      case 0:
        console.log('Error: ext node should never be stage 0 right?', node.type, node.id, node.parent)
        break
      case 1:
        registerDestToParent(node, baseManifest)
        break
      //default:
      //case 0: // finding pos and building
      //  if (node.pos) {
      //    let pos = deserializePos(node.pos)
      //    const res = Game.rooms[pos.roomName].createConstructionSite(pos.x, pos.y, strType)
      //    if (res === 0) {
      //      node.stage = 1
      //    }
      //  }
      //  return
      //case 1: // adding site id to start registering build reqs
      //  let siteId = findSiteAtPos(node.pos, strType)
      //  if (siteId) { // change self id to siteId, upgrade stage
      //    addNodeToParent(node, node.parent, siteId)
      //    console.log('Extension now at stage 2 from 1')
      //    node.stage = 2
      //  }
      //  return
      //case 2:
      //  let site = Game.getObjectById(node.id)
      //  if (site){
      //    const frac = site.progress / site.progressTotal
      //    const energyReq = {
      //      id: node.id,
      //      amount: site.progressTotal - site.progress,
      //      pri: PRIORITY.BUILD + ((frac * 2) - 1), // modifier is +/-1 based on progress
      //      action: 'build'
      //    }
      //  } else {
      //    let strId = findStrAtPos(node.pos, strType)
      //    if (strId) {
      //      addNodeToParent(node, node.parent, strId)
      //      console.log('Extension now at stage 3 from 2')
      //      node.stage = 3
      //    }
      //  }
      //  return
      //case 3:
      //  return
    }
    delete node.recalcEpt

    runChildren(node, lineage, baseManifest)
  } catch(e) {
    log(Memory.nodes[node.id], ['ERROR', 'EXTENSION_NODE'])
    console.log('Error: failed to run Extension Node', e.stack, node.id)
  }
}

