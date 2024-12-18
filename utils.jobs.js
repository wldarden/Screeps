const {creepPlanInfo, ticksPerSpace} = require('./utils.creep')


function reserveSrcSlot (base, creep, srcId) {
    // let baseSourceIndex = base.sources.findIndex(s => s.id === srcId)
    // if (baseSourceIndex !== -1) {
    //     let openPos = base.sources[baseSourceIndex].slots.find(s => !base.sources[baseSourceIndex].active.includes(s))
    //     if (openPos) {
    //         base.sources[baseSourceIndex].active.push(openPos)
    //         creep.memory.srcSlot = openPos
    //         return true
    //     }
    // }
    // return false

    let baseSourceIndex = base.sources.findIndex(s => s.id === srcId)
    if (baseSourceIndex !== -1) {
        let src = base.sources[baseSourceIndex]
        if (src) {
            let openPos = src.slots.find(s => !src.activePos[s])
            if (openPos) {
                base.sources[baseSourceIndex].active.push(creep.name)
                base.sources[baseSourceIndex].activePos[openPos] = creep.name
                creep.memory.srcSlot = openPos
                creep.memory.srcIndex = baseSourceIndex
                // creep.memory.srcBase = base.name
                return true
            }
        }
    }

    return false
}
module.exports.reserveSrcSlot = reserveSrcSlot
function freeSrcSlot (base, creepName) {
    // if (Memory.creeps[creepName].srcSlot) {
    //     let baseSourceIndex = base.sources.findIndex(s => s.id === srcIndex)
    //     if (baseSourceIndex !== -1) {
    //         base.sources[baseSourceIndex].active = base.sources[baseSourceIndex].active.filter(a => a !== Memory.creeps[creepName].srcSlot)
    //         delete Memory.creeps[creepName].srcSlot
    //         return true
    //     }
    //     return false
    // }[
    // return true // there wasn't a srcSlot to free... so success?

    if (Memory.creeps[creepName].srcSlot) {
        let baseSourceIndex = Memory.creeps[creepName].srcIndex
        if (baseSourceIndex !== undefined && baseSourceIndex !== -1) {
            base.sources[baseSourceIndex].active = base.sources[baseSourceIndex].active.filter(a => a !== creepName)
            base.sources[baseSourceIndex].activePos[Memory.creeps[creepName].srcSlot] = false
            delete Memory.creeps[creepName].srcSlot
            return true
        }
        return false
    }
    return true // there wasn't a srcSlot to free... so success?
}
module.exports.freeSrcSlot = freeSrcSlot

// MOVE: "move",
//   WORK: "work",
//   CARRY: "carry",
//   ATTACK: "attack",
//   RANGED_ATTACK: "ranged_attack",
//   TOUGH: "tough",
//   HEAL: "heal",
//   CLAIM: "claim",
//
//   BODYPART_COST: {
//     "move": 50,
//       "work": 100,
//       "attack": 80,
//       "carry": 50,
//       "heal": 250,
//       "ranged_attack": 150,
//       "tough": 10,
//       "claim": 600
// },

// // WORLD_WIDTH and WORLD_HEIGHT constants are deprecated, please use Game.map.getWorldSize() instead
// WORLD_WIDTH: 202,
//   WORLD_HEIGHT: 202,
//
//   CREEP_LIFE_TIME: 1500,
//   CREEP_CLAIM_LIFE_TIME: 600,
//   CREEP_CORPSE_RATE: 0.2,
//   CREEP_PART_MAX_ENERGY: 125,
//
//   CARRY_CAPACITY: 50,
//   HARVEST_POWER: 2,
//   HARVEST_MINERAL_POWER: 1,
//   HARVEST_DEPOSIT_POWER: 1,
//   REPAIR_POWER: 100,
//   DISMANTLE_POWER: 50,
//   BUILD_POWER: 5,
//   ATTACK_POWER: 30,
//   UPGRADE_CONTROLLER_POWER: 1,
//   RANGED_ATTACK_POWER: 10,
//   HEAL_POWER: 12,
//   RANGED_HEAL_POWER: 4,
//   REPAIR_COST: 0.01,
//   DISMANTLE_COST: 0.005,
const ACTION_SPEED = {
    build: BUILD_POWER,
    harvest: HARVEST_POWER,
    upgrade: UPGRADE_CONTROLLER_POWER
}
const RANGED_ACTIONS = ['build']

function creepValuePerTick (action, roi) {
    const {loadTicks, cost, load} = roi
    let actionEnergyPerTick
    switch (action) {
        case 'pickup':
            actionEnergyPerTick = load / loadTicks
            break
        case 'upgrade':
        case 'build':
            actionEnergyPerTick = -(load / loadTicks)
            break
        default:
            actionEnergyPerTick = -.1
            break
    }
    const creepCostPerTick = (cost / CREEP_LIFE_TIME)
    return actionEnergyPerTick - creepCostPerTick
}

function actionWorkTicks (action, workParts, load) {
    switch (action) {
        case 'pickup':
            return 1
        default:
            return load / (workParts * ACTION_SPEED[action])
    }
}

function calculateJobROI (plan, dist, action = 'build', slots) {
    let creepInfo = creepPlanInfo(plan)
    let funcDist = RANGED_ACTIONS.includes(action) ? Math.max(dist - 3, 0) : dist
    const speed = ticksPerSpace(plan, creepInfo.partCounts)
    const load = CARRY_CAPACITY * creepInfo.partCounts[CARRY]
    let roi = {
        dist: funcDist,
        cost: creepInfo.cost,
        load: load,
        speed: speed,
        travelTicks: (speed.to + speed.from) * funcDist,
        workTicks: actionWorkTicks(action, creepInfo.partCounts[WORK], load)
    }
    roi.loadTicks = roi.workTicks + roi.travelTicks
    roi.creepsPerSlot = roi.loadTicks / roi.workTicks
    roi.max = slots ? Math.floor(roi.slots * roi.creepsPerSlot) : -1
    roi.valuePerCreep = creepValuePerTick(action, roi)
    roi.value = roi.valuePerCreep
    return roi
}
module.exports.calculateJobROI = calculateJobROI
