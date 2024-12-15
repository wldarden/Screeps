// const {creepRunners} = require('./runners')

function serializePos (pos) {
    const x = (pos.x < 10) ? '0' + pos.x : pos.x.toString()
    const y = (pos.y < 10) ? '0' + pos.y : pos.y.toString()
    return x + y + pos.roomName;
}
module.exports.serializePos = serializePos

function deserializePos (pos) {
    if (typeof pos === 'string') {
        var x = parseInt(pos.slice(0, 2));
        var y = parseInt(pos.slice(2, 4));
        var room = pos.slice(4);
        return new RoomPosition(x, y, room);
    } else {
        return pos
    }
}
module.exports.deserializePos = deserializePos

module.exports.createSpawn = function (spawn) {
    return {
        id: spawn.name,
        room: spawn.room.name,
        sources: []
    }
}

module.exports.createJob = function () {
    return {
        id: null,
        base: null,
        priority: 0,
        time: Game.time,
        roles: [],
        creeps: [],
        reserved: false
    }
}

function createSource (source) {
    try {
        return {
            id: source.id,
            pos: serializePos(source.pos),
            slots: [],
            plan: 'simple',
            active: [],
            jobs: []
        }
    } catch (e) {
        console.log('Error Creating Source: ', e.stack)
    }
}
module.exports.createSource = createSource

module.exports.createBase = function (room) {
    try {
        let base =  {
            name: room.name,
            sources: [],
            creeps: [],
            targets: {
                [RESOURCE_ENERGY]: []
            },
            structures: {
                [STRUCTURE_CONTAINER]: [],
                [STRUCTURE_CONTROLLER]: [],
                [STRUCTURE_EXTENSION]: [],
                [STRUCTURE_SPAWN]: [],
                [STRUCTURE_STORAGE]: [],
                // [STRUCTURE_ROAD]: [],
                // [STRUCTURE_WALL]: [],
                // [STRUCTURE_RAMPART]: "rampart",
                // [STRUCTURE_KEEPER_LAIR]: "keeperLair",
                // [STRUCTURE_PORTAL]: "portal",
                // [STRUCTURE_LINK]: "link",
                // [STRUCTURE_TOWER]: "tower",
                // [STRUCTURE_OBSERVER]: "observer",
                // [STRUCTURE_POWER_BANK]: "powerBank",
                // [STRUCTURE_POWER_SPAWN]: "powerSpawn",
                // [STRUCTURE_EXTRACTOR]: "extractor",
                // [STRUCTURE_LAB]: "lab",
                // [STRUCTURE_TERMINAL]: "terminal",
                // [STRUCTURE_NUKER]: "nuker",
                // [STRUCTURE_FACTORY]: "factory",
                // [STRUCTURE_INVADER_CORE]: "invaderCore",
            },
            jobs: {},
            queue: {
                mine: [],
                build: [],
                upgrade: []
            }
        }

        let structs = room.find(FIND_STRUCTURES)
        structs.forEach(s => {
            if (!base.structures[s.structureType]) {
                base.structures[s.structureType] = [s.id]
            } else {
                base.structures[s.structureType].push(s.id)
            }
        })
        return base
    } catch (e) {
        console.log('Error createBase( ' + (room?.name ?? 'Undefined Room Name!') + ' ): ', e.stack)
        Memory.init = false
    }
}

// function createRole () {
//     try {
//         return {
//             parts: {
//                 [MOVE]: 0,
//                 [WORK]: 0,
//                 [CARRY]: 0,
//                 [ATTACK]: 0,
//                 [RANGED_ATTACK]: 0,
//                 [TOUGH]: 0,
//                 [HEAL]: 0,
//                 [CLAIM]: 0
//             },
//             creeps: []
//         }
//     } catch (e) {
//         console.log('Error Creating RoleCount: ', e.stack)
//     }
// }
// module.exports.createSource = createRole
