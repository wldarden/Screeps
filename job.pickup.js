

// OK	0
// The operation has been scheduled successfully.
//
//   ERR_NOT_OWNER	-1
// You are not the owner of this creep, or there is a hostile rampart on top of the target.
//
//   ERR_BUSY	-4
// The creep is still being spawned.
//
//   ERR_NOT_ENOUGH_RESOURCES	-6
// The target does not have the given amount of resources.
//
//   ERR_INVALID_TARGET	-7
// The target is not a valid object which can contain the specified resource.
//
//   ERR_FULL	-8
// The creep's carry is full.
//
// ERR_NOT_IN_RANGE	-9
// The target is too far away.
//
//   ERR_INVALID_ARGS	-10
// The resourceType is not one of the RESOURCE_* constants, or the amount is incorrect.

const {nextStep} = require('./utils.creep')
const {getStepEntity, getCreepStep, completeJob, fireCreep} = require('./operation.job')
module.exports.run = function (creep) {
    try {
        let base = Memory.bases[creep.memory.base]
        let job = base.jobs[creep.memory.jobId]
        let step = getCreepStep(creep, job)


        let target = getStepEntity(step, creep.memory.actionIndex)

        let actionRes = creep.pickup(target, RESOURCE_ENERGY)
        switch (actionRes) {
            case ERR_NOT_IN_RANGE:
                creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}})
                break
            case ERR_TIRED:
                console.log('creep says they are tired: ', creep.name)
                break
            case ERR_INVALID_TARGET:
                // completeJob(base, creep.memory.jobId)
                // fireCreep(base, creep.name, creep.memory.jobId)
                break
            case ERR_NOT_ENOUGH_RESOURCES:
                // hybernate a bit maybe?
                nextStep(creep)
                break
            case ERR_FULL:
                nextStep(creep)
                break
            case OK:
                if (creep.store.getFreeCapacity() === 0) {
                    nextStep(creep)
                }
                break
            default:
                console.log('Error: Pickup Action Response not handled: ', actionRes)
                break
        }

    } catch (e) {
        console.log('Error: couldnt run pickup job', e.stack)
    }
}
