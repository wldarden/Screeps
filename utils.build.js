const {serializePos} = require('./utils.memory')


function getSites (room) {
    return room.find(FIND_CONSTRUCTION_SITES)
}
module.exports.getSites = getSites
function buildNear (position, structure = STRUCTURE_EXTENSION) {
    const room = Game.rooms[position.roomName]
    var searching = true
    const btmLeftX = position.x - 2
    const btmLeftY = position.y - 2
    var i = 0
    // let resX
    // let resY
    let siteId
    while (searching && i < 20) {
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
        console.log(res, x,y,'res loggg')
        if (res === 0) {
            searching = false
            siteId = room.getPositionAt(x,y).lookFor(LOOK_CONSTRUCTION_SITES)[0].id
            // resX = x
            // resY = y
        } else {
            i++
        }
    }
    return searching ? false : siteId // (false if couldnt, pos if building)
}

module.exports.buildNear = buildNear
