const {runChildren, getTypeCreeps, getNodeReqs} = require('./utils.nodes')
const {log} = require('./utils.debug')
const {addSpawnRequest, deleteReq} = require('./utils.manifest')
const {creepPlanInfo, ticksPerSpace} = require('./utils.creep')
const {serializeBody} = require('./utils.memory')

function maxSrcMiners (src) {
    if (src.cps) {
        return Math.floor(Math.max(src.cps, 1) * Object.keys(src.slots).length)
    } else {
        return Object.keys(src.slots).length
    }
}

function threatSrc (src, baseManifest) {
    if (src.reqs) {
        src.reqs.forEach(reqId => { deleteReq(baseManifest, reqId)})
    }
    return true
}

module.exports.run = function (src, lineage = [], baseManifest) {
    try {
        log(src, ['SRC_NODE', 'NODE'])
        if (src.threat) {  // threat srcs are skipped
            return threatSrc(src, baseManifest)
        }
        const miners = getTypeCreeps(src, 'miner')
        const maxMiners = maxSrcMiners(src)
        const saturation = miners.length / maxMiners

        if (saturation < 1 && getNodeReqs(src).length < 1) {
            let plan = [CARRY, MOVE, WORK, CARRY, MOVE]
            const {cost, partCounts} = creepPlanInfo(plan)
            const loadCap = partCounts[CARRY] * 50
            const fullWeight = plan.length - partCounts[MOVE]
            const emptyWeight = (fullWeight - partCounts[CARRY]) || 1
            const ticksPerSpaceTo = Math.min(Math.ceil(emptyWeight / partCounts[MOVE]))
            const ticksPerSpaceFrom = Math.min(Math.ceil(fullWeight / partCounts[MOVE]))
            const workTicks = loadCap / (partCounts[WORK] * 2)
            const loadTicks = (ticksPerSpaceTo * src.dist) + (ticksPerSpaceFrom * src.dist) + workTicks
            const energyPerTick =  Math.min(loadCap / loadTicks, 10)
            src.et = energyPerTick
            const saturation = src.creeps?.miner?.length ? (src.creeps?.miner?.length / Object.keys(src.slots).length) : 0
            const spawnMinerPriority = (1 - saturation) * energyPerTick
            src.cps = Math.max( loadTicks / workTicks, 1)

            // we have no mining creeps! request some
            const newRequest = {
                pri: spawnMinerPriority, requestor: src.id, assignee: [], status: 'new', type: 'spawn',
                opts: {role: 'miner', plan: serializeBody(plan)}
            }
            if (!src.reqs) { src.reqs = [] }
            src.reqs.push(addSpawnRequest(baseManifest, newRequest))
        }

        // let newReqs = []
        // src.reqs.forEach(reqId => {
        //     if (baseManifest.requests[reqId]) {
        //         switch (baseManifest.requests[reqId].status) {
        //             case 'done':
        //                 deleteReq(baseManifest, reqId)
        //         }
        //     }
        // })

        src.reqs = src.reqs.filter(reqId => !!baseManifest.requests[reqId])
        baseManifest.finance.income[src.id] = src.et * miners.length
        baseManifest.finance.cost[src.id] = ((300/1500) * miners.length)
        runChildren(src, lineage, baseManifest)

    } catch(e) {
        log(Memory.nodes[src.id], ['ERROR', 'SRC_NODE'])
        console.log('Error: failed to run Source Node', e.stack, src.id)
    }
}


