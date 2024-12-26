const {getUniqueName} = require('./utils.spawner')
const {hireCreep} = require('./operation.job')
// Body
// part	Build cost	Effect per one body part
// MOVE	50	Decreases fatigue by 2 points per tick.
//   WORK	100
//   Harvests 2 energy units from a source per tick.
//   Harvests 1 resource unit from a mineral or a deposit per tick.
//   Builds a structure for 5 energy units per tick.
//   Repairs a structure for 100 hits per tick consuming 1 energy unit per tick.
//   Dismantles a structure for 50 hits per tick returning 0.25 energy unit per tick.
//   Upgrades a controller for 1 energy unit per tick.
//
//   CARRY	50	Can contain up to 50 resource units.
//
//   ATTACK	80	Attacks another creep/structure with 30 hits per tick in a short-ranged attack.
//
//   RANGED_ATTACK	150
// Attacks another single creep/structure with 10 hits per tick in a long-range attack up to 3 squares long.
//
//   Attacks all hostile creeps/structures within 3 squares range with 1-4-10 hits (depending on the range).
//
// HEAL	250	Heals self or another creep restoring 12 hits per tick in short range or 4 hits per tick at a distance.
//   CLAIM	600
// Claims a neutral room controller.
//
//   Reserves a neutral room controller for 1 tick per body part.
//
//   Attacks a hostile room controller downgrading its timer by 300 ticks per body parts.
//
//   Attacks a neutral room controller reservation timer by 1 tick per body parts.
//
//   A creep with this body part will have a reduced life time of 600 ticks and cannot be renewed.
//
//   TOUGH	10	No effect, just additional hit points to the creep's body. Can be boosted to resist damage.

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

function getCatPriority (revenue) {
  if (revenue <= 2) {
    return ['mine']
  } else {
    return ['build', 'upgrade', 'mine']
  }
}

function isSafe (job) {
  return !job.threat
}

function isPossible (job, room) {
  return job.cost <= room.energyAvailable
}

function isCostEffective (job, revenue) {
  if (job.value > 0) { // job is already positive, so do sure
    return true
  } else if (job.cat === 'build') {
    const newRevenue = revenue + job.value
    return newRevenue >= -5
  } else {
    const newRevenue = revenue + job.value
    return newRevenue >= 2
  }
}

module.exports.run = function (base, manifest) {
  let room = Game.rooms[base.name]
  let controller = room.controller

  // addEnergyRequest(base, base.structures[STRUCTURE_SPAWN])

  let revenue = 0
  let upgradeJobInfo = 0
  let buildingJobInfo = 0
  Object.keys(base.jobs).forEach(jobId => {
    revenue = revenue + ((base.jobs[jobId].value ?? 0) * base.jobs[jobId].creeps.length)
  })

  base.rev = revenue
  if (Game.time % 10 === 0) {
    if (base.revHistory) {
      if (base.revHistory[base.revHistory.length - 1] !== revenue) {
        base.revHistory.push(revenue)
      }
    } else {
      base.revHistory = [revenue]
    }
  }


  const cats = getCatPriority(revenue)

  const completedQueueCheck = cats.some((cat) => {
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
          return base.priority.spawn.slice(0,1).some(jobId => {
            let job = base.jobs[jobId]
            if (job && job.cost <= room.energyAvailable) {
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
  // console.log('completed queue check: ', completedQueueCheck)
}
