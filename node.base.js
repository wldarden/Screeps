const {runChildren, getChildren, addNodeToParent} = require('./utils.nodes')
const {createStorageNode} = require('./utils.memory')

function calcIncome (baseManifest, node) {
  let total = {income: 0, cost: 0, balance: 0, reserved: 0}
  Object.values(baseManifest.finance.income).forEach(amount => { total.income = total.income + amount })
  Object.values(baseManifest.finance.cost).forEach(amount => { total.cost = total.cost + amount })
  baseManifest.finance.total.income = total.income
  baseManifest.finance.total.cost = total.cost
  baseManifest.finance.total.balance = total.income - total.cost
  baseManifest.baseSrcEnergy = 0
  baseManifest.totalEpt = 0
  //let allChildren = getChildren(node, [], undefined, false, 1)
  //allChildren.forEach(child => {
  //  if (child.totalEpt) {
  //    baseManifest.totalEpt = baseManifest.totalEpt + child.totalEpt
  //  }
  //})
  //if (node.srcs) {
  //  Object.keys(node.srcs).forEach(sId => {
  //    baseManifest.baseSrcEnergy = baseManifest.baseSrcEnergy + node.srcs[sId]
  //  })
  //}
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
    Memory.workers = {}
    switch (node.stage) {
      default:
        console.log('Error: unhandled Base stage: ', node.stage)
        break
      case undefined:
      case 0:
        node.stage = 0

        /**
         * CREATE LOGISTIC NODE WHEN NEEDED
         */

        if (baseManifest.baseSrcEnergy && baseManifest.baseSrcEnergy > 350 && node.children?.container?.length === 2) {
          if (!node.children.log) { node.children.log = [] }
          if (!node.children.log.length) { // and we have not initialized a storage node
            let servicedSrcs = getChildren(node, [STRUCTURE_CONTAINER], (child) => child.subType === 'src', true)
            let i = 0
            while (Memory.nodes[`log-${i}`]) {
              i++
            }
            let newStorageNode = createStorageNode(`log-${i}`, servicedSrcs) // make the node
            node.stage = 1
            addNodeToParent(newStorageNode, node.id) // add it to this base

          }
        }
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
      case 2:
        break
    }

    baseManifest.roomEnergyFrac = Game.rooms[node.id].energyAvailable / Game.rooms[node.id].energyCapacityAvailable
    runChildren(node, lineage, baseManifest)

    ////calcIncome(baseManifest, node)
    //const allChildren= getChildren(node, [], undefined, false, 1)
    //let eptSrc = 0
    //allChildren.forEach(c => {
    //  if (c.totalEpt) {
    //    eptSrc = eptSrc + c.totalEpt
    //  }
    //})
    //node.totalEpt = eptSrc
    if (!baseManifest.totalEpt || node.recalcEpt) {
      const prevEpt = baseManifest.totalEpt
      baseManifest.totalEpt = 0
      let allChildren = getChildren(node, [], undefined, false, 1)
      allChildren.forEach(child => {
        if (child.totalEpt) {
          baseManifest.totalEpt = baseManifest.totalEpt + child.totalEpt
        }
      })
      console.log('recalced base node ept', node.id, prevEpt, '=>', baseManifest.totalEpt)

      delete node.recalcEpt
    }
    baseManifest.baseSrcEnergy = 0
    if (node.srcs) {
      Object.keys(node.srcs).forEach(sId => {
        baseManifest.baseSrcEnergy = baseManifest.baseSrcEnergy + node.srcs[sId]
      })
    }
  } catch(e) {
    console.log('Error: failed to run Base Node', e.stack, node.id, e)
  }
}


