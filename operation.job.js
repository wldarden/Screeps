const {deserializePos} = require('./utils.memory')

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

function addJobToBase(base, job) {
  base.jobs[job.id] = job // add to base job map
  //TODO - insert where it should be at first instead, not post sort like this
  base.queue[base.jobs[job.id].cat].push(job.id) // add to base job queue
  base.queue[base.jobs[job.id].cat] = base.queue[base.jobs[job.id].cat].sort((aId,bId) => {
    const a = base.jobs[aId]
    const b = base.jobs[bId]
    return b.value - a.value
  }) // sort base queue
  return base
}
module.exports.addJobToBase = addJobToBase
function getDestinations (room) {
  return room.find(FIND_STRUCTURES, {
    filter: (s) => {
      return (s.structureType == STRUCTURE_EXTENSION || s.structureType == STRUCTURE_SPAWN) &&
        s.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
    }
  });
}
function getStepGameEntityId (job, stepIndex) {
  let step = job.steps[stepIndex]
  switch (step.type) {
    case 'base':
      let base = Memory.bases[step.id]
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
