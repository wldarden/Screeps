const {deserializePos, serializePos} = require('./utils.memory')
const {freeSrcSlot} = require('./utils.jobs')

function getValidStep(job, i) {
  // return (job?.steps?.length < i + 1) ? i : 0
  if (job?.steps?.length < i + 1) {
    return 0
  } else {
    return i
  }
}
function getCreepStep(creep, job) {
  let index = getValidStep(job, creep.memory.step)
  creep.memory.step = index
  return job.steps[index]
}
module.exports.getCreepStep = getCreepStep
function getCreepStepAction(creep, step) {
  if (step.action.length <= creep.memory.actionIndex) {
    delete creep.memory.actionIndex
  }
  return step.action[creep.memory.actionIndex ?? 0]
}
module.exports.getCreepStepAction = getCreepStepAction

function hireCreep (base, creepName, jobId) {
  if (jobId !== undefined) {
    if (!base.jobs[jobId].creeps.some(jcId => jcId === creepName)) {
      base.jobs[jobId].creeps.push(creepName)
      if (
        base.jobs[jobId].max !== -1 && // only check "filter out" if job.max is not infinite
        base.jobs[jobId].creeps.length >= base.jobs[jobId].max
      ) { // job full. remove from queue
        base.queue[base.jobs[jobId].cat] = base.queue[base.jobs[jobId].cat].filter(qId => qId !== jobId)
      }
    }
    Game.creeps[creepName].memory.jobId = jobId
    return true
  }
  return false
}
module.exports.hireCreep = hireCreep

function fireCreep (base, creepName, jobId) {
  if (jobId !== undefined && base.jobs[jobId]) {
    const reQueue = base.jobs[jobId].creeps.length === base.jobs[jobId].max
    const job = base.jobs[jobId]
    if (job.cat === 'mine') {
      freeSrcSlot(base, creepName)
    }
    base.jobs[jobId].creeps = base.jobs[jobId].creeps.filter(id => id !== creepName) // remove creep from job
    if (reQueue) { // job was at max, and is now less than max, and will need a worker. reQueue
      addJobToBase(base, base.jobs[jobId]) // put job in queue if needed, save new job creeps
    }
  }
  if (Memory.creeps[creepName]) {
    delete Memory.creeps[creepName].jobId
  }
}
module.exports.fireCreep = fireCreep

function completeJob (base, jobId) {
  if (jobId !== undefined && base.jobs[jobId]) {
    base.queue[base.jobs[jobId].cat] = base.queue[base.jobs[jobId].cat].filter(jId => jId !== jobId)
    delete base.jobs[jobId]
  }
}
module.exports.completeJob = completeJob
function addJobToBase(base, job, sort = true) {
  base.jobs[job.id] = job // add to base job map
  if (base.jobs[job.id].cat === 'build') {
    if (!base.newSites) {
      base.newSites = [job.id]
    } else {
      base.newSites.push(job.id)
    }
  }
  //TODO - insert where it should be at first instead, not post sort like this
  if (!base.queue[base.jobs[job.id].cat]) { // base queue cat didnt exist. make it, add job.
    base.queue[base.jobs[job.id].cat] = [job.id] // add to queue for creeps to pick up
  } else if (
    (base.jobs[job.id].max === -1 || base.jobs[job.id].creeps.length < base.jobs[job.id].max) && // job max === -1 or has openings
    !base.queue[base.jobs[job.id].cat].some(jId => jId === job.id) // job not in queue
  ) {
    base.queue[base.jobs[job.id].cat].push(job.id) // add to base job queue
    if (sort) {
      base.queue[base.jobs[job.id].cat] = base.queue[base.jobs[job.id].cat].sort((aId,bId) => {
        const a = base.jobs[aId]
        const b = base.jobs[bId]
        return b.value - a.value
      }) // sort base queue
    }
  }
  return base
}
module.exports.addJobToBase = addJobToBase


/**
 *
 * @param srcMode - True/False: True: get dest to give energy to. False: get src to take energy from
 * @param list
 * @param resource
 * @return {*|null}
 */
function getTrgFromList (srcMode, list = [], resource = RESOURCE_ENERGY) {
  if (list.length) {
    let best = {id: null, amount: 0}
    let srcId = list.find(id => {
      const entity = Game.getObjectById(id)
      if (entity) { // if entity exists
        let amount
        if (srcMode === 'src') {
          amount = entity?.store?.getUsedCapacity(resource) // "amount" is Structure's available resource
        } else if (srcMode === 'dest') {
          amount = entity?.store?.getFreeCapacity(resource) // "amount" is Structure's available capacity
        }
        if (amount > 50) { // lots of amount! good enough return it immediately
          return true
        }
        if (amount > 0 && (!best || best.amount < amount)) { // pretty good, save it if its better than anything else we found, and continue checking
          best = {amount: amount, id: id}
        }
      }
    })
    if (srcId) {
      return srcId
    } else {
      return best.id
    }
  }
}

function getBaseTrgFromTypes (base, srcMode, types, resource = RESOURCE_ENERGY) {
  let res
  types.some(type => {
    let id = getTrgFromList(srcMode, base.structures[type], resource)
    if (id) {
      res = id
      return true
    }
  })
  return res
}
/**
 * Fill spawns
 * Fill extentions
 * Fill containers
 *
 * @param base
 * @param resource
 * @return {*}
 */
function getBaseDest (base, resource = RESOURCE_ENERGY) {
  return getBaseTrgFromTypes(base, 'dest', [STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_CONTAINER], resource)
}
function getBaseSrc (base, resource = RESOURCE_ENERGY) {
  return getBaseTrgFromTypes(base, 'src', [STRUCTURE_CONTAINER, STRUCTURE_SPAWN], resource)
}

function doLookAt (room, x, y, action) {
  room.lookAt(x,y).forEach(obj => {
    switch (obj.type) {
      case 'terrain':
        break
      case 'structure':
        break
    }
  })
}

const orderedSpaces = [
  [0,0],

  [1,0],[-1,0],[0,1],[0,-1],
  [1,1],[-1,1],[1,-1],[-1,1],

  [0,-2],[0,2],[2,0],[-2,0],
  [1,-2],[1,2],[-1,-2],[-1,2], [2,-1],[2,1],[-2,-1],[-2,1],
  [-2,-2],[2,2],[2,-2],[-2,2],

  [0,-3],[0,3],[3,0],[-3,0]
]
function lookAtSquare (pos, radius, lookAction) {
  let room = Game.rooms[pos.roomName]
  let stop = 0
  switch (radius) {
    case 0:
      stop = 0
      break
    case 1:
      stop = 8
      break
    case 2.5:
      stop = 20
      break
    case 2:
      stop = 24
      break
    case 3:
      stop = 28
      break
    default:
      console.log('Error: unhandled radius in lookAtSquare: ', radius)
      stop = 28
      break
  }
  for (let i = 0; i <= stop; i++) {
    let space = orderedSpaces[i]
    let lookResult = room.lookAt(pos.x + space[0], pos.y + space[1])
    if (lookAction(lookResult)) {
      return {x: pos.x + space[0], y: pos.y + space[1], res: lookResult}
    }
  }
}
function getOpenPositionNear (pos, range) {
  let openSpace = lookAtSquare(pos, range, (lookRes) => {
    return lookRes.length === 1
  })
  return {x: openSpace.x, y: openSpace.y, roomName: pos.roomName}

}
function makePile (baseId, resource) {
  if (!Memory.bases[baseId].structures.piles.length) {
    let spawnId = Memory.bases[baseId].structures[STRUCTURE_SPAWN][0]
    let spawn = Game.getObjectById(spawnId)
    let position = getOpenPositionNear(spawn.pos, 1)
    const newPile = {pos: serializePos(position), res: resource}
    Memory.bases[baseId].structures.piles.push(newPile)
    return newPile
  } else {
    return Memory.bases[baseId].structures.piles[0]
  }
}
function getStepBaseActionEntityId (step, actionIndex) {
  // step type IS base here by definition
  switch (step.action[actionIndex]) {
    case 'drop':
      if (!Memory.bases[step.id].structures.piles.length) {
        const pile = makePile(step.id, step.resource ?? RESOURCE_ENERGY)
        return pile.pos
      } else {
        return Memory.bases[step.id].structures.piles[0].pos
      }
    case 'upgrade':
      return Memory.bases[step.id].structures[STRUCTURE_CONTROLLER][0]
    case 'withdraw':
      return getBaseSrc(Memory.bases[step.id], step.resource ?? RESOURCE_ENERGY)
    case 'transfer':
      return getBaseDest(Memory.bases[step.id], step.resource ?? RESOURCE_ENERGY)
    case 'build':
    // get site at base, or balance base energy
    // Memory.bases[step.id].sites
      if (Memory.bases[step.id]?.queue?.build?.length) {
        return Memory.bases[step.id]?.queue?.build[0]
      }
      break
    // return Game.rooms[Memory.bases[step.id].room].find(FIND_CONSTRUCTION_SITES)[0]?.id
    default:
      console.log('Error: unhandled baseActionEntityId. returned step.id by default.', JSON.stringify(step))
      return step.id
  }
}

function getStepPosEntityId (step, actionIndex = 0) {
  // step type IS pos here by definition
  let pos = deserializePos(step.id)
  let lookRes
  console.log('Getting pos entitiy id', JSON.stringify(pos), actionIndex, step.action[actionIndex ?? 0])
  switch (step.action[actionIndex ?? 0]) {
    case 'build':
      lookRes = pos.lookFor(LOOK_CONSTRUCTION_SITES)
      console.log('lookRes', JSON.stringify(lookRes))
      if (lookRes?.length) {
        // lookRes.find(r => {
        //   r.type ===''
        // })
        console.log('1111',JSON.stringify(lookRes))
        return lookRes[0]?.id
      } else {
        return false // bad position to look for site. building complete.
      }
    case 'withdraw':
      lookRes = pos.lookFor(LOOK_RESOURCES)
      if (lookRes?.length) {
        return lookRes[0]?.id
      } else {
        return false // bad position to look for site. building complete.
      }
    case 'transfer':
      lookRes = pos.lookFor(LOOK_STRUCTURES)
      if (lookRes?.length) {
        return lookRes[0]?.id
      } else {
        return false // bad position to look for site. building complete.
      }
    case 'harvest':
      lookRes = pos.lookFor(LOOK_SOURCES)
      if (lookRes?.length) {
        return lookRes[0]?.id
      } else {
        return false // bad position to look for site. building complete.
      }
    case 'upgrade':
      return Memory.bases[pos.roomName].structures[STRUCTURE_CONTROLLER][0]
    default:
      return pos
  }
}
function getStepEntityId (step, actionIndex = 0) {
  switch (step.type) {
    case 'base':
      return getStepBaseActionEntityId(step, actionIndex)
    case 'pile':
    case 'src':
    case 'obj':
      return step.id
    case 'pos':
      return getStepPosEntityId(step, actionIndex)
      break
    case 'site':
      console.log('Getting site id:', step.site)
      return step.site
    default:
      console.log('Error: Unhandled step entity type: ', JSON.stringify(step))
      return Game.getObjectById(step.id)
  }
}
module.exports.getStepEntityId = getStepEntityId

function getStepEntity (step, actionIndex = 0) {
  let id = getStepEntityId(step, actionIndex)
  return id ? Game.getObjectById(id) : false
}
module.exports.getStepEntity = getStepEntity
