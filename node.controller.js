const {runChildren, getTypeCreeps, getNodeReqs} = require('./utils.nodes')
const {log} = require('./utils.debug')
const {serializeBody} = require('./utils.memory')
const {addSpawnRequest} = require('./utils.manifest')
const {maintainRoleCreepsForNode} = require('./utils.creep')

function maxUpgraderCreeps (node) {
  return 1
}

const upgraderSpawnPriority = .2
module.exports.run = function (node, lineage = [], baseManifest) {
  try {
    log(node, ['CONTROLLER_NODE', 'NODE'])
    runChildren(node, lineage)
    if (!baseManifest?.finance?.total?.income) {
      return
    }
    const upgraders = getTypeCreeps(node, 'upgrader') || []
    const maxUpgraders = maxUpgraderCreeps(node)


    if (baseManifest.finance.total.income > 3 && baseManifest.finance.total.balance > 0) {
      //let plan = [WORK, CARRY, MOVE]
      // we have no upgrade creeps! request some
      maintainRoleCreepsForNode(baseManifest, node, 'upgrader', maxUpgraders, 1, 7)
      //const newRequest = {
      //  pri: upgraderSpawnPriority, requestor: node.id, assignee: [], status: 'new', type: 'spawn',
      //  opts: {role: 'upgrader', plan: serializeBody(plan)}
      //}
      //if (!node.reqs) { node.reqs = [] }
      //  node.reqs.push(addSpawnRequest(baseManifest, newRequest))
    }
  } catch(e) {
    log(node)
    console.log('Error: failed to run Controller Node', e.stack)
  }
}


