const {fireCreep} = require('./operation.job')


module.exports.run = function (base, manifest) {
    base.creeps.forEach(cId => {
        if (!Game.creeps[cId]) {
            let creepMemory = Memory.creeps[cId]
            fireCreep(base, cId, creepMemory.jobId)
            base.creeps = base.creeps.filter(baseCreepId => baseCreepId !== cId) // remove creep from base
            delete Memory.creeps[cId] // destroy creep
        }
    })
}
