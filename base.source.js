// const {getSourcesForPos} = require('./utils.cartographer')
const {addJobToBase, mineAndCarryPlan, completeJob} = require('./operation.job')
const {calculateJobROI} = require('./utils.jobs')
const {deserializePos, serializePos} = require('./utils.memory')
const {findContainerSite, findContainerSiteForSrc} = require('./utils.build')
const {addSpawnRequest, addBuildRequest, hasSpawnRequest, hasBuildRequest} = require('./utils.manifest')
const {creepPlanInfo} = require('./utils.creep')
const {ACTIONS} = require('./actions')
const {containerized} = require('./utils.source')
const {getSlotsAround} = require('./utils.cartographer')



function requestSrcMiner (manifest, srcId, role, priority, replaceCreep) {
  let src = Memory.nodes[srcId]
  const plan = containerized(srcId) ? {W: 2, C: 1, M: 1} : {W: 1, C: 2, M: 2}
  const mem = {
    base: src.base,
    node: srcId,
    role: 'miner',
    src: srcId
  }
  const slots = Object.keys(src.slots)
  const miners = src?.creeps?.length || 0
  const saturation = miners / slots.length
  const pri = priority || ((1 / src.dist) + (1 / saturation))
  addSpawnRequest(manifest, {plan, mem, pri, replace: replaceCreep})
}

function requestSrcContainer (manifest, base, srcId) {
  let src = Memory.nodes[srcId]
  let source = Game.getObjectById(srcId)
  // const base = Memory.bases[src.base]
  const spawnId = base.structures[STRUCTURE_SPAWN][0]
  const spawn = Game.getObjectById(spawnId)
  const path = source.pos.findPathTo(spawn , {ignoreCreeps: true})
  let pos
  if (path[0].dx !== 0) {
    pos = {x: path[0].x + path[0].dx, y: path[0].y, roomName: source.pos.roomName }
  } else {
    pos = {x: path[0].x, y: path[0].y + path[0].dy, roomName: source.pos.roomName }
  }
  let room = Game.rooms[base.name]
  const priorityReq = {
    node: srcId,
    structureType: STRUCTURE_CONTAINER,
    pos: serializePos(pos),
  }
  const res = room.createConstructionSite(pos.x, pos.y, priorityReq.structureType)
  if (res === 0) {
    priorityReq.placed = Game.time
    priorityReq.pri = 1/ src.dist
    if (!src.sites) {
      src.sites = {}
    }
    if (!src.sites[priorityReq.structureType]) {
      src.sites[priorityReq.structureType] = [priorityReq.pos]
    } else {
      src.sites[priorityReq.structureType].push(priorityReq.pos)
    }
    if (!base.sites) {
      base.sites = {}
    }
    if (!base.sites.structures) {
      base.sites.structures = [priorityReq.pos]
    } else {
      base.sites.structures.push(priorityReq.pos)
    }
    addBuildRequest(manifest, priorityReq)
  }

}

function saturateSrc (base, manifest, srcId) {
  let src = Memory.nodes[srcId]
  if (saturation < 1 && !hasSpawnRequest(manifest, srcId, {role: 'miner'})) {
    slots.forEach(slot => {
      if (!src.slots[slot]) {
        requestSrcMiner(manifest, srcId, 'miner')
      }
    })
  }
}

function getSrcLevel (srcId) {
  let src = Memory.nodes[srcId]
  const slots = Object.keys(src.slots)
  const miners = src?.creeps?.length || 0
  const saturation = miners / slots.length


  if (!containerized(srcId)) {
    if (saturation < 1) {
      return 0 // saturating src
    } else {
      return 1 // building container
    }
  } else {
    if (src.upgrade) {
      return 2 // replacing old creeps with static miners
    } else {
      return 3
    }
    // replace creeps with WWMC miners
    // if (src.upgrade && !src.replaceCreep) {
    //   let replaceCreep = src.creeps.find(cId => {
    //     let info = creepPlanInfo(Game.creeps[cId].body)
    //     if (info.partCounts[WORK] === 1) {
    //       return true
    //     } else if (info.partCounts[WORK] === 2) {
    //       return false
    //     }
    //     console.log('Src Creep has unexpected body plan: ', creep.name, JSON.stringify(info))
    //   })
    //   if (replaceCreep) {
    //     src.replaceCreep = cId
    //     ACTIONS.recycle.start(Game.creeps[cId])
    //     requestSrcMiner(manifest, src., 'miner')
    //   }
    // }

  }
}

function hasLevelZeroCreep (src) {
  return src.creeps.find(cId => {
    // let info = creepPlanInfo(Game.creeps[cId].body)

    const workParts = Game.creeps[cId].getActiveBodyparts(WORK)
    if (workParts === 1) {
      return true
    } else if (workParts === 2) {
      return false
    }
    console.log('Src Creep has unexpected body plan: ', Game.creeps[cId].name, JSON.stringify(workParts), JSON.stringify(Game.creeps[cId].body))
  })
}

function getSrcIncome (src) {
  const miners = src?.creeps?.length || 0
  switch (src.level) {
    case 0:
    case 1:
      return (100 / (3 * src.dist)) * miners
    case 2:
      return miners * 2
    case 3:
      return miners * 4
  }
}
function getSrcCost (src) {
  const miners = src?.creeps?.length || 0
  switch (src.level) {
    case 0:
    case 1:
    case 2:
    case 3:
      return miners * (3 / 15)
    default:
      return miners * (3 / 15)
  }
}
function maxMiners (src) {
  const slots = Object.keys(src.slots)
  switch (src.level) {
    case 0:
    case 1:
      return ((3 * src.dist) + 50) / (50)
    default:
      return slots.length
  }
}

module.exports.run = function (base, manifest) {
  try {
    base.sources.forEach((sId) => {
      let src = Memory.nodes[sId]
      if (src.threat) {
        return // threat srcs are skipped
      }
      src.level = getSrcLevel(sId)
      // src.slots = {}
      // const s3 = Game.getObjectById(sId)
      // let slots2 = getSlotsAround(s3.pos)
      // slots2.forEach(pos => src.slots[pos] = false)
      const slots = Object.keys(src.slots)
      const miners = src?.creeps?.length || 0
      const saturation = miners / slots.length


      // for(let sl in src.slots) {
      //   src.slots[sl] = false
      // }
      if (Game.time % 5 === 0) {
        if (!manifest.income) {
          manifest.income = {}
        }
        if (!manifest.income[sId]) {
          manifest.income[sId] = {}
        }
        manifest.income[sId].base = base.name
        manifest.income[sId].rev = getSrcIncome(src)
        manifest.income[sId].cost = getSrcCost(src)
      }

      if (miners < maxMiners(src) && !hasSpawnRequest(manifest, sId, {role: 'miner'})) {
        requestSrcMiner(manifest, sId, 'miner')
      }
      switch (src.level) {
        case 0:
          // if (!hasSpawnRequest(manifest, sId, {role: 'miner'})) {
          //   slots.forEach(slot => {
          //     if (!src.slots[slot]) {
          //       requestSrcMiner(manifest, sId, 'miner')
          //     }
          //   })
          // }
          break
        case 1:

          if (!containerized(sId) && !hasBuildRequest(manifest, sId)) {
            requestSrcContainer(manifest, base, sId)
            src.upgrade = true
            // let res = findContainerSiteForSrc(base.structures[STRUCTURE_SPAWN][0], sId)
          }
          break
        case 2:
          if (src.replaceCreep) {
            if (!Game.creeps[src.replaceCreep]) {
              delete src.replaceCreep // couldnt find replaceCreep. they have killed themselves
            } else {
              // still replacing
            }
          }
          if (!src.replaceCreep) {
            let replaceCreep = hasLevelZeroCreep(src)
            if (replaceCreep) {
              src.replaceCreep = replaceCreep
              // ACTIONS.recycle.start(Game.creeps[cId]) // make the creep kill itself
              requestSrcMiner(manifest, sId, 'miner', undefined, replaceCreep)
            } else {
              delete src.upgrade
            }
          }
          break
      }
      // const EnergyPerTick = 100 / (3 * src.dist)
      // let income = miners * EnergyPerTick
      //
      // console.log(sId, 'income', income, 'level: ', level, 'saturation', saturation, 'upgrade:', src.upgrade)
      //
      //
      // if (saturation < 1 && !hasSpawnRequest(manifest, sId, {role: 'miner'})) { // level one.
      //
      // }
      //
      // const hasContainer = (src.sites && src.sites[STRUCTURE_CONTAINER] && src.sites[STRUCTURE_CONTAINER].length) || (
      //   src.structures && src.structures[STRUCTURE_CONTAINER] && src.structures[STRUCTURE_CONTAINER].length
      // )
      // // console.log('saturation:',sId, saturation, saturation > 0.5)
      // // console.log('!hasContainer:',sId, !hasContainer)
      // // console.log('!hasBuildRequest(manifest, sId):',sId, !hasBuildRequest(manifest, sId))
      // if (!hasContainer && saturation === 1 && !hasBuildRequest(manifest, sId)) {
      //   requestSrcContainer(manifest, base, sId)
      //   src.upgrade = true
      //   // let res = findContainerSiteForSrc(base.structures[STRUCTURE_SPAWN][0], sId)
      // }

    })
  } catch(e) {
    console.log('Error: failed to run base.source', e.stack)
  }
  // manage jobs

}

// //
// // module.exports.addTrgSources = function (base, trgId) {
// //   try {
// //     let sources = base.sourcePaths[trgId]
// //     if (sources) {
// //       return sources
// //     } else {
// //       let trgObj = Game.getObjectById(trgId)
// //       const res = getSourcesForPos(trgObj, base.sources)
// //       Memory.bases[base.name].sourcePaths[trgId] = res
// //       return res
// //     }
// //   } catch (e) {
// //     console.log('Error: addTrgSources(', base.name, trgId, ')', e.stack)
// //   }
// // }
//
// //   BODYPART_COST: {
// //        "move": 50,
// //       "work": 100,
// //       "attack": 80,
// //       "carry": 50,
// //       "heal": 250,
// //       "ranged_attack": 150,
// //       "tough": 10,
// //       "claim": 600
// // },
//
// function simpleCreepPlanROI (slots, dist, plan, srcId ) {
//   let partCounts = {}
//   let creepCost = 0
//   plan.forEach(part => {
//     if (!partCounts[part]) {
//       partCounts[part] = 1
//     } else {
//       partCounts[part] += 1 // add part counts to role counts
//     }
//     creepCost += BODYPART_COST[part]
//   })
//
//   let weight = plan.length - partCounts[MOVE]
//   let ticksPerSpaceTo = Math.ceil((weight - partCounts[CARRY]) / partCounts[MOVE])
//   let ticksPerSpaceFrom = Math.ceil(weight / partCounts[MOVE])
//   let loadSize = partCounts[CARRY] * 50
//   let ticksTo = dist * ticksPerSpaceTo
//   let ticksFrom = dist * ticksPerSpaceFrom
//   let mineTicks = Math.ceil(loadSize / (partCounts[WORK] * 2))
//   let loadTicks = ticksTo + mineTicks + ticksFrom
//   let revPerTick = loadSize / loadTicks
//   let creepsPerSlot = loadTicks / mineTicks
//   let maxCreeps = Math.floor(slots * creepsPerSlot) // final ans
//   let valuePerCreep = revPerTick - (creepCost / 1500)
//   // if (srcId === '9749d1c8af1421df1bd460b9' && partCounts[MOVE] === 2 && partCounts[CARRY] === 2) {
//   //   console.log('weight', weight)
//   //   console.log('srcId', srcId)
//   //   console.log('dist', dist)
//   //   console.log('plan', JSON.stringify(plan))
//   //   console.log('ticksPerSpaceTo', ticksPerSpaceTo)
//   //   console.log('ticksPerSpaceFrom', ticksPerSpaceFrom)
//   //   console.log('loadSize',loadSize)
//   //   console.log('ticksTo', ticksTo)
//   //   console.log('ticksFrom', ticksFrom)
//   //   console.log('mineTicks', mineTicks)
//   //   console.log('loadTicks', loadTicks)
//   //   console.log('revPerTick', revPerTick)
//   //   console.log('creepsPerSlot', creepsPerSlot)
//   //   console.log('maxCreeps', maxCreeps)
//   //   console.log('valuePerCreep', valuePerCreep)
//   //   console.log('creepCost', creepCost)
//   //   console.log('partCounts', JSON.stringify(partCounts))
//   // }
//   return {
//     valuePerCreep,
//     creepsPerSlot,
//     maxCreeps,
//     totalValue: maxCreeps * valuePerCreep,
//     creepCost: creepCost,
//     dist: dist,
//
//     weight,
//     ticksPerSpaceTo,
//     ticksPerSpaceFrom,
//     loadSize,
//     ticksTo,
//     ticksFrom,
//     mineTicks,
//     loadTicks,
//     revPerTick,
//     // creepsPerSlot,
//     // maxCreeps,
//     partCounts
//
//   }
// }
// function simpleSourcePlan (base, source) {
//   let src = Game.getObjectById(source.id)
//   const spawnId = base.structures[STRUCTURE_SPAWN][0]
//   const spawn = Game.getObjectById(spawnId)
//   let path = src.pos.findPathTo(spawn, {ignoreCreeps: true})
//   const dist = path.length
//
//   if (spawn.room.energyCapacityAvailable === 300) { // Hard coded plan for energy cap = 300
//     const slots = source.slots.length
//     const loadTicks = 50 + (3 * dist)
//     const creepsPerSlot = loadTicks / 50
//     const valuePerCreep = (100 / loadTicks) - .2
//     const max = Math.floor(slots * creepsPerSlot)
//     return [
//       {
//         group: 'main',
//         cat: 'mine',
//         dist: path.length,
//         steps: [
//           {id: source.id, type: 'src', action: ['harvest']},
//           {id: base.name, type: 'base', action: ['transfer', 'drop']}
//         ],
//         max: max,
//         creeps: [],
//         cost: 300,
//         value: valuePerCreep,
//         plan: [WORK, CARRY, CARRY, MOVE, MOVE],
//         reqs: { parts: [WORK, CARRY, MOVE] }
//       }
//     ]
//   }
//
//
//   // console.log('path logggg', JSON.stringify(path))
//   const simplePlans = [
//     [WORK, CARRY, MOVE],
//     [WORK, CARRY, CARRY, MOVE, MOVE]
//   ]
//   let bestPlanIndex = 0
//   let bestPlanROI = {valuePerCreep: 0, creepsPerSlot: 0, maxCreeps: 0, totalValue: 0}
//   simplePlans.forEach((p, i) => {
//     const planROI = simpleCreepPlanROI(source.slots.length, dist, p, source.id)
//     // console.log('planROI', source.id, JSON.stringify(planROI), JSON.stringify(p))
//     if (planROI.valuePerCreep > bestPlanROI.valuePerCreep) {
//       bestPlanIndex = i
//       bestPlanROI = planROI
//     }
//   })
//   return [
//     {
//       group: 'main',
//       cat: 'mine',
//       dist: path.length,
//       steps: [
//         {id: source.id, type: 'src', action: ['harvest']},
//         {id: base.name, type: 'base', action: ['transfer', 'drop']}
//         // {id: base.name, type: 'base', action: ['transfer', 'build', 'upgrade']}
//       ],
//       max: bestPlanROI.maxCreeps,
//       creeps: [],
//       cost: bestPlanROI.creepCost,
//       value: bestPlanROI.valuePerCreep,
//       plan: simplePlans[bestPlanIndex],
//       reqs: { parts: [WORK, CARRY, MOVE] },
//       ROI: {
//         ...bestPlanROI
//       }
//     }
//   ]
// }
//
// function initSimpleMine (base, src) {
//   src.level = 0
//   src.plan = 'simple'
//   let jobs = simpleSourcePlan(base, src)
//   let newJobIndex = 1
//   jobs.forEach(job => {
//     while (base.jobs['' + newJobIndex]) {
//       newJobIndex++
//     }
//     job.id = '' + newJobIndex
//     addJobToBase(base, job) // add to base, queue, etc.
//     src.jobs.push(job.id) // add to source job list
//   })
//   delete src.initPlan
//   return src
// }
//
// function initContainerMine (base, src) {
//   src.level = 2 // increase level to not resubmit this job.
//   src.plan = CONTAINER_MINE.name
//   const operationId = `${CONTAINER_MINE.name}-${src.id}`
//   const containerMinerSteps = [
//     {id: src.id, type: 'src', action: ['harvest']},
//     {id: src.containerId, type: 'obj', action: ['transfer']}, // TODO - Unsupported step type "Now"
//   ]
//   const minerPlan = [WORK, WORK, CARRY, MOVE]
//   const minerROI = calculateJobROI(minerPlan, 1, containerMinerSteps, src.slots.length)
//   const containerMiner = { // the miner that mines the src and brings energy to the container  (mines, deposits)
//     group: operationId,
//     cat: 'mine',
//     id: `${operationId}-mine`,
//     dist: 1,
//     steps: containerMinerSteps,
//     max: src.slots.length,
//     creeps: [],
//     cost: minerROI.cost,
//     value: minerROI.value,
//     plan: minerPlan
//   }
//   // let container = Game.getObjectById(src.containerId)
//   // const spawnId = base.structures[STRUCTURE_SPAWN][0]
//   // const spawn = Game.getObjectById(spawnId)
//   // let path = container.pos.findPathTo(spawn, {ignoreCreeps: true})
//   // const dist = path.length
//   // console.log('Dist calc for mine trans job:', JSON.stringify(path))
//   // const transferSteps = [
//   //   {id: src.containerId, type: 'obj', action: ['withdraw']},
//   //   {id: base.name, type: 'base', action: ['transfer']},
//   // ]
//   // const transferPlan = [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE]
//   // const transferROI = calculateJobROI(transferPlan, dist, transferSteps, src.slots.length)
//   // console.log('transferROI', JSON.stringify(transferROI))
//   // const transferJob = { // the miner that mines the src and brings energy to the container  (mines, deposits)
//   //   group: operationId,
//   //   cat: 'mine',
//   //   id: `${operationId}-transfer`,
//   //   dist: transferROI.dist,
//   //   steps: transferSteps,
//   //   max: Math.max(transferROI.max, 5),
//   //   creeps: [],
//   //   cost: transferROI.cost,
//   //   value: transferROI.value,
//   //   plan: transferPlan,
//   //   roi: transferROI
//   // }
//
//   addJobToBase(base, containerMiner) // add to base, queue, etc.
//   src.jobs.push(containerMiner.id) // add to source job list
//   // addJobToBase(base, transferJob) // add to base, queue, etc.
//   // src.jobs.push(transferJob.id) // add to source job list
//   completeJob(base, src.jobs[0])
//   src.jobs = [
//     containerMiner,
//     // transferJob
//   ]
//   delete src.initPlan
//   console.log('ContainerMine init!', src.id, JSON.stringify(src))
//   console.log('ContainerMine init!', src.id, JSON.stringify(containerMiner))
//   // console.log('ContainerMine init!', src.id, JSON.stringify(transferJob))
//   return src
// }
// function initDropMine (base, src) {
//   src.level = 1 // increase level to not resubmit this job.
//   src.plan = DROP_MINE.name
//
//   const slotsUsed = 2 // use up to 2 slots
//   // base.jobs[src.jobs[0]].max = base.jobs[src.jobs[0]].max - slotsUsed // remove slots from original simple job
//
//   const operationId = `${DROP_MINE.name}-${src.id}`
//   // drop mine + build container
//   const dropMinerJob = { // the miner that mines the src and brings energy to the container  (mines, deposits)
//     group: operationId,
//     cat: 'mine',
//     id: `${operationId}-mine`,
//     dist: 1,
//     steps: [
//       {id: src.id, type: 'src', action: ['harvest']},
//       // {id: '', type: 'now', action: ['drop']}, // TODO - Unsupported step type "Now"
//     ],
//     max: slotsUsed,
//     creeps: [],
//     cost: 250,
//     value: 3.8,
//     plan: [WORK, WORK, MOVE]
//   }
//   let gameSrc = Game.getObjectById(src.id)
//   const spawnId = base.structures[STRUCTURE_SPAWN][0]
//   const spawn = Game.getObjectById(spawnId)
//   let path = gameSrc.pos.findPathTo(spawn, {ignoreCreeps: true})
//   const dist = path.length
//   console.log('Dist calc for mine trans job:', JSON.stringify(path))
//   const transferSteps = [
//     {id: src.id, type: 'src', action: ['pickup']},
//     {id: base.name, type: 'base', action: ['transfer']},
//   ]
//   const transferROI = calculateJobROI([CARRY, CARRY, CARRY, MOVE, MOVE, MOVE], dist, transferSteps, slotsUsed)
//   console.log('transferROI', JSON.stringify(transferROI))
//   const transferJob = { // the miner that mines the src and brings energy to the container  (mines, deposits)
//     group: operationId,
//     cat: 'mine',
//     id: `${operationId}-transfer`,
//     dist: transferROI.dist,
//     steps: transferSteps,
//     max: transferROI.max,
//     creeps: [],
//     cost: transferROI.cost,
//     value: transferROI.value,
//     plan: [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE],
//     roi: transferROI
//   }
//
//   addJobToBase(base, dropMinerJob) // add to base, queue, etc.
//   src.jobs.push(dropMinerJob.id) // add to source job list
//   addJobToBase(base, transferJob) // add to base, queue, etc.
//   src.jobs.push(transferJob.id) // add to source job list
//   completeJob(base, src.jobs[0])
//   src.jobs = src.jobs.slice(1)
//   delete src.initPlan
//   console.log('DropMine init!', src.id, JSON.stringify(src))
//   console.log('DropMine init!', src.id, JSON.stringify(dropMinerJob))
//   console.log('DropMine init!', src.id, JSON.stringify(transferJob))
//   return src
// }
//
// function initSrcPlan (base, src, newPlan) {
//   console.log('initSrcPlan', base.name, src.id, src.plan, newPlan)
//   if (src.plan === newPlan) { // source already using this plan. return src
//     console.log('Error: tried to change src plan to the same plan: ', newPlan)
//     delete src.initPlan
//   }
//   switch (newPlan) {
//     case 'simple':
//       return initSimpleMine(base, src)
//     case DROP_MINE.name:
//       return initDropMine(base, src)
//     case CONTAINER_MINE.name:
//       console.log('initContainerMine')
//       return initContainerMine(base, src)
//     default:
//       return initSimpleMine(base, src)
//   }
//
// }
//
// function shouldUpgradeSrc (base, src) { // based on current level and plan, should we upgrade?
//   const currLevel = src.level
//   switch (currLevel) {
//     case 0:
//       if (src.containerId) {
//         console.log('upgrading', src.id, src.containerId)
//         return true
//       }
//
//       return false //src.jobs.every(jId => base.jobs[jId].creeps.length === base.jobs[jId].max) // upgrade if current jobs are full
//     case 1:
//       return false
//     default:
//       return false
//   }
// }
//
// const DROP_MINE = {
//   name: 'DropMine'
// }
// const CONTAINER_MINE = {
//   name: 'CONTAINER_MINE'
// }
// function upgradeSrc (base, src) { // if here, we ARE upgrading.
//   const currLevel = src.level
//   const currPlan = src.plan
//   switch (currLevel) {
//     default:
//     case 0:
//       if (src.containerId) {
//         const newLevel = 2
//         src.level = newLevel
//         console.log(`Upgrade Src ${src.id} from ${currLevel}, plan ${currPlan} to level ${newLevel}, plan ${CONTAINER_MINE.name}`)
//         return initSrcPlan(base, src, CONTAINER_MINE.name)
//       } else {
//         const newLevel = 1
//         src.level = newLevel
//         console.log(`Upgrade Src ${src.id} from ${currLevel}, plan ${currPlan} to level ${newLevel}, plan ${DROP_MINE.name}`)
//         src = initSrcPlan(base, src, DROP_MINE.name)
//       }
//
//       break
//     case 1: // upgrade from level 1
//       console.log(`Error: unhandled Src ${src.id} upgrade from (level) level ${currLevel}, plan ${currPlan}. Src:`, JSON.stringify(src))
//       break
//     // default:
//     //   console.log(`Error: unhandled upgrade from (level) level ${currLevel}, plan ${currPlan}. Src:`, JSON.stringify(src))
//     //   break
//     //
//   }
//   return src
// }


