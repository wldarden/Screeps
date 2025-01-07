
const {runChildren, registerDestToParent} = require('./utils.nodes')
const {log} = require('./utils.debug')
const distRunner = require('node.container.dist')
const srcRunner  = require('node.container.src')
//const strType = STRUCTURE_CONTAINER
module.exports.run = function (node, lineage = [], baseManifest) {
  const maxSuppliers = 1
  try {
    let gameNode = Game.getObjectById(node.id)
    switch (node.stage) {
      default:
      case 0: // finding pos and building
        console.log('Error: container nodes should never be stage 0 right?', node.id, node.parent, node.type)
        break
      case 1: // adding site id to start registering build reqs

        //let energy = gameNode.store.getUsedCapacity(RESOURCE_ENERGY)
        //registerDestToParent(node)
        switch (node.subType) {
          default:
          //case 'log':
          //  registerDestToParent(node)
          //  break
            runChildren(node, lineage, baseManifest)
            break
          case 'dist': // i take energy from parents and distribute to children

            distRunner.run(node, lineage, baseManifest)
            break
          case 'src': // i take energy from children and distribute to parents
            srcRunner.run(node, lineage, baseManifest)
            break

        }
        break
      case 2:
        break
      case 3:
        break

    }



    //registerSrcToParent(node, node.parent, energy)
    //if (node.dist) {
    //  //const loadCap = partCounts[CARRY] * 50
    //  //const fullWeight = plan.length - partCounts[MOVE]
    //  //const emptyWeight = (fullWeight - partCounts[CARRY]) || 1
    //  //const ticksPerSpaceTo = Math.min(Math.ceil(emptyWeight / partCounts[MOVE]))
    //  //const ticksPerSpaceFrom = Math.min(Math.ceil(fullWeight / partCounts[MOVE]))
    //  //const ticksPerSpaceTo = 1
    //  //const ticksPerSpaceFrom = 2
    //  const loadTicks = (3 * node.dist) + 1
    //  const loadCap = (baseManifest.spawnCapacity / 100) * 50
    //  const eptTrans = loadCap / loadTicks
    //  const eptSrc = 5
    //}
    //maintainRoleCreepsForNode(baseManifest, node, 'supplier', Math.round(energy / 1000))
  } catch(e) {
      log(Memory.nodes[node.id], ['ERROR', 'CONTAINER_NODE'])
      console.log('Error: failed to run Container Node', e.stack, node.id)
  }
}

