
const {registerSrcToParent, deregisterEnergyDest, getChildren, runChildren, getDestNode} = require('./utils.nodes')
const {log} = require('./utils.debug')
const {maintainRoleCreepsForNode} = require('./utils.creep')

// i take energy from parents and distribute to children
module.exports.run = function (node, lineage = [], baseManifest) {
    try {

        let gameNode = Game.getObjectById(node.id)
        const energyNeeded = gameNode.store.getFreeCapacity(RESOURCE_ENERGY)
        const energy = gameNode.store.getUsedCapacity(RESOURCE_ENERGY)
        const capacity = gameNode.store.getCapacity(RESOURCE_ENERGY)

        if (energyNeeded) {
            if (!node.dests) { node.dests = {} }
            node.dests[node.id] = energyNeeded
        } else {
            deregisterEnergyDest(node.id, node)
        }
        //console.log('src container node', node.id, energy)
        registerSrcToParent(node, node.parent, energy)

        maintainRoleCreepsForNode(baseManifest, node, 'supplier', node.supplierLoad)
        //let possibleSrc = getDestNode(node.id, undefined, {energy: 100, canWork: false})
        //console.log('possible container src dest: ',possibleSrc,  possibleSrc?.trg, node.id)
        runChildren(node, lineage, baseManifest)

        if ('dist' in node && (node.recalcEpt || !node.totalEpt)) {
            const loadTicks = (3 * node.dist) + 5
            const loadCap = Math.floor(baseManifest.spawnCapacity / 100) * 50
            const eptTrans = loadCap / Math.max(loadTicks, 1) // how much energy a single creep can move from this container to its parent
            let eptSrc = 0
            const allChildren= getChildren(node, [], undefined, false, 1)
            allChildren.forEach(c => { if (c.totalEpt) { eptSrc = eptSrc + c.totalEpt } })
            node.totalEpt = eptTrans * (node.creeps?.supplier?.length || 0) // energy this containers srcs are bringing to this node.
            node.supplierLoad = Math.round(eptSrc / eptTrans)
            lineage.forEach(id => {
                Memory.nodes[id].recalcEpt = true
            })
            console.log('calculated EPT of src.container:',node.supplierLoad , 'energy per second of current creeps away from node', node.totalEpt, node.id, 'energy from srcs', eptSrc, 'energy 1 creep can transport', eptTrans, eptSrc / eptTrans)
            delete node.recalcEpt
        }

    } catch(e) {
        log(Memory.nodes[node.id], ['ERROR', 'CONTAINER_NODE'])
        console.log('Error: failed to run Container.src Node', e.stack, node.id)
    }
}

