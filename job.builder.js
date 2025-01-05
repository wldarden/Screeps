
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
const {addCreepToNode, getSrcNode} = require('./utils.nodes')

module.exports.run = function (creep, manifest) {
  try {
    let node = Memory.nodes[creep.memory.nodeId]
    if (!node) {
      // find new parent

      return
    }
    const energy = creep.store.getUsedCapacity()
    if (energy) {
        let buildSite = Game.getObjectById(creep.memory.nodeId)
        if (buildSite && buildSite.progressTotal) {
          ACTIONS.build.start(creep, creep.memory.nodeId)
        }
    }

    let trgInfo = getSrcNode(node, creep, {minEnergyNeeded: 50, canWork: true})
    if (trgInfo?.trg) {
      ACTIONS[trgInfo.action].start(creep, trgInfo.trg)
      return
    }
    //const energyNeeded = creep.store.getFreeCapacity()
    //if (manifest.spawn?.length > 0) {
    //  if (energyNeeded) {
    //    let trg = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
    //      maxOps: 500, ignoreCreeps: true})
    //    if (trg) {
    //      let actionRes = creep.pickup(trg)
    //      switch (actionRes) {
    //        case ERR_NOT_IN_RANGE:
    //          creep.moveTo(trg)
    //          return
    //        default:
    //          console.log('Error: upgrader cant pickup resource', actionRes, creep.name)
    //          return
    //      }
    //    }
    //  } else {
    //    let buildSite = Game.getObjectById(creep.memory.nodeId)
    //    if (buildSite && buildSite.progressTotal) {
    //      ACTIONS.build.start(creep, creep.memory.nodeId)
    //    }
    //  }
    //  return
    //}
    //
    //if (creep.store.getUsedCapacity() === 0 && manifest.spawn.length > 0 && manifest.roomEnergyFrac < .8) {
    //  return
    //}
    //if (energyNeeded > 0) {
    //  let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
    //    maxOps: 500, ignoreCreeps: true,
    //    filter: function(gameNode) {
    //      let node = Memory.nodes[gameNode?.id]
    //      let res = gameNode.store && node?.type === STRUCTURE_CONTAINER && gameNode.store.getUsedCapacity(RESOURCE_ENERGY)
    //      return res
    //    }
    //  })
    //  if (target) {
    //    ACTIONS.withdraw.start(creep, target.id)
    //    return
    //  }
    //
    //  if (!target) {
    //    target = creep.pos.findClosestByPath(FIND_MY_SPAWNS, {maxOps: 500,  ignoreCreeps: true,
    //      filter: function(node) {
    //        return node.store && node.store.getFreeCapacity(RESOURCE_ENERGY) < 5
    //      }});
    //    if (target) {
    //      ACTIONS.withdraw.start(creep, target.id)
    //      return
    //    }
    //  }
    //
    //} else {
    //  let buildSite = Game.getObjectById(creep.memory.nodeId)
    //  if (buildSite && buildSite.progressTotal) {
    //    ACTIONS.build.start(creep, creep.memory.nodeId)
    //  } else {
    //    let target = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES, {maxOps: 500});
    //    if (target) {
    //      ACTIONS.build.start(creep, target.id)
    //      addCreepToNode(target.id, creep.memory.role, creep.name)
    //      return
    //    }
    //  }
    //}

  } catch (e) {
    console.log('Error: couldnt run build job', e.stack)
  }
}

