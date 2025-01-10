
const {addNodeToParent, runChildren, createNodePosition, getChildren, getTypeCreeps, getNodeReqs, addCreepToNode,
  buildNode, deregisterEnergyDest, deregisterEnergySrc, getDist, proxySrcChildren
} = require('./utils.nodes')
const {log} = require('./utils.debug')
const {serializePos, deserializePos} = require('./utils.memory')
const {maintainRoleCreepsForNode} = require('./utils.creep')

const LOG_CONTAINER_OFFSET = [
  {x: 0, y: 0},
  {x: 1, y: 0}
]

const maxContainers = 1
module.exports.run = function (node, lineage = [], baseManifest) {
  try {
    switch (node.stage) {
      default:
      case 0: // INIT: 1. POSITION SELF BASED ON PARENT NEEDS; 2. BUILD FIRST CONTAINER
        if (!node.serviced) {
          console.log('Error: logistic node added without any serviced nodes:', node.id)
          //let parent = Memory.nodes[node.parent]
          //node.serviced = getChildren(parent, [STRUCTURE_CONTAINER], (child) => child.subType === 'src', true)
        }

        if (node.serviced && !node.pos) { // find service pos of self
          let parent = Memory.nodes[node.parent]
          //node.serviced = getChildren(parent, [STRUCTURE_CONTAINER], (child) => child.subType === 'src', true)
          let pos = createNodePosition(parent, 'log', node)
          //node.extra = pos.extra
          //log({logisticPos: pos})
          //console.log('logistic pos: ', pos.x, pos.y, pos.roomName)
          if (pos) {
            console.log('node.pos', node.pos)
            node.pos = serializePos(pos)
            node.dist = getDist(parent, node)
          }
        }
        if (node.pos && node.serviced) { // ensure we have at least 1 built container
          let containers = getChildren(node, [STRUCTURE_CONTAINER], undefined, false, 1)
          if (containers.length === 0) { // if no container nodes...
            let buildNodes = getChildren(node, ['build'], undefined, false, 1)
            if (buildNodes.length === 0) { // and no container nodes being built...
              buildNode(node.id, STRUCTURE_CONTAINER, node.pos, {subType: 'src'}) // build one
            }
          } else if (containers[0].stage === 1) { // if we do have some containers, and they are stage 1 aka built,

            //addNodeToParent(containers[0], node.id)
            node.stage = 1
            let cont = containers[0]
            ////cont.subType = 'src'
            cont.dist = node.dist
            const contId = cont.id
            ////node.stage = 3
            //const parentId = node.parent
            node.serviced.forEach(servNodeId => {
              addNodeToParent(servNodeId, contId)
            }) // move serviced nodes to container
            //node.stage = 1 // logistic node init is complete. move to stage 1
            //addNodeToParent(cont, parentId) // move container to parent
            ////node.containerId = contId
            //addNodeToParent(node, contId) // move self to container child

          }
        }
        break
      case 1: // Sto node complete. get children to begin servicing
        //let containers = getChildren(node, [STRUCTURE_CONTAINER], undefined, false, 1)
        //if (containers[0] && containers[0].stage === 1) {
        //  let cont = containers[0]
        //  //cont.subType = 'src'
        //  const contId = cont.id
        //  //node.stage = 3
        //  addNodeToParent(cont, node.parent) // move container to parent
        //  //node.containerId = contId
        //  addNodeToParent(node, contId) // move self to container child
        //  node.serviced.forEach(servNodeId => { addNodeToParent(servNodeId, contId) }) // move serviced nodes to container
        //  node.stage = 1 // logistic node init is complete. move to stage 1
        //
        //
        //  node.serviced.forEach(servNodeId => { addNodeToParent(servNodeId, contId) })
        //}
        //console.log('servicedSrcs: ', node.servicedSrcs)
        //let importantSources = getChildren( // steal parents srcs
        //  Memory.nodes[node.parent],
        //  ['src'],
        //  (child) => {
        //    return (!child.threat && child.type === 'src' && Object.keys(child.slots).length >= 2)
        //  },
        //  false,
        //  1
        //)
        //importantSources.forEach(src => {
        //  src.stage = 1
        //  addNodeToParent(src, node.id)
        //})

        //node.stage++
        break
      case 2:
        //if (!node.repairs) { node.repairs = [] }
        //if (node.repairs.length) {
        //} else {
        //  if (node.creeps.maint.length) {
        //    //console.log('todo - redistribute maint now that everything is repaired')
        //  }
        //}
        //node.logContainers = getChildren(node, [STRUCTURE_CONTAINER], (node) => node.subType !== 'src', true, 1)
        //node.srcContainers = getChildren(node, [STRUCTURE_CONTAINER], (node) => node.subType === 'src', true, 1)
        //let allContainers = [...node.logContainers, ...node.srcContainers]
        //if (node.srcContainers.length) {
        //  //(node.srcContainers.length + node.logContainers.length)
        //  maintainRoleCreepsForNode(baseManifest, node, 'supplier', 2)
        //  if (!node.supReqs) {node.supReqs = []}
        //  if (node.supReqs.length) {
        //    let mySuppliers = getTypeCreeps(node, 'supplier')
        //    while (mySuppliers.length > 0 && node.supReqs.length) {
        //      addCreepToNode(node.supReqs[0], 'supplier', mySuppliers[0])
        //      node.supReqs.shift()
        //      mySuppliers = getTypeCreeps(node, 'supplier')
        //    }
        //  }
        //  //let mySuppliers = getTypeCreeps(node, 'supplier')
        //  //if (mySuppliers.length > 1 ) {
        //  //  let distributed = 0
        //  //  const maxDistributed = mySuppliers.length - 1
        //  //  for (let i = 0; (i < srcContainers.length) && (distributed < maxDistributed); i++) {
        //  //    let src = srcContainers[i]
        //  //    console.log(src.id, 'src container loggg', i, distributed, 'maxDistributed', maxDistributed)
        //  //    if (!src.creeps.supplier.length) {
        //  //      let creepMem = Memory.creeps[mySuppliers[i]]
        //  //      addCreepToNode(src.id, 'supplier', mySuppliers[i])
        //  //      distributed++
        //  //    }
        //  //  }
        //  //  console.log('Distributed ', distributed, ' suppliers to src nodes from log node')
        //  //}
        //}
        break
      case 3:
        break
      case 4:
        break
    }

    // if we are full and theres no dests lets expand storage
    if (node.dests && Object.keys(node.dests).length === 0) {
      proxySrcChildren(node)




      //if (node.srcs && Object.keys(node.srcs).length > 0) {
      //  let buildNodes = getChildren(node, ['build'], undefined, false, 1)
      //  if (buildNodes.length === 0) {
      //    console.log('log node should build more container storage')
      //    let containers = getChildren(node, [STRUCTURE_CONTAINER], undefined, false, 1)
      //    if (containers.length < LOG_CONTAINER_OFFSET.length) { // if no container nodes...
      //      let nodePos = deserializePos(node.pos)
      //      let offset = LOG_CONTAINER_OFFSET[containers.length]
      //      let newPos = {x: nodePos.x + offset.x, y: nodePos.y + offset.y, roomName: nodePos.roomName}
      //      buildNode(node.id, STRUCTURE_CONTAINER, newPos, {subType: 'src'}) // build one
      //    }
      //  }
      //}
    }


    runChildren(node, lineage, baseManifest)

    //node.recalcEpt = true
    if (node.stage >= 1 && (node.recalcEpt || node.totalEpt === undefined)) {
      const prevEpt = node.totalEpt
      let eptSrc = 0
      const allChildren= getChildren(node, [], undefined, false, 1)
      allChildren.forEach(c => {
        if (c.totalEpt) {
          console.log('Log child has ept: ', c.id, c.type, c.subType, c.totalEpt)
          eptSrc = eptSrc + c.totalEpt
        }
      })
      node.totalEpt = eptSrc
      console.log('recalced logistic node ept', node.id, prevEpt, '=>', node.totalEpt, allChildren.length)
      delete node.recalcEpt
    }
  } catch(e) {
    log(Memory.nodes[node.id], ['ERROR', 'LOGISTIC_NODE'])
    console.log('Error: failed to run Logistics Node', e.stack, node.id)
  }
}
