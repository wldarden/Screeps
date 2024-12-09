const utils = require('./utils')
// import {buildNear} from './utils'
/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('role.spawn');
 * mod.thing == 'a thing'; // true
 */

const minPlan = [WORK,CARRY,MOVE]
var roleSpawn = {

    /** @param {Spawn} spawn **/
    init: function (spawn) {
        var trgSrc = spawn.pos.findClosestByPath(FIND_SOURCES)
        spawn.memory.sources = [{
            source: trgSrc,
            desiredHarvesters: 2,
            harvesters: []
        }]
        spawn.memory.harvesters = []
        spawn.memory.upgraders = []
        // spawn.memory.creepPlan = {
        //     harvesters: 2,
        //     upgraders: 1,
        //     builders: 0
        // }
        spawn.memory.init = true;
    },


    /** @param {Spawn} spawn **/
    run: function(spawn) {

        /**
         * Spawn Something:
         */
        if (!spawn.memory.harvesters) {
            spawn.memory.harvesters = []
        }
        // const livingHarvesters = []
        // for (const name in spawn.memory.harvesters) {
        //     if(!Game.creeps[name]) {
        //          delete Memory.creeps[name];
        //          console.log('Clearing non-existing creep memory:', name);
        //     } else {
        //         livingHarvesters.push(name)
        //     }
        // }
        // spawn.memory.harvesters = livingHarvesters
        const harvesterCount = spawn.memory.harvesters.length
        if (harvesterCount < 2) {
            // try to spawn a creep
            let newName;
            for (const name in spawn.memory.harvesters) {
                if(!Game.creeps[name]) {
                    newName = name
                }
            }
            if (!newName) { // no dead harvester to replace. add one.
                newName = `${spawn.name}_harvester_${harvesterCount}`
            }
            const buildPlan = minPlan
            const res = spawn.spawnCreep(buildPlan, newName, { memory: { role: 'harvester' }});
            if (res === 0) {
                spawn.memory.harvesters.push(newName)
            }
        }
        if (!spawn.memory.upgraders) {
            spawn.memory.upgraders = []
        }
        const upgraderCount = spawn.memory.upgraders.length
        if (harvesterCount >= 1 && upgraderCount < 1) {
            // try to spawn a creep
            let newName;
            for (const name in spawn.memory.upgraders) {
                if(!Game.creeps[name]) {
                    newName = name
                }
            }
            if (!newName) { // no dead harvester to replace. add one.
                newName = `${spawn.name}_upgrader_${upgraderCount}`
            }
            const buildPlan = minPlan
            const res = spawn.spawnCreep(buildPlan, newName, { memory: { role: 'upgrader' } });
            if (res === 0) {
                spawn.memory.upgraders.push(newName)
            }
        }
        // Show spawning text visual:
        if(spawn.spawning) { spawn.room.visual.text('🛠️' + Game.creeps[spawn.spawning.name].memory.role, spawn.pos.x + 1, spawn.pos.y, {align: 'left', opacity: 0.8});}

        if (
          spawn.room.controller.level > 1 &&
          (spawn.room.energyAvailable * 3) > spawn.room.energyCapacityAvailable &&
          spawn.room.energyCapacityAvailable < 800 &&
          spawn.room.find(FIND_MY_CONSTRUCTION_SITES).length < 1
        ) {
            utils.buildNear(spawn.pos, STRUCTURE_EXTENSION)
        }

    }
};

// for(var name in Memory.creeps) {
//     if(!Game.creeps[name]) {
//         delete Memory.creeps[name];
//         console.log('Clearing non-existing creep memory:', name);
//     }
// }
// var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
// console.log('Harvesters: ' + harvesters.length)
// if(harvesters.length < 2) {
//     var newName = 'Harvester' + Game.time;
//     console.log('Spawning new harvester: ' + newName);
//     Game.spawns['Spawn1'].spawnCreep([WORK,CARRY,MOVE], newName,
//         {memory: {role: 'harvester'}});
// }

// if(Game.spawns['Spawn1'].spawning) {
//     var spawningCreep = Game.creeps[Game.spawns['Spawn1'].spawning.name];
//     Game.spawns['Spawn1'].room.visual.text(
//         '🛠️' + spawningCreep.memory.role,
//         Game.spawns['Spawn1'].pos.x + 1,
//         Game.spawns['Spawn1'].pos.y,
//         {align: 'left', opacity: 0.8});
// }
module.exports = roleSpawn;
