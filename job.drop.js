

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
const TRANSFER_ERRORS = {
    [OK]:                       '[0] OK: The operation has been scheduled successfully.',
    [ERR_NOT_OWNER]:            '[-1] ERR_NOT_OWNER: You are not the owner of this creep.',
    [ERR_BUSY]:                 '[-4] ERR_BUSY: The creep is still being spawned.',
    [ERR_NOT_ENOUGH_RESOURCES]: '[-6] ERR_NOT_ENOUGH_RESOURCES: The creep does not have the given amount of resources.',
    [ERR_INVALID_TARGET]:       '[-7] ERR_INVALID_TARGET: The target is not a valid object which can contain the specified resource.',
    [ERR_FULL]:                 '[-8] ERR_FULL: The target cannot receive any more resources.',
    [ERR_NOT_IN_RANGE]:         '[-9] ERR_NOT_IN_RANGE: The target is too far away.',
    [ERR_INVALID_ARGS]:         '[-10] ERR_INVALID_ARGS: The resourceType is not one of the RESOURCE_* constants, or the amount is incorrect.'
}

const {getStepEntityId, getCreepStep} = require('./operation.job')
const {deserializePos} = require('./utils.memory')
const {nextStep} = require('./utils.creep')
module.exports.run = function (creep) {
    try {
        let base = Memory.bases[creep.memory.base]
        let job = base.jobs[creep.memory.jobId]
        let step = job.steps[creep.memory.step]
        let resource = step.resource ?? RESOURCE_ENERGY
        if (!creep.memory.dest) {
            let dest = getStepEntityId(getCreepStep(creep, job), creep.memory.actionIndex)
            if (dest) {
                creep.memory.dest = dest
            }
        }

        let target
        let actionRes
        target = deserializePos(creep.memory.dest)
        if (!creep.pos.isNearTo(target.x, target.y)) {
            actionRes = ERR_NOT_IN_RANGE
        } else {
            creep.drop(resource)
            actionRes = OK
        }

        switch (actionRes) {
            case ERR_NOT_IN_RANGE:
                creep.moveTo(target, {ignoreCreeps: false, visualizePathStyle: {stroke: '#008800'}})
                break
            case ERR_TIRED:
                console.log('creep says they are tired: ', creep.name)
                break
            case ERR_NOT_ENOUGH_RESOURCES: // basically done with the job.
                nextStep(creep)
                break
            case ERR_INVALID_TARGET:
                return actionRes
                break
            case OK:
                if (creep.store.getUsedCapacity() === 0) {
                    nextStep(creep)
                }
                break
            default:
                console.log('Error: ', creep.name, 'Drop Action Response not handled: ', actionRes)
                break
        }


        // let actionRes = creep.transfer(target, resource)
        // switch (actionRes) {
        //   case ERR_NOT_IN_RANGE:
        //     creep.moveTo(target, {
        //       ignoreCreeps: false,
        //       visualizePathStyle: {stroke: '#008800'}}
        //     )
        //     break
        //   case ERR_TIRED:
        //     console.log('creep says they are tired: ', creep.name)
        //     break
        //   case ERR_NOT_ENOUGH_RESOURCES:
        //     creep.memory.step++
        //     break
        //   case ERR_FULL:
        //     console.log('waiting: my wait:', creep.memory.wait, 'Game.time', Game.time)
        //     if (!creep.memory.wait) {
        //       creep.memory.wait = Game.time + 3
        //     } else {
        //       if (Game.time >= creep.memory.wait) { // waited 3 ticks and still full. drop and continue
        //         creep.drop(resource)
        //         creep.memory.step++
        //         delete creep.memory.wait
        //       }
        //     }
        //
        //     break
        //   case OK:
        //     if (creep.store.getUsedCapacity() === 0) {
        //       creep.memory.step++
        //     }
        //     break
        //   default:
        //     console.log('Error: Action Response not handled: ', actionRes)
        //     break
        // }


    } catch (e) {
        console.log('Error: couldnt run transfer job', e.stack)
    }
}
