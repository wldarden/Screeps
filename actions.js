const {deserializePos, serializePos} = require('./utils.memory')
const {SHOW_PATHS} = require('./config')
const {energy} = require('./utils.manifest')


const defEnergyDestPri = [STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_CONTAINER]
function findEnergyDest (creep, targets = defEnergyDestPri, resource = RESOURCE_ENERGY) {
    let room = Game.rooms[creep.pos.roomName]

    const energy = creep.store.getUsedCapacity()
    let best
    let bestTypeIndex = targets.length
    let bestCapacity = 0
    let bestFillFrac
    let bestRoomFrac
    let bestScore = 0
    const allStructs = room.find(FIND_MY_STRUCTURES)
    for (let i = 0; i < allStructs.length; i++) {
        let str = allStructs[i]
        if (str?.store) {
            const capacity = str.store.getFreeCapacity(resource)
            if (!!capacity) {
                let newTypeIndex = targets.findIndex(t => t === str.structureType)
                if (!best || newTypeIndex < bestTypeIndex) {
                    // new best
                    best = str
                    bestTypeIndex = newTypeIndex
                    bestCapacity = capacity
                    bestFillFrac = capacity / energy
                    bestRoomFrac = creep.pos.getRangeTo(best) / 50
                    bestScore = bestFillFrac - bestRoomFrac
                } else if (newTypeIndex === bestTypeIndex) { // both are same level of target. compare them
                    const newFillFrac = capacity / energy
                    const newRoomFrac = creep.pos.getRangeTo(str) / 50
                    const newScore = newFillFrac - newRoomFrac
                    if (bestScore < newScore) {
                        best = str
                        bestFillFrac = newFillFrac
                        bestRoomFrac = creep.pos.getRangeTo(best) / 50
                        bestScore = bestFillFrac - bestRoomFrac
                    }
                }
                if (bestTypeIndex === 0 && bestCapacity > energy) {
                    return best
                }
            }
        }
    }
    return best
}
//
// function findCustSrc (destPosition, amount, findConst, resource = RESOURCE_ENERGY) {
//     let best
//     let bestFillFrac
//     let bestRoomFrac
//     let bestScore = 0
//     let room = Game.rooms[destPosition.roomName]
//     const structs = room.find(findConst)
//     for (let resIndex = 0; resIndex < structs.length; resIndex++) {
//         if (structs[resIndex].store && structs[resIndex].structureType !== STRUCTURE_EXTENSION) {
//             if (structs[resIndex].store[resource] > amount) {
//                 return structs[resIndex]
//             } else {
//                 if (!best) {
//                     best = structs[resIndex]
//                     bestFillFrac = best.store[resource] / amount
//                     bestRoomFrac = destPosition.getRangeTo(best) / 50
//                     bestScore = bestFillFrac - bestRoomFrac
//                 } else {
//                     const newFillFrac = structs[resIndex].store[resource] / amount
//                     const newRoomFrac = destPosition.getRangeTo(structs[resIndex]) / 50
//                     const newScore = newFillFrac - newRoomFrac
//                     if (bestScore < newScore) {
//                         best = structs[resIndex]
//                         bestFillFrac = newFillFrac
//                         bestRoomFrac = newRoomFrac
//                         bestScore = newScore
//                     }
//                 }
//             }
//         }
//     }
//     if (best) {
//         return best
//     }
// }

//
// function findFillSrc (creep, destPosition, targets = ['str', 'src'], resource = RESOURCE_ENERGY) {
//     let amount = creep.store.getFreeCapacity()
//     if (!destPosition) {
//         destPosition = creep.pos
//     }
//     for (let i = 0; i < targets.length; i++) {
//         switch (targets[i]) {
//             case 'str': // any stucture
//                 let strRes = findCustSrc(destPosition, amount, FIND_MY_STRUCTURES, resource)
//                 if (strRes) {
//                     return strRes
//                 }
//                 break
//             case FIND_DROPPED_RESOURCES:
//                 console.log('ERROR: tried to findFillSrc Dropped resources, but i didnt code that yet')
//                 break
//             case 'src':
//                 let closestOpenSource = destPosition.findClosestByPath(
//                   FIND_SOURCES,
//                   {
//                       ignoreCreeps: true,
//                       filter: (src) => (
//                         Object.keys(Memory.nodes[src.id].slots).some(key => !Memory.nodes[src.id].slots[key])
//                       )
//                   }
//                 )
//                 if (closestOpenSource) {
//                     return closestOpenSource
//                 }
//                 break
//             default:
//                 let defaultRes = findCustSrc(destPosition, amount, targets[i], resource)
//                 if (defaultRes) {
//                     return defaultRes
//                 }
//                 break
//         }
//     }
//     // const target = findFillSrc(creep, destPosition, targets, resource)
//     // creep.memory.Fsrc = target?.id
//     // if (target?.id) {
//     //     let trg = Game.getObjectById(target?.id)
//     //     if (Memory.nodes[target?.id] && Memory.nodes[target?.id].type === 'src') {
//     //         creep.memory.FsrcType = 'src'
//     //     } else if (trg.structureType) {
//     //         creep.memory.FsrcType = 'str'
//     //     } else if (trg.resourceType) {
//     //         creep.memory.FsrcType = 'pile'
//     //     }
//     // }
// }

const defEnergySrcPri = [STRUCTURE_CONTAINER, STRUCTURE_SPAWN, STRUCTURE_EXTENSION]
function openSrc (room) {
    const allSources = room.find(FIND_SOURCES)
    for (let i = 0; i < allSources.length; i++) {
        let src = allSources[i]
        if (src) {
            let nodeSrc = Memory.nodes[src.id]
            if (nodeSrc && nodeSrc.threat === 0) {
                let open
                Object.keys(nodeSrc.slots).forEach(sl => {
                    if ((!open && !nodeSrc.slots[sl]) || nodeSrc.slots[sl] === creep.name) {
                        open = sl
                    }
                })
                return src
            }
        }
    }
}
function findEnergySrc (creep, destPosition, targets = defEnergySrcPri, resource = RESOURCE_ENERGY) {
    let room = Game.rooms[creep.pos.roomName]
    if (!destPosition) {
        destPosition = creep.pos
    }
    const energyNeeded = creep.store.getFreeCapacity()

    let srcIndex = targets.find(type => type === 'src')
    if (srcIndex === 0) {
        // try get src
        let src = openSrc(room)
        if (src) {
            return src
        }
    }

    let best
    let bestTypeIndex = targets.length
    let bestAmount = 0
    let bestFillFrac
    let bestRoomFrac
    let bestScore = 0
    const allStructs = room.find(FIND_MY_STRUCTURES)
    for (let i = 0; i < allStructs.length; i++) {
        let str = allStructs[i]
        if (str?.store) {
            const amount = str.store.getUsedCapacity(resource)
            if (!!bestAmount) {
                let newTypeIndex = targets.findIndex(t => t === str.structureType)
                if (!best || newTypeIndex < bestTypeIndex) {
                    // new best
                    best = str
                    bestTypeIndex = newTypeIndex
                    bestAmount = amount
                    bestFillFrac = amount / energyNeeded
                    bestRoomFrac = destPosition.getRangeTo(best) / 50
                    bestScore = bestFillFrac - bestRoomFrac
                } else if (newTypeIndex === bestTypeIndex) { // both are same level of target. compare them
                    const newFillFrac = amount / energyNeeded
                    const newRoomFrac = destPosition.getRangeTo(str) / 50
                    const newScore = newFillFrac - newRoomFrac
                    if (bestScore < newScore) {
                        best = str
                        bestFillFrac = newFillFrac
                        bestRoomFrac = destPosition.getRangeTo(best) / 50
                        bestScore = bestFillFrac - bestRoomFrac
                    }
                }
                if (bestTypeIndex === 0 && bestFillFrac >= 1) {
                    return best
                }
            }
        }
    }

    if (srcIndex !== -1 && srcIndex < bestTypeIndex) {
        let src = openSrc(room)
        if (src) {
            return src
        }
    }
    // if src, and bestIndex is > src, try src
    return best
}


const DONE = 999
module.exports.DONE = DONE
function globalActionStart (actionFunc, creep, ...args) {
    if (!creep.memory.actions) {
        creep.memory.actions = []
    }
    return actionFunc(creep, ...args)
}
const ACTIONS = {
    fill: {
        start: (creep, destPosition, targets = ['str', 'src'], resource = RESOURCE_ENERGY) =>
          globalActionStart(startFill, creep, destPosition, targets, resource),
        do: doFill,
        finish: finishFill
    },
    recycle: {
        start: (creep, ...args) => globalActionStart(startRecycle, creep, ...args),
        do: doRecylce,
        finish: finishRecycle
    },
    harvest: {
        start: (creep, ...args) => globalActionStart(startHarvest, creep, ...args),
        do: doHarvest,
        finish: finishHarvest
    },
    withdraw: {
        start: (creep, structId) => globalActionStart(startWithdraw, creep, structId),
        do: doWithdraw,
        finish: finishWithdraw
    },
    transfer: {
        start: (creep, ...args) => globalActionStart(startTransfer, creep, ...args),
        do: doTransfer,
        finish: finishTransfer
    },
    upgrade: {
        start: (creep, controllerId) => globalActionStart(startUpgrade, creep, controllerId),
        do: doUpgrade,
        finish: finishUpgrade
    },
    build: {
        start: (creep, ...args) => globalActionStart(startBuild, creep, ...args),
        do: doBuild,
        finish: finishBuild
    }
}
module.exports.ACTIONS = ACTIONS


function startBuild (creep, siteId) {
  if (siteId) {
    creep.memory.Bsite = siteId
    creep.memory.actions.unshift('build')
  }
}
function finishBuild (creep, manifest) {
  energy.freeDest(manifest, creep.name, creep.memory.Bsite)
  delete creep.memory.Bsite
  creep.memory.actions.shift()
}

function doBuild (creep, manifest) {
    try {
        if (creep.store.getUsedCapacity() === 0) {
            return DONE
        } else {
            let target = Game.getObjectById(creep.memory.Bsite)
            if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
               return DONE
            }

            let actionRes = creep.build(target)
            switch (actionRes) {
                case ERR_NOT_OWNER:
                    console.log('Tried to build someone elses site')
                case ERR_NOT_IN_RANGE:
                    creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}})
                    break
                case ERR_TIRED:
                    console.log('creep says they are tired: ', creep.name)
                    break
                case ERR_NOT_ENOUGH_RESOURCES:
                    // hybernate a bit maybe?
                    return DONE
                    break
                case ERR_INVALID_TARGET:
                    return DONE
                case OK:
                    break
                default:
                    console.log('Error: Build Action Response not handled: ', creep.name, JSON.stringify(target), actionRes, JSON.stringify(creep) )
                    break
            }
        }
    } catch (e) {
        console.log('Error: couldnt doBuild job', e.stack, 'site:', creep.memory.Bsite)
    }
}


function startFill (creep, destPosition, targets = [STRUCTURE_CONTAINER, 'src', STRUCTURE_SPAWN, STRUCTURE_EXTENSION], resource = RESOURCE_ENERGY) {
    const target = findEnergySrc(creep, destPosition, targets, resource)
    creep.memory.Fsrc = target?.id
    if (target?.id) {
        let trg = Game.getObjectById(target?.id)
        if (Memory.nodes[target?.id] && Memory.nodes[target?.id].type === 'src') {
            creep.memory.FsrcType = 'src'
        } else if (trg.structureType) {
            creep.memory.FsrcType = 'str'
        } else if (trg.resourceType) {
            creep.memory.FsrcType = 'pile'
        }
    }
    creep.memory.actions.unshift('fill')
}
function finishFill (creep) {
    delete creep.memory.Fsrc
    delete creep.memory.FsrcType
    creep.memory.actions.shift()
}

function doFill (creep, manifest) {
    try {
        if (creep.store.getFreeCapacity() === 0) {
            return DONE
        } else {
            switch (creep.memory.FsrcType) {
                case 'src':
                    ACTIONS.harvest.start(creep, creep.memory.Fsrc)
                    return
                case 'str':
                    ACTIONS.withdraw.start(creep, creep.memory.Fsrc)
                    return
                case 'pile':
                    console.log('ERROR: tried to fill from pile', creep.name)
                    return
            }
        }
    } catch (e) {
        console.log('Error: couldnt doFill job', e.stack)
    }
}

function startUpgrade (creep, controllerId) {
    if (controllerId) {
        creep.memory.UTrg = controllerId
    } else {
        let room = Game.rooms[creep.pos.roomName]
        creep.memory.UTrg = room?.controller?.id
    }
    creep.memory.UOK = false
    creep.memory.actions.unshift('upgrade')
}
function finishUpgrade (creep) {
    delete creep.memory.Utrg
    delete creep.memory.UOK
    creep.memory.actions.shift()
}

function doUpgrade (creep, manifest) {
    try {
        if (creep.store.getUsedCapacity() === 0) {
            if (creep.memory.UOK) {
                return DONE
            } else {
                ACTIONS.fill.start(creep, creep.memory.UTrg, ['str', 'src'], RESOURCE_ENERGY)
                return
            }
        } else {
            let controller = Game.getObjectById(creep.memory.UTrg)
            let actionRes = creep.upgradeController(controller)
            switch (actionRes) {
                case OK:
                    creep.memory.UOK = true
                    break
                case ERR_NOT_ENOUGH_RESOURCES:
                    return DONE
                // case ERR_INVALID_TARGET:
                //     console.log('Error: upgrade creep invalid target', creep.name)
                //     break
                case ERR_NOT_IN_RANGE:
                    creep.moveTo(controller, {visualizePathStyle: {stroke: '#00ff00'}})
                    break
                //   ERR_NO_BODYPART	-12
                // There are no WORK body parts in this creep’s body.
                default:
                    console.log('Error: doUpgrade Action Response not handled: ', creep.name, actionRes, JSON.stringify(creep.memory))
                    break
            }
            return actionRes
        }
    } catch (e) {
        console.log('Error: couldnt doUpgrade job', e.stack)
    }
}


function startWithdraw (creep, structId = undefined, nearPosition, resource = RESOURCE_ENERGY) {
    let Wtrg
    if (structId) {
        Wtrg = structId
    } else {
        console.log('Error: withdraw error loggg', creep.name)
        // let newWTrg
        // const validTargets = [STRUCTURE_CONTAINER, STRUCTURE_SPAWN, STRUCTURE_EXTENSION]
        // newWTrg = findEnergySrc(creep, nearPosition, validTargets, resource)
        // if (newWTrg) {
        //     Wtrg = newWTrg.id
        // } else {
        //     return // wasn't able to find something to withdraw from
        // }
    }
    // manifest.energy.dest.some(d => {
    //     if (d.id === creep.memory.Tdest) {
    //         d.active--
    //         return true
    //     }
    // })
    creep.memory.Wtrg = Wtrg
    creep.memory.Wres = resource
    creep.memory.actions.unshift('withdraw')
}
function finishWithdraw (creep, manifest) {
    energy.freeSrc(manifest, creep.name, creep.memory.Wtrg)
    delete creep.memory.Wtrg
    delete creep.memory.Wres
    creep.memory.actions.shift()
}

function doWithdraw (creep, manifest) {
    try {
        if (creep.memory.wait) {
            if (creep.memory.wait < Game.time) {
                delete creep.memory.wait
                return DONE
            } else {
                return
            }
        }
        if (creep.store.getFreeCapacity() === 0) {
            return DONE
        }
        let target = Game.getObjectById(creep.memory.Wtrg)
        let actionRes = creep.withdraw(target, creep.memory.Wres || RESOURCE_ENERGY)
        switch (actionRes) {
            case ERR_NOT_IN_RANGE:
                creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}})
                break
            case ERR_TIRED:
                console.log('creep says they are tired: ', creep.name)
                break
            case ERR_NOT_ENOUGH_RESOURCES:
              // hybernate a bit maybe?
              if (creep.store.getUsedCapacity() > 0) {
                  return DONE
              } else {
                  if (!creep.memory.wait) {
                      creep.memory.wait = Game.time + 5
                  }
              }
              return
            case ERR_INVALID_TARGET:
                return DONE
            case ERR_FULL:
                return DONE
            case ERR_NO_BODYPART:
                return DONE
            case OK:
                break
            default:
                console.log('creep.memory.WTrg target loggg', JSON.stringify(target))
                console.log('creep.memory.Wres loggg', JSON.stringify(creep.memory.Wres))

                console.log('Error: Withdraw Action Response not handled: ', creep.name, actionRes, creep.memory.Wtrg, creep.memory.WRes)
                break
        }
        return actionRes
    } catch (e) {
        console.log('Error: couldnt doWithdraw job', e.stack)
    }
}
function startTransfer (creep, targetsOrId, resource = RESOURCE_ENERGY) {
    let target
    if (!targetsOrId || Array.isArray(targetsOrId)) {
        console.log('ERROR: transfer id not done right.', creep.name, targetsOrId)
        // target = findEnergyDest(creep, targetsOrId, resource) // find default targets or specificied targets
    } else if (typeof targetsOrId === 'string') {
        target = Game.getObjectById(targetsOrId) // try specific target
        if (!target) {
            console.log('ERROR: transfer id not done right.', creep.name, targetsOrId)

            let alt = findEnergyDest(creep, undefined, resource) // fallback to default target
            if (alt?.id && Game.getObjectById(alt?.id)) {
                target = alt
            }
        }
    }
    creep.memory.actions.unshift('transfer')
    creep.memory.Tdest = target?.id
    creep.memory.Tres = resource
}

function finishTransfer (creep, manifest) {
    energy.freeDest(manifest, creep.name, creep.memory.Tdest)
    creep.memory.actions.shift()
    delete creep.memory.Tdest
    delete creep.memory.Tres
}

function doTransfer (creep) {
    if (!creep.memory.Tdest) {
        return DONE
    }

    const resource = creep.memory.Tres || RESOURCE_ENERGY
    if (creep.store.getUsedCapacity(resource) === 0) {
        return DONE // completely empty of res. done.
    }

    const target = Game.getObjectById(creep.memory.Tdest)
    let actionRes = creep.transfer(target, resource)
    switch (actionRes) {
        case ERR_NOT_IN_RANGE:
            creep.moveTo(target, {ignoreCreeps: false, visualizePathStyle: {stroke: '#008800'}})
            break
        case ERR_TIRED:
            break
        case ERR_NOT_ENOUGH_RESOURCES: // done with the job.
          return DONE
        case ERR_INVALID_TARGET:
            break
        case ERR_FULL: // dest is full. what should transfer people do?
            if (!creep.memory.wait) {
                creep.memory.wait = Game.time + 3 // wait some random amount of time
            } else { // we were already waiting
                if (Game.time >= creep.memory.wait) { // waited 3 ticks and still full. find drop site
                    return DONE
                    //// creep.memory.actions.unshift('build')
                    //if (Math.random() < .2) {
                    //    creep.drop()
                    //    delete creep.memory.wait
                    //    return DONE
                    //} else {
                    //    ACTIONS.transfer.start(creep, undefined, resource)
                    //    delete creep.memory.wait
                    //    return
                    //}
                }
            }
            break
        case OK:
            break
        default:
            console.log('Error: ', creep.name, 'Transfer Action Response not handled: ', actionRes, creep.memory.Tdest, creep.memory.wait, JSON.stringify(creep.memory))
            break
    }
    return actionRes

}

function reserveSrcSlot (creep, srcId) {
    if (!Memory.nodes[srcId]) {
        // invalid src.
        return false
    }
    let src = Memory.nodes[srcId]
    let open
    let creepPos = serializePos(creep.pos)
    if (creepPos in src.slots) {
        if (src.slots[creepPos] && Game.creeps[src.slots[creepPos]]) {
            delete Game.creeps[src.slots[creepPos]].Hslt // remove creep reservation that im already standing in
        }
        src.slots[creepPos] = creep.name // take it for myself, because im there
        return creepPos
    }
    let found = Object.keys(src.slots).some(sl => {
        if (src.slots[sl] === creep.name) {
            open = sl
            return true
        } else if (!src.slots[sl]) {
            open = sl
        }
    })
    if (found) {
        // reserver already owned this slot..?
    }
    if (open) {
        src.slots[open] = creep.name
        return open
    }

    // if (
    //   creep.memory.srcSlot && creep.memory.srcSlot !== undefined && creep.memory.srcSlot !== 'undefined' &&
    //   (!Memory.nodes[srcId].slots[creep.memory.srcSlot] || Memory.nodes[srcId].slots[creep.memory.srcSlot] === creep.name)
    // ) {
    //     Memory.nodes[srcId].slots[creep.memory.srcSlot] = creep.name
    //     return true
    // }
    // return Object.keys(Memory.nodes[srcId].slots).some(slot => {
    //     if (slot === undefined) {
    //         return false
    //     }
    //     if (!Memory.nodes[srcId].slots[slot]) {
    //         Memory.nodes[srcId].slots[slot] = creep.name
    //         creep.memory.srcSlot = slot
    //         return true
    //     }
    // })
}
module.exports.reserveSrcSlot = reserveSrcSlot

function freeSrcSlot (slot, srcId, name) {
    if (Memory.nodes[srcId] && slot) {
        Object.keys(Memory.nodes[srcId].slots).forEach(sl => {
            if (Memory.nodes[srcId].slots[sl] === name) {
                Memory.nodes[srcId].slots[sl] = false
            }
        })
        Memory.nodes[srcId].slots[slot] = false
    }
}
module.exports.freeSrcSlot = freeSrcSlot

function startHarvest (creep, srcId) {
    if (!srcId) {
        console.log('cant harvest nothing!', creep.name, srcId)
        return
    }
    creep.memory.actions.unshift('harvest')
    creep.memory.Hsrc = srcId
    if (srcId) {
        creep.memory.Hslt = reserveSrcSlot(creep, srcId)
    }

}
function finishHarvest (creep) {
    creep.memory.actions.shift()
    freeSrcSlot(creep.memory.Hslt, creep.memory.Hsrc, creep.name)
    delete creep.memory.Hsrc
    delete creep.memory.Hslt
}

function doHarvest (creep, manifest) {
    // console.log('Creep doHarvest', creep.name, srcId)
    if (creep.store.getFreeCapacity() === 0) {
        return DONE
    }
    let src = Game.getObjectById(creep.memory.Hsrc)
    if (!creep.memory.Hslt) {
        creep.memory.Hslt = reserveSrcSlot(creep, creep.memory.Hsrc)
    }

    let actionRes = creep.harvest(src)
    switch (actionRes) {
        case ERR_NOT_IN_RANGE:
            creep.moveTo(src, {range: 1, visualizePathStyle: {stroke: '#004400'}})
            //if (creep.memory.Hslt && Game.time % 2 === 0) {
            //    creep.moveTo(deserializePos(creep.memory.Hslt), {range: 0, visualizePathStyle: SHOW_PATHS ? {stroke: '#004400' } : undefined})
            //} else {
            //    creep.moveTo(src, {range: 1, visualizePathStyle: {stroke: '#004400'}})
            //}
            break
        case ERR_INVALID_TARGET:
            console.log('invalid harvest target... really didnt think i would get here', creep.name, JSON.stringify(creep.memory))
            return DONE
        case OK:
            let reservedSlot = deserializePos(creep.memory.Hslt)
            if (creep.pos.x !== reservedSlot.x || creep.pos.y !== reservedSlot.y) {
                freeSrcSlot(creep.memory.Hslt, creep.memory.Hsrc, creep.name)
                reserveSrcSlot(creep, creep.memory.Hsrc)
            }
            break
        default:
            console.log('Error: Unhandled Harvest Action Response: ', creep.name, actionRes, JSON.stringify(creep.memory))
            break
    }
    return actionRes
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
}

function startRecycle (creep) {
    try {
        if (!creep.memory.actions) {
            creep.memory.actions = []
        }
        creep.memory.actions.unshift('recycle')


    } catch (e) {
        console.log('Error: couldnt start recycle job', e.stack)
    }
}
function finishRecycle (creep, spawnId) {
    creep.memory.actions.shift()
    // i mean... they're dead.
}
function doRecylce (creep) {
    try {
        let target
        let actionRes = ERR_NOT_IN_RANGE
        let base = Memory.nodes[creep.pos.roomName]
        if (base) {
            target = Game.getObjectById(base.children.spawn[0])
            actionRes = target.recycleCreep(creep)
        } else {
            target = Game.getObjectById(creep.memory.nodeId)
            creep.moveTo(target, {range: 1, visualizePathStyle: {stroke: '#BB0000'}})
        }
        switch (actionRes) {
            case ERR_NOT_IN_RANGE:
                let moveRes = creep.moveTo(target, {range: 1, visualizePathStyle: {stroke: '#BB0000'}})
                break
            case OK:
                break
            default:
                break
        }
    } catch (e) {
        console.log('Error: couldnt run recycle job', e.stack)
    }
}
