const {creepRunners} = require('./runners')


module.exports.run = function (base, manifest) {
    for (let roleName in base.roles) {
        let role = base.roles[roleName]
        role.creeps = role.creeps.filter(cId => {
            const isAlive = Game.creeps[cId]
            if (!isAlive) {
                creepRunners[role].onDestroy(cId)
                // need to recount parts
            } else {
                // Creep is alive
            }
        })
    }
}
