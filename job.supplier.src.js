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
const {getDestNode} = require('./utils.nodes')

module.exports.run = function (creep, manifest, node) {
  try {
    const energy = creep.store.getUsedCapacity()
    const energyNeeded = creep.store.getFreeCapacity()
    let node = Memory.nodes[creep.memory.nodeId]

    let trgInfo
    if (energy > 0) {
      // try to go to log
      trgInfo = getDestNode(node, creep, {canWork: false, energy: energy, minCapacity: 1})
      if (trgInfo?.trg) {
        //console.log(creep.name, 'supplier getDestNode:', trgInfo?.trg, trgInfo?.action, Game.getObjectById(trgInfo?.trg)?.store?.getFreeCapacity())
        ACTIONS[trgInfo.action].start(creep, trgInfo.trg)
        delete creep.memory.waitCount
        delete creep.memory.lastWithdraw
        return
      } else {
        if (energy > energyNeeded) {
          //console.log(creep.name, 'have energy than free capacity. waiting to find trg again in 3 ticks', creep.memory.waitCount)
          creep.memory.wait = Game.time + creep.memory.waitCount ? (creep.memory.waitCount * 2) : 1
          creep.moveTo(Game.getObjectById(creep.memory.nodeId))
          return
        } else {
          //console.log(creep.name, 'NEED ENERGY than free capacity')
        }

      }
    }

    //trgInfo = getSrcNode(node, creep, {canWork: false, energyNeeded: energyNeeded})
    ////console.log(creep.name, 'supplier getSrcNode:', creep.name, trgInfo?.trg, trgInfo?.action, Game.getObjectById(trgInfo?.trg)?.store?.getFreeCapacity())
    //
    //if (trgInfo.trg) {
    //  ACTIONS[trgInfo.action].start(creep, trgInfo.trg)
    //  delete creep.memory.waitCount
    //}


    //trgInfo = getSrcNode(node, creep, {canWork: false, energyNeeded: energyNeeded})
    //console.log(creep.name, 'supplier getSrcNode:', creep.name, trgInfo?.trg, trgInfo?.action, Game.getObjectById(trgInfo?.trg)?.store?.getFreeCapacity())
    //let mySrcContainer = Game.getObjectById(creep.memory.nodeId)
    //if (mySrcContainer.store.getUsedCapacity()) {
    //
    //} else {
    //
    //}

    const time = Game.time
    if (creep.memory.lastWithdraw && ((time - creep.memory.lastWithdraw) < 5)) {
      //we tried to withdraw just a second ago. node must be out of energy. hibernate a bit.
      delete creep.memory.lastWithdraw
      creep.memory.wait = time + 10
      return
    }
    ACTIONS.withdraw.start(creep, creep.memory.nodeId)
    delete creep.memory.waitCount
    creep.memory.lastWithdraw = time


  } catch (e) {
    console.log('Error: couldnt run Supply.Src job', e.stack)
  }
}
