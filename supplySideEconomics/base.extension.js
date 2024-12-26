


const {createBuildJob} = require('./utils.build')

function shouldBuildExtension (base) {
    let room = Game.rooms[base.name]
    // console.log('room.controller.level >= 2 ', room.controller.level >= 2 )
    return (
      room.controller.level >= 2 &&
      base.structures[STRUCTURE_EXTENSION].length < 6 &&
      Object.keys(Game.creeps).length >= 5 &&
      !Object.values(base.jobs).some(j => j.structureType === STRUCTURE_EXTENSION)
    )
}
module.exports.run = function (base, manifest) {
    let room = Game.rooms[base.name]
    // addEnergyRequest(base, base.structures[STRUCTURE_EXTENSION])
    // addResourceRequests(base)
    if (shouldBuildExtension(base)) {
      console.log('tried to build extension')
        createBuildJob(base, STRUCTURE_EXTENSION)
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
