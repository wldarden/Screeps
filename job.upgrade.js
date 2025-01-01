

// OK	0
// The operation has been scheduled successfully.
//
//   ERR_NOT_OWNER	-1
// You are not the owner of this creep or the target controller.
//
//   ERR_BUSY	-4
// The creep is still being spawned.
//
//   ERR_NOT_ENOUGH_RESOURCES	-6
// The creep does not have any carried energy.
//
//   ERR_INVALID_TARGET	-7
// The target is not a valid controller object, or the controller upgrading is blocked.
//
//   ERR_NOT_IN_RANGE	-9
// The target is too far away.
//
//   ERR_NO_BODYPART	-12
// There are no WORK body parts in this creep’s body.

const {nextStep} = require('./utils.creep')
const {ACTIONS} = require('./actions')
const {energy} = require('./utils.manifest')


function primarySrc (creep, node) {
    if (node.primarySrc) {
        return node.primarySrc.some(d => {
            let gamePrimary = Game.getObjectById(d)
            if (gamePrimary) {
                if (gamePrimary.store && gamePrimary.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
                    ACTIONS.withdraw.start(creep, d)
                    return true
                }
            }
        })
    }
}

module.exports.run = function (creep, manifest) {
    try {
        //let roomEnergyFrac = Game.rooms[creep.pos.roomName].energyAvailable / Game.rooms[creep.pos.roomName].energyCapacityAvailable
        //if ( roomEnergyFrac < .5) {
        //    return
        //}
        //const energyNeeded = creep.store.getFreeCapacity()
        //if (energyNeeded === 0) {
        //    ACTIONS.upgrade.start(creep, creep.memory.nodeId)
        //} else {
        //    let energyReq = energy.getSrc(manifest, creep, energyNeeded)
        //    if (energyReq) {
        //        let target = Game.getObjectById(energyReq.id)
        //        ACTIONS.withdraw.start(creep, target.id)
        //    }
        //    return
        //}



        if (creep.store.getFreeCapacity() === 0) {
            ACTIONS.upgrade.start(creep, creep.memory.nodeId)
            return
        } else {
            if (creep.memory.nodeId) {
                let node = Memory.nodes[creep.memory.nodeId]
                if (primarySrc(creep, node)) {
                    return
                }
                //else if (node.type === 'src' && node.stage === 3) { // stage 3 src miners will remain at src
                //    return
                //} else { // lower stage src miners will travel to destinations
                //    let target = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES, {maxOps: 500, ignoreCreeps: true});
                //    if (target) {
                //        ACTIONS.build.start(creep, target.id)
                //        return
                //    }
                //    target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                //        maxOps: 500, ignoreCreeps: true,
                //        filter: function(object) {
                //            return object.store && object.store.getFreeCapacity(RESOURCE_ENERGY)
                //        }
                //    })
                //    if (target) {
                //        ACTIONS.transfer.start(creep, target.id)
                //        return
                //    }
                //}
            }
        }

        // let base = Memory.nodes[creep.memory.base]
        // let job = base.jobs[creep.memory.jobId]
        // let step = job.steps[creep.memory.step]
        //
        //
        // if (!creep.memory.dest) {
        //     creep.memory.dest = getStepEntityId(getCreepStep(creep, job), creep.memory.step)
        // }
        // let target = getStepEntity(step)
        //
        // let actionRes = creep.upgradeController(target)
        // switch (actionRes) {
        //     case ERR_NOT_IN_RANGE:
        //         creep.moveTo(target, {range: 2, visualizePathStyle: {stroke: '#ffffff'}})
        //         break
        //     case ERR_TIRED:
        //         console.log('creep says they are tired: ', creep.name)
        //         break
        //     case ERR_NOT_ENOUGH_RESOURCES:
        //         // hybernate a bit maybe?
        //         nextStep(creep)
        //         break
        //     case OK:
        //         if (creep.store.getUsedCapacity() === 0) {
        //             nextStep(creep)
        //         }
        //         break
        //     default:
        //         console.log('Error: Upgrade Action Response not handled: ', actionRes)
        //         break
        // }

    } catch (e) {
        console.log('Error: couldnt run upgrade job', e.stack)
    }
}
