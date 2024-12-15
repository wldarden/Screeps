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

module.exports.run = function (creep) {
  try {
    // console.log('running creep[harvest]', creep.name)
    let base = Memory.bases[creep.memory.base]
    let job = base.jobs[creep.memory.jobId]
    let step = job.steps[creep.memory.step]

    let target = Game.getObjectById(step.id)
    // console.log(creep.room.name)
    // console.log(JSON.stringify(creep.room.getPositionAt(22, 17).lookFor(LOOK_CONSTRUCTION_SITES)[0]))

    let actionRes = creep.harvest(target)
    // console.log('actionRes: ', creep.name, actionRes)
    switch (actionRes) {
      case ERR_NOT_IN_RANGE:
        creep.moveTo(target, {range: 1, visualizePathStyle: {stroke: '#004400'}})
        break
      case ERR_TIRED:
        console.log('creep says they are tired: ', creep.name)
        break
      case OK:
        if (creep.store.getFreeCapacity() === 0) {
          creep.memory.step++
        }
        break
      default:
        console.log('Error: Action Response not handled: ', actionRes)
        break
    }


    if (job.steps.length < creep.memory.step + 1) {
      creep.memory.step = 0
    }
  } catch (e) {
    console.log('Error: couldnt run harvest job', e.stack)
  }
}
