
// OK	0
// The operation has been scheduled successfully.
//
//   ERR_NOT_OWNER	-1
// You are not the owner of this creep, or there is a hostile rampart on top of the target.
//
//   ERR_BUSY	-4
// The creep is still being spawned.
//
//   ERR_NOT_ENOUGH_RESOURCES	-6
// The target does not have the given amount of resources.
//
//   ERR_INVALID_TARGET	-7
// The target is not a valid object which can contain the specified resource.
//
//   ERR_FULL	-8
// The creep's carry is full.
//
// ERR_NOT_IN_RANGE	-9
// The target is too far away.
//
//   ERR_INVALID_ARGS	-10
// The resourceType is not one of the RESOURCE_* constants, or the amount is incorrect.


const {ACTIONS, DONE} = require('./actions')
const {containerized} = require('./utils.source')

module.exports.run = function (creep, manifest) {
    try {
        // let srcId = creep.memory.src
        // let src = Memory.nodes[srcId]
        // console.log('Creep src', creep.name, srcId, src)
        // if (src && src.structures && src.structures[STRUCTURE_CONTAINER][0]) {
        //     let containerId = src.structures[STRUCTURE_CONTAINER][0]
        //     if (creep.store.getUsedCapacity() === 0) {
        //         ACTIONS.withdraw.start(creep, containerId)
        //         return
        //     } else {
        //         ACTIONS.transfer.start(creep, creep.memory.nodeId)
        //         return
        //     }
        // }
        // console.log('Error: bad courier', creep.name, srcId)
        if (creep.store.getUsedCapacity() === 0) {
            let base = Memory.nodes[creep.memory.base]
            let fullContainerId
            base.sources.find(srcId => {
                if (containerized(srcId)) {
                    let containerId = Memory.nodes[srcId].structures[STRUCTURE_CONTAINER][0]
                    if (containerId) {
                        let container = Game.getObjectById(containerId)
                        if (container && container.store.getUsedCapacity() > 0) {
                            fullContainerId = containerId
                            return true
                        }
                    }
                }
            })
            if (fullContainerId) {
                ACTIONS.withdraw.start(creep, fullContainerId)
                return
            }
        } else {
            ACTIONS.transfer.start(creep, creep.memory.nodeId)
            return
        }

        // let target = getStepEntity(step, creep.memory.actionIndex)
        //
        // let actionRes = creep.withdraw(target, RESOURCE_ENERGY)
        // switch (actionRes) {
        //     case ERR_NOT_IN_RANGE:
        //         creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}})
        //         break
        //     case ERR_TIRED:
        //         console.log('creep says they are tired: ', creep.name)
        //         break
        //     case ERR_NOT_ENOUGH_RESOURCES:
        //         // hybernate a bit maybe?
        //         nextStep(creep)
        //         break
        //     case ERR_FULL:
        //         nextAction(creep, step)
        //         break
        //     case OK:
        //         if (creep.store.getFreeCapacity() === 0) {
        //             nextStep(creep)
        //         }
        //         break
        //     default:
        //         console.log('Error: Withdraw Action Response not handled: ', creep.name, actionRes, step.id)
        //         break
        // }

    } catch (e) {
        console.log('Error: couldnt run courier job', e.stack)
    }

}
