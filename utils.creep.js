const {serializePos, serializeBody} = require('./utils.memory')
const {getTypeCreeps, getNodeReqs, removeCreepFromNode} = require('./utils.nodes')
const {ACTIONS} = require('./actions')
const {deleteNodeReqs} = require('./utils.manifest')

function maintainRoleCreepsForNode (baseManifest, node, role, desired) {
  const currCount = getTypeCreeps(node, role).length
  const spawnCount = node.spawnReqCount ? node.spawnReqCount : 0
  const totalCount = currCount + spawnCount
  if (totalCount < desired) {
    node.spawnReqCount = node.spawnReqCount ? node.spawnReqCount + 1 : 1
    switch (node.type) {
      case 'src':
        //return baseManifest.spawn.unshift(node.id)
        return  baseManifest.spawn.push(node.id)
      default:
        return baseManifest.spawn.push(node.id)
    }
  } else if (spawnCount && totalCount > desired) {
    deleteNodeReqs(baseManifest, node.id,'spawn')
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

module.exports.destroyCreep = function(name) {
  let creepMemory = Memory.creeps[name]
  if (!creepMemory) {
    let manifest = Memory.manifests[creepMemory.base]
    if (creepMemory.actions?.length) {
      const actions = creepMemory.actions
      actions.forEach(action => {
        ACTIONS.global.finish({memory: creepMemory, name: name}, manifest, action)
      })
    }
    console.log('ERROR destroy creep ERROR: I need this nodeId', creepMemory.nodeId, JSON.stringify(creepMemory))
    removeCreepFromNode(creepMemory.nodeId, creepMemory.role, name)
  }
  delete Memory.creeps[name]
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
