// const {validatePrioritySrc, removeCreepFromSource, validatePriorityTarget, setCreepSrcTrg} = require('./utils.creep')
// const {controllerNeedsEnergy} = require('./base.controller')
//
//
// module.exports.harvest = function (creep) {
//     if (!creep.memory.srcTrg) {
//         validatePrioritySrc(creep)
//     }
//     let srcTrgObj = Game.getObjectById(creep.memory.srcTrg)
//     if (creep.harvest(srcTrgObj) === ERR_NOT_IN_RANGE) {
//         creep.moveTo(srcTrgObj, {visualizePathStyle: {stroke: '#ffffff'}})
//     } else if (creep.store.getFreeCapacity() === 0) {
//         creep.memory.status = 'full'
//         removeCreepFromSource(creep, creep.memory.srcTrg)// remove creep from source active list
//         validatePriorityTarget(creep) // recheck that the destination for energy is still priority
//     }
// }
//
// function getTargetActionRes (trgObj, creep) {
//     switch (trgObj.structureType) {
//         case STRUCTURE_EXTENSION:
//         case STRUCTURE_SPAWN:
//             return creep.transfer(trgObj, RESOURCE_ENERGY)
//         case STRUCTURE_CONTROLLER:
//             return creep.upgradeController(trgObj)
//         default:
//             // none of these matched. maybe we have a source?
//             if (Game.sources[trgObj.id]) {
//                 return creep.harvest(trgObj)
//             }
//
//     }
// }
//
// module.exports.doAction = function (creep) {
//     const trgObject = Game.getObjectById(creep.memory.target)
//     let actionRes
//     try {
//         actionRes = getTargetActionRes(trgObject, creep)
//     } catch (e) {
//         console.log('Error: running action func', e.stack)
//     }
//     switch (actionRes) {
//         case ERR_FULL:
//             creep.memory.target = null
//             setCreepSrcTrg(creep, null)
//             return ERR_FULL
//         case ERR_NOT_IN_RANGE:
//             creep.moveTo(trgObject, {visualizePathStyle: {stroke: '#ffffff'}})
//             return ERR_NOT_IN_RANGE
//         case OK:
//             if (creep.store.getUsedCapacity() === 0) {
//                 creep.memory.status = 'empty'
//             }
//             return OK
//     }
// }

const {validatePriorityTarget} = require('./utils.creep')

function harvest (creep, trgObj) {
  let res = creep.harvest(trgObj)
  switch (res) {
    case ERR_NOT_IN_RANGE:
      creep.memory.travelling = true
      break
    case ERR_TIRED:
      console.log('creep says they are tired: ', creep.name)
      break
    case ERR_NOT_ENOUGH_RESOURCES:
      // hybernate a bit maybe?
      break
    case OK:
      creep.memory.travelling = false
      if (creep.store.getFreeCapacity() === 0) {
        creep.memory.action = 'idle'
      }
      break
  }
  return res
}
module.exports.harvest = harvest

// OK	0
// The operation has been scheduled successfully.
//
//   ERR_NOT_OWNER	-1
// You are not the owner of this creep.
//
//   ERR_BUSY	-4
// The creep is still being spawned.
//
//   ERR_NOT_ENOUGH_RESOURCES	-6
// The creep does not have the given amount of resources.
//
//   ERR_INVALID_TARGET	-7
// The target is not a valid object which can contain the specified resource.
//
//   ERR_FULL	-8
// The target cannot receive any more resources.
//
//   ERR_NOT_IN_RANGE	-9
// The target is too far away.
//
//   ERR_INVALID_ARGS	-10
// The resourceType is not one of the RESOURCE_* constants, or the amount is incorrect.
function transfer (creep, trgObj, resource = RESOURCE_ENERGY) {
  let res = creep.transfer(trgObj, RESOURCE_ENERGY)
  switch (res) {
    case ERR_NOT_IN_RANGE:
      creep.memory.travelling = true
      break
    case ERR_FULL:
      creep.memory.target = null// ???
      break
    case ERR_NOT_ENOUGH_RESOURCES:
      creep.memory.action = 'refill'
      creep.memory.travelling = true
      break
    case OK:
      creep.memory.travelling = false
      if (creep.store.getUsedCapacity() === 0) {
        creep.memory.travelling = true
        creep.memory.action = 'idle'
        validatePriorityTarget(creep)
      }
      break
  }
  console.log('Transfer Result logggg:', res)
  return res
}

function upgradeController (creep, trgObj) {
  let res = creep.upgradeController(trgObj)
  switch (res) {
    case ERR_NOT_IN_RANGE:
      creep.memory.travelling = true
    case ERR_FULL:
      creep.memory.travelling = true
      creep.memory.action = 'idle'
    case ERR_NOT_ENOUGH_RESOURCES:
      creep.memory.action = 'refill'
      creep.memory.travelling = true
      break
    case OK:
      creep.memory.travelling = false
      if (creep.store.getUsedCapacity() === 0) {
        creep.memory.travelling = true
        creep.memory.action = 'idle'
        // validatePriorityTarget(creep)
      }
  }
  return res
}

function doDropOff (creep, trgObj, resource = RESOURCE_ENERGY) {
  console.log(trgObj?.structureType, JSON.stringify(trgObj), 'trgObj logggg')
  switch (trgObj.structureType) {
    case STRUCTURE_EXTENSION:
    case STRUCTURE_SPAWN:
      return transfer(creep, trgObj, resource)
    case STRUCTURE_CONTROLLER:
      return upgradeController(creep, trgObj)
  }

}
module.exports.doDropOff = doDropOff
