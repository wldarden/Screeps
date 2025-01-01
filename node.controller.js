const {runChildren, getTypeCreeps, getNodeReqs, getChildren} = require('./utils.nodes')
const {log} = require('./utils.debug')
const {serializeBody} = require('./utils.memory')
const {maintainRoleCreepsForNode} = require('./utils.creep')

function maxUpgraderCreeps (node) {
  return 2
}

const upgraderSpawnPriority = .2
module.exports.run = function (node, lineage = [], baseManifest) {
  try {
    log(node, ['CONTROLLER_NODE', 'NODE'])
    runChildren(node, lineage)
    if (!baseManifest?.finance?.total?.income) {
      return
    }
    const maxUpgraders = maxUpgraderCreeps(node)
    if (node.parent && (
      (node.initSrcTime && node.initSrcTime < Game.time) || !node.primarySrc)
    ) {
      node.primarySrc = []
      let parent = Memory.nodes[node.parent]
      if (parent && parent.type === 'base') {
        let logContainers = getChildren(parent, [STRUCTURE_CONTAINER, 'log'], (child) => {
          return child.type === STRUCTURE_CONTAINER && (!child.subType || child.subType === 'log')
        }, true)
        if (logContainers?.length) {
          node.primarySrc = logContainers
          delete node.initSrcTime
        } else {
          node.initSrcTime = Game.time + 20
        }
      }
    }

    if (node.primarySrc?.length && baseManifest.finance.total.income > 3 && baseManifest.finance.total.balance > 0) {
      //let plan = [WORK, CARRY, MOVE]
      // we have no upgrade creeps! request some
      maintainRoleCreepsForNode(baseManifest, node, 'upgrader', maxUpgraders, 1, 7)
      //const newRequest = {
      //  pri: upgraderSpawnPriority, requestor: node.id, assignee: [], status: 'new', type: 'spawn',
      //  opts: {role: 'upgrader', plan: serializeBody(plan)}
      //}
      //if (!node.reqs) { node.reqs = [] }
    }
  } catch(e) {
    log(node)
    console.log('Error: failed to run Controller Node', e.stack)
  }
}


