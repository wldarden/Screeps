
const {runChildren, registerEnergyState} = require('./utils.nodes')
const {log} = require('./utils.debug')
const {deserializePos, addNodeToParent} = require('./utils.memory')
const { registerEnergy} = require('./utils.manifest')
const {findSiteAtPos, findStrAtPos} = require('./utils.build')
const {PRIORITY} = require('./config')

const strType = STRUCTURE_CONTAINER
module.exports.run = function (node, lineage = [], baseManifest) {
  try {
    switch (node.stage) {
      default:
      case 0: // finding pos and building
        console.log('Error: container nodes should never be stage 0 right?', node.id, node.parent, node.type)
        break
      case 1: // adding site id to start registering build reqs
        switch (node.subType) {
          default:
          case 'log':
            registerEnergyState(baseManifest, node.id, 8, 5)
            break
          case 'src':
            registerEnergyState(baseManifest, node.id, 4, 1)
            break
        }
        break
      case 2:
        //let site = Game.getObjectById(node.id)
        //if (site){
        //  const frac = site.progress / site.progressTotal // progressTotal is constant.
        //  const energyReq = {
        //    id: node.id,
        //    amount: site.progressTotal - site.progress,
        //    pri: PRIORITY.BUILD + ((frac * 2) - 1), // modifier is +/-1 based on progress
        //    action: 'build'
        //  }
        //  registerEnergy(baseManifest, energyReq, 'dest')
        //} else {
        //  let strId = findStrAtPos(node.pos, strType)
        //  if (strId) {
        //    addNodeToParent(node, node.parent, strId)
        //    node.stage = 3
        //  }
        //}
        break
      case 3:
        //switch (parent.type) {
        //  case 'log':
        //    registerEnergyState(baseManifest, node.id, 8, 5)
        //    break
        //  case 'src':
        //    registerEnergyState(baseManifest, node.id, 4, 1)
        //    break
        //}
        break

    }

    runChildren(node, lineage, baseManifest)
  } catch(e) {
      log(Memory.nodes[node.id], ['ERROR', 'CONTAINER_NODE'])
      console.log('Error: failed to run Container Node', e.stack, node.id)
  }
}

