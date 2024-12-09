
var utils = {
    buildNear: function (position, structure = STRUCTURE_EXTENSION) {
        const room = Game.rooms[position.roomName]
        var searching = true
        const btmLeftX = position.x - 2
        const btmLeftY = position.y - 2
        var i = 0
        console.log('Searching! ', btmLeftX, btmLeftY, structure)
        while (searching && i < 50) {
            // [7, 8, 9]
            // [3, 4, 5]
            // [1, 2, 3]
            const x = btmLeftX + (i % 3)
            const y = btmLeftY + (Math.floor(i / 3))
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
            console.log('tried', x, y, 'res: ', res)
        }
        return !searching // (true if building, false if couldnt)
    },
    spawn: function (spawn) {

    }
}

module.exports = utils
