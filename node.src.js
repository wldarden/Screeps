const {runChildren, getTypeCreeps, getNodeReqs, getNodePos, getChildren} = require('./utils.nodes')
const {log} = require('./utils.debug')
const {deleteNodeReqs} = require('./utils.manifest')
const {creepPlanInfo, maintainRoleCreepsForNode} = require('./utils.creep')
const {addNodeToParent, buildNode} = require('./utils.memory')
const {PLANS} = require('./utils.plans')

function maxSrcMiners (src) {
  if (src.stage === 3) {
    return Object.keys(src.slots).length
  } else if (src.cps) {
    return Math.floor(Math.max(src.cps, 1) * Object.keys(src.slots).length)
  } else {
    return Object.keys(src.slots).length
  }
}

function threatSrc (node, baseManifest) {
  if (node.spawnReqCount) {
    deleteNodeReqs(baseManifest, node.id, 'spawn')
  }
  return true
}

function myContainerPos (node) {
  let gameNode = Game.getObjectById(node.id)
  const parent = Memory.nodes[node.parent]
  let stoPath = gameNode.pos.findPathTo(getNodePos(parent), {ignoreCreeps: true})
  if (stoPath?.length) {
    let pos
    if (stoPath[0].dx !== 0) {
      pos = {x: stoPath[0].x + stoPath[0].dx, y: stoPath[0].y, roomName: gameNode.pos.roomName }
    } else {
      pos = {x: stoPath[0].x, y: stoPath[0].y + stoPath[0].dy, roomName: gameNode.pos.roomName }
    }
    return pos
  }
}

function calcSrcROI (plan, dist) {
  // let plan = [CARRY, MOVE, WORK, CARRY, MOVE]
  const {cost, partCounts} = creepPlanInfo(plan)
  const loadCap = partCounts[CARRY] * 50
  const fullWeight = plan.length - partCounts[MOVE]
  const emptyWeight = (fullWeight - partCounts[CARRY]) || 1
  const ticksPerSpaceTo = Math.min(Math.ceil(emptyWeight / partCounts[MOVE]))
  const ticksPerSpaceFrom = Math.min(Math.ceil(fullWeight / partCounts[MOVE]))
  const workTicks = loadCap / (partCounts[WORK] * 2)
  const loadTicks = (ticksPerSpaceTo * dist) + (ticksPerSpaceFrom * dist) + workTicks
  const energyPerTick =  Math.min(loadCap / loadTicks, 10)
  const creepsPerSlot = Math.max( loadTicks / workTicks, 1)
  return {energyPerTick, creepsPerSlot}
}

function cleanPrimaryDests (node) {
  let newDests = []
  node.primaryDest.forEach(d => {
    if (Game.getObjectById(d) && !newDests.includes(d)) {
      newDests.push(d)
    }
  })
  node.primaryDest = newDests
}
const plans = PLANS.spawn

module.exports.run = function (node, lineage = [], baseManifest) {
  try {
    if (node.threat) {  // threat nodes are skipped
      return threatSrc(node, baseManifest)
    }
    const miners = getTypeCreeps(node, 'miner')
    const maxMiners = maxSrcMiners(node)
    //const saturation = miners.length / maxMiners
    //const nSlots = Object.keys(node.slots).length
    //const plannedSaturation = (getNodeReqs(node).length + miners.length) / maxMiners
    let mode = 'default'
    let plan
    if (node.dist && (!node.ept || !node.cps)) {
      const {energyPerTick, creepsPerSlot} = calcSrcROI(PLANS.spawn[mode].body, node.dist)
      node.ept = energyPerTick
      node.cps = creepsPerSlot
    }
    //if (node.parent) {
    //  const parent = Memory.nodes[node.parent]
    //  if (parent.type === STRUCTURE_CONTAINER) {
    //    node.stage = 3
    //  }
    //}
    const parent = Memory.nodes[node.parent]

    switch (node.stage) {
      default:
      case 0:
        if (!node.primaryDest) {
          let target = Game.getObjectById(node.id).pos.findClosestByPath(FIND_MY_SPAWNS, {maxOps: 500, ignoreCreeps: true})
          node.primaryDest = [target?.id]
        }
        if (parent && parent.type === 'log') {
          node.stage = 1
        }
        break
      case 1: // Begin containerizing

        if (parent && parent.type === 'log') {
          let pos = myContainerPos(node)
          if (pos) {
            buildNode(node.id, STRUCTURE_CONTAINER, pos, 6)
            node.stage = 2
          }
        }
        break
      case 2:// Wait for containerization to complete
        mode = 'containerized'
        if (node.dist !== 1) {
          const {energyPerTick, creepsPerSlot} = calcSrcROI(PLANS.spawn[mode].body, 1)
          node.dist = 1
          node.ept = energyPerTick
          node.cps = creepsPerSlot
        }
        if (node.children?.build?.length) {
          cleanPrimaryDests(node)
          node.children.build.forEach(b => {
            if (!node.primaryDest.includes(b)) {
              if (node.dist > 10) {
                node.primaryDest.unshift(b)
              } else {
                node.primaryDest.push(b)
              }
            }
          })
        }
        let containers = getChildren(node, [STRUCTURE_CONTAINER], undefined, false, 1)
        if (containers.length) { // we completed our container node. swap places and move to stage 3
          cleanPrimaryDests(node)
          let cont = containers[0]
          cont.subType = 'src'
          const contId = cont.id
          node.stage = 3
          addNodeToParent(cont, node.parent) // move container to parent
          node.containerId = contId
          delete node.parent
          addNodeToParent(node, contId) // move this src to container
          node.primaryDest.unshift(contId)
        }
        break
      case 3: // containerized src
        if (node.containerId && node.parent !== node.containerId) {
          addNodeToParent(node, node.containerId) // move this src to container
        }
        mode = 'containerized'
        break
    }

    /**
     * Everything below here depends on the configs set above.
     */
    maintainRoleCreepsForNode(baseManifest, node, PLANS.spawn[mode].role, maxMiners, 2, 8)

    baseManifest.finance.income[node.id] = node.ept * miners.length
    baseManifest.finance.cost[node.id] = ((300/1500) * miners.length)
    runChildren(node, lineage, baseManifest)

  } catch(e) {
    log(Memory.nodes[node.id], ['ERROR', 'SRC_NODE'])
    console.log('Error: failed to run Source Node', e.stack, node.id)
  }
}


