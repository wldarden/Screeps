
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
module.exports.run = function (creep, manifest) {
    try {
        if (creep.store.getFreeCapacity() === 0) {
            ACTIONS.repair.start(creep)
            //ACTIONS.repair.start(creep, creep.memory.nodeId)
            //let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            //    maxOps: 500, ignoreCreeps: true,
            //    filter: function(gameNode) {
            //        let node = Memory.nodes[gameNode?.id]
            //        let res = gameNode.store && node?.type === STRUCTURE_CONTAINER && gameNode.store.getUsedCapacity(RESOURCE_ENERGY)
            //        if (res) {
            //            console.log('maint going to ', node?.id, node?.type)
            //        } else {
            //            console.log('maint not going to ', node?.id, node?.type)
            //
            //        }
            //        return gameNode.hits < gameNode.hitsTotal
            //    }
            //})
            return
        } else {
            if (creep.memory.nodeId) {
                let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                    maxOps: 500, ignoreCreeps: true,
                    filter: function(gameNode) {
                        let node = Memory.nodes[gameNode?.id]
                        let res = gameNode.store && node?.type === STRUCTURE_CONTAINER && gameNode.store.getUsedCapacity(RESOURCE_ENERGY)
                        return res
                    }
                })
                if (target) {
                    ACTIONS.withdraw.start(creep, target.id)
                    return
                }
            }
        }
    } catch (e) {
        console.log('Error: couldnt run maint job', creep.name, e.stack)
    }
}
