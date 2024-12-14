const {getSourcesForPos} = require('./utils.cartographer')
const {submitJob} = require('./operation.job')


module.exports.addTrgSources = function (base, trgId) {
  try {
    let sources = base.sourcePaths[trgId]
    if (sources) {
      return sources
    } else {
      let trgObj = Game.getObjectById(trgId)
      const res = getSourcesForPos(trgObj, base.sources)
      Memory.bases[base.name].sourcePaths[trgId] = res
      return res
    }
  } catch (e) {
    console.log('Error: addTrgSources(', base.name, trgId, ')', e.stack)
  }
}

function init (base, manifest) {
  // if (!base.[])
}

module.exports.run = function (base, manifest) {
  // manage jobs

  base.sources.forEach(s => {
    init(base,manifest)
    // if (!s.mode) {
    //   // determine what strategy to use to mine this source
    //   for (let i = 0; i < newSource.slots; i++) {
    //     submitJob({
    //       type: 'harvest',
    //       id: `source_${source.id}_${i}`,
    //       base: source.room.name,
    //       params: {
    //         source: source.id
    //       },
    //       roles: ['harvester', 'peon']
    //     })
    //   }
    // }
  })


  // base.sources.some(s => {
  //   if (s.active.length < s.slots) {
  //     submitJob(
  //       {
  //         id: `${base.name}_${s.id}`,
  //         base: base.name,
  //         roles: ['peon', 'harvester'],
  //         type: 'harvest'
  //     })
  //   }
  // })



  /**
   * Clear Dead creeps
   */
  // base.sources.forEach(s => {
  //   s.active = s.active.filter(cId => !!Game.creeps[cId])
  // })

  // let room = Game.rooms[base.name]
  // /**
  //  * Get containers that need energy
  //  */
  // let energyTargets = getBaseEnergyTargets(room) // targets in order of most free energy capacity
  // /**
  //  * Get controllers that need energy
  //  */
  // if (room.controller.level < base.goal.controllerLevel) {
  //   //then the controller should be an energyTarget
  // }
  // Memory.bases[base.name].energyTargets.concat(energyTargets)
  //
  // let neededEnergy = 0
  // energyTargets.forEach(t => {
  //   neededEnergy += t.store.getFreeCapacity()
  // })

  // let neededMinerParts = Math.ceil(neededEnergy / 50)
  //
  // let miners = 0
  // Memory.bases[base.name].creeps.forEach(cId => {
  //   if (Game.creeps[cId]) {
  //     miners += Game.creeps[cId].body.filter(p => p.type === WORK)
  //   }
  // })

  // do we need more miners?
}
//
// function trgPriorityMultiplier (trg) {
//   switch (trg.structureType) {
//     case STRUCTURE_EXTENSION:
//       return .5
//     case STRUCTURE_SPAWN:
//       return .8
//     case STRUCTURE_CONTROLLER:
//       return 1
//     default:
//       return 1
//   }
// }
//
// function trgPriority (trg) {
//   switch (trg.structureType) {
//     case STRUCTURE_EXTENSION:
//     case STRUCTURE_SPAWN:
//       return trgPriorityMultiplier(trg) * s.store.getFreeCapacity(RESOURCE_ENERGY) / s.store.getCapacity(RESOURCE_ENERGY)
//     case STRUCTURE_CONTROLLER:
//       return trgPriorityMultiplier(trg)
//     default:
//       return 1
//   }
// }
//
// function getBaseContainerTargets (room) {
//   try {
//     return room.find(FIND_MY_STRUCTURES, {
//       filter: (s) => {
//         return (s.structureType == STRUCTURE_EXTENSION || s.structureType == STRUCTURE_SPAWN) &&
//           s.store.getFreeCapacity(RESOURCE_ENERGY) > 30;
//       }
//     }).sort((a,b) => {
//       if (a.structureType === STRUCTURE_SPAWN && b.structureType !== STRUCTURE_SPAWN) {
//         return 1
//       } else if (a.structureType !== STRUCTURE_SPAWN && b.structureType === STRUCTURE_SPAWN) {
//         return -1
//       } else {
//         return a.store.getFreeCapacity(RESOURCE_ENERGY) - b.store.getFreeCapacity(RESOURCE_ENERGY)
//       }
//     }).map(s => {
//       s.priority = s.store.getFreeCapacity(RESOURCE_ENERGY) / s.store.getCapacity(RESOURCE_ENERGY) // if 90/100 empty: high priority, if 10/100 empty, low priority
//       return s
//     }) || []
//   } catch (e) {
//     cosnole.log('Error getBaseContainerTargets', e.stack)
//   }
// }
// /**
//  * energy containers:   base.targets.energyStore < critical, low, medium, high
//  * construction sites:  pretty high priority...
//  * upgrades:            (if controller.level < base.targets.targetLevel
//  *
//  * @param room
//  * @return {*|*[]}
//  */
// function getBaseEnergyTargets (room) {
//   try {
//     return base.structures[STRUCTURE_SPAWN].map(sId => {
//       let gameObj = Game.getObjectById(sId)
//       gameObj.priority = trgPriority(gameObj)
//       return gameObj
//     })
//
//
//     return room.find(FIND_STRUCTURES, {
//       filter: (s) => {
//         return (s.structureType == STRUCTURE_EXTENSION || s.structureType == STRUCTURE_SPAWN) &&
//           s.store.getFreeCapacity(RESOURCE_ENERGY) > 30;
//       }
//     }).sort((a,b) => {
//       if (a.structureType === STRUCTURE_SPAWN && b.structureType !== STRUCTURE_SPAWN) {
//         return 1
//       } else if (a.structureType !== STRUCTURE_SPAWN && b.structureType === STRUCTURE_SPAWN) {
//         return -1
//       } else {
//         return a.store.getFreeCapacity(RESOURCE_ENERGY) - b.store.getFreeCapacity(RESOURCE_ENERGY)
//       }
//     }).map(s => {
//       s.priority = s.store.getFreeCapacity(RESOURCE_ENERGY) / s.store.getCapacity(RESOURCE_ENERGY) // if 90/100 empty: high priority, if 10/100 empty, low priority
//       return s
//     }) || []
//   } catch (e) {
//     cosnole.log('Error getBaseEnergyTargets', e.stack)
//   }
//
// }
