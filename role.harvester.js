"use strict";
var listUtils = require('utils.list');
var mapUtils = require('utils.map');
var partUtils = require('utils.parts');

const CORE_PARTS = [WORK, WORK, CARRY, MOVE]; //300
const REPEAT_PARTS = [WORK, MOVE]; //150

module.exports.getBodyInfo = function(energy) {
  //Max size has 6 work
  return partUtils.get(CORE_PARTS, REPEAT_PARTS, Math.min(energy, 900));
}

module.exports.onCreate = function(name, memory) {
  listUtils.add(Memory.sources[memory.target].harvesters, name);
}

module.exports.onDestroy = function(name, memory) {
  listUtils.remove(Memory.sources[memory.target].harvesters, name);
}

module.exports.run = function(creep, memory, actions) {

  var target = Game.getObjectById(memory.target);
  if (!target) {
    var pos = mapUtils.deserializePos(Memory.sources[memory.target].pos);
    actions.moveTo(creep, pos);
    return;
  }
  else {
    var sourceMemory = Memory.sources[memory.target];
    if (sourceMemory.container.id) {
      var structure = Game.getObjectById(sourceMemory.container.id);
      if (structure) {
        let sum = 0
        Object.keys(creep.carry).forEach(k => sum += creep.carry[k])
        var isFull = sum === creep.carryCapacity;
        if (structure.hits < structure.hitsMax) {
          if (actions.repair(creep, structure, isFull))
            return;
        }
        else {
          if (actions.deposit(creep, structure, isFull))
            return;
        }
      }
    } else if (sourceMemory.container.site) {
      var site = Game.constructionSites[sourceMemory.container.site];
      if (site) {
        sourceMemory.container.id = null;
        if (actions.build(creep, site))
        // if (actions.build(creep, site, isFull))
          return;
      }
    }
    let sum = 0
    Object.keys(creep.carry).forEach(k => sum += creep.carry[k])
    if (sum !== creep.carryCapacity) {
      if (actions.harvest(creep, target, true))
        return;
    }
  }
}



// var roleUpgrader = require('./role.upgrader')
// var roleBuilder = require('./role.builder')
// const actions = require('./actions')
//
// var roleHarvester = {
//
//     /** @param {Creep} creep **/
//     run: function(creep) {
//       if (creep.spawning) {
//         return
//       }
//       if (creep.store.getUsedCapacity() === 0) {
//         creep.memory.mode = 'empty'
//       }
// 	    if(creep.memory.mode === 'empty') {
//         actions.refill(creep, false)
//       } else if (creep.memory.mode === 'full') {
//         var dest = creep.room.find(FIND_STRUCTURES, {
//           filter: (structure) => {
//             return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
//               structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
//           }
//         });
//         if(dest.length > 0) {
//           if(creep.transfer(dest[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
//               creep.moveTo(dest[0], {visualizePathStyle: {stroke: '#ffffff'}});
//           }
//         } else {
//           if (creep.room.controller.level >=2 ) {
//             roleBuilder.run(creep)
//           } else {
//             roleUpgrader.run(creep)
//           }
//         }
//       }
// 	}
// };
//
// module.exports = roleHarvester;
