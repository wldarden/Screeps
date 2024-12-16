// OK	0
// The operation has been scheduled successfully.
//
//   ERR_NOT_OWNER	-1
// You are not the owner of this spawn or the target creep.
//
//   ERR_INVALID_TARGET	-7
// The specified target object is not a creep.
//
//   ERR_NOT_IN_RANGE	-9
// The target creep is too far away.
//
//   ERR_RCL_NOT_ENOUGH	-14
// Your Room Controller level is insufficient to use this spawn.
const {getCreepStep, completeJob} = require('./operation.job')
module.exports.run = function (creep) {
    try {
        let base = Memory.bases[creep.memory.base]
        let job = base.jobs[creep.memory.jobId]
        let step = getCreepStep(creep, job)

        let target = Game.getObjectById(step.id)

        let actionRes = target.recycleCreep(creep)
        // console.log('actionRes: ', creep.name, actionRes)
        switch (actionRes) {
            case ERR_NOT_IN_RANGE:
                creep.moveTo(target, {range: 1, visualizePathStyle: {stroke: '#BB0000'}})
                break
            case OK:
                console.log('Creep', creep.name, 'waiting to die...')
              completeJob(base,creep.memory.jobId)
                break
            default:
                console.log('Error: Action Response not handled: ', actionRes)
                break
        }
        if (job.steps.length < creep.memory.step + 1) {
            creep.memory.step = 0
        }
    } catch (e) {
        console.log('Error: couldnt run recycle job', e.stack)
    }
}
