const {CREEP_MIN_LIFE_TICKS} = require('./config')
const {getDestNode} = require('./utils.nodes')
const {ACTIONS} = require('./actions')


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
//
//class Site {
//    constructor(id, parent) {
//        this.id = id;
//        this.parent = parent;
//        this.children = {};
//        this.srcs = []
//        this.dests = []
//        this.dist = null
//        this.type = null
//    }
//
//    addChild(child) {
//        this.children[child.type].push(child);
//    }
//
//    removeChild (id) {
//
//    }
//
//    requestCreep(role, priority = 1) {
//        this.requests.push({ type: 'creep', role, priority });
//    }
//
//    processEnergyFlow() {
//        if (this.energyNeeded()) {
//            const energyProviders = this.children.filter(child => child.canProvideEnergy());
//            for (const provider of energyProviders) {
//                provider.sendEnergy(this);
//            }
//        }
//    }
//
//    energyNeeded() {
//        return this.currentEnergy < this.maxEnergy;
//    }
//
//    canProvideEnergy() {
//        return this.currentEnergy > this.reserveEnergy;
//    }
//
//    sendEnergy(targetNode) {
//        // Logic to send energy to the target node
//    }
//}
//Object.defineProperty(Site.prototype, 'node', {
//    get: function() { return _.get(Memory, ['nodes', this.memory.nodeId]) }, enumerable: false, configurable: true
//});
//Object.defineProperty(Creep.prototype, 'energyNeeded', {
//    get: function() { return this.store.getFreeCapacity(RESOURCE_ENERGY) }, enumerable: false, configurable: true
//});
//Object.defineProperty(Creep.prototype, 'energy', {
//    get: function() { return this.store.getUsedCapacity(RESOURCE_ENERGY) }, enumerable: false, configurable: true
//});
//Object.defineProperty(Creep.prototype, 'capacity', {
//    get: function() { return this.store.getCapacity(RESOURCE_ENERGY) }, enumerable: false, configurable: true
//});
//
//
//Creep.prototype.runMiner = function runTask() {
//    if (this.energy > 0 || this.ticksToLive < CREEP_MIN_LIFE_TICKS) {
//        let trgInfo = getDestNode(this.node, this, {canWork: true, minCapacity: 1})
//        if (trgInfo.trg) {
//            ACTIONS[trgInfo.action].start(this, trgInfo.trg)
//        }
//    }
//    if (this.energyNeeded >= this.energy) {
//        ACTIONS.harvest.start(this, this.memory.nodeId)
//    }
//}
