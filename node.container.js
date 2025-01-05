
const {runChildren, addCreepToNode, requestEnergyFromParent} = require('./utils.nodes')
const {log} = require('./utils.debug')
const {maintainRoleCreepsForNode} = require('./utils.creep')
const {PLANS} = require('./utils.plans')
const distRunner = require('node.container.dist')
//const strType = STRUCTURE_CONTAINER
module.exports.run = function (node, lineage = [], baseManifest) {
  const maxSuppliers = 1

  try {
    switch (node.stage) {
      default:
      case 0: // finding pos and building
        console.log('Error: container nodes should never be stage 0 right?', node.id, node.parent, node.type)
        break
      case 1: // adding site id to start registering build reqs
        switch (node.subType) {
          default:
          //case 'log':
          //  requestEnergyFromParent(node)
          //  break
          case 'dist': // i take energy from parents and distribute to children

            distRunner.run(node, lineage, baseManifest)
            break
          case 'src': // i take energy from children and distribute to parents
            //if ((!node.creeps?.supplier?.length || node.creeps.supplier.length < maxSuppliers) && !Memory.nodes[node.parent].supReqs.some(id => id === node.id)) {
            //  Memory.nodes[node.parent].supReqs.push(node.id)
            //} else if (node.creeps?.supplier?.length && node.creeps?.supplier?.length > maxSuppliers) {
            //  addCreepToNode(node.parent, 'supplier', node.creeps.supplier[0])
            //}
            let gameNode = Game.getObjectById(node.id)
            if (!node.dests) {
              node.dests = {}

            }
            let parent = Memory.nodes[node.parent]
            if (!parent.srcs) {
              parent.srcs = {}
            }
            const energy = gameNode.store.getUsedCapacity(RESOURCE_ENERGY)
            const energyNeeded = gameNode.store.getFreeCapacity(RESOURCE_ENERGY)

            if (energy) {
              parent.srcs[node.id] = energy
            } else {
              delete parent.srcs[node.id]
            }
            if (energyNeeded) {
              node.dests[node.id] = energyNeeded
            } else {
              delete node.dests[node.id]
            }
            maintainRoleCreepsForNode(baseManifest, node, 'supplier', Math.round(energy / 1000))
            delete Memory.nodes[node.parent].dests[node.id]
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

