const {addTrgSources} = require('./base.source')
const {releaseJob} = require('./operation.job')


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


function getBaseResourceTarget (base, resource = RESOURCE_ENERGY) {
    if (Memory.bases[base.name].targets[resource]?.length) {
        return Memory.bases[base.name].targets[resource][0].id
    }
}
module.exports.getBaseResourceTarget = getBaseResourceTarget

function validateBaseResourceTarget(base, targetId, resource = RESOURCE_ENERGY) {
    if (targetId) {
        let trgObj = Memory.bases[base.name].targets[resource].find(trg => trg.id === targetId)
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
        let base = Memory.bases[creep.memory.base]
        let res = creep.memory.target
        if (res) {
            res = validateBaseResourceTarget(base, res, RESOURCE_ENERGY)
        }
        if (!res) {
            // The prior target invalid and is now null. get first target if one exists
            res = res ?? getBaseResourceTarget(base, RESOURCE_ENERGY)
        }
        return res
        // if (originalTarget !== creep.memory.target) {
        //     validatePrioritySrc(creep) // if target changed, then make sure src is good
        // }
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
/**
 * MUST have target already, else returns base source 1
 * @param creep
 */

function validatePrioritySrc (creep) {
    try {
        let baseMemory = Memory.bases[creep.memory.base]
        if (!creep.memory.target) { // no destination in mind, get random energy, get base source 1
            setCreepSrcTrg(creep, getOpenSource(baseMemory.sources).id)
        } else { // get sourcePaths for this target. if you cant, get default base source
            let srcPaths = addTrgSources(baseMemory, creep.memory.target)
            setCreepSrcTrg(creep, getOpenSource(srcPaths.length ? srcPaths : baseMemory.sources))
        }
    } catch (e) {
        console.log('Error: validatePrioritySrc', creep.name, e.stack)
    }
}
module.exports.validatePrioritySrc = validatePrioritySrc
function addCreepToSource (creep, srcId) {
    if (Memory.bases[creep.memory.base].sources[srcId]) {
        if (!Memory.bases[creep.memory.base].sources[srcId].active.some(c => c === creep.name)) {
            Memory.bases[creep.memory.base].sources[srcId].active.push(creep.name)
        }
    }
}
module.exports.addCreeptoSource = addCreepToSource

function removeCreepFromSource (creep, srcId) {
    let srcIndex = Memory.bases[creep.memory.base].sources.findIndex(s => s.id === srcId)
    if (srcIndex >= 0) {
        const actList = Memory.bases[creep.memory.base].sources[srcIndex].active
        Memory.bases[creep.memory.base].sources[srcIndex].active = actList.filter(name => name !== creep.name)
    }
}
module.exports.removeCreepFromSource = removeCreepFromSource


/**
 * SOURCE UTILS END
 */

// module.exports.totalHarvesters = function (base) {
//     const harvesters = ['peon']
// }


//
// module.exports.getSourceTarget = function (creep) {
//     let base = Memory.bases[creep.room.name]
//     creep.memory.refilling = true
//     creep.memory.travelling = true
//     let possibleSources = base.sources.filter(s => s.active.length < s.slots.length)
//     let newTarget = creep.pos.findClosestByRange(possibleSources.map(s => (deserializePos(s.pos))))
//     if (newTarget) {
//         creep.memory.target = {trg: serializePos(newTarget), type: 'source'}
//     }
// }
//
// module.exports.getDestTarget = function (creep) {
//     creep.memory.refilling = false
//     creep.memory.travelling = true
//     let type = 'store'
//     let targets = room.find(FIND_STRUCTURES, {
//         filter: (s) => {
//             return (s.structureType == STRUCTURE_EXTENSION || s.structureType == STRUCTURE_SPAWN) &&
//               s.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
//         }
//     })
//     if (!targets.length) {
//         type = 'site'
//         targets = room.find(FIND_CONSTRUCTION_SITES)
//     }
//     return {trg: targets[0], type: type}
// }

