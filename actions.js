const {deserializePos, serializePos} = require('./utils.memory')
const {energy} = require('./utils.manifest')
const {addCreepToNode} = require('./utils.nodes')
const {CREEP_MIN_LIFE_TICKS} = require('./config')

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
function globalActionStart (actionFunc, creep, trgId, action, ...args) {
  if (!creep.memory.actions) {
    creep.memory.actions = []
  }
  if (!creep.memory.targets) {
    creep.memory.targets = []
  }
  //console.log(creep.name, 'added to', trgId, 'for', action)
  if (!trgId || !creep.name) {
    console.log(creep.name, ' started action ', action, ' for trg ', trgId)
  } else {
    addCreepToWorkerList(trgId, creep.name)

  }
  let res = actionFunc(creep, trgId, ...args)
  if (creep.memory.actions?.length) {
    return ACTIONS[creep.memory.actions[0]].do(creep)
  } else {
    return res
  }
}
function addCreepToWorkerList (target, name) {
  //console.log('add ', name, 'to', target)
  if (!target || !name) {
    return
  }
  if (!Memory.workers[target]) {
    Memory.workers[target] = [name]
  } else {
    if (!Memory.workers[target].includes(name)) {
      Memory.workers[target].push(name)
    }
  }
}
function removeCreepFromWorkerList (target, name) {

  if (Memory.workers[target]) {
    Memory.workers[target].filter((cId) => cId !== name && !!Game.creeps[cId]) // remove from global workers list
  }
  //console.log('remove ', name, 'from', target, Memory.workers[target].length)
  if (Memory.workers[target] && Memory.workers[target].length === 0) {
    delete Memory.workers[target] // delete worker list if the list is now emp
  }
}
const ACTIONS = {
  global: {
    //start: (creep, trgId, manifest, action, ...args) => {
    //  globalActionStart()
    //},
    //start: (creep, trgId, action) => {
    //  let actionFunc = ACTIONS[action]
    //},
    finish: (creep, manifest, action) => {
      if (typeof creep === 'string') { // cleaning up dead creep
        let creepMem = Memory.creeps[creep]
        creep = {memory: creepMem, name: creep} // make fake creep so we can clear actions
      }
      removeCreepFromWorkerList(creep.memory.targets[0], creep.name)
      let actionRes = ACTIONS[action].finish(creep, manifest)
      creep.memory.actions.shift()
      creep.memory.targets.shift()
      return actionRes
    }
  },
  //fill: {
  //  start: (creep, destPosition, targets = ['str', 'src'], resource = RESOURCE_ENERGY) =>
  //    globalActionStart(startFill, creep, destPosition, targets, resource),
  //  do: doFill,
  //  finish: finishFill
  //},
  repair: {
    start: (creep, trgId, ...args) => globalActionStart(startRepair, creep, trgId, 'repair', ...args),
    do: doRepair,
    finish: finishRepair
  },
  recycle: {
    start: (creep, trgId, ...args) => globalActionStart(startRecycle, creep, trgId,'recycle', ...args),
    do: doRecylce,
    finish: finishRecycle
  },
  harvest: {
    start: (creep, trgId, ...args) => globalActionStart(startHarvest, creep, trgId,'harvest', ...args),
    do: doHarvest,
    finish: finishHarvest
  },
  withdraw: {
    start: (creep, trgId, ...args) => globalActionStart(startWithdraw, creep, trgId,'withdraw', ...args),
    do: doWithdraw,
    finish: finishWithdraw
  },
  drop: {
    start: (creep, trgId, ...args) => globalActionStart(startDrop, creep, trgId,'withdraw', ...args),
    do: doDrop,
    finish: finishDrop
  },
  transfer: {
    start: (creep, trgId, ...args) => globalActionStart(startTransfer, creep, trgId,'transfer', ...args),
    do: doTransfer,
    finish: finishTransfer
  },
  upgrade: {
    start: (creep, trgId, ...args) => globalActionStart(startUpgrade, creep, trgId,'upgrade', ...args),
    do: doUpgrade,
    finish: finishUpgrade
  },
  build: {
    start: (creep, trgId, ...args) => globalActionStart(startBuild, creep, trgId,'build', ...args),
    do: doBuild,
    finish: finishBuild
  }
}
module.exports.ACTIONS = ACTIONS


function startBuild (creep, trgId) {
  if (!trgId || !Game.getObjectById(trgId)) {
    console.log('builder problem right now logggg', trgId)
    trgId = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES, {maxOps: 500})?.id
  }
  if (trgId) {
    creep.memory.actions.unshift('build')
    creep.memory.targets.unshift(trgId)
    return trgId
  }
  return false
}
function finishBuild (creep, manifest) {
}

function doBuild (creep, manifest) {
  try {
    let target = Game.getObjectById(creep.memory.targets[0])
    if (
      !target ||                                         // 1 target no longer exists.
      creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0 // 2 don't have energy for job anyways
    ) {
      return DONE // finish this job to get a new one
    }

    let actionRes = creep.build(target)
    switch (actionRes) {
      case ERR_NOT_OWNER:
        console.log('Tried to build someone elses site')
      case ERR_NOT_IN_RANGE:
        creep.moveTo(target)
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
  } catch (e) {
    console.log('Error: couldnt doBuild job', e.stack, 'site:', creep.memory.targets[0])
  }
}


function startRepair (creep, trgId) {
  //if (!trgId || !Game.getObjectById(trgId)) {
  //  trgId = creep.pos.findClosestByPath(FIND_STRUCTURES, {
  //    maxOps: 500, filter: (str) => {
  //      return str.hits < str.hitsMax
  //    }
  //  })?.id
  //}
  if (trgId) {
    creep.memory.actions.unshift('repair')
    creep.memory.targets.unshift(trgId)
  }
}
function finishRepair (creep, manifest) {
}

function doRepair (creep, manifest) {
  try {
    if (creep.store.getUsedCapacity() === 0) {
      return DONE
    } else {
      let target = Game.getObjectById(creep.memory.targets[0])
      if (target.hits === target.hitsMax) {
        return DONE
      }
      //OK	0
      //The operation has been scheduled successfully.
      //
      //  ERR_NOT_OWNER	-1
      //You are not the owner of this creep.
      //
      //  ERR_BUSY	-4
      //The creep is still being spawned.
      //
      //  ERR_NOT_ENOUGH_RESOURCES	-6
      //The creep does not carry any energy.
      //
      //  ERR_INVALID_TARGET	-7
      //The target is not a valid structure object.
      //
      //  ERR_NOT_IN_RANGE	-9
      //The target is too far away.
      //
      //  ERR_NO_BODYPART	-12
      //There are no WORK body parts in this creep’s body.
      let actionRes = creep.repair(target)
      switch (actionRes) {
        case OK:
          break
        case ERR_NOT_OWNER:
          console.log('Tried to repairing someone elses site')
          break
        case ERR_BUSY:
          break
        case ERR_NOT_ENOUGH_RESOURCES:
          return DONE
        case ERR_NOT_IN_RANGE:
          creep.moveTo(target)
          break
        case ERR_TIRED:
          console.log('creep says they are tired: ', creep.name)
          break
        case ERR_NOT_ENOUGH_RESOURCES:
          return DONE
          break
        case ERR_INVALID_TARGET:
          console.log('invalid repair target', creep.name, target?.id)
          return DONE
        default:
          console.log('Error: Build Action Response not handled: ', creep.name, JSON.stringify(target), actionRes, JSON.stringify(creep) )
          break
      }
    }
  } catch (e) {
    console.log('Error: couldnt doBuild job', e.stack, 'site:', creep.memory.targets[0])
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

function startUpgrade (creep, trgId) {
  if (trgId && Game.getObjectById(trgId)) {
    creep.memory.targets.unshift(trgId)
  } else {
    let room = Game.rooms[creep.pos.roomName]
    creep.memory.targets.unshift(room?.controller?.id)
  }
  delete creep.memory.UOK
  creep.memory.actions.unshift('upgrade')
}
function finishUpgrade (creep) {
  delete creep.memory.UOK
}

function doUpgrade (creep, manifest) {
  try {
    if (creep.store.getUsedCapacity() === 0) {
      if (creep.memory.UOK) {
        return DONE
      }
    } else {
      let controller = Game.getObjectById(creep.memory.targets[0])
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
          creep.moveTo(controller)
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

function startDrop (creep, trgId = undefined, nearPosition, resource = RESOURCE_ENERGY) {
  if (!trgId || !Game.getObjectById(trgId)) {
    return
  }
  creep.memory.targets.unshift(trgId)
  creep.memory.Dres = resource
  creep.memory.actions.unshift('drop')
}
function finishDrop (creep, manifest) {
  //energy.freeSrc(manifest, creep.name, creep.memory.targets[0])
  delete creep.memory.Dres
}

function doDrop (creep, manifest) {
  try {
    console.log('I bailed on setting up drop')
    return DONE
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
    let target = Game.getObjectById(creep.memory.targets[0])
    let actionRes = creep.drop(target, creep.memory.Dres || RESOURCE_ENERGY)
    switch (actionRes) {
      case ERR_NOT_IN_RANGE:
        creep.moveTo(target, {visualizePathStyle: {stroke: '#ff0fff'}})
        break
      case ERR_TIRED:
        console.log('creep says they are tired: ', creep.name)
        break
      //case ERR_NOT_ENOUGH_RESOURCES:
      //  // hybernate a bit maybe?
      //  if (creep.store.getUsedCapacity() > 0) {
      //    return DONE
      //  } else {
      //    if (!creep.memory.wait) {
      //      creep.memory.wait = Game.time + 5
      //    }
      //  }
      //  return
      //case ERR_INVALID_TARGET:
      //  return DONE
      //case ERR_FULL:
      //  return DONE
      //case ERR_NO_BODYPART:
      //  return DONE
      case OK:
        break
      default:
        console.log('creep.memory.targets[0] target loggg', JSON.stringify(target))
        console.log('creep.memory.Dres loggg', JSON.stringify(creep.memory.Dres))

        console.log('Error: Drop Action Response not handled: ', creep.name, actionRes, creep.memory.targets[0], creep.memory.Dres)
        break
    }
    return actionRes
  } catch (e) {
    console.log('Error: couldnt doDrop job', e.stack)
  }
}

function startWithdraw (creep, trgId = undefined, nearPosition, resource = RESOURCE_ENERGY) {
  if (!trgId || !Game.getObjectById(trgId)) {
    return
  }
  creep.memory.targets.unshift(trgId)
  creep.memory.Wres = resource
  creep.memory.actions.unshift('withdraw')
}
function finishWithdraw (creep, manifest) {
  //energy.freeSrc(manifest, creep.name, creep.memory.targets[0])
  delete creep.memory.Wres
  delete creep.memory.prevResources
  //delete last
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
    let target = Game.getObjectById(creep.memory.targets[0])
    let actionRes = creep.withdraw(target, creep.memory.Wres || RESOURCE_ENERGY)
    switch (actionRes) {
      case ERR_NOT_IN_RANGE:
        creep.moveTo(target)
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
        if (creep.memory.prevResources && ((creep.store.getUsedCapacity() - creep.memory.prevResources) <= 5)) {
          return DONE
        }
        creep.memory.prevResources = creep.store.getUsedCapacity()
        break
      default:
        console.log('creep.memory.WTrg target loggg', JSON.stringify(target))
        console.log('creep.memory.Wres loggg', JSON.stringify(creep.memory.Wres))

        console.log('Error: Withdraw Action Response not handled: ', creep.name, actionRes, creep.memory.targets[0], creep.memory.WRes)
        break
    }
    return actionRes
  } catch (e) {
    console.log('Error: couldnt doWithdraw job', e.stack)
  }
}
function startTransfer (creep, targetId, resource) {
  let target
  target = Game.getObjectById(targetId)
  if (!target) {
    return
  }
  creep.memory.actions.unshift('transfer')
  creep.memory.targets.unshift(targetId)
  //creep.memory.Tdest = target?.id
  if (resource) {
    creep.memory.Tres = resource
  }
  return true
}

function finishTransfer (creep, manifest) {
  delete creep.memory.Tres
  delete creep.memory.waited
  delete creep.memory.wait
}

function doTransfer (creep) {
  if (creep.memory.wait) {
    if (creep.memory.wait >= Game.time) {
      return
    } else {
      creep.memory.waited = true
      delete creep.memory.wait
    }
  }
  let trgId = creep.memory.targets[0]
  if (!trgId) {
    return DONE
  }

  const resource = creep.memory.Tres || RESOURCE_ENERGY
  if (creep.store.getUsedCapacity(resource) === 0) {
    return DONE // completely empty of res. done.
  }

  const target = Game.getObjectById(trgId)
  if (!target || target.store.getFreeCapacity() === 0) {
    return DONE
  }
  let actionRes = creep.transfer(target, resource)
  switch (actionRes) {
    case ERR_NOT_IN_RANGE:
      creep.moveTo(target, {ignoreCreeps: false})
      break
    case ERR_TIRED:
      break
    case ERR_NOT_ENOUGH_RESOURCES: // done with the job.
      return DONE
    case ERR_INVALID_TARGET:
      break
    case ERR_FULL: // dest is full. what should transfer people do?
      if (target?.structureType === STRUCTURE_SPAWN && !creep.memory.waited) {
        creep.memory.wait = Game.time + 2
        return
      } else {
        return DONE
      }
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

function startHarvest (creep, trgId) {
  if (!trgId) {
    console.log('cant harvest nothing!', creep.name, trgId)
    return
  }
  creep.memory.targets.unshift(trgId)
  creep.memory.actions.unshift('harvest')
  if (trgId) {
    creep.memory.Hslt = reserveSrcSlot(creep, trgId)
  }

}
function finishHarvest (creep) {
  freeSrcSlot(creep.memory.Hslt, creep.memory.targets[0], creep.name)
  delete creep.memory.Hslt
  delete creep.memory.wait
}

function doHarvest (creep, manifest) {
  if (creep.ticksToLive < CREEP_MIN_LIFE_TICKS) {
    return DONE
  }
  if (creep.memory.wait) {
    if (creep.memory.wait >= Game.time) {
      return
    } else {
      delete creep.memory.wait
    }
  }
  if (creep.store.getFreeCapacity() === 0) {
    return DONE
  }

  let src = Game.getObjectById(creep.memory.targets[0])
  if (!creep.memory.Hslt) {
    creep.memory.Hslt = reserveSrcSlot(creep, creep.memory.targets[0])
  }
  let actionRes = creep.harvest(src)
  switch (actionRes) {
    case OK: // The operation has been scheduled successfully.
      let reservedSlot = deserializePos(creep.memory.Hslt)
      if (creep.pos.x !== reservedSlot.x || creep.pos.y !== reservedSlot.y) {
        freeSrcSlot(creep.memory.Hslt, creep.memory.targets[0], creep.name)
        reserveSrcSlot(creep, creep.memory.targets[0])
      }
      break
    case ERR_NOT_IN_RANGE:
      creep.moveTo(src, {range: 0})
      break
    case ERR_INVALID_TARGET:
      console.log('invalid harvest target... really didnt think i would get here', creep.name, JSON.stringify(creep.memory))
      return DONE
    case ERR_NOT_ENOUGH_RESOURCES:
      if (creep.store.getUsedCapacity() > 0) {
        return DONE
      } else if (src.energy === 0) {
        creep.memory.wait = Game.time + src.ticksToRegeneration
      }
      break
    default:
      console.log('Error: Unhandled Harvest Action Response: ', creep.name, actionRes, JSON.stringify(creep.memory))
      break
  }
  return actionRes
  // OK	0
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
    creep.memory.actions.unshift('recycle')
  } catch (e) {
    console.log('Error: couldnt start recycle job', e.stack)
  }
}
function finishRecycle (creep, spawnId) {

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
      creep.moveTo(target, {range: 1})
    }
    switch (actionRes) {
      case ERR_NOT_IN_RANGE:
        let moveRes = creep.moveTo(target, {range: 1})
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
