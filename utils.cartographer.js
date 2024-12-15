const {serializePos} = require('./utils.memory')

module.exports.getSlotsAround = function (pos) {
    try {
        let room
        let terrain
        try {
            room = Game.rooms[pos.roomName]
        } catch (e) {
            console.log('Error: getting room: ', pos.roomName, e.stack)
        }
        try {
            terrain = room.getTerrain()
        } catch (e) {
            console.log('Error: getting room terrain: ', pos.roomName, e.stack)
        }
        let res = []
        // let count = 0
        const minCheckX = pos.x === 0 ? 0 : -1
        const minCheckY = pos.y === 0 ? 0 : -1
        const maxCheckX = pos.x === 49 ? 0 : 1
        const maxCheckY = pos.y === 49 ? 0 : 1
        for (let x = minCheckX; x <= maxCheckX; x++) {
            for (let y = minCheckY; y <= maxCheckY; y++) {
                if (x !== 0 || y !== 0) {
                    const checkX = x + pos.x
                    const checkY = y + pos.y
                    if (terrain.get(checkX, checkY) !== 1) {
                        res.push(serializePos({x: checkX, y: checkY, roomName: pos.roomName}))
                        // count++
                    }
                }
            }
        }
        return res
    } catch (e) {
        console.log('Error: getSlotsAround', JSON.stringify(pos), e.stack)
    }


    // try {
    //     let room
    //     let terrain
    //     try {
    //         room = Game.rooms[pos.roomName]
    //     } catch (e) {
    //         console.log('Error: getting room: ', pos.roomName, e.stack)
    //     }
    //     try {
    //         terrain = room.getTerrain()
    //     } catch (e) {
    //         console.log('Error: getting room terrain: ', pos.roomName, e.stack)
    //     }
    //     let res = []
    //     const minCheckX = pos.x === 0 ? 0 : -1
    //     const minCheckY = pos.y === 0 ? 0 : -1
    //     const maxCheckX = pos.x === 49 ? 0 : 1
    //     const maxCheckY = pos.y === 49 ? 0 : 1
    //     for (let x = minCheckX; x <= maxCheckX; x++) {
    //         for (let y = minCheckY; y <= maxCheckY; y++) {
    //             if (x !== 0 && y !== 0) {
    //                 const checkX = x + pos.x
    //                 const checkY = y + pos.y
    //                 if (terrain.get(checkX, checkY) !== 1) {
    //                     res.push([checkX, checkY])
    //                 }
    //             }
    //         }
    //     }
    //     return res
    // } catch (e) {
    //     console.log('Error: getSlotsAround', JSON.stringify(pos), e.stack)
    // }
}

// returns array of source ids in order of dist from pos
module.exports.getSourcesForPos = function (position = {}, sources = {}) {
    try {
        let pos = position
        if (!position.roomName && position.pos) {
            // position is an obj, not a RoomPosition
            pos = position.pos
        }
        console.log('Heavy: initializing source array for ', position)
        return sources.map(s => ({id: s.id, dist: pos.findPathTo(s).length}))
          .sort((a,b) => (a.dist ?? 100) - (b.dist ?? 100))
          .map(s => s.id)
    } catch (e) {
        console.log('Error: getSourcesForPos', e.stack)
    }

}
