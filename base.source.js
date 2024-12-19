const {getSourcesForPos} = require('./utils.cartographer')
const {addJobToBase, mineAndCarryPlan} = require('./operation.job')


module.exports.addTrgSources = function (base, trgId) {
  try {
    let sources = base.sourcePaths[trgId]
    if (sources) {
      return sources
    } else {
      let trgObj = Game.getObjectById(trgId)
      const res = getSourcesForPos(trgObj, base.sources)
      Memory.bases[base.name].sourcePaths[trgId] = res
      return res
    }
  } catch (e) {
    console.log('Error: addTrgSources(', base.name, trgId, ')', e.stack)
  }
}
//   BODYPART_COST: {
//        "move": 50,
//       "work": 100,
//       "attack": 80,
//       "carry": 50,
//       "heal": 250,
//       "ranged_attack": 150,
//       "tough": 10,
//       "claim": 600
// },

// function makeSimpleHarvestJob (dist, srcId, baseName, max, cost, valuePerCreep) {
//   return {
//     group: 'main',
//     cat: 'mine',
//     threat: 0,
//     dist: dist, //path.length,
//     steps: [
//       {id: srcId, type: 'src', action: ['harvest']},
//       // {id: source.id, type: 'src', action: ['harvest']},
//       {id: baseName, type: 'base', action: ['transfer', 'drop']}
//       // {id: base.name, type: 'base', action: ['transfer', 'drop']}
//     ],
//     max: max,
//     creeps: [],
//     cost: cost,
//     value: valuePerCreep,
//     plan: [WORK, CARRY, CARRY, MOVE, MOVE],
//     reqs: { parts: [WORK, CARRY, MOVE] }
//   }
// }
function simpleCreepPlanROI (slots, dist, plan, srcId ) {
  let partCounts = {}
  let creepCost = 0
  plan.forEach(part => {
    if (!partCounts[part]) {
      partCounts[part] = 1
    } else {
      partCounts[part] += 1 // add part counts to role counts
    }
    creepCost += BODYPART_COST[part]
  })

  let weight = plan.length - partCounts[MOVE]
  let ticksPerSpaceTo = Math.ceil((weight - partCounts[CARRY]) / partCounts[MOVE])
  let ticksPerSpaceFrom = Math.ceil(weight / partCounts[MOVE])
  let loadSize = partCounts[CARRY] * 50
  let ticksTo = dist * ticksPerSpaceTo
  let ticksFrom = dist * ticksPerSpaceFrom
  let mineTicks = Math.ceil(loadSize / (partCounts[WORK] * 2))
  let loadTicks = ticksTo + mineTicks + ticksFrom
  let revPerTick = loadSize / loadTicks
  let creepsPerSlot = loadTicks / mineTicks
  let maxCreeps = Math.floor(slots * creepsPerSlot) // final ans
  let valuePerCreep = revPerTick - (creepCost / 1500)
  // if (srcId === '9749d1c8af1421df1bd460b9' && partCounts[MOVE] === 2 && partCounts[CARRY] === 2) {
  //   console.log('weight', weight)
  //   console.log('srcId', srcId)
  //   console.log('dist', dist)
  //   console.log('plan', JSON.stringify(plan))
  //   console.log('ticksPerSpaceTo', ticksPerSpaceTo)
  //   console.log('ticksPerSpaceFrom', ticksPerSpaceFrom)
  //   console.log('loadSize',loadSize)
  //   console.log('ticksTo', ticksTo)
  //   console.log('ticksFrom', ticksFrom)
  //   console.log('mineTicks', mineTicks)
  //   console.log('loadTicks', loadTicks)
  //   console.log('revPerTick', revPerTick)
  //   console.log('creepsPerSlot', creepsPerSlot)
  //   console.log('maxCreeps', maxCreeps)
  //   console.log('valuePerCreep', valuePerCreep)
  //   console.log('creepCost', creepCost)
  //   console.log('partCounts', JSON.stringify(partCounts))
  // }
  return {
    valuePerCreep,
    creepsPerSlot,
    maxCreeps,
    totalValue: maxCreeps * valuePerCreep,
    creepCost: creepCost,
    dist: dist,

    weight,
    ticksPerSpaceTo,
    ticksPerSpaceFrom,
    loadSize,
    ticksTo,
    ticksFrom,
    mineTicks,
    loadTicks,
    revPerTick,
    // creepsPerSlot,
    // maxCreeps,
    partCounts

  }
}
function simpleSourcePlan (base, source) {
  let src = Game.getObjectById(source.id)
  const spawnId = base.structures[STRUCTURE_SPAWN][0]
  const spawn = Game.getObjectById(spawnId)
  let path = src.pos.findPathTo(spawn)
  const dist = path.length

  if (spawn.room.energyCapacityAvailable === 300) { // Hard coded plan for energy cap = 300
    const slots = source.slots.length
    const loadTicks = 50 + (3 * dist)
    const creepsPerSlot = loadTicks / 50
    const valuePerCreep = (100 / loadTicks) - .2
    const max = Math.floor(slots * creepsPerSlot)
    return [
      {
        group: 'main',
        cat: 'mine',
        dist: path.length,
        steps: [
          {id: source.id, type: 'src', action: ['harvest']},
          {id: base.name, type: 'base', action: ['transfer', 'drop']}
        ],
        max: max,
        creeps: [],
        cost: 300,
        value: valuePerCreep,
        plan: [WORK, CARRY, CARRY, MOVE, MOVE],
        reqs: { parts: [WORK, CARRY, MOVE] }
      }
    ]
  }


  // console.log('path logggg', JSON.stringify(path))
  const simplePlans = [
    [WORK, CARRY, MOVE],
    [WORK, CARRY, CARRY, MOVE],
    [WORK, CARRY, CARRY, MOVE, MOVE],
    [WORK, CARRY, CARRY, CARRY, MOVE],
    [WORK, WORK, CARRY, MOVE]
  ]
  let bestPlanIndex = 0
  let bestPlanROI = {valuePerCreep: 0, creepsPerSlot: 0, maxCreeps: 0, totalValue: 0}
  simplePlans.forEach((p, i) => {
    const planROI = simpleCreepPlanROI(source.slots.length, dist, p, source.id)
    // console.log('planROI', source.id, JSON.stringify(planROI), JSON.stringify(p))
    if (planROI.valuePerCreep > bestPlanROI.valuePerCreep) {
      bestPlanIndex = i
      bestPlanROI = planROI
    }
  })
  return [
    {
      group: 'main',
      cat: 'mine',
      dist: path.length,
      steps: [
        {id: source.id, type: 'src', action: ['harvest']},
        {id: base.name, type: 'base', action: ['transfer', 'drop']}
        // {id: base.name, type: 'base', action: ['transfer', 'build', 'upgrade']}
      ],
      max: bestPlanROI.maxCreeps,
      creeps: [],
      cost: bestPlanROI.creepCost,
      value: bestPlanROI.valuePerCreep,
      plan: simplePlans[bestPlanIndex],
      reqs: { parts: [WORK, CARRY, MOVE] },
      ROI: {
        ...bestPlanROI
      }
    }
  ]
}
function calcMineTransROI (plan, dist, slots) {
  let maxRevenuePerTick = 10
  if (slots === 1) {
    // maxRevenuePerTick is probably capped by maxAvailableEnergy and should be adjusted
    maxRevenuePerTick = 6 // based off 600 avaialble energy
  }
  let containerDistFromSrc = 1
  const minerROI = {
    dist: 0,
    cost: 300, // something like WCCMM
  }


}

function planSource (base, source, containerized = false) {
  if (containerized) {
    return mineAndCarryPlan(base, source) // only simple source plan supported right now
  } else {
    return simpleSourcePlan(base, source) // only simple source plan supported right now
  }
}


module.exports.run = function (base, manifest) {
  try {
    base.sources = base.sources.map((s,i) => {

      if (!s.jobs) {
        s.jobs = []
      }
      if (!s.jobs.length || !s.jobs.some(jobId => base.jobs[jobId].group === 'main')) { // No Source PLan! init main source plan
        let jobs = planSource(base, s)
        let newJobIndex = 1
        jobs.forEach(job => {
          while (base.jobs['' + newJobIndex]) {
            newJobIndex++
          }
          job.id = '' + newJobIndex
          base = addJobToBase(base, job) // add to base, queue, etc.
          s.jobs.push(job.id) // add to source job list
        })
      } else {
        // jobs exist. clean them
        if (Game.time % 10 === 0) { // cleanup every 10 ticks
          // base.sources[i].jobs = s.jobs.filter(j => !!base.jobs[j]) // remove my jobs that dont exist in base
        }
        if (!s.operation && s.jobs.length === 1 && base.jobs[s.jobs[0]].dist > 10 && !base.jobs[s.jobs[0]].threat) {
          // let operation = mineAndCarryPlan(base, s)
          // base.sources[i].operation = operation
        }
        if (s.operation) { //running operation
          console.log('')
          const operation = base.sources[i].operation
          const stageIndex = operation.stageIndex
          const stage = operation.stages[stageIndex]
          console.log('Running operation stageIndex', stageIndex, 'stage', JSON.stringify(stage))
          if (stage) {
            let stageJobs = stage.jobs
            stageJobs.forEach(job => {
              if (job && job.id && !base.jobs[job.id]) {
                console.log('would Have added stage', JSON.stringify(stage))
                console.log('would Have added job', JSON.stringify(job))
                console.log('would Have added base.sources[i]', JSON.stringify(base.sources[i]))
                addJobToBase(base, job) // add to base, queue, etc.
                base.sources[i].jobs.push(job.id)
                base.sources[i].operation
              } else {
                console.log('Are we ready for the next job?')
              }

            })
          }

        }

      }
      return s
    })
  } catch(e) {
    console.log('Error: failed to run base.source', e.stack)
  }
  // manage jobs

}

