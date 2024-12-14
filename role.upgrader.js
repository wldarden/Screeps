"use strict";
var mapUtils = require('utils.map');
var partUtils = require('utils.parts');

const CORE_PARTS = [WORK, CARRY, CARRY, MOVE, MOVE];
const REPEAT_PARTS = [WORK, CARRY, MOVE];

module.exports.getBodyInfo = function(energy) {
    //Max size carries 50
    return partUtils.get(CORE_PARTS, REPEAT_PARTS, energy);
}

module.exports.onCreate = function(name, memory) {
}

module.exports.onDestroy = function(name, memory) {
}

module.exports.run = function(creep, memory, actions) {
    var baseMemory = Memory.bases[memory.base];

    if(creep.carry.energy < 50) {
        var mayUseSpawn = baseMemory.construction.requestedCreepPriority < 0.80;
        var storage = mapUtils.findStorage(creep.pos, Game.bases[memory.base], creep.carryCapacity - creep.carry.energy, mayUseSpawn);
        if (storage) {
            if (actions.withdraw(creep, storage, true))
                return;
        }
    }

    var target = Game.structures[memory.target];
    if (!target)
        target = Game.getObjectById(memory.target);
    if (actions.upgrade(creep, target, true))
        return;
}


// const actions = require('./actions')
// var roleUpgrader = {
//
//     /** @param {Creep} creep **/
//     run: function(creep) {
//         if (creep.store.getUsedCapacity() === 0) {
//             creep.memory.mode = 'empty'
//         }
//         if(creep.memory.mode === 'empty') {
//             actions.refill(creep, false)
//         } else if (creep.memory.mode === 'full') {
//             if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
//                 creep.moveTo(creep.room.controller);
//             }
//         }
//     }
// };
//
// module.exports = roleUpgrader;
