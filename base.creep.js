const {ACTIONS} = require('./actions')


module.exports.run = function (base, manifest) {
    Object.keys(base.creeps).forEach(role => {
        base.creeps[role].forEach(cId => {
            if (!Game.creeps[cId]) {
                let creepMemory = Memory.creeps[cId]
                while (creepMemory?.actions?.length) {
                    ACTIONS[creepMemory.actions[0]].finish({memory: creepMemory})
                }
                if (Memory.nodes[creepMemory.node] && Memory.nodes[creepMemory.node].creeps) {
                    Memory.nodes[creepMemory.node].creeps = Memory.nodes[creepMemory.node].creeps.filter(nodeCreepId => nodeCreepId !== cId)
                    //TODO - base nodes arent covered here
                }
                base.creeps[role] = base.creeps[role].filter(baseCreepId => baseCreepId !== cId) // remove creep from base
                if (creepMemory.src) {
                    // remove harvest fields
                    // Memory.sources[creepMemory.src].slots
                }

                delete Memory.creeps[cId] // destroy creep
            }
        })
    })
}
