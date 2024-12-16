


const {getUniqueName} = require('./utils.spawner')
const {getSites, buildNear} = require('./utils.build')
const {addJobToBase} = require('./operation.job')
const {serializePos} = require('./utils.memory')
const {addEnergyRequest} = require('./utils.request')

function shouldBuildContainer (base) {
    let currentContainers = base.structures[STRUCTURE_CONTAINER].length
    let creeps = Object.keys(Game.creeps).length
    if (creeps > 15 && currentContainers <= 4) {
        return true
    } else if (creeps > 10 && currentContainers <= 3) {
        return true
    } else if (creeps > 7 && currentContainers <= 2) {
        return true
    } else if (creeps > 3 && currentContainers <= 1) {
        return true
    } else {
        return false
    }
}

function findContainerSite (position) {
    const room = Game.rooms[position.roomName]

    let res = room.createConstructionSite(position.x - 1, position.y, STRUCTURE_CONTAINER)
    if (res === 0) {
        return serializePos({x: position.x - 1, y: position.y, roomName: position.roomName})
    }
    res = room.createConstructionSite(position.x + 1, position.y, STRUCTURE_CONTAINER)
    if (res === 0) {
        return serializePos({x: position.x + 1, y: position.y, roomName: position.roomName})
    }
    res = room.createConstructionSite(position.x, position.y - 1, STRUCTURE_CONTAINER)
    if (res === 0) {
        return serializePos({x: position.x, y: position.y - 1, roomName: position.roomName})
    }
    res = room.createConstructionSite(position.x, position.y + 1, STRUCTURE_CONTAINER)
    if (res === 0) {
        return serializePos({x: position.x, y: position.y + 1, roomName: position.roomName})
    }
}
module.exports.run = function (base, manifest) {
    let room = Game.rooms[base.name]
    // var res = room.createConstructionSite(x, y, structure);
    // addResourceRequests(base)
    if (shouldBuildContainer(base)) {
        let activeSites = getSites(room)
        if (activeSites.length < 1) {
            //make a build site
            // const structure = STRUCTURE_CONTAINER // TODO - build other things?
            let spawn = Game.getObjectById(base.structures[STRUCTURE_SPAWN][0])
            let sitePos = findContainerSite(spawn.pos)
            console.log('sitePos', sitePos)
            if (sitePos) {
                const job = {
                    cat: 'build',
                    id: sitePos,
                    threat: 0,
                    steps: [
                        {id: base.structures[STRUCTURE_SPAWN][0], type: 'obj', action: ['withdraw']},
                        {id: sitePos, type: 'pos', action: ['build']}
                    ],
                    max: 2,
                    cost: 300,
                    creeps: [],
                    plan: [WORK, WORK, CARRY, MOVE] ,
                    reqs: { parts: [WORK, CARRY, MOVE] }
                }
                addJobToBase(base, job) // add to base, queue, etc.
            }
        }
    }
    addEnergyRequest(base, base.structures[STRUCTURE_CONTAINER])
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
