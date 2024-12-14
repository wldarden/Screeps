"use strict";
let listUtils = require("utils.list");
let memoryUtils = require("utils.memory");
let requestUtils = require("utils.requests");

module.exports.updateGlobal = function(actions) {
}

module.exports.updateBase = function(base, actions, creepRequests, structureRequests, defenseRequests) {
    try {
        let baseMemory = base.memory;

        //Spawn creeps
        baseMemory.construction.requestedCreepPriority = 0.0;

        for (let i = 0; i < baseMemory.spawns.length; i++) {
            let spawnName = baseMemory.spawns[i];
            let spawn = Game.spawns[spawnName];
            console.log('Running spawn', !spawn.spawning, JSON.stringify(spawn))
            if (spawn && !spawn.spawning) {
                let memory = Memory.spawns[spawnName];
                if (!memory) {
                    memory = { queue: [] };
                    Memory.spawns[spawnName] = memory;
                }

                let queue = memory.queue;
                for (let j = 0; j < queue.length; j++) {
                    let creepName = queue[j];
                    let creep = Game.creeps[creepName];

                    if (!creep) {
                        queue.shift();
                        j--;
                        continue;
                    }
                    if (!creep.pos.isNearTo(spawn.pos))
                        continue;

                    if (creep.ticksToLive >= 25 && creep.memory.priority > 0.8) {
                        requestUtils.add(creepRequests, creep.memory.priority, { renew: creep.name });
                    } else {
                        spawn.recycleCreep(creep);
                    }
                }
                let request
                if (!memory.renewing) {
                    while (true) {
                        request = requestUtils.pop(creepRequests);
                        if (request !== null) {
                            if (request.data.renew) {
                                console.log('9999')
                                let creep = Game.creeps[request.data.renew];
                                console.log('9999')

                                console.log('Renewing ' + creep.memory.role + ' (' + creep.memory.priority + ')')
                                memory.renewing = request.data.renew;
                                break;
                            }

                            let memory = request.data;
                            let maxEnergy;
                            if (request.priority < 0.90)
                                maxEnergy = spawn.room.energyCapacityAvailable;
                            else
                                maxEnergy = spawn.room.energyAvailable;

                            let manager;
                            if (memory.military)
                                manager = Game.unitManagers[memory.role];
                            else
                                manager = Game.creepManagers[memory.role];
                            let bodyInfo = manager.getBodyInfo(maxEnergy);

                            if (bodyInfo.cost > spawn.room.energyCapacityAvailable) {
                                //console.log("Could not afford " + memory.role + ": " + bodyInfo.cost + "/" + spawn.room.energyCapacityAvailable);
                                continue;
                            }

                            if (request.priority < 0.70 && spawn.room.energyAvailable !== spawn.room.energyCapacityAvailable)
                                continue; // Excess energy tier

                            /*if (request.upgradeCost > 0)
                                memory.upgradeCost = bodyInfo.upgradeCost;*/

                            memory.base = base.name;
                            //memory.priority = request.priority;

                            let parts = { };
                            for (let i = 0; i < bodyInfo.body.length; i++) {
                                let part = bodyInfo.body[i];
                                if (!parts[part])
                                    parts[part] = 1;
                                else
                                    parts[part]++;
                            }
                            memory.parts = parts;

                            let name = spawn.createCreep(bodyInfo.body, null, memory);
                            if (typeof name === 'string') {
                                if (!memory.military) {
                                    let roleMemory = baseMemory.roles[memory.role];
                                    if (!roleMemory) {
                                        roleMemory = memoryUtils.createRole();
                                        baseMemory.roles[memory.role] = roleMemory
                                    }

                                    for (let key in parts)
                                        roleMemory.parts[key] += parts[key];
                                    let creepNames = roleMemory.creeps;
                                    listUtils.add(creepNames, name);
                                    manager.onCreate(name, memory);
                                }
                                else {
                                    let roleMemory = Memory.military.roles[memory.role];
                                    if (!roleMemory) {
                                        roleMemory = memoryUtils.createRole();
                                        Memory.military.roles[memory.role] = roleMemory
                                    }

                                    for (let key in parts)
                                        roleMemory.parts[key] += parts[key];
                                    let creepNames = roleMemory.creeps;
                                    listUtils.add(creepNames, name);
                                    manager.onCreate(name, memory);
                                }
                                console.log(spawn.room.name + ": Spawning " + memory.role + " (" + request.priority + ", " + creepNames.length  + " total) " + JSON.stringify(parts));
                            }
                            else {
                                if (request.priority > baseMemory.construction.requestedCreepPriority)
                                    baseMemory.construction.requestedCreepPriority = request.priority;
                            }
                        }
                        break;
                    }
                }
                if (memory.renewing) {
                    console.log('4444')

                    let creep = Game.creeps[memory.renewing];
                    console.log('455555')

                    if (creep) {
                        let result = spawn.renewCreep(creep);
                        if (result === ERR_FULL) {
                            delete creep.memory._action;
                            queue.shift();
                            j--;
                            memory.renewing = null;
                        }
                        else if (result === ERR_NOT_ENOUGH_ENERGY)
                            baseMemory.construction.requestedCreepPriority = request.priority;
                    }
                    else
                        memory.renewing = null;
                }
            }
        }
    } catch (e) {
        console.log('Error: failed to update base.spawns', e.stack)
    }

}
