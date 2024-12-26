
function serializePos (pos) {
    if (typeof pos === 'string') {
        return pos
    }
    const x = (pos.x < 10) ? '0' + pos.x : pos.x.toString()
    const y = (pos.y < 10) ? '0' + pos.y : pos.y.toString()
    return x + y + pos.roomName;
}
module.exports.serializePos = serializePos

function deserializePos (pos) {
    if (typeof pos === 'string') {
        try {
            var x = parseInt(pos.slice(0, 2));
            var y = parseInt(pos.slice(2, 4));
            var room = pos.slice(4);
            return new RoomPosition(x, y, room);
        } catch (e) {
            console.log('ERROR: deserializingPos: ', 'stringified pos:', JSON.stringify(pos), 'obj pos:', pos, e)
        }
    } else {
        console.log('Tried to deseralize a non string: ', JSON.stringify(pos), pos)
        if (pos.x && pos.y && pos.roomName) {
            return new RoomPosition(pos.x, pos.y, pos.roomName)
        }
        return pos
    }
}
module.exports.deserializePos = deserializePos

module.exports.createSpawn = function (spawn) {
    return {
        id: spawn.name,
        room: spawn.room.name
    }
}

module.exports.createJob = function () {
    return {
        // group: 'main',
        // cat: 'mine',
        // threat: 0,
        // steps: [
        //     {id: source.id, type: 'src', action: ['harvest']},
        //     {id: base.name, type: 'base', action: ['transfer']}
        //     // {id: base.name, type: 'base', action: ['transfer', 'build', 'upgrade']}
        // ],
        // max: bestPlanROI.maxCreeps,
        // creeps: [],
        // cost: bestPlanROI.creepCost,
        // value: bestPlanROI.valuePerCreep,
        // plan: simplePlans[bestPlanIndex],
        // reqs: { parts: [WORK, CARRY, MOVE] }
    }
}

function createSourceOwner (source) {
    try {
        return {
            init: true,
            type: 'src',
            slots: {},
            creeps: [],
            dist: 1,
        }
    } catch (e) {
        console.log('Error Creating Source: ', e.stack)
    }
}
module.exports.createSourceOwner = createSourceOwner

module.exports.createBase = function (room) {
    try {
        let base =  {
            name: room.name,
            sources: [],
            creeps: {},
            structures: createStructureMap(),
            sites: {
                structures: [],
                roads: [],
                def: []
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

function createNode (parent, id, type = 'none', subType = '') {
    return {
        parent: parent, // undefined || nodeId
        type: type, // base, outpost, src, spawn, controller, storage, fort,
        sub: subType, // STRUCTURE_*,
        id: id,
        children: {},
    }
}

module.exports.createBaseNode = function (room) {
    try {
        let base =  {
            structures: createStructureMap(),
            sites: {
                structures: [],
                roads: [],
                def: []
            },

            id: room.name,
            nodeType: 'base',
            parent: null,
            nodes: {
                // strId?
                // [structureType]: [strId, strId]?
            },
            creeps: {
                // [role]: [cId, cId, cId]
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

function createStructureMap () {
    return {
        [STRUCTURE_CONTAINER]: [],
        [STRUCTURE_CONTROLLER]: [],
        [STRUCTURE_EXTENSION]: [],
        [STRUCTURE_SPAWN]: [],
        [STRUCTURE_STORAGE]: [],
        piles: [], // places we dropped energy
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
// module.exports.createRole = createRole
