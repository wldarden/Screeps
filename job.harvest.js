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


const {setCreepSrcTrg, getBaseResourceTarget, validatePriorityTarget} = require('./utils.creep')
const {harvest, doDropOff} = require('./actions')

module.exports.run = function (creep) {
  try {
    let job = Memory.jobs[creep.memory.job.type][creep.memory.job.id]
    // we are harvesting.
    // refill
    // dropoff
    if (creep.memory.action === 'idle') {
      if (creep.store.getUsedCapacity() / creep.store.getFreeCapacity() > 1) { // should we fill up or distribute?
        // go to target
        creep.travelling = true
        creep.memory.action = 'dropoff'
        creep.memory.target = getBaseResourceTarget(Memory.bases[creep.memory.base], RESOURCE_ENERGY)
      } else {
        // go to source
        creep.travelling = true
        creep.memory.action = 'refill'
        setCreepSrcTrg(creep, job.target)
      }
    } else if (creep.memory.action === 'refill') {
      // go to source or harvest
      let source = Game.getObjectById(job.params.source)
      if (creep.memory.travelling) {
        creep.moveTo(source)
      }
      harvest(creep, source)
    } else if (creep.memory.action === 'dropoff') {
      // find target
      // move to
      // drop off
      console.log('Performing Action ', creep.memory.action, 'target: ', creep.memory.target, 'travelling',creep.memory.travelling)
      if (!creep.memory.target) {
        if (job.params.dropoff) {
          creep.memory.target = job.params.dropoff
        } else {
          creep.memory.target = validatePriorityTarget(creep)
        }
      }
      let trgObj = Game.getObjectById(creep.memory.target)
      if (trgObj) {
        if (creep.memory.travelling) {
          creep.moveTo(trgObj)
        }
        doDropOff(creep, trgObj)
      } else {
        creep.memory.target = null
      }

    }
  } catch (e) {
    console.log('Error: couldnt run harvest job', e.stack)
  }

}
// if (creep.harvest(srcTrgObj) === ERR_NOT_IN_RANGE) {
//         creep.moveTo(srcTrgObj, {visualizePathStyle: {stroke: '#ffffff'}})
//     } else if (creep.store.getFreeCapacity() === 0) {
//         creep.memory.status = 'full'
//         removeCreepFromSource(creep, creep.memory.srcTrg)// remove creep from source active list
//         validatePriorityTarget(creep) // recheck that the destination for energy is still priority
//     }
