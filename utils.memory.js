module.exports.init = function() {
    //Remove defaults
    delete Memory.creeps;
    delete Memory.flags;
    delete Memory.rooms;
    delete Memory.spawns;

    //Add our defaults
    Memory.version = 1;
    Memory.bases = {};
    Memory.constructionSites = {};
    Memory.creeps = {};
    Memory.debug = {
        run: true,
        enableSay: false,
        logNext: false
    };
    Memory.flags = {};
    Memory.rooms = {};
    Memory.military = {
        roles: {},
        squads: {}
    };
    Memory.minerals = {};
    Memory.spawns = {};
    Memory.sources = {};
    Memory.structures = {};
    Memory.timers = {};

    Game.bases = {};
}

module.exports.createBaseMemory = function() {
    return {
        construction: {
            structures: [],
            roads: [],
            defenses: [],
            requestedCreepPriority: 0.0
        },
        rooms: [],
        spawns: [],
        sources: [],
        minerals: [],
        roles: {},
        structures: {},
        plan: {
            queued: {},
            built: {}
        },
        timers: {}
        // rooms: [],
        // spawns: {},
        // sources: {},
        // maxHarvesters: 0,
        // creepRequests: [],
        // structureRequests: []
    };
}

module.exports.createRoom = function() {
    return {
        scanned: false,
        owner: null,
        sources: [],
        minerals: [],
        defenseLevel: 0,
        threatLevel: 0,
        units: [],
        hostiles: []
    };
}

module.exports.createSource = function() {
    return {
        room: null,
        owner: null,
        distance: 0,
        harvesters: [],
        collectors: [],
        pos: null,
        maxHarvesters: 0,
        container: {
            id: null,
            site: null,
            pos: null,
            amount: 0
        },
    }
}

module.exports.createMineral = function() {
    return {
        room: null,
        owner: null,
        distance: 0,
        harvesters: [],
        collectors: [],
        pos: null,
        maxHarvesters: 0,
        container: {
            id: null,
            //site: null,
            pos: null,
            amount: 0,
            ready: false
        },
        extractor: {
            id: null,
            //site: null
        },
        type: null
    }
}

module.exports.createRoll = function() {
    return {
        parts: {
            move: 0,
            work: 0,
            carry: 0,
            attack: 0,
            ranged_attack: 0,
            tough: 0,
            heal: 0,
            claim: 0
        },
        creeps: []
    };
}
module.exports.createSquad = function() {
    return {
        power: 0,
        targetPower: 0,
        melee: 0,
        ranged: 0,
        heal: 0,
        creeps: []
    };
}


// module.exports.initBase = function (room) {
//     try {
//         const rawSources = room.find(FIND_SOURCES)
//         const sources = {}
//         let maxHarvesters = 0
//         rawSources.forEach(s => {
//             let slots = getMiningSlots(s)
//             sources[s.id] = {
//                 id: s.id,
//                 slots: slots,
//                 active: [],
//                 reserved: [],
//                 type: 'mine'
//             }
//             maxHarvesters += slots
//         })
//
//         Memory.bases[room.name] = {
//             name: room.name,
//             rooms: [room.name],
//             mode: 'init',
//             spawns: {},
//             sources: sources,
//             maxHarvesters: maxHarvesters,
//             creepRequests: [],
//             structureRequests: []
//         }
//     } catch (e) {
//         console.log("[!] initBase Error: " + e.stack)
//     }
//
// }
