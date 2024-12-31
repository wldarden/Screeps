
const {runChildren, createNodePosition, getChildren, getTypeCreeps, getNodeReqs} = require('./utils.nodes')
const {log} = require('./utils.debug')
const {addNodeToParent, serializePos, buildNode, serializeBody} = require('./utils.memory')
const {addSpawnRequest} = require('./utils.manifest')
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
        if (!node.repairs) { node.repairs = [] }
        if (node.repairs?.length) {
          maintainRoleCreepsForNode(baseManifest, node, 'maint', 1, 1, 2)
        } else {
          if (node.creeps?.maint?.length) {
            //console.log('todo - redistribute maint now that everything is repaired')
          }
        }
        let logContainers = getChildren(node, [STRUCTURE_CONTAINER], (node) => node.subType !== 'src', false, 1)
        let srcContainers = getChildren(node, [STRUCTURE_CONTAINER], (node) => node.subType === 'src', false, 1)
        let allContainers = [...logContainers, ...srcContainers]
        if (allContainers.length) {
          //const supplySaturation =
          //console.log('maintaining suppliers', containers.length)
          maintainRoleCreepsForNode(baseManifest, node, 'supplier', allContainers.length, 2, 10)



          //if (!node.srcToEmpty) {
          //  node.srcToEmpty = []
          //}
          //srcContainers.forEach(src => {
          //  let gameCon = Game.getObjectById(src.id)
          //  if (gameCon.store.getUsedCapacity(RESOURCE_ENERGY) > 200) {
          //    if (!srcToEmpty.includes(src.id)) {
          //      node.srcToEmpty.push(src.id)
          //    }
          //  } else {
          //    node.srcToEmpty = node.srcToEmpty.filter(sId => sId !== src.id)
          //  }
          //})
          //if (!node.logToFill) {
          //  node.logToFill = []
          //}
          //logContainers.forEach(log => {
          //
          //})




          //containers.forEach(c => {
          //
          //  switch (c.subType) {
          //    case 'src':
          //      // this container should be emptied to fill others
          //      break
          //    default:
          //    case 'log':
          //      // this container should be filled from others
          //
          //      // this container should be used to fill buildings
          //      break
          //  }
          //})
        }
        //if ()
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
