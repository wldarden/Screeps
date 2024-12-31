
// OK	0
// The operation has been scheduled successfully.
//
//   ERR_NOT_OWNER	-1
// You are not the owner of this creep.
//
//   ERR_BUSY	-4
// The creep is still being spawned.
//
//   ERR_NOT_ENOUGH_RESOURCES	-6
// The creep does not have any carried energy.
//
//   ERR_INVALID_TARGET	-7
// The target is not a valid construction site object or the structure cannot be built here (probably because of a creep at the same square).
//
// ERR_NOT_IN_RANGE	-9
// The target is too far away.
//
//   ERR_NO_BODYPART	-12
// There are no WORK body parts in this creep’s body.
const {deserializePos} = require('./utils.memory')
const {ACTIONS, DONE} = require('./actions')
const {energy} = require('./utils.manifest')
const {addCreepToNode} = require('./utils.nodes')

function finishBuild (creep) {
    delete creep.memory.site
}
module.exports.run = function (creep, manifest) {
    try {

        const energyNeeded = creep.store.getFreeCapacity()
        if (energyNeeded > 0) {
            let energyReq = energy.getSrc(manifest, creep, energyNeeded)
            if (energyReq) {
                let target = Game.getObjectById(energyReq.id)
                ACTIONS.withdraw.start(creep, target.id)
            }
        } else {
            let buildSite = Game.getObjectById(creep.memory.nodeId)
            if (buildSite) {
                ACTIONS.build.start(creep, creep.memory.nodeId)
            } else {
                let newReq = energy.getDest(manifest, creep, null, (req) => req.action === 'build' && (!req.creeps || Object.keys(req.creeps).length < 2))
                console.log('builder newReq', newReq.id)
                if (newReq) {
                    addCreepToNode(newReq.id, 'builder', creep.name)
                } else {
                    ACTIONS.recycle.start(creep)
                    let req = energy.getDest(manifest, creep)
                    if (req?.id) {
                        switch (req.action) {
                            case 'build':
                                ACTIONS.build.start(creep, req.id)
                                return
                            case 'transfer':
                            default:
                                ACTIONS.transfer.start(creep, req.id)
                                return
                        }
                    }
                }
            }
        }

    } catch (e) {
        console.log('Error: couldnt run build job', e.stack)
    }
}

