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
require('overload.creep')
const {ACTIONS, DONE} = require('./actions')
const {getDestNode} = require('./utils.nodes')
const {CREEP_MIN_LIFE_TICKS} = require('./config')

module.exports.run = function (creep, manifest) {
  try {
    creep.runMiner()
    //let node = Memory.nodes[creep.memory.nodeId]
    ////creep.runTask()
    //let energyNeeded = creep.store.getFreeCapacity()
    //const energy = creep.store.getUsedCapacity()
    //if (energy > 0 || creep.ticksToLive < CREEP_MIN_LIFE_TICKS) {
    //  let trgInfo = getDestNode(node, creep, {canWork: true, minCapacity: 1})
    //  if (trgInfo.trg) {
    //    ACTIONS[trgInfo.action].start(creep, trgInfo.trg)
    //  }
    //}
    //if (energyNeeded >= energy) {
    //  ACTIONS.harvest.start(creep, creep.memory.nodeId)
    //}


    // {
    //
    //  if (creep.memory.nodeId) {
    //    //let energy = creep.store.getUsedCapacity()
    //    //let trg = getDestNode(creep.memory.nodeId, energy)
    //    //if (trg) {
    //    //  ACTIONS.transfer.start(creep, trg)
    //    //}
    //    let node = Memory.nodes[creep.memory.nodeId]
    //    let trgInfo = getDestNode(creep, node)
    //    if (primDestRes) {
    //      return
    //    } else if (node.type === 'src' && node.stage === 3) { // stage 3 src miners will remain at src
    //      return
    //    } else { // lower stage src miners will travel to destinations
    //      let target = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES, {maxOps: 500, ignoreCreeps: true});
    //      if (target) {
    //        ACTIONS.build.start(creep, target.id)
    //        return
    //      }
    //      target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
    //        maxOps: 500, ignoreCreeps: true,
    //        filter: function(object) {
    //          return object.store && object.store.getFreeCapacity(RESOURCE_ENERGY)
    //        }
    //      })
    //      if (target) {
    //        ACTIONS.transfer.start(creep, target.id)
    //        return
    //      }
    //    }
    //  }
    //}
  } catch (e) {
    console.log('Error: couldnt run harvest job', e.stack)
  }
}
