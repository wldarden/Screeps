const {serializePos, serializeBody} = require('./utils.memory')
const {getTypeCreeps, getNodeReqs} = require('./utils.nodes')
const {addSpawnRequest} = require('./utils.manifest')

function buildRoleCreep (node, role, maxCost = 300) {
  let body = []
  let addOns = []
  let addOnCount = 0
  let baseCost = 0
  let addOnCost = 0
  switch (role) {
    case 'miner':
      if (node.type === 'src' && node.stage >= 3) {
        body = [WORK,WORK,CARRY,MOVE]
        addOns = [CARRY, MOVE]
        baseCost = 300
        addOnCost = 100
        addOnCount = Math.floor((maxCost - baseCost) / addOnCost)
      } else {
        body = [CARRY, WORK, MOVE, CARRY, MOVE]
        addOns = [CARRY, MOVE]
        baseCost = 300
        addOnCost = 100
        addOnCount = Math.floor((maxCost - baseCost) / addOnCost)
      }
      break
    case 'maint':
      body = [CARRY, WORK, MOVE]
      addOns = [CARRY, MOVE, WORK]
      baseCost = 200
      addOnCost = 200
      addOnCount = Math.floor((maxCost - baseCost) / addOnCost)
      break
    case 'supplier':
      body = [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE]
      addOns = [CARRY, MOVE]
      baseCost = 300
      addOnCost = 100
      addOnCount = Math.floor((maxCost - baseCost) / addOnCost)
      break
    case 'builder':
      body = [WORK, WORK, CARRY, MOVE]
      addOns = [CARRY, MOVE]
      baseCost = 300
      addOnCost = 100
      addOnCount = Math.floor((maxCost - baseCost) / addOnCost)
      break
    case 'upgrader':
      body = [CARRY, WORK, MOVE]
      addOns = [CARRY, WORK, MOVE]
      baseCost = 200
      addOnCost = 200
      addOnCount = Math.floor((maxCost - baseCost) / addOnCost)
      break
    default:
      body = [CARRY, WORK, MOVE, CARRY, MOVE]
      addOns = [CARRY, MOVE]
      baseCost = 300
      addOnCost = 100
      addOnCount = Math.floor((maxCost - baseCost) / 100)
      break
  }
  if (maxCost > 300) {
    for (let i = 0; i < addOnCount; i++) {
      body = body.concat(addOns)
    }
  }
  const cost = baseCost + (addOnCount * addOnCost)
  return {body, cost}
}
module.exports.buildRoleCreep = buildRoleCreep
function maintainRoleCreepsForNode (baseManifest, node, role, desired, minPri, maxPri, memOpts = {}) {
  let existingTypeCreeps = getTypeCreeps(node, role)
  const currentSaturation = existingTypeCreeps.length / desired
  const plannedSaturation = (getNodeReqs(node).length + existingTypeCreeps.length) / desired
  if (plannedSaturation < 1) {
    const priGap = maxPri - minPri
    const pri = minPri + ((1 - currentSaturation) * priGap)
    const {body, cost} = buildRoleCreep(node, role, baseManifest.spawnCapacity)
    const newRequest = {
      pri: pri, requestor: node.id, assignee: [], status: 'new', type: 'spawn', cost: cost,
      opts: {role: role, plan: serializeBody(body), ...memOpts}
    }
    node.reqs.push(addSpawnRequest(baseManifest, newRequest))
  }
}
module.exports.maintainRoleCreepsForNode = maintainRoleCreepsForNode

function ticksPerSpace (plan, partCounts) {
  let fullWeight = plan.length - partCounts[MOVE]
  const emptyWeight = fullWeight - partCounts[CARRY] || 1
  let ticksPerSpaceTo = Math.min(Math.ceil(emptyWeight / partCounts[MOVE]), 1)
  let ticksPerSpaceFrom = Math.min(Math.ceil(fullWeight / partCounts[MOVE]), 1)
  return {to: ticksPerSpaceTo, from: ticksPerSpaceFrom}
}
module.exports.ticksPerSpace = ticksPerSpace

module.exports.onDestroyCommon = function(name) {
  // clear from source lists
  // remove from roles
  // release jobs
  let creepMemory = Memory.creeps[name]
  // if (creepMemory.job) {
  //     releaseJob(creepMemory.job)
  // }
  // let base = Game.bases[creepMemory.base]
  // if (base) {
  //     if (creepMemory.srcTrg) { // remove srcTrg claim
  //         base.sources.some(s => {
  //             if (s.id === creepMemory.srcTrg) {
  //                 s.active = s.active.filter(id => id !== creepMemory.name)
  //                 return true
  //             }
  //         })
  //     }
  //     let roleObj = base.roles[creepMemory.role]
  //     roleObj.creeps = base.roles[creepMemory.role].creeps.filter(cId => cId !== creepMemory.name) // remove from role list
  //     creepMemory.parts.forEach(part => {roleObj[part]--}) // remove part counts
  // }
}

module.exports.getCreepBaseId = function (creep) {
  let nodeId = creep.memory.nodeId
  while(Memory.nodes[nodeId].parent !== null) {
    nodeId = Memory.nodes[nodeId].parent
  }
  return nodeId
}



function creepPlanInfo (plan) {
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
  return {cost: creepCost, partCounts: partCounts}
}
module.exports.creepPlanInfo = creepPlanInfo

function nextAction (creep, step) {
  creep.memory.actionIndex = creep.memory.actionIndex ? creep.memory.actionIndex + 1 : 1 // increment action index
  if (step.action.length <= creep.memory.actionIndex) { // reset if needed
    nextStep(creep)
  }
}
module.exports.nextAction = nextAction
function nextStep (creep) {
  creep.memory.step++
  delete creep.memory.actionIndex
  delete creep.memory.dest
  delete creep.memory.wait
}
module.exports.nextStep = nextStep

function switchSrcSlot (base, creep, srcId) {
  let baseSourceIndex = base.sources.findIndex(s => s.id === srcId)
  if (baseSourceIndex !== -1) {
    let src = base.sources[baseSourceIndex]
    if (src) {
      let openPos = src.slots.find(s => !src.activePos[s])
      if (openPos) {
        base.sources[baseSourceIndex].activePos[openPos] = creep.name
        base.sources[baseSourceIndex].activePos[creep.memory.srcSlot] = false
        creep.memory.srcSlot = openPos
        creep.memory.srcIndex = baseSourceIndex
        return true
      }
    }
  }
}
module.exports.switchSrcSlot = switchSrcSlot
function reserveSrcSlot (base, creep, srcId) {
  let baseSourceIndex = base.sources.findIndex(s => s.id === srcId)
  if (baseSourceIndex !== -1) {
    let src = base.sources[baseSourceIndex]
    if (src) {
      let openPos
      let creepSPos = serializePos(creep.pos)
      if (src.slots.some(sPos => sPos === creepSPos)) {
        openPos = creepSPos
      } else {
        openPos = src.slots.find(s => !src.activePos[s])
      }
      if (openPos) {
        base.sources[baseSourceIndex].active.push(creep.name)
        base.sources[baseSourceIndex].activePos[openPos] = creep.name
        creep.memory.srcSlot = openPos
        creep.memory.srcIndex = baseSourceIndex
        // creep.memory.srcBase = base.name
        return true
      }
    }
  }

  return false
}
module.exports.reserveSrcSlot = reserveSrcSlot

function freeSrcSlot (base, creepName) {
  if (Memory.creeps[creepName].srcSlot) {
    let baseSourceIndex = Memory.creeps[creepName].srcIndex
    if (baseSourceIndex !== undefined && baseSourceIndex !== -1) {
      base.sources[baseSourceIndex].active = base.sources[baseSourceIndex].active.filter(a => a !== creepName)
      base.sources[baseSourceIndex].activePos[Memory.creeps[creepName].srcSlot] = false
      delete Memory.creeps[creepName].srcSlot
      return true
    }
    return false
  }
  return true // there wasn't a srcSlot to free... so success?
}
module.exports.freeSrcSlot = freeSrcSlot
