const {runChildren, getTypeCreeps, getNodeReqs, getNodePos, getChildren} = require('./utils.nodes')
const {log} = require('./utils.debug')
const {deleteReq} = require('./utils.manifest')
const {creepPlanInfo, maintainRoleCreepsForNode} = require('./utils.creep')
const {addNodeToParent, buildNode} = require('./utils.memory')

function maxSrcMiners (src) {
  if (src.stage === 3) {
    return Object.keys(src.slots).length
  } else if (src.cps) {
    return Math.floor(Math.max(src.cps, 1) * Object.keys(src.slots).length)
  } else {
    return Object.keys(src.slots).length
  }
}

function threatSrc (src, baseManifest) {
  if (src.reqs) {
    src.reqs.forEach(reqId => { deleteReq(baseManifest, reqId)})
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
const plans = {
  default: {
    plan: [CARRY, MOVE, WORK, CARRY, MOVE],
    role: 'miner',
    saturation: 1
  },
  containerized: {
    plan: [WORK, WORK, MOVE, CARRY],
    role: 'miner',
  }
}
const CONTAINERIZED_PLAN = [WORK, WORK, MOVE, CARRY]
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
      const {energyPerTick, creepsPerSlot} = calcSrcROI(plans[mode].plan, node.dist)
      node.ept = energyPerTick
      node.cps = creepsPerSlot
    }
    //if (node.parent) {
    //  const parent = Memory.nodes[node.parent]
    //  if (parent.type === STRUCTURE_CONTAINER) {
    //    node.stage = 3
    //  }
    //}
    switch (node.stage) {
      default:
        node.stage = 0
        break
      case 0:

        break
      case 1: // Begin containerizing
        const parent = Memory.nodes[node.parent]
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
          const {energyPerTick, creepsPerSlot} = calcSrcROI(plans[mode].plan, 1)
          node.dist = 1
          node.ept = energyPerTick
          node.cps = creepsPerSlot
        }

        let containers = getChildren(node, [STRUCTURE_CONTAINER], undefined, false, 1)
        if (containers.length) { // we completed our container node. swap places and move to stage 3
          let cont = containers[0]
          cont.subType = 'src'
          const contId = cont.id
          node.stage = 3
          addNodeToParent(cont, node.parent) // move container to parent
          addNodeToParent(node, contId) // move this src to container
        }
        break
      case 3: // containerized src
        mode = 'containerized'
        break
    }

    /**
     * Everything below here depends on the configs set above.
     */
    maintainRoleCreepsForNode(baseManifest, node, plans[mode].role, maxMiners, 2, 8)
    //if (plannedSaturation < 1 && node.reqs.length < nSlots) {
    //  const {energyPerTick, creepsPerSlot} = calcSrcROI(plans[mode].plan, node.dist)
    //  node.ept = energyPerTick
    //  node.cps = creepsPerSlot
    //  const spawnMinerPriority = (1 - saturation) * node.ept
    //  const newRequest = {
    //    pri: spawnMinerPriority, requestor: node.id, assignee: [], status: 'new', type: 'spawn',
    //    opts: {role: plans[mode].role , subRole: plans[mode].subRole, plan: serializeBody(plans[mode].plan)}
    //  }
    //  node.reqs.push(addSpawnRequest(baseManifest, newRequest))
    //}


    // let newReqs = []
    // node.reqs.forEach(reqId => {
    //     if (baseManifest.requests[reqId]) {
    //         switch (baseManifest.requests[reqId].status) {
    //             case 'done':
    //                 deleteReq(baseManifest, reqId)
    //         }
    //     }
    // })

    node.reqs = node.reqs.filter(reqId => !!baseManifest.requests[reqId])
    baseManifest.finance.income[node.id] = node.ept * miners.length
    baseManifest.finance.cost[node.id] = ((300/1500) * miners.length)
    runChildren(node, lineage, baseManifest)

  } catch(e) {
    log(Memory.nodes[node.id], ['ERROR', 'SRC_NODE'])
    console.log('Error: failed to run Source Node', e.stack, node.id)
  }
}


