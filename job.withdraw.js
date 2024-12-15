

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

module.exports.run = function (creep) {
    try {
        let base = Memory.bases[creep.memory.base]
        let job = base.jobs[creep.memory.jobId]
        let step = job.steps[creep.memory.step]


        let target
        if (step.type === 'obj') {
            target = Game.getObjectById(step.id)
        }

        let actionRes = creep.withdraw(target, RESOURCE_ENERGY)
        switch (actionRes) {
            case ERR_NOT_IN_RANGE:
                creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}})
                break
            case ERR_TIRED:
                console.log('creep says they are tired: ', creep.name)
                break
            case ERR_NOT_ENOUGH_RESOURCES:
                // hybernate a bit maybe?
                creep.memory.step++
                break
            case ERR_FULL:
                creep.memory.step++
                break
            case OK:
                if (creep.store.getFreeCapacity() === 0) {
                    creep.memory.step++
                }
                break
            default:
                creep.memory.step++
                break
        }


        if (job.steps.length < creep.memory.step + 1) {
            creep.memory.step = 0
        }
    } catch (e) {
        console.log('Error: couldnt run transfer job', e.stack)
    }
}
