/**
 * A Harvest Job looks like this:
 *
 * harvestJob: {
 *                 type: 'harvest',
 *                 id: `source_${source.id}_${i}`,
 *                 target: source.id,
 *                 roles: ['harvester', 'peon'],
 *                 reserved: true,
 *                 reserver: 'creepName',
 *
 *
 *             }
 */

// OK	0
// The operation has been scheduled successfully.
//
//   ERR_NOT_OWNER	-1
// You are not the owner of this creep, or the room controller is owned or reserved by another player.
//
//   ERR_BUSY	-4
// The creep is still being spawned.
//
//   ERR_NOT_FOUND	-5
// Extractor not found. You must build an extractor structure to harvest minerals. Learn more
//
// ERR_NOT_ENOUGH_RESOURCES	-6
// The target does not contain any harvestable energy or mineral.
//
//   ERR_INVALID_TARGET	-7
// The target is not a valid source or mineral object.
//
//   ERR_NOT_IN_RANGE	-9
// The target is too far away.
//
//   ERR_TIRED	-11
// The extractor or the deposit is still cooling down.
//
//   ERR_NO_BODYPART	-12
// There are no WORK body parts in this creep’s body.
//

const {ACTIONS, DONE} = require('./actions')
const {containerized} = require('./utils.source')
const {log} = require('./utils.debug')
const {energy, useEnergyReq} = require('./utils.manifest')
const {getChildren, getDestNode, getSrcNode} = require('./utils.nodes')
const {deserializePos} = require('./utils.memory')

function findLogSrcFor (trgId, nodes) {
    if (nodes.length) {
        let best
        let bestEnergy = 0
        nodes.forEach(n => {
            if (n !== trgId) {
                let gameNode = Game.getObjectById(n)
                if (gameNode) {
                    let thisEnergy = gameNode.store.getUsedCapacity(RESOURCE_ENERGY)
                    if (thisEnergy) {
                        if (!best || bestEnergy < thisEnergy) {
                            best = n
                            bestEnergy = thisEnergy
                        }
                        return true
                    }
                } else {
                    console.log('Error: node was not a gameNode: ', n)
                }
            }
        })
        return best
    }
}

function scoreDest (gameNode, fromPos) {
    let thisCapacity = gameNode.store.getFreeCapacity(RESOURCE_ENERGY)
    let thisType = Memory.nodes[n].type
    let thisRange = gameNode.pos.getRangeTo(fromPos, {ignoreCreeps: true})
    // score = (1 - (range/50)) + (1 - frac)
}
function findLogDestAmong (nodes, creep) {
    if (nodes.length) {
        let best
        let bestType
        let bestCapacity = 0
        let bestRange = 999
        nodes.forEach(n => {
            let gameNode = Game.getObjectById(n)
            if (gameNode) {
                let thisCapacity = gameNode.store.getFreeCapacity(RESOURCE_ENERGY)
                let thisType = Memory.nodes[n].type
                let thisRange = gameNode.pos.getRangeTo(creep.pos, {ignoreCreeps: true})
                //const thisScore = scoreDest(gameNode)
                if (thisCapacity && thisRange < 1.1 * bestRange) {
                    if (
                      !best || (
                        (thisType === 'spawn' && bestType !== 'spawn' && thisCapacity > 0) || // this is spawn and best is not and this needs energy
                        (thisType === bestType || bestCapacity < thisCapacity) // this and best are same type and this needs more energy
                      )
                    ) {
                        best = n
                        bestCapacity = thisCapacity
                        bestType = Memory.nodes[n].type
                    }
                    return true
                }
            } else {
                console.log('Error: node was not a gameNode: ', n)
            }
        })
        return best
    }
}

function findSupplierTrg (creep, manifest) {
    let trgType
    let logNode = Memory.nodes[creep.memory.nodeId]
    let logParent = Memory.nodes[logNode.parent]
    let logContainers
    let trg
    if (!trg) {
        let criticalNodes = getChildren(logParent, ['spawn', STRUCTURE_EXTENSION], undefined,true)
        trg = findLogDestAmong(criticalNodes, creep)
        trgType = 'struct'
    }
    //
    if (!trg && manifest.spawn.length === 0) {
        logContainers = getChildren(logNode, [STRUCTURE_CONTAINER], (node) => node.subType !== 'src', true)
        trg = findLogDestAmong(logContainers, creep)
        trgType = 'cont'
    }

    return trg ? {trg: trg, trgType: trgType} : null
}

function findLogContainer (creep) {
    let logNode = Memory.nodes[creep.memory.nodeId]
    let logContainers = getChildren(logNode, [STRUCTURE_CONTAINER], (node) => node.subType !== 'src', true)
    return findLogSrcFor(undefined, logContainers)
}
function findSrcContainer (creep) {
    let logNode = Memory.nodes[creep.memory.nodeId]
    let srcContainers = getChildren(logNode, [STRUCTURE_CONTAINER], (node) => node.subType === 'src', true)
    return findLogSrcFor(undefined, srcContainers)
}
module.exports.run = function (creep, manifest) {
    try {
        if (creep.memory.wait && Game.time < creep.memory.wait) {
            delete creep.memory.wait
        }
        let node = Memory.nodes[creep.memory.nodeId]
        const energy = creep.store.getUsedCapacity()
        //node.type === ec
        let trgInfo
        if (energy > 0) {
            // try to go to log
            trgInfo = getDestNode(node, creep, {canWork: false})
            if (trgInfo.trg) {
                ACTIONS[trgInfo.action].start(creep, trgInfo.trg)
                return
            } else {
                if (energy > creep.store.getFreeCapacity()) {
                    creep.memory.wait = Game.time + 3
                }
                return
            }
        }
        const energyNeeded = creep.store.getUsedCapacity()
        trgInfo = getSrcNode(node, creep, {canWork: false, energyNeeded: energyNeeded, minEnergyNeeded: energyNeeded})
        if (trgInfo.trg) {
            ACTIONS[trgInfo.action].start(creep, trgInfo.trg)
            return
        }
        console.log('supplier unable to find trg', creep.name, energy, trg, trgInfo)

    } catch (e) {
        console.log('Error: couldnt run supply job', e.stack)
    }
}
