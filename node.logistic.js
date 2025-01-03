
const {addNodeToParent, runChildren, createNodePosition, getChildren, getTypeCreeps, getNodeReqs, addCreepToNode,
  buildNode
} = require('./utils.nodes')
const {log} = require('./utils.debug')
const {serializePos} = require('./utils.memory')
const {maintainRoleCreepsForNode} = require('./utils.creep')


const maxContainers = 1
module.exports.run = function (node, lineage = [], baseManifest) {
  try {
    switch (node.stage) {
      default:
      case 0: // INIT: 1. POSITION SELF BASED ON PARENT NEEDS; 2. BUILD FIRST CONTAINER
        if (!node.pos) { // find service pos of self
          let parent = Memory.nodes[node.parent]
          let pos = createNodePosition(parent, 'log')
          //node.extra = pos.extra
          if (pos) {
            node.pos = serializePos(pos)
          }
        }
        if (node.pos) { // ensure we have at least 1 built container
          let containers = getChildren(node, [STRUCTURE_CONTAINER], undefined, false, 1)
          if (containers.length === 0) { // if no container nodes...
            let buildNodes = getChildren(node, ['build'], undefined, false, 1)
            if (buildNodes.length === 0) { // and no container nodes being built...
              buildNode(node.id, STRUCTURE_CONTAINER, node.pos, {subType: 'log'}) // build one
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
        //if (!node.repairs) { node.repairs = [] }
        //if (node.repairs?.length) {
        //} else {
        //  if (node.creeps?.maint?.length) {
        //    //console.log('todo - redistribute maint now that everything is repaired')
        //  }
        //}
        //node.logContainers = getChildren(node, [STRUCTURE_CONTAINER], (node) => node.subType !== 'src', true, 1)
        //node.srcContainers = getChildren(node, [STRUCTURE_CONTAINER], (node) => node.subType === 'src', true, 1)
        //let allContainers = [...node.logContainers, ...node.srcContainers]
        if (node.srcContainers?.length) {
          //(node.srcContainers.length + node.logContainers.length)
          maintainRoleCreepsForNode(baseManifest, node, 'supplier', 2, 2, 10)
          if (!node.supReqs) {node.supReqs = []}
          if (node.supReqs?.length) {
            let mySuppliers = getTypeCreeps(node, 'supplier')
            while (mySuppliers.length > 0 && node?.supReqs?.length) {
              addCreepToNode(node.supReqs[0], 'supplier', mySuppliers[0])
              node.supReqs.shift()
              mySuppliers = getTypeCreeps(node, 'supplier')
            }
          }
          //let mySuppliers = getTypeCreeps(node, 'supplier')
          //if (mySuppliers.length > 1 ) {
          //  let distributed = 0
          //  const maxDistributed = mySuppliers.length - 1
          //  for (let i = 0; (i < srcContainers.length) && (distributed < maxDistributed); i++) {
          //    let src = srcContainers[i]
          //    console.log(src?.id, 'src container loggg', i, distributed, 'maxDistributed', maxDistributed)
          //    if (!src.creeps?.supplier?.length) {
          //      let creepMem = Memory.creeps[mySuppliers[i]]
          //      addCreepToNode(src.id, 'supplier', mySuppliers[i])
          //      distributed++
          //    }
          //  }
          //  console.log('Distributed ', distributed, ' suppliers to src nodes from log node')
          //}
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
