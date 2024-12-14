const {onDestroyCommon} = require('./utils.creep')
const {findJob, reserveJob, setCreepJob} = require('./operation.job')
const {runJob} = require('./utils.jobs')

const CORE_PARTS = [WORK, CARRY, MOVE, MOVE]; //250
const REPEAT_PARTS = [];

module.exports.buildCreep = function (maxEnergy) {
  return CORE_PARTS
}

module.exports.onCreate = function(name) {
}

module.exports.onDestroy = function(name) {
  onDestroyCommon(name)
}

module.exports.buildCreep = function (maxEnergy) {
  return CORE_PARTS
}

// const jobRunners = {
//   harvest: {runner: require('job.harvest')}
// }
// function runJob (creep, job) {
//   let job = Memory.jobs[job.type][job.id
//   jobRunners[job.type].run(job, creep)
//   // run job.
//   switch (creep.memory.action) {
//     case 'harvest':
//     // go to job target
//
//   }
// }


const JOB_PROFICIENCIES = ['harvest', 'upgrade', 'build']

module.exports.run = function (creep, manifest) {
  try {
    if (creep.spawning) {
      return
    }

    if (!creep.memory.job) {
      let newJob = findJob(creep, JOB_PROFICIENCIES)
      if (reserveJob(newJob, creep.name)) {
        setCreepJob(creep, {type: newJob.type, id: newJob.id})
      }
    }

    if (creep.memory.job) {
      runJob(creep)
      // run job.
    }

    // if (creep.memory.status === 'init' && !creep.memory.target) { // TODO - add some time check here every so often
    //   validatePriorityTarget(creep)
    //   creep.memory.status = 'empty'
    // }
    // if (creep.store.getUsedCapacity() === 0) {
    //   creep.memory.status = 'empty'
    // }
    // // we have a target, and a srcTrg.
    // if (creep.memory.status === 'full') { // trying to distribute energy
    //   if (!creep.memory.target) { // TODO - add some time check here every so often
    //     validatePriorityTarget(creep)
    //   }
    //   // go to target
    //   switch (doAction(creep)) {
    //     case OK:
    //       if (creep.memory.status === 'empty') {
    //         validatePriorityTarget(creep)
    //         validatePrioritySrc(creep)
    //       }
    //       break
    //   }
    // } else {
    //   harvest(creep)
    // }

  } catch(e) {
    console.log('Error running creep: ', creep?.name, e.stack)
  }
}


