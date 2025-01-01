/**
 * A Harvest Job looks like this:
 *
 * harvestJob: {
 *                 type: 'harvest',
 *                 id: `source_${source.id}_${i}`,
 *                 target: source.id,
 *                 roles: ['harvester', 'peon'],
 *                 reserved: true,
 *                 reserver: 'creepName',
 *
 *
 *             }
 */

// OK	0
// The operation has been scheduled successfully.
//
//   ERR_NOT_OWNER	-1
// You are not the owner of this creep, or the room controller is owned or reserved by another player.
//
//   ERR_BUSY	-4
// The creep is still being spawned.
//
//   ERR_NOT_FOUND	-5
// Extractor not found. You must build an extractor structure to harvest minerals. Learn more
//
// ERR_NOT_ENOUGH_RESOURCES	-6
// The target does not contain any harvestable energy or mineral.
//
//   ERR_INVALID_TARGET	-7
// The target is not a valid source or mineral object.
//
//   ERR_NOT_IN_RANGE	-9
// The target is too far away.
//
//   ERR_TIRED	-11
// The extractor or the deposit is still cooling down.
//
//   ERR_NO_BODYPART	-12
// There are no WORK body parts in this creep’s body.
//

const {ACTIONS, DONE} = require('./actions')
const {containerized} = require('./utils.source')
const {log} = require('./utils.debug')
const {energy, useEnergyReq} = require('./utils.manifest')
const {getChildren} = require('./utils.nodes')
const {deserializePos} = require('./utils.memory')

function findLogSrcFor (trgId, nodes) {
  if (nodes.length) {
    let best
    let bestEnergy = 0
    nodes.forEach(n => {
      if (n !== trgId) {
        let gameNode = Game.getObjectById(n)
        if (gameNode) {
          let thisEnergy = gameNode.store.getUsedCapacity(RESOURCE_ENERGY)
          if (thisEnergy) {
            if (!best || bestEnergy < thisEnergy) {
              best = n
              bestEnergy = thisEnergy
            }
            return true
          }
        } else {
          console.log('Error: node was not a gameNode: ', n)
        }
      }
    })
    return best
  }
}
function findLogDestAmong (nodes) {
  if (nodes.length) {
    let best
    let bestType
    let bestCapacity = 0
    nodes.forEach(n => {
      let gameNode = Game.getObjectById(n)
      if (gameNode) {
        let thisCapacity = gameNode.store.getFreeCapacity(RESOURCE_ENERGY)
        let thisType = Memory.nodes[n].type
        if (thisCapacity) {
          if (
            !best || (
              (thisType === 'spawn' && bestType !== 'spawn' && thisCapacity > 0) || // this is spawn and best is not and this needs energy
              (thisType === bestType || bestCapacity < thisCapacity) // this and best are same type and this needs more energy
            )
          ) {
            best = n
            bestCapacity = thisCapacity
            bestType = Memory.nodes[n].type
          }
          return true
        }
      } else {
        console.log('Error: node was not a gameNode: ', n)
      }
    })
    return best
  }
}

function findSupplierTrg (creep) {
  let trgType
  let logNode = Memory.nodes[creep.memory.nodeId]
  let logParent = Memory.nodes[logNode.parent]
  let logContainers
  let criticalNodes = getChildren(logParent, ['spawn', STRUCTURE_EXTENSION], undefined,true)
  let trg
  if (criticalNodes.length) {
    trg = findLogDestAmong(criticalNodes)
    trgType = 'struct'
  }
  if (!trg) {
    logContainers = getChildren(logNode, [STRUCTURE_CONTAINER], (node) => node.subType !== 'src', true)
    trg = findLogDestAmong(logContainers)
    trgType = 'cont'
  }
  return trg ? {trg: trg, trgType: trgType} : null
}

function findLogContainer (creep) {
  let logNode = Memory.nodes[creep.memory.nodeId]
  let logContainers = getChildren(logNode, [STRUCTURE_CONTAINER], (node) => node.subType !== 'src', true)
  return findLogSrcFor(undefined, logContainers)
}
function findSrcContainer (creep) {
  let logNode = Memory.nodes[creep.memory.nodeId]
  let srcContainers = getChildren(logNode, [STRUCTURE_CONTAINER], (node) => node.subType === 'src', true)
  return findLogSrcFor(undefined, srcContainers)
}
module.exports.run = function (creep, manifest) {
  try {
    const energy = creep.store.getUsedCapacity()
    let logNode = Memory.nodes[creep.memory.nodeId]
    if (energy >= 25) {
      let newTrg = findSupplierTrg(creep)
      if (newTrg) {
        ACTIONS.transfer.start(creep, newTrg.trg)
      return                    // ^^^ SOME ENERGY && DEST EXISTS => FILL DEST
      } else if (creep.store.getFreeCapacity()) {     // <= NO DEST ANYWHERE && NOT FULL
        let srcContainers = getChildren(logNode, [STRUCTURE_CONTAINER], (node) => node.subType === 'src', true)
        let srcTrg = findLogSrcFor(undefined, srcContainers)
        if (srcTrg) {
          ACTIONS.withdraw.start(creep, srcTrg)
          return                // ^^^ NO DEST ANYWHERE && NOT FULL  => FILL FROM SRC CONTAINER
        }
                                                      // <= NO SRC && NOT FULL
      }
      creep.moveTo(deserializePos(logNode.pos), {range: 4, visualizePathStyle: {stroke: '#00ff00'}})
      return                    // ^^^ NO DEST && (FULL || NO SRC) => RETURN TO LOGISTIC NODE
    } else {

      let newTrg = findSupplierTrg(creep) // get what needs energy now.
      let srcTrg
      let srcType
      switch (newTrg?.trgType) {
        case 'struct':          // EMPTY && AVAILABLE DEST IS STRUCT => FILL FROM [LOG, SRC]
          srcTrg = findLogContainer(creep)
          srcType = 'log'       // 1 ^^^ EMPTY && AVAILABLE DEST IS STRUCT => FILL FROM [LOG]
          if (!srcTrg) {
            srcTrg = findSrcContainer(creep)
            srcType = 'src'     // 2 ^^^ EMPTY && NO LOG SRC => FILL FROM [SRC]
          }
          break
        default:                // EMPTY && NO AVAILABLE DEST => FILL FROM [SRC]
        case 'cont':            // EMPTY && AVAILABLE DEST IS LOG => FILL FROM [SRC]
          srcTrg = findSrcContainer(creep)
          srcType = 'src'       // 3 ^^^ EMPTY && (NO AVAILABLE DEST || AVAILABLE DEST IS LOG) => FILL FROM [SRC]
          break
      }
      if (srcTrg) {
        ACTIONS.withdraw.start(creep, srcTrg)
        return
      } else {
        creep.moveTo(deserializePos(logNode.pos), {range: 4, visualizePathStyle: {stroke: '#ff0000'}})
        return                  // 4 ^^^ EMPTY && NO SRC => MOVE TO SRC NODES
      }

    }

    return

    //
    //// find fill trg, then find src for that fill trg.
    //if (!creep.memory.fillTrg) {
    //  let trgType
    //  let logNode = Memory.nodes[creep.memory.nodeId]
    //  let logParent = Memory.nodes[logNode.parent]
    //  let logContainers
    //  let criticalNodes = getChildren(logParent, ['spawn', STRUCTURE_EXTENSION], undefined,true)
    //  let trg
    //  if (criticalNodes.length) {
    //    trg = findLogDestAmong(criticalNodes)
    //    trgType = 'struct'
    //  }
    //  if (!trg) {
    //    logContainers = getChildren(logNode, [STRUCTURE_CONTAINER], (node) => node.subType !== 'src', true)
    //    trg = findLogDestAmong(logContainers)
    //    trgType = 'cont'
    //  }
    //  let srcTrg
    //  if (trgType === 'struct') { // find container to src from
    //    if (!logContainers) {
    //      logContainers = getChildren(logNode, [STRUCTURE_CONTAINER], (node) => node.subType !== 'src', true)
    //    }
    //    srcTrg = findLogSrcFor(trg, logContainers)
    //  }
    //  if (!srcTrg) {
    //    let srcContainers = getChildren(logNode, [STRUCTURE_CONTAINER], (node) => node.subType === 'src', true)
    //    srcTrg = findLogSrcFor(trg, srcContainers)
    //  }
    //  creep.memory.srcTrg = srcTrg
    //  creep.memory.fillTrg = trg
    //  if (trg) {
    //    ACTIONS.transfer.start(creep, trg)
    //    //useEnergyReq(manifest, creep, {id: trg, type: 'dest'})
    //  } else {
    //    console.log('Damn. supplier node was not able to start transfer job')
    //  }
    //}




    //const energyNeeded = creep.store.getFreeCapacity()
    //if (energyNeeded > 0) {
    //  let energyReq = energy.getSrc(manifest, creep, energyNeeded)
    //  if (energyReq) {
    //    let target = Game.getObjectById(energyReq.id)
    //    creep.memory.withdrawTrg = target.id
    //    ACTIONS.withdraw.start(creep, target.id)
    //  }
    //} else {
    //  let logNode = Memory.nodes[creep.memory.nodeId]
    //  let logParent = Memory.nodes[logNode.parent]
    //  let criticalNodes = getChildren(logParent, ['spawn', STRUCTURE_EXTENSION], (node) => {
    //    return node.id !== creep.memory.withdrawTrg
    //  },true)
    //  let trg
    //  if (criticalNodes.length) {
    //    trg = findLogDestAmong(criticalNodes)
    //  }
    //  if (!trg) {
    //    let logContainers = getChildren(logNode, [STRUCTURE_CONTAINER], (node) => node.id !== creep.memory.withdrawTrg, true)
    //    trg = findLogDestAmong(logContainers)
    //
    //  }
    //  if (trg) {
    //    ACTIONS.transfer.start(creep, trg)
    //    //useEnergyReq(manifest, creep, {id: trg, type: 'dest'})
    //    return
    //  } else {
    //    console.log('Damn. supplier node was not able to start transfer job')
    //  }
    //  if (manifest?.energy?.dest?.length) {
    //    let req = energy.getDest(manifest, creep)
    //    if (req?.id) {
    //      switch (req.action) {
    //        case 'build':
    //          ACTIONS.build.start(creep, req.id)
    //          return
    //        case 'transfer':
    //        default:
    //          ACTIONS.transfer.start(creep, req.id)
    //          return
    //      }
    //    }
    //  }
    //}
  } catch (e) {
    console.log('Error: couldnt run supply job', e.stack)
  }
}
