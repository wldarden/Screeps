const {log} = require('./utils.debug')
const {deserializePos, serializePos, createContainerNode, createExtensionNode} = require('./utils.memory')
const {registerEnergy, deregisterEnergy, deleteNodeReqs} = require('./utils.manifest')


function getNodeRunner (nodeType) {
  switch (nodeType) {
    case 'src':
      return {runner: require('node.src')}
    case STRUCTURE_CONTROLLER:
      return {runner: require('node.controller')}
    case STRUCTURE_SPAWN:
      return {runner: require('node.spawn')}
    case 'build':
      return {runner: require('node.build')}
    case 'log':
      return {runner: require('node.logistic')}
    case STRUCTURE_CONTAINER:
      return {runner: require('node.container')}
    case STRUCTURE_EXTENSION:
      return {runner: require('node.extension')}
    case 'maint':
      return {runner: require('node.maintenance')}
    case 'ec':
      return {runner: require('node.extcluster')}
    default:
      console.log('ERROR: No Node Runner for type: ', nodeType)
      return {runner: {run: (...args) => {console.log('Null Node Runner', JSON.stringify(args))}}}
  }
}
module.exports.getNodeRunner = getNodeRunner

function buildNode (parentId, nodeType, pos, nodeParams) {
  pos = serializePos(pos)
  const constructionNodeId = `${parentId}-new-${nodeType}`
  let constructionNode
  switch (nodeType) {
    case STRUCTURE_CONTAINER:
      constructionNode = createContainerNode(constructionNodeId, pos)
      break
    case STRUCTURE_EXTENSION:
      constructionNode = createExtensionNode(constructionNodeId, pos)
      break
  }
  constructionNode.nodeParams = JSON.stringify(nodeParams)
  constructionNode.onDoneType = nodeType
  constructionNode.type = 'build'
  //constructionNode.buildPri = pri
  addNodeToParent(constructionNode, parentId)
}
module.exports.buildNode = buildNode

function deregisterEnergyDest (reqId, node, recursive = 0) {
  if (typeof node === 'string') {
    node = Memory.nodes[node]
  }

  if (node.dests) {
    delete node.dests[reqId]
    if (node.parent) {
      deregisterEnergyDest(reqId, node.parent, recursive + 1)
    }
  } else if (!recursive) { // only definitely go to available parents if this was the first call. recursive calls will have some number > 0
    if (node.parent) {
      deregisterEnergyDest(reqId, node.parent, recursive + 1)
    }
  }
}
module.exports.deregisterEnergyDest = deregisterEnergyDest
function deregisterEnergySrc (reqId, node) {
  if (typeof node === 'string') {
    node = Memory.nodes[node]
  }
  if (node.srcs && reqId in node.srcs) {
    delete node.srcs[reqId]
    if (node.parent) {
      deregisterEnergySrc(reqId, node.parent)
    }
  }
  //if (node.srcs) {
  //  delete node.srcs[reqId]
  //}
  //if (node.parent) {
  //  deregisterEnergySrc(reqId, node.parent)
  //}
}
module.exports.deregisterEnergySrc = deregisterEnergySrc
function proxyDestChildren (node, additionalChildren = []) {
  if (typeof node === 'string') {
    node = Memory.nodes[node]
  }
  let parent
  if (node.dests) {
    parent = Memory.nodes[node.parent]
    Object.keys(node.dests).forEach(id => {
      let child = Memory.nodes[id]
      if (child && node.dests[id]) {
        switch (child.type) {
          case 'build':
          case STRUCTURE_CONTAINER:
            parent.dests[id] = node.dests[id]
            break
          default:
            if (additionalChildren.includes(id)) {
              parent.dests[id] = node.dests[id]
            }
            break
        }
      } else {
        deregisterEnergyDest(id, node.parent)
      }
    })
  }
}
module.exports.proxyDestChildren = proxyDestChildren

function proxySrcChildren(node) {
  if (typeof node === 'string') { node = Memory.nodes[node] }
  if (node.srcs) {
    let parent = Memory.nodes[node.parent]
    Object.keys(node.srcs).forEach(id => {
      let child = Memory.nodes[id]
      if (child && node.srcs[id]) {
        switch (child.type) {
          case 'build':
          case STRUCTURE_CONTAINER:
            if (!parent.srcs) { parent.srcs = {} }
            parent.srcs[id] = node.srcs[id]
            break
        }
      } else {
        deregisterEnergySrc(id, node.parent)
      }
    })
  }
}
module.exports.proxySrcChildren = proxySrcChildren

function registerSrcToParent (node, parent, energy) {
  if (typeof parent === 'string') {
    parent = Memory.nodes[node.parent]
  }

  if (!energy && energy !== 0) {
    let gameNode = Game.getObjectById(node.id)
    if (gameNode) {
      energy = gameNode.store.getUsedCapacity(RESOURCE_ENERGY)
    }
  }
  if (!parent.srcs) { parent.srcs = {} }
  if (energy) {
    parent.srcs[node.id] = energy
  } else {
    delete parent.srcs[node.id]
  }
}
module.exports.registerSrcToParent = registerSrcToParent
function registerDestToParent (node, baseManifest) {
  try {
    if (typeof node === 'string') {
      node = Memory.nodes[node]
    }
    let parent = Memory.nodes[node.parent]
    if (!parent.dests){
      parent.dests = {}
    }
    switch (node.type) {
      case 'build':
        let buildNode = Game.getObjectById(node.id)
        if (buildNode) {
          let energyNeeded = buildNode.progressTotal - buildNode.progress
          if (energyNeeded > 0) {
            parent.dests[node.id] = energyNeeded
          } else {
            deregisterEnergyDest(node.id, parent)
          }
        } else {
          deregisterEnergyDest(node.id, parent)
        }
        break
      case STRUCTURE_CONTAINER:
        switch (node.subType) {
          case 'src':
            break
          case 'dist':
            let distNode = Game.getObjectById(node.id)
            if (distNode) {
              let energyNeeded = distNode.store.getFreeCapacity(RESOURCE_ENERGY)
              if (energyNeeded > 0) {
                parent.dests[node.id] = energyNeeded
              } else {
                //delete parent.dests[node.id]
                deregisterEnergyDest(node.id, parent)
              }
              let energy = distNode.store.getUsedCapacity(RESOURCE_ENERGY)
              if (!energy && node.children && node.children[STRUCTURE_EXTENSION]) {
                proxyDestChildren(node, node.children[STRUCTURE_EXTENSION])
              }
            }
            break
        }
        break
      case STRUCTURE_EXTENSION:
        let gameNode = Game.getObjectById(node.id)
        if (gameNode) {
          let energyNeeded = gameNode.store.getFreeCapacity(RESOURCE_ENERGY)
          if (energyNeeded > 0) {
            parent.dests[node.id] = energyNeeded
          } else {
            //delete parent.dests[node.id]
            deregisterEnergyDest(node.id, parent)
          }
          let energy = gameNode.store.getUsedCapacity(RESOURCE_ENERGY)
          if (!energy && node.children && node.children[STRUCTURE_EXTENSION]) {
            proxyDestChildren(node, node.children[STRUCTURE_EXTENSION])
          }
        }

        break
      case 'ec':
        //console.log(node.children, node.children[STRUCTURE_EXTENSION]?.length, Memory.nodes[node.children.container[0]],
        //  Memory.nodes[node.children.container[0]].creeps?.supplier?.length === 0)

        proxyDestChildren(node, node.children[STRUCTURE_EXTENSION])
        //proxySrcChildren(node)
        //if (node.children && node.children[STRUCTURE_EXTENSION]?.length && Memory.nodes[node.children.container[0]] &&
        //  Memory.nodes[node.children.container[0]].creeps?.supplier?.length === 0) {
        //  proxyDestChildren(node, node.children[STRUCTURE_EXTENSION])
        //} else {
        //  proxyDestChildren(node)
        //}
        // extension clusters will make their container available if all extensions are full (no personal dests) && theres no spawn req in queue
        if (node.dests && Object.keys(node.dests)?.length === 0) {
          proxySrcChildren(node)
        }


        //if (node.children && node.children[STRUCTURE_CONTAINER] && node.children[STRUCTURE_CONTAINER][0]) {
        //  let contId = node.children[STRUCTURE_CONTAINER][0]
        //  let gameNode = Game.getObjectById(contId)
        //  if (gameNode) {
        //    let energyNeeded = gameNode.store.getFreeCapacity(RESOURCE_ENERGY)
        //    if (energyNeeded > 0) {
        //      parent.dests[contId] = energyNeeded
        //    } else {
        //      parent.dests[contId] = 0
        //    }
        //  }
        //}
        break
      case STRUCTURE_SPAWN:
        proxyDestChildren(node)
        let gameSpawn = Game.getObjectById(node.id)
        if (gameSpawn) {
          let energyNeeded = gameSpawn.store.getFreeCapacity(RESOURCE_ENERGY)
          if (energyNeeded > 0) {
            parent.dests[node.id] = energyNeeded
          } else {
            //delete parent.dests[node.id]
            deregisterEnergyDest(node.id, parent)

          }
        }
        break
      case 9:
        break
    }
  } catch (e) {
    console.log('Error: registerDestToParent', node?.id, e.stack)
  }
}
module.exports.registerDestToParent = registerDestToParent

function deleteNode (node, baseManifest) {
  if (typeof node === 'string') {node = Memory.nodes[node]}
  applyToChildren(node, {}, (child) => {child.parent = node.parent}, false, 1) // move all children to this parent
  deleteNodeReqs(baseManifest, node, 'spawn')
  //deregisterEnergyDest(node.id, node.parent)
  //deregisterEnergySrc(node.id, node.parent)
  removeNodeFromParent(node, node.parent)
  delete Memory.nodes[node.id]
}
module.exports.deleteNode = deleteNode
function getDist (n1, n2) {
  let pPos = getNodePos(n1)
  let nPos = getNodePos(n2)
  if (pPos && nPos) {
    //console.log('got parent pos',  nPos,  n1, n1?.type, pPos, n2, n2?.type)
    return pPos.findPathTo(nPos, {ignoreCreeps: true})?.length
  } else {
    console.log('no parent pos or node pos here: ',  nPos,  n1, pPos, n2)
  }
}
module.exports.getDist = getDist

function addNodeToParent (node, parentId, newId, newType) {
  if (typeof node === 'string') {
    node = Memory.nodes[node]
  }
  if (!node || !parentId || !node.type) {
    console.log('ERROR: Failed to add node to parent', 'parentId:', parentId, 'node:', JSON.stringify(node))
    return
  }
  if (node.parent) {
    if (node.parent === parentId && !newId) {
      console.log('Error: adding node to parent it was already the child of: node:', node.type, node.id, 'parent:', parentId, '(but if newId, ok) newId:', newId)
      console.log('Node parent of above: ', Memory.nodes[node.parent] && Memory.nodes[node.parent].type, node.parent )
    }
    removeNodeFromParent(node, node.parent)
  }
  if (newId) { // if we are changing the node id, that happens here after old id has been removed
    node.spawnReqCount = 0
    delete Memory.nodes[node.id]
    node.id = newId
  }
  if (newType) {
    node.type = newType
  }
  let parent = Memory.nodes[parentId]
  node.dist = getDist(parent, node)
  //switch (parent.type) {
  //  case 'log':
  //    switch (node.type) {
  //      case STRUCTURE_CONTAINER:
  //        switch (node.subType) {
  //          case 'src':
  //            if (!parent.srcContainers) {parent.srcContainers = [node.id]
  //            } else if (!parent.srcContainers.some(c => c === node.id)) {
  //              parent.srcContainers.push(node.id)
  //            }
  //
  //            if (nPos && pPos) {
  //              node.dist = pPos.findPathTo(nPos, {ignoreCreeps: true})?.length
  //            }
  //            break
  //          default:
  //          case 'log':
  //            if (!parent.logContainers) {parent.logContainers = [node.id]
  //            } else if (!parent.logContainers.some(c => c === node.id)) {
  //              parent.logContainers.push(node.id)
  //            }
  //            break
  //        }
  //        break
  //    }
  //    break
  //}
  if (!Memory.nodes[parentId].children) {
    Memory.nodes[parentId].children = {}
  }
  if (!Memory.nodes[parentId].children[node.type]) {
    Memory.nodes[parentId].children[node.type] = [node.id]
  } else if (!Memory.nodes[parentId].children[node.type].some(cId => cId === node.id)) {
    Memory.nodes[parentId].children[node.type].push(node.id)
  }
  node.parent = parentId

  Memory.nodes[node.id] = node
  if (newId && node.creeps) {
    Object.keys(node.creeps).forEach(role => {
      node.creeps[role].forEach(cId => {
        addCreepToNode(node.id, role, cId)
      })
    })
  }
}
module.exports.addNodeToParent = addNodeToParent

// const nodeTypeMap = {
//     log: 'log',
//
//     source: 'src',
//     src: 'src',
//
//     [STRUCTURE_SPAWN]: 'spawn', // STRUCTURE_SPAWN is the same thing as 'spawn'
//
//     [STRUCTURE_CONTROLLER]: 'controller', // STRUCTURE_CONTROLLER is the same thing as 'controller'
//     con: 'controller',
//
//     frt: 'fort',
//     fort: 'fort'
// }

const VALID_NODE_TYPES = [
  'base', 'src', 'fort', 'log',            // non STRUCTURE_* types
  'spawn', 'controller',                       // STRUCTURE_* types
]
function removeNodeFromParent (node, parentId) {
  if (!node || !parentId || !node.type) {
    console.log('ERROR: Failed to remove node from parent', 'parentId:', parentId, 'node:', JSON.stringify(node))
    return
  }
  if (Memory.nodes[parentId]) {
    if (Memory.nodes[parentId].children && Memory.nodes[parentId].children[node.type]) {
      let parent = Memory.nodes[parentId]
      //switch (parent.type) {
      //  case 'log':
      //    switch (node.type) {
      //      case STRUCTURE_CONTAINER:
      //        switch (node.subType) {
      //          case 'src':
      //            if (parent.srcContainers) {
      //              parent.srcContainers = parent.srcContainers.filter(c => c === node.id)
      //            }
      //            break
      //          default:
      //          case 'log':
      //            if (parent.logContainers) {
      //              parent.logContainers = parent.logContainers.filter(c => c === node.id)
      //            }
      //            break
      //        }
      //        break
      //    }
      //    break
      //}
    }
    deregisterEnergyDest(node.id, parentId)
    deregisterEnergySrc(node.id, parentId)
    Memory.nodes[parentId].children[node.type] = Memory.nodes[parentId].children[node.type].filter(id =>  id !== node.id)
    Memory.nodes[node.id] = node
    delete node.dist
  }
  node.parent = null
}
module.exports.removeNodeFromParent = removeNodeFromParent

function getNodePos (nodeOrId) {
  let node
  if (typeof nodeOrId === 'string') {
    node = Memory.nodes[nodeOrId]
  } else {
    node = nodeOrId
  }
  switch (node.type) {
    case 'log':
      if (node.pos) {
        return deserializePos(node.pos)
      } else {
        return
      }
    case STRUCTURE_CONTAINER:
    case STRUCTURE_SPAWN:
    case STRUCTURE_CONTROLLER:
    case 'src':
      return Game.getObjectById(node.id)?.pos
    case 'base':
    case 'def':
      return deserializePos(node.pos)
    case 'ec':
      return deserializePos(node.pos)
    case 'build':
      if (node.pos) {
        return deserializePos(node.pos)
      }
      break
    default:
      console.log('Error: could not get position of node: ', node?.id, node?.type, JSON.stringify(node))
      break
  }
}
module.exports.getNodePos = getNodePos

function getNewStorageNodeSiteByBestSrc (node) {
  let best = {slots: 0, pos: undefined, id: undefined, ept: 0}
  let nextBest = {slots: 0, pos: undefined, id: undefined, ept: 0}
  //let roomName
  // find 2 largest nodes, put logistic node in mid-point by path.
  node.children.src.forEach(srcId => {
    let gameSrc = Game.getObjectById(srcId)
    let src = Memory.nodes[srcId]
    if (!src.threat) {
      if ((src.ept * Object.keys(src.slots).length) > nextBest.ept) {
        if ((src.ept * Object.keys(src.slots).length) > best.ept) {
          nextBest = best
          best = {ept: src.ept * Object.keys(src.slots).length, pos: gameSrc.pos, id: src.id}
        } else {
          nextBest = {ept: src.ept * Object.keys(src.slots).length, pos: gameSrc.pos, id: src.id}
        }
      }
      //const nSlots =  Object.keys(src.slots).length
      //if (nSlots > best.slots) {
      //  nextBest = best
      //  best = {slots: nSlots, pos: gameSrc.pos, id: src.id}
      //  roomName = gameSrc.pos.roomName
      //} else if (nSlots > nextBest.slots) {
      //  nextBest = {slots: nSlots, pos: gameSrc.pos, id: src.id}
      //}
    }
  })
  let path = best.pos.findPathTo(nextBest.pos, {ignoreCreeps: true})
  let location = path[Math.ceil(path.length / 2)]
  if (!!location?.x && !!location?.y && !!best.pos.roomName) {
    return {x: location.x, y: location.y, roomName: best.pos.roomName}

  }
}

// function findPosByWeightedPath (nodesToService = [], weights = {}, modSrcSlots = true) {
// 	let midPoints = []
// 	let roomName
// 	let idWeights = {}
// 	for (let i = 0; i < nodesToService.length - 1; i++) {
// 		let n1 = Memory.nodes[nodesToService[i]]
// 		let n1Pos = getNodePos(n1)
// 		roomName = n1Pos?.roomName ? n1Pos?.roomName : roomName
// 		console.log('n1Pos', n1Pos.x, n1Pos.y)
// 		if (!n1.threat && n1Pos) {
// 			for (let j = i + 1; j < nodesToService.length; j++) {
// 				let n2 = Memory.nodes[nodesToService[j]]
// 				let n2Pos = getNodePos(n2)
// 				if (!n2.threat && n2Pos) {
// 					let path = n1Pos.findPathTo(n2Pos, {ignoreCreeps: true})
//
//
// 					if (!idWeights[n1.id]  && idWeights[n1.id]  !== 0) {
// 						let weight = (n1.type in weights) ? weights[n1.type] : 1
// 						if (modSrcSlots && n1.type === 'src' && n1.slots) { // special src slot weight mod
// 							weight = weight * ((Object.keys(n1.slots).length - 1) / 3)
// 						}
// 						idWeights[n1.id] = weight
// 					}
// 					if (!idWeights[n2.id]  && idWeights[n2.id]  !== 0) {
// 						let weight = (n2.type in weights) ? weights[n2.type] : 1
// 						if (modSrcSlots && n2.type === 'src' && n2.slots) { // special src slot weight mod
// 							weight = weight * ((Object.keys(n2.slots).length - 1) / 3)
// 						}
// 						idWeights[n2.id] = weight
// 					}
// 					const w1 = idWeights[n1.id]
// 					const w2 = idWeights[n2.id]
// 					const weightedMidPoint = w2 / (w2 + w1)
// 					console.log('weightedMidPoint', weightedMidPoint)
// 					let midPoint = path[Math.round(path.length * weightedMidPoint)]
// 					if (!midPoint) {
// 						console.log(Math.round(path.length / 2), 'path', JSON.stringify(path), 'mid', midPoint, 'n2Is', n2.id, 'n2Pos: ', n2Pos,n1.id, 'n1Pos', n1Pos)
// 					} else {
// 						midPoints.push(midPoint)
// 					}
// 				}
//
// 			}
// 		}
//
// 	}
// 	log({nodesToService})
// 	let x = 0
// 	let y = 0
// 	let count = midPoints.length
// 	midPoints.forEach(point => {
// 		log(serializePos(point))
// 		x = x + point.x
// 		y = y + point.y
// 	})
// 	x = Math.round(x / count)
// 	y = Math.round(y / count)
// 	console.log('x', x, 'y', y) // get this away from walls
//
// 	return {x, y, roomName}
// }

// function findPosToServiceNodes (nodesToService = [], weights = {}, modSrcSlots = true) {
// 	return findPosByWeightedPath(nodesToService, weights, modSrcSlots)
// 	// return
// 	let rawX = {}
// 	let rawY = {}
// 	let calculatedWeight = {}
// 	let roomName
// 	nodesToService.forEach(nodeId => {
// 		let servicedNode = Memory.nodes[nodeId]
// 		if (servicedNode.threat) { return } // skip dangerous nodes
// 		let nodePos = getNodePos(servicedNode)
// 		if (nodePos) {
// 			let weight = (servicedNode.type in weights) ? weights[servicedNode.type] : 1
// 			if (modSrcSlots && servicedNode.type === 'src' && servicedNode.slots) { // special src slot weight mod
// 				weight = weight * ((Object.keys(servicedNode.slots).length - 1) / 3)
// 			}
// 			calculatedWeight[nodeId] = weight
// 			rawX[nodeId] = nodePos.x
// 			rawY[nodeId] = nodePos.y
// 			roomName = nodePos.roomName
// 		} else {
// 			console.log('Error: nodePos not found! skipping node')
// 			log({nodeId, nodePos, servicedNode})
// 		}
// 	})
// 	let weightSum = 0
// 	Object.keys(calculatedWeight).forEach(id => { weightSum = weightSum + calculatedWeight[id] })
// 	let weightedX = 0
// 	let weightedY = 0
// 	Object.keys(rawX).forEach(id => {
// 		weightedX = weightedX + (rawX[id] * (calculatedWeight[id] / weightSum))
// 		weightedY = weightedY + (rawY[id] * (calculatedWeight[id] / weightSum))
// 	})
// 	const x = Math.round(weightedX)
// 	const y = Math.round(weightedY)
//
//
// 	log({nodesToService, weights, weightSum, calculatedWeight})
// 	console.log('x', x, 'y', y, 'weightedX', weightedX, 'weightedY', weightedY) // get this away from walls
//
// 	return {x, y, roomName}
// }
// module.exports.findPosToServiceNodes = findPosToServiceNodes
function getNewStorageNodeSiteByDest (parent) {
  let importantChildren = getChildren(parent, [STRUCTURE_SPAWN, STRUCTURE_CONTROLLER], undefined, true)
  let gameNode1 = Game.getObjectById(importantChildren[0])
  let gameNode2 = Game.getObjectById(importantChildren[1])
  let path = gameNode1.pos.findPathTo(gameNode2.pos, {ignoreCreeps: true})
  let midPoint1 = path[Math.round(path.length / 2)]
  const {x, y, roomName} = getNewStorageNodeSiteByBestSrc(parent)
  //node.extra = extra
  let midConsumers = new RoomPosition(midPoint1.x, midPoint1.y, roomName)
  let midProducers = new RoomPosition(x, y, roomName)
  let midPath = midConsumers.findPathTo(midProducers, {ignoreCreeps: true})
  let final = midPath[Math.round(midPath.length / 4)]
  return {x: final.x, y: final.y, roomName: roomName}
}
module.exports.getNewStorageNodeSiteByDest = getNewStorageNodeSiteByDest

function avgPosOfNodes (nodes = []) {
  let pos = {x: 0, y: 0, roomName: '', count: 0}
  nodes.forEach(n => {
    if (typeof n === 'string') { n = Memory.nodes[n]}
    let gameNode = Game.getObjectById(n.id)
    pos.count = pos.count + 1
    pos.x = pos.x + gameNode.pos.x
    pos.y = pos.y + gameNode.pos.y
    pos.roomName = gameNode.pos.roomName
  })
  return {x: Math.round(pos.x / pos.count), y: Math.round(pos.y / pos.count), roomName: pos.roomName}
}
function getNewStorageNodeSiteForDestAndSrcs (parent, consumerPos, srcs) {
  //let importantChildren = getChildren(parent, [STRUCTURE_SPAWN], undefined, true)
  //let gameNode1 = Game.getObjectById(importantChildren[0])
  //let gameNode2 = Game.getObjectById(importantChildren[1])
  //let path = gameNode1.pos.findPathTo(gameNode2.pos, {ignoreCreeps: true})
  //let midPoint1 = path[Math.round(path.length / 2)]
  //const {x, y, roomName} = getNewStorageNodeSiteByBestSrc(parent)
  //node.extra = extra

  //let midProducers = new RoomPosition(x, y, roomName)
  let AvgSrcPos = avgPosOfNodes(srcs)
  let midSrcs = new RoomPosition(AvgSrcPos.x, AvgSrcPos.y, AvgSrcPos.roomName)
  let midPath = consumerPos.findPathTo(midSrcs, {ignoreCreeps: true})
  let final = midPath[Math.min(Math.round(midPath.length / 4), 3)]
  return {x: final.x, y: final.y, roomName: AvgSrcPos.roomName}
}
function createNodePosition (parent, type, node) {
  switch (type) {
    //case 'log':
      // let nodesToService = getChildren(parent, ['src', 'controller', 'spawn'], true)
      // let nodesToService = getChildren(parent, ['src', 'controller'], true)
      // const {x, y, roomName} = findPosToServiceNodes(nodesToService, {src: 1, controller: 1, spawn: 0})
      //return {x, y, roomName} = getNewStorageNodeSiteByDest(parent)
      ////node.extra = extra
      ////const {x, y, roomName} = getNewStorageNodeSiteByBestSrc(parent)
      //return new RoomPosition(x,y,roomName)
      //break
    case 'log':
      let spawnId = getChildren(parent, [STRUCTURE_SPAWN], undefined, true)
      let gameSpawn = Game.getObjectById(spawnId)
      let srcs
      if (!node.serviced) {
        srcs = getChildren(parent, [STRUCTURE_CONTAINER], (child) => child.subType === 'src', true)
        node.serviced = srcs
      } else {
        srcs = node.serviced
      }
      const {x, y, roomName} = getNewStorageNodeSiteForDestAndSrcs(parent, gameSpawn.pos, srcs)
      return new RoomPosition(x,y,roomName)
    default:
      log(node)
      console.log('Error: do not know how to position this node. log above', node.type, node.id)
  }
}
module.exports.createNodePosition = createNodePosition

function evalDest (id) {

  const node = Memory.nodes[id]
  switch (node.type) {
    case STRUCTURE_SPAWN:
      return {trg: id, action: 'transfer'} // could we make sure that theres not a spawn queue first here?
    case STRUCTURE_EXTENSION:
    case STRUCTURE_CONTAINER:
      return {trg: id, action: 'transfer'}
    case 'base':
      if (node.children?.spawn && node.children.spawn[0]) {
        return {trg: node.children.spawn[0], action: 'transfer'}
      }
      break
    case 'build':
      return {trg: id, action: 'build'}
    default:
      console.log('default node.type used for evalDest: ', node.type, id)
      return {trg: id, action: 'transfer'}
  }
}

/**
 *
 * @param node
 * @param creep
 * @param params
 * @return {{trg: *, action: string}|{trg: *, action: string}|{trg: *, action: string}|{trg: *, action: string}|{trg: *, action: string}|{trg: *, action: string}|*|boolean|boolean}
 */
function getDestNode (node, creep, params = {}) {
  try {
    const {
      energy = creep?.store?.getUsedCapacity(), // how much energy the creep has to give to dest
      canWork = creep?.getActiveBodyparts(WORK), // does creep have work body parts
      minCapacity // minimum capacity that the dest should have to allow targeting
    } = params
    let minDestCapacity = minCapacity || (energy * .5) // (creep.memory.minLoad || .5)
    if (typeof node === 'string') { node = Memory.nodes[node] }
    if (node.dests && Object.keys(node.dests).length) { // check srcs obj of node to see if registered energy is here
      let alternate
      for (let id in node.dests) {
        if (id !== creep?.memory?.nodeId) {
          if (!Memory.nodes[id]) {
            console.log('1234 we just tried to get a node Dest that no longer exists. theres logic to delete it, but it may not be needed', id, node.id, node.type)
            deregisterEnergyDest(id, node) // delete srcs that dont exist anymore
          } else {
            const destCap = node.dests[id]
            if (destCap && (canWork || !NEEDS_WORK[Memory.nodes[id]?.type])) { // if registered src has more than 0 energy:
              if (destCap > energy) {                                          //   if registered src has more energy than creep needs:
                const trgInfo = evalDest(id)   // PRIMARY              //     => build trgInfo for src and
                if (trgInfo) { return trgInfo }                                  //     => return trgInfo
              } else if (destCap > minDestCapacity) {                             //   Else Src still has energy, if destCap > energy current minDestCapacity,
                alternate = id                                                   //     => remember it in case there's not a better one
                minDestCapacity = destCap                          // ALT               //     => raise minSrcEnergy to new best alternate
              }
            }
          }
        }

      }
      if (alternate) {
        const trgInfo = evalDest(alternate)
        if (trgInfo) { return trgInfo }
      }
    }
    if (node.parent) {
      return getDestNode(node.parent, creep, params) // this line        // PARENT
    } else {
      //console.log('NO DEST FOUND AT ALL. checking piles:', creep.name, creep.pos.x, creep.pos.y, node.type, node.id)
      //let trg = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {maxOps: 500, ignoreCreeps: true})?.id
      //if (trg) {
      //  return {trg: trg, action: 'drop'}                       // PILE
      //}
      return false
    }
  } catch (e) {
    console.log('Error: error thrown in getDestNode', node.id, node.type, creep.name, e.stack)
  }
}
module.exports.getDestNode = getDestNode

function evalSrc (id) {
  const node = Memory.nodes[id]
  switch (node.type) {
    case STRUCTURE_SPAWN:
      return {trg: id, action: 'withdraw'}
    case STRUCTURE_CONTAINER:
      return {trg: id, action: 'withdraw'}
    case 'base':
      if (node.children?.spawn && node.children.spawn[0]) {
        return {trg: node.children.spawn[0], action: 'withdraw'}
      }
      break
    case 'src':
      return {trg: id, action: 'harvest'}
    default:
      console.log('default node.type used for evalSrc: ', node.type, id)
      return {trg: id, action: 'withdraw'}
  }
}

const NEEDS_WORK = {
  src: true,
  build: true
}

/**
 *
 * @param node
 * @param creep
 * @param params
 * @return {{trg: *, action: string}|{trg: *, action: string}|{trg: *, action: string}|{trg: *, action: string}|{trg: *, action: string}|*|{trg: *, action: string}|boolean|boolean}
 */
function getSrcNode (node, creep, params = {}) {
  try {
    const {
      energyNeeded = creep?.store?.getFreeCapacity(),
      canWork = creep?.getActiveBodyparts(WORK),
      minEnergyNeeded
    } = params
    let minSrcEnergy = minEnergyNeeded || (energyNeeded * .5) // (creep.memory.minLoad || .5)
    if (typeof node === 'string') { node = Memory.nodes[node] }
    if (node.srcs  && Object.keys(node.srcs).length) { // check srcs obj of node to see if registered energyNeeded is here
      let alternate
      for (let id in node.srcs) {
        if (!Memory.nodes[id]) {
            console.log('1234 we just tried to get a node src that no longer exists. theres logic to delete it, but it may not be needed', id, node.id, node.type)
            deregisterEnergySrc(id, node) // delete srcs that dont exist anymore
        } else {
          const srcEnergy = node.srcs[id]
          if (srcEnergy && (canWork || !NEEDS_WORK[Memory.nodes[id]?.type])) { // if registered src has more than 0 energy:
            if (srcEnergy > energyNeeded) {                                          //   if registered src has more energyNeeded than creep needs:
              const trgInfo = evalSrc(id)                 //     => build trgInfo for src and
              if (trgInfo) { return trgInfo }                                  //     => return trgInfo
            } else if (srcEnergy > minSrcEnergy) {                             //   Else Src still has energy, if srcEnergy > energyNeeded current minSrcEnergy,
              alternate = id                                                   //     => remember it in case there's not a better one
              minSrcEnergy = srcEnergy                                         //     => raise minSrcEnergy to new best alternate
            }
          }
        }
      }
      if (alternate) {
        const trgInfo = evalSrc(alternate)
        if (trgInfo) { return trgInfo }
      }
    }
    if (node.parent) {
      return getSrcNode(node.parent, creep, params) // this line
    } else {
      //console.log('NO SOURCE FOUND AT ALL. checking dropped sources:', creep.name, creep.pos.x, creep.pos.y, node.type, node.id)
      //let trg = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {maxOps: 500, ignoreCreeps: true})?.id
      //if (trg) {
      //  return {trg: trg, action: 'pickup'}
      //}
      return false
    }
  } catch (e) {
    console.log('Error: error thrown in getSrcNode', node.id, node.type, creep.name, e.stack)
  }
}
module.exports.getSrcNode = getSrcNode
/**
 * getChildren(node, types, includeSelf) => array of nodes
 *
 * @param node - the node from which to start looking for children
 * @param types - a nodeType or array of nodeTypes to return. leave empty for "all children"
 * @param filter - a function that take a node, and returns true/false for if it should be included
 * @param asIds - a nodeType or array of nodeTypes to return. leave empty for "all children"
 * @param skipSelf - True: original node arg will not be returned, even if it matches, False: Original node arg can be in array
 * @param depth - "-1": inf. depth; "1" nodes children only; "2": nodes children and their children only
 * @return {[]} - array of child nodes that match types array, or all children when types is empty
 */
function getChildren (node, types = [], filter = (child) => true, asIds = false, depth = -1, skipSelf = true) {
  if (typeof types === 'string') { types = [types] } // make sure types is an array of strings
  const getAll = types.length === 0
  let nodeAcc = {nodes: []}
  if (getAll) {
    applyToChildren(node, nodeAcc, (child, acc) => {
      if ((getAll || types.includes(child.type)) && filter(child)) {
        acc.nodes.push(asIds ? child.id : child)
      }
    }, skipSelf, depth)
  } else {
    if (!skipSelf && types.includes(node.type) && filter(node)) {
      nodeAcc.nodes.push(asIds ? node.id : node)
    }
    if (depth < 0 || depth > 0) {
      types.forEach(type => {
        if (node.children && node.children[type]) {
          node.children[type].forEach(childId => {
            nodeAcc.nodes = nodeAcc.nodes.concat(getChildren(Memory.nodes[childId], types, filter, asIds, depth - 1, false))
          })
        }
      })
    }
  }
  return nodeAcc.nodes
}
module.exports.getChildren = getChildren

function applyToChildren (node, acc = {}, func = (childNode, acc) => {}, skipSelf = false, depth = -1) {
  // let node = nodeOrId // if node passed in, set node to node
  // if (typeof node === 'string') { // if id passed in, get node by id and set it to node
  // 	node = Memory.nodes[nodeOrId]
  // }
  if (!skipSelf) { func(node, acc) }
  // node = newNode ? newNode : node // if they return something, set node to that.
  if (node.children && (depth < 0 || depth > 0)) {
    Object.keys(node.children).forEach(nodeType => {
      node.children[nodeType].forEach(childId => {
        applyToChildren(Memory.nodes[childId], acc, func, false, depth - 1)
      })
    })
  }
}
module.exports.applyToChildren = applyToChildren
const childRunOrder = ['src', STRUCTURE_CONTROLLER, STRUCTURE_SPAWN, ]
function runChildren (node, lineage, baseManifest) {
  if (!node || !node.children) {
    return
  }

  //if (node.creeps) {
  //  Object.keys(node.creeps).forEach(role => {
  //    if (node.creeps[role]) {
  //      node.creeps[role] = node.creeps[role].filter(id => !!Game.creeps[id])
  //    }
  //  })
  //}
  //if (node.children.sto) {
  //  node.children.log = node.children.sto
  //  node.children.log.forEach(stoId => {
  //    addNodeToParent(Memory.nodes[stoId], node.id, stoId, 'log')
  //  })
  //}
  //delete node.children.sto

  let childLineage = [...lineage, node.id]
  for (let nodeType in node.children) {
    let nodeRunnerDef = getNodeRunner(nodeType)
    //let uniqueChildren = []
    //node.children[nodeType].forEach(id => {
    //  if (!uniqueChildren.includes(id)) {
    //    uniqueChildren.push(id)
    //  }
    //})
    //node.children[nodeType] = uniqueChildren
    if (nodeRunnerDef) {
      node.children[nodeType].forEach(nodeId => {
        try {
          nodeRunnerDef.runner.run(Memory.nodes[nodeId], childLineage, baseManifest)
        } catch (e) {
          console.log('Error: failed to run Node children:', e.stack, node.type, node.id, 'child: ', nodeId, Memory.nodes[nodeId] && Memory.nodes[nodeId].type)
        }
      })
    }
  }

}
module.exports.runChildren = runChildren

function getNodeBase (nodeId) {
  let node = Memory.nodes[nodeId]
  let count = 0
  while (node && node?.type !== 'base' && node.parent && count < 50) {
    node = Memory.nodes[node.parent]
    count++
  }
  if (!node || count === 50) {
    log({node})
    console.log('Error: inf. loop getting node base:', nodeId, count)
  } else {
    return node
  }
}
module.exports.getNodeBase = getNodeBase

function removeCreepFromNode (nodeId, role, creepName) {
  let creepMem = Memory.creeps[creepName]
  if (nodeId !== creepMem?.nodeId) {
    console.log('Error: removing creep from node it wasnt a part of', nodeId, creepMem?.nodeId)
  }
  if (creepMem) {
    delete creepMem.nodeId
  }
  if (
    Memory.nodes[nodeId] && // and the prev node exists
    Memory.nodes[nodeId].creeps
  ) {
    Memory.nodes[nodeId].recalcEpt = true
    const isSrcNode = Memory.nodes[nodeId].type === 'src'
    if (!role) {
      Object.keys(Memory.nodes[nodeId].creeps).forEach(r => {
        Memory.nodes[nodeId].creeps[r] = Memory.nodes[nodeId].creeps[r].filter(cId => cId !== creepName) // remove creep from old node and role
        if (isSrcNode && r === 'miner') {
          Memory.nodes[nodeId].totalEpt = Math.min(((Memory.nodes[nodeId].ept || 0) * (Memory.nodes[nodeId]?.creeps?.miner?.length || 0)), 10)
        }
      })
    } else if (Memory.nodes[nodeId].creeps[role]) {
      if (Memory.nodes[nodeId].creeps[role].length <= 1) {
        delete Memory.nodes[nodeId].creeps[role]
      } else {
        Memory.nodes[nodeId].creeps[role] = Memory.nodes[nodeId].creeps[role].filter(cId => cId !== creepName && !!Game.creeps[cId]) // remove creep from old node and role
      }
      if (isSrcNode && role === 'miner') {
        Memory.nodes[nodeId].totalEpt = Math.min(((Memory.nodes[nodeId].ept || 0) * (Memory.nodes[nodeId]?.creeps?.miner?.length || 0)), 10)
      }
    }
  }
}
module.exports.removeCreepFromNode = removeCreepFromNode

//function recalcNodeEpt (baseManifest, node) {
//  const loadTicks = (3 * node.dist) + 5
//  const loadCap = Math.floor(baseManifest.spawnCapacity / 100) * 50
//  const eptTrans = loadCap / Math.max(loadTicks, 1) // how much energy a single creep can move from this container to its parent
//  let eptSrc = 0
//  const allChildren= getChildren(node, [], undefined, false, 1)
//  allChildren.forEach(c => {
//    if (c.totalEpt) {
//      eptSrc = eptSrc + c.totalEpt
//    }
//  })
//  node.totalEpt = eptTrans * (node.creeps?.supplier?.length || 0) // energy this containers srcs are bringing to this node.
//  node.supplierLoad = Math.round(eptSrc / eptTrans)
//}
function addCreepToNode (nodeId, role, creepName) {
  let creep = Game.creeps[creepName]
  if (creep) {
    if (

      creep.memory.nodeId && creep.memory.role &&
      (creep.memory.nodeId !== nodeId || (role && creep.memory.role !== role))
    ) {
      removeCreepFromNode(creep.memory.nodeId, creep.memory.role, creep.name)
    }
    if (!role && creep.memory.role) {
      role = creep.memory.role
    }
    // add to new node
    creep.memory.nodeId = nodeId
    creep.memory.role = role
  }

  if (!Memory.nodes[nodeId].creeps) { Memory.nodes[nodeId].creeps = {} }
  if (!Memory.nodes[nodeId].creeps[role]) { Memory.nodes[nodeId].creeps[role] = [] }

  if (!Memory.nodes[nodeId].creeps[role].includes(creepName)) {
    Memory.nodes[nodeId].creeps[role].push(creepName) // add creep to new node
  }
  let node = Memory.nodes[nodeId]
  switch (node.type) {
    case 'src':
      node.recalcEpt = true
      break
    case 'container':
      node.recalcEpt = true
  }
  //node.totalEpt = node.ept * miners.length
}

module.exports.addCreepToNode = addCreepToNode

function getTypeCreeps (node, type) {
  if (!node.creeps || !node.creeps[type]) {
    return []
  }
  //if (!node.creeps) {
  //  node.creeps = {}
  //}
  //if (!node.creeps[type]) {
  //  node.creeps[type] = []
  //}
  return node.creeps[type]
}
module.exports.getTypeCreeps = getTypeCreeps

function getNodeReqs (node) {
  if (!node.reqs) {
    node.reqs = []
  }
  return node.reqs
}
module.exports.getNodeReqs = getNodeReqs

