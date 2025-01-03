const {runChildren, getTypeCreeps, getNodeReqs, getChildren} = require('./utils.nodes')
const {log} = require('./utils.debug')
const {serializeBody} = require('./utils.memory')
const {maintainRoleCreepsForNode} = require('./utils.creep')

function maxUpgraderCreeps (node, lineage, baseManifest) {
  let parent = Memory.nodes[node.parent]
  let controller = Game.getObjectById(node.id)
  let res = 0
  return controller.level >=2 ? 1 : 3
  if (parent && parent.stage === 1) {
    let gameCon = Game.getObjectById(node.id)
    switch (gameCon.level) {
      default:
        res = 0
        break
      case 0:
        res = 0
        break
      case 1:
        res = 1
        break
      case 2:
        res = 2
        break
    }
    if (baseManifest.roomEnergyFrac === 1) {
      //res = res + 1
    }
  }
  return res
}

const upgraderSpawnPriority = .2
module.exports.run = function (node, lineage = [], baseManifest) {
  try {
    switch (node.stage) {
      default:
      case 0:
        if (!node.primarySrc?.length) {
          node.primarySrc = []
          node.primarySrc = [node.parent]
        }
        break
    }
    const maxUpgraders = maxUpgraderCreeps(node, lineage, baseManifest)

    if (baseManifest.finance.total.income > 3 && baseManifest.finance.total.balance > 0) {
      maintainRoleCreepsForNode(baseManifest, node, 'upgrader', maxUpgraders, 1, 7)
    }
    runChildren(node, lineage)
    //if (!baseManifest?.finance?.total?.income) {
    //  return
    //}
    //if (node.parent && (
    //  (node.initSrcTime && node.initSrcTime < Game.time) || !node.primarySrc)
    //) {
    //
    //
    //  let parent = Memory.nodes[node.parent]
    //  if (parent && parent.type === 'base') {
    //    let logContainers = getChildren(parent, [STRUCTURE_CONTAINER, 'log'], (child) => {
    //      return child.type === STRUCTURE_CONTAINER && (!child.subType || child.subType === 'log')
    //    }, true)
    //    if (logContainers?.length) {
    //      node.primarySrc = logContainers
    //      delete node.initSrcTime
    //    } else {
    //      node.initSrcTime = Game.time + 20
    //    }
    //  }
    //}
    //
    //if (baseManifest.finance.total.income > 3 && baseManifest.finance.total.balance > 0) {
    //  //let plan = [WORK, CARRY, MOVE]
    //  // we have no upgrade creeps! request some
    //  maintainRoleCreepsForNode(baseManifest, node, 'upgrader', maxUpgraders, 1, 7)
    //  //const newRequest = {
    //  //  pri: upgraderSpawnPriority, requestor: node.id, assignee: [], status: 'new', type: 'spawn',
    //  //  opts: {role: 'upgrader', plan: serializeBody(plan)}
    //  //}
    //  //if (!node.reqs) { node.reqs = [] }
    //}
  } catch(e) {
    log(node)
    console.log('Error: failed to run Controller Node', e.stack)
  }
}


