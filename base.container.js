


const { createBuildJob} = require('./utils.build')


function alreadyBuildingContainer (base) {
    const res = Object.values(base.jobs).some(j => j.structureType === STRUCTURE_CONTAINER)
   return res
}
function shouldBuildContainer (base) {
    if (base.revenue < 3) {
        return
    }
    let currentContainers = base.structures[STRUCTURE_CONTAINER].length
    let creeps = Object.keys(Game.creeps).length
    if (creeps > 15 && currentContainers <= 4 && !alreadyBuildingContainer(base)) {
        return true
    } else if (creeps > 10 && currentContainers <= 3 && !alreadyBuildingContainer(base)) {
        return true
    } else if (creeps > 7 && currentContainers <= 2 && !alreadyBuildingContainer(base)) {
        return true
    } else if (creeps > 3 && currentContainers <= 1 && !alreadyBuildingContainer(base)) {
        return true
    } else {
        return false
    }
}







module.exports.run = function (base, manifest) {
    let room = Game.rooms[base.name]
    // var res = room.createConstructionSite(x, y, structure);
    // addResourceRequests(base)
    // let containers = room.find(FIND_STRUCTURES, {
    //     filter: (s) => {
    //         return (s.structureType == STRUCTURE_EXTENSION || s.structureType == STRUCTURE_CONTAINER) &&
    //           s.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
    //     }
    // });
    // console.log(JSON.stringify(containers))
    // addEnergyRequest(base, base.structures[STRUCTURE_CONTAINER]) //containers)//
    if (shouldBuildContainer(base)) {
        createBuildJob(base, STRUCTURE_CONTAINER)
    }
    // addEnergyRequest(base, base.structures[STRUCTURE_CONTAINER])
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
