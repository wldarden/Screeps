const {runChildren, getTypeCreeps, getNodePos, addNodeToParent, getChildren, buildNode} = require('./utils.nodes')
const {log} = require('./utils.debug')
const {deleteNodeReqs} = require('./utils.manifest')
const {creepPlanInfo, maintainRoleCreepsForNode} = require('./utils.creep')
const {PLANS} = require('./utils.plans')
const {spawnForNode} = require('./utils.spawner')

function maxSrcMiners (src, baseManifest) {
  //if (baseManifest.totalEpt > 10 && baseManifest.spawnCapacity > 300 && src.maxMiners) {
  //  return src.maxMiners
  //}
  return Object.keys(src.slots).length
  if (src.stage === 3) {
    return Object.keys(src.slots).length
  } else if (src.cps) {
    return Math.floor(Math.max(src.cps, 1) * Object.keys(src.slots).length)
  } else {
    return Object.keys(src.slots).length
  }
}

function threatSrc (node, baseManifest) {
  if (!node.cleaned) {
    deleteNodeReqs(baseManifest, node, 'spawn')
    node.cleaned = true
  }
  return true
}

function myContainerPos (node) {
  let gameNode = Game.getObjectById(node.id)
  const parent = Memory.nodes[node.parent]
  let stoPath = gameNode.pos.findPathTo(getNodePos(parent), {ignoreCreeps: true})
  if (stoPath.length) {
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
    if (node.threat) { return threatSrc(node, baseManifest) } // threat nodes are skipped
    const miners = getTypeCreeps(node, 'miner')
    const maxMiners = maxSrcMiners(node, baseManifest)
    const saturation = miners.length / maxMiners
    let mode = 'default'
    const parent = Memory.nodes[node.parent]
    switch (node.stage) {
      default:
      case 0:
        if (parent && parent.type === 'log') {
          node.stage = 1
        }
        if (saturation >= 1 && Object.keys(node.slots).length > 2) {
          node.stage = 1
        }
        break
      case 1: // Begin containerizing
        if (parent) {
          let pos = myContainerPos(node)
          if (pos) {
            buildNode(node.id, STRUCTURE_CONTAINER, pos, {subType: 'src'})
            node.stage = 2
          }
        }
        break
      case 2:// Wait for containerization to complete
        mode = 'containerized'
        let containers = getChildren(node, [STRUCTURE_CONTAINER], undefined, false, 1)
        if (containers.length) { // we completed our container node. swap places and move to stage 3
          let cont = containers[0]
          cont.subType = 'src'
          const contId = cont.id
          node.stage = 3
          addNodeToParent(cont, node.parent) // move container to parent
          node.containerId = contId
          addNodeToParent(node, contId) // move this src to container
        }
        break
      case 3: // containerized src
        if (node.containerId && node.parent !== node.containerId) {
          addNodeToParent(node, node.containerId) // move this src to container
        }
        //delete node.dests[node.containerId]
        mode = 'containerized'
        break
    }
    //node.recalcEpt = true
    if (!node.ept || !node.cps || node.totalEpt === undefined || node.recalcEpt) {
      const mySpawnReq = spawnForNode(node.id, baseManifest.spawnCapacity)
      const {energyPerTick, creepsPerSlot} = calcSrcROI(mySpawnReq.body, node.dist)
      node.ept = energyPerTick
      node.cps = node.stage === 3 ? 1 : creepsPerSlot
      const nCreeps = node.creeps.miner.length || 0
      console.log('recalced src ept',node.id, Math.min(10, (nCreeps * energyPerTick)), (nCreeps * energyPerTick),  nCreeps, nCreeps, energyPerTick, node.dist)
      node.totalEpt = Math.min(10, (nCreeps * energyPerTick))
      //let workParts = 0
      //mySpawnReq.body.forEach(part => {
      //  if (part === WORK) {
      //    workParts++
      //  }
      //})
      //node.maxMiners = Math.round(6 / workParts)
      lineage.forEach(id => {
        Memory.nodes[id].recalcEpt = true
      })
      delete node.recalcEpt
    }
    /**
     * Everything below here depends on the configs set above.
     */
    maintainRoleCreepsForNode(baseManifest, node, 'miner', maxMiners)
    runChildren(node, lineage, baseManifest)

  } catch(e) {
    log(Memory.nodes[node.id], ['ERROR', 'SRC_NODE'])
    console.log('Error: failed to run Source Node', e.stack, node.id)
  }
}


