
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

function finishBuild (creep) {
    delete creep.memory.site
}
module.exports.run = function (creep, manifest) {
    try {
        const memSiteInvalid = creep.memory.site && (!manifest.req?.build?.length || manifest.req?.build[0].siteId !== creep.memory.site)
        if (memSiteInvalid) { // remove invalid sites in memory
            delete creep.memory.site
            return DONE
        }

        if (!creep.memory.site) { //
            const newBuildSiteExists = manifest.req?.build?.length
            if (newBuildSiteExists) {
                const priorityReq = manifest.req.build[0]
                if (priorityReq.siteId) {
                    creep.memory.site = priorityReq.siteId
                } else {
                    const pos = deserializePos(priorityReq.pos)
                    creep.moveTo(pos) // if siteId hasnt been registered yet, move towards build until it has
                    return
                }
            }
        }

        let target = Game.getObjectById(creep.memory.site)

        if (creep.store.getUsedCapacity() === 0) {
            ACTIONS.fill.start(creep, target?.pos)
        } else {
            ACTIONS.build.start(creep, creep.memory.site)
        }

    } catch (e) {
        console.log('Error: couldnt run build job', e.stack)
    }
}

