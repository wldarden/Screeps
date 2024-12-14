const {getSlotsAround, getSourcesForPos} = require('./utils.cartographer')
const {creepRunners} = require('./runners')
const {submitJob} = require('./operation.job')

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
        sources: getSourcesForPos(spawn.pos, spawn.room.find(FIND_SOURCES))
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
        let newSource = {
            id: source.id,
            pos: serializePos(source.pos),
            slots: getSlotsAround(source.pos),
            active: [],
            type: 'mine'
        }

        return newSource
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
            sourcePaths: {},
            creeps: [],
            // energyTargets: [],
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
            spawnRequests: [],
            buildRequests: [],
            roles: {},
            goal: {
                controllerLevel: 2
            },
            jobs: {

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
        let sources = room.find(FIND_SOURCES)
        base.sources = sources.map(s => {
            let src = createSource(s)
            for (let i = 0; i < src.slots; i++) {
                submitJob({
                    type: 'harvest',
                    id: `source_${src.id}_${i}`,
                    base: base.name,
                    threat: 0,
                    params: {
                        source: src.id
                    },
                    roles: ['harvester', 'peon']
                })
            }
            return src
        })
        // if (!s.mode) {
        //     // determine what strategy to use to mine this source
        //     for (let i = 0; i < newSource.slots; i++) {
        //         submitJob({
        //             type: 'harvest',
        //             id: `source_${source.id}_${i}`,
        //             base: source.room.name,
        //             params: {
        //                 source: source.id
        //             },
        //             roles: ['harvester', 'peon']
        //         })
        //     }
        // }
        for (let role in creepRunners) {
            base.roles[role] = createRole()
        }
        return base
    } catch (e) {
        console.log('Error createBase( ' + (room?.name ?? 'Undefined Room Name!') + ' ): ', e.stack)
        Memory.init = false
    }
}

function createRole () {
    try {
        return {
            parts: {
                [MOVE]: 0,
                [WORK]: 0,
                [CARRY]: 0,
                [ATTACK]: 0,
                [RANGED_ATTACK]: 0,
                [TOUGH]: 0,
                [HEAL]: 0,
                [CLAIM]: 0
            },
            creeps: []
        }
    } catch (e) {
        console.log('Error Creating RoleCount: ', e.stack)
    }
}
module.exports.createSource = createRole
