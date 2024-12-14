const {addTrgSources} = require('./base.source')
const {onDestroyCommon, validatePriorityTarget, validatePrioritySrc, setCreepSrcTrg} = require('./utils.creep')
const {harvest, doAction} = require('./actions')
const {controllerNeedsEnergy} = require('./base.controller')

const CORE_PARTS = [WORK, CARRY, MOVE, MOVE]; //250
const REPEAT_PARTS = [WORK, CARRY];

module.exports.buildCreep = function (maxEnergy) {
    return CORE_PARTS
}


module.exports.onCreate = function(name) {
}

module.exports.onDestroy = function(name) {
    onDestroyCommon(name)
}

module.exports.run = function (creep, manifest) {
    try {
        if (creep.spawning) {
            return
        }
        if (creep.memory.status === 'init' && !creep.memory.target) { // TODO - add some time check here every so often
            validatePriorityTarget(creep)
            creep.memory.status = 'empty'
        }
        if (creep.store.getUsedCapacity() === 0) {
            creep.memory.status = 'empty'
        }


        if (creep.memory.status === 'full') { // trying to distribute energy
            if (!creep.memory.target) { // TODO - add some time check here every so often
                validatePriorityTarget(creep)
            }
            // go to target
            switch (doAction(creep)) {
                case OK:
                    if (creep.store.getUsedCapacity() === 0) {
                        creep.memory.target = controllerNeedsEnergy(creep.room.controller)
                          ? creep.room.controller.id : validatePriorityTarget(creep)
                        validatePrioritySrc(creep)
                    }
                    break
            }
        } else {
            harvest(creep)
        }

        // // we have a target, and a srcTrg.
        // if (creep.memory.status === 'full') {
        //     // go to target
        //     if (!creep.memory.target) {
        //         validatePriorityTarget(creep)
        //     }
        //     const trgObject = Game.getObjectById(creep.memory.target)
        //     const actionRes = creep.upgradeController(creep.room.controller)
        //     switch (actionRes) {
        //         case ERR_NOT_IN_RANGE:
        //             creep.moveTo(trgObject, {visualizePathStyle: {stroke: '#ffffff'}})
        //             break
        //         case OK:
        //             if (creep.store.getUsedCapacity() === 0) {
        //                 creep.memory.status = 'empty'
        //                 const UPGRADING = controllerNeedsEnergy(creep.room.controller)
        //                 if (UPGRADING) {
        //                     creep.memory.target = creep.room.controller.id
        //                     validatePrioritySrc(creep)
        //                 } else {
        //                     // find other target
        //                     validatePriorityTarget(creep)
        //                     validatePrioritySrc(creep)
        //                 }
        //             }
        //             // if (creep.store.getUsedCapacity() === 0) {
        //             //     creep.memory.status = 'empty'
        //             //     const UPGRADING = controllerNeedsEnergy(creep.room.controller)
        //             //     if (UPGRADING) {
        //             //         creep.memory.target = creep.room.controller.id
        //             //         validatePrioritySrc(creep)
        //             //     } else {
        //             //         // find other target
        //             //         validatePriorityTarget(creep)
        //             //         validatePrioritySrc(creep)
        //             //     }
        //             // }
        //             break
        //     }
        // } else {
        //     harvest(creep)
        // }

    } catch(e) {
        console.log('Error running creep: ', creep?.name, e.stack)
    }
}


