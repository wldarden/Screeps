
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
const {deserializePos, serializePos} = require('./utils.memory')
const { completeJob, hireCreep, getStepEntityId} = require('./operation.job')
const {nextStep, nextAction} = require('./utils.creep')

function finishBuild (base, creep) {
    console.log('Finish Build: ', creep.memory.jobId, 'site doesnt exist anymore.')
      // TODO = set struct type so that when it finishes it will be added to base.structures
    if (creep.memory.jobId) {
        let buildingPos = deserializePos(creep.memory.jobId)
        let room = Memory.bases[base.room]
        if (room) {
            let sites = room.lookAt(buildingPos.x, buildingPos.y)
            sites.forEach(s => {
                if (s.type === 'structure') {
                    if (!base.structures[s.structure.type]) {
                        base.structures[s.structure.type] = [s.structure.id]
                    } else {
                        base.structures[s.structure.type].push(s.structure.id)
                    }
                }
            })
        }
    }
    completeJob(base, creep.memory.jobId)
    delete creep.memory.jobId
    return getBuildJob(base, creep)
}
function getBuildJob (base, creep) {
    if (base.queue.build?.length) {
        hireCreep(base, creep.name, base.queue.build[0])
        return true
    } else {
        console.log('no open build jobs for builders...')
        return false
    }
}

function initBuildStep (base, job, stepIndex = 0) {
    if (job.steps[stepIndex].type !== 'site') { // build job hasnt been converted to site yet
        let siteId = getStepEntityId(job.steps[stepIndex])
        if (siteId) {
            base.jobs[job.id].steps[stepIndex].id = serializePos(siteId)
            base.jobs[job.id].steps[stepIndex].type = 'site'
            let constructionSite = Game.getObjectById(siteId)
            // base.sites.structures.
            return true
        } else {
            return false
        }
    }
}

// function getCreepBuildJob (base, creep) {
//     return base.jobs[creep.memory.jobId]
//     // let job = base.jobs[creep.memory.jobId]
//     // if (!job) {
//     //     if (finishBuild(base, creep)) {
//     //         return base.jobs[creep.memory.jobId]
//     //     } else {
//     //         return false
//     //     }
//     // } else {
//     //     return job
//     // }
// }

function getBuildJST (base, creep) {
    let job = base.jobs[creep.memory.jobId] //getCreepBuildJob(base,creep) // base.jobs[creep.memory.jobId]
    if (!job) { return {job: undefined, step: undefined, target: undefined} }

    let step = job?.steps[creep.memory.step]
    if (!step) { return {job: job, step: undefined, target: undefined} }

    if (!step.site) { // build job hasnt been converted to site yet
        let siteId = getStepEntityId(step, creep.memory.actionIndex)
        console.log('site Id recieved: ', siteId, JSON.stringify(step))
        if (siteId) {
            base.jobs[creep.memory.jobId].steps[creep.memory.step].site = serializePos(siteId)
        } else {
            console.log('No Build site found for 11', creep.name, JSON.stringify(job))
            console.log('No Build site found for 22', creep.name, creep.memory.actionIndex)
            console.log('No Build site found for 33', creep.name, creep.memory.step)
            console.log('No Build site found for 44', creep.name, JSON.stringify(job?.steps[creep.memory.step]))
            return {job: job, step: step, target: undefined}
        }
        // job = base.jobs[creep.memory.jobId]
        // step = job?.steps[creep.memory.step]
    }
    let target = Game.getObjectById(base.jobs[job.id].steps[creep.memory.step].site)
    return {
        job: base.jobs[creep.memory.jobId],
        step: base.jobs[creep.memory.jobId].steps[creep.memory.step],
        target: target
    }
}
function resetBuildCreep (creep) {
    delete creep.memory.jobId
    creep.memory.step = 0
    delete creep.memory.actionIndex
    delete creep.memory.init
}
function checkForFinishedBuild (base, creep) {
    const {job, step, target} = getBuildJST(base, creep)
    if (!job) {
        resetBuildCreep(creep)
        return
    }
    if (!target) {
        if (step.id && step.site) {
            let buildingPos = deserializePos(step.id)
            console.log('buildingPos', JSON.stringify(buildingPos))
            console.log('buildingPos 2', JSON.stringify(step.id))
            let lookRes = buildingPos.lookFor(LOOK_STRUCTURES)
            if (lookRes.length) {
                lookRes.some(r => {
                    console.log('lookRes', JSON.stringify(r))
                    if (r.structureType === job.structureType) {
                        base.structures[r.structureType].push(r.id)
                        completeJob(base, job.id)
                        resetBuildCreep(creep)
                        return {job: undefined, step: undefined, target: undefined}
                    }
                })
            }
        }
        console.log('job step target', JSON.stringify({job, step, target}))
        console.log('No build target', creep.name, ' did we get the site into the base.structures?')
        nextAction(creep, step)
        console.log('Build job is over! 1', creep.memory.step, JSON.stringify(job))
        console.log('Build job is over! 2', JSON.stringify(step))
        console.log('Build job is over! 3', JSON.stringify( target))

    }
    return {job, step, target}

}
module.exports.run = function (creep) {
    try {
        let base = Memory.bases[creep.memory.base]

        // const {job, step, target} = getBuildJST(base, creep)
        const {job, step, target} = checkForFinishedBuild(base, creep)
        if (!job) {
            return
        }
        if (!target) {
            // checkForFinishedBuild(base, creep)
            // console.log('job step target', JSON.stringify({job, step, target}))
            // console.log('No build target', creep.name, ' did we get the site into the base.structures?')
            nextAction(creep, step)
            // console.log('Build job is over! 1', creep.memory.step, JSON.stringify(job))
            // console.log('Build job is over! 2', JSON.stringify(step))
            // console.log('Build job is over! 3', JSON.stringify( target))
            return
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
                nextStep(creep, step)
                break
            case OK:
                if (creep.store.getUsedCapacity() === 0) {
                    nextStep(creep)
                }
                break
            default:
                console.log('Error: Build Action Response not handled: ', creep.name, JSON.stringify(target), actionRes, JSON.stringify(creep), JSON.stringify(job) )
                break
        }


    } catch (e) {
        console.log('Error: couldnt run build job', e.stack)
    }
}

