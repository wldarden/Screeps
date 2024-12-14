

// const captains = [
//   {runner: require('base.controller'), name: 'Controller Captain', ticks: 1, offset: 0}
// ]

module.exports.run = function (base, manifest) {
  let room = Game.rooms[base.name]
  /**
   * Get containers that need energy
   */
  let energyTargets = getBaseEnergyTargets(room) // targets in order of most free energy capacity
  /**
   * Get controllers that need energy
   */
  if (room.controller.level < base.goal.controllerLevel) {
    //then the controller should be an energyTarget
  }
  Memory.bases[base.name].targets[RESOURCE_ENERGY].concat(energyTargets)

  let neededEnergy = 0
  energyTargets.forEach(t => {
    neededEnergy += t.store.getFreeCapacity()
  })

  let neededMinerParts = Math.ceil(neededEnergy / 50)

  let miners = 0
  // Memory.bases[base.name].creeps.forEach(cId => {
  //   if (Game.creeps[cId]) {
  //     miners += Game.creeps[cId].body.filter(p => p.type === WORK)
  //   }
  // })

  // do we need more miners?
}

function trgPriorityMultiplier (trg) {
  switch (trg.structureType) {
    case STRUCTURE_EXTENSION:
      return .5
    case STRUCTURE_SPAWN:
      return .8
    case STRUCTURE_CONTROLLER:
      return 1
    default:
      return 1
  }
}

function trgPriority (trg) {
  switch (trg.structureType) {
    case STRUCTURE_EXTENSION:
    case STRUCTURE_SPAWN:
      return trgPriorityMultiplier(trg) * s.store.getFreeCapacity(RESOURCE_ENERGY) / s.store.getCapacity(RESOURCE_ENERGY)
    case STRUCTURE_CONTROLLER:
      return trgPriorityMultiplier(trg)
    default:
      return 1
  }
}

function getBaseContainerTargets (room) {
  try {
    return room.find(FIND_MY_STRUCTURES, {
      filter: (s) => {
        return (s.structureType == STRUCTURE_EXTENSION || s.structureType == STRUCTURE_SPAWN) &&
          s.store.getFreeCapacity(RESOURCE_ENERGY) > 30;
      }
    }).sort((a,b) => {
      if (a.structureType === STRUCTURE_SPAWN && b.structureType !== STRUCTURE_SPAWN) {
        return 1
      } else if (a.structureType !== STRUCTURE_SPAWN && b.structureType === STRUCTURE_SPAWN) {
        return -1
      } else {
        return a.store.getFreeCapacity(RESOURCE_ENERGY) - b.store.getFreeCapacity(RESOURCE_ENERGY)
      }
    }).map(s => {
      s.priority = s.store.getFreeCapacity(RESOURCE_ENERGY) / s.store.getCapacity(RESOURCE_ENERGY) // if 90/100 empty: high priority, if 10/100 empty, low priority
      return s
    }) || []
  } catch (e) {
    cosnole.log('Error getBaseContainerTargets', e.stack)
  }
}
/**
 * energy containers:   base.targets.energyStore < critical, low, medium, high
 * construction sites:  pretty high priority...
 * upgrades:            (if controller.level < base.targets.targetLevel
 *
 * @param room
 * @return {*|*[]}
 */
function getBaseEnergyTargets (room) {
  try {
    return room.find(FIND_STRUCTURES, {
      filter: (s) => {
        return (s.structureType == STRUCTURE_EXTENSION || s.structureType == STRUCTURE_SPAWN) &&
          s.store.getFreeCapacity(RESOURCE_ENERGY) > 30;
      }
    }).sort((a,b) => {
      if (a.structureType === STRUCTURE_SPAWN && b.structureType !== STRUCTURE_SPAWN) {
        return 1
      } else if (a.structureType !== STRUCTURE_SPAWN && b.structureType === STRUCTURE_SPAWN) {
        return -1
      } else {
        return a.store.getFreeCapacity(RESOURCE_ENERGY) - b.store.getFreeCapacity(RESOURCE_ENERGY)
      }
    }).map(s => {
      s.priority = s.store.getFreeCapacity(RESOURCE_ENERGY) / s.store.getCapacity(RESOURCE_ENERGY) // if 90/100 empty: high priority, if 10/100 empty, low priority
      return s
    }) || []
  } catch (e) {
    cosnole.log('Error getBaseEnergyTargets', e.stack)
  }

}
