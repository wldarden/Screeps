var roleUpgrader = require('./role.upgrader')
var roleHarvester = {

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
          creep.moveTo(sources[0] , {visualizePathStyle: {stroke: '#ffaa00'}});
        }
      } else if (creep.memory.mode === 'disperse') {
        var dest = creep.room.find(FIND_STRUCTURES, {
          filter: (structure) => {
            return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
              structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
          }
        });
        if(dest.length > 0) {
          if(creep.transfer(dest[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
              creep.moveTo(dest[0], {visualizePathStyle: {stroke: '#ffffff'}});
          }
        } else {
          roleUpgrader.run(creep)
        }
      }
	}
};

module.exports = roleHarvester;
