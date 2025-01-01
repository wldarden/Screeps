
// OK	0
// The operation has been scheduled successfully.
//
//   ERR_NOT_OWNER	-1
// You are not the owner of this creep.
//
//   ERR_BUSY	-4
// The creep is still being spawned.
//
//   ERR_NOT_ENOUGH_RESOURCES	-6
// The creep does not have any carried energy.
//
//   ERR_INVALID_TARGET	-7
// The target is not a valid construction site object or the structure cannot be built here (probably because of a creep at the same square).
//
// ERR_NOT_IN_RANGE	-9
// The target is too far away.
//
//   ERR_NO_BODYPART	-12
// There are no WORK body parts in this creep’s body.
const {deserializePos} = require('./utils.memory')
const {ACTIONS, DONE} = require('./actions')
const {energy} = require('./utils.manifest')
const {addCreepToNode} = require('./utils.nodes')

module.exports.run = function (creep, manifest) {
  try {
    if (manifest.spawn.length > 0 && manifest.roomEnergyFrac < .8) {
      return
    }
    const energyNeeded = creep.store.getFreeCapacity()
    if (energyNeeded > 0) {
      let target = creep.pos.findClosestByPath(FIND_MY_SPAWNS, {maxOps: 500,  ignoreCreeps: true,
        filter: function(node) {
          return node.store && node.store.getFreeCapacity(RESOURCE_ENERGY) < 5
        }});
      if (target) {
        ACTIONS.withdraw.start(creep, target.id)
        return
      }

    } else {
      let buildSite = Game.getObjectById(creep.memory.nodeId)
      if (buildSite && buildSite.progressTotal) {
        ACTIONS.build.start(creep, creep.memory.nodeId)
      } else {
        let target = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES, {maxOps: 500});
        if (target) {
          ACTIONS.build.start(creep, target.id)
          addCreepToNode(target.id, creep.memory.role, creep.name)
          return
        }
      }
    }

  } catch (e) {
    console.log('Error: couldnt run build job', e.stack)
  }
}

