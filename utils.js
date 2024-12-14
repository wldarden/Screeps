
var utils = {
    buildNear: function (position, structure = STRUCTURE_EXTENSION) {
        const room = Game.rooms[position.roomName]
        var searching = true
        const btmLeftX = position.x - 2
        const btmLeftY = position.y - 2
        var i = 0
        while (searching && i < 50) {
            // [7, 8, 9]
            // [3, 4, 5]
            // [1, 2, 3]
            const x = btmLeftX + ((i % 3) * 2)
            const y = btmLeftY + (Math.floor(i / 3) * 2)
            var res = room.createConstructionSite(x, y, structure);
            // OK	                  0 The operation has been scheduled successfully.
            // ERR_NOT_OWNER	     -1 The room is claimed or reserved by a hostile player.
            // ERR_INVALID_TARGET	 -7 The structure cannot be placed at the specified location.
            // ERR_FULL	           -8 You have too many construction sites. The maximum number of construction sites per player is 100.
            // ERR_INVALID_ARGS	  -10 The location is incorrect.
            // ERR_RCL_NOT_ENOUGH	-14 Room Controller Level insufficient. Learn more
            if (res === 0) {
                searching = false
            } else {
                i++
            }
        }
        return !searching // (true if building, false if couldnt)
    },
    spawn: function (spawn) {

    },
    freeResources: function () {
        const freeCreeps = []
        const freeSpawns = []
        for(var name in Memory.creeps) {
            let creep = Game.creeps[name]
            if(!creep) {
                delete Memory.creeps[name];
                console.log('Clearing non-existing creep memory:', name);
            } else {
                if (!creep.general) {
                    freeCreeps.push(creep)
                }
            }
        }
        for(var name in Memory.spawns) {
            let spawn = Game.spawns[name]
            if (!spawn.general) {
                freeSpawns.push(spawn)
            }
        }
        return {freeCreeps, freeSpawns}
    },
    getMiningSlots: function (source, terrain) {
        if (!terrain) {
            terrain = source.room.getTerrain()
        }
        let slots = 0
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                if (x !== 0 && y !== 0) {
                    if (terrain.get(x + source.pos.x,y + source.pos.y) !== 1) {
                        slots++
                    }
                }
            }
        }
        return slots
    }
}

module.exports = utils
