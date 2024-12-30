
const {runChildren, createNodePosition, getChildren} = require('./utils.nodes')
const {log} = require('./utils.debug')
const {addNodeToParent, serializePos, buildNode} = require('./utils.memory')


const maxContainers = 1
module.exports.run = function (node, lineage = [], baseManifest) {
  try {
    switch (node.stage) {
      default:
      case 0:
        if (!node.pos) { // find service pos of self
          let parent = Memory.nodes[node.parent]
          let pos = createNodePosition(parent, 'sto')
          if (pos) {
            node.pos = serializePos(pos)
          }
        }
        if (node.pos) { // ensure we have at least 1 built container
          let containers = getChildren(node, [STRUCTURE_CONTAINER], undefined, false, 1)
          if (containers.length === 0) { // if no container nodes...
            let buildNodes = getChildren(node, ['build'], undefined, false, 1)
            if (buildNodes.length === 0) { // and no container nodes being built...
              buildNode(node.id, STRUCTURE_CONTAINER, node.pos) // build one
            }
          } else if (containers[0].stage === 1) { // if we do have some containers, and they are stage 1 aka built,
            node.stage = 1 // Storage node init is complete. move to stage 1
          }
        }
        break
      case 1: // Sto node complete. get children to begin servicing
        let importantSources = getChildren( // steal parents srcs
          Memory.nodes[node.parent],
          ['src'],
          (child) => (child.threat === 0 && child.type === 'src' && Object.keys(child.slots).length >= 2),
          false,
          1
        )
        importantSources.forEach(src => {
          src.stage = 1
          addNodeToParent(src, node.id)
        })
        node.stage++
        break
      case 2:
        break
      case 3:
        break
      case 4:
        break
    }
    runChildren(node, lineage, baseManifest)
  } catch(e) {
    log(Memory.nodes[node.id], ['ERROR', 'STORAGE_NODE'])
    console.log('Error: failed to run Storage Node', e.stack, node.id)
  }
}
