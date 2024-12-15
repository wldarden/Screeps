const {getSourcesForPos} = require('./utils.cartographer')
const {submitJob} = require('./operation.job')


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
  let valuePerCreep = revPerTick - (2 / 15)
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
    dist: dist
  }
}
function simpleSourcePlan (base, source) {
  let src = Game.getObjectById(source.id)
  const spawnId = base.structures[STRUCTURE_SPAWN][0]
  const spawn = Game.getObjectById(spawnId)
  let path = src.pos.findPathTo(spawn)
  let dist = path.length
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
      threat: 0,
      steps: [
        {id: source.id, type: 'src', action: ['harvest']},
        {id: base.name, type: 'base', action: ['transfer']}
        // {id: base.name, type: 'base', action: ['transfer', 'build', 'upgrade']}
      ],
      max: bestPlanROI.maxCreeps,
      creeps: [],
      cost: bestPlanROI.creepCost,
      value: bestPlanROI.valuePerCreep,
      plan: simplePlans[bestPlanIndex],
      reqs: { parts: [WORK, CARRY, MOVE] }
    }
  ]
}

function planSource (base, source) {
  return simpleSourcePlan(base, source) // only simple source plan supported right now
}

module.exports.run = function (base, manifest) {
  try {
    base.sources = base.sources.map((s,i) => {
      if (!s.jobs) {
        s.jobs = []
      }
      planSource(base, s)
      if (!s.jobs.length || !s.jobs.some(jobId => base.jobs[jobId].group === 'main')) { // No Source PLan! init main source plan
        let jobs = planSource(base, s)
        // console.log('plan logggg', JSON.stringify(jobs))
        // let newJobIds = submitJob(base.name, jobs)
        let newJobIndex = 1
        jobs.forEach(job => {
          while (base.jobs['' + newJobIndex]) {
            newJobIndex++
          }
          job.id = newJobIndex
          base.jobs['' + newJobIndex] = job
          s.jobs.push(job.id)
        })
      }
      return s
    })
  } catch(e) {
    console.log('Error: failed to run base.source', e.stack)
  }
  // manage jobs

}
