const {getUniqueName} = require('./utils.spawner')


module.exports.run = function (base, manifest) {
  let room = Game.rooms[base.name]
  let controller = room.controller

  const cats = ['build', 'upgrade', 'mine']
  cats.forEach((cat) => {
    let queueName = cat
    let queue = base.queue[queueName]
    if (queue.length && room.energyAvailable > 200) {
      let openJobs = queue.map(jobId => base.jobs[jobId])
      // openJobs = openJobs.sort((a,b) => { b.value - a.value})
      let spawns = base.structures[STRUCTURE_SPAWN]
      return spawns.some(s => {
        let spawn = Game.getObjectById(s)
        if (spawn.spawning) {
          return false
        } else {
          return openJobs.some(job => {
            if (job.cost <= room.energyAvailable && job.steps[0].id !== '8b1c14d2643b15377abe2d1d') {
              let plan = job.plan
              let name = getUniqueName(base.name)
              const newMemory = {
                name: name,
                action: 'idle',
                jobId: job.id,
                step: 0,
                base: base.name,
                plan: plan
              }
              let res = spawn.spawnCreep(plan, name, {memory: newMemory})
              if (!res) {
                base.jobs[job.id].creeps.push(name)
                if (!base.jobs[job.id].max || base.jobs[job.id].creeps.length >= base.jobs[job.id].max) { // job full. remove from queue
                  base.queue.mine = base.queue.mine.filter(qId => qId !== job.id)
                }
                return true
              } else {
                return false
              }
            }
          })
        }
      })
    }
  })
  // let queueName = 'upgrade'
  // let queue = base.queue[queueName]
  // if (queue.length && room.energyAvailable > 200) {
  //   let openJobs = queue.map(jobId => base.jobs[jobId])
  //   // openJobs = openJobs.sort((a,b) => { b.value - a.value})
  //   let spawns = base.structures[STRUCTURE_SPAWN]
  //   return spawns.some(s => {
  //     let spawn = Game.getObjectById(s)
  //     if (spawn.spawning) {
  //       return false
  //     } else {
  //       return openJobs.some(job => {
  //         if (job.cost <= room.energyAvailable) {
  //           let plan = job.plan
  //           let name = getUniqueName(base.name)
  //           const newMemory = {
  //             name: name,
  //             action: 'idle',
  //             jobId: job.id,
  //             step: 0,
  //             base: base.name,
  //             plan: plan
  //           }
  //           let res = spawn.spawnCreep(plan, name, {memory: newMemory})
  //           if (!res) {
  //             base.jobs[job.id].creeps.push(name)
  //             if (!base.jobs[job.id].max || base.jobs[job.id].creeps.length >= base.jobs[job.id].max) { // job full. remove from queue
  //               base.queue.mine = base.queue.mine.filter(qId => qId !== job.id)
  //             }
  //             return true
  //           } else {
  //             return false
  //           }
  //         }
  //       })
  //     }
  //   })
  // }



  // HARVEST JOBS:
  // let openHarvestJobIds = base.queue.mine
  // //Get open jobs
  // let openHarvestJobs = []
  // for (let jobId in openHarvestJobIds) {
  //   // let job = base.jobs[jobId]
  //   // if (job.creeps.length < job.max) { // job.steps[0].id !== '3403d9172361f31acc304efa'
  //   //   openHarvestJobs.push(base.jobs[jobId]) // this job has open positions
  //   // }
  //   openHarvestJobs.push(base.jobs[jobId])
  // }
  // if (openHarvestJobIds.length !== openHarvestJobs.length) { // some queue job wasnt open. remove from queue
  //   base.queue.mine = openHarvestJobIds.filter(qId => openHarvestJobs.some(oj => oj.id === qId))
  // }
  // openHarvestJobs = openHarvestJobs.sort((a,b) => { b.value - a.value})
  // now have ordered job list needing workers, do spawns:
  // if (base.queue.mine.length && room.energyAvailable > 200) {
  //   let openHarvestJobIds = base.queue.mine
  //   let openHarvestJobs = openHarvestJobIds.map(jobId => base.jobs[jobId])
  //   // openHarvestJobs = openHarvestJobs.sort((a,b) => { b.value - a.value})
  //   let spawns = base.structures[STRUCTURE_SPAWN]
  //   return spawns.some(s => {
  //     let spawn = Game.getObjectById(s)
  //     if (spawn.spawning) {
  //       return false
  //     } else {
  //       return openHarvestJobs.some(job => {
  //         if (job.cost <= room.energyAvailable && job.steps[0].id !== '8b1c14d2643b15377abe2d1d') {
  //           let plan = job.plan
  //           let name = getUniqueName(base.name)
  //           const newMemory = {
  //             name: name,
  //             action: 'idle',
  //             jobId: job.id,
  //             step: 0,
  //             base: base.name,
  //             plan: plan
  //           }
  //           let res = spawn.spawnCreep(plan, name, {memory: newMemory})
  //           if (!res) {
  //             base.jobs[job.id].creeps.push(name)
  //             if (base.jobs[job.id].creeps.length >= base.jobs[job.id].max) { // job full. remove from queue
  //               base.queue.mine = base.queue.mine.filter(qId => qId !== job.id)
  //             }
  //             return true
  //           } else {
  //             return false
  //           }
  //         }
  //       })
  //     }
  //   })
  // }



}
