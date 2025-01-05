const {runChildren, createNodePosition, getChildren, applyToChildren, getNewStorageNodeSiteByDest, addNodeToParent} = require('./utils.nodes')
const {log} = require('./utils.debug')
const {createStorageNode, deserializePos, serializePos} = require('./utils.memory')
const {getReqById} = require('./utils.manifest')

/**
 * FINANCE
 */
function createIncome (baseManifest) {
  if (baseManifest?.finance?.total?.reserved) { return } // escape early if already init
  if (!baseManifest.finance) {baseManifest.finance = {} }
  if (!baseManifest.finance.income) { baseManifest.finance.income = {} }
  if (!baseManifest.finance.cost) { baseManifest.finance.cost = {} }
  if (!baseManifest.finance.total) { baseManifest.finance.total = {} }
  if (!baseManifest.finance.total.income) { baseManifest.finance.total.income = 0 }
  if (!baseManifest.finance.total.cost) { baseManifest.finance.total.cost = 0 }
  if (!baseManifest.finance.total.balance) { baseManifest.finance.total.balance = 0 }
  if (!baseManifest.finance.total.reserved) { baseManifest.finance.total.reserved = 0 }
}
/**
 * FINANCE
 */
function calcIncome (baseManifest, node) {
  let total = {income: 0, cost: 0, balance: 0, reserved: 0}
  Object.values(baseManifest.finance.income).forEach(amount => { total.income = total.income + amount })
  Object.values(baseManifest.finance.cost).forEach(amount => { total.cost = total.cost + amount })
  baseManifest.finance.total.income = total.income
  baseManifest.finance.total.cost = total.cost
  baseManifest.finance.total.balance = total.income - total.cost
  baseManifest.baseSrcEnergy = 0
  if (node.srcs) {
    Object.keys(node.srcs).forEach(sId => {
      baseManifest.baseSrcEnergy = baseManifest.baseSrcEnergy + node.srcs[sId]
    })
  }
}
/**
 * FINANCE
 */

/**
 * BUILDER
 */
module.exports.runBase = function (node, lineage = []) {
  try {
    let baseManifest = Memory.manifests[node.id]
    switch (node.stage) {
      default:
      case 0:
        node.stage = 0
        Memory.workers = {}
        /**
         * CREATE LOGISTIC NODE WHEN NEEDED
         */
        //if (baseManifest?.finance?.total?.income && baseManifest.finance.total.income > 5) { // if good income
        //  if (!node.children.log) { node.children.log = [] }
        //  if (!node.children.log.length) { // and we have not initialized a storage node
        //    let newStorageNode = createStorageNode(`log-${node.children.log.length}`) // make the node
        //    addNodeToParent(newStorageNode, node.id) // add it to this base
        //    node.stage = 1
        //  }
        //}
        /**
         * END CREATE LOGISTIC NODE WHEN NEEDED
         */
        break
      case 1: // has logistics node
        if (!node.children?.maint?.length) {
          addNodeToParent({
            parent: null,
            id: 'maint-0',
            type: 'maint',
            stage: 0,
            creeps: {},
          }, node.id)
        }
        node.stage = 2
        break
    }

    baseManifest.roomEnergyFrac = Game.rooms[node.id].energyAvailable / Game.rooms[node.id].energyCapacityAvailable
    runChildren(node, lineage, baseManifest)

    calcIncome(baseManifest, node)



  } catch(e) {
    console.log('Error: failed to run Base Node', e.stack, node.id, e)
  }
}


