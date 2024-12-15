const {getUniqueName} = require('./utils.spawner')
const {hireCreep} = require('./operation.job')

function doSpawn (base, spawn, plan, name, mem) {
  let res = spawn.spawnCreep(plan, name, mem)
  if (res === OK) {
    base.creeps.push(name)
    let jobId = mem.memory.jobId
    hireCreep(base, name, jobId)
    return true
  } else {
    return false
  }
}

function getCatPriority () {
  return ['build', 'upgrade', 'mine']
}

module.exports.run = function (base, manifest) {
  let room = Game.rooms[base.name]
  let controller = room.controller

  const cats = getCatPriority()
  cats.forEach((cat) => {
    let queue = base.queue[cat]
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
            if (job.threat > 0 || job.cost > room.energyAvailable) {
              return false // job is dangerous, or too expensive. ignore
            } else {
              let plan = job.plan
              let name = getUniqueName(base.name)
              const newMemory = {
                action: 'idle',
                jobId: job.id,
                step: 0,
                base: base.name,
                plan: plan
              }
              return doSpawn(base, spawn, plan, name, {memory: newMemory})
            }
          })
        }
      })
    }
  })
}
