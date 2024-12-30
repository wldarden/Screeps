const {runChildren, getTypeCreeps, getNodeReqs, getNodePos, getChildren} = require('./utils.nodes')
const {log} = require('./utils.debug')
const {addSpawnRequest, deleteReq} = require('./utils.manifest')
const {creepPlanInfo, ticksPerSpace} = require('./utils.creep')
const {serializeBody, createContainerNode, addNodeToParent} = require('./utils.memory')

function maxSrcMiners (src) {
  if (src.cps) {
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
  init: {
    plan: [CARRY, MOVE, WORK, CARRY, MOVE],
    role: 'miner',
    saturation: 1
  },
}
const CONTAINERIZED_PLAN = [WORK, WORK, MOVE, CARRY]
module.exports.run = function (node, lineage = [], baseManifest) {
  try {
    if (node.threat) {  // threat nodes are skipped
      return threatSrc(node, baseManifest)
    }
    const miners = getTypeCreeps(node, 'miner')
    const maxMiners = maxSrcMiners(node)
    const saturation = miners.length / maxMiners
    const nSlots = Object.keys(node.slots).length
    const plannedSaturation = (getNodeReqs(node).length + miners.length) / maxMiners
    let mode = 'init'
    let plan
    switch (node.stage) {
      default:
      case 0:
        node.stage = 0
        mode = 'init'
        break
      case 1: // containerizing
        plan = plans.init.plan
        const parent = Memory.nodes[node.parent]
        if (parent && parent.type === 'sto') {
          // do containerization
          let gameNode = Game.getObjectById(node.id)
          let stoPath = gameNode.pos.findPathTo(getNodePos(parent), {ignoreCreeps: true})
          if (stoPath?.length) {
            let pos
            if (stoPath[0].dx !== 0) {
              pos = {x: stoPath[0].x + stoPath[0].dx, y: stoPath[0].y, roomName: gameNode.pos.roomName }
            } else {
              pos = {x: stoPath[0].x, y: stoPath[0].y + stoPath[0].dy, roomName: gameNode.pos.roomName }
            }
            if (pos) {
              const containers = getChildren(node, [STRUCTURE_CONTAINER])
              if (containers.length === 0) {
                let containerNode = createContainerNode(`${node.id}-new-container`, pos)
                addNodeToParent(containerNode, node.id)
                node.stage++
              }
            }
          }
        }
        break
      case 2:
        plan = plans.init.plan
        const cId = node.children[STORAGE_CONTAINER][0]
        const contNode = Memory.nodes[cId]
        if (contNode.stage >= 3) { // container is built and ready.
            node.stage++
        }
        break
      case 3: // containerized src
        plan = CONTAINERIZED_PLAN
        break
    }

    /**
     * Everything below here depends on the configs set above.
     */
    if (plannedSaturation < 1 && node.reqs.length < nSlots) {
      const {energyPerTick, creepsPerSlot} = calcSrcROI(plans[mode].plan, node.dist)
      node.ept = energyPerTick
      node.cps = creepsPerSlot
      const spawnMinerPriority = (1 - saturation) * node.ept
      const newRequest = {
        pri: spawnMinerPriority, requestor: node.id, assignee: [], status: 'new', type: 'spawn',
        opts: {role: 'miner', plan: serializeBody(plans[mode].plan)}
      }
      node.reqs.push(addSpawnRequest(baseManifest, newRequest))
    }


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


