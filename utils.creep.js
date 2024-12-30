const {serializePos} = require('./utils.memory')

function ticksPerSpace (plan, partCounts) {
    let fullWeight = plan.length - partCounts[MOVE]
    const emptyWeight = fullWeight - partCounts[CARRY] || 1
    let ticksPerSpaceTo = Math.min(Math.ceil(emptyWeight / partCounts[MOVE]), 1)
    let ticksPerSpaceFrom = Math.min(Math.ceil(fullWeight / partCounts[MOVE]), 1)
    return {to: ticksPerSpaceTo, from: ticksPerSpaceFrom}
}
module.exports.ticksPerSpace = ticksPerSpace

module.exports.onDestroyCommon = function(name) {
    // clear from source lists
    // remove from roles
    // release jobs
    let creepMemory = Memory.creeps[name]
    // if (creepMemory.job) {
    //     releaseJob(creepMemory.job)
    // }
    // let base = Game.bases[creepMemory.base]
    // if (base) {
    //     if (creepMemory.srcTrg) { // remove srcTrg claim
    //         base.sources.some(s => {
    //             if (s.id === creepMemory.srcTrg) {
    //                 s.active = s.active.filter(id => id !== creepMemory.name)
    //                 return true
    //             }
    //         })
    //     }
    //     let roleObj = base.roles[creepMemory.role]
    //     roleObj.creeps = base.roles[creepMemory.role].creeps.filter(cId => cId !== creepMemory.name) // remove from role list
    //     creepMemory.parts.forEach(part => {roleObj[part]--}) // remove part counts
    // }
}

module.exports.getCreepBaseId = function (creep) {
    let nodeId = creep.memory.nodeId
    while(Memory.nodes[nodeId].parent !== null) {
        nodeId = Memory.nodes[nodeId].parent
    }
    return nodeId
}

function getBaseResourceTarget (base, resource = RESOURCE_ENERGY) {
    if (Memory.nodes[base.name].targets[resource]?.length) {
        return Memory.nodes[base.name].targets[resource][0].id
    }
}
module.exports.getBaseResourceTarget = getBaseResourceTarget

function validateBaseResourceTarget(base, targetId, resource = RESOURCE_ENERGY) {
    if (targetId) {
        let trgObj = Memory.nodes[base.name].targets[resource].find(trg => trg.id === targetId)
        if (trgObj && trgObj.energy > 0) {
            return targetId// current target can still take energy. leave it.
        } else {
            return null // Current target not in energy request list. clear it.
        }
    }
}

/**
 * Given a creep, get energy destination for its base
 * @param creep
 */
module.exports.validatePriorityTarget = function (creep) {
    try {
        let originalTarget = creep.memory.target
        let base = Memory.nodes[creep.memory.base]
        let res = creep.memory.target
        if (res) {
            res = validateBaseResourceTarget(base, res, RESOURCE_ENERGY)
        }
        if (!res) {
            // The prior target invalid and is now null. get first target if one exists
            res = res ?? getBaseResourceTarget(base, RESOURCE_ENERGY)
        }
        return res
    } catch (e) {
        console.log('Error: validatePriorityTarget', creep.name, e.stack)
    }
}


/**
 * SOURCE UTILS START
 */
function getOpenSource (sources) {
    if (sources.length && typeof sources[0] === 'string') {
        return sources[0] // todo - check for unsaturated source here
    } else {
        return sources[0].id
    }
}


function setCreepSrcTrg (creep, newSrcTrg) {
    if (creep.memory.srcTrg !== newSrcTrg) {
        removeCreepFromSource(creep, creep.memory.srcTrg)
    }
    creep.memory.srcTrg = newSrcTrg
    if (creep.memory.srcTrg) {
        addCreepToSource(creep, creep.memory.srcTrg)
    }
}
module.exports.setCreepSrcTrg = setCreepSrcTrg

function addCreepToSource (creep, srcId) {
    if (Memory.nodes[creep.memory.base].sources[srcId]) {
        if (!Memory.nodes[creep.memory.base].sources[srcId].active.some(c => c === creep.name)) {
            Memory.nodes[creep.memory.base].sources[srcId].active.push(creep.name)
        }
    }
}
module.exports.addCreeptoSource = addCreepToSource

function removeCreepFromSource (creep, srcId) {
    let srcIndex = Memory.nodes[creep.memory.base].sources.findIndex(s => s.id === srcId)
    if (srcIndex >= 0) {
        const actList = Memory.nodes[creep.memory.base].sources[srcIndex].active
        Memory.nodes[creep.memory.base].sources[srcIndex].active = actList.filter(name => name !== creep.name)
    }
}
module.exports.removeCreepFromSource = removeCreepFromSource

function creepPlanInfo (plan) {
    let partCounts = {}
    let creepCost = 0
    plan.forEach(part => {
        if (!partCounts[part]) {
            partCounts[part] = 1
        } else {
            partCounts[part] += 1 // add part counts to role counts
        }
        creepCost += BODYPART_COST[part]
    })
    return {cost: creepCost, partCounts: partCounts}
}
module.exports.creepPlanInfo = creepPlanInfo

function nextAction (creep, step) {
    creep.memory.actionIndex = creep.memory.actionIndex ? creep.memory.actionIndex + 1 : 1 // increment action index
    if (step.action.length <= creep.memory.actionIndex) { // reset if needed
        nextStep(creep)
    }
}
module.exports.nextAction = nextAction
function nextStep (creep) {
    // freeSrcSlot(Memory.nodes[creep.memory.base], creep.name)
    creep.memory.step++
    delete creep.memory.actionIndex
    delete creep.memory.dest
    delete creep.memory.wait
}
module.exports.nextStep = nextStep

function switchSrcSlot (base, creep, srcId) {
    let baseSourceIndex = base.sources.findIndex(s => s.id === srcId)
    if (baseSourceIndex !== -1) {
        let src = base.sources[baseSourceIndex]
        if (src) {
            let openPos = src.slots.find(s => !src.activePos[s])
            if (openPos) {
                // base.sources[baseSourceIndex].active.push(creep.name)
                base.sources[baseSourceIndex].activePos[openPos] = creep.name
                base.sources[baseSourceIndex].activePos[creep.memory.srcSlot] = false
                creep.memory.srcSlot = openPos
                creep.memory.srcIndex = baseSourceIndex
                // creep.memory.srcBase = base.name
                return true
            }
        }
    }
}
module.exports.switchSrcSlot = switchSrcSlot
function reserveSrcSlot (base, creep, srcId) {
    // let baseSourceIndex = base.sources.findIndex(s => s.id === srcId)
    // if (baseSourceIndex !== -1) {
    //     let openPos = base.sources[baseSourceIndex].slots.find(s => !base.sources[baseSourceIndex].active.includes(s))
    //     if (openPos) {
    //         base.sources[baseSourceIndex].active.push(openPos)
    //         creep.memory.srcSlot = openPos
    //         return true
    //     }
    // }
    // return false

    let baseSourceIndex = base.sources.findIndex(s => s.id === srcId)
    if (baseSourceIndex !== -1) {
        let src = base.sources[baseSourceIndex]
        if (src) {
            let openPos
            let creepSPos = serializePos(creep.pos)
            if (src.slots.some(sPos => sPos === creepSPos)) {
                openPos = creepSPos
            } else {
                openPos = src.slots.find(s => !src.activePos[s])
            }
            if (openPos) {
                base.sources[baseSourceIndex].active.push(creep.name)
                base.sources[baseSourceIndex].activePos[openPos] = creep.name
                creep.memory.srcSlot = openPos
                creep.memory.srcIndex = baseSourceIndex
                // creep.memory.srcBase = base.name
                return true
            }
        }
    }

    return false
}
module.exports.reserveSrcSlot = reserveSrcSlot

function freeSrcSlot (base, creepName) {
    // if (Memory.creeps[creepName].srcSlot) {
    //     let baseSourceIndex = base.sources.findIndex(s => s.id === srcIndex)
    //     if (baseSourceIndex !== -1) {
    //         base.sources[baseSourceIndex].active = base.sources[baseSourceIndex].active.filter(a => a !== Memory.creeps[creepName].srcSlot)
    //         delete Memory.creeps[creepName].srcSlot
    //         return true
    //     }
    //     return false
    // }[
    // return true // there wasn't a srcSlot to free... so success?

    if (Memory.creeps[creepName].srcSlot) {
        let baseSourceIndex = Memory.creeps[creepName].srcIndex
        if (baseSourceIndex !== undefined && baseSourceIndex !== -1) {
            base.sources[baseSourceIndex].active = base.sources[baseSourceIndex].active.filter(a => a !== creepName)
            base.sources[baseSourceIndex].activePos[Memory.creeps[creepName].srcSlot] = false
            delete Memory.creeps[creepName].srcSlot
            return true
        }
        return false
    }
    return true // there wasn't a srcSlot to free... so success?
}
module.exports.freeSrcSlot = freeSrcSlot
