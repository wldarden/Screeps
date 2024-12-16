


const {getUniqueName} = require('./utils.spawner')
const {getSites, buildNear} = require('./utils.build')
const {addJobToBase} = require('./operation.job')
const {addEnergyRequest} = require('./utils.request')

function shouldBuildExtension (base) {
    let room = Game.rooms[base.name]
    return (
      room.controller.level >=2 &&
      base.structures[STRUCTURE_EXTENSION].length < 6 &&
      Object.keys(Game.creeps).length >= 5
    )
}
module.exports.run = function (base, manifest) {
    let room = Game.rooms[base.name]
    addEnergyRequest(base, base.structures[STRUCTURE_EXTENSION])
    // addResourceRequests(base)
    if (shouldBuildExtension(base)) {
        let activeSites = getSites(room)
        if (activeSites.length < 1) {
            //make a build site
            const structure = STRUCTURE_EXTENSION // TODO - build other things?
            let spawn = Game.getObjectById(base.structures[STRUCTURE_SPAWN][0])
            let sitePos = buildNear(spawn.pos, structure)
            if (sitePos) {
                const job = {
                    cat: 'build',
                    id: sitePos,
                    threat: 0,
                    steps: [
                        {id: base.structures[STRUCTURE_SPAWN][0], type: 'obj', action: ['withdraw']},
                        {id: sitePos, type: 'pos', action: ['build']}
                    ],
                    max: 1,
                    cost: 300,
                    creeps: [],
                    plan: [WORK, WORK, CARRY, MOVE] ,
                    reqs: { parts: [WORK, CARRY, MOVE] }
                }
                addJobToBase(base, job) // add to base, queue, etc.
            }
        }
    }
}
//   CONSTRUCTION_COST: {
//   "spawn": 15000,
//     "extension": 3000,
//     "road": 300,
//     "constructedWall": 1,
//     "rampart": 1,
//     "link": 5000,
//     "storage": 30000,
//     "tower": 5000,
//     "observer": 8000,
//     "powerSpawn": 100000,
//     "extractor": 5000,
//     "lab": 50000,
//     "terminal": 100000,
//     "container": 5000,
//     "nuker": 100000,
//     "factory": 100000
// },
