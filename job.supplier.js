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

function scoreDest (gameNode, fromPos) {
  let thisCapacity = gameNode.store.getFreeCapacity(RESOURCE_ENERGY)
  let thisType = Memory.nodes[n].type
  let thisRange = gameNode.pos.getRangeTo(fromPos, {ignoreCreeps: true})
  // score = (1 - (range/50)) + (1 - frac)
}
function findLogDestAmong (nodes, creep) {
  if (nodes.length) {
    let best
    let bestType
    let bestCapacity = 0
    let bestRange = 999
    nodes.forEach(n => {
      let gameNode = Game.getObjectById(n)
      if (gameNode) {
        let thisCapacity = gameNode.store.getFreeCapacity(RESOURCE_ENERGY)
        let thisType = Memory.nodes[n].type
        let thisRange = gameNode.pos.getRangeTo(creep.pos, {ignoreCreeps: true})
        //const thisScore = scoreDest(gameNode)
        if (thisCapacity && thisRange < 1.1 * bestRange) {
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

function findSupplierTrg (creep, manifest) {
  let trgType
  let logNode = Memory.nodes[creep.memory.nodeId]
  let logParent = Memory.nodes[logNode.parent]
  let logContainers
  let trg
  if (!trg) {
    let criticalNodes = getChildren(logParent, ['spawn', STRUCTURE_EXTENSION], undefined,true)
    trg = findLogDestAmong(criticalNodes, creep)
    trgType = 'struct'
  }
  //
  if (!trg && manifest.spawn.length === 0) {
    logContainers = getChildren(logNode, [STRUCTURE_CONTAINER], (node) => node.subType !== 'src', true)
    trg = findLogDestAmong(logContainers, creep)
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
    let node = Memory.nodes[creep.memory.nodeId]
    const energy = creep.store.getUsedCapacity()
    switch (node.type) {
      case STRUCTURE_CONTAINER:
        switch (node.subType) {
          case 'src':
            if (energy > 0) {
              // try to go to log
              let trgId
              let logParent = Memory.nodes[node.parent]
              if (logParent.logContainers) {
                if (logParent.logContainers.length === 1) {
                  trgId = logParent.logContainers[0]
                } else {
                  console.log('Error: TODO - handle multiple logContainers in log node for supplier')
                  //let trgId = node.logContainers.find(id => {
                  //  let gameLog = Game.getObjectById(id)
                  //  if (gameLog.)
                  //    })
                }

              }
              if (!trgId) {

                let criticalNodes = getChildren(logParent, ['spawn', STRUCTURE_EXTENSION], undefined,true)
                trgId = findLogDestAmong(criticalNodes, creep)
              }
              if (trgId) {
                ACTIONS.transfer.start(creep, trgId)
                return
              }
            } else {
              //let newTrg = findSupplierTrg(creep, manifest)
              //if (newTrg && newTrg.trgType !== 'log') {
              //  ACTIONS.withdraw.start(creep, node.id)
              //
              //}
              ACTIONS.withdraw.start(creep, node.id)
              break
            }
            break
          default:
          case 'log':
            break
        }
        break
      case 'log':
        if (energy >= 25) {
          //let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
          //  maxOps: 500, ignoreCreeps: true,
          //  filter: function(object) {
          //    console.log('object', object.id)
          //    return object.store && object.store.getFreeCapacity(RESOURCE_ENERGY) && (object.type === STRUCTURE_SPAWN || object.type === STRUCTURE_EXTENSION)
          //  }
          //})
          //if (target) {
          //  ACTIONS.transfer.start(creep, target.id)
          //  return
          //}
          let newTrg = findSupplierTrg(creep, manifest)
          if (newTrg) {
            ACTIONS.transfer.start(creep, newTrg.trg)
            return                    // ^^^ SOME ENERGY && DEST EXISTS => FILL DEST
          } else if (creep.store.getFreeCapacity()) {     // <= NO DEST ANYWHERE && NOT FULL
            let srcContainers = getChildren(node, [STRUCTURE_CONTAINER], (child) => child.subType === 'src', true)
            let srcTrg = findLogSrcFor(undefined, srcContainers)
            if (srcTrg) {
              ACTIONS.withdraw.start(creep, srcTrg)
              return                // ^^^ NO DEST ANYWHERE && NOT FULL  => FILL FROM SRC CONTAINER
            }
            // <= NO SRC && NOT FULL
          }
          creep.moveTo(deserializePos(node.pos), {range: 4, visualizePathStyle: {stroke: '#00ff00'}})
          return                    // ^^^ NO DEST && (FULL || NO SRC) => RETURN TO LOGISTIC NODE
        } else {

          //let newTrg = findSupplierTrg(creep) // get what needs energy now.
          //let srcTrg
          //let srcType
          //switch (newTrg?.trgType) {
          //  case 'struct':          // EMPTY && AVAILABLE DEST IS STRUCT => FILL FROM [LOG, SRC]
          //    srcTrg = findLogContainer(creep)
          //    srcType = 'log'       // 1 ^^^ EMPTY && AVAILABLE DEST IS STRUCT => FILL FROM [LOG]
          //    if (!srcTrg) {
          //      srcTrg = findSrcContainer(creep)
          //      srcType = 'src'     // 2 ^^^ EMPTY && NO LOG SRC => FILL FROM [SRC]
          //    }
          //    break
          //  default:                // EMPTY && NO AVAILABLE DEST => FILL FROM [SRC]
          //  case 'cont':            // EMPTY && AVAILABLE DEST IS LOG => FILL FROM [SRC]
          //    srcTrg = findSrcContainer(creep)
          //    srcType = 'src'       // 3 ^^^ EMPTY && (NO AVAILABLE DEST || AVAILABLE DEST IS LOG) => FILL FROM [SRC]
          //    break
          //}
          let srcTrg = findLogContainer(creep)
          if (srcTrg) {
            ACTIONS.withdraw.start(creep, srcTrg)
            return
          } else {
            creep.moveTo(deserializePos(node.pos), {range: 4, visualizePathStyle: {stroke: '#ff0000'}})
            return                  // 4 ^^^ EMPTY && NO SRC => MOVE TO SRC NODES
          }
        }
        break
    }
    //if (node.type === STRUCTURE_CONTAINER) {
    //  if (energy > 0) {
    //    // try to go to log
    //    let trgId
    //    if (node.logContainers) {
    //      if (node.logContainers.length === 1) {
    //        trgId = node.logContainers[0]
    //      } else {
    //        console.log('Error: TODO - handle multiple logContainers in log node for supplier')
    //        //let trgId = node.logContainers.find(id => {
    //        //  let gameLog = Game.getObjectById(id)
    //        //  if (gameLog.)
    //        //    })
    //      }
    //      if (trgId) {
    //        ACTIONS.transfer.start(creep, trgId)
    //      }
    //    }
    //  } else {
    //
    //  }
    //}






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
