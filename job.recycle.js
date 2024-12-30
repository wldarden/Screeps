// OK	0
// The operation has been scheduled successfully.
//
//   ERR_NOT_OWNER	-1
// You are not the owner of this spawn or the target creep.
//
//   ERR_INVALID_TARGET	-7
// The specified target object is not a creep.
//
//   ERR_NOT_IN_RANGE	-9
// The target creep is too far away.
//
//   ERR_RCL_NOT_ENOUGH	-14
// Your Room Controller level is insufficient to use this spawn.
module.exports.run = function (creep) {
    try {
        let base = Memory.nodes[creep.memory.base]

        let target = Game.getObjectById(base.structures[STRUCTURE_SPAWN][0])

        let actionRes = target.recycleCreep(creep)
        switch (actionRes) {
            case ERR_NOT_IN_RANGE:
                creep.moveTo(target, {range: 1, visualizePathStyle: {stroke: '#BB0000'}})
                break
            case OK:
                break
            default:
                break
        }
    } catch (e) {
        console.log('Error: couldnt run recycle job', e.stack)
    }
}
