


const {getUniqueName} = require('./utils.spawner')
const {getSites, buildNear} = require('./utils.build')
const {addJobToBase} = require('./operation.job')


module.exports.run = function (base, manifest) {
    let room = Game.rooms[base.name]

    // addResourceRequests(base)
    if (room.controller.level >=2 && base.structures[STRUCTURE_EXTENSION].length < 6 && Object.keys(Game.creeps).length >= 5) {
        let activeSites = getSites(room)
        if (activeSites.length < 1) {
            //make a build site
            let spawn = Game.getObjectById(base.structures[STRUCTURE_SPAWN][0])
            let siteId = buildNear(spawn.pos, STRUCTURE_EXTENSION)
            if (siteId) {
                const job = {
                    cat: 'build',
                    id: siteId,
                    threat: 0,
                    steps: [
                        {id: base.structures[STRUCTURE_SPAWN][0], type: 'obj', action: ['withdraw']},
                        {id: controllerId, type: 'obj', action: ['build']}
                        // {id: base.name, type: 'base', action: ['transfer', 'build', 'upgrade']}
                    ],
                    cost: 300,
                    creeps: [],
                    plan: [WORK, CARRY, CARRY, MOVE, MOVE] ,
                    reqs: { parts: [WORK, CARRY, MOVE] }
                }
                base = addJobToBase(base, job) // add to base, queue, etc.
            }

        }
    }
}
