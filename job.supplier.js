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

module.exports.run = function (creep, manifest) {
  try {
    if (creep.memory.wait) {
      if (Game.time >= creep.memory.wait) {
        delete creep.memory.wait
        creep.memory.waitCount = creep.memory.waitCount < 5 ? creep.memory.waitCount + 1 : 1
      } else {
        return
      }
    }
    let node = Memory.nodes[creep.memory.nodeId]
    const energy = creep.store.getUsedCapacity()
    switch (node.type) {
      case 'ec':
        distRunner.run(creep, manifest, node)
        break
      case STRUCTURE_CONTAINER:
        switch (node.subType) {
          case 'dist':
            break
          case 'src':
            break
        }
        let trgInfo
        if (energy > 0) {
          // try to go to log
          trgInfo = getDestNode(node, creep, {canWork: false, energy: energy, minCapacity: 1})
          if (trgInfo?.trg) {
            //console.log(creep.name, 'supplier getDestNode:', trgInfo?.trg, trgInfo?.action, Game.getObjectById(trgInfo?.trg)?.store?.getFreeCapacity())
            ACTIONS[trgInfo.action].start(creep, trgInfo.trg)
            delete creep.memory.waitCount
            return
          } else {
            if (energy > creep.store.getFreeCapacity()) {
              //console.log(creep.name, 'have energy than free capacity. waiting to find trg again in 3 ticks', creep.memory.waitCount)
              creep.memory.wait = Game.time + creep.memory.waitCount ? creep.memory.waitCount : 1
              creep.moveTo(creep.memory.nodeId)
              return
            } else {
              //console.log(creep.name, 'NEED ENERGY than free capacity')
            }

          }
        }
        const energyNeeded = creep.store.getFreeCapacity()
        trgInfo = getSrcNode(node, creep, {canWork: false, energyNeeded: energyNeeded, minEnergyNeeded: energyNeeded})
        //console.log(creep.name, 'supplier getSrcNode:', creep.name, trgInfo?.trg, trgInfo?.action, Game.getObjectById(trgInfo?.trg)?.store?.getFreeCapacity())

        if (trgInfo.trg) {
          ACTIONS[trgInfo.action].start(creep, trgInfo.trg)
          delete creep.memory.waitCount
          return
        }
        //console.log(creep.name, 'supplier unable to find trg', creep.name, energy, trg, trgInfo)
        break
      case 'log':
        break
    }
  } catch (e) {
    console.log('Error: couldnt run supply job (1/2)', e.stack)
    console.log('Error: couldnt run supply job (2/2', Memory.nodes[creep.memory.nodeId]?.type, creep.name)
  }
}
