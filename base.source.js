// const {getSourcesForPos} = require('./utils.cartographer')
const {addJobToBase, mineAndCarryPlan, completeJob} = require('./operation.job')
const {calculateJobROI} = require('./utils.jobs')
const {deserializePos} = require('./utils.memory')

//
// module.exports.addTrgSources = function (base, trgId) {
//   try {
//     let sources = base.sourcePaths[trgId]
//     if (sources) {
//       return sources
//     } else {
//       let trgObj = Game.getObjectById(trgId)
//       const res = getSourcesForPos(trgObj, base.sources)
//       Memory.bases[base.name].sourcePaths[trgId] = res
//       return res
//     }
//   } catch (e) {
//     console.log('Error: addTrgSources(', base.name, trgId, ')', e.stack)
//   }
// }

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
  let path = src.pos.findPathTo(spawn, {ignoreCreeps: true})
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
    [WORK, CARRY, CARRY, MOVE, MOVE]
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

function initSimpleMine (base, src) {
  src.level = 0
  src.plan = 'simple'
  let jobs = simpleSourcePlan(base, src)
  let newJobIndex = 1
  jobs.forEach(job => {
    while (base.jobs['' + newJobIndex]) {
      newJobIndex++
    }
    job.id = '' + newJobIndex
    addJobToBase(base, job) // add to base, queue, etc.
    src.jobs.push(job.id) // add to source job list
  })
  delete src.initPlan
  return src
}

function initContainerMine (base, src) {
  src.level = 2 // increase level to not resubmit this job.
  src.plan = CONTAINER_MINE.name
  const operationId = `${CONTAINER_MINE.name}-${src.id}`
  const containerMinerSteps = [
    {id: src.id, type: 'src', action: ['harvest']},
    {id: src.containerId, type: 'obj', action: ['transfer']}, // TODO - Unsupported step type "Now"
  ]
  const minerPlan = [WORK, WORK, CARRY, MOVE]
  const minerROI = calculateJobROI(minerPlan, 1, containerMinerSteps, src.slots.length)
  const containerMiner = { // the miner that mines the src and brings energy to the container  (mines, deposits)
    group: operationId,
    cat: 'mine',
    id: `${operationId}-mine`,
    dist: 1,
    steps: containerMinerSteps,
    max: src.slots.length,
    creeps: [],
    cost: minerROI.cost,
    value: minerROI.value,
    plan: minerPlan
  }
  // let container = Game.getObjectById(src.containerId)
  // const spawnId = base.structures[STRUCTURE_SPAWN][0]
  // const spawn = Game.getObjectById(spawnId)
  // let path = container.pos.findPathTo(spawn, {ignoreCreeps: true})
  // const dist = path.length
  // console.log('Dist calc for mine trans job:', JSON.stringify(path))
  // const transferSteps = [
  //   {id: src.containerId, type: 'obj', action: ['withdraw']},
  //   {id: base.name, type: 'base', action: ['transfer']},
  // ]
  // const transferPlan = [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE]
  // const transferROI = calculateJobROI(transferPlan, dist, transferSteps, src.slots.length)
  // console.log('transferROI', JSON.stringify(transferROI))
  // const transferJob = { // the miner that mines the src and brings energy to the container  (mines, deposits)
  //   group: operationId,
  //   cat: 'mine',
  //   id: `${operationId}-transfer`,
  //   dist: transferROI.dist,
  //   steps: transferSteps,
  //   max: Math.max(transferROI.max, 5),
  //   creeps: [],
  //   cost: transferROI.cost,
  //   value: transferROI.value,
  //   plan: transferPlan,
  //   roi: transferROI
  // }

  addJobToBase(base, containerMiner) // add to base, queue, etc.
  src.jobs.push(containerMiner.id) // add to source job list
  // addJobToBase(base, transferJob) // add to base, queue, etc.
  // src.jobs.push(transferJob.id) // add to source job list
  completeJob(base, src.jobs[0])
  src.jobs = [
    containerMiner,
    // transferJob
  ]
  delete src.initPlan
  console.log('ContainerMine init!', src.id, JSON.stringify(src))
  console.log('ContainerMine init!', src.id, JSON.stringify(containerMiner))
  // console.log('ContainerMine init!', src.id, JSON.stringify(transferJob))
  return src
}
function initDropMine (base, src) {
  src.level = 1 // increase level to not resubmit this job.
  src.plan = DROP_MINE.name

  const slotsUsed = 2 // use up to 2 slots
  // base.jobs[src.jobs[0]].max = base.jobs[src.jobs[0]].max - slotsUsed // remove slots from original simple job

  const operationId = `${DROP_MINE.name}-${src.id}`
  // drop mine + build container
  const dropMinerJob = { // the miner that mines the src and brings energy to the container  (mines, deposits)
    group: operationId,
    cat: 'mine',
    id: `${operationId}-mine`,
    dist: 1,
    steps: [
      {id: src.id, type: 'src', action: ['harvest']},
      // {id: '', type: 'now', action: ['drop']}, // TODO - Unsupported step type "Now"
    ],
    max: slotsUsed,
    creeps: [],
    cost: 250,
    value: 3.8,
    plan: [WORK, WORK, MOVE]
  }
  let gameSrc = Game.getObjectById(src.id)
  const spawnId = base.structures[STRUCTURE_SPAWN][0]
  const spawn = Game.getObjectById(spawnId)
  let path = gameSrc.pos.findPathTo(spawn, {ignoreCreeps: true})
  const dist = path.length
  console.log('Dist calc for mine trans job:', JSON.stringify(path))
  const transferSteps = [
    {id: src.id, type: 'src', action: ['pickup']},
    {id: base.name, type: 'base', action: ['transfer']},
  ]
  const transferROI = calculateJobROI([CARRY, CARRY, CARRY, MOVE, MOVE, MOVE], dist, transferSteps, slotsUsed)
  console.log('transferROI', JSON.stringify(transferROI))
  const transferJob = { // the miner that mines the src and brings energy to the container  (mines, deposits)
    group: operationId,
    cat: 'mine',
    id: `${operationId}-transfer`,
    dist: transferROI.dist,
    steps: transferSteps,
    max: transferROI.max,
    creeps: [],
    cost: transferROI.cost,
    value: transferROI.value,
    plan: [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE],
    roi: transferROI
  }

  addJobToBase(base, dropMinerJob) // add to base, queue, etc.
  src.jobs.push(dropMinerJob.id) // add to source job list
  addJobToBase(base, transferJob) // add to base, queue, etc.
  src.jobs.push(transferJob.id) // add to source job list
  completeJob(base, src.jobs[0])
  src.jobs = src.jobs.slice(1)
  delete src.initPlan
  console.log('DropMine init!', src.id, JSON.stringify(src))
  console.log('DropMine init!', src.id, JSON.stringify(dropMinerJob))
  console.log('DropMine init!', src.id, JSON.stringify(transferJob))
  return src
}

function initSrcPlan (base, src, newPlan) {
  console.log('initSrcPlan', base.name, src.id, src.plan, newPlan)
  if (src.plan === newPlan) { // source already using this plan. return src
    console.log('Error: tried to change src plan to the same plan: ', newPlan)
    delete src.initPlan
  }
  switch (newPlan) {
    case 'simple':
      return initSimpleMine(base, src)
    case DROP_MINE.name:
      return initDropMine(base, src)
    case CONTAINER_MINE.name:
      console.log('initContainerMine')
      return initContainerMine(base, src)
    default:
      return initSimpleMine(base, src)
  }

}

function shouldUpgradeSrc (base, src) { // based on current level and plan, should we upgrade?
  const currLevel = src.level
  switch (currLevel) {
    case 0:
      if (src.containerId) {
        console.log('upgrading', src.id, src.containerId)
        return true
      }

      return false //src.jobs.every(jId => base.jobs[jId].creeps.length === base.jobs[jId].max) // upgrade if current jobs are full
    case 1:
      return false
    default:
      return false
  }
}

const DROP_MINE = {
  name: 'DropMine'
}
const CONTAINER_MINE = {
  name: 'CONTAINER_MINE'
}
function upgradeSrc (base, src) { // if here, we ARE upgrading.
  const currLevel = src.level
  const currPlan = src.plan
  switch (currLevel) {
    default:
    case 0:
      if (src.containerId) {
        const newLevel = 2
        src.level = newLevel
        console.log(`Upgrade Src ${src.id} from ${currLevel}, plan ${currPlan} to level ${newLevel}, plan ${CONTAINER_MINE.name}`)
        return initSrcPlan(base, src, CONTAINER_MINE.name)
      } else {
        const newLevel = 1
        src.level = newLevel
        console.log(`Upgrade Src ${src.id} from ${currLevel}, plan ${currPlan} to level ${newLevel}, plan ${DROP_MINE.name}`)
        src = initSrcPlan(base, src, DROP_MINE.name)
      }

      break
    case 1: // upgrade from level 1
      console.log(`Error: unhandled Src ${src.id} upgrade from (level) level ${currLevel}, plan ${currPlan}. Src:`, JSON.stringify(src))
      break
    // default:
    //   console.log(`Error: unhandled upgrade from (level) level ${currLevel}, plan ${currPlan}. Src:`, JSON.stringify(src))
    //   break
    //
  }
  return src
}

module.exports.run = function (base, manifest) {
  try {
    base.sources.forEach((src,i) => {
      // console.log('src: ', src, JSON.stringify(src))
      if (src.initPlan) {
        console.log('manual reset')
        if (src.plan) {
          src = initSrcPlan(base, src, src.plan) // this would be like someone else upgraded the src somewhere else. assume they know what they are talking about and do it
        } else {
          src = initSrcPlan(base, src, 'simple') // this is like the source is brand new and should be initialized
        }
      }

      /**
       * 1. is job initialized?
       * 2. if it is, are should we upgrade? else initCurrentJob
       * 3. if we should upgrade, what should we upgrade to?
       *
       * A. Simple => DropMine
       * B. DropMine => simple (ever?)
       * C. DropMine => MineAndCarry
       * D. Simple => MineAndCarry
       *
       *
       * they have plan simple, initPlan is false
       * every 15 ticks they are checking upgrades
       * if thats true, set up new job, change old job
       *
       *
       *
       */
      if (src.plan && Game.time % 5 === 0) {
        if (src.container && !src.containerId) {
          const position = src.container
          const pos = deserializePos(position)
          let lookRes = pos?.lookFor(LOOK_STRUCTURES)
          if (lookRes?.length) {
            let container = lookRes.find(res => res.structureType === STRUCTURE_CONTAINER)
            if (container?.id) {
              src.containerId = container?.id
            }
          }
        }
        if (shouldUpgradeSrc(base, src)) {
          src = upgradeSrc(base, src) // DO upgrade
        }
      }
      // if (src.container) {
      //   src.jobs.forEach(jId => {
      //     base.jobs[jId].steps = base.jobs[jId].steps.map(s => {
      //       if (s.type === base && s.id === base.name) {
      //         s.type = 'obj'
      //       }
      //     })
      //   })
      // }

      base.sources[i] = src

    })
  } catch(e) {
    console.log('Error: failed to run base.source', e.stack)
  }
  // manage jobs

}

