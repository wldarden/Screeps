
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
// The creep does not have any carried energy.
//
//   ERR_INVALID_TARGET	-7
// The target is not a valid construction site object or the structure cannot be built here (probably because of a creep at the same square).
//
// ERR_NOT_IN_RANGE	-9
// The target is too far away.
//
//   ERR_NO_BODYPART	-12
// There are no WORK body parts in this creep’s body.
module.exports.run = function (creep) {
    try {
        let base = Memory.bases[creep.memory.base]
        let job = base.jobs[creep.memory.jobId]
        let step = job.steps[creep.memory.step]


        let target
        if (step.type === 'obj') {
            target = Game.getObjectById(step.id)
        }

        let actionRes = creep.upgradeController(target)
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
                creep.memory.step++
                break
            case OK:
                if (creep.store.getUsedCapacity() === 0) {
                    creep.memory.step++
                }
                break
        }


        if (job.steps.length < creep.memory.step + 1) {
            creep.memory.step = 0
        }
    } catch (e) {
        console.log('Error: couldnt run transfer job', e.stack)
    }
}
