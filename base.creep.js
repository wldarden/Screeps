const {addJobToBase, fireCreep} = require('./operation.job')


module.exports.run = function (base, manifest) {
    base.creeps.forEach(cId => {
        if (!Game.creeps[cId]) {
            console.log('Dead Creep', cId, 'should be destroyed98989', JSON.stringify(Memory.creeps[cId]), JSON.stringify(Game.creeps[cId]), JSON.stringify(Memory.creeps[cId]))
            let creepMemory = Memory.creeps[cId]
            fireCreep(base, cId, creepMemory.jobId)
            base.creeps = base.creeps.filter(baseCreepId => baseCreepId !== cId) // remove creep from base
            delete Memory.creeps[cId] // destroy creep
        }
    })
}
