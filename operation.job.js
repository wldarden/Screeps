
// module.exxports.getJobUnid = function (base, job) {
//     let newJobIndex = 0
//     let newJobId
//     while (base.jobs[newJobIndex]) {
//         newJobIndex++
//     }
//     job.id = newJobIndex
// }
//
// module.exports.submitJob = function (base, jobs) {
//     if (!Array.isArray(jobs)) {
//         jobs = [jobs]
//     }
//     let newJobIndex = 0
//     let newJobIds = []
//     jobs.forEach(j => {
//         while (base.jobs[newJobIndex]) {
//             newJobIndex++
//         }
//         j.id = newJobIndex
//         console.log('submitting Job id: ', newJobIndex, JSON.stringify(j))
//         base.jobs['' + newJobIndex] = j
//         newJobIds.push(newJobIndex)
//     })
//     return newJobIds
// }

function getStep(job, i) {
  let step = job.steps[i]
  if (!step) {
    console.log('Error: creep was on step index outside steps length')
    i = 0
  }
  return i
}
function getCreepStep(creep, job) {
  let index = getStep(job, creep.memory.step)
  creep.memory.step = index
  return job.steps[index]
}
module.exports.getCreepStep = getCreepStep
function hireCreep (base, creepName, jobId) {
  if (jobId !== undefined && !base.jobs[jobId].creeps.some(jcId => jcId === creepName)) {
    base.jobs[jobId].creeps.push(creepName)
    if (!base.jobs[jobId].max || base.jobs[jobId].creeps.length >= base.jobs[jobId].max) { // job full. remove from queue
      base.queue[base.jobs[jobId].cat] = base.queue[base.jobs[jobId].cat].filter(qId => qId !== jobId)
    }
    Game.creeps[creepName].memory.jobId = jobId
    return true
  }
  return false
}
module.exports.hireCreep = hireCreep

function completeJob (base, jobId) {
  if (jobId !== undefined && base.jobs[jobId]) {
    base.queue[base.jobs[jobId].cat] = base.queue[base.jobs[jobId].cat].filter(jId => jId !== jobId)
    delete base.jobs[jobId]
  }
}
module.exports.completeJob = completeJob
function fireCreep (base, creepName, jobId) {
  if (jobId !== undefined) {
    const reQueue = base.jobs[jobId].creeps.length === base.jobs[jobId].max
    base.jobs[jobId].creeps = base.jobs[jobId].creeps.filter(id => id !== creepName) // remove creep from job
    if (reQueue) { // job was at max, and is now less than max, and will need a worker. reQueue
      addJobToBase(base, base.jobs[jobId]) // put job in queue if needed, save new job creeps
    }
  }
}
module.exports.fireCreep = fireCreep
function addJobToBase(base, job, sort = true) {
  base.jobs[job.id] = job // add to base job map
  //TODO - insert where it should be at first instead, not post sort like this
  if (!base.queue[base.jobs[job.id].cat]) { // cat didnt exist. make it, add job.
    base.queue[base.jobs[job.id].cat] = [job.id]
  } else if (
    base.jobs[job.id].creeps.length < base.jobs[job.id].max && // job has openeings
    !base.queue[base.jobs[job.id].cat].some(jId => jId === job.id) // job not in queue
  ) {
    base.queue[base.jobs[job.id].cat].push(job.id) // add to base job queue
    if (sort) {
      base.queue[base.jobs[job.id].cat] = base.queue[base.jobs[job.id].cat].sort((aId,bId) => {
        const a = base.jobs[aId]
        const b = base.jobs[bId]
        return b.value - a.value
      }) // sort base queue
    }
  }
  return base
}
module.exports.addJobToBase = addJobToBase
function getDestinations (room) {
  return room.find(FIND_STRUCTURES, {
    filter: (s) => {
      return (s.structureType == STRUCTURE_EXTENSION || s.structureType == STRUCTURE_SPAWN || s.structureType == STRUCTURE_CONTAINER) &&
        s.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
    }
  });
}
function getStepGameEntityId (job, stepIndex) {
  let step = job.steps[stepIndex]
  switch (step.type) {
    case 'base':
      let base = Memory.bases[step.id]
      let room = Game.rooms[base.room]
      return getDestinations(room)[0]
      // TODO - memoize or something
      return base.structures[STRUCTURE_SPAWN][0]// getDestinations(Game.rooms[step.id]) //base.structures[STRUCTURE_SPAWN][0]
      // return Memory.bases[step.id]
    case 'src':
      return step.id
  }
}
module.exports.getStepGameEntityId = getStepGameEntityId

function getStepEntity (job, stepIndex) {
    // {id: null|'', type: 'base'|'src'|'creep', action: 'harvest'}
    let step = job.steps[stepIndex]
    switch (step.type) {
        case 'base':
            return Memory.bases[step.id]
        case 'src':
            return Game.getObjectById(step.id)
    }
}

// function getProximateStepPosition (job, stepIndex) {
//     let step = job.steps[stepIndex]
//     switch (step.type) {
//         case 'base':
//             const base = getStepEntity(job, stepIndex)
//             const spawnId = base.structures[STRUCTURE_SPAWN][0]
//             const spawn = Game.getObjectById(spawnId)
//             return spawn.pos
//         case 'src':
//             const src = getStepEntity(job, stepIndex)
//             return src.pos
//         case 'pos':
//             return deserializePos(step.id)
//     }
// }
// function getJobCat (job) {
//     if (job.cat) {
//         return job.cat
//     } else {
//         switch (job.steps[0].action) {
//             case 'harvest':
//                 return 'mine'
//             case 'transfer':
//                 return 'trans'
//             case 'pickup':
//                 switch (job.steps[1].action) {
//                     case 'build':
//                         return 'build'
//                     case 'upgrade':
//                         return 'upgrade'
//                     case 'drop':
//                     case 'transfer':
//                     default:
//                         return 'trans'
//                 }
//         }
//     }
// }
// function expectedJobValue (baseName, job) {
//     let cat = getJobCat(job)
//     switch (cat) {
//         case 'mine':
//           let src = getProximateStepPosition(job, 0)
//           let dest = getProximateStepPosition(job, 1)
//           let dist = src.findPathTo(dest).length
//           // L/D * (C / (1 + (C /M)) = energy per tick of carrier
//             return (25/dist)
//         default:
//             return .5
//     }
// }
// module.exports.expectedJobValue = expectedJobValue
