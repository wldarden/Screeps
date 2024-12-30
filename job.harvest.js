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
const {energy} = require('./utils.manifest')
module.exports.run = function (creep, manifest) {
  try {
    if (creep.store.getFreeCapacity() > 0) {
      ACTIONS.harvest.start(creep, creep.memory.nodeId)
      return
    } else {
      if (manifest?.energy?.dest?.length) {
        let req = energy.getDest(manifest, creep)
        if (req?.id) {
          switch (req.action) {
            case 'build':
              ACTIONS.build.start(creep, req.id)
              return
            case 'transfer':
            default:
              ACTIONS.transfer.start(creep, req.id)
              return
          }
        }
      }
      // if (manifest?.build?.pending?.length) {
      //   const priorityReq = manifest?.build?.pending[0]
      //   if (priorityReq.opts.siteId) {
      //
      //     return
      //   }
      // }
      //
      // ACTIONS.transfer.start(creep)
      // let containerId = containerized(creep.memory.nodeId)
      // if (containerId) {
      //   ACTIONS.transfer.start(creep, containerId)
      // } else {
      //   if (manifest?.pending?.build?.length) {
      //     const priorityReq = manifest.requests[manifest.pending.build[0]]
      //     if (priorityReq.opts.siteId) {
      //       ACTIONS.build.start(creep, priorityReq.opts.siteId)
      //       return
      //     }
      //   }
      //
      //   ACTIONS.transfer.start(creep)
      // }
    }
  } catch (e) {
    console.log('Error: couldnt run harvest job', e.stack)
  }
}
