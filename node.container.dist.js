
const {registerSrcToParent, registerDestToParent} = require('./utils.nodes')
const {log} = require('./utils.debug')
const {maintainRoleCreepsForNode} = require('./utils.creep')

// i take energy from parents and distribute to children
module.exports.run = function (node, lineage = [], baseManifest) {
  try {
    //registerDestToParent(node)

    //let gameNode = Game.getObjectById(node.id)
    //switch (node.stage) {
    //  default:
    //  case 0: // finding pos and building
    //    console.log('Error: container nodes should never be stage 0 right?', node.id, node.parent, node.type)
    //    break
    //  case 1: // adding site id to start registering build reqs
    //    if (!node.dist) {
    //
    //    }
    //
    //    break
    //  case 2:
    //    break
    //  case 3:
    //    break
    //
    //}
    let gameNode = Game.getObjectById(node.id)
    const energy = gameNode.store.getUsedCapacity(RESOURCE_ENERGY)
    registerDestToParent(node)

    registerSrcToParent(node, node.parent, energy)
    maintainRoleCreepsForNode(baseManifest, node, 'supplier', 1)

    //let energy = gameNode.store.getUsedCapacity(RESOURCE_ENERGY)
    //registerDestToParent(node)
    //
    //registerSrcToParent(node, node.parent, energy)
    //
    //maintainRoleCreepsForNode(baseManifest, node, 'supplier', Math.round(energy / 1000))
    //
    //
    //runChildren(node, lineage, baseManifest)
  } catch(e) {
    log(Memory.nodes[node.id], ['ERROR', 'CONTAINER_NODE'])
    console.log('Error: failed to run Container.dist Node', e.stack, node.id)
  }
}

