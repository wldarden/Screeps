

module.exports.JOB_TYPES = {
    harvest: {name: 'Harvest Job'},
    // build: {},
    // upgrade: {},
    // transport: {}
}

// const sample_job = {
//     type: 'string', // 'harvest' | 'build' | 'upgrade' | 'transport'
//     id: 'string', // 'uniqueId. default ${type}_${job.base}_${job.role}',
//     time: 0, //'??? calculated. submitted Game.time',
//     roles: ['peon', 'builder', 'harvester', 'etc'], // 'Roles that can take this job',
//     reserved: false, // job is being worked
//     reserver: 'id',
//     priority: 0-1,
// }


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
    // give type as arg!!!!!!
    // const job = {
    //     id: 'uniqueId. default ${type}_${job.base}_${job.role}',
    //     time: '??? calculated. submitted Game.time',
    //     roles: ['peon', 'builder', 'etc], // 'Roles that can take this job',
    //     reserved: false, // job is being worked
    //     priority: 0-1
    // }
    // job.id = job.id ? job.id : `${job.type}_${job.base}_${job.role}`




    // if (!Memory.jobs[job.type].some(r => r.id === job.id)) {
    //     console.log('Submitted ', job.type,' Request at ', Game.time,': ', JSON.stringify(job))
    //     job.time = Game.time
    //     job.priority = job.priority ?? .2
    //     job.reserved = !!job.creep
    //     Memory.jobs[job.type].push(job)
    // }
    //
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

    // if (!Memory.jobs[job.type][job.id]) {
    //     console.log('Submitted ', job.type,' Request at ', Game.time,': ', JSON.stringify(job))
    //     job.time = Game.time
    //     job.priority = job.priority ?? .2
    //     job.reserved = !!job.creep
    //     Memory.jobs[job.type][job.id] = job
    // }
}

function saveJob (job) {
    if (job) {
        // if (typeof job === 'string') {
        //
        // } else if (job.type) {
        Memory.jobs[job.type][job.id] = job
        return job

        // let index = Memory.jobs[job.type].findIndex(j => j.id === job.id)
        // if (index >= 0) {
        //     Memory.jobs[job.type][index] = job
        //     return job
        // } else {
        //     console.log('failed to reserve job: ', job.id, JSON.stringify(job))
        // }
        // } else if (job.id) {
        //     for (let type in Memory.jobs[job.type])
        // }
    }
}
function releaseJob (job) {
    if (Memory.jobs[job.type][job.id]) {
        Memory.jobs[job.type][job.id].reserved = false
        Memory.jobs[job.type][job.id].reserver = null
        return true
    } else {
        return false
    }

}
module.exports.releaseJob = releaseJob

/**
 * Reserves a job and saves it. job is returned
 * @param job
 * @param reserver
 * @return {*}
 */
function reserveJob (job, reserver) {
    if (job && Memory.jobs[job.type][job.id]) {
        Memory.jobs[job.type][job.id].reserved = true
        Memory.jobs[job.type][job.id].reserver = reserver
        return true
    } else {
        return false
    }
}
module.exports.reserveJob = reserveJob

module.exports.setCreepJob = function (creep, job) {
    if (creep.memory.job) {
        // release old job
        releaseJob(creep.memory.job)
    }
    reserveJob(job, creep.name)
    creep.memory.job = job
}

/**
 *  for reserver id and job types, finds matching unreserved job and returns it.
 * @param creep
 * @param jobTypes
 * @return {*} // returns the reserved job
 */
module.exports.findJob = function (creep, jobTypes) {
    let jobs = Memory.jobs
    let newJob
    jobTypes.some(type => {
        if (jobs[type]) {
            return Object.keys(jobs[type]).some(jobId => {
                let job = jobs[type][jobId]
                if (!job.reserved) {
                    newJob = job
                    return true
                }
            })
        }
        // if (jobs[type] && jobs[type].length) {
        //     newJob = jobs[type].find(j => !j.reserved)
        //     // newJob = jobs[type].find(j => !j.reserved && jobs.roles.includes(creep.role))
        //     if (newJob) {
        //         // newJob = newJob // reserveJob(newJob, creep)
        //         return true
        //     }
        //     // let newJobIndex = jobs[type].findIndex(j => !j.reserved)
        //     // if (newJobIndex >= 0) {
        //     //     Memory.jobs[type][newJobIndex].reserved = true
        //     //     Memory.jobs[type][newJobIndex].creep = creep.name
        //     //     newJob = Memory.jobs[type][newJobIndex]
        //     //     // reserveJob(newJobIndex, creep)
        //     //     return true
        //     // }
        // }
    })
    return newJob
}
