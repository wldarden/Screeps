const {getUniqueName} = require('./utils.spawner')


module.exports.run = function (base, manifest) {
  let room = Game.rooms[base.name]
  let controller = room.controller

  // addResourceRequests(base)

  //Get open jobs
  let openJobs = []
  for (let jobId in base.jobs) {
    let job = base.jobs[jobId]
    if (job.creeps.length < job.max) {
      openJobs.push(base.jobs[jobId]) // this job has open positions
    }
  }
  openJobs = openJobs.sort((a,b) => { b.value - a.value})
  // now have ordered job list needing workers, do spawns:
  if (openJobs.length && room.energyAvailable) {
    let spawns = base.structures[STRUCTURE_SPAWN]
    return spawns.some(s => {
      let spawn = Game.getObjectById(s)
      if (spawn.spawning) {
        return false
      } else {
        return openJobs.some(job => {
          if (job.cost <= room.energyAvailable) {
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
              return true
            } else {
              return false
            }
          }
        })
      }
    })
  }
}
