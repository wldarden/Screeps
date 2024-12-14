

module.exports.JOB_TYPES = {
    harvest: {name: 'Harvest Job'},
    // build: {},
    // upgrade: {},
    // transport: {}
}


function fetchBaseJobs (baseName) {
    try {
        if (Memory.bases[baseName]) {
            // return Memory.bases[baseName].jobs || {}
            return Memory.bases[baseName].jobs
        } else {
            console.log('Couldnt find Base Jobs', JSON.stringify(job))
        }
        // return Memory.bases[job.base].jobs[job.type][job.parentId].find(j => j.reserver === name)
    } catch (e) {
        console.log('Error: could not find Base Jobs.', baseName, e.stack)
    }
}
module.exports.fetchBaseJobs = fetchBaseJobs

function fetchTypeJobs (baseName, type) {
    try {
        const jobsForBase = fetchBaseJobs(baseName)
        // return (jobsForBase && jobsForBase[type]) ? jobsForBase[type] : {}
        return jobsForBase[type]
    } catch (e) {
        console.log('Error: could not find Jobs for Type.', e.stack)
    }
}
module.exports.fetchTypeJobs = fetchTypeJobs
function fetchParentJobs (base, type, parentId) {
    try {
        const jobsForType = fetchTypeJobs(base, type)

        return jobsForType[parentId]
        // return (jobsForType && jobsForType[parentId]) ? jobsForType[parentId] : []
    } catch (e) {
        console.log('Error: could not find Jobs for Parent. ', e.stack)
    }
}
module.exports.fetchParentJobs = fetchParentJobs
function fetchJobForName (name, job) {
    try {
        return fetchParentJobs(job.base, job.type, job.parentId).find(pj => pj.reserver === name)
        // return Memory.bases[job.base].jobs[job.type][job.parentId].find(j => j.reserver === name)
    } catch (e) {
        console.log('Error: could not find jobs creep. should we release job and amnesia creep?', e.stack)
    }
}
module.exports.fetchJobForName = fetchJobForName
/**
 *
 * Harvest Jobs: try to fill slots of source. default drop off is spawn, but can use diff strats:
 * ['Simple', 'Miner & Courier', 'Creep Chain']
 *
 * build Jobs: try to maximize build speed based on resources and dist
 */

// module.exports.addRequest = function (manifest, type, request) {
// const VALID_JOB_TYPES = ['harvest', 'build', 'upgrade', 'transport']
module.exports.submitJob = function (job) {
    let newJob = job
    job.time = Game.time
    job.priority = job.priority ?? .2
    job.reserved = !!job.creep

    if (!Memory.bases[job.base].jobs[job.type]) {
        Memory.bases[job.base].jobs[job.type] = { // new job type for base. add object, parent, and newJob
            [job.parentId]: [newJob]
        }
    } else {
        if (Memory.bases[job.base].jobs[job.type][job.parentId]) {
            Memory.bases[job.base].jobs[job.type][job.parentId].push(newJob) // parent has submitted jobs before. push new submission
        } else {
            Memory.bases[job.base].jobs[job.type][job.parentId] = [newJob] // parent never submitted job. add parent and add array of submissions
        }
    }
}

function saveJob (job) {
    if (Memory.bases[job.base]) {
        if (Memory.bases[job.base].jobs[job.type]) {
            if (Memory.bases[job.base].jobs[job.type][job.parentId]) {
                let jobIndex = Memory.bases[job.base].jobs[job.type][job.parentId].findIndex( j => j.reserver === job.reserver)
                if (jobIndex >= 0) {
                    Memory.bases[job.base].jobs[job.type][job.parentId][jobIndex]
                    return true
                }
            } else {
                console.log('Couldnt find parent in base jobs', JSON.stringify(job))
            }
        } else {
            console.log('Couldnt find job type in base', JSON.stringify(job))
        }
    } else {
        console.log('Couldnt find job base', JSON.stringify(job))
    }
    return false
}
function releaseJob (job) {
    if (Memory.bases[job.base]) {
        if (Memory.bases[job.base].jobs[job.type]) {
            if (Memory.bases[job.base].jobs[job.type][job.parentId]) {
                let jobIndex = Memory.bases[job.base].jobs[job.type][job.parentId].findIndex( j => j.reserver === job.reserver)
                if (jobIndex >= 0) {
                    job.reserved = false
                    job.reserver = null
                    job.opened = Game.time
                    return true
                }
            } else {
                console.log('Couldnt find parent in base jobs', JSON.stringify(job))
            }
        } else {
            console.log('Couldnt find job type in base', JSON.stringify(job))
        }
    } else {
        console.log('Couldnt find job base', JSON.stringify(job))
    }

    // return saveJob(job)
}
module.exports.releaseJob = releaseJob

/**
 * Reserves a job and saves it. job is returned
 * @param job
 * @param reserver
 * @return {*}
 */
function reserveJob (job, reserver) {
    job.reserved = true
    job.reserver = reserver
    return saveJob(job)
}
module.exports.reserveJob = reserveJob

module.exports.setCreepJob = function (creep, job) {
    if (creep.memory.job) {
        // release old job
        releaseJob(creep.memory.job)
    }
    if (!job.base) {
        job.base = creep.memory.base
    }
    reserveJob(job, creep.name)
    creep.memory.job = {type: job.type, parentId: job.parentId, base: job.base}
}

/**
 *  for reserver id and job types, finds matching unreserved job and returns it.
 * @param creep
 * @param jobTypes - the jobs you want to search
 * @return {*} // returns the reserved job
 */
module.exports.findJob = function (creep, jobTypes) {
    let baseJobs = Memory.bases[creep.memory.base].jobs
    let newJob
    jobTypes.some(type => {
        const jobsForType = baseJobs[type]
        switch (type) {
            case 'harvest':
                return Memory.bases[creep.memory.base].sources.some(s => {
                    return fetchParentJobs(creep.memory.base, 'harvest', s.id).some(job => {
                        if (!job.reserved) {
                            newJob = job
                            return true
                        }
                    })
                })
            default:
                return Object.keys(jobsForType).some(parentId => { // get job in any order
                    return jobsForType[parentId].some(job => {
                        if (!job.reserved) {
                            newJob = job
                            return true
                        }
                    })
                })
        }
    })
    return newJob
}
