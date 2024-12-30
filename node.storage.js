
const {runChildren, createNodePosition, getChildren} = require('./utils.nodes')
const {log} = require('./utils.debug')
const {deserializePos, createContainerNode, addNodeToParent, serializePos} = require('./utils.memory')
const {createSiteFromRequest} = require('./utils.build')

// function requestContainerSite (node, baseManifest) {
//   let pos = deserializePos(node.id)
//   const newReq = {pri: 5, requestor: node.id, opts: {structureType: STRUCTURE_CONTAINER, pos: node.id}}
//   return createSiteFromRequest(baseManifest, newReq, pos)
// }


const maxContainers = 1
module.exports.run = function (node, lineage = [], baseManifest) {
  try {
    switch (node.stage) {
      case 0: // find service pos of self
        if (!node.pos) {
          let parent = Memory.nodes[node.parent]
          let pos = createNodePosition(parent, 'sto')
          if (pos) {
            node.pos = serializePos(pos)
            node.stage++
          }
        }
        break
      case 1: // create first container node
        const containers = getChildren(node, [STRUCTURE_CONTAINER])
        if (containers.length < maxContainers && containers.every(e => e.stage >= 3)) {
          let containerNode = createContainerNode(`${node.id}-new-container`, node.pos)
          addNodeToParent(containerNode, node.id)
          node.stage++
        }
        break
      case 2: // wait for container to be built
        break
    }
    runChildren(node, lineage, baseManifest)
  } catch(e) {
    log(Memory.nodes[node.id], ['ERROR', 'STORAGE_NODE'])
    console.log('Error: failed to run Storage Node', e.stack, node.id)
  }
}
