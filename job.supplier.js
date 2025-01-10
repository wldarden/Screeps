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

const {ACTIONS} = require('./actions')
const {getDestNode, getSrcNode} = require('./utils.nodes')
const distRunner = require('job.supplier.dist')
const srcRunner = require('job.supplier.src')
module.exports.run = function (creep, manifest) {
  try {
    //if (creep.memory.wait) {
    //  if (Game.time >= creep.memory.wait) {
    //    delete creep.memory.wait
    //    creep.memory.waitCount = creep.memory.waitCount < 5 ? creep.memory.waitCount + 1 : 1
    //  } else {
    //    return
    //  }
    //}
    //
    //const energy = creep.store.getUsedCapacity()
    //
    //let node = Memory.nodes[creep.memory.nodeId]
    //
    //let trgInfo
    //if (energy > 0) {
    //  // try to go to log
    //  trgInfo = getDestNode(node, creep, {energy: energy, canWork: false, minCapacity: 1})
    //  if (trgInfo.trg) {
    //    ACTIONS[trgInfo.action].start(creep, trgInfo.trg)
    //    return
    //  } else {
    //    if (energy > creep.store.getFreeCapacity()) {
    //      creep.memory.wait = Game.time + 3
    //    }
    //    return
    //  }
    //}
    //const energyNeeded = creep.store.getUsedCapacity()
    //let gameNode = Game.getObjectById(creep.memory.nodeId)
    //if (gameNode.store.getUsedCapacity()) {
    //  ACTIONS.withdraw.start(creep, creep.memory.nodeId)
    //} else {
    //  trgInfo = getSrcNode(node, creep, {canWork: false, energyNeeded: energyNeeded})
    //  if (trgInfo.trg) {
    //    ACTIONS[trgInfo.action].start(creep, trgInfo.trg)
    //    return
    //  }
    //}



    if (creep.memory.wait) {
      if (Game.time >= creep.memory.wait) {
        delete creep.memory.wait
        creep.memory.waitCount = creep.memory.waitCount < 5 ? creep.memory.waitCount + 1 : 1
      } else {
        return
      }
    }
    let node = Memory.nodes[creep.memory.nodeId]
    //const energy = creep.store.getUsedCapacity()
    switch (node.subType) {
      case 'dist':
        distRunner.run(creep, manifest, node)
        break
      case 'src':
        srcRunner.run(creep, manifest, node)
        break
    }
  } catch (e) {
    console.log('Error: couldnt run supply job (1/2)', e.stack)
    console.log('Error: couldnt run supply job (2/2', Memory.nodes[creep.memory.nodeId].type, creep.name)
  }
}
