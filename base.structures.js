"use strict";
var requestUtils = require("utils.requests");

module.exports.updateGlobal = function(actions) {
}

module.exports.updateBase = function(base, actions, creepRequests, structureRequests, defenseRequests) {
    try {
        let baseMemory = base.memory;
        const level = Game.rooms[base.name].controller.level;

        const spawnCount = baseMemory.structures[STRUCTURE_SPAWN].length;
        if (spawnCount < CONTROLLER_STRUCTURES[STRUCTURE_SPAWN][level]) {
            const priority = (spawnCount === 0) ? 1.0 : .85
            requestUtils.add(structureRequests, priority, STRUCTURE_SPAWN);
        }

        const storageCount = baseMemory.structures[STRUCTURE_STORAGE].length;
        if (storageCount < CONTROLLER_STRUCTURES[STRUCTURE_STORAGE][level]) {
            const priority = (storageCount === 0) ? 0.90 : 0.80
            requestUtils.add(structureRequests, priority, STRUCTURE_STORAGE);
        }

        const extensionCount = baseMemory.structures[STRUCTURE_EXTENSION].length;
        if (extensionCount < CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][level]) {
            let priority;
            if (extensionCount < 5)
                priority = 0.98;
            else if (extensionCount < 10)
                priority = 0.88;
            else
                priority = 0.78;
            requestUtils.add(structureRequests, priority, STRUCTURE_EXTENSION);
        }

        const towerCount = baseMemory.structures[STRUCTURE_TOWER].length;
        if (towerCount < CONTROLLER_STRUCTURES[STRUCTURE_TOWER][level]) {
            const priority = (towerCount === 0) ? 0.94 : 0.84
            requestUtils.add(structureRequests, priority, STRUCTURE_TOWER);
        }

        requestUtils.add(defenseRequests, 0.5, STRUCTURE_WALL);
        requestUtils.add(defenseRequests, 0.49, STRUCTURE_RAMPART);
    } catch (e) {
        console.log('Error updating base.structures', e.stack)
    }

}
