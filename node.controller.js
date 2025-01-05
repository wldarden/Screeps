const {runChildren, getTypeCreeps, getNodeReqs, getChildren} = require('./utils.nodes')
const {log} = require('./utils.debug')
const {serializeBody} = require('./utils.memory')
const {maintainRoleCreepsForNode} = require('./utils.creep')

const MAX_MOD = {
  0: 1000,
  1: 950
}
function maxUpgraderCreeps (node, lineage, baseManifest) {
  if (baseManifest.baseSrcEnergy) {
    //let currentUpgraders = getTypeCreeps(node, 'upgrader')
    return Math.round(baseManifest.baseSrcEnergy / 1000) // this is 1-4 at 2000
    /**
     * if we already have 2 and at max, add 1.
     * if we already have 4 and at max, add 2
     */
    //return Math.round(baseManifest.baseSrcEnergy / (1000 - (100 * currentUpgraders.length)))
  } else {
    return 0
  }
  //let parent = Memory.nodes[node.parent]
  //let controller = Game.getObjectById(node.id)
  ////let res = 3
  ////return res
  //return controller.level >=2 ? 1 : 3
  //if (parent && parent.stage === 1) {
  //  let gameCon = Game.getObjectById(node.id)
  //  switch (gameCon.level) {
  //    default:
  //      res = 0
  //      break
  //    case 0:
  //      res = 0
  //      break
  //    case 1:
  //      res = 1
  //      break
  //    case 2:
  //      res = 2
  //      break
  //  }
  //  if (baseManifest.roomEnergyFrac === 1) {
  //    //res = res + 1
  //  }
  //}
  //return res
}

//const upgraderSpawnPriority = .2
module.exports.run = function (node, lineage = [], baseManifest) {
  try {
    //switch (node.stage) {
    //  default:
    //  case 0:
    //    break
    //}
    const maxUpgraders = maxUpgraderCreeps(node, lineage, baseManifest)

    if (baseManifest.finance.total.income > 3 && baseManifest.finance.total.balance > 0) {
      maintainRoleCreepsForNode(baseManifest, node, 'upgrader', maxUpgraders)
    }
    runChildren(node, lineage)
  } catch(e) {
    log(node)
    console.log('Error: failed to run Controller Node', e.stack)
  }
}


