const {PRIORITY} = require('./config')

function serializePos (pos) {
    if (typeof pos === 'string') {
        return pos
    }
    const x = (pos.x < 10) ? '0' + pos.x : pos.x.toString()
    const y = (pos.y < 10) ? '0' + pos.y : pos.y.toString()
    return x + y + pos.roomName;
}
module.exports.serializePos = serializePos

function deserializePos (pos) {
    if (typeof pos === 'string') {
        try {
            var x = parseInt(pos.slice(0, 2));
            var y = parseInt(pos.slice(2, 4));
            var room = pos.slice(4);
            return new RoomPosition(x, y, room);
        } catch (e) {
            console.log('ERROR: deserializingPos: ', 'stringified pos:', JSON.stringify(pos), 'obj pos:', pos, e)
        }
    } else {
        console.log('Tried to deseralize a non string: ', JSON.stringify(pos), pos)
        if (pos.x && pos.y && pos.roomName) {
            return new RoomPosition(pos.x, pos.y, pos.roomName)
        }
        return pos
    }
}
module.exports.deserializePos = deserializePos
function getBodyCost (body) {
    let total = 0
    for (let ci = 0; ci < body.length; ci++) {
        total = total + BODYPART_COST[PART_MAP[body[ci]]]
    }
    return total
}
module.exports.getBodyCost = getBodyCost

function serializeBody (body) {
    if (typeof body === 'string') {
        return body
    }
    let bodyString = ''
    body.forEach(part => {
        switch (part) {
            case CARRY:
                bodyString = bodyString + 'C'
                break
            case WORK:
                bodyString = bodyString + 'W'
                break
            case MOVE:
                bodyString = bodyString + 'M'
                break
        }
    })
    return bodyString
}
module.exports.serializeBody = serializeBody

const PART_MAP = {
    W: WORK,
    M: MOVE,
    C: CARRY,
    [WORK]: WORK,
    [MOVE]: MOVE,
    [CARRY]: CARRY
}
function deserializeBody (bodyString = '') {
    if (typeof bodyString !== 'string') {
        console.log('ERROR: desrializeBody recieved non-string:', JSON.stringify(bodyString))
        return []
    }
    let body = []
    for (let ci = 0; ci < bodyString.length; ci++) { body.push(PART_MAP[bodyString[ci]]) }
    return body
}
module.exports.deserializeBody = deserializeBody

/**
 * BaseNode - way to like nodes so that they can distribute and share resources
 *
 * Requires:
 * - src
 * - spawn
 * - controller
 *
 * Gets:
 * - new
 *
 * Wants:
 * - Make a new base
 * - children satisfied
 *
 * @param id
 * @param parentId
 * @return {{parent: *, children: {}, creeps: {}, id: *, type: string}}
 */
function createBaseNode (id, parentId = null) {
    return {
        parent: parentId, // undefined || nodeId
        id: id,
        type: 'base', // base, outpost, src, spawn, controller, logistic, fort,
        pos: '',
        stage: 0,
        // sub: subType, // STRUCTURE_*,
        children: {
            // src: [],
            // [STRUCTURE_SPAWN]: [],
            // [STRUCTURE_CONTROLLER]: []
        },
        creeps: {}
    }
}
module.exports.createBaseNode = createBaseNode


function addNodeToParent (node, parentId, newId, newType) {
    if (!node || !parentId || !node.type) {
        console.log('ERROR: Failed to add node to parent', 'parentId:', parentId, 'node:', JSON.stringify(node))
        return
    }
    if (node.parent) {
        if (node.parent === parentId) {
            console.log('Warning: adding node to parent it was already the child of: node:', node.type, node.id, 'parent:', parentId, '(but if newId, ok) newId:', newId)
            console.log('Node parent of above: ', Memory.nodes[node.parent] && Memory.nodes[node.parent].type, node.parent )
        }
        removeNodeFromParent(node, node.parent)
    }
    if (newId) { // if we are changing the node id, that happens here after old id has been removed
        delete Memory.nodes[node.id]
        node.id = newId
    }
    if (newType) {
      node.type = newType
    }
    if (!Memory.nodes[parentId].children[node.type]) {
        Memory.nodes[parentId].children[node.type] = [node.id]
    } else if (!Memory.nodes[parentId].children[node.type].some(cId => cId === node.id)) {
        Memory.nodes[parentId].children[node.type].push(node.id)
    }
    node.parent = parentId
    Memory.nodes[node.id] = node
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
    if (!Memory.nodes[parentId].children[node.type]) {
        Memory.nodes[parentId].children[node.type] = []
    }
    Memory.nodes[parentId].children[node.type] = Memory.nodes[parentId].children[node.type].filter(id =>  id !== node.id)
    node.parent = null
    delete node.dist
    Memory.nodes[node.id] = node
}
module.exports.removeNodeFromParent = removeNodeFromParent

function createSrcNode (id) {
    return {
        parent: null,
        id: id,
        type: 'src',
        slots: {},
        dist: 0,
        children: {
            // [STRUCTURE_CONTAINER]: []
        },
        creeps: {
            // courier: [],
            // miner: [],
            // builder: []
        },
        // sites: []
    }
}
module.exports.createSrcNode = createSrcNode

function createSpawnNode (id) {
    return {
        parent: null,
        id: id,
        type: STRUCTURE_SPAWN,
        children: {
            // [STRUCTURE_CONTAINER]: [],
            // [STRUCTURE_EXTENSION]: []
        },
        creeps: {
            // miner: [],
            // build: []
        },
        // sites: []
    }
}
module.exports.createSpawnNode = createSpawnNode

function createControllerNode (id) {
    return {
        parent: null,
        id: id,
        type: STRUCTURE_CONTROLLER,
        children: {
            // [STRUCTURE_CONTAINER]: []
        },
        creeps: {
            // upgrade: []
        },
        // sites: []
    }
}
module.exports.createControllerNode = createControllerNode

function createContainerNode (id, pos) {
    return {
        parent: null,
        id: id,
        pos: pos,
        stage: 0,
        type: STRUCTURE_CONTAINER
        // children: {}, // shouldn't ever have children...
    }
}
module.exports.createContainerNode = createContainerNode

function createExtensionNode (id, pos) {
    return {
        parent: null,
        id: id,
        stage: 0,
        type: STRUCTURE_EXTENSION,
        pos: pos
    }
}
module.exports.createExtensionNode = createExtensionNode


function createStorageNode (id) {
    return {
        // ...createNode(parentId, id, 'src')
        parent: null,
        id: id,
        type: 'log',
        stage: 0,
        children: {
            // [STRUCTURE_CONTAINER]: []
        },
        creeps: {
            // upgrade: []
        },
        sites: []
    }
}
module.exports.createStorageNode = createStorageNode

module.exports.node = {
    [STRUCTURE_CONTAINER]: {
        build: () => {

        }
    },
}

function createStandardNode () {
  return {
    parent: null,
    id: null,
    stage: 0,
    children: {},
    creeps: {}
  }
}
function buildNode (parentId, nodeType, pos, pri = PRIORITY.BUILD) {
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
  constructionNode.onDoneType = nodeType
  constructionNode.type = 'build'
  constructionNode.buildPri = pri
  addNodeToParent(constructionNode, parentId)
}
module.exports.buildNode = buildNode

function createStructureMap () {
    return {
        [STRUCTURE_CONTAINER]: [],
        [STRUCTURE_CONTROLLER]: [],
        [STRUCTURE_EXTENSION]: [],
        [STRUCTURE_SPAWN]: [],
        [STRUCTURE_STORAGE]: [],
        // piles: [], // places we dropped energy
        // [STRUCTURE_ROAD]: [],
        // [STRUCTURE_WALL]: [],
        // [STRUCTURE_RAMPART]: "rampart",
        // [STRUCTURE_KEEPER_LAIR]: "keeperLair",
        // [STRUCTURE_PORTAL]: "portal",
        // [STRUCTURE_LINK]: "link",
        // [STRUCTURE_TOWER]: "tower",
        // [STRUCTURE_OBSERVER]: "observer",
        // [STRUCTURE_POWER_BANK]: "powerBank",
        // [STRUCTURE_POWER_SPAWN]: "powerSpawn",
        // [STRUCTURE_EXTRACTOR]: "extractor",
        // [STRUCTURE_LAB]: "lab",
        // [STRUCTURE_TERMINAL]: "terminal",
        // [STRUCTURE_NUKER]: "nuker",
        // [STRUCTURE_FACTORY]: "factory",
        // [STRUCTURE_INVADER_CORE]: "invaderCore",
    }
}
