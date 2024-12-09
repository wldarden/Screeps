var roleUpgrader = {

    /** @param {Creep} creep **/
    run: function(creep) {
        const free = creep.store.getFreeCapacity()
        const energy = creep.store.getUsedCapacity()
        if (energy === 0) {
            creep.memory.mode = 'refill'
        } else if (free === 0) {
            creep.memory.mode = 'disperse'
        }
        if(creep.memory.mode === 'refill') {
            var sources = creep.room.find(FIND_SOURCES);
            if(creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(sources[0]);
            }
        } else if (creep.memory.mode === 'disperse') {
            if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller);
            }
        }
    }
};

module.exports = roleUpgrader;
