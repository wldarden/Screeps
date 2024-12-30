const {log} = require('./utils.debug')
const {deserializePos} = require('./utils.memory')
const {registerEnergy} = require('./utils.manifest')


function getNodeRunner (nodeType) {
	switch (nodeType) {
		case 'src':
			return {runner: require('node.src')}
		case STRUCTURE_CONTROLLER:
			return {runner: require('node.controller')}
		case STRUCTURE_SPAWN:
			return {runner: require('node.spawn')}
		case 'sto':
			return {runner: require('node.storage')}
		case STRUCTURE_CONTAINER:
			return {runner: require('node.container')}
		case STRUCTURE_EXTENSION:
			return {runner: require('node.extension')}
		default:
			console.log('ERROR: No Node Runner for type: ', nodeType)
			return {runner: (...args) => {console.log('Null Node Runner')}}
	}
}
module.exports.getNodeRunner = getNodeRunner

function getNodePos (nodeOrId) {
	let node
	if (typeof nodeOrId === 'string') {
		node = Memory.nodes[nodeOrId]
	} else {
		node = nodeOrId
	}
	switch (node.type) {
		case 'sto':
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
		default:
			console.log('Error: could not get position of node: ', node?.id, node?.type, JSON.stringify(node))
	}
}
module.exports.getNodePos = getNodePos

function getNewStorageNodeSiteByBestSrc (node) {
    let best = {slots: 0, pos: undefined, id: undefined}
    let nextBest = {slots: 0, pos: undefined, id: undefined}
    let roomName
    // find 2 largest nodes, put storage node in mid-point by path.
    node.children.src.forEach(srcId => {
        let gameSrc = Game.getObjectById(srcId)
        let src = Memory.nodes[srcId]
        if (!src.threat) {
            const slots =  Object.keys(src.slots).length
            if (slots > best.slots) {
                nextBest = best
                best = {slots, pos: gameSrc.pos, id: src.id}
                roomName = gameSrc.pos.roomName
            } else if (slots > nextBest.slots) {
                nextBest = {slots, pos: gameSrc.pos, id: src.id}
            }
        }
    })
    let path = best.pos.findPathTo(nextBest.pos, {ignoreCreeps: true})
    let location = path[Math.ceil(path.length / 2.8)] // get about a third of the way to the closer one but sort of by the biggest one
    return {x: location.x, y: location.y, roomName: roomName}
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

function createNodePosition (parent, type) {
	switch (type) {
		case 'sto':
			// let nodesToService = getChildren(parent, ['src', 'controller', 'spawn'], true)
			// let nodesToService = getChildren(parent, ['src', 'controller'], true)
			// const {x, y, roomName} = findPosToServiceNodes(nodesToService, {src: 1, controller: 1, spawn: 0})
			const {x, y, roomName} = getNewStorageNodeSiteByBestSrc(parent)
			return new RoomPosition(x,y,roomName)
			break
		default:
			log(node)
			console.log('Error: do not know how to position this node. log above', node.type, node.id)
	}
}
module.exports.createNodePosition = createNodePosition

function registerEnergyState (baseManifest, id, srcPriority = 0, destPriority = 0) {
	const gameNode = Game.getObjectById(id)
	// let node = Memory.nodes[id]
	const energy = gameNode.store.getUsedCapacity(RESOURCE_ENERGY) || 0
	const capacity = gameNode.store.getCapacity(RESOURCE_ENERGY) || 0
	const frac = energy / capacity
	if (energy > 0) {
		const energyReq = {
			id: gameNode.id,
			amount: energy,
			pri: frac * srcPriority,
			action: 'withdraw'
		}
		registerEnergy(baseManifest, energyReq, 'src')
	}

	if (capacity > energy) {
		const energyReq = {
			id: gameNode.id,
			amount: (capacity - energy),
			pri: (1 - frac) * destPriority,
			action: 'transfer'
		}
		registerEnergy(baseManifest, energyReq, 'dest')
	}

}
module.exports.registerEnergyState = registerEnergyState

/**
 * getChildren(node, types, includeSelf) => array of nodes
 *
 * @param node - the node from which to start looking for children
 * @param types - a nodeType or array of nodeTypes to return. leave empty for "all children"
 * @param asIds - a nodeType or array of nodeTypes to return. leave empty for "all children"
 * @param skipSelf - True: original node arg will not be returned, even if it matches, False: Original node arg can be in array
 * @return {[]} - array of child nodes that match types array, or all children when types is empty
 */
function getChildren (node, types = [], asIds = false, skipSelf = true) {
	if (typeof types === 'string') { types = [types] } // make sure types is an array of strings
	const getAll = types.length === 0
	const nodeAcc = {nodes: []}
	applyToChildren(node, nodeAcc, (child, acc) => {
		if (getAll || types.includes(child.type)) {
			acc.nodes.push(asIds ? child.id : child)
		}
	}, skipSelf)
	return nodeAcc.nodes
}
module.exports.getChildren = getChildren

function applyToChildren (node, acc = {}, func = (childNode, acc) => {}, skipSelf = false) {
	// let node = nodeOrId // if node passed in, set node to node
	// if (typeof node === 'string') { // if id passed in, get node by id and set it to node
	// 	node = Memory.nodes[nodeOrId]
	// }
	if (!skipSelf) { func(node, acc) }
	// node = newNode ? newNode : node // if they return something, set node to that.
	if (node.children) {
		Object.keys(node.children).forEach(nodeType => {
			node.children[nodeType].forEach(childId => {
				applyToChildren(Memory.nodes[childId], acc, func, false)
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

	if (node.creeps) {
		Object.keys(node.creeps).forEach(role => {
			if (node.creeps[role]) {
				node.creeps[role] = node.creeps[role].filter(id => !!Game.creeps[id])
			}
		})
	}

	let childLineage = [...lineage, node.id]
	for (let nodeType in node.children) {
		let nodeRunnerDef = getNodeRunner(nodeType)
		node.children[nodeType].forEach(nodeId => {
			try {
				nodeRunnerDef.runner.run(Memory.nodes[nodeId], childLineage, baseManifest)
			} catch (e) {
				console.log('Error: failed to run Node children:', e.stack, node.type, node.id, 'child: ', nodeId, Memory.nodes[nodeId].type)
			}
		})
	}

}
module.exports.runChildren = runChildren

function getNodeBase (nodeId) {
	let node = Memory.nodes[nodeId]
	let count = 0
	while (node.type !== 'base' && count < 50) {
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

function addCreepToNode (nodeId, role, creepName) {
	let creep = Game.creeps[creepName]
	if (!creep) {
		console.log('Error: creep doesnt exist: ', creepName)
	}
	if (!Memory.nodes[nodeId].creeps) { Memory.nodes[nodeId].creeps = {} }
	if (!Memory.nodes[nodeId].creeps[role]) { Memory.nodes[nodeId].creeps[role] = [] }
	if (creep?.memory?.node && creep?.memory?.node !== nodeId) {
		// remove creep from node
		// removeCreepFromNode(nodeId, role, creepName)
	}
	Memory.nodes[nodeId].creeps[role].push(creepName) // add creep to new node
}

module.exports.addCreepToNode = addCreepToNode

function getTypeCreeps (node, type) {
	if (!node.creeps) {
		node.creeps = {}
	}
	if (!node.creeps[type]) {
		node.creeps[type] = []
	}
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

