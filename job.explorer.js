
const {ACTIONS, DONE} = require('./actions')
const {getDestNode} = require('./utils.nodes')
const {CREEP_MIN_LIFE_TICKS} = require('./config')

module.exports.run = function (creep, manifest) {
    try {
        //let node = Memory.nodes[creep.memory.nodeId]
        let room = creep.room
        let exit = room.find(FIND_EXIT_RIGHT)
        creep.moveTo(exit[1])
        if (creep.pos.isEqualTo(exit[1])) {
            console.log('we are at the exit. move right again')
            let moveRes = creep.move(RIGHT)
            console.log('moveRes', moveRes)
        }
        //
        //const exitDir = creep.room.findExitTo(anotherCreep.room);
        //const exit = creep.pos.findClosestByRange(exitDir);
        //creep.moveTo(exit);

    } catch (e) {
        console.log('Error: couldnt run explorer job', e.stack)
    }
}
