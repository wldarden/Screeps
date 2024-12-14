const roleUpgrader = require('./role.upgrader')
const actions = require('./actions')
var roleBuilder = {
	/** @param {Creep} creep **/
	run: function(creep) {
		if (creep.spawning) {
			return
		}
		if (creep.store.getUsedCapacity() === 0) {
			creep.memory.mode = 'empty'
		}
		if(creep.memory.mode === 'empty') {
			actions.refill(creep, true)
		} else {
			var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
			if(targets.length) {
				creep.say('🚧 build');
				if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
					creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
				}
			} else {
				roleUpgrader.run(creep)
			}
		}

	}
};

module.exports = roleBuilder;
