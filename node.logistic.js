
const {runChildren, createNodePosition, getChildren, getTypeCreeps, getNodeReqs} = require('./utils.nodes')
const {log} = require('./utils.debug')
const {addNodeToParent, serializePos, buildNode, serializeBody} = require('./utils.memory')
const {addSpawnRequest} = require('./utils.manifest')


const maxContainers = 1
module.exports.run = function (node, lineage = [], baseManifest) {
  try {
    switch (node.stage) {
      default:
      case 0:
        if (!node.pos) { // find service pos of self
          let parent = Memory.nodes[node.parent]
          let pos = createNodePosition(parent, 'log')
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
            node.stage = 1 // logistic node init is complete. move to stage 1
          }
        }
        break
      case 1: // Sto node complete. get children to begin servicing
        let importantSources = getChildren( // steal parents srcs
          Memory.nodes[node.parent],
          ['src'],
          (child) => {
            return (!child.threat && child.type === 'src' && Object.keys(child.slots).length >= 2)
          },
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

        function buildRoleCreep (role, maxCost) {
          switch (role) {
            case 'miner':
              return [CARRY, WORK, MOVE, CARRY, MOVE]
            case 'maint':
              return [CARRY, WORK, CARRY, MOVE, MOVE]
          }
        }
        function maintainRoleCreepsForNode (node, role, desired) {
          let existingTypeCreeps = getTypeCreeps(node, role)
          const plannedSaturation = (getNodeReqs(node).length + existingTypeCreeps.length) / desired
          if (plannedSaturation < 1) {
            const newRequest = {
              pri: 5, requestor: node.id, assignee: [], status: 'new', type: 'spawn',
              opts: {role: role, plan: serializeBody(buildRoleCreep(role))}
            }
            node.reqs.push(addSpawnRequest(baseManifest, newRequest))
          }
        }
        let containers = getChildren(node, [STRUCTURE_CONTAINER], undefined, false, 1)
        if (containers.length) {
          maintainRoleCreepsForNode(node, 'maint', 1)
        }
        break
      case 3:
        break
      case 4:
        break
    }
    ///**
    // * Containerize Src Children
    // * @type {[]}
    // */
    //let srcChildren = getChildren( // steal parents srcs
    //  node, ['src'], (child) => !child.threat && child.stage === 1, false, 1)
    //if (srcChildren.length) {
    //  let buildNodes = getChildren(node, ['build'], undefined, false, 1)
    //  if (buildNodes.length === 0) { // and no container nodes being built...
    //    buildNode(node.id, STRUCTURE_CONTAINER, pos) // build one
    //  }
    //
    //  let containers = getChildren(node, [STRUCTURE_CONTAINER], undefined, false, 1)
    //  if (containers.length === 0) { // if no container nodes...
    //    let buildNodes = getChildren(node, ['build'], undefined, false, 1)
    //    if (buildNodes.length === 0) { // and no container nodes being built...
    //      buildNode(node.id, STRUCTURE_CONTAINER, pos) // build one
    //    }
    //  } else if (containers[0].stage === 1) { // if we do have some containers, and they are stage 1 aka built,
    //    node.stage = 2 // Storage node init is complete. move to stage 1
    //  }
    //}
    runChildren(node, lineage, baseManifest)
  } catch(e) {
    log(Memory.nodes[node.id], ['ERROR', 'LOGISTIC_NODE'])
    console.log('Error: failed to run Logistics Node', e.stack, node.id)
  }
}
