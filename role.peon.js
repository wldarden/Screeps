// const actions = require('./actions')
// const roleBuilder = require('./role.builder')
// const roleUpgrader = require('./role.upgrader')
//
//
// module.exports.run = function (creep) {
//   if (creep.spawning) { return }
//   if (creep.store.getUsedCapacity() === 0) {
//     creep.memory.mode = 'empty'
//   }
//   if(creep.memory.mode === 'empty') {
//     actions.refill(creep, false)
//   } else if (creep.memory.mode === 'full') {
//     var dest = creep.room.find(FIND_STRUCTURES, {
//       filter: (structure) => {
//         return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
//           structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
//       }
//     });
//     if(dest.length > 0) {
//       if(creep.transfer(dest[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
//         creep.moveTo(dest[0], {visualizePathStyle: {stroke: '#ffffff'}});
//       }
//     } else {
//       if (creep.room.controller.level >=2 ) {
//         roleBuilder.run(creep)
//       } else {
//         roleUpgrader.run(creep)
//       }
//     }
//   }
// }



"use strict";
var listUtils = require('utils.list');
var mapUtils = require('utils.map');
var partUtils = require('utils.parts');

const CORE_PARTS = [WORK, CARRY, MOVE, MOVE]; //250
const REPEAT_PARTS = [];

module.exports.getBodyInfo = function(energy) {
  return partUtils.get(CORE_PARTS, REPEAT_PARTS, energy);
}

module.exports.onCreate = function(name, memory) {
  listUtils.add(Memory.sources[memory.target].harvesters, name);
}

module.exports.onDestroy = function(name, memory) {
  listUtils.remove(Memory.sources[memory.target].harvesters, name);
}

module.exports.run = function(creep, memory, actions) {
  if(creep.carry.energy < creep.carryCapacity) {
    var target = Game.getObjectById(memory.target);
    if (!target) {
      var pos = mapUtils.deserializePos(Memory.sources[memory.target].pos);
      actions.moveTo(creep, pos);
      return;
    } else {
      if (actions.harvest(creep, target, true))
        return;
    }
  }
  if (creep.carry.energy > 0) {
    var dropoff = mapUtils.findDropoff(creep.pos, Game.bases[memory.base], creep.carry.energy);
    let sum = 0
    Object.keys(creep.carry).forEach(k => sum += creep.carry[k])
    const isFull = sum === creep.carryCapacity;
    if (dropoff && actions.deposit(creep, dropoff, isFull)) {
        return;
    }
  }
}
