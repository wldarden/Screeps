

// OK	0
// The operation has been scheduled successfully.
//
//   ERR_NOT_OWNER	-1
// You are not the owner of this creep or the target controller.
//
//   ERR_BUSY	-4
// The creep is still being spawned.
//
//   ERR_NOT_ENOUGH_RESOURCES	-6
// The creep does not have any carried energy.
//
//   ERR_INVALID_TARGET	-7
// The target is not a valid controller object, or the controller upgrading is blocked.
//
//   ERR_NOT_IN_RANGE	-9
// The target is too far away.
//
//   ERR_NO_BODYPART	-12
// There are no WORK body parts in this creep’s body.

const {nextStep} = require('./utils.creep')
const {ACTIONS} = require('./actions')
const {energy} = require('./utils.manifest')
module.exports.run = function (creep, manifest) {
    try {
        const energyNeeded = creep.store.getFreeCapacity()
        if (energyNeeded === 0) {
            ACTIONS.upgrade.start(creep, creep.memory.nodeId)
        } else {
            let energyReq = energy.getSrc(manifest, creep, energyNeeded)
            if (energyReq) {
                let target = Game.getObjectById(energyReq.id)
                ACTIONS.withdraw.start(creep, target.id)
            }
            return
        }
        // let base = Memory.nodes[creep.memory.base]
        // let job = base.jobs[creep.memory.jobId]
        // let step = job.steps[creep.memory.step]
        //
        //
        // if (!creep.memory.dest) {
        //     creep.memory.dest = getStepEntityId(getCreepStep(creep, job), creep.memory.step)
        // }
        // let target = getStepEntity(step)
        //
        // let actionRes = creep.upgradeController(target)
        // switch (actionRes) {
        //     case ERR_NOT_IN_RANGE:
        //         creep.moveTo(target, {range: 2, visualizePathStyle: {stroke: '#ffffff'}})
        //         break
        //     case ERR_TIRED:
        //         console.log('creep says they are tired: ', creep.name)
        //         break
        //     case ERR_NOT_ENOUGH_RESOURCES:
        //         // hybernate a bit maybe?
        //         nextStep(creep)
        //         break
        //     case OK:
        //         if (creep.store.getUsedCapacity() === 0) {
        //             nextStep(creep)
        //         }
        //         break
        //     default:
        //         console.log('Error: Upgrade Action Response not handled: ', actionRes)
        //         break
        // }

    } catch (e) {
        console.log('Error: couldnt run upgrade job', e.stack)
    }
}
