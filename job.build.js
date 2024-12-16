
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
const {deserializePos} = require('./utils.memory')
const {fireCreep, completeJob, hireCreep} = require('./operation.job')

function finishBuild (base, creep) {
    console.log('site doesnt exist anymore.')
    delete creep.memory.siteId
    completeJob(base, creep.memory.jobId)
    delete creep.memory.jobId
    if (base.queue.build[0]) {
        hireCreep(base, creep.name, base.queue.build[0])
    } else {
        console.log('no open build jobs for builders...')
    }
}

module.exports.run = function (creep) {
    try {
        let base = Memory.bases[creep.memory.base]
        let job = base.jobs[creep.memory.jobId]
        if (!job) {
            finishBuild(base, creep)
            job = base.jobs[creep.memory.jobId]
        }

        let step = job.steps[creep.memory.step]

        let target
        if (!creep.memory.siteId) {
            if (step.type === 'pos') {
                let pos = deserializePos(step.id)
                if (pos) {
                    let lookRes = pos.lookFor(LOOK_CONSTRUCTION_SITES)[0]
                    if (lookRes) {
                        target = Game.getObjectById(lookRes.id)
                        if (target) {
                            creep.memory.siteId = lookRes.id
                        }
                    } else {
                        console.log('Error: couldnt find construction site id ', step.id, 'found:', JSON.stringify(lookRes))
                        finishBuild(base, creep)
                    }
                } else {
                    console.log('Error: couldnt find construction site at ', step.id)
                    finishBuild(base, creep)
                }

            }
        } else {
            target = Game.getObjectById(creep.memory.siteId)
            if (!target) {
                console.log('site doesnt exist anymore.')
                finishBuild(base, creep)
            }
        }

        if (!target) {
            //since no target found, filling up
            creep.memory.step++
        }

        let actionRes = creep.build(target)
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
            default:
                console.log('Error: Action Response not handled: ', actionRes)
                break
        }


        if (job.steps.length < creep.memory.step + 1) {
            creep.memory.step = 0
        }
    } catch (e) {
        console.log('Error: couldnt run build job', e.stack)
    }
}
