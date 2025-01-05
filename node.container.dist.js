
const {runChildren, addCreepToNode, requestEnergyFromParent, registerSrcToParent, registerDestToParent} = require('./utils.nodes')
const {log} = require('./utils.debug')
const {maintainRoleCreepsForNode} = require('./utils.creep')
const {PLANS} = require('./utils.plans')

// i take energy from parents and distribute to children
module.exports.run = function (node, lineage = [], baseManifest) {

  try {
    switch (node.stage) {
      default:
      case 0: // finding pos and building
        console.log('Error: container nodes should never be stage 0 right?', node.id, node.parent, node.type)
        break
      case 1: // adding site id to start registering build reqs
        let gameNode = Game.getObjectById(node.id)
        let energy = gameNode.store.getUsedCapacity(RESOURCE_ENERGY)
        registerDestToParent(node)
        //if (!node.srcs) {node.srcs = {}}
        //delete node.srcs[node.id]
        registerSrcToParent(node, node.parent, energy)
    
        maintainRoleCreepsForNode(baseManifest, node, 'supplier', Math.round(energy / 1000))
        //if (node.children) {
        //  const childTypes = Object.keys(node.children)
        //  if (childTypes) {
        //    let children = 0
        //    childTypes.forEach(t => {
        //      children = children + node.children[t]?.length
        //    })
        //    if (children) {
        //      maintainRoleCreepsForNode(baseManifest, node, 'supplier', 1)
        //    }
        //  }
        //}


        //if (node.children?.extensions?.length && node.children?.container?.length) {
        //  maintainRoleCreepsForNode(baseManifest, node, 'supplier', 1)
        //}
        //delete Memory.nodes[node.parent].dests[node.id]
        break
      case 2:
        break
      case 3:
        break

    }



    runChildren(node, lineage, baseManifest)
  } catch(e) {
    log(Memory.nodes[node.id], ['ERROR', 'CONTAINER_NODE'])
    console.log('Error: failed to run Container.dist Node', e.stack, node.id)
  }
}

