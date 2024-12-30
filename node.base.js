const {runChildren, createNodePosition, getChildren, applyToChildren} = require('./utils.nodes')
const {log} = require('./utils.debug')
const {createStorageNode, deserializePos, serializePos, addNodeToParent} = require('./utils.memory')
const {getReqById, moveReq} = require('./utils.manifest')

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
function calcIncome (baseManifest) {
  let total = {income: 0, cost: 0, balance: 0, reserved: 0}
  Object.values(baseManifest.finance.income).forEach(amount => { total.income = total.income + amount })
  Object.values(baseManifest.finance.cost).forEach(amount => { total.cost = total.cost + amount })
  baseManifest.finance.total.income = total.income
  baseManifest.finance.total.cost = total.cost
  baseManifest.finance.total.balance = total.income - total.cost
}
/**
 * FINANCE
 */

function collectBuildSiteIds (baseManifest) {
  if (baseManifest.pending?.build?.length) {
    baseManifest.pending.build.forEach(buildReqId => {
      let buildReq = getReqById(baseManifest.build.pending, buildReqId)
      if (!buildReq.opts.siteId) {
        const lookRes = deserializePos(buildReq.opts.pos).lookFor(LOOK_CONSTRUCTION_SITES)
        if (lookRes?.length) {
          buildReq.opts.siteId = lookRes.find(item => item.structureType === buildReq.opts.structureType)?.id
            // moveReq(baseManifest.build, 'pending', buildReqId, 'do')
        }
      }
    })
  }
}
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
        /**
         * CREATE STORAGE NODE WHEN NEEDED
         */
        if (baseManifest?.finance?.total?.income && baseManifest.finance.total.income > 5) { // if good income
          if (!node.children.sto) { node.children.sto = [] }
          if (!node.children.sto.length) { // and we have not initialized a storage node
            let newStorageNode = createStorageNode(`sto-${node.children.sto.length}`) // make the node
            addNodeToParent(newStorageNode, node.id) // add it to this base
            node.stage = 1
          }
        }
        /**
         * END CREATE STORAGE NODE WHEN NEEDED
         */
        break
      case 1: // has storage node

        break
    }
    runChildren(node, lineage, baseManifest)
    calcIncome(baseManifest)



  } catch(e) {
    console.log('Error: failed to run Base Node', e.stack, node.id)
  }
}


