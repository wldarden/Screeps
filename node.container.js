
const {runChildren, addCreepToNode} = require('./utils.nodes')
const {log} = require('./utils.debug')

const strType = STRUCTURE_CONTAINER
module.exports.run = function (node, lineage = [], baseManifest) {
  const maxSuppliers = Math.round(1 + (node.dist / 10))

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
            break
          case 'src':
            if ((!node.creeps?.supplier?.length || node.creeps.supplier.length < maxSuppliers) && !Memory.nodes[node.parent].supReqs.some(id => id === node.id)) {
              Memory.nodes[node.parent].supReqs.push(node.id)
            } else if (node.creeps?.supplier?.length && node.creeps?.supplier?.length > maxSuppliers) {
              addCreepToNode(node.parent, 'supplier', node.creeps.supplier[0])
            }

            break
        }
        break
      case 2:
        break
      case 3:
        break

    }
    runChildren(node, lineage, baseManifest)
  } catch(e) {
      log(Memory.nodes[node.id], ['ERROR', 'CONTAINER_NODE'])
      console.log('Error: failed to run Container Node', e.stack, node.id)
  }
}

