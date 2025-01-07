

module.exports.MIN_ENERGY_UPGRADE = 300
module.exports.MIN_ENERGY_BUILD = 250
module.exports.CREEP_MIN_LIFE_TICKS = 40

module.exports.SHOW_PATHS = true
module.exports.PRIORITY = {
	BUILD: 5
}


const ALL_DEBUG_LOG_TYPES = [
	'DEFAULT',
	'NODE',   // log all nodes
	'BASE_NODE',   // log 'base' type nodes
	'SRC_NODE', // log 'src' type nodes
	'CONTROLLER_NODE',   // log 'controller' type nodes
	'SPAWN_NODE',   // log 'spawn' type nodes
	'LOGISTIC_NODE',   // log 'storage' type nodes
	'FORT_NODE',   // log 'fort' type nodes
	'CREEP_OBJ',  // log all Creeps
	'CREEP_ROLE_MINE', // log mine role Creeps
	'MANIFEST'
]

const MINING_LOG_TYPES = [
	'SRC_NODE_OBJ', // log src Nodes
	'CREEP_ROLE_MINE', // log Creeps with Mining Role
]


/**
 * Defines a collection of debug types to activate
 */
const DEBUG_MODES = {
	ALL: [...ALL_DEBUG_LOG_TYPES],
	MINING: [...MINING_LOG_TYPES],
	NONE: []
}

const ACTIVE_MODES = ['DEFAULT', 'ERROR'] // list debug modes you want to activate here
const activeTypeArray = ACTIVE_MODES.reduce((acc , mode) => {
	if (DEBUG_MODES[mode]) {
		DEBUG_MODES[mode].forEach(type => { // get the mode array of types,
			if (!acc.some(a => a === type)) { // and if its not in the acc already,
				acc.push(type) // add it
			}
		})
	} else {
		acc.push(mode)
	}

	return acc
}, [])

module.exports.ACTIVE_DEBUG_LOG_TYPES = activeTypeArray


